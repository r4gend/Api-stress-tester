from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/stress_tester"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/stress_tester"
    REDIS_URL: str = "redis://localhost:6379/0"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    JWT_SECRET_KEY: str = "change-me-in-production-use-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15            # short-lived, kept in JS memory
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7               # long-lived, HttpOnly cookie
    REFRESH_COOKIE_NAME: str = "refresh_token"
    # set True only when serving over HTTPS — false for local docker dev
    REFRESH_COOKIE_SECURE: bool = False
    # "lax" works for same-origin (nginx reverse-proxy); use "none" + Secure for cross-site
    REFRESH_COOKIE_SAMESITE: str = "lax"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
