---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทาง Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้ (โทเคนบอท + เหตุการณ์ WebSocket) รองรับช่อง กลุ่ม และ DM Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้ ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ [mattermost.com](https://mattermost.com)

## ติดตั้ง

ติดตั้ง Mattermost ก่อนกำหนดค่าช่อง:

<Tabs>
  <Tab title="เรจิสทรี npm">
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

รายละเอียด: [Plugins](/th/tools/plugin)

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า Plugin พร้อมใช้งาน">
    ติดตั้ง `@openclaw/mattermost` ด้วยคำสั่งด้านบน จากนั้นรีสตาร์ท Gateway หาก Gateway กำลังทำงานอยู่แล้ว
  </Step>
  <Step title="สร้างบอท Mattermost">
    สร้างบัญชีบอท Mattermost และคัดลอก **โทเคนบอท**
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
  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรม">
    - `native: "auto"` มีค่าเริ่มต้นเป็นปิดใช้งานสำหรับ Mattermost ตั้งค่า `native: true` เพื่อเปิดใช้
    - หากละ `callbackUrl` ไว้ OpenClaw จะสร้างค่าจากโฮสต์/พอร์ตของ Gateway + `callbackPath`
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้งค่า `commands` ได้ที่ระดับบนสุดหรือใต้ `channels.mattermost.accounts.<id>.commands` (ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด)
    - callback ของคำสั่งจะถูกตรวจสอบด้วยโทเคนรายคำสั่งที่ Mattermost ส่งคืนเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw รีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนยอมรับแต่ละ callback เพื่อให้โทเคนค้างจากคำสั่งสแลชที่ถูกลบหรือสร้างใหม่หยุดถูกยอมรับโดยไม่ต้องรีสตาร์ท Gateway
    - การตรวจสอบ callback จะล้มเหลวแบบปิดหาก Mattermost API ไม่สามารถยืนยันได้ว่าคำสั่งยังเป็นคำสั่งปัจจุบัน การตรวจสอบที่ล้มเหลวจะถูกแคชไว้สั้นๆ การค้นหาพร้อมกันจะถูกรวม และการเริ่มค้นหาใหม่จะถูกจำกัดอัตราต่อคำสั่งเพื่อจำกัดแรงกดดันจากการเล่นซ้ำ
    - callback สแลชจะล้มเหลวแบบปิดเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นทำได้บางส่วน หรือโทเคน callback ไม่ตรงกับโทเคนที่ลงทะเบียนไว้ของคำสั่งที่แก้ค่าได้ (โทเคนที่ใช้ได้กับคำสั่งหนึ่งจะไม่สามารถไปถึงการตรวจสอบ upstream สำหรับคำสั่งอื่นได้)

  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    endpoint ของ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้งค่า `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานบนโฮสต์/namespace เครือข่ายเดียวกับ OpenClaw
    - อย่าตั้งค่า `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้น reverse-proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
    - การตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; GET ควรส่งคืน `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="allowlist ขาออกของ Mattermost">
    หาก callback ของคุณชี้ไปยังที่อยู่ส่วนตัว/tailnet/ภายใน ให้ตั้งค่า `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมน callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL เต็ม

    - ถูก: `gateway.tailnet-name.ts.net`
    - ผิด: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าเหล่านี้บนโฮสต์ Gateway หากคุณต้องการใช้ตัวแปรสภาพแวดล้อม:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมใช้กับบัญชี **เริ่มต้น** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้งค่า `MATTERMOST_URL` จาก `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)
</Note>

## โหมดแชต

Mattermost ตอบกลับ DM โดยอัตโนมัติ พฤติกรรมของช่องถูกควบคุมโดย `chatmode`:

<Tabs>
  <Tab title="oncall (ค่าเริ่มต้น)">
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

- `onchar` ยังคงตอบกลับ @mentions แบบชัดเจน
- `channels.mattermost.requireMention` ยังคงถูกใช้สำหรับการกำหนดค่า legacy แต่แนะนำให้ใช้ `chatmode`
- หลังจากบอทส่งคำตอบที่มองเห็นได้ในเธรดของช่อง ข้อความถัดมาในเธรดเดียวกันจะได้รับคำตอบโดยไม่ต้องมี @mention ใหม่หรือคำนำหน้า `onchar` ทำให้บทสนทนาแบบหลายรอบในเธรดไหลต่อเนื่อง การเข้าร่วมจะถูกจดจำเป็นเวลา 7 วันของการไม่มีความเคลื่อนไหวในเธรด (รีเฟรชเมื่อมีการตอบกลับแต่ละครั้ง) และคงอยู่ข้ามการรีสตาร์ท Gateway เธรดที่บอทเพียงแค่สังเกตจะไม่ได้รับผลกระทบ ให้เริ่มข้อความระดับบนสุดใหม่เพื่อบังคับให้ต้องมีการกล่าวถึงแบบชัดเจนอีกครั้ง

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าคำตอบในช่องและกลุ่มจะอยู่ในช่องหลักหรือเริ่มเธรดใต้โพสต์ที่กระตุ้น

- `off` (ค่าเริ่มต้น): ตอบกลับในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดของช่อง/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและส่งบทสนทนาไปยังเซสชันที่มีขอบเขตตามเธรด
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

- เซสชันที่มีขอบเขตตามเธรดใช้รหัสโพสต์ที่กระตุ้นเป็นรากของเธรด
- `first` และ `all` ปัจจุบันเทียบเท่ากัน เพราะเมื่อ Mattermost มีรากของเธรดแล้ว ชิ้นส่วนติดตามผลและสื่อจะดำเนินต่อในเธรดเดียวกันนั้น

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` บวก `channels.mattermost.allowFrom=["*"]`
- `channels.mattermost.allowFrom` รับรายการ `accessGroup:<name>` ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## ช่อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ถูกจำกัดด้วยการกล่าวถึง)
- อนุญาตผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- `channels.mattermost.groupAllowFrom` รับรายการ `accessGroup:<name>` ดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- การแทนที่การกล่าวถึงรายช่องอยู่ใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- ช่องเปิด: `channels.mattermost.groupPolicy="open"` (ถูกจำกัดด้วยการกล่าวถึง)
- หมายเหตุ runtime: หาก `channels.mattermost` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ตั้งค่า `channels.defaults.groupPolicy` ไว้)

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
- `@username` สำหรับ DM (แก้ค่าผ่าน Mattermost API)

