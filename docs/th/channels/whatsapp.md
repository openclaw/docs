---
read_when:
    - การทำงานเกี่ยวกับพฤติกรรมของช่องทาง WhatsApp/web หรือการกำหนดเส้นทางกล่องขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่งมอบ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:14:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่ลิงก์

## ติดตั้ง (เมื่อต้องการ)

- Onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง WhatsApp plugin เมื่อคุณเลือกใช้งานครั้งแรก
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนติดตั้งเมื่อ
  ยังไม่มี plugin อยู่
- ช่อง Dev + git checkout: ใช้ค่าเริ่มต้นเป็นพาธ plugin ภายในเครื่อง
- Stable/Beta: ติดตั้ง plugin อย่างเป็นทางการ `@openclaw/whatsapp` จาก ClawHub
  ก่อน โดยมี npm เป็นทางสำรอง
- WhatsApp runtime ถูกแจกจ่ายอยู่นอกแพ็กเกจ npm หลักของ OpenClaw เพื่อให้
  runtime dependencies เฉพาะ WhatsApp อยู่กับ plugin ภายนอก

ยังสามารถติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

ใช้แพ็กเกจ npm แบบเปล่า (`@openclaw/whatsapp`) เฉพาะเมื่อคุณต้องการทางสำรองจาก registry
ปักหมุดเวอร์ชันแบบเจาะจงเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="การแก้ปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและคู่มือซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
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

    การเข้าสู่ระบบปัจจุบันใช้ QR ในสภาพแวดล้อมระยะไกลหรือไม่มีหน้าจอ ตรวจสอบให้แน่ใจว่าคุณ
    มีเส้นทางที่เชื่อถือได้ในการส่งโค้ด QR สดไปยังโทรศัพท์ที่จะสแกน
    ก่อนเริ่มเข้าสู่ระบบ

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

    คำขอจับคู่หมดอายุหลัง 1 ชั่วโมง คำขอที่รอดำเนินการจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp บนหมายเลขแยกต่างหากเมื่อเป็นไปได้ (ข้อมูลเมตาช่องทางและขั้นตอนตั้งค่าถูกปรับให้เหมาะกับรูปแบบนั้น แต่ยังรองรับการตั้งค่าด้วยหมายเลขส่วนตัวด้วย)
</Note>

<Warning>
ขั้นตอนตั้งค่า WhatsApp ปัจจุบันรองรับเฉพาะ QR เท่านั้น QR ที่แสดงในเทอร์มินัล ภาพหน้าจอ
PDF หรือไฟล์แนบในแชทอาจหมดอายุหรืออ่านไม่ได้ระหว่างถูกส่งต่อ
จากเครื่องระยะไกล สำหรับโฮสต์ระยะไกล/ไม่มีหน้าจอ ควรใช้เส้นทางส่งมอบภาพ QR โดยตรง
แทนการจับภาพเทอร์มินัลด้วยตนเอง
</Warning>

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะ (แนะนำ)">
    นี่คือโหมดปฏิบัติการที่สะอาดที่สุด:

    - แยกตัวตน WhatsApp สำหรับ OpenClaw
    - ขอบเขต allowlists และ routing ของ DM ชัดเจนกว่า
    - ลดโอกาสสับสนกับแชทตัวเอง

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

  <Accordion title="ทางสำรองหมายเลขส่วนตัว">
    Onboarding รองรับโหมดหมายเลขส่วนตัวและเขียนค่าพื้นฐานที่เป็นมิตรกับแชทตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ใน runtime การป้องกันแชทตัวเองอ้างอิงหมายเลขตัวเองที่ลิงก์และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางเฉพาะ WhatsApp Web">
    ช่องทางแพลตฟอร์มส่งข้อความใช้ WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทาง OpenClaw ปัจจุบัน

    ไม่มีช่องทางส่งข้อความ Twilio WhatsApp แยกต่างหากใน registry ช่องทางแชทในตัว

  </Accordion>
