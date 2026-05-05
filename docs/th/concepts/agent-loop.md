---
read_when:
    - คุณต้องการคำแนะนำแบบทีละขั้นตอนอย่างละเอียดเกี่ยวกับลูปของเอเจนต์หรือเหตุการณ์ในวงจรชีวิต
    - คุณกำลังเปลี่ยนการจัดคิวเซสชัน การเขียนทรานสคริปต์ หรือพฤติกรรมล็อกการเขียนของเซสชัน
summary: วงจรชีวิตของลูปเอเจนต์ สตรีม และเซแมนติกของการรอ
title: ลูปของเอเจนต์
x-i18n:
    generated_at: "2026-05-05T06:16:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

ลูปแบบเอเจนต์คือการรัน “จริง” แบบเต็มของเอเจนต์: การรับข้อมูลเข้า → การประกอบบริบท → การอนุมานของโมเดล →
การเรียกใช้เครื่องมือ → การสตรีมคำตอบ → การคงข้อมูลไว้ เป็นเส้นทางอ้างอิงที่เปลี่ยนข้อความ
ให้เป็นการกระทำและคำตอบสุดท้าย ขณะเดียวกันก็รักษาสถานะเซสชันให้สอดคล้องกัน

ใน OpenClaw ลูปคือการรันหนึ่งครั้งต่อเซสชันที่ถูกจัดลำดับแบบ serialized ซึ่งปล่อยอีเวนต์วงจรชีวิตและสตรีม
ขณะที่โมเดลคิด เรียกเครื่องมือ และสตรีมเอาต์พุต เอกสารนี้อธิบายวิธีเชื่อมลูปจริงนั้น
ตั้งแต่ต้นจนจบ

## จุดเข้าใช้งาน

- Gateway RPC: `agent` และ `agent.wait`
- CLI: คำสั่ง `agent`

## วิธีทำงาน (ภาพรวม)

1. RPC `agent` ตรวจสอบพารามิเตอร์ แก้ค่าเซสชัน (sessionKey/sessionId) คงข้อมูลเมตาของเซสชัน แล้วคืนค่า `{ runId, acceptedAt }` ทันที
2. `agentCommand` รันเอเจนต์:
   - แก้ค่าโมเดล + ค่าเริ่มต้นของ thinking/verbose/trace
   - โหลดสแนปชอต Skills
   - เรียก `runEmbeddedPiAgent` (รันไทม์ pi-agent-core)
   - ปล่อย **lifecycle end/error** หากลูปแบบฝังไม่ได้ปล่อยเอง
3. `runEmbeddedPiAgent`:
   - จัดลำดับการรันผ่านคิวต่อเซสชัน + คิวส่วนกลาง
   - แก้ค่าโมเดล + โปรไฟล์ auth และสร้างเซสชัน pi
   - สมัครรับอีเวนต์ pi และสตรีมเดลตาของ assistant/tool
   - บังคับใช้ timeout -> ยกเลิกการรันหากเกินเวลา
   - สำหรับเทิร์นของ Codex app-server ให้ยกเลิกเทิร์นที่รับแล้วซึ่งหยุดสร้างความคืบหน้าของ app-server ก่อนอีเวนต์ปลายทาง
   - คืนค่า payload + เมตาดาต้า usage
4. `subscribeEmbeddedPiSession` เชื่อมอีเวนต์ pi-agent-core ไปยังสตรีม `agent` ของ OpenClaw:
   - อีเวนต์ tool => `stream: "tool"`
   - เดลตาของ assistant => `stream: "assistant"`
   - อีเวนต์ lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` ใช้ `waitForAgentRun`:
   - รอ **lifecycle end/error** สำหรับ `runId`
   - คืนค่า `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## การเข้าคิว + ภาวะพร้อมกัน

- การรันถูกจัดลำดับตามคีย์เซสชัน (เลนเซสชัน) และอาจผ่านเลนส่วนกลางด้วย
- วิธีนี้ป้องกัน race ของเครื่องมือ/เซสชัน และรักษาประวัติเซสชันให้สอดคล้องกัน
- ช่องทางรับส่งข้อความสามารถเลือกโหมดคิว (collect/steer/followup) ที่ป้อนเข้าสู่ระบบเลนนี้
  ดู [คิวคำสั่ง](/th/concepts/queue)
- การเขียน transcript ยังได้รับการป้องกันด้วย write lock ของเซสชันบนไฟล์เซสชันด้วย lock นี้
  รับรู้ process และอิงไฟล์ จึงจับ writer ที่ข้ามคิวใน process หรือมาจาก
  process อื่นได้ writer ของ transcript เซสชันจะรอได้สูงสุด `session.writeLock.acquireTimeoutMs`
  ก่อนรายงานว่าเซสชันไม่ว่าง ค่าเริ่มต้นคือ `60000` ms
