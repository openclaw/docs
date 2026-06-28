---
read_when:
    - คุณต้องการล้างสถานะภายในเครื่องโดยยังคงติดตั้ง CLI ไว้ต่อไป
    - คุณต้องการ dry-run เพื่อดูว่าจะลบอะไรบ้าง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw reset` (รีเซ็ตสถานะ/config ภายในเครื่อง)
title: รีเซ็ต
x-i18n:
    generated_at: "2026-04-24T09:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw reset`

รีเซ็ต config/สถานะภายในเครื่อง (ยังคงติดตั้ง CLI ไว้)

ตัวเลือก:

- `--scope <scope>`: `config`, `config+creds+sessions` หรือ `full`
- `--yes`: ข้ามข้อความยืนยัน
- `--non-interactive`: ปิดการถามตอบ; ต้องใช้ร่วมกับ `--scope` และ `--yes`
- `--dry-run`: แสดงการกระทำโดยไม่ลบไฟล์

ตัวอย่าง:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

หมายเหตุ:

- รัน `openclaw backup create` ก่อน หากคุณต้องการ snapshot ที่กู้คืนได้ก่อนลบสถานะภายในเครื่อง
- หากคุณไม่ระบุ `--scope`, `openclaw reset` จะใช้ prompt แบบโต้ตอบเพื่อเลือกว่าจะลบอะไร
- `--non-interactive` ใช้ได้ก็ต่อเมื่อตั้งค่าทั้ง `--scope` และ `--yes`

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
