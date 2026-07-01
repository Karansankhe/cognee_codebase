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
    trends: list

@router.get("/health")
def health_check():
    logger.info("[HEALTH] Health check called → healthy")
    return {"status": "healthy"}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info("=" * 60)
    logger.info(f"[UPLOAD] Incoming file: '{file.filename}' | content-type: {file.content_type}")

    if not file.filename.endswith(".pdf"):
        logger.warning(f"[UPLOAD] Rejected '{file.filename}': not a PDF.")
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # Write to a temp file so PyPDFLoader can read it from disk
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
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
        # Clean up temp file
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

@router.post("/insights/pdf")
async def download_insights_pdf(req: InsightsPDFRequest):
    try:
        from fpdf import FPDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=16)
        pdf.cell(200, 10, txt="Temporal Trends & Insights", ln=1, align="C")
        
        pdf.set_font("Arial", size=12)
        pdf.ln(10)
        pdf.multi_cell(0, 10, txt=f"Insight: {req.description}")
        
        pdf.ln(10)
        pdf.cell(200, 10, txt="Trends Breakdown:", ln=1)
        for t in req.trends:
            pdf.cell(200, 10, txt=f"- {t.get('label', '')}: {t.get('text', '')} (Score: {t.get('value', 0)})", ln=1)
            
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
    """Return all nodes and relationships from Neo4j for graph visualization."""
    logger.info("[GRAPH] Fetching full graph from Neo4j...")
    try:
        nodes_result = graph_service.graph.query(
            """
            MATCH (n)
            WHERE NOT n:_Bloom_Perspective_ AND NOT n:Document
            RETURN
                id(n) AS id,
                labels(n) AS labels,
                n.id AS name,
                n.text AS text
            LIMIT 200
            """
        )
        rels_result = graph_service.graph.query(
            """
            MATCH (a)-[r]->(b)
            WHERE NOT a:_Bloom_Perspective_ AND NOT b:_Bloom_Perspective_
              AND NOT a:Document AND NOT b:Document
            RETURN
                id(a) AS source,
                id(b) AS target,
                type(r) AS rel_type,
                id(r) AS id
            LIMIT 500
            """
        )

        nodes = [
            {
                "id": str(row["id"]),
                "label": (row["labels"][0] if row["labels"] else "Node"),
                "name": row["name"] or row["text"] or f"Node {row['id']}",
            }
            for row in nodes_result
        ]
        links = [
            {
                "id": str(row["id"]),
                "source": str(row["source"]),
                "target": str(row["target"]),
                "type": row["rel_type"],
            }
            for row in rels_result
        ]

        logger.info(f"[GRAPH] ✓ {len(nodes)} node(s), {len(links)} relationship(s).")
        return {"nodes": nodes, "links": links}

    except Exception as e:
        logger.error(f"[GRAPH] ✗ Error fetching graph: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

