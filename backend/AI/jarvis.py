import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import re
import pyautogui
import webbrowser
import enum
from . import actions
from typing import Optional, List
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

class MultipleActionsModel(BaseModel):
    actions: List[ActionModel] = Field(..., description="List of actions to perform")
    overall_description: str = Field(..., description="Overall response to the user describing what actions will be performed")
    execution_order: Optional[List[int]] = Field(None, description="Order in which actions should be executed (0-based indices)")

    class Config:
        model_config = {
            "json_schema_extra": {
                "propertyOrdering": [
                    "actions",
                    "overall_description", 
                    "execution_order"
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

def jarvis_query(prompt, multiple_actions=False):
    try:
        # Choose schema based on whether we want multiple actions
        if multiple_actions:
            schema = MultipleActionsModel
        else:
            schema = list[ActionModel]
        
        # Generate structured output
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema
            ),
        )

        # Parse the response
        if multiple_actions:
            data = json.loads(response.text.strip())
            return data
        else:
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


def extract_response(user_prompt, multiple_actions=False):
    # Get available actions dynamically
    available_actions = actions.action_list()
    print(available_actions)
    actions_str = ", ".join(available_actions)
    
    prompt = (
        f"""
        YOU, JARVIS are an AI assistant for gaming and other productivity tasks.

            Available actions you can perform: {actions_str}

        Sometimes, the AI voice recognition doesn't do a great job, so you need to look at what you can do and match it with the available actions.

        The description is actually what you are going to say back to the user, so stay in character and don't make it too long since we have to respond quickly.
        
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

def execute_multiple_actions(actions_data):
    """
    Execute multiple actions in the specified order
    """
    if not actions_data or "actions" not in actions_data:
        print("No actions to execute")
        return
    
    actions_list = actions_data["actions"]
    execution_order = actions_data.get("execution_order")
    
    # If no specific order is provided, execute in the order they appear
    if execution_order is None:
        execution_order = list(range(len(actions_list)))
    
    print(f"Executing {len(actions_list)} actions in order: {execution_order}")
    
    for i, action in enumerate(actions_list):
        print(f"Executing action {i+1}/{len(actions_list)}: {action['intent']}")
        execute_action(action['intent'], action)


# Example usage
if __name__ == "__main__":

    load_dotenv()  # Loads variables from .env into environment
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    while True:
        user_input = input("You: ")
        # Use multiple actions by default for more flexibility
        response = extract_response(user_input, multiple_actions=True)
        print(f"Response: {response}")
        execute_action(response.get("intent"), response)



def jarvis_do(prompt, multiple_actions=True): 
    print(f"Jarvis: {prompt}")
    response = extract_response(prompt, multiple_actions=multiple_actions)
    
    # Speak the description of what Jarvis is about to do
    if response and response.get("description"):
        speak(response["description"])
    
    execute_action(response.get("intent"), response)