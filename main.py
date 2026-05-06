from fastapi import FastAPI
from api.v1.router import api_router
from db.base import Base
from db.session import engine
from models import token, user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskFlow API")
app.include_router(api_router)
