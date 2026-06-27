---
read_when:
    - คุณต้องการเข้าใจว่าหน่วยความจำทำงานอย่างไร
    - คุณต้องการทราบว่าควรเขียนไฟล์หน่วยความจำใด
summary: วิธีที่ OpenClaw จดจำสิ่งต่าง ๆ ข้ามเซสชัน
title: ภาพรวมของหน่วยความจำ
x-i18n:
    generated_at: "2026-06-27T17:27:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw จดจำสิ่งต่าง ๆ โดยเขียน **ไฟล์ Markdown แบบข้อความล้วน** ใน workspace
ของ agent ของคุณ โมเดลจะ "จำ" เฉพาะสิ่งที่ถูกบันทึกลงดิสก์เท่านั้น ไม่มี
สถานะที่ซ่อนอยู่

## วิธีทำงาน

agent ของคุณมีไฟล์ที่เกี่ยวข้องกับหน่วยความจำสามไฟล์:

- **`MEMORY.md`** — หน่วยความจำระยะยาว ข้อเท็จจริง ความชอบ และ
  การตัดสินใจที่คงทน โหลดเมื่อเริ่มทุกเซสชัน DM
- **`memory/YYYY-MM-DD.md`** (หรือ **`memory/YYYY-MM-DD-<slug>.md`**) — บันทึกรายวัน
  บริบทและข้อสังเกตที่กำลังดำเนินอยู่ บันทึกของวันนี้และเมื่อวานจะถูกโหลด
  โดยอัตโนมัติ และตอนนี้ตัวแปรที่มี slug เช่นไฟล์ที่เขียนโดย hook
  session-memory ที่มาพร้อมระบบบน `/new` หรือ `/reset` จะถูกหยิบขึ้นมาพร้อมกับ
  ไฟล์แบบมีวันที่อย่างเดียวด้วย
- **`DREAMS.md`** (ไม่บังคับ) — บันทึก Dreaming และสรุปการกวาด Dreaming
  สำหรับให้มนุษย์ตรวจทาน รวมถึงรายการเติมย้อนหลังจากประวัติที่มีหลักฐานรองรับ

ไฟล์เหล่านี้อยู่ใน workspace ของ agent (ค่าเริ่มต้น `~/.openclaw/workspace`)

## อะไรควรอยู่ที่ไหน

`MEMORY.md` คือชั้นที่กระชับและคัดสรรแล้ว ใช้สำหรับข้อเท็จจริงที่คงทน
ความชอบ การตัดสินใจที่ยืนอยู่ และสรุปสั้น ๆ ที่ควรพร้อมใช้งานเมื่อเริ่ม
เซสชันส่วนตัวหลัก ไม่ได้มีไว้เป็น transcript ดิบ บันทึกรายวัน หรือ archive
แบบครบถ้วน

ไฟล์ `memory/YYYY-MM-DD.md` คือชั้นสำหรับทำงาน ใช้สำหรับบันทึกรายวันแบบละเอียด
ข้อสังเกต สรุปเซสชัน และบริบทดิบที่อาจยังมีประโยชน์ภายหลัง ไฟล์เหล่านี้ถูกทำ
ดัชนีสำหรับ `memory_search` และ `memory_get` แต่จะไม่ถูกใส่เข้าไปใน prompt
bootstrap ปกติในทุก turn

เมื่อเวลาผ่านไป agent ควรกลั่นเนื้อหาที่มีประโยชน์จากบันทึกรายวัน
เข้าไปใน `MEMORY.md` และลบรายการระยะยาวที่ล้าสมัยออก คำสั่ง workspace
ที่สร้างขึ้นและ flow Heartbeat สามารถทำสิ่งนี้เป็นระยะได้ คุณไม่จำเป็นต้อง
แก้ไข `MEMORY.md` เองสำหรับรายละเอียดทุกอย่างที่ต้องจำ

ถ้า `MEMORY.md` โตเกินงบไฟล์ bootstrap OpenClaw จะเก็บไฟล์บนดิสก์ไว้ครบถ้วน
แต่จะตัดทอนสำเนาที่ใส่เข้าไปในบริบทของโมเดล ให้มองสิ่งนี้เป็นสัญญาณให้ย้าย
เนื้อหาแบบละเอียดกลับไปที่ `memory/*.md` เก็บเฉพาะสรุปที่คงทนไว้ใน
`MEMORY.md` หรือเพิ่มขีดจำกัด bootstrap ถ้าคุณตั้งใจจะใช้งบ prompt มากขึ้น
ใช้ `/context list`, `/context detail` หรือ `openclaw doctor` เพื่อดูขนาดดิบ
เทียบกับขนาดที่ถูกใส่เข้าไป และสถานะการตัดทอน

<Tip>
ถ้าคุณต้องการให้ agent จำบางอย่าง แค่บอกมันว่า: "จำไว้ว่าฉันชอบ TypeScript"
มันจะเขียนสิ่งนั้นลงในไฟล์ที่เหมาะสม
</Tip>

## หน่วยความจำที่ไวต่อการกระทำ

หน่วยความจำส่วนใหญ่เขียนเป็นบันทึก Markdown ปกติได้ แต่บางหน่วยความจำส่งผลต่อสิ่งที่ agent ควรทำภายหลัง สำหรับกรณีเหล่านั้น ให้บันทึกว่าเมื่อใดจึงปลอดภัยที่จะดำเนินการตามบันทึกนั้น ไม่ใช่บันทึกแค่ข้อเท็จจริงเอง

ให้บันทึกขอบเขตการกระทำนั้นเมื่อบันทึกเกี่ยวข้องกับ:

- ข้อกำหนดด้านการอนุมัติหรือสิทธิ์อนุญาต
- ข้อจำกัดชั่วคราว
- การส่งต่องานไปยังเซสชัน เธรด หรือบุคคลอื่น
- เงื่อนไขหมดอายุ
- เวลาที่ปลอดภัยสำหรับการดำเนินการ
- อำนาจของแหล่งที่มาหรือเจ้าของ
- คำสั่งให้หลีกเลี่ยงการกระทำที่ดูน่าทำ

หน่วยความจำที่ไวต่อการกระทำที่มีประโยชน์ควรทำให้ชัดเจนว่า:

- อะไรเปลี่ยนพฤติกรรมในอนาคต
- ใช้เมื่อใดหรือภายใต้เงื่อนไขใด
- หมดอายุเมื่อใด หรืออะไรที่ปลดล็อกให้ดำเนินการได้
- agent ควรหลีกเลี่ยงการทำอะไร
- ใครคือแหล่งที่มาหรือเจ้าของ ถ้าสิ่งนั้นส่งผลต่อความน่าเชื่อถือหรืออำนาจ

หน่วยความจำสามารถรักษาบริบทการอนุมัติไว้ได้ แต่ไม่ได้บังคับใช้นโยบาย ใช้การตั้งค่าการอนุมัติของ OpenClaw, sandboxing และงานตามกำหนดเวลา สำหรับการควบคุมการปฏิบัติงานที่เข้มงวด

ตัวอย่าง:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

อีกตัวอย่าง:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

ใช้ [commitments](/th/concepts/commitments) สำหรับงานติดตามผลที่อนุมานได้และมีอายุสั้น ใช้ [งานตามกำหนดเวลา](/th/automation/cron-jobs) สำหรับการเตือนที่แน่นอน การตรวจตามเวลา และงานที่เกิดซ้ำ หน่วยความจำยังสามารถสรุปบริบทที่คงทนรอบเส้นทางใดเส้นทางหนึ่งได้

นี่ไม่ใช่ schema ที่บังคับสำหรับทุกหน่วยความจำ ข้อเท็จจริงง่าย ๆ สามารถเขียนให้กระชับได้ ใช้ขอบเขตที่ไวต่อการกระทำเมื่อการสูญเสียบริบทด้านเวลา อำนาจ การหมดอายุ หรือความปลอดภัยในการดำเนินการ อาจทำให้ agent ทำสิ่งผิดในภายหลัง

