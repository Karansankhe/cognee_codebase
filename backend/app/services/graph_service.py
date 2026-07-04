"""
graph_service.py — Cognee Cloud REST API wrapper (Medical Knowledge Graph v2)
=============================================================================

Custom medical knowledge graph with 5 entity types, extracted ONLY from the
document submitted by the user — no predefined/hardcoded data.

  Entity Types
  ──────────────────────────────────────────────────────
  • Symptom          — Physical/mental symptoms reported in the document
  • Trigger          — Factors documented as causing or worsening symptoms
  • Medication       — Drugs or supplements mentioned in the document
  • TreatmentOutcome — Results/effectiveness of treatments in the document
  • LifestyleFactor  — Lifestyle habits documented as affecting health

  Relationships (extracted from document content only)
  ──────────────────────────────────────────────────────
  Trigger         ─[TRIGGERS]──────→ Symptom
  Medication      ─[ALLEVIATES]────→ Symptom
  Medication      ─[PRODUCES]──────→ TreatmentOutcome
  LifestyleFactor ─[AFFECTS]───────→ Symptom
  LifestyleFactor ─[CORRELATES_WITH]→ Trigger
  Symptom         ─[PRECEDES]──────→ Symptom   (temporal)
  Symptom         ─[CORRELATES_WITH]→ Symptom  (co-occurrence)
  Symptom         ─[HAS_OUTCOME]───→ TreatmentOutcome
"""

import json
import logging
import re
import asyncio
import tempfile
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# MEDICAL GRAPH MODEL SCHEMA
# Passed to Cognee's /api/v1/remember as `graph_model` (JSON string).
# This guides Cognee's AI pipeline to extract exactly these 5 node types and
# their relationships from the uploaded document.
# ─────────────────────────────────────────────────────────────────────────────

MEDICAL_GRAPH_MODEL: dict = {
    "title": "MedicalPatientKnowledgeGraph",
    "description": (
        "Extract medical entities and their relationships from patient records. "
        "Focus exclusively on information present in the document. "
        "Identify symptoms, their triggering factors, medications used for treatment, "
        "treatment effectiveness outcomes, and lifestyle habits affecting health."
    ),
    "type": "object",
    "properties": {
        "symptoms": {
            "type": "array",
            "items": {"$ref": "#/$defs/Symptom"},
            "description": "All physical and mental symptoms documented in the patient record"
        },
        "triggers": {
            "type": "array",
            "items": {"$ref": "#/$defs/Trigger"},
            "description": "All factors documented as triggering or worsening symptoms"
        },
        "medications": {
            "type": "array",
            "items": {"$ref": "#/$defs/Medication"},
            "description": "All medications, drugs, and supplements mentioned in the record"
        },
        "treatment_outcomes": {
            "type": "array",
            "items": {"$ref": "#/$defs/TreatmentOutcome"},
            "description": "All treatment results and effectiveness outcomes documented"
        },
        "lifestyle_factors": {
            "type": "array",
            "items": {"$ref": "#/$defs/LifestyleFactor"},
            "description": "All lifestyle habits and behavioral factors documented as affecting health"
        }
    },
    "$defs": {
        "Trigger": {
            "title": "Trigger",
            "description": "A factor documented in the record as triggering or worsening a symptom",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the trigger exactly as described in the document"
                },
                "category": {
                    "type": "string",
                    "description": "Category of the trigger (e.g. environmental, dietary, psychological, physical)"
                },
                "triggers_symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Names of symptoms this trigger causes (TRIGGERS relationship)"
                }
            },
            "required": ["name"]
        },
        "Medication": {
            "title": "Medication",
            "description": "A medication, drug, or supplement documented in the patient record",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Medication name as stated in the document"
                },
                "dosage": {
                    "type": "string",
                    "description": "Dosage and frequency as documented"
                },
                "medication_type": {
                    "type": "string",
                    "description": "Whether it is a prescription drug, over-the-counter, or supplement"
                },
                "treats_symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Symptom names this medication alleviates (ALLEVIATES relationship)"
                }
            },
            "required": ["name"]
        },
        "TreatmentOutcome": {
            "title": "TreatmentOutcome",
            "description": "A documented result or effectiveness of a treatment",
            "type": "object",
            "properties": {
                "description": {
                    "type": "string",
                    "description": "Description of the outcome as stated in the document"
                },
                "effectiveness": {
                    "type": "string",
                    "description": "Effectiveness level (e.g. effective, partially_effective, ineffective)"
                },
                "produced_by_medication": {
                    "type": "string",
                    "description": "Name of medication producing this outcome (PRODUCES relationship)"
                },
                "addresses_symptom": {
                    "type": "string",
                    "description": "Symptom this outcome relates to (HAS_OUTCOME relationship)"
                }
            },
            "required": ["description"]
        },
        "LifestyleFactor": {
            "title": "LifestyleFactor",
            "description": "A lifestyle habit or behavioral factor documented as affecting patient health",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the lifestyle factor as described in the document"
                },
                "category": {
                    "type": "string",
                    "description": "Category of the lifestyle factor (e.g. sleep, diet, exercise, hydration)"
                },
                "impact": {
                    "type": "string",
                    "description": "Documented health impact (e.g. positive, negative, neutral)"
                },
                "affects_symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Symptom names this lifestyle factor affects (AFFECTS relationship)"
                }
            },
            "required": ["name"]
        },
        "Symptom": {
            "title": "Symptom",
            "description": "A physical or mental symptom documented in the patient record",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the symptom as documented"
                },
                "severity": {
                    "type": "string",
                    "description": "Severity as documented (e.g. mild, moderate, severe)"
                },
                "frequency": {
                    "type": "string",
                    "description": "How often the symptom occurs, as documented"
                },
                "duration": {
                    "type": "string",
                    "description": "Duration of symptom episodes, as documented"
                },
                "co_occurring_symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Other symptom names that co-occur with this one (CORRELATES_WITH relationship)"
                },
                "precedes_symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Symptom names this symptom temporally precedes (PRECEDES relationship)"
                }
            },
            "required": ["name"]
        }
    }
}


