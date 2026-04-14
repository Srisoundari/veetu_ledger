import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from anthropic import Anthropic
from dependencies import get_current_user
from schemas import ParseRequest
import os

router = APIRouter()
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a parser for a household finance app used in India.
Extract structured data from the user's text and return ONLY valid JSON — no explanation.

Detect the type and return one of:

1. Daily expense:
{"type": "expense", "date": "YYYY-MM-DD", "amount": 150.0, "note": "Rice", "category": "groceries"}

2. Project work entry:
{"type": "project_entry", "date": "YYYY-MM-DD", "work_description": "Tiling", "total_amount": 5000.0, "paid_amount": 2000.0, "balance": 3000.0}

3. Shopping list item:
{"type": "list_item", "item_name": "Rice", "quantity": "2kg"}

Rules:
- Infer missing fields sensibly (e.g. balance = total - paid)
- Use today's date if no date is mentioned
- Handle Tamil and English input
- Return only JSON, nothing else
"""


@router.post("/parse")
async def parse_text(body: ParseRequest, user=Depends(get_current_user)):
    today = date.today().isoformat()
    user_message = f"Today is {today}. Language hint: {body.language}.\n\nInput: {body.text}"

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail=f"Could not parse input: {raw}")
