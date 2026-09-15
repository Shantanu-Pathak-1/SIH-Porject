import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.database import get_db
from app.models import User
from app.schemas import MLModelStatusResponse, MLRetrainResponse
from app.services.risk_engine import ml_engine

router = APIRouter(prefix="/ml", tags=["Machine Learning Risk Prediction Model"])


@router.get(
    "/status",
    response_model=MLModelStatusResponse,
    summary="Get Active ML Landslide Prediction Model Metadata",
    description="Returns performance metrics (Accuracy, ROC-AUC, F1-Score), trained timestamp, and feature importance weights for the active ensemble model.",
)
async def get_ml_model_status():
    """Returns status and feature importances of the active ML model."""
    status_data = ml_engine.get_status()
    return MLModelStatusResponse(**status_data)


@router.post(
    "/retrain",
    response_model=MLRetrainResponse,
    summary="Trigger ML Model Re-Training Pipeline",
    description="Re-trains the Random Forest / XGBoost ensemble classifier on updated geotechnical telemetry & landslide historical dataset, updates the joblib binary, and reloads model in memory.",
)
async def retrain_ml_model(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "CONTROL_ROOM_OPERATOR"])),
):
    """Triggers ML model re-training and reloads binary."""
    try:
        from scripts.train_ml_model import train_and_save_model
        # Execute CPU-intensive training in worker thread to prevent event loop starvation
        await asyncio.to_thread(train_and_save_model)
        ml_engine.reload_model()

        status_data = ml_engine.get_status()
        return MLRetrainResponse(
            status="SUCCESS",
            message="Machine Learning Model retrained and binary updated successfully.",
            metrics=MLModelStatusResponse(**status_data),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrain ML model: {exc}",
        )
