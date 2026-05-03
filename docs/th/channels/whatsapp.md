---
read_when:
    - การทำงานกับพฤติกรรมของช่องทาง WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่งมอบ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T10:10:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานในโปรดักชันผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่ลิงก์ไว้

## ติดตั้ง (เมื่อต้องการ)

- การเริ่มใช้งาน (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง Plugin WhatsApp ครั้งแรกที่คุณเลือกใช้งาน
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนการติดตั้งเมื่อ
  ยังไม่มี Plugin อยู่
- ช่องทาง Dev + git checkout: ค่าเริ่มต้นเป็นเส้นทาง Plugin ในเครื่อง
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` บนแท็กรีลีสทางการปัจจุบัน

การติดตั้งด้วยตนเองยังคงพร้อมใช้งาน:

```bash
openclaw plugins install @openclaw/whatsapp
```

ใช้แพ็กเกจแบบเปล่าเพื่อตามแท็กรีลีสทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอน
เฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและคู่มือซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางฉบับเต็ม
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

  <Step title="ลิงก์ WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    สำหรับบัญชีเฉพาะ:

```bash
openclaw channels login --channel whatsapp --account work
```

    หากต้องการแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่หรือกำหนดเองก่อนเข้าสู่ระบบ:

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

    คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp บนหมายเลขแยกเมื่อเป็นไปได้ (เมตาดาต้าช่องทางและขั้นตอนการตั้งค่าถูกปรับให้เหมาะกับการตั้งค่านั้น แต่การตั้งค่าด้วยหมายเลขส่วนตัวก็รองรับเช่นกัน)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะ (แนะนำ)">
    นี่คือโหมดปฏิบัติการที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกสำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการกำหนดเส้นทางที่ชัดเจนกว่า
    - โอกาสเกิดความสับสนจากการแชตกับตัวเองน้อยลง

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
    การเริ่มใช้งานรองรับโหมดหมายเลขส่วนตัวและเขียนค่าพื้นฐานที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` มีหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ระหว่างรัน การป้องกันการแชตกับตัวเองอิงจากหมายเลขตนเองที่ลิงก์ไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางเฉพาะ WhatsApp Web">
    ช่องทางแพลตฟอร์มการส่งข้อความอิงจาก WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทาง OpenClaw ปัจจุบัน

    ไม่มีช่องทางส่งข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรีช่องทางแชตในตัว

  </Accordion>
</AccordionGroup>

## โมเดลรันไทม์

- Gateway เป็นเจ้าของซ็อกเก็ต WhatsApp และลูปเชื่อมต่อใหม่
- ตัวเฝ้าดูการเชื่อมต่อใหม่ใช้กิจกรรมทรานสปอร์ตของ WhatsApp Web ไม่ใช่แค่ปริมาณข้อความแอปขาเข้า ดังนั้นเซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบจะไม่ถูกรีสตาร์ตเพียงเพราะไม่มีใครส่งข้อความเมื่อเร็วๆ นี้ ขีดจำกัดความเงียบระดับแอปที่ยาวขึ้นยังคงบังคับให้เชื่อมต่อใหม่หากเฟรมทรานสปอร์ตยังมาถึงแต่ไม่มีข้อความแอปถูกจัดการภายในช่วงเวลาของ watchdog หลังจากการเชื่อมต่อใหม่ชั่วคราวสำหรับเซสชันที่เพิ่งมีการใช้งาน การตรวจสอบความเงียบระดับแอปนั้นจะใช้ไทม์เอาต์ข้อความปกติสำหรับหน้าต่างการกู้คืนแรก
- เวลาของซ็อกเก็ต Baileys ระบุอย่างชัดเจนใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping ของแอปพลิเคชัน WhatsApp Web, `connectTimeoutMs` ควบคุมไทม์เอาต์แฮนด์เชกเริ่มต้น และ `defaultQueryTimeoutMs` ควบคุมไทม์เอาต์ query ของ Baileys
- การส่งขาออกต้องมี listener WhatsApp ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย
- การส่งในกลุ่มแนบเมตาดาต้า mention แบบ native สำหรับโทเค็น `@+<digits>` และ `@<digits>` ในข้อความและคำบรรยายสื่อ เมื่อโทเค็นตรงกับเมตาดาต้าผู้เข้าร่วม WhatsApp ปัจจุบัน รวมถึงกลุ่มที่อิง LID
- แชตสถานะและ broadcast จะถูกละเว้น (`@status`, `@broadcast`)
- ตัวเฝ้าดูการเชื่อมต่อใหม่ติดตามกิจกรรมทรานสปอร์ตของ WhatsApp Web ไม่ใช่แค่ปริมาณข้อความแอปขาเข้า: เซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบยังคงออนไลน์ขณะที่เฟรมทรานสปอร์ตยังดำเนินต่อ แต่ทรานสปอร์ตที่ค้างจะบังคับให้เชื่อมต่อใหม่ก่อนเส้นทางตัดการเชื่อมต่อระยะไกลที่มาทีหลังมาก
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM เข้าเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มถูกแยกไว้ (`agent:<agentId>:whatsapp:group:<jid>`)
- WhatsApp Channels/Newsletters สามารถเป็นเป้าหมายขาออกแบบชัดเจนด้วย JID `@newsletter` แบบ native ของตัวเอง การส่ง newsletter ขาออกใช้เมตาดาต้าเซสชันช่องทาง (`agent:<agentId>:whatsapp:channel:<jid>`) แทนความหมายแบบเซสชัน DM
- ทรานสปอร์ต WhatsApp Web เคารพตัวแปรสภาพแวดล้อมพร็อกซีมาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / ตัวแปรตัวพิมพ์เล็ก) ควรใช้การกำหนดค่าพร็อกซีระดับโฮสต์แทนการตั้งค่าพร็อกซี WhatsApp เฉพาะช่องทาง
- เมื่อเปิดใช้ `messages.removeAckAfterReply` OpenClaw จะล้างรีแอ็กชัน ack ของ WhatsApp หลังจากส่งคำตอบที่มองเห็นได้แล้ว

