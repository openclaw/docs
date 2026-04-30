---
read_when:
    - คุณต้องการจัดทำดัชนีหรือค้นหาหน่วยความจำเชิงความหมาย
    - คุณกำลังดีบักความพร้อมใช้งานของหน่วยความจำหรือการทำดัชนี
    - คุณต้องการยกระดับหน่วยความจำระยะสั้นที่เรียกคืนมาให้เป็น `MEMORY.md`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: หน่วยความจำ
x-i18n:
    generated_at: "2026-04-30T09:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหาหน่วยความจำเชิงความหมาย
จัดเตรียมโดย active memory plugin (ค่าเริ่มต้น: `memory-core`; ตั้งค่า `plugins.slots.memory = "none"` เพื่อปิดใช้งาน)

ที่เกี่ยวข้อง:

- แนวคิดเกี่ยวกับหน่วยความจำ: [หน่วยความจำ](/th/concepts/memory)
- วิกิหน่วยความจำ: [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
- Wiki CLI: [wiki](/th/cli/wiki)
- Plugins: [Plugins](/th/tools/plugin)

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

- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว หากไม่มีตัวเลือกนี้ คำสั่งเหล่านี้จะทำงานกับเอเจนต์ที่กำหนดค่าไว้แต่ละตัว หากไม่ได้กำหนดค่ารายการเอเจนต์ไว้ จะย้อนกลับไปใช้เอเจนต์เริ่มต้น
- `--verbose`: แสดงบันทึกแบบละเอียดระหว่างการตรวจสอบและการทำดัชนี

`memory status`:

- `--deep`: ตรวจสอบความพร้อมใช้งานของเวกเตอร์ + embedding `memory status` แบบธรรมดาจะยังคงรวดเร็วและไม่รันการ ping embedding แบบสด QMD lexical `searchMode: "search"` จะข้ามการตรวจสอบเวกเตอร์เชิงความหมายและการบำรุงรักษา embedding แม้ใช้ `--deep`
- `--index`: รันการทำดัชนีใหม่หาก store มีสถานะ dirty (หมายความรวมถึง `--deep`)
- `--fix`: ซ่อมแซม recall lock ที่ค้างเก่าและปรับ metadata ของ promotion ให้เป็นมาตรฐาน
- `--json`: พิมพ์เอาต์พุต JSON

หาก `memory status` แสดง `Dreaming status: blocked` แปลว่า cron Dreaming ที่จัดการไว้เปิดใช้งานอยู่ แต่ heartbeat ที่ขับเคลื่อน cron นั้นไม่ทำงานสำหรับเอเจนต์เริ่มต้น ดู [Dreaming ไม่เคยทำงาน](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสาเหตุทั่วไปสองประการ

`memory index`:

- `--force`: บังคับทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุต query: ส่งได้ทั้ง `[query]` แบบ positional หรือ `--query <text>`
- หากระบุทั้งสองอย่าง `--query` จะมีผลเหนือกว่า
- หากไม่ระบุทั้งสองอย่าง คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `--min-score <n>`: กรองรายการที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory promote`:

ดูตัวอย่างและนำ promotion ของหน่วยความจำระยะสั้นไปใช้

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียน promotion ไปยัง `MEMORY.md` (ค่าเริ่มต้น: ดูตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวนผู้สมัครที่แสดง
- `--include-promoted` -- รวมรายการที่ได้รับการ promote แล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับผู้สมัครระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณ promotion แบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นจากทั้ง memory recall และรอบ daily-ingestion รวมถึงสัญญาณเสริมแรงจากเฟส light/REM
- เมื่อเปิดใช้งาน Dreaming แล้ว `memory-core` จะจัดการ cron job หนึ่งรายการโดยอัตโนมัติ ซึ่งรัน sweep เต็มรูปแบบ (`light -> REM -> deep`) ในพื้นหลัง (ไม่ต้องใช้ `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--limit <n>`: จำนวนผู้สมัครสูงสุดที่จะส่งคืน/นำไปใช้
- `--min-score <n>`: คะแนน promotion แบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวน recall ขั้นต่ำที่ผู้สมัครต้องมี
- `--min-unique-queries <n>`: จำนวน query ที่แตกต่างกันขั้นต่ำที่ผู้สมัครต้องมี
- `--apply`: ผนวกผู้สมัครที่เลือกลงใน `MEMORY.md` และทำเครื่องหมายว่าได้รับการ promote แล้ว
- `--include-promoted`: รวมผู้สมัครที่ได้รับการ promote แล้วในเอาต์พุต
- `--json`: พิมพ์เอาต์พุต JSON

`memory promote-explain`:

อธิบายผู้สมัคร promotion รายหนึ่งและรายละเอียดคะแนนของผู้สมัครนั้น

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: key ของผู้สมัคร ส่วนย่อยของ path หรือส่วนย่อยของ snippet ที่ต้องการค้นหา
- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวมผู้สมัครที่ได้รับการ promote แล้ว
- `--json`: พิมพ์เอาต์พุต JSON

`memory rem-harness`:

ดูตัวอย่าง reflection ของ REM, candidate truth และเอาต์พุต deep promotion โดยไม่เขียนข้อมูลใดๆ

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวมผู้สมัคร deep ที่ได้รับการ promote แล้ว
- `--json`: พิมพ์เอาต์พุต JSON

## Dreaming

Dreaming คือระบบรวบรวมหน่วยความจำเบื้องหลังที่มีสามเฟสซึ่งทำงานร่วมกัน:
**light** (จัดเรียง/เตรียมวัสดุระยะสั้น), **deep** (promote ข้อเท็จจริงที่คงทน
เข้าสู่ `MEMORY.md`) และ **REM** (สะท้อนและนำธีมขึ้นมาแสดง)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชทด้วย `/dreaming on|off` (หรือตรวจดูด้วย `/dreaming status`)
- Dreaming ทำงานตามตาราง sweep ที่จัดการไว้หนึ่งรายการ (`dreaming.frequency`) และดำเนินเฟสตามลำดับ: light, REM, deep
- เฉพาะเฟส deep เท่านั้นที่เขียนหน่วยความจำแบบคงทนไปยัง `MEMORY.md`
- เอาต์พุตของเฟสที่อ่านได้โดยมนุษย์และรายการไดอารีจะถูกเขียนไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่) พร้อมรายงานแยกตามเฟสแบบไม่บังคับใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่ของ recall, ความเกี่ยวข้องของ retrieval, ความหลากหลายของ query, ความใหม่ตามเวลา, การรวบรวมข้ามวัน และความมั่งคั่งของแนวคิดที่ได้มา
- Promotion จะอ่าน daily note แบบสดอีกครั้งก่อนเขียนไปยัง `MEMORY.md` ดังนั้น snippet ระยะสั้นที่แก้ไขหรือลบไปแล้วจะไม่ถูก promote จาก snapshot ของ recall-store ที่ค้างเก่า
- การรัน `memory promote` แบบตั้งเวลาและแบบทำเองใช้ค่าเริ่มต้นของเฟส deep เดียวกัน เว้นแต่คุณจะส่งค่า override threshold ผ่าน CLI
- การรันอัตโนมัติจะกระจายงานข้าม workspace หน่วยความจำที่กำหนดค่าไว้

การตั้งเวลาเริ่มต้น:

- **จังหวะ sweep**: `dreaming.frequency = 0 3 * * *`
- **threshold ของ deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` พิมพ์รายละเอียดแยกตามเฟส (provider, model, source, กิจกรรม batch)
- `memory status` รวม path เพิ่มเติมที่กำหนดค่าผ่าน `memorySearch.extraPaths`
- หากฟิลด์ API key ระยะไกลของ active memory ที่มีผลอยู่ถูกกำหนดค่าเป็น SecretRefs คำสั่งจะ resolve ค่าเหล่านั้นจาก snapshot ของ Gateway ที่ active อยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หมายเหตุเรื่องความคลาดเคลื่อนของเวอร์ชัน Gateway: เส้นทางคำสั่งนี้ต้องใช้ Gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งคืนข้อผิดพลาด unknown-method
- ปรับจังหวะ sweep ตามตารางด้วย `dreaming.frequency` นโยบาย deep promotion นอกเหนือจากนี้เป็นเรื่องภายใน ใช้ flag ของ CLI บน `memory promote` เมื่อคุณต้องการ override แบบทำเองเฉพาะครั้ง
- `memory rem-harness --path <file-or-dir> --grounded` แสดงตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จาก daily note ในอดีตโดยไม่เขียนข้อมูลใดๆ
- `memory rem-backfill --path <file-or-dir>` เขียนรายการไดอารีแบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md` เพื่อการตรวจทานใน UI
- `memory rem-backfill --path <file-or-dir> --stage-short-term` ยัง seed ผู้สมัครแบบ grounded ที่คงทนลงใน promotion store ระยะสั้นแบบสด เพื่อให้เฟส deep ปกติสามารถจัดอันดับได้
- `memory rem-backfill --rollback` ลบรายการไดอารีแบบ grounded ที่เคยเขียนไว้ก่อนหน้านี้ และ `memory rem-backfill --rollback-short-term` ลบผู้สมัครระยะสั้นแบบ grounded ที่เคย staged ไว้ก่อนหน้านี้
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายเฟสทั้งหมดและเอกสารอ้างอิงการกำหนดค่า

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
