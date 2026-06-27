---
read_when:
    - การจัดกำหนดการงานเบื้องหลังหรือการปลุกระบบ
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานที่ตั้งเวลาไว้
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, webhooks และทริกเกอร์ Gmail PubSub สำหรับตัวกำหนดเวลา Gateway
title: งานที่ตั้งเวลาไว้
x-i18n:
    generated_at: "2026-06-27T17:08:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron คือ scheduler ในตัวของ Gateway โดยจะบันทึกงานแบบถาวร ปลุกเอเจนต์ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชตหรือ Webhook endpoint ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการเตือนแบบครั้งเดียว">
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

## Cron ทำงานอย่างไร

- Cron ทำงาน **ภายในกระบวนการ Gateway** (ไม่ใช่ภายในโมเดล)
- ข้อกำหนดของงาน สถานะรันไทม์ และประวัติการรันจะถูกบันทึกถาวรในฐานข้อมูลสถานะ SQLite ร่วมของ OpenClaw เพื่อให้การรีสตาร์ตไม่ทำให้กำหนดการสูญหาย
- เมื่ออัปเกรด ให้รัน `openclaw doctor --fix` เพื่อนำเข้าไฟล์เดิม `~/.openclaw/cron/jobs.json`, `jobs-state.json` และ `runs/*.jsonl` เข้า SQLite แล้วเปลี่ยนชื่อไฟล์เหล่านั้นด้วยส่วนต่อท้าย `.migrated` แถวงานที่มีรูปแบบไม่ถูกต้องจะถูกข้ามจากรันไทม์และคัดลอกไปยัง `jobs-quarantine.json` เพื่อซ่อมแซมหรือตรวจสอบภายหลัง
- `cron.store` ยังใช้ระบุคีย์ที่เก็บ cron เชิงตรรกะและเส้นทางนำเข้าของ doctor หลังจากนำเข้าแล้ว การแก้ไขไฟล์ JSON นั้นจะไม่เปลี่ยนงาน cron ที่ใช้งานอยู่แล้ว ให้ใช้ `openclaw cron add|edit|remove` หรือเมธอด RPC ของ Cron ใน Gateway แทน
- การทำงานของ cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งานเอเจนต์เทิร์นแบบแยกที่เลยกำหนดแล้วจะถูกจัดเวลาใหม่ให้ออกจากช่วงเชื่อมต่อช่องทาง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จตามค่าเริ่มต้น
- การรัน cron แบบแยกจะพยายามปิดแท็บเบราว์เซอร์/กระบวนการที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของตนเมื่อการรันเสร็จสิ้น เพื่อไม่ให้อัตโนมัติของเบราว์เซอร์ที่แยกออกมาทิ้งกระบวนการค้างไว้
- การรัน cron แบบแยกที่ได้รับสิทธิ์ cron self-cleanup แบบจำกัดยังสามารถอ่านสถานะ scheduler รายการงานปัจจุบันของตัวเองที่กรองเฉพาะตนเอง และประวัติการรันของงานนั้นได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat ตรวจสอบกำหนดการของตัวเองได้โดยไม่รับสิทธิ์แก้ไข cron ที่กว้างกว่า
- การรัน cron แบบแยกยังป้องกันการตอบรับที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำใบ้ทำนองเดียวกัน) และไม่มีการรันของเอเจนต์ย่อยสืบทอดที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะส่งพรอมป์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน cron แบบแยกใช้เมทาดาทาการปฏิเสธการทำงานแบบมีโครงสร้างจากการรันที่ฝังอยู่ รวมถึงตัวห่อ `UNAVAILABLE` ของ node-host ซึ่งข้อความข้อผิดพลาดที่ซ้อนอยู่เริ่มต้นด้วย `SYSTEM_RUN_DENIED` หรือ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันสำเร็จ ขณะเดียวกันก็ไม่ตีความข้อความธรรมดาของผู้ช่วยว่าเป็นการปฏิเสธ
- การรัน cron แบบแยกยังถือว่าความล้มเหลวของเอเจนต์ระดับการรันเป็นข้อผิดพลาดของงาน แม้จะไม่มี payload คำตอบ เพื่อให้ความล้มเหลวของโมเดล/ผู้ให้บริการเพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเป็นความสำเร็จ
- เมื่องานเอเจนต์เทิร์นแบบแยกถึง `timeoutSeconds` cron จะยกเลิกการรันเอเจนต์เบื้องหลังและให้ช่วงเวลาสั้น ๆ สำหรับ cleanup หากการรันไม่ระบายงานจนเสร็จ cleanup ที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ cron จะบันทึก timeout เพื่อไม่ให้งานแชตที่เข้าคิวค้างอยู่หลังเซสชันประมวลผลที่ล้าสมัย
- หากเอเจนต์เทิร์นแบบแยกค้างก่อน runner เริ่มหรือก่อนการเรียกโมเดลครั้งแรก cron จะบันทึก timeout เฉพาะเฟส เช่น `setup timed out before runner start` หรือ `stalled before first model call (last phase: context-engine)` watchdog เหล่านี้ครอบคลุมผู้ให้บริการแบบฝังและผู้ให้บริการที่ใช้ CLI ก่อนที่กระบวนการ CLI ภายนอกจะเริ่มจริง และถูกจำกัดแยกจากค่า `timeoutSeconds` ที่ยาว เพื่อให้ความล้มเหลวของ cold-start/auth/context ปรากฏอย่างรวดเร็วแทนที่จะรอจนหมดงบเวลาของงานทั้งหมด
- หากคุณใช้ system cron หรือ scheduler ภายนอกอื่นเพื่อรัน `openclaw agent` ให้ห่อด้วยการยกระดับ hard-kill แม้ว่า CLI จะจัดการ `SIGTERM`/`SIGINT` อยู่แล้ว การรันที่มี Gateway รองรับจะขอให้ Gateway ยกเลิกการรันที่รับแล้ว ส่วนการรัน local และ fallback แบบฝังจะได้รับสัญญาณยกเลิกเดียวกัน สำหรับ GNU `timeout` แนะนำให้ใช้ `timeout -k 60 600 openclaw agent ...` แทน `timeout 600 ...` ธรรมดา ค่า `-k` คือ backstop ของ supervisor หากกระบวนการระบายงานไม่สำเร็จ สำหรับ systemd units ให้คงรูปแบบเดียวกันโดยใช้สัญญาณหยุด `SIGTERM` พร้อมช่วงเวลาผ่อนผัน เช่น `TimeoutStopSec` ก่อนการ kill ขั้นสุดท้าย หากการลองซ้ำใช้ `--run-id` ซ้ำขณะที่การรัน Gateway เดิมยังทำงานอยู่ รายการซ้ำจะถูกรายงานว่าอยู่ระหว่างดำเนินการแทนที่จะเริ่มการรันที่สอง

