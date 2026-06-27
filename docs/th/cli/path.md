---
read_when:
    - คุณต้องการอ่านหรือเขียนโหนดปลายทางภายในไฟล์ในเวิร์กสเปซจากเทอร์มินัล
    - คุณกำลังเขียนสคริปต์กับสถานะของเวิร์กสเปซ และต้องการรูปแบบการกำหนดที่อยู่ที่เสถียรและไม่ขึ้นกับชนิด
    - คุณกำลังดีบักพาธ `oc://` (ตรวจสอบไวยากรณ์ และดูว่าแปลงค่าเป็นอะไร)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw path` (ตรวจสอบและแก้ไขไฟล์ในพื้นที่ทำงานผ่านรูปแบบการระบุที่อยู่ `oc://`)
title: เส้นทาง
x-i18n:
    generated_at: "2026-06-27T17:22:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

การเข้าถึง shell ที่ Plugin จัดเตรียมไว้ให้สำหรับซับสเตรตการระบุที่อยู่ `oc://`: สคีมาพาธแบบหนึ่งเดียวที่ dispatch ตามชนิด สำหรับตรวจสอบและแก้ไขไฟล์ workspace ที่ระบุที่อยู่ได้ (markdown, jsonc, jsonl, yaml/yml/lobster) ผู้ดูแลโฮสต์เอง ผู้เขียน Plugin และส่วนขยาย editor ใช้สิ่งนี้เพื่ออ่าน ค้นหา หรืออัปเดตตำแหน่งแคบ ๆ โดยไม่ต้องสร้าง parser แยกเองสำหรับแต่ละไฟล์

CLI สะท้อน verb สาธารณะของซับสเตรต:

- `resolve` เป็นแบบเป็นรูปธรรมและตรงกันรายการเดียว
- `find` เป็น verb แบบหลายรายการสำหรับ wildcard, union, predicate และการขยายตามตำแหน่ง
- `set` รับเฉพาะพาธที่เป็นรูปธรรมหรือเครื่องหมายการแทรกเท่านั้น; รูปแบบ wildcard จะถูกปฏิเสธก่อนเขียน

`path` จัดเตรียมโดย Plugin เสริมแบบ bundled ชื่อ `oc-path` เปิดใช้งานก่อนใช้ครั้งแรก:

```bash
openclaw plugins enable oc-path
```

## เหตุผลที่ควรใช้

สถานะของ OpenClaw กระจายอยู่ใน markdown ที่มนุษย์แก้ไข, config JSONC ที่มีคอมเมนต์, log JSONL แบบ append-only และไฟล์ workflow/spec แบบ YAML สคริปต์ shell, hook และ agent มักต้องการค่าเล็ก ๆ เพียงค่าเดียวจากไฟล์เหล่านั้น: key ใน frontmatter, การตั้งค่า Plugin, field ในระเบียน log, step ใน YAML หรือรายการ bullet ใต้ section ที่มีชื่อ

`openclaw path` ให้ที่อยู่ที่เสถียรแก่ caller เหล่านั้น แทนที่จะใช้ grep, regex หรือ parser เฉพาะกิจสำหรับไฟล์แต่ละชนิด พาธ `oc://` เดียวกันสามารถ validate, resolve, search, dry-run และเขียนจาก terminal ได้ ซึ่งทำให้ automation แบบแคบตรวจทานง่ายขึ้นและ replay ได้ปลอดภัยขึ้น มีประโยชน์เป็นพิเศษเมื่อคุณต้องการอัปเดต leaf หนึ่งรายการโดยรักษาคอมเมนต์ line ending และ formatting รอบข้างของส่วนที่เหลือในไฟล์ไว้

ใช้เมื่อสิ่งที่คุณต้องการมีที่อยู่เชิงตรรกะ แต่รูปร่างไฟล์จริงแตกต่างกัน:

- hook ต้องการอ่านการตั้งค่าหนึ่งรายการจาก JSONC ที่มีคอมเมนต์ โดยไม่สูญเสียคอมเมนต์เมื่อเขียนค่ากลับ
- สคริปต์บำรุงรักษาต้องการค้นหา field ของ event ที่ตรงกันทั้งหมดใน log JSONL โดยไม่โหลด log ทั้งหมดเข้า parser แบบกำหนดเอง
- ส่วนขยาย editor ต้องการกระโดดไปยัง section หรือรายการ bullet ใน markdown ด้วย slug แล้ว render บรรทัดจริงที่ resolve ได้
- agent ต้องการ dry-run การแก้ไข workspace ขนาดเล็กก่อนนำไปใช้ โดยให้เห็น byte ที่เปลี่ยนใน review

