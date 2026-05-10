---
read_when:
    - คุณต้องการอ่านหรือเขียนโหนดปลายทางภายในไฟล์เวิร์กสเปซจากเทอร์มินัล
    - คุณกำลังเขียนสคริปต์โดยอิงกับสถานะของเวิร์กสเปซและต้องการรูปแบบการระบุที่อยู่ที่เสถียรและไม่ผูกกับชนิด
    - คุณกำลังดีบักพาธ `oc://` (ตรวจสอบความถูกต้องของไวยากรณ์ และดูว่ามันแปลงไปเป็นอะไร)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw path` (ตรวจสอบและแก้ไขไฟล์ในพื้นที่ทำงานผ่านรูปแบบการระบุที่อยู่ `oc://`)
title: พาธ
x-i18n:
    generated_at: "2026-05-10T19:30:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

การเข้าถึงเชลล์ที่ Plugin จัดเตรียมให้สำหรับโครงสร้างการระบุที่อยู่ `oc://`: แบบแผนพาธชนิดเดียวที่แจกแจงตามประเภท สำหรับตรวจสอบและแก้ไขไฟล์ในเวิร์กสเปซที่ระบุที่อยู่ได้ (markdown, jsonc, jsonl) ผู้ดูแลโฮสต์เอง ผู้เขียน Plugin และส่วนขยายของเอดิเตอร์ใช้สิ่งนี้เพื่ออ่าน ค้นหา หรืออัปเดตตำแหน่งแคบ ๆ โดยไม่ต้องสร้างตัวแยกวิเคราะห์เฉพาะไฟล์เอง

CLI สะท้อนกริยาสาธารณะของโครงสร้างนี้:

- `resolve` เป็นรูปธรรมและตรงกันรายการเดียว
- `find` เป็นกริยาสำหรับหลายผลลัพธ์ที่ตรงกัน ใช้กับไวลด์การ์ด ยูเนียน เพรดิเคต และการขยายตามตำแหน่ง
- `set` ยอมรับเฉพาะพาธรูปธรรมหรือตัวบอกตำแหน่งแทรกเท่านั้น รูปแบบไวลด์การ์ดจะถูกปฏิเสธก่อนเขียน

`path` จัดเตรียมโดย Plugin ทางเลือกที่รวมมาในชุดชื่อ `oc-path` เปิดใช้งานก่อนใช้ครั้งแรก:

```bash
openclaw plugins enable oc-path
```

## ทำไมจึงใช้

สถานะของ OpenClaw กระจายอยู่ใน markdown ที่มนุษย์แก้ไข ไฟล์กำหนดค่า JSONC ที่มีคอมเมนต์ และบันทึก JSONL แบบต่อท้ายเท่านั้น สคริปต์เชลล์ hook และเอเจนต์มักต้องการค่าเล็ก ๆ เพียงหนึ่งค่าจากไฟล์เหล่านั้น เช่น คีย์ frontmatter การตั้งค่า Plugin ฟิลด์ของระเบียนบันทึก หรือรายการ bullet ใต้ส่วนที่มีชื่อ

`openclaw path` ให้ที่อยู่ที่เสถียรแก่ผู้เรียกเหล่านั้น แทนการใช้ grep, regex หรือตัวแยกวิเคราะห์เฉพาะกิจสำหรับไฟล์แต่ละชนิด พาธ `oc://` เดียวกันสามารถตรวจสอบความถูกต้อง แปลงเป็นเป้าหมาย ค้นหา ทดลองเขียน และเขียนจริงจากเทอร์มินัลได้ ทำให้อัตโนมัติแบบแคบทบทวนได้ง่ายขึ้นและเล่นซ้ำได้ปลอดภัยขึ้น สิ่งนี้มีประโยชน์เป็นพิเศษเมื่อคุณต้องการอัปเดต leaf หนึ่งรายการโดยคงคอมเมนต์ เครื่องหมายจบบรรทัด และรูปแบบแวดล้อมส่วนอื่นของไฟล์ไว้

ใช้สิ่งนี้เมื่อสิ่งที่คุณต้องการมีที่อยู่เชิงตรรกะ แต่รูปทรงไฟล์จริงแตกต่างกัน:

