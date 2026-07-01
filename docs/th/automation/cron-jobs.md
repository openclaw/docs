---
read_when:
    - การกำหนดเวลางานพื้นหลังหรือการปลุกขึ้นมา
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการของ Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-07-01T08:44:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron เป็นตัวกำหนดเวลาที่มีมาให้ใน Gateway โดยจะคงงานไว้ ปลุกเอเจนต์เมื่อถึงเวลาที่ถูกต้อง และสามารถส่งผลลัพธ์กลับไปยังช่องแชทหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการเตือนครั้งเดียว">
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

- Cron ทำงาน **ภายในโปรเซส Gateway** (ไม่ใช่ภายในโมเดล)
- นิยามงาน สถานะรันไทม์ และประวัติการรันจะคงอยู่ในฐานข้อมูลสถานะ SQLite แบบใช้ร่วมกันของ OpenClaw เพื่อไม่ให้การรีสตาร์ตทำให้กำหนดการสูญหาย
- เมื่ออัปเกรด ให้รัน `openclaw doctor --fix` เพื่อนำเข้าไฟล์เดิม `~/.openclaw/cron/jobs.json`, `jobs-state.json` และ `runs/*.jsonl` เข้าสู่ SQLite แล้วเปลี่ยนชื่อไฟล์เหล่านั้นด้วยส่วนต่อท้าย `.migrated` แถวงานที่ผิดรูปแบบจะถูกข้ามจากรันไทม์และคัดลอกไปยัง `jobs-quarantine.json` เพื่อซ่อมแซมหรือตรวจสอบในภายหลัง
- `cron.store` ยังคงเป็นชื่อคีย์ที่เก็บ Cron เชิงตรรกะและเส้นทางนำเข้าของ doctor หลังนำเข้าแล้ว การแก้ไขไฟล์ JSON นั้นจะไม่เปลี่ยนงาน Cron ที่ใช้งานอยู่อีกต่อไป ให้ใช้ `openclaw cron add|edit|remove` หรือเมธอด RPC ของ Cron ใน Gateway แทน
- การดำเนินการ Cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งาน agent-turn แบบแยกที่เลยกำหนดจะถูกจัดกำหนดการใหม่ให้ออกจากช่วงเชื่อมต่อช่องทาง แทนการเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จตามค่าเริ่มต้น
- การรัน Cron แบบแยกจะพยายามปิดแท็บ/โปรเซสของเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของงานนั้นเมื่อการรันเสร็จสิ้น เพื่อไม่ให้งานอัตโนมัติของเบราว์เซอร์ที่แยกออกไปทิ้งโปรเซสกำพร้าไว้
- การรัน Cron แบบแยกที่ได้รับสิทธิ์การล้างข้อมูลตนเองของ Cron แบบจำกัดยังสามารถอ่านสถานะตัวกำหนดเวลา รายการงานปัจจุบันของตัวเองที่ถูกกรองเฉพาะตนเอง และประวัติการรันของงานนั้นได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat ตรวจดูตารางเวลาของตัวเองได้โดยไม่ต้องได้สิทธิ์แก้ไข Cron ที่กว้างขึ้น
- การรัน Cron แบบแยกยังป้องกันการตอบกลับยืนยันที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะระหว่างทาง (`on it`, `pulling everything together` และคำใบ้คล้ายกัน) และไม่มีการรัน subagent สืบทอดที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะพร้อมต์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน Cron แบบแยกใช้เมทาดาทาการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ รวมถึงตัวครอบ `UNAVAILABLE` ของ node-host ที่ข้อความข้อผิดพลาดซ้อนอยู่เริ่มด้วย `SYSTEM_RUN_DENIED` หรือ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันที่สำเร็จ ขณะเดียวกันก็ไม่ตีความร้อยแก้วทั่วไปของผู้ช่วยว่าเป็นการปฏิเสธ
- การรัน Cron แบบแยกยังถือว่าความล้มเหลวของเอเจนต์ในระดับการรันเป็นข้อผิดพลาดของงาน แม้ไม่มีเพย์โหลดตอบกลับถูกสร้างขึ้น เพื่อให้ความล้มเหลวของโมเดล/ผู้ให้บริการเพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนการล้างงานว่าเสร็จสมบูรณ์
- เมื่องาน agent-turn แบบแยกถึง `timeoutSeconds` Cron จะยกเลิกการรันเอเจนต์ที่อยู่ข้างใต้และให้ช่วงเวลาสั้น ๆ สำหรับการล้างข้อมูล หากการรันไม่ระบายออก การล้างข้อมูลที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ Cron จะบันทึกการหมดเวลา เพื่อไม่ให้งานแชทที่อยู่ในคิวค้างอยู่หลังเซสชันประมวลผลที่ค้างเก่า
- หาก agent-turn แบบแยกหยุดค้างก่อน runner เริ่มหรือก่อนการเรียกโมเดลครั้งแรก Cron จะบันทึกการหมดเวลาที่เจาะจงตามเฟส เช่น `setup timed out before runner start` หรือ `stalled before first model call (last phase: context-engine)` watchdog เหล่านี้ครอบคลุมผู้ให้บริการแบบฝังและผู้ให้บริการที่อาศัย CLI ก่อนที่โปรเซส CLI ภายนอกจะเริ่มจริง และถูกจำกัดแยกจากค่า `timeoutSeconds` ที่ยาว เพื่อให้ความล้มเหลวจาก cold-start/auth/context ปรากฏอย่างรวดเร็วแทนการรอจนเต็มงบเวลาของงาน
- หากคุณใช้ system cron หรือตัวกำหนดเวลาภายนอกอื่นเพื่อรัน `openclaw agent` ให้ครอบด้วยการยกระดับเป็น hard-kill แม้ว่า CLI จะจัดการ `SIGTERM`/`SIGINT` แล้วก็ตาม การรันที่ใช้ Gateway จะขอให้ Gateway ยกเลิกการรันที่รับไว้ ส่วนการรันแบบ local และ fallback แบบฝังจะได้รับสัญญาณยกเลิกเดียวกัน สำหรับ GNU `timeout` ให้ใช้ `timeout -k 60 600 openclaw agent ...` แทน `timeout 600 ...` แบบธรรมดา ค่า `-k` คือ backstop ของตัวควบคุมหากโปรเซสระบายออกไม่ได้ สำหรับ systemd units ให้คงรูปแบบเดียวกันโดยใช้สัญญาณหยุด `SIGTERM` พร้อมหน้าต่างผ่อนผัน เช่น `TimeoutStopSec` ก่อนการ kill สุดท้าย หากการลองซ้ำใช้ `--run-id` ซ้ำขณะที่การรัน Gateway เดิมยังทำงานอยู่ รายการที่ซ้ำจะถูกรายงานว่าอยู่ระหว่างดำเนินการแทนการเริ่มรันครั้งที่สอง

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ Cron เป็นของรันไทม์ก่อน และมีประวัติถาวรรองรับเป็นลำดับถัดไป: งาน Cron ที่ทำงานอยู่จะยังคง live ขณะที่รันไทม์ Cron ยังติดตามว่างานนั้นกำลังรันอยู่ แม้ยังมีแถวเซสชันลูกเก่าหลงเหลืออยู่ก็ตาม เมื่อรันไทม์หยุดเป็นเจ้าของงานและหน้าต่างผ่อนผัน 5 นาทีหมดอายุ การบำรุงรักษาจะตรวจสอบบันทึกการรันและสถานะงานที่คงไว้สำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกปิดจากข้อมูลนั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบ CLI แบบออฟไลน์สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงานที่ใช้งานอยู่ในโปรเซสของตัวเองซึ่งว่างเปล่าเป็นหลักฐานว่าการรัน Cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทกำหนดการ

| ชนิด    | แฟล็ก CLI | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | ประทับเวลาครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ Cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่เลือกได้ |

ประทับเวลาที่ไม่มีเขตเวลาจะถือว่าเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดกำหนดการตามเวลานาฬิกาท้องถิ่น

นิพจน์ที่เกิดซ้ำตรงต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลดโหลดพุ่งสูง ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างที่ระบุชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ไวลด์การ์ด croner จะจับคู่เมื่อฟิลด์ **ใดฟิลด์หนึ่ง** ตรงกัน — ไม่ใช่ต้องตรงทั้งสองฟิลด์ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

การทำงานนี้จะเกิดขึ้นประมาณ 5–6 ครั้งต่อเดือน แทนที่จะเป็น 0–1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ตรงทั้งสองเงื่อนไข ให้ใช้ตัวปรับวันในสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือกำหนดตารางตามฟิลด์หนึ่ง แล้วตรวจอีกฟิลด์ในพรอมป์หรือคำสั่งของงาน

## รูปแบบการดำเนินการ

| รูปแบบ           | ค่า `--session`     | ทำงานใน                  | เหมาะที่สุดสำหรับ                  |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก       | `main`              | เลนปลุก cron เฉพาะ       | การเตือนความจำ, เหตุการณ์ระบบ      |
| แยกอิสระ         | `isolated`          | `cron:<jobId>` เฉพาะ     | รายงาน, งานเบื้องหลัง              |
| เซสชันปัจจุบัน   | `current`           | ผูกไว้ตอนสร้าง           | งานซ้ำที่อิงบริบท                 |
| เซสชันกำหนดเอง   | `session:custom-id` | เซสชันมีชื่อแบบคงอยู่     | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ     |

<AccordionGroup>
  <Accordion title="เซสชันหลักเทียบกับแบบแยกอิสระและแบบกำหนดเอง">
    งาน **เซสชันหลัก** จะจัดคิวเหตุการณ์ระบบเข้าในเลนการทำงานที่ cron เป็นเจ้าของ และอาจปลุก heartbeat ได้ (`--wake now` หรือ `--wake next-heartbeat`) งานเหล่านี้สามารถใช้บริบทการส่งล่าสุดของเซสชันหลักเป้าหมายสำหรับการตอบกลับได้ แต่จะไม่ผนวกเทิร์น cron ตามปกติเข้ากับเลนแชทของมนุษย์ และจะไม่ขยายความสดใหม่ของการรีเซ็ตรายวัน/เมื่อว่างสำหรับเซสชันเป้าหมาย งาน **แยกอิสระ** จะรันเทิร์นเอเจนต์เฉพาะด้วยเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทไว้ข้ามการรัน ทำให้ทำเวิร์กโฟลว์อย่างสแตนด์อัปรายวันที่ต่อยอดจากสรุปก่อนหน้าได้

    เหตุการณ์ cron ของเซสชันหลักเป็นการเตือนความจำแบบเหตุการณ์ระบบที่จบในตัวเอง เหตุการณ์เหล่านี้
    จะไม่รวมคำสั่ง "อ่าน
    HEARTBEAT.md" ของพรอมป์ heartbeat เริ่มต้นโดยอัตโนมัติ หากการเตือนความจำที่เกิดซ้ำควรอ่าน
    `HEARTBEAT.md` ให้ระบุอย่างชัดเจนในข้อความเหตุการณ์ cron หรือในคำสั่งของเอเจนต์เอง

  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแยกอิสระ">
    สำหรับงานแยกอิสระ "เซสชันใหม่" หมายถึง id ทรานสคริปต์/เซสชันใหม่สำหรับแต่ละการรัน OpenClaw อาจพกพาค่ากำหนดที่ปลอดภัย เช่น การตั้งค่า thinking/fast/verbose, ป้ายกำกับ และการ override โมเดล/การยืนยันตัวตนที่ผู้ใช้เลือกอย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว cron เก่า ได้แก่ การกำหนดเส้นทางช่องทาง/กลุ่ม, นโยบายการส่งหรือการจัดคิว, การยกระดับสิทธิ์, แหล่งกำเนิด หรือการผูก runtime ของ ACP ใช้ `current` หรือ `session:<id>` เมื่องานที่เกิดซ้ำควรตั้งใจต่อยอดจากบริบทการสนทนาเดียวกัน
  </Accordion>
  <Accordion title="การล้าง runtime">
    สำหรับงานแยกอิสระ ตอนนี้การรื้อถอน runtime รวมถึงการล้างเบราว์เซอร์แบบพยายามให้ดีที่สุดสำหรับเซสชัน cron นั้นด้วย ระบบจะมองข้ามความล้มเหลวในการล้าง เพื่อให้ผล cron จริงยังเป็นผลที่มีผลบังคับ

    การรัน cron แบบแยกอิสระยัง dispose อินสแตนซ์ runtime ของ MCP ที่บันเดิลไว้และสร้างขึ้นสำหรับงานผ่านเส้นทางล้าง runtime ร่วมด้วย สิ่งนี้ตรงกับวิธีรื้อถอนไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน cron แบบแยกอิสระจะไม่ปล่อยให้โปรเซสลูก stdio หรือการเชื่อมต่อ MCP ที่อยู่นานรั่วข้ามการรัน

  </Accordion>
  <Accordion title="การส่งมอบของซับเอเจนต์และ Discord">
    เมื่อการรัน cron แบบแยกอิสระจัดการซับเอเจนต์ การส่งมอบจะเลือกเอาต์พุตสุดท้ายของผู้สืบทอดแทนข้อความระหว่างทางของพาเรนต์ที่ค้างอยู่ด้วย หากผู้สืบทอดยังทำงานอยู่ OpenClaw จะระงับการอัปเดตบางส่วนของพาเรนต์นั้นแทนการประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายตามแบบแผนหนึ่งครั้ง แทนการเล่นซ้ำทั้งเพย์โหลดข้อความที่สตรีม/ระหว่างทางและคำตอบสุดท้าย สื่อและเพย์โหลด Discord แบบมีโครงสร้างยังคงถูกส่งเป็นเพย์โหลดแยกต่างหาก เพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์ถูกทิ้ง

  </Accordion>
