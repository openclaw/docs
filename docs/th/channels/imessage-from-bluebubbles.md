---
read_when:
    - การวางแผนย้ายจาก BlueBubbles ไปยัง Plugin iMessage ที่รวมมาให้
    - การแปลงคีย์การกำหนดค่า BlueBubbles ให้เป็นคีย์เทียบเท่าของ iMessage
    - การตรวจสอบ imsg ก่อนเปิดใช้งาน Plugin iMessage
summary: 'แปลงการกำหนดค่า BlueBubbles แบบเก่าไปเป็น Plugin iMessage ที่รวมมาให้: การจับคู่คีย์ เงื่อนไขควบคุมรายการอนุญาตของกลุ่ม และการตรวจสอบการเปลี่ยนผ่านระบบ'
title: ย้ายมาจาก BlueBubbles
x-i18n:
    generated_at: "2026-07-12T15:46:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

การรองรับ BlueBubbles ถูกยกเลิกแล้ว OpenClaw รองรับ iMessage ผ่าน Plugin `imessage` ที่มาพร้อมระบบเท่านั้น ซึ่งควบคุม [`steipete/imsg`](https://github.com/steipete/imsg) ผ่าน JSON-RPC และเข้าถึงพื้นผิว API ส่วนตัวเดียวกับที่ BlueBubbles เคยใช้ (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, แบบสำรวจแบบเนทีฟ, การจัดการกลุ่ม, ไฟล์แนบ) ไบนารี CLI เดียวเข้ามาแทนที่เซิร์ฟเวอร์ BlueBubbles + แอปไคลเอนต์ + ระบบเชื่อมต่อ Webhook ทั้งหมด โดยไม่มีปลายทาง REST และไม่มีการยืนยันตัวตนของ Webhook

คู่มือนี้อธิบายการย้ายการกำหนดค่าเก่า `channels.bluebubbles` ไปยัง `channels.imessage` ไม่มีเส้นทางการย้ายอื่นที่รองรับ ใน OpenClaw เวอร์ชันปัจจุบัน บล็อก `channels.bluebubbles` ที่หลงเหลืออยู่จะไม่มีผล เนื่องจากไม่มีรันไทม์ใดอ่านบล็อกนี้

<Note>
สำหรับประกาศฉบับย่อและสรุปสำหรับผู้ดำเนินการ โปรดดู [การยกเลิก BlueBubbles และเส้นทาง iMessage ผ่าน imsg](/th/announcements/bluebubbles-imessage)
</Note>

## รายการตรวจสอบการย้าย

เส้นทางที่สั้นและปลอดภัยที่สุดเมื่อคุณทราบการกำหนดค่า BlueBubbles เดิมอยู่แล้ว:

1. ตรวจสอบ `imsg` โดยตรงบน Mac ที่ใช้งาน Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`)
2. คัดลอกคีย์ด้านพฤติกรรมจาก `channels.bluebubbles` ไปยัง `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` และ `actions`
3. ลบคีย์การรับส่งข้อมูลที่ไม่มีอีกต่อไป ได้แก่ `serverUrl`, `password`, URL ของ Webhook และการตั้งค่าเซิร์ฟเวอร์ BlueBubbles
4. หาก Gateway ไม่ได้ทำงานบน Mac ที่ใช้ Messages ให้ตั้งค่า `channels.imessage.cliPath` เป็นตัวห่อหุ้ม SSH และตั้งค่า `remoteHost` สำหรับการดึงไฟล์แนบจากระยะไกล
5. เปิดใช้ `channels.imessage` รีสตาร์ต Gateway แล้วเรียกใช้ `openclaw channels status --probe --channel imessage`
6. ทดสอบข้อความส่วนตัวหนึ่งข้อความ กลุ่มที่อนุญาตหนึ่งกลุ่ม ไฟล์แนบหากเปิดใช้ และการดำเนินการ API ส่วนตัวทุกอย่างที่คุณคาดว่าเอเจนต์จะใช้
7. ลบเซิร์ฟเวอร์ BlueBubbles และการกำหนดค่าเก่า `channels.bluebubbles` หลังจากตรวจสอบแล้วว่าเส้นทาง iMessage ทำงานถูกต้อง

## imsg ทำอะไร

`imsg` คือ CLI ภายในเครื่องสำหรับ Messages บน macOS OpenClaw เริ่ม `imsg rpc` เป็นโพรเซสลูกและสื่อสารด้วย JSON-RPC ผ่าน stdin/stdout ไม่มีเซิร์ฟเวอร์ HTTP, URL ของ Webhook, ดีมอนเบื้องหลัง, เอเจนต์เริ่มต้นระบบ หรือพอร์ตที่ต้องเปิดให้เข้าถึง

- การอ่านข้อมูลมาจาก `~/Library/Messages/chat.db` โดยใช้ตัวจัดการ SQLite แบบอ่านอย่างเดียว
- ข้อความขาเข้าแบบสดมาจาก `imsg watch` / `watch.subscribe` ซึ่งติดตามเหตุการณ์ระบบไฟล์ของ `chat.db` โดยมีการสำรวจเป็นระยะเป็นกลไกสำรอง
- การส่งใช้ระบบอัตโนมัติของ Messages.app สำหรับการส่งข้อความและไฟล์ทั่วไป
- การดำเนินการขั้นสูงใช้ `imsg launch` เพื่อฉีดตัวช่วย `imsg` เข้าไปใน Messages.app ซึ่งจะปลดล็อกการแจ้งว่าอ่านข้อความแล้ว ตัวบ่งชี้การกำลังพิมพ์ การส่งเนื้อหาแบบสมบูรณ์ การแก้ไข การยกเลิกส่ง การตอบกลับแบบเธรด tapback แบบสำรวจ และการจัดการกลุ่ม
- บิลด์สำหรับ Linux สามารถตรวจสอบ `chat.db` ที่คัดลอกมาได้ แต่ไม่สามารถส่งข้อความ เฝ้าดูฐานข้อมูลสดบน Mac หรือควบคุม Messages.app ได้ สำหรับ iMessage ของ OpenClaw ให้เรียกใช้ `imsg` บน Mac ที่ลงชื่อเข้าใช้แล้ว หรือผ่านตัวห่อหุ้ม SSH ไปยัง Mac เครื่องนั้น

## ก่อนเริ่มต้น

1. ติดตั้ง `imsg` บน Mac ที่ใช้งาน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   สำหรับการตั้งค่าภายในเครื่องทั่วไป การตั้งค่า OpenClaw สามารถเสนอการติดตั้งหรืออัปเดต `imsg` ผ่าน Homebrew โดยให้ผู้ใช้ยืนยัน บน Mac ที่ลงชื่อเข้าใช้ Messages แล้ว ส่วนการตั้งค่าด้วยตนเองและโทโพโลยีแบบตัวห่อหุ้ม SSH ยังคงอยู่ภายใต้การจัดการของผู้ดำเนินการ ให้ทำการอัปเดต Homebrew ซ้ำในบริบทผู้ใช้ภายในเครื่องหรือระยะไกลเดียวกับที่จะเรียกใช้ `imsg` หาก `imsg chats` ล้มเหลวโดยแสดง `unable to open database file` ไม่มีผลลัพธ์ หรือแสดง `authorization denied` ให้มอบสิทธิ์ Full Disk Access แก่เทอร์มินัล โปรแกรมแก้ไข โพรเซส Node บริการ Gateway หรือโพรเซสแม่ของ SSH ที่เปิดใช้ `imsg` แล้วเปิดโพรเซสแม่นั้นใหม่

2. ตรวจสอบพื้นผิวการอ่าน การเฝ้าดู การส่ง และ RPC ก่อนเปลี่ยนการกำหนดค่า OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   แทนที่ `42` ด้วยรหัสแชตจริงจาก `imsg chats` การส่งต้องมีสิทธิ์ Automation สำหรับ Messages.app หาก OpenClaw จะทำงานผ่าน SSH ให้เรียกใช้คำสั่งเหล่านี้ผ่านตัวห่อหุ้ม SSH หรือบริบทผู้ใช้เดียวกับที่ OpenClaw จะใช้ หากการอ่านทำงานแต่การส่งล้มเหลวด้วย AppleEvents `-1743` ให้ตรวจสอบว่าสิทธิ์ Automation ถูกกำหนดให้กับ `/usr/libexec/sshd-keygen-wrapper` หรือไม่ โปรดดู [การส่งผ่านตัวห่อหุ้ม SSH ล้มเหลวด้วย AppleEvents -1743](/th/channels/imessage#requirements-and-permissions-macos)

3. เปิดใช้บริดจ์ API ส่วนตัว ขอแนะนำอย่างยิ่งสำหรับ iMessage ของ OpenClaw เนื่องจากการตอบกลับ tapback เอฟเฟกต์ แบบสำรวจ การตอบกลับไฟล์แนบ และการดำเนินการกับกลุ่มต้องพึ่งพาบริดจ์นี้:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` กำหนดให้ปิดใช้ SIP (และบน macOS รุ่นใหม่ ต้องผ่อนคลายการตรวจสอบความถูกต้องของไลบรารีด้วย โปรดดู [การเปิดใช้ API ส่วนตัวของ imsg](/th/channels/imessage#enabling-the-imsg-private-api)) การส่งพื้นฐาน ประวัติ และการเฝ้าดูทำงานได้โดยไม่ต้องใช้ `imsg launch` แต่พื้นผิวการดำเนินการ iMessage ทั้งหมดของ OpenClaw จะไม่ทำงาน

4. หลังจากเปิดใช้ `channels.imessage` และเริ่ม Gateway แล้ว ให้ตรวจสอบบริดจ์ผ่าน OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   บัญชี iMessage ควรรายงาน `works` เมื่อใช้ `--json` เพย์โหลดการตรวจสอบจะมี `privateApi.available: true` หากรายงาน `false` ให้แก้ไขปัญหานั้นก่อน โปรดดู [การตรวจหาความสามารถ](/th/channels/imessage#private-api-actions) การตรวจสอบต้องเข้าถึง Gateway ได้ (มิฉะนั้น CLI จะย้อนกลับไปแสดงผลลัพธ์จากการกำหนดค่าเท่านั้น) และจะตรวจสอบเฉพาะบัญชีที่กำหนดค่าและเปิดใช้แล้ว

5. สำรองภาพรวมการกำหนดค่าของคุณ:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## การแปลงการกำหนดค่า

iMessage และ BlueBubbles ใช้คีย์ด้านพฤติกรรมระดับช่องทางส่วนใหญ่ร่วมกัน สิ่งที่เปลี่ยนคือการรับส่งข้อมูล (เซิร์ฟเวอร์ REST เทียบกับ CLI ภายในเครื่อง) และรูปแบบคีย์รีจิสทรีของกลุ่ม

| BlueBubbles                                                | iMessage ที่รวมมาให้                          | หมายเหตุ                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | ความหมายเหมือนกัน (ค่าเริ่มต้นเป็น `true` เมื่อมีบล็อกนี้)                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(นำออกแล้ว)_                               | ไม่มีเซิร์ฟเวอร์ REST — Plugin จะเรียกใช้ `imsg rpc` ผ่าน stdio                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(นำออกแล้ว)_                               | ไม่จำเป็นต้องยืนยันตัวตนของ Webhook                                                                                                                                                                                                                                                                                     |
| _(โดยนัย)_                                               | `channels.imessage.cliPath`               | พาธไปยัง `imsg` (ค่าเริ่มต้น `imsg`); ใช้สคริปต์ตัวหุ้มสำหรับ SSH                                                                                                                                                                                                                                                        |
| _(โดยนัย)_                                               | `channels.imessage.dbPath`                | ตัวเลือกสำหรับแทนที่ `chat.db` ของ Messages.app; ตรวจหาโดยอัตโนมัติหากละไว้                                                                                                                                                                                                                                                 |
| _(โดยนัย)_                                               | `channels.imessage.remoteHost`            | `host` หรือ `user@host` — จำเป็นเฉพาะเมื่อ `cliPath` เป็นตัวหุ้ม SSH และต้องการดึงไฟล์แนบผ่าน SCP                                                                                                                                                                                                             |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | ค่าเหมือนกัน (`pairing` / `allowlist` / `open` / `disabled`); ค่าเริ่มต้น `pairing`                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | รูปแบบแฮนเดิลเหมือนกัน (`+15555550123`, `user@example.com`) การอนุมัติในที่เก็บการจับคู่จะไม่ถูกโอนย้าย — ดูด้านล่าง                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | ค่าเหมือนกัน (`allowlist` / `open` / `disabled`); ค่าเริ่มต้น `allowlist`                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | เหมือนกัน หากไม่ได้ตั้งค่า iMessage จะย้อนกลับไปใช้ `allowFrom`; การกำหนด `groupAllowFrom: []` เป็นค่าว่างอย่างชัดเจนจะบล็อกทุกกลุ่มภายใต้ `groupPolicy: "allowlist"`                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | คัดลอกรายการไวลด์การ์ด `"*"` ตามเดิมทุกประการ; เปลี่ยนคีย์ของรายการแต่ละกลุ่มเป็น `chat_id` แบบตัวเลขของ iMessage — ดู "ข้อผิดพลาดที่พบบ่อยเกี่ยวกับรีจิสทรีกลุ่ม" ค่า `requireMention`, `tools`, `toolsBySender`, `systemPrompt` สามารถใช้ต่อได้                                                                                                                 |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | ค่าเริ่มต้น `true` เมื่อใช้ Plugin ที่รวมมาให้ ฟังก์ชันนี้จะทำงานเฉพาะเมื่อตัวตรวจสอบ API ส่วนตัวพร้อมใช้งาน                                                                                                                                                                                                                             |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | โครงสร้างเหมือนกัน และค่าเริ่มต้นปิดเหมือนกัน หากไฟล์แนบเคยส่งผ่าน BlueBubbles ให้ตั้งค่านี้อย่างชัดเจน — รูปภาพ/สื่อขาเข้าจะถูกละทิ้งโดยไม่มีการแจ้งเตือน (ไม่มีบรรทัดบันทึก `Inbound message`) จนกว่าจะตั้งค่า                                                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | รากพาธภายในเครื่อง; ใช้กฎไวลด์การ์ดเหมือนกัน                                                                                                                                                                                                                                                                                     |
| _(ไม่มี)_                                                    | `channels.imessage.remoteAttachmentRoots` | ใช้เฉพาะเมื่อตั้งค่า `remoteHost` สำหรับการดึงผ่าน SCP                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | ค่าเริ่มต้นบน iMessage คือ 16 MB (ค่าเริ่มต้นของ BlueBubbles คือ 8 MB) ตั้งค่าอย่างชัดเจนเพื่อคงขีดจำกัดที่ต่ำกว่าไว้                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | ค่าเริ่มต้นของทั้งสองระบบคือ 4000                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | เป็นตัวเลือกที่ต้องเปิดใช้งานเหมือนกัน ใช้กับ DM เท่านั้น — กลุ่มยังคงส่งต่อแยกต่อข้อความ เพิ่มค่าหน่วงการรับข้อความขาเข้าเริ่มต้นเป็น 7000 ms เว้นแต่จะตั้งค่า `messages.inbound.byChannel.imessage` หรือ `messages.inbound.debounceMs` ส่วนกลางไว้ ดู [การรวม DM ที่ส่งแยกส่วน](/th/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(ไม่มี)_                                   | `imsg` แสดงชื่อที่ใช้แสดงของผู้ส่งจาก `chat.db` อยู่แล้ว                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | สวิตช์เปิด/ปิดต่อการกระทำเหมือนกัน (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) และเพิ่ม `polls` ใหม่ ทั้งหมดเปิดใช้งานเป็นค่าเริ่มต้น; การกระทำผ่าน API ส่วนตัวยังคงต้องใช้บริดจ์                                      |

การกำหนดค่าหลายบัญชี (`channels.bluebubbles.accounts.*`) แปลงแบบหนึ่งต่อหนึ่งเป็น `channels.imessage.accounts.*`

## ข้อผิดพลาดที่พบบ่อยเกี่ยวกับรีจิสทรีกลุ่ม

Plugin iMessage ที่รวมมาให้ใช้ด่านตรวจสอบกลุ่มสองด่านต่อเนื่องกัน ข้อความกลุ่มต้องผ่านทั้งสองด่านจึงจะไปถึงเอเจนต์ได้:

1. **รายการอนุญาตผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — จับคู่แฮนเดิลผู้ส่งหรือเป้าหมายแชต (รายการ `chat_id:`, `chat_guid:`, `chat_identifier:`) เมื่อไม่ได้ตั้งค่า `groupAllowFrom` ด่านนี้จะย้อนกลับไปใช้ `allowFrom`; การกำหนด `groupAllowFrom: []` อย่างชัดเจนจะปิดการย้อนกลับดังกล่าวและละทิ้งข้อความกลุ่มทั้งหมดภายใต้ `groupPolicy: "allowlist"`
2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — ใช้ `chat_id` แบบตัวเลขของ iMessage เป็นคีย์:
   - ไม่มีบล็อก `groups` (หรือเป็นบล็อกว่าง): กลุ่มจะผ่านด่านนี้ตราบใดที่ด่าน 1 มีรายการอนุญาตผู้ส่งที่มีผลและไม่ว่าง การกรองผู้ส่งจะควบคุมการเข้าถึง และจะไม่มีคำเตือนตอนเริ่มต้นว่าละทิ้งทั้งหมด
   - `groups` มีรายการแต่ไม่มี `"*"`: เฉพาะคีย์ `chat_id` ที่ระบุไว้เท่านั้นที่ผ่าน การระบุกลุ่มใดก็ตามจะเปลี่ยนรีจิสทรีให้เป็นรายการอนุญาต แม้อยู่ภายใต้ `groupPolicy: "open"`
   - `groups: { "*": { ... } }`: ทุกกลุ่มจะผ่านด่านนี้

กับดักในการย้ายข้อมูล: BlueBubbles ใช้ GUID ของแชต / ตัวระบุแชตเป็นคีย์ของรายการ `groups` ขณะที่รีจิสทรีของ iMessage ใช้ `chat_id` แบบตัวเลข การคัดลอกรายการแต่ละกลุ่มตามเดิมจะสร้างรีจิสทรีที่ไม่ว่างแต่ไม่มีคีย์ใดตรงกัน ทำให้ข้อความกลุ่มทั้งหมดถูกละทิ้งที่ด่าน 2 ให้คัดลอกไวลด์การ์ด `"*"` ตามเดิมทุกประการ; เปลี่ยนคีย์ของรายการกลุ่มเฉพาะโดยใช้ค่า `chat_id` จาก `imsg chats`

เส้นทางการละทิ้งทั้งสองแบบมองเห็นได้ที่ระดับบันทึกเริ่มต้นผ่านบรรทัด `warn`:

- หนึ่งครั้งต่อบัญชีเมื่อเริ่มต้น หากตั้งค่า `groupPolicy: "allowlist"` และรายการอนุญาตผู้ส่งกลุ่มที่มีผลว่างเปล่า: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` ตั้งค่า `groupAllowFrom` (หรือ `allowFrom`) เพื่ออนุญาตผู้ส่ง; การเพิ่มเพียง `groups` ไม่ทำให้ผ่านด่านผู้ส่ง
- หนึ่งครั้งต่อ `chat_id` ระหว่างรันไทม์ เมื่อรีจิสทรีละทิ้งกลุ่ม: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist` โดยระบุคีย์ที่ต้องเพิ่มอย่างชัดเจน

DM ยังคงทำงานได้ไม่ว่ากรณีใด — DM ใช้เส้นทางโค้ดที่ต่างออกไป ดังนั้นความสำเร็จของ DM ไม่ได้พิสูจน์ว่าการกำหนดเส้นทางกลุ่มทำงาน

การกำหนดค่าขั้นต่ำแบบจำกัดตามผู้ส่งร่วมกับ `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

การกำหนดค่านี้อนุญาตผู้ส่งที่ระบุไว้ในทุกกลุ่ม เพิ่มรายการ `groups` เพื่อจำกัดขอบเขตแชตที่อนุญาต หรือตั้งค่าตัวเลือกต่อแชต เช่น `requireMention`; คัดลอกรายการ `"*"` ของ BlueBubbles ตามเดิมทุกประการ แต่เปลี่ยนคีย์ของรายการเฉพาะเป็นค่า `chat_id` แบบตัวเลขของ iMessage

## ทีละขั้นตอน

1. แปลการกำหนดค่า ระหว่างแก้ไขให้บล็อกใหม่ยังคงปิดใช้งานไว้ บล็อก `channels.bluebubbles` เดิมจะถูก OpenClaw เวอร์ชันปัจจุบันเพิกเฉย จึงสามารถเก็บไว้ข้างกันเพื่อใช้อ้างอิงได้:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **สลับระบบและตรวจสอบ** ตั้งค่า `channels.imessage.enabled: true` เริ่ม Gateway ใหม่ และยืนยันว่าช่องทางรายงานว่าสถานะปกติ:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   การตรวจสอบต้องเชื่อมต่อ Gateway ได้ และจะตรวจสอบเฉพาะบัญชีที่กำหนดค่าและเปิดใช้งานแล้วเท่านั้น ใช้คำสั่ง `imsg` โดยตรงใน [ก่อนเริ่มต้น](#before-you-start) เพื่อตรวจสอบเครื่อง Mac โดยตรง

3. **ตรวจสอบข้อความส่วนตัว** ส่งข้อความส่วนตัวถึงเอเจนต์และยืนยันว่าได้รับข้อความตอบกลับ

4. **ตรวจสอบกลุ่มแยกต่างหาก** ข้อความส่วนตัวและกลุ่มใช้เส้นทางโค้ดต่างกัน ความสำเร็จของข้อความส่วนตัวไม่ได้ยืนยันว่าการกำหนดเส้นทางของกลุ่มทำงาน ส่งข้อความในแชตกลุ่มที่อนุญาตและยืนยันว่าได้รับข้อความตอบกลับ หากกลุ่มเงียบไป (ไม่มีข้อความตอบกลับจากเอเจนต์และไม่มีข้อผิดพลาด) ให้ตรวจสอบบันทึกของ Gateway เพื่อหาสองบรรทัด `warn` จาก "ข้อควรระวังของรีจิสทรีกลุ่ม" ด้านบน คำเตือนตอนเริ่มต้นหมายความว่ารายการผู้ส่งที่อนุญาตซึ่งมีผลอยู่ว่างเปล่า ส่วนคำเตือนราย `chat_id` หมายความว่ารีจิสทรี `groups` ที่มีข้อมูลไม่มีแชตนั้นอยู่

5. **ตรวจสอบชุดการดำเนินการ** จากข้อความส่วนตัวที่จับคู่แล้ว ให้ขอเอเจนต์แสดงความรู้สึก แก้ไข ยกเลิกการส่ง ตอบกลับ ส่งรูปภาพ และ (ในกลุ่ม) เปลี่ยนชื่อกลุ่มหรือเพิ่ม/ลบผู้เข้าร่วม การดำเนินการแต่ละรายการควรปรากฏแบบเนทีฟใน Messages.app หากการดำเนินการใดแสดงข้อผิดพลาด `iMessage <action> requires the imsg private API bridge` ให้เรียกใช้ `imsg launch` อีกครั้ง แล้วรีเฟรชด้วย `openclaw channels status --probe`

6. **นำเซิร์ฟเวอร์ BlueBubbles และบล็อก `channels.bluebubbles` ออก** หลังจากตรวจสอบข้อความส่วนตัว กลุ่ม และการดำเนินการของ iMessage แล้ว OpenClaw จะไม่อ่าน `channels.bluebubbles`

## ภาพรวมความเท่าเทียมของการดำเนินการ

| การดำเนินการ                                              | BlueBubbles รุ่นเดิม | iMessage ที่รวมมาให้                                                              |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| ส่งข้อความ / ใช้ SMS สำรอง                            | ✅                 | ✅                                                                            |
| ส่งสื่อ (รูปภาพ วิดีโอ ไฟล์ เสียง)              | ✅                 | ✅                                                                            |
| ตอบกลับแบบเธรด (`reply_to_guid`)                    | ✅                 | ✅ (ปิด [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                 | ✅                                                                            |
| แก้ไข / ยกเลิกการส่ง (ผู้รับที่ใช้ macOS 13 ขึ้นไป)                | ✅                 | ✅                                                                            |
| ส่งพร้อมเอฟเฟกต์หน้าจอ                             | ✅                 | ✅ (ปิดบางส่วนของ [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| ข้อความแบบริชเท็กซ์ ตัวหนา / ตัวเอียง / ขีดเส้นใต้ / ขีดฆ่า | ✅                 | ✅ (จัดรูปแบบช่วงข้อความแบบมีชนิดผ่าน attributedBody)                                  |
| แบบสำรวจเนทีฟของ Messages (สร้างและลงคะแนน)             | ❌                 | ✅ (`actions.polls`; ผู้รับต้องใช้ iOS/macOS 26 ขึ้นไปจึงจะแสดงผลแบบเนทีฟได้)      |
| เปลี่ยนชื่อกลุ่ม / ตั้งไอคอนกลุ่ม                       | ✅                 | ✅                                                                            |
| เพิ่ม / ลบผู้เข้าร่วม หรือออกจากกลุ่ม               | ✅                 | ✅                                                                            |
| ใบตอบรับการอ่านและตัวบ่งชี้การพิมพ์                  | ✅                 | ✅ (ขึ้นอยู่กับผลการตรวจสอบ private API)                                               |
| รวมข้อความส่วนตัวจากผู้ส่งคนเดียวกัน                           | ✅                 | ✅ (เฉพาะข้อความส่วนตัว ต้องเลือกเปิดผ่าน `channels.imessage.coalesceSameSenderDms`)            |
| กู้คืนข้อความขาเข้าหลังเริ่มระบบใหม่                    | ✅                 | ✅ (อัตโนมัติ: เล่นซ้ำจาก `since_rowid` + กำจัดข้อมูลซ้ำด้วย GUID; ใช้ช่วงกว้างขึ้นเมื่อทำงานภายในเครื่อง)     |

iMessage จะกู้คืนข้อความที่พลาดไประหว่าง Gateway หยุดทำงาน โดยเมื่อเริ่มต้น ระบบจะเล่นซ้ำตั้งแต่ rowid ล่าสุดที่ส่งต่อแล้วผ่าน `imsg watch.subscribe` `since_rowid` กำจัดข้อมูลซ้ำด้วย GUID และใช้ขอบเขตอายุของรายการค้างเก่าเพื่อระงับ "ระเบิดรายการค้าง" จากการล้างข้อมูล Push กระบวนการนี้ทำงานผ่านการเชื่อมต่อ RPC ของ `imsg` จึงใช้ได้กับการตั้งค่า `cliPath` ผ่าน SSH ระยะไกลด้วย ส่วนการตั้งค่าภายในเครื่องจะมีช่วงการกู้คืนที่กว้างกว่า เนื่องจากสามารถอ่าน `chat.db` ได้ ดู [การกู้คืนข้อความขาเข้าหลังเริ่มบริดจ์หรือ Gateway ใหม่](/th/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)

## การจับคู่ เซสชัน และการผูก ACP

- **รายการที่อนุญาตย้ายตามแฮนเดิลได้** `channels.imessage.allowFrom` รองรับสตริง `+15555550123` / `user@example.com` แบบเดียวกับที่ BlueBubbles ใช้ ให้คัดลอกตามเดิมทุกประการ
- **การอนุมัติในที่เก็บการจับคู่จะไม่ย้ายตามไป** ที่เก็บการจับคู่แยกตามช่องทาง และไม่มีสิ่งใดย้ายที่เก็บ BlueBubbles เดิม ผู้ส่งที่ได้รับอนุมัติผ่านการจับคู่เพียงอย่างเดียวต้องจับคู่อีกครั้งภายใต้ iMessage หรือคุณต้องเพิ่มแฮนเดิลของบุคคลเหล่านั้นลงใน `allowFrom`
- **เซสชัน** ยังคงมีขอบเขตแยกตามเอเจนต์และแชต ข้อความส่วนตัวจะรวมเข้าสู่เซสชันหลักของเอเจนต์ตามค่าเริ่มต้น `session.dmScope=main` ส่วนเซสชันกลุ่มยังคงแยกตาม `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`) ประวัติการสนทนาเดิมภายใต้คีย์เซสชันของ BlueBubbles จะไม่ย้ายเข้าสู่เซสชัน iMessage
- **การผูก ACP** ที่อ้างอิง `match.channel: "bluebubbles"` ต้องเปลี่ยนเป็น `"imessage"` รูปแบบของ `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, แฮนเดิลเปล่า) เหมือนเดิมทุกประการ

## ไม่มีช่องทางสำหรับย้อนกลับ

ไม่มีรันไทม์ BlueBubbles ที่รองรับให้สลับกลับไปใช้ หากการตรวจสอบ iMessage ล้มเหลว ให้ตั้งค่า `channels.imessage.enabled: false` เริ่ม Gateway ใหม่ แก้ไขสิ่งที่ขัดขวาง `imsg` แล้วลองสลับระบบอีกครั้ง

แคชการตอบกลับอยู่ในสถานะ Plugin แบบ SQLite คำสั่ง `openclaw doctor --fix` จะนำเข้าและเก็บถาวรไฟล์ประกอบ `imessage/reply-cache.jsonl` เดิมหากมีอยู่

## ที่เกี่ยวข้อง

- [การนำ BlueBubbles ออกและเส้นทาง iMessage ผ่าน imsg](/th/announcements/bluebubbles-imessage) — ประกาศสั้นและข้อมูลสรุปสำหรับผู้ดูแลระบบ
- [iMessage](/th/channels/imessage) — เอกสารอ้างอิงฉบับเต็มของช่องทาง iMessage รวมถึงการตั้งค่า `imsg launch` และการตรวจหาความสามารถ
- `/channels/bluebubbles` — URL เดิมที่เปลี่ยนเส้นทางมายังคู่มือการย้ายระบบนี้
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนของข้อความส่วนตัวและขั้นตอนการจับคู่
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — วิธีที่ Gateway เลือกช่องทางสำหรับข้อความตอบกลับขาออก
