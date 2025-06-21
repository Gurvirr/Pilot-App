import psutil
import platform
import json
import subprocess

def get_cpu_temp_macos():
    try:
        # This command requires the 'osx-cpu-temp' utility.
        # Install with: brew install osx-cpu-temp
        output = subprocess.check_output(["osx-cpu-temp"]).decode().strip()
        return float(output.replace("°C", ""))
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback if the utility isn't installed or fails
        return None

def get_sys_info():
    system = platform.system()
    temp = None
    if system == "Darwin":
        temp = get_cpu_temp_macos()

    info = {
        "cpu_usage_percent": psutil.cpu_percent(interval=1),
        "ram_usage_percent": psutil.virtual_memory().percent,
        "ram_used_mb": round(psutil.virtual_memory().used / 1024 / 1024, 1),
        "ram_total_mb": round(psutil.virtual_memory().total / 1024 / 1024, 1),
        "cpu_temp_c": temp,
        "platform": system
    }
    return info

if __name__ == "__main__":
    print(json.dumps(get_sys_info())) 