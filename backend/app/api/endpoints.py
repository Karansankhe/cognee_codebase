import os
import tempfile
import shutil
import logging
import time
import asyncio
from typing import Optional, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.graph_service import graph_service
from app.services.insights_service import insights_service

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    live_context: Optional[dict] = None

class InsightsPDFRequest(BaseModel):
    description: Optional[Any] = ""
    detailed_report: Optional[Any] = ""
    weekly_plan: Optional[Any] = ""
    trends: Optional[list] = []

class SummaryPDFRequest(BaseModel):
    summary: str

class SymptomLogRequest(BaseModel):
    symptom_name: str
    logged_at: str
    severity: str = ""
    notes: str = ""

class OutcomeLogRequest(BaseModel):
    treatment: str
    result: str
    follow_up_notes: str = ""

@router.get("/health")
def health_check():
    logger.info("[HEALTH] Health check called → healthy")
    return {"status": "healthy"}


# Supported file types (Cognee Cloud accepts all of these)
SUPPORTED_EXTENSIONS = {"pdf", "txt", "csv", "json", "md", "docx"}

@router.get("/sample-report")
async def download_sample_report():
    """Serve the built-in sample patient report for testing."""
    import pathlib
    report_path = pathlib.Path(__file__).parent.parent.parent / "sample_patient_report.txt"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Sample report not found.")
    return FileResponse(
        path=str(report_path),
        filename="sample_patient_report.txt",
        media_type="text/plain",
    )


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info("=" * 60)
    logger.info(f"[UPLOAD] Incoming file: '{file.filename}' | content-type: {file.content_type}")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        logger.warning(f"[UPLOAD] Rejected '{file.filename}': unsupported type '{ext}'.")
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '.{ext}'. "
                f"Supported types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )

    tmp_path = None
    try:
        suffix = f".{ext}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            tmp_size = os.path.getsize(tmp_path)

        logger.info(f"[UPLOAD] Saved to temp: {tmp_path} ({tmp_size / 1024:.1f} KB)")

        t0 = time.perf_counter()
        result = await graph_service.process_pdf(tmp_path, file.filename)
        elapsed = time.perf_counter() - t0

        logger.info(f"[UPLOAD] ✓ Completed in {elapsed:.1f}s → {result}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPLOAD] ✗ Failed processing '{file.filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
                logger.debug(f"[UPLOAD] Temp file removed: {tmp_path}")
            except Exception:
                pass


class OnboardingQuizAnswers(BaseModel):
    answers: list

@router.post("/onboarding/remember")
async def remember_onboarding(req: OnboardingQuizAnswers):
    logger.info("[ONBOARDING] Remembering onboarding answers...")
    try:
        report = "Patient Onboarding Quiz Baseline Survey\n"
        report += "========================================\n\n"
        answers_dict = {}
        for idx, qa in enumerate(req.answers):
            q_text = qa.get("question", "")
            a_text = qa.get("answer", "No answer provided")
            report += f"Q{idx+1}: {q_text}\n"
            report += f"A{idx+1}: {a_text}\n\n"
            
            # Map key lifestyle questions for the narrative
            if "sleep" in q_text.lower():
                answers_dict["sleep"] = a_text
            elif "water" in q_text.lower() or "hydration" in q_text.lower():
                answers_dict["water"] = a_text
            elif "exercise" in q_text.lower():
                answers_dict["exercise"] = a_text
            elif "trigger" in q_text.lower():
                answers_dict["trigger"] = a_text

        # Add explicit clinical narrative to guarantee Cognee extracts LifestyleFactors
        report += "CLINICAL LIFESTYLE FACTORS & HABITS NARRATIVE\n"
        report += "---------------------------------------------\n"
        if "sleep" in answers_dict:
            report += f"The patient's average sleep duration is a lifestyle factor: {answers_dict['sleep']}.\n"
        if "water" in answers_dict:
            report += f"The patient's daily water intake is a lifestyle factor: {answers_dict['water']}.\n"
        if "exercise" in answers_dict:
            report += f"The patient's exercise routine is a lifestyle factor: {answers_dict['exercise']}.\n"
        if "trigger" in answers_dict:
            report += f"The suspected symptom trigger is: {answers_dict['trigger']}.\n"
        report += "These lifestyle factors are documented as affecting the patient's health and correlate with symptoms.\n\n"

        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt", encoding="utf-8") as tmp:
            tmp.write(report)
            tmp_path = tmp.name
        
        # Process with Cognee RAG
        logger.info(f"[ONBOARDING] Ingesting survey file: {tmp_path}")
        await graph_service.process_pdf(tmp_path, "patient_onboarding_survey.txt")
        os.unlink(tmp_path)
        # Explicit memify enrichment for the onboarding quiz baseline survey data run in background
        asyncio.create_task(graph_service.memify(data=report))
        return {"status": "success"}
    except Exception as e:
        logger.error(f"[ONBOARDING] Failed to save survey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_graph(req: QueryRequest):
    logger.info(f"[QUERY] Incoming question: '{req.question}'")

    try:
        t0 = time.perf_counter()
        answer_dict = await graph_service.query(req.question)
        graph_answer = answer_dict.get("graph_answer", "")
        elapsed = time.perf_counter() - t0

        if req.live_context:
            # Clean and limit wearable metrics to prevent token overflow on Groq
            metrics = req.live_context.get("synced_metrics", [])
            if isinstance(metrics, list) and len(metrics) > 5:
                req.live_context["synced_metrics"] = metrics[-5:]

            from langchain_core.messages import SystemMessage, HumanMessage
            import json
            sys_msg = SystemMessage(
                content=(
                    "You are a medical AI assistant. Combine the historical knowledge graph answer with the current "
                    "real-time patient status (live context) to answer the user's question. "
                    "Be precise, professional, and prioritize live metrics (heart rate, steps, recovery, sleep today, location) "
                    "if the question is about current status, while using the graph for historical queries. "
                    "If the live context is empty or doesn't contain relevant info, rely on the graph answer."
                )
            )
            hum_msg = HumanMessage(
                content=(
                    f"User Question: {req.question}\n\n"
                    f"Historical Knowledge Graph Answer: {graph_answer}\n\n"
                    f"Current Live Context:\n{json.dumps(req.live_context, indent=2)}\n\n"
                    "Provide a clean, natural, and helpful clinical response."
                )
            )
            try:
                response = insights_service.llm.invoke([sys_msg, hum_msg])
                synthesized_answer = response.content.strip()
                return {"graph_answer": synthesized_answer}
            except Exception as llm_e:
                logger.error(f"[QUERY] LLM synthesis failed: {llm_e}")
                return {"graph_answer": graph_answer}

        answer_preview = str(graph_answer)[:120]
        logger.info(f"[QUERY] ✓ Answered in {elapsed:.1f}s | preview: '{answer_preview}...'")
        return {"graph_answer": graph_answer}

    except Exception as e:
        logger.error(f"[QUERY] ✗ Error for '{req.question}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate_summary")
async def generate_summary():
    logger.info("[SUMMARY] Summary generation requested.")

    try:
        t0 = time.perf_counter()
        summary = await graph_service.generate_visit_summary()
        elapsed = time.perf_counter() - t0

        logger.info(f"[SUMMARY] ✓ Generated in {elapsed:.1f}s ({len(summary)} chars).")
        return {"summary": summary}

    except Exception as e:
        logger.error(f"[SUMMARY] ✗ Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/log-symptom")
async def log_symptom_endpoint(req: SymptomLogRequest):
    logger.info(f"[LOG_SYMPTOM] Request received: {req.symptom_name}")
    try:
        result = await graph_service.log_symptom(
            symptom_name=req.symptom_name,
            logged_at=req.logged_at,
            severity=req.severity,
            notes=req.notes
        )
        return result
    except Exception as e:
        logger.error(f"[LOG_SYMPTOM] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/log-outcome")
async def log_outcome_endpoint(req: OutcomeLogRequest):
    logger.info(f"[LOG_OUTCOME] Request received: {req.treatment}")
    try:
        result = await graph_service.log_outcome(
            treatment=req.treatment,
            result=req.result,
            follow_up_notes=req.follow_up_notes
        )
        return result
    except Exception as e:
        logger.error(f"[LOG_OUTCOME] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cognify")
async def trigger_cognify():
    logger.info("[COGNIFY] Cognify request received.")
    try:
        result = await graph_service.cognify()
        return result
    except Exception as e:
        logger.error(f"[COGNIFY] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insights")
async def generate_insights(
    location: str = Form(...),
    water_intake: str = Form(...),
    sleep_amount: str = Form(...),
    other_habits: str = Form(...)
):
    logger.info(f"[INSIGHTS] Request for {location}")
    try:
        insights = await insights_service.generate_insights(location, water_intake, sleep_amount, other_habits)
        return insights
    except Exception as e:
        logger.error(f"[INSIGHTS] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wearable/sync")
async def sync_wearable():
    logger.info("[WEARABLE] Sync requested.")
    try:
        pattern = await insights_service.generate_wearable_pattern()
        return pattern
    except Exception as e:
        logger.error(f"[WEARABLE] Error generating wearable pattern: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def clean_pdf_text(text: str) -> str:
    if not text:
        return ""
    # Map common unicode characters that FPDF's default fonts can't encode to ASCII/Latin-1
    replacements = {
        "→": "->",
        "•": "-",
        "…": "...",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "–": "-",
        "—": "-",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "replace").decode("latin-1")

@router.post("/insights/pdf")
async def download_insights_pdf(req: InsightsPDFRequest):
    try:
        from fpdf import FPDF, XPos, YPos
        
        class PDF(FPDF):
            def header(self):
                self.set_font('Helvetica', 'B', 20)
                self.set_text_color(33, 37, 41)
                self.cell(0, 15, 'Pulse Insights Report', 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
                self.set_draw_color(216, 251, 100) # Pulse green/yellow
                self.set_line_width(1)
                self.line(10, 25, 200, 25)
                self.ln(10)
                
            def chapter_title(self, title):
                self.set_font('Helvetica', 'B', 14)
                self.set_fill_color(240, 248, 255)
                self.cell(0, 10, clean_pdf_text(title), 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L', fill=True)
                self.ln(4)
                
            def chapter_body(self, body):
                self.set_font('Helvetica', '', 11)
                self.set_text_color(50, 50, 50)
                self.multi_cell(0, 7, clean_pdf_text(body))
                self.ln(6)

        def stringify_field(val: Any) -> str:
            if not val:
                return ""
            if isinstance(val, dict):
                lines = []
                for k, v in val.items():
                    if isinstance(v, dict):
                        lines.append(f"{k}:")
                        for sub_k, sub_v in v.items():
                            lines.append(f"  - {sub_k}: {sub_v}")
                    else:
                        lines.append(f"{k}: {v}")
                return "\n".join(lines)
            if isinstance(val, list):
                return "\n".join(str(x) for x in val)
            return str(val)

        desc = stringify_field(req.description)
        report = stringify_field(req.detailed_report)
        plan = stringify_field(req.weekly_plan)

        pdf = PDF()
        pdf.add_page()
        
        # Summary
        pdf.chapter_title("Key Insight")
        pdf.chapter_body(desc)
        
        # Detailed Report
        if report:
            pdf.chapter_title("Detailed Analysis")
            pdf.chapter_body(report)
            
        # Weekly Plan
        if plan:
            pdf.chapter_title("Actionable Weekly Plan")
            pdf.chapter_body(plan)
        
        # Trends
        pdf.chapter_title("Temporal Trends Breakdown")
        pdf.set_font('Helvetica', '', 11)
        if req.trends:
            for t in req.trends:
                label = clean_pdf_text(str(t.get('label', '')))
                text = clean_pdf_text(str(t.get('text', '')))
                val = t.get('value', 0)
                
                # Simple bar visualization using background colors
                pdf.set_fill_color(216, 251, 100)
                pdf.cell(50, 8, label, 0, new_x=XPos.RIGHT, new_y=YPos.TOP)
                # draw bar
                bar_width = val
                pdf.cell(bar_width, 8, "", 0, new_x=XPos.RIGHT, new_y=YPos.TOP, align='L', fill=True)
                pdf.cell(100 - bar_width, 8, "", 0, new_x=XPos.RIGHT, new_y=YPos.TOP)
                pdf.cell(40, 8, f"{text} ({val})", 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        pdf.ln(10)
        
        import tempfile
        import os
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()
        pdf.output(tmp.name)
        
        return FileResponse(
            path=tmp.name,
            filename="insights.pdf",
            media_type="application/pdf",
            background=None
        )
    except Exception as e:
        logger.error(f"[INSIGHTS PDF] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/summary/pdf")
async def download_summary_pdf(req: SummaryPDFRequest):
    try:
        from fpdf import FPDF, XPos, YPos
        import re
        
        class PDF(FPDF):
            def header(self):
                self.set_font('Helvetica', 'B', 16)
                self.set_text_color(18, 53, 60) # Dark teal
                self.cell(0, 10, 'Pulse Medical Record Summary', 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
                self.set_font('Helvetica', 'I', 9)
                self.set_text_color(110, 110, 110)
                self.cell(0, 5, 'Doctor-Ready Visit Summary (Generated via Cognee GraphRAG)', 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
                self.set_draw_color(18, 53, 60)
                self.set_line_width(0.5)
                self.line(10, 26, 200, 26)
                self.ln(10)
                
            def footer(self):
                self.set_y(-15)
                self.set_font('Helvetica', 'I', 8)
                self.set_text_color(150, 150, 150)
                self.cell(0, 10, f'Page {self.page_no()}', 0, new_x=XPos.RIGHT, new_y=YPos.TOP, align='C')
                
            def section_header(self, title):
                self.set_font('Helvetica', 'B', 12)
                self.set_text_color(18, 53, 60)
                self.set_fill_color(230, 245, 235) # Light mint background
                self.cell(0, 8, clean_pdf_text(title), 0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L', fill=True)
                self.ln(3)
                
            def section_body(self, text):
                self.set_font('Helvetica', '', 10)
                self.set_text_color(60, 60, 60)
                self.multi_cell(0, 6, clean_pdf_text(text))
                self.ln(5)

        pdf = PDF()
        pdf.add_page()
        
        raw_text = req.summary
        pattern = r'(?=\n\*\*[^*]+\*\*)'
        sections = re.split(pattern, "\n" + raw_text)
        
        has_content = False
        for sec in sections:
            sec = sec.strip()
            if not sec:
                continue
            
            lines = sec.split('\n', 1)
            title = lines[0].replace('**', '').strip()
            body = lines[1].strip() if len(lines) > 1 else ""
            
            if title and body:
                pdf.section_header(title)
                pdf.section_body(body)
                has_content = True
                
        if not has_content:
            pdf.section_header("Patient History Summary")
            pdf.section_body(raw_text)

        import tempfile
        import os
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()
        pdf.output(tmp.name)
        
        return FileResponse(
            path=tmp.name,
            filename="patient_visit_summary.pdf",
            media_type="application/pdf",
            background=None
        )
    except Exception as e:
        logger.error(f"[SUMMARY PDF] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/graph")
async def get_graph():
    """Return nodes and relationships from Cognee Cloud for graph visualization."""
    logger.info("[GRAPH] Fetching graph data from Cognee Cloud...")
    try:
        graph_data = await graph_service.get_graph_data()
        logger.info(
            f"[GRAPH] ✓ {len(graph_data['nodes'])} node(s), "
            f"{len(graph_data['links'])} relationship(s)."
        )
        return graph_data
    except Exception as e:
        logger.error(f"[GRAPH] ✗ Error fetching graph: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None

from app.services.elevenlabs_service import elevenlabs_service
from fastapi.responses import StreamingResponse
import io

@router.post("/text-to-speech")
async def text_to_speech_endpoint(req: TTSRequest):
    try:
        audio_data = await elevenlabs_service.text_to_speech(req.text, req.voice_id)
        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/mpeg")
    except ValueError as val_e:
        raise HTTPException(status_code=400, detail=str(val_e))
    except Exception as e:
        if "402" in str(e):
            raise HTTPException(status_code=402, detail="ElevenLabs character quota exhausted (402 Payment Required). Please verify your account limits or plan.")
        logger.error(f"[TTS] Error generating speech: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speech-to-text")
async def speech_to_text_endpoint(file: UploadFile = File(...)):
    try:
        audio_content = await file.read()
        transcription = await elevenlabs_service.transcribe_audio(audio_content, file.filename)
        return {"text": transcription}
    except Exception as e:
        logger.error(f"[STT] Error transcribing speech: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

