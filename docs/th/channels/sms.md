---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ SMS ผ่าน Twilio
    - คุณต้องตั้งค่า Webhook สำหรับ SMS หรือรายการที่อนุญาต
summary: การตั้งค่าช่องทาง SMS ของ Twilio การควบคุมการเข้าถึง และการกำหนดค่า Webhook
title: SMS
x-i18n:
    generated_at: "2026-07-12T15:54:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw รับและส่ง SMS ผ่านหมายเลขโทรศัพท์หรือ Messaging Service ของ Twilio โดย Gateway จะลงทะเบียนเส้นทาง Webhook ขาเข้า (ค่าเริ่มต้นคือ `/webhooks/sms`) ตรวจสอบลายเซ็นคำขอของ Twilio ตามค่าเริ่มต้น และส่งข้อความตอบกลับผ่าน Messages API ของ Twilio

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับเฉพาะข้อความ: ไม่รองรับ MMS/สื่อ และรองรับเฉพาะข้อความส่วนตัว

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบายข้อความส่วนตัวเริ่มต้นสำหรับ SMS คือการจับคู่
  </Card>
  <Card title="ความปลอดภัยของ Gateway" icon="shield" href="/th/gateway/security">
    ตรวจสอบการเปิดเผย Webhook และการควบคุมสิทธิ์เข้าถึงของผู้ส่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและแก้ไขปัญหาที่ใช้ได้กับหลายช่องทาง
  </Card>
</CardGroup>

## ก่อนเริ่มต้น

สิ่งที่ต้องมี:

- Plugin SMS อย่างเป็นทางการที่ติดตั้งด้วย `openclaw plugins install @openclaw/sms`
- บัญชี Twilio ที่มีหมายเลขโทรศัพท์ซึ่งรองรับ SMS หรือ Twilio Messaging Service
- Account SID และ Auth Token ของ Twilio
- URL HTTPS สาธารณะที่เข้าถึง OpenClaw Gateway ของคุณได้
- นโยบายผู้ส่งที่เลือกไว้: `pairing` (ค่าเริ่มต้น) สำหรับการใช้งานส่วนตัว, `allowlist` สำหรับหมายเลขโทรศัพท์ที่อนุมัติไว้ล่วงหน้า หรือ `open` เฉพาะเมื่อตั้งใจเปิดให้เข้าถึงผ่าน SMS แบบสาธารณะ

หมายเลข Twilio หนึ่งหมายเลขสามารถใช้ได้ทั้ง SMS และ [การโทรด้วยเสียง](/th/plugins/voice-call) หากรองรับความสามารถทั้งสองอย่าง Webhook สำหรับ SMS และ Webhook สำหรับเสียงต้องกำหนดค่าแยกกันใน Twilio และใช้เส้นทาง Gateway คนละเส้นทาง หน้านี้กล่าวถึงเฉพาะ Webhook สำหรับ SMS

## การตั้งค่าด่วน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="สร้างหรือเลือกผู้ส่งใน Twilio">
    ใน Twilio ให้เปิด **Phone Numbers > Manage > Active numbers** แล้วเลือกหมายเลขที่รองรับ SMS บันทึกข้อมูลต่อไปนี้:

    - Account SID เช่น `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - หมายเลขโทรศัพท์ของผู้ส่ง เช่น `+15551234567`

    หากใช้ Messaging Service แทนหมายเลขผู้ส่งแบบคงที่ ให้บันทึก Messaging Service SID เช่น `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

  </Step>

  <Step title="กำหนดค่าช่องทาง SMS">

บันทึกข้อมูลนี้เป็น `sms.patch.json5` แล้วเปลี่ยนค่าตัวแทน:

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

  <Step title="กำหนดให้ Twilio ชี้ไปยัง Webhook ของ Gateway">
    ในการตั้งค่าหมายเลขโทรศัพท์ของ Twilio ให้เปิด **Messaging** แล้วตั้งค่า **A message comes in** เป็น:

