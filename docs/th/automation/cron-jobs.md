---
read_when:
    - การจัดกำหนดการงานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดตารางเวลา Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-04-25T13:41:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron คือตัวจัดตารางเวลาในตัวของ Gateway โดยจะเก็บงานไว้ถาวร ปลุกเอเจนต์ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชตหรือปลายทาง Webhook ได้

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

# ดูประวัติการทำงาน
openclaw cron runs --id <job-id>
```

## วิธีการทำงานของ cron

- Cron ทำงาน **ภายในโปรเซส Gateway** (ไม่ใช่ภายในโมเดล)
- นิยามงานจะถูกเก็บถาวรที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ตารางเวลาหายไป
- สถานะการทำงานขณะรันจะถูกเก็บถาวรถัดจากไฟล์นั้นใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และตั้งค่า gitignore ให้กับ `jobs-state.json`
- หลังจากการแยกนี้ OpenClaw เวอร์ชันเก่ายังคงอ่าน `jobs.json` ได้ แต่บางครั้งอาจมองว่างานเป็นงานใหม่ เพราะฟิลด์ขณะรันถูกย้ายไปอยู่ใน `jobs-state.json`
- การรัน cron ทั้งหมดจะสร้างระเบียน[งานเบื้องหลัง](/th/automation/tasks)
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จเป็นค่าเริ่มต้น
- การรัน cron แบบ isolated จะพยายามปิดแท็บ/โปรเซสเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` เมื่อการรันเสร็จสิ้น เพื่อไม่ให้ระบบอัตโนมัติของเบราว์เซอร์แบบ detached ทิ้งโปรเซสค้างไว้
- การรัน cron แบบ isolated ยังป้องกันการตอบรับสถานะเก่าที่ค้างอยู่ด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และข้อความลักษณะเดียวกัน) และไม่มีการรัน subagent ลูกใดที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะส่งพรอมป์อีกครั้งหนึ่งเพื่อขอผลลัพธ์จริงก่อนส่งต่อ

<a id="maintenance"></a>

การกระทบยอดงานสำหรับ cron เป็นสิ่งที่ runtime เป็นผู้ดูแล: งาน cron ที่ยังทำงานอยู่จะคงสถานะใช้งานต่อไปตราบใดที่ runtime ของ cron ยังติดตามงานนั้นว่าอยู่ระหว่างรัน แม้ว่ายังคงมีแถว child session เก่าค้างอยู่ก็ตาม
เมื่อ runtime หยุดเป็นผู้ครอบครองงานแล้ว และพ้นช่วงผ่อนผัน 5 นาที การบำรุงรักษาจึงสามารถทำเครื่องหมายงานเป็น `lost` ได้

## ประเภทของตารางเวลา

| ประเภท    | แฟล็ก CLI  | คำอธิบาย                                              |
| --------- | ---------- | ----------------------------------------------------- |
| `at`      | `--at`     | เวลาประทับแบบครั้งเดียว (ISO 8601 หรือแบบสัมพันธ์เช่น `20m`) |
| `every`   | `--every`  | ช่วงเวลาคงที่                                          |
| `cron`    | `--cron`   | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` แบบเลือกได้ |

เวลาประทับที่ไม่มีเขตเวลาจะถือว่าเป็น UTC ใช้ `--tz America/New_York` เพื่อกำหนดเวลาตามเวลาท้องถิ่นแบบ wall-clock

นิพจน์ที่เกิดซ้ำตรงต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติได้สูงสุด 5 นาทีเพื่อลดการพุ่งขึ้นของโหลด ใช้ `--exact` เพื่อบังคับเวลาให้ตรงเป๊ะ หรือ `--stagger 30s` เพื่อกำหนดช่วงเวลาอย่างชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะแบบ OR

นิพจน์ cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ wildcard croner จะจับคู่เมื่อ **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน — ไม่ใช่ทั้งสองฟิลด์ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# ตั้งใจ: "9 AM ในวันที่ 15 และเฉพาะเมื่อวันนั้นเป็นวันจันทร์"
# ความจริง: "9 AM ทุกวันที่ 15 และ 9 AM ทุกวันจันทร์"
0 9 15 * 1
```

รูปแบบนี้จะทำงานประมาณ 5–6 ครั้งต่อเดือน แทนที่จะเป็น 0–1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ในกรณีนี้ หากต้องการให้ต้องตรงทั้งสองเงื่อนไข ให้ใช้ตัวปรับแต่งวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางด้วยฟิลด์หนึ่ง แล้วตรวจอีกฟิลด์หนึ่งในพรอมป์หรือตัวคำสั่งของงาน

## รูปแบบการทำงาน

