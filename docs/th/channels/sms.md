---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ SMS ผ่าน Twilio
    - คุณต้องตั้งค่า Webhook สำหรับ SMS หรือรายการที่อนุญาต
summary: การตั้งค่าช่องทาง SMS ของ Twilio การควบคุมการเข้าถึง และการกำหนดค่า Webhook
title: SMS
x-i18n:
    generated_at: "2026-07-16T18:48:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw รับและส่ง SMS ผ่านหมายเลขโทรศัพท์หรือ Messaging Service ของ Twilio โดย Gateway จะลงทะเบียนเส้นทาง Webhook ขาเข้า (ค่าเริ่มต้น `/webhooks/sms`) ตรวจสอบลายเซ็นคำขอของ Twilio ตามค่าเริ่มต้น และส่งข้อความตอบกลับผ่าน Messages API ของ Twilio

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับเฉพาะข้อความ: ไม่รองรับ MMS/สื่อ และรองรับเฉพาะข้อความโดยตรง

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ SMS คือการจับคู่
  </Card>
  <Card title="ความปลอดภัยของ Gateway" icon="shield" href="/th/gateway/security">
    ตรวจสอบการเปิดเผย Webhook และการควบคุมการเข้าถึงของผู้ส่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและซ่อมแซมที่ใช้ข้ามช่องทาง
  </Card>
</CardGroup>

## ก่อนเริ่มต้น

สิ่งที่ต้องมี:

- Plugin SMS อย่างเป็นทางการที่ติดตั้งด้วย `openclaw plugins install @openclaw/sms`
- บัญชี Twilio ที่มีหมายเลขโทรศัพท์ซึ่งรองรับ SMS หรือ Twilio Messaging Service
- Account SID และ Auth Token ของ Twilio
- URL HTTPS สาธารณะที่เข้าถึง OpenClaw Gateway ได้
- ตัวเลือกนโยบายผู้ส่ง: `pairing` (ค่าเริ่มต้น) สำหรับการใช้งานส่วนตัว, `allowlist` สำหรับหมายเลขโทรศัพท์ที่อนุมัติไว้ล่วงหน้า หรือ `open` เฉพาะเมื่อตั้งใจเปิดการเข้าถึง SMS เป็นสาธารณะ

หมายเลข Twilio หนึ่งหมายเลขสามารถให้บริการทั้ง SMS และ [การโทรด้วยเสียง](/th/plugins/voice-call) ได้ หากรองรับทั้งสองความสามารถ Webhook ของ SMS และ Webhook ของ Voice จะกำหนดค่าแยกกันใน Twilio และใช้เส้นทาง Gateway แยกกัน หน้านี้ครอบคลุมเฉพาะ Webhook ของ SMS

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="สร้างหรือเลือกผู้ส่ง Twilio">
    ใน Twilio ให้เปิด **Phone Numbers > Manage > Active numbers** แล้วเลือกหมายเลขที่รองรับ SMS บันทึกข้อมูลต่อไปนี้:

    - Account SID เช่น `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - หมายเลขโทรศัพท์ของผู้ส่ง เช่น `+15551234567`

    หากใช้ Messaging Service แทนหมายเลขผู้ส่งแบบตายตัว ให้บันทึก Messaging Service SID เช่น `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

  </Step>

  <Step title="กำหนดค่าช่องทาง SMS">

บันทึกข้อมูลนี้เป็น `sms.patch.json5` แล้วเปลี่ยนตัวยึดตำแหน่ง:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

นำไปใช้:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="ชี้ Twilio ไปยัง Webhook ของ Gateway">
    ในการตั้งค่าหมายเลขโทรศัพท์ Twilio ให้เปิด **Messaging** แล้วตั้งค่า **A message comes in** เป็น:

```text
https://gateway.example.com/webhooks/sms
```

    ใช้ HTTP `POST` เส้นทางภายในเริ่มต้นคือ `/webhooks/sms` ให้เปลี่ยน `channels.sms.webhookPath` หากต้องการใช้เส้นทางอื่น

  </Step>

  <Step title="เปิดเผยเส้นทาง Webhook ของ SMS ที่ตรงกัน">
    URL สาธารณะต้องกำหนดเส้นทาง SMS ไปยังกระบวนการ Gateway (พอร์ตเริ่มต้น `18789`) หากใช้ Tailscale Funnel สำหรับการทดสอบภายในเครื่อง ให้เปิดเผย `/webhooks/sms` อย่างชัดเจน:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    การโทรด้วยเสียงและ SMS ใช้เส้นทาง Webhook แยกกัน หากหมายเลข Twilio เดียวกันรองรับทั้งสองอย่าง ให้กำหนดค่าทั้งสองเส้นทางไว้ใน Twilio และในอุโมงค์ของคุณ

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติผู้ส่งรายแรก">

