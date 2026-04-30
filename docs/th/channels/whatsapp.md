---
read_when:
    - กำลังทำงานเกี่ยวกับพฤติกรรมของช่องทาง WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการนำส่ง และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:40:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานในโปรดักชันผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่ลิงก์ไว้

## ติดตั้ง (เมื่อต้องการ)

- การเริ่มต้นใช้งาน (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง Plugin WhatsApp เมื่อคุณเลือกใช้งานครั้งแรก
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนการติดตั้งเมื่อ
  ยังไม่มี Plugin อยู่
- ช่อง Dev + git checkout: ค่าเริ่มต้นคือพาธ Plugin ภายในเครื่อง
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` เมื่อมีการเผยแพร่แพ็กเกจ
  ปัจจุบันแล้ว

การติดตั้งด้วยตนเองยังใช้งานได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้หรือไม่พบ ให้ใช้
บิลด์ OpenClaw แบบแพ็กเกจที่เป็นปัจจุบัน หรือ checkout ภายในเครื่องจนกว่าขบวนแพ็กเกจ npm
จะตามทัน

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องและคู่มือการซ่อมแซม
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องแบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    สำหรับบัญชีเฉพาะ:

```bash
openclaw channels login --channel whatsapp --account work
```

    เพื่อแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่หรือกำหนดเองก่อนเข้าสู่ระบบ:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่อง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้รัน WhatsApp บนหมายเลขแยกต่างหากเมื่อทำได้ (เมทาดาทาของช่องและขั้นตอนการตั้งค่าได้รับการปรับให้เหมาะกับการตั้งค่านั้น แต่ก็รองรับการตั้งค่าด้วยหมายเลขส่วนตัวด้วย)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    นี่คือโหมดปฏิบัติการที่สะอาดที่สุด:

    - ข้อมูลระบุตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการกำหนดเส้นทางชัดเจนขึ้น
    - โอกาสสับสนกับการแชตกับตัวเองลดลง

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

  <Accordion title="Personal-number fallback">
    การเริ่มต้นใช้งานรองรับโหมดหมายเลขส่วนตัวและเขียน baseline ที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ขณะรัน การป้องกันการแชตกับตัวเองอ้างอิงจากหมายเลขตนเองที่ลิงก์ไว้และ `allowFrom`

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    ช่องแพลตฟอร์มรับส่งข้อความอิงตาม WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่อง OpenClaw ปัจจุบัน

    ไม่มีช่องรับส่งข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรีช่องแชตในตัว

  </Accordion>
</AccordionGroup>

## โมเดลขณะรัน

- Gateway เป็นเจ้าของซ็อกเก็ต WhatsApp และลูปการเชื่อมต่อใหม่
- watchdog การเชื่อมต่อใหม่ใช้กิจกรรมการขนส่งของ WhatsApp Web ไม่ใช่เฉพาะปริมาณข้อความแอปขาเข้า ดังนั้นเซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบอยู่จะไม่ถูกรีสตาร์ทเพียงเพราะไม่มีใครส่งข้อความมาเมื่อเร็ว ๆ นี้ ขีดจำกัดการเงียบของแอปพลิเคชันที่นานกว่ายังคงบังคับให้เชื่อมต่อใหม่หากเฟรมการขนส่งยังมาถึงแต่ไม่มีข้อความแอปพลิเคชันถูกจัดการภายในหน้าต่าง watchdog หลังการเชื่อมต่อใหม่ชั่วคราวสำหรับเซสชันที่เพิ่งใช้งาน การตรวจสอบการเงียบของแอปพลิเคชันนั้นใช้ timeout ข้อความปกติสำหรับหน้าต่างกู้คืนแรก
- เวลา socket ของ Baileys ระบุไว้อย่างชัดเจนภายใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping ของแอปพลิเคชัน WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ handshake ตอนเปิด และ `defaultQueryTimeoutMs` ควบคุม timeout การ query ของ Baileys
- การส่งขาออกต้องมี listener WhatsApp ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย
- แชตสถานะและ broadcast ถูกละเว้น (`@status`, `@broadcast`)
- watchdog การเชื่อมต่อใหม่ติดตามกิจกรรมการขนส่งของ WhatsApp Web ไม่ใช่เฉพาะปริมาณข้อความแอปขาเข้า: เซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบอยู่จะคงอยู่ขณะที่เฟรมการขนส่งยังต่อเนื่อง แต่การหยุดชะงักของการขนส่งจะบังคับให้เชื่อมต่อใหม่ก่อนเส้นทาง remote disconnect ที่มาถึงภายหลังนานมาก
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM เข้าสู่เซสชันหลักของ agent)
- เซสชันกลุ่มถูกแยกออก (`agent:<agentId>:whatsapp:group:<jid>`)
- การขนส่ง WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / รูปแบบตัวพิมพ์เล็ก) ให้ใช้การกำหนดค่า proxy ระดับโฮสต์มากกว่าการตั้งค่า proxy เฉพาะช่องของ WhatsApp
- เมื่อเปิดใช้งาน `messages.removeAckAfterReply` OpenClaw จะล้าง reaction ack ของ WhatsApp หลังจากส่งการตอบกลับที่มองเห็นได้แล้ว

## hook ของ Plugin และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนตัว หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์ความสัมพันธ์ของเซสชัน ด้วยเหตุนี้
WhatsApp จึงไม่กระจาย payload hook `message_received` ขาเข้าไปยัง plugins
เว้นแต่คุณจะเลือกเข้าร่วมอย่างชัดเจน:

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

คุณสามารถจำกัดขอบเขตการเลือกเข้าร่วมไว้ที่บัญชีเดียวได้:

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

เปิดใช้งานเฉพาะสำหรับ plugins ที่คุณไว้วางใจให้รับเนื้อหาและตัวระบุของข้อความ
WhatsApp ขาเข้า

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (ทำ normalization ภายใน)

    การเขียนทับสำหรับหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมขณะรัน:

    - การจับคู่ถูกเก็บถาวรใน allow-store ของช่องและรวมเข้ากับ `allowFrom` ที่กำหนดค่าไว้
    - หากไม่มีการกำหนดค่า allowlist จะอนุญาตหมายเลขตนเองที่ลิงก์ไว้ตามค่าเริ่มต้น
    - OpenClaw จะไม่จับคู่ DM ขาออก `fromMe` โดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่ลิงก์ไว้)

  </Tab>

  <Tab title="Group policy + allowlists">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละเว้น `groups` กลุ่มทั้งหมดจะมีสิทธิ์
       - หากมี `groups` อยู่ จะทำหน้าที่เป็น allowlist ของกลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้ากลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` runtime จะ fallback ไปที่ `allowFrom` เมื่อมีอยู่
    - allowlist ผู้ส่งถูกประเมินก่อนการเปิดใช้งานด้วย mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย fallback ของนโยบายกลุ่มขณะรันคือ `allowlist` (พร้อม log เตือน) แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้องมีการ mention ตามค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention ของ WhatsApp แบบชัดเจนถึงข้อมูลระบุตัวตนของ bot
    - รูปแบบ regex สำหรับ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcript ของ voice-note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับ reply-to-bot โดยนัย (ผู้ส่ง reply ตรงกับข้อมูลระบุตัวตนของ bot)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply เพียงทำให้ผ่านด่าน mention เท่านั้น; ไม่ได้ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่ได้อยู่ใน allowlist ยังคงถูกบล็อกแม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่การกำหนดค่าทั่วโลก) และถูกจำกัดไว้สำหรับเจ้าของ

  </Tab>
