---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทางของ Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T09:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้ (โทเคนบอต + เหตุการณ์ WebSocket) รองรับช่อง กลุ่ม และ DM Mattermost เป็นแพลตฟอร์มรับส่งข้อความสำหรับทีมที่โฮสต์เองได้ ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ [mattermost.com](https://mattermost.com)

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
    OpenClaw รุ่นแพ็กเกจปัจจุบันมีรายการนี้รวมอยู่แล้ว การติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มด้วยคำสั่งด้านบนได้
  </Step>
  <Step title="Create a Mattermost bot">
    สร้างบัญชีบอต Mattermost แล้วคัดลอก **โทเคนบอต**
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

## คำสั่งสแลชแบบเนทีฟ

คำสั่งสแลชแบบเนทีฟเป็นแบบเลือกเปิดใช้ เมื่อเปิดใช้ OpenClaw จะลงทะเบียนคำสั่งสแลช `oc_*` ผ่าน Mattermost API และรับ callback POST บนเซิร์ฟเวอร์ HTTP ของ Gateway

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
    - ค่าเริ่มต้นของ `native: "auto"` คือปิดใช้งานสำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้
    - หากละเว้น `callbackUrl` OpenClaw จะอนุมานจากโฮสต์/พอร์ตของ Gateway + `callbackPath`
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้ง `commands` ที่ระดับบนสุดหรือใต้ `channels.mattermost.accounts.<id>.commands` ได้ (ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด)
    - callback ของคำสั่งจะถูกตรวจสอบด้วยโทเคนต่อคำสั่งที่ Mattermost ส่งกลับมาเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw รีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนรับแต่ละ callback เพื่อให้โทเคนค้างจากคำสั่งสแลชที่ถูกลบหรือสร้างใหม่หยุดถูกยอมรับโดยไม่ต้องรีสตาร์ต Gateway
    - การตรวจสอบ callback จะล้มเหลวแบบปิดหาก Mattermost API ไม่สามารถยืนยันได้ว่าคำสั่งยังเป็นคำสั่งปัจจุบัน การตรวจสอบที่ล้มเหลวจะถูกแคชไว้ชั่วครู่ การค้นหาพร้อมกันจะถูกรวมเข้าด้วยกัน และการเริ่มค้นหาใหม่จะถูกจำกัดอัตราต่อคำสั่งเพื่อจำกัดแรงกดดันจากการ replay
    - callback ของสแลชจะล้มเหลวแบบปิดเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นทำได้บางส่วน หรือโทเคน callback ไม่ตรงกับโทเคนที่ลงทะเบียนของคำสั่งที่แก้หาได้ (โทเคนที่ใช้ได้กับคำสั่งหนึ่งไม่สามารถไปถึงการตรวจสอบ upstream สำหรับคำสั่งอื่นได้)

  </Accordion>
  <Accordion title="Reachability requirement">
    endpoint ของ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะรันอยู่บนโฮสต์หรือ namespace เครือข่ายเดียวกับ OpenClaw
    - อย่าตั้ง `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้นจะ reverse proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
    - การตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; GET ควรส่งคืน `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    หาก callback ของคุณชี้ไปยังที่อยู่ส่วนตัว/tailnet/ภายใน ให้ตั้งค่า `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมนของ callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม

    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway หากคุณต้องการใช้ตัวแปรสภาพแวดล้อม:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชี **เริ่มต้น** (`default`) บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้ง `MATTERMOST_URL` จาก `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)
</Note>

## โหมดแชท

