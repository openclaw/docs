---
read_when:
    - กำหนดเวลางานเบื้องหลังหรือการปลุกขึ้นมาทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจระหว่าง heartbeat และ cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการ Gateway
title: งานที่กำหนดเวลาไว้
x-i18n:
    generated_at: "2026-07-02T01:19:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron คือเครื่องจัดตารางเวลาในตัวของ Gateway โดยจะคงข้อมูลงานไว้ ปลุกเอเจนต์ในเวลาที่ถูกต้อง และสามารถส่งผลลัพธ์กลับไปยังช่องทางแชตหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron ทำงานอย่างไร

- Cron ทำงาน **ภายในกระบวนการ Gateway** (ไม่ใช่ภายในโมเดล)
- นิยามงาน สถานะขณะรัน และประวัติการรันจะคงอยู่ในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันของ OpenClaw เพื่อให้การรีสตาร์ทไม่ทำให้ตารางเวลาสูญหาย
- เมื่ออัปเกรด ให้รัน `openclaw doctor --fix` เพื่อนำเข้าไฟล์เดิม `~/.openclaw/cron/jobs.json`, `jobs-state.json` และ `runs/*.jsonl` เข้า SQLite และเปลี่ยนชื่อไฟล์เหล่านั้นด้วยส่วนต่อท้าย `.migrated` แถวงานที่มีรูปแบบผิดจะถูกข้ามจาก runtime และคัดลอกไปยัง `jobs-quarantine.json` เพื่อซ่อมหรือตรวจสอบภายหลัง
- `cron.store` ยังคงระบุคีย์ที่เก็บ cron เชิงตรรกะและเส้นทางนำเข้าของ doctor หลังนำเข้าแล้ว การแก้ไขไฟล์ JSON นั้นจะไม่เปลี่ยนงาน cron ที่ใช้งานอยู่แต่อย่างใด ให้ใช้ `openclaw cron add|edit|remove` หรือเมธอด RPC ของ Gateway cron แทน
- การดำเนินการ cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งาน agent-turn แบบแยกที่เลยกำหนดจะถูกจัดตารางใหม่ให้อยู่นอกช่วงการเชื่อมต่อช่องทาง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่ง native ยังคงตอบสนองได้ดีหลังรีสตาร์ท
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จตามค่าเริ่มต้น
- การรัน cron แบบแยกจะพยายามปิดแท็บ/กระบวนการเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` เมื่อการรันเสร็จสิ้น เพื่อให้ระบบอัตโนมัติของเบราว์เซอร์ที่แยกออกมาไม่ทิ้งกระบวนการกำพร้าไว้เบื้องหลัง
- การรัน cron แบบแยกที่ได้รับสิทธิ์ self-cleanup ของ cron แบบจำกัดยังสามารถอ่านสถานะตัวจัดตารางเวลา รายการงานปัจจุบันของตัวเองที่กรองเฉพาะตนเอง และประวัติการรันของงานนั้นได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat สามารถตรวจสอบตารางเวลาของตัวเองได้โดยไม่ต้องได้รับสิทธิ์แก้ไข cron ที่กว้างขึ้น
- การรัน cron แบบแยกยังป้องกันการตอบรับที่ล้าสมัยด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำใบ้ที่คล้ายกัน) และไม่มีการรันของ subagent ลูกหลานใดยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะส่งพรอมป์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน cron แบบแยกใช้เมตาดาต้าการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ รวมถึง wrapper `UNAVAILABLE` ของ node-host ที่ข้อความข้อผิดพลาดซ้อนอยู่ภายในเริ่มต้นด้วย `SYSTEM_RUN_DENIED` หรือ `INVALID_REQUEST` ดังนั้นคำสั่งที่ถูกบล็อกจะไม่ถูกรายงานว่าเป็นการรันสีเขียว ขณะที่ข้อความธรรมดาของผู้ช่วยจะไม่ถูกตีความว่าเป็นการปฏิเสธ
- การรัน cron แบบแยกยังถือว่าความล้มเหลวของเอเจนต์ระดับการรันเป็นข้อผิดพลาดของงาน แม้จะไม่มี payload ตอบกลับก็ตาม เพื่อให้ความล้มเหลวของโมเดล/ผู้ให้บริการเพิ่มตัวนับข้อผิดพลาดและกระตุ้นการแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเสร็จสำเร็จ
- เมื่องาน agent-turn แบบแยกถึง `timeoutSeconds` cron จะยกเลิกการรันเอเจนต์ที่อยู่เบื้องหลังและให้ช่วงเวลาสั้น ๆ สำหรับการ cleanup หากการรันไม่ระบายงานจนหมด cleanup ที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ cron จะบันทึก timeout เพื่อไม่ให้งานแชตที่เข้าคิวค้างอยู่หลังเซสชันประมวลผลที่ล้าสมัย
- หาก agent-turn แบบแยกหยุดชะงักก่อน runner เริ่มหรือก่อนการเรียกโมเดลครั้งแรก cron จะบันทึก timeout เฉพาะเฟส เช่น `setup timed out before runner start` หรือ `stalled before first model call (last phase: context-engine)` watchdog เหล่านี้ครอบคลุมผู้ให้บริการแบบฝังและผู้ให้บริการที่รองรับด้วย CLI ก่อนที่กระบวนการ CLI ภายนอกจะเริ่มจริง และถูกจำกัดแยกจากค่า `timeoutSeconds` ที่ยาว เพื่อให้ความล้มเหลวในการ cold-start/auth/context ปรากฏอย่างรวดเร็วแทนที่จะรอจนหมดงบเวลาของงานทั้งหมด
- หากคุณใช้ system cron หรือตัวจัดตารางเวลาภายนอกอื่นเพื่อรัน `openclaw agent` ให้ครอบด้วยการยกระดับ hard-kill แม้ว่า CLI จะจัดการ `SIGTERM`/`SIGINT` แล้วก็ตาม การรันที่รองรับโดย Gateway จะขอให้ Gateway ยกเลิกการรันที่รับแล้ว ส่วนการรัน fallback แบบ local และแบบฝังจะได้รับสัญญาณยกเลิกเดียวกัน สำหรับ GNU `timeout` ให้ใช้ `timeout -k 60 600 openclaw agent ...` แทน `timeout 600 ...` แบบธรรมดา ค่า `-k` คือ backstop ของ supervisor หากกระบวนการระบายงานไม่หมด สำหรับ systemd unit ให้คงรูปแบบเดียวกันโดยใช้สัญญาณหยุด `SIGTERM` พร้อมช่วง grace เช่น `TimeoutStopSec` ก่อนการ kill ขั้นสุดท้าย หากการลองใหม่ใช้ `--run-id` ซ้ำขณะที่การรัน Gateway เดิมยังทำงานอยู่ รายการซ้ำจะถูกรายงานว่าอยู่ระหว่างดำเนินการแทนที่จะเริ่มการรันที่สอง

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ cron เป็นของ runtime ก่อน และรองรับด้วยประวัติถาวรเป็นลำดับที่สอง: งาน cron ที่ทำงานอยู่จะยังคงมีชีวิตขณะที่ runtime ของ cron ยังติดตามงานนั้นว่ากำลังรันอยู่ แม้จะยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อ runtime หยุดเป็นเจ้าของงานและช่วง grace 5 นาทีหมดลง การบำรุงรักษาจะตรวจสอบบันทึกการรันที่คงอยู่และสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากประวัตินั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การ audit แบบ CLI ออฟไลน์สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงานที่กำลังทำงานอยู่ในกระบวนการของตัวเองที่ว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทตารางเวลา

| ประเภท | แฟล็ก CLI | คำอธิบาย |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp แบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`) |
| `every` | `--every` | ช่วงเวลาคงที่ |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ช่องหรือ 6 ช่อง พร้อม `--tz` ที่เป็นตัวเลือก |

timestamp ที่ไม่มี timezone จะถูกถือว่าเป็น UTC เพิ่ม `--tz America/New_York` เพื่อจัดตารางเวลาตามเวลาท้องถิ่นบนผนังนาฬิกา

นิพจน์ที่เกิดซ้ำ ณ ต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลด load spike ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างเวลาที่ระบุชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ wildcard croner จะจับคู่เมื่อฟิลด์ **ใดฟิลด์หนึ่ง** ตรงกัน ไม่ใช่ต้องตรงทั้งสองฟิลด์ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทริกเกอร์ประมาณ 5-6 ครั้งต่อเดือนแทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR ตามค่าเริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ทั้งสองเงื่อนไขเป็นจริง ให้ใช้ตัวแก้ไขวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางเวลาบนฟิลด์หนึ่งและตรวจสอบอีกฟิลด์ในพรอมป์หรือคำสั่งของงาน

## รูปแบบการดำเนินการ

| รูปแบบ | ค่า `--session` | รันใน | เหมาะที่สุดสำหรับ |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| เซสชันหลัก | `main`              | เลนปลุก cron เฉพาะ | การเตือนความจำ เหตุการณ์ระบบ |
| แบบแยก | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน งานเบื้องหลัง |
| เซสชันปัจจุบัน | `current`           | การรัน cron ที่แยกออกมา | งานเกิดซ้ำที่รับรู้ context |
| เซสชันกำหนดเอง | `session:custom-id` | การรัน cron ที่แยกออกมา | การกำหนดเป้าหมายแชต/เซสชันที่รู้จัก |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    งาน **เซสชันหลัก** จะเข้าคิวเหตุการณ์ระบบในเลนการรันที่ cron เป็นเจ้าของ และเลือกปลุก Heartbeat ได้ (`--wake now` หรือ `--wake next-heartbeat`) งานเหล่านี้สามารถใช้ context การส่งมอบล่าสุดของเซสชันหลักเป้าหมายสำหรับการตอบกลับได้ แต่จะไม่เพิ่มเทิร์น cron ตามปกติเข้าในเลนแชตมนุษย์ และไม่ขยายความสดใหม่ของการรีเซ็ตรายวัน/เมื่อ idle สำหรับเซสชันเป้าหมาย งาน **แบบแยก** จะรัน agent turn เฉพาะด้วยเซสชันใหม่ งานเซสชัน **ปัจจุบัน** และ **กำหนดเอง** (`current`, `session:xxx`) สามารถใช้แชต/เซสชันที่เลือกสำหรับ context การส่งมอบและการ seed ค่ากำหนดอย่างปลอดภัย แต่การรันแต่ละครั้งยังคงดำเนินการในเซสชัน cron ที่แยกออกมา เพื่อให้งานตามกำหนดเวลาไม่บล็อกหรือปนเปื้อน transcript ของการสนทนาสด

    เหตุการณ์ cron ของเซสชันหลักเป็นการเตือนความจำ system-event ที่สมบูรณ์ในตัวเอง เหตุการณ์เหล่านี้จะไม่รวมคำสั่ง "Read HEARTBEAT.md" จากพรอมป์ Heartbeat เริ่มต้นโดยอัตโนมัติ หากการเตือนความจำที่เกิดซ้ำควรปรึกษา `HEARTBEAT.md` ให้ระบุอย่างชัดเจนในข้อความเหตุการณ์ cron หรือในคำสั่งของเอเจนต์เอง

  </Accordion>
  <Accordion title="What 'fresh session' means for detached jobs">
    สำหรับงานแบบแยก งานเซสชันปัจจุบัน และงานเซสชันกำหนดเอง "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับการรันแต่ละครั้ง OpenClaw อาจนำค่ากำหนดที่ปลอดภัยติดไปด้วย เช่น การตั้งค่า thinking/fast/verbose, labels และการ override โมเดล/auth ที่ผู้ใช้เลือกไว้อย่างชัดเจน การรันที่แยกออกมาไม่สืบทอด context การสนทนาโดยรอบจากแถว cron ที่เก่ากว่า: การกำหนดเส้นทาง channel/group, นโยบายการส่งหรือคิว, elevation, origin หรือการผูก ACP runtime ให้ใส่สถานะงานที่เกิดซ้ำและต้องคงอยู่ในพรอมป์ ไฟล์ workspace เครื่องมือ หรือระบบที่งานนั้นดำเนินการอยู่ แทนที่จะพึ่งพา transcript แชตสดเป็นหน่วยความจำของ cron
  </Accordion>
  <Accordion title="Runtime cleanup">
    สำหรับงานแบบแยก ตอนนี้การ teardown ของ runtime รวมการ cleanup เบราว์เซอร์แบบ best-effort สำหรับเซสชัน cron นั้นด้วย ความล้มเหลวในการ cleanup จะถูกเพิกเฉยเพื่อให้ผลลัพธ์ cron จริงยังคงเป็นตัวตัดสิน

    การรัน cron แบบแยกยัง dispose อินสแตนซ์ MCP runtime ที่ bundled ใด ๆ ซึ่งสร้างขึ้นสำหรับงานผ่านเส้นทาง runtime-cleanup ที่ใช้ร่วมกัน สิ่งนี้ตรงกับวิธี teardown ไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเอง เพื่อให้งาน cron แบบแยกไม่รั่วกระบวนการลูก stdio หรือการเชื่อมต่อ MCP ที่อยู่ได้นานข้ามการรัน

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    เมื่อการรัน cron แบบแยกจัดการ subagent การส่งมอบยังเลือกผลลัพธ์สุดท้ายของลูกหลานมากกว่าข้อความชั่วคราวของ parent ที่ล้าสมัย หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจาก parent นั้นแทนการประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายตาม canonical หนึ่งครั้ง แทนที่จะเล่นซ้ำทั้ง payload ข้อความแบบสตรีม/ระหว่างกลางและคำตอบสุดท้าย สื่อและ payload Discord แบบมีโครงสร้างยังคงถูกส่งเป็น payload แยกต่างหาก เพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์ตกหล่น

  </Accordion>
