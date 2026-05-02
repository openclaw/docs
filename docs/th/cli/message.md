---
read_when:
    - การเพิ่มหรือแก้ไขการดำเนินการ CLI สำหรับข้อความ
    - การเปลี่ยนพฤติกรรมของช่องทางขาออก
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw message` (การส่ง + การดำเนินการของช่องทาง)
title: ข้อความ
x-i18n:
    generated_at: "2026-05-02T10:11:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f429acc2c81f33d1ade543ab1170220e293077e1d1721ac0940937de3d19f0d2
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

คำสั่งขาออกเดียวสำหรับส่งข้อความและการดำเนินการของช่องทาง
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)

## การใช้งาน

```
openclaw message <subcommand> [flags]
```

การเลือกช่องทาง:

- ต้องใช้ `--channel` หากมีการกำหนดค่ามากกว่าหนึ่งช่องทาง
- หากมีการกำหนดค่าเพียงช่องทางเดียว ช่องทางนั้นจะเป็นค่าเริ่มต้น
- ค่า: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost ต้องใช้ Plugin)
- `openclaw message` จะแปลงช่องทางที่เลือกไปยัง Plugin เจ้าของเมื่อมี `--channel` หรือเป้าหมายที่ขึ้นต้นด้วยช่องทาง มิฉะนั้นจะโหลด Plugin ช่องทางที่กำหนดค่าไว้เพื่ออนุมานช่องทางเริ่มต้น

รูปแบบเป้าหมาย (`--target`):

- WhatsApp: E.164 หรือ JID ของกลุ่ม
- Telegram: id ของแชต หรือ `@username`
- Discord: `channel:<id>` หรือ `user:<id>` (หรือการกล่าวถึง `<@id>`; id ตัวเลขดิบจะถือว่าเป็นช่องทาง)
- Google Chat: `spaces/<spaceId>` หรือ `users/<userId>`
- Slack: `channel:<id>` หรือ `user:<id>` (ยอมรับ id ช่องทางดิบ)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` หรือ `@username` (id ที่ไม่มีคำนำหน้าจะถือว่าเป็นช่องทาง)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` หรือ `username:<name>`/`u:<name>`
- iMessage: แฮนเดิล, `chat_id:<id>`, `chat_guid:<guid>` หรือ `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` หรือ `#alias:server`
- Microsoft Teams: id การสนทนา (`19:...@thread.tacv2`) หรือ `conversation:<id>` หรือ `user:<aad-object-id>`

การค้นหาชื่อ:

- สำหรับผู้ให้บริการที่รองรับ (Discord/Slack/ฯลฯ) ชื่อช่องทางอย่าง `Help` หรือ `#help` จะถูกแปลงผ่านแคชไดเรกทอรี
- เมื่อไม่พบในแคช OpenClaw จะพยายามค้นหาไดเรกทอรีสดเมื่อผู้ให้บริการรองรับ

