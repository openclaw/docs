---
read_when:
    - การทำงานกับลักษณะการทำงานของช่องทาง WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องข้อความขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่งข้อความ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:16:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งาน production ผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่เชื่อมโยง

## การติดตั้ง (เมื่อต้องการ)

- Onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง Plugin WhatsApp ในครั้งแรกที่คุณเลือก
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนการติดตั้งเมื่อ
  ยังไม่มี Plugin อยู่
- Dev channel + git checkout: ค่าเริ่มต้นเป็นพาธ Plugin ภายในเครื่อง
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` บนแท็ก release อย่างเป็นทางการปัจจุบัน

การติดตั้งด้วยตนเองยังคงใช้ได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

ใช้แพ็กเกจแบบ bare เพื่อตามแท็ก release อย่างเป็นทางการปัจจุบัน ปักหมุด
เวอร์ชันแบบแน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

บน Windows Plugin WhatsApp ต้องใช้ Git บน `PATH` ระหว่าง npm install เพราะ
หนึ่งใน dependency Baileys/libsignal ถูกดึงมาจาก git URL ให้ติดตั้ง
Git for Windows จากนั้นรีสตาร์ต shell แล้วรันการติดตั้งอีกครั้ง:

```powershell
winget install --id Git.Git -e
```

Portable Git ก็ใช้ได้เช่นกันถ้าไดเรกทอรี `bin` ของมันอยู่บน `PATH`

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้าม channel และ playbook การซ่อมแซม
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่า channel แบบครบถ้วน
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

    หากต้องการแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่/กำหนดเองก่อน login:

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

    คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง คำขอที่รอดำเนินการจำกัดไว้ที่ 3 รายการต่อ channel

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้รัน WhatsApp บนหมายเลขแยกต่างหากเมื่อทำได้ (metadata ของ channel และขั้นตอนการตั้งค่าถูกปรับให้เหมาะกับการตั้งค่านั้น แต่การตั้งค่าด้วยหมายเลขส่วนตัวก็รองรับเช่นกัน)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    นี่คือโหมดปฏิบัติการที่สะอาดที่สุด:

    - ข้อมูลระบุตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการกำหนดเส้นทางชัดเจนขึ้น
    - โอกาสเกิดความสับสนจากการแชทกับตัวเองต่ำลง

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
    Onboarding รองรับโหมดหมายเลขส่วนตัวและเขียน baseline ที่เหมาะกับการแชทกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ระหว่าง runtime การป้องกัน self-chat จะอิงจากหมายเลขตนเองที่เชื่อมโยงและ `allowFrom`

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    channel ของแพลตฟอร์มส่งข้อความนี้อิง WhatsApp Web (`Baileys`) ในสถาปัตยกรรม channel ปัจจุบันของ OpenClaw

    ไม่มี channel ส่งข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรี chat-channel ที่มีในตัว

  </Accordion>
</AccordionGroup>

## โมเดล runtime

- Gateway เป็นเจ้าของ socket WhatsApp และลูปการเชื่อมต่อใหม่
- watchdog การเชื่อมต่อใหม่ใช้กิจกรรม transport ของ WhatsApp Web ไม่ใช่เฉพาะปริมาณ app-message ขาเข้า ดังนั้นเซสชันอุปกรณ์ที่เชื่อมโยงซึ่งเงียบอยู่จะไม่ถูกรีสตาร์ตเพียงเพราะไม่มีใครส่งข้อความเมื่อเร็ว ๆ นี้ ขีดจำกัด application-silence ที่ยาวขึ้นยังคงบังคับให้เชื่อมต่อใหม่หาก transport frame ยังมาถึงแต่ไม่มีการจัดการข้อความ application ตลอดช่วงเวลา watchdog; หลังจากการเชื่อมต่อใหม่ชั่วคราวสำหรับเซสชันที่เพิ่งมีการใช้งาน การตรวจ application-silence นั้นจะใช้ timeout ข้อความปกติสำหรับช่วง recovery แรก
- timing ของ socket Baileys ระบุไว้อย่างชัดเจนใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping application ของ WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ opening handshake และ `defaultQueryTimeoutMs` ควบคุม timeout ของ query Baileys
- การส่งขาออกต้องมี listener WhatsApp ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย
- การส่งกลุ่มจะแนบ metadata การ mention แบบ native สำหรับ token `@+<digits>` และ `@<digits>` ในข้อความและ caption สื่อเมื่อ token ตรงกับ metadata ผู้เข้าร่วม WhatsApp ปัจจุบัน รวมถึงกลุ่มที่อิง LID
- ระบบจะละเว้นแชทสถานะและ broadcast (`@status`, `@broadcast`)
- watchdog การเชื่อมต่อใหม่ติดตามกิจกรรม transport ของ WhatsApp Web ไม่ใช่เฉพาะปริมาณ app-message ขาเข้า: เซสชันอุปกรณ์ที่เชื่อมโยงซึ่งเงียบอยู่จะยังคงอยู่ขณะ transport frame ยังดำเนินต่อ แต่ transport stall จะบังคับให้เชื่อมต่อใหม่ก่อนเส้นทาง remote disconnect ที่มาภายหลังมาก
- แชทโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM เข้ากับเซสชัน main ของ agent)
- เซสชันกลุ่มถูกแยกออก (`agent:<agentId>:whatsapp:group:<jid>`)
- WhatsApp Channels/Newsletters สามารถเป็นเป้าหมายขาออกแบบชัดเจนด้วย JID `@newsletter` แบบ native ของมัน การส่ง newsletter ขาออกใช้ metadata เซสชัน channel (`agent:<agentId>:whatsapp:channel:<jid>`) แทน semantics ของเซสชัน DM
- transport ของ WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / ตัวแปรอักษรเล็กรูปแบบเดียวกัน) ควรใช้การกำหนดค่า proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะ channel WhatsApp
- เมื่อเปิดใช้ `messages.removeAckAfterReply` OpenClaw จะล้าง reaction ack ของ WhatsApp หลังจากส่ง reply ที่มองเห็นได้แล้ว

## hook ของ Plugin และความเป็นส่วนตัว

ข้อความขาเข้า WhatsApp อาจมีเนื้อหาข้อความส่วนบุคคล หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์การเชื่อมโยงเซสชัน ด้วยเหตุนี้
WhatsApp จะไม่ broadcast payload hook `message_received` ขาเข้าไปยัง Plugin
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

คุณสามารถจำกัด opt-in ให้กับบัญชีเดียวได้:

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

เปิดใช้สิ่งนี้เฉพาะสำหรับ Plugin ที่คุณไว้วางใจให้รับเนื้อหาและตัวระบุ
ข้อความ WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชทโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (normalize ภายใน)

    `allowFrom` เป็นรายการควบคุมการเข้าถึงผู้ส่ง DM ไม่ได้กั้นการส่งขาออกแบบชัดเจนไปยัง JID กลุ่ม WhatsApp หรือ JID channel `@newsletter`

    การ override หลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับ channel สำหรับบัญชีนั้น

    รายละเอียดพฤติกรรม runtime:

    - pairing ถูกเก็บถาวรใน allow-store ของ channel และรวมกับ `allowFrom` ที่กำหนดค่าไว้
    - automation ตามกำหนดเวลาและ fallback ผู้รับ Heartbeat ใช้เป้าหมายการส่งแบบชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้; การอนุมัติ pairing ของ DM ไม่ใช่ผู้รับ Cron หรือ Heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist หมายเลขตนเองที่เชื่อมโยงจะได้รับอนุญาตโดยค่าเริ่มต้น
    - OpenClaw ไม่จับคู่ DM `fromMe` ขาออกโดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่เชื่อมโยง)

  </Tab>

  <Tab title="Group policy + allowlists">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละเว้น `groups` ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` จะทำหน้าที่เป็น allowlist ของกลุ่ม (`"*"` อนุญาต)

    2. **นโยบายผู้ส่งกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ของผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อก inbound ของกลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` runtime จะ fallback ไปที่ `allowFrom` เมื่อมี
    - allowlist ของผู้ส่งถูกประเมินก่อนการเปิดใช้งานด้วย mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` อยู่เลย fallback ของนโยบายกลุ่มใน runtime คือ `allowlist` (พร้อม warning log) แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention ของ WhatsApp อย่างชัดเจนถึงข้อมูลระบุตัวตนของ bot
    - รูปแบบ regex mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcript ของ voice-note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับการ reply-to-bot โดยนัย (ผู้ส่ง reply ตรงกับข้อมูลระบุตัวตนของ bot)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply ทำให้ผ่าน gating ของ mention เท่านั้น; ไม่ได้ให้ authorization แก่ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่ได้อยู่ใน allowlist ยังคงถูกบล็อก แม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่ง activation ระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่ config ระดับ global) และถูก owner-gated

  </Tab>
