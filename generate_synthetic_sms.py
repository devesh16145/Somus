import json
import random
import uuid
from datetime import datetime, timedelta

# Constants for Generation
NUM_SAMPLES = 2800

CATEGORIES = {
    "FOOD_DINING": ["Swiggy", "Zomato", "Starbucks", "McDonalds", "Dominos", "KFC", "UBEREATS"],
    "TRANSPORT": ["Uber", "Ola", "Metro Recharge", "IRCTC", "Redbus", "Rapido"],
    "SHOPPING": ["Amazon", "Flipkart", "Myntra", "Walmart", "Zara", "Ajio", "Target"],
    "GROCERIES": ["BigBasket", "Blinkit", "Zepto", "D-Mart", "JioMart", "Instacart"],
    "UTILITIES": ["Airtel", "Jio", "BSNL", "Bescom", "Mahanagar Gas", "Tata Power"],
    "ENTERTAINMENT": ["PVR Cinemas", "BookMyShow", "Inox"],
    "TRAVEL": ["MakeMyTrip", "Indigo", "AirIndia", "Agoda", "Booking.com"],
    "EDUCATION": ["Coursera", "Udemy", "Byjus", "School Fee"],
    "FUEL": ["HPCL", "BPCL", "Indian Oil", "Shell"],
    "ATM_CASH": ["ATM WDL", "CASH WITHDRAWAL", "ATM TXN"],
    "TRANSFER": ["Alex", "Rahul", "Priya", "UPI Transfer", "NEFT to User"],
    "SUBSCRIPTION": ["Netflix", "Spotify", "Amazon Prime", "YouTube Premium", "Hotstar"],
    "INSURANCE": ["LIC", "HDFC Life", "PolicyBazaar"],
    "RENT": ["House Rent", "Office Rent", "Nobroker"],
    "HEALTH_MEDICAL": ["Apollo Pharmacy", "1mg", "Fortis", "Dr Lal PathLabs"],
    "OTHER": ["Misc Pos", "Unknown", "Vendor"]
}

# Banks mapped by country/currency
BANKS = {
    "India": {"currency": "INR", "banks": ["HDFCBK", "ICICIB", "SBIINB", "AXISBK", "KOTAKB"]},
    "UAE": {"currency": "AED", "banks": ["ENBD", "ADCB", "FAB", "DIB"]},
    "Kenya": {"currency": "KES", "banks": ["MPESA", "EQUITY", "KCB"]},
    "USA": {"currency": "USD", "banks": ["CHASE", "BOFA", "WELLS"]},
    "UK": {"currency": "GBP", "banks": ["BARCLAYS", "HSBC", "LLOYDS"]},
    "Indonesia": {"currency": "IDR", "banks": ["MANDIRI", "BCA", "BNI"]},
    "Philippines": {"currency": "PHP", "banks": ["BDO", "BPI", "GCASH"]}
}

# Templates for Positive (Completed) Transactions
DEBIT_TEMPLATES = [
    "{currency} {amount} debited from a/c {acc} on {date} to {merchant}. UPI Ref: 1234. Avl Bal: {currency} {bal}",
    "Spent {currency} {amount} on {acc} at {merchant} on {date}. Bal: {bal}",
    "Rs. {amount} paid to {merchant} from A/c {acc} on {date}.",
    "Your a/c {acc} is debited for {currency} {amount} on {date} by {merchant}.",
    "Trx of {currency} {amount} on credit card {acc} done at {merchant}. Avail Limit: {bal}",
    "Payment of {amount} {currency} to {merchant} successful from a/c {acc}.",
]

CREDIT_TEMPLATES = [
    "{currency} {amount} credited to a/c {acc} on {date} from {merchant}. Avl Bal: {currency} {bal}",
    "Received {currency} {amount} in your a/c {acc} on {date} by {merchant}.",
    "Refund of {currency} {amount} processed for {merchant} to your a/c {acc}.",
    "Salary of {currency} {amount} credited to your A/c {acc} on {date}.",
]

# Negative Templates (Future/Scheduled) -> isFinancial = false
FUTURE_TEMPLATES = [
    "Reminder: Your EMI of {currency} {amount} to {merchant} is due on {date}. Pls maintain balance in {acc}.",
    "Upcoming mandate: Auto-debit for {merchant} of {amount} is scheduled for tomorrow. A/c {acc}.",
    "Your bill of {currency} {amount} for {merchant} will be generated on {date}.",
    "Scheduled payment of {currency} {amount} to {merchant} from a/c {acc} on {date}.",
]

# Negative Templates (OTP/Promo/General Info)
OTP_TEMPLATES = [
    "Your OTP for {merchant} transaction is 123456. Valid for 5 mins.",
    "{merchant} login OTP is 987654. Do not share.",
    "Dear customer, your verification code is 456123.",
]

PROMO_TEMPLATES = [
    "Get 50% cashback at {merchant} today! Max discount {currency} {amount}. Click here.",
    "Pre-approved loan of {currency} 50,000 for your a/c {acc}. Apply now!",
    "Congratulations! You won {amount} reward points at {merchant}.",
]

