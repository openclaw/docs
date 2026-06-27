---
read_when:
    - คุณต้องการงานตามกำหนดเวลาและการปลุก
    - คุณกำลังดีบักการเรียกใช้งาน Cron และบันทึก
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw cron` (ตั้งเวลาและเรียกใช้งานเบื้องหลัง)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:20:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

จัดการงาน cron สำหรับตัวจัดกำหนดการ Gateway

<Tip>
เรียกใช้ `openclaw cron --help` เพื่อดูพื้นผิวคำสั่งทั้งหมด ดู [งาน Cron](/th/automation/cron-jobs) สำหรับคู่มือแนวคิด
</Tip>

## สร้างงานอย่างรวดเร็ว

`openclaw cron create` เป็น alias ของ `openclaw cron add` สำหรับงานใหม่ ให้ใส่กำหนดการก่อนและพรอมป์เป็นลำดับที่สอง:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

ใช้ `--webhook <url>` เมื่องานควร POST payload ที่เสร็จแล้วแทนการส่งไปยังเป้าหมายแชท:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

ใช้ `--command` สำหรับงานแบบ shell-style ที่กำหนดผลลัพธ์ได้แน่นอน ซึ่งควรรันภายใน OpenClaw cron โดยไม่เริ่มการรัน agent/model แบบแยก:

<Note>
งาน cron แบบคำสั่งคือการทำงานอัตโนมัติของ Gateway ที่ผู้ดูแลเขียนขึ้น การสร้าง แก้ไข
ลบ หรือรันด้วยตนเองต้องใช้ `operator.admin`; การรันตามกำหนดการ
ภายหลังจะดำเนินการในกระบวนการ Gateway ไม่ใช่เป็นการเรียกเครื่องมือ `tools.exec` ของ agent
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

`--command <shell>` จัดเก็บ `argv: ["sh", "-lc", <shell>]` ใช้ `--command-argv '["node","scripts/report.mjs"]'` สำหรับการดำเนินการ argv แบบตรงตัว งานคำสั่งจะบันทึก stdout/stderr บันทึกประวัติ cron ปกติ และกำหนดเส้นทางเอาต์พุตผ่านโหมดการส่งเดียวกันคือ `announce`, `webhook` หรือ `none` เหมือนงานแบบแยก คำสั่งที่พิมพ์เฉพาะ `NO_REPLY` จะถูกระงับ

## เซสชัน

`--session` รับ `main`, `isolated`, `current` หรือ `session:<id>`

<AccordionGroup>
  <Accordion title="คีย์เซสชัน">
    - `main` ผูกกับเซสชันหลักของ agent
    - `isolated` สร้าง transcript และ id เซสชันใหม่สำหรับแต่ละการรัน
    - `current` ผูกกับเซสชันที่ใช้งานอยู่ ณ เวลาสร้าง
    - `session:<id>` ปักหมุดกับคีย์เซสชันถาวรที่ระบุชัดเจน

  </Accordion>
  <Accordion title="ความหมายของเซสชันแบบแยก">
    การรันแบบแยกจะรีเซ็ตบริบทการสนทนาแวดล้อม การกำหนดเส้นทางช่องทางและกลุ่ม นโยบายส่ง/คิว การยกระดับ แหล่งที่มา และการผูก runtime ของ ACP จะถูกรีเซ็ตสำหรับการรันใหม่ ค่ากำหนดที่ปลอดภัยและการ override โมเดลหรือ auth ที่ผู้ใช้เลือกไว้อย่างชัดเจนสามารถส่งต่อระหว่างการรันได้
  </Accordion>
</AccordionGroup>

## การส่ง

`openclaw cron list` และ `openclaw cron show <job-id>` แสดงตัวอย่างเส้นทางการส่งที่ resolve แล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่าเส้นทาง resolve จากเซสชันหลักหรือเซสชันปัจจุบัน หรือจะ fail closed

เป้าหมายที่มีคำนำหน้าผู้ให้บริการสามารถแยกแยะช่องทาง announce ที่ยัง resolve ไม่ได้ ตัวอย่างเช่น `to: "telegram:123"` เลือก Telegram เมื่อ `delivery.channel` ถูกละไว้หรือเป็น `last` เฉพาะคำนำหน้าที่ Plugin ที่โหลดแล้วประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุชัดเจน คำนำหน้าต้องตรงกับช่องทางนั้น; `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ คำนำหน้าบริการ เช่น `imessage:` และ `sms:` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ

<Note>
งาน `cron add` แบบแยกมีค่าเริ่มต้นเป็นการส่งแบบ `--announce` ใช้ `--no-deliver` เพื่อเก็บเอาต์พุตไว้ภายใน `--deliver` ยังคงอยู่ในฐานะ alias ที่เลิกแนะนำแล้วสำหรับ `--announce`
</Note>

### ความเป็นเจ้าของการส่ง

การส่งแชทของ cron แบบแยกถูกแชร์ระหว่าง agent และ runner:

- agent สามารถส่งโดยตรงด้วยเครื่องมือ `message` เมื่อมีเส้นทางแชทพร้อมใช้งาน
- `announce` จะส่ง fallback เป็นคำตอบสุดท้ายเฉพาะเมื่อ agent ไม่ได้ส่งโดยตรงไปยังเป้าหมายที่ resolve แล้ว
- `webhook` โพสต์ payload ที่เสร็จแล้วไปยัง URL
- `none` ปิดการส่ง fallback ของ runner

ใช้ `cron add|create --webhook <url>` หรือ `cron edit <job-id> --webhook <url>` เพื่อตั้งค่าการส่ง Webhook อย่าใช้ `--webhook` ร่วมกับแฟล็กการส่งแชท เช่น `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` หรือ `--account`

`cron edit <job-id>` สามารถยกเลิกการตั้งค่าฟิลด์การกำหนดเส้นทางการส่งแต่ละรายการด้วย `--clear-channel`, `--clear-to`, `--clear-thread-id` และ `--clear-account` (แต่ละรายการจะถูกปฏิเสธเมื่อใช้ร่วมกับแฟล็กตั้งค่าที่ตรงกัน) ต่างจาก `--no-deliver` ซึ่งปิดเฉพาะการส่ง fallback ของ runner ตัวเลือกเหล่านี้จะลบฟิลด์ที่จัดเก็บไว้ เพื่อให้งาน resolve ส่วนนั้นของเส้นทางจากค่าเริ่มต้นอีกครั้ง

`--announce` คือการส่ง fallback ของ runner สำหรับคำตอบสุดท้าย `--no-deliver` ปิด fallback นั้น แต่ไม่ลบเครื่องมือ `message` ของ agent เมื่อมีเส้นทางแชทพร้อมใช้งาน

การเตือนความจำที่สร้างจากแชทที่ใช้งานอยู่จะรักษาเป้าหมายการส่งแชทสดไว้สำหรับการส่ง announce แบบ fallback คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก อย่าใช้เป็นแหล่งความจริงสำหรับ ID ผู้ให้บริการที่ต้องแยกตัวพิมพ์เล็กใหญ่ เช่น ID ห้อง Matrix

### การส่งเมื่อเกิดความล้มเหลว

การแจ้งเตือนความล้มเหลว resolve ตามลำดับนี้:

1. `delivery.failureDestination` บนงาน
2. `cron.failureDestination` ส่วนกลาง
3. เป้าหมาย announce หลักของงาน (เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวไว้อย่างชัดเจน)

<Note>
งาน main-session ใช้ `delivery.failureDestination` ได้เฉพาะเมื่อโหมดการส่งหลักคือ `webhook` งานแบบแยกรับค่านี้ได้ในทุกโหมด
</Note>

หมายเหตุ: การรัน cron แบบแยกจะถือว่าความล้มเหลวของ agent ระดับการรันเป็นข้อผิดพลาดของงาน แม้เมื่อ
ไม่มีการสร้าง payload คำตอบ ดังนั้นความล้มเหลวของโมเดล/ผู้ให้บริการยังคงเพิ่มตัวนับข้อผิดพลาด
และเรียกการแจ้งเตือนความล้มเหลว