## commitment ที่อนุมานได้

งานติดตามผลในอนาคตบางอย่างไม่ใช่ข้อเท็จจริงที่คงทน ถ้าคุณพูดถึงการสัมภาษณ์
พรุ่งนี้ หน่วยความจำที่มีประโยชน์อาจเป็น "ตรวจสอบหลังการสัมภาษณ์" ไม่ใช่
"เก็บสิ่งนี้ไว้ตลอดไปใน `MEMORY.md`"

[Commitments](/th/concepts/commitments) คือหน่วยความจำติดตามผลแบบ opt-in
และมีอายุสั้นสำหรับกรณีนี้ OpenClaw อนุมานสิ่งเหล่านี้ในรอบเบื้องหลังที่ซ่อนอยู่
จำกัดขอบเขตไว้ที่ agent และช่องทางเดียวกัน และส่งการเช็กอินที่ถึงกำหนดผ่าน
Heartbeat การเตือนแบบชัดเจนยังคงใช้ [งานตามกำหนดเวลา](/th/automation/cron-jobs)

## เครื่องมือหน่วยความจำ

agent มีเครื่องมือสองอย่างสำหรับทำงานกับหน่วยความจำ:

- **`memory_search`** — ค้นหาบันทึกที่เกี่ยวข้องด้วยการค้นหาเชิงความหมาย แม้เมื่อ
  ถ้อยคำแตกต่างจากต้นฉบับ
- **`memory_get`** — อ่านไฟล์หน่วยความจำหรือช่วงบรรทัดที่ระบุ

เครื่องมือทั้งสองจัดเตรียมโดย Plugin Active Memory (ค่าเริ่มต้น: `memory-core`)

## Plugin คู่ของ Memory Wiki

ถ้าคุณต้องการให้หน่วยความจำที่คงทนทำตัวเหมือนฐานความรู้ที่ดูแลรักษามากกว่า
เป็นเพียงบันทึกดิบ ให้ใช้ Plugin `memory-wiki` ที่มาพร้อมระบบ

`memory-wiki` คอมไพล์ความรู้ที่คงทนเป็น vault wiki โดยมี:

- โครงสร้างหน้าที่กำหนดได้แน่นอน
- claim และหลักฐานแบบมีโครงสร้าง
- การติดตามความขัดแย้งและความสดใหม่
- dashboard ที่สร้างขึ้น
- digest ที่คอมไพล์แล้วสำหรับผู้ใช้ระดับ agent/runtime
- เครื่องมือแบบ wiki-native เช่น `wiki_search`, `wiki_get`, `wiki_apply` และ `wiki_lint`

มันไม่ได้แทนที่ Plugin Active Memory Plugin Active Memory ยังเป็นเจ้าของ
การเรียกคืน การเลื่อนสถานะ และ Dreaming `memory-wiki` เพิ่มชั้นความรู้
ที่มี provenance สูงไว้ข้าง ๆ

ดู [Memory Wiki](/th/plugins/memory-wiki)

## การค้นหาหน่วยความจำ

เมื่อกำหนดค่า provider สำหรับ embedding แล้ว `memory_search` จะใช้ **การค้นหาแบบไฮบริด**
โดยผสานความคล้ายคลึงแบบเวกเตอร์ (ความหมายเชิงความหมาย) กับการจับคู่ keyword
(คำที่ตรงกัน เช่น ID และสัญลักษณ์โค้ด) สิ่งนี้ใช้งานได้ทันทีเมื่อคุณมี
API key สำหรับ provider ที่รองรับรายใดก็ได้

<Info>
OpenClaw ใช้ embedding ของ OpenAI เป็นค่าเริ่มต้น ตั้งค่า
`agents.defaults.memorySearch.provider` อย่างชัดเจนเพื่อใช้ Gemini, Voyage,
Mistral, local, Ollama, Bedrock, GitHub Copilot หรือ embedding
ที่เข้ากันได้กับ OpenAI
</Info>

