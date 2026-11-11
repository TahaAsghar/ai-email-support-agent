import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.ai.descision import decide

question = "GR-S1: single-dose grinder is cracked. Order 112-4839201-5528341"
decision = decide(question)
print(decision.model_dump_json(indent=2))