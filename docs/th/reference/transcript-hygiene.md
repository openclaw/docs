---
read_when:
    - คุณกำลังดีบักการปฏิเสธคำขอของผู้ให้บริการที่เกี่ยวข้องกับรูปแบบบันทึกบทสนทนา
    - คุณกำลังเปลี่ยนการทำความสะอาดทรานสคริปต์หรือตรรกะการซ่อมแซมการเรียกใช้เครื่องมือ
    - คุณกำลังตรวจสอบความไม่ตรงกันของ ID การเรียกใช้เครื่องมือในผู้ให้บริการต่าง ๆ
summary: 'ข้อมูลอ้างอิง: กฎการล้างข้อมูลที่ละเอียดอ่อนและการซ่อมแซมทรานสคริปต์เฉพาะผู้ให้บริการ'
title: สุขอนามัยของบันทึกการสนทนา
x-i18n:
    generated_at: "2026-06-27T18:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw ใช้ **การแก้ไขเฉพาะ provider** กับทรานสคริปต์ก่อนการรัน (ขณะสร้างบริบทของโมเดล) ส่วนใหญ่เป็นการปรับ **ในหน่วยความจำ** เพื่อให้เป็นไปตามข้อกำหนดที่เข้มงวดของ provider นอกจากนี้ยังอาจมีรอบซ่อมแซมไฟล์เซสชันแยกต่างหากที่เขียน JSONL ที่จัดเก็บไว้ใหม่ก่อนโหลดเซสชัน แต่จะทำเฉพาะบรรทัดที่ผิดรูปแบบหรือ turn ที่บันทึกถาวรซึ่งไม่ใช่เรคคอร์ดถาวรที่ถูกต้องเท่านั้น คำตอบของ assistant ที่ส่งแล้วจะถูกเก็บรักษาไว้บนดิสก์; การตัด assistant-prefill เฉพาะ provider จะเกิดขึ้นเฉพาะตอนสร้าง payload ขาออกเท่านั้น เมื่อมีการซ่อมแซม ไฟล์ต้นฉบับจะถูกเขียนไปยังไฟล์พี่น้องชั่วคราว `*.bak-<pid>-<ts>` ก่อนการแทนที่แบบ atomic และถูกลบเมื่อการแทนที่สำเร็จ; backup จะถูกเก็บไว้เฉพาะเมื่อการล้างข้อมูลล้มเหลวเองเท่านั้น (ในกรณีนั้น path จะถูกรายงานกลับ)

ขอบเขตรวมถึง:

- บริบท prompt เฉพาะรันไทม์ที่ไม่เข้าไปอยู่ใน turn ของทรานสคริปต์ที่ผู้ใช้มองเห็น
- การทำให้ id ของ tool call ปลอดภัย
- การตรวจสอบความถูกต้องของอินพุต tool call
- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool
- การตรวจสอบความถูกต้อง / การจัดลำดับของ turn
- การล้าง thought signature
- การล้าง thinking signature
- การทำให้ payload รูปภาพปลอดภัย
- การล้าง text-block ว่างก่อน replay ไปยัง provider
- การล้าง length-turn ที่มีแต่ reasoning ที่ไม่สมบูรณ์ก่อน replay ไปยัง provider
- การติดแท็ก provenance ของอินพุตผู้ใช้ (สำหรับ prompt ที่ route ข้ามเซสชัน)
- การซ่อมแซม error-turn ของ assistant ที่ว่างสำหรับการ replay ของ Bedrock Converse

หากคุณต้องการรายละเอียดการจัดเก็บทรานสคริปต์ โปรดดู:

- [เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

---

## กฎสากล: บริบทรันไทม์ไม่ใช่ทรานสคริปต์ของผู้ใช้

บริบท runtime/system สามารถถูกเพิ่มเข้าไปใน prompt ของโมเดลสำหรับ turn หนึ่งได้ แต่ไม่ใช่เนื้อหาที่ผู้ใช้ปลายทางเป็นผู้เขียน OpenClaw เก็บ prompt body สำหรับฝั่งทรานสคริปต์แยกต่างหากสำหรับการตอบกลับของ Gateway, followup ที่อยู่ในคิว, ACP, CLI และการรัน OpenClaw แบบฝัง turn ของผู้ใช้ที่มองเห็นได้และถูกจัดเก็บจะใช้ transcript body นั้นแทน prompt ที่เติมข้อมูลรันไทม์แล้ว

สำหรับเซสชัน legacy ที่เคยบันทึก runtime wrapper ไว้แล้ว พื้นผิวประวัติของ Gateway จะใช้การฉายผลสำหรับการแสดงผลก่อนส่งคืนข้อความให้กับไคลเอนต์ WebChat, TUI, REST หรือ SSE

---

## สิ่งนี้ทำงานที่ไหน

งาน hygiene ของทรานสคริปต์ทั้งหมดถูกรวมศูนย์ไว้ใน runner แบบฝัง:

- การเลือกนโยบาย: `src/agents/transcript-policy.ts`
- การใช้ sanitization/repair: `sanitizeSessionHistory` ใน `src/agents/embedded-agent-runner/replay-history.ts`

นโยบายใช้ `provider`, `modelApi` และ `modelId` เพื่อตัดสินใจว่าจะใช้อะไร

แยกจาก hygiene ของทรานสคริปต์ ไฟล์เซสชันจะถูกซ่อมแซม (หากจำเป็น) ก่อนโหลด:

- `repairSessionFileIfNeeded` ใน `src/agents/session-file-repair.ts`
- ถูกเรียกจาก `run/attempt.ts` และ `compact.ts` (runner แบบฝัง)

---

## กฎสากล: การทำให้รูปภาพปลอดภัย

payload รูปภาพจะถูกทำให้ปลอดภัยเสมอเพื่อป้องกันการถูกปฏิเสธฝั่ง provider เนื่องจากขีดจำกัดขนาด (ลดขนาด/บีบอัดรูปภาพ base64 ที่ใหญ่เกินไปใหม่)

สิ่งนี้ยังช่วยควบคุมแรงกดดันด้าน token จากรูปภาพสำหรับโมเดลที่รองรับ vision ด้วย ขนาดสูงสุดที่ต่ำกว่ามักลดการใช้ token; ขนาดที่สูงกว่าจะรักษารายละเอียดไว้

การใช้งาน:

- `sanitizeSessionMessagesImages` ใน `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` ใน `src/agents/tool-images.ts`
- ด้านที่ยาวที่สุดของรูปภาพกำหนดค่าได้ผ่าน `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`)
- text block ว่างจะถูกลบขณะที่ pass นี้เดินผ่านเนื้อหาสำหรับ replay turn ของ assistant ที่กลายเป็นว่างจะถูกตัดออกจากสำเนาสำหรับ replay; turn ของผู้ใช้และ tool-result ที่กลายเป็นว่างจะได้รับ placeholder omitted-content ที่ไม่ว่าง

---

## กฎสากล: tool call ที่ผิดรูปแบบ

บล็อก tool-call ของ assistant ที่ขาดทั้ง `input` และ `arguments` จะถูกตัดออกก่อนสร้างบริบทของโมเดล สิ่งนี้ป้องกันการปฏิเสธจาก provider จาก tool call ที่ถูกบันทึกถาวรเพียงบางส่วน (เช่น หลังความล้มเหลวจาก rate limit)

การใช้งาน:

- `sanitizeToolCallInputs` ใน `src/agents/session-transcript-repair.ts`
- ใช้ใน `sanitizeSessionHistory` ใน `src/agents/embedded-agent-runner/replay-history.ts`

---

## กฎสากล: turn ที่มีแต่ reasoning ที่ไม่สมบูรณ์

turn ของ assistant ที่ชนขีดจำกัด output ของ provider โดยมีเพียงเนื้อหา thinking หรือ redacted-thinking จะถูกละเว้นจากสำเนา replay ในหน่วยความจำ turn ดังกล่าวมี state ของ provider ที่ไม่สมบูรณ์และอาจมี thinking signature บางส่วน

length turn ที่ว่างยังคงไม่เปลี่ยนแปลง เช่นเดียวกับ length turn ที่มีข้อความที่มองเห็นได้, tool call หรือบล็อกเนื้อหาที่ไม่รู้จัก ทรานสคริปต์ที่จัดเก็บไว้จะไม่ถูกเขียนใหม่

การใช้งาน:

- `normalizeAssistantReplayContent` ใน `src/agents/embedded-agent-runner/replay-history.ts`

---

## กฎสากล: provenance ของอินพุตข้ามเซสชัน

เมื่อ agent ส่ง prompt เข้าไปในอีกเซสชันผ่าน `sessions_send` (รวมถึงขั้นตอน agent-to-agent reply/announce) OpenClaw จะบันทึก turn ของผู้ใช้ที่สร้างขึ้นพร้อมกับ:

- `message.provenance.kind = "inter_session"`

OpenClaw ยังเติม marker `[Inter-session message ... isUser=false]` ไว้ด้านหน้าใน turn เดียวกันก่อนข้อความ prompt ที่ถูก route เพื่อให้การเรียกโมเดลที่ใช้งานอยู่แยกแยะ output จากเซสชันอื่นออกจากคำสั่งของผู้ใช้ปลายทางภายนอกได้ marker นี้รวมเซสชันต้นทาง ช่องทาง และ tool เมื่อมีให้ใช้ ทรานสคริปต์ยังคงใช้ `role: "user"` เพื่อความเข้ากันได้กับ provider แต่ทั้งข้อความที่มองเห็นได้และเมตาดาต้า provenance ต่างทำเครื่องหมาย turn ว่าเป็นข้อมูลข้ามเซสชัน

ระหว่างการสร้างบริบทใหม่ OpenClaw จะใช้ marker เดียวกันกับ turn ผู้ใช้ข้ามเซสชันที่บันทึกไว้เก่ากว่าซึ่งมีเพียงเมตาดาต้า provenance

---

## ตาราง provider (พฤติกรรมปัจจุบัน)

**OpenAI / OpenAI Codex**

- ทำให้รูปภาพปลอดภัยเท่านั้น
- ตัด reasoning signature ที่กำพร้า (reasoning item แบบ standalone ที่ไม่มี content block ตามมา) สำหรับทรานสคริปต์ OpenAI Responses/Codex และตัด OpenAI reasoning ที่ replay ได้หลังจากสลับ route ของโมเดล
- เก็บรักษา payload ของ reasoning item ของ OpenAI Responses ที่ replay ได้ รวมถึง item summary ว่างที่เข้ารหัสไว้ เพื่อให้ manual/WebSocket replay ยังคงมี state `rs_*` ที่จำเป็นจับคู่กับ output item ของ assistant
- Native ChatGPT Codex Responses ทำตามความเท่าเทียมของ wire ของ Codex โดย replay payload reasoning/message/function ของ Responses ก่อนหน้าโดยไม่มี item ID ก่อนหน้า พร้อมคง `prompt_cache_key` ของเซสชันไว้
- replay ของตระกูล OpenAI Responses รักษาคู่ reasoning `call_*|fc_*` แบบ same-model ที่เป็น canonical แต่ normalize `call_id` / function-call item id ที่ผิดรูปแบบหรือยาวเกินไปแบบกำหนดแน่นอนก่อนแปลง payload pi-ai
- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool อาจย้าย output จริงที่ตรงกันและสังเคราะห์ output `aborted` แบบ Codex สำหรับ tool call ที่หายไป
- ไม่มีการตรวจสอบความถูกต้องหรือการจัดลำดับ turn ใหม่
- output ของ tool ในตระกูล OpenAI Responses ที่หายไปจะถูกสังเคราะห์เป็น `aborted` เพื่อให้ตรงกับ normalization ของ Codex replay
- ไม่มีการตัด thought signature

**OpenAI-compatible Chat Completions**

- บล็อก thinking/reasoning ของ assistant ในอดีตจะถูกตัดก่อน replay เพื่อให้เซิร์ฟเวอร์แบบ local และ proxy-style ที่เข้ากันได้กับ OpenAI ไม่ได้รับฟิลด์ reasoning จาก turn ก่อนหน้า เช่น `reasoning` หรือ `reasoning_content`
- continuation ของ tool-call ใน turn เดียวกันปัจจุบันจะเก็บบล็อก reasoning ของ assistant ที่แนบกับ tool call ไว้จนกว่า tool result จะถูก replay แล้ว
- รายการโมเดล custom/self-hosted ที่มี `reasoning: true` จะเก็บเมตาดาต้า reasoning ที่ replay ไว้
- ข้อยกเว้นที่ provider เป็นเจ้าของสามารถ opt out ได้เมื่อ wire protocol ของตนต้องการเมตาดาต้า reasoning ที่ replay ไว้

**Google (Generative AI / Gemini CLI / Antigravity)**

- การทำให้ id ของ tool call ปลอดภัย: alphanumeric อย่างเข้มงวด
- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool และผลลัพธ์ tool สังเคราะห์
- การตรวจสอบความถูกต้องของ turn (การสลับ turn แบบ Gemini)
- การแก้ไขการจัดลำดับ turn ของ Google (เติม user bootstrap ขนาดเล็กไว้ข้างหน้าหากประวัติเริ่มด้วย assistant)
- Antigravity Claude: normalize thinking signature; ตัดบล็อก thinking ที่ไม่มีลายเซ็น

**Anthropic / Minimax (เข้ากันได้กับ Anthropic)**

- การซ่อมแซมการจับคู่ผลลัพธ์ของ tool และผลลัพธ์ tool สังเคราะห์
- การตรวจสอบความถูกต้องของ turn (รวม turn ผู้ใช้ที่ต่อเนื่องกันเพื่อให้เป็นไปตามการสลับที่เข้มงวด)
- turn assistant prefill ท้ายสุดจะถูกตัดออกจาก payload Anthropic Messages ขาออกเมื่อเปิดใช้ thinking รวมถึง route ของ Cloudflare AI Gateway
- thinking signature ของ assistant ก่อน Compaction จะถูกตัดก่อน replay ไปยัง provider เมื่อเซสชันถูก compact แล้ว thinking signature ถูกผูกด้วยการเข้ารหัสกับ prefix ของบทสนทนา ณ เวลาสร้าง; หลัง Compaction prefix จะเปลี่ยนไป (เนื้อหาที่สรุปถูกแทนที่ด้วยสรุป Compaction) ดังนั้นการ replay signature เดิมทำให้ Anthropic ปฏิเสธคำขอด้วย "Invalid signature in thinking block" ข้อความ thinking จะถูกเก็บไว้เป็นบล็อกที่ไม่มีลายเซ็น แล้วจึงถูกจัดการโดยกฎด้านล่าง
- บล็อก thinking ที่ขาด replay signature, มี replay signature ว่าง หรือเป็นช่องว่าง จะถูกตัดก่อนแปลงไปยัง provider หากสิ่งนั้นทำให้ turn ของ assistant ว่าง OpenClaw จะรักษารูปทรงของ turn ด้วยข้อความ omitted-reasoning ที่ไม่ว่าง
- turn ของ assistant รุ่นเก่าที่มีแต่ thinking และต้องถูกตัด จะถูกแทนที่ด้วยข้อความ omitted-reasoning ที่ไม่ว่าง เพื่อให้ adapter ของ provider ไม่ตัด turn replay ทิ้ง

**Amazon Bedrock (Converse API)**

- turn stream-error ของ assistant ที่ว่างจะถูกซ่อมแซมเป็นบล็อกข้อความ fallback ที่ไม่ว่างก่อน replay Bedrock Converse ปฏิเสธข้อความ assistant ที่มี `content: []` ดังนั้น turn ของ assistant ที่บันทึกถาวรซึ่งมี `stopReason: "error"` และเนื้อหาว่างจะถูกซ่อมแซมบนดิสก์ก่อนโหลดด้วย
- turn stream-error ของ assistant ที่มีเพียงบล็อกข้อความว่างจะถูกตัดออกจากสำเนา replay ในหน่วยความจำแทนการ replay บล็อกว่างที่ไม่ถูกต้อง
- thinking signature ของ assistant ก่อน Compaction จะถูกตัดก่อน replay ของ Converse เมื่อเซสชันถูก compact แล้ว ด้วยเหตุผลเดียวกับ Anthropic ข้างต้น
- บล็อก thinking ของ Claude ที่ขาด replay signature, มี replay signature ว่าง หรือเป็นช่องว่าง จะถูกตัดก่อน replay ของ Converse หากสิ่งนั้นทำให้ turn ของ assistant ว่าง OpenClaw จะรักษารูปทรงของ turn ด้วยข้อความ omitted-reasoning ที่ไม่ว่าง
- turn ของ assistant รุ่นเก่าที่มีแต่ thinking และต้องถูกตัด จะถูกแทนที่ด้วยข้อความ omitted-reasoning ที่ไม่ว่าง เพื่อให้ replay ของ Converse รักษารูปทรง turn ที่เข้มงวด
- replay กรอง turn ของ assistant ที่เป็น delivery-mirror ของ OpenClaw และที่ Gateway แทรกเข้ามา
- การทำให้รูปภาพปลอดภัยใช้ผ่านกฎสากล

**Mistral (รวมถึงการตรวจจับตาม model-id)**

- การทำให้ id ของ tool call ปลอดภัย: strict9 (alphanumeric ความยาว 9)

**OpenRouter Gemini**

- การล้าง thought signature: ตัดค่า `thought_signature` ที่ไม่ใช่ base64 (เก็บ base64 ไว้)

**OpenRouter Anthropic**

- turn assistant prefill ท้ายสุดจะถูกตัดออกจาก payload โมเดล Anthropic แบบ OpenAI-compatible ของ OpenRouter ที่ตรวจสอบแล้วเมื่อเปิดใช้ reasoning ให้ตรงกับพฤติกรรม replay ของ Anthropic โดยตรงและ Cloudflare Anthropic

**อย่างอื่นทั้งหมด**

- ทำให้รูปภาพปลอดภัยเท่านั้น

---

## พฤติกรรมในอดีต (ก่อน 2026.1.22)

ก่อนรุ่น 2026.1.22 OpenClaw ใช้ hygiene ของทรานสคริปต์หลายชั้น:

- **ส่วนขยาย transcript-sanitize** ทำงานในการสร้างบริบททุกครั้งและสามารถ:
  - ซ่อมแซมการจับคู่ tool use/result
  - ทำให้ id ของ tool call ปลอดภัย (รวมถึงโหมดไม่เข้มงวดที่เก็บ `_`/`-` ไว้)
- runner ยังทำ sanitization เฉพาะ provider ด้วย ซึ่งทำงานซ้ำซ้อน
- มี mutation เพิ่มเติมเกิดขึ้นนอกนโยบายของ provider รวมถึง:
  - ตัดแท็ก `<final>` ออกจากข้อความ assistant ก่อน persistence
  - ตัด turn error ของ assistant ที่ว่าง
  - ตัดแต่งเนื้อหา assistant หลัง tool call

ความซับซ้อนนี้ทำให้เกิด regression ข้าม provider (โดยเฉพาะการจับคู่ `call_id|fc_id` ของ `openai-responses`) การล้างข้อมูลใน 2026.1.22 ลบส่วนขยายออก รวมตรรกะไว้ใน runner และทำให้ OpenAI เป็นแบบ **ไม่แตะต้อง** นอกเหนือจากการทำให้รูปภาพปลอดภัย

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
