---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC over stdio) พร้อมการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ การตอบกลับแบบแตะ เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์เหมาะสม
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการปรับใช้ OpenClaw iMessage ให้ใช้ `imsg` บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้แล้ว หาก Gateway ของคุณทำงานบน Linux หรือ Windows ให้ชี้ `channels.imessage.cliPath` ไปยัง SSH wrapper ที่รัน `imsg` บน Mac

**การตามเก็บหลัง Gateway หยุดทำงานเป็นแบบเลือกเปิดใช้** เมื่อเปิดใช้ (`channels.imessage.catchup.enabled: true`) Gateway จะเล่นซ้ำข้อความขาเข้าที่เข้ามาใน `chat.db` ขณะที่ออฟไลน์อยู่ (แครช รีสตาร์ต Mac sleep) ในการเริ่มทำงานครั้งถัดไป ปิดไว้โดยค่าเริ่มต้น — ดู [การตามเก็บหลัง Gateway หยุดทำงาน](#catching-up-after-gateway-downtime) ปิด [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกนำออกแล้ว ย้ายคอนฟิก `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การนำ BlueBubbles ออกและเส้นทาง imsg iMessage](/th/announcements/bluebubbles-imessage) สำหรับประกาศแบบสั้น หรือ [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายฉบับเต็ม
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway สร้าง `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/พอร์ตแยกต่างหาก) การดำเนินการขั้นสูงต้องใช้ `imsg launch` และการตรวจสอบ private API ที่สำเร็จ

<CardGroup cols={3}>
  <Card title="การดำเนินการ private API" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ, tapback, เอฟเฟกต์, ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Mac ระยะไกล" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ SSH wrapper เมื่อ Gateway ไม่ได้รันอยู่บน Messages Mac
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    ข้อมูลอ้างอิงฟิลด์ iMessage แบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ในเครื่อง (เส้นทางเร็ว)">
    <Steps>
      <Step title="ติดตั้งและตรวจสอบ imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="กำหนดค่า OpenClaw">

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

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="อนุมัติการจับคู่ DM ครั้งแรก (dmPolicy ค่าเริ่มต้น)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac ระยะไกลผ่าน SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณสามารถชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและรัน `imsg`

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    คอนฟิกที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

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
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรืออ็อปชัน SSH)
    OpenClaw ใช้การตรวจสอบ host key แบบเข้มงวดสำหรับ SCP ดังนั้น host key ของ relay ต้องมีอยู่ใน `~/.ssh/known_hosts` แล้ว
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่รัน `imsg`
- ต้องมี Full Disk Access สำหรับบริบทกระบวนการที่รัน OpenClaw/`imsg` (การเข้าถึง Messages DB)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการดำเนินการขั้นสูง (react / edit / unsend / threaded reply / effects / group ops) ต้องปิดใช้ System Integrity Protection — ดู [การเปิดใช้ imsg private API](#enabling-the-imsg-private-api) ด้านล่าง การส่ง/รับข้อความและสื่อพื้นฐานทำงานได้โดยไม่ต้องใช้สิ่งนี้

<Tip>
สิทธิ์จะถูกมอบให้ตามบริบทกระบวนการ หาก Gateway รันแบบไม่มีหน้าจอ (LaunchAgent/SSH) ให้รันคำสั่งแบบโต้ตอบครั้งเดียวในบริบทเดียวกันนั้นเพื่อเรียกพรอมป์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## การเปิดใช้ imsg private API

`imsg` มาพร้อมโหมดการทำงานสองแบบ:

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยน SIP): ข้อความและสื่อขาออกผ่าน `send`, การเฝ้าดู/ประวัติขาเข้า, รายการแชต นี่คือสิ่งที่ได้ทันทีจาก `brew install steipete/tap/imsg` ใหม่พร้อมสิทธิ์ macOS มาตรฐานด้านบน
- **โหมด Private API**: `imsg` inject helper dylib เข้าไปใน `Messages.app` เพื่อเรียกฟังก์ชัน `IMCore` ภายใน นี่คือสิ่งที่ปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบเธรด), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบตอบรับการอ่าน

เพื่อเข้าถึงพื้นผิวการดำเนินการขั้นสูงที่หน้านี้ของช่องทางเอกสารไว้ คุณต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่ง rich send ที่รองรับโดย bridge, การแก้ไขข้อความ และการจัดการแชต เป็นแบบเลือกเปิดใช้ สิ่งเหล่านี้ต้องปิดใช้ SIP และ inject helper dylib เข้าไปใน `Messages.app` `imsg launch` จะปฏิเสธการ inject เมื่อเปิดใช้ SIP อยู่

เทคนิค helper-injection ใช้ dylib ของ `imsg` เองเพื่อเข้าถึง private APIs ของ Messages ไม่มีเซิร์ฟเวอร์ของบุคคลที่สามหรือ runtime ของ BlueBubbles ในเส้นทาง OpenClaw iMessage

<Warning>
**การปิดใช้ SIP เป็นการแลกเปลี่ยนด้านความปลอดภัยที่มีผลจริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการรันโค้ดระบบที่ถูกแก้ไข การปิดแบบทั้งระบบจะเปิดพื้นผิวการโจมตีและผลข้างเคียงเพิ่มเติม โดยเฉพาะอย่างยิ่ง **การปิดใช้ SIP บน Apple Silicon Macs จะปิดความสามารถในการติดตั้งและรันแอป iOS บน Mac ของคุณด้วย**

ให้ถือว่านี่เป็นตัวเลือกเชิงปฏิบัติการโดยตั้งใจ ไม่ใช่ค่าเริ่มต้น หากโมเดลภัยคุกคามของคุณไม่สามารถยอมรับการปิด SIP ได้ iMessage ที่มาพร้อมแพ็กเกจจะจำกัดอยู่ที่โหมดพื้นฐาน — ส่ง/รับข้อความและสื่อเท่านั้น ไม่มี reactions / edit / unsend / effects / group ops
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` รายเมธอด เพื่อให้คุณเห็นว่าบิลด์ปัจจุบันรองรับอะไรบ้างก่อนเริ่มต้น

2. **ปิดใช้ System Integrity Protection** ขั้นตอนนี้ขึ้นกับเวอร์ชัน macOS เพราะข้อกำหนดของ Apple ที่อยู่เบื้องหลังขึ้นกับ OS และฮาร์ดแวร์:
   - **macOS 10.13–10.15 (Sierra–Catalina):** ปิดใช้ Library Validation ผ่าน Terminal, รีบูตเข้า Recovery Mode, รัน `csrutil disable`, รีสตาร์ต
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** Recovery Mode (หรือ Internet Recovery), `csrutil disable`, รีสตาร์ต
   - **macOS 11+, Apple Silicon:** ใช้ลำดับการเริ่มต้นด้วยปุ่มเปิดเครื่องเพื่อเข้า Recovery; บน macOS เวอร์ชันล่าสุดให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคลิก Continue แล้วจึง `csrutil disable` การตั้งค่าเครื่องเสมือนใช้โฟลว์แยกต่างหาก — ให้ทำ VM snapshot ก่อน
   - **macOS 26 / Tahoe:** นโยบาย library-validation และการตรวจสอบ private-entitlement ของ `imagent` เข้มงวดขึ้นอีก; `imsg` อาจต้องใช้บิลด์ที่อัปเดตเพื่อให้ตามทัน หากการ inject ของ `imsg launch` หรือ `selectors` บางรายการเริ่มคืนค่า false หลังการอัปเกรด macOS เวอร์ชันหลัก ให้ตรวจสอบ release notes ของ `imsg` ก่อนสรุปว่าขั้นตอน SIP สำเร็จแล้ว

   ทำตามโฟลว์ Recovery-mode ของ Apple สำหรับ Mac ของคุณเพื่อปิดใช้ SIP ก่อนรัน `imsg launch`

3. **Inject helper** เมื่อปิดใช้ SIP แล้วและ Messages.app ลงชื่อเข้าใช้แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการ inject เมื่อ SIP ยังเปิดใช้อยู่ ดังนั้นคำสั่งนี้ยังทำหน้าที่เป็นการยืนยันว่าขั้นตอนที่ 2 มีผลแล้ว

4. **ตรวจสอบ bridge จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '.selectors'` ควรแสดง `retractMessagePart: true` พร้อม edit / typing / read selectors ใดก็ตามที่บิลด์ macOS ของคุณเปิดเผย การ gate รายเมธอดของ Plugin OpenClaw ใน `actions.ts` จะโฆษณาเฉพาะการดำเนินการที่ selector พื้นฐานเป็น `true` ดังนั้นพื้นผิวการดำเนินการที่คุณเห็นในรายการเครื่องมือของ agent จึงสะท้อนสิ่งที่ bridge ทำได้จริงบนโฮสต์นี้

หาก `openclaw channels status --probe` รายงานช่องทางเป็น `works` แต่การดำเนินการเฉพาะโยนข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ตอน dispatch ให้รัน `imsg launch` อีกครั้ง — helper อาจหลุดออกไปได้ (Messages.app รีสตาร์ต, OS อัปเดต ฯลฯ) และสถานะ `available: true` ที่แคชไว้จะยังโฆษณาการดำเนินการต่อไปจนกว่า probe ครั้งถัดไปจะรีเฟรช

### เมื่อคุณไม่สามารถปิดใช้ SIP

หากการปิดใช้ SIP ไม่เป็นที่ยอมรับสำหรับโมเดลภัยคุกคามของคุณ:

- `imsg` จะ fallback ไปยังโหมดพื้นฐาน — ข้อความ + สื่อ + รับเท่านั้น
- Plugin ของ OpenClaw ยังคงโฆษณาการส่งข้อความ/สื่อและการติดตามขาเข้า เพียงแต่ซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และ group ops ออกจากพื้นผิวการดำเนินการ (ตาม gate ความสามารถรายเมธอด)
- คุณสามารถรัน Mac ที่ไม่ใช่ Apple Silicon แยกต่างหาก (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับงาน iMessage ขณะที่ยังเปิด SIP บนอุปกรณ์หลักของคุณ ดู [ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist อาจเป็น handles, กลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) หรือเป้าหมายแชต (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่าไว้)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` ยังสามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ได้ด้วย

    Runtime fallback: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่ม iMessage จะ fallback ไปยัง `allowFrom` เมื่อพร้อมใช้งาน
    หมายเหตุ runtime: หาก `channels.imessage` ขาดหายไปทั้งหมด runtime จะ fallback ไปยัง `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มมี gate allowlist **สอง** ชั้นที่ทำงานต่อกัน และทั้งสองชั้นต้องผ่าน:

    1. **allowlist ผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` หรือ `chat_id`
    2. **ทะเบียนกลุ่ม** (`channels.imessage.groups`) — เมื่อใช้ `groupPolicy: "allowlist"` gate นี้ต้องมีรายการ wildcard `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือรายการต่อ `chat_id` อย่างชัดเจนภายใต้ `groups`

    หาก gate 2 ไม่มีอะไรเลย ข้อความกลุ่มทุกข้อความจะถูกทิ้ง Plugin จะปล่อยสัญญาณระดับ `warn` สองรายการที่ระดับ log ค่าเริ่มต้น:

    - หนึ่งครั้งต่อบัญชีตอนเริ่มต้น: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - หนึ่งครั้งต่อ `chat_id` ตอน runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM ยังคงทำงานต่อไป เพราะใช้เส้นทางโค้ดที่แตกต่างกัน

    คอนฟิกขั้นต่ำเพื่อให้กลุ่มยังไหลต่อภายใต้ `groupPolicy: "allowlist"`:

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

    หากบรรทัด `warn` เหล่านั้นปรากฏในบันทึก Gateway แสดงว่าเกต 2 กำลังตัดทิ้ง — ให้เพิ่มบล็อก `groups`
    </Warning>

    กล่าวถึงการ gate สำหรับกลุ่ม:

    - iMessage ไม่มีข้อมูลเมตาการ mention แบบเนทีฟ
    - การตรวจจับ mention ใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - หากไม่มีรูปแบบที่กำหนดไว้ จะไม่สามารถบังคับใช้การ gate ด้วย mention ได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการ gate ด้วย mention ในกลุ่มได้

    `systemPrompt` ต่อกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` รับสตริง `systemPrompt` ที่ไม่บังคับ ค่าเหล่านี้จะถูกแทรกเข้าไปใน system prompt ของเอเจนต์ทุก turn ที่จัดการข้อความในกลุ่มนั้น การ resolve สะท้อนการ resolve prompt ต่อกลุ่มที่ใช้โดย `channels.whatsapp.groups`:

    1. **system prompt เฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อรายการกลุ่มที่เจาะจงมีอยู่ใน map **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มี system prompt ถูกนำไปใช้กับกลุ่มนั้น
    2. **system prompt แบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มที่เจาะจงไม่มีอยู่ใน map เลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

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

    prompt ต่อกลุ่มมีผลเฉพาะกับข้อความกลุ่มเท่านั้น — ข้อความโดยตรงในช่องทางนี้ไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM ใช้ direct routing; กลุ่มใช้ group routing
    - ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับ route กลับไปยัง iMessage โดยใช้ข้อมูลเมตาของช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางเธรดอาจมาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (การ gate ของกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมสามารถผูกกับเซสชัน ACP ได้เช่นกัน

โฟลว์ผู้ปฏิบัติการแบบเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันนั้นจะ route ไปยังเซสชัน ACP ที่ spawn ไว้
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

รองรับการผูกแบบถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- handle DM ที่ normalize แล้ว เช่น `+15555550123` หรือ `user@example.com`
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    ใช้ Apple ID และผู้ใช้ macOS เฉพาะ เพื่อแยกทราฟฟิกบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw รัน `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องได้รับอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    topology ทั่วไป:

    - Gateway รันบน Linux/VM
    - iMessage + `imsg` รันบน Mac ใน tailnet ของคุณ
    - `cliPath` wrapper ใช้ SSH เพื่อรัน `imsg`
    - `remoteHost` เปิดใช้งานการ fetch ไฟล์แนบผ่าน SCP

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

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ไม่ต้องโต้ตอบ
    ตรวจให้แน่ใจว่า host key ได้รับความเชื่อถือก่อน (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage รองรับการกำหนดค่าต่อบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ต่าง ๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist ของรากไฟล์แนบ

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่ง chunk และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="Attachments and media">
    - การ ingest ไฟล์แนบขาเข้า **ปิดตามค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ voice memo วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดอยู่ iMessage ที่มีเฉพาะไฟล์แนบจะถูกตัดทิ้งก่อนถึงเอเจนต์ และอาจไม่มีบรรทัดบันทึก `Inbound message` เลย
    - path ไฟล์แนบระยะไกลสามารถ fetch ผ่าน SCP ได้เมื่อมีการตั้งค่า `remoteHost`
    - path ไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - ขีดจำกัด chunk ข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมด chunk: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งตามย่อหน้าก่อน)

  </Accordion>

  <Accordion title="Addressing formats">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับ routing ที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับเป้าหมายแบบ handle ด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## การทำงานของ Private API

เมื่อ `imsg launch` กำลังรันและ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความสามารถใช้การทำงานแบบเนทีฟของ iMessage เพิ่มเติมจากการส่งข้อความปกติได้

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
  <Accordion title="Available actions">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับ map ไปยัง love, like, dislike, laugh, emphasize และ question
    - **reply**: ส่งการตอบกลับแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message`, พร้อม `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`)
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`)
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/private API ที่รองรับ (`messageId`, `text` หรือ `newText`)
    - **unsend**: ถอนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/private API ที่รองรับ (`messageId`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` เป็น base64 หรือ `media`/`path`/`filePath` ที่ hydrate แล้ว, `filename`, `asVoice` ที่ไม่บังคับ) alias เดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อเป้าหมายปัจจุบันเป็นบทสนทนากลุ่ม

  </Accordion>

  <Accordion title="Message IDs">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็มเมื่อมี ID แบบสั้นมีขอบเขตอยู่ในแคชการตอบกลับในหน่วยความจำล่าสุด และจะถูกตรวจเทียบกับแชตปัจจุบันก่อนใช้ หาก ID แบบสั้นหมดอายุหรือเป็นของแชตอื่น ให้ลองใหม่ด้วย `MessageSidFull` แบบเต็ม

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw ซ่อนการทำงานของ private API เฉพาะเมื่อสถานะ probe ที่แคชไว้ระบุว่า bridge ไม่พร้อมใช้งาน หากไม่ทราบสถานะ การทำงานจะยังคงมองเห็นได้และ dispatch จะ probe แบบ lazy เพื่อให้การทำงานแรกสำเร็จหลัง `imsg launch` ได้โดยไม่ต้อง refresh สถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="Read receipts and typing">
    เมื่อ private API bridge พร้อมใช้งาน แชตขาเข้าที่ accepted จะถูกทำเครื่องหมายว่าอ่านแล้วก่อน dispatch และจะแสดง typing bubble ให้ผู้ส่งเห็นระหว่างที่เอเจนต์กำลัง generate ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    build `imsg` รุ่นเก่าที่มาก่อนรายการ capability ต่อเมธอดจะ gate typing/read ออกแบบเงียบ ๆ; OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการ restart เพื่อให้ระบุสาเหตุของ receipt ที่หายไปได้

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw subscribe กับ tapback ของ iMessage และ route reaction ที่ accepted เป็นเหตุการณ์ระบบแทนข้อความปกติ ดังนั้น tapback จากผู้ใช้จะไม่ทำให้เกิดลูปการตอบกลับปกติ

    โหมดการแจ้งเตือนควบคุมโดย `channels.imessage.reactionNotifications`:

    - `"own"` (ค่าเริ่มต้น): แจ้งเตือนเฉพาะเมื่อผู้ใช้ react ต่อข้อความที่บอตเป็นผู้เขียน
    - `"all"`: แจ้งเตือนสำหรับ tapback ขาเข้าทั้งหมดจากผู้ส่งที่ได้รับอนุญาต
    - `"off"`: ไม่สนใจ tapback ขาเข้า

    override ต่อบัญชีใช้ `channels.imessage.accounts.<id>.reactionNotifications`

  </Accordion>
