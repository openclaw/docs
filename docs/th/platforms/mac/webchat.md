---
read_when:
- Debugging mac WebChat view or loopback port
summary: วิธีที่แอป Mac ฝัง Gateway WebChat และวิธีดีบักมัน
title: WebChat (macOS)
x-i18n:
  generated_at: '2026-04-24T09:22:23Z'
  model: gpt-5.4
  provider: openai
  source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
  source_path: platforms/mac/webchat.md
  workflow: 15
---

แอป macOS บนแถบเมนูจะฝัง UI ของ WebChat เป็นมุมมอง SwiftUI แบบเนทีฟ มัน
เชื่อมต่อกับ Gateway และใช้ **main session** สำหรับเอเจนต์ที่เลือกเป็นค่าเริ่มต้น
(พร้อมตัวสลับเซสชันสำหรับเซสชันอื่น)

- **โหมด local**: เชื่อมต่อโดยตรงกับ local Gateway WebSocket
- **โหมด remote**: ส่งต่อพอร์ตควบคุมของ Gateway ผ่าน SSH และใช้
  tunnel นั้นเป็น data plane

## การเปิดและการดีบัก

- แบบแมนนวล: เมนู Lobster → “Open Chat”
- เปิดอัตโนมัติสำหรับการทดสอบ:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logs: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`)

## วิธีการเชื่อมต่อภายใน

- Data plane: Gateway WS methods `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` และ events `chat`, `agent`, `presence`, `tick`, `health`
- `chat.history` จะส่งคืน transcript rows ที่ normalize แล้วสำหรับการแสดงผล: inline directive
  tags จะถูกลบออกจากข้อความที่มองเห็นได้, payload XML ของ plain-text tool-call
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และ truncated tool-call blocks) รวมถึง
  model control tokens แบบ ASCII/full-width ที่รั่วออกมาจะถูกลบออก, assistant rows ที่เป็น
  silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละออก และ
  rows ที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders
- Session: ใช้ primary session เป็นค่าเริ่มต้น (`main` หรือ `global` เมื่อ scope เป็น
  global) UI สามารถสลับระหว่างเซสชันได้
- Onboarding ใช้เซสชันเฉพาะเพื่อแยกการตั้งค่าครั้งแรกออกไป

## พื้นผิวด้านความปลอดภัย

- โหมด remote ส่งต่อเฉพาะพอร์ต Gateway WebSocket control ผ่าน SSH เท่านั้น

## ข้อจำกัดที่ทราบ

- UI นี้ปรับให้เหมาะกับแชตเซสชัน (ไม่ใช่ browser sandbox แบบเต็ม)

## ที่เกี่ยวข้อง

- [WebChat](/th/web/webchat)
- [macOS app](/th/platforms/macos)
