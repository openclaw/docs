---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นมาใช้ OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่เป็นของ Plugin
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-05-12T23:30:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่รวมมาให้ครอบคลุมสถานะ Codex CLI, [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin ของบุคคลที่สามสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคู่มือแบบเป็นขั้นตอนสำหรับผู้ใช้ ดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์กลางการย้ายข้อมูล](/th/install/migrating) แสดงเส้นทางทั้งหมด
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

<ParamField path="<provider>" type="string">
  ชื่อของผู้ให้บริการการย้ายข้อมูลที่ลงทะเบียนไว้ เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งแล้ว
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนและออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลรับรองที่รองรับ ปิดตามค่าเริ่มต้น
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้การใช้แผนแทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานความขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมต์ยืนยัน จำเป็นในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอก Skills หนึ่งรายการตามชื่อ Skills หรือรหัสรายการ ทำซ้ำแฟล็กนี้เพื่อย้าย Skills หลายรายการ เมื่อไม่ได้ระบุ การย้ายข้อมูล Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย และการย้ายข้อมูลแบบไม่โต้ตอบจะเก็บ Skills ที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--plugin <name>" type="string">
  เลือกรายการติดตั้ง Plugin ของ Codex หนึ่งรายการตามชื่อ Plugin หรือรหัสรายการ ทำซ้ำแฟล็กนี้เพื่อย้าย Plugin ของ Codex หลายรายการ เมื่อไม่ได้ระบุ การย้ายข้อมูล Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย Plugin ของ Codex แบบเนทีฟ และการย้ายข้อมูลแบบไม่โต้ตอบจะเก็บ Plugin ที่วางแผนไว้ทั้งหมด สิ่งนี้ใช้กับ Plugin ของ Codex แบบ `openai-curated` ที่ติดตั้งจากต้นทางซึ่งค้นพบโดยคลังข้อมูลแอปเซิร์ฟเวอร์ของ Codex เท่านั้น
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  สำหรับ Codex เท่านั้น บังคับให้สำรวจ `app/list` ของแอปเซิร์ฟเวอร์ Codex ต้นทางใหม่ก่อนวางแผนการเปิดใช้งาน Plugin แบบเนทีฟ ปิดตามค่าเริ่มต้นเพื่อให้การวางแผนการย้ายข้อมูลรวดเร็ว
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อนใช้แผน ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ในเครื่องอยู่
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นร่วมกับ `--no-backup` เมื่อการใช้แผนจะปฏิเสธการข้ามการสำรองข้อมูลหากไม่ได้ระบุ
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์การใช้แผนเป็น JSON เมื่อใช้ `--json` โดยไม่มี `--yes` การใช้แผนจะพิมพ์แผนและไม่เปลี่ยนสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` เน้นการแสดงตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="แสดงตัวอย่างก่อนใช้แผน">
    ผู้ให้บริการจะส่งคืนแผนแบบแจกแจงรายการก่อนที่สิ่งใดจะเปลี่ยน รวมถึงความขัดแย้ง รายการที่ข้าม และรายการที่ละเอียดอ่อน แผน JSON, เอาต์พุตการใช้แผน และรายงานการย้ายข้อมูลจะปกปิดคีย์ซ้อนที่ดูเหมือนเป็นความลับ เช่น API keys, tokens, authorization headers, cookies และ passwords

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและแจ้งยืนยันก่อนเปลี่ยนสถานะ เว้นแต่จะตั้งค่า `--yes` ในโหมดไม่โต้ตอบ การใช้แผนต้องมี `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    การใช้แผนจะสร้างและตรวจสอบการสำรองข้อมูล OpenClaw ก่อนใช้การย้ายข้อมูล หากยังไม่มีสถานะ OpenClaw ในเครื่อง ขั้นตอนการสำรองข้อมูลจะถูกข้ามและการย้ายข้อมูลสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ความขัดแย้ง">
    การใช้แผนจะปฏิเสธการดำเนินต่อเมื่อแผนมีความขัดแย้ง ตรวจทานแผน แล้วเรียกใช้ใหม่พร้อม `--overwrite` หากตั้งใจแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังเขียนการสำรองข้อมูลระดับรายการสำหรับไฟล์ที่ถูกเขียนทับในไดเรกทอรีรายงานการย้ายข้อมูล
  </Accordion>
  <Accordion title="ความลับ">
    ความลับจะไม่ถูกนำเข้าโดยค่าเริ่มต้น ใช้ `--include-secrets` เพื่อนำเข้าข้อมูลรับรองที่รองรับ
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่รวมมาให้ตรวจพบสถานะ Claude Code ที่ `~/.claude` ตามค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้าโฮมหรือรูทโปรเจกต์ Claude Code เฉพาะ

<Tip>
สำหรับคู่มือแบบเป็นขั้นตอนสำหรับผู้ใช้ ดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- `CLAUDE.md` ของโปรเจกต์และ `.claude/CLAUDE.md` เข้าสู่พื้นที่ทำงานของเอเจนต์ OpenClaw
- `~/.claude/CLAUDE.md` ของผู้ใช้ต่อท้ายเข้าไปใน `USER.md` ของพื้นที่ทำงาน
- คำนิยามเซิร์ฟเวอร์ MCP จาก `.mcp.json` ของโปรเจกต์, `~/.claude.json` ของ Claude Code และ `claude_desktop_config.json` ของ Claude Desktop
- ไดเรกทอรี Skills ของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็น Skills ของ OpenClaw โดยเรียกใช้ด้วยตนเองเท่านั้น

### สถานะที่เก็บถาวรและต้องตรวจทานด้วยตนเอง

Hooks, สิทธิ์, ค่าเริ่มต้นของสภาพแวดล้อม, หน่วยความจำในเครื่อง, กฎที่จำกัดตามพาธ, ซับเอเจนต์, แคช, แผน และประวัติโปรเจกต์ของ Claude จะถูกเก็บไว้ในรายงานการย้ายข้อมูลหรือรายงานเป็นรายการที่ต้องตรวจทานด้วยตนเอง OpenClaw จะไม่เรียกใช้ hooks, คัดลอกรายการอนุญาตแบบกว้าง หรือ นำเข้าสถานะข้อมูลรับรอง OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่รวมมาให้ตรวจพบสถานะ Codex CLI ที่ `~/.codex` ตามค่าเริ่มต้น หรือ
ที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมนั้น ใช้ `--from <path>` เพื่อ
จัดทำบัญชีรายการโฮม Codex เฉพาะ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยังฮาร์เนส Codex ของ OpenClaw และคุณต้องการ
ยกระดับแอสเซ็ต Codex CLI ส่วนตัวที่มีประโยชน์อย่างตั้งใจ การเปิดแอปเซิร์ฟเวอร์ Codex ในเครื่อง
ใช้ไดเรกทอรี `CODEX_HOME` และ `HOME` แบบต่อเอเจนต์ ดังนั้นโดยค่าเริ่มต้นจึงไม่อ่าน
สถานะ Codex CLI ส่วนตัวของคุณ

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่าง
แผนทั้งหมด จากนั้นเปิดตัวเลือกแบบช่องทำเครื่องหมายก่อนการยืนยันใช้แผนครั้งสุดท้าย รายการ
คัดลอก Skills จะถูกถามก่อน ใช้ `Toggle all on` หรือ `Toggle all off` สำหรับการเลือก
แบบกลุ่ม กด Space เพื่อสลับแถว หรือกด Enter เพื่อเปิดใช้งานแถวที่ไฮไลต์
และดำเนินต่อ Skills ที่วางแผนไว้จะเริ่มต้นแบบเลือกไว้ Skills ที่ขัดแย้งจะเริ่มต้นแบบไม่ได้เลือก และ
`Skip for now` จะข้ามการคัดลอก Skills สำหรับการเรียกใช้นี้แต่ยังดำเนินต่อไปยังการเลือก
Plugin เมื่อ Plugin ของ Codex ที่คัดสรรมาซึ่งติดตั้งจากต้นทางสามารถย้ายได้และ
ไม่ได้ระบุ `--plugin` การย้ายข้อมูลจะแจ้งให้เปิดใช้งาน Plugin ของ Codex แบบเนทีฟ
ตามชื่อ Plugin จากนั้น รายการ Plugin
จะเริ่มต้นแบบเลือกไว้ เว้นแต่การกำหนดค่า Plugin Codex ของ OpenClaw เป้าหมายมี
Plugin นั้นอยู่แล้ว Plugin เป้าหมายที่มีอยู่จะเริ่มต้นแบบไม่ได้เลือกและแสดงคำใบ้ความขัดแย้ง เช่น
`conflict: plugin exists`; เลือก `Toggle all off` เพื่อไม่ย้าย Plugin ของ Codex แบบเนทีฟ
ในการเรียกใช้นั้น หรือ `Skip for now` เพื่อหยุดก่อนใช้แผน สำหรับการเรียกใช้แบบสคริปต์หรือ
แบบเจาะจง ให้ส่ง `--skill <name>` หนึ่งครั้งต่อ Skills เช่น:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ใช้ `--plugin <name>` เพื่อจำกัดการย้าย Plugin ของ Codex แบบเนทีฟในโหมดไม่โต้ตอบ
ให้เหลือ Plugin ที่คัดสรรและติดตั้งจากต้นทางหนึ่งรายการหรือมากกว่า:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### สิ่งที่ Codex นำเข้า

- ไดเรกทอรี Skills ของ Codex CLI ภายใต้ `$CODEX_HOME/skills` โดยไม่รวมแคช
  `.system` ของ Codex
- AgentSkills ส่วนตัวภายใต้ `$HOME/.agents/skills` ซึ่งคัดลอกเข้าสู่พื้นที่ทำงาน
  ของเอเจนต์ OpenClaw ปัจจุบันเมื่อคุณต้องการความเป็นเจ้าของแบบต่อเอเจนต์
- Plugin ของ Codex แบบ `openai-curated` ที่ติดตั้งจากต้นทางซึ่งค้นพบผ่าน
  `plugin/list` ของแอปเซิร์ฟเวอร์ Codex การวางแผนจะอ่าน `plugin/read` สำหรับ Plugin ที่ติดตั้ง
  และเปิดใช้งานแต่ละรายการ Plugin ที่มีแอปรองรับต้องให้การตอบกลับบัญชีจากแอปเซิร์ฟเวอร์ Codex
  ต้นทางเป็นบัญชีการสมัครสมาชิก ChatGPT; การตอบกลับบัญชีที่ไม่ใช่ ChatGPT หรือขาดหายไป
  จะถูกข้ามพร้อม `codex_subscription_required` โดยค่าเริ่มต้น
  การย้ายข้อมูลจะไม่เรียก `app/list` ต้นทาง ดังนั้น Plugin ที่มีแอปรองรับซึ่งผ่าน
  เกตบัญชีจะถูกวางแผนโดยไม่มีการตรวจสอบการเข้าถึงแอปต้นทาง และ
  ความล้มเหลวด้านทรานสปอร์ตในการค้นหาบัญชีจะถูกข้ามพร้อม `codex_account_unavailable` ส่ง
  `--verify-plugin-apps` เมื่อคุณต้องการให้การย้ายข้อมูลบังคับใช้สแนปช็อต
  `app/list` ต้นทางใหม่และกำหนดให้ทุกแอปที่เป็นเจ้าของต้องมีอยู่ เปิดใช้งาน และ
  เข้าถึงได้ก่อนวางแผนการเปิดใช้งานแบบเนทีฟ ในโหมดนั้น ความล้มเหลวด้านทรานสปอร์ต
  ในการค้นหาบัญชีจะส่งต่อไปยังการตรวจสอบบัญชีรายการแอปต้นทาง สแนปช็อต
  บัญชีรายการแอปต้นทางจะถูกเก็บไว้ในหน่วยความจำสำหรับกระบวนการปัจจุบัน;
  จะไม่ถูกเขียนไปยังเอาต์พุตการย้ายข้อมูลหรือการกำหนดค่าเป้าหมาย Plugin ที่ปิดใช้งาน,
  รายละเอียด Plugin ที่อ่านไม่ได้, บัญชีต้นทางที่ถูกจำกัดด้วยการสมัครสมาชิก และเมื่อ
  มีการร้องขอการตรวจสอบ แอปที่หายไป แอปที่ปิดใช้งาน แอปที่เข้าถึงไม่ได้ หรือ
  ความล้มเหลวของบัญชีรายการแอปต้นทางจะกลายเป็นรายการที่ข้ามแบบต้องตรวจทานด้วยตนเองพร้อมเหตุผลที่มีชนิด
  แทนที่จะเป็นรายการการกำหนดค่าเป้าหมาย
  การใช้แผนจะเรียก `plugin/install` ของแอปเซิร์ฟเวอร์สำหรับ Plugin ที่มีสิทธิ์ซึ่งเลือกแต่ละรายการ
  แม้ว่าแอปเซิร์ฟเวอร์เป้าหมายจะรายงานแล้วว่า Plugin นั้นติดตั้งและ
  เปิดใช้งานแล้ว Plugin ของ Codex ที่ย้ายแล้วใช้ได้เฉพาะในเซสชันที่เลือก
  ฮาร์เนส Codex แบบเนทีฟ; จะไม่ถูกเปิดเผยต่อ Pi, การเรียกใช้ผู้ให้บริการ OpenAI ปกติ,
  การผูกการสนทนา ACP หรือฮาร์เนสอื่น

### สถานะ Codex ที่ต้องตรวจทานด้วยตนเอง

`config.toml` ของ Codex, `hooks/hooks.json` แบบเนทีฟ, marketplace ที่ไม่ได้คัดสรร, ชุด
Plugin ที่แคชไว้ซึ่งไม่ใช่ Plugin ที่คัดสรรและติดตั้งจากต้นทาง และ Plugin ที่ติดตั้งจากต้นทาง
ซึ่งไม่ผ่านเกตการสมัครสมาชิกต้นทางจะไม่ถูกเปิดใช้งานโดยอัตโนมัติ
เมื่อมีการตั้งค่า `--verify-plugin-apps` Plugin ที่ไม่ผ่านเกตบัญชีรายการแอปต้นทาง
จะถูกข้ามด้วยเช่นกัน สิ่งเหล่านี้จะถูกคัดลอกหรือรายงานในรายงานการย้ายข้อมูลเพื่อ
การตรวจทานด้วยตนเอง

สำหรับ Plugin ที่คัดสรรและติดตั้งจากต้นทางซึ่งย้ายแล้ว การใช้แผนจะเขียน:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- รายการ Plugin แบบชัดเจนหนึ่งรายการพร้อม `marketplaceName: "openai-curated"` และ
  `pluginName` สำหรับ Plugin ที่เลือกแต่ละรายการ

การย้ายข้อมูลจะไม่เขียน `plugins["*"]` และไม่เก็บพาธแคช marketplace ในเครื่อง
ความล้มเหลวด้านการสมัครสมาชิกฝั่งต้นทางจะถูกรายงานในรายการที่ต้องตรวจทานด้วยตนเองพร้อมเหตุผล
ที่มีชนิด เช่น `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` หรือ `plugin_read_unavailable` เมื่อใช้ `--verify-plugin-apps`
ความล้มเหลวของบัญชีรายการแอปต้นทางอาจปรากฏเป็น `app_inaccessible`,
`app_disabled`, `app_missing` หรือ `app_inventory_unavailable` ได้เช่นกัน Plugin ที่ข้าม
จะไม่ถูกเขียนไปยังการกำหนดค่าเป้าหมาย
การติดตั้งฝั่งเป้าหมายที่ต้องมีการรับรองความถูกต้องจะถูกรายงานในรายการ Plugin ที่ได้รับผลกระทบพร้อม
`status: "skipped"`, `reason: "auth_required"` และตัวระบุแอปที่ผ่านการทำให้ปลอดภัย
รายการการกำหนดค่าแบบชัดเจนของ Plugin เหล่านั้นจะถูกเขียนแบบปิดใช้งานจนกว่าคุณจะอนุญาตใหม่และ
เปิดใช้งาน การติดตั้งล้มเหลวอื่น ๆ เป็นผลลัพธ์ `error` ที่จำกัดตามรายการ

