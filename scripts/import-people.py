import openpyxl
import json
import urllib.request
import time

import os

SECRET = os.environ.get('SUPABASE_SECRET_KEY', '')
url = f"{os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://vipmbcbnzybgbpygwcoe.supabase.co')}/rest/v1/people?on_conflict=legacy_id"
headers = {
    'apikey': SECRET,
    'Authorization': f'Bearer {SECRET}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

print('Lendo planilha de pessoas...')
wb = openpyxl.load_workbook('BACKUP - Base Historica Segue-me - apos 2023-SFA-SFG-12 - 20260911-1546.xlsx', read_only=True)
sheet = wb['Pessoas']
rows = list(sheet.iter_rows(values_only=True))

people = []
# header is at index 2
for r in rows[3:]:
    legacy_id = str(r[0]).strip() if r[0] else None
    name = str(r[1]).strip() if r[1] else None
    if not name:
        continue
    phone = str(r[2]).strip() if r[2] else None
    email = str(r[3]).strip() if r[3] else None
    birth_date_text = str(r[4]).strip() if r[4] else None
    sex = str(r[5]).strip() if r[5] else None
    identification_status = str(r[8]).strip() if r[8] else 'Identificado'
    notes = str(r[9]).strip() if r[9] else ''

    people.append({
        'legacy_id': legacy_id,
        'name': name,
        'phone': phone,
        'email': email,
        'birth_date_text': birth_date_text,
        'sex': sex,
        'identification_status': identification_status,
        'notes': notes
    })

total = len(people)
print(f'Total de pessoas extraídas: {total}')

batch_size = 1000
for i in range(0, total, batch_size):
    batch = people[i:i + batch_size]
    data = json.dumps(batch).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f'Lote {i // batch_size + 1}/{(total + batch_size - 1) // batch_size} inserido com sucesso ({len(batch)} registros)')
    except urllib.error.HTTPError as e:
        print(f'Erro no lote {i // batch_size + 1}: {e.code} - {e.read().decode("utf-8")}')
        break
    time.sleep(0.3)

print('Importação de pessoas finalizada com sucesso!')
