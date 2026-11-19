from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai_compatible import OpenAICompatibleProvider

from app.ai.prompts import CLASSIFER_INSTRUCTIONS
from app.ai.schemas import Classification
from config import settings

provider = OpenAICompatibleProvider(
    "freellmapi",
    base_url=settings.base_url,
    api_key=settings.api_key,
)

classifier_model = OpenAIChatModel(
    settings.classifier_model,
    provider=provider,
)

classifier = Agent(
    classifier_model, output_type=Classification, instructions=CLASSIFER_INSTRUCTIONS
)


def classify(thread: str) -> Classification:
    return classifier.run_sync(thread).output