- ค่าเริ่มต้นของ write lock เซสชันคือไม่ reentrant หาก helper ตั้งใจซ้อนการได้มาของ
  lock เดียวกันในขณะที่ยังคง writer เชิงตรรกะตัวเดียว ต้องเลือกใช้โดยชัดเจนด้วย
  `allowReentrant: true`

## การเตรียมเซสชัน + workspace

- workspace จะถูกแก้ค่าและสร้างขึ้น การรันแบบ sandbox อาจเปลี่ยนเส้นทางไปยังราก workspace ของ sandbox
- Skills จะถูกโหลด (หรือนำกลับมาใช้จากสแนปชอต) และฉีดเข้าไปใน env และ prompt
- ไฟล์ bootstrap/context จะถูกแก้ค่าและฉีดเข้าไปในรายงาน system prompt
- จะมีการได้มา session write lock; `SessionManager` จะถูกเปิดและเตรียมก่อนสตรีม เส้นทาง rewrite, compaction หรือ truncation ของ transcript ภายหลังใดๆ
  ต้องใช้ lock เดียวกันก่อนเปิดหรือ
  กลายพันธุ์ไฟล์ transcript

## การประกอบ prompt + system prompt

- system prompt สร้างจาก base prompt ของ OpenClaw, prompt ของ Skills, บริบท bootstrap และ override ต่อการรัน
- บังคับใช้ขีดจำกัดเฉพาะโมเดลและ token สำรองสำหรับ Compaction
- ดู [System prompt](/th/concepts/system-prompt) สำหรับสิ่งที่โมเดลเห็น

## จุด hook (ตำแหน่งที่คุณดักแทรกได้)

OpenClaw มีระบบ hook สองแบบ:

- **hook ภายใน** (hook ของ Gateway): สคริปต์ขับเคลื่อนด้วยอีเวนต์สำหรับคำสั่งและอีเวนต์วงจรชีวิต
- **hook ของ Plugin**: จุดขยายภายในวงจรชีวิต agent/tool และ pipeline ของ gateway

### hook ภายใน (hook ของ Gateway)

- **`agent:bootstrap`**: รันขณะสร้างไฟล์ bootstrap ก่อนสรุป system prompt
  ใช้สิ่งนี้เพื่อเพิ่ม/ลบไฟล์บริบท bootstrap
- **hook คำสั่ง**: `/new`, `/reset`, `/stop` และอีเวนต์คำสั่งอื่นๆ (ดูเอกสาร Hooks)

ดู [Hooks](/th/automation/hooks) สำหรับการตั้งค่าและตัวอย่าง

### hook ของ Plugin (วงจรชีวิต agent + gateway)

สิ่งเหล่านี้รันภายในลูปเอเจนต์หรือ pipeline ของ gateway:

- **`before_model_resolve`**: รันก่อนเซสชัน (ไม่มี `messages`) เพื่อ override provider/model อย่างกำหนดซ้ำได้ก่อนการแก้ค่าโมเดล
- **`before_prompt_build`**: รันหลังโหลดเซสชัน (มี `messages`) เพื่อฉีด `prependContext`, `systemPrompt`, `prependSystemContext` หรือ `appendSystemContext` ก่อนส่ง prompt ใช้ `prependContext` สำหรับข้อความไดนามิกต่อเทิร์น และใช้ฟิลด์ system-context สำหรับคำแนะนำที่เสถียรซึ่งควรอยู่ในพื้นที่ system prompt
- **`before_agent_start`**: hook ความเข้ากันได้แบบเดิมที่อาจรันในเฟสใดเฟสหนึ่ง ควรใช้ hook ชัดเจนด้านบน
- **`before_agent_reply`**: รันหลัง inline actions และก่อนการเรียก LLM ทำให้ Plugin สามารถรับเทิร์นและคืนคำตอบสังเคราะห์หรือทำให้เทิร์นเงียบทั้งหมด
- **`agent_end`**: ตรวจสอบรายการข้อความสุดท้ายและเมตาดาต้าการรันหลังเสร็จสิ้น
- **`before_compaction` / `after_compaction`**: สังเกตหรือใส่คำอธิบายรอบ Compaction
- **`before_tool_call` / `after_tool_call`**: ดักพารามิเตอร์/ผลลัพธ์ของเครื่องมือ
- **`before_install`**: ตรวจสอบผลการสแกน built-in และเลือกบล็อกการติดตั้ง skill หรือ Plugin ได้
- **`tool_result_persist`**: แปลงผลลัพธ์เครื่องมือแบบ synchronous ก่อนเขียนลง transcript เซสชันที่ OpenClaw เป็นเจ้าของ
- **`message_received` / `message_sending` / `message_sent`**: hook ข้อความขาเข้า + ขาออก
- **`session_start` / `session_end`**: ขอบเขตวงจรชีวิตเซสชัน
- **`gateway_start` / `gateway_stop`**: อีเวนต์วงจรชีวิต gateway

