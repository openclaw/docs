---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทางของ Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin แบบดาวน์โหลดได้ (โทเค็นบอต + เหตุการณ์ WebSocket) รองรับช่อง กลุ่ม และ DM Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้; ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ [mattermost.com](https://mattermost.com)

## ติดตั้ง

ติดตั้ง Mattermost ก่อนกำหนดค่าช่อง:

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

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="Ensure plugin is available">
    OpenClaw รุ่นแพ็กเกจปัจจุบันรวม Plugin นี้ไว้แล้ว การติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มด้วยตนเองได้ด้วยคำสั่งด้านบน
  </Step>
  <Step title="Create a Mattermost bot">
    สร้างบัญชีบอต Mattermost แล้วคัดลอก **โทเค็นบอต**
  </Step>
  <Step title="Copy the base URL">
    คัดลอก **URL ฐาน** ของ Mattermost (เช่น `https://chat.example.com`)
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

## คำสั่ง slash แบบเนทีฟ

คำสั่ง slash แบบเนทีฟเป็นแบบเลือกเปิดใช้ เมื่อเปิดใช้ OpenClaw จะลงทะเบียนคำสั่ง slash `oc_*` ผ่าน Mattermost API และรับ POST callback บนเซิร์ฟเวอร์ HTTP ของ Gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` มีค่าเริ่มต้นเป็นปิดใช้งานสำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้
    - หากละ `callbackUrl` ไว้ OpenClaw จะสร้างค่าจากโฮสต์/พอร์ตของ Gateway + `callbackPath`
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้ง `commands` ที่ระดับบนสุดหรือภายใต้ `channels.mattermost.accounts.<id>.commands` ได้ (ค่าของบัญชีจะเขียนทับฟิลด์ระดับบนสุด)
    - callback ของคำสั่งจะถูกตรวจสอบด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งคืนเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw รีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนยอมรับ callback แต่ละครั้ง เพื่อให้โทเค็นเก่าจากคำสั่ง slash ที่ถูกลบหรือสร้างใหม่หยุดถูกยอมรับโดยไม่ต้องรีสตาร์ต Gateway
    - การตรวจสอบ callback จะปิดกั้นโดยค่าเริ่มต้นหาก Mattermost API ไม่สามารถยืนยันได้ว่าคำสั่งยังเป็นปัจจุบันอยู่; การตรวจสอบที่ล้มเหลวจะถูกแคชชั่วครู่ การค้นหาพร้อมกันจะถูกรวมเข้าด้วยกัน และการเริ่มค้นหาใหม่จะถูกจำกัดอัตราต่อคำสั่งเพื่อจำกัดแรงกดดันจากการเล่นซ้ำ
    - callback ของ slash จะปิดกั้นเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นทำได้บางส่วน หรือโทเค็น callback ไม่ตรงกับโทเค็นที่ลงทะเบียนของคำสั่งที่ resolve ได้ (โทเค็นที่ใช้ได้กับคำสั่งหนึ่งจะไม่สามารถไปถึงการตรวจสอบ upstream สำหรับอีกคำสั่งหนึ่งได้)

  </Accordion>
  <Accordion title="Reachability requirement">
    endpoint ของ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานบนโฮสต์/namespace เครือข่ายเดียวกับ OpenClaw
    - อย่าตั้ง `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้นจะ reverse-proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
    - การตรวจสอบแบบรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; GET ควรคืนค่า `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    หาก callback ของคุณชี้ไปยังที่อยู่ส่วนตัว/tailnet/ภายใน ให้ตั้งค่า Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวมโฮสต์/โดเมนของ callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL เต็ม

    - ดี: `gateway.tailnet-name.ts.net`
    - ไม่ดี: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าเหล่านี้บนโฮสต์ Gateway หากคุณต้องการใช้ตัวแปรสภาพแวดล้อม:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมมีผลกับบัญชี **เริ่มต้น** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้ง `MATTERMOST_URL` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)
</Note>

## โหมดแชท

Mattermost ตอบ DM โดยอัตโนมัติ พฤติกรรมของช่องถูกควบคุมโดย `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    ตอบเฉพาะเมื่อถูก @mentioned ในช่อง
  </Tab>
  <Tab title="onmessage">
    ตอบทุกข้อความในช่อง
  </Tab>
  <Tab title="onchar">
    ตอบเมื่อข้อความขึ้นต้นด้วยคำนำหน้าทริกเกอร์
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

- `onchar` ยังคงตอบต่อการ @mention อย่างชัดเจน
- `channels.mattermost.requireMention` ยังรองรับสำหรับการกำหนดค่าเดิม แต่แนะนำให้ใช้ `chatmode`

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับในช่องและกลุ่มจะอยู่ในช่องหลักหรือเริ่มเธรดใต้โพสต์ที่ทริกเกอร์

- `off` (ค่าเริ่มต้น): ตอบในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดในช่อง/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันตามขอบเขตเธรด
- `all`: พฤติกรรมเดียวกับ `first` สำหรับ Mattermost ในปัจจุบัน
- ข้อความโดยตรงจะไม่สนใจการตั้งค่านี้และยังคงไม่เป็นเธรด

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

- เซสชันตามขอบเขตเธรดใช้ id ของโพสต์ที่ทริกเกอร์เป็นรากของเธรด
- `first` และ `all` เทียบเท่ากันในปัจจุบัน เพราะเมื่อ Mattermost มีรากของเธรดแล้ว chunk ติดตามผลและสื่อจะดำเนินต่อในเธรดเดียวกันนั้น

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` พร้อม `channels.mattermost.allowFrom=["*"]`
- `channels.mattermost.allowFrom` รับรายการ `accessGroup:<name>` ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## ช่อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ถูกควบคุมด้วยการ mention)
- allowlist ผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- `channels.mattermost.groupAllowFrom` รับรายการ `accessGroup:<name>` ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- การเขียนทับการ mention ต่อช่องอยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- ช่องเปิด: `channels.mattermost.groupPolicy="open"` (ถูกควบคุมด้วยการ mention)
- หมายเหตุ runtime: หาก `channels.mattermost` ขาดหายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

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

## เป้าหมายสำหรับการส่งออก

ใช้รูปแบบเป้าหมายเหล่านี้กับ `openclaw message send` หรือ cron/webhook:

- `channel:<id>` สำหรับช่อง
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

<Warning>
ID ทึบแบบไม่มีคำนำหน้า (เช่น `64ifufp...`) **กำกวม** ใน Mattermost (ID ผู้ใช้ เทียบกับ ID ช่อง)

OpenClaw resolve ID เหล่านี้โดยให้ **ผู้ใช้ก่อน**:

- หาก ID มีอยู่เป็นผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดย resolve ช่องโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกถือเป็น **ID ช่อง**

หากต้องการพฤติกรรมที่กำหนดแน่นอน ให้ใช้คำนำหน้าที่ชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การ retry ช่อง DM

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้อง resolve ช่องโดยตรงก่อน ระบบจะ retry ความล้มเหลวชั่วคราวในการสร้างช่องโดยตรงตามค่าเริ่มต้น

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนี้แบบทั่วทั้ง Plugin Mattermost หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

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

- ใช้กับการสร้างช่อง DM (`/api/v4/channels/direct`) เท่านั้น ไม่ใช่ทุกการเรียก Mattermost API
- การ retry ใช้กับความล้มเหลวชั่วคราว เช่น การจำกัดอัตรา การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาดไคลเอนต์ 4xx นอกเหนือจาก `429` ถือเป็นถาวรและจะไม่ retry

## การสตรีมตัวอย่างก่อนส่ง

Mattermost สตรีมการคิด กิจกรรมเครื่องมือ และข้อความตอบกลับบางส่วนเข้าไปใน **โพสต์ตัวอย่างแบบร่าง** เดียว ซึ่งจะสรุปในที่เดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง ตัวอย่างจะอัปเดตบน id โพสต์เดียวกันแทนการสแปมช่องด้วยข้อความราย chunk ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่และใช้การส่งแบบปกติแทนการ flush โพสต์ตัวอย่างชั่วคราว

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
  <Accordion title="Streaming modes">
    - `partial` เป็นตัวเลือกทั่วไป: โพสต์ตัวอย่างหนึ่งรายการที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น จากนั้นสรุปด้วยคำตอบที่สมบูรณ์
    - `block` ใช้ chunk แบบร่างสไตล์ต่อท้ายภายในโพสต์ตัวอย่าง
    - `progress` แสดงตัวอย่างสถานะระหว่างสร้าง และโพสต์เฉพาะคำตอบสุดท้ายเมื่อเสร็จสิ้น
    - `off` ปิดใช้งานการสตรีมตัวอย่าง

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - หากไม่สามารถสรุปสตรีมในที่เดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่งโพสต์สุดท้ายใหม่ เพื่อให้คำตอบไม่สูญหาย
    - payload ที่เป็นเฉพาะการใช้เหตุผลจะถูกระงับจากโพสต์ในช่อง รวมถึงข้อความที่มาถึงเป็น blockquote `> Reasoning:` ตั้งค่า `/reasoning on` เพื่อดูการคิดในพื้นผิวอื่น; โพสต์สุดท้ายของ Mattermost จะเก็บไว้เฉพาะคำตอบ
    - ดู [การสตรีม](/th/concepts/streaming#preview-streaming-modes) สำหรับเมทริกซ์การแมปช่อง

  </Accordion>
</AccordionGroup>

## ปฏิกิริยา (เครื่องมือข้อความ)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ id โพสต์ของ Mattermost
- `emoji` รับชื่ออย่าง `thumbsup` หรือ `:+1:` (เครื่องหมายโคลอนเป็นทางเลือก)
- ตั้ง `remove=true` (บูลีน) เพื่อลบปฏิกิริยา
- เหตุการณ์เพิ่ม/ลบปฏิกิริยาจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชัน agent ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการกระทำปฏิกิริยา (ค่าเริ่มต้น true)
- การเขียนทับต่อบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม agent จะได้รับตัวเลือกและสามารถตอบกลับได้

เปิดใช้ปุ่มโดยเพิ่ม `inlineButtons` ไปยังความสามารถของช่อง:

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

<ParamField path="text" type="string" required>
  ป้ายกำกับที่แสดงผล
</ParamField>
<ParamField path="callback_data" type="string" required>
  ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น ID ของการดำเนินการ)
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  สไตล์ของปุ่ม
</ParamField>

เมื่อผู้ใช้คลิกปุ่ม:

<Steps>
  <Step title="Buttons replaced with confirmation">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **Yes** selected by @user")
  </Step>
  <Step title="Agent receives the selection">
    เอเจนต์จะได้รับรายการที่เลือกเป็นข้อความขาเข้าและตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องตั้งค่า)
    - Mattermost ตัดข้อมูลคอลแบ็กออกจากการตอบกลับ API ของตัวเอง (คุณสมบัติด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมดจะถูกลบเมื่อคลิก - ไม่สามารถลบบางส่วนได้
    - ID การดำเนินการที่มีขีดกลางหรือขีดล่างจะถูกทำให้ปลอดภัยโดยอัตโนมัติ (ข้อจำกัดการกำหนดเส้นทางของ Mattermost)

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้คำอธิบายเครื่องมือปุ่มในพรอมป์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกแบบไม่บังคับสำหรับคอลแบ็กของปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่โฮสต์ที่ผูกไว้ได้โดยตรง
    - ในการตั้งค่าหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` ได้ด้วย
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะอนุมาน URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` แล้วจึงย้อนกลับไปใช้ `http://localhost:<port>`
    - กฎการเข้าถึง: URL คอลแบ็กของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - หากปลายทางคอลแบ็กของคุณเป็นแบบส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนนั้นลงใน `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhook สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก Plugin เมื่อเป็นไปได้ หากโพสต์ JSON ดิบ ให้ทำตามกฎเหล่านี้:

**โครงสร้างเพย์โหลด:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. ต้องใส่สิ่งที่แนบมาใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกละเว้นอย่างเงียบ ๆ)
2. ทุกการดำเนินการต้องมี `type: "button"` - หากไม่มี คำคลิกจะถูกกลืนไปอย่างเงียบ ๆ
3. ทุกการดำเนินการต้องมีฟิลด์ `id` - Mattermost จะละเว้นการดำเนินการที่ไม่มี ID
4. `id` ของการดำเนินการต้องเป็น **ตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) ขีดกลางและขีดล่างจะทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost เสียหาย (คืนค่า 404) ให้ตัดออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดงชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. ต้องมี `context.action_id` - ตัวจัดการการโต้ตอบจะคืนค่า 400 หากไม่มี

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    สร้างอ็อบเจกต์บริบทพร้อมฟิลด์ทั้งหมด **ยกเว้น** `_token`
  </Step>
  <Step title="Serialize with sorted keys">
    ซีเรียลไลซ์โดยใช้ **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify` กับคีย์ที่เรียงลำดับแล้ว ซึ่งสร้างผลลัพธ์แบบกะทัดรัด)
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    เพิ่ม hex digest ที่ได้เป็น `_token` ในบริบท
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
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` ของ Python เพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับผลลัพธ์แบบกะทัดรัดของ JavaScript (`{"key":"val"}`)
    - เซ็น **ทุก** ฟิลด์บริบทเสมอ (ยกเว้น `_token`) Gateway จะตัด `_token` ออกแล้วเซ็นทุกอย่างที่เหลือ การเซ็นเพียงบางส่วนจะทำให้การตรวจสอบล้มเหลวอย่างเงียบ ๆ
    - ใช้ `sort_keys=True` - Gateway เรียงคีย์ก่อนเซ็น และ Mattermost อาจเรียงฟิลด์บริบทใหม่เมื่อจัดเก็บเพย์โหลด
    - อนุมานความลับจากโทเค็นบอต (กำหนดได้แน่นอน) ไม่ใช่ไบต์แบบสุ่ม ความลับต้องเหมือนกันระหว่างโปรเซสที่สร้างปุ่มและ Gateway ที่ตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin Mattermost มีอะแดปเตอร์ไดเรกทอรีที่แปลงชื่อแชนเนลและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งทำให้ใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` และการส่ง Cron/Webhook ได้

