---
read_when:
    - คุณต้องการคำอธิบายแบบทีละขั้นตอนที่ตรงครบถ้วนเกี่ยวกับลูปของเอเจนต์หรือเหตุการณ์ในวงจรชีวิต
    - คุณกำลังเปลี่ยนการจัดคิวเซสชัน การเขียนทรานสคริปต์ หรือพฤติกรรมล็อกการเขียนของเซสชัน
summary: วงจรชีวิตของลูปเอเจนต์ สตรีม และซีแมนติกของการรอ
title: ลูปของเอเจนต์
x-i18n:
    generated_at: "2026-05-06T09:07:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

ลูปแบบเอเจนต์คือการรันเอเจนต์แบบ "จริง" เต็มรูปแบบ: รับเข้า → ประกอบบริบท → อนุมานด้วยโมเดล →
เรียกใช้เครื่องมือ → สตรีมคำตอบ → บันทึกคงทน เป็นเส้นทางหลักที่เชื่อถือได้ซึ่งเปลี่ยนข้อความ
ให้เป็นการกระทำและคำตอบสุดท้าย พร้อมรักษาสถานะเซสชันให้สอดคล้องกัน

ใน OpenClaw ลูปคือการรันเดี่ยวแบบเรียงลำดับต่อเซสชัน ซึ่งส่งเหตุการณ์วงจรชีวิตและสตรีม
ขณะที่โมเดลคิด เรียกเครื่องมือ และสตรีมผลลัพธ์ เอกสารนี้อธิบายว่าลูปจริงนี้
เชื่อมต่อแบบต้นจนจบอย่างไร

## จุดเข้าใช้งาน

- Gateway RPC: `agent` และ `agent.wait`
- CLI: คำสั่ง `agent`

## วิธีทำงาน (ภาพรวม)

1. RPC `agent` ตรวจสอบ params, resolve session (sessionKey/sessionId), บันทึก metadata ของ session, แล้วคืน `{ runId, acceptedAt }` ทันที
2. `agentCommand` รันเอเจนต์:
   - resolve โมเดล + ค่าเริ่มต้น thinking/verbose/trace
   - โหลดสแนปชอต Skills
   - เรียก `runEmbeddedPiAgent` (runtime ของ pi-agent-core)
   - ส่ง **lifecycle end/error** หากลูปแบบฝังไม่ได้ส่งเอง
3. `runEmbeddedPiAgent`:
   - จัดลำดับการรันผ่านคิวต่อเซสชัน + คิวส่วนกลาง
   - resolve โมเดล + โปรไฟล์ auth และสร้างเซสชัน Pi
   - subscribe เหตุการณ์ Pi และสตรีม delta ของ assistant/tool
   - บังคับใช้ timeout -> abort การรันหากเกินเวลา
   - สำหรับ turn ของ Codex app-server จะ abort turn ที่รับแล้วซึ่งหยุดสร้างความคืบหน้า app-server ก่อนเหตุการณ์สิ้นสุด
   - คืน payloads + metadata การใช้งาน
4. `subscribeEmbeddedPiSession` เชื่อมเหตุการณ์ pi-agent-core ไปยังสตรีม `agent` ของ OpenClaw:
   - เหตุการณ์ tool => `stream: "tool"`
   - delta ของ assistant => `stream: "assistant"`
   - เหตุการณ์ lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` ใช้ `waitForAgentRun`:
   - รอ **lifecycle end/error** สำหรับ `runId`
   - คืน `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## การเข้าคิว + การทำงานพร้อมกัน

- การรันจะถูกจัดลำดับต่อ session key (session lane) และอาจผ่าน global lane ด้วย
- วิธีนี้ป้องกัน race ของ tool/session และรักษาประวัติ session ให้สอดคล้องกัน
- ช่องทางข้อความสามารถเลือกโหมดคิว (collect/steer/followup) ที่ป้อนเข้าระบบ lane นี้ได้
  ดู [คิวคำสั่ง](/th/concepts/queue)
- การเขียน transcript ก็ได้รับการป้องกันด้วย session write lock บนไฟล์ session เช่นกัน lock นี้
  รับรู้ process และอิงไฟล์ จึงจับ writer ที่ข้ามคิวใน process หรือมาจาก
  process อื่นได้ writer ของ session transcript จะรอได้สูงสุด `session.writeLock.acquireTimeoutMs`
  ก่อนรายงานว่า session ไม่ว่าง ค่าเริ่มต้นคือ `60000` ms
