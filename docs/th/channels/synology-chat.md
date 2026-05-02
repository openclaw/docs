---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Webhook ของ Synology Chat และการกำหนดค่า OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T10:09:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

สถานะ: ช่องทางข้อความตรงของ bundled plugin โดยใช้ Synology Chat webhooks.
Plugin รับข้อความขาเข้าจาก Synology Chat outgoing webhooks และส่งการตอบกลับ
ผ่าน Synology Chat incoming webhook.

## bundled plugin

Synology Chat จัดส่งเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบ
แพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Synology Chat
ให้ติดตั้งด้วยตนเอง:

ติดตั้งจาก checkout ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## ตั้งค่าอย่างรวดเร็ว

1. ตรวจสอบให้แน่ใจว่า Synology Chat plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้แล้ว
   - การติดตั้งรุ่นเก่า/แบบกำหนดเองสามารถเพิ่มด้วยตนเองจาก source checkout โดยใช้คำสั่งด้านบน
   - `openclaw onboard` ตอนนี้แสดง Synology Chat ในรายการตั้งค่าช่องทางเดียวกับ `openclaw channels add`
   - การตั้งค่าแบบไม่โต้ตอบ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. ใน Synology Chat integrations:
   - สร้าง incoming webhook แล้วคัดลอก URL
   - สร้าง outgoing webhook พร้อม token ลับของคุณ
3. ชี้ URL ของ outgoing webhook ไปยัง OpenClaw gateway ของคุณ:
   - `https://gateway-host/webhook/synology` โดยค่าเริ่มต้น
   - หรือ `channels.synology-chat.webhookPath` แบบกำหนดเองของคุณ
4. ตั้งค่าให้เสร็จใน OpenClaw
   - แบบมีคำแนะนำ: `openclaw onboard`
   - แบบตรง: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ท gateway แล้วส่ง DM ไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตน Webhook:

- OpenClaw ยอมรับ token ของ outgoing webhook จาก `body.token` จากนั้น
  `?token=...` แล้วจึงเป็น headers
- รูปแบบ header ที่ยอมรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- token ที่ว่างหรือขาดหายจะล้มเหลวแบบปิด

config ขั้นต่ำ:

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

สำหรับบัญชีเริ่มต้น คุณสามารถใช้ env vars:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (คั่นด้วยจุลภาค)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

ค่า config จะแทนที่ env vars

ไม่สามารถตั้งค่า `SYNOLOGY_CHAT_INCOMING_URL` จาก workspace `.env`; ดู [ไฟล์ Workspace `.env`](/th/gateway/security)

## นโยบาย DM และการควบคุมการเข้าถึง

- `dmPolicy: "allowlist"` เป็นค่าเริ่มต้นที่แนะนำ
- `allowedUserIds` รับรายการ (หรือสตริงที่คั่นด้วยจุลภาค) ของ Synology user IDs
- ในโหมด `allowlist` รายการ `allowedUserIds` ที่ว่างจะถือว่าเป็นการกำหนดค่าผิดพลาด และ webhook route จะไม่เริ่มทำงาน (ใช้ `dmPolicy: "open"` พร้อม `allowedUserIds: ["*"]` สำหรับอนุญาตทั้งหมด)
- `dmPolicy: "open"` อนุญาต DM สาธารณะเฉพาะเมื่อ `allowedUserIds` มี `"*"`; หากมีรายการแบบจำกัด เฉพาะผู้ใช้ที่ตรงกันเท่านั้นจึงจะแชตได้
- `dmPolicy: "disabled"` บล็อก DM
- การผูกผู้รับการตอบกลับจะคงอยู่กับ `user_id` แบบตัวเลขที่เสถียรโดยค่าเริ่มต้น `channels.synology-chat.dangerouslyAllowNameMatching: true` คือโหมดความเข้ากันได้กรณีฉุกเฉินที่เปิดใช้การค้นหาชื่อผู้ใช้/ชื่อเล่นที่เปลี่ยนแปลงได้อีกครั้งสำหรับการส่งการตอบกลับ
- การอนุมัติการจับคู่ทำงานกับ:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## การส่งขาออก

