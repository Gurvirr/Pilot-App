import obsws_python as obs
import time
import os

def connect_to_obs():
    host = "localhost"
    port = 4455

    password = "yogurt"

    cl = obs.ReqClient(host=host, port=port, password=password)
    
    try:
        version = cl.get_version()
        print(f"Connected to OBS version: {version.obs_version}")
        return cl
    except Exception as e:
        print(f"Failed to connect to OBS: {e}")
        return None

def save_clip():
    cl = connect_to_obs()
    if not cl:
        return False
        
    try:
        cl.save_replay_buffer()
        print("✅ Clip saved!")
        return True
    except Exception as e:
        print(f"Error saving clip: {e}")
        return False

# Only run when executed directly
if __name__ == "__main__":
    connect_to_obs()
    save_clip()