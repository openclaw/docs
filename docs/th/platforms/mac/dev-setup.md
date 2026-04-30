---
read_when:
    - การตั้งค่าสภาพแวดล้อมสำหรับการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป OpenClaw สำหรับ macOS
title: การตั้งค่าสำหรับการพัฒนาบน macOS
x-i18n:
    generated_at: "2026-04-30T10:03:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่าสำหรับนักพัฒนา macOS

บิลด์และเรียกใช้แอปพลิเคชัน macOS ของ OpenClaw จากซอร์ส

## ข้อกำหนดเบื้องต้น

ก่อนบิลด์แอป ตรวจสอบให้แน่ใจว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 & pnpm**: แนะนำสำหรับ Gateway, CLI และสคริปต์การทำแพ็กเกจ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง Dependencies

ติดตั้ง dependencies สำหรับทั้งโปรเจกต์:

```bash
pnpm install
```

## 2. บิลด์และทำแพ็กเกจแอป

หากต้องการบิลด์แอป macOS และทำแพ็กเกจเป็น `dist/OpenClaw.app` ให้รัน:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มีใบรับรอง Apple Developer ID สคริปต์จะใช้ **ad-hoc signing** (`-`) โดยอัตโนมัติ

สำหรับโหมดการรันเพื่อพัฒนา แฟล็กการเซ็นชื่อ และการแก้ปัญหา Team ID โปรดดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่เซ็นแบบ ad-hoc อาจแสดงพรอมป์ด้านความปลอดภัย หากแอปแครชทันทีพร้อมข้อความ "Abort trap 6" โปรดดูส่วน [การแก้ปัญหา](#troubleshooting)

## 3. ติดตั้ง CLI

แอป macOS คาดหวังให้มีการติดตั้ง CLI `openclaw` แบบ global เพื่อจัดการงานเบื้องหลัง

**วิธีติดตั้ง (แนะนำ):**

1. เปิดแอป OpenClaw
2. ไปที่แท็บการตั้งค่า **General**
3. คลิก **"Install CLI"**

อีกทางหนึ่ง ติดตั้งด้วยตนเอง:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้ได้เช่นกัน
สำหรับรันไทม์ Gateway นั้น Node ยังคงเป็นแนวทางที่แนะนำ

## การแก้ปัญหา

### บิลด์ล้มเหลว: toolchain หรือ SDK ไม่ตรงกัน

การบิลด์แอป macOS คาดหวัง macOS SDK ล่าสุดและ toolchain Swift 6.2

**Dependencies ของระบบ (จำเป็น):**

- **macOS เวอร์ชันล่าสุดที่มีให้ใน Software Update** (จำเป็นสำหรับ Xcode 26.2 SDKs)
- **Xcode 26.2** (toolchain Swift 6.2)

**การตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วรันการบิลด์อีกครั้ง

### แอปแครชเมื่อให้สิทธิ์

หากแอปแครชเมื่อคุณพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ **Microphone** อาจเกิดจากแคช TCC เสียหายหรือ signature ไม่ตรงกัน

**วิธีแก้:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังล้มเหลว ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS เริ่มจาก "clean slate"

### Gateway "Starting..." ค้างไม่สิ้นสุด

หากสถานะ Gateway ค้างอยู่ที่ "Starting..." ให้ตรวจสอบว่ามี process แบบ zombie ยึดพอร์ตอยู่หรือไม่:

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
