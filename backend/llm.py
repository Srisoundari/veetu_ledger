# """
# LLM provider abstraction.

# Switch provider via env var:
#   LLM_PROVIDER=anthropic  (default) — requires ANTHROPIC_API_KEY
#   LLM_PROVIDER=gemini                — requires GEMINI_API_KEY

# Returns a single callable: parse(system_prompt, user_message) -> str
# """

from datetime import date
import os

from dotenv import load_dotenv

load_dotenv()


def get_parser():
    provider = os.environ.get("LLM_PROVIDER", "anthropic").lower()

    if provider == "gemini":
        # import google.generativeai as genai

        # genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        # model = genai.GenerativeModel("gemini-1.5-flash")

        # def parse(system_prompt: str, user_message: str) -> str:
        #     response = model.generate_content(f"{system_prompt}\n\n{user_message}")
        #     return response.text.strip()

        # response = client.models.generate_content(
        #     model="gemini-3-flash-preview", contents="Explain how AI works in a few words"
        # )
        # print(response.text)

        from google import genai

        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        def parse(system_prompt: str, user_message: str) -> str:
            response = _client.models.generate_content(
                model="gemini-3-flash-preview", contents=f"{system_prompt}\n\n{user_message}"
            )
            return response.text.strip()

        return parse

    else:  # anthropic (default)
        _client = None

        def parse(system_prompt: str, user_message: str) -> str:
            nonlocal _client
            if _client is None:
                import ssl, httpx
                from anthropic import Anthropic

                _ssl_ctx = ssl.create_default_context()
                _ssl_ctx.check_hostname = False
                _ssl_ctx.verify_mode = ssl.CERT_NONE
                _client = Anthropic(
                    api_key=os.environ.get("ANTHROPIC_API_KEY"),
                    http_client=httpx.Client(verify=_ssl_ctx),
                )
            message = _client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=256,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text.strip()

        return parse


if __name__ == "__main__":

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
    # quick test
    test_input = "Bought 2kg of rice for 150 rupees today"
    today = date.today().isoformat()

    user_message = f"Today is {today}. Language hint: english.\n\nInput: {test_input}"

    print(_parse(SYSTEM_PROMPT, user_message))
    input("Press Enter to exit...")
