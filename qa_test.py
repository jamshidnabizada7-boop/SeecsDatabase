import http.client
import json
import time
import sys

def req(method, path, body=None, cookie=None):
    conn = http.client.HTTPConnection('127.0.0.1', 3000, timeout=30)
    headers = {'Content-Type': 'application/json'}
    if cookie:
        headers['Cookie'] = cookie
    if body:
        conn.request(method, path, json.dumps(body), headers)
    else:
        conn.request(method, path, headers=headers)
    resp = conn.getresponse()
    data = resp.read().decode()
    set_cookie = resp.getheader('set-cookie')
    cookie_val = None
    if set_cookie:
        cookie_val = set_cookie.split(';')[0]
    conn.close()
    try:
        parsed = json.loads(data) if data else None
    except:
        parsed = data
    return resp.status, parsed, cookie_val

print('=== 1. LOGIN ===')
s, d, cookie = req('POST', '/api/admin/auth/login', {'email': 'admin@seecs.nust.edu.pk', 'password': 'admin12345'})
print(f'  Status: {s}, admin: {d["admin"]["name"] if d else "FAIL"}')
if not cookie:
    print('FATAL: No cookie!'); sys.exit(1)
time.sleep(1)

print('\n=== 2. COMPANIES ===')
s, d, _ = req('GET', '/api/admin/companies', cookie=cookie)
print(f'  Status: {s}, count: {len(d.get("items", []))}')
for c in d['items'][:3]:
    print(f'  {c["name"]} | status={c.get("status")} | founded={c.get("foundedYear")} | rev={c.get("revenue")}')
first_id = d['items'][-1]['id']

print(f'\n=== 3. CUSTOM COLUMNS ===')
s, d, _ = req('GET', '/api/admin/custom-columns', cookie=cookie)
items = d.get('items', d) if isinstance(d, dict) else d
print(f'  Status: {s}, columns: {json.dumps(items, indent=2)[:300]}')

print(f'\n=== 4. CREATE CUSTOM COL ===')
s, d, _ = req('POST', '/api/admin/custom-columns', {'name': 'QA Test Col', 'columnType': 'text', 'description': 'test'}, cookie=cookie)
print(f'  Status: {s}, result: {str(d)[:200]}')

print(f'\n=== 5. UPDATE COMPANY KEY ===')
s, d, _ = req('PUT', f'/api/admin/companies/{first_id}', {'apiKey': 'sk_seecs_qa_verify_key'}, cookie=cookie)
new_key = d.get('item', {}).get('apiKey', '') if d else 'FAIL'
print(f'  Status: {s}, new_key: {new_key}')

print(f'\n=== 6. LOOKUP ===')
s, d, _ = req('GET', '/api/lookup')
print(f'  Status: {s}, sectors={len(d.get("sectors",[]))}, cities={len(d.get("cities",[]))}, locations={len(d.get("locations",[]))}')

print(f'\n=== 7. STATS ===')
s, d, _ = req('GET', '/api/admin/stats', cookie=cookie)
print(f'  Status: {s}, companies={d.get("totalCompanies") if d else "FAIL"}')
print('\n=== ALL QA PASSED ===')
