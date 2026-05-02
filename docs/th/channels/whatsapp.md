---
read_when:
    - การทำงานเกี่ยวกับพฤติกรรมของช่องทาง WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, ลักษณะการส่งข้อความ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T10:09:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่เชื่อมโยงไว้

## ติดตั้ง (เมื่อต้องการ)

- Onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง WhatsApp Plugin ในครั้งแรกที่คุณเลือกใช้งาน
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนติดตั้งเมื่อ
  ยังไม่มี Plugin อยู่
- ช่อง dev + git checkout: ค่าเริ่มต้นเป็นพาธ Plugin ภายในเครื่อง
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` เมื่อมีการเผยแพร่แพ็กเกจ
  ปัจจุบันแล้ว

การติดตั้งด้วยตนเองยังใช้งานได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้หรือหายไป ให้ใช้
OpenClaw build แบบแพ็กเกจปัจจุบันหรือ checkout ภายในเครื่องจนกว่าชุดแพ็กเกจ npm
จะตามทัน

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและ playbook สำหรับซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่าง config ช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่านโยบายการเข้าถึง WhatsApp">

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

    หากต้องการแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่แล้วหรือกำหนดเองก่อน login:

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

  <Step title="อนุมัติคำขอจับคู่แรก (หากใช้โหมดจับคู่)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง คำขอที่รอดำเนินการจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้รัน WhatsApp บนหมายเลขแยกต่างหากเมื่อทำได้ (เมทาดาทาของช่องทางและขั้นตอนตั้งค่าถูกปรับให้เหมาะกับการตั้งค่านั้น แต่ก็รองรับการตั้งค่าด้วยหมายเลขส่วนตัวด้วย)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะ (แนะนำ)">
    นี่คือโหมดปฏิบัติการที่สะอาดที่สุด:

    - แยกตัวตน WhatsApp สำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการ route ชัดเจนขึ้น
    - ลดโอกาสสับสนกับ self-chat

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

  <Accordion title="ตัวสำรองแบบหมายเลขส่วนตัว">
    Onboarding รองรับโหมดหมายเลขส่วนตัวและเขียน baseline ที่เป็นมิตรกับ self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ขณะ runtime การป้องกัน self-chat จะอ้างอิงจากหมายเลขตัวเองที่เชื่อมโยงไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางเฉพาะ WhatsApp Web">
    ช่องทางแพลตฟอร์มการรับส่งข้อความอิง WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทางปัจจุบันของ OpenClaw

    ไม่มีช่องทางรับส่งข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรีช่องแชตในตัว

  </Accordion>
</AccordionGroup>

## โมเดล runtime

- Gateway เป็นเจ้าของ WhatsApp socket และ reconnect loop
- watchdog สำหรับ reconnect ใช้กิจกรรม transport ของ WhatsApp Web ไม่ใช่เฉพาะปริมาณ app-message ขาเข้าเท่านั้น ดังนั้นเซสชัน linked-device ที่เงียบจะไม่ถูกรีสตาร์ตเพียงเพราะไม่มีใครส่งข้อความมาเมื่อเร็วๆ นี้ ขีดจำกัด application-silence ที่ยาวกว่ายังคงบังคับ reconnect หาก transport frames ยังเข้ามาแต่ไม่มีการจัดการข้อความแอปพลิเคชันตลอดช่วงเวลา watchdog; หลังจาก transient reconnect สำหรับเซสชันที่ใช้งานเมื่อเร็วๆ นี้ การตรวจสอบ application-silence นั้นจะใช้ timeout ข้อความปกติสำหรับหน้าต่างการกู้คืนแรก
- เวลาของ Baileys socket ระบุชัดเจนใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping ของแอปพลิเคชัน WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ opening handshake และ `defaultQueryTimeoutMs` ควบคุม timeout ของ query ใน Baileys
- การส่งขาออกต้องมี listener ของ WhatsApp ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย
- แชตสถานะและ broadcast จะถูกละเว้น (`@status`, `@broadcast`)
- watchdog สำหรับ reconnect ติดตามกิจกรรม transport ของ WhatsApp Web ไม่ใช่เฉพาะปริมาณ app-message ขาเข้าเท่านั้น: เซสชัน linked-device ที่เงียบจะยังคงทำงานขณะ transport frames ดำเนินต่อไป แต่ transport stall จะบังคับ reconnect ก่อนเส้นทาง remote disconnect ที่เกิดทีหลังมาก
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM เข้าเป็นเซสชันหลักของ agent)
- เซสชันกลุ่มถูกแยกไว้ (`agent:<agentId>:whatsapp:group:<jid>`)
- transport ของ WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / รูปแบบตัวพิมพ์เล็ก) ควรใช้ config proxy ระดับโฮสต์แทนการตั้งค่า proxy ของ WhatsApp เฉพาะช่องทาง
- เมื่อเปิดใช้ `messages.removeAckAfterReply` แล้ว OpenClaw จะล้าง reaction ack ของ WhatsApp หลังจากส่ง reply ที่มองเห็นได้แล้ว

## Plugin hooks และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนตัว หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์สำหรับเชื่อมโยงเซสชัน ด้วยเหตุนี้
WhatsApp จึงไม่ broadcast payload ของ hook `message_received` ขาเข้าไปยัง Plugin
เว้นแต่คุณจะ opt in อย่างชัดเจน:

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

คุณสามารถจำกัด opt-in ให้บัญชีเดียวได้:

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

เปิดใช้เฉพาะกับ Plugin ที่คุณไว้วางใจให้รับเนื้อหาข้อความ
และตัวระบุของ WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (normalize ภายใน)

    การ override หลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรม runtime:

    - การจับคู่ถูกบันทึกไว้ใน allow-store ของช่องทางและ merge กับ `allowFrom` ที่กำหนดค่าไว้
    - scheduled automation และ fallback ของผู้รับ heartbeat ใช้เป้าหมายการส่งที่ระบุชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้; การอนุมัติการจับคู่ DM ไม่ได้เป็นผู้รับ cron หรือ heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist หมายเลขตัวเองที่เชื่อมโยงไว้จะได้รับอนุญาตโดยค่าเริ่มต้น
    - OpenClaw จะไม่ auto-pair DM ขาออกแบบ `fromMe` (ข้อความที่คุณส่งหาตัวเองจากอุปกรณ์ที่เชื่อมโยงไว้)

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlist">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist การเป็นสมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละ `groups` ไว้ ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` จะทำหน้าที่เป็น allowlist ของกลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งของกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้ากลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` runtime จะ fallback ไปที่ `allowFrom` เมื่อมี
    - allowlist ผู้ส่งจะถูกประเมินก่อนการเปิดใช้งานด้วย mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` อยู่เลย fallback ของ group-policy ใน runtime คือ `allowlist` (พร้อม log คำเตือน) แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    โดยค่าเริ่มต้น reply ในกลุ่มต้องมี mention

    การตรวจจับ mention รวมถึง:

    - mention ของ WhatsApp แบบชัดเจนถึงตัวตน bot
    - รูปแบบ regex สำหรับ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcript ของ voice-note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับ reply-to-bot โดยนัย (ผู้ส่งที่ถูก reply ตรงกับตัวตน bot)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply ทำให้ผ่าน mention gating เท่านั้น; ไม่ได้ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่ได้อยู่ใน allowlist ยังคงถูกบล็อกแม้จะ reply ข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่ config ทั่วโลก) และถูก gated โดย owner

  </Tab>
