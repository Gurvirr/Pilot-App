#!/usr/bin/env python3
"""
Script to download and set up the Vosk model for speech-to-text functionality.
"""

import os
import sys
import requests
import zipfile
import shutil
from pathlib import Path

def download_vosk_model():
    """Download and extract the Vosk model for English speech recognition."""
    
    # Model URL for a lightweight English model
    model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    model_filename = "vosk-model-small-en-us-0.15.zip"
    
    backend_dir = Path(__file__).parent
    model_dir = backend_dir / "model"
    temp_dir = backend_dir / "temp_model"
    
    print("Setting up Vosk speech-to-text model...")
    
    # Create temporary directory
    temp_dir.mkdir(exist_ok=True)
    
    try:
        # Download the model
        print(f"Downloading Vosk model from {model_url}")
        print("This may take a few minutes depending on your internet connection...")
        
        response = requests.get(model_url, stream=True)
        response.raise_for_status()
        
        model_zip_path = temp_dir / model_filename
        
        with open(model_zip_path, 'wb') as f:
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}%", end='', flush=True)
        
        print("\nDownload complete. Extracting...")
        
        # Extract the model
        with zipfile.ZipFile(model_zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Find the extracted model directory
        extracted_dirs = [d for d in temp_dir.iterdir() if d.is_dir() and d.name.startswith('vosk-model')]
        
        if not extracted_dirs:
            raise Exception("Could not find extracted model directory")
        
        extracted_model_dir = extracted_dirs[0]
        
        # Remove existing model directory if it exists
        if model_dir.exists():
            print("Removing existing model directory...")
            shutil.rmtree(model_dir)
        
        # Move the extracted model to the correct location
        print("Installing model...")
        shutil.move(str(extracted_model_dir), str(model_dir))
        
        print("Model installation complete!")
        
        # Verify the model has the required files
        required_files = ['am/final.mdl', 'conf/mfcc.conf', 'conf/model.conf']
        missing_files = []
        
        for file_path in required_files:
            if not (model_dir / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            print(f"Warning: Some expected files are missing: {missing_files}")
        else:
            print("Model verification successful!")
        
    except Exception as e:
        print(f"Error setting up model: {e}")
        return False
        
    finally:
        # Clean up temporary directory
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
    
    return True

def verify_model():
    """Verify that the Vosk model is properly installed."""
    backend_dir = Path(__file__).parent
    model_dir = backend_dir / "model"
    
    if not model_dir.exists():
        return False
    
    # Check for essential files
    essential_files = [
        'am/final.mdl',
        'conf/mfcc.conf', 
        'conf/model.conf'
    ]
    
    for file_path in essential_files:
        if not (model_dir / file_path).exists():
            print(f"Missing essential file: {file_path}")
            return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        if verify_model():
            print("Vosk model is properly installed.")
            sys.exit(0)
        else:
            print("Vosk model is not properly installed.")
            sys.exit(1)
    else:
        if not download_vosk_model():
            sys.exit(1)
