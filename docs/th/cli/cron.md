---
read_when:
    - คุณต้องการงานตามกำหนดเวลาและการปลุกให้ทำงาน
    - คุณกำลังดีบักการทำงานของ Cron และบันทึก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw cron` (กำหนดเวลาและเรียกใช้งานเบื้องหลัง)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:42:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

จัดการงาน Cron สำหรับตัวจัดตารางเวลาของ Gateway.

<Tip>
เรียกใช้ `openclaw cron --help` เพื่อดูพื้นผิวคำสั่งทั้งหมด ดู [งาน Cron](/th/automation/cron-jobs) สำหรับคู่มือเชิงแนวคิด
</Tip>

## สร้างงานอย่างรวดเร็ว

`openclaw cron create` เป็นนามแฝงของ `openclaw cron add` สำหรับงานใหม่ ให้วางกำหนดการก่อนและพรอมป์เป็นลำดับที่สอง:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

ใช้ `--webhook <url>` เมื่องานควร POST เพย์โหลดที่เสร็จแล้วแทนการส่งไปยังเป้าหมายแชต:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

ใช้ `--command` สำหรับงานแบบเชลล์ที่กำหนดผลลัพธ์ได้แน่นอน ซึ่งควรรันภายใน OpenClaw cron โดยไม่เริ่มการรัน agent/model แบบแยกส่วน:

<Note>
งาน Cron แบบคำสั่งคือการทำงานอัตโนมัติของ Gateway ที่ผู้ดูแลระบบเป็นผู้เขียน การสร้าง แก้ไข
ลบ หรือรันด้วยตนเองต้องใช้ `operator.admin`; การรันตามกำหนดการ
ภายหลังจะทำงานในโปรเซส Gateway ไม่ใช่ในฐานะการเรียกเครื่องมือ `tools.exec` ของ agent
`tools.exec.*` และการอนุมัติ exec ยังคงควบคุมเครื่องมือ exec ที่โมเดลมองเห็น
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` จัดเก็บ `argv: ["sh", "-lc", <shell>]` ใช้ `--command-argv '["node","scripts/report.mjs"]'` สำหรับการดำเนินการ argv แบบตรงตัว งานคำสั่งจะจับ stdout/stderr บันทึกประวัติ cron ปกติ และกำหนดเส้นทางเอาต์พุตผ่านโหมดการส่งเดียวกับงานแบบแยกส่วน ได้แก่ `announce`, `webhook` หรือ `none` คำสั่งที่พิมพ์เฉพาะ `NO_REPLY` จะถูกระงับ

## เซสชัน

