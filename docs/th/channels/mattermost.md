---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทาง Mattermost
sidebarTitle: Mattermost
summary: การตั้งค่าบอต Mattermost และการกำหนดค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T18:44:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้ (โทเค็นบอต + เหตุการณ์ WebSocket) รองรับแชนเนล แชนเนลส่วนตัว DM แบบกลุ่ม และ DM โดย Mattermost เป็นแพลตฟอร์มรับส่งข้อความสำหรับทีมที่โฮสต์เองได้ ([mattermost.com](https://mattermost.com))

## ติดตั้ง

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

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ตรวจสอบว่า Plugin พร้อมใช้งาน">
    ติดตั้ง `@openclaw/mattermost` ด้วยคำสั่งด้านบน แล้วรีสตาร์ต Gateway หากกำลังทำงานอยู่
  </Step>
  <Step title="สร้างบอต Mattermost">
    สร้างบัญชีบอต Mattermost คัดลอก **โทเค็นบอต** และเพิ่มบอตไปยังทีมและแชนเนลที่ต้องการให้บอตอ่าน
  </Step>
  <Step title="คัดลอก URL ฐาน">
    คัดลอก **URL ฐาน** ของ Mattermost (เช่น `https://chat.example.com`) ระบบจะตัด `/api/v4` ที่ท้าย URL ออกโดยอัตโนมัติ
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
สำหรับ Mattermost ที่โฮสต์เองบนที่อยู่ส่วนตัว/LAN/tailnet: คำขอขาออกไปยัง API ของ Mattermost จะผ่านตัวป้องกัน SSRF ซึ่งบล็อก IP ส่วนตัวและ IP ภายในตามค่าเริ่มต้น เลือกเปิดใช้ด้วย `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (ต่อบัญชี: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`)
</Note>

## คำสั่งสแลชแบบเนทีฟ

คำสั่งสแลชแบบเนทีฟต้องเลือกเปิดใช้ เมื่อเปิดใช้แล้ว OpenClaw จะลงทะเบียนคำสั่งสแลช `oc_*` ในทุกทีมที่บอตเป็นสมาชิก และรับ callback แบบ POST บนเซิร์ฟเวอร์ HTTP ของ Gateway

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

คำสั่งที่ลงทะเบียน: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue` เมื่อใช้ `nativeSkills: true` ระบบจะลงทะเบียนคำสั่ง Skills เป็น `/oc_<skill>` ด้วย

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับลักษณะการทำงาน">
    - `native` และ `nativeSkills` มีค่าเริ่มต้นเป็น `"auto"` ซึ่งจะถูกตีความว่าปิดใช้งานสำหรับ Mattermost ให้ตั้งค่าเป็น `true` อย่างชัดเจน
    - `callbackPath` มีค่าเริ่มต้นเป็น `/api/channels/mattermost/command`
    - หากไม่ระบุ `callbackUrl` OpenClaw จะสร้าง `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` ขึ้นมา โฮสต์ที่ผูกแบบไวลด์การ์ด (`0.0.0.0`, `::`) จะใช้ `localhost` เป็นค่าทดแทน
    - สำหรับการตั้งค่าหลายบัญชี สามารถตั้ง `commands` ที่ระดับบนสุดหรือภายใต้ `channels.mattermost.accounts.<id>.commands` ได้ (ค่าของบัญชีมีลำดับความสำคัญเหนือฟิลด์ระดับบนสุด)
    - คำสั่งสแลชที่มีทริกเกอร์เดียวกันและสร้างโดยการผสานรวมอื่นจะไม่ถูกแก้ไข (ระบบจะข้ามการลงทะเบียน) ส่วนคำสั่งที่บอตสร้างจะถูกอัปเดตหรือสร้างใหม่เมื่อ URL callback เปลี่ยนไป
    - callback ของคำสั่งจะได้รับการตรวจสอบด้วยโทเค็นประจำคำสั่งที่ Mattermost ส่งคืนเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
    - OpenClaw รีเฟรชการลงทะเบียนคำสั่ง Mattermost ปัจจุบันก่อนยอมรับ callback แต่ละครั้ง ดังนั้นโทเค็นเก่าจากคำสั่งสแลชที่ถูกลบหรือสร้างใหม่จะหยุดได้รับการยอมรับโดยไม่ต้องรีสตาร์ต Gateway
    - การตรวจสอบ callback จะปฏิเสธโดยค่าเริ่มต้นหาก API ของ Mattermost ไม่สามารถยืนยันได้ว่าคำสั่งยังเป็นปัจจุบัน ระบบจะแคชผลการตรวจสอบที่ล้มเหลวไว้ชั่วครู่ รวมการค้นหาที่เกิดพร้อมกัน และจำกัดอัตราการเริ่มค้นหาใหม่ต่อคำสั่งเพื่อควบคุมแรงกดดันจากการเล่นซ้ำ
    - callback ของคำสั่งสแลชจะปฏิเสธโดยค่าเริ่มต้นเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นระบบสำเร็จเพียงบางส่วน หรือโทเค็น callback ไม่ตรงกับโทเค็นที่ลงทะเบียนของคำสั่งที่ระบุได้ (โทเค็นที่ใช้ได้กับคำสั่งหนึ่งจะไม่สามารถผ่านไปยังการตรวจสอบต้นทางสำหรับอีกคำสั่งหนึ่ง)
    - callback ที่ยอมรับแล้วจะได้รับการตอบรับด้วยข้อความชั่วคราว "กำลังประมวลผล..." โดยคำตอบจริงจะส่งมาเป็นข้อความปกติ

  </Accordion>
  <Accordion title="ข้อกำหนดด้านการเข้าถึง">
    เซิร์ฟเวอร์ Mattermost ต้องสามารถเข้าถึงปลายทาง callback ได้

    - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw
    - อย่าตั้ง `callbackUrl` เป็น URL ฐานของ Mattermost เว้นแต่ URL นั้นจะทำพร็อกซีย้อนกลับ `/api/channels/mattermost/command` ไปยัง OpenClaw
    - การตรวจสอบอย่างรวดเร็วทำได้ด้วย `curl https://<gateway-host>/api/channels/mattermost/command`; GET ควรได้รับ `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`

  </Accordion>
  <Accordion title="รายการอนุญาตขาออกของ Mattermost">
    หาก callback มุ่งไปยังที่อยู่ส่วนตัว/tailnet/ภายใน ให้ตั้งค่า `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost ให้รวมโฮสต์/โดเมนของ callback

    ใช้รายการโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม

    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

หากต้องการใช้ตัวแปรสภาพแวดล้อม ให้ตั้งค่าต่อไปนี้บนโฮสต์ของ Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชี **เริ่มต้น** (`default`) บัญชีอื่นต้องใช้ค่าการกำหนดค่า

ไม่สามารถตั้ง `MATTERMOST_URL` จาก `.env` ของเวิร์กสเปซได้ โปรดดู [ไฟล์ .env ของเวิร์กสเปซ](/th/gateway/security)
</Note>

## โหมดแชต

Mattermost ตอบกลับ DM โดยอัตโนมัติ ลักษณะการทำงานในแชนเนลควบคุมด้วย `chatmode`:

<Tabs>
  <Tab title="oncall (ค่าเริ่มต้น)">
    ตอบกลับในแชนเนลเฉพาะเมื่อถูก @กล่าวถึง
  </Tab>
  <Tab title="onmessage">
    ตอบกลับทุกข้อความในแชนเนล
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
- ระบบยังคงใช้ `channels.mattermost.requireMention` แต่แนะนำให้ใช้ `chatmode` การตั้งค่า `groups.<channelId>.requireMention` ต่อแชนเนลมีลำดับความสำคัญเหนือทั้งสองค่า
- หลังจากบอตส่งการตอบกลับที่มองเห็นได้ในเธรดของแชนเนล ข้อความภายหลังในเธรดเดียวกันจะได้รับการตอบโดยไม่ต้อง @กล่าวถึงใหม่หรือใช้คำนำหน้า `onchar` ทำให้การสนทนาหลายรอบในเธรดดำเนินต่อเนื่องได้ ระบบจะจดจำการเข้าร่วมเป็นเวลา 7 วันหลังจากที่บอตตอบกลับในเธรดนั้นครั้งล่าสุด และข้อมูลจะยังคงอยู่หลังรีสตาร์ต Gateway เธรดที่บอตเพียงสังเกตการณ์จะไม่ได้รับผลกระทบ หากต้องการให้ต้องกล่าวถึงอย่างชัดเจนอีกครั้ง ให้เริ่มข้อความระดับบนสุดใหม่

## เธรดและเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบกลับในแชนเนลและกลุ่มจะอยู่ในแชนเนลหลักหรือเริ่มเธรดใต้โพสต์ที่ทริกเกอร์

- `off` (ค่าเริ่มต้น): ตอบกลับในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดในแชนเนล/กลุ่ม ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยังเซสชันที่มีขอบเขตเฉพาะเธรด
- `all` และ `batched`: ปัจจุบันมีลักษณะการทำงานเหมือน `first` สำหรับ Mattermost เนื่องจากเมื่อ Mattermost มีรากเธรดแล้ว ส่วนข้อความและสื่อที่ตามมาจะอยู่ในเธรดเดิมต่อไป
- ข้อความโดยตรงมีค่าเริ่มต้นเป็น `off` แม้จะตั้ง `replyToMode` ไว้

ใช้ `channels.mattermost.replyToModeByChatType` เพื่อลบล้างโหมดสำหรับแชตประเภท `direct`, `group` หรือ `channel` ตั้ง `direct` เพื่อเลือกให้ข้อความโดยตรงใช้เธรด:

- `off` (ค่าเริ่มต้น): ข้อความโดยตรงจะไม่มีเธรดและอยู่ในเซสชันต่อเนื่องเดียว
- `first`, `all` หรือ `batched`: ข้อความโดยตรงระดับบนสุดแต่ละข้อความจะเริ่มเธรด Mattermost ที่รองรับด้วยเซสชันใหม่ซึ่งเป็นอิสระจากกัน

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

- เซสชันที่มีขอบเขตเฉพาะเธรดใช้ ID ของโพสต์ที่ทริกเกอร์เป็นรากเธรด
- ปัจจุบัน `first` และ `all` เทียบเท่ากัน เนื่องจากเมื่อ Mattermost มีรากเธรดแล้ว ส่วนข้อความและสื่อที่ตามมาจะอยู่ในเธรดเดิมต่อไป
- การลบล้างตามประเภทแชตมีลำดับความสำคัญเหนือ `replyToMode` หากไม่มีการลบล้าง `direct` ระบบที่ติดตั้งใช้งานอยู่จะคง DM แบบราบและไม่มีเธรดไว้

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่) ค่าอื่นๆ ได้แก่ `allowlist`, `open`, `disabled`
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM สาธารณะ: `channels.mattermost.dmPolicy="open"` ร่วมกับ `channels.mattermost.allowFrom=["*"]` (สคีมาการกำหนดค่าบังคับให้ใช้ไวลด์การ์ด)
- `channels.mattermost.allowFrom` รองรับ ID ผู้ใช้ (แนะนำ) และรายการ `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)

