from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Cognee Cloud ──────────────────────────────────────────────────────
    cognee_base_url: str = "https://tenant-abd95fce-914b-4d93-bd34-64784e3ff8cf.aws.cognee.ai"
    cognee_api_key: str = "b7acbbb372d3b09ac1d2316bb3cb9224a8e15cb9f8f8e288c71d42e2aa810e75"
    cognee_dataset: str = "medical_records"

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