Mattermost ตอบกลับ DM โดยอัตโนมัติ พฤติกรรมของช่องควบคุมด้วย `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    ตอบกลับเฉพาะเมื่อถูก @mention ในช่อง
  </Tab>
  <Tab title="onmessage">
    ตอบกลับทุกข้อความในช่อง
  </Tab>
  <Tab title="onchar">
    ตอบกลับเมื่อข้อความเริ่มต้นด้วยคำนำหน้าทริกเกอร์
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

- `onchar` ยังตอบกลับ @mention ที่ระบุชัดเจน
- `channels.mattermost.requireMention` ยังรองรับสำหรับการกำหนดค่าเก่า แต่แนะนำให้ใช้ `chatmode`

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับในช่องและกลุ่มจะอยู่ในช่องหลักหรือเริ่มเธรดใต้โพสต์ที่ทริกเกอร์

- `off` (ค่าเริ่มต้น): ตอบกลับในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดในช่อง/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันที่มีขอบเขตตามเธรด
- `all`: พฤติกรรมเหมือนกับ `first` สำหรับ Mattermost ในปัจจุบัน
- ข้อความโดยตรงจะไม่ใช้การตั้งค่านี้และยังคงไม่เป็นเธรด

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

- เซสชันที่มีขอบเขตตามเธรดใช้ id ของโพสต์ที่ทริกเกอร์เป็นรากของเธรด
- ปัจจุบัน `first` และ `all` เทียบเท่ากัน เพราะเมื่อ Mattermost มีรากของเธรดแล้ว ชิ้นส่วนติดตามผลและสื่อจะดำเนินต่อในเธรดเดียวกันนั้น

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` บวกกับ `channels.mattermost.allowFrom=["*"]`

## ช่อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ต้องมีการ mention)
- อนุญาตผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- การแทนที่ mention รายช่องอยู่ใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- เปิดช่อง: `channels.mattermost.groupPolicy="open"` (ต้องมีการ mention)
- หมายเหตุ runtime: หากไม่มี `channels.mattermost` เลย runtime จะถอยกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

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

ใช้รูปแบบเป้าหมายเหล่านี้กับ `openclaw message send` หรือ cron/webhooks:

- `channel:<id>` สำหรับช่อง
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (แก้หาผ่าน Mattermost API)

<Warning>
ID ทึบแบบไม่มีคำนำหน้า (เช่น `64ifufp...`) มีความ **กำกวม** ใน Mattermost (ID ผู้ใช้ เทียบกับ ID ช่อง)

OpenClaw แก้หาโดยให้ **ผู้ใช้มาก่อน**:

- หาก ID มีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดยแก้หาช่องโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกถือเป็น **ID ช่อง**

หากคุณต้องการพฤติกรรมที่กำหนดแน่นอน ให้ใช้คำนำหน้าที่ระบุชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การ retry ช่อง DM

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้องแก้หาช่องโดยตรงก่อน โดยค่าเริ่มต้นจะ retry ความล้มเหลวชั่วคราวในการสร้างช่องโดยตรง

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนั้นโดยรวมสำหรับ Plugin Mattermost หรือ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

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

- มีผลเฉพาะกับการสร้างช่อง DM (`/api/v4/channels/direct`) ไม่ใช่ทุกการเรียก Mattermost API
- การ retry ใช้กับความล้มเหลวชั่วคราว เช่น การจำกัดอัตรา การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาดไคลเอนต์ 4xx นอกเหนือจาก `429` ถือเป็นข้อผิดพลาดถาวรและจะไม่ retry

## การสตรีมตัวอย่าง