</AccordionGroup>

### เพย์โหลดคำสั่ง

ใช้เพย์โหลดคำสั่งสำหรับสคริปต์เชิงกำหนดผลที่ควรรันภายในตัวจัดตารางของ Gateway โดยไม่เริ่มเทิร์นเอเจนต์แยกอิสระที่มีโมเดลรองรับ งานคำสั่งจะดำเนินการบนโฮสต์ Gateway, จับเอาต์พุตมาตรฐาน/ข้อผิดพลาดมาตรฐาน, บันทึกการรันในประวัติ cron และใช้โหมดการส่งมอบ `announce`, `webhook` และ `none` แบบเดียวกับงานแยกอิสระ

<Note>
cron คำสั่งเป็นพื้นผิวอัตโนมัติของ Gateway สำหรับผู้ดูแลโอเปอเรเตอร์ ไม่ใช่การเรียก
`tools.exec` ของเอเจนต์ การสร้าง อัปเดต ลบ หรือรันงาน cron ด้วยตนเอง
ต้องใช้ `operator.admin`; การรันคำสั่งตามกำหนดการในภายหลังจะดำเนินการภายในโปรเซส
Gateway ในฐานะระบบอัตโนมัติที่ผู้ดูแลเขียนไว้ นโยบาย exec ของเอเจนต์ เช่น
`tools.exec.mode`, พรอมป์ขออนุมัติ และรายการอนุญาตเครื่องมือต่อเอเจนต์ จะกำกับ
เครื่องมือ exec ที่โมเดลมองเห็น ไม่ใช่เพย์โหลด cron คำสั่ง
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

`--command <shell>` จะเก็บ `argv: ["sh", "-lc", <shell>]` ใช้ `--command-argv '["node","scripts/report.mjs"]'` เมื่อต้องการรัน argv อย่างแม่นยำโดยไม่มีการแยกวิเคราะห์ของ shell ฟิลด์เสริม `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` และ `--output-max-bytes` ใช้ควบคุมสภาพแวดล้อมของโปรเซส, stdin และขอบเขตเอาต์พุต

หาก stdout ไม่ว่าง ข้อความนั้นคือผลลัพธ์ที่ส่งมอบ หาก stdout ว่างและ stderr ไม่ว่าง ระบบจะส่งมอบ stderr หากมีทั้งสองสตรีม cron จะส่งมอบบล็อก `stdout:` / `stderr:` ขนาดเล็ก exit code เป็นศูนย์จะบันทึกการรันเป็น `ok`; exit ที่ไม่เป็นศูนย์, signal, timeout หรือ no-output timeout จะบันทึกเป็น `error` และสามารถทริกเกอร์การแจ้งเตือนความล้มเหลวได้ คำสั่งที่พิมพ์เฉพาะ `NO_REPLY` จะใช้การระงับ silent-token ปกติของ cron และไม่โพสต์อะไรกลับไปยังแชต

### ตัวเลือก payload สำหรับงานแบบแยก

<ParamField path="--message" type="string" required>
  ข้อความ prompt (จำเป็นสำหรับแบบแยก)
</ParamField>
<ParamField path="--model" type="string">
  การแทนที่โมเดล; ใช้โมเดลที่อนุญาตซึ่งเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--fallbacks" type="string">
  รายการโมเดล fallback ต่อหนึ่งงาน ตัวอย่างเช่น `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5` ส่ง `--fallbacks ""` สำหรับการรันแบบเข้มงวดที่ไม่มี fallback
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  ใน `cron edit` จะลบการแทนที่ fallback ต่อหนึ่งงาน เพื่อให้งานทำตามลำดับ fallback ที่กำหนดค่าไว้ ไม่สามารถใช้ร่วมกับ `--fallbacks` ได้
</ParamField>
<ParamField path="--clear-model" type="boolean">
  ใน `cron edit` จะลบการแทนที่โมเดลต่อหนึ่งงาน เพื่อให้งานทำตามลำดับการเลือกโมเดลปกติของ cron (การแทนที่ cron-session ที่จัดเก็บไว้ถ้าตั้งค่าไว้ มิฉะนั้นใช้โมเดลของ agent/default) ไม่สามารถใช้ร่วมกับ `--model` ได้
