import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import re
import pyautogui
import webbrowser

# from playsound


def jarvius_query(prompt):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0) # Disables thinking
            ),
        )
        return response.text
    except Exception as e:
        return f"Error: {e}"

import actions

# def handle_jarvius_command(prompt):
#     if "clip" in prompt:
#         return "[Mock] Clipping last 30 seconds..."
#     elif "make fun" in prompt:
#         return "[Mock] Roasting user's stats..."
#     elif "dox" in prompt:
#         return "Nope. That's not allowed. Jarvius draws the line at doxing."
#     else:
#         return jarvius_query(prompt)


def extract_intent(user_prompt):
    prompt = (
        f"User said: '{user_prompt}'. "
        f"Choose one action from: {actions.action_list()}. "
        f"Based on the action choosen, return a dictionary based the following format: {actions.action_format()}."
        f""
    )
    response = jarvius_query(prompt)
    print(f"Jarvius response: {response}")
    intent = response
    return intent if intent in actions.action_list() else "unknown"



def execute_action(intent, context=None):
    if intent == "clip":
        print("[Mock] Clipping last 30s (to be integrated with OBS or NVIDIA API)")
    elif intent == "screenshot":
        actions.screenshot()
    # elif intent == "play_music":
    #     playsound("sick_track.mp3")  # Add your music path
    elif intent == "open_app":
        print(f"[Mock] Opening application: {context['app_name']}")
        # actions.open_app(context["app_name"])  # Windows
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
        intent = extract_intent(user_input)
        print(f"Intent: {intent}")
        execute_action(intent)
