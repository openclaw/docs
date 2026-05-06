---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป macOS ของ OpenClaw
title: การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
x-i18n:
    generated_at: "2026-05-06T09:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่านักพัฒนา macOS

สร้างและรันแอปพลิเคชัน OpenClaw สำหรับ macOS จากซอร์ส

## ข้อกำหนดเบื้องต้น

ก่อนสร้างแอป ตรวจสอบให้แน่ใจว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 และ pnpm**: แนะนำสำหรับ Gateway, CLI และสคริปต์การแพ็กเกจ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง Dependencies

ติดตั้ง dependencies ทั้งโปรเจกต์:

```bash
pnpm install
```

## 2. สร้างและแพ็กเกจแอป

หากต้องการสร้างแอป macOS และแพ็กเกจเป็น `dist/OpenClaw.app` ให้รัน:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มีใบรับรอง Apple Developer ID สคริปต์จะใช้ **การลงนามแบบ ad-hoc** (`-`) โดยอัตโนมัติ

สำหรับโหมดการรันสำหรับพัฒนา แฟล็กการลงนาม และการแก้ปัญหา Team ID โปรดดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่ลงนามแบบ ad-hoc อาจทำให้มีพรอมป์ด้านความปลอดภัย หากแอปขัดข้องทันทีพร้อมข้อความ "Abort trap 6" โปรดดูส่วน [การแก้ปัญหา](#troubleshooting)

## 3. ติดตั้ง CLI

แอป macOS คาดว่าจะมีการติดตั้ง CLI `openclaw` แบบ global เพื่อจัดการงานเบื้องหลัง

**วิธีติดตั้ง (แนะนำ):**

1. เปิดแอป OpenClaw
2. ไปที่แท็บการตั้งค่า **ทั่วไป**
3. คลิก **"ติดตั้ง CLI"**

หรือจะติดตั้งด้วยตนเองก็ได้:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้งานได้เช่นกัน
สำหรับรันไทม์ Gateway ยังคงแนะนำให้ใช้เส้นทาง Node

## การแก้ปัญหา

### การสร้างล้มเหลว: toolchain หรือ SDK ไม่ตรงกัน

การสร้างแอป macOS คาดว่าจะใช้ macOS SDK ล่าสุดและ toolchain Swift 6.2

**Dependencies ของระบบ (จำเป็น):**

- **macOS เวอร์ชันล่าสุดที่มีใน Software Update** (จำเป็นสำหรับ SDK ของ Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**การตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วรันการสร้างอีกครั้ง

### แอปขัดข้องเมื่อให้สิทธิ์

หากแอปขัดข้องเมื่อคุณพยายามอนุญาตการเข้าถึง **การรู้จำเสียงพูด** หรือ **ไมโครโฟน** อาจเกิดจากแคช TCC เสียหายหรือลายเซ็นไม่ตรงกัน

**วิธีแก้ไข:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังล้มเหลว ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS เริ่มจากสถานะ "สะอาด"

### Gateway "Starting..." ค้างไม่สิ้นสุด

หากสถานะ Gateway ค้างอยู่ที่ "Starting..." ให้ตรวจสอบว่ามี zombie process กำลังยึดพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากการรันด้วยตนเองกำลังยึดพอร์ตอยู่ ให้หยุด process นั้น (Ctrl+C) ทางเลือกสุดท้ายคือ kill PID ที่คุณพบด้านบน

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
