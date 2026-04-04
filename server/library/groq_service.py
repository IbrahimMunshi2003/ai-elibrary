from groq import Groq
from django.conf import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def ask_groq(question, books=None):
    context = ""
    if books:
        context = "Library Books:\n"
        for book in books[:10]:
            context += f"- {book.title} by {book.author}\n"

    prompt = f"""
You are a smart AI assistant for an E-Library.

RULES:
- You can answer ANY general question using your knowledge.
- If the question is about books, recommend from the library list.
- DO NOT say "I couldn't find" or "not available".
- Always give a confident and helpful answer.
- Keep answers clear, simple, and user-friendly.

{context}

User Question: {question}

Answer:
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a helpful and intelligent assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content

    except Exception as e:
        return "AI is temporarily unavailable. Please try again."
