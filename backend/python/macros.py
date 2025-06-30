import pyautogui
import time
import random
import threading
from pynput import mouse
from pynput.keyboard import Key, Controller
from typing import List

# Configure pyautogui for safety
pyautogui.FAILSAFE = True  # Move mouse to corner to stop
pyautogui.PAUSE = 0.1  # Small delay between actions

# Initialize keyboard controller for real key inputs
keyboard_controller = Controller()

class MacroManager:
    def __init__(self):
        self.afk_running = False
        self.afk_thread = None
        self.chat_messages = [
            "gg",
            "nice shot!",
            "good game",
            "wp",
            "well played",
            "thanks",
            "ty",
            "glhf",
            "good luck have fun",
            "ez",
            "too easy",
            "unlucky",
            "close one",
            "almost",
            "nice try",
            "team work",
            "let's go",
            "push",
            "rotate",
            "rush"
        ]
        # CSGO-specific messages
        self.csgo_messages = [
            "rush b",
            "rush a",
            "rotate",
            "push mid",
            "smoke",
            "flash",
            "nade",
            "eco",
            "save",
            "plant",
            "defuse",
            "bomb down",
            "enemy spotted",
            "need backup",
            "cover me",
            "going long",
            "going short",
            "check corners",
            "watch flank",
            "nice clutch",
            "good call",
            "strat worked",
            "next time",
            "unlucky round",
            "we got this",
            "focus up",
            "stay positive",
            "good communication",
            "nice trade",
            "good crossfire"
        ]
        # AI-generated message templates
        self.ai_message_templates = [
            "That was a {adjective} play!",
            "Great {action} by the team!",
            "We need to {strategy} next round.",
            "Nice {skill} there!",
            "Let's {tactic} this time.",
            "Good {communication} everyone!",
            "That {situation} was {adjective}!",
            "We should {plan} for the win.",
            "Amazing {performance} by {player_type}!",
            "Time to {strategy} and {objective}!"
        ]
        
        # Word banks for AI message generation
        self.word_banks = {
            "adjective": ["amazing", "incredible", "clutch", "sick", "clean", "smooth", "perfect", "beautiful", "insane", "crazy"],
            "action": ["rotation", "push", "trade", "clutch", "defuse", "plant", "save", "eco", "rush"],
            "strategy": ["rush", "slow play", "split", "fake", "rotate", "save", "eco", "force buy"],
            "skill": ["aim", "crosshair placement", "game sense", "positioning", "timing", "communication"],
            "tactic": ["split", "rush", "fake", "slow play", "rotate", "save"],
            "communication": ["calls", "info", "communication", "teamwork", "coordination"],
            "situation": ["clutch", "1v1", "retake", "execute", "defense", "attack"],
            "plan": ["focus", "communicate", "coordinate", "execute", "adapt"],
            "performance": ["clutch", "frag", "trade", "support", "entry"],
            "player_type": ["entry fragger", "support", "lurker", "IGL", "AWPer"],
            "objective": ["win", "clutch", "defuse", "plant", "survive"]
        }
    
    def afk(self, duration_minutes: int = 30, movement_interval: int = 30):
        """
        Run AFK macro to prevent being kicked from games.
        
        Args:
            duration_minutes: How long to run the AFK macro (default 30 minutes)
            movement_interval: How often to move (default 30 seconds)
        """
        if self.afk_running:
            print("AFK macro is already running!")
            return
        
        self.afk_running = True
        self.afk_thread = threading.Thread(
            target=self._afk_loop, 
            args=(duration_minutes, movement_interval)
        )
        self.afk_thread.daemon = True
        self.afk_thread.start()
        print(f"AFK macro started for {duration_minutes} minutes")
    
    def _afk_loop(self, duration_minutes: int, movement_interval: int):
        """Internal AFK loop that runs in a separate thread."""
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        while self.afk_running and time.time() < end_time:
            try:
                # Random movement patterns using real OS inputs
                self._random_movement()
                
                # Wait for next movement
                time.sleep(movement_interval)
                
            except KeyboardInterrupt:
                print("AFK macro interrupted")
                break
        
        self.afk_running = False
        print("AFK macro finished")
    
    def _random_movement(self):
        """Perform simple WASD movement patterns for AFK."""
        # Simple WASD movement patterns
        movements = [
            # Forward
            lambda: self._real_key_press('w'),
            # Backward
            lambda: self._real_key_press('s'),
            # Left
            lambda: self._real_key_press('a'),
            # Right
            lambda: self._real_key_press('d'),
            # Diagonal movements
            lambda: self._real_key_combination(['w', 'a']),
            lambda: self._real_key_combination(['w', 'd']),
            lambda: self._real_key_combination(['s', 'a']),
            lambda: self._real_key_combination(['s', 'd']),
            # Circle patterns
            lambda: self._move_in_circle(),
            # Small random movement
            lambda: self._real_key_press(random.choice(['w', 'a', 's', 'd']))
        ]
        
        # Choose random movement
        movement = random.choice(movements)
        movement()
    
    def _move_in_circle(self):
        """Move in a circle pattern using WASD."""
        try:
            # Circle pattern: W -> D -> S -> A (clockwise)
            circle_keys = ['w', 'd', 's', 'a']
            for key in circle_keys:
                keyboard_controller.press(key)
                time.sleep(0.2)  # Hold each key briefly
                keyboard_controller.release(key)
                time.sleep(0.1)
        except Exception as e:
            print(f"Circle movement error: {e}")
    
    def _real_mouse_move(self, dx: int, dy: int):
        """Real mouse movement using pynput."""
        try:
            with mouse.Controller() as mouse_controller:
                current_pos = mouse_controller.position
                new_pos = (current_pos[0] + dx, current_pos[1] + dy)
                mouse_controller.position = new_pos
                time.sleep(0.1)
        except Exception as e:
            print(f"Mouse movement error: {e}")
    
    def _real_mouse_click(self):
        """Real mouse click using pynput."""
        try:
            with mouse.Controller() as mouse_controller:
                mouse_controller.click(mouse.Button.left)
                time.sleep(0.1)
        except Exception as e:
            print(f"Mouse click error: {e}")
    
    def _real_right_click(self):
        """Real right mouse click using pynput."""
        try:
            with mouse.Controller() as mouse_controller:
                mouse_controller.click(mouse.Button.right)
                time.sleep(0.1)
        except Exception as e:
            print(f"Right click error: {e}")
    
    def _real_double_click(self):
        """Real double click using pynput."""
        try:
            with mouse.Controller() as mouse_controller:
                mouse_controller.click(mouse.Button.left, 2)
                time.sleep(0.1)
        except Exception as e:
            print(f"Double click error: {e}")
    
    def _real_mouse_drag(self):
        """Real mouse drag using pynput."""
        try:
            with mouse.Controller() as mouse_controller:
                start_pos = mouse_controller.position
                end_pos = (start_pos[0] + random.randint(-50, 50), start_pos[1] + random.randint(-50, 50))
                
                mouse_controller.press(mouse.Button.left)
                time.sleep(0.1)
                mouse_controller.position = end_pos
                time.sleep(0.1)
                mouse_controller.release(mouse.Button.left)
        except Exception as e:
            print(f"Mouse drag error: {e}")
    
    def _real_scroll(self, dy: int):
        """Real scroll wheel using pynput."""
        try:
            with mouse.Controller() as mouse_controller:
                mouse_controller.scroll(0, dy)
                time.sleep(0.1)
        except Exception as e:
            print(f"Scroll error: {e}")
    
    def _real_key_press(self, key: str):
        """Real key press using pynput."""
        try:
            # Map string keys to pynput Key objects
            key_map = {
                'w': 'w', 'a': 'a', 's': 's', 'd': 'd',
                'space': Key.space, 'shift': Key.shift,
                'ctrl': Key.ctrl, 'alt': Key.alt, 'tab': Key.tab,
                'enter': Key.enter, 'esc': Key.esc
            }
            
            key_to_press = key_map.get(key, key)
            keyboard_controller.press(key_to_press)
            time.sleep(0.05)
            keyboard_controller.release(key_to_press)
            time.sleep(0.1)
        except Exception as e:
            print(f"Key press error: {e}")
    
    def _real_key_combination(self, keys: List[str]):
        """Real key combination using pynput."""
        try:
            key_map = {
                'w': 'w', 'a': 'a', 's': 's', 'd': 'd',
                'space': Key.space, 'shift': Key.shift,
                'ctrl': Key.ctrl, 'alt': Key.alt, 'tab': Key.tab,
                'enter': Key.enter, 'esc': Key.esc
            }
            
            # Press all keys
            for key in keys:
                key_to_press = key_map.get(key, key)
                keyboard_controller.press(key_to_press)
                time.sleep(0.05)
            
            # Release all keys in reverse order
            for key in reversed(keys):
                key_to_press = key_map.get(key, key)
                keyboard_controller.release(key_to_press)
                time.sleep(0.05)
            
            time.sleep(0.1)
        except Exception as e:
            print(f"Key combination error: {e}")
    
    def _real_move_and_return(self, original_x: int, original_y: int):
        """Move to a random position and return to original using real OS inputs."""
        try:
            with mouse.Controller() as mouse_controller:
                # Move to random position
                random_x = random.randint(100, 800)
                random_y = random.randint(100, 600)
                mouse_controller.position = (random_x, random_y)
                time.sleep(0.2)
                
                # Return to original position
                mouse_controller.position = (original_x, original_y)
                time.sleep(0.1)
        except Exception as e:
            print(f"Move and return error: {e}")
    
    def stop_afk(self):
        """Stop the AFK macro."""
        self.afk_running = False
        if self.afk_thread and self.afk_thread.is_alive():
            self.afk_thread.join(timeout=1)
        print("AFK macro stopped")
    
    def type_in_chat(self, message: str, delay: float = 0.05, use_team_chat: bool = False):
        """
        Type a message in game chat using real OS key inputs.
        
        Args:
            message: Message to type
            delay: Delay between characters (default 0.05 seconds)
            use_team_chat: Use team chat (U key) instead of all chat (Enter key)
        """
        try:
            # Press appropriate key to open chat
            if use_team_chat:
                # Use 'U' key for team chat (CSGO, Valorant, etc.)
                keyboard_controller.press('u')
                time.sleep(0.1)
                keyboard_controller.release('u')
            else:
                # Use Enter key for all chat
                keyboard_controller.press(Key.enter)
                time.sleep(0.1)
                keyboard_controller.release(Key.enter)
            
            time.sleep(0.1)
            
            # Type the message using real OS input
            for char in message:
                keyboard_controller.press(char)
                time.sleep(delay)
                keyboard_controller.release(char)
                time.sleep(delay)
            
            time.sleep(0.1)
            
            # Press Enter to send - using real OS input
            keyboard_controller.press(Key.enter)
            time.sleep(0.1)
            keyboard_controller.release(Key.enter)
            
            chat_type = "team chat" if use_team_chat else "all chat"
            print(f"Typed in {chat_type}: {message}")
            
        except Exception as e:
            print(f"Error typing in chat: {e}")
    
    def type_csgo_chat(self, message: str, delay: float = 0.05, team_chat: bool = True):
        """
        Type a message in CSGO chat (defaults to team chat with U key).
        
        Args:
            message: Message to type
            delay: Delay between characters
            team_chat: Use team chat (U key) if True, all chat (Enter) if False
        """
        self.type_in_chat(message, delay, use_team_chat=team_chat)
    
    def generate_ai_message(self, context: str = "general") -> str:
        """
        Generate a custom AI message based on context and templates.
        
        Args:
            context: Context for message generation (e.g., "clutch", "win", "loss", "general")
        
        Returns:
            Generated message string
        """
        try:
            # Choose a random template
            template = random.choice(self.ai_message_templates)
            
            # Fill in the template with random words from word banks
            message = template
            for placeholder, word_list in self.word_banks.items():
                if f"{{{placeholder}}}" in message:
                    message = message.replace(f"{{{placeholder}}}", random.choice(word_list))
            
            # Add context-specific modifications
            if context == "clutch":
                message = f"Clutch time! {message}"
            elif context == "win":
                message = f"GG! {message}"
            elif context == "loss":
                message = f"Unlucky round. {message}"
            elif context == "team":
                message = f"Team: {message}"
            
            return message
            
        except Exception as e:
            print(f"Error generating AI message: {e}")
            return random.choice(self.csgo_messages)
    
    def type_ai_message(self, context: str = "general", delay: float = 0.05, team_chat: bool = True):
        """
        Generate and type an AI message.
        
        Args:
            context: Context for message generation
            delay: Delay between characters
            team_chat: Use team chat (U key) if True, all chat (Enter) if False
        """
        message = self.generate_ai_message(context)
        self.type_csgo_chat(message, delay, team_chat)
        return message
    
    def spam_chat(self, message: str, count: int = 5, interval: float = 1.0):
        """
        Spam a message multiple times using real OS inputs.
        
        Args:
            message: Message to spam
            count: Number of times to send
            interval: Time between messages
        """
        print(f"Spamming '{message}' {count} times")
        for i in range(count):
            self.type_in_chat(message)
            if i < count - 1:  # Don't wait after the last message
                time.sleep(interval)