งาน cron แบบคำสั่งจะไม่เริ่ม turn ของ agent แบบแยก exit code ศูนย์จะบันทึก
`ok`; exit ที่ไม่ใช่ศูนย์, signal, timeout หรือ no-output timeout จะบันทึก `error` และ
สามารถเรียกเส้นทางการแจ้งเตือนความล้มเหลวเดียวกันได้

หากการรันแบบแยก timeout ก่อนคำขอโมเดลแรก `openclaw cron show`
และ `openclaw cron runs` จะรวมข้อผิดพลาดเฉพาะ phase เช่น
`setup timed out before runner start` หรือ
`stalled before first model call (last phase: context-engine)`
สำหรับผู้ให้บริการที่หนุนด้วย CLI ตัว pre-model watchdog จะยังทำงานจนกว่า turn ของ CLI ภายนอก
จะเริ่มขึ้น ดังนั้นการค้างของการค้นหาเซสชัน hook, auth, prompt และการตั้งค่า CLI
จะถูกรายงานเป็นความล้มเหลว cron ก่อนโมเดล

## การจัดกำหนดการ

### งานครั้งเดียว

`--at <datetime>` จัดกำหนดการการรันครั้งเดียว datetime ที่ไม่มี offset จะถูกถือเป็น UTC เว้นแต่คุณจะส่ง `--tz <iana>` ด้วย ซึ่งจะตีความเวลา wall-clock ใน timezone ที่กำหนด

<Note>
งานครั้งเดียวจะลบตัวเองหลังสำเร็จตามค่าเริ่มต้น ใช้ `--keep-after-run` เพื่อเก็บไว้
</Note>

### งานที่เกิดซ้ำ

งานที่เกิดซ้ำใช้ exponential retry backoff หลังเกิดข้อผิดพลาดต่อเนื่อง: 30s, 1m, 5m, 15m, 60m กำหนดการจะกลับสู่ปกติหลังการรันที่สำเร็จครั้งถัดไป

การรันที่ถูกข้ามจะถูกติดตามแยกจากข้อผิดพลาดในการดำเนินการ การรันเหล่านี้ไม่ส่งผลต่อ retry backoff แต่ `openclaw cron edit <job-id> --failure-alert-include-skipped` สามารถเลือกให้การแจ้งเตือนความล้มเหลวรวมการแจ้งซ้ำสำหรับการรันที่ถูกข้ามได้

สำหรับงานแบบแยกที่กำหนดเป้าหมายไปยังผู้ให้บริการโมเดลในเครื่องที่ตั้งค่าไว้ cron จะรัน provider preflight แบบเบาก่อนเริ่ม turn ของ agent ผู้ให้บริการ `api: "ollama"` แบบ Loopback, private-network และ `.local` จะถูก probe ที่ `/api/tags`; ผู้ให้บริการที่เข้ากันได้กับ OpenAI ในเครื่อง เช่น vLLM, SGLang และ LM Studio จะถูก probe ที่ `/models` หาก endpoint เข้าถึงไม่ได้ การรันจะถูกบันทึกเป็น `skipped` และลองใหม่ในกำหนดการภายหลัง; endpoint ที่ตายและตรงกันจะถูก cache ไว้ 5 นาทีเพื่อหลีกเลี่ยงไม่ให้งานจำนวนมาก hammer เซิร์ฟเวอร์ในเครื่องเดียวกัน

หมายเหตุ: งาน cron, สถานะ runtime ที่รอดำเนินการ และประวัติการรันอยู่ในฐานข้อมูลสถานะ SQLite ที่แชร์ ไฟล์ legacy `jobs.json`, `jobs-state.json` และ `runs/*.jsonl` จะถูกนำเข้าเพียงครั้งเดียวและเปลี่ยนชื่อพร้อม suffix `.migrated` หลังนำเข้าแล้ว ให้แก้ไขกำหนดการด้วย `openclaw cron add|edit|remove` แทนการแก้ไขไฟล์ JSON

### การรันด้วยตนเอง

