---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ SMS ผ่าน Twilio
    - คุณต้องตั้งค่า SMS Webhook หรือ allowlist
summary: การตั้งค่าช่องทาง Twilio SMS, การควบคุมการเข้าถึง และการกำหนดค่า Webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:14:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw สามารถรับและส่ง SMS ผ่านหมายเลขโทรศัพท์ Twilio หรือ Messaging Service ได้ Gateway จะลงทะเบียนเส้นทาง Webhook ขาเข้า ตรวจสอบลายเซ็นคำขอของ Twilio ตามค่าเริ่มต้น และส่งการตอบกลับผ่าน Messages API ของ Twilio

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ SMS คือการจับคู่
  </Card>
  <Card title="ความปลอดภัยของ Gateway" icon="shield" href="/th/gateway/security">
    ตรวจสอบการเปิดเผย Webhook และการควบคุมสิทธิ์ผู้ส่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## ก่อนเริ่มต้น

คุณต้องมี:

- Plugin SMS อย่างเป็นทางการที่ติดตั้งด้วย `openclaw plugins install @openclaw/sms`
- บัญชี Twilio พร้อมหมายเลขโทรศัพท์ที่รองรับ SMS หรือ Twilio Messaging Service
- Twilio Account SID และ Auth Token
- URL HTTPS สาธารณะที่เข้าถึง OpenClaw Gateway ของคุณ
- ตัวเลือกนโยบายผู้ส่ง: `pairing` สำหรับการใช้งานส่วนตัว, `allowlist` สำหรับหมายเลขโทรศัพท์ที่อนุมัติไว้ล่วงหน้า หรือ `open` เฉพาะสำหรับการเข้าถึง SMS สาธารณะโดยเจตนา

ใช้หมายเลข Twilio เดียวกันสำหรับทั้ง SMS และ Voice Call หากหมายเลขนั้นมีความสามารถทั้งสองอย่าง กำหนดค่า SMS webhook และ Voice webhook แยกกันใน Twilio; หน้านี้ครอบคลุมเฉพาะ SMS webhook เท่านั้น

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="สร้างหรือเลือกผู้ส่ง Twilio">
    ใน Twilio ให้เปิด **หมายเลขโทรศัพท์ > จัดการ > หมายเลขที่ใช้งานอยู่** แล้วเลือกหมายเลขที่รองรับ SMS บันทึก:

    - Account SID เช่น `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - หมายเลขโทรศัพท์ผู้ส่ง เช่น `+15551234567`

    หากคุณใช้ Messaging Service แทนหมายเลขผู้ส่งแบบคงที่ ให้บันทึก Messaging Service SID เช่น `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

  </Step>

  <Step title="กำหนดค่าช่องทาง SMS">

บันทึกสิ่งนี้เป็น `sms.patch.json5` แล้วเปลี่ยน placeholder:

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

  <Step title="ชี้ Twilio ไปยัง Gateway webhook">
    ในการตั้งค่าหมายเลขโทรศัพท์ Twilio ให้เปิด **Messaging** และตั้งค่า **เมื่อมีข้อความเข้ามา** เป็น:

```text
https://gateway.example.com/webhooks/sms
```

    ใช้ HTTP `POST` เส้นทางภายในเครื่องเริ่มต้นคือ `/webhooks/sms`; เปลี่ยน `channels.sms.webhookPath` หากคุณต้องการเส้นทางอื่น

  </Step>

  <Step title="เปิดเผยเส้นทาง SMS webhook ที่ตรงกัน">
    URL สาธารณะของคุณต้องกำหนดเส้นทาง SMS ไปยังกระบวนการ Gateway หากคุณใช้ Tailscale Funnel สำหรับการทดสอบภายในเครื่อง ให้เปิดเผย `/webhooks/sms` อย่างชัดเจน:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call และ SMS ใช้เส้นทาง Webhook แยกกัน หากหมายเลข Twilio เดียวกันรองรับทั้งสองอย่าง ให้กำหนดค่าทั้งสองเส้นทางไว้ใน Twilio และใน tunnel ของคุณ

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติผู้ส่งรายแรก">

```bash
openclaw gateway
```

ส่งข้อความไปยังหมายเลข Twilio ข้อความแรกจะสร้างคำขอจับคู่ อนุมัติคำขอนั้น:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง

  </Step>
</Steps>

## ตัวอย่างการกำหนดค่า

### ไฟล์กำหนดค่า

