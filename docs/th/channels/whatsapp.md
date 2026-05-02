---
read_when:
    - การทำงานเกี่ยวกับพฤติกรรมของช่องทาง WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องจดหมาย
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่งมอบ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่ลิงก์ไว้

## การติดตั้ง (เมื่อต้องการ)

- Onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง Plugin WhatsApp ในครั้งแรกที่คุณเลือกใช้
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนการติดตั้งเมื่อ
  ยังไม่มี Plugin
- ช่อง dev + git checkout: ค่าเริ่มต้นคือเส้นทาง Plugin ในเครื่อง
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` เมื่อมีการเผยแพร่แพ็กเกจ
  ปัจจุบันแล้ว

ยังคงติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้หรือไม่มีอยู่ ให้ใช้
OpenClaw build ที่แพ็กเกจไว้ในปัจจุบันหรือ checkout ในเครื่องจนกว่าขบวนแพ็กเกจ npm
จะตามทัน

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและคู่มือการซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางทั้งหมด
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

    คำขอจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอที่รอดำเนินการจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp กับหมายเลขแยกต่างหากเมื่อเป็นไปได้ (เมตาดาต้าช่องทางและขั้นตอนการตั้งค่าถูกปรับให้เหมาะกับการตั้งค่านั้น แต่ก็รองรับการตั้งค่าด้วยหมายเลขส่วนตัวด้วย)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    นี่คือโหมดการปฏิบัติการที่สะอาดที่สุด:

    - แยกตัวตน WhatsApp สำหรับ OpenClaw
    - ขอบเขต allowlist และการกำหนดเส้นทางของ DM ชัดเจนขึ้น
    - โอกาสเกิดความสับสนจากการแชตกับตัวเองต่ำลง

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
    Onboarding รองรับโหมดหมายเลขส่วนตัวและเขียนค่าพื้นฐานที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ขณะรัน การป้องกันการแชตกับตัวเองอิงจากหมายเลขตัวเองที่ลิงก์ไว้และ `allowFrom`

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    ช่องทางแพลตฟอร์มการส่งข้อความอิงจาก WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทาง OpenClaw ปัจจุบัน

    ไม่มีช่องทางส่งข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรีช่องแชตที่มีมาให้

  </Accordion>
</AccordionGroup>

## โมเดลขณะรัน

- Gateway เป็นเจ้าของซ็อกเก็ต WhatsApp และลูปการเชื่อมต่อใหม่
- watchdog การเชื่อมต่อใหม่ใช้กิจกรรมการขนส่งของ WhatsApp Web ไม่ใช่เพียงปริมาณข้อความแอปขาเข้า ดังนั้นเซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบอยู่จะไม่ถูกรีสตาร์ทเพียงเพราะเมื่อเร็ว ๆ นี้ไม่มีใครส่งข้อความมา ขีดจำกัดความเงียบของแอปพลิเคชันที่ยาวขึ้นยังคงบังคับให้เชื่อมต่อใหม่หากเฟรมการขนส่งยังมาถึงแต่ไม่มีการจัดการข้อความแอปพลิเคชันตลอดช่วงเวลา watchdog หลังจากการเชื่อมต่อใหม่ชั่วคราวสำหรับเซสชันที่เพิ่งมีการใช้งาน การตรวจสอบความเงียบของแอปพลิเคชันนั้นใช้ timeout ข้อความปกติสำหรับช่วงกู้คืนแรก
- เวลาในการทำงานของซ็อกเก็ต Baileys ระบุอย่างชัดเจนใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping แอปพลิเคชัน WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ handshake ตอนเปิดการเชื่อมต่อ และ `defaultQueryTimeoutMs` ควบคุม timeout ของ query Baileys
- การส่งขาออกต้องมี listener WhatsApp ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย
- แชตสถานะและ broadcast จะถูกละเว้น (`@status`, `@broadcast`)
- watchdog การเชื่อมต่อใหม่ติดตามกิจกรรมการขนส่งของ WhatsApp Web ไม่ใช่เพียงปริมาณข้อความแอปขาเข้า: เซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบอยู่จะยังทำงานอยู่ขณะที่เฟรมการขนส่งยังต่อเนื่อง แต่การหยุดชะงักของการขนส่งจะบังคับให้เชื่อมต่อใหม่ก่อนเส้นทางตัดการเชื่อมต่อจากระยะไกลในภายหลังอย่างมาก
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` จะยุบ DM เข้าเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- WhatsApp Channels/Newsletters สามารถเป็นเป้าหมายขาออกแบบชัดเจนด้วย JID `@newsletter` ดั้งเดิม การส่ง newsletter ขาออกใช้เมตาดาต้าเซสชันช่องทาง (`agent:<agentId>:whatsapp:channel:<jid>`) แทนความหมายของเซสชัน DM
- การขนส่ง WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / ตัวแปรตัวพิมพ์เล็กรูปแบบเดียวกัน) ควรใช้การกำหนดค่า proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะช่องทางของ WhatsApp
- เมื่อเปิดใช้ `messages.removeAckAfterReply` แล้ว OpenClaw จะล้าง reaction ack ของ WhatsApp หลังจากส่งการตอบกลับที่มองเห็นได้สำเร็จ

## hook ของ Plugin และความเป็นส่วนตัว

ข้อความขาเข้า WhatsApp อาจมีเนื้อหาข้อความส่วนตัว หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์สหสัมพันธ์ของเซสชัน ด้วยเหตุนี้
WhatsApp จะไม่ broadcast payload hook `message_received` ขาเข้าไปยัง plugins
เว้นแต่คุณเลือกเปิดใช้อย่างชัดเจน:

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

คุณสามารถจำกัดขอบเขตการเลือกเปิดใช้กับบัญชีเดียว:

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

เปิดใช้เฉพาะกับ plugins ที่คุณเชื่อถือให้รับเนื้อหาและตัวระบุของข้อความ
WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (normalize ภายใน)

    `allowFrom` เป็นรายการควบคุมการเข้าถึงของผู้ส่ง DM ซึ่งไม่ได้กั้นการส่งขาออกแบบชัดเจนไปยัง JID กลุ่ม WhatsApp หรือ JID ช่องทาง `@newsletter`

    การ override หลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมขณะรัน:

    - การจับคู่ถูกเก็บถาวรใน allow-store ของช่องทางและรวมกับ `allowFrom` ที่กำหนดค่าไว้
    - ระบบอัตโนมัติตามกำหนดเวลาและ fallback ผู้รับ Heartbeat ใช้เป้าหมายการส่งที่ชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้ การอนุมัติการจับคู่ DM ไม่ใช่ผู้รับ Cron หรือ Heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist จะอนุญาตหมายเลขตัวเองที่ลิงก์ไว้ตามค่าเริ่มต้น
    - OpenClaw ไม่จับคู่ DM ขาออก `fromMe` โดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่ลิงก์ไว้)

  </Tab>

  <Tab title="Group policy + allowlists">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละ `groups` ไว้ ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` จะทำหน้าที่เป็น allowlist กลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งของกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้ากลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้ง `groupAllowFrom` ขณะรันจะ fallback ไปยัง `allowFrom` เมื่อมี
    - allowlist ผู้ส่งจะถูกประเมินก่อนการเปิดใช้งานด้วย mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย fallback ของนโยบายกลุ่มขณะรันคือ `allowlist` (พร้อมบันทึกคำเตือน) แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้อง mention ตามค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention ของ WhatsApp ที่ระบุตัวตนบอทอย่างชัดเจน
    - รูปแบบ regex ของ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - ทรานสคริปต์ voice-note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับ reply-to-bot โดยนัย (ผู้ส่งที่ตอบกลับตรงกับตัวตนบอท)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply เพียงผ่านเงื่อนไข mention gating เท่านั้น และ **ไม่ได้** ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ใน allowlist ยังคงถูกบล็อกแม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่ config ทั่วโลก) และถูกจำกัดโดยเจ้าของ

  </Tab>
</Tabs>

## พฤติกรรมหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขตัวเองที่ลิงก์ไว้ปรากฏอยู่ใน `allowFrom` ด้วย การป้องกันการแชตกับตัวเองของ WhatsApp จะเปิดใช้งาน:

- ข้าม read receipts สำหรับรอบการแชตกับตัวเอง
- ละเว้นพฤติกรรม auto-trigger ของ mention-JID ที่มิฉะนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้ง `messages.responsePrefix` การตอบกลับแชตกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและบริบท

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วย envelope ขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับที่ quote ไว้ บริบทจะถูกผนวกในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมตาดาต้า reply จะถูกเติมเมื่อมี (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 ของผู้ส่ง)
    เมื่อเป้าหมายการตอบกลับที่ quote ไว้เป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    store สื่อขาเข้าปกติและแสดงเป็น `MediaPath`/`MediaType` เพื่อให้
    เอเจนต์ตรวจดูรูปภาพที่อ้างอิงได้แทนที่จะเห็นเพียง
    `<media:image>`

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    ข้อความขาเข้าที่มีเฉพาะสื่อจะถูก normalize ด้วย placeholder เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice notes ของกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อน mention gating เมื่อ
    body มีเพียง `<media:audio>` ดังนั้นการพูด mention บอทใน voice note สามารถ
    trigger การตอบกลับได้ หากทรานสคริปต์ยังไม่ mention บอท
    ทรานสคริปต์จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทน placeholder ดิบ

    เนื้อหาตำแหน่งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียด contact/vCard จะแสดงเป็นเมตาดาต้าที่ไม่น่าเชื่อถือใน fenced block ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="Pending group history injection">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูกบัฟเฟอร์และฉีดเข้าเป็นบริบทเมื่อบอทถูก trigger ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    เครื่องหมายการฉีด:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    read receipts เปิดใช้ตามค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ได้รับการยอมรับ

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

    การ override ต่อบัญชี:

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

    รอบการแชตกับตนเองจะข้ามใบตอบรับการอ่าน แม้จะเปิดใช้งานทั่วทั้งระบบอยู่ก็ตาม

  </Accordion>
</AccordionGroup>

## การส่งมอบ การแบ่งส่วน และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งส่วนข้อความ">
    - ขีดจำกัดส่วนเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะเลือกขอบเขตย่อหน้าเป็นหลัก (บรรทัดว่าง) จากนั้นจึงถอยกลับไปแบ่งส่วนตามความยาวอย่างปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดรูปภาพ วิดีโอ เสียง (บันทึกเสียง PTT) และเอกสาร
    - สื่อเสียงถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` เพื่อให้ไคลเอนต์ WhatsApp แสดงเป็นบันทึกเสียงแบบกดเพื่อพูด
    - เพย์โหลดตอบกลับจะคง `audioAsVoice`; เอาต์พุตบันทึกเสียง TTS สำหรับ WhatsApp จะอยู่บนเส้นทาง PTT นี้ แม้ผู้ให้บริการจะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบเนทีฟจะถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับบันทึกเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต Microsoft Edge TTS MP3/WebM จะถูกแปลงด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของผู้ช่วยเป็นบันทึกเสียงหนึ่งรายการ และระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม TTS อัตโนมัติสำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อแรกเมื่อส่งเพย์โหลดตอบกลับแบบหลายสื่อ ยกเว้นบันทึกเสียง PTT จะส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายบันทึกเสียงได้ไม่สม่ำเสมอ
    - แหล่งสื่ออาจเป็น HTTP(S), `file://` หรือพาธในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมสำรอง">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมอัตโนมัติ (ปรับขนาด/ไล่คุณภาพ) เพื่อให้อยู่ภายใต้ขีดจำกัด
    - เมื่อการส่งสื่อล้มเหลว กลไกสำรองสำหรับรายการแรกจะส่งข้อความเตือนแทนการทิ้งคำตอบไปเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างอิงข้อความตอบกลับ

