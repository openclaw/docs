---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทางของ Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T09:37:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่มาพร้อมชุดติดตั้ง (โทเค็นบอต + เหตุการณ์ WebSocket) รองรับช่องทาง กลุ่ม และ DM Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้ ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ [mattermost.com](https://mattermost.com)

## Plugin ที่มาพร้อมชุดติดตั้ง

<Note>
Mattermost มาพร้อมเป็น Plugin แบบ bundled ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก
</Note>

หากคุณใช้ build เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Mattermost ให้ติดตั้งแพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

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

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว ให้ใช้ OpenClaw build
แบบแพ็กเกจปัจจุบัน หรือใช้พาธเช็กเอาต์ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm
ที่ใหม่กว่า

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า Plugin พร้อมใช้งาน">
    OpenClaw รุ่นที่แพ็กเกจในปัจจุบันมีรายการนี้มาพร้อมอยู่แล้ว การติดตั้งเก่า/แบบกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
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

## คำสั่ง slash แบบเนทีฟ

คำสั่ง slash แบบเนทีฟเป็นแบบเลือกเปิดใช้ เมื่อเปิดใช้ OpenClaw จะลงทะเบียนคำสั่ง slash `oc_*` ผ่าน Mattermost API และรับ callback POST บนเซิร์ฟเวอร์ HTTP ของ Gateway

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
  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรม">
    - `native: "auto"` มีค่าเริ่มต้นเป็นปิดใช้สำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้
    - หากละเว้น `callbackUrl` OpenClaw จะสร้างจากโฮสต์/พอร์ต Gateway + `callbackPath`
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้งค่า `commands` ได้ที่ระดับบนสุดหรือใต้ `channels.mattermost.accounts.<id>.commands` (ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด)
    - callback ของคำสั่งจะถูกตรวจสอบด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งคืนเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - callback ของ slash จะปิดแบบปลอดภัยเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นสำเร็จเพียงบางส่วน หรือโทเค็น callback ไม่ตรงกับคำสั่งที่ลงทะเบียนไว้

  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    endpoint callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้งค่า `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานบนโฮสต์/namespace เครือข่ายเดียวกับ OpenClaw
    - อย่าตั้งค่า `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ว่า URL นั้นจะ reverse-proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
    - วิธีตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; คำขอ GET ควรส่งคืน `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="allowlist สำหรับ egress ของ Mattermost">
    หาก callback ของคุณชี้ไปยังที่อยู่ private/tailnet/internal ให้ตั้งค่า `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมน callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม

    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าเหล่านี้บนโฮสต์ Gateway หากคุณต้องการใช้ตัวแปรสภาพแวดล้อม:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมใช้ได้เฉพาะกับบัญชี **เริ่มต้น** (`default`) บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้งค่า `MATTERMOST_URL` จาก workspace `.env` ได้ ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)
</Note>

## โหมดแชต

Mattermost ตอบกลับ DM โดยอัตโนมัติ พฤติกรรมของช่องทางควบคุมด้วย `chatmode`:

<Tabs>
  <Tab title="oncall (ค่าเริ่มต้น)">
    ตอบกลับเฉพาะเมื่อถูก @mention ในช่องทาง
  </Tab>
  <Tab title="onmessage">
    ตอบกลับทุกข้อความในช่องทาง
  </Tab>
  <Tab title="onchar">
    ตอบกลับเมื่อข้อความขึ้นต้นด้วย prefix ทริกเกอร์
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

- `onchar` ยังคงตอบกลับการ @mention ที่ระบุชัดเจน
- ยังคงรองรับ `channels.mattermost.requireMention` สำหรับการกำหนดค่าเดิม แต่แนะนำให้ใช้ `chatmode`

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับในช่องทางและกลุ่มจะอยู่ในช่องทางหลักหรือเริ่มเธรดใต้โพสต์ที่กระตุ้น

