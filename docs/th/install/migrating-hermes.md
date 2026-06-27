---
read_when:
    - คุณมาจาก Hermes และต้องการเก็บการกำหนดค่าโมเดล พรอมป์ หน่วยความจำ และ Skills ของคุณไว้
    - คุณต้องการทราบว่า OpenClaw นำเข้าอะไรโดยอัตโนมัติ และอะไรที่ยังคงเป็นแบบเก็บถาวรเท่านั้น
    - คุณต้องมีเส้นทางการย้ายระบบที่สะอาดและเขียนเป็นสคริปต์ได้ (CI, แล็ปท็อปเครื่องใหม่, ระบบอัตโนมัติ)
summary: ย้ายจาก Hermes ไปยัง OpenClaw ด้วยการนำเข้าที่แสดงตัวอย่างได้และย้อนกลับได้
title: การย้ายจาก Hermes
x-i18n:
    generated_at: "2026-06-27T17:44:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw นำเข้าสถานะ Hermes ผ่านผู้ให้บริการการย้ายข้อมูลที่รวมมาให้ ผู้ให้บริการจะแสดงตัวอย่างทุกอย่างก่อนเปลี่ยนสถานะ ปกปิดความลับในแผนและรายงาน และสร้างข้อมูลสำรองที่ตรวจสอบแล้วก่อนนำไปใช้

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

    หรือระบุแหล่งที่มาเฉพาะ:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    ใช้ `openclaw migrate` สำหรับการรันแบบสคริปต์หรือทำซ้ำได้ ดู [`openclaw migrate`](/th/cli/migrate) สำหรับเอกสารอ้างอิงฉบับเต็ม

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    เพิ่ม `--from <path>` เมื่อ Hermes อยู่ภายนอก `~/.hermes`

  </Tab>
</Tabs>

## สิ่งที่จะถูกนำเข้า

<AccordionGroup>
  <Accordion title="การกำหนดค่าโมเดล">
    - การเลือกโมเดลเริ่มต้นจาก Hermes `config.yaml`
    - ผู้ให้บริการโมเดลที่กำหนดค่าไว้ และ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI จาก `providers` และ `custom_providers`

  </Accordion>
  <Accordion title="เซิร์ฟเวอร์ MCP">
    นิยามเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
  </Accordion>
  <Accordion title="ไฟล์ workspace">
    - `SOUL.md` และ `AGENTS.md` จะถูกคัดลอกไปยัง workspace ของเอเจนต์ OpenClaw
    - `memories/MEMORY.md` และ `memories/USER.md` จะถูก **ผนวก** เข้ากับไฟล์หน่วยความจำ OpenClaw ที่ตรงกัน แทนการเขียนทับ

  </Accordion>
  <Accordion title="การกำหนดค่าหน่วยความจำ">
    ค่าเริ่มต้นของ config หน่วยความจำสำหรับหน่วยความจำแบบไฟล์ของ OpenClaw ผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho จะถูกบันทึกเป็นรายการเก็บถาวรหรือรายการที่ต้องตรวจสอบด้วยตนเอง เพื่อให้คุณย้ายได้อย่างตั้งใจ
  </Accordion>
  <Accordion title="Skills">
    Skills ที่มีไฟล์ `SKILL.md` ใต้ `skills/<name>/` จะถูกคัดลอก พร้อมกับค่า config ราย Skills จาก `skills.config`
  </Accordion>
  <Accordion title="ข้อมูลรับรองการยืนยันตัวตน">
    `openclaw migrate` แบบโต้ตอบจะถามก่อนนำเข้าข้อมูลรับรองการยืนยันตัวตน โดยเลือก yes เป็นค่าเริ่มต้น การนำเข้าที่รองรับรวมถึงข้อมูลรับรอง OpenCode OpenAI OAuth จาก OpenCode `auth.json`, รายการ OpenCode และ GitHub Copilot จาก OpenCode `auth.json` และ [คีย์ `.env` ที่รองรับ](/th/cli/migrate#supported-env-keys) รายการ OAuth ใน Hermes `auth.json` เป็นสถานะเดิม และจะแสดงเป็นงานยืนยันตัวตนซ้ำ/doctor แบบตรวจสอบด้วยตนเอง แทนการนำเข้าไปยัง auth ที่ใช้งานจริง ใช้ `--include-secrets` สำหรับการนำเข้าข้อมูลรับรองของ `openclaw migrate` แบบไม่โต้ตอบ, `--no-auth-credentials` เพื่อข้าม หรือใช้ `--import-secrets` ของ onboarding เมื่อนำเข้าจากตัวช่วยเริ่มต้นใช้งาน
  </Accordion>
</AccordionGroup>

## สิ่งที่คงไว้เป็นเก็บถาวรเท่านั้น

ผู้ให้บริการจะคัดลอกสิ่งเหล่านี้ไปยังไดเรกทอรีรายงานการย้ายข้อมูลเพื่อการตรวจสอบด้วยตนเอง แต่จะ **ไม่** โหลดเข้าไปยัง config หรือ credentials ของ OpenClaw ที่ใช้งานจริง:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw ปฏิเสธที่จะเรียกใช้หรือเชื่อถือสถานะนี้โดยอัตโนมัติ เพราะรูปแบบและสมมติฐานด้านความน่าเชื่อถืออาจแตกต่างกันระหว่างระบบ ย้ายสิ่งที่คุณต้องการด้วยตนเองหลังจากตรวจสอบ archive แล้ว

## ขั้นตอนที่แนะนำ

<Steps>
  <Step title="ดูตัวอย่างแผน">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    แผนจะแสดงทุกอย่างที่จะเปลี่ยน รวมถึงข้อขัดแย้ง รายการที่ถูกข้าม และรายการที่อ่อนไหวใดๆ ผลลัพธ์ของแผนจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ

  </Step>
  <Step title="นำไปใช้พร้อมข้อมูลสำรอง">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw สร้างและตรวจสอบข้อมูลสำรองก่อนนำไปใช้ ตัวอย่างแบบไม่โต้ตอบนี้นำเข้าสถานะที่ไม่ใช่ความลับ รันโดยไม่มี `--yes` เพื่อตอบ prompt ข้อมูลรับรอง หรือเพิ่ม `--include-secrets` เพื่อรวมข้อมูลรับรองที่รองรับในการรันแบบไม่ต้องเฝ้าดู

  </Step>
  <Step title="รัน doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/th/gateway/doctor) จะนำการย้าย config ที่ค้างอยู่ไปใช้อีกครั้ง และตรวจหาปัญหาที่เกิดขึ้นระหว่างการนำเข้า

  </Step>
  <Step title="รีสตาร์ตและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    ยืนยันว่า Gateway ทำงานปกติ และโมเดล หน่วยความจำ และ Skills ที่นำเข้าของคุณถูกโหลดแล้ว

  </Step>
</Steps>

## การจัดการข้อขัดแย้ง

Apply จะปฏิเสธที่จะดำเนินการต่อเมื่อแผนรายงานข้อขัดแย้ง (ไฟล์หรือค่า config มีอยู่แล้วที่ปลายทาง)

<Warning>
รันซ้ำพร้อม `--overwrite` เฉพาะเมื่อคุณตั้งใจแทนที่ปลายทางเดิมเท่านั้น ผู้ให้บริการอาจยังเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับในไดเรกทอรีรายงานการย้ายข้อมูล
</Warning>

สำหรับการติดตั้ง OpenClaw ใหม่ ข้อขัดแย้งพบไม่บ่อย โดยทั่วไปจะปรากฏเมื่อคุณรันการนำเข้าซ้ำบนการตั้งค่าที่มีการแก้ไขของผู้ใช้อยู่แล้ว

หากข้อขัดแย้งปรากฏระหว่าง apply (เช่น race ที่ไม่คาดคิดบนไฟล์ config) Hermes จะทำเครื่องหมายรายการ config ที่ขึ้นต่อกันที่เหลือเป็น `skipped` พร้อมเหตุผล `blocked by earlier apply conflict` แทนการเขียนบางส่วน รายงานการย้ายข้อมูลจะบันทึกแต่ละรายการที่ถูกบล็อก เพื่อให้คุณแก้ข้อขัดแย้งต้นทางและรันการนำเข้าใหม่ได้

## ความลับ

`openclaw migrate` แบบโต้ตอบจะถามว่าจะนำเข้าข้อมูลรับรองการยืนยันตัวตนที่ตรวจพบหรือไม่ โดยเลือก yes เป็นค่าเริ่มต้น

- การยอมรับ prompt จะนำเข้าข้อมูลรับรอง OpenCode OpenAI OAuth จาก OpenCode `auth.json`, รายการ OpenCode และ GitHub Copilot จาก OpenCode `auth.json` และ [คีย์ `.env` ที่รองรับ](/th/cli/migrate#supported-env-keys) รายการ OAuth ใน Hermes `auth.json` จะถูกรายงานสำหรับการยืนยันตัวตน OpenAI ใหม่ด้วยตนเองหรือการซ่อมแซมด้วย doctor
- ใช้ `--no-auth-credentials` หรือเลือก no ที่ prompt เพื่อนำเข้าเฉพาะสถานะที่ไม่ใช่ความลับ
- ใช้ `--include-secrets` เมื่อรันแบบไม่ต้องเฝ้าดูพร้อม `--yes`
- ใช้ `--import-secrets` ของ onboarding เมื่อนำเข้าข้อมูลรับรองจากตัวช่วยเริ่มต้นใช้งาน
- สำหรับข้อมูลรับรองที่จัดการด้วย SecretRef ให้กำหนดค่าแหล่ง SecretRef หลังจากการนำเข้าเสร็จสมบูรณ์

## ผลลัพธ์ JSON สำหรับระบบอัตโนมัติ

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

เมื่อใช้ `--json` และไม่มี `--yes` apply จะพิมพ์แผนและไม่เปลี่ยนสถานะ นี่เป็นโหมดที่ปลอดภัยที่สุดสำหรับ CI และสคริปต์ที่ใช้ร่วมกัน

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Apply ปฏิเสธด้วยข้อขัดแย้ง">
    ตรวจสอบผลลัพธ์ของแผน ข้อขัดแย้งแต่ละรายการจะระบุ path ต้นทางและปลายทางที่มีอยู่ ตัดสินใจเป็นรายรายการว่าจะข้าม แก้ไขปลายทาง หรือรันซ้ำพร้อม `--overwrite`
  </Accordion>
  <Accordion title="Hermes อยู่ภายนอก ~/.hermes">
    ส่ง `--from /actual/path` (CLI) หรือ `--import-source /actual/path` (onboarding)
  </Accordion>
  <Accordion title="Onboarding ปฏิเสธการนำเข้าบนการตั้งค่าที่มีอยู่แล้ว">
    การนำเข้าผ่าน onboarding ต้องใช้การตั้งค่าใหม่ ให้รีเซ็ตสถานะและ onboard ใหม่ หรือใช้ `openclaw migrate apply hermes` โดยตรง ซึ่งรองรับ `--overwrite` และการควบคุมข้อมูลสำรองอย่างชัดเจน
  </Accordion>
  <Accordion title="API keys ไม่ถูกนำเข้า">
    `openclaw migrate` แบบโต้ตอบจะนำเข้า API keys เฉพาะเมื่อคุณยอมรับ prompt ข้อมูลรับรอง การรัน `--yes` แบบไม่โต้ตอบต้องใช้ `--include-secrets`; การนำเข้าผ่าน onboarding ต้องใช้ `--import-secrets` ระบบจะรู้จักเฉพาะ [คีย์ `.env` ที่รองรับ](/th/cli/migrate#supported-env-keys); ตัวแปรอื่นใน `.env` จะถูกละเว้น
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [`openclaw migrate`](/th/cli/migrate): เอกสารอ้างอิง CLI ฉบับเต็ม, สัญญา Plugin และรูปแบบ JSON
- [Onboarding](/th/cli/onboard): flow ของตัวช่วยและ flag แบบไม่โต้ตอบ
- [การย้าย](/th/install/migrating): ย้ายการติดตั้ง OpenClaw ระหว่างเครื่อง
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการย้ายข้อมูล
- [Workspace ของเอเจนต์](/th/concepts/agent-workspace): ตำแหน่งที่ `SOUL.md`, `AGENTS.md` และไฟล์หน่วยความจำอยู่