</AccordionGroup>

## โมเดล Runtime

- Gateway เป็นเจ้าของ socket ของ WhatsApp และลูปเชื่อมต่อใหม่
- watchdog สำหรับการเชื่อมต่อใหม่ใช้กิจกรรมของ transport WhatsApp Web ไม่ใช่เฉพาะปริมาณข้อความแอปขาเข้า ดังนั้นเซสชันอุปกรณ์ที่ลิงก์ซึ่งเงียบจะไม่ถูกรีสตาร์ทเพียงเพราะไม่มีใครส่งข้อความมาเมื่อเร็ว ๆ นี้ เพดานความเงียบของแอปพลิเคชันที่ยาวกว่ายังคงบังคับให้เชื่อมต่อใหม่หาก transport frames ยังมาถึงแต่ไม่มีข้อความแอปพลิเคชันถูกจัดการภายในช่วง watchdog; หลังจากการเชื่อมต่อใหม่ชั่วคราวสำหรับเซสชันที่เพิ่งใช้งาน การตรวจสอบความเงียบของแอปพลิเคชันนั้นใช้ timeout ข้อความปกติสำหรับช่วงกู้คืนแรก
- การตั้งเวลา socket ของ Baileys ระบุไว้อย่างชัดเจนภายใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping แอปพลิเคชัน WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ opening handshake และ `defaultQueryTimeoutMs` ควบคุมการรอ query ของ Baileys รวมถึงขอบเขตการดำเนินการส่ง/สถานะ presence ขาออกภายในเครื่องของ OpenClaw และ read-receipt ขาเข้า
- การส่งขาออกต้องมี listener ของ WhatsApp ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย
- การส่งกลุ่มแนบข้อมูลเมตาการ mention แบบ native สำหรับโทเคน `@+<digits>` และ `@<digits>` ในข้อความและคำบรรยายสื่อเมื่อโทเคนตรงกับข้อมูลเมตาผู้เข้าร่วม WhatsApp ปัจจุบัน รวมถึงกลุ่มที่รองรับ LID
- แชทสถานะและบรอดแคสต์จะถูกละเว้น (`@status`, `@broadcast`)
- watchdog สำหรับการเชื่อมต่อใหม่ติดตามกิจกรรม transport ของ WhatsApp Web ไม่ใช่เฉพาะปริมาณข้อความแอปขาเข้า: เซสชันอุปกรณ์ที่ลิงก์ซึ่งเงียบยังคงอยู่ได้ขณะ transport frames ดำเนินต่อ แต่ transport stall จะบังคับให้เชื่อมต่อใหม่ก่อนเส้นทางตัดการเชื่อมต่อระยะไกลที่ตามมามาก
- แชทตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM ไปยังเซสชันหลักของ agent)
- เซสชันกลุ่มถูกแยกกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- WhatsApp Channels/Newsletters สามารถเป็นเป้าหมายขาออกแบบชัดเจนด้วย JID `@newsletter` แบบ native ได้ การส่ง newsletter ขาออกใช้ข้อมูลเมตาเซสชันช่องทาง (`agent:<agentId>:whatsapp:channel:<jid>`) แทน semantics ของเซสชัน DM
- transport ของ WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variants ตัวพิมพ์เล็ก) ควรใช้การกำหนดค่า proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะช่องทาง WhatsApp
- เมื่อเปิดใช้ `messages.removeAckAfterReply` OpenClaw จะล้าง reaction ack ของ WhatsApp หลังจากส่ง reply ที่มองเห็นได้แล้ว

## พรอมต์อนุมัติ

WhatsApp สามารถแสดงพรอมต์อนุมัติ exec และ plugin ด้วย reaction `👍` / `👎` การส่งมอบ
ถูกควบคุมโดยการกำหนดค่าการส่งต่อ approval ระดับบนสุด:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` และ `approvals.plugin` เป็นอิสระต่อกัน การเปิดใช้ WhatsApp เป็นช่องทางเพียงลิงก์
transport เท่านั้น; จะไม่ส่งพรอมต์อนุมัติ เว้นแต่เปิดใช้ตระกูล approval ที่ตรงกัน
และ route ไปยัง WhatsApp โหมด Session ส่งการอนุมัติด้วยอีโมจิ native เฉพาะสำหรับ approval ที่
มีต้นทางจาก WhatsApp โหมด Target ใช้ pipeline การส่งต่อร่วมสำหรับเป้าหมาย WhatsApp
ที่ระบุชัดเจน และไม่สร้าง approver-DM fanout แยกต่างหาก

reaction อนุมัติของ WhatsApp ต้องมีผู้อนุมัติ WhatsApp ที่ระบุชัดเจนจาก `allowFrom` หรือ `"*"`
`defaultTo` ควบคุมเป้าหมายข้อความเริ่มต้นทั่วไป; ไม่ใช่ผู้อนุมัติ approval คำสั่ง
`/approve` แบบ manual ยังคงผ่านเส้นทาง authorization ผู้ส่ง WhatsApp ตามปกติก่อน
การตัดสิน approval

## Plugin hooks และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนตัว หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์เชื่อมโยงเซสชัน ด้วยเหตุนี้
WhatsApp จึงไม่ broadcast payload hook ขาเข้า `message_received` ไปยัง plugins
เว้นแต่คุณเลือกเปิดใช้โดยชัดเจน:

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

คุณสามารถจำกัดการเลือกเปิดใช้ให้กับบัญชีเดียวได้:

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

เปิดใช้เฉพาะกับ plugins ที่คุณไว้วางใจให้รับเนื้อหาข้อความ
และตัวระบุของ WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชทตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (normalize ภายใน)

    `allowFrom` เป็นรายการควบคุมการเข้าถึงผู้ส่ง DM ไม่ได้กั้นการส่งขาออกที่ระบุชัดเจนไปยัง JID กลุ่ม WhatsApp หรือ JID ช่องทาง `@newsletter`

    การ override หลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรม runtime:

    - pairings ถูกเก็บถาวรใน channel allow-store และรวมเข้ากับ `allowFrom` ที่กำหนดค่าไว้
    - scheduled automation และทางสำรองผู้รับ Heartbeat ใช้เป้าหมายการส่งมอบที่ระบุชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้; approval การจับคู่ DM ไม่ได้เป็นผู้รับ cron หรือ heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist หมายเลขตัวเองที่ลิงก์จะได้รับอนุญาตโดยค่าเริ่มต้น
    - OpenClaw ไม่ auto-pair DM `fromMe` ขาออก (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่ลิงก์)

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlists">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละเว้น `groups` ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` จะทำหน้าที่เป็น allowlist กลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้ากลุ่มทั้งหมด

    ทางสำรอง allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` runtime จะ fallback ไปยัง `allowFrom` เมื่อมี
    - allowlists ผู้ส่งถูกประเมินก่อน activation จาก mention/reply

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย fallback นโยบายกลุ่มของ runtime คือ `allowlist` (พร้อม warning log) แม้ว่า `channels.defaults.groupPolicy` จะถูกตั้งค่าไว้

  </Tab>

  <Tab title="Mentions + /activation">
    reply ในกลุ่มต้องมี mention โดยค่าเริ่มต้น

    การตรวจจับ mention รวมถึง:

    - mention ของ WhatsApp แบบชัดเจนถึงตัวตนบอท
    - รูปแบบ regex mention ที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcript ของ voice-note ขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับ reply-to-bot โดยนัย (ผู้ส่ง reply ตรงกับตัวตนบอท)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply เพียงทำให้ผ่าน mention gating; **ไม่ได้** ให้ authorization แก่ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่ได้อยู่ใน allowlist ยังคงถูกบล็อก แม้ว่าจะ reply ข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่ง activation ระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่ config ส่วนกลาง) และถูกกั้นโดยเจ้าของ

  </Tab>
</Tabs>

## การผูก ACP ที่กำหนดค่าไว้

WhatsApp รองรับการผูก ACP แบบถาวรด้วยรายการ `bindings[]` ระดับบนสุด:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- แชทโดยตรงจับคู่กับหมายเลข E.164 เช่น `+15555550123`.
- กลุ่มจับคู่กับ WhatsApp group JIDs เช่น `120363424282127706@g.us`.
- รายการอนุญาตของกลุ่ม นโยบายผู้ส่ง และการกั้นด้วยการกล่าวถึงหรือการเปิดใช้งาน จะทำงานก่อนที่ OpenClaw จะตรวจสอบว่ามีเซสชัน ACP ที่กำหนดค่าไว้แล้ว
- การผูก ACP ที่กำหนดค่าไว้และจับคู่ได้จะเป็นเจ้าของเส้นทาง กลุ่มบรอดแคสต์ WhatsApp จะไม่กระจายเทิร์นนั้นไปยังเซสชัน WhatsApp ปกติ

## พฤติกรรมหมายเลขส่วนตัวและแชทกับตัวเอง

เมื่อหมายเลขตนเองที่ลิงก์ไว้มีอยู่ใน `allowFrom` ด้วย ระบบป้องกันแชทกับตัวเองของ WhatsApp จะเปิดใช้งาน:

- ข้ามใบตอบรับการอ่านสำหรับเทิร์นแชทกับตัวเอง
- เพิกเฉยต่อพฤติกรรมทริกเกอร์อัตโนมัติด้วย mention-JID ที่มิฉะนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` คำตอบในแชทกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การทำให้ข้อความเป็นมาตรฐานและบริบท

<AccordionGroup>
  <Accordion title="ซองขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อในซองขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับที่อ้างอิง บริบทจะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมตาดาต้าการตอบกลับจะถูกเติมด้วยเมื่อมีข้อมูล (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)
    เมื่อเป้าหมายการตอบกลับที่อ้างอิงเป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    คลังสื่อขาเข้าปกติและเปิดเผยเป็น `MediaPath`/`MediaType` เพื่อให้
    agent ตรวจสอบรูปภาพที่อ้างอิงได้ แทนที่จะเห็นเพียง
    `<media:image>`

  </Accordion>

  <Accordion title="ตัวยึดตำแหน่งสื่อและการดึงข้อมูลตำแหน่ง/รายชื่อติดต่อ">
    ข้อความขาเข้าที่มีเฉพาะสื่อจะถูกทำให้เป็นมาตรฐานด้วยตัวยึดตำแหน่ง เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    ข้อความเสียงของกลุ่มที่ได้รับอนุญาตจะถูกถอดความก่อนการกั้นด้วยการกล่าวถึง เมื่อ
    เนื้อหามีเพียง `<media:audio>` ดังนั้นการพูดถึงบอตในข้อความเสียงจึงสามารถ
    ทริกเกอร์การตอบกลับได้ หากทรานสคริปต์ยังไม่กล่าวถึงบอต
    ทรานสคริปต์จะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทนตัวยึดตำแหน่งดิบ

    เนื้อหาตำแหน่งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียดรายชื่อติดต่อ/vCard จะแสดงเป็นเมตาดาต้าที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่ข้อความ prompt แบบอินไลน์

  </Accordion>

  <Accordion title="การฉีดประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูกบัฟเฟอร์และฉีดเป็นบริบทเมื่อบอตถูกทริกเกอร์ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - การกำหนดค่า: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    เครื่องหมายการฉีด:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="ใบตอบรับการอ่าน">
    ใบตอบรับการอ่านเปิดใช้งานเป็นค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่รับแล้ว

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

    เทิร์นแชทกับตัวเองจะข้ามใบตอบรับการอ่านแม้เมื่อเปิดใช้งานแบบทั่วทั้งระบบ

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่งชิ้น และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความเป็นชิ้น">
    - ขีดจำกัดชิ้นเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) แล้วจึง fallback ไปยังการแบ่งชิ้นตามความยาวที่ปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับ payload รูปภาพ วิดีโอ เสียง (ข้อความเสียง PTT) และเอกสาร
    - สื่อเสียงถูกส่งผ่าน payload `audio` ของ Baileys พร้อม `ptt: true` ดังนั้นไคลเอนต์ WhatsApp จะแสดงเป็นข้อความเสียงแบบ push-to-talk
    - payload การตอบกลับจะคง `audioAsVoice`; เอาต์พุตข้อความเสียง TTS สำหรับ WhatsApp จะอยู่บนเส้นทาง PTT นี้ แม้เมื่อ provider ส่งคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบ native ถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับข้อความเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต Microsoft Edge TTS MP3/WebM จะถูกแปลงด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่งแบบ PTT
    - `/tts latest` ส่งคำตอบล่าสุดของ assistant เป็นข้อความเสียงหนึ่งรายการ และระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม auto-TTS สำหรับแชท WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - `forceDocument` / `asDocument` ส่งรูปภาพ GIF และวิดีโอขาออกผ่าน payload เอกสารของ Baileys เพื่อหลีกเลี่ยงการบีบอัดสื่อของ WhatsApp พร้อมคงชื่อไฟล์และชนิด MIME ที่ resolve แล้ว
    - คำบรรยายจะถูกใช้กับสื่อรายการแรกเมื่อส่ง payload ตอบกลับแบบหลายสื่อ ยกเว้นข้อความเสียง PTT จะส่งเสียงก่อนและส่งข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายข้อความเสียงไม่สม่ำเสมอ
    - แหล่งสื่ออาจเป็น HTTP(S), `file://` หรือ path ภายในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรม fallback">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - override ต่อบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมอัตโนมัติ (resize/quality sweep) ให้พอดีกับขีดจำกัด เว้นแต่ `forceDocument` / `asDocument` จะร้องขอการส่งแบบเอกสาร
    - เมื่อส่งสื่อล้มเหลว fallback สำหรับรายการแรกจะส่งข้อความเตือนแทนการทิ้งคำตอบไปเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างอิงข้อความตอบกลับ

