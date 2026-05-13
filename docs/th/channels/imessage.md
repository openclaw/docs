---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio) พร้อมการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ การโต้ตอบแบบแตะกลับ เอฟเฟกต์ ไฟล์แนบ และการจัดการกลุ่ม แนะนำให้ใช้สำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์เหมาะสม
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการปรับใช้ OpenClaw iMessage ให้ใช้ `imsg` บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้แล้ว หาก Gateway ของคุณทำงานบน Linux หรือ Windows ให้ชี้ `channels.imessage.cliPath` ไปยังตัวครอบ SSH ที่เรียกใช้ `imsg` บน Mac

**การตามเก็บข้อความช่วง Gateway หยุดทำงานเป็นแบบเลือกเปิดใช้** เมื่อเปิดใช้ (`channels.imessage.catchup.enabled: true`) Gateway จะเล่นซ้ำข้อความขาเข้าที่เข้ามาใน `chat.db` ขณะที่ออฟไลน์อยู่ (แครช รีสตาร์ต Mac sleep) ในการเริ่มต้นครั้งถัดไป ปิดไว้โดยค่าเริ่มต้น — ดู [การตามเก็บหลังจาก Gateway หยุดทำงาน](#catching-up-after-gateway-downtime) ปิด [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกนำออกแล้ว ย้ายการกำหนดค่า `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การนำ BlueBubbles ออกและเส้นทาง imsg iMessage](/th/announcements/bluebubbles-imessage) สำหรับประกาศสั้น ๆ หรือ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายฉบับเต็ม
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway สร้างโปรเซส `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มีดีมอน/พอร์ตแยกต่างหาก) การกระทำขั้นสูงต้องใช้ `imsg launch` และการตรวจสอบ private API ที่สำเร็จ

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ, tapback, เอฟเฟกต์, ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ตัวครอบ SSH เมื่อ Gateway ไม่ได้ทำงานบน Mac ที่ใช้ Messages
  </Card>
  <Card title="Configuration reference" icon="settings" href="/th/gateway/config-channels#imessage">
    อ้างอิงฟิลด์ iMessage ฉบับเต็ม
  </Card>
</CardGroup>

## ตั้งค่าอย่างรวดเร็ว

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

        คำขอจับคู่หมดอายุหลังจาก 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณสามารถชี้ `cliPath` ไปยังสคริปต์ตัวครอบที่ SSH ไปยัง Mac ระยะไกลและเรียกใช้ `imsg`

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    การกำหนดค่าที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

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

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจหาโดยอัตโนมัติด้วยการแยกวิเคราะห์สคริปต์ตัวครอบ SSH
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบคีย์โฮสต์แบบเข้มงวดสำหรับ SCP ดังนั้นคีย์โฮสต์รีเลย์ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์อนุญาต (macOS)

- Messages ต้องลงชื่อเข้าใช้บน Mac ที่เรียกใช้ `imsg`
- ต้องมี Full Disk Access สำหรับบริบทโปรเซสที่เรียกใช้ OpenClaw/`imsg` (การเข้าถึงฐานข้อมูล Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการกระทำขั้นสูง (react / edit / unsend / threaded reply / effects / group ops) ต้องปิด System Integrity Protection — ดู [การเปิดใช้ imsg private API](#enabling-the-imsg-private-api) ด้านล่าง การส่ง/รับข้อความพื้นฐานและสื่อใช้งานได้โดยไม่ต้องปิด

<Tip>
สิทธิ์อนุญาตจะให้ตามบริบทโปรเซส หาก Gateway ทำงานแบบไม่มีหน้าจอ (LaunchAgent/SSH) ให้เรียกคำสั่งแบบโต้ตอบครั้งเดียวในบริบทเดียวกันนั้นเพื่อกระตุ้นพร้อมต์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## การเปิดใช้ imsg private API

`imsg` มาพร้อมโหมดการทำงานสองโหมด:

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยน SIP): ข้อความและสื่อขาออกผ่าน `send`, การเฝ้าดู/ประวัติขาเข้า, รายการแชท นี่คือสิ่งที่คุณได้ทันทีจากการติดตั้ง `brew install steipete/tap/imsg` ใหม่พร้อมสิทธิ์ macOS มาตรฐานด้านบน
- **โหมด Private API**: `imsg` ฉีด helper dylib เข้าไปใน `Messages.app` เพื่อเรียกฟังก์ชัน `IMCore` ภายใน นี่คือสิ่งที่ปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบเธรด), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบตอบรับการอ่าน

เพื่อเข้าถึงพื้นผิวการกระทำขั้นสูงที่หน้าช่องทางนี้บันทึกไว้ คุณต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่งแบบ rich ที่หนุนด้วยบริดจ์, การเปลี่ยนแปลงข้อความ และการจัดการแชท เป็นแบบเลือกเปิดใช้ ฟีเจอร์เหล่านี้ต้องปิด SIP และต้องฉีด helper dylib เข้าไปใน `Messages.app` `imsg launch` จะปฏิเสธการฉีดเมื่อเปิดใช้ SIP อยู่

เทคนิคการฉีด helper ใช้ dylib ของ `imsg` เองเพื่อเข้าถึง private API ของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือรันไทม์ BlueBubbles ในเส้นทาง OpenClaw iMessage

<Warning>
**การปิด SIP เป็นการแลกเปลี่ยนด้านความปลอดภัยจริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการเรียกใช้โค้ดระบบที่ถูกแก้ไข การปิดทั้งระบบจะเพิ่มพื้นผิวการโจมตีและผลข้างเคียงเพิ่มเติม โดยเฉพาะอย่างยิ่ง **การปิด SIP บน Mac Apple Silicon ยังปิดความสามารถในการติดตั้งและเรียกใช้แอป iOS บน Mac ของคุณด้วย**

ให้ถือว่านี่เป็นตัวเลือกการปฏิบัติงานโดยเจตนา ไม่ใช่ค่าเริ่มต้น หากโมเดลภัยคุกคามของคุณยอมรับการปิด SIP ไม่ได้ iMessage ที่รวมมาให้จะจำกัดอยู่ที่โหมดพื้นฐาน — ส่ง/รับข้อความและสื่อเท่านั้น ไม่มี reactions / edit / unsend / effects / group ops
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่เรียกใช้ Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` รายเมธอด เพื่อให้คุณเห็นว่าบิลด์ปัจจุบันรองรับอะไรบ้างก่อนเริ่มใช้งาน

2. **ปิด System Integrity Protection** ขั้นตอนนี้ขึ้นกับเวอร์ชัน macOS เพราะข้อกำหนดของ Apple ที่อยู่เบื้องหลังขึ้นกับ OS และฮาร์ดแวร์:
   - **macOS 10.13–10.15 (Sierra–Catalina):** ปิด Library Validation ผ่าน Terminal, รีบูตเข้าสู่ Recovery Mode, เรียกใช้ `csrutil disable`, รีสตาร์ต
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** Recovery Mode (หรือ Internet Recovery), `csrutil disable`, รีสตาร์ต
   - **macOS 11+, Apple Silicon:** ลำดับการเริ่มต้นด้วยปุ่มเปิด/ปิดเพื่อเข้าสู่ Recovery; บน macOS เวอร์ชันล่าสุดให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคลิก Continue แล้วจึง `csrutil disable` การตั้งค่าเครื่องเสมือนใช้ขั้นตอนแยกต่างหาก — ให้ถ่ายสแนปช็อต VM ก่อน
   - **macOS 26 / Tahoe:** นโยบาย library-validation และการตรวจสอบ private-entitlement ของ `imagent` เข้มงวดขึ้นอีก; `imsg` อาจต้องใช้บิลด์ที่อัปเดตเพื่อให้ตามทัน หากการฉีด `imsg launch` หรือ `selectors` เฉพาะเริ่มคืนค่า false หลังจากอัปเกรด macOS รุ่นหลัก ให้ตรวจสอบบันทึกประจำรุ่นของ `imsg` ก่อนสรุปว่าขั้นตอน SIP สำเร็จ

   ทำตามขั้นตอน Recovery-mode ของ Apple สำหรับ Mac ของคุณเพื่อปิด SIP ก่อนเรียกใช้ `imsg launch`

3. **ฉีด helper** เมื่อปิด SIP และ Messages.app ลงชื่อเข้าใช้แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการฉีดเมื่อ SIP ยังเปิดอยู่ ดังนั้นคำสั่งนี้จึงใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 มีผลแล้ว

4. **ตรวจสอบบริดจ์จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '.selectors'` ควรแสดง `retractMessagePart: true` พร้อมกับ selector สำหรับ edit / typing / read ใด ๆ ที่บิลด์ macOS ของคุณเปิดเผย การกั้นตามเมธอดของ Plugin OpenClaw ใน `actions.ts` จะโฆษณาเฉพาะการกระทำที่ selector พื้นฐานเป็น `true` ดังนั้นพื้นผิวการกระทำที่คุณเห็นในรายการเครื่องมือของเอเจนต์จะสะท้อนสิ่งที่บริดจ์ทำได้จริงบนโฮสต์นี้

หาก `openclaw channels status --probe` รายงานว่าช่องทางเป็น `works` แต่การกระทำเฉพาะโยนข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ขณะ dispatch ให้เรียกใช้ `imsg launch` อีกครั้ง — helper อาจหลุดออกไปได้ (Messages.app รีสตาร์ต, อัปเดต OS ฯลฯ) และสถานะ `available: true` ที่แคชไว้จะยังคงโฆษณาการกระทำจนกว่าการ probe ครั้งถัดไปจะรีเฟรช

### เมื่อคุณปิด SIP ไม่ได้

หากการปิด SIP ไม่เป็นที่ยอมรับสำหรับโมเดลภัยคุกคามของคุณ:

- `imsg` จะถอยกลับไปใช้โหมดพื้นฐาน — ข้อความ + สื่อ + การรับเท่านั้น
- Plugin OpenClaw ยังคงโฆษณาการส่งข้อความ/สื่อและการเฝ้าดูขาเข้า เพียงแต่ซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และ group ops จากพื้นผิวการกระทำ (ตามการกั้นความสามารถรายเมธอด)
- คุณสามารถเรียกใช้ Mac ที่ไม่ใช่ Apple Silicon แยกต่างหาก (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับภาระงาน iMessage ในขณะที่ยังคงเปิด SIP บนอุปกรณ์หลักของคุณ ดู [ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist ต้องระบุผู้ส่ง: handle หรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ใช้ `channels.imessage.groupAllowFrom` สำหรับเป้าหมายแชท เช่น `chat_id:*`, `chat_guid:*` หรือ `chat_identifier:*`; ใช้ `channels.imessage.groups` สำหรับคีย์รีจิสทรี `chat_id` แบบตัวเลข

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่า)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` ยังสามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ได้ด้วย

    ทางสำรองขณะรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่ม iMessage จะใช้ `allowFrom`; ตั้งค่า `groupAllowFrom` เมื่อการรับ DM และกลุ่มควรแตกต่างกัน
    หมายเหตุรันไทม์: หาก `channels.imessage` หายไปทั้งหมด รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มมีเกต allowlist **สอง** ชั้นที่ทำงานต่อกัน และทั้งสองต้องผ่าน:

    1. **allowlist ผู้ส่ง / เป้าหมายแชท** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` หรือ `chat_id`
    2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — เมื่อใช้ `groupPolicy: "allowlist"` เกตนี้ต้องมีรายการไวลด์การ์ด `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือรายการต่อ `chat_id` ที่ชัดเจนภายใต้ `groups`

    หากเกต 2 ไม่มีอะไรอยู่ในนั้น ข้อความกลุ่มทุกข้อความจะถูกทิ้ง Plugin จะส่งสัญญาณระดับ `warn` สองรายการที่ระดับล็อกเริ่มต้น:

    - หนึ่งครั้งต่อบัญชีเมื่อเริ่มต้น: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - หนึ่งครั้งต่อ `chat_id` ขณะรันไทม์: `imessage: dropping group message from chat_id=<id> ...`

    DM ยังคงทำงานต่อไปเพราะใช้เส้นทางโค้ดคนละเส้นทาง

    การกำหนดค่าขั้นต่ำเพื่อให้กลุ่มยังไหลต่อภายใต้ `groupPolicy: "allowlist"`:

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

    หากบรรทัด `warn` เหล่านั้นปรากฏในบันทึก Gateway แสดงว่าเกต 2 กำลังทิ้งข้อความอยู่ — ให้เพิ่มบล็อก `groups`
    </Warning>

    การควบคุมด้วยการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมตาดาตาการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, สำรองเป็น `messages.groupChat.mentionPatterns`)
    - หากไม่ได้กำหนดรูปแบบไว้ จะไม่สามารถบังคับใช้การควบคุมด้วยการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการควบคุมด้วยการกล่าวถึงในกลุ่มได้

    `systemPrompt` รายกลุ่ม:

    แต่ละรายการใต้ `channels.imessage.groups.*` รองรับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกฉีดเข้าไปในพรอมป์ระบบของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น การแก้ค่าจะสะท้อนการแก้พรอมป์รายกลุ่มที่ใช้โดย `channels.whatsapp.groups`:

    1. **พรอมป์ระบบเฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อมีรายการกลุ่มเฉพาะนั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) ระบบจะระงับไวลด์การ์ดและจะไม่ใช้พรอมป์ระบบกับกลุ่มนั้น
    2. **พรอมป์ระบบไวลด์การ์ดของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มเฉพาะนั้นในแมปเลย หรือเมื่อมีรายการอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

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

    พรอมป์รายกลุ่มใช้กับข้อความกลุ่มเท่านั้น — ข้อความโดยตรงในช่องทางนี้จะไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดแน่นอน">
    - ข้อความโดยตรงใช้การกำหนดเส้นทางโดยตรง ส่วนกลุ่มใช้การกำหนดเส้นทางแบบกลุ่ม
    - เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` ข้อความโดยตรงของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกกำหนดเส้นทางกลับไปยัง iMessage โดยใช้เมตาดาตาช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางรายการอาจเข้ามาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดไว้อย่างชัดเจนใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (การควบคุมกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมยังสามารถผูกกับเซสชัน ACP ได้ด้วย

โฟลว์ผู้ปฏิบัติงานแบบเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายในข้อความโดยตรงหรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในการสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

รองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการระดับบนสุด `bindings[]` ที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- แฮนเดิลข้อความโดยตรงที่ทำให้เป็นมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
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

## รูปแบบการดีพลอย

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS เฉพาะ เพื่อแยกทราฟฟิกบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw เรียกใช้ `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การเรียกใช้ครั้งแรกอาจต้องมีการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - Gateway ทำงานบน Linux/VM
    - iMessage + `imsg` ทำงานบน Mac ใน tailnet ของคุณ
    - wrapper `cliPath` ใช้ SSH เพื่อเรียกใช้ `imsg`
    - `remoteHost` เปิดใช้งานการดึงไฟล์แนบผ่าน SCP

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
    ตรวจสอบให้แน่ใจก่อนว่าโฮสต์คีย์ได้รับความเชื่อถือแล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่ารายบัญชีใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถแทนที่ฟิลด์ต่าง ๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist ของรากไฟล์แนบ

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งชิ้น และเป้าหมายการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การนำเข้าไฟล์แนบขาเข้า **ปิดอยู่โดยค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ บันทึกเสียง วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดใช้งาน ข้อความ iMessage ที่มีเฉพาะไฟล์แนบจะถูกทิ้งก่อนถึงเอเจนต์ และอาจไม่สร้างบรรทัดบันทึก `Inbound message` เลย
    - เส้นทางไฟล์แนบระยะไกลสามารถดึงผ่าน SCP ได้เมื่อตั้งค่า `remoteHost`
    - เส้นทางไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบโฮสต์คีย์แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งชิ้นขาออก">
    - ขีดจำกัดชิ้นข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งชิ้น: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งโดยยึดย่อหน้าก่อน)

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบชัดเจนที่แนะนำ:

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

