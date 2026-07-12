---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นมาใช้ OpenClaw
    - คุณกำลังเพิ่มตัวให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-07-12T16:01:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่รวมมาให้รองรับ Claude, Codex CLI และ [Hermes](/th/install/migrating-hermes) ส่วน Plugin สามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคู่มือแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์รวมการย้ายข้อมูล](/th/install/migrating) แสดงเส้นทางทั้งหมด
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

การเรียกใช้ `openclaw migrate <provider>` โดยไม่มีแฟล็กอื่นจะวางแผน แสดงตัวอย่าง และแจ้งให้ยืนยันก่อนนำไปใช้เมื่ออยู่ใน TTY คำสั่ง `openclaw migrate plan <provider>` และ `openclaw migrate apply <provider>` แยกขั้นตอนแสดงตัวอย่างและนำไปใช้เป็นคำสั่งย่อยคนละคำสั่ง โดยใช้แฟล็กชุดเดียวกัน

<ParamField path="<provider>" type="string">
  ชื่อผู้ให้บริการย้ายข้อมูลที่ลงทะเบียนแล้ว เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งอยู่
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนแปลงสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง ค่าเริ่มต้นของ Hermes คือ `~/.hermes` ค่าเริ่มต้นของ Codex คือ `~/.codex` (หรือ `$CODEX_HOME`) และค่าเริ่มต้นของ Claude คือ `~/.claude`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลรับรองที่รองรับโดยไม่แจ้งให้ยืนยัน การนำไปใช้แบบโต้ตอบจะถามก่อนนำเข้าข้อมูลรับรองการยืนยันตัวตนที่ตรวจพบ โดยเลือกใช่เป็นค่าเริ่มต้น ส่วน `--yes` แบบไม่โต้ตอบต้องใช้ `--include-secrets` จึงจะนำเข้าข้อมูลดังกล่าว
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  ข้ามการนำเข้าข้อมูลรับรองการยืนยันตัวตน รวมถึงไม่แสดงข้อความแจ้งแบบโต้ตอบ
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้ขั้นตอนนำไปใช้แทนที่เป้าหมายที่มีอยู่ เมื่อแผนรายงานข้อขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามข้อความแจ้งยืนยัน จำเป็นต้องใช้ในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอก Skills หนึ่งรายการตามชื่อ Skills หรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้าย Skills หลายรายการ หากไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย ส่วนการย้ายแบบไม่โต้ตอบจะเก็บ Skills ที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--plugin <name>" type="string">
  เลือกรายการติดตั้ง Plugin ของ Codex หนึ่งรายการตามชื่อ Plugin หรือรหัสรายการ ใช้แฟล็กซ้ำเพื่อย้าย Plugin ของ Codex หลายรายการ หากไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือก Plugin ดั้งเดิมของ Codex แบบช่องทำเครื่องหมาย ส่วนการย้ายแบบไม่โต้ตอบจะเก็บ Plugin ที่วางแผนไว้ทั้งหมด ใช้ได้เฉพาะกับ Plugin ของ Codex จาก `openai-curated` ที่ติดตั้งจากต้นทางและค้นพบโดยบัญชีรายการ app-server ของ Codex
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  สำหรับ Codex เท่านั้น บังคับให้สำรวจ `app/list` ของ app-server ต้นทางของ Codex ใหม่ก่อนวางแผนเปิดใช้งาน Plugin ดั้งเดิม ปิดเป็นค่าเริ่มต้นเพื่อให้การวางแผนย้ายข้อมูลรวดเร็ว
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  พาธหรือไดเรกทอรีของไฟล์เก็บถาวรสำรองก่อนย้ายข้อมูล ส่งต่อไปยัง `openclaw backup create`
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อนนำไปใช้ ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ในเครื่องอยู่แล้ว
</ParamField>
<ParamField path="--force" type="boolean">
  ต้องใช้ร่วมกับ `--no-backup` เมื่อขั้นตอนนำไปใช้จะปฏิเสธการข้ามการสำรองข้อมูลในกรณีปกติ
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์การนำไปใช้เป็น JSON เมื่อใช้ `--json` โดยไม่มี `--yes` ขั้นตอนนำไปใช้จะพิมพ์แผนและไม่แก้ไขสถานะ
</ParamField>

## แบบจำลองความปลอดภัย

`openclaw migrate` ให้แสดงตัวอย่างก่อนเสมอ

<AccordionGroup>
  <Accordion title="แสดงตัวอย่างก่อนนำไปใช้">
    ผู้ให้บริการจะส่งคืนแผนแบบแจกแจงรายการก่อนมีการเปลี่ยนแปลงใด ๆ ซึ่งรวมถึงข้อขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON ผลลัพธ์การนำไปใช้ และรายงานการย้ายข้อมูลจะปกปิดคีย์ซ้อนที่ดูเหมือนเป็นข้อมูลลับ เช่น คีย์ API, โทเค็น, ส่วนหัวการอนุญาต, คุกกี้ และรหัสผ่าน

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและแจ้งให้ยืนยันก่อนเปลี่ยนแปลงสถานะ เว้นแต่จะตั้งค่า `--yes` ในโหมดไม่โต้ตอบ ขั้นตอนนำไปใช้ต้องมี `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    ขั้นตอนนำไปใช้จะสร้างและตรวจสอบข้อมูลสำรองของ OpenClaw ก่อนดำเนินการย้ายข้อมูล หากยังไม่มีสถานะ OpenClaw ในเครื่อง ระบบจะข้ามขั้นตอนสำรองข้อมูลและดำเนินการย้ายข้อมูลต่อ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่แล้ว ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ข้อขัดแย้ง">
    ขั้นตอนนำไปใช้จะปฏิเสธการดำเนินการต่อเมื่อแผนมีข้อขัดแย้ง ตรวจสอบแผน แล้วเรียกใช้ใหม่ด้วย `--overwrite` หากตั้งใจแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับไว้ในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ข้อมูลลับ">
    ขั้นตอนนำไปใช้แบบโต้ตอบจะถามว่าต้องการนำเข้าข้อมูลรับรองการยืนยันตัวตนที่ตรวจพบหรือไม่ โดยเลือกใช่เป็นค่าเริ่มต้น ใช้ `--no-auth-credentials` เพื่อข้ามข้อมูลดังกล่าว หรือใช้ `--include-secrets` สำหรับการนำเข้าข้อมูลรับรองแบบไม่ต้องมีผู้ดูแลร่วมกับ `--yes`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่รวมมาให้จะตรวจหาสถานะ Claude Code ที่ `~/.claude` เป็นค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าโฮมของ Claude Code หรือรากโปรเจกต์ที่ระบุ

<Tip>
สำหรับคู่มือแบบทีละขั้นตอนสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- `CLAUDE.md` และ `.claude/CLAUDE.md` ของโปรเจกต์เข้าสู่พื้นที่ทำงานของเอเจนต์ OpenClaw (`AGENTS.md`)
- เพิ่ม `~/.claude/CLAUDE.md` ของผู้ใช้ต่อท้าย `USER.md` ในพื้นที่ทำงาน
- ข้อกำหนดเซิร์ฟเวอร์ MCP จาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code (รวมถึงรายการแยกตามโปรเจกต์) และ `claude_desktop_config.json` ของ Claude Desktop
- ไดเรกทอรี Skills ของ Claude ที่มี `SKILL.md` (ทั้ง `~/.claude/skills` ของผู้ใช้และ `.claude/skills` ของโปรเจกต์)
- ไฟล์ Markdown คำสั่งของ Claude (ทั้ง `~/.claude/commands` ของผู้ใช้และ `.claude/commands` ของโปรเจกต์) ซึ่งจะแปลงเป็น Skills ของ OpenClaw ที่เรียกใช้ด้วยตนเองเท่านั้น

### สถานะที่เก็บถาวรและต้องตรวจสอบด้วยตนเอง

ฮุกของ Claude, สิทธิ์, ค่าเริ่มต้นของสภาพแวดล้อม, `CLAUDE.local.md` ของโปรเจกต์, `.claude/rules`, ไดเรกทอรี `agents/` ของผู้ใช้และโปรเจกต์ และประวัติโปรเจกต์ (`projects`, `cache`, `plans` ภายใต้ `~/.claude`) จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจสอบด้วยตนเอง OpenClaw จะไม่เรียกใช้ฮุก คัดลอกรายการอนุญาตแบบกว้าง หรือนำเข้าสถานะข้อมูลรับรอง OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่รวมมาให้จะตรวจหาสถานะ Codex CLI ที่ `~/.codex` เป็นค่าเริ่มต้น หรือที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมดังกล่าว ใช้ `--from <path>` เพื่อจัดทำบัญชีรายการโฮมของ Codex ที่ระบุ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยังชุดควบคุม Codex ของ OpenClaw และต้องการคัดเลือกทรัพยากรส่วนตัวที่มีประโยชน์จาก Codex CLI อย่างตั้งใจ การเปิด app-server ของ Codex ในเครื่องจะใช้ `CODEX_HOME` แยกตามเอเจนต์ จึงไม่อ่าน `~/.codex` ส่วนตัวของคุณเป็นค่าเริ่มต้น แต่ยังคงสืบทอด `HOME` ของกระบวนการตามปกติ ดังนั้น Codex จึงมองเห็นรายการ Skills/ตลาด Plugin ที่ใช้ร่วมกันใน `$HOME/.agents/*` และกระบวนการย่อยสามารถค้นหาการกำหนดค่าและโทเค็นในโฮมของผู้ใช้ได้

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่างแผนทั้งหมด แล้วเปิดตัวเลือกแบบช่องทำเครื่องหมายก่อนการยืนยันนำไปใช้ครั้งสุดท้าย ระบบจะแจ้งให้เลือกรายการคัดลอก Skills ก่อน ใช้ `Toggle all on` หรือ `Toggle all off` เพื่อเลือกหลายรายการพร้อมกัน กด Space เพื่อสลับสถานะแถว หรือกด Enter เพื่อเปิดใช้งานแถวที่ไฮไลต์และดำเนินการต่อ Skills ที่วางแผนไว้จะถูกเลือกไว้ตั้งแต่ต้น ส่วน Skills ที่มีข้อขัดแย้งจะไม่ถูกเลือก และ `Skip for now` จะข้ามการคัดลอก Skills สำหรับการเรียกใช้ครั้งนี้แต่ยังดำเนินการเลือก Plugin ต่อไป เมื่อมี Plugin ของ Codex ที่คัดสรรไว้และติดตั้งจากต้นทางซึ่งสามารถย้ายได้ และไม่ได้ระบุ `--plugin` ระบบจะถามให้เปิดใช้งาน Plugin ดั้งเดิมของ Codex ตามชื่อ Plugin รายการ Plugin จะถูกเลือกไว้ตั้งแต่ต้น เว้นแต่การกำหนดค่า Plugin Codex ของ OpenClaw เป้าหมายมี Plugin นั้นอยู่แล้ว Plugin ที่มีอยู่ในเป้าหมายจะไม่ถูกเลือกและแสดงคำแนะนำข้อขัดแย้ง เช่น `conflict: plugin exists` เลือก `Toggle all off` เพื่อไม่ย้าย Plugin ดั้งเดิมของ Codex ใด ๆ ในการเรียกใช้ครั้งนั้น หรือเลือก `Skip for now` เพื่อหยุดก่อนนำไปใช้

สำหรับการเรียกใช้ผ่านสคริปต์หรือการเรียกใช้ที่ต้องการความแม่นยำ ให้เลือก Skills หรือ Plugin อย่างน้อยหนึ่งรายการโดยชัดเจน:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### สิ่งที่ Codex นำเข้า

- ไดเรกทอรี Skills ของ Codex CLI ภายใต้ `$CODEX_HOME/skills` โดยไม่รวมแคช `.system` ของ Codex
- AgentSkills ส่วนตัวภายใต้ `$HOME/.agents/skills` ซึ่งคัดลอกเข้าสู่พื้นที่ทำงานของเอเจนต์ OpenClaw ปัจจุบันเพื่อให้แต่ละเอเจนต์เป็นเจ้าของ
- Plugin ของ Codex จาก `openai-curated` ที่ติดตั้งจากต้นทางและค้นพบผ่าน `plugin/list` ของ app-server Codex ขั้นตอนวางแผนจะอ่าน `plugin/read` สำหรับ Plugin ที่ติดตั้งและเปิดใช้งานแต่ละรายการ

การย้าย Plugin ที่มีแอปสนับสนุนมีเงื่อนไขเพิ่มเติม:

- Plugin ที่มีแอปสนับสนุนกำหนดให้บัญชี app-server Codex ต้นทางเป็นบัญชีที่สมัครสมาชิก ChatGPT การตอบกลับที่ไม่ใช่บัญชี ChatGPT หรือไม่มีบัญชีจะถูกข้ามด้วย `codex_subscription_required`
- ตามค่าเริ่มต้น การย้ายข้อมูลจะไม่เรียก `app/list` จากต้นทาง ดังนั้น Plugin ที่มีแอปสนับสนุนซึ่งผ่านเงื่อนไขบัญชีจะถูกวางแผนโดยไม่ตรวจสอบการเข้าถึงแอปจากต้นทาง และความล้มเหลวของการรับส่งข้อมูลขณะค้นหาบัญชีจะถูกข้ามด้วย `codex_account_unavailable`
- ส่ง `--verify-plugin-apps` เพื่อบังคับสร้างสแนปช็อต `app/list` จากต้นทางใหม่ และกำหนดให้แอปที่เป็นเจ้าของทุกรายการต้องมีอยู่ เปิดใช้งาน และเข้าถึงได้ก่อนวางแผนเปิดใช้งานแบบดั้งเดิม ในโหมดนี้ ความล้มเหลวของการรับส่งข้อมูลขณะค้นหาบัญชีจะเปลี่ยนไปตรวจสอบบัญชีรายการแอปจากต้นทางแทน สแนปช็อตจะถูกเก็บไว้ในหน่วยความจำสำหรับกระบวนการปัจจุบันเท่านั้น และจะไม่ถูกเขียนลงในผลลัพธ์การย้ายข้อมูลหรือการกำหนดค่าเป้าหมาย

Plugin ที่ปิดใช้งาน รายละเอียด Plugin ที่อ่านไม่ได้ บัญชีต้นทางที่ถูกจำกัดด้วยข้อกำหนดการสมัครสมาชิก และเมื่อกำหนด `--verify-plugin-apps` แอปที่ไม่มีอยู่ ปิดใช้งาน หรือเข้าถึงไม่ได้ จะกลายเป็นรายการที่ข้ามและต้องตรวจสอบด้วยตนเองพร้อมเหตุผลแบบระบุชนิด แทนที่จะเป็นรายการกำหนดค่าเป้าหมาย ขั้นตอนนำไปใช้จะเรียก `plugin/install` ของ app-server สำหรับ Plugin ที่มีสิทธิ์ซึ่งเลือกไว้แต่ละรายการ แม้ว่า app-server เป้าหมายจะรายงานว่า Plugin นั้นติดตั้งและเปิดใช้งานอยู่แล้วก็ตาม Plugin ของ Codex ที่ย้ายมาใช้ได้เฉพาะในเซสชันที่เลือกชุดควบคุม Codex ดั้งเดิมเท่านั้น และจะไม่เปิดให้ใช้กับการเรียกใช้ผู้ให้บริการ OpenClaw, การผูกการสนทนา ACP หรือชุดควบคุมอื่น

### สถานะ Codex ที่ต้องตรวจสอบด้วยตนเอง

`config.toml` ของ Codex, `hooks/hooks.json` ดั้งเดิม, ตลาดที่ไม่ได้รับการคัดสรร, ชุด Plugin ในแคชที่ไม่ใช่ Plugin ที่คัดสรรและติดตั้งจากต้นทาง และ Plugin ที่ติดตั้งจากต้นทางแต่ไม่ผ่านเงื่อนไขการสมัครสมาชิกของต้นทาง จะไม่ถูกเปิดใช้งานโดยอัตโนมัติ เมื่อกำหนด `--verify-plugin-apps` Plugin ที่ไม่ผ่านเงื่อนไขบัญชีรายการแอปจากต้นทางจะถูกข้ามด้วย รายการทั้งหมดนี้จะถูกคัดลอกหรือรายงานในรายงานการย้ายข้อมูลเพื่อตรวจสอบด้วยตนเอง

สำหรับ Plugin ที่คัดสรรและติดตั้งจากต้นทางซึ่งถูกย้าย ขั้นตอนนำไปใช้จะเขียน:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- รายการ Plugin แบบระบุชัดเจนหนึ่งรายการ ซึ่งมี `marketplaceName: "openai-curated"` และ `pluginName` สำหรับ Plugin ที่เลือกแต่ละรายการ

การย้ายข้อมูลจะไม่เขียน `plugins["*"]` และไม่จัดเก็บพาธแคชของตลาดในเครื่อง

Plugin ที่ข้ามจะไม่ถูกเขียนลงในการกำหนดค่าปลายทาง ความล้มเหลวของการสมัครใช้งานฝั่งต้นทางจะถูกรายงานในรายการที่ต้องดำเนินการด้วยตนเองพร้อมเหตุผลแบบระบุชนิด ได้แก่ `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` หรือ `plugin_read_unavailable` เมื่อใช้ `--verify-plugin-apps` ความล้มเหลวของคลังรายการแอปฝั่งต้นทางอาจปรากฏเป็น `app_inaccessible`, `app_disabled`, `app_missing` หรือ `app_inventory_unavailable` ได้ด้วย การติดตั้งฝั่งปลายทางที่ต้องมีการยืนยันตัวตนจะถูกรายงานในรายการ Plugin ที่ได้รับผลกระทบด้วย `status: "skipped"`, `reason: "auth_required"` และตัวระบุแอปที่ผ่านการล้างข้อมูลละเอียดอ่อนแล้ว โดยรายการกำหนดค่าที่ระบุไว้อย่างชัดเจนจะถูกเขียนในสถานะปิดใช้งานจนกว่าคุณจะอนุญาตอีกครั้งและเปิดใช้งานรายการเหล่านั้น ความล้มเหลวในการติดตั้งอื่น ๆ จะเป็นผลลัพธ์ `error` ที่จำกัดขอบเขตอยู่ในแต่ละรายการ

หากคลังรายการ Plugin ของเซิร์ฟเวอร์แอป Codex ไม่พร้อมใช้งานระหว่างการวางแผน การย้ายข้อมูลจะเปลี่ยนไปใช้รายการคำแนะนำจากบันเดิลที่แคชไว้แทนที่จะทำให้การย้ายข้อมูลทั้งหมดล้มเหลว

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่รวมมาในระบบจะตรวจหาสถานะที่ `~/.hermes` โดยค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ในตำแหน่งอื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และปลายทางแบบกำหนดเองที่เข้ากันได้กับ OpenAI จาก `providers` และ `custom_providers`
- ข้อกำหนดเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` ไปยังพื้นที่ทำงานของเอเจนต์ OpenClaw
- เพิ่ม `memories/MEMORY.md` และ `memories/USER.md` ต่อท้ายไฟล์หน่วยความจำในพื้นที่ทำงาน
- ค่าเริ่มต้นการกำหนดค่าหน่วยความจำสำหรับหน่วยความจำแบบไฟล์ของ OpenClaw รวมถึงรายการสำหรับเก็บถาวรหรือตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` อยู่ภายใต้ `skills/<name>/`
- ค่าการกำหนดค่าเฉพาะ Skills จาก `skills.config`
- ข้อมูลรับรอง OpenAI OAuth ของ OpenCode จาก `auth.json` ของ OpenCode เมื่อยอมรับการย้ายข้อมูลรับรองแบบโต้ตอบ หรือเมื่อตั้งค่า `--include-secrets` รายการ OAuth ใน `auth.json` ของ Hermes เป็นสถานะรุ่นเก่าที่จะถูกรายงานเพื่อให้ยืนยันตัวตน OpenAI ใหม่ด้วยตนเองหรือซ่อมแซมด้วย doctor
- คีย์ API และโทเค็นที่รองรับจาก `.env` ของ Hermes และ `auth.json` ของ OpenCode เมื่อยอมรับการย้ายข้อมูลรับรองแบบโต้ตอบ หรือเมื่อตั้งค่า `--include-secrets`

### คีย์ `.env` ที่รองรับ

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`

### สถานะสำหรับเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกไปยังรายงานการย้ายข้อมูลเพื่อตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดเข้าสู่การกำหนดค่าหรือข้อมูลรับรองที่ใช้งานจริงของ OpenClaw วิธีนี้ช่วยเก็บรักษาสถานะที่ไม่โปร่งใสหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถเรียกใช้หรือเชื่อถือสถานะดังกล่าวได้โดยอัตโนมัติ ได้แก่ `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`

### หลังจากนำไปใช้

```bash
openclaw doctor
```

## สัญญาของ Plugin

แหล่งที่มาของการย้ายข้อมูลคือ Plugin โดย Plugin จะประกาศรหัสผู้ให้บริการของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะรันไทม์ Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการจะใช้งาน `detect`, `plan` และ `apply` ส่วนแกนหลักจะรับผิดชอบการประสานงาน CLI, นโยบายการสำรองข้อมูล, ข้อความแจ้ง, เอาต์พุต JSON และการตรวจสอบข้อขัดแย้งล่วงหน้า แกนหลักจะส่งแผนที่ผ่านการตรวจสอบแล้วไปยัง `apply(ctx, plan)` และผู้ให้บริการสามารถสร้างแผนใหม่ได้เฉพาะเมื่อไม่มีอาร์กิวเมนต์ดังกล่าวเพื่อรักษาความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์โดยคำนึงถึงข้อขัดแย้ง การคัดลอกรายงานสำหรับเก็บถาวรเท่านั้น ตัวห่อหุ้มรันไทม์การกำหนดค่าที่แคชไว้ และรายงานการย้ายข้อมูล

## การผสานรวมกับการเริ่มต้นใช้งาน

การเริ่มต้นใช้งานสามารถเสนอการย้ายข้อมูลได้เมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการย้ายข้อมูลของ Plugin เดียวกัน และยังคงแสดงตัวอย่างก่อนนำไปใช้

<Note>
การนำเข้าระหว่างการเริ่มต้นใช้งานต้องใช้การตั้งค่า OpenClaw ใหม่ทั้งหมด หากคุณมีสถานะภายในเครื่องอยู่แล้ว ให้รีเซ็ตการกำหนดค่า ข้อมูลรับรอง เซสชัน และพื้นที่ทำงานก่อน การนำเข้าแบบสำรองข้อมูลแล้วเขียนทับหรือแบบผสานสำหรับการตั้งค่าที่มีอยู่จะถูกควบคุมด้วยแฟล็กฟีเจอร์
</Note>

## เนื้อหาที่เกี่ยวข้อง

- [การย้ายข้อมูลจาก Hermes](/th/install/migrating-hermes): คำแนะนำทีละขั้นตอนสำหรับผู้ใช้
- [การย้ายข้อมูลจาก Claude](/th/install/migrating-claude): คำแนะนำทีละขั้นตอนสำหรับผู้ใช้
- [การย้ายข้อมูล](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานะหลังจากนำการย้ายข้อมูลไปใช้
- [Plugin](/th/tools/plugin): การติดตั้งและลงทะเบียน Plugin