# ─────────────────────────────────────────────────────────────────────────────
# GRAPH EXTRACTION QUERY — sent to Cognee after ingestion to get structured
# entity + relationship data from the knowledge graph.
# ─────────────────────────────────────────────────────────────────────────────

GRAPH_EXTRACTION_PROMPT = """
You are analysing a medical patient record that has been ingested into a knowledge graph.
Extract ALL entities and relationships from the document and return ONLY valid JSON
with this exact structure (no markdown, no code fences, no extra text):

{
  "symptoms": [
    {"name": "...", "severity": "mild|moderate|severe", "frequency": "...", "duration": "..."}
  ],
  "triggers": [
    {"name": "...", "category": "environmental|dietary|psychological|hormonal|physical|sensory"}
  ],
  "medications": [
    {"name": "...", "dosage": "...", "medication_type": "prescription|OTC|supplement"}
  ],
  "treatment_outcomes": [
    {
      "description": "...",
      "effectiveness": "effective|partially_effective|ineffective",
      "produced_by_medication": "medication name here",
      "addresses_symptom": "symptom name here"
    }
  ],
  "lifestyle_factors": [
    {"name": "...", "category": "sleep|diet|exercise|hydration|stress_management|substance_use|ergonomics", "impact": "positive|negative|neutral"}
  ],
  "relationships": [
    {"from_node": "trigger or lifestyle_factor name", "from_type": "Trigger|LifestyleFactor", "relation": "TRIGGERS|AFFECTS|CORRELATES_WITH", "to_node": "symptom name", "to_type": "Symptom"},
    {"from_node": "medication name", "from_type": "Medication", "relation": "ALLEVIATES", "to_node": "symptom name", "to_type": "Symptom"},
    {"from_node": "medication name", "from_type": "Medication", "relation": "PRODUCES", "to_node": "outcome description", "to_type": "TreatmentOutcome"},
    {"from_node": "symptom name", "from_type": "Symptom", "relation": "PRECEDES|CORRELATES_WITH", "to_node": "symptom name", "to_type": "Symptom"}
  ]
}

Use ONLY information present in the patient document. Do not add any entities or
relationships not explicitly mentioned in the document. Return ONLY the JSON object.
"""


# ─────────────────────────────────────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def _base_headers(json_body: bool = False) -> dict:
    h = {"X-Api-Key": settings.cognee_api_key}
    if json_body:
        h["Content-Type"] = "application/json"
    return h


def _extract_text_from_recall(results: Any) -> str:
    """Flatten Cognee recall response into a plain text string."""
    if not results:
        return "No information found for this query."

    fragments: list[str] = []

    def _walk(obj: Any) -> None:
        if isinstance(obj, str):
            fragments.append(obj.strip())
        elif isinstance(obj, dict):
            for key in ("text", "answer", "content", "result", "summary", "description"):
                if key in obj and isinstance(obj[key], str):
                    fragments.append(obj[key].strip())
                    return
            for v in obj.values():
                if isinstance(v, (str, dict, list)):
                    _walk(v)
        elif isinstance(obj, list):
            for item in obj:
                _walk(item)

    _walk(results)
    return "\n\n".join(f for f in fragments if f) or "No information found for this query."


def _extract_json_from_text(text: str) -> Optional[dict]:
    """
    Try to parse a JSON object from a text blob.
    Handles cases where the LLM wraps JSON in markdown code fences.
    """
    # Strip markdown fences if present
    text = re.sub(r"```(?:json)?\s*", "", text).strip()
    text = text.rstrip("`").strip()

    # Try full parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find the outermost { ... } block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    return None