## hooks ของ Plugin และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนบุคคล หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์เชื่อมโยงเซสชัน ด้วยเหตุนี้
WhatsApp จึงไม่ broadcast เพย์โหลด hook `message_received` ขาเข้าไปยัง Plugin
เว้นแต่คุณจะเลือกเปิดใช้อย่างชัดเจน:

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

คุณสามารถจำกัดการเลือกเปิดใช้ไว้ที่บัญชีเดียว:

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

เปิดใช้งานสิ่งนี้เฉพาะสำหรับ Plugin ที่คุณไว้วางใจให้รับเนื้อหาและตัวระบุ
ข้อความ WhatsApp ขาเข้า

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (ปรับให้เป็นมาตรฐานภายใน)

    `allowFrom` คือรายการควบคุมการเข้าถึงของผู้ส่ง DM ไม่ได้กั้นการส่งขาออกแบบชัดเจนไปยัง JID กลุ่ม WhatsApp หรือ JID ช่องทาง `@newsletter`

    การ override หลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมรันไทม์:

    - การจับคู่ถูกคงไว้ใน allow-store ของช่องทางและรวมกับ `allowFrom` ที่กำหนดค่าไว้
    - ระบบอัตโนมัติตามกำหนดเวลาและ fallback ผู้รับ Heartbeat ใช้เป้าหมายการส่งที่ชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้ การอนุมัติการจับคู่ DM ไม่ได้เป็นผู้รับ Cron หรือ Heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist หมายเลขตนเองที่ลิงก์ไว้จะได้รับอนุญาตโดยค่าเริ่มต้น
    - OpenClaw ไม่จับคู่ DM `fromMe` ขาออกโดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่ลิงก์ไว้)

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlist">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละเว้น `groups` ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` อยู่ จะทำหน้าที่เป็น allowlist ของกลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้ากลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะ fallback ไปที่ `allowFrom` เมื่อมี
    - allowlist ผู้ส่งถูกประเมินก่อนการเปิดใช้งานด้วย mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย fallback นโยบายกลุ่มของรันไทม์คือ `allowlist` (พร้อมบันทึกคำเตือน) แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้องมี mention ตามค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention WhatsApp แบบชัดเจนของตัวตนบอท
    - รูปแบบ regex สำหรับ mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcript ของ voice-note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับ reply-to-bot โดยนัย (ผู้ส่งของ reply ตรงกับตัวตนบอท)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply ทำให้ผ่าน mention gating เท่านั้น แต่ **ไม่** ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่ได้อยู่ใน allowlist จะยังคงถูกบล็อก แม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่ config ส่วนกลาง) และถูกจำกัดไว้สำหรับเจ้าของ

  </Tab>