```bash
openclaw gateway
```

ส่งข้อความไปยังหมายเลข Twilio ข้อความแรกจะสร้างคำขอจับคู่ อนุมัติคำขอดังกล่าว:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

  </Step>
</Steps>

## ตัวอย่างการกำหนดค่า

คีย์ทั้งหมดอยู่ภายใต้ `channels.sms` (และอยู่ภายใต้ `channels.sms.accounts.<id>` สำหรับแต่ละบัญชี):

| คีย์                                     | ค่าเริ่มต้น         | วัตถุประสงค์                                                             |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | เปิดหรือปิดใช้งานช่องทาง/บัญชี                              |
| `accountSid`                            | —               | Twilio Account SID (`AC...`)                                       |
| `authToken`                             | —               | Twilio Auth Token; สตริงข้อความธรรมดาหรือ SecretRef                   |
| `fromNumber`                            | —               | หมายเลขผู้ส่งรูปแบบ E.164                                                |
| `messagingServiceSid`                   | —               | Messaging Service SID (`MG...`) ที่ใช้เมื่อไม่สามารถระบุ `fromNumber` ได้ |
| `defaultTo`                             | —               | ปลายทางเริ่มต้นเมื่อขั้นตอนการส่งไม่ได้ระบุเป้าหมายอย่างชัดเจน      |
| `webhookPath`                           | `/webhooks/sms` | เส้นทาง HTTP ของ Gateway สำหรับ Webhook ขาเข้าจาก Twilio                      |
| `publicWebhookUrl`                      | —               | URL สาธารณะที่กำหนดค่าใน Twilio; จำเป็นสำหรับการตรวจสอบลายเซ็น |
| `dangerouslyDisableSignatureValidation` | `false`         | ข้ามการตรวจสอบ `X-Twilio-Signature`; สำหรับการทดสอบอุโมงค์ภายในเครื่องเท่านั้น        |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` หรือ `disabled`                      |
| `allowFrom`                             | `[]`            | หมายเลขผู้ส่งที่อนุญาตในรูปแบบ E.164 หรือ `"*"` เมื่อใช้ `dmPolicy: "open"`  |
| `textChunkLimit`                        | `1500`          | จำนวนอักขระสูงสุดต่อส่วนข้อความ SMS ขาออก                          |
| `accounts`, `defaultAccount`            | —               | แมปหลายบัญชีและรหัสบัญชีเริ่มต้น                           |

### ไฟล์การกำหนดค่า

ใช้การตั้งค่าผ่านไฟล์การกำหนดค่าเมื่อต้องการให้ข้อกำหนดช่องทางติดไปกับการกำหนดค่า Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### ตัวแปรสภาพแวดล้อม

ตัวแปรสภาพแวดล้อมใช้กับบัญชีเริ่มต้นเท่านั้น ค่าการกำหนดค่ามีลำดับความสำคัญเหนือค่าจากสภาพแวดล้อม

| ตัวแปร                                        | แมปไปยัง                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (นามแฝง `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (คั่นด้วยจุลภาค)                      |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

จากนั้นเปิดใช้งานช่องทางในการกำหนดค่า:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Auth Token แบบ SecretRef

`authToken` สามารถเป็น SecretRef (`source: "env" | "file" | "exec"`) ได้ ใช้ตัวเลือกนี้เมื่อ Gateway ควรดึง Twilio Auth Token จากรันไทม์ความลับของ OpenClaw แทนการจัดเก็บการกำหนดค่าเป็นข้อความธรรมดา:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

ตัวแปรสภาพแวดล้อมหรือผู้ให้บริการความลับที่อ้างอิงต้องมองเห็นได้จากรันไทม์ Gateway รีสตาร์ตกระบวนการ Gateway ที่มีการจัดการหลังจากเปลี่ยนตัวแปรสภาพแวดล้อมของโฮสต์

### ผู้ส่งผ่าน Messaging Service

ใช้ `messagingServiceSid` แทน `fromNumber` เมื่อต้องการให้ Twilio เลือกผู้ส่งผ่าน Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

หากมีทั้ง `fromNumber` และ `messagingServiceSid` หลังจากระบุค่าจากการกำหนดค่าและสภาพแวดล้อมแล้ว ระบบจะใช้ `fromNumber`

### เป้าหมายขาออกเริ่มต้น

