from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Cognee Cloud ──────────────────────────────────────────────────────
    cognee_base_url: Optional[str] = None
    cognee_api_key: Optional[str] = None
    cognee_dataset: str = "medical_records"
    elevenlabs_api_key: Optional[str] = None

    # ── Legacy (kept optional for backward compat) ────────────────────────
    groq_api_key: Optional[str] = None
    neo4j_url: Optional[str] = None
    neo4j_username: Optional[str] = None
    neo4j_password: Optional[str] = None
    neo4j_database: Optional[str] = None
    gemini_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
