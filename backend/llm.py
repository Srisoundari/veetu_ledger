"""
LLM provider abstraction.

Switch provider via env var:
  LLM_PROVIDER=anthropic  (default) — requires ANTHROPIC_API_KEY
  LLM_PROVIDER=gemini                — requires GEMINI_API_KEY

Returns a single callable: parse(system_prompt, user_message) -> str
"""
import os


def get_parser():
    provider = os.environ.get("LLM_PROVIDER", "anthropic").lower()

    if provider == "gemini":
        import google.generativeai as genai
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel("gemini-1.5-flash")

        def parse(system_prompt: str, user_message: str) -> str:
            response = model.generate_content(f"{system_prompt}\n\n{user_message}")
            return response.text.strip()

        return parse

    else:  # anthropic (default)
        from anthropic import Anthropic
        client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

        def parse(system_prompt: str, user_message: str) -> str:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=256,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text.strip()

        return parse