ตั้งค่า `defaultTo` เมื่อระบบอัตโนมัติหรือการส่งที่เริ่มต้นโดยเอเจนต์ควรมีปลายทางเริ่มต้น หากขั้นตอนการส่งไม่ได้ระบุเป้าหมายอย่างชัดเจน:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## การควบคุมการเข้าถึง

`channels.sms.dmPolicy` ควบคุมการเข้าถึง SMS โดยตรง:

- `pairing` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ อนุมัติด้วย `openclaw pairing approve sms <CODE>`
- `allowlist`: ประมวลผลเฉพาะผู้ส่งที่อยู่ใน `allowFrom` เท่านั้น หาก `allowFrom` ว่างเปล่า ระบบจะปฏิเสธผู้ส่งทุกราย (Gateway จะบันทึกคำเตือนเมื่อเริ่มต้น)
- `open`: การตรวจสอบความถูกต้องของการกำหนดค่ากำหนดให้ `allowFrom` ต้องมี `"*"` หากไม่มีไวลด์การ์ด จะมีเพียงหมายเลขที่ระบุไว้เท่านั้นที่สามารถแชตได้
- `disabled`: ระบบจะทิ้ง DM ขาเข้าทั้งหมด

รายการ `allowFrom` ควรเป็นหมายเลขโทรศัพท์รูปแบบ E.164 เช่น `+15551234567` ระบบยอมรับและปรับรูปแบบคำนำหน้า `sms:` และ `twilio-sms:` ให้เป็นมาตรฐาน สำหรับผู้ช่วยส่วนตัว ควรใช้ `dmPolicy: "allowlist"` พร้อมหมายเลขโทรศัพท์ที่ระบุอย่างชัดเจน:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## การส่ง SMS

เมื่อเลือกช่องทาง SMS แล้ว เป้าหมายจะยอมรับหมายเลข E.164 แบบไม่มีคำนำหน้าหรือคำนำหน้า `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

เมื่อมีการเลือกช่องทางโดยนัย คำนำหน้า `twilio-sms:` จะเลือกช่องทางนี้โดยไม่แทนที่คำนำหน้าบริการ `sms:` ซึ่ง iMessage ใช้เพื่อเลือกการส่ง SMS ผ่านเครือข่ายผู้ให้บริการสำหรับเป้าหมายของตนเอง:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI กำหนดให้ระบุ `--target` อย่างชัดเจน `defaultTo` มีไว้สำหรับระบบอัตโนมัติและเส้นทางการส่งที่เริ่มต้นโดยเอเจนต์ ซึ่งสามารถระบุเป้าหมายจากการกำหนดค่าช่องทางได้

คำตอบของเอเจนต์จากการสนทนา SMS ขาเข้าจะถูกส่งกลับไปยังผู้ส่งโดยอัตโนมัติผ่านผู้ส่ง Twilio ที่กำหนดค่าไว้

เอาต์พุต SMS เป็นข้อความธรรมดา OpenClaw จะลบมาร์กดาวน์ ปรับบล็อกโค้ดแบบมีรั้วให้เป็นข้อความบรรทัดเดียว เขียนลิงก์ใหม่เป็น `label (url)` และแบ่งคำตอบที่ยาวออกเป็นส่วนที่มีความยาวไม่เกิน `textChunkLimit` อักขระ (ค่าเริ่มต้น 1500) ก่อนส่งผ่าน Twilio

## ตรวจสอบการตั้งค่า

หลังจาก Gateway เริ่มทำงาน:

1. ยืนยันว่าบันทึกของ Gateway แสดงเส้นทาง Webhook ของ SMS
2. เรียกใช้การตรวจสอบจากฝั่ง Twilio (ตรวจสอบ URL/เมธอดของ Webhook Twilio ที่กำหนดค่าไว้และข้อผิดพลาดขาเข้าล่าสุด):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. ส่ง SMS จากโทรศัพท์ของคุณไปยังหมายเลข Twilio
4. เรียกใช้ `openclaw pairing list sms`
5. อนุมัติรหัสการจับคู่ด้วย `openclaw pairing approve sms <CODE>`
6. ส่ง SMS อีกครั้งและยืนยันว่าเอเจนต์ตอบกลับ

สำหรับการทดสอบขาออกเท่านั้น ให้ใช้:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "การทดสอบ SMS ของ OpenClaw"
```

### การทดสอบแบบต้นทางถึงปลายทางจาก iMessage/SMS บน macOS

บน Mac ที่สามารถส่ง SMS ผ่านเครือข่ายผู้ให้บริการด้วย Messages คุณสามารถใช้ `imsg` เพื่อควบคุมฝั่งผู้ส่งโดยไม่ต้องแตะโทรศัพท์:

```bash
imsg send --to "+15551234567" --service sms --text "การทดสอบ SMS E2E ของ OpenClaw $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "ตอบกลับว่า SMS pong เท่านั้น" --json
```

ข้อความแรกควรสร้างคำขอจับคู่ ข้อความที่สองควรได้รับคำตอบจากเอเจนต์ผ่าน Twilio

## ความปลอดภัยของ Webhook

โดยค่าเริ่มต้น OpenClaw จะตรวจสอบความถูกต้องของ `X-Twilio-Signature` โดยใช้ `publicWebhookUrl` และ `authToken` รักษาส่วนปลายทางของ `publicWebhookUrl` ให้ตรงกันทุกไบต์กับ URL ที่กำหนดค่าไว้ใน Twilio รวมถึงสคีมา โฮสต์ พาธ และสตริงคิวรี OpenClaw จะไม่นำแฟรกเมนต์ [การแทนที่การเชื่อมต่อ](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) ของ Twilio (`#...`) มาคำนวณลายเซ็น ตามข้อกำหนดของ Twilio

เส้นทาง Webhook ยังบังคับใช้ข้อกำหนดต่อไปนี้โดยไม่ขึ้นกับการตรวจสอบความถูกต้องของลายเซ็น:

- เฉพาะ `POST`
- โควตาคำขอที่ล้มเหลว 300 คำขอต่อนาทีต่อบัญชี SMS เส้นทาง Webhook และที่อยู่ไคลเอนต์ที่ระบุได้ คำขอทั้งหมดจะถูกนับรวมในโควตานี้ แต่จะใช้ HTTP 429 หลังจากคำขอล้มเหลวในการแยกวิเคราะห์เนื้อหา การตรวจสอบความถูกต้องโดย Twilio หรือการจับคู่ AccountSid เท่านั้น
- ขีดจำกัดอัตราคอลแบ็กที่ส่งต่อได้คือ 30 คอลแบ็กที่ยอมรับต่อนาทีต่อบัญชี SMS เส้นทาง Webhook และที่อยู่ไคลเอนต์ที่ระบุได้ หลังจากผ่านการตรวจสอบเหล่านั้นแล้ว (เกินกว่านี้จะได้รับ HTTP 429) หากปิดใช้งานการตรวจสอบลายเซ็น ขีดจำกัด 30 ครั้ง/นาทีนี้จะเป็นเพดานการส่งต่อที่ไม่ได้รับการยืนยันตัวตน
- ที่อยู่ไคลเอนต์จะถูกระบุผ่านกฎพร็อกซีที่เชื่อถือได้ร่วมกันของ Gateway หาก `gateway.trustedProxies` มีพร็อกซีย้อนกลับที่ส่งต่อคอลแบ็กของ Twilio OpenClaw จะใช้ที่อยู่ไคลเอนต์ที่ส่งต่อมาเป็นคีย์สำหรับขีดจำกัดเหล่านี้ มิฉะนั้นจะกลับไปใช้ที่อยู่ซ็อกเก็ตโดยตรง
- `AccountSid` ในเพย์โหลดต้องตรงกับ `accountSid` ที่กำหนดค่าไว้ (มิฉะนั้นจะได้รับ HTTP 403)
- ค่า `MessageSid` ที่ถูกเล่นซ้ำจะถูกขจัดรายการซ้ำเป็นเวลา 10 นาที
- แคชป้องกันการเล่นซ้ำของแต่ละบัญชี SMS จะเก็บ SID ของข้อความที่ยังใช้งานอยู่ได้สูงสุด 10,000 รายการ เมื่อทุกช่องยังใช้งานอยู่ Webhook ใหม่สำหรับบัญชีนั้นจะถูกปฏิเสธแบบปิดด้วย HTTP 429 และส่วนหัว `Retry-After` จนกว่าช่องที่เก่าที่สุดจะหมดอายุ
- เนื้อหาคำขอที่มีขนาดเกิน 32 KB จะถูกปฏิเสธ

โดยค่าเริ่มต้น Twilio จะไม่ลอง HTTP 429 ซ้ำและไม่ได้ระบุว่ารองรับ `Retry-After` การแทนที่การเชื่อมต่อ `#rp=4xx` และ `#rp=all` จะเลือกใช้การลองซ้ำสำหรับ 4xx แต่ Twilio จำกัดธุรกรรมการลองซ้ำทั้งหมดไว้ที่ 15 วินาที ดังนั้นการลองซ้ำอาจเสร็จสิ้นก่อนที่ช่องแคชป้องกันการเล่นซ้ำจะหมดอายุ กำหนดค่า URL สำรองเมื่อตัวจัดการอื่นต้องรับการส่งที่ล้มเหลว ให้ถือว่า 429 เป็นการปฏิเสธแบบปิด ไม่ใช่แรงดันย้อนกลับที่เชื่อถือได้

