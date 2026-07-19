---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Webhook ของ Synology Chat และการกำหนดค่า OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-19T07:03:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3c03379944ee4187260a7287f6d2aed1ad8fdd1c22b5581c8a5d55515bbb6ad5
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat เชื่อมต่อกับ OpenClaw ผ่านคู่ Webhook โดย Webhook ขาออกของ Synology Chat จะโพสต์ข้อความส่วนตัวขาเข้าไปยัง Gateway และการตอบกลับจะส่งกลับผ่าน Webhook ขาเข้าของ Synology Chat

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับเฉพาะข้อความส่วนตัว และรองรับการส่งข้อความและไฟล์ผ่าน URL

## การติดตั้ง

```bash
openclaw plugins install @openclaw/synology-chat
```

เช็กเอาต์ภายในเครื่อง (เมื่อเรียกใช้จากรีโพ git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

1. ติดตั้ง Plugin (ตามด้านบน)
2. ในการผสานการทำงานของ Synology Chat:
   - สร้าง Webhook ขาเข้าและคัดลอก URL
   - สร้าง Webhook ขาออกพร้อมโทเค็นลับของคุณ
3. กำหนด URL ของ Webhook ขาออกให้ชี้ไปยัง OpenClaw Gateway:
   - `https://gateway-host/webhook/synology` โดยค่าเริ่มต้น
   - หรือ `channels.synology-chat.webhookPath` ที่กำหนดเอง
4. ตั้งค่าให้เสร็จสิ้นใน OpenClaw โดย Synology Chat จะปรากฏในรายการตั้งค่าช่องทางเดียวกันสำหรับทั้งสองขั้นตอน:
   - แบบมีคำแนะนำ: `openclaw onboard` หรือ `openclaw channels add`
   - โดยตรง: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ต Gateway แล้วส่งข้อความส่วนตัวไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตนของ Webhook:

- OpenClaw รับโทเค็น Webhook ขาออกจาก `body.token` ก่อน จากนั้น
  `?token=...` แล้วจึงตรวจสอบส่วนหัว
- รูปแบบส่วนหัวที่ยอมรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- โทเค็นที่ว่างเปล่าหรือไม่มีอยู่จะถูกปฏิเสธแบบ fail-closed
- เพย์โหลดอาจเป็น `application/x-www-form-urlencoded` หรือ `application/json` โดยต้องมี `token`, `user_id` และ `text`

## ความคงทนของข้อมูลขาเข้า

หลังจากผ่านการตรวจสอบโทเค็น นโยบายผู้ส่ง และขีดจำกัดอัตราแล้ว OpenClaw จะนำโทเค็น Webhook ออกจากซองข้อมูลที่จัดเก็บ และนำเหตุการณ์เข้าคิวแบบคงทนก่อนตอบรับ เส้นทางจะส่งคืน `204` หลังจากการเพิ่มข้อมูลนั้นสำเร็จเท่านั้น หากการจัดเก็บถาวรล้มเหลวจะส่งคืน `503` เพื่อให้ Synology Chat ลองใหม่ได้ แทนที่จะทำข้อความสูญหายโดยไม่มีการแจ้งเตือน

เหตุการณ์ที่รอดำเนินการหรือลองใหม่ได้จะยังคงอยู่หลังจากรีสตาร์ต Gateway ค่า `post_id` ที่คงที่ของ Synology จะระงับรายการคิวซ้ำตราบใดที่ยังมีระเบียนการเสร็จสิ้นที่ทำงานอยู่หรือถูกเก็บรักษาไว้ การส่งมอบระหว่างคิวกับเอเจนต์ยังคงเป็นแบบอย่างน้อยหนึ่งครั้ง ดังนั้นการขัดข้องที่ขอบเขตดังกล่าวอาจทำให้มีการเล่นซ้ำหนึ่งรอบได้

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

สำหรับบัญชีเริ่มต้น สามารถใช้ตัวแปรสภาพแวดล้อมได้:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (คั่นด้วยจุลภาค)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

ค่าการกำหนดค่าจะแทนที่ตัวแปรสภาพแวดล้อม

ไม่สามารถตั้งค่า `SYNOLOGY_CHAT_INCOMING_URL` และ `SYNOLOGY_NAS_HOST` จาก `.env` ของเวิร์กสเปซได้ โปรดดู [ไฟล์ `.env` ของเวิร์กสเปซ](/th/gateway/security#workspace-env-files)

## นโยบายข้อความส่วนตัวและการควบคุมการเข้าถึง

- ค่า `dmPolicy` ที่รองรับ: `allowlist` (ค่าเริ่มต้น), `open` และ `disabled` Synology Chat ไม่มีขั้นตอนการจับคู่ ให้อนุมัติผู้ส่งโดยเพิ่ม ID ผู้ใช้ Synology แบบตัวเลขของผู้ส่งลงใน `allowedUserIds`
- `allowedUserIds` รับรายการ ID ผู้ใช้ Synology (หรือสตริงที่คั่นด้วยจุลภาค)
- ในโหมด `allowlist` รายการ `allowedUserIds` ที่ว่างเปล่าจะถือว่าเป็นการกำหนดค่าที่ไม่ถูกต้อง และเส้นทาง Webhook จะไม่เริ่มทำงาน
- `dmPolicy: "open"` อนุญาตข้อความส่วนตัวสาธารณะเฉพาะเมื่อ `allowedUserIds` มี `"*"` หากมีรายการแบบจำกัด เฉพาะผู้ใช้ที่ตรงกันเท่านั้นจึงจะแชตได้ `open` ที่มีรายการ `allowedUserIds` ว่างเปล่าจะปฏิเสธการเริ่มเส้นทางเช่นกัน
- `dmPolicy: "disabled"` บล็อกข้อความส่วนตัว
- โดยค่าเริ่มต้น การผูกผู้รับการตอบกลับจะยังคงอ้างอิง `user_id` แบบตัวเลขที่คงที่ `channels.synology-chat.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้ฉุกเฉินที่เปิดใช้การค้นหาชื่อผู้ใช้/ชื่อเล่นซึ่งเปลี่ยนแปลงได้อีกครั้งสำหรับการส่งคำตอบ

## การส่งขาออก

ใช้ ID ผู้ใช้ Synology Chat แบบตัวเลขเป็นเป้าหมาย โดยยอมรับคำนำหน้า `synology-chat:`, `synology_chat:` และ `synology:`

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --message "สวัสดีจาก OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "สวัสดีอีกครั้ง"
openclaw message send --channel synology-chat --target synology:123456 --message "คำนำหน้าแบบสั้น"
```

ข้อความขาออกจะถูกแบ่งเป็นส่วนละ 2000 อักขระ รองรับการส่งสื่อด้วยการส่งไฟล์ผ่าน URL โดย NAS จะดาวน์โหลดและแนบไฟล์ (สูงสุด 32 MB) URL ไฟล์ขาออกต้องใช้ `http` หรือ `https` และเป้าหมายเครือข่ายส่วนตัวหรือเป้าหมายอื่นที่ถูกบล็อกจะถูกปฏิเสธก่อนที่ OpenClaw จะส่งต่อ URL ไปยัง Webhook ของ NAS

## หลายบัญชี

รองรับบัญชี Synology Chat หลายบัญชีภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถแทนที่โทเค็น URL ขาเข้า เส้นทาง Webhook นโยบายข้อความส่วนตัว และขีดจำกัดได้
เซสชันข้อความส่วนตัวจะแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
ในบัญชี Synology สองบัญชีที่ต่างกันจะไม่ใช้สถานะบทสนทนาร่วมกัน
กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชีที่เปิดใช้งาน OpenClaw จะปฏิเสธเส้นทางที่ซ้ำกันทุกประการ
และปฏิเสธการเริ่มบัญชีที่มีชื่อซึ่งรับช่วงเฉพาะเส้นทาง Webhook ที่ใช้ร่วมกันในการตั้งค่าแบบหลายบัญชี
หากจำเป็นต้องใช้การรับช่วงแบบเดิมสำหรับบัญชีที่มีชื่อโดยตั้งใจ ให้ตั้งค่า
`dangerouslyAllowInheritedWebhookPath: true` ในบัญชีนั้นหรือที่ `channels.synology-chat`
แต่เส้นทางที่ซ้ำกันทุกประการจะยังคงถูกปฏิเสธแบบ fail-closed ควรใช้เส้นทางที่ระบุแยกต่อบัญชีอย่างชัดเจน

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

- เก็บ `token` เป็นความลับและหมุนเวียนค่าใหม่หากรั่วไหล
- คงค่า `allowInsecureSsl: false` ไว้ เว้นแต่จะเชื่อถือใบรับรอง NAS ภายในเครื่องแบบลงนามด้วยตนเองอย่างชัดเจน
- คำขอ Webhook ขาเข้าจะได้รับการตรวจสอบโทเค็นและจำกัดอัตราต่อผู้ส่ง (`rateLimitPerMinute`, ค่าเริ่มต้น 30)
- การตรวจสอบโทเค็นที่ไม่ถูกต้องใช้การเปรียบเทียบข้อมูลลับแบบเวลาคงที่และปฏิเสธแบบ fail-closed ความพยายามใช้โทเค็นที่ไม่ถูกต้องซ้ำหลายครั้งจะล็อก IP ต้นทางชั่วคราว
- ข้อความขาเข้าจะถูกกรองรูปแบบ prompt injection ที่ทราบและตัดให้เหลือไม่เกิน 4000 อักขระ
- ควรใช้ `dmPolicy: "allowlist"` สำหรับการใช้งานจริง
- ปิด `dangerouslyAllowNameMatching` ไว้ เว้นแต่จำเป็นต้องใช้การส่งคำตอบตามชื่อผู้ใช้แบบเดิมอย่างชัดเจน
- ปิด `dangerouslyAllowInheritedWebhookPath` ไว้ เว้นแต่ยอมรับความเสี่ยงของการกำหนดเส้นทางผ่านเส้นทางที่ใช้ร่วมกันในการตั้งค่าแบบหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - เพย์โหลด Webhook ขาออกไม่มีฟิลด์ที่จำเป็นอย่างน้อยหนึ่งฟิลด์
  - หาก Synology ส่งโทเค็นในส่วนหัว ตรวจสอบให้แน่ใจว่า Gateway/พร็อกซีเก็บรักษาส่วนหัวเหล่านั้นไว้
- `Invalid token`:
  - ข้อมูลลับของ Webhook ขาออกไม่ตรงกับ `channels.synology-chat.token`
  - คำขอส่งไปยังบัญชี/เส้นทาง Webhook ที่ไม่ถูกต้อง
  - รีเวิร์สพร็อกซีลบส่วนหัวโทเค็นก่อนที่คำขอจะไปถึง OpenClaw
- `Rate limit exceeded`:
  - ความพยายามใช้โทเค็นที่ไม่ถูกต้องจากต้นทางเดียวกันมากเกินไปอาจล็อกต้นทางนั้นชั่วคราว
  - ผู้ส่งที่ผ่านการยืนยันตัวตนยังมีขีดจำกัดอัตราข้อความต่อผู้ใช้แยกต่างหาก
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - เปิดใช้ `dmPolicy="allowlist"` แต่ไม่ได้กำหนดค่าผู้ใช้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่อยู่ใน `allowedUserIds`

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
