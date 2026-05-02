---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทางของ Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T10:08:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้ (โทเค็นบอต + เหตุการณ์ WebSocket) รองรับช่องทาง กลุ่ม และ DM Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้; ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ [mattermost.com](https://mattermost.com)

## ติดตั้ง

ติดตั้ง Mattermost ก่อนกำหนดค่าช่องทาง:

<Tabs>
  <Tab title="รีจิสทรี npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="เช็กเอาต์ในเครื่อง">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า Plugin พร้อมใช้งาน">
    OpenClaw รุ่นแพ็กเกจปัจจุบันมี Plugin นี้รวมอยู่แล้ว การติดตั้งรุ่นเก่าหรือแบบกำหนดเองสามารถเพิ่มด้วยตนเองได้โดยใช้คำสั่งด้านบน
  </Step>
  <Step title="สร้างบอต Mattermost">
    สร้างบัญชีบอต Mattermost แล้วคัดลอก **โทเค็นบอต**
  </Step>
  <Step title="คัดลอก URL ฐาน">
    คัดลอก **URL ฐาน** ของ Mattermost (เช่น `https://chat.example.com`)
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

## คำสั่งสแลชแบบเนทีฟ

คำสั่งสแลชแบบเนทีฟเป็นแบบเลือกเปิดใช้ เมื่อเปิดใช้ OpenClaw จะลงทะเบียนคำสั่งสแลช `oc_*` ผ่าน Mattermost API และรับ POST callback บนเซิร์ฟเวอร์ HTTP ของ Gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // ใช้เมื่อ Mattermost เข้าถึง Gateway โดยตรงไม่ได้ (reverse proxy/URL สาธารณะ)
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรม">
    - `native: "auto"` มีค่าเริ่มต้นเป็นปิดใช้งานสำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้
    - หากละ `callbackUrl` ไว้ OpenClaw จะสร้างขึ้นจากโฮสต์/พอร์ตของ Gateway + `callbackPath`
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้งค่า `commands` ที่ระดับบนสุดหรือภายใต้ `channels.mattermost.accounts.<id>.commands` ได้ (ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด)
    - callback ของคำสั่งจะถูกตรวจสอบด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งกลับมาเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw รีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนยอมรับ callback แต่ละครั้ง เพื่อให้โทเค็นเก่าจากคำสั่งสแลชที่ถูกลบหรือสร้างใหม่หยุดได้รับการยอมรับโดยไม่ต้องรีสตาร์ท Gateway
    - การตรวจสอบ callback จะปิดกั้นทันทีหาก Mattermost API ยืนยันไม่ได้ว่าคำสั่งยังเป็นปัจจุบัน; การตรวจสอบที่ล้มเหลวจะถูกแคชชั่วครู่ การค้นหาพร้อมกันจะถูกรวมเข้าด้วยกัน และการเริ่มค้นหาใหม่จะถูกจำกัดอัตราต่อคำสั่งเพื่อลดแรงกดดันจากการเล่นซ้ำ
    - callback ของสแลชจะปิดกั้นทันทีเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นทำได้เพียงบางส่วน หรือโทเค็น callback ไม่ตรงกับโทเค็นที่ลงทะเบียนของคำสั่งที่ resolve ได้ (โทเค็นที่ใช้ได้กับคำสั่งหนึ่งไม่สามารถผ่านการตรวจสอบ upstream สำหรับอีกคำสั่งหนึ่งได้)

  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    endpoint ของ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะรันบนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw
    - อย่าตั้ง `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้นจะ reverse-proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
    - การตรวจสอบแบบเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; GET ควรส่งคืน `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="allowlist การออกเครือข่ายของ Mattermost">
    หาก callback ของคุณชี้ไปยังที่อยู่ส่วนตัว/tailnet/ภายใน ให้ตั้งค่า `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมนของ callback

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
ตัวแปรสภาพแวดล้อมใช้กับบัญชี **เริ่มต้น** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้งค่า `MATTERMOST_URL` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)
</Note>

## โหมดแชต

Mattermost ตอบกลับ DM โดยอัตโนมัติ พฤติกรรมของช่องทางควบคุมโดย `chatmode`:

<Tabs>
  <Tab title="oncall (ค่าเริ่มต้น)">
    ตอบกลับเฉพาะเมื่อถูก @mention ในช่องทาง
  </Tab>
  <Tab title="onmessage">
    ตอบกลับทุกข้อความในช่องทาง
  </Tab>
  <Tab title="onchar">
    ตอบกลับเมื่อข้อความขึ้นต้นด้วยคำนำหน้า trigger
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

- `onchar` ยังคงตอบกลับการ @mention โดยตรง
- `channels.mattermost.requireMention` ยังคงรองรับสำหรับการกำหนดค่าเดิม แต่แนะนำให้ใช้ `chatmode`

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับในช่องทางและกลุ่มจะอยู่ในช่องทางหลักหรือเริ่มเธรดใต้โพสต์ที่กระตุ้น

- `off` (ค่าเริ่มต้น): ตอบกลับในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดในช่องทาง/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันที่จำกัดขอบเขตตามเธรด
- `all`: พฤติกรรมเดียวกับ `first` สำหรับ Mattermost ในปัจจุบัน
- ข้อความส่วนตัวจะไม่สนใจค่านี้และยังคงไม่เป็นเธรด

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

- เซสชันที่จำกัดขอบเขตตามเธรดใช้ id ของโพสต์ที่กระตุ้นเป็นรากของเธรด
- `first` และ `all` ปัจจุบันเทียบเท่ากัน เพราะเมื่อ Mattermost มีรากเธรดแล้ว chunk ติดตามผลและสื่อจะดำเนินต่อในเธรดเดียวกันนั้น

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` รวมกับ `channels.mattermost.allowFrom=["*"]`

## ช่องทาง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ควบคุมด้วยการ mention)
- เพิ่มผู้ส่งใน allowlist ด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- การแทนที่การ mention รายช่องทางอยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- ช่องทางเปิด: `channels.mattermost.groupPolicy="open"` (ควบคุมด้วยการ mention)
- หมายเหตุ runtime: หาก `channels.mattermost` หายไปทั้งหมด runtime จะ fallback ไปที่ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

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

- `channel:<id>` สำหรับช่องทาง
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

<Warning>
ID ทึบที่ไม่มีคำนำหน้า (เช่น `64ifufp...`) มีความ **คลุมเครือ** ใน Mattermost (ID ผู้ใช้เทียบกับ ID ช่องทาง)

OpenClaw resolve โดยให้ **ผู้ใช้มาก่อน**:

- หาก ID มีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดย resolve ช่องทางโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกถือว่าเป็น **ID ช่องทาง**

หากคุณต้องการพฤติกรรมที่กำหนดแน่นอน ให้ใช้คำนำหน้าที่ชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองใหม่สำหรับช่องทาง DM

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้อง resolve ช่องทางโดยตรงก่อน ระบบจะลองใหม่เมื่อการสร้างช่องทางโดยตรงล้มเหลวชั่วคราวเป็นค่าเริ่มต้น

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนั้นโดยรวมสำหรับ Plugin Mattermost หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

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

- สิ่งนี้ใช้กับการสร้างช่องทาง DM (`/api/v4/channels/direct`) เท่านั้น ไม่ใช่ทุกการเรียก Mattermost API
- การลองใหม่ใช้กับความล้มเหลวชั่วคราว เช่น การจำกัดอัตรา การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาด client 4xx อื่นนอกจาก `429` จะถือว่าเป็นถาวรและจะไม่ลองใหม่

## การสตรีมตัวอย่าง

Mattermost สตรีมการคิด กิจกรรมเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **โพสต์ตัวอย่างแบบร่าง** เดียว ซึ่งจะ finalizes ในตำแหน่งเดิมเมื่อคำตอบสุดท้ายปลอดภัยพอที่จะส่ง ตัวอย่างจะอัปเดตบน id โพสต์เดียวกันแทนที่จะสแปมช่องทางด้วยข้อความราย chunk ผลลัพธ์สุดท้ายแบบสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่และใช้การส่งปกติแทนการ flush โพสต์ตัวอย่างที่ทิ้งได้

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
  <Accordion title="โหมดสตรีมมิง">
    - `partial` เป็นตัวเลือกปกติ: โพสต์ตัวอย่างหนึ่งโพสต์ที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น จากนั้น finalized ด้วยคำตอบที่สมบูรณ์
    - `block` ใช้ chunk แบบร่างสไตล์ append ภายในโพสต์ตัวอย่าง
    - `progress` แสดงตัวอย่างสถานะระหว่างสร้าง และโพสต์เฉพาะคำตอบสุดท้ายเมื่อเสร็จสมบูรณ์
    - `off` ปิดใช้งานการสตรีมตัวอย่าง

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรมสตรีมมิง">
    - หากสตรีมไม่สามารถ finalized ในตำแหน่งเดิมได้ (เช่น โพสต์ถูกลบกลางสตรีม) OpenClaw จะ fallback ไปส่งโพสต์สุดท้ายใหม่ เพื่อให้คำตอบไม่สูญหาย
    - payload ที่เป็น reasoning เท่านั้นจะถูกระงับไม่ให้โพสต์ลงช่องทาง รวมถึงข้อความที่มาถึงเป็น blockquote `> Reasoning:` ตั้งค่า `/reasoning on` เพื่อดูการคิดในพื้นผิวอื่น; โพสต์สุดท้ายของ Mattermost จะคงไว้เฉพาะคำตอบ
    - ดู [การสตรีม](/th/concepts/streaming#preview-streaming-modes) สำหรับเมทริกซ์การแมปช่องทาง

  </Accordion>
</AccordionGroup>

## Reaction (เครื่องมือข้อความ)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ id โพสต์ Mattermost
- `emoji` รับชื่อเช่น `thumbsup` หรือ `:+1:` (ใช้ colon หรือไม่ก็ได้)
- ตั้งค่า `remove=true` (boolean) เพื่อลบ reaction
- เหตุการณ์เพิ่ม/ลบ reaction จะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชัน agent ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการกระทำ reaction (ค่าเริ่มต้น true)
- การแทนที่รายบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม agent จะได้รับตัวเลือกและสามารถตอบกลับได้

เปิดใช้ปุ่มโดยเพิ่ม `inlineButtons` ไปยังความสามารถของช่องทาง:

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
  ป้ายกำกับที่แสดง
</ParamField>
<ParamField path="callback_data" type="string" required>
  ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น ID ของการดำเนินการ)
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  สไตล์ของปุ่ม
</ParamField>

เมื่อผู้ใช้คลิกปุ่ม:

<Steps>
  <Step title="ปุ่มถูกแทนที่ด้วยการยืนยัน">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ เลือก **Yes** โดย @user")
  </Step>
  <Step title="Agent ได้รับการเลือก">
    Agent ได้รับการเลือกเป็นข้อความขาเข้าและตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุการใช้งาน">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องกำหนดค่า)
    - Mattermost ตัดข้อมูลคอลแบ็กออกจากการตอบกลับ API (คุณสมบัติด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมดจะถูกลบเมื่อคลิก — ไม่สามารถลบเฉพาะบางส่วนได้
    - ID การดำเนินการที่มีขีดกลางหรือขีดล่างจะถูกทำให้ปลอดภัยโดยอัตโนมัติ (ข้อจำกัดการกำหนดเส้นทางของ Mattermost)

  </Accordion>
  <Accordion title="การกำหนดค่าและการเข้าถึง">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้คำอธิบายเครื่องมือปุ่มในพรอมป์ระบบของ agent
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกที่ไม่บังคับสำหรับคอลแบ็กของปุ่ม (ตัวอย่างเช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่ bind host โดยตรง
    - ในการตั้งค่าหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะสร้าง URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` จากนั้น fallback ไปที่ `http://localhost:<port>`
    - กฎการเข้าถึง: URL คอลแบ็กของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost `localhost` ใช้งานได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - หากเป้าหมายคอลแบ็กของคุณเป็นแบบส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนนั้นใน Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhook สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการส่งผ่านเครื่องมือ `message` ของ agent ใช้ `buildButtonAttachments()` จาก Plugin เมื่อเป็นไปได้ หากโพสต์ JSON ดิบ ให้ทำตามกฎเหล่านี้:

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
            id: "mybutton01", // alphanumeric only — see below
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

1. Attachments ต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกละเว้นอย่างเงียบ ๆ)
2. ทุกการดำเนินการต้องมี `type: "button"` — หากไม่มี คลิกจะถูกกลืนอย่างเงียบ ๆ
3. ทุกการดำเนินการต้องมีฟิลด์ `id` — Mattermost จะละเว้นการดำเนินการที่ไม่มี ID
4. `id` ของการดำเนินการต้องเป็น **ตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) ขีดกลางและขีดล่างทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost เสีย (คืนค่า 404) ให้ตัดออกก่อนใช้
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดงชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. ต้องมี `context.action_id` — ตัวจัดการ interaction จะคืนค่า 400 หากไม่มี

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="สร้าง secret จากโทเค็นบอต">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="สร้างออบเจ็กต์ context">
    สร้างออบเจ็กต์ context พร้อมฟิลด์ทั้งหมด **ยกเว้น** `_token`
  </Step>
  <Step title="ซีเรียลไลซ์ด้วยคีย์ที่เรียงลำดับแล้ว">
    ซีเรียลไลซ์ด้วย **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify` กับคีย์ที่เรียงลำดับแล้ว ซึ่งสร้างเอาต์พุตแบบกะทัดรัด)
  </Step>
  <Step title="ลงนามเพย์โหลด">
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
  <Accordion title="ข้อผิดพลาด HMAC ที่พบบ่อย">
    - `json.dumps` ของ Python เพิ่มช่องว่างตามค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตกะทัดรัดของ JavaScript (`{"key":"val"}`)
    - ลงนามฟิลด์ context **ทั้งหมด** เสมอ (ลบ `_token` ออก) Gateway จะตัด `_token` ออกแล้วลงนามทุกอย่างที่เหลืออยู่ การลงนามเฉพาะบางส่วนทำให้การตรวจสอบล้มเหลวอย่างเงียบ ๆ
    - ใช้ `sort_keys=True` — Gateway เรียงคีย์ก่อนลงนาม และ Mattermost อาจจัดลำดับฟิลด์ context ใหม่เมื่อจัดเก็บเพย์โหลด
    - สร้าง secret จากโทเค็นบอต (แบบกำหนดแน่นอน) ไม่ใช่ไบต์สุ่ม secret ต้องเหมือนกันระหว่างกระบวนการที่สร้างปุ่มและ Gateway ที่ตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Mattermost Plugin มีอะแดปเตอร์ไดเรกทอรีที่ resolve ชื่อช่องและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งเปิดใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` และการส่งมอบผ่าน cron/Webhook

ไม่ต้องกำหนดค่า — อะแดปเตอร์ใช้โทเค็นบอตจากการกำหนดค่าบัญชี

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
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบให้แน่ใจว่าบอตอยู่ในช่องและ mention บอต (oncall), ใช้ trigger prefix (onchar), หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาด auth หรือหลายบัญชี">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และดูว่าบัญชีเปิดใช้งานอยู่หรือไม่
    - ปัญหาหลายบัญชี: env vars ใช้กับบัญชี `default` เท่านั้น

  </Accordion>
  <Accordion title="คำสั่ง slash แบบ native ล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นคอลแบ็ก สาเหตุทั่วไป:
      - การลงทะเบียนคำสั่ง slash ล้มเหลวหรือเสร็จสิ้นเพียงบางส่วนตอนเริ่มต้น
      - คอลแบ็กกำลังชน Gateway/บัญชีที่ผิด
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมายคอลแบ็กก่อนหน้า
      - Gateway รีสตาร์ทโดยไม่ได้เปิดใช้งานคำสั่ง slash ใหม่
    - หากคำสั่ง slash แบบ native หยุดทำงาน ให้ตรวจสอบ log สำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และ log เตือนว่าคอลแบ็ก resolve เป็น `http://127.0.0.1:18789/...` URL นั้นน่าจะเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw ให้ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มปรากฏเป็นกล่องสีขาว: agent อาจกำลังส่งข้อมูลปุ่มที่ผิดรูปแบบ ตรวจสอบว่าแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
    - ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ในการกำหนดค่าเซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
    - ปุ่มคืนค่า 404 เมื่อคลิก: `id` ของปุ่มน่าจะมีขีดกลางหรือขีดล่าง ตัว router การดำเนินการของ Mattermost จะเสียเมื่อใช้ ID ที่ไม่ใช่ตัวอักษรและตัวเลข ใช้ `[a-zA-Z0-9]` เท่านั้น
    - Log ของ Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามฟิลด์ context ทั้งหมด (ไม่ใช่บางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกะทัดรัด (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - Log ของ Gateway แสดง `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ใน context ของปุ่ม ตรวจสอบว่าได้รวมไว้เมื่อสร้างเพย์โหลด integration
    - การยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ตั้งค่าทั้งสองให้เป็นค่าที่ sanitized เดียวกัน
    - Agent ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ในการกำหนดค่าช่อง Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) — ช่องทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการ gating การ mention
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
