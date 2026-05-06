from fastapi import FastAPI
from db.base import Base
from db.session import engine
from models import token, user
from routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth.router, prefix="/auth")
