from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Supply Chain AI"
    API_V1_STR: str = "/api/v1"
    # Set a strong secret key via SECRET_KEY env variable in production
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ----------------------------------------------------------------
    # Database — all read from environment variables.
    # On Railway, set DATABASE_URL directly (preferred).
    # Alternatively set individual MYSQL_* vars.
    # For local dev, these fall back to localhost defaults.
    # ----------------------------------------------------------------
    DATABASE_URL: Optional[str] = None          # e.g. mysql+pymysql://user:pass@host/db
    MYSQL_SERVER: str = "localhost"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_DB: str = "supply_chain_db"

    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    def __init__(self, **values):
        super().__init__(**values)
        if not self.SQLALCHEMY_DATABASE_URI:
            if self.DATABASE_URL:
                # Railway / PlanetScale / any provider sets this directly
                self.SQLALCHEMY_DATABASE_URI = self.DATABASE_URL
            else:
                # Build from individual components (local dev)
                from urllib.parse import quote
                encoded_password = quote(self.MYSQL_PASSWORD, safe='')
                self.SQLALCHEMY_DATABASE_URI = (
                    f"mysql+pymysql://{self.MYSQL_USER}:{encoded_password}"
                    f"@{self.MYSQL_SERVER}/{self.MYSQL_DB}"
                )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
