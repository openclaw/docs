---
read_when:
    - คุณต้องการงานตามกำหนดเวลาและการปลุกให้ทำงาน
    - คุณกำลังดีบักการทำงานของ Cron และล็อก
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw cron` (กำหนดเวลาและเรียกใช้งานพื้นหลัง)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

จัดการงาน Cron สำหรับตัวกำหนดตารางเวลาของ Gateway

<Tip>
เรียกใช้ `openclaw cron --help` เพื่อดูพื้นผิวคำสั่งทั้งหมด ดู [งาน Cron](/th/automation/cron-jobs) สำหรับคู่มือเชิงแนวคิด
</Tip>

## เซสชัน

`--session` รับค่า `main`, `isolated`, `current` หรือ `session:<id>`

<AccordionGroup>
  <Accordion title="คีย์เซสชัน">
    - `main` ผูกกับเซสชันหลักของ agent
    - `isolated` สร้างทรานสคริปต์ใหม่และ id เซสชันใหม่สำหรับการรันแต่ละครั้ง
    - `current` ผูกกับเซสชันที่ใช้งานอยู่ ณ เวลาสร้าง
    - `session:<id>` ปักหมุดกับคีย์เซสชันถาวรที่ระบุอย่างชัดเจน

  </Accordion>
  <Accordion title="ความหมายของเซสชันแบบแยก">
    การรันแบบแยกจะรีเซ็ตบริบทการสนทนาแวดล้อม การกำหนดเส้นทางช่องทางและกลุ่ม นโยบายส่ง/เข้าคิว การยกระดับ ต้นทาง และการผูก runtime ของ ACP จะถูกรีเซ็ตสำหรับการรันใหม่ ค่ากำหนดที่ปลอดภัยและการ override โมเดลหรือ auth ที่ผู้ใช้เลือกไว้อย่างชัดเจนสามารถส่งต่อข้ามการรันได้
  </Accordion>
</AccordionGroup>

## การส่งมอบ

`openclaw cron list` และ `openclaw cron show <job-id>` แสดงตัวอย่างเส้นทางการส่งมอบที่ resolve แล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่าเส้นทาง resolve จากเซสชันหลักหรือเซสชันปัจจุบัน หรือจะ fail closed

เป้าหมายที่มี provider เป็น prefix สามารถทำให้ช่องทางประกาศที่ยังไม่ resolve มีความชัดเจนได้ ตัวอย่างเช่น `to: "telegram:123"` เลือก Telegram เมื่อ `delivery.channel` ถูกละไว้หรือเป็น `last` เฉพาะ prefix ที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือก provider หาก `delivery.channel` ระบุไว้อย่างชัดเจน prefix ต้องตรงกับช่องทางนั้น; `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ prefix ของบริการ เช่น `imessage:` และ `sms:` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ

<Note>
งาน `cron add` แบบแยกมีค่าเริ่มต้นเป็นการส่งมอบ `--announce` ใช้ `--no-deliver` เพื่อเก็บผลลัพธ์ไว้ภายใน `--deliver` ยังคงอยู่ในฐานะ alias ที่เลิกแนะนำแล้วของ `--announce`
</Note>

### ความเป็นเจ้าของการส่งมอบ

การส่งมอบแชท Cron แบบแยกถูกแชร์ระหว่าง agent และ runner:

- agent สามารถส่งโดยตรงด้วยเครื่องมือ `message` เมื่อมีเส้นทางแชทพร้อมใช้งาน
- `announce` ส่งมอบคำตอบสุดท้ายแบบ fallback เฉพาะเมื่อ agent ไม่ได้ส่งโดยตรงไปยังเป้าหมายที่ resolve แล้ว
- `webhook` โพสต์ payload ที่เสร็จแล้วไปยัง URL
- `none` ปิดการส่งมอบ fallback ของ runner

`--announce` คือการส่งมอบ fallback ของ runner สำหรับคำตอบสุดท้าย `--no-deliver` ปิด fallback นั้น แต่ไม่ได้เอาเครื่องมือ `message` ของ agent ออกเมื่อมีเส้นทางแชทพร้อมใช้งาน

