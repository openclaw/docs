---
read_when:
    - คุณกำลังดีบักการปฏิเสธคำขอจากผู้ให้บริการที่เชื่อมโยงกับรูปแบบของทรานสคริปต์
    - คุณกำลังเปลี่ยนตรรกะการ sanitize ทรานสคริปต์หรือการซ่อมแซม tool-call
    - คุณกำลังตรวจสอบความไม่ตรงกันของ tool-call id ข้ามผู้ให้บริการ
summary: 'ข้อมูลอ้างอิง: กฎการ sanitize และซ่อมแซมทรานสคริปต์เฉพาะผู้ให้บริการ'
title: สุขอนามัยของทรานสคริปต์
x-i18n:
    generated_at: "2026-04-23T10:23:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# สุขอนามัยของทรานสคริปต์ (การแก้ไขเฉพาะผู้ให้บริการ)

เอกสารนี้อธิบาย **การแก้ไขเฉพาะผู้ให้บริการ** ที่ถูกนำไปใช้กับทรานสคริปต์ก่อนการรัน
(การสร้างบริบทของโมเดล) การปรับเหล่านี้เป็นการแก้ไข **ในหน่วยความจำ**
ที่ใช้เพื่อให้เป็นไปตามข้อกำหนดที่เข้มงวดของผู้ให้บริการ ขั้นตอนสุขอนามัยเหล่านี้จะ **ไม่**
เขียนทับทรานสคริปต์ JSONL ที่จัดเก็บไว้บนดิสก์ อย่างไรก็ตาม มีขั้นตอนการซ่อมแซมไฟล์เซสชันแยกต่างหากที่อาจเขียนทับไฟล์ JSONL ที่ผิดรูปแบบ
โดยการทิ้งบรรทัดที่ไม่ถูกต้องก่อนโหลดเซสชัน เมื่อมีการซ่อมแซมเกิดขึ้น ไฟล์ต้นฉบับ
จะถูกสำรองไว้ข้างไฟล์เซสชัน

ขอบเขตประกอบด้วย:

- การ sanitize tool call id
- การตรวจสอบความถูกต้องของอินพุต tool call
- การซ่อมแซมการจับคู่ tool result
- การตรวจสอบความถูกต้อง / การจัดลำดับของเทิร์น
- การล้าง thought signature
- การ sanitize payload ของภาพ
- การติดแท็กแหล่งที่มาของอินพุตผู้ใช้ (สำหรับพรอมต์ที่ถูกกำหนดเส้นทางข้ามเซสชัน)

หากคุณต้องการรายละเอียดการจัดเก็บทรานสคริปต์ ดู:

- [/reference/session-management-compaction](/th/reference/session-management-compaction)

---

## ส่วนที่ทำงานนี้

สุขอนามัยของทรานสคริปต์ทั้งหมดถูกรวมศูนย์ไว้ใน embedded runner:

- การเลือกนโยบาย: `src/agents/transcript-policy.ts`
- การนำการ sanitize/ซ่อมแซมไปใช้: `sanitizeSessionHistory` ใน `src/agents/pi-embedded-runner/replay-history.ts`

นโยบายใช้ `provider`, `modelApi` และ `modelId` เพื่อตัดสินใจว่าจะใช้สิ่งใด

แยกจากสุขอนามัยของทรานสคริปต์ ไฟล์เซสชันจะถูกซ่อมแซม (หากจำเป็น) ก่อนโหลด:

- `repairSessionFileIfNeeded` ใน `src/agents/session-file-repair.ts`
- ถูกเรียกจาก `run/attempt.ts` และ `compact.ts` (embedded runner)

---

## กฎทั่วไป: การ sanitize ภาพ

payload ของภาพจะถูก sanitize เสมอเพื่อป้องกันการปฏิเสธจากฝั่งผู้ให้บริการเนื่องจาก
ข้อจำกัดด้านขนาด (ลดขนาด/บีบอัดใหม่สำหรับภาพ base64 ที่มีขนาดใหญ่เกินไป)

สิ่งนี้ยังช่วยควบคุมแรงกดดันด้านโทเค็นจากภาพสำหรับโมเดลที่รองรับ vision ด้วย
โดยทั่วไป ขนาดสูงสุดของภาพที่เล็กลงจะช่วยลดการใช้โทเค็น; ขนาดที่ใหญ่ขึ้นจะคงรายละเอียดไว้มากกว่า

การติดตั้งใช้งาน:

- `sanitizeSessionMessagesImages` ใน `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` ใน `src/agents/tool-images.ts`
- ด้านสูงสุดของภาพสามารถกำหนดค่าได้ผ่าน `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`)

---

## กฎทั่วไป: tool call ที่ผิดรูปแบบ

บล็อก tool-call ของ assistant ที่ไม่มีทั้ง `input` และ `arguments` จะถูกทิ้ง
ก่อนสร้างบริบทของโมเดล วิธีนี้ป้องกันการปฏิเสธจากผู้ให้บริการเนื่องจาก tool call ที่ถูกบันทึกไว้เพียงบางส่วน
(เช่น หลังจากเกิดความล้มเหลวจาก rate limit)

การติดตั้งใช้งาน:

- `sanitizeToolCallInputs` ใน `src/agents/session-transcript-repair.ts`
- ถูกนำไปใช้ใน `sanitizeSessionHistory` ใน `src/agents/pi-embedded-runner/replay-history.ts`

---

## กฎทั่วไป: แหล่งที่มาของอินพุตข้ามเซสชัน

เมื่อเอเจนต์ส่งพรอมต์ไปยังอีกเซสชันหนึ่งผ่าน `sessions_send` (รวมถึง
ขั้นตอน reply/announce ระหว่างเอเจนต์) OpenClaw จะบันทึกเทิร์นผู้ใช้ที่สร้างขึ้นพร้อม:

- `message.provenance.kind = "inter_session"`

metadata นี้ถูกเขียนตอน append ลงทรานสคริปต์และไม่เปลี่ยน role
(`role: "user"` ยังคงเดิมเพื่อความเข้ากันได้กับผู้ให้บริการ) ผู้อ่านทรานสคริปต์สามารถใช้สิ่งนี้
เพื่อหลีกเลี่ยงการตีความพรอมต์ภายในที่ถูกกำหนดเส้นทางว่าเป็นคำสั่งที่มาจากผู้ใช้ปลายทาง

ระหว่างการสร้างบริบทใหม่ OpenClaw จะเติมเครื่องหมายสั้น ๆ `[Inter-session message]`
ไว้หน้าข้อความผู้ใช้เหล่านั้นในหน่วยความจำด้วย เพื่อให้โมเดลแยกความแตกต่างจากคำสั่งของผู้ใช้ปลายทางภายนอกได้

---

## เมทริกซ์ผู้ให้บริการ (พฤติกรรมปัจจุบัน)

**OpenAI / OpenAI Codex**

- การ sanitize ภาพเท่านั้น
- ทิ้ง reasoning signature ที่เป็น orphan (รายการ reasoning ที่อยู่เดี่ยวโดยไม่มี content block ตามหลัง) สำหรับทรานสคริปต์ OpenAI Responses/Codex
- ไม่มีการ sanitize tool call id
- ไม่มีการซ่อมแซมการจับคู่ tool result
- ไม่มีการตรวจสอบความถูกต้องหรือการจัดลำดับเทิร์นใหม่
- ไม่มี synthetic tool result
- ไม่มีการ strip thought signature

**Google (Generative AI / Gemini CLI / Antigravity)**

- การ sanitize tool call id: ตัวอักษรและตัวเลขอย่างเข้มงวดเท่านั้น
- การซ่อมแซมการจับคู่ tool result และ synthetic tool result
- การตรวจสอบความถูกต้องของเทิร์น (การสลับเทิร์นแบบ Gemini)
- การแก้ไขลำดับเทิร์นของ Google (เติม user bootstrap ขนาดเล็กมากไว้ด้านหน้า หากประวัติเริ่มด้วย assistant)
- Antigravity Claude: normalize thinking signature; ทิ้งบล็อก thinking ที่ไม่มีลายเซ็น

**Anthropic / MiniMax (เข้ากันได้กับ Anthropic)**

- การซ่อมแซมการจับคู่ tool result และ synthetic tool result
- การตรวจสอบความถูกต้องของเทิร์น (รวมเทิร์นผู้ใช้ที่ติดกันเพื่อให้เป็นไปตามการสลับเทิร์นอย่างเข้มงวด)

**Mistral (รวมถึงการตรวจจับแบบอิง model-id)**

- การ sanitize tool call id: strict9 (ตัวอักษรและตัวเลข ความยาว 9)

**OpenRouter Gemini**

- การล้าง thought signature: strip ค่า `thought_signature` ที่ไม่ใช่ base64 (คงค่าที่เป็น base64 ไว้)

**อย่างอื่นทั้งหมด**

- การ sanitize ภาพเท่านั้น

---

## พฤติกรรมในอดีต (ก่อน 2026.1.22)

ก่อนรีลีส 2026.1.22 OpenClaw ใช้สุขอนามัยของทรานสคริปต์หลายชั้น:

- **ส่วนขยาย transcript-sanitize** ทำงานในทุกการสร้างบริบทและสามารถ:
  - ซ่อมแซมการจับคู่ tool use/result
  - sanitize tool call id (รวมถึงโหมดไม่เข้มงวดที่คง `_`/`-` ไว้)
- runner ยังทำการ sanitize เฉพาะผู้ให้บริการด้วย ซึ่งเป็นงานซ้ำซ้อน
- มีการกลายพันธุ์เพิ่มเติมนอกนโยบายผู้ให้บริการ รวมถึง:
  - strip แท็ก `<final>` ออกจากข้อความ assistant ก่อนบันทึก
  - ทิ้งเทิร์นข้อผิดพลาดของ assistant ที่ว่างเปล่า
  - ตัดเนื้อหา assistant หลัง tool call

ความซับซ้อนนี้ก่อให้เกิด regression ข้ามผู้ให้บริการ (โดยเฉพาะการจับคู่
`call_id|fc_id` ของ `openai-responses`) การล้างระบบใน 2026.1.22 ได้นำส่วนขยายออก รวมศูนย์
ตรรกะไว้ใน runner และทำให้ OpenAI เป็นแบบ **ไม่แตะต้อง**
นอกเหนือจากการ sanitize ภาพ
