---
read_when:
    - กำลังมองหาระบบปฏิบัติการที่รองรับหรือพาธการติดตั้ง
    - การตัดสินใจว่าจะเรียกใช้ Gateway ที่ใด
summary: ภาพรวมการรองรับแพลตฟอร์ม (Gateway + แอปคู่หู)
title: แพลตฟอร์ม
x-i18n:
    generated_at: "2026-07-12T16:20:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

แกนหลักของ OpenClaw เขียนด้วย TypeScript **Node คือรันไทม์ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun สำหรับ Gateway เนื่องจากมีปัญหาที่ทราบแล้วกับช่องทาง WhatsApp และ
Telegram โปรดดูรายละเอียดที่ [Bun (รุ่นทดลอง)](/th/install/bun)

มีแอปคู่หูสำหรับ Windows Hub, macOS (แอปแถบเมนู) และโหนดอุปกรณ์เคลื่อนที่
(iOS/Android) แอปคู่หูสำหรับ Linux อยู่ในแผนพัฒนา แต่ปัจจุบัน Gateway
ได้รับการรองรับอย่างเต็มรูปแบบแล้ว สำหรับ Windows ให้เลือก Windows Hub หากต้องการแอปเดสก์ท็อป ใช้การติดตั้งผ่าน
PowerShell แบบเนทีฟหากเน้นการใช้งานผ่านเทอร์มินัล หรือใช้ WSL2 เพื่อให้ได้รันไทม์
Gateway ที่เข้ากันได้กับ Linux มากที่สุด

## เลือกระบบปฏิบัติการของคุณ

- macOS: [macOS](/th/platforms/macos)
- iOS: [iOS](/th/platforms/ios)
- Android: [Android](/th/platforms/android)
- Windows: [Windows](/th/platforms/windows)
- Linux: [Linux](/th/platforms/linux)

## VPS และโฮสติ้ง

- ฮับ VPS: [โฮสติ้ง VPS](/th/vps)
- Fly.io: [Fly.io](/th/install/fly)
- Hetzner (Docker): [Hetzner](/th/install/hetzner)
- GCP (Compute Engine): [GCP](/th/install/gcp)
- Azure (เครื่องเสมือน Linux): [Azure](/th/install/azure)
- exe.dev (เครื่องเสมือน + พร็อกซี HTTPS): [exe.dev](/th/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/th/platforms/easyrunner)

## ลิงก์ที่ใช้บ่อย

- คู่มือการติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started)
- Windows Hub: [Windows](/th/platforms/windows)
- คู่มือการดำเนินงาน Gateway: [Gateway](/th/gateway)
- การกำหนดค่า Gateway: [การกำหนดค่า](/th/gateway/configuration)
- สถานะบริการ: `openclaw gateway status`

## การติดตั้งบริการ Gateway (CLI)

ใช้วิธีใดวิธีหนึ่งต่อไปนี้ (รองรับทั้งหมด):

- ตัวช่วยสร้าง (แนะนำ): `openclaw onboard --install-daemon`
- โดยตรง: `openclaw gateway install`
- ขั้นตอนการกำหนดค่า: `openclaw configure` → เลือก **บริการ Gateway**
- ซ่อมแซม/ย้ายข้อมูล: `openclaw doctor` (เสนอให้ติดตั้งหรือแก้ไขบริการ)

เป้าหมายของบริการขึ้นอยู่กับระบบปฏิบัติการ:

- macOS: LaunchAgent (`ai.openclaw.gateway` หรือ `ai.openclaw.<profile>` สำหรับโปรไฟล์ที่มีชื่อ)
- Linux/WSL2: บริการผู้ใช้ systemd (`openclaw-gateway[-<profile>].service`)
- Windows แบบเนทีฟ: งานตามกำหนดเวลา (`OpenClaw Gateway` หรือ `OpenClaw Gateway (<profile>)`) โดยมีรายการเข้าสู่ระบบในโฟลเดอร์เริ่มต้นของผู้ใช้แต่ละรายเป็นทางเลือกสำรอง หากไม่ได้รับอนุญาตให้สร้างงาน

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Windows Hub](/th/platforms/windows)
- [แอป macOS](/th/platforms/macos)
- [แอป iOS](/th/platforms/ios)