</ParamField>
<ParamField path="--thinking" type="string">
  การแทนที่ระดับ Thinking
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  ใน `cron edit` จะลบการแทนที่ thinking ต่อหนึ่งงาน เพื่อให้งานทำตามลำดับ thinking ปกติของ cron ไม่สามารถใช้ร่วมกับ `--thinking` ได้
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการ inject ไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดเครื่องมือที่งานสามารถใช้ได้ ตัวอย่างเช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตซึ่งเลือกไว้เป็นโมเดลหลักของงานนั้น ไม่เหมือนกับการแทนที่ `/model` ของ chat-session: โซ่ fallback ที่กำหนดค่าไว้ยังคงมีผลเมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ขอไม่ได้รับอนุญาตหรือไม่สามารถ resolve ได้ cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนที่จะ fallback ไปยังการเลือกโมเดล agent/default ของงานอย่างเงียบ ๆ

งาน Cron ยังสามารถมี `fallbacks` ระดับ payload ได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่โซ่ fallback ที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ใน payload/API ของงานเมื่อคุณต้องการการรัน cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือกเท่านั้น หากงานมี `--model` แต่ไม่มี fallback ทั้งใน payload และที่กำหนดค่าไว้ OpenClaw จะส่งการแทนที่ fallback ว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของ agent ถูกเพิ่มเป็นเป้าหมาย retry พิเศษที่ซ่อนอยู่

การตรวจ preflight ของ local-provider จะไล่ตรวจ fallback ที่กำหนดค่าไว้ก่อนทำเครื่องหมายการรัน cron เป็น `skipped`; `fallbacks: []` ทำให้เส้นทาง preflight นั้นเข้มงวด

ลำดับการเลือกโมเดลสำหรับงานแบบแยกคือ:

1. การแทนที่โมเดลของ Gmail hook (เมื่อการรันมาจาก Gmail และการแทนที่นั้นได้รับอนุญาต)
2. `model` ใน payload ต่อหนึ่งงาน
3. การแทนที่โมเดล cron session ที่จัดเก็บไว้ซึ่งผู้ใช้เลือก
4. การเลือกโมเดล agent/default

โหมดเร็วจะทำตามการเลือก live ที่ resolve แล้วเช่นกัน หาก config ของโมเดลที่เลือกมี `params.fastMode` cron แบบแยกจะใช้ค่านั้นเป็นค่าเริ่มต้น การแทนที่ `fastMode` ของ session ที่จัดเก็บไว้ยังคงชนะ config ได้ทั้งสองทิศทาง โหมดอัตโนมัติจะใช้ cutoff `params.fastAutoOnSeconds` ของโมเดลที่เลือกเมื่อมีอยู่ โดยมีค่าเริ่มต้นเป็น 60 วินาที

หากการรันแบบแยกพบ live model-switch handoff, cron จะ retry ด้วย provider/model ที่สลับแล้ว และ persist การเลือก live นั้นสำหรับการรันที่ active ก่อน retry เมื่อการสลับมี auth profile ใหม่มาด้วย cron จะ persist การแทนที่ auth profile นั้นสำหรับการรันที่ active ด้วย จำนวน retry มีขอบเขต: หลังจากความพยายามเริ่มต้นรวมกับ switch retry อีก 2 ครั้ง cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

ก่อนที่การรัน cron แบบแยกจะเข้าสู่ agent runner, OpenClaw จะตรวจ endpoint ของ local provider ที่เข้าถึงได้สำหรับ provider `api: "ollama"` และ `api: "openai-completions"` ที่กำหนดค่าไว้ ซึ่ง `baseUrl` เป็น loopback, private-network หรือ `.local` หาก endpoint นั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาด provider/model ที่ชัดเจน แทนที่จะเริ่ม model call ผลลัพธ์ endpoint จะถูกแคชไว้ 5 นาที ดังนั้นงานจำนวนมากที่ถึงกำหนดซึ่งใช้เซิร์ฟเวอร์ Ollama, vLLM, SGLang หรือ LM Studio ในเครื่องตัวเดียวกันที่ล่ม จะใช้ probe ขนาดเล็กร่วมกันหนึ่งครั้ง แทนที่จะสร้าง request storm การรันที่ถูกข้ามจาก provider-preflight จะไม่เพิ่ม execution-error backoff; เปิดใช้ `failureAlert.includeSkipped` เมื่อคุณต้องการการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและเอาต์พุต

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งมอบข้อความสุดท้ายแบบ fallback ไปยังเป้าหมายหาก agent ไม่ได้ส่ง |
| `webhook`  | POST payload เหตุการณ์ที่เสร็จสิ้นไปยัง URL                                |
| `none`     | ไม่มีการส่งมอบ fallback ของ runner                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งมอบไปยัง channel สำหรับหัวข้อ forum ของ Telegram ให้ใช้ `-1001234567890:topic:123`; OpenClaw ยังยอมรับ shorthand `-1001234567890:123` ที่ Telegram เป็นเจ้าของด้วย ผู้เรียก Direct RPC/config อาจส่ง `delivery.threadId` เป็น string หรือ number ได้ เป้าหมาย Slack/Discord/Mattermost ควรใช้ prefix ที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix คำนึงถึงตัวพิมพ์ใหญ่เล็ก; ใช้ ID ห้องที่ตรงเป๊ะหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อ announce delivery ใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มี prefix provider เช่น `telegram:123` สามารถเลือก channel ก่อนที่ cron จะ fallback ไปยังประวัติ session หรือ channel ที่กำหนดค่าไว้เพียงรายการเดียว เฉพาะ prefix ที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็น selector ของ provider หาก `delivery.channel` ระบุไว้อย่างชัดเจน prefix ของเป้าหมายต้องระบุ provider เดียวกัน เช่น `channel: "whatsapp"` กับ `to: "telegram:123"` จะถูกปฏิเสธ แทนที่จะปล่อยให้ WhatsApp ตีความ Telegram ID เป็นหมายเลขโทรศัพท์ prefix ของชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ channel เป็นเจ้าของ ไม่ใช่ selector ของ provider

สำหรับงานแบบแยก การส่งมอบแชตเป็นแบบ shared หากมี route แชตพร้อมใช้งาน agent สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หาก agent ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้าม fallback announce มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับคำตอบสุดท้ายหลังจาก agent turn

เมื่อ agent สร้างการเตือนความจำแบบแยกจากแชตที่ active, OpenClaw จะจัดเก็บเป้าหมายการส่งมอบ live ที่เก็บรักษาไว้สำหรับ route fallback announce คีย์ session ภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งมอบของ provider จะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชตปัจจุบันพร้อมใช้งาน

การส่งมอบ announce โดยนัยใช้ allowlist ของ channel ที่กำหนดค่าไว้เพื่อตรวจสอบและ reroute เป้าหมายเก่า การอนุมัติ pairing-store ของ DM ไม่ใช่ผู้รับ fallback automation; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของ channel เมื่องานที่ตั้งเวลาไว้ควรส่งไปยัง DM เชิงรุก

## ภาษาของเอาต์พุต

งาน Cron จะไม่อนุมานภาษาของคำตอบจาก channel, locale หรือข้อความก่อนหน้า
ใส่กฎภาษาไว้ในข้อความหรือ template ที่ตั้งเวลาไว้:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

สำหรับไฟล์เทมเพลต ให้คงคำสั่งเรื่องภาษาไว้ในพรอมต์ที่เรนเดอร์แล้ว และ
ตรวจสอบว่ามีการเติมค่าตัวแทน เช่น `{{language}}` ก่อนที่งานจะทำงาน หาก
เอาต์พุตมีหลายภาษาปะปนกัน ให้ระบุกฎให้ชัดเจน เช่น: "ใช้ภาษาจีน
สำหรับข้อความบรรยาย และคงคำศัพท์ทางเทคนิคเป็นภาษาอังกฤษ"

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นเป็นรายงาน
- หากไม่ได้ตั้งค่าทั้งสองรายการ และงานส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมายประกาศหลักนั้น
- รองรับ `delivery.failureDestination` เฉพาะในงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักจะเป็น `webhook`
- `failureAlert.includeSkipped: true` เลือกให้งานหรือนโยบายแจ้งเตือน Cron ส่วนกลางส่งการแจ้งเตือนการรันที่ถูกข้ามซ้ำ ๆ การรันที่ถูกข้ามจะมีตัวนับการข้ามต่อเนื่องแยกต่างหาก จึงไม่กระทบต่อ backoff ของข้อผิดพลาดการดำเนินการ

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

Gateway สามารถเปิดเผยปลายทาง HTTP webhook สำหรับทริกเกอร์ภายนอกได้ เปิดใช้ในการกำหนดค่า:

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

ทุกคำขอต้องมีโทเค็นของ hook ผ่านส่วนหัว:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

โทเค็นใน query string จะถูกปฏิเสธ

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    เพิ่มเหตุการณ์ระบบเข้าคิวสำหรับเซสชันหลัก:

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
    เรียกใช้รอบการทำงานของ agent แบบ isolated:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ในการกำหนดค่า Mappings สามารถแปลง payload ใด ๆ ให้เป็นการกระทำ `wake` หรือ `agent` ได้ด้วยเทมเพลตหรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้โทเค็นฮุกเฉพาะ อย่าใช้โทเค็นยืนยันตัวตนของ Gateway ซ้ำ
- เก็บ `hooks.path` ไว้บนเส้นทางย่อยเฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดว่าเอเจนต์ที่มีผลจริงตัวใดที่ฮุกสามารถกำหนดเป้าหมายได้ รวมถึงเอเจนต์เริ่มต้นเมื่อไม่ได้ระบุ `agentId`
- คง `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกเอง
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- เพย์โหลดของฮุกถูกครอบด้วยขอบเขตความปลอดภัยโดยค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้ฮุก OpenClaw, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียนการกำหนดค่า `hooks.gmail` เปิดใช้พรีเซ็ต Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่มต้น Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อไม่เข้าร่วม

### การตั้งค่าแบบครั้งเดียวด้วยตนเอง

<Steps>
  <Step title="Select the GCP project">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของไคลเอนต์ OAuth ที่ `gog` ใช้:

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

`openclaw cron run <jobId>` จะคืนค่าหลังจากเพิ่มการรันด้วยตนเองเข้าคิว ใช้ `--wait` สำหรับฮุกปิดระบบ สคริปต์บำรุงรักษา หรือระบบอัตโนมัติอื่นที่ต้องบล็อกจนกว่าการรันที่อยู่ในคิวจะเสร็จ โหมดรอจะโพล `runId` ที่คืนมาอย่างเจาะจง โดยออกด้วย `0` สำหรับสถานะ `ok` และออกด้วยค่าที่ไม่ใช่ศูนย์สำหรับ `error`, `skipped` หรือการรอหมดเวลา

เครื่องมือ `cron` ของเอเจนต์จะคืนสรุปงานแบบย่อ (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) จาก `cron(action: "list")`; ใช้ `cron(action: "get", jobId: "...")` สำหรับคำนิยามงานแบบเต็มหนึ่งรายการ ผู้เรียก Gateway โดยตรงสามารถส่ง `compact: true` ไปยัง `cron.list`; หากละไว้จะคงการตอบกลับแบบเต็มที่มีอยู่พร้อมตัวอย่างการส่งมอบ

`openclaw cron create` เป็น alias ของ `openclaw cron add` และงานใหม่สามารถใช้กำหนดการแบบ positional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` หรือ timestamp ISO) ตามด้วยพรอมป์เอเจนต์แบบ positional ใช้ `--webhook <url>` กับ `cron add|create` หรือ `cron edit` เพื่อ POST เพย์โหลดการรันที่เสร็จแล้วไปยังปลายทาง HTTP การส่งมอบ Webhook ไม่สามารถใช้ร่วมกับแฟล็กการส่งมอบแชต เช่น `--announce`, `--channel`, `--to`, `--thread-id` หรือ `--account` ได้ บน `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` และ `--clear-account` จะยกเลิกการตั้งค่าฟิลด์เส้นทางเหล่านั้นทีละรายการ (แต่ละรายการจะถูกปฏิเสธหากใช้ร่วมกับแฟล็กตั้งค่าที่ตรงกัน) ซึ่งแตกต่างจาก `--no-deliver` ที่ปิดใช้งานการส่งมอบสำรองของ runner

<Note>
หมายเหตุการแทนที่โมเดล:

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่เลือกของงาน
- หากอนุญาตโมเดลนั้น provider/model ที่ตรงกันจะไปถึงการรันเอเจนต์แบบแยก
- หากไม่อนุญาตหรือแก้ไขค่าไม่ได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- แพตช์เพย์โหลด API `cron.update` สามารถตั้งค่า `model: null` เพื่อล้างการแทนที่โมเดลที่จัดเก็บไว้ของงาน
- `openclaw cron edit <job-id> --clear-model` จะล้างการแทนที่นั้นจาก CLI (ผลเหมือนกับแพตช์ `model: null`) และใช้ร่วมกับ `--model` ไม่ได้
- โซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ Cron `--model` เป็นโมเดลหลักของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- `openclaw cron add|edit --fallbacks ...` ตั้งค่าเพย์โหลด `fallbacks` โดยแทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `--fallbacks ""` ปิดใช้งาน fallback และทำให้การรันเข้มงวด `openclaw cron edit <job-id> --clear-fallbacks` จะล้างการแทนที่รายงาน
- `--model` เปล่า ๆ ที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้ จะไม่ไหลต่อไปยังโมเดลหลักของเอเจนต์เป็นเป้าหมายลองซ้ำเพิ่มเติมแบบเงียบ ๆ

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

`maxConcurrentRuns` จำกัดทั้งการส่ง Cron ตามกำหนดเวลาและการประมวลผลเทิร์นเอเจนต์แบบแยก และมีค่าเริ่มต้นเป็น 8 เทิร์นเอเจนต์ Cron แบบแยกใช้เลนประมวลผล `cron-nested` เฉพาะของคิวภายใน ดังนั้นการเพิ่มค่านี้ทำให้การรัน LLM ของ Cron ที่เป็นอิสระต่อกันคืบหน้าแบบขนานได้ แทนที่จะเริ่มเฉพาะ wrapper Cron ชั้นนอกของแต่ละงาน เลน `nested` แบบไม่ใช่ Cron ที่ใช้ร่วมกันจะไม่ถูกขยายด้วยการตั้งค่านี้

`cron.store` เป็นคีย์ที่เก็บเชิงตรรกะและเส้นทางนำเข้า doctor แบบเก่า รัน `openclaw doctor --fix` เพื่อนำเข้าที่เก็บ JSON ที่มีอยู่ไปยัง SQLite และเก็บถาวรไว้; การเปลี่ยนแปลง Cron ในอนาคตควรทำผ่าน CLI หรือ Gateway API

ปิดใช้งาน Cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="Retry behavior">
    **การลองซ้ำแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองซ้ำได้สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้งานทันที

    **การลองซ้ำแบบเกิดซ้ำ**: exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการลองซ้ำ Backoff จะรีเซ็ตหลังจากการรันสำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะตัดรายการเซสชันการรันแบบแยกออก `cron.runLog.keepLines` จำกัดแถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน; `maxBytes` ถูกเก็บไว้เพื่อความเข้ากันได้ของการกำหนดค่ากับบันทึกการรันแบบไฟล์รุ่นเก่า
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
    - ตรวจสอบตัวแปรสภาพแวดล้อม `cron.enabled` และ `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway ทำงานอย่างต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบ timezone (`--tz`) เทียบกับ timezone ของโฮสต์
    - `reason: not-due` ในเอาต์พุตการรันหมายความว่าการรันด้วยตนเองถูกตรวจด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - โหมดการส่งมอบ `none` หมายความว่าไม่คาดว่าจะมีการส่งสำรองของ runner เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งมอบหายไปหรือไม่ถูกต้อง (`channel`/`to`) หมายความว่าขาออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกมาหรือเป็นรุ่นเก่าที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้อง Matrix แยกแยะตัวพิมพ์ใหญ่เล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งมอบถูกบล็อกโดยข้อมูลประจำตัว
    - หากการรันแบบแยกคืนเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งมอบขาออกโดยตรง และยังระงับเส้นทางสรุปในคิวสำรองด้วย ดังนั้นจะไม่มีสิ่งใดถูกโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - ความสดใหม่สำหรับการรีเซ็ตรายวันและเมื่อว่างไม่ได้อิงตาม `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุก Cron, การรัน Heartbeat, การแจ้งเตือน exec และงาน bookkeeping ของ gateway อาจอัปเดตแถวเซสชันสำหรับ routing/status แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวรุ่นเก่าที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้ `sessionStartedAt` จากส่วนหัวเซสชัน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถว idle รุ่นเก่าที่ไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนมาเป็น baseline ของ idle

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron ที่ไม่มี `--tz` ใช้ timezone ของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มี timezone จะถือว่าเป็น UTC
    - Heartbeat `activeHours` ใช้การแก้ไข timezone ที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติ](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดในภาพรวม
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทงานสำหรับการประมวลผล Cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นเซสชันหลักเป็นระยะ
- [Timezone](/th/concepts/timezone) — การกำหนดค่า timezone
