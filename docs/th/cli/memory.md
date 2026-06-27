---
read_when:
    - คุณต้องการทำดัชนีหรือค้นหา semantic memory
    - คุณกำลังดีบักความพร้อมใช้งานของหน่วยความจำหรือการทำดัชนี
    - คุณต้องการยกระดับความจำระยะสั้นที่เรียกคืนมาเป็น `MEMORY.md`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: หน่วยความจำ
x-i18n:
    generated_at: "2026-06-27T17:21:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหาหน่วยความจำเชิงความหมาย
จัดให้โดย Plugin `memory-core` ที่รวมมาให้ คำสั่งนี้จะพร้อมใช้งานเมื่อ
`plugins.slots.memory` เลือก `memory-core` (ค่าเริ่มต้น); Plugin หน่วยความจำอื่นๆ
จะแสดงเนมสเปซ CLI ของตนเอง

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

- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว หากไม่มีตัวเลือกนี้ คำสั่งเหล่านี้จะทำงานกับ agent ที่กำหนดค่าไว้แต่ละตัว; หากไม่ได้กำหนดค่ารายชื่อ agent ไว้ จะย้อนกลับไปใช้ agent เริ่มต้น
- `--verbose`: แสดงบันทึกโดยละเอียดระหว่างการตรวจสอบและการทำดัชนี

`memory status`:

- `--deep`: ตรวจสอบความพร้อมของ vector store ภายในเครื่อง, ความพร้อมของ embedding provider และความพร้อมของการค้นหาเวกเตอร์เชิงความหมาย `memory status` แบบปกติจะยังรวดเร็วและไม่ทำงาน embedding สดหรือการค้นพบ provider; สถานะ vector store หรือ semantic vector ที่ไม่ทราบหมายความว่าสถานะนั้นไม่ได้ถูกตรวจสอบในคำสั่งนั้น QMD lexical `searchMode: "search"` จะข้ามการตรวจสอบ semantic vector และการบำรุงรักษา embedding แม้ใช้ `--deep`
- `--index`: เรียกทำดัชนีใหม่หาก store มีสถานะ dirty (หมายรวมถึง `--deep`)
- `--fix`: ซ่อมแซม recall lock ที่ค้างเก่าและทำให้เมทาดาทาการ promote เป็นรูปแบบปกติ
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

