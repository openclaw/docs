---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook และข้อมูลรับรอง
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin สำหรับ LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:11:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับ
การยืนยันตัวตน

สถานะ: Plugin ที่ดาวน์โหลดได้ รองรับข้อความส่วนตัว แชตกลุ่ม สื่อ ตำแหน่งที่ตั้ง ข้อความ Flex
ข้อความเทมเพลต และการตอบกลับด่วน ไม่รองรับรีแอ็กชันและเธรด

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก repo git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## ตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider และเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook เป็นปลายทาง Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบสนองต่อการตรวจสอบ Webhook ของ LINE (GET) และยืนยันเหตุการณ์ขาเข้า
ที่ลงลายเซ็นแล้ว (POST) ทันทีหลังจากตรวจสอบลายเซ็นและเพย์โหลดแล้ว จากนั้นการประมวลผลของเอเจนต์
จะดำเนินต่อแบบอะซิงโครนัส
หากคุณต้องการพาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นกับเนื้อหา body (HMAC บน raw body) ดังนั้น OpenClaw จึงใช้ขีดจำกัด body ก่อนยืนยันตัวตนและ timeout อย่างเข้มงวดก่อนตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอดิบที่ตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดยมิดเดิลแวร์ต้นทางจะถูกละเว้นเพื่อความปลอดภัยด้านความถูกต้องของลายเซ็น

## กำหนดค่า

ค่ากำหนดขั้นต่ำ:

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

ค่ากำหนด DM สาธารณะ:

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

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ Symlink จะถูกปฏิเสธ

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

ข้อความส่วนตัวมีค่าเริ่มต้นเป็นการจับคู่ ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และข้อความของพวกเขา
จะถูกละเว้นจนกว่าจะได้รับอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

รายการอนุญาตและนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID ผู้ใช้ LINE ที่อยู่ในรายการอนุญาตสำหรับ DM; `dmPolicy: "open"` ต้องใช้ `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID ผู้ใช้ LINE ที่อยู่ในรายการอนุญาตสำหรับกลุ่ม
- การแทนที่รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- กลุ่มการเข้าถึงผู้ส่งแบบคงที่สามารถอ้างอิงได้จาก `allowFrom`, `groupAllowFrom` และ `allowFrom` รายกลุ่ม ด้วย `accessGroup:<name>`
- หมายเหตุรันไทม์: หาก `channels.line` หายไปทั้งหมด รันไทม์จะ fallback ไปที่ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

ID ของ LINE แยกตัวพิมพ์ใหญ่-เล็ก ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระ hex 32 ตัว
- กลุ่ม: `C` + อักขระ hex 32 ตัว
- ห้อง: `R` + อักขระ hex 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งเป็นช่วงละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; บล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์; LINE ได้รับช่วงข้อความแบบเต็มพร้อมแอนิเมชันโหลด
  ระหว่างที่เอเจนต์ทำงาน
- การดาวน์โหลดสื่อถูกจำกัดด้วย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ไปยังเอเจนต์ โดยสอดคล้องกับที่เก็บสื่อร่วมที่ Plugins ช่องทางแบบ bundled อื่นใช้

## ข้อมูลช่องทาง (ข้อความแบบ rich)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน ตำแหน่งที่ตั้ง การ์ด Flex หรือข้อความเทมเพลต

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

Plugin LINE ยังมาพร้อมคำสั่ง `/card` สำหรับพรีเซ็ตข้อความ Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันกับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาซึ่งกำลังใช้งาน ทำงานบน LINE ได้เหมือนช่องทางการสนทนาอื่น

ดูรายละเอียดที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin LINE รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่านเครื่องมือข้อความของเอเจนต์ สื่อจะถูกส่งผ่านพาธการส่งเฉพาะของ LINE พร้อมการจัดการพรีวิวและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพ LINE พร้อมสร้างพรีวิวอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการพรีวิวและ content-type อย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียง LINE

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบชื่อโฮสต์เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายแบบ loopback, link-local และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปจะ fallback ไปยังเส้นทางที่มีอยู่สำหรับรูปภาพเท่านั้นเมื่อไม่มีพาธเฉพาะของ LINE

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่าพาธ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway สามารถเข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