def _build_graph_from_entity_dict(entity_data: dict) -> dict:
    """
    Convert structured entity dict into {nodes, links} for the frontend.

    Node colours by type (returned as part of the label):
      Symptom          → label: "Symptom"
      Trigger          → label: "Trigger"
      Medication       → label: "Medication"
      TreatmentOutcome → label: "TreatmentOutcome"
      LifestyleFactor  → label: "LifestyleFactor"
    """
    nodes: list[dict] = []
    links: list[dict] = []
    node_map: dict[str, str] = {}   # "{Type}:{name_lower}" → node_id
    _seen_links: set[str] = set()   # deduplication for links
    _nc = [0]   # node counter
    _lc = [0]   # link counter

    def _ensure_node(name: str, label: str, extra: Optional[dict] = None) -> str:
        key = f"{label}:{name.lower().strip()}"
        if key not in node_map:
            nid = str(_nc[0])
            _nc[0] += 1
            node_map[key] = nid
            entry = {"id": nid, "label": label, "name": name}
            if extra:
                entry.update({k: v for k, v in extra.items() if v})
            nodes.append(entry)
        return node_map[key]

    def _ensure_link(src_id: str, tgt_id: str, rel: str) -> None:
        sig = f"{src_id}→{tgt_id}→{rel}"
        if sig in _seen_links:
            return
        _seen_links.add(sig)
        links.append({"id": str(_lc[0]), "source": src_id, "target": tgt_id, "type": rel})
        _lc[0] += 1

    # ── Register all symptoms ─────────────────────────────────────────────
    for s in entity_data.get("symptoms", []):
        if not isinstance(s, dict) or not s.get("name"):
            continue
        _ensure_node(s["name"], "Symptom", {
            "severity": s.get("severity", ""),
            "frequency": s.get("frequency", ""),
            "duration": s.get("duration", ""),
        })

    # ── Register all triggers ─────────────────────────────────────────────
    for t in entity_data.get("triggers", []):
        if not isinstance(t, dict) or not t.get("name"):
            continue
        _ensure_node(t["name"], "Trigger", {"category": t.get("category", "")})

    # ── Register all medications ──────────────────────────────────────────
    for m in entity_data.get("medications", []):
        if not isinstance(m, dict) or not m.get("name"):
            continue
        _ensure_node(m["name"], "Medication", {
            "dosage": m.get("dosage", ""),
            "medication_type": m.get("medication_type", ""),
        })

    # ── Register all treatment outcomes ───────────────────────────────────
    for o in entity_data.get("treatment_outcomes", []):
        if not isinstance(o, dict) or not o.get("description"):
            continue
        _ensure_node(o["description"], "TreatmentOutcome", {
            "effectiveness": o.get("effectiveness", ""),
        })

    # ── Register all lifestyle factors ────────────────────────────────────
    for lf in entity_data.get("lifestyle_factors", []):
        if not isinstance(lf, dict) or not lf.get("name"):
            continue
        _ensure_node(lf["name"], "LifestyleFactor", {
            "category": lf.get("category", ""),
            "impact": lf.get("impact", ""),
        })

    # ── Apply explicit relationships ──────────────────────────────────────
    for rel in entity_data.get("relationships", []):
        if not isinstance(rel, dict):
            continue
        from_name  = rel.get("from_node", "")
        from_type  = rel.get("from_type", "")
        to_name    = rel.get("to_node", "")
        to_type    = rel.get("to_type", "")
        relation   = rel.get("relation", "RELATED_TO")

        if not from_name or not to_name:
            continue

        src_key = f"{from_type}:{from_name.lower().strip()}"
        tgt_key = f"{to_type}:{to_name.lower().strip()}"

        # Create nodes if not already registered (edge may reference an entity
        # not listed in entity arrays)
        if src_key not in node_map:
            _ensure_node(from_name, from_type or "Entity")
        if tgt_key not in node_map:
            _ensure_node(to_name, to_type or "Entity")

        src_id = node_map.get(src_key)
        tgt_id = node_map.get(tgt_key)
        if src_id and tgt_id:
            _ensure_link(src_id, tgt_id, relation)

    # ── Infer relationships from inline fields ────────────────────────────
    # Symptom.co_occurring_symptoms → CORRELATES_WITH
    for s in entity_data.get("symptoms", []):
        if not isinstance(s, dict) or not s.get("name"):
            continue
        s_id = node_map.get(f"Symptom:{s['name'].lower().strip()}")
        if not s_id:
            continue
        for co in s.get("co_occurring_symptoms", []):
            co_id = node_map.get(f"Symptom:{co.lower().strip()}")
            if co_id:
                _ensure_link(s_id, co_id, "CORRELATES_WITH")
        for pre in s.get("precedes_symptoms", []):
            pre_id = node_map.get(f"Symptom:{pre.lower().strip()}")
            if pre_id:
                _ensure_link(s_id, pre_id, "PRECEDES")

    # Trigger.triggers_symptoms → TRIGGERS
    for t in entity_data.get("triggers", []):
        if not isinstance(t, dict) or not t.get("name"):
            continue
        t_id = node_map.get(f"Trigger:{t['name'].lower().strip()}")
        if not t_id:
            continue
        for sym in t.get("triggers_symptoms", []):
            sym_id = node_map.get(f"Symptom:{sym.lower().strip()}")
            if sym_id:
                _ensure_link(t_id, sym_id, "TRIGGERS")

    # Medication.treats_symptoms → ALLEVIATES
    for m in entity_data.get("medications", []):
        if not isinstance(m, dict) or not m.get("name"):
            continue
        m_id = node_map.get(f"Medication:{m['name'].lower().strip()}")
        if not m_id:
            continue
        for sym in m.get("treats_symptoms", []):
            sym_id = node_map.get(f"Symptom:{sym.lower().strip()}")
            if sym_id:
                _ensure_link(m_id, sym_id, "ALLEVIATES")

    # LifestyleFactor.affects_symptoms → AFFECTS
    for lf in entity_data.get("lifestyle_factors", []):
        if not isinstance(lf, dict) or not lf.get("name"):
            continue
        lf_id = node_map.get(f"LifestyleFactor:{lf['name'].lower().strip()}")
        if not lf_id:
            continue
        for sym in lf.get("affects_symptoms", []):
            sym_id = node_map.get(f"Symptom:{sym.lower().strip()}")
            if sym_id:
                _ensure_link(lf_id, sym_id, "AFFECTS")

    # TreatmentOutcome.produced_by_medication → PRODUCES (reversed: Medication→Outcome)
    # TreatmentOutcome.addresses_symptom → HAS_OUTCOME (Symptom→Outcome)
    for o in entity_data.get("treatment_outcomes", []):
        if not isinstance(o, dict) or not o.get("description"):
            continue
        o_id = node_map.get(f"TreatmentOutcome:{o['description'].lower().strip()}")
        if not o_id:
            continue
        if o.get("produced_by_medication"):
            m_id = node_map.get(f"Medication:{o['produced_by_medication'].lower().strip()}")
            if m_id:
                _ensure_link(m_id, o_id, "PRODUCES")
        if o.get("addresses_symptom"):
            s_id = node_map.get(f"Symptom:{o['addresses_symptom'].lower().strip()}")
            if s_id:
                _ensure_link(s_id, o_id, "HAS_OUTCOME")

    logger.info(
        f"[GRAPH_BUILD] ✓ {len(nodes)} nodes | {len(links)} links | "
        f"types: {set(n['label'] for n in nodes)}"
    )
    return {"nodes": nodes, "links": links}


