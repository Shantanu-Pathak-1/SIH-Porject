from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, init_postgis_extension
from app.models import Base
from app.routers import alerts, auth, data_sources, incidents, landslides, ml_model, realtime, risk, stations, telemetry
from app.services.scheduler import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan context manager for startup table creation, PostGIS & APScheduler initialization."""
    try:
        await init_postgis_extension()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # Start government data ingestion cron engine
        start_scheduler()
    except Exception as e:
        print(f"Warning: Database setup deferred or unreachable: {e}")
    yield
    # Shutdown scheduler on application exit
    shutdown_scheduler()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Landslide Early Warning and Spatial Monitoring System for North Eastern Region (NER) of India",
    lifespan=lifespan,
)

# Configure CORS (explicit origins required when allow_credentials=True)
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
if getattr(settings, "CORS_ORIGINS", ""):
    for origin in settings.CORS_ORIGINS.split(","):
        clean_origin = origin.strip()
        if clean_origin and clean_origin not in cors_origins:
            cors_origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(stations.router, prefix=settings.API_V1_STR)
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(landslides.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(data_sources.router, prefix=settings.API_V1_STR)
app.include_router(ml_model.router, prefix=settings.API_V1_STR)
app.include_router(realtime.router, prefix=settings.API_V1_STR)



@app.get("/")
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "region": "North Eastern Region (NER), India",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
