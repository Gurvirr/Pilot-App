import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import re
import pyautogui
import webbrowser
import enum
import actions
from typing import Optional
from pydantic import BaseModel, Field
import json
import ast


class ActionModel(BaseModel):
    intent: str = Field(..., description="The specific action to perform")
    description: str = Field(..., description="Detail about the action")
    song_name: Optional[str] = Field(None, description="Name of the song (for play_music intent)")
    song_artist: Optional[str] = Field(None, description="Artist of the song (for play_music intent)")
    app_name: Optional[str] = Field(None, description="Application to open (for open_app intent)")
    text_message: Optional[str] = Field(None, description="Message text (for send_discord intent)")

    class Config:
        #: Enforce JSON schema output with ordered properties
        model_config = {
            "json_schema_extra": {
                "propertyOrdering": [
                    "intent",
                    "description",
                    "song_name",
                    "song_artist",
                    "app_name",
                    "text_message"
                ]
            }
        }

class RootModel(BaseModel):
    action: ActionModel

    class Config:
        model_config = {
            "json_schema_extra": {
                "title": "Root",
                "type": "object"
            }
        }

class Recipe(BaseModel):
    recipe_name: str
    ingredients: list[str]

def jarvis_query(prompt):
    try:
        # Generate structured output
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[ActionModel]  # Use the Pydantic schema here
            ),
        )

        # Access structured data
        # action_data: ActionModel = response.parsed
        # print(response.text)
        # print(action_data[0])
        # return action_data.dict()

        data = json.loads(response.text.strip())[0]
        print(data, type(data))
        return ast.literal_eval(data) if isinstance(data, str) else data

    except Exception as e:
        return f"Error: {e}"


# def handle_jarvis_command(prompt):
#     if "clip" in prompt:
#         return "[Mock] Clipping last 30 seconds..."
#     elif "make fun" in prompt:
#         return "[] Roasting user's stats..."
#     elif "dox" in prompt:
#         return "Nope. That's not allowed. jarvis draws the line at doxing."
#     else:
#         return jarvis_query(prompt)


def extract_response(user_prompt):
    prompt = (
        f"User said: '{user_prompt}'. "
        "User wants to perform an action. Output the action details in the structured format, don't include non-applicable tags."
    )
    response_dict = jarvis_query(prompt) 
    return response_dict

def execute_action(intent, context):
    if intent == "clip":
        print("[Mock] Clipping last 30s (to be integrated with OBS or NVIDIA API)")
    elif intent == "screenshot":
        actions.screenshot()
    # elif intent == "play_music":
    #     playsound("sick_track.mp3")  # Add your music path
    elif intent == "open_app":
        # print(f"[Mock] Opening application: {context['app_name']}")
        actions.open_app(context["app_name"])  # Windows
    # elif intent == "quit_game":
        # os.system("taskkill /F /IM valorant.exe")  # Be cautious!
    elif intent == "afk":
        print("[Mock] Simulating AFK behavior in Valorant...")
    else:
        print("Unknown or unsupported command.")


# Example usage
if __name__ == "__main__":

    load_dotenv()  # Loads variables from .env into environment
    api_key = os.getenv("GEMINI_API_KEY")

    client = genai.Client(api_key=api_key)

    while True:
        user_input = input("You: ")
        response = extract_response(user_input)
        print(f"Response: {response}")
        execute_action(response.get("intent"), response)
