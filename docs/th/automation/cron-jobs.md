---
read_when:
    - การตั้งเวลางานเบื้องหลังหรือการปลุกระบบ
    - การเชื่อมต่อตัวกระตุ้นภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานที่ตั้งเวลาไว้
summary: งานที่ตั้งเวลาไว้, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวตั้งเวลางาน Gateway
title: งานที่ตั้งเวลาไว้
x-i18n:
    generated_at: "2026-04-23T10:13:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# งานที่ตั้งเวลาไว้ (Cron)

Cron คือตัวตั้งเวลางานที่มีมาในตัวของ Gateway โดยจะเก็บงานไว้อย่างถาวร ปลุกเอเจนต์ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชตหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

```bash
# เพิ่มการเตือนแบบครั้งเดียว
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# ตรวจสอบงานของคุณ
openclaw cron list
openclaw cron show <job-id>

# ดูประวัติการรัน
openclaw cron runs --id <job-id>
```

## วิธีการทำงานของ cron

- Cron ทำงาน **ภายใน** โพรเซส Gateway (ไม่ใช่ภายในโมเดล)
- การกำหนดงานจะถูกเก็บถาวรที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ตารางเวลาหายไป
- สถานะการทำงานระหว่างรันไทม์จะถูกเก็บถาวรไว้ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามการกำหนด cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ลงใน gitignore
- หลังการแยกไฟล์ เวอร์ชัน OpenClaw ที่เก่ากว่ายังสามารถอ่าน `jobs.json` ได้ แต่อาจมองว่างานเป็นงานใหม่ เนื่องจากฟิลด์รันไทม์ตอนนี้อยู่ใน `jobs-state.json`
- การรัน cron ทุกครั้งจะสร้างระเบียน[งานเบื้องหลัง](/th/automation/tasks)
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองหลังสำเร็จโดยค่าเริ่มต้น
- การรัน cron แบบ isolated จะพยายามปิดแท็บเบราว์เซอร์/โพรเซสที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` เมื่อการรันเสร็จสิ้น เพื่อไม่ให้ระบบอัตโนมัติของเบราว์เซอร์ที่แยกออกมาทิ้งโพรเซสกำพร้าไว้
- การรัน cron แบบ isolated ยังป้องกันการตอบรับที่ล้าสมัยด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และข้อความลักษณะเดียวกัน) และไม่มีการรัน subagent ลูกใดที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะส่งพรอมป์อีกครั้งหนึ่งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ

<a id="maintenance"></a>

การกระทบยอดงานสำหรับ cron เป็นความรับผิดชอบของรันไทม์: งาน cron ที่กำลังทำงานอยู่จะยังคงสถานะ active ตราบใดที่รันไทม์ของ cron ยังติดตามว่างานนั้นกำลังรันอยู่ แม้ว่าจะยังมีแถวเซสชันลูกเก่าค้างอยู่ก็ตาม เมื่อรันไทม์เลิกเป็นเจ้าของงานนั้นแล้ว และช่วงผ่อนผัน 5 นาทีหมดลง งานบำรุงรักษาจึงจะสามารถทำเครื่องหมายงานเป็น `lost` ได้

## ประเภทของตารางเวลา

| ประเภท    | แฟล็ก CLI  | คำอธิบาย                                                     |
| ------- | --------- | ------------------------------------------------------------ |
| `at`    | `--at`    | เวลาประทับแบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`) |
| `every` | `--every` | ช่วงเวลาคงที่                                                  |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` แบบไม่บังคับ |

เวลาประทับที่ไม่มีเขตเวลาจะถูกตีความเป็น UTC เพิ่ม `--tz America/New_York` เพื่อใช้การตั้งเวลาตามเวลาท้องถิ่นบนหน้าปัดนาฬิกา

นิพจน์ที่ทำงานซ้ำทุกต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติไม่เกิน 5 นาทีเพื่อลดโหลดที่พุ่งสูงพร้อมกัน ใช้ `--exact` เพื่อบังคับเวลาให้ตรงเป๊ะ หรือ `--stagger 30s` เพื่อกำหนดช่วงกระจายเวลาอย่างชัดเจน

### Day-of-month และ day-of-week ใช้ตรรกะแบบ OR

นิพจน์ Cron ถูกพาร์สโดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์ day-of-month และ day-of-week ไม่ใช่ wildcard croner จะจับคู่เมื่อมี **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน — ไม่ใช่ทั้งสองฟิลด์พร้อมกัน นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# ตั้งใจ: "9 โมงเช้าวันที่ 15 เฉพาะเมื่อวันนั้นเป็นวันจันทร์"
# ผลจริง: "9 โมงเช้าของทุกวันที่ 15 และ 9 โมงเช้าของทุกวันจันทร์"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5–6 ครั้งต่อเดือน แทนที่จะเป็น 0–1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ในกรณีนี้ หากต้องการให้ทั้งสองเงื่อนไขต้องตรงกัน ให้ใช้ตัวแก้ไข day-of-week แบบ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางเวลาด้วยฟิลด์เดียว และตรวจอีกเงื่อนไขหนึ่งในพรอมป์หรือคำสั่งของงานนั้น

## รูปแบบการทำงาน

| รูปแบบ           | ค่า `--session`      | ทำงานใน                    | เหมาะที่สุดสำหรับ                 |
| --------------- | ------------------- | -------------------------- | -------------------------------- |
| เซสชันหลัก      | `main`              | เทิร์น Heartbeat ถัดไป      | การเตือนความจำ, system event     |
| Isolated        | `isolated`          | `cron:<jobId>` โดยเฉพาะ    | รายงาน, งานเบื้องหลัง            |
| เซสชันปัจจุบัน  | `current`           | ผูกไว้ตอนสร้าง              | งานที่เกิดซ้ำและอาศัยบริบท       |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันแบบมีชื่อที่คงอยู่ถาวร | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ   |

งาน **เซสชันหลัก** จะเข้าคิว system event และสามารถปลุก Heartbeat ได้ตามต้องการ (`--wake now` หรือ `--wake next-heartbeat`) งาน **Isolated** จะรันเทิร์นเอเจนต์แบบเฉพาะพร้อมเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะเก็บบริบทไว้ข้ามการรัน ทำให้รองรับเวิร์กโฟลว์อย่าง daily standup ที่ต่อยอดจากสรุปก่อนหน้าได้

สำหรับงาน isolated การรื้อถอนรันไทม์ตอนนี้รวมถึงการทำความสะอาดเบราว์เซอร์แบบ best-effort สำหรับเซสชัน cron นั้นด้วย ความล้มเหลวในการทำความสะอาดจะถูกละเลย เพื่อให้ผลลัพธ์ cron จริงยังคงมีความสำคัญสูงสุด

การรัน cron แบบ isolated ยังจัดการปิดอินสแตนซ์รันไทม์ MCP แบบ bundled ใด ๆ ที่สร้างขึ้นสำหรับงานผ่านเส้นทาง runtime-cleanup ที่ใช้ร่วมกันด้วย ซึ่งสอดคล้องกับวิธีปิดไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน cron แบบ isolated จะไม่ทำให้เกิดการรั่วของโพรเซสลูก stdio หรือการเชื่อมต่อ MCP ที่ค้างอยู่นานข้ามการรัน

เมื่อการรัน cron แบบ isolated ทำ orchestration ของ subagent การส่งมอบจะให้ความสำคัญกับผลลัพธ์สุดท้ายของ descendant มากกว่าข้อความชั่วคราวจาก parent ที่ล้าสมัยด้วย หาก descendant ยังคงทำงานอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจาก parent นั้นแทนการประกาศออกไป

### ตัวเลือก payload สำหรับงาน isolated

- `--message`: ข้อความพรอมป์ (จำเป็นสำหรับ isolated)
- `--model` / `--thinking`: การ override โมเดลและระดับการคิด
- `--light-context`: ข้ามการ inject ไฟล์ bootstrap ของ workspace
- `--tools exec,read`: จำกัดว่าเครื่องมือใดที่งานสามารถใช้ได้

`--model` จะใช้โมเดลที่ได้รับอนุญาตซึ่งเลือกไว้สำหรับงานนั้น หากโมเดลที่ขอไม่ได้รับอนุญาต cron จะบันทึกคำเตือนและย้อนกลับไปใช้การเลือกโมเดลจากเอเจนต์/ค่าเริ่มต้นของงานแทน ห่วงโซ่ fallback ที่ตั้งค่าไว้ยังคงมีผล แต่การ override โมเดลแบบธรรมดาโดยไม่มีรายการ fallback ต่อ งานแบบ explicit จะไม่ต่อท้าย primary ของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนอีกต่อไป

ลำดับความสำคัญของการเลือกโมเดลสำหรับงาน isolated คือ:

1. การ override โมเดลจาก Gmail hook (เมื่อการรันมาจาก Gmail และอนุญาตให้ใช้การ override นั้น)
2. `model` ใน payload ต่อ งาน
3. การ override โมเดลเซสชัน cron ที่บันทึกไว้
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมดเร็วจะใช้การเลือกแบบ live ที่ resolve แล้วเช่นกัน หากคอนฟิกของโมเดลที่เลือกมี `params.fastMode` งาน cron แบบ isolated จะใช้ค่านั้นเป็นค่าเริ่มต้น การ override `fastMode` ของเซสชันที่บันทึกไว้ยังคงมีความสำคัญสูงกว่าคอนฟิกไม่ว่าจะเปิดหรือปิด

หากการรัน isolated พบการ handoff สลับโมเดลแบบ live cron จะ retry ด้วย provider/โมเดลที่สลับมา และบันทึกการเลือกแบบ live นั้นก่อน retry เมื่อการสลับมาพร้อม auth profile ใหม่ cron จะบันทึกการ override auth profile นั้นด้วย การ retry มีขอบเขตจำกัด: หลังจากความพยายามครั้งแรกบวกการ retry จากการสลับอีก 2 ครั้ง cron จะยกเลิกแทนที่จะวนลูปไม่สิ้นสุด

## การส่งมอบและผลลัพธ์

| โหมด       | สิ่งที่เกิดขึ้น                                                      |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายไปยังปลายทางแบบ fallback หากเอเจนต์ไม่ได้ส่งเอง |
| `webhook`  | ส่ง payload ของเหตุการณ์ที่เสร็จสิ้นแล้วแบบ POST ไปยัง URL          |
| `none`     | ไม่มีการส่งมอบ fallback โดย runner                                  |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัมของ Telegram ให้ใช้ `-1001234567890:topic:123` ปลายทาง Slack/Discord/Mattermost ควรใช้คำนำหน้าแบบ explicit (`channel:<id>`, `user:<id>`)

สำหรับงาน isolated การส่งไปยังแชตจะใช้ร่วมกัน หากมีเส้นทางแชตพร้อมใช้งาน เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้ว่างานจะใช้ `--no-deliver` ก็ตาม หากเอเจนต์ส่งไปยังปลายทางที่ตั้งค่าไว้/ปลายทางปัจจุบัน OpenClaw จะข้ามการประกาศแบบ fallback มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับคำตอบสุดท้ายหลังจากเทิร์นของเอเจนต์เท่านั้น

การแจ้งเตือนเมื่อเกิดความล้มเหลวจะใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` กำหนดค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` ใช้ override ค่านั้นเป็นรายงาน
- หากไม่ได้ตั้งค่าทั้งคู่ และงานนั้นส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักจะเป็น `webhook`

## ตัวอย่าง CLI

การเตือนแบบครั้งเดียว (เซสชันหลัก):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

งาน isolated ที่เกิดซ้ำพร้อมการส่งมอบ:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

งาน isolated พร้อมการ override โมเดลและการคิด:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gateway สามารถเปิดเผยปลายทาง HTTP Webhook สำหรับตัวกระตุ้นภายนอกได้ เปิดใช้งานในคอนฟิก:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### การยืนยันตัวตน

ทุกคำขอต้องมี hook token ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

ระบบจะปฏิเสธ token ใน query string

### POST /hooks/wake

เข้าคิว system event สำหรับเซสชันหลัก:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (จำเป็น): คำอธิบายเหตุการณ์
- `mode` (ไม่บังคับ): `now` (ค่าเริ่มต้น) หรือ `next-heartbeat`

### POST /hooks/agent

รันเทิร์นเอเจนต์แบบ isolated:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`

