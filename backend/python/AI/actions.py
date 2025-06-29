import os
import pyautogui
import datetime
import sys
if sys.platform == "win32":
    import win32api
    import win32con
    import winapps

import subprocess
import re
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

# Disable pyautogui failsafe for media keys
pyautogui.FAILSAFE = False

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
    """Open an application by its name using a multi-pronged, platform-aware approach."""
    print(f"Attempting to open application: '{app_name}'")
    app_lower = app_name.lower()

    # First, check if it's a Steam game (cross-platform)
    steam_result = _launch_steam_game(app_name)
    if "Launched" in steam_result or "Could not find Steam game" not in steam_result:
        return steam_result

    # Method 1: URI Schemes (cross-platform)
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

    # Platform-specific methods
    if sys.platform == "win32":
        return _open_app_windows(app_name, app_lower)
    elif sys.platform == "darwin":
        return _open_app_macos(app_name, app_lower)
    elif sys.platform.startswith("linux"):
        return _open_app_linux(app_name, app_lower)
    else:
        print(f"❌ Unsupported platform: {sys.platform}")
        return f"Sorry, opening apps is not supported on {sys.platform}."

def _open_app_windows(app_name, app_lower):
    """Windows-specific app opening logic."""
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

    # Method 4: If the app name has spaces, try a sanitized version
    if ' ' in app_name:
        sanitized_name = app_name.replace(' ', '')
        try:
            subprocess.Popen(sanitized_name, shell=True)
            print(f"✅ Launched '{app_name}' by sanitizing its name to '{sanitized_name}'.")
            return
        except FileNotFoundError:
            print(f"ℹ️ Sanitized name '{sanitized_name}' not found. Continuing...")
        except Exception as e:
            print(f"⚠️ Attempt with sanitized name '{sanitized_name}' failed: {e}")

    # Method 5: Use the 'start' command
    try:
        subprocess.Popen(f'start "" "{app_name}"', shell=True)
        print(f"✅ Attempted to open '{app_name}' via the 'start' command.")
        return
    except Exception as e:
        print(f"ℹ️ The 'start' command failed for '{app_name}': {e}. Trying final methods.")

    # Method 6: Use winapps to find app in the registry
    try:
        for app in winapps.search_installed(app_name):
            print(f"Found app via winapps: {app.name}")
            try:
                subprocess.Popen(f'start "" "{app.name}"', shell=True)
                print(f"✅ Attempting to launch registered app '{app.name}' via 'start'.")
                return
            except Exception as e:
                print(f"ℹ️ 'start' command failed for winapps result '{app.name}': {e}.")

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
    
    print(f"❌ All Windows methods failed. Could not open application '{app_name}'.")
    return f"Sorry, I couldn't find an application named {app_name} to open."

def _open_app_macos(app_name, app_lower):
    """macOS-specific app opening logic."""
    # Method 1: Try opening via 'open' command with .app extension
    try:
        subprocess.Popen(['open', '-a', app_name])
        print(f"✅ Opened '{app_name}' via 'open -a' command.")
        return
    except Exception as e:
        print(f"ℹ️ 'open -a' failed for '{app_name}': {e}")

    # Method 2: Common system applications
    system_apps = {
        "finder": "Finder",
        "safari": "Safari",
        "terminal": "Terminal",
        "activity monitor": "Activity Monitor",
        "calculator": "Calculator",
        "textedit": "TextEdit",
        "preview": "Preview",
        "system preferences": "System Preferences",
        "app store": "App Store",
        "mail": "Mail",
        "calendar": "Calendar",
        "contacts": "Contacts",
        "notes": "Notes",
        "reminders": "Reminders",
        "maps": "Maps",
        "photos": "Photos",
        "facetime": "FaceTime",
        "messages": "Messages",
    }
    
    if app_lower in system_apps:
        try:
            subprocess.Popen(['open', '-a', system_apps[app_lower]])
            print(f"✅ Opened system app '{app_name}' via '{system_apps[app_lower]}'.")
            return
        except Exception as e:
            print(f"⚠️ Failed to open system app '{app_name}': {e}")

    # Method 3: Try with common app name variations
    app_variations = [
        app_name,
        app_name.title(),
        app_name.capitalize(),
        app_name.replace(' ', ''),
        app_name.replace(' ', '-'),
    ]
    
    for variation in app_variations:
        try:
            subprocess.Popen(['open', '-a', variation])
            print(f"✅ Opened '{app_name}' using variation '{variation}'.")
            return
        except Exception as e:
            continue

    print(f"❌ All macOS methods failed. Could not open application '{app_name}'.")
    return f"Sorry, I couldn't find an application named {app_name} to open."