</AccordionGroup>

## การเขียน config

iMessage อนุญาตการเขียน config ที่เริ่มจากช่องทางตามค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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

## การรวม DM ที่ถูกส่งแบบแยก (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน — เช่น `Dump https://example.com/article` — แอป Messages ของ Apple จะแยกการส่งออกเป็น **สองแถว `chat.db` แยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ

สองแถวนี้จะมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีใน setup ส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งใน turn 1 แล้วตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และเห็น URL เฉพาะใน turn 2 — ซึ่งเมื่อถึงจุดนั้นบริบทของคำสั่งก็หายไปแล้ว นี่คือ pipeline การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` เพิ่มเข้ามา

`channels.imessage.coalesceSameSenderDms` เลือกให้ DM ผสานแถวต่อเนื่องจากผู้ส่งคนเดียวกันเป็นเทิร์นเอเจนต์เดียว แชตกลุ่มยังคง dispatch แยกตามข้อความ เพื่อคงโครงสร้างเทิร์นแบบผู้ใช้หลายคนไว้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue เป็นต้น)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
    - คุณยอมรับ latency เทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปิดไว้เมื่อ:

    - คุณต้องการ latency คำสั่งต่ำสุดสำหรับ trigger DM แบบคำเดียว
    - Flow ทั้งหมดของคุณเป็นคำสั่งแบบ one-shot โดยไม่มี payload ตามมา

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

    เมื่อเปิด flag และไม่มี `messages.inbound.byChannel.imessage` ที่กำหนดไว้อย่างชัดเจน ช่วงเวลา debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นแบบ legacy คือ 0 ms — ไม่มี debouncing) ต้องใช้ช่วงเวลาที่กว้างขึ้น เพราะจังหวะ split-send ของ Apple ที่ 0.8-2.0 s ไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

    หากต้องการปรับช่วงเวลาเอง:

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
  <Tab title="ข้อแลกเปลี่ยน">
    - **latency เพิ่มขึ้นสำหรับข้อความ DM** เมื่อเปิด flag ทุก DM (รวมถึงคำสั่งควบคุมแบบเดี่ยวและ follow-up ข้อความเดียว) จะรอจนถึงช่วงเวลา debounce ก่อน dispatch เผื่อว่ากำลังจะมีแถว payload ตามมา ข้อความแชตกลุ่มยัง dispatch ทันที
    - **ผลลัพธ์ที่ผสานแล้วมีขอบเขตจำกัด** ข้อความที่ผสานจำกัดที่ 4000 chars พร้อม marker `…[truncated]` ที่ชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (เก็บรายการแรกและล่าสุดไว้เมื่อเกินกว่านั้น) GUID ต้นทางทุกตัวถูกติดตามใน `coalescedMessageGuids` สำหรับ telemetry ปลายทาง
    - **เฉพาะ DM เท่านั้น** แชตกลุ่มจะตกไปใช้การ dispatch แยกตามข้อความ เพื่อให้บอตยังตอบสนองได้เมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้ได้ต่อ channel** channel อื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ config BlueBubbles แบบ legacy ที่ตั้ง `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปที่ `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                      | `chat.db` สร้าง    | ปิด flag (ค่าเริ่มต้น)                      | เปิด flag + ช่วงเวลา 2500 ms                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 แถว ห่างกัน ~1 s     | สองเทิร์นเอเจนต์: "Dump" อย่างเดียว แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความที่ผสาน `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถว                | สองเทิร์น (ไฟล์แนบถูกทิ้งเมื่อผสาน) | หนึ่งเทิร์น: เก็บข้อความ + รูปภาพไว้                                        |
