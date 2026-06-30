import tempfile
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.graph_service import graph_service

logger = logging.getLogger(__name__)

router = APIRouter()

class QueryRequest(BaseModel):
    question: str

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Received file upload request for: {file.filename}")
    if not file.filename.endswith('.pdf'):
        logger.warning(f"Rejected file {file.filename}: Not a PDF.")
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        result = await graph_service.process_pdf(tmp_path, file.filename)
        logger.info(f"File {file.filename} processed successfully.")
        return result
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_graph(req: QueryRequest):
    logger.info(f"Received query request: '{req.question}'")
    try:
        answer_dict = await graph_service.query(req.question)
        logger.info(f"Query '{req.question}' resolved successfully.")
        return answer_dict
    except Exception as e:
        logger.error(f"Error processing query '{req.question}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/generate_summary")
async def generate_summary():
    logger.info("Received request to generate visit summary.")
    try:
        summary = await graph_service.generate_visit_summary()
        logger.info("Visit summary generated successfully.")
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Error generating visit summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