`openclaw cron run <job-id>` จะ force-run ตามค่าเริ่มต้นและคืนค่าทันทีเมื่อการรันด้วยตนเองถูกเข้าคิวแล้ว การตอบกลับที่สำเร็จจะรวม `{ ok: true, enqueued: true, runId }` ใช้ `runId` ที่คืนมาเพื่อตรวจสอบผลลัพธ์ภายหลัง:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

เพิ่ม `--wait` เมื่อสคริปต์ควรบล็อกจนกว่าการรันที่เข้าคิวนั้นโดยตรงจะบันทึกสถานะปลายทาง:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

เมื่อใช้ `--wait` CLI ยังคงเรียก `cron.run` ก่อน แล้วจึง poll `cron.runs` สำหรับ `runId` ที่คืนมา คำสั่งจะ exit `0` เฉพาะเมื่อการรันจบด้วยสถานะ `ok` เท่านั้น คำสั่งจะ exit ด้วยค่าที่ไม่ใช่ศูนย์เมื่อการรันจบด้วย `error` หรือ `skipped`, เมื่อการตอบกลับของ Gateway ไม่มี `runId` หรือเมื่อ `--wait-timeout` หมดเวลา `--poll-interval` ต้องมากกว่าศูนย์

<Note>
ใช้ `--due` เมื่อคุณต้องการให้คำสั่งแบบ manual รันเฉพาะเมื่องานถึงกำหนดอยู่ในขณะนั้น หาก `--due --wait` ไม่เข้าคิวการรัน คำสั่งจะคืนการตอบกลับแบบไม่รันตามปกติแทนการ poll
</Note>

## โมเดล