# Multilingual Positive Templates (Basic Translations for diversity)
FOREIGN_TEMPLATES = {
    "Spanish": "{amount} {currency} deducidos de la cuenta {acc} en {merchant} el {date}. Disp {bal}",
    "French": "Votre compte {acc} a ete debite de {amount} {currency} par {merchant} le {date}.",
    "German": "Belastung von {amount} {currency} auf Konto {acc} durch {merchant}. Saldo {bal}",
    "Arabic": "تم خصم {amount} {currency} من حسابك {acc} في {merchant} بتاريخ {date}. الرصيد {bal}",
    "Japanese": "口座 {acc} から {merchant} に {amount} {currency} 引き落とされました。残高 {bal}",
    "Indonesian": "{currency} {amount} berhasil didebet dari rekening {acc} ke {merchant} pada {date}."
}

def random_date():
    start_date = datetime.now() - timedelta(days=365)
    random_days = random.randint(0, 365)
    return (start_date + timedelta(days=random_days)).strftime("%d-%b-%y %H:%M")

def generate_example(tx_type):
    country = random.choice(list(BANKS.keys()))
    c_info = BANKS[country]
    currency = c_info["currency"]
    bank = random.choice(c_info["banks"])
    sender = f"AD-{bank}"
    
    category = random.choice(list(CATEGORIES.keys()))
    merchant = random.choice(CATEGORIES[category])
    
    amount = round(random.uniform(5.0, 5000.0), 2)
    bal = round(amount + random.uniform(100.0, 50000.0), 2)
    acc = f"XX{random.randint(1000, 9999)}"
    date_str = random_date()

    label_obj = {
        "isFinancial": False,
        "amount": 0.0,
        "currencyCode": currency,
        "merchant": "",
        "category": "OTHER",
        "type": "DEBIT",
        "accountReference": None,
        "balance": None,
        "balanceCurrencyCode": currency,
        "confidence": 0.95
    }

    if tx_type == "DEBIT_COM":
        template = random.choice(DEBIT_TEMPLATES)
        if random.random() < 0.1: # 10% foreign language
            template = random.choice(list(FOREIGN_TEMPLATES.values()))
        body = template.format(currency=currency, amount=amount, acc=acc, date=date_str, merchant=merchant, bal=bal)
        label_obj.update({
            "isFinancial": True, "amount": amount, "merchant": merchant.upper(), 
            "category": category, "type": "DEBIT", "accountReference": acc, "balance": bal
        })
    elif tx_type == "CREDIT_COM":
        template = random.choice(CREDIT_TEMPLATES)
        body = template.format(currency=currency, amount=amount, acc=acc, date=date_str, merchant=merchant, bal=bal)
        label_obj.update({
            "isFinancial": True, "amount": amount, "merchant": merchant.upper(), 
            "category": category if category in ["TRANSFER", "OTHER"] else "OTHER", 
            "type": "CREDIT", "accountReference": acc, "balance": bal
        })
    elif tx_type == "FUTURE":
        template = random.choice(FUTURE_TEMPLATES)
        body = template.format(currency=currency, amount=amount, acc=acc, date=date_str, merchant=merchant)
    elif tx_type == "OTP":
        template = random.choice(OTP_TEMPLATES)
        body = template.format(merchant=merchant)
    else: # PROMO
        template = random.choice(PROMO_TEMPLATES)
        body = template.format(currency=currency, amount=amount, acc=acc, merchant=merchant)

    # Compile HuggingFace trl item
    system_prompt = "Extract transaction details from this bank SMS as JSON.\n\nIMPORTANT RULES:\n- isFinancial=true ONLY if money HAS ALREADY been debited/credited (past tense)\n- isFinancial=false for: reminders, upcoming payments, \"will be debited\", \"due on\", \"scheduled\", renewals, OTPs, promotions\n- amount: the EXACT number from SMS. Never invent or guess amounts.\n- merchant: the actual payee/store/recipient name, NOT the SMS sender code\n- Output ONLY the JSON, nothing else."
    
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"SMS sender: {sender} body: \"{body}\""},
            {"role": "assistant", "content": json.dumps(label_obj, ensure_ascii=False)}
        ]
    }

def main():
    print(f"Generating {NUM_SAMPLES} synthetic SMS messages...")
    
    dataset = []
    
    # Target distribution
    counts = {
        "DEBIT_COM": int(NUM_SAMPLES * 0.45), # 45% Actual Trx (Debit)
        "CREDIT_COM": int(NUM_SAMPLES * 0.15), # 15% Actual Trx (Credit)
        "FUTURE": int(NUM_SAMPLES * 0.20),     # 20% Future / Upcoming (Negative! Critical!)
        "OTP": int(NUM_SAMPLES * 0.10),        # 10% OTP Spam
        "PROMO": int(NUM_SAMPLES * 0.10),      # 10% Promotional
    }
    
    for tx_type, count in counts.items():
        for _ in range(count):
            dataset.append(generate_example(tx_type))
            
    # Shuffle the dataset
    random.shuffle(dataset)
    
    out_file = "somus_synthetic_sms.jsonl"
    with open(out_file, "w", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
            
    print(f"Generated {len(dataset)} examples. Saved to {out_file}.")

if __name__ == "__main__":
    main()
