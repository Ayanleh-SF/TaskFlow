from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "sqlite:///./taskflow.db"
    SECRET_KEY: str = "change-me-in-production"
    REDIS_URL: str = "redis://localhost:6379/0"
    ACCESS_EXPIRE_MIN: int = 15
    REFRESH_EXPIRE_DAYS: int = 7
    EMAIL_CONFIRM_EXPIRE_HOURS: int = 24
    API_BASE_URL: str = "http://127.0.0.1:8000/api/v1"
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = "noreply@taskflow.local"


settings = Settings()