# Global macro manager instance
macro_manager = MacroManager()

# Convenience functions
def afk(duration_minutes: int = 30, movement_interval: int = 30):
    """Start AFK macro."""
    macro_manager.afk(duration_minutes, movement_interval)

def stop_afk():
    """Stop AFK macro."""
    macro_manager.stop_afk()

def type_chat(message: str, delay: float = 0.05):
    """Type a message in chat."""
    macro_manager.type_in_chat(message, delay, True)

def spam_chat(message: str, count: int = 5, interval: float = 1.0):
    """Spam a message."""
    macro_manager.spam_chat(message, count, interval)

def type_csgo_chat(message: str, delay: float = 0.05, team_chat: bool = True):
    """Type a message in CSGO chat (defaults to team chat with U key)."""
    macro_manager.type_csgo_chat(message, delay, team_chat)

def type_ai_message(context: str = "general", delay: float = 0.05, team_chat: bool = True):
    """Generate and type an AI message."""
    return macro_manager.type_ai_message(context, delay, team_chat)

# Example usage
if __name__ == "__main__":
    print("Testing macros...")
    time.sleep(2)
    
    # Test typing in chat
    type_chat("Hello from Pilot!")
    time.sleep(2)
    
    # Test spamming chat
    spam_chat("This is a test", count=3, interval=0.5)
