---
read_when:
    - กำลังทำงานกับพฤติกรรมของ WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องข้อความ
summary: การรองรับช่องทาง WhatsApp การควบคุมการเข้าถึง พฤติกรรมการส่ง และการปฏิบัติการ
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T10:15:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (ช่องทางเว็บ)

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นผู้ดูแล linked session

## การติดตั้ง (เมื่อต้องใช้)

- การเริ่มต้นใช้งาน (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะมีพรอมต์ให้ติดตั้ง plugin WhatsApp เมื่อคุณเลือกใช้งานครั้งแรก
- `openclaw channels login --channel whatsapp` จะมีขั้นตอนการติดตั้งให้ด้วย
  หากยังไม่มี plugin
- ช่องทาง dev + git checkout: ใช้ path ของ plugin ภายในเครื่องเป็นค่าเริ่มต้น
- Stable/Beta: ใช้ npm package `@openclaw/whatsapp` เป็นค่าเริ่มต้น

ยังสามารถติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับผู้ส่งที่ไม่รู้จักคือการจับคู่
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างคอนฟิกช่องทางแบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดนโยบายการเข้าถึง WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="เชื่อมต่อ WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    สำหรับบัญชีเฉพาะ:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="เริ่มต้น Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="อนุมัติคำขอจับคู่ครั้งแรก (หากใช้โหมด pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp กับหมายเลขแยกต่างหากเมื่อเป็นไปได้ (metadata ของช่องทางและขั้นตอนการตั้งค่าได้รับการปรับให้เหมาะกับรูปแบบนี้ แต่ก็รองรับการใช้งานกับหมายเลขส่วนตัวเช่นกัน)
</Note>

## รูปแบบการติดตั้งใช้งาน

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะสำหรับระบบ (แนะนำ)">
    นี่คือโหมดการดำเนินงานที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - allowlist สำหรับ DM และขอบเขตการกำหนดเส้นทางที่ชัดเจนกว่า
    - ลดโอกาสเกิดความสับสนจากการแชตกับตัวเอง

    รูปแบบนโยบายขั้นต่ำ:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ทางเลือกสำรองด้วยหมายเลขส่วนตัว">
    การเริ่มต้นใช้งานรองรับโหมดหมายเลขส่วนตัวและจะเขียนค่าพื้นฐานที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` มีหมายเลขส่วนตัวของคุณรวมอยู่ด้วย
    - `selfChatMode: true`

    ระหว่างรันไทม์ การป้องกันการแชตกับตัวเองจะอิงกับหมายเลขของตัวเองที่เชื่อมต่อไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทาง WhatsApp Web เท่านั้น">
    ช่องทางแพลตฟอร์มส่งข้อความในสถาปัตยกรรมช่องทางของ OpenClaw ปัจจุบันใช้ WhatsApp Web (`Baileys`)

    ไม่มีช่องทางส่งข้อความ WhatsApp ผ่าน Twilio แยกต่างหากใน registry ของช่องทางแชตที่มีมาให้ในระบบ

  </Accordion>
</AccordionGroup>

## โมเดลรันไทม์

- Gateway เป็นผู้ดูแล WhatsApp socket และลูป reconnect
- การส่งข้อความขาออกต้องมี listener ของ WhatsApp ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย
- ระบบจะเพิกเฉยต่อแชตสถานะและ broadcast (`@status`, `@broadcast`)
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` จะรวม DM เข้ากับเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มจะแยกออกจากกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- การขนส่งผ่าน WhatsApp Web จะใช้ตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ของ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / ตัวพิมพ์เล็ก) แนะนำให้ใช้คอนฟิก proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะช่องทางของ WhatsApp

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องมี `"*"` อยู่ใน `allowFrom`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (ระบบจะ normalize ภายใน)

    การแทนที่สำหรับหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) จะมีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมรันไทม์:

    - การจับคู่จะถูกเก็บถาวรใน allow-store ของช่องทางและรวมเข้ากับ `allowFrom` ที่กำหนดไว้
    - หากไม่ได้กำหนด allowlist ไว้ หมายเลขของตัวเองที่เชื่อมต่อไว้จะได้รับอนุญาตโดยค่าเริ่มต้น
    - DM ขาออกแบบ `fromMe` จะไม่ถูกจับคู่ให้อัตโนมัติ

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlist">
    การเข้าถึงกลุ่มมี 2 ชั้น:

    1. **allowlist ของสมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากไม่ได้กำหนด `groups` ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` ระบบจะถือว่าเป็น allowlist ของกลุ่ม (`"*"` ใช้ได้)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ของผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกข้อความขาเข้าจากกลุ่มทั้งหมด

    การ fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะ fallback ไปใช้ `allowFrom` เมื่อมี
    - ระบบจะประเมิน allowlist ของผู้ส่งก่อนการเปิดใช้งานด้วย mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย การ fallback ของนโยบายกลุ่มในรันไทม์จะเป็น `allowlist` (พร้อมคำเตือนใน log) แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - การ mention ตัวตนของบอตใน WhatsApp โดยตรง
    - รูปแบบ regex สำหรับ mention ที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback เป็น `messages.groupChat.mentionPatterns`)
    - การตรวจจับการตอบกลับถึงบอตโดยนัย (ผู้ส่งข้อความที่ตอบกลับตรงกับตัวตนของบอต)

    หมายเหตุด้านความปลอดภัย:

    - การ quote/reply ทำให้ผ่านเงื่อนไข mention gating เท่านั้น; ไม่ได้ให้สิทธิ์การอนุญาตแก่ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ใน allowlist จะยังคงถูกบล็อก แม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist ก็ตาม

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` จะอัปเดตสถานะของเซสชัน (ไม่ใช่คอนฟิกแบบ global) และถูกจำกัดให้เจ้าของใช้ได้เท่านั้น

  </Tab>