</Tabs>

## พฤติกรรมหมายเลขส่วนตัวและ self-chat

เมื่อหมายเลขตนเองที่เชื่อมโยงอยู่ใน `allowFrom` ด้วย safeguard ของ self-chat WhatsApp จะเปิดใช้งาน:

- ข้าม read receipt สำหรับรอบ self-chat
- ละเว้นพฤติกรรม auto-trigger ของ mention-JID ที่มิฉะนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` reply ของ self-chat จะมีค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและ context

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    ข้อความ WhatsApp ขาเข้าถูกห่อใน inbound envelope ที่ใช้ร่วมกัน

    หากมี quoted reply อยู่ context จะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์ metadata ของ reply จะถูกเติมเมื่อมีเช่นกัน (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 ของผู้ส่ง)
    เมื่อเป้าหมาย quoted reply เป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    store สื่อขาเข้าปกติและเปิดเผยเป็น `MediaPath`/`MediaType` เพื่อให้
    agent สามารถตรวจสอบรูปภาพที่อ้างอิง แทนที่จะเห็นเพียง
    `<media:image>`

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    ข้อความขาเข้าที่มีเฉพาะสื่อถูก normalize ด้วย placeholder เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice note ของกลุ่มที่ได้รับอนุญาตจะถูก transcribe ก่อน gating ของ mention เมื่อ
    body มีเพียง `<media:audio>` ดังนั้นการพูด mention ถึง bot ใน voice note จึงสามารถ
    trigger reply ได้ หาก transcript ยังไม่ mention ถึง bot
    transcript จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทน placeholder ดิบ

    body ของตำแหน่งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียด contact/vCard ถูกแสดงเป็น metadata ที่ไม่น่าเชื่อถือใน fenced block ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="Pending group history injection">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูก buffer และ inject เป็น context เมื่อ bot ถูก trigger ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - การกำหนดค่า: `channels.whatsapp.historyLimit`
    - ทางเลือกสำรอง: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    เครื่องหมายสำหรับฉีดแทรก:

    - `[ข้อความแชตตั้งแต่การตอบกลับครั้งล่าสุดของคุณ - เพื่อเป็นบริบท]`
    - `[ข้อความปัจจุบัน - ตอบกลับข้อความนี้]`

  </Accordion>

  <Accordion title="ใบตอบรับการอ่าน">
    ใบตอบรับการอ่านเปิดใช้งานโดยค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ได้รับการยอมรับ

    ปิดใช้งานแบบทั่วทั้งระบบ:

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

    รอบการคุยกับตัวเองจะข้ามใบตอบรับการอ่าน แม้จะเปิดใช้งานแบบทั่วทั้งระบบอยู่ก็ตาม

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่งส่วน และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งส่วนข้อความ">
    - ขีดจำกัดส่วนเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) จากนั้นจึงถอยกลับไปใช้การแบ่งส่วนตามความยาวที่ปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดรูปภาพ วิดีโอ เสียง (บันทึกเสียง PTT) และเอกสาร
    - สื่อเสียงจะถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` เพื่อให้ไคลเอนต์ WhatsApp แสดงผลเป็นบันทึกเสียงแบบกดเพื่อพูด
    - เพย์โหลดตอบกลับจะเก็บ `audioAsVoice` ไว้; เอาต์พุตบันทึกเสียง TTS สำหรับ WhatsApp จะยังคงอยู่บนเส้นทาง PTT นี้ แม้ provider จะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus ดั้งเดิมจะถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับบันทึกเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต MP3/WebM ของ Microsoft Edge TTS จะถูกแปลงรหัสด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของ assistant เป็นบันทึกเสียงเดียว และระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม TTS อัตโนมัติสำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อแรกเมื่อส่งเพย์โหลดตอบกลับหลายสื่อ ยกเว้นบันทึกเสียง PTT ซึ่งจะส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp ไม่ได้แสดงผลคำบรรยายของบันทึกเสียงอย่างสม่ำเสมอ
    - แหล่งสื่ออาจเป็น HTTP(S), `file://` หรือพาธภายในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมทางเลือกสำรอง">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมโดยอัตโนมัติ (ปรับขนาด/ไล่คุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - เมื่อการส่งสื่อล้มเหลว ทางเลือกสำรองสำหรับรายการแรกจะส่งคำเตือนเป็นข้อความแทนการทิ้งคำตอบไปอย่างเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างอิงในการตอบกลับ

