import os
import pyautogui
import datetime
import sys
import win32gui
import subprocess
import re
import winapps
import webbrowser
from google import genai
from pydantic import BaseModel
from typing import Literal, Optional

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
    



def _find_and_launch_shortcut(app_name):
    """Finds and launches a shortcut (.lnk) in common locations on Windows."""
    if sys.platform != "win32":
        return False

    app_lower = app_name.lower()
    
    # Common locations for shortcuts
    locations = [
        os.path.join(os.getenv('APPDATA'), 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        os.path.join(os.getenv('ALLUSERSPROFILE'), 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        os.path.join(os.path.expanduser('~'), 'Desktop'),
        os.getenv('PUBLIC') and os.path.join(os.getenv('PUBLIC'), 'Desktop') # PUBLIC env var may not exist
    ]

    for location in locations:
        if not location or not os.path.isdir(location):
            continue
        
        # Walk through the directory to find shortcuts
        for root, dirs, files in os.walk(location):
            for file in files:
                # Check if the file is a shortcut and matches the app name
                if file.lower().endswith('.lnk'):
                    shortcut_name = file.lower().replace('.lnk', '')
                    if app_lower in shortcut_name:
                        shortcut_path = os.path.join(root, file)
                        try:
                            # os.startfile is like double-clicking the shortcut
                            os.startfile(shortcut_path)
                            print(f"✅ Launched '{app_name}' via shortcut: {shortcut_path}")
                            return True
                        except Exception as e:
                            print(f"⚠️ Found shortcut for {app_name} but failed to launch: {e}")
    return False


def open_app(app_name):
    """Open an application by its name using a multi-pronged, more generic approach."""
    print(f"Attempting to open application: '{app_name}'")
    app_lower = app_name.lower()

    # Method 1: URI Schemes (a concession to reliability for a few tricky apps)
    uri_schemes = {
        "spotify": "spotify:",
        "discord": "discord://",
        "steam": "steam://"
    }
    if app_lower in uri_schemes:
        try:
            webbrowser.open(uri_schemes[app_lower])
            print(f"✅ Opened {app_name} via {uri_schemes[app_lower]} protocol")
            return True
        except Exception as e:
            print(f"⚠️ {app_name} protocol failed: {e}")

    # Method 2: Check for common system tools with specific commands
    system_apps = {
        "file explorer": "explorer.exe",
        "explorer": "explorer.exe",
        "task manager": "Taskmgr.exe",
        "calculator": "calc.exe",
        "notepad": "notepad.exe",
        "paint": "mspaint.exe",
        "command prompt": "cmd.exe",
        "cmd": "cmd.exe",
        "powershell": "powershell.exe",
        "registry editor": "regedit.exe",
        "regedit": "regedit.exe",
        "control panel": "control.exe",
    }
    if app_lower in system_apps:
        try:
            subprocess.Popen(system_apps[app_lower], shell=True)
            print(f"✅ Launched system tool '{app_name}' via command '{system_apps[app_lower]}'.")
            return True
        except Exception as e:
            print(f"⚠️ Failed to launch system tool '{app_name}': {e}")


    # Method 3: Search for shortcuts (finds most user-installed GUI apps)
    if _find_and_launch_shortcut(app_name):
        return True

    # Method 4: If the app name has spaces, try a sanitized version (e.g., "snipping tool" -> "snippingtool")
    if ' ' in app_name:
        sanitized_name = app_name.replace(' ', '')
        try:
            # Use Popen directly for this, as 'start' can be unpredictable with sanitized names
            subprocess.Popen(sanitized_name, shell=True)
            print(f"✅ Launched '{app_name}' by sanitizing its name to '{sanitized_name}'.")
            return True
        except FileNotFoundError:
            print(f"ℹ️ Sanitized name '{sanitized_name}' not found. Continuing...")
        except Exception as e:
            print(f"⚠️ Attempt with sanitized name '{sanitized_name}' failed: {e}")


    # Method 5: Use the 'start' command (for anything in PATH or registered with the OS)
    try:
        subprocess.Popen(f'start "" "{app_name}"', shell=True)
        print(f"✅ Attempted to open '{app_name}' via the 'start' command. This is often successful for registered apps or items in PATH.")
        # This command doesn't block or easily confirm success, so we assume it works if no error is thrown.
        return True
    except Exception as e:
        print(f"ℹ️ The 'start' command failed for '{app_name}': {e}. Trying final methods.")

    # Method 6: Use winapps to find app in the registry (slower, but a good deep search)
    try:
        # We search by the original name, as it's more likely to match the registry entry
        for app in winapps.search_installed(app_name):
            print(f"Found app via winapps: {app.name}")
            # First, try to launch the specific app by its registered name
            try:
                subprocess.Popen(f'start "" "{app.name}"', shell=True)
                print(f"✅ Attempting to launch registered app '{app.name}' via 'start'.")
                return True
            except Exception as e:
                print(f"ℹ️ 'start' command failed for winapps result '{app.name}': {e}. Trying to parse executable from uninstall string.")

            # If that fails, fall back to parsing the uninstall string
            if hasattr(app, 'uninstall_string') and app.uninstall_string:
                exe_matches = re.findall(r'"([^"]*\.exe)"', app.uninstall_string)
                for match in exe_matches:
                    if 'uninstall' not in match.lower() and os.path.exists(match):
                        try:
                            subprocess.Popen(f'"{match}"', shell=True)
                            print(f"✅ Opened {app.name} via uninstall string parse: {match}")
                            return True
                        except Exception as e:
                            print(f"⚠️ Failed to launch {match} from uninstall string: {e}")
    except Exception as e:
        print(f"⚠️ winapps search failed: {e}")
    
    print(f"❌ All generic methods failed. Could not open application '{app_name}'.")
    return False