ใช้การตั้งค่าด้วยไฟล์กำหนดค่าเมื่อคุณต้องการให้คำนิยามช่องทางไปพร้อมกับการกำหนดค่า Gateway:

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

ใช้การตั้งค่าด้วย env สำหรับการปรับใช้บัญชีเดียวที่ secret มาจากสภาพแวดล้อมของโฮสต์:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

จากนั้นเปิดใช้ช่องทางใน config:

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

`TWILIO_SMS_FROM` ได้รับการยอมรับเป็น alias สำหรับ `TWILIO_PHONE_NUMBER` ใช้ `TWILIO_MESSAGING_SERVICE_SID` แทนผู้ส่งแบบหมายเลขโทรศัพท์เมื่อ Twilio ควรเลือกผู้ส่งจาก Messaging Service

### โทเค็น auth แบบ SecretRef

`authToken` สามารถเป็น SecretRef ได้ ใช้สิ่งนี้เมื่อ Gateway ควรแก้ค่า Twilio Auth Token จาก runtime secret ของ OpenClaw แทนการเก็บ config แบบข้อความธรรมดา:

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

ตัวแปรสภาพแวดล้อมหรือผู้ให้บริการ secret ที่อ้างถึงต้องมองเห็นได้สำหรับ runtime ของ Gateway รีสตาร์ตกระบวนการ Gateway ที่มีการจัดการหลังจากเปลี่ยนตัวแปรสภาพแวดล้อมของโฮสต์

### หมายเลขส่วนตัวแบบ allowlist เท่านั้น

ใช้ `allowlist` เมื่อควรให้เฉพาะหมายเลขโทรศัพท์ที่รู้จักเท่านั้นที่คุยกับ agent ได้:

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

### ผู้ส่ง Messaging Service

ใช้ `messagingServiceSid` แทน `fromNumber` เมื่อ Twilio ควรเลือกผู้ส่งผ่าน Messaging Service:

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

หากมีทั้ง `fromNumber` และ `messagingServiceSid` หลังจากแก้ค่าคอนฟิกและ env แล้ว จะใช้ `fromNumber`

### เป้าหมายขาออกเริ่มต้น

ตั้งค่า `defaultTo` เมื่อการส่งโดยอัตโนมัติหรือการส่งที่ agent เริ่มต้นควรมีปลายทางเริ่มต้น หากโฟลว์การส่งละเว้นเป้าหมายที่ระบุชัดเจน:

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

- `pairing` (ค่าเริ่มต้น)
- `allowlist` (ต้องมีผู้ส่งอย่างน้อยหนึ่งรายใน `allowFrom`)
- `open` (ต้องให้ `allowFrom` รวม `"*"`)
- `disabled`

รายการ `allowFrom` ควรเป็นหมายเลขโทรศัพท์ E.164 เช่น `+15551234567` ระบบยอมรับและทำให้คำนำหน้า `sms:` เป็นมาตรฐาน สำหรับผู้ช่วยส่วนตัว ควรใช้ `dmPolicy: "allowlist"` พร้อมหมายเลขโทรศัพท์ที่ระบุชัดเจน

## การส่ง SMS

เป้าหมาย SMS ขาออกใช้คำนำหน้าบริการ `sms:` โดยเลือกช่องทาง SMS:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

เมื่อการเลือกช่องทางเป็นแบบโดยนัย `twilio-sms:+15551234567` จะเลือกช่องทางนี้โดยไม่เข้าไปแทนที่คำนำหน้าบริการ `sms:` ที่ช่องทางเดิมเป็นเจ้าของและ iMessage ใช้อยู่

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI ต้องมี `--target` ที่ระบุชัดเจน `defaultTo` ใช้สำหรับเส้นทางการส่งโดยอัตโนมัติและการส่งที่ agent เริ่มต้น ซึ่งสามารถแก้เป้าหมายจากคอนฟิกช่องทางได้

การตอบกลับของ agent จากการสนทนา SMS ขาเข้าจะถูกส่งกลับไปยังผู้ส่งโดยอัตโนมัติผ่านผู้ส่ง Twilio ที่กำหนดค่าไว้

เอาต์พุต SMS เป็นข้อความธรรมดา OpenClaw จะลบ markdown แปลง fenced code blocks ให้เป็นข้อความราบเดียว เก็บลิงก์ให้อ่านได้ และแบ่งคำตอบยาวๆ เป็นชิ้นก่อนส่งผ่าน Twilio

## ตรวจสอบการตั้งค่า

หลังจาก Gateway เริ่มทำงาน:

1. ยืนยันว่า log ของ Gateway แสดงเส้นทาง Webhook ของ SMS
2. เรียกใช้การตรวจสอบฝั่ง Twilio:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. ส่ง SMS ไปยังหมายเลข Twilio จากโทรศัพท์ของคุณ
4. เรียกใช้ `openclaw pairing list sms`
5. อนุมัติรหัสการจับคู่ด้วย `openclaw pairing approve sms <CODE>`
6. ส่ง SMS อีกครั้งและยืนยันว่า agent ตอบกลับ

สำหรับการทดสอบเฉพาะขาออก ให้ใช้:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### การทดสอบตั้งแต่ต้นจนจบจาก macOS iMessage/SMS

บน Mac ที่สามารถส่ง SMS ของเครือข่ายมือถือผ่าน Messages ได้ คุณสามารถใช้ `imsg` เพื่อขับฝั่งผู้ส่งโดยไม่ต้องแตะโทรศัพท์ของคุณ:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

ข้อความแรกควรสร้างคำขอจับคู่ ข้อความที่สองควรได้รับคำตอบจาก agent ผ่าน Twilio

## ความปลอดภัยของ Webhook

โดยค่าเริ่มต้น OpenClaw จะตรวจสอบ `X-Twilio-Signature` โดยใช้ `publicWebhookUrl` และ `authToken` ให้ `publicWebhookUrl` ตรงกับ URL ที่กำหนดค่าใน Twilio แบบ byte-for-byte รวมถึง scheme, host, path และ query string

สำหรับการทดสอบ tunnel ภายในเครื่องเท่านั้น คุณสามารถตั้งค่า:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

อย่าใช้การตรวจสอบ signature ที่ปิดใช้งานบน Gateway สาธารณะ

## คอนฟิกหลายบัญชี

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

แต่ละบัญชีควรใช้ `webhookPath` ที่แตกต่างกัน

## การแก้ไขปัญหา

### Twilio ส่งคืน 403 หรือ OpenClaw ปฏิเสธ Webhook

ตรวจสอบว่า `publicWebhookUrl` ตรงกับ URL ที่กำหนดค่าใน Twilio ทุกประการ รวมถึง scheme, host, path และ query string Twilio จะลงนามสตริง URL สาธารณะ ดังนั้นการ rewrite ของ proxy และชื่อโฮสต์ทางเลือกอาจทำให้การตรวจสอบ signature ล้มเหลว

### ไม่พบคำขอจับคู่

ตรวจสอบ URL และเมธอดของ Webhook **Messaging** ของหมายเลข Twilio ต้องชี้ไปยัง URL Webhook ของ SMS และใช้ `POST` และยืนยันด้วยว่า Gateway เข้าถึงได้จากอินเทอร์เน็ตสาธารณะหรือผ่าน tunnel ของคุณ

หาก log ข้อความ Twilio แสดงข้อผิดพลาด `11200` หมายความว่า Twilio รับ SMS ขาเข้าแล้ว แต่ไม่สามารถเข้าถึง Webhook ของคุณได้ ตรวจสอบ:

- Twilio **Messaging > A message comes in** ชี้ไปที่ `publicWebhookUrl`
- เมธอดคือ `POST`
- tunnel หรือ reverse proxy เปิดเผย `webhookPath` ที่ตรงกันทุกประการ สำหรับ Tailscale Funnel ให้เรียกใช้ `tailscale funnel status` และยืนยันว่ามี `/webhooks/sms` อยู่ในรายการ
- `publicWebhookUrl` ใช้ scheme, host, path และ query string เดียวกับที่ Twilio ส่ง เพื่อให้การตรวจสอบ signature สามารถสร้าง URL ที่ถูกลงนามซ้ำได้

### การส่งขาออกล้มเหลว

ยืนยันว่า `accountSid`, `authToken` และ `fromNumber` หรือ `messagingServiceSid` อย่างใดอย่างหนึ่งถูกแก้ค่าแล้ว หากคุณใช้บัญชี Twilio แบบทดลองใช้ อาจต้องยืนยันหมายเลขปลายทางใน Twilio ก่อนจึงจะส่ง SMS ขาออกได้

### ข้อความมาถึงแต่ agent ไม่ตอบกลับ

ตรวจสอบ `dmPolicy` และ `allowFrom` เมื่อใช้นโยบายเริ่มต้น `pairing` ผู้ส่งต้องได้รับการอนุมัติก่อนจึงจะประมวลผลรอบการทำงานของเอเจนต์ตามปกติได้
