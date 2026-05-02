---
read_when:
    - การทำงานกับพฤติกรรมช่องทาง WhatsApp/เว็บ หรือการกำหนดเส้นทางกล่องขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการนำส่ง และการปฏิบัติการ
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys). Gateway เป็นเจ้าของเซสชันที่ลิงก์ไว้

## ติดตั้ง (ตามต้องการ)

- การเริ่มต้นใช้งาน (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง WhatsApp Plugin ครั้งแรกที่คุณเลือก
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนการติดตั้งเมื่อ
  ยังไม่มี Plugin อยู่ด้วย
- ช่องทาง dev + git checkout: ใช้ค่าเริ่มต้นเป็นพาธ Plugin ภายในเครื่อง
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` บนแท็ก release ทางการ
  ปัจจุบัน

การติดตั้งด้วยตนเองยังคงใช้งานได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

ใช้แพ็กเกจแบบไม่ระบุเวอร์ชันเพื่อติดตามแท็ก release ทางการปัจจุบัน ปักหมุด
เวอร์ชันแบบเจาะจงเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM ค่าเริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    คู่มือวินิจฉัยและซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

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

    หากต้องการแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่/กำหนดเองก่อนเข้าสู่ระบบ:

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

    คำขอจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp บนหมายเลขแยกต่างหากเมื่อทำได้ (เมทาดาทาช่องทางและขั้นตอนการตั้งค่าได้รับการปรับให้เหมาะกับการตั้งค่านี้ แต่การตั้งค่าด้วยหมายเลขส่วนตัวก็รองรับเช่นกัน)
</Note>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะ (แนะนำ)">
    นี่คือโหมดการทำงานที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - รายการอนุญาต DM และขอบเขตการกำหนดเส้นทางที่ชัดเจนขึ้น
    - โอกาสสับสนจากการแชตกับตัวเองต่ำลง

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

  <Accordion title="ทางสำรองสำหรับหมายเลขส่วนตัว">
    การเริ่มต้นใช้งานรองรับโหมดหมายเลขส่วนตัวและเขียนค่าพื้นฐานที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ขณะรัน การป้องกันแชตกับตัวเองจะอิงจากหมายเลขตัวเองที่ลิงก์ไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางเฉพาะ WhatsApp Web">
    ช่องทางแพลตฟอร์มรับส่งข้อความอิงตาม WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทาง OpenClaw ปัจจุบัน

    ไม่มีช่องทางรับส่งข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรีช่องทางแชตในตัว

  </Accordion>
</AccordionGroup>

## โมเดลขณะรัน

- Gateway เป็นเจ้าของซ็อกเก็ต WhatsApp และลูปเชื่อมต่อใหม่
- ตัวเฝ้าระวังการเชื่อมต่อใหม่ใช้กิจกรรมขนส่งของ WhatsApp Web ไม่ใช่เพียงปริมาณข้อความแอปขาเข้า ดังนั้นเซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบอยู่จะไม่ถูกรีสตาร์ทเพียงเพราะไม่มีใครส่งข้อความมาเมื่อเร็ว ๆ นี้ ขีดจำกัดความเงียบของแอปพลิเคชันที่ยาวกว่ายังคงบังคับให้เชื่อมต่อใหม่หากเฟรมขนส่งยังมาถึงแต่ไม่มีข้อความแอปพลิเคชันถูกจัดการภายในหน้าต่างเวลาของตัวเฝ้าระวัง หลังจากการเชื่อมต่อใหม่ชั่วคราวสำหรับเซสชันที่เพิ่งใช้งาน การตรวจความเงียบของแอปพลิเคชันนั้นจะใช้ timeout ข้อความปกติสำหรับหน้าต่างการกู้คืนแรก
- เวลาของซ็อกเก็ต Baileys ระบุอย่างชัดเจนใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping แอปพลิเคชันของ WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ handshake เปิดการเชื่อมต่อ และ `defaultQueryTimeoutMs` ควบคุม timeout ของ query Baileys
- การส่งขาออกต้องมี listener WhatsApp ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย
- แชตสถานะและแชต broadcast จะถูกละเว้น (`@status`, `@broadcast`)
- ตัวเฝ้าระวังการเชื่อมต่อใหม่ติดตามกิจกรรมขนส่งของ WhatsApp Web ไม่ใช่เพียงปริมาณข้อความแอปขาเข้า: เซสชันอุปกรณ์ที่ลิงก์ไว้ซึ่งเงียบอยู่จะยังคงทำงานตราบใดที่เฟรมขนส่งยังดำเนินต่อไป แต่การหยุดชะงักของขนส่งจะบังคับให้เชื่อมต่อใหม่ก่อนเส้นทางตัดการเชื่อมต่อระยะไกลที่เกิดภายหลังมาก
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM เข้ากับเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- WhatsApp Channels/Newsletters สามารถเป็นเป้าหมายขาออกแบบชัดเจนด้วย JID `@newsletter` ดั้งเดิม การส่ง newsletter ขาออกใช้เมทาดาทาเซสชันช่องทาง (`agent:<agentId>:whatsapp:channel:<jid>`) แทนความหมายของเซสชัน DM
- ขนส่ง WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / รูปแบบตัวพิมพ์เล็ก) ควรใช้การกำหนดค่า proxy ระดับโฮสต์แทนการตั้งค่า proxy ของ WhatsApp เฉพาะช่องทาง
- เมื่อเปิดใช้ `messages.removeAckAfterReply` OpenClaw จะล้างรีแอ็กชัน ack ของ WhatsApp หลังจากส่งคำตอบที่มองเห็นได้แล้ว

## hook ของ Plugin และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนตัว หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์เชื่อมโยงเซสชัน ด้วยเหตุนี้
WhatsApp จึงไม่ broadcast payload ของ hook `message_received` ขาเข้าไปยัง Plugins
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

คุณสามารถจำกัดขอบเขตการเลือกเปิดใช้นี้ให้กับบัญชีเดียว:

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

เปิดใช้สิ่งนี้เฉพาะสำหรับ Plugins ที่คุณไว้วางใจให้รับเนื้อหาและตัวระบุ
ข้อความ WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (ทำให้เป็นมาตรฐานภายใน)

    `allowFrom` เป็นรายการควบคุมการเข้าถึงผู้ส่ง DM ไม่ได้กั้นการส่งขาออกแบบชัดเจนไปยัง JID กลุ่ม WhatsApp หรือ JID ช่องทาง `@newsletter`

    การ override แบบหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมขณะรัน:

    - การจับคู่ถูกเก็บถาวรใน allow-store ของช่องทางและผสานกับ `allowFrom` ที่กำหนดค่าไว้
    - ระบบอัตโนมัติตามกำหนดเวลาและปลายทางรับ Heartbeat สำรองใช้เป้าหมายการส่งแบบชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้ การอนุมัติการจับคู่ DM ไม่ใช่ผู้รับ Cron หรือ Heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist หมายเลขตัวเองที่ลิงก์ไว้จะได้รับอนุญาตตามค่าเริ่มต้น
    - OpenClaw จะไม่จับคู่ DM ขาออก `fromMe` โดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่ลิงก์ไว้)

  </Tab>

  <Tab title="นโยบายกลุ่ม + รายการอนุญาต">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **รายการอนุญาตสมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละ `groups` ไว้ ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` จะทำหน้าที่เป็นรายการอนุญาตกลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้ามรายการอนุญาตผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้าของกลุ่มทั้งหมด

    fallback ของรายการอนุญาตผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` ขณะรันจะ fallback ไปยัง `allowFrom` เมื่อมี
    - รายการอนุญาตผู้ส่งจะถูกประเมินก่อนการเปิดใช้งานด้วยการกล่าวถึง/การตอบกลับ

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย fallback ของนโยบายกลุ่มขณะรันคือ `allowlist` (พร้อม log คำเตือน) แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="การกล่าวถึง + /activation">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงตามค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงตัวตนบอตใน WhatsApp อย่างชัดเจน
    - รูปแบบ regex การกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcript ของ voice note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับการตอบกลับถึงบอตโดยนัย (ผู้ส่งที่ถูกตอบกลับตรงกับตัวตนบอต)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply ตอบสนองเฉพาะเงื่อนไขการกล่าวถึงเท่านั้น แต่ **ไม่ได้** ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ในรายการอนุญาตยังคงถูกบล็อกแม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ในรายการอนุญาต

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่ config ส่วนกลาง) และถูกจำกัดด้วยเจ้าของ

  </Tab>
</Tabs>

## พฤติกรรมหมายเลขส่วนตัวและแชตกับตัวเอง

เมื่อหมายเลขตัวเองที่ลิงก์ไว้มีอยู่ใน `allowFrom` ด้วย การป้องกันแชตกับตัวเองของ WhatsApp จะทำงาน:

- ข้ามใบตอบรับการอ่านสำหรับรอบแชตกับตัวเอง
- ละเว้นพฤติกรรมทริกเกอร์อัตโนมัติของ mention-JID ที่ไม่เช่นนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` คำตอบแชตกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การทำให้ข้อความเป็นมาตรฐานและบริบท

<AccordionGroup>
  <Accordion title="ซองขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าถูกครอบในซองขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับที่ quote ไว้ บริบทจะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมทาดาทาการตอบกลับจะถูกเติมเมื่อมีด้วย (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 ของผู้ส่ง)
    เมื่อเป้าหมายการตอบกลับที่ quote ไว้เป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    store สื่อขาเข้าปกติและเปิดเผยเป็น `MediaPath`/`MediaType` เพื่อให้
    เอเจนต์ตรวจสอบรูปภาพที่อ้างอิงได้ แทนที่จะเห็นเพียง
    `<media:image>`

  </Accordion>

  <Accordion title="ข้อความแทนสื่อและการแยกข้อมูลตำแหน่ง/ผู้ติดต่อ">
    ข้อความขาเข้าที่มีเฉพาะสื่อถูกทำให้เป็นมาตรฐานด้วยข้อความแทน เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice note ของกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อนเงื่อนไขการกล่าวถึงเมื่อ
    เนื้อความมีเพียง `<media:audio>` ดังนั้นการพูดกล่าวถึงบอตใน voice note จึงสามารถ
    ทริกเกอร์การตอบกลับได้ หาก transcript ยังไม่กล่าวถึงบอต
    transcript จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทน placeholder ดิบ

    เนื้อความตำแหน่งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียดผู้ติดต่อ/vCard จะแสดงเป็นเมทาดาทาที่ไม่น่าเชื่อถือในบล็อกที่ครอบไว้ ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="การฉีดประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ประมวลผลสามารถถูกบัฟเฟอร์และฉีดเป็นบริบทเมื่อบอตถูกทริกเกอร์ในที่สุด

    - ขีดจำกัดค่าเริ่มต้น: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    marker การฉีด:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="ใบตอบรับการอ่าน">
    ใบตอบรับการอ่านเปิดใช้งานตามค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่รับไว้

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

    รอบการสนทนากับตนเองจะข้ามใบตอบรับการอ่าน แม้จะเปิดใช้ไว้ในระดับส่วนกลางก็ตาม

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่งส่วน และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความเป็นส่วน">
    - ขีดจำกัดการแบ่งส่วนเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะเลือกขอบเขตย่อหน้าเป็นอันดับแรก (บรรทัดว่าง) แล้วจึงถอยกลับไปใช้การแบ่งส่วนตามความยาวที่ปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับเพย์โหลดรูปภาพ วิดีโอ เสียง (โน้ตเสียง PTT) และเอกสาร
    - สื่อเสียงจะถูกส่งผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` ดังนั้นไคลเอนต์ WhatsApp จะแสดงเป็นโน้ตเสียงแบบกดเพื่อพูด
    - เพย์โหลดการตอบกลับจะคง `audioAsVoice` ไว้; เอาต์พุตโน้ตเสียง TTS สำหรับ WhatsApp จะยังอยู่บนเส้นทาง PTT นี้ แม้ผู้ให้บริการจะส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบเนทีฟจะถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับโน้ตเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต Microsoft Edge TTS MP3/WebM จะถูกแปลงรหัสด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของผู้ช่วยเป็นโน้ตเสียงหนึ่งรายการและระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม auto-TTS สำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อแรกเมื่อส่งเพย์โหลดตอบกลับแบบหลายสื่อ ยกเว้นโน้ตเสียง PTT ที่จะส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp ไม่แสดงคำบรรยายโน้ตเสียงอย่างสม่ำเสมอ
    - แหล่งสื่อสามารถเป็น HTTP(S), `file://` หรือพาธในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรมสำรอง">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่รายบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้พอดีกับขีดจำกัด
    - เมื่อส่งสื่อล้มเหลว ระบบสำรองสำหรับรายการแรกจะส่งคำเตือนเป็นข้อความแทนการทิ้งคำตอบอย่างเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างอิงในการตอบกลับ

WhatsApp รองรับการอ้างอิงการตอบกลับแบบเนทีฟ โดยคำตอบขาออกจะอ้างถึงข้อความขาเข้าให้เห็น ควบคุมด้วย `channels.whatsapp.replyToMode`

| ค่า       | พฤติกรรม                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                  |
| `"first"`   | อ้างอิงเฉพาะส่วนแรกของคำตอบขาออก                             |
| `"all"`     | อ้างอิงทุกส่วนของคำตอบขาออก                                      |
| `"batched"` | อ้างอิงคำตอบแบบแบตช์ที่เข้าคิวไว้ โดยปล่อยให้คำตอบทันทีไม่ถูกอ้างอิง |

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

## ระดับ Reaction

`channels.whatsapp.reactionLevel` ควบคุมขอบเขตที่ Agent ใช้ Reaction อีโมจิบน WhatsApp:

| ระดับ         | Reaction รับทราบ | Reaction ที่ Agent เริ่มเอง | คำอธิบาย                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่            | ไม่                        | ไม่มี Reaction เลย                              |
| `"ack"`       | ใช่           | ไม่                        | เฉพาะ Reaction รับทราบ (ใบตอบรับก่อนตอบกลับ)           |
| `"minimal"`   | ใช่           | ใช่ (ระมัดระวัง)        | Reaction รับทราบ + Reaction ของ Agent พร้อมคำแนะนำแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (สนับสนุนให้ใช้)          | Reaction รับทราบ + Reaction ของ Agent พร้อมคำแนะนำที่สนับสนุนให้ใช้   |

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

## Reaction รับทราบ

WhatsApp รองรับ Reaction รับทราบทันทีเมื่อได้รับข้อความขาเข้า ผ่าน `channels.whatsapp.ackReaction`
Reaction รับทราบถูกควบคุมโดย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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

- ส่งทันทีหลังจากยอมรับข้อความขาเข้าแล้ว (ก่อนตอบกลับ)
- ความล้มเหลวจะถูกบันทึกใน log แต่ไม่บล็อกการส่งคำตอบปกติ
- โหมดกลุ่ม `mentions` จะ Reaction ในรอบที่ถูกทริกเกอร์ด้วยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นการข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ได้ใช้ `messages.ackReaction` แบบเดิมที่นี่)

