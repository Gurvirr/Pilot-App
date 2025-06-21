#!/usr/bin/env python3
"""
Test script for the open_app function.
Tests opening various common applications.
"""

import time
from actions import open_app

def test_open_app():
    """Test the open_app function with common applications."""
    
    # List of common apps to test
    test_apps = [
        "notepad",
        "calculator", 
        "paint",
        "chrome",
        "firefox",
        "edge",
        "discord",
        "spotify",
        "steam",
        "vscode",
        "visual studio code"
    ]
    
    print("🧪 Testing open_app function with common applications...\n")
    
    results = []
    
    for app in test_apps:
        print(f"🔄 Testing: {app}")
        print("-" * 50)
        
        try:
            success = open_app(app)
            results.append((app, success))
            
            if success:
                print(f"✅ {app}: SUCCESS")
                # Wait a bit before trying next app
                time.sleep(2)
            else:
                print(f"❌ {app}: FAILED")
                
        except Exception as e:
            print(f"❌ {app}: ERROR - {e}")
            results.append((app, False))
        
        print("\n" + "="*60 + "\n")
        time.sleep(1)  # Brief pause between tests
    
    # Summary
    print("📊 TEST RESULTS SUMMARY:")
    print("="*60)
    
    successful = 0
    failed = 0
    
    for app, success in results:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{app:20} : {status}")
        if success:
            successful += 1
        else:
            failed += 1
    
    print("-" * 60)
    print(f"Total: {len(results)} | Successful: {successful} | Failed: {failed}")
    print(f"Success Rate: {(successful/len(results)*100):.1f}%")

def test_specific_app():
    """Test opening a specific app interactively."""
    print("🎯 Interactive App Test")
    print("Enter the name of an app you want to test (or 'quit' to exit):")
    
    while True:
        app_name = input("\nApp name: ").strip()
        
        if app_name.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        if not app_name:
            print("Please enter a valid app name.")
            continue
        
        print(f"\n🔄 Testing: {app_name}")
        try:
            success = open_app(app_name)
            if success:
                print(f"✅ Successfully opened {app_name}")
            else:
                print(f"❌ Failed to open {app_name}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 App Opener Test Suite")
    print("="*60)
    
    choice = input("Choose test mode:\n1. Test common apps\n2. Test specific app\n3. Both\nChoice (1/2/3): ").strip()
    
    if choice == "1":
        test_open_app()
    elif choice == "2":
        test_specific_app()
    elif choice == "3":
        test_open_app()
        print("\n" + "="*60 + "\n")
        test_specific_app()
    else:
        print("Invalid choice. Running common apps test...")
        test_open_app()
