---
read_when:
    - การทำงานกับพฤติกรรมของแชนเนล WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องข้อความเข้า
summary: การรองรับแชนเนล WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่งมอบ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

สถานะ: พร้อมใช้งานจริงในระดับ production ผ่าน WhatsApp Web (Baileys) โดย Gateway เป็นเจ้าของเซสชันที่เชื่อมโยงไว้

## การติดตั้ง (เมื่อต้องการ)

- ระหว่าง onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  ระบบจะถามให้ติดตั้ง Plugin WhatsApp ในครั้งแรกที่คุณเลือกใช้งาน
- `openclaw channels login --channel whatsapp` จะมีตัวเลือกขั้นตอนติดตั้งเช่นกันเมื่อ
  ยังไม่มี Plugin นี้
- Dev channel + git checkout: ใช้ค่าเริ่มต้นเป็นพาธ Plugin ภายในเครื่อง
- Stable/Beta: ใช้ค่าเริ่มต้นเป็นแพ็กเกจ npm `@openclaw/whatsapp`

ยังสามารถติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับผู้ส่งที่ไม่รู้จักคือการจับคู่
  </Card>
  <Card title="การแก้ปัญหาแชนเนล" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและซ่อมแซมข้ามแชนเนล
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าแชนเนลแบบครบถ้วน
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

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

  <Step title="เชื่อมโยง WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    สำหรับบัญชีเฉพาะ:

```bash
openclaw channels login --channel whatsapp --account work
```

    หากต้องการแนบไดเรกทอรีการยืนยันตัวตนของ WhatsApp Web ที่มีอยู่แล้ว/กำหนดเองก่อนล็อกอิน:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="อนุมัติคำขอจับคู่ครั้งแรก (หากใช้โหมด pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อแชนเนล

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp บนหมายเลขแยกต่างหากเมื่อเป็นไปได้ (เมทาดาทาของแชนเนลและขั้นตอนการตั้งค่าถูกปรับให้เหมาะกับรูปแบบนี้ แต่ก็รองรับการใช้กับหมายเลขส่วนตัวเช่นกัน)
</Note>

## รูปแบบการดีพลอย

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะทาง (แนะนำ)">
    นี่คือโหมดการดำเนินงานที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - ขอบเขตของ DM allowlist และเส้นทางการส่งที่ชัดเจนกว่า
    - โอกาสสับสนจากการแชตกับตัวเองต่ำกว่า

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

  <Accordion title="ทางเลือกสำรองแบบใช้หมายเลขส่วนตัว">
    Onboarding รองรับโหมดหมายเลขส่วนตัวและเขียนค่าพื้นฐานที่เป็นมิตรกับการแชตกับตัวเองไว้ดังนี้:

    - `dmPolicy: "allowlist"`
    - `allowFrom` มีหมายเลขส่วนตัวของคุณรวมอยู่ด้วย
    - `selfChatMode: true`

    ระหว่างรันไทม์ การป้องกันการแชตกับตัวเองจะอิงตามหมายเลขของตัวเองที่เชื่อมโยงไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตแชนเนลแบบ WhatsApp Web เท่านั้น">
    แชนเนลแพลตฟอร์มรับส่งข้อความใช้ WhatsApp Web (`Baileys`) ในสถาปัตยกรรมแชนเนลปัจจุบันของ OpenClaw

    ไม่มีแชนเนลส่งข้อความ WhatsApp ผ่าน Twilio แยกต่างหากในรีจิสทรีแชนเนลแชตที่มีมาให้ในตัว

  </Accordion>
</AccordionGroup>

## โมเดลรันไทม์

- Gateway เป็นเจ้าของ WhatsApp socket และลูปเชื่อมต่อใหม่
- การส่งขาออกต้องมี WhatsApp listener ที่ active สำหรับบัญชีเป้าหมาย
- ระบบจะละเว้นแชตสถานะและบรอดแคสต์ (`@status`, `@broadcast`)
- แชตตรงใช้กฎเซสชันของ DM (`session.dmScope`; ค่าเริ่มต้น `main` จะรวม DM เข้ากับเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มจะแยกออกจากกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- ทรานสปอร์ต WhatsApp Web รองรับตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / ตัวพิมพ์เล็ก) ควรใช้การกำหนดค่า proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะ WhatsApp ในแชนเนล
- เมื่อเปิดใช้ `messages.removeAckAfterReply` OpenClaw จะลบ ack reaction ของ WhatsApp หลังจากส่งคำตอบที่มองเห็นได้แล้ว

