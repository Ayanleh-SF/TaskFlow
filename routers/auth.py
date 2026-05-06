from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from services.auth_service import (
    login as login_service,
    refresh as refresh_service,
    register as register_service,
)
from schemas.auth import TokenPair, RefreshPayload
from schemas.user import UserCreate, UserOut
from jose import jwt, JWTError
from core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        return register_service(db, data)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/login", response_model=TokenPair)
def login(username: str, password: str, db: Session = Depends(get_db)):
    try:
        access, refresh = login_service(db, username, password)
        return {"access": access, "refresh": refresh}
    except Exception:
        raise HTTPException(401, "Invalid credentials")


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
