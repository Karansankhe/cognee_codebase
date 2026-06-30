import os
import tempfile
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_neo4j import Neo4jVector, Neo4jGraph, GraphCypherQAChain
from langchain_groq import ChatGroq
from langchain_experimental.graph_transformers import LLMGraphTransformer
from app.core.config import settings

class GraphService:
    def __init__(self):
        # Set Groq API key in environment for LangChain
        os.environ['GROQ_API_KEY'] = settings.groq_api_key
        
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

    def process_pdf(self, file_path: str, original_filename: str):
        loader = PyPDFLoader(file_path)
        pages = loader.load_and_split()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=40)
        docs = text_splitter.split_documents(pages)

        lc_docs = []
        for doc in docs:
            lc_docs.append(Document(
                page_content=doc.page_content.replace("\n", ""),
                metadata={'source': original_filename}
            ))

        # Clear the graph database
        self.graph.query("MATCH (n) DETACH DELETE n;")

        graph_documents = self.transformer.convert_to_graph_documents(lc_docs)
        self.graph.add_graph_documents(graph_documents, include_source=True)

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
        return {"status": "success", "message": f"{original_filename} processed successfully."}

    def query(self, question: str) -> str:
        try:
            res = self.qa_chain.invoke({"query": question})
            return res['result']
        except Exception as e:
            # Fallback for when the LLM refuses to generate a Cypher query (e.g. for general questions)
            from langchain_core.messages import HumanMessage
            response = self.llm.invoke([HumanMessage(content=question)])
            return response.content

# Singleton instance
graph_service = GraphService()
