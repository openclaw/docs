---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ QQ
    - ต้องตั้งค่าข้อมูลประจำตัวของ QQ Bot
    - คุณต้องการการรองรับแชทกลุ่มหรือแชทส่วนตัวของ QQ Bot
summary: การตั้งค่าเริ่มต้น การกำหนดค่า และการใช้งาน QQ Bot
title: บอต QQ
x-i18n:
    generated_at: "2026-04-30T09:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot เชื่อมต่อกับ OpenClaw ผ่าน QQ Bot API อย่างเป็นทางการ (WebSocket gateway) Plugin
รองรับแชตส่วนตัวแบบ C2C, @messages ในกลุ่ม และข้อความในช่องกิลด์พร้อม
สื่อแบบ rich media (รูปภาพ, เสียง, วิดีโอ, ไฟล์)

สถานะ: Plugin ที่บันเดิลมา รองรับข้อความส่วนตัว, แชตกลุ่ม, ช่องกิลด์ และ
สื่อ ไม่รองรับรีแอ็กชันและเธรด

## Plugin ที่บันเดิลมา

OpenClaw รุ่นปัจจุบันบันเดิล QQ Bot มาด้วย ดังนั้นบิลด์แพ็กเกจปกติไม่จำเป็นต้องมี
ขั้นตอน `openclaw plugins install` แยกต่างหาก

## การตั้งค่า

