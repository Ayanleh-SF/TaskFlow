from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from services.auth_service import (
    login as login_service,
    refresh as refresh_service,
)
from services.email_service import EmailDeliveryError
from services.user_service import confirm_user_email, create_user
from schemas.auth import LoginPayload, TokenPair, RefreshPayload
from schemas.user import UserCreate, UserOut
from jose import jwt, JWTError
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        return create_user(db, data)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except EmailDeliveryError:
        raise HTTPException(502, "Confirmation email could not be sent")


@router.post("/login", response_model=TokenPair)
def login(data: LoginPayload, db: Session = Depends(get_db)):
    try:
        access, refresh = login_service(db, data.username, data.password)
        return {"access": access, "refresh": refresh}
    except PermissionError as exc:
        raise HTTPException(403, str(exc))
    except Exception:
        raise HTTPException(401, "Invalid credentials")


@router.get("/confirm-email", response_model=UserOut)
def confirm_email(token: str, db: Session = Depends(get_db)):
    try:
        return confirm_user_email(db, token)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshPayload, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.refresh, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        access, new_refresh = refresh_service(db, payload)
        return {"access": access, "refresh": new_refresh}
    except JWTError:
        raise HTTPException(401, "Invalid token")
