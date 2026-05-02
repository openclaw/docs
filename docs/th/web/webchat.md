---
read_when:
    - การดีบักหรือการกำหนดค่าการเข้าถึง WebChat
summary: โฮสต์แบบสแตติกของ Loopback WebChat และการใช้งาน WS ของ Gateway สำหรับ UI แชท
title: แชตผ่านเว็บ
x-i18n:
    generated_at: "2026-05-02T23:39:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

สถานะ: UI แชต SwiftUI ของ macOS/iOS สื่อสารกับ Gateway WebSocket โดยตรง

## คืออะไร

- UI แชตแบบเนทีฟสำหรับ gateway (ไม่มีเบราว์เซอร์ฝังตัว และไม่มีเซิร์ฟเวอร์สแตติกในเครื่อง)
- ใช้เซสชันและกฎการกำหนดเส้นทางเดียวกับช่องทางอื่น
- การกำหนดเส้นทางแบบกำหนดผลได้: การตอบกลับจะกลับไปยัง WebChat เสมอ

## เริ่มต้นอย่างรวดเร็ว

1. เริ่ม gateway
2. เปิด UI WebChat (แอป macOS/iOS) หรือแท็บแชต Control UI
3. ตรวจสอบว่ามีการกำหนดค่าเส้นทางการตรวจสอบสิทธิ์ gateway ที่ถูกต้อง (ค่าเริ่มต้นคือ shared-secret
   แม้บน loopback)

## วิธีทำงาน (พฤติกรรม)

