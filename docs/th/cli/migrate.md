---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นมาใช้ OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-04-30T20:05:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการการย้ายที่เป็นของ Plugin ผู้ให้บริการที่รวมมาให้ครอบคลุมสถานะ Codex CLI, [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin ภายนอกสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์กลางการย้าย](/th/install/migrating) แสดงรายการเส้นทางทั้งหมด
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
  ชื่อของผู้ให้บริการการย้ายที่ลงทะเบียนไว้ เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งไว้
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะแหล่งที่มา ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลประจำตัวที่รองรับ ปิดตามค่าเริ่มต้น
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้ apply แทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานข้อขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมต์ยืนยัน จำเป็นในโหมดที่ไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอก Skills หนึ่งรายการด้วยชื่อ Skills หรือรหัสรายการ ทำซ้ำแฟล็กเพื่อย้าย Skills หลายรายการ เมื่อเว้นไว้ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือกแบบกล่องกาเครื่องหมาย และการย้ายแบบไม่โต้ตอบจะคง Skills ที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อน apply ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ในเครื่องอยู่
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นพร้อมกับ `--no-backup` เมื่อ apply จะปฏิเสธการข้ามการสำรองข้อมูลในกรณีอื่น
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์ apply เป็น JSON เมื่อใช้ `--json` และไม่มี `--yes` apply จะพิมพ์แผนและไม่แก้ไขสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` ให้ดูตัวอย่างก่อนเสมอ

<AccordionGroup>
  <Accordion title="Preview before apply">
    ผู้ให้บริการส่งคืนแผนแบบแจกแจงรายการก่อนมีการเปลี่ยนแปลงใดๆ รวมถึงข้อขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON, เอาต์พุต apply และรายงานการย้ายจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ เช่น API keys, tokens, authorization headers, cookies และ passwords

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและแจ้งให้ยืนยันก่อนเปลี่ยนสถานะ เว้นแต่ตั้งค่า `--yes` ในโหมดที่ไม่โต้ตอบ apply ต้องใช้ `--yes`

  </Accordion>
  <Accordion title="Backups">
    Apply สร้างและตรวจสอบข้อมูลสำรอง OpenClaw ก่อนใช้การย้าย หากยังไม่มีสถานะ OpenClaw ในเครื่อง ขั้นตอนการสำรองข้อมูลจะถูกข้ามและการย้ายสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="Conflicts">
    Apply ปฏิเสธที่จะดำเนินต่อเมื่อแผนมีข้อขัดแย้ง ตรวจสอบแผน แล้วเรียกใช้ซ้ำพร้อม `--overwrite` หากตั้งใจจะแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับในไดเรกทอรีรายงานการย้าย
  </Accordion>
  <Accordion title="Secrets">
    ความลับจะไม่ถูกนำเข้าโดยค่าเริ่มต้น ใช้ `--include-secrets` เพื่อนำเข้าข้อมูลประจำตัวที่รองรับ
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่รวมมาให้ตรวจพบสถานะ Claude Code ที่ `~/.claude` ตามค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าโฮม Claude Code หรือรูทโปรเจกต์ที่ระบุ

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- `CLAUDE.md` ของโปรเจกต์และ `.claude/CLAUDE.md` เข้าไปในพื้นที่ทำงานเอเจนต์ OpenClaw
- ต่อท้าย `~/.claude/CLAUDE.md` ของผู้ใช้เข้าใน `USER.md` ของพื้นที่ทำงาน
- นิยามเซิร์ฟเวอร์ MCP จาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code และ `claude_desktop_config.json` ของ Claude Desktop
- ไดเรกทอรี Skills ของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็น Skills ของ OpenClaw โดยเรียกใช้แบบกำหนดเองเท่านั้น

### สถานะที่เก็บถาวรและต้องตรวจสอบด้วยตนเอง

Hooks, permissions, environment defaults, local memory, path-scoped rules, subagents, caches, plans และ project history ของ Claude จะถูกเก็บไว้ในรายงานการย้ายหรือรายงานเป็นรายการที่ต้องตรวจสอบด้วยตนเอง OpenClaw ไม่เรียกใช้ hooks, คัดลอก allowlists แบบกว้าง หรือ นำเข้าสถานะ OAuth/Desktop credential โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่รวมมาให้ตรวจพบสถานะ Codex CLI ที่ `~/.codex` ตามค่าเริ่มต้น หรือ
ที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมนั้น ใช้ `--from <path>` เพื่อ
ทำรายการโฮม Codex ที่ระบุ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยัง OpenClaw Codex harness และคุณต้องการ
ยกระดับสินทรัพย์ Codex CLI ส่วนตัวที่มีประโยชน์อย่างตั้งใจ การเปิดใช้งานเซิร์ฟเวอร์แอป Codex ในเครื่อง
ใช้ไดเรกทอรี `CODEX_HOME` และ `HOME` แยกตามเอเจนต์ ดังนั้นโดยค่าเริ่มต้นจึงไม่อ่าน
สถานะ Codex CLI ส่วนตัวของคุณ

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่าง
แผนทั้งหมด จากนั้นเปิดตัวเลือกแบบกล่องกาเครื่องหมายสำหรับรายการคัดลอก Skills ก่อนการยืนยัน
apply ขั้นสุดท้าย Skills ทั้งหมดถูกเลือกไว้ตั้งแต่ต้น ยกเลิกการเลือก Skills ใดๆ ที่คุณไม่ต้องการ
คัดลอกเข้าเอเจนต์นี้ สำหรับการเรียกใช้แบบสคริปต์หรือแบบเจาะจง ให้ส่ง `--skill <name>` หนึ่งครั้ง
ต่อ Skills เช่น:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### สิ่งที่ Codex นำเข้า

- ไดเรกทอรี Skills ของ Codex CLI ภายใต้ `$CODEX_HOME/skills` โดยไม่รวมแคช
  `.system` ของ Codex
- AgentSkills ส่วนตัวภายใต้ `$HOME/.agents/skills` ที่คัดลอกเข้าไปในพื้นที่ทำงาน
  เอเจนต์ OpenClaw ปัจจุบันเมื่อคุณต้องการความเป็นเจ้าของแยกตามเอเจนต์

### สถานะ Codex ที่ต้องตรวจสอบด้วยตนเอง

Plugin แบบ native ของ Codex, `config.toml` และ `hooks/hooks.json` แบบ native จะไม่
ถูกเปิดใช้งานโดยอัตโนมัติ Plugin อาจเปิดเผยเซิร์ฟเวอร์ MCP, แอป, hooks หรือพฤติกรรมอื่น
ที่เรียกใช้งานได้ ดังนั้นผู้ให้บริการจึงรายงานรายการเหล่านี้เพื่อการตรวจสอบแทนที่จะโหลด
เข้า OpenClaw ไฟล์ config และ hook จะถูกคัดลอกเข้าในรายงานการย้าย
เพื่อการตรวจสอบด้วยตนเอง

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่รวมมาให้ตรวจพบสถานะที่ `~/.hermes` ตามค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และ endpoint แบบ OpenAI-compatible ที่กำหนดเองจาก `providers` และ `custom_providers`
- นิยามเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` เข้าไปในพื้นที่ทำงานเอเจนต์ OpenClaw
- ต่อท้าย `memories/MEMORY.md` และ `memories/USER.md` เข้าในไฟล์หน่วยความจำของพื้นที่ทำงาน
- ค่าเริ่มต้นของ config หน่วยความจำสำหรับหน่วยความจำไฟล์ OpenClaw พร้อมรายการที่เก็บถาวรหรือต้องตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` ภายใต้ `skills/<name>/`
- ค่า config แยกตาม Skills จาก `skills.config`
- API keys ที่รองรับจาก `.env` เฉพาะเมื่อใช้ `--include-secrets`

### คีย์ `.env` ที่รองรับ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### สถานะที่เก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกเข้าในรายงานการย้ายเพื่อการตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดเข้า config หรือข้อมูลประจำตัว OpenClaw ที่ใช้งานจริง สิ่งนี้รักษาสถานะที่ทึบหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถเรียกใช้หรือเชื่อถือได้โดยอัตโนมัติ:

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

## สัญญา Plugin

แหล่งที่มาการย้ายคือ Plugin Plugin ประกาศ provider ids ของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะรัน Plugin เรียก `api.registerMigrationProvider(...)` ผู้ให้บริการใช้ `detect`, `plan` และ `apply` Core เป็นเจ้าของการจัดการ CLI, นโยบายการสำรองข้อมูล, พรอมต์, เอาต์พุต JSON และการตรวจสอบข้อขัดแย้งล่วงหน้า Core ส่งแผนที่ตรวจสอบแล้วเข้า `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่เฉพาะเมื่อไม่มีอาร์กิวเมนต์นั้นเพื่อความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป พร้อมกับ `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์ที่รับรู้ข้อขัดแย้ง, การคัดลอกรายงานแบบเก็บถาวรเท่านั้น, wrapper config-runtime ที่แคชไว้ และรายงานการย้าย

## การผสานกับ onboarding

Onboarding สามารถเสนอการย้ายเมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการการย้ายของ Plugin เดียวกัน และยังคงแสดงตัวอย่างก่อน apply

<Note>
การนำเข้าผ่าน onboarding ต้องใช้การตั้งค่า OpenClaw ใหม่ รีเซ็ต config, credentials, sessions และพื้นที่ทำงานก่อนหากคุณมีสถานะในเครื่องอยู่แล้ว การนำเข้าแบบสำรองข้อมูลพร้อมเขียนทับหรือแบบผสานถูกควบคุมด้วย feature gate สำหรับการตั้งค่าที่มีอยู่
</Note>

## ที่เกี่ยวข้อง

- [การย้ายจาก Hermes](/th/install/migrating-hermes): คำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้
- [การย้ายจาก Claude](/th/install/migrating-claude): คำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้
- [การย้าย](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานภาพหลังใช้การย้าย
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
