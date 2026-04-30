---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Synology Chat Webhook และการกำหนดค่า OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T09:39:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

สถานะ: ช่องทางข้อความโดยตรงของ Plugin ที่บันเดิลมา ซึ่งใช้ Webhook ของ Synology Chat
Plugin รับข้อความขาเข้าจาก Webhook ขาออกของ Synology Chat และส่งคำตอบ
ผ่าน Webhook ขาเข้าของ Synology Chat

## Plugin ที่บันเดิลมา

Synology Chat จัดส่งเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์
แบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Synology Chat
ให้ติดตั้งด้วยตนเอง:

ติดตั้งจากเช็กเอาต์ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

1. ตรวจสอบว่า Plugin Synology Chat พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันบันเดิลไว้แล้ว
   - การติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มเองจากเช็กเอาต์ซอร์สได้ด้วยคำสั่งด้านบน
   - ตอนนี้ `openclaw onboard` แสดง Synology Chat ในรายการตั้งค่าช่องทางเดียวกับ `openclaw channels add`
   - การตั้งค่าแบบไม่โต้ตอบ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. ในการผสานรวมของ Synology Chat:
   - สร้าง Webhook ขาเข้าและคัดลอก URL
   - สร้าง Webhook ขาออกพร้อมโทเค็นลับของคุณ
3. ชี้ URL ของ Webhook ขาออกไปที่ Gateway ของ OpenClaw:
   - `https://gateway-host/webhook/synology` โดยค่าเริ่มต้น
   - หรือ `channels.synology-chat.webhookPath` แบบกำหนดเองของคุณ
4. ตั้งค่าใน OpenClaw ให้เสร็จ
   - แบบมีคำแนะนำ: `openclaw onboard`
   - โดยตรง: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ต Gateway แล้วส่ง DM ไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตน Webhook:

- OpenClaw รับโทเค็น Webhook ขาออกจาก `body.token` จากนั้น
  `?token=...` แล้วจึงจากส่วนหัว
- รูปแบบส่วนหัวที่ยอมรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- โทเค็นที่ว่างหรือขาดหายจะล้มเหลวแบบปิด

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## ตัวแปรสภาพแวดล้อม

สำหรับบัญชีเริ่มต้น คุณสามารถใช้ตัวแปรสภาพแวดล้อมได้:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (คั่นด้วยจุลภาค)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

ค่าการกำหนดค่าจะแทนที่ตัวแปรสภาพแวดล้อม

ไม่สามารถตั้งค่า `SYNOLOGY_CHAT_INCOMING_URL` จาก `.env` ของเวิร์กสเปซได้ โปรดดู [ไฟล์ `.env` ของเวิร์กสเปซ](/th/gateway/security)

## นโยบาย DM และการควบคุมการเข้าถึง