```text
https://gateway.example.com/webhooks/sms
```

    ใช้ HTTP `POST` เส้นทางภายในเริ่มต้นคือ `/webhooks/sms` ให้เปลี่ยน `channels.sms.webhookPath` หากต้องการใช้เส้นทางอื่น

  </Step>

  <Step title="เปิดเผยเส้นทาง Webhook สำหรับ SMS ที่ตรงกันทุกประการ">
    URL สาธารณะของคุณต้องกำหนดเส้นทาง SMS ไปยังกระบวนการ Gateway (พอร์ตเริ่มต้นคือ `18789`) หากใช้ Tailscale Funnel สำหรับการทดสอบภายในเครื่อง ให้เปิดเผย `/webhooks/sms` อย่างชัดเจน:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    การโทรด้วยเสียงและ SMS ใช้เส้นทาง Webhook แยกกัน หากหมายเลข Twilio เดียวกันรองรับทั้งสองอย่าง ให้คงการกำหนดค่าทั้งสองเส้นทางไว้ใน Twilio และในอุโมงค์เครือข่ายของคุณ

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติผู้ส่งรายแรก">

```bash
openclaw gateway
```

ส่งข้อความไปยังหมายเลข Twilio ข้อความแรกจะสร้างคำขอจับคู่ ให้อนุมัติด้วยคำสั่งต่อไปนี้:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง

  </Step>
</Steps>

## ตัวอย่างการกำหนดค่า

คีย์ทั้งหมดอยู่ภายใต้ `channels.sms` (และสำหรับแต่ละบัญชีจะอยู่ภายใต้ `channels.sms.accounts.<id>`):

| คีย์                                    | ค่าเริ่มต้น      | วัตถุประสงค์                                                        |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | เปิดหรือปิดใช้งานช่องทาง/บัญชี                                      |
| `accountSid`                            | —               | Account SID ของ Twilio (`AC...`)                                    |
| `authToken`                             | —               | Auth Token ของ Twilio โดยเป็นสตริงข้อความธรรมดาหรือ SecretRef       |
| `fromNumber`                            | —               | หมายเลขผู้ส่งในรูปแบบ E.164                                         |
| `messagingServiceSid`                   | —               | Messaging Service SID (`MG...`) ที่ใช้เมื่อหา `fromNumber` ไม่ได้    |
| `defaultTo`                             | —               | ปลายทางเริ่มต้นเมื่อขั้นตอนการส่งไม่ได้ระบุเป้าหมายอย่างชัดเจน       |
| `webhookPath`                           | `/webhooks/sms` | เส้นทาง HTTP ของ Gateway สำหรับ Webhook ขาเข้าจาก Twilio            |
| `publicWebhookUrl`                      | —               | URL สาธารณะที่กำหนดค่าใน Twilio ซึ่งจำเป็นสำหรับการตรวจสอบลายเซ็น   |
| `dangerouslyDisableSignatureValidation` | `false`         | ข้ามการตรวจสอบ `X-Twilio-Signature` ใช้สำหรับทดสอบอุโมงค์ภายในเครื่องเท่านั้น |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` หรือ `disabled`                      |
| `allowFrom`                             | `[]`            | หมายเลขผู้ส่งที่อนุญาตในรูปแบบ E.164 หรือ `"*"` เมื่อใช้ `dmPolicy: "open"` |
| `textChunkLimit`                        | `1500`          | จำนวนอักขระสูงสุดต่อส่วนข้อความ SMS ขาออก                            |
| `accounts`, `defaultAccount`            | —               | แมปหลายบัญชีและรหัสบัญชีเริ่มต้น                                    |

### ไฟล์การกำหนดค่า

ใช้การตั้งค่าผ่านไฟล์การกำหนดค่าเมื่อต้องการให้คำจำกัดความของช่องทางอยู่ร่วมกับการกำหนดค่า Gateway:

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

ตัวแปรสภาพแวดล้อมมีผลเฉพาะกับบัญชีเริ่มต้น ค่าจากการกำหนดค่ามีลำดับความสำคัญเหนือค่าจากตัวแปรสภาพแวดล้อม

| ตัวแปร                                           | เชื่อมโยงกับ                                         |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (นามแฝง `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (คั่นด้วยจุลภาค)                       |
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

`authToken` สามารถเป็น SecretRef (`source: "env" | "file" | "exec"`) ได้ ใช้รูปแบบนี้เมื่อต้องการให้ Gateway ดึง Auth Token ของ Twilio จากระบบรันไทม์ข้อมูลลับของ OpenClaw แทนการจัดเก็บการกำหนดค่าเป็นข้อความธรรมดา:

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

ตัวแปรสภาพแวดล้อมหรือผู้ให้บริการข้อมูลลับที่อ้างอิงต้องมองเห็นได้จากรันไทม์ของ Gateway ให้เริ่มกระบวนการ Gateway ที่มีการจัดการใหม่หลังจากเปลี่ยนตัวแปรสภาพแวดล้อมของโฮสต์

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

หากมีทั้ง `fromNumber` และ `messagingServiceSid` หลังจากประมวลผลค่าจากการกำหนดค่าและตัวแปรสภาพแวดล้อมแล้ว ระบบจะใช้ `fromNumber`

### เป้าหมายขาออกเริ่มต้น

ตั้งค่า `defaultTo` เมื่อการทำงานอัตโนมัติหรือการส่งที่เริ่มต้นโดยเอเจนต์ควรมีปลายทางเริ่มต้นในกรณีที่ขั้นตอนการส่งไม่ได้ระบุเป้าหมายอย่างชัดเจน:

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
- `allowlist`: ระบบจะประมวลผลเฉพาะผู้ส่งที่อยู่ใน `allowFrom` หาก `allowFrom` ว่างเปล่า ระบบจะปฏิเสธผู้ส่งทุกราย (Gateway จะบันทึกคำเตือนเมื่อเริ่มทำงาน)
- `open`: การตรวจสอบการกำหนดค่ากำหนดให้ `allowFrom` ต้องมี `"*"` หากไม่มีอักขระตัวแทนนี้ เฉพาะหมายเลขที่ระบุไว้เท่านั้นที่สามารถสนทนาได้
- `disabled`: ข้อความส่วนตัวขาเข้าทั้งหมดจะถูกละทิ้ง

รายการใน `allowFrom` ควรเป็นหมายเลขโทรศัพท์รูปแบบ E.164 เช่น `+15551234567` ระบบยอมรับและปรับรูปแบบคำนำหน้า `sms:` และ `twilio-sms:` ให้เป็นมาตรฐาน สำหรับผู้ช่วยส่วนตัว ควรใช้ `dmPolicy: "allowlist"` พร้อมระบุหมายเลขโทรศัพท์อย่างชัดเจน:

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