<a id="maintenance"></a>

<Note>
การปรับเทียบงานสำหรับ cron ให้รันไทม์เป็นเจ้าของก่อน และใช้ประวัติถาวรรองรับเป็นลำดับที่สอง: งาน cron ที่ทำงานอยู่จะยังมีสถานะ live ตราบใดที่รันไทม์ cron ยังติดตามงานนั้นว่ากำลังรันอยู่ แม้ยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อรันไทม์หยุดเป็นเจ้าของงานและช่วงผ่อนผัน 5 นาทีหมดลง การบำรุงรักษาจะตรวจสอบบันทึกการรันที่บันทึกถาวรและสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากข้อมูลนั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบ CLI แบบออฟไลน์สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงาน active ในกระบวนการของตัวเองที่ว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทกำหนดการ

| ชนิด    | แฟล็ก CLI  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp แบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ช่องหรือ 6 ช่อง พร้อม `--tz` แบบไม่บังคับ |

timestamp ที่ไม่มีเขตเวลาจะถือเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดเวลาตามเวลานาฬิกาท้องถิ่น

นิพจน์ที่เกิดซ้ำตอนต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลดโหลดพุ่ง ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างเวลาที่ระบุชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อฟิลด์วันของเดือนและวันของสัปดาห์ทั้งคู่ไม่ใช่ wildcard croner จะจับคู่เมื่อ **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน ไม่ใช่ต้องตรงทั้งคู่ นี่คือพฤติกรรม cron มาตรฐานแบบ Vixie

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

