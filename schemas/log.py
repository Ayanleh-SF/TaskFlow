from pydantic import BaseModel


class LogEntry(BaseModel):
    raw: str
    timestamp: str | None = None
    level: str | None = None
    logger: str | None = None
    message: str


class LogList(BaseModel):
    entries: list[LogEntry]
    total: int
