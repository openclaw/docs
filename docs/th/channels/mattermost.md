---
read_when:
    - การตั้งค่า Mattermost
    - การแก้ไขข้อบกพร่องในการกำหนดเส้นทางของ Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T15:53:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้ (โทเค็นบอท + เหตุการณ์ WebSocket) รองรับช่อง ช่องส่วนตัว DM แบบกลุ่ม และ DM Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้ ([mattermost.com](https://mattermost.com))

## ติดตั้ง

<Tabs>
  <Tab title="รีจิสทรี npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="เช็กเอาต์ภายในเครื่อง">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

รายละเอียด: [Plugin](/th/tools/plugin)

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า Plugin พร้อมใช้งาน">
    ติดตั้ง `@openclaw/mattermost` ด้วยคำสั่งข้างต้น จากนั้นรีสตาร์ต Gateway หากกำลังทำงานอยู่
  </Step>
  <Step title="สร้างบอท Mattermost">
    สร้างบัญชีบอท Mattermost คัดลอก **โทเค็นบอท** และเพิ่มบอทไปยังทีมและช่องที่ต้องการให้บอทอ่าน
  </Step>
  <Step title="คัดลอก URL ฐาน">
    คัดลอก **URL ฐาน** ของ Mattermost (เช่น `https://chat.example.com`) ระบบจะตัด `/api/v4` ที่ส่วนท้ายออกโดยอัตโนมัติ
  </Step>
  <Step title="กำหนดค่า OpenClaw และเริ่มต้น Gateway">
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
สำหรับ Mattermost ที่โฮสต์เองบนที่อยู่ส่วนตัว/LAN/tailnet: คำขอขาออกไปยัง API ของ Mattermost จะผ่านตัวป้องกัน SSRF ซึ่งบล็อก IP ส่วนตัวและ IP ภายในโดยค่าเริ่มต้น เลือกอนุญาตด้วย `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (รายบัญชี: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`)
</Note>

## คำสั่งสแลชแบบเนทีฟ

คำสั่งสแลชแบบเนทีฟต้องเลือกเปิดใช้งาน เมื่อเปิดใช้งาน OpenClaw จะลงทะเบียนคำสั่งสแลช `oc_*` ในทุกทีมที่บอทเป็นสมาชิก และรับ callback แบบ POST ผ่านเซิร์ฟเวอร์ HTTP ของ Gateway

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

คำสั่งที่ลงทะเบียน: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue` เมื่อกำหนด `nativeSkills: true` คำสั่ง Skills จะได้รับการลงทะเบียนเป็น `/oc_<skill>` ด้วย

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับลักษณะการทำงาน">
    - ค่าเริ่มต้นของ `native` และ `nativeSkills` คือ `"auto"` ซึ่งจะถูกตีความว่าปิดใช้งานสำหรับ Mattermost ให้กำหนดค่าเป็น `true` อย่างชัดเจน
    - ค่าเริ่มต้นของ `callbackPath` คือ `/api/channels/mattermost/command`
    - หากไม่ได้ระบุ `callbackUrl` OpenClaw จะสร้างค่าจาก `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` โฮสต์ที่ผูกแบบไวลด์การ์ด (`0.0.0.0`, `::`) จะใช้ `localhost` แทน
    - สำหรับการตั้งค่าหลายบัญชี สามารถกำหนด `commands` ที่ระดับบนสุดหรือภายใต้ `channels.mattermost.accounts.<id>.commands` (ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด)
    - คำสั่งสแลชที่มีทริกเกอร์เดียวกันซึ่งสร้างโดยการผสานรวมอื่นจะไม่ถูกแก้ไข (ระบบจะข้ามการลงทะเบียน) ส่วนคำสั่งที่บอทสร้างจะได้รับการอัปเดตหรือสร้างใหม่เมื่อ URL ของ callback เปลี่ยนไป
    - callback ของคำสั่งจะได้รับการตรวจสอบด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งคืนเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw จะรีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนยอมรับ callback แต่ละครั้ง ดังนั้นโทเค็นเก่าจากคำสั่งสแลชที่ถูกลบหรือสร้างใหม่จะไม่ได้รับการยอมรับอีกต่อไปโดยไม่ต้องรีสตาร์ต Gateway
    - การตรวจสอบ callback จะปฏิเสธโดยค่าเริ่มต้นหาก API ของ Mattermost ไม่สามารถยืนยันได้ว่าคำสั่งยังเป็นปัจจุบัน ระบบจะแคชผลการตรวจสอบที่ล้มเหลวไว้ชั่วครู่ รวมคำขอค้นหาที่เกิดพร้อมกัน และจำกัดอัตราการเริ่มค้นหาใหม่เป็นรายคำสั่งเพื่อควบคุมแรงกดดันจากการเล่นซ้ำ
    - callback ของคำสั่งสแลชจะปฏิเสธโดยค่าเริ่มต้นเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นสำเร็จเพียงบางส่วน หรือโทเค็น callback ไม่ตรงกับโทเค็นที่ลงทะเบียนของคำสั่งที่หาได้ (โทเค็นที่ใช้ได้กับคำสั่งหนึ่งจะไม่สามารถผ่านไปยังการตรวจสอบต้นทางสำหรับอีกคำสั่งหนึ่งได้)
    - callback ที่ยอมรับแล้วจะได้รับการตอบรับด้วยข้อความชั่วคราว "กำลังประมวลผล..." ส่วนคำตอบจริงจะมาถึงในรูปข้อความปกติ

  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    ปลายทาง callback ต้องสามารถเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost

    - อย่ากำหนด `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw
    - อย่ากำหนด `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้นจะทำพร็อกซีย้อนกลับ `/api/channels/mattermost/command` ไปยัง OpenClaw
    - วิธีตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command` โดยคำขอ GET ควรส่งคืน `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="รายการอนุญาตสำหรับการรับส่งข้อมูลขาออกของ Mattermost">
    หาก callback ของคุณมีเป้าหมายเป็นที่อยู่ส่วนตัว/tailnet/ภายใน ให้กำหนด `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมนของ callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม

    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

หากต้องการใช้ตัวแปรสภาพแวดล้อม ให้กำหนดค่าต่อไปนี้บนโฮสต์ของ Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชี **เริ่มต้น** (`default`) บัญชีอื่นต้องใช้ค่าจากการกำหนดค่า

ไม่สามารถกำหนด `MATTERMOST_URL` จาก `.env` ของเวิร์กสเปซได้ โปรดดู [ไฟล์ .env ของเวิร์กสเปซ](/th/gateway/security)
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
    ตอบกลับเมื่อข้อความขึ้นต้นด้วยคำนำหน้าทริกเกอร์
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

- `onchar` ยังคงตอบกลับเมื่อมีการ @กล่าวถึงอย่างชัดเจน
- ระบบยังคงใช้ `channels.mattermost.requireMention` แต่แนะนำให้ใช้ `chatmode` การตั้งค่า `groups.<channelId>.requireMention` รายช่องจะมีลำดับความสำคัญเหนือกว่าทั้งสองค่า
- หลังจากบอทส่งคำตอบที่มองเห็นได้ในเธรดของช่อง ข้อความที่ส่งภายหลังในเธรดเดียวกันจะได้รับการตอบโดยไม่ต้อง @กล่าวถึงใหม่หรือใส่คำนำหน้า `onchar` ทำให้การสนทนาแบบหลายรอบในเธรดดำเนินต่อเนื่อง ระบบจะจดจำการมีส่วนร่วมเป็นเวลา 7 วันหลังจากที่บอทตอบกลับครั้งล่าสุดในเธรดนั้น และข้อมูลจะคงอยู่แม้รีสตาร์ต Gateway เธรดที่บอทเพียงสังเกตการณ์จะไม่ได้รับผลกระทบ ให้เริ่มข้อความระดับบนสุดใหม่เพื่อกำหนดให้ต้องกล่าวถึงอย่างชัดเจนอีกครั้ง

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าคำตอบในช่องและกลุ่มจะอยู่ในช่องหลักหรือเริ่มเธรดใต้โพสต์ที่ทริกเกอร์

- `off` (ค่าเริ่มต้น): ตอบในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดในช่อง/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันที่จำกัดขอบเขตตามเธรด
- `all` และ `batched`: ปัจจุบันมีลักษณะการทำงานเหมือน `first` สำหรับ Mattermost เนื่องจากเมื่อ Mattermost มีรากเธรดแล้ว ส่วนข้อความและสื่อที่ตามมาจะดำเนินต่อในเธรดเดิม
- ข้อความโดยตรงมีค่าเริ่มต้นเป็น `off` แม้จะกำหนด `replyToMode` ไว้

ใช้ `channels.mattermost.replyToModeByChatType` เพื่อแทนที่โหมดสำหรับแชตแบบ `direct`, `group` หรือ `channel` กำหนด `direct` เพื่อเลือกใช้เธรดสำหรับข้อความโดยตรง:

- `off` (ค่าเริ่มต้น): ข้อความโดยตรงจะไม่ใช้เธรดและอยู่ในเซสชันต่อเนื่องเดียว
- `first`, `all` หรือ `batched`: ข้อความโดยตรงระดับบนสุดแต่ละข้อความจะเริ่มเธรด Mattermost ซึ่งรองรับโดยเซสชันใหม่ที่เป็นอิสระ

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

- เซสชันที่จำกัดขอบเขตตามเธรดจะใช้ ID ของโพสต์ที่ทริกเกอร์เป็นรากเธรด
- ปัจจุบัน `first` และ `all` มีความหมายเทียบเท่ากัน เนื่องจากเมื่อ Mattermost มีรากเธรดแล้ว ส่วนข้อความและสื่อที่ตามมาจะดำเนินต่อในเธรดเดิม
- ค่าที่แทนที่ตามประเภทแชตมีลำดับความสำคัญเหนือ `replyToMode` หากไม่มีค่าที่แทนที่สำหรับ `direct` การติดตั้งใช้งานเดิมจะยังคงใช้ DM แบบแบนราบที่ไม่แบ่งเป็นเธรด

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่) ค่าอื่นๆ ได้แก่ `allowlist`, `open`, `disabled`
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` ร่วมกับ `channels.mattermost.allowFrom=["*"]` (สคีมาการกำหนดค่าบังคับให้ใช้ไวลด์การ์ด)
- `channels.mattermost.allowFrom` ยอมรับ ID ผู้ใช้ (แนะนำ) และรายการ `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## ช่อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ต้องกล่าวถึง)
- อนุญาตผู้ส่งด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- `channels.mattermost.groupAllowFrom` ยอมรับรายการ `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- ค่าที่แทนที่การกล่าวถึงรายช่องอยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือใช้ `channels.mattermost.groups["*"].requireMention` เป็นค่าเริ่มต้น
- การจับคู่ `@username` สามารถเปลี่ยนแปลงได้และจะเปิดใช้งานเฉพาะเมื่อกำหนด `channels.mattermost.dangerouslyAllowNameMatching: true`
- ช่องแบบเปิด: `channels.mattermost.groupPolicy="open"` (ต้องกล่าวถึง)
- ลำดับการแก้ค่า: `channels.mattermost.groupPolicy` จากนั้น `channels.defaults.groupPolicy` และสุดท้าย `"allowlist"`
- หมายเหตุขณะทำงาน: หากไม่มีส่วน `channels.mattermost` ทั้งหมด ระบบขณะทำงานจะปฏิเสธโดยค่าเริ่มต้นด้วย `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะกำหนด `channels.defaults.groupPolicy` ไว้) และบันทึกคำเตือนหนึ่งครั้ง

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

ใช้รูปแบบเป้าหมายต่อไปนี้กับ `openclaw message send` หรือ Cron/Webhook:

| เป้าหมาย                            | ส่งไปยัง                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | ช่องตาม ID                                                     |
| `channel:<name>` หรือ `#channel-name` | ช่องตามชื่อ โดยค้นหาจากทุกทีมที่บอทเป็นสมาชิก                  |
| `user:<id>` หรือ `mattermost:<id>`    | DM กับผู้ใช้นั้น                                               |
| `@username`                         | DM (แก้ชื่อผู้ใช้ผ่าน API ของ Mattermost)                      |

การส่งขาออกรองรับไฟล์แนบได้ไม่เกินหนึ่งไฟล์ต่อข้อความ ให้แยกไฟล์หลายไฟล์ออกเป็นการส่งคนละครั้ง

<Warning>
ID ทึบแสงที่ไม่มีคำนำหน้า (เช่น `64ifufp...`) มีความหมาย **กำกวม** ใน Mattermost (ID ผู้ใช้หรือ ID ช่อง)

OpenClaw จะแก้ค่าโดย **ให้ผู้ใช้มาก่อน**:

- หากมี ID นี้เป็นผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดยค้นหาช่องโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถือเป็น **ID ช่อง**

หากต้องการลักษณะการทำงานที่แน่นอน ให้ใช้คำนำหน้าอย่างชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองช่อง DM ใหม่

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และต้องค้นหาช่องโดยตรงก่อน ระบบจะลองสร้างช่องโดยตรงใหม่โดยค่าเริ่มต้นเมื่อเกิดความล้มเหลวชั่วคราว

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับลักษณะการทำงานนี้แบบส่วนกลางสำหรับ Plugin Mattermost หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว ค่าเริ่มต้น:

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

- การตั้งค่านี้ใช้เฉพาะกับการสร้างช่อง DM (`/api/v4/channels/direct`) ไม่ได้ใช้กับการเรียก Mattermost API ทุกครั้ง
- การลองใหม่ใช้การหน่วงเวลาแบบทวีคูณร่วมกับการสุ่มช่วงเวลา และใช้กับความล้มเหลวชั่วคราว เช่น การจำกัดอัตรา การตอบกลับ 5xx และข้อผิดพลาดเกี่ยวกับเครือข่ายหรือการหมดเวลา
- ข้อผิดพลาดฝั่งไคลเอนต์ 4xx นอกเหนือจาก `429` จะถือว่าเป็นข้อผิดพลาดถาวรและจะไม่มีการลองใหม่

