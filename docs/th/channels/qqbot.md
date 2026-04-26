---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ QQ
    - คุณต้องตั้งค่าข้อมูลรับรองของ QQ Bot
    - คุณต้องการรองรับการแชตกลุ่มหรือแชตส่วนตัวของ QQ Bot
summary: การตั้งค่า การกำหนดค่า และการใช้งาน QQ Bot
title: บอต QQ
x-i18n:
    generated_at: "2026-04-26T11:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot เชื่อมต่อกับ OpenClaw ผ่าน QQ Bot API อย่างเป็นทางการ (WebSocket gateway) โดย
Plugin นี้รองรับแชตส่วนตัวแบบ C2C, ข้อความ @ ในกลุ่ม และข้อความใน guild channel พร้อม
สื่อสมบูรณ์แบบ (รูปภาพ, เสียง, วิดีโอ, ไฟล์)

สถานะ: Plugin ที่มาพร้อมในชุด รองรับข้อความส่วนตัว แชตกลุ่ม guild channel และ
สื่อ ไม่รองรับ reactions และ threads

## Plugin ที่มาพร้อมในชุด

OpenClaw รุ่นปัจจุบันมาพร้อม QQ Bot อยู่แล้ว ดังนั้น build แบบแพ็กเกจปกติจึงไม่ต้องมี
ขั้นตอน `openclaw plugins install` แยกต่างหาก

## การตั้งค่า

