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
import logging

logger = logging.getLogger(__name__)

def ask_groq(question, books=None):
    from .models import Book

    GROQ_API_KEY = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if GROQ_API_KEY:
        GROQ_API_KEY = GROQ_API_KEY.strip().strip("'\"")

    if not GROQ_API_KEY:
        logger.error("[Groq AI] GROQ_API_KEY is not configured in settings or environment variables.")
        return "AI is temporarily unavailable. Missing API Key."

    try:
        all_books = Book.objects.all()
    except Exception as e:
        logger.warning(f"[Groq AI] Could not fetch books context: {e}")
        all_books = []

    context = ""
    if all_books:
        for book in all_books:
            # Determine PDF URL (prioritize pdf_file's Cloudinary URL, then external pdf_url)
            try:
                if book.pdf_file:
                    pdf_url = book.pdf_file.url
                elif book.pdf_url:
                    pdf_url = book.pdf_url
                else:
                    pdf_url = "PDF Not Available"
            except Exception:
                pdf_url = book.pdf_url if book.pdf_url else "PDF Not Available"

            audio_url = book.audio_url if book.audio_url else "Audio Not Available"
            category_name = book.category.name if book.category else "Others"

            context += (
                f"ID: {book.id}\n"
                f"Title: {book.title}\n"
                f"Author: {book.author}\n"
                f"Category: {category_name}\n"
                f"Description: {book.description}\n"
                f"PDF URL: {pdf_url}\n"
                f"Audio URL: {audio_url}\n"
                f"-------------------\n"
            )

    prompt = f"""
You are a smart AI assistant for an E-Library.

Library Data:
{context}

User Question: {question}

Answer:
"""

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_instruction = """
You are a smart AI assistant for an E-Library. Your task is to search and suggest books to users from the Library Data provided in the prompt.

CRITICAL RULES:
1. Search books intelligently. If an exact match does not exist, suggest similar books from the Library Data.
2. NEVER invent links. Do not create frontend URLs (e.g. '/books/{id}') or any external URLs that are not provided in the Library Data. Only use URLs that exist in the database Library Data.
3. If no PDF exists for a book, return "PDF Not Available".
4. If no audio exists for a book, return "Audio Not Available".
5. Always return the actual PDF URL (which is a Cloudinary URL from the 'PDF URL' field of the book) exactly as provided. Every generated PDF link must be directly clickable and open the Cloudinary PDF.
6. Format your response in clean Markdown. Keep responses concise and user-friendly.
7. You must respond in the exact following format for each book (do not add extra markdown links if the URL is provided on its own line):

## <Book Title>
Author: <Book Author>

Description:
<Book Description>

📖 Read Book
<Actual Cloudinary PDF URL or "PDF Not Available">

🎧 Audio
<Actual Audio URL or "Audio Not Available">

If multiple books match the user's query, list ALL matching books with their actual PDF URLs, each formatted in the structure above.
"""

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        logger.info(f"[Groq AI] Response Status Code: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"[Groq AI Error] Status: {response.status_code}, Response: {response.text}")
            return f"AI is temporarily unavailable. (Status {response.status_code})"

        data = response.json()
        return data["choices"][0]["message"]["content"]

    except requests.exceptions.RequestException as req_err:
        logger.error(f"[Groq AI Request Error]: {req_err}")
        return "AI is temporarily unavailable. Please try again."
    except Exception as e:
        logger.error(f"[Groq AI Exception]: {e}")
        return "AI is temporarily unavailable. Please try again."