Mattermost สตรีมการคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **โพสต์ตัวอย่างแบบร่าง** เดียวที่ finalizes ในตำแหน่งเดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง ตัวอย่างจะอัปเดตบน id โพสต์เดียวกันแทนการสแปมช่องด้วยข้อความต่อชิ้น ส่วนสุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่และใช้การส่งปกติแทนการ flush โพสต์ตัวอย่างทิ้ง

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
    - `partial` เป็นตัวเลือกทั่วไป: โพสต์ตัวอย่างหนึ่งรายการที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น จากนั้น finalize ด้วยคำตอบสมบูรณ์
    - `block` ใช้ชิ้นส่วนแบบร่างสไตล์ append ภายในโพสต์ตัวอย่าง
    - `progress` แสดงตัวอย่างสถานะระหว่างสร้าง และโพสต์เฉพาะคำตอบสุดท้ายเมื่อเสร็จสิ้น
    - `off` ปิดการสตรีมตัวอย่าง

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - หากไม่สามารถ finalize สตรีมในตำแหน่งเดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะถอยกลับไปส่งโพสต์สุดท้ายใหม่ เพื่อให้การตอบกลับไม่สูญหาย
    - payload ที่มีเฉพาะ reasoning จะถูกระงับจากโพสต์ในช่อง รวมถึงข้อความที่มาถึงในรูปแบบ blockquote `> Reasoning:` ตั้งค่า `/reasoning on` เพื่อดูการคิดในพื้นผิวอื่น โพสต์สุดท้ายของ Mattermost จะเก็บเฉพาะคำตอบ
    - ดู [Streaming](/th/concepts/streaming#preview-streaming-modes) สำหรับเมทริกซ์การแมปช่อง

  </Accordion>
</AccordionGroup>

## ปฏิกิริยา (เครื่องมือข้อความ)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ id โพสต์ของ Mattermost
- `emoji` รับชื่อ เช่น `thumbsup` หรือ `:+1:` (โคลอนเป็นทางเลือก)
- ตั้งค่า `remove=true` (boolean) เพื่อลบปฏิกิริยา
- เหตุการณ์เพิ่ม/ลบปฏิกิริยาจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชัน agent ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการกระทำปฏิกิริยา (ค่าเริ่มต้น true)
- การแทนที่รายบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม agent จะได้รับการเลือกและสามารถตอบกลับได้

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
  รูปแบบปุ่ม
</ParamField>

เมื่อผู้ใช้คลิกปุ่ม:

<Steps>
  <Step title="ปุ่มถูกแทนที่ด้วยการยืนยัน">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **Yes** selected by @user")
  </Step>
  <Step title="เอเจนต์ได้รับรายการที่เลือก">
    เอเจนต์ได้รับรายการที่เลือกเป็นข้อความขาเข้าและตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุการใช้งาน">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องตั้งค่า)
    - Mattermost ลบข้อมูลคอลแบ็กออกจากการตอบกลับ API (คุณสมบัติด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมดจะถูกลบเมื่อคลิก - ไม่สามารถลบบางส่วนได้
    - ID การดำเนินการที่มีขีดกลางหรือขีดล่างจะถูกทำให้ปลอดภัยโดยอัตโนมัติ (ข้อจำกัดการกำหนดเส้นทางของ Mattermost)

  </Accordion>
  <Accordion title="การตั้งค่าและการเข้าถึง">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้งานคำอธิบายเครื่องมือปุ่มในพรอมป์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกแบบไม่บังคับสำหรับคอลแบ็กปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง gateway ที่ bind host ของมันได้โดยตรง
    - ในการตั้งค่าหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` ได้
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะสร้าง URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` แล้วจึงย้อนกลับไปใช้ `http://localhost:<port>`
    - กฎการเข้าถึง: URL คอลแบ็กของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw รันอยู่บน host/namespace เครือข่ายเดียวกัน
    - หากเป้าหมายคอลแบ็กของคุณเป็นแบบส่วนตัว/tailnet/ภายใน ให้เพิ่ม host/domain นั้นลงใน Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ webhooks สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก Plugin เมื่อทำได้ หากโพสต์ JSON ดิบ ให้ทำตามกฎเหล่านี้:

**โครงสร้าง Payload:**

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

1. Attachments ต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกละเว้นแบบเงียบ)
2. ทุกการดำเนินการต้องมี `type: "button"` - หากไม่มี คลิกจะถูกกลืนแบบเงียบ
3. ทุกการดำเนินการต้องมีฟิลด์ `id` - Mattermost จะละเว้นการดำเนินการที่ไม่มี ID
4. `id` ของการดำเนินการต้องเป็น **ตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) ขีดกลางและขีดล่างทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost เสีย (ส่งคืน 404) ให้ลบออกก่อนใช้
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดงชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. ต้องมี `context.action_id` - ตัวจัดการการโต้ตอบจะส่งคืน 400 หากไม่มี

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="สร้าง secret จาก bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="สร้างอ็อบเจกต์ context">
    สร้างอ็อบเจกต์ context พร้อมฟิลด์ทั้งหมด **ยกเว้น** `_token`
  </Step>
  <Step title="Serialize ด้วยคีย์ที่เรียงลำดับแล้ว">
    Serialize ด้วย **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify` กับคีย์ที่เรียงลำดับแล้ว ซึ่งสร้างเอาต์พุตแบบกะทัดรัด)
  </Step>
  <Step title="เซ็น payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="เพิ่มโทเค็น">
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
  <Accordion title="ข้อผิดพลาดที่พบบ่อยเกี่ยวกับ HMAC">
    - `json.dumps` ของ Python เพิ่มช่องว่างตามค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตแบบกะทัดรัดของ JavaScript (`{"key":"val"}`)
    - เซ็นฟิลด์ context **ทั้งหมด** เสมอ (ยกเว้น `_token`) Gateway จะลบ `_token` แล้วเซ็นทุกอย่างที่เหลือ การเซ็นเพียงบางส่วนทำให้การตรวจสอบล้มเหลวแบบเงียบ
    - ใช้ `sort_keys=True` - Gateway เรียงคีย์ก่อนเซ็น และ Mattermost อาจเรียงลำดับฟิลด์ context ใหม่เมื่อจัดเก็บ payload
    - สร้าง secret จาก bot token (กำหนดได้แน่นอน) ไม่ใช่ไบต์แบบสุ่ม secret ต้องเหมือนกันระหว่างกระบวนการที่สร้างปุ่มกับ Gateway ที่ตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin Mattermost มีอะแดปเตอร์ไดเรกทอรีที่ resolve ชื่อช่องและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งเปิดใช้งานเป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` และการส่ง cron/webhook

