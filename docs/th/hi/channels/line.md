---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook + ข้อมูลรับรอง
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน LINE Messaging API Plugin
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:34:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้โทเค็นการเข้าถึง channel + ความลับของ channel ของคุณสำหรับการยืนยันตัวตน

สถานะ: Plugin ที่ดาวน์โหลดได้ รองรับข้อความส่วนตัว, แชตกลุ่ม, สื่อ, ตำแหน่งที่ตั้ง, ข้อความ Flex,
ข้อความเทมเพลต และการตอบกลับด่วน ไม่รองรับรีแอ็กชันและเธรด

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่า channel:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จาก git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## ตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่ม channel **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่า channel
4. เปิดใช้งาน **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า Webhook URL เป็นปลายทาง Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook (GET) ของ LINE และยอมรับอีเวนต์ขาเข้าที่ลงนามแล้ว
(POST) ทันทีหลังจากตรวจสอบ signature และ payload แล้ว; การประมวลผลของ agent
จะดำเนินต่อแบบอะซิงโครนัส
หากคุณต้องการพาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบ signature ของ LINE ขึ้นอยู่กับ body (HMAC บน raw body) ดังนั้น OpenClaw จึงบังคับใช้ strict pre-auth body limits และ timeout ก่อนการตรวจสอบ
- OpenClaw ประมวลผลอีเวนต์ Webhook จากไบต์คำขอ raw ที่ตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดย upstream middleware จะถูกละเว้นเพื่อความปลอดภัยด้าน signature-integrity

## กำหนดค่า

config ขั้นต่ำ:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

config DM สาธารณะ:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env vars (เฉพาะบัญชี default):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ไฟล์ token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` และ `secretFile` ควรชี้ไปยังไฟล์ปกติ Symlinks จะถูกปฏิเสธ

หลายบัญชี:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## การควบคุมการเข้าถึง

ข้อความส่วนตัวใช้ pairing เป็น default ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing และ
ข้อความของพวกเขาจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists และ policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs ที่อยู่ใน allowlist สำหรับ DMs; `dmPolicy: "open"` ต้องใช้ `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs ที่อยู่ใน allowlist สำหรับกลุ่ม
- การแทนที่รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- สามารถอ้างอิง static sender access groups จาก `allowFrom`, `groupAllowFrom` และ `allowFrom` รายกลุ่มด้วย `accessGroup:<name>`
- หมายเหตุ runtime: หาก `channels.line` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

LINE IDs แยกตัวพิมพ์เล็กใหญ่ IDs ที่ถูกต้องมีลักษณะดังนี้:

- User: `U` + อักขระ hex 32 ตัว
- Group: `C` + อักขระ hex 32 ตัว
- Room: `R` + อักขระ hex 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งเป็น chunks ที่ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; code blocks และ tables จะถูกแปลงเป็น Flex
  cards เมื่อเป็นไปได้
- คำตอบแบบ streaming จะถูก buffered; ขณะที่ agent กำลังทำงาน LINE จะได้รับ chunks ทั้งหมด
  พร้อม loading animation
- การดาวน์โหลดสื่อถูกจำกัดด้วย `channels.line.mediaMaxMb` (default 10)
- สื่อขาเข้าจะถูกบันทึกไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อไปยัง agent
  ซึ่งตรงกับ shared media store ที่ bundled channel
  plugins อื่นใช้

## ข้อมูล Channel (rich messages)

ใช้ `channelData.line` เพื่อส่ง quick replies, locations, Flex cards หรือ template
messages

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin ยังมาพร้อมคำสั่ง `/card` สำหรับ Flex message presets:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับ conversation bindings ของ ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้าง child thread
- ACP bindings ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับ conversation และกำลังใช้งาน ทำงานเหมือน conversation channels อื่นบน LINE

ดูรายละเอียดที่ [ACP agents](/th/tools/acp-agents)

## สื่อขาออก

LINE Plugin รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่าน agent message tool สื่อจะถูกส่งผ่านเส้นทางการส่งเฉพาะของ LINE พร้อมการจัดการ preview และ tracking ที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE พร้อมการสร้าง preview อัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการ preview และ content-type แบบชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE

URLs ของสื่อขาออกต้องเป็น URLs HTTPS สาธารณะ OpenClaw ตรวจสอบ target hostname ก่อนส่งต่อ URL ให้ LINE และปฏิเสธ target แบบ loopback, link-local และ private-network

การส่งสื่อทั่วไปจะ fallback ไปยัง route แบบ image-only ที่มีอยู่ เมื่อไม่มีเส้นทางเฉพาะของ LINE

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า Webhook URL เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีอีเวนต์ขาเข้า:** ยืนยันว่า Webhook path ตรงกับ `channels.line.webhookPath`
  และ Gateway สามารถเข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** หากสื่อเกิน limit default ให้เพิ่ม `channels.line.mediaMaxMb`

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ pairing flow
- [Groups](/th/channels/groups) — พฤติกรรม group chat และ mention gating
- [Channel Routing](/th/channels/channel-routing) — session routing สำหรับ messages
- [Security](/th/gateway/security) — access model และ hardening