</Tabs>

## พฤติกรรมหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขตนเองที่ลิงก์ไว้ปรากฏใน `allowFrom` ด้วย ระบบป้องกันการแชตกับตัวเองของ WhatsApp จะทำงาน:

- ข้าม read receipts สำหรับรอบการแชตกับตัวเอง
- ละเว้นพฤติกรรม auto-trigger ของ mention-JID ที่มิฉะนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` การตอบกลับในการแชตกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การปรับข้อความให้เป็นมาตรฐานและบริบท

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    ข้อความ WhatsApp ขาเข้าถูกห่อใน envelope ขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับที่ quote ไว้ บริบทจะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมทาดาทาของ reply จะถูกเติมด้วยเมื่อมี (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    ข้อความขาเข้าที่มีเฉพาะสื่อถูกปรับให้เป็นมาตรฐานด้วย placeholder เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice note ของกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อนด่าน mention เมื่อ
    body เป็นเพียง `<media:audio>` ดังนั้นการพูด mention ถึง bot ใน voice note จึงสามารถ
    trigger การตอบกลับได้ หาก transcript ยังไม่ได้ mention ถึง bot
    transcript จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทน placeholder ดิบ

    body ของตำแหน่งที่ตั้งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งที่ตั้งและรายละเอียด contact/vCard ถูกแสดงผลเป็นเมทาดาทาที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="Pending group history injection">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูก buffer และ inject เป็นบริบทเมื่อ bot ถูก trigger ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - การกำหนดค่า: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    marker สำหรับ injection:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    read receipts เปิดใช้งานตามค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ได้รับการยอมรับ

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

    การเขียนทับต่อบัญชี:

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

    รอบการแชตกับตัวเองข้าม read receipts แม้เปิดใช้งานทั่วโลก

  </Accordion>
</AccordionGroup>

## การส่งมอบ การแบ่ง chunk และสื่อ

<AccordionGroup>
  <Accordion title="Text chunking">
    - ขีดจำกัด chunk เริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` ให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) แล้วจึง fallback ไปใช้การแบ่ง chunk ที่ปลอดภัยตามความยาว

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดรูปภาพ วิดีโอ เสียง (บันทึกเสียง PTT) และเอกสาร
    - สื่อเสียงถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` ดังนั้นไคลเอนต์ WhatsApp จะแสดงผลเป็นบันทึกเสียงแบบกดเพื่อพูด
    - เพย์โหลดการตอบกลับจะคง `audioAsVoice` ไว้; เอาต์พุตบันทึกเสียง TTS สำหรับ WhatsApp จะยังอยู่บนเส้นทาง PTT นี้ แม้ผู้ให้บริการจะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบเนทีฟถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับบันทึกเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต Microsoft Edge TTS แบบ MP3/WebM จะถูกแปลงรหัสด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนจัดส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของผู้ช่วยเป็นบันทึกเสียงหนึ่งรายการและระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม TTS อัตโนมัติสำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับสื่อรายการแรกเมื่อส่งเพย์โหลดตอบกลับแบบหลายสื่อ ยกเว้นบันทึกเสียง PTT ที่ส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายของบันทึกเสียงไม่สม่ำเสมอ
    - แหล่งสื่อสามารถเป็น HTTP(S), `file://` หรือเส้นทางภายในเครื่องได้

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมสำรอง">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพถูกปรับให้เหมาะสมโดยอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - เมื่อการส่งสื่อล้มเหลว ทางเลือกสำรองของรายการแรกจะส่งคำเตือนแบบข้อความแทนการทิ้งคำตอบไปเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างอิงคำตอบ

