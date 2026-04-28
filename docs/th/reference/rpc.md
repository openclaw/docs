---
read_when:
- Adding or changing external CLI integrations
- การแก้ปัญหาอะแดปเตอร์ RPC (`signal-cli`, `imsg`)
summary: อะแดปเตอร์ RPC สำหรับ CLI ภายนอก (`signal-cli`, `imsg` แบบ legacy) และแพตเทิร์นของ
  gateway
title: อะแดปเตอร์ RPC
x-i18n:
  generated_at: '2026-04-24T09:31:41Z'
  model: gpt-5.4
  provider: openai
  source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
  source_path: reference/rpc.md
  workflow: 15
---

OpenClaw เชื่อมต่อ CLI ภายนอกผ่าน JSON-RPC ปัจจุบันมีการใช้ 2 รูปแบบ

## รูปแบบ A: HTTP daemon (`signal-cli`)

- `signal-cli` ทำงานเป็น daemon พร้อม JSON-RPC ผ่าน HTTP
- event stream เป็น SSE (`/api/v1/events`)
- health probe: `/api/v1/check`
- OpenClaw เป็นเจ้าของวงจรชีวิตเมื่อ `channels.signal.autoStart=true`

ดู [Signal](/th/channels/signal) สำหรับการตั้งค่าและ endpoint

## รูปแบบ B: stdio child process (legacy: `imsg`)

> **หมายเหตุ:** สำหรับการตั้งค่า iMessage ใหม่ ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) แทน

- OpenClaw จะ spawn `imsg rpc` เป็น child process (การเชื่อมต่อ iMessage แบบ legacy)
- JSON-RPC เป็นแบบคั่นบรรทัดผ่าน stdin/stdout (หนึ่ง JSON object ต่อหนึ่งบรรทัด)
- ไม่ต้องใช้พอร์ต TCP และไม่ต้องมี daemon

เมธอดหลักที่ใช้:

- `watch.subscribe` → การแจ้งเตือน (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostics)

ดู [iMessage](/th/channels/imessage) สำหรับการตั้งค่าแบบ legacy และการระบุปลายทาง (`chat_id` ควรใช้เป็นหลัก)

## แนวทางสำหรับอะแดปเตอร์

- Gateway เป็นเจ้าของโพรเซส (การเริ่ม/หยุดผูกกับวงจรชีวิตของ provider)
- ควรทำให้ RPC client ทนทาน: มี timeout, รีสตาร์ตเมื่อโพรเซสออก
- ควรใช้ ID ที่เสถียร (เช่น `chat_id`) มากกว่าสตริงที่ใช้แสดงผล

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
