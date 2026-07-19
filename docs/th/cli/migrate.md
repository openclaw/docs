---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นมายัง OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-07-19T07:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdedb1bf6c9def52079c021e4e77fe008c9394ee352bec299bf154687f62e514
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่รวมมาให้รองรับ Claude, Codex CLI และ [Hermes](/th/install/migrating-hermes) ส่วน Plugin สามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายข้อมูลจาก Claude](/th/install/migrating-claude) และ [การย้ายข้อมูลจาก Hermes](/th/install/migrating-hermes) [ศูนย์รวมการย้ายข้อมูล](/th/install/migrating) แสดงเส้นทางทั้งหมด
</Tip>

## คำสั่ง

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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

การเรียกใช้ `openclaw migrate <provider>` โดยไม่มีแฟล็กอื่นจะวางแผน แสดงตัวอย่าง และ (ใน TTY) ขอการยืนยันก่อนนำไปใช้ `openclaw migrate plan <provider>` และ `openclaw migrate apply <provider>` แยกการแสดงตัวอย่างและการนำไปใช้เป็นคำสั่งย่อยต่างหากโดยใช้แฟล็กชุดเดียวกัน

<ParamField path="<provider>" type="string">
  ชื่อผู้ให้บริการย้ายข้อมูลที่ลงทะเบียนแล้ว เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งไว้
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนและออกโดยไม่เปลี่ยนแปลงสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง Hermes ตรวจสอบ `$HERMES_HOME` และโปรไฟล์ที่ใช้งานอยู่ จากนั้นใช้ค่าเริ่มต้นของแพลตฟอร์ม (`~/.hermes` หรือ `%LOCALAPPDATA%\hermes`) Codex ใช้ `~/.codex` เป็นค่าเริ่มต้น (หรือ `$CODEX_HOME`) ส่วน Claude ใช้ `~/.claude` เป็นค่าเริ่มต้น
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลประจำตัวที่รองรับโดยไม่ขอการยืนยัน การนำไปใช้แบบโต้ตอบจะถามก่อนนำเข้าข้อมูลประจำตัวสำหรับการยืนยันตัวตนที่ตรวจพบ โดยเลือกใช่ไว้เป็นค่าเริ่มต้น ส่วน `--yes` แบบไม่โต้ตอบต้องใช้ `--include-secrets` เพื่อนำเข้าข้อมูลดังกล่าว
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  ข้ามการนำเข้าข้อมูลประจำตัวสำหรับการยืนยันตัวตน รวมถึงการขอการยืนยันแบบโต้ตอบ
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้การนำไปใช้แทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานข้อขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามการขอการยืนยัน จำเป็นต้องใช้ในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอกสกิลหนึ่งรายการด้วยชื่อสกิลหรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้ายข้อมูลหลายสกิล หากไม่ระบุ การย้ายข้อมูล Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย ส่วนการย้ายข้อมูลแบบไม่โต้ตอบจะคงสกิลที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--plugin <name>" type="string">
  เลือกรายการติดตั้ง Plugin Codex หนึ่งรายการด้วยชื่อ Plugin หรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้ายข้อมูล Plugin Codex หลายรายการ หากไม่ระบุ การย้ายข้อมูล Codex แบบโต้ตอบจะแสดงตัวเลือก Plugin Codex แบบช่องทำเครื่องหมายของ Codex โดยตรง ส่วนการย้ายข้อมูลแบบไม่โต้ตอบจะคง Plugin ที่วางแผนไว้ทั้งหมด ใช้ได้เฉพาะกับ Plugin Codex `openai-curated` ที่ติดตั้งจากซอร์สและค้นพบโดยบัญชีรายการ app-server ของ Codex
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  สำหรับ Codex เท่านั้น บังคับให้สำรวจ `app/list` ของ app-server ต้นทาง Codex ใหม่ก่อนวางแผนเปิดใช้งาน Plugin โดยตรง ปิดไว้เป็นค่าเริ่มต้นเพื่อให้การวางแผนย้ายข้อมูลรวดเร็ว
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  พาธหรือไดเรกทอรีของไฟล์เก็บถาวรสำรองก่อนการย้ายข้อมูล ส่งต่อไปยัง `openclaw backup create`
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อนนำไปใช้ ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ในเครื่อง
</ParamField>
<ParamField path="--force" type="boolean">
  ต้องใช้ร่วมกับ `--no-backup` เมื่อการนำไปใช้จะปฏิเสธการข้ามการสำรองข้อมูลในกรณีอื่น
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์การนำไปใช้เป็น JSON เมื่อใช้ `--json` โดยไม่มี `--yes` การนำไปใช้จะพิมพ์แผนและไม่เปลี่ยนแปลงสถานะ
</ParamField>

## รูปแบบความปลอดภัย

`openclaw migrate` ให้แสดงตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="แสดงตัวอย่างก่อนนำไปใช้">
    ผู้ให้บริการจะส่งคืนแผนที่แจกแจงเป็นรายรายการก่อนเกิดการเปลี่ยนแปลงใด ๆ รวมถึงข้อขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON ผลลัพธ์การนำไปใช้ และรายงานการย้ายข้อมูลจะปกปิดคีย์ซ้อนที่มีลักษณะเป็นข้อมูลลับ เช่น คีย์ API, โทเค็น, ส่วนหัวการให้สิทธิ์, คุกกี้ และรหัสผ่าน

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและขอการยืนยันก่อนเปลี่ยนแปลงสถานะ เว้นแต่ตั้งค่า `--yes` ในโหมดไม่โต้ตอบ การนำไปใช้ต้องใช้ `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    การนำไปใช้จะสร้างและตรวจสอบข้อมูลสำรองของ OpenClaw ก่อนนำการย้ายข้อมูลไปใช้ หากยังไม่มีสถานะ OpenClaw ในเครื่อง ขั้นตอนสำรองข้อมูลจะถูกข้ามและดำเนินการย้ายข้อมูลต่อ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ข้อขัดแย้ง">
    การนำไปใช้จะปฏิเสธการดำเนินการต่อเมื่อแผนมีข้อขัดแย้ง ตรวจสอบแผน แล้วเรียกใช้อีกครั้งพร้อม `--overwrite` หากตั้งใจแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังคงเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับไว้ในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ข้อมูลลับ">
    การนำไปใช้แบบโต้ตอบจะถามว่าต้องการนำเข้าข้อมูลประจำตัวสำหรับการยืนยันตัวตนที่ตรวจพบหรือไม่ โดยเลือกใช่ไว้เป็นค่าเริ่มต้น ใช้ `--no-auth-credentials` เพื่อข้าม หรือใช้ `--include-secrets` ร่วมกับ `--yes` เพื่อนำเข้าข้อมูลประจำตัวแบบไม่ต้องมีผู้ควบคุม
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่รวมมาให้จะตรวจหาสถานะ Claude Code ที่ `~/.claude` โดยค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าโฮมหรือรูทโปรเจกต์ของ Claude Code ที่ระบุ

<Tip>
สำหรับคำแนะนำแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายข้อมูลจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- Markdown หน่วยความจำอัตโนมัติของ Claude Code จาก `~/.claude/projects/*/memory` และ
  `autoMemoryDirectory` ที่ผู้ใช้กำหนดค่า โดยคัดลอกไว้ภายใต้
  `memory/imports/claude-code/` เพื่อการเรียกคืนแบบมีดัชนี
- `CLAUDE.md` และ `.claude/CLAUDE.md` ของโปรเจกต์ไปยังพื้นที่ทำงานของเอเจนต์ OpenClaw (`AGENTS.md`)
- `~/.claude/CLAUDE.md` ของผู้ใช้ต่อท้ายใน `USER.md` ของพื้นที่ทำงาน
- ข้อกำหนดเซิร์ฟเวอร์ MCP จาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code (รวมรายการต่อโปรเจกต์) และ `claude_desktop_config.json` ของ Claude Desktop
- ไดเรกทอรีสกิล Claude ที่มี `SKILL.md` (`~/.claude/skills` ของผู้ใช้และ `.claude/skills` ของโปรเจกต์)
- ไฟล์ Markdown คำสั่ง Claude (`~/.claude/commands` ของผู้ใช้และ `.claude/commands` ของโปรเจกต์) ซึ่งแปลงเป็นสกิล OpenClaw ที่เรียกใช้ด้วยตนเองเท่านั้น

### สถานะที่เก็บถาวรและต้องตรวจสอบด้วยตนเอง

ฮุก สิทธิ์ ค่าเริ่มต้นของสภาพแวดล้อม `CLAUDE.local.md` ของโปรเจกต์, `.claude/rules`, ไดเรกทอรี `agents/` ของผู้ใช้และโปรเจกต์ และประวัติโปรเจกต์ (`projects`, `cache`, `plans` ภายใต้ `~/.claude`) ของ Claude จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจสอบด้วยตนเอง OpenClaw จะไม่เรียกใช้ฮุก คัดลอกรายการอนุญาตแบบกว้าง หรือนำเข้าสถานะข้อมูลประจำตัว OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่รวมมาให้จะตรวจหาสถานะ Codex CLI ที่ `~/.codex` โดยค่าเริ่มต้น หรือที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมดังกล่าว ใช้ `--from <path>` เพื่อจัดทำบัญชีรายการโฮม Codex ที่ระบุ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยังชุดควบคุม Codex ของ OpenClaw และต้องการยกระดับแอสเซ็ตส่วนตัวที่มีประโยชน์ของ Codex CLI อย่างตั้งใจ การเปิด app-server ของ Codex ในเครื่องจะใช้ `CODEX_HOME` ต่อเอเจนต์ ดังนั้นจึงไม่อ่าน `~/.codex` ส่วนตัวของคุณโดยค่าเริ่มต้น กระบวนการยังคงรับช่วง `HOME` ปกติ ดังนั้น Codex จึงมองเห็นสกิล/รายการมาร์เก็ตเพลส Plugin ใน `$HOME/.agents/*` ที่ใช้ร่วมกัน และกระบวนการย่อยสามารถค้นหาการกำหนดค่าและโทเค็นในโฮมผู้ใช้ได้

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่างแผนทั้งหมด จากนั้นเปิดตัวเลือกแบบช่องทำเครื่องหมายก่อนขอการยืนยันขั้นสุดท้ายเพื่อนำไปใช้ ระบบจะถามรายการคัดลอกสกิลก่อน ใช้ `Toggle all on` หรือ `Toggle all off` เพื่อเลือกทั้งหมดพร้อมกัน กด Space เพื่อสลับการเลือกแถว หรือกด Enter เพื่อเปิดใช้งานแถวที่ไฮไลต์และดำเนินการต่อ สกิลที่วางแผนไว้จะเริ่มต้นโดยถูกเลือก สกิลที่มีข้อขัดแย้งจะเริ่มต้นโดยไม่ถูกเลือก และ `Skip for now` จะข้ามการคัดลอกสกิลสำหรับการเรียกใช้ครั้งนี้ แต่ยังคงดำเนินการเลือก Plugin ต่อ เมื่อสามารถย้าย Plugin Codex ที่คัดสรรและติดตั้งจากซอร์สได้ และไม่ได้ระบุ `--plugin` การย้ายข้อมูลจะถามให้เปิดใช้งาน Plugin Codex โดยตรงตามชื่อ Plugin จากนั้น รายการ Plugin จะเริ่มต้นโดยถูกเลือก เว้นแต่การกำหนดค่า Plugin Codex ของ OpenClaw เป้าหมายมี Plugin นั้นอยู่แล้ว Plugin เป้าหมายที่มีอยู่จะเริ่มต้นโดยไม่ถูกเลือกและแสดงคำใบ้ข้อขัดแย้ง เช่น `conflict: plugin exists` เลือก `Toggle all off` เพื่อไม่ย้าย Plugin Codex โดยตรงในการเรียกใช้ครั้งนั้น หรือ `Skip for now` เพื่อหยุดก่อนนำไปใช้

สำหรับการเรียกใช้แบบสคริปต์หรือที่ต้องการความแม่นยำ ให้เลือกสกิลหรือ Plugin อย่างน้อยหนึ่งรายการอย่างชัดเจน:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### สิ่งที่ Codex นำเข้า

- `MEMORY.md` และ `memory_summary.md` ของ Codex ที่รวมแล้วจาก
  `$CODEX_HOME/memories` โดยคัดลอกไว้ภายใต้ `memory/imports/codex/` เพื่อการเรียกคืน
  แบบมีดัชนี ระบบจะไม่นำเข้าหน่วยความจำการเปิดตัวแบบดิบ
- ไดเรกทอรีสกิล Codex CLI ภายใต้ `$CODEX_HOME/skills` โดยไม่รวมแคช `.system` ของ Codex
- AgentSkills ส่วนตัวภายใต้ `$HOME/.agents/skills` ซึ่งคัดลอกไปยังพื้นที่ทำงานของเอเจนต์ OpenClaw ปัจจุบันเพื่อให้เอเจนต์แต่ละตัวเป็นเจ้าของ
- Plugin Codex `openai-curated` ที่ติดตั้งจากซอร์สและค้นพบผ่าน `plugin/list` ของ app-server Codex การวางแผนจะอ่าน `plugin/read` สำหรับ Plugin ที่ติดตั้งและเปิดใช้งานแต่ละรายการ

การย้ายข้อมูล Plugin ที่มีแอปรองรับมีเกณฑ์เพิ่มเติม:

- Plugin ที่มีแอปรองรับกำหนดให้บัญชี app-server ของ Codex ต้นทางเป็นบัญชีการสมัครสมาชิก ChatGPT การตอบกลับที่ไม่ใช่บัญชี ChatGPT หรือไม่มีบัญชีจะถูกข้ามพร้อม `codex_subscription_required`
- โดยค่าเริ่มต้น การย้ายข้อมูลจะไม่เรียก `app/list` ของต้นทาง ดังนั้น Plugin ที่มีแอปรองรับและผ่านเกณฑ์บัญชีจะถูกวางแผนโดยไม่มีการตรวจสอบการเข้าถึงแอปจากต้นทาง และความล้มเหลวในการรับส่งข้อมูลระหว่างค้นหาบัญชีจะถูกข้ามพร้อม `codex_account_unavailable`
- ส่ง `--verify-plugin-apps` เพื่อบังคับให้สร้างสแนปช็อต `app/list` ของต้นทางใหม่ และกำหนดให้ทุกแอปที่เป็นเจ้าของต้องมีอยู่ เปิดใช้งาน และเข้าถึงได้ก่อนวางแผนเปิดใช้งานโดยตรง ในโหมดดังกล่าว ความล้มเหลวในการรับส่งข้อมูลระหว่างค้นหาบัญชีจะเปลี่ยนไปตรวจสอบบัญชีรายการแอปต้นทางแทน สแนปช็อตจะถูกเก็บไว้ในหน่วยความจำสำหรับกระบวนการปัจจุบันเท่านั้น และจะไม่ถูกเขียนลงในผลลัพธ์การย้ายข้อมูลหรือการกำหนดค่าเป้าหมาย

Plugin ที่ปิดใช้งาน รายละเอียด Plugin ที่อ่านไม่ได้ บัญชีต้นทางที่จำกัดตามการสมัครสมาชิก และ (เมื่อตั้งค่า `--verify-plugin-apps`) แอปที่ไม่มีอยู่ ปิดใช้งาน หรือเข้าถึงไม่ได้ จะกลายเป็นรายการที่ข้ามและต้องตรวจสอบด้วยตนเองพร้อมเหตุผลที่ระบุประเภท แทนที่จะเป็นรายการการกำหนดค่าเป้าหมาย การนำไปใช้จะเรียก `plugin/install` ของ app-server สำหรับ Plugin ที่มีสิทธิ์และถูกเลือกแต่ละรายการ แม้ app-server เป้าหมายจะรายงานว่า Plugin นั้นติดตั้งและเปิดใช้งานอยู่แล้ว Plugin Codex ที่ย้ายแล้วจะใช้ได้เฉพาะในเซสชันที่เลือกชุดควบคุม Codex โดยตรงเท่านั้น และจะไม่ถูกเปิดให้ใช้กับการเรียกใช้ผู้ให้บริการ OpenClaw การผูกการสนทนา ACP หรือชุดควบคุมอื่น

### สถานะ Codex ที่ต้องตรวจสอบด้วยตนเอง

Codex `config.toml`, `hooks/hooks.json` แบบเนทีฟ, มาร์เก็ตเพลสที่ไม่ได้รับการคัดสรร, บันเดิล Plugin ที่แคชไว้ซึ่งไม่ใช่ Plugin ที่ได้รับการคัดสรรและติดตั้งจากซอร์ส ตลอดจน Plugin ที่ติดตั้งจากซอร์สแต่ไม่ผ่านเกตการสมัครใช้งานของซอร์ส จะไม่ถูกเปิดใช้งานโดยอัตโนมัติ เมื่อตั้งค่า `--verify-plugin-apps` ระบบจะข้าม Plugin ที่ไม่ผ่านเกตคลังแอปของซอร์สด้วย รายการทั้งหมดนี้จะถูกคัดลอกหรือรายงานในรายงานการย้ายข้อมูลเพื่อให้ตรวจสอบด้วยตนเอง

สำหรับ Plugin ที่ได้รับการคัดสรรและติดตั้งจากซอร์สซึ่งย้ายข้อมูลแล้ว ให้เขียนค่าดังนี้:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- รายการ Plugin แบบระบุชัดเจนหนึ่งรายการที่มี `marketplaceName: "openai-curated"` และ `pluginName` สำหรับ Plugin ที่เลือกแต่ละรายการ

การย้ายข้อมูลจะไม่เขียน `plugins["*"]` และจะไม่จัดเก็บพาธแคชของมาร์เก็ตเพลสภายในเครื่อง

Plugin ที่ถูกข้ามจะไม่ถูกเขียนลงในการกำหนดค่าเป้าหมาย ความล้มเหลวด้านการสมัครใช้งานฝั่งซอร์สจะถูกรายงานในรายการที่ต้องดำเนินการด้วยตนเองพร้อมเหตุผลแบบระบุชนิด ได้แก่ `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` หรือ `plugin_read_unavailable` เมื่อใช้ `--verify-plugin-apps` ความล้มเหลวของคลังแอปฝั่งซอร์สอาจปรากฏเป็น `app_inaccessible`, `app_disabled`, `app_missing` หรือ `app_inventory_unavailable` ได้เช่นกัน การติดตั้งฝั่งเป้าหมายที่ต้องมีการยืนยันตัวตนจะถูกรายงานในรายการ Plugin ที่ได้รับผลกระทบพร้อม `status: "skipped"`, `reason: "auth_required"` และตัวระบุแอปที่ผ่านการล้างข้อมูลแล้ว โดยรายการกำหนดค่าแบบระบุชัดเจนของ Plugin เหล่านั้นจะถูกเขียนไว้ในสถานะปิดใช้งานจนกว่าจะให้สิทธิ์อีกครั้งและเปิดใช้งาน ความล้มเหลวในการติดตั้งอื่นๆ จะเป็นผลลัพธ์ `error` ที่จำกัดขอบเขตเฉพาะรายการ

หากคลัง Plugin ของ Codex app-server ใช้งานไม่ได้ระหว่างการวางแผน การย้ายข้อมูลจะใช้รายการคำแนะนำจากบันเดิลที่แคชไว้เป็นทางเลือกแทนที่จะทำให้การย้ายข้อมูลทั้งหมดล้มเหลว

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่รวมมาให้จะใช้ `$HERMES_HOME` และโปรไฟล์ที่ใช้งานอยู่ จากนั้นจึงใช้ค่าเริ่มต้นของแพลตฟอร์ม (`~/.hermes` หรือ `%LOCALAPPDATA%\hermes`) ใช้ `--from <path>` เพื่อแทนที่การค้นหา

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และเอนด์พอยต์แบบกำหนดเองที่เข้ากันได้กับ OpenAI จาก `model`, `providers` และ `custom_providers`
- ข้อกำหนดเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers` การแมป OpenClaw แบบตรงทั้งหมดครอบคลุมการกำหนดเส้นทาง Streamable HTTP เริ่มต้น, ขอบเขต OAuth, การตรวจสอบ TLS แบบบูลีน, พาธใบรับรองและคีย์ไคลเอนต์แยกกัน และนโยบายเครื่องมือแบบเนทีฟ/ทรัพยากร/พรอมต์ของ Hermes ฟิลด์รันไทม์หรือข้อมูลรับรองที่มีเฉพาะใน Hermes และไม่รองรับจะถูกรายงานเพื่อให้ตรวจสอบด้วยตนเอง
- `SOUL.md` และ `AGENTS.md` ไปยังพื้นที่ทำงานของเอเจนต์ OpenClaw
- ผนวก `memories/MEMORY.md` และ `memories/USER.md` เข้ากับไฟล์หน่วยความจำของพื้นที่ทำงาน
  ส่วนที่ใช้เฉพาะหน่วยความจำ (หน้าหน่วยความจำระหว่างการเริ่มต้นใช้งานและหน้า
  นำเข้าหน่วยความจำของ Control UI) จะคัดลอกไฟล์เหล่านี้ไปไว้ภายใต้ `memory/imports/hermes/`
  แทน เพื่อเรียกคืนจากดัชนีโดยไม่แก้ไขหน่วยความจำพื้นที่ทำงานที่มีอยู่
- ค่าเริ่มต้นการกำหนดค่าหน่วยความจำสำหรับหน่วยความจำแบบไฟล์ของ OpenClaw รวมถึงรายการสำหรับเก็บถาวรหรือตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` อยู่ที่ใดก็ตามภายใต้ `skills/` โดย Skills ที่ซ้อนกันจะถูกปรับให้อยู่ในระดับเดียวกันในไดเรกทอรี Skills ของพื้นที่ทำงาน
- ค่าการกำหนดค่าราย Skills จาก `skills.config`
- ข้อมูลรับรอง OAuth ของ OpenAI Codex ใน Hermes ปัจจุบันและข้อมูลรับรอง OAuth ของ OpenAI ใน OpenCode เมื่อยอมรับการย้ายข้อมูลรับรองแบบโต้ตอบ หรือเมื่อตั้งค่า `--include-secrets` อย่าให้ Hermes และ OpenClaw ใช้สิทธิ์รีเฟรชที่นำเข้าชุดเดียวกัน
- คีย์ API และโทเค็นที่รองรับจาก `.env` ของ Hermes และ `auth.json` ของ OpenCode เมื่อยอมรับการย้ายข้อมูลรับรองแบบโต้ตอบ หรือเมื่อตั้งค่า `--include-secrets`

### คีย์ `.env` ที่รองรับ

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`

### สถานะสำหรับเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกไปยังรายงานการย้ายข้อมูลเพื่อให้ตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดลงในการกำหนดค่าหรือข้อมูลรับรองที่ใช้งานจริงของ OpenClaw ซึ่งรวมถึง `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, สถานะการจับคู่/แพลตฟอร์ม, สถานะการกำหนดเส้นทาง/กระบวนการของ Gateway และฐานข้อมูล SQLite ของ Hermes ที่ตรวจพบ

### หลังจากนำไปใช้

```bash
openclaw doctor
```

## สัญญาของ Plugin

แหล่งข้อมูลการย้ายข้อมูลคือ Plugin โดย Plugin จะประกาศรหัสผู้ให้บริการของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะรันไทม์ Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการจะติดตั้งใช้งาน `detect`, `plan` และ `apply` ส่วนแกนหลักเป็นเจ้าของการประสานงาน CLI, นโยบายการสำรองข้อมูล, พรอมต์, เอาต์พุต JSON และการตรวจสอบข้อขัดแย้งล่วงหน้า แกนหลักจะส่งแผนที่ตรวจสอบแล้วไปยัง `apply(ctx, plan)` และผู้ให้บริการสามารถสร้างแผนใหม่ได้เฉพาะเมื่อไม่มีอาร์กิวเมนต์ดังกล่าวเพื่อความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึงใช้ `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์โดยคำนึงถึงข้อขัดแย้ง, การคัดลอกไปยังรายงานสำหรับเก็บถาวรเท่านั้น, แรปเปอร์รันไทม์การกำหนดค่าที่แคชไว้ และรายงานการย้ายข้อมูล

## การผสานรวมกับการเริ่มต้นใช้งาน

การเริ่มต้นใช้งานสามารถเสนอการย้ายข้อมูลได้เมื่อผู้ให้บริการตรวจพบแหล่งข้อมูลที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการการย้ายข้อมูลของ Plugin เดียวกัน และยังคงแสดงตัวอย่างก่อนนำไปใช้

<Note>
การนำเข้าระหว่างการเริ่มต้นใช้งานต้องใช้การติดตั้ง OpenClaw ใหม่ หากมีสถานะภายในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลรับรอง เซสชัน และพื้นที่ทำงานก่อน การนำเข้าแบบสำรองข้อมูลแล้วเขียนทับหรือแบบผสานสำหรับการติดตั้งที่มีอยู่จะถูกควบคุมด้วยฟีเจอร์เกต
</Note>

## ที่เกี่ยวข้อง

- [การย้ายจาก Hermes](/th/install/migrating-hermes): คำแนะนำสำหรับผู้ใช้
- [การย้ายจาก Claude](/th/install/migrating-claude): คำแนะนำสำหรับผู้ใช้
- [การย้ายข้อมูล](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): การตรวจสอบสภาพหลังจากนำการย้ายข้อมูลไปใช้
- [Plugin](/th/tools/plugin): การติดตั้งและลงทะเบียน Plugin
