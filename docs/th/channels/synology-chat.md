---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Webhook ของ Synology Chat และการกำหนดค่า OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T15:48:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat เชื่อมต่อกับ OpenClaw ผ่าน Webhook หนึ่งคู่: Webhook ขาออกของ Synology Chat จะส่งข้อความส่วนตัวขาเข้าไปยัง Gateway และการตอบกลับจะส่งกลับผ่าน Webhook ขาเข้าของ Synology Chat

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับเฉพาะข้อความส่วนตัว และรองรับการส่งข้อความกับไฟล์ผ่าน URL

## การติดตั้ง

```bash
openclaw plugins install @openclaw/synology-chat
```

การเช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จากที่เก็บ git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าด่วน

1. ติดตั้ง Plugin (ตามด้านบน)
2. ในส่วนการผสานการทำงานของ Synology Chat:
   - สร้าง Webhook ขาเข้าและคัดลอก URL
   - สร้าง Webhook ขาออกพร้อมโทเค็นลับของคุณ
3. กำหนด URL ของ Webhook ขาออกให้ชี้ไปยัง OpenClaw Gateway:
   - ค่าเริ่มต้นคือ `https://gateway-host/webhook/synology`
   - หรือใช้ `channels.synology-chat.webhookPath` ที่คุณกำหนดเอง
4. ดำเนินการตั้งค่าใน OpenClaw ให้เสร็จสิ้น Synology Chat จะปรากฏในรายการตั้งค่าช่องทางเดียวกันของทั้งสองขั้นตอน:
   - แบบมีคำแนะนำ: `openclaw onboard` หรือ `openclaw channels add`
   - แบบโดยตรง: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ต Gateway แล้วส่งข้อความส่วนตัวไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตนของ Webhook:

- OpenClaw รับโทเค็น Webhook ขาออกจาก `body.token` ก่อน จากนั้นจึงตรวจสอบ
  `?token=...` แล้วจึงตรวจสอบส่วนหัว
- รูปแบบส่วนหัวที่ยอมรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- โทเค็นที่ว่างเปล่าหรือไม่มีจะถูกปฏิเสธโดยปริยาย
- เพย์โหลดอาจเป็น `application/x-www-form-urlencoded` หรือ `application/json` โดยต้องมี `token`, `user_id` และ `text`

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

สำหรับบัญชีเริ่มต้น คุณสามารถใช้ตัวแปรสภาพแวดล้อมต่อไปนี้:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (คั่นด้วยจุลภาค)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

ค่าการกำหนดค่าจะมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อม