WhatsApp รองรับการอ้างอิงข้อความตอบกลับแบบ native ซึ่งคำตอบขาออกจะแสดงการอ้างอิงข้อความขาเข้าอย่างชัดเจน ควบคุมด้วย `channels.whatsapp.replyToMode`

| ค่า          | พฤติกรรม                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างอิงเลย; ส่งเป็นข้อความธรรมดา                                  |
| `"first"`   | อ้างอิงเฉพาะชิ้นคำตอบขาออกชิ้นแรก                             |
| `"all"`     | อ้างอิงทุกชิ้นคำตอบขาออก                                      |
| `"batched"` | อ้างอิงคำตอบแบบ batched ที่อยู่ในคิว โดยปล่อยให้คำตอบทันทีไม่ถูกอ้างอิง |

ค่าเริ่มต้นคือ `"off"` override ต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

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

`channels.whatsapp.reactionLevel` ควบคุมว่า agent ใช้ปฏิกิริยาอีโมจิบน WhatsApp กว้างเพียงใด:

| ระดับ         | ปฏิกิริยา Ack | ปฏิกิริยาที่ agent เริ่มเอง | คำอธิบาย                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่            | ไม่                        | ไม่มีปฏิกิริยาเลย                              |
| `"ack"`       | ใช่           | ไม่                        | เฉพาะปฏิกิริยา Ack (ใบตอบรับก่อนตอบกลับ)           |
| `"minimal"`   | ใช่           | ใช่ (แบบระมัดระวัง)        | Ack + ปฏิกิริยาของ agent พร้อมคำแนะนำแบบระมัดระวัง |
| `"extensive"` | ใช่           | ใช่ (ส่งเสริมให้ใช้)          | Ack + ปฏิกิริยาของ agent พร้อมคำแนะนำที่ส่งเสริมให้ใช้   |

