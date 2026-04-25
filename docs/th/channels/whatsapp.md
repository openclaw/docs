---
read_when:
    - กำลังทำงานเกี่ยวกับพฤติกรรมของช่องทาง WhatsApp/web หรือการกำหนดเส้นทางกล่องข้อความเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่ง และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นผู้ดูแล linked session โดยตรง

## ติดตั้ง (เมื่อจำเป็น)

- ในขั้นตอน onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  ระบบจะถามให้ติดตั้ง Plugin WhatsApp ครั้งแรกที่คุณเลือกใช้
- `openclaw channels login --channel whatsapp` ก็มีโฟลว์ติดตั้งให้เช่นกันเมื่อ
  ยังไม่มี Plugin อยู่
- Dev channel + git checkout: ใช้พาธ Plugin ภายในเครื่องเป็นค่าเริ่มต้น
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` เป็นค่าเริ่มต้น

ยังสามารถติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือ pairing สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและแก้ไขปัญหาข้ามช่องทาง
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
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

    หากต้องการแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่แล้วหรือกำหนดเองก่อนเข้าสู่ระบบ:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="เริ่มต้น gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="อนุมัติคำขอ pairing แรก (หากใช้โหมด pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอ pairing จะหมดอายุภายใน 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้ WhatsApp บนหมายเลขแยกต่างหากเมื่อเป็นไปได้ (ข้อมูลเมตาของช่องทางและโฟลว์การตั้งค่าได้รับการปรับให้เหมาะกับรูปแบบนี้ แต่ก็ยังรองรับการตั้งค่าด้วยหมายเลขส่วนตัวเช่นกัน)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะสำหรับงานนี้ (แนะนำ)">
    นี่คือโหมดการปฏิบัติงานที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - ขอบเขตของ allowlists และการกำหนดเส้นทาง DM ชัดเจนยิ่งขึ้น
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

  <Accordion title="โหมด fallback สำหรับหมายเลขส่วนตัว">
    Onboarding รองรับโหมดหมายเลขส่วนตัวและจะเขียน baseline ที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` มีหมายเลขส่วนตัวของคุณรวมอยู่ด้วย
    - `selfChatMode: true`

    ระหว่างรันไทม์ การป้องกันการแชตกับตัวเองจะอิงจากหมายเลขของตัวเองที่เชื่อมต่ออยู่และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางแบบ WhatsApp Web เท่านั้น">
    ช่องทางของแพลตฟอร์มส่งข้อความนี้อิงกับ WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทางปัจจุบันของ OpenClaw

    ไม่มีช่องทางส่งข้อความ WhatsApp ผ่าน Twilio แยกต่างหากในรีจิสทรี chat-channel ที่มีมาให้ในระบบ

  </Accordion>
</AccordionGroup>

## โมเดลระหว่างรันไทม์

- Gateway เป็นผู้ดูแล WhatsApp socket และลูปการ reconnect
- การส่งข้อความขาออกต้องมี WhatsApp listener ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย
- ระบบจะละเว้นแชตสถานะและแชตประกาศ (`@status`, `@broadcast`)
- แชตโดยตรงใช้กฎ session ของ DM (`session.dmScope`; ค่าเริ่มต้น `main` จะรวม DM เข้ากับ main session ของเอเจนต์)
- Sessions ของกลุ่มจะแยกออกจากกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- การขนส่งผ่าน WhatsApp Web รองรับตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / รูปแบบตัวพิมพ์เล็ก) ควรกำหนดค่า proxy ที่ระดับโฮสต์แทนการตั้งค่า proxy สำหรับ WhatsApp แบบเฉพาะช่องทาง

## Plugin hooks และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนบุคคล หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์สำหรับเชื่อมโยง session ด้วยเหตุนี้
WhatsApp จะไม่กระจาย payload ของ hook `message_received` สำหรับข้อความขาเข้าไปยัง Plugins
เว้นแต่คุณจะเลือกเปิดใช้งานเองอย่างชัดเจน:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

