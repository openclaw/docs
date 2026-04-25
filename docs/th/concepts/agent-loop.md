---
read_when:
    - คุณต้องการคำอธิบายแบบละเอียดของลูปเอเจนต์หรือเหตุการณ์ในวงจรชีวิต
    - คุณกำลังเปลี่ยนการเข้าคิวของเซสชัน การเขียน transcript หรือพฤติกรรมของ session write lock
summary: วงจรชีวิตของลูปเอเจนต์ สตรีม และความหมายของการรอ
title: ลูปเอเจนต์
x-i18n:
    generated_at: "2026-04-25T13:45:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

ลูปแบบ agentic คือการรันเอเจนต์แบบ “จริง” แบบครบวงจร: intake → การประกอบ context → model inference →
การเรียกใช้เครื่องมือ → การสตรีมคำตอบ → การคงอยู่ของข้อมูล เป็นเส้นทางหลักที่เชื่อถือได้ซึ่งเปลี่ยนข้อความ
ให้กลายเป็นการกระทำและคำตอบสุดท้าย พร้อมทั้งรักษาสถานะของเซสชันให้สอดคล้องกัน

ใน OpenClaw ลูปคือการรันเดี่ยวแบบ serial ต่อหนึ่งเซสชัน ซึ่งปล่อยเหตุการณ์วงจรชีวิตและสตรีม
ขณะที่ model กำลังคิด เรียกใช้เครื่องมือ และสตรีมผลลัพธ์ เอกสารนี้อธิบายว่าลูปจริงนี้
ถูกเชื่อมต่อแบบต้นทางถึงปลายทางอย่างไร

## จุดเริ่มต้น

- Gateway RPC: `agent` และ `agent.wait`
- CLI: คำสั่ง `agent`

## วิธีการทำงาน (ระดับสูง)

1. `agent` RPC ตรวจสอบพารามิเตอร์, resolve เซสชัน (sessionKey/sessionId), คงข้อมูลเมตาเซสชันไว้, และส่งคืน `{ runId, acceptedAt }` ทันที
2. `agentCommand` รันเอเจนต์:
   - resolve ค่าเริ่มต้นของ model + thinking/verbose/trace
   - โหลด snapshot ของ Skills
   - เรียก `runEmbeddedPiAgent` (รันไทม์ pi-agent-core)
   - ปล่อย **lifecycle end/error** หากลูปแบบฝังในตัวไม่ปล่อยเหตุการณ์ดังกล่าว
3. `runEmbeddedPiAgent`:
   - ทำให้การรันเป็นแบบ serial ผ่านคิวต่อเซสชัน + คิวระดับโกลบอล
   - resolve model + auth profile และสร้าง pi session
   - subscribe กับ pi events และสตรีม delta ของ assistant/tool
   - บังคับ timeout -> abort การรันหากเกินเวลา
   - ส่งคืน payloads + ข้อมูลเมตาการใช้งาน
4. `subscribeEmbeddedPiSession` เชื่อม pi-agent-core events ไปยังสตรีม `agent` ของ OpenClaw:
   - tool events => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - lifecycle events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` ใช้ `waitForAgentRun`:
   - รอ **lifecycle end/error** สำหรับ `runId`
   - ส่งคืน `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## การเข้าคิว + การประมวลผลพร้อมกัน

- การรันจะถูกทำให้เป็นแบบ serial ต่อ session key (session lane) และอาจผ่าน global lane ด้วย
- วิธีนี้ช่วยป้องกัน race ของ tool/session และรักษาประวัติของเซสชันให้สอดคล้องกัน
- ช่องทางการส่งข้อความสามารถเลือกโหมดคิวได้ (collect/steer/followup) ซึ่งป้อนเข้าสู่ระบบ lane นี้
  ดู [Command Queue](/th/concepts/queue)
- การเขียน transcript ก็ได้รับการป้องกันด้วย session write lock บนไฟล์เซสชันด้วย lock นี้
  รับรู้ระดับโปรเซสและอิงกับไฟล์ จึงสามารถดักจับตัวเขียนที่ข้ามคิวในโปรเซสเดียวกัน หรือมาจาก
  อีกโปรเซสหนึ่งได้
- session write locks จะไม่ reentrant เป็นค่าเริ่มต้น หาก helper ตั้งใจจะซ้อนการขอ lock
  เดียวกันโดยยังคงรักษาผู้เขียนเชิงตรรกะเพียงรายเดียว จะต้องเลือกใช้แบบชัดเจนด้วย
  `allowReentrant: true`

## การเตรียมเซสชัน + workspace

- Workspace จะถูก resolve และสร้างขึ้น; การรันแบบ sandboxed อาจเปลี่ยนไปใช้ราก workspace ของ sandbox
- ระบบจะโหลด Skills (หรือใช้ซ้ำจาก snapshot) และ inject ลงใน env และ prompt
- ไฟล์ bootstrap/context จะถูก resolve และ inject ลงในรายงาน system prompt
- จะมีการขอ session write lock; `SessionManager` จะถูกเปิดและเตรียมก่อนเริ่มสตรีม เส้นทางการเขียน transcript ใหม่ การทำ Compaction หรือการตัดทอนใด ๆ
  ในภายหลัง ต้องขอ lock เดียวกันนี้ก่อนเปิดหรือแก้ไขไฟล์ transcript

## การประกอบ prompt + system prompt

- System prompt ถูกสร้างจาก base prompt ของ OpenClaw, prompt ของ Skills, bootstrap context และ overrides ต่อการรัน
- มีการบังคับใช้ขีดจำกัดเฉพาะ model และโทเค็นสำรองสำหรับ Compaction
- ดู [System prompt](/th/concepts/system-prompt) สำหรับสิ่งที่ model เห็น

## จุดของ hook (ตำแหน่งที่คุณสามารถดักแทรกได้)

OpenClaw มีระบบ hook สองแบบ:

- **Internal hooks** (Gateway hooks): สคริปต์ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต
- **Plugin hooks**: จุดขยายภายในวงจรชีวิตของเอเจนต์/เครื่องมือ และ pipeline ของ gateway

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: ทำงานระหว่างสร้างไฟล์ bootstrap ก่อนที่ system prompt จะถูกสรุปสุดท้าย
  ใช้สิ่งนี้เพื่อเพิ่ม/ลบไฟล์ bootstrap context
- **Command hooks**: `/new`, `/reset`, `/stop` และเหตุการณ์คำสั่งอื่น ๆ (ดูเอกสาร Hooks)

ดู [Hooks](/th/automation/hooks) สำหรับการตั้งค่าและตัวอย่าง

### Plugin hooks (วงจรชีวิตของเอเจนต์ + gateway)

hook เหล่านี้ทำงานภายในลูปเอเจนต์หรือ pipeline ของ gateway:

- **`before_model_resolve`**: ทำงานก่อนเซสชัน (ไม่มี `messages`) เพื่อ override provider/model อย่างกำหนดแน่นอนได้ก่อน model resolution
- **`before_prompt_build`**: ทำงานหลังโหลดเซสชันแล้ว (พร้อม `messages`) เพื่อ inject `prependContext`, `systemPrompt`, `prependSystemContext` หรือ `appendSystemContext` ก่อนส่ง prompt ใช้ `prependContext` สำหรับข้อความไดนามิกต่อเทิร์น และใช้ฟิลด์ system-context สำหรับคำแนะนำที่คงที่ซึ่งควรอยู่ในพื้นที่ system prompt
- **`before_agent_start`**: hook แบบเดิมเพื่อความเข้ากันได้ ซึ่งอาจทำงานได้ในทั้งสองเฟส; ควรใช้ explicit hooks ด้านบนแทน
- **`before_agent_reply`**: ทำงานหลัง inline actions และก่อนการเรียก LLM ทำให้ Plugin สามารถยึดเทิร์นนั้นและส่งคืนคำตอบสังเคราะห์หรือปิดเสียงเทิร์นทั้งหมดได้
- **`agent_end`**: ตรวจสอบรายการข้อความสุดท้ายและ run metadata หลังเสร็จสิ้น
- **`before_compaction` / `after_compaction`**: สังเกตหรือใส่คำอธิบายรอบการทำ Compaction
- **`before_tool_call` / `after_tool_call`**: ดักพารามิเตอร์/ผลลัพธ์ของเครื่องมือ
- **`before_install`**: ตรวจสอบผลการสแกนในตัว และเลือกได้ว่าจะบล็อกการติดตั้ง skill หรือ Plugin หรือไม่
- **`tool_result_persist`**: แปลงผลลัพธ์ของเครื่องมือแบบ synchronous ก่อนที่จะถูกเขียนลง transcript เซสชันที่ OpenClaw เป็นเจ้าของ
- **`message_received` / `message_sending` / `message_sent`**: hooks สำหรับข้อความขาเข้า + ขาออก
- **`session_start` / `session_end`**: ขอบเขตวงจรชีวิตของเซสชัน
- **`gateway_start` / `gateway_stop`**: เหตุการณ์วงจรชีวิตของ gateway

กฎการตัดสินใจของ hook สำหรับตัวป้องกันขาออก/เครื่องมือ:

- `before_tool_call`: `{ block: true }` ถือเป็นการตัดสินสุดท้ายและหยุด handlers ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` เป็น no-op และจะไม่ล้างการบล็อกก่อนหน้า
- `before_install`: `{ block: true }` ถือเป็นการตัดสินสุดท้ายและหยุด handlers ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` เป็น no-op และจะไม่ล้างการบล็อกก่อนหน้า
- `message_sending`: `{ cancel: true }` ถือเป็นการตัดสินสุดท้ายและหยุด handlers ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` เป็น no-op และจะไม่ล้างการยกเลิกก่อนหน้า

ดู [Plugin hooks](/th/plugins/hooks) สำหรับ API ของ hook และรายละเอียดการลงทะเบียน

Harnesses อาจปรับ hook เหล่านี้ต่างกันไป Codex app-server harness ยังคงใช้
Plugin hooks ของ OpenClaw เป็นสัญญาความเข้ากันได้สำหรับพื้นผิวแบบ mirrored ที่มีเอกสารรองรับ
ขณะที่ Codex native hooks ยังคงเป็นกลไกระดับล่างของ Codex ที่แยกต่างหาก

## การสตรีม + คำตอบบางส่วน

- assistant deltas จะถูกสตรีมจาก pi-agent-core และปล่อยเป็นเหตุการณ์ `assistant`
- block streaming สามารถปล่อยคำตอบบางส่วนได้ทั้งตอน `text_end` หรือ `message_end`
- การสตรีม reasoning สามารถปล่อยเป็นสตรีมแยก หรือเป็น block replies ได้
- ดู [Streaming](/th/concepts/streaming) สำหรับพฤติกรรมการแบ่ง chunk และ block reply

## การเรียกใช้เครื่องมือ + เครื่องมือส่งข้อความ

- เหตุการณ์เริ่มต้น/อัปเดต/สิ้นสุดของเครื่องมือจะถูกปล่อยบนสตรีม `tool`
- ผลลัพธ์ของเครื่องมือจะถูกทำให้ปลอดภัยในด้านขนาดและ payload รูปภาพก่อนบันทึก/ปล่อยเหตุการณ์
- การส่งด้วยเครื่องมือส่งข้อความจะถูกติดตามเพื่อระงับการยืนยันจาก assistant ที่ซ้ำกัน

## การจัดรูปคำตอบ + การระงับ

- payload สุดท้ายถูกประกอบจาก:
  - ข้อความของ assistant (และ reasoning ถ้ามี)
  - สรุปเครื่องมือแบบ inline (เมื่อ verbose + ได้รับอนุญาต)
  - ข้อความ error ของ assistant เมื่อ model เกิดข้อผิดพลาด
- โทเค็นเงียบที่ตรงกันทุกตัวอักษร `NO_REPLY` / `no_reply` จะถูกกรองออกจาก
  payload ขาออก
- รายการที่ซ้ำจากเครื่องมือส่งข้อความจะถูกลบออกจากรายการ payload สุดท้าย
- หากไม่เหลือ payload ที่แสดงผลได้เลย และเครื่องมือเกิดข้อผิดพลาด ระบบจะปล่อย
  fallback tool error reply (เว้นแต่เครื่องมือส่งข้อความได้ส่งคำตอบที่ผู้ใช้มองเห็นได้ไปแล้ว)

## Compaction + การลองใหม่

- Compaction อัตโนมัติจะปล่อยเหตุการณ์สตรีม `compaction` และสามารถกระตุ้นให้เกิดการลองใหม่
- เมื่อลองใหม่ บัฟเฟอร์ในหน่วยความจำและสรุปเครื่องมือจะถูกรีเซ็ตเพื่อหลีกเลี่ยงเอาต์พุตซ้ำ
- ดู [Compaction](/th/concepts/compaction) สำหรับ pipeline ของ Compaction

## สตรีมเหตุการณ์ (ปัจจุบัน)

- `lifecycle`: ปล่อยโดย `subscribeEmbeddedPiSession` (และใช้เป็น fallback โดย `agentCommand`)
- `assistant`: deltas ที่สตรีมจาก pi-agent-core
- `tool`: เหตุการณ์เครื่องมือที่สตรีมจาก pi-agent-core

## การจัดการช่องทางแชต

- assistant deltas จะถูกบัฟเฟอร์เป็นข้อความ `delta` ของแชต
- แชต `final` จะถูกปล่อยเมื่อเกิด **lifecycle end/error**

## Timeouts

- ค่าเริ่มต้นของ `agent.wait`: 30 วินาที (รออย่างเดียว) พารามิเตอร์ `timeoutMs` ใช้แทนที่ได้
- รันไทม์ของเอเจนต์: ค่าเริ่มต้น `agents.defaults.timeoutSeconds` คือ 172800 วินาที (48 ชั่วโมง); ถูกบังคับใช้ในตัวจับเวลา abort ของ `runEmbeddedPiAgent`
- LLM idle timeout: `agents.defaults.llm.idleTimeoutSeconds` จะ abort คำขอ model เมื่อไม่มี response chunks เข้ามาก่อนหมดช่วง idle ตั้งค่านี้แบบชัดเจนสำหรับ local models ช้าหรือ providers ที่มี reasoning/tool-call; ตั้งเป็น 0 เพื่อปิดใช้งาน หากไม่ตั้งค่า OpenClaw จะใช้ `agents.defaults.timeoutSeconds` เมื่อมีการกำหนดค่าไว้ มิฉะนั้นจะใช้ 120 วินาที การรันที่ถูกกระตุ้นด้วย Cron ซึ่งไม่มีการกำหนด timeout แบบชัดเจนสำหรับ LLM หรือเอเจนต์ จะปิด idle watchdog และอาศัย timeout ชั้นนอกของ cron

## จุดที่อาจจบก่อนกำหนด

- timeout ของเอเจนต์ (abort)
- AbortSignal (ยกเลิก)
- Gateway ตัดการเชื่อมต่อหรือ RPC timeout
- timeout ของ `agent.wait` (รออย่างเดียว ไม่ได้หยุดเอเจนต์)

## ที่เกี่ยวข้อง

- [Tools](/th/tools) — เครื่องมือของเอเจนต์ที่ใช้งานได้
- [Hooks](/th/automation/hooks) — สคริปต์ขับเคลื่อนด้วยเหตุการณ์ที่ถูกเรียกโดยเหตุการณ์วงจรชีวิตของเอเจนต์
- [Compaction](/th/concepts/compaction) — วิธีสรุปการสนทนาที่ยาว
- [Exec Approvals](/th/tools/exec-approvals) — จุดอนุมัติสำหรับคำสั่ง shell
- [Thinking](/th/tools/thinking) — การกำหนดค่าระดับการคิด/การให้เหตุผล