### Mapped hook (POST /hooks/\<name\>)

ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ในคอนฟิก โดย mapping สามารถแปลง payload แบบอิสระให้เป็นการทำงาน `wake` หรือ `agent` ด้วย template หรือ code transform

### ความปลอดภัย

- เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้
- ใช้ hook token เฉพาะ อย่านำ token ยืนยันตัวตนของ gateway กลับมาใช้ซ้ำ
- เก็บ `hooks.path` ไว้บน subpath เฉพาะ โดยระบบจะปฏิเสธ `/`
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบ explicit
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณจำเป็นต้องให้ผู้เรียกเลือกเซสชันได้
- หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` เพิ่มเติมเพื่อจำกัดรูปแบบของ session key ที่อนุญาต
- payload ของ hook จะถูกครอบด้วยขอบเขตความปลอดภัยโดยค่าเริ่มต้น

## การผสานรวม Gmail PubSub

เชื่อมต่อตัวกระตุ้นจากกล่องจดหมาย Gmail ไปยัง OpenClaw ผ่าน Google PubSub

**ข้อกำหนดเบื้องต้น**: CLI `gcloud`, `gog` (gogcli), เปิดใช้งาน OpenClaw hook แล้ว, และ Tailscale สำหรับปลายทาง HTTPS สาธารณะ

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้จะเขียนคอนฟิก `hooks.gmail`, เปิดใช้งาน preset ของ Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่มต้นอัตโนมัติของ Gateway

เมื่อ `hooks.enabled=true` และมีการตั้งค่า `hooks.gmail.account` Gateway จะเริ่ม `gog gmail watch serve` ระหว่างบูตและต่ออายุ watch ให้อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` หากต้องการไม่ใช้พฤติกรรมนี้

