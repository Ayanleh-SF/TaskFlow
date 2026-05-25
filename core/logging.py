import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
LOG_DIR = Path("logs")
LOG_FILE = LOG_DIR / "taskflow.log"
MAX_LOG_BYTES = 1_000_000
BACKUP_COUNT = 3


def configure_logging() -> None:
    LOG_DIR.mkdir(exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout),
            RotatingFileHandler(
                LOG_FILE,
                maxBytes=MAX_LOG_BYTES,
                backupCount=BACKUP_COUNT,
                encoding="utf-8",
            ),
        ],
        force=True,
    )

    logging.getLogger("uvicorn.access").disabled = True