การเตือนความจำที่สร้างจากแชทที่ใช้งานอยู่จะรักษาเป้าหมายการส่งมอบแชทสดไว้สำหรับการส่งมอบประกาศแบบ fallback คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก อย่าใช้คีย์เหล่านี้เป็นแหล่งความจริงสำหรับ ID provider ที่แยกตัวพิมพ์เล็กใหญ่ เช่น ID ห้อง Matrix

### การส่งมอบเมื่อเกิดความล้มเหลว

การแจ้งเตือนความล้มเหลว resolve ตามลำดับนี้:

1. `delivery.failureDestination` บนงาน
2. `cron.failureDestination` ส่วนกลาง
3. เป้าหมายประกาศหลักของงาน (เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวไว้อย่างชัดเจน)

<Note>
งานเซสชันหลักใช้ `delivery.failureDestination` ได้เฉพาะเมื่อโหมดการส่งมอบหลักเป็น `webhook` งานแบบแยกรับค่านี้ได้ในทุกโหมด
</Note>

หมายเหตุ: การรัน Cron แบบแยกถือว่าความล้มเหลวของ agent ระดับการรันเป็นข้อผิดพลาดของงาน แม้เมื่อ
ไม่มีการสร้าง payload คำตอบ ดังนั้นความล้มเหลวของโมเดล/provider ยังคงเพิ่มตัวนับข้อผิดพลาด
และทริกเกอร์การแจ้งเตือนความล้มเหลว

## การกำหนดตารางเวลา

### งานแบบครั้งเดียว

`--at <datetime>` กำหนดเวลาการรันแบบครั้งเดียว datetime ที่ไม่มี offset จะถือเป็น UTC เว้นแต่คุณจะส่ง `--tz <iana>` ด้วย ซึ่งจะตีความเวลาแบบ wall-clock ในเขตเวลาที่กำหนด

<Note>
งานแบบครั้งเดียวจะถูกลบหลังสำเร็จโดยค่าเริ่มต้น ใช้ `--keep-after-run` เพื่อเก็บไว้
</Note>

### งานที่เกิดซ้ำ

งานที่เกิดซ้ำใช้ exponential retry backoff หลังจากเกิดข้อผิดพลาดต่อเนื่อง: 30s, 1m, 5m, 15m, 60m ตารางเวลาจะกลับสู่ภาวะปกติหลังการรันครั้งถัดไปที่สำเร็จ

การรันที่ถูกข้ามจะถูกติดตามแยกจากข้อผิดพลาดในการดำเนินการ การรันเหล่านี้ไม่ส่งผลต่อ retry backoff แต่ `openclaw cron edit <job-id> --failure-alert-include-skipped` สามารถเลือกให้การแจ้งเตือนความล้มเหลวรวมการแจ้งเตือนการรันที่ถูกข้ามซ้ำได้

สำหรับงานแบบแยกที่กำหนดเป้าหมายไปยัง provider โมเดลที่กำหนดค่าไว้ในเครื่อง Cron จะรัน provider preflight แบบเบาก่อนเริ่มเทิร์นของ agent provider `api: "ollama"` แบบ loopback, เครือข่ายส่วนตัว และ `.local` จะถูก probe ที่ `/api/tags`; provider ที่เข้ากันได้กับ OpenAI ในเครื่อง เช่น vLLM, SGLang และ LM Studio จะถูก probe ที่ `/models` หาก endpoint เข้าถึงไม่ได้ การรันจะถูกบันทึกเป็น `skipped` และ retry ในตารางเวลาภายหลัง; endpoint ที่ตรงกันและตายแล้วจะถูกแคชไว้ 5 นาทีเพื่อหลีกเลี่ยงไม่ให้งานจำนวนมากถล่ม server ในเครื่องเดียวกัน

หมายเหตุ: นิยามงาน Cron อยู่ใน `jobs.json` ขณะที่สถานะ runtime ที่รอดำเนินการอยู่ใน `jobs-state.json` หาก `jobs.json` ถูกแก้ไขจากภายนอก Gateway จะโหลดตารางเวลาที่เปลี่ยนแปลงใหม่และล้าง slot ที่รอดำเนินการซึ่งค้างอยู่ การเขียนซ้ำที่เปลี่ยนเฉพาะรูปแบบจะไม่ล้าง slot ที่รอดำเนินการ

### การรันด้วยตนเอง

`openclaw cron run` ส่งคืนทันทีที่การรันด้วยตนเองถูกเข้าคิว การตอบกลับที่สำเร็จมี `{ ok: true, enqueued: true, runId }` ใช้ `openclaw cron runs --id <job-id>` เพื่อติดตามผลลัพธ์ในท้ายที่สุด

<Note>
`openclaw cron run <job-id>` บังคับรันโดยค่าเริ่มต้น ใช้ `--due` เพื่อคงพฤติกรรมเดิมแบบ "รันเฉพาะเมื่อถึงกำหนด" ไว้
</Note>

## โมเดล

`cron add|edit --model <ref>` เลือกโมเดลที่อนุญาตสำหรับงาน

<Warning>
หากโมเดลไม่ได้รับอนุญาตหรือไม่สามารถ resolve ได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบอย่างชัดเจน แทนที่จะ fallback ไปยัง agent ของงานหรือการเลือกโมเดลเริ่มต้น
</Warning>

Cron `--model` เป็น **ตัวหลักของงาน** ไม่ใช่ override `/model` ของเซสชันแชท นั่นหมายความว่า:

- fallback ของโมเดลที่กำหนดค่ายังคงมีผลเมื่อโมเดลงานที่เลือกไว้ล้มเหลว
- payload ต่อรายการงาน `fallbacks` จะแทนที่รายการ fallback ที่กำหนดค่าไว้เมื่อมีอยู่
- รายการ fallback ต่อรายการงานที่ว่างเปล่า (`fallbacks: []` ใน payload/API ของงาน) ทำให้การรัน Cron เป็นแบบเข้มงวด
- เมื่องานมี `--model` แต่ไม่มีการกำหนดค่ารายการ fallback OpenClaw จะส่ง fallback override ที่ว่างเปล่าอย่างชัดเจน เพื่อไม่ให้ตัวหลักของ agent ถูกผนวกเป็นเป้าหมาย retry ที่ซ่อนอยู่

### ลำดับความสำคัญของโมเดล Cron แบบแยก

Cron แบบแยก resolve โมเดลที่ใช้งานอยู่ตามลำดับนี้:

1. override ของ Gmail-hook
2. `--model` ต่อรายการงาน
3. override โมเดลเซสชัน Cron ที่เก็บไว้ (เมื่อผู้ใช้เลือกไว้)
4. การเลือกโมเดลของ agent หรือค่าเริ่มต้น

### โหมดเร็ว

โหมดเร็วของ Cron แบบแยกจะตามการเลือกโมเดลสดที่ resolve แล้ว ค่า config โมเดล `params.fastMode` มีผลโดยค่าเริ่มต้น แต่ override `fastMode` ของเซสชันที่เก็บไว้ยังคงชนะ config

### การ retry การสลับโมเดลสด

หากการรันแบบแยกโยน `LiveSessionModelSwitchError` Cron จะ persist provider และโมเดลที่สลับแล้ว (และ override โปรไฟล์ auth ที่สลับแล้วเมื่อมี) สำหรับการรันที่ใช้งานอยู่ก่อน retry ลูป retry ภายนอกถูกจำกัดไว้ที่การ retry การสลับสองครั้งหลังความพยายามแรก จากนั้น abort แทนที่จะวนซ้ำตลอดไป

## ผลลัพธ์การรันและการปฏิเสธ

### การกดทับ acknowledgement ที่ค้างเก่า

เทิร์น Cron แบบแยกจะกดทับคำตอบที่เป็นเพียง acknowledgement ที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราวและไม่มีการรัน subagent ลูกหลานรับผิดชอบคำตอบในท้ายที่สุด Cron จะ prompt ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ

### การกดทับ silent token

หากการรัน Cron แบบแยกคืนค่าเฉพาะ silent token (`NO_REPLY` หรือ `no_reply`) Cron จะกดทับทั้งการส่งมอบขาออกโดยตรงและเส้นทางสรุปที่เข้าคิวแบบ fallback ดังนั้นจะไม่มีสิ่งใดถูกโพสต์กลับไปยังแชท