`cron add|edit --model <ref>` เลือกโมเดลที่อนุญาตสำหรับงาน `cron add|edit --fallbacks <list>` ตั้งค่าโมเดล fallback ต่อหนึ่งงาน เช่น `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; ส่ง `--fallbacks ""` สำหรับการรันแบบเข้มงวดที่ไม่มี fallback `cron edit <job-id> --clear-fallbacks` ลบ per-job fallback override `cron edit <job-id> --clear-model` ลบ per-job model override เพื่อให้งานทำตามลำดับความสำคัญการเลือกโมเดลของ cron ตามปกติ (cron-session override ที่จัดเก็บไว้ถ้ามี มิฉะนั้นใช้โมเดลของ agent/default); ไม่สามารถใช้ร่วมกับ `--model` ได้

<Warning>
หากโมเดลไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้การรันล้มเหลวด้วยข้อผิดพลาดการตรวจสอบที่ชัดเจนแทนการ fallback ไปยัง agent ของงานหรือการเลือกโมเดลเริ่มต้น
</Warning>

`--model` ของ Cron คือ **โมเดลหลักของงาน** ไม่ใช่ chat-session `/model` override ซึ่งหมายความว่า:

- fallback ของโมเดลที่ตั้งค่าไว้ยังคงมีผลเมื่อโมเดลงานที่เลือกไว้ล้มเหลว
- payload ต่อหนึ่งงาน `fallbacks` จะแทนที่รายการ fallback ที่ตั้งค่าไว้เมื่อมีอยู่
- รายการ fallback ต่อหนึ่งงานแบบว่าง (`--fallbacks ""` หรือ `fallbacks: []` ใน payload/API ของงาน) ทำให้การรัน cron เป็นแบบเข้มงวด
- เมื่องานมี `--model` แต่ไม่มีการตั้งค่ารายการ fallback OpenClaw จะส่ง fallback override แบบว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของ agent ถูกผนวกเป็นเป้าหมาย retry ที่ซ่อนอยู่
- การตรวจ preflight ของผู้ให้บริการในเครื่องจะเดินผ่าน fallback ที่ตั้งค่าไว้ก่อนทำเครื่องหมายการรัน cron เป็น `skipped`

`openclaw doctor` รายงานงานที่มี `payload.model` ตั้งค่าอยู่แล้ว รวมถึงจำนวน namespace ของผู้ให้บริการและความไม่ตรงกันกับ `agents.defaults.model` ใช้การตรวจนี้เมื่อพฤติกรรม auth, ผู้ให้บริการ หรือการเรียกเก็บเงินดูแตกต่างกันระหว่างแชทสดกับงานตามกำหนดการ

### ลำดับความสำคัญของโมเดล cron แบบแยก

cron แบบแยก resolve โมเดลที่ใช้งานอยู่ตามลำดับนี้:

1. Gmail-hook override
2. `--model` ต่อหนึ่งงาน
3. cron-session model override ที่จัดเก็บไว้ (เมื่อผู้ใช้เลือกไว้)
4. การเลือกโมเดลของ agent หรือค่าเริ่มต้น

### โหมดเร็ว

โหมดเร็วของ cron แบบแยกจะทำตามการเลือกโมเดลสดที่ resolve แล้ว การตั้งค่าโมเดล `params.fastMode` มีผลตามค่าเริ่มต้น แต่ session `fastMode` override ที่จัดเก็บไว้ยังคงชนะ config เมื่อโหมดที่ resolve ได้คือ `auto` ค่า cutoff จะใช้ค่า `params.fastAutoOnSeconds` ของโมเดลที่เลือก โดยมีค่าเริ่มต้นเป็น 60 วินาที

### การลองใหม่เมื่อสลับโมเดลสด

หากการรันแบบแยก throw `LiveSessionModelSwitchError` cron จะ persist ผู้ให้บริการและโมเดลที่สลับแล้ว (และ auth profile override ที่สลับแล้วเมื่อมี) สำหรับการรันที่ใช้งานอยู่ก่อนลองใหม่ ลูป retry ชั้นนอกถูกจำกัดไว้ที่การลองสลับใหม่สองครั้งหลังความพยายามเริ่มต้น จากนั้นจะ abort แทนการวนซ้ำตลอดไป

## เอาต์พุตการรันและการปฏิเสธ

### การระงับการรับทราบที่ค้างเก่า

turn ของ cron แบบแยกจะระงับคำตอบที่เป็นเพียงการรับทราบที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราวและไม่มีการรัน subagent ลูกหลานที่รับผิดชอบคำตอบสุดท้าย cron จะ re-prompt หนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนการส่ง

### การระงับ token แบบเงียบ

หากการรัน cron แบบแยกคืนค่าเฉพาะ silent token (`NO_REPLY` หรือ `no_reply`) cron จะระงับทั้งการส่งออกโดยตรงและเส้นทางสรุปที่เข้าคิวแบบ fallback ดังนั้นจะไม่มีสิ่งใดถูกโพสต์กลับไปยังแชท

### การปฏิเสธแบบมีโครงสร้าง

การรัน cron แบบแยกใช้เมทาดาทาการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่เป็นสัญญาณการปฏิเสธที่เชื่อถือได้ นอกจากนี้ยังเคารพตัวครอบ `UNAVAILABLE` ของ node-host เมื่อข้อความข้อผิดพลาดแบบมีโครงสร้างที่ซ้อนอยู่เริ่มต้นด้วย `SYSTEM_RUN_DENIED` หรือ `INVALID_REQUEST`

Cron จะไม่จัดประเภทข้อความร้อยแก้วในผลลัพธ์สุดท้ายหรือวลีปฏิเสธที่ดูเหมือนการขออนุมัติว่าเป็นการปฏิเสธ เว้นแต่การรันที่ฝังอยู่จะให้เมทาดาทาการปฏิเสธแบบมีโครงสร้างด้วย ดังนั้นข้อความผู้ช่วยทั่วไปจะไม่ถูกถือว่าเป็นคำสั่งที่ถูกบล็อก

`cron list` และประวัติการรันจะแสดงเหตุผลการปฏิเสธแทนการรายงานคำสั่งที่ถูกบล็อกเป็น `ok`

## การเก็บรักษา

การเก็บรักษาและการตัดทอนถูกควบคุมในคอนฟิก:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ตัดทอนเซสชันการรันแบบแยกที่เสร็จสมบูรณ์แล้ว
- `cron.runLog.keepLines` ตัดทอนแถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน `cron.runLog.maxBytes` ยังยอมรับอยู่เพื่อความเข้ากันได้กับบันทึกการรันแบบไฟล์ในเวอร์ชันเก่า

## การย้ายงานรุ่นเก่า

<Note>
หากคุณมีงาน cron จากก่อนรูปแบบการส่งมอบและการจัดเก็บปัจจุบัน ให้รัน `openclaw doctor --fix` Doctor จะทำให้ฟิลด์ cron แบบเก่าเป็นรูปแบบปกติ (`jobId`, `schedule.cron`, ฟิลด์การส่งมอบระดับบนสุดรวมถึง `threadId` รุ่นเก่า, นามแฝงการส่งมอบ `provider` ใน payload) และย้ายงาน Webhook สำรองที่มี `notify: true` จาก `cron.webhook` ไปเป็นการส่งมอบ Webhook แบบชัดเจน งานที่ประกาศไปยังแชทอยู่แล้วจะคงการส่งมอบนั้นไว้และได้รับปลายทาง Webhook เมื่อเสร็จสมบูรณ์ เมื่อไม่ได้ตั้งค่า `cron.webhook` เครื่องหมาย `notify` ระดับบนสุดที่ไม่ทำงานจะถูกลบออกสำหรับงานที่ไม่มีเป้าหมายการย้าย (การส่งมอบที่มีอยู่จะถูกคงไว้โดยไม่เปลี่ยนแปลง) ดังนั้น `doctor --fix` จะไม่เตือนซ้ำเกี่ยวกับงานเหล่านั้นอีก
</Note>

## การแก้ไขทั่วไป

อัปเดตการตั้งค่าการส่งมอบโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดใช้งานการส่งมอบสำหรับงานแบบแยก:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้บริบทบูตสแตรปแบบเบาสำหรับงานแบบแยก:

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

สร้างงานแบบแยกพร้อมบริบทบูตสแตรปแบบเบา:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` ใช้กับงาน agent-turn แบบแยกเท่านั้น สำหรับการรัน cron โหมดเบาจะทำให้บริบทบูตสแตรปว่างเปล่าแทนการฉีดชุดบูตสแตรปของเวิร์กสเปซแบบเต็ม

