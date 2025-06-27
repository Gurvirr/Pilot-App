import os
import pyautogui
import datetime
import sys
import win32gui
import subprocess
import re
import winapps
import webbrowser
import urllib.parse
from google import genai
from pydantic import BaseModel
from typing import Literal, Optional
import cv2
import macros
import json

import clip 

def clip_screen():
    print("Saving clip") 
    clip.save_clip()
import cv2

import clip

# Disable pyautogui failsafe for media keys
pyautogui.FAILSAFE = False

def clip_screen():
    print("Saving clip") 
    clip.save_clip()

def action_list():
    """List available actions."""
    return [
        "screenshot",
        "clip",
        "play_music",
        "open_app",
        "close_app",
        "media_play",
        "media_pause",
        "media_next",
        "media_previous",
        "afk",
        "type_chat",
        "spam_chat",
        "quit_game",
        "take_picture",
        "open_website",
        "search_web"
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
    screenshot_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "captures", "screenshots", screenshot_name)
    pyautogui.screenshot(screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")
    

def take_picture():
    """Takes a picture using the default webcam."""
    # Initialize the camera
    cap = cv2.VideoCapture(0) # 0 is the default camera

    if not cap.isOpened():
        print("❌ Cannot open camera")
        return "Sorry, I couldn't access the camera."

    # Allow the camera to warm up and adjust exposure
    # We read a few frames to give the sensor time to adjust
    for _ in range(30):
        cap.read()

    # Capture a single frame
    ret, frame = cap.read()

    if not ret:
        print("❌ Can't receive frame (stream end?). Exiting ...")
        cap.release()
        return "Sorry, I failed to capture a picture."

    # Generate filename
    now = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    picture_name = f"picture_{now}.png"
    picture_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "captures", "pictures", picture_name)

    # Save the captured frame
    cv2.imwrite(picture_path, frame)
    print(f"✅ Picture saved to {picture_path}")

    # Release the camera
    cap.release()

def open_website(website_name: str):
    """Opens a website in the default browser."""
    website_name = website_name.lower().replace(" ", "")
    sites = {
        "youtube": "https://www.youtube.com",
        "reddit": "https://www.reddit.com",
        "instagram": "https://www.instagram.com",
        "google": "https://www.google.com",
        "github": "https://github.com",
        "chatgpt": "https://chat.openai.com",
        "gpt": "https://chat.openai.com",
        "gemini": "https://gemini.google.com",
        "amazon": "https://www.amazon.com",
        "netflix": "https://www.netflix.com",
        "twitter": "https://www.x.com",
        "x": "https://www.x.com",
        "facebook": "https://www.facebook.com",
        "wikipedia": "https://www.wikipedia.org",
    }
    
    url = sites.get(website_name)

    if not url:
        if '.' not in website_name:
            website_name += ".com"
        url = "https://" + website_name

    try:
        webbrowser.open(url, new=2)
        print(f"✅ Opening {url} in browser.")
        return 
    except Exception as e:
        print(f"❌ Failed to open website {website_name}: {e}")
        return f"Sorry, I couldn't open that website."

def search_web(query: str):
    """Performs a web search using the default browser."""
    try:
        search_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}"
        webbrowser.open(search_url, new=2)
        print(f"✅ Searching for '{query}' on Google.")
        return
    except Exception as e:
        print(f"❌ Failed to perform web search for '{query}': {e}")
        return "Sorry, I ran into an error trying to search for that."

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

