---
read_when:
    - การตั้งค่า Mattermost
    - การแก้ไขข้อบกพร่องการกำหนดเส้นทางของ Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-19T07:11:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea41fb9a7e4e9ea6bd8d04a4f2c6d2d7f2e43cf71830e445f1e28e2e8737f3cb
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้ (โทเค็นบอต + เหตุการณ์ WebSocket) รองรับช่อง ช่องส่วนตัว DM แบบกลุ่ม และ DM Mattermost เป็นแพลตฟอร์มรับส่งข้อความสำหรับทีมที่โฮสต์เองได้ ([mattermost.com](https://mattermost.com))

## การติดตั้ง

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
    ติดตั้ง `@openclaw/mattermost` ด้วยคำสั่งข้างต้น จากนั้นรีสตาร์ต Gateway หากกำลังทำงานอยู่
  </Step>
  <Step title="สร้างบอต Mattermost">
    สร้างบัญชีบอต Mattermost คัดลอก **โทเค็นบอต** และเพิ่มบอตไปยังทีมและช่องที่ต้องการให้บอตอ่าน
  </Step>
  <Step title="คัดลอก URL ฐาน">
    คัดลอก **URL ฐาน** ของ Mattermost (เช่น `https://chat.example.com`) ระบบจะตัด `/api/v4` ที่อยู่ท้ายออกโดยอัตโนมัติ
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

    ทางเลือกแบบไม่โต้ตอบ:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
สำหรับ Mattermost ที่โฮสต์เองบนที่อยู่ส่วนตัว/LAN/tailnet: คำขอขาออกไปยัง API ของ Mattermost จะผ่านตัวป้องกัน SSRF ซึ่งบล็อก IP ส่วนตัวและภายในโดยค่าเริ่มต้น เลือกอนุญาตด้วย `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (ต่อบัญชี: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`)
</Note>

## คำสั่งสแลชแบบเนทีฟ

คำสั่งสแลชแบบเนทีฟเป็นฟีเจอร์ที่ต้องเลือกเปิดใช้ เมื่อเปิดใช้ OpenClaw จะลงทะเบียนคำสั่งสแลช `oc_*` ในทุกทีมที่บอตเป็นสมาชิก และรับ callback แบบ POST บนเซิร์ฟเวอร์ HTTP ของ Gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // ใช้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ได้โดยตรง (พร็อกซีย้อนกลับ/URL สาธารณะ)
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

คำสั่งที่ลงทะเบียน: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue` เมื่อใช้ `nativeSkills: true` คำสั่งของ Skills จะได้รับการลงทะเบียนเป็น `/oc_<skill>` ด้วย

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับลักษณะการทำงาน">
    - `native` และ `nativeSkills` มีค่าเริ่มต้นเป็น `"auto"` ซึ่งสำหรับ Mattermost จะถูกตีความว่าปิดใช้งาน ให้ตั้งค่าเป็น `true` อย่างชัดเจน
    - `callbackPath` มีค่าเริ่มต้นเป็น `/api/channels/mattermost/command`
    - หากไม่ได้ระบุ `callbackUrl` OpenClaw จะอนุมาน `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` โฮสต์สำหรับผูกแบบไวลด์การ์ด (`0.0.0.0`, `::`) จะใช้ `localhost` แทน
    - สำหรับการตั้งค่าแบบหลายบัญชี สามารถตั้ง `commands` ที่ระดับบนสุดหรือภายใต้ `channels.mattermost.accounts.<id>.commands` ได้ (ค่าของบัญชีมีลำดับความสำคัญเหนือฟิลด์ระดับบนสุด)
    - คำสั่งสแลชที่มีทริกเกอร์เดียวกันและสร้างโดยการผสานรวมอื่นจะไม่ถูกแก้ไข (ระบบจะข้ามคำสั่งเหล่านั้นระหว่างการลงทะเบียน) ส่วนคำสั่งที่บอตสร้างจะได้รับการอัปเดตหรือสร้างใหม่เมื่อ URL ของ callback เปลี่ยนไป
    - callback ของคำสั่งจะได้รับการตรวจสอบด้วยโทเค็นประจำคำสั่งที่ Mattermost ส่งคืนเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw จะรีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนยอมรับ callback แต่ละครั้ง ดังนั้นโทเค็นเก่าจากคำสั่งสแลชที่ถูกลบหรือสร้างใหม่จะหยุดได้รับการยอมรับโดยไม่ต้องรีสตาร์ต Gateway
    - การตรวจสอบ callback จะปฏิเสธโดยค่าเริ่มต้นหาก API ของ Mattermost ไม่สามารถยืนยันได้ว่าคำสั่งยังเป็นปัจจุบัน ระบบจะแคชผลการตรวจสอบที่ล้มเหลวไว้ชั่วครู่ รวมการค้นหาที่เกิดพร้อมกัน และจำกัดอัตราการเริ่มค้นหาใหม่แยกตามคำสั่งเพื่อจำกัดแรงกดดันจากการเล่นซ้ำ
    - callback ของคำสั่งสแลชจะปฏิเสธโดยค่าเริ่มต้นเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นระบบเสร็จเพียงบางส่วน หรือโทเค็น callback ไม่ตรงกับโทเค็นที่ลงทะเบียนของคำสั่งที่หาได้ (โทเค็นที่ใช้ได้กับคำสั่งหนึ่งจะไม่สามารถผ่านไปถึงการตรวจสอบต้นทางสำหรับคำสั่งอื่น)
    - callback ที่ได้รับการยอมรับจะได้รับการตอบรับด้วยข้อความชั่วคราว "กำลังประมวลผล..." โดยคำตอบจริงจะมาถึงเป็นข้อความปกติ

  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    ปลายทาง callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw
    - อย่าตั้ง `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้นจะทำพร็อกซีย้อนกลับ `/api/channels/mattermost/command` ไปยัง OpenClaw
    - ตรวจสอบอย่างรวดเร็วได้ด้วย `curl https://<gateway-host>/api/channels/mattermost/command` โดยคำขอ GET ควรได้รับ `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="รายการอนุญาตขาออกของ Mattermost">
    หาก callback มีเป้าหมายเป็นที่อยู่ส่วนตัว/tailnet/ภายใน ให้ตั้งค่า `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมนของ callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม

    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

หากต้องการใช้ตัวแปรสภาพแวดล้อม ให้ตั้งค่าเหล่านี้บนโฮสต์ของ Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมใช้กับบัญชี **เริ่มต้น** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้ง `MATTERMOST_URL` จาก `.env` ของเวิร์กสเปซได้ โปรดดู [ไฟล์ .env ของเวิร์กสเปซ](/th/gateway/security)
</Note>

## โหมดแชต

Mattermost ตอบกลับ DM โดยอัตโนมัติ ลักษณะการทำงานในช่องควบคุมด้วย `chatmode`:

<Tabs>
  <Tab title="oncall (ค่าเริ่มต้น)">
    ตอบกลับเฉพาะเมื่อถูก @กล่าวถึงในช่อง
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
      oncharPrefixes: [">", "!"], // ค่าเริ่มต้น
    },
  },
}
```

หมายเหตุ:

- `onchar` ยังคงตอบกลับการ @กล่าวถึงอย่างชัดเจน
- ยังคงรองรับ `channels.mattermost.requireMention` แต่แนะนำให้ใช้ `chatmode` การตั้งค่า `groups.<channelId>.requireMention` ต่อช่องมีลำดับความสำคัญเหนือทั้งสองค่า
- หลังจากบอตส่งข้อความตอบกลับที่มองเห็นได้ในเธรดของช่อง ข้อความถัดไปในเธรดเดียวกันจะได้รับการตอบกลับโดยไม่ต้อง @กล่าวถึงใหม่หรือใช้คำนำหน้า `onchar` เพื่อให้การสนทนาแบบหลายรอบในเธรดดำเนินต่อไป ระบบจะจดจำการเข้าร่วมเป็นเวลา 7 วันนับจากครั้งล่าสุดที่บอตตอบกลับในเธรดนั้น และข้อมูลนี้จะคงอยู่แม้รีสตาร์ต Gateway เธรดที่บอตเพียงสังเกตการณ์จะไม่ได้รับผลกระทบ ให้เริ่มข้อความระดับบนสุดใหม่เมื่อต้องการบังคับให้กล่าวถึงอย่างชัดเจนอีกครั้ง
- ตั้ง `channels.mattermost.implicitMentions.threadParticipation: false` เพื่อไม่ให้ข้อความติดตามผลในเธรดที่บอตเข้าร่วมข้ามข้อกำหนดการกล่าวถึง ค่าที่กำหนดเฉพาะบัญชีใช้ `channels.mattermost.accounts.<id>.implicitMentions` ปัจจุบัน Mattermost ไม่สร้างข้อเท็จจริง `replyToBot` หรือ `quotedBot` ดังนั้นแฟล็กเหล่านั้นจึงไม่มีผลในที่นี้

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าคำตอบในช่องและกลุ่มจะอยู่ในช่องหลักหรือเริ่มเธรดใต้โพสต์ที่เป็นทริกเกอร์

- `off` (ค่าเริ่มต้น): ตอบกลับในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดในช่อง/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันที่มีขอบเขตระดับเธรด
- `all` และ `batched`: ปัจจุบันมีลักษณะการทำงานเหมือน `first` สำหรับ Mattermost เนื่องจากเมื่อ Mattermost มีรากของเธรดแล้ว ส่วนข้อความและสื่อที่ตามมาจะดำเนินต่อในเธรดเดียวกันนั้น
- ข้อความโดยตรงมีค่าเริ่มต้นเป็น `off` แม้จะตั้งค่า `replyToMode` ไว้

ใช้ `channels.mattermost.replyToModeByChatType` เพื่อแทนที่โหมดสำหรับแชต `direct`, `group` หรือ `channel` ตั้ง `direct` เพื่อเลือกเปิดใช้เธรดสำหรับข้อความโดยตรง:

- `off` (ค่าเริ่มต้น): ข้อความโดยตรงจะไม่มีเธรดและอยู่ในเซสชันต่อเนื่องเดียว
- `first`, `all` หรือ `batched`: ข้อความโดยตรงระดับบนสุดแต่ละข้อความจะเริ่มเธรด Mattermost ที่รองรับด้วยเซสชันใหม่ซึ่งแยกเป็นอิสระ

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

หมายเหตุ:

- เซสชันที่มีขอบเขตระดับเธรดใช้ ID โพสต์ที่เป็นทริกเกอร์เป็นรากของเธรด
- `first` และ `all` มีค่าเทียบเท่ากันในปัจจุบัน เนื่องจากเมื่อ Mattermost มีรากของเธรดแล้ว ส่วนข้อความและสื่อที่ตามมาจะดำเนินต่อในเธรดเดียวกันนั้น
- ค่าที่กำหนดเฉพาะประเภทแชตมีลำดับความสำคัญเหนือ `replyToMode` หากไม่มีค่าที่กำหนดแทนสำหรับ `direct` การติดตั้งใช้งานที่มีอยู่จะคง DM แบบแบนและไม่มีเธรดไว้

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่) ค่าอื่น: `allowlist`, `open`, `disabled`
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` ร่วมกับ `channels.mattermost.allowFrom=["*"]` (สคีมาการกำหนดค่าบังคับให้ใช้ไวลด์การ์ด)
- `channels.mattermost.allowFrom` รองรับ ID ผู้ใช้ (แนะนำ) และรายการ `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## ช่อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (กำหนดให้ต้องกล่าวถึง)
- อนุญาตผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- `channels.mattermost.groupAllowFrom` รองรับรายการ `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- ค่าที่กำหนดแทนการกล่าวถึงต่อช่องอยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือใช้ `channels.mattermost.groups["*"].requireMention` เป็นค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และจะเปิดใช้งานเฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- ช่องแบบเปิด: `channels.mattermost.groupPolicy="open"` (กำหนดให้ต้องกล่าวถึง)
- ลำดับการแก้ค่า: `channels.mattermost.groupPolicy` จากนั้น `channels.defaults.groupPolicy` และ `"allowlist"`
- หมายเหตุเกี่ยวกับรันไทม์: หากส่วน `channels.mattermost` หายไปทั้งหมด รันไทม์จะปฏิเสธโดยค่าเริ่มต้นเป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ตั้งค่า `channels.defaults.groupPolicy` ไว้) และบันทึกคำเตือนหนึ่งครั้ง

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

| เป้าหมาย                              | ส่งไปยัง                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | ช่องตาม ID                                                 |
| `channel:<name>` หรือ `#channel-name` | ช่องตามชื่อ โดยค้นหาในทุกทีมที่บอตเป็นสมาชิก |
| `user:<id>` หรือ `mattermost:<id>`    | DM กับผู้ใช้รายนั้น                                             |
| `@username`                         | DM (แก้ชื่อผู้ใช้ผ่าน API ของ Mattermost)                 |

การส่งขาออกรองรับไฟล์แนบได้สูงสุดหนึ่งไฟล์ต่อข้อความ แยกหลายไฟล์เป็นการส่งคนละครั้ง

<Warning>
ID ทึบที่ไม่มีคำนำหน้า (เช่น `64ifufp...`) **มีความกำกวม** ใน Mattermost (ID ผู้ใช้หรือ ID ช่อง)

OpenClaw จะแก้ค่าโดย **พิจารณาผู้ใช้ก่อน**:

- หาก ID มีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดยแก้ไขช่องทางโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกถือเป็น **ID ช่องทาง**

หากต้องการลักษณะการทำงานที่แน่นอน ให้ใช้คำนำหน้าที่ระบุชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองช่องทาง DM ใหม่

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้องแก้ไขช่องทางโดยตรงก่อน ระบบจะลองสร้างช่องทางโดยตรงใหม่โดยค่าเริ่มต้นเมื่อเกิดความล้มเหลวชั่วคราว

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับลักษณะการทำงานนี้แบบส่วนกลางสำหรับ Plugin Mattermost หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีหนึ่งบัญชี ค่าเริ่มต้น:

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

- การตั้งค่านี้ใช้เฉพาะกับการสร้างช่องทาง DM (`/api/v4/channels/direct`) ไม่ใช่ทุกการเรียก API ของ Mattermost
- การลองใหม่ใช้ exponential backoff พร้อม jitter และใช้กับความล้มเหลวชั่วคราว เช่น ขีดจำกัดอัตรา การตอบกลับ 5xx และข้อผิดพลาดด้านเครือข่ายหรือการหมดเวลา
- ข้อผิดพลาดฝั่งไคลเอนต์ 4xx นอกเหนือจาก `429` จะถูกถือเป็นข้อผิดพลาดถาวรและจะไม่มีการลองใหม่

## การสตรีมตัวอย่าง

Mattermost สตรีมกระบวนการคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนไปยัง **โพสต์ตัวอย่างฉบับร่าง** ซึ่งจะถูกสรุปผลในตำแหน่งเดิมเมื่อคำตอบสุดท้ายพร้อมส่งอย่างปลอดภัย ในโหมด `partial` ตัวอย่างจะอัปเดตบน ID โพสต์เดิมแทนการส่งข้อความแยกทุกส่วนจนรบกวนช่องทาง ในโหมด `block` ตัวอย่างจะสลับระหว่างข้อความที่เสร็จสมบูรณ์กับบล็อกกิจกรรมของเครื่องมือ ทำให้บล็อกก่อนหน้ายังคงแสดงเป็นโพสต์แยกของตนเองแทนที่จะถูกบล็อกถัดไปเขียนทับ ผลลัพธ์สุดท้ายที่เป็นสื่อหรือข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่และใช้การส่งตามปกติแทนการส่งโพสต์ตัวอย่างชั่วคราว

การสตรีมตัวอย่าง **เปิดใช้งานโดยค่าเริ่มต้น** ในโหมด `partial` กำหนดค่าผ่าน `channels.mattermost.streaming.mode` (ค่า `streaming` แบบสเกลาร์/บูลีนเดิมจะถูกย้ายโดย `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="โหมดการสตรีม">
    - `partial` (ค่าเริ่มต้น): โพสต์ตัวอย่างหนึ่งโพสต์ที่ได้รับการแก้ไขตามการเพิ่มขึ้นของคำตอบ จากนั้นจึงสรุปผลด้วยคำตอบที่สมบูรณ์
    - `block` สลับตัวอย่างระหว่างข้อความที่เสร็จสมบูรณ์กับบล็อกกิจกรรมของเครื่องมือ ทำให้แต่ละบล็อกยังคงแสดงเป็นโพสต์แยกของตนเองแทนที่จะถูกเขียนทับในตำแหน่งเดิม การอัปเดตเครื่องมือแบบขนานและต่อเนื่องจะใช้โพสต์กิจกรรมของเครื่องมือปัจจุบันร่วมกัน
    - `progress` แสดงตัวอย่างสถานะระหว่างการสร้าง และจะโพสต์คำตอบสุดท้ายเมื่อเสร็จสมบูรณ์เท่านั้น
    - `off` ปิดใช้งานการสตรีมตัวอย่าง เมื่อใช้ `streaming.block.enabled: true` บล็อกของผู้ช่วยที่เสร็จสมบูรณ์จะยังคงถูกส่งเป็นการตอบกลับแบบบล็อกตามปกติ (โพสต์แยกกัน) แทนโพสต์สุดท้ายเดียวที่รวมเข้าด้วยกัน

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับลักษณะการทำงานของการสตรีม">
    - หากไม่สามารถสรุปผลสตรีมในตำแหน่งเดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะเปลี่ยนไปส่งโพสต์สุดท้ายใหม่ เพื่อให้มั่นใจว่าคำตอบจะไม่สูญหาย
    - เพย์โหลดที่มีเฉพาะกระบวนการคิดจะไม่ถูกโพสต์ลงในช่องทาง รวมถึงข้อความที่มาถึงในรูปแบบ blockquote `> Thinking` ตั้งค่า `/reasoning on` เพื่อดูกระบวนการคิดในพื้นผิวอื่น โพสต์สุดท้ายของ Mattermost จะเก็บเฉพาะคำตอบ
    - ดูเมทริกซ์การแมปช่องทางได้ที่ [การสตรีม](/th/concepts/streaming#preview-streaming-modes)

  </Accordion>
</AccordionGroup>

## รีแอ็กชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` ร่วมกับ `channel=mattermost`
- `messageId` คือ ID โพสต์ของ Mattermost
- `emoji` รองรับชื่อ เช่น `thumbsup` หรือ `:+1:` (ไม่จำเป็นต้องมีเครื่องหมายโคลอน)
- ตั้งค่า `remove=true` (บูลีน) เพื่อลบรีแอ็กชัน
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชันเอเจนต์ที่กำหนดเส้นทาง โดยอยู่ภายใต้การตรวจสอบนโยบาย DM/กลุ่มแบบเดียวกับข้อความ

ตัวอย่าง:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดใช้งานการดำเนินการรีแอ็กชัน (ค่าเริ่มต้น true)
- การแทนที่สำหรับแต่ละบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม เอเจนต์จะได้รับตัวเลือกและสามารถตอบกลับได้

ปุ่มมาจากเพย์โหลดเชิงความหมาย `presentation` (ในการตอบกลับตามปกติของเอเจนต์และใน `message action=send`) OpenClaw แสดงปุ่มค่าเป็นปุ่มโต้ตอบของ Mattermost คงปุ่ม URL ให้มองเห็นได้ในข้อความ และลดระดับเมนูตัวเลือกเป็นข้อความที่อ่านได้

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

ฟิลด์ปุ่มการนำเสนอ:

<ParamField path="label" type="string" required>
  ป้ายกำกับที่แสดง (นามแฝง: `text`)
</ParamField>
<ParamField path="value" type="string">
  ค่าที่ส่งกลับเมื่อคลิก ซึ่งใช้เป็น ID การดำเนินการ (นามแฝง: `callback_data`, `callbackData`) จำเป็นสำหรับปุ่มที่คลิกได้ เว้นแต่จะตั้งค่า `url`
</ParamField>
<ParamField path="url" type="string">
  ปุ่มลิงก์ ซึ่งจะแสดงเป็นข้อความ `label: url` ในเนื้อหาข้อความแทนปุ่มโต้ตอบ
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  รูปแบบปุ่ม Mattermost ใช้รูปแบบเริ่มต้นกับค่าที่ไม่รองรับ
</ParamField>

หากต้องการประกาศการรองรับปุ่มในพรอมต์ระบบของเอเจนต์ ให้เพิ่ม `inlineButtons` ในความสามารถของช่องทาง:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

เมื่อผู้ใช้คลิกปุ่ม:

<Steps>
  <Step title="การตรวจสอบสิทธิ์เข้าถึง">
    ผู้คลิกต้องผ่านการตรวจสอบนโยบาย DM/กลุ่มแบบเดียวกับผู้ส่งข้อความ การคลิกที่ไม่ได้รับอนุญาตจะได้รับการแจ้งเตือนชั่วคราวและถูกเพิกเฉย
  </Step>
  <Step title="แทนที่ปุ่มด้วยการยืนยัน">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **Yes** selected by @user")
  </Step>
  <Step title="เอเจนต์ได้รับตัวเลือก">
    เอเจนต์ได้รับตัวเลือกเป็นข้อความขาเข้า (พร้อมเหตุการณ์ระบบ) และตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุการใช้งาน">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (ทำงานอัตโนมัติ ไม่จำเป็นต้องกำหนดค่า)
    - บล็อกไฟล์แนบทั้งหมดจะถูกแทนที่เมื่อคลิก ดังนั้นปุ่มทั้งหมดจะถูกลบพร้อมกัน โดยไม่สามารถลบบางส่วนได้
    - ID การดำเนินการที่มีเครื่องหมายยัติภังค์หรือขีดล่างจะถูกทำให้ถูกต้องโดยอัตโนมัติ (ข้อจำกัดในการกำหนดเส้นทางของ Mattermost)
    - การคลิกที่ `action_id` ไม่ตรงกับการดำเนินการในโพสต์ต้นฉบับจะถูกปฏิเสธด้วย `403` ("การดำเนินการที่ไม่รู้จัก")

  </Accordion>
  <Accordion title="การกำหนดค่าและการเข้าถึง">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้งานคำอธิบายเครื่องมือปุ่มในพรอมต์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกที่ไม่บังคับสำหรับคอลแบ็กของปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่โฮสต์ผูกไว้ได้โดยตรง
    - ในการตั้งค่าแบบหลายบัญชี สามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` ได้เช่นกัน
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะคำนวณ URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` (ค่าเริ่มต้น 18789) แล้วจึงเปลี่ยนไปใช้ `http://localhost:<port>` เส้นทางคอลแบ็กคือ `/mattermost/interactions/<accountId>`
    - กฎการเข้าถึง: เซิร์ฟเวอร์ Mattermost ต้องสามารถเข้าถึง URL คอลแบ็กของปุ่มได้ `localhost` ใช้งานได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - `channels.mattermost.interactions.allowedSourceIps`: รายการอนุญาต IP ต้นทางสำหรับคอลแบ็กของปุ่ม หากไม่มีค่านี้ จะยอมรับเฉพาะต้นทางลูปแบ็ก (`127.0.0.1`, `::1`) ดังนั้นต้องเพิ่มเซิร์ฟเวอร์ Mattermost ระยะไกลไว้ในรายการอนุญาตนี้ มิฉะนั้นการคลิกจะถูกปฏิเสธด้วย `403` หากอยู่หลัง reverse proxy ให้ตั้งค่า `gateway.trustedProxies` ด้วย เพื่อให้ดึง IP ไคลเอนต์จริงจากส่วนหัวที่ส่งต่อ
    - หากเป้าหมายคอลแบ็กเป็นแบบส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนของเป้าหมายใน `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhook สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการผ่านเครื่องมือ `message` ของเอเจนต์ ควรใช้เครื่องมือ `message` ของ OpenClaw สำหรับการผสานรวมโดยตรง ให้นำเข้า `buildButtonAttachments` จาก `@openclaw/mattermost/api.js` หากโพสต์ JSON ดิบ ให้ปฏิบัติตามกฎเหล่านี้:

**โครงสร้างเพย์โหลด:**

```json5
{
  channel_id: "<channelId>",
  message: "เลือกตัวเลือก:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // ใช้ได้เฉพาะตัวอักษรและตัวเลข - ดูด้านล่าง
            type: "button", // จำเป็น มิฉะนั้นการคลิกจะถูกเพิกเฉยโดยไม่มีการแจ้งเตือน
            name: "อนุมัติ", // ป้ายกำกับที่แสดง
            style: "primary", // ไม่บังคับ: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ต้องตรงกับ ID ปุ่ม
                action: "approve",
                // ... ฟิลด์กำหนดเองใดๆ ...
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

1. ไฟล์แนบต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกเพิกเฉยโดยไม่มีการแจ้งเตือน)
2. ทุกการดำเนินการต้องมี `type: "button"` หากไม่มี การคลิกจะถูกกลืนโดยไม่มีการแจ้งเตือน
3. ทุกการดำเนินการต้องมีฟิลด์ `id` Mattermost จะเพิกเฉยต่อการดำเนินการที่ไม่มี ID
4. `id` ของการดำเนินการต้องมี **เฉพาะตัวอักษรและตัวเลข** (`[a-zA-Z0-9]`) เครื่องหมายยัติภังค์และขีดล่างทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost ใช้งานไม่ได้ (ส่งคืน 404) ให้นำออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม Gateway จะปฏิเสธการคลิกที่ `action_id` ไม่มีอยู่ในโพสต์
6. จำเป็นต้องมี `context.action_id` ตัวจัดการการโต้ตอบจะส่งคืน 400 หากไม่มีค่านี้
7. ต้องอนุญาต IP ต้นทางของคอลแบ็ก (ดู `interactions.allowedSourceIps` ด้านบน)

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="สร้างข้อมูลลับจากโทเค็นบอต">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)` เข้ารหัสแบบเลขฐานสิบหก
  </Step>
  <Step title="สร้างออบเจ็กต์บริบท">
    สร้างออบเจ็กต์บริบทที่มีฟิลด์ทั้งหมด **ยกเว้น** `_token`
  </Step>
  <Step title="ทำให้เป็นอนุกรมโดยเรียงลำดับคีย์">
    ทำให้เป็นอนุกรมโดย **เรียงลำดับคีย์แบบเวียนเกิด** และ **ไม่มีช่องว่าง** (Gateway จะทำให้ออบเจ็กต์ที่ซ้อนกันเป็นมาตรฐานด้วย และสร้าง JSON แบบกระชับ)
  </Step>
  <Step title="ลงนามเพย์โหลด">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="เพิ่มโทเค็น">
    เพิ่มไดเจสต์เลขฐานสิบหกที่ได้เป็น `_token` ในบริบท
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
    - `json.dumps` ของ Python จะเพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตแบบกระชับของ JavaScript (`{"key":"val"}`)
    - ลงนามฟิลด์บริบท **ทั้งหมด** เสมอ (ยกเว้น `_token`) Gateway จะนำ `_token` ออก แล้วลงนามทุกฟิลด์ที่เหลือ การลงนามเพียงบางส่วนจะทำให้การตรวจสอบล้มเหลวโดยไม่มีข้อความแจ้ง
    - ใช้ `sort_keys=True` เนื่องจาก Gateway จะเรียงลำดับคีย์ก่อนลงนาม และ Mattermost อาจจัดลำดับฟิลด์บริบทใหม่เมื่อจัดเก็บเพย์โหลด
    - สร้างข้อมูลลับจากโทเค็นบอต (แบบกำหนดผลลัพธ์ได้แน่นอน) ไม่ใช่จากไบต์สุ่ม ข้อมูลลับต้องเหมือนกันทั้งในกระบวนการที่สร้างปุ่มและ Gateway ที่ทำการตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin Mattermost มีอะแดปเตอร์ไดเรกทอรีที่ใช้ Mattermost API เพื่อแปลงชื่อช่องและชื่อผู้ใช้ ซึ่งทำให้สามารถใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` รวมถึงการส่งผ่าน cron/webhook ได้

