from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Supply Chain AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MySQL Database Configuration
    MYSQL_SERVER: str = "localhost"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "Ajay@2004"
    MYSQL_DB: str = "supply_chain_db"
    
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    def __init__(self, **values):
        super().__init__(**values)
        if not self.SQLALCHEMY_DATABASE_URI:
            # URL encode password for special characters
            from urllib.parse import quote
            encoded_password = quote(self.MYSQL_PASSWORD, safe='')
            # Fallback to SQLite if MySQL is not configured or for ease of use
            self.SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{self.MYSQL_USER}:{encoded_password}@{self.MYSQL_SERVER}/{self.MYSQL_DB}"
            # You can uncomment the line below to force SQLite for testing
            # self.SQLALCHEMY_DATABASE_URI = "sqlite:///./sql_app.db"


    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