กฎการตัดสินใจของ hook สำหรับ guard ขาออก/เครื่องมือ:

- `before_tool_call`: `{ block: true }` เป็นปลายทางและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นปลายทางและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นปลายทางและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับ API ของ hook และรายละเอียดการลงทะเบียน

harness อาจปรับ hook เหล่านี้ต่างกัน harness ของ Codex app-server รักษา
hook ของ Plugin ใน OpenClaw ให้เป็นสัญญาความเข้ากันได้สำหรับพื้นผิวที่ mirror และมีเอกสารประกอบ
ขณะที่ hook native ของ Codex ยังเป็นกลไก Codex ระดับต่ำอีกชุดหนึ่ง

## การสตรีม + คำตอบบางส่วน

- เดลตาของ assistant จะถูกสตรีมจาก pi-agent-core และปล่อยเป็นอีเวนต์ `assistant`
- การสตรีมแบบ block สามารถปล่อยคำตอบบางส่วนได้ทั้งบน `text_end` หรือ `message_end`
- การสตรีม reasoning สามารถปล่อยเป็นสตรีมแยกหรือเป็นคำตอบแบบ block ได้
- ดู [การสตรีม](/th/concepts/streaming) สำหรับพฤติกรรมการแบ่ง chunk และคำตอบแบบ block

## การเรียกใช้เครื่องมือ + เครื่องมือรับส่งข้อความ

- อีเวนต์เริ่ม/อัปเดต/จบของเครื่องมือจะถูกปล่อยบนสตรีม `tool`
- ผลลัพธ์เครื่องมือจะถูก sanitize ด้านขนาดและ payload รูปภาพก่อนบันทึก/ปล่อยอีเวนต์
- การส่งของเครื่องมือรับส่งข้อความจะถูกติดตามเพื่อระงับคำยืนยันซ้ำจาก assistant

## การจัดรูปคำตอบ + การระงับ

- payload สุดท้ายประกอบจาก:
  - ข้อความ assistant (และ reasoning ที่เลือกใช้ได้)
  - สรุปเครื่องมือแบบ inline (เมื่อ verbose + อนุญาต)
  - ข้อความ error ของ assistant เมื่อโมเดลเกิด error
- token เงียบแบบตรงตัว `NO_REPLY` / `no_reply` จะถูกกรองออกจาก
  payload ขาออก
- รายการซ้ำของเครื่องมือรับส่งข้อความจะถูกลบออกจากรายการ payload สุดท้าย
- หากไม่มี payload ที่ render ได้เหลืออยู่และเครื่องมือเกิด error จะปล่อยคำตอบ fallback ของ error เครื่องมือ
  (เว้นแต่ว่าเครื่องมือรับส่งข้อความส่งคำตอบที่ผู้ใช้เห็นได้ไปแล้ว)

## Compaction + การลองใหม่

- Auto-compaction ปล่อยอีเวนต์สตรีม `compaction` และสามารถทริกเกอร์การลองใหม่ได้
- เมื่อลองใหม่ buffer ในหน่วยความจำและสรุปเครื่องมือจะถูกรีเซ็ตเพื่อหลีกเลี่ยงเอาต์พุตซ้ำ
- ดู [Compaction](/th/concepts/compaction) สำหรับ pipeline ของ Compaction

## สตรีมอีเวนต์ (ปัจจุบัน)

- `lifecycle`: ปล่อยโดย `subscribeEmbeddedPiSession` (และเป็น fallback โดย `agentCommand`)
- `assistant`: เดลตาที่สตรีมจาก pi-agent-core
- `tool`: อีเวนต์เครื่องมือที่สตรีมจาก pi-agent-core

## การจัดการช่องทางแชท

- เดลตาของ assistant จะถูก buffer เป็นข้อความ `delta` ของแชท
- จะปล่อย `final` ของแชทเมื่อเกิด **lifecycle end/error**

## timeout