</Tabs>

## พฤติกรรมของหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขของตัวเองที่เชื่อมต่อไว้มีอยู่ใน `allowFrom` ด้วย ระบบป้องกันการแชตกับตัวเองของ WhatsApp จะทำงาน:

- ข้าม read receipt สำหรับรอบการสนทนาแบบแชตกับตัวเอง
- เพิกเฉยต่อพฤติกรรมทริกเกอร์อัตโนมัติจาก mention-JID ที่อาจทำให้คุณถูก ping เอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` การตอบกลับในแชตกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและบริบท

<AccordionGroup>
  <Accordion title="ซองข้อความขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วย inbound envelope แบบใช้ร่วมกัน

    หากมี quoted reply ระบบจะเพิ่มบริบทในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์ metadata ของการตอบกลับจะถูกเติมด้วยเมื่อมีข้อมูล (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="ตัวแทนสื่อและการดึงข้อมูลตำแหน่ง/รายชื่อติดต่อ">
    ข้อความขาเข้าที่มีเฉพาะสื่อจะถูก normalize ด้วยตัวแทนเช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    payload ของตำแหน่งที่ตั้งและรายชื่อติดต่อจะถูก normalize เป็นบริบทข้อความก่อนการกำหนดเส้นทาง

  </Accordion>

  <Accordion title="การแทรกประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ถูกประมวลผลสามารถถูกบัฟเฟอร์และแทรกเป็นบริบทได้เมื่อบอตถูกทริกเกอร์ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - คอนฟิก: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    เครื่องหมายการแทรก:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipt">
    Read receipt เปิดใช้งานโดยค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ได้รับการยอมรับ

    ปิดใช้งานทั้งระบบ:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    การแทนที่รายบัญชี:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    รอบการสนทนาแบบแชตกับตัวเองจะข้าม read receipt แม้เปิดใช้งานทั้งระบบอยู่

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่งข้อความ และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความ">
    - ขีดจำกัดการแบ่งข้อความเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะพยายามแบ่งตามขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน แล้วค่อย fallback ไปใช้การแบ่งตามความยาวที่ปลอดภัย
  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับ payload แบบรูปภาพ วิดีโอ เสียง (voice note แบบ PTT) และเอกสาร
    - `audio/ogg` จะถูกเขียนใหม่เป็น `audio/ogg; codecs=opus` เพื่อให้เข้ากันได้กับ voice note
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - caption จะถูกใช้กับรายการสื่อรายการแรกเมื่อส่ง payload ตอบกลับแบบหลายสื่อ
    - แหล่งที่มาของสื่อสามารถเป็น HTTP(S), `file://` หรือ path ภายในเครื่อง
  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรม fallback">
    - ขีดจำกัดการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - ขีดจำกัดการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับแต่งอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้อยู่ในขีดจำกัด
    - หากการส่งสื่อล้มเหลว fallback ของรายการแรกจะส่งข้อความเตือนแทนการทิ้งการตอบกลับอย่างเงียบ ๆ
  </Accordion>
</AccordionGroup>

## การ quote ตอนตอบกลับ

WhatsApp รองรับการ quote ขณะตอบกลับแบบเนทีฟ โดยคำตอบขาออกจะแสดงการ quote ข้อความขาเข้าอย่างชัดเจน ควบคุมด้วย `channels.whatsapp.replyToMode`

| Value    | พฤติกรรม                                                                         |
| -------- | -------------------------------------------------------------------------------- |
| `"auto"` | quote ข้อความขาเข้าเมื่อ provider รองรับ; ข้ามการ quote หากไม่รองรับ            |
| `"on"`   | quote ข้อความขาเข้าเสมอ; fallback เป็นการส่งข้อความธรรมดาหากการ quote ถูกปฏิเสธ |
| `"off"`  | ไม่ quote; ส่งเป็นข้อความธรรมดา                                                 |

