from datetime import datetime, timedelta
import secrets

from sqlalchemy.orm import Session

from core.config import settings
from models.user import User
from models.token import EmailConfirmationToken
from schemas.user import UserCreate
from core.security import hash_password
from services.email_service import EmailDeliveryError, send_email


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
        is_active=not settings.REQUIRE_EMAIL_CONFIRMATION,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if not settings.REQUIRE_EMAIL_CONFIRMATION:
        return user

    try:
        send_confirmation_email(db, user)
    except EmailDeliveryError:
        db.query(EmailConfirmationToken).filter(
            EmailConfirmationToken.user_id == user.id
        ).delete()
        db.delete(user)
        db.commit()
        raise

    return user


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def send_confirmation_email(db: Session, user: User) -> None:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(
        hours=settings.EMAIL_CONFIRM_EXPIRE_HOURS
    )

    db.add(
        EmailConfirmationToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
    )
    db.commit()

    confirmation_url = f"{settings.API_BASE_URL}/auth/confirm-email?token={token}"
    send_email(
        user.email,
        "Confirme ton inscription TaskFlow",
        (
            "Bonjour,\n\n"
            "Clique sur ce lien pour confirmer ton inscription TaskFlow :\n"
            f"{confirmation_url}\n\n"
            f"Ce lien expire dans {settings.EMAIL_CONFIRM_EXPIRE_HOURS} heures."
        ),
    )


def confirm_user_email(db: Session, token: str) -> User:
    stored_token = (
        db.query(EmailConfirmationToken)
        .filter(EmailConfirmationToken.token == token)
        .first()
    )

    if not stored_token:
        raise ValueError("Invalid confirmation token")

    if stored_token.expires_at < datetime.utcnow():
        db.delete(stored_token)
        db.commit()
        raise ValueError("Confirmation token expired")

    user = db.query(User).filter(User.id == stored_token.user_id).first()
    if not user:
        db.delete(stored_token)
        db.commit()
        raise ValueError("User not found")

    user.is_active = True
    db.delete(stored_token)
    db.commit()
    db.refresh(user)
    return user
