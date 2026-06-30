import os
import tempfile
import asyncio
import logging

# Set Cognee data directories before importing cognee to avoid sqlite permission/path issues in .venv
os.environ["DATA_DIR"] = os.path.abspath("./.cognee_system")
os.environ["COGNEE_SYSTEM_DIR"] = os.path.abspath("./.cognee_system")

import cognee
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_neo4j import Neo4jVector, Neo4jGraph, GraphCypherQAChain
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_experimental.graph_transformers import LLMGraphTransformer
from app.core.config import settings

logger = logging.getLogger(__name__)

class GraphService:
    def __init__(self):
        # Set Groq API key in environment for LangChain
        os.environ['GROQ_API_KEY'] = settings.groq_api_key
        # For Cognee (if supported)
        os.environ['LLM_API_KEY'] = settings.groq_api_key
        
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.llm = ChatGroq(
            model="openai/gpt-oss-120b",
            groq_api_key=settings.groq_api_key,
            temperature=0
        )
        
        self.graph = Neo4jGraph(
            url=settings.neo4j_url,
            username=settings.neo4j_username,
            password=settings.neo4j_password,
            database=settings.neo4j_database
        )
        
        self.allowed_nodes = ["Symptom", "Trigger", "Medication", "TreatmentOutcome", "LifestyleFactor"]
        self.allowed_relationships = ["TRIGGERS", "ALLEVIATES", "CORRELATES_WITH", "PRECEDES"]
        
        self.transformer = LLMGraphTransformer(
            llm=self.llm,
            allowed_nodes=self.allowed_nodes,
            allowed_relationships=self.allowed_relationships,
            node_properties=False,
            relationship_properties=False
        )

        template = """
        Task: Generate a Cypher statement to query the graph database for a medical/lifestyle ontology.

        Instructions:
        Use only relationship types and properties provided in schema.
        Do not use other relationship types or properties that are not provided.
        
        The graph contains nodes like Symptom, Trigger, Medication, TreatmentOutcome, LifestyleFactor.
        The relationships are TRIGGERS, ALLEVIATES, CORRELATES_WITH, PRECEDES.

        schema:
        {schema}

        Note: Do not include explanations or apologies in your answers.
        Do not answer questions that ask anything other than creating Cypher statements.
        Do not include any text other than generated Cypher statements.

        Question: {question}"""

        self.cypher_prompt = PromptTemplate(
            template=template,
            input_variables=["schema", "question"]
        )

        qa_template = """You are an assistant that takes the results of a Graph Database query and forms a natural language response.
        
        Information from database:
        {context}
        
        Question: {question}
        
        Helpful Answer:"""
        self.qa_prompt = PromptTemplate(
            template=qa_template,
            input_variables=["context", "question"]
        )

        self.qa_chain = GraphCypherQAChain.from_llm(
            llm=self.llm,
            graph=self.graph,
            cypher_prompt=self.cypher_prompt,
            qa_prompt=self.qa_prompt,
            verbose=True,
            allow_dangerous_requests=True,
            validate_cypher=True
        )

    async def process_pdf(self, file_path: str, original_filename: str):
        logger.info(f"Starting PDF processing for file: {original_filename}")
        loader = PyPDFLoader(file_path)
        pages = loader.load_and_split()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=40)
        docs = text_splitter.split_documents(pages)
        logger.info(f"Split PDF into {len(docs)} document chunks.")

        lc_docs = []
        full_text = ""
        for doc in docs:
            cleaned = doc.page_content.replace("\n", "")
            full_text += cleaned + " "
            lc_docs.append(Document(
                page_content=cleaned,
                metadata={'source': original_filename}
            ))

        # Add to Cognee memory layer
        try:
            logger.info("Ingesting text into Cognee memory layer...")
            await cognee.remember(full_text)
            logger.info("Successfully added to Cognee memory layer.")
        except Exception as e:
            logger.error(f"Error with cognee.remember: {e}", exc_info=True)

        # Clear the graph database
        logger.info("Clearing Neo4j graph database...")
        self.graph.query("MATCH (n) DETACH DELETE n;")

        logger.info("Transforming documents to Neo4j Graph format...")
        graph_documents = self.transformer.convert_to_graph_documents(lc_docs)
        self.graph.add_graph_documents(graph_documents, include_source=True)
        logger.info(f"Added {len(graph_documents)} graph documents to Neo4j.")

        # Add a common 'Entity' label to all allowed node types for unified vector indexing
        for label in self.allowed_nodes:
            self.graph.query(f"MATCH (n:{label}) SET n:Entity")

        index = Neo4jVector.from_existing_graph(
            embedding=self.embeddings,
            url=settings.neo4j_url,
            username=settings.neo4j_username,
            password=settings.neo4j_password,
            database=settings.neo4j_database,
            node_label="Entity",
            text_node_properties=["id", "text"],
            embedding_node_property="embedding",
            index_name="vector_index",
            keyword_index_name="entity_index",
            search_type="hybrid"
        )
        logger.info(f"Finished processing PDF: {original_filename}")
        return {"status": "success", "message": f"{original_filename} processed successfully."}

    async def query(self, question: str) -> dict:
        logger.info(f"Received query: '{question}'")
        
        graph_result = ""
        try:
            logger.debug("Executing GraphCypherQAChain...")
            res = self.qa_chain.invoke({"query": question})
            graph_result = res['result']
            logger.info(f"Graph RAG response length: {len(graph_result)} characters")
        except Exception as e:
            logger.warning(f"GraphCypherQAChain failed, falling back to LLM. Error: {e}")
            # Fallback for when the LLM refuses to generate a Cypher query (e.g. for general questions)
            from langchain_core.messages import HumanMessage
            response = self.llm.invoke([HumanMessage(content=question)])
            graph_result = response.content
            logger.info(f"LLM fallback response length: {len(graph_result)} characters")

        cognee_result = ""
        try:
            logger.debug("Recalling from Cognee memory layer...")
            results = await cognee.recall(query_text=question)
            if results:
                cognee_result = " ".join([r.text if hasattr(r, 'text') else str(r) for r in results])
                logger.info(f"Cognee recall returned {len(results)} items (Total text length: {len(cognee_result)} characters)")
            else:
                logger.info("Cognee recall returned no results.")
        except Exception as e:
            logger.error(f"Error with cognee.recall: {e}", exc_info=True)
            cognee_result = "Could not retrieve from memory layer."

        logger.info("Query processing complete.")
        return {
            "graph_answer": graph_result,
            "memory_answer": cognee_result
        }

    async def generate_visit_summary(self) -> str:
        logger.info("Generating Doctor-Ready Visit Summary...")
        
        # 1. Gather context from Graph QA
        try:
            logger.debug("Gathering graph context for summary using a direct Cypher query...")
            # We use a direct Cypher query to reliably get all context and avoid LLM parameter hallucination
            direct_query = """
            MATCH (n) 
            WHERE n:Symptom OR n:Trigger OR n:Medication OR n:TreatmentOutcome OR n:LifestyleFactor
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN labels(n) AS type, n.id AS name, type(r) AS relationship, m.id AS related_to
            LIMIT 200
            """
            res = self.graph.query(direct_query)
            graph_context = str(res)
            if not res:
                graph_context = "No structured data available."
        except Exception as e:
            logger.error(f"Failed to gather graph context for summary: {e}")
            graph_context = "No structured data available."
            
        # 2. Gather context from Cognee
        try:
            logger.debug("Gathering cognee memory context for summary...")
            cognee_results = await cognee.recall(query_text=question)
            if cognee_results:
                cognee_context = " ".join([r.text if hasattr(r, 'text') else str(r) for r in cognee_results])
            else:
                cognee_context = "No unstructured memory available."
        except Exception as e:
            logger.error(f"Failed to gather cognee context for summary: {e}")
            cognee_context = ""
            
        # 3. Use Gemini to generate the final summary
        from langchain_core.messages import HumanMessage, SystemMessage
        sys_msg = SystemMessage(content="You are a professional medical assistant tasked with creating a 'Doctor-Ready Visit Summary' for a patient. Format the output professionally with clear headings such as Patient Overview, Symptoms, Triggers, Medications, Lifestyle Factors, and Treatment Outcomes.")
        hum_msg = HumanMessage(content=f"Please generate the visit summary using the following aggregated patient data:\n\n### Structured Graph Data ###\n{graph_context}\n\n### Unstructured Memory Data ###\n{cognee_context}")
        
        try:
            logger.debug("Invoking Gemini LLM to synthesize final summary...")
            
            gemini_api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
            if not gemini_api_key:
                logger.error("Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.")
                return "Error: Gemini API key is missing. Please configure GEMINI_API_KEY."
                
            gemini_llm = ChatGoogleGenerativeAI(
                model="gemini-3.1-pro-preview",
                google_api_key=gemini_api_key,
                temperature=0.2
            )
            
            response = gemini_llm.invoke([sys_msg, hum_msg])
            logger.info("Successfully generated Doctor-Ready Visit Summary with Gemini.")
            return response.content
        except Exception as e:
            logger.error(f"Error invoking Gemini for summary generation: {e}", exc_info=True)
            raise

# Singleton instance
graph_service = GraphService()