<Warning>
ID ทึบแบบไม่ใส่คำนำหน้า (เช่น `64ifufp...`) **กำกวม** ใน Mattermost (ID ผู้ใช้เทียบกับ ID ช่อง)

OpenClaw แก้ค่าโดยให้ **ผู้ใช้มาก่อน**:

- หาก ID มีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดยแก้ค่าช่องโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกถือว่าเป็น **ID ช่อง**

หากคุณต้องการพฤติกรรมที่กำหนดแน่นอน ให้ใช้คำนำหน้าแบบชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองซ้ำช่อง DM

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้องแก้ค่าช่องโดยตรงก่อน จะลองซ้ำความล้มเหลวชั่วคราวในการสร้างช่องโดยตรงเป็นค่าเริ่มต้น

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนั้นโดยรวมสำหรับ Plugin Mattermost หรือ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีหนึ่งบัญชี

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

- ใช้เฉพาะกับการสร้างช่อง DM (`/api/v4/channels/direct`) ไม่ใช่ทุกการเรียก Mattermost API
- การลองซ้ำใช้กับความล้มเหลวชั่วคราว เช่น การจำกัดอัตรา การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาดไคลเอนต์ 4xx อื่นนอกจาก `429` จะถูกถือว่าเป็นถาวรและจะไม่ลองซ้ำ

## การสตรีมตัวอย่าง

