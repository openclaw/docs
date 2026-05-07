---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนา macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป macOS ของ OpenClaw
title: การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
x-i18n:
    generated_at: "2026-05-07T13:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่านักพัฒนา macOS

สร้างและเรียกใช้แอปพลิเคชัน OpenClaw สำหรับ macOS จากซอร์ส

## ข้อกำหนดเบื้องต้น

ก่อนสร้างแอป ให้ตรวจสอบว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 และ pnpm**: แนะนำสำหรับ Gateway, CLI และสคริปต์แพ็กเกจ Node 22 LTS ซึ่งปัจจุบันคือ `22.16+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง Dependencies

ติดตั้ง dependencies สำหรับทั้งโปรเจกต์:

```bash
pnpm install
```

## 2. สร้างและแพ็กเกจแอป

หากต้องการสร้างแอป macOS และแพ็กเกจเป็น `dist/OpenClaw.app` ให้เรียกใช้:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มีใบรับรอง Apple Developer ID สคริปต์จะใช้ **การลงนามแบบเฉพาะกิจ** (`-`) โดยอัตโนมัติ

สำหรับโหมดการรันเพื่อพัฒนา แฟล็กการลงนาม และการแก้ปัญหา Team ID โปรดดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่ลงนามแบบเฉพาะกิจอาจทำให้มีพรอมป์ด้านความปลอดภัยปรากฏ หากแอปขัดข้องทันทีพร้อมข้อความ "Abort trap 6" โปรดดูส่วน [การแก้ไขปัญหา](#troubleshooting)

## 3. ติดตั้ง CLI

แอป macOS คาดว่าจะมีการติดตั้ง CLI `openclaw` แบบ global เพื่อจัดการงานเบื้องหลัง

**วิธีติดตั้ง (แนะนำ):**

1. เปิดแอป OpenClaw
2. ไปที่แท็บการตั้งค่า **General**
3. คลิก **"Install CLI"**

หรือจะติดตั้งด้วยตนเองก็ได้:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้งานได้เช่นกัน
สำหรับรันไทม์ Gateway, Node ยังคงเป็นแนวทางที่แนะนำ

## การแก้ไขปัญหา

### การสร้างล้มเหลว: toolchain หรือ SDK ไม่ตรงกัน

การสร้างแอป macOS คาดว่าจะใช้ macOS SDK ล่าสุดและ Swift 6.2 toolchain

**Dependencies ของระบบ (จำเป็น):**

- **เวอร์ชัน macOS ล่าสุดที่มีใน Software Update** (จำเป็นสำหรับ Xcode 26.2 SDKs)
- **Xcode 26.2** (Swift 6.2 toolchain)

**การตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วรันการสร้างอีกครั้ง

### แอปขัดข้องเมื่อให้สิทธิ์

หากแอปขัดข้องเมื่อคุณพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ **Microphone** อาจเกิดจากแคช TCC เสียหายหรือลายเซ็นไม่ตรงกัน

**วิธีแก้:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังล้มเหลว ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS เริ่มจาก "clean slate"

### Gateway "Starting..." อย่างไม่สิ้นสุด

หากสถานะ Gateway ค้างอยู่ที่ "Starting..." ให้ตรวจสอบว่ามีโปรเซส zombie ยึดพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากการรันด้วยตนเองยึดพอร์ตอยู่ ให้หยุดโปรเซสนั้น (Ctrl+C) หากจำเป็นจริง ๆ ให้ kill PID ที่คุณพบด้านบนเป็นวิธีสุดท้าย

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
