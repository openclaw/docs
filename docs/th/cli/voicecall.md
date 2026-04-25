---
read_when:
    - คุณใช้ Plugin การโทรด้วยเสียงและต้องการจุดเข้าใช้งานของ CLI
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับ `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw voicecall` (พื้นผิวคำสั่งของ Plugin การโทรด้วยเสียง)
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:45:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` เป็นคำสั่งที่ Plugin จัดเตรียมไว้ คำสั่งนี้จะแสดงขึ้นเฉพาะเมื่อติดตั้งและเปิดใช้ Plugin การโทรด้วยเสียงแล้วเท่านั้น

เอกสารหลัก:

- Plugin การโทรด้วยเสียง: [Voice Call](/th/plugins/voice-call)

## คำสั่งทั่วไป

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` จะแสดงการตรวจสอบความพร้อมใช้งานในรูปแบบที่มนุษย์อ่านได้เป็นค่าเริ่มต้น ใช้ `--json` สำหรับสคริปต์:

```bash
openclaw voicecall setup --json
```

สำหรับ provider ภายนอก (`twilio`, `telnyx`, `plivo`) การตั้งค่าต้อง resolve URL Webhook สาธารณะจาก `publicUrl`, tunnel หรือการเปิดเผยผ่าน Tailscale ระบบจะปฏิเสธ fallback แบบ serve บน loopback/เครือข่ายส่วนตัว เพราะผู้ให้บริการเครือข่ายไม่สามารถเข้าถึงได้

`smoke` จะรันการตรวจสอบความพร้อมเดียวกัน โดยจะไม่โทรออกจริง เว้นแต่จะมีทั้ง `--to` และ `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # ทดสอบแบบไม่โทรจริง
openclaw voicecall smoke --to "+15555550123" --yes  # การโทรแจ้งเตือนจริง
```

## การเปิดเผย Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

หมายเหตุด้านความปลอดภัย: เปิดเผยปลายทาง Webhook เฉพาะกับเครือข่ายที่คุณเชื่อถือเท่านั้น ควรใช้ Tailscale Serve แทน Funnel เมื่อเป็นไปได้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
