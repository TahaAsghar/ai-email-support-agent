from typing import Literal

from pydantic import BaseModel, Field

Section = Literal["espresso_machine",
"coffee_grinder",
"shipping",
"brand_tone",
"escalation_rules",
"returns_and_waranty"]


class Classification(BaseModel):
    section: Section
    language: str = Field(
        description="Language of the latest customer message, e.g. English"
    )
    needs_human: bool = Field(
        description="True when an always-escalate rule applies"
    )
    reason: str = Field(
        description="One sentence explaining the classification"
    )
    acknowledgement: str = Field(
        description="Short note to the customer, in their language, that a colleague replies within one business day"
    )


class Issue(BaseModel):
    product: Literal["espresso-machine", "coffee-grinder"]
    problem: Literal[
        # Espresso machine problems
        "missing-accessory",
        "low-pressure",
        "boiler-leak",
        # Coffee grinder problems
        "missing-hardware",
        "damaged-parts",
        "damaged-housing",
        "wrong-finish",
    ]
    order_number: str | None = None
    days_since_delivery: int | None = None
    pressure_checked: bool = Field(
        default=False,
        description="True when the pressure and group check was done",
    )
    part_numbers: list[str] = Field(
        default_factory=list,
        description="Part numbers of damaged exterior parts or components, e.g. GR-S1-04",
    )


class Decision(BaseModel):
    action: Literal["reply", "escalate"]
    section: str
    reply: str
    reason: str
    proposed_action: str | None = None


class AgentReply(BaseModel):
    action: Literal["reply", "escalate"]
    reply: str = Field(description="The email to the customer, plain text")
    reasoning: str = Field(description="Which knowledge base entries you used, and why")
    
    is_answerable_from_kb: bool = Field(
        description="True if the knowledge base fully covers and answers the customer's question without guessing."
    )
    makes_forbidden_promises: bool = Field(
        description="True if the reply text violates company rules by promising a refund, shipment, replacement, date, or call."
    )
    issue: Issue | None = Field(
        default=None,
        description="Fill in when the customer reports a problem with a product",
    )