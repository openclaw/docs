---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นเข้าสู่ OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-05-10T19:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่มาพร้อมชุดครอบคลุมสถานะ Codex CLI, [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin ภายนอกสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นสำหรับผู้ใช้ โปรดดู [การย้ายข้อมูลจาก Claude](/th/install/migrating-claude) และ [การย้ายข้อมูลจาก Hermes](/th/install/migrating-hermes) [ศูนย์รวมการย้ายข้อมูล](/th/install/migrating) แสดงเส้นทางทั้งหมด
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
  ชื่อของผู้ให้บริการการย้ายข้อมูลที่ลงทะเบียนไว้ เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งไว้
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลประจำตัวที่รองรับ ปิดไว้ตามค่าเริ่มต้น
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้การ apply แทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานความขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมป์ยืนยัน จำเป็นในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอก skill หนึ่งรายการตามชื่อ skill หรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้ายหลาย skills เมื่อไม่ได้ระบุ การย้ายข้อมูล Codex แบบโต้ตอบจะแสดงตัวเลือกช่องทำเครื่องหมาย และการย้ายข้อมูลแบบไม่โต้ตอบจะเก็บ skills ที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--plugin <name>" type="string">
  เลือกรายการติดตั้ง Plugin ของ Codex หนึ่งรายการตามชื่อ Plugin หรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้าย Plugin ของ Codex หลายรายการ เมื่อไม่ได้ระบุ การย้ายข้อมูล Codex แบบโต้ตอบจะแสดงตัวเลือกช่องทำเครื่องหมาย Plugin ของ Codex แบบเนทีฟ และการย้ายข้อมูลแบบไม่โต้ตอบจะเก็บ Plugin ที่วางแผนไว้ทั้งหมด สิ่งนี้ใช้เฉพาะกับ Plugin ของ Codex `openai-curated` ที่ติดตั้งจากต้นทางซึ่งค้นพบโดยอินเวนทอรี app-server ของ Codex
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อน apply ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ในเครื่องอยู่
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นพร้อมกับ `--no-backup` เมื่อการ apply จะปฏิเสธการข้ามการสำรองข้อมูลในกรณีอื่น
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์ apply เป็น JSON เมื่อใช้ `--json` และไม่มี `--yes` การ apply จะพิมพ์แผนและไม่เปลี่ยนสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` เป็นแบบดูตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="ดูตัวอย่างก่อน apply">
    ผู้ให้บริการจะคืนแผนแบบแยกรายการก่อนที่สิ่งใดจะเปลี่ยนแปลง รวมถึงความขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON, เอาต์พุต apply และรายงานการย้ายข้อมูลจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ เช่น API keys, tokens, authorization headers, cookies และ passwords

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและถามก่อนเปลี่ยนสถานะ เว้นแต่จะตั้งค่า `--yes` ในโหมดไม่โต้ตอบ การ apply ต้องใช้ `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    การ apply จะสร้างและตรวจสอบการสำรองข้อมูล OpenClaw ก่อน apply การย้ายข้อมูล หากยังไม่มีสถานะ OpenClaw ในเครื่อง ขั้นตอนการสำรองข้อมูลจะถูกข้ามและการย้ายข้อมูลสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ความขัดแย้ง">
    การ apply จะปฏิเสธการดำเนินต่อเมื่อแผนมีความขัดแย้ง ตรวจสอบแผน แล้วเรียกใช้อีกครั้งด้วย `--overwrite` หากตั้งใจจะแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการยังอาจเขียนการสำรองข้อมูลระดับรายการสำหรับไฟล์ที่ถูกเขียนทับไว้ในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ความลับ">
    ความลับจะไม่ถูกนำเข้าตามค่าเริ่มต้น ใช้ `--include-secrets` เพื่อนำเข้าข้อมูลประจำตัวที่รองรับ
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่มาพร้อมชุดจะตรวจพบสถานะ Claude Code ที่ `~/.claude` ตามค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้า Claude Code home หรือ project root ที่เจาะจง

<Tip>
สำหรับคำแนะนำแบบทีละขั้นสำหรับผู้ใช้ โปรดดู [การย้ายข้อมูลจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- Project `CLAUDE.md` และ `.claude/CLAUDE.md` เข้าสู่พื้นที่ทำงานเอเจนต์ OpenClaw
- User `~/.claude/CLAUDE.md` ต่อท้ายไปยัง workspace `USER.md`
- นิยาม MCP server จาก project `.mcp.json`, Claude Code `~/.claude.json` และ Claude Desktop `claude_desktop_config.json`
- ไดเรกทอรี skill ของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็น skills ของ OpenClaw พร้อมการเรียกใช้ด้วยตนเองเท่านั้น

### สถานะเก็บถาวรและตรวจสอบด้วยตนเอง

Claude hooks, permissions, ค่าเริ่มต้น environment, local memory, กฎตามขอบเขตพาธ, subagents, caches, plans และ project history จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจสอบด้วยตนเอง OpenClaw จะไม่ดำเนินการ hooks, คัดลอก allowlists แบบกว้าง หรือนำเข้าสถานะ OAuth/Desktop credential โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่มาพร้อมชุดจะตรวจพบสถานะ Codex CLI ที่ `~/.codex` ตามค่าเริ่มต้น หรือ
ที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปร environment นั้น ใช้ `--from <path>` เพื่อ
ทำอินเวนทอรี Codex home ที่เจาะจง

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยัง OpenClaw Codex harness และคุณต้องการ
ยกระดับสินทรัพย์ Codex CLI ส่วนตัวที่มีประโยชน์อย่างตั้งใจ การเปิดใช้ Codex app-server
ในเครื่องใช้ไดเรกทอรี `CODEX_HOME` และ `HOME` แยกตามเอเจนต์ ดังนั้นจึงไม่อ่าน
สถานะ Codex CLI ส่วนตัวของคุณตามค่าเริ่มต้น

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่าง
แผนทั้งหมด จากนั้นเปิดตัวเลือกช่องทำเครื่องหมายก่อนการยืนยัน apply ขั้นสุดท้าย รายการ
คัดลอก Skill จะถูกถามก่อน ใช้ `Toggle all on` หรือ `Toggle all off` สำหรับการเลือก
แบบจำนวนมาก; skills ที่วางแผนไว้จะเริ่มต้นเป็นเลือกไว้, skills ที่มีความขัดแย้งจะเริ่มต้นเป็นไม่เลือก และ
`Skip for now` จะข้ามการคัดลอก skill สำหรับการเรียกใช้นี้โดยยังคงดำเนินต่อไปยังการเลือก
Plugin เมื่อ Plugin ของ Codex curated ที่ติดตั้งจากต้นทางสามารถย้ายได้และ
ไม่ได้ระบุ `--plugin` การย้ายข้อมูลจะถามต่อสำหรับการเปิดใช้งาน Plugin ของ Codex
แบบเนทีฟตามชื่อ Plugin รายการ Plugin
จะเริ่มต้นเป็นเลือกไว้ เว้นแต่ config Plugin ของ OpenClaw Codex เป้าหมายมี
Plugin นั้นอยู่แล้ว Plugin เป้าหมายที่มีอยู่จะเริ่มต้นเป็นไม่เลือกและแสดงคำใบ้ความขัดแย้ง เช่น
`conflict: plugin exists`; เลือก `Toggle all off` เพื่อไม่ย้าย Plugin ของ Codex
แบบเนทีฟในรอบนั้น หรือ `Skip for now` เพื่อหยุดก่อน apply สำหรับการเรียกใช้แบบสคริปต์หรือ
แบบเจาะจง ให้ส่ง `--skill <name>` หนึ่งครั้งต่อ skill เช่น:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ใช้ `--plugin <name>` เพื่อจำกัดการย้าย Plugin ของ Codex แบบเนทีฟในโหมดไม่โต้ตอบ
เป็น Plugin curated ที่ติดตั้งจากต้นทางหนึ่งรายการหรือมากกว่า:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### สิ่งที่ Codex นำเข้า

- ไดเรกทอรี skill ของ Codex CLI ภายใต้ `$CODEX_HOME/skills` ยกเว้น
  แคช `.system` ของ Codex
- AgentSkills ส่วนตัวภายใต้ `$HOME/.agents/skills` ที่คัดลอกเข้าสู่พื้นที่ทำงาน
  เอเจนต์ OpenClaw ปัจจุบันเมื่อคุณต้องการความเป็นเจ้าของแยกตามเอเจนต์
- Plugin ของ Codex `openai-curated` ที่ติดตั้งจากต้นทางซึ่งค้นพบผ่าน
  app-server `plugin/list` ของ Codex การ apply จะเรียก app-server `plugin/install` สำหรับแต่ละ
  Plugin ที่เลือก แม้ app-server เป้าหมายจะรายงานว่า Plugin นั้น
  ติดตั้งและเปิดใช้งานแล้วก็ตาม Plugin ของ Codex ที่ย้ายแล้วใช้ได้เฉพาะในเซสชันที่
  เลือก Codex harness แบบเนทีฟ; จะไม่ถูกเปิดเผยต่อ Pi, การรันผู้ให้บริการ OpenAI
  ตามปกติ, การผูกการสนทนา ACP หรือ harness อื่น

### สถานะ Codex ที่ต้องตรวจสอบด้วยตนเอง

Codex `config.toml`, `hooks/hooks.json` แบบเนทีฟ, marketplace ที่ไม่ใช่ curated และ
ชุด Plugin ที่แคชไว้ซึ่งไม่ใช่ Plugin curated ที่ติดตั้งจากต้นทางจะไม่ถูก
เปิดใช้งานโดยอัตโนมัติ สิ่งเหล่านี้จะถูกคัดลอกหรือรายงานในรายงานการย้ายข้อมูลสำหรับ
การตรวจสอบด้วยตนเอง

สำหรับ Plugin curated ที่ติดตั้งจากต้นทางซึ่งถูกย้าย การ apply จะเขียน:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- รายการ Plugin แบบชัดเจนหนึ่งรายการที่มี `marketplaceName: "openai-curated"` และ
  `pluginName` สำหรับแต่ละ Plugin ที่เลือก

การย้ายข้อมูลจะไม่เขียน `plugins["*"]` และไม่เก็บพาธแคช marketplace
ในเครื่อง การติดตั้งที่ต้องใช้ auth จะถูกรายงานบนรายการ Plugin ที่ได้รับผลกระทบพร้อม
`status: "skipped"`, `reason: "auth_required"` และตัวระบุแอปที่ผ่านการทำให้ปลอดภัย
รายการ config แบบชัดเจนของสิ่งเหล่านี้จะถูกเขียนแบบปิดใช้งานจนกว่าคุณจะอนุญาตใหม่และ
เปิดใช้งาน สิ่งล้มเหลวในการติดตั้งอื่นเป็นผลลัพธ์ `error` ที่จำกัดตามรายการ

หากอินเวนทอรี Plugin ของ Codex app-server ไม่พร้อมใช้งานระหว่างการวางแผน การย้ายข้อมูล
จะ fallback เป็นรายการคำแนะนำ bundle ที่แคชไว้แทนการทำให้การย้ายข้อมูลทั้งหมด
ล้มเหลว

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่มาพร้อมชุดจะตรวจพบสถานะที่ `~/.hermes` ตามค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และ endpoint ที่เข้ากันได้กับ OpenAI แบบกำหนดเองจาก `providers` และ `custom_providers`
- นิยาม MCP server จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` เข้าสู่พื้นที่ทำงานเอเจนต์ OpenClaw
- `memories/MEMORY.md` และ `memories/USER.md` ต่อท้ายไปยังไฟล์หน่วยความจำ workspace
- ค่าเริ่มต้น config หน่วยความจำสำหรับหน่วยความจำไฟล์ของ OpenClaw รวมถึงรายการเก็บถาวรหรือตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` ภายใต้ `skills/<name>/`
- ค่า config แยกตาม skill จาก `skills.config`
- API keys ที่รองรับจาก `.env` เฉพาะเมื่อใช้ `--include-secrets`

### คีย์ `.env` ที่รองรับ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### สถานะเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกลงในรายงานการย้ายข้อมูลสำหรับการตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดเข้าสู่ config หรือ credentials ของ OpenClaw ที่ใช้งานจริง สิ่งนี้รักษาสถานะที่ทึบหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถดำเนินการหรือเชื่อถือได้โดยอัตโนมัติ:

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

แหล่งที่มาการย้ายข้อมูลคือ Plugin Plugin ประกาศรหัสผู้ให้บริการของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะ runtime Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการ implements `detect`, `plan` และ `apply` Core เป็นเจ้าของการจัดการ CLI, นโยบายสำรองข้อมูล, พรอมป์, เอาต์พุต JSON และ preflight ความขัดแย้ง Core ส่งแผนที่ตรวจสอบแล้วเข้าไปใน `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่เฉพาะเมื่อไม่มีอาร์กิวเมนต์นั้นเพื่อความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์ที่รับรู้ความขัดแย้ง, การคัดลอกรายงานแบบเก็บถาวรเท่านั้น, wrappers config-runtime ที่แคชไว้ และรายงานการย้ายข้อมูล

## การผสานรวม onboarding

Onboarding สามารถเสนอการย้ายข้อมูลเมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการการย้ายข้อมูล Plugin เดียวกันและยังคงแสดงตัวอย่างก่อน apply

<Note>
การนำเข้าในขั้นตอนเริ่มต้นใช้งานต้องใช้การตั้งค่า OpenClaw ใหม่ทั้งหมด หากคุณมีสถานะในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลรับรอง เซสชัน และพื้นที่ทำงานก่อน การนำเข้าแบบสำรองข้อมูลแล้วเขียนทับหรือแบบผสานถูกจำกัดด้วย feature gate สำหรับการตั้งค่าที่มีอยู่แล้ว
</Note>

## ที่เกี่ยวข้อง

- [การย้ายจาก Hermes](/th/install/migrating-hermes): คำแนะนำแบบทีละขั้นสำหรับผู้ใช้
- [การย้ายจาก Claude](/th/install/migrating-claude): คำแนะนำแบบทีละขั้นสำหรับผู้ใช้
- [การย้าย](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานภาพหลังใช้การย้าย
- [Plugin](/th/tools/plugin): การติดตั้งและการลงทะเบียน plugin
