import json
import re
import random

def process_sms():
    print("Loading sms_export.json...")
    with open('sms_export.json', 'r', encoding='utf-8') as f:
        sms_data = json.load(f)

    print(f"Loaded {len(sms_data)} messages. Filtering...")

    filtered_sms = []
    
    # Financial indicators (both positive and negative ones we want the model to learn)
    financial_keywords = [
        "debited", "credited", "spent", "a/c", "acct", "rs.", "rs", "inr", 
        "upi", "neft", "imps", "balance", "txn", "transaction", "emi", "due",
        "otp", "verification", "cashback", "reward"
    ]
    
    # Common bank sender pattern in India (e.g., AD-HDFCBK, VK-ICICIB)
    bank_sender_pattern = re.compile(r'^[A-Za-z]{2}-[A-Za-z0-9]+$')

    for msg in sms_data:
        sender = msg.get("sender", "")
        body = msg.get("body", "").lower()
        
        # Check if sender looks like a bank or if body has financial keywords
        is_bank_sender = bool(bank_sender_pattern.match(sender))
        has_keywords = any(kw in body for kw in financial_keywords)
        
        if is_bank_sender or has_keywords:
            filtered_sms.append(msg)

    print(f"Filtered down to {len(filtered_sms)} potential financial messages.")

    # Anonymize PII
    print("Anonymizing data (masking account numbers, phone numbers)...")
    
    for msg in filtered_sms:
        body = msg["body"]
        
        # Mask Account/Card numbers (e.g., a/c 123456 -> a/c XX1234)
        body = re.sub(r'(?i)(a/c|acct|card|ending with|ending in)[\s\:\*\-\.]*(xy[a-z0-9]*|[0-9a-z\*]{0,10})(\d{4})(?!\d)', r'\1 XX1234', body)
        
        # Mask 10-digit phone numbers
        body = re.sub(r'(?<!\d)\d{10}(?!\d)', '9999999999', body)
        
        # Mask UPI IDs (basic pattern)
        body = re.sub(r'([a-zA-Z0-9.\-_]+@[a-zA-Z]+)', 'user@upi', body)
        
        # Mask large exact balances over 100k, leave smaller transaction amounts alone for realism
        body = re.sub(r'(?i)(bal[a-z]*[\s:.]*(?:rs\.?|inr)?\s*)([1-9]\d{5,}(?:\.\d{1,2})?)', r'\1 99999.00', body)

        msg["body"] = body

    # Shuffle to get a good random sample
    random.shuffle(filtered_sms)
    
    output_filename = "sms_filtered_anonymized.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(filtered_sms, f, indent=2, ensure_ascii=False)
        
    print(f"Saved anonymized messages to {output_filename}")

if __name__ == "__main__":
    process_sms()