- hook ต้องการอ่านการตั้งค่าหนึ่งค่าจาก JSONC ที่มีคอมเมนต์ โดยไม่สูญเสียคอมเมนต์เมื่อเขียนค่ากลับ
- สคริปต์บำรุงรักษาต้องการค้นหาฟิลด์เหตุการณ์ทั้งหมดที่ตรงกันในบันทึก JSONL โดยไม่โหลดบันทึกทั้งไฟล์เข้าสู่ตัวแยกวิเคราะห์แบบกำหนดเอง
- ส่วนขยายของเอดิเตอร์ต้องการกระโดดไปยังส่วน markdown หรือรายการ bullet ตาม slug แล้วเรนเดอร์บรรทัดจริงที่แปลงได้
- เอเจนต์ต้องการทดลองแก้ไขเวิร์กสเปซเล็ก ๆ ก่อนนำไปใช้ โดยให้เห็นไบต์ที่เปลี่ยนแปลงในการทบทวน

คุณอาจไม่จำเป็นต้องใช้ `openclaw path` สำหรับการแก้ไขทั้งไฟล์ทั่วไป การย้ายข้อมูล config ที่ซับซ้อน หรือการเขียนเฉพาะหน่วยความจำ สิ่งเหล่านั้นควรใช้คำสั่งหรือ Plugin ของเจ้าของ `path` มีไว้สำหรับการดำเนินการไฟล์ขนาดเล็กที่ระบุที่อยู่ได้ ซึ่งคำสั่งเทอร์มินัลที่ทำซ้ำได้ชัดเจนกว่าตัวแยกวิเคราะห์เฉพาะกิจอีกตัวหนึ่ง

## วิธีใช้งาน

อ่านค่าหนึ่งค่าจากไฟล์กำหนดค่าที่มนุษย์แก้ไข:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

ดูตัวอย่างการเขียนโดยไม่แตะดิสก์:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

ค้นหาระเบียนที่ตรงกันในบันทึก JSONL แบบต่อท้ายเท่านั้น:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

ระบุที่อยู่คำสั่งใน markdown ตามส่วนและรายการ แทนการใช้เลขบรรทัด:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

ตรวจสอบพาธใน CI หรือสคริปต์เตรียมพร้อมก่อนที่สคริปต์จะอ่านหรือเขียน:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

คำสั่งเหล่านี้ออกแบบมาให้คัดลอกไปใช้ในสคริปต์เชลล์ได้ ใช้ `--json` เมื่อผู้เรียกต้องการผลลัพธ์แบบมีโครงสร้าง และใช้ `--human` เมื่อบุคคลกำลังตรวจสอบผลลัพธ์

## วิธีทำงาน

`openclaw path` ทำสี่อย่าง:

1. แยกวิเคราะห์ที่อยู่ `oc://` เป็นช่อง: file, section, item, field และ session ทางเลือก
2. เลือกอะแดปเตอร์ตามชนิดไฟล์จากนามสกุลเป้าหมาย (`.md`, `.jsonc`, `.jsonl` และนามแฝงที่เกี่ยวข้อง)
3. แปลงช่องเหล่านั้นเทียบกับ AST ของชนิดไฟล์นั้น: หัวข้อ/รายการ markdown, คีย์อ็อบเจกต์/ดัชนีอาร์เรย์ JSONC หรือระเบียนบรรทัด JSONL
4. สำหรับ `set` ปล่อยไบต์ที่แก้ไขผ่านอะแดปเตอร์เดียวกัน เพื่อให้ส่วนที่ไม่ได้แตะของไฟล์คงคอมเมนต์ เครื่องหมายจบบรรทัด และรูปแบบใกล้เคียงไว้ในจุดที่ชนิดไฟล์รองรับ

`resolve` และ `set` ต้องการเป้าหมายรูปธรรมหนึ่งรายการ `find` เป็นกริยาสำรวจ: มันขยายไวลด์การ์ด ยูเนียน เพรดิเคต และลำดับให้เป็นผลลัพธ์รูปธรรมที่คุณตรวจสอบได้ก่อนเลือกหนึ่งรายการเพื่อเขียน

## คำสั่งย่อย

| คำสั่งย่อย              | จุดประสงค์                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | พิมพ์ผลลัพธ์รูปธรรมที่พาธ (หรือ "ไม่พบ")                       |
| `find <pattern>`        | แจกแจงผลลัพธ์ที่ตรงกันสำหรับพาธไวลด์การ์ด / ยูเนียน / เพรดิเคต                   |
| `set <oc-path> <value>` | เขียน leaf หรือเป้าหมายแทรกที่พาธรูปธรรม รองรับ `--dry-run`   |
| `validate <oc-path>`    | แยกวิเคราะห์เท่านั้น พิมพ์การแตกโครงสร้าง (file / section / item / field)      |
| `emit <file>`           | ส่งไฟล์ผ่าน `parseXxx` + `emitXxx` แบบไป-กลับ (การวินิจฉัยความตรงของไบต์) |

