import os
import shutil
import glob

def clear_browser_cache():
    """Clear browser cache files"""
    # Clear Chrome cache
    chrome_cache = os.path.expanduser('~') + '/AppData/Local/Google/Chrome/User Data/Default/Cache'
    if os.path.exists(chrome_cache):
        shutil.rmtree(chrome_cache)
        print("Chrome cache cleared")

    # Clear Firefox cache
    firefox_cache = os.path.expanduser('~') + '/AppData/Local/Mozilla/Firefox/Profiles/*/cache2'
    for cache_dir in glob.glob(firefox_cache):
        if os.path.exists(cache_dir):
            shutil.rmtree(cache_dir)
            print("Firefox cache cleared")

def clear_session_data():
    """Clear session data"""
    # Clear Flask session files
    session_dir = os.path.join(os.getcwd(), 'flask_session')
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir)
        print("Flask session data cleared")

def clear_temp_files():
    """Clear temporary files"""
    # Clear Windows temp files
    temp_dir = os.path.expanduser('~') + '/AppData/Local/Temp'
    if os.path.exists(temp_dir):
        for item in os.listdir(temp_dir):
            try:
                item_path = os.path.join(temp_dir, item)
                if os.path.isfile(item_path):
                    os.unlink(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
            except Exception as e:
                print(f"Error clearing temp file {item}: {e}")
        print("Temporary files cleared")

def clear_all_caches():
    """Clear all types of caches"""
    print("Starting cache clearing process...")
    clear_browser_cache()
    clear_session_data()
    clear_temp_files()
    print("Cache clearing completed!")

if __name__ == "__main__":
    clear_all_caches() 