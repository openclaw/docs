---
read_when:
    - การดีบักหรือกำหนดค่าการเข้าถึง WebChat
summary: การใช้งานโฮสต์ static ของ WebChat แบบ loopback และ Gateway WS สำหรับ UI แชต
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:45:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

สถานะ: UI แชต SwiftUI บน macOS/iOS จะคุยกับ Gateway WebSocket โดยตรง

## มันคืออะไร

- UI แชตแบบ native สำหรับ Gateway (ไม่มีเบราว์เซอร์ฝังตัวและไม่มี local static server)
- ใช้ sessions และกฎการกำหนดเส้นทางเดียวกับ channels อื่น
- การกำหนดเส้นทางแบบ deterministic: คำตอบจะถูกส่งกลับไปยัง WebChat เสมอ

## เริ่มต้นอย่างรวดเร็ว

1. เริ่ม Gateway
2. เปิด UI ของ WebChat (แอป macOS/iOS) หรือแท็บแชตของ Control UI
3. ตรวจสอบให้แน่ใจว่ามีการกำหนดค่าเส้นทาง auth ของ Gateway ที่ถูกต้อง (ค่าเริ่มต้นคือ shared-secret
   แม้บน loopback)

## วิธีการทำงาน (พฤติกรรม)

- UI จะเชื่อมต่อกับ Gateway WebSocket และใช้ `chat.history`, `chat.send` และ `chat.inject`
- `chat.history` ถูกจำกัดขอบเขตเพื่อความเสถียร: Gateway อาจตัดทอน text fields ที่ยาว ละ metadata ที่มีขนาดใหญ่ และแทนที่รายการที่ใหญ่เกินไปด้วย `[chat.history omitted: message too large]`
- `chat.history` ยังถูกทำ normalization เพื่อการแสดงผลด้วย: บริบท OpenClaw ที่มีไว้ใช้เฉพาะระหว่างรัน,
  inbound envelope wrappers, inline delivery directive tags
  เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`, payload XML ของการเรียก tool แบบ plain-text
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และบล็อกการเรียก tool ที่ถูกตัดทอน) และ
  model control tokens ที่รั่วออกมาแบบ ASCII/full-width จะถูกตัดออกจากข้อความที่มองเห็นได้
  และรายการของ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียง
  token แบบ silent ที่ตรงกันทุกตัวอักษร `NO_REPLY` / `no_reply` จะถูกละไว้
- reply payloads ที่ถูกทำเครื่องหมายว่าเป็น reasoning (`isReasoning: true`) จะถูกตัดออกจากเนื้อหา assistant ของ WebChat, ข้อความ replay ของ transcript และบล็อกเนื้อหาเสียง ดังนั้น payloads ที่มีแต่ thinking จะไม่แสดงเป็นข้อความ assistant ที่มองเห็นได้หรือเป็นเสียงที่เล่นได้
- `chat.inject` จะเพิ่มโน้ตของ assistant ลงใน transcript โดยตรงและกระจายไปยัง UI (ไม่มีการรัน agent)
- การรันที่ถูกยกเลิกอาจคง partial assistant output ไว้ให้มองเห็นได้ใน UI
- Gateway จะเก็บ partial assistant text ของการยกเลิกไว้ใน transcript history เมื่อมี buffered output อยู่ และทำเครื่องหมายรายการเหล่านั้นด้วย abort metadata
- ประวัติจะถูกดึงจาก Gateway เสมอ (ไม่มีการเฝ้าดูไฟล์ในเครื่อง)
- หากไม่สามารถเข้าถึง Gateway ได้ WebChat จะเป็นแบบอ่านอย่างเดียว

## แผงเครื่องมือ agents ของ Control UI

- แผง Tools ของ `/agents` ใน Control UI มีสองมุมมองแยกกัน:
  - **Available Right Now** ใช้ `tools.effective(sessionKey=...)` และแสดงสิ่งที่เซสชันปัจจุบัน
    ใช้งานได้จริงใน runtime รวมถึง tools ที่เป็นของ core, plugin และ channel
  - **Tool Configuration** ใช้ `tools.catalog` และยังคงมุ่งเน้นที่ profiles, overrides และ
    ความหมายของแคตตาล็อก
- ความพร้อมใช้งานใน runtime มีขอบเขตตามเซสชัน การสลับเซสชันบน agent เดียวกันอาจเปลี่ยน
  รายการ **Available Right Now**
- ตัวแก้ไข config ไม่ได้บอกเป็นนัยถึงความพร้อมใช้งานใน runtime; การเข้าถึงจริงยังคงเป็นไปตาม
  ลำดับความสำคัญของนโยบาย (`allow`/`deny`, overrides ต่อ agent และ provider/channel)

## การใช้งานแบบ remote

- โหมด remote จะ tunnel Gateway WebSocket ผ่าน SSH/Tailscale
- คุณไม่จำเป็นต้องรันเซิร์ฟเวอร์ WebChat แยกต่างหาก

## ข้อมูลอ้างอิงการกำหนดค่า (WebChat)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของ WebChat:

- `gateway.webchat.chatHistoryMaxChars`: จำนวนอักขระสูงสุดของ text fields ในการตอบกลับ `chat.history` เมื่อรายการ transcript เกินขีดจำกัดนี้ Gateway จะตัดทอน text fields ที่ยาว และอาจแทนที่ข้อความที่ใหญ่เกินไปด้วย placeholder นอกจากนี้ไคลเอนต์ยังสามารถส่ง `maxChars` ต่อคำขอเพื่อ override ค่าเริ่มต้นนี้สำหรับการเรียก `chat.history` เพียงครั้งเดียวได้

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `gateway.port`, `gateway.bind`: host/port ของ WebSocket
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth ของ WebSocket แบบ shared-secret
- `gateway.auth.allowTailscale`: แท็บแชตของ Control UI ในเบราว์เซอร์สามารถใช้ Tailscale
  Serve identity headers ได้เมื่อเปิดใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: auth แบบ reverse-proxy สำหรับไคลเอนต์เบราว์เซอร์ที่อยู่หลังแหล่ง proxy แบบ **non-loopback** ที่รับรู้ตัวตนได้ (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: เป้าหมาย Gateway ระยะไกล
- `session.*`: ที่เก็บ session และค่าเริ่มต้นของ main key

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [Dashboard](/th/web/dashboard)
