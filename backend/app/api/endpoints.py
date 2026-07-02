import os
import tempfile
import shutil
import logging
import time
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.graph_service import graph_service
from app.services.insights_service import insights_service

logger = logging.getLogger(__name__)

router = APIRouter()

class QueryRequest(BaseModel):
    question: str

class InsightsPDFRequest(BaseModel):
    description: str
    detailed_report: str = ""
    weekly_plan: str = ""
    trends: list

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


@router.post("/query")
async def query_graph(req: QueryRequest):
    logger.info(f"[QUERY] Incoming question: '{req.question}'")

    try:
        t0 = time.perf_counter()
        answer_dict = await graph_service.query(req.question)
        elapsed = time.perf_counter() - t0

        answer_preview = str(answer_dict.get("graph_answer", ""))[:120]
        logger.info(f"[QUERY] ✓ Answered in {elapsed:.1f}s | preview: '{answer_preview}...'")
        return answer_dict

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

@router.post("/insights/pdf")
async def download_insights_pdf(req: InsightsPDFRequest):
    try:
        from fpdf import FPDF
        
        class PDF(FPDF):
            def header(self):
                self.set_font('Arial', 'B', 20)
                self.set_text_color(33, 37, 41)
                self.cell(0, 15, 'Pulse Insights Report', 0, 1, 'C')
                self.set_draw_color(216, 251, 100) # Pulse green/yellow
                self.set_line_width(1)
                self.line(10, 25, 200, 25)
                self.ln(10)
                
            def chapter_title(self, title):
                self.set_font('Arial', 'B', 14)
                self.set_fill_color(240, 248, 255)
                self.cell(0, 10, title, 0, 1, 'L', 1)
                self.ln(4)
                
            def chapter_body(self, body):
                self.set_font('Arial', '', 11)
                self.set_text_color(50, 50, 50)
                # handle utf-8 by encoding and decoding
                body = body.encode('latin-1', 'replace').decode('latin-1')
                self.multi_cell(0, 7, body)
                self.ln(6)

        pdf = PDF()
        pdf.add_page()
        
        # Summary
        pdf.chapter_title("Key Insight")
        pdf.chapter_body(req.description)
        
        # Detailed Report
        if req.detailed_report:
            pdf.chapter_title("Detailed Analysis")
            pdf.chapter_body(req.detailed_report)
            
        # Weekly Plan
        if req.weekly_plan:
            pdf.chapter_title("Actionable Weekly Plan")
            pdf.chapter_body(req.weekly_plan)
        
        # Trends
        pdf.chapter_title("Temporal Trends Breakdown")
        pdf.set_font('Arial', '', 11)
        for t in req.trends:
            label = str(t.get('label', ''))
            text = str(t.get('text', ''))
            val = t.get('value', 0)
            
            # Simple bar visualization using background colors
            pdf.set_fill_color(216, 251, 100)
            pdf.cell(50, 8, label, 0, 0)
            # draw bar
            bar_width = val
            pdf.cell(bar_width, 8, "", 0, 0, 'L', 1)
            pdf.cell(100 - bar_width, 8, "", 0, 0)
            pdf.cell(40, 8, f"{text} ({val})", 0, 1)
        
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

