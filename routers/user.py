from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from services.auth_service import login, refresh

router = APIRouter()

@router.post("/login")
def login_route(username: str, password: str, db: Session = Depends(get_db)):
    access, refresh_token = login(db, username, password)
    return {"access": access, "refresh": refresh_token}


@router.post("/refresh")
def refresh_route(payload: dict, db: Session = Depends(get_db)):
    access, refresh_token = refresh(db, payload)
    return {"access": access, "refresh": refresh_token}
