from google import genai

client = genai.Client(api_key="AIzaSyCkHGHsofIpGHo7KqD2bUurih_HLb8YKbo")

def ask_gemini(question):
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=question
    )

    return response.text