| รูปแบบ          | ค่า `--session`     | ทำงานใน                  | เหมาะที่สุดสำหรับ                 |
| --------------- | ------------------- | ------------------------ | --------------------------------- |
| เซสชันหลัก      | `main`              | รอบ Heartbeat ถัดไป      | การเตือน, system event            |
| Isolated        | `isolated`          | `cron:<jobId>` โดยเฉพาะ  | รายงาน, งานเบื้องหลัง            |
| เซสชันปัจจุบัน  | `current`           | ผูกไว้ตอนเวลาสร้าง       | งานที่เกิดซ้ำและอิงบริบท         |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันที่มีชื่อถาวร      | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ   |

งานใน **เซสชันหลัก** จะเพิ่ม system event เข้าคิวและอาจปลุก Heartbeat (`--wake now` หรือ `--wake next-heartbeat`) งานแบบ **isolated** จะรันเอเจนต์แบบเฉพาะด้วยเซสชันใหม่ งานแบบ **เซสชันกำหนดเอง** (`session:xxx`) จะเก็บบริบทข้ามการรัน ทำให้รองรับเวิร์กโฟลว์อย่างเช่น daily standup ที่ต่อยอดจากสรุปก่อนหน้า

สำหรับงานแบบ isolated คำว่า “เซสชันใหม่” หมายถึง transcript/session id ใหม่สำหรับแต่ละการรัน OpenClaw อาจพกการตั้งค่าที่ปลอดภัยบางอย่างไปได้ เช่น การตั้งค่า thinking/fast/verbose ป้ายกำกับ และการ override model/auth ที่ผู้ใช้เลือกอย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว cron เก่า เช่น การกำหนดเส้นทาง channel/group นโยบาย send หรือ queue สิทธิ์ยกระดับ origin หรือการผูก runtime ของ ACP ใช้ `current` หรือ `session:<id>` เมื่องานที่เกิดซ้ำควรต่อยอดบนบริบทการสนทนาเดิมโดยตั้งใจ

สำหรับงานแบบ isolated การปิดการทำงานของ runtime ตอนนี้รวมถึงการล้างเบราว์เซอร์แบบพยายามเต็มที่สำหรับเซสชัน cron นั้นด้วย หากการล้างล้มเหลวจะถูกละเลย เพื่อให้ผลลัพธ์ cron จริงยังคงเป็นผลลัพธ์ที่มีผลเหนือกว่า

การรัน cron แบบ isolated จะกำจัดอินสแตนซ์ MCP runtime แบบ bundled ที่สร้างสำหรับงานนั้นผ่านเส้นทางการล้าง runtime ที่ใช้ร่วมกันด้วยเช่นกัน ซึ่งสอดคล้องกับวิธีที่ไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเองถูกปิดลง จึงทำให้งาน cron แบบ isolated ไม่ทิ้ง stdio child process หรือการเชื่อมต่อ MCP แบบระยะยาวค้างไว้ข้ามการรัน

เมื่อการรัน cron แบบ isolated ประสานงานกับ subagent การส่งต่อผลลัพธ์จะให้ความสำคัญกับผลลัพธ์สุดท้ายของ descendant มากกว่าข้อความชั่วคราวเก่าจาก parent ด้วย หาก descendant ยังทำงานอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจาก parent นั้นแทนที่จะประกาศออกไป

สำหรับปลายทางประกาศ Discord ที่เป็นข้อความล้วน OpenClaw จะส่งข้อความ assistant ฉบับสุดท้ายมาตรฐานเพียงครั้งเดียว แทนที่จะเล่นซ้ำทั้ง payload ข้อความแบบสตรีมหรือข้อความระหว่างทางและคำตอบสุดท้าย ส่วน payload ของ Discord ที่เป็นสื่อและมีโครงสร้างจะยังถูกส่งแยกกันเพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์ถูกทิ้งหาย

### ตัวเลือก payload สำหรับงานแบบ isolated

- `--message`: ข้อความพรอมป์ (จำเป็นสำหรับ isolated)
- `--model` / `--thinking`: การ override โมเดลและระดับการคิด
- `--light-context`: ข้ามการฉีดไฟล์ bootstrap ของ workspace
- `--tools exec,read`: จำกัดเครื่องมือที่งานสามารถใช้ได้

`--model` จะใช้โมเดลที่ได้รับอนุญาตซึ่งเลือกไว้สำหรับงานนั้น หากโมเดลที่ร้องขอไม่ได้รับอนุญาต cron จะบันทึกคำเตือนและ fallback กลับไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานแทน โซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล แต่การ override โมเดลแบบธรรมดาที่ไม่มีรายการ fallback ต่อ-งานที่ระบุไว้อย่างชัดเจน จะไม่ต่อท้าย primary ของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนอีกต่อไป

ลำดับความสำคัญของการเลือกโมเดลสำหรับงานแบบ isolated คือ:

1. การ override โมเดลของ Gmail hook (เมื่อการรันมาจาก Gmail และการ override นั้นได้รับอนุญาต)
2. `model` ใน payload ต่อ-งาน
3. การ override โมเดลของ cron session ที่จัดเก็บไว้ซึ่งผู้ใช้เลือก
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมดเร็วจะอิงตามตัวเลือกที่ถูกแก้ไขแล้วในขณะใช้งานเช่นกัน หากคอนฟิกโมเดลที่เลือกมี `params.fastMode` งาน cron แบบ isolated จะใช้ค่านั้นเป็นค่าเริ่มต้น การ override `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงมีผลเหนือคอนฟิกไม่ว่าจะเป็นการเปิดหรือปิด

หากการรันแบบ isolated พบการส่งต่อ live model-switch ระหว่างทาง cron จะลองใหม่ด้วย provider/model ที่สลับไปแล้ว และจะเก็บตัวเลือก live นั้นไว้สำหรับการรันที่กำลังทำงานก่อนลองใหม่ เมื่อการสลับมี auth profile ใหม่มาด้วย cron จะเก็บการ override auth profile นั้นไว้สำหรับการรันปัจจุบันด้วย การลองใหม่มีขอบเขตจำกัด: หลังจากความพยายามเริ่มต้นบวกการลองใหม่จากการสลับอีก 2 ครั้ง cron จะยกเลิกแทนที่จะวนลูปไปเรื่อย ๆ

## การส่งต่อและผลลัพธ์

| โหมด      | สิ่งที่เกิดขึ้น                                                  |
| --------- | ----------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายไปยังปลายทางแบบ fallback หากเอเจนต์ไม่ได้ส่งเอง |
| `webhook`  | POST payload อีเวนต์ที่เสร็จแล้วไปยัง URL                        |
| `none`     | ไม่มีการส่งแบบ fallback โดยตัวรัน                               |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัมของ Telegram ให้ใช้ `-1001234567890:topic:123` ปลายทาง Slack/Discord/Mattermost ควรใช้ prefix แบบชัดเจน (`channel:<id>`, `user:<id>`)

สำหรับงานแบบ isolated การส่งไปยังแชตเป็นระบบที่ใช้ร่วมกัน หากมีเส้นทางแชตให้ใช้ เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังปลายทางที่กำหนดไว้/ปลายทางปัจจุบัน OpenClaw จะข้ามการประกาศแบบ fallback มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเพียงสิ่งที่ตัวรันทำกับคำตอบสุดท้ายหลังจากรอบของเอเจนต์

การแจ้งเตือนเมื่อเกิดข้อผิดพลาดใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` กำหนดค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนเมื่อเกิดข้อผิดพลาด
- `job.delivery.failureDestination` ใช้ override รายงานนั้นเป็นรายงานต่อ-งาน
- หากไม่ได้ตั้งค่าอย่างใดอย่างหนึ่ง และงานนั้นส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนเมื่อเกิดข้อผิดพลาดจะ fallback ไปยังปลายทาง announce หลักนั้น
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

งานแบบ isolated ที่เกิดซ้ำพร้อมการส่งต่อ:

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

งานแบบ isolated พร้อมการ override โมเดลและการคิด:

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

Gateway สามารถเปิดเผยปลายทาง HTTP Webhook สำหรับทริกเกอร์ภายนอกได้ เปิดใช้งานได้ในคอนฟิก:

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

ทุกคำขอต้องรวม token ของ hook ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

token ใน query string จะถูกปฏิเสธ

### POST /hooks/wake

เพิ่ม system event เข้าคิวสำหรับเซสชันหลัก:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (จำเป็น): คำอธิบายอีเวนต์
- `mode` (ไม่บังคับ): `now` (ค่าเริ่มต้น) หรือ `next-heartbeat`

### POST /hooks/agent

รันรอบเอเจนต์แบบ isolated:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`

### Mapped hooks (POST /hooks/\<name\>)

ชื่อ hook แบบกำหนดเองจะถูกแปลงผ่าน `hooks.mappings` ในคอนฟิก โดย mapping สามารถแปลง payload แบบใดก็ได้ให้เป็นการกระทำ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงด้วยโค้ด

### ความปลอดภัย

- เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้
- ใช้ token สำหรับ hook โดยเฉพาะ; อย่านำ token ยืนยันตัวตนของ gateway กลับมาใช้ซ้ำ
- เก็บ `hooks.path` ไว้ใน subpath ที่แยกเฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการให้ผู้เรียกเลือกเซสชันได้เอง
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบ session key ที่อนุญาต
- payload ของ hook จะถูกห่อหุ้มด้วยขอบเขตความปลอดภัยเป็นค่าเริ่มต้น

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

**ข้อกำหนดเบื้องต้น**: CLI `gcloud`, `gog` (gogcli), เปิดใช้งาน OpenClaw hooks แล้ว, และ Tailscale สำหรับปลายทาง HTTPS สาธารณะ

### การตั้งค่าผ่านวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

การดำเนินการนี้จะเขียนคอนฟิก `hooks.gmail` เปิดใช้ preset ของ Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่มต้น Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และมีการตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch ให้โดยอัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` หากต้องการปิดใช้งาน

