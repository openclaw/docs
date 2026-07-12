---
read_when:
    - การเพิ่มหรือแก้ไขการดำเนินการ CLI สำหรับข้อความ
    - การเปลี่ยนลักษณะการทำงานของช่องทางขาออก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw message` (การส่งและการดำเนินการของช่องทาง)
title: ข้อความ
x-i18n:
    generated_at: "2026-07-12T15:54:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

คำสั่งขาออกแบบรวมศูนย์สำหรับส่งข้อความและดำเนินการกับช่องทางต่าง ๆ ได้แก่
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram และ WhatsApp

```bash
openclaw message <subcommand> [flags]
```

## การเลือกช่องทาง

- ต้องระบุ `--channel <name>` หากกำหนดค่าไว้มากกว่าหนึ่งช่องทาง แต่หาก
  กำหนดค่าไว้เพียงหนึ่งช่องทาง ระบบจะใช้ช่องทางนั้นเป็นค่าเริ่มต้น
- ค่าที่รองรับ: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost ต้องใช้ Plugin)
- เป้าหมายที่มีคำนำหน้าช่องทาง (ตัวอย่างเช่น `discord:channel:123`) จะระบุ
  Plugin ที่เป็นเจ้าของได้โดยไม่ต้องระบุ `--channel` อย่างชัดเจน

## รูปแบบเป้าหมาย (`-t, --target`)

| ช่องทาง             | รูปแบบ                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, การกล่าวถึงด้วย `<@id>` หรือรหัสตัวเลขล้วน (ถือว่าเป็นรหัสช่อง)               |
| Google Chat         | `spaces/<spaceId>` หรือ `users/<userId>`                                                                     |
| iMessage            | ตัวระบุผู้ใช้, `chat_id:<id>`, `chat_guid:<guid>` หรือ `chat_identifier:<id>`                                      |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username` หรือรหัสล้วน (ถือว่าเป็นช่อง)                              |
| Matrix              | `@user:server`, `!room:server` หรือ `#alias:server`                                                         |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), รหัสการสนทนาล้วน หรือ `user:<aad-object-id>`             |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` หรือรูปแบบใดรูปแบบหนึ่งเหล่านี้ที่นำหน้าด้วย `signal:` |
| Slack               | `channel:<id>` หรือ `user:<id>` (รหัสล้วนจะถือว่าเป็นช่อง)                                          |
| Telegram            | รหัสแชต, `@username` หรือเป้าหมายหัวข้อฟอรัม: `<chatId>:topic:<topicId>` (หรือ `--thread-id <topicId>`)     |
| WhatsApp            | E.164, JID ของกลุ่ม (`...@g.us`) หรือ JID ของช่อง/จดหมายข่าว (`...@newsletter`)                                |

การค้นหาชื่อช่องทาง: สำหรับผู้ให้บริการที่มีไดเรกทอรี (Discord/Slack/ฯลฯ) ชื่อ
เช่น `Help` หรือ `#help` จะถูกแปลงผ่านแคชไดเรกทอรี และหากไม่พบในแคช
จะค้นหาจากไดเรกทอรีแบบสดแทนในกรณีที่ผู้ให้บริการรองรับ

## แฟล็กทั่วไป

