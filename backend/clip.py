import obsws_python as obs
import time


# Change this if you modified it
host = "localhost"
port = 4455
password = "yogurt"  # Use the one you set in OBS

# Connect to OBS
cl = obs.ReqClient(host=host, port=port, password=password)

# Test connection
try:
    version = cl.get_version()
    print(f"Connected to OBS version: {version.obs_version}")
except Exception as e:
    print(f"Failed to connect to OBS: {e}")
    exit(1)

# Save the last X seconds
try:
    # First, let's check where recordings are saved
    try:
        record_dir = cl.get_record_directory()
        print(f"📁 Recording directory: {record_dir.record_directory}")
    except:
        print("📁 Could not get recording directory from OBS")
      # Check replay buffer status
    try:
        status = cl.get_replay_buffer_status()
        print(f"🔄 Replay buffer active: {status.output_active}")
    except:
        print("🔄 Could not get replay buffer status")
    
    # Check recording settings
    try:
        settings = cl.get_record_settings()
        print(f"🎥 Recording format: {settings.rec_format}")
        print(f"📂 Recording path: {settings.rec_filename}")
    except:
        print("🎥 Could not get recording settings")
    
    # Add a small delay to ensure recent activity is captured
    print("⏳ Waiting 2 seconds to ensure recent activity is captured...")
    time.sleep(2)
    
    cl.save_replay_buffer()
    print("✅ Clip saved!")
    
except Exception as e:
    print(f"Error with save_replay_buffer: {e}")
    # Try alternative method name
    try:
        cl.send("SaveReplayBuffer")
        print("✅ Clip saved with alternative method!")
        print("💡 Check your OBS recording folder (usually in Videos folder)")
    except Exception as e2:
        print(f"Error with alternative method: {e2}")
        print("Make sure replay buffer is enabled in OBS Settings > Output > Recording")