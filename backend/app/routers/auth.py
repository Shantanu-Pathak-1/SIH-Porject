from typing import Optional
from urllib.parse import parse_qs
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Control Room Authentication & Access Control"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Control Room Operator / Administrator",
    description="Registers a new control room operator or system admin account.",
)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new User account with hashed password."""
    # Check duplicate email
    existing = (await db.execute(select(User).where(User.email == user_in.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email already registered in system.",
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        state_jurisdiction=user_in.state_jurisdiction,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def _authenticate_and_create_token(username_or_email: str, password: str, db: AsyncSession) -> Token:
    if not username_or_email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username (or email) and password are required.",
        )

    result = await db.execute(select(User).where(User.email == username_or_email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated.",
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Login to Control Room Dashboard (OAuth2 Form or JSON)",
    description="Authenticates operator credentials via JSON payload or OAuth2 Form Data and returns signed JWT Access Token.",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "example": "operator.shillong@geoalert.in"},
                            "email": {"type": "string", "example": "operator.shillong@geoalert.in"},
                            "password": {"type": "string", "format": "password", "example": "SecurePassword123!"},
                        },
                        "required": ["password"],
                    }
                },
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "example": "operator.shillong@geoalert.in"},
                            "password": {"type": "string", "format": "password", "example": "SecurePassword123!"},
                        },
                        "required": ["username", "password"],
                    }
                },
            }
        }
    },
)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticates credentials from JSON body or OAuth2 Form and returns JWT token."""
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Malformed JSON in request body.",
            )
        if not isinstance(body, dict):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="JSON body must be a JSON object.",
            )
        username = body.get("username") or body.get("email")
        password = body.get("password")
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            raw_body = (await request.body()).decode("utf-8", errors="ignore")
            parsed = parse_qs(raw_body)
            username = (parsed.get("username") or parsed.get("email") or [None])[0]
            password = (parsed.get("password") or [None])[0]
    else:
        # Fallback: attempt JSON first, then form data
        try:
            body = await request.json()
            if isinstance(body, dict):
                username = body.get("username") or body.get("email")
                password = body.get("password")
        except Exception:
            try:
                form = await request.form()
                username = form.get("username") or form.get("email")
                password = form.get("password")
            except Exception:
                pass

    if username is None or password is None or str(username).strip() == "" or str(password).strip() == "":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing required fields: username (or email) and password are required.",
        )

    return await _authenticate_and_create_token(str(username).strip(), str(password), db)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current Logged-in Operator Profile",
    description="Returns profile and jurisdiction details for active authenticated user.",
)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile info for active authenticated session."""
    return current_user
