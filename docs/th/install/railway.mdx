---
read_when:
    - การปรับใช้ OpenClaw บน Railway
    - คุณต้องการปรับใช้บนคลาวด์ด้วยคลิกเดียว พร้อม UI ควบคุมผ่านเบราว์เซอร์
summary: ปรับใช้ OpenClaw บน Railway ด้วยเทมเพลตแบบคลิกเดียว
title: Railway
x-i18n:
    generated_at: "2026-07-12T16:19:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

ปรับใช้ OpenClaw บน Railway ด้วยเทมเพลตแบบคลิกเดียว และเข้าถึงผ่าน Control UI บนเว็บ วิธีนี้เป็นวิธีที่ง่ายที่สุดโดย "ไม่ต้องใช้เทอร์มินัลบนเซิร์ฟเวอร์": Railway จะเรียกใช้ Gateway ให้คุณ

## การปรับใช้แบบคลิกเดียว

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  ปรับใช้บน Railway
</a>

<Steps>
  <Step title="ปรับใช้เทมเพลต">
    คลิก **Deploy on Railway** ด้านบน
  </Step>

<Step title="เพิ่มวอลุ่ม">
  เชื่อมต่อวอลุ่มที่เมานต์ไว้ที่ `/data` (จำเป็นสำหรับการเก็บสถานะแบบถาวร)
</Step>

  <Step title="ตั้งค่าตัวแปร">
    ตั้งค่า **Variables** ที่จำเป็นในบริการ:

    - `OPENCLAW_GATEWAY_PORT=8080` (จำเป็น -- ต้องตรงกับพอร์ตใน Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (จำเป็น; ให้ถือว่าเป็นข้อมูลลับของผู้ดูแลระบบ)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (แนะนำ)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (แนะนำ)

  </Step>

<Step title="เปิดใช้งานเครือข่ายสาธารณะ">
  ภายใต้ **Public Networking** ให้เปิดใช้งาน **HTTP Proxy** สำหรับบริการบนพอร์ต `8080`
</Step>

  <Step title="เชื่อมต่อ">
    ค้นหา URL สาธารณะของคุณใน **Railway -> your service -> Settings -> Domains** -- ซึ่งอาจเป็นโดเมนที่สร้างให้อัตโนมัติ (โดยทั่วไปคือ `https://<something>.up.railway.app`) หรือโดเมนแบบกำหนดเองที่คุณเชื่อมต่อไว้

    เปิด `https://<your-railway-domain>/openclaw` แล้วเชื่อมต่อโดยใช้ข้อมูลลับที่ใช้ร่วมกันซึ่งตั้งค่าไว้ โดยค่าเริ่มต้นเทมเพลตจะใช้ `OPENCLAW_GATEWAY_TOKEN`; หากคุณเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

  </Step>
</Steps>

## สิ่งที่คุณจะได้รับ

- OpenClaw Gateway และ Control UI ที่โฮสต์ให้แล้ว
- พื้นที่จัดเก็บถาวรผ่าน Railway Volume (`/data`) ทำให้ `openclaw.json`, `auth-profiles.json` ของแต่ละเอเจนต์, สถานะของช่องทาง/ผู้ให้บริการ, เซสชัน และพื้นที่ทำงานยังคงอยู่หลังการปรับใช้อีกครั้ง

## เชื่อมต่อช่องทาง

ใช้ Control UI ที่ `/openclaw` หรือเรียกใช้ `openclaw onboard` ผ่านเชลล์ของ Railway เพื่อดูคำแนะนำในการตั้งค่าช่องทาง:

- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram) (เร็วที่สุด -- ใช้เพียงโทเค็นบอต)
- [ช่องทางทั้งหมด](/th/channels)

## การสำรองข้อมูลและการย้ายระบบ

ส่งออกสถานะ การกำหนดค่า โปรไฟล์การยืนยันตัวตน และพื้นที่ทำงานของคุณ:

```bash
openclaw backup create
```

คำสั่งนี้จะสร้างไฟล์เก็บถาวรข้อมูลสำรองแบบพกพา ซึ่งประกอบด้วยสถานะของ OpenClaw และพื้นที่ทำงานที่กำหนดค่าไว้ ดูรายละเอียดที่ [การสำรองข้อมูล](/th/cli/backup)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางรับส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ: [การอัปเดต](/th/install/updating)
