---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook + ข้อมูลประจำตัว
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การติดตั้ง การกำหนดค่า และการใช้งาน Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-05-02T10:08:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับ
การยืนยันตัวตน

สถานะ: Plugin ที่ดาวน์โหลดได้ รองรับข้อความส่วนตัว, แชตกลุ่ม, สื่อ, ตำแหน่งที่ตั้ง, ข้อความ Flex,
ข้อความเทมเพลต และการตอบกลับด่วน ไม่รองรับการแสดงความรู้สึกและเธรด

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

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

```
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook ของ LINE (GET) และเหตุการณ์ขาเข้า (POST)
หากคุณต้องใช้พาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นอยู่กับเนื้อหาบอดี้ (HMAC บนบอดี้ดิบ) ดังนั้น OpenClaw จึงใช้ขีดจำกัดบอดี้ก่อนการยืนยันตัวตนและ timeout อย่างเข้มงวดก่อนตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอดิบที่ตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดยมิดเดิลแวร์ต้นทางจะถูกละเว้นเพื่อความปลอดภัยด้านความถูกต้องของลายเซ็น

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

ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้นเท่านั้น):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ไฟล์โทเค็น/secret:

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

Allowlist และนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID ผู้ใช้ LINE ที่อยู่ใน allowlist สำหรับ DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID ผู้ใช้ LINE ที่อยู่ใน allowlist สำหรับกลุ่ม
- การ override รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- หมายเหตุ runtime: หาก `channels.line` ไม่มีอยู่เลย runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

ID ของ LINE แยกตัวพิมพ์เล็กใหญ่ ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระ hex 32 ตัว
- กลุ่ม: `C` + อักขระ hex 32 ตัว
- ห้อง: `R` + อักขระ hex 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งเป็นส่วนละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; code block และตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์; LINE จะได้รับส่วนข้อความเต็มพร้อมแอนิเมชันโหลด
  ขณะที่ agent ทำงาน
- การดาวน์โหลดสื่อถูกจำกัดโดย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ให้ agent โดยตรงกับที่เก็บสื่อร่วมที่ Plugin ช่องทางแบบ bundled อื่นๆ ใช้

## ข้อมูลช่องทาง (ข้อความแบบ rich)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน, ตำแหน่งที่ตั้ง, การ์ด Flex หรือข้อความเทมเพลต

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

LINE Plugin ยังมาพร้อมคำสั่ง `/card` สำหรับพรีเซ็ตข้อความ Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกบทสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับบทสนทนาแบบ active ทำงานบน LINE เหมือนช่องทางบทสนทนาอื่นๆ

ดูรายละเอียดที่ [agent ACP](/th/tools/acp-agents)

## สื่อขาออก

LINE Plugin รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่านเครื่องมือข้อความของ agent สื่อจะถูกส่งผ่านพาธการจัดส่งเฉพาะของ LINE พร้อมการจัดการตัวอย่างและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE พร้อมการสร้างตัวอย่างอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการตัวอย่างและชนิดเนื้อหาอย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบ hostname เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมาย loopback, link-local และ private-network

การส่งสื่อทั่วไปจะ fallback ไปยังเส้นทางแบบรูปภาพเท่านั้นที่มีอยู่เดิมเมื่อไม่มีพาธเฉพาะของ LINE

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่าพาธ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway เข้าถึงได้จาก LINE
- **ข้อผิดพลาดการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการ gating ด้วยการ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
