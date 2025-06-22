import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import re
import pyautogui
import webbrowser
import enum
from . import actions
from typing import Optional
from pydantic import BaseModel, Field
import json
import ast
from tts_client import speak



class ActionModel(BaseModel):
    intent: str = Field(..., description="The specific action to perform")
    description: str = Field(..., description="The response to the user that you are going to say back to them, you can have a little fun with this one")
    app_name: Optional[str] = Field(None, description="Application to open or close (for open_app or close_app intents)")
    text_message: Optional[str] = Field(None, description="Message text (for send_discord intent)")

    class Config:
        #: Enforce JSON schema output with ordered properties
        model_config = {
            "json_schema_extra": {
                "propertyOrdering": [
                    "intent",
                    "description",
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
    # Get available actions dynamically
    available_actions = actions.action_list()
    print(available_actions)
    actions_str = ", ".join(available_actions)
    
    prompt = (
        f"""
        YOU, JARVIS are an AI assistant for gaming and other productivity tasks. Your responses should be brief and confident.

        Available actions you can perform: {actions_str}

        You must map the user's request to one of the available intents. Here are rules to follow:
        - For generic media commands: Use `media_play` for "resume" or "unpause". Use `media_pause` for "stop the song" or "pause". Use `media_next` for "next song" or "skip".
        - For application commands: Use `open_app` or `close_app` and specify the `app_name`. For example, "kill chrome" maps to `intent: close_app` and `app_name: "chrome"`.
        - For screenshots: Use the `screenshot` intent.

        The description is what you will say to the user. Keep it short.
        
        User said: '{user_prompt}'. 
        User wants to perform an action. Output the action details in the structured format, don't include non-applicable tags.
        
        Choose the most appropriate intent from: {actions_str}
        """
    )
    response_dict = jarvis_query(prompt) 
    return response_dict

def execute_action(intent, context):
    if intent == "clip":
        actions.clip_screen()
        return "Clipping the last 30 seconds for you."
    elif intent == "screenshot":
        actions.screenshot()
        return "Screenshot saved."
    elif intent == "open_app":
        return actions.open_app(context["app_name"])
    elif intent == "close_app":
        return actions.close_app(context["app_name"])
    # elif intent == "quit_game":
        # os.system("taskkill /F /IM valorant.exe")  # Be cautious!
    elif intent == "afk":
        print("[Mock] Simulating AFK behavior in Valorant...")
        return "Going AFK."
    else:
        print("Unknown or unsupported command.")
        return "Sorry, I don't know how to do that."


# Example usage
if __name__ == "__main__":

    load_dotenv()  # Loads variables from .env into environment
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    while True:
        user_input = input("You: ")
        response = extract_response(user_input)
        print(f"Response: {response}")
        feedback = execute_action(response.get("intent"), response)
        print(f"Feedback: {feedback}")



def jarvis_do(prompt): 
    print(f"Jarvis: {prompt}")
    response = extract_response(prompt)
    
    # Speak the description of what Jarvis is about to do
    if response and response.get("description"):
        speak(response["description"])
    
    # Execute the action and get the result feedback
    feedback = execute_action(response.get("intent"), response)

    # Speak the feedback from the action's execution
    if feedback:
        speak(feedback)