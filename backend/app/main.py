import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.database import init_db
from app.routes.meetings import router as meetings_router
from app.routes.research import router as research_router
from app.routes.briefings import router as briefings_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("meetiq.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle handler."""
    logger.info("Initializing MeetIQ backend services...")
    init_db()
    logger.info("Database schema initialized.")
    yield
    logger.info("MeetIQ backend services shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered executive meeting research assistant backend API for MeetIQ.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
logger.info(f"Configuring CORS for allowed origins: {settings.cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(meetings_router)
app.include_router(research_router)
app.include_router(briefings_router)


@app.get("/", tags=["System"])
def root():
    """Service status and quick links."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "documentation": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint for container and uptime probes."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "sqlite_fallback" if "sqlite" in settings.effective_database_url else "postgresql"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
