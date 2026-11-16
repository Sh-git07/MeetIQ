"""
Configuration management for MeetIQ AI Engine.
Reads environment variables safely without hardcoding secrets.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current directory or project root
_ENV_PATHS = [
    Path.cwd() / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
]

for env_path in _ENV_PATHS:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        break
else:
    load_dotenv()


class EngineConfig:
    """Application configuration and credentials status."""

    def __init__(self):
        self.bifrost_base_url: str = os.getenv("BIFROST_BASE_URL", "").strip() or "http://localhost:8080/v1"
        self.bifrost_api_key: str = os.getenv("BIFROST_API_KEY", "").strip()
        self.bifrost_model: str = os.getenv("BIFROST_MODEL", "").strip() or "openai/gpt-4o-mini"
        self.tavily_api_key: str = os.getenv("TAVILY_API_KEY", "").strip()

        # Operational parameters
        self.max_retries: int = 3
        self.request_timeout_seconds: float = 45.0
        self.freshness_window_days: int = 30
        self.max_iterative_rounds: int = 2
        self.max_search_results_per_query: int = 5

    def has_bifrost_credentials(self) -> bool:
        """Returns True if Bifrost API key is present."""
        return bool(self.bifrost_api_key)

    def has_tavily_credentials(self) -> bool:
        """Returns True if Tavily API key is present."""
        return bool(self.tavily_api_key)

    def has_live_credentials(self) -> bool:
        """Returns True if both Bifrost and Tavily credentials are configured."""
        return self.has_bifrost_credentials() and self.has_tavily_credentials()


config = EngineConfig()

