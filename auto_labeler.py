import json
import re

def auto_label_sms():
    print("Loading sample_150_clean.json for auto-labeling...")
    with open('sample_150_clean.json', 'r', encoding='utf-8') as f:
        sms_data = json.load(f)

    labeled_data = []

    # Regex patterns
    # Matches "Sent Rs. 100", "Paid Rs 100", "Rs 100 debited", etc.
    amount_pattern = re.compile(r'(?:rs\.?|inr)\s*([\d,]+\.?\d*)', re.IGNORECASE)
    
    # Negative patterns
    negative_pattern = re.compile(r'(otp|verification|password|login request|upcoming mandate|will be deducted|plan expired|recharge successful|Congratulations|Steal this deal|do not scan)', re.IGNORECASE)
    
    for msg in sms_data:
        body = msg['body']
        sender = msg['sender']
        
        is_fin = False
        amount = 0.0
        merchant = ""
        category = "OTHER"
        txn_type = "DEBIT"
        
        # Check negative/junk
        if negative_pattern.search(body):
            is_fin = False
        else:
            # Try to grab amount
            amt_match = amount_pattern.search(body)
            if amt_match:
                amount_str = amt_match.group(1).replace(',', '')
                try:
                    amount = float(amount_str)
                    
                    # Assume DEBIT unless "credited", "received", "deposited"
                    if re.search(r'(credited|received|deposited|cr-)', body, re.IGNORECASE):
                        txn_type = "CREDIT"
                        is_fin = True
                    # Assume DEBIT if "sent", "debited", "paid"
                    elif re.search(r'(sent|debited|paid|transfer:rs)', body, re.IGNORECASE):
                        txn_type = "DEBIT"
                        is_fin = True
                        
                    # Extract merchant loosely
                    if "to " in body.lower():
                        match = re.search(r'(?i)to ([a-zA-Z0-9\s]+?)(?:on|from|upi|\.|\|)', body)
                        if match:
                            merchant = match.group(1).strip()
                            # Rough categorization
                            lower_merch = merchant.lower()
                            if 'swiggy' in lower_merch or 'zomato' in lower_merch:
                                category = "FOOD_DINING"
                            elif 'amazon' in lower_merch or 'flipkart' in lower_merch:
                                category = "SHOPPING"
                            elif 'metro' in lower_merch or 'uber' in lower_merch:
                                category = "TRANSPORT"
                            elif 'paytm' in lower_merch:
                                category = "TRANSFER"
                    
                except ValueError:
                    pass

        label_obj = {
            "isFinancial": is_fin,
            "amount": amount if is_fin else 0.0,
            "currencyCode": "INR",
            "merchant": merchant if is_fin else "",
            "category": category if is_fin else "OTHER",
            "type": txn_type if is_fin else "DEBIT",
            "accountReference": "XX1234" if is_fin and "a/c" in body.lower() else None,
            "balance": None,
            "balanceCurrencyCode": "INR",
            "confidence": 0.95
        }

        training_item = {
            "messages": [
                {"role": "system", "content": "Extract transaction details from this bank SMS as JSON.\n\nIMPORTANT RULES:\n- isFinancial=true ONLY if money HAS ALREADY been debited/credited (past tense)\n- isFinancial=false for: reminders, upcoming payments, \"will be debited\", \"due on\", \"scheduled\", renewals, OTPs, promotions\n- amount: the EXACT number from SMS. Never invent or guess amounts.\n- merchant: the actual payee/store/recipient name, NOT the SMS sender code\n- Output ONLY the JSON, nothing else."},
                {"role": "user", "content": f"SMS sender: {sender} body: \"{body}\""},
                {"role": "assistant", "content": json.dumps(label_obj, ensure_ascii=False)}
            ]
        }

        labeled_data.append(training_item)

    # Save to JSONL
    out_file = "somus_real_sms_labeled.jsonl"
    with open(out_file, 'w', encoding='utf-8') as f:
        for item in labeled_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"Auto-labeled {len(labeled_data)} messages and saved to {out_file}.")
    print("Please review the JSONL file to ensure accuracy!")

if __name__ == "__main__":
    auto_label_sms()