## การสตรีมตัวอย่าง

Mattermost สตรีมกระบวนการคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **โพสต์ร่างตัวอย่าง** ซึ่งจะถูกเปลี่ยนเป็นคำตอบสุดท้ายในตำแหน่งเดิมเมื่อคำตอบสุดท้ายพร้อมส่งอย่างปลอดภัย ในโหมด `partial` ตัวอย่างจะอัปเดตโดยใช้รหัสโพสต์เดิม แทนที่จะส่งข้อความแต่ละส่วนจำนวนมากลงในช่อง ในโหมด `block` ตัวอย่างจะสลับระหว่างบล็อกข้อความที่เสร็จสมบูรณ์กับบล็อกกิจกรรมของเครื่องมือ เพื่อให้บล็อกก่อนหน้ายังคงปรากฏเป็นโพสต์แยกของตนเอง แทนที่จะถูกบล็อกถัดไปเขียนทับ ผลลัพธ์สุดท้ายที่เป็นสื่อหรือข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ และใช้การส่งตามปกติแทนการส่งโพสต์ตัวอย่างชั่วคราวที่ไม่ต้องการ

การสตรีมตัวอย่าง **เปิดใช้งานโดยค่าเริ่มต้น** ในโหมด `partial` กำหนดค่าผ่าน `channels.mattermost.streaming` (สตริงโหมด ค่าบูลีน หรือออบเจ็กต์ เช่น `{ mode: "progress" }`):

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
    - `partial` (ค่าเริ่มต้น): ใช้โพสต์ตัวอย่างหนึ่งโพสต์ที่ถูกแก้ไขตามการเพิ่มขึ้นของคำตอบ จากนั้นเปลี่ยนเป็นคำตอบฉบับสมบูรณ์
    - `block` สลับตัวอย่างระหว่างบล็อกข้อความที่เสร็จสมบูรณ์กับบล็อกกิจกรรมของเครื่องมือ เพื่อให้แต่ละบล็อกยังคงปรากฏเป็นโพสต์แยกของตนเอง แทนที่จะถูกเขียนทับในตำแหน่งเดิม การอัปเดตเครื่องมือแบบขนานและต่อเนื่องจะใช้โพสต์กิจกรรมของเครื่องมือปัจจุบันร่วมกัน
    - `progress` แสดงตัวอย่างสถานะระหว่างการสร้างคำตอบ และโพสต์เฉพาะคำตอบสุดท้ายเมื่อดำเนินการเสร็จสิ้น
    - `off` ปิดใช้งานการสตรีมตัวอย่าง เมื่อใช้ `blockStreaming: true` บล็อกของผู้ช่วยที่เสร็จสมบูรณ์จะยังคงถูกส่งเป็นคำตอบแบบบล็อกตามปกติ (โพสต์แยกกัน) แทนที่จะรวมเป็นโพสต์สุดท้ายเพียงโพสต์เดียว

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - หากไม่สามารถเปลี่ยนสตรีมเป็นคำตอบสุดท้ายในตำแหน่งเดิมได้ (เช่น โพสต์ถูกลบระหว่างการสตรีม) OpenClaw จะเปลี่ยนไปส่งโพสต์สุดท้ายใหม่ เพื่อให้คำตอบไม่สูญหาย
    - เพย์โหลดที่มีเฉพาะกระบวนการคิดจะไม่ถูกส่งไปยังโพสต์ในช่อง รวมถึงข้อความที่เข้ามาเป็นบล็อกคำพูด `> Thinking` ตั้งค่า `/reasoning on` เพื่อดูกระบวนการคิดในพื้นผิวอื่น ส่วนโพสต์สุดท้ายใน Mattermost จะเก็บไว้เฉพาะคำตอบ
    - ดูเมทริกซ์การแมปช่องได้ที่ [การสตรีม](/th/concepts/streaming#preview-streaming-modes)

  </Accordion>
</AccordionGroup>

## รีแอ็กชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` ร่วมกับ `channel=mattermost`
- `messageId` คือรหัสโพสต์ Mattermost
- `emoji` รับชื่อ เช่น `thumbsup` หรือ `:+1:` (เครื่องหมายโคลอนมีหรือไม่มีก็ได้)
- ตั้งค่า `remove=true` (ค่าบูลีน) เพื่อลบรีแอ็กชัน
- เหตุการณ์เพิ่มหรือลบรีแอ็กชันจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชันเอเจนต์ที่กำหนดเส้นทางไว้ โดยอยู่ภายใต้การตรวจสอบนโยบาย DM/กลุ่มแบบเดียวกับข้อความ

ตัวอย่าง:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการทำงานของรีแอ็กชัน (ค่าเริ่มต้นคือ true)
- การแทนที่สำหรับแต่ละบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม เอเจนต์จะได้รับตัวเลือกและสามารถตอบกลับได้

ปุ่มมาจากเพย์โหลดเชิงความหมาย `presentation` (ทั้งในการตอบกลับตามปกติของเอเจนต์และใน `message action=send`) OpenClaw เรนเดอร์ปุ่มค่าเป็นปุ่มโต้ตอบของ Mattermost แสดงปุ่ม URL ไว้ในข้อความ และลดระดับเมนูเลือกให้เป็นข้อความที่อ่านได้

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

ฟิลด์ของปุ่มการนำเสนอ:

<ParamField path="label" type="string" required>
  ป้ายกำกับที่แสดง (ชื่อแทน: `text`)
</ParamField>
<ParamField path="value" type="string">
  ค่าที่ส่งกลับเมื่อคลิก ซึ่งใช้เป็นรหัสการดำเนินการ (ชื่อแทน: `callback_data`, `callbackData`) จำเป็นสำหรับปุ่มที่คลิกได้ เว้นแต่จะตั้งค่า `url`
</ParamField>
<ParamField path="url" type="string">
  ปุ่มลิงก์ ซึ่งจะเรนเดอร์เป็นข้อความ `label: url` ในเนื้อหาข้อความแทนปุ่มโต้ตอบ
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  รูปแบบปุ่ม Mattermost จะใช้รูปแบบเริ่มต้นกับค่าที่ไม่รองรับ
</ParamField>

หากต้องการประกาศการรองรับปุ่มในพรอมต์ระบบของเอเจนต์ ให้เพิ่ม `inlineButtons` ลงในความสามารถของช่อง:

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
  <Step title="Access check">
    ผู้คลิกต้องผ่านการตรวจสอบนโยบาย DM/กลุ่มแบบเดียวกับผู้ส่งข้อความ การคลิกที่ไม่ได้รับอนุญาตจะได้รับการแจ้งเตือนชั่วคราวและถูกละเว้น
  </Step>
  <Step title="Buttons replaced with confirmation">
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **ใช่** ถูกเลือกโดย @user")
  </Step>
  <Step title="Agent receives the selection">
    เอเจนต์จะได้รับตัวเลือกเป็นข้อความขาเข้า (พร้อมเหตุการณ์ระบบ) และตอบกลับ
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (ทำงานอัตโนมัติ ไม่ต้องกำหนดค่า)
    - บล็อกไฟล์แนบทั้งหมดจะถูกแทนที่เมื่อคลิก ดังนั้นปุ่มทั้งหมดจะถูกลบพร้อมกัน และไม่สามารถลบเพียงบางส่วนได้
    - รหัสการดำเนินการที่มีเครื่องหมายยัติภังค์หรือขีดล่างจะถูกปรับให้อยู่ในรูปแบบที่ใช้ได้โดยอัตโนมัติ (ข้อจำกัดด้านการกำหนดเส้นทางของ Mattermost)
    - การคลิกที่มี `action_id` ไม่ตรงกับการดำเนินการในโพสต์ต้นฉบับจะถูกปฏิเสธด้วย `403` ("Unknown action")

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้งานคำอธิบายเครื่องมือปุ่มในพรอมต์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกที่เป็นทางเลือกสำหรับคอลแบ็กของปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway โดยตรงผ่านโฮสต์ที่ Gateway ผูกอยู่
    - ในการตั้งค่าแบบหลายบัญชี คุณสามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` ได้เช่นกัน
    - หากไม่ระบุ `interactions.callbackBaseUrl` OpenClaw จะสร้าง URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` (ค่าเริ่มต้น 18789) แล้วจึงใช้ `http://localhost:<port>` เป็นทางเลือกสำรอง พาธคอลแบ็กคือ `/mattermost/interactions/<accountId>`
    - กฎการเข้าถึง: เซิร์ฟเวอร์ Mattermost ต้องเข้าถึง URL คอลแบ็กของปุ่มได้ `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - `channels.mattermost.interactions.allowedSourceIps`: รายการอนุญาต IP ต้นทางสำหรับคอลแบ็กของปุ่ม หากไม่มีค่านี้ จะยอมรับเฉพาะต้นทาง local loopback (`127.0.0.1`, `::1`) ดังนั้นต้องเพิ่มเซิร์ฟเวอร์ Mattermost ระยะไกลลงในรายการอนุญาตที่นี่ มิฉะนั้นการคลิกจะถูกปฏิเสธด้วย `403` หากอยู่หลังพร็อกซีย้อนกลับ ให้ตั้งค่า `gateway.trustedProxies` ด้วย เพื่อให้สามารถหา IP ไคลเอนต์จริงจากส่วนหัวที่ส่งต่อมาได้
    - หากเป้าหมายคอลแบ็กเป็นแบบส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนของเป้าหมายลงใน `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ Webhook สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการส่งผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก Plugin เมื่อทำได้ หากโพสต์ JSON ดิบ ให้ปฏิบัติตามกฎต่อไปนี้:

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
                action_id: "mybutton01", // must match button id
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

1. ไฟล์แนบต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (มิฉะนั้นจะถูกละเว้นโดยไม่มีการแจ้งเตือน)
2. ทุกการดำเนินการต้องมี `type: "button"` หากไม่มี การคลิกจะถูกกลืนโดยไม่มีการแจ้งเตือน
3. ทุกการดำเนินการต้องมีฟิลด์ `id` Mattermost จะละเว้นการดำเนินการที่ไม่มีรหัส
4. `id` ของการดำเนินการต้องเป็น **อักขระตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) เครื่องหมายยัติภังค์และขีดล่างจะทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost ใช้งานไม่ได้ (ส่งคืน 404) ให้ลบอักขระเหล่านี้ออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม Gateway จะปฏิเสธการคลิกที่มี `action_id` ซึ่งไม่มีอยู่ในโพสต์
6. จำเป็นต้องมี `context.action_id` ตัวจัดการการโต้ตอบจะส่งคืน 400 หากไม่มีค่านี้
7. IP ต้นทางของคอลแบ็กต้องได้รับอนุญาต (ดู `interactions.allowedSourceIps` ด้านบน)

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)` เข้ารหัสเป็นเลขฐานสิบหก
  </Step>
  <Step title="Build the context object">
    สร้างออบเจ็กต์บริบทที่มีฟิลด์ทั้งหมด **ยกเว้น** `_token`
  </Step>
  <Step title="Serialize with sorted keys">
    แปลงเป็นรูปแบบอนุกรมโดย **เรียงลำดับคีย์แบบเวียนเกิด** และ **ไม่มีช่องว่าง** (Gateway จะทำให้รูปแบบของออบเจ็กต์ซ้อนเป็นมาตรฐานและสร้าง JSON แบบกระชับด้วย)
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
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
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` ของ Python จะเพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับผลลัพธ์แบบกระชับของ JavaScript (`{"key":"val"}`)
    - ลงลายเซ็นฟิลด์บริบท **ทั้งหมด** เสมอ (ยกเว้น `_token`) Gateway จะตัด `_token` ออกแล้วลงลายเซ็นทุกอย่างที่เหลือ การลงลายเซ็นเพียงบางส่วนจะทำให้การตรวจสอบล้มเหลวโดยไม่มีการแจ้งเตือน
    - ใช้ `sort_keys=True` เนื่องจาก Gateway จะเรียงลำดับคีย์ก่อนลงลายเซ็น และ Mattermost อาจจัดลำดับฟิลด์บริบทใหม่เมื่อจัดเก็บเพย์โหลด
    - สร้างข้อมูลลับจากโทเค็นบอต (ผลลัพธ์คงที่) ไม่ใช่ไบต์แบบสุ่ม ข้อมูลลับต้องเหมือนกันทั้งในกระบวนการที่สร้างปุ่มและ Gateway ที่ตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin Mattermost มีอะแดปเตอร์ไดเรกทอรีที่แปลงชื่อช่องและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งทำให้สามารถใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` และการส่งผ่าน cron/Webhook ได้

ไม่ต้องกำหนดค่า อะแดปเตอร์จะใช้โทเค็นบอตจากการกำหนดค่าบัญชี

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

ค่าบัญชีจะแทนที่ฟิลด์ระดับบนสุด โดย `channels.mattermost.defaultAccount` ใช้เลือกบัญชีที่จะใช้เมื่อไม่ได้ระบุบัญชี

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบว่าบอตอยู่ในช่องและกล่าวถึงบอต (oncall), ใช้คำนำหน้าทริกเกอร์ (onchar) หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาดในการยืนยันตัวตนหรือหลายบัญชี">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และตรวจสอบว่าบัญชีเปิดใช้งานอยู่หรือไม่
    - ปัญหาเกี่ยวกับหลายบัญชี: ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชี `default`
    - โฮสต์ Mattermost ส่วนตัว/เครือข่าย LAN ต้องใช้ `network.dangerouslyAllowPrivateNetwork: true` (กลไกป้องกัน SSRF จะบล็อก IP ส่วนตัวโดยค่าเริ่มต้น)

  </Accordion>
  <Accordion title="คำสั่งเครื่องหมายทับแบบเนทีฟล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นเรียกกลับ สาเหตุที่พบบ่อย:
      - การลงทะเบียนคำสั่งเครื่องหมายทับล้มเหลวหรือเสร็จสิ้นเพียงบางส่วนเมื่อเริ่มต้นระบบ
      - การเรียกกลับกำลังส่งไปยัง Gateway/บัญชีที่ไม่ถูกต้อง
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังปลายทางเรียกกลับก่อนหน้า
      - Gateway เริ่มระบบใหม่โดยไม่ได้เปิดใช้งานคำสั่งเครื่องหมายทับอีกครั้ง
    - หากคำสั่งเครื่องหมายทับแบบเนทีฟหยุดทำงาน ให้ตรวจสอบบันทึกสำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และบันทึกเตือนว่าการเรียกกลับถูกแปลงเป็น URL แบบ local loopback เช่น `http://localhost:18789/...` URL นั้นอาจเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานอยู่บนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw ให้ตั้งค่า `commands.callbackUrl` ที่ระบุอย่างชัดเจนและเข้าถึงได้จากภายนอกแทน

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มปรากฏเป็นกล่องสีขาวหรือไม่ปรากฏเลย: ข้อมูลปุ่มมีรูปแบบไม่ถูกต้อง ปุ่มนำเสนอแต่ละปุ่มต้องมี `label` และ `value` (ปุ่มที่ขาดค่าใดค่าหนึ่งจะถูกตัดออก)
    - ปุ่มแสดงผลแต่คลิกแล้วไม่มีอะไรเกิดขึ้น: ตรวจสอบว่าเซิร์ฟเวอร์ Mattermost เข้าถึง Gateway ได้, IP ของเซิร์ฟเวอร์ Mattermost อยู่ใน `channels.mattermost.interactions.allowedSourceIps` (หากไม่มีค่านี้จะยอมรับเฉพาะ local loopback) และ `ServiceSettings.AllowedUntrustedInternalConnections` มีโฮสต์เรียกกลับสำหรับปลายทางส่วนตัว
    - ปุ่มส่งคืน 404 เมื่อคลิก: `id` ของปุ่มอาจมีเครื่องหมายยัติภังค์หรือขีดล่าง เราเตอร์การดำเนินการของ Mattermost ใช้งานไม่ได้กับ ID ที่ไม่ใช่อักขระตัวอักษรและตัวเลข ให้ใช้เฉพาะ `[a-zA-Z0-9]`
    - บันทึกของ Gateway แสดง `rejected callback source`: การคลิกมาจาก IP ที่อยู่นอก `interactions.allowedSourceIps` เพิ่มเซิร์ฟเวอร์ Mattermost หรือจุดรับทราฟฟิกขาเข้าของคุณลงในรายการอนุญาต และตั้งค่า `gateway.trustedProxies` เมื่ออยู่หลังพร็อกซีย้อนกลับ
    - บันทึกของ Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามฟิลด์บริบททั้งหมด (ไม่ใช่เพียงบางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกระชับ (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - บันทึกของ Gateway แสดง `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ในบริบทของปุ่ม ตรวจสอบว่าได้รวมฟิลด์นี้ไว้เมื่อสร้างเพย์โหลดการผสานรวม
    - Gateway ปฏิเสธการคลิกด้วย `Unknown action`: `context.action_id` ไม่ตรงกับ `id` ของการดำเนินการใดๆ ในโพสต์ ตั้งค่าทั้งสองให้เป็นค่าที่ผ่านการปรับรูปแบบเดียวกัน
    - เอเจนต์ไม่เสนอปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ลงในการกำหนดค่าช่อง Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) - ช่องที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) - พฤติกรรมการแชทแบบกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) - ขั้นตอนการยืนยันตัวตนและการจับคู่สำหรับข้อความส่วนตัว
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
