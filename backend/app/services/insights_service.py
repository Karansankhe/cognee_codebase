import json
import logging
from duckduckgo_search import DDGS
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings
from app.services.graph_service import graph_service
import tempfile
import os

logger = logging.getLogger(__name__)

class InsightsService:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.groq_api_key,
            temperature=0,
        )

    async def generate_insights(self, location: str, water_intake: str, sleep_amount: str, other_habits: str):
        # 1. Search for seasonal and climate events based on location
        query = f"current season weather climate events trends in {location}"
        logger.info(f"[INSIGHTS] Searching DuckDuckGo for: {query}")
        
        try:
            results = DDGS().text(query, max_results=3)
            search_context = "\n".join([r['body'] for r in results])
        except Exception as e:
            logger.error(f"[INSIGHTS] DuckDuckGo search failed: {e}")
            search_context = "Could not fetch current climate trends."

        # Note: habit data is no longer persisted to a graph DB since the graph
        # service now delegates to Cognee Cloud. Habits are used for LLM context only.
        logger.info(f"[INSIGHTS] Habit context — location={location}, water={water_intake}, sleep={sleep_amount}.")

        # 2. Query Cognee for patient history (Graph RAG)
        logger.info("[INSIGHTS] Querying Graph RAG for patient history...")
        try:
            graph_query = "What are the patient's existing symptoms, triggers, medications, and lifestyle factors?"
            graph_response = await graph_service.query(graph_query)
            graph_context = graph_response.get("graph_answer", "No history available.")
        except Exception as e:
            logger.error(f"[INSIGHTS] Graph RAG query failed: {e}")
            graph_context = "Could not fetch patient history from the knowledge graph."



        # 3. Use Groq to synthesise insights
        sys_msg = SystemMessage(
            content=(
                "You are an expert medical AI analyzing patient daily habits against current climate/seasonal events. "
                "Output MUST be in valid JSON format ONLY. Do not include markdown formatting or extra text. "
                "The JSON must have this structure:\n"
                "{\n"
                '  "description": "A short 1-sentence insight.",\n'
                '  "detailed_report": "An extremely elaborate, exhaustive report (at least 600-800 words) breaking down the correlation between the patient\'s medical history, current habits, triggers, and the environmental climate data. Discuss physiological mechanisms, potential future risks, and comprehensive health impact.",\n'
                '  "weekly_plan": "A highly detailed, day-by-day (Monday to Sunday) actionable weekly plan. Each day should have specific routines for diet, hydration, sleep hygiene, and symptom management tailored to their history and the climate.",\n'
                '  "trends": [\n'
                '    {"label": "Mon", "value": 80, "text": "High"},\n'
                '    {"label": "Thu", "value": 60, "text": "Medium"},\n'
                '    {"label": "Monsoon", "value": 90, "text": "2.3x"},\n'
                '    {"label": "Winter", "value": 30, "text": "Low"}\n'
                "  ]\n"
                "}\n"
                "The labels can be dynamically based on the climate data and habits."
            )
        )
        hum_msg = HumanMessage(
            content=(
                f"Patient Habits (Self-Reported):\n"
                f"- Location: {location}\n"
                f"- Water Intake: {water_intake}\n"
                f"- Sleep: {sleep_amount}\n"
                f"- Other Habits: {other_habits}\n\n"
                f"Patient Medical History (from Knowledge Graph):\n{graph_context}\n\n"
                f"Web Search Climate Trends for location:\n{search_context}\n\n"
                "Generate the JSON insights, correlating their existing symptoms and triggers with the climate data."
            )
        )

        logger.info("[INSIGHTS] Calling Groq LLM for insights generation.")
        try:
            response = self.llm.invoke([sys_msg, hum_msg])
            content = response.content.strip()
            # Remove markdown backticks if present
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            parsed = json.loads(content)
            
            # 4. Ingest the generated insights back into Cognee so it "remembers" them
            logger.info("[INSIGHTS] Saving generated insights to knowledge graph...")
            try:
                insights_text = (
                    "AI Generated Weekly Insights Report\n"
                    "===================================\n\n"
                    f"Summary: {parsed.get('description', '')}\n\n"
                    f"Detailed Analysis:\n{parsed.get('detailed_report', '')}\n\n"
                    f"Weekly Plan:\n{parsed.get('weekly_plan', '')}\n"
                )
                
                with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt", encoding="utf-8") as tmp:
                    tmp.write(insights_text)
                    tmp_path = tmp.name
                
                await graph_service.process_pdf(tmp_path, "weekly_insights_report.txt")
                os.unlink(tmp_path)
            except Exception as graph_e:
                logger.error(f"[INSIGHTS] Failed to ingest insights to graph: {graph_e}")
                
            return parsed
        except Exception as e:
            logger.error(f"[INSIGHTS] LLM parsing failed: {e}")
            return {
                "description": "Unable to generate insights at this time.",
                "detailed_report": "Our AI service is currently unable to synthesize your detailed report. Please ensure your habits are correctly logged and try again later.",
                "weekly_plan": "1. Stay hydrated.\n2. Ensure adequate sleep.\n3. Log symptoms daily.",
                "trends": [
                    {"label": "Mon", "value": 80, "text": "High"},
                    {"label": "Thu", "value": 60, "text": "Medium"},
                    {"label": "Summer", "value": 90, "text": "2.3x"},
                    {"label": "Winter", "value": 30, "text": "Low"}
                ]
            }

    async def generate_wearable_pattern(self):
        sys_msg = SystemMessage(
            content=(
                "You are an AI analyzing wearable health data (sleep, HRV, resting heart rate). "
                "Output MUST be in valid JSON format ONLY. Do not include markdown formatting or extra text. "
                "Generate a mock trigger pattern based on random wearable metrics. "
                "The JSON must have this structure:\n"
                "{\n"
                '  "symptom": "Headache",\n'
                '  "summary": "Headache episodes usually follow poor sleep plus dehydration before high-stress days.",\n'
                '  "triggerCandidates": ["Poor sleep", "Low HRV", "High resting heart rate"],\n'
                '  "treatmentMemory": "Hydration and earlier sleep reduced similar episodes in 3 of 4 attempts."\n'
                "}\n"
            )
        )
        hum_msg = HumanMessage(content="Generate a random wearable health pattern insight.")

        logger.info("[INSIGHTS] Calling Groq LLM for wearable pattern generation.")
        try:
            response = self.llm.invoke([sys_msg, hum_msg])
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            parsed = json.loads(content)
            return parsed
        except Exception as e:
            logger.error(f"[INSIGHTS] LLM parsing failed for wearable pattern: {e}")
            return {
                "symptom": "Headache",
                "summary": "Headache episodes usually follow poor sleep (fallback data).",
                "triggerCandidates": ["Poor sleep", "Low HRV"],
                "treatmentMemory": "Hydration and earlier sleep reduced similar episodes."
            }

insights_service = InsightsService()