async def _cognee_recall(base_url: str, prompt: str, timeout: float = 90.0) -> Any:
    """Shared helper: POST /api/v1/recall."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{base_url}/api/v1/recall",
            headers=_base_headers(json_body=True),
            json={"query": prompt, "include_references": False},
        )
    return resp


async def _cognee_search(base_url: str, prompt: str, search_type: str,
                         dataset: str, timeout: float = 90.0) -> Any:
    """Shared helper: POST /api/v1/search."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{base_url}/api/v1/search",
            headers=_base_headers(json_body=True),
            json={
                "query": prompt,
                "search_type": search_type,
                "datasets": [dataset],
            },
        )
    return resp


# ─────────────────────────────────────────────────────────────────────────────
# Service class
# ─────────────────────────────────────────────────────────────────────────────

class CogneeGraphService:
    """
    Async wrapper around the Cognee Cloud REST API.

    All graph data is extracted exclusively from the document uploaded by the
    user — no predefined entities, no hardcoded data.
    """

    def __init__(self) -> None:
        self.base_url = settings.cognee_base_url.rstrip("/")
        self.dataset  = settings.cognee_dataset
        logger.info("[CogneeService] Initialised — Medical Knowledge Graph mode")
        logger.info(f"[CogneeService] Base URL : {self.base_url}")
        logger.info(f"[CogneeService] Dataset  : {self.dataset}")

    # ── PDF / file ingestion ──────────────────────────────────────────────────

    async def process_pdf(self, file_path: str, original_filename: str) -> dict:
        """
        Upload a document to Cognee Cloud and build the medical knowledge graph.

        Uses POST /api/v1/remember with the custom MEDICAL_GRAPH_MODEL schema so
        Cognee extracts the 5 entity types and their relationships.
        """
        logger.info("=" * 60)
        logger.info(f"[UPLOAD] Starting Cognee ingestion: {original_filename}")

        # Serialise the graph model schema to JSON string for the form field
        graph_model_json = json.dumps(MEDICAL_GRAPH_MODEL)

        # Detect MIME type from extension
        ext = original_filename.rsplit(".", 1)[-1].lower()
        mime_map = {
            "pdf": "application/pdf",
            "txt": "text/plain",
            "csv": "text/csv",
            "json": "application/json",
            "md":  "text/markdown",
        }
        mime_type = mime_map.get(ext, "application/octet-stream")

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                with open(file_path, "rb") as fh:
                    resp = await client.post(
                        f"{self.base_url}/api/v1/remember",
                        headers=_base_headers(),
                        files={"data": (original_filename, fh, mime_type)},
                        data={
                            "datasetName": self.dataset,
                            "graph_model": graph_model_json,
                        },
                    )

            logger.info(f"[UPLOAD] Cognee response status: {resp.status_code}")

            if resp.status_code == 409:
                detail = resp.text or "Processing failed on Cognee side."
                logger.error(f"[UPLOAD] Cognee 409: {detail}")
                raise RuntimeError(f"Cognee processing error: {detail}")

            resp.raise_for_status()
            body = resp.json() if resp.content else {}
            items = body.get("items_processed", 1)

            logger.info(f"[UPLOAD] ✓ Ingestion complete — items_processed={items}")
            logger.info("=" * 60)

            # Trigger memify in the background to return immediately
            asyncio.create_task(self.memify(data=original_filename))

            return {
                "status": "success",
                "message": f"{original_filename} ingested and knowledge graph built via Cognee Cloud.",
                "items_processed": items,
                "dataset": self.dataset,
                "graph_model": "MedicalPatientKnowledgeGraph",
                "entity_types": ["Symptom", "Trigger", "Medication", "TreatmentOutcome", "LifestyleFactor"],
            }

        except httpx.HTTPStatusError as exc:
            logger.error(f"[UPLOAD] HTTP error {exc.response.status_code}: {exc.response.text}")
            raise RuntimeError(
                f"Cognee API error {exc.response.status_code}: {exc.response.text}"
            ) from exc

    # ── Explicit Cognify ──────────────────────────────────────────────────────

    async def cognify(self) -> dict:
        """
        Explicitly run the cognify pipeline on the dataset.
        Takes uploaded data and runs entity extraction, relationship detection, and embedding generation.
        """
        logger.info("=" * 60)
        logger.info(f"[COGNIFY] Triggering cognify for dataset: {self.dataset}")

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/cognify",
                    headers=_base_headers(json_body=True),
                    json={"datasets": [self.dataset]},
                )

            logger.info(f"[COGNIFY] Cognee response status: {resp.status_code}")

            if resp.status_code == 409:
                detail = resp.text or "Cognify failed on Cognee side."
                logger.error(f"[COGNIFY] Cognee 409: {detail}")
                raise RuntimeError(f"Cognee cognify error: {detail}")

            resp.raise_for_status()
            
            logger.info(f"[COGNIFY] ✓ Cognify triggered successfully.")
            logger.info("=" * 60)

            return {
                "status": "success",
                "message": f"Cognify pipeline started/completed for dataset '{self.dataset}'.",
                "dataset": self.dataset,
            }

        except httpx.HTTPStatusError as exc:
            logger.error(f"[COGNIFY] HTTP error {exc.response.status_code}: {exc.response.text}")
            raise RuntimeError(
                f"Cognee API error {exc.response.status_code}: {exc.response.text}"
            ) from exc

    # ── Natural-language query ────────────────────────────────────────────────

    async def query(self, question: str) -> dict:
        """
        Answer a medical question from the knowledge graph using /api/v1/recall.
        Only information from the uploaded document is returned.
        """
        logger.info("-" * 60)
        logger.info(f"[QUERY] Question: '{question}'")

        try:
            resp = await _cognee_recall(self.base_url, question)

            logger.info(f"[QUERY] Cognee recall status: {resp.status_code}")

            if resp.status_code in (409, 422):
                logger.warning(f"[QUERY] Recall error {resp.status_code}: {resp.text}")
                return {"graph_answer": (
                    "The knowledge graph is not ready yet. "
                    "Please upload a patient document first."
                )}

            resp.raise_for_status()
            answer = _extract_text_from_recall(resp.json())
            logger.info(f"[QUERY] ✓ Answer extracted ({len(answer)} chars)")
            logger.info("-" * 60)
            return {"graph_answer": answer}

        except httpx.HTTPStatusError as exc:
            logger.error(f"[QUERY] HTTP error {exc.response.status_code}: {exc.response.text}")
            raise RuntimeError(f"Cognee recall error: {exc.response.text}") from exc

    # ── Visit summary ─────────────────────────────────────────────────────────

    async def generate_visit_summary(self) -> str:
        """
        Generate a doctor-ready visit summary from the knowledge graph.
        Uses GRAPH_COMPLETION search, falls back to recall.
        Content is drawn exclusively from the ingested document.
        """
        logger.info("=" * 60)
        logger.info("[SUMMARY] Generating Doctor-Ready Visit Summary...")

        prompt = (
            "Generate a comprehensive Doctor-Ready Visit Summary based strictly on the "
            "patient record in the knowledge graph. Include these sections: "
            "1. Patient Overview  "
            "2. Symptoms (name, severity, frequency for each)  "
            "3. Triggers (each trigger and which symptoms it causes)  "
            "4. Medications (each medication, dosage, indication)  "
            "5. Lifestyle Factors (each factor and its health impact)  "
            "6. Treatment Outcomes (effectiveness of each medication). "
            "Use only information from the uploaded document."
        )

        # Try GRAPH_COMPLETION
        try:
            resp = await _cognee_search(
                self.base_url, prompt, "GRAPH_COMPLETION", self.dataset
            )
            logger.info(f"[SUMMARY] GRAPH_COMPLETION status: {resp.status_code}")
            if resp.status_code == 200:
                summary = _extract_text_from_recall(resp.json())
                if summary and summary != "No information found for this query.":
                    logger.info(f"[SUMMARY] ✓ Via GRAPH_COMPLETION ({len(summary)} chars)")
                    return summary
        except Exception as exc:
            logger.warning(f"[SUMMARY] GRAPH_COMPLETION failed ({exc}), falling back...")

        # Fallback: recall
        try:
            result = await self.query(prompt)
            summary = result.get("graph_answer", "")
            if summary:
                logger.info(f"[SUMMARY] ✓ Via recall fallback ({len(summary)} chars)")
                return summary
        except Exception as exc:
            logger.error(f"[SUMMARY] Recall fallback failed: {exc}")

        return (
            "Unable to generate visit summary. "
            "Please upload a patient document first."
        )

    # ── Graph visualisation data ──────────────────────────────────────────────

    async def get_graph_data(self) -> dict:
        """
        Return {nodes, links} for the frontend graph visualisation.

        Strategy:
          1. Ask Cognee to return ALL entities + relationships as structured JSON
             (via GRAPH_COMPLETION search with the extraction prompt)
          2. Parse the JSON and build the graph using _build_graph_from_entity_dict
          3. If step 1 fails, fall back to recall with the same prompt
          4. If JSON parsing fails, return empty graph
        """
        logger.info("[GRAPH] Fetching medical knowledge graph from Cognee Cloud...")

        entity_data: Optional[dict] = None

        # ── Strategy 1: GRAPH_COMPLETION structured extraction ────────────
        try:
            resp = await _cognee_search(
                self.base_url, GRAPH_EXTRACTION_PROMPT, "GRAPH_COMPLETION", self.dataset
            )
            logger.info(f"[GRAPH] GRAPH_COMPLETION status: {resp.status_code}")

            if resp.status_code == 200:
                raw_text = _extract_text_from_recall(resp.json())
                logger.debug(f"[GRAPH] Raw extraction text: {raw_text[:400]}...")
                entity_data = _extract_json_from_text(raw_text)
                if entity_data:
                    logger.info("[GRAPH] ✓ JSON parsed via GRAPH_COMPLETION")
        except Exception as exc:
            logger.warning(f"[GRAPH] GRAPH_COMPLETION failed ({exc})")

        # ── Strategy 2: recall fallback ───────────────────────────────────
        if not entity_data:
            try:
                resp = await _cognee_recall(self.base_url, GRAPH_EXTRACTION_PROMPT)
                logger.info(f"[GRAPH] Recall status: {resp.status_code}")

                if resp.status_code == 200:
                    raw_text = _extract_text_from_recall(resp.json())
                    entity_data = _extract_json_from_text(raw_text)
                    if entity_data:
                        logger.info("[GRAPH] ✓ JSON parsed via recall fallback")
            except Exception as exc:
                logger.error(f"[GRAPH] Recall fallback failed ({exc})")

        # ── Build and return graph ─────────────────────────────────────────
        if entity_data and isinstance(entity_data, dict):
            graph = _build_graph_from_entity_dict(entity_data)
            if graph["nodes"]:
                return graph

        logger.warning("[GRAPH] Could not extract structured graph data — returning empty graph")
        return {"nodes": [], "links": []}

    # ── Symptom occurrence logging ────────────────────────────────────────────

    async def log_symptom(
        self,
        symptom_name: str,
        logged_at: str,           # ISO-8601 string — stored as TEXT, never a graph node
        severity: str = "",
        notes: str = "",
    ) -> dict:
        """
        Log a patient symptom occurrence and connect it to the knowledge graph.

        Design contract around time
        ───────────────────────────
        • `logged_at` is embedded as human-readable narrative prose in the
          document text (e.g. "at 2026-07-02 14:30 the patient reported…").
        • The graph_model schema for this call intentionally has NO Time /
          Date / Timestamp node type, so Cognee's entity-extraction pipeline
          will NEVER create a time node in the graph.
        • The timestamp is returned in the API response for display purposes
          only — it lives in the text layer, not the graph layer.
        """
        import os as _os

        logger.info("-" * 60)
        logger.info(f"[LOG_SYMPTOM] Logging '{symptom_name}' at {logged_at}")

        # ── Build the document text ───────────────────────────────────────
        # Time is embedded as narrative so it can be recalled but NOT graphed
        severity_str = f" with {severity} severity" if severity else ""
        notes_str    = f" Patient note: {notes}." if notes else ""
        filename_stem = symptom_name.lower().replace(" ", "_")

        doc_lines = [
            "SYMPTOM OCCURRENCE LOG",
            "======================",
            f"Symptom       : {symptom_name}",
            f"Time Logged   : {logged_at}",   # time in text — not in graph
            f"Severity      : {severity or 'not specified'}",
            f"Notes         : {notes or 'none'}",
            "",
            "CLINICAL NARRATIVE",
            "------------------",
            (
                f"The patient reported experiencing {symptom_name}{severity_str} "
                f"at {logged_at}.{notes_str}"
            ),
            "",
            "KNOWLEDGE GRAPH CONTEXT",
            "-----------------------",
            (
                f"This {symptom_name} occurrence should be linked to any known "
                f"Trigger, Medication, and LifestyleFactor entities already "
                f"present in the patient's knowledge graph."
            ),
        ]
        doc_text = "\n".join(doc_lines)

        # ── Graph model: Symptom nodes ONLY — no Time node ────────────────
        symptom_only_model = {
            "title": "SymptomOccurrenceLog",
            "description": (
                "Extract ONLY the Symptom entity from this log. "
                "Do NOT extract time, date, or timestamp as a graph node. "
                "Connect this Symptom to existing Trigger, Medication, and "
                "LifestyleFactor entities in the knowledge graph."
            ),
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/Symptom"},
                    "description": "Symptom entities extracted from this occurrence log"
                }
            },
            "$defs": {
                "Symptom": {
                    "title": "Symptom",
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name of the symptom"
                        },
                        "severity": {
                            "type": "string",
                            "enum": ["mild", "moderate", "severe"],
                            "description": "Severity of this occurrence"
                        },
                        "notes": {
                            "type": "string",
                            "description": "Any additional notes about this occurrence"
                        }
                    },
                    "required": ["name"]
                }
            }
        }

        # ── Write temp file and upload to Cognee ─────────────────────────
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=".txt", mode="w", encoding="utf-8"
            ) as tmp:
                tmp.write(doc_text)
                tmp_path = tmp.name

            upload_filename = f"symptom_log_{filename_stem}.txt"

            async with httpx.AsyncClient(timeout=180.0) as client:
                with open(tmp_path, "rb") as fh:
                    resp = await client.post(
                        f"{self.base_url}/api/v1/remember",
                        headers=_base_headers(),
                        files={"data": (upload_filename, fh, "text/plain")},
                        data={
                            "datasetName": self.dataset,
                            "graph_model": json.dumps(symptom_only_model),
                        },
                    )

            logger.info(f"[LOG_SYMPTOM] Cognee status: {resp.status_code}")

            if resp.status_code == 409:
                raise RuntimeError(f"Cognee error: {resp.text}")
            resp.raise_for_status()

            logger.info(f"[LOG_SYMPTOM] ✓ '{symptom_name}' added to knowledge graph")
            logger.info("-" * 60)

            # Trigger memify in the background to return immediately
            asyncio.create_task(self.memify(data=f"Symptom log: {symptom_name} ({severity})"))

            return {
                "status": "success",
                "symptom": symptom_name,
                "severity": severity or "not specified",
                "logged_at": logged_at,         # time returned but NOT in graph
                "dataset": self.dataset,
                "message": (
                    f"Symptom '{symptom_name}' logged and connected to the "
                    f"knowledge graph. Time '{logged_at}' is recorded as context "
                    f"text only — not stored as a graph node."
                ),
            }

        except httpx.HTTPStatusError as exc:
            logger.error(f"[LOG_SYMPTOM] HTTP error {exc.response.status_code}: {exc.response.text}")
            raise RuntimeError(f"Cognee error logging symptom: {exc.response.text}") from exc
        finally:
            if tmp_path:
                try:
                    _os.unlink(tmp_path)
                except Exception:
                    pass

    # ── Treatment outcome logging ─────────────────────────────────────────────

    async def log_outcome(
        self,
        treatment: str,
        result: str,
        follow_up_notes: str = "",
    ) -> dict:
        """
        Log a treatment outcome and persist it to the Cognee knowledge graph.

        The outcome is ingested as a structured text document via
        POST /api/v1/remember with a TreatmentOutcome-focused graph_model,
        so Cognee extracts a TreatmentOutcome node and links it to the
        relevant Medication node already in the graph.
        """
        import os as _os

        logger.info("-" * 60)
        logger.info(f"[LOG_OUTCOME] Treatment='{treatment}' | Result='{result}'")

        # Map user result text to effectiveness enum
        result_lower = result.lower()
        if any(w in result_lower for w in ("improved", "better", "effective", "helped", "resolved")):
            effectiveness = "effective"
        elif any(w in result_lower for w in ("no change", "same", "unchanged", "no effect")):
            effectiveness = "partially_effective"
        elif any(w in result_lower for w in ("worsened", "worse", "deteriorated", "ineffective")):
            effectiveness = "ineffective"
        else:
            effectiveness = "partially_effective"

        notes_str = f" Follow-up: {follow_up_notes}" if follow_up_notes else ""

        doc_lines = [
            "TREATMENT OUTCOME LOG",
            "=====================",
            f"Treatment     : {treatment}",
            f"Result        : {result}",
            f"Effectiveness : {effectiveness}",
            f"Follow-up     : {follow_up_notes or 'none'}",
            "",
            "CLINICAL NARRATIVE",
            "------------------",
            (
                f"The patient received {treatment}. "
                f"The treatment outcome was: {result}.{notes_str}"
            ),
            "",
            "KNOWLEDGE GRAPH CONTEXT",
            "-----------------------",
            (
                f"{treatment} produced a treatment outcome classified as "
                f"'{effectiveness}'. This outcome addresses the symptoms "
                f"treated by {treatment}."
            ),
        ]
        doc_text = "\n".join(doc_lines)

        # ── Graph model: TreatmentOutcome + Medication only ───────────────
        outcome_model = {
            "title": "TreatmentOutcomeLog",
            "description": (
                "Extract TreatmentOutcome and the associated Medication from "
                "this outcome log. Connect Medication → PRODUCES → TreatmentOutcome "
                "and link to the Symptom that was treated."
            ),
            "type": "object",
            "properties": {
                "treatment_outcomes": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/TreatmentOutcome"}
                },
                "medications": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/Medication"}
                }
            },
            "$defs": {
                "TreatmentOutcome": {
                    "title": "TreatmentOutcome",
                    "type": "object",
                    "properties": {
                        "description": {
                            "type": "string",
                            "description": "Description of the treatment outcome"
                        },
                        "effectiveness": {
                            "type": "string",
                            "enum": ["effective", "partially_effective", "ineffective"]
                        },
                        "produced_by_medication": {
                            "type": "string",
                            "description": "Medication name that produced this outcome"
                        },
                        "addresses_symptom": {
                            "type": "string",
                            "description": "Symptom that was treated"
                        }
                    },
                    "required": ["description"]
                },
                "Medication": {
                    "title": "Medication",
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name of the treatment or medication"
                        },
                        "dosage": {
                            "type": "string",
                            "description": "Dosage if mentioned"
                        }
                    },
                    "required": ["name"]
                }
            }
        }

        # ── Write temp file and upload to Cognee ─────────────────────────
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=".txt", mode="w", encoding="utf-8"
            ) as tmp:
                tmp.write(doc_text)
                tmp_path = tmp.name

            upload_filename = f"outcome_log_{treatment.lower().replace(' ', '_')}.txt"

            async with httpx.AsyncClient(timeout=180.0) as client:
                with open(tmp_path, "rb") as fh:
                    resp = await client.post(
                        f"{self.base_url}/api/v1/remember",
                        headers=_base_headers(),
                        files={"data": (upload_filename, fh, "text/plain")},
                        data={
                            "datasetName": self.dataset,
                            "graph_model": json.dumps(outcome_model),
                        },
                    )

            logger.info(f"[LOG_OUTCOME] Cognee status: {resp.status_code}")

            if resp.status_code == 409:
                raise RuntimeError(f"Cognee error: {resp.text}")
            resp.raise_for_status()

            logger.info(f"[LOG_OUTCOME] ✓ Outcome for '{treatment}' added to knowledge graph")
            logger.info("-" * 60)

            # Trigger memify in the background to return immediately
            asyncio.create_task(self.memify(data=f"Outcome log: {treatment} -> {result}"))

            return {
                "status": "success",
                "treatment": treatment,
                "result": result,
                "effectiveness": effectiveness,
                "follow_up_notes": follow_up_notes or "",
                "dataset": self.dataset,
                "message": (
                    f"Treatment outcome for '{treatment}' logged and "
                    f"connected to the knowledge graph as '{effectiveness}'."
                ),
            }

        except httpx.HTTPStatusError as exc:
            logger.error(f"[LOG_OUTCOME] HTTP error {exc.response.status_code}: {exc.response.text}")
            raise RuntimeError(f"Cognee error logging outcome: {exc.response.text}") from exc
        finally:
            if tmp_path:
                try:
                    _os.unlink(tmp_path)
                except Exception:
                    pass

    async def memify(self, data: str = "", dataset_id: str = "", node_name: list = None) -> dict:
        """
        Enrich/memify the knowledge graph by calling /api/v1/memify.
        """
        logger.info("=" * 60)
        logger.info(f"[MEMIFY] Triggering memify for dataset: {self.dataset} | data={data}")
        
        payload = {
            "extractionTasks": [],
            "enrichmentTasks": [],
            "data": data or "",
            "datasetName": self.dataset,
            "datasetId": dataset_id or "",
            "nodeName": node_name or [],
            "runInBackground": True
        }
        
        memify_headers = {
            "Authorization": f"Bearer {settings.cognee_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0, verify=False) as client:
                resp = await client.post(
                    "https://api.cognee.ai/api/v1/memify",
                    headers=memify_headers,
                    json=payload,
                )
            
            logger.info(f"[MEMIFY] Cognee response status: {resp.status_code}")
            
            if resp.status_code == 409:
                detail = resp.text or "Memify failed on Cognee side."
                logger.error(f"[MEMIFY] Cognee 409: {detail}")
                raise RuntimeError(f"Cognee memify error: {detail}")
                
            resp.raise_for_status()
            logger.info(f"[MEMIFY] ✓ Memify completed successfully.")
            logger.info("=" * 60)
            return resp.json() if resp.content else {}
        except Exception as e:
            logger.error(f"[MEMIFY] Failed: {e}")
            return {"status": "failed", "error": str(e)}


# ── Singleton ─────────────────────────────────────────────────────────────────
graph_service = CogneeGraphService()
