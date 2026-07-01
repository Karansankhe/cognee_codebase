import os
import asyncio
import logging

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_neo4j import Neo4jVector, Neo4jGraph, GraphCypherQAChain
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_experimental.graph_transformers import LLMGraphTransformer
from app.core.config import settings

logger = logging.getLogger(__name__)


class GraphService:
    def __init__(self):
        os.environ["GROQ_API_KEY"] = settings.groq_api_key

        # ── Embeddings (local, no API call) ──────────────────────────────
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

        # ── LLM (Groq – high-rate-limit model───────────────────────────
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.groq_api_key,
            temperature=0,
        )

        # ── Neo4j graph connection ────────────────────────────────────────
        self.graph = Neo4jGraph(
            url=settings.neo4j_url,
            username=settings.neo4j_username,
            password=settings.neo4j_password,
            database=settings.neo4j_database,
        )

        # ── Allowed ontology ──────────────────────────────────────────────
        self.allowed_nodes = [
            "Symptom", "Trigger", "Medication", "TreatmentOutcome", "LifestyleFactor", "DailyHabit", "Location"
        ]
        self.allowed_relationships = [
            "TRIGGERS", "ALLEVIATES", "CORRELATES_WITH", "PRECEDES", "AFFECTS", "HAS_HABIT"
        ]

        # ── Graph transformer (LLM → Neo4j graph docs) ───────────────────
        self.transformer = LLMGraphTransformer(
            llm=self.llm,
            allowed_nodes=self.allowed_nodes,
            allowed_relationships=self.allowed_relationships,
            node_properties=False,
            relationship_properties=False,
        )

        # ── Cypher generation prompt ──────────────────────────────────────
        cypher_template = """
Task: Generate a Cypher statement to query the graph database.

Instructions:
- Use only the relationship types and node labels provided in the schema.
- Do not include explanations or apologies.
- Return ONLY the Cypher statement, nothing else.

Graph schema:
{schema}

The graph contains nodes: Symptom, Trigger, Medication, TreatmentOutcome, LifestyleFactor.
Relationships: TRIGGERS, ALLEVIATES, CORRELATES_WITH, PRECEDES.

Question: {question}"""

        self.cypher_prompt = PromptTemplate(
            template=cypher_template,
            input_variables=["schema", "question"],
        )

        # ── QA answer prompt ──────────────────────────────────────────────
        qa_template = """You are a medical assistant. Use the graph database results below to answer the question in natural language.

Graph results:
{context}

Question: {question}

Answer:"""

        self.qa_prompt = PromptTemplate(
            template=qa_template,
            input_variables=["context", "question"],
        )

        # ── GraphCypherQAChain ────────────────────────────────────────────
        self.qa_chain = GraphCypherQAChain.from_llm(
            llm=self.llm,
            graph=self.graph,
            cypher_prompt=self.cypher_prompt,
            qa_prompt=self.qa_prompt,
            verbose=True,
            allow_dangerous_requests=True,
            validate_cypher=True,
        )

    # ── PDF ingestion ─────────────────────────────────────────────────────
    async def process_pdf(self, file_path: str, original_filename: str) -> dict:
        logger.info("=" * 60)
        logger.info(f"[UPLOAD] Starting PDF processing: {original_filename}")
        logger.info(f"[UPLOAD] Temp file path: {file_path}")

        # 1. Load & split
        logger.info("[UPLOAD] Step 1/6 — Loading PDF pages...")
        loader = PyPDFLoader(file_path)
        pages = loader.load_and_split()
        logger.info(f"[UPLOAD]   Loaded {len(pages)} raw page(s).")

        logger.info("[UPLOAD] Step 2/6 — Splitting into chunks (size=600, overlap=80)...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
        docs = text_splitter.split_documents(pages)
        logger.info(f"[UPLOAD]   Created {len(docs)} chunk(s).")
        for i, d in enumerate(docs):
            logger.debug(f"[UPLOAD]   Chunk {i+1}: {len(d.page_content)} chars")

        lc_docs = [
            Document(
                page_content=doc.page_content.replace("\n", " "),
                metadata={"source": original_filename},
            )
            for doc in docs
        ]

        # 2. Clear existing graph
        logger.info("[UPLOAD] Step 3/6 — Clearing existing Neo4j graph...")
        self.graph.query("MATCH (n) DETACH DELETE n")
        logger.info("[UPLOAD]   Neo4j graph cleared.")

        # 3. Convert chunks to graph documents via LLM
        logger.info(f"[UPLOAD] Step 4/6 — Extracting graph structure via LLM ({len(lc_docs)} chunks)...")
        logger.info("[UPLOAD]   This may take a minute depending on rate limits.")
        graph_documents = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self.transformer.convert_to_graph_documents(lc_docs),
        )
        total_nodes = sum(len(gd.nodes) for gd in graph_documents)
        total_rels = sum(len(gd.relationships) for gd in graph_documents)
        logger.info(f"[UPLOAD]   LLM extraction complete.")
        logger.info(f"[UPLOAD]   → {len(graph_documents)} graph document(s)")
        logger.info(f"[UPLOAD]   → {total_nodes} node(s) extracted")
        logger.info(f"[UPLOAD]   → {total_rels} relationship(s) extracted")

        # 4. Write to Neo4j
        logger.info("[UPLOAD] Step 5/6 — Writing graph documents to Neo4j...")
        self.graph.add_graph_documents(graph_documents, include_source=True)
        logger.info(f"[UPLOAD]   Successfully wrote {len(graph_documents)} document(s) to Neo4j.")

        # 5. Add unified 'Entity' label for vector indexing
        logger.info("[UPLOAD] Step 6/6 — Tagging nodes with :Entity label & building vector index...")
        for label in self.allowed_nodes:
            result = self.graph.query(f"MATCH (n:{label}) SET n:Entity RETURN count(n) AS tagged")
            count = result[0]['tagged'] if result else 0
            logger.info(f"[UPLOAD]   Tagged {count} :{label} node(s) as :Entity")

        # 6. Build / refresh vector index
        try:
            Neo4jVector.from_existing_graph(
                embedding=self.embeddings,
                url=settings.neo4j_url,
                username=settings.neo4j_username,
                password=settings.neo4j_password,
                database=settings.neo4j_database,
                node_label="Entity",
                text_node_properties=["id"],
                embedding_node_property="embedding",
                index_name="entity_vector_index",
            )
            logger.info("[UPLOAD]   Vector index built/refreshed successfully.")
        except Exception as e:
            logger.warning(f"[UPLOAD]   Vector index skipped (non-fatal): {e}")

        logger.info(f"[UPLOAD] ✓ Finished processing: {original_filename}")
        logger.info(f"[UPLOAD]   Summary → chunks={len(lc_docs)}, nodes={total_nodes}, relationships={total_rels}")
        logger.info("=" * 60)
        return {
            "status": "success",
            "message": f"{original_filename} processed successfully.",
            "chunks": len(lc_docs),
            "nodes": total_nodes,
            "relationships": total_rels,
            "graph_documents": len(graph_documents),
        }

    # ── Graph query ───────────────────────────────────────────────────────
    async def query(self, question: str) -> dict:
        logger.info("-" * 60)
        logger.info(f"[QUERY] Received question: '{question}'")

        try:
            logger.info("[QUERY] Attempting GraphCypherQAChain...")
            res = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.qa_chain.invoke({"query": question}),
            )
            answer = res.get("result", "")
            logger.info(f"[QUERY] ✓ GraphCypherQAChain succeeded ({len(answer)} chars).")
        except Exception as e:
            logger.warning(f"[QUERY] GraphCypherQAChain failed: {e}")
            logger.info("[QUERY] Falling back to direct LLM call...")
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.llm.invoke([HumanMessage(content=question)]),
            )
            answer = response.content
            logger.info(f"[QUERY] ✓ LLM fallback succeeded ({len(answer)} chars).")

        logger.info("-" * 60)
        return {"graph_answer": answer}

    # ── Visit summary ─────────────────────────────────────────────────────
    async def generate_visit_summary(self) -> str:
        logger.info("=" * 60)
        logger.info("[SUMMARY] Generating Doctor-Ready Visit Summary...")

        # Pull structured data directly from the graph (avoids LLM hallucination)
        try:
            rows = self.graph.query(
                """
                MATCH (n)
                WHERE n:Symptom OR n:Trigger OR n:Medication
                   OR n:TreatmentOutcome OR n:LifestyleFactor
                OPTIONAL MATCH (n)-[r]->(m)
                RETURN labels(n) AS type, n.id AS name,
                       type(r) AS relationship, m.id AS related_to
                LIMIT 200
                """
            )
            graph_context = str(rows) if rows else "No structured data available."
        except Exception as e:
            logger.error(f"Graph query failed for summary: {e}")
            graph_context = "No structured data available."

        # Use Groq Llama to synthesise the summary (Gemini key may be invalid)
        sys_msg = SystemMessage(
            content=(
                "You are a professional medical assistant. "
                "Create a 'Doctor-Ready Visit Summary' with sections: "
                "Patient Overview, Symptoms, Triggers, Medications, "
                "Lifestyle Factors, Treatment Outcomes."
            )
        )
        hum_msg = HumanMessage(
            content=(
                f"Generate the visit summary from the following graph data:\n\n"
                f"{graph_context}"
            )
        )

        # Try Gemini first, fall back to Groq
        gemini_api_key = settings.gemini_api_key
        if gemini_api_key:
            try:
                gemini_llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=gemini_api_key,
                    temperature=0.2,
                )
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: gemini_llm.invoke([sys_msg, hum_msg]),
                )
                logger.info("Summary generated with Gemini.")
                return response.content
            except Exception as e:
                logger.warning(f"Gemini failed ({e}), falling back to Groq.")

        # Groq fallback
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self.llm.invoke([sys_msg, hum_msg]),
        )
        logger.info("Summary generated with Groq.")
        return response.content


# Singleton
graph_service = GraphService()
