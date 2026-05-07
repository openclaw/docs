---
read_when:
    - การกำหนดเวลางานเบื้องหลังหรือการปลุก
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การเลือกระหว่าง Heartbeat กับ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการของ Gateway
title: งานที่กำหนดเวลาไว้
x-i18n:
    generated_at: "2026-05-07T01:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron เป็นตัวจัดตารางเวลาในตัวของ Gateway โดยจะเก็บงานไว้ถาวร ปลุกเอเจนต์เมื่อถึงเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชทหรือปลายทาง Webhook ได้

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
- นิยามงานจะถูกเก็บถาวรไว้ที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ทจะไม่ทำให้กำหนดการสูญหาย
- สถานะการทำงานขณะรันจะถูกเก็บถาวรไว้ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม Cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ใน gitignore
- หลังจากการแยกไฟล์ OpenClaw เวอร์ชันเก่าสามารถอ่าน `jobs.json` ได้ แต่อาจถือว่างานเป็นงานใหม่ เพราะตอนนี้ฟิลด์ขณะรันอยู่ใน `jobs-state.json`
- เมื่อมีการแก้ไข `jobs.json` ขณะที่ Gateway กำลังทำงานหรือหยุดอยู่ OpenClaw จะเปรียบเทียบฟิลด์กำหนดการที่เปลี่ยนแปลงกับเมตาดาต้าช่องเวลาขณะรันที่รออยู่ และล้างค่า `nextRunAtMs` ที่ล้าสมัย การเขียนซ้ำที่เปลี่ยนเฉพาะรูปแบบหรือเฉพาะลำดับคีย์จะคงช่องเวลาที่รออยู่ไว้
- การดำเนินการ Cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งานแบบ agent-turn ที่แยกเดี่ยวซึ่งเลยกำหนดแล้วจะถูกจัดตารางใหม่ให้อยู่นอกช่วงการเชื่อมต่อช่อง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ท
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองอัตโนมัติหลังสำเร็จโดยค่าเริ่มต้น
- การรัน Cron แบบแยกเดี่ยวจะพยายามปิดแท็บ/กระบวนการเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของตนเมื่อการรันเสร็จสิ้น เพื่อไม่ให้อัตโนมัติของเบราว์เซอร์ที่แยกออกมาทิ้งกระบวนการกำพร้าไว้
- การรัน Cron แบบแยกเดี่ยวที่ได้รับสิทธิ์การล้างตัวเองของ Cron แบบจำกัดยังสามารถอ่านสถานะตัวจัดตารางเวลาและรายการงานปัจจุบันของตนที่ถูกกรองเฉพาะตัวเองได้ ดังนั้นการตรวจสอบสถานะ/Heartbeat จึงสามารถตรวจสอบกำหนดการของตนเองได้โดยไม่ต้องได้รับสิทธิ์เข้าถึงการแก้ไข Cron ที่กว้างขึ้น
- การรัน Cron แบบแยกเดี่ยวยังป้องกันการตอบรับที่ล้าสมัยด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำบอกใบ้ที่คล้ายกัน) และไม่มีการรัน subagent ลูกหลานที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะส่งพรอมป์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน Cron แบบแยกเดี่ยวจะให้ความสำคัญกับเมตาดาต้าการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ก่อน จากนั้นจึงย้อนกลับไปใช้มาร์กเกอร์สรุป/เอาต์พุตสุดท้ายที่รู้จัก เช่น `SYSTEM_RUN_DENIED` และ `INVALID_REQUEST` ดังนั้นคำสั่งที่ถูกบล็อกจะไม่ถูกรายงานว่าเป็นการรันที่สำเร็จ
- การรัน Cron แบบแยกเดี่ยวยังถือว่าความล้มเหลวของเอเจนต์ระดับการรันเป็นข้อผิดพลาดของงาน แม้จะไม่มีเพย์โหลดตอบกลับเกิดขึ้นก็ตาม ดังนั้นความล้มเหลวของโมเดล/ผู้ให้บริการจะเพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเป็นงานที่สำเร็จ
- เมื่องานแบบ agent-turn ที่แยกเดี่ยวถึง `timeoutSeconds` Cron จะยกเลิกการรันเอเจนต์เบื้องหลังและให้ช่วงเวลาสั้น ๆ สำหรับการล้างข้อมูล หากการรันไม่ระบายงานจนเสร็จ การล้างข้อมูลที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ Cron จะบันทึกการหมดเวลา เพื่อไม่ให้งานแชทที่อยู่ในคิวถูกทิ้งไว้หลังเซสชันประมวลผลที่ล้าสมัย

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ Cron เป็นของ runtime ก่อน และอิงประวัติถาวรเป็นลำดับที่สอง: งาน Cron ที่ทำงานอยู่จะยังคงมีชีวิตอยู่ขณะที่ runtime ของ Cron ยังติดตามว่างานนั้นกำลังรันอยู่ แม้ว่ายังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อ runtime หยุดเป็นเจ้าของงานและหน้าต่างผ่อนผัน 5 นาทีหมดลง การตรวจบำรุงรักษาจะตรวจบันทึกการรันที่เก็บถาวรและสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากประวัตินั้น ไม่เช่นนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบ CLI แบบออฟไลน์สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงานที่ทำงานอยู่ในกระบวนการของตัวเองซึ่งว่างเปล่าเป็นหลักฐานว่าการรัน Cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทกำหนดการ

| ชนิด    | แฟล็ก CLI  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | ประทับเวลาแบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ Cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่เป็นตัวเลือก |

ประทับเวลาที่ไม่มีเขตเวลาจะถือว่าเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดตารางตามเวลานาฬิกาท้องถิ่น

นิพจน์แบบเกิดซ้ำที่ต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลดโหลดพุ่งสูง ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างเวลาที่ระบุอย่างชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ไวลด์การ์ด croner จะจับคู่เมื่อ **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน ไม่ใช่ทั้งสองฟิลด์ นี่คือพฤติกรรม Cron แบบ Vixie มาตรฐาน

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5-6 ครั้งต่อเดือนแทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ทั้งสองเงื่อนไขเป็นจริง ให้ใช้ตัวแก้ไขวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางตามฟิลด์หนึ่งแล้วตรวจเงื่อนไขอีกฟิลด์ในพรอมป์หรือคำสั่งของงาน

## รูปแบบการดำเนินการ

| รูปแบบ           | ค่า `--session`   | รันใน                  | เหมาะที่สุดสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก    | `main`              | เทิร์น Heartbeat ถัดไป      | การเตือน เหตุการณ์ระบบ        |
| แยกเดี่ยว        | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน งานเบื้องหลัง      |
| เซสชันปัจจุบัน | `current`           | ผูกไว้เมื่อสร้าง   | งานเกิดซ้ำที่รับรู้บริบท    |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันตั้งชื่อแบบถาวร | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="เซสชันหลัก เทียบกับแยกเดี่ยว เทียบกับกำหนดเอง">
    งาน **เซสชันหลัก** จะเข้าคิวเหตุการณ์ระบบและเลือกปลุก Heartbeat ได้ (`--wake now` หรือ `--wake next-heartbeat`) เหตุการณ์ระบบเหล่านั้นจะไม่ขยายความสดใหม่สำหรับการรีเซ็ตรายวัน/เมื่อไม่ได้ใช้งานของเซสชันเป้าหมาย งาน **แยกเดี่ยว** จะรัน agent turn เฉพาะพร้อมเซสชันใหม่ งาน **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทข้ามการรัน ทำให้ทำเวิร์กโฟลว์อย่าง daily standups ที่ต่อยอดจากสรุปก่อนหน้าได้
  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแยกเดี่ยว">
    สำหรับงานแยกเดี่ยว "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับแต่ละการรัน OpenClaw อาจนำค่ากำหนดที่ปลอดภัยติดไปด้วย เช่น การตั้งค่า thinking/fast/verbose, labels และการแทนที่โมเดล/auth ที่ผู้ใช้เลือกไว้อย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว Cron เก่า: การกำหนดเส้นทางช่อง/กลุ่ม นโยบายการส่งหรือเข้าคิว การยกระดับ แหล่งที่มา หรือการผูก runtime ของ ACP ใช้ `current` หรือ `session:<id>` เมื่องานเกิดซ้ำควรต่อยอดจากบริบทการสนทนาเดียวกันโดยเจตนา
  </Accordion>
  <Accordion title="การล้างข้อมูล runtime">
    สำหรับงานแยกเดี่ยว การรื้อถอน runtime ตอนนี้รวมการล้างข้อมูลเบราว์เซอร์แบบพยายามเต็มที่สำหรับเซสชัน Cron นั้น ความล้มเหลวในการล้างข้อมูลจะถูกละเว้นเพื่อให้ผลลัพธ์ Cron จริงยังเป็นตัวตัดสิน

    การรัน Cron แบบแยกเดี่ยวยัง dispose อินสแตนซ์ runtime MCP ที่รวมมาด้วยซึ่งสร้างสำหรับงานผ่านเส้นทางการล้างข้อมูล runtime ที่ใช้ร่วมกัน วิธีนี้ตรงกับการรื้อถอนไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน Cron แบบแยกเดี่ยวจะไม่ทำให้กระบวนการลูก stdio หรือการเชื่อมต่อ MCP อายุยาวรั่วไหลข้ามการรัน

  </Accordion>
  <Accordion title="Subagent และการส่งมอบ Discord">
    เมื่อการรัน Cron แบบแยกเดี่ยวประสานงาน subagents การส่งมอบจะให้ความสำคัญกับเอาต์พุตสุดท้ายของลูกหลานมากกว่าข้อความชั่วคราวของพาเรนต์ที่ล้าสมัยด้วย หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนของพาเรนต์นั้นแทนการประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายตามแบบบัญญัติหนึ่งครั้ง แทนที่จะเล่นซ้ำทั้งเพย์โหลดข้อความที่สตรีม/ชั่วคราวและคำตอบสุดท้าย เพย์โหลด Discord แบบสื่อและแบบมีโครงสร้างยังคงถูกส่งเป็นเพย์โหลดแยกต่างหาก เพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์ถูกทิ้ง

  </Accordion>
</AccordionGroup>

### ตัวเลือกเพย์โหลดสำหรับงานแยกเดี่ยว

<ParamField path="--message" type="string" required>
  ข้อความพรอมป์ (จำเป็นสำหรับแยกเดี่ยว)
</ParamField>
<ParamField path="--model" type="string">
  การแทนที่โมเดล ใช้โมเดลที่อนุญาตซึ่งเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--thinking" type="string">
  การแทนที่ระดับ thinking
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการฉีดไฟล์บูตสแตรปพื้นที่ทำงาน
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดว่าเครื่องมือใดที่งานใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตซึ่งเลือกไว้เป็นโมเดลหลักของงานนั้น สิ่งนี้ไม่เหมือนกับการแทนที่ `/model` ของเซสชันแชท: เชน fallback ที่กำหนดค่าไว้ยังคงมีผลเมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ขอไม่ได้รับอนุญาตหรือแก้ไขไม่ได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบความถูกต้องที่ชัดเจน แทนที่จะ fallback ไปยังการเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานอย่างเงียบ ๆ

หากรายการ `jobs.json` ที่เก่ากว่าหรือแก้ไขด้วยมือเก็บ `payload.model` เป็น `"default"`, `"null"`, สตริงว่าง หรือ JSON `null` ให้รัน `openclaw doctor --fix` Doctor จะลบ sentinel การแทนที่ที่เก็บถาวรซึ่งไม่ถูกต้องเหล่านั้น runtime ไม่รองรับสิ่งเหล่านี้เป็น alias ของ fallback ให้ละฟิลด์โมเดลไว้เพื่อใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นตามปกติ

งาน Cron ยังสามารถมี `fallbacks` ระดับเพย์โหลดได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่เชน fallback ที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ในเพย์โหลด/API ของงานเมื่อคุณต้องการการรัน Cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือกไว้ หากงานมี `--model` แต่ไม่มี fallback ทั้งในเพย์โหลดและที่กำหนดค่าไว้ OpenClaw จะส่งการแทนที่ fallback แบบว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของเอเจนต์ถูกผนวกเป็นเป้าหมายลองซ้ำเพิ่มเติมที่ซ่อนอยู่

ลำดับความสำคัญของการเลือกโมเดลสำหรับงานแยกเดี่ยวคือ:

1. การแทนที่โมเดลของฮุก Gmail (เมื่อการรันมาจาก Gmail และการแทนที่นั้นได้รับอนุญาต)
2. `model` ในเพย์โหลดต่องาน
3. การแทนที่โมเดลของเซสชัน Cron ที่เก็บไว้ซึ่งผู้ใช้เลือก
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมด fast จะตามการเลือกสดที่แก้ไขได้เช่นกัน หากการกำหนดค่าโมเดลที่เลือกมี `params.fastMode` Cron แบบแยกเดี่ยวจะใช้ค่านั้นโดยค่าเริ่มต้น การแทนที่ `fastMode` ของเซสชันที่เก็บไว้ยังคงชนะการกำหนดค่าในทั้งสองทิศทาง

หากการรันแบบแยกเดี่ยวเจอ handoff การสลับโมเดลแบบสด Cron จะลองซ้ำด้วยผู้ให้บริการ/โมเดลที่สลับไป และเก็บการเลือกสดนั้นไว้ถาวรสำหรับการรันที่ใช้งานอยู่ก่อนลองซ้ำ เมื่อการสลับมีโปรไฟล์ auth ใหม่มาด้วย Cron จะเก็บการแทนที่โปรไฟล์ auth นั้นไว้ถาวรสำหรับการรันที่ใช้งานอยู่ด้วย การลองซ้ำมีขอบเขตจำกัด: หลังจากความพยายามเริ่มต้นบวกการลองซ้ำจากการสลับ 2 ครั้ง Cron จะยกเลิกแทนการวนซ้ำตลอดไป

ก่อนที่การรัน Cron แบบแยกเดี่ยวจะเข้าสู่ตัวรันเอเจนต์ OpenClaw จะตรวจสอบ endpoint ของผู้ให้บริการภายในเครื่องที่เข้าถึงได้สำหรับผู้ให้บริการที่กำหนดค่า `api: "ollama"` และ `api: "openai-completions"` ซึ่ง `baseUrl` เป็น local loopback, private-network หรือ `.local` หาก endpoint นั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาดผู้ให้บริการ/โมเดลที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์ endpoint จะถูกแคชไว้ 5 นาที ดังนั้นงานจำนวนมากที่ถึงกำหนดและใช้เซิร์ฟเวอร์ Ollama, vLLM, SGLang หรือ LM Studio ภายในเครื่องเครื่องเดียวกันที่ล่ม จะใช้การ probe ขนาดเล็กร่วมกันหนึ่งครั้งแทนการสร้างพายุคำขอ การรันที่ข้ามโดย provider-preflight จะไม่เพิ่ม backoff ของข้อผิดพลาดการดำเนินการ เปิดใช้ `failureAlert.includeSkipped` เมื่อคุณต้องการการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและเอาต์พุต

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบ fallback ไปยังเป้าหมายหากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST เพย์โหลดเหตุการณ์ที่เสร็จสิ้นแล้วไปยัง URL                                |
| `none`     | ไม่มีการส่งแบบ fallback ของ runner                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; ผู้เรียกแบบ RPC/config โดยตรงยังสามารถส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้ด้วย เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix ต้องตรงตามตัวพิมพ์ใหญ่เล็ก; ใช้ ID ห้องที่ถูกต้อง หรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งแบบประกาศใช้ `channel: "last"` หรือละเว้น `channel` เป้าหมายที่มีคำนำหน้าผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ cron จะ fallback ไปยังประวัติเซสชันหรือช่องทางที่กำหนดค่าไว้ช่องทางเดียว เฉพาะคำนำหน้าที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุชัดเจน คำนำหน้าเป้าหมายต้องตั้งชื่อผู้ให้บริการเดียวกัน ตัวอย่างเช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ แทนที่จะปล่อยให้ WhatsApp ตีความ ID Telegram เป็นหมายเลขโทรศัพท์ คำนำหน้าชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานแบบแยก การส่งแชทจะใช้ร่วมกัน หากมีเส้นทางแชท เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้าม fallback announce มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับคำตอบสุดท้ายหลังจากรอบเอเจนต์เท่านั้น

เมื่อเอเจนต์สร้างการแจ้งเตือนแบบแยกจากแชทที่กำลังใช้งาน OpenClaw จะจัดเก็บเป้าหมายการส่งแบบสดที่สงวนไว้สำหรับเส้นทาง fallback announce คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งของผู้ให้บริการจะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชทปัจจุบัน

การส่งประกาศโดยนัยใช้ allowlist ช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติจาก pairing-store สำหรับ DM ไม่ใช่ผู้รับระบบอัตโนมัติแบบ fallback; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทางเมื่องานตามกำหนดการควรส่งไปยัง DM เชิงรุก

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นทั่วโลกสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นสำหรับแต่ละงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่างและงานส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมายประกาศหลักนั้น
- รองรับ `delivery.failureDestination` เฉพาะกับงาน `sessionTarget="isolated"` เท่านั้น เว้นแต่โหมดการส่งหลักคือ `webhook`
- `failureAlert.includeSkipped: true` เลือกให้งานหรือนโยบายการแจ้งเตือน Cron ทั่วโลกเข้าสู่การแจ้งเตือนการรันที่ถูกข้ามซ้ำ การรันที่ถูกข้ามจะเก็บตัวนับการข้ามติดต่อกันแยกต่างหาก ดังนั้นจึงไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ

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
</Tabs>

## Webhook

Gateway สามารถเปิดเผยปลายทาง HTTP webhook สำหรับทริกเกอร์ภายนอก เปิดใช้งานใน config:

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

โทเค็นใน query-string จะถูกปฏิเสธ

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
    รันรอบเอเจนต์แบบแยก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูกแก้ไขผ่าน `hooks.mappings` ใน config การแมปสามารถแปลงเพย์โหลดใดๆ เป็นการกระทำ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้โทเค็น hook แยกเฉพาะ; อย่านำโทเค็นยืนยันตัวตน Gateway มาใช้ซ้ำ
- เก็บ `hooks.path` ไว้ใน subpath แยกเฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- เก็บ `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกได้
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- เพย์โหลด hook จะถูกห่อด้วยขอบเขตความปลอดภัยตามค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** CLI `gcloud`, `gog` (gogcli), เปิดใช้ hook ของ OpenClaw แล้ว, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

สิ่งนี้จะเขียน config `hooks.gmail`, เปิดใช้พรีเซ็ต Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

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
หมายเหตุการแทนที่โมเดล:

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลได้รับอนุญาต ผู้ให้บริการ/โมเดลที่ตรงกันนั้นจะไปถึงการรันเอเจนต์แบบแยก
- หากไม่ได้รับอนุญาตหรือแก้ไขไม่ได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- ห่วงโซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ `--model` ของ Cron เป็นโมเดลหลักของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- เพย์โหลด `fallbacks` จะแทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `fallbacks: []` ปิดใช้งาน fallback และทำให้การรันเป็นแบบเข้มงวด
- `--model` เปล่าๆ ที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้ จะไม่ตกไปยังโมเดลหลักของเอเจนต์เป็นเป้าหมายลองซ้ำเพิ่มเติมแบบเงียบๆ

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

`maxConcurrentRuns` จำกัดทั้งการ dispatch Cron ตามกำหนดการและการดำเนินการรอบเอเจนต์แบบแยก รอบเอเจนต์ Cron แบบแยกใช้เลนการดำเนินการ `cron-nested` เฉพาะของคิวภายใน ดังนั้นการเพิ่มค่านี้ทำให้การรัน Cron LLM อิสระคืบหน้าแบบขนานได้ แทนที่จะเริ่มเฉพาะ wrapper Cron ชั้นนอก เลน `nested` ที่ใช้ร่วมกันและไม่ใช่ Cron จะไม่ถูกขยายด้วยการตั้งค่านี้

ไฟล์ sidecar สถานะ runtime ได้มาจาก `cron.store`: store `.json` เช่น `~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ส่วนพาธ store ที่ไม่มี suffix `.json` จะต่อท้ายด้วย `-state.json`

หากคุณแก้ไข `jobs.json` ด้วยมือ ให้กัน `jobs-state.json` ออกจาก source control OpenClaw ใช้ sidecar นั้นสำหรับสล็อตที่รอดำเนินการ เครื่องหมาย active เมตาดาตาการรันล่าสุด และเอกลักษณ์กำหนดการที่บอก scheduler เมื่องานที่แก้ไขจากภายนอกต้องการ `nextRunAtMs` ใหม่

ปิดใช้งาน Cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="Retry behavior">
    **การลองซ้ำแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองซ้ำได้สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้งานทันที

    **การลองซ้ำแบบเกิดซ้ำ**: exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการลองซ้ำ Backoff จะรีเซ็ตหลังการรันสำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะลบรายการเซสชันการรันแบบแยกที่เก่าออก `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะลบไฟล์ run-log เก่าโดยอัตโนมัติ
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
    - ตรวจสอบตัวแปร env `cron.enabled` และ `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway กำลังทำงานต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
    - `reason: not-due` ในเอาต์พุตการรันหมายความว่าการรันด้วยตนเองถูกตรวจสอบด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่งมอบ">
    - โหมดการส่งมอบ `none` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจาก runner เอเจนต์ยังคงส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งมอบขาดหายหรือไม่ถูกต้อง (`channel`/`to`) หมายความว่าการส่งออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานรุ่นเก่าที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้องของ Matrix แยกตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งมอบถูกบล็อกโดยข้อมูลประจำตัว
    - หากการรันแบบแยกคืนเฉพาะโทเคนแบบเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรงและยังระงับเส้นทางสรุปที่เข้าคิวสำรองด้วย ดังนั้นจะไม่มีการโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายแบบระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะป้องกันการโรลโอเวอร์ /new-style">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่ได้ใช้งานไม่ได้อิงตาม `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกของ Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ Gateway อาจอัปเดตแถวเซสชันสำหรับการกำหนดเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวรุ่นเก่าที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชันใน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวรุ่นเก่าที่ไม่ได้ใช้งานและไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนนั้นเป็นเส้นฐานของเวลาว่าง

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มีเขตเวลาจะถูกถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การแก้ค่าเขตเวลาที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีรายการงานสำหรับการดำเนินการ Cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นของเซสชันหลักเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