WhatsApp รองรับการอ้างอิงการตอบกลับแบบดั้งเดิม โดยคำตอบขาออกจะอ้างอิงข้อความขาเข้าให้เห็น ควบคุมได้ด้วย `channels.whatsapp.replyToMode`

| ค่า       | พฤติกรรม                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                  |
| `"first"`   | อ้างอิงเฉพาะส่วนแรกของคำตอบขาออก                             |
| `"all"`     | อ้างอิงทุกส่วนของคำตอบขาออก                                      |
| `"batched"` | อ้างอิงคำตอบแบบชุดที่อยู่ในคิว โดยปล่อยให้คำตอบทันทีไม่ถูกอ้างอิง |

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

## ระดับการตอบสนอง

`channels.whatsapp.reactionLevel` ควบคุมว่า agent ใช้การตอบสนองด้วยอีโมจิบน WhatsApp กว้างเพียงใด:

| ระดับ         | การตอบสนอง Ack | การตอบสนองที่ agent เริ่มเอง | คำอธิบาย                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่            | ไม่                        | ไม่มีการตอบสนองเลย                              |
| `"ack"`       | ใช่           | ไม่                        | เฉพาะการตอบสนอง Ack (ใบตอบรับก่อนตอบกลับ)           |
| `"minimal"`   | ใช่           | ใช่ (ระมัดระวัง)        | Ack + การตอบสนองของ agent พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (ส่งเสริมให้ใช้)          | Ack + การตอบสนองของ agent พร้อมแนวทางที่ส่งเสริมให้ใช้   |

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