ไม่จำเป็นต้องตั้งค่า - อะแดปเตอร์ใช้โทเค็นบอตจากค่าตั้งค่าบัญชี

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
  <Accordion title="No replies in channels">
    ตรวจสอบว่าบอตอยู่ในแชนเนลและกล่าวถึงบอต (oncall), ใช้คำนำหน้าทริกเกอร์ (onchar), หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และบัญชีเปิดใช้งานอยู่หรือไม่
    - ปัญหาหลายบัญชี: env vars ใช้กับบัญชี `default` เท่านั้น

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นคอลแบ็ก สาเหตุทั่วไป:
      - การลงทะเบียนคำสั่ง slash ล้มเหลวหรือเสร็จสมบูรณ์เพียงบางส่วนตอนเริ่มต้น
      - คอลแบ็กกำลังไปยัง Gateway/บัญชีที่ผิด
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังปลายทางคอลแบ็กก่อนหน้า
      - Gateway รีสตาร์ทโดยไม่ได้เปิดใช้งานคำสั่ง slash อีกครั้ง
    - หากคำสั่ง slash แบบเนทีฟหยุดทำงาน ให้ตรวจสอบล็อกสำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และล็อกเตือนว่าคอลแบ็กแปลงเป็น `http://127.0.0.1:18789/...` URL นั้นน่าจะเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกันกับ OpenClaw ให้ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="Buttons issues">
    - ปุ่มแสดงเป็นกล่องสีขาว: เอเจนต์อาจกำลังส่งข้อมูลปุ่มที่มีรูปแบบไม่ถูกต้อง ตรวจสอบว่าปุ่มแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
    - ปุ่มแสดงผลแต่คลิกแล้วไม่มีอะไรเกิดขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ในค่าตั้งค่าเซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
    - ปุ่มคืนค่า 404 เมื่อคลิก: `id` ของปุ่มน่าจะมีขีดกลางหรือขีดล่าง เราเตอร์การดำเนินการของ Mattermost เสียหายเมื่อใช้ ID ที่ไม่ใช่ตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
    - ล็อก Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณเซ็นทุกฟิลด์บริบท (ไม่ใช่เพียงบางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกะทัดรัด (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - ล็อก Gateway แสดง `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ในบริบทของปุ่ม ตรวจสอบว่าได้รวมฟิลด์นี้เมื่อสร้างเพย์โหลดการผสานรวม
    - การยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ตั้งค่าทั้งสองเป็นค่าที่ทำให้ปลอดภัยเดียวกัน
    - เอเจนต์ไม่รู้เรื่องปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ในค่าตั้งค่าแชนเนล Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมแชนเนล](/th/channels) - แชนเนลที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชทกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