ค่าเริ่มต้น: `"minimal"`

override ต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

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

WhatsApp รองรับปฏิกิริยา ack ทันทีเมื่อได้รับขาเข้า ผ่าน `channels.whatsapp.ackReaction`
ปฏิกิริยา Ack ถูกกั้นด้วย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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

- ส่งทันทีหลังจากรับขาเข้าแล้ว (ก่อนตอบกลับ)
- หากมี `ackReaction` โดยไม่มี `emoji` WhatsApp จะใช้อีโมจิ identity ของ agent ที่ถูก route โดย fallback ไปเป็น "👀"; ละเว้น `ackReaction` หรือตั้ง `emoji: ""` เพื่อไม่ส่งปฏิกิริยา ack
- ความล้มเหลวจะถูกบันทึก log แต่ไม่บล็อกการส่งคำตอบปกติ
- โหมดกลุ่ม `mentions` ตอบสนองต่อเทิร์นที่ทริกเกอร์ด้วยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็น bypass สำหรับการตรวจนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ใช้ `messages.ackReaction` แบบ legacy ที่นี่)

## ปฏิกิริยาสถานะวงจรชีวิต

ตั้งค่า `messages.statusReactions.enabled: true` เพื่อให้ WhatsApp แทนที่ปฏิกิริยา ack ระหว่างเทิร์น แทนการปล่อยอีโมจิใบตอบรับแบบคงที่ไว้ เมื่อเปิดใช้งาน OpenClaw จะใช้ช่องปฏิกิริยาของข้อความขาเข้าเดียวกันสำหรับสถานะวงจรชีวิต เช่น queued, thinking, tool activity, compaction, done และ error

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

หมายเหตุพฤติกรรม:

- `channels.whatsapp.ackReaction` ยังคงควบคุมว่าปฏิกิริยาสถานะมีสิทธิ์ใช้กับข้อความโดยตรงและกลุ่มหรือไม่
- ปฏิกิริยาสถานะ queued ใช้อีโมจิ ack ที่มีผลเดียวกับปฏิกิริยา ack ธรรมดา
- WhatsApp มีช่องปฏิกิริยาของบอตหนึ่งช่องต่อข้อความ ดังนั้นการอัปเดตวงจรชีวิตจะแทนที่ปฏิกิริยาปัจจุบันในที่เดิม
- `messages.removeAckAfterReply: true` ล้างปฏิกิริยาสถานะสุดท้ายหลังจากช่วงคงสถานะ done/error ที่กำหนดค่าไว้
- หมวดหมู่อีโมจิของเครื่องมือประกอบด้วย `tool`, `coding`, `web`, `deploy`, `build` และ `concierge`

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - id บัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมี ไม่เช่นนั้นใช้ id บัญชีที่กำหนดค่าไว้รายการแรก (เรียงลำดับแล้ว)
    - id บัญชีถูกทำให้เป็นมาตรฐานภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="path ข้อมูลรับรองและความเข้ากันได้แบบ legacy">
    - path auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth เริ่มต้นแบบ legacy ใน `~/.openclaw/credentials/` ยังคงถูกจดจำ/ย้ายข้อมูลสำหรับ flow บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` ล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    เมื่อ Gateway เข้าถึงได้ การออกจากระบบจะหยุดตัวฟัง WhatsApp ที่ทำงานอยู่สำหรับบัญชีที่เลือกก่อน เพื่อไม่ให้เซสชันที่ลิงก์ไว้ยังรับข้อความต่อไปจนกว่าจะ restart ครั้งถัดไป `openclaw channels remove --channel whatsapp` จะหยุดตัวฟังที่ทำงานอยู่ก่อนปิดใช้งานหรือลบการกำหนดค่าบัญชีด้วย

    ในไดเรกทอรี auth แบบ legacy จะคง `oauth.json` ไว้ ขณะที่ไฟล์ auth ของ Baileys จะถูกลบ

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนการกำหนดค่า

- การรองรับเครื่องมือของ agent รวมถึงการกระทำปฏิกิริยาของ WhatsApp (`react`)
- การกั้นการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนการกำหนดค่าที่เริ่มโดย channel เปิดใช้งานเป็นค่าเริ่มต้น (ปิดใช้งานผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้ลิงก์ (ต้องใช้ QR)">
    อาการ: สถานะ channel รายงานว่ายังไม่ได้ลิงก์

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="ลิงก์แล้วแต่ตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีที่ลิงก์แล้วมีการตัดการเชื่อมต่อหรือพยายามเชื่อมต่อใหม่ซ้ำ ๆ

    บัญชีที่เงียบสามารถคงการเชื่อมต่อไว้เกิน timeout ข้อความปกติได้; watchdog
    จะ restart เมื่อกิจกรรม transport ของ WhatsApp Web หยุดลง socket ปิด หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินกรอบเวลาความปลอดภัยที่ยาวกว่า

    หากบันทึกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ๆ ให้ปรับเวลา
    ซ็อกเก็ต Baileys ภายใต้ `web.whatsapp` เริ่มจากลด
    `keepAliveIntervalMs` ให้ต่ำกว่าเวลาหมดอายุเมื่อเครือข่ายว่างของคุณ และเพิ่ม
    `connectTimeoutMs` สำหรับลิงก์ที่ช้าหรือสูญเสียแพ็กเก็ตง่าย:

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

    วิธีแก้ไข:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    หากลูปยังคงอยู่หลังจากแก้ไขการเชื่อมต่อโฮสต์และการตั้งเวลาแล้ว ให้สำรองข้อมูล
    ไดเรกทอรี auth ของบัญชี และลิงก์บัญชีนั้นใหม่:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    หาก `~/.openclaw/logs/whatsapp-health.log` ระบุว่า `Gateway inactive` แต่
    `openclaw gateway status` และ `openclaw channels status --probe` แสดงว่า
    gateway และ WhatsApp ปกติดี ให้เรียกใช้ `openclaw doctor` บน Linux doctor
    จะเตือนเกี่ยวกับรายการ crontab แบบเดิมที่ยังเรียกใช้
    `~/.openclaw/bin/ensure-whatsapp.sh`; ลบรายการเก่าเหล่านั้นด้วย
    `crontab -e` เพราะ cron อาจไม่มีสภาพแวดล้อม systemd user-bus และ
    ทำให้สคริปต์เก่านั้นรายงานสุขภาพ gateway ผิดพลาด

    หากจำเป็น ให้ลิงก์ใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="การเข้าสู่ระบบด้วย QR หมดเวลาหลังพร็อกซี">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงรหัส QR ที่ใช้ได้ พร้อม `status=408 Request Time-out` หรือการตัดการเชื่อมต่อซ็อกเก็ต TLS

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อมพร็อกซีมาตรฐานของโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, รูปแบบตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่ากระบวนการ gateway สืบทอด proxy env และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ใช้งานอยู่เมื่อส่ง">
    การส่งออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มี gateway listener ที่ใช้งานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า gateway กำลังทำงานและบัญชีถูกลิงก์แล้ว

  </Accordion>

  <Accordion title="คำตอบปรากฏในทรานสคริปต์แต่ไม่ปรากฏใน WhatsApp">
    แถวทรานสคริปต์บันทึกสิ่งที่ agent สร้างขึ้น การส่งผ่าน WhatsApp ตรวจสอบแยกต่างหาก: OpenClaw จะถือว่าการตอบกลับอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืน id ข้อความขาออกสำหรับการส่งข้อความที่มองเห็นได้หรือสื่ออย่างน้อยหนึ่งรายการ

    รีแอ็กชัน ack เป็นใบรับก่อนตอบกลับที่แยกกัน รีแอ็กชันที่สำเร็จไม่ได้พิสูจน์ว่าข้อความหรือสื่อที่ตอบกลับภายหลังได้รับการยอมรับจาก WhatsApp

    ตรวจสอบบันทึก gateway สำหรับ `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้นโดยไม่คาดคิด">
    ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ของ `groups`
    - การกั้นด้วยการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการภายหลังจะแทนที่รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เพียงรายการเดียวต่อ scope

    หากมี `channels.whatsapp.groups` อยู่ WhatsApp ยังสามารถสังเกตข้อความจากกลุ่มอื่นได้ แต่ OpenClaw จะทิ้งข้อความเหล่านั้นก่อนการกำหนดเส้นทาง session เพิ่ม JID ของกลุ่มลงใน `channels.whatsapp.groups` หรือเพิ่ม `groups["*"]` เพื่อรับทุกกลุ่มไว้ ขณะที่ยังคงการอนุญาตผู้ส่งไว้ภายใต้ `groupPolicy` และ `groupAllowFrom`

  </Accordion>

  <Accordion title="คำเตือน runtime ของ Bun">
    runtime ของ WhatsApp gateway ควรใช้ Node Bun ถูกทำเครื่องหมายว่าเข้ากันไม่ได้สำหรับการทำงานของ WhatsApp/Telegram gateway ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมต์ระบบ