## Plugin hooks และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนบุคคล หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์ที่ใช้เชื่อมโยงกับเซสชัน ด้วยเหตุนี้
WhatsApp จะไม่กระจายเพย์โหลด hook `message_received` ขาเข้าไปยัง Plugins
เว้นแต่คุณจะเปิดใช้อย่างชัดเจน:

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

คุณสามารถจำกัดการเปิดใช้นี้เฉพาะหนึ่งบัญชีได้:

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

ควรเปิดใช้งานเฉพาะสำหรับ Plugins ที่คุณเชื่อถือให้รับเนื้อหา
และตัวระบุของข้อความ WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ใช้ควบคุมการเข้าถึงแชตตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `allowFrom` รองรับหมายเลขในรูปแบบ E.164 (ระบบจะ normalize ภายใน)

    การแทนที่แบบหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (รวมถึง `allowFrom`) จะมีลำดับความสำคัญเหนือค่าระดับแชนเนลสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมขณะรันไทม์:

    - การจับคู่จะถูกเก็บถาวรไว้ใน allow-store ของแชนเนลและรวมเข้ากับ `allowFrom` ที่กำหนดไว้
    - หากไม่ได้กำหนด allowlist ไว้ หมายเลขของตัวเองที่เชื่อมโยงไว้จะได้รับอนุญาตโดยค่าเริ่มต้น
    - OpenClaw จะไม่จับคู่ DM แบบ `fromMe` ขาออกโดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่เชื่อมโยงไว้)

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlist">
    การเข้าถึงกลุ่มมี 2 ชั้น:

    1. **allowlist ของสมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากไม่กำหนด `groups` กลุ่มทั้งหมดจะมีสิทธิ์ถูกใช้งานได้
       - หากมี `groups` จะทำหน้าที่เป็น group allowlist (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม sender allowlist
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกข้อความขาเข้าจากกลุ่มทั้งหมด

    การ fallback ของ sender allowlist:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะ fallback ไปใช้ `allowFrom` เมื่อมี
    - sender allowlist จะถูกประเมินก่อนการเปิดใช้งานด้วยการ mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` อยู่เลย การ fallback ของนโยบายกลุ่มในรันไทม์จะเป็น `allowlist` (พร้อมบันทึกคำเตือน) แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการ mention

    การตรวจจับการ mention รวมถึง:

    - การ mention ตัวตนของบอตใน WhatsApp อย่างชัดเจน
    - รูปแบบ regex ของการ mention ที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - ทรานสคริปต์ของ voice note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับการตอบกลับถึงบอตโดยนัย (ผู้ส่งข้อความตอบกลับตรงกับตัวตนของบอต)

    หมายเหตุด้านความปลอดภัย:

    - การ quote/reply เพียงทำให้ผ่านเกณฑ์ mention เท่านั้น; **ไม่ได้**ให้สิทธิ์การอนุญาตแก่ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ใน allowlist จะยังคงถูกบล็อก แม้ว่าจะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist ก็ตาม

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` จะอัปเดตสถานะของเซสชัน (ไม่ใช่การกำหนดค่าระดับ global) และถูกจำกัดด้วยการอนุมัติจากเจ้าของ

  </Tab>
</Tabs>

## พฤติกรรมของหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขของตัวเองที่เชื่อมโยงไว้มีอยู่ใน `allowFrom` ด้วย ระบบป้องกันการแชตกับตัวเองของ WhatsApp จะทำงาน:

- ข้าม read receipts สำหรับการสนทนาแบบแชตกับตัวเอง
- เพิกเฉยต่อพฤติกรรม auto-trigger ของ mention-JID ที่อาจทำให้คุณถูก ping เอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` คำตอบในการแชตกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและบริบท

<AccordionGroup>
  <Accordion title="ซองข้อความขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วย inbound envelope แบบใช้ร่วมกัน

    หากมีการตอบกลับแบบ quoted ระบบจะต่อท้ายบริบทในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมทาดาทาของการตอบกลับจะถูกเติมด้วยเมื่อมี (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="ตัวยึดสื่อและการดึงข้อมูลตำแหน่ง/รายชื่อ">
    ข้อความขาเข้าที่มีเฉพาะสื่อจะถูก normalize ด้วยตัวยึด เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice note ในกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อนผ่านเกณฑ์ mention เมื่อ
    เนื้อหามีเพียง `<media:audio>` ดังนั้นการพูด mention ของบอตใน voice note จึงอาจ
    กระตุ้นให้เกิดการตอบกลับได้ หากทรานสคริปต์ยังไม่ได้ mention บอต
    ทรานสคริปต์จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทนตัวยึดดิบ

    เนื้อหาตำแหน่งจะใช้ข้อความพิกัดแบบสั้น ป้ายกำกับ/คำอธิบายของตำแหน่ง และรายละเอียดรายชื่อ/vCard จะถูกแสดงเป็นเมทาดาทาที่ไม่เชื่อถือใน fenced block แทนการแทรกเป็นข้อความ prompt โดยตรง

  </Accordion>

  <Accordion title="การแทรกประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูกบัฟเฟอร์และแทรกเป็นบริบทเมื่อบอตถูกกระตุ้นในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - การกำหนดค่า: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    ตัวทำเครื่องหมายการแทรก:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    โดยค่าเริ่มต้น Read receipts จะเปิดใช้งานสำหรับข้อความ WhatsApp ขาเข้าที่ได้รับการยอมรับ

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

    การสนทนาแบบแชตกับตัวเองจะข้าม read receipts แม้จะเปิดใช้งานทั้งระบบอยู่ก็ตาม

  </Accordion>
</AccordionGroup>

## การส่งมอบ การแบ่งข้อความ และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความ">
    - ขีดจำกัดการแบ่งเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน แล้วจึง fallback ไปใช้การแบ่งตามความยาวที่ปลอดภัย
  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดภาพ วิดีโอ เสียง (voice note แบบ PTT) และเอกสาร
    - สื่อเสียงจะถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` ดังนั้นไคลเอนต์ WhatsApp จะแสดงผลเป็น voice note แบบ push-to-talk
    - เพย์โหลดการตอบกลับจะคง `audioAsVoice` ไว้; เอาต์พุต voice note จาก TTS สำหรับ WhatsApp จะยังคงใช้เส้นทาง PTT นี้ แม้ว่าผู้ให้บริการจะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบ native จะถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อให้เข้ากันได้กับ voice note
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต MP3/WebM จาก Microsoft Edge TTS จะถูกแปลงด้วย `ffmpeg` เป็น Ogg/Opus แบบโมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` จะส่งคำตอบล่าสุดของ assistant เป็น voice note เดียว และจะระงับการส่งซ้ำสำหรับคำตอบเดิม; `/tts chat on|off|default` ใช้ควบคุม auto-TTS สำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น animated GIF ผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อรายการแรกเมื่อส่งเพย์โหลดการตอบกลับแบบหลายสื่อ ยกเว้น voice note แบบ PTT ซึ่งจะส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายของ voice note ได้ไม่สม่ำเสมอ
    - แหล่งที่มาของสื่ออาจเป็น HTTP(S), `file://` หรือพาธในเครื่อง
  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมการ fallback">
    - ขีดจำกัดการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - ขีดจำกัดการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - เมื่อการส่งสื่อล้มเหลว fallback ของรายการแรกจะส่งข้อความเตือนแทนการปล่อยให้คำตอบหายไปอย่างเงียบ ๆ
  </Accordion>
</AccordionGroup>

## การอ้างอิงตอบกลับ

WhatsApp รองรับการอ้างอิงตอบกลับแบบเนทีฟ โดยคำตอบขาออกจะแสดงการอ้างอิงข้อความขาเข้าอย่างชัดเจน ควบคุมได้ด้วย `channels.whatsapp.replyToMode`

| ค่า         | พฤติกรรม                                                            |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                 |
| `"first"`   | อ้างอิงเฉพาะข้อความตอบกลับขาออกชิ้นแรก                              |
| `"all"`     | อ้างอิงทุกชิ้นของข้อความตอบกลับขาออก                               |
| `"batched"` | อ้างอิงคำตอบแบบ batch ที่เข้าคิวไว้ โดยปล่อยให้คำตอบแบบทันทีไม่อ้างอิง |

ค่าเริ่มต้นคือ `"off"` การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## ระดับ reaction

`channels.whatsapp.reactionLevel` ใช้ควบคุมขอบเขตการใช้ emoji reaction ของเอเจนต์บน WhatsApp:

| ระดับ         | Ack reaction | reaction ที่เริ่มโดยเอเจนต์ | คำอธิบาย                                         |
| ------------- | ------------ | ---------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่ใช้       | ไม่ใช้                       | ไม่มี reaction เลย                               |
| `"ack"`       | ใช่          | ไม่ใช้                       | ใช้เฉพาะ ack reaction (การรับรู้ก่อนตอบกลับ)     |
| `"minimal"`   | ใช่          | ใช่ (แบบอนุรักษ์นิยม)       | Ack + reaction ของเอเจนต์พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่          | ใช่ (ส่งเสริมให้ใช้)         | Ack + reaction ของเอเจนต์พร้อมแนวทางแบบส่งเสริม  |

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

WhatsApp รองรับ ack reaction แบบทันทีเมื่อรับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
Ack reaction ถูกควบคุมโดย `reactionLevel` — ระบบจะระงับเมื่อ `reactionLevel` เป็น `"off"`

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

หมายเหตุด้านพฤติกรรม:

- ส่งทันทีหลังจากรับข้อความขาเข้าแล้ว (ก่อนตอบกลับ)
- หากล้มเหลวจะมีการบันทึก log แต่จะไม่ขัดขวางการส่งคำตอบปกติ
- โหมดกลุ่ม `mentions` จะตอบด้วย reaction ใน turn ที่ถูก trigger ด้วยการ mention; การเปิดใช้งานกลุ่มแบบ `always` ทำหน้าที่ข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (`messages.ackReaction` แบบเก่าไม่ถูกใช้ที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - account id มาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` ถ้ามี มิฉะนั้นใช้ account id ตัวแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
    - account id จะถูก normalize ภายในเพื่อใช้ค้นหา
  </Accordion>

  <Accordion title="พาธข้อมูลรับรองและความเข้ากันได้กับระบบเดิม">
    - พาธ auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth เริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังถูกจดจำ/ย้ายข้อมูลให้สำหรับโฟลว์บัญชีเริ่มต้น
  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` จะล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    ในไดเรกทอรี auth แบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ auth ของ Baileys จะถูกลบออก

  </Accordion>
</AccordionGroup>

## เครื่องมือ แอ็กชัน และการเขียนค่าคอนฟิก

- การรองรับเครื่องมือของเอเจนต์รวมถึงแอ็กชัน reaction ของ WhatsApp (`react`)
- ตัวควบคุมแอ็กชัน:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนค่าคอนฟิกที่เริ่มจากแชนเนลเปิดใช้งานโดยค่าเริ่มต้น (ปิดได้ด้วย `channels.whatsapp.configWrites=false`)

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้เชื่อมโยง (ต้องใช้ QR)">
    อาการ: สถานะแชนเนลรายงานว่ายังไม่ได้เชื่อมโยง

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมโยงแล้วแต่ตัดการเชื่อมต่อ / วน reconnect">
    อาการ: บัญชีเชื่อมโยงแล้วแต่ตัดการเชื่อมต่อซ้ำ ๆ หรือพยายาม reconnect ซ้ำ

    วิธีแก้:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    หากจำเป็น ให้เชื่อมโยงใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ active ขณะส่ง">
    การส่งขาออกจะล้มเหลวทันทีเมื่อไม่มี gateway listener ที่ active สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า gateway กำลังทำงานอยู่และบัญชีถูกเชื่อมโยงแล้ว

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเลยโดยไม่คาดคิด">
    ให้ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ของ `groups`
    - เกณฑ์ mention (`requireMention` + รูปแบบ mention)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการที่ตามมาทีหลังจะเขียนทับรายการก่อนหน้า ดังนั้นควรมี `groupPolicy` เพียงตัวเดียวต่อหนึ่งขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ Gateway ของ WhatsApp ควรใช้ Node โดย Bun ถูกระบุว่าไม่เข้ากันกับการทำงานของ Gateway สำหรับ WhatsApp/Telegram แบบเสถียร
  </Accordion>
</AccordionGroup>

## system prompt

WhatsApp รองรับ system prompt แบบเดียวกับ Telegram สำหรับกลุ่มและแชตตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการ resolve สำหรับข้อความกลุ่ม:

ระบบจะกำหนดแมป `groups` ที่มีผลจริงก่อน: หากบัญชีกำหนด `groups` ของตัวเอง แมปนั้นจะเข้ามาแทนที่แมป `groups` ระดับรากทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบนแมปเดี่ยวที่ได้:

1. **system prompt เฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อมี entry ของกลุ่มนั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้ system prompt
2. **system prompt wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มี entry ของกลุ่มนั้นในแมปเลย หรือมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการ resolve สำหรับข้อความตรง:

ระบบจะกำหนดแมป `direct` ที่มีผลจริงก่อน: หากบัญชีกำหนด `direct` ของตัวเอง แมปนั้นจะเข้ามาแทนที่แมป `direct` ระดับรากทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบนแมปเดี่ยวที่ได้:

1. **system prompt เฉพาะแชตตรง** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมี entry ของ peer นั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้ system prompt
2. **system prompt wildcard ของแชตตรง** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มี entry ของ peer นั้นในแมปเลย หรือมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

หมายเหตุ: `dms` ยังคงเป็นบักเก็ต lightweight สำหรับแทนที่ประวัติราย DM (`dms.<id>.historyLimit`); ส่วนการแทนที่ prompt จะอยู่ภายใต้ `direct`

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ค่า `groups` ระดับรากจะถูกระงับโดยเจตนาสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี — แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง — เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่บอตไม่ได้อยู่ด้วย แต่ WhatsApp ไม่ใช้กลไกป้องกันนี้: ค่า `groups` และ `direct` ระดับรากจะถูกสืบทอดโดยทุกบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ โดยไม่ขึ้นกับว่ามีการกำหนดกี่บัญชี ในการตั้งค่า WhatsApp แบบหลายบัญชี หากคุณต้องการ prompt รายบัญชีสำหรับกลุ่มหรือแชตตรง ให้กำหนดแมปเต็มไว้ใต้แต่ละบัญชีอย่างชัดเจน แทนการอาศัยค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปคอนฟิกรายกลุ่มและ group allowlist ระดับแชต ไม่ว่าจะเป็นระดับรากหรือระดับบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- ให้เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นยอมรับทุกกลุ่มอยู่แล้วเท่านั้น หากคุณยังต้องการให้มีเพียงชุด group ID แบบกำหนดตายตัวเท่านั้นที่มีสิทธิ์ใช้งาน อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของ prompt แต่ให้ใส่ prompt ซ้ำในแต่ละ entry ของกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแทน
- การอนุญาตกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบคนละส่วน `groups["*"]` ขยายชุดกลุ่มที่สามารถเข้าสู่การจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นโดยตัวมันเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากด้วย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันกับ DM ค่า `direct["*"]` มีไว้เพียงเพื่อให้คอนฟิกแชตตรงเริ่มต้นหลังจากที่ DM นั้นผ่านการอนุญาตโดย `dmPolicy` บวกกับ `allowFrom` หรือกฎจาก pairing-store แล้ว

ตัวอย่าง:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // ใช้เฉพาะเมื่อทุกกลุ่มควรถูกอนุญาตในขอบเขตระดับราก
        // มีผลกับทุกบัญชีที่ไม่ได้กำหนดแมป groups ของตนเอง
        "*": { systemPrompt: "ค่า prompt เริ่มต้นสำหรับทุกกลุ่ม" },
      },
      direct: {
        // มีผลกับทุกบัญชีที่ไม่ได้กำหนดแมป direct ของตนเอง
        "*": { systemPrompt: "ค่า prompt เริ่มต้นสำหรับทุกแชตตรง" },
      },
      accounts: {
        work: {
          groups: {
            // บัญชีนี้กำหนด groups ของตัวเอง ดังนั้น groups ระดับรากจะถูก
            // แทนที่ทั้งหมด หากต้องการเก็บ wildcard ไว้ ให้กำหนด "*" ที่นี่ด้วย
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "เน้นเรื่องการจัดการโครงการ",
            },
            // ใช้เฉพาะเมื่อทุกกลุ่มควรถูกอนุญาตในบัญชีนี้
            "*": { systemPrompt: "ค่า prompt เริ่มต้นสำหรับกลุ่มงาน" },
          },
          direct: {
            // บัญชีนี้กำหนด direct ของตัวเอง ดังนั้น entry ของ direct ระดับรากจะถูก
            // แทนที่ทั้งหมด หากต้องการเก็บ wildcard ไว้ ให้กำหนด "*" ที่นี่ด้วย
            "+15551234567": { systemPrompt: "Prompt สำหรับแชตตรงเรื่องงานที่เฉพาะเจาะจง" },
            "*": { systemPrompt: "ค่า prompt เริ่มต้นสำหรับแชตตรงเรื่องงาน" },
          },
        },
      },
    },
  },
}
```

## จุดอ้างอิงสำหรับคอนฟิก

แหล่งอ้างอิงหลัก:

- [เอกสารอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/config-channels#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การแทนที่ระดับบัญชี
- การดำเนินงาน: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- พฤติกรรมของเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [Security](/th/gateway/security)
- [Channel routing](/th/channels/channel-routing)
- [Multi-agent routing](/th/concepts/multi-agent)
- [Troubleshooting](/th/channels/troubleshooting)
