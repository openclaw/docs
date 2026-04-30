---
read_when:
    - คุณกำลังย้ายมาจาก Claude Code หรือ Claude Desktop และต้องการเก็บคำแนะนำ เซิร์ฟเวอร์ MCP และ Skills ไว้
    - คุณต้องเข้าใจว่า OpenClaw นำเข้าอะไรโดยอัตโนมัติ และอะไรที่ยังคงเก็บไว้ในคลังเท่านั้น
summary: ย้ายสถานะภายในเครื่องของ Claude Code และ Claude Desktop ไปยัง OpenClaw พร้อมดูตัวอย่างการนำเข้าก่อน
title: การย้ายจาก Claude
x-i18n:
    generated_at: "2026-04-30T10:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw นำเข้าสถานะ Claude ภายในเครื่องผ่านผู้ให้บริการการย้ายข้อมูล Claude ที่รวมมาให้ ผู้ให้บริการจะแสดงตัวอย่างทุกรายการก่อนเปลี่ยนสถานะ ปกปิดข้อมูลลับในแผนและรายงาน และสร้างข้อมูลสำรองที่ตรวจสอบแล้วก่อนนำไปใช้

<Note>
การนำเข้าระหว่างการตั้งค่าเริ่มต้นต้องใช้การตั้งค่า OpenClaw ใหม่ หากคุณมีสถานะ OpenClaw ภายในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลรับรอง เซสชัน และพื้นที่ทำงานก่อน หรือใช้ `openclaw migrate` โดยตรงพร้อม `--overwrite` หลังจากตรวจทานแผนแล้ว
</Note>

## สองวิธีในการนำเข้า

<Tabs>
  <Tab title="วิซาร์ดการตั้งค่าเริ่มต้น">
    วิซาร์ดจะแสดงตัวเลือก Claude เมื่อตรวจพบสถานะ Claude ภายในเครื่อง

    ```bash
    openclaw onboard --flow import
    ```

    หรือระบุแหล่งที่มาเฉพาะ:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    ใช้ `openclaw migrate` สำหรับการรันแบบสคริปต์หรือรันซ้ำได้ ดู [`openclaw migrate`](/th/cli/migrate) สำหรับข้อมูลอ้างอิงฉบับเต็ม

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    เพิ่ม `--from <path>` เพื่อนำเข้าโฮม Claude Code หรือรากโปรเจกต์เฉพาะ

  </Tab>
</Tabs>

## สิ่งที่จะถูกนำเข้า

<AccordionGroup>
  <Accordion title="คำสั่งและหน่วยความจำ">
    - เนื้อหา `CLAUDE.md` และ `.claude/CLAUDE.md` ของโปรเจกต์จะถูกคัดลอกหรือต่อท้ายเข้าไปใน `AGENTS.md` ของพื้นที่ทำงานเอเจนต์ OpenClaw
    - เนื้อหา `~/.claude/CLAUDE.md` ของผู้ใช้จะถูกต่อท้ายเข้าไปใน `USER.md` ของพื้นที่ทำงาน

  </Accordion>
  <Accordion title="เซิร์ฟเวอร์ MCP">
    นิยามเซิร์ฟเวอร์ MCP จะถูกนำเข้าจาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code และ `claude_desktop_config.json` ของ Claude Desktop เมื่อมีอยู่
  </Accordion>
  <Accordion title="Skills และคำสั่ง">
    - Skills ของ Claude ที่มีไฟล์ `SKILL.md` จะถูกคัดลอกเข้าไปในไดเรกทอรี Skills ของพื้นที่ทำงาน OpenClaw
    - ไฟล์ Markdown คำสั่งของ Claude ใต้ `.claude/commands/` หรือ `~/.claude/commands/` จะถูกแปลงเป็น Skills ของ OpenClaw พร้อม `disable-model-invocation: true`

  </Accordion>
</AccordionGroup>

## สิ่งที่จะเก็บเป็นไฟล์เก็บถาวรเท่านั้น

ผู้ให้บริการจะคัดลอกสิ่งเหล่านี้เข้าไปในรายงานการย้ายข้อมูลเพื่อให้ตรวจทานด้วยตนเอง แต่จะ **ไม่** โหลดเข้าไปในการกำหนดค่า OpenClaw ที่ใช้งานจริง:

- hooks ของ Claude
- สิทธิ์ของ Claude และ allowlist เครื่องมือแบบกว้าง
- ค่าเริ่มต้นสภาพแวดล้อมของ Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- ซับเอเจนต์ Claude ใต้ `.claude/agents/` หรือ `~/.claude/agents/`
- แคช แผน และไดเรกทอรีประวัติโปรเจกต์ของ Claude Code
- ส่วนขยาย Claude Desktop และข้อมูลรับรองที่เก็บในระบบปฏิบัติการ

OpenClaw ปฏิเสธการเรียกใช้ hooks การเชื่อถือ allowlist สิทธิ์ หรือการถอดรหัสสถานะข้อมูลรับรอง OAuth และ Desktop ที่ทึบแสงโดยอัตโนมัติ ย้ายสิ่งที่คุณต้องการด้วยตนเองหลังจากตรวจทานไฟล์เก็บถาวรแล้ว

## การเลือกแหล่งที่มา

หากไม่มี `--from` OpenClaw จะตรวจสอบโฮม Claude Code เริ่มต้นที่ `~/.claude` ไฟล์สถานะ Claude Code ตัวอย่าง `~/.claude.json` และการกำหนดค่า MCP ของ Claude Desktop บน macOS

เมื่อ `--from` ชี้ไปที่รากโปรเจกต์ OpenClaw จะนำเข้าเฉพาะไฟล์ Claude ของโปรเจกต์นั้น เช่น `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` และ `.mcp.json` โดยจะไม่อ่านโฮม Claude ส่วนกลางของคุณระหว่างการนำเข้าจากรากโปรเจกต์

## ขั้นตอนที่แนะนำ

<Steps>
  <Step title="ดูตัวอย่างแผน">
    ```bash
    openclaw migrate claude --dry-run
    ```

    แผนจะแสดงรายการทุกอย่างที่จะเปลี่ยนแปลง รวมถึงข้อขัดแย้ง รายการที่ข้าม และค่าที่ละเอียดอ่อนซึ่งถูกปกปิดจากฟิลด์ MCP `env` หรือ `headers` ที่ซ้อนกัน

  </Step>
  <Step title="นำไปใช้พร้อมข้อมูลสำรอง">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw จะสร้างและตรวจสอบข้อมูลสำรองก่อนนำไปใช้

  </Step>
  <Step title="รัน Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/th/gateway/doctor) ตรวจหาปัญหาการกำหนดค่าหรือสถานะหลังการนำเข้า

  </Step>
  <Step title="รีสตาร์ตและตรวจสอบ">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    ยืนยันว่า Gateway ทำงานปกติ และคำสั่ง เซิร์ฟเวอร์ MCP และ Skills ที่คุณนำเข้าถูกโหลดแล้ว

  </Step>
</Steps>

## การจัดการข้อขัดแย้ง

การนำไปใช้จะปฏิเสธการดำเนินการต่อเมื่อแผนรายงานข้อขัดแย้ง (มีไฟล์หรือค่าการกำหนดค่าอยู่ที่เป้าหมายแล้ว)

<Warning>
รันซ้ำพร้อม `--overwrite` เฉพาะเมื่อคุณตั้งใจจะแทนที่เป้าหมายเดิม ผู้ให้บริการอาจยังคงเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับไว้ในไดเรกทอรีรายงานการย้ายข้อมูล
</Warning>

สำหรับการติดตั้ง OpenClaw ใหม่ ข้อขัดแย้งพบได้ไม่บ่อย โดยมักปรากฏเมื่อคุณรันการนำเข้าซ้ำบนการตั้งค่าที่มีการแก้ไขจากผู้ใช้อยู่แล้ว

## เอาต์พุต JSON สำหรับระบบอัตโนมัติ

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

เมื่อใช้ `--json` และไม่มี `--yes` การนำไปใช้จะพิมพ์แผนและไม่เปลี่ยนสถานะ นี่เป็นโหมดที่ปลอดภัยที่สุดสำหรับ CI และสคริปต์ที่ใช้ร่วมกัน

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="สถานะ Claude อยู่ภายนอก ~/.claude">
    ส่ง `--from /actual/path` (CLI) หรือ `--import-source /actual/path` (การตั้งค่าเริ่มต้น)
  </Accordion>
  <Accordion title="การตั้งค่าเริ่มต้นปฏิเสธการนำเข้าบนการตั้งค่าที่มีอยู่แล้ว">
    การนำเข้าระหว่างการตั้งค่าเริ่มต้นต้องใช้การตั้งค่าใหม่ ให้รีเซ็ตสถานะและเริ่มตั้งค่าใหม่อีกครั้ง หรือใช้ `openclaw migrate apply claude` โดยตรง ซึ่งรองรับ `--overwrite` และการควบคุมข้อมูลสำรองอย่างชัดเจน
  </Accordion>
  <Accordion title="เซิร์ฟเวอร์ MCP จาก Claude Desktop ไม่ถูกนำเข้า">
    Claude Desktop อ่าน `claude_desktop_config.json` จากพาธเฉพาะแพลตฟอร์ม ชี้ `--from` ไปยังไดเรกทอรีของไฟล์นั้นหาก OpenClaw ตรวจไม่พบโดยอัตโนมัติ
  </Accordion>
  <Accordion title="คำสั่ง Claude กลายเป็น Skills ที่ปิดใช้งานการเรียกโมเดล">
    เป็นไปตามการออกแบบ คำสั่ง Claude เป็นคำสั่งที่ผู้ใช้เรียกใช้ ดังนั้น OpenClaw จึงนำเข้าเป็น Skills พร้อม `disable-model-invocation: true` แก้ไข frontmatter ของแต่ละ Skill หากคุณต้องการให้เอเจนต์เรียกใช้โดยอัตโนมัติ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [`openclaw migrate`](/th/cli/migrate): ข้อมูลอ้างอิง CLI ฉบับเต็ม สัญญา Plugin และรูปแบบ JSON
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด
- [การย้ายจาก Hermes](/th/install/migrating-hermes): เส้นทางนำเข้าข้ามระบบอีกแบบหนึ่ง
- [การตั้งค่าเริ่มต้น](/th/cli/onboard): ขั้นตอนวิซาร์ดและแฟล็กแบบไม่โต้ตอบ
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการย้ายข้อมูล
- [พื้นที่ทำงานเอเจนต์](/th/concepts/agent-workspace): ตำแหน่งที่ `AGENTS.md`, `USER.md` และ Skills อยู่
