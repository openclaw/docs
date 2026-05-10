---
read_when:
    - การวางแผนย้ายจาก BlueBubbles ไปยัง Plugin iMessage ที่รวมมาให้
    - การแปลคีย์การกำหนดค่า BlueBubbles เป็นค่าเทียบเท่าของ iMessage
    - การตรวจสอบ imsg ก่อนเปิดใช้งาน Plugin iMessage
summary: ย้ายการกำหนดค่า BlueBubbles เก่าไปยัง Plugin iMessage ที่รวมมาให้โดยไม่สูญเสียการจับคู่ รายการอนุญาต หรือการผูกกลุ่ม
title: ย้ายมาจาก BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` ที่รวมมาในชุดตอนนี้เข้าถึงพื้นผิว private API เดียวกับ BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, การจัดการกลุ่ม, ไฟล์แนบ) โดยขับเคลื่อน [`steipete/imsg`](https://github.com/steipete/imsg) ผ่าน JSON-RPC หากคุณมี Mac ที่ติดตั้ง `imsg` อยู่แล้ว คุณสามารถเลิกใช้เซิร์ฟเวอร์ BlueBubbles และให้ Plugin สื่อสารกับ Messages.app โดยตรงได้

การรองรับ BlueBubbles ถูกนำออกแล้ว OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น คู่มือนี้ใช้สำหรับย้ายคอนฟิก `channels.bluebubbles` เก่าไปยัง `channels.imessage`; ไม่มีเส้นทางการย้ายอื่นที่รองรับ

## เมื่อการย้ายนี้เหมาะสม

- คุณรัน `imsg` อยู่แล้วบน Mac เครื่องเดียวกัน (หรือเครื่องที่เข้าถึงได้ผ่าน SSH) ซึ่ง Messages.app ลงชื่อเข้าใช้อยู่
- คุณต้องการลดชิ้นส่วนที่ต้องดูแลลงหนึ่งส่วน — ไม่มีเซิร์ฟเวอร์ BlueBubbles แยกต่างหาก, ไม่มี REST endpoint ที่ต้องยืนยันตัวตน, ไม่มีงานเชื่อม Webhook ใช้ไบนารี CLI ตัวเดียวแทนเซิร์ฟเวอร์ + แอปไคลเอนต์ + ตัวช่วย
- คุณอยู่บน [รุ่น macOS / `imsg` ที่รองรับ](/th/channels/imessage#requirements-and-permissions-macos) ซึ่งตัวตรวจสอบ private API รายงาน `available: true`

## imsg ทำอะไร

`imsg` คือ CLI ภายในเครื่องสำหรับ Messages บน macOS OpenClaw เริ่ม `imsg rpc` เป็นกระบวนการลูกและสื่อสาร JSON-RPC ผ่าน stdin/stdout ไม่มีเซิร์ฟเวอร์ HTTP, URL Webhook, daemon เบื้องหลัง, launch agent หรือพอร์ตที่ต้องเปิดเผย

- การอ่านมาจาก `~/Library/Messages/chat.db` โดยใช้แฮนเดิล SQLite แบบอ่านอย่างเดียว
- ข้อความขาเข้าสดมาจาก `imsg watch` / `watch.subscribe` ซึ่งติดตามเหตุการณ์ระบบไฟล์ของ `chat.db` พร้อมกลไกสำรองแบบ polling
- การส่งใช้การทำงานอัตโนมัติของ Messages.app สำหรับข้อความปกติและการส่งไฟล์
- การดำเนินการขั้นสูงใช้ `imsg launch` เพื่อฉีดตัวช่วย `imsg` เข้าไปใน Messages.app นี่คือสิ่งที่ปลดล็อกใบตอบรับการอ่าน, ตัวบ่งชี้การพิมพ์, การส่งแบบ rich, การแก้ไข, การยกเลิกส่ง, การตอบกลับแบบเธรด, tapbacks และการจัดการกลุ่ม
- บิลด์ Linux สามารถตรวจสอบ `chat.db` ที่คัดลอกมาได้ แต่ไม่สามารถส่ง, เฝ้าดูฐานข้อมูล Mac สด หรือขับเคลื่อน Messages.app ได้ สำหรับ OpenClaw iMessage ให้รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้ หรือผ่าน SSH wrapper ไปยัง Mac เครื่องนั้น

## ก่อนเริ่ม

1. ติดตั้ง `imsg` บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   หาก `imsg chats` ล้มเหลวด้วย `unable to open database file`, ไม่มีเอาต์พุต หรือ `authorization denied` ให้ให้สิทธิ์ Full Disk Access แก่เทอร์มินัล, editor, กระบวนการ Node, บริการ Gateway หรือกระบวนการแม่ SSH ที่เรียกใช้ `imsg` จากนั้นเปิดกระบวนการแม่นั้นใหม่

2. ตรวจสอบพื้นผิวการอ่าน, watch, การส่ง และ RPC ก่อนเปลี่ยนคอนฟิก OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   แทนที่ `42` ด้วย chat id จริงจาก `imsg chats` การส่งต้องใช้สิทธิ์ Automation สำหรับ Messages.app หาก OpenClaw จะรันผ่าน SSH ให้รันคำสั่งเหล่านี้ผ่าน SSH wrapper เดียวกันหรือบริบทผู้ใช้เดียวกันกับที่ OpenClaw จะใช้

3. เปิดใช้สะพาน private API เมื่อคุณต้องการการดำเนินการขั้นสูง:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` ต้องปิดใช้งาน SIP การส่งพื้นฐาน, ประวัติ และ watch ทำงานได้โดยไม่ต้องใช้ `imsg launch`; การดำเนินการขั้นสูงทำไม่ได้

4. ตรวจสอบสะพานผ่าน OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   คุณต้องการ `imessage.privateApi.available: true` หากรายงาน `false` ให้แก้ไขส่วนนั้นก่อน — ดู [การตรวจจับความสามารถ](/th/channels/imessage#private-api-actions)

5. สแนปชอตคอนฟิกของคุณ:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## การแปลคอนฟิก

iMessage และ BlueBubbles ใช้คอนฟิกระดับช่องทางร่วมกันหลายอย่าง คีย์ที่เปลี่ยนส่วนใหญ่เป็นเรื่อง transport (เซิร์ฟเวอร์ REST เทียบกับ CLI ภายในเครื่อง) คีย์พฤติกรรม (`dmPolicy`, `groupPolicy`, `allowFrom` ฯลฯ) ยังคงมีความหมายเหมือนเดิม

| BlueBubbles                                                | iMessage ที่ bundled                      | หมายเหตุ                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | semantics เดียวกัน                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.serverUrl`                           | _(ลบออกแล้ว)_                             | ไม่มีเซิร์ฟเวอร์ REST — Plugin จะ spawn `imsg rpc` ผ่าน stdio                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.password`                            | _(ลบออกแล้ว)_                             | ไม่ต้องมีการยืนยันตัวตนของ webhook                                                                                                                                                                                                                                                                                                          |
| _(โดยนัย)_                                                 | `channels.imessage.cliPath`               | พาธไปยัง `imsg` (ค่าเริ่มต้น `imsg`); ใช้สคริปต์ wrapper สำหรับ SSH                                                                                                                                                                                                                                                                         |
| _(โดยนัย)_                                                 | `channels.imessage.dbPath`                | ค่า override ของ `chat.db` ใน Messages.app แบบไม่บังคับ; ตรวจพบอัตโนมัติเมื่อไม่ได้ระบุ                                                                                                                                                                                                                                                    |
| _(โดยนัย)_                                                 | `channels.imessage.remoteHost`            | `host` หรือ `user@host` — จำเป็นเฉพาะเมื่อ `cliPath` เป็น SSH wrapper และคุณต้องการ fetch ไฟล์แนบด้วย SCP                                                                                                                                                                                                                                  |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | ค่าเดียวกัน (`pairing` / `allowlist` / `open` / `disabled`)                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | การอนุมัติ pairing จะถูกยกมาโดยอิงตาม handle ไม่ใช่ token                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | ค่าเดียวกัน (`allowlist` / `open` / `disabled`)                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | เหมือนกัน                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **คัดลอกส่วนนี้แบบเดิมทุกตัวอักษร รวมถึงรายการ wildcard `groups: { "*": { ... } }` ถ้ามี** ค่า `requireMention`, `tools`, `toolsBySender` รายกลุ่มจะถูกยกมา ด้วย `groupPolicy: "allowlist"` บล็อก `groups` ที่ว่างหรือขาดหายจะทำให้ทุกข้อความกลุ่มถูกทิ้งแบบเงียบ ๆ — ดู "กับดักของ registry กลุ่ม" ด้านล่าง |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | ค่าเริ่มต้น `true` เมื่อใช้ Plugin ที่ bundled สิ่งนี้จะทำงานเฉพาะเมื่อ private API probe พร้อมใช้งาน                                                                                                                                                                                                                                      |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | รูปร่างเดียวกัน, **ค่าเริ่มต้นปิดเหมือนกัน** หากคุณเคยให้ไฟล์แนบไหลผ่านบน BlueBubbles คุณต้องตั้งค่านี้ใหม่อย่างชัดเจนในบล็อก iMessage — ค่านี้จะไม่ถูกยกมาโดยนัย และรูปภาพ/สื่อขาเข้าจะถูกทิ้งแบบเงียบ ๆ โดยไม่มีบรรทัด log `Inbound message` จนกว่าคุณจะตั้งค่า                              |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | root ภายในเครื่อง; กฎ wildcard เดียวกัน                                                                                                                                                                                                                                                                                                     |
| _(ไม่มี)_                                                  | `channels.imessage.remoteAttachmentRoots` | ใช้เฉพาะเมื่อมีการตั้งค่า `remoteHost` สำหรับการ fetch ด้วย SCP                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | ค่าเริ่มต้น 16 MB บน iMessage (ค่าเริ่มต้นของ BlueBubbles คือ 8 MB) ตั้งค่าอย่างชัดเจนหากคุณต้องการคงเพดานที่ต่ำกว่าไว้                                                                                                                                                                                                                   |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | ค่าเริ่มต้น 4000 ทั้งสองรายการ                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | เป็น opt-in เหมือนกัน เฉพาะ DM — แชตกลุ่มยังคง dispatch แยกทันทีต่อข้อความในทั้งสอง channel ขยาย debounce ขาเข้าเริ่มต้นเป็น 2500 ms เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.imessage` ที่ระบุชัดเจน ดู [เอกสาร iMessage § การรวม DM แบบ split-send](/th/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(ไม่มี)_                                  | iMessage อ่านชื่อแสดงผลของผู้ส่งจาก `chat.db` อยู่แล้ว                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | toggle ราย action: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`                                                                                                                                                           |

config หลายบัญชี (`channels.bluebubbles.accounts.*`) แปลแบบหนึ่งต่อหนึ่งเป็น `channels.imessage.accounts.*`

## กับดักของ registry กลุ่ม

Plugin iMessage ที่ bundled ใช้ gate allowlist ของกลุ่มแยกกัน **สอง** ชั้นต่อเนื่องกัน ทั้งสองชั้นต้องผ่าน ข้อความกลุ่มจึงจะไปถึง agent:

1. **allowlist ของผู้ส่ง / chat-target** (`channels.imessage.groupAllowFrom`) — ตรวจโดย `isAllowedIMessageSender` จับคู่ข้อความขาเข้าด้วย handle ของผู้ส่ง, `chat_guid`, `chat_identifier`, หรือ `chat_id` รูปร่างเดียวกับ BlueBubbles
2. **registry กลุ่ม** (`channels.imessage.groups`) — ตรวจโดย `resolveChannelGroupPolicy` จาก `inbound-processing.ts:199` เมื่อใช้ `groupPolicy: "allowlist"` gate นี้ต้องมีอย่างใดอย่างหนึ่ง:
   - รายการ wildcard `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือ
   - รายการต่อ `chat_id` อย่างชัดเจนภายใต้ `groups`

หาก gate 1 ผ่านแต่ gate 2 ไม่ผ่าน ข้อความจะถูกทิ้ง Plugin จะ emit สัญญาณระดับ `warn` สองแบบ เพื่อให้สิ่งนี้ไม่เงียบอีกต่อไปที่ระดับ log เริ่มต้น:

- `warn` ตอนเริ่มทำงานหนึ่งครั้งต่อบัญชี เมื่อมีการตั้งค่า `groupPolicy: "allowlist"` แต่ `channels.imessage.groups` ว่างเปล่า (ไม่มี wildcard `"*"`, ไม่มีรายการต่อ `chat_id`) — ทำงานก่อนมีข้อความใดเข้ามา
- `warn` หนึ่งครั้งต่อ `chat_id` ในครั้งแรกที่กลุ่มหนึ่งถูกทิ้งตอน runtime โดยระบุชื่อ chat_id และ key ที่ต้องเพิ่มเข้าไปใน `groups` อย่างชัดเจนเพื่ออนุญาต

DM ยังทำงานต่อไป เพราะใช้ code path คนละเส้นทาง

นี่คือโหมดล้มเหลวที่พบบ่อยที่สุดในการ migrate จาก BlueBubbles → iMessage ที่ bundled: ผู้ปฏิบัติงานคัดลอก `groupAllowFrom` และ `groupPolicy` แต่ข้ามบล็อก `groups` เพราะ `groups: { "*": { "requireMention": true } }` ของ BlueBubbles ดูเหมือนการตั้งค่า mention ที่ไม่เกี่ยวข้อง แต่จริง ๆ แล้วเป็นส่วนสำคัญสำหรับ gate ของ registry

config ขั้นต่ำเพื่อให้ข้อความกลุ่มยังไหลต่อหลังตั้งค่า `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` ภายใต้ `*` ไม่ก่อปัญหาเมื่อไม่ได้กำหนดรูปแบบการกล่าวถึงไว้: runtime ตั้งค่า `canDetectMention = false` และลัดขั้นตอนการตัดข้อความจากการกล่าวถึงที่ `inbound-processing.ts:512` เมื่อกำหนดรูปแบบการกล่าวถึงไว้ (`agents.list[].groupChat.mentionPatterns`) จะทำงานตามที่คาดไว้

หาก Gateway บันทึก `imessage: dropping group message from chat_id=<id>` หรือบรรทัดเริ่มต้น `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` แสดงว่า gate 2 กำลังตัดทิ้ง — ให้เพิ่มบล็อก `groups`

## ทีละขั้นตอน

1. เพิ่มบล็อก iMessage ข้างบล็อก BlueBubbles ที่มีอยู่ เก็บบล็อกเดิมไว้เป็นแหล่งคัดลอกเท่านั้นจนกว่าจะยืนยันเส้นทางใหม่แล้ว:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **การทดสอบแบบ dry-run** — เริ่ม Gateway และยืนยันว่า iMessage รายงานว่าสุขภาพดี:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   เนื่องจาก `imessage.enabled` ยังเป็น `false` จึงยังไม่มีการกำหนดเส้นทางทราฟฟิก iMessage ขาเข้า — แต่ `--probe` จะทดสอบ bridge เพื่อให้คุณพบปัญหาสิทธิ์หรือการติดตั้งก่อนการสลับใช้งานจริง

3. **สลับใช้งานจริง** ลบการกำหนดค่า BlueBubbles และเปิดใช้ iMessage ในการแก้ไข config ครั้งเดียว:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   รีสตาร์ท Gateway ตอนนี้ทราฟฟิก iMessage ขาเข้าจะไหลผ่าน Plugin ที่มาพร้อมในชุด

4. **ยืนยัน DM** ส่งข้อความตรงถึง agent; ยืนยันว่าการตอบกลับส่งถึงปลายทาง

5. **ยืนยันกลุ่มแยกต่างหาก** DM และกลุ่มใช้เส้นทางโค้ดต่างกัน — ความสำเร็จของ DM ไม่ได้พิสูจน์ว่ากลุ่มกำลังกำหนดเส้นทางได้ ส่งข้อความถึง agent ในแชตกลุ่มที่จับคู่แล้วและยืนยันว่าการตอบกลับส่งถึงปลายทาง หากกลุ่มเงียบไป (ไม่มีการตอบกลับจาก agent, ไม่มีข้อผิดพลาด) ให้ตรวจ log ของ Gateway สำหรับ `imessage: dropping group message from chat_id=<id>` หรือบรรทัดเริ่มต้น `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — ทั้งสองจะแสดงที่ระดับ log ค่าเริ่มต้น หากพบอย่างใดอย่างหนึ่ง แสดงว่าบล็อก `groups` ของคุณหายไปหรือว่างเปล่า — ดู "Group registry footgun" ด้านบน

6. **ยืนยันพื้นผิวการทำงาน** — จาก DM ที่จับคู่แล้ว ให้ขอให้ agent กดแสดงความรู้สึก แก้ไข ยกเลิกการส่ง ตอบกลับ ส่งรูปภาพ และ (ในกลุ่ม) เปลี่ยนชื่อกลุ่ม / เพิ่มหรือลบผู้เข้าร่วม แต่ละการทำงานควรส่งถึง Messages.app แบบ native หากรายการใดแสดงข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ให้รัน `imsg launch` อีกครั้งและรีเฟรช `channels status --probe`

7. **ลบเซิร์ฟเวอร์และ config ของ BlueBubbles** เมื่อยืนยัน DM, กลุ่ม และการทำงานของ iMessage แล้ว OpenClaw จะไม่ใช้ `channels.bluebubbles`

## ภาพรวมความเท่าเทียมของการทำงาน

| การทำงาน                                                   | BlueBubbles รุ่นเดิม                 | iMessage ที่มาพร้อมในชุด                                                                                               |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ส่งข้อความ / fallback เป็น SMS                             | ✅                                  | ✅                                                                                                                      |
| ส่งสื่อ (รูปภาพ วิดีโอ ไฟล์ เสียง)                         | ✅                                  | ✅                                                                                                                      |
| การตอบกลับเป็นเธรด (`reply_to_guid`)                       | ✅                                  | ✅ (ปิด [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                    |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| แก้ไข / ยกเลิกการส่ง (ผู้รับ macOS 13+)                    | ✅                                  | ✅                                                                                                                      |
| ส่งพร้อมเอฟเฟกต์หน้าจอ                                    | ✅                                  | ✅ (ปิดบางส่วนของ [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| ข้อความ rich text ตัวหนา / ตัวเอียง / ขีดเส้นใต้ / ขีดฆ่า | ✅                                  | ✅ (การจัดรูปแบบ typed-run ผ่าน attributedBody)                                                                         |
| เปลี่ยนชื่อกลุ่ม / ตั้งไอคอนกลุ่ม                          | ✅                                  | ✅                                                                                                                      |
| เพิ่ม / ลบผู้เข้าร่วม, ออกจากกลุ่ม                         | ✅                                  | ✅                                                                                                                      |
| ใบตอบรับการอ่านและตัวบ่งชี้ว่ากำลังพิมพ์                  | ✅                                  | ✅ (ถูกควบคุมด้วยการ probe private API)                                                                                 |
| การรวม DM จากผู้ส่งคนเดียวกัน                              | ✅                                  | ✅ (เฉพาะ DM; เลือกเปิดใช้ผ่าน `channels.imessage.coalesceSameSenderDms`)                                               |
| ดึงข้อความขาเข้าที่ได้รับระหว่าง Gateway หยุดทำงาน         | ✅ (replay Webhook + ดึงประวัติ)    | ✅ (เลือกเปิดใช้ผ่าน `channels.imessage.catchup.enabled`; ปิด [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

ตอนนี้ iMessage catchup พร้อมใช้งานเป็นฟีเจอร์แบบเลือกเปิดใช้บน Plugin ที่มาพร้อมในชุด เมื่อ Gateway เริ่มทำงาน หาก `channels.imessage.catchup.enabled` เป็น `true` Gateway จะรัน `chats.list` หนึ่งครั้ง + `messages.history` ต่อแชตผ่านไคลเอนต์ JSON-RPC เดียวกับที่ `imsg watch` ใช้ replay แถวขาเข้าที่พลาดไปแต่ละแถวผ่านเส้นทาง dispatch สด (allowlists, group policy, debouncer, echo cache) และบันทึก cursor ต่อบัญชีเพื่อให้การเริ่มต้นครั้งถัดไปทำต่อจากจุดเดิม ดู [การตามเก็บหลัง Gateway หยุดทำงาน](/th/channels/imessage#catching-up-after-gateway-downtime) สำหรับการปรับแต่ง

## การจับคู่ เซสชัน และการผูก ACP

- **การอนุมัติการจับคู่** จะย้ายตาม handle คุณไม่จำเป็นต้องอนุมัติผู้ส่งที่รู้จักซ้ำ — `channels.imessage.allowFrom` รู้จักสตริง `+15555550123` / `user@example.com` เดียวกับที่ BlueBubbles ใช้
- **เซสชัน** ยังคงถูกจำกัดขอบเขตต่อ agent + แชต DM จะถูกรวมเข้าเซสชันหลักของ agent ภายใต้ค่าเริ่มต้น `session.dmScope=main`; เซสชันกลุ่มยังแยกตาม `chat_id` คีย์เซสชันแตกต่างกัน (`agent:<id>:imessage:group:<chat_id>` เทียบกับของ BlueBubbles) — ประวัติการสนทนาเดิมภายใต้คีย์เซสชันของ BlueBubbles จะไม่ย้ายเข้าเซสชัน iMessage
- **การผูก ACP** ที่อ้างถึง `match.channel: "bluebubbles"` ต้องอัปเดตเป็น `"imessage"` รูปแบบ `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle เปล่า) เหมือนกัน

## ไม่มีช่องทางย้อนกลับ

ไม่มี runtime ของ BlueBubbles ที่รองรับให้สลับกลับ หากการยืนยัน iMessage ล้มเหลว ให้ตั้งค่า `channels.imessage.enabled: false` รีสตาร์ท Gateway แก้ตัวบล็อก `imsg` แล้วลองสลับใช้งานจริงอีกครั้ง

แคชการตอบกลับอยู่ที่ `~/.openclaw/state/imessage/reply-cache.jsonl` (โหมด `0600`, ไดเรกทอรีแม่ `0700`) ลบได้อย่างปลอดภัยหากคุณต้องการเริ่มใหม่ทั้งหมด

## ที่เกี่ยวข้อง

- [iMessage](/th/channels/imessage) — เอกสารอ้างอิงช่องทาง iMessage ฉบับเต็ม รวมถึงการตั้งค่า `imsg launch` และการตรวจจับความสามารถ
- `/channels/bluebubbles` — URL รุ่นเดิมที่เปลี่ยนเส้นทางมายังคู่มือการย้ายนี้
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีที่ Gateway เลือกช่องทางสำหรับการตอบกลับขาออก