def _open_app_linux(app_name, app_lower):
    """Linux-specific app opening logic."""
    # Method 1: Try direct command execution
    try:
        subprocess.Popen([app_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"✅ Launched '{app_name}' directly.")
        return
    except FileNotFoundError:
        print(f"ℹ️ '{app_name}' not found in PATH. Trying other methods...")
    except Exception as e:
        print(f"ℹ️ Direct launch failed for '{app_name}': {e}")

    # Method 2: Common Linux applications and their command names
    linux_apps = {
        "firefox": "firefox",
        "chrome": "google-chrome",
        "google chrome": "google-chrome",
        "chromium": "chromium-browser",
        "file manager": "nautilus",
        "files": "nautilus",
        "nautilus": "nautilus",
        "terminal": "gnome-terminal",
        "calculator": "gnome-calculator",
        "text editor": "gedit",
        "gedit": "gedit",
        "code": "code",
        "vscode": "code",
        "visual studio code": "code",
        "gimp": "gimp",
        "libreoffice": "libreoffice",
        "writer": "libreoffice --writer",
        "calc": "libreoffice --calc",
        "impress": "libreoffice --impress",
        "thunderbird": "thunderbird",
        "vlc": "vlc",
        "system monitor": "gnome-system-monitor",
        "settings": "gnome-control-center",
        "software": "gnome-software",
    }
    
    if app_lower in linux_apps:
        try:
            cmd = linux_apps[app_lower].split()
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✅ Launched Linux app '{app_name}' via command '{linux_apps[app_lower]}'.")
            return
        except Exception as e:
            print(f"⚠️ Failed to launch Linux app '{app_name}': {e}")

    # Method 3: Try with common name variations
    app_variations = [
        app_lower,
        app_lower.replace(' ', '-'),
        app_lower.replace(' ', '_'),
        app_lower.replace(' ', ''),
    ]
    
    for variation in app_variations:
        try:
            subprocess.Popen([variation], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✅ Launched '{app_name}' using variation '{variation}'.")
            return
        except FileNotFoundError:
            continue
        except Exception as e:
            continue

    # Method 4: Try using desktop file approach
    try:
        # Look for .desktop files in common locations
        desktop_dirs = [
            '/usr/share/applications',
            '/usr/local/share/applications',
            os.path.expanduser('~/.local/share/applications')
        ]
        
        for desktop_dir in desktop_dirs:
            if os.path.exists(desktop_dir):
                for filename in os.listdir(desktop_dir):
                    if filename.endswith('.desktop'):
                        desktop_file = os.path.join(desktop_dir, filename)
                        try:
                            with open(desktop_file, 'r') as f:
                                content = f.read()
                                if app_lower in content.lower():
                                    subprocess.Popen(['gtk-launch', filename[:-8]], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                                    print(f"✅ Launched '{app_name}' via desktop file '{filename}'.")
                                    return
                        except Exception:
                            continue
    except Exception as e:
        print(f"ℹ️ Desktop file search failed: {e}")

    print(f"❌ All Linux methods failed. Could not open application '{app_name}'.")
    return f"Sorry, I couldn't find an application named {app_name} to open."

def close_app(app_name):
    """Close an application by its name using platform-specific methods."""
    print(f"Attempting to close application: '{app_name}'")
    app_lower = app_name.lower()

    # Platform-specific methods
    if sys.platform == "win32":
        return _close_app_windows(app_name, app_lower)
    elif sys.platform == "darwin":
        return _close_app_macos(app_name, app_lower)
    elif sys.platform.startswith("linux"):
        return _close_app_linux(app_name, app_lower)
    else:
        print(f"❌ Unsupported platform: {sys.platform}")
        return f"Sorry, closing apps is not supported on {sys.platform}."

def _close_app_windows(app_name, app_lower):
    """Windows-specific app closing logic."""
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
        "file explorer": "explorer.exe",
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
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
        
        if result.returncode == 0:
            print(f"✅ Successfully closed '{app_name}' (process: {process_name}).")
            return
        elif result.returncode == 128 or "not found" in result.stderr.lower():
            print(f"ℹ️ Application '{app_name}' (process: {process_name}) was not running.")
            return f"{app_name} wasn't running, so I couldn't close it."
        else:
            print(f"❌ Failed to close '{app_name}'. Error: {result.stderr.strip()}")
            return f"Sorry, I ran into an error trying to close {app_name}."
            
    except Exception as e:
        print(f"❌ An unexpected error occurred while trying to close '{app_name}': {e}")
        return f"An unexpected error occurred while trying to close {app_name}."

def _close_app_macos(app_name, app_lower):
    """macOS-specific app closing logic."""
    # Dictionary mapping friendly names to app bundle names
    app_to_bundle = {
        "safari": "Safari",
        "chrome": "Google Chrome",
        "google chrome": "Google Chrome",
        "firefox": "Firefox",
        "finder": "Finder",
        "terminal": "Terminal",
        "activity monitor": "Activity Monitor",
        "calculator": "Calculator",
        "textedit": "TextEdit",
        "preview": "Preview",
        "system preferences": "System Preferences",
        "app store": "App Store",
        "mail": "Mail",
        "calendar": "Calendar",
        "contacts": "Contacts",
        "notes": "Notes",
        "reminders": "Reminders",
        "maps": "Maps",
        "photos": "Photos",
        "facetime": "FaceTime",
        "messages": "Messages",
        "vscode": "Visual Studio Code",
        "visual studio code": "Visual Studio Code",
        "discord": "Discord",
        "slack": "Slack",
        "spotify": "Spotify",
    }
    
    bundle_name = app_to_bundle.get(app_lower, app_name)
    
    try:
        # Use AppleScript to quit the application gracefully
        script = f'tell application "{bundle_name}" to quit'
        result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Successfully closed '{app_name}' via AppleScript.")
            return
        else:
            print(f"ℹ️ AppleScript failed for '{app_name}': {result.stderr.strip()}")
            
    except Exception as e:
        print(f"ℹ️ AppleScript method failed for '{app_name}': {e}")
    
    # Fallback: Try to kill the process using pkill
    try:
        process_name = bundle_name.lower().replace(' ', '')
        result = subprocess.run(['pkill', '-f', process_name], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Successfully killed process for '{app_name}'.")
            return
        else:
            print(f"ℹ️ No running process found for '{app_name}'.")
            return f"{app_name} wasn't running, so I couldn't close it."
            
    except Exception as e:
        print(f"❌ Failed to close '{app_name}': {e}")
        return f"Sorry, I couldn't close {app_name}."

def _close_app_linux(app_name, app_lower):
    """Linux-specific app closing logic."""
    # Dictionary mapping friendly names to process names
    app_to_process = {
        "firefox": "firefox",
        "chrome": "chrome",
        "google chrome": "chrome",
        "chromium": "chromium",
        "file manager": "nautilus",
        "files": "nautilus",
        "nautilus": "nautilus",
        "terminal": "gnome-terminal",
        "calculator": "gnome-calculator",
        "text editor": "gedit",
        "gedit": "gedit",
        "code": "code",
        "vscode": "code",
        "visual studio code": "code",
        "gimp": "gimp",
        "libreoffice": "libreoffice",
        "writer": "libreoffice",
        "calc": "libreoffice",
        "impress": "libreoffice",
        "thunderbird": "thunderbird",
        "vlc": "vlc",
        "system monitor": "gnome-system-monitor",
        "settings": "gnome-control-center",
        "software": "gnome-software",
        "discord": "discord",
        "slack": "slack",
        "spotify": "spotify",
    }
    
    process_name = app_to_process.get(app_lower)
    
    if not process_name:
        # Try various name variations
        process_variations = [
            app_lower,
            app_lower.replace(' ', '-'),
            app_lower.replace(' ', '_'),
            app_lower.replace(' ', ''),
        ]
        process_name = process_variations[0]  # Start with the first variation
    else:
        process_variations = [process_name]
    
    # Try to close gracefully first (SIGTERM)
    for variation in process_variations:
        try:
            result = subprocess.run(['pkill', '-f', variation], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Successfully sent SIGTERM to '{app_name}' (process: {variation}).")
                return
        except Exception as e:
            continue
    
    # If graceful close didn't work, try force kill (SIGKILL)
    for variation in process_variations:
        try:
            result = subprocess.run(['pkill', '-9', '-f', variation], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Successfully force-killed '{app_name}' (process: {variation}).")
                return
        except Exception as e:
            continue
    
    # Try using killall as a fallback
    for variation in process_variations:
        try:
            result = subprocess.run(['killall', variation], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Successfully killed '{app_name}' via killall (process: {variation}).")
                return
        except Exception as e:
            continue
    
    print(f"ℹ️ No running process found for '{app_name}' or unable to terminate it.")
    return f"{app_name} wasn't running, so I couldn't close it."

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
    