import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union


class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "MeetIQ API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Database
    # If empty, automatically falls back to local SQLite for seamless local dev & testing
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Path to SQLite fallback database
    SQLITE_FALLBACK_PATH: str = str(Path(__file__).resolve().parent.parent / "meetiq.db")

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def effective_database_url(self) -> str:
        """Returns PostgreSQL DATABASE_URL if configured, otherwise local SQLite."""
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            url = self.DATABASE_URL.strip()
            # Standardize postgres:// to postgresql:// for SQLAlchemy 2.0+
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        return f"sqlite:///{self.SQLITE_FALLBACK_PATH}"

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_URL.strip().rstrip("/")]
        if "http://localhost:5173" not in origins:
            origins.append("http://localhost:5173")
        if "http://127.0.0.1:5173" not in origins:
            origins.append("http://127.0.0.1:5173")
        return origins


settings = Settings()