- ค่าเริ่มต้นของ `agent.wait`: 30s (เฉพาะการรอ) พารามิเตอร์ `timeoutMs` ใช้ override ได้
- รันไทม์เอเจนต์: ค่าเริ่มต้น `agents.defaults.timeoutSeconds` คือ 172800s (48 ชั่วโมง); บังคับใช้ในตัวจับเวลายกเลิกของ `runEmbeddedPiAgent`
- รันไทม์ Cron: `timeoutSeconds` ของเทิร์นเอเจนต์แบบแยกเป็นของ cron scheduler เริ่มตัวจับเวลานั้นเมื่อการเรียกใช้เริ่มขึ้น ยกเลิกการรันพื้นฐานเมื่อถึงเส้นตายที่กำหนดค่าไว้ จากนั้นรัน cleanup แบบมีขอบเขตก่อนบันทึก timeout เพื่อไม่ให้เซสชันลูกค้างทำให้เลนติดอยู่
- การวินิจฉัย liveness ของเซสชัน: เมื่อเปิดใช้ diagnostics, `diagnostics.stuckSessionWarnMs` จัดประเภทเซสชัน `processing` ที่ยาวนานซึ่งไม่มี reply, tool, status, block หรือความคืบหน้า ACP ที่สังเกตเห็น การรันแบบฝังที่ active, การเรียกโมเดล และการเรียกเครื่องมือจะรายงานเป็น `session.long_running`; งาน active ที่ไม่มีความคืบหน้าล่าสุดจะรายงานเป็น `session.stalled`; `session.stuck` สงวนไว้สำหรับ bookkeeping เซสชันเก่าที่ไม่มีงาน active bookkeeping เซสชันเก่าจะปล่อยเลนเซสชันที่ได้รับผลกระทบทันที; การรันแบบฝังที่ stalled จะถูก abort-drained เฉพาะหลัง `diagnostics.stuckSessionAbortMs` (ค่าเริ่มต้น: อย่างน้อย 10 นาทีและ 5 เท่าของ threshold คำเตือน) เพื่อให้งานที่เข้าคิวกลับมาทำงานต่อได้โดยไม่ตัดการรันที่เพียงแค่ช้า ผลการกู้คืนจะปล่อยผลลัพธ์ requested/completed แบบมีโครงสร้าง และสถานะ diagnostic จะถูกทำเครื่องหมาย idle เฉพาะเมื่อ generation การประมวลผลเดียวกันยังเป็นปัจจุบัน การวินิจฉัย `session.stuck` ซ้ำจะ back off ขณะที่เซสชันยังไม่เปลี่ยนแปลง
- timeout เมื่อโมเดล idle: OpenClaw ยกเลิกคำขอโมเดลเมื่อไม่มี response chunk มาถึงก่อนหน้าต่าง idle `models.providers.<id>.timeoutSeconds` ขยาย watchdog idle นี้สำหรับ provider local/self-hosted ที่ช้า มิฉะนั้น OpenClaw ใช้ `agents.defaults.timeoutSeconds` เมื่อกำหนดค่าไว้ โดยค่าเริ่มต้นจำกัดสูงสุดที่ 120s การรันที่ทริกเกอร์โดย Cron ซึ่งไม่มี timeout ของโมเดลหรือเอเจนต์ที่ระบุชัดเจนจะปิด watchdog idle และพึ่งพา timeout ภายนอกของ cron
- timeout ของคำขอ HTTP provider: `models.providers.<id>.timeoutSeconds` ใช้กับการ fetch HTTP ของโมเดลของ provider นั้น รวมถึง connect, headers, body, timeout คำขอ SDK, การจัดการ abort ของ guarded-fetch ทั้งหมด และ watchdog idle ของสตรีมโมเดล ใช้สิ่งนี้สำหรับ provider local/self-hosted ที่ช้า เช่น Ollama ก่อนเพิ่ม timeout รันไทม์เอเจนต์ทั้งหมด

## จุดที่สิ่งต่างๆ จบก่อนกำหนดได้

- timeout ของเอเจนต์ (abort)
- AbortSignal (cancel)
- Gateway disconnect หรือ RPC timeout
- timeout ของ `agent.wait` (เฉพาะการรอ ไม่หยุดเอเจนต์)

## ที่เกี่ยวข้อง

- [เครื่องมือ](/th/tools) — เครื่องมือเอเจนต์ที่มีให้ใช้
- [Hooks](/th/automation/hooks) — สคริปต์ขับเคลื่อนด้วยอีเวนต์ที่ถูกทริกเกอร์โดยอีเวนต์วงจรชีวิตเอเจนต์
- [Compaction](/th/concepts/compaction) — วิธีสรุปบทสนทนายาว
- [Exec Approvals](/th/tools/exec-approvals) — gate การอนุมัติสำหรับคำสั่ง shell
- [Thinking](/th/tools/thinking) — การกำหนดค่าระดับ thinking/reasoning