สำหรับการทดสอบผ่านทันเนลภายในเครื่องเท่านั้น คุณสามารถตั้งค่า:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

อย่าใช้การปิดใช้งานการตรวจสอบลายเซ็นบน Gateway สาธารณะ

## การกำหนดค่าหลายบัญชี

ใช้ `accounts` เมื่อคุณใช้งานหมายเลข Twilio มากกว่าหนึ่งหมายเลข:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

แต่ละบัญชีต้องใช้ `webhookPath` ที่ไม่ซ้ำกัน Gateway จะปฏิเสธการลงทะเบียนเส้นทาง Webhook ซึ่งมีพาธที่บัญชีอื่นเป็นเจ้าของอยู่แล้ว ค่าสำรองจากสภาพแวดล้อม `TWILIO_*`/`SMS_*` ใช้ได้กับบัญชีเริ่มต้นเท่านั้น ให้ตั้งค่า `defaultAccount` เพื่อเปลี่ยนว่าบัญชีใดเป็นบัญชีเริ่มต้น

## การแก้ไขปัญหา

### Twilio ส่งคืน 403 หรือ OpenClaw ปฏิเสธ Webhook

ตรวจสอบว่า `publicWebhookUrl` ตรงกับ URL ที่กำหนดค่าไว้ใน Twilio ทุกประการ รวมถึงสคีมา โฮสต์ พาธ และสตริงคิวรี Twilio ลงลายเซ็นสตริง URL สาธารณะ ดังนั้นการเขียน URL ใหม่โดยพร็อกซีและชื่อโฮสต์อื่นอาจทำให้การตรวจสอบลายเซ็นล้มเหลว

403 ที่มี `Invalid account` หมายความว่า `AccountSid` ของเพย์โหลดขาเข้าไม่ตรงกับ `accountSid` ที่กำหนดค่าไว้ โปรดตรวจสอบว่า Webhook ชี้ไปยังบัญชีที่เป็นเจ้าของหมายเลขนั้น

### ไม่มีคำขอจับคู่ปรากฏขึ้น

ตรวจสอบ URL และเมธอดของ Webhook **Messaging** สำหรับหมายเลข Twilio โดยต้องชี้ไปยัง URL ของ Webhook SMS และใช้ `POST` นอกจากนี้ให้ยืนยันว่า Gateway เข้าถึงได้จากอินเทอร์เน็ตสาธารณะหรือผ่านทันเนลของคุณ

หากบันทึกข้อความของ Twilio แสดงข้อผิดพลาด `11200` แสดงว่า Twilio ยอมรับ SMS ขาเข้าแล้วแต่ไม่สามารถเข้าถึง Webhook ของคุณได้ ตรวจสอบสิ่งต่อไปนี้:

- **Messaging > A message comes in** ของ Twilio ชี้ไปที่ `publicWebhookUrl`
- เมธอดคือ `POST`
- ทันเนลหรือพร็อกซีย้อนกลับเปิดเผย `webhookPath` ที่ตรงกันทุกประการ สำหรับ Tailscale Funnel ให้เรียกใช้ `tailscale funnel status` และยืนยันว่า `/webhooks/sms` อยู่ในรายการ
- `publicWebhookUrl` ใช้สคีมา โฮสต์ พาธ และสตริงคิวรีเดียวกับที่ Twilio ส่งมา เพื่อให้การตรวจสอบลายเซ็นสามารถสร้าง URL ที่ลงลายเซ็นไว้ซ้ำได้

`openclaw channels status --channel sms --probe` จะแสดงทั้งการตั้งค่า Webhook ของ Twilio ที่ไม่ตรงกันและข้อผิดพลาด `11200` ล่าสุด

### การส่งขาออกล้มเหลว

ยืนยันว่าสามารถระบุค่า `accountSid`, `authToken` และค่าใดค่าหนึ่งระหว่าง `fromNumber` หรือ `messagingServiceSid` ได้ หากคุณใช้บัญชีทดลองของ Twilio อาจต้องยืนยันหมายเลขปลายทางใน Twilio ก่อนจึงจะส่ง SMS ขาออกได้

### ข้อความมาถึงแต่เอเจนต์ไม่ตอบ

ตรวจสอบ `dmPolicy` และ `allowFrom` เมื่อใช้นโยบายเริ่มต้น `pairing` ผู้ส่งต้องได้รับการอนุมัติก่อนจึงจะประมวลผลรอบการทำงานปกติของเอเจนต์
