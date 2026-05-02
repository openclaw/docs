---
read_when:
    - การจัดกำหนดการงานเบื้องหลังหรือการปลุกระบบ
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการของ Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-05-02T10:07:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron คือเครื่องจัดกำหนดการในตัวของ Gateway โดยจะเก็บงานแบบถาวร ปลุกเอเจนต์เมื่อถึงเวลาที่เหมาะสม และสามารถส่งเอาต์พุตกลับไปยังช่องแชตหรือปลายทาง webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการเตือนครั้งเดียว">
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

## วิธีการทำงานของ cron

- Cron รัน **ภายในโปรเซส Gateway** (ไม่ใช่ภายในโมเดล)
- นิยามงานจะถูกเก็บถาวรที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้กำหนดการหาย
- สถานะการทำงานขณะรันจะถูกเก็บถาวรถัดจากนั้นใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ไว้ใน gitignore
- หลังจากการแยกออก เวอร์ชัน OpenClaw ที่เก่ากว่าจะอ่าน `jobs.json` ได้ แต่อาจถือว่างานเป็นงานใหม่ เพราะตอนนี้ฟิลด์ runtime อยู่ใน `jobs-state.json`
- เมื่อมีการแก้ไข `jobs.json` ขณะ Gateway กำลังรันหรือหยุดอยู่ OpenClaw จะเปรียบเทียบฟิลด์กำหนดการที่เปลี่ยนกับเมตาดาต้าช่องเวลา runtime ที่รอดำเนินการ และล้างค่า `nextRunAtMs` ที่ค้างเก่า การเขียนใหม่ที่เปลี่ยนเฉพาะรูปแบบหรือเฉพาะลำดับคีย์จะรักษาช่องเวลาที่รอดำเนินการไว้
- การดำเนินการ cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มต้น งาน agent-turn แบบแยกเดี่ยวที่เลยกำหนดจะถูกจัดกำหนดการใหม่ให้อยู่นอกช่วงเชื่อมต่อช่อง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานครั้งเดียว (`--at`) จะลบตัวเองหลังสำเร็จโดยค่าเริ่มต้น
- การรัน cron แบบแยกเดี่ยวจะพยายามปิดแท็บ/โปรเซสเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของตนเมื่อการรันเสร็จสิ้น เพื่อไม่ให้อัตโนมัติเบราว์เซอร์แบบแยกตัวทิ้งโปรเซสกำพร้าไว้
- การรัน cron แบบแยกเดี่ยวยังป้องกันการตอบรับที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำใบ้ที่คล้ายกัน) และไม่มีการรัน subagent ลูกหลานที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะ prompt ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน cron แบบแยกเดี่ยวจะใช้เมตาดาต้าการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ก่อน จากนั้นจึง fallback ไปยังมาร์กเกอร์สรุป/เอาต์พุตสุดท้ายที่รู้จัก เช่น `SYSTEM_RUN_DENIED` และ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันสีเขียว
- การรัน cron แบบแยกเดี่ยวยังถือว่าความล้มเหลวของเอเจนต์ระดับการรันเป็นข้อผิดพลาดของงาน แม้ไม่มีเพย์โหลดคำตอบถูกสร้างขึ้น ดังนั้นความล้มเหลวของโมเดล/ผู้ให้บริการจะเพิ่มตัวนับข้อผิดพลาดและเรียกการแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเสร็จสำเร็จ
- เมื่องาน agent-turn แบบแยกเดี่ยวถึง `timeoutSeconds` cron จะยกเลิกการรันเอเจนต์พื้นฐานและให้ช่วงเวลาสั้น ๆ สำหรับการล้างข้อมูล หากการรันไม่ระบายจนเสร็จ การล้างข้อมูลที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ cron จะบันทึกการหมดเวลา เพื่อไม่ให้งานแชตที่อยู่ในคิวถูกทิ้งไว้หลังเซสชันประมวลผลที่ค้างเก่า

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ cron ให้ runtime เป็นเจ้าของก่อน และใช้ประวัติถาวรเป็นฐานรองลงมา: งาน cron ที่ทำงานอยู่จะยังคง live ตราบใดที่ runtime ของ cron ยังติดตามงานนั้นว่ากำลังรัน แม้แถวเซสชันลูกเก่ายังคงอยู่ก็ตาม เมื่อ runtime หยุดเป็นเจ้าของงานและหน้าต่างผ่อนผัน 5 นาทีหมดลง การบำรุงรักษาจะตรวจสอบบันทึกการรันที่เก็บถาวรและสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากประวัตินั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบ CLI แบบออฟไลน์สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงานที่กำลังทำงานในโปรเซสของตัวเองซึ่งว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของหายไป
</Note>

## ประเภทกำหนดการ

| ชนิด    | แฟล็ก CLI  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | เวลาประทับครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่ไม่บังคับ |

เวลาประทับที่ไม่มีเขตเวลาจะถือเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดกำหนดการตามเวลานาฬิกาท้องถิ่น

นิพจน์ที่เกิดซ้ำ ณ ต้นชั่วโมงจะถูกเลื่อนกระจายโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลดโหลดพุ่งสูง ใช้ `--exact` เพื่อบังคับเวลาอย่างแม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างที่ระบุอย่างชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ไวลด์การ์ด croner จะจับคู่เมื่อฟิลด์ **ใดฟิลด์หนึ่ง** ตรงกัน ไม่ใช่ทั้งสองฟิลด์ นี่เป็นพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5-6 ครั้งต่อเดือน แทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR ค่าเริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ทั้งสองเงื่อนไขเป็นจริง ให้ใช้ตัวแก้ไขวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือกำหนดการบนฟิลด์หนึ่งแล้วตรวจอีกฟิลด์ใน prompt หรือคำสั่งของงาน

## รูปแบบการดำเนินการ

| รูปแบบ           | ค่า `--session`   | รันใน                  | เหมาะที่สุดสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก    | `main`              | รอบ Heartbeat ถัดไป      | การเตือน, เหตุการณ์ระบบ        |
| แบบแยกเดี่ยว        | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน, งานเบื้องหลัง      |
| เซสชันปัจจุบัน | `current`           | ผูกเมื่อสร้าง   | งานที่เกิดซ้ำและรับรู้บริบท    |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันมีชื่อที่คงอยู่ | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="เซสชันหลักเทียบกับแบบแยกเดี่ยวเทียบกับแบบกำหนดเอง">
    งาน **เซสชันหลัก** จะเข้าคิวเหตุการณ์ระบบและเลือกปลุก Heartbeat ได้ (`--wake now` หรือ `--wake next-heartbeat`) เหตุการณ์ระบบเหล่านั้นจะไม่ขยายความสดของการรีเซ็ตรายวัน/เมื่อว่างสำหรับเซสชันเป้าหมาย งาน **แบบแยกเดี่ยว** จะรัน agent turn เฉพาะพร้อมเซสชันใหม่ งาน **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทข้ามการรัน ทำให้เวิร์กโฟลว์อย่างการ standup รายวันที่ต่อยอดจากสรุปก่อนหน้าเป็นไปได้
  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแบบแยกเดี่ยว">
    สำหรับงานแบบแยกเดี่ยว "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับแต่ละการรัน OpenClaw อาจนำค่ากำหนดที่ปลอดภัยติดมาด้วย เช่น การตั้งค่า thinking/fast/verbose, ป้ายกำกับ และการ override โมเดล/auth ที่ผู้ใช้เลือกอย่างชัดเจน แต่จะไม่สืบทอดบริบทบทสนทนาแวดล้อมจากแถว cron ที่เก่ากว่า: การกำหนดเส้นทางช่อง/กลุ่ม, นโยบายส่งหรือเข้าคิว, การยกระดับสิทธิ์, ต้นทาง หรือการผูก ACP runtime ใช้ `current` หรือ `session:<id>` เมื่องานที่เกิดซ้ำควรตั้งใจต่อยอดจากบริบทบทสนทนาเดียวกัน
  </Accordion>
  <Accordion title="การล้างข้อมูล Runtime">
    สำหรับงานแบบแยกเดี่ยว การ teardown ของ runtime ตอนนี้รวมถึงการล้างเบราว์เซอร์แบบ best-effort สำหรับเซสชัน cron นั้น ความล้มเหลวในการล้างข้อมูลจะถูกละเว้นเพื่อให้ผลลัพธ์ cron จริงยังเป็นตัวตัดสิน

    การรัน cron แบบแยกเดี่ยวยัง dispose อินสแตนซ์ MCP runtime ที่รวมมาใด ๆ ที่สร้างขึ้นสำหรับงานผ่านพาธการล้าง runtime ที่ใช้ร่วมกัน ซึ่งตรงกับวิธีที่ไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเองถูก teardown ดังนั้นงาน cron แบบแยกเดี่ยวจึงไม่รั่วโปรเซสลูก stdio หรือการเชื่อมต่อ MCP อายุยาวข้ามการรัน

  </Accordion>
  <Accordion title="การส่งมอบของ Subagent และ Discord">
    เมื่อการรัน cron แบบแยกเดี่ยวประสานงาน subagents การส่งมอบจะเลือกเอาต์พุตลูกหลานสุดท้ายเหนือข้อความชั่วคราวของ parent ที่ค้างเก่าด้วย หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนของ parent นั้นแทนที่จะประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายตาม canonical หนึ่งครั้ง แทนที่จะเล่นซ้ำทั้งเพย์โหลดข้อความ streamed/กลางทางและคำตอบสุดท้าย เพย์โหลด Discord แบบสื่อและแบบมีโครงสร้างยังคงถูกส่งเป็นเพย์โหลดแยกต่างหาก เพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์ถูกทิ้ง

  </Accordion>
</AccordionGroup>

### ตัวเลือกเพย์โหลดสำหรับงานแบบแยกเดี่ยว

<ParamField path="--message" type="string" required>
  ข้อความ prompt (จำเป็นสำหรับแบบแยกเดี่ยว)
</ParamField>
<ParamField path="--model" type="string">
  การ override โมเดล; ใช้โมเดลที่อนุญาตที่เลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--thinking" type="string">
  การ override ระดับ thinking
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการฉีดไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดเครื่องมือที่งานสามารถใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตที่เลือกไว้เป็นโมเดลหลักของงานนั้น ซึ่งไม่เหมือนกับการ override `/model` ของเซสชันแชต: เชน fallback ที่กำหนดค่าไว้ยังคงมีผลเมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ร้องขอไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบอย่างชัดเจน แทนที่จะ fallback แบบเงียบไปยังการเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงาน

งาน Cron ยังสามารถมี `fallbacks` ระดับเพย์โหลดได้ เมื่อมีอยู่ รายการนั้นจะแทนที่เชน fallback ที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ในเพย์โหลด/API ของงานเมื่อคุณต้องการการรัน cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือกไว้เท่านั้น หากงานมี `--model` แต่ไม่มี fallback ทั้งในเพย์โหลดหรือที่กำหนดค่าไว้ OpenClaw จะส่งการ override fallback ว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของเอเจนต์ถูกผนวกเป็นเป้าหมายลองซ้ำเพิ่มเติมแบบซ่อน

ลำดับความสำคัญการเลือกโมเดลสำหรับงานแบบแยกเดี่ยวคือ:

1. การ override โมเดลของ Gmail hook (เมื่อการรันมาจาก Gmail และ override นั้นได้รับอนุญาต)
2. `model` ในเพย์โหลดต่องาน
3. การ override โมเดลเซสชัน cron ที่เก็บไว้ซึ่งผู้ใช้เลือก
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมด Fast จะตามการเลือก live ที่ resolve แล้วด้วย หาก config ของโมเดลที่เลือกมี `params.fastMode` cron แบบแยกเดี่ยวจะใช้ค่านั้นโดยค่าเริ่มต้น การ override `fastMode` ของเซสชันที่เก็บไว้ยังคงชนะ config ในทั้งสองทิศทาง

หากการรันแบบแยกเดี่ยวเจอการส่งต่อเพื่อสลับโมเดลแบบ live cron จะลองใหม่ด้วยผู้ให้บริการ/โมเดลที่สลับแล้ว และเก็บการเลือก live นั้นสำหรับการรันที่กำลังทำงานก่อนลองใหม่ เมื่อการสลับมาพร้อมกับ auth profile ใหม่ cron จะเก็บการ override auth profile นั้นสำหรับการรันที่กำลังทำงานด้วย การลองใหม่มีขอบเขตจำกัด: หลังจากความพยายามแรกบวกการลองสลับใหม่ 2 ครั้ง cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

ก่อนที่การรัน cron แบบแยกเดี่ยวจะเข้าสู่ agent runner OpenClaw จะตรวจสอบปลายทางผู้ให้บริการ local ที่เข้าถึงได้สำหรับผู้ให้บริการ `api: "ollama"` และ `api: "openai-completions"` ที่กำหนดค่าไว้ ซึ่ง `baseUrl` เป็น loopback, เครือข่ายส่วนตัว หรือ `.local` หากปลายทางนั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาดผู้ให้บริการ/โมเดลที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์ปลายทางจะถูกแคช 5 นาที ดังนั้นงานจำนวนมากที่ถึงกำหนดและใช้เซิร์ฟเวอร์ local Ollama, vLLM, SGLang หรือ LM Studio ที่ล่มเดียวกันจะแชร์การ probe ขนาดเล็กหนึ่งครั้ง แทนที่จะสร้างพายุคำขอ การรันที่ถูกข้ามจาก provider-preflight จะไม่เพิ่ม backoff ข้อผิดพลาดการดำเนินการ เปิดใช้ `failureAlert.includeSkipped` เมื่อต้องการการแจ้งเตือนการข้ามซ้ำ

## การส่งมอบและเอาต์พุต

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบ fallback ไปยังเป้าหมายหากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST เพย์โหลดเหตุการณ์ที่เสร็จแล้วไปยัง URL                                |
| `none`     | ไม่มีการส่งมอบ fallback ของ runner                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; ผู้เรียก RPC/config โดยตรงอาจส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้เช่นกัน เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกตัวพิมพ์ใหญ่-เล็ก; ใช้ ID ห้องที่ตรงทั้งหมด หรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งแบบประกาศใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มีคำนำหน้าผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ cron จะย้อนกลับไปใช้ประวัติเซสชันหรือช่องทางเดียวที่กำหนดค่าไว้ได้ เฉพาะคำนำหน้าที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หากระบุ `delivery.channel` อย่างชัดเจน คำนำหน้าเป้าหมายต้องระบุผู้ให้บริการเดียวกัน ตัวอย่างเช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธ แทนที่จะปล่อยให้ WhatsApp ตีความ ID Telegram เป็นหมายเลขโทรศัพท์ คำนำหน้าชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานที่แยกเดี่ยว การส่งแชตจะใช้ร่วมกัน หากมีเส้นทางแชตพร้อมใช้งาน agent สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หาก agent ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้ามการประกาศสำรอง มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับคำตอบสุดท้ายหลังจากเทิร์นของ agent

เมื่อ agent สร้างการเตือนแบบแยกเดี่ยวจากแชตที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งสดที่คงไว้สำหรับเส้นทางประกาศสำรอง คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งของผู้ให้บริการจะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชตปัจจุบันพร้อมใช้งาน

การส่งประกาศโดยนัยใช้ allowlist ช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติจาก pairing-store ของ DM ไม่ใช่ผู้รับระบบอัตโนมัติสำรอง; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทางเมื่องานตามกำหนดควรส่งไปยัง DM เชิงรุก

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นต่อหนึ่งงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่างและงานส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะย้อนกลับไปยังเป้าหมายประกาศหลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักจะเป็น `webhook`
- `failureAlert.includeSkipped: true` เลือกให้งานหรือนโยบายการแจ้งเตือน Cron ส่วนกลางใช้การแจ้งเตือนการข้ามรันซ้ำ การรันที่ถูกข้ามจะเก็บตัวนับการข้ามติดต่อกันแยกต่างหาก ดังนั้นจะไม่กระทบการหน่วงถอยหลังของข้อผิดพลาดการดำเนินการ

## ตัวอย่าง CLI

<Tabs>
  <Tab title="การเตือนครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="งานแยกเดี่ยวที่ทำซ้ำ">
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
</Tabs>

## Webhook

Gateway สามารถเปิดเผยปลายทาง HTTP webhook สำหรับทริกเกอร์ภายนอกได้ เปิดใช้งานใน config:

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

โทเค็นใน query-string จะถูกปฏิเสธ

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    จัดคิวอีเวนต์ระบบสำหรับเซสชันหลัก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      คำอธิบายอีเวนต์
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` หรือ `next-heartbeat`
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    รันเทิร์น agent แบบแยกเดี่ยว:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="ฮุกที่แมปไว้ (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ใน config mapping สามารถแปลง payload ใด ๆ เป็นการกระทำ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บปลายทาง hook ไว้หลัง local loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้ hook token เฉพาะ; อย่าใช้ token ยืนยันตัวตนของ Gateway ซ้ำ
- เก็บ `hooks.path` ไว้บน subpath เฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- เก็บ `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกเอง
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- payload ของ hook จะถูกครอบด้วยขอบเขตความปลอดภัยโดยค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้ hooks ของ OpenClaw, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยตัวช่วย (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียน config `hooks.gmail`, เปิดใช้ preset ของ Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

### การตั้งค่าแบบทำครั้งเดียวด้วยตนเอง

<Steps>
  <Step title="เลือกโปรเจกต์ GCP">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้:

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

- `openclaw cron add|edit --model ...` เปลี่ยนโมเดลที่งานเลือก
- หากโมเดลได้รับอนุญาต provider/model ที่ตรงนั้นจะไปถึงการรัน agent แบบแยกเดี่ยว
- หากไม่ได้รับอนุญาตหรือไม่สามารถ resolve ได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบที่ชัดเจน
- เชน fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ cron `--model` เป็น primary ของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- Payload `fallbacks` แทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `fallbacks: []` ปิดใช้งาน fallback และทำให้การรันเข้มงวด
- `--model` แบบธรรมดาที่ไม่มีรายการ fallback ที่ระบุอย่างชัดเจนหรือกำหนดค่าไว้ จะไม่ไหลต่อไปยัง primary ของ agent เป็นเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ

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

`maxConcurrentRuns` จำกัดทั้งการ dispatch cron ตามกำหนดเวลาและการดำเนินการเทิร์น agent แบบแยกเดี่ยว เทิร์น agent ของ cron แบบแยกเดี่ยวใช้ lane การดำเนินการเฉพาะของคิว `cron-nested` ภายใน ดังนั้นการเพิ่มค่านี้ทำให้การรัน LLM cron อิสระคืบหน้าแบบขนานได้ แทนที่จะเริ่มเฉพาะ wrapper cron ด้านนอก lane `nested` แบบ non-cron ที่ใช้ร่วมกันจะไม่ถูกขยายด้วยการตั้งค่านี้

sidecar สถานะ runtime ได้มาจาก `cron.store`: store `.json` เช่น `~/clawd/cron/jobs.json` ใช้ `~/clawd/cron/jobs-state.json` ขณะที่เส้นทาง store ที่ไม่มี suffix `.json` จะเติม `-state.json`

หากคุณแก้ไข `jobs.json` ด้วยมือ ให้กัน `jobs-state.json` ออกจาก source control OpenClaw ใช้ sidecar นั้นสำหรับ slot ที่รอดำเนินการ, marker ที่ใช้งานอยู่, metadata การรันล่าสุด และ identity ของกำหนดการที่บอก scheduler ว่างานที่แก้ไขจากภายนอกต้องการ `nextRunAtMs` ใหม่

ปิดใช้งาน cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรมการลองใหม่">
    **การลองใหม่ครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองใหม่ได้สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้งานทันที

    **การลองใหม่แบบเกิดซ้ำ**: exponential backoff (30s ถึง 60m) ระหว่างการลองใหม่ Backoff จะรีเซ็ตหลังจากการรันครั้งถัดไปสำเร็จ

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะ prune รายการเซสชันการรันแบบแยกเดี่ยว `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะ prune ไฟล์ run-log อัตโนมัติ
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
    - ยืนยันว่า Gateway รันต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบ timezone (`--tz`) เทียบกับ timezone ของ host
    - `reason: not-due` ในผลลัพธ์การรันหมายความว่าการรันด้วยตนเองถูกตรวจด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่ง">
    - โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจาก runner เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าการส่งออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานแบบเดิมที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เนื่องจาก ID ห้องของ Matrix แยกแยะตัวพิมพ์ใหญ่-เล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดยข้อมูลประจำตัว
    - หากการรันแบบแยกคืนค่าเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรงและระงับเส้นทางสรุปที่เข้าคิวไว้เป็นทางสำรองด้วย ดังนั้นจึงไม่มีสิ่งใดถูกโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการเปลี่ยนรอบของ /new-style">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่ได้ใช้งานไม่ได้อิงจาก `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกของ Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ Gateway อาจอัปเดตแถวเซสชันสำหรับการกำหนดเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวแบบเดิมที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชันใน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวแบบเดิมที่ไม่ได้ใช้งานและไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนได้นั้นเป็นค่าฐานของการไม่ได้ใช้งาน

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มีเขตเวลาจะถูกถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การแก้เขตเวลาที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทงานสำหรับการดำเนินการของ Cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นของเซสชันหลักตามรอบเวลา
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
