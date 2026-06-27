---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป OpenClaw บน macOS
title: การตั้งค่าการพัฒนาบน macOS
x-i18n:
    generated_at: "2026-06-27T17:49:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# การตั้งค่าสำหรับนักพัฒนา macOS

สร้างและเรียกใช้แอปพลิเคชัน OpenClaw macOS จากซอร์สโค้ด

## ข้อกำหนดเบื้องต้น

ก่อนสร้างแอป ตรวจสอบให้แน่ใจว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 และ pnpm**: แนะนำสำหรับ Gateway, CLI และสคริปต์แพ็กเกจ Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง Dependencies

ติดตั้ง Dependencies ทั่วทั้งโปรเจกต์:

```bash
pnpm install
```

## 2. สร้างและแพ็กเกจแอป

หากต้องการสร้างแอป macOS และแพ็กเกจเป็น `dist/OpenClaw.app` ให้เรียกใช้:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มีใบรับรอง Apple Developer ID สคริปต์จะใช้ **การลงนามแบบ ad-hoc** (`-`) โดยอัตโนมัติ

สำหรับโหมดการรันสำหรับนักพัฒนา แฟล็กการลงนาม และการแก้ปัญหา Team ID โปรดดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่ลงนามแบบ ad-hoc อาจทำให้มีพรอมต์ด้านความปลอดภัย หากแอปขัดข้องทันทีพร้อมข้อความ "Abort trap 6" โปรดดูส่วน [การแก้ปัญหา](#troubleshooting)

## 3. ติดตั้ง CLI

แอป macOS คาดหวังให้มีการติดตั้ง CLI `openclaw` แบบ global เพื่อจัดการงานเบื้องหลัง

**วิธีติดตั้ง (แนะนำ):**

1. เปิดแอป OpenClaw
2. ไปที่แท็บการตั้งค่า **ทั่วไป**
3. คลิก **"ติดตั้ง CLI"**

หรือจะติดตั้งด้วยตนเองก็ได้:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้งานได้เช่นกัน
สำหรับรันไทม์ Gateway เส้นทาง Node ยังคงเป็นวิธีที่แนะนำ

## การแก้ปัญหา

### การสร้างล้มเหลว: toolchain หรือ SDK ไม่ตรงกัน

การสร้างแอป macOS คาดหวัง SDK ของ macOS ล่าสุดและ toolchain Swift 6.2

**Dependencies ของระบบ (จำเป็น):**

- **เวอร์ชัน macOS ล่าสุดที่มีใน Software Update** (จำเป็นสำหรับ SDK ของ Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**การตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วเรียกใช้การสร้างอีกครั้ง

### แอปขัดข้องเมื่อให้สิทธิ์

หากแอปขัดข้องเมื่อคุณพยายามอนุญาตการเข้าถึง **การรู้จำเสียงพูด** หรือ **ไมโครโฟน** อาจเกิดจากแคช TCC เสียหายหรือลายเซ็นไม่ตรงกัน

**วิธีแก้ไข:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังล้มเหลว ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS เริ่มจาก "สถานะใหม่ทั้งหมด"

### Gateway ค้างที่ "กำลังเริ่มต้น..." ไม่สิ้นสุด

หากสถานะ Gateway ค้างอยู่ที่ "กำลังเริ่มต้น..." ให้ตรวจสอบว่ามีกระบวนการ zombie ยึดพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# หากคุณไม่ได้ใช้ LaunchAgent (โหมด dev / การรันด้วยตนเอง) ให้ค้นหา listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากการรันด้วยตนเองกำลังยึดพอร์ตอยู่ ให้หยุดกระบวนการนั้น (Ctrl+C) ทางเลือกสุดท้ายคือ kill PID ที่คุณพบด้านบน

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
