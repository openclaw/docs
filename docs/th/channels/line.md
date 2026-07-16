---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า Webhook และข้อมูลประจำตัวสำหรับ LINE
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า Plugin, การกำหนดค่า และการใช้งาน LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-16T18:49:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้โทเค็นการเข้าถึงช่องทาง + ข้อมูลลับของช่องทางของคุณสำหรับ
การยืนยันตัวตน

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับข้อความโดยตรง แชตกลุ่ม สื่อ
ตำแหน่งที่ตั้ง ข้อความ Flex ข้อความเทมเพลต และการตอบกลับด่วน
ไม่รองรับรีแอ็กชันและเธรด

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จากที่เก็บ git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## ตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook เป็นปลายทาง Gateway ของคุณ (ต้องใช้ HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook ของ LINE (GET) และตอบรับเหตุการณ์ขาเข้า
ที่ลงนามแล้ว (POST) ทันทีหลังจากตรวจสอบลายเซ็นและเพย์โหลด โดยการประมวลผลของเอเจนต์
จะดำเนินต่อแบบอะซิงโครนัส
หากต้องการใช้พาธที่กำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` และอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นอยู่กับเนื้อหาบอดี (HMAC บนบอดีดิบ) ดังนั้น OpenClaw จึงใช้ขีดจำกัดบอดีก่อนยืนยันตัวตนอย่างเข้มงวด (64 KB) และกำหนดเวลาหมดอายุในการอ่านก่อนการตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอดิบที่ผ่านการตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดยมิดเดิลแวร์ต้นทางจะถูกละเว้นเพื่อความปลอดภัยด้านความสมบูรณ์ของลายเซ็น

## กำหนดค่า

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

การกำหนดค่า DM สาธารณะ:

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

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ ระบบจะปฏิเสธ Symlink
ค่าการกำหนดค่าแบบอินไลน์มีลำดับความสำคัญเหนือไฟล์ ส่วนตัวแปรสภาพแวดล้อมเป็นทางเลือกสุดท้ายสำหรับบัญชีเริ่มต้น

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

ข้อความโดยตรงใช้การจับคู่เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และ
ข้อความของผู้ส่งเหล่านั้นจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

รายการที่อนุญาตและนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น `pairing`)
- `channels.line.allowFrom`: ID ผู้ใช้ LINE ที่อยู่ในรายการที่อนุญาตสำหรับ DM โดย `dmPolicy: "open"` ต้องใช้ `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (ค่าเริ่มต้น `allowlist`)
- `channels.line.groupAllowFrom`: ID ผู้ใช้ LINE ที่อยู่ในรายการที่อนุญาตสำหรับกลุ่ม โดยรายการ `allowFrom` ของ DM ไม่อนุญาตให้ผู้ส่งเข้ากลุ่ม
- การแทนที่รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom` (รวมถึง `enabled`, `requireMention`, `systemPrompt`, `skills`) เมื่อใช้
  `groupPolicy: "allowlist"` ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม รายการที่อนุญาตของกลุ่มที่ว่างเปล่าจะบล็อกข้อความกลุ่มแม้ว่า DM จะเปิดอยู่
- สามารถอ้างอิงกลุ่มการเข้าถึงของผู้ส่งแบบคงที่จาก `allowFrom`, `groupAllowFrom` และ `allowFrom` รายกลุ่มด้วย `accessGroup:<name>` โปรดดู [กลุ่มการเข้าถึง](/th/channels/access-groups)
- หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.line` โดยสมบูรณ์ รันไทม์จะใช้ `groupPolicy="allowlist"` เป็นทางเลือกสำรองสำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

ID ของ LINE คำนึงถึงตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ ID ที่ถูกต้องมีรูปแบบดังนี้:

- ผู้ใช้: `U` + อักขระฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระฐานสิบหก 32 ตัว

## ลักษณะการทำงานของข้อความ

- ข้อความจะถูกแบ่งเป็นส่วนละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก ส่วนบล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์ LINE จะได้รับข้อมูลเป็นส่วนสมบูรณ์พร้อมภาพเคลื่อนไหว
  แสดงการโหลดขณะที่เอเจนต์ทำงาน
- การดาวน์โหลดสื่อถูกจำกัดโดย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ภายใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ไปยังเอเจนต์ โดยใช้ที่เก็บสื่อร่วมเดียวกับ Plugin ช่องทางอื่น

## ข้อมูลช่องทาง (ข้อความแบบสมบูรณ์)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน ตำแหน่งที่ตั้ง การ์ด Flex หรือข้อความ
เทมเพลต

```json5
{
  text: "ส่งให้แล้ว",
  channelData: {
    line: {
      quickReplies: ["สถานะ", "ความช่วยเหลือ"],
      location: {
        title: "สำนักงาน",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "การ์ดสถานะ",
        contents: {/* เพย์โหลด Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "ดำเนินการต่อหรือไม่",
        confirmLabel: "ใช่",
        confirmData: "yes",
        cancelLabel: "ไม่",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE ยังมาพร้อมคำสั่ง `/card` สำหรับค่าที่ตั้งไว้ล่วงหน้าของข้อความ Flex:

```text
/card info "ยินดีต้อนรับ" "ขอบคุณที่เข้าร่วม!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาซึ่งกำลังใช้งาน ทำงานบน LINE เช่นเดียวกับช่องทางการสนทนาอื่น

โปรดดูรายละเอียดที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin LINE ส่งรูปภาพ วิดีโอ และเสียงผ่านเครื่องมือข้อความของเอเจนต์:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE โดยรูปภาพตัวอย่างจะใช้ URL ของสื่อเป็นค่าเริ่มต้น
- **วิดีโอ**: ต้องมีรูปภาพตัวอย่าง ให้ตั้งค่า `channelData.line.previewImageUrl` เป็น URL ของรูปภาพ
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE โดยระยะเวลาจะมีค่าเริ่มต้นเป็น 60 วินาที เว้นแต่จะตั้งค่า `channelData.line.durationMs`

ชนิดสื่อจะนำมาจาก `channelData.line.mediaKind` เมื่อตั้งค่าไว้ มิฉะนั้นระบบจะอนุมาน
จากตัวเลือกอื่นของ LINE หรือส่วนต่อท้ายไฟล์ของ URL โดยใช้รูปภาพเป็นทางเลือกสำรอง

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะที่มีความยาวไม่เกิน 2000 อักขระ OpenClaw
จะตรวจสอบชื่อโฮสต์เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายแบบลูปแบ็ก
ลิงก์โลคัล และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปที่ไม่มีตัวเลือกเฉพาะของ LINE จะใช้เส้นทางรูปภาพ

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE Console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่าพาธของ Webhook ตรงกับ `channels.line.webhookPath`
  และ LINE สามารถเข้าถึง Gateway ได้
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อมีขนาดเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนสำหรับ DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
