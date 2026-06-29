from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    neo4j_url: str
    neo4j_username: str
    neo4j_password: str
    neo4j_database: str
    
    class Config:
        env_file = ".env"

settings = Settings()
