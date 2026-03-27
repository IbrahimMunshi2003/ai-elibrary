from google import genai
from django.conf import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def ask_gemini(question):
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=question
        )

        return response.text

    except Exception as e:
        return f"AI Error: {str(e)}"