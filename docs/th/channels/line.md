---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า Webhook และข้อมูลประจำตัวสำหรับ LINE
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin สำหรับ LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T15:52:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้โทเค็นการเข้าถึงช่องทางร่วมกับข้อมูลลับของช่องทางเพื่อ
ยืนยันตัวตน

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับข้อความโดยตรง แชตกลุ่ม สื่อ
ตำแหน่งที่ตั้ง ข้อความ Flex ข้อความเทมเพลต และการตอบกลับด่วน
ไม่รองรับรีแอ็กชันและเธรด

## การติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จากรีโพซิทอรี git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## การตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook เป็นปลายทาง Gateway ของคุณ (ต้องใช้ HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook ของ LINE (GET) และยืนยันการรับอีเวนต์ขาเข้า
ที่มีลายเซ็น (POST) ทันทีหลังจากตรวจสอบลายเซ็นและเพย์โหลดแล้ว ส่วนการประมวลผล
ของเอเจนต์จะดำเนินต่อแบบอะซิงโครนัส
หากต้องการใช้พาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` และแก้ไข URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นอยู่กับเนื้อหาบอดี (HMAC ของบอดีดิบ) ดังนั้น OpenClaw จึงบังคับใช้ขีดจำกัดขนาดบอดีก่อนการยืนยันตัวตนอย่างเข้มงวด (64 KB) และระยะหมดเวลาในการอ่านก่อนตรวจสอบ
- OpenClaw ประมวลผลอีเวนต์ Webhook จากไบต์คำขอดิบที่ผ่านการตรวจสอบแล้ว โดยจะละเว้นค่า `req.body` ที่ถูกมิดเดิลแวร์ต้นทางแปลง เพื่อรักษาความสมบูรณ์ของลายเซ็น

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

การกำหนดค่าข้อความโดยตรงแบบสาธารณะ:

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

ไฟล์โทเค็น/ข้อมูลลับ:

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

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ ระบบจะปฏิเสธลิงก์สัญลักษณ์
ค่าการกำหนดค่าแบบอินไลน์มีลำดับความสำคัญเหนือไฟล์ ส่วนตัวแปรสภาพแวดล้อมเป็นทางเลือกสำรองสุดท้ายสำหรับบัญชีเริ่มต้น

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

ข้อความโดยตรงใช้การจับคู่เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และระบบ
จะละเว้นข้อความของผู้ส่งเหล่านั้นจนกว่าจะได้รับการอนุมัติ:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

รายการอนุญาตและนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น `pairing`)
- `channels.line.allowFrom`: ID ผู้ใช้ LINE ที่อยู่ในรายการอนุญาตสำหรับข้อความโดยตรง โดย `dmPolicy: "open"` ต้องใช้ `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (ค่าเริ่มต้น `allowlist`)
- `channels.line.groupAllowFrom`: ID ผู้ใช้ LINE ที่อยู่ในรายการอนุญาตสำหรับกลุ่ม
- การกำหนดทับเฉพาะกลุ่ม: `channels.line.groups.<groupId>.allowFrom` (รวมถึง `enabled`, `requireMention`, `systemPrompt`, `skills`)
- กลุ่มการเข้าถึงของผู้ส่งแบบคงที่สามารถอ้างอิงจาก `allowFrom`, `groupAllowFrom` และ `allowFrom` เฉพาะกลุ่มด้วย `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- หมายเหตุขณะทำงาน: หากไม่มี `channels.line` โดยสิ้นเชิง ระบบขณะทำงานจะย้อนกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

ID ของ LINE แยกแยะตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระเลขฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระเลขฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระเลขฐานสิบหก 32 ตัว

## ลักษณะการทำงานของข้อความ

- ข้อความจะถูกแบ่งเป็นส่วนละ 5,000 อักขระ
- ระบบจะนำการจัดรูปแบบ Markdown ออก ส่วนบล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- ระบบจะบัฟเฟอร์การตอบกลับแบบสตรีม โดย LINE จะได้รับส่วนข้อความที่สมบูรณ์พร้อมภาพเคลื่อนไหว
  การโหลดระหว่างที่เอเจนต์กำลังทำงาน
- การดาวน์โหลดสื่อถูกจำกัดด้วย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ที่ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ให้เอเจนต์ ซึ่งสอดคล้องกับที่เก็บสื่อร่วมที่ Plugin ช่องทางอื่นใช้

## ข้อมูลช่องทาง (ข้อความแบบสมบูรณ์)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน ตำแหน่งที่ตั้ง การ์ด Flex หรือข้อความ
เทมเพลต

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
        contents: {/* Flex payload */},
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

Plugin LINE ยังมาพร้อมคำสั่ง `/card` สำหรับรูปแบบข้อความ Flex ที่กำหนดไว้ล่วงหน้า:

```text
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนาด้วย ACP (โปรโตคอลการสื่อสารของเอเจนต์):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาและกำลังใช้งาน ทำงานบน LINE ได้เช่นเดียวกับช่องทางการสนทนาอื่น

ดูรายละเอียดที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin LINE ส่งรูปภาพ วิดีโอ และเสียงผ่านเครื่องมือข้อความของเอเจนต์:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE โดยรูปภาพตัวอย่างจะใช้ URL ของสื่อเป็นค่าเริ่มต้น
- **วิดีโอ**: ต้องมีรูปภาพตัวอย่าง ให้ตั้งค่า `channelData.line.previewImageUrl` เป็น URL รูปภาพ
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE โดยระยะเวลาเริ่มต้นคือ 60 วินาที เว้นแต่จะตั้งค่า `channelData.line.durationMs`

ประเภทของสื่อจะนำมาจาก `channelData.line.mediaKind` หากมีการตั้งค่า มิฉะนั้นระบบจะอนุมาน
จากตัวเลือก LINE อื่นหรือนามสกุลไฟล์ใน URL โดยใช้รูปภาพเป็นทางเลือกสำรอง

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะที่มีความยาวไม่เกิน 2,000 อักขระ OpenClaw
จะตรวจสอบชื่อโฮสต์ปลายทางก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายที่เป็น local loopback,
ลิงก์ภายในเครื่อง และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปที่ไม่มีตัวเลือกเฉพาะของ LINE จะใช้เส้นทางรูปภาพ

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบว่า URL ของ Webhook ใช้ HTTPS และ
  `channelSecret` ตรงกับ LINE Console
- **ไม่มีอีเวนต์ขาเข้า:** ตรวจสอบว่าพาธของ Webhook ตรงกับ `channels.line.webhookPath`
  และ LINE สามารถเข้าถึง Gateway ได้
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่มค่า `channels.line.mediaMaxMb` หากสื่อมีขนาดเกิน
  ขีดจำกัดเริ่มต้น

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนของข้อความโดยตรงและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
