---
read_when:
    - การวางแผนย้ายจาก BlueBubbles ไปยัง Plugin iMessage ที่รวมมาในตัว
    - การแปลงคีย์การกำหนดค่า BlueBubbles ให้เป็นรายการเทียบเท่าใน iMessage
    - การตรวจสอบ imsg ก่อนเปิดใช้งาน Plugin iMessage
summary: ย้ายการกำหนดค่า BlueBubbles เก่าไปยัง Plugin iMessage ที่รวมมาให้ โดยไม่สูญเสียการจับคู่ รายการอนุญาต หรือการผูกกลุ่ม
title: ย้ายมาจาก BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` ที่มาพร้อมชุดติดตั้งตอนนี้เข้าถึงพื้นผิว private API เดียวกับ BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, การจัดการกลุ่ม, ไฟล์แนบ) โดยขับเคลื่อน [`steipete/imsg`](https://github.com/steipete/imsg) ผ่าน JSON-RPC หากคุณใช้งาน Mac ที่ติดตั้ง `imsg` อยู่แล้ว คุณสามารถเลิกใช้เซิร์ฟเวอร์ BlueBubbles แล้วให้ Plugin คุยกับ Messages.app โดยตรงได้

การรองรับ BlueBubbles ถูกนำออกแล้ว OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น คู่มือนี้มีไว้สำหรับย้าย config `channels.bluebubbles` เก่าไปยัง `channels.imessage`; ไม่มีเส้นทางการย้ายอื่นที่รองรับ

<Note>
สำหรับประกาศสั้นและสรุปสำหรับผู้ปฏิบัติงาน โปรดดู [การนำ BlueBubbles ออกและเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage)
</Note>

## รายการตรวจสอบการย้าย

ใช้รายการตรวจสอบนี้เมื่อคุณรู้ config BlueBubbles เก่าอยู่แล้วและต้องการเส้นทางที่สั้นที่สุดซึ่งปลอดภัย:

1. ตรวจสอบ `imsg` โดยตรงบน Mac ที่รัน Messages.app (`imsg chats`, `imsg history`, `imsg send` และ `imsg rpc --help`)
2. คัดลอกคีย์พฤติกรรมจาก `channels.bluebubbles` ไปยัง `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` และ `actions`
3. ลบคีย์การขนส่งที่ไม่มีอยู่แล้ว: `serverUrl`, `password`, URL ของ Webhook และการตั้งค่าเซิร์ฟเวอร์ BlueBubbles
4. หาก Gateway ไม่ได้รันอยู่บน Messages Mac ให้ตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper และตั้งค่า `remoteHost` สำหรับการดึงไฟล์แนบระยะไกล
5. เมื่อหยุด Gateway แล้ว ให้เปิดใช้ `channels.imessage` จากนั้นรัน `openclaw channels status --probe --channel imessage`
6. ทดสอบ DM หนึ่งรายการ กลุ่มที่อนุญาตหนึ่งกลุ่ม ไฟล์แนบหากเปิดใช้ และการดำเนินการ private API ทุกอย่างที่คุณคาดว่าเอเจนต์จะใช้
7. ลบเซิร์ฟเวอร์ BlueBubbles และ config `channels.bluebubbles` เก่าหลังจากตรวจสอบเส้นทาง iMessage แล้ว

## เมื่อการย้ายนี้เหมาะสม

- คุณรัน `imsg` อยู่แล้วบน Mac เครื่องเดียวกัน (หรือเครื่องที่เข้าถึงได้ผ่าน SSH) ซึ่ง Messages.app ลงชื่อเข้าใช้อยู่
- คุณต้องการลดชิ้นส่วนที่ต้องดูแลลงหนึ่งอย่าง — ไม่มีเซิร์ฟเวอร์ BlueBubbles แยกต่างหาก ไม่มี REST endpoint ที่ต้องยืนยันตัวตน ไม่มีงานเดินท่อ Webhook ใช้ไบนารี CLI เดียวแทนเซิร์ฟเวอร์ + แอปไคลเอนต์ + helper
- คุณอยู่บน [macOS / บิลด์ `imsg` ที่รองรับ](/th/channels/imessage#requirements-and-permissions-macos) ซึ่ง probe ของ private API รายงาน `available: true`

## imsg ทำอะไร

`imsg` คือ CLI บน macOS สำหรับ Messages OpenClaw เริ่ม `imsg rpc` เป็น child process แล้วคุย JSON-RPC ผ่าน stdin/stdout ไม่มี HTTP server, URL ของ Webhook, background daemon, launch agent หรือพอร์ตที่ต้องเปิดเผย

- การอ่านมาจาก `~/Library/Messages/chat.db` โดยใช้ handle SQLite แบบอ่านอย่างเดียว
- ข้อความขาเข้าแบบสดมาจาก `imsg watch` / `watch.subscribe` ซึ่งติดตาม event ของระบบไฟล์ `chat.db` พร้อม fallback แบบ polling
- การส่งใช้ระบบอัตโนมัติของ Messages.app สำหรับการส่งข้อความและไฟล์ปกติ
- การดำเนินการขั้นสูงใช้ `imsg launch` เพื่อฉีด helper ของ `imsg` เข้าไปใน Messages.app นี่คือสิ่งที่ปลดล็อก read receipts, typing indicators, rich sends, edit, unsend, threaded reply, tapbacks และการจัดการกลุ่ม
- บิลด์ Linux สามารถตรวจสอบ `chat.db` ที่คัดลอกมาได้ แต่ไม่สามารถส่ง ดูฐานข้อมูล Mac แบบสด หรือขับเคลื่อน Messages.app ได้ สำหรับ OpenClaw iMessage ให้รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้แล้วหรือผ่าน SSH wrapper ไปยัง Mac เครื่องนั้น

## ก่อนเริ่มต้น

1. ติดตั้ง `imsg` บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   หาก `imsg chats` ล้มเหลวด้วย `unable to open database file`, เอาต์พุตว่างเปล่า หรือ `authorization denied` ให้มอบสิทธิ์ Full Disk Access แก่ terminal, editor, Node process, Gateway service หรือ SSH parent process ที่เปิด `imsg` จากนั้นเปิด parent process นั้นใหม่

2. ตรวจสอบพื้นผิวการอ่าน การ watch การส่ง และ RPC ก่อนเปลี่ยน config ของ OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   แทนที่ `42` ด้วย chat id จริงจาก `imsg chats` การส่งต้องใช้สิทธิ์ Automation สำหรับ Messages.app หาก OpenClaw จะรันผ่าน SSH ให้รันคำสั่งเหล่านี้ผ่าน SSH wrapper หรือบริบทผู้ใช้เดียวกับที่ OpenClaw จะใช้

3. เปิดใช้ bridge ของ private API เมื่อคุณต้องการการดำเนินการขั้นสูง:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` ต้องปิดใช้ SIP การส่งพื้นฐาน ประวัติ และ watch ทำงานได้โดยไม่ต้องมี `imsg launch`; การดำเนินการขั้นสูงทำไม่ได้