สร้างงานคำสั่งพร้อม argv, cwd, env, stdin และขีดจำกัดเอาต์พุตแบบตรงตามที่ระบุ:

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

`openclaw cron list` จะแสดงงานที่ตรงกันทั้งหมดโดยค่าเริ่มต้น ส่ง `--agent <id>` เพื่อแสดงเฉพาะงานที่มี id ของ agent ที่ปรับให้เป็นรูปแบบปกติแล้วและมีผลใช้งานตรงกัน งานที่ไม่มี id ของ agent ที่จัดเก็บไว้จะนับเป็น agent เริ่มต้นที่กำหนดค่าไว้

`openclaw cron get <job-id>` ส่งคืน JSON ของงานที่จัดเก็บไว้โดยตรง ใช้ `cron show <job-id>` เมื่อคุณต้องการมุมมองที่มนุษย์อ่านได้พร้อมตัวอย่างเส้นทางการส่งมอบ

`cron list --json` และ `cron show <job-id> --json` มีฟิลด์ `status` ระดับบนสุดในแต่ละงาน ซึ่งคำนวณจาก `enabled`, `state.runningAtMs` และ `state.lastRunStatus` ค่าได้แก่: `disabled`, `running`, `ok`, `error`, `skipped` หรือ `idle` สิ่งนี้สะท้อนคอลัมน์สถานะที่มนุษย์อ่านได้ เพื่อให้เครื่องมือภายนอกอ่านสถานะงานได้โดยไม่ต้องคำนวณซ้ำ

รายการ `cron runs` มีการวินิจฉัยการส่งมอบพร้อมเป้าหมาย cron ที่ตั้งใจไว้ เป้าหมายที่ resolve แล้ว การส่งผ่าน message-tool การใช้ fallback และสถานะการส่งมอบ

การเปลี่ยนเป้าหมาย agent และเซสชัน:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` จะเตือนเมื่อไม่ได้ระบุ `--agent` ในงาน agent-turn และจะ fallback ไปยัง agent เริ่มต้น (`main`) ส่ง `--agent <id>` ตอนสร้างเพื่อผูกกับ agent ที่ระบุ

การปรับแต่งการส่งมอบ:

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