1. ไปที่ [QQ Open Platform](https://q.qq.com/) แล้วสแกน QR code ด้วย
   QQ บนโทรศัพท์ของคุณเพื่อสมัคร / เข้าสู่ระบบ
2. คลิก **Create Bot** เพื่อสร้างบอต QQ ใหม่
3. ค้นหา **AppID** และ **AppSecret** ในหน้าการตั้งค่าของบอต แล้วคัดลอกไว้

> AppSecret จะไม่ถูกเก็บในรูปแบบข้อความล้วน — หากคุณออกจากหน้านี้โดยไม่บันทึก
> คุณจะต้องสร้างอันใหม่อีกครั้ง

4. เพิ่ม channel:

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

คอนฟิกขั้นต่ำ:

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

ตัวแปรแวดล้อมของบัญชีค่าเริ่มต้น:

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

- การ fallback จาก env ใช้กับบัญชี QQ Bot ค่าเริ่มต้นเท่านั้น
- `openclaw channels add --channel qqbot --token-file ...` จะระบุ
  AppSecret เท่านั้น; ต้องมีการตั้งค่า AppID ไว้ในคอนฟิกหรือ `QQBOT_APP_ID` แล้ว
- `clientSecret` ยังรองรับอินพุต SecretRef ไม่ใช่แค่สตริงข้อความล้วน

### การตั้งค่าหลายบัญชี

รันบอต QQ หลายตัวภายใต้ OpenClaw อินสแตนซ์เดียว:

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

แต่ละบัญชีจะเปิดการเชื่อมต่อ WebSocket ของตัวเอง และดูแลแคชโทเค็นแยกจากกัน
(แยกตาม `appId`)

เพิ่มบอตตัวที่สองผ่าน CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### เสียง (STT / TTS)

การรองรับ STT และ TTS ใช้การกำหนดค่าแบบสองระดับพร้อม fallback ตามลำดับความสำคัญ:

| การตั้งค่า | เฉพาะ Plugin                                             | fallback ของเฟรมเวิร์ก       |
| ---------- | -------------------------------------------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

ตั้งค่า `enabled: false` ในอย่างใดอย่างหนึ่งเพื่อปิดใช้งาน
การ override TTS ระดับบัญชีใช้โครงสร้างเดียวกับ `messages.tts` และ deep-merge
ทับบนคอนฟิก TTS ระดับ channel/ส่วนกลาง

ไฟล์แนบเสียง QQ ขาเข้าจะถูกเปิดเผยให้เอเจนต์เห็นเป็น metadata สื่อเสียง ขณะที่
เก็บไฟล์เสียงดิบไว้นอก `MediaPaths` ทั่วไป การตอบกลับข้อความล้วน `[[audio_as_voice]]`
จะสังเคราะห์ TTS และส่งข้อความเสียง QQ แบบ native เมื่อมีการกำหนดค่า TTS ไว้

พฤติกรรมการอัปโหลด/แปลงรหัสเสียงขาออกยังสามารถปรับได้ด้วย
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## รูปแบบเป้าหมาย

| รูปแบบ                    | คำอธิบาย            |
| ------------------------- | ------------------- |
| `qqbot:c2c:OPENID`        | แชตส่วนตัว (C2C)    |
| `qqbot:group:GROUP_OPENID` | แชตกลุ่ม            |
| `qqbot:channel:CHANNEL_ID` | guild channel       |

> แต่ละบอตมีชุด OpenID ของผู้ใช้เป็นของตัวเอง OpenID ที่ได้รับโดย Bot A **ไม่สามารถ**
> ใช้ส่งข้อความผ่าน Bot B ได้

## คำสั่ง Slash

คำสั่งในตัวที่ถูกดักจับก่อนเข้าคิว AI:

| คำสั่ง         | คำอธิบาย                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | ทดสอบความหน่วง                                                                                      |
| `/bot-version` | แสดงเวอร์ชันเฟรมเวิร์ก OpenClaw                                                                      |
| `/bot-help`    | แสดงรายการคำสั่งทั้งหมด                                                                              |
| `/bot-upgrade` | แสดงลิงก์คู่มืออัปเกรด QQBot                                                                         |
| `/bot-logs`    | ส่งออก log ของ gateway ล่าสุดเป็นไฟล์                                                                 |
| `/bot-approve` | อนุมัติการกระทำ QQ Bot ที่รอดำเนินการอยู่ (เช่น การยืนยันการอัปโหลดแบบ C2C หรือกลุ่ม) ผ่านโฟลว์แบบ native |

เติม `?` ต่อท้ายคำสั่งใดก็ได้เพื่อดูวิธีใช้ (เช่น `/bot-upgrade ?`)

## สถาปัตยกรรมเอนจิน

QQ Bot มาพร้อมเอนจินแบบ self-contained ภายใน Plugin:

- แต่ละบัญชีเป็นเจ้าของสแตกทรัพยากรที่แยกขาดจากกัน (การเชื่อมต่อ WebSocket, API client, token cache, รากจัดเก็บสื่อ) โดยอิงตาม `appId` บัญชีจะไม่แชร์สถานะขาเข้า/ขาออกระหว่างกัน
- logger แบบหลายบัญชีจะติดแท็กบรรทัด log ด้วยบัญชีเจ้าของ เพื่อให้การวินิจฉัยแยกจากกันได้เมื่อคุณรันหลายบอตภายใต้ gateway เดียว
- เส้นทางขาเข้า ขาออก และ bridge ของ gateway ใช้ราก payload สื่อร่วมกันเพียงจุดเดียวภายใต้ `~/.openclaw/media` ดังนั้นการอัปโหลด ดาวน์โหลด และแคชการแปลงรหัสจะอยู่ในไดเรกทอรีที่มีการป้องกันเดียว แทนที่จะเป็นต้นไม้แยกตาม subsystem
- ข้อมูลรับรองสามารถสำรองและกู้คืนได้เป็นส่วนหนึ่งของ snapshot ข้อมูลรับรอง OpenClaw มาตรฐาน โดยเอนจินจะเชื่อมสแตกทรัพยากรของแต่ละบัญชีกลับเข้ามาใหม่ตอนกู้คืน โดยไม่ต้องจับคู่ QR code ใหม่

## การเริ่มใช้งานด้วย QR code

แทนการวาง `AppID:AppSecret` ด้วยตนเอง เอนจินรองรับโฟลว์เริ่มใช้งานด้วย QR code สำหรับเชื่อม QQ Bot เข้ากับ OpenClaw:

1. รันเส้นทางตั้งค่า QQ Bot (เช่น `openclaw channels add --channel qqbot`) แล้วเลือกโฟลว์ QR code เมื่อมีการถาม
2. สแกน QR code ที่สร้างขึ้นด้วยแอปบนโทรศัพท์ที่ผูกกับ QQ Bot เป้าหมาย
3. อนุมัติการจับคู่บนโทรศัพท์ OpenClaw จะจัดเก็บข้อมูลรับรองที่ส่งกลับไว้ใน `credentials/` ภายใต้ขอบเขตบัญชีที่ถูกต้อง

พรอมป์การอนุมัติที่สร้างโดยตัวบอตเอง (เช่น โฟลว์ "allow this action?" ที่เปิดเผยโดย QQ Bot API) จะปรากฏเป็นพรอมป์ OpenClaw แบบ native ซึ่งคุณสามารถยอมรับด้วย `/bot-approve` แทนการตอบกลับผ่านไคลเอนต์ QQ ดิบ

## การแก้ปัญหา

- **บอตตอบว่า "gone to Mars":** ยังไม่ได้กำหนดค่าข้อมูลรับรอง หรือ Gateway ยังไม่เริ่มทำงาน
- **ไม่มีข้อความขาเข้า:** ตรวจสอบว่า `appId` และ `clientSecret` ถูกต้อง และ
  บอตถูกเปิดใช้งานบน QQ Open Platform
- **ตอบกลับตัวเองซ้ำ ๆ:** OpenClaw จะบันทึกดัชนี ref ขาออกของ QQ ว่าเป็น
  ข้อความที่บอตเขียนเอง และจะละเว้นเหตุการณ์ขาเข้าที่มี `msgIdx` ปัจจุบันตรงกับ
  บัญชีบอตเดียวกันนั้น วิธีนี้ป้องกันลูป echo ของแพลตฟอร์ม แต่ยังคงให้ผู้ใช้ quote หรือ reply ข้อความบอตก่อนหน้าได้
- **ตั้งค่าด้วย `--token-file` แล้วยังขึ้นว่าไม่ได้กำหนดค่า:** `--token-file` จะตั้งค่า
  AppSecret เท่านั้น คุณยังต้องมี `appId` ในคอนฟิกหรือ `QQBOT_APP_ID`
- **ข้อความเชิงรุกส่งไม่ถึง:** QQ อาจสกัดกั้นข้อความที่เริ่มโดยบอต หาก
  ผู้ใช้ไม่ได้มีปฏิสัมพันธ์เมื่อไม่นานนี้
- **เสียงไม่ถูกถอดความ:** ตรวจสอบว่ามีการกำหนดค่า STT และ provider เข้าถึงได้

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [การแก้ปัญหา channel](/th/channels/troubleshooting)