## แฟล็กส่วนกลาง

| แฟล็ก            | จุดประสงค์                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | แปลงช่องไฟล์เทียบกับไดเรกทอรีนี้ (ค่าเริ่มต้น: `process.cwd()`) |
| `--file <path>` | แทนที่พาธที่แปลงแล้วของช่องไฟล์ (การเข้าถึงแบบ absolute)                |
| `--json`        | บังคับผลลัพธ์ JSON (ค่าเริ่มต้นเมื่อ stdout ไม่ใช่ TTY)                    |
| `--human`       | บังคับผลลัพธ์สำหรับมนุษย์ (ค่าเริ่มต้นเมื่อ stdout เป็น TTY)                       |
| `--dry-run`     | (เฉพาะบน `set`) พิมพ์ไบต์ที่จะถูกเขียนโดยไม่เขียนจริง   |

## ไวยากรณ์ `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

กฎของช่อง: `field` ต้องมี `item` และ `item` ต้องมี `section` ในทั้งสี่ช่อง:

- **เซกเมนต์ที่ใส่เครื่องหมายคำพูด** — `"a/b.c"` รอดจากตัวคั่น `/` และ `.`
  เนื้อหาเป็นไบต์ตามตัวอักษร ไม่อนุญาตให้มี `"` และ `\` ภายในเครื่องหมายคำพูด
  ช่องไฟล์รับรู้เครื่องหมายคำพูดด้วย: `oc://"skills/email-drafter"/Tools/$last`
  จะถือว่า `skills/email-drafter` เป็นพาธไฟล์เดียว
- **เพรดิเคต** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]` ตัวดำเนินการตัวเลขต้องการให้ทั้งสองฝั่งแปลงเป็นจำนวนจำกัดได้
- **ยูเนียน** — `{a,b,c}` ตรงกับทางเลือกใดก็ได้
- **ไวลด์การ์ด** — `*` (เซกเมนต์ย่อยเดียว) และ `**` (ศูนย์หรือมากกว่า,
  แบบเรียกซ้ำ) `find` ยอมรับสิ่งเหล่านี้ ส่วน `resolve` และ `set` ปฏิเสธเพราะกำกวม
- **ตามตำแหน่ง** — `$last` แปลงเป็นดัชนีสุดท้าย / คีย์ที่ประกาศสุดท้าย
- **ลำดับ** — `#N` สำหรับผลลัพธ์ที่ตรงกันลำดับที่ N ตามลำดับเอกสาร
- **ตัวบอกตำแหน่งแทรก** — `+`, `+key`, `+nnn` สำหรับการแทรกแบบมีคีย์ / มีดัชนี
  (ใช้กับ `set`)
- **ขอบเขต session** — `?session=cron-daily` เป็นต้น ตั้งฉากกับการซ้อนของช่อง
  ค่า session เป็นค่าดิบ ไม่ถูกถอดรหัสเปอร์เซ็นต์ และต้องไม่มีอักขระควบคุมหรือตัวคั่น query ที่สงวนไว้ (`?`, `&`, `%`)

อักขระสงวน (`?`, `&`, `%`) ที่อยู่นอกเซกเมนต์ที่ใส่เครื่องหมายคำพูด เพรดิเคต หรือยูเนียนจะถูกปฏิเสธ อักขระควบคุม (U+0000-U+001F, U+007F) จะถูกปฏิเสธทุกที่ รวมถึงค่า query `session`

รับประกันว่า `formatOcPath(parseOcPath(path)) === path` สำหรับพาธ canonical พารามิเตอร์ query ที่ไม่เป็น canonical จะถูกละเว้น ยกเว้นค่า `session=` ที่ไม่ว่างค่าแรก

## การระบุที่อยู่ตามชนิดไฟล์

| ชนิด       | โมเดลการระบุที่อยู่                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | ส่วน H2 ตาม slug, รายการ bullet ตาม slug หรือ `#N`, frontmatter ผ่าน `[frontmatter]`       |
| JSONC/JSON | คีย์อ็อบเจกต์และดัชนีอาร์เรย์ จุดจะแยกเซกเมนต์ย่อยที่ซ้อนกัน เว้นแต่ใส่เครื่องหมายคำพูด              |
| JSONL      | ที่อยู่บรรทัดระดับบนสุด (`L1`, `L2`, `$last`) จากนั้นไล่ลงแบบ JSONC ภายในบรรทัด |