</Tabs>

## พฤติกรรมหมายเลขส่วนตัวและ self-chat

เมื่อหมายเลขตัวเองที่เชื่อมโยงไว้มีอยู่ใน `allowFrom` ด้วย ระบบป้องกัน self-chat ของ WhatsApp จะเปิดใช้งาน:

- ข้าม read receipts สำหรับรอบ self-chat
- ละเว้นพฤติกรรม auto-trigger ของ mention-JID ที่อาจ ping หาตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` reply ของ self-chat จะมีค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและบริบท

<AccordionGroup>
  <Accordion title="Envelope ขาเข้า + บริบท reply">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อใน envelope ขาเข้าที่ใช้ร่วมกัน

    หากมี quoted reply อยู่ บริบทจะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมทาดาทา reply จะถูกเติมเมื่อมีเช่นกัน (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)
    เมื่อเป้าหมาย quoted reply เป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    media store ขาเข้าปกติและเปิดเผยเป็น `MediaPath`/`MediaType` เพื่อให้
    agent ตรวจสอบรูปภาพที่อ้างอิงได้ แทนที่จะเห็นเฉพาะ
    `<media:image>`

  </Accordion>

  <Accordion title="ตัวยึดตำแหน่งสื่อและการดึงตำแหน่ง/ผู้ติดต่อ">
    ข้อความขาเข้าที่มีแต่สื่อจะถูก normalize ด้วยตัวยึดตำแหน่ง เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice notes ของกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อน mention gating เมื่อ
    body มีเพียง `<media:audio>` ดังนั้นการพูด mention ถึง bot ใน voice note สามารถ
    trigger reply ได้ หาก transcript ยังไม่ได้ mention ถึง bot
    transcript จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทนตัวยึดตำแหน่งดิบ

    เนื้อหาตำแหน่งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียด contact/vCard จะแสดงเป็นเมทาดาทาที่ไม่น่าเชื่อถือใน fenced block ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="การ inject ประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูก buffer และ inject เป็นบริบทเมื่อ bot ถูก trigger ในที่สุด

    - ค่าเริ่มต้น: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    เครื่องหมาย injection:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    read receipts เปิดใช้งานโดยค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่รับแล้ว

    ปิดใช้งานทั่วโลก:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    override ต่อบัญชี:

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

    รอบ self-chat จะข้าม read receipts แม้จะเปิดใช้งานทั่วโลก

  </Accordion>
</AccordionGroup>

## การส่ง, การแบ่ง chunk, และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความเป็นชิ้น">
    - ขีดจำกัดชิ้นข้อความเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะเลือกขอบเขตย่อหน้าเป็นลำดับแรก (บรรทัดว่าง) แล้วจึงย้อนกลับไปใช้การแบ่งชิ้นข้อความตามความยาวที่ปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดรูปภาพ วิดีโอ เสียง (บันทึกเสียงแบบ PTT) และเอกสาร
    - สื่อเสียงถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` ดังนั้นไคลเอนต์ WhatsApp จะแสดงเป็นบันทึกเสียงแบบกดเพื่อพูด
    - เพย์โหลดตอบกลับจะรักษา `audioAsVoice`; เอาต์พุตบันทึกเสียง TTS สำหรับ WhatsApp ยังคงอยู่บนเส้นทาง PTT นี้ แม้ผู้ให้บริการจะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus ดั้งเดิมถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับบันทึกเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต MP3/WebM ของ Microsoft Edge TTS จะถูกแปลงรหัสด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของผู้ช่วยเป็นบันทึกเสียงหนึ่งรายการ และระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม TTS อัตโนมัติสำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` เมื่อส่งวิดีโอ
    - คำบรรยายจะถูกใส่กับสื่อรายการแรกเมื่อส่งเพย์โหลดตอบกลับหลายสื่อ ยกเว้นบันทึกเสียงแบบ PTT จะส่งเสียงก่อนและส่งข้อความที่มองเห็นแยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายของบันทึกเสียงได้ไม่สม่ำเสมอ
    - แหล่งสื่อเป็น HTTP(S), `file://` หรือพาธภายในเครื่องได้

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมสำรอง">
    - ขีดจำกัดการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - ขีดจำกัดการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่ค่าต่อบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - เมื่อการส่งสื่อล้มเหลว กลไกสำรองของรายการแรกจะส่งข้อความเตือนแทนการทิ้งคำตอบไปเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างอิงข้อความตอบกลับ