## การตอบสนองเพื่อรับทราบ

WhatsApp รองรับการตอบสนอง Ack ทันทีเมื่อได้รับขาเข้าผ่าน `channels.whatsapp.ackReaction`
การตอบสนอง Ack ถูกควบคุมด้วย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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

- ส่งทันทีหลังจากขาเข้าได้รับการยอมรับ (ก่อนตอบกลับ)
- ความล้มเหลวจะถูกบันทึกในล็อก แต่ไม่บล็อกการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะตอบสนองในรอบที่ถูกกระตุ้นโดยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นทางลัดข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ได้ใช้ `messages.ackReaction` แบบเดิมที่นี่)

## หลายบัญชีและข้อมูลประจำตัว

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - รหัสบัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมีอยู่ มิฉะนั้นใช้รหัสบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
    - รหัสบัญชีถูกปรับรูปแบบภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="พาธข้อมูลประจำตัวและความเข้ากันได้แบบเดิม">
    - พาธ auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth เริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังถูกรับรู้/ย้ายสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    เมื่อเข้าถึง Gateway ได้ การออกจากระบบจะหยุดตัวรับฟัง WhatsApp แบบสดสำหรับบัญชีที่เลือกก่อน เพื่อไม่ให้เซสชันที่เชื่อมโยงอยู่ยังคงรับข้อความจนกว่าจะรีสตาร์ตครั้งถัดไป `openclaw channels remove --channel whatsapp` จะหยุดตัวรับฟังแบบสดก่อนปิดใช้งานหรือลบการกำหนดค่าบัญชีเช่นกัน

    ในไดเรกทอรี auth แบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ auth ของ Baileys จะถูกลบ

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนการกำหนดค่า

