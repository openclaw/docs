---
read_when:
    - การตั้งเวลางานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดตารางเวลาของ Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-05-06T17:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron คือตัวจัดตารางเวลาในตัวของ Gateway โดยจะเก็บงานแบบถาวร ปลุกเอเจนต์ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชทหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
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
- นิยามงานจะถูกเก็บถาวรที่ `~/.openclaw/cron/jobs.json` เพื่อให้การรีสตาร์ตไม่ทำให้ตารางเวลาสูญหาย
- สถานะการทำงานขณะรันจะถูกเก็บถาวรไว้ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ลงใน gitignore
- หลังจากการแยกไฟล์ OpenClaw เวอร์ชันเก่าสามารถอ่าน `jobs.json` ได้ แต่อาจถือว่างานเป็นงานใหม่ เพราะตอนนี้ฟิลด์ runtime อยู่ใน `jobs-state.json`
- เมื่อมีการแก้ไข `jobs.json` ระหว่างที่ Gateway กำลังรันหรือหยุดอยู่ OpenClaw จะเปรียบเทียบฟิลด์ตารางเวลาที่เปลี่ยนกับเมทาดาทาของสล็อต runtime ที่ค้างอยู่ แล้วล้างค่า `nextRunAtMs` ที่ล้าสมัย การเขียนใหม่ที่เป็นเพียงการจัดรูปแบบหรือเปลี่ยนเฉพาะลำดับคีย์จะคงสล็อตที่ค้างอยู่ไว้
- การทำงานของ cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน งาน agent-turn แบบแยกที่เลยกำหนดจะถูกจัดตารางใหม่ให้อยู่นอกช่วงเชื่อมต่อช่องทางแทนที่จะเล่นซ้ำทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่าคำสั่งเนทีฟยังตอบสนองได้ดีหลังรีสตาร์ต
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จตามค่าเริ่มต้น
- การรัน cron แบบแยกจะพยายามปิดแท็บเบราว์เซอร์/กระบวนการที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของตนเมื่อการรันเสร็จสิ้น เพื่อไม่ให้อัตโนมัติบนเบราว์เซอร์ที่แยกออกมาทิ้งกระบวนการกำพร้าไว้
- การรัน cron แบบแยกที่ได้รับสิทธิ์การล้างตัวเองของ cron แบบจำกัด ยังสามารถอ่านสถานะตัวจัดตารางเวลาและรายการงานปัจจุบันของตนที่กรองเฉพาะตัวเองได้ เพื่อให้การตรวจสอบสถานะ/Heartbeat ตรวจดูตารางเวลาของตนเองได้โดยไม่ต้องได้สิทธิ์แก้ไข cron ที่กว้างขึ้น
- การรัน cron แบบแยกยังป้องกันการตอบรับที่ล้าสมัยด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และคำใบ้ลักษณะเดียวกัน) และไม่มีการรัน subagent ลูกหลานใดยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะพร้อมต์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน cron แบบแยกจะใช้เมทาดาทาการปฏิเสธการทำงานแบบมีโครงสร้างจากการรันที่ฝังไว้ก่อน จากนั้นจึง fallback ไปยังมาร์กเกอร์สรุป/ผลลัพธ์สุดท้ายที่รู้จัก เช่น `SYSTEM_RUN_DENIED` และ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกรายงานเป็นการรันสีเขียว
- การรัน cron แบบแยกยังถือว่าความล้มเหลวของเอเจนต์ระดับการรันเป็นข้อผิดพลาดของงาน แม้จะไม่มี payload ตอบกลับเกิดขึ้นก็ตาม เพื่อให้ความล้มเหลวของโมเดล/ผู้ให้บริการเพิ่มตัวนับข้อผิดพลาดและทริกเกอร์การแจ้งเตือนความล้มเหลว แทนที่จะล้างงานเป็นสำเร็จ
- เมื่อ agent-turn job แบบแยกถึง `timeoutSeconds` cron จะยกเลิกการรันเอเจนต์ที่อยู่เบื้องหลังและให้ช่วงเวลาสั้น ๆ สำหรับการล้างข้อมูล หากการรันไม่ระบายคิวจนหมด การล้างข้อมูลที่ Gateway เป็นเจ้าของจะบังคับล้างความเป็นเจ้าของเซสชันของการรันนั้นก่อนที่ cron จะบันทึกการหมดเวลา เพื่อไม่ให้งานแชทที่เข้าคิวค้างอยู่หลังเซสชันประมวลผลที่ล้าสมัย

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ cron ให้ runtime เป็นเจ้าของก่อน และใช้ประวัติที่คงทนเป็นฐานรองลงมา: งาน cron ที่ยังทำงานอยู่จะยังคง live ตราบใดที่ cron runtime ยังติดตามงานนั้นว่า running แม้จะยังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อ runtime หยุดเป็นเจ้าของงานและหน้าต่างผ่อนผัน 5 นาทีหมดอายุ การบำรุงรักษาจะตรวจบันทึกการรันและสถานะงานที่เก็บถาวรสำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติที่คงทนนั้นแสดงผลลัพธ์ปลายทาง บัญชีแยกประเภทงานจะถูกสรุปจากข้อมูลนั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบแบบ CLI ออฟไลน์สามารถกู้คืนจากประวัติที่คงทนได้ แต่จะไม่ถือว่าชุด active-job ในกระบวนการของตนที่ว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภทตารางเวลา

| ชนิด    | แฟล็ก CLI  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp แบบครั้งเดียว (ISO 8601 หรือแบบสัมพันธ์ เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาคงที่                                          |
| `cron`  | `--cron`  | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่เป็นตัวเลือก |

timestamp ที่ไม่มีเขตเวลาจะถือว่าเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการจัดตารางตามเวลานาฬิกาท้องถิ่น

นิพจน์แบบเกิดซ้ำตรงต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติได้สูงสุด 5 นาทีเพื่อลด load spikes ใช้ `--exact` เพื่อบังคับเวลาที่แม่นยำ หรือ `--stagger 30s` สำหรับหน้าต่างที่ระบุชัดเจน

### การใช้วันของเดือนและวันของสัปดาห์ใช้ตรรกะ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ wildcard croner จะถือว่าตรงเมื่อฟิลด์ **ใดฟิลด์หนึ่ง** ตรง ไม่ใช่ทั้งสองฟิลด์ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5-6 ครั้งต่อเดือนแทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR ค่าเริ่มต้นของ Croner ที่นี่ หากต้องการบังคับให้ต้องตรงทั้งสองเงื่อนไข ให้ใช้ตัวแก้ไขวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางบนฟิลด์หนึ่งแล้วตรวจอีกฟิลด์ใน prompt หรือคำสั่งของงาน

## รูปแบบการทำงาน

| รูปแบบ           | ค่า `--session`   | รันใน                  | เหมาะที่สุดสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| เซสชันหลัก    | `main`              | Heartbeat turn ถัดไป      | การเตือนความจำ, เหตุการณ์ระบบ        |
| แบบแยก        | `isolated`          | `cron:<jobId>` เฉพาะ | รายงาน, งานเบื้องหลัง      |
| เซสชันปัจจุบัน | `current`           | ผูกไว้ ณ เวลาสร้าง   | งานเกิดซ้ำที่รับรู้บริบท    |
| เซสชันกำหนดเอง  | `session:custom-id` | เซสชันชื่อที่คงอยู่ | workflow ที่ต่อยอดจากประวัติ |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    งาน **เซสชันหลัก** จะเพิ่ม system event เข้าคิว และเลือกปลุก Heartbeat ได้ (`--wake now` หรือ `--wake next-heartbeat`) system event เหล่านั้นจะไม่ขยายความสดใหม่สำหรับการรีเซ็ตรายวัน/เมื่อไม่ได้ใช้งานของเซสชันเป้าหมาย งาน **แบบแยก** จะรัน agent turn เฉพาะด้วยเซสชันใหม่ งาน **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทไว้ข้ามการรัน ทำให้ workflow เช่น daily standups ที่ต่อยอดจากสรุปก่อนหน้าเป็นไปได้
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    สำหรับงานแบบแยก "เซสชันใหม่" หมายถึง transcript/session id ใหม่สำหรับแต่ละการรัน OpenClaw อาจนำค่ากำหนดที่ปลอดภัยไปด้วย เช่น การตั้งค่า thinking/fast/verbose, labels และ model/auth override ที่ผู้ใช้เลือกไว้อย่างชัดเจน แต่จะไม่สืบทอดบริบทบทสนทนาแวดล้อมจากแถว cron เก่า: การกำหนดเส้นทาง channel/group, นโยบาย send หรือ queue, elevation, origin หรือการผูก ACP runtime ใช้ `current` หรือ `session:<id>` เมื่องานเกิดซ้ำควรตั้งใจต่อยอดจากบริบทบทสนทนาเดียวกัน
  </Accordion>
  <Accordion title="Runtime cleanup">
    สำหรับงานแบบแยก การรื้อ runtime ตอนนี้รวมการพยายามล้างข้อมูลเบราว์เซอร์สำหรับเซสชัน cron นั้นด้วย ความล้มเหลวในการล้างข้อมูลจะถูกละเว้น เพื่อให้ผลลัพธ์จริงของ cron ยังคงมีผลเหนือกว่า

    การรัน cron แบบแยกยัง dispose อินสแตนซ์ MCP runtime ที่ bundled ไว้ซึ่งสร้างสำหรับงาน ผ่านเส้นทางล้าง runtime ที่ใช้ร่วมกัน สิ่งนี้ตรงกับวิธีรื้อ MCP clients ของเซสชันหลักและเซสชันกำหนดเอง ดังนั้นงาน cron แบบแยกจะไม่ปล่อยให้กระบวนการลูก stdio หรือการเชื่อมต่อ MCP อายุยาวรั่วข้ามการรัน

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    เมื่อการรัน cron แบบแยกประสานงาน subagents การส่งมอบจะเลือกผลลัพธ์สุดท้ายของลูกหลานมากกว่าข้อความชั่วคราวของพาเรนต์ที่ล้าสมัย หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจากพาเรนต์นั้นแทนที่จะประกาศออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความเท่านั้น OpenClaw จะส่งข้อความผู้ช่วยสุดท้ายตาม canonical หนึ่งครั้ง แทนที่จะเล่นซ้ำทั้ง payload ข้อความแบบ streamed/intermediate และคำตอบสุดท้าย media และ payload Discord แบบมีโครงสร้างยังคงถูกส่งเป็น payload แยก เพื่อไม่ให้ไฟล์แนบและ components ถูกทิ้ง

  </Accordion>
</AccordionGroup>

### ตัวเลือก payload สำหรับงานแบบแยก

<ParamField path="--message" type="string" required>
  ข้อความ prompt (จำเป็นสำหรับแบบแยก)
</ParamField>
<ParamField path="--model" type="string">
  model override; ใช้โมเดลที่อนุญาตซึ่งเลือกไว้สำหรับงาน
</ParamField>
<ParamField path="--thinking" type="string">
  thinking level override
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการ inject ไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดเครื่องมือที่งานใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้โมเดลที่อนุญาตซึ่งเลือกไว้เป็นโมเดลหลักของงานนั้น สิ่งนี้ไม่เหมือนกับ override `/model` ของเซสชันแชท: configured fallback chains ยังคงมีผลเมื่อโมเดลหลักของงานล้มเหลว หากโมเดลที่ขอไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้การรันล้มเหลวด้วยข้อผิดพลาดการตรวจสอบที่ชัดเจน แทนที่จะ fallback แบบเงียบ ๆ ไปยังการเลือก agent/default model ของงาน

งาน Cron ยังสามารถมี `fallbacks` ระดับ payload ได้ เมื่อมีอยู่ รายการนั้นจะแทนที่ configured fallback chain สำหรับงาน ใช้ `fallbacks: []` ใน job payload/API เมื่อต้องการการรัน cron แบบเข้มงวดที่ลองเฉพาะโมเดลที่เลือก หากงานมี `--model` แต่ไม่มี fallback ทั้งใน payload หรือที่ configured ไว้ OpenClaw จะส่ง fallback override ว่างแบบชัดเจน เพื่อไม่ให้ agent primary ถูกต่อท้ายเป็นเป้าหมาย retry เพิ่มเติมที่ซ่อนอยู่

ลำดับความสำคัญในการเลือกโมเดลสำหรับงานแบบแยกคือ:

1. Gmail hook model override (เมื่อการรันมาจาก Gmail และ override นั้นได้รับอนุญาต)
2. `model` ใน payload รายงานต่อ job
3. stored cron session model override ที่ผู้ใช้เลือกไว้
4. การเลือก agent/default model

Fast mode จะตามการเลือก live ที่ resolve แล้วเช่นกัน หาก config ของโมเดลที่เลือกมี `params.fastMode` cron แบบแยกจะใช้ค่านั้นตามค่าเริ่มต้น stored session `fastMode` override ยังคงมีผลเหนือกว่า config ได้ทั้งสองทิศทาง

หากการรันแบบแยกพบ live model-switch handoff cron จะ retry ด้วย provider/model ที่สลับแล้ว และ persist การเลือก live นั้นสำหรับการรันที่ active ก่อน retry เมื่อการสลับยังพก auth profile ใหม่มาด้วย cron จะ persist auth profile override นั้นสำหรับการรันที่ active ด้วย จำนวน retry มีขอบเขต: หลังจากความพยายามแรกบวก switch retry 2 ครั้ง cron จะยกเลิกแทนที่จะวนตลอดไป

ก่อนที่การรัน cron แบบแยกจะเข้าสู่ agent runner OpenClaw จะตรวจปลายทางผู้ให้บริการ local ที่เข้าถึงได้สำหรับ provider ที่ configured เป็น `api: "ollama"` และ `api: "openai-completions"` ซึ่ง `baseUrl` เป็น loopback, private-network หรือ `.local` หาก endpoint นั้นล่ม การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาด provider/model ที่ชัดเจน แทนที่จะเริ่มเรียกโมเดล ผล endpoint จะถูกแคชไว้ 5 นาที ดังนั้นงานครบกำหนดจำนวนมากที่ใช้เซิร์ฟเวอร์ local Ollama, vLLM, SGLang หรือ LM Studio เดียวกันที่ล่ม จะใช้ probe ขนาดเล็กร่วมกันเพียงครั้งเดียวแทนที่จะสร้างพายุ request การรันที่ข้ามเพราะ provider-preflight จะไม่เพิ่ม execution-error backoff; เปิดใช้ `failureAlert.includeSkipped` เมื่อต้องการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและผลลัพธ์

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | fallback-deliver ข้อความสุดท้ายไปยังเป้าหมายหากเอเจนต์ไม่ได้ส่ง |
| `webhook`  | POST payload เหตุการณ์เสร็จสิ้นไปยัง URL                                |
| `none`     | ไม่มี fallback delivery ของ runner                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่อง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; ผู้เรียกผ่าน RPC/config โดยตรงอาจส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้เช่นกัน เป้าหมาย Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกตัวพิมพ์เล็กใหญ่; ใช้ ID ห้องที่ถูกต้องตรงตัวหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่ง announce ใช้ `channel: "last"` หรือละ `channel` ไว้ เป้าหมายที่มีคำนำหน้าผู้ให้บริการ เช่น `telegram:123` สามารถเลือกช่องได้ก่อนที่ Cron จะย้อนกลับไปใช้ประวัติเซสชันหรือช่องเดียวที่กำหนดค่าไว้ เฉพาะคำนำหน้าที่ Plugin ที่โหลดอยู่ประกาศไว้เท่านั้นที่เป็นตัวเลือกผู้ให้บริการ หาก `delivery.channel` ถูกระบุชัดเจน คำนำหน้าเป้าหมายต้องตั้งชื่อผู้ให้บริการเดียวกัน; ตัวอย่างเช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธแทนที่จะปล่อยให้ WhatsApp ตีความ ID Telegram เป็นหมายเลขโทรศัพท์ คำนำหน้าประเภทเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องเป็นเจ้าของ ไม่ใช่ตัวเลือกผู้ให้บริการ

สำหรับงานแบบแยกเดี่ยว การส่งแชทจะถูกใช้ร่วมกัน หากมีเส้นทางแชท เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่า/เป้าหมายปัจจุบัน OpenClaw จะข้าม announce สำรอง มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่รันเนอร์ทำกับคำตอบสุดท้ายหลังจากรอบการทำงานของเอเจนต์เท่านั้น

เมื่อเอเจนต์สร้างการเตือนความจำแบบแยกเดี่ยวจากแชทที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งสดที่เก็บรักษาไว้สำหรับเส้นทาง announce สำรอง คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งของผู้ให้บริการจะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชทปัจจุบัน

การส่ง announce โดยนัยใช้ allowlist ของช่องที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติใน pairing-store ของ DM ไม่ใช่ผู้รับการทำงานอัตโนมัติสำรอง; ตั้งค่า `delivery.to` หรือกำหนดค่าเอนทรี `allowFrom` ของช่องเมื่องานตามกำหนดการควรส่งไปยัง DM เชิงรุก

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` แทนที่ค่านั้นรายงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่างและงานส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะย้อนกลับไปยังเป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักคือ `webhook`
- `failureAlert.includeSkipped: true` เลือกให้งานหรือนโยบายการแจ้งเตือน Cron ส่วนกลางรวมการแจ้งเตือนรอบการทำงานที่ถูกข้ามซ้ำ ๆ รอบการทำงานที่ถูกข้ามจะเก็บตัวนับการข้ามต่อเนื่องแยกต่างหาก ดังนั้นจึงไม่กระทบ backoff ของข้อผิดพลาดการดำเนินการ

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

ทุกคำขอต้องมีโทเค็น hook ผ่านส่วนหัว:

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
    รันรอบการทำงานของเอเจนต์แบบแยกเดี่ยว:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูกแปลงผ่าน `hooks.mappings` ในการกำหนดค่า การแมปสามารถแปลง payload ใด ๆ เป็นการดำเนินการ `wake` หรือ `agent` ด้วยเทมเพลตหรือการแปลงโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้โทเค็น hook เฉพาะ; อย่านำโทเค็นยืนยันตัวตน Gateway มาใช้ซ้ำ
- เก็บ `hooks.path` ไว้บน subpath เฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการเซสชันที่ผู้เรียกเลือกได้
- หากคุณเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบคีย์เซสชันที่อนุญาต
- payload ของ hook จะถูกห่อด้วยขอบเขตความปลอดภัยตามค่าเริ่มต้น

</Warning>

## การผสานรวม Gmail PubSub

เชื่อมต่อทริกเกอร์กล่องจดหมาย Gmail กับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้ hook ของ OpenClaw แล้ว, Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียนการกำหนดค่า `hooks.gmail` เปิดใช้ preset ของ Gmail และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch โดยอัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

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
- หากโมเดลได้รับอนุญาต ผู้ให้บริการ/โมเดลนั้นจะไปถึงการรันเอเจนต์แบบแยกเดี่ยวตรงตามที่ระบุ
- หากไม่ได้รับอนุญาตหรือไม่สามารถแปลงได้ Cron จะทำให้การรันล้มเหลวพร้อมข้อผิดพลาดการตรวจสอบความถูกต้องที่ชัดเจน
- เชน fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ Cron `--model` เป็นค่าหลักของงาน ไม่ใช่การแทนที่ `/model` ของเซสชัน
- Payload `fallbacks` จะแทนที่ fallback ที่กำหนดค่าไว้สำหรับงานนั้น; `fallbacks: []` ปิดใช้งาน fallback และทำให้การรันเข้มงวด
- `--model` แบบธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้จะไม่ตกต่อไปยังค่าหลักของเอเจนต์เป็นเป้าหมายลองซ้ำเพิ่มเติมแบบเงียบ ๆ

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

`maxConcurrentRuns` จำกัดทั้งการ dispatch Cron ตามกำหนดการและการดำเนินการรอบเอเจนต์แบบแยกเดี่ยว รอบเอเจนต์ Cron แบบแยกเดี่ยวใช้เลนการดำเนินการ `cron-nested` เฉพาะของคิวภายใน ดังนั้นการเพิ่มค่านี้จะช่วยให้การรัน LLM ของ Cron ที่เป็นอิสระต่อกันคืบหน้าแบบขนาน แทนที่จะเริ่มได้เฉพาะ wrapper Cron ชั้นนอกของแต่ละงาน เลน `nested` แบบไม่ใช่ Cron ที่ใช้ร่วมกันจะไม่ถูกขยายด้วยการตั้งค่านี้

ไฟล์ sidecar สถานะรันไทม์ได้มาจาก `cron.store`: store `.json` เช่น `~/clawd/cron/jobs.json` ใช้ `~/clawd/cron/jobs-state.json` ขณะที่พาธ store ที่ไม่มีส่วนท้าย `.json` จะต่อท้าย `-state.json`

หากคุณแก้ไข `jobs.json` ด้วยมือ ให้ปล่อย `jobs-state.json` ไว้นอกการควบคุมซอร์ส OpenClaw ใช้ sidecar นั้นสำหรับสล็อตที่รอดำเนินการ เครื่องหมาย active เมตาดาต้าการรันล่าสุด และอัตลักษณ์ของกำหนดการที่บอกตัวจัดตารางเวลาเมื่องานที่ถูกแก้ไขจากภายนอกต้องการ `nextRunAtMs` ใหม่

ปิดใช้งาน Cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="Retry behavior">
    **การลองซ้ำแบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (ขีดจำกัดอัตรา, overload, เครือข่าย, ข้อผิดพลาดเซิร์ฟเวอร์) จะลองซ้ำสูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้งานทันที

    **การลองซ้ำแบบเกิดซ้ำ**: exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการลองซ้ำ Backoff จะรีเซ็ตหลังจากการรันครั้งถัดไปสำเร็จ

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ลบเอนทรีเซสชันการรันแบบแยกเดี่ยวที่หมดอายุ `cron.runLog.maxBytes` / `cron.runLog.keepLines` ตัดทอนไฟล์บันทึกการรันโดยอัตโนมัติ
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
    - ยืนยันว่า Gateway ทำงานอย่างต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
    - `reason: not-due` ในเอาต์พุตการรันหมายความว่าการรันด้วยตนเองถูกตรวจด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่ง">
    - โหมดการส่ง `none` หมายความว่าไม่คาดหวังการส่งสำรองจาก runner เอเจนต์ยังคงส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชทพร้อมใช้งาน
    - เป้าหมายการส่งหายไป/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าการส่งออกถูกข้าม
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานแบบเก่าที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลวได้ เพราะ ID ห้องของ Matrix คำนึงถึงตัวพิมพ์ใหญ่-เล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงกันทุกประการจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดยข้อมูลประจำตัว
    - หากการรันแบบแยกส่งคืนเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรงและระงับเส้นทางสรุปที่เข้าคิวสำรองด้วย ดังนั้นจะไม่มีสิ่งใดถูกโพสต์กลับไปยังแชท
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชทก่อนหน้า หรือช่องทาง/เป้าหมายที่ระบุชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการโรลโอเวอร์ /new-style">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่มีการใช้งานไม่ได้อิงตาม `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกของ Cron, การรัน Heartbeat, การแจ้งเตือน exec และงานบันทึกสถานะของ Gateway อาจอัปเดตแถวเซสชันสำหรับการกำหนดเส้นทาง/สถานะ แต่จะไม่ต่ออายุ `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวแบบเก่าที่สร้างก่อนจะมีฟิลด์เหล่านี้ OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชันของ transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวแบบเก่าที่ไม่มีการใช้งานและไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนนั้นเป็น baseline ของช่วงไม่มีการใช้งาน

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มีเขตเวลาจะถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การแปลงเขตเวลาที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทงานสำหรับการดำเนินการ Cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นของเซสชันหลักเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