`resolve` ส่งคืนผลลัพธ์ที่ตรงกันแบบมีโครงสร้าง: `root`, `node`, `leaf` หรือ
`insertion-point` พร้อมเลขบรรทัดแบบเริ่มที่ 1 ค่า leaf จะแสดงเป็นข้อความพร้อม `leafType` เพื่อให้ผู้เขียน Plugin สามารถเรนเดอร์ตัวอย่างได้โดยไม่ต้องพึ่งพารูปทรง AST เฉพาะชนิด

## สัญญาการกลายพันธุ์

`set` เขียนเป้าหมายรูปธรรมหนึ่งรายการ:

- ค่า frontmatter ของ Markdown และฟิลด์รายการ `- key: value` เป็น leaf แบบสตริง
  การแทรก Markdown จะต่อท้ายส่วน คีย์ frontmatter หรือรายการในส่วน และเรนเดอร์รูปทรง markdown แบบ canonical สำหรับไฟล์ที่เปลี่ยนแปลง
- การเขียน leaf ของ JSONC จะแปลงค่าสตริงให้เป็นชนิด leaf ที่มีอยู่
  (`string`, `number` จำกัด, `true`/`false` หรือ `null`) การแทรกอ็อบเจกต์และอาร์เรย์ JSONC จะแยกวิเคราะห์ `<value>` เป็น JSON และใช้เส้นทางแก้ไขของ `jsonc-parser` สำหรับการเขียน leaf ทั่วไป โดยคงคอมเมนต์และรูปแบบใกล้เคียงไว้
- การเขียน leaf ของ JSONL จะแปลงเหมือน JSONC ภายในบรรทัด การแทนที่ทั้งบรรทัดและการต่อท้ายจะแยกวิเคราะห์ `<value>` เป็น JSON JSONL ที่เรนเดอร์แล้วจะคงธรรมเนียมเครื่องหมายจบบรรทัด LF/CRLF ที่เด่นของไฟล์ไว้

ใช้ `--dry-run` ก่อนการเขียนที่ผู้ใช้มองเห็นเมื่อไบต์จริงมีความสำคัญ โครงสร้างนี้คงผลลัพธ์ที่เหมือนไบต์เดิมสำหรับการไป-กลับ parse/emit แต่การกลายพันธุ์อาจทำให้พื้นที่หรือไฟล์ที่แก้ไขเป็น canonical ได้ ขึ้นอยู่กับชนิด

## ตัวอย่าง

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

ตัวอย่างไวยากรณ์เพิ่มเติม:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## สูตรตามชนิดไฟล์

กริยาทั้งห้าเดียวกันทำงานได้ข้ามชนิดไฟล์ แบบแผนการระบุที่อยู่จะแจกจ่ายตามนามสกุลไฟล์ ตัวอย่างด้านล่างใช้ fixture จากคำอธิบาย PR

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

เพรดิเคต `[frontmatter]` ระบุที่อยู่บล็อก frontmatter แบบ YAML; `tools`
ตรงกับหัวข้อ `## Tools` ผ่าน slug และ leaf ของรายการจะคงรูปแบบ slug ไว้
แม้เมื่อซอร์สใช้ขีดล่าง (`send_email` → `send-email`)

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

การแก้ไข JSONC จะผ่าน `jsonc-parser` ดังนั้นคอมเมนต์และช่องว่างจะยังคงอยู่หลังจาก
`set` ให้รันพร้อม `--dry-run` ก่อนเพื่อตรวจสอบไบต์ก่อนคอมมิต

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

แต่ละบรรทัดคือระเบียน อ้างอิงด้วยเพรดิเคต (`[event=action]`) เมื่อคุณไม่ทราบ
หมายเลขบรรทัด หรือด้วยส่วน `LN` แบบ canonical เมื่อคุณทราบ

## อ้างอิงคำสั่งย่อย

### `resolve <oc-path>`

อ่าน leaf หรือโหนดเดียว ระบบจะปฏิเสธไวลด์การ์ด — ใช้ `find` สำหรับกรณีนั้น
ออกด้วย `0` เมื่อพบรายการที่ตรงกัน, `1` เมื่อไม่พบแบบไม่มีข้อผิดพลาด, `2` เมื่อเกิดข้อผิดพลาดการแยกวิเคราะห์หรือรูปแบบถูกปฏิเสธ

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

