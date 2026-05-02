---
read_when:
    - คุณต้องการคำอธิบายแบบทีละขั้นตอนที่แม่นยำเกี่ยวกับลูปของเอเจนต์หรือเหตุการณ์วงจรชีวิต
    - คุณกำลังเปลี่ยนแปลงพฤติกรรมการจัดคิวเซสชัน การเขียนบันทึกบทสนทนา หรือการล็อกการเขียนของเซสชัน
summary: วงจรชีวิตของลูปเอเจนต์ สตรีม และความหมายของการรอ
title: ลูปของเอเจนต์
x-i18n:
    generated_at: "2026-05-02T10:13:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

ลูปแบบเอเจนต์คือการรัน “จริง” อย่างเต็มรูปแบบของเอเจนต์: การรับเข้า → การประกอบบริบท → การอนุมานของโมเดล →
การเรียกใช้เครื่องมือ → การตอบกลับแบบสตรีม → การคงข้อมูลไว้ เป็นเส้นทางที่เป็นแหล่งอ้างอิงหลักซึ่งแปลงข้อความ
ให้เป็นการกระทำและคำตอบสุดท้าย พร้อมรักษาสถานะเซสชันให้สอดคล้องกัน

ใน OpenClaw ลูปคือการรันหนึ่งครั้งต่อเซสชันที่ถูกจัดลำดับแบบ serialized ซึ่งปล่อยเหตุการณ์ lifecycle และ stream
ขณะที่โมเดลคิด เรียกเครื่องมือ และสตรีมผลลัพธ์ เอกสารนี้อธิบายวิธีที่ลูปจริงนี้
ถูกเชื่อมต่อแบบครบวงจร

## จุดเริ่มต้น

- Gateway RPC: `agent` และ `agent.wait`
- CLI: คำสั่ง `agent`

## วิธีทำงาน (ระดับสูง)

1. RPC `agent` ตรวจสอบ params, resolve เซสชัน (sessionKey/sessionId), คง metadata ของเซสชันไว้, แล้วส่งคืน `{ runId, acceptedAt }` ทันที
2. `agentCommand` รันเอเจนต์:
   - resolve ค่าเริ่มต้นของ model + thinking/verbose/trace
   - โหลด snapshot ของ skills
   - เรียก `runEmbeddedPiAgent` (runtime ของ pi-agent-core)
   - ปล่อย **lifecycle end/error** หากลูปแบบฝังตัวไม่ได้ปล่อยเอง
3. `runEmbeddedPiAgent`:
   - จัดลำดับการรันผ่านคิวต่อเซสชัน + คิว global
   - resolve model + auth profile และสร้างเซสชัน pi
   - subscribe กับเหตุการณ์ pi และสตรีม assistant/tool deltas
   - บังคับใช้ timeout -> abort การรันหากเกินเวลา
   - สำหรับเทิร์นของ Codex app-server ให้ abort เทิร์นที่รับแล้วซึ่งหยุดสร้างความคืบหน้า app-server ก่อนเกิด terminal event
   - ส่งคืน payloads + metadata การใช้งาน
4. `subscribeEmbeddedPiSession` เชื่อมเหตุการณ์ pi-agent-core ไปยังสตรีม OpenClaw `agent`:
   - เหตุการณ์ tool => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - เหตุการณ์ lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` ใช้ `waitForAgentRun`:
   - รอ **lifecycle end/error** สำหรับ `runId`
   - ส่งคืน `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## การเข้าคิว + การทำงานพร้อมกัน

- การรันถูกจัดลำดับต่อ session key (session lane) และอาจผ่าน global lane ได้
- สิ่งนี้ป้องกัน race ของเครื่องมือ/เซสชัน และรักษาประวัติเซสชันให้สอดคล้องกัน
- ช่องทางข้อความสามารถเลือกโหมดคิว (collect/steer/followup) ที่ป้อนเข้าสู่ระบบ lane นี้ได้
  ดู [Command Queue](/th/concepts/queue)
- การเขียน transcript ได้รับการป้องกันด้วย session write lock บนไฟล์เซสชันด้วย lock นี้
  รับรู้ process และอิงไฟล์ จึงจับ writer ที่ข้ามคิวใน process หรือมาจาก
  process อื่นได้
- โดยค่าเริ่มต้น session write lock ไม่ใช่ reentrant หาก helper ตั้งใจซ้อนการ acquire
  lock เดียวกันโดยยังคง writer เชิงตรรกะหนึ่งเดียวไว้ ต้อง opt in อย่างชัดเจนด้วย
  `allowReentrant: true`

## การเตรียมเซสชัน + workspace

- workspace ถูก resolve และสร้างขึ้น การรันแบบ sandboxed อาจ redirect ไปยัง root ของ sandbox workspace
- Skills ถูกโหลด (หรือใช้ซ้ำจาก snapshot) และ inject เข้า env และ prompt
- ไฟล์ bootstrap/context ถูก resolve และ inject เข้า system prompt report
- acquire session write lock แล้ว `SessionManager` จะถูกเปิดและเตรียมก่อนสตรีม เส้นทางใด ๆ
  ภายหลังที่ rewrite transcript, compaction หรือ truncation ต้องใช้ lock เดียวกันก่อนเปิดหรือ
  mutate ไฟล์ transcript

## การประกอบ prompt + system prompt

- system prompt ถูกสร้างจาก base prompt ของ OpenClaw, skills prompt, bootstrap context และ override ต่อการรัน
- มีการบังคับใช้ขีดจำกัดเฉพาะโมเดลและ token สำรองสำหรับ compaction
- ดู [System prompt](/th/concepts/system-prompt) สำหรับสิ่งที่โมเดลเห็น

## จุด hook (ตำแหน่งที่คุณสามารถดักทำงาน)

OpenClaw มีระบบ hook สองแบบ:

- **Internal hooks** (Gateway hooks): สคริปต์ตามเหตุการณ์สำหรับคำสั่งและเหตุการณ์ lifecycle
- **Plugin hooks**: จุดขยายภายใน lifecycle ของเอเจนต์/เครื่องมือ และ pipeline ของ gateway

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: รันระหว่างสร้างไฟล์ bootstrap ก่อน system prompt ถูก finalize
  ใช้สิ่งนี้เพื่อเพิ่ม/ลบไฟล์ bootstrap context
- **Command hooks**: `/new`, `/reset`, `/stop` และเหตุการณ์คำสั่งอื่น ๆ (ดูเอกสาร Hooks)

ดู [Hooks](/th/automation/hooks) สำหรับการตั้งค่าและตัวอย่าง

### Plugin hooks (lifecycle ของเอเจนต์ + gateway)

สิ่งเหล่านี้รันภายในลูปเอเจนต์หรือ pipeline ของ gateway:

- **`before_model_resolve`**: รันก่อนเซสชัน (ไม่มี `messages`) เพื่อ override provider/model อย่างกำหนดได้ซ้ำก่อนการ resolve โมเดล
- **`before_prompt_build`**: รันหลังโหลดเซสชัน (มี `messages`) เพื่อ inject `prependContext`, `systemPrompt`, `prependSystemContext` หรือ `appendSystemContext` ก่อนส่ง prompt ใช้ `prependContext` สำหรับข้อความไดนามิกต่อเทิร์น และใช้ฟิลด์ system-context สำหรับคำแนะนำที่เสถียรซึ่งควรอยู่ในพื้นที่ system prompt
- **`before_agent_start`**: hook เพื่อความเข้ากันได้กับ legacy ที่อาจรันในเฟสใดก็ได้ ควรใช้ hooks ที่ชัดเจนด้านบน
- **`before_agent_reply`**: รันหลัง inline actions และก่อนเรียก LLM ทำให้ Plugin สามารถรับเทิร์นและส่งคืนคำตอบสังเคราะห์หรือปิดเสียงเทิร์นทั้งหมดได้
- **`agent_end`**: ตรวจสอบรายการข้อความสุดท้ายและ metadata การรันหลังเสร็จสิ้น
- **`before_compaction` / `after_compaction`**: สังเกตหรือ annotate รอบ compaction
- **`before_tool_call` / `after_tool_call`**: ดัก params/results ของเครื่องมือ
- **`before_install`**: ตรวจสอบ scan findings ในตัวและอาจบล็อกการติดตั้ง skill หรือ Plugin
- **`tool_result_persist`**: แปลงผลลัพธ์เครื่องมือแบบ synchronous ก่อนเขียนลง transcript เซสชันที่ OpenClaw เป็นเจ้าของ
- **`message_received` / `message_sending` / `message_sent`**: hooks ข้อความขาเข้า + ขาออก
- **`session_start` / `session_end`**: ขอบเขต lifecycle ของเซสชัน
- **`gateway_start` / `gateway_stop`**: เหตุการณ์ lifecycle ของ gateway

กฎการตัดสินใจของ hook สำหรับ outbound/tool guards:

- `before_tool_call`: `{ block: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

ดู [Plugin hooks](/th/plugins/hooks) สำหรับ hook API และรายละเอียดการลงทะเบียน

Harness อาจปรับ hooks เหล่านี้ต่างกัน Codex app-server harness คง
OpenClaw plugin hooks ไว้เป็นสัญญาความเข้ากันได้สำหรับพื้นผิว mirrored ที่จัดทำเอกสาร
ขณะที่ Codex native hooks ยังคงเป็นกลไก Codex ระดับต่ำกว่าแยกต่างหาก

## การสตรีม + คำตอบบางส่วน

- Assistant deltas ถูกสตรีมจาก pi-agent-core และปล่อยเป็นเหตุการณ์ `assistant`
- Block streaming สามารถปล่อยคำตอบบางส่วนได้ทั้งบน `text_end` หรือ `message_end`
- Reasoning streaming สามารถถูกปล่อยเป็นสตรีมแยกหรือเป็น block replies
- ดู [Streaming](/th/concepts/streaming) สำหรับพฤติกรรม chunking และ block reply

## การเรียกใช้เครื่องมือ + messaging tools

- เหตุการณ์ tool start/update/end ถูกปล่อยบนสตรีม `tool`
- ผลลัพธ์เครื่องมือถูก sanitize สำหรับขนาดและ image payloads ก่อนบันทึก/ปล่อย
- การส่ง messaging tool ถูกติดตามเพื่อระงับการยืนยันจาก assistant ที่ซ้ำกัน

## การปรับรูปคำตอบ + การระงับ

- Payload สุดท้ายถูกประกอบจาก:
  - ข้อความ assistant (และ reasoning แบบ optional)
  - สรุป inline tool (เมื่อ verbose + อนุญาต)
  - ข้อความ error ของ assistant เมื่อโมเดลเกิด error
- token เงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` ถูกกรองออกจาก payload
  ขาออก
- รายการซ้ำของ messaging tool ถูกลบออกจากรายการ payload สุดท้าย
- หากไม่มี payload ที่ render ได้เหลืออยู่และเครื่องมือเกิด error จะปล่อย fallback tool error reply
  (เว้นแต่ messaging tool ได้ส่งคำตอบที่ผู้ใช้มองเห็นแล้ว)

## Compaction + การ retry

- Auto-compaction ปล่อยเหตุการณ์สตรีม `compaction` และสามารถ trigger การ retry ได้
- เมื่อ retry, in-memory buffers และสรุปเครื่องมือจะถูก reset เพื่อหลีกเลี่ยง output ซ้ำ
- ดู [Compaction](/th/concepts/compaction) สำหรับ pipeline ของ compaction

## สตรีมเหตุการณ์ (ปัจจุบัน)

- `lifecycle`: ปล่อยโดย `subscribeEmbeddedPiSession` (และเป็น fallback โดย `agentCommand`)
- `assistant`: deltas ที่สตรีมจาก pi-agent-core
- `tool`: เหตุการณ์เครื่องมือที่สตรีมจาก pi-agent-core

## การจัดการช่องทางแชต

- Assistant deltas ถูก buffer เป็นข้อความ `delta` ของแชต
- แชต `final` ถูกปล่อยเมื่อเกิด **lifecycle end/error**

## Timeouts

- ค่าเริ่มต้นของ `agent.wait`: 30s (เฉพาะการรอ) param `timeoutMs` override ได้
- Runtime ของเอเจนต์: ค่าเริ่มต้น `agents.defaults.timeoutSeconds` คือ 172800s (48 ชั่วโมง); บังคับใช้ใน abort timer ของ `runEmbeddedPiAgent`
- Runtime ของ Cron: `timeoutSeconds` ของ agent-turn แบบ isolated เป็นของ cron scheduler เริ่ม timer นั้นเมื่อการทำงานเริ่มขึ้น, abort การรันพื้นฐานเมื่อถึง deadline ที่ตั้งไว้, แล้วทำ cleanup แบบมีขอบเขตก่อนบันทึก timeout เพื่อไม่ให้ child session ที่ค้างทำให้ lane ติดอยู่
- การวินิจฉัย liveness ของเซสชัน: เมื่อเปิด diagnostics, `diagnostics.stuckSessionWarnMs` จัดประเภทเซสชัน `processing` ที่ยาวนานซึ่งไม่มี reply, tool, status, block หรือความคืบหน้า ACP ที่สังเกตเห็นได้ การรันแบบ embedded ที่ active, การเรียกโมเดล และการเรียกเครื่องมือรายงานเป็น `session.long_running`; งานที่ active แต่ไม่มีความคืบหน้าล่าสุดรายงานเป็น `session.stalled`; `session.stuck` สงวนไว้สำหรับ stale session bookkeeping ที่ไม่มีงาน active และเฉพาะ path นั้นเท่านั้นที่จะ release session lane ที่ได้รับผลกระทบเพื่อให้งาน startup ที่อยู่ในคิว drain ได้ การวินิจฉัย `session.stuck` ที่ซ้ำกันจะ back off ขณะที่เซสชันยังไม่เปลี่ยน
- Model idle timeout: OpenClaw abort คำขอโมเดลเมื่อไม่มี response chunks มาถึงก่อน idle window `models.providers.<id>.timeoutSeconds` ขยาย idle watchdog นี้สำหรับ provider แบบ local/self-hosted ที่ช้า มิฉะนั้น OpenClaw ใช้ `agents.defaults.timeoutSeconds` เมื่อกำหนดค่าไว้ โดยค่าเริ่มต้น cap ที่ 120s การรันที่ถูก trigger โดย Cron ซึ่งไม่มี model หรือ agent timeout ชัดเจนจะปิด idle watchdog และพึ่ง timeout ภายนอกของ cron
- Provider HTTP request timeout: `models.providers.<id>.timeoutSeconds` ใช้กับ HTTP fetches ของโมเดลสำหรับ provider นั้น รวมถึง connect, headers, body, SDK request timeout, การจัดการ abort ของ guarded-fetch ทั้งหมด และ model stream idle watchdog ใช้สิ่งนี้สำหรับ provider แบบ local/self-hosted ที่ช้า เช่น Ollama ก่อนเพิ่ม runtime timeout ของเอเจนต์ทั้งหมด

## จุดที่สิ่งต่าง ๆ อาจจบก่อนกำหนด

- Agent timeout (abort)
- AbortSignal (cancel)
- Gateway disconnect หรือ RPC timeout
- `agent.wait` timeout (เฉพาะการรอ, ไม่หยุดเอเจนต์)

## ที่เกี่ยวข้อง

- [Tools](/th/tools) — เครื่องมือเอเจนต์ที่มีให้ใช้
- [Hooks](/th/automation/hooks) — สคริปต์ตามเหตุการณ์ที่ถูก trigger โดยเหตุการณ์ lifecycle ของเอเจนต์
- [Compaction](/th/concepts/compaction) — วิธีสรุปบทสนทนาที่ยาว
- [Exec Approvals](/th/tools/exec-approvals) — approval gates สำหรับคำสั่ง shell
- [Thinking](/th/tools/thinking) — การกำหนดค่าระดับ thinking/reasoning
