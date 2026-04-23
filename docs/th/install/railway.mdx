---
read_when:
    - การปรับใช้ OpenClaw ไปยัง Railway
    - คุณต้องการการปรับใช้บนคลาวด์แบบคลิกครั้งเดียวพร้อม Control UI ที่ใช้งานผ่านเบราว์เซอร์
summary: ปรับใช้ OpenClaw บน Railway ด้วยเทมเพลตแบบคลิกครั้งเดียว
title: Railway
x-i18n:
    generated_at: "2026-04-23T10:19:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
---

# Railway

ปรับใช้ OpenClaw บน Railway ด้วยเทมเพลตแบบคลิกครั้งเดียว และเข้าถึงผ่าน Control UI บนเว็บ
นี่คือเส้นทางที่ง่ายที่สุดแบบ "ไม่ต้องใช้เทอร์มินัลบนเซิร์ฟเวอร์": Railway จะรัน Gateway ให้คุณ

## เช็กลิสต์อย่างรวดเร็ว (ผู้ใช้ใหม่)

1. คลิก **Deploy on Railway** (ด้านล่าง)
2. เพิ่ม **Volume** ที่เมานต์ไว้ที่ `/data`
3. ตั้งค่า **Variables** ที่จำเป็น (อย่างน้อย `OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_GATEWAY_TOKEN`)
4. เปิดใช้ **HTTP Proxy** บนพอร์ต `8080`
5. เปิด `https://<your-railway-domain>/openclaw` แล้วเชื่อมต่อโดยใช้ shared secret ที่ตั้งค่าไว้ เทมเพลตนี้ใช้ `OPENCLAW_GATEWAY_TOKEN` เป็นค่าเริ่มต้น; หากคุณแทนที่ด้วยการยืนยันตัวตนแบบรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

## การปรับใช้แบบคลิกครั้งเดียว

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

หลังการปรับใช้ ให้ค้นหา URL สาธารณะของคุณได้ที่ **Railway → บริการของคุณ → Settings → Domains**

Railway จะ:

- ให้โดเมนที่สร้างให้อัตโนมัติ (มักเป็น `https://<something>.up.railway.app`) หรือ
- ใช้โดเมนแบบกำหนดเองของคุณ หากคุณแนบไว้แล้ว

จากนั้นเปิด:

- `https://<your-railway-domain>/openclaw` — Control UI

## สิ่งที่คุณจะได้รับ

- OpenClaw Gateway + Control UI แบบโฮสต์แล้ว
- ที่เก็บข้อมูลถาวรผ่าน Railway Volume (`/data`) เพื่อให้ `openclaw.json`,
  `auth-profiles.json` รายเอเจนต์, สถานะของช่องทาง/Provider, เซสชัน และ
  workspace คงอยู่ข้ามการปรับใช้ใหม่

## การตั้งค่า Railway ที่จำเป็น

### เครือข่ายสาธารณะ

เปิดใช้ **HTTP Proxy** สำหรับบริการ

- พอร์ต: `8080`

### Volume (จำเป็น)

แนบ volume ที่เมานต์ไว้ที่:

- `/data`

### Variables

ตั้งค่าตัวแปรเหล่านี้บนบริการ:

- `OPENCLAW_GATEWAY_PORT=8080` (จำเป็น — ต้องตรงกับพอร์ตใน Public Networking)
- `OPENCLAW_GATEWAY_TOKEN` (จำเป็น; ให้ถือเป็นความลับระดับผู้ดูแลระบบ)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (แนะนำ)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (แนะนำ)

## เชื่อมต่อช่องทาง

ใช้ Control UI ที่ `/openclaw` หรือรัน `openclaw onboard` ผ่าน shell ของ Railway เพื่อดูคำแนะนำในการตั้งค่าช่องทาง:

- [Telegram](/th/channels/telegram) (เร็วที่สุด — ใช้เพียงโทเค็นบอต)
- [Discord](/th/channels/discord)
- [ทุกช่องทาง](/th/channels)

## การสำรองข้อมูลและการย้ายระบบ

ส่งออกสถานะ คอนฟิก auth profile และ workspace ของคุณ:

```bash
openclaw backup create
```

คำสั่งนี้จะสร้างคลังสำรองแบบพกพาที่มีสถานะของ OpenClaw พร้อม workspace
ที่ตั้งค่าไว้ ดู [การสำรองข้อมูล](/th/cli/backup) สำหรับรายละเอียด

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางรับส่งข้อความ: [Channels](/th/channels)
- ตั้งค่า Gateway: [การตั้งค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุด: [การอัปเดต](/th/install/updating)