## แฟล็กทั่วไป

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (ช่องทางหรือผู้ใช้เป้าหมายสำหรับ send/poll/read/ฯลฯ)
- `--targets <name>` (ทำซ้ำได้; เฉพาะ broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## พฤติกรรม SecretRef

- `openclaw message` จะแปลง SecretRef ของช่องทางที่รองรับก่อนเรียกใช้การดำเนินการที่เลือก
- การแปลงจะจำกัดขอบเขตตามเป้าหมายการดำเนินการที่ใช้งานอยู่เมื่อทำได้:
  - จำกัดตามช่องทางเมื่อมีการตั้งค่า `--channel` (หรืออนุมานจากเป้าหมายที่มีคำนำหน้า เช่น `discord:...`)
  - จำกัดตามบัญชีเมื่อมีการตั้งค่า `--account` (ค่ากลางของช่องทาง + พื้นผิวของบัญชีที่เลือก)
  - เมื่อไม่ได้ระบุ `--account` OpenClaw จะไม่บังคับขอบเขต SecretRef ของบัญชี `default`
- SecretRef ที่ยังแปลงไม่ได้บนช่องทางที่ไม่เกี่ยวข้องจะไม่บล็อกการดำเนินการส่งข้อความแบบเจาะจงเป้าหมาย
- หาก SecretRef ของช่องทาง/บัญชีที่เลือกยังแปลงไม่ได้ คำสั่งจะปิดล้มเหลวสำหรับการดำเนินการนั้น

## การดำเนินการ

### หลัก

- `send`
  - ช่องทาง: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - จำเป็น: `--target` รวมถึง `--message`, `--media` หรือ `--presentation`
  - ไม่บังคับ: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - เพย์โหลด presentation ที่ใช้ร่วมกัน: `--presentation` ส่งบล็อกเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`) ที่ core เรนเดอร์ผ่านความสามารถที่ช่องทางที่เลือกประกาศไว้ ดู [การนำเสนอข้อความ](/th/plugins/message-presentation)
  - การตั้งค่าการส่งแบบทั่วไป: `--delivery` ยอมรับคำใบ้การส่ง เช่น `{ "pin": true }`; `--pin` เป็นรูปย่อสำหรับการส่งแบบปักหมุดเมื่อช่องทางรองรับ
  - เฉพาะ Telegram: `--force-document` (ส่งรูปภาพและ GIF เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัดของ Telegram)
  - เฉพาะ Telegram: `--thread-id` (id หัวข้อฟอรัม)
  - เฉพาะ Slack: `--thread-id` (timestamp ของเธรด; `--reply-to` ใช้ฟิลด์เดียวกัน)
  - Telegram + Discord: `--silent`
  - เฉพาะ WhatsApp: `--gif-playback`

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
  - หมายเหตุ: `--remove` ต้องใช้ `--emoji` (ละเว้น `--emoji` เพื่อล้างรีแอ็กชันของตนเองเมื่อรองรับ; ดู /tools/reactions)
  - เฉพาะ WhatsApp: `--participant`, `--from-me`
  - รีแอ็กชันกลุ่ม Signal: ต้องใช้ `--target-author` หรือ `--target-author-uuid`

- `reactions`
  - ช่องทาง: Discord/Google Chat/Slack/Matrix
  - จำเป็น: `--message-id`, `--target`
  - ไม่บังคับ: `--limit`

- `read`
  - ช่องทาง: Discord/Slack/Matrix
  - จำเป็น: `--target`
  - ไม่บังคับ: `--limit`, `--message-id`, `--before`, `--after`
  - เฉพาะ Slack: `--message-id` อ่าน timestamp ของข้อความ Slack ที่เจาะจง; รวมกับ `--thread-id` เพื่ออ่านข้อความตอบกลับในเธรดที่ตรงกัน
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
  - เฉพาะ Matrix: ใช้ได้เมื่อเปิดใช้งานการเข้ารหัส Matrix และอนุญาตการดำเนินการยืนยัน

- `search`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`, `--query`
  - ไม่บังคับ: `--channel-id`, `--channel-ids` (ทำซ้ำได้), `--author-id`, `--author-ids` (ทำซ้ำได้), `--limit`

### เธรด

- `thread create`
  - ช่องทาง: Discord
  - จำเป็น: `--thread-name`, `--target` (id ช่องทาง)
  - ไม่บังคับ: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`
  - ไม่บังคับ: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - ช่องทาง: Discord
  - จำเป็น: `--target` (id เธรด), `--message`
  - ไม่บังคับ: `--media`, `--reply-to`

### อีโมจิ

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ไม่มีแฟล็กเพิ่มเติม

- `emoji upload`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`, `--emoji-name`, `--media`
  - ไม่บังคับ: `--role-ids` (ทำซ้ำได้)

### สติกเกอร์

- `sticker send`
  - ช่องทาง: Discord
  - จำเป็น: `--target`, `--sticker-id` (ทำซ้ำได้)
  - ไม่บังคับ: `--message`

- `sticker upload`
  - ช่องทาง: Discord
  - จำเป็น: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### บทบาท / ช่องทาง / สมาชิก / เสียง

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` สำหรับ Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### เหตุการณ์

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - ไม่บังคับ: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### การกลั่นกรอง (Discord)

- `timeout`: `--guild-id`, `--user-id` (`--duration-min` หรือ `--until` ไม่บังคับ; ละเว้นทั้งคู่เพื่อล้าง timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` รองรับ `--reason` ด้วย

### Broadcast

- `broadcast`
  - ช่องทาง: ช่องทางใดก็ได้ที่กำหนดค่าไว้; ใช้ `--channel all` เพื่อกำหนดเป้าหมายผู้ให้บริการทั้งหมด
  - จำเป็น: `--targets <target...>`
  - ไม่บังคับ: `--message`, `--media`, `--dry-run`

## ตัวอย่าง

ส่งข้อความตอบกลับ Discord:

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

Core เรนเดอร์เพย์โหลด `presentation` เดียวกันเป็นคอมโพเนนต์ของ Discord, บล็อกของ Slack, ปุ่ม inline ของ Telegram, props ของ Mattermost หรือการ์ด Teams/Feishu ขึ้นอยู่กับความสามารถของช่องทาง ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญาฉบับเต็มและกฎ fallback

ส่งเพย์โหลด presentation ที่สมบูรณ์ขึ้น:

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

รีแอ็กต์ใน Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

รีแอ็กต์ในกลุ่ม Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

ส่งปุ่ม inline ของ Telegram ผ่าน presentation ทั่วไป:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

ส่งการ์ด Teams ผ่าน presentation ทั่วไป:

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

- [เอกสารอ้างอิง CLI](/th/cli)
- [Agent send](/th/tools/agent-send)