ทุกการดำเนินการรองรับ: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose` การดำเนินการที่ต้องระบุปลายทางยังรองรับ
`-t, --target <dest>` ด้วย

## การแปลงค่า SecretRef

`openclaw message` จะแปลงค่า SecretRef ของช่องทางก่อนดำเนินการ
โดยจำกัดขอบเขตให้แคบที่สุดเท่าที่ทำได้:

- จำกัดเฉพาะช่องทางเมื่อกำหนด `--channel` (หรืออนุมานจากเป้าหมายที่มีคำนำหน้า)
- จำกัดเฉพาะบัญชีเมื่อกำหนด `--account` เพิ่มเติม
- ครอบคลุมช่องทางที่กำหนดค่าไว้ทั้งหมดเมื่อไม่ได้กำหนดทั้งสองรายการ

SecretRef ที่แปลงค่าไม่ได้ในช่องทางที่ไม่เกี่ยวข้องจะไม่ขัดขวางการดำเนินการแบบระบุเป้าหมาย
แต่ SecretRef ที่แปลงค่าไม่ได้ในช่องทาง/บัญชีที่เลือกจะทำให้การดำเนินการล้มเหลวแบบปิดกั้น

## การดำเนินการ

### หลัก

| การดำเนินการ          | ช่องทาง                                                                                                        | รายการที่ต้องระบุ                                                       | หมายเหตุ                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` และหนึ่งใน `--message`/`--media`/`--presentation` | ดู [การส่ง](#send) ด้านล่าง                                                                                                                                                                                                                                                                               |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (ระบุซ้ำได้)        | ดู [แบบสำรวจ](#poll) ด้านล่าง                                                                                                                                                                                                                                                                               |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (ต้องใช้ร่วมกับ `--emoji`; หากไม่ระบุ จะล้างรีแอ็กชันของตนเองในช่องทางที่รองรับ โปรดดู [รีแอ็กชัน](/th/tools/reactions)) WhatsApp: `--participant`, `--from-me` รีแอ็กชันในกลุ่ม Signal ต้องระบุ `--target-author` หรือ `--target-author-uuid` ส่วน Nextcloud Talk รองรับเฉพาะการเพิ่มรีแอ็กชัน การใช้ `--remove` จะเกิดข้อผิดพลาด |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`                                                                                                                                                                                                                                                                                             |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after` Discord: `--around`, `--include-thread` Slack: `--message-id` ใช้อ่านการประทับเวลาที่ระบุ และใช้ร่วมกับ `--thread-id` เพื่ออ่านการตอบกลับในเธรดที่ตรงกัน                                                                                                                                                                     |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | เธรดฟอรัม Telegram ใช้ `--thread-id`                                                                                                                                                                                                                                                              |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` รองรับ `--pinned-message-id` ด้วย (Microsoft Teams: รหัสทรัพยากรสำหรับปักหมุด/แสดงรายการข้อความที่ปักหมุด ไม่ใช่รหัสข้อความแชต)                                                                                                                                                                                  |
| `pins` (แสดงรายการ)   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`                                                                                                                                                                                                                                                                                             |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: ใช้งานได้เฉพาะเมื่อเปิดใช้การเข้ารหัสและอนุญาตการดำเนินการยืนยันตัวตน                                                                                                                                                                                                                |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (ระบุซ้ำได้), `--author-id`, `--author-ids` (ระบุซ้ำได้), `--limit`                                                                                                                                                                                                           |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord)                                                                                                                                                                                                                                                                                |

### การส่ง

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: แนบรูปภาพ/เสียง/วิดีโอ/เอกสาร (พาธภายในเครื่องหรือ
  URL)
- `--presentation <json>`: เพย์โหลดที่ใช้ร่วมกันซึ่งประกอบด้วยบล็อก `text`, `context`, `divider`,
  `chart`, `table`, `buttons` และ `select` โดยเรนเดอร์ตาม
  ความสามารถของแต่ละช่องทาง ดู [การนำเสนอข้อความ](/th/plugins/message-presentation)
- `--delivery <json>`: ค่ากำหนดการนำส่งทั่วไป ตัวอย่างเช่น `{"pin":
true}` โดย `--pin` เป็นรูปแบบย่อสำหรับการนำส่งแบบปักหมุดเมื่อช่องทางรองรับ
- `--reply-to <id>`, `--thread-id <id>` (หัวข้อฟอรัม Telegram; การประทับเวลา
  ของเธรด Slack ซึ่งใช้ฟิลด์เดียวกับ `--reply-to`)
- `--force-document` (Telegram, WhatsApp): ส่งรูปภาพ/GIF/วิดีโอเป็น
  เอกสารเพื่อหลีกเลี่ยงการบีบอัดของช่องทาง
- `--silent` (Telegram, Discord): ส่งโดยไม่มีการแจ้งเตือน
- `--gif-playback` (เฉพาะ WhatsApp): จัดการสื่อวิดีโอเป็นการเล่นแบบ GIF

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack เรนเดอร์บล็อกแผนภูมิที่รองรับในรูปแบบเนทีฟ ส่วนช่องทางอื่นจะได้รับข้อมูลเดียวกัน
ในรูปแบบข้อความที่อ่านได้:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack ยังแสดงผลบล็อกตารางที่ระบุไว้อย่างชัดเจนในรูปแบบเนทีฟด้วย ช่องทางอื่นจะได้รับ
คำบรรยายและทุกแถวเป็นข้อความที่ให้ผลลัพธ์แน่นอน:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

ปุ่ม Mini App ของ Telegram ใช้ `webApp` (`web_app` ยังคงแยกวิเคราะห์ได้สำหรับ JSON
แบบเดิม) และแสดงผลเฉพาะในแชตส่วนตัวระหว่างผู้ใช้กับบอตเท่านั้น:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### แบบสำรวจ

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: ทำซ้ำ 2-12 ครั้ง
- `--poll-multi`: อนุญาตให้เลือกได้หลายตัวเลือก
- Discord: `--poll-duration-hours`, `--silent`, `--message`
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### เธรด

- `thread create`: ช่องทาง Discord จำเป็นต้องระบุ: `--thread-name`, `--target`
  (รหัสช่อง) ไม่บังคับ: `--message-id`, `--message`, `--auto-archive-min`
- `thread list`: ช่องทาง Discord จำเป็นต้องระบุ: `--guild-id` ไม่บังคับ:
  `--channel-id`, `--include-archived`, `--before`, `--limit`
- `thread reply`: ช่องทาง Discord จำเป็นต้องระบุ: `--target` (รหัสเธรด),
  `--message` ไม่บังคับ: `--media`, `--reply-to`

### อีโมจิ

- `emoji list`: Discord (`--guild-id`), Slack (ไม่มีแฟล็กเพิ่มเติม)
- `emoji upload`: Discord จำเป็นต้องระบุ: `--guild-id`, `--emoji-name`, `--media`
  ไม่บังคับ: `--role-ids` (ทำซ้ำได้)

### สติกเกอร์

- `sticker send`: Discord จำเป็นต้องระบุ: `--target`, `--sticker-id` (ทำซ้ำได้)
  ไม่บังคับ: `--message`
- `sticker upload`: Discord จำเป็นต้องระบุ: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`

### บทบาท ช่อง เสียง และกิจกรรม (Discord)

- `role info`: `--guild-id`
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`
- `channel info`: `--target`
- `channel list`: `--guild-id`
- `voice status`: `--guild-id`, `--user-id`
- `event list`: `--guild-id`
- `event create`: จำเป็นต้องระบุ `--guild-id`, `--event-name`, `--start-time`;
  ไม่บังคับ `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`

### การดูแลเนื้อหา (Discord)

- `timeout`: `--guild-id`, `--user-id`; ไม่บังคับ `--duration-min` หรือ
  `--until` (ไม่ต้องระบุทั้งสองรายการเพื่อล้างการจำกัดเวลา), `--reason`
- `kick`: `--guild-id`, `--user-id`, `--reason`
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`

### การกระจายข้อความ

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

ส่งเพย์โหลดหนึ่งรายการไปยังเป้าหมายหลายแห่ง `--targets` รับรายการที่คั่นด้วย
ช่องว่าง ใช้ `--channel all` เพื่อกำหนดเป้าหมายไปยังผู้ให้บริการที่กำหนดค่าไว้ทั้งหมด

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การส่งโดย Agent](/th/tools/agent-send)
- [การนำเสนอข้อความ](/th/plugins/message-presentation)