### การตั้งค่าด้วยตนเองแบบครั้งเดียว

1. เลือกโปรเจ็กต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้งาน:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. สร้าง topic และให้สิทธิ์การ push ของ Gmail:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. เริ่ม watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### การ override โมเดลของ Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## การจัดการงาน

```bash
# แสดงรายการงานทั้งหมด
openclaw cron list

# แสดงงานหนึ่งรายการ รวมถึงเส้นทางการส่งมอบที่ resolve แล้ว
openclaw cron show <jobId>

# แก้ไขงาน
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# บังคับรันงานทันที
openclaw cron run <jobId>

# รันเฉพาะเมื่อถึงกำหนดเท่านั้น
openclaw cron run <jobId> --due

# ดูประวัติการรัน
openclaw cron runs --id <jobId> --limit 50

# ลบงาน
openclaw cron remove <jobId>

# การเลือกเอเจนต์ (สำหรับการตั้งค่าหลายเอเจนต์)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

หมายเหตุเกี่ยวกับการ override โมเดล:

- `openclaw cron add|edit --model ...` จะเปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลนั้นได้รับอนุญาต provider/model ที่ระบุอย่างชัดเจนนั้นจะถูกส่งต่อไปยังการรันเอเจนต์แบบ isolated
- หากไม่ได้รับอนุญาต cron จะเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงาน
- ห่วงโซ่ fallback ที่ตั้งค่าไว้ยังคงมีผล แต่การ override แบบ `--model` ธรรมดาที่ไม่มีรายการ fallback ต่อ งานแบบ explicit จะไม่ fallback ต่อไปยัง primary ของเอเจนต์ในฐานะเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ อีกต่อไป

## การตั้งค่า

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

ไฟล์ sidecar ของสถานะรันไทม์ถูก derive จาก `cron.store`: store แบบ `.json` เช่น
`~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ส่วน path ของ store
ที่ไม่มี suffix `.json` จะต่อท้ายด้วย `-state.json`