WhatsApp รองรับการอ้างอิงข้อความตอบกลับแบบเนทีฟ โดยคำตอบขาออกจะอ้างอิงข้อความขาเข้าให้เห็น ควบคุมด้วย `channels.whatsapp.replyToMode`

| ค่า         | พฤติกรรม                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                  |
| `"first"`   | อ้างอิงเฉพาะส่วนคำตอบขาออกส่วนแรก                                    |
| `"all"`     | อ้างอิงทุกส่วนคำตอบขาออก                                             |
| `"batched"` | อ้างอิงคำตอบแบบชุดที่อยู่ในคิว โดยปล่อยคำตอบทันทีไว้แบบไม่อ้างอิง |

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

`channels.whatsapp.reactionLevel` ควบคุมว่า Agent ใช้รีแอ็กชันอีโมจิบน WhatsApp กว้างเพียงใด:

| ระดับ         | รีแอ็กชันรับทราบ | รีแอ็กชันที่ Agent เริ่มเอง | คำอธิบาย                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่            | ไม่                        | ไม่มีรีแอ็กชันใด ๆ                              |
| `"ack"`       | ใช่           | ไม่                        | เฉพาะรีแอ็กชันรับทราบ (ใบรับก่อนตอบกลับ)           |
| `"minimal"`   | ใช่           | ใช่ (ระมัดระวัง)        | รับทราบ + รีแอ็กชันของ Agent พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (สนับสนุน)          | รับทราบ + รีแอ็กชันของ Agent พร้อมแนวทางแบบสนับสนุน   |

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

