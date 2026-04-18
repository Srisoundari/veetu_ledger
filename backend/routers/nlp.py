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

Each element must be one of:

1. Regular expense (single short item):
{"type": "expense", "date": "YYYY-MM-DD", "amount": 150.0, "note": "Rice", "category": "groceries"}

2. Group expense entry (renovation, construction, contractor payments, or any multi-item expense report):
{"type": "project_entry", "entry_date": "YYYY-MM-DD", "work_description": "Tiles Removal", "total_amount": 4250.0, "paid_amount": 4250.0}

3. Shopping list item:
{"type": "list_item", "item_name": "Rice", "quantity": "2kg"}

Parsing rules for WhatsApp-style expense reports:
- Use type "project_entry" for every line item in an expense report
- Date headers like "*_14 Apr 2026_*", "14 Apr 2026", "14th Apr 2026" apply to ALL items below until the next date
- Item lines use formats like: "Description :- 1234" or "Description - 1234" or "Description: 1234"
- Items ABOVE a "Yet to Pay" / "Balance" / "Pending" / "To Pay" section marker:
    set paid_amount = total_amount  (fully paid)
- Items BELOW / UNDER "Yet to Pay" / "Balance" / "Pending":
    set paid_amount = 0             (not yet paid)
- "Miscellaneous" or non-date section headers: use the nearest preceding date, or today
- Ignore WhatsApp formatting: *, _, ---, bold/italic markers
- For a single short natural-language input ("spent ₹450 on groceries"): use type "expense"

General rules:
- Always return a JSON array, even for one item: [{"type": ...}]
- Handle Tamil and English input
- Use today's date if no date is mentioned
- Return ONLY the JSON array, nothing else
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
            paid  = item.get("paid_amount", 0) or 0
            total = item.get("total_amount") or paid   # default total = paid if omitted
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
