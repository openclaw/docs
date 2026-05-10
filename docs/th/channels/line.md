---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook + ข้อมูลรับรอง
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin LINE Messaging API
title: บรรทัด
x-i18n:
    generated_at: "2026-05-10T19:22:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับ
การยืนยันตัวตน

สถานะ: Plugin ที่ดาวน์โหลดได้ รองรับข้อความส่วนตัว แชทกลุ่ม สื่อ ตำแหน่งที่ตั้ง ข้อความ Flex
ข้อความ template และ quick replies ไม่รองรับ reactions และ threads

## ติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่า channel:

```bash
openclaw plugins install @openclaw/line
```

เช็คเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## ตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่ม channel ของ **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่า channel
4. เปิดใช้งาน **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook เป็น endpoint ของ Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบกลับการตรวจสอบ Webhook ของ LINE (GET) และเหตุการณ์ขาเข้า (POST)
หากคุณต้องใช้ path แบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้ตรงกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบ signature ของ LINE ขึ้นอยู่กับ body (HMAC บน raw body) ดังนั้น OpenClaw จึงใช้ขีดจำกัด body ก่อนการยืนยันตัวตนและ timeout แบบเข้มงวดก่อนการตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอ raw ที่ผ่านการตรวจสอบแล้ว ค่า `req.body` ที่ถูก middleware ต้นทางแปลงจะถูกละเว้นเพื่อความปลอดภัยของความสมบูรณ์ของ signature

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

ตัวแปรแวดล้อม (บัญชีเริ่มต้นเท่านั้น):

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

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ ไม่ยอมรับ symlinks

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

ข้อความส่วนตัวมีค่าเริ่มต้นเป็นการจับคู่ ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และ
ข้อความของพวกเขาจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allowlists และนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs ที่อยู่ใน allowlist สำหรับ DMs; `dmPolicy: "open"` ต้องใช้ `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs ที่อยู่ใน allowlist สำหรับกลุ่ม
- การ override รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- กลุ่มการเข้าถึงผู้ส่งแบบ static สามารถอ้างอิงได้จาก `allowFrom`, `groupAllowFrom` และ `allowFrom` รายกลุ่มด้วย `accessGroup:<name>`
- หมายเหตุ runtime: หาก `channels.line` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

LINE IDs คำนึงถึงตัวพิมพ์ใหญ่เล็ก ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระ hex 32 ตัว
- กลุ่ม: `C` + อักขระ hex 32 ตัว
- ห้อง: `R` + อักขระ hex 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งเป็นช่วงละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; code blocks และตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- การตอบกลับแบบ streaming จะถูก buffer; LINE จะได้รับ chunk แบบเต็มพร้อมแอนิเมชัน loading
  ขณะที่ agent ทำงาน
- การดาวน์โหลดสื่อถูกจำกัดโดย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ไปยัง agent ให้ตรงกับ media store ร่วมที่ใช้โดย Plugin channel แบบ bundled อื่นๆ

## ข้อมูล channel (ข้อความแบบ rich)

ใช้ `channelData.line` เพื่อส่ง quick replies, ตำแหน่งที่ตั้ง, การ์ด Flex หรือข้อความ template

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

Plugin ของ LINE ยังมาพร้อมคำสั่ง `/card` สำหรับ preset ข้อความ Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับ binding การสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชท LINE ปัจจุบันกับเซสชัน ACP โดยไม่สร้าง child thread
- binding ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาที่ active ทำงานบน LINE ได้เหมือน channel การสนทนาอื่นๆ

ดูรายละเอียดที่ [agent ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin ของ LINE รองรับการส่งไฟล์รูปภาพ วิดีโอ และเสียงผ่านเครื่องมือข้อความของ agent สื่อจะถูกส่งผ่าน path การส่งเฉพาะของ LINE พร้อมการจัดการ preview และ tracking ที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพ LINE พร้อมการสร้าง preview อัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการ preview และ content-type แบบชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียง LINE

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบ hostname เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายที่เป็น loopback, link-local และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปจะ fallback ไปยัง route ที่รองรับเฉพาะรูปภาพเดิมเมื่อไม่มี path เฉพาะของ LINE

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่า path ของ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway สามารถเข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channel ทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วยการ mention
- [การกำหนดเส้นทาง Channel](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการ hardening