คุณอาจไม่จำเป็นต้องใช้ `openclaw path` สำหรับการแก้ไขทั้งไฟล์ตามปกติ การ migrate config ที่ซับซ้อน หรือการเขียนเฉพาะ memory สิ่งเหล่านั้นควรใช้คำสั่งหรือ Plugin ของ owner `path` มีไว้สำหรับการดำเนินการไฟล์ขนาดเล็กที่ระบุที่อยู่ได้ ซึ่งคำสั่ง terminal ที่ทำซ้ำได้ชัดเจนกว่า parser เฉพาะกิจอีกตัวหนึ่ง

## วิธีใช้งาน

อ่านค่าหนึ่งรายการจากไฟล์ config ที่มนุษย์แก้ไข:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

ดูตัวอย่างการเขียนโดยไม่แตะ disk:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

ค้นหาระเบียนที่ตรงกันใน log JSONL แบบ append-only:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

ระบุที่อยู่ของคำสั่งใน markdown ด้วย section และ item แทนการใช้หมายเลขบรรทัด:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

validate พาธใน CI หรือสคริปต์ preflight ก่อนที่สคริปต์จะอ่านหรือเขียน:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

คำสั่งเหล่านี้ตั้งใจให้นำไปใส่ในสคริปต์ shell ได้โดยตรง ใช้ `--json` เมื่อ caller ต้องการ output แบบมีโครงสร้าง และ `--human` เมื่อผู้ใช้กำลังตรวจสอบผลลัพธ์

## วิธีทำงาน

`openclaw path` ทำสี่อย่าง:

1. parse ที่อยู่ `oc://` เป็น slot: file, section, item, field และ session แบบ optional
2. เลือก adapter ตามชนิดไฟล์จากนามสกุลเป้าหมาย (`.md`, `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` และ alias ที่เกี่ยวข้อง)
3. resolve slot เทียบกับ AST ของชนิดไฟล์นั้น: heading/item ใน markdown, key ของ object/index ของ array ใน JSONC, ระเบียนแต่ละบรรทัดใน JSONL หรือ node แบบ map/sequence ใน YAML
4. สำหรับ `set` จะปล่อย byte ที่แก้ไขผ่าน adapter เดียวกัน เพื่อให้ส่วนของไฟล์ที่ไม่ได้แตะยังคงคอมเมนต์ line ending และ formatting ใกล้เคียงไว้ตามที่ชนิดไฟล์รองรับ

`resolve` และ `set` ต้องมีเป้าหมายเป็นรูปธรรมหนึ่งรายการ `find` เป็น verb สำหรับสำรวจ: จะขยาย wildcard, union, predicate และ ordinal เป็น match รูปธรรมที่คุณตรวจสอบได้ก่อนเลือกหนึ่งรายการเพื่อเขียน

## คำสั่งย่อย

| คำสั่งย่อย              | วัตถุประสงค์                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | พิมพ์ match ที่เป็นรูปธรรม ณ พาธนั้น (หรือ "ไม่พบ")                       |
| `find <pattern>`        | แจกแจง match สำหรับพาธแบบ wildcard / union / predicate                   |
| `set <oc-path> <value>` | เขียน leaf หรือเป้าหมายการแทรก ณ พาธที่เป็นรูปธรรม รองรับ `--dry-run`   |
| `validate <oc-path>`    | parse เท่านั้น; พิมพ์การแยกโครงสร้าง (file / section / item / field)      |
| `emit <file>`           | round-trip ไฟล์ผ่าน `parseXxx` + `emitXxx` (diagnostic ความตรงระดับ byte) |

## flag ส่วนกลาง

| flag            | วัตถุประสงค์                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | resolve slot ของไฟล์เทียบกับ directory นี้ (ค่าเริ่มต้น: `process.cwd()`) |
| `--file <path>` | override พาธที่ resolve แล้วของ slot ไฟล์ (การเข้าถึงแบบ absolute)                |
| `--json`        | บังคับ output เป็น JSON (ค่าเริ่มต้นเมื่อ stdout ไม่ใช่ TTY)                    |
| `--human`       | บังคับ output สำหรับมนุษย์ (ค่าเริ่มต้นเมื่อ stdout เป็น TTY)                       |
| `--dry-run`     | (เฉพาะบน `set`) พิมพ์ byte ที่จะถูกเขียนโดยไม่เขียนจริง   |
| `--diff`        | (ร่วมกับ `set --dry-run`) พิมพ์ unified diff แทน byte ทั้งหมด   |

