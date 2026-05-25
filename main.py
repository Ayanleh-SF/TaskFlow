import logging
import time
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response
from api.v1.router import api_router
from core.config import settings
from core.logging import configure_logging
from db.base import Base
from db.migrations import ensure_task_columns
from db.session import engine
from models import task, token, user

configure_logging()
logger = logging.getLogger("taskflow.requests")

Base.metadata.create_all(bind=engine)
ensure_task_columns(engine)

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    request_id = request.headers.get("x-request-id", str(uuid4()))
    start_time = time.perf_counter()
    client_host = request.client.host if request.client else "unknown"

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.exception(
            "request_failed request_id=%s method=%s path=%s client=%s duration_ms=%.2f",
            request_id,
            request.method,
            request.url.path,
            client_host,
            duration_ms,
        )
        raise

    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "request_completed request_id=%s method=%s path=%s status=%s client=%s duration_ms=%.2f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        client_host,
        duration_ms,
    )
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(api_router)
