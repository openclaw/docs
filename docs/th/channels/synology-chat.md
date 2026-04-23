---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Webhook ของ Synology Chat และคอนฟิก OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T10:14:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

สถานะ: plugin แบบ bundled สำหรับช่องทางข้อความส่วนตัวที่ใช้ Webhook ของ Synology Chat
plugin นี้รับข้อความขาเข้าจาก outgoing webhook ของ Synology Chat และส่งคำตอบกลับ
ผ่าน incoming webhook ของ Synology Chat

## Bundled plugin

Synology Chat มาพร้อมเป็น plugin แบบ bundled ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
ในการติดตั้งแบบแพ็กเกจทั่วไปจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Synology Chat ไว้
ให้ติดตั้งด้วยตนเอง:

ติดตั้งจาก checkout ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

1. ตรวจสอบให้แน่ใจว่า plugin Synology Chat พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองจาก source checkout โดยใช้คำสั่งด้านบน
   - ตอนนี้ `openclaw onboard` จะแสดง Synology Chat อยู่ในรายการตั้งค่าช่องทางเดียวกันกับ `openclaw channels add`
   - การตั้งค่าแบบไม่โต้ตอบ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. ในส่วน integrations ของ Synology Chat:
   - สร้าง incoming webhook และคัดลอก URL ของมัน
   - สร้าง outgoing webhook พร้อม secret token ของคุณ
3. ชี้ URL ของ outgoing webhook ไปยัง OpenClaw Gateway ของคุณ:
   - ค่าเริ่มต้นคือ `https://gateway-host/webhook/synology`
   - หรือ `channels.synology-chat.webhookPath` ที่คุณกำหนดเอง
4. ดำเนินการตั้งค่าใน OpenClaw ให้เสร็จ
   - แบบมีคำแนะนำ: `openclaw onboard`
   - แบบตรงไปตรงมา: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ต Gateway แล้วส่ง DM ไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตนของ Webhook:

- OpenClaw รับ token ของ outgoing webhook จาก `body.token` ก่อน จากนั้น
  `?token=...` แล้วจึงเป็น headers
- รูปแบบ header ที่รองรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- token ที่ว่างเปล่าหรือไม่มีจะถูกปฏิเสธแบบ fail closed

คอนฟิกขั้นต่ำ:

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

ค่าคอนฟิกจะมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อม

ไม่สามารถตั้งค่า `SYNOLOGY_CHAT_INCOMING_URL` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## นโยบาย DM และการควบคุมการเข้าถึง