คุณสามารถจำกัดการเปิดใช้งานไว้เฉพาะบัญชีเดียวได้:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

ให้เปิดใช้งานสิ่งนี้เฉพาะกับ Plugins ที่คุณเชื่อถือให้รับ
เนื้อหาข้อความขาเข้าและตัวระบุของ WhatsApp เท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ใช้ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `allowFrom` รองรับหมายเลขแบบ E.164 (ระบบจะ normalize ภายใน)

    การ override แบบหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (รวมถึง `allowFrom`) จะมีลำดับความสำคัญเหนือค่าระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมระหว่างรันไทม์:

    - pairings จะถูกเก็บไว้ใน allow-store ของช่องทางและรวมเข้ากับ `allowFrom` ที่กำหนดค่าไว้
    - หากไม่ได้กำหนด allowlist ไว้ ระบบจะอนุญาตหมายเลขของตัวเองที่เชื่อมต่ออยู่โดยค่าเริ่มต้น
    - OpenClaw จะไม่ auto-pair DM ขาออกที่เป็น `fromMe` (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่เชื่อมต่ออยู่)

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlists">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากไม่ระบุ `groups` ทุกกลุ่มจะถือว่าเข้าเกณฑ์
       - หากมี `groups` ระบบจะถือว่าเป็น group allowlist (รองรับ `"*"`)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม sender allowlist
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกข้อความขาเข้าจากกลุ่มทั้งหมด

    การ fallback ของ sender allowlist:

    - หากไม่ได้ตั้ง `groupAllowFrom` ไว้ ระหว่างรันไทม์จะ fallback ไปใช้ `allowFrom` เมื่อมีให้ใช้
    - sender allowlists จะถูกประเมินก่อนการเปิดใช้งานแบบ mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย การ fallback ของนโยบายกลุ่มระหว่างรันไทม์จะเป็น `allowlist` (พร้อมบันทึกคำเตือน) แม้ว่าจะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    การตรวจจับ mention ครอบคลุม:

    - mention ของตัวตนบอตบน WhatsApp แบบ explicit
    - รูปแบบ regex ของ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback คือ `messages.groupChat.mentionPatterns`)
    - การตรวจจับการตอบกลับถึงบอตแบบ implicit (ผู้ส่งของ reply ตรงกับตัวตนของบอต)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply มีผลเพียงทำให้ผ่าน mention gating เท่านั้น; ไม่ได้ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ใน allowlist จะยังคงถูกบล็อก แม้ว่าจะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist ก็ตาม

    คำสั่งเปิดใช้งานระดับ session:

    - `/activation mention`
    - `/activation always`

    `activation` จะอัปเดตสถานะของ session (ไม่ใช่ค่าคอนฟิกส่วนกลาง) และมีการจำกัดสิทธิ์สำหรับ owner

  </Tab>
</Tabs>

## พฤติกรรมของหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขของตัวเองที่เชื่อมต่ออยู่มีอยู่ใน `allowFrom` ด้วย ระบบป้องกันการแชตกับตัวเองของ WhatsApp จะเริ่มทำงาน:

- ข้ามการส่ง read receipt สำหรับรอบของการแชตกับตัวเอง
- ละเว้นพฤติกรรมทริกเกอร์อัตโนมัติจาก mention-JID ที่อาจทำให้คุณ ping ตัวเอง
- หากไม่ได้ตั้ง `messages.responsePrefix` ไว้ คำตอบใน self-chat จะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและบริบท

<AccordionGroup>
  <Accordion title="ซองข้อมูลขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วย inbound envelope แบบใช้ร่วมกัน

    หากมี quoted reply อยู่ ระบบจะต่อท้ายบริบทในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์ข้อมูลเมตาของ reply จะถูกเติมให้ด้วยเมื่อมี (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="ตัวแทนสื่อและการดึงข้อมูลตำแหน่ง/รายชื่อ">
    ข้อความขาเข้าที่มีแต่สื่ออย่างเดียวจะถูก normalize ด้วย placeholder เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    เนื้อหาตำแหน่งจะใช้ข้อความพิกัดแบบกระชับ ส่วนป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียดรายชื่อ/vCard จะถูกเรนเดอร์เป็นข้อมูลเมตาที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="การแทรกประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ถูกประมวลผลสามารถถูกบัฟเฟอร์และแทรกเป็นบริบทเมื่อบอตถูกทริกเกอร์ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - ค่าคอนฟิก: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    เครื่องหมายสำหรับการแทรก:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Read receipts เปิดใช้งานโดยค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ระบบยอมรับ

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

    Override รายบัญชี:

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

    รอบของ self-chat จะข้าม read receipts แม้จะเปิดใช้ทั้งระบบก็ตาม

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่งข้อความ และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความ">
    - ขีดจำกัดการแบ่งข้อความเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะพยายามแบ่งตามขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน แล้วจึง fallback ไปใช้การแบ่งตามความยาวที่ปลอดภัย
  </Accordion>

  <Accordion title="พฤติกรรมของสื่อขาออก">
    - รองรับ payload แบบรูปภาพ วิดีโอ เสียง (PTT voice-note) และเอกสาร
    - payload ของการตอบกลับจะคงค่า `audioAsVoice`; WhatsApp จะส่งสื่อเสียงเป็น Baileys PTT voice notes
    - เสียงที่ไม่ใช่ Ogg รวมถึงผลลัพธ์ MP3/WebM จาก Microsoft Edge TTS จะถูกแปลงเป็น Ogg/Opus ก่อนส่งแบบ PTT
    - เสียง Ogg/Opus แบบเนทีฟจะถูกส่งด้วย `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับ voice-note
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อรายการแรกเมื่อส่ง payload การตอบกลับแบบหลายสื่อ
    - แหล่งที่มาของสื่อสามารถเป็น HTTP(S), `file://` หรือพาธภายในเครื่อง
  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรม fallback">
    - ขีดจำกัดการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - ขีดจำกัดการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การ override รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับแต่งอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - หากการส่งสื่อล้มเหลว fallback ของรายการแรกจะส่งข้อความเตือนแทนการทิ้งคำตอบไปแบบเงียบๆ
  </Accordion>
</AccordionGroup>

## การ quote ขณะตอบกลับ

WhatsApp รองรับการ quote ขณะตอบกลับแบบเนทีฟ ซึ่งการตอบกลับขาออกจะแสดงการ quote ข้อความขาเข้าอย่างชัดเจน ควบคุมได้ด้วย `channels.whatsapp.replyToMode`

| ค่า         | พฤติกรรม                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่ quote เลย; ส่งเป็นข้อความปกติ                                     |
| `"first"`   | quote เฉพาะข้อความตอบกลับขาออกชิ้นแรก                                |
| `"all"`     | quote ทุกชิ้นของข้อความตอบกลับขาออก                                  |
| `"batched"` | quote เฉพาะข้อความตอบกลับแบบคิวรวม โดยปล่อยให้ข้อความตอบกลับทันทีไม่ quote |

ค่าเริ่มต้นคือ `"off"` การ override รายบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## ระดับ Reaction

`channels.whatsapp.reactionLevel` ใช้ควบคุมว่าเอเจนต์จะใช้ emoji reactions บน WhatsApp อย่างกว้างเพียงใด:

| ระดับ         | Ack reactions | Agent-initiated reactions | คำอธิบาย                                        |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่ใช้        | ไม่ใช้                    | ไม่ใช้ reactions เลย                              |
| `"ack"`       | ใช่           | ไม่ใช้                    | ใช้เฉพาะ ack reactions (ยืนยันรับก่อนตอบกลับ)   |
| `"minimal"`   | ใช่           | ใช่ (แบบระมัดระวัง)      | Ack + agent reactions พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (ส่งเสริมให้ใช้)      | Ack + agent reactions พร้อมแนวทางแบบส่งเสริม   |

ค่าเริ่มต้น: `"minimal"`

การ override รายบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Ack reactions

WhatsApp รองรับ ack reactions แบบทันทีเมื่อรับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
Ack reactions จะถูกควบคุมโดย `reactionLevel` — ระบบจะระงับไว้เมื่อ `reactionLevel` เป็น `"off"`

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
- หากล้มเหลวจะบันทึกลงล็อก แต่ไม่ขัดขวางการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะ react ในรอบที่ถูกทริกเกอร์ด้วย mention; การเปิดใช้งานกลุ่มแบบ `always` จะทำหน้าที่เป็นการข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (`messages.ackReaction` แบบ legacy ไม่ถูกใช้ที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - account ids มาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: ใช้ `default` หากมี มิฉะนั้นใช้ account id ตัวแรกที่กำหนดไว้ (เรียงลำดับแล้ว)
    - ระบบจะ normalize account ids ภายในสำหรับการค้นหา
  </Accordion>

  <Accordion title="พาธของข้อมูลรับรองและความเข้ากันได้กับระบบเดิม">
    - พาธ auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth แบบ default เดิมใน `~/.openclaw/credentials/` ยังถูกจดจำ/ย้ายข้อมูลได้สำหรับโฟลว์บัญชีเริ่มต้น
  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` จะล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    ในไดเรกทอรี auth แบบ legacy ระบบจะเก็บ `oauth.json` ไว้ แต่ลบไฟล์ auth ของ Baileys ออก

  </Accordion>
</AccordionGroup>

## Tools, actions และการเขียนค่าคอนฟิก

- รองรับเครื่องมือของเอเจนต์รวมถึง action สำหรับ WhatsApp reaction (`react`)
- Action gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนค่าคอนฟิกที่เริ่มต้นจากช่องทางเปิดใช้งานโดยค่าเริ่มต้น (ปิดใช้งานได้ด้วย `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้เชื่อมต่อ (ต้องใช้ QR)">
    อาการ: สถานะช่องทางรายงานว่ายังไม่ได้เชื่อมต่อ

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมต่อแล้วแต่ตัดการเชื่อมต่อ / วน reconnect">
    อาการ: บัญชีเชื่อมต่อแล้วแต่ตัดการเชื่อมต่อซ้ำๆ หรือพยายาม reconnect ซ้ำ

    วิธีแก้:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    หากจำเป็น ให้เชื่อมต่อใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ใช้งานอยู่ขณะส่ง">
    การส่งข้อความขาออกจะล้มเหลวทันทีเมื่อไม่มี gateway listener ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า gateway กำลังทำงานและบัญชีนั้นเชื่อมต่ออยู่แล้ว

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเลยอย่างไม่คาดคิด">
    ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ใน `groups`
    - mention gating (`requireMention` + รูปแบบ mention)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการหลังจะ override รายการก่อน ดังนั้นควรมี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ของ Bun">
    รันไทม์ของ WhatsApp gateway ควรใช้ Node โดย Bun ถูกระบุว่าไม่เข้ากันสำหรับการใช้งาน WhatsApp/Telegram gateway แบบเสถียร
  </Accordion>
</AccordionGroup>

## System prompts

WhatsApp รองรับ system prompts แบบเดียวกับ Telegram สำหรับแชตกลุ่มและแชตโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการตัดสินสำหรับข้อความกลุ่ม:

ระบบจะกำหนดแมป `groups` ที่มีผลจริงก่อน: หากบัญชีนั้นกำหนด `groups` ของตัวเองไว้ แมปนี้จะมาแทนที่แมป `groups` ที่ root ทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบนแมปเดียวที่ได้ผลลัพธ์นั้น:

1. **system prompt เฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อมีรายการของกลุ่มนั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้ system prompt
2. **system prompt แบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการของกลุ่มนั้นอยู่ในแมปเลย หรือมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการตัดสินสำหรับข้อความโดยตรง:

ระบบจะกำหนดแมป `direct` ที่มีผลจริงก่อน: หากบัญชีนั้นกำหนด `direct` ของตัวเองไว้ แมปนี้จะมาแทนที่แมป `direct` ที่ root ทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบนแมปเดียวที่ได้ผลลัพธ์นั้น:

1. **system prompt เฉพาะ direct** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมีรายการของ peer นั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้ system prompt
2. **system prompt แบบ wildcard ของ direct** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการของ peer นั้นอยู่ในแมปเลย หรือมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

หมายเหตุ: `dms` ยังคงเป็นบักเก็ต override ประวัติราย DM แบบเบา (`dms.<id>.historyLimit`) ส่วน prompt overrides จะอยู่ใต้ `direct`

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ค่า `groups` ที่ root จะถูกระงับโดยเจตนาสำหรับทุกบัญชีในการตั้งค่าแบบหลายบัญชี — แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง — เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่มันไม่ได้เป็นสมาชิก WhatsApp ไม่ใช้การป้องกันนี้: ค่า `groups` และ `direct` ที่ root จะถูกสืบทอดโดยทุกบัญชีที่ไม่ได้กำหนด override ระดับบัญชีเสมอ ไม่ว่าจะกำหนดกี่บัญชีก็ตาม ในการตั้งค่า WhatsApp แบบหลายบัญชี หากคุณต้องการ prompts รายบัญชีสำหรับกลุ่มหรือ direct ให้กำหนดแมปเต็มไว้ใต้แต่ละบัญชีอย่างชัดเจน แทนการพึ่งค่าเริ่มต้นที่ระดับ root

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปค่าคอนฟิกรายกลุ่มและ group allowlist ระดับแชต ทั้งในขอบเขต root หรือระดับบัญชี `groups["*"]` หมายถึง "ยอมรับทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นยอมรับทุกกลุ่มอยู่แล้วเท่านั้น หากคุณยังต้องการให้มีเพียงชุด group IDs แบบตายตัวที่เข้าเกณฑ์ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของ prompt แต่ให้ใส่ prompt ซ้ำในรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแต่ละรายการแทน
- การยอมรับกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบคนละส่วนกัน `groups["*"]` จะขยายชุดของกลุ่มที่เข้าถึงการจัดการแบบกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นโดยอัตโนมัติ การเข้าถึงของผู้ส่งยังถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ให้เพียงค่าคอนฟิกแชตโดยตรงแบบเริ่มต้นหลังจากที่ DM ได้รับอนุญาตแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎจาก pairing-store

ตัวอย่าง:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ใช้เฉพาะเมื่อทุกกลุ่มควรถูกยอมรับในขอบเขต root
        // ใช้กับทุกบัญชีที่ไม่ได้กำหนด groups map ของตัวเอง
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // ใช้กับทุกบัญชีที่ไม่ได้กำหนด direct map ของตัวเอง
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // บัญชีนี้กำหนด groups ของตัวเอง ดังนั้น root groups จะถูก
            // แทนที่ทั้งหมด หากต้องการคง wildcard ไว้ ให้กำหนด "*" ที่นี่ด้วย
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // ใช้เฉพาะเมื่อทุกกลุ่มควรถูกยอมรับในบัญชีนี้
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // บัญชีนี้กำหนด direct map ของตัวเอง ดังนั้นรายการ root direct จะถูก
            // แทนที่ทั้งหมด หากต้องการคง wildcard ไว้ ให้กำหนด "*" ที่นี่ด้วย
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## ตัวชี้ไปยังข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก:

- [ข้อมูลอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/config-channels#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrides ระดับบัญชี
- การดำเนินงาน: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- พฤติกรรมของ session: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [Security](/th/gateway/security)
- [Channel routing](/th/channels/channel-routing)
- [Multi-agent routing](/th/concepts/multi-agent)
- [Troubleshooting](/th/channels/troubleshooting)