Mattermost สตรีมการคิด กิจกรรมเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **โพสต์ตัวอย่างฉบับร่าง** เดียวที่สรุปในที่เดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง ตัวอย่างจะอัปเดตบน ID โพสต์เดียวกัน แทนที่จะส่งข้อความแยกตามแต่ละชิ้นจนรกช่อง ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่และใช้การส่งตามปกติแทนการ flush โพสต์ตัวอย่างชั่วคราว

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
    - `partial` เป็นตัวเลือกปกติ: โพสต์ตัวอย่างหนึ่งรายการที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น จากนั้นสรุปด้วยคำตอบที่สมบูรณ์
    - `block` ใช้ชิ้นส่วนฉบับร่างแบบต่อท้ายภายในโพสต์ตัวอย่าง
    - `progress` แสดงตัวอย่างสถานะระหว่างสร้าง และโพสต์เฉพาะคำตอบสุดท้ายเมื่อเสร็จสิ้น
    - `off` ปิดการสตรีมตัวอย่าง

  </Accordion>
  <Accordion title="หมายเหตุพฤติกรรมการสตรีม">
    - หากไม่สามารถสรุปสตรีมในที่เดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่งโพสต์สุดท้ายใหม่ เพื่อไม่ให้คำตอบสูญหาย
    - payload ที่มีเฉพาะการคิดจะถูกระงับจากโพสต์ในช่อง รวมถึงข้อความที่มาถึงในรูปแบบ blockquote `> Thinking` ตั้งค่า `/reasoning on` เพื่อดูการคิดบนพื้นผิวอื่น โพสต์สุดท้ายของ Mattermost จะเก็บเฉพาะคำตอบ
    - ดู [การสตรีม](/th/concepts/streaming#preview-streaming-modes) สำหรับเมทริกซ์การแมปช่อง

  </Accordion>
</AccordionGroup>

## รีแอ็กชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ ID โพสต์ Mattermost
- `emoji` รับชื่อเช่น `thumbsup` หรือ `:+1:` (เครื่องหมายโคลอนเป็นทางเลือก)
- ตั้งค่า `remove=true` (boolean) เพื่อลบรีแอ็กชัน
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชันเอเจนต์ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการกระทำรีแอ็กชัน (ค่าเริ่มต้น true)
- การแทนที่รายบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม เอเจนต์จะได้รับการเลือกและสามารถตอบกลับได้

การตอบกลับปกติของเอเจนต์ยังสามารถมีเพย์โหลด `presentation` เชิงความหมายได้ด้วย OpenClaw แสดงปุ่มค่าเป็นปุ่มโต้ตอบของ Mattermost คงปุ่ม URL ให้มองเห็นได้ในข้อความ และลดระดับเมนูเลือกให้เป็นข้อความที่อ่านได้

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
  <Step title="Buttons replaced with confirmation">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **Yes** selected by @user")
  </Step>
  <Step title="Agent receives the selection">
    เอเจนต์ได้รับการเลือกเป็นข้อความขาเข้าและตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องมีการตั้งค่า)
    - Mattermost ตัดข้อมูลคอลแบ็กออกจากการตอบกลับ API ของตน (ฟีเจอร์ด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมดจะถูกลบเมื่อคลิก - ไม่สามารถลบบางส่วนได้
    - ID ของการดำเนินการที่มีขีดกลางหรือขีดล่างจะถูกทำให้ปลอดภัยโดยอัตโนมัติ (ข้อจำกัดการกำหนดเส้นทางของ Mattermost)

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้คำอธิบายเครื่องมือปุ่มในพรอมป์ต์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกแบบไม่บังคับสำหรับคอลแบ็กของปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่โฮสต์ bind ได้โดยตรง
    - ในการตั้งค่าหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` ได้
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะได้ URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` แล้วจึงถอยกลับไปใช้ `http://localhost:<port>`
    - กฎการเข้าถึง: URL คอลแบ็กของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - หากเป้าหมายคอลแบ็กของคุณเป็นส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนของเป้าหมายนั้นไปยัง `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhook สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก Plugin เมื่อทำได้ หากโพสต์ JSON ดิบ ให้ทำตามกฎเหล่านี้:

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

1. ไฟล์แนบต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกละเว้นอย่างเงียบ ๆ)
2. ทุกการดำเนินการต้องมี `type: "button"` - หากไม่มี คลิกจะถูกกลืนไปอย่างเงียบ ๆ
3. ทุกการดำเนินการต้องมีฟิลด์ `id` - Mattermost จะละเว้นการดำเนินการที่ไม่มี ID
4. `id` ของการดำเนินการต้องเป็น **ตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) ขีดกลางและขีดล่างทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost เสีย (ส่งกลับ 404) ให้ตัดออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดงชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. ต้องมี `context.action_id` - ตัวจัดการการโต้ตอบจะส่งกลับ 400 หากไม่มี

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    สร้างออบเจ็กต์ context พร้อมฟิลด์ทั้งหมด **ยกเว้น** `_token`
  </Step>
  <Step title="Serialize with sorted keys">
    ซีเรียลไลซ์โดยใช้ **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify` พร้อมคีย์ที่เรียงลำดับแล้ว ซึ่งให้เอาต์พุตแบบกะทัดรัด)
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
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
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` ของ Python เพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตแบบกะทัดรัดของ JavaScript (`{"key":"val"}`)
    - ลงนามฟิลด์ context **ทั้งหมด** เสมอ (ลบ `_token` ออก) Gateway จะตัด `_token` ออกแล้วลงนามทุกอย่างที่เหลือ การลงนามเฉพาะบางส่วนทำให้การตรวจสอบล้มเหลวอย่างเงียบ ๆ
    - ใช้ `sort_keys=True` - Gateway จะเรียงลำดับคีย์ก่อนลงนาม และ Mattermost อาจเรียงลำดับฟิลด์ context ใหม่เมื่อจัดเก็บเพย์โหลด
    - สร้าง secret จากโทเค็นบอต (แบบกำหนดแน่นอน) ไม่ใช่ไบต์สุ่ม secret ต้องเหมือนกันระหว่างกระบวนการที่สร้างปุ่มและ Gateway ที่ตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin ของ Mattermost มีอะแดปเตอร์ไดเรกทอรีที่แก้ชื่อช่องทางและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งทำให้ใช้เป้าหมาย `#channel-name` และ `@username` ได้ใน `openclaw message send` และการส่งผ่าน Cron/Webhook

