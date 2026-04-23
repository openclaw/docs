---
read_when:
    - คุณต้องการทำดัชนีหรือค้นหา semantic memory
    - คุณกำลังดีบักความพร้อมใช้งานหรือการทำดัชนีของ memory
    - คุณต้องการโปรโมต memory ระยะสั้นที่ถูกเรียกคืนเข้าไปยัง `MEMORY.md`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw memory` (`status`/`index`/`search`/`promote`/`promote-explain`/`rem-harness`)
title: memory
x-i18n:
    generated_at: "2026-04-23T10:16:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหา semantic memory
ให้บริการโดย Plugin memory ที่ใช้งานอยู่ (ค่าเริ่มต้น: `memory-core`; ตั้งค่า `plugins.slots.memory = "none"` เพื่อปิดใช้งาน)

ที่เกี่ยวข้อง:

- แนวคิดเรื่อง Memory: [Memory](/th/concepts/memory)
- wiki ของ Memory: [Memory Wiki](/th/plugins/memory-wiki)
- CLI ของ wiki: [wiki](/th/cli/wiki)
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

- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว หากไม่ระบุ คำสั่งเหล่านี้จะทำงานกับทุก agent ที่กำหนดค่าไว้; หากไม่มีการกำหนดรายการ agent ระบบจะ fallback ไปใช้ agent ค่าเริ่มต้น
- `--verbose`: แสดง log แบบละเอียดระหว่างการ probe และการทำดัชนี

`memory status`:

- `--deep`: probe ความพร้อมใช้งานของ vector + embedding
- `--index`: เรียกทำ reindex หาก store มีสถานะ dirty (เป็นนัยว่าใช้ `--deep`)
- `--fix`: ซ่อมแซม recall lock ที่ค้างเก่า และปรับ promotion metadata ให้เป็นมาตรฐาน
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

หาก `memory status` แสดง `Dreaming status: blocked` แสดงว่า Cron ของ Dreaming ที่ระบบจัดการให้ถูกเปิดใช้งานอยู่ แต่ Heartbeat ที่ใช้ขับเคลื่อนไม่ได้ทำงานสำหรับ agent ค่าเริ่มต้น ดู [Dreaming never runs](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสองสาเหตุที่พบบ่อย

`memory index`:

- `--force`: บังคับทำ reindex แบบเต็ม

`memory search`:

- อินพุตคำค้น: ส่งได้ทั้ง `[query]` แบบ positional หรือ `--query <text>`
- หากระบุทั้งสองแบบ `--query` จะมีลำดับความสำคัญกว่า
- หากไม่ระบุทั้งสองแบบ คำสั่งจะออกพร้อม error
- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent ค่าเริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `--min-score <n>`: กรองผลลัพธ์ที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

`memory promote`:

ดูตัวอย่างและนำการโปรโมต memory ระยะสั้นไปใช้จริง

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียนการโปรโมตลงใน `MEMORY.md` (ค่าเริ่มต้น: แสดงตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวน candidate ที่แสดง
- `--include-promoted` -- รวมรายการที่เคยถูกโปรโมตแล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับ candidate ระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณการโปรโมตแบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นทั้งจาก memory recall และรอบ daily-ingestion รวมถึงสัญญาณ reinforcement จากเฟส light/REM
- เมื่อเปิดใช้ Dreaming, `memory-core` จะจัดการ Cron หนึ่งรายการโดยอัตโนมัติซึ่งรันการกวาดเต็มรูปแบบ (`light -> REM -> deep`) อยู่เบื้องหลัง (ไม่ต้องใช้ `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent ค่าเริ่มต้น)
- `--limit <n>`: จำนวน candidate สูงสุดที่จะส่งคืน/นำไปใช้
- `--min-score <n>`: คะแนนการโปรโมตแบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวน recall ขั้นต่ำที่ candidate ต้องมี
- `--min-unique-queries <n>`: จำนวน query ที่แตกต่างกันขั้นต่ำที่ candidate ต้องมี
- `--apply`: ผนวก candidate ที่เลือกลงใน `MEMORY.md` และทำเครื่องหมายว่าโปรโมตแล้ว
- `--include-promoted`: รวม candidate ที่โปรโมตไปแล้วในเอาต์พุต
- `--json`: พิมพ์เอาต์พุตเป็น JSON

`memory promote-explain`:

อธิบาย candidate สำหรับการโปรโมตที่ระบุ พร้อมรายละเอียดการแยกคะแนน

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: คีย์ของ candidate, ส่วนของพาธ, หรือส่วนของ snippet ที่ใช้ค้นหา
- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent ค่าเริ่มต้น)
- `--include-promoted`: รวม candidate ที่โปรโมตไปแล้ว
- `--json`: พิมพ์เอาต์พุตเป็น JSON

`memory rem-harness`:

ดูตัวอย่าง REM reflections, candidate truths และเอาต์พุตการโปรโมตแบบ deep โดยไม่เขียนอะไรลงไฟล์

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตไปยัง agent เดียว (ค่าเริ่มต้น: agent ค่าเริ่มต้น)
- `--include-promoted`: รวม candidate แบบ deep ที่โปรโมตไปแล้ว
- `--json`: พิมพ์เอาต์พุตเป็น JSON

## Dreaming

Dreaming คือระบบรวม memory เบื้องหลังที่มีสามเฟสทำงานร่วมกัน:
**light** (จัดเรียง/เตรียมข้อมูลระยะสั้น), **deep** (โปรโมตข้อเท็จจริงที่คงทน
ลงใน `MEMORY.md`) และ **REM** (สะท้อนและแสดงธีมต่าง ๆ)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชตได้ด้วย `/dreaming on|off` (หรือตรวจสอบด้วย `/dreaming status`)
- Dreaming ทำงานตามตารางการกวาดที่ระบบจัดการไว้รายการเดียว (`dreaming.frequency`) และรันเฟสตามลำดับ: light, REM, deep
- เฉพาะเฟส deep เท่านั้นที่เขียน durable memory ลงใน `MEMORY.md`
- เอาต์พุตเฟสแบบอ่านได้โดยมนุษย์และบันทึกไดอารีจะถูกเขียนลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่เดิม) พร้อมรายงานแยกตามเฟสแบบไม่บังคับใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่ของ recall, ความเกี่ยวข้องในการดึงคืน, ความหลากหลายของ query, ความใหม่ตามเวลา, การรวมข้ามวัน และความสมบูรณ์เชิงแนวคิดที่อนุมานได้
- การโปรโมตจะอ่าน daily note ปัจจุบันซ้ำก่อนเขียนลง `MEMORY.md` ดังนั้น snippet ระยะสั้นที่ถูกแก้ไขหรือลบจะไม่ถูกโปรโมตจากสแนปชอต recall-store ที่ล้าสมัย
- การรัน `memory promote` ทั้งแบบตามตารางและแบบ manual ใช้ค่าเริ่มต้นของเฟส deep เดียวกัน เว้นแต่คุณจะส่ง threshold override ผ่านแฟลก CLI
- การรันอัตโนมัติจะกระจายการทำงานไปยัง memory workspace ที่กำหนดค่าไว้

ตารางเวลาเริ่มต้น:

- **รอบการกวาด**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` พิมพ์รายละเอียดรายเฟส (provider, model, แหล่งข้อมูล, กิจกรรมของ batch)
- `memory status` รวมพาธเพิ่มเติมใด ๆ ที่กำหนดไว้ผ่าน `memorySearch.extraPaths`
- หากฟิลด์คีย์ API ระยะไกลของ Active Memory ที่มีผลจริงถูกกำหนดเป็น SecretRefs คำสั่งจะ resolve ค่าเหล่านั้นจาก snapshot ของ Gateway ที่ใช้งานอยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หมายเหตุเรื่อง Gateway version skew: เส้นทางคำสั่งนี้ต้องใช้ Gateway ที่รองรับ `secrets.resolve`; Gateway รุ่นเก่าจะส่งกลับ unknown-method error
- ปรับรอบการกวาดตามตารางได้ด้วย `dreaming.frequency` ส่วนนโยบายการโปรโมตแบบ deep เป็นเรื่องภายใน; ใช้แฟลก CLI บน `memory promote` เมื่อต้องการ override แบบครั้งเดียว
- `memory rem-harness --path <file-or-dir> --grounded` จะแสดงตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จาก daily note เก่าโดยไม่เขียนอะไรลงไฟล์
- `memory rem-backfill --path <file-or-dir>` จะเขียนรายการไดอารีแบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md` เพื่อให้ UI ตรวจสอบ
- `memory rem-backfill --path <file-or-dir> --stage-short-term` จะ seed candidate แบบ grounded ที่คงทนลงใน store โปรโมตระยะสั้นปัจจุบันด้วย เพื่อให้เฟส deep ปกติสามารถจัดอันดับต่อได้
- `memory rem-backfill --rollback` จะลบรายการไดอารีแบบ grounded ที่เคยเขียนไว้ก่อนหน้า และ `memory rem-backfill --rollback-short-term` จะลบ candidate ระยะสั้นแบบ grounded ที่เคยถูก stage ไว้
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายเฟสแบบเต็มและเอกสารอ้างอิงการกำหนดค่า
