---
read_when:
    - การตั้งเวลางานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานที่ตั้งเวลาไว้
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, webhooks และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการ Gateway
title: งานที่กำหนดเวลาไว้
x-i18n:
    generated_at: "2026-07-02T08:57:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron คือ Scheduler ในตัวของ Gateway โดยจะคงอยู่ของงาน ปลุก Agent ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องทางแชตหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการแจ้งเตือนแบบครั้งเดียว">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="ตรวจสอบงานของคุณ">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="ดูประวัติการรัน">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron ทำงานอย่างไร

- Cron ทำงาน **ภายในกระบวนการ Gateway** (ไม่ใช่ภายในโมเดล)
- นิยามงาน สถานะขณะรัน และประวัติการรันจะคงอยู่ในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันของ OpenClaw เพื่อให้การรีสตาร์ตไม่ทำให้กำหนดการสูญหาย
- เมื่ออัปเกรด ให้รัน `openclaw doctor --fix` เพื่อนำเข้าไฟล์เดิม `~/.openclaw/cron/jobs.json`, `jobs-state.json` และ `runs/*.jsonl` เข้าสู่ SQLite และเปลี่ยนชื่อไฟล์เหล่านั้นด้วยส่วนต่อท้าย `.migrated` แถวงานที่มีรูปแบบผิดจะถูกข้ามจาก runtime และคัดลอกไปยัง `jobs-quarantine.json` เพื่อซ่อมแซมหรือตรวจสอบภายหลัง
- `cron.store` ยังคงระบุคีย์ที่เก็บ cron เชิงตรรกะและเส้นทางนำเข้าของ doctor หลังจากนำเข้าแล้ว การแก้ไขไฟล์ JSON นั้นจะไม่เปลี่ยนงาน cron ที่ใช้งานอยู่อีกต่อไป ให้ใช้ `openclaw cron add|edit|remove` หรือเมธอด RPC ของ Gateway cron แทน
- การดำเนินการ cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งาน agent-turn แบบแยกที่เลยกำหนดจะถูกจัดกำหนดการใหม่ให้อยู่นอกช่วงเชื่อมต่อช่องทาง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จตามค่าเริ่มต้น
- การรัน cron แบบแยกจะพยายามปิดแท็บ/กระบวนการเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของตนเมื่อการรันเสร็จสิ้น เพื่อไม่ให้ระบบอัตโนมัติของเบราว์เซอร์ที่แยกออกมาทิ้งกระบวนการกำพร้าไว้
- การรัน cron แบบแยกที่ได้รับสิทธิ์การล้างตัวเองของ cron แบบจำกัดยังสามารถอ่านสถานะ Scheduler รายการงานปัจจุบันของตนเองที่ถูกกรองเฉพาะตน และประวัติการรันของงานนั้นได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat สามารถตรวจสอบกำหนดการของตนเองได้โดยไม่ต้องได้รับสิทธิ์กลายพันธุ์ cron ที่กว้างกว่า
- การรัน cron แบบแยกยังป้องกันการตอบรับที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำใบ้คล้ายกัน) และไม่มีการรัน Subagent ลูกหลานที่ยังรับผิดชอบคำตอบสุดท้าย OpenClaw จะ prompt ใหม่หนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน cron แบบแยกใช้ metadata การปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ รวมถึง wrapper `UNAVAILABLE` ของ node-host ซึ่งข้อความแสดงข้อผิดพลาดที่ซ้อนอยู่ขึ้นต้นด้วย `SYSTEM_RUN_DENIED` หรือ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันสีเขียว ขณะที่ข้อความร้อยแก้วทั่วไปของ Assistant จะไม่ถูกถือเป็นการปฏิเสธ
- การรัน cron แบบแยกยังถือว่าความล้มเหลวของ Agent ระดับการรันเป็นข้อผิดพลาดของงาน แม้จะไม่มี payload ตอบกลับก็ตาม เพื่อให้ความล้มเหลวของโมเดล/Provider เพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเสร็จสำเร็จ
- เมื่องาน agent-turn แบบแยกถึง `timeoutSeconds` cron จะยกเลิกการรัน Agent ที่อยู่เบื้องล่างและให้ช่วงเวลาล้างข้อมูลสั้น ๆ หากการรันไม่ระบายงานออก การล้างข้อมูลที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ cron จะบันทึก timeout เพื่อไม่ให้งานแชตที่เข้าคิวค้างอยู่หลังเซสชันประมวลผลที่ค้างเก่า
- หาก agent-turn แบบแยกหยุดค้างก่อน runner เริ่มหรือก่อนการเรียกโมเดลครั้งแรก cron จะบันทึก timeout เฉพาะเฟส เช่น `setup timed out before runner start` หรือ `stalled before first model call (last phase: context-engine)` Watchdog เหล่านี้ครอบคลุม Provider แบบฝังและ Provider ที่อิง CLI ก่อนที่กระบวนการ CLI ภายนอกจะเริ่มจริง และมีเพดานแยกจากค่า `timeoutSeconds` ที่ยาว เพื่อให้ความล้มเหลวของ cold-start/auth/context ปรากฏอย่างรวดเร็วแทนที่จะรอครบงบเวลาทั้งหมดของงาน
- หากคุณใช้ system cron หรือ Scheduler ภายนอกอื่นเพื่อรัน `openclaw agent` ให้ครอบด้วยการยกระดับ hard-kill แม้ว่า CLI จะจัดการ `SIGTERM`/`SIGINT` แล้วก็ตาม การรันที่อิง Gateway จะขอให้ Gateway ยกเลิกการรันที่รับแล้ว ส่วนการรัน fallback แบบ local และแบบฝังจะได้รับสัญญาณยกเลิกเดียวกัน สำหรับ GNU `timeout` ให้ใช้ `timeout -k 60 600 openclaw agent ...` แทน `timeout 600 ...` แบบธรรมดา ค่า `-k` คือ backstop ของ supervisor หากกระบวนการไม่สามารถระบายงานออกได้ สำหรับ unit ของ systemd ให้คงรูปแบบเดียวกันโดยใช้สัญญาณหยุด `SIGTERM` พร้อมช่วงผ่อนผัน เช่น `TimeoutStopSec` ก่อนการ kill สุดท้าย หากการลองซ้ำใช้ `--run-id` เดิมในขณะที่การรัน Gateway เดิมยังทำงานอยู่ รายการซ้ำจะถูกรายงานว่าอยู่ระหว่างดำเนินการแทนที่จะเริ่มการรันที่สอง

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ cron ให้ runtime เป็นเจ้าของก่อน และอิงประวัติที่คงทนเป็นลำดับที่สอง: งาน cron ที่ใช้งานอยู่จะยัง live ขณะที่ runtime ของ cron ยังติดตามงานนั้นว่ากำลังรันอยู่ แม้ว่าจะยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อ runtime หยุดเป็นเจ้าของงานและช่วงผ่อนผัน 5 นาทีหมดลง การบำรุงรักษาจะตรวจสอบ log การรันที่คงอยู่และสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติที่คงทนนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกปิดจากข้อมูลนั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การ audit ของ CLI แบบออฟไลน์สามารถกู้คืนจากประวัติที่คงทนได้ แต่จะไม่ถือว่าชุดงาน active ในกระบวนการของตัวเองที่ว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทกำหนดการ

| ชนิด    | flag ของ CLI  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp แบบครั้งเดียว (ISO 8601 หรือแบบสัมพันธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่ไม่บังคับ |

Timestamp ที่ไม่มี timezone จะถือเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดกำหนดการตามเวลานาฬิกาท้องถิ่น

นิพจน์แบบเกิดซ้ำที่ต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลด spike ของโหลด ใช้ `--exact` เพื่อบังคับเวลาให้แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างเวลาที่ระบุชัดเจน

### day-of-month และ day-of-week ใช้ตรรกะ OR

นิพจน์ Cron ถูก parse โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์ day-of-month และ day-of-week ไม่ใช่ wildcard croner จะ match เมื่อฟิลด์ **ใดฟิลด์หนึ่ง** match ไม่ใช่ทั้งสองฟิลด์ นี่คือพฤติกรรม cron มาตรฐานของ Vixie

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

การตั้งค่านี้จะทำงานประมาณ 5-6 ครั้งต่อเดือน แทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR ค่าเริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ต้องตรงทั้งสองเงื่อนไข ให้ใช้ modifier day-of-week `+` ของ Croner (`0 9 15 * +1`) หรือจัดกำหนดการบนฟิลด์หนึ่งแล้ว guard อีกฟิลด์ใน prompt หรือคำสั่งของงาน

## รูปแบบการดำเนินการ

| รูปแบบ           | ค่า `--session`   | รันใน                  | เหมาะที่สุดสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก    | `main`              | lane ปลุก cron เฉพาะ | การแจ้งเตือน, เหตุการณ์ระบบ        |
| แบบแยก        | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน, งานเบื้องหลัง      |
| เซสชันปัจจุบัน | `current`           | ผูกเมื่อสร้าง   | งานที่เกิดซ้ำและรับรู้บริบท    |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันมีชื่อที่คงอยู่ | Workflow ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="เซสชันหลัก เทียบกับแบบแยก เทียบกับแบบกำหนดเอง">
    งาน **เซสชันหลัก** จะ enqueue เหตุการณ์ระบบเข้าไปใน lane การรันที่ cron เป็นเจ้าของ และปลุก Heartbeat ได้ตามตัวเลือก (`--wake now` หรือ `--wake next-heartbeat`) งานเหล่านี้สามารถใช้บริบทการส่งมอบล่าสุดของเซสชันหลักเป้าหมายสำหรับการตอบกลับได้ แต่จะไม่ผนวก turn ของ cron ตามปกติเข้ากับ lane แชตของมนุษย์ และจะไม่ต่ออายุความสดของการรีเซ็ตรายวัน/เมื่อ idle สำหรับเซสชันเป้าหมาย งาน **แบบแยก** จะรัน agent turn เฉพาะพร้อมเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทข้ามการรัน ทำให้ Workflow เช่น daily standup ที่ต่อยอดจากสรุปก่อนหน้าเป็นไปได้

    เหตุการณ์ cron ของเซสชันหลักเป็นการแจ้งเตือน system-event ที่สมบูรณ์ในตัวเอง เหตุการณ์เหล่านี้
    จะไม่รวมคำสั่ง "Read
    HEARTBEAT.md" ของ prompt Heartbeat ค่าเริ่มต้นโดยอัตโนมัติ หากการแจ้งเตือนแบบเกิดซ้ำควร consult
    `HEARTBEAT.md` ให้ระบุเรื่องนั้นอย่างชัดเจนในข้อความเหตุการณ์ cron หรือใน
    คำสั่งของ Agent เอง

  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแบบแยก">
    สำหรับงานแบบแยก "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับแต่ละการรัน OpenClaw อาจนำค่ากำหนดที่ปลอดภัยติดไปด้วย เช่น การตั้งค่า thinking/fast/verbose, labels และการ override โมเดล/auth ที่ผู้ใช้เลือกอย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว cron เก่า: การ route ช่องทาง/กลุ่ม, นโยบายส่งหรือคิว, elevation, origin หรือการ binding runtime ของ ACP ใช้ `current` หรือ `session:<id>` เมื่องานเกิดซ้ำควรตั้งใจต่อยอดจากบริบทการสนทนาเดียวกัน
  </Accordion>
  <Accordion title="การล้างข้อมูล runtime">
    สำหรับงานแบบแยก teardown ของ runtime ตอนนี้รวมการพยายามล้างข้อมูลเบราว์เซอร์สำหรับเซสชัน cron นั้นด้วย ความล้มเหลวในการล้างข้อมูลจะถูกละเว้นเพื่อให้ผลลัพธ์ cron จริงยังเป็นตัวตัดสิน

    การรัน cron แบบแยกยัง dispose instance runtime ของ MCP ที่ bundle มาและถูกสร้างสำหรับงานผ่านเส้นทาง runtime-cleanup ที่ใช้ร่วมกัน วิธีนี้ตรงกับการ teardown ไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน cron แบบแยกจะไม่รั่วกระบวนการลูก stdio หรือการเชื่อมต่อ MCP อายุยาวข้ามการรัน

  </Accordion>
  <Accordion title="Subagent และการส่งมอบผ่าน Discord">
    เมื่อการรัน cron แบบแยก orchestrate Subagent การส่งมอบจะเลือก output สุดท้ายของลูกหลานมากกว่าข้อความชั่วคราวของ parent ที่ค้างเก่า หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดต parent บางส่วนนั้นแทนการประกาศ

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความ Assistant สุดท้ายตาม canonical เพียงครั้งเดียว แทนการเล่นซ้ำทั้ง payload ข้อความแบบ streamed/intermediate และคำตอบสุดท้าย สื่อและ payload Discord แบบมีโครงสร้างยังคงถูกส่งเป็น payload แยกต่างหาก เพื่อไม่ให้ attachment และ component ถูกทิ้ง

  </Accordion>
</AccordionGroup>

### payload คำสั่ง

ใช้ payload คำสั่งสำหรับสคริปต์ deterministic ที่ควรรันภายใน Scheduler ของ Gateway โดยไม่ต้องเริ่ม agent turn แบบแยกที่อิงโมเดล งานคำสั่งจะดำเนินการบน host ของ Gateway จับ stdout/stderr บันทึกการรันในประวัติ cron และใช้โหมดการส่งมอบ `announce`, `webhook` และ `none` เดียวกับงานแบบแยก

<Note>
Command cron เป็นพื้นผิว automation ของ Gateway สำหรับ operator-admin ไม่ใช่การเรียก
`tools.exec` ของ Agent การสร้าง อัปเดต ลบ หรือรันงาน cron ด้วยตนเอง
ต้องใช้ `operator.admin`; การรันคำสั่งตามกำหนดการภายหลังจะดำเนินการภายใน
กระบวนการ Gateway ในฐานะ automation ที่ผู้ดูแลเขียนไว้ นโยบาย exec ของ Agent เช่น
`tools.exec.mode`, prompt การอนุมัติ และ allowlist ของเครื่องมือต่อ Agent จะกำกับ
เครื่องมือ exec ที่โมเดลมองเห็น ไม่ใช่ payload command cron
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

`--command <shell>` จะเก็บ `argv: ["sh", "-lc", <shell>]` ใช้ `--command-argv '["node","scripts/report.mjs"]'` เมื่อคุณต้องการการดำเนินการ argv ที่แน่นอนโดยไม่มีการ parse ของ shell ฟิลด์เสริม `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` และ `--output-max-bytes` ควบคุม environment ของกระบวนการ, stdin และขอบเขต output

หาก stdout ไม่ว่าง ข้อความนั้นคือผลลัพธ์ที่ถูกส่งมอบ หาก stdout ว่างและ stderr ไม่ว่าง stderr จะถูกส่งมอบ หากมีทั้งสองสตรีม Cron จะส่งบล็อก `stdout:` / `stderr:` ขนาดเล็ก รหัสออกเป็นศูนย์จะบันทึกการรันเป็น `ok`; การออกที่ไม่เป็นศูนย์ สัญญาณ หมดเวลา หรือหมดเวลาเพราะไม่มีเอาต์พุต จะบันทึกเป็น `error` และสามารถทริกเกอร์การแจ้งเตือนความล้มเหลวได้ คำสั่งที่พิมพ์เฉพาะ `NO_REPLY` จะใช้การระงับโทเค็นเงียบตามปกติของ Cron และไม่โพสต์อะไรกลับไปยังแชต

### ตัวเลือกเพย์โหลดสำหรับงานแบบแยก

<ParamField path="--message" type="string" required>
  ข้อความพรอมป์ (จำเป็นสำหรับแบบแยก)
</ParamField>
<ParamField path="--model" type="string">
  การแทนที่โมเดล; ใช้โมเดลที่อนุญาตที่เลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--fallbacks" type="string">
  รายการโมเดลสำรองต่อหนึ่งงาน เช่น `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ส่ง `--fallbacks ""` สำหรับการรันแบบเข้มงวดที่ไม่มีโมเดลสำรอง
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  เมื่อใช้กับ `cron edit` จะลบการแทนที่โมเดลสำรองต่อหนึ่งงาน เพื่อให้งานทำตามลำดับความสำคัญของโมเดลสำรองที่กำหนดค่าไว้ ไม่สามารถใช้ร่วมกับ `--fallbacks`
</ParamField>
<ParamField path="--clear-model" type="boolean">
  เมื่อใช้กับ `cron edit` จะลบการแทนที่โมเดลต่อหนึ่งงาน เพื่อให้งานทำตามลำดับความสำคัญการเลือกโมเดล Cron ตามปกติ (การแทนที่เซสชัน Cron ที่จัดเก็บไว้หากตั้งค่าไว้ มิฉะนั้นใช้โมเดลของเอเจนต์/ค่าเริ่มต้น) ไม่สามารถใช้ร่วมกับ `--model`
</ParamField>
<ParamField path="--thinking" type="string">
  การแทนที่ระดับการคิด
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  เมื่อใช้กับ `cron edit` จะลบการแทนที่การคิดต่อหนึ่งงาน เพื่อให้งานทำตามลำดับความสำคัญการคิดของ Cron ตามปกติ ไม่สามารถใช้ร่วมกับ `--thinking`
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการฉีดไฟล์บูตสแตรปเวิร์กสเปซ
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดว่าเครื่องมือใดที่งานสามารถใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตที่เลือกไว้เป็นโมเดลหลักของงานนั้น ไม่เหมือนกับการแทนที่ `/model` ของเซสชันแชต: เชนโมเดลสำรองที่กำหนดค่าไว้ยังคงใช้เมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ร้องขอไม่ได้รับอนุญาตหรือไม่สามารถแก้ค่าได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนที่จะถอยกลับไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานอย่างเงียบ ๆ

งาน Cron ยังสามารถมี `fallbacks` ระดับเพย์โหลดได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่เชนโมเดลสำรองที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ในเพย์โหลด/API ของงานเมื่อคุณต้องการรัน Cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือก หากงานมี `--model` แต่ไม่มีโมเดลสำรองทั้งในเพย์โหลดหรือในการกำหนดค่า OpenClaw จะส่งการแทนที่โมเดลสำรองแบบว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของเอเจนต์ถูกผนวกเป็นเป้าหมายลองซ้ำเพิ่มเติมแบบซ่อนอยู่

การตรวจสอบล่วงหน้าของผู้ให้บริการภายในเครื่องจะไล่ตรวจโมเดลสำรองที่กำหนดค่าไว้ก่อนทำเครื่องหมายการรัน Cron เป็น `skipped`; `fallbacks: []` ทำให้เส้นทางการตรวจสอบล่วงหน้านั้นยังคงเข้มงวด

ลำดับความสำคัญการเลือกโมเดลสำหรับงานแบบแยกคือ:

1. การแทนที่โมเดลของฮุก Gmail (เมื่อการรันมาจาก Gmail และการแทนที่นั้นได้รับอนุญาต)
2. `model` ของเพย์โหลดต่อหนึ่งงาน
3. การแทนที่โมเดลเซสชัน Cron ที่ผู้ใช้เลือกและจัดเก็บไว้
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมดเร็วทำตามการเลือกแบบสดที่แก้ค่าได้เช่นกัน หากการกำหนดค่าโมเดลที่เลือกมี `params.fastMode` Cron แบบแยกจะใช้ค่านั้นโดยค่าเริ่มต้น การแทนที่ `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงมีสิทธิ์เหนือการกำหนดค่าไม่ว่าจะเป็นทิศทางใด โหมดอัตโนมัติใช้ค่าตัด `params.fastAutoOnSeconds` ของโมเดลที่เลือกเมื่อมีอยู่ โดยมีค่าเริ่มต้นเป็น 60 วินาที

หากการรันแบบแยกเจอการส่งต่อการสลับโมเดลแบบสด Cron จะลองซ้ำด้วยผู้ให้บริการ/โมเดลที่ถูกสลับ และคงการเลือกแบบสดนั้นไว้สำหรับการรันที่ใช้งานอยู่ก่อนลองซ้ำ เมื่อการสลับนั้นพกโปรไฟล์การยืนยันตัวตนใหม่มาด้วย Cron จะคงการแทนที่โปรไฟล์การยืนยันตัวตนนั้นไว้สำหรับการรันที่ใช้งานอยู่เช่นกัน การลองซ้ำมีขอบเขต: หลังจากความพยายามครั้งแรกบวกการลองซ้ำจากการสลับ 2 ครั้ง Cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

ก่อนที่การรัน Cron แบบแยกจะเข้าสู่ตัวรันเอเจนต์ OpenClaw จะตรวจสอบเอนด์พอยต์ผู้ให้บริการภายในเครื่องที่เข้าถึงได้สำหรับผู้ให้บริการ `api: "ollama"` และ `api: "openai-completions"` ที่กำหนดค่าไว้ ซึ่ง `baseUrl` เป็น loopback, เครือข่ายส่วนตัว หรือ `.local` หากเอนด์พอยต์นั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาดผู้ให้บริการ/โมเดลที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์เอนด์พอยต์จะถูกแคชไว้ 5 นาที ดังนั้นงานจำนวนมากที่ถึงกำหนดและใช้เซิร์ฟเวอร์ Ollama, vLLM, SGLang หรือ LM Studio ภายในเครื่องที่ล่มตัวเดียวกัน จะใช้โพรบขนาดเล็กร่วมกันหนึ่งครั้งแทนการสร้างพายุคำขอ การรันที่ถูกข้ามจากการตรวจสอบล่วงหน้าผู้ให้บริการจะไม่เพิ่ม backoff ของข้อผิดพลาดการดำเนินการ; เปิดใช้ `failureAlert.includeSkipped` เมื่อคุณต้องการการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและเอาต์พุต

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบสำรองไปยังเป้าหมายหากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST เพย์โหลดเหตุการณ์ที่เสร็จแล้วไปยัง URL                                |
| `none`     | ไม่มีการส่งมอบสำรองของตัวรัน                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งมอบไปยังช่องทาง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; OpenClaw ยังยอมรับรูปแบบย่อ `-1001234567890:123` ที่ Telegram เป็นเจ้าของ ผู้เรียก RPC/config โดยตรงอาจส่ง `delivery.threadId` เป็นสตริงหรือตัวเลข เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix คำนึงถึงตัวพิมพ์เล็กใหญ่; ใช้ ID ห้องที่ตรงเป๊ะหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งมอบประกาศใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มีคำนำหน้าผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ Cron จะถอยกลับไปใช้ประวัติเซสชันหรือช่องทางที่กำหนดค่าไว้เพียงช่องทางเดียว เฉพาะคำนำหน้าที่ Plugin ที่โหลดไว้ประกาศเท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุชัดเจน คำนำหน้าเป้าหมายต้องระบุผู้ให้บริการเดียวกัน เช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ แทนที่จะปล่อยให้ WhatsApp ตีความ ID Telegram เป็นหมายเลขโทรศัพท์ คำนำหน้าชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานแบบแยก การส่งมอบแชตใช้ร่วมกัน หากมีเส้นทางแชต เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้ามการประกาศสำรอง มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ตัวรันทำกับคำตอบสุดท้ายหลังจากเทิร์นของเอเจนต์

เมื่อเอเจนต์สร้างการเตือนแบบแยกจากแชตที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งมอบแบบสดที่รักษาไว้สำหรับเส้นทางประกาศสำรอง คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งมอบของผู้ให้บริการจะไม่ถูกสร้างขึ้นใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชตปัจจุบัน

การส่งมอบประกาศโดยนัยใช้รายการอนุญาตช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติจากที่จัดเก็บการจับคู่ DM ไม่ใช่ผู้รับระบบอัตโนมัติสำรอง; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทางเมื่องานตามกำหนดเวลาควรส่งไปยัง DM เชิงรุก

## ภาษาเอาต์พุต

งาน Cron ไม่อนุมานภาษาตอบกลับจากช่องทาง โลเคล หรือข้อความก่อนหน้า
ให้ใส่กฎภาษาไว้ในข้อความตามกำหนดเวลาหรือเทมเพลต:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

สำหรับไฟล์เทมเพลต ให้คงคำสั่งเรื่องภาษาไว้ในพรอมป์ที่เรนเดอร์แล้ว และ
ตรวจสอบว่าตัวแทนที่ เช่น `{{language}}` ถูกเติมค่าก่อนที่งานจะเริ่มทำงาน หาก
ผลลัพธ์ผสมหลายภาษา ให้ระบุกฎให้ชัดเจน เช่น: "Use Chinese
for narrative text and keep technical terms in English."

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นเป็นรายงาน
- หากไม่ได้ตั้งค่าทั้งสองรายการ และงานส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ว่าโหมดการส่งหลักคือ `webhook`
- `failureAlert.includeSkipped: true` เลือกให้นโยบายการแจ้งเตือน cron ของงานหรือส่วนกลางส่งการแจ้งเตือนรอบที่ถูกข้ามซ้ำ ๆ รอบที่ถูกข้ามจะเก็บตัวนับการข้ามต่อเนื่องแยกต่างหาก จึงไม่ส่งผลต่อการหน่วงถอยหลังเมื่อเกิดข้อผิดพลาดในการดำเนินการ

## ตัวอย่าง CLI

<Tabs>
  <Tab title="ตัวเตือนแบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="งาน isolated แบบเกิดซ้ำ">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="การแทนที่โมเดลและการคิด">
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
  </Tab>
  <Tab title="เอาต์พุต Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="เอาต์พุตคำสั่ง">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway สามารถเปิดเผย HTTP webhook endpoints สำหรับทริกเกอร์ภายนอก เปิดใช้ในการกำหนดค่า:

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

ทุกคำขอต้องมีโทเค็น hook ผ่านส่วนหัว:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

โทเค็นในสตริงคิวรีจะถูกปฏิเสธ

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    จัดคิวเหตุการณ์ระบบสำหรับเซสชันหลัก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      คำอธิบายเหตุการณ์
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` หรือ `next-heartbeat`
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    เรียกใช้รอบ agent แบบ isolated:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="hook ที่แมปแล้ว (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูกแปลงผ่าน `hooks.mappings` ในการกำหนดค่า การแมปสามารถแปลง payload ใด ๆ ให้เป็นการกระทำ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บ hook endpoints ไว้หลังลูปแบ็ก, tailnet, หรือ reverse proxy ที่เชื่อถือได้

- ใช้โทเค็น hook แยกต่างหาก อย่าใช้โทเค็นยืนยันตัวตนของ Gateway ซ้ำ
- เก็บ `hooks.path` ไว้บนพาธย่อยเฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดว่า hook สามารถกำหนดเป้าหมายไปยังเอเจนต์ที่มีผลตัวใดได้บ้าง รวมถึงเอเจนต์เริ่มต้นเมื่อไม่ระบุ `agentId`
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกได้
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- เพย์โหลดของ hook จะถูกห่อด้วยขอบเขตความปลอดภัยเป็นค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องขาเข้า Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** CLI `gcloud`, `gog` (gogcli), เปิดใช้ hook ของ OpenClaw แล้ว, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียนการกำหนดค่า `hooks.gmail` เปิดใช้พรีเซ็ต Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway โดยอัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch โดยอัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

### การตั้งค่าด้วยตนเองครั้งเดียว

<Steps>
  <Step title="เลือกโปรเจกต์ GCP">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของไคลเอ็นต์ OAuth ที่ `gog` ใช้:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="สร้างหัวข้อและให้สิทธิ์การเข้าถึง Gmail push">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="เริ่ม watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### การแทนที่โมเดล Gmail

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

# รับงานที่จัดเก็บไว้หนึ่งรายการเป็น JSON
openclaw cron get <jobId>

# แสดงงานหนึ่งรายการ รวมถึงเส้นทางการส่งที่ resolve แล้ว
openclaw cron show <jobId>

# แก้ไขงาน
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# บังคับรันงานตอนนี้
openclaw cron run <jobId>

# บังคับรันงานตอนนี้และรอสถานะสิ้นสุดของงาน
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# รันเฉพาะเมื่อถึงกำหนด
openclaw cron run <jobId> --due

# ดูประวัติการรัน
openclaw cron runs --id <jobId> --limit 50

# ดูการรันที่เจาะจงหนึ่งรายการ
openclaw cron runs --id <jobId> --run-id <runId>

# ลบงาน
openclaw cron remove <jobId>

# การเลือกเอเจนต์ (การตั้งค่าแบบหลายเอเจนต์)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` จะคืนค่าหลังจากนำการรันด้วยตนเองเข้า enqueue แล้ว ใช้ `--wait` สำหรับ shutdown hooks, สคริปต์บำรุงรักษา หรือระบบอัตโนมัติอื่นที่ต้องบล็อกจนกว่าการรันในคิวจะเสร็จสิ้น โหมดรอจะโพล `runId` ที่คืนมาอย่างเจาะจง โดยจะออกด้วย `0` สำหรับสถานะ `ok` และไม่ใช่ศูนย์สำหรับ `error`, `skipped` หรือการรอหมดเวลา

เครื่องมือ `cron` ของเอเจนต์จะคืนค่าสรุปงานแบบกะทัดรัด (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) จาก `cron(action: "list")`; ใช้ `cron(action: "get", jobId: "...")` สำหรับนิยามงานเต็มหนึ่งรายการ ผู้เรียก Gateway โดยตรงสามารถส่ง `compact: true` ไปยัง `cron.list` ได้; หากไม่ระบุ จะคงการตอบกลับเต็มรูปแบบเดิมพร้อมตัวอย่างการส่ง

`openclaw cron create` เป็น alias ของ `openclaw cron add` และงานใหม่สามารถใช้กำหนดการแบบ positional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` หรือ timestamp แบบ ISO) ตามด้วยพรอมป์เอเจนต์แบบ positional ใช้ `--webhook <url>` บน `cron add|create` หรือ `cron edit` เพื่อ POST เพย์โหลดการรันที่เสร็จสิ้นไปยังปลายทาง HTTP การส่ง Webhook ไม่สามารถใช้ร่วมกับแฟล็กการส่งแชต เช่น `--announce`, `--channel`, `--to`, `--thread-id` หรือ `--account` ได้ บน `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` และ `--clear-account` จะยกเลิกการตั้งค่าฟิลด์ routing เหล่านั้นทีละรายการ (แต่ละรายการจะถูกปฏิเสธหากใช้ร่วมกับแฟล็กตั้งค่าที่ตรงกัน) ซึ่งแตกต่างจาก `--no-deliver` ที่ปิดการส่ง fallback ของ runner

<Note>
หมายเหตุการแทนที่โมเดล:

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลได้รับอนุญาต provider/model ที่ระบุนั้นจะไปถึงการรันเอเจนต์แบบแยก
- หากไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- แพตช์เพย์โหลด API `cron.update` สามารถตั้งค่า `model: null` เพื่อล้างการแทนที่โมเดลงานที่จัดเก็บไว้
- `openclaw cron edit <job-id> --clear-model` จะล้างการแทนที่นั้นจาก CLI (ให้ผลเหมือนแพตช์ `model: null`) และไม่สามารถใช้ร่วมกับ `--model` ได้
- เชน fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ `--model` ของ cron เป็นค่าหลักของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- `openclaw cron add|edit --fallbacks ...` ตั้งค่าเพย์โหลด `fallbacks` โดยแทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `--fallbacks ""` จะปิด fallback และทำให้การรันเป็นแบบเข้มงวด `openclaw cron edit <job-id> --clear-fallbacks` จะล้างการแทนที่ต่อหนึ่งงาน
- `--model` ธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้ จะไม่ไหลต่อไปยังเอเจนต์หลักเป็นเป้าหมายลองใหม่เพิ่มเติมแบบเงียบ

</Note>

## การกำหนดค่า

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns` จำกัดทั้งการ dispatch cron ตามกำหนดเวลาและการดำเนินการ agent-turn แบบแยก และมีค่าเริ่มต้นเป็น 8 การ turn ของเอเจนต์ cron แบบแยกใช้เลนการดำเนินการเฉพาะ `cron-nested` ของคิวภายใน ดังนั้นการเพิ่มค่านี้ทำให้การรัน LLM cron อิสระคืบหน้าแบบขนานได้ แทนที่จะเริ่มเฉพาะ wrapper cron ชั้นนอกทีละตัว การตั้งค่านี้จะไม่ขยายเลน `nested` ที่ใช้ร่วมกันและไม่ใช่ cron

`cron.store` เป็นคีย์ store เชิงตรรกะและพาธนำเข้าของ doctor แบบเดิม รัน `openclaw doctor --fix` เพื่อนำเข้า store JSON ที่มีอยู่ไปยัง SQLite และเก็บถาวร การเปลี่ยนแปลง cron ในอนาคตควรทำผ่าน CLI หรือ Gateway API

ปิดใช้ cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรมการลองใหม่">
    **การลองใหม่แบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองใหม่สูงสุด 3 ครั้งด้วย exponential backoff ข้อผิดพลาดถาวรจะปิดใช้ทันที

    **การลองใหม่แบบเกิดซ้ำ**: exponential backoff (30s ถึง 60m) ระหว่างการลองใหม่ Backoff จะรีเซ็ตหลังจากการรันครั้งถัดไปสำเร็จ

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะล้างรายการเซสชันการรันแบบแยก `cron.runLog.keepLines` จำกัดจำนวนแถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน; `maxBytes` ถูกเก็บไว้เพื่อความเข้ากันได้ของการกำหนดค่ากับ run log แบบไฟล์รุ่นเก่า
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron ไม่ทำงาน">
    - ตรวจสอบ `cron.enabled` และตัวแปรสภาพแวดล้อม `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway ทำงานอย่างต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบ timezone (`--tz`) เทียบกับ timezone ของโฮสต์
    - `reason: not-due` ในผลลัพธ์การรันหมายความว่าการรันด้วยตนเองถูกตรวจสอบด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่ง">
    - โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่ง fallback ของ runner เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าขาออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกมาหรือเป็นแบบเดิมที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้องของ Matrix แยกแยะตัวพิมพ์ใหญ่เล็ก แก้ไขงานเป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกด้วยข้อมูลประจำตัว
    - หากการรันแบบแยกคืนเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งขาออกโดยตรงและระงับเส้นทางสรุปที่เข้าคิวเป็น fallback ด้วย ดังนั้นจะไม่มีอะไรถูกโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะป้องกันการ rollover แบบ /new">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อ idle ไม่ได้อิงกับ `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกของ cron, การรัน Heartbeat, การแจ้งเตือน exec และการบันทึกบัญชีของ Gateway อาจอัปเดตแถวเซสชันสำหรับ routing/status แต่ไม่ได้ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถว legacy ที่สร้างก่อนฟิลด์เหล่านั้นมีอยู่ OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชัน transcript JSONL เมื่อไฟล์ยังพร้อมใช้งาน แถว idle legacy ที่ไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนได้นั้นเป็น baseline ของ idle

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับ Timezone">
    - Cron ที่ไม่มี `--tz` จะใช้ timezone ของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มี timezone จะถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การ resolve timezone ที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติ](/th/automation) — กลไกอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีงานสำหรับการดำเนินการ cron
- [Heartbeat](/th/gateway/heartbeat) — การ turn ของเซสชันหลักเป็นระยะ
- [Timezone](/th/concepts/timezone) — การกำหนดค่า timezone