## แอ็กชัน Private API

เมื่อ `imsg launch` กำลังทำงานและ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความสามารถใช้แอ็กชันเนทีฟของ iMessage เพิ่มเติมจากการส่งข้อความปกติได้

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
  <Accordion title="แอ็กชันที่ใช้ได้">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับแมปไปยัง love, like, dislike, laugh, emphasize และ question
    - **reply**: ส่งการตอบกลับแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message` รวมถึง `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`)
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`)
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/Private API ที่รองรับ (`messageId`, `text` หรือ `newText`)
    - **unsend**: ถอนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/Private API ที่รองรับ (`messageId`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` เป็น base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, `asVoice` แบบไม่บังคับ) นามแฝงแบบเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อเป้าหมายปัจจุบันเป็นการสนทนากลุ่ม

  </Accordion>

  <Accordion title="รหัสข้อความ">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็มเมื่อมี รหัสแบบสั้นมีขอบเขตอยู่ในแคชการตอบกลับในหน่วยความจำล่าสุด และจะถูกตรวจสอบกับแชตปัจจุบันก่อนใช้งาน หากรหัสแบบสั้นหมดอายุหรือเป็นของแชตอื่น ให้ลองใหม่ด้วย `MessageSidFull` แบบเต็ม

  </Accordion>

  <Accordion title="การตรวจจับความสามารถ">
    OpenClaw จะซ่อนแอ็กชัน Private API เฉพาะเมื่อสถานะ probe ที่แคชไว้ระบุว่า bridge ไม่พร้อมใช้งาน หากไม่ทราบสถานะ แอ็กชันจะยังคงแสดงอยู่ และ dispatch จะ probe แบบ lazy เพื่อให้แอ็กชันแรกสำเร็จได้หลัง `imsg launch` โดยไม่ต้องรีเฟรชสถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและการพิมพ์">
    เมื่อ bridge ของ Private API ทำงาน แชตขาเข้าที่ได้รับการยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้วก่อน dispatch และจะแสดงฟองการพิมพ์ให้ผู้ส่งเห็นขณะเอเจนต์กำลังสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    บิลด์ `imsg` รุ่นเก่าที่มาก่อนรายการความสามารถรายเมธอดจะปิดการพิมพ์/การอ่านแบบเงียบ ๆ OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการรีสตาร์ท เพื่อให้ระบุสาเหตุของใบตอบรับที่หายไปได้

  </Accordion>

  <Accordion title="tapback ขาเข้า">
    OpenClaw สมัครรับ tapback ของ iMessage และกำหนดเส้นทางปฏิกิริยาที่ได้รับการยอมรับเป็นเหตุการณ์ระบบแทนข้อความปกติ ดังนั้น tapback จากผู้ใช้จะไม่ทริกเกอร์ลูปการตอบกลับตามปกติ

    โหมดการแจ้งเตือนควบคุมโดย `channels.imessage.reactionNotifications`:

    - `"own"` (ค่าเริ่มต้น): แจ้งเตือนเฉพาะเมื่อผู้ใช้ตอบสนองต่อข้อความที่บอตเป็นผู้เขียน
    - `"all"`: แจ้งเตือนสำหรับ tapback ขาเข้าทั้งหมดจากผู้ส่งที่ได้รับอนุญาต
    - `"off"`: เพิกเฉยต่อ tapback ขาเข้า

    การแทนที่รายบัญชีใช้ `channels.imessage.accounts.<id>.reactionNotifications`

  </Accordion>
</AccordionGroup>

## การเขียนการกำหนดค่า

iMessage อนุญาตให้ช่องทางเริ่มการเขียนการกำหนดค่าได้โดยค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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

## การรวมข้อความส่วนตัวที่ส่งแยก (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน — เช่น `Dump https://example.com/article` — แอป Messages ของ Apple จะแยกการส่งออกเป็น **สองแถว `chat.db` แยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนตัวอย่าง URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ

แถวสองแถวมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในระบบส่วนใหญ่ หากไม่มีการรวมข้อความ เอเจนต์จะได้รับคำสั่งเพียงอย่างเดียวในรอบที่ 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") แล้วจึงเห็น URL ในรอบที่ 2 — ซึ่งถึงตอนนั้นบริบทของคำสั่งก็หายไปแล้ว นี่คือไปป์ไลน์การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` เพิ่มเข้ามา

`channels.imessage.coalesceSameSenderDms` เลือกให้ DM รวมแถวต่อเนื่องจากผู้ส่งคนเดียวกันเป็นรอบเดียวของเอเจนต์ แชทกลุ่มยังคงส่งต่อทีละข้อความเพื่อรักษาโครงสร้างรอบของผู้ใช้หลายคนไว้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณจัดส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL, รูปภาพ หรือเนื้อหายาว ๆ ควบคู่กับคำสั่ง
    - คุณยอมรับ latency ของรอบ DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดไว้เมื่อ:

    - คุณต้องการ latency ของคำสั่งต่ำสุดสำหรับ trigger DM คำเดียว
    - flow ทั้งหมดของคุณเป็นคำสั่งแบบครั้งเดียวจบโดยไม่มี payload ตามมา

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

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.imessage` ระบุไว้อย่างชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นแบบเดิมคือ 0 ms — ไม่มี debouncing) หน้าต่างที่กว้างขึ้นจำเป็นเพราะ cadence การส่งแบบแยกของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

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
  <Tab title="ข้อแลกเปลี่ยน">
    - **latency เพิ่มขึ้นสำหรับข้อความ DM** เมื่อเปิดแฟล็ก ทุก DM (รวมถึงคำสั่งควบคุมแบบเดี่ยวและข้อความตามมาแบบข้อความเดียว) จะรอได้สูงสุดถึงหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่าจะมีแถว payload เข้ามา ข้อความแชทกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระพร้อม marker `…[truncated]` อย่างชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ แหล่งที่มาจำกัดที่ 10 รายการ (คงรายการแรกและรายการล่าสุดไว้เมื่อเกินกว่านั้น) GUID ของแหล่งที่มาทุกตัวถูกติดตามใน `coalescedMessageGuids` สำหรับ telemetry ปลายทาง
    - **เฉพาะ DM** แชทกลุ่มจะผ่านไปยังการส่งต่อทีละข้อความเพื่อให้บอทยังคงตอบสนองเมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้เป็นรายช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ การกำหนดค่า BlueBubbles เดิมที่ตั้งค่า `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปที่ `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้พิมพ์                                                         | `chat.db` สร้าง       | ปิดแฟล็ก (ค่าเริ่มต้น)                 | เปิดแฟล็ก + หน้าต่าง 2500 ms                                           |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                         | 2 แถวห่างกัน ~1 s     | เอเจนต์ 2 รอบ: มีแค่ "Dump" แล้วตามด้วย URL | รอบเดียว: ข้อความที่รวมแล้ว `Dump https://example.com`                 |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถว                 | 2 รอบ (ไฟล์แนบตกหล่นเมื่อรวม)          | รอบเดียว: รักษาข้อความ + รูปภาพไว้                                     |
| `/status` (คำสั่งเดี่ยว)                                           | 1 แถว                 | ส่งต่อทันที                             | **รอได้สูงสุดถึงหน้าต่าง แล้วส่งต่อ**                                  |
| วาง URL เพียงอย่างเดียว                                            | 1 แถว                 | ส่งต่อทันที                             | ส่งต่อทันที (มีเพียงหนึ่งรายการใน bucket)                               |
| ส่งข้อความ + URL เป็นสองข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที    | 2 แถวนอกหน้าต่าง     | 2 รอบ                                   | 2 รอบ (หน้าต่างหมดอายุระหว่างกัน)                                      |
| DM จำนวนมากอย่างรวดเร็ว (>10 DM สั้น ๆ ภายในหน้าต่าง)             | N แถว                 | N รอบ                                   | รอบเดียว เอาต์พุตมีขอบเขตจำกัด (ใช้รายการแรก + ล่าสุด และใช้ขีดจำกัดข้อความ/ไฟล์แนบ) |
| สองคนพิมพ์ในแชทกลุ่ม                                               | N แถวจากผู้ส่ง M คน  | M+ รอบ (หนึ่งรอบต่อ bucket ของผู้ส่ง)  | M+ รอบ — แชทกลุ่มจะไม่ถูกนำมารวมกัน                                   |

## การตามข้อความหลัง Gateway หยุดทำงาน

เมื่อ Gateway ออฟไลน์ (แครช รีสตาร์ท Mac เข้าสู่โหมดพัก เครื่องปิด) `imsg watch` จะกลับมาทำงานต่อจากสถานะ `chat.db` ปัจจุบันเมื่อ Gateway กลับขึ้นมา — ตามค่าเริ่มต้น สิ่งใดก็ตามที่เข้ามาในช่วงขาดหายจะไม่ถูกเห็นเลย การตามข้อความย้อนหลังจะเล่นซ้ำข้อความเหล่านั้นในการเริ่มต้นครั้งถัดไป เพื่อให้เอเจนต์ไม่พลาด traffic ขาเข้าโดยไม่รู้ตัว

การตามข้อความย้อนหลังถูก **ปิดไว้ตามค่าเริ่มต้น** เปิดใช้เป็นรายช่องทาง:

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

### วิธีทำงาน

ทำงานหนึ่งรอบต่อการเริ่มต้น `monitorIMessageProvider` แต่ละครั้ง โดยเรียงลำดับเป็น `imsg launch` พร้อม → `watch.subscribe` → `performIMessageCatchup` → วนลูปส่งต่อสด ตัวการตามข้อความย้อนหลังเองใช้ `chats.list` + `messages.history` รายแชทผ่าน JSON-RPC client เดียวกับที่ `imsg watch` ใช้ สิ่งใดก็ตามที่เข้ามาระหว่างรอบการตามข้อความย้อนหลังจะไหลผ่านการส่งต่อสดตามปกติ cache inbound-dedupe ที่มีอยู่จะดูดซับส่วนที่ซ้อนทับกับแถวที่เล่นซ้ำ

แต่ละแถวที่เล่นซ้ำจะถูกป้อนผ่านเส้นทางการส่งต่อสด (`evaluateIMessageInbound` + `dispatchInboundMessage`) ดังนั้นรายการอนุญาต นโยบายกลุ่ม debouncer echo cache และใบยืนยันการอ่านจะทำงานเหมือนกันทั้งกับข้อความที่เล่นซ้ำและข้อความสด

### ความหมายของ cursor และการ retry

การตามข้อความย้อนหลังเก็บ cursor รายบัญชีไว้ที่ `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (ไดเรกทอรีสถานะ OpenClaw มีค่าเริ่มต้นเป็น `~/.openclaw` และ override ได้ด้วย `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- cursor จะเลื่อนไปข้างหน้าหลัง dispatch สำเร็จแต่ละครั้ง และจะค้างไว้เมื่อ dispatch ของแถว throw — การเริ่มต้นครั้งถัดไปจะลองแถวเดิมอีกครั้งจาก cursor ที่ค้างไว้
- หลังจาก throw ติดต่อกัน `maxFailureRetries` ครั้งกับ `guid` เดียวกัน การตามข้อความย้อนหลังจะบันทึก `warn` และบังคับเลื่อน cursor ข้ามข้อความที่ติดค้าง เพื่อให้การเริ่มต้นครั้งต่อ ๆ ไปเดินหน้าต่อได้
- guid ที่ยอมแพ้ไปแล้วจะถูกข้ามทันทีที่พบ (ไม่มีความพยายาม dispatch) ในการรันภายหลัง และถูกนับใต้ `skippedGivenUp` ในสรุปการรัน

### สัญญาณที่ผู้ปฏิบัติการเห็นได้

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

บรรทัด `WARN ... capped to perRunLimit` หมายความว่าการเริ่มต้นครั้งเดียวไม่ได้ระบาย backlog ทั้งหมด เพิ่ม `perRunLimit` (สูงสุด 500) หากช่วงขาดหายของคุณเกินการผ่านค่าเริ่มต้น 50 แถวเป็นประจำ

### เมื่อใดควรปล่อยให้ปิดไว้

- Gateway ทำงานต่อเนื่องพร้อม watchdog รีสตาร์ทอัตโนมัติ และช่วงขาดหายมัก < สองสามวินาที — ค่าเริ่มต้นที่ปิดไว้ก็เพียงพอ
- ปริมาณ DM ต่ำ และข้อความที่พลาดไปจะไม่เปลี่ยนพฤติกรรมของเอเจนต์ — หน้าต่างเริ่มต้น `firstRunLookbackMinutes` อาจ dispatch บริบทเก่าที่ไม่คาดคิดเมื่อเปิดใช้ครั้งแรก

เมื่อคุณเปิดใช้การตามข้อความย้อนหลัง การเริ่มต้นครั้งแรกที่ยังไม่มี cursor จะมองย้อนหลังแค่ `firstRunLookbackMinutes` (ค่าเริ่มต้น 30 นาที) ไม่ใช่หน้าต่าง `maxAgeMinutes` ทั้งหมด — วิธีนี้หลีกเลี่ยงการเล่นซ้ำประวัติยาว ๆ ของข้อความก่อนเปิดใช้

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากการดำเนินการผ่าน private API ไม่พร้อมใช้งาน ให้รัน `imsg launch` ใน session ผู้ใช้ macOS ที่ล็อกอินอยู่ แล้ว probe อีกครั้ง หาก Gateway ไม่ได้ทำงานบน macOS ให้ใช้การตั้งค่า Mac ระยะไกลผ่าน SSH ด้านบนแทนพาธ `imsg` ภายในเครื่องตามค่าเริ่มต้น

  </Accordion>

  <Accordion title="Gateway ไม่ได้ทำงานบน macOS">
    ค่าเริ่มต้น `cliPath: "imsg"` ต้องทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages บน Linux หรือ Windows ให้ตั้งค่า `channels.imessage.cliPath` เป็น wrapper script ที่ SSH ไปยัง Mac เครื่องนั้นและรัน `imsg "$@"`

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    จากนั้นรัน:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM ถูกละเว้น">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติการจับคู่ (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้น">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรมรายการอนุญาต `channels.imessage.groups`
    - การกำหนดค่ารูปแบบการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - host key มีอยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - สิทธิ์อ่านพาธระยะไกลบน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาดพรอมต์สิทธิ์ของ macOS">
    รันอีกครั้งในเทอร์มินัล GUI แบบ interactive ในบริบทผู้ใช้/session เดียวกัน และอนุมัติพรอมต์:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่า Full Disk Access + Automation ได้รับอนุญาตสำหรับบริบทของโปรเซสที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

- [เอกสารอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การนำ BlueBubbles ออกและพาธ iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้าย
- [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปลงการกำหนดค่าและขั้นตอนการเปลี่ยนระบบทีละขั้นตอน
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
