---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นมายัง OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-05-12T00:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่มาพร้อมระบบครอบคลุมสถานะ Codex CLI, [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin ภายนอกสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ ดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์กลางการย้ายข้อมูล](/th/install/migrating) แสดงรายการเส้นทางทั้งหมด
</Tip>

## คำสั่ง

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  ชื่อของผู้ให้บริการย้ายข้อมูลที่ลงทะเบียนไว้ เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งแล้ว
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลรับรองที่รองรับ ปิดไว้ตามค่าเริ่มต้น
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้ apply แทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานความขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมป์ยืนยัน จำเป็นในโหมดที่ไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอกสกิลหนึ่งรายการตามชื่อสกิลหรือรหัสรายการ ระบุแฟล็กซ้ำเพื่อย้ายหลายสกิล เมื่อไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย และการย้ายแบบไม่โต้ตอบจะเก็บสกิลที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--plugin <name>" type="string">
  เลือกรายการติดตั้ง Plugin ของ Codex หนึ่งรายการตามชื่อ Plugin หรือรหัสรายการ ระบุแฟล็กซ้ำเพื่อย้าย Plugin ของ Codex หลายรายการ เมื่อไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมายสำหรับ Plugin ของ Codex แบบเนทีฟ และการย้ายแบบไม่โต้ตอบจะเก็บ Plugin ที่วางแผนไว้ทั้งหมด ตัวเลือกนี้ใช้กับ Plugin ของ Codex จาก `openai-curated` ที่ติดตั้งจากซอร์สและค้นพบโดยอินเวนทอรีของ app-server ของ Codex เท่านั้น
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อน apply ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ในเครื่องอยู่แล้ว
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นต้องใช้ร่วมกับ `--no-backup` เมื่อ apply จะปฏิเสธการข้ามการสำรองข้อมูลหากไม่มีตัวเลือกนี้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์ apply เป็น JSON เมื่อใช้ `--json` โดยไม่มี `--yes` คำสั่ง apply จะพิมพ์แผนและไม่เปลี่ยนสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` เป็นแบบแสดงตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="แสดงตัวอย่างก่อน apply">
    ผู้ให้บริการจะส่งคืนแผนแบบแยกรายการก่อนที่สิ่งใดจะเปลี่ยนแปลง รวมถึงความขัดแย้ง รายการที่ข้าม และรายการอ่อนไหว แผน JSON, เอาต์พุต apply และรายงานการย้ายข้อมูลจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ เช่น คีย์ API, โทเค็น, เฮดเดอร์ authorization, คุกกี้ และรหัสผ่าน

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและขอคำยืนยันก่อนเปลี่ยนสถานะ เว้นแต่จะตั้งค่า `--yes` ในโหมดที่ไม่โต้ตอบ apply ต้องมี `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    apply จะสร้างและตรวจสอบข้อมูลสำรองของ OpenClaw ก่อนนำการย้ายข้อมูลไปใช้ หากยังไม่มีสถานะ OpenClaw ในเครื่อง ขั้นตอนสำรองข้อมูลจะถูกข้ามและการย้ายข้อมูลสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ความขัดแย้ง">
    apply จะปฏิเสธการดำเนินต่อเมื่อแผนมีความขัดแย้ง ตรวจสอบแผน แล้วเรียกใช้อีกครั้งด้วย `--overwrite` หากตั้งใจจะแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังคงเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ความลับ">
    ความลับจะไม่ถูกนำเข้าโดยค่าเริ่มต้น ใช้ `--include-secrets` เพื่อนำเข้าข้อมูลรับรองที่รองรับ
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่มาพร้อมระบบจะตรวจจับสถานะ Claude Code ที่ `~/.claude` ตามค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าโฮมหรือรูทโปรเจกต์ Claude Code เฉพาะ

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ ดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- `CLAUDE.md` ของโปรเจกต์และ `.claude/CLAUDE.md` เข้าสู่เวิร์กสเปซเอเจนต์ OpenClaw
- `~/.claude/CLAUDE.md` ของผู้ใช้ต่อท้ายไปยัง `USER.md` ของเวิร์กสเปซ
- นิยามเซิร์ฟเวอร์ MCP จาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code และ `claude_desktop_config.json` ของ Claude Desktop
- ไดเรกทอรีสกิลของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็นสกิล OpenClaw พร้อมการเรียกใช้แบบแมนนวลเท่านั้น

### สถานะเก็บถาวรและตรวจสอบด้วยตนเอง

ฮุก สิทธิ์ ค่าเริ่มต้นของสภาพแวดล้อม หน่วยความจำในเครื่อง กฎแบบกำหนดขอบเขตตามพาธ ซับเอเจนต์ แคช แผน และประวัติโปรเจกต์ของ Claude จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจสอบด้วยตนเอง OpenClaw จะไม่เรียกใช้ฮุก คัดลอก allowlist แบบกว้าง หรือนำเข้าสถานะข้อมูลรับรอง OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่มาพร้อมระบบจะตรวจจับสถานะ Codex CLI ที่ `~/.codex` ตามค่าเริ่มต้น หรือ
ที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมนั้นไว้ ใช้ `--from <path>` เพื่อ
ทำอินเวนทอรีโฮม Codex เฉพาะ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยัง OpenClaw Codex harness และคุณต้องการ
ยกระดับแอสเซ็ต Codex CLI ส่วนตัวที่มีประโยชน์อย่างตั้งใจ การเปิดใช้งาน Codex app-server
ในเครื่องใช้ไดเรกทอรี `CODEX_HOME` และ `HOME` ต่อเอเจนต์ ดังนั้นจึงไม่อ่าน
สถานะ Codex CLI ส่วนตัวของคุณตามค่าเริ่มต้น

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่างแผน
เต็มรูปแบบ จากนั้นเปิดตัวเลือกแบบช่องทำเครื่องหมายก่อนการยืนยัน apply ขั้นสุดท้าย รายการคัดลอกสกิล
จะถูกถามก่อน ใช้ `Toggle all on` หรือ `Toggle all off` สำหรับการเลือกเป็นชุด
สกิลที่วางแผนไว้จะเริ่มต้นเป็นถูกเลือก สกิลที่ขัดแย้งจะเริ่มต้นเป็นไม่ถูกเลือก และ
`Skip for now` จะข้ามการคัดลอกสกิลสำหรับการรันนี้โดยยังคงดำเนินต่อไปยังการเลือก
Plugin เมื่อ Plugin ของ Codex แบบ curated ที่ติดตั้งจากซอร์สสามารถย้ายได้และ
ไม่ได้ระบุ `--plugin` การย้ายข้อมูลจะถามต่อเพื่อเปิดใช้งาน Plugin ของ Codex
แบบเนทีฟตามชื่อ Plugin รายการ Plugin
จะเริ่มต้นเป็นถูกเลือก เว้นแต่คอนฟิก Plugin ของ OpenClaw Codex เป้าหมายจะมี
Plugin นั้นอยู่แล้ว Plugin เป้าหมายที่มีอยู่จะเริ่มต้นเป็นไม่ถูกเลือกและแสดงคำใบ้ความขัดแย้ง เช่น
`conflict: plugin exists`; เลือก `Toggle all off` เพื่อไม่ย้าย Plugin ของ Codex
แบบเนทีฟในการรันนั้น หรือ `Skip for now` เพื่อหยุดก่อน apply สำหรับการรันแบบสคริปต์หรือ
แบบเจาะจง ให้ส่ง `--skill <name>` หนึ่งครั้งต่อสกิล เช่น:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ใช้ `--plugin <name>` เพื่อจำกัดการย้าย Plugin ของ Codex แบบเนทีฟโดยไม่โต้ตอบ
ให้เหลือ Plugin curated ที่ติดตั้งจากซอร์สหนึ่งรายการขึ้นไป:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### สิ่งที่ Codex นำเข้า

- ไดเรกทอรีสกิลของ Codex CLI ภายใต้ `$CODEX_HOME/skills` โดยไม่รวมแคช
  `.system` ของ Codex
- AgentSkills ส่วนตัวภายใต้ `$HOME/.agents/skills` ซึ่งคัดลอกเข้าสู่เวิร์กสเปซ
  เอเจนต์ OpenClaw ปัจจุบันเมื่อคุณต้องการความเป็นเจ้าของต่อเอเจนต์
- Plugin ของ Codex จาก `openai-curated` ที่ติดตั้งจากซอร์สและค้นพบผ่าน
  `plugin/list` ของ app-server ของ Codex apply จะเรียก `plugin/install` ของ app-server สำหรับ
  Plugin ที่เลือกแต่ละรายการ แม้ app-server เป้าหมายจะรายงานอยู่แล้วว่า Plugin นั้น
  ติดตั้งและเปิดใช้งานแล้วก็ตาม Plugin ของ Codex ที่ย้ายแล้วใช้งานได้เฉพาะในเซสชันที่
  เลือก Codex harness แบบเนทีฟเท่านั้น และจะไม่ถูกเปิดเผยต่อ Pi, การรันผู้ให้บริการ OpenAI
  ปกติ, การผูกการสนทนา ACP หรือ harness อื่น

### สถานะ Codex ที่ต้องตรวจสอบด้วยตนเอง

`config.toml` ของ Codex, `hooks/hooks.json` แบบเนทีฟ, marketplace ที่ไม่ใช่ curated และ
บันเดิล Plugin ที่แคชไว้ซึ่งไม่ใช่ Plugin curated ที่ติดตั้งจากซอร์ส จะไม่ถูก
เปิดใช้งานโดยอัตโนมัติ สิ่งเหล่านี้จะถูกคัดลอกหรือรายงานในรายงานการย้ายข้อมูลเพื่อ
ตรวจสอบด้วยตนเอง

สำหรับ Plugin curated ที่ติดตั้งจากซอร์สซึ่งถูกย้ายแล้ว apply จะเขียน:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- รายการ Plugin แบบชัดเจนหนึ่งรายการพร้อม `marketplaceName: "openai-curated"` และ
  `pluginName` สำหรับ Plugin ที่เลือกแต่ละรายการ

การย้ายข้อมูลจะไม่เขียน `plugins["*"]` และจะไม่เก็บพาธแคช marketplace ในเครื่อง
การติดตั้งที่ต้องมีการยืนยันตัวตนจะถูกรายงานในรายการ Plugin ที่ได้รับผลกระทบด้วย
`status: "skipped"`, `reason: "auth_required"` และตัวระบุแอปที่ผ่านการทำให้ปลอดภัยแล้ว
รายการคอนฟิกแบบชัดเจนของรายการเหล่านั้นจะถูกเขียนเป็นปิดใช้งานจนกว่าคุณจะให้สิทธิ์ใหม่และ
เปิดใช้งาน การติดตั้งล้มเหลวอื่น ๆ จะเป็นผลลัพธ์ `error` ที่จำกัดระดับรายการ

หากอินเวนทอรี Plugin ของ app-server ของ Codex ไม่พร้อมใช้งานระหว่างการวางแผน การย้ายข้อมูล
จะถอยกลับไปใช้รายการคำแนะนำบันเดิลที่แคชไว้แทนที่จะทำให้การย้ายข้อมูลทั้งหมดล้มเหลว

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่มาพร้อมระบบจะตรวจจับสถานะที่ `~/.hermes` ตามค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- คอนฟิกโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และปลายทางที่เข้ากันได้กับ OpenAI แบบกำหนดเองจาก `providers` และ `custom_providers`
- นิยามเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` เข้าสู่เวิร์กสเปซเอเจนต์ OpenClaw
- `memories/MEMORY.md` และ `memories/USER.md` ต่อท้ายไปยังไฟล์หน่วยความจำของเวิร์กสเปซ
- ค่าเริ่มต้นคอนฟิกหน่วยความจำสำหรับหน่วยความจำไฟล์ OpenClaw รวมถึงรายการเก็บถาวรหรือรายการตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` ภายใต้ `skills/<name>/`
- ค่าคอนฟิกต่อสกิลจาก `skills.config`
- คีย์ API ที่รองรับจาก `.env` เฉพาะเมื่อใช้ `--include-secrets`

### คีย์ `.env` ที่รองรับ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`

### สถานะสำหรับเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกเข้าในรายงานการย้ายข้อมูลเพื่อการตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดเข้าในคอนฟิกหรือข้อมูลรับรอง OpenClaw ที่ใช้งานจริง วิธีนี้รักษาสถานะที่ทึบหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถดำเนินการหรือเชื่อถือได้โดยอัตโนมัติ:

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

แหล่งที่มาของการย้ายข้อมูลคือ Plugin Plugin จะประกาศรหัสผู้ให้บริการของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะรัน Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการจะ implements `detect`, `plan` และ `apply` Core เป็นเจ้าของการจัดลำดับ CLI, นโยบายการสำรองข้อมูล, พรอมป์, เอาต์พุต JSON และการตรวจล่วงหน้าความขัดแย้ง Core ส่งแผนที่ผ่านการตรวจสอบแล้วเข้าไปยัง `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่เฉพาะเมื่อไม่มีอาร์กิวเมนต์นั้นเพื่อความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์ที่รับรู้ความขัดแย้ง การคัดลอกรายงานแบบเก็บถาวรเท่านั้น wrappers ของ config-runtime ที่แคชไว้ และรายงานการย้ายข้อมูล

## การผสานเข้ากับการเริ่มต้นใช้งาน

การเริ่มต้นใช้งานสามารถเสนอการย้ายข้อมูลได้เมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการย้ายข้อมูล Plugin เดียวกันและยังคงแสดงตัวอย่างก่อน apply

<Note>
การนำเข้าในขั้นตอนออนบอร์ดต้องใช้การตั้งค่า OpenClaw ใหม่ หากคุณมีสถานะภายในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลประจำตัว เซสชัน และเวิร์กสเปซก่อน การนำเข้าแบบสำรองแล้วเขียนทับหรือแบบผสานถูกจำกัดด้วยฟีเจอร์สำหรับการตั้งค่าที่มีอยู่แล้ว
</Note>

## ที่เกี่ยวข้อง

- [ย้ายมาจาก Hermes](/th/install/migrating-hermes): คำแนะนำแบบทีละขั้นสำหรับผู้ใช้
- [ย้ายมาจาก Claude](/th/install/migrating-claude): คำแนะนำแบบทีละขั้นสำหรับผู้ใช้
- [การย้าย](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): ตรวจสุขภาพหลังจากใช้การย้าย
- [Plugin](/th/tools/plugin): การติดตั้งและลงทะเบียน Plugin