| `/status` (คำสั่งเดี่ยว)                                     | 1 แถว                 | dispatch ทันที                        | **รอจนถึงช่วงเวลา แล้ว dispatch**                                    |
| วาง URL อย่างเดียว                                                   | 1 แถว                 | dispatch ทันที                        | dispatch ทันที (มีเพียงหนึ่ง entry ใน bucket)                             |
| ข้อความ + URL ที่ตั้งใจส่งเป็นสองข้อความแยกกัน ห่างกันหลายนาที | 2 แถวนอกช่วงเวลา | สองเทิร์น                               | สองเทิร์น (ช่วงเวลาหมดอายุระหว่างกัน)                                 |
| flood อย่างรวดเร็ว (>10 DM สั้นภายในช่วงเวลา)                          | N แถว                | N เทิร์น                                 | หนึ่งเทิร์น ผลลัพธ์มีขอบเขตจำกัด (แรก + ล่าสุด พร้อมใช้ขีดจำกัดข้อความ/ไฟล์แนบ) |
| สองคนพิมพ์ในแชตกลุ่ม                                  | N แถวจากผู้ส่ง M คน | M+ เทิร์น (หนึ่งต่อ sender bucket)        | M+ เทิร์น — แชตกลุ่มไม่ถูก coalesce                                |