## แชนเนล (กลุ่ม)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (ต้องกล่าวถึง)
- กำหนดรายการผู้ส่งที่อนุญาตด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ ID ผู้ใช้)
- `channels.mattermost.groupAllowFrom` รองรับรายการ `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- การลบล้างข้อกำหนดการกล่าวถึงต่อแชนเนลอยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention` หรือใช้ `channels.mattermost.groups["*"].requireMention` เป็นค่าเริ่มต้น
- การจับคู่ `@username` สามารถเปลี่ยนแปลงได้และจะเปิดใช้เฉพาะเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- แชนเนลแบบเปิด: `channels.mattermost.groupPolicy="open"` (ต้องกล่าวถึง)
- ลำดับการระบุ: `channels.mattermost.groupPolicy` จากนั้น `channels.defaults.groupPolicy` แล้วจึง `"allowlist"`
- หมายเหตุเกี่ยวกับรันไทม์: หากไม่มีส่วน `channels.mattermost` โดยสิ้นเชิง รันไทม์จะปฏิเสธโดยค่าเริ่มต้นเป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้) และบันทึกคำเตือนหนึ่งครั้ง

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
| `channel:<id>`                      | แชนเนลตาม ID                                                 |
| `channel:<name>` หรือ `#channel-name` | แชนเนลตามชื่อ โดยค้นหาในทุกทีมที่บอตเป็นสมาชิก |
| `user:<id>` หรือ `mattermost:<id>`    | DM กับผู้ใช้รายนั้น                                             |
| `@username`                         | DM (ระบุชื่อผู้ใช้ผ่าน API ของ Mattermost)                 |

