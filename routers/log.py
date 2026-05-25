from fastapi import APIRouter, Depends, Query

from models.user import User
from schemas.log import LogList
from services.log_service import clear_logs, read_logs
from utils.deps import get_current_user

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=LogList)
def list_logs(
    limit: int = Query(default=200, ge=1, le=1000),
    level: str | None = Query(default=None),
    query: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    entries = read_logs(limit=limit, level=level, query=query)
    return LogList(entries=entries, total=len(entries))


@router.delete("", status_code=204)
def delete_logs(current_user: User = Depends(get_current_user)):
    clear_logs()