4. หลังจากคุณเพิ่ม config `channels.imessage` ที่เปิดใช้งานแล้ว ให้ตรวจสอบ bridge ผ่าน OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   คุณต้องการ `imessage.privateApi.available: true` หากรายงานเป็น `false` ให้แก้สิ่งนั้นก่อน — ดู [การตรวจจับความสามารถ](/th/channels/imessage#private-api-actions) `channels status --probe` จะ probe เฉพาะบัญชีที่กำหนดค่าและเปิดใช้งานแล้วเท่านั้น

5. สำรอง snapshot ของ config:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## การแปล config

iMessage และ BlueBubbles ใช้ config ระดับช่องทางร่วมกันหลายอย่าง คีย์ที่เปลี่ยนส่วนใหญ่เป็นการขนส่ง (REST server เทียบกับ CLI ภายในเครื่อง) คีย์พฤติกรรม (`dmPolicy`, `groupPolicy`, `allowFrom` ฯลฯ) ยังคงมีความหมายเหมือนเดิม

| BlueBubbles                                                | iMessage ที่บันเดิลมา                          | หมายเหตุ                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | ความหมายเดียวกัน                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(นำออกแล้ว)_                               | ไม่มีเซิร์ฟเวอร์ REST — Plugin จะสปอว์น `imsg rpc` ผ่าน stdio                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(นำออกแล้ว)_                               | ไม่ต้องมีการยืนยันตัวตน Webhook                                                                                                                                                                                                                                                                                                            |
| _(โดยปริยาย)_                                               | `channels.imessage.cliPath`               | พาธไปยัง `imsg` (ค่าเริ่มต้น `imsg`); ใช้สคริปต์ wrapper สำหรับ SSH                                                                                                                                                                                                                                                                               |
| _(โดยปริยาย)_                                               | `channels.imessage.dbPath`                | การ override `chat.db` ของ Messages.app แบบไม่บังคับ; ตรวจพบอัตโนมัติเมื่อเว้นไว้                                                                                                                                                                                                                                                                        |
| _(โดยปริยาย)_                                               | `channels.imessage.remoteHost`            | `host` หรือ `user@host` — ต้องใช้เมื่อ `cliPath` เป็น wrapper ของ SSH และคุณต้องการดึงไฟล์แนบผ่าน SCP เท่านั้น                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | ค่าเดียวกัน (`pairing` / `allowlist` / `open` / `disabled`)                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | การอนุมัติการจับคู่จะย้ายตาม handle ไม่ใช่ตามโทเค็น                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | ค่าเดียวกัน (`allowlist` / `open` / `disabled`)                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | เหมือนกัน                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **คัดลอกส่วนนี้ตามตัวอักษร รวมถึงรายการ wildcard `groups: { "*": { ... } }` ใด ๆ** ค่า `requireMention`, `tools`, `toolsBySender` รายกลุ่มจะย้ายตามไปด้วย เมื่อใช้ `groupPolicy: "allowlist"` บล็อก `groups` ที่ว่างหรือหายไปจะทิ้งข้อความกลุ่มทุกข้อความอย่างเงียบ ๆ — ดู "กับดัก group registry" ด้านล่าง                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | ค่าเริ่มต้น `true` เมื่อใช้ Plugin ที่บันเดิลมา สิ่งนี้จะทำงานเฉพาะเมื่อ probe ของ API ส่วนตัวทำงานอยู่เท่านั้น                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | รูปทรงเดียวกัน, **ปิดโดยค่าเริ่มต้นเหมือนกัน** หากคุณเคยให้ไฟล์แนบไหลผ่านบน BlueBubbles คุณต้องตั้งค่านี้อีกครั้งอย่างชัดเจนในบล็อก iMessage — ค่านี้จะไม่ย้ายตามไปโดยปริยาย และรูปภาพ/สื่อขาเข้าจะถูกทิ้งอย่างเงียบ ๆ โดยไม่มีบรรทัดล็อก `Inbound message` จนกว่าคุณจะตั้งค่า                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | root ภายในเครื่อง; กฎ wildcard เหมือนกัน                                                                                                                                                                                                                                                                                                            |
| _(ไม่เกี่ยวข้อง)_                                                    | `channels.imessage.remoteAttachmentRoots` | ใช้เฉพาะเมื่อตั้งค่า `remoteHost` สำหรับการดึงผ่าน SCP                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | ค่าเริ่มต้น 16 MB บน iMessage (ค่าเริ่มต้นของ BlueBubbles คือ 8 MB) ตั้งค่าอย่างชัดเจนหากคุณต้องการคงเพดานที่ต่ำกว่าไว้                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | ค่าเริ่มต้น 4000 ทั้งสองช่องทาง                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | การ opt-in เหมือนกัน ใช้กับ DM เท่านั้น — แชตกลุ่มยังคงส่งต่อรายข้อความทันทีในทั้งสองช่องทาง เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.imessage` ที่ชัดเจน จะขยายค่า debounce ขาเข้าเริ่มต้นเป็น 2500 ms ดู [เอกสาร iMessage § การรวม DM ที่ส่งแยก](/th/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(ไม่เกี่ยวข้อง)_                                   | iMessage อ่านชื่อที่แสดงของผู้ส่งจาก `chat.db` อยู่แล้ว                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | toggle ราย action: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`                                                                                                                                                          |

การกำหนดค่าหลายบัญชี (`channels.bluebubbles.accounts.*`) แปลแบบหนึ่งต่อหนึ่งเป็น `channels.imessage.accounts.*`

## กับดัก group registry

Plugin iMessage ที่บันเดิลมารัน gate allowlist ของกลุ่ม **สอง** ชั้นแยกกันต่อเนื่อง ทั้งสองชั้นต้องผ่าน ข้อความกลุ่มจึงจะไปถึง agent ได้:

1. **allowlist ของผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — ตรวจโดย `isAllowedIMessageSender` จับคู่ข้อความขาเข้าตาม handle ผู้ส่ง, `chat_guid`, `chat_identifier`, หรือ `chat_id` รูปทรงเดียวกับ BlueBubbles
2. **group registry** (`channels.imessage.groups`) — ตรวจโดย `resolveChannelGroupPolicy` จาก `inbound-processing.ts:199` เมื่อใช้ `groupPolicy: "allowlist"` gate นี้ต้องมีอย่างใดอย่างหนึ่ง:
   - รายการ wildcard `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือ
   - รายการต่อ `chat_id` ที่ชัดเจนใต้ `groups`

หาก gate 1 ผ่านแต่ gate 2 ไม่ผ่าน ข้อความจะถูกทิ้ง Plugin จะปล่อยสัญญาณระดับ `warn` สองแบบ เพื่อให้สิ่งนี้ไม่เงียบอีกต่อไปในระดับล็อกเริ่มต้น:

- `warn` ตอนเริ่มต้นหนึ่งครั้งต่อบัญชี เมื่อมีการตั้งค่า `groupPolicy: "allowlist"` แต่ `channels.imessage.groups` ว่างเปล่า (ไม่มี wildcard `"*"`, ไม่มีรายการต่อ `chat_id`) — ทำงานก่อนที่ข้อความใด ๆ จะเข้ามา
- `warn` หนึ่งครั้งต่อ `chat_id` ในครั้งแรกที่กลุ่มใดกลุ่มหนึ่งถูกทิ้งตอน runtime โดยระบุ chat_id และคีย์ที่แน่นอนที่ต้องเพิ่มใน `groups` เพื่ออนุญาต

DM จะยังทำงานต่อไป เพราะใช้ code path คนละเส้นทาง

นี่คือโหมดความล้มเหลวที่พบบ่อยที่สุดในการย้ายจาก BlueBubbles → iMessage ที่บันเดิลมา: ผู้ปฏิบัติงานคัดลอก `groupAllowFrom` และ `groupPolicy` แต่ข้ามบล็อก `groups` เพราะ `groups: { "*": { "requireMention": true } }` ของ BlueBubbles ดูเหมือนการตั้งค่าการกล่าวถึงที่ไม่เกี่ยวข้อง ที่จริงแล้วมันเป็นส่วนสำคัญสำหรับ gate ของ registry

การกำหนดค่าขั้นต่ำเพื่อให้ข้อความกลุ่มยังไหลต่อหลังจาก `groupPolicy: "allowlist"`:

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

`requireMention: true` ใต้ `*` ไม่มีผลเสียเมื่อไม่ได้กำหนดรูปแบบการ mention: runtime ตั้งค่า `canDetectMention = false` และตัดการทิ้ง mention สั้น ๆ ที่ `inbound-processing.ts:512` เมื่อกำหนดรูปแบบการ mention แล้ว (`agents.list[].groupChat.mentionPatterns`) จะทำงานตามที่คาดไว้

หาก Gateway บันทึก log ว่า `imessage: dropping group message from chat_id=<id>` หรือบรรทัดตอนเริ่มต้น `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` แสดงว่า gate 2 กำลังทิ้งข้อความอยู่ ให้เพิ่มบล็อก `groups`

## ทีละขั้นตอน

1. เพิ่มบล็อก iMessage ข้างบล็อก BlueBubbles ที่มีอยู่ ปิดใช้งานไว้ระหว่างที่ Gateway ยัง route traffic ของ BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **ตรวจสอบก่อน traffic มีความสำคัญ** — หยุด Gateway, เปิดใช้งานบล็อก iMessage ชั่วคราว และยืนยันว่า iMessage รายงานสถานะปกติจาก CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` ตรวจสอบเฉพาะบัญชีที่กำหนดค่าและเปิดใช้งานแล้วเท่านั้น อย่ารีสตาร์ท Gateway โดยเปิดใช้ทั้ง BlueBubbles และ iMessage พร้อมกัน เว้นแต่ว่าคุณตั้งใจให้ตัว monitor ของทั้งสองช่องทางทำงานอยู่ หากยังไม่ได้ cut over ทันที ให้ตั้งค่า `channels.imessage.enabled` กลับเป็น `false` ก่อนรีสตาร์ท Gateway ใช้คำสั่ง `imsg` โดยตรงใน [ก่อนเริ่มต้น](#before-you-start) เพื่อตรวจสอบ Mac ก่อนเปิดใช้ traffic ของ OpenClaw

3. **Cut over** เมื่อบัญชี iMessage ที่เปิดใช้งานรายงานสถานะปกติแล้ว ให้ลบ config ของ BlueBubbles และเปิดใช้ iMessage ต่อไป:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   รีสตาร์ท Gateway ตอนนี้ traffic ขาเข้าของ iMessage จะไหลผ่าน Plugin ที่บันเดิลมา

4. **ตรวจสอบ DM** ส่งข้อความตรงไปยัง agent แล้วยืนยันว่ามี reply กลับมา

5. **ตรวจสอบกลุ่มแยกต่างหาก** DM และกลุ่มใช้ code path ต่างกัน ความสำเร็จของ DM ไม่ได้พิสูจน์ว่ากลุ่ม route ได้ ส่งข้อความถึง agent ใน group chat ที่ pair แล้ว และยืนยันว่ามี reply กลับมา หากกลุ่มเงียบไป (ไม่มี reply จาก agent, ไม่มี error) ให้ตรวจ log ของ Gateway สำหรับ `imessage: dropping group message from chat_id=<id>` หรือบรรทัดตอนเริ่มต้น `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` ทั้งสองจะแสดงที่ระดับ log เริ่มต้น หากมีบรรทัดใดปรากฏ แสดงว่าบล็อก `groups` ของคุณหายไปหรือว่างอยู่ โปรดดู "Group registry footgun" ด้านบน

6. **ตรวจสอบพื้นผิว action** — จาก DM ที่ pair แล้ว ให้ขอให้ agent react, edit, unsend, reply, ส่งรูปภาพ และ (ในกลุ่ม) เปลี่ยนชื่อกลุ่ม / เพิ่มหรือลบผู้เข้าร่วม แต่ละ action ควรไปถึง Messages.app แบบ native หากรายการใดโยน "iMessage `<action>` requires the imsg private API bridge" ให้รัน `imsg launch` อีกครั้งแล้ว refresh `channels status --probe`

7. **ลบเซิร์ฟเวอร์และ config ของ BlueBubbles** เมื่อยืนยัน DM, กลุ่ม และ action ของ iMessage แล้ว OpenClaw จะไม่ใช้ `channels.bluebubbles`

## ภาพรวมความเท่าเทียมของ action

| Action                                                     | BlueBubbles เดิม                    | iMessage ที่บันเดิลมา                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ส่งข้อความ / fallback เป็น SMS                            | ✅                                  | ✅                                                                                                                      |
| ส่งสื่อ (รูปภาพ, วิดีโอ, ไฟล์, เสียง)                    | ✅                                  | ✅                                                                                                                      |
| reply แบบ thread (`reply_to_guid`)                         | ✅                                  | ✅ (ปิด [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                    |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Edit / unsend (ผู้รับ macOS 13+)                           | ✅                                  | ✅                                                                                                                      |
| ส่งพร้อม screen effect                                    | ✅                                  | ✅ (ปิดบางส่วนของ [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| rich text ตัวหนา / ตัวเอียง / ขีดเส้นใต้ / ขีดทับ         | ✅                                  | ✅ (การจัดรูปแบบ typed-run ผ่าน attributedBody)                                                                         |
| เปลี่ยนชื่อกลุ่ม / ตั้งไอคอนกลุ่ม                         | ✅                                  | ✅                                                                                                                      |
| เพิ่ม / ลบผู้เข้าร่วม, ออกจากกลุ่ม                        | ✅                                  | ✅                                                                                                                      |
| read receipts และ typing indicator                         | ✅                                  | ✅ (ถูก gate ด้วยการ probe private API)                                                                                 |
| การรวม DM จากผู้ส่งเดียวกัน                               | ✅                                  | ✅ (เฉพาะ DM; opt-in ผ่าน `channels.imessage.coalesceSameSenderDms`)                                                    |
| catchup ข้อความขาเข้าที่ได้รับขณะ gateway หยุดทำงาน       | ✅ (เล่นซ้ำ Webhook + ดึง history) | ✅ (opt-in ผ่าน `channels.imessage.catchup.enabled`; ปิด [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

ตอนนี้ iMessage catchup พร้อมใช้งานเป็นฟีเจอร์ opt-in บน Plugin ที่บันเดิลมา เมื่อ Gateway เริ่มต้น หาก `channels.imessage.catchup.enabled` เป็น `true` Gateway จะรันหนึ่ง pass ของ `chats.list` + `messages.history` ต่อ chat กับ client JSON-RPC เดียวกับที่ `imsg watch` ใช้ เล่นซ้ำแต่ละ row ขาเข้าที่พลาดผ่าน path dispatch สด (allowlists, group policy, debouncer, echo cache) และ persist cursor ต่อบัญชี เพื่อให้การเริ่มต้นครั้งถัดไปทำงานต่อจากจุดเดิม ดู [การ catch up หลัง Gateway downtime](/th/channels/imessage#catching-up-after-gateway-downtime) สำหรับการปรับแต่ง

## การ pairing, session และ binding ของ ACP

- **การอนุมัติ pairing** จะตามไปด้วยตาม handle คุณไม่จำเป็นต้องอนุมัติผู้ส่งที่รู้จักอีกครั้ง `channels.imessage.allowFrom` รู้จักสตริง `+15555550123` / `user@example.com` เดียวกับที่ BlueBubbles ใช้
- **Session** ยังคง scoped ต่อ agent + chat DM จะยุบเข้าเป็น session หลักของ agent ภายใต้ค่าเริ่มต้น `session.dmScope=main`; session ของกลุ่มยังคงแยกตาม `chat_id` key ของ session ต่างกัน (`agent:<id>:imessage:group:<chat_id>` เทียบกับค่าที่เทียบเท่าของ BlueBubbles) ประวัติการสนทนาเดิมภายใต้ key ของ session BlueBubbles จะไม่ย้ายเข้ามาใน session ของ iMessage
- **binding ของ ACP** ที่อ้างถึง `match.channel: "bluebubbles"` ต้องอัปเดตเป็น `"imessage"` รูปแบบ `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle เปล่า) เหมือนกัน

## ไม่มีช่องทาง rollback

ไม่มี runtime ของ BlueBubbles ที่รองรับให้สลับกลับไปได้ หากการตรวจสอบ iMessage ล้มเหลว ให้ตั้งค่า `channels.imessage.enabled: false`, รีสตาร์ท Gateway, แก้ตัวบล็อก `imsg` แล้วลอง cutover อีกครั้ง

reply cache อยู่ที่ `~/.openclaw/state/imessage/reply-cache.jsonl` (mode `0600`, ไดเรกทอรีแม่ `0700`) ลบได้อย่างปลอดภัยหากต้องการเริ่มใหม่

## ที่เกี่ยวข้อง

- [การลบ BlueBubbles และ path iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศสั้นและสรุปสำหรับ operator
- [iMessage](/th/channels/imessage) — เอกสารอ้างอิงช่องทาง iMessage ฉบับเต็ม รวมถึงการตั้งค่า `imsg launch` และการตรวจจับ capability
- `/channels/bluebubbles` — URL legacy ที่ redirect ไปยังคู่มือ migration นี้
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การ pairing
- [Channel Routing](/th/channels/channel-routing) — วิธีที่ Gateway เลือกช่องทางสำหรับ reply ขาออก
