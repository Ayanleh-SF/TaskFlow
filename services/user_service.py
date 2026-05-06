from sqlalchemy.orm import Session

from models.user import User
from schemas.user import UserCreate
from core.security import hash_password


def create_user(db: Session, data: UserCreate) -> User:
    existing_user = (
        db.query(User)
        .filter((User.username == data.username) | (User.email == data.email))
        .first()
    )
    if existing_user:
        raise ValueError("Username or email already exists")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()
