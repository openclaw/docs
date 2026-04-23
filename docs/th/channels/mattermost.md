---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทางของ Mattermost
summary: การตั้งค่า Mattermost bot และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T10:13:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

สถานะ: bundled plugin (bot token + เหตุการณ์ WebSocket) รองรับ channels, groups และ DM
Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้; ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ
[mattermost.com](https://mattermost.com)

## bundled plugin

Mattermost มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
บิลด์แบบแพ็กเกจตามปกติไม่จำเป็นต้องติดตั้งแยก

หากคุณใช้บิลด์รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Mattermost
ให้ติดตั้งด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

1. ตรวจสอบว่า Mattermost plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่าหรือกำหนดเองสามารถเพิ่มได้ด้วยตนเองโดยใช้คำสั่งด้านบน
2. สร้างบัญชีบอต Mattermost และคัดลอก **bot token**
3. คัดลอก **base URL** ของ Mattermost (เช่น `https://chat.example.com`)
4. กำหนดค่า OpenClaw และเริ่มต้น Gateway

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Native slash commands

Native slash commands เป็นคุณสมบัติแบบเลือกใช้ เมื่อเปิดใช้งาน OpenClaw จะลงทะเบียน slash commands `oc_*` ผ่าน
Mattermost API และรับ callback POST บนเซิร์ฟเวอร์ HTTP ของ Gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // ใช้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ได้โดยตรง (reverse proxy/URL สาธารณะ)
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

หมายเหตุ:

- `native: "auto"` จะปิดใช้งานเป็นค่าเริ่มต้นสำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้งาน
- หากไม่ระบุ `callbackUrl` OpenClaw จะอนุมานจากโฮสต์/พอร์ตของ Gateway + `callbackPath`
- สำหรับการตั้งค่าหลายบัญชี สามารถตั้ง `commands` ที่ระดับบนสุด หรือภายใต้
  `channels.mattermost.accounts.<id>.commands` (ค่าระดับบัญชีจะ override ฟิลด์ระดับบนสุด)
- callback ของคำสั่งจะถูกตรวจสอบด้วย token รายคำสั่งที่ Mattermost ส่งกลับมา
  เมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
- slash callback จะปฏิเสธโดยปริยายเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นทำงานไม่สมบูรณ์ หรือ
  callback token ไม่ตรงกับคำสั่งที่ลงทะเบียนไว้คำสั่งใดเลย
- ข้อกำหนดด้านการเข้าถึง: endpoint ของ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
  - ห้ามตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะรันอยู่บนโฮสต์เดียวกันหรือ network namespace เดียวกับ OpenClaw
  - ห้ามตั้ง `callbackUrl` เป็น base URL ของ Mattermost เว้นแต่ URL นั้นจะ reverse-proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
  - วิธีตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; คำขอแบบ GET ควรได้ `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`
- ข้อกำหนด allowlist สำหรับ egress ของ Mattermost:
  - หาก callback ของคุณชี้ไปยังที่อยู่แบบ private/tailnet/internal ให้ตั้งค่า Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวมโฮสต์/โดเมนของ callback
  - ใช้รายการแบบโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าเหล่านี้บนโฮสต์ Gateway หากคุณต้องการใช้ env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

env vars ใช้ได้เฉพาะกับบัญชี **default** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าจาก config

ไม่สามารถตั้ง `MATTERMOST_URL` จาก workspace `.env` ได้; ดู [Workspace `.env` files](/th/gateway/security)

## โหมดแชต

Mattermost ตอบกลับ DM โดยอัตโนมัติ พฤติกรรมใน channel ควบคุมด้วย `chatmode`:

- `oncall` (ค่าเริ่มต้น): ตอบกลับเฉพาะเมื่อมีการ @mention ใน channels
- `onmessage`: ตอบกลับทุกข้อความใน channel
- `onchar`: ตอบกลับเมื่อข้อความขึ้นต้นด้วย trigger prefix

ตัวอย่าง config:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

หมายเหตุ:

- `onchar` ยังคงตอบกลับต่อ @mention ที่ระบุชัดเจน
- `channels.mattermost.requireMention` ยังรองรับสำหรับ config แบบเดิม แต่แนะนำให้ใช้ `chatmode`

## Threading และ sessions

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับใน channel และ group จะอยู่ใน
ช่องหลักต่อไป หรือเริ่ม thread ใต้โพสต์ที่เป็นตัวกระตุ้น

- `off` (ค่าเริ่มต้น): ตอบกลับใน thread เฉพาะเมื่อโพสต์ขาเข้ามาอยู่ใน thread อยู่แล้วเท่านั้น
- `first`: สำหรับโพสต์ระดับบนสุดใน channel/group ให้เริ่ม thread ใต้โพสต์นั้น และกำหนดเส้นทาง
  การสนทนาไปยัง session ที่มีขอบเขตตาม thread
- `all`: สำหรับ Mattermost ในปัจจุบัน มีพฤติกรรมเหมือน `first`
- Direct messages จะไม่สนใจการตั้งค่านี้และคงเป็นแบบไม่ใช้ thread

ตัวอย่าง config:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

หมายเหตุ:

- session ที่มีขอบเขตตาม thread จะใช้ post id ของโพสต์ที่เป็นตัวกระตุ้นเป็น thread root
- ขณะนี้ `first` และ `all` ให้ผลเหมือนกัน เพราะเมื่อ Mattermost มี thread root แล้ว
  chunk และสื่อที่ตามมาจะดำเนินต่อใน thread เดิมนั้น

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM แบบสาธารณะ: `channels.mattermost.dmPolicy="open"` ร่วมกับ `channels.mattermost.allowFrom=["*"]`

## Channels (groups)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ต้องมีการ mention จึงจะทำงาน)
- อนุญาตผู้ส่งผ่าน allowlist ด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ user IDs)
- การ override การ mention ราย channel อยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention`
  หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และเปิดใช้ได้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- เปิด channels: `channels.mattermost.groupPolicy="open"` (ยังคงต้องมีการ mention)
- หมายเหตุด้าน runtime: หากไม่มี `channels.mattermost` เลย runtime จะ fallback ไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบ group (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

ตัวอย่าง:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Targets สำหรับการส่งขาออก

ใช้รูปแบบ target เหล่านี้กับ `openclaw message send` หรือ Cron/Webhooks:

- `channel:<id>` สำหรับ channel
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

ID แบบทึบแสงเปล่า ๆ (เช่น `64ifufp...`) **กำกวม** ใน Mattermost (อาจเป็น user ID หรือ channel ID)

OpenClaw จะ resolve โดย **ให้ user ก่อน**:

- หาก ID นั้นมีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่งเป็น **DM** โดย resolve direct channel ผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกมองเป็น **channel ID**

หากคุณต้องการพฤติกรรมที่แน่นอนเสมอ ให้ใช้ prefix แบบชัดเจน (`user:<id>` / `channel:<id>`) ทุกครั้ง

## การลองใหม่ของ DM channel

เมื่อ OpenClaw ส่งไปยัง target DM ของ Mattermost และจำเป็นต้อง resolve direct channel ก่อน
ระบบจะลองใหม่โดยอัตโนมัติเมื่อการสร้าง direct channel ล้มเหลวแบบชั่วคราว

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับแต่งพฤติกรรมนั้นแบบรวมสำหรับ Mattermost plugin
หรือ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

หมายเหตุ:

- ใช้เฉพาะกับการสร้าง DM channel (`/api/v4/channels/direct`) ไม่ใช่ทุก Mattermost API call
- การลองใหม่ใช้กับความล้มเหลวแบบชั่วคราว เช่น rate limit, การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาด client 4xx อื่นที่ไม่ใช่ `429` ถือว่าเป็นแบบถาวรและจะไม่ลองใหม่

## Preview streaming

Mattermost สตรีมการคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วน ลงใน **draft preview post** เดียว ซึ่งจะสรุปผลแทนที่เดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง การอัปเดต preview จะเกิดบน post id เดิมแทนการรบกวน channel ด้วยข้อความราย chunk เมื่อ final เป็นสื่อ/ข้อผิดพลาด ระบบจะยกเลิกการแก้ไข preview ที่ค้างอยู่ และใช้การส่งแบบปกติแทนการ flush preview post ที่ใช้ชั่วคราว

เปิดใช้งานผ่าน `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

