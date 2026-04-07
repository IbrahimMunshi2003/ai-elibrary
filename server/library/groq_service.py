from groq import Groq
from django.conf import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def ask_groq(question, books=None):
    from .models import Book
    
    all_books = Book.objects.all()
    context = ""
    if all_books:
        context = "Library Data:\n"
        for book in all_books:
            context += f"ID: {book.id}, Title: {book.title}, Author: {book.author}, URL: http://localhost:5173/books/{book.id}\n"

    prompt = f"""
You are a smart AI assistant for an E-Library.

RULES:
- You can answer ANY general question using your knowledge.
- If a user asks for a specific book, ALWAYS return the closest matching book from the provided list.
- ALWAYS include a clickable URL from the given data in standard Markdown link format.
- Format the response clearly:
    **Title**: [Title]
    **Author**: [Author]
    **Link**: [Read Book](URL)
- Example Link Format: [Read 'The Great Gatsby'](http://localhost:5173/books/12)
- If exact match is not found, suggest similar books WITH links.
- NEVER respond with "I couldn't find" or "not available" without suggesting alternatives.
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
