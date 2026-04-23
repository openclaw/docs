---
read_when:
    - การดีบักเหตุการณ์การเสร็จสิ้นของ node exec ที่เกิดซ้ำៗ
    - กำลังทำงานกับการ dedupe เหตุการณ์ระบบ/Heartbeat
summary: บันทึกการสืบสวนสำหรับการฉีดการเสร็จสิ้นของ async exec ซ้ำซ้อน
title: การสืบสวนการเสร็จสิ้นซ้ำซ้อนของ Async Exec
x-i18n:
    generated_at: "2026-04-23T10:23:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# การสืบสวนการเสร็จสิ้นซ้ำซ้อนของ Async Exec

## ขอบเขต

- เซสชัน: `agent:main:telegram:group:-1003774691294:topic:1`
- อาการ: การเสร็จสิ้นของ async exec เดียวกันสำหรับ session/run `keen-nexus` ถูกบันทึกใน LCM ซ้ำสองครั้งในฐานะ user turn
- เป้าหมาย: ระบุว่าน่าจะเป็นการฉีดเข้าเซสชันซ้ำซ้อน หรือเป็นเพียงการ retry การส่งขาออกตามปกติ

## ข้อสรุป

สิ่งที่เป็นไปได้มากที่สุดคือ **การฉีดเข้าเซสชันซ้ำซ้อน** ไม่ใช่เพียงการ retry การส่งขาออกล้วน ๆ

ช่องโหว่ฝั่ง gateway ที่ชัดที่สุดอยู่ใน **เส้นทางการเสร็จสิ้นของ node exec**:

1. การสิ้นสุด exec ฝั่ง node จะปล่อย `exec.finished` พร้อม `runId` แบบเต็ม
2. Gateway `server-node-events` จะแปลงสิ่งนั้นเป็นเหตุการณ์ระบบและขอ Heartbeat
3. การรัน Heartbeat จะฉีดบล็อกเหตุการณ์ระบบที่ถูก drain แล้วเข้าไปในพรอมต์ของ agent
4. embedded runner จะบันทึกพรอมต์นั้นเป็น user turn ใหม่ใน transcript ของเซสชัน

หาก `exec.finished` เดียวกันมาถึง gateway ซ้ำสองครั้งด้วย `runId` เดียวกันไม่ว่าด้วยเหตุผลใดก็ตาม (replay, reconnect ซ้ำ, upstream resend, producer ซ้ำ) ขณะนี้ OpenClaw **ยังไม่มีการตรวจสอบ idempotency ที่อิงด้วย `runId`/`contextKey`** บนเส้นทางนี้ สำเนาที่สองจะกลายเป็นข้อความผู้ใช้ข้อความที่สองที่มีเนื้อหาเหมือนกัน

## เส้นทางโค้ดที่แน่นอน

### 1. Producer: เหตุการณ์การเสร็จสิ้นของ node exec

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` ปล่อย `node.event` พร้อมเหตุการณ์ `exec.finished`
  - payload มี `sessionKey` และ `runId` แบบเต็ม

### 2. การรับเหตุการณ์เข้าสู่ Gateway

- `src/gateway/server-node-events.ts:574-640`
  - จัดการ `exec.finished`
  - สร้างข้อความ:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - เข้าคิวผ่าน:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - ขอ wake ทันที:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. จุดอ่อนของการ dedupe เหตุการณ์ระบบ

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` จะกดทับเฉพาะ **ข้อความซ้ำที่ติดกัน**:
    - `if (entry.lastText === cleaned) return false`
  - มันเก็บ `contextKey` ไว้ แต่ **ไม่ได้** ใช้ `contextKey` เพื่อทำ idempotency
  - หลังจาก drain แล้ว การกดทับข้อความซ้ำจะรีเซ็ต

นี่หมายความว่า `exec.finished` ที่ถูก replay ด้วย `runId` เดิม สามารถถูกยอมรับได้อีกในภายหลัง แม้ว่าโค้ดจะมี candidate สำหรับ idempotency ที่เสถียรอยู่แล้ว (`exec:<runId>`)

### 4. การจัดการ wake ไม่ใช่ตัวทำให้ซ้ำหลัก

- `src/infra/heartbeat-wake.ts:79-117`
  - การ wake จะถูกรวมโดย `(agentId, sessionKey)`
  - คำขอ wake ซ้ำสำหรับเป้าหมายเดียวกันจะถูกรวมเหลือรายการ pending wake เดียว

สิ่งนี้ทำให้ **การจัดการ wake ซ้ำเพียงอย่างเดียว** เป็นคำอธิบายที่อ่อนกว่าการรับเหตุการณ์ซ้ำ

### 5. Heartbeat ใช้เหตุการณ์นั้นและแปลงเป็นอินพุตของพรอมต์

- `src/infra/heartbeat-runner.ts:535-574`
  - preflight จะ peek เหตุการณ์ระบบที่ค้างอยู่และจัดประเภทการรันแบบ exec-event
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` จะ drain คิวของเซสชัน
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - บล็อกเหตุการณ์ระบบที่ถูก drain แล้วจะถูก prepend เข้าไปใน body ของพรอมต์ของ agent

### 6. จุดที่ฉีดเข้า transcript

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` ส่งพรอมต์เต็มไปยังเซสชัน PI แบบ embedded
  - นั่นคือจุดที่พรอมต์ที่มาจาก completion กลายเป็น user turn ที่ถูกบันทึกไว้

ดังนั้นเมื่อเหตุการณ์ระบบเดียวกันถูกสร้างกลับเข้าไปในพรอมต์ซ้ำสองครั้ง ข้อความผู้ใช้ซ้ำใน LCM จึงเป็นสิ่งที่คาดหมายได้

## เหตุใดการ retry การส่งขาออกตามปกติจึงมีโอกาสน้อยกว่า

มีเส้นทางความล้มเหลวขาออกจริงใน heartbeat runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - สร้างการตอบกลับก่อน
  - การส่งขาออกเกิดขึ้นภายหลังผ่าน `deliverOutboundPayloads(...)`
  - ความล้มเหลวที่จุดนั้นจะคืน `{ status: "failed" }`

อย่างไรก็ตาม สำหรับรายการในคิวเหตุการณ์ระบบเดียวกัน สิ่งนี้เพียงอย่างเดียว **ยังไม่เพียงพอ** ที่จะอธิบาย user turn ซ้ำ:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - คิวเหตุการณ์ระบบถูก drain ไปแล้วก่อนการส่งขาออก

ดังนั้นการ retry การส่งของช่องทางเพียงอย่างเดียวจะไม่สร้างเหตุการณ์ในคิวเดิมขึ้นมาใหม่ มันอาจอธิบายการส่งภายนอกที่หายไป/ล้มเหลวได้ แต่ไม่สามารถอธิบายข้อความผู้ใช้ในเซสชันที่เหมือนกันซ้ำเป็นครั้งที่สองได้ด้วยตัวมันเอง

## ความเป็นไปได้รองที่มีความเชื่อมั่นต่ำกว่า

มีลูป retry แบบ full-run ใน agent runner:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - ความล้มเหลวชั่วคราวบางชนิดสามารถ retry การรันทั้งรอบและส่ง `commandBody` เดิมซ้ำ

สิ่งนี้อาจทำให้พรอมต์ผู้ใช้ที่ถูกบันทึกไว้ซ้ำ **ภายในการรันตอบกลับเดียวกัน** หากพรอมต์ถูก append ไปแล้วก่อนที่เงื่อนไข retry จะเกิดขึ้น

ผมจัดอันดับสิ่งนี้ต่ำกว่าการรับ `exec.finished` ซ้ำ เพราะว่า:

- ช่องว่างที่สังเกตได้อยู่ราว 51 วินาที ซึ่งดูเหมือนเป็น wake/turn รอบที่สองมากกว่าการ retry ภายในโปรเซส;
- รายงานได้กล่าวถึงความล้มเหลวในการส่งข้อความซ้ำอยู่แล้ว ซึ่งชี้ไปที่เทิร์นแยกในภายหลังมากกว่าการ retry ของโมเดล/รันไทม์แบบทันที

## สมมติฐานสาเหตุราก

สมมติฐานที่มีความเชื่อมั่นสูงสุด:

- การเสร็จสิ้นของ `keen-nexus` มาผ่าน **เส้นทางเหตุการณ์ node exec**
- `exec.finished` เดียวกันถูกส่งถึง `server-node-events` สองครั้ง
- Gateway ยอมรับทั้งสองครั้ง เพราะ `enqueueSystemEvent(...)` ไม่ได้ dedupe ด้วย `contextKey` / `runId`
- เหตุการณ์แต่ละรายการที่ถูกยอมรับจะทริกเกอร์ Heartbeat และถูกฉีดเป็น user turn เข้าไปใน transcript ของ PI

## ข้อเสนอแก้ไขแบบเล็กและเฉพาะจุด

หากต้องการแก้ไข การเปลี่ยนแปลงที่เล็กแต่มีมูลค่าสูงที่สุดคือ:

- ทำให้ idempotency ของ exec/system-event เคารพ `contextKey` ในช่วงเวลาสั้น ๆ อย่างน้อยสำหรับการซ้ำแบบตรงตัวของ `(sessionKey, contextKey, text)`
- หรือเพิ่มการ dedupe เฉพาะใน `server-node-events` สำหรับ `exec.finished` โดยอิงจาก `(sessionKey, runId, ชนิดของเหตุการณ์)`

สิ่งนี้จะบล็อก `exec.finished` ที่ถูก replay ซ้ำได้โดยตรง ก่อนที่มันจะกลายเป็น turn ในเซสชัน