ใช้ Synology Chat user IDs แบบตัวเลขเป็นเป้าหมาย

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

รองรับการส่งสื่อด้วยการส่งไฟล์ตาม URL
URL ไฟล์ขาออกต้องใช้ `http` หรือ `https` และเป้าหมายเครือข่ายส่วนตัวหรือที่ถูกบล็อกด้วยเหตุอื่นจะถูกปฏิเสธก่อนที่ OpenClaw จะส่งต่อ URL ไปยัง NAS webhook

## หลายบัญชี

รองรับบัญชี Synology Chat หลายบัญชีภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถแทนที่ token, incoming URL, webhook path, นโยบาย DM และขีดจำกัดได้
เซสชันข้อความตรงจะแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
ในบัญชี Synology สองบัญชีที่ต่างกันจะไม่ใช้สถานะ transcript ร่วมกัน
ให้ `webhookPath` ที่แตกต่างกันกับแต่ละบัญชีที่เปิดใช้ OpenClaw ตอนนี้ปฏิเสธ path ที่ซ้ำกันแบบตรงทั้งหมด
และปฏิเสธไม่เริ่มบัญชีที่มีชื่อซึ่งรับช่วงเฉพาะ webhook path ร่วมกันในการตั้งค่าแบบหลายบัญชี
หากคุณตั้งใจต้องการการรับช่วงแบบเดิมสำหรับบัญชีที่มีชื่อ ให้ตั้งค่า
`dangerouslyAllowInheritedWebhookPath: true` ในบัญชีนั้นหรือที่ `channels.synology-chat`
แต่ path ที่ซ้ำกันแบบตรงทั้งหมดยังคงถูกปฏิเสธแบบล้มเหลวปิด ควรใช้ path ที่ระบุชัดเจนต่อบัญชี

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

- เก็บ `token` เป็นความลับและหมุนเวียนหากรั่วไหล
- คง `allowInsecureSsl: false` ไว้ เว้นแต่คุณจะไว้วางใจ cert ของ NAS ในเครื่องที่ลงนามเองอย่างชัดเจน
- คำขอ inbound webhook จะได้รับการตรวจสอบ token และจำกัดอัตราต่อผู้ส่ง
- การตรวจสอบ token ที่ไม่ถูกต้องใช้การเปรียบเทียบ secret แบบ constant-time และล้มเหลวแบบปิด
- ควรใช้ `dmPolicy: "allowlist"` สำหรับ production
- ปิด `dangerouslyAllowNameMatching` ไว้ เว้นแต่คุณต้องการการส่งการตอบกลับตามชื่อผู้ใช้แบบเดิมอย่างชัดเจน
- ปิด `dangerouslyAllowInheritedWebhookPath` ไว้ เว้นแต่คุณยอมรับความเสี่ยงในการ route ผ่าน shared-path ในการตั้งค่าแบบหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - payload ของ outgoing webhook ขาดหนึ่งในฟิลด์ที่จำเป็น
  - หาก Synology ส่ง token ใน headers ให้ตรวจสอบว่า gateway/proxy เก็บ headers เหล่านั้นไว้
- `Invalid token`:
  - secret ของ outgoing webhook ไม่ตรงกับ `channels.synology-chat.token`
  - คำขอกำลังไปยังบัญชี/webhook path ที่ไม่ถูกต้อง
  - reverse proxy ลบ token header ออกก่อนที่คำขอจะถึง OpenClaw
- `Rate limit exceeded`:
  - ความพยายามใช้ token ที่ไม่ถูกต้องจำนวนมากเกินไปจากแหล่งเดียวกันอาจล็อกแหล่งนั้นชั่วคราว
  - ผู้ส่งที่ยืนยันตัวตนแล้วยังมีขีดจำกัดอัตราข้อความต่อผู้ใช้อีกชุดหนึ่ง
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - เปิดใช้ `dmPolicy="allowlist"` แล้วแต่ยังไม่ได้กำหนดค่าผู้ใช้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่อยู่ใน `allowedUserIds`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
