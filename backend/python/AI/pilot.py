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
import threading



class ActionModel(BaseModel):
    intent: str = Field(..., description="The specific action to perform")
    description: str = Field(..., description="The response to the user that you are going to say back to them, you can have a little fun with this one")
    app_name: Optional[str] = Field(None, description="Application to open or close (for open_app or close_app intents)")
    text_message: Optional[str] = Field(None, description="Message text (for send_discord and video game chat intents)")
    website_name: Optional[str] = Field(None, description="The name of the website to open (for open_website intent)")
    search_query: Optional[str] = Field(None, description="The query to search on the web (for search_web intent)")

    class Config:
        #: Enforce JSON schema output with ordered properties
        model_config = {
            "json_schema_extra": {
                "propertyOrdering": [
                    "intent",
                    "description",
                    "app_name",
                    "text_message",
                    "website_name",
                    "search_query"
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

def pilot_query(prompt, multiple_actions=False):
    try:
        # Choose schema based on whether we want multiple actions
        if multiple_actions:
            schema = MultipleActionsModel
        else:
            schema = list[ActionModel]
        
        # Generate structured output
        response = client.models.generate_content(
            model="gemini-1.5-flash-latest",
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


# def handle_pilot_command(prompt):
#     if "clip" in prompt:
#         return "[Mock] Clipping last 30 seconds..."
#     elif "make fun" in prompt:
#         return "[] Roasting user's stats..."
#     elif "dox" in prompt:
#         return "Nope. That's not allowed. pilot draws the line at doxing."
#     else:
#         return pilot_query(prompt)


def extract_response(user_prompt, multiple_actions=False):
    # Get available actions dynamically
    available_actions = actions.action_list()
    print(available_actions)
    actions_str = ", ".join(available_actions)
    
    prompt = (
        f"""
        You are Pilot, a helpful AI assistant. Your goal is to map the user's request to a specific action and its parameters.
        The user said: '{user_prompt}'.
        
        You MUST respond in the requested JSON format.
        
        Available actions: {actions_str}.
        
        Here are some rules:
        - For media: use `media_play`, `media_pause`, `media_next`, `media_previous`.
        - For apps: use `open_app` or `close_app` with `app_name`.
        - For web: use `open_website` with `website_name` or `search_web` with `search_query`.
        - The 'description' field is your spoken response to the user. Keep it brief.
        - Be mindful of speech-to-text errors (e.g., "modify" might be "spotify").
        
        Choose the best intent and respond.
        """
    )
    response_dict = pilot_query(prompt) 
    return response_dict

def execute_action(intent, context):
    if intent == "clip":
        actions.clip_screen()
        return
    elif intent == "screenshot":
        actions.screenshot()
        return
    elif intent == "open_app":
        return actions.open_app(context.get("app_name"))
    elif intent == "close_app":
        return actions.close_app(context.get("app_name"))
    elif intent == "media_play":
        return actions.media_play()
    elif intent == "media_pause":
        return actions.media_pause()
    elif intent == "media_next":
        return actions.media_next()
    elif intent == "media_previous":
        return actions.media_previous()
    elif intent == "take_picture":
        return actions.take_picture()
    elif intent == "open_website":
        return actions.open_website(context.get("website_name"))
    elif intent == "search_web":
        return actions.search_web(context.get("search_query"))
    elif intent == "list_steam_games":
        return actions.list_steam_games()
    elif intent == "afk":
        return actions.afk()
    elif intent == "stop_afk":
        return actions.stop_afk()
    elif intent == "type_chat":
        return actions.type_chat(context.get("text_message"))
    elif intent == "spam_chat":
        return actions.spam_chat(context.get("text_message"))
    elif intent == "move_around":
        return actions.afk(duration_minutes=1, movement_interval=1)
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



def pilot_do(prompt, multiple_actions=True):
    print(f"Pilot: {prompt}")
    
    # Import socketio here to avoid circular imports
    try:
        from server import socketio
        import time
    except ImportError:
        socketio = None
        import time
    
    response = extract_response(prompt)
    
    if not isinstance(response, dict):
        print(f"Error processing command: {response}")
        # Optionally, speak the error
        threading.Thread(target=speak, args=(f"Sorry, I had an issue: {response}",), daemon=True).start()
        return
    
    # Send pilot response to WebSocket
    if socketio and response and response.get("description"):
        socketio.emit('pilot_event', {
            'type': 'pilot_response',
            'text': response["description"],
            'timestamp': time.time(),
            'source': 'pilot',
            'intent': response.get("intent", "unknown")
        })

    # Speak the description of what Pilot is about to do (non-blocking)
    if response and response.get("description"):
        threading.Thread(target=speak, args=(response["description"],), daemon=True).start()
    
    # Send action start event
    if socketio and response:
        socketio.emit('pilot_event', {
            'type': 'action_start',
            'text': f"Executing: {response.get('intent', 'unknown')}",
            'timestamp': time.time(),
            'intent': response.get("intent", "unknown")
        })
    
    # Execute the action and get the result feedback
    # This now runs immediately, while the description is being spoken.
    feedback = execute_action(response.get("intent"), response)

    # Send action result to WebSocket
    if socketio and feedback:
        socketio.emit('pilot_event', {
            'type': 'action_result',
            'text': feedback,
            'timestamp': time.time(),
            'source': 'system'
        })

    # Speak the feedback from the action's execution (non-blocking)
    if feedback:
        threading.Thread(target=speak, args=(feedback,), daemon=True).start()

client = None