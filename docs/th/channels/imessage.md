---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับของ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio) พร้อมการดำเนินการ API ส่วนตัวสำหรับการตอบกลับ, tapbacks, effects, attachments และการจัดการกลุ่ม เหมาะสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์ตรงตามเงื่อนไข
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการปรับใช้ OpenClaw iMessage ให้ใช้ `imsg` บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้แล้ว หาก Gateway ของคุณทำงานบน Linux หรือ Windows ให้ชี้ `channels.imessage.cliPath` ไปที่ SSH wrapper ที่เรียกใช้ `imsg` บน Mac

**การตามเก็บข้อความช่วง Gateway หยุดทำงานเป็นแบบเลือกเปิดใช้เอง** เมื่อเปิดใช้ (`channels.imessage.catchup.enabled: true`) Gateway จะเล่นซ้ำข้อความขาเข้าที่เข้ามาใน `chat.db` ระหว่างที่ออฟไลน์อยู่ (แครช, รีสตาร์ต, Mac เข้าสู่โหมดพัก) เมื่อเริ่มทำงานครั้งถัดไป ปิดไว้โดยค่าเริ่มต้น — ดู [การตามเก็บหลังจาก Gateway หยุดทำงาน](#catching-up-after-gateway-downtime) ปิด [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกถอดออกแล้ว ย้ายคอนฟิก `channels.bluebubbles` ไปเป็น `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การถอด BlueBubbles และเส้นทาง iMessage ของ imsg](/th/announcements/bluebubbles-imessage) สำหรับประกาศแบบสั้น หรือ [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายแบบครบถ้วน
</Warning>

สถานะ: การผสานกับ CLI ภายนอกแบบเนทีฟ Gateway สร้างโปรเซส `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มีดีมอน/พอร์ตแยกต่างหาก) การทำงานขั้นสูงต้องใช้ `imsg launch` และการตรวจสอบ private API ที่สำเร็จ

<CardGroup cols={3}>
  <Card title="การทำงานของ private API" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ, tapback, เอฟเฟกต์, ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Mac ระยะไกล" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ SSH wrapper เมื่อ Gateway ไม่ได้ทำงานบน Mac ที่ใช้ Messages
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    เอกสารอ้างอิงฟิลด์ iMessage แบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ภายในเครื่อง (เส้นทางเร็ว)">
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

      <Step title="อนุมัติการจับคู่ DM ครั้งแรก (dmPolicy เริ่มต้น)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอจับคู่หมดอายุหลังจาก 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac ระยะไกลผ่าน SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณสามารถชี้ `cliPath` ไปที่สคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและเรียกใช้ `imsg`

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

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจจับโดยอัตโนมัติด้วยการแยกวิเคราะห์สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบ host key แบบเข้มงวดสำหรับ SCP ดังนั้น host key ของรีเลย์ต้องมีอยู่ใน `~/.ssh/known_hosts` แล้ว
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- Messages ต้องลงชื่อเข้าใช้บน Mac ที่เรียกใช้ `imsg`
- ต้องมี Full Disk Access สำหรับบริบทโปรเซสที่เรียกใช้ OpenClaw/`imsg` (การเข้าถึง DB ของ Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการทำงานขั้นสูง (react / edit / unsend / threaded reply / effects / group ops) ต้องปิด System Integrity Protection — ดู [การเปิดใช้ private API ของ imsg](#enabling-the-imsg-private-api) ด้านล่าง การส่ง/รับข้อความและสื่อพื้นฐานทำงานได้โดยไม่ต้องปิด

<Tip>
สิทธิ์จะถูกให้ตามบริบทโปรเซส หาก Gateway ทำงานแบบไม่มีหน้าจอ (LaunchAgent/SSH) ให้เรียกใช้คำสั่งแบบโต้ตอบหนึ่งครั้งในบริบทเดียวกันนั้นเพื่อเรียกพรอมต์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## การเปิดใช้ private API ของ imsg

`imsg` มาพร้อมโหมดการทำงานสองแบบ:

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยน SIP): ข้อความและสื่อขาออกผ่าน `send`, การเฝ้าดู/ประวัติขาเข้า, รายการแชท นี่คือสิ่งที่คุณได้ทันทีจาก `brew install steipete/tap/imsg` ใหม่พร้อมสิทธิ์ macOS มาตรฐานด้านบน
- **โหมด Private API**: `imsg` ฉีด helper dylib เข้าไปใน `Messages.app` เพื่อเรียกฟังก์ชัน `IMCore` ภายใน นี่คือสิ่งที่ปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบเธรด), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบรับการอ่าน

เพื่อเข้าถึงพื้นผิวการทำงานขั้นสูงที่หน้าแชนเนลนี้อธิบาย คุณต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่งแบบ rich ที่หนุนด้วย bridge, การแก้ไขข้อความ และการจัดการแชท เป็นแบบเลือกเปิดใช้เอง ฟีเจอร์เหล่านี้ต้องปิด SIP และต้องฉีด helper dylib เข้าไปใน `Messages.app` `imsg launch` จะปฏิเสธการฉีดเมื่อเปิดใช้ SIP อยู่

เทคนิคการฉีด helper ใช้ dylib ของ `imsg` เองเพื่อเข้าถึง private API ของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือรันไทม์ BlueBubbles ในเส้นทาง OpenClaw iMessage

<Warning>
**การปิด SIP เป็นการแลกเปลี่ยนด้านความปลอดภัยที่แท้จริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการเรียกใช้โค้ดระบบที่ถูกปรับแก้ การปิดแบบทั้งระบบจะเปิดพื้นที่โจมตีและผลข้างเคียงเพิ่มเติม โดยเฉพาะอย่างยิ่ง **การปิด SIP บน Mac ที่ใช้ Apple Silicon ยังปิดความสามารถในการติดตั้งและเรียกใช้แอป iOS บน Mac ของคุณด้วย**

ให้ถือว่านี่เป็นการเลือกเชิงปฏิบัติการโดยตั้งใจ ไม่ใช่ค่าเริ่มต้น หากโมเดลภัยคุกคามของคุณยอมรับการปิด SIP ไม่ได้ iMessage ที่รวมมาให้จะจำกัดอยู่ที่โหมดพื้นฐาน — ส่ง/รับข้อความและสื่อเท่านั้น ไม่มี reactions / edit / unsend / effects / group ops
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่เรียกใช้ Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` รายเมธอด เพื่อให้คุณเห็นว่าบิลด์ปัจจุบันรองรับอะไรบ้างก่อนเริ่มต้น

2. **ปิด System Integrity Protection** ขั้นตอนนี้ขึ้นกับเวอร์ชัน macOS เพราะข้อกำหนดของ Apple ที่อยู่เบื้องหลังขึ้นกับ OS และฮาร์ดแวร์:
   - **macOS 10.13–10.15 (Sierra–Catalina):** ปิด Library Validation ผ่าน Terminal, รีบูตเข้าสู่ Recovery Mode, เรียกใช้ `csrutil disable`, รีสตาร์ต
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** Recovery Mode (หรือ Internet Recovery), `csrutil disable`, รีสตาร์ต
   - **macOS 11+, Apple Silicon:** ใช้ลำดับการเริ่มเครื่องด้วยปุ่มเปิด/ปิดเพื่อเข้าสู่ Recovery; ใน macOS เวอร์ชันล่าสุดให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคุณคลิก Continue แล้วจึงใช้ `csrutil disable` การตั้งค่าเครื่องเสมือนใช้ขั้นตอนแยกต่างหาก — สร้าง snapshot ของ VM ก่อน
   - **macOS 26 / Tahoe:** นโยบาย library-validation และการตรวจ private-entitlement ของ `imagent` เข้มงวดขึ้นอีก; `imsg` อาจต้องใช้บิลด์ที่อัปเดตเพื่อให้ตามทัน หากการฉีด `imsg launch` หรือ `selectors` บางตัวเริ่มคืนค่า false หลังอัปเกรด macOS เวอร์ชันหลัก ให้ตรวจสอบ release notes ของ `imsg` ก่อนสรุปว่าขั้นตอน SIP สำเร็จแล้ว

   ทำตามขั้นตอน Recovery-mode ของ Apple สำหรับ Mac ของคุณเพื่อปิด SIP ก่อนเรียกใช้ `imsg launch`

3. **ฉีด helper** เมื่อปิด SIP แล้วและ Messages.app ลงชื่อเข้าใช้แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการฉีดเมื่อ SIP ยังเปิดอยู่ ดังนั้นคำสั่งนี้ยังใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 สำเร็จแล้ว

4. **ตรวจสอบ bridge จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '.selectors'` ควรแสดง `retractMessagePart: true` พร้อม selector สำหรับ edit / typing / read ใดๆ ที่บิลด์ macOS ของคุณเปิดเผย การ gating รายเมธอดของ Plugin OpenClaw ใน `actions.ts` จะโฆษณาเฉพาะ action ที่ selector เบื้องหลังเป็น `true` ดังนั้นพื้นผิว action ที่คุณเห็นในรายการเครื่องมือของ agent จะสะท้อนสิ่งที่ bridge ทำได้จริงบนโฮสต์นี้

หาก `openclaw channels status --probe` รายงานว่าแชนเนลเป็น `works` แต่ action บางอย่างโยนข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ตอน dispatch ให้เรียกใช้ `imsg launch` อีกครั้ง — helper อาจหลุดออกไปได้ (Messages.app รีสตาร์ต, อัปเดต OS ฯลฯ) และสถานะ `available: true` ที่แคชไว้จะยังโฆษณา action ต่อไปจนกว่าการ probe ครั้งถัดไปจะรีเฟรช

### เมื่อคุณปิด SIP ไม่ได้

หากการปิด SIP ไม่เป็นที่ยอมรับสำหรับโมเดลภัยคุกคามของคุณ:

- `imsg` จะ fallback เป็นโหมดพื้นฐาน — ข้อความ + สื่อ + การรับเท่านั้น
- Plugin OpenClaw ยังคงโฆษณาการส่งข้อความ/สื่อและการเฝ้าติดตามขาเข้า เพียงแต่ซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และ group ops จากพื้นผิว action (ตาม gate ความสามารถรายเมธอด)
- คุณสามารถใช้ Mac ที่ไม่ใช่ Apple Silicon แยกต่างหาก (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับงาน iMessage ขณะที่ยังเปิด SIP บนอุปกรณ์หลักของคุณไว้ ดู [ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist อาจเป็น handle, กลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) หรือเป้าหมายแชท (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่าไว้)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` ยังสามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ได้ด้วย

    Runtime fallback: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจผู้ส่งกลุ่ม iMessage จะ fallback ไปใช้ `allowFrom` เมื่อมีให้ใช้
    หมายเหตุ runtime: หาก `channels.imessage` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มมี gate allowlist **สอง** ชั้นที่ทำงานต่อกัน และทั้งคู่ต้องผ่าน:

    1. **allowlist ผู้ส่ง / เป้าหมายแชท** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` หรือ `chat_id`
    2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — เมื่อใช้ `groupPolicy: "allowlist"` gate นี้ต้องมีรายการ wildcard `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือรายการต่อ `chat_id` อย่างชัดเจนภายใต้ `groups`

    หาก gate 2 ไม่มีอะไรอยู่เลย ข้อความกลุ่มทุกข้อความจะถูกทิ้ง Plugin จะส่งสัญญาณระดับ `warn` สองรายการที่ระดับ log เริ่มต้น:

    - หนึ่งครั้งต่อบัญชีตอนเริ่มต้น: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - หนึ่งครั้งต่อ `chat_id` ตอน runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM ยังทำงานต่อไปเพราะใช้ code path ที่ต่างออกไป

    คอนฟิกขั้นต่ำเพื่อให้กลุ่มยังไหลผ่านได้ภายใต้ `groupPolicy: "allowlist"`:

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

    ถ้าบรรทัด `warn` เหล่านั้นปรากฏในบันทึกของ Gateway แสดงว่า gate 2 กำลังตัดทิ้ง ให้เพิ่มบล็อก `groups`
    </Warning>

    กล่าวถึง gating สำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาทาการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - หากไม่มีรูปแบบที่กำหนดค่าไว้ จะไม่สามารถบังคับใช้ mention gating ได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้าม mention gating ในกลุ่มได้

    `systemPrompt` ต่อกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกฉีดเข้าไปใน system prompt ของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น การแก้ค่าจะสะท้อนการแก้ prompt ต่อกลุ่มที่ใช้โดย `channels.whatsapp.groups`:

    1. **System prompt เฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ใน map **และ** มีการกำหนดคีย์ `systemPrompt` ถ้า `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่มี system prompt ถูกนำไปใช้กับกลุ่มนั้น
    2. **System prompt wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะไม่มีอยู่ใน map เลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

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

    Prompt ต่อกลุ่มใช้กับข้อความกลุ่มเท่านั้น ข้อความโดยตรงในช่องทางนี้จะไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดได้แน่นอน">
    - DM ใช้การกำหนดเส้นทางโดยตรง กลุ่มใช้การกำหนดเส้นทางแบบกลุ่ม
    - ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มถูกแยกไว้ต่างหาก (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้เมทาดาทาช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage แบบหลายผู้เข้าร่วมบางรายการอาจเข้ามาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดค่าไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (group gating + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมยังสามารถผูกกับเซสชัน ACP ได้ด้วย

โฟลว์ผู้ปฏิบัติงานแบบรวดเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และนำการผูกออก

รองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการระดับบนสุด `bindings[]` ที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` ใช้ได้กับ:

- แฮนเดิล DM ที่ทำให้เป็นมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
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
  <Accordion title="ผู้ใช้ macOS เฉพาะสำหรับบอท (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS เฉพาะ เพื่อให้ทราฟฟิกของบอทถูกแยกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอทในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง wrapper ของ SSH เพื่อให้ OpenClaw สามารถรัน `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องได้รับการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอทนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีที่พบบ่อย:

    - Gateway รันบน Linux/VM
    - iMessage + `imsg` รันบน Mac ใน tailnet ของคุณ
    - wrapper ของ `cliPath` ใช้ SSH เพื่อรัน `imsg`
    - `remoteHost` เปิดใช้การดึงไฟล์แนบด้วย SCP

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
    ตรวจให้แน่ใจก่อนว่าเชื่อถือ host key แล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่าต่อบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์อย่าง `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist ของรากไฟล์แนบได้

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งชิ้น และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้า **ปิดตามค่าเริ่มต้น** ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ วอยซ์เมโม วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดไว้ iMessage ที่มีเฉพาะไฟล์แนบจะถูกตัดทิ้งก่อนถึงเอเจนต์ และอาจไม่สร้างบรรทัดบันทึก `Inbound message` เลย
    - เส้นทางไฟล์แนบระยะไกลสามารถดึงผ่าน SCP ได้เมื่อมีการตั้งค่า `remoteHost`
    - เส้นทางไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งชิ้นขาออก">
    - ขีดจำกัดชิ้นข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งชิ้น: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แยกโดยให้ย่อหน้ามาก่อน)

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

## การดำเนินการ Private API

เมื่อ `imsg launch` กำลังทำงานและ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความสามารถใช้การดำเนินการแบบเนทีฟของ iMessage เพิ่มเติมจากการส่งข้อความปกติได้

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
  <Accordion title="การดำเนินการที่ใช้ได้">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับจะแมปกับ love, like, dislike, laugh, emphasize และ question
    - **reply**: ส่งการตอบกลับแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message`, รวมถึง `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`)
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ของ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`)
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/private API ที่รองรับ (`messageId`, `text` หรือ `newText`)
    - **unsend**: ถอนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/private API ที่รองรับ (`messageId`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` เป็น base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, `asVoice` แบบไม่บังคับ) alias แบบเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อเป้าหมายปัจจุบันเป็นบทสนทนากลุ่ม

  </Accordion>

  <Accordion title="ID ข้อความ">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็มเมื่อมี ค่า ID แบบสั้นถูกจำกัดขอบเขตไว้ในแคชการตอบกลับในหน่วยความจำล่าสุด และจะถูกตรวจสอบกับแชตปัจจุบันก่อนใช้งาน หาก ID แบบสั้นหมดอายุหรือเป็นของแชตอื่น ให้ลองใหม่ด้วย `MessageSidFull` แบบเต็ม

  </Accordion>

  <Accordion title="การตรวจจับความสามารถ">
    OpenClaw ซ่อนการดำเนินการ Private API เฉพาะเมื่อสถานะ probe ที่แคชไว้บอกว่า bridge ไม่พร้อมใช้งาน หากไม่ทราบสถานะ การดำเนินการจะยังมองเห็นได้และ dispatch จะ probe แบบ lazy เพื่อให้การดำเนินการแรกสำเร็จหลังจาก `imsg launch` โดยไม่ต้องรีเฟรชสถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและการพิมพ์">
    เมื่อ bridge ของ Private API ทำงานอยู่ แชตขาเข้าที่ได้รับการยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้วก่อน dispatch และจะแสดงฟองการพิมพ์แก่ผู้ส่งระหว่างที่เอเจนต์กำลังสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    build รุ่นเก่าของ `imsg` ที่มาก่อนรายการความสามารถต่อเมธอดจะ gate การพิมพ์/การอ่านออกแบบเงียบ ๆ OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการรีสตาร์ตเพื่อให้ระบุสาเหตุของใบตอบรับที่หายไปได้

  </Accordion>
</AccordionGroup>

## การเขียนค่า config

iMessage อนุญาตให้ช่องทางเริ่มเขียนค่า config ได้ตามค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

ปิดใช้:

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

## การรวม DM ที่ถูกส่งแยก (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL ร่วมกัน เช่น `Dump https://example.com/article` แอป Messages ของ Apple จะแยกการส่งออกเป็น **แถว `chat.db` สองแถวแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนตัวอย่าง URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ

สองแถวนี้จะมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในเซ็ตอัปส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับคำสั่งอย่างเดียวในเทิร์น 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL ในเทิร์น 2 เท่านั้น ซึ่งถึงตอนนั้นบริบทคำสั่งก็หายไปแล้ว นี่คือ pipeline การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` เพิ่มเข้ามา

`channels.imessage.coalesceSameSenderDms` เลือกให้ DM รวมแถวต่อเนื่องจากผู้ส่งคนเดียวกันเป็นเทิร์นเอเจนต์เดียว แชตกลุ่มยังคง dispatch ต่อข้อความเพื่อรักษาโครงสร้างเทิร์นแบบหลายผู้ใช้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณส่งมอบ Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
    - คุณยอมรับ latency ของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปิดไว้เมื่อ:

    - คุณต้องการ latency ของคำสั่งต่ำสุดสำหรับ trigger DM แบบคำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งครั้งเดียวโดยไม่มี payload ตามมา

  </Tab>
  <Tab title="การเปิดใช้งาน">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กนี้และไม่มี `messages.inbound.byChannel.imessage` ที่ระบุไว้โดยตรง หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นเดิมคือ 0 ms — ไม่มีการ debounce) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้นเพราะจังหวะการส่งแบบแยกของ Apple ที่ 0.8-2.0 s ไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

    หากต้องการปรับหน้าต่างด้วยตนเอง:

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
    - **เพิ่มเวลาแฝงสำหรับข้อความ DM** เมื่อเปิดแฟล็กนี้ ทุก DM (รวมถึงคำสั่งควบคุมเดี่ยวและการติดตามผลแบบข้อความเดียว) จะรอได้ถึงหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่าจะมีแถว payload ตามมา ข้อความแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่ผสานแล้วมีขอบเขตจำกัด** ข้อความที่ผสานจำกัดไว้ที่ 4000 อักขระพร้อมตัวทำเครื่องหมาย `…[truncated]` ที่ชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (เก็บรายการแรกและล่าสุดไว้เมื่อเกินกว่านั้น) GUID ต้นทางทุกรายการถูกติดตามใน `coalescedMessageGuids` สำหรับ telemetry ปลายทาง
    - **เฉพาะ DM** แชตกลุ่มจะผ่านไปยังการส่งต่อแบบรายข้อความ เพื่อให้บอตยังตอบสนองได้ดีเมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้ต่อช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ การกำหนดค่า BlueBubbles เดิมที่ตั้ง `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปที่ `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| ผู้ใช้เขียน                                                       | `chat.db` สร้าง       | ปิดแฟล็ก (ค่าเริ่มต้น)                  | เปิดแฟล็ก + หน้าต่าง 2500 ms                                            |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                         | 2 แถว ห่างกัน ~1 s    | เอเจนต์ทำงานสองรอบ: "Dump" อย่างเดียว แล้วจึงเป็น URL | หนึ่งรอบ: ข้อความที่ผสาน `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)               | 2 แถว                 | สองรอบ (ไฟล์แนบถูกทิ้งในการผสาน)       | หนึ่งรอบ: เก็บข้อความ + รูปภาพไว้                                      |
| `/status` (คำสั่งเดี่ยว)                                          | 1 แถว                 | ส่งต่อทันที                             | **รอได้ถึงหน้าต่าง แล้วจึงส่งต่อ**                                      |
| วาง URL เพียงอย่างเดียว                                           | 1 แถว                 | ส่งต่อทันที                             | ส่งต่อทันที (มีเพียงรายการเดียวใน bucket)                               |
| ข้อความ + URL ที่ตั้งใจส่งเป็นสองข้อความแยกกัน ห่างกันหลายนาที   | 2 แถวนอกหน้าต่าง     | สองรอบ                                  | สองรอบ (หน้าต่างหมดอายุระหว่างข้อความ)                                 |
| ส่งถี่อย่างรวดเร็ว (>10 DM สั้นภายในหน้าต่าง)                     | N แถว                 | N รอบ                                   | หนึ่งรอบ เอาต์พุตมีขอบเขตจำกัด (ใช้รายการแรก + ล่าสุด พร้อมขีดจำกัดข้อความ/ไฟล์แนบ) |
| สองคนกำลังพิมพ์ในแชตกลุ่ม                                        | N แถวจากผู้ส่ง M คน  | M+ รอบ (หนึ่งรอบต่อ bucket ของผู้ส่ง)   | M+ รอบ — แชตกลุ่มจะไม่ถูกผสาน                                         |

