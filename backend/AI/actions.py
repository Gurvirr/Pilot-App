import os
import pyautogui

def screenshot():
    """Take a screenshot and save it to the folder."""
    screenshot_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Screenshots", "screenshot.png")
    pyautogui.screenshot(screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")
    