ไม่จำเป็นต้องตั้งค่า - อะแดปเตอร์ใช้โทเค็นบอตจากการตั้งค่าบัญชี

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
    ตรวจสอบว่าบอตอยู่ในช่องทางและกล่าวถึงบอต (oncall), ใช้คำนำหน้าทริกเกอร์ (onchar), หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และดูว่าบัญชีเปิดใช้งานอยู่หรือไม่
    - ปัญหาหลายบัญชี: ตัวแปร env ใช้ได้กับบัญชี `default` เท่านั้น

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นคอลแบ็ก สาเหตุทั่วไป:
      - การลงทะเบียนคำสั่ง slash ล้มเหลวหรือเสร็จเพียงบางส่วนตอนเริ่มต้น
      - คอลแบ็กกำลังไปยัง Gateway/บัญชีที่ไม่ถูกต้อง
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมายคอลแบ็กก่อนหน้า
      - Gateway รีสตาร์ตโดยไม่ได้เปิดใช้งานคำสั่ง slash อีกครั้ง
    - หากคำสั่ง slash แบบเนทีฟหยุดทำงาน ให้ตรวจสอบบันทึกสำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และบันทึกเตือนว่าคอลแบ็กแก้เป็น `http://127.0.0.1:18789/...` URL นั้นอาจเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกันกับ OpenClaw ให้ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="Buttons issues">
    - ปุ่มปรากฏเป็นกล่องสีขาว: เอเจนต์อาจกำลังส่งข้อมูลปุ่มที่ผิดรูปแบบ ตรวจสอบว่าปุ่มแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
    - ปุ่มแสดงผลแต่คลิกแล้วไม่มีอะไรเกิดขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ในการตั้งค่าเซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
    - ปุ่มส่งกลับ 404 เมื่อคลิก: `id` ของปุ่มอาจมีขีดกลางหรือขีดล่าง เราเตอร์การดำเนินการของ Mattermost เสียเมื่อ ID ไม่ใช่ตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
    - บันทึก Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามฟิลด์ context ทั้งหมด (ไม่ใช่บางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกะทัดรัด (ไม่มีช่องว่าง) ดูส่วน HMAC ข้างต้น
    - บันทึก Gateway แสดง `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ใน context ของปุ่ม ตรวจสอบว่าได้รวมฟิลด์นี้ไว้เมื่อสร้างเพย์โหลดการผสานรวม
    - การยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ตั้งค่าทั้งสองเป็นค่าที่ทำให้ปลอดภัยเดียวกัน
    - เอเจนต์ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ไปยังการตั้งค่าช่องทาง Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชทกลุ่มและการควบคุมการกล่าวถึง
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
