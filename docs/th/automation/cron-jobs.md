---
read_when:
    - การกำหนดเวลางานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานที่กำหนดเวลาไว้, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการของ Gateway
title: งานที่กำหนดเวลาไว้
x-i18n:
    generated_at: "2026-05-07T13:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron เป็นตัวจัดตารางงานในตัวของ Gateway โดยจะคงข้อมูลงานไว้ ปลุกเอเจนต์ในเวลาที่ถูกต้อง และสามารถส่งเอาต์พุตกลับไปยังช่องแชทหรือปลายทาง Webhook ได้

## เริ่มใช้งานอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มตัวเตือนแบบครั้งเดียว">
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
- นิยามงานจะถูกคงไว้ที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้กำหนดการหายไป
- สถานะการดำเนินการขณะรันไทม์จะถูกคงไว้ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม Cron ใน git ให้ติดตาม `jobs.json` และ gitignore `jobs-state.json`
- หลังการแยกนี้ OpenClaw เวอร์ชันเก่าสามารถอ่าน `jobs.json` ได้ แต่อาจมองว่างานเป็นงานใหม่ เพราะฟิลด์รันไทม์ตอนนี้อยู่ใน `jobs-state.json`
- เมื่อ `jobs.json` ถูกแก้ไขขณะที่ Gateway กำลังทำงานหรือหยุดอยู่ OpenClaw จะเปรียบเทียบฟิลด์กำหนดการที่เปลี่ยนแปลงกับเมทาดาทาของสล็อตรันไทม์ที่รอดำเนินการ และล้างค่า `nextRunAtMs` ที่ค้างอยู่ การเขียนใหม่ที่เปลี่ยนเฉพาะรูปแบบหรือเฉพาะลำดับคีย์จะคงสล็อตที่รอดำเนินการไว้
- การดำเนินการ Cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งานเทิร์นเอเจนต์แบบแยกที่เลยกำหนดจะถูกจัดตารางใหม่ให้อยู่นอกช่วงเชื่อมต่อช่อง แทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองหลังสำเร็จโดยค่าเริ่มต้น
- การรัน Cron แบบแยกจะพยายามปิดแท็บ/กระบวนการเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของงานเมื่อการรันเสร็จสิ้น เพื่อไม่ให้ระบบอัตโนมัติของเบราว์เซอร์ที่ถูกแยกออกทิ้งกระบวนการกำพร้าไว้
- การรัน Cron แบบแยกที่ได้รับสิทธิ์การทำความสะอาดตัวเองของ Cron แบบจำกัดยังคงอ่านสถานะตัวจัดตารางงานและรายการงานปัจจุบันของตนที่กรองเฉพาะตัวเองได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat ตรวจสอบกำหนดการของตนเองได้โดยไม่ต้องได้สิทธิ์แก้ไข Cron ที่กว้างกว่า
- การรัน Cron แบบแยกยังป้องกันการตอบรับที่ค้างเก่า หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำใบ้คล้ายกัน) และไม่มีการรัน subagent ลูกหลานที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะ prompt ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน Cron แบบแยกจะเลือกใช้เมทาดาทาการปฏิเสธการดำเนินการแบบมีโครงสร้างจากการรันที่ฝังอยู่ก่อน แล้วจึง fallback ไปยังมาร์กเกอร์สรุป/เอาต์พุตสุดท้ายที่รู้จัก เช่น `SYSTEM_RUN_DENIED` และ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันสีเขียว
- การรัน Cron แบบแยกยังถือว่าความล้มเหลวระดับการรันของเอเจนต์เป็นข้อผิดพลาดของงาน แม้จะไม่มีเพย์โหลดตอบกลับเกิดขึ้น ดังนั้นความล้มเหลวของโมเดล/ผู้ให้บริการจะเพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนที่จะล้างงานว่าเสร็จสำเร็จ
- เมื่องานเทิร์นเอเจนต์แบบแยกถึง `timeoutSeconds` Cron จะยกเลิกการรันเอเจนต์พื้นฐานและให้ช่วงเวลาสั้น ๆ สำหรับทำความสะอาด หากการรันไม่ระบายงานให้เสร็จ การทำความสะอาดที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ Cron จะบันทึกการหมดเวลา เพื่อไม่ให้งานแชทที่เข้าคิวค้างอยู่หลังเซสชันประมวลผลที่ค้างเก่า

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ Cron ให้รันไทม์เป็นเจ้าของก่อน และใช้ประวัติที่คงทนเป็นฐานรองลงมา: งาน Cron ที่ทำงานอยู่จะยังมีสถานะ live ขณะที่รันไทม์ Cron ยังติดตามว่างานนั้นกำลังรันอยู่ แม้จะยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อรันไทม์เลิกเป็นเจ้าของงานและช่วงผ่อนผัน 5 นาทีหมดลง การบำรุงรักษาจะตรวจสอบบันทึกการรันที่คงไว้และสถานะงานสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติที่คงทนนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากผลลัพธ์นั้น ไม่เช่นนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การ audit ผ่าน CLI แบบออฟไลน์สามารถกู้คืนจากประวัติที่คงทนได้ แต่จะไม่ถือว่าชุดงาน active ในกระบวนการของตนเองที่ว่างเปล่าเป็นหลักฐานว่าการรัน Cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทกำหนดการ

| ประเภท | แฟล็ก CLI | คำอธิบาย |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | เวลาประทับแบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`) |
| `every` | `--every` | ช่วงเวลาคงที่ |
| `cron`  | `--cron`  | นิพจน์ Cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่ไม่บังคับ |

เวลาประทับที่ไม่มีเขตเวลาจะถือเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดตารางตามเวลานาฬิกาท้องถิ่น

นิพจน์แบบเกิดซ้ำที่ต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติสูงสุด 5 นาทีเพื่อลดโหลดพุ่งสูง ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างเวลาที่ระบุชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ไวลด์การ์ด croner จะจับคู่เมื่อฟิลด์ **ใดฟิลด์หนึ่ง** ตรงกัน ไม่ใช่ทั้งสองฟิลด์ นี่เป็นพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5-6 ครั้งต่อเดือน แทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ทั้งสองเงื่อนไขเป็นจริง ให้ใช้ตัวปรับวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางบนฟิลด์หนึ่งแล้วตรวจเงื่อนไขอีกฟิลด์ใน prompt หรือคำสั่งของงานของคุณ

## รูปแบบการดำเนินการ

| รูปแบบ | ค่า `--session` | รันใน | เหมาะที่สุดสำหรับ |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก | `main` | เทิร์น Heartbeat ถัดไป | ตัวเตือน, เหตุการณ์ระบบ |
| แบบแยก | `isolated` | `cron:<jobId>` เฉพาะ | รายงาน, งานเบื้องหลังทั่วไป |
| เซสชันปัจจุบัน | `current` | ผูกไว้ ณ เวลาสร้าง | งานเกิดซ้ำที่อิงบริบท |
| เซสชันกำหนดเอง | `session:custom-id` | เซสชันมีชื่อที่คงอยู่ | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="เซสชันหลัก เทียบกับแบบแยก เทียบกับแบบกำหนดเอง">
    งาน **เซสชันหลัก** จะเข้าคิวเหตุการณ์ระบบและอาจปลุก Heartbeat (`--wake now` หรือ `--wake next-heartbeat`) เหตุการณ์ระบบเหล่านั้นจะไม่ขยายความสดใหม่ของการรีเซ็ตรายวัน/ว่างงานสำหรับเซสชันเป้าหมาย งาน **แบบแยก** จะรันเทิร์นเอเจนต์เฉพาะพร้อมเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทไว้ข้ามการรัน ทำให้ทำเวิร์กโฟลว์อย่างสแตนด์อัปรายวันที่ต่อยอดจากสรุปก่อนหน้าได้
  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงานแบบแยก">
    สำหรับงานแบบแยก "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับแต่ละการรัน OpenClaw อาจนำค่ากำหนดที่ปลอดภัยติดไปด้วย เช่น การตั้งค่า thinking/fast/verbose, labels และการ override โมเดล/การยืนยันตัวตนที่ผู้ใช้เลือกไว้อย่างชัดเจน แต่จะไม่สืบทอดบริบทการสนทนาแวดล้อมจากแถว Cron เก่า: การกำหนดเส้นทางช่อง/กลุ่ม, นโยบายส่งหรือเข้าคิว, การยกระดับ, ต้นทาง หรือการผูก ACP รันไทม์ ใช้ `current` หรือ `session:<id>` เมื่องานเกิดซ้ำควรตั้งใจต่อยอดจากบริบทการสนทนาเดียวกัน
  </Accordion>
  <Accordion title="การทำความสะอาดรันไทม์">
    สำหรับงานแบบแยก การรื้อถอนรันไทม์ตอนนี้รวมการทำความสะอาดเบราว์เซอร์แบบพยายามดีที่สุดสำหรับเซสชัน Cron นั้น ความล้มเหลวในการทำความสะอาดจะถูกละเว้น เพื่อให้ผลลัพธ์ Cron จริงยังเป็นตัวตัดสิน

    การรัน Cron แบบแยกยัง dispose อินสแตนซ์รันไทม์ MCP ที่ bundled ไว้ซึ่งสร้างขึ้นสำหรับงานผ่านเส้นทางทำความสะอาดรันไทม์ร่วมกัน สิ่งนี้ตรงกับวิธีรื้อถอน MCP clients ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน Cron แบบแยกจะไม่รั่วไหลกระบวนการลูก stdio หรือการเชื่อมต่อ MCP ที่อยู่ยาวข้ามการรัน

  </Accordion>
  <Accordion title="Subagent และการส่งมอบ Discord">
    เมื่อการรัน Cron แบบแยกประสานงาน subagents การส่งมอบจะเลือกเอาต์พุตสุดท้ายของลูกหลานก่อนข้อความชั่วคราวของ parent ที่ค้างเก่าเช่นกัน หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจาก parent นั้นแทนที่จะประกาศออกไป

    สำหรับเป้าหมาย announce ของ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความ assistant สุดท้ายตาม canonical หนึ่งครั้ง แทนที่จะเล่นซ้ำทั้งเพย์โหลดข้อความที่สตรีม/ระหว่างทางและคำตอบสุดท้าย สื่อและเพย์โหลด Discord แบบมีโครงสร้างยังคงถูกส่งเป็นเพย์โหลดแยกต่างหากเพื่อไม่ให้ไฟล์แนบและคอมโพเนนต์ถูกตัดทิ้ง

  </Accordion>
</AccordionGroup>

### ตัวเลือกเพย์โหลดสำหรับงานแบบแยก

<ParamField path="--message" type="string" required>
  ข้อความ prompt (จำเป็นสำหรับแบบแยก)
</ParamField>
<ParamField path="--model" type="string">
  การ override โมเดล ใช้โมเดลที่อนุญาตซึ่งเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--thinking" type="string">
  การ override ระดับ thinking
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการฉีดไฟล์ bootstrap ของเวิร์กสเปซ
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดเครื่องมือที่งานใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตซึ่งเลือกไว้เป็นโมเดลหลักของงานนั้น ไม่เหมือนกับการ override `/model` ของเซสชันแชท: เชน fallback ที่กำหนดค่าไว้ยังคงมีผลเมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ขอไม่ได้รับอนุญาตหรือ resolve ไม่ได้ Cron จะทำให้การรันล้มเหลวด้วยข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนที่จะ fallback ไปยังการเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานอย่างเงียบ ๆ

งาน Cron ยังสามารถมี `fallbacks` ระดับเพย์โหลดได้ด้วย เมื่อมีอยู่ รายการนั้นจะแทนที่เชน fallback ที่กำหนดค่าไว้สำหรับงาน ใช้ `fallbacks: []` ในเพย์โหลด/API ของงานเมื่อคุณต้องการการรัน Cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือกไว้ หากงานมี `--model` แต่ไม่มีทั้ง fallback ในเพย์โหลดและในการกำหนดค่า OpenClaw จะส่งการ override fallback ว่างอย่างชัดเจน เพื่อไม่ให้โมเดลหลักของเอเจนต์ถูกผนวกเป็นเป้าหมายลองซ้ำเพิ่มเติมแบบซ่อนอยู่

ลำดับความสำคัญการเลือกโมเดลสำหรับงานแบบแยกคือ:

1. การ override โมเดลของ Gmail hook (เมื่อการรันมาจาก Gmail และ override นั้นได้รับอนุญาต)
2. `model` ในเพย์โหลดรายงาน
3. การ override โมเดลเซสชัน Cron ที่จัดเก็บและผู้ใช้เลือกไว้
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

Fast mode ตามการเลือก live ที่ resolve แล้วเช่นกัน หาก config โมเดลที่เลือกมี `params.fastMode` Cron แบบแยกจะใช้ค่านั้นโดยค่าเริ่มต้น การ override `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงมีผลเหนือกว่า config ได้ทั้งสองทิศทาง

หากการรันแบบแยกเจอการส่งต่อ live model-switch Cron จะลองซ้ำด้วยผู้ให้บริการ/โมเดลที่สลับไป และคงการเลือก live นั้นไว้สำหรับการรันที่ active ก่อนลองซ้ำ เมื่อการสลับมี auth profile ใหม่มาด้วย Cron จะคงการ override auth profile นั้นไว้สำหรับการรันที่ active ด้วย การลองซ้ำมีขอบเขต: หลังความพยายามแรกบวกกับการลองซ้ำจากการสลับ 2 ครั้ง Cron จะยกเลิกแทนที่จะวนลูปตลอดไป

ก่อนที่การรัน Cron แบบแยกจะเข้าสู่ agent runner OpenClaw จะตรวจสอบปลายทางผู้ให้บริการในเครื่องที่เข้าถึงได้สำหรับผู้ให้บริการที่กำหนดค่า `api: "ollama"` และ `api: "openai-completions"` ซึ่ง `baseUrl` เป็น loopback, เครือข่ายส่วนตัว หรือ `.local` หากปลายทางนั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาดผู้ให้บริการ/โมเดลที่ชัดเจน แทนที่จะเริ่มการเรียกโมเดล ผลลัพธ์ปลายทางจะถูกแคชไว้ 5 นาที ดังนั้นงานจำนวนมากที่ถึงกำหนดและใช้เซิร์ฟเวอร์ local Ollama, vLLM, SGLang หรือ LM Studio ตัวเดียวกันที่ล่ม จะใช้ probe เล็ก ๆ ร่วมกันหนึ่งครั้ง แทนที่จะสร้างคำขอจำนวนมาก การรันที่ถูกข้ามเพราะ provider-preflight จะไม่เพิ่ม backoff ของข้อผิดพลาดการดำเนินการ ให้เปิดใช้ `failureAlert.includeSkipped` เมื่อคุณต้องการการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและเอาต์พุต

| โหมด | สิ่งที่เกิดขึ้น |
| ---------- | ------------------------------------------------------------------- |
| `announce` | fallback-deliver ข้อความสุดท้ายไปยังเป้าหมายหากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST เพย์โหลดเหตุการณ์เสร็จสิ้นไปยัง URL |
| `none`     | ไม่มีการส่งมอบ fallback ของ runner |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัมของ Telegram ให้ใช้ `-1001234567890:topic:123`; ผู้เรียก RPC/config โดยตรงสามารถส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้เช่นกัน เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าแบบชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกแยะตัวพิมพ์เล็กใหญ่; ใช้ ID ห้องที่ตรงทั้งหมดหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งแบบ announce ใช้ `channel: "last"` หรือละเว้น `channel` เป้าหมายที่มีคำนำหน้าผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ cron จะย้อนกลับไปใช้ประวัติเซสชันหรือช่องทางเดียวที่กำหนดค่าไว้ เฉพาะคำนำหน้าที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ระบุไว้อย่างชัดเจน คำนำหน้าเป้าหมายต้องตั้งชื่อผู้ให้บริการเดียวกัน; ตัวอย่างเช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธแทนที่จะปล่อยให้ WhatsApp ตีความ ID ของ Telegram เป็นหมายเลขโทรศัพท์ คำนำหน้าชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>`, และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานแยกเดี่ยว การส่งแชทจะใช้ร่วมกัน หากมีเส้นทางแชท เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้าม announce สำรอง มิฉะนั้น `announce`, `webhook`, และ `none` จะควบคุมเฉพาะสิ่งที่รันเนอร์ทำกับคำตอบสุดท้ายหลังจากเทิร์นของเอเจนต์

เมื่อเอเจนต์สร้างการเตือนแบบแยกเดี่ยวจากแชทที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งสดที่รักษาไว้สำหรับเส้นทาง announce สำรอง คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งของผู้ให้บริการจะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชทปัจจุบัน

การส่ง announce แบบโดยนัยใช้รายการอนุญาตช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบความถูกต้องและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติจากที่เก็บการจับคู่ DM ไม่ใช่ผู้รับระบบอัตโนมัติสำรอง; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทางเมื่องานตามกำหนดเวลาควรส่งไปยัง DM เชิงรุก

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นแบบรวมสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นต่อหนึ่งงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่างและงานส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะย้อนกลับไปยังเป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักคือ `webhook`
- `failureAlert.includeSkipped: true` เลือกให้งานหรือนโยบายการแจ้งเตือน cron แบบรวมเข้าร่วมการแจ้งเตือนรันที่ถูกข้ามซ้ำ รันที่ถูกข้ามจะเก็บตัวนับการข้ามต่อเนื่องแยกต่างหาก จึงไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ

## ตัวอย่าง CLI

<Tabs>
  <Tab title="การเตือนแบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="งานแยกเดี่ยวที่เกิดซ้ำ">
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
  <Tab title="แทนที่โมเดลและการคิด">
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

Gateway สามารถเปิดเผยปลายทาง HTTP Webhook สำหรับทริกเกอร์ภายนอก เปิดใช้ในการกำหนดค่า:

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

ทุกคำขอต้องใส่โทเค็น hook ผ่านส่วนหัว:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

โทเค็นในสตริงคำค้นหาจะถูกปฏิเสธ

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
    เรียกใช้เทิร์นของเอเจนต์แบบแยกเดี่ยว:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Hook ที่แมปไว้ (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูกแก้ไขผ่าน `hooks.mappings` ในการกำหนดค่า การแมปสามารถแปลง payload ใดๆ เป็นการกระทำ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บปลายทาง hook ไว้เบื้องหลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้โทเค็น hook เฉพาะ; อย่านำโทเค็น auth ของ Gateway มาใช้ซ้ำ
- เก็บ `hooks.path` ไว้ในเส้นทางย่อยเฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- เก็บ `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการให้ผู้เรียกเลือกเซสชัน
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- Payload ของ hook จะถูกห่อด้วยขอบเขตความปลอดภัยตามค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้ hook ของ OpenClaw แล้ว, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียนการกำหนดค่า `hooks.gmail` เปิดใช้พรีเซ็ต Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

### การตั้งค่าด้วยตนเองครั้งเดียว

<Steps>
  <Step title="เลือกโปรเจกต์ GCP">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของไคลเอนต์ OAuth ที่ `gog` ใช้:

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
- หากโมเดลได้รับอนุญาต ผู้ให้บริการ/โมเดลที่ตรงนั้นจะไปถึงการรันเอเจนต์แบบแยกเดี่ยว
- หากไม่ได้รับอนุญาตหรือไม่สามารถแก้ไขได้ cron จะทำให้รันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบความถูกต้องที่ชัดเจน
- เชน fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ cron `--model` เป็นค่าหลักของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- Payload `fallbacks` แทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `fallbacks: []` ปิดใช้ fallback และทำให้รันเข้มงวด
- `--model` ธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้จะไม่ไหลต่อไปยังค่าหลักของเอเจนต์เป็นเป้าหมายลองซ้ำพิเศษแบบเงียบๆ

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

`maxConcurrentRuns` จำกัดทั้งการส่ง cron ตามกำหนดเวลาและการดำเนินการเทิร์นเอเจนต์แบบแยกเดี่ยว เทิร์นเอเจนต์ cron แบบแยกเดี่ยวใช้เลนการดำเนินการ `cron-nested` เฉพาะของคิวภายใน ดังนั้นการเพิ่มค่านี้จะทำให้รัน cron LLM อิสระดำเนินต่อแบบขนาน แทนที่จะเริ่มได้เฉพาะ wrapper cron ชั้นนอก เลน `nested` ที่ไม่ใช่ cron แบบใช้ร่วมกันจะไม่ถูกขยายด้วยการตั้งค่านี้

state sidecar ขณะรันได้มาจาก `cron.store`: store `.json` เช่น `~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ส่วนเส้นทาง store ที่ไม่มีส่วนต่อท้าย `.json` จะเติม `-state.json`

หากคุณแก้ไข `jobs.json` ด้วยมือ ให้กัน `jobs-state.json` ออกจาก source control OpenClaw ใช้ sidecar นั้นสำหรับสล็อตที่รอดำเนินการ เครื่องหมายที่ใช้งานอยู่ metadata ของรันล่าสุด และเอกลักษณ์กำหนดการที่บอก scheduler เมื่องานที่แก้ไขจากภายนอกต้องการ `nextRunAtMs` ใหม่

ปิดใช้ cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรมการลองซ้ำ">
    **การลองซ้ำแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะลองซ้ำได้สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้ทันที

    **การลองซ้ำแบบเกิดซ้ำ**: exponential backoff (30s ถึง 60m) ระหว่างการลองซ้ำ Backoff จะรีเซ็ตหลังจากรันสำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ล้างรายการเซสชันรันแบบแยกเดี่ยว `cron.runLog.maxBytes` / `cron.runLog.keepLines` ล้างไฟล์ run-log อัตโนมัติ
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
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
    - `reason: not-due` ในเอาต์พุตของรันหมายความว่าการรันด้วยตนเองถูกตรวจสอบด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่งมอบ">
    - โหมดการส่งมอบ `none` หมายความว่าจะไม่คาดหวังการส่งสำรองของ runner เอเจนต์ยังคงส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชตที่ใช้ได้
    - เป้าหมายการส่งมอบหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าข้ามการส่งออกแล้ว
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานเดิมที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้องของ Matrix แยกแยะตัวพิมพ์ใหญ่-เล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งมอบถูกบล็อกโดยข้อมูลรับรอง
    - หากการรันแบบแยกคืนเฉพาะโทเคนแบบเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรงและระงับเส้นทางสรุปที่เข้าคิวสำรองด้วย จึงไม่มีสิ่งใดถูกโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการโรลโอเวอร์ /new-style">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่ได้ใช้งานไม่ได้อิงตาม `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกของ Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ Gateway อาจอัปเดตแถวเซสชันสำหรับการกำหนดเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวเดิมที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชันใน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวเดิมที่ไม่ได้ใช้งานและไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนได้นั้นเป็นค่าฐานของการไม่ได้ใช้งาน

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มีเขตเวลาจะถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การแก้ค่าเขตเวลาที่กำหนดไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทงานสำหรับการดำเนินการ Cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นของเซสชันหลักแบบเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
