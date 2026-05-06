from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./taskflow.db"
    SECRET_KEY: str = "change-me-in-production"
    REDIS_URL: str = "redis://localhost:6379/0"
    ACCESS_EXPIRE_MIN: int = 15
    REFRESH_EXPIRE_DAYS: int = 7

settings = Settings()
