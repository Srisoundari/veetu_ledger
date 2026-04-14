import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from schemas import ParseRequest
from llm import get_parser

router = APIRouter()
_parse = get_parser()

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

    raw = _parse(SYSTEM_PROMPT, user_message)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail=f"Could not parse input: {raw}")
