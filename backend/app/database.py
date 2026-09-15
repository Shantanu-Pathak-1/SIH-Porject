from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args={"timeout": 5},
)



AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


from fastapi import HTTPException, status


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing async database session to FastAPI routes."""
    try:
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    except (ConnectionRefusedError, OSError, Exception) as db_err:
        # If DB connection fails (e.g. PostgreSQL not running locally), catch gracefully
        if "refused" in str(db_err).lower() or "connect" in str(db_err).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="PostgreSQL database service unreachable. Please ensure PostgreSQL + PostGIS server is running.",
            )
        raise db_err



async def init_postgis_extension():
    """Ensure PostGIS extension is installed in the database."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