สำหรับรายละเอียดเกี่ยวกับวิธีทำงานของการค้นหา ตัวเลือกการปรับแต่ง และการตั้งค่า provider ดู
[การค้นหาหน่วยความจำ](/th/concepts/memory-search)

## backend หน่วยความจำ

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/th/concepts/memory-builtin">
ใช้ SQLite เป็นฐาน ใช้งานได้ทันทีพร้อมการค้นหา keyword ความคล้ายคลึงแบบเวกเตอร์ และ
การค้นหาแบบไฮบริด ไม่ต้องมี dependency เพิ่มเติม
</Card>
<Card title="QMD" icon="search" href="/th/concepts/memory-qmd">
sidecar แบบ local-first ที่มีการ rerank การขยาย query และความสามารถในการทำดัชนี
directory นอก workspace
</Card>
<Card title="Honcho" icon="brain" href="/th/concepts/memory-honcho">
หน่วยความจำข้ามเซสชันแบบ AI-native พร้อมการสร้างโมเดลผู้ใช้ การค้นหาเชิงความหมาย และ
การรับรู้หลาย agent ติดตั้งเป็น Plugin
</Card>
<Card title="LanceDB" icon="layers" href="/th/plugins/memory-lancedb">
หน่วยความจำที่มาพร้อมระบบและใช้ LanceDB เป็นฐาน พร้อม embedding ที่เข้ากันได้กับ OpenAI,
auto-recall, auto-capture และการรองรับ embedding ของ Ollama แบบ local
</Card>
</CardGroup>

## ชั้น wiki ความรู้

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/th/plugins/memory-wiki">
คอมไพล์หน่วยความจำที่คงทนเป็น vault wiki ที่มี provenance สูง พร้อม claim,
dashboard, bridge mode และ workflow ที่เป็นมิตรกับ Obsidian
</Card>
</CardGroup>

## การ flush หน่วยความจำอัตโนมัติ

ก่อนที่ [Compaction](/th/concepts/compaction) จะสรุปการสนทนาของคุณ OpenClaw
จะรัน turn เงียบที่เตือน agent ให้บันทึกบริบทสำคัญลงในไฟล์หน่วยความจำ
สิ่งนี้เปิดเป็นค่าเริ่มต้น คุณไม่จำเป็นต้องกำหนดค่าใด ๆ

เพื่อให้ turn งานดูแลนี้อยู่บนโมเดล local ให้ตั้งค่า override โมเดล memory-flush
แบบเจาะจง:

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

override นี้ใช้เฉพาะกับ turn memory-flush และไม่สืบทอด fallback chain
ของเซสชันที่กำลังใช้งานอยู่

<Tip>
การ flush หน่วยความจำป้องกันการสูญเสียบริบทระหว่าง Compaction ถ้า agent ของคุณมี
ข้อเท็จจริงสำคัญในการสนทนาที่ยังไม่ได้เขียนลงไฟล์ ข้อเท็จจริงเหล่านั้น
จะถูกบันทึกโดยอัตโนมัติก่อนที่การสรุปจะเกิดขึ้น
</Tip>

## Dreaming

Dreaming คือรอบ consolidation เบื้องหลังแบบไม่บังคับสำหรับหน่วยความจำ มันรวบรวม
สัญญาณระยะสั้น ให้คะแนน candidate และเลื่อนสถานะเฉพาะรายการที่ผ่านคุณสมบัติ
เข้าสู่หน่วยความจำระยะยาว (`MEMORY.md`)

ออกแบบมาเพื่อรักษาให้หน่วยความจำระยะยาวมีสัญญาณสูง:

- **Opt-in**: ปิดเป็นค่าเริ่มต้น
- **ตามกำหนดเวลา**: เมื่อเปิดใช้งาน `memory-core` จะจัดการ cron job ที่เกิดซ้ำหนึ่งงาน
  สำหรับการกวาด Dreaming แบบเต็มโดยอัตโนมัติ
- **มี threshold**: การเลื่อนสถานะต้องผ่านประตูด้านคะแนน ความถี่การ recall และ
  ความหลากหลายของ query
- **ตรวจทานได้**: สรุป phase และรายการบันทึกถูกเขียนไปยัง `DREAMS.md`
  เพื่อให้มนุษย์ตรวจทาน

สำหรับพฤติกรรมของ phase สัญญาณการให้คะแนน และรายละเอียดบันทึก Dreaming ดู
[Dreaming](/th/concepts/dreaming)

## การเติมย้อนหลังที่มีหลักฐานรองรับและการเลื่อนสถานะแบบสด

ตอนนี้ระบบ Dreaming มี lane ตรวจทานที่เกี่ยวข้องกันอย่างใกล้ชิดสองแบบ:

- **Dreaming แบบสด** ทำงานจาก store Dreaming ระยะสั้นภายใต้
  `memory/.dreams/` และเป็นสิ่งที่ phase ลึกปกติใช้เมื่อตัดสินใจว่าอะไร
  สามารถเลื่อนชั้นเข้า `MEMORY.md` ได้
- **การเติมย้อนหลังที่มีหลักฐานรองรับ** อ่านบันทึกประวัติ `memory/YYYY-MM-DD.md`
  เป็นไฟล์รายวันแบบ standalone และเขียนผลลัพธ์การตรวจทานแบบมีโครงสร้างลงใน `DREAMS.md`

การเติมย้อนหลังที่มีหลักฐานรองรับมีประโยชน์เมื่อคุณต้องการ replay บันทึกเก่าและตรวจดูว่า
ระบบคิดว่าอะไรคงทน โดยไม่ต้องแก้ไข `MEMORY.md` เอง

เมื่อคุณใช้:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

candidate ที่คงทนและมีหลักฐานรองรับจะไม่ถูกเลื่อนสถานะโดยตรง แต่จะถูก stage เข้าไปใน
store Dreaming ระยะสั้นเดียวกันที่ phase ลึกปกติใช้อยู่แล้ว นั่นหมายความว่า:

- `DREAMS.md` ยังคงเป็นพื้นผิวสำหรับให้มนุษย์ตรวจทาน
- store ระยะสั้นยังคงเป็นพื้นผิวการจัดอันดับสำหรับเครื่อง
- `MEMORY.md` ยังคงถูกเขียนโดยการเลื่อนสถานะแบบลึกเท่านั้น

ถ้าคุณตัดสินใจว่า replay ไม่มีประโยชน์ คุณสามารถลบ artifact ที่ stage ไว้
โดยไม่แตะรายการบันทึกปกติหรือสถานะ recall ปกติ:

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

- [engine หน่วยความจำในตัว](/th/concepts/memory-builtin): backend SQLite เริ่มต้น
- [engine หน่วยความจำ QMD](/th/concepts/memory-qmd): sidecar แบบ local-first ขั้นสูง
- [หน่วยความจำ Honcho](/th/concepts/memory-honcho): หน่วยความจำข้ามเซสชันแบบ AI-native
- [Memory LanceDB](/th/plugins/memory-lancedb): Plugin ที่ใช้ LanceDB เป็นฐานพร้อม embedding ที่เข้ากันได้กับ OpenAI
- [Memory Wiki](/th/plugins/memory-wiki): vault ความรู้ที่คอมไพล์แล้วและเครื่องมือแบบ wiki-native
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search): pipeline การค้นหา, provider และการปรับแต่ง
- [Dreaming](/th/concepts/dreaming): การเลื่อนสถานะเบื้องหลังจาก recall ระยะสั้นสู่หน่วยความจำระยะยาว
- [อ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config): ปุ่มปรับ config ทั้งหมด
- [Compaction](/th/concepts/compaction): วิธีที่ Compaction โต้ตอบกับหน่วยความจำ

## ที่เกี่ยวข้อง

- [Active Memory](/th/concepts/active-memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [engine หน่วยความจำในตัว](/th/concepts/memory-builtin)
- [หน่วยความจำ Honcho](/th/concepts/memory-honcho)
- [Memory LanceDB](/th/plugins/memory-lancedb)
- [Commitments](/th/concepts/commitments)