1. ไปที่ [QQ Open Platform](https://q.qq.com/) แล้วสแกน QR code ด้วย
   QQ บนโทรศัพท์ของคุณเพื่อลงทะเบียน / เข้าสู่ระบบ
2. คลิก **Create Bot** เพื่อสร้าง QQ bot ใหม่
3. ค้นหา **AppID** และ **AppSecret** ในหน้าการตั้งค่าของบอท แล้วคัดลอกไว้

> AppSecret ไม่ถูกจัดเก็บเป็นข้อความธรรมดา — หากคุณออกจากหน้าโดยไม่ได้บันทึกไว้
> คุณจะต้องสร้างค่าใหม่

4. เพิ่มช่องทาง:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. รีสตาร์ต Gateway

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

## กำหนดค่า

ค่ากำหนดขั้นต่ำ:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

env vars สำหรับบัญชีเริ่มต้น:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret ที่อ้างอิงจากไฟล์:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

หมายเหตุ:

- Env fallback ใช้กับบัญชี QQ Bot เริ่มต้นเท่านั้น
- `openclaw channels add --channel qqbot --token-file ...` ให้เฉพาะ
  AppSecret เท่านั้น; AppID ต้องถูกตั้งไว้แล้วใน config หรือ `QQBOT_APP_ID`
- `clientSecret` ยังรับอินพุต SecretRef ได้ด้วย ไม่ใช่แค่สตริงข้อความธรรมดา

### การตั้งค่าหลายบัญชี

เรียกใช้ QQ bots หลายตัวภายใต้ OpenClaw instance เดียว:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

แต่ละบัญชีเริ่มการเชื่อมต่อ WebSocket ของตัวเอง และรักษา
token cache ที่แยกอิสระ (แยกตาม `appId`)

เพิ่มบอทตัวที่สองผ่าน CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### แชตกลุ่ม

การรองรับแชตกลุ่มของ QQ Bot ใช้ QQ group OpenIDs ไม่ใช่ชื่อที่แสดง เพิ่มบอท
เข้ากลุ่ม แล้วกล่าวถึงบอทหรือกำหนดค่ากลุ่มให้ทำงานโดยไม่ต้องกล่าวถึง

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` ตั้งค่าเริ่มต้นสำหรับทุกกลุ่ม และรายการ
`groups.GROUP_OPENID` ที่ระบุชัดเจนจะ override ค่าเริ่มต้นเหล่านั้นสำหรับกลุ่มเดียว การตั้งค่า
กลุ่มประกอบด้วย:

- `requireMention`: ต้องมี @mention ก่อนที่บอทจะตอบ ค่าเริ่มต้น: `true`
- `ignoreOtherMentions`: ตัดข้อความที่กล่าวถึงคนอื่นแต่ไม่ได้กล่าวถึงบอท
- `historyLimit`: เก็บข้อความกลุ่มล่าสุดที่ไม่ใช่การกล่าวถึงไว้เป็น context สำหรับรอบถัดไปที่มีการกล่าวถึง ตั้งเป็น `0` เพื่อปิดใช้
- `toolPolicy`: `full`, `restricted`, หรือ `none` สำหรับเครื่องมือในขอบเขตกลุ่ม
- `name`: ป้ายชื่อที่อ่านง่าย ใช้ใน logs และ context ของกลุ่ม
- `prompt`: prompt พฤติกรรมรายกลุ่มที่ผนวกเข้ากับ context ของ agent

โหมดการเปิดใช้งานคือ `mention` และ `always` `requireMention: true` map ไปยัง
`mention`; `requireMention: false` map ไปยัง `always` หากมี override การเปิดใช้งาน
ระดับ session ค่านั้นจะมีผลเหนือ config

คิวขาเข้าแยกตาม peer peer ของกลุ่มมีเพดานคิวที่ใหญ่กว่า เก็บข้อความมนุษย์
ไว้ก่อนข้อความสนทนาที่บอทเขียนเมื่อคิวเต็ม และรวม burst ของข้อความกลุ่มปกติ
ให้เป็น turn เดียวที่ระบุผู้ส่ง Slash commands ยังคงรันทีละรายการ

### เสียง (STT / TTS)

การรองรับ STT และ TTS ใช้การกำหนดค่าสองระดับพร้อม fallback ตามลำดับความสำคัญ:

| การตั้งค่า | เฉพาะ Plugin                                            | Framework fallback           |
| ---------- | -------------------------------------------------------- | ---------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`               |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

ตั้ง `enabled: false` บนรายการใดรายการหนึ่งเพื่อปิดใช้
TTS override ระดับบัญชีใช้รูปทรงเดียวกับ `messages.tts` และ deep-merge
ทับ config TTS ระดับช่องทาง/ส่วนกลาง

ไฟล์แนบเสียงขาเข้าของ QQ ถูกเปิดเผยต่อ agents เป็น metadata สื่อเสียง ในขณะที่
กันไฟล์เสียงดิบออกจาก `MediaPaths` ทั่วไป ข้อความตอบกลับแบบ plain text `[[audio_as_voice]]`
จะสังเคราะห์ TTS และส่งข้อความเสียง QQ แบบ native เมื่อกำหนดค่า TTS แล้ว

พฤติกรรมการอัปโหลด/transcode เสียงขาออกยังปรับแต่งได้ด้วย
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## รูปแบบเป้าหมาย

| รูปแบบ                    | คำอธิบาย            |
| ------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | แชตส่วนตัว (C2C)   |
| `qqbot:group:GROUP_OPENID` | แชตกลุ่ม           |
| `qqbot:channel:CHANNEL_ID` | ช่องกิลด์          |

> บอทแต่ละตัวมีชุด OpenIDs ของผู้ใช้เป็นของตัวเอง OpenID ที่ได้รับโดย Bot A **ไม่สามารถ**
> ใช้ส่งข้อความผ่าน Bot B ได้

## Slash commands

คำสั่งในตัวที่ถูกดักก่อนคิว AI:

| คำสั่ง         | คำอธิบาย                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `/bot-ping`    | ทดสอบ latency                                                                                          |
| `/bot-version` | แสดงเวอร์ชันของ OpenClaw framework                                                                     |
| `/bot-help`    | แสดงรายการคำสั่งทั้งหมด                                                                                |
| `/bot-me`      | แสดง QQ user ID (openid) ของผู้ส่งสำหรับการตั้งค่า `allowFrom`/`groupAllowFrom`                       |
| `/bot-upgrade` | แสดงลิงก์คู่มือการอัปเกรด QQBot                                                                         |
| `/bot-logs`    | ส่งออก gateway logs ล่าสุดเป็นไฟล์                                                                     |
| `/bot-approve` | อนุมัติการดำเนินการ QQ Bot ที่รอดำเนินการ (เช่น ยืนยันการอัปโหลด C2C หรือกลุ่ม) ผ่าน native flow |

เติม `?` ต่อท้ายคำสั่งใดก็ได้เพื่อดูวิธีใช้ (เช่น `/bot-upgrade ?`)

คำสั่งผู้ดูแล (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) ใช้ได้เฉพาะข้อความส่วนตัว และต้องมี openid ของผู้ส่งอยู่ในรายการ `allowFrom` แบบไม่ใช่ wildcard ที่ระบุชัดเจน wildcard `allowFrom: ["*"]` อนุญาตให้แชตได้ แต่ไม่ให้สิทธิ์เข้าถึงคำสั่งผู้ดูแล ข้อความกลุ่มจะ match กับ `groupAllowFrom` ก่อน แล้ว fallback ไปยัง `allowFrom` การรันคำสั่งผู้ดูแลในกลุ่มจะส่งคำใบ้กลับ แทนที่จะทิ้งไปเงียบ ๆ

## สถาปัตยกรรมของเอนจิน

QQ Bot จัดส่งเป็นเอนจินแบบ self-contained ภายใน Plugin:

- แต่ละบัญชีเป็นเจ้าของ resource stack ที่แยกอิสระ (การเชื่อมต่อ WebSocket, API client, token cache, media storage root) ซึ่งผูกกับ `appId` บัญชีต่าง ๆ จะไม่แชร์สถานะขาเข้า/ขาออกกัน
- logger แบบหลายบัญชีจะติดแท็กบรรทัด log ด้วยบัญชีเจ้าของ เพื่อให้การวินิจฉัยแยกจากกันได้เมื่อคุณรันหลายบอทภายใต้ Gateway เดียว
- เส้นทางขาเข้า, ขาออก และ gateway bridge ใช้ media payload root เดียวร่วมกันภายใต้ `~/.openclaw/media` ดังนั้นการอัปโหลด, ดาวน์โหลด และ transcode caches จะอยู่ใต้ไดเรกทอรีที่มีการป้องกันเดียว แทนที่จะเป็นต้นไม้แยกตาม subsystem
- การส่ง rich media ใช้เส้นทาง `sendMedia` เดียวสำหรับเป้าหมาย C2C และกลุ่ม ไฟล์ในเครื่องและ buffers ที่ใหญ่กว่าเกณฑ์ไฟล์ขนาดใหญ่ใช้ endpoints อัปโหลดแบบ chunked ของ QQ ขณะที่ payloads ที่เล็กกว่าใช้ one-shot media API
- ข้อมูลรับรองสามารถสำรองและกู้คืนเป็นส่วนหนึ่งของ snapshot ข้อมูลรับรองมาตรฐานของ OpenClaw ได้; เอนจินจะ re-attach resource stack ของแต่ละบัญชีเมื่อกู้คืน โดยไม่ต้องจับคู่ QR-code ใหม่

## การเริ่มใช้งานด้วย QR-code

อีกทางเลือกหนึ่งนอกจากการวาง `AppID:AppSecret` ด้วยตนเอง เอนจินรองรับ flow การเริ่มใช้งานด้วย QR-code สำหรับการเชื่อมโยง QQ Bot กับ OpenClaw:

1. รันเส้นทางการตั้งค่า QQ Bot (เช่น `openclaw channels add --channel qqbot`) แล้วเลือก flow แบบ QR-code เมื่อระบบถาม
2. สแกน QR code ที่สร้างขึ้นด้วยแอปโทรศัพท์ที่ผูกกับ QQ Bot เป้าหมาย
3. อนุมัติการจับคู่บนโทรศัพท์ OpenClaw จะบันทึกข้อมูลรับรองที่ส่งกลับเข้าไปใน `credentials/` ภายใต้ขอบเขตบัญชีที่ถูกต้อง

prompt การอนุมัติที่สร้างโดยบอทเอง (เช่น flow "allow this action?" ที่เปิดเผยโดย QQ Bot API) จะปรากฏเป็น prompt แบบ native ของ OpenClaw ที่คุณยอมรับได้ด้วย `/bot-approve` แทนการตอบผ่าน QQ client ดิบ

## การแก้ไขปัญหา

- **บอทตอบว่า "gone to Mars":** ยังไม่ได้กำหนดค่าข้อมูลรับรอง หรือ Gateway ยังไม่ได้เริ่มทำงาน
- **ไม่มีข้อความขาเข้า:** ตรวจสอบว่า `appId` และ `clientSecret` ถูกต้อง และ
  บอทถูกเปิดใช้งานบน QQ Open Platform แล้ว
- **บอทตอบตัวเองซ้ำ:** OpenClaw บันทึก QQ outbound ref indexes เป็น
  สิ่งที่บอทเขียน และละเว้น events ขาเข้าที่ `msgIdx` ปัจจุบันตรงกับ
  บัญชีบอทเดียวกันนั้น วิธีนี้ป้องกัน platform echo loops ขณะที่ยังอนุญาตให้ผู้ใช้
  quote หรือตอบกลับข้อความก่อนหน้าของบอทได้
- **ตั้งค่าด้วย `--token-file` แล้วยังแสดงว่ายังไม่ได้กำหนดค่า:** `--token-file` ตั้งค่าเฉพาะ
  AppSecret เท่านั้น คุณยังต้องมี `appId` ใน config หรือ `QQBOT_APP_ID`
- **ข้อความเชิงรุกไม่มาถึง:** QQ อาจดักข้อความที่บอทเริ่มส่งเอง หาก
  ผู้ใช้ไม่ได้โต้ตอบเมื่อเร็ว ๆ นี้
- **เสียงไม่ถูกถอดความ:** ตรวจสอบว่าได้กำหนดค่า STT แล้ว และ provider ติดต่อได้

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