def _find_steam_games():
    """Find installed Steam games by reading Steam's library files."""
    steam_games = {}
    
    # Common Steam installation paths
    steam_paths = [
        os.path.join(os.getenv('PROGRAMFILES(X86)', ''), 'Steam'),
        os.path.join(os.getenv('PROGRAMFILES', ''), 'Steam'),
        os.path.join(os.path.expanduser('~'), 'Steam')
    ]
    
    for steam_path in steam_paths:
        if not os.path.exists(steam_path):
            continue
            
        # Look for libraryfolders.vdf file
        library_folders_path = os.path.join(steam_path, 'steamapps', 'libraryfolders.vdf')
        if os.path.exists(library_folders_path):
            try:
                with open(library_folders_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Parse library folders
                library_paths = []
                for line in content.split('\n'):
                    if '"path"' in line:
                        path_match = re.search(r'"path"\s+"([^"]+)"', line)
                        if path_match:
                            library_paths.append(path_match.group(1))
                
                # Search each library for games
                for library_path in library_paths:
                    steamapps_path = os.path.join(library_path, 'steamapps')
                    if os.path.exists(steamapps_path):
                        for file in os.listdir(steamapps_path):
                            if file.endswith('.acf'):
                                try:
                                    with open(os.path.join(steamapps_path, file), 'r', encoding='utf-8') as f:
                                        acf_content = f.read()
                                    
                                    # Extract game name and app ID
                                    name_match = re.search(r'"name"\s+"([^"]+)"', acf_content)
                                    appid_match = re.search(r'"appid"\s+"(\d+)"', acf_content)
                                    
                                    if name_match and appid_match:
                                        game_name = name_match.group(1)
                                        app_id = appid_match.group(1)
                                        steam_games[game_name.lower()] = {
                                            'name': game_name,
                                            'appid': app_id,
                                            'path': library_path
                                        }
                                except Exception as e:
                                    print(f"Error reading ACF file {file}: {e}")
                                    
            except Exception as e:
                print(f"Error reading libraryfolders.vdf: {e}")
    
    return steam_games

def _launch_steam_game(game_name: str):
    """Launch a Steam game using steam:// protocol."""
    steam_games = _find_steam_games()
    
    # Try exact match first
    if game_name.lower() in steam_games:
        app_id = steam_games[game_name.lower()]['appid']
        game_display_name = steam_games[game_name.lower()]['name']
        
        # Launch via steam:// protocol
        steam_url = f"steam://rungameid/{app_id}"
        try:
            webbrowser.open(steam_url)
            print(f"✅ Launched Steam game: {game_display_name} (ID: {app_id})")
            return f"Launched {game_display_name} on Steam."
        except Exception as e:
            print(f"❌ Failed to launch Steam game: {e}")
            return f"Failed to launch {game_display_name}."
    
    # Try partial matches
    for game_key, game_info in steam_games.items():
        if game_name.lower() in game_key or game_name.lower() in game_info['name'].lower():
            app_id = game_info['appid']
            game_display_name = game_info['name']
            
            steam_url = f"steam://rungameid/{app_id}"
            try:
                webbrowser.open(steam_url)
                print(f"✅ Launched Steam game: {game_display_name} (ID: {app_id})")
                return f"Launched {game_display_name} on Steam."
            except Exception as e:
                print(f"❌ Failed to launch Steam game: {e}")
                return f"Failed to launch {game_display_name}."
    
    return f"Could not find Steam game: {game_name}"

def open_app(app_name):
    """Open an application by its name using a multi-pronged, more generic approach."""
    print(f"Attempting to open application: '{app_name}'")
    app_lower = app_name.lower()

    # First, check if it's a Steam game
    steam_result = _launch_steam_game(app_name)
    if "Launched" in steam_result or "Could not find Steam game" not in steam_result:
        return steam_result

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
            return
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
            return
        except Exception as e:
            print(f"⚠️ Failed to launch system tool '{app_name}': {e}")

    # Method 3: Search for shortcuts (finds most user-installed GUI apps)
    if _find_and_launch_shortcut(app_name):
        return

    # Method 4: If the app name has spaces, try a sanitized version (e.g., "snipping tool" -> "snippingtool")
    if ' ' in app_name:
        sanitized_name = app_name.replace(' ', '')
        try:
            # Use Popen directly for this, as 'start' can be unpredictable with sanitized names
            subprocess.Popen(sanitized_name, shell=True)
            print(f"✅ Launched '{app_name}' by sanitizing its name to '{sanitized_name}'.")
            return
        except FileNotFoundError:
            print(f"ℹ️ Sanitized name '{sanitized_name}' not found. Continuing...")
        except Exception as e:
            print(f"⚠️ Attempt with sanitized name '{sanitized_name}' failed: {e}")

    # Method 5: Use the 'start' command (for anything in PATH or registered with the OS)
    try:
        subprocess.Popen(f'start "" "{app_name}"', shell=True)
        print(f"✅ Attempted to open '{app_name}' via the 'start' command. This is often successful for registered apps or items in PATH.")
        # This command doesn't block or easily confirm success, so we assume it works if no error is thrown.
        return
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
                return
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
                            return
                        except Exception as e:
                            print(f"⚠️ Failed to launch {match} from uninstall string: {e}")
    except Exception as e:
        print(f"⚠️ winapps search failed: {e}")
    
    print(f"❌ All generic methods failed. Could not open application '{app_name}'.")
    return f"Sorry, I couldn't find an application named {app_name} to open."

def close_app(app_name):
    """Close an application by its name."""
    if sys.platform != "win32":
        print("❌ This function is only supported on Windows.")
        return "Sorry, this function only works on Windows."

    app_lower = app_name.lower()
    
    # Dictionary mapping friendly names to process executable names
    app_to_process = {
        # Browsers
        "chrome": "chrome.exe",
        "google chrome": "chrome.exe",
        "firefox": "firefox.exe",
        "mozilla firefox": "firefox.exe",
        "edge": "msedge.exe",
        "microsoft edge": "msedge.exe",
        # Dev tools
        "vscode": "Code.exe",
        "visual studio code": "Code.exe",
        "visual studio": "devenv.exe",
        # Office
        "word": "WINWORD.EXE",
        "excel": "EXCEL.EXE",
        "powerpoint": "POWERPNT.EXE",
        "outlook": "OUTLOOK.EXE",
        # Communication
        "discord": "Discord.exe",
        "slack": "slack.exe",
        "teams": "ms-teams.exe",
        "microsoft teams": "ms-teams.exe",
        # Entertainment
        "spotify": "Spotify.exe",
        "steam": "steam.exe",
        # System tools
        "file explorer": "explorer.exe", # Note: closing explorer.exe will restart the shell.
        "explorer": "explorer.exe",
        "task manager": "Taskmgr.exe",
        "notepad": "notepad.exe",
        "paint": "mspaint.exe",
        "command prompt": "cmd.exe",
        "powershell": "powershell.exe",
        "calculator": "CalculatorApp.exe", 
        "snipping tool": "SnippingTool.exe",
    }
    
    process_name = app_to_process.get(app_lower)
    
    if not process_name:
        # If not in our list, guess the process name by removing spaces and adding .exe
        sanitized_name = app_lower.replace(' ', '')
        process_name = sanitized_name + ".exe"
        print(f"ℹ️ App '{app_name}' not in known list. Guessing process name is '{process_name}'...")
    
    try:
        command = f'taskkill /F /IM "{process_name}"'
        # Run the command. check=False because we want to handle non-zero exit codes manually.
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
        
        # taskkill exit code 0 means success.
        # exit code 128 means process not found.
        if result.returncode == 0:
            print(f"✅ Successfully closed '{app_name}' (process: {process_name}).")
            return
            return
        elif result.returncode == 128 or "not found" in result.stderr.lower():
            print(f"ℹ️ Application '{app_name}' (process: {process_name}) was not running or could not be found with that name.")
            return f"{app_name} wasn't running, so I couldn't close it."
        else:
            # Another error occurred
            print(f"❌ Failed to close '{app_name}'. Command failed with exit code {result.returncode} and error: {result.stderr.strip()}")
            return f"Sorry, I ran into an error trying to close {app_name}."
            
    except Exception as e:
        print(f"❌ An unexpected error occurred while trying to close '{app_name}': {e}")
        return f"An unexpected error occurred while trying to close {app_name}."

def media_play():
    """Presses the play/pause media key to play media."""
    try:
        pyautogui.press("playpause")
        return "Media resumed"
    except Exception as e:
        return f"Failed to play media: {e}"

def media_pause():
    """Presses the play/pause media key to pause media."""
    try:
        pyautogui.press("playpause")
        return "Media paused"
    except Exception as e:
        return f"Failed to pause media: {e}"

def media_next():
    """Presses the next track media key."""
    try:
        pyautogui.press("nexttrack")
        return "Skipped to next track"
    except Exception as e:
        return f"Failed to skip track: {e}"

def media_previous():
    """Presses the previous track media key."""
    try:
        pyautogui.press("prevtrack")
        return "Skipped to previous track"
    except Exception as e:
        return f"Failed to go to previous track: {e}"

def afk(duration_minutes: int = 30, movement_interval: int = 30):
    """Start AFK macro to prevent being kicked from games."""
    macros.afk(duration_minutes, movement_interval)
    return 

def stop_afk():
    """Stop AFK macro."""
    macros.stop_afk()
    return 

def type_chat(message: str, delay: float = 0.05):
    """Type a message in game chat."""
    macros.type_chat(message, delay)
    return 

def spam_chat(message: str, count: int = 5, interval: float = 1.0):
    """Spam a message multiple times in chat."""
    macros.spam_chat(message, count, interval)
    return 

def add_chat_message(message: str):
    """Add a custom message to the chat message pool."""
    macros.add_chat_message(message)
    return 

def type_csgo_chat(message: str, delay: float = 0.05, team_chat: bool = True):
    """Type a message in CSGO chat (defaults to team chat with U key)."""
    macros.type_csgo_chat(message, delay, team_chat)
    return 

def type_ai_message(context: str = "general", delay: float = 0.05, team_chat: bool = True):
    """Generate and type an AI message."""
    message = macros.type_ai_message(context, delay, team_chat)
    return 

def list_steam_games():
    """List all installed Steam games."""
    steam_games = _find_steam_games()
    
    if not steam_games:
        return "No Steam games found. Make sure Steam is installed and you have games in your library."
    
    game_list = []
    for game_info in steam_games.values():
        game_list.append(game_info['name'])
    
    # Sort alphabetically
    game_list.sort()
    
    result = f"Found {len(game_list)} Steam games:\n"
    for i, game in enumerate(game_list, 1):
        result += f"{i}. {game}\n"
    
    print(result)
    return result

if __name__ == "__main__":
    print("TESTING!")