## syntax ของ `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

กฎของ slot: `field` ต้องมี `item` และ `item` ต้องมี `section` ครอบคลุมทั้งสี่ slot:

- **segment ที่ quote ไว้** — `"a/b.c"` จะคงอยู่ผ่านตัวคั่น `/` และ `.`
  เนื้อหาเป็น byte-literal; ไม่อนุญาตให้มี `"` และ `\` ภายใน quote
  slot ของไฟล์ก็รับรู้ quote เช่นกัน: `oc://"skills/email-drafter"/Tools/$last`
  จะถือว่า `skills/email-drafter` เป็นพาธไฟล์เดียว
- **predicate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]` การทำงานเชิงตัวเลขต้องให้ทั้งสองฝั่ง coerce เป็นจำนวน finite ได้
- **union** — `{a,b,c}` ตรงกับทางเลือกใดก็ได้
- **wildcard** — `*` (sub-segment เดียว) และ `**` (ศูนย์หรือมากกว่า,
  recursive) `find` รับสิ่งเหล่านี้; `resolve` และ `set` ปฏิเสธเพราะคลุมเครือ
- **ตำแหน่ง** — `$first` / `$last` resolve เป็น index หรือ key ที่ประกาศตัวแรก / ตัวสุดท้าย
- **ordinal** — `#N` สำหรับ match ลำดับที่ N ตามลำดับเอกสาร
- **เครื่องหมายการแทรก** — `+`, `+key`, `+nnn` สำหรับการแทรกแบบ keyed / indexed
  (ใช้กับ `set`)
- **ขอบเขต session** — `?session=cron-daily` เป็นต้น เป็นอิสระจากการซ้อนของ slot
  ค่า session เป็นแบบ raw ไม่ percent-decode; ต้องไม่มี control character หรือ delimiter ของ query ที่สงวนไว้ (`?`, `&`, `%`)

อักขระสงวน (`?`, `&`, `%`) ที่อยู่นอก segment แบบ quoted, predicate หรือ union จะถูกปฏิเสธ control character (U+0000-U+001F, U+007F) จะถูกปฏิเสธทุกที่ รวมถึงค่า query `session`

รับประกันว่า `formatOcPath(parseOcPath(path)) === path` สำหรับพาธ canonical พารามิเตอร์ query ที่ไม่เป็น canonical จะถูกละเว้น ยกเว้นค่า `session=` ที่ไม่ว่างค่าแรก

## การระบุที่อยู่ตามชนิดไฟล์

| ชนิด              | โมเดลการระบุที่อยู่                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | section H2 ตาม slug, รายการ bullet ตาม slug หรือ `#N`, frontmatter ผ่าน `[frontmatter]`                 |
| JSONC/JSON        | key ของ object และ index ของ array; จุดจะแยก sub-segment ที่ซ้อนกัน เว้นแต่ quote ไว้                        |
| JSONL             | ที่อยู่ระดับบรรทัดบนสุด (`L1`, `L2`, `$first`, `$last`) จากนั้น descent แบบ JSONC ภายในบรรทัด |
| YAML/YML/.lobster | key ของ map และ index ของ sequence; comment และ flow style จัดการโดย API เอกสาร YAML        |

`resolve` คืน match แบบมีโครงสร้าง: `root`, `node`, `leaf` หรือ
`insertion-point` พร้อมหมายเลขบรรทัดแบบเริ่มที่ 1 ค่า leaf จะแสดงเป็น text พร้อม `leafType` เพื่อให้ผู้เขียน Plugin render preview ได้โดยไม่ต้องพึ่งพารูปร่าง AST เฉพาะชนิดไฟล์

## contract การ mutate

`set` เขียนเป้าหมายรูปธรรมหนึ่งรายการ:

- ค่า frontmatter ใน Markdown และ field ของ item แบบ `- key: value` เป็น leaf แบบ string
  การแทรกใน Markdown จะ append section, key ของ frontmatter หรือ item ของ section และ render รูปร่าง markdown แบบ canonical สำหรับไฟล์ที่เปลี่ยน
