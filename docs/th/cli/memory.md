---
read_when:
    - คุณต้องการจัดทำดัชนีหรือค้นหาหน่วยความจำเชิงความหมาย
    - คุณกำลังดีบักความพร้อมใช้งานของหน่วยความจำหรือการจัดทำดัชนี
    - คุณต้องการเลื่อนระดับความจำระยะสั้นที่เรียกคืนมาเป็น `MEMORY.md`
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: หน่วยความจำ
x-i18n:
    generated_at: "2026-06-30T14:30:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหาหน่วยความจำเชิงความหมาย
ให้บริการโดย Plugin `memory-core` ที่รวมมาให้ คำสั่งนี้พร้อมใช้งานเมื่อ
`plugins.slots.memory` เลือก `memory-core` (ค่าเริ่มต้น); Plugin หน่วยความจำอื่น
จะแสดง namespace ของ CLI ของตนเอง

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

- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว หากไม่ระบุ คำสั่งเหล่านี้จะทำงานกับเอเจนต์ที่กำหนดค่าไว้แต่ละตัว; หากไม่ได้กำหนดค่ารายการเอเจนต์ไว้ จะย้อนกลับไปใช้เอเจนต์เริ่มต้น
- `--verbose`: แสดงบันทึกโดยละเอียดระหว่างการตรวจสอบและการทำดัชนี

`memory status`:

- `--deep`: ตรวจสอบความพร้อมของ vector store ในเครื่อง, ความพร้อมของ embedding provider และความพร้อมของการค้นหาเวกเตอร์เชิงความหมาย `memory status` แบบปกติจะยังคงรวดเร็วและไม่เรียกใช้งาน embedding แบบสดหรือการค้นพบ provider; สถานะ vector store หรือ semantic vector ที่ไม่ทราบหมายความว่าไม่ได้ถูกตรวจสอบในคำสั่งนั้น โหมดคำศัพท์ QMD `searchMode: "search"` จะข้ามการตรวจสอบเวกเตอร์เชิงความหมายและการดูแลรักษา embedding แม้ใช้ `--deep`
- `--index`: เรียกทำดัชนีใหม่หาก store สกปรก (มีนัยถึง `--deep`)
- `--fix`: ซ่อมแซม stale recall locks และปรับ metadata ของ promotion ให้เป็นมาตรฐาน
- `--json`: พิมพ์ผลลัพธ์ JSON

หาก `memory status` แสดง `Dreaming status: blocked` หมายความว่า cron ของ Dreaming ที่จัดการไว้ถูกเปิดใช้งาน แต่ Heartbeat ที่ขับเคลื่อนมันไม่ทำงานสำหรับเอเจนต์เริ่มต้น ดู [Dreaming ไม่เคยทำงาน](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสาเหตุทั่วไปสองข้อ

`memory index`:

- `--force`: บังคับทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุตคำค้น: ส่ง `[query]` แบบ positional หรือ `--query <text>`
- หากระบุทั้งสองอย่าง `--query` จะมีผลเหนือกว่า
- หากไม่ระบุทั้งสองอย่าง คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `--min-score <n>`: กรองรายการที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory promote`:

ดูตัวอย่างและปรับใช้การ promote หน่วยความจำระยะสั้น

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียน promotions ลงใน `MEMORY.md` (ค่าเริ่มต้น: แสดงตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวน candidates ที่แสดง
- `--include-promoted` -- รวมรายการที่ถูก promote แล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับ candidates ระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณ promotion แบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นจากทั้ง memory recalls และ daily-ingestion passes รวมถึงสัญญาณเสริมแรงจากเฟส light/REM
- เมื่อเปิดใช้งาน Dreaming, `memory-core` จะจัดการ cron job หนึ่งงานโดยอัตโนมัติ ซึ่งทำ full sweep (`light -> REM -> deep`) ในเบื้องหลัง (ไม่จำเป็นต้องเรียก `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--limit <n>`: จำนวน candidates สูงสุดที่จะส่งคืน/ปรับใช้
- `--min-score <n>`: คะแนน promotion แบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวน recall ขั้นต่ำที่ candidate ต้องมี
- `--min-unique-queries <n>`: จำนวนคำค้นที่แตกต่างกันขั้นต่ำที่ candidate ต้องมี
- `--apply`: เพิ่ม candidates ที่เลือกลงใน `MEMORY.md` และทำเครื่องหมายว่า promoted
- `--include-promoted`: รวม candidates ที่ promoted แล้วในผลลัพธ์
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory promote-explain`:

อธิบาย candidate ของ promotion ที่ระบุและรายละเอียดการแยกคะแนน

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: คีย์ candidate, ส่วนหนึ่งของ path หรือส่วนหนึ่งของ snippet ที่จะค้นหา
- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวม candidates ที่ promoted แล้ว
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory rem-harness`:

ดูตัวอย่าง reflections ของ REM, truths ที่เป็น candidate และผลลัพธ์ deep promotion โดยไม่เขียนสิ่งใด

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวม deep candidates ที่ promoted แล้ว
- `--json`: พิมพ์ผลลัพธ์ JSON

## Dreaming

Dreaming คือระบบรวบรวมหน่วยความจำในเบื้องหลังที่มีสามเฟสซึ่งทำงานร่วมกัน:
**light** (จัดเรียง/เตรียม material ระยะสั้น), **deep** (promote ข้อเท็จจริงที่คงทน
ลงใน `MEMORY.md`) และ **REM** (สะท้อนและนำ themes ขึ้นมาแสดง)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชตด้วย `/dreaming on|off` (หรือตรวจสอบด้วย `/dreaming status`)
  ผู้เรียกจาก channel ต้องเป็นเจ้าของจึงจะเปลี่ยนการตั้งค่าได้; Gateway clients ต้องมี
  `operator.admin` สถานะและความช่วยเหลือแบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับ
  ผู้ส่งคำสั่งที่ได้รับอนุญาต
- Dreaming ทำงานตามกำหนด sweep ที่จัดการไว้หนึ่งรายการ (`dreaming.frequency`) และเรียกใช้เฟสตามลำดับ: light, REM, deep
- เฉพาะเฟส deep เท่านั้นที่เขียนหน่วยความจำถาวรลงใน `MEMORY.md`
- ผลลัพธ์ของเฟสและรายการไดอารี่ที่มนุษย์อ่านได้จะถูกเขียนลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่) พร้อมรายงานต่อเฟสแบบไม่บังคับใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณถ่วงน้ำหนัก: ความถี่ของ recall, ความเกี่ยวข้องของ retrieval, ความหลากหลายของคำค้น, ความใหม่ตามเวลา, การรวบรวมข้ามวัน และความสมบูรณ์ของแนวคิดที่อนุมานได้
- Promotion จะอ่าน live daily note ซ้ำก่อนเขียนลง `MEMORY.md` ดังนั้น snippets ระยะสั้นที่ถูกแก้ไขหรือลบจะไม่ถูก promote จาก snapshots ของ recall store ที่ล้าสมัย
- การเรียกใช้งานตามกำหนดและการเรียก `memory promote` ด้วยตนเองใช้ค่าเริ่มต้นของเฟส deep เดียวกัน เว้นแต่คุณจะส่งค่า threshold overrides ผ่าน CLI
- การเรียกใช้งานอัตโนมัติจะกระจายไปยัง memory workspaces ที่กำหนดค่าไว้

การกำหนดเวลาเริ่มต้น:

- **จังหวะ sweep**: `dreaming.frequency = 0 3 * * *`
- **thresholds ของ deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` พิมพ์รายละเอียดต่อเฟส (provider, model, sources, batch activity)
- `memory status` รวม path เพิ่มเติมใด ๆ ที่กำหนดค่าผ่าน `memorySearch.extraPaths`
- หากฟิลด์คีย์ API ระยะไกลของ active memory ที่มีผลถูกกำหนดค่าเป็น SecretRefs คำสั่งจะ resolve ค่าเหล่านั้นจาก snapshot ของ gateway ที่ active หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวอย่างรวดเร็ว
- หมายเหตุเรื่องความคลาดเคลื่อนของเวอร์ชัน Gateway: path คำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งคืนข้อผิดพลาด unknown-method
- ปรับจังหวะ sweep ตามกำหนดด้วย `dreaming.frequency` นโยบาย deep promotion นอกเหนือจากนี้เป็นภายใน ยกเว้น `dreaming.phases.deep.maxPromotedSnippetTokens` ซึ่งจำกัดความยาว snippet ที่ promoted โดยยังคงแสดง provenance ไว้ ใช้ flags ของ CLI กับ `memory promote` เมื่อคุณต้องการ threshold overrides แบบใช้ครั้งเดียวด้วยตนเอง
- `memory rem-harness --path <file-or-dir> --grounded` แสดงตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จาก daily notes ในอดีตโดยไม่เขียนสิ่งใด
- `memory rem-backfill --path <file-or-dir>` เขียนรายการไดอารี่แบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md` เพื่อการตรวจทานใน UI
- `memory rem-backfill --path <file-or-dir> --stage-short-term` ยัง seed grounded durable candidates ลงใน live short-term promotion store เพื่อให้เฟส deep ปกติสามารถจัดอันดับได้
- `memory rem-backfill --rollback` ลบรายการไดอารี่แบบ grounded ที่เขียนไว้ก่อนหน้า และ `memory rem-backfill --rollback-short-term` ลบ grounded short-term candidates ที่ stage ไว้ก่อนหน้า
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายเฟสทั้งหมดและข้อมูลอ้างอิงการกำหนดค่า

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