WhatsApp รองรับการอ้างอิงคำตอบแบบเนทีฟ โดยคำตอบขาออกจะแสดงการอ้างอิงข้อความขาเข้าให้เห็น ควบคุมด้วย `channels.whatsapp.replyToMode`

| ค่า         | พฤติกรรม                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                  |
| `"first"`   | อ้างอิงเฉพาะชิ้นส่วนคำตอบขาออกแรก                                    |
| `"all"`     | อ้างอิงทุกชิ้นส่วนคำตอบขาออก                                         |
| `"batched"` | อ้างอิงคำตอบแบบชุดที่เข้าคิวไว้ โดยปล่อยให้คำตอบทันทีไม่ถูกอ้างอิง |

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

## ระดับรีแอ็กชัน

`channels.whatsapp.reactionLevel` ควบคุมว่า agent ใช้รีแอ็กชันอีโมจิบน WhatsApp กว้างเพียงใด:

| ระดับ         | รีแอ็กชันตอบรับ | รีแอ็กชันที่ agent เริ่ม | คำอธิบาย                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่            | ไม่                        | ไม่มีรีแอ็กชันเลย                              |
| `"ack"`       | ใช่           | ไม่                        | เฉพาะรีแอ็กชันตอบรับ (การรับก่อนตอบกลับ)           |
| `"minimal"`   | ใช่           | ใช่ (แบบระมัดระวัง)        | รีแอ็กชันตอบรับ + รีแอ็กชันของ agent พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (ส่งเสริมให้ใช้)          | รีแอ็กชันตอบรับ + รีแอ็กชันของ agent พร้อมแนวทางที่ส่งเสริมให้ใช้   |

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

