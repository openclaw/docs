---
read_when:
    - การเพิ่มหรือแก้ไขการดำเนินการ CLI สำหรับข้อความ
    - การเปลี่ยนแปลงพฤติกรรมของช่องทางขาออก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw message` (การส่ง + การดำเนินการของช่องทาง)
title: ข้อความ
x-i18n:
    generated_at: "2026-05-04T09:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ef57d33c93206a61a6d044667de4faf6340f7d8cc324300f235e838ee3b7ff1
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

คำสั่งขาออกเดียวสำหรับส่งข้อความและการกระทำของช่องทาง
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)

## การใช้งาน

```
openclaw message <subcommand> [flags]
```

การเลือกช่องทาง:

- ต้องระบุ `--channel` หากกำหนดค่าช่องทางไว้มากกว่าหนึ่งช่องทาง
- หากกำหนดค่าช่องทางไว้เพียงช่องทางเดียว ช่องทางนั้นจะเป็นค่าเริ่มต้น
- ค่า: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost ต้องใช้ plugin)
- `openclaw message` จะแปลงช่องทางที่เลือกไปยัง plugin ที่เป็นเจ้าของเมื่อมี `--channel` หรือเป้าหมายที่มีคำนำหน้าช่องทาง มิฉะนั้นจะโหลด channel plugins ที่กำหนดค่าไว้เพื่ออนุมานช่องทางเริ่มต้น

รูปแบบเป้าหมาย (`--target`):

- WhatsApp: E.164, group JID หรือ WhatsApp Channel/Newsletter JID (`...@newsletter`)
- Telegram: chat id, `@username` หรือเป้าหมายหัวข้อฟอรัม (`-1001234567890:topic:42` หรือ `--thread-id 42`)
- Discord: `channel:<id>` หรือ `user:<id>` (หรือการกล่าวถึง `<@id>`; raw numeric ids จะถือว่าเป็นช่องทาง)
- Google Chat: `spaces/<spaceId>` หรือ `users/<userId>`
- Slack: `channel:<id>` หรือ `user:<id>` (ยอมรับ raw channel id)
- Mattermost (plugin): `channel:<id>`, `user:<id>` หรือ `@username` (bare ids จะถือว่าเป็นช่องทาง)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` หรือ `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` หรือ `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` หรือ `#alias:server`
- Microsoft Teams: conversation id (`19:...@thread.tacv2`) หรือ `conversation:<id>` หรือ `user:<aad-object-id>`

การค้นหาชื่อ:

- สำหรับผู้ให้บริการที่รองรับ (Discord/Slack/etc) ชื่อช่องทางอย่าง `Help` หรือ `#help` จะถูกแปลงผ่าน directory cache
- เมื่อไม่พบในแคช OpenClaw จะพยายามค้นหาไดเรกทอรีสดเมื่อผู้ให้บริการรองรับ