- session write lock ไม่ใช่ reentrant โดยค่าเริ่มต้น หาก helper ตั้งใจซ้อนการ acquire
  lock เดิมขณะยังรักษา writer เชิงตรรกะไว้หนึ่งตัว ต้อง opt in อย่างชัดเจนด้วย
  `allowReentrant: true`

## การเตรียม session + workspace

- workspace ถูก resolve และสร้างขึ้น การรันใน sandbox อาจ redirect ไปยัง root ของ sandbox workspace
- Skills ถูกโหลด (หรือใช้ซ้ำจากสแนปชอต) และ inject เข้า env และ prompt
- ไฟล์ bootstrap/context ถูก resolve และ inject เข้า report ของ system prompt
- มีการ acquire session write lock; `SessionManager` ถูกเปิดและเตรียมก่อนเริ่มสตรีม เส้นทาง rewrite, compaction หรือ truncation ของ transcript ในภายหลัง
  ต้องใช้ lock เดียวกันก่อนเปิดหรือ
  แก้ไขไฟล์ transcript

## การประกอบ prompt + system prompt

- system prompt สร้างจาก base prompt ของ OpenClaw, prompt ของ Skills, bootstrap context และ override ต่อการรัน
- บังคับใช้ขีดจำกัดเฉพาะโมเดลและ token สำรองสำหรับ compaction
- ดู [system prompt](/th/concepts/system-prompt) เพื่อดูว่าโมเดลเห็นอะไร

## จุด hook (ที่คุณสามารถดักแทรกได้)

OpenClaw มีระบบ hook สองแบบ:

- **hook ภายใน** (Gateway hooks): สคริปต์แบบ event-driven สำหรับคำสั่งและเหตุการณ์ lifecycle
- **Plugin hooks**: จุดต่อขยายภายใน lifecycle ของ agent/tool และ gateway pipeline

### hook ภายใน (Gateway hooks)

- **`agent:bootstrap`**: ทำงานขณะสร้างไฟล์ bootstrap ก่อน finalize system prompt
  ใช้สิ่งนี้เพื่อเพิ่ม/ลบไฟล์ bootstrap context
- **hook คำสั่ง**: `/new`, `/reset`, `/stop` และเหตุการณ์คำสั่งอื่นๆ (ดูเอกสาร Hooks)

ดู [Hooks](/th/automation/hooks) สำหรับการตั้งค่าและตัวอย่าง

### Plugin hooks (lifecycle ของ agent + gateway)

สิ่งเหล่านี้ทำงานภายในลูปเอเจนต์หรือ gateway pipeline:

- **`before_model_resolve`**: ทำงานก่อน session (ไม่มี `messages`) เพื่อ override provider/model อย่างกำหนดซ้ำได้ก่อนการ resolve โมเดล
- **`before_prompt_build`**: ทำงานหลังโหลด session (พร้อม `messages`) เพื่อ inject `prependContext`, `systemPrompt`, `prependSystemContext` หรือ `appendSystemContext` ก่อนส่ง prompt ใช้ `prependContext` สำหรับข้อความ dynamic ต่อ turn และใช้ฟิลด์ system-context สำหรับคำแนะนำที่เสถียรซึ่งควรอยู่ในพื้นที่ system prompt
- **`before_agent_start`**: hook เพื่อความเข้ากันได้แบบ legacy ที่อาจทำงานใน phase ใดก็ได้; ควรใช้ hook ที่ชัดเจนด้านบน
- **`before_agent_reply`**: ทำงานหลัง inline actions และก่อนการเรียก LLM ทำให้ Plugin claim turn และคืน synthetic reply หรือทำให้ turn เงียบทั้งหมดได้
- **`agent_end`**: ตรวจรายการข้อความสุดท้ายและ metadata การรันหลังเสร็จสิ้น
- **`before_compaction` / `after_compaction`**: สังเกตหรือ annotate รอบ compaction
- **`before_tool_call` / `after_tool_call`**: ดักพารามิเตอร์/ผลลัพธ์ของ tool
- **`before_install`**: ตรวจ findings จาก built-in scan และอาจบล็อกการติดตั้ง skill หรือ Plugin
- **`tool_result_persist`**: transform ผลลัพธ์ tool แบบ synchronous ก่อนเขียนลง session transcript ที่ OpenClaw เป็นเจ้าของ
- **`message_received` / `message_sending` / `message_sent`**: hook ข้อความขาเข้า + ขาออก
- **`session_start` / `session_end`**: ขอบเขต lifecycle ของ session
- **`gateway_start` / `gateway_stop`**: เหตุการณ์ lifecycle ของ gateway