WhatsApp รองรับพรอมต์ระบบสไตล์ Telegram สำหรับกลุ่มและแชทโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการแก้ค่าสำหรับข้อความกลุ่ม:

แมป `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตนเอง ระบบจะแทนที่แมป `groups` ระดับ root ทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหาพรอมต์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมต์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อมีรายการกลุ่มเฉพาะอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ของรายการนั้น หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่ใช้พรอมต์ระบบ
2. **พรอมต์ระบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มเฉพาะอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ค่าสำหรับข้อความโดยตรง:

แมป `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตนเอง ระบบจะแทนที่แมป `direct` ระดับ root ทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหาพรอมต์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมต์ระบบเฉพาะ direct** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อมีรายการ peer เฉพาะอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` ของรายการนั้น หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่ใช้พรอมต์ระบบ
2. **พรอมต์ระบบ wildcard ของ direct** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการ peer เฉพาะอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบัคเก็ต override ประวัติราย DM แบบเบา (`dms.<id>.historyLimit`) ส่วนการ override พรอมต์อยู่ภายใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ค่า `groups` ระดับ root จะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตนเอง เพื่อป้องกันไม่ให้บอทรับข้อความกลุ่มสำหรับกลุ่มที่บอทไม่ได้เป็นสมาชิก WhatsApp ไม่ใช้ guard นี้: `groups` ระดับ root และ `direct` ระดับ root จะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนด override ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp หลายบัญชี หากคุณต้องการพรอมต์กลุ่มหรือ direct แยกตามบัญชี ให้กำหนดแมปทั้งหมดภายใต้แต่ละบัญชีอย่างชัดเจน แทนที่จะพึ่งค่าเริ่มต้นระดับ root

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมป config รายกลุ่มและ allowlist กลุ่มระดับแชท ที่ scope ระดับ root หรือบัญชี `groups["*"]` หมายถึง "รับทุกกลุ่มไว้" สำหรับ scope นั้น
- เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ scope นั้นรับทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้เฉพาะชุด ID กลุ่มที่กำหนดไว้เท่านั้นมีสิทธิ์ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของพรอมต์ ให้ทำซ้ำพรอมต์ในแต่ละรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแทน
- การรับกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบแยกกัน `groups["*"]` ขยายชุดกลุ่มที่สามารถเข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นด้วยตัวเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ให้เฉพาะ config แชท direct เริ่มต้นหลังจาก DM ได้รับการรับไว้แล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎ pairing-store

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

ฟิลด์ WhatsApp ที่มีสัญญาณสูง:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override ระดับบัญชี
- การปฏิบัติการ: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- พฤติกรรม session: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- พรอมต์: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลาย agent](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
