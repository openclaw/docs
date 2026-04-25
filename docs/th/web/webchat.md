---
read_when:
    - การดีบักหรือการกำหนดค่าการเข้าถึง WebChat
summary: โฮสต์สแตติก WebChat บน loopback และการใช้งาน Gateway WS สำหรับ UI แชต
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:02:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

สถานะ: UI แชต SwiftUI บน macOS/iOS จะสื่อสารกับ Gateway WebSocket โดยตรง

## มันคืออะไร

- UI แชตแบบเนทีฟสำหรับ gateway (ไม่มีเบราว์เซอร์ฝังตัวและไม่มี static server ภายในเครื่อง)
- ใช้เซสชันและกฎการกำหนดเส้นทางเดียวกับ channel อื่น ๆ
- การกำหนดเส้นทางแบบกำหนดแน่นอน: คำตอบจะถูกส่งกลับไปที่ WebChat เสมอ

## เริ่มต้นอย่างรวดเร็ว

1. เริ่ม gateway
2. เปิด UI ของ WebChat (แอป macOS/iOS) หรือแท็บแชตของ Control UI
3. ตรวจสอบให้แน่ใจว่ามีการกำหนดค่าเส้นทาง auth ของ gateway ที่ถูกต้องไว้แล้ว (ค่าเริ่มต้นเป็น shared-secret
   แม้อยู่บน loopback)

## วิธีการทำงาน (พฤติกรรม)

- UI จะเชื่อมต่อกับ Gateway WebSocket และใช้ `chat.history`, `chat.send` และ `chat.inject`
- `chat.history` มีการจำกัดขอบเขตเพื่อความเสถียร: Gateway อาจตัดข้อความที่ยาวมาก ละเมทาดาทาที่มีขนาดใหญ่ และแทนรายการที่ใหญ่เกินไปด้วย `[chat.history omitted: message too large]`
- `chat.history` ยังถูกทำให้เป็นมาตรฐานสำหรับการแสดงผลด้วย: context ของ OpenClaw ที่ใช้เฉพาะ runtime,
  inbound envelope wrappers, แท็ก directive สำหรับการส่งแบบ inline
  เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`, payload XML ของการเรียก tool ในข้อความธรรมดา
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และบล็อกการเรียก tool ที่ถูกตัดทอน), และ
  token ควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วออกมาจะถูกลบออกจากข้อความที่มองเห็นได้
  และรายการของ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียง
  token เงียบแบบตรงตัว `NO_REPLY` / `no_reply` จะถูกละไว้ไม่แสดง
- `chat.inject` จะ append หมายเหตุของ assistant ลงใน transcript โดยตรงและ broadcast ไปยัง UI (ไม่มีการรัน agent)
- การรันที่ถูกยกเลิกอาจยังคงทำให้เอาต์พุตบางส่วนของ assistant มองเห็นได้ใน UI
- Gateway จะบันทึกข้อความบางส่วนของ assistant จากการยกเลิกลงในประวัติ transcript เมื่อมี buffered output อยู่ และทำเครื่องหมายรายการเหล่านั้นด้วยเมทาดาทาการยกเลิก
- ประวัติจะถูกดึงจาก gateway เสมอ (ไม่มีการเฝ้าดูไฟล์ภายในเครื่อง)
- หากเข้าถึง gateway ไม่ได้ WebChat จะเป็นแบบอ่านอย่างเดียว

## แผง tools ของ agents ใน Control UI

- แผง Tools ของ `/agents` ใน Control UI มีสองมุมมองแยกกัน:
  - **พร้อมใช้งานตอนนี้** ใช้ `tools.effective(sessionKey=...)` และแสดงสิ่งที่เซสชันปัจจุบัน
    ใช้งานได้จริงใน runtime รวมถึง tools ของ core, Plugin และ channel
  - **การกำหนดค่า Tool** ใช้ `tools.catalog` และยังคงเน้นที่ profiles, overrides และ
    semantics ของ catalog
- ความพร้อมใช้งานใน runtime มีขอบเขตตามเซสชัน การสลับเซสชันบน agent เดียวกันสามารถเปลี่ยน
  รายการ **พร้อมใช้งานตอนนี้** ได้
- ตัวแก้ไข config ไม่ได้หมายความว่าจะพร้อมใช้งานใน runtime; การเข้าถึงจริงยังคงเป็นไปตามลำดับความสำคัญของนโยบาย
  (`allow`/`deny`, overrides ต่อ agent และ provider/channel)

## การใช้งานระยะไกล

- โหมดระยะไกลจะ tunnel Gateway WebSocket ผ่าน SSH/Tailscale
- คุณไม่จำเป็นต้องรันเซิร์ฟเวอร์ WebChat แยกต่างหาก

## เอกสารอ้างอิงการกำหนดค่า (WebChat)

การกำหนดค่าเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของ WebChat:

- `gateway.webchat.chatHistoryMaxChars`: จำนวนอักขระสูงสุดสำหรับฟิลด์ข้อความในคำตอบ `chat.history` เมื่อรายการ transcript เกินขีดจำกัดนี้ Gateway จะตัดข้อความที่ยาวมาก และอาจแทนข้อความที่ใหญ่เกินไปด้วย placeholder ไคลเอนต์ยังสามารถส่ง `maxChars` ต่อคำขอเพื่อ override ค่าเริ่มต้นนี้สำหรับการเรียก `chat.history` เพียงครั้งเดียวได้

ตัวเลือก global ที่เกี่ยวข้อง:

- `gateway.port`, `gateway.bind`: โฮสต์/พอร์ตของ WebSocket
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth ของ WebSocket แบบ shared-secret
- `gateway.auth.allowTailscale`: แท็บแชตของ Control UI บนเบราว์เซอร์สามารถใช้
  header ยืนยันตัวตนของ Tailscale Serve ได้เมื่อเปิดใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: auth ผ่าน reverse proxy สำหรับไคลเอนต์เบราว์เซอร์ที่อยู่หลังแหล่ง proxy แบบ **non-loopback** ที่รับรู้ตัวตน (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: เป้าหมาย gateway ระยะไกล
- `session.*`: ที่เก็บเซสชันและค่าเริ่มต้นของคีย์หลัก

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [Dashboard](/th/web/dashboard)
