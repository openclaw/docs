---
read_when:
    - กำลังมองหาการรองรับ OS หรือเส้นทางการติดตั้ง
    - การตัดสินใจว่าจะรัน Gateway ที่ใด
summary: ภาพรวมการรองรับแพลตฟอร์ม (Gateway + แอปคู่กัน)
title: แพลตฟอร์ม
x-i18n:
    generated_at: "2026-06-27T17:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core เขียนด้วย TypeScript **Node คือ runtime ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun สำหรับ Gateway — มีปัญหาที่ทราบกับช่องทาง WhatsApp และ
Telegram; ดูรายละเอียดที่ [Bun (ทดลอง)](/th/install/bun)

มีแอปคู่หูสำหรับ Windows Hub, macOS (แอปแถบเมนู) และโหนดมือถือ
(iOS/Android) แอปคู่หูสำหรับ Linux มีแผนไว้แล้ว แต่ Gateway รองรับเต็มรูปแบบ
ในปัจจุบัน บน Windows ให้เลือก Windows Hub สำหรับแอปเดสก์ท็อป, การติดตั้ง
PowerShell แบบ native สำหรับการใช้งานที่เน้นเทอร์มินัลก่อน หรือ WSL2 สำหรับ
runtime ของ Gateway ที่เข้ากันได้กับ Linux มากที่สุด

## เลือก OS ของคุณ

- macOS: [macOS](/th/platforms/macos)
- iOS: [iOS](/th/platforms/ios)
- Android: [Android](/th/platforms/android)
- Windows: [Windows](/th/platforms/windows)
- Linux: [Linux](/th/platforms/linux)

## VPS และโฮสติ้ง

- ฮับ VPS: [VPS hosting](/th/vps)
- Fly.io: [Fly.io](/th/install/fly)
- Hetzner (Docker): [Hetzner](/th/install/hetzner)
- GCP (Compute Engine): [GCP](/th/install/gcp)
- Azure (Linux VM): [Azure](/th/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/th/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/th/platforms/easyrunner)

## ลิงก์ทั่วไป

- คู่มือการติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started)
- Windows Hub: [Windows](/th/platforms/windows)
- คู่มือปฏิบัติการ Gateway: [Gateway](/th/gateway)
- การกำหนดค่า Gateway: [การกำหนดค่า](/th/gateway/configuration)
- สถานะบริการ: `openclaw gateway status`

## การติดตั้งบริการ Gateway (CLI)

ใช้ตัวเลือกใดตัวเลือกหนึ่งต่อไปนี้ (รองรับทั้งหมด):

- วิซาร์ด (แนะนำ): `openclaw onboard --install-daemon`
- โดยตรง: `openclaw gateway install`
- โฟลว์การกำหนดค่า: `openclaw configure` → เลือก **บริการ Gateway**
- ซ่อมแซม/ย้ายข้อมูล: `openclaw doctor` (เสนอให้ติดตั้งหรือแก้ไขบริการ)

เป้าหมายของบริการขึ้นอยู่กับ OS:

- macOS: LaunchAgent (`ai.openclaw.gateway` หรือ `ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*`)
- Linux/WSL2: บริการ systemd สำหรับผู้ใช้ (`openclaw-gateway[-<profile>].service`)
- Windows แบบ native: Scheduled Task (`OpenClaw Gateway` หรือ `OpenClaw Gateway (<profile>)`) พร้อมทางเลือกสำรองเป็นรายการเข้าสู่ระบบในโฟลเดอร์ Startup ต่อผู้ใช้ หากการสร้างงานถูกปฏิเสธ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Windows Hub](/th/platforms/windows)
- [แอป macOS](/th/platforms/macos)
- [แอป iOS](/th/platforms/ios)
