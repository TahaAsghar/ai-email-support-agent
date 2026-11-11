from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    google_client_id: str
    google_client_secret: str
    google_refresh_token: str
    database_url: str
    classifier_model: str
    agent_model: str
    base_url: str
    api_key: str
    poll_interval_seconds: int
    dashboard_username: str = "admin"
    dashboard_password: str = ""

settings = Settings()