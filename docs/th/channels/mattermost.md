---
read_when:
    - การตั้งค่า Mattermost
    - การแก้ไขข้อบกพร่องของการกำหนดเส้นทาง Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่า Mattermost bot และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

สถานะ: Plugin ที่มาพร้อมระบบ (bot token + เหตุการณ์ WebSocket) รองรับ channels, groups และ DMs Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่สามารถโฮสต์เองได้ ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ [mattermost.com](https://mattermost.com)

## Plugin ที่มาพร้อมระบบ

<Note>
Mattermost มาพร้อมเป็น Plugin ที่รวมอยู่ใน OpenClaw รุ่นปัจจุบัน ดังนั้นแพ็กเกจบิลด์ปกติไม่จำเป็นต้องติดตั้งแยกต่างหาก
</Note>

หากคุณใช้บิลด์รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Mattermost ไว้ ให้ติดตั้งด้วยตนเอง:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

<Steps>
  <Step title="ตรวจสอบให้แน่ใจว่า Plugin พร้อมใช้งาน">
    OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมไว้แล้ว สำหรับการติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มด้วยตนเองด้วยคำสั่งด้านบน
  </Step>
  <Step title="สร้าง Mattermost bot">
    สร้างบัญชี Mattermost bot และคัดลอก **bot token**
  </Step>
  <Step title="คัดลอก base URL">
    คัดลอก **base URL** ของ Mattermost (เช่น `https://chat.example.com`)
  </Step>
  <Step title="กำหนดค่า OpenClaw และเริ่ม Gateway">
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

  </Step>
</Steps>

## Native slash commands

Native slash commands เป็นแบบเลือกเปิดใช้ เมื่อเปิดใช้แล้ว OpenClaw จะลงทะเบียน slash commands `oc_*` ผ่าน Mattermost API และรับ callback POST บนเซิร์ฟเวอร์ HTTP ของ Gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // ใช้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ได้โดยตรง (reverse proxy/public URL)
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="หมายเหตุพฤติกรรม">
    - `native: "auto"` มีค่าเริ่มต้นเป็นปิดสำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้
    - หากไม่ระบุ `callbackUrl` OpenClaw จะสร้างค่าจากโฮสต์/พอร์ตของ Gateway + `callbackPath`
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้ง `commands` ได้ที่ระดับบนสุดหรือใต้ `channels.mattermost.accounts.<id>.commands` (ค่าระดับบัญชีจะ override ฟิลด์ระดับบนสุด)
    - ระบบจะตรวจสอบ command callbacks ด้วย token ต่อคำสั่งที่ Mattermost ส่งกลับมาเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - slash callbacks จะปฏิเสธโดยปริยายเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นทำงานไม่สมบูรณ์ หรือ callback token ไม่ตรงกับคำสั่งที่ลงทะเบียนไว้คำสั่งใดเลย
  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    endpoint สำหรับ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะรันอยู่บนโฮสต์เดียวกันหรือ network namespace เดียวกับ OpenClaw
    - อย่าตั้ง `callbackUrl` เป็น base URL ของ Mattermost เว้นแต่ URL นั้นจะทำ reverse-proxy เส้นทาง `/api/channels/mattermost/command` ไปยัง OpenClaw
    - วิธีตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; คำขอ GET ควรคืนค่า `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    หาก callback ของคุณชี้ไปยังที่อยู่แบบ private/tailnet/internal ให้ตั้งค่า Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวมโฮสต์/โดเมนของ callback

    ให้ใช้รายการแบบ host/domain ไม่ใช่ URL แบบเต็ม

    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าต่อไปนี้บนโฮสต์ Gateway หากคุณต้องการใช้ตัวแปรสภาพแวดล้อม:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมจะมีผลกับบัญชี **default** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าจาก config

ไม่สามารถตั้ง `MATTERMOST_URL` จาก workspace `.env` ได้ ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)
</Note>

## โหมดแชท

Mattermost จะตอบกลับ DMs โดยอัตโนมัติ พฤติกรรมใน channel ถูกควบคุมด้วย `chatmode`:

<Tabs>
  <Tab title="oncall (ค่าเริ่มต้น)">
    ตอบกลับเฉพาะเมื่อมีการ @mention ใน channels
  </Tab>
  <Tab title="onmessage">
    ตอบกลับทุกข้อความใน channel
  </Tab>
  <Tab title="onchar">
    ตอบกลับเมื่อข้อความขึ้นต้นด้วย trigger prefix
  </Tab>
</Tabs>

ตัวอย่างการกำหนดค่า:

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

- `onchar` ยังคงตอบกลับเมื่อมีการ @mention โดยตรง
- ระบบยังรองรับ `channels.mattermost.requireMention` สำหรับ config แบบเก่า แต่แนะนำให้ใช้ `chatmode`

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับใน channel และ group จะอยู่ใน channel หลักหรือเริ่มเธรดใต้โพสต์ที่เป็นตัวกระตุ้น

- `off` (ค่าเริ่มต้น): ตอบในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดใน channel/group ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันที่มีขอบเขตเป็นเธรด
- `all`: สำหรับ Mattermost ในปัจจุบันมีพฤติกรรมเหมือน `first`
- ข้อความส่วนตัวจะไม่ใช้การตั้งค่านี้และยังคงไม่เป็นเธรด

ตัวอย่างการกำหนดค่า:

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

- เซสชันที่มีขอบเขตเป็นเธรดจะใช้ post id ของโพสต์ที่เป็นตัวกระตุ้นเป็นรากของเธรด
- ปัจจุบัน `first` และ `all` ให้ผลเหมือนกัน เพราะเมื่อ Mattermost มีรากเธรดแล้ว chunk และสื่อที่ตามมาจะต่อในเธรดเดียวกันนั้น

## การควบคุมการเข้าถึง (DMs)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs แบบสาธารณะ: `channels.mattermost.dmPolicy="open"` พร้อม `channels.mattermost.allowFrom=["*"]`

## Channels (groups)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ต้องมีการกล่าวถึง)
- อนุญาตผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ user ID)
- การ override การกล่าวถึงราย channel อยู่ที่ `channels.mattermost.groups.<channelId>.requireMention` หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และจะเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- Channels แบบเปิด: `channels.mattermost.groupPolicy="open"` (ต้องมีการกล่าวถึง)
- หมายเหตุด้านรันไทม์: หากไม่มี `channels.mattermost` เลย รันไทม์จะ fallback ไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบ group (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

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

## เป้าหมายสำหรับการส่งขาออก

ใช้รูปแบบเป้าหมายต่อไปนี้กับ `openclaw message send` หรือ Cron/Webhooks:

- `channel:<id>` สำหรับ channel
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

<Warning>
opaque ID เปล่าๆ (เช่น `64ifufp...`) **กำกวม** ใน Mattermost (อาจเป็น user ID หรือ channel ID)

OpenClaw จะ resolve โดย **ให้ user ก่อน**:

- หาก ID นั้นมีอยู่เป็น user (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่งเป็น **DM** โดย resolve direct channel ผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกมองเป็น **channel ID**

หากคุณต้องการพฤติกรรมที่แน่นอน ให้ใช้ prefix แบบชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองใหม่ของ DM channel

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้อง resolve direct channel ก่อน ระบบจะลองใหม่โดยอัตโนมัติสำหรับความล้มเหลวชั่วคราวในการสร้าง direct channel

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนี้ทั้งระบบสำหรับ Mattermost Plugin หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

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

- ใช้กับการสร้าง DM channel เท่านั้น (`/api/v4/channels/direct`) ไม่ใช่ทุกคำขอ Mattermost API
- การลองใหม่จะใช้กับความล้มเหลวชั่วคราว เช่น rate limit, การตอบกลับแบบ 5xx และข้อผิดพลาดเครือข่ายหรือหมดเวลา
- ข้อผิดพลาดไคลเอนต์ 4xx อื่นที่ไม่ใช่ `429` จะถือว่าเป็นข้อผิดพลาดถาวรและจะไม่ลองใหม่

## Preview streaming

Mattermost จะสตรีมความคิด กิจกรรมเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **draft preview post** เดียว ซึ่งจะสรุปผลในโพสต์เดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง การแสดงตัวอย่างจะอัปเดตบน post id เดิมแทนการสแปม channel ด้วยข้อความแยกตาม chunk สื่อหรือข้อความสุดท้ายแบบข้อผิดพลาดจะยกเลิกการแก้ไข preview ที่รอดำเนินการ และใช้การส่งตามปกติแทนการ flush preview post ที่ไม่จำเป็น

เปิดใช้ผ่าน `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="โหมดการสตรีม">
    - `partial` เป็นตัวเลือกที่ใช้บ่อยที่สุด: preview post เดียวที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น แล้วสรุปเป็นคำตอบสมบูรณ์
    - `block` ใช้ draft chunk แบบต่อท้ายภายใน preview post
    - `progress` แสดง preview สถานะระหว่างการสร้าง และโพสต์คำตอบสุดท้ายเมื่อเสร็จสมบูรณ์เท่านั้น
    - `off` ปิด preview streaming
  </Accordion>
  <Accordion title="หมายเหตุพฤติกรรมการสตรีม">
    - หากไม่สามารถสรุปผลของสตรีมในโพสต์เดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่งโพสต์สุดท้ายใหม่เพื่อไม่ให้คำตอบสูญหาย
    - payload ที่เป็น reasoning อย่างเดียวจะไม่ถูกโพสต์ลง channel รวมถึงข้อความที่มาในรูปแบบบล็อกอ้างอิง `> Reasoning:` ตั้งค่า `/reasoning on` เพื่อดูความคิดในพื้นผิวอื่น ๆ; สำหรับโพสต์สุดท้ายใน Mattermost จะคงไว้เฉพาะคำตอบเท่านั้น
    - ดู [Streaming](/th/concepts/streaming#preview-streaming-modes) สำหรับตารางการแมปตาม channel
  </Accordion>
</AccordionGroup>

## Reactions (message tool)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ Mattermost post id
- `emoji` รับชื่อเช่น `thumbsup` หรือ `:+1:` (เครื่องหมายโคลอนจะมีหรือไม่มีก็ได้)
- ตั้ง `remove=true` (boolean) เพื่อลบ reaction
- เหตุการณ์การเพิ่ม/ลบ reaction จะถูกส่งต่อเป็น system events ไปยังเซสชันเอเจนต์ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการทำงานของ reaction (ค่าเริ่มต้น true)
- การ override ต่อบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (message tool)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม เอเจนต์จะได้รับค่าที่เลือกและสามารถตอบกลับได้

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

ใช้ `message action=send` พร้อมพารามิเตอร์ `buttons` โดยปุ่มเป็นอาร์เรย์ 2 มิติ (แถวของปุ่ม):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ฟิลด์ของปุ่ม:

<ParamField path="text" type="string" required>
  ป้ายข้อความที่แสดง
</ParamField>
<ParamField path="callback_data" type="string" required>
  ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น action ID)
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  สไตล์ของปุ่ม
</ParamField>

เมื่อผู้ใช้คลิกปุ่ม:

<Steps>
  <Step title="ปุ่มถูกแทนที่ด้วยข้อความยืนยัน">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ เลือก **Yes** โดย @user")
  </Step>
  <Step title="เอเจนต์ได้รับค่าที่เลือก">
    เอเจนต์จะได้รับค่าที่เลือกเป็นข้อความขาเข้าและตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุการติดตั้งใช้งาน">
    - callback ของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องกำหนดค่าเพิ่มเติม)
    - Mattermost จะตัด callback data ออกจากการตอบกลับของ API (เป็นฟีเจอร์ด้านความปลอดภัย) ดังนั้นเมื่อมีการคลิก ปุ่มทั้งหมดจะถูกลบออก — ไม่สามารถลบบางส่วนได้
    - Action ID ที่มีขีดกลางหรือขีดล่างจะถูกปรับแต่งโดยอัตโนมัติ (ข้อจำกัดของการกำหนดเส้นทางใน Mattermost)
  </Accordion>
  <Accordion title="การกำหนดค่าและการเข้าถึง">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้คำอธิบายเครื่องมือปุ่มใน system prompt ของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: base URL ภายนอกแบบไม่บังคับสำหรับ callback ของปุ่ม (เช่น `https://gateway.example.com`) ใช้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่ bind host ได้โดยตรง
    - ในการตั้งค่าแบบหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันนี้ภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
    - หากไม่ระบุ `interactions.callbackBaseUrl` OpenClaw จะสร้าง callback URL จาก `gateway.customBindHost` + `gateway.port` แล้ว fallback ไปยัง `http://localhost:<port>`
    - กฎด้านการเข้าถึง: URL callback ของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost โดย `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานอยู่บนโฮสต์เดียวกันหรือ network namespace เดียวกัน
    - หากเป้าหมาย callback ของคุณเป็น private/tailnet/internal ให้เพิ่มโฮสต์/โดเมนนั้นลงใน Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`
  </Accordion>
</AccordionGroup>

### การรวมเข้ากับ API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhooks สามารถโพสต์ปุ่มได้โดยตรงผ่าน Mattermost REST API โดยไม่ต้องผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก Plugin เมื่อเป็นไปได้ หากโพสต์ JSON ดิบ ให้ปฏิบัติตามกฎต่อไปนี้:

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
            id: "mybutton01", // ใช้ได้เฉพาะอักขระตัวอักษรและตัวเลข — ดูด้านล่าง
            type: "button", // จำเป็น มิฉะนั้นการคลิกจะถูกเพิกเฉยแบบเงียบ ๆ
            name: "Approve", // ป้ายข้อความที่แสดง
            style: "primary", // ไม่บังคับ: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ต้องตรงกับ button id (สำหรับค้นหาชื่อ)
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

<Warning>
**กฎสำคัญ**

1. Attachments ต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกเพิกเฉยแบบเงียบ ๆ)
2. ทุก action ต้องมี `type: "button"` — หากไม่มี การคลิกจะถูกกลืนหายไปแบบเงียบ ๆ
3. ทุก action ต้องมีฟิลด์ `id` — Mattermost จะเพิกเฉยต่อ actions ที่ไม่มี ID
4. `id` ของ action ต้องเป็น **อักขระตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) ขีดกลางและขีดล่างจะทำให้การกำหนดเส้นทาง action ฝั่งเซิร์ฟเวอร์ของ Mattermost ใช้งานไม่ได้ (คืนค่า 404) ให้ตัดออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดงชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. จำเป็นต้องมี `context.action_id` — ตัวจัดการ interaction จะคืนค่า 400 หากไม่มี
   </Warning>

**การสร้าง HMAC token**

Gateway จะตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้าง token ให้ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="สร้าง secret จาก bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="สร้างอ็อบเจ็กต์ context">
    สร้างอ็อบเจ็กต์ context พร้อมทุกฟิลด์ **ยกเว้น** `_token`
  </Step>
  <Step title="ซีเรียลไลซ์ด้วยคีย์ที่เรียงลำดับ">
    ซีเรียลไลซ์ด้วย **คีย์ที่เรียงลำดับ** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify` กับคีย์ที่เรียงลำดับ ซึ่งจะให้ผลลัพธ์แบบกระชับ)
  </Step>
  <Step title="ลงนาม payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="เพิ่ม token">
    เพิ่ม hex digest ที่ได้เป็น `_token` ใน context
  </Step>
</Steps>

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

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด HMAC ที่พบบ่อย">
    - โดยปริยาย `json.dumps` ของ Python จะเพิ่มช่องว่าง (`{"key": "val"}`) ให้ใช้ `separators=(",", ":")` เพื่อให้ตรงกับผลลัพธ์แบบกระชับของ JavaScript (`{"key":"val"}`)
    - ลงนาม **ทุก** ฟิลด์ใน context เสมอ (ยกเว้น `_token`) Gateway จะตัด `_token` ออกแล้วลงนามทุกอย่างที่เหลือ การลงนามเพียงบางส่วนจะทำให้การตรวจสอบล้มเหลวแบบเงียบ ๆ
    - ใช้ `sort_keys=True` — Gateway จะเรียงคีย์ก่อนลงนาม และ Mattermost อาจจัดลำดับฟิลด์ context ใหม่เมื่อจัดเก็บ payload
    - สร้าง secret จาก bot token (กำหนดแน่นอน) ไม่ใช่ไบต์สุ่ม secret ต้องเหมือนกันระหว่างโปรเซสที่สร้างปุ่มและ Gateway ที่ใช้ตรวจสอบ
  </Accordion>
</AccordionGroup>

## Directory adapter

Mattermost Plugin มี directory adapter ที่ resolve ชื่อ channel และผู้ใช้ผ่าน Mattermost API ซึ่งช่วยให้ใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` และการส่งผ่าน Cron/Webhooks ได้

ไม่ต้องกำหนดค่าเพิ่มเติม — adapter จะใช้ bot token จาก config ของบัญชี

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

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับใน channels">
    ตรวจสอบให้แน่ใจว่า bot อยู่ใน channel และมีการ mention (oncall) ใช้ trigger prefix (onchar) หรือตั้ง `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาดการยืนยันตัวตนหรือหลายบัญชี">
    - ตรวจสอบ bot token, base URL และว่าบัญชีนั้นเปิดใช้งานอยู่หรือไม่
    - ปัญหาแบบหลายบัญชี: ตัวแปรสภาพแวดล้อมจะมีผลกับบัญชี `default` เท่านั้น
  </Accordion>
  <Accordion title="Native slash commands ล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับ callback token สาเหตุที่พบบ่อย:
      - การลงทะเบียน slash command ล้มเหลวหรือเสร็จสมบูรณ์เพียงบางส่วนตอนเริ่มระบบ
      - callback ถูกส่งไปยัง Gateway/บัญชีที่ไม่ถูกต้อง
      - Mattermost ยังคงมีคำสั่งเก่าที่ชี้ไปยังเป้าหมาย callback เดิม
      - Gateway รีสตาร์ตโดยไม่เปิดใช้งาน slash commands ใหม่
    - หาก native slash commands หยุดทำงาน ให้ตรวจสอบ logs สำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากไม่ระบุ `callbackUrl` และ logs เตือนว่า callback ถูก resolve เป็น `http://127.0.0.1:18789/...` URL นั้นอาจเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานบนโฮสต์เดียวกันหรือ network namespace เดียวกับ OpenClaw เท่านั้น ให้ตั้ง `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน
  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มแสดงเป็นกล่องสีขาว: เอเจนต์อาจกำลังส่งข้อมูลปุ่มที่มีรูปแบบไม่ถูกต้อง ตรวจสอบว่าปุ่มแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
    - ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ใน config เซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
    - คลิกปุ่มแล้วได้ 404: `id` ของปุ่มน่าจะมีขีดกลางหรือขีดล่าง ตัวกำหนดเส้นทาง action ของ Mattermost ใช้งานไม่ได้กับ ID ที่ไม่ใช่อักขระตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
    - Gateway logs แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามทุกฟิลด์ใน context (ไม่ใช่เพียงบางส่วน) ใช้คีย์ที่เรียงลำดับ และใช้ JSON แบบกระชับ (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - Gateway logs แสดง `missing _token in context`: ไม่มีฟิลด์ `_token` อยู่ใน context ของปุ่ม ตรวจสอบให้แน่ใจว่าได้รวมฟิลด์นี้ไว้เมื่อสร้าง integration payload
    - ข้อความยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ให้ตั้งทั้งสองค่าเป็นค่าเดียวกันที่ผ่านการปรับแต่งแล้ว
    - เอเจนต์ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ลงใน config channel ของ Mattermost
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมของ Channels](/th/channels) — channels ทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชทกลุ่มและการกำหนดให้ต้องมีการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความมั่นคงปลอดภัย
