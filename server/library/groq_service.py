# # from groq import Groq
# # from django.conf import settings

# # client = Groq(api_key=settings.GROQ_API_KEY)

# # def ask_groq(question, books=None):
# #     from .models import Book
    
# #     all_books = Book.objects.all()
# #     context = ""
# #     if all_books:
# #         context = "Library Data:\n"
# #         for book in all_books:
# #             audio_avail = "Yes" if book.audio_url else "No"
# #             context += f"ID: {book.id}, Title: {book.title}, Author: {book.author}, PDF link: http://localhost:5173/books/{book.id}, Audio available: {audio_avail}\n"

# #     prompt = f"""
# # You are a smart AI assistant for an E-Library.

# # RULES:
# # - You can answer ANY general question using your knowledge.
# # - If a user asks for a specific book, ALWAYS return the closest matching book from the provided list.
# # - Format every response like this:

# # Title: <Book Title>
# # Author: <Author Name>

# # 📖 Read:
# # [Read Book](http://localhost:5173/books/<id>)

# # 🎧 Listen: Available / Not Available

# # - Always return links in markdown format: [Read Book](http://localhost:5173/books/<id>)
# # - If exact match is not found, suggest similar books.
# # - NEVER respond with "I couldn't find" or "not available" without suggesting alternatives.
# # - Always give a confident and helpful answer.
# # - Keep answers clear, simple, and user-friendly.

# # {context}

# # User Question: {question}

# # Answer:
# # """

# #     try:
# #         response = client.chat.completions.create(
# #             model="llama-3.1-8b-instant",
# #             messages=[
# #                 {"role": "system", "content": "You are a helpful and intelligent assistant."},
# #                 {"role": "user", "content": prompt}
# #             ],
# #             temperature=0.7,
# #         )

# #         return response.choices[0].message.content

# #     except Exception as e:
# #         return "AI is temporarily unavailable. Please try again."
# from django.conf import settings
# import os
# import requests
# import json

# def ask_groq(question, books=None):
#     from .models import Book

#     try:
#         from dotenv import load_dotenv
#         env_path = os.path.join(settings.BASE_DIR, '.env')
#         load_dotenv(env_path)
#     except ImportError:
#         pass

#     GROQ_API_KEY = os.getenv("GROQ_API_KEY")
#     if GROQ_API_KEY:
#         GROQ_API_KEY = GROQ_API_KEY.strip().strip("'\"")
    
#     key_loaded = bool(GROQ_API_KEY)
#     key_preview = f"{GROQ_API_KEY[:5]}...{GROQ_API_KEY[-5:]}" if key_loaded and len(GROQ_API_KEY) > 10 else "N/A"
    
#     print(f"[DEBUG] API Key exists: {key_loaded}")
#     print(f"[DEBUG] API Key preview: {key_preview}")
    
#     if not key_loaded:
#         return "AI is temporarily unavailable. Missing API Key."

#     all_books = []
#     try:
#         all_books = Book.objects.all()
#     except:
#         pass
        
#     context = ""

#     if all_books:
#         context = "Library Data:\n"
#         for book in all_books:
#             audio_avail = "Yes" if book.audio_url else "No"
#             context += f"ID: {book.id}, Title: {book.title}, Author: {book.author}, PDF link: http://localhost:5173/books/{book.id}, Audio available: {audio_avail}\n"

#     prompt = f"""
# You are a smart AI assistant for an E-Library.

# {context}

# User Question: {question}

# Answer:
# """
#     model = "llama-3.1-8b-instant"
#     url = "https://api.groq.com/openai/v1/chat/completions"
    
#     print(f"Request URL: {url}")
#     print(f"Model used: {model}")

#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json"
#     }
    
#     payload = {
#         "model": model,
#         "messages": [
#             {"role": "system", "content": "You are a helpful assistant for an e-library."},
#             {"role": "user", "content": prompt}
#         ]
#     }

#     try:
#         response = requests.post(url, headers=headers, json=payload, timeout=15)
#         print(f"[DEBUG] Response Status Code: {response.status_code}")
        
#         response.raise_for_status()
#         data = response.json()
#         print("Response provider confirmation: Groq")
#         return data["choices"][0]["message"]["content"]
#     except requests.exceptions.RequestException as e:
#         status_code = getattr(e.response, 'status_code', 'Unknown')
#         error_text = getattr(e.response, 'text', str(e))
#         print(f"[DEBUG] Groq API Error. Status: {status_code}, Response: {error_text}")
        
#         import traceback
#         return f"AI is temporarily unavailable. Details: {error_text}. Cause: {traceback.format_exc()}"
#     except Exception as e:
#         print(f"[DEBUG] General Error: {str(e)}")
#         import traceback
#         return f"AI is temporarily unavailable. Details: {str(e)}. Cause: {traceback.format_exc()}"
from django.conf import settings
import os
import requests

def ask_groq(question, books=None):
    from .models import Book

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    if not GROQ_API_KEY:
        return "AI is temporarily unavailable. Missing API Key."

    FRONTEND_URL = os.getenv("FRONTEND_URL", "https://ai-elibrary.vercel.app")

    try:
        all_books = Book.objects.all()
    except:
        all_books = []

    context = ""

    if all_books:
        context = "Library Data:\n"
        for book in all_books:
            audio_avail = "Yes" if book.audio_url else "No"
            context += f"ID: {book.id}, Title: {book.title}, Author: {book.author}, PDF link: {FRONTEND_URL}/books/{book.id}, Audio available: {audio_avail}\n"

    prompt = f"""
You are a smart AI assistant for an E-Library.

{context}

User Question: {question}

Answer:
"""

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant for an e-library."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        print("Status:", response.status_code)

        response.raise_for_status()
        data = response.json()

        return data["choices"][0]["message"]["content"]

    except Exception as e:
        print("GROQ ERROR:", str(e))
        return "AI is temporarily unavailable. Please try again."