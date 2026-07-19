---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า Webhook และข้อมูลประจำตัวของ LINE
    - คุณต้องการตัวเลือกข้อความเฉพาะสำหรับ LINE
summary: การตั้งค่า การกำหนดค่า และการใช้งาน Plugin สำหรับ LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-19T06:56:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa160970278e0899637307136139f7d2fc83bf57defc30771d77649060f77274
    source_path: channels/line.md
    workflow: 16
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย Plugin ทำงานเป็นตัวรับ Webhook
บน Gateway และใช้โทเค็นการเข้าถึงช่องทาง + ข้อมูลลับของช่องทางสำหรับ
การยืนยันตัวตน

สถานะ: Plugin อย่างเป็นทางการ ติดตั้งแยกต่างหาก รองรับข้อความส่วนตัว แชตกลุ่ม สื่อ
ตำแหน่งที่ตั้ง ข้อความ Flex ข้อความเทมเพลต และการตอบกลับด่วน
ไม่รองรับรีแอ็กชันและเธรด

## การติดตั้ง

ติดตั้ง LINE ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จากที่เก็บ git):

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

Gateway ตอบกลับการตรวจสอบ Webhook ของ LINE (GET) สำหรับเหตุการณ์ขาเข้าที่ลงนามแล้ว
(POST) ระบบจะเขียนแต่ละเหตุการณ์ลงในคิวขาเข้าแบบคงทนก่อนส่งคืน `200`;
การประมวลผลของเอเจนต์จะดำเนินต่อแบบอะซิงโครนัส การนำส่งที่ล้มเหลวจะถูกลองใหม่จาก
คิว รวมถึงหลังจาก Gateway เริ่มทำงานใหม่ และเหตุการณ์ที่ประมวลผลไม่ได้จะกลายเป็นระเบียนคิว
ที่ล้มเหลวหลังจากลองใหม่ตามจำนวนที่จำกัด หากการจัดเก็บแบบคงทนล้มเหลว คำขอจะส่งคืน
`500` แทนการตอบรับเหตุการณ์ที่อาจสูญหาย
รับประกันการนำส่งอย่างน้อยหนึ่งครั้งตลอดขอบเขตระหว่างคิวกับเอเจนต์: การปิดหรือ
การขัดข้องของ Gateway ระหว่างการนำส่งที่กำลังทำงานอาจทำให้เทิร์นถูกเล่นซ้ำ เหตุการณ์ข้อความจะขจัดรายการซ้ำด้วย
ID ข้อความ LINE ส่วนเหตุการณ์ประเภทอื่นใช้ `webhookEventId` ระเบียนการเสร็จสิ้นที่เก็บไว้
จะระงับ Webhook ซ้ำตามปกติ แต่ตัวจัดการที่ก่อให้เกิดผลข้างเคียงต่อระบบภายนอก
ควรทำงานซ้ำได้โดยให้ผลลัพธ์เดิม
หากต้องการใช้เส้นทางแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` และปรับ URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็น LINE ขึ้นอยู่กับเนื้อความ (HMAC บนเนื้อความดิบ) ดังนั้น OpenClaw จึงใช้ขีดจำกัดเนื้อความก่อนยืนยันตัวตนอย่างเข้มงวด (64 KB) และการหมดเวลาอ่านก่อนการตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอดิบที่ตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดยมิดเดิลแวร์ต้นทางจะถูกละเว้นเพื่อรักษาความสมบูรณ์ของลายเซ็น

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

การกำหนดค่าข้อความส่วนตัวแบบสาธารณะ:

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

ข้อความส่วนตัวใช้การจับคู่เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่และ
ข้อความของผู้ส่งจะถูกละเว้นจนกว่าจะได้รับอนุมัติ:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

รายการอนุญาตและนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น `pairing`)
- `channels.line.allowFrom`: ID ผู้ใช้ LINE ในรายการอนุญาตสำหรับข้อความส่วนตัว; `dmPolicy: "open"` ต้องมี `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (ค่าเริ่มต้น `allowlist`)
- `channels.line.groupAllowFrom`: ID ผู้ใช้ LINE ในรายการอนุญาตสำหรับกลุ่ม; รายการ `allowFrom` ของข้อความส่วนตัวไม่อนุญาตผู้ส่งในกลุ่ม
- การกำหนดทับต่อกลุ่ม: `channels.line.groups.<groupId>.allowFrom` (รวมถึง `enabled`, `requireMention`, `systemPrompt`, `skills`) เมื่อใช้
  `groupPolicy: "allowlist"` ให้ตั้งค่า `groupAllowFrom` หรือ `allowFrom` รายกลุ่ม; รายการอนุญาตของกลุ่มที่ว่างเปล่าจะบล็อกข้อความกลุ่มแม้ว่าข้อความส่วนตัวจะเปิดอยู่
- กลุ่มการเข้าถึงของผู้ส่งแบบคงที่สามารถอ้างอิงจาก `allowFrom`, `groupAllowFrom` และ `allowFrom` รายกลุ่มด้วย `accessGroup:<name>`; ดู[กลุ่มการเข้าถึง](/th/channels/access-groups)
- หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.line` เลย รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้)

ID ของ LINE แยกแยะตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระเลขฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระเลขฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระเลขฐานสิบหก 32 ตัว

## ลักษณะการทำงานของข้อความ

- ข้อความถูกแบ่งเป็นส่วนละ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; บล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex
  เมื่อทำได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์; LINE จะได้รับส่วนข้อความแบบครบถ้วนพร้อมภาพเคลื่อนไหว
  แสดงการโหลดขณะที่เอเจนต์กำลังทำงาน
- การดาวน์โหลดสื่อถูกจำกัดด้วย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)
- สื่อขาเข้าจะถูกบันทึกไว้ภายใต้ `~/.openclaw/media/inbound/` ก่อนส่งต่อ
  ให้เอเจนต์ โดยใช้ที่เก็บสื่อร่วมเดียวกับที่ Plugin ช่องทางอื่นใช้

## ข้อมูลช่องทาง (ข้อความแบบสมบูรณ์)

ใช้ `channelData.line` เพื่อส่งการตอบกลับด่วน ตำแหน่งที่ตั้ง การ์ด Flex หรือข้อความ
เทมเพลต

```json5
{
  text: "จัดให้",
  channelData: {
    line: {
      quickReplies: ["สถานะ", "ความช่วยเหลือ"],
      location: {
        title: "สำนักงาน",
        address: "123 ถนนเมน",
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

Plugin LINE ยังมาพร้อมกับคำสั่ง `/card` สำหรับค่าที่กำหนดไว้ล่วงหน้าของข้อความ Flex:

```text
/card info "ยินดีต้อนรับ" "ขอบคุณที่เข้าร่วม!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนาของ ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` ผูกแชต LINE ปัจจุบันกับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ทำงานอยู่ซึ่งผูกกับการสนทนาจะทำงานบน LINE เช่นเดียวกับช่องทางการสนทนาอื่น

ดูรายละเอียดที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

Plugin LINE ส่งรูปภาพ วิดีโอ และเสียงผ่านเครื่องมือข้อความของเอเจนต์:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE; รูปภาพตัวอย่างใช้ URL สื่อเป็นค่าเริ่มต้น
- **วิดีโอ**: ต้องมีรูปภาพตัวอย่าง; ตั้งค่า `channelData.line.previewImageUrl` เป็น URL รูปภาพ
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE; ระยะเวลาเริ่มต้นคือ 60 วินาที เว้นแต่จะตั้งค่า `channelData.line.durationMs`

ชนิดสื่อจะนำมาจาก `channelData.line.mediaKind` เมื่อตั้งค่าไว้ มิฉะนั้นจะอนุมาน
จากตัวเลือก LINE อื่นหรือนามสกุลไฟล์ของ URL โดยใช้รูปภาพเป็นทางเลือกสำรอง

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะที่มีความยาวไม่เกิน 2000 อักขระ OpenClaw
ตรวจสอบชื่อโฮสต์เป้าหมายก่อนส่ง URL ให้ LINE และปฏิเสธเป้าหมายแบบลูปแบ็ก
ลิงก์โลคัล และเครือข่ายส่วนตัว

การส่งสื่อทั่วไปโดยไม่มีตัวเลือกเฉพาะสำหรับ LINE จะใช้เส้นทางรูปภาพ

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับ LINE Console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่าเส้นทาง Webhook ตรงกับ `channels.line.webhookPath`
  และ LINE สามารถเข้าถึง Gateway ได้
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนสำหรับข้อความส่วนตัวและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