## การตามให้ทันหลัง Gateway หยุดทำงาน

เมื่อ Gateway ออฟไลน์ (แครช รีสตาร์ท Mac sleep ปิดเครื่อง) `imsg watch` จะทำงานต่อจากสถานะ `chat.db` ปัจจุบันเมื่อ Gateway กลับมาออนไลน์ — โดยค่าเริ่มต้น สิ่งใดก็ตามที่มาถึงระหว่างช่องว่างนั้นจะไม่ถูกเห็น Catchup จะเล่นซ้ำข้อความเหล่านั้นในการเริ่มต้นครั้งถัดไป เพื่อให้เอเจนต์ไม่พลาดทราฟฟิกขาเข้าอย่างเงียบ ๆ

Catchup **ปิดใช้งานโดยค่าเริ่มต้น** เปิดใช้ต่อช่องทาง:

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

หนึ่งรอบต่อการเริ่มต้น `monitorIMessageProvider` โดยเรียงลำดับเป็น `imsg launch` พร้อมใช้งาน → `watch.subscribe` → `performIMessageCatchup` → วงรอบการส่งต่อสด ตัว Catchup ใช้ `chats.list` + `messages.history` รายแชตผ่านไคลเอนต์ JSON-RPC เดียวกับที่ `imsg watch` ใช้ สิ่งใดก็ตามที่มาถึงระหว่างรอบ Catchup จะไหลผ่านการส่งต่อสดตามปกติ; แคช inbound-dedupe ที่มีอยู่จะดูดซับส่วนที่ซ้อนทับกับแถวที่เล่นซ้ำ