ไม่สามารถตั้งค่า `SYNOLOGY_CHAT_INCOMING_URL` และ `SYNOLOGY_NAS_HOST` จากไฟล์ `.env` ของพื้นที่ทำงานได้ โปรดดู [ไฟล์ `.env` ของพื้นที่ทำงาน](/th/gateway/security#workspace-env-files)

## นโยบายข้อความส่วนตัวและการควบคุมการเข้าถึง

- ค่า `dmPolicy` ที่รองรับ ได้แก่ `allowlist` (ค่าเริ่มต้น), `open` และ `disabled` Synology Chat ไม่มีกระบวนการจับคู่ ให้อนุมัติผู้ส่งโดยเพิ่มรหัสผู้ใช้ Synology แบบตัวเลขลงใน `allowedUserIds`
- `allowedUserIds` รับรายการ (หรือสตริงที่คั่นด้วยจุลภาค) ของรหัสผู้ใช้ Synology
- ในโหมด `allowlist` รายการ `allowedUserIds` ที่ว่างเปล่าจะถือว่าเป็นการกำหนดค่าที่ไม่ถูกต้อง และเส้นทาง Webhook จะไม่เริ่มทำงาน
- `dmPolicy: "open"` อนุญาตข้อความส่วนตัวสาธารณะเฉพาะเมื่อ `allowedUserIds` มี `"*"` เท่านั้น หากมีรายการที่จำกัดไว้ เฉพาะผู้ใช้ที่ตรงกันจึงจะสนทนาได้ โหมด `open` ที่มีรายการ `allowedUserIds` ว่างเปล่าจะปฏิเสธการเริ่มเส้นทางเช่นกัน
- `dmPolicy: "disabled"` บล็อกข้อความส่วนตัว
- โดยค่าเริ่มต้น การผูกผู้รับการตอบกลับจะยึดตาม `user_id` แบบตัวเลขที่คงที่ `channels.synology-chat.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน ซึ่งเปิดใช้การค้นหาด้วยชื่อผู้ใช้/ชื่อเล่นที่เปลี่ยนแปลงได้อีกครั้งเพื่อส่งการตอบกลับ

## การส่งขาออก

ใช้รหัสผู้ใช้ Synology Chat แบบตัวเลขเป็นปลายทาง รองรับคำนำหน้า `synology-chat:`, `synology_chat:` และ `synology:`

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

ข้อความขาออกจะถูกแบ่งเป็นส่วนละไม่เกิน 2,000 อักขระ รองรับการส่งสื่อด้วยการส่งไฟล์ผ่าน URL โดย NAS จะดาวน์โหลดและแนบไฟล์ (สูงสุด 32 MB) URL ของไฟล์ขาออกต้องใช้ `http` หรือ `https` และปลายทางเครือข่ายส่วนตัวหรือปลายทางอื่นที่ถูกบล็อกจะถูกปฏิเสธก่อนที่ OpenClaw จะส่งต่อ URL ไปยัง Webhook ของ NAS

## หลายบัญชี

รองรับบัญชี Synology Chat หลายบัญชีภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถแทนที่โทเค็น, URL ขาเข้า, เส้นทาง Webhook, นโยบายข้อความส่วนตัว และขีดจำกัดได้
เซสชันข้อความส่วนตัวจะแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
บนบัญชี Synology สองบัญชีที่ต่างกันจะไม่ใช้สถานะบทสนทนาร่วมกัน
กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชีที่เปิดใช้งาน OpenClaw จะปฏิเสธเส้นทางที่เหมือนกันทุกประการ
และปฏิเสธการเริ่มบัญชีที่มีชื่อซึ่งสืบทอดเพียงเส้นทาง Webhook ที่ใช้ร่วมกันในการตั้งค่าแบบหลายบัญชี
หากคุณจำเป็นต้องใช้การสืบทอดแบบเดิมสำหรับบัญชีที่มีชื่อโดยตั้งใจ ให้ตั้งค่า
`dangerouslyAllowInheritedWebhookPath: true` ในบัญชีนั้นหรือที่ `channels.synology-chat`
แต่เส้นทางที่เหมือนกันทุกประการจะยังคงถูกปฏิเสธโดยปริยาย ควรใช้เส้นทางที่ระบุอย่างชัดเจนแยกตามบัญชี

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

- เก็บ `token` เป็นความลับและหมุนเวียนโทเค็นหากรั่วไหล
- ใช้ `allowInsecureSsl: false` ต่อไป เว้นแต่คุณจะเชื่อถือใบรับรอง NAS ภายในที่ลงนามด้วยตนเองอย่างชัดเจน
- คำขอ Webhook ขาเข้าจะได้รับการตรวจสอบโทเค็นและจำกัดอัตราต่อผู้ส่ง (`rateLimitPerMinute` ค่าเริ่มต้นคือ 30)
- การตรวจสอบโทเค็นที่ไม่ถูกต้องใช้การเปรียบเทียบข้อมูลลับแบบเวลาคงที่และปฏิเสธโดยปริยาย ความพยายามใช้โทเค็นที่ไม่ถูกต้องซ้ำ ๆ จะล็อกที่อยู่ IP ต้นทางชั่วคราว
- ข้อความขาเข้าจะได้รับการกรองรูปแบบการแทรกแซงพรอมต์ที่รู้จัก และตัดให้เหลือไม่เกิน 4,000 อักขระ
- แนะนำให้ใช้ `dmPolicy: "allowlist"` สำหรับระบบใช้งานจริง
- ปิด `dangerouslyAllowNameMatching` ไว้ เว้นแต่คุณจำเป็นต้องส่งการตอบกลับโดยอิงชื่อผู้ใช้แบบเดิมอย่างชัดเจน
- ปิด `dangerouslyAllowInheritedWebhookPath` ไว้ เว้นแต่คุณยอมรับความเสี่ยงจากการกำหนดเส้นทางที่ใช้ร่วมกันในการตั้งค่าแบบหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - เพย์โหลด Webhook ขาออกไม่มีฟิลด์ที่จำเป็นอย่างน้อยหนึ่งฟิลด์
  - หาก Synology ส่งโทเค็นในส่วนหัว ให้ตรวจสอบว่า Gateway/พร็อกซีเก็บรักษาส่วนหัวเหล่านั้นไว้
- `Invalid token`:
  - ข้อมูลลับของ Webhook ขาออกไม่ตรงกับ `channels.synology-chat.token`
  - คำขอกำลังเข้าถึงบัญชี/เส้นทาง Webhook ที่ไม่ถูกต้อง
  - รีเวิร์สพร็อกซีลบส่วนหัวโทเค็นก่อนที่คำขอจะไปถึง OpenClaw
- `Rate limit exceeded`:
  - ความพยายามใช้โทเค็นที่ไม่ถูกต้องจากต้นทางเดียวกันมากเกินไปอาจล็อกต้นทางนั้นชั่วคราว
  - ผู้ส่งที่ยืนยันตัวตนแล้วจะมีขีดจำกัดอัตราข้อความต่อผู้ใช้แยกต่างหากด้วย
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - เปิดใช้ `dmPolicy="allowlist"` แต่ยังไม่ได้กำหนดค่าผู้ใช้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่อยู่ใน `allowedUserIds`

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — รูปแบบการเข้าถึงและการเสริมความปลอดภัย