- การเขียน leaf ใน JSONC จะ coerce ค่า string เป็นชนิด leaf เดิม
  (`string`, `number` แบบ finite, `true`/`false` หรือ `null`) ใช้ `--value-json`
  เมื่อการแทนที่ leaf ใน JSONC/JSON/JSONL ควร parse `<value>` เป็น JSON และ
  อาจเปลี่ยนรูปร่าง เช่น การแทนที่ shorthand SecretRef แบบ string ด้วย
  object การแทรก object และ array ใน JSONC จะ parse `<value>` เป็น JSON และใช้
  path การแก้ไขของ `jsonc-parser` สำหรับการเขียน leaf ตามปกติ โดยรักษาคอมเมนต์และ
  formatting ใกล้เคียงไว้
- การเขียน leaf ใน JSONL จะ coerce เหมือน JSONC ภายในบรรทัด การแทนที่ทั้งบรรทัดและ
  append จะ parse `<value>` เป็น JSON JSONL ที่ render แล้วจะรักษา convention line-ending
  หลักของไฟล์แบบ LF/CRLF
- การเขียน leaf ใน YAML จะ coerce เป็นชนิด scalar เดิม (`string`, `number` แบบ finite,
  `true`/`false` หรือ `null`) การแทรกใน YAML ใช้ API เอกสารของ package
  `yaml` ที่ bundled มาสำหรับการอัปเดต map/sequence เอกสาร YAML ที่ malformed
  และมี parser error จะถูกปฏิเสธก่อน mutate ด้วย `parse-error`

ใช้ `--dry-run` ก่อนการเขียนที่ผู้ใช้มองเห็นได้เมื่อ byte ที่แน่นอนมีความสำคัญ ซับสเตรตรักษา output ให้เหมือนเดิมระดับ byte สำหรับ round-trip แบบ parse/emit แต่การ mutate อาจ canonicalize บริเวณที่แก้ไขหรือทั้งไฟล์ได้ ขึ้นอยู่กับชนิด
เพิ่ม `--diff` เมื่อคุณต้องการ preview เป็น patch ก่อน/หลังแบบโฟกัส แทนไฟล์ที่ render ทั้งหมด

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

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

ตัวอย่าง grammar เพิ่มเติม:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

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

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

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

คำสั่งทั้งห้าคำสั่งเดียวกันใช้ได้ข้ามชนิดไฟล์; แบบแผนการระบุที่อยู่จะเลือกการทำงานตามนามสกุลไฟล์ ตัวอย่างด้านล่างใช้ fixture จากคำอธิบาย PR

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

predicate `[frontmatter]` ระบุถึงบล็อก YAML frontmatter; `tools` จับคู่หัวข้อ `## Tools` ผ่าน slug และ leaf ของรายการจะคงรูปแบบ slug ของตัวเองไว้ แม้เมื่อซอร์สใช้ underscore (`send_email` → `send-email`)

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

การแก้ไข JSONC ผ่าน `jsonc-parser` ดังนั้นคอมเมนต์และช่องว่างจะยังคงอยู่หลัง `set` ให้รันด้วย `--dry-run` ก่อนเพื่อตรวจสอบไบต์ก่อนยืนยันการเปลี่ยนแปลง

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

แต่ละบรรทัดคือหนึ่ง record ระบุที่อยู่ด้วย predicate (`[event=action]`) เมื่อคุณไม่ทราบหมายเลขบรรทัด หรือใช้เซกเมนต์มาตรฐาน `LN` เมื่อทราบแล้ว

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML ใช้ API `Document` ของแพ็กเกจ `yaml` แทน parser ที่เขียนเอง ดังนั้นการ parse/emit ไปกลับตามปกติจะรักษาคอมเมนต์และรูปแบบการเขียนไว้ ขณะที่พาธที่ resolve แล้วใช้โมเดล map-key / sequence-index เดียวกับ JSONC adapter เดียวกันรองรับไฟล์ `.yaml`, `.yml` และ `.lobster`

## ข้อมูลอ้างอิงคำสั่งย่อย

### `resolve <oc-path>`

อ่าน leaf หรือ node รายการเดียว wildcard จะถูกปฏิเสธ — ใช้ `find` สำหรับกรณีนั้น ออกด้วย `0` เมื่อพบรายการที่ตรงกัน, `1` เมื่อไม่พบแบบไม่มีข้อผิดพลาด, `2` เมื่อเกิดข้อผิดพลาดในการ parse หรือ pattern ถูกปฏิเสธ

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