</Tabs>

## พฤติกรรมหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขตนเองที่ลิงก์ไว้มีอยู่ใน `allowFrom` ด้วย การป้องกันการแชตกับตัวเองของ WhatsApp จะทำงาน:

- ข้ามใบตอบรับการอ่านสำหรับรอบการแชตกับตัวเอง
- ละเว้นพฤติกรรม auto-trigger ของ mention-JID ที่มิฉะนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` การตอบกลับแชตกับตัวเองจะตั้งค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การทำให้ข้อความเป็นมาตรฐานและบริบท

<AccordionGroup>
  <Accordion title="envelope ขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อใน envelope ขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับที่ quote ไว้ บริบทจะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมตาดาต้าการตอบกลับจะถูกเติมเมื่อมีด้วย (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 ของผู้ส่ง)
    เมื่อเป้าหมายการตอบกลับที่ quote ไว้เป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    ที่เก็บสื่อขาเข้าปกติและเปิดเผยเป็น `MediaPath`/`MediaType` เพื่อให้
    เอเจนต์ตรวจสอบรูปภาพที่อ้างอิงแทนที่จะเห็นเพียง
    `<media:image>`

  </Accordion>

  <Accordion title="ตัวยึดตำแหน่งสื่อและการแยกตำแหน่งที่ตั้ง/ผู้ติดต่อ">
    ข้อความขาเข้าที่มีเฉพาะสื่อถูกทำให้เป็นมาตรฐานด้วยตัวยึดตำแหน่ง เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice note ของกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อน mention gating เมื่อ
    body เป็นเพียง `<media:audio>` ดังนั้นการพูด mention ของบอทใน voice note จึงสามารถ
    เรียกให้ตอบกลับได้ หาก transcript ยังไม่ mention บอท
    transcript จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทนตัวยึดตำแหน่งดิบ

    body ของตำแหน่งที่ตั้งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งที่ตั้งและรายละเอียดผู้ติดต่อ/vCard ถูกแสดงเป็นเมตาดาต้าที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="การแทรกประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูกบัฟเฟอร์และแทรกเป็นบริบทเมื่อบอทถูกเรียกใช้งานในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    เครื่องหมายการแทรก:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="ใบตอบรับการอ่าน">
    ใบตอบรับการอ่านถูกเปิดใช้งานโดยค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ยอมรับ

    ปิดใช้งานแบบส่วนกลาง:

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

    เทิร์นแชตกับตัวเองจะข้ามใบตอบรับการอ่าน แม้จะเปิดใช้แบบรวมทั้งระบบก็ตาม

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่งชิ้น และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความเป็นชิ้น">
    - ขีดจำกัดชิ้นข้อความเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน แล้วจึงถอยกลับไปใช้การแบ่งชิ้นตามความยาวอย่างปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดรูปภาพ วิดีโอ เสียง (โน้ตเสียงแบบ PTT) และเอกสาร
    - สื่อเสียงจะถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` ดังนั้นไคลเอนต์ WhatsApp จะแสดงเป็นโน้ตเสียงแบบกดเพื่อพูด
    - เพย์โหลดการตอบกลับจะคง `audioAsVoice` ไว้; เอาต์พุตโน้ตเสียง TTS สำหรับ WhatsApp จะยังอยู่บนเส้นทาง PTT นี้ แม้ผู้ให้บริการจะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบเนทีฟจะถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับโน้ตเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต Microsoft Edge TTS แบบ MP3/WebM จะถูกแปลงด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของผู้ช่วยเป็นโน้ตเสียงหนึ่งรายการและระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม TTS อัตโนมัติสำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อแรกเมื่อส่งเพย์โหลดตอบกลับหลายสื่อ ยกเว้นโน้ตเสียง PTT จะส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายโน้ตเสียงไม่สม่ำเสมอ
    - แหล่งสื่ออาจเป็น HTTP(S), `file://` หรือพาธในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมสำรอง">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การเขียนทับต่อบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมโดยอัตโนมัติ (ปรับขนาด/กวาดคุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - เมื่อส่งสื่อล้มเหลว การสำรองสำหรับรายการแรกจะส่งข้อความเตือนแทนการทิ้งการตอบกลับอย่างเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างข้อความตอบกลับ