กฎการตัดสินใจของ hook สำหรับ guard ขาออก/tool:

- `before_tool_call`: `{ block: true }` เป็น terminal และหยุด handler ที่ priority ต่ำกว่า
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal และหยุด handler ที่ priority ต่ำกว่า
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal และหยุด handler ที่ priority ต่ำกว่า
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

ดู [Plugin hooks](/th/plugins/hooks) สำหรับรายละเอียด hook API และการลงทะเบียน

harness อาจปรับ hook เหล่านี้ต่างกัน harness ของ Codex app-server คง
OpenClaw plugin hooks ไว้เป็น contract ความเข้ากันได้สำหรับพื้นผิว mirrored
ที่จัดทำเอกสารไว้ ขณะที่ Codex native hooks ยังคงเป็นกลไก Codex ระดับล่างที่แยกต่างหาก

## การสตรีม + คำตอบบางส่วน

- delta ของ assistant ถูกสตรีมจาก pi-agent-core และส่งเป็นเหตุการณ์ `assistant`
- block streaming สามารถส่งคำตอบบางส่วนได้ทั้งบน `text_end` หรือ `message_end`
- reasoning streaming สามารถส่งเป็นสตรีมแยกต่างหากหรือเป็น block replies
- ดู [Streaming](/th/concepts/streaming) สำหรับพฤติกรรม chunking และ block reply

## การเรียกใช้เครื่องมือ + เครื่องมือส่งข้อความ

- เหตุการณ์เริ่ม/update/จบของ tool ถูกส่งบนสตรีม `tool`
- ผลลัพธ์ tool ถูก sanitize ด้านขนาดและ payload รูปภาพก่อน logging/emitting
- การส่งผ่าน messaging tool ถูกติดตามเพื่อกดทับ confirmation ของ assistant ที่ซ้ำกัน

## การจัดรูปคำตอบ + การกดทับ

- payload สุดท้ายประกอบจาก:
  - ข้อความ assistant (และ reasoning ที่เป็น optional)
  - summary ของ inline tool (เมื่อ verbose + allowed)
  - ข้อความ error ของ assistant เมื่อโมเดล error
- token เงียบแบบตรงตัว `NO_REPLY` / `no_reply` ถูกกรองออกจาก
  payload ขาออก
- messaging tool ที่ซ้ำกันถูกลบออกจากรายการ payload สุดท้าย
- หากไม่มี payload ที่ render ได้เหลืออยู่และ tool เกิด error จะส่ง fallback tool error reply
  (เว้นแต่ว่า messaging tool ได้ส่งคำตอบที่ผู้ใช้มองเห็นไปแล้ว)

## Compaction + การลองใหม่

- auto-compaction ส่งเหตุการณ์สตรีม `compaction` และสามารถ trigger การลองใหม่
- เมื่อ retry buffer ในหน่วยความจำและ summary ของ tool จะถูก reset เพื่อหลีกเลี่ยง output ซ้ำ
- ดู [Compaction](/th/concepts/compaction) สำหรับ pipeline ของ compaction

## สตรีมเหตุการณ์ (ปัจจุบัน)

- `lifecycle`: ส่งโดย `subscribeEmbeddedPiSession` (และส่งเป็น fallback โดย `agentCommand`)
- `assistant`: delta ที่สตรีมจาก pi-agent-core
- `tool`: เหตุการณ์ tool ที่สตรีมจาก pi-agent-core

## การจัดการช่องทางแชต

- delta ของ assistant ถูก buffer เป็นข้อความ `delta` ของแชต
- `final` ของแชตถูกส่งเมื่อ **lifecycle end/error**

## timeout

- ค่าเริ่มต้นของ `agent.wait`: 30s (เฉพาะการรอ) พารามิเตอร์ `timeoutMs` override ได้
- runtime ของ agent: ค่าเริ่มต้น `agents.defaults.timeoutSeconds` 172800s (48 ชั่วโมง); บังคับใช้ใน abort timer ของ `runEmbeddedPiAgent`
- runtime ของ Cron: `timeoutSeconds` ของ agent-turn แบบ isolated เป็นของ cron scheduler เริ่ม timer นั้นเมื่อการ execute เริ่มขึ้น, abort run ที่อยู่ข้างใต้เมื่อถึง deadline ที่กำหนดค่าไว้, แล้วทำ cleanup แบบมีขอบเขตก่อนบันทึก timeout เพื่อให้ child session ที่ stale ไม่ทำให้ lane ค้างอยู่
- diagnostics ความยังทำงานของ session: เมื่อเปิด diagnostics, `diagnostics.stuckSessionWarnMs` จะจำแนก session `processing` ที่ยาวนานซึ่งไม่มี reply, tool, status, block หรือความคืบหน้า ACP ที่สังเกตได้ การรันแบบ embedded ที่ active, การเรียกโมเดล และการเรียก tool จะรายงานเป็น `session.long_running`; งานที่ active แต่ไม่มีความคืบหน้าล่าสุดจะรายงานเป็น `session.stalled`; `session.stuck` สงวนไว้สำหรับ bookkeeping ของ session ที่ stale โดยไม่มีงาน active bookkeeping ของ session ที่ stale จะปล่อย session lane ที่ได้รับผลกระทบทันที; embedded run ที่ stalled จะถูก abort-drain หลังจาก `diagnostics.stuckSessionAbortMs` เท่านั้น (ค่าเริ่มต้น: อย่างน้อย 10 นาทีและ 5 เท่าของ threshold การเตือน) เพื่อให้งานที่เข้าคิวกลับมาทำต่อได้โดยไม่ตัดการรันที่เพียงแค่ช้าออก Recovery ส่ง outcome requested/completed แบบมีโครงสร้าง และสถานะ diagnostic จะถูกทำเครื่องหมาย idle เฉพาะเมื่อ processing generation เดิมยัง current อยู่เท่านั้น diagnostics `session.stuck` ที่ซ้ำจะ back off ขณะที่ session ยังไม่เปลี่ยนแปลง
- model idle timeout: OpenClaw abort request ของโมเดลเมื่อไม่มี response chunk มาถึงก่อน idle window `models.providers.<id>.timeoutSeconds` ขยาย idle watchdog นี้สำหรับ provider แบบ local/self-hosted ที่ช้า; มิฉะนั้น OpenClaw ใช้ `agents.defaults.timeoutSeconds` เมื่อกำหนดค่าไว้ โดย capped ที่ 120s ตามค่าเริ่มต้น การรันที่ trigger โดย Cron และไม่มี timeout ของโมเดลหรือ agent ที่ explicit จะปิด idle watchdog และพึ่ง timeout ชั้นนอกของ cron
- timeout ของ HTTP request ของ provider: `models.providers.<id>.timeoutSeconds` ใช้กับ model HTTP fetches ของ provider นั้น รวมถึง connect, headers, body, SDK request timeout, การจัดการ abort ของ guarded-fetch ทั้งหมด และ model stream idle watchdog ใช้ค่านี้สำหรับ provider แบบ local/self-hosted ที่ช้า เช่น Ollama ก่อนเพิ่ม timeout runtime ของ agent ทั้งหมด

## จุดที่สิ่งต่างๆ อาจจบก่อนกำหนด

- timeout ของ agent (abort)
- AbortSignal (cancel)
- Gateway disconnect หรือ RPC timeout
- timeout ของ `agent.wait` (เฉพาะการรอ ไม่หยุด agent)

## ที่เกี่ยวข้อง

- [Tools](/th/tools) — เครื่องมือ agent ที่มีให้ใช้
- [Hooks](/th/automation/hooks) — สคริปต์ event-driven ที่ trigger โดยเหตุการณ์ lifecycle ของ agent
- [Compaction](/th/concepts/compaction) — วิธีสรุปบทสนทนายาวๆ
- [Exec Approvals](/th/tools/exec-approvals) — approval gates สำหรับคำสั่ง shell
- [Thinking](/th/tools/thinking) — การกำหนดค่าระดับ thinking/reasoning
