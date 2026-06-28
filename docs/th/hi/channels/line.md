---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook + ข้อมูลรับรอง
    - คุณต้องการตัวเลือกข้อความเฉพาะของ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน LINE Messaging API Plugin
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับการยืนยันตัวตน

สถานะ: Plugin ที่ดาวน์โหลดได้ รองรับ direct messages, group chats, media, locations, Flex messages, template messages และ quick replies ไม่รองรับ Reactions และ threads

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่า channel:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์แบบโลคัล (เมื่อเรียกใช้จาก git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## ตั้งค่า

1. สร้าง LINE Developers account แล้วเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่ม channel ของ **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จาก channel settings
4. เปิดใช้ **Use webhook** ใน Messaging API settings
5. ตั้งค่า Webhook URL เป็น Gateway endpoint ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway จะตอบกลับ Webhook verification (GET) ของ LINE และรับ signed inbound events (POST) ทันทีหลังจากตรวจสอบ signature และ payload validation แล้ว จากนั้น agent processing จะดำเนินต่อแบบอะซิงโครนัส
หากคุณต้องการ custom path ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้ตรงกัน

หมายเหตุด้านความปลอดภัย:

- LINE signature verification ขึ้นกับ body (HMAC บน raw body) ดังนั้น OpenClaw จึงบังคับใช้ strict pre-auth body limits และ timeout ก่อน verification
- OpenClaw ประมวลผล Webhook events จาก verified raw request bytes ค่า `req.body` ที่ถูก upstream middleware แปลงแล้วจะถูกละเว้นเพื่อความปลอดภัยด้าน signature-integrity

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

Public DM config:

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

Env vars (เฉพาะ default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files:

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

`tokenFile` และ `secretFile` ควรชี้ไปยัง regular files ไม่รับ Symlinks

หลาย accounts:

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

Direct messages มีค่าเริ่มต้นเป็น pairing ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code และ messages ของพวกเขาจะถูกละเว้นจนกว่าจะ approved

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists และ policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs ที่ allowlisted สำหรับ DMs; ต้องใช้ `["*"]` สำหรับ `dmPolicy: "open"`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs ที่ allowlisted สำหรับ groups
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- สามารถอ้างอิง Static sender access groups จาก `allowFrom`, `groupAllowFrom` และ per-group `allowFrom` ด้วย `accessGroup:<name>` ได้
- หมายเหตุ runtime: หาก `channels.line` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับ group checks (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

LINE IDs แยกตัวพิมพ์ใหญ่เล็ก Valid IDs มีลักษณะดังนี้:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## พฤติกรรมของ Message

- Text จะถูกแบ่งเป็น chunks ที่ 5000 characters
- Markdown formatting จะถูกลบออก; code blocks และ tables จะถูกแปลงเป็น Flex
  cards เมื่อทำได้
- Streaming responses จะถูก buffered; LINE จะได้รับ chunks เต็มพร้อม loading
  animation ระหว่างที่ agent กำลังทำงาน
- Media downloads ถูก capped ด้วย `channels.line.mediaMaxMb` (default 10)
- Inbound media จะถูก save ไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อไปยัง agent
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

LINE Plugin ยัง ship คำสั่ง `/card` สำหรับ Flex message presets ด้วย:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับ ACP (Agent Communication Protocol) conversation bindings:

- `/acp spawn <agent> --bind here` bind current LINE chat กับ ACP session โดยไม่สร้าง child thread
- Configured ACP bindings และ active conversation-bound ACP sessions ทำงานบน LINE เหมือน conversation channels อื่น

ดูรายละเอียดได้ที่ [ACP agents](/th/tools/acp-agents)

## Outbound media

LINE Plugin รองรับการส่ง images, videos และ audio files ผ่าน agent message tool โดย Media จะถูกส่งผ่าน LINE-specific delivery path พร้อม preview และ tracking handling ที่เหมาะสม:

- **Images**: ส่งเป็น LINE image messages พร้อม automatic preview generation
- **Videos**: ส่งพร้อม explicit preview และ content-type handling
- **Audio**: ส่งเป็น LINE audio messages

Outbound media URLs ต้องเป็น public HTTPS URLs OpenClaw ตรวจสอบ target hostname ก่อนส่งมอบ URL ให้ LINE และปฏิเสธ loopback, link-local และ private-network targets

Generic media sends จะ fallback ไปยัง existing image-only route เมื่อไม่มี LINE-specific path

## การแก้ไขปัญหา

- **Webhook verification fails:** ตรวจสอบให้แน่ใจว่า Webhook URL เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **No inbound events:** ยืนยันว่า Webhook path ตรงกับ `channels.line.webhookPath`
  และ Gateway สามารถ reachable จาก LINE ได้
- **Media download errors:** หาก media เกิน default limit ให้เพิ่ม `channels.line.mediaMaxMb`

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — DM authentication และ pairing flow
- [Groups](/th/channels/groups) — group chat behavior และ mention gating
- [Channel Routing](/th/channels/channel-routing) — session routing สำหรับ messages
- [Security](/th/gateway/security) — access model และ hardening