WhatsApp รองรับการอ้างข้อความตอบกลับแบบเนทีฟ ซึ่งคำตอบขาออกจะอ้างข้อความขาเข้าให้เห็นได้ ควบคุมด้วย `channels.whatsapp.replyToMode`

| ค่า         | พฤติกรรม                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างเลย; ส่งเป็นข้อความธรรมดา                                      |
| `"first"`   | อ้างเฉพาะชิ้นคำตอบขาออกชิ้นแรก                                       |
| `"all"`     | อ้างทุกชิ้นคำตอบขาออก                                                 |
| `"batched"` | อ้างคำตอบแบบชุดที่อยู่ในคิว โดยปล่อยให้คำตอบทันทีไม่ถูกอ้าง          |

ค่าเริ่มต้นคือ `"off"` การเขียนทับต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

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

`channels.whatsapp.reactionLevel` ควบคุมว่าเอเจนต์ใช้รีแอ็กชันอีโมจิบน WhatsApp กว้างแค่ไหน:

| ระดับ          | รีแอ็กชันยืนยันรับ | รีแอ็กชันที่เอเจนต์เริ่มเอง | คำอธิบาย                                             |
| -------------- | ------------------ | ----------------------------- | ----------------------------------------------------- |
| `"off"`        | ไม่                 | ไม่                            | ไม่มีรีแอ็กชันเลย                                    |
| `"ack"`        | ใช่                | ไม่                            | เฉพาะรีแอ็กชันยืนยันรับ (ใบรับก่อนตอบกลับ)          |
| `"minimal"`    | ใช่                | ใช่ (แบบระมัดระวัง)           | ยืนยันรับ + รีแอ็กชันจากเอเจนต์พร้อมแนวทางระมัดระวัง |
| `"extensive"`  | ใช่                | ใช่ (สนับสนุนให้ใช้)          | ยืนยันรับ + รีแอ็กชันจากเอเจนต์พร้อมแนวทางสนับสนุน  |

ค่าเริ่มต้น: `"minimal"`

การเขียนทับต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## รีแอ็กชันยืนยันรับ

WhatsApp รองรับรีแอ็กชันยืนยันรับทันทีเมื่อได้รับขาเข้าผ่าน `channels.whatsapp.ackReaction`
รีแอ็กชันยืนยันรับถูกควบคุมด้วย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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

