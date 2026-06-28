---
read_when:
    - การดีบักมุมมอง WebChat บน Mac หรือพอร์ต loopback
summary: วิธีที่แอป Mac ฝัง WebChat ของ Gateway และวิธีดีบัก
title: เว็บแชต (macOS)
x-i18n:
    generated_at: "2026-05-06T09:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

แอปแถบเมนู macOS ฝัง UI ของ WebChat เป็นมุมมอง SwiftUI แบบเนทีฟ โดย
เชื่อมต่อกับ Gateway และตั้งค่าเริ่มต้นเป็น **เซสชันหลัก** สำหรับ agent ที่เลือก
(พร้อมตัวสลับเซสชันสำหรับเซสชันอื่น)

- **โหมดภายในเครื่อง**: เชื่อมต่อโดยตรงกับเว็บซ็อกเก็ตของ Gateway ภายในเครื่อง
- **โหมดระยะไกล**: ส่งต่อพอร์ตควบคุมของ Gateway ผ่าน SSH และใช้
  ทันเนลดังกล่าวเป็นระนาบข้อมูล

## การเรียกใช้และการดีบัก

- แบบกำหนดเอง: เมนู Lobster → "เปิดแชต"
- เปิดอัตโนมัติสำหรับการทดสอบ:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- บันทึก: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`)

## วิธีการเชื่อมต่อภายใน

- ระนาบข้อมูล: เมธอด WS ของ Gateway ได้แก่ `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` และเหตุการณ์ `chat`, `agent`, `presence`, `tick`, `health`
- `chat.history` ส่งคืนแถวทรานสคริปต์ที่ปรับให้เหมาะกับการแสดงผลแล้ว: แท็ก directive
  แบบอินไลน์จะถูกตัดออกจากข้อความที่มองเห็นได้, payload XML ของการเรียกเครื่องมือแบบข้อความล้วน
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และ
  โทเค็นควบคุมโมเดล ASCII/แบบเต็มความกว้างที่หลุดออกมาจะถูกตัดออก, แถว assistant ที่เป็น
  silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัว จะถูกละไว้
  และแถวที่มีขนาดใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholder ได้
- เซสชัน: ตั้งค่าเริ่มต้นเป็นเซสชันหลัก (`main` หรือ `global` เมื่อขอบเขตเป็น
  global) UI สามารถสลับระหว่างเซสชันได้
- การเริ่มต้นใช้งานใช้เซสชันเฉพาะเพื่อแยกการตั้งค่าครั้งแรกออกจากส่วนอื่น

## พื้นผิวด้านความปลอดภัย

- โหมดระยะไกลจะส่งต่อเฉพาะพอร์ตควบคุมเว็บซ็อกเก็ตของ Gateway ผ่าน SSH

## ข้อจำกัดที่ทราบ

- UI ได้รับการปรับให้เหมาะกับเซสชันแชต (ไม่ใช่แซนด์บ็อกซ์เบราว์เซอร์เต็มรูปแบบ)

## ที่เกี่ยวข้อง

- [WebChat](/th/web/webchat)
- [แอป macOS](/th/platforms/macos)
