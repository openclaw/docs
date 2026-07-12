---
read_when:
    - การเพิ่มหรือเปลี่ยนแปลงการผสานรวม CLI ภายนอก
    - การดีบักอะแดปเตอร์ RPC (signal-cli, imsg)
summary: อะแดปเตอร์ RPC สำหรับ CLI ภายนอก (signal-cli, imsg) และรูปแบบ Gateway
title: อะแดปเตอร์ RPC
x-i18n:
    generated_at: "2026-07-12T16:40:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw ผสานรวม CLI ภายนอกผ่าน JSON-RPC ปัจจุบันมีการใช้งานสองรูปแบบ

## รูปแบบ A: ดีมอน HTTP (signal-cli)

- `signal-cli` ทำงานเป็นดีมอนโดยใช้ JSON-RPC ผ่าน HTTP
- สตรีมเหตุการณ์ใช้ SSE (`/api/v1/events`)
- จุดตรวจสอบสถานะ: `/api/v1/check`
- OpenClaw จัดการวงจรชีวิตเมื่อ `channels.signal.autoStart=true`

ดูการตั้งค่าและเอนด์พอยต์ได้ที่ [Signal](/th/channels/signal)

## รูปแบบ B: โปรเซสลูกแบบ stdio (imsg)

- OpenClaw เรียกใช้ `imsg rpc` เป็นโปรเซสลูกสำหรับ [iMessage](/th/channels/imessage)
- JSON-RPC แบ่งตามบรรทัดผ่าน stdin/stdout (หนึ่งออบเจ็กต์ JSON ต่อบรรทัด)
- ไม่ใช้พอร์ต TCP และไม่ต้องมีดีมอน

เมธอดหลักที่ใช้:

- `watch.subscribe` → การแจ้งเตือน (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (การตรวจสอบ/การวินิจฉัย)

ดูการตั้งค่าและการระบุปลายทางได้ที่ [iMessage](/th/channels/imessage) (ควรใช้ `chat_id` แทนสตริงชื่อที่แสดง)

## แนวทางสำหรับอะแดปเตอร์

- Gateway จัดการโปรเซส (การเริ่ม/หยุดเชื่อมโยงกับวงจรชีวิตของผู้ให้บริการ)
- ทำให้ไคลเอนต์ RPC ทนทานต่อข้อผิดพลาด: กำหนดเวลาหมดและเริ่มใหม่เมื่อโปรเซสสิ้นสุด
- ควรใช้ ID ที่คงที่ (เช่น `chat_id`) แทนสตริงชื่อที่แสดง

## เนื้อหาที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