`--session` รับค่า `main`, `isolated`, `current` หรือ `session:<id>`

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` ผูกกับเซสชันหลักของ agent
    - `isolated` สร้างทรานสคริปต์และรหัสเซสชันใหม่สำหรับแต่ละการรัน
    - `current` ผูกกับเซสชันที่ใช้งานอยู่ ณ เวลาสร้าง
    - `session:<id>` ปักหมุดกับคีย์เซสชันถาวรแบบชัดเจน

  </Accordion>
  <Accordion title="Isolated session semantics">
    การรันแบบแยกส่วนจะรีเซ็ตบริบทการสนทนาแวดล้อม การกำหนดเส้นทาง channel และ group, นโยบาย send/queue, การยกระดับ, ต้นทาง และการผูก runtime ของ ACP จะถูกรีเซ็ตสำหรับการรันใหม่ การตั้งค่าที่ปลอดภัยและการ override โมเดลหรือ auth ที่ผู้ใช้เลือกอย่างชัดเจนสามารถส่งต่อข้ามการรันได้
  </Accordion>
</AccordionGroup>

## การส่ง

`openclaw cron list` และ `openclaw cron show <job-id>` แสดงตัวอย่างเส้นทางการส่งที่แก้ไขแล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่าเส้นทางถูกแก้ไขจากเซสชันหลักหรือเซสชันปัจจุบัน หรือจะล้มเหลวแบบปิด

เป้าหมายที่มีคำนำหน้าผู้ให้บริการสามารถทำให้ channel สำหรับประกาศที่ยังไม่แก้ไขมีความชัดเจนได้ ตัวอย่างเช่น `to: "telegram:123"` เลือก Telegram เมื่อ `delivery.channel` ถูกละไว้หรือเป็น `last` เฉพาะคำนำหน้าที่ Plugin ที่โหลดแล้วประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุชัดเจน คำนำหน้าต้องตรงกับ channel นั้น; `channel: "whatsapp"` พร้อมกับ `to: "telegram:123"` จะถูกปฏิเสธ คำนำหน้าบริการ เช่น `imessage:` และ `sms:` ยังคงเป็นไวยากรณ์เป้าหมายที่ channel เป็นเจ้าของ

<Note>
งาน `cron add` แบบแยกส่วนมีค่าเริ่มต้นเป็นการส่งแบบ `--announce` ใช้ `--no-deliver` เพื่อเก็บเอาต์พุตไว้ภายใน `--deliver` ยังคงเป็นนามแฝงที่เลิกสนับสนุนแล้วของ `--announce`
</Note>

### ความเป็นเจ้าของการส่ง

การส่งแชตของ Cron แบบแยกส่วนถูกใช้ร่วมกันระหว่าง agent และ runner:

- agent สามารถส่งโดยตรงโดยใช้เครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
- `announce` ส่งคำตอบสุดท้ายแบบ fallback เฉพาะเมื่อ agent ไม่ได้ส่งโดยตรงไปยังเป้าหมายที่แก้ไขแล้ว
- `webhook` โพสต์เพย์โหลดที่เสร็จแล้วไปยัง URL
- `none` ปิดใช้งานการส่งแบบ fallback ของ runner

ใช้ `cron add|create --webhook <url>` หรือ `cron edit <job-id> --webhook <url>` เพื่อตั้งค่าการส่ง Webhook อย่าใช้ `--webhook` ร่วมกับแฟล็กการส่งแชต เช่น `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` หรือ `--account`

`cron edit <job-id>` สามารถล้างฟิลด์การกำหนดเส้นทางการส่งแต่ละรายการด้วย `--clear-channel`, `--clear-to`, `--clear-thread-id` และ `--clear-account` (แต่ละรายการจะถูกปฏิเสธเมื่อใช้ร่วมกับแฟล็กตั้งค่าที่ตรงกัน) ต่างจาก `--no-deliver` ซึ่งปิดเฉพาะการส่งแบบ fallback ของ runner ตัวเลือกเหล่านี้จะลบฟิลด์ที่จัดเก็บไว้ เพื่อให้งานแก้ไขส่วนนั้นของเส้นทางจากค่าเริ่มต้นอีกครั้ง

`--announce` คือการส่งแบบ fallback ของ runner สำหรับคำตอบสุดท้าย `--no-deliver` ปิดใช้งาน fallback นั้น แต่ไม่ได้ลบเครื่องมือ `message` ของ agent เมื่อมีเส้นทางแชตพร้อมใช้งาน

ตัวเตือนที่สร้างจากแชตที่ใช้งานอยู่จะเก็บเป้าหมายการส่งแชตสดไว้สำหรับการส่งประกาศแบบ fallback คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; อย่าใช้เป็นแหล่งความจริงสำหรับ ID ผู้ให้บริการที่แยกแยะตัวพิมพ์เล็กใหญ่ เช่น ID ห้อง Matrix

### การส่งเมื่อเกิดความล้มเหลว

การแจ้งเตือนความล้มเหลวจะถูกแก้ไขตามลำดับนี้:

1. `delivery.failureDestination` บนงาน
2. `cron.failureDestination` ส่วนกลาง
3. เป้าหมายประกาศหลักของงาน (เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวอย่างชัดเจน)

<Note>
งานเซสชันหลักอาจใช้ `delivery.failureDestination` ได้เฉพาะเมื่อโหมดการส่งหลักเป็น `webhook` งานแบบแยกส่วนรับค่านี้ได้ในทุกโหมด
</Note>

หมายเหตุ: การรัน Cron แบบแยกส่วนถือว่าความล้มเหลวของ agent ระดับการรันเป็นข้อผิดพลาดของงาน แม้เมื่อ
ไม่มีเพย์โหลดคำตอบถูกสร้างขึ้น ดังนั้นความล้มเหลวของโมเดล/ผู้ให้บริการยังคงเพิ่มตัวนับข้อผิดพลาด
และทริกเกอร์การแจ้งเตือนความล้มเหลว

งาน Cron แบบคำสั่งจะไม่เริ่มเทิร์น agent แบบแยกส่วน รหัสออกเป็นศูนย์จะบันทึกเป็น
`ok`; การออกที่ไม่ใช่ศูนย์, signal, timeout หรือ no-output timeout จะบันทึกเป็น `error` และ
สามารถทริกเกอร์เส้นทางการแจ้งเตือนความล้มเหลวเดียวกันได้

หากการรันแบบแยกส่วนหมดเวลาก่อนคำขอโมเดลแรก `openclaw cron show`
และ `openclaw cron runs` จะรวมข้อผิดพลาดเฉพาะเฟส เช่น
`setup timed out before runner start` หรือ
`stalled before first model call (last phase: context-engine)`
สำหรับผู้ให้บริการที่อิง CLI ตัวเฝ้าระวังก่อนโมเดลจะยังคงทำงานจนกว่าเทิร์น CLI ภายนอก
จะเริ่ม ดังนั้นการค้นหาเซสชัน, hook, auth, prompt และการค้างของการตั้งค่า CLI
จะถูกรายงานเป็นความล้มเหลว Cron ก่อนโมเดล

## การจัดตารางเวลา

### งานครั้งเดียว

`--at <datetime>` จัดตารางเวลาการรันครั้งเดียว วันที่และเวลาที่ไม่มี offset จะถือเป็น UTC เว้นแต่คุณจะส่ง `--tz <iana>` ด้วย ซึ่งจะตีความเวลาตามนาฬิกาในโซนเวลาที่กำหนด

<Note>
งานครั้งเดียวจะถูกลบหลังสำเร็จโดยค่าเริ่มต้น ใช้ `--keep-after-run` เพื่อเก็บไว้
</Note>

### งานที่เกิดซ้ำ

งานที่เกิดซ้ำใช้ exponential retry backoff หลังข้อผิดพลาดต่อเนื่อง: 30s, 1m, 5m, 15m, 60m กำหนดการจะกลับสู่ปกติหลังการรันที่สำเร็จครั้งถัดไป

การรันที่ถูกข้ามจะถูกติดตามแยกจากข้อผิดพลาดในการดำเนินการ การรันเหล่านี้ไม่ส่งผลต่อ retry backoff แต่ `openclaw cron edit <job-id> --failure-alert-include-skipped` สามารถเลือกให้การแจ้งเตือนความล้มเหลวรวมการแจ้งเตือนการรันที่ถูกข้ามซ้ำได้

สำหรับงานแบบแยกส่วนที่กำหนดเป้าหมายไปยังผู้ให้บริการโมเดลที่กำหนดค่าไว้ภายในเครื่อง Cron จะรัน provider preflight แบบเบาก่อนเริ่มเทิร์น agent ผู้ให้บริการ `api: "ollama"` แบบ Loopback, เครือข่ายส่วนตัว และ `.local` จะถูก probe ที่ `/api/tags`; ผู้ให้บริการที่เข้ากันได้กับ OpenAI ภายในเครื่อง เช่น vLLM, SGLang และ LM Studio จะถูก probe ที่ `/models` หาก endpoint เข้าถึงไม่ได้ การรันจะถูกบันทึกเป็น `skipped` และลองใหม่ตามกำหนดการภายหลัง; endpoint ที่ตายและตรงกันจะถูกแคชไว้ 5 นาที เพื่อหลีกเลี่ยงไม่ให้งานจำนวนมากกระหน่ำเซิร์ฟเวอร์ภายในเครื่องเดียวกัน

หมายเหตุ: งาน Cron, สถานะ runtime ที่ค้างอยู่ และประวัติการรันอยู่ในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกัน ไฟล์เดิม `jobs.json`, `jobs-state.json` และ `runs/*.jsonl` จะถูกนำเข้าเพียงครั้งเดียวและเปลี่ยนชื่อพร้อมส่วนต่อท้าย `.migrated` หลังนำเข้า ให้แก้ไขกำหนดการด้วย `openclaw cron add|edit|remove` แทนการแก้ไขไฟล์ JSON

### การรันด้วยตนเอง

`openclaw cron run <job-id>` บังคับรันโดยค่าเริ่มต้นและส่งคืนทันทีเมื่อการรันด้วยตนเองถูกเข้าคิว การตอบกลับที่สำเร็จรวม `{ ok: true, enqueued: true, runId }` ใช้ `runId` ที่ส่งคืนเพื่อตรวจสอบผลลัพธ์ภายหลัง:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

เพิ่ม `--wait` เมื่อสคริปต์ควรบล็อกจนกว่าการรันที่เข้าคิวนั้นโดยตรงจะบันทึกสถานะ terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

เมื่อใช้ `--wait` CLI ยังคงเรียก `cron.run` ก่อน จากนั้น poll `cron.runs` สำหรับ `runId` ที่ส่งคืน คำสั่งออกด้วย `0` เฉพาะเมื่อการรันจบด้วยสถานะ `ok` คำสั่งออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อการรันจบด้วย `error` หรือ `skipped`, เมื่อการตอบกลับจาก Gateway ไม่มี `runId` หรือเมื่อ `--wait-timeout` หมดเวลา `--poll-interval` ต้องมากกว่าศูนย์

<Note>
ใช้ `--due` เมื่อคุณต้องการให้คำสั่งด้วยตนเองรันเฉพาะเมื่อถึงกำหนดของงานในขณะนั้น หาก `--due --wait` ไม่เข้าคิวการรัน คำสั่งจะส่งคืนการตอบกลับปกติที่ไม่ใช่การรันแทนการ poll
</Note>

## โมเดล

`cron add|edit --model <ref>` เลือกโมเดลที่อนุญาตสำหรับงาน `cron add|edit --fallbacks <list>` ตั้งค่าโมเดล fallback รายงาน เช่น `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; ส่ง `--fallbacks ""` สำหรับการรันแบบเข้มงวดที่ไม่มี fallback `cron edit <job-id> --clear-fallbacks` ลบ override fallback รายงาน `cron edit <job-id> --clear-model` ลบ override โมเดลรายงานเพื่อให้งานทำตามลำดับความสำคัญการเลือกโมเดล Cron ปกติ (override ของเซสชัน Cron ที่จัดเก็บไว้หากมี มิฉะนั้นเป็นโมเดลของ agent/default); ไม่สามารถใช้ร่วมกับ `--model` ได้ `cron add|edit --thinking <level>` ตั้งค่า override thinking รายงาน; `cron edit <job-id> --clear-thinking` ลบค่านี้เพื่อให้งานทำตามลำดับความสำคัญ thinking ของ Cron ปกติ และไม่สามารถใช้ร่วมกับ `--thinking` ได้

<Warning>
หากโมเดลไม่ได้รับอนุญาตหรือไม่สามารถแก้ไขได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบความถูกต้องที่ชัดเจน แทนที่จะ fallback ไปยังการเลือกโมเดลของ agent หรือค่าเริ่มต้นของงาน
</Warning>

Cron `--model` เป็น **โมเดลหลักของงาน** ไม่ใช่ override `/model` ของเซสชันแชต ซึ่งหมายความว่า:

- fallback ของโมเดลที่กำหนดค่าไว้ยังคงมีผลเมื่อโมเดลงานที่เลือกไว้ล้มเหลว
- `fallbacks` ในเพย์โหลดรายงานจะแทนที่รายการ fallback ที่กำหนดค่าไว้เมื่อมีอยู่
- รายการ fallback รายงานที่ว่างเปล่า (`--fallbacks ""` หรือ `fallbacks: []` ในเพย์โหลด/API ของงาน) ทำให้การรัน Cron เป็นแบบเข้มงวด
- เมื่องานมี `--model` แต่ไม่ได้กำหนดค่ารายการ fallback OpenClaw จะส่ง override fallback ว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของ agent ถูกต่อท้ายเป็นเป้าหมายลองใหม่ที่ซ่อนอยู่
- การตรวจสอบ local-provider preflight จะไล่ผ่าน fallback ที่กำหนดค่าไว้ก่อนทำเครื่องหมายการรัน Cron เป็น `skipped`

`openclaw doctor` รายงานงานที่มี `payload.model` ตั้งค่าไว้แล้ว รวมถึงจำนวน namespace ของผู้ให้บริการและรายการที่ไม่ตรงกับ `agents.defaults.model` ใช้การตรวจสอบนั้นเมื่อพฤติกรรม auth, ผู้ให้บริการ หรือการเรียกเก็บเงินดูต่างกันระหว่างแชตสดและงานตามกำหนดเวลา

### ลำดับความสำคัญของโมเดล Cron แบบแยกส่วน

Cron แบบแยกส่วนแก้ไขโมเดลที่ใช้งานอยู่ตามลำดับนี้:

1. override จาก Gmail-hook
2. `--model` รายงาน
3. override โมเดลของเซสชัน Cron ที่จัดเก็บไว้ (เมื่อผู้ใช้เลือกไว้)
4. การเลือกโมเดลของ agent หรือค่าเริ่มต้น

### โหมดเร็ว

โหมดเร็วของ Cron แบบแยกส่วนทำตามการเลือกโมเดลสดที่แก้ไขแล้ว การกำหนดค่าโมเดล `params.fastMode` มีผลโดยค่าเริ่มต้น แต่ override `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงชนะ config เมื่อโหมดที่แก้ไขแล้วเป็น `auto` cutoff จะใช้ค่า `params.fastAutoOnSeconds` ของโมเดลที่เลือก โดยมีค่าเริ่มต้นเป็น 60 วินาที

### การลองใหม่เมื่อสลับโมเดลสด

หากการรันแบบแยกส่วนโยน `LiveSessionModelSwitchError` Cron จะคงผู้ให้บริการและโมเดลที่สลับแล้ว (และ override โปรไฟล์ auth ที่สลับแล้วเมื่อมี) สำหรับการรันที่ใช้งานอยู่ก่อนลองใหม่ ลูปลองใหม่ภายนอกถูกจำกัดไว้ที่การลองใหม่จากการสลับสองครั้งหลังความพยายามแรก จากนั้นจะยกเลิกแทนการวนซ้ำตลอดไป

## เอาต์พุตการรันและการปฏิเสธ

### การระงับการตอบรับที่เก่า

เทิร์น Cron แบบแยกส่วนจะระงับคำตอบที่เป็นเพียงการตอบรับที่เก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว และไม่มีการรัน subagent ลูกหลานที่รับผิดชอบต่อคำตอบสุดท้าย Cron จะพรอมป์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่ง

### การระงับโทเคนแบบเงียบ

หากการรัน Cron แบบแยกเดี่ยวส่งคืนเฉพาะโทเค็นเงียบ (`NO_REPLY` หรือ `no_reply`) Cron จะระงับทั้งการส่งออกโดยตรงและเส้นทางสรุปที่เข้าคิวไว้ซึ่งเป็น fallback ดังนั้นจึงไม่มีอะไรถูกโพสต์กลับไปยังแชต

### การปฏิเสธแบบมีโครงสร้าง

การรัน Cron แบบแยกเดี่ยวใช้เมทาดาทาการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่เป็นสัญญาณการปฏิเสธที่ถือเป็นแหล่งอ้างอิงหลัก และยังเคารพตัวครอบ `UNAVAILABLE` ของโฮสต์ Node เมื่อข้อความข้อผิดพลาดแบบมีโครงสร้างที่ซ้อนอยู่เริ่มต้นด้วย `SYSTEM_RUN_DENIED` หรือ `INVALID_REQUEST`

Cron จะไม่จัดประเภทข้อความเอาต์พุตสุดท้ายหรือวลีปฏิเสธที่ดูเหมือนการอนุมัติว่าเป็นการปฏิเสธ เว้นแต่ว่าการรันที่ฝังอยู่จะให้เมทาดาทาการปฏิเสธแบบมีโครงสร้างด้วย ดังนั้นข้อความผู้ช่วยทั่วไปจึงไม่ถูกถือว่าเป็นคำสั่งที่ถูกบล็อก

`cron list` และประวัติการรันจะแสดงเหตุผลการปฏิเสธแทนการรายงานคำสั่งที่ถูกบล็อกเป็น `ok`

## การเก็บรักษา

การเก็บรักษาและการตัดทอนถูกควบคุมในคอนฟิก:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ตัดทอนเซสชันการรันแบบแยกเดี่ยวที่เสร็จสิ้นแล้ว
- `cron.runLog.keepLines` ตัดทอนแถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน `cron.runLog.maxBytes` ยังคงยอมรับได้เพื่อความเข้ากันได้กับบันทึกการรันแบบอิงไฟล์รุ่นเก่า

## การย้ายงานรุ่นเก่า

<Note>
หากคุณมีงาน Cron จากก่อนรูปแบบการส่งและการจัดเก็บปัจจุบัน ให้รัน `openclaw doctor --fix` Doctor จะทำให้ฟิลด์ Cron แบบเดิมเป็นปกติ (`jobId`, `schedule.cron`, ฟิลด์การส่งระดับบนสุดรวมถึง `threadId` เดิม, อะเลียสการส่ง `provider` ในเพย์โหลด) และย้ายงาน Webhook fallback ที่เป็น `notify: true` จาก `cron.webhook` ไปเป็นการส่ง Webhook แบบชัดเจน งานที่ประกาศไปยังแชตอยู่แล้วจะคงการส่งนั้นไว้และได้รับปลายทาง Webhook สำหรับการเสร็จสิ้น เมื่อไม่ได้ตั้งค่า `cron.webhook` เครื่องหมาย `notify` ระดับบนสุดที่ไม่ทำงานจะถูกลบออกสำหรับงานที่ไม่มีเป้าหมายการย้าย (การส่งเดิมจะถูกเก็บไว้โดยไม่เปลี่ยนแปลง) ดังนั้น `doctor --fix` จะไม่เตือนซ้ำเกี่ยวกับงานเหล่านั้นอีก
</Note>

## การแก้ไขทั่วไป

อัปเดตการตั้งค่าการส่งโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดใช้งานการส่งสำหรับงานแบบแยกเดี่ยว:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้งานบริบทบูตสแตรปแบบเบาสำหรับงานแบบแยกเดี่ยว:

```bash
openclaw cron edit <job-id> --light-context
```

ประกาศไปยังช่องทางเฉพาะ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

ประกาศไปยังหัวข้อฟอรัม Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

สร้างงานแบบแยกเดี่ยวพร้อมบริบทบูตสแตรปแบบเบา:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` ใช้กับงาน agent-turn แบบแยกเดี่ยวเท่านั้น สำหรับการรัน Cron โหมดแบบเบาจะปล่อยให้บริบทบูตสแตรปว่างไว้แทนการฉีดชุดบูตสแตรปเวิร์กสเปซแบบเต็ม

สร้างงานคำสั่งพร้อม argv, cwd, env, stdin และขีดจำกัดเอาต์พุตแบบตรงตัว:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## คำสั่งผู้ดูแลทั่วไป

การรันด้วยตนเองและการตรวจสอบ:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` แสดงงานทั้งหมดที่ตรงกันตามค่าเริ่มต้น ส่ง `--agent <id>` เพื่อแสดงเฉพาะงานที่ id เอเจนต์แบบทำให้เป็นปกติและมีผลตรงกัน งานที่ไม่มี id เอเจนต์ที่จัดเก็บไว้จะนับเป็นเอเจนต์เริ่มต้นที่คอนฟิกไว้

`openclaw cron get <job-id>` ส่งคืน JSON งานที่จัดเก็บไว้โดยตรง ใช้ `cron show <job-id>` เมื่อคุณต้องการมุมมองที่มนุษย์อ่านได้พร้อมตัวอย่างเส้นทางการส่ง

`cron list --json` และ `cron show <job-id> --json` มีฟิลด์ `status` ระดับบนสุดในแต่ละงาน ซึ่งคำนวณจาก `enabled`, `state.runningAtMs` และ `state.lastRunStatus` ค่าได้แก่ `disabled`, `running`, `ok`, `error`, `skipped` หรือ `idle` สิ่งนี้สะท้อนคอลัมน์สถานะที่มนุษย์อ่านได้ เพื่อให้เครื่องมือภายนอกอ่านสถานะงานได้โดยไม่ต้องอนุมานใหม่

รายการ `cron runs` มีการวินิจฉัยการส่งพร้อมเป้าหมาย Cron ที่ตั้งใจไว้ เป้าหมายที่แก้ไขได้ การส่งผ่านเครื่องมือข้อความ การใช้ fallback และสถานะที่ส่งสำเร็จ

การกำหนดเป้าหมายเอเจนต์และเซสชันใหม่:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` เตือนเมื่อไม่ระบุ `--agent` ในงาน agent-turn และ fallback ไปยังเอเจนต์เริ่มต้น (`main`) ส่ง `--agent <id>` ขณะสร้างเพื่อตรึงเอเจนต์เฉพาะ

การปรับแต่งการส่ง:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [งานที่ตั้งเวลาไว้](/th/automation/cron-jobs)
