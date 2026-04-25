---
read_when:
    - คุณกำลังดีบักการปฏิเสธคำขอของ provider ที่เชื่อมโยงกับรูปแบบของ transcript
    - คุณกำลังเปลี่ยนตรรกะการทำให้ transcript ปลอดภัยหรือการซ่อมแซมการเรียก tool
    - คุณกำลังตรวจสอบความไม่ตรงกันของรหัสการเรียก tool ระหว่าง providers
summary: 'ข้อมูลอ้างอิง: กฎการทำให้ transcript ปลอดภัยและการซ่อมแซมเฉพาะของ provider'
title: สุขอนามัยของ transcript
x-i18n:
    generated_at: "2026-04-25T13:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

เอกสารนี้อธิบาย **การแก้ไขเฉพาะของ provider** ที่นำไปใช้กับ transcript ก่อนเริ่มการรัน
(การสร้าง context ของโมเดล) การปรับเหล่านี้เป็นการปรับ **ในหน่วยความจำ**
เพื่อให้เป็นไปตามข้อกำหนดที่เข้มงวดของ provider ขั้นตอนด้านสุขอนามัยเหล่านี้ **จะไม่**
เขียนทับ transcript JSONL ที่เก็บไว้บนดิสก์ อย่างไรก็ตาม กระบวนการซ่อมแซมไฟล์เซสชันแยกต่างหากอาจเขียนไฟล์ JSONL
ที่ผิดรูปแบบใหม่โดยการทิ้งบรรทัดที่ไม่ถูกต้องก่อนโหลดเซสชัน เมื่อมีการซ่อมแซมเกิดขึ้น
ไฟล์ต้นฉบับจะถูกสำรองไว้ข้างไฟล์เซสชัน

ขอบเขตครอบคลุมถึง:

- context ของ prompt แบบ runtime-only ที่ไม่ปะปนอยู่ใน turn ของ transcript ที่ผู้ใช้มองเห็น
- การทำให้รหัสการเรียก tool ปลอดภัย
- การตรวจสอบอินพุตของการเรียก tool
- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool
- การตรวจสอบ / การจัดลำดับ turn
- การล้าง thought signature
- การทำให้ payload ของภาพปลอดภัย
- การติดแท็กแหล่งที่มาของอินพุตผู้ใช้ (สำหรับ prompt ที่กำหนดเส้นทางข้ามเซสชัน)

หากคุณต้องการรายละเอียดเกี่ยวกับการจัดเก็บ transcript โปรดดู:

- [เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

---

## กฎส่วนกลาง: context ของ runtime ไม่ใช่ transcript ของผู้ใช้

สามารถเพิ่ม context ของ runtime/system เข้าไปใน prompt ของโมเดลสำหรับแต่ละ turn ได้ แต่เนื้อหานั้น
ไม่ใช่เนื้อหาที่ผู้ใช้ปลายทางเป็นผู้เขียน OpenClaw จะแยกเนื้อหา prompt
ฝั่ง transcript สำหรับคำตอบของ Gateway, followup ที่อยู่ในคิว, ACP, CLI และการรัน Pi
แบบฝังตัวออกจากกัน turn ของผู้ใช้ที่มองเห็นได้ซึ่งถูกจัดเก็บจะใช้เนื้อหา transcript นี้แทน
prompt ที่ถูกเสริมด้วย runtime

สำหรับเซสชันรุ่นเก่าที่เคยบันทึก wrapper ของ runtime ไว้แล้ว
พื้นผิวประวัติของ Gateway จะใช้การฉายเพื่อการแสดงผลก่อนส่งคืนข้อความให้กับ WebChat,
TUI, REST หรือไคลเอนต์ SSE

---

## จุดที่สิ่งนี้ทำงาน

สุขอนามัยของ transcript ทั้งหมดถูกรวมศูนย์ไว้ใน embedded runner:

- การเลือกนโยบาย: `src/agents/transcript-policy.ts`
- การใช้การทำให้ปลอดภัย/การซ่อมแซม: `sanitizeSessionHistory` ใน `src/agents/pi-embedded-runner/replay-history.ts`

นโยบายนี้ใช้ `provider`, `modelApi` และ `modelId` เพื่อพิจารณาว่าจะใช้สิ่งใด

แยกจากสุขอนามัยของ transcript ไฟล์เซสชันจะถูกซ่อมแซม (ถ้าจำเป็น) ก่อนโหลด:

- `repairSessionFileIfNeeded` ใน `src/agents/session-file-repair.ts`
- ถูกเรียกจาก `run/attempt.ts` และ `compact.ts` (embedded runner)

---

## กฎส่วนกลาง: การทำให้ภาพปลอดภัย

payload ของภาพจะถูกทำให้ปลอดภัยเสมอเพื่อป้องกันการปฏิเสธจากฝั่ง provider อันเนื่องมาจากข้อจำกัดด้านขนาด
(ลดขนาด/บีบอัดใหม่ของภาพ base64 ที่มีขนาดใหญ่เกินไป)

สิ่งนี้ยังช่วยควบคุมแรงกดดันด้านโทเค็นที่เกิดจากภาพสำหรับโมเดลที่รองรับ vision
โดยทั่วไป ขนาดสูงสุดของภาพที่เล็กลงจะช่วยลดการใช้โทเค็น ส่วนขนาดที่ใหญ่ขึ้นจะช่วยคงรายละเอียดไว้

การทำงาน:

- `sanitizeSessionMessagesImages` ใน `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` ใน `src/agents/tool-images.ts`
- ด้านยาวสูงสุดของภาพกำหนดค่าได้ผ่าน `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`)

---

## กฎส่วนกลาง: การเรียก tool ที่ผิดรูปแบบ

บล็อกการเรียก tool ของ assistant ที่ไม่มีทั้ง `input` และ `arguments` จะถูกทิ้ง
ก่อนสร้าง context ของโมเดล วิธีนี้ช่วยป้องกันการปฏิเสธจาก provider ที่เกิดจากการเรียก tool
ซึ่งถูกบันทึกไว้เพียงบางส่วน (เช่น หลังจากความล้มเหลวเพราะ rate limit)

การทำงาน:

- `sanitizeToolCallInputs` ใน `src/agents/session-transcript-repair.ts`
- ถูกใช้ใน `sanitizeSessionHistory` ใน `src/agents/pi-embedded-runner/replay-history.ts`

---

## กฎส่วนกลาง: แหล่งที่มาของอินพุตข้ามเซสชัน

เมื่อ agent ส่ง prompt เข้าไปยังอีกเซสชันผ่าน `sessions_send` (รวมถึง
ขั้นตอน reply/announce แบบ agent-to-agent) OpenClaw จะบันทึก turn ผู้ใช้ที่สร้างขึ้นพร้อมกับ:

- `message.provenance.kind = "inter_session"`

เมทาดาทานี้จะถูกเขียนตอน append transcript และจะไม่เปลี่ยน role
(`role: "user"` ยังคงเดิมเพื่อความเข้ากันได้กับ provider) ตัวอ่าน transcript สามารถใช้สิ่งนี้
เพื่อหลีกเลี่ยงการปฏิบัติต่อ prompt ภายในที่ถูกกำหนดเส้นทางแล้วเสมือนเป็นคำสั่งที่ผู้ใช้ปลายทางเขียน

ระหว่างการสร้าง context ใหม่ OpenClaw จะเติม marker สั้น ๆ `[Inter-session message]`
ไว้ข้างหน้า turn ผู้ใช้เหล่านั้นในหน่วยความจำด้วย เพื่อให้โมเดลแยกความต่างจาก
คำสั่งภายนอกจากผู้ใช้ปลายทางได้

---

## เมทริกซ์ของ provider (พฤติกรรมปัจจุบัน)

**OpenAI / OpenAI Codex**

- ทำให้ภาพปลอดภัยเท่านั้น
- ทิ้ง reasoning signature ที่เป็น orphaned (รายการ reasoning แบบเดี่ยวที่ไม่มี content block ตามหลัง) สำหรับ transcript ของ OpenAI Responses/Codex และทิ้ง OpenAI reasoning ที่ replay ได้หลังจากมีการสลับเส้นทางโมเดล
- ไม่มีการทำให้รหัสการเรียก tool ปลอดภัย
- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool อาจย้ายเอาต์พุตจริงที่จับคู่ได้ และสร้างเอาต์พุต `aborted` แบบ Codex สำหรับการเรียก tool ที่หายไป
- ไม่มีการตรวจสอบหรือจัดลำดับ turn ใหม่
- เอาต์พุต tool ที่หายไปของตระกูล OpenAI Responses จะถูกสร้างเป็น `aborted` เพื่อให้ตรงกับการทำให้ replay ของ Codex เป็นมาตรฐาน
- ไม่มีการลบ thought signature

**Google (Generative AI / Gemini CLI / Antigravity)**

- การทำให้รหัสการเรียก tool ปลอดภัย: ต้องเป็นตัวอักษรและตัวเลขอย่างเคร่งครัด
- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool และผลลัพธ์ tool แบบสังเคราะห์
- การตรวจสอบ turn (การสลับ turn แบบ Gemini)
- การแก้ไขลำดับ turn ของ Google (เติม user bootstrap ขนาดเล็กด้านหน้าหาก history เริ่มต้นด้วย assistant)
- Antigravity Claude: ทำให้ thinking signature เป็นมาตรฐาน; ทิ้งบล็อก thinking ที่ไม่มีลายเซ็น

**Anthropic / Minimax (เข้ากันได้กับ Anthropic)**

- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool และผลลัพธ์ tool แบบสังเคราะห์
- การตรวจสอบ turn (รวม turn ผู้ใช้ที่ติดกันเพื่อให้เป็นไปตามการสลับที่เข้มงวด)

**Mistral (รวมถึงการตรวจจับตาม model-id)**

- การทำให้รหัสการเรียก tool ปลอดภัย: strict9 (ตัวอักษรและตัวเลขยาว 9 ตัว)

**OpenRouter Gemini**

- การล้าง thought signature: ลบค่า `thought_signature` ที่ไม่ใช่ base64 (เก็บเฉพาะ base64)

**อย่างอื่นทั้งหมด**

- ทำให้ภาพปลอดภัยเท่านั้น

---

## พฤติกรรมในอดีต (ก่อน 2026.1.22)

ก่อนรีลีส 2026.1.22 OpenClaw ใช้สุขอนามัยของ transcript หลายชั้น:

- มี **ส่วนขยาย transcript-sanitize** ที่ทำงานทุกครั้งที่สร้าง context และสามารถ:
  - ซ่อมแซมการจับคู่ tool use/result
  - ทำให้รหัสการเรียก tool ปลอดภัย (รวมถึงโหมดไม่เข้มงวดที่คง `_`/`-` ไว้)
- runner ยังทำการทำให้ปลอดภัยเฉพาะของ provider ด้วย ซึ่งทำงานซ้ำซ้อนกัน
- มีการแก้ไขเพิ่มเติมนอกนโยบายของ provider รวมถึง:
  - ลบแท็ก `<final>` ออกจากข้อความของ assistant ก่อนบันทึก
  - ทิ้ง turn ข้อผิดพลาดของ assistant ที่ว่างเปล่า
  - ตัดเนื้อหาของ assistant หลังการเรียก tool

ความซับซ้อนนี้ทำให้เกิด regression ข้าม provider (โดยเฉพาะการจับคู่
`call_id|fc_id` ของ `openai-responses`) การปรับปรุงใน 2026.1.22 ได้ลบส่วนขยายนี้ออก รวมศูนย์
ตรรกะไว้ใน runner และทำให้ OpenAI เป็นแบบ **ไม่แตะต้อง** นอกเหนือจากการทำให้ภาพปลอดภัย

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [การตัดทอนเซสชัน](/th/concepts/session-pruning)
