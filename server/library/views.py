from django.http import JsonResponse
from .gemini_service import ask_gemini


def ask_ai(request):
    question = request.GET.get("question")

    if not question:
        return JsonResponse({"error": "No question provided"})

    answer = ask_gemini(question)

    return JsonResponse({"answer": answer})