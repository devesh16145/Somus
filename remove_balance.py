import json

def remove_balance_fields():
    datasets = ['somus_real_sms_labeled.jsonl', 'somus_synthetic_sms.jsonl', 'somus_lfm_finetune_dataset.jsonl']
    
    for filename in datasets:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        updated = []
        for line in lines:
            if not line.strip():
                continue
            item = json.loads(line)
            for msg in item['messages']:
                if msg['role'] == 'assistant':
                    ans = json.loads(msg['content'])
                    ans.pop('balance', None)
                    ans.pop('balanceCurrencyCode', None)
                    msg['content'] = json.dumps(ans, ensure_ascii=False)
            updated.append(json.dumps(item, ensure_ascii=False))
            
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(updated) + '\n')
            
    print('Removed balance fields from all datasets!')

if __name__ == '__main__':
    remove_balance_fields()