หมายเหตุ:

- `partial` เป็นตัวเลือกที่ใช้โดยทั่วไป: มี preview post เดียวที่ถูกแก้ไขไปเรื่อย ๆ ขณะที่คำตอบยาวขึ้น จากนั้นสรุปเป็นคำตอบสมบูรณ์
- `block` ใช้ draft chunks แบบต่อท้ายภายใน preview post
- `progress` แสดง preview สถานะระหว่างการสร้าง และจะโพสต์คำตอบสุดท้ายเมื่อเสร็จสิ้นเท่านั้น
- `off` ปิดใช้งาน preview streaming
- หากไม่สามารถสรุป stream แทนที่เดิมได้ (เช่น post ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่ง final post ใหม่ เพื่อไม่ให้คำตอบสูญหาย
- payload ที่มีแต่ reasoning จะถูกซ่อนจากโพสต์ใน channel รวมถึงข้อความที่มาถึงในรูปแบบ blockquote `> Reasoning:` ตั้ง `/reasoning on` เพื่อดูการคิดในพื้นผิวอื่น; final post ของ Mattermost จะแสดงเฉพาะคำตอบ
- ดู [Streaming](/th/concepts/streaming#preview-streaming-modes) สำหรับตารางการแม็ปกับ channels

## Reactions (message tool)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ Mattermost post id
- `emoji` รับชื่อเช่น `thumbsup` หรือ `:+1:` (จะมีหรือไม่มี colon ก็ได้)
- ตั้ง `remove=true` (boolean) เพื่อลบ reaction
- เหตุการณ์เพิ่ม/ลบ reaction จะถูกส่งต่อเป็น system events ไปยัง agent session ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Config:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการทำงานของ reaction (ค่าเริ่มต้น true)
- Override รายบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (message tool)

ส่งข้อความที่มีปุ่มให้คลิกได้ เมื่อผู้ใช้คลิกปุ่ม agent จะได้รับ
ตัวเลือกนั้นและสามารถตอบกลับได้

เปิดใช้ปุ่มโดยเพิ่ม `inlineButtons` ลงในความสามารถของ channel:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

ใช้ `message action=send` พร้อมพารามิเตอร์ `buttons` ปุ่มเป็นอาร์เรย์ 2 มิติ (แถวของปุ่ม):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ฟิลด์ของปุ่ม:

- `text` (จำเป็น): ป้ายข้อความที่แสดง
- `callback_data` (จำเป็น): ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น action ID)
- `style` (ไม่บังคับ): `"default"`, `"primary"` หรือ `"danger"`

เมื่อผู้ใช้คลิกปุ่ม:

1. ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น `"✓ **Yes** selected by @user"`)
2. agent จะได้รับตัวเลือกนั้นเป็นข้อความขาเข้าและตอบกลับ