แจกแจงทุกรายการที่ตรงกับ pattern แบบ wildcard / predicate / union ออกด้วย `0` เมื่อมีอย่างน้อยหนึ่งรายการที่ตรงกัน, `1` เมื่อไม่มีเลย wildcard ในช่องไฟล์จะถูกปฏิเสธด้วย `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — ให้ส่งไฟล์ที่เจาะจง (การ glob หลายไฟล์เป็นฟีเจอร์ถัดไป)

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

เขียน leaf ใช้คู่กับ `--dry-run` เพื่อดูตัวอย่างไบต์ที่จะถูกเขียนโดยไม่แตะไฟล์ เพิ่ม `--diff` เพื่อดูตัวอย่าง unified diff ออกด้วย `0` เมื่อเขียนสำเร็จ, `1` หาก substrate ปฏิเสธ (เช่น เจอ sentinel guard), `2` เมื่อเกิดข้อผิดพลาดในการ parse

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

เครื่องหมายแทรก `+key` จะสร้าง child ชื่อดังกล่าวหากยังไม่มีอยู่; `+nnn` และ `+` แบบเดี่ยวใช้สำหรับการแทรกตามดัชนีและการต่อท้ายตามลำดับ

### `validate <oc-path>`

ตรวจเฉพาะการ parse ไม่เข้าถึงระบบไฟล์ มีประโยชน์เมื่อคุณต้องการยืนยันว่า template path อยู่ในรูปแบบที่ถูกต้องก่อนแทนค่าตัวแปร หรือเมื่อคุณต้องการดูการแยกโครงสร้างเพื่อดีบัก:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

ออกด้วย `0` เมื่อถูกต้อง, `1` เมื่อไม่ถูกต้อง (พร้อม `code` และ `message` แบบมีโครงสร้าง), `2` เมื่อเกิดข้อผิดพลาดของอาร์กิวเมนต์

### `emit <file>`

ส่งไฟล์ผ่าน parser และ emitter ตามชนิดไฟล์แบบไปกลับ เอาต์พุตควรเหมือนอินพุตทุกไบต์ในไฟล์ที่สมบูรณ์ — ความแตกต่างบ่งชี้ว่าเป็นบั๊กของ parser หรือเจอ sentinel มีประโยชน์สำหรับดีบักพฤติกรรมของ substrate กับอินพุตจริง

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## รหัสออก

| รหัส | ความหมาย                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | สำเร็จ (`resolve` / `find`: มีอย่างน้อยหนึ่งรายการที่ตรงกัน `set`: เขียนสำเร็จ) |
| `1`  | ไม่พบรายการที่ตรงกัน หรือ `set` ถูก substrate ปฏิเสธ (ไม่มีข้อผิดพลาดระดับระบบ) |
| `2`  | ข้อผิดพลาดของอาร์กิวเมนต์หรือการ parse                                      |

## โหมดเอาต์พุต

`openclaw path` รับรู้ TTY: เอาต์พุตแบบอ่านได้สำหรับมนุษย์บน terminal, JSON เมื่อ stdout ถูก pipe หรือ redirect `--json` และ `--human` จะ override การตรวจจับอัตโนมัติ

## หมายเหตุ

- `set` เขียนไบต์ผ่านเส้นทาง emit ของ substrate ซึ่งใช้ redaction-sentinel guard โดยอัตโนมัติ leaf ที่มี `__OPENCLAW_REDACTED__` (ตรงตัวหรือเป็น substring) จะถูกปฏิเสธ ณ เวลาเขียน
- การ parse JSONC และการแก้ไข leaf ใช้การพึ่งพา `jsonc-parser` ภายใน Plugin ดังนั้นคอมเมนต์และการจัดรูปแบบจะถูกรักษาไว้ในการเขียน leaf ตามปกติ แทนที่จะผ่าน parser/re-render path ที่เขียนเอง
- `path` ไม่รู้จัก LKG หากไฟล์ถูกติดตามด้วย LKG การเรียก observe ครั้งถัดไปจะตัดสินใจว่าจะ promote / recover หรือไม่ `set --batch` สำหรับการทำ multi-set แบบ atomic ผ่าน lifecycle promote/recover ของ LKG ถูกวางแผนไว้ควบคู่กับ substrate สำหรับ LKG-recovery

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
