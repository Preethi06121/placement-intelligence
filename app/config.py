import os

from dotenv import load_dotenv


load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_here")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:g7hkSRyZ@localhost:5432/placement_db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