</AccordionGroup>

### Payload คำสั่ง

ใช้ payload คำสั่งสำหรับสคริปต์แบบ deterministic ที่ควรรันภายในตัวจัดตารางเวลาของ Gateway โดยไม่เริ่ม agent turn แบบแยกที่รองรับด้วยโมเดล งานคำสั่งจะดำเนินการบนโฮสต์ Gateway จับ stdout/stderr บันทึกการรันในประวัติ cron และใช้โหมดการส่งมอบ `announce`, `webhook` และ `none` แบบเดียวกับงานแบบแยก

<Note>
Command cron เป็นพื้นผิวระบบอัตโนมัติของ Gateway สำหรับ operator-admin ไม่ใช่การเรียก `tools.exec` ของเอเจนต์ การสร้าง อัปเดต ลบ หรือรันงาน cron ด้วยตนเองต้องใช้ `operator.admin`; การรันคำสั่งตามตารางเวลาภายหลังจะดำเนินการภายในกระบวนการ Gateway ในฐานะระบบอัตโนมัติที่ admin เขียนไว้ นโยบาย exec ของเอเจนต์ เช่น `tools.exec.mode`, approval prompts และ allowlist เครื่องมือรายเอเจนต์ จะควบคุมเครื่องมือ exec ที่โมเดลมองเห็น ไม่ใช่ payload ของ command cron
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

