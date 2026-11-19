import logging
import re

from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai_compatible import OpenAICompatibleProvider

from app import db
from app.ai.prompts import AGENT_INSTRUCTIONS
from app.ai.schemas import AgentReply
from config import settings

logger = logging.getLogger(__name__)

provider = OpenAICompatibleProvider(
    "freellmapi",
    base_url=settings.base_url,
    api_key=settings.api_key,
)

agent_model = OpenAIChatModel(
    settings.agent_model,
    provider=provider,
)

support_agent = Agent(
    agent_model, output_type=AgentReply, instructions=AGENT_INSTRUCTIONS
)


@support_agent.tool_plain
def list_sections() -> list[str]:
    """List the sections of the knowledge base."""
    logger.info("Tool call: list_sections()")
    return db.list_sections()


@support_agent.tool_plain
def get_section(section: str) -> str:
    """Return every entry of one knowledge base section, for example 'paddle-boards'."""
    logger.info("Tool call: get_section(%r)", section)
    entries = db.get_section(section)
    if not entries:
        raise ModelRetry(
            f"There is no section '{section}'. Call list_sections to see the options."
        )
    return "\n\n".join(f"## {entry['title']}\n{entry['content']}" for entry in entries)


@support_agent.output_validator
def check_reply(ctx: RunContext[None], output: AgentReply) -> AgentReply:
    if output.action == "reply" and not output.reply.strip():
        raise ModelRetry(
            "The reply is empty. Write the email, or set action to escalate."
        )
    if re.search(
        r"\b(AI|artificial intelligence|knowledge base)\b", output.reply, re.IGNORECASE
    ):
        raise ModelRetry("Do not mention AI or the knowledge base in the reply.")
    return output


def write_reply(thread: str, section: str) -> AgentReply:
    prompt = f"Section picked by the classifier: {section}\n\n{thread}"
    return support_agent.run_sync(prompt).output