เมื่อเลือกช่องทาง SMS เป้าหมายสามารถเป็นหมายเลข E.164 โดยตรงหรือใช้คำนำหน้า `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

เมื่อเลือกช่องทางโดยปริยาย คำนำหน้า `twilio-sms:` จะเลือกช่องทางนี้โดยไม่แทนที่คำนำหน้าบริการ `sms:` ซึ่ง iMessage ใช้เพื่อเลือกการส่ง SMS ผ่านเครือข่ายผู้ให้บริการสำหรับเป้าหมายของตนเอง:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI กำหนดให้ต้องระบุ `--target` อย่างชัดเจน ส่วน `defaultTo` ใช้สำหรับเส้นทางการส่งแบบอัตโนมัติและการส่งที่เริ่มต้นโดยเอเจนต์ ซึ่งสามารถกำหนดเป้าหมายจากการกำหนดค่าช่องทางได้

ข้อความตอบกลับของเอเจนต์จากการสนทนา SMS ขาเข้าจะถูกส่งกลับไปยังผู้ส่งโดยอัตโนมัติผ่านผู้ส่ง Twilio ที่กำหนดค่าไว้

ผลลัพธ์ SMS เป็นข้อความธรรมดา OpenClaw จะลบมาร์กดาวน์ แปลงบล็อกโค้ดแบบมีรั้วเป็นข้อความบรรทัดเดียว เขียนลิงก์ใหม่เป็น `label (url)` และแบ่งข้อความตอบกลับยาวออกเป็นส่วนที่มีความยาวไม่เกิน `textChunkLimit` อักขระ (ค่าเริ่มต้น 1500) ก่อนส่งผ่าน Twilio

## ตรวจสอบการตั้งค่า

หลังจาก Gateway เริ่มทำงาน:

1. ยืนยันว่าบันทึกของ Gateway แสดงเส้นทาง Webhook สำหรับ SMS
2. เรียกใช้การตรวจสอบฝั่ง Twilio (ตรวจสอบ URL/เมธอดของ Webhook Twilio ที่กำหนดค่าไว้และข้อผิดพลาดขาเข้าล่าสุด):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. ส่ง SMS จากโทรศัพท์ของคุณไปยังหมายเลข Twilio
4. เรียกใช้ `openclaw pairing list sms`
5. อนุมัติรหัสการจับคู่ด้วย `openclaw pairing approve sms <CODE>`
6. ส่ง SMS อีกครั้งและยืนยันว่าเอเจนต์ตอบกลับ

สำหรับการทดสอบเฉพาะขาออก ให้ใช้:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### การทดสอบแบบต้นทางถึงปลายทางจาก iMessage/SMS บน macOS

บน Mac ที่สามารถส่ง SMS ผ่านเครือข่ายผู้ให้บริการด้วย Messages ได้ คุณสามารถใช้ `imsg` เพื่อควบคุมฝั่งผู้ส่งโดยไม่ต้องใช้งานโทรศัพท์:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

ข้อความแรกควรสร้างคำขอจับคู่ ข้อความที่สองควรได้รับการตอบกลับจากเอเจนต์ผ่าน Twilio

## ความปลอดภัยของ Webhook

ตามค่าเริ่มต้น OpenClaw จะตรวจสอบ `X-Twilio-Signature` โดยใช้ `publicWebhookUrl` และ `authToken` ให้ส่วนปลายทางของ `publicWebhookUrl` ตรงกับ URL ที่กำหนดค่าใน Twilio แบบไบต์ต่อไบต์ รวมถึงสคีม โฮสต์ พาธ และสตริงคิวรี OpenClaw จะไม่นำแฟรกเมนต์ [การแทนที่การเชื่อมต่อ](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) ของ Twilio (`#...`) มาคำนวณลายเซ็น ตามข้อกำหนดของ Twilio

เส้นทาง Webhook ยังบังคับใช้ข้อกำหนดต่อไปนี้โดยไม่ขึ้นกับการตรวจสอบลายเซ็น:

- รองรับเฉพาะ `POST`
- จำกัดอัตราที่ 30 คำขอต่อนาทีต่อ IP ต้นทาง (หากเกินจะตอบกลับด้วย HTTP 429)
- `AccountSid` ในเพย์โหลดต้องตรงกับ `accountSid` ที่กำหนดค่าไว้ (มิฉะนั้นจะตอบกลับด้วย HTTP 403)
- ค่า `MessageSid` ที่ส่งซ้ำจะถูกขจัดรายการซ้ำเป็นเวลา 10 นาที
- แคชป้องกันการส่งซ้ำของแต่ละบัญชี SMS จะเก็บ SID ของข้อความที่ยังมีผลได้สูงสุด 10,000 รายการ เมื่อทุกช่องยังมีผล Webhook ใหม่สำหรับบัญชีนั้นจะปฏิเสธแบบปิดด้วย HTTP 429 พร้อมส่วนหัว `Retry-After` จนกว่าช่องที่เก่าที่สุดจะหมดอายุ
- เนื้อหาคำขอที่มีขนาดเกิน 32 KB จะถูกปฏิเสธ

ตามค่าเริ่มต้น Twilio จะไม่ลองส่ง HTTP 429 ซ้ำ และไม่ได้ระบุว่ารองรับ `Retry-After` การแทนที่การเชื่อมต่อ `#rp=4xx` และ `#rp=all` จะเปิดใช้การลองส่งซ้ำสำหรับ 4xx แต่ Twilio จำกัดธุรกรรมการลองส่งซ้ำทั้งหมดไว้ที่ 15 วินาที ดังนั้นการลองส่งซ้ำอาจสิ้นสุดก่อนช่องในแคชป้องกันการส่งซ้ำจะหมดอายุ กำหนดค่า URL สำรองเมื่อตัวจัดการอื่นต้องรับการส่งที่ล้มเหลว ให้ถือว่า 429 เป็นการปฏิเสธแบบปิด ไม่ใช่กลไกควบคุมแรงดันย้อนกลับที่เชื่อถือได้