`--command <shell>` จัดเก็บ `argv: ["sh", "-lc", <shell>]` ใช้ `--command-argv '["node","scripts/report.mjs"]'` เมื่อคุณต้องการการดำเนินการ argv ที่แน่นอนโดยไม่มีการแยกวิเคราะห์ของ shell ฟิลด์ตัวเลือก `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` และ `--output-max-bytes` ควบคุมสภาพแวดล้อมของกระบวนการ stdin และขอบเขตของผลลัพธ์

หาก stdout ไม่ว่าง ข้อความนั้นคือผลลัพธ์ที่ส่งมอบ หาก stdout ว่างและ stderr ไม่ว่าง stderr จะถูกส่งมอบ หากมีทั้งสองสตรีม Cron จะส่งบล็อก `stdout:` / `stderr:` ขนาดเล็ก รหัสออกเป็นศูนย์จะบันทึกการรันเป็น `ok`; การออกที่ไม่ใช่ศูนย์, สัญญาณ, หมดเวลา, หรือหมดเวลาเพราะไม่มีเอาต์พุต จะบันทึกเป็น `error` และอาจทริกเกอร์การแจ้งเตือนความล้มเหลวได้ คำสั่งที่พิมพ์เฉพาะ `NO_REPLY` จะใช้การระงับโทเค็นเงียบตามปกติของ Cron และไม่โพสต์สิ่งใดกลับไปยังแชท

### ตัวเลือกเพย์โหลดสำหรับงานที่แยกขาด

<ParamField path="--message" type="string" required>
  ข้อความพรอมป์ (จำเป็นสำหรับแบบแยกขาด)
</ParamField>
<ParamField path="--model" type="string">
  การแทนที่โมเดล; ใช้โมเดลที่อนุญาตซึ่งเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--fallbacks" type="string">
  รายการโมเดลสำรองเฉพาะงาน เช่น `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ส่ง `--fallbacks ""` สำหรับการรันแบบเข้มงวดที่ไม่มีตัวสำรอง
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  บน `cron edit` จะลบการแทนที่ตัวสำรองเฉพาะงาน เพื่อให้งานทำตามลำดับความสำคัญของตัวสำรองที่กำหนดค่าไว้ ไม่สามารถใช้ร่วมกับ `--fallbacks` ได้
</ParamField>
<ParamField path="--clear-model" type="boolean">
  บน `cron edit` จะลบการแทนที่โมเดลเฉพาะงาน เพื่อให้งานทำตามลำดับความสำคัญการเลือกโมเดล Cron ตามปกติ (การแทนที่เซสชัน Cron ที่จัดเก็บไว้หากตั้งค่าไว้ ไม่เช่นนั้นใช้โมเดลของเอเจนต์/ค่าเริ่มต้น) ไม่สามารถใช้ร่วมกับ `--model` ได้
</ParamField>
<ParamField path="--thinking" type="string">
  การแทนที่ระดับการคิด
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  บน `cron edit` จะลบการแทนที่การคิดเฉพาะงาน เพื่อให้งานทำตามลำดับความสำคัญการคิด Cron ตามปกติ ไม่สามารถใช้ร่วมกับ `--thinking` ได้
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการฉีดไฟล์บูตสแตรปของพื้นที่ทำงาน
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดเครื่องมือที่งานใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตซึ่งเลือกไว้เป็นโมเดลหลักของงานนั้น ไม่เหมือนกับการแทนที่ `/model` ของเซสชันแชท: เชนตัวสำรองที่กำหนดค่าไว้ยังคงถูกใช้เมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ร้องขอไม่ได้รับอนุญาตหรือไม่สามารถแก้ค่าได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนที่จะถอยกลับไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานอย่างเงียบ ๆ

งาน Cron ยังสามารถมี `fallbacks` ระดับเพย์โหลดได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่เชนตัวสำรองที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ในเพย์โหลด/API ของงานเมื่อคุณต้องการรัน Cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือก หากงานมี `--model` แต่ไม่มีตัวสำรองทั้งในเพย์โหลดและที่กำหนดค่าไว้ OpenClaw จะส่งการแทนที่ตัวสำรองว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของเอเจนต์ถูกเพิ่มเป็นเป้าหมายลองซ้ำเพิ่มเติมแบบซ่อนอยู่

การตรวจสอบล่วงหน้าของผู้ให้บริการภายในเครื่องจะไล่ผ่านตัวสำรองที่กำหนดค่าไว้ก่อนทำเครื่องหมายการรัน Cron เป็น `skipped`; `fallbacks: []` ทำให้เส้นทางตรวจสอบล่วงหน้านั้นเข้มงวด

ลำดับความสำคัญการเลือกโมเดลสำหรับงานที่แยกขาดคือ:

1. การแทนที่โมเดลของฮุก Gmail (เมื่อการรันมาจาก Gmail และการแทนที่นั้นได้รับอนุญาต)
2. `model` ในเพย์โหลดเฉพาะงาน
3. การแทนที่โมเดลเซสชัน Cron ที่จัดเก็บและผู้ใช้เลือกไว้
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมดเร็วทำตามการเลือกแบบไลฟ์ที่แก้ค่าได้เช่นกัน หากการกำหนดค่าโมเดลที่เลือกมี `params.fastMode` Cron แบบแยกขาดจะใช้ค่านั้นเป็นค่าเริ่มต้น การแทนที่ `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงชนะการกำหนดค่าในทั้งสองทิศทาง โหมดอัตโนมัติใช้ค่าเกณฑ์ตัด `params.fastAutoOnSeconds` ของโมเดลที่เลือกเมื่อมีอยู่ โดยค่าเริ่มต้นคือ 60 วินาที

หากการรันแบบแยกขาดเจอการส่งต่อเพื่อสลับโมเดลแบบไลฟ์ Cron จะลองซ้ำด้วยผู้ให้บริการ/โมเดลที่สลับแล้ว และคงค่าการเลือกแบบไลฟ์นั้นไว้สำหรับการรันที่ใช้งานอยู่ก่อนลองซ้ำ เมื่อการสลับมีโปรไฟล์การยืนยันตัวตนใหม่มาด้วย Cron จะคงค่าการแทนที่โปรไฟล์การยืนยันตัวตนนั้นไว้สำหรับการรันที่ใช้งานอยู่ด้วย การลองซ้ำมีขอบเขตจำกัด: หลังจากความพยายามแรกบวกการลองซ้ำจากการสลับ 2 ครั้ง Cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

ก่อนที่การรัน Cron แบบแยกขาดจะเข้าสู่ตัวรันเอเจนต์ OpenClaw จะตรวจสอบปลายทางผู้ให้บริการภายในเครื่องที่เข้าถึงได้สำหรับผู้ให้บริการ `api: "ollama"` และ `api: "openai-completions"` ที่กำหนดค่าไว้ซึ่งมี `baseUrl` เป็น local loopback, เครือข่ายส่วนตัว, หรือ `.local` หากปลายทางนั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาดผู้ให้บริการ/โมเดลที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์ปลายทางจะถูกแคชไว้ 5 นาที ดังนั้นงานที่ถึงกำหนดจำนวนมากซึ่งใช้เซิร์ฟเวอร์ Ollama, vLLM, SGLang, หรือ LM Studio ภายในเครื่องที่ล่มตัวเดียวกัน จะแชร์การตรวจสอบขนาดเล็กหนึ่งครั้งแทนที่จะสร้างพายุคำขอ การรันที่ถูกข้ามจากการตรวจสอบล่วงหน้าผู้ให้บริการจะไม่เพิ่มแบ็กออฟข้อผิดพลาดการดำเนินการ; เปิดใช้ `failureAlert.includeSkipped` เมื่อคุณต้องการการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและเอาต์พุต

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบสำรองไปยังเป้าหมาย หากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST เพย์โหลดเหตุการณ์ที่เสร็จสิ้นไปยัง URL                                |
| `none`     | ไม่มีการส่งมอบสำรองของตัวรัน                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งมอบไปยังช่อง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; OpenClaw ยังยอมรับชวเลข `-1001234567890:123` ที่ Telegram เป็นเจ้าของด้วย ผู้เรียก RPC/config โดยตรงอาจส่ง `delivery.threadId` เป็นสตริงหรือตัวเลข เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกแยะตัวพิมพ์เล็กใหญ่; ใช้ ID ห้องที่ตรงกันทุกประการหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งมอบแบบประกาศใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มีคำนำหน้าผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องก่อนที่ Cron จะถอยกลับไปใช้ประวัติเซสชันหรือช่องเดียวที่กำหนดค่าไว้ เฉพาะคำนำหน้าที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุชัดเจน คำนำหน้าของเป้าหมายต้องตั้งชื่อผู้ให้บริการเดียวกัน; ตัวอย่างเช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ แทนที่จะปล่อยให้ WhatsApp ตีความ ID Telegram เป็นหมายเลขโทรศัพท์ คำนำหน้าชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>`, และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานที่แยกขาด การส่งมอบแชทจะใช้ร่วมกัน หากมีเส้นทางแชท เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้ามการประกาศสำรอง ไม่เช่นนั้น `announce`, `webhook`, และ `none` จะควบคุมเฉพาะสิ่งที่ตัวรันทำกับคำตอบสุดท้ายหลังเทิร์นของเอเจนต์

เมื่อเอเจนต์สร้างการเตือนความจำแบบแยกขาดจากแชทที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งมอบแบบไลฟ์ที่รักษาไว้สำหรับเส้นทางประกาศสำรอง คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งมอบของผู้ให้บริการจะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชทปัจจุบัน

การส่งมอบประกาศโดยนัยใช้รายการอนุญาตของช่องที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ค้างเก่า การอนุมัติจากที่เก็บการจับคู่ DM ไม่ใช่ผู้รับการทำงานอัตโนมัติแบบสำรอง; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องเมื่องานตามกำหนดควรส่งไปยัง DM เชิงรุก

## ภาษาเอาต์พุต

งาน Cron จะไม่อนุมานภาษาตอบกลับจากช่อง โลเคล หรือข้อความก่อนหน้า
ใส่กฎภาษาไว้ในข้อความหรือเทมเพลตที่ตั้งเวลาไว้:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

สำหรับไฟล์เทมเพลต ให้คงคำสั่งภาษาไว้ในพรอมป์ที่เรนเดอร์แล้ว และ
ตรวจสอบว่าตัวแทนค่า เช่น `{{language}}` ถูกกรอกก่อนงานเริ่มทำงาน หาก
เอาต์พุตปนหลายภาษา ให้ระบุกฎให้ชัดเจน เช่น: "Use Chinese
for narrative text and keep technical terms in English."

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นแบบรายงาน
- หากไม่ได้ตั้งค่าทั้งสองรายการ และงานส่งผ่าน `announce` อยู่แล้ว การแจ้งเตือนความล้มเหลวตอนนี้จะย้อนกลับไปใช้เป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักคือ `webhook`
- `failureAlert.includeSkipped: true` เลือกให้นโยบายแจ้งเตือน cron ระดับงานหรือส่วนกลางส่งการแจ้งเตือนการรันที่ถูกข้ามซ้ำ ๆ การรันที่ถูกข้ามจะคงตัวนับการข้ามต่อเนื่องแยกต่างหาก จึงไม่ส่งผลต่อการหน่วงซ้ำหลังข้อผิดพลาดจากการดำเนินการ

## ตัวอย่าง CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

Gateway สามารถเปิดเผย HTTP webhook endpoint สำหรับทริกเกอร์ภายนอก เปิดใช้ในการกำหนดค่า:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### การตรวจสอบสิทธิ์

ทุกคำขอต้องมีโทเคน hook ผ่านส่วนหัว:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

โทเคนใน query string จะถูกปฏิเสธ

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
    รันรอบการทำงานของเอเจนต์แบบ isolated:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูกแปลงผ่าน `hooks.mappings` ในการกำหนดค่า การแมปสามารถแปลง payload ใด ๆ ให้เป็นการกระทำ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
ให้ hook endpoint อยู่หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้โทเคน hook เฉพาะ อย่านำโทเคนการยืนยันตัวตนของ gateway มาใช้ซ้ำ
- เก็บ `hooks.path` ไว้บนเส้นทางย่อยเฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดว่า hook สามารถกำหนดเป้าหมายไปยังเอเจนต์ที่มีผลตัวใดได้บ้าง รวมถึงเอเจนต์เริ่มต้นเมื่อไม่ได้ระบุ `agentId`
- คง `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการ session ที่ผู้เรียกเลือกได้
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบ session key ที่อนุญาต
- payload ของ hook จะถูกห่อหุ้มด้วยขอบเขตความปลอดภัยตามค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** CLI `gcloud`, `gog` (gogcli), เปิดใช้ hook ของ OpenClaw แล้ว, Tailscale สำหรับ endpoint HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยตัวช่วย (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้จะเขียน config `hooks.gmail`, เปิดใช้พรีเซ็ต Gmail และใช้ Tailscale Funnel สำหรับ endpoint แบบ push

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

### การตั้งค่าครั้งเดียวแบบแมนนวล

<Steps>
  <Step title="เลือกโปรเจกต์ GCP">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="สร้าง topic และให้สิทธิ์การเข้าถึง Gmail push">
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

### การแทนที่โมเดลของ Gmail

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

# รับงานที่เก็บไว้หนึ่งงานเป็น JSON
openclaw cron get <jobId>

# แสดงงานหนึ่งงาน รวมถึงเส้นทางการส่งที่ resolve แล้ว
openclaw cron show <jobId>

# แก้ไขงาน
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# บังคับรันงานตอนนี้
openclaw cron run <jobId>

# บังคับรันงานตอนนี้และรอสถานะปลายทาง
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# รันเฉพาะเมื่อถึงกำหนด
openclaw cron run <jobId> --due

# ดูประวัติการรัน
openclaw cron runs --id <jobId> --limit 50

# ดูการรันที่ระบุหนึ่งรายการ
openclaw cron runs --id <jobId> --run-id <runId>

# ลบงาน
openclaw cron remove <jobId>

# การเลือกเอเจนต์ (การตั้งค่าแบบหลายเอเจนต์)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` จะคืนค่าหลังจากเพิ่มการรันแบบแมนนวลเข้าคิว ใช้ `--wait` สำหรับ shutdown hook, สคริปต์บำรุงรักษา หรือ automation อื่นที่ต้องบล็อกจนกว่าการรันที่อยู่ในคิวจะเสร็จสิ้น โหมดรอจะ poll `runId` ที่คืนกลับมาอย่างตรงตัว; จะออกด้วย `0` สำหรับสถานะ `ok` และไม่ใช่ศูนย์สำหรับ `error`, `skipped` หรือหมดเวลารอ

เครื่องมือเอเจนต์ `cron` จะคืนสรุปงานแบบย่อ (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) จาก `cron(action: "list")`; ใช้ `cron(action: "get", jobId: "...")` สำหรับคำนิยามงานเต็มหนึ่งงาน ผู้เรียก Gateway โดยตรงสามารถส่ง `compact: true` ไปยัง `cron.list`; หากละไว้จะคง response เต็มเดิมพร้อม preview การส่ง

`openclaw cron create` เป็น alias ของ `openclaw cron add` และงานใหม่สามารถใช้ schedule แบบ positional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` หรือ timestamp แบบ ISO) ตามด้วย prompt ของเอเจนต์แบบ positional ใช้ `--webhook <url>` กับ `cron add|create` หรือ `cron edit` เพื่อ POST payload ของการรันที่เสร็จแล้วไปยัง endpoint HTTP การส่ง Webhook ไม่สามารถใช้ร่วมกับ flag การส่งแชท เช่น `--announce`, `--channel`, `--to`, `--thread-id` หรือ `--account` ได้ ใน `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` และ `--clear-account` จะยกเลิกการตั้งค่าฟิลด์ routing เหล่านั้นแยกกัน (แต่ละตัวจะถูกปฏิเสธเมื่อใช้ร่วมกับ flag ตั้งค่าที่ตรงกัน) ซึ่งแยกจาก `--no-deliver` ที่ปิดการส่ง fallback ของ runner

<Note>
หมายเหตุการแทนที่โมเดล:

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลได้รับอนุญาต provider/model นั้นจะไปถึงการรันเอเจนต์แบบ isolated ตามที่ระบุทุกประการ
- หากไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- patch payload ของ API `cron.update` สามารถตั้งค่า `model: null` เพื่อล้างการแทนที่โมเดลของงานที่เก็บไว้
- `openclaw cron edit <job-id> --clear-model` จะล้างการแทนที่นั้นจาก CLI (ผลเหมือนกับ patch `model: null`) และใช้ร่วมกับ `--model` ไม่ได้
- chain fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ `--model` ของ cron เป็น primary ของงาน ไม่ใช่การแทนที่ `/model` ของ session
- `openclaw cron add|edit --fallbacks ...` ตั้งค่า payload `fallbacks` โดยแทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `--fallbacks ""` จะปิด fallback และทำให้การรันเป็นแบบ strict `openclaw cron edit <job-id> --clear-fallbacks` จะล้างการแทนที่รายงาน
- `--model` ธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้ จะไม่ fall through ไปยัง primary ของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ

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

`maxConcurrentRuns` จำกัดทั้งการ dispatch cron ตามกำหนดเวลาและการรัน agent-turn แบบ isolated และมีค่าเริ่มต้นเป็น 8 agent turn ของ cron แบบ isolated ใช้ lane การประมวลผลเฉพาะของคิว `cron-nested` ภายใน ดังนั้นการเพิ่มค่านี้จะทำให้การรัน LLM ของ cron ที่เป็นอิสระต่อกันคืบหน้าแบบขนาน แทนที่จะเริ่มได้เฉพาะ wrapper cron ชั้นนอกเท่านั้น lane `nested` แบบไม่ใช่ cron ที่ใช้ร่วมกันจะไม่ถูกขยายด้วยการตั้งค่านี้

`cron.store` เป็นคีย์ store เชิงตรรกะและเส้นทางนำเข้าของ doctor แบบ legacy รัน `openclaw doctor --fix` เพื่อนำเข้า JSON store ที่มีอยู่เข้าสู่ SQLite และเก็บถาวรไว้; การเปลี่ยน cron ในอนาคตควรทำผ่าน CLI หรือ Gateway API

ปิดใช้ cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรม retry">
    **retry แบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry สูงสุด 3 ครั้งด้วย exponential backoff ข้อผิดพลาดถาวรจะปิดใช้ทันที

    **retry แบบเกิดซ้ำ**: exponential backoff (30 วินาทีถึง 60 นาที) ระหว่าง retry ค่า backoff จะรีเซ็ตหลังจากการรันสำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะตัดรายการ run-session แบบ isolated ออก `cron.runLog.keepLines` จำกัดจำนวนแถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน; `maxBytes` จะคงไว้เพื่อความเข้ากันได้ของ config กับ run log รุ่นเก่าที่อิงไฟล์
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
    - ตรวจสอบ `cron.enabled` และ env var `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway กำลังทำงานอย่างต่อเนื่อง
    - สำหรับ schedule ของ `cron` ให้ตรวจสอบ timezone (`--tz`) เทียบกับ timezone ของ host
    - `reason: not-due` ใน output การรันหมายความว่าการรันแบบแมนนวลถูกตรวจด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่ง">
    - โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่ง fallback ของ runner เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชทพร้อมใช้งาน
    - เป้าหมายการส่งหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าขาออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกหรือ legacy ที่มี room ID `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ room ID ของ Matrix แยกตัวพิมพ์เล็กใหญ่ แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของ channel (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดย credentials
    - หากการรันแบบ isolated คืนเฉพาะโทเคนเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งขาออกโดยตรงและระงับเส้นทางสรุปแบบเข้าคิว fallback ด้วย ดังนั้นจะไม่มีอะไรถูกโพสต์กลับไปยังแชท
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชทก่อนหน้า หรือ channel/target ที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการ rollover แบบ /new">
    - ความสดของการรีเซ็ตรายวันและเมื่อ idle ไม่ได้อิง `updatedAt`; ดู [การจัดการ session](/th/concepts/session#session-lifecycle)
    - การปลุกของ Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำ bookkeeping ของ gateway อาจอัปเดตแถว session สำหรับ routing/status แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถว legacy ที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้คืน `sessionStartedAt` จาก header session ใน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถว idle แบบ legacy ที่ไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนนี้เป็น baseline ของ idle

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับ timezone">
    - Cron ที่ไม่มี `--tz` จะใช้ timezone ของ host gateway
    - schedule แบบ `at` ที่ไม่มี timezone จะถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การ resolve timezone ที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Automation](/th/automation) — กลไก automation ทั้งหมดโดยสรุป
- [Background Tasks](/th/automation/tasks) — ledger งานสำหรับการดำเนินการ cron
- [Heartbeat](/th/gateway/heartbeat) — turn ของ main-session เป็นระยะ
- [Timezone](/th/concepts/timezone) — การกำหนดค่า timezone