หมายเหตุ:

- callback ของปุ่มใช้การตรวจสอบแบบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องตั้งค่า)
- Mattermost ตัด callback data ออกจาก API responses ของตนเอง (เป็นคุณสมบัติด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมด
  จะถูกลบเมื่อมีการคลิก — ไม่สามารถลบบางส่วนได้
- Action IDs ที่มีเครื่องหมายขีดกลางหรือขีดล่างจะถูก sanitize โดยอัตโนมัติ
  (ข้อจำกัดด้าน routing ของ Mattermost)

Config:

- `channels.mattermost.capabilities`: อาร์เรย์ของสตริง capability เพิ่ม `"inlineButtons"` เพื่อ
  เปิดใช้คำอธิบายเครื่องมือปุ่มใน system prompt ของ agent
- `channels.mattermost.interactions.callbackBaseUrl`: base URL ภายนอกแบบไม่บังคับสำหรับ
  callback ของปุ่ม (ตัวอย่างเช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถ
  เข้าถึง Gateway ที่ bind host ได้โดยตรง
- ในการตั้งค่าแบบหลายบัญชี คุณยังสามารถตั้งฟิลด์เดียวกันนี้ภายใต้
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
- หากไม่ระบุ `interactions.callbackBaseUrl` OpenClaw จะอนุมาน URL callback จาก
  `gateway.customBindHost` + `gateway.port` แล้วจึง fallback ไปที่ `http://localhost:<port>`
- กฎด้านการเข้าถึง: URL callback ของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
  `localhost` ใช้งานได้เฉพาะเมื่อ Mattermost และ OpenClaw รันอยู่บนโฮสต์เดียวกันหรือ network namespace เดียวกัน
- หาก target ของ callback เป็นแบบ private/tailnet/internal ให้เพิ่มโฮสต์/โดเมนของมันลงใน Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`

### การเชื่อมต่อ Direct API (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhooks สามารถโพสต์ปุ่มได้โดยตรงผ่าน Mattermost REST API
แทนการส่งผ่านเครื่องมือ `message` ของ agent ใช้ `buildButtonAttachments()` จาก
plugin เมื่อเป็นไปได้; หากโพสต์ JSON แบบดิบ ให้ทำตามกฎเหล่านี้:

**โครงสร้าง payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // อนุญาตเฉพาะอักขระตัวอักษรและตัวเลข — ดูด้านล่าง
            type: "button", // จำเป็น มิฉะนั้นการคลิกจะถูกเพิกเฉยแบบเงียบ ๆ
            name: "Approve", // ป้ายข้อความที่แสดง
            style: "primary", // ไม่บังคับ: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ต้องตรงกับ id ของปุ่ม (สำหรับค้นหาชื่อ)
                action: "approve",
                // ... ฟิลด์กำหนดเองอื่น ๆ ...
                _token: "<hmac>", // ดูส่วน HMAC ด้านล่าง
              },
            },
          },
        ],
      },
    ],
  },
}
```

**กฎสำคัญ:**

1. ต้องใส่ attachments ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกเพิกเฉยแบบเงียบ ๆ)
2. ทุก action ต้องมี `type: "button"` — หากไม่มี การคลิกจะถูกกลืนหายแบบเงียบ ๆ
3. ทุก action ต้องมีฟิลด์ `id` — Mattermost จะเพิกเฉยต่อ action ที่ไม่มี ID
4. `id` ของ action ต้องเป็น **อักขระตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) เครื่องหมายขีดกลางและขีดล่างทำให้
   การกำหนดเส้นทาง action ฝั่งเซิร์ฟเวอร์ของ Mattermost พัง (คืนค่า 404) ให้ตัดออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดง
   ชื่อปุ่ม (เช่น `"Approve"`) แทน ID แบบดิบ
6. จำเป็นต้องมี `context.action_id` — ตัวจัดการ interaction จะคืนค่า 400 หากไม่มี

**การสร้าง HMAC token:**

Gateway จะตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้าง token
ให้ตรงกับตรรกะการตรวจสอบของ Gateway:

1. สร้าง secret จาก bot token:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. สร้างออบเจ็กต์ context โดยใส่ทุกฟิลด์ **ยกเว้น** `_token`
3. serialize โดยใช้ **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify`
   กับคีย์ที่เรียงลำดับ ซึ่งให้เอาต์พุตแบบกระชับ)
4. เซ็นชื่อ: `HMAC-SHA256(key=secret, data=serializedContext)`
5. เพิ่ม hex digest ที่ได้เป็น `_token` ใน context

ตัวอย่าง Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

ข้อผิดพลาด HMAC ที่พบบ่อย:

- `json.dumps` ของ Python จะเพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ให้ใช้
  `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตแบบกระชับของ JavaScript (`{"key":"val"}`)
- ให้เซ็นชื่อ **ทุก** ฟิลด์ใน context เสมอ (ยกเว้น `_token`) Gateway จะตัด `_token` ออกแล้ว
  เซ็นทุกอย่างที่เหลือ การเซ็นเพียงบางส่วนจะทำให้การตรวจสอบล้มเหลวแบบเงียบ ๆ
- ใช้ `sort_keys=True` — Gateway จะเรียงคีย์ก่อนเซ็น และ Mattermost อาจ
  เรียงลำดับฟิลด์ context ใหม่เมื่อเก็บ payload
- สร้าง secret จาก bot token (แบบกำหนดได้แน่นอน) ไม่ใช่ไบต์สุ่ม Secret
  ต้องเป็นค่าเดียวกันทั้งในกระบวนการที่สร้างปุ่มและ Gateway ที่ใช้ตรวจสอบ

## Directory adapter

Mattermost plugin มี directory adapter ที่ resolve ชื่อ channel และผู้ใช้
ผ่าน Mattermost API ซึ่งทำให้ใช้ target แบบ `#channel-name` และ `@username` ได้ใน
`openclaw message send` และการส่งผ่าน Cron/Webhooks

ไม่ต้องมีการกำหนดค่าเพิ่มเติม — adapter ใช้ bot token จาก config ของบัญชี

## หลายบัญชี

Mattermost รองรับหลายบัญชีภายใต้ `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## การแก้ปัญหา

- ไม่มีการตอบกลับใน channels: ตรวจสอบว่าบอตอยู่ใน channel และมีการ mention ถึงมัน (`oncall`) ใช้ trigger prefix (`onchar`) หรือตั้ง `chatmode: "onmessage"`
- ข้อผิดพลาดการยืนยันตัวตน: ตรวจสอบ bot token, base URL และดูว่าบัญชีถูกเปิดใช้งานหรือไม่
- ปัญหาแบบหลายบัญชี: env vars ใช้ได้เฉพาะกับบัญชี `default`
- Native slash commands ตอบกลับ `Unauthorized: invalid command token.`: OpenClaw
  ไม่ยอมรับ callback token สาเหตุทั่วไปคือ:
  - การลงทะเบียน slash command ล้มเหลวหรือสำเร็จเพียงบางส่วนตอนเริ่มต้นระบบ
  - callback ไปถึง Gateway/บัญชีผิดตัว
  - Mattermost ยังมีคำสั่งเก่าที่ยังชี้ไปยัง callback target เดิม
  - Gateway รีสตาร์ตโดยไม่ได้เปิดใช้งาน slash commands อีกครั้ง
- หาก native slash commands หยุดทำงาน ให้ตรวจสอบ log สำหรับ
  `mattermost: failed to register slash commands` หรือ
  `mattermost: native slash commands enabled but no commands could be registered`
- หากไม่ระบุ `callbackUrl` และ log เตือนว่า callback ถูก resolve ไปเป็น
  `http://127.0.0.1:18789/...` URL นั้นน่าจะเข้าถึงได้เฉพาะเมื่อ
  Mattermost รันบนโฮสต์เดียวกันหรือ network namespace เดียวกับ OpenClaw ให้ตั้ง
  `commands.callbackUrl` แบบชัดเจนที่เข้าถึงได้จากภายนอกแทน
- ปุ่มแสดงเป็นกล่องสีขาว: agent อาจกำลังส่งข้อมูลปุ่มที่ไม่ถูกต้อง ตรวจสอบว่าทุกปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
- ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ใน config เซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` รวมอยู่ และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
- ปุ่มคืนค่า 404 เมื่อคลิก: `id` ของปุ่มน่าจะมีเครื่องหมายขีดกลางหรือขีดล่าง Mattermost action router จะพังเมื่อใช้ ID ที่ไม่ใช่อักขระตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
- log ของ Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณเซ็นทุกฟิลด์ใน context (ไม่ใช่เพียงบางส่วน) ใช้คีย์ที่เรียงแล้ว และใช้ JSON แบบกระชับ (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
- log ของ Gateway แสดง `missing _token in context`: ไม่มีฟิลด์ `_token` ใน context ของปุ่ม ตรวจสอบว่าได้รวมฟิลด์นี้ไว้ตอนสร้าง payload ของ integration
- ข้อความยืนยันแสดง ID แบบดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ให้ตั้งทั้งสองค่าเป็นค่าเดียวกันที่ sanitize แล้ว
- Agent ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ใน config channel ของ Mattermost

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน pairing
- [Groups](/th/channels/groups) — พฤติกรรม group chat และการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