ค่าเริ่มต้นคือ `"auto"` การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## ระดับ reaction

`channels.whatsapp.reactionLevel` ควบคุมขอบเขตการใช้ emoji reaction ของเอเจนต์บน WhatsApp:

| Level         | Ack reaction | Reaction ที่เอเจนต์เริ่มเอง | คำอธิบาย                                       |
| ------------- | ------------ | --------------------------- | ---------------------------------------------- |
| `"off"`       | ไม่ใช้        | ไม่ใช้                       | ไม่มี reaction เลย                              |
| `"ack"`       | มี           | ไม่มี                        | มีเฉพาะ ack reaction (ตอบรับก่อนตอบข้อความ)     |
| `"minimal"`   | มี           | มี (แบบระมัดระวัง)          | Ack + reaction ของเอเจนต์พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | มี           | มี (สนับสนุนให้ใช้)         | Ack + reaction ของเอเจนต์พร้อมแนวทางที่ส่งเสริม   |

ค่าเริ่มต้น: `"minimal"`

การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Ack reaction

WhatsApp รองรับ ack reaction ทันทีเมื่อรับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
Ack reaction จะถูกควบคุมโดย `reactionLevel` — ระบบจะไม่ส่งเมื่อ `reactionLevel` เป็น `"off"`

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

หมายเหตุเกี่ยวกับพฤติกรรม:

- ส่งทันทีหลังจากรับข้อความขาเข้าแล้ว (ก่อนตอบกลับ)
- หากล้มเหลว ระบบจะบันทึกลง log แต่ไม่ขัดขวางการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะทำ reaction ในรอบที่ถูกทริกเกอร์ด้วย mention; การเปิดใช้งานกลุ่มแบบ `always` จะทำหน้าที่ข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (`messages.ackReaction` แบบเดิมไม่ได้ใช้ที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - account id มาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมี มิฉะนั้นใช้ account id ตัวแรกที่กำหนดไว้ (เรียงลำดับแล้ว)
    - account id จะถูก normalize ภายในสำหรับการค้นหา
  </Accordion>

  <Accordion title="พาธข้อมูลรับรองและความเข้ากันได้กับระบบเดิม">
    - พาธ auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth แบบเดิมสำหรับบัญชีเริ่มต้นใน `~/.openclaw/credentials/` ยังถูกตรวจพบ/ย้ายข้อมูลได้สำหรับโฟลว์บัญชีเริ่มต้น
  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` จะล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    ในไดเรกทอรี auth แบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ auth ของ Baileys จะถูกลบออก

  </Accordion>
</AccordionGroup>

## Tools, actions และการเขียนคอนฟิก

- การรองรับ tool ของเอเจนต์รวมถึง action reaction ของ WhatsApp (`react`)
- ตัวควบคุม action:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนคอนฟิกที่เริ่มจากช่องทางถูกเปิดใช้งานโดยค่าเริ่มต้น (ปิดได้ด้วย `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้เชื่อมต่อ (ต้องสแกน QR)">
    อาการ: สถานะช่องทางแสดงว่ายังไม่ได้เชื่อมต่อ

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมต่อแล้วแต่หลุด / วน reconnect">
    อาการ: บัญชีเชื่อมต่ออยู่แต่มีการตัดการเชื่อมต่อหรือพยายาม reconnect ซ้ำ ๆ

    วิธีแก้:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    หากจำเป็น ให้เชื่อมต่อใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ทำงานอยู่ขณะส่ง">
    การส่งขาออกจะล้มเหลวทันทีเมื่อไม่มี listener ของ Gateway ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานและบัญชีนั้นเชื่อมต่ออยู่

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกเพิกเฉยโดยไม่คาดคิด">
    ให้ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ใน `groups`
    - mention gating (`requireMention` + รูปแบบ mention)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการหลังจะเขียนทับรายการก่อน ดังนั้นควรมี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ Gateway ของ WhatsApp ควรใช้ Node โดย Bun ถูกระบุว่าไม่เข้ากันกับการทำงานของ Gateway แบบเสถียรสำหรับ WhatsApp/Telegram
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp รองรับ system prompt แบบเดียวกับ Telegram สำหรับกลุ่มและแชตโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการ resolve สำหรับข้อความกลุ่ม:

ระบบจะกำหนดแมป `groups` ที่มีผลก่อน: หากบัญชีกำหนด `groups` ของตัวเอง ระบบจะใช้แมปนั้นแทน `groups` ระดับ root ทั้งหมด (ไม่มี deep merge) จากนั้นจึงค้นหา prompt ในแมปเดียวที่ได้ผลลัพธ์:

1. **system prompt เฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการของกลุ่มนั้นกำหนด `systemPrompt`
2. **system prompt wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะกลุ่ม หรือมีแต่ไม่ได้กำหนด `systemPrompt`

ลำดับชั้นการ resolve สำหรับข้อความโดยตรง:

ระบบจะกำหนดแมป `direct` ที่มีผลก่อน: หากบัญชีกำหนด `direct` ของตัวเอง ระบบจะใช้แมปนั้นแทน `direct` ระดับ root ทั้งหมด (ไม่มี deep merge) จากนั้นจึงค้นหา prompt ในแมปเดียวที่ได้ผลลัพธ์:

1. **system prompt เฉพาะแชตโดยตรง** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อรายการของ peer นั้นกำหนด `systemPrompt`
2. **system prompt wildcard ของแชตโดยตรง** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะ peer หรือมีแต่ไม่ได้กำหนด `systemPrompt`

หมายเหตุ: `dms` ยังคงเป็นบัคเก็ตการแทนที่ประวัติราย DM แบบน้ำหนักเบา (`dms.<id>.historyLimit`); การแทนที่ prompt จะอยู่ภายใต้ `direct`

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ระบบจะระงับ `groups` ระดับ root สำหรับทุกบัญชีโดยตั้งใจในชุดการตั้งค่าหลายบัญชี — แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง — เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่บอตไม่ได้อยู่ด้วย WhatsApp ไม่ใช้กลไกป้องกันนี้: `groups` และ `direct` ระดับ root จะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ ไม่ว่าจะตั้งค่ากี่บัญชีก็ตาม ในชุดการตั้งค่าหลายบัญชีของ WhatsApp หากคุณต้องการ prompt สำหรับกลุ่มหรือแชตโดยตรงแยกรายบัญชี ให้กำหนดแมปทั้งหมดไว้ใต้แต่ละบัญชีอย่างชัดเจนแทนการพึ่งค่าเริ่มต้นระดับ root

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปคอนฟิกรายกลุ่มและ allowlist ระดับแชตของกลุ่ม ไม่ว่าจะในระดับ root หรือระดับบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- ให้เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุด group ID แบบคงที่เท่านั้นที่มีสิทธิ์ อย่าใช้ `groups["*"]` เป็น prompt ค่าเริ่มต้น แต่ให้ใส่ prompt ซ้ำในแต่ละรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจน
- การอนุญาตกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบแยกกัน `groups["*"]` จะขยายชุดของกลุ่มที่สามารถเข้าสู่การจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นโดยอัตโนมัติ การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` เพียงให้คอนฟิกแชตโดยตรงค่าเริ่มต้นหลังจาก DM นั้นผ่านการอนุญาตแล้วด้วย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎ pairing-store

ตัวอย่าง:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ใช้เฉพาะเมื่อทุกกลุ่มควรได้รับอนุญาตในขอบเขต root
        // มีผลกับทุกบัญชีที่ไม่ได้กำหนดแมป groups ของตัวเอง
        "*": { systemPrompt: "พรอมต์เริ่มต้นสำหรับทุกกลุ่ม" },
      },
      direct: {
        // มีผลกับทุกบัญชีที่ไม่ได้กำหนดแมป direct ของตัวเอง
        "*": { systemPrompt: "พรอมต์เริ่มต้นสำหรับทุกแชตโดยตรง" },
      },
      accounts: {
        work: {
          groups: {
            // บัญชีนี้กำหนด groups ของตัวเอง ดังนั้น groups ระดับ root จะถูก
            // แทนที่ทั้งหมด หากต้องการคง wildcard ไว้ ให้กำหนด "*" ที่นี่ด้วยอย่างชัดเจน
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "มุ่งเน้นที่การจัดการโครงการ",
            },
            // ใช้เฉพาะเมื่อทุกกลุ่มควรได้รับอนุญาตในบัญชีนี้
            "*": { systemPrompt: "พรอมต์เริ่มต้นสำหรับกลุ่มงาน" },
          },
          direct: {
            // บัญชีนี้กำหนด direct ของตัวเอง ดังนั้นรายการ direct ระดับ root จะถูก
            // แทนที่ทั้งหมด หากต้องการคง wildcard ไว้ ให้กำหนด "*" ที่นี่ด้วยอย่างชัดเจน
            "+15551234567": { systemPrompt: "พรอมต์สำหรับแชตโดยตรงของงานที่ระบุ" },
            "*": { systemPrompt: "พรอมต์เริ่มต้นสำหรับแชตโดยตรงของงาน" },
          },
        },
      },
    },
  },
}
```

## ตัวชี้อ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก:

- [ข้อมูลอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/configuration-reference#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การแทนที่ระดับบัญชี
- การปฏิบัติการ: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- พฤติกรรมเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
