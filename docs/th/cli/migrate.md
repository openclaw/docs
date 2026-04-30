---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นเข้าสู่ OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-04-30T09:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่รวมมาให้รองรับ [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin ภายนอกสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์รวมการย้ายข้อมูล](/th/install/migrating) แสดงเส้นทางทั้งหมด
</Tip>

## คำสั่ง

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  ชื่อของผู้ให้บริการย้ายข้อมูลที่ลงทะเบียนไว้ เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งไว้
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลประจำตัวที่รองรับ ปิดไว้โดยค่าเริ่มต้น
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้การใช้งานแผนแทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานข้อขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมป์ยืนยัน จำเป็นในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อนใช้งานแผน ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ภายในเครื่องอยู่แล้ว
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นต้องใช้ร่วมกับ `--no-backup` เมื่อการใช้งานแผนจะปฏิเสธการข้ามการสำรองข้อมูลในกรณีอื่น
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์การใช้งานแผนเป็น JSON เมื่อใช้ `--json` โดยไม่มี `--yes` การใช้งานแผนจะพิมพ์แผนและไม่เปลี่ยนสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` เน้นการแสดงตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="แสดงตัวอย่างก่อนใช้งานแผน">
    ผู้ให้บริการจะส่งคืนแผนแบบแยกรายการก่อนมีการเปลี่ยนแปลงใด ๆ รวมถึงข้อขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON เอาต์พุตการใช้งานแผน และรายงานการย้ายข้อมูลจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ เช่น API keys, tokens, authorization headers, cookies และ passwords

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและถามก่อนเปลี่ยนสถานะ เว้นแต่จะตั้งค่า `--yes` ในโหมดไม่โต้ตอบ การใช้งานแผนต้องมี `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    การใช้งานแผนจะสร้างและตรวจสอบการสำรองข้อมูล OpenClaw ก่อนใช้การย้ายข้อมูล หากยังไม่มีสถานะ OpenClaw ภายในเครื่อง ขั้นตอนการสำรองข้อมูลจะถูกข้ามและการย้ายข้อมูลสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่แล้ว ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ข้อขัดแย้ง">
    การใช้งานแผนจะปฏิเสธการดำเนินต่อเมื่อแผนมีข้อขัดแย้ง ตรวจสอบแผน จากนั้นเรียกใช้อีกครั้งด้วย `--overwrite` หากตั้งใจจะแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ความลับ">
    ความลับจะไม่ถูกนำเข้าโดยค่าเริ่มต้น ใช้ `--include-secrets` เพื่อนำเข้าข้อมูลประจำตัวที่รองรับ
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่รวมมาให้จะตรวจจับสถานะ Claude Code ที่ `~/.claude` โดยค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าบ้านหรือรูทโปรเจกต์ Claude Code ที่ระบุ

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- โปรเจกต์ `CLAUDE.md` และ `.claude/CLAUDE.md` ไปยังเวิร์กสเปซเอเจนต์ OpenClaw
- ผู้ใช้ `~/.claude/CLAUDE.md` ที่ต่อท้ายไปยังเวิร์กสเปซ `USER.md`
- นิยามเซิร์ฟเวอร์ MCP จากโปรเจกต์ `.mcp.json`, Claude Code `~/.claude.json` และ Claude Desktop `claude_desktop_config.json`
- ไดเรกทอรี Skills ของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็น Skills ของ OpenClaw โดยเรียกใช้ด้วยตนเองเท่านั้น

### สถานะที่เก็บถาวรและต้องตรวจสอบด้วยตนเอง

ฮุก สิทธิ์ ค่าเริ่มต้นสภาพแวดล้อม หน่วยความจำภายในเครื่อง กฎตามขอบเขตพาธ ซับเอเจนต์ แคช แผน และประวัติโปรเจกต์ของ Claude จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจสอบด้วยตนเอง OpenClaw ไม่เรียกใช้ฮุก คัดลอก allowlist แบบกว้าง หรือนำเข้าสถานะข้อมูลประจำตัว OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่รวมมาให้จะตรวจจับสถานะที่ `~/.hermes` โดยค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และเอนด์พอยต์แบบเข้ากันได้กับ OpenAI ที่กำหนดเองจาก `providers` และ `custom_providers`
- นิยามเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` ไปยังเวิร์กสเปซเอเจนต์ OpenClaw
- `memories/MEMORY.md` และ `memories/USER.md` ที่ต่อท้ายไปยังไฟล์หน่วยความจำของเวิร์กสเปซ
- ค่าเริ่มต้นการกำหนดค่าหน่วยความจำสำหรับหน่วยความจำไฟล์ของ OpenClaw รวมถึงรายการที่เก็บถาวรหรือต้องตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` อยู่ใต้ `skills/<name>/`
- ค่าการกำหนดค่าราย Skill จาก `skills.config`
- API keys ที่รองรับจาก `.env` เฉพาะเมื่อใช้ `--include-secrets`

### คีย์ `.env` ที่รองรับ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### สถานะสำหรับเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกไปยังรายงานการย้ายข้อมูลเพื่อการตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดเข้าสู่การกำหนดค่าหรือข้อมูลประจำตัว OpenClaw ที่ใช้งานจริง การทำเช่นนี้เก็บรักษาสถานะที่ทึบหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถเรียกใช้หรือเชื่อถือได้โดยอัตโนมัติ:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### หลังจากใช้งานแผน

```bash
openclaw doctor
```

## สัญญา Plugin

แหล่งที่มาของการย้ายข้อมูลคือ Plugin Plugin ประกาศรหัสผู้ให้บริการของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

เมื่อรันไทม์ Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการใช้งาน `detect`, `plan` และ `apply` คอร์รับผิดชอบการจัดการ CLI นโยบายการสำรองข้อมูล พรอมป์ เอาต์พุต JSON และการตรวจสอบข้อขัดแย้งล่วงหน้า คอร์ส่งแผนที่ตรวจสอบแล้วเข้าไปยัง `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่ได้เฉพาะเมื่อไม่มีอาร์กิวเมนต์นั้นเพื่อความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและการนับสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์ที่รู้ข้อขัดแย้ง การคัดลอกรายงานสำหรับเก็บถาวรเท่านั้น ตัวห่อ config-runtime แบบแคช และรายงานการย้ายข้อมูล

## การผสานรวมกับการเริ่มต้นใช้งาน

การเริ่มต้นใช้งานสามารถเสนอการย้ายข้อมูลเมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการย้ายข้อมูลของ Plugin เดียวกันและยังคงแสดงตัวอย่างก่อนใช้งานแผน

<Note>
การนำเข้าระหว่างการเริ่มต้นใช้งานต้องใช้การตั้งค่า OpenClaw ใหม่ หากคุณมีสถานะภายในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลประจำตัว เซสชัน และเวิร์กสเปซก่อน การนำเข้าแบบสำรองข้อมูลพร้อมเขียนทับหรือแบบผสานถูกจำกัดด้วยฟีเจอร์เกตสำหรับการตั้งค่าที่มีอยู่
</Note>

## ที่เกี่ยวข้อง

- [การย้ายจาก Hermes](/th/install/migrating-hermes): คำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้
- [การย้ายจาก Claude](/th/install/migrating-claude): คำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้
- [การย้ายข้อมูล](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานะหลังจากใช้การย้ายข้อมูล
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
