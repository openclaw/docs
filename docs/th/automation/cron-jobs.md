---
read_when:
    - การกำหนดเวลางานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการ Gateway
title: งานที่กำหนดเวลาไว้
x-i18n:
    generated_at: "2026-05-11T20:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron เป็นตัวจัดตารางเวลาในตัวของ Gateway โดยจะเก็บงานแบบถาวร ปลุกเอเจนต์ในเวลาที่ถูกต้อง และสามารถส่งผลลัพธ์กลับไปยังช่องแชทหรือ Webhook endpoint ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการเตือนแบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
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
- นิยามงานจะถูกเก็บถาวรที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ตารางเวลาสูญหาย
- สถานะการดำเนินการขณะรันไทม์จะถูกเก็บถาวรไว้ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ใน gitignore
- หลังจากการแยกไฟล์ OpenClaw เวอร์ชันเก่าจะอ่าน `jobs.json` ได้ แต่อาจถือว่างานเป็นงานใหม่ เพราะตอนนี้ฟิลด์รันไทม์อยู่ใน `jobs-state.json`
- เมื่อมีการแก้ไข `jobs.json` ขณะที่ Gateway กำลังทำงานหรือหยุดอยู่ OpenClaw จะเปรียบเทียบฟิลด์ตารางเวลาที่เปลี่ยนไปกับเมตาดาต้าสล็อตรันไทม์ที่ค้างอยู่ และล้างค่า `nextRunAtMs` ที่ค้างเก่าไว้ การเขียนใหม่ที่เปลี่ยนแค่รูปแบบหรือแค่ลำดับคีย์จะยังคงรักษาสล็อตที่ค้างอยู่ไว้
- การดำเนินการ cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งาน agent-turn แบบแยกที่เลยกำหนดจะถูกจัดตารางเวลาใหม่ให้อยู่นอกช่วงเชื่อมต่อช่องทาง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองหลังสำเร็จโดยค่าเริ่มต้น
- cron แบบแยกจะพยายามปิดแท็บ/กระบวนการเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของงานนั้นเมื่อการรันเสร็จสิ้น เพื่อไม่ให้งานอัตโนมัติของเบราว์เซอร์ที่แยกออกไปเหลือกระบวนการกำพร้าไว้
- cron แบบแยกที่ได้รับสิทธิ์การล้างตัวเองเฉพาะของ cron แบบจำกัด ยังสามารถอ่านสถานะตัวจัดตารางเวลา รายการงานปัจจุบันของตัวเองที่ถูกกรองเฉพาะตัวเอง และประวัติการรันของงานนั้นได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat ตรวจสอบตารางเวลาของตัวเองได้โดยไม่ต้องได้รับสิทธิ์แก้ไข cron ที่กว้างกว่า
- cron แบบแยกยังป้องกันการตอบรับที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และข้อความบอกใบ้ลักษณะเดียวกัน) และไม่มีการรันของซับเอเจนต์สืบทอดที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะ prompt ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- cron แบบแยกจะเลือกใช้เมตาดาต้าการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ก่อน จากนั้นจึงถอยกลับไปใช้ตัวทำเครื่องหมายสรุปสุดท้าย/เอาต์พุตที่รู้จัก เช่น `SYSTEM_RUN_DENIED` และ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันที่สำเร็จ
- cron แบบแยกยังถือว่าความล้มเหลวของเอเจนต์ระดับการรันเป็นข้อผิดพลาดของงาน แม้จะไม่มี payload ตอบกลับถูกสร้างขึ้น เพื่อให้ความล้มเหลวของโมเดล/ผู้ให้บริการเพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเป็นงานสำเร็จ
- เมื่องาน agent-turn แบบแยกถึง `timeoutSeconds` cron จะยกเลิกการรันเอเจนต์พื้นฐานและให้ช่วงเวลาสั้น ๆ สำหรับการล้างงาน หากการรันไม่ระบายออก การล้างงานที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ cron จะบันทึกการหมดเวลา เพื่อไม่ให้งานแชทที่อยู่ในคิวค้างอยู่หลังเซสชันประมวลผลที่ค้างเก่า
- หาก agent-turn แบบแยกหยุดค้างก่อน runner เริ่มหรือก่อนการเรียกโมเดลครั้งแรก cron จะบันทึกการหมดเวลาที่ระบุเฟส เช่น `setup timed out before runner start` หรือ `stalled before first model call (last phase: context-engine)` watchdog เหล่านี้ครอบคลุมผู้ให้บริการแบบฝังและผู้ให้บริการที่อิง CLI ก่อนที่กระบวนการ CLI ภายนอกจะเริ่มจริง และถูกจำกัดแยกจากค่า `timeoutSeconds` ที่ยาว เพื่อให้ความล้มเหลวจาก cold-start/auth/context ปรากฏอย่างรวดเร็วแทนที่จะรอจนหมดงบเวลาของงานทั้งหมด

<a id="maintenance"></a>

<Note>
การปรับงานให้สอดคล้องสำหรับ cron เป็นของรันไทม์ก่อน และมีประวัติถาวรหนุนหลังเป็นลำดับถัดมา: งาน cron ที่กำลังทำงานจะยังคงมีสถานะ live ตราบใดที่รันไทม์ cron ยังคงติดตามว่างานนั้นกำลังรันอยู่ แม้ว่าจะยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อรันไทม์หยุดเป็นเจ้าของงานและช่วงผ่อนผัน 5 นาทีหมดอายุ การบำรุงรักษาจะตรวจสอบบันทึกการรันที่เก็บถาวรและสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากข้อมูลนั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบ CLI แบบออฟไลน์สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงานที่กำลังทำงานในกระบวนการของตัวเองซึ่งว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทตารางเวลา

| ประเภท    | แฟล็ก CLI  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp แบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่เป็นตัวเลือก |

timestamp ที่ไม่มีเขตเวลาจะถือเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดตารางเวลาตามเวลานาฬิกาท้องถิ่น

นิพจน์ที่เกิดซ้ำตรงต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลดโหลดที่พุ่งสูง ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างเวลาที่ระบุชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะแบบ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ wildcard croner จะจับคู่เมื่อฟิลด์ **ใดฟิลด์หนึ่ง** ตรงกัน ไม่ใช่ทั้งสองฟิลด์ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5-6 ครั้งต่อเดือน แทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ทั้งสองเงื่อนไขเป็นจริง ให้ใช้ตัวแก้ไขวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางเวลาบนฟิลด์หนึ่งแล้วป้องกันอีกฟิลด์ใน prompt หรือคำสั่งของงานคุณ

## รูปแบบการดำเนินการ

| รูปแบบ           | ค่า `--session`   | ทำงานใน                  | เหมาะที่สุดสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก    | `main`              | รอบ Heartbeat ถัดไป      | การเตือนความจำ, เหตุการณ์ระบบ        |
| แยกโดดเดี่ยว        | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน, งานเบื้องหลัง      |
| เซสชันปัจจุบัน | `current`           | ผูกไว้ตอนสร้าง   | งานซ้ำที่รับรู้บริบท    |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันมีชื่อแบบคงอยู่ | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="เซสชันหลักเทียบกับแบบแยกโดดเดี่ยวเทียบกับแบบกำหนดเอง">
    งานของ **เซสชันหลัก** จะจัดคิวเหตุการณ์ระบบและอาจปลุก Heartbeat (`--wake now` หรือ `--wake next-heartbeat`) ได้ เหตุการณ์ระบบเหล่านั้นจะไม่ขยายความสดใหม่ของการรีเซ็ตรายวัน/เมื่อไม่ได้ใช้งานสำหรับเซสชันเป้าหมาย งานแบบ **แยกโดดเดี่ยว** จะเรียกใช้รอบของเอเจนต์เฉพาะด้วยเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทข้ามการเรียกใช้ ทำให้ทำเวิร์กโฟลว์อย่างการประชุมสรุปรายวันซึ่งต่อยอดจากสรุปก่อนหน้าได้
  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแบบแยกโดดเดี่ยว">
    สำหรับงานแบบแยกโดดเดี่ยว "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับการเรียกใช้แต่ละครั้ง OpenClaw อาจนำการตั้งค่าที่ปลอดภัยติดไปด้วย เช่น การตั้งค่า thinking/fast/verbose, ป้ายกำกับ และการ override โมเดล/การยืนยันตัวตนที่ผู้ใช้เลือกไว้อย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว Cron เก่ากว่า: การกำหนดเส้นทางช่อง/กลุ่ม, นโยบายส่งหรือเข้าคิว, การยกระดับ, ต้นทาง หรือการผูก ACP runtime ใช้ `current` หรือ `session:<id>` เมื่องานที่เกิดซ้ำควรตั้งใจต่อยอดจากบริบทการสนทนาเดียวกัน
  </Accordion>
  <Accordion title="การล้างข้อมูล runtime">
    สำหรับงานแบบแยกโดดเดี่ยว ตอนนี้การรื้อถอน runtime รวมการล้างข้อมูลเบราว์เซอร์แบบพยายามให้ดีที่สุดสำหรับเซสชัน Cron นั้นด้วย ความล้มเหลวในการล้างข้อมูลจะถูกละเว้น เพื่อให้ผลลัพธ์ Cron จริงยังเป็นตัวตัดสิน

    การเรียกใช้ Cron แบบแยกโดดเดี่ยวยัง dispose อินสแตนซ์ MCP runtime แบบ bundled ใด ๆ ที่สร้างสำหรับงานผ่านเส้นทาง runtime-cleanup ที่ใช้ร่วมกันด้วย ซึ่งสอดคล้องกับวิธีรื้อถอน MCP client ของเซสชันหลักและเซสชันกำหนดเอง ทำให้งาน Cron แบบแยกโดดเดี่ยวไม่รั่วไหล stdio child process หรือการเชื่อมต่อ MCP อายุยาวข้ามการเรียกใช้

  </Accordion>
  <Accordion title="Subagent และการส่งผ่าน Discord">
    เมื่อการเรียกใช้ Cron แบบแยกโดดเดี่ยวจัดการ subagent การส่งผ่านจะเลือกเอาต์พุตสุดท้ายของ descendant มากกว่าข้อความชั่วคราวเก่าของ parent ด้วย หาก descendant ยังทำงานอยู่ OpenClaw จะระงับการอัปเดต parent บางส่วนนั้นแทนการประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายตาม canonical เพียงครั้งเดียว แทนการ replay ทั้ง payload ข้อความแบบ streamed/intermediate และคำตอบสุดท้าย ส่วน payload สื่อและ Discord แบบมีโครงสร้างจะยังถูกส่งเป็น payload แยกต่างหาก เพื่อไม่ให้ attachment และ component ถูกทิ้งไป

  </Accordion>
</AccordionGroup>

### ตัวเลือก payload สำหรับงานแบบแยกโดดเดี่ยว

<ParamField path="--message" type="string" required>
  ข้อความ prompt (จำเป็นสำหรับแบบแยกโดดเดี่ยว)
</ParamField>
<ParamField path="--model" type="string">
  การ override โมเดล; ใช้โมเดลที่อนุญาตและเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--thinking" type="string">
  การ override ระดับการคิด
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการฉีดไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดว่าเครื่องมือใดที่งานใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตและเลือกไว้เป็นโมเดลหลักของงานนั้น ไม่เหมือนกับการ override `/model` ของเซสชันแชต: fallback chain ที่กำหนดค่าไว้ยังคงมีผลเมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ขอไม่ได้รับอนุญาตหรือ resolve ไม่ได้ Cron จะทำให้การเรียกใช้นั้นล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนการ fallback แบบเงียบ ๆ ไปยังการเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงาน

งาน Cron ยังสามารถมี `fallbacks` ระดับ payload ได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่ fallback chain ที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ใน payload/API ของงานเมื่อคุณต้องการการเรียกใช้ Cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือกเท่านั้น หากงานมี `--model` แต่ไม่มี fallback ทั้งใน payload หรือที่กำหนดค่าไว้ OpenClaw จะส่ง fallback override แบบว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของเอเจนต์ถูกผนวกเป็นเป้าหมาย retry พิเศษที่ซ่อนอยู่

ลำดับความสำคัญในการเลือกโมเดลสำหรับงานแบบแยกโดดเดี่ยวคือ:

1. การ override โมเดลของ hook Gmail (เมื่อการเรียกใช้มาจาก Gmail และ override นั้นได้รับอนุญาต)
2. `model` ใน payload ต่อหนึ่งงาน
3. การ override โมเดลเซสชัน Cron ที่ผู้ใช้เลือกและจัดเก็บไว้
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

Fast mode จะทำตามการเลือก live ที่ resolve แล้วด้วย หาก config ของโมเดลที่เลือกมี `params.fastMode` Cron แบบแยกโดดเดี่ยวจะใช้ค่านั้นเป็นค่าเริ่มต้น การ override `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงชนะ config ได้ทั้งสองทิศทาง

หากการเรียกใช้แบบแยกโดดเดี่ยวเจอการ handoff เพื่อสลับโมเดลแบบ live Cron จะ retry ด้วย provider/model ที่สลับแล้ว และ persist การเลือก live นั้นสำหรับการเรียกใช้ที่กำลังทำงานอยู่ก่อน retry เมื่อการสลับมี auth profile ใหม่มาด้วย Cron จะ persist การ override auth profile นั้นสำหรับการเรียกใช้ที่กำลังทำงานอยู่ด้วย การ retry มีขอบเขตจำกัด: หลังจากความพยายามแรกบวกกับ switch retry อีก 2 ครั้ง Cron จะยุติแทนการวนซ้ำตลอดไป

ก่อนที่การรัน Cron แบบแยกจะเข้าสู่ตัวรันเอเจนต์ OpenClaw จะตรวจสอบ endpoint ของผู้ให้บริการภายในเครื่องที่เข้าถึงได้ สำหรับผู้ให้บริการ `api: "ollama"` และ `api: "openai-completions"` ที่กำหนดค่าไว้ ซึ่งมี `baseUrl` เป็น loopback, private-network หรือ `.local` หาก endpoint นั้นไม่ทำงาน การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาดของผู้ให้บริการ/โมเดลที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์ของ endpoint จะถูกแคชไว้ 5 นาที ดังนั้นงานที่ถึงกำหนดจำนวนมากซึ่งใช้เซิร์ฟเวอร์ Ollama, vLLM, SGLang หรือ LM Studio ภายในเครื่องตัวเดียวกันที่ไม่ทำงาน จะแชร์การ probe ขนาดเล็กหนึ่งครั้ง แทนที่จะสร้างคำขอถาโถมจำนวนมาก การรัน provider-preflight ที่ถูกข้ามจะไม่เพิ่ม backoff ของข้อผิดพลาดในการดำเนินการ ให้เปิดใช้ `failureAlert.includeSkipped` เมื่อต้องการการแจ้งเตือนการข้ามซ้ำๆ

## การส่งมอบและผลลัพธ์

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบสำรองไปยังเป้าหมาย หากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST payload เหตุการณ์ที่เสร็จแล้วไปยัง URL                                |
| `none`     | ไม่มีการส่งมอบสำรองจากตัวรัน                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งมอบไปยังช่องทาง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; ผู้เรียก RPC/config โดยตรงสามารถส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้ด้วย เป้าหมาย Slack/Discord/Mattermost ควรใช้ prefix ที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกตัวพิมพ์เล็กใหญ่; ให้ใช้ ID ห้องที่ตรงเป๊ะหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งมอบแบบ announce ใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มี prefix ของผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ Cron จะ fallback ไปยังประวัติเซสชันหรือช่องทางเดียวที่กำหนดค่าไว้ เฉพาะ prefix ที่ Plugin ที่โหลดไว้ประกาศเท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุไว้อย่างชัดเจน prefix ของเป้าหมายต้องตั้งชื่อผู้ให้บริการเดียวกัน เช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ แทนที่จะให้ WhatsApp ตีความ ID Telegram เป็นหมายเลขโทรศัพท์ prefix แบบชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานแบบแยก การส่งมอบแชทจะใช้ร่วมกัน หากมีเส้นทางแชทพร้อมใช้งาน เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานนั้นจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้าม fallback announce มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ตัวรันทำกับคำตอบสุดท้ายหลังจากรอบของเอเจนต์เท่านั้น

เมื่อเอเจนต์สร้างการแจ้งเตือนแบบแยกจากแชทที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งมอบแบบสดที่เก็บรักษาไว้สำหรับเส้นทาง fallback announce คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งมอบของผู้ให้บริการจะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชทปัจจุบันพร้อมใช้งาน

การส่งมอบแบบ announce โดยนัยใช้ allowlist ของช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติจาก pairing-store ของ DM ไม่ใช่ผู้รับระบบอัตโนมัติสำรอง; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทาง เมื่องานตามกำหนดการควรส่งไปยัง DM เชิงรุก

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่า default ส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` override ค่านั้นต่อหนึ่งงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่าง และงานนั้นส่งมอบผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งมอบหลักเป็น `webhook`
- `failureAlert.includeSkipped: true` เลือกให้งานหรือ policy การแจ้งเตือน Cron ส่วนกลางส่งการแจ้งเตือนการรันที่ถูกข้ามซ้ำๆ การรันที่ถูกข้ามจะเก็บตัวนับการข้ามต่อเนื่องแยกต่างหาก ดังนั้นจึงไม่กระทบ backoff ของข้อผิดพลาดในการดำเนินการ

## ตัวอย่าง CLI

<Tabs>
  <Tab title="การแจ้งเตือนครั้งเดียว">
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
  </Tab>
  <Tab title="การ override โมเดลและ thinking">
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
</Tabs>

## Webhook

Gateway สามารถเปิด endpoint HTTP webhook สำหรับทริกเกอร์ภายนอกได้ เปิดใช้ใน config:

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

ทุกคำขอต้องรวม hook token ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

token ใน query string จะถูกปฏิเสธ

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
    รันรอบเอเจนต์แบบแยก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Hook ที่แมปไว้ (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูกแก้ผ่าน `hooks.mappings` ใน config การแมปสามารถแปลง payload ใดๆ ให้เป็น action `wake` หรือ `agent` ด้วย template หรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บ hook endpoint ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้ hook token เฉพาะ; อย่านำ gateway auth token กลับมาใช้ซ้ำ
- เก็บ `hooks.path` ไว้บน subpath เฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการ route `agentId` แบบชัดเจน
- คง `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกเอง
- หากเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วย เพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- โดย default, hook payload จะถูกห่อด้วยขอบเขตความปลอดภัย

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องขาเข้า Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้ OpenClaw hooks, Tailscale สำหรับ endpoint HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วย wizard (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียน config `hooks.gmail`, เปิดใช้ preset ของ Gmail และใช้ Tailscale Funnel สำหรับ endpoint push

### การเริ่มอัตโนมัติของ Gateway

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอน boot และต่ออายุ watch โดยอัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อ opt out

### การตั้งค่าครั้งเดียวแบบ manual

<Steps>
  <Step title="เลือกโปรเจกต์ GCP">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="สร้าง topic และให้สิทธิ์เข้าถึง Gmail push">
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

### การ override โมเดล Gmail

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

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
หมายเหตุการ override โมเดล:

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลได้รับอนุญาต provider/model ที่ตรงนั้นจะไปถึงการรันเอเจนต์แบบแยก
- หากไม่ได้รับอนุญาตหรือแก้ค่าไม่ได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- chain fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ `--model` ของ Cron เป็น primary ของงาน ไม่ใช่การ override `/model` ของเซสชัน
- Payload `fallbacks` แทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `fallbacks: []` ปิด fallback และทำให้การรันเข้มงวด
- `--model` ธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้ จะไม่ตกไปหา primary ของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบเงียบๆ

</Note>

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

`maxConcurrentRuns` จำกัดทั้งการ dispatch Cron ตามกำหนดการและการดำเนินการรอบเอเจนต์แบบแยก รอบเอเจนต์ Cron แบบแยกใช้ lane การดำเนินการ `cron-nested` เฉพาะของคิวภายใน ดังนั้นการเพิ่มค่านี้จะทำให้การรัน LLM ของ Cron อิสระเดินหน้าคู่ขนานกันได้ แทนที่จะเริ่มได้เฉพาะ wrapper Cron ชั้นนอกของแต่ละงาน lane `nested` ที่ใช้ร่วมกันสำหรับงานที่ไม่ใช่ Cron จะไม่ถูกขยายด้วยการตั้งค่านี้

sidecar สถานะ runtime มาจาก `cron.store`: store `.json` เช่น `~/clawd/cron/jobs.json` ใช้ `~/clawd/cron/jobs-state.json` ส่วน path ของ store ที่ไม่มี suffix `.json` จะเติม `-state.json` ต่อท้าย

หากคุณแก้ไข `jobs.json` ด้วยมือ ให้กัน `jobs-state.json` ออกจาก source control OpenClaw ใช้ sidecar นั้นสำหรับ slot ที่ค้างอยู่, marker ที่ใช้งานอยู่, metadata การรันล่าสุด และ identity ของตารางเวลาที่บอก scheduler ว่าเมื่อใดงานที่ถูกแก้ไขจากภายนอกต้องการ `nextRunAtMs` ใหม่

ปิดใช้ Cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรม retry">
    **retry สำหรับครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้ทันที

    **retry สำหรับงานที่เกิดซ้ำ**: exponential backoff (30s ถึง 60m) ระหว่างการ retry Backoff จะรีเซ็ตหลังจากการรันสำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะล้างรายการเซสชันการรันแบบแยกที่เก่าออก `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะล้างไฟล์บันทึกการรันโดยอัตโนมัติ
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
  <Accordion title="Cron ไม่ทำงานตามกำหนด">
    - ตรวจสอบ `cron.enabled` และตัวแปรสภาพแวดล้อม `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway ทำงานต่อเนื่องอยู่
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
    - `reason: not-due` ในเอาต์พุตการรันหมายความว่ามีการตรวจสอบการรันด้วยตนเองโดยใช้ `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่ง">
    - โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจาก runner เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งขาดหายหรือไม่ถูกต้อง (`channel`/`to`) หมายความว่าข้ามการส่งออกไปแล้ว
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานรุ่นเก่าที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้องของ Matrix แยกแยะตัวพิมพ์ใหญ่เล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงกันจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่อง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกด้วยข้อมูลประจำตัว
    - หากการรันแบบแยกส่งคืนเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรง และยังระงับเส้นทางสรุปที่เข้าคิวไว้เป็นสำรองด้วย ดังนั้นจะไม่มีอะไรถูกโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่อง/เป้าหมายที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการเปลี่ยนรอบแบบ /new-style">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่ได้ใช้งานไม่ได้อิงจาก `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกจาก Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ Gateway อาจอัปเดตแถวเซสชันสำหรับการกำหนดเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวรุ่นเก่าที่สร้างก่อนฟิลด์เหล่านั้นมีอยู่ OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชันของ transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวที่ไม่ได้ใช้งานรุ่นเก่าซึ่งไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนได้นั้นเป็นค่าอ้างอิงสำหรับการไม่ได้ใช้งาน

  </Accordion>
  <Accordion title="ข้อควรระวังเรื่องเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มีเขตเวลาจะถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การแก้ค่าเขตเวลาที่กำหนดไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การทำงานอัตโนมัติและงาน](/th/automation) — กลไกการทำงานอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทงานสำหรับการดำเนินการของ cron
- [Heartbeat](/th/gateway/heartbeat) — รอบการทำงานของเซสชันหลักเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