## รีแอ็กชันรับทราบ

WhatsApp รองรับรีแอ็กชันรับทราบทันทีเมื่อได้รับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
รีแอ็กชันรับทราบถูกควบคุมด้วย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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

- ส่งทันทีหลังยอมรับข้อความขาเข้าแล้ว (ก่อนตอบกลับ)
- ความล้มเหลวจะถูกบันทึก แต่ไม่บล็อกการส่งคำตอบปกติ
- โหมดกลุ่ม `mentions` จะรีแอ็กต์ในรอบที่ถูกทริกเกอร์ด้วยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นทางข้ามสำหรับการตรวจนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ได้ใช้ `messages.ackReaction` แบบเดิมที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - รหัสบัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมีอยู่ มิฉะนั้นใช้รหัสบัญชีที่กำหนดค่าไว้ตัวแรก (เรียงลำดับแล้ว)
    - รหัสบัญชีถูกทำให้เป็นรูปแบบมาตรฐานภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="พาธข้อมูลรับรองและความเข้ากันได้แบบเดิม">
    - พาธการยืนยันตัวตนปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - การยืนยันตัวตนเริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังถูกจดจำ/ย้ายสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรมออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะการยืนยันตัวตน WhatsApp สำหรับบัญชีนั้น

    เมื่อเข้าถึง Gateway ได้ การออกจากระบบจะหยุดตัวฟัง WhatsApp ที่ทำงานอยู่สำหรับบัญชีที่เลือกก่อน เพื่อไม่ให้เซสชันที่เชื่อมโยงยังคงรับข้อความจนกว่าจะรีสตาร์ตครั้งถัดไป `openclaw channels remove --channel whatsapp` จะหยุดตัวฟังที่ทำงานอยู่ก่อนปิดใช้งานหรือลบการกำหนดค่าบัญชีด้วย

    ในไดเรกทอรีการยืนยันตัวตนแบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ยืนยันตัวตนของ Baileys จะถูกลบ

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนการกำหนดค่า

