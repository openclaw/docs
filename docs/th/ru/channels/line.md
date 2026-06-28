---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องกำหนดค่า Webhook ของ LINE และข้อมูลประจำตัว
    - คุณต้องใช้พารามิเตอร์ข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้ channel access token + channel secret ของคุณเพื่อ
การยืนยันตัวตน

สถานะ: Plugin ที่โหลดได้ รองรับข้อความส่วนตัว แชทกลุ่ม สื่อ ตำแหน่งที่ตั้ง ข้อความ Flex
ข้อความเทมเพลต และการตอบกลับด่วน ไม่รองรับรีแอ็กชันและเธรด

## การติดตั้ง

ติดตั้ง LINE ก่อนตั้งค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

สำเนาทำงานในเครื่อง (เมื่อรันจาก git repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## การตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook สำหรับ endpoint ของ Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook จาก LINE (GET) และยืนยันเหตุการณ์ขาเข้า
ที่มีลายเซ็น (POST) ทันทีหลังตรวจสอบลายเซ็นและ payload แล้ว; การประมวลผล
โดยเอเจนต์จะดำเนินต่อแบบอะซิงโครนัส
หากต้องการ path แบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` และอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็น LINE ขึ้นอยู่กับ body ของคำขอ (HMAC บน body ดิบ) ดังนั้น OpenClaw จึงใช้ข้อจำกัดขนาด body และ timeout ก่อนการยืนยันตัวตนอย่างเข้มงวดก่อนตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอดิบที่ผ่านการตรวจสอบแล้ว ค่า `req.body` ที่ middleware ก่อนหน้าปรับแปลงจะถูกละเว้นเพื่อรักษาความถูกต้องสมบูรณ์ของลายเซ็น

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

ตัวแปรสภาพแวดล้อม (เฉพาะบัญชีเริ่มต้น):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ไฟล์โทเค็น/ความลับ:

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

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ ลิงก์สัญลักษณ์จะถูกปฏิเสธ

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

ข้อความส่วนตัวต้องจับคู่โดยค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และ
ข้อความของพวกเขาจะถูกละเว้นจนกว่าจะอนุมัติ

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
- สามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่จาก `allowFrom`, `groupAllowFrom` และ `allowFrom` ระดับกลุ่มผ่าน `accessGroup:<name>` ได้
- หมายเหตุเกี่ยวกับ runtime: หากไม่มี `channels.line` ทั้งหมด runtime จะย้อนกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

ID ของ LINE แยกแยะตัวพิมพ์ใหญ่เล็ก ID ที่ถูกต้องมีรูปแบบดังนี้:

- ผู้ใช้: `U` + อักขระฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระฐานสิบหก 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความถูกแบ่งเป็นส่วน ๆ ละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; code block และตารางจะถูกแปลงเป็น Flex
  cards เมื่อเป็นไปได้
- คำตอบแบบสตรีมจะถูก buffer; LINE จะได้รับส่วนข้อความที่สมบูรณ์พร้อมแอนิเมชันโหลด
  ขณะที่เอเจนต์กำลังทำงาน
- การดาวน์โหลดสื่อถูกจำกัดโดย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกใน `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ให้เอเจนต์ ซึ่งสอดคล้องกับที่จัดเก็บสื่อทั่วไปที่ใช้โดย Plugin
  ช่องทางในตัวอื่น ๆ

## ข้อมูลช่องทาง (ข้อความขั้นสูง)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน ตำแหน่งที่ตั้ง Flex cards หรือข้อความเทมเพลต

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

Plugin LINE ยังมาพร้อมคำสั่ง `/card` สำหรับ preset ของข้อความ Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชท LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ใช้งานอยู่ซึ่งผูกกับการสนทนา จะทำงานใน LINE เช่นเดียวกับในช่องทางการสนทนาอื่น ๆ

ดูรายละเอียดที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin LINE รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่านเครื่องมือข้อความของเอเจนต์ สื่อจะถูกส่งผ่านเส้นทางการส่งเฉพาะของ LINE พร้อมการจัดการตัวอย่างและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพ LINE พร้อมการสร้างตัวอย่างอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการตัวอย่างและประเภทเนื้อหาอย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียง LINE

URL ของสื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบชื่อโฮสต์ปลายทางก่อนส่ง URL ไปยัง LINE และปฏิเสธ local loopback, link-local และปลายทางในเครือข่ายส่วนตัว

การส่งสื่อทั่วไปจะย้อนกลับไปใช้ route เดิมสำหรับรูปภาพเท่านั้น เมื่อเส้นทางเฉพาะของ LINE ไม่พร้อมใช้งาน

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ไม่ผ่าน:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook ใช้ HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่า path ของ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway เข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดเริ่มต้น

## ดูเพิ่มเติม

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนข้อความส่วนตัวและ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชทกลุ่มและข้อจำกัดตามการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
