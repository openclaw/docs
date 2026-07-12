---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป OpenClaw บน macOS
title: การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
x-i18n:
    generated_at: "2026-07-12T16:20:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่าสำหรับนักพัฒนาบน macOS

สร้างและเรียกใช้แอปพลิเคชัน OpenClaw สำหรับ macOS จากซอร์สโค้ด

## ข้อกำหนดเบื้องต้น

- **Xcode 26.2+** (ชุดเครื่องมือ Swift 6.2) บน macOS เวอร์ชันล่าสุดที่มีให้ใน
  Software Update
- **Node.js 24 และ pnpm** สำหรับ Gateway, CLI และสคริปต์จัดทำแพ็กเกจ โดย Node
  22.19+ ก็ใช้งานได้เช่นกัน

## 1. ติดตั้งการขึ้นต่อกัน

```bash
pnpm install
```

## 2. สร้างและจัดทำแพ็กเกจแอป

```bash
./scripts/package-mac-app.sh
```

ผลลัพธ์คือ `dist/OpenClaw.app` หากไม่มีใบรับรอง Apple Developer ID
สคริปต์จะเปลี่ยนไปใช้การลงนามแบบเฉพาะกิจ

สำหรับโหมดเรียกใช้เพื่อการพัฒนา แฟล็กการลงนาม และการแก้ไขปัญหา Team ID โปรดดู
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)
วงจรการพัฒนาที่รวดเร็วจากรากของที่เก็บ: `scripts/restart-mac.sh` (เพิ่ม `--no-sign`
สำหรับการลงนามแบบเฉพาะกิจ โดยสิทธิ์ TCC จะไม่คงอยู่เมื่อใช้ `--no-sign`)

<Note>
แอปที่ลงนามแบบเฉพาะกิจอาจแสดงข้อความแจ้งเตือนด้านความปลอดภัย หากแอปขัดข้อง
ทันทีพร้อมข้อความ "Abort trap 6" โปรดดู[การแก้ไขปัญหา](#troubleshooting)
</Note>

## 3. ติดตั้ง CLI และ Gateway

แอปที่จัดทำแพ็กเกจแล้วฝังตัวติดตั้งมาตรฐาน `scripts/install-cli.sh` ไว้
สำหรับโปรไฟล์ใหม่ ให้เลือก **This Mac** ระหว่างการเริ่มต้นใช้งาน
แอปจะติดตั้ง CLI และรันไทม์ระดับผู้ใช้ที่ตรงกันก่อนเริ่มตัวช่วยสร้าง Gateway

สำหรับการกู้คืนเพื่อการพัฒนาแบบทำด้วยตนเอง ให้ติดตั้ง CLI เวอร์ชันที่ตรงกันด้วยตนเอง:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>`
ก็ใช้งานได้เช่นกัน โดย Node ยังคงเป็นรันไทม์ที่แนะนำสำหรับ Gateway

## การแก้ไขปัญหา

### การสร้างล้มเหลว: ชุดเครื่องมือหรือ SDK ไม่ตรงกัน

การสร้างแอปสำหรับ macOS ต้องใช้ macOS SDK เวอร์ชันล่าสุดและชุดเครื่องมือ Swift 6.2
(Xcode 26.2+)

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วเรียกใช้การสร้างอีกครั้ง

### แอปขัดข้องเมื่ออนุญาตสิทธิ์

หากแอปขัดข้องเมื่อคุณพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ
**Microphone** สาเหตุอาจมาจากแคช TCC ที่เสียหายหรือลายเซ็นไม่ตรงกัน

1. รีเซ็ตสิทธิ์ TCC สำหรับรหัสบันเดิลสำหรับการดีบัก:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังไม่ได้ผล ให้เปลี่ยน `BUNDLE_ID` ใน
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   ชั่วคราว เพื่อบังคับให้ macOS เริ่มต้นด้วยสถานะใหม่ทั้งหมด

### Gateway แสดง "Starting..." ไม่สิ้นสุด

ตรวจสอบว่ามีกระบวนการค้างที่ยึดพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# หากคุณไม่ได้ใช้ LaunchAgent (โหมดพัฒนา / การเรียกใช้ด้วยตนเอง) ให้ค้นหาโปรเซสที่รับฟัง:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากการเรียกใช้ด้วยตนเองยึดพอร์ตอยู่ ให้หยุดด้วย Ctrl+C หรือยุติ PID
ที่พบด้านบนเป็นทางเลือกสุดท้าย

## เนื้อหาที่เกี่ยวข้อง

- [แอปสำหรับ macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