- UI เชื่อมต่อกับ Gateway WebSocket และใช้ `chat.history`, `chat.send`, `chat.inject` และ `chat.transcribeAudio`
- `chat.history` ถูกจำกัดขอบเขตเพื่อความเสถียร: Gateway อาจตัดฟิลด์ข้อความยาว ละเว้น metadata ขนาดใหญ่ และแทนที่รายการที่มีขนาดเกินด้วย `[chat.history omitted: message too large]`
- `chat.history` ติดตามแขนง transcript ที่ใช้งานอยู่สำหรับไฟล์เซสชันแบบ append-only สมัยใหม่ ดังนั้นแขนง rewrite ที่ถูกทิ้งและสำเนา prompt ที่ถูกแทนที่แล้วจะไม่ถูกเรนเดอร์ใน WebChat
- Control UI จดจำ Gateway `sessionId` พื้นฐานที่ `chat.history` ส่งกลับมา และใส่ไว้ในการเรียก `chat.send` ครั้งถัดไป ดังนั้นการเชื่อมต่อใหม่และการรีเฟรชหน้าจะดำเนินบทสนทนาที่จัดเก็บไว้เดิมต่อไป เว้นแต่ผู้ใช้จะเริ่มหรือรีเซ็ตเซสชัน
- Control UI รวมการส่งที่ซ้ำกันซึ่งกำลังดำเนินอยู่สำหรับเซสชัน ข้อความ และไฟล์แนบเดียวกันก่อนสร้าง run id ใหม่ของ `chat.send`; Gateway ยังคง dedupe คำขอซ้ำที่ใช้ idempotency key เดียวกันซ้ำ
- `chat.history` ยังถูกปรับรูปแบบเพื่อการแสดงผล: บริบท OpenClaw เฉพาะ runtime,
  ตัวห่อ envelope ขาเข้า, แท็กคำสั่งการส่งแบบ inline
  เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`, payload XML ของ tool-call แบบข้อความล้วน
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัด), และ
  โทเค็นควบคุมโมเดล ASCII/full-width ที่รั่วไหล จะถูกตัดออกจากข้อความที่มองเห็นได้,
  และรายการของ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดเป็นเพียงโทเค็นเงียบที่ตรงกันทุกประการ
  `NO_REPLY` / `no_reply` จะถูกละเว้น
- payload การตอบกลับที่ถูกตั้งค่าสถานะว่าเป็น reasoning (`isReasoning: true`) จะถูกแยกออกจากเนื้อหา assistant ของ WebChat, ข้อความ replay ของ transcript และบล็อกเนื้อหาเสียง ดังนั้น payload ที่มีไว้สำหรับการคิดเท่านั้นจะไม่ปรากฏเป็นข้อความ assistant ที่มองเห็นได้หรือเสียงที่เล่นได้
- `chat.transcribeAudio` ขับเคลื่อนการ dictation ฝั่งเซิร์ฟเวอร์ในตัวเขียนแชตของ Control UI เบราว์เซอร์บันทึกเสียงไมโครโฟน ส่งเป็น base64 ไปยัง Gateway และ Gateway เรียกใช้ pipeline `tools.media.audio` ที่กำหนดค่าไว้ transcript ที่ส่งกลับมาจะถูกแทรกลงในฉบับร่าง; จะไม่มีการเริ่ม agent run จนกว่าผู้ใช้จะส่ง
- `chat.inject` เพิ่มบันทึก assistant ต่อท้าย transcript โดยตรงและ broadcast ไปยัง UI (ไม่มี agent run)
- run ที่ถูกยกเลิกสามารถคงเอาต์พุต assistant บางส่วนให้มองเห็นได้ใน UI
- Gateway บันทึกข้อความ assistant บางส่วนที่ถูกยกเลิกลงในประวัติ transcript เมื่อมีเอาต์พุตที่ถูก buffer ไว้ และทำเครื่องหมายรายการเหล่านั้นด้วย metadata การยกเลิก
- ประวัติจะถูกดึงจาก gateway เสมอ (ไม่มีการเฝ้าดูไฟล์ในเครื่อง)
- หาก gateway เข้าถึงไม่ได้ WebChat จะเป็นแบบอ่านอย่างเดียว

## แผงเครื่องมือ agent ของ Control UI

- แผง Tools ของ Control UI `/agents` มีสองมุมมองแยกกัน:
  - **Available Right Now** ใช้ `tools.effective(sessionKey=...)` และแสดงสิ่งที่เซสชันปัจจุบัน
    สามารถใช้ได้จริงใน runtime รวมถึงเครื่องมือที่ core, plugin และช่องทางเป็นเจ้าของ
  - **Tool Configuration** ใช้ `tools.catalog` และยังคงโฟกัสที่โปรไฟล์ การ override และ
    ความหมายของ catalog
- ความพร้อมใช้งานใน runtime มีขอบเขตตามเซสชัน การสลับเซสชันบน agent เดียวกันอาจเปลี่ยนรายการ
  **Available Right Now**
- ตัวแก้ไข config ไม่ได้บ่งบอกถึงความพร้อมใช้งานใน runtime; การเข้าถึงจริงยังคงเป็นไปตามลำดับความสำคัญของ policy
  (`allow`/`deny`, การ override ต่อ agent และ provider/channel)

## การใช้งานระยะไกล

- โหมดระยะไกล tunnel Gateway WebSocket ผ่าน SSH/Tailscale
- คุณไม่จำเป็นต้องรันเซิร์ฟเวอร์ WebChat แยกต่างหาก

## ข้อมูลอ้างอิงการกำหนดค่า (WebChat)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือก WebChat:

- `gateway.webchat.chatHistoryMaxChars`: จำนวนอักขระสูงสุดสำหรับฟิลด์ข้อความใน response ของ `chat.history` เมื่อรายการ transcript เกินขีดจำกัดนี้ Gateway จะตัดฟิลด์ข้อความยาว และอาจแทนที่ข้อความที่มีขนาดเกินด้วย placeholder นอกจากนี้ client ยังสามารถส่ง `maxChars` ต่อคำขอเพื่อ override ค่าเริ่มต้นนี้สำหรับการเรียก `chat.history` ครั้งเดียวได้

ตัวเลือกระดับ global ที่เกี่ยวข้อง:

- `gateway.port`, `gateway.bind`: โฮสต์/พอร์ต WebSocket
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  การตรวจสอบสิทธิ์ WebSocket แบบ shared-secret
- `gateway.auth.allowTailscale`: แท็บแชต Control UI ในเบราว์เซอร์สามารถใช้ header ระบุตัวตน Tailscale
  Serve ได้เมื่อเปิดใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: การตรวจสอบสิทธิ์ reverse-proxy สำหรับ client เบราว์เซอร์ที่อยู่หลังแหล่ง proxy **ที่ไม่ใช่ loopback** ซึ่งรับรู้ตัวตนได้ (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: เป้าหมาย gateway ระยะไกล
- `session.*`: ที่เก็บเซสชันและค่าเริ่มต้นของคีย์หลัก

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [Dashboard](/th/web/dashboard)