- การรองรับเครื่องมือของ Agent รวมถึงการกระทำรีแอ็กชัน WhatsApp (`react`)
- เกตการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนการกำหนดค่าที่เริ่มจากช่องทางเปิดใช้งานตามค่าเริ่มต้น (ปิดใช้งานผ่าน `channels.whatsapp.configWrites=false`)

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

  <Accordion title="เชื่อมโยงแล้วแต่ตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่เชื่อมโยงแล้วมีการตัดการเชื่อมต่อซ้ำ ๆ หรือพยายามเชื่อมต่อใหม่

    บัญชีที่เงียบอาจยังคงเชื่อมต่อเลยระยะหมดเวลาข้อความปกติได้; watchdog
    จะรีสตาร์ตเมื่อกิจกรรมทรานสปอร์ต WhatsApp Web หยุดลง ซ็อกเก็ตปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินกรอบเวลาความปลอดภัยที่ยาวกว่า

    หากบันทึกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ๆ ให้ปรับ
    เวลาซ็อกเก็ตของ Baileys ใต้ `web.whatsapp` เริ่มจากการลด
    `keepAliveIntervalMs` ให้ต่ำกว่าเวลาหมดอายุเมื่อเครือข่ายว่างของคุณ และเพิ่ม
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
    ทำให้สคริปต์เก่านั้นรายงานสถานะ gateway ผิดพลาด

    หากจำเป็น ให้เชื่อมโยงใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบด้วย QR หมดเวลาหลังพร็อกซี">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงโค้ด QR ที่ใช้งานได้ พร้อม `status=408 Request Time-out` หรือ TLS socket ตัดการเชื่อมต่อ

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อมพร็อกซีมาตรฐานของโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, ตัวแปรตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่าโปรเซส gateway ได้รับ proxy env และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มีตัวฟังที่ใช้งานอยู่เมื่อส่ง">
    การส่งขาออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มีตัวฟัง gateway ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจให้แน่ใจว่า gateway กำลังทำงานและบัญชีถูกเชื่อมโยงแล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏในทรานสคริปต์แต่ไม่อยู่ใน WhatsApp">
    แถวทรานสคริปต์บันทึกสิ่งที่ Agent สร้างขึ้น การส่งผ่าน WhatsApp จะถูกตรวจแยกต่างหาก: OpenClaw ถือว่าคำตอบอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืนรหัสข้อความขาออกสำหรับการส่งข้อความที่มองเห็นได้หรือสื่ออย่างน้อยหนึ่งรายการ

    รีแอ็กชันรับทราบเป็นใบรับก่อนตอบกลับที่แยกอิสระ รีแอ็กชันที่สำเร็จไม่ได้พิสูจน์ว่าคำตอบข้อความหรือสื่อภายหลังถูก WhatsApp ยอมรับ

    ตรวจบันทึก gateway เพื่อหา `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ของ `groups`
    - เกตการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการหลังจะแทนที่รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ gateway ของ WhatsApp ควรใช้ Node Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงาน gateway ของ WhatsApp/Telegram ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมป์ระบบ

WhatsApp รองรับพรอมป์ระบบสไตล์ Telegram สำหรับกลุ่มและแชตโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการแก้ค่าสำหรับข้อความกลุ่ม:

แมป `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตัวเองไว้ จะใช้แทนแมป `groups` รากทั้งหมด (ไม่มีการผสานเชิงลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อมีรายการกลุ่มเฉพาะในแมป **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มเฉพาะในแมปเลย หรือเมื่อมีรายการนั้นอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ค่าสำหรับข้อความโดยตรง:

แมป `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตัวเองไว้ จะใช้แทนแมป `direct` รากทั้งหมด (ไม่มีการผสานเชิงลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะข้อความโดยตรง** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมีรายการเพียร์เฉพาะในแมป **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบ wildcard ของข้อความโดยตรง** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเพียร์เฉพาะในแมปเลย หรือเมื่อมีรายการนั้นอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบักเก็ตแทนที่ประวัติต่อ DM แบบน้ำหนักเบา (`dms.<id>.historyLimit`) การแทนที่พรอมป์อยู่ใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram, root `groups` จะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในการตั้งค่าแบบหลายบัญชี — แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง — เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่บอตไม่ได้เป็นสมาชิก WhatsApp ไม่ใช้การป้องกันนี้: root `groups` และ root `direct` จะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp แบบหลายบัญชี หากคุณต้องการพรอมป์กลุ่มหรือพรอมป์โดยตรงแยกตามบัญชี ให้กำหนด map แบบครบถ้วนไว้ใต้แต่ละบัญชีอย่างชัดเจน แทนที่จะพึ่งค่าเริ่มต้นระดับ root

ลักษณะการทำงานสำคัญ:

- `channels.whatsapp.groups` เป็นทั้ง map การกำหนดค่าต่อกลุ่มและ allowlist ของกลุ่มระดับแชต ที่ขอบเขต root หรือบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุด ID กลุ่มแบบคงที่เท่านั้นที่มีสิทธิ์ใช้งานได้ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของพรอมป์ ให้ทำซ้ำพรอมป์ในแต่ละรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแทน
- การอนุญาตให้กลุ่มเข้าถึงและการอนุญาตผู้ส่งเป็นการตรวจสอบแยกกัน `groups["*"]` ขยายชุดของกลุ่มที่เข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นด้วยตัวเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ให้เฉพาะการกำหนดค่าแชตโดยตรงเริ่มต้น หลังจากที่ DM ได้รับอนุญาตแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎของ pairing-store

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

## ตัวชี้ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก:

- [ข้อมูลอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/config-channels#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การแทนที่ระดับบัญชี
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