หากบัญชีรายการ Plugin ของแอปเซิร์ฟเวอร์ Codex ไม่พร้อมใช้งานระหว่างการวางแผน การย้ายข้อมูล
จะถอยกลับไปใช้รายการคำแนะนำชุดที่แคชไว้แทนที่จะทำให้การย้ายข้อมูลทั้งหมดล้มเหลว

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่รวมมาให้ตรวจพบสถานะที่ `~/.hermes` ตามค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`.
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และปลายทางแบบกำหนดเองที่เข้ากันได้กับ OpenAI จาก `providers` และ `custom_providers`.
- คำจำกัดความของเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`.
- `SOUL.md` และ `AGENTS.md` ลงในพื้นที่ทำงานของ agent OpenClaw.
- `memories/MEMORY.md` และ `memories/USER.md` ที่ต่อท้ายไฟล์หน่วยความจำของพื้นที่ทำงาน.
- ค่าเริ่มต้นการกำหนดค่าหน่วยความจำสำหรับหน่วยความจำไฟล์ของ OpenClaw รวมถึงรายการเก็บถาวรหรือรายการตรวจสอบด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho.
- Skills ที่มีไฟล์ `SKILL.md` อยู่ภายใต้ `skills/<name>/`.
- ค่าการกำหนดค่าราย Skills จาก `skills.config`.
- คีย์ API ที่รองรับจาก `.env` เฉพาะเมื่อใช้ `--include-secrets`.

### คีย์ `.env` ที่รองรับ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### สถานะเฉพาะเก็บถาวร

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกไปยังรายงานการย้ายข้อมูลเพื่อการตรวจสอบด้วยตนเอง แต่จะไม่ถูกโหลดลงในการกำหนดค่าหรือข้อมูลประจำตัวของ OpenClaw ที่ใช้งานจริง วิธีนี้จะคงสถานะที่ไม่โปร่งใสหรือไม่ปลอดภัยไว้ โดยไม่แสร้งว่า OpenClaw สามารถดำเนินการหรือเชื่อถือสถานะนั้นได้โดยอัตโนมัติ:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### หลังจากนำไปใช้

```bash
openclaw doctor
```

## สัญญาของ Plugin

แหล่งที่มาของการย้ายข้อมูลคือ plugins Plugin จะประกาศรหัสผู้ให้บริการใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะรัน Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการจะใช้งาน `detect`, `plan` และ `apply` Core เป็นเจ้าของการจัดลำดับ CLI, นโยบายการสำรองข้อมูล, พรอมป์, เอาต์พุต JSON และการตรวจสอบความขัดแย้งล่วงหน้า Core จะส่งแผนที่ผ่านการตรวจทานแล้วเข้าไปใน `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่ได้เฉพาะเมื่อไม่มีอาร์กิวเมนต์นั้นอยู่เพื่อความเข้ากันได้.

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์แบบคำนึงถึงความขัดแย้ง, สำเนารายงานเฉพาะเก็บถาวร, ตัวครอบ config-runtime แบบแคช และรายงานการย้ายข้อมูล.

## การผสานรวมกับการเริ่มต้นใช้งาน

การเริ่มต้นใช้งานสามารถเสนอการย้ายข้อมูลได้เมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการการย้ายข้อมูลของ Plugin เดียวกัน และยังคงแสดงตัวอย่างก่อนนำไปใช้.

<Note>
การนำเข้าระหว่างการเริ่มต้นใช้งานต้องใช้การตั้งค่า OpenClaw ใหม่ทั้งหมด รีเซ็ตการกำหนดค่า, ข้อมูลประจำตัว, เซสชัน และพื้นที่ทำงานก่อน หากคุณมีสถานะภายในเครื่องอยู่แล้ว การนำเข้าแบบสำรองข้อมูลพร้อมเขียนทับหรือแบบผสานถูกควบคุมด้วย feature gate สำหรับการตั้งค่าที่มีอยู่.
</Note>

## ที่เกี่ยวข้อง

- [การย้ายข้อมูลจาก Hermes](/th/install/migrating-hermes): คู่มือแบบทีละขั้นสำหรับผู้ใช้.
- [การย้ายข้อมูลจาก Claude](/th/install/migrating-claude): คู่มือแบบทีละขั้นสำหรับผู้ใช้.
- [การย้ายข้อมูล](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่.
- [Doctor](/th/gateway/doctor): การตรวจสอบสุขภาพหลังนำการย้ายข้อมูลไปใช้.
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin.