รายการนี้จะทำงานประมาณ 5-6 ครั้งต่อเดือน แทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ตรงทั้งสองเงื่อนไข ให้ใช้ตัวปรับวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดกำหนดการจากฟิลด์หนึ่งแล้วตรวจอีกฟิลด์ในพรอมป์หรือคำสั่งของงาน

## รูปแบบการทำงาน

| รูปแบบ           | ค่า `--session`   | รันใน                  | เหมาะสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก    | `main`              | เลนปลุก cron เฉพาะ | การเตือน เหตุการณ์ระบบ        |
| แบบแยก        | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน งานเบื้องหลังประจำ      |
| เซสชันปัจจุบัน | `current`           | ผูกตอนสร้าง   | งานซ้ำที่รับรู้บริบท    |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันมีชื่อแบบถาวร | workflow ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="เซสชันหลักเทียบกับแบบแยกเทียบกับแบบกำหนดเอง">
    งาน **เซสชันหลัก** จะเข้าคิวเหตุการณ์ระบบในเลนการรันที่ cron เป็นเจ้าของ และปลุก Heartbeat ได้แบบไม่บังคับ (`--wake now` หรือ `--wake next-heartbeat`) งานเหล่านี้ใช้บริบทการส่งมอบล่าสุดของเซสชันหลักเป้าหมายสำหรับการตอบกลับได้ แต่จะไม่ผนวกเทิร์น cron ตามปกติเข้ากับเลนแชตมนุษย์ และจะไม่ขยายความสดใหม่ของการรีเซ็ตรายวัน/ขณะว่างสำหรับเซสชันเป้าหมาย งาน **แบบแยก** จะรันเอเจนต์เทิร์นเฉพาะด้วยเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทข้ามการรัน ทำให้ workflow เช่น daily standup ที่ต่อยอดจากสรุปก่อนหน้าทำได้

    เหตุการณ์ cron ของเซสชันหลักเป็นการเตือนแบบเหตุการณ์ระบบที่สมบูรณ์ในตัวเอง เหตุการณ์เหล่านี้
    จะไม่รวมคำสั่ง "Read
    HEARTBEAT.md" ของพรอมป์ Heartbeat เริ่มต้นโดยอัตโนมัติ หากการเตือนที่เกิดซ้ำควรอ่าน
    `HEARTBEAT.md` ให้ระบุไว้อย่างชัดเจนในข้อความเหตุการณ์ cron หรือใน
    คำสั่งของเอเจนต์เอง

  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแบบแยก">
    สำหรับงานแบบแยก "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับการรันแต่ละครั้ง OpenClaw อาจนำค่ากำหนดที่ปลอดภัยติดมาด้วย เช่น การตั้งค่า thinking/fast/verbose ป้ายกำกับ และการ override โมเดล/auth ที่ผู้ใช้เลือกอย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว cron เก่า: การกำหนดเส้นทางช่องทาง/กลุ่ม นโยบายการส่งหรือเข้าคิว การยกระดับ แหล่งกำเนิด หรือการผูก ACP runtime ใช้ `current` หรือ `session:<id>` เมื่องานที่เกิดซ้ำควรตั้งใจต่อยอดจากบริบทการสนทนาเดียวกัน
  </Accordion>
  <Accordion title="Runtime cleanup">
    สำหรับงานแบบแยก การรื้อถอนรันไทม์ตอนนี้รวมการ cleanup เบราว์เซอร์แบบ best-effort สำหรับเซสชัน cron นั้น ความล้มเหลวของ cleanup จะถูกเพิกเฉยเพื่อให้ผลลัพธ์ cron จริงยังเป็นตัวตัดสิน

    การรัน cron แบบแยกยัง dispose อินสแตนซ์รันไทม์ MCP ที่ bundled ซึ่งสร้างให้กับงานผ่านเส้นทาง runtime-cleanup ร่วมด้วย สิ่งนี้ตรงกับวิธีรื้อถอน MCP clients ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน cron แบบแยกจะไม่ทำให้กระบวนการลูก stdio หรือการเชื่อมต่อ MCP ที่มีอายุยาวรั่วข้ามการรัน

  </Accordion>
  <Accordion title="การส่งมอบผ่านเอเจนต์ย่อยและ Discord">
    เมื่อการรัน cron แบบแยกควบคุมเอเจนต์ย่อย การส่งมอบจะชอบผลลัพธ์สุดท้ายของผู้สืบทอดมากกว่าข้อความชั่วคราวของพาเรนต์ที่ค้างเก่า หากผู้สืบทอดยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจากพาเรนต์นั้นแทนการประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord ที่เป็นข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายที่เป็นมาตรฐานหนึ่งครั้ง แทนที่จะเล่นซ้ำทั้ง payload ข้อความแบบ streamed/ชั่วคราวและคำตอบสุดท้าย payload สื่อและ payload Discord แบบมีโครงสร้างยังคงถูกส่งเป็น payload แยกต่างหาก เพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์หล่นหาย

  </Accordion>