## การตามข้อมูลให้ทันหลัง Gateway หยุดทำงาน

เมื่อ Gateway ออฟไลน์ (crash, restart, Mac sleep, ปิดเครื่อง) `imsg watch` จะ resume จากสถานะ `chat.db` ปัจจุบันเมื่อ Gateway กลับขึ้นมา — โดยค่าเริ่มต้น สิ่งใดก็ตามที่มาถึงระหว่างช่องว่างนั้นจะไม่ถูกเห็นเลย Catchup จะ replay ข้อความเหล่านั้นในการ startup ครั้งถัดไป เพื่อให้เอเจนต์ไม่พลาด traffic ขาเข้าแบบเงียบ ๆ

Catchup **ปิดไว้โดยค่าเริ่มต้น** เปิดใช้ต่อ channel:

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

หนึ่ง pass ต่อการ startup ของ `monitorIMessageProvider` โดยเรียงลำดับเป็น `imsg launch` ready → `watch.subscribe` → `performIMessageCatchup` → live dispatch loop ตัว Catchup เองใช้ `chats.list` + `messages.history` ต่อแชต ผ่าน JSON-RPC client เดียวกับที่ `imsg watch` ใช้ สิ่งใดก็ตามที่มาถึงระหว่าง pass ของ catchup จะไหลผ่าน live dispatch ตามปกติ; inbound-dedupe cache ที่มีอยู่จะดูดซับส่วนที่ซ้อนกับแถวที่ replay

