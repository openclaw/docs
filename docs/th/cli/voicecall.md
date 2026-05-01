---
read_when:
    - คุณใช้ Plugin voice-call และต้องการจุดเข้าใช้งาน CLI
    - คุณต้องการตัวอย่างสั้น ๆ สำหรับ `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw voicecall` (ส่วนติดต่อคำสั่งของ Plugin การโทรด้วยเสียง)
title: การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-01T10:15:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` เป็นคำสั่งที่ Plugin จัดเตรียมให้ คำสั่งนี้จะปรากฏเฉพาะเมื่อติดตั้งและเปิดใช้งาน Plugin การโทรด้วยเสียงแล้วเท่านั้น

เมื่อ Gateway กำลังทำงาน คำสั่งปฏิบัติการ (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, และ `status`) จะถูกส่งไปยัง runtime
การโทรด้วยเสียงของ Gateway นั้น หากติดต่อ Gateway ไม่ได้ คำสั่งเหล่านี้จะถอยกลับไปใช้
runtime แบบ CLI สแตนด์อโลน

เอกสารหลัก:

- Plugin การโทรด้วยเสียง: [การโทรด้วยเสียง](/th/plugins/voice-call)

## คำสั่งทั่วไป

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

โดยค่าเริ่มต้น `setup` จะแสดงผลการตรวจสอบความพร้อมในรูปแบบที่มนุษย์อ่านได้ ใช้ `--json` สำหรับ
สคริปต์:

```bash
openclaw voicecall setup --json
```

โดยค่าเริ่มต้น `status` จะแสดงสายที่กำลังใช้งานเป็น JSON ส่ง `--call-id <id>` เพื่อตรวจสอบ
สายเดียว

สำหรับผู้ให้บริการภายนอก (`twilio`, `telnyx`, `plivo`) การตั้งค่าต้องแก้ URL ของ Webhook สาธารณะ
จาก `publicUrl`, tunnel, หรือการเปิดเผยผ่าน Tailscale ให้ได้ fallback การให้บริการแบบ loopback/private
จะถูกปฏิเสธ เพราะผู้ให้บริการเครือข่ายโทรศัพท์ไม่สามารถเข้าถึงได้

`smoke` เรียกใช้การตรวจสอบความพร้อมชุดเดียวกัน โดยจะไม่โทรออกจริง
เว้นแต่จะมีทั้ง `--to` และ `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## การเปิดเผย Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

หมายเหตุด้านความปลอดภัย: เปิดเผย endpoint ของ Webhook เฉพาะกับเครือข่ายที่คุณไว้วางใจเท่านั้น หากเป็นไปได้ ให้เลือก Tailscale Serve แทน Funnel

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