ปิดใช้งาน cron ได้ด้วย: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

**การ retry สำหรับงานแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry ได้สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะถูกปิดใช้งานทันที

**การ retry สำหรับงานที่เกิดซ้ำ**: ใช้ exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการ retry ค่า backoff จะรีเซ็ตหลังจากการรันครั้งถัดไปที่สำเร็จ

**การบำรุงรักษา**: `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะลบรายการ run-session แบบ isolated ที่เก่าออก `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะตัดไฟล์ run-log อัตโนมัติเมื่อเกินกำหนด

## การแก้ไขปัญหา

### ลำดับคำสั่ง

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron ไม่ทำงานตามกำหนด

- ตรวจสอบ `cron.enabled` และตัวแปรแวดล้อม `OPENCLAW_SKIP_CRON`
- ยืนยันว่า Gateway ทำงานอย่างต่อเนื่อง
- สำหรับตารางเวลาแบบ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
- `reason: not-due` ในผลลัพธ์การรัน หมายความว่ามีการตรวจสอบการรันด้วยตนเองผ่าน `openclaw cron run <jobId> --due` และงานนั้นยังไม่ถึงกำหนด

### Cron ทำงานแล้วแต่ไม่มีการส่งมอบ

- โหมดการส่งมอบ `none` หมายความว่าจะไม่มีการส่งแบบ fallback โดย runner เอเจนต์ยังคงส่งโดยตรงได้ผ่านเครื่องมือ `message` เมื่อมีเส้นทางแชตให้ใช้งาน
- หากไม่มี/ไม่ถูกต้องของเป้าหมายการส่งมอบ (`channel`/`to`) การส่งออกจะถูกข้าม
- ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งมอบถูกบล็อกโดยข้อมูลรับรอง
- หากการรันแบบ isolated ส่งกลับมาเพียง silent token (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรง และยังระงับเส้นทางสรุปที่เข้าคิวไว้แบบ fallback ด้วย ดังนั้นจะไม่มีอะไรถูกโพสต์กลับไปยังแชต
- หากเอเจนต์ควรส่งข้อความถึงผู้ใช้ด้วยตัวเอง ให้ตรวจสอบว่างานนั้นมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือกำหนด channel/target แบบ explicit)

### ข้อควรระวังเรื่องเขตเวลา

- Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ gateway
- ตารางเวลา `at` ที่ไม่มีเขตเวลาจะถือเป็น UTC
- `activeHours` ของ Heartbeat ใช้การ resolve เขตเวลาตามที่ตั้งค่าไว้

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีรายการงานสำหรับการรัน cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นของเซสชันหลักแบบเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การตั้งค่าเขตเวลา