### การตั้งค่าด้วยตนเองแบบครั้งเดียว

1. เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้งาน:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. สร้าง topic และให้สิทธิ์การเข้าถึง push ของ Gmail:

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

### การ override โมเดลสำหรับ Gmail

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

# แสดงงานหนึ่งรายการ รวมถึงเส้นทางการส่งที่ resolve แล้ว
openclaw cron show <jobId>

# แก้ไขงาน
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# บังคับรันงานทันที
openclaw cron run <jobId>

# รันเฉพาะเมื่อถึงกำหนด
openclaw cron run <jobId> --due

# ดูประวัติการรัน
openclaw cron runs --id <jobId> --limit 50

# ลบงาน
openclaw cron remove <jobId>

# การเลือกเอเจนต์ (ในการตั้งค่าหลายเอเจนต์)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

หมายเหตุเกี่ยวกับการ override โมเดล:

- `openclaw cron add|edit --model ...` จะเปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลนั้นได้รับอนุญาต provider/model ที่ระบุแบบตรงตัวนั้นจะถูกส่งไปยังการรันเอเจนต์แบบ isolated
- หากไม่ได้รับอนุญาต cron จะเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงาน
- โซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล แต่การ override `--model` แบบธรรมดาที่ไม่มีรายการ fallback ต่อ-งานที่ระบุไว้อย่างชัดเจน จะไม่ fallback ต่อไปยัง primary ของเอเจนต์ในฐานะเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ อีกต่อไป

## การกำหนดค่า

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

ไฟล์ sidecar สำหรับสถานะ runtime จะได้มาจาก `cron.store`: store แบบ `.json` เช่น `~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ส่วน path ของ store ที่ไม่มีนามสกุล `.json` จะเติม `-state.json` ต่อท้าย

ปิดใช้งาน cron ได้ด้วย: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

**การลองใหม่สำหรับงานแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองใหม่ได้สูงสุด 3 ครั้งด้วย exponential backoff ข้อผิดพลาดถาวรจะถูกปิดใช้งานทันที

**การลองใหม่สำหรับงานที่เกิดซ้ำ**: ใช้ exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการลองใหม่ การ backoff จะรีเซ็ตหลังจากการรันครั้งถัดไปที่สำเร็จ

**การบำรุงรักษา**: `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะลบรายการ run-session ของการรันแบบ isolated ที่หมดอายุ `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะตัดไฟล์บันทึกการรันโดยอัตโนมัติ

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
- ยืนยันว่า Gateway ทำงานต่อเนื่องอยู่
- สำหรับตารางเวลาแบบ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
- `reason: not-due` ในผลลัพธ์การรันหมายความว่ามีการตรวจสอบการรันด้วยตนเองผ่าน `openclaw cron run <jobId> --due` และงานนั้นยังไม่ถึงกำหนด

### Cron ทำงานแล้วแต่ไม่มีการส่งต่อ

- โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งแบบ fallback โดยตัวรัน เอเจนต์ยังคงส่งโดยตรงได้ผ่านเครื่องมือ `message` เมื่อมีเส้นทางแชตให้ใช้
- ปลายทางการส่งหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าระบบขาออกถูกข้ามไป
- ข้อผิดพลาดด้านการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดยข้อมูลรับรอง
- หากการรันแบบ isolated ส่งกลับมาเพียง silent token (`NO_REPLY` / `no_reply`) OpenClaw จะระงับทั้งการส่งออกโดยตรงและเส้นทางสรุปเข้าคิวแบบ fallback ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต
- หากเอเจนต์ควรส่งข้อความให้ผู้ใช้ด้วยตัวเอง ให้ตรวจสอบว่างานนั้นมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือ channel/target ที่ระบุชัดเจน)

### ข้อควรระวังเกี่ยวกับเขตเวลา

- Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ gateway
- ตารางเวลา `at` ที่ไม่มีเขตเวลาจะถือเป็น UTC
- `activeHours` ของ Heartbeat ใช้การ resolve เขตเวลาตามที่กำหนดค่าไว้

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — ภาพรวมของกลไกการทำงานอัตโนมัติทั้งหมด
- [Background Tasks](/th/automation/tasks) — ledger งานสำหรับการรัน cron
- [Heartbeat](/th/gateway/heartbeat) — รอบของเซสชันหลักแบบเป็นระยะ
- [Timezone](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