WhatsApp รองรับการอ้างอิงข้อความตอบกลับแบบเนทีฟ โดยข้อความตอบกลับขาออกจะแสดงการอ้างอิงข้อความขาเข้าอย่างชัดเจน ควบคุมได้ด้วย `channels.whatsapp.replyToMode`

| ค่า         | พฤติกรรม                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                  |
| `"first"`   | อ้างอิงเฉพาะชิ้นข้อความตอบกลับขาออกชิ้นแรก                             |
| `"all"`     | อ้างอิงทุกชิ้นข้อความตอบกลับขาออก                                      |
| `"batched"` | อ้างอิงข้อความตอบกลับแบบแบตช์ที่อยู่ในคิว โดยปล่อยให้ข้อความตอบกลับทันทีไม่ถูกอ้างอิง |

ค่าเริ่มต้นคือ `"off"` การแทนที่ค่าต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## ระดับปฏิกิริยา

`channels.whatsapp.reactionLevel` ควบคุมว่าตัวแทนใช้ปฏิกิริยาอีโมจิบน WhatsApp กว้างเพียงใด:

| ระดับ         | ปฏิกิริยา Ack | ปฏิกิริยาที่ตัวแทนเริ่มเอง | คำอธิบาย                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่           | ไม่                        | ไม่มีปฏิกิริยาเลย                              |
| `"ack"`       | ใช่           | ไม่                        | เฉพาะปฏิกิริยา Ack (ใบรับก่อนตอบกลับ)           |
| `"minimal"`   | ใช่           | ใช่ (ระมัดระวัง)          | Ack + ปฏิกิริยาของตัวแทนพร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (ส่งเสริมให้ใช้)      | Ack + ปฏิกิริยาของตัวแทนพร้อมแนวทางที่ส่งเสริมให้ใช้ |

