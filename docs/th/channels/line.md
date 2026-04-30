---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า LINE Webhook + ข้อมูลประจำตัว
    - คุณต้องการตัวเลือกข้อความเฉพาะของ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin LINE Messaging API
title: บรรทัด
x-i18n:
    generated_at: "2026-04-30T09:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API Plugin ทำงานเป็นตัวรับ webhook บน Gateway และใช้ channel access token + channel secret ของคุณสำหรับการยืนยันตัวตน

สถานะ: Plugin ที่รวมมาในแพ็กเกจ รองรับข้อความโดยตรง แชตกลุ่ม สื่อ ตำแหน่งที่ตั้ง ข้อความ Flex ข้อความเทมเพลต และการตอบกลับด่วน ไม่รองรับรีแอ็กชันและเธรด

## Plugin ที่รวมมาในแพ็กเกจ

LINE มาพร้อมเป็น Plugin ที่รวมมาในแพ็กเกจใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม LINE ให้ติดตั้งแพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

```bash
openclaw plugins install @openclaw/line
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้หรือไม่มีอยู่ ให้ใช้บิลด์ OpenClaw แบบแพ็กเกจปัจจุบัน หรือ checkout ภายในเครื่องจนกว่าขบวนแพ็กเกจ npm จะตามทัน

Checkout ภายในเครื่อง (เมื่อเรียกใช้จาก git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## การตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้งาน **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า webhook URL เป็นปลายทาง Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway ตอบสนองต่อการตรวจสอบ webhook ของ LINE (GET) และอีเวนต์ขาเข้า (POST)
หากต้องการพาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` แล้วอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นอยู่กับ body (HMAC บน raw body) ดังนั้น OpenClaw จึงใช้ขีดจำกัด body ก่อนยืนยันตัวตนและ timeout แบบเข้มงวดก่อนการตรวจสอบ
- OpenClaw ประมวลผลอีเวนต์ webhook จากไบต์คำขอ raw ที่ผ่านการตรวจสอบ ค่า `req.body` ที่ถูกแปลงโดย middleware ต้นทางจะถูกละเว้นเพื่อความปลอดภัยด้านความสมบูรณ์ของลายเซ็น

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

ตัวแปรสภาพแวดล้อม (เฉพาะบัญชีเริ่มต้น):

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

ค่าเริ่มต้นของข้อความโดยตรงคือการจับคู่ ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และข้อความของพวกเขาจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist และนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user ID ที่อยู่ใน allowlist สำหรับ DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user ID ที่อยู่ใน allowlist สำหรับกลุ่ม
- การแทนที่ต่อกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- หมายเหตุรันไทม์: หาก `channels.line` หายไปทั้งหมด รันไทม์จะ fallback ไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

LINE ID คำนึงถึงตัวพิมพ์เล็กใหญ่ ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระ hex 32 ตัว
- กลุ่ม: `C` + อักขระ hex 32 ตัว
- ห้อง: `R` + อักขระ hex 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งเป็นชิ้นที่ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก บล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex เมื่อทำได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์ LINE จะได้รับชิ้นข้อความเต็มพร้อมแอนิเมชันโหลดระหว่างที่เอเจนต์ทำงาน
- การดาวน์โหลดสื่อถูกจำกัดด้วย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อให้เอเจนต์ โดยตรงกับที่เก็บสื่อร่วมที่ใช้โดย Plugin ช่องทางที่รวมมาในแพ็กเกจอื่นๆ

## ข้อมูลช่องทาง (ข้อความแบบสมบูรณ์)

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

LINE Plugin ยังมาพร้อมคำสั่ง `/card` สำหรับพรีเซ็ตข้อความ Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนาของ ACP (โปรโตคอลการสื่อสารของเอเจนต์):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันกับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาที่กำลังใช้งานทำงานบน LINE ได้เหมือนช่องทางการสนทนาอื่นๆ

ดูรายละเอียดที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

LINE Plugin รองรับการส่งรูปภาพ วิดีโอ และไฟล์เสียงผ่านเครื่องมือข้อความของเอเจนต์ สื่อจะถูกส่งผ่านพาธการส่งเฉพาะของ LINE พร้อมการจัดการตัวอย่างและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE พร้อมการสร้างตัวอย่างอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการตัวอย่างและ content-type อย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE

URL ของสื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw ตรวจสอบชื่อโฮสต์เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายแบบ loopback, link-local และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปจะ fallback ไปยังเส้นทางรูปภาพเท่านั้นที่มีอยู่ เมื่อไม่มีพาธเฉพาะของ LINE

## การแก้ไขปัญหา

- **การตรวจสอบ webhook ล้มเหลว:** ตรวจสอบว่า webhook URL เป็น HTTPS และ `channelSecret` ตรงกับ LINE console
- **ไม่มีอีเวนต์ขาเข้า:** ยืนยันว่าพาธ webhook ตรงกับ `channels.line.webhookPath` และ Gateway สามารถเข้าถึงได้จาก LINE
- **ข้อผิดพลาดการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกินขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