## หลายบัญชีและข้อมูลประจำตัว

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - รหัสบัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมีอยู่ มิฉะนั้นใช้รหัสบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
    - รหัสบัญชีจะถูกปรับให้อยู่ในรูปแบบมาตรฐานภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="พาธข้อมูลประจำตัวและความเข้ากันได้แบบเดิม">
    - พาธ auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth เริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังถูกรู้จัก/ย้ายสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรม Logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    เมื่อเข้าถึง Gateway ได้ logout จะหยุด listener WhatsApp สดสำหรับบัญชีที่เลือกก่อน เพื่อให้ session ที่เชื่อมไว้ไม่รับข้อความต่อไปจนกว่าจะ restart ครั้งถัดไป `openclaw channels remove --channel whatsapp` ยังหยุด listener สดก่อนปิดใช้หรือลบการกำหนดค่าบัญชีด้วย

    ในไดเรกทอรี auth แบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์ auth ของ Baileys จะถูกลบ

  </Accordion>
</AccordionGroup>

## เครื่องมือ Action และการเขียน config

- การรองรับเครื่องมือของ Agent รวมถึง Action Reaction ของ WhatsApp (`react`)
- เกต Action:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียน config ที่เริ่มจาก Channel เปิดใช้โดยค่าเริ่มต้น (ปิดใช้ผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่ได้เชื่อมโยง (ต้องใช้ QR)">
    อาการ: สถานะ Channel รายงานว่ายังไม่ได้เชื่อมโยง

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมโยงแล้วแต่ตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่เชื่อมโยงแล้วมีการตัดการเชื่อมต่อซ้ำหรือพยายามเชื่อมต่อใหม่ซ้ำ

    บัญชีที่เงียบสามารถคงการเชื่อมต่อไว้เกิน timeout ข้อความปกติได้; watchdog
    จะ restart เมื่อกิจกรรมทรานสปอร์ต WhatsApp Web หยุดลง socket ปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบนานเกินกรอบความปลอดภัยที่ยาวขึ้น

    หาก log แสดง `status=408 Request Time-out Connection was lost` ซ้ำ ให้ปรับ
    เวลาของ socket Baileys ภายใต้ `web.whatsapp` เริ่มจากการลด
    `keepAliveIntervalMs` ให้ต่ำกว่า idle timeout ของเครือข่าย และเพิ่ม
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
    Gateway และ WhatsApp สุขภาพดี ให้รัน `openclaw doctor` บน Linux doctor
    จะเตือนเกี่ยวกับรายการ crontab แบบเดิมที่ยังเรียกใช้
    `~/.openclaw/bin/ensure-whatsapp.sh`; ลบรายการเก่าเหล่านั้นด้วย
    `crontab -e` เพราะ cron อาจไม่มี environment ของ systemd user-bus และ
    ทำให้สคริปต์เก่านั้นรายงานสุขภาพ Gateway ผิดพลาด

    หากจำเป็น ให้เชื่อมโยงใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบ QR timeout เมื่ออยู่หลัง proxy">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงรหัส QR ที่ใช้ได้ พร้อม `status=408 Request Time-out` หรือ TLS socket ตัดการเชื่อมต่อ

    การเข้าสู่ระบบ WhatsApp Web ใช้ environment proxy มาตรฐานของโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, รูปแบบตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่า process ของ Gateway สืบทอด proxy env และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ใช้งานอยู่เมื่อส่ง">
    การส่งขาออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มี gateway listener ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานและบัญชีถูกเชื่อมโยงแล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏใน transcript แต่ไม่อยู่ใน WhatsApp">
    แถว transcript บันทึกสิ่งที่ Agent สร้างขึ้น การส่งผ่าน WhatsApp จะถูกตรวจแยกต่างหาก: OpenClaw จะถือว่า auto-reply ถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืนรหัสข้อความขาออกสำหรับการส่งข้อความที่มองเห็นได้หรือสื่ออย่างน้อยหนึ่งรายการ

    Reaction รับทราบเป็นใบตอบรับก่อนตอบกลับที่เป็นอิสระจากกัน Reaction ที่สำเร็จไม่ได้พิสูจน์ว่าข้อความหรือสื่อที่ตอบกลับภายหลังได้รับการยอมรับโดย WhatsApp

    ตรวจ log ของ Gateway สำหรับ `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ของ `groups`
    - การควบคุมด้วยการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการภายหลังจะเขียนทับรายการก่อนหน้า ดังนั้นให้คง `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือน runtime ของ Bun">
    runtime ของ WhatsApp Gateway ควรใช้ Node Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงานของ WhatsApp/Telegram Gateway ที่เสถียร
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp รองรับ system prompt แบบ Telegram สำหรับกลุ่มและแชตโดยตรงผ่าน map `groups` และ `direct`

ลำดับการตัดสินค่าสำหรับข้อความกลุ่ม:

map `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตนเองไว้ จะใช้แทน map `groups` ที่ root ทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบน map เดี่ยวที่ได้:

1. **System prompt เฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ใน map **และ** คีย์ `systemPrompt` ถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้ system prompt
2. **System prompt wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะไม่มีอยู่ใน map ทั้งหมด หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับการตัดสินค่าสำหรับข้อความโดยตรง:

map `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตนเองไว้ จะใช้แทน map `direct` ที่ root ทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบน map เดี่ยวที่ได้:

1. **System prompt เฉพาะ direct** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อรายการ peer เฉพาะมีอยู่ใน map **และ** คีย์ `systemPrompt` ถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้ system prompt
2. **System prompt wildcard ของ direct** (`direct["*"].systemPrompt`): ใช้เมื่อรายการ peer เฉพาะไม่มีอยู่ใน map ทั้งหมด หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบัคเก็ต override ประวัติแบบเบาสำหรับแต่ละ DM (`dms.<id>.historyLimit`) override ของ prompt อยู่ภายใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ค่า `groups` ระดับรูทจะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในการตั้งค่าแบบหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่ไม่ได้เป็นสมาชิกอยู่ WhatsApp ไม่ใช้การป้องกันนี้: `groups` ระดับรูทและ `direct` ระดับรูทจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนดการแทนที่ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่าบัญชีไว้กี่บัญชีก็ตาม ในการตั้งค่า WhatsApp แบบหลายบัญชี หากคุณต้องการพรอมป์กลุ่มหรือพรอมป์โดยตรงแยกตามบัญชี ให้กำหนดแผนที่เต็มรูปแบบใต้แต่ละบัญชีอย่างชัดเจน แทนที่จะพึ่งพาค่าเริ่มต้นระดับรูท

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแผนที่การกำหนดค่าต่อกลุ่มและรายการอนุญาตกลุ่มระดับแชต ที่ขอบเขตระดับรูทหรือระดับบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่มเข้ามา" สำหรับขอบเขตนั้น
- เพิ่ม `systemPrompt` ของกลุ่มแบบไวลด์การ์ดเฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มเข้ามาอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุด ID กลุ่มแบบตายตัวที่มีสิทธิ์ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของพรอมป์ ให้ทำซ้ำพรอมป์ในแต่ละรายการกลุ่มที่อยู่ในรายการอนุญาตอย่างชัดเจนแทน
- การอนุญาตให้กลุ่มเข้ามาและการอนุญาตผู้ส่งเป็นการตรวจสอบแยกกัน `groups["*"]` ขยายชุดของกลุ่มที่เข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นด้วยตัวเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับข้อความส่วนตัว `direct["*"]` ให้เพียงการกำหนดค่าแชตโดยตรงเริ่มต้นหลังจากที่ข้อความส่วนตัวได้รับอนุญาตเข้ามาแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎใน pairing-store

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
- พฤติกรรมเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- พรอมป์: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