ค่าเริ่มต้น: `"minimal"`

การแทนที่ค่าต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## ปฏิกิริยารับทราบ

WhatsApp รองรับปฏิกิริยา ack ทันทีเมื่อได้รับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
ปฏิกิริยา Ack ถูกควบคุมโดย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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

หมายเหตุพฤติกรรม:

- ส่งทันทีหลังจากยอมรับข้อความขาเข้า (ก่อนตอบกลับ)
- ความล้มเหลวจะถูกบันทึกในล็อก แต่ไม่ขัดขวางการส่งคำตอบปกติ
- โหมดกลุ่ม `mentions` ตอบสนองในรอบที่ถูกเรียกด้วยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นทางลัดข้ามการตรวจนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ใช้ `messages.ackReaction` แบบเดิมที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - รหัสบัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมีอยู่ มิฉะนั้นใช้รหัสบัญชีที่กำหนดค่าไว้รายการแรก (เรียงลำดับแล้ว)
    - รหัสบัญชีถูกทำให้เป็นรูปแบบมาตรฐานภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="พาธข้อมูลรับรองและความเข้ากันได้กับแบบเดิม">
    - พาธรับรองความถูกต้องปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - การรับรองความถูกต้องเริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังคงถูกรู้จัก/ย้ายสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรมออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะรับรองความถูกต้องของ WhatsApp สำหรับบัญชีนั้น

    เมื่อเข้าถึง Gateway ได้ การออกจากระบบจะหยุดตัวฟัง WhatsApp ที่ทำงานอยู่สำหรับบัญชีที่เลือกก่อน เพื่อไม่ให้เซสชันที่ลิงก์ไว้ยังคงรับข้อความต่อไปจนกว่าจะรีสตาร์ตครั้งถัดไป `openclaw channels remove --channel whatsapp` จะหยุดตัวฟังที่ทำงานอยู่ก่อนปิดใช้งานหรือลบการกำหนดค่าบัญชีเช่นกัน

    ในไดเรกทอรีรับรองความถูกต้องแบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์รับรองความถูกต้องของ Baileys จะถูกลบ

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนค่ากำหนด