สำหรับการทดสอบอุโมงค์ภายในเครื่องเท่านั้น คุณสามารถตั้งค่า:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

อย่าปิดใช้การตรวจสอบลายเซ็นบน Gateway สาธารณะ

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

แต่ละบัญชีต้องใช้ `webhookPath` ที่ไม่ซ้ำกัน Gateway จะปฏิเสธการลงทะเบียนเส้นทาง Webhook หากพาธนั้นมีบัญชีอื่นเป็นเจ้าของอยู่แล้ว ค่าสำรองจากสภาพแวดล้อม `TWILIO_*`/`SMS_*` จะใช้กับบัญชีเริ่มต้นเท่านั้น ให้ตั้งค่า `defaultAccount` เพื่อเปลี่ยนบัญชีเริ่มต้น

## การแก้ไขปัญหา

### Twilio ตอบกลับด้วย 403 หรือ OpenClaw ปฏิเสธ Webhook

ตรวจสอบว่า `publicWebhookUrl` ตรงกับ URL ที่กำหนดค่าใน Twilio ทุกประการ รวมถึงสคีม โฮสต์ พาธ และสตริงคิวรี Twilio ลงลายเซ็นสตริง URL สาธารณะ ดังนั้นการเขียน URL ใหม่โดยพร็อกซีและชื่อโฮสต์สำรองอาจทำให้การตรวจสอบลายเซ็นล้มเหลว

การตอบกลับ 403 พร้อมข้อความ `Invalid account` หมายความว่า `AccountSid` ของเพย์โหลดขาเข้าไม่ตรงกับ `accountSid` ที่กำหนดค่าไว้ ให้ตรวจสอบว่า Webhook ชี้ไปยังบัญชีที่เป็นเจ้าของหมายเลขนั้น

### ไม่มีคำขอจับคู่ปรากฏขึ้น

ตรวจสอบ URL และเมธอดของ Webhook **Messaging** สำหรับหมายเลข Twilio โดยต้องชี้ไปยัง URL ของ Webhook SMS และใช้ `POST` นอกจากนี้ ให้ยืนยันว่า Gateway เข้าถึงได้จากอินเทอร์เน็ตสาธารณะหรือผ่านอุโมงค์ของคุณ

หากบันทึกข้อความของ Twilio แสดงข้อผิดพลาด `11200` แสดงว่า Twilio ยอมรับ SMS ขาเข้าแล้ว แต่ไม่สามารถเข้าถึง Webhook ของคุณได้ ให้ตรวจสอบดังนี้:

- **Messaging > A message comes in** ของ Twilio ชี้ไปยัง `publicWebhookUrl`
- เมธอดคือ `POST`
- อุโมงค์หรือพร็อกซีย้อนกลับเปิดเผย `webhookPath` ที่ตรงกันทุกประการ สำหรับ Tailscale Funnel ให้เรียกใช้ `tailscale funnel status` และยืนยันว่ามี `/webhooks/sms` อยู่ในรายการ
- `publicWebhookUrl` ใช้สคีม โฮสต์ พาธ และสตริงคิวรีเดียวกับที่ Twilio ส่งมา เพื่อให้การตรวจสอบลายเซ็นสามารถสร้าง URL ที่ลงลายเซ็นไว้ขึ้นใหม่ได้

`openclaw channels status --channel sms --probe` จะแสดงทั้งการตั้งค่า Webhook ของ Twilio ที่ไม่ตรงกันและข้อผิดพลาด `11200` ล่าสุด

### การส่งขาออกล้มเหลว

ยืนยันว่า `accountSid`, `authToken` และ `fromNumber` หรือ `messagingServiceSid` ได้รับการแก้ค่าเรียบร้อยแล้ว หากคุณใช้บัญชีทดลองของ Twilio อาจต้องยืนยันหมายเลขปลายทางใน Twilio ก่อนจึงจะส่ง SMS ขาออกได้

### ข้อความมาถึง แต่เอเจนต์ไม่ตอบกลับ

ตรวจสอบ `dmPolicy` และ `allowFrom` เมื่อใช้นโยบายเริ่มต้น `pairing` ผู้ส่งต้องได้รับการอนุมัติก่อนจึงจะประมวลผลรอบการทำงานปกติของเอเจนต์ได้
