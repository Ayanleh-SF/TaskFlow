import re
from pathlib import Path

from core.logging import LOG_FILE
from schemas.log import LogEntry


LOG_PATTERN = re.compile(
    r"^(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) "
    r"(?P<level>[A-Z]+) "
    r"\[(?P<logger>[^\]]+)\] "
    r"(?P<message>.*)$"
)


def read_logs(limit: int = 200, level: str | None = None, query: str | None = None) -> list[LogEntry]:
    lines = _read_lines(LOG_FILE)
    entries = [_parse_log_line(line) for line in lines]

    if level:
        entries = [entry for entry in entries if entry.level == level.upper()]

    if query:
        lowered_query = query.lower()
        entries = [entry for entry in entries if lowered_query in entry.raw.lower()]

    return entries[-limit:]


def clear_logs() -> None:
    LOG_FILE.parent.mkdir(exist_ok=True)
    LOG_FILE.write_text("", encoding="utf-8")


def _read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []

    return [line.rstrip("\n") for line in path.read_text(encoding="utf-8").splitlines()]


def _parse_log_line(line: str) -> LogEntry:
    match = LOG_PATTERN.match(line)
    if not match:
        return LogEntry(raw=line, message=line)

    return LogEntry(
        raw=line,
        timestamp=match.group("timestamp"),
        level=match.group("level"),
        logger=match.group("logger"),
        message=match.group("message"),
    )
