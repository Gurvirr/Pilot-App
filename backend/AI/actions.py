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
    



def open_app(app_name):
    """Open an application by its name."""
    print(f"Attempting to open application: {app_name}")
    
    try:        # Method 1: Try using winapps to find app install location (winapps can't launch directly!)
        installed_apps = winapps.list_installed()
        
        # Search for app by name (case-insensitive, partial match)
        for app in installed_apps:
            if app_name.lower() in app.name.lower():
                print(f"Found app: {app.name}")
                
                # winapps doesn't have start() method! We need to find the exe manually
                exe_path = None
                
                # Try to get exe from install_location
                if hasattr(app, 'install_location') and app.install_location:
                    install_dir = app.install_location
                    print(f"Install location: {install_dir}")
                    
                    # Look for exe files in install directory
                    if os.path.exists(install_dir):
                        for file in os.listdir(install_dir):
                            if file.lower().endswith('.exe') and app_name.lower() in file.lower():
                                exe_path = os.path.join(install_dir, file)
                                break
                
                # Try to extract exe from uninstall_string
                if not exe_path and hasattr(app, 'uninstall_string') and app.uninstall_string:
                    uninstall = app.uninstall_string
                    # Look for exe files that aren't uninstallers
                    import re
                    exe_matches = re.findall(r'"([^"]*\.exe)"', uninstall)
                    for match in exe_matches:
                        if 'uninstall' not in match.lower() and os.path.exists(match):
                            exe_path = match
                            break
                
                # Try to launch the found executable
                if exe_path:
                    try:
                        subprocess.Popen(f'"{exe_path}"', shell=True)
                        print(f"✅ Opened {app.name} via {exe_path}")
                        return True
                    except Exception as e:
                        print(f"⚠️ Failed to launch {exe_path}: {e}")
                
                # If no exe found, try generic approach
                try:
                    subprocess.Popen(f'start "" "{app.name}"', shell=True)
                    print(f"✅ Attempted to open {app.name} via Windows start")
                    return True
                except Exception as e:
                    print(f"⚠️ Windows start failed: {e}")# Method 2: Try common executable names and specific paths
        common_apps = {
            "notepad": "notepad.exe",
            "calculator": "calc.exe", 
            "paint": "mspaint.exe",
            "chrome": "chrome.exe",
            "firefox": "firefox.exe",
            "edge": "msedge.exe",
            "spotify": "Spotify.exe",
            "steam": "steam.exe",
            "vscode": "Code.exe",
            "visual studio code": "Code.exe"
        }
        
        app_lower = app_name.lower()
        if app_lower in common_apps:
            executables = common_apps[app_lower]
            if isinstance(executables, str):
                executables = [executables]
            
            # Try each possible executable
            for exe in executables:
                try:
                    subprocess.Popen(exe, shell=True)
                    print(f"✅ Opened {app_name} via {exe}")
                    return True
                except Exception as e:
                    print(f"⚠️ Failed to open {exe}: {e}")
                    continue
        
        # Method 3: Discord-specific handling (Discord is tricky!)
        if "discord" in app_lower:
            print("🔍 Trying Discord-specific methods...")
            
            # Try Discord protocol first (most reliable)
            try:
                webbrowser.open("discord://")
                print("✅ Opened Discord via discord:// protocol")
                return True
            except Exception as e:
                print(f"⚠️ Discord protocol failed: {e}")
            
            # Try finding Discord in common install locations
            discord_locations = [
                os.path.expanduser("~/AppData/Local/Discord/Update.exe"),
                os.path.expanduser("~/AppData/Local/DiscordCanary/Update.exe"),
                os.path.expanduser("~/AppData/Local/DiscordPTB/Update.exe"),
            ]
            
            for location in discord_locations:
                if os.path.exists(location):
                    try:
                        # Use Update.exe with proper arguments to start Discord
                        cmd = f'"{location}" --processStart Discord.exe'
                        subprocess.Popen(cmd, shell=True)
                        print(f"✅ Opened Discord via {location}")
                        return True
                    except Exception as e:
                        print(f"⚠️ Failed to start Discord from {location}: {e}")
            
            # Try Windows Store version
            try:
                subprocess.Popen('start shell:AppsFolder\\53906AA0BD52.Discord_jskdnn29hfhwk!Discord', shell=True)
                print("✅ Opened Discord (Windows Store version)")
                return True
            except Exception as e:
                print(f"⚠️ Windows Store Discord failed: {e}")
            
            print("❌ Could not find Discord installation")
            return False
        
        # Method 4: Try opening via start command (Windows)
        try:
            subprocess.Popen(f'start "" "{app_name}"', shell=True)
            print(f"✅ Attempted to open {app_name} via start command")
            return True
        except Exception as e:
            print(f"❌ Start command failed: {e}")
        
        print(f"❌ Application {app_name} not found.")
        print("Available applications:")
        for app in installed_apps[:10]:  # Show first 10 apps
            print(f"  - {app.name}")
        return False
        
    except Exception as e:
        print(f"❌ Error opening {app_name}: {e}")
        return False
    