ไม่จำเป็นต้องกำหนดค่า เนื่องจากอะแดปเตอร์ใช้โทเค็นบอตจากการกำหนดค่าบัญชี

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

ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด ส่วน `channels.mattermost.defaultAccount` จะเลือกบัญชีที่ใช้เมื่อไม่ได้ระบุบัญชี

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบว่าบอตอยู่ในช่องและกล่าวถึงบอต (oncall), ใช้คำนำหน้าทริกเกอร์ (onchar) หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาดด้านการตรวจสอบสิทธิ์หรือหลายบัญชี">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และตรวจสอบว่าเปิดใช้งานบัญชีแล้วหรือไม่
    - ปัญหาเกี่ยวกับหลายบัญชี: ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชี `default`
    - โฮสต์ Mattermost แบบส่วนตัว/LAN ต้องใช้ `network.dangerouslyAllowPrivateNetwork: true` (กลไกป้องกัน SSRF จะบล็อก IP ส่วนตัวโดยค่าเริ่มต้น)

  </Accordion>
  <Accordion title="คำสั่งสแลชแบบเนทีฟล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นคอลแบ็ก สาเหตุทั่วไป:
      - การลงทะเบียนคำสั่งสแลชล้มเหลวหรือเสร็จสมบูรณ์เพียงบางส่วนเมื่อเริ่มต้นระบบ
      - คอลแบ็กกำลังส่งไปยัง Gateway/บัญชีที่ไม่ถูกต้อง
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมายคอลแบ็กก่อนหน้า
      - Gateway เริ่มต้นใหม่โดยไม่ได้เปิดใช้งานคำสั่งสแลชอีกครั้ง
    - หากคำสั่งสแลชแบบเนทีฟหยุดทำงาน ให้ตรวจสอบบันทึกเพื่อหา `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และบันทึกเตือนว่าคอลแบ็กถูกแปลงเป็น URL แบบลูปแบ็ก เช่น `http://localhost:18789/...` URL ดังกล่าวอาจเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานอยู่บนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw ให้ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มปรากฏเป็นกล่องสีขาวหรือไม่ปรากฏเลย: ข้อมูลปุ่มมีรูปแบบไม่ถูกต้อง ปุ่มการนำเสนอแต่ละปุ่มต้องมี `label` และ `value` (ปุ่มที่ขาดรายการใดรายการหนึ่งจะถูกละทิ้ง)
    - ปุ่มแสดงผลแต่เมื่อคลิกแล้วไม่มีการตอบสนอง: ตรวจสอบว่าเซิร์ฟเวอร์ Mattermost เข้าถึง Gateway ได้, IP ของเซิร์ฟเวอร์ Mattermost อยู่ใน `channels.mattermost.interactions.allowedSourceIps` (หากไม่มีค่านี้จะยอมรับเฉพาะลูปแบ็ก) และ `ServiceSettings.AllowedUntrustedInternalConnections` มีโฮสต์คอลแบ็กสำหรับเป้าหมายส่วนตัว
    - เมื่อคลิกปุ่มแล้วได้รับ 404: `id` ของปุ่มอาจมีเครื่องหมายขีดกลางหรือขีดล่าง เราเตอร์การดำเนินการของ Mattermost ไม่รองรับ ID ที่มีอักขระอื่นนอกจากตัวอักษรและตัวเลข ให้ใช้เฉพาะ `[a-zA-Z0-9]`
    - Gateway บันทึก `rejected callback source`: การคลิกมาจาก IP ที่ไม่อยู่ใน `interactions.allowedSourceIps` เพิ่มเซิร์ฟเวอร์ Mattermost หรือ ingress ของคุณลงในรายการอนุญาต และตั้งค่า `gateway.trustedProxies` เมื่ออยู่หลังพร็อกซีย้อนกลับ
    - Gateway บันทึก `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามฟิลด์บริบททั้งหมด (ไม่ใช่เพียงบางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกระชับ (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - Gateway บันทึก `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ในบริบทของปุ่ม ตรวจสอบว่าได้รวมฟิลด์นี้ไว้เมื่อสร้างเพย์โหลดการผสานการทำงาน
    - Gateway ปฏิเสธการคลิกด้วย `Unknown action`: `context.action_id` ไม่ตรงกับ `id` ของการดำเนินการใดๆ ในโพสต์ ตั้งค่าทั้งสองเป็นค่าที่ผ่านการปรับให้ปลอดภัยค่าเดียวกัน
    - เอเจนต์ไม่มีปุ่มให้ใช้: เพิ่ม `capabilities: ["inlineButtons"]` ลงในการกำหนดค่าช่อง Mattermost

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) - ช่องทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) - ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) - การตรวจสอบสิทธิ์ DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่งด้านความปลอดภัย