### การปฏิเสธแบบมีโครงสร้าง

การรัน Cron แบบแยกจะให้ความสำคัญกับ metadata การปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังไว้ก่อน จากนั้น fallback ไปยัง marker การปฏิเสธที่รู้จักในผลลัพธ์สุดท้าย เช่น `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` และวลีปฏิเสธการผูก approval

`cron list` และประวัติการรันจะแสดงเหตุผลการปฏิเสธแทนการรายงานคำสั่งที่ถูกบล็อกเป็น `ok`

## การเก็บรักษา

การเก็บรักษาและการ prune ถูกควบคุมใน config:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) prune เซสชันการรันแบบแยกที่เสร็จสมบูรณ์
- `cron.runLog.maxBytes` และ `cron.runLog.keepLines` prune `~/.openclaw/cron/runs/<jobId>.jsonl`

## การย้ายงานเก่า

<Note>
หากคุณมีงาน Cron จากก่อนรูปแบบการส่งมอบและ store ปัจจุบัน ให้รัน `openclaw doctor --fix` Doctor จะ normalize ฟิลด์ Cron แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery ระดับบนรวมถึง legacy `threadId`, alias การส่งมอบ `provider` ใน payload) และ migrate งาน Webhook fallback แบบง่ายที่มี `notify: true` ไปเป็นการส่งมอบ Webhook อย่างชัดเจนเมื่อมีการกำหนดค่า `cron.webhook`
</Note>

## การแก้ไขทั่วไป

อัปเดตการตั้งค่าการส่งมอบโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดการส่งมอบสำหรับงานแบบแยก:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้บริบท bootstrap แบบเบาสำหรับงานแบบแยก:

```bash
openclaw cron edit <job-id> --light-context
```

ประกาศไปยังช่องทางที่ระบุ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

ประกาศไปยังหัวข้อฟอรัม Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

สร้างงานแบบแยกพร้อมบริบท bootstrap แบบเบา:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ใช้กับงาน Cron แบบ agent-turn ที่แยกเท่านั้น สำหรับการรัน Cron โหมดเบาจะคงบริบท bootstrap ให้ว่างเปล่าแทนการ inject ชุด bootstrap ทั้งหมดของ workspace

## คำสั่งผู้ดูแลทั่วไป

การรันด้วยตนเองและการตรวจสอบ:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` แสดงงานทั้งหมดที่ตรงกันโดยค่าเริ่มต้น ส่ง `--agent <id>` เพื่อแสดงเฉพาะงานที่ id ของ agent แบบ normalized ที่มีผลตรงกัน; งานที่ไม่มี id ของ agent ที่เก็บไว้นับเป็น agent เริ่มต้นที่กำหนดค่าไว้

`cron list --json` และ `cron show <job-id> --json` รวมฟิลด์ `status` ระดับบนในแต่ละงาน ซึ่งคำนวณจาก `enabled`, `state.runningAtMs` และ `state.lastRunStatus` ค่า: `disabled`, `running`, `ok`, `error`, `skipped` หรือ `idle` สิ่งนี้สะท้อนคอลัมน์สถานะที่มนุษย์อ่านได้ เพื่อให้เครื่องมือภายนอกอ่านสถานะงานได้โดยไม่ต้อง derive ใหม่

รายการ `cron runs` รวม diagnostics การส่งมอบพร้อมเป้าหมาย Cron ที่ตั้งใจไว้ เป้าหมายที่ resolve แล้ว การส่งผ่าน message-tool การใช้ fallback และสถานะการส่งมอบ

การกำหนดเป้าหมาย agent และเซสชันใหม่:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` เตือนเมื่อ `--agent` ถูกละไว้ในงานแบบ agent-turn และ fallback ไปยัง agent เริ่มต้น (`main`) ส่ง `--agent <id>` ณ เวลาสร้างเพื่อปักหมุด agent ที่ระบุ

การปรับแต่งการส่งมอบ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [งานที่กำหนดเวลาไว้](/th/automation/cron-jobs)
