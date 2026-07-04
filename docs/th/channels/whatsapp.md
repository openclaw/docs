---
read_when:
    - การทำงานกับพฤติกรรมของช่องทาง WhatsApp/web หรือการกำหนดเส้นทางกล่องขาเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่ง และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T15:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นเจ้าของเซสชันที่ลิงก์ไว้

## ติดตั้ง (เมื่อต้องการ)

- Onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะแจ้งให้ติดตั้ง Plugin WhatsApp ในครั้งแรกที่คุณเลือกใช้
- `openclaw channels login --channel whatsapp` ยังเสนอขั้นตอนติดตั้งเมื่อ
  ยังไม่มี Plugin อยู่
- ช่องทาง Dev + git checkout: ใช้ค่าเริ่มต้นเป็นพาธ Plugin ในเครื่อง
- Stable/Beta: ติดตั้ง Plugin ทางการ `@openclaw/whatsapp` จาก ClawHub
  ก่อน โดยมี npm เป็นทางเลือกสำรอง
- รันไทม์ WhatsApp ถูกแจกจ่ายแยกจากแพ็กเกจ npm หลักของ OpenClaw เพื่อให้
  dependency รันไทม์เฉพาะของ WhatsApp อยู่กับ Plugin ภายนอก

การติดตั้งด้วยตนเองยังใช้งานได้:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

ใช้แพ็กเกจ npm แบบตรง (`@openclaw/whatsapp`) เฉพาะเมื่อคุณต้องการทางเลือกสำรองจากรีจิสทรี
ปักหมุดเวอร์ชันแบบเจาะจงเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เหมือนเดิม

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและคู่มือซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

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

    การเข้าสู่ระบบปัจจุบันใช้ QR ในสภาพแวดล้อมระยะไกลหรือแบบไม่มีหน้าจอ ตรวจสอบให้แน่ใจว่าคุณ
    มีเส้นทางที่เชื่อถือได้ในการส่ง QR สดไปยังโทรศัพท์ที่จะสแกน
    ก่อนเริ่มเข้าสู่ระบบ

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

    คำขอจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้รัน WhatsApp บนหมายเลขแยกต่างหากเมื่อทำได้ (เมทาดาทาของช่องทางและขั้นตอนตั้งค่าถูกปรับให้เหมาะกับการตั้งค่านั้น แต่ก็รองรับการตั้งค่าด้วยหมายเลขส่วนตัวเช่นกัน)
</Note>

<Warning>
ขั้นตอนตั้งค่า WhatsApp ปัจจุบันรองรับเฉพาะ QR เท่านั้น QR ที่แสดงในเทอร์มินัล ภาพหน้าจอ
PDF หรือไฟล์แนบแชตอาจหมดอายุหรืออ่านไม่ได้ระหว่างการส่งต่อ
จากเครื่องระยะไกล สำหรับโฮสต์ระยะไกล/ไม่มีหน้าจอ ควรใช้เส้นทางส่งมอบภาพ QR โดยตรง
แทนการจับภาพจากเทอร์มินัลด้วยตนเอง
</Warning>

## โทรหาผู้ร้องขอปัจจุบันด้วย MeowCaller (ทดลอง)