แต่ละแถวที่ replay จะถูกป้อนผ่านเส้นทาง live dispatch (`evaluateIMessageInbound` + `dispatchInboundMessage`) ดังนั้น allowlist, นโยบายกลุ่ม, debouncer, echo cache และ read receipts จึงทำงานเหมือนกันทั้งกับข้อความที่ replay และข้อความ live

### semantics ของ cursor และ retry

Catchup เก็บ cursor ต่อบัญชีไว้ที่ `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (ค่าเริ่มต้นของ state dir ของ OpenClaw คือ `~/.openclaw` และ override ได้ด้วย `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- cursor จะเลื่อนไปข้างหน้าเมื่อ dispatch สำเร็จแต่ละครั้ง และจะค้างไว้เมื่อ dispatch ของแถวหนึ่ง throw — startup ครั้งถัดไปจะ retry แถวเดิมจาก cursor ที่ค้างไว้
- หลังจาก `maxFailureRetries` throw ติดต่อกันกับ `guid` เดียวกัน catchup จะ log `warn` และบังคับเลื่อน cursor ข้ามข้อความที่ติดค้าง เพื่อให้ startup ถัดไปเดินหน้าต่อได้
- guid ที่ยอมแพ้ไปแล้วจะถูกข้ามเมื่อพบ (ไม่มีการพยายาม dispatch) ในรอบต่อมา และนับอยู่ใต้ `skippedGivenUp` ในสรุปการรัน

### สัญญาณที่ operator มองเห็น

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

บรรทัด `WARN ... capped to perRunLimit` หมายความว่า startup ครั้งเดียวไม่ได้ drain backlog ทั้งหมด เพิ่ม `perRunLimit` (สูงสุด 500) หากช่องว่างของคุณมักเกิน pass ค่าเริ่มต้น 50 แถว

### เมื่อใดควรปิดไว้

- Gateway รันต่อเนื่องพร้อม watchdog auto-restart และช่องว่างมักน้อยกว่าไม่กี่วินาที — ค่าเริ่มต้นที่ปิดไว้ใช้ได้ดี
- ปริมาณ DM ต่ำ และข้อความที่พลาดไปจะไม่เปลี่ยนพฤติกรรมเอเจนต์ — ช่วงเวลาเริ่มต้น `firstRunLookbackMinutes` อาจ dispatch context เก่าที่น่าประหลาดใจเมื่อเปิดใช้ครั้งแรก

เมื่อคุณเปิด catchup การ startup ครั้งแรกที่ไม่มี cursor จะมองย้อนกลับเพียง `firstRunLookbackMinutes` (ค่าเริ่มต้น 30 min) ไม่ใช่ช่วงเวลา `maxAgeMinutes` ทั้งหมด — วิธีนี้หลีกเลี่ยงการ replay ประวัติยาว ๆ ของข้อความก่อนเปิดใช้

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบ binary และการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากการทำงาน private API ใช้งานไม่ได้ ให้รัน `imsg launch` ใน session ผู้ใช้ macOS ที่ login อยู่ แล้ว probe อีกครั้ง หาก Gateway ไม่ได้รันบน macOS ให้ใช้การตั้งค่า Remote Mac ผ่าน SSH ด้านบนแทน path `imsg` แบบ local เริ่มต้น

  </Accordion>

  <Accordion title="Gateway ไม่ได้รันบน macOS">
    ค่าเริ่มต้น `cliPath: "imsg"` ต้องรันบน Mac ที่ sign in เข้า Messages อยู่ บน Linux หรือ Windows ให้ตั้ง `channels.imessage.cliPath` เป็น wrapper script ที่ SSH ไปยัง Mac เครื่องนั้นและรัน `imsg "$@"`

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    จากนั้นรัน:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM ถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing approvals (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การกำหนดค่า mention pattern (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบ remote ล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP key auth จาก host ของ Gateway
    - มี host key อยู่ใน `~/.ssh/known_hosts` บน host ของ Gateway
    - ความสามารถในการอ่าน remote path บน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาด prompt สิทธิ์ของ macOS">
    รันซ้ำใน terminal GUI แบบ interactive ใน context ผู้ใช้/session เดียวกัน และอนุมัติ prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่า Full Disk Access + Automation ถูกอนุญาตให้กับ process context ที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

- [เอกสารอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [Pairing](/th/channels/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channel ทั้งหมดที่รองรับ
- [การนำ BlueBubbles ออกและ path iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้าย
- [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปล config และขั้นตอน cutover ทีละขั้น
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การ route session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการ hardening
