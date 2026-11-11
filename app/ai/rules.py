from app.ai.schemas import Issue

# Steps where the reply goes to the customer, because they have to check or send something first.
CUSTOMER_STEPS = {"pressure-check", "ask-details"}


def resolve_issue(issue: Issue) -> str:
    """Decide the next step for a reported problem. The model reports, Python decides."""
    step = next_step(issue)
    if step not in CUSTOMER_STEPS | {"escalate"} and not issue.order_number:
        return "ask-details"
    return step


def next_step(issue: Issue) -> str:
    if issue.product == "espresso-machine":
        if issue.problem == "missing-accessory":
            return "ship-part"
        if issue.problem == "low-pressure":
            if not issue.pressure_checked:
                return "pressure-check"
            if issue.days_since_delivery is None:
                return "ask-details"
            return (
                "new-machine"
                if issue.days_since_delivery <= 30
                else "ship-replacement-kit"
            )

    if issue.product == "coffee-grinder":
        if issue.problem == "missing-hardware":
            return "ship-hardware-kit"
        if issue.problem == "wrong-finish":
            return "exchange"
        if issue.problem == "damaged-housing":
            return "full-replacement"
        if issue.problem == "damaged-parts":
            if not issue.part_numbers:
                return "ask-details"
            return (
                "ship-parts"
                if len(issue.part_numbers) <= 2
                else "full-replacement"
            )

    # Cracked boiler housing and anything unexpected go to a person.
    return "escalate"