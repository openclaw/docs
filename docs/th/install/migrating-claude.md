---
read_when:
    - คุณกำลังย้ายมาจาก Claude Code หรือ Claude Desktop และต้องการเก็บคำสั่ง เซิร์ฟเวอร์ MCP และทักษะไว้
    - คุณต้องเข้าใจว่า OpenClaw นำเข้าสิ่งใดโดยอัตโนมัติ และสิ่งใดคงอยู่เฉพาะในคลังถาวร
summary: ย้ายสถานะภายในเครื่องของ Claude Code และ Claude Desktop ไปยัง OpenClaw ด้วยการนำเข้าที่แสดงตัวอย่างล่วงหน้า
title: การย้ายจาก Claude
x-i18n:
    generated_at: "2026-07-12T16:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw นำเข้าสถานะ Claude ภายในเครื่องผ่านผู้ให้บริการย้ายข้อมูล Claude ที่รวมมาให้ ผู้ให้บริการจะแสดงตัวอย่างทุกรายการก่อนเปลี่ยนแปลงสถานะ ปกปิดข้อมูลลับในแผนและรายงาน และสร้างข้อมูลสำรองที่ผ่านการตรวจสอบก่อนนำการเปลี่ยนแปลงไปใช้

<Note>
การนำเข้าผ่านการเริ่มต้นใช้งานต้องใช้การตั้งค่า OpenClaw ใหม่ หากคุณมีสถานะ OpenClaw ภายในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลประจำตัว เซสชัน และพื้นที่ทำงานก่อน หรือใช้ `openclaw migrate` โดยตรงพร้อม `--overwrite` หลังจากตรวจสอบแผนแล้ว
</Note>

## สองวิธีในการนำเข้า

<Tabs>
  <Tab title="ตัวช่วยสร้างการเริ่มต้นใช้งาน">
    ตัวช่วยสร้างจะเสนอตัวเลือก Claude เมื่อตรวจพบสถานะ Claude ภายในเครื่อง

    ```bash
    openclaw onboard --flow import
    ```

    หรือระบุแหล่งที่มาเฉพาะ:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    ใช้ `openclaw migrate` สำหรับการทำงานแบบสคริปต์หรือการทำงานซ้ำได้ ดูข้อมูลอ้างอิงฉบับเต็มที่ [`openclaw migrate`](/th/cli/migrate)

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    เพิ่ม `--from <path>` เพื่อนำเข้าโฮม Claude Code หรือรากโปรเจกต์ที่ระบุ

  </Tab>
</Tabs>

## สิ่งที่จะถูกนำเข้า

<AccordionGroup>
  <Accordion title="คำสั่งและหน่วยความจำ">
    - เนื้อหา `CLAUDE.md` และ `.claude/CLAUDE.md` ของโปรเจกต์จะถูกคัดลอกหรือต่อท้ายใน `AGENTS.md` ของพื้นที่ทำงานเอเจนต์ OpenClaw
    - เนื้อหา `~/.claude/CLAUDE.md` ของผู้ใช้จะถูกต่อท้ายใน `USER.md` ของพื้นที่ทำงาน

  </Accordion>
  <Accordion title="เซิร์ฟเวอร์ MCP">
    คำนิยามเซิร์ฟเวอร์ MCP จะถูกนำเข้าจาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code และ `claude_desktop_config.json` ของ Claude Desktop เมื่อมีไฟล์เหล่านี้
  </Accordion>
  <Accordion title="Skills และคำสั่ง">
    - Skills ของ Claude ที่มีไฟล์ `SKILL.md` จะถูกคัดลอกไปยังไดเรกทอรี Skills ในพื้นที่ทำงาน OpenClaw
    - ไฟล์ Markdown คำสั่งของ Claude ภายใต้ `.claude/commands/` หรือ `~/.claude/commands/` จะถูกแปลงเป็น Skills ของ OpenClaw พร้อม `disable-model-invocation: true`

  </Accordion>
</AccordionGroup>

## สิ่งที่เก็บไว้เฉพาะในคลัง

ผู้ให้บริการจะคัดลอกรายการต่อไปนี้ไปยังรายงานการย้ายข้อมูลเพื่อตรวจสอบด้วยตนเอง แต่จะ **ไม่** โหลดรายการเหล่านี้เข้าสู่การกำหนดค่า OpenClaw ที่ใช้งานอยู่:

- ฮุกของ Claude
- สิทธิ์ของ Claude และรายการอนุญาตเครื่องมือแบบกว้าง
- ค่าเริ่มต้นของสภาพแวดล้อม Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- เอเจนต์ย่อยของ Claude ภายใต้ `.claude/agents/` หรือ `~/.claude/agents/`
- ไดเรกทอรีแคช แผน และประวัติโปรเจกต์ของ Claude Code
- ส่วนขยาย Claude Desktop และข้อมูลประจำตัวที่จัดเก็บโดยระบบปฏิบัติการ

OpenClaw ปฏิเสธที่จะเรียกใช้ฮุก เชื่อถือรายการอนุญาตสิทธิ์ หรือถอดรหัสสถานะข้อมูลประจำตัว OAuth และ Desktop ที่ไม่โปร่งใสโดยอัตโนมัติ ให้ย้ายสิ่งที่คุณต้องการด้วยตนเองหลังจากตรวจสอบคลังแล้ว

## การเลือกแหล่งที่มา

หากไม่มี `--from` OpenClaw จะตรวจสอบโฮม Claude Code เริ่มต้นที่ `~/.claude` ไฟล์สถานะตัวอย่างของ Claude Code ที่ `~/.claude.json` และการกำหนดค่า MCP ของ Claude Desktop บน macOS

เมื่อ `--from` ชี้ไปยังรากโปรเจกต์ OpenClaw จะนำเข้าเฉพาะไฟล์ Claude ของโปรเจกต์นั้น เช่น `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` และ `.mcp.json` โดยจะไม่อ่านโฮม Claude ส่วนกลางของคุณระหว่างการนำเข้าจากรากโปรเจกต์

## ขั้นตอนที่แนะนำ

<Steps>
  <Step title="ดูตัวอย่างแผน">
    ```bash
    openclaw migrate claude --dry-run
    ```

    แผนจะแสดงรายการทุกสิ่งที่จะเปลี่ยนแปลง รวมถึงข้อขัดแย้ง รายการที่ข้าม และค่าที่ละเอียดอ่อนซึ่งถูกปกปิดจากฟิลด์ MCP `env` หรือ `headers` ที่ซ้อนกัน

  </Step>
  <Step title="นำไปใช้พร้อมข้อมูลสำรอง">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw จะสร้างและตรวจสอบข้อมูลสำรองก่อนนำการเปลี่ยนแปลงไปใช้

  </Step>
  <Step title="เรียกใช้ Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/th/gateway/doctor) จะตรวจหาปัญหาการกำหนดค่าหรือสถานะหลังการนำเข้า

  </Step>
  <Step title="เริ่มใหม่และตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    ยืนยันว่า Gateway ทำงานเป็นปกติ และคำสั่ง เซิร์ฟเวอร์ MCP และ Skills ที่นำเข้าได้รับการโหลดแล้ว

  </Step>
</Steps>

## การจัดการข้อขัดแย้ง

การนำไปใช้จะปฏิเสธที่จะดำเนินการต่อเมื่อแผนรายงานข้อขัดแย้ง (มีไฟล์หรือค่าการกำหนดค่าอยู่ที่ปลายทางแล้ว)

<Warning>
เรียกใช้อีกครั้งพร้อม `--overwrite` เฉพาะเมื่อตั้งใจแทนที่ปลายทางที่มีอยู่ ผู้ให้บริการอาจยังคงเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับลงในไดเรกทอรีรายงานการย้ายข้อมูล
</Warning>

สำหรับการติดตั้ง OpenClaw ใหม่ ข้อขัดแย้งพบได้ไม่บ่อย โดยทั่วไปจะปรากฏเมื่อคุณเรียกใช้การนำเข้าอีกครั้งในการตั้งค่าที่มีการแก้ไขโดยผู้ใช้อยู่แล้ว

## เอาต์พุต JSON สำหรับระบบอัตโนมัติ

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

จำเป็นต้องใช้ `--yes` สำหรับ `migrate apply` นอกเทอร์มินัลแบบโต้ตอบ หากไม่มีตัวเลือกนี้ OpenClaw จะแจ้งข้อผิดพลาดแทนการนำไปใช้ ดังนั้นสคริปต์และ CI ต้องส่ง `--yes` อย่างชัดเจน ดูตัวอย่างก่อนด้วย `--dry-run --json` แล้วจึงนำไปใช้ด้วย `--json --yes` เมื่อแผนถูกต้องแล้ว

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="สถานะ Claude อยู่ภายนอก ~/.claude">
    ส่ง `--from /actual/path` (CLI) หรือ `--import-source /actual/path` (การเริ่มต้นใช้งาน)
  </Accordion>
  <Accordion title="การเริ่มต้นใช้งานปฏิเสธการนำเข้าในการตั้งค่าที่มีอยู่">
    การนำเข้าผ่านการเริ่มต้นใช้งานต้องใช้การตั้งค่าใหม่ ให้รีเซ็ตสถานะและเริ่มต้นใช้งานใหม่ หรือใช้ `openclaw migrate apply claude` โดยตรง ซึ่งรองรับ `--overwrite` และการควบคุมข้อมูลสำรองอย่างชัดเจน
  </Accordion>
  <Accordion title="เซิร์ฟเวอร์ MCP จาก Claude Desktop ไม่ถูกนำเข้า">
    Claude Desktop อ่าน `claude_desktop_config.json` จากเส้นทางเฉพาะแพลตฟอร์ม ให้ชี้ `--from` ไปยังไดเรกทอรีของไฟล์นั้น หาก OpenClaw ตรวจไม่พบโดยอัตโนมัติ
  </Accordion>
  <Accordion title="คำสั่ง Claude กลายเป็น Skills ที่ปิดการเรียกใช้โดยโมเดล">
    เป็นพฤติกรรมที่ออกแบบไว้ คำสั่ง Claude ถูกเรียกใช้โดยผู้ใช้ ดังนั้น OpenClaw จึงนำเข้าเป็น Skills พร้อม `disable-model-invocation: true` แก้ไข frontmatter ของแต่ละ Skill หากคุณต้องการให้เอเจนต์เรียกใช้โดยอัตโนมัติ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [`openclaw migrate`](/th/cli/migrate): ข้อมูลอ้างอิง CLI ฉบับเต็ม สัญญา Plugin และโครงสร้าง JSON
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด
- [การย้ายจาก Hermes](/th/install/migrating-hermes): เส้นทางการนำเข้าข้ามระบบอีกเส้นทางหนึ่ง
- [การเริ่มต้นใช้งาน](/th/cli/onboard): ขั้นตอนตัวช่วยสร้างและแฟล็กแบบไม่โต้ตอบ
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานะระบบหลังการย้ายข้อมูล
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace): ตำแหน่งที่จัดเก็บ `AGENTS.md`, `USER.md` และ Skills
