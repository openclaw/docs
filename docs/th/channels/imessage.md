---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC over stdio) พร้อมการดำเนินการของ API ส่วนตัวสำหรับการตอบกลับ, tapbacks, เอฟเฟกต์, ไฟล์แนบ และการจัดการกลุ่ม เหมาะสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์ตรงตามเงื่อนไข
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการติดตั้งใช้งาน OpenClaw iMessage ให้ใช้ `imsg` บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้แล้ว หาก Gateway ของคุณทำงานบน Linux หรือ Windows ให้ชี้ `channels.imessage.cliPath` ไปยัง SSH wrapper ที่รัน `imsg` บน Mac

**การตามเก็บข้อความช่วง Gateway หยุดทำงานเป็นแบบเลือกเปิดใช้เอง** เมื่อเปิดใช้ (`channels.imessage.catchup.enabled: true`) Gateway จะเล่นซ้ำข้อความขาเข้าที่เข้ามาใน `chat.db` ขณะออฟไลน์อยู่ (แครช รีสตาร์ต Mac sleep) ในการเริ่มทำงานครั้งถัดไป ปิดไว้โดยค่าเริ่มต้น — ดู [การตามเก็บหลัง Gateway หยุดทำงาน](#catching-up-after-gateway-downtime) ปิด [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกนำออกแล้ว ย้าย config `channels.bluebubbles` ไปเป็น `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway สร้าง `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/พอร์ตแยกต่างหาก) การดำเนินการขั้นสูงต้องใช้ `imsg launch` และการตรวจสอบ API ส่วนตัวที่สำเร็จ

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ tapback เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดจับคู่โดยค่าเริ่มต้น
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ SSH wrapper เมื่อ Gateway ไม่ได้ทำงานบน Mac ที่ใช้ Messages
  </Card>
  <Card title="Configuration reference" icon="settings" href="/th/gateway/config-channels#imessage">
    เอกสารอ้างอิงฟิลด์ iMessage ฉบับเต็ม
  </Card>
</CardGroup>

## การตั้งค่าแบบเร็ว

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณจึงชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและรัน `imsg` ได้

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    config ที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจจับอัตโนมัติโดยแยกวิเคราะห์สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบ host key แบบเข้มงวดสำหรับ SCP ดังนั้น host key ของ relay ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- Messages ต้องลงชื่อเข้าใช้บน Mac ที่รัน `imsg`
- ต้องมี Full Disk Access สำหรับ process context ที่รัน OpenClaw/`imsg` (การเข้าถึง Messages DB)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการดำเนินการขั้นสูง (react / edit / unsend / threaded reply / effects / group ops) ต้องปิดใช้งาน System Integrity Protection — ดู [การเปิดใช้ API ส่วนตัวของ imsg](#enabling-the-imsg-private-api) ด้านล่าง การส่ง/รับข้อความพื้นฐานและสื่อใช้งานได้โดยไม่ต้องปิด

<Tip>
สิทธิ์ถูกให้ตาม process context หาก gateway ทำงานแบบ headless (LaunchAgent/SSH) ให้รันคำสั่งแบบโต้ตอบหนึ่งครั้งใน context เดียวกันนั้นเพื่อเรียก prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## การเปิดใช้ API ส่วนตัวของ imsg

`imsg` มาพร้อมโหมดการทำงานสองแบบ:

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยน SIP): ข้อความขาออกและสื่อผ่าน `send`, watch/history ขาเข้า, รายการแชต นี่คือสิ่งที่ได้ทันทีจาก `brew install steipete/tap/imsg` ใหม่ พร้อมสิทธิ์ macOS มาตรฐานด้านบน
- **โหมด API ส่วนตัว**: `imsg` inject helper dylib เข้าไปใน `Messages.app` เพื่อเรียกฟังก์ชัน `IMCore` ภายใน นี่คือสิ่งที่ปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบ thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบตอบรับการอ่าน

เพื่อเข้าถึงพื้นที่การดำเนินการขั้นสูงที่หน้า channel นี้บันทึกไว้ คุณต้องใช้โหมด API ส่วนตัว README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่ง rich send ที่มี bridge รองรับ, การแก้ไขข้อความ และการจัดการแชต เป็นแบบเลือกเปิดใช้เอง ต้องปิดใช้งาน SIP และต้อง inject helper dylib เข้าไปใน `Messages.app` `imsg launch` จะปฏิเสธการ inject เมื่อ SIP เปิดใช้อยู่

เทคนิค helper-injection ใช้ dylib ของ `imsg` เองเพื่อเข้าถึง API ส่วนตัวของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือ runtime ของ BlueBubbles ในเส้นทาง OpenClaw iMessage

<Warning>
**การปิดใช้งาน SIP เป็นการแลกเปลี่ยนด้านความปลอดภัยจริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการรันโค้ดระบบที่ถูกแก้ไข การปิดทั้งระบบจะเปิดพื้นที่โจมตีและผลข้างเคียงเพิ่มเติม โดยเฉพาะอย่างยิ่ง **การปิดใช้งาน SIP บน Mac Apple Silicon จะปิดความสามารถในการติดตั้งและรันแอป iOS บน Mac ของคุณด้วย**

ให้ถือว่านี่เป็นตัวเลือกการปฏิบัติงานโดยเจตนา ไม่ใช่ค่าเริ่มต้น หาก threat model ของคุณไม่สามารถยอมรับการปิด SIP ได้ iMessage ที่ bundled มาจะจำกัดอยู่ที่โหมดพื้นฐาน — ส่ง/รับข้อความและสื่อเท่านั้น ไม่มี reactions / edit / unsend / effects / group ops
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` ต่อเมธอด เพื่อให้คุณเห็นว่า build ปัจจุบันรองรับอะไรบ้างก่อนเริ่ม

2. **ปิดใช้งาน System Integrity Protection** ขั้นตอนนี้ขึ้นกับเวอร์ชัน macOS เพราะข้อกำหนดพื้นฐานของ Apple ขึ้นกับ OS และฮาร์ดแวร์:
   - **macOS 10.13–10.15 (Sierra–Catalina):** ปิดใช้งาน Library Validation ผ่าน Terminal, รีบูตเข้า Recovery Mode, รัน `csrutil disable`, รีสตาร์ต
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** Recovery Mode (หรือ Internet Recovery), `csrutil disable`, รีสตาร์ต
   - **macOS 11+, Apple Silicon:** ลำดับการเริ่มต้นด้วยปุ่มเปิดเครื่องเพื่อเข้า Recovery; บน macOS เวอร์ชันล่าสุด ให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคลิก Continue จากนั้น `csrutil disable` การตั้งค่า virtual machine ใช้ขั้นตอนแยกต่างหาก — สร้าง snapshot ของ VM ก่อน
   - **macOS 26 / Tahoe:** นโยบาย library-validation และการตรวจสอบ private-entitlement ของ `imagent` เข้มงวดขึ้นอีก; `imsg` อาจต้องใช้ build ที่อัปเดตเพื่อให้ตามทัน หากการ inject ของ `imsg launch` หรือ `selectors` บางตัวเริ่มคืนค่า false หลังอัปเกรด macOS major ให้ตรวจสอบ release notes ของ `imsg` ก่อนสรุปว่าขั้นตอน SIP สำเร็จแล้ว

   ทำตามขั้นตอน Recovery-mode ของ Apple สำหรับ Mac ของคุณเพื่อปิดใช้งาน SIP ก่อนรัน `imsg launch`

3. **Inject helper** เมื่อ SIP ปิดอยู่และ Messages.app ลงชื่อเข้าใช้แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการ inject เมื่อ SIP ยังเปิดอยู่ ดังนั้นคำสั่งนี้จึงใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 มีผลแล้ว

4. **ตรวจสอบ bridge จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '.selectors'` ควรแสดง `retractMessagePart: true` พร้อม selector ของ edit / typing / read ใดก็ตามที่ build macOS ของคุณเปิดเผย การ gating ต่อเมธอดของ OpenClaw Plugin ใน `actions.ts` จะโฆษณาเฉพาะการดำเนินการที่ selector พื้นฐานเป็น `true` ดังนั้นพื้นที่การดำเนินการที่คุณเห็นในรายการเครื่องมือของ agent จะสะท้อนสิ่งที่ bridge ทำได้จริงบนโฮสต์นี้

หาก `openclaw channels status --probe` รายงาน channel เป็น `works` แต่การดำเนินการบางอย่างโยนข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ตอน dispatch ให้รัน `imsg launch` อีกครั้ง — helper อาจหลุดออกไปได้ (Messages.app รีสตาร์ต, อัปเดต OS ฯลฯ) และสถานะ `available: true` ที่แคชไว้จะยังโฆษณาการดำเนินการต่อไปจนกว่า probe ถัดไปจะ refresh

### เมื่อคุณปิดใช้งาน SIP ไม่ได้

หากการปิด SIP ไม่ยอมรับได้สำหรับ threat model ของคุณ:

- `imsg` จะ fallback เป็นโหมดพื้นฐาน — ข้อความ + สื่อ + การรับเท่านั้น
- OpenClaw Plugin ยังคงโฆษณาการส่งข้อความ/สื่อและการติดตามขาเข้า เพียงแต่ซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และ group ops จากพื้นที่การดำเนินการ (ตาม gate ความสามารถต่อเมธอด)
- คุณสามารถรัน Mac ที่ไม่ใช่ Apple-Silicon แยกต่างหาก (หรือ Mac สำหรับ bot โดยเฉพาะ) โดยปิด SIP สำหรับ workload iMessage ขณะที่ยังเปิด SIP บนอุปกรณ์หลักของคุณไว้ ดู [ผู้ใช้ macOS สำหรับ bot โดยเฉพาะ (identity iMessage แยกต่างหาก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist อาจเป็น handle, กลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) หรือเป้าหมายแชต (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่าไว้)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` สามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ได้เช่นกัน

    Runtime fallback: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่ม iMessage จะ fallback ไปใช้ `allowFrom` เมื่อมี
    หมายเหตุ runtime: หาก `channels.imessage` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มมี gate allowlist **สอง** ชั้นที่ทำงานต่อเนื่องกัน และทั้งสองชั้นต้องผ่าน:

    1. **Allowlist ผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` หรือ `chat_id`
    2. **ทะเบียนกลุ่ม** (`channels.imessage.groups`) — เมื่อใช้ `groupPolicy: "allowlist"` gate นี้ต้องมีรายการ wildcard `groups: { "*": { ... } }` (ตั้ง `allowAll = true`) หรือรายการต่อ `chat_id` อย่างชัดเจนภายใต้ `groups`

    หาก gate 2 ไม่มีอะไรอยู่ในนั้น ข้อความกลุ่มทุกข้อความจะถูกทิ้ง Plugin จะส่งสัญญาณระดับ `warn` สองรายการที่ log level ค่าเริ่มต้น:

    - ครั้งเดียวต่อบัญชีเมื่อเริ่มทำงาน: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - ครั้งเดียวต่อ `chat_id` ตอน runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM ยังคงทำงานเพราะใช้ code path ต่างกัน

    config ขั้นต่ำเพื่อให้กลุ่มยังไหลต่อภายใต้ `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    หากบรรทัด `warn` เหล่านั้นปรากฏใน log ของ gateway แปลว่า gate 2 กำลังทิ้งข้อความ — เพิ่มบล็อก `groups`
    </Warning>

    Mention gating สำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาทาการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - เมื่อไม่ได้กำหนดรูปแบบไว้ จะไม่สามารถบังคับเงื่อนไขการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามเงื่อนไขการกล่าวถึงในกลุ่มได้

    `systemPrompt` รายกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` ยอมรับสตริง `systemPrompt` ที่เป็นทางเลือก ค่านี้จะถูกฉีดเข้าไปในพรอมต์ระบบของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น การเลือกใช้จะเหมือนกับการเลือกพรอมต์รายกลุ่มที่ใช้โดย `channels.whatsapp.groups`:

    1. **พรอมต์ระบบเฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ในแผนที่ **และ** มีการกำหนดคีย์ `systemPrompt` ของรายการนั้น หาก `systemPrompt` เป็นสตริงว่าง (`""`) อักขระแทนค่าจะถูกระงับ และจะไม่มีการใช้พรอมต์ระบบกับกลุ่มนั้น
    2. **พรอมต์ระบบแบบอักขระแทนค่าของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะไม่มีอยู่ในแผนที่เลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    พรอมต์รายกลุ่มใช้กับข้อความกลุ่มเท่านั้น — ข้อความตรงในช่องทางนี้ไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดแน่นอน">
    - ข้อความตรงใช้การกำหนดเส้นทางแบบตรง; กลุ่มใช้การกำหนดเส้นทางแบบกลุ่ม
    - ด้วยค่าเริ่มต้น `session.dmScope=main` ข้อความตรงของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้เมทาดาทาของช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage แบบมีผู้เข้าร่วมหลายคนบางรายการอาจเข้ามาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะปฏิบัติกับรายการนั้นเป็นทราฟฟิกแบบกลุ่ม (เงื่อนไขกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมยังสามารถผูกกับเซสชัน ACP ได้ด้วย

ลำดับงานด่วนสำหรับผู้ปฏิบัติการ:

- เรียกใช้ `/acp spawn codex --bind here` ภายในข้อความตรงหรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในการสนทนา iMessage เดียวกันนั้นจะถูกส่งไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

รองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- แฮนเดิลข้อความตรงที่ปรับเป็นรูปแบบมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>` (แนะนำสำหรับการผูกกลุ่มที่เสถียร)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS เฉพาะสำหรับบอต (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS เฉพาะ เพื่อแยกทราฟฟิกของบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    ลำดับงานทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้างตัวครอบ SSH เพื่อให้ OpenClaw สามารถเรียกใช้ `imsg` ในบริบทของผู้ใช้นั้น
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การเรียกใช้ครั้งแรกอาจต้องมีการอนุมัติผ่านส่วนติดต่อแบบกราฟิก (การทำงานอัตโนมัติ + การเข้าถึงดิสก์แบบเต็ม) ในเซสชันผู้ใช้ของบอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - Gateway ทำงานบน Linux/VM
    - iMessage + `imsg` ทำงานบน Mac ใน tailnet ของคุณ
    - ตัวครอบ `cliPath` ใช้ SSH เพื่อเรียกใช้ `imsg`
    - `remoteHost` เปิดใช้การดึงไฟล์แนบผ่าน SCP

    ตัวอย่าง:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ทำงานแบบไม่ต้องโต้ตอบ
    ตรวจสอบให้โฮสต์คีย์เชื่อถือได้ก่อน (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้เติม `known_hosts` แล้ว

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่ารายบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถแทนที่ฟิลด์ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist ของรูทไฟล์แนบ

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งชิ้น และเป้าหมายการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การนำเข้าไฟล์แนบขาเข้า **ปิดอยู่ตามค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ บันทึกเสียง วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดไว้ ข้อความ iMessage ที่มีเฉพาะไฟล์แนบจะถูกทิ้งก่อนถึงเอเจนต์ และอาจไม่สร้างบรรทัดบันทึก `Inbound message` เลย
    - พาธไฟล์แนบระยะไกลสามารถดึงผ่าน SCP ได้เมื่อตั้งค่า `remoteHost`
    - พาธไฟล์แนบต้องตรงกับรูทที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรูทเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบโฮสต์คีย์แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งชิ้นขาออก">
    - ขีดจำกัดชิ้นข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งชิ้น: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (การแบ่งโดยยึดย่อหน้าก่อน)

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบระบุชัดที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับเป้าหมายแบบแฮนเดิลด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## การดำเนินการของ API ส่วนตัว

เมื่อ `imsg launch` กำลังทำงานและ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความสามารถใช้การดำเนินการแบบเนทีฟของ iMessage นอกเหนือจากการส่งข้อความปกติได้

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การดำเนินการที่พร้อมใช้งาน">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับจะจับคู่กับรัก ถูกใจ ไม่ถูกใจ หัวเราะ เน้น และคำถาม
    - **reply**: ส่งการตอบกลับแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message`, พร้อม `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`)
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`)
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/API ส่วนตัวที่รองรับ (`messageId`, `text` หรือ `newText`)
    - **unsend**: เรียกคืนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/API ส่วนตัวที่รองรับ (`messageId`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` เป็น base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, `asVoice` ที่เป็นทางเลือก) ชื่อแฝงเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อเป้าหมายปัจจุบันเป็นการสนทนากลุ่ม

  </Accordion>

  <Accordion title="ID ข้อความ">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็มเมื่อมีให้ใช้ ID สั้นมีขอบเขตอยู่ในแคชการตอบกลับในหน่วยความจำล่าสุด และจะถูกตรวจสอบกับแชตปัจจุบันก่อนใช้งาน หาก ID สั้นหมดอายุหรือเป็นของแชตอื่น ให้ลองอีกครั้งด้วย `MessageSidFull` แบบเต็ม

  </Accordion>

  <Accordion title="การตรวจจับความสามารถ">
    OpenClaw ซ่อนการดำเนินการของ API ส่วนตัวเฉพาะเมื่อสถานะการตรวจสอบที่แคชไว้บอกว่าบริดจ์ไม่พร้อมใช้งาน หากไม่ทราบสถานะ การดำเนินการจะยังคงมองเห็นได้และจะส่งการตรวจสอบเมื่อจำเป็น เพื่อให้การดำเนินการแรกสำเร็จได้หลังจาก `imsg launch` โดยไม่ต้องรีเฟรชสถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและการพิมพ์">
    เมื่อบริดจ์ API ส่วนตัวทำงาน แชตขาเข้าที่ได้รับการยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้วก่อนส่งต่อ และจะแสดงฟองสถานะกำลังพิมพ์ให้ผู้ส่งเห็นขณะที่เอเจนต์กำลังสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    บิลด์ `imsg` รุ่นเก่าที่มาก่อนรายการความสามารถรายเมธอดจะปิดกั้นการพิมพ์/การอ่านอย่างเงียบ ๆ; OpenClaw จะบันทึกคำเตือนครั้งเดียวต่อการรีสตาร์ต เพื่อให้ระบุสาเหตุของใบตอบรับที่หายไปได้

  </Accordion>
</AccordionGroup>

## การเขียนการกำหนดค่า

iMessage อนุญาตให้เขียนการกำหนดค่าที่เริ่มจากช่องทางตามค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

ปิดใช้งาน:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวมข้อความตรงที่ถูกแยกส่ง (คำสั่ง + URL ในการเขียนข้อความเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน — เช่น `Dump https://example.com/article` — แอป Messages ของ Apple จะแยกการส่งออกเป็น **สองแถว `chat.db` แยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนตัวอย่าง URL (`"https://..."`) พร้อมรูปภาพตัวอย่าง OG เป็นไฟล์แนบ

สองแถวนี้มาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในชุดติดตั้งส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์น 1 แล้วตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL ในเทิร์น 2 เท่านั้น — ซึ่งเมื่อถึงตอนนั้นบริบทของคำสั่งก็หายไปแล้ว นี่คือไปป์ไลน์การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` เพิ่มเข้ามา

`channels.imessage.coalesceSameSenderDms` ทำให้ข้อความตรงเลือกใช้การรวมแถวต่อเนื่องจากผู้ส่งคนเดียวกันเป็นเทิร์นเดียวของเอเจนต์ แชตกลุ่มยังคงส่งต่อทีละข้อความ เพื่อคงโครงสร้างเทิร์นของผู้ใช้หลายคนไว้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณส่งมอบ Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (ดัมพ์, วาง, บันทึก, เข้าคิว ฯลฯ)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
    - คุณยอมรับเวลาแฝงของเทิร์นข้อความตรงที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดไว้เมื่อ:

    - คุณต้องการเวลาแฝงของคำสั่งต่ำสุดสำหรับทริกเกอร์ข้อความตรงแบบคำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งครั้งเดียวที่ไม่มีเพย์โหลดตามมา

  </Tab>
  <Tab title="การเปิดใช้">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กและไม่มีการกำหนด `messages.inbound.byChannel.imessage` อย่างชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นแบบเดิมคือ 0 ms — ไม่มีการ debounce) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้นเพราะจังหวะการส่งแบบแยกของ Apple ที่ 0.8-2.0 s ไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

    หากต้องการปรับหน้าต่างด้วยตัวเอง:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **เพิ่มเวลาแฝงสำหรับข้อความ DM** เมื่อเปิดแฟล็ก ทุก DM (รวมถึงคำสั่งควบคุมแบบเดี่ยวและการติดตามผลด้วยข้อความเดียว) จะรอได้สูงสุดเท่ากับหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่าจะมีแถว payload ตามมา ข้อความแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` อย่างชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการแหล่งที่มาจำกัดที่ 10 (เก็บรายการแรกและรายการล่าสุดไว้เมื่อเกินนั้น) GUID ของแหล่งที่มาทุกตัวจะถูกติดตามใน `coalescedMessageGuids` สำหรับ telemetry ปลายน้ำ
    - **เฉพาะ DM** แชตกลุ่มจะไหลต่อไปยังการส่งต่อแบบต่อข้อความ เพื่อให้บอตยังตอบสนองได้ดีเมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้ได้ต่อแชนเนล** แชนเนลอื่น (Telegram, WhatsApp, Slack, …) จะไม่ได้รับผลกระทบ คอนฟิก BlueBubbles แบบเดิมที่ตั้งค่า `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปยัง `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่ agent เห็น

| ผู้ใช้แต่งข้อความ                                                      | `chat.db` สร้าง    | ปิดแฟล็ก (ค่าเริ่มต้น)                      | เปิดแฟล็ก + หน้าต่าง 2500 ms                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 แถวห่างกัน ~1 s     | agent สองรอบ: มีแต่ "Dump" แล้วค่อยเป็น URL | หนึ่งรอบ: ข้อความรวม `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถว                | สองรอบ (ไฟล์แนบถูกทิ้งตอนรวม) | หนึ่งรอบ: เก็บข้อความ + รูปภาพไว้                                        |
| `/status` (คำสั่งแบบเดี่ยว)                                     | 1 แถว                 | ส่งต่อทันที                        | **รอได้สูงสุดเท่าหน้าต่าง แล้วจึงส่งต่อ**                                    |
| วาง URL อย่างเดียว                                                   | 1 แถว                 | ส่งต่อทันที                        | ส่งต่อทันที (มีเพียงหนึ่งรายการใน bucket)                             |
| ข้อความ + URL ที่ตั้งใจส่งแยกเป็นสองข้อความ ห่างกันหลายนาที | 2 แถวนอกหน้าต่าง | สองรอบ                               | สองรอบ (หน้าต่างหมดอายุระหว่างกัน)                                 |
| ข้อความ DM ขนาดเล็กไหลเข้ามาเร็วมาก (>10 รายการในหน้าต่าง)                          | N แถว                | N รอบ                                 | หนึ่งรอบ เอาต์พุตมีขอบเขตจำกัด (รายการแรก + ล่าสุด และใช้ขีดจำกัดข้อความ/ไฟล์แนบ) |
| คนสองคนกำลังพิมพ์ในแชตกลุ่ม                                  | N แถวจากผู้ส่ง M คน | M+ รอบ (หนึ่งรอบต่อ bucket ของผู้ส่ง)        | M+ รอบ — แชตกลุ่มจะไม่ถูกรวม                                |

## การตามข้อมูลให้ทันหลัง Gateway หยุดทำงาน

เมื่อ Gateway ออฟไลน์ (แครช รีสตาร์ต Mac sleep ปิดเครื่อง) `imsg watch` จะดำเนินต่อจากสถานะ `chat.db` ปัจจุบันเมื่อ Gateway กลับมาทำงาน — โดยค่าเริ่มต้น สิ่งที่มาถึงระหว่างช่วงว่างจะไม่ถูกเห็นเลย Catchup จะเล่นข้อความเหล่านั้นซ้ำในการเริ่มทำงานครั้งถัดไป เพื่อให้ agent ไม่พลาดทราฟฟิกขาเข้าแบบเงียบ ๆ

Catchup ถูก **ปิดไว้โดยค่าเริ่มต้น** เปิดใช้ต่อแชนเนล:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### วิธีการทำงาน

หนึ่ง pass ต่อการเริ่มทำงานของ `monitorIMessageProvider` โดยเรียงลำดับเป็น `imsg launch` พร้อมใช้งาน → `watch.subscribe` → `performIMessageCatchup` → ลูปส่งต่อแบบ live ตัว Catchup เองใช้ `chats.list` + `messages.history` ต่อแชตผ่านไคลเอนต์ JSON-RPC เดียวกับที่ `imsg watch` ใช้ สิ่งใดก็ตามที่มาถึงระหว่าง pass ของ catchup จะไหลผ่านการส่งต่อแบบ live ตามปกติ; แคช inbound-dedupe ที่มีอยู่จะดูดซับส่วนที่ทับซ้อนกับแถวที่เล่นซ้ำ

แถวที่เล่นซ้ำแต่ละแถวจะถูกป้อนผ่านเส้นทางการส่งต่อแบบ live (`evaluateIMessageInbound` + `dispatchInboundMessage`) ดังนั้น allowlist, นโยบายกลุ่ม, debouncer, แคช echo และใบตอบรับการอ่าน จะทำงานเหมือนกันสำหรับข้อความที่เล่นซ้ำและข้อความ live

### ความหมายของ cursor และการ retry

Catchup เก็บ cursor ต่อบัญชีไว้ที่ `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (ไดเรกทอรีสถานะของ OpenClaw มีค่าเริ่มต้นเป็น `~/.openclaw` และ override ได้ด้วย `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- cursor จะเลื่อนไปข้างหน้าเมื่อส่งต่อสำเร็จแต่ละครั้ง และจะค้างไว้เมื่อการส่งต่อของแถวหนึ่ง throw — การเริ่มทำงานครั้งถัดไปจะ retry แถวเดิมจาก cursor ที่ค้างอยู่
- หลังจาก `maxFailureRetries` throw ติดต่อกันกับ `guid` เดียวกัน catchup จะ log `warn` และบังคับเลื่อน cursor ผ่านข้อความที่ค้างอยู่ เพื่อให้การเริ่มทำงานครั้งถัด ๆ ไปเดินหน้าต่อได้
- guid ที่เคยยอมแพ้ไปแล้วจะถูกข้ามทันทีที่เห็น (ไม่มีการพยายามส่งต่อ) ในรอบถัด ๆ ไป และนับอยู่ใต้ `skippedGivenUp` ในสรุปการรัน

### สัญญาณที่ operator มองเห็นได้

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

บรรทัด `WARN ... capped to perRunLimit` หมายความว่าการเริ่มทำงานครั้งเดียวไม่ได้ระบาย backlog ทั้งหมด เพิ่ม `perRunLimit` (สูงสุด 500) หากช่องว่างของคุณเกินค่าเริ่มต้น pass ละ 50 แถวเป็นประจำ

### เมื่อใดควรปล่อยให้ปิดไว้

- Gateway ทำงานต่อเนื่องพร้อม watchdog auto-restart และช่องว่างมักจะ < ไม่กี่วินาที — ค่าเริ่มต้นที่ปิดไว้ก็เหมาะสม
- ปริมาณ DM ต่ำและข้อความที่พลาดไปจะไม่เปลี่ยนพฤติกรรมของ agent — หน้าต่างเริ่มต้น `firstRunLookbackMinutes` อาจส่งต่อบริบทเก่าอย่างน่าประหลาดใจเมื่อเปิดใช้ครั้งแรก

เมื่อคุณเปิด catchup การเริ่มทำงานครั้งแรกที่ยังไม่มี cursor จะมองย้อนกลับไปเฉพาะ `firstRunLookbackMinutes` (ค่าเริ่มต้น 30 นาที) ไม่ใช่หน้าต่าง `maxAgeMinutes` ทั้งหมด — วิธีนี้หลีกเลี่ยงการเล่นประวัติยาว ๆ ของข้อความก่อนเปิดใช้ซ้ำ

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    ตรวจสอบ binary และการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากใช้งาน private API actions ไม่ได้ ให้รัน `imsg launch` ในเซสชันผู้ใช้ macOS ที่ล็อกอินอยู่ แล้ว probe อีกครั้ง หาก Gateway ไม่ได้รันบน macOS ให้ใช้การตั้งค่า Remote Mac over SSH ด้านบนแทนเส้นทาง `imsg` แบบ local เริ่มต้น

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    ค่าเริ่มต้น `cliPath: "imsg"` ต้องรันบน Mac ที่ลงชื่อเข้าใช้ Messages อยู่ บน Linux หรือ Windows ให้ตั้งค่า `channels.imessage.cliPath` เป็นสคริปต์ wrapper ที่ SSH ไปยัง Mac เครื่องนั้นและรัน `imsg "$@"`

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    จากนั้นรัน:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติการ pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การกำหนดค่ารูปแบบการ mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - host key มีอยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - ความสามารถในการอ่าน path ระยะไกลบน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    รันอีกครั้งในเทอร์มินัล GUI แบบ interactive ในบริบทผู้ใช้/เซสชันเดียวกัน แล้วอนุมัติ prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่าได้ให้สิทธิ์ Full Disk Access + Automation สำหรับบริบทของ process ที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังข้อมูลอ้างอิงการกำหนดค่า

- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [Pairing](/th/channels/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปลคอนฟิกและขั้นตอนการ cutover แบบทีละขั้น
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การ pairing
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการ gating ด้วย mention
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการ hardening
