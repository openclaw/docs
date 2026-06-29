---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า Webhook ของ LINE และข้อมูลประจำตัว
    - คุณต้องการพารามิเตอร์ข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:34:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับ
การยืนยันตัวตน

สถานะ: Plugin ที่โหลดได้ รองรับข้อความส่วนตัว แชตกลุ่ม สื่อ ตำแหน่งที่ตั้ง Flex
messages, template messages และการตอบกลับด่วน ไม่รองรับรีแอ็กชันและเธรด

## การติดตั้ง

ติดตั้ง LINE ก่อนตั้งค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

สำเนาการทำงานในเครื่อง (เมื่อเรียกใช้จาก git repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## การตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider และเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL Webhook สำหรับ endpoint ของ Gateway (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook จาก LINE (GET) และยืนยันเหตุการณ์ขาเข้า
ที่ลงนามแล้ว (POST) ทันทีหลังจากตรวจสอบลายเซ็นและ payload; การประมวลผล
โดย agent จะดำเนินต่อแบบอะซิงโครนัส
หากต้องการ path แบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้ตรงกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็น LINE ขึ้นอยู่กับ body ของ request (HMAC บน raw body) ดังนั้น OpenClaw จึงใช้ข้อจำกัดขนาด body และ timeout ก่อนการยืนยันตัวตนอย่างเข้มงวดก่อนตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จาก byte ดิบของ request ที่ผ่านการตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดย middleware ต้นทางจะถูกละเว้นเพื่อรักษาความถูกต้องของลายเซ็น

## การกำหนดค่า

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

การกำหนดค่าข้อความส่วนตัวแบบเปิด:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

ตัวแปรสภาพแวดล้อม (เฉพาะบัญชีค่าเริ่มต้น):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ไฟล์ token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ Symbolic link จะถูกปฏิเสธ

หลายบัญชี:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## การควบคุมการเข้าถึง

โดยค่าเริ่มต้น ข้อความส่วนตัวต้องมีการจับคู่ ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และ
ข้อความของพวกเขาจะถูกละเว้นจนกว่าจะได้รับอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

รายการอนุญาตและนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID ผู้ใช้ LINE ที่อนุญาตสำหรับข้อความส่วนตัว; `dmPolicy: "open"` ต้องใช้ `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID ผู้ใช้ LINE ที่อนุญาตสำหรับกลุ่ม
- การแทนที่สำหรับแต่ละกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- กลุ่มการเข้าถึงผู้ส่งแบบคงที่สามารถอ้างอิงจาก `allowFrom`, `groupAllowFrom` และ `allowFrom` ระดับกลุ่มได้ผ่าน `accessGroup:<name>`
- หมายเหตุเกี่ยวกับ runtime: หากไม่มี `channels.line` ทั้งหมด runtime จะย้อนกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

ID LINE แยกตัวพิมพ์ใหญ่เล็ก ID ที่ถูกต้องมีรูปแบบดังนี้:

- ผู้ใช้: `U` + อักขระเลขฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระเลขฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระเลขฐานสิบหก 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งเป็นส่วนย่อยละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบ; code blocks และตารางจะถูกแปลงเป็น Flex
  cards เมื่อเป็นไปได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์; LINE จะได้รับส่วนย่อยที่สมบูรณ์พร้อมแอนิเมชันการโหลด
  ระหว่างที่ agent กำลังทำงาน
- การดาวน์โหลดสื่อจำกัดด้วย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกใน `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ให้ agent ซึ่งสอดคล้องกับพื้นที่จัดเก็บสื่อร่วมที่ใช้โดย Plugin
  ช่องทางในตัวอื่นๆ

## ข้อมูลช่องทาง (ข้อความขั้นสูง)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน ตำแหน่งที่ตั้ง Flex cards หรือ template
messages

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE ยังมาพร้อมคำสั่ง `/card` สำหรับพรีเซ็ต Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ใช้งานอยู่ซึ่งผูกกับการสนทนา จะทำงานใน LINE เช่นเดียวกับในช่องทางการสนทนาอื่นๆ

ดู [agent ACP](/th/tools/acp-agents) สำหรับรายละเอียด

## สื่อขาออก

Plugin LINE รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่านเครื่องมือข้อความของ agent สื่อจะถูกส่งผ่านเส้นทางการส่งเฉพาะของ LINE พร้อมการจัดการตัวอย่างและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพ LINE พร้อมการสร้างตัวอย่างอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการตัวอย่างและชนิดเนื้อหาอย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียง LINE

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบชื่อโฮสต์ปลายทางก่อนส่ง URL ไปยัง LINE และปฏิเสธ local loopback, link-local และเป้าหมายในเครือข่ายส่วนตัว

การส่งสื่อทั่วไปจะย้อนกลับไปใช้เส้นทางเดิมเฉพาะรูปภาพเมื่อเส้นทางเฉพาะของ LINE ไม่พร้อมใช้งาน

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL Webhook ใช้ HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่า path ของ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway เข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดค่าเริ่มต้น

## ดูเพิ่มเติม

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนข้อความส่วนตัวและ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและข้อจำกัดด้านการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