- ส่งทันทีหลังจากยอมรับขาเข้าแล้ว (ก่อนตอบกลับ)
- ความล้มเหลวจะถูกบันทึก แต่ไม่ขัดขวางการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะรีแอ็กต์ในเทิร์นที่ถูกกระตุ้นจากการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นทางลัดข้ามการตรวจนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ได้ใช้ `messages.ackReaction` รุ่นเดิมที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - รหัสบัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมีอยู่ มิฉะนั้นใช้รหัสบัญชีที่กำหนดค่าไว้รายการแรก (เรียงลำดับแล้ว)
    - รหัสบัญชีถูกทำให้เป็นรูปแบบมาตรฐานภายในเพื่อใช้ค้นหา

  </Accordion>

  <Accordion title="พาธข้อมูลรับรองและความเข้ากันได้กับรุ่นเดิม">
    - พาธยืนยันตัวตนปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - การยืนยันตัวตนเริ่มต้นรุ่นเดิมใน `~/.openclaw/credentials/` ยังถูกจดจำ/ย้ายสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรมออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะการยืนยันตัวตน WhatsApp สำหรับบัญชีนั้น

    เมื่อเข้าถึง Gateway ได้ การออกจากระบบจะหยุดตัวฟัง WhatsApp สดสำหรับบัญชีที่เลือกก่อน เพื่อไม่ให้เซสชันที่เชื่อมโยงไว้รับข้อความต่อไปจนกว่าจะรีสตาร์ตครั้งถัดไป `openclaw channels remove --channel whatsapp` จะหยุดตัวฟังสดก่อนปิดใช้งานหรือลบการกำหนดค่าบัญชีเช่นกัน

    ในไดเรกทอรียืนยันตัวตนรุ่นเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ยืนยันตัวตนของ Baileys จะถูกลบออก

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนค่ากำหนด

- การรองรับเครื่องมือของเอเจนต์รวมถึงการกระทำรีแอ็กชันของ WhatsApp (`react`)
- เกตการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนค่ากำหนดที่เริ่มจากแชนเนลเปิดใช้ตามค่าเริ่มต้น (ปิดผ่าน `channels.whatsapp.configWrites=false`)

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

  <Accordion title="เชื่อมโยงแล้วแต่ตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่เชื่อมโยงแล้วมีการตัดการเชื่อมต่อหรือพยายามเชื่อมต่อใหม่ซ้ำ ๆ

    บัญชีที่เงียบสามารถคงการเชื่อมต่อไว้เกินเวลาหมดอายุข้อความปกติได้; ตัวเฝ้าระวัง
    จะรีสตาร์ตเมื่อกิจกรรมการขนส่งของ WhatsApp Web หยุดลง ซ็อกเก็ตปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินช่วงเวลาความปลอดภัยที่ยาวกว่า

    หากล็อกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ๆ ให้ปรับ
    เวลาของซ็อกเก็ต Baileys ใต้ `web.whatsapp` เริ่มด้วยการลด
    `keepAliveIntervalMs` ให้ต่ำกว่าเวลาหมดอายุเมื่อไม่ได้ใช้งานของเครือข่ายคุณ และเพิ่ม
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
    Gateway และ WhatsApp ปกติดี ให้รัน `openclaw doctor` บน Linux คำสั่ง doctor
    จะเตือนเกี่ยวกับรายการ crontab รุ่นเดิมที่ยังเรียกใช้
    `~/.openclaw/bin/ensure-whatsapp.sh`; ลบรายการเก่าค้างเหล่านั้นด้วย
    `crontab -e` เพราะ cron อาจไม่มีสภาพแวดล้อม systemd user-bus และ
    ทำให้สคริปต์เก่านั้นรายงานสุขภาพ Gateway ผิดพลาด

    หากจำเป็น ให้เชื่อมโยงใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบด้วย QR หมดเวลาหลังพร็อกซี">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงรหัส QR ที่ใช้งานได้ พร้อม `status=408 Request Time-out` หรือซ็อกเก็ต TLS ตัดการเชื่อมต่อ

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อมพร็อกซีมาตรฐานของโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, ตัวแปรตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่ากระบวนการ Gateway รับช่วง env พร็อกซี และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มีตัวฟังที่ใช้งานอยู่เมื่อส่ง">
    การส่งขาออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มีตัวฟัง Gateway ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานและบัญชีเชื่อมโยงแล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏในทรานสคริปต์แต่ไม่อยู่ใน WhatsApp">
    แถวทรานสคริปต์บันทึกสิ่งที่เอเจนต์สร้างขึ้น การส่งผ่าน WhatsApp ถูกตรวจแยกต่างหาก: OpenClaw ถือว่าการตอบกลับอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืนรหัสข้อความขาออกสำหรับการส่งข้อความที่มองเห็นได้หรือสื่ออย่างน้อยหนึ่งรายการ

    รีแอ็กชันยืนยันรับเป็นใบรับก่อนตอบกลับที่เป็นอิสระต่อกัน รีแอ็กชันที่สำเร็จไม่ได้พิสูจน์ว่าคำตอบข้อความหรือสื่อภายหลังถูก WhatsApp ยอมรับ

    ตรวจล็อก Gateway สำหรับ `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการอนุญาต `groups`
    - เกตการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการภายหลังจะเขียนทับรายการก่อนหน้า ดังนั้นให้มี `groupPolicy` รายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ Gateway ของ WhatsApp ควรใช้ Node Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงาน Gateway ของ WhatsApp/Telegram ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมป์ระบบ

WhatsApp รองรับพรอมป์ระบบแบบ Telegram สำหรับกลุ่มและแชตตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการแก้ค่าของข้อความกลุ่ม:

แมป `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตัวเองไว้ จะใช้แทนแมป `groups` ระดับรากทั้งหมด (ไม่มีการผสานลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อมีรายการกลุ่มนั้นอยู่ในแมป **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) ไวลด์การ์ดจะถูกระงับและไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบไวลด์การ์ดของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มนั้นในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ค่าของข้อความตรง:

