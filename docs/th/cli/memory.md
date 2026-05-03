---
read_when:
    - คุณต้องการทำดัชนีหรือค้นหาหน่วยความจำเชิงความหมาย
    - คุณกำลังดีบักความพร้อมใช้งานของหน่วยความจำหรือการทำดัชนี
    - คุณต้องการเลื่อนระดับหน่วยความจำระยะสั้นที่เรียกคืนแล้วเป็น `MEMORY.md`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: หน่วยความจำ
x-i18n:
    generated_at: "2026-05-03T21:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหาหน่วยความจำเชิงความหมาย
จัดให้โดย Plugin หน่วยความจำที่ใช้งานอยู่ (ค่าเริ่มต้น: `memory-core`; ตั้งค่า `plugins.slots.memory = "none"` เพื่อปิดใช้งาน)

ที่เกี่ยวข้อง:

- แนวคิดเกี่ยวกับหน่วยความจำ: [หน่วยความจำ](/th/concepts/memory)
- วิกิหน่วยความจำ: [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
- CLI วิกิ: [wiki](/th/cli/wiki)
- Plugin: [Plugin](/th/tools/plugin)

## ตัวอย่าง

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## ตัวเลือก

`memory status` และ `memory index`:

- `--agent <id>`: จำกัดขอบเขตให้กับตัวแทนเดียว หากไม่มีตัวเลือกนี้ คำสั่งเหล่านี้จะรันสำหรับตัวแทนที่กำหนดค่าไว้แต่ละตัว หากไม่ได้กำหนดค่ารายการตัวแทนไว้ จะย้อนกลับไปใช้ตัวแทนเริ่มต้น
- `--verbose`: แสดงบันทึกโดยละเอียดระหว่างการตรวจสอบและการทำดัชนี

`memory status`:

- `--deep`: ตรวจสอบความพร้อมของที่เก็บเวกเตอร์ภายในเครื่อง ความพร้อมของผู้ให้บริการ embedding และความพร้อมของการค้นหาเวกเตอร์เชิงความหมาย `memory status` แบบปกติยังคงเร็วและจะไม่รันงาน embedding สดหรือการค้นหาผู้ให้บริการ สถานะที่เก็บเวกเตอร์หรือเวกเตอร์เชิงความหมายที่ไม่ทราบหมายความว่าไม่ได้ตรวจสอบในคำสั่งนั้น QMD lexical `searchMode: "search"` จะข้ามการตรวจสอบเวกเตอร์เชิงความหมายและการบำรุงรักษา embedding แม้ใช้ `--deep`
- `--index`: รันการทำดัชนีใหม่หากที่เก็บสกปรก (สื่อเป็นนัยถึง `--deep`)
- `--fix`: ซ่อมแซมล็อกการเรียกคืนที่ค้างอยู่และปรับ metadata การโปรโมตให้เป็นมาตรฐาน
- `--json`: พิมพ์เอาต์พุต JSON

หาก `memory status` แสดง `Dreaming status: blocked` แสดงว่า Cron ของ Dreaming ที่จัดการไว้เปิดใช้งานอยู่ แต่ Heartbeat ที่ขับเคลื่อนมันไม่ได้ทำงานสำหรับตัวแทนเริ่มต้น ดู [Dreaming ไม่เคยรัน](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสาเหตุทั่วไปสองอย่าง

`memory index`:

- `--force`: บังคับทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุตคิวรี: ส่งผ่าน `[query]` แบบตำแหน่ง หรือ `--query <text>`
- หากให้ทั้งคู่ `--query` จะมีผลก่อน
- หากไม่ได้ให้ทั้งคู่ คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: จำกัดขอบเขตให้กับตัวแทนเดียว (ค่าเริ่มต้น: ตัวแทนเริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งกลับ
- `--min-score <n>`: กรองรายการที่ตรงกันซึ่งมีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory promote`:

แสดงตัวอย่างและใช้การโปรโมตหน่วยความจำระยะสั้น

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียนการโปรโมตไปยัง `MEMORY.md` (ค่าเริ่มต้น: แสดงตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวนตัวเลือกที่แสดง
- `--include-promoted` -- รวมรายการที่โปรโมตแล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับตัวเลือกระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณการโปรโมตแบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นจากทั้งการเรียกคืนหน่วยความจำและรอบการนำเข้ารายวัน รวมถึงสัญญาณเสริมกำลังจากเฟส light/REM
- เมื่อเปิดใช้งาน Dreaming แล้ว `memory-core` จะจัดการงาน Cron หนึ่งงานโดยอัตโนมัติ ซึ่งรันการกวาดทั้งหมด (`light -> REM -> deep`) ในเบื้องหลัง (ไม่จำเป็นต้องใช้ `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตให้กับตัวแทนเดียว (ค่าเริ่มต้น: ตัวแทนเริ่มต้น)
- `--limit <n>`: จำนวนตัวเลือกสูงสุดที่จะส่งคืน/ใช้
- `--min-score <n>`: คะแนนการโปรโมตแบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวนการเรียกคืนขั้นต่ำที่ต้องมีสำหรับตัวเลือก
- `--min-unique-queries <n>`: จำนวนคิวรีที่แตกต่างกันขั้นต่ำที่ต้องมีสำหรับตัวเลือก
- `--apply`: ผนวกตัวเลือกที่เลือกเข้าใน `MEMORY.md` และทำเครื่องหมายว่าโปรโมตแล้ว
- `--include-promoted`: รวมตัวเลือกที่โปรโมตแล้วในเอาต์พุต
- `--json`: พิมพ์เอาต์พุต JSON

`memory promote-explain`:

อธิบายตัวเลือกการโปรโมตเฉพาะและการแจกแจงคะแนนของมัน

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: คีย์ตัวเลือก ส่วนย่อยของพาธ หรือส่วนย่อยของ snippet ที่ต้องการค้นหา
- `--agent <id>`: จำกัดขอบเขตให้กับตัวแทนเดียว (ค่าเริ่มต้น: ตัวแทนเริ่มต้น)
- `--include-promoted`: รวมตัวเลือกที่โปรโมตแล้ว
- `--json`: พิมพ์เอาต์พุต JSON

`memory rem-harness`:

แสดงตัวอย่างการสะท้อน REM ความจริงที่เป็นตัวเลือก และเอาต์พุตการโปรโมตแบบ deep โดยไม่เขียนสิ่งใด

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตให้กับตัวแทนเดียว (ค่าเริ่มต้น: ตัวแทนเริ่มต้น)
- `--include-promoted`: รวมตัวเลือกแบบ deep ที่โปรโมตแล้ว
- `--json`: พิมพ์เอาต์พุต JSON

## Dreaming

Dreaming คือระบบรวบรวมหน่วยความจำในเบื้องหลังที่มีเฟสร่วมกันสามเฟส:
**light** (เรียงลำดับ/จัดเตรียมเนื้อหาระยะสั้น), **deep** (โปรโมต
ข้อเท็จจริงที่คงทนเข้าใน `MEMORY.md`) และ **REM** (สะท้อนและยกธีมขึ้นมา)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชตด้วย `/dreaming on|off` (หรือตรวจสอบด้วย `/dreaming status`)
- Dreaming รันตามกำหนดการกวาดที่จัดการไว้หนึ่งรายการ (`dreaming.frequency`) และดำเนินการเฟสตามลำดับ: light, REM, deep
- เฉพาะเฟส deep เท่านั้นที่เขียนหน่วยความจำที่คงทนไปยัง `MEMORY.md`
- เอาต์พุตเฟสที่มนุษย์อ่านได้และรายการไดอารีจะถูกเขียนไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่) พร้อมรายงานรายเฟสที่เป็นทางเลือกใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่ในการเรียกคืน ความเกี่ยวข้องของการดึงข้อมูล ความหลากหลายของคิวรี ความใหม่ตามเวลา การรวบรวมข้ามวัน และความมั่งคั่งของแนวคิดที่ได้มา
- การโปรโมตจะอ่านบันทึกรายวันสดซ้ำก่อนเขียนไปยัง `MEMORY.md` ดังนั้น snippet ระยะสั้นที่ถูกแก้ไขหรือลบจะไม่ถูกโปรโมตจาก snapshot ของที่เก็บการเรียกคืนที่ค้างอยู่
- การรันตามกำหนดการและ `memory promote` แบบแมนนวลใช้ค่าเริ่มต้นของเฟส deep เดียวกัน เว้นแต่คุณจะส่งค่าแทนที่ threshold ผ่าน CLI
- การรันอัตโนมัติจะแผ่ออกไปยังพื้นที่ทำงานหน่วยความจำที่กำหนดค่าไว้

การกำหนดเวลาเริ่มต้น:

- **จังหวะการกวาด**: `dreaming.frequency = 0 3 * * *`
- **Threshold ของ Deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

ตัวอย่าง:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

หมายเหตุ:

- `memory index --verbose` พิมพ์รายละเอียดรายเฟส (ผู้ให้บริการ โมเดล แหล่งที่มา กิจกรรม batch)
- `memory status` รวมพาธเพิ่มเติมที่กำหนดค่าผ่าน `memorySearch.extraPaths`
- หากช่องคีย์ API ระยะไกลของ active memory ที่มีผลจริงถูกกำหนดค่าเป็น SecretRefs คำสั่งจะแปลงค่าเหล่านั้นจาก snapshot ของ Gateway ที่ใช้งานอยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวอย่างรวดเร็ว
- หมายเหตุเรื่องเวอร์ชัน Gateway ไม่ตรงกัน: พาธคำสั่งนี้ต้องใช้ Gateway ที่รองรับ `secrets.resolve`; Gateway รุ่นเก่าจะส่งคืนข้อผิดพลาด unknown-method
- ปรับจังหวะการกวาดตามกำหนดการด้วย `dreaming.frequency` นโยบายการโปรโมตแบบ deep นอกเหนือจากนี้เป็นภายใน ใช้แฟล็ก CLI บน `memory promote` เมื่อต้องการค่าแทนที่แบบแมนนวลครั้งเดียว
- `memory rem-harness --path <file-or-dir> --grounded` แสดงตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จากบันทึกรายวันในอดีตโดยไม่เขียนสิ่งใด
- `memory rem-backfill --path <file-or-dir>` เขียนรายการไดอารีแบบ grounded ที่ย้อนกลับได้เข้าใน `DREAMS.md` เพื่อการตรวจสอบใน UI
- `memory rem-backfill --path <file-or-dir> --stage-short-term` ยังเพาะตัวเลือกที่คงทนแบบ grounded เข้าในที่เก็บการโปรโมตระยะสั้นสด เพื่อให้เฟส deep ปกติสามารถจัดอันดับได้
- `memory rem-backfill --rollback` ลบรายการไดอารีแบบ grounded ที่เขียนไว้ก่อนหน้า และ `memory rem-backfill --rollback-short-term` ลบตัวเลือกระยะสั้นแบบ grounded ที่จัดเตรียมไว้ก่อนหน้า
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายเฟสทั้งหมดและเอกสารอ้างอิงการกำหนดค่า

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
