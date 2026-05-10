---
read_when:
    - การเพิ่มหรือเปลี่ยนแปลงการผสานการทำงานกับ CLI ภายนอก
    - การดีบักอะแดปเตอร์ RPC (signal-cli, imsg)
summary: อะแดปเตอร์ RPC สำหรับ CLI ภายนอก (signal-cli, imsg) และรูปแบบของ Gateway
title: อะแดปเตอร์ RPC
x-i18n:
    generated_at: "2026-05-10T19:56:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw ผสานรวม CLI ภายนอกผ่าน JSON-RPC ปัจจุบันใช้สองรูปแบบ

## รูปแบบ A: HTTP daemon (signal-cli)

- `signal-cli` ทำงานเป็น daemon พร้อม JSON-RPC ผ่าน HTTP
- สตรีมเหตุการณ์คือ SSE (`/api/v1/events`)
- Health probe: `/api/v1/check`
- OpenClaw จัดการ lifecycle เมื่อ `channels.signal.autoStart=true`

ดู [Signal](/th/channels/signal) สำหรับการตั้งค่าและ endpoint

## รูปแบบ B: กระบวนการลูก stdio (imsg)

- OpenClaw spawn `imsg rpc` เป็นกระบวนการลูกสำหรับ [iMessage](/th/channels/imessage)
- JSON-RPC เป็นแบบคั่นบรรทัดผ่าน stdin/stdout (หนึ่ง JSON object ต่อบรรทัด)
- ไม่มีพอร์ต TCP และไม่ต้องใช้ daemon

เมธอดหลักที่ใช้:

- `watch.subscribe` → การแจ้งเตือน (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostics)

ดู [iMessage](/th/channels/imessage) สำหรับการตั้งค่าแบบเดิมและการระบุที่อยู่ (ควรใช้ `chat_id`)

## แนวทางสำหรับ adapter

- Gateway เป็นเจ้าของกระบวนการ (start/stop ผูกกับ lifecycle ของ provider)
- ทำให้ไคลเอนต์ RPC ทนทาน: timeout, รีสตาร์ตเมื่อออกจากกระบวนการ
- ควรใช้ ID ที่เสถียร (เช่น `chat_id`) แทนสตริงที่ใช้แสดงผล

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
