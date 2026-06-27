---
read_when:
    - คุณต้องการย้ายจาก Hermes หรือระบบเอเจนต์อื่นมาใช้ OpenClaw
    - คุณกำลังเพิ่มผู้ให้บริการการย้ายข้อมูลที่ Plugin เป็นเจ้าของ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw migrate` (นำเข้าสถานะจากระบบเอเจนต์อื่น)
title: ย้ายข้อมูล
x-i18n:
    generated_at: "2026-06-27T17:21:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

นำเข้าสถานะจากระบบเอเจนต์อื่นผ่านผู้ให้บริการการย้ายที่ Plugin เป็นเจ้าของ ผู้ให้บริการที่มาพร้อมระบบครอบคลุมสถานะ Codex CLI, [Claude](/th/install/migrating-claude) และ [Hermes](/th/install/migrating-hermes); Plugin จากภายนอกสามารถลงทะเบียนผู้ให้บริการเพิ่มเติมได้

<Tip>
สำหรับคำแนะนำแบบทีละขั้นสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude) และ [การย้ายจาก Hermes](/th/install/migrating-hermes) [ศูนย์รวมการย้าย](/th/install/migrating) แสดงเส้นทางทั้งหมด
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
  ชื่อของผู้ให้บริการการย้ายที่ลงทะเบียนไว้ เช่น `hermes` เรียกใช้ `openclaw migrate list` เพื่อดูผู้ให้บริการที่ติดตั้งอยู่
</ParamField>
<ParamField path="--dry-run" type="boolean">
  สร้างแผนแล้วออกโดยไม่เปลี่ยนสถานะ
</ParamField>
<ParamField path="--from <path>" type="string">
  แทนที่ไดเรกทอรีสถานะต้นทาง ค่าเริ่มต้นของ Hermes คือ `~/.hermes`
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  นำเข้าข้อมูลประจำตัวที่รองรับโดยไม่ถาม การ apply แบบโต้ตอบจะถามก่อนนำเข้าข้อมูลประจำตัวสำหรับ auth ที่ตรวจพบ โดยเลือก yes เป็นค่าเริ่มต้น; `--yes` แบบไม่โต้ตอบต้องใช้ `--include-secrets` เพื่อให้นำเข้าข้อมูลเหล่านั้น
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  ข้ามการนำเข้าข้อมูลประจำตัวสำหรับ auth รวมถึงพรอมต์แบบโต้ตอบ
</ParamField>
<ParamField path="--overwrite" type="boolean">
  อนุญาตให้ apply แทนที่เป้าหมายที่มีอยู่เมื่อแผนรายงานความขัดแย้ง
</ParamField>
<ParamField path="--yes" type="boolean">
  ข้ามพรอมต์ยืนยัน จำเป็นในโหมดไม่โต้ตอบ
</ParamField>
<ParamField path="--skill <name>" type="string">
  เลือกรายการคัดลอก skill หนึ่งรายการตามชื่อ skill หรือ item id ใช้แฟล็กซ้ำเพื่อย้ายหลาย skills เมื่อไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือกแบบช่องทำเครื่องหมาย และการย้ายแบบไม่โต้ตอบจะคง skills ที่วางแผนไว้ทั้งหมด
</ParamField>
<ParamField path="--plugin <name>" type="string">
  เลือกรายการติดตั้ง Plugin ของ Codex หนึ่งรายการตามชื่อ Plugin หรือ item id ใช้แฟล็กซ้ำเพื่อย้าย Plugin ของ Codex หลายรายการ เมื่อไม่ระบุ การย้าย Codex แบบโต้ตอบจะแสดงตัวเลือก Plugin ของ Codex แบบเนทีฟในรูปแบบช่องทำเครื่องหมาย และการย้ายแบบไม่โต้ตอบจะคง Plugin ที่วางแผนไว้ทั้งหมด สิ่งนี้ใช้เฉพาะกับ Plugin ของ Codex แบบ `openai-curated` ที่ติดตั้งจากต้นทางและค้นพบโดย inventory ของ Codex app-server เท่านั้น
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  เฉพาะ Codex เท่านั้น บังคับให้ traversal ของ `app/list` จาก Codex app-server ต้นทางใหม่ก่อนวางแผนการเปิดใช้งาน Plugin แบบเนทีฟ ปิดเป็นค่าเริ่มต้นเพื่อให้การวางแผนการย้ายรวดเร็ว
</ParamField>
<ParamField path="--no-backup" type="boolean">
  ข้ามการสำรองข้อมูลก่อน apply ต้องใช้ `--force` เมื่อมีสถานะ OpenClaw ภายในเครื่องอยู่
</ParamField>
<ParamField path="--force" type="boolean">
  จำเป็นพร้อมกับ `--no-backup` เมื่อ apply จะปฏิเสธการข้ามการสำรองข้อมูลหากไม่ระบุ
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์แผนหรือผลลัพธ์ apply เป็น JSON เมื่อใช้ `--json` และไม่มี `--yes` apply จะพิมพ์แผนและไม่เปลี่ยนสถานะ
</ParamField>

## โมเดลความปลอดภัย

`openclaw migrate` เป็นแบบดูตัวอย่างก่อน

<AccordionGroup>
  <Accordion title="ดูตัวอย่างก่อน apply">
    ผู้ให้บริการจะส่งคืนแผนแบบแยกรายการก่อนมีการเปลี่ยนแปลงใด ๆ รวมถึงความขัดแย้ง รายการที่ข้าม และรายการละเอียดอ่อน แผน JSON, เอาต์พุต apply และรายงานการย้ายจะปกปิดคีย์ซ้อนที่ดูเหมือนความลับ เช่น API keys, tokens, authorization headers, cookies และ passwords

    `openclaw migrate apply <provider>` จะแสดงตัวอย่างแผนและถามก่อนเปลี่ยนสถานะ เว้นแต่ตั้งค่า `--yes` ในโหมดไม่โต้ตอบ apply ต้องใช้ `--yes`

  </Accordion>
  <Accordion title="การสำรองข้อมูล">
    apply จะสร้างและตรวจสอบข้อมูลสำรองของ OpenClaw ก่อนนำการย้ายไปใช้ หากยังไม่มีสถานะ OpenClaw ภายในเครื่อง ขั้นตอนสำรองข้อมูลจะถูกข้ามและการย้ายสามารถดำเนินต่อได้ หากต้องการข้ามการสำรองข้อมูลเมื่อมีสถานะอยู่ ให้ส่งทั้ง `--no-backup` และ `--force`
  </Accordion>
  <Accordion title="ความขัดแย้ง">
    apply จะปฏิเสธการดำเนินต่อเมื่อแผนมีความขัดแย้ง ตรวจสอบแผน แล้วเรียกใช้อีกครั้งพร้อม `--overwrite` หากตั้งใจจะแทนที่เป้าหมายที่มีอยู่ ผู้ให้บริการอาจยังเขียนข้อมูลสำรองระดับรายการสำหรับไฟล์ที่ถูกเขียนทับในไดเรกทอรีรายงานการย้าย
  </Accordion>
  <Accordion title="ความลับ">
    apply แบบโต้ตอบจะถามว่าจะนำเข้าข้อมูลประจำตัวสำหรับ auth ที่ตรวจพบหรือไม่ โดยเลือก yes เป็นค่าเริ่มต้น ใช้ `--no-auth-credentials` เพื่อข้ามข้อมูลเหล่านั้น หรือใช้ `--include-secrets` สำหรับการนำเข้าข้อมูลประจำตัวแบบไม่มีผู้ดูแลพร้อม `--yes`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการ Claude

ผู้ให้บริการ Claude ที่มาพร้อมระบบจะตรวจหาสถานะ Claude Code ที่ `~/.claude` เป็นค่าเริ่มต้น ใช้ `--from <path>` เพื่อนำเข้า Claude Code home หรือ project root เฉพาะ

<Tip>
สำหรับคำแนะนำแบบทีละขั้นสำหรับผู้ใช้ โปรดดู [การย้ายจาก Claude](/th/install/migrating-claude)
</Tip>

### สิ่งที่ Claude นำเข้า

- Project `CLAUDE.md` และ `.claude/CLAUDE.md` เข้าสู่พื้นที่ทำงานเอเจนต์ของ OpenClaw
- User `~/.claude/CLAUDE.md` ต่อท้ายไปยัง workspace `USER.md`
- นิยาม MCP server จาก project `.mcp.json`, Claude Code `~/.claude.json` และ Claude Desktop `claude_desktop_config.json`
- ไดเรกทอรี skill ของ Claude ที่มี `SKILL.md`
- ไฟล์ Markdown คำสั่งของ Claude ที่แปลงเป็น OpenClaw skills พร้อมการเรียกใช้แบบแมนนวลเท่านั้น

### สถานะ archive และการตรวจสอบแบบแมนนวล

Claude hooks, permissions, environment defaults, local memory, rules ตามขอบเขต path, subagents, caches, plans และ project history จะถูกเก็บไว้ในรายงานการย้ายหรือรายงานเป็นรายการที่ต้องตรวจสอบแบบแมนนวล OpenClaw จะไม่รัน hooks, คัดลอก allowlists แบบกว้าง หรือนำเข้าสถานะข้อมูลประจำตัว OAuth/Desktop โดยอัตโนมัติ

## ผู้ให้บริการ Codex

ผู้ให้บริการ Codex ที่มาพร้อมระบบจะตรวจหาสถานะ Codex CLI ที่ `~/.codex` เป็นค่าเริ่มต้น หรือ
ที่ `CODEX_HOME` เมื่อตั้งค่าตัวแปรสภาพแวดล้อมนั้น ใช้ `--from <path>` เพื่อ
ทำ inventory ของ Codex home เฉพาะ

ใช้ผู้ให้บริการนี้เมื่อย้ายไปยัง OpenClaw Codex harness และคุณต้องการ
ยกระดับสินทรัพย์ Codex CLI ส่วนตัวที่มีประโยชน์อย่างตั้งใจ การเปิด Codex app-server ภายในเครื่อง
ใช้ `CODEX_HOME` ต่อเอเจนต์ ดังนั้นจึงไม่อ่าน `~/.codex` ส่วนตัวของคุณ
เป็นค่าเริ่มต้น กระบวนการปกติยังคงสืบทอด `HOME` ดังนั้น Codex
จึงมองเห็นรายการ skills/marketplace ของ Plugin ที่แชร์ใน `$HOME/.agents/*` และ
subprocesses สามารถค้นหา config และ tokens ใน user-home ได้

การเรียกใช้ `openclaw migrate codex` ในเทอร์มินัลแบบโต้ตอบจะแสดงตัวอย่าง
แผนทั้งหมด จากนั้นเปิดตัวเลือกแบบช่องทำเครื่องหมายก่อนการยืนยัน apply ขั้นสุดท้าย ระบบจะถาม
รายการคัดลอก skill ก่อน ใช้ `Toggle all on` หรือ `Toggle all off` สำหรับการเลือกแบบกลุ่ม
กด Space เพื่อสลับแถว หรือกด Enter เพื่อเปิดใช้งานแถวที่ไฮไลต์
แล้วดำเนินต่อ skills ที่วางแผนไว้จะเริ่มต้นด้วยสถานะ checked, skills ที่ขัดแย้งจะเริ่มต้น unchecked และ
`Skip for now` จะข้ามการคัดลอก skill สำหรับการรันนี้โดยยังดำเนินต่อไปยังการเลือก Plugin
เมื่อ Plugin ของ Codex แบบ curated ที่ติดตั้งจากต้นทางสามารถย้ายได้และ
ไม่ได้ระบุ `--plugin` การย้ายจะถามต่อสำหรับการเปิดใช้งาน Plugin ของ Codex แบบเนทีฟ
ตามชื่อ Plugin รายการ Plugin
จะเริ่มต้น checked เว้นแต่ config ของ Plugin Codex ใน OpenClaw เป้าหมายมี
Plugin นั้นอยู่แล้ว Plugin เป้าหมายที่มีอยู่จะเริ่มต้น unchecked และแสดงคำใบ้ความขัดแย้ง เช่น
`conflict: plugin exists`; เลือก `Toggle all off` เพื่อไม่ย้าย Plugin ของ Codex แบบเนทีฟ
ในการรันนั้น หรือ `Skip for now` เพื่อหยุดก่อน apply สำหรับการรันแบบสคริปต์หรือ
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

- ไดเรกทอรี skill ของ Codex CLI ใต้ `$CODEX_HOME/skills` ยกเว้น
  cache `.system` ของ Codex
- AgentSkills ส่วนตัวใต้ `$HOME/.agents/skills` ซึ่งคัดลอกเข้าสู่พื้นที่ทำงาน
  เอเจนต์ OpenClaw ปัจจุบันเมื่อคุณต้องการการเป็นเจ้าของต่อเอเจนต์
- Plugin ของ Codex แบบ `openai-curated` ที่ติดตั้งจากต้นทางและค้นพบผ่าน
  `plugin/list` ของ Codex app-server การวางแผนจะอ่าน `plugin/read` สำหรับแต่ละ
  Plugin ที่ติดตั้งและเปิดใช้งานอยู่ Plugin ที่มี app หนุนหลังต้องการให้ response บัญชี
  Codex app-server ต้นทางเป็นบัญชีสมัครสมาชิก ChatGPT; response บัญชีที่ไม่ใช่ ChatGPT
  หรือไม่มีจะถูกข้ามด้วย `codex_subscription_required` โดยค่าเริ่มต้น
  การย้ายจะไม่เรียก `app/list` ต้นทาง ดังนั้น Plugin ที่มี app หนุนหลังซึ่งผ่าน
  account gate จะถูกวางแผนโดยไม่มีการตรวจสอบการเข้าถึง app ต้นทาง และ
  ความล้มเหลวของ transport ในการค้นหาบัญชีจะถูกข้ามด้วย `codex_account_unavailable` ส่ง
  `--verify-plugin-apps` เมื่อคุณต้องการให้การย้ายบังคับ snapshot
  `app/list` ต้นทางใหม่ และกำหนดให้ทุก app ที่เป็นเจ้าของต้องมีอยู่ เปิดใช้งาน และ
  เข้าถึงได้ก่อนวางแผนการเปิดใช้งานแบบเนทีฟ ในโหมดนั้น ความล้มเหลวของ transport
  ในการค้นหาบัญชีจะส่งต่อไปยังการตรวจสอบ inventory ของ app ต้นทาง snapshot
  inventory ของ app ต้นทางจะถูกเก็บไว้ในหน่วยความจำสำหรับกระบวนการปัจจุบัน; จะ
  ไม่ถูกเขียนไปยังเอาต์พุตการย้ายหรือ config เป้าหมาย Plugin ที่ปิดใช้งาน,
  รายละเอียด Plugin ที่อ่านไม่ได้, บัญชีต้นทางที่ติด subscription gate และเมื่อ
  ขอการตรวจสอบ app ที่หายไป, app ที่ปิดใช้งาน, app ที่เข้าถึงไม่ได้ หรือ
  ความล้มเหลวของ inventory app ต้นทาง จะกลายเป็นรายการที่ข้ามแบบแมนนวลพร้อมเหตุผล
  ที่มีชนิด แทนที่จะเป็นรายการ config เป้าหมาย
  apply จะเรียก `plugin/install` ของ app-server สำหรับ Plugin ที่เลือกและมีสิทธิ์แต่ละรายการ
  แม้ว่า app-server เป้าหมายจะรายงานว่า Plugin นั้นติดตั้งและ
  เปิดใช้งานอยู่แล้ว Plugin ของ Codex ที่ย้ายแล้วใช้ได้เฉพาะในเซสชันที่เลือก
  native Codex harness; ไม่ถูกเปิดเผยให้กับ OpenClaw provider runs,
  ACP conversation bindings หรือ harness อื่น ๆ

### สถานะ Codex ที่ต้องตรวจสอบแบบแมนนวล

Codex `config.toml`, `hooks/hooks.json` แบบเนทีฟ, marketplaces ที่ไม่ใช่ curated, cached
plugin bundles ที่ไม่ใช่ Plugin curated ที่ติดตั้งจากต้นทาง และ Plugin ที่ติดตั้งจากต้นทาง
ซึ่งไม่ผ่าน source subscription gate จะไม่ถูกเปิดใช้งานโดยอัตโนมัติ
เมื่อมีการตั้งค่า `--verify-plugin-apps` Plugin ที่ไม่ผ่าน source app-inventory
gate จะถูกข้ามด้วยเช่นกัน รายการเหล่านี้จะถูกคัดลอกหรือรายงานในรายงานการย้ายเพื่อ
ตรวจสอบแบบแมนนวล

สำหรับ Plugin curated ที่ติดตั้งจากต้นทางและถูกย้าย apply จะเขียน:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- รายการ Plugin ชัดเจนหนึ่งรายการพร้อม `marketplaceName: "openai-curated"` และ
  `pluginName` สำหรับแต่ละ Plugin ที่เลือก

การย้ายข้อมูลจะไม่เขียน `plugins["*"]` และจะไม่จัดเก็บพาธแคช marketplace ภายในเครื่อง
ความล้มเหลวของการสมัครใช้งานฝั่งต้นทางจะถูกรายงานในรายการแบบกำหนดเองพร้อมเหตุผลที่มีชนิด
เช่น `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` หรือ `plugin_read_unavailable` เมื่อใช้ `--verify-plugin-apps`
ความล้มเหลวของ app-inventory ต้นทางอาจปรากฏเป็น `app_inaccessible`,
`app_disabled`, `app_missing` หรือ `app_inventory_unavailable` ได้เช่นกัน Plugin ที่ถูกข้าม
จะไม่ถูกเขียนลงในการกำหนดค่าเป้าหมาย
การติดตั้งฝั่งเป้าหมายที่ต้องใช้การยืนยันตัวตนจะถูกรายงานในรายการ Plugin ที่ได้รับผลกระทบพร้อม
`status: "skipped"`, `reason: "auth_required"` และตัวระบุแอปที่ผ่านการล้างข้อมูลแล้ว
รายการกำหนดค่าแบบชัดเจนของรายการเหล่านั้นจะถูกเขียนเป็นปิดใช้งานไว้จนกว่าคุณจะอนุญาตอีกครั้งและ
เปิดใช้งาน รายการติดตั้งล้มเหลวอื่นๆ จะเป็นผลลัพธ์ `error` ที่จำกัดขอบเขตตามรายการ

หากคลัง Plugin ของ app-server ของ Codex ไม่พร้อมใช้งานระหว่างการวางแผน การย้ายข้อมูล
จะถอยกลับไปใช้รายการคำแนะนำ bundle ที่แคชไว้แทนที่จะทำให้การย้ายข้อมูลทั้งหมดล้มเหลว

## ผู้ให้บริการ Hermes

ผู้ให้บริการ Hermes ที่รวมมาในตัวจะตรวจหาสถานะที่ `~/.hermes` ตามค่าเริ่มต้น ใช้ `--from <path>` เมื่อ Hermes อยู่ที่อื่น

### สิ่งที่ Hermes นำเข้า

- การกำหนดค่าโมเดลเริ่มต้นจาก `config.yaml`
- ผู้ให้บริการโมเดลที่กำหนดค่าไว้และ endpoint แบบกำหนดเองที่เข้ากันได้กับ OpenAI จาก `providers` และ `custom_providers`
- คำจำกัดความเซิร์ฟเวอร์ MCP จาก `mcp_servers` หรือ `mcp.servers`
- `SOUL.md` และ `AGENTS.md` เข้าสู่พื้นที่ทำงานของเอเจนต์ OpenClaw
- `memories/MEMORY.md` และ `memories/USER.md` ที่ผนวกเข้ากับไฟล์หน่วยความจำของพื้นที่ทำงาน
- ค่าเริ่มต้นการกำหนดค่าหน่วยความจำสำหรับหน่วยความจำไฟล์ของ OpenClaw รวมถึงรายการเก็บถาวรหรือรายการตรวจทานด้วยตนเองสำหรับผู้ให้บริการหน่วยความจำภายนอก เช่น Honcho
- Skills ที่มีไฟล์ `SKILL.md` อยู่ใต้ `skills/<name>/`
- ค่ากำหนดค่าแยกตาม Skills จาก `skills.config`
- ข้อมูลประจำตัว OpenAI OAuth ของ OpenCode จาก `auth.json` ของ OpenCode เมื่อยอมรับการย้ายข้อมูลประจำตัวแบบโต้ตอบ หรือเมื่อมีการตั้งค่า `--include-secrets` รายการ OAuth ใน `auth.json` ของ Hermes เป็นสถานะเดิมที่รายงานเพื่อให้ยืนยันตัวตน OpenAI ใหม่ด้วยตนเองหรือซ่อมแซมด้วย doctor
- API keys และ tokens ที่รองรับจาก `.env` ของ Hermes และ `auth.json` ของ OpenCode เมื่อยอมรับการย้ายข้อมูลประจำตัวแบบโต้ตอบ หรือเมื่อมีการตั้งค่า `--include-secrets`

### คีย์ `.env` ที่รองรับ

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### สถานะแบบเก็บถาวรเท่านั้น

สถานะ Hermes ที่ OpenClaw ไม่สามารถตีความได้อย่างปลอดภัยจะถูกคัดลอกลงในรายงานการย้ายข้อมูลเพื่อการตรวจทานด้วยตนเอง แต่จะไม่ถูกโหลดเข้าสู่การกำหนดค่าหรือข้อมูลประจำตัวที่ใช้งานจริงของ OpenClaw วิธีนี้จะรักษาสถานะที่คลุมเครือหรือไม่ปลอดภัยไว้โดยไม่แสร้งว่า OpenClaw สามารถเรียกใช้งานหรือเชื่อถือสถานะนั้นโดยอัตโนมัติได้:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### หลังจากนำไปใช้

```bash
openclaw doctor
```

## สัญญา Plugin

แหล่งที่มาของการย้ายข้อมูลคือ Plugin Plugin จะประกาศ provider ids ของตนใน `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

ขณะรันไทม์ Plugin จะเรียก `api.registerMigrationProvider(...)` ผู้ให้บริการจะ implement `detect`, `plan` และ `apply` Core เป็นเจ้าของการประสานงาน CLI, นโยบายสำรองข้อมูล, prompt, เอาต์พุต JSON และการตรวจสอบความขัดแย้งล่วงหน้า Core จะส่งแผนที่ตรวจทานแล้วเข้าไปยัง `apply(ctx, plan)` และผู้ให้บริการอาจสร้างแผนใหม่ได้เฉพาะเมื่อไม่มีอาร์กิวเมนต์นั้นเพื่อความเข้ากันได้

Plugin ผู้ให้บริการสามารถใช้ `openclaw/plugin-sdk/migration` สำหรับการสร้างรายการและจำนวนสรุป รวมถึง `openclaw/plugin-sdk/migration-runtime` สำหรับการคัดลอกไฟล์ที่รับรู้ความขัดแย้ง, การคัดลอกรายงานแบบเก็บถาวรเท่านั้น, wrapper config-runtime ที่แคชไว้ และรายงานการย้ายข้อมูล

## การผสานกับ Onboarding

Onboarding สามารถเสนอการย้ายข้อมูลเมื่อผู้ให้บริการตรวจพบแหล่งที่มาที่รู้จัก ทั้ง `openclaw onboard --flow import` และ `openclaw setup --wizard --import-from hermes` ใช้ผู้ให้บริการ Plugin สำหรับการย้ายข้อมูลเดียวกัน และยังคงแสดงตัวอย่างก่อนนำไปใช้

<Note>
การนำเข้าผ่าน Onboarding ต้องใช้การตั้งค่า OpenClaw ใหม่ หากคุณมีสถานะภายในเครื่องอยู่แล้ว ให้รีเซ็ต config, credentials, sessions และ workspace ก่อน การนำเข้าแบบสำรองข้อมูลพร้อมเขียนทับหรือแบบผสานถูกจำกัดด้วย feature gate สำหรับการตั้งค่าที่มีอยู่
</Note>

## ที่เกี่ยวข้อง

- [การย้ายจาก Hermes](/th/install/migrating-hermes): คู่มือแบบทีละขั้นสำหรับผู้ใช้
- [การย้ายจาก Claude](/th/install/migrating-claude): คู่มือแบบทีละขั้นสำหรับผู้ใช้
- [การย้ายข้อมูล](/th/install/migrating): ย้าย OpenClaw ไปยังเครื่องใหม่
- [Doctor](/th/gateway/doctor): ตรวจสุขภาพหลังนำการย้ายข้อมูลไปใช้
- [Plugin](/th/tools/plugin): การติดตั้งและลงทะเบียน Plugin