Plugin WhatsApp สามารถเปิดเผย `whatsapp_call` ในเทิร์น agent ที่มาจาก WhatsApp เครื่องมือนี้
ใช้ [MeowCaller](https://github.com/purpshell/meowcaller) เพื่อโทรด้วยเสียงผ่าน WhatsApp ไปยัง
ผู้ร้องขอที่ได้รับอนุญาตในปัจจุบัน และเล่นข้อความ TTS ของ OpenClaw หลังจากเขารับสาย เครื่องมือนี้
ไม่รับหมายเลขปลายทาง ดังนั้นพรอมป์จึงไม่สามารถเปลี่ยนเส้นทางการโทรไปยังบุคคลที่สามได้
ความสามารถเชิงทดลองนี้ปิดใช้งานตามค่าเริ่มต้น

<Warning>
MeowCaller เป็นซอฟต์แวร์ทดลอง ไม่มี release ที่ติดแท็ก และใช้เซสชันอุปกรณ์ที่ลิงก์ของ whatsmeow
ซึ่งจับคู่แยกต่างหาก ไม่สามารถใช้ข้อมูลประจำตัว Baileys ของ Plugin WhatsApp ซ้ำได้ การจับคู่จะเพิ่ม
อุปกรณ์ที่ลิงก์อีกเครื่องหนึ่งในบัญชี WhatsApp เดียวกัน ให้สแกนด้วยตัวตน WhatsApp ที่ OpenClaw ใช้
โหมดหมายเลขส่วนตัว/แชตกับตัวเองไม่สามารถโทรหาตัวเองได้ ให้ใช้หมายเลข OpenClaw เฉพาะ
เพื่อโทรหาหมายเลขส่วนตัวของคุณ
</Warning>

<Steps>
  <Step title="Enable experimental calls">

    เพิ่ม `actions.calls: true` ลงในช่องทาง WhatsApp ใน `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    รวมค่านี้เข้ากับการกำหนดค่า WhatsApp ที่มีอยู่ของคุณ แล้วรีสตาร์ท Gateway เมื่อ
    ไม่มีการตั้งค่านี้หรือเป็น `false` OpenClaw จะไม่เปิดเผยเครื่องมือ `whatsapp_call` ให้ agent

  </Step>

  <Step title="Install the reviewed MeowCaller CLI">

    adapter คาดว่าจะมีไฟล์ปฏิบัติการชื่อ `meowcaller` บน `PATH` ของโฮสต์ Gateway
    จนกว่า [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) จะ merge ให้ build
    branch ที่ผ่านการ review แล้วที่ commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    ตรวจสอบให้แน่ใจว่า `$HOME/.local/bin` อยู่บน `PATH` ของบริการ Gateway ด้วย revision นี้มี
    คำสั่ง `pair` แบบชัดเจนและคำสั่ง `notify` แบบส่งอย่างเดียว `notify` ไม่เปิดไมโครโฟน ลำโพง
    อุปกรณ์วิดีโอ ซิงก์เสียงขาเข้า หรือการจับข้อมูลวินิจฉัย อย่าใช้คำสั่ง `play` ของ CLI ตัวอย่างแทน

  </Step>

  <Step title="Pair the MeowCaller linked device">

    ขอให้ agent WhatsApp ตรวจสอบการตั้งค่าการโทร action สถานะ `whatsapp_call` จะรายงาน
    ไดเรกทอรีสถานะเฉพาะบัญชีและคำสั่งจับคู่ สำหรับบัญชีเริ่มต้น:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    รันคำสั่งในเทอร์มินัลแบบโต้ตอบ สแกน QR จาก **WhatsApp > Linked devices**
    และรอ `MeowCaller linked device ready` จากนั้นคำสั่งจะออก เก็บ `wa-voip.db`
    ไว้เป็นส่วนตัว เพราะเป็นเซสชันอุปกรณ์ที่ลิงก์ของ MeowCaller action สถานะ `whatsapp_call`
    จะคืนคำสั่งและ shell เฉพาะบัญชีเมื่อคุณใช้บัญชีที่ไม่ใช่ค่าเริ่มต้น บน
    Windows ให้รันคำสั่ง PowerShell ของบัญชีนั้น MeowCaller จะสร้างไดเรกทอรี store ให้

  </Step>

  <Step title="Configure TTS and call from WhatsApp">

    กำหนดค่า [ผู้ให้บริการ TTS](/th/tools/tts) ที่รองรับโทรศัพท์ รีสตาร์ท Gateway แล้วส่ง
    คำขอ WhatsApp เช่น `Call me and say the build finished.` เครื่องมือจะระบุผู้ส่ง
    จากบริบทขาเข้าที่เชื่อถือได้ สังเคราะห์ไฟล์ WAV ส่วนตัวชั่วคราว รัน MeowCaller สำหรับ
    หน้าต่างเวลาการโทรที่จำกัด และลบไฟล์เสียงหลังจากนั้น OpenClaw ส่ง store ของบัญชี
    อย่างชัดเจน รอ exit status เป็นศูนย์หลังจากรับสาย เล่นเสียง และวางสาย และถือว่า
    timeout หรือ exit ที่ไม่ใช่ศูนย์เป็นการเรียกเครื่องมือล้มเหลว

  </Step>
</Steps>

ข้อจำกัดปัจจุบัน:

- โทรเสียงขาออกแบบหนึ่งต่อหนึ่งเท่านั้น
- ไม่มีหมายเลขปลายทางแบบกำหนดเอง
- ไม่ใช้ auth ร่วมกับการเชื่อมต่อแชต
- ไม่มีการโทรหาตัวเองจากโหมดหมายเลขส่วนตัว/แชตกับตัวเอง
- เสียงที่สังเคราะห์ถูกจำกัดไว้ที่ 60 วินาที
- ไม่มีใบรับการได้ยินฝั่งโทรศัพท์นอกเหนือจากการดำเนินการรับสาย/เล่นเสียง/วางสายของ MeowCaller ที่เสร็จสมบูรณ์
- OpenClaw หยุด companion process หลังจากหน้าต่างเวลาที่จำกัด 115-175 วินาที รวมถึง
  เฟสการเชื่อมต่อ รับสาย เล่นเสียง และปิดการทำงานของ MeowCaller

## รูปแบบการ deploy

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    นี่คือโหมดการทำงานที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการ routing ที่ชัดเจนกว่า
    - โอกาสสับสนกับแชตตัวเองต่ำกว่า

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
    Onboarding รองรับโหมดหมายเลขส่วนตัวและเขียน baseline ที่เป็นมิตรกับแชตตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` รวมหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ในรันไทม์ การป้องกันแชตตัวเองอิงจากหมายเลขตัวเองที่ลิงก์ไว้และ `allowFrom`

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    ช่องทางแพลตฟอร์มข้อความใช้ WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทาง OpenClaw ปัจจุบัน

    ไม่มีช่องทางข้อความ Twilio WhatsApp แยกต่างหากในรีจิสทรี chat-channel ในตัว

  </Accordion>
</AccordionGroup>

## โมเดลรันไทม์

- Gateway เป็นเจ้าของ socket ของ WhatsApp และ loop การ reconnect
- watchdog การ reconnect ใช้กิจกรรมการขนส่งของ WhatsApp Web ไม่ใช่แค่ปริมาณ app-message ขาเข้า ดังนั้นเซสชันอุปกรณ์ที่ลิงก์ซึ่งเงียบอยู่จะไม่ถูกรีสตาร์ทเพียงเพราะไม่มีใครส่งข้อความเมื่อเร็วๆ นี้ cap ความเงียบของแอปพลิเคชันที่ยาวกว่ายังคงบังคับให้ reconnect หาก transport frames ยังมาถึงแต่ไม่มีข้อความแอปพลิเคชันถูกจัดการภายในหน้าต่าง watchdog หลังจาก reconnect ชั่วคราวสำหรับเซสชันที่เพิ่ง active การตรวจสอบความเงียบของแอปพลิเคชันนั้นจะใช้ timeout ข้อความปกติสำหรับหน้าต่าง recovery แรก
- timing ของ Baileys socket ระบุอย่างชัดเจนภายใต้ `web.whatsapp.*`: `keepAliveIntervalMs` ควบคุม ping แอปพลิเคชันของ WhatsApp Web, `connectTimeoutMs` ควบคุม timeout ของ handshake ตอนเปิด และ `defaultQueryTimeoutMs` ควบคุมการรอ query ของ Baileys รวมถึงขอบเขตการดำเนินการส่งขาออก/presence ในเครื่องและ read-receipt ขาเข้าของ OpenClaw
- การส่งขาออกต้องมี listener ของ WhatsApp ที่ active สำหรับบัญชีเป้าหมาย
- การส่งกลุ่มแนบเมทาดาทา mention แบบ native สำหรับ token `@+<digits>` และ `@<digits>` ในข้อความและคำบรรยายสื่อเมื่อ token ตรงกับเมทาดาทา participant ปัจจุบันของ WhatsApp รวมถึงกลุ่มที่รองรับด้วย LID
- แชตสถานะและ broadcast จะถูกละเว้น (`@status`, `@broadcast`)
- watchdog การ reconnect ติดตามกิจกรรมการขนส่งของ WhatsApp Web ไม่ใช่เฉพาะปริมาณ app-message ขาเข้า: เซสชันอุปกรณ์ที่ลิงก์ซึ่งเงียบอยู่ยังคงทำงานต่อเมื่อ transport frames ดำเนินต่อ แต่ transport stall จะบังคับให้ reconnect ก่อนเส้นทาง remote disconnect ภายหลังเป็นอย่างมาก
- แชตตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` รวม DM เข้ากับเซสชันหลักของ agent)
- เซสชันกลุ่มถูกแยกออก (`agent:<agentId>:whatsapp:group:<jid>`)
- WhatsApp Channels/Newsletters สามารถเป็นเป้าหมายขาออกที่ระบุชัดเจนด้วย JID `@newsletter` แบบ native ของตัวเอง การส่ง newsletter ขาออกใช้เมทาดาทาเซสชัน channel (`agent:<agentId>:whatsapp:channel:<jid>`) แทน semantics ของเซสชัน DM
- การขนส่ง WhatsApp Web เคารพตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variant ตัวพิมพ์เล็ก) ควรใช้การกำหนดค่า proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะช่องทาง WhatsApp
- เมื่อเปิดใช้ `messages.removeAckAfterReply` OpenClaw จะล้าง reaction ack ของ WhatsApp หลังจากส่ง reply ที่มองเห็นได้แล้ว

## พรอมป์อนุมัติ

WhatsApp สามารถ render พรอมป์อนุมัติ exec และ Plugin ด้วย reaction `👍` / `👎` การส่งมอบ
ถูกควบคุมโดยการกำหนดค่า forwarding การอนุมัติระดับบนสุด:

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
transport เท่านั้น ไม่ได้ส่งพรอมป์อนุมัติเว้นแต่เปิดใช้ family การอนุมัติที่ตรงกัน
และ route ไปยัง WhatsApp โหมด session ส่งการอนุมัติ emoji แบบ native เฉพาะสำหรับการอนุมัติที่
มีต้นทางจาก WhatsApp โหมด target ใช้ pipeline forwarding ร่วมสำหรับเป้าหมาย WhatsApp
ที่ระบุชัดเจน และไม่สร้าง fanout DM ของผู้อนุมัติแยกต่างหาก

reaction อนุมัติของ WhatsApp ต้องมีผู้อนุมัติ WhatsApp ที่ระบุชัดเจนจาก `allowFrom` หรือ `"*"`
`defaultTo` ควบคุมเป้าหมายข้อความเริ่มต้นทั่วไป ไม่ใช่ผู้อนุมัติการอนุมัติ คำสั่ง
`/approve` แบบ manual ยังคงผ่านเส้นทาง authorization ของผู้ส่ง WhatsApp ปกติก่อน
การ resolve การอนุมัติ

## hook ของ Plugin และความเป็นส่วนตัว

ข้อความขาเข้าของ WhatsApp อาจมีเนื้อหาข้อความส่วนตัว หมายเลขโทรศัพท์
ตัวระบุกลุ่ม ชื่อผู้ส่ง และฟิลด์เชื่อมโยงเซสชัน ด้วยเหตุนี้
WhatsApp จึงไม่กระจาย payload ของ hook ขาเข้า `message_received` ไปยัง Plugin
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

คุณสามารถจำกัดการเลือกเข้าร่วมไว้ที่บัญชีเดียวได้:

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

เปิดใช้เฉพาะสำหรับ Plugin ที่คุณไว้วางใจให้รับเนื้อหาและตัวระบุของข้อความ
WhatsApp ขาเข้าเท่านั้น

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (ปรับรูปแบบภายใน)

    `allowFrom` คือรายการควบคุมการเข้าถึงของผู้ส่ง DM ไม่ได้กั้นการส่งขาออกแบบชัดเจนไปยัง JID ของกลุ่ม WhatsApp หรือ JID ของช่อง `@newsletter`

    การแทนที่แบบหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) มีลำดับความสำคัญเหนือค่าเริ่มต้นระดับช่องสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมขณะรัน:

    - การจับคู่จะถูกบันทึกใน allow-store ของช่อง และรวมกับ `allowFrom` ที่กำหนดค่าไว้
    - ระบบอัตโนมัติตามกำหนดเวลาและ fallback ผู้รับ Heartbeat ใช้เป้าหมายการส่งที่ระบุชัดเจนหรือ `allowFrom` ที่กำหนดค่าไว้; การอนุมัติการจับคู่ DM ไม่ได้เป็นผู้รับ Cron หรือ Heartbeat โดยนัย
    - หากไม่ได้กำหนดค่า allowlist หมายเลขตนเองที่ลิงก์ไว้จะได้รับอนุญาตตามค่าเริ่มต้น
    - OpenClaw จะไม่จับคู่ DM ขาออก `fromMe` โดยอัตโนมัติ (ข้อความที่คุณส่งหาตัวเองจากอุปกรณ์ที่ลิงก์ไว้)

  </Tab>

  <Tab title="นโยบายกลุ่ม + รายการอนุญาต">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist สมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากละ `groups` ไว้ ทุกกลุ่มจะมีสิทธิ์ใช้งานได้
       - หากมี `groups` อยู่ จะทำหน้าที่เป็น allowlist ของกลุ่ม (อนุญาต `"*"`)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ของผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกขาเข้าจากกลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` ระบบขณะรันจะ fallback ไปใช้ `allowFrom` เมื่อมีให้ใช้
    - allowlist ของผู้ส่งจะถูกประเมินก่อนการเปิดใช้งานด้วยการกล่าวถึง/การตอบกลับ

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย fallback ของนโยบายกลุ่มขณะรันคือ `allowlist` (พร้อมบันทึกคำเตือน) แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="การกล่าวถึง + /activation">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงตามค่าเริ่มต้น

    การตรวจจับการกล่าวถึงรวมถึง:

    - การกล่าวถึงตัวตนบอตใน WhatsApp อย่างชัดเจน
    - รูปแบบ regex การกล่าวถึงที่กำหนดค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - ถอดเสียงบันทึกเสียงขาเข้าสำหรับข้อความกลุ่มที่ได้รับอนุญาต
    - การตรวจจับการตอบกลับถึงบอตโดยนัย (ผู้ส่งที่ถูกตอบกลับตรงกับตัวตนบอต)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply ตอบสนองเฉพาะเงื่อนไขการกั้นด้วยการกล่าวถึงเท่านั้น; **ไม่ได้** ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่ได้อยู่ใน allowlist ยังคงถูกบล็อก แม้จะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` อัปเดตสถานะเซสชัน (ไม่ใช่การกำหนดค่าส่วนกลาง) และถูกกั้นโดยเจ้าของ

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

- แชตโดยตรงจับคู่กับหมายเลข E.164 เช่น `+15555550123`
- กลุ่มจับคู่กับ JID ของกลุ่ม WhatsApp เช่น `120363424282127706@g.us`
- allowlist ของกลุ่ม นโยบายผู้ส่ง และการกั้นด้วยการกล่าวถึงหรือการเปิดใช้งานจะทำงานก่อนที่ OpenClaw จะตรวจให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่
- การผูก ACP ที่กำหนดค่าไว้และจับคู่สำเร็จจะเป็นเจ้าของเส้นทาง กลุ่มกระจายข้อความของ WhatsApp จะไม่ fan out เทิร์นนั้นไปยังเซสชัน WhatsApp ปกติ

## พฤติกรรมหมายเลขส่วนตัวและแชตกับตนเอง

เมื่อหมายเลขตนเองที่ลิงก์ไว้มีอยู่ใน `allowFrom` ด้วย มาตรการป้องกันแชตกับตนเองของ WhatsApp จะเปิดใช้งาน:

- ข้ามใบตอบรับการอ่านสำหรับเทิร์นแชตกับตนเอง
- ละเว้นพฤติกรรม auto-trigger ของ mention-JID ที่ไม่เช่นนั้นจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` การตอบกลับแชตกับตนเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การปรับข้อความให้เป็นมาตรฐานและบริบท

<AccordionGroup>
  <Accordion title="ซองข้อความขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วยซองขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับที่อ้างถึงอยู่ บริบทจะถูกผนวกในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมตาดาต้าการตอบกลับจะถูกเติมด้วยเมื่อมีให้ใช้ (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)
    เมื่อเป้าหมายการตอบกลับที่อ้างถึงเป็นสื่อที่ดาวน์โหลดได้ OpenClaw จะบันทึกผ่าน
    คลังสื่อขาเข้าปกติ และเปิดเผยเป็น `MediaPath`/`MediaType` เพื่อให้
    เอเจนต์ตรวจสอบรูปภาพที่อ้างถึงได้ แทนที่จะเห็นเพียง
    `<media:image>`

  </Accordion>

  <Accordion title="placeholder ของสื่อและการดึงข้อมูลตำแหน่ง/ผู้ติดต่อ">
    ข้อความขาเข้าที่มีเฉพาะสื่อจะถูกปรับให้เป็นมาตรฐานด้วย placeholder เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    บันทึกเสียงของกลุ่มที่ได้รับอนุญาตจะถูกถอดเสียงก่อนการกั้นด้วยการกล่าวถึงเมื่อ
    เนื้อหามีเพียง `<media:audio>` ดังนั้นการกล่าวถึงบอตในบันทึกเสียงจึงสามารถ
    trigger การตอบกลับได้ หากถอดเสียงแล้วยังไม่ได้กล่าวถึงบอต
    ข้อความถอดเสียงจะถูกเก็บไว้ในประวัติกลุ่มที่รอดำเนินการแทน placeholder ดิบ

    เนื้อหาตำแหน่งใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่งและรายละเอียดผู้ติดต่อ/vCard จะแสดงผลเป็นเมตาดาต้าที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่ข้อความ prompt แบบ inline

  </Accordion>

  <Accordion title="การฉีดประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูก buffer และฉีดเข้าเป็นบริบทเมื่อบอตถูก trigger ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - การกำหนดค่า: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` ปิดใช้งาน

    ตัวทำเครื่องหมายการฉีด:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="ใบตอบรับการอ่าน">
    ใบตอบรับการอ่านเปิดใช้งานตามค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ถูกยอมรับ

    ปิดใช้งานทั่วทั้งระบบ:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    การแทนที่ต่อบัญชี:

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

    เทิร์นแชตกับตนเองจะข้ามใบตอบรับการอ่าน แม้จะเปิดใช้งานทั่วทั้งระบบ

  </Accordion>
</AccordionGroup>

## การส่ง การแบ่ง chunk และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่ง chunk ข้อความ">
    - ขีดจำกัด chunk เริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะเลือกขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน จากนั้น fallback ไปใช้การแบ่ง chunk แบบปลอดภัยตามความยาว

  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับ payload รูปภาพ วิดีโอ เสียง (บันทึกเสียง PTT) และเอกสาร
    - สื่อเสียงถูกส่งผ่าน payload `audio` ของ Baileys พร้อม `ptt: true` เพื่อให้ไคลเอนต์ WhatsApp แสดงผลเป็นบันทึกเสียง push-to-talk
    - payload การตอบกลับคง `audioAsVoice` ไว้; เอาต์พุตบันทึกเสียง TTS สำหรับ WhatsApp จะยังอยู่บนเส้นทาง PTT นี้ แม้ provider จะคืน MP3 หรือ WebM
    - เสียง Ogg/Opus แบบ native ถูกส่งเป็น `audio/ogg; codecs=opus` เพื่อความเข้ากันได้กับบันทึกเสียง
    - เสียงที่ไม่ใช่ Ogg รวมถึงเอาต์พุต MP3/WebM ของ Microsoft Edge TTS จะถูกแปลงด้วย `ffmpeg` เป็น Ogg/Opus โมโน 48 kHz ก่อนส่ง PTT
    - `/tts latest` ส่งคำตอบล่าสุดของ assistant เป็นบันทึกเสียงเดียว และระงับการส่งซ้ำสำหรับคำตอบเดียวกัน; `/tts chat on|off|default` ควบคุม auto-TTS สำหรับแชต WhatsApp ปัจจุบัน
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - `forceDocument` / `asDocument` ส่งรูปภาพ GIF และวิดีโอขาออกผ่าน payload เอกสารของ Baileys เพื่อหลีกเลี่ยงการบีบอัดสื่อของ WhatsApp พร้อมคงชื่อไฟล์และ MIME type ที่ resolve แล้วไว้
    - คำบรรยายจะถูกใช้กับรายการสื่อแรกเมื่อส่ง payload การตอบกลับแบบหลายสื่อ ยกเว้นบันทึกเสียง PTT ที่ส่งเสียงก่อนและข้อความที่มองเห็นได้แยกต่างหาก เพราะไคลเอนต์ WhatsApp แสดงคำบรรยายบันทึกเสียงไม่สม่ำเสมอ
    - แหล่งที่มาของสื่อสามารถเป็น HTTP(S), `file://` หรือ path ภายในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรม fallback">
    - ขีดจำกัดการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - ขีดจำกัดการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่ต่อบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับให้เหมาะสมโดยอัตโนมัติ (ปรับขนาด/กวาดคุณภาพ) เพื่อให้พอดีกับขีดจำกัด เว้นแต่ `forceDocument` / `asDocument` จะร้องขอการส่งแบบเอกสาร
    - เมื่อการส่งสื่อล้มเหลว fallback ของรายการแรกจะส่งข้อความเตือนแทนการทิ้งคำตอบไปอย่างเงียบ ๆ

  </Accordion>
</AccordionGroup>

## การอ้างข้อความในการตอบกลับ

WhatsApp รองรับการอ้างข้อความในการตอบกลับแบบ native โดยคำตอบขาออกจะอ้างข้อความขาเข้าให้เห็นได้ ควบคุมด้วย `channels.whatsapp.replyToMode`

| ค่า          | พฤติกรรม                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | ไม่อ้างเลย; ส่งเป็นข้อความธรรมดา                                      |
| `"first"`   | อ้างเฉพาะ chunk คำตอบขาออกแรก                                         |
| `"all"`     | อ้างทุก chunk คำตอบขาออก                                               |
| `"batched"` | อ้างคำตอบแบบ batched ที่เข้าคิวไว้ โดยปล่อยให้คำตอบทันทีไม่ถูกอ้าง     |

ค่าเริ่มต้นคือ `"off"` การแทนที่ต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

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

`channels.whatsapp.reactionLevel` ควบคุมว่าเอเจนต์ใช้ reaction อีโมจิบน WhatsApp กว้างแค่ไหน:

| ระดับ         | reaction รับทราบ | reaction ที่เอเจนต์เริ่มเอง | คำอธิบาย                                          |
| ------------- | ---------------- | ---------------------------- | ------------------------------------------------- |
| `"off"`       | ไม่              | ไม่                          | ไม่มี reaction เลย                                |
| `"ack"`       | ใช่              | ไม่                          | เฉพาะ reaction รับทราบ (ใบรับก่อนตอบกลับ)         |
| `"minimal"`   | ใช่              | ใช่ (ระมัดระวัง)             | รับทราบ + reaction ของเอเจนต์พร้อมแนวทางระมัดระวัง |
| `"extensive"` | ใช่              | ใช่ (ส่งเสริม)               | รับทราบ + reaction ของเอเจนต์พร้อมแนวทางส่งเสริม   |

ค่าเริ่มต้น: `"minimal"`

การแทนที่ต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## reaction รับทราบ

WhatsApp รองรับ reaction รับทราบทันทีเมื่อได้รับขาเข้าผ่าน `channels.whatsapp.ackReaction`
reaction รับทราบถูกกั้นด้วย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

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
- หากมี `ackReaction` โดยไม่มี `emoji` WhatsApp จะใช้อีโมจิประจำตัวตนของเอเจนต์ที่ถูกกำหนดเส้นทาง และถอยกลับไปใช้ "👀"; ละ `ackReaction` หรือกำหนด `emoji: ""` เพื่อไม่ส่งรีแอ็กชันตอบรับ
- ความล้มเหลวจะถูกบันทึกลงล็อก แต่ไม่บล็อกการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะรีแอ็กต์กับเทิร์นที่ถูกเรียกด้วยการกล่าวถึง; การเปิดใช้งานกลุ่ม `always` ทำหน้าที่เป็นทางเลี่ยงสำหรับการตรวจนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (ไม่ใช้ `messages.ackReaction` แบบเดิมที่นี่)

## รีแอ็กชันสถานะวงจรชีวิต

ตั้งค่า `messages.statusReactions.enabled: true` เพื่อให้ WhatsApp แทนที่รีแอ็กชันตอบรับระหว่างเทิร์น แทนที่จะปล่อยอีโมจิใบรับแบบคงที่ไว้ เมื่อเปิดใช้งาน OpenClaw จะใช้ช่องรีแอ็กชันของข้อความขาเข้าเดียวกันสำหรับสถานะวงจรชีวิต เช่น อยู่ในคิว, กำลังคิด, กิจกรรมเครื่องมือ, Compaction, เสร็จสิ้น และข้อผิดพลาด

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

- `channels.whatsapp.ackReaction` ยังคงควบคุมว่ารีแอ็กชันสถานะมีสิทธิ์ใช้กับข้อความโดยตรงและกลุ่มหรือไม่
- รีแอ็กชันสถานะอยู่ในคิวใช้อีโมจิตอบรับที่มีผลเดียวกับรีแอ็กชันตอบรับปกติ
- WhatsApp มีช่องรีแอ็กชันของบอตหนึ่งช่องต่อข้อความ ดังนั้นการอัปเดตวงจรชีวิตจะแทนที่รีแอ็กชันปัจจุบันในตำแหน่งเดิม
- `messages.removeAckAfterReply: true` จะล้างรีแอ็กชันสถานะสุดท้ายหลังจากระยะเวลาค้างสถานะเสร็จสิ้น/ข้อผิดพลาดที่กำหนดค่าไว้
- หมวดหมู่อีโมจิของเครื่องมือประกอบด้วย `tool`, `coding`, `web`, `deploy`, `build` และ `concierge`

## หลายบัญชีและข้อมูลประจำตัว

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - ไอดีบัญชีมาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมี มิฉะนั้นใช้ไอดีบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
    - ไอดีบัญชีจะถูกทำให้เป็นรูปแบบมาตรฐานภายในสำหรับการค้นหา

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - พาธการยืนยันตัวตนปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - การยืนยันตัวตนเริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` ยังถูกรับรู้/ย้ายข้อมูลสำหรับโฟลว์บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` จะล้างสถานะการยืนยันตัวตนของ WhatsApp สำหรับบัญชีนั้น

    เมื่อเข้าถึง Gateway ได้ การออกจากระบบจะหยุด listener WhatsApp สดของบัญชีที่เลือกก่อน เพื่อไม่ให้เซสชันที่ลิงก์ไว้ยังคงรับข้อความจนกว่าจะรีสตาร์ตครั้งถัดไป `openclaw channels remove --channel whatsapp` จะหยุด listener สดก่อนปิดใช้งานหรือลบค่ากำหนดบัญชีเช่นกัน

    ในไดเรกทอรีการยืนยันตัวตนแบบเดิม `oauth.json` จะถูกเก็บไว้ ขณะที่ไฟล์การยืนยันตัวตนของ Baileys จะถูกลบออก

  </Accordion>
</AccordionGroup>

## เครื่องมือ แอ็กชัน และการเขียนค่ากำหนด

- การรองรับเครื่องมือของเอเจนต์รวมถึงแอ็กชันรีแอ็กชันของ WhatsApp (`react`)
- เกตของแอ็กชัน:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนค่ากำหนดที่เริ่มจากช่องทางเปิดใช้งานโดยค่าเริ่มต้น (ปิดใช้งานผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    อาการ: สถานะช่องทางรายงานว่ายังไม่ได้ลิงก์

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    อาการ: บัญชีที่ลิงก์แล้วมีการตัดการเชื่อมต่อซ้ำหรือพยายามเชื่อมต่อใหม่ซ้ำ

    บัญชีที่เงียบสามารถเชื่อมต่ออยู่ต่อได้เกินเวลาหมดอายุข้อความปกติ; watchdog
    จะรีสตาร์ตเมื่อกิจกรรมทรานสปอร์ต WhatsApp Web หยุดลง, ซ็อกเก็ตปิด, หรือ
    กิจกรรมระดับแอปพลิเคชันเงียบเกินหน้าต่างความปลอดภัยที่ยาวกว่า

    หากล็อกแสดง `status=408 Request Time-out Connection was lost` ซ้ำ ให้ปรับ
    จังหวะเวลาซ็อกเก็ต Baileys ใต้ `web.whatsapp` เริ่มด้วยการลด
    `keepAliveIntervalMs` ให้ต่ำกว่าเวลาหมดอายุเมื่อไม่มีการใช้งานของเครือข่าย และเพิ่ม
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    หากลูปยังคงอยู่หลังจากแก้การเชื่อมต่อของโฮสต์และจังหวะเวลาแล้ว ให้สำรองข้อมูล
    ไดเรกทอรีการยืนยันตัวตนของบัญชีและลิงก์บัญชีนั้นใหม่:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    หาก `~/.openclaw/logs/whatsapp-health.log` ระบุว่า `Gateway inactive` แต่
    `openclaw gateway status` และ `openclaw channels status --probe` แสดงว่า
    gateway และ WhatsApp ทำงานปกติ ให้รัน `openclaw doctor` บน Linux doctor
    จะเตือนเกี่ยวกับรายการ crontab แบบเดิมที่ยังเรียกใช้
    `~/.openclaw/bin/ensure-whatsapp.sh`; ลบรายการเก่าเหล่านั้นด้วย
    `crontab -e` เพราะ cron อาจไม่มีสภาพแวดล้อม systemd user-bus และ
    ทำให้สคริปต์เก่านั้นรายงานสถานะสุขภาพ gateway ผิดพลาด

    หากจำเป็น ให้ลิงก์ใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    อาการ: `openclaw channels login --channel whatsapp` ล้มเหลวก่อนแสดงคิวอาร์โค้ดที่ใช้งานได้ พร้อม `status=408 Request Time-out` หรือการตัดการเชื่อมต่อซ็อกเก็ต TLS

    การเข้าสู่ระบบ WhatsApp Web ใช้สภาพแวดล้อมพร็อกซีมาตรฐานของโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, รูปแบบตัวพิมพ์เล็ก และ `NO_PROXY`) ตรวจสอบว่ากระบวนการ gateway สืบทอดพร็อกซี env และ `NO_PROXY` ไม่ตรงกับ `mmg.whatsapp.net`

  </Accordion>

  <Accordion title="No active listener when sending">
    การส่งขาออกจะล้มเหลวอย่างรวดเร็วเมื่อไม่มี listener ของ gateway ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า gateway กำลังทำงานและบัญชีถูกลิงก์แล้ว

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    แถว transcript บันทึกสิ่งที่เอเจนต์สร้างขึ้น การส่งผ่าน WhatsApp จะถูกตรวจแยกต่างหาก: OpenClaw จะถือว่าการตอบกลับอัตโนมัติถูกส่งแล้วก็ต่อเมื่อ Baileys ส่งคืนไอดีข้อความขาออกสำหรับการส่งข้อความหรือสื่อที่มองเห็นได้อย่างน้อยหนึ่งรายการ

    รีแอ็กชันตอบรับเป็นใบรับก่อนตอบกลับที่เป็นอิสระจากกัน รีแอ็กชันที่สำเร็จไม่ได้พิสูจน์ว่าข้อความหรือสื่อที่ตอบกลับภายหลังได้รับการยอมรับโดย WhatsApp

    ตรวจล็อก gateway เพื่อหา `auto-reply delivery failed` หรือ `auto-reply was not accepted by WhatsApp provider`

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    ตรวจตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการอนุญาต `groups`
    - เกตการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการภายหลังจะแทนที่รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

    หากมี `channels.whatsapp.groups` WhatsApp ยังสามารถสังเกตข้อความจากกลุ่มอื่นได้ แต่ OpenClaw จะทิ้งข้อความเหล่านั้นก่อนการกำหนดเส้นทางเซสชัน เพิ่ม JID ของกลุ่มลงใน `channels.whatsapp.groups` หรือเพิ่ม `groups["*"]` เพื่อรับทุกกลุ่ม ขณะยังคงการอนุญาตผู้ส่งไว้ภายใต้ `groupPolicy` และ `groupAllowFrom`

  </Accordion>

  <Accordion title="Bun runtime warning">
    รันไทม์ gateway ของ WhatsApp ควรใช้ Node Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงาน gateway ของ WhatsApp/Telegram ที่เสถียร
  </Accordion>
</AccordionGroup>

## พรอมป์ระบบ

WhatsApp รองรับพรอมป์ระบบแบบ Telegram สำหรับกลุ่มและแชตโดยตรงผ่านแมป `groups` และ `direct`

ลำดับชั้นการแก้ไขสำหรับข้อความกลุ่ม:

แมป `groups` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `groups` ของตัวเองไว้ มันจะแทนที่แมป `groups` ที่รากทั้งหมด (ไม่มีการผสานลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะไม่มีอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

ลำดับชั้นการแก้ไขสำหรับข้อความโดยตรง:

แมป `direct` ที่มีผลจะถูกกำหนดก่อน: หากบัญชีกำหนด `direct` ของตัวเองไว้ มันจะแทนที่แมป `direct` ที่รากทั้งหมด (ไม่มีการผสานลึก) จากนั้นการค้นหาพรอมป์จะทำงานบนแมปเดี่ยวที่ได้:

1. **พรอมป์ระบบเฉพาะ direct** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อรายการเพียร์เฉพาะมีอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มีการใช้พรอมป์ระบบ
2. **พรอมป์ระบบ wildcard ของ direct** (`direct["*"].systemPrompt`): ใช้เมื่อรายการเพียร์เฉพาะไม่มีอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

<Note>
`dms` ยังคงเป็นบัคเก็ต override ประวัติต่อ DM แบบเบา (`dms.<id>.historyLimit`) การ override พรอมป์อยู่ใต้ `direct`
</Note>

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram, `groups` ที่รากจะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในการตั้งค่าหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง เพื่อป้องกันไม่ให้บอตรับข้อความกลุ่มสำหรับกลุ่มที่บอตไม่ได้เป็นสมาชิก WhatsApp ไม่ใช้การป้องกันนี้: `groups` ที่รากและ `direct` ที่รากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนด override ระดับบัญชีเสมอ ไม่ว่าจะกำหนดค่ากี่บัญชีก็ตาม ในการตั้งค่า WhatsApp หลายบัญชี หากคุณต้องการพรอมป์กลุ่มหรือ direct แยกตามบัญชี ให้กำหนดแมปเต็มไว้ใต้แต่ละบัญชีอย่างชัดเจน แทนที่จะพึ่งค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปค่ากำหนดต่อกลุ่มและรายการอนุญาตกลุ่มระดับแชต ที่ขอบเขตรากหรือบัญชี `groups["*"]` หมายถึง "รับทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นรับทุกกลุ่มอยู่แล้ว หากคุณยังต้องการให้มีเพียงชุดไอดีกลุ่มที่แน่นอนเท่านั้นที่มีสิทธิ์ อย่าใช้ `groups["*"]` สำหรับค่าเริ่มต้นของพรอมป์ แต่ให้ทำซ้ำพรอมป์ในแต่ละรายการกลุ่มที่อยู่ในรายการอนุญาตอย่างชัดเจน
- การรับกลุ่มและการอนุญาตผู้ส่งเป็นการตรวจแยกกัน `groups["*"]` ขยายชุดของกลุ่มที่เข้าถึงการจัดการกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นด้วยตัวเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ให้เพียงค่ากำหนดแชตโดยตรงเริ่มต้นหลังจาก DM ได้รับการยอมรับแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎของ pairing-store

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
