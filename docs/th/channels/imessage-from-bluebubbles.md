---
read_when:
    - การวางแผนย้ายจาก BlueBubbles ไปยัง Plugin iMessage ที่รวมมาให้
    - แปลคีย์การกำหนดค่า BlueBubbles เป็นค่าที่เทียบเท่าใน iMessage
    - กำลังตรวจสอบ imsg ก่อนเปิดใช้งาน Plugin iMessage
summary: ย้ายคอนฟิก BlueBubbles เก่าไปยัง Plugin iMessage ที่บันเดิลมาให้โดยไม่สูญเสียการจับคู่ allowlists หรือการผูกกลุ่ม
title: มาจาก BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` ที่รวมมาให้ตอนนี้เข้าถึงพื้นผิว API ส่วนตัวเดียวกับ BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, การจัดการกลุ่ม, ไฟล์แนบ) โดยขับ [`steipete/imsg`](https://github.com/steipete/imsg) ผ่าน JSON-RPC หากคุณใช้งาน Mac ที่ติดตั้ง `imsg` อยู่แล้ว คุณสามารถเลิกใช้เซิร์ฟเวอร์ BlueBubbles และให้ Plugin คุยกับ Messages.app โดยตรงได้

การรองรับ BlueBubbles ถูกนำออกแล้ว OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น คู่มือนี้มีไว้สำหรับย้ายคอนฟิก `channels.bluebubbles` เดิมไปเป็น `channels.imessage`; ไม่มีเส้นทางการย้ายอื่นที่รองรับ

<Note>
สำหรับประกาศสั้นและสรุปสำหรับผู้ดูแลระบบ โปรดดู [การนำ BlueBubbles ออกและเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage)
</Note>

## เช็กลิสต์การย้าย

ใช้เช็กลิสต์นี้เมื่อคุณรู้คอนฟิก BlueBubbles เดิมของคุณอยู่แล้วและต้องการเส้นทางที่สั้นที่สุดอย่างปลอดภัย:

1. ตรวจสอบ `imsg` โดยตรงบน Mac ที่รัน Messages.app (`imsg chats`, `imsg history`, `imsg send`, และ `imsg rpc --help`)
2. คัดลอกคีย์พฤติกรรมจาก `channels.bluebubbles` ไปยัง `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, และ `actions`
3. ลบคีย์ทรานสปอร์ตที่ไม่มีอยู่อีกต่อไป: `serverUrl`, `password`, URL ของ Webhook และการตั้งค่าเซิร์ฟเวอร์ BlueBubbles
4. หาก Gateway ไม่ได้รันอยู่บน Messages Mac ให้ตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper และตั้งค่า `remoteHost` สำหรับการดึงไฟล์แนบจากระยะไกล
5. ขณะ Gateway หยุดอยู่ ให้เปิดใช้ `channels.imessage` แล้วรัน `openclaw channels status --probe --channel imessage`
6. ทดสอบ DM หนึ่งรายการ กลุ่มที่อนุญาตหนึ่งกลุ่ม ไฟล์แนบหากเปิดใช้ และทุกการกระทำของ API ส่วนตัวที่คุณคาดว่า agent จะใช้
7. ลบเซิร์ฟเวอร์ BlueBubbles และคอนฟิก `channels.bluebubbles` เดิมหลังจากตรวจสอบเส้นทาง iMessage แล้ว

## เมื่อการย้ายนี้เหมาะสม

