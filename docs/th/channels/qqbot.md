---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ QQ
    - คุณต้องตั้งค่าข้อมูลรับรองของ QQ Bot
    - คุณต้องการการรองรับแชตกลุ่มหรือแชตส่วนตัวของ QQ Bot
summary: การตั้งค่า การกำหนดค่า และการใช้งาน QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-25T13:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot เชื่อมต่อกับ OpenClaw ผ่าน QQ Bot API อย่างเป็นทางการ (เกตเวย์ WebSocket) โดย
Plugin รองรับแชตส่วนตัวแบบ C2C, group @messages และข้อความใน guild channel พร้อม
สื่อแบบสมบูรณ์ (รูปภาพ เสียง วิดีโอ ไฟล์)

สถานะ: Plugin ที่รวมมาให้ รองรับข้อความส่วนตัว แชตกลุ่ม guild channel และ
สื่อ ไม่รองรับ reactions และ threads

## Plugin ที่รวมมาให้

OpenClaw รุ่นปัจจุบันรวม QQ Bot มาให้แล้ว ดังนั้น build แบบแพ็กเกจตามปกติจึงไม่ต้อง
มีขั้นตอน `openclaw plugins install` แยกต่างหาก

## การตั้งค่า

1. ไปที่ [QQ Open Platform](https://q.qq.com/) และสแกน QR code ด้วย
   QQ บนโทรศัพท์ของคุณเพื่อลงทะเบียน / เข้าสู่ระบบ
2. คลิก **Create Bot** เพื่อสร้าง QQ bot ใหม่
3. ค้นหา **AppID** และ **AppSecret** ในหน้าการตั้งค่าของ bot แล้วคัดลอกไว้

> AppSecret จะไม่ถูกจัดเก็บเป็นข้อความล้วน — หากคุณออกจากหน้านี้โดยไม่บันทึก
> คุณจะต้องสร้างใหม่อีกครั้ง

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

## การกำหนดค่า

การกำหนดค่าขั้นต่ำ:

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

ตัวแปรสภาพแวดล้อมสำหรับบัญชีค่าเริ่มต้น:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret แบบอ้างอิงไฟล์:

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

- การ fallback ไปใช้ env มีผลกับบัญชี QQ Bot ค่าเริ่มต้นเท่านั้น
- `openclaw channels add --channel qqbot --token-file ...` จะระบุ
  AppSecret เท่านั้น; ต้องตั้งค่า AppID ไว้แล้วใน config หรือ `QQBOT_APP_ID`
- `clientSecret` รองรับอินพุตแบบ SecretRef ได้เช่นกัน ไม่ได้จำกัดแค่สตริงข้อความล้วน

### การตั้งค่าหลายบัญชี

รัน QQ bot หลายตัวภายใต้ OpenClaw อินสแตนซ์เดียว:

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

แต่ละบัญชีจะเปิดการเชื่อมต่อ WebSocket ของตัวเองและรักษาแคชโทเค็นแบบอิสระ
(แยกตาม `appId`)

เพิ่ม bot ตัวที่สองผ่าน CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### เสียง (STT / TTS)

การรองรับ STT และ TTS ใช้การกำหนดค่าแบบสองระดับพร้อม fallback ตามลำดับความสำคัญ:

| Setting | เฉพาะ Plugin         | fallback ระดับเฟรมเวิร์ก       |
| ------- | -------------------- | ------------------------------ |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

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
    },
  },
}
```

ตั้งค่า `enabled: false` ในรายการใดรายการหนึ่งเพื่อปิดใช้งาน

ไฟล์แนบเสียงขาเข้าจาก QQ จะถูกเปิดเผยให้เอเจนต์เห็นในรูปแบบ metadata ของสื่อเสียง โดย
ยังคงกันไฟล์เสียงดิบไม่ให้อยู่ใน `MediaPaths` ทั่วไป การตอบกลับข้อความล้วนแบบ `[[audio_as_voice]]`
จะสังเคราะห์ TTS และส่งข้อความเสียงแบบ native ของ QQ เมื่อมีการกำหนดค่า TTS
ไว้แล้ว

พฤติกรรมการอัปโหลด/แปลงรหัสเสียงขาออกยังสามารถปรับได้ด้วย
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## รูปแบบเป้าหมาย

| รูปแบบ                     | คำอธิบาย           |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | แชตส่วนตัว (C2C)    |
| `qqbot:group:GROUP_OPENID` | แชตกลุ่ม            |
| `qqbot:channel:CHANNEL_ID` | Guild channel      |

> แต่ละ bot จะมีชุด OpenID ของผู้ใช้เป็นของตัวเอง OpenID ที่ได้รับโดย Bot A **ไม่สามารถ**
> ใช้ส่งข้อความผ่าน Bot B ได้

## คำสั่ง slash

คำสั่งในตัวที่ถูกดักก่อนเข้าสู่คิว AI:

| คำสั่ง         | คำอธิบาย                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | ทดสอบ latency                                                                                            |
| `/bot-version` | แสดงเวอร์ชันเฟรมเวิร์ก OpenClaw                                                                          |
| `/bot-help`    | แสดงรายการคำสั่งทั้งหมด                                                                                   |
| `/bot-upgrade` | แสดงลิงก์คู่มืออัปเกรด QQBot                                                                             |
| `/bot-logs`    | ส่งออกล็อก Gateway ล่าสุดเป็นไฟล์                                                                         |
| `/bot-approve` | อนุมัติการดำเนินการ QQ Bot ที่รอดำเนินการอยู่ (เช่น การยืนยันการอัปโหลดแบบ C2C หรือกลุ่ม) ผ่านโฟลว์ native |

เติม `?` ต่อท้ายคำสั่งใดก็ได้เพื่อดูวิธีใช้ (เช่น `/bot-upgrade ?`)

## สถาปัตยกรรมของเอนจิน

QQ Bot มาพร้อมเอนจินแบบครบชุดภายใน Plugin:

- แต่ละบัญชีเป็นเจ้าของสแต็กทรัพยากรแบบแยกขาด (การเชื่อมต่อ WebSocket, API client, แคชโทเค็น, รากที่เก็บสื่อ) ที่อิงตาม `appId` บัญชีจะไม่แชร์สถานะขาเข้า/ขาออกร่วมกัน
- ตัวบันทึกหลายบัญชีจะติดแท็กบรรทัดล็อกด้วยบัญชีเจ้าของ เพื่อให้การวินิจฉัยแยกจากกันได้เมื่อคุณรันหลาย bot ภายใต้ gateway เดียว
- เส้นทางขาเข้า ขาออก และสะพานเชื่อม gateway ใช้ราก payload ของสื่อร่วมกันหนึ่งชุดภายใต้ `~/.openclaw/media` ดังนั้นการอัปโหลด การดาวน์โหลด และแคชการแปลงรหัสจะอยู่ในไดเรกทอรีที่มีการป้องกันเพียงแห่งเดียว แทนที่จะกระจายแยกตาม subsystem
- ข้อมูลรับรองสามารถสำรองและกู้คืนได้เป็นส่วนหนึ่งของสแนปชอตข้อมูลรับรองมาตรฐานของ OpenClaw โดยเอนจินจะผูกสแต็กทรัพยากรของแต่ละบัญชีกลับมาใหม่เมื่อกู้คืน โดยไม่ต้องจับคู่ QR code ใหม่

## การเริ่มต้นใช้งานด้วย QR code

นอกเหนือจากการวาง `AppID:AppSecret` ด้วยตนเอง เอนจินยังรองรับโฟลว์เริ่มต้นใช้งานด้วย QR code สำหรับเชื่อม QQ Bot เข้ากับ OpenClaw:

1. รันเส้นทางการตั้งค่า QQ Bot (เช่น `openclaw channels add --channel qqbot`) และเลือกโฟลว์ QR code เมื่อระบบถาม
2. สแกน QR code ที่สร้างขึ้นด้วยแอปบนโทรศัพท์ที่ผูกกับ QQ Bot เป้าหมาย
3. อนุมัติการจับคู่บนโทรศัพท์ OpenClaw จะบันทึกข้อมูลรับรองที่ส่งกลับไปไว้ใน `credentials/` ภายใต้ขอบเขตบัญชีที่ถูกต้อง

พรอมป์ตการอนุมัติที่สร้างโดย bot เอง (เช่น โฟลว์ “อนุญาตการดำเนินการนี้หรือไม่?” ที่เปิดเผยผ่าน QQ Bot API) จะปรากฏเป็นพรอมป์ต native ของ OpenClaw ซึ่งคุณสามารถยอมรับได้ด้วย `/bot-approve` แทนการตอบกลับผ่านไคลเอนต์ QQ แบบดิบ

## การแก้ปัญหา

- **Bot ตอบกลับว่า "gone to Mars":** ยังไม่ได้กำหนดค่าข้อมูลรับรอง หรือยังไม่ได้เริ่ม Gateway
- **ไม่มีข้อความขาเข้า:** ตรวจสอบว่า `appId` และ `clientSecret` ถูกต้อง และ
  bot ถูกเปิดใช้งานบน QQ Open Platform แล้ว
- **ตั้งค่าด้วย `--token-file` แล้วยังแสดงว่ายังไม่ได้กำหนดค่า:** `--token-file` ตั้งค่าเฉพาะ
  AppSecret เท่านั้น คุณยังต้องมี `appId` ใน config หรือ `QQBOT_APP_ID`
- **ข้อความเชิงรุกส่งไม่ถึง:** QQ อาจดักข้อความที่ bot เป็นฝ่ายเริ่มส่ง หาก
  ผู้ใช้ไม่ได้โต้ตอบมาเมื่อไม่นานนี้
- **ไม่มีการถอดเสียงข้อความเสียง:** ตรวจสอบว่าได้กำหนดค่า STT แล้ว และ provider เข้าถึงได้

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [Channel troubleshooting](/th/channels/troubleshooting)
