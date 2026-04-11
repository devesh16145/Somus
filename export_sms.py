import subprocess
import json
import re
from datetime import datetime

def export_sms_via_adb():
    print("Fetching SMS from phone via ADB...")
    # Query the SMS content provider.
    # We select specific columns: address (sender), body, date, type (1=inbox, 2=sent)
    cmd = [
        "adb", "shell", "content", "query", 
        "--uri", "content://sms", 
        "--projection", "address,date,type,body"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', check=True)
        raw_output = result.stdout
    except subprocess.CalledProcessError as e:
        print("Error: Could not fetch SMS. Is your phone connected with USB Debugging enabled?")
        print(f"ADB Error: {e.stderr}")
        return
    except FileNotFoundError:
        print("Error: 'adb' command not found. Please ensure Android build tools are in your PATH.")
        return

    sms_list = []
    
    # The output format is typically: Row: 0 address=..., date=..., type=..., body=...
    # We use regex to carefully extract the fields, as body can contain commas or newlines.
    pattern = re.compile(r"Row: \d+ address=(.*?), date=(\d+), type=(\d+), body=(.*)")
    
    # Split by "Row: " to handle multiline SMS bodies better
    rows = raw_output.split("Row: ")[1:]
    
    for row in rows:
        row = "Row: " + row.strip()
        match = pattern.search(row)
        if match:
            address = match.group(1)
            date_ms = match.group(2)
            sms_type = match.group(3)
            body = match.group(4)
            
            # Convert timestamp to human-readable date
            try:
                date_str = datetime.fromtimestamp(int(date_ms) / 1000.0).strftime('%Y-%m-%d %H:%M:%S')
            except ValueError:
                date_str = date_ms
                
            sms_list.append({
                "sender": address,
                "date": date_str,
                "timestamp": int(date_ms),
                "type": "inbox" if sms_type == "1" else "sent" if sms_type == "2" else "other",
                "body": body
            })

    print(f"Successfully extracted {len(sms_list)} messages.")
    
    output_filename = "sms_export.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(sms_list, f, indent=2, ensure_ascii=False)
        
    print(f"Saved to {output_filename}")

if __name__ == "__main__":
    export_sms_via_adb()
