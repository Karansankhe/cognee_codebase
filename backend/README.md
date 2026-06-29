# Graphy FastAPI Backend

This is the production-ready FastAPI backend for the Realtime GraphRAG App.

## Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the `backend` directory with your API keys:
```env
GROQ_API_KEY=your_groq_api_key
NEO4J_URL=neo4j+s://806d341e.databases.neo4j.io
NEO4J_USERNAME=806d341e
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=806d341e
```

## Running the Server

Run the FastAPI application with Uvicorn:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. You can access the interactive Swagger documentation at `http://localhost:8000/docs`.

## API Endpoints

- `GET /api/v1/health`: Check server health.
- `POST /api/v1/upload`: Upload a PDF file to process into the graph database.
- `POST /api/v1/query`: Send a natural language query and receive a natural language answer based on the graph ontology.