การส่งขาออกรองรับไฟล์แนบได้สูงสุดหนึ่งไฟล์ต่อข้อความ หากมีหลายไฟล์ ให้แยกส่งเป็นคนละข้อความ

<Warning>
ID แบบทึบที่ไม่มีคำนำหน้า (เช่น `64ifufp...`) มีความ **กำกวม** ใน Mattermost (ID ผู้ใช้เทียบกับ ID แชนเนล)

OpenClaw จะระบุเป็น **ผู้ใช้ก่อน**:

- หาก ID มีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่ง **DM** โดยระบุแชนเนลข้อความโดยตรงผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถูกถือว่าเป็น **ID แชนเนล**

หากต้องการลักษณะการทำงานที่กำหนดแน่นอน ให้ใช้คำนำหน้าแบบชัดเจนเสมอ (`user:<id>` / `channel:<id>`)
</Warning>

## การลองแชนเนล DM ใหม่

เมื่อ OpenClaw ส่งข้อความไปยังเป้าหมาย DM ของ Mattermost และจำเป็นต้องระบุช่องทางโดยตรงก่อน ระบบจะลองสร้างช่องทางโดยตรงใหม่โดยค่าเริ่มต้นหากเกิดความล้มเหลวชั่วคราว

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับลักษณะการทำงานนี้โดยรวมสำหรับ Plugin Mattermost หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว ค่าเริ่มต้น:

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

- การตั้งค่านี้ใช้เฉพาะกับการสร้างช่องทาง DM (`/api/v4/channels/direct`) ไม่ใช่ทุกการเรียกใช้ API ของ Mattermost
- การลองใหม่ใช้การหน่วงเวลาแบบเอ็กซ์โพเนนเชียลร่วมกับค่าคลาดเคลื่อนแบบสุ่ม และใช้กับความล้มเหลวชั่วคราว เช่น การจำกัดอัตรา การตอบกลับ 5xx รวมถึงข้อผิดพลาดของเครือข่ายหรือการหมดเวลา
- ข้อผิดพลาดไคลเอนต์ 4xx นอกเหนือจาก `429` จะถือเป็นข้อผิดพลาดถาวรและจะไม่มีการลองใหม่

## การสตรีมตัวอย่าง

Mattermost สตรีมการคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **โพสต์ตัวอย่างฉบับร่าง** ซึ่งจะถูกปรับให้สมบูรณ์ในตำแหน่งเดิมเมื่อส่งคำตอบสุดท้ายได้อย่างปลอดภัย ในโหมด `partial` ตัวอย่างจะอัปเดตโดยใช้รหัสโพสต์เดิมแทนที่จะส่งข้อความแยกสำหรับทุกส่วนจนรบกวนช่องทาง ในโหมด `block` ตัวอย่างจะสลับระหว่างข้อความที่เสร็จสมบูรณ์กับบล็อกกิจกรรมของเครื่องมือ ทำให้บล็อกก่อนหน้ายังคงมองเห็นเป็นโพสต์แยกของตนเองแทนที่จะถูกบล็อกถัดไปเขียนทับ ผลลัพธ์สุดท้ายที่เป็นสื่อหรือข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ และใช้การนำส่งตามปกติแทนการส่งโพสต์ตัวอย่างชั่วคราวที่ไม่จำเป็น

การสตรีมตัวอย่าง **เปิดอยู่โดยค่าเริ่มต้น** ในโหมด `partial` กำหนดค่าผ่าน `channels.mattermost.streaming.mode` (ค่าแบบสเกลาร์/บูลีนเดิมของ `streaming` จะถูกย้ายโดย `openclaw doctor --fix`):

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
    - `partial` (ค่าเริ่มต้น): โพสต์ตัวอย่างหนึ่งโพสต์ซึ่งถูกแก้ไขตามคำตอบที่เพิ่มขึ้น จากนั้นปรับให้สมบูรณ์ด้วยคำตอบฉบับเต็ม
    - `block` จะสลับตัวอย่างระหว่างข้อความที่เสร็จสมบูรณ์กับบล็อกกิจกรรมของเครื่องมือ ทำให้แต่ละบล็อกยังคงมองเห็นเป็นโพสต์แยกของตนเองแทนที่จะถูกเขียนทับในตำแหน่งเดิม การอัปเดตเครื่องมือทั้งแบบขนานและต่อเนื่องจะใช้โพสต์กิจกรรมของเครื่องมือปัจจุบันร่วมกัน
    - `progress` แสดงตัวอย่างสถานะระหว่างการสร้าง และโพสต์เฉพาะคำตอบสุดท้ายเมื่อเสร็จสมบูรณ์
    - `off` ปิดใช้การสตรีมตัวอย่าง เมื่อใช้ `streaming.block.enabled: true` บล็อกของผู้ช่วยที่เสร็จสมบูรณ์จะยังคงถูกนำส่งเป็นการตอบกลับแบบบล็อกตามปกติ (โพสต์แยกกัน) แทนที่จะรวมเป็นโพสต์สุดท้ายเพียงโพสต์เดียว

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับลักษณะการสตรีม">
    - หากไม่สามารถปรับสตรีมให้สมบูรณ์ในตำแหน่งเดิมได้ (เช่น โพสต์ถูกลบระหว่างการสตรีม) OpenClaw จะเปลี่ยนไปส่งโพสต์สุดท้ายใหม่ เพื่อไม่ให้คำตอบสูญหาย
    - เพย์โหลดที่มีเฉพาะการคิดจะถูกระงับไม่ให้แสดงในโพสต์ของช่องทาง รวมถึงข้อความที่เข้ามาเป็นบล็อกคำพูด `> Thinking` ตั้งค่า `/reasoning on` เพื่อดูการคิดในพื้นผิวอื่น ส่วนโพสต์สุดท้ายของ Mattermost จะเก็บเฉพาะคำตอบ
    - ดูเมทริกซ์การแมปช่องทางได้ที่ [การสตรีม](/th/concepts/streaming#preview-streaming-modes)

  </Accordion>
</AccordionGroup>

## รีแอ็กชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` ร่วมกับ `channel=mattermost`
- `messageId` คือรหัสโพสต์ Mattermost
- `emoji` รองรับชื่อ เช่น `thumbsup` หรือ `:+1:` (ไม่จำเป็นต้องใส่เครื่องหมายทวิภาค)
- ตั้งค่า `remove=true` (บูลีน) เพื่อลบรีแอ็กชัน
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันจะถูกส่งต่อเป็นเหตุการณ์ระบบไปยังเซสชันเอเจนต์ที่กำหนดเส้นทาง โดยอยู่ภายใต้การตรวจสอบนโยบาย DM/กลุ่มแบบเดียวกับข้อความ

ตัวอย่าง:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การกำหนดค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการดำเนินการเกี่ยวกับรีแอ็กชัน (ค่าเริ่มต้น true)
- การแทนที่สำหรับแต่ละบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (เครื่องมือข้อความ)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม เอเจนต์จะได้รับตัวเลือกและสามารถตอบสนองได้

ปุ่มมาจากเพย์โหลดเชิงความหมาย `presentation` (ในคำตอบปกติของเอเจนต์และใน `message action=send`) OpenClaw เรนเดอร์ปุ่มค่าเป็นปุ่มโต้ตอบของ Mattermost ทำให้ปุ่ม URL ยังคงมองเห็นได้ในข้อความ และลดระดับเมนูตัวเลือกเป็นข้อความที่อ่านได้

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

ฟิลด์ของปุ่มการนำเสนอ:

<ParamField path="label" type="string" required>
  ป้ายชื่อที่แสดง (ชื่อแทน: `text`)
</ParamField>
<ParamField path="value" type="string">
  ค่าที่ส่งกลับเมื่อคลิก ซึ่งใช้เป็นรหัสการดำเนินการ (ชื่อแทน: `callback_data`, `callbackData`) จำเป็นสำหรับปุ่มที่คลิกได้ เว้นแต่จะตั้งค่า `url`
</ParamField>
<ParamField path="url" type="string">
  ปุ่มลิงก์ ซึ่งเรนเดอร์เป็นข้อความ `label: url` ในเนื้อหาข้อความแทนปุ่มโต้ตอบ
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  รูปแบบปุ่ม Mattermost จะใช้รูปแบบเริ่มต้นกับค่าที่ไม่รองรับ
</ParamField>

หากต้องการประกาศการรองรับปุ่มในพรอมต์ระบบของเอเจนต์ ให้เพิ่ม `inlineButtons` ลงในความสามารถของช่องทาง:

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
    ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **Yes** ถูกเลือกโดย @user")
  </Step>
  <Step title="เอเจนต์ได้รับตัวเลือก">
    เอเจนต์จะได้รับตัวเลือกเป็นข้อความขาเข้า (พร้อมเหตุการณ์ระบบ) และตอบสนอง
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุการนำไปใช้">
    - คอลแบ็กของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องกำหนดค่า)
    - บล็อกไฟล์แนบทั้งหมดจะถูกแทนที่เมื่อคลิก ดังนั้นปุ่มทั้งหมดจะถูกลบพร้อมกัน จึงไม่สามารถลบเพียงบางส่วนได้
    - รหัสการดำเนินการที่มีเครื่องหมายยัติภังค์หรือขีดล่างจะถูกปรับรูปแบบโดยอัตโนมัติ (ข้อจำกัดการกำหนดเส้นทางของ Mattermost)
    - การคลิกที่มี `action_id` ไม่ตรงกับการดำเนินการในโพสต์ต้นฉบับจะถูกปฏิเสธด้วย `403` ("การดำเนินการที่ไม่รู้จัก")

  </Accordion>
  <Accordion title="การกำหนดค่าและการเข้าถึง">
    - `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อเปิดใช้คำอธิบายเครื่องมือปุ่มในพรอมต์ระบบของเอเจนต์
    - `channels.mattermost.interactions.callbackBaseUrl`: URL ฐานภายนอกแบบไม่บังคับสำหรับคอลแบ็กของปุ่ม (เช่น `https://gateway.example.com`) ใช้ค่านี้เมื่อ Mattermost ไม่สามารถเข้าถึง Gateway ที่โฮสต์การผูกของ Gateway ได้โดยตรง
    - ในการตั้งค่าหลายบัญชี สามารถตั้งค่าฟิลด์เดียวกันภายใต้ `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` ได้เช่นกัน
    - หากละเว้น `interactions.callbackBaseUrl` OpenClaw จะสร้าง URL คอลแบ็กจาก `gateway.customBindHost` + `gateway.port` (ค่าเริ่มต้น 18789) แล้วจึงเปลี่ยนไปใช้ `http://localhost:<port>` หากไม่สำเร็จ พาธคอลแบ็กคือ `/mattermost/interactions/<accountId>`
    - กฎการเข้าถึง: เซิร์ฟเวอร์ Mattermost ต้องเข้าถึง URL คอลแบ็กของปุ่มได้ `localhost` ใช้งานได้เฉพาะเมื่อ Mattermost และ OpenClaw ทำงานบนโฮสต์/เนมสเปซเครือข่ายเดียวกัน
    - `channels.mattermost.interactions.allowedSourceIps`: รายการอนุญาต IP ต้นทางสำหรับคอลแบ็กของปุ่ม หากไม่มีค่านี้ ระบบจะยอมรับเฉพาะต้นทางลูปแบ็ก (`127.0.0.1`, `::1`) ดังนั้นต้องเพิ่มเซิร์ฟเวอร์ Mattermost ระยะไกลลงในรายการอนุญาตนี้ มิฉะนั้นการคลิกจะถูกปฏิเสธด้วย `403` หากอยู่หลังพร็อกซีย้อนกลับ ให้ตั้งค่า `gateway.trustedProxies` ด้วย เพื่อให้ระบบระบุ IP จริงของไคลเอนต์จากส่วนหัวที่ส่งต่อ
    - หากเป้าหมายคอลแบ็กเป็นแบบส่วนตัว/tailnet/ภายใน ให้เพิ่มโฮสต์/โดเมนของเป้าหมายลงใน `ServiceSettings.AllowedUntrustedInternalConnections` ของ Mattermost

  </Accordion>
</AccordionGroup>

### การผสานรวม API โดยตรง (สคริปต์ภายนอก)

สคริปต์และ Webhook ภายนอกสามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API แทนการผ่านเครื่องมือ `message` ของเอเจนต์ ควรใช้เครื่องมือ `message` ของ OpenClaw สำหรับการผสานรวมโดยตรง ให้นำเข้า `buildButtonAttachments` จาก `@openclaw/mattermost/api.js` หากโพสต์ JSON ดิบ ให้ปฏิบัติตามกฎเหล่านี้:

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

1. ไฟล์แนบต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (จะถูกเพิกเฉยโดยไม่มีการแจ้งเตือน)
2. ทุกการดำเนินการต้องมี `type: "button"` หากไม่มี การคลิกจะถูกกลืนโดยไม่มีการแจ้งเตือน
3. ทุกการดำเนินการต้องมีฟิลด์ `id` Mattermost จะเพิกเฉยต่อการดำเนินการที่ไม่มีรหัส
4. `id` ของการดำเนินการต้องมี **เฉพาะตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) เครื่องหมายยัติภังค์และขีดล่างทำให้การกำหนดเส้นทางการดำเนินการฝั่งเซิร์ฟเวอร์ของ Mattermost ขัดข้อง (ส่งคืน 404) ให้นำอักขระเหล่านี้ออกก่อนใช้
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม Gateway จะปฏิเสธการคลิกที่มี `action_id` ซึ่งไม่มีอยู่ในโพสต์
6. จำเป็นต้องมี `context.action_id` ตัวจัดการการโต้ตอบจะส่งคืน 400 หากไม่มีค่านี้
7. ต้องอนุญาต IP ต้นทางของคอลแบ็ก (ดู `interactions.allowedSourceIps` ด้านบน)

</Warning>

**การสร้างโทเค็น HMAC**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็นที่ตรงกับตรรกะการตรวจสอบของ Gateway:

<Steps>
  <Step title="สร้างข้อมูลลับจากโทเค็นบอต">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)` โดยเข้ารหัสเป็นเลขฐานสิบหก
  </Step>
  <Step title="สร้างออบเจ็กต์บริบท">
    สร้างออบเจ็กต์บริบทด้วยทุกฟิลด์ **ยกเว้น** `_token`
  </Step>
  <Step title="ทำให้เป็นอนุกรมด้วยคีย์ที่เรียงลำดับ">
    ทำให้เป็นอนุกรมโดยใช้ **คีย์ที่เรียงลำดับแบบเวียนเกิด** และ **ไม่มีช่องว่าง** (Gateway ปรับออบเจ็กต์ที่ซ้อนกันให้เป็นรูปแบบมาตรฐานด้วย และสร้าง JSON แบบกระชับ)
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
  <Accordion title="ข้อผิดพลาดทั่วไปเกี่ยวกับ HMAC">
    - `json.dumps` ของ Python จะเพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ใช้ `separators=(",", ":")` เพื่อให้ตรงกับเอาต์พุตแบบกระชับของ JavaScript (`{"key":"val"}`)
    - ลงนามฟิลด์บริบท **ทั้งหมด** เสมอ (ยกเว้น `_token`) Gateway จะตัด `_token` ออก แล้วลงนามทุกอย่างที่เหลือ การลงนามเพียงบางส่วนทำให้การตรวจสอบล้มเหลวโดยไม่มีข้อความแจ้ง
    - ใช้ `sort_keys=True` เนื่องจาก Gateway จะเรียงลำดับคีย์ก่อนลงนาม และ Mattermost อาจจัดลำดับฟิลด์บริบทใหม่เมื่อจัดเก็บเพย์โหลด
    - สร้างค่าลับจากโทเค็นบอต (แบบกำหนดผลลัพธ์ได้แน่นอน) ไม่ใช่จากไบต์แบบสุ่ม ค่าลับต้องเหมือนกันทั้งในกระบวนการที่สร้างปุ่มและ Gateway ที่ทำการตรวจสอบ

  </Accordion>
</AccordionGroup>

## อะแดปเตอร์ไดเรกทอรี

Plugin Mattermost มีอะแดปเตอร์ไดเรกทอรีที่แปลงชื่อช่องและชื่อผู้ใช้ผ่าน Mattermost API ซึ่งทำให้สามารถใช้เป้าหมาย `#channel-name` และ `@username` ใน `openclaw message send` รวมถึงการส่งผ่าน cron/webhook ได้

ไม่จำเป็นต้องกำหนดค่า เนื่องจากอะแดปเตอร์จะใช้โทเค็นบอตจากการกำหนดค่าบัญชี

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