แต่ละแถวที่เล่นซ้ำจะถูกป้อนผ่านเส้นทางการส่งต่อสด (`evaluateIMessageInbound` + `dispatchInboundMessage`) ดังนั้น allowlist, นโยบายกลุ่ม, debouncer, แคช echo และใบรับการอ่านจะทำงานเหมือนกันทั้งกับข้อความที่เล่นซ้ำและข้อความสด

### ความหมายของเคอร์เซอร์และการลองซ้ำ

Catchup เก็บเคอร์เซอร์ต่อบัญชีที่ `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (ไดเรกทอรีสถานะ OpenClaw มีค่าเริ่มต้นเป็น `~/.openclaw` และเขียนทับได้ด้วย `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- เคอร์เซอร์จะขยับไปข้างหน้าเมื่อส่งต่อสำเร็จแต่ละครั้ง และจะค้างไว้เมื่อการส่งต่อของแถวหนึ่ง throw — การเริ่มต้นครั้งถัดไปจะลองซ้ำแถวเดิมจากเคอร์เซอร์ที่ค้างไว้
- หลังจาก throw ติดต่อกัน `maxFailureRetries` ครั้งกับ `guid` เดียวกัน Catchup จะบันทึก `warn` และบังคับให้เคอร์เซอร์ข้ามข้อความที่ติดค้าง เพื่อให้การเริ่มต้นครั้งถัดไปเดินหน้าต่อได้
- guid ที่ยอมแพ้ไปแล้วจะถูกข้ามทันทีเมื่อพบ (ไม่มีความพยายามส่งต่อ) ในการรันภายหลัง และถูกนับใน `skippedGivenUp` ในสรุปการรัน