แมป `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตัวเองไว้ จะใช้แทนแมป `direct` ระดับรากทั้งหมด (ไม่มีการผสานลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะข้อความตรง** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมีรายการเพียร์นั้นอยู่ในแมป **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) ไวลด์การ์ดจะถูกระงับและไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบไวลด์การ์ดของข้อความตรง** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเพียร์นั้นในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบักเก็ตการเขียนทับประวัติต่อ DM แบบเบา (`dms.<id>.historyLimit`) การเขียนทับพรอมป์อยู่ใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram `groups` ที่ระดับรากจะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตนเอง เพื่อป้องกันไม่ให้บอทได้รับข้อความกลุ่มจากกลุ่มที่บอทไม่ได้เป็นสมาชิก WhatsApp ไม่ใช้การป้องกันนี้: `groups` ที่ระดับรากและ `direct` ที่ระดับรากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp หลายบัญชี หากคุณต้องการพรอมป์กลุ่มหรือพรอมป์โดยตรงแยกตามบัญชี ให้กำหนดแมปทั้งหมดไว้ใต้แต่ละบัญชีอย่างชัดเจน แทนที่จะพึ่งพาค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปการกำหนดค่ารายกลุ่มและรายการอนุญาตกลุ่มระดับแชต ที่ขอบเขตรากหรือขอบเขตบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุดรหัสกลุ่มที่กำหนดไว้เท่านั้นที่มีสิทธิ์ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของพรอมป์ ให้ทำซ้ำพรอมป์ในแต่ละรายการกลุ่มที่อนุญาตไว้อย่างชัดเจนแทน
- การรับกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบคนละส่วนกัน `groups["*"]` ขยายชุดของกลุ่มที่สามารถเข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นด้วยตัวเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับข้อความส่วนตัว `direct["*"]` ให้เฉพาะการกำหนดค่าเริ่มต้นของแชตโดยตรงหลังจากข้อความส่วนตัวได้รับอนุญาตแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎของที่เก็บการจับคู่

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

ฟิลด์ WhatsApp ที่มีสัญญาณสำคัญสูง:

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