หาก `memory status` แสดง `Dreaming status: blocked` แปลว่า managed dreaming cron เปิดใช้งานอยู่ แต่ Heartbeat ที่ขับเคลื่อนมันไม่ได้ทำงานสำหรับ agent เริ่มต้น ดู [Dreaming ไม่เคยทำงาน](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสาเหตุที่พบบ่อยสองข้อ

`memory index`:

- `--force`: บังคับทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุตคำค้น: ส่งได้ทั้ง `[query]` แบบ positional หรือ `--query <text>`
- หากระบุทั้งสองแบบ `--query` จะมีผลเหนือกว่า
- หากไม่ระบุทั้งสองแบบ คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent เริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `--min-score <n>`: กรองรายการที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

`memory promote`:

แสดงตัวอย่างและใช้การ promote หน่วยความจำระยะสั้น

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียนการ promote ลงใน `MEMORY.md` (ค่าเริ่มต้น: แสดงตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวน candidate ที่แสดง
- `--include-promoted` -- รวม entry ที่เคยถูก promote แล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับ candidate ระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณการ promote แบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นจากทั้งการ recall หน่วยความจำและรอบ daily ingestion รวมถึงสัญญาณเสริมแรงจาก phase light/REM
- เมื่อเปิดใช้งาน Dreaming แล้ว `memory-core` จะจัดการ cron job หนึ่งงานโดยอัตโนมัติ ซึ่งรันการกวาดแบบเต็ม (`light -> REM -> deep`) ในพื้นหลัง (ไม่จำเป็นต้องใช้ `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent เริ่มต้น)
- `--limit <n>`: จำนวน candidate สูงสุดที่จะส่งคืน/นำไปใช้
- `--min-score <n>`: คะแนนการ promote แบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวน recall ขั้นต่ำที่ candidate ต้องมี
- `--min-unique-queries <n>`: จำนวน query ที่แตกต่างกันขั้นต่ำที่ candidate ต้องมี
- `--apply`: ผนวก candidate ที่เลือกเข้าไปใน `MEMORY.md` และทำเครื่องหมายว่า promote แล้ว
- `--include-promoted`: รวม candidate ที่ promote แล้วในผลลัพธ์
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

`memory promote-explain`:

อธิบาย candidate สำหรับการ promote รายหนึ่งและรายละเอียดคะแนนของ candidate นั้น

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: key ของ candidate, fragment ของ path หรือ fragment ของ snippet ที่ต้องการค้นหา
- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent เริ่มต้น)
- `--include-promoted`: รวม candidate ที่ promote แล้ว
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

`memory rem-harness`:

แสดงตัวอย่าง reflection ของ REM, candidate truth และผลลัพธ์การ promote แบบ deep โดยไม่เขียนสิ่งใด

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent เริ่มต้น)
- `--include-promoted`: รวม candidate แบบ deep ที่ promote แล้ว
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

## Dreaming

Dreaming คือระบบรวมหน่วยความจำในพื้นหลังที่มีสาม phase ซึ่งทำงานร่วมกัน:
**light** (จัดเรียง/เตรียม material ระยะสั้น), **deep** (promote
fact ที่คงทนเข้าไปใน `MEMORY.md`) และ **REM** (สะท้อนคิดและยก theme ขึ้นมาให้เห็น)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับสถานะจากแชทด้วย `/dreaming on|off` (หรือตรวจดูด้วย `/dreaming status`)
- Dreaming ทำงานตามตาราง sweep ที่จัดการไว้หนึ่งชุด (`dreaming.frequency`) และดำเนิน phase ตามลำดับ: light, REM, deep
- มีเพียง phase deep เท่านั้นที่เขียนหน่วยความจำแบบคงทนไปยัง `MEMORY.md`
- ผลลัพธ์ของ phase และ entry ไดอารีแบบอ่านได้โดยมนุษย์จะถูกเขียนลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่) พร้อมรายงานต่อ phase แบบเลือกได้ใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่การ recall, relevance ของการดึงข้อมูล, ความหลากหลายของ query, ความใหม่ตามเวลา, การ consolidate ข้ามวัน และความมั่งคั่งเชิงแนวคิดที่ได้มา
- การ promote จะอ่าน daily note สดซ้ำก่อนเขียนไปยัง `MEMORY.md` ดังนั้น snippet ระยะสั้นที่ถูกแก้ไขหรือลบแล้วจะไม่ถูก promote จาก snapshot recall store ที่ค้างเก่า
- การรันตามกำหนดเวลาและ `memory promote` แบบ manual ใช้ค่าเริ่มต้นของ phase deep เดียวกัน เว้นแต่คุณส่งค่า override threshold ผ่าน CLI
- การรันอัตโนมัติจะแผ่การทำงานไปยัง memory workspace ที่กำหนดค่าไว้

การจัดตารางค่าเริ่มต้น:

- **รอบการ sweep**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` พิมพ์รายละเอียดต่อ phase (provider, model, source, กิจกรรม batch)
- `memory status` รวม path เพิ่มเติมใดๆ ที่กำหนดค่าผ่าน `memorySearch.extraPaths`
- หาก field ของ Active Memory remote API key ที่มีผลใช้งานถูกกำหนดค่าเป็น SecretRefs คำสั่งจะ resolve ค่าเหล่านั้นจาก snapshot ของ Gateway ที่ active อยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หมายเหตุเรื่องความคลาดเคลื่อนของเวอร์ชัน Gateway: path คำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งคืนข้อผิดพลาด unknown-method
- ปรับรอบการ sweep ตามกำหนดเวลาด้วย `dreaming.frequency` นอกเหนือจากนั้น policy การ promote แบบ deep จะเป็นภายใน ยกเว้น `dreaming.phases.deep.maxPromotedSnippetTokens` ซึ่งจำกัดความยาว snippet ที่ถูก promote โดยยังคงแสดงที่มาไว้ ใช้ flag ของ CLI บน `memory promote` เมื่อคุณต้องการ override threshold แบบ manual เฉพาะครั้ง
- `memory rem-harness --path <file-or-dir> --grounded` แสดงตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จาก daily note ในอดีตโดยไม่เขียนสิ่งใด
- `memory rem-backfill --path <file-or-dir>` เขียน entry ไดอารีแบบ grounded ที่ย้อนกลับได้เข้าไปใน `DREAMS.md` เพื่อให้ UI ตรวจทาน
- `memory rem-backfill --path <file-or-dir> --stage-short-term` ยัง seed candidate แบบ grounded durable เข้าไปใน live short-term promotion store เพื่อให้ phase deep ปกติสามารถจัดอันดับได้
- `memory rem-backfill --rollback` ลบ entry ไดอารีแบบ grounded ที่เคยเขียนไว้ก่อนหน้า และ `memory rem-backfill --rollback-short-term` ลบ candidate ระยะสั้นแบบ grounded ที่เคย stage ไว้ก่อนหน้า
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบาย phase ทั้งหมดและอ้างอิงการกำหนดค่า

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