## แฟล็กทั่วไป

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (ช่องทางหรือผู้ใช้เป้าหมายสำหรับ send/poll/read/etc)
- `--targets <name>` (ทำซ้ำได้; เฉพาะ broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## พฤติกรรม SecretRef

- `openclaw message` จะแปลง SecretRefs ของช่องทางที่รองรับก่อนเรียกใช้การกระทำที่เลือก
- การแปลงจะจำกัดขอบเขตตามเป้าหมายของการกระทำที่ใช้งานอยู่เมื่อทำได้:
  - จำกัดตามช่องทางเมื่อกำหนด `--channel` (หรืออนุมานจากเป้าหมายที่มีคำนำหน้า เช่น `discord:...`)
  - จำกัดตามบัญชีเมื่อกำหนด `--account` (channel globals + selected account surfaces)
  - เมื่อไม่ระบุ `--account` OpenClaw จะไม่บังคับขอบเขต SecretRef ของบัญชี `default`
- SecretRefs ที่ยังไม่ได้แปลงในช่องทางที่ไม่เกี่ยวข้องจะไม่บล็อกการกระทำข้อความแบบระบุเป้าหมาย
- หาก SecretRef ของช่องทาง/บัญชีที่เลือกยังไม่ได้แปลง คำสั่งจะปิดล้มเหลวสำหรับการกระทำนั้น

## การกระทำ

### หลัก

- `send`
  - ช่องทาง: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - จำเป็น: `--target` พร้อมด้วย `--message`, `--media` หรือ `--presentation`
  - ไม่บังคับ: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - เพย์โหลดการนำเสนอที่ใช้ร่วมกัน: `--presentation` ส่งบล็อกเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`) ที่ core เรนเดอร์ผ่านความสามารถที่ช่องทางที่เลือกประกาศไว้ ดู [การนำเสนอข้อความ](/th/plugins/message-presentation)
  - ค่ากำหนดการส่งทั่วไป: `--delivery` รับคำใบ้การส่ง เช่น `{ "pin": true }`; `--pin` เป็นคำย่อสำหรับการส่งแบบปักหมุดเมื่อช่องทางรองรับ
  - เฉพาะ Telegram: `--force-document` (ส่งรูปภาพและ GIF เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัดของ Telegram)
  - เฉพาะ Telegram: `--thread-id` (forum topic id)
  - เฉพาะ Slack: `--thread-id` (thread timestamp; `--reply-to` ใช้ฟิลด์เดียวกัน)
  - Telegram + Discord: `--silent`
  - เฉพาะ WhatsApp: `--gif-playback`; WhatsApp Channels/Newsletters จะระบุด้วย JID `@newsletter` ดั้งเดิม

- `poll`
  - ช่องทาง: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - จำเป็น: `--target`, `--poll-question`, `--poll-option` (ทำซ้ำได้)
  - ไม่บังคับ: `--poll-multi`
  - เฉพาะ Discord: `--poll-duration-hours`, `--silent`, `--message`
  - เฉพาะ Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - ช่องทาง: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - จำเป็น: `--message-id`, `--target`
  - ไม่บังคับ: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - หมายเหตุ: `--remove` ต้องใช้ `--emoji` (ละ `--emoji` เพื่อเคลียร์ปฏิกิริยาของตนเองเมื่อรองรับ; ดู /tools/reactions)
  - เฉพาะ WhatsApp: `--participant`, `--from-me`
  - ปฏิกิริยากลุ่ม Signal: ต้องระบุ `--target-author` หรือ `--target-author-uuid`

- `reactions`
  - ช่องทาง: Discord/Google Chat/Slack/Matrix
  - จำเป็น: `--message-id`, `--target`
  - ไม่บังคับ: `--limit`

- `read`
  - ช่องทาง: Discord/Slack/Matrix
  - จำเป็น: `--target`
  - ไม่บังคับ: `--limit`, `--message-id`, `--before`, `--after`
  - เฉพาะ Slack: `--message-id` อ่าน timestamp ของข้อความ Slack ที่ระบุ; ใช้ร่วมกับ `--thread-id` เพื่ออ่านการตอบกลับใน thread ที่แน่นอน
  - เฉพาะ Discord: `--around`

- `edit`
  - ช่องทาง: Discord/Slack/Matrix
  - จำเป็น: `--message-id`, `--message`, `--target`

- `delete`
  - ช่องทาง: Discord/Slack/Telegram/Matrix
  - จำเป็น: `--message-id`, `--target`

- `pin` / `unpin`
  - ช่องทาง: Discord/Slack/Matrix
  - จำเป็น: `--message-id`, `--target`

- `pins` (รายการ)
  - ช่องทาง: Discord/Slack/Matrix
  - จำเป็น: `--target`

- `permissions`
  - ช่องทาง: Discord/Matrix
  - จำเป็น: `--target`
  - เฉพาะ Matrix: ใช้งานได้เมื่อเปิดใช้งานการเข้ารหัส Matrix และอนุญาตการกระทำการยืนยัน

- `search`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`, `--query`
  - ไม่บังคับ: `--channel-id`, `--channel-ids` (ทำซ้ำได้), `--author-id`, `--author-ids` (ทำซ้ำได้), `--limit`

### Threads

- `thread create`
  - ช่องทาง: Discord
  - จำเป็น: `--thread-name`, `--target` (channel id)
  - ไม่บังคับ: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`
  - ไม่บังคับ: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - ช่องทาง: Discord
  - จำเป็น: `--target` (thread id), `--message`
  - ไม่บังคับ: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ไม่มีแฟล็กเพิ่มเติม

- `emoji upload`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`, `--emoji-name`, `--media`
  - ไม่บังคับ: `--role-ids` (ทำซ้ำได้)

### Stickers

- `sticker send`
  - ช่องทาง: Discord
  - จำเป็น: `--target`, `--sticker-id` (ทำซ้ำได้)
  - ไม่บังคับ: `--message`

- `sticker upload`
  - ช่องทาง: Discord
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

### การดูแลจัดการ (Discord)

- `timeout`: `--guild-id`, `--user-id` (ไม่บังคับ `--duration-min` หรือ `--until`; ละทั้งคู่เพื่อเคลียร์ timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` ยังรองรับ `--reason`

### Broadcast

- `broadcast`
  - ช่องทาง: ช่องทางใดก็ได้ที่กำหนดค่าไว้; ใช้ `--channel all` เพื่อกำหนดเป้าหมายผู้ให้บริการทั้งหมด
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

Core เรนเดอร์เพย์โหลด `presentation` เดียวกันเป็นคอมโพเนนต์ Discord, บล็อก Slack, ปุ่ม inline ของ Telegram, props ของ Mattermost หรือการ์ด Teams/Feishu ตามความสามารถของช่องทาง ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญาฉบับเต็มและกฎ fallback

ส่งเพย์โหลดการนำเสนอที่สมบูรณ์ยิ่งขึ้น:

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

ตอบสนองใน Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

ตอบสนองในกลุ่ม Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

ส่งปุ่ม inline ของ Telegram ผ่านการนำเสนอทั่วไป:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

ส่งการ์ด Teams ผ่านการนำเสนอทั่วไป:

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

- [อ้างอิง CLI](/th/cli)
- [การส่งของ Agent](/th/tools/agent-send)
