import json
import logging
import asyncio
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
            ddg = DDGS()
            results = await asyncio.to_thread(ddg.text, query, max_results=3)
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
                '  "description": "A short, single-line (1 sentence) clinical insight summarizing the temporal/seasonal risk based on region and habits.",\n'
                '  "detailed_report": "An extremely elaborate, exhaustive report (at least 600-800 words) breaking down the correlation between the patient\'s medical history, current habits, triggers, and the environmental climate data. Discuss physiological mechanisms, potential future risks, and comprehensive health impact.",\n'
                '  "weekly_plan": "A highly detailed, day-by-day (Monday to Sunday) actionable weekly plan. Each day should have specific routines for diet, hydration, sleep hygiene, and symptom management tailored to their history and the climate.",\n'
                '  "trends": [\n'
                '    {"label": "LabelName", "value": 0-100, "text": "DynamicTextValue"}\n'
                "  ]\n"
                "}\n"
                "CRITICAL: Do NOT include any mock/static multipliers (like 2.3x, 3.3x, etc.) or hardcoded placeholders. "
                "The 'trends' array must consist of 4 entries. The labels, values (0-100 intensity score), and text (e.g., 'Elevated', 'High Risk', 'Stable', '8 hours') MUST be dynamically calculated based on "
                "the real weather search context and patient data feeded (e.g. tracking climate parameters like Temperature, Humidity, Sleep Deficit, Hydration Level, or UV Index)."
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
            # Calculate dynamic metrics for fallback
            water_num = 1.0
            try:
                water_num = float(''.join(c for c in water_intake if c.isdigit() or c == '.'))
            except Exception:
                pass
            
            sleep_num = 7.0
            try:
                sleep_num = float(''.join(c for c in sleep_amount if c.isdigit() or c == '.'))
            except Exception:
                pass

            hydration_val = int(min(100, max(0, (water_num / 3.0) * 100)))
            sleep_val = int(min(100, max(0, (sleep_num / 8.0) * 100)))
            
            return {
                "description": f"AI service offline. Fallback tracking active for {location}.",
                "detailed_report": f"Unable to generate detailed report. Location: {location}, Water: {water_intake}, Sleep: {sleep_amount}, Habits: {other_habits}.",
                "weekly_plan": "1. Stay hydrated.\n2. Ensure adequate sleep.\n3. Log symptoms daily.",
                "trends": [
                    {"label": "Hydration", "value": hydration_val, "text": f"{water_intake}"},
                    {"label": "Sleep", "value": sleep_val, "text": f"{sleep_amount}"},
                    {"label": "Climate Risk", "value": 50, "text": "Moderate"},
                    {"label": "Stability", "value": 75, "text": "Stable"}
                ]
            }

    async def generate_wearable_pattern(self):
        import random
        # 1. Generate 100 rows of sample wearable data
        headers = ["HeartRate", "RestingHeartRate", "Steps", "CaloriesBurned", "DistanceTraveled", "ActiveZoneMinutes", "SleepDuration", "SleepScore", "SpO2", "StressScore"]
        rows = []
        metrics_list = []
        for _ in range(100):
            hr = random.randint(60, 140)
            resting_hr = random.randint(55, 75)
            steps = random.randint(1000, 18000)
            calories = random.randint(1400, 3200)
            distance = round(steps * 0.00075, 2)
            active_mins = random.randint(0, 120)
            sleep_dur = round(random.uniform(4.0, 9.5), 1)
            sleep_score = random.randint(40, 96)
            spo2 = round(random.uniform(91.0, 99.5), 1)
            stress_score = random.randint(15, 95)
            rows.append(f"{hr},{resting_hr},{steps},{calories},{distance},{active_mins},{sleep_dur},{sleep_score},{spo2},{stress_score}")
            metrics_list.append({
                "HeartRate": hr,
                "RestingHeartRate": resting_hr,
                "Steps": steps,
                "CaloriesBurned": calories,
                "DistanceTraveled": distance,
                "ActiveZoneMinutes": active_mins,
                "SleepDuration": sleep_dur,
                "SleepScore": sleep_score,
                "SpO2": spo2,
                "StressScore": stress_score
            })
        
        csv_data = ",".join(headers) + "\n" + "\n".join(rows)

        sys_msg = SystemMessage(
            content=(
                "You are an expert clinical AI analyzing daily wearable timeseries logs. "
                "Analyze the provided timeseries data of 100 logs to find correlations between parameters "
                "(e.g., how sleep score, active minutes, resting heart rate, and stress scores affect likely symptoms). "
                "Output MUST be in valid JSON format ONLY. Do not include markdown formatting or extra text. "
                "The JSON must have this structure:\n"
                "{\n"
                '  "symptom": "Likely symptom (e.g. Headache, Fatigue, Cardiovascular strain)",\n'
                '  "summary": "Clinical reasoning explaining why this symptom is likely based on data patterns (e.g., Sleep drops below 5h and stress score is above 80). Be realistic, descriptive, and non-deterministic.",\n'
                '  "recommendation": "A concise one-liner advice of what needs to be done based on the analysis (e.g., Prioritize electrolyte hydration and sleep due to low recovery signals).",\n'
                '  "accuracyScore": 85,\n'
                '  "triggerCandidates": ["Poor sleep", "High stress", "Dehydration"],\n'
                '  "treatmentMemory": "Historical treatments that proved effective for similar patterns."\n'
                "}\n"
            )
        )
        hum_msg = HumanMessage(
            content=(
                f"Analyze this 100-entry wearable log (CSV format):\n\n"
                f"{csv_data}\n\n"
                "Derive likely symptom, clinical pattern summary, recommendation, and accuracy score."
            )
        )

        logger.info("[INSIGHTS] Calling Groq LLM for wearable pattern generation and analysis.")
        try:
            response = self.llm.invoke([sys_msg, hum_msg])
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            parsed = json.loads(content)
            
            # Ingest generated pattern summary to Cognee so it remembers
            logger.info("[WEARABLE] Ingesting wearable pattern to Cognee...")
            try:
                report = (
                    "Wearable Health Data Ingestion Summary\n"
                    "=====================================\n\n"
                    f"Generated Logs analyzed: 100 timeseries entries.\n"
                    f"Detected Symptom Risk: {parsed.get('symptom', '')}\n"
                    f"Clinical Summary: {parsed.get('summary', '')}\n"
                    f"Recommendation: {parsed.get('recommendation', '')}\n"
                    f"Accuracy Score: {parsed.get('accuracyScore', 80)}%\n"
                    f"Triggers: {', '.join(parsed.get('triggerCandidates', []))}\n"
                )
                with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt", encoding="utf-8") as tmp:
                    tmp.write(report)
                    tmp_path = tmp.name
                await graph_service.process_pdf(tmp_path, "wearable_sync_report.txt")
                os.unlink(tmp_path)
            except Exception as graph_e:
                logger.error(f"[WEARABLE] Failed to ingest wearable sync report: {graph_e}")

            return {
                "pattern": parsed,
                "metrics": metrics_list
            }
        except Exception as e:
            logger.error(f"[INSIGHTS] LLM parsing failed for wearable pattern: {e}")
            return {
                "pattern": {
                    "symptom": "Headache",
                    "summary": "Headache episodes usually follow poor sleep (fallback data).",
                    "recommendation": "Ensure 8+ hours of sleep and regular hydration.",
                    "accuracyScore": 75,
                    "triggerCandidates": ["Poor sleep", "Low HRV"],
                    "treatmentMemory": "Hydration and earlier sleep reduced similar episodes."
                },
                "metrics": metrics_list
            }

insights_service = InsightsService()