- `dmPolicy: "allowlist"` คือค่าเริ่มต้นที่แนะนำ
- `allowedUserIds` รับรายการ Synology user ID (หรือสตริงที่คั่นด้วยจุลภาค)
- ในโหมด `allowlist` หากรายการ `allowedUserIds` ว่าง ระบบจะถือว่าเป็นการตั้งค่าผิดพลาดและ route ของ webhook จะไม่เริ่มทำงาน (ใช้ `dmPolicy: "open"` หากต้องการอนุญาตทั้งหมด)
- `dmPolicy: "open"` อนุญาตผู้ส่งทุกคน
- `dmPolicy: "disabled"` บล็อก DM
- การผูกผู้รับสำหรับการตอบกลับจะยึดกับ `user_id` แบบตัวเลขที่คงที่โดยค่าเริ่มต้น `channels.synology-chat.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้แบบ break-glass ที่เปิดใช้การค้นหาจาก username/nickname ที่เปลี่ยนแปลงได้อีกครั้งสำหรับการส่งคำตอบกลับ
- การอนุมัติการจับคู่ใช้งานได้กับ:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## การส่งขาออก

ใช้ Synology Chat user ID แบบตัวเลขเป็นเป้าหมาย

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

รองรับการส่งสื่อผ่านการส่งไฟล์แบบอิง URL
URL ไฟล์ขาออกต้องใช้ `http` หรือ `https` และระบบจะปฏิเสธเป้าหมายเครือข่ายส่วนตัวหรือเป้าหมายที่ถูกบล็อกก่อนที่ OpenClaw จะส่งต่อ URL ไปยัง Webhook ของ NAS

## หลายบัญชี

รองรับหลายบัญชี Synology Chat ภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถกำหนด token, incoming URL, webhook path, นโยบาย DM และขีดจำกัดแยกกันได้
เซสชันข้อความส่วนตัวจะแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
บนสองบัญชี Synology ที่ต่างกันจะไม่ใช้สถานะ transcript ร่วมกัน
กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชีที่เปิดใช้งาน ขณะนี้ OpenClaw จะปฏิเสธ path ที่ซ้ำกันแบบตรงตัว
และจะไม่เริ่มบัญชีที่มีชื่อซึ่งสืบทอด webhook path ร่วมกันในชุดการตั้งค่าหลายบัญชี
หากคุณจำเป็นต้องใช้การสืบทอดแบบเดิมกับบัญชีที่มีชื่อจริง ๆ ให้ตั้งค่า
`dangerouslyAllowInheritedWebhookPath: true` ในบัญชีนั้นหรือที่ `channels.synology-chat`
แต่ path ที่ซ้ำกันแบบตรงตัวยังคงถูกปฏิเสธแบบ fail-closed แนะนำให้กำหนด path รายบัญชีอย่างชัดเจน

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

- เก็บ `token` เป็นความลับและหมุนเปลี่ยนทันทีหากรั่วไหล
- คงค่า `allowInsecureSsl: false` ไว้ เว้นแต่คุณจะเชื่อถือ certificate แบบ self-signed ของ NAS ภายในเครื่องอย่างชัดเจน
- คำขอ Webhook ขาเข้าจะถูกตรวจสอบ token และจำกัดอัตราต่อผู้ส่ง
- การตรวจสอบ token ที่ไม่ถูกต้องใช้การเปรียบเทียบ secret แบบเวลาคงที่และปฏิเสธแบบ fail closed
- สำหรับการใช้งานจริง แนะนำให้ใช้ `dmPolicy: "allowlist"`
- ปล่อย `dangerouslyAllowNameMatching` ไว้เป็นปิด เว้นแต่คุณจำเป็นต้องใช้การส่งคำตอบกลับแบบอิง username เดิมจริง ๆ
- ปล่อย `dangerouslyAllowInheritedWebhookPath` ไว้เป็นปิด เว้นแต่คุณยอมรับความเสี่ยงของการกำหนดเส้นทางผ่าน path ร่วมในชุดหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - payload ของ outgoing webhook ไม่มีหนึ่งในฟิลด์ที่จำเป็น
  - หาก Synology ส่ง token มาใน headers ให้ตรวจสอบว่า gateway/proxy ยังคงส่งต่อ headers เหล่านั้นไว้
- `Invalid token`:
  - secret ของ outgoing webhook ไม่ตรงกับ `channels.synology-chat.token`
  - คำขอกำลังไปยังบัญชีหรือ webhook path ที่ไม่ถูกต้อง
  - reverse proxy ลบ token header ก่อนที่คำขอจะไปถึง OpenClaw
- `Rate limit exceeded`:
  - การพยายามใช้ token ที่ไม่ถูกต้องมากเกินไปจากแหล่งเดิมอาจทำให้แหล่งนั้นถูกล็อกชั่วคราว
  - ผู้ส่งที่ยืนยันตัวตนแล้วก็ยังมีขีดจำกัดอัตราข้อความต่อผู้ใช้แยกต่างหาก
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - เปิดใช้ `dmPolicy="allowlist"` อยู่ แต่ไม่ได้กำหนดผู้ใช้ไว้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่อยู่ใน `allowedUserIds`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการจำกัดด้วยการ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งของระบบ
