---
read_when:
    - การเพิ่มหรือแก้ไขการดำเนินการ CLI สำหรับข้อความ
    - การเปลี่ยนลักษณะการทำงานของช่องทางขาออก
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw message` (ส่ง + การดำเนินการของช่องทาง)
title: ข้อความ
x-i18n:
    generated_at: "2026-05-02T20:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b73a50da34838f80ad5d0d266f5c66f95436f8535e6312296ae022918b1ab55
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

คำสั่งขาออกเดียวสำหรับส่งข้อความและการดำเนินการของช่อง
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)

## การใช้งาน

```
openclaw message <subcommand> [flags]
```

การเลือกช่อง:

- ต้องระบุ `--channel` หากกำหนดค่ามากกว่าหนึ่งช่อง
- หากกำหนดค่าไว้เพียงช่องเดียว ช่องนั้นจะกลายเป็นค่าเริ่มต้น
- ค่า: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost ต้องใช้ Plugin)
- `openclaw message` จะ resolve ช่องที่เลือกไปยัง Plugin ที่เป็นเจ้าของเมื่อมี `--channel` หรือเป้าหมายที่มีคำนำหน้าช่อง มิฉะนั้นจะโหลด Plugin ช่องที่กำหนดค่าไว้เพื่ออนุมานช่องเริ่มต้น

รูปแบบเป้าหมาย (`--target`):

- WhatsApp: E.164, group JID หรือ WhatsApp Channel/Newsletter JID (`...@newsletter`)
- Telegram: chat id หรือ `@username`
- Discord: `channel:<id>` หรือ `user:<id>` (หรือการ mention แบบ `<@id>`; id ตัวเลขล้วนจะถือเป็นช่อง)
- Google Chat: `spaces/<spaceId>` หรือ `users/<userId>`
- Slack: `channel:<id>` หรือ `user:<id>` (ยอมรับ raw channel id)
- Mattermost (plugin): `channel:<id>`, `user:<id>` หรือ `@username` (id ที่ไม่มีคำนำหน้าจะถือเป็นช่อง)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` หรือ `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` หรือ `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` หรือ `#alias:server`
- Microsoft Teams: conversation id (`19:...@thread.tacv2`) หรือ `conversation:<id>` หรือ `user:<aad-object-id>`

การค้นหาชื่อ:

- สำหรับผู้ให้บริการที่รองรับ (Discord/Slack/อื่นๆ) ชื่อช่องอย่าง `Help` หรือ `#help` จะถูก resolve ผ่าน directory cache
- เมื่อ cache miss, OpenClaw จะพยายามค้นหา directory แบบ live เมื่อผู้ให้บริการรองรับ

## แฟล็กที่ใช้บ่อย

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (ช่องหรือผู้ใช้เป้าหมายสำหรับ send/poll/read/อื่นๆ)
- `--targets <name>` (ระบุซ้ำได้; ใช้กับ broadcast เท่านั้น)
- `--json`
- `--dry-run`
- `--verbose`

## พฤติกรรมของ SecretRef

- `openclaw message` จะ resolve SecretRefs ของช่องที่รองรับก่อนเรียกใช้การดำเนินการที่เลือก
- การ resolve จะถูกจำกัดขอบเขตตามเป้าหมายของการดำเนินการที่ใช้งานอยู่เมื่อทำได้:
  - ขอบเขตช่องเมื่อมีการตั้งค่า `--channel` (หรืออนุมานจากเป้าหมายที่มีคำนำหน้า เช่น `discord:...`)
  - ขอบเขตบัญชีเมื่อมีการตั้งค่า `--account` (global ของช่อง + พื้นผิวของบัญชีที่เลือก)
  - เมื่อไม่ระบุ `--account`, OpenClaw จะไม่บังคับขอบเขต SecretRef ของบัญชี `default`
- SecretRefs ที่ยังไม่ได้ resolve ในช่องที่ไม่เกี่ยวข้องจะไม่บล็อกการดำเนินการส่งข้อความแบบกำหนดเป้าหมาย
- หาก SecretRef ของช่อง/บัญชีที่เลือกยังไม่ได้ resolve คำสั่งจะล้มเหลวแบบปิดสำหรับการดำเนินการนั้น

## การดำเนินการ

### Core

