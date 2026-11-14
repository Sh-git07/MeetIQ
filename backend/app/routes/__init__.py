# Routes package
from .meetings import router as meetings_router
from .research import router as research_router
from .briefings import router as briefings_router

__all__ = ["meetings_router", "research_router", "briefings_router"]