- คุณรัน `imsg` อยู่แล้วบน Mac เครื่องเดียวกัน (หรือเครื่องที่เข้าถึงได้ผ่าน SSH) ซึ่ง Messages.app ลงชื่อเข้าใช้อยู่
- คุณต้องการลดชิ้นส่วนที่ต้องดูแลลงหนึ่งอย่าง — ไม่มีเซิร์ฟเวอร์ BlueBubbles แยก ไม่มี REST endpoint ที่ต้องยืนยันตัวตน ไม่มีงานเดินท่อ Webhook ใช้ไบนารี CLI ตัวเดียวแทนเซิร์ฟเวอร์ + แอปไคลเอนต์ + ตัวช่วย
- คุณอยู่บน [macOS / บิลด์ `imsg` ที่รองรับ](/th/channels/imessage#requirements-and-permissions-macos) ซึ่งการตรวจสอบ API ส่วนตัวรายงาน `available: true`

## imsg ทำอะไร

`imsg` คือ CLI ของ macOS แบบ local สำหรับ Messages OpenClaw เริ่ม `imsg rpc` เป็นโพรเซสลูกและคุย JSON-RPC ผ่าน stdin/stdout ไม่มีเซิร์ฟเวอร์ HTTP, URL ของ Webhook, daemon เบื้องหลัง, launch agent หรือพอร์ตที่ต้องเปิดเผย

- การอ่านมาจาก `~/Library/Messages/chat.db` โดยใช้ตัวจับ SQLite แบบอ่านอย่างเดียว
- ข้อความขาเข้าแบบสดมาจาก `imsg watch` / `watch.subscribe` ซึ่งติดตามเหตุการณ์ระบบไฟล์ของ `chat.db` พร้อม fallback แบบ polling
- การส่งใช้ระบบอัตโนมัติของ Messages.app สำหรับการส่งข้อความปกติและไฟล์
- การกระทำขั้นสูงใช้ `imsg launch` เพื่อฉีดตัวช่วย `imsg` เข้าไปใน Messages.app นั่นคือสิ่งที่ปลดล็อกใบตอบรับการอ่าน ตัวบ่งชี้การพิมพ์ การส่งแบบ rich, edit, unsend, การตอบกลับแบบเธรด, tapbacks และการจัดการกลุ่ม
- บิลด์ Linux สามารถตรวจสอบ `chat.db` ที่คัดลอกมาได้ แต่ไม่สามารถส่ง เฝ้าดูฐานข้อมูล Mac แบบสด หรือขับ Messages.app ได้ สำหรับ OpenClaw iMessage ให้รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้อยู่หรือผ่าน SSH wrapper ไปยัง Mac เครื่องนั้น

## ก่อนเริ่ม

1. ติดตั้ง `imsg` บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   หาก `imsg chats` ล้มเหลวด้วย `unable to open database file`, เอาต์พุตว่าง หรือ `authorization denied` ให้ให้สิทธิ์ Full Disk Access แก่เทอร์มินัล ตัวแก้ไข โพรเซส Node บริการ Gateway หรือโพรเซสแม่ของ SSH ที่เปิดใช้ `imsg` จากนั้นเปิดโพรเซสแม่นั้นใหม่

2. ตรวจสอบพื้นผิวการอ่าน การเฝ้าดู การส่ง และ RPC ก่อนเปลี่ยนคอนฟิก OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   แทนที่ `42` ด้วย chat id จริงจาก `imsg chats` การส่งต้องใช้สิทธิ์ Automation สำหรับ Messages.app หาก OpenClaw จะรันผ่าน SSH ให้รันคำสั่งเหล่านี้ผ่าน SSH wrapper หรือบริบทผู้ใช้เดียวกับที่ OpenClaw จะใช้ หากการอ่าน/การตรวจสอบทำงานแต่การส่งล้มเหลวด้วย AppleEvents `-1743` ให้ตรวจสอบว่า Automation ไปลงที่ `/usr/libexec/sshd-keygen-wrapper` หรือไม่; ดู [SSH wrapper ส่งล้มเหลวด้วย AppleEvents -1743](/th/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)

3. เปิดใช้สะพาน API ส่วนตัวเมื่อคุณต้องการการกระทำขั้นสูง:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` ต้องปิดใช้ SIP การส่งพื้นฐาน ประวัติ และการเฝ้าดูทำงานได้โดยไม่มี `imsg launch`; การกระทำขั้นสูงทำไม่ได้

4. หลังจากคุณเพิ่มคอนฟิก `channels.imessage` ที่เปิดใช้แล้ว ให้ตรวจสอบสะพานผ่าน OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   คุณต้องการ `imessage.privateApi.available: true` หากรายงานเป็น `false` ให้แก้ไขสิ่งนั้นก่อน — ดู [การตรวจจับความสามารถ](/th/channels/imessage#private-api-actions) `channels status --probe` ตรวจสอบเฉพาะบัญชีที่กำหนดค่าและเปิดใช้อยู่เท่านั้น

5. ทำ snapshot คอนฟิกของคุณ:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## การแปลคอนฟิก

iMessage และ BlueBubbles ใช้คอนฟิกระดับช่องทางร่วมกันจำนวนมาก คีย์ที่เปลี่ยนส่วนใหญ่เป็นทรานสปอร์ต (เซิร์ฟเวอร์ REST เทียบกับ CLI แบบ local) คีย์พฤติกรรม (`dmPolicy`, `groupPolicy`, `allowFrom` ฯลฯ) ยังคงมีความหมายเดิม

| BlueBubbles                                                | iMessage ที่บันเดิลมา                          | หมายเหตุ                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | ความหมายเหมือนกัน                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(นำออกแล้ว)_                               | ไม่มีเซิร์ฟเวอร์ REST — Plugin จะสปอว์น `imsg rpc` ผ่าน stdio                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(นำออกแล้ว)_                               | ไม่ต้องมีการยืนยันตัวตน Webhook                                                                                                                                                                                                                                                                                                                                                    |
| _(โดยนัย)_                                               | `channels.imessage.cliPath`               | พาธไปยัง `imsg` (ค่าเริ่มต้น `imsg`); ใช้สคริปต์ wrapper สำหรับ SSH                                                                                                                                                                                                                                                                                                                       |
| _(โดยนัย)_                                               | `channels.imessage.dbPath`                | การแทนที่ `chat.db` ของ Messages.app แบบไม่บังคับ; ตรวจพบอัตโนมัติเมื่อละไว้                                                                                                                                                                                                                                                                                                                |
| _(โดยนัย)_                                               | `channels.imessage.remoteHost`            | `host` หรือ `user@host` — จำเป็นเฉพาะเมื่อ `cliPath` เป็น SSH wrapper และคุณต้องการดึงไฟล์แนบผ่าน SCP                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | ค่าเหมือนกัน (`pairing` / `allowlist` / `open` / `disabled`)                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | การอนุมัติการจับคู่จะย้ายต่อโดยใช้ handle ไม่ใช่ token                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | ค่าเหมือนกัน (`allowlist` / `open` / `disabled`)                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | เหมือนกัน                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **คัดลอกส่วนนี้ตามตัวอักษร รวมถึงรายการ wildcard `groups: { "*": { ... } }` ใดๆ** ค่า `requireMention`, `tools`, `toolsBySender` รายกลุ่มจะย้ายต่อไป ด้วย `groupPolicy: "allowlist"` บล็อก `groups` ที่ว่างหรือขาดหายจะทิ้งข้อความกลุ่มทั้งหมดแบบเงียบๆ — ดู "กับดัก registry ของกลุ่ม" ด้านล่าง                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | ค่าเริ่มต้น `true` เมื่อใช้ Plugin ที่บันเดิลมา ค่านี้จะทำงานเฉพาะเมื่อ probe ของ API ส่วนตัวทำงานอยู่                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | รูปร่างเหมือนกัน, **ปิดไว้โดยค่าเริ่มต้นเหมือนกัน** หากคุณเคยให้ไฟล์แนบไหลผ่านบน BlueBubbles คุณต้องตั้งค่านี้ใหม่อย่างชัดเจนในบล็อก iMessage — ค่านี้จะไม่ย้ายต่อโดยนัย และรูปภาพ/สื่อขาเข้าจะถูกทิ้งแบบเงียบๆ โดยไม่มีบรรทัด log `Inbound message` จนกว่าคุณจะตั้งค่า                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | root ภายในเครื่อง; กฎ wildcard เหมือนกัน                                                                                                                                                                                                                                                                                                                                                    |
| _(ไม่มี)_                                                    | `channels.imessage.remoteAttachmentRoots` | ใช้เฉพาะเมื่อมีการตั้งค่า `remoteHost` สำหรับการดึงผ่าน SCP                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | ค่าเริ่มต้น 16 MB บน iMessage (ค่าเริ่มต้นของ BlueBubbles คือ 8 MB) ตั้งค่าอย่างชัดเจนหากคุณต้องการคงเพดานที่ต่ำกว่าไว้                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | ค่าเริ่มต้น 4000 ทั้งคู่                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | เป็นตัวเลือกเปิดใช้เหมือนกัน ใช้เฉพาะ DM — แชตกลุ่มยังคงส่งต่อทีละข้อความทันทีในทั้งสอง channel ขยายค่า debounce ขาเข้าเริ่มต้นเป็น 7000 ms เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.imessage` หรือ `messages.inbound.debounceMs` แบบ global ที่ระบุไว้ชัดเจน ดู [เอกสาร iMessage § การรวม DM ที่ส่งแยกกัน](/th/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(ไม่มี)_                                   | iMessage อ่านชื่อแสดงของผู้ส่งจาก `chat.db` อยู่แล้ว                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | toggle ราย action: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`                                                                                                                                                                                                  |

การกำหนดค่าหลายบัญชี (`channels.bluebubbles.accounts.*`) แปลแบบหนึ่งต่อหนึ่งเป็น `channels.imessage.accounts.*`

## กับดัก registry ของกลุ่ม

Plugin iMessage ที่บันเดิลมารันเกต allowlist ของกลุ่มที่แยกกัน **สอง** ตัวต่อเนื่องกัน ทั้งสองตัวต้องผ่านเพื่อให้ข้อความกลุ่มไปถึงเอเจนต์:

1. **allowlist ของผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — ตรวจโดย `isAllowedIMessageSender` จับคู่ข้อความขาเข้าด้วย handle ของผู้ส่ง, `chat_guid`, `chat_identifier` หรือ `chat_id` รูปร่างเหมือน BlueBubbles
2. **registry ของกลุ่ม** (`channels.imessage.groups`) — ตรวจโดย `resolveChannelGroupPolicy` จาก `inbound-processing.ts:199` เมื่อใช้ `groupPolicy: "allowlist"` เกตนี้ต้องมีอย่างใดอย่างหนึ่ง:
   - รายการ wildcard `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือ
   - รายการราย `chat_id` ที่ชัดเจนภายใต้ `groups`

หากเกต 1 ผ่านแต่เกต 2 ไม่ผ่าน ข้อความจะถูกทิ้ง Plugin จะปล่อยสัญญาณระดับ `warn` สองแบบเพื่อไม่ให้เรื่องนี้เงียบอีกต่อไปที่ระดับ log เริ่มต้น:

- `warn` ตอนเริ่มต้นหนึ่งครั้งต่อบัญชี เมื่อมีการตั้งค่า `groupPolicy: "allowlist"` แต่ `channels.imessage.groups` ว่าง (ไม่มี wildcard `"*"`, ไม่มีรายการราย `chat_id`) — ยิงก่อนที่ข้อความใดๆ จะเข้ามา
- `warn` หนึ่งครั้งต่อ `chat_id` ในครั้งแรกที่กลุ่มใดกลุ่มหนึ่งถูกทิ้งตอน runtime โดยระบุ chat_id และคีย์ที่ต้องเพิ่มลงใน `groups` อย่างชัดเจนเพื่ออนุญาตกลุ่มนั้น

DM ยังคงทำงานต่อได้ เพราะใช้เส้นทางโค้ดคนละเส้นทาง

นี่คือรูปแบบความล้มเหลวที่พบบ่อยที่สุดในการย้ายจาก BlueBubbles → bundled-iMessage: ผู้ดูแลระบบคัดลอก `groupAllowFrom` และ `groupPolicy` แต่ข้ามบล็อก `groups` เพราะ `groups: { "*": { "requireMention": true } }` ของ BlueBubbles ดูเหมือนการตั้งค่าการกล่าวถึงที่ไม่เกี่ยวข้อง จริง ๆ แล้วสิ่งนี้จำเป็นต่อ gate ของ registry

คอนฟิกขั้นต่ำเพื่อให้ข้อความกลุ่มยังไหลต่อหลังจาก `groupPolicy: "allowlist"`:

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

`requireMention: true` ใต้ `*` ไม่เป็นอันตรายเมื่อไม่ได้กำหนดรูปแบบการกล่าวถึงไว้: runtime จะตั้งค่า `canDetectMention = false` และลัดการ drop จากการกล่าวถึงที่ `inbound-processing.ts:512` เมื่อกำหนดรูปแบบการกล่าวถึงไว้ (`agents.list[].groupChat.mentionPatterns`) สิ่งนี้จะทำงานตามที่คาดไว้

หากบันทึกของ Gateway แสดง `imessage: dropping group message from chat_id=<id>` หรือบรรทัดตอนเริ่มต้น `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` แปลว่า gate 2 กำลัง drop อยู่ — ให้เพิ่มบล็อก `groups`

## ทีละขั้นตอน

1. เพิ่มบล็อก iMessage ข้างบล็อก BlueBubbles เดิม ปิดไว้ก่อนขณะที่ Gateway ยัง routing ทราฟฟิก BlueBubbles อยู่:

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

2. **Probe ก่อนที่ทราฟฟิกจะสำคัญ** — หยุด Gateway เปิดใช้บล็อก iMessage ชั่วคราว และยืนยันว่า iMessage รายงานว่าสุขภาพดีจาก CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` จะ probe เฉพาะบัญชีที่กำหนดค่าไว้และเปิดใช้งานแล้วเท่านั้น อย่า restart Gateway โดยเปิดใช้ทั้ง BlueBubbles และ iMessage พร้อมกัน เว้นแต่คุณตั้งใจให้ตัวเฝ้าดู channel ทั้งสองตัวทำงาน หากคุณยังไม่ได้ cut over ทันที ให้ตั้งค่า `channels.imessage.enabled` กลับเป็น `false` ก่อน restart Gateway ใช้คำสั่ง `imsg` โดยตรงใน [ก่อนเริ่มต้น](#before-you-start) เพื่อตรวจสอบ Mac ก่อนเปิดใช้ทราฟฟิก OpenClaw

3. **Cut over** เมื่อบัญชี iMessage ที่เปิดใช้รายงานว่าสุขภาพดีแล้ว ให้ลบคอนฟิก BlueBubbles และเปิดใช้ iMessage ต่อไป:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Restart gateway ตอนนี้ทราฟฟิก iMessage ขาเข้าจะไหลผ่าน Plugin ที่ bundled มา

4. **ตรวจสอบ DM** ส่ง direct message ถึง agent แล้วตรวจยืนยันว่าข้อความตอบกลับส่งถึง

5. **ตรวจสอบกลุ่มแยกต่างหาก** DM และกลุ่มใช้เส้นทางโค้ดคนละเส้นทาง — ความสำเร็จของ DM ไม่ได้พิสูจน์ว่ากลุ่ม routing อยู่ ส่งข้อความถึง agent ใน group chat ที่จับคู่ไว้ แล้วตรวจยืนยันว่าข้อความตอบกลับส่งถึง หากกลุ่มเงียบไป (ไม่มีการตอบกลับจาก agent ไม่มีข้อผิดพลาด) ให้ตรวจบันทึกของ gateway หา `imessage: dropping group message from chat_id=<id>` หรือบรรทัดตอนเริ่มต้น `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — ทั้งสองจะแสดงที่ระดับ log เริ่มต้น หากพบอย่างใดอย่างหนึ่ง แปลว่าบล็อก `groups` ของคุณหายไปหรือว่างเปล่า — ดู "Group registry footgun" ด้านบน

6. **ตรวจสอบพื้นผิว action** — จาก DM ที่จับคู่ไว้ ให้ขอให้ agent react, edit, unsend, reply, ส่งรูปภาพ และ (ในกลุ่ม) เปลี่ยนชื่อกลุ่ม / เพิ่มหรือลบผู้เข้าร่วม แต่ละ action ควรส่งถึงแบบ native ใน Messages.app หาก action ใดแสดง "iMessage `<action>` requires the imsg private API bridge" ให้รัน `imsg launch` อีกครั้งและ refresh `channels status --probe`

7. **ลบเซิร์ฟเวอร์และคอนฟิก BlueBubbles** เมื่อยืนยัน iMessage DM, กลุ่ม และ actions แล้ว OpenClaw จะไม่ใช้ `channels.bluebubbles`

## ภาพรวมความเท่าเทียมของ action

| Action                                              | BlueBubbles เดิม                    | iMessage ที่ bundled มา                                                      |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| ส่งข้อความ / fallback เป็น SMS                     | ✅                                  | ✅                                                                            |
| ส่งสื่อ (รูปภาพ วิดีโอ ไฟล์ เสียง)                | ✅                                  | ✅                                                                            |
| การตอบกลับแบบเธรด (`reply_to_guid`)                | ✅                                  | ✅ (ปิด [#51892](https://github.com/openclaw/openclaw/issues/51892))          |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| แก้ไข / unsend (ผู้รับ macOS 13+)                  | ✅                                  | ✅                                                                            |
| ส่งพร้อมเอฟเฟกต์หน้าจอ                            | ✅                                  | ✅ (ปิดบางส่วนของ [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| ข้อความ rich text ตัวหนา / ตัวเอียง / ขีดเส้นใต้ / ขีดฆ่า | ✅                         | ✅ (การจัดรูปแบบ typed-run ผ่าน attributedBody)                               |
| เปลี่ยนชื่อกลุ่ม / ตั้งไอคอนกลุ่ม                 | ✅                                  | ✅                                                                            |
| เพิ่ม / ลบผู้เข้าร่วม ออกจากกลุ่ม                 | ✅                                  | ✅                                                                            |
| ใบตอบรับการอ่านและตัวบ่งชี้กำลังพิมพ์             | ✅                                  | ✅ (ขึ้นกับ private API probe)                                                |
| การรวม DM จากผู้ส่งเดียวกัน                       | ✅                                  | ✅ (เฉพาะ DM; เลือกเปิดใช้ผ่าน `channels.imessage.coalesceSameSenderDms`)     |
| การกู้คืนขาเข้าหลัง restart                        | ✅ (webhook replay + history fetch) | ✅ (อัตโนมัติ: replay ที่พลาดผ่าน since_rowid + dedupe; หน้าต่างกว้างขึ้นบน local) |

iMessage กู้คืนข้อความที่พลาดไปขณะที่ gateway ปิดอยู่: ตอนเริ่มต้นจะ replay จาก rowid ล่าสุดที่ dispatch แล้วผ่าน `imsg watch.subscribe` `since_rowid` และ dedupe ด้วย GUID ขณะที่รั้วอายุตาม backlog เก่าจะระงับ "backlog bomb" ของ Push-flush สิ่งนี้ทำงานผ่านการเชื่อมต่อ RPC ของ `imsg` จึงทำงานได้กับการตั้งค่า `cliPath` แบบ remote SSH ด้วย; การตั้งค่า local ได้หน้าต่างกู้คืนที่กว้างกว่าเพราะอ่าน `chat.db` ได้ ดู [การกู้คืนขาเข้าหลัง bridge หรือ gateway restart](/th/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)

## การจับคู่ เซสชัน และการผูก ACP

- **การอนุมัติการจับคู่** ย้ายตาม handle คุณไม่จำเป็นต้องอนุมัติผู้ส่งที่รู้จักซ้ำ — `channels.imessage.allowFrom` รู้จักสตริง `+15555550123` / `user@example.com` เดียวกับที่ BlueBubbles ใช้
- **เซสชัน** ยังคงจำกัดขอบเขตต่อ agent + chat DM จะรวมเข้าเซสชันหลักของ agent ภายใต้ค่าเริ่มต้น `session.dmScope=main`; เซสชันกลุ่มจะแยกตาม `chat_id` คีย์เซสชันแตกต่างกัน (`agent:<id>:imessage:group:<chat_id>` เทียบกับคีย์เทียบเท่าของ BlueBubbles) — ประวัติการสนทนาเก่าภายใต้คีย์เซสชัน BlueBubbles จะไม่ย้ายเข้าเซสชัน iMessage
- **การผูก ACP** ที่อ้างถึง `match.channel: "bluebubbles"` ต้องอัปเดตเป็น `"imessage"` รูปแบบ `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle เปล่า) เหมือนกันทุกประการ

## ไม่มี channel สำหรับ rollback

ไม่มี runtime ของ BlueBubbles ที่รองรับให้สลับกลับไปใช้ หากการตรวจสอบ iMessage ล้มเหลว ให้ตั้งค่า `channels.imessage.enabled: false` restart Gateway แก้ตัวบล็อกของ `imsg` แล้วลอง cutover อีกครั้ง

แคช reply อยู่ในสถานะ Plugin ของ SQLite `openclaw doctor --fix` จะนำเข้าและ archive sidecar เก่า `imessage/reply-cache.jsonl` เมื่อมีอยู่

## ที่เกี่ยวข้อง

- [การลบ BlueBubbles และเส้นทาง imsg iMessage](/th/announcements/bluebubbles-imessage) — ประกาศสั้นและสรุปสำหรับผู้ดูแลระบบ
- [iMessage](/th/channels/imessage) — เอกสารอ้างอิง channel iMessage ฉบับเต็ม รวมถึงการตั้งค่า `imsg launch` และการตรวจจับความสามารถ
- `/channels/bluebubbles` — URL เดิมที่ redirect ไปยังคู่มือการย้ายนี้
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [Channel Routing](/th/channels/channel-routing) — วิธีที่ gateway เลือก channel สำหรับการตอบกลับขาออก