- `off` (ค่าเริ่มต้น): ตอบกลับในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ช่องทาง/กลุ่มระดับบนสุด ให้เริ่มเธรดใต้โพสต์นั้นและส่งเส้นทางการสนทนาไปยังเซสชันที่ผูกกับเธรด
- `all`: พฤติกรรมเดียวกับ `first` สำหรับ Mattermost ในปัจจุบัน
- ข้อความตรงจะไม่สนใจการตั้งค่านี้และยังคงไม่เป็นเธรด

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

- เซสชันที่ผูกกับเธรดใช้ id ของโพสต์ที่กระตุ้นเป็นรากของเธรด
- `first` และ `all` ปัจจุบันเทียบเท่ากัน เพราะเมื่อ Mattermost มีรากเธรดแล้ว ชิ้นส่วนติดตามผลและสื่อจะดำเนินต่อในเธรดเดียวกันนั้น

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` รวมกับ `channels.mattermost.allowFrom=["*"]`

## ช่องทาง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ต้อง mention)
- อนุญาตผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- การแทนที่การ mention รายช่องทางอยู่ใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- ช่องทางเปิด: `channels.mattermost.groupPolicy="open"` (ต้อง mention)
- หมายเหตุรันไทม์: หาก `channels.mattermost` หายไปทั้งหมด รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

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

ใช้รูปแบบเป้าหมายเหล่านี้กับ `openclaw message send` หรือ Cron/Webhook:

- `channel:<id>` สำหรับช่องทาง
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

<Warning>
ID ทึบแบบไม่มี prefix (เช่น `64ifufp...`) **กำกวม** ใน Mattermost (ID ผู้ใช้ เทียบกับ ID ช่องทาง)

OpenClaw resolve โดยให้ **ผู้ใช้มาก่อน**:

- หาก ID มีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดย resolve ช่องทางตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถือเป็น **ID ช่องทาง**

หากคุณต้องการพฤติกรรมที่กำหนดแน่นอน ให้ใช้ prefix ที่ระบุชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองซ้ำช่องทาง DM

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้อง resolve ช่องทางตรงก่อน ระบบจะลองซ้ำความล้มเหลวชั่วคราวในการสร้างช่องทางตรงโดยค่าเริ่มต้น

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนั้นแบบรวมสำหรับ Plugin Mattermost หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

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

- ใช้เฉพาะกับการสร้างช่องทาง DM (`/api/v4/channels/direct`) ไม่ใช่ทุกการเรียก Mattermost API
- การลองซ้ำใช้กับความล้มเหลวชั่วคราว เช่น rate limit, การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาดไคลเอนต์ 4xx อื่นนอกจาก `429` จะถือเป็นถาวรและจะไม่ลองซ้ำ

## การสตรีมตัวอย่าง

Mattermost สตรีมความคิด กิจกรรมเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **โพสต์ตัวอย่างฉบับร่าง** เดียว ซึ่งจะ finalize ในที่เดิมเมื่อคำตอบสุดท้ายปลอดภัยพอที่จะส่ง ตัวอย่างจะอัปเดตบน id โพสต์เดียวกันแทนการส่งข้อความรายชิ้นไปรบกวนช่องทาง ผลลัพธ์สุดท้ายแบบสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่และใช้การส่งปกติแทนการ flush โพสต์ตัวอย่างที่ทิ้งได้

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
    - `partial` เป็นตัวเลือกปกติ: โพสต์ตัวอย่างหนึ่งรายการที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น แล้ว finalize ด้วยคำตอบที่สมบูรณ์
    - `block` ใช้ชิ้นส่วนฉบับร่างแบบต่อท้ายภายในโพสต์ตัวอย่าง
    - `progress` แสดงตัวอย่างสถานะระหว่างสร้าง และโพสต์เฉพาะคำตอบสุดท้ายเมื่อเสร็จสิ้น
    - `off` ปิดการสตรีมตัวอย่าง

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรมการสตรีม">
    - หากสตรีมไม่สามารถ finalize ในที่เดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่งโพสต์สุดท้ายใหม่ เพื่อไม่ให้คำตอบสูญหาย
    - payload ที่มีเฉพาะเหตุผลจะถูกระงับจากโพสต์ในช่องทาง รวมถึงข้อความที่มาเป็น blockquote `> Reasoning:` ตั้งค่า `/reasoning on` เพื่อดูความคิดในพื้นผิวอื่น โพสต์สุดท้ายของ Mattermost จะเก็บเฉพาะคำตอบ
    - ดู [Streaming](/th/concepts/streaming#preview-streaming-modes) สำหรับเมทริกซ์การแมปช่องทาง

  </Accordion>
</AccordionGroup>

## ปฏิกิริยา (เครื่องมือข้อความ)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ id โพสต์ของ Mattermost
- `emoji` รับชื่ออย่าง `thumbsup` หรือ `:+1:` (เครื่องหมายโคลอนใส่หรือไม่ใส่ก็ได้)
- ตั้งค่า `remove=true` (บูลีน) เพื่อลบปฏิกิริยา
- เหตุการณ์เพิ่ม/ลบปฏิกิริยาจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชัน agent ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการดำเนินการปฏิกิริยา (ค่าเริ่มต้น true)
- การแทนที่รายบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มแบบโต้ตอบ (เครื่องมือข้อความ)

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
  ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น ID การดำเนินการ)
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  สไตล์ปุ่ม
</ParamField>

เมื่อผู้ใช้คลิกปุ่ม:

<Steps>
  <Step title="ปุ่มถูกแทนที่ด้วยการยืนยัน">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ เลือก **ใช่** โดย @user")
  </Step>
  <Step title="เอเจนต์ได้รับการเลือก">
    เอเจนต์ได้รับการเลือกเป็นข้อความขาเข้าและตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุการใช้งาน">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องตั้งค่า)
    - Mattermost ตัดข้อมูลคอลแบ็กออกจากคำตอบ API ของตัวเอง (คุณสมบัติด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมดจะถูกนำออกเมื่อคลิก — ไม่สามารถนำออกบางส่วนได้
    - ID การดำเนินการที่มีขีดกลางหรือขีดล่างจะถูกทำให้ปลอดภัยโดยอัตโนมัติ (ข้อจำกัดการกำหนดเส้นทางของ Mattermost)

  </Accordion>
  <Accordion title="การตั้งค่าและการเข้าถึง">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้คำอธิบายเครื่องมือปุ่มในพรอมป์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกที่ไม่บังคับสำหรับคอลแบ็กของปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่โฮสต์ผูกของมันได้โดยตรง
    - ในการตั้งค่าหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะสร้าง URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` แล้วสำรองไปที่ `http://localhost:<port>`
    - กฎการเข้าถึง: URL คอลแบ็กของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - หากเป้าหมายคอลแบ็กของคุณเป็นส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนของเป้าหมายนั้นใน Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`

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

1. ไฟล์แนบต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกละเว้นโดยไม่แจ้ง)
2. ทุกการดำเนินการต้องมี `type: "button"` — หากไม่มี คลิกจะถูกกลืนไปโดยไม่แจ้ง
3. ทุกการดำเนินการต้องมีฟิลด์ `id` — Mattermost จะละเว้นการดำเนินการที่ไม่มี ID
4. `id` ของการดำเนินการต้องเป็น **ตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) ขีดกลางและขีดล่างทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost เสีย (ส่งกลับ 404) ให้ตัดออกก่อนใช้
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดงชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. ต้องมี `context.action_id` — ตัวจัดการการโต้ตอบจะส่งกลับ 400 หากไม่มี

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="สร้างความลับจากโทเค็นบอต">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="สร้างออบเจ็กต์บริบท">
    สร้างออบเจ็กต์บริบทพร้อมทุกฟิลด์ **ยกเว้น** `_token`
  </Step>
  <Step title="ซีเรียลไลซ์ด้วยคีย์ที่เรียงลำดับแล้ว">
    ซีเรียลไลซ์ด้วย **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify` กับคีย์ที่เรียงลำดับแล้ว ซึ่งให้เอาต์พุตแบบกระชับ)
  </Step>
  <Step title="ลงนามเพย์โหลด">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="เพิ่มโทเค็น">
    เพิ่มไดเจสต์ฐานสิบหกที่ได้เป็น `_token` ในบริบท
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
    - `json.dumps` ของ Python เพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตแบบกระชับของ JavaScript (`{"key":"val"}`)
    - ลงนามฟิลด์บริบท **ทั้งหมด** เสมอ (ลบ `_token` ออก) Gateway จะตัด `_token` ออกแล้วลงนามทุกอย่างที่เหลือ การลงนามเพียงบางส่วนทำให้การตรวจสอบล้มเหลวโดยไม่แจ้ง
    - ใช้ `sort_keys=True` — Gateway จะเรียงคีย์ก่อนลงนาม และ Mattermost อาจเรียงฟิลด์บริบทใหม่เมื่อจัดเก็บเพย์โหลด
    - สร้างความลับจากโทเค็นบอต (กำหนดได้ซ้ำเดิม) ไม่ใช่ไบต์สุ่ม ความลับต้องเหมือนกันระหว่างกระบวนการที่สร้างปุ่มและ Gateway ที่ตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin Mattermost มีอะแดปเตอร์ไดเรกทอรีที่แปลงชื่อช่องและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งเปิดใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` และการส่ง cron/Webhook

ไม่ต้องตั้งค่า — อะแดปเตอร์ใช้โทเค็นบอตจากการตั้งค่าบัญชี

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
    ตรวจสอบให้แน่ใจว่าบอตอยู่ในช่องและกล่าวถึงบอต (oncall), ใช้คำนำหน้าทริกเกอร์ (onchar), หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาดการยืนยันตัวตนหรือหลายบัญชี">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และดูว่าบัญชีเปิดใช้งานอยู่หรือไม่
    - ปัญหาหลายบัญชี: ตัวแปรสภาพแวดล้อมใช้กับบัญชี `default` เท่านั้น

  </Accordion>
  <Accordion title="คำสั่ง slash แบบเนทีฟล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นคอลแบ็ก สาเหตุทั่วไป:
      - การลงทะเบียนคำสั่ง slash ล้มเหลวหรือเสร็จเพียงบางส่วนตอนเริ่มต้น
      - คอลแบ็กกำลังไปยัง Gateway/บัญชีที่ผิด
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมายคอลแบ็กก่อนหน้า
      - Gateway รีสตาร์ทโดยไม่ได้เปิดใช้งานคำสั่ง slash อีกครั้ง
    - หากคำสั่ง slash แบบเนทีฟหยุดทำงาน ให้ตรวจสอบล็อกหา `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และล็อกเตือนว่าคอลแบ็กถูกแก้เป็น `http://127.0.0.1:18789/...` URL นั้นอาจเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มปรากฏเป็นกล่องสีขาว: เอเจนต์อาจส่งข้อมูลปุ่มผิดรูปแบบ ตรวจสอบว่าปุ่มแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
    - ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ในการตั้งค่าเซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
    - ปุ่มส่งกลับ 404 เมื่อคลิก: `id` ของปุ่มน่าจะมีขีดกลางหรือขีดล่าง เราเตอร์การดำเนินการของ Mattermost เสียเมื่อใช้ ID ที่ไม่ใช่ตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
    - ล็อก Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามทุกฟิลด์บริบท (ไม่ใช่บางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกระชับ (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - ล็อก Gateway แสดง `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ในบริบทของปุ่ม ตรวจสอบให้แน่ใจว่ารวมฟิลด์นี้เมื่อสร้างเพย์โหลดการผสานรวม
    - การยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ตั้งค่าทั้งคู่ให้เป็นค่าที่ทำให้ปลอดภัยเดียวกัน
    - เอเจนต์ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ในการตั้งค่าช่อง Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) — ช่องที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและเกตการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