### สัญญาณที่ผู้ปฏิบัติการมองเห็น

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

บรรทัด `WARN ... capped to perRunLimit` หมายความว่าการเริ่มต้นครั้งเดียวไม่ได้ระบาย backlog ทั้งหมด เพิ่ม `perRunLimit` (สูงสุด 500) หากช่องว่างของคุณเกินรอบเริ่มต้นค่าเริ่มต้น 50 แถวเป็นประจำ

### ควรปล่อยให้ปิดไว้เมื่อใด

- Gateway ทำงานต่อเนื่องพร้อม watchdog auto-restart และช่องว่างมักน้อยกว่าไม่กี่วินาที — ค่าเริ่มต้นแบบปิดใช้งานเหมาะสมแล้ว
- ปริมาณ DM ต่ำและข้อความที่พลาดจะไม่เปลี่ยนพฤติกรรมของเอเจนต์ — หน้าต่างเริ่มต้น `firstRunLookbackMinutes` อาจส่งต่อบริบทเก่าที่น่าประหลาดใจในการเปิดใช้ครั้งแรก

เมื่อคุณเปิด Catchup การเริ่มต้นครั้งแรกที่ยังไม่มีเคอร์เซอร์จะมองย้อนกลับไปเพียง `firstRunLookbackMinutes` (ค่าเริ่มต้น 30 นาที) ไม่ใช่หน้าต่าง `maxAgeMinutes` ทั้งหมด — วิธีนี้หลีกเลี่ยงการเล่นซ้ำประวัติยาว ๆ ของข้อความก่อนเปิดใช้

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากใช้งาน private API actions ไม่ได้ ให้รัน `imsg launch` ในเซสชันผู้ใช้ macOS ที่ล็อกอินอยู่ แล้ว probe อีกครั้ง หาก Gateway ไม่ได้รันบน macOS ให้ใช้การตั้งค่า Remote Mac ผ่าน SSH ด้านบนแทนเส้นทาง `imsg` แบบ local ค่าเริ่มต้น

  </Accordion>

  <Accordion title="Gateway ไม่ได้รันบน macOS">
    ค่าเริ่มต้น `cliPath: "imsg"` ต้องรันบน Mac ที่ลงชื่อเข้าใช้ Messages อยู่ บน Linux หรือ Windows ให้ตั้ง `channels.imessage.cliPath` เป็นสคริปต์ wrapper ที่ SSH ไปยัง Mac เครื่องนั้นและรัน `imsg "$@"`

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
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การกำหนดค่ารูปแบบการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - มี host key อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - ความสามารถในการอ่านพาธระยะไกลบน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาดพรอมต์สิทธิ์ macOS">
    รันใหม่ในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกันและอนุมัติพรอมต์:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่าได้ให้สิทธิ์ Full Disk Access + Automation สำหรับบริบทของโปรเซสที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้อ้างอิงการกำหนดค่า

- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การนำ BlueBubbles ออกและเส้นทาง imsg iMessage](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้าย
- [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปลการกำหนดค่าและขั้นตอนการเปลี่ยนผ่านทีละขั้น
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
