---
read_when:
    - คุณต้องการเปิดอินเทอร์เฟซควบคุมด้วยโทเค็นปัจจุบันของคุณ
    - คุณต้องการแสดง URL โดยไม่เปิดเบราว์เซอร์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw dashboard` (เปิด UI ควบคุม)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-05-05T01:44:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

เปิด UI ควบคุมโดยใช้การยืนยันตัวตนปัจจุบันของคุณ

```bash
openclaw dashboard
openclaw dashboard --no-open
```

หมายเหตุ:

- `dashboard` จะแปลงค่า SecretRefs ของ `gateway.auth.token` ที่กำหนดค่าไว้เมื่อทำได้
- `dashboard` จะทำตาม `gateway.tls.enabled`: Gateway ที่เปิดใช้ TLS จะพิมพ์/เปิด URL ของ UI ควบคุมแบบ
  `https://` และเชื่อมต่อผ่าน `wss://`
- หากการส่ง URL แดชบอร์ดที่ยืนยันตัวตนด้วยโทเค็นไปยังคลิปบอร์ด/เบราว์เซอร์ล้มเหลว
  `dashboard` จะบันทึกคำแนะนำการยืนยันตัวตนด้วยตนเองที่ปลอดภัย โดยระบุชื่อ `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` และคีย์แฟรกเมนต์ `token` โดยไม่พิมพ์ค่าโทเค็น
- สำหรับโทเค็นที่จัดการด้วย SecretRef (ไม่ว่าจะถูกแปลงค่าแล้วหรือยังไม่ถูกแปลงค่า) `dashboard` จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มีโทเค็น เพื่อหลีกเลี่ยงการเปิดเผยความลับภายนอกในเอาต์พุตเทอร์มินัล ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์การเปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ยังไม่ถูกแปลงค่าในเส้นทางคำสั่งนี้ คำสั่งจะพิมพ์ URL ที่ไม่มีโทเค็นและคำแนะนำการแก้ไขที่ชัดเจน แทนที่จะฝังตัวยึดตำแหน่งโทเค็นที่ไม่ถูกต้อง

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [แดชบอร์ด](/th/web/dashboard)
