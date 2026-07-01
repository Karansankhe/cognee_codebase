import json
import logging
from duckduckgo_search import DDGS
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings
from app.services.graph_service import graph_service

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

        # 2. Add habit data to neo4j
        # We manually add these to Neo4j to be consistent with the user's request
        try:
            cypher = """
            MERGE (loc:Location {id: $location})
            MERGE (h:DailyHabit {id: "Hydration: " + $water_intake})
            MERGE (s:DailyHabit {id: "Sleep: " + $sleep_amount})
            MERGE (o:DailyHabit {id: "Other: " + $other_habits})
            MERGE (loc)-[:AFFECTS]->(h)
            MERGE (loc)-[:AFFECTS]->(s)
            MERGE (loc)-[:AFFECTS]->(o)
            """
            graph_service.graph.query(cypher, params={
                "location": location,
                "water_intake": water_intake,
                "sleep_amount": sleep_amount,
                "other_habits": other_habits
            })
            logger.info("[INSIGHTS] Added habits to Neo4j.")
        except Exception as e:
            logger.error(f"[INSIGHTS] Failed to add habits to Neo4j: {e}")


        # 3. Use Groq to synthesise insights
        sys_msg = SystemMessage(
            content=(
                "You are a helpful AI analyzing patient daily habits against current climate/seasonal events. "
                "Output MUST be in valid JSON format ONLY. Do not include markdown formatting or extra text. "
                "The JSON must have this structure:\n"
                "{\n"
                '  "description": "A short 1-sentence insight (e.g., Headaches are 2.3x more frequent during monsoon months...).",\n'
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
                f"Patient Habits:\n"
                f"- Location: {location}\n"
                f"- Water Intake: {water_intake}\n"
                f"- Sleep: {sleep_amount}\n"
                f"- Other Habits: {other_habits}\n\n"
                f"Web Search Climate Trends for location:\n{search_context}\n\n"
                "Generate the JSON insights."
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
            return parsed
        except Exception as e:
            logger.error(f"[INSIGHTS] LLM parsing failed: {e}")
            return {
                "description": "Unable to generate insights at this time.",
                "trends": [
                    {"label": "Mon", "value": 80, "text": "High"},
                    {"label": "Thu", "value": 60, "text": "Medium"},
                    {"label": "Summer", "value": 90, "text": "2.3x"},
                    {"label": "Winter", "value": 30, "text": "Low"}
                ]
            }

insights_service = InsightsService()
