import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException

from database import supabase
from dependencies import get_current_user
from schemas import ParseRequest, SaveRequest
from llm import get_parser

router = APIRouter()
_parse = get_parser()

SYSTEM_PROMPT = """You are a parser for a household finance app used in India.
Extract structured data from the user's text and return ONLY a valid JSON array — no explanation.

Each element in the array must be one of:

1. Daily expense:
{"type": "expense", "date": "YYYY-MM-DD", "amount": 150.0, "note": "Rice", "category": "groceries"}

2. Project work entry:
{"type": "project_entry", "date": "YYYY-MM-DD", "work_description": "Tiling", "total_amount": 5000.0, "paid_amount": 2000.0, "balance": 3000.0}

3. Shopping list item:
{"type": "list_item", "item_name": "Rice", "quantity": "2kg"}

Rules:
- Always return a JSON array, even for a single item: [{"type": ...}]
- Infer missing fields sensibly (e.g. balance = total - paid)
- Use today's date if no date is mentioned
- Handle Tamil and English input
- Return only the JSON array, nothing else
"""


def _get_household_id(user_id: str) -> str:
    result = supabase.table("profiles").select("household_id").eq("id", user_id).single().execute()
    household_id = result.data.get("household_id")
    if not household_id:
        raise HTTPException(status_code=400, detail="Join or create a household first")
    return household_id


@router.post("/parse")
async def parse_text(body: ParseRequest, user=Depends(get_current_user)):
    today = date.today().isoformat()
    user_message = f"Today is {today}. Language hint: {body.language}.\n\nInput: {body.text}"

    try:
        raw = _parse(SYSTEM_PROMPT, user_message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {type(e).__name__}: {e}")

    try:
        result = json.loads(raw)
        # Normalise single dict to list for backwards compatibility
        return result if isinstance(result, list) else [result]
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail=f"Could not parse input: {raw}")


@router.post("/save")
async def save_parsed(body: SaveRequest, user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
    saved = []

    for item in body.items:
        item_type = item.get("type")

        if item_type == "expense":
            result = (
                supabase.table("expenses")
                .insert(
                    {
                        "household_id": household_id,
                        "added_by": user.id,
                        "date": item.get("date"),
                        "amount": item.get("amount"),
                        "note": item.get("note"),
                        "category": item.get("category", "").strip().lower() or None,
                    }
                )
                .execute()
            )
            saved.append({"type": "expense", **result.data[0]})

        elif item_type == "list_item":
            result = (
                supabase.table("list_items")
                .insert(
                    {
                        "household_id": household_id,
                        "added_by": user.id,
                        "item_name": item.get("item_name"),
                        "quantity": item.get("quantity"),
                    }
                )
                .execute()
            )
            saved.append({"type": "list_item", **result.data[0]})

        elif item_type == "project_entry":
            if not body.project_id:
                raise HTTPException(
                    status_code=400, detail="project_id required for project entries"
                )
            total = item.get("total_amount", 0) or 0
            paid = item.get("paid_amount", 0) or 0
            result = (
                supabase.table("project_entries")
                .insert(
                    {
                        "project_id": body.project_id,
                        "entry_date": item.get("date"),
                        "work_description": item.get("work_description"),
                        "total_amount": total,
                        "paid_amount": paid,
                        "balance": total - paid,
                    }
                )
                .execute()
            )
            saved.append({"type": "project_entry", **result.data[0]})

    return saved
