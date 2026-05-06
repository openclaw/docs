---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook + ข้อมูลรับรอง
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin LINE Messaging API
title: บรรทัด
x-i18n:
    generated_at: "2026-05-06T09:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับ
การยืนยันตัวตน

สถานะ: Plugin ที่ดาวน์โหลดได้ รองรับข้อความส่วนตัว แชทกลุ่ม สื่อ ตำแหน่งที่ตั้ง ข้อความ Flex
ข้อความเทมเพลต และการตอบกลับด่วน ยังไม่รองรับรีแอ็กชันและเธรด

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่าแชนเนล:

```bash
openclaw plugins install @openclaw/line
```

เช็คเอาต์ภายในเครื่อง (เมื่อรันจากรีโป git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## ตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider และเพิ่มแชนเนล **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าแชนเนล
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook เป็นปลายทาง Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook ของ LINE (GET) และอีเวนต์ขาเข้า (POST)
หากคุณต้องการพาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้ตรงกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นกับเนื้อหาบอดี (HMAC บนบอดีดิบ) ดังนั้น OpenClaw จึงใช้ขีดจำกัดบอดีก่อนยืนยันตัวตนและการหมดเวลาอย่างเข้มงวดก่อนตรวจสอบ
- OpenClaw ประมวลผลอีเวนต์ Webhook จากไบต์คำขอดิบที่ตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดยมิดเดิลแวร์ต้นทางจะถูกละเว้นเพื่อความปลอดภัยของความถูกต้องของลายเซ็น

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

การกำหนดค่า DM แบบสาธารณะ:

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
จะถูกละเว้นจนกว่าจะได้รับการอนุมัติ

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
- หมายเหตุรันไทม์: หาก `channels.line` หายไปทั้งหมด รันไทม์จะย้อนกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

ID ของ LINE แยกตัวพิมพ์ใหญ่-เล็ก ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระฐานสิบหก 32 ตัว

## ลักษณะการทำงานของข้อความ

- ข้อความจะถูกแบ่งเป็นชิ้นที่ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกตัดออก บล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- คำตอบแบบสตรีมจะถูกบัฟเฟอร์ LINE จะได้รับชิ้นข้อความเต็มพร้อมแอนิเมชันกำลังโหลด
  ระหว่างที่ agent ทำงาน
- การดาวน์โหลดสื่อถูกจำกัดโดย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ให้ agent โดยตรงกับที่เก็บสื่อร่วมที่ Plugin แชนเนลแบบบันเดิลอื่นใช้

## ข้อมูลแชนเนล (ข้อความแบบริช)

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

LINE รองรับการผูกการสนทนาของ ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชท LINE ปัจจุบันกับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาและกำลังทำงาน ใช้งานบน LINE ได้เหมือนแชนเนลการสนทนาอื่น

ดูรายละเอียดที่ [agent ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin LINE รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่านเครื่องมือข้อความของ agent สื่อจะถูกส่งผ่านพาธการส่งมอบเฉพาะของ LINE พร้อมการจัดการพรีวิวและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE พร้อมการสร้างพรีวิวอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการพรีวิวและชนิดเนื้อหาอย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบชื่อโฮสต์เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายแบบ loopback, link-local และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปจะย้อนกลับไปใช้เส้นทางรูปภาพเท่านั้นที่มีอยู่ เมื่อไม่มีพาธเฉพาะของ LINE

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีอีเวนต์ขาเข้า:** ยืนยันว่าพาธ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway เข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชทกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
