---
read_when:
    - คุณย้ายมาจาก Hermes และต้องการคงการตั้งค่าโมเดล พรอมป์ หน่วยความจำ และ Skills ของคุณไว้
    - คุณต้องการทราบว่า OpenClaw นำเข้าอะไรโดยอัตโนมัติ และอะไรจะคงอยู่ในคลังเก็บถาวรเท่านั้น
    - คุณต้องมีแนวทางการย้ายระบบที่สะอาดและทำงานด้วยสคริปต์ได้ (CI, แล็ปท็อปที่เพิ่งตั้งค่าใหม่, ระบบอัตโนมัติ)
summary: ย้ายจาก Hermes ไปยัง OpenClaw ด้วยการนำเข้าที่แสดงตัวอย่างได้และย้อนกลับได้
title: การย้ายจาก Hermes
x-i18n:
    generated_at: "2026-04-30T10:01:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw นำเข้าสถานะ Hermes ผ่านผู้ให้บริการการย้ายข้อมูลที่รวมมาด้วย ผู้ให้บริการจะแสดงตัวอย่างทุกอย่างก่อนเปลี่ยนสถานะ ปกปิดความลับในแผนและรายงาน และสร้างข้อมูลสำรองที่ตรวจสอบแล้วก่อนนำไปใช้

<Note>
การนำเข้าต้องใช้การตั้งค่า OpenClaw ใหม่ หากคุณมีสถานะ OpenClaw ในเครื่องอยู่แล้ว ให้รีเซ็ต config, credentials, sessions และ workspace ก่อน หรือใช้ `openclaw migrate` โดยตรงพร้อม `--overwrite` หลังจากตรวจสอบแผนแล้ว
</Note>

## สองวิธีในการนำเข้า

<Tabs>
  <Tab title="ตัวช่วยเริ่มต้นใช้งาน">
    เส้นทางที่เร็วที่สุด ตัวช่วยจะตรวจพบ Hermes ที่ `~/.hermes` และแสดงตัวอย่างก่อนนำไปใช้

    ```bash
    openclaw onboard --flow import
    ```

    หรือชี้ไปยังแหล่งที่มาเฉพาะ:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    ใช้ `openclaw migrate` สำหรับการรันด้วยสคริปต์หรือการรันซ้ำได้ ดู [`openclaw migrate`](/th/cli/migrate) สำหรับเอกสารอ้างอิงฉบับเต็ม

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    เพิ่ม `--from <path>` เมื่อ Hermes อยู่ภายนอก `~/.hermes`

  </Tab>
</Tabs>

## สิ่งที่ถูกนำเข้า

<AccordionGroup>
  <Accordion title="การกำหนดค่าโมเดล">
    - การเลือกโมเดลเริ่มต้นจาก `config.yaml` ของ Hermes
    - ผู้ให้บริการโมเดลที่กำหนดค่าไว้และ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI จาก `providers` และ `custom_providers`

  </Accordion>
  <Accordion title="เซิร์ฟเวอร์ MCP">
    นิยามเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
  </Accordion>
  <Accordion title="ไฟล์ workspace">
    - `SOUL.md` และ `AGENTS.md` จะถูกคัดลอกไปยัง workspace ของ agent OpenClaw
    - `memories/MEMORY.md` และ `memories/USER.md` จะถูก **ผนวก** ไปยังไฟล์หน่วยความจำ OpenClaw ที่ตรงกันแทนการเขียนทับ

  </Accordion>
  <Accordion title="การกำหนดค่าหน่วยความจำ">
    ค่าเริ่มต้นของ config หน่วยความจำสำหรับหน่วยความจำไฟล์ของ OpenClaw ผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho จะถูกบันทึกเป็นรายการเก็บถาวรหรือรายการที่ต้องตรวจสอบด้วยตนเอง เพื่อให้คุณย้ายได้อย่างตั้งใจ
  </Accordion>
  <Accordion title="Skills">
    Skills ที่มีไฟล์ `SKILL.md` อยู่ใต้ `skills/<name>/` จะถูกคัดลอก พร้อมค่าการกำหนดค่าเฉพาะ Skill จาก `skills.config`
  </Accordion>
  <Accordion title="คีย์ API (เลือกใช้)">
    ตั้งค่า `--include-secrets` เพื่อนำเข้าคีย์ `.env` ที่รองรับ: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY` หากไม่มีแฟล็กนี้ ความลับจะไม่ถูกคัดลอกเลย
  </Accordion>
</AccordionGroup>

## สิ่งที่คงไว้เฉพาะในคลังเก็บถาวร

ผู้ให้บริการจะคัดลอกสิ่งเหล่านี้ไปยังไดเรกทอรีรายงานการย้ายข้อมูลสำหรับการตรวจสอบด้วยตนเอง แต่จะ **ไม่** โหลดเข้าไปใน config หรือ credentials ของ OpenClaw ที่ใช้งานจริง:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw ปฏิเสธการดำเนินการหรือเชื่อถือสถานะนี้โดยอัตโนมัติ เนื่องจากรูปแบบและสมมติฐานด้านความน่าเชื่อถืออาจเปลี่ยนแปลงต่างกันระหว่างระบบ ย้ายสิ่งที่คุณต้องการด้วยตนเองหลังจากตรวจสอบคลังเก็บถาวรแล้ว

## ขั้นตอนที่แนะนำ

<Steps>
  <Step title="ดูตัวอย่างแผน">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    แผนจะแสดงรายการทุกอย่างที่จะเปลี่ยนแปลง รวมถึงข้อขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อนใดๆ เอาต์พุตของแผนจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ

  </Step>
  <Step title="นำไปใช้พร้อมข้อมูลสำรอง">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw สร้างและตรวจสอบข้อมูลสำรองก่อนนำไปใช้ หากคุณต้องการนำเข้าคีย์ API ให้เพิ่ม `--include-secrets`

  </Step>
  <Step title="รัน doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/th/gateway/doctor) จะนำการย้าย config ที่ค้างอยู่กลับมาใช้ใหม่ และตรวจหาปัญหาที่เกิดขึ้นระหว่างการนำเข้า

  </Step>
  <Step title="รีสตาร์ตและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    ยืนยันว่า Gateway ทำงานปกติ และโมเดล หน่วยความจำ และ Skills ที่นำเข้าถูกโหลดแล้ว

  </Step>
</Steps>

## การจัดการข้อขัดแย้ง

การนำไปใช้จะปฏิเสธการดำเนินการต่อเมื่อแผนรายงานข้อขัดแย้ง (ไฟล์หรือค่า config มีอยู่แล้วที่ปลายทาง)

<Warning>
รันอีกครั้งพร้อม `--overwrite` เฉพาะเมื่อคุณตั้งใจแทนที่ปลายทางที่มีอยู่เท่านั้น ผู้ให้บริการอาจยังเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับไว้ในไดเรกทอรีรายงานการย้ายข้อมูล
</Warning>

สำหรับการติดตั้ง OpenClaw ใหม่ ข้อขัดแย้งพบได้ไม่บ่อย โดยทั่วไปจะเกิดขึ้นเมื่อคุณรันการนำเข้าอีกครั้งบนการตั้งค่าที่มีการแก้ไขของผู้ใช้อยู่แล้ว

หากข้อขัดแย้งปรากฏขึ้นระหว่างการนำไปใช้ (เช่น การแข่งขันที่ไม่คาดคิดบนไฟล์ config) Hermes จะทำเครื่องหมายรายการ config ที่ขึ้นต่อกันซึ่งเหลืออยู่เป็น `skipped` พร้อมเหตุผล `blocked by earlier apply conflict` แทนการเขียนบางส่วน รายงานการย้ายข้อมูลจะบันทึกแต่ละรายการที่ถูกบล็อก เพื่อให้คุณแก้ไขข้อขัดแย้งเดิมและรันการนำเข้าอีกครั้งได้

## ความลับ

ความลับจะไม่ถูกนำเข้าโดยค่าเริ่มต้น

- รัน `openclaw migrate apply hermes --yes` ก่อนเพื่อนำเข้าสถานะที่ไม่ใช่ความลับ
- หากคุณต้องการคัดลอกคีย์ `.env` ที่รองรับมาด้วย ให้รันอีกครั้งพร้อม `--include-secrets`
- สำหรับ credentials ที่จัดการโดย SecretRef ให้กำหนดค่าแหล่งที่มา SecretRef หลังจากการนำเข้าเสร็จสิ้น

## เอาต์พุต JSON สำหรับระบบอัตโนมัติ

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

เมื่อใช้ `--json` และไม่มี `--yes` การนำไปใช้จะพิมพ์แผนและไม่เปลี่ยนสถานะ นี่เป็นโหมดที่ปลอดภัยที่สุดสำหรับ CI และสคริปต์ที่ใช้ร่วมกัน

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="การนำไปใช้ปฏิเสธด้วยข้อขัดแย้ง">
    ตรวจสอบเอาต์พุตของแผน แต่ละข้อขัดแย้งจะระบุเส้นทางต้นทางและปลายทางที่มีอยู่ ตัดสินใจเป็นรายรายการว่าจะข้าม แก้ไขปลายทาง หรือรันอีกครั้งพร้อม `--overwrite`
  </Accordion>
  <Accordion title="Hermes อยู่ภายนอก ~/.hermes">
    ส่ง `--from /actual/path` (CLI) หรือ `--import-source /actual/path` (การเริ่มต้นใช้งาน)
  </Accordion>
  <Accordion title="การเริ่มต้นใช้งานปฏิเสธการนำเข้าบนการตั้งค่าที่มีอยู่">
    การนำเข้าผ่านการเริ่มต้นใช้งานต้องใช้การตั้งค่าใหม่ ให้รีเซ็ตสถานะแล้วเริ่มต้นใช้งานใหม่ หรือใช้ `openclaw migrate apply hermes` โดยตรง ซึ่งรองรับ `--overwrite` และการควบคุมข้อมูลสำรองอย่างชัดเจน
  </Accordion>
  <Accordion title="คีย์ API ไม่ถูกนำเข้า">
    ต้องใช้ `--include-secrets` และระบบจะรู้จักเฉพาะคีย์ที่ระบุไว้ด้านบนเท่านั้น ตัวแปรอื่นใน `.env` จะถูกละเว้น
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [`openclaw migrate`](/th/cli/migrate): เอกสารอ้างอิง CLI ฉบับเต็ม สัญญา Plugin และรูปแบบ JSON
- [การเริ่มต้นใช้งาน](/th/cli/onboard): flow ของตัวช่วยและแฟล็กแบบไม่โต้ตอบ
- [การย้ายข้อมูล](/th/install/migrating): ย้ายการติดตั้ง OpenClaw ระหว่างเครื่อง
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการย้ายข้อมูล
- [Workspace ของ agent](/th/concepts/agent-workspace): ตำแหน่งที่ `SOUL.md`, `AGENTS.md` และไฟล์หน่วยความจำอยู่