- `dmPolicy: "allowlist"` เป็นค่าเริ่มต้นที่แนะนำ
- `allowedUserIds` รับรายการ (หรือสตริงคั่นด้วยจุลภาค) ของ ID ผู้ใช้ Synology
- ในโหมด `allowlist` รายการ `allowedUserIds` ที่ว่างจะถือเป็นการกำหนดค่าผิด และเส้นทาง Webhook จะไม่เริ่มทำงาน (ใช้ `dmPolicy: "open"` ร่วมกับ `allowedUserIds: ["*"]` เพื่ออนุญาตทั้งหมด)
- `dmPolicy: "open"` อนุญาต DM สาธารณะเฉพาะเมื่อ `allowedUserIds` มี `"*"` เท่านั้น หากมีรายการแบบจำกัด เฉพาะผู้ใช้ที่ตรงกันเท่านั้นที่แชตได้
- `dmPolicy: "disabled"` บล็อก DM
- การผูกผู้รับคำตอบจะยังคงใช้ `user_id` แบบตัวเลขที่เสถียรโดยค่าเริ่มต้น `channels.synology-chat.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้ฉุกเฉินที่เปิดใช้การค้นหาชื่อผู้ใช้/ชื่อเล่นที่เปลี่ยนแปลงได้อีกครั้งสำหรับการส่งคำตอบ
- การอนุมัติการจับคู่ใช้ได้กับ:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## การส่งออก

ใช้ ID ผู้ใช้ Synology Chat แบบตัวเลขเป็นเป้าหมาย

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

รองรับการส่งสื่อด้วยการส่งไฟล์ผ่าน URL
URL ไฟล์ขาออกต้องใช้ `http` หรือ `https` และเป้าหมายเครือข่ายที่เป็นส่วนตัวหรือถูกบล็อกด้วยเหตุผลอื่นจะถูกปฏิเสธก่อนที่ OpenClaw จะส่งต่อ URL ไปยัง Webhook ของ NAS

## หลายบัญชี

รองรับบัญชี Synology Chat หลายบัญชีภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถแทนที่โทเค็น, URL ขาเข้า, เส้นทาง Webhook, นโยบาย DM และขีดจำกัดได้
เซสชันข้อความโดยตรงจะแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
บนบัญชี Synology สองบัญชีที่ต่างกันจะไม่แชร์สถานะทรานสคริปต์
ให้แต่ละบัญชีที่เปิดใช้มี `webhookPath` ที่ไม่ซ้ำกัน ตอนนี้ OpenClaw ปฏิเสธพาธที่ซ้ำกันทุกประการ
และปฏิเสธการเริ่มบัญชีที่มีชื่อซึ่งเพียงสืบทอดเส้นทาง Webhook ร่วมกันในการตั้งค่าหลายบัญชี
หากคุณตั้งใจต้องใช้การสืบทอดแบบเดิมสำหรับบัญชีที่มีชื่อ ให้ตั้งค่า
`dangerouslyAllowInheritedWebhookPath: true` บนบัญชีนั้นหรือที่ `channels.synology-chat`
แต่พาธที่ซ้ำกันทุกประการจะยังคงถูกปฏิเสธแบบล้มเหลวปิด ควรใช้พาธแยกต่อบัญชีอย่างชัดเจน

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## หมายเหตุด้านความปลอดภัย

- เก็บ `token` เป็นความลับและหมุนเวียนใหม่หากรั่วไหล
- คง `allowInsecureSsl: false` ไว้ เว้นแต่คุณจะเชื่อถือใบรับรอง NAS ภายในที่ลงนามเองอย่างชัดเจน
- คำขอ Webhook ขาเข้าจะถูกตรวจสอบโทเค็นและจำกัดอัตราต่อผู้ส่ง
- การตรวจสอบโทเค็นที่ไม่ถูกต้องใช้การเปรียบเทียบความลับแบบเวลาคงที่และล้มเหลวแบบปิด
- ควรใช้ `dmPolicy: "allowlist"` สำหรับงานจริง
- ปิด `dangerouslyAllowNameMatching` ไว้ เว้นแต่คุณต้องการการส่งคำตอบตามชื่อผู้ใช้แบบเดิมอย่างชัดเจน
- ปิด `dangerouslyAllowInheritedWebhookPath` ไว้ เว้นแต่คุณยอมรับความเสี่ยงในการกำหนดเส้นทางผ่านพาธร่วมในการตั้งค่าหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - เพย์โหลด Webhook ขาออกขาดฟิลด์ที่จำเป็นฟิลด์ใดฟิลด์หนึ่ง
  - หาก Synology ส่งโทเค็นในส่วนหัว ให้ตรวจสอบว่า Gateway/พร็อกซีคงส่วนหัวเหล่านั้นไว้
- `Invalid token`:
  - ความลับ Webhook ขาออกไม่ตรงกับ `channels.synology-chat.token`
  - คำขอกำลังไปยังบัญชี/เส้นทาง Webhook ที่ไม่ถูกต้อง
  - รีเวิร์สพร็อกซีลบส่วนหัวโทเค็นก่อนที่คำขอจะถึง OpenClaw
- `Rate limit exceeded`:
  - ความพยายามใช้โทเค็นที่ไม่ถูกต้องจำนวนมากเกินไปจากแหล่งเดียวกันอาจล็อกแหล่งนั้นชั่วคราว
  - ผู้ส่งที่ยืนยันตัวตนแล้วก็มีขีดจำกัดอัตราข้อความต่อผู้ใช้แยกต่างหากด้วย
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - เปิดใช้ `dmPolicy="allowlist"` แต่ยังไม่ได้กำหนดค่าผู้ใช้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่ได้อยู่ใน `allowedUserIds`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