ไม่ต้องตั้งค่า - อะแดปเตอร์ใช้ bot token จากการตั้งค่าบัญชี

## หลายบัญชี

Mattermost รองรับหลายบัญชีใต้ `channels.mattermost.accounts`:

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
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบให้แน่ใจว่า bot อยู่ในช่องและ mention มัน (oncall), ใช้ trigger prefix (onchar), หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาด auth หรือหลายบัญชี">
    - ตรวจสอบ bot token, URL ฐาน และบัญชีถูกเปิดใช้งานอยู่หรือไม่
    - ปัญหาหลายบัญชี: env vars มีผลกับบัญชี `default` เท่านั้น

  </Accordion>
  <Accordion title="คำสั่ง slash แบบเนทีฟล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับ callback token สาเหตุทั่วไป:
      - การลงทะเบียน slash command ล้มเหลวหรือเสร็จเพียงบางส่วนเมื่อเริ่มต้น
      - คอลแบ็กกำลังไปยัง gateway/บัญชีที่ผิด
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมายคอลแบ็กก่อนหน้า
      - Gateway เริ่มใหม่โดยไม่ได้เปิดใช้งาน slash commands อีกครั้ง
    - หาก slash commands แบบเนทีฟหยุดทำงาน ให้ตรวจสอบล็อกสำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และล็อกเตือนว่าคอลแบ็ก resolve เป็น `http://127.0.0.1:18789/...` URL นั้นน่าจะเข้าถึงได้เฉพาะเมื่อ Mattermost รันอยู่บน host/namespace เครือข่ายเดียวกับ OpenClaw ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มปรากฏเป็นกล่องสีขาว: เอเจนต์อาจกำลังส่งข้อมูลปุ่มที่มีรูปแบบผิด ตรวจสอบว่าแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
    - ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ในการตั้งค่าเซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
    - ปุ่มส่งคืน 404 เมื่อคลิก: `id` ของปุ่มอาจมีขีดกลางหรือขีดล่าง ตัวกำหนดเส้นทางการดำเนินการของ Mattermost เสียเมื่อเจอ ID ที่ไม่ใช่ตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
    - ล็อก Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณเซ็นฟิลด์ context ทั้งหมด (ไม่ใช่บางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกะทัดรัด (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - ล็อก Gateway แสดง `missing _token in context`: ฟิลด์ `_token` ไม่ได้อยู่ใน context ของปุ่ม ตรวจสอบให้แน่ใจว่ารวมฟิลด์นี้เมื่อสร้าง integration payload
    - การยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ตั้งค่าทั้งสองให้เป็นค่าที่ทำให้ปลอดภัยค่าเดียวกัน
    - เอเจนต์ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ลงในการตั้งค่าช่อง Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) - ช่องที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการ gating การ mention
- [การจับคู่](/th/channels/pairing) - การตรวจสอบสิทธิ์ DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
