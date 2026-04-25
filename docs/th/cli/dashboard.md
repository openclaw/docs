---
read_when:
    - คุณต้องการเปิด Control UI ด้วยโทเค็นปัจจุบันของคุณ
    - คุณต้องการพิมพ์ URL โดยไม่เปิดเบราว์เซอร์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw dashboard` (เปิด Control UI)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-04-25T13:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

เปิด Control UI โดยใช้การยืนยันตัวตนปัจจุบันของคุณ

```bash
openclaw dashboard
openclaw dashboard --no-open
```

หมายเหตุ:

- `dashboard` จะ resolve `gateway.auth.token` SecretRefs ที่กำหนดค่าไว้เมื่อเป็นไปได้
- `dashboard` จะเป็นไปตาม `gateway.tls.enabled`: Gateway ที่เปิดใช้ TLS จะพิมพ์/เปิด URL ของ Control UI แบบ `https://` และเชื่อมต่อผ่าน `wss://`
- สำหรับโทเค็นที่จัดการด้วย SecretRef (ทั้งที่ resolve ได้หรือยัง resolve ไม่ได้) `dashboard` จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มีโทเค็นเพื่อหลีกเลี่ยงการเปิดเผยซีเคร็ตภายนอกในเอาต์พุตเทอร์มินัล ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์การเปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ยัง resolve ไม่ได้ในเส้นทางคำสั่งนี้ คำสั่งจะพิมพ์ URL ที่ไม่มีโทเค็นพร้อมคำแนะนำการแก้ไขที่ชัดเจน แทนการฝัง placeholder ของโทเค็นที่ไม่ถูกต้อง

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [แดชบอร์ด](/th/web/dashboard)
