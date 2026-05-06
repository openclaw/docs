---
read_when:
    - คุณต้องการจัดทำดัชนีหรือค้นหาหน่วยความจำเชิงความหมาย
    - คุณกำลังดีบักความพร้อมใช้งานของหน่วยความจำหรือการทำดัชนี
    - คุณต้องการเลื่อนระดับความจำระยะสั้นที่เรียกคืนมาเป็น `MEMORY.md`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: หน่วยความจำ
x-i18n:
    generated_at: "2026-05-06T17:53:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหาหน่วยความจำเชิงความหมาย
จัดเตรียมโดย Active Memory Plugin (ค่าเริ่มต้น: `memory-core`; ตั้งค่า `plugins.slots.memory = "none"` เพื่อปิดใช้งาน)

ที่เกี่ยวข้อง:

- แนวคิดหน่วยความจำ: [หน่วยความจำ](/th/concepts/memory)
- วิกิหน่วยความจำ: [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
- CLI วิกิ: [wiki](/th/cli/wiki)
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
- `--verbose`: แสดงบันทึกโดยละเอียดระหว่างการตรวจสอบและการทำดัชนี

`memory status`:

- `--deep`: ตรวจสอบความพร้อมของที่เก็บเวกเตอร์ภายในเครื่อง ความพร้อมของผู้ให้บริการ embedding และความพร้อมของการค้นหาเวกเตอร์เชิงความหมาย `memory status` แบบปกติจะยังคงรวดเร็วและไม่เรียกใช้งาน embedding สดหรือการค้นหาผู้ให้บริการ สถานะที่เก็บเวกเตอร์หรือเวกเตอร์เชิงความหมายที่ไม่ทราบหมายความว่ายังไม่ได้ตรวจสอบในคำสั่งนั้น QMD lexical `searchMode: "search"` จะข้ามการตรวจสอบเวกเตอร์เชิงความหมายและการบำรุงรักษา embedding แม้ใช้ `--deep`
- `--index`: เรียกทำดัชนีใหม่หากที่เก็บอยู่ในสถานะ dirty (โดยนัยว่าใช้ `--deep`)
- `--fix`: ซ่อมแซมล็อกการ recall ที่ค้างอยู่และปรับข้อมูลเมตาของการ promote ให้เป็นปกติ
- `--json`: พิมพ์เอาต์พุต JSON

หาก `memory status` แสดง `Dreaming status: blocked` หมายความว่า Cron สำหรับ Dreaming ที่จัดการไว้เปิดใช้งานอยู่ แต่ Heartbeat ที่ขับเคลื่อนไม่ได้ทำงานสำหรับเอเจนต์เริ่มต้น ดู [Dreaming ไม่เคยทำงาน](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสาเหตุที่พบบ่อยสองกรณี

`memory index`:

- `--force`: บังคับทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุตคิวรี: ส่งได้ทั้ง `[query]` แบบตำแหน่งหรือ `--query <text>`
- หากระบุทั้งสองแบบ `--query` จะมีผลเหนือกว่า
- หากไม่ได้ระบุทั้งสองแบบ คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งกลับ
- `--min-score <n>`: กรองรายการที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory promote`:

ดูตัวอย่างและใช้การ promote หน่วยความจำระยะสั้น

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียนการ promote ไปยัง `MEMORY.md` (ค่าเริ่มต้น: ดูตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวน candidate ที่แสดง
- `--include-promoted` -- รวมรายการที่ถูก promote แล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับ candidate ระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณการ promote แบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นจากทั้งการ recall หน่วยความจำและรอบการ ingest รายวัน รวมถึงสัญญาณเสริมแรงจากเฟส light/REM
- เมื่อเปิดใช้งาน Dreaming แล้ว `memory-core` จะจัดการ Cron job หนึ่งรายการโดยอัตโนมัติ ซึ่งเรียก sweep แบบเต็ม (`light -> REM -> deep`) ในเบื้องหลัง (ไม่ต้องใช้ `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--limit <n>`: จำนวน candidate สูงสุดที่จะส่งกลับ/นำไปใช้
- `--min-score <n>`: คะแนนการ promote แบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวนการ recall ขั้นต่ำที่จำเป็นสำหรับ candidate
- `--min-unique-queries <n>`: จำนวนคิวรีที่แตกต่างกันขั้นต่ำที่จำเป็นสำหรับ candidate
- `--apply`: ผนวก candidate ที่เลือกลงใน `MEMORY.md` และทำเครื่องหมายว่า promoted
- `--include-promoted`: รวม candidate ที่ถูก promote แล้วในเอาต์พุต
- `--json`: พิมพ์เอาต์พุต JSON

`memory promote-explain`:

อธิบาย candidate การ promote ที่ระบุและรายละเอียดคะแนน

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: คีย์ candidate, ส่วนย่อยของพาธ หรือส่วนย่อยของ snippet ที่จะค้นหา
- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวม candidate ที่ถูก promote แล้ว
- `--json`: พิมพ์เอาต์พุต JSON

`memory rem-harness`:

ดูตัวอย่างการสะท้อนของ REM, ความจริง candidate และเอาต์พุตการ promote ระดับลึกโดยไม่เขียนอะไร

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตไว้ที่เอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวม deep candidate ที่ถูก promote แล้ว
- `--json`: พิมพ์เอาต์พุต JSON

## Dreaming

Dreaming คือระบบรวบรวมและกลั่นกรองหน่วยความจำเบื้องหลังที่มีสามเฟสซึ่งทำงานร่วมกัน:
**light** (จัดเรียง/เตรียมข้อมูลระยะสั้น), **deep** (promote
ข้อเท็จจริงที่คงทนไปยัง `MEMORY.md`) และ **REM** (สะท้อนและยกธีมขึ้นมาให้เห็น)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชตด้วย `/dreaming on|off` (หรือตรวจสอบด้วย `/dreaming status`)
- Dreaming ทำงานตามกำหนดการ sweep ที่จัดการไว้หนึ่งรายการ (`dreaming.frequency`) และดำเนินเฟสตามลำดับ: light, REM, deep
- เฉพาะเฟส deep เท่านั้นที่เขียนหน่วยความจำถาวรไปยัง `MEMORY.md`
- เอาต์พุตเฟสและรายการไดอารีที่มนุษย์อ่านได้จะถูกเขียนไปยัง `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่) พร้อมรายงานแยกตามเฟสแบบไม่บังคับใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่การ recall, ความเกี่ยวข้องของการดึงข้อมูล, ความหลากหลายของคิวรี, ความใหม่ตามเวลา, การรวบรวมข้ามวัน และความสมบูรณ์ของแนวคิดที่อนุมานได้
- การ promote จะอ่านโน้ตรายวันสดซ้ำก่อนเขียนไปยัง `MEMORY.md` ดังนั้น snippet ระยะสั้นที่ถูกแก้ไขหรือลบจะไม่ถูก promote จาก snapshot ของ recall-store ที่ล้าสมัย
- การเรียก `memory promote` ทั้งแบบตามกำหนดการและแบบด้วยตนเองใช้ค่าเริ่มต้นของเฟส deep เดียวกัน เว้นแต่คุณจะส่งค่า override ของ threshold ผ่าน CLI
- การเรียกอัตโนมัติจะกระจายงานไปยัง workspace หน่วยความจำที่กำหนดค่าไว้

การกำหนดเวลาเริ่มต้น:

- **รอบการ sweep**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` พิมพ์รายละเอียดแยกตามเฟส (ผู้ให้บริการ, โมเดล, แหล่งที่มา, กิจกรรม batch)
- `memory status` รวมพาธเพิ่มเติมที่กำหนดค่าผ่าน `memorySearch.extraPaths`
- หากฟิลด์คีย์ API ระยะไกลของ Active Memory ที่มีผลใช้งานจริงถูกกำหนดค่าเป็น SecretRefs คำสั่งจะ resolve ค่าเหล่านั้นจาก snapshot ของ Gateway ที่ใช้งานอยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวอย่างรวดเร็ว
- หมายเหตุเรื่องเวอร์ชัน Gateway ไม่ตรงกัน: เส้นทางคำสั่งนี้ต้องใช้ Gateway ที่รองรับ `secrets.resolve`; Gateway รุ่นเก่าจะส่งคืนข้อผิดพลาด unknown-method
- ปรับรอบ sweep ตามกำหนดการด้วย `dreaming.frequency` นโยบายการ promote ระดับ deep นอกเหนือจากนี้เป็นภายในระบบ ให้ใช้ flag ของ CLI บน `memory promote` เมื่อต้องการ override แบบทำด้วยตนเองเฉพาะครั้ง
- `memory rem-harness --path <file-or-dir> --grounded` ดูตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` ที่อิงหลักฐานจากโน้ตรายวันในอดีตโดยไม่เขียนอะไร
- `memory rem-backfill --path <file-or-dir>` เขียนรายการไดอารีที่อิงหลักฐานและย้อนกลับได้ลงใน `DREAMS.md` เพื่อรีวิวใน UI
- `memory rem-backfill --path <file-or-dir> --stage-short-term` จะ seed candidate ถาวรที่อิงหลักฐานลงในที่เก็บการ promote ระยะสั้นสดด้วย เพื่อให้เฟส deep ปกติสามารถจัดอันดับได้
- `memory rem-backfill --rollback` ลบรายการไดอารีที่อิงหลักฐานซึ่งเคยเขียนไว้ก่อนหน้า และ `memory rem-backfill --rollback-short-term` ลบ candidate ระยะสั้นที่อิงหลักฐานซึ่งเคย stage ไว้ก่อนหน้า
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายเฟสทั้งหมดและข้อมูลอ้างอิงการกำหนดค่า

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
