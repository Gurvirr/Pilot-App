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
    text_message: Optional[str] = Field(None, description="Message text (for send_discord and video game chat intents)")

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
    
    # Add macro-specific commands to the prompt
    macro_commands = [
        "be afk", "go afk", "afk mode", "stay afk",
        "move around", "move mouse", "random movement",
        "type in chat", "send message", "chat message",
        "spam chat", "spam message", "custom message",
        "csgo chat", "team chat", "rush b", "rush a",
        "ai message", "generate message", "smart chat",
        "steam games", "list games", "what games", "show games"
    ]
    
    prompt = (
        f"""
        YOU, JARVIS are an AI assistant for gaming and other productivity tasks.

        Available actions you can perform: {actions_str}

        You also have access to macro commands for gaming:
        - "be afk" or "go afk" → use intent: "afk" 
        - "move around" or "move mouse" → use intent: "afk" with shorter duration
        - "type in chat" or "send message" → use intent: "type_chat"
        - "spam chat" or "spam message" → use intent: "spam_chat"
        - "custom message" → use intent: "type_chat" with custom text
        - "csgo chat" or "team chat" → use intent: "type_chat" with team_chat=True
        - "ai message" or "generate message" → use intent: "type_chat" with AI-generated text
        - "rush b", "rush a", "rotate" → use intent: "type_chat" with CSGO-specific messages
        - "steam games", "list games", "what games" → use intent: "list_steam_games"

        For Steam games, you can just say the game name and it will try to launch it via Steam.
        Examples: "Counter-Strike", "Minecraft", "GTA V", etc.

        You must map the user's request to one of the available intents. Here are rules to follow:
        - For generic media commands: Use `media_play` for "resume" or "unpause". Use `media_pause` for "stop the song" or "pause". Use `media_next` for "next song" or "skip".
        - For application commands: Use `open_app` or `close_app` and specify the `app_name`. For example, "kill chrome" maps to `intent: close_app` and `app_name: "chrome"`.
        - For screenshots: Use the `screenshot` intent.
        - For taking a picture: Use the `take_picture` intent if the user wants to use their camera.
        - For AFK or macro commands: Use the `afk` intent.
        - For Steam games: Use the `open_app` intent with the game name as `app_name`.

        The SST doesn't work that well so make sure the app you plan to run is an actual app, not something like "modify" because thats actually spotify.
        The description is actually what you are going to say back to the user, so stay in character and don't make it too long since we have to respond quickly.
        
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
        return
    elif intent == "screenshot":
        actions.screenshot()
        return
    elif intent == "open_app":
        return actions.open_app(context["app_name"])
    elif intent == "close_app":
        return actions.close_app(context["app_name"])
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
    elif intent == "list_steam_games":
        return actions.list_steam_games()
    elif intent == "afk":
        return actions.afk()
    elif intent == "stop_afk":
        return actions.stop_afk()
    elif intent == "type_chat":
        return actions.type_chat(context["text_message"])
    elif intent == "spam_chat":
        return actions.spam_chat(context["text_message"])
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



def jarvis_do(prompt, multiple_actions=True): 
    print(f"Jarvis: {prompt}")
    
    # Import socketio here to avoid circular imports
    try:
        from server import socketio
        import time
    except ImportError:
        socketio = None
        import time
    
    response = extract_response(prompt)
    
    # Send jarvis response to WebSocket
    if socketio and response and response.get("description"):
        socketio.emit('jarvis_event', {
            'type': 'jarvis_response',
            'text': response["description"],
            'timestamp': time.time(),
            'source': 'jarvis',
            'intent': response.get("intent", "unknown")
        })
    
    # Speak the description of what Jarvis is about to do
    if response and response.get("description"):
        speak(response["description"])
    
    # Send action start event
    if socketio and response:
        socketio.emit('jarvis_event', {
            'type': 'action_start',
            'text': f"Executing: {response.get('intent', 'unknown')}",
            'timestamp': time.time(),
            'intent': response.get("intent", "unknown")
        })
    
    # Execute the action and get the result feedback
    feedback = execute_action(response.get("intent"), response)

    # Send action result to WebSocket
    if socketio and feedback:
        socketio.emit('jarvis_event', {
            'type': 'action_result',
            'text': feedback,
            'timestamp': time.time(),
            'source': 'system'
        })

    # Speak the feedback from the action's execution
    if feedback:
        speak(feedback)