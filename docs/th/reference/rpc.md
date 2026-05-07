---
read_when:
    - การเพิ่มหรือเปลี่ยนแปลงการผสานการทำงานกับ CLI ภายนอก
    - การดีบักอะแดปเตอร์ RPC (signal-cli, imsg)
summary: อะแดปเตอร์ RPC สำหรับ CLI ภายนอก (signal-cli, imsg) และรูปแบบ Gateway
title: อะแดปเตอร์ RPC
x-i18n:
    generated_at: "2026-05-07T01:53:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw ผสานรวม CLI ภายนอกผ่าน JSON-RPC ปัจจุบันใช้สองรูปแบบ

## รูปแบบ A: ดีมอน HTTP (signal-cli)

- `signal-cli` ทำงานเป็นดีมอนด้วย JSON-RPC ผ่าน HTTP
- สตรีมเหตุการณ์คือ SSE (`/api/v1/events`)
- โพรบสุขภาพ: `/api/v1/check`
- OpenClaw จัดการวงจรชีวิตเมื่อ `channels.signal.autoStart=true`

ดู [Signal](/th/channels/signal) สำหรับการตั้งค่าและปลายทาง

## รูปแบบ B: โปรเซสลูก stdio (เดิม: imsg)

> **หมายเหตุ:** สำหรับการตั้งค่า iMessage ใหม่ ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) แทน

- OpenClaw สร้าง `imsg rpc` เป็นโปรเซสลูก (การผสานรวม iMessage แบบเดิม)
- JSON-RPC ถูกคั่นตามบรรทัดผ่าน stdin/stdout (หนึ่งออบเจ็กต์ JSON ต่อหนึ่งบรรทัด)
- ไม่มีพอร์ต TCP และไม่จำเป็นต้องมีดีมอน

เมธอดหลักที่ใช้:

- `watch.subscribe` → การแจ้งเตือน (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (โพรบ/การวินิจฉัย)

ดู [iMessage](/th/channels/imessage) สำหรับการตั้งค่าแบบเดิมและการระบุที่อยู่ (แนะนำให้ใช้ `chat_id`)

## แนวทางสำหรับอะแดปเตอร์

- Gateway เป็นเจ้าของโปรเซส (เริ่ม/หยุดผูกกับวงจรชีวิตของผู้ให้บริการ)
- ทำให้ไคลเอนต์ RPC ทนทานอยู่เสมอ: หมดเวลา, เริ่มใหม่เมื่อออก
- ควรใช้ ID ที่เสถียร (เช่น `chat_id`) แทนสตริงที่ใช้แสดงผล

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