</AccordionGroup>

### Command payloads

ใช้ command payloads สำหรับสคริปต์ที่กำหนดแน่นอนซึ่งควรรันภายใน scheduler ของ Gateway โดยไม่เริ่มเอเจนต์เทิร์นแบบแยกที่มีโมเดลรองรับ งานคำสั่งจะทำงานบนโฮสต์ Gateway จับ stdout/stderr บันทึกการรันในประวัติ cron และใช้โหมดการส่งมอบ `announce`, `webhook` และ `none` แบบเดียวกับงานแบบแยก

<Note>
Command cron เป็นพื้นผิวอัตโนมัติของ Gateway สำหรับ operator-admin ไม่ใช่การเรียก
`tools.exec` ของเอเจนต์ การสร้าง อัปเดต ลบ หรือรันงาน cron ด้วยตนเอง
ต้องใช้ `operator.admin`; การรันคำสั่งตามกำหนดการภายหลังจะทำงานภายใน
กระบวนการ Gateway ในฐานะอัตโนมัติที่ admin เป็นผู้สร้าง นโยบาย exec ของเอเจนต์ เช่น
`tools.exec.mode`, พรอมป์อนุมัติ และ allowlists เครื่องมือต่อเอเจนต์จะควบคุม
เครื่องมือ exec ที่โมเดลมองเห็น ไม่ใช่ command cron payloads
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

`--command <shell>` จะเก็บ `argv: ["sh", "-lc", <shell>]` ใช้ `--command-argv '["node","scripts/report.mjs"]'` เมื่อต้องการการทำงานแบบ argv ที่แน่นอนโดยไม่มีการแยกวิเคราะห์ของ shell ฟิลด์แบบไม่บังคับ `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` และ `--output-max-bytes` ควบคุมสภาพแวดล้อมกระบวนการ stdin และขอบเขตเอาต์พุต

หาก stdout ไม่ว่าง ข้อความนั้นคือผลลัพธ์ที่ถูกส่ง หาก stdout ว่างและ stderr ไม่ว่าง จะส่ง stderr หากมีทั้งสองสตรีม cron จะส่งบล็อก `stdout:` / `stderr:` ขนาดเล็ก รหัสออกเป็นศูนย์จะบันทึกการรันเป็น `ok`; การออกที่ไม่ใช่ศูนย์, signal, timeout หรือ no-output timeout จะบันทึกเป็น `error` และสามารถทริกเกอร์การแจ้งเตือนความล้มเหลวได้ คำสั่งที่พิมพ์เฉพาะ `NO_REPLY` จะใช้การระงับ silent-token ตามปกติของ cron และไม่โพสต์อะไรกลับไปยังแชต

### ตัวเลือก payload สำหรับงานแบบแยก

<ParamField path="--message" type="string" required>
  ข้อความพรอมป์ (จำเป็นสำหรับแบบแยก)
</ParamField>
<ParamField path="--model" type="string">
  การแทนที่โมเดล; ใช้โมเดลที่อนุญาตซึ่งเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--fallbacks" type="string">
  รายการโมเดล fallback ต่อหนึ่งงาน เช่น `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ส่ง `--fallbacks ""` สำหรับการรันแบบเข้มงวดที่ไม่มี fallback
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  บน `cron edit` จะลบการแทนที่ fallback ต่อหนึ่งงาน เพื่อให้งานทำตามลำดับความสำคัญ fallback ที่กำหนดค่าไว้ ไม่สามารถใช้ร่วมกับ `--fallbacks` ได้
</ParamField>
<ParamField path="--clear-model" type="boolean">
  บน `cron edit` จะลบการแทนที่โมเดลต่อหนึ่งงาน เพื่อให้งานทำตามลำดับความสำคัญการเลือกโมเดลของ cron ตามปกติ (การแทนที่ cron-session ที่จัดเก็บไว้หากตั้งค่าไว้ มิฉะนั้นคือโมเดลของ agent/default) ไม่สามารถใช้ร่วมกับ `--model` ได้
</ParamField>
<ParamField path="--thinking" type="string">
  การแทนที่ระดับการคิด
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการแทรกไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดเครื่องมือที่งานสามารถใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตซึ่งเลือกไว้เป็นโมเดลหลักของงานนั้น ไม่เหมือนกับการแทนที่ `/model` ของเซสชันแชต: เชน fallback ที่กำหนดค่าไว้ยังคงใช้เมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ร้องขอไม่ได้รับอนุญาตหรือไม่สามารถ resolve ได้ cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนที่จะ fallback แบบเงียบไปยังการเลือกโมเดล agent/default ของงาน

งาน Cron ยังสามารถมี `fallbacks` ระดับ payload ได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่เชน fallback ที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ใน payload/API ของงานเมื่อคุณต้องการการรัน cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือก หากงานมี `--model` แต่ไม่มี fallback ทั้งใน payload หรือการกำหนดค่า OpenClaw จะส่งการแทนที่ fallback ว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของ agent ถูกต่อท้ายเป็นเป้าหมายลองซ้ำพิเศษที่ซ่อนอยู่

การตรวจสอบ preflight ของผู้ให้บริการในเครื่องจะไล่ตรวจ fallback ที่กำหนดค่าไว้ก่อนทำเครื่องหมายการรัน cron เป็น `skipped`; `fallbacks: []` จะทำให้เส้นทาง preflight นั้นเข้มงวด

ลำดับความสำคัญการเลือกโมเดลสำหรับงานแบบแยกคือ:

1. การแทนที่โมเดลของ Gmail hook (เมื่อการรันมาจาก Gmail และการแทนที่นั้นได้รับอนุญาต)
2. `model` ใน payload ต่อหนึ่งงาน
3. การแทนที่โมเดลเซสชัน cron ที่ผู้ใช้เลือกและจัดเก็บไว้
4. การเลือกโมเดล agent/default

Fast mode จะทำตามการเลือกแบบ live ที่ resolve แล้วเช่นกัน หาก config ของโมเดลที่เลือกมี `params.fastMode` cron แบบแยกจะใช้ค่านั้นโดยค่าเริ่มต้น การแทนที่ `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงชนะ config ได้ทั้งสองทิศทาง Auto mode ใช้ค่า cutoff `params.fastAutoOnSeconds` ของโมเดลที่เลือกเมื่อมีอยู่ โดยค่าเริ่มต้นคือ 60 วินาที

หากการรันแบบแยกเจอการส่งต่อการสลับโมเดลแบบ live cron จะลองใหม่ด้วย provider/model ที่สลับแล้ว และ persist การเลือกแบบ live นั้นสำหรับการรันที่ใช้งานอยู่ก่อนลองใหม่ เมื่อการสลับมีโปรไฟล์ auth ใหม่มาด้วย cron จะ persist การแทนที่โปรไฟล์ auth นั้นสำหรับการรันที่ใช้งานอยู่ด้วย การลองซ้ำมีขอบเขต: หลังจากความพยายามครั้งแรกบวกการลองซ้ำจากการสลับ 2 ครั้ง cron จะยุติแทนที่จะวนซ้ำตลอดไป

ก่อนที่การรัน cron แบบแยกจะเข้าสู่ agent runner OpenClaw จะตรวจสอบ endpoint ของ local provider ที่เข้าถึงได้สำหรับ provider ที่กำหนดค่า `api: "ollama"` และ `api: "openai-completions"` ซึ่งมี `baseUrl` เป็น loopback, private-network หรือ `.local` หาก endpoint นั้นไม่ทำงาน การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาด provider/model ที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์ endpoint จะถูกแคชไว้ 5 นาที ดังนั้นงานจำนวนมากที่ครบกำหนดและใช้เซิร์ฟเวอร์ Ollama, vLLM, SGLang หรือ LM Studio ในเครื่องตัวเดียวกันที่ไม่ทำงาน จะใช้ probe ขนาดเล็กร่วมกันหนึ่งครั้ง แทนที่จะสร้างพายุคำขอ การรันที่ถูกข้ามจาก provider-preflight จะไม่เพิ่ม execution-error backoff; เปิดใช้ `failureAlert.includeSkipped` เมื่อคุณต้องการการแจ้งเตือนการข้ามซ้ำ

## การส่งมอบและผลลัพธ์

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบ fallback ไปยังเป้าหมาย หาก agent ไม่ได้ส่ง |
| `webhook`  | POST payload เหตุการณ์ที่เสร็จแล้วไปยัง URL                                |
| `none`     | ไม่มีการส่ง fallback ของ runner                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; OpenClaw ยังยอมรับรูปแบบย่อที่ Telegram เป็นเจ้าของอย่าง `-1001234567890:123` ด้วย ผู้เรียก RPC/config โดยตรงสามารถส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้ เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกตัวพิมพ์เล็กใหญ่; ใช้ ID ห้องที่ตรง exact หรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่ง announce ใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มี provider-prefix เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ cron จะ fallback ไปยังประวัติเซสชันหรือช่องทางที่กำหนดค่าไว้เพียงช่องทางเดียว เฉพาะคำนำหน้าที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือก provider หาก `delivery.channel` ระบุชัดเจน คำนำหน้าของเป้าหมายต้องระบุ provider เดียวกัน เช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธแทนที่จะปล่อยให้ WhatsApp ตีความ Telegram ID เป็นหมายเลขโทรศัพท์ คำนำหน้าประเภทเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือก provider

สำหรับงานแบบแยก การส่งแชตจะใช้ร่วมกัน หากมีเส้นทางแชต agent สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หาก agent ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้าม fallback announce มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับการตอบกลับสุดท้ายหลัง agent turn

เมื่อ agent สร้าง reminder แบบแยกจากแชตที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งแบบ live ที่เก็บรักษาไว้สำหรับเส้นทาง fallback announce คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งของ provider จะไม่ถูกสร้างขึ้นใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชตปัจจุบัน

การส่ง announce โดยนัยใช้ allowlist ของช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบและ reroute เป้าหมายที่ล้าสมัย การอนุมัติ pairing-store ของ DM ไม่ใช่ผู้รับ fallback automation; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทางเมื่องานตามกำหนดเวลาควรส่งไปยัง DM เชิงรุก

## ภาษาของผลลัพธ์

งาน Cron จะไม่อนุมานภาษาตอบกลับจากช่องทาง locale หรือข้อความก่อนหน้า
ให้ใส่กฎภาษาไว้ในข้อความหรือตemplateที่กำหนดเวลาไว้:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

สำหรับไฟล์ template ให้เก็บคำสั่งภาษาไว้ในพรอมป์ที่ render แล้ว และ
ตรวจสอบว่า placeholder เช่น `{{language}}` ถูกเติมก่อนที่งานจะรัน หาก
ผลลัพธ์ผสมหลายภาษา ให้ระบุกฎอย่างชัดเจน เช่น: "Use Chinese
for narrative text and keep technical terms in English."

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นทั่วโลกสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นต่อหนึ่งงาน
- หากไม่ได้ตั้งค่าทั้งสองรายการและงานส่งผ่าน `announce` อยู่แล้ว การแจ้งเตือนความล้มเหลวตอนนี้จะ fallback ไปยังเป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักเป็น `webhook`
- `failureAlert.includeSkipped: true` ทำให้งานหรือนโยบายแจ้งเตือน cron ทั่วโลกเลือกรับการแจ้งเตือนการรันที่ถูกข้ามซ้ำ การรันที่ถูกข้ามจะรักษาตัวนับการข้ามต่อเนื่องแยกต่างหาก ดังนั้นจึงไม่กระทบ execution-error backoff

## ตัวอย่าง CLI

<Tabs>
  <Tab title="Reminder แบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="งานแบบแยกที่เกิดซ้ำ">
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
  <Tab title="ผลลัพธ์ Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="ผลลัพธ์คำสั่ง">
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

## Webhook

Gateway สามารถเปิดเผย endpoint HTTP webhook สำหรับทริกเกอร์ภายนอก เปิดใช้ใน config:

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

โทเค็น query-string จะถูกปฏิเสธ

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    จัดคิว system event สำหรับเซสชันหลัก:

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
    รัน agent turn แบบแยก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ใน config Mapping สามารถแปลง payload ใด ๆ ให้เป็นการกระทำ `wake` หรือ `agent` ด้วย template หรือ code transform
  </Accordion>
</AccordionGroup>

<Warning>
เก็บ hook endpoint ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้ hook token เฉพาะ; อย่าใช้ gateway auth token ซ้ำ
- เก็บ `hooks.path` ไว้บน subpath เฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัด effective agent ที่ hook สามารถกำหนดเป้าหมายได้ รวมถึง agent เริ่มต้นเมื่อไม่ได้ระบุ `agentId`
- คง `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกได้
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- payload ของ hook จะถูกห่อด้วยขอบเขตความปลอดภัยโดยค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องขาเข้า Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้งาน OpenClaw hooks แล้ว, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยตัวช่วย (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้จะเขียนคอนฟิก `hooks.gmail`, เปิดใช้งานพรีเซ็ต Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway อัตโนมัติ

เมื่อมีการตั้งค่า `hooks.enabled=true` และ `hooks.gmail.account` ไว้ Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch โดยอัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อไม่ใช้งาน

### การตั้งค่าแบบครั้งเดียวด้วยตนเอง

<Steps>
  <Step title="Select the GCP project">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` จะคืนค่าหลังจากนำการรันด้วยตนเองเข้าแถวคิวแล้ว ใช้ `--wait` สำหรับ shutdown hooks, สคริปต์บำรุงรักษา หรือระบบอัตโนมัติอื่นที่ต้องบล็อกจนกว่าการรันที่เข้าคิวไว้จะเสร็จ โหมดรอจะโพล `runId` ที่คืนมากลับมาโดยตรง และออกด้วย `0` สำหรับสถานะ `ok` และค่าที่ไม่ใช่ศูนย์สำหรับ `error`, `skipped` หรือการรอหมดเวลา

เครื่องมือ agent `cron` จะคืนค่าสรุปงานแบบกระชับ (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) จาก `cron(action: "list")`; ใช้ `cron(action: "get", jobId: "...")` สำหรับนิยามงานฉบับเต็มหนึ่งรายการ ผู้เรียก Gateway โดยตรงสามารถส่ง `compact: true` ไปยัง `cron.list`; หากละไว้จะคงการตอบกลับฉบับเต็มที่มีอยู่พร้อมตัวอย่างการส่งมอบ

`openclaw cron create` เป็น alias ของ `openclaw cron add` และงานใหม่สามารถใช้กำหนดการแบบ positional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` หรือเวลา ISO) ตามด้วยพรอมป์ agent แบบ positional ใช้ `--webhook <url>` บน `cron add|create` หรือ `cron edit` เพื่อ POST เพย์โหลดการรันที่เสร็จแล้วไปยังปลายทาง HTTP การส่ง Webhook ไม่สามารถใช้ร่วมกับแฟล็กการส่งแชต เช่น `--announce`, `--channel`, `--to`, `--thread-id` หรือ `--account` ได้ บน `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` และ `--clear-account` จะยกเลิกการตั้งค่าฟิลด์เส้นทางเหล่านั้นทีละรายการ (แต่ละรายการจะถูกปฏิเสธเมื่อใช้พร้อมแฟล็กตั้งค่าที่ตรงกัน) ซึ่งแตกต่างจาก `--no-deliver` ที่ปิดการส่งสำรองของ runner

<Note>
หมายเหตุการแทนที่โมเดล:

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลได้รับอนุญาต provider/model ที่ตรงกันนั้นจะไปถึงการรัน agent แบบแยก
- หากไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- แพตช์เพย์โหลด API `cron.update` สามารถตั้งค่า `model: null` เพื่อล้างการแทนที่โมเดลงานที่จัดเก็บไว้
- `openclaw cron edit <job-id> --clear-model` จะล้างการแทนที่นั้นจาก CLI (ให้ผลเหมือนกับแพตช์ `model: null`) และไม่สามารถใช้ร่วมกับ `--model`
- เชน fallback ที่ตั้งค่าไว้ยังคงมีผล เพราะ cron `--model` เป็นโมเดลหลักของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- `openclaw cron add|edit --fallbacks ...` ตั้งค่าเพย์โหลด `fallbacks` โดยแทนที่ fallback ที่ตั้งค่าไว้สำหรับงานนั้น; `--fallbacks ""` ปิด fallback และทำให้การรันเป็นแบบเข้มงวด `openclaw cron edit <job-id> --clear-fallbacks` จะล้างการแทนที่รายงาน
- `--model` ธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่ตั้งค่าไว้ จะไม่ตกต่อไปยังโมเดลหลักของ agent เป็นเป้าหมายลองซ้ำเพิ่มเติมแบบเงียบ

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

`maxConcurrentRuns` จำกัดทั้งการ dispatch cron ตามกำหนดการและการเรียกใช้งาน agent-turn แบบแยก และมีค่าเริ่มต้นเป็น 8 agent turn ของ cron แบบแยกใช้เลนการประมวลผลเฉพาะของคิว `cron-nested` ภายใน ดังนั้นการเพิ่มค่านี้จะทำให้การรัน cron LLM ที่เป็นอิสระต่อกันคืบหน้าแบบขนาน แทนที่จะเริ่มเฉพาะ wrapper cron ชั้นนอกทีละตัว การตั้งค่านี้จะไม่ขยายเลน `nested` ที่ไม่ใช่ cron แบบใช้ร่วมกัน

`cron.store` เป็นคีย์ store เชิงตรรกะและพาธนำเข้า doctor แบบเดิม รัน `openclaw doctor --fix` เพื่อนำเข้า store JSON ที่มีอยู่เข้าสู่ SQLite และเก็บถาวรไว้ การเปลี่ยนแปลง cron ในอนาคตควรทำผ่าน CLI หรือ Gateway API

ปิดใช้งาน cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="Retry behavior">
    **การลองซ้ำแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองซ้ำสูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้งานทันที

    **การลองซ้ำแบบเกิดซ้ำ**: exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการลองซ้ำ Backoff จะรีเซ็ตหลังการรันสำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะตัดรายการเซสชันการรันแบบแยก `cron.runLog.keepLines` จำกัดแถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน; `maxBytes` ยังคงไว้เพื่อความเข้ากันได้ของคอนฟิกกับบันทึกการรันแบบไฟล์รุ่นเก่า
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
  <Accordion title="Cron not firing">
    - ตรวจสอบ env var `cron.enabled` และ `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway ทำงานต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบ timezone (`--tz`) เทียบกับ timezone ของโฮสต์
    - `reason: not-due` ในเอาต์พุตการรันหมายความว่าการรันด้วยตนเองถูกตรวจด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งสำรองของ runner agent ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าขาออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกมาหรือเป็นแบบเดิมที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้อง Matrix แยกแยะตัวพิมพ์ใหญ่เล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดยข้อมูลประจำตัว
    - หากการรันแบบแยกคืนค่าเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งขาออกโดยตรงและระงับเส้นทางสรุปสำรองที่เข้าคิวไว้ด้วย ดังนั้นจะไม่มีอะไรถูกโพสต์กลับไปยังแชต
    - หาก agent ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายแบบชัดเจน)

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่มีการใช้งานไม่ได้อิงจาก `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุก Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ gateway อาจอัปเดตแถวเซสชันสำหรับเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวแบบเดิมที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชัน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถว idle แบบเดิมที่ไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนได้นั้นเป็น baseline ของ idle

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron ที่ไม่มี `--tz` จะใช้ timezone ของโฮสต์ gateway
    - กำหนดการ `at` ที่ไม่มี timezone จะถือว่าเป็น UTC
    - Heartbeat `activeHours` ใช้การ resolve timezone ที่ตั้งค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติ](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทงานสำหรับการทำงานของ cron
- [Heartbeat](/th/gateway/heartbeat) — turn ของเซสชันหลักเป็นระยะ
- [Timezone](/th/concepts/timezone) — การกำหนดค่า timezone
