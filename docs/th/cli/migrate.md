---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นเข้าสู่ OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-05-06T09:06:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่มาพร้อมระบบครอบคลุมสถานะ Codex CLI, [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin ภายนอกสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นสำหรับผู้ใช้ ดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์รวมการย้าย](/th/install/migrating) แสดงเส้นทางทั้งหมด
</Tip>

## คำสั่ง

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  ชื่อของผู้ให้บริการย้ายข้อมูลที่ลงทะเบียนไว้ เช่น `hermes` รัน `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งแล้ว
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะแหล่งที่มา ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลรับรองที่รองรับ ปิดโดยค่าเริ่มต้น
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้ apply แทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานข้อขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมป์ยืนยัน จำเป็นในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอก skill หนึ่งรายการตามชื่อ skill หรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้ายหลาย Skills เมื่อไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย และการย้ายแบบไม่โต้ตอบจะเก็บ Skills ที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อน apply ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ภายในเครื่องอยู่
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นควบคู่กับ `--no-backup` เมื่อ apply มิฉะนั้นจะปฏิเสธการข้ามการสำรองข้อมูล
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์ apply เป็น JSON เมื่อใช้ `--json` และไม่มี `--yes` apply จะพิมพ์แผนและไม่เปลี่ยนสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` ใช้แนวทางแสดงตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="ดูตัวอย่างก่อน apply">
    ผู้ให้บริการจะส่งคืนแผนแบบแยกรายการก่อนมีการเปลี่ยนแปลงใด ๆ รวมถึงข้อขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON, เอาต์พุต apply และรายงานการย้ายข้อมูลจะปกปิดคีย์ที่ดูเหมือนความลับที่ซ้อนอยู่ เช่น API keys, tokens, authorization headers, cookies และ passwords

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและถามก่อนเปลี่ยนสถานะ เว้นแต่ตั้งค่า `--yes` ในโหมดไม่โต้ตอบ apply ต้องใช้ `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    Apply จะสร้างและตรวจสอบการสำรองข้อมูล OpenClaw ก่อนใช้การย้ายข้อมูล หากยังไม่มีสถานะ OpenClaw ภายในเครื่อง ขั้นตอนสำรองข้อมูลจะถูกข้าม และการย้ายข้อมูลสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ข้อขัดแย้ง">
    Apply จะปฏิเสธการดำเนินต่อเมื่อแผนมีข้อขัดแย้ง ตรวจทานแผน จากนั้นรันซ้ำด้วย `--overwrite` หากตั้งใจจะแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังเขียนการสำรองข้อมูลระดับรายการสำหรับไฟล์ที่ถูกเขียนทับไว้ในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ความลับ">
    ความลับจะไม่ถูกนำเข้าโดยค่าเริ่มต้น ใช้ `--include-secrets` เพื่อนำเข้าข้อมูลรับรองที่รองรับ
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่มาพร้อมระบบตรวจพบสถานะ Claude Code ที่ `~/.claude` โดยค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าโฮม Claude Code หรือรากโปรเจ็กต์ที่ระบุ

<Tip>
สำหรับคำแนะนำแบบทีละขั้นสำหรับผู้ใช้ ดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- โปรเจ็กต์ `CLAUDE.md` และ `.claude/CLAUDE.md` เข้าไปในพื้นที่ทำงานเอเจนต์ OpenClaw
- ผู้ใช้ `~/.claude/CLAUDE.md` ต่อท้ายใน `USER.md` ของพื้นที่ทำงาน
- คำจำกัดความเซิร์ฟเวอร์ MCP จากโปรเจ็กต์ `.mcp.json`, Claude Code `~/.claude.json` และ Claude Desktop `claude_desktop_config.json`
- ไดเรกทอรี skill ของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็น Skills ของ OpenClaw โดยเรียกใช้แบบแมนนวลเท่านั้น

### สถานะที่เก็บถาวรและต้องตรวจทานด้วยตนเอง

Claude hooks, permissions, ค่าเริ่มต้นสภาพแวดล้อม, หน่วยความจำภายในเครื่อง, กฎตามขอบเขตพาธ, subagents, caches, plans และประวัติโปรเจ็กต์จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจทานด้วยตนเอง OpenClaw จะไม่เรียกใช้ hooks, คัดลอก allowlists แบบกว้าง หรือ import สถานะข้อมูลรับรอง OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่มาพร้อมระบบตรวจพบสถานะ Codex CLI ที่ `~/.codex` โดยค่าเริ่มต้น หรือ
ที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมนั้น ใช้ `--from <path>` เพื่อ
ทำรายการโฮม Codex ที่ระบุ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยัง OpenClaw Codex harness และคุณต้องการ
ยกระดับแอสเซ็ต Codex CLI ส่วนบุคคลที่มีประโยชน์อย่างตั้งใจ การเปิดใช้งาน Codex app-server ภายในเครื่อง
ใช้ไดเรกทอรี `CODEX_HOME` และ `HOME` แบบต่อเอเจนต์ ดังนั้นจึงไม่อ่าน
สถานะ Codex CLI ส่วนบุคคลของคุณโดยค่าเริ่มต้น

การรัน `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่างแผนทั้งหมด
จากนั้นเปิดตัวเลือกแบบช่องทำเครื่องหมายสำหรับรายการคัดลอก skill ก่อนการยืนยัน apply
ครั้งสุดท้าย ใช้ `Toggle all on` หรือ `Toggle all off` สำหรับการเลือกจำนวนมาก;
Skills ที่วางแผนไว้เริ่มต้นเป็นทำเครื่องหมายไว้ Skills ที่มีข้อขัดแย้งเริ่มต้นเป็นไม่ทำเครื่องหมาย และ `Skip for now`
ปล่อย Skills ไว้ตามเดิมโดยไม่ apply สำหรับการรันแบบสคริปต์หรือแบบแม่นยำ ให้ส่ง
`--skill <name>` หนึ่งครั้งต่อหนึ่ง skill เช่น:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### สิ่งที่ Codex นำเข้า

- ไดเรกทอรี skill ของ Codex CLI ใต้ `$CODEX_HOME/skills` ยกเว้นแคช
  `.system` ของ Codex
- AgentSkills ส่วนบุคคลใต้ `$HOME/.agents/skills` ซึ่งคัดลอกเข้าไปในพื้นที่ทำงานเอเจนต์
  OpenClaw ปัจจุบันเมื่อคุณต้องการความเป็นเจ้าของต่อเอเจนต์

### สถานะ Codex ที่ต้องตรวจทานด้วยตนเอง

Codex native plugins, `config.toml` และ native `hooks/hooks.json` จะไม่
ถูกเปิดใช้งานโดยอัตโนมัติ Plugins อาจเปิดเผย MCP servers, apps, hooks หรือพฤติกรรมอื่น
ที่เรียกทำงานได้ ดังนั้นผู้ให้บริการจึงรายงานสิ่งเหล่านั้นให้ตรวจทานแทนการโหลด
เข้า OpenClaw ไฟล์ config และ hook จะถูกคัดลอกเข้าไปในรายงานการย้ายข้อมูล
เพื่อการตรวจทานด้วยตนเอง

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่มาพร้อมระบบตรวจพบสถานะที่ `~/.hermes` โดยค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และปลายทางที่เข้ากันได้กับ OpenAI แบบกำหนดเองจาก `providers` และ `custom_providers`
- คำจำกัดความเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` เข้าไปในพื้นที่ทำงานเอเจนต์ OpenClaw
- `memories/MEMORY.md` และ `memories/USER.md` ต่อท้ายในไฟล์หน่วยความจำของพื้นที่ทำงาน
- ค่าเริ่มต้นการกำหนดค่าหน่วยความจำสำหรับหน่วยความจำไฟล์ของ OpenClaw รวมถึงรายการเก็บถาวรหรือต้องตรวจทานด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` ใต้ `skills/<name>/`
- ค่าการกำหนดค่าต่อ skill จาก `skills.config`
- API keys ที่รองรับจาก `.env` เฉพาะเมื่อใช้ `--include-secrets`

### คีย์ `.env` ที่รองรับ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### สถานะสำหรับเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกเข้าไปในรายงานการย้ายข้อมูลเพื่อการตรวจทานด้วยตนเอง แต่จะไม่ถูกโหลดเข้า config หรือข้อมูลรับรอง OpenClaw ที่ใช้งานจริง วิธีนี้รักษาสถานะที่คลุมเครือหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถเรียกใช้หรือเชื่อถือได้โดยอัตโนมัติ:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### หลังจาก apply

```bash
openclaw doctor
```

## สัญญาของ Plugin

แหล่งที่มาการย้ายข้อมูลคือ Plugins Plugin ประกาศรหัสผู้ให้บริการใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ระหว่างรันไทม์ Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการใช้งาน `detect`, `plan` และ `apply` Core เป็นเจ้าของการประสานงาน CLI, นโยบายการสำรองข้อมูล, prompts, เอาต์พุต JSON และการตรวจล่วงหน้าข้อขัดแย้ง Core ส่งแผนที่ตรวจทานแล้วเข้า `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่เฉพาะเมื่ออาร์กิวเมนต์นั้นไม่มีอยู่เพื่อความเข้ากันได้

Provider plugins สามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์ที่รับรู้ข้อขัดแย้ง, การคัดลอกรายงานแบบเก็บถาวรเท่านั้น, wrappers สำหรับ config-runtime แบบแคช และรายงานการย้ายข้อมูล

## การผสานรวมกับ Onboarding

Onboarding สามารถเสนอการย้ายข้อมูลเมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการย้ายข้อมูล Plugin เดียวกันและยังคงแสดงตัวอย่างก่อน apply

<Note>
การนำเข้าผ่าน Onboarding ต้องใช้การตั้งค่า OpenClaw ใหม่ รีเซ็ต config, credentials, sessions และพื้นที่ทำงานก่อนหากคุณมีสถานะภายในเครื่องอยู่แล้ว การนำเข้าแบบ backup-plus-overwrite หรือ merge ถูกจำกัดด้วย feature gate สำหรับการตั้งค่าที่มีอยู่
</Note>

## ที่เกี่ยวข้อง

- [การย้ายจาก Hermes](/th/install/migrating-hermes): คำแนะนำแบบทีละขั้นสำหรับผู้ใช้
- [การย้ายจาก Claude](/th/install/migrating-claude): คำแนะนำแบบทีละขั้นสำหรับผู้ใช้
- [การย้าย](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังจากใช้การย้ายข้อมูล
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