แจกแจงรายการที่ตรงกันทุกรายการสำหรับรูปแบบไวลด์การ์ด / เพรดิเคต / ยูเนียน ออกด้วย `0`
เมื่อมีอย่างน้อยหนึ่งรายการที่ตรงกัน, `1` เมื่อไม่มีรายการใดเลย ไวลด์การ์ดของช่องไฟล์จะถูกปฏิเสธพร้อม
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — ให้ส่งไฟล์ที่ระบุชัดเจน (การทำ glob
หลายไฟล์เป็นฟีเจอร์ที่จะตามมา)

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

เขียน leaf จับคู่กับ `--dry-run` เพื่อดูตัวอย่างไบต์ที่จะถูก
เขียนโดยไม่แตะไฟล์ ออกด้วย `0` เมื่อเขียนสำเร็จ, `1` หาก
substrate ปฏิเสธ (เช่น ชน sentinel guard), `2` เมื่อเกิดข้อผิดพลาดการแยกวิเคราะห์

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

เครื่องหมายแทรก `+key` จะสร้าง child ตามชื่อหากยังไม่มีอยู่
`+nnn` และ `+` แบบเดี่ยวใช้สำหรับการแทรกตามดัชนีและการแทรกต่อท้ายตามลำดับ

### `validate <oc-path>`

ตรวจสอบเฉพาะการแยกวิเคราะห์ ไม่มีการเข้าถึงระบบไฟล์ มีประโยชน์เมื่อคุณต้องการยืนยันว่า
เส้นทางเทมเพลตมีรูปแบบถูกต้องก่อนแทนที่ตัวแปร หรือเมื่อคุณต้องการ
การแยกโครงสร้างเพื่อดีบัก:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

ออกด้วย `0` เมื่อถูกต้อง, `1` เมื่อไม่ถูกต้อง (พร้อม `code` และ
`message` ที่มีโครงสร้าง), `2` เมื่อเกิดข้อผิดพลาดของอาร์กิวเมนต์

### `emit <file>`

ส่งไฟล์ผ่านตัวแยกวิเคราะห์และตัว emit เฉพาะแต่ละชนิดแบบไปกลับ เอาต์พุตควร
เหมือนกับอินพุตทุกไบต์สำหรับไฟล์ที่สมบูรณ์ — ความแตกต่างบ่งชี้ว่าเป็น
บั๊กของตัวแยกวิเคราะห์หรือการชน sentinel มีประโยชน์สำหรับการดีบักพฤติกรรม substrate กับ
อินพุตจริง

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## รหัสออก

| รหัส | ความหมาย                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | สำเร็จ (`resolve` / `find`: มีอย่างน้อยหนึ่งรายการที่ตรงกัน `set`: เขียนสำเร็จ) |
| `1`  | ไม่พบรายการที่ตรงกัน หรือ `set` ถูก substrate ปฏิเสธ (ไม่มีข้อผิดพลาดระดับระบบ)      |
| `2`  | ข้อผิดพลาดของอาร์กิวเมนต์หรือการแยกวิเคราะห์                                                   |

## โหมดเอาต์พุต

`openclaw path` รับรู้ TTY ได้: แสดงเอาต์พุตที่อ่านได้สำหรับมนุษย์บนเทอร์มินัล, JSON เมื่อ
stdout ถูก pipe หรือ redirect `--json` และ `--human` จะเขียนทับ
การตรวจจับอัตโนมัติ

## หมายเหตุ

- `set` เขียนไบต์ผ่านเส้นทาง emit ของ substrate ซึ่งใช้
  redaction-sentinel guard โดยอัตโนมัติ leaf ที่มี
  `__OPENCLAW_REDACTED__` (ตรงตัวหรือเป็นสตริงย่อย) จะถูกปฏิเสธในขณะเขียน
- การแยกวิเคราะห์ JSONC และการแก้ไข leaf ใช้ dependency `jsonc-parser`
  ภายใน Plugin ดังนั้นคอมเมนต์และการจัดรูปแบบจะถูกเก็บไว้ในการเขียน leaf
  ทั่วไป แทนที่จะผ่านเส้นทางตัวแยกวิเคราะห์/เรนเดอร์ใหม่ที่เขียนเอง
- `path` ไม่รู้จัก LKG หากไฟล์ถูกติดตามโดย LKG การเรียก
  observe ครั้งถัดไปจะตัดสินใจว่าจะ promote / recover หรือไม่ มีแผนทำ `set --batch` สำหรับ
  multi-set แบบ atomic ผ่านวงจรชีวิต promote/recover ของ LKG
  ควบคู่กับ substrate สำหรับการกู้คืน LKG

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
