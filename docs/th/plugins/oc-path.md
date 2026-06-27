---
read_when:
    - คุณต้องการตรวจสอบหรือแก้ไขโหนดปลายทางรายการเดียวภายในไฟล์เวิร์กสเปซจากเทอร์มินัล
    - คุณกำลังเขียนสคริปต์กับสถานะของเวิร์กสเปซ และต้องการรูปแบบการอ้างอิงที่เสถียรและไม่ขึ้นกับชนิด
    - คุณกำลังตัดสินใจว่าจะเปิดใช้งาน Plugin `oc-path` แบบไม่บังคับบน Gateway ที่โฮสต์เองหรือไม่
summary: 'Plugin `oc-path` ที่รวมมาด้วย: มาพร้อม CLI `openclaw path` สำหรับรูปแบบการระบุที่อยู่ไฟล์ในเวิร์กสเปซ `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T17:58:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` ที่บันเดิลมาด้วยเพิ่ม CLI [`openclaw path`](/th/cli/path) สำหรับ
รูปแบบการระบุที่อยู่ไฟล์ในเวิร์กสเปซ `oc://` โดยมาพร้อมกับ repo ของ OpenClaw ภายใต้
`extensions/oc-path/` แต่เป็นแบบเลือกใช้เอง — การติดตั้ง/บิลด์จะปล่อยให้ปิดอยู่จนกว่าคุณจะ
เปิดใช้งาน

ที่อยู่ `oc://` ชี้ไปยัง leaf เดียว (หรือชุด leaf แบบไวลด์การ์ด) ภายใน
ไฟล์เวิร์กสเปซ วันนี้ Plugin เข้าใจไฟล์สี่ชนิด:

- **markdown** (`.md`, `.mdx`): frontmatter, ส่วน, รายการ, ฟิลด์
- **jsonc** (`.jsonc`, `.json5`, `.json`): คงคอมเมนต์และการจัดรูปแบบไว้
- **jsonl** (`.jsonl`, `.ndjson`): ระเบียนแบบแยกตามบรรทัด
- **yaml** (`.yaml`, `.yml`, `.lobster`): โหนด map/sequence/scalar ผ่าน
  API เอกสาร YAML

ผู้โฮสต์เองและส่วนขยายของเอดิเตอร์ใช้ CLI เพื่ออ่านหรือเขียน leaf เดียว
โดยไม่ต้องเขียนสคริปต์กับ SDK โดยตรง; เอเจนต์และฮุกถือว่าสิ่งนี้เป็น
ฐานรองรับที่กำหนดผลลัพธ์ได้แน่นอน เพื่อให้การ round-trip ที่รักษา byte-fidelity และ
ตัวป้องกัน redaction sentinel ใช้ได้สม่ำเสมอในทุกชนิดไฟล์

## เหตุผลที่ควรเปิดใช้งาน

เปิดใช้งาน `oc-path` เมื่อคุณต้องการให้สคริปต์ ฮุก หรือเครื่องมือเอเจนต์ในเครื่องชี้ไปยัง
ชิ้นส่วนสถานะของเวิร์กสเปซที่แม่นยำ โดยไม่ต้องสร้าง parser สำหรับไฟล์แต่ละรูปแบบ
ที่อยู่ `oc://` เดียวสามารถระบุคีย์ frontmatter ของ markdown, รายการในส่วน,
leaf ของคอนฟิก JSONC, ฟิลด์เหตุการณ์ JSONL หรือขั้นตอน workflow ของ YAML ได้

สิ่งนี้สำคัญกับ workflow ของผู้ดูแลที่การเปลี่ยนแปลงควรเล็ก ตรวจสอบได้
และทำซ้ำได้: ตรวจค่าหนึ่งค่า, หา records ที่ตรงกัน, ทดลองเขียนแบบ dry-run,
จากนั้นใช้เฉพาะ leaf นั้นโดยปล่อยคอมเมนต์ line endings และการจัดรูปแบบใกล้เคียงไว้ตามเดิม
การคงสิ่งนี้เป็น Plugin แบบเลือกใช้เองทำให้ผู้ใช้ขั้นสูงได้ฐานรองรับการระบุที่อยู่
โดยไม่ใส่ dependency ของ parser หรือพื้นผิว CLI เข้าไปใน core สำหรับการติดตั้งที่ไม่ต้องใช้

เหตุผลทั่วไปในการเปิดใช้งาน:

- **ระบบอัตโนมัติในเครื่อง**: shell scripts สามารถ resolve หรืออัปเดตค่าเดียวในเวิร์กสเปซ
  ด้วย `openclaw path … --json` แทนการพกโค้ด parser แยกสำหรับ markdown, JSONC,
  JSONL และ YAML
- **การแก้ไขที่เอเจนต์เห็นได้**: เอเจนต์สามารถแสดง diff แบบ dry-run สำหรับ leaf ที่ระบุที่อยู่ไว้
  ก่อนเขียน ซึ่งตรวจทานได้ง่ายกว่าการ rewrite ไฟล์แบบอิสระ
- **การผสานกับเอดิเตอร์**: เอดิเตอร์สามารถ map `oc://AGENTS.md/tools/gh` ไปยัง
  โหนด markdown และเลขบรรทัดที่ถูกต้อง โดยไม่ต้องเดาจากข้อความหัวข้อ
- **การวินิจฉัย**: `emit` ทำ round-trip ไฟล์ผ่าน parser และ emitter ดังนั้น
  คุณจึงตรวจได้ว่าไฟล์ชนิดหนึ่ง byte-stable หรือไม่ ก่อนพึ่งพาการแก้ไขอัตโนมัติ

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
ยังคงเป็นเจ้าของการเขียนหน่วยความจำ คำสั่งคอนฟิกยังคงเป็นเจ้าของการจัดการคอนฟิกเต็มรูปแบบ
และตรรกะ LKG ยังคงเป็นเจ้าของการ restore/promotion `oc-path` เป็นเลเยอร์แคบสำหรับ
การระบุที่อยู่และการดำเนินการไฟล์ที่รักษา byte ซึ่งเครื่องมือระดับสูงกว่าเหล่านั้น
สามารถสร้างต่อยอดได้

## ที่ที่มันทำงาน

Plugin ทำงาน **ใน process ภายใน CLI `openclaw`** บนโฮสต์ที่คุณ
เรียกใช้คำสั่ง ไม่ต้องมี Gateway ที่กำลังทำงาน และไม่เปิด
network sockets ใด ๆ — ทุก verb เป็นการ transform แบบบริสุทธิ์เหนือไฟล์ที่คุณชี้ไป

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

`onStartup: false` กัน Plugin ออกจาก hot path ของ Gateway `onCommands:
["path"]` บอก CLI ให้โหลด Plugin แบบ lazy ครั้งแรกที่คุณรัน
`openclaw path …` ดังนั้นการติดตั้งที่ไม่เคยใช้ verb นี้จะไม่มีต้นทุน

## เปิดใช้งาน

```bash
openclaw plugins enable oc-path
```

รีสตาร์ท Gateway (ถ้าคุณรันอยู่) เพื่อให้ snapshot ของ manifest รับสถานะใหม่
การเรียกใช้ `openclaw path` เปล่า ๆ ทำงานได้ทันทีบนโฮสต์เดียวกัน —
CLI จะโหลด Plugin เมื่อต้องการ

ปิดใช้งานด้วย:

```bash
openclaw plugins disable oc-path
```

## Dependencies

dependency ของ parser ทั้งหมดอยู่ใน Plugin เท่านั้น — การเปิดใช้งาน `oc-path` ไม่ได้ดึง
แพ็กเกจใหม่เข้าไปใน runtime ของ core:

| Dependency     | วัตถุประสงค์                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | การเชื่อม subcommand สำหรับ `resolve`, `find`, `set`, `validate`, `emit` |
| `jsonc-parser` | parse JSONC + แก้ไข leaf โดยคงคอมเมนต์และ trailing commas ไว้       |
| `markdown-it`  | tokenization ของ Markdown สำหรับโมเดล section / item / field            |
| `yaml`         | parse / emit / edit `Document` ของ YAML โดยคงคอมเมนต์และ flow style ไว้ |

JSONL ยังคงเขียนเอง — การ parse แบบแยกตามบรรทัดเรียบง่ายกว่า
dependency ใด ๆ และการ parse JSONC ต่อบรรทัดก็ผ่าน `jsonc-parser` อยู่แล้ว

## สิ่งที่มีให้

| พื้นผิว                        | มีให้โดย                                             |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| parser / formatter ของ `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| parse / emit / edit ต่อชนิดไฟล์ | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| resolve / find / set แบบสากล | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| ตัวป้องกัน redaction-sentinel       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI เป็นพื้นผิวสาธารณะเดียวในวันนี้ verb ของฐานรองรับเป็นส่วนตัวของ
Plugin; consumers ใช้ CLI (หรือสร้าง Plugin ของตนเองกับ SDK)

## ความสัมพันธ์กับ Plugin อื่น

- **`memory-*`**: การเขียนหน่วยความจำผ่าน Plugin หน่วยความจำ ไม่ใช่ `oc-path`
  `oc-path` เป็นฐานรองรับไฟล์ทั่วไป; Plugin หน่วยความจำวาง semantics ของตัวเอง
  ไว้ด้านบน
- **LKG**: `path` ไม่รู้เกี่ยวกับการ restore คอนฟิก Last-Known-Good ถ้า
  ไฟล์ถูกติดตามโดย LKG การเรียก `observe` ถัดไปจะตัดสินใจว่าจะ promote หรือ
  recover; มีแผนสำหรับ `set --batch` เพื่อ multi-set แบบ atomic ผ่าน lifecycle
  promote/recover ของ LKG ควบคู่กับฐานรองรับ LKG-recovery

## ความปลอดภัย

`set` เขียน raw bytes ผ่าน emit path ของฐานรองรับ ซึ่งใช้
ตัวป้องกัน redaction-sentinel โดยอัตโนมัติ leaf ที่พก
`__OPENCLAW_REDACTED__` (แบบตรงตัวหรือเป็น substring) จะถูกปฏิเสธตอนเขียน
ด้วย `OC_EMIT_SENTINEL` CLI ยังล้าง sentinel ตรงตัวจาก output แบบ human หรือ JSON
ใด ๆ ที่พิมพ์ออกมา โดยแทนที่ด้วย `[REDACTED]` เพื่อให้การจับภาพ terminal
และ pipelines ไม่รั่ว marker

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI `openclaw path`](/th/cli/path)
- [จัดการ Plugin](/th/plugins/manage-plugins)
- [การสร้าง Plugin](/th/plugins/building-plugins)
