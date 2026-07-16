---
read_when:
    - กำลังมองหาการรองรับระบบปฏิบัติการหรือพาธการติดตั้ง
    - การตัดสินใจว่าจะเรียกใช้ Gateway ที่ใด
summary: ภาพรวมการรองรับแพลตฟอร์ม (Gateway + แอปคู่หู)
title: แพลตฟอร์ม
x-i18n:
    generated_at: "2026-07-16T19:18:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

แกนหลักของ OpenClaw เขียนด้วย TypeScript **Node คือรันไทม์ที่จำเป็น** เนื่องจาก
ที่เก็บสถานะมาตรฐานใช้ `node:sqlite` ส่วน Bun ยังคงใช้ได้สำหรับ
การติดตั้งการพึ่งพาและสคริปต์แพ็กเกจ โปรดดู [Bun](/th/install/bun)

มีแอปคู่หูสำหรับ Windows Hub, macOS (แอปแถบเมนู) และโหนดมือถือ
(iOS/Android) แอปคู่หูสำหรับ Linux อยู่ในแผน แต่ปัจจุบันรองรับ Gateway
อย่างเต็มรูปแบบแล้ว บน Windows ให้เลือก Windows Hub สำหรับแอปเดสก์ท็อป
เลือกการติดตั้งผ่าน PowerShell แบบเนทีฟสำหรับการใช้งานที่เน้นเทอร์มินัล
หรือเลือก WSL2 สำหรับรันไทม์ Gateway ที่เข้ากันได้กับ Linux มากที่สุด

## เลือกระบบปฏิบัติการ

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
- Azure (Linux VM): [Azure](/th/install/azure)
- exe.dev (VM + พร็อกซี HTTPS): [exe.dev](/th/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/th/platforms/easyrunner)

## ลิงก์ที่ใช้บ่อย

- คู่มือการติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started)
- Windows Hub: [Windows](/th/platforms/windows)
- คู่มือปฏิบัติการ Gateway: [Gateway](/th/gateway)
- การกำหนดค่า Gateway: [การกำหนดค่า](/th/gateway/configuration)
- สถานะบริการ: `openclaw gateway status`

## การติดตั้งบริการ Gateway (CLI)

ใช้วิธีใดวิธีหนึ่งต่อไปนี้ (รองรับทั้งหมด):

- ตัวช่วยตั้งค่า (แนะนำ): `openclaw onboard --install-daemon`
- โดยตรง: `openclaw gateway install`
- ขั้นตอนการกำหนดค่า: `openclaw configure` → เลือก **บริการ Gateway**
- ซ่อมแซม/ย้ายข้อมูล: `openclaw doctor` (เสนอให้ติดตั้งหรือแก้ไขบริการ)

เป้าหมายของบริการขึ้นอยู่กับระบบปฏิบัติการ:

- macOS: LaunchAgent (`ai.openclaw.gateway` หรือ `ai.openclaw.<profile>` สำหรับโปรไฟล์ที่มีชื่อ)
- Linux/WSL2: บริการผู้ใช้ systemd (`openclaw-gateway[-<profile>].service`)
- Windows แบบเนทีฟ: Scheduled Task (`OpenClaw Gateway` หรือ `OpenClaw Gateway (<profile>)`) โดยใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup ของผู้ใช้แต่ละรายเป็นทางเลือกสำรอง หากระบบปฏิเสธการสร้างงาน

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Windows Hub](/th/platforms/windows)
- [แอป macOS](/th/platforms/macos)
- [แอป iOS](/th/platforms/ios)