- การรองรับเครื่องมือของตัวแทนรวมถึงการกระทำปฏิกิริยา WhatsApp (`react`)
- เกตการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนค่ากำหนดที่เริ่มจากช่องทางเปิดใช้งานเป็นค่าเริ่มต้น (ปิดใช้งานผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้ลิงก์ (ต้องใช้ QR)">
    อาการ: สถานะช่องทางรายงานว่ายังไม่ได้ลิงก์

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="ลิงก์แล้วแต่ถูกตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่ลิงก์แล้วมีการตัดการเชื่อมต่อหรือพยายามเชื่อมต่อใหม่ซ้ำ ๆ

    บัญชีที่มีการใช้งานน้อยสามารถคงการเชื่อมต่อไว้เลยระยะหมดเวลาข้อความปกติได้; watchdog
    จะรีสตาร์ตเมื่อกิจกรรมการขนส่ง WhatsApp Web หยุดลง ซ็อกเก็ตปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินกรอบเวลาความปลอดภัยที่ยาวกว่า

    หากล็อกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ๆ ให้ปรับ
    เวลาของซ็อกเก็ต Baileys ภายใต้ `web.whatsapp` เริ่มด้วยการลด
    `keepAliveIntervalMs` ให้ต่ำกว่าระยะหมดเวลาว่างของเครือข่าย และเพิ่ม
    `connectTimeoutMs` บนลิงก์ที่ช้าหรือสูญเสียแพ็กเก็ต:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    วิธีแก้:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    หาก `~/.openclaw/logs/whatsapp-health.log` ระบุว่า `Gateway inactive` แต่
    `openclaw gateway status` และ `openclaw channels status --probe` แสดงว่า
    Gateway และ WhatsApp ปกติดี ให้รัน `openclaw doctor` บน Linux doctor
    จะเตือนเกี่ยวกับรายการ crontab แบบเดิมที่ยังคงเรียกใช้
    `~/.openclaw/bin/ensure-whatsapp.sh`; ลบรายการเก่าเหล่านั้นด้วย
    `crontab -e` เพราะ cron อาจไม่มีสภาพแวดล้อม systemd user-bus และ
    ทำให้สคริปต์เก่านั้นรายงานสุขภาพ Gateway ผิดพลาด

    หากจำเป็น ให้ลิงก์ใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบด้วย QR หมดเวลาหลังพร็อกซี">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงรหัส QR ที่ใช้งานได้ พร้อม `status=408 Request Time-out` หรือการตัดการเชื่อมต่อซ็อกเก็ต TLS

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อมพร็อกซีมาตรฐานของโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, ตัวแปรพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่ากระบวนการ Gateway สืบทอด env ของพร็อกซี และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มีตัวฟังที่ทำงานอยู่เมื่อส่ง">
    การส่งขาออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มีตัวฟัง Gateway ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบว่า Gateway ทำงานอยู่และบัญชีถูกลิงก์แล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏในทรานสคริปต์แต่ไม่ปรากฏใน WhatsApp">
    แถวทรานสคริปต์บันทึกสิ่งที่ตัวแทนสร้างขึ้น การส่งไปยัง WhatsApp ถูกตรวจแยกต่างหาก: OpenClaw ถือว่าการตอบกลับอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืนรหัสข้อความขาออกสำหรับการส่งข้อความที่มองเห็นหรือสื่ออย่างน้อยหนึ่งรายการ

    ปฏิกิริยา Ack เป็นใบรับก่อนตอบกลับที่เป็นอิสระต่อกัน ปฏิกิริยาที่สำเร็จไม่ได้พิสูจน์ว่าข้อความหรือสื่อตอบกลับภายหลังถูก WhatsApp ยอมรับ

    ตรวจล็อก Gateway สำหรับ `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการอนุญาต `groups`
    - เกตการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการที่อยู่ภายหลังจะแทนที่รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ Gateway ของ WhatsApp ควรใช้ Node Bun ถูกทำเครื่องหมายว่าไม่เข้ากันสำหรับการทำงาน Gateway ของ WhatsApp/Telegram ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมป์ระบบ

WhatsApp รองรับพรอมป์ระบบสไตล์ Telegram สำหรับกลุ่มและแชตโดยตรงผ่านแผนที่ `groups` และ `direct`

ลำดับชั้นการแก้ไขค่าสำหรับข้อความกลุ่ม:

แผนที่ `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตนเองไว้ จะใช้แทนแผนที่ `groups` ที่รากทั้งหมด (ไม่มีการผสานเชิงลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแผนที่เดียวที่ได้:

1. **พรอมป์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ในแผนที่ **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะไม่มีอยู่ในแผนที่เลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ไขค่าสำหรับข้อความโดยตรง:

แผนที่ `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตนเองไว้ จะใช้แทนแผนที่ `direct` ที่รากทั้งหมด (ไม่มีการผสานเชิงลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแผนที่เดียวที่ได้:

1. **พรอมป์ระบบเฉพาะข้อความโดยตรง** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อรายการเพียร์เฉพาะมีอยู่ในแผนที่ **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบ wildcard ของข้อความโดยตรง** (`direct["*"].systemPrompt`): ใช้เมื่อรายการเพียร์เฉพาะไม่มีอยู่ในแผนที่เลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบักเก็ตแทนที่ประวัติราย DM แบบเบา (`dms.<id>.historyLimit`) การแทนที่พรอมป์อยู่ภายใต้ `direct`
</Note>

**ความแตกต่างจากลักษณะการทำงานหลายบัญชีของ Telegram:** ใน Telegram จะตั้งใจระงับ `groups` ระดับรากสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี แม้กระทั่งบัญชีที่ไม่ได้กำหนด `groups` ของตนเอง เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่บอตไม่ได้เป็นสมาชิก WhatsApp ไม่ใช้ตัวป้องกันนี้: `groups` ระดับรากและ `direct` ระดับรากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp หลายบัญชี หากคุณต้องการพรอมต์กลุ่มหรือพรอมต์โดยตรงแบบแยกตามบัญชี ให้กำหนดแผนที่ทั้งหมดใต้แต่ละบัญชีอย่างชัดเจนแทนการพึ่งพาค่าเริ่มต้นระดับราก

ลักษณะการทำงานสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแผนที่การกำหนดค่าต่อกลุ่มและรายการอนุญาตกลุ่มระดับแชท ที่ขอบเขตรากหรือบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่มไวลด์การ์ดกลุ่ม `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีสิทธิ์เฉพาะชุด ID กลุ่มที่กำหนดไว้เท่านั้น อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของพรอมต์ ให้ทำซ้ำพรอมต์ในแต่ละรายการกลุ่มที่อนุญาตอย่างชัดเจนแทน
- การรับกลุ่มเข้าและการอนุญาตผู้ส่งเป็นการตรวจสอบคนละส่วนกัน `groups["*"]` ขยายชุดกลุ่มที่สามารถเข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นโดยตัวมันเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ให้เพียงการกำหนดค่าแชทโดยตรงเริ่มต้นหลังจาก DM ได้รับอนุญาตแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎของที่เก็บการจับคู่

ตัวอย่าง:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก:

- [เอกสารอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/config-channels#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การแทนที่ระดับบัญชี
- การดำเนินงาน: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- ลักษณะการทำงานของเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- พรอมต์: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
