---
read_when:
    - คุณต้องการตรวจสอบหรือแก้ไขโหนดปลายทางเดียวภายในไฟล์ในเวิร์กสเปซจากเทอร์มินัล
    - คุณกำลังเขียนสคริปต์กับสถานะของเวิร์กสเปซ และต้องการรูปแบบการระบุที่อยู่ที่เสถียรและไม่ขึ้นกับชนิด
    - คุณกำลังตัดสินใจว่าจะเปิดใช้งาน Plugin `oc-path` แบบไม่บังคับบน Gateway ที่โฮสต์เองหรือไม่
summary: 'Plugin `oc-path` ที่รวมมาให้: มาพร้อมกับ CLI `openclaw path` สำหรับรูปแบบการอ้างอิงตำแหน่งไฟล์ในพื้นที่ทำงานของ `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-05-10T19:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` ที่มาพร้อมชุดเพิ่ม CLI [`openclaw path`](/th/cli/path) สำหรับ
รูปแบบการระบุที่อยู่ไฟล์ในเวิร์กสเปซแบบ `oc://` มันอยู่ใน repo ของ OpenClaw ภายใต้
`extensions/oc-path/` แต่เป็นแบบเลือกเปิดใช้ — การติดตั้ง/บิลด์จะปล่อยให้มันไม่ทำงานจนกว่าคุณจะ
เปิดใช้มัน

ที่อยู่ `oc://` ชี้ไปยังใบเดียว (หรือชุดใบแบบไวลด์การ์ด) ภายใน
ไฟล์เวิร์กสเปซ ปัจจุบัน Plugin เข้าใจไฟล์สามชนิด:

- **markdown** (`.md`, `.mdx`): frontmatter, sections, items, fields
- **jsonc** (`.jsonc`, `.json5`, `.json`): คงคอมเมนต์และการจัดรูปแบบไว้
- **jsonl** (`.jsonl`, `.ndjson`): เรคคอร์ดแบบแยกตามบรรทัด

ผู้โฮสต์เองและส่วนขยายของเอดิเตอร์ใช้ CLI เพื่ออ่านหรือเขียนใบเดียว
โดยไม่ต้องเขียนสคริปต์กับ SDK โดยตรง; เอเจนต์และ hooks ปฏิบัติกับมันเป็น
ฐานรองรับแบบกำหนดแน่นอน เพื่อให้การ round-trip ที่คงไบต์เหมือนเดิมและ guard ของ
sentinel การปกปิดใช้ได้อย่างสม่ำเสมอกับทุกชนิด

## ทำไมต้องเปิดใช้

เปิดใช้ `oc-path` เมื่อคุณต้องการให้สคริปต์, hooks, หรือเครื่องมือเอเจนต์ภายในเครื่องชี้
ไปยังชิ้นส่วนสถานะเวิร์กสเปซที่แม่นยำ โดยไม่ต้องสร้าง parser สำหรับแต่ละรูปแบบไฟล์
ที่อยู่ `oc://` เดียวสามารถระบุคีย์ frontmatter ของ markdown, รายการใน section,
ใบคอนฟิก JSONC, หรือฟิลด์เหตุการณ์ JSONL ได้

สิ่งนี้สำคัญสำหรับเวิร์กโฟลว์ผู้ดูแลที่การเปลี่ยนแปลงควรเล็ก,
ตรวจสอบได้, และทำซ้ำได้: ตรวจดูค่าหนึ่ง, หาเรคคอร์ดที่ตรงกัน, dry-run การ
เขียน, จากนั้นนำไปใช้เฉพาะใบนั้น โดยปล่อยคอมเมนต์, line endings, และ
การจัดรูปแบบใกล้เคียงไว้เหมือนเดิม การคงสิ่งนี้เป็น Plugin แบบเลือกเปิดใช้ทำให้ผู้ใช้ระดับสูงได้
ฐานรองรับการระบุที่อยู่ โดยไม่ใส่ dependency ของ parser หรือ surface ของ CLI เข้าไปใน
core สำหรับการติดตั้งที่ไม่เคยต้องใช้มัน

เหตุผลทั่วไปในการเปิดใช้:

- **ระบบอัตโนมัติภายในเครื่อง**: เชลล์สคริปต์สามารถ resolve หรืออัปเดตค่าเวิร์กสเปซหนึ่งค่า
  ด้วย `openclaw path … --json` แทนการพกโค้ดแยกสำหรับ parse markdown, JSONC,
  และ JSONL
- **การแก้ไขที่เอเจนต์มองเห็นได้**: เอเจนต์สามารถแสดง diff แบบ dry-run สำหรับใบที่ระบุที่อยู่ไว้หนึ่งใบ
  ก่อนเขียน ซึ่งตรวจทานง่ายกว่าการเขียนไฟล์ใหม่แบบอิสระ
- **การผสานกับเอดิเตอร์**: เอดิเตอร์สามารถแมป `oc://AGENTS.md/tools/gh` ไปยัง
  โหนด markdown และหมายเลขบรรทัดที่แม่นยำ โดยไม่ต้องเดาจากข้อความหัวข้อ
- **การวินิจฉัย**: `emit` round-trip ไฟล์ผ่าน parser และ emitter เพื่อให้
  คุณตรวจได้ว่าไฟล์ชนิดหนึ่งคงไบต์เดิมได้หรือไม่ ก่อนพึ่งพาการแก้ไขอัตโนมัติ

ตัวอย่างที่เป็นรูปธรรม:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin นี้ตั้งใจไม่เป็นเจ้าของ semantics ระดับสูงกว่า Plugin หน่วยความจำ
ยังคงเป็นเจ้าของการเขียนหน่วยความจำ, คำสั่งคอนฟิกยังคงเป็นเจ้าของการจัดการคอนฟิกเต็มรูปแบบ,
และตรรกะ LKG ยังคงเป็นเจ้าของการกู้คืน/การ promote `oc-path` คือชั้นการระบุที่อยู่แบบแคบ
และการดำเนินการกับไฟล์ที่รักษาไบต์ ซึ่งเครื่องมือระดับสูงกว่าเหล่านั้น
สามารถสร้างต่อได้

## มันทำงานที่ไหน

Plugin ทำงาน **ในโปรเซสภายใน CLI `openclaw`** บนโฮสต์ที่คุณ
เรียกใช้คำสั่ง มันไม่ต้องมี Gateway ที่กำลังทำงานอยู่ และไม่เปิด
socket เครือข่ายใด ๆ — ทุก verb เป็นการแปลงแบบบริสุทธิ์บนไฟล์ที่คุณชี้ไป

metadata ของ Plugin อยู่ใน `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` ทำให้ Plugin ไม่อยู่ใน hot path ของ Gateway `onCommands:
["path"]` บอก CLI ให้โหลด Plugin แบบ lazy ครั้งแรกที่คุณรัน
`openclaw path …` ดังนั้นการติดตั้งที่ไม่เคยใช้ verb นี้จึงไม่มีต้นทุน

## เปิดใช้

```bash
openclaw plugins enable oc-path
```

รีสตาร์ต Gateway (ถ้าคุณรันอยู่) เพื่อให้ snapshot ของ manifest รับสถานะใหม่
การเรียก `openclaw path` ตรง ๆ ทำงานได้ทันทีบนโฮสต์เดียวกัน —
CLI โหลด Plugin เมื่อต้องใช้

ปิดใช้ด้วย:

```bash
openclaw plugins disable oc-path
```

## Dependencies

dependency ของ parser ทั้งหมดอยู่ภายใน Plugin — การเปิดใช้ `oc-path` ไม่ดึง
แพ็กเกจใหม่เข้าไปใน runtime ของ core:

| Dependency     | วัตถุประสงค์                                                             |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | การเชื่อม subcommand สำหรับ `resolve`, `find`, `set`, `validate`, `emit` |
| `jsonc-parser` | parse JSONC + แก้ไขใบ โดยคงคอมเมนต์และ trailing commas ไว้    |
| `markdown-it`  | tokenization ของ Markdown สำหรับโมเดล section / item / field         |

JSONL ยังคงทำเอง — การ parse แบบแยกตามบรรทัดง่ายกว่า
dependency ใด ๆ และการ parse JSONC ต่อบรรทัดก็ผ่าน `jsonc-parser` อยู่แล้ว

## สิ่งที่มีให้

| Surface                        | จัดหาโดย                                             |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| parser / formatter ของ `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| parse / emit / edit แยกตามชนิด   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| resolve / find / set สากล | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| guard ของ redaction-sentinel       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI คือ surface สาธารณะเดียวในปัจจุบัน verb ของฐานรองรับเป็น private ต่อ
Plugin; ผู้บริโภคใช้ CLI (หรือสร้าง Plugin ของตนเองกับ SDK)

## ความสัมพันธ์กับ Plugin อื่น

- **`memory-*`**: การเขียนหน่วยความจำผ่าน Plugin หน่วยความจำ ไม่ใช่ `oc-path`
  `oc-path` เป็นฐานรองรับไฟล์แบบทั่วไป; Plugin หน่วยความจำวาง
  semantics ของตนเองทับไว้
- **LKG**: `path` ไม่รู้เกี่ยวกับการกู้คืนคอนฟิก Last-Known-Good หาก
  ไฟล์ถูกติดตามโดย LKG การเรียก `observe` ครั้งถัดไปจะตัดสินใจว่าจะ promote หรือ
  กู้คืน; `set --batch` สำหรับ multi-set แบบ atomic ผ่าน lifecycle promote/recover ของ LKG
  มีแผนไว้ควบคู่กับฐานรองรับ LKG-recovery

## ความปลอดภัย

`set` เขียนไบต์ดิบผ่านเส้นทาง emit ของฐานรองรับ ซึ่งใช้
guard ของ redaction-sentinel โดยอัตโนมัติ ใบที่มี
`__OPENCLAW_REDACTED__` (ตรงตัวหรือเป็น substring) จะถูกปฏิเสธในเวลาเขียน
ด้วย `OC_EMIT_SENTINEL` CLI ยังลบ sentinel แบบ literal ออกจาก
เอาต์พุตสำหรับมนุษย์หรือ JSON ใด ๆ ที่พิมพ์ออกมา โดยแทนที่ด้วย `[REDACTED]` เพื่อให้การจับภาพเทอร์มินัล
และ pipelines ไม่รั่ว marker

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI `openclaw path`](/th/cli/path)
- [จัดการ Plugin](/th/plugins/manage-plugins)
- [การสร้าง Plugin](/th/plugins/building-plugins)
