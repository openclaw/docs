---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป OpenClaw สำหรับ macOS
title: การตั้งค่าสภาพแวดล้อมพัฒนาบน macOS
x-i18n:
    generated_at: "2026-07-04T06:56:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่านักพัฒนาบน macOS

สร้างและเรียกใช้แอปพลิเคชัน OpenClaw สำหรับ macOS จากซอร์ส

## ข้อกำหนดเบื้องต้น

ก่อนสร้างแอป ตรวจสอบให้แน่ใจว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 และ pnpm**: แนะนำสำหรับ gateway, CLI และสคริปต์จัดแพ็กเกจ Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง Dependencies

ติดตั้ง dependencies ทั้งโปรเจกต์:

```bash
pnpm install
```

## 2. สร้างและจัดแพ็กเกจแอป

หากต้องการสร้างแอป macOS และจัดแพ็กเกจเป็น `dist/OpenClaw.app` ให้เรียกใช้:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มีใบรับรอง Apple Developer ID สคริปต์จะใช้ **การลงนามแบบ ad-hoc** (`-`) โดยอัตโนมัติ

สำหรับโหมดเรียกใช้สำหรับพัฒนา แฟล็กการลงนาม และการแก้ปัญหา Team ID โปรดดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่ลงนามแบบ ad-hoc อาจเรียกพรอมต์ความปลอดภัย หากแอปขัดข้องทันทีพร้อมข้อความ "Abort trap 6" โปรดดูส่วน [การแก้ปัญหา](#troubleshooting)

## 3. ติดตั้ง CLI และ Gateway

แอปที่จัดแพ็กเกจจะฝังตัวติดตั้งมาตรฐาน `scripts/install-cli.sh` ไว้ ในโปรไฟล์ใหม่ ให้เลือก **This Mac** ระหว่างการเริ่มต้นใช้งาน แอปจะติดตั้ง CLI และ runtime ระดับผู้ใช้ที่ตรงกันก่อนเริ่มตัวช่วยตั้งค่า Gateway

สำหรับการกู้คืนการพัฒนาด้วยตนเอง ให้ติดตั้ง CLI ที่ตรงกันด้วยตัวเอง:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้งานได้เช่นกัน สำหรับ runtime ของ Gateway นั้น Node ยังคงเป็นเส้นทางที่แนะนำ

## การแก้ปัญหา

### การสร้างล้มเหลว: toolchain หรือ SDK ไม่ตรงกัน

การสร้างแอป macOS คาดหวัง macOS SDK ล่าสุดและ Swift 6.2 toolchain

**Dependencies ของระบบ (จำเป็น):**

- **macOS เวอร์ชันล่าสุดที่มีใน Software Update** (จำเป็นสำหรับ Xcode 26.2 SDKs)
- **Xcode 26.2** (Swift 6.2 toolchain)

**การตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วเรียกใช้การสร้างอีกครั้ง

### แอปขัดข้องเมื่อให้สิทธิ์

หากแอปขัดข้องเมื่อคุณพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ **Microphone** อาจเกิดจากแคช TCC เสียหายหรือลายเซ็นไม่ตรงกัน

**วิธีแก้ไข:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังล้มเหลว ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS เริ่มจากสถานะ "clean slate"

### Gateway "Starting..." ไม่สิ้นสุด

หากสถานะ gateway ค้างอยู่ที่ "Starting..." ให้ตรวจสอบว่ามีโปรเซสซอมบี้กำลังยึดพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากการเรียกใช้ด้วยตนเองกำลังยึดพอร์ต ให้หยุดโปรเซสนั้น (Ctrl+C) ทางเลือกสุดท้าย ให้ kill PID ที่คุณพบด้านบน

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
