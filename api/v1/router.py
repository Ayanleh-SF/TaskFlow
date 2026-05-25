from fastapi import APIRouter

from routers import auth, log, task, user

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(log.router)
api_router.include_router(task.router)
api_router.include_router(user.router)
