import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Access your API key
api_key = os.getenv("API_KEY")
print(api_key)  # Use your API key as needed

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-pro")

response = model.generate_content("Tell me a gaming joke.")
print(response.text)
