---
read_when:
    - คุณต้องการทำความเข้าใจว่าหน่วยความจำทำงานอย่างไร
    - คุณต้องการทราบว่าจะเขียนไฟล์หน่วยความจำใด
summary: OpenClaw จดจำสิ่งต่าง ๆ ข้ามเซสชันอย่างไร
title: ภาพรวมหน่วยความจำ
x-i18n:
    generated_at: "2026-04-30T09:46:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw จดจำสิ่งต่าง ๆ โดยเขียน **ไฟล์ Markdown ธรรมดา** ใน workspace ของ agent ของคุณ โมเดลจะ "จดจำ" เฉพาะสิ่งที่ถูกบันทึกลงดิสก์เท่านั้น — ไม่มีสถานะที่ซ่อนอยู่

## วิธีการทำงาน

agent ของคุณมีไฟล์ที่เกี่ยวข้องกับหน่วยความจำสามไฟล์:

- **`MEMORY.md`** — หน่วยความจำระยะยาว ข้อเท็จจริง ค่ากำหนด และการตัดสินใจที่คงทน โหลดเมื่อเริ่มต้นทุกเซสชัน DM
- **`memory/YYYY-MM-DD.md`** — บันทึกรายวัน บริบทและข้อสังเกตที่ดำเนินอยู่ บันทึกของวันนี้และเมื่อวานจะถูกโหลดโดยอัตโนมัติ
- **`DREAMS.md`** (ไม่บังคับ) — Dream Diary และสรุปการกวาด Dreaming สำหรับให้มนุษย์ตรวจทาน รวมถึงรายการเติมย้อนหลังเชิงประวัติที่มีหลักยึด

ไฟล์เหล่านี้อยู่ใน workspace ของ agent (ค่าเริ่มต้น `~/.openclaw/workspace`)

<Tip>
หากคุณต้องการให้ agent จดจำบางอย่าง แค่บอกมันว่า: "จำไว้ว่าฉันชอบ TypeScript" มันจะเขียนสิ่งนั้นไปยังไฟล์ที่เหมาะสม
</Tip>

## ข้อผูกพันที่อนุมาน

การติดตามผลในอนาคตบางอย่างไม่ใช่ข้อเท็จจริงที่คงทน หากคุณกล่าวถึงการสัมภาษณ์พรุ่งนี้ หน่วยความจำที่มีประโยชน์อาจเป็น "ตรวจสอบหลังการสัมภาษณ์" ไม่ใช่ "เก็บสิ่งนี้ไว้ใน `MEMORY.md` ตลอดไป"

[ข้อผูกพัน](/th/concepts/commitments) คือหน่วยความจำการติดตามผลแบบเลือกใช้และมีอายุสั้นสำหรับกรณีนั้น OpenClaw อนุมานสิ่งเหล่านี้ในขั้นตอนเบื้องหลังที่ซ่อนอยู่ จำกัดขอบเขตไว้ที่ agent และช่องทางเดียวกัน และส่งการเช็กอินที่ถึงกำหนดผ่าน heartbeat การแจ้งเตือนแบบชัดเจนยังคงใช้ [งานตามกำหนดเวลา](/th/automation/cron-jobs)

## เครื่องมือหน่วยความจำ

agent มีเครื่องมือสองตัวสำหรับทำงานกับหน่วยความจำ:

- **`memory_search`** — ค้นหาบันทึกที่เกี่ยวข้องโดยใช้การค้นหาเชิงความหมาย แม้ถ้อยคำจะแตกต่างจากต้นฉบับ
- **`memory_get`** — อ่านไฟล์หน่วยความจำหรือช่วงบรรทัดที่ระบุ

เครื่องมือทั้งสองมาจาก Plugin active memory (ค่าเริ่มต้น: `memory-core`)

## Plugin คู่หู Memory Wiki

หากคุณต้องการให้หน่วยความจำที่คงทนทำงานคล้ายฐานความรู้ที่ได้รับการดูแลมากกว่าบันทึกดิบ ให้ใช้ Plugin `memory-wiki` ที่รวมมาให้

`memory-wiki` คอมไพล์ความรู้ที่คงทนเป็นคลัง wiki ที่มี:

- โครงสร้างหน้าที่กำหนดได้แน่นอน
- คำกล่าวอ้างและหลักฐานแบบมีโครงสร้าง
- การติดตามความขัดแย้งและความสดใหม่
- แดชบอร์ดที่สร้างขึ้น
- ไดเจสต์ที่คอมไพล์แล้วสำหรับผู้ใช้งาน agent/runtime
- เครื่องมือที่เป็น wiki-native เช่น `wiki_search`, `wiki_get`, `wiki_apply` และ `wiki_lint`

สิ่งนี้ไม่ได้แทนที่ Plugin active memory Plugin active memory ยังคงเป็นเจ้าของการเรียกคืน การเลื่อนระดับ และ Dreaming `memory-wiki` เพิ่มชั้นความรู้ที่อุดมด้วยแหล่งที่มาควบคู่ไปกับมัน

ดู [Memory Wiki](/th/plugins/memory-wiki)

## การค้นหาหน่วยความจำ

เมื่อกำหนดค่า embedding provider แล้ว `memory_search` จะใช้ **การค้นหาแบบไฮบริด** — รวมความคล้ายคลึงของเวกเตอร์ (ความหมายเชิงความหมาย) กับการจับคู่คำสำคัญ (คำที่ตรงกันพอดี เช่น ID และสัญลักษณ์โค้ด) สิ่งนี้ใช้งานได้ทันทีเมื่อคุณมี API key สำหรับ provider ที่รองรับใด ๆ

<Info>
OpenClaw ตรวจหา embedding provider ของคุณโดยอัตโนมัติจาก API key ที่มีอยู่ หากคุณกำหนดค่า key ของ OpenAI, Gemini, Voyage หรือ Mistral ไว้ การค้นหาหน่วยความจำจะเปิดใช้งานโดยอัตโนมัติ
</Info>

สำหรับรายละเอียดเกี่ยวกับวิธีทำงานของการค้นหา ตัวเลือกการปรับแต่ง และการตั้งค่า provider โปรดดู
[Memory Search](/th/concepts/memory-search)

## แบ็กเอนด์หน่วยความจำ

<CardGroup cols={3}>
<Card title="Builtin (ค่าเริ่มต้น)" icon="database" href="/th/concepts/memory-builtin">
ใช้ SQLite เป็นฐาน ใช้งานได้ทันทีพร้อมการค้นหาคำสำคัญ ความคล้ายคลึงของเวกเตอร์ และการค้นหาแบบไฮบริด ไม่มี dependency เพิ่มเติม
</Card>
<Card title="QMD" icon="search" href="/th/concepts/memory-qmd">
sidecar แบบ local-first พร้อมการ rerank การขยาย query และความสามารถในการทำดัชนีไดเรกทอรีนอก workspace
</Card>
<Card title="Honcho" icon="brain" href="/th/concepts/memory-honcho">
หน่วยความจำข้ามเซสชันแบบ AI-native พร้อมการสร้างแบบจำลองผู้ใช้ การค้นหาเชิงความหมาย และการรับรู้หลาย agent ติดตั้งเป็น Plugin
</Card>
<Card title="LanceDB" icon="layers" href="/th/plugins/memory-lancedb">
หน่วยความจำที่ใช้ LanceDB เป็นฐานซึ่งรวมมาให้ พร้อม embeddings ที่เข้ากันได้กับ OpenAI, auto-recall, auto-capture และการรองรับ embedding ของ Ollama ในเครื่อง
</Card>
</CardGroup>

## ชั้น Knowledge wiki

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/th/plugins/memory-wiki">
คอมไพล์หน่วยความจำที่คงทนเป็นคลัง wiki ที่อุดมด้วยแหล่งที่มา พร้อมคำกล่าวอ้าง แดชบอร์ด โหมด bridge และ workflow ที่เป็นมิตรกับ Obsidian
</Card>
</CardGroup>

## การ flush หน่วยความจำอัตโนมัติ

ก่อนที่ [Compaction](/th/concepts/compaction) จะสรุปบทสนทนาของคุณ OpenClaw จะรัน turn แบบเงียบที่เตือน agent ให้บันทึกบริบทสำคัญลงไฟล์หน่วยความจำ สิ่งนี้เปิดอยู่ตามค่าเริ่มต้น — คุณไม่จำเป็นต้องกำหนดค่าใด ๆ

หากต้องการให้ turn การดูแลนี้อยู่บนโมเดลในเครื่อง ให้ตั้งค่า override โมเดล memory-flush แบบเจาะจง:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

override นี้ใช้เฉพาะกับ turn memory-flush และไม่สืบทอด fallback chain ของเซสชันที่ใช้งานอยู่

<Tip>
memory flush ป้องกันการสูญเสียบริบทระหว่าง Compaction หาก agent ของคุณมีข้อเท็จจริงสำคัญในบทสนทนาที่ยังไม่ได้เขียนลงไฟล์ สิ่งเหล่านั้นจะถูกบันทึกโดยอัตโนมัติก่อนการสรุปจะเกิดขึ้น
</Tip>

## Dreaming

Dreaming คือขั้นตอน consolidation เบื้องหลังแบบไม่บังคับสำหรับหน่วยความจำ มันรวบรวมสัญญาณระยะสั้น ให้คะแนน candidate และเลื่อนระดับเฉพาะรายการที่ผ่านคุณสมบัติไปยังหน่วยความจำระยะยาว (`MEMORY.md`)

สิ่งนี้ออกแบบมาเพื่อรักษาให้หน่วยความจำระยะยาวมีสัญญาณคุณภาพสูง:

- **เลือกใช้**: ปิดใช้งานตามค่าเริ่มต้น
- **ตามกำหนดเวลา**: เมื่อเปิดใช้งาน `memory-core` จะจัดการ cron job ที่เกิดซ้ำหนึ่งรายการโดยอัตโนมัติสำหรับการกวาด Dreaming เต็มรูปแบบ
- **มี threshold**: การเลื่อนระดับต้องผ่านเกณฑ์คะแนน ความถี่การเรียกคืน และความหลากหลายของ query
- **ตรวจทานได้**: สรุป phase และรายการ diary จะถูกเขียนไปยัง `DREAMS.md` เพื่อให้มนุษย์ตรวจทาน

สำหรับพฤติกรรมของ phase สัญญาณการให้คะแนน และรายละเอียด Dream Diary โปรดดู
[Dreaming](/th/concepts/dreaming)

## การเติมย้อนหลังที่มีหลักยึดและการเลื่อนระดับสด

ระบบ Dreaming ตอนนี้มี lane การตรวจทานที่เกี่ยวข้องกันอย่างใกล้ชิดสองแบบ:

- **Live dreaming** ทำงานจาก store Dreaming ระยะสั้นภายใต้ `memory/.dreams/` และเป็นสิ่งที่ phase เชิงลึกปกติใช้เมื่อตัดสินใจว่าสิ่งใดสามารถเลื่อนขึ้นไปเป็น `MEMORY.md` ได้
- **Grounded backfill** อ่านบันทึกเชิงประวัติ `memory/YYYY-MM-DD.md` เป็นไฟล์รายวันแบบ standalone และเขียนผลลัพธ์การตรวจทานแบบมีโครงสร้างไปยัง `DREAMS.md`

Grounded backfill มีประโยชน์เมื่อคุณต้องการเล่นซ้ำบันทึกเก่าและตรวจสอบว่าระบบคิดว่าสิ่งใดคงทน โดยไม่ต้องแก้ไข `MEMORY.md` ด้วยตนเอง

เมื่อคุณใช้:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

candidate ที่คงทนและมีหลักยึดจะไม่ถูกเลื่อนระดับโดยตรง แต่จะถูก stage เข้าไปใน store Dreaming ระยะสั้นเดียวกับที่ phase เชิงลึกปกติใช้อยู่แล้ว นั่นหมายความว่า:

- `DREAMS.md` ยังคงเป็นพื้นผิวการตรวจทานสำหรับมนุษย์
- store ระยะสั้นยังคงเป็นพื้นผิวการจัดอันดับสำหรับเครื่อง
- `MEMORY.md` ยังคงถูกเขียนโดยการเลื่อนระดับเชิงลึกเท่านั้น

หากคุณตัดสินใจว่าการเล่นซ้ำไม่มีประโยชน์ คุณสามารถลบ artifact ที่ถูก stage ได้โดยไม่แตะต้องรายการ diary ปกติหรือสถานะ recall ปกติ:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## อ่านเพิ่มเติม

- [เอนจินหน่วยความจำ Builtin](/th/concepts/memory-builtin): แบ็กเอนด์ SQLite ค่าเริ่มต้น
- [เอนจินหน่วยความจำ QMD](/th/concepts/memory-qmd): sidecar local-first ขั้นสูง
- [หน่วยความจำ Honcho](/th/concepts/memory-honcho): หน่วยความจำข้ามเซสชันแบบ AI-native
- [Memory LanceDB](/th/plugins/memory-lancedb): Plugin ที่ใช้ LanceDB เป็นฐานพร้อม embeddings ที่เข้ากันได้กับ OpenAI
- [Memory Wiki](/th/plugins/memory-wiki): คลังความรู้ที่คอมไพล์แล้วและเครื่องมือ wiki-native
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search): pipeline การค้นหา, provider และการปรับแต่ง
- [Dreaming](/th/concepts/dreaming): การเลื่อนระดับเบื้องหลังจาก recall ระยะสั้นไปยังหน่วยความจำระยะยาว
- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config): knobs การกำหนดค่าทั้งหมด
- [Compaction](/th/concepts/compaction): วิธีที่ Compaction โต้ตอบกับหน่วยความจำ

## ที่เกี่ยวข้อง

- [Active memory](/th/concepts/active-memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [เอนจินหน่วยความจำ Builtin](/th/concepts/memory-builtin)
- [หน่วยความจำ Honcho](/th/concepts/memory-honcho)
- [Memory LanceDB](/th/plugins/memory-lancedb)
- [ข้อผูกพัน](/th/concepts/commitments)