- `send`
  - ช่อง: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - จำเป็น: `--target` พร้อมกับ `--message`, `--media` หรือ `--presentation`
  - ไม่บังคับ: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - payload การนำเสนอที่ใช้ร่วมกัน: `--presentation` ส่งบล็อกเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`) ที่ core render ผ่านความสามารถที่ช่องที่เลือกประกาศไว้ ดู [การนำเสนอข้อความ](/th/plugins/message-presentation)
  - ค่ากำหนดการส่งแบบทั่วไป: `--delivery` รับคำใบ้การส่ง เช่น `{ "pin": true }`; `--pin` เป็นคำย่อสำหรับการส่งแบบปักหมุดเมื่อช่องรองรับ
  - เฉพาะ Telegram: `--force-document` (ส่งรูปภาพและ GIF เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัดของ Telegram)
  - เฉพาะ Telegram: `--thread-id` (id ของหัวข้อ forum)
  - เฉพาะ Slack: `--thread-id` (timestamp ของ thread; `--reply-to` ใช้ฟิลด์เดียวกัน)
  - Telegram + Discord: `--silent`
  - เฉพาะ WhatsApp: `--gif-playback`; WhatsApp Channels/Newsletters จะถูกอ้างอิงด้วย JID `@newsletter` แบบ native

- `poll`
  - ช่อง: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - จำเป็น: `--target`, `--poll-question`, `--poll-option` (ระบุซ้ำได้)
  - ไม่บังคับ: `--poll-multi`
  - เฉพาะ Discord: `--poll-duration-hours`, `--silent`, `--message`
  - เฉพาะ Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - ช่อง: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - จำเป็น: `--message-id`, `--target`
  - ไม่บังคับ: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - หมายเหตุ: `--remove` ต้องใช้ `--emoji` (ละ `--emoji` เพื่อเคลียร์ reactions ของตนเองในที่ที่รองรับ; ดู /tools/reactions)
  - เฉพาะ WhatsApp: `--participant`, `--from-me`
  - reactions ของกลุ่ม Signal: ต้องระบุ `--target-author` หรือ `--target-author-uuid`

- `reactions`
  - ช่อง: Discord/Google Chat/Slack/Matrix
  - จำเป็น: `--message-id`, `--target`
  - ไม่บังคับ: `--limit`

- `read`
  - ช่อง: Discord/Slack/Matrix
  - จำเป็น: `--target`
  - ไม่บังคับ: `--limit`, `--message-id`, `--before`, `--after`
  - เฉพาะ Slack: `--message-id` อ่าน timestamp ของข้อความ Slack ที่ระบุ; รวมกับ `--thread-id` เพื่ออ่านข้อความตอบกลับใน thread ที่แน่นอน
  - เฉพาะ Discord: `--around`

- `edit`
  - ช่อง: Discord/Slack/Matrix
  - จำเป็น: `--message-id`, `--message`, `--target`

- `delete`
  - ช่อง: Discord/Slack/Telegram/Matrix
  - จำเป็น: `--message-id`, `--target`

- `pin` / `unpin`
  - ช่อง: Discord/Slack/Matrix
  - จำเป็น: `--message-id`, `--target`

- `pins` (รายการ)
  - ช่อง: Discord/Slack/Matrix
  - จำเป็น: `--target`

- `permissions`
  - ช่อง: Discord/Matrix
  - จำเป็น: `--target`
  - เฉพาะ Matrix: ใช้งานได้เมื่อเปิดใช้การเข้ารหัส Matrix และอนุญาตการดำเนินการตรวจสอบยืนยัน

- `search`
  - ช่อง: Discord
  - จำเป็น: `--guild-id`, `--query`
  - ไม่บังคับ: `--channel-id`, `--channel-ids` (ระบุซ้ำได้), `--author-id`, `--author-ids` (ระบุซ้ำได้), `--limit`

### Threads

- `thread create`
  - ช่อง: Discord
  - จำเป็น: `--thread-name`, `--target` (channel id)
  - ไม่บังคับ: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - ช่อง: Discord
  - จำเป็น: `--guild-id`
  - ไม่บังคับ: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - ช่อง: Discord
  - จำเป็น: `--target` (thread id), `--message`
  - ไม่บังคับ: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ไม่มีแฟล็กเพิ่มเติม

- `emoji upload`
  - ช่อง: Discord
  - จำเป็น: `--guild-id`, `--emoji-name`, `--media`
  - ไม่บังคับ: `--role-ids` (ระบุซ้ำได้)

### Stickers

- `sticker send`
  - ช่อง: Discord
  - จำเป็น: `--target`, `--sticker-id` (ระบุซ้ำได้)
  - ไม่บังคับ: `--message`

- `sticker upload`
  - ช่อง: Discord
  - จำเป็น: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roles / Channels / Members / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` สำหรับ Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Events

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - ไม่บังคับ: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (`--duration-min` หรือ `--until` เป็นตัวเลือก; ละทั้งคู่เพื่อเคลียร์ timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` รองรับ `--reason` ด้วย

### Broadcast

- `broadcast`
  - ช่อง: ช่องใดก็ได้ที่กำหนดค่าไว้; ใช้ `--channel all` เพื่อกำหนดเป้าหมายผู้ให้บริการทั้งหมด
  - จำเป็น: `--targets <target...>`
  - ไม่บังคับ: `--message`, `--media`, `--dry-run`

## ตัวอย่าง

ส่งการตอบกลับ Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

ส่งข้อความพร้อมปุ่มเชิงความหมาย:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Core จะ render payload `presentation` เดียวกันเป็นส่วนประกอบของ Discord, บล็อกของ Slack, ปุ่ม inline ของ Telegram, props ของ Mattermost หรือการ์ด Teams/Feishu ตามความสามารถของช่อง ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญาฉบับเต็มและกฎ fallback

ส่ง payload การนำเสนอที่สมบูรณ์ยิ่งขึ้น:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

สร้างโพล Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

สร้างโพล Telegram (ปิดอัตโนมัติใน 2 นาที):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

ส่งข้อความเชิงรุกของ Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

สร้างโพล Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

React ใน Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

React ในกลุ่ม Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

ส่งปุ่ม inline ของ Telegram ผ่านการนำเสนอแบบทั่วไป:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

ส่งการ์ด Teams ผ่านการนำเสนอแบบทั่วไป:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

ส่งรูปภาพ Telegram เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัด:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Agent send](/th/tools/agent-send)