## รีแอ็กชันตอบรับ

WhatsApp รองรับรีแอ็กชันตอบรับทันทีเมื่อได้รับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
รีแอ็กชันตอบรับถูกควบคุมโดย `reactionLevel` โดยจะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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
- ความล้มเหลวจะถูกบันทึกในล็อก แต่ไม่บล็อกการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะรีแอ็กต์ในรอบที่ถูกทริกเกอร์ด้วยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นทางลัดข้ามการตรวจนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ได้ใช้ `messages.ackReaction` แบบเดิมที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - ID บัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมี มิฉะนั้นใช้ ID บัญชีที่กำหนดค่าไว้รายการแรก (เรียงลำดับแล้ว)
    - ID บัญชีถูกทำให้เป็นรูปแบบมาตรฐานภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="เส้นทางข้อมูลรับรองและความเข้ากันได้แบบเดิม">
    - เส้นทาง auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth ค่าเริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังถูกรู้จัก/ย้ายสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    ในไดเรกทอรี auth แบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ auth ของ Baileys จะถูกลบ

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียน config

- การรองรับเครื่องมือของ agent รวมถึงการกระทำรีแอ็กชันของ WhatsApp (`react`)
- เกตการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียน config ที่เริ่มโดยช่องทางเปิดใช้งานตามค่าเริ่มต้น (ปิดใช้งานผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่ได้เชื่อมโยง (ต้องใช้ QR)">
    อาการ: สถานะช่องทางรายงานว่าไม่ได้เชื่อมโยง

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมโยงแล้วแต่ถูกตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่เชื่อมโยงแล้วมีการตัดการเชื่อมต่อหรือพยายามเชื่อมต่อใหม่ซ้ำ ๆ

    บัญชีที่ไม่ค่อยมีกิจกรรมสามารถคงการเชื่อมต่อไว้เกิน timeout ข้อความตามปกติ; watchdog
    จะเริ่มใหม่เมื่อกิจกรรมการขนส่งของ WhatsApp Web หยุดลง ซ็อกเก็ตปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินกรอบความปลอดภัยที่ยาวกว่า

    หากล็อกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ๆ ให้ปรับ
    จังหวะซ็อกเก็ตของ Baileys ภายใต้ `web.whatsapp` เริ่มจากลด
    `keepAliveIntervalMs` ให้ต่ำกว่า timeout เมื่อเครือข่ายว่างของคุณ และเพิ่ม
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

    หากจำเป็น ให้เชื่อมโยงใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบด้วย QR หมดเวลาหลังพร็อกซี">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงคิวอาร์โค้ดที่ใช้ได้ พร้อม `status=408 Request Time-out` หรือการตัดการเชื่อมต่อซ็อกเก็ต TLS

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อมพร็อกซีมาตรฐานของโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, ตัวแปรตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่าโปรเซส Gateway รับค่าพร็อกซี env และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ใช้งานอยู่ขณะส่ง">
    การส่งขาออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มี listener ของ Gateway ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานและบัญชีถูกเชื่อมโยงแล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏใน transcript แต่ไม่ปรากฏใน WhatsApp">
    แถว transcript บันทึกสิ่งที่ agent สร้างขึ้น การส่งมอบของ WhatsApp ถูกตรวจแยกต่างหาก: OpenClaw จะถือว่าการตอบกลับอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืน ID ข้อความขาออกสำหรับการส่งข้อความที่มองเห็นได้หรือสื่ออย่างน้อยหนึ่งรายการ

    รีแอ็กชันตอบรับเป็นใบรับก่อนตอบกลับที่เป็นอิสระจากกัน รีแอ็กชันที่สำเร็จไม่ได้พิสูจน์ว่าคำตอบข้อความหรือสื่อภายหลังถูก WhatsApp ยอมรับ

    ตรวจสอบล็อก Gateway สำหรับ `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ของ `groups`
    - เกตการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการภายหลังจะแทนที่รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ WhatsApp Gateway ควรใช้ Node โดย Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงานของ Gateway WhatsApp/Telegram ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมต์ระบบ

WhatsApp รองรับพรอมต์ระบบแบบ Telegram สำหรับกลุ่มและแชตโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการแก้ไขสำหรับข้อความกลุ่ม:

แมป `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตนเอง แมปนั้นจะแทนที่แมป `groups` ระดับรากทั้งหมด (ไม่มีการรวมเชิงลึก) จากนั้นการค้นหาพรอมต์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมต์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อมีรายการกลุ่มเฉพาะในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้พรอมต์ระบบ
2. **พรอมต์ระบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มเฉพาะในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ไขสำหรับข้อความโดยตรง:

แมป `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตนเอง แมปนั้นจะแทนที่แมป `direct` ระดับรากทั้งหมด (ไม่มีการรวมเชิงลึก) จากนั้นการค้นหาพรอมต์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมต์ระบบเฉพาะ direct** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมีรายการ peer เฉพาะในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้พรอมต์ระบบ
2. **พรอมต์ระบบ wildcard ของ direct** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการ peer เฉพาะในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบัคเก็ตแทนที่ประวัติต่อ DM แบบเบา (`dms.<id>.historyLimit`) การแทนที่พรอมต์อยู่ภายใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram, `groups` ระดับรากจะถูกระงับโดยเจตนาสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตนเอง เพื่อป้องกันไม่ให้บ็อตรับข้อความกลุ่มสำหรับกลุ่มที่บ็อตไม่ได้เป็นสมาชิก WhatsApp ไม่ได้ใช้การป้องกันนี้: `groups` ระดับรากและ `direct` ระดับรากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp หลายบัญชี หากคุณต้องการพรอมต์กลุ่มหรือ direct รายบัญชี ให้กำหนดแมปแบบเต็มภายใต้แต่ละบัญชีอย่างชัดเจน แทนที่จะพึ่งพาค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปการกำหนดค่ารายกลุ่มและรายการอนุญาตกลุ่มระดับแชท ที่ขอบเขตรากหรือขอบเขตบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่มให้ผ่านเข้าได้" สำหรับขอบเขตนั้น
- เพิ่มกลุ่มไวลด์การ์ด `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุด ID กลุ่มที่กำหนดตายตัวเท่านั้นที่มีสิทธิ์ อย่าใช้ `groups["*"]` สำหรับค่าเริ่มต้นของพรอมป์ ให้ระบุพรอมป์ซ้ำในแต่ละรายการกลุ่มที่อยู่ในรายการอนุญาตอย่างชัดเจนแทน
- การรับกลุ่มเข้าและการอนุญาตผู้ส่งเป็นการตรวจสอบคนละส่วนกัน `groups["*"]` ขยายชุดของกลุ่มที่เข้าถึงการจัดการกลุ่มได้ แต่โดยตัวมันเองไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้น สิทธิ์เข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` เพียงให้การกำหนดค่าแชทโดยตรงเริ่มต้นหลังจากที่ DM ได้รับอนุญาตแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎของ pairing-store

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

## ตัวชี้ไปยังข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก:

- [ข้อมูลอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/config-channels#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การเขียนทับระดับบัญชี
- การดำเนินงาน: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- พฤติกรรมเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- พรอมป์: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
