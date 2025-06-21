import os
import pyautogui
import datetime
import sys
import win32gui
import subprocess
import re
import winapps

def action_list():
    """List available actions."""
    return [
        "screenshot",
        "clip",
        "play_music",
        "open_app",
        "send_discord",
        "afk",
        "quit_game"
    ]




def screenshot():
    """Take a screenshot and save it to the folder."""

    # Get current time for filename
    now = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # Try to get the active window/application name
    app_name = "unknown"
    try:
        if sys.platform == "win32":
            window = win32gui.GetForegroundWindow()
            app_name = win32gui.GetWindowText(window)
    except Exception:
        pass

    # Sanitize app_name for filename
    app_name_clean = re.sub(r'[\\/*?:"<>|]', "", app_name).replace(" ", "_")

    screenshot_name = f"screenshot_{now}_{app_name_clean}.png"
    screenshot_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Screenshots", screenshot_name)
    pyautogui.screenshot(screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")
    



def open_app(app_name):
    """Open an application by its name."""
    print(f"Attempting to open application: {app_name}")
    print(f"Available applications: {winapps.list_installed()}")
    # try:
    #     for app in winapps.list_installed():
    #         if app.name == app_name:
    #             app.start()
    #             print(f"Opened {app_name}")
    #             return
    #     print(f"Application {app_name} not found.")
    # except Exception as e:
    #     print(f"Error opening {app_name}: {e}")