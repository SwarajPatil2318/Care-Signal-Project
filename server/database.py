from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Default to SQLite for MVP ease-of-run, but support Postgres
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./caresignal.db")

# Postgres requires psycopg2 driver in URL usually, handled by driver installation
# If using sqlite, check_same_thread needed
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
