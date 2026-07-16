---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป OpenClaw บน macOS
title: การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
x-i18n:
    generated_at: "2026-07-16T19:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่าสภาพแวดล้อมนักพัฒนาบน macOS

สร้างและเรียกใช้แอปพลิเคชัน OpenClaw สำหรับ macOS จากซอร์สโค้ด

## ข้อกำหนดเบื้องต้น

- **Xcode 26.2+** (ชุดเครื่องมือ Swift 6.2) บน macOS เวอร์ชันล่าสุดที่มีใน
  Software Update
- **Node.js 24.15+ และ pnpm** สำหรับ Gateway, CLI และสคริปต์การจัดแพ็กเกจ นอกจากนี้ Node
  22.22.3+ ก็ใช้งานได้เช่นกัน

## 1. ติดตั้งส่วนที่ต้องพึ่งพา

```bash
pnpm install
```

## 2. สร้างและจัดแพ็กเกจแอป

```bash
./scripts/package-mac-app.sh
```

สร้างผลลัพธ์เป็น `dist/OpenClaw.app` หากไม่มีใบรับรอง Apple Developer ID
สคริปต์จะเปลี่ยนไปใช้การลงนามแบบเฉพาะกิจ

สำหรับโหมดการเรียกใช้เพื่อพัฒนา แฟล็กการลงนาม และการแก้ไขปัญหา Team ID โปรดดู
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)
วงจรการพัฒนาอย่างรวดเร็วจากรูทของที่เก็บ: `scripts/restart-mac.sh` (เพิ่ม `--no-sign` สำหรับ
การลงนามแบบเฉพาะกิจ โดยสิทธิ์ TCC จะไม่คงอยู่เมื่อใช้ `--no-sign`)

<Note>
แอปที่ลงนามแบบเฉพาะกิจอาจแสดงข้อความแจ้งเตือนด้านความปลอดภัย หากแอปหยุดทำงาน
ทันทีพร้อมข้อความ "Abort trap 6" โปรดดู[การแก้ไขปัญหา](#troubleshooting)
</Note>

## 3. ติดตั้ง CLI และ Gateway

แอปที่จัดแพ็กเกจแล้วมีตัวติดตั้งมาตรฐาน `scripts/install-cli.sh` ฝังอยู่ ใน
โปรไฟล์ใหม่ ให้เลือก **This Mac** ระหว่างการเริ่มต้นใช้งาน แอปจะติดตั้ง
CLI และรันไทม์ระดับผู้ใช้เวอร์ชันที่ตรงกันก่อนเริ่มตัวช่วยสร้าง Gateway

สำหรับการกู้คืนในการพัฒนาแบบดำเนินการเอง ให้ติดตั้ง CLI เวอร์ชันที่ตรงกันด้วยตนเอง:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็
ใช้งานได้เช่นกัน Node ยังคงเป็นรันไทม์ที่แนะนำสำหรับตัว Gateway

## การแก้ไขปัญหา

### การสร้างล้มเหลว: ชุดเครื่องมือหรือ SDK ไม่ตรงกัน

การสร้างแอป macOS ต้องใช้ macOS SDK เวอร์ชันล่าสุดและชุดเครื่องมือ Swift 6.2
(Xcode 26.2+)

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วเรียกใช้การสร้างอีกครั้ง

### แอปหยุดทำงานขณะให้สิทธิ์

หากแอปหยุดทำงานเมื่อพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ
**Microphone** สาเหตุอาจเป็นแคช TCC ที่เสียหายหรือลายเซ็นไม่ตรงกัน

1. รีเซ็ตสิทธิ์ TCC สำหรับรหัสบันเดิลดีบัก:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังไม่ได้ผล ให้เปลี่ยน `BUNDLE_ID` ใน
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   ชั่วคราวเพื่อบังคับให้ macOS เริ่มต้นจากสถานะใหม่ทั้งหมด

### Gateway แสดง "Starting..." อย่างไม่สิ้นสุด

ตรวจสอบว่ามีกระบวนการซอมบี้ครองพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# หากคุณไม่ได้ใช้ LaunchAgent (โหมดพัฒนา / การเรียกใช้ด้วยตนเอง) ให้ค้นหาตัวรับการเชื่อมต่อ:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากการเรียกใช้ด้วยตนเองครองพอร์ตอยู่ ให้หยุดการทำงาน (Ctrl+C) หรือยุติ PID ที่พบข้างต้น
เป็นทางเลือกสุดท้าย

## เนื้อหาที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