ค่าของบัญชีจะแทนที่ฟิลด์ระดับบนสุด ส่วน `channels.mattermost.defaultAccount` จะเลือกบัญชีที่จะใช้เมื่อไม่ได้ระบุบัญชี

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบว่าบอตอยู่ในช่องและกล่าวถึงบอต (oncall), ใช้คำนำหน้าทริกเกอร์ (onchar) หรือตั้งค่า `chatmode: "onmessage"`
  </Accordion>
  <Accordion title="ข้อผิดพลาดในการยืนยันตัวตนหรือหลายบัญชี">
    - ตรวจสอบโทเค็นบอต, URL ฐาน และตรวจสอบว่าบัญชีเปิดใช้งานอยู่หรือไม่
    - ปัญหาเกี่ยวกับหลายบัญชี: ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชี `default`
    - โฮสต์ Mattermost แบบส่วนตัว/LAN ต้องใช้ `network.dangerouslyAllowPrivateNetwork: true` (การป้องกัน SSRF จะบล็อก IP ส่วนตัวโดยค่าเริ่มต้น)

  </Accordion>
  <Accordion title="คำสั่งเครื่องหมายทับแบบเนทีฟล้มเหลว">
    - `Unauthorized: invalid command token.`: OpenClaw ไม่ยอมรับโทเค็นคอลแบ็ก สาเหตุทั่วไป ได้แก่:
      - การลงทะเบียนคำสั่งเครื่องหมายทับล้มเหลวหรือเสร็จสมบูรณ์เพียงบางส่วนเมื่อเริ่มต้นระบบ
      - คอลแบ็กส่งไปยัง Gateway/บัญชีที่ไม่ถูกต้อง
      - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมายคอลแบ็กก่อนหน้า
      - Gateway เริ่มต้นใหม่โดยไม่ได้เปิดใช้งานคำสั่งเครื่องหมายทับอีกครั้ง
    - หากคำสั่งเครื่องหมายทับแบบเนทีฟหยุดทำงาน ให้ตรวจสอบบันทึกสำหรับ `mattermost: failed to register slash commands` หรือ `mattermost: native slash commands enabled but no commands could be registered`
    - หากละเว้น `callbackUrl` และบันทึกเตือนว่าคอลแบ็กถูกแปลงเป็น URL ลูปแบ็ก เช่น `http://localhost:18789/...` URL ดังกล่าวอาจเข้าถึงได้เฉพาะเมื่อ Mattermost ทำงานอยู่บนโฮสต์/เนมสเปซเครือข่ายเดียวกับ OpenClaw ให้ตั้งค่า `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับปุ่ม">
    - ปุ่มปรากฏเป็นกล่องสีขาวหรือไม่ปรากฏเลย: ข้อมูลปุ่มมีรูปแบบไม่ถูกต้อง ปุ่มนำเสนอแต่ละปุ่มต้องมี `label` และ `value` (ปุ่มที่ขาดรายการใดรายการหนึ่งจะถูกทิ้ง)
    - ปุ่มแสดงผลแต่เมื่อคลิกแล้วไม่มีการดำเนินการ: ตรวจสอบว่าสามารถเข้าถึง Gateway จากเซิร์ฟเวอร์ Mattermost ได้, IP ของเซิร์ฟเวอร์ Mattermost รวมอยู่ใน `channels.mattermost.interactions.allowedSourceIps` (หากไม่มีค่านี้จะยอมรับเฉพาะลูปแบ็ก) และ `ServiceSettings.AllowedUntrustedInternalConnections` มีโฮสต์คอลแบ็กสำหรับเป้าหมายส่วนตัว
    - ปุ่มส่งคืน 404 เมื่อคลิก: `id` ของปุ่มอาจมีเครื่องหมายขีดกลางหรือขีดล่าง เราเตอร์การดำเนินการของ Mattermost ไม่รองรับ ID ที่มีอักขระอื่นนอกจากตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
    - Gateway บันทึก `rejected callback source`: การคลิกมาจาก IP ที่อยู่นอก `interactions.allowedSourceIps` เพิ่มเซิร์ฟเวอร์ Mattermost หรือขาเข้าของคุณลงในรายการอนุญาต และตั้งค่า `gateway.trustedProxies` เมื่ออยู่หลังพร็อกซีย้อนกลับ
    - Gateway บันทึก `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามฟิลด์บริบททั้งหมด (ไม่ใช่เพียงบางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบกระชับ (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
    - Gateway บันทึก `missing _token in context`: ฟิลด์ `_token` ไม่อยู่ในบริบทของปุ่ม ตรวจสอบว่าได้รวมฟิลด์นี้ไว้เมื่อสร้างเพย์โหลดการผสานรวม
    - Gateway ปฏิเสธการคลิกด้วย `Unknown action`: `context.action_id` ไม่ตรงกับ `id` ของการดำเนินการใดๆ ในโพสต์ ตั้งค่าทั้งสองให้เป็นค่าที่ผ่านการปรับรูปแบบเดียวกัน
    - เอเจนต์ไม่เสนอปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ลงในการกำหนดค่าช่อง Mattermost

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) - ช่องทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) - ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
