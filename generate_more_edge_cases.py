import json
import random
from datetime import datetime, timedelta

NUM_SAMPLES = 400

# Edge Case Categories and Merchants
EDGE_CATEGORIES = {
    "FOOD_DINING": ["Swiggy", "Zomato", "Uber Eats", "EatFit", "Blinkit", "Zepto", "Instamart"],
    "SUBSCRIPTION": ["Netflix", "Spotify", "Amazon Prime", "YouTube Premium", "Hotstar", "Apple Music", "Google One", "LinkedIn", "Jio Cinema"],
    "SHOPPING": ["Amazon", "Flipkart", "Myntra", "Ajio", "Meesho"],
    "TRANSPORT": ["Uber", "Ola", "Rapido", "Redbus", "IRCTC", "Metro"]
}

# Banks
BANKS = ["HDFCBK", "ICICIB", "SBIINB", "AXISBK", "KOTAKB", "PNBSMS", "IDFCFB", "YESBNK"]

# Negative Templates (Future/Scheduled) -> isFinancial = false
FUTURE_TEMPLATES = [
    "Your EMI of {amount} to {merchant} will be debited from A/c {acc} on {date}. Pls maintain sufficient balance.",
    "Upcoming mandate: Auto-debit for {merchant} of INR {amount} is scheduled for tomorrow. A/c {acc}.",
    "Scheduled payment of {amount} to {merchant} from a/c {acc} on {date}.",
    "Reminder: An auto-pay of {amount} for {merchant} is due on {date} from your Credit Card {acc}.",
    "Dear Customer, mandate for {merchant} of {amount} from A/c {acc} will be executed on {date}.",
    "Subscription charge of {amount} for {merchant} will be deducted from your card ending {acc} on {date}.",
    "Payment reminder: amount {amount} is due on {date} for {merchant} via A/c {acc}.",
    "Alert! {amount} will be auto debited from {acc} towards {merchant} subscription on {date}."
]

# Positive Templates (Subscriptions and Food) -> isFinancial = true
POSITIVE_TEMPLATES = [
    "INR {amount} debited from a/c {acc} on {date} to {merchant}. UPI Ref: 1234. Avl Bal: INR {bal}",
    "Spent INR {amount} on {acc} at {merchant} on {date}. Bal: {bal}",
    "Auto-Pay of INR {amount} to {merchant} debited via Card {acc} on {date}.",
    "Payment of {amount} INR to {merchant} successful from a/c {acc}.",
    "Your a/c {acc} is debited for INR {amount} on {date} by {merchant}.",
    "Trx of INR {amount} on credit card {acc} done at {merchant}."
]

# Absolute Negative (Offers/Promos/Balance) -> isFinancial = false
OTHER_NEGATIVES = [
    "Get 50% cashback at {merchant} today! Max discount INR {amount}. Click here.",
    "Pre-approved loan of 50,000 for your a/c {acc}. Apply now!",
    "Congratulations! You won {amount} reward points at {merchant}.",
    "Your A/c {acc} balance on {date} is INR {bal}. No transactions recent.",
    "Rs.50 free cash is waiting in your wallet. Use it at {merchant} now.",
    "Alert! A login attempt to your {merchant} account was made. OTP is 123456.",
]

def random_date():
    start_date = datetime.now() - timedelta(days=365)
    random_days = random.randint(0, 365)
    return (start_date + timedelta(days=random_days)).strftime("%d-%b-%y")

def generate_example(tx_type):
    bank = random.choice(BANKS)
    sender = f"AD-{bank}"
    
    amount = round(random.uniform(50.0, 5000.0), 2)
    bal = round(amount + random.uniform(100.0, 50000.0), 2)
    acc = f"XX{random.randint(1000, 9999)}"
    date_str = random_date()

    # The NEW simplified schema WITHOUT balance fields
    label_obj = {
        "isFinancial": False,
        "amount": 0.0,
        "currencyCode": "INR",
        "merchant": "",
        "category": "OTHER",
        "type": "DEBIT",
        "accountReference": None,
        "confidence": 0.95
    }

    if tx_type == "FUTURE":
        category = random.choice(list(EDGE_CATEGORIES.keys()))
        merchant = random.choice(EDGE_CATEGORIES[category])
        template = random.choice(FUTURE_TEMPLATES)
        body = template.format(amount=amount, acc=acc, date=date_str, merchant=merchant)
    elif tx_type == "SUBSCRIPTION":
        category = "SUBSCRIPTION"
        merchant = random.choice(EDGE_CATEGORIES[category])
        template = random.choice(POSITIVE_TEMPLATES)
        body = template.format(amount=amount, acc=acc, date=date_str, merchant=merchant, bal=bal)
        label_obj.update({
            "isFinancial": True, "amount": amount, "merchant": merchant.upper(), 
            "category": category, "type": "DEBIT", "accountReference": acc[-4:]
        })
    elif tx_type == "FOOD_DINING":
        category = "FOOD_DINING"
        merchant = random.choice(EDGE_CATEGORIES[category])
        template = random.choice(POSITIVE_TEMPLATES)
        body = template.format(amount=amount, acc=acc, date=date_str, merchant=merchant, bal=bal)
        label_obj.update({
            "isFinancial": True, "amount": amount, "merchant": merchant.upper(), 
            "category": category, "type": "DEBIT", "accountReference": acc[-4:]
        })
    else: # OTHER_NEGATIVE
        category = random.choice(list(EDGE_CATEGORIES.keys()))
        merchant = random.choice(EDGE_CATEGORIES[category])
        template = random.choice(OTHER_NEGATIVES)
        body = template.format(amount=amount, acc=acc, date=date_str, merchant=merchant, bal=bal)

    system_prompt = "Extract transaction details from this bank SMS as JSON.\n\nIMPORTANT RULES:\n- isFinancial=true ONLY if money HAS ALREADY been debited/credited (past tense)\n- isFinancial=false for: reminders, upcoming payments, \"will be debited\", \"due on\", \"scheduled\", renewals, OTPs, promotions\n- amount: the EXACT number from SMS. Never invent or guess amounts.\n- merchant: the actual payee/store/recipient name, NOT the SMS sender code\n- Output ONLY the JSON, nothing else."
    
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"SMS sender: {sender} body: \"{body}\""},
            {"role": "assistant", "content": json.dumps(label_obj, ensure_ascii=False)}
        ]
    }

def main():
    print(f"Generating {NUM_SAMPLES} edge cases...")
    
    dataset = []
    
    counts = {
        "FUTURE": 150,
        "SUBSCRIPTION": 100,
        "FOOD_DINING": 100,
        "OTHER_NEGATIVE": 50
    }
    
    for tx_type, count in counts.items():
        for _ in range(count):
            dataset.append(generate_example(tx_type))
            
    random.shuffle(dataset)
    
    # Append directly to the training dataset
    out_file = "somus_lfm_finetune_dataset.jsonl"
    with open(out_file, "a", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
            
    print(f"Appended {len(dataset)} new examples to {out_file}.")

if __name__ == "__main__":
    main()