- การรองรับเครื่องมือของ agent รวมถึงการกระทำการตอบสนองของ WhatsApp (`react`)
- เกตการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนการกำหนดค่าที่เริ่มโดยช่องทางเปิดใช้งานโดยค่าเริ่มต้น (ปิดใช้งานผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้เชื่อมโยง (ต้องใช้ QR)">
    อาการ: สถานะช่องทางรายงานว่ายังไม่ได้เชื่อมโยง

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมโยงแล้วแต่ถูกตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่เชื่อมโยงแล้วมีการตัดการเชื่อมต่อซ้ำ ๆ หรือพยายามเชื่อมต่อใหม่

    บัญชีที่เงียบสามารถเชื่อมต่ออยู่ต่อไปได้เกินระยะหมดเวลาข้อความตามปกติ; watchdog
    จะรีสตาร์ตเมื่อกิจกรรมการขนส่งของ WhatsApp Web หยุดลง ซ็อกเก็ตปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินกรอบเวลาความปลอดภัยที่ยาวกว่า

    หากล็อกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ๆ ให้ปรับ
    เวลาของซ็อกเก็ต Baileys ภายใต้ `web.whatsapp` เริ่มจากการลด
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
    gateway และ WhatsApp ปกติดี ให้รัน `openclaw doctor` บน Linux doctor
    จะเตือนเกี่ยวกับรายการ crontab แบบเดิมที่ยังเรียกใช้
    `~/.openclaw/bin/ensure-whatsapp.sh`; ลบรายการเก่าเหล่านั้นด้วย
    `crontab -e` เพราะ cron อาจไม่มีสภาพแวดล้อม systemd user-bus และ
    ทำให้สคริปต์เก่านั้นรายงานสุขภาพ gateway ผิดพลาด

    หากจำเป็น ให้เชื่อมโยงใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบด้วย QR หมดเวลาหลัง proxy">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงโค้ด QR ที่ใช้งานได้ พร้อม `status=408 Request Time-out` หรือการตัดการเชื่อมต่อซ็อกเก็ต TLS

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อม proxy มาตรฐานของโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, ตัวแปรตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่าโปรเซส gateway สืบทอด proxy env และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มีตัวรับฟังที่ใช้งานอยู่เมื่อส่ง">
    การส่งขาออกจะล้มเหลวทันทีเมื่อไม่มีตัวรับฟัง gateway ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า gateway กำลังทำงานและบัญชีถูกเชื่อมโยงแล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏในทรานสคริปต์แต่ไม่อยู่ใน WhatsApp">
    แถวทรานสคริปต์บันทึกสิ่งที่ agent สร้างขึ้น การส่งบน WhatsApp ถูกตรวจสอบแยกต่างหาก: OpenClaw จะถือว่าการตอบกลับอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืนรหัสข้อความขาออกสำหรับการส่งข้อความที่มองเห็นได้หรือสื่ออย่างน้อยหนึ่งรายการ

    การตอบสนอง Ack เป็นใบตอบรับก่อนตอบกลับที่เป็นอิสระต่อกัน การตอบสนองที่สำเร็จไม่ได้พิสูจน์ว่าคำตอบข้อความหรือสื่อในภายหลังได้รับการยอมรับโดย WhatsApp

    ตรวจสอบล็อก gateway สำหรับ `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ของ `groups`
    - เกตการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการภายหลังจะแทนที่รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ gateway ของ WhatsApp ควรใช้ Node Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงาน gateway ของ WhatsApp/Telegram ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมป์ระบบ

WhatsApp รองรับพรอมป์ระบบแบบ Telegram สำหรับกลุ่มและแชตโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการแก้ค่าสำหรับข้อความกลุ่ม:

แมป `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตนเองไว้ ค่านั้นจะแทนที่แมป `groups` ที่รากทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและไม่มีพรอมป์ระบบถูกนำไปใช้
2. **พรอมป์ระบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มเฉพาะอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ค่าสำหรับข้อความโดยตรง:

แมป `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตนเองไว้ ค่านั้นจะแทนที่แมป `direct` ที่รากทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบแบบเฉพาะ Direct** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมีรายการเพียร์เฉพาะอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ของรายการนั้น หาก `systemPrompt` เป็นสตริงว่าง (`""`) ไวลด์การ์ดจะถูกระงับ และจะไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบไวลด์การ์ดของ Direct** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเพียร์เฉพาะอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบักเก็ตโอเวอร์ไรด์ประวัติต่อ DM แบบเบา (`dms.<id>.historyLimit`) ส่วนการโอเวอร์ไรด์พรอมป์อยู่ภายใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ค่า `groups` ระดับรากจะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่บอตไม่ได้เป็นสมาชิกอยู่ WhatsApp ไม่ใช้การป้องกันนี้: `groups` ระดับรากและ `direct` ระดับรากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดโอเวอร์ไรด์ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp แบบหลายบัญชี หากคุณต้องการพรอมป์กลุ่มหรือ direct แยกตามบัญชี ให้กำหนดแมปเต็มภายใต้แต่ละบัญชีอย่างชัดเจนแทนการพึ่งพาค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปการกำหนดค่าต่อกลุ่มและ allowlist กลุ่มระดับแชต ไม่ว่าจะอยู่ในขอบเขตระดับรากหรือระดับบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่ม `systemPrompt` ของกลุ่มแบบไวลด์การ์ดเฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุด ID กลุ่มคงที่เท่านั้นที่มีสิทธิ์ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของพรอมป์ ให้ทำซ้ำพรอมป์ในแต่ละรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแทน
- การรับกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบแยกกัน `groups["*"]` ขยายชุดของกลุ่มที่เข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นด้วยตัวเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ให้เพียงการกำหนดค่า direct-chat เริ่มต้นหลังจาก DM ได้รับการรับเข้าแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎของ pairing-store

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

ฟิลด์ WhatsApp ที่มีสัญญาณสำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การโอเวอร์ไรด์ระดับบัญชี
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
