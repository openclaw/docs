---
read_when:
    - คุณต้องดีบักรหัสเซสชัน, JSONL ของทรานสคริปต์ หรือฟิลด์ sessions.json
    - คุณกำลังเปลี่ยนลักษณะการทำงานของ Compaction อัตโนมัติ หรือเพิ่มงานดูแลความเรียบร้อย “ก่อน Compaction”
    - คุณต้องการนำการล้างหน่วยความจำหรือรอบการทำงานของระบบแบบเงียบไปใช้
summary: 'เจาะลึก: ที่เก็บเซสชัน + ทรานสคริปต์ วงจรชีวิต และกลไกภายในของ Compaction (อัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-05-05T08:26:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw จัดการเซสชันตั้งแต่ต้นจนจบในส่วนเหล่านี้:

- **การกำหนดเส้นทางเซสชัน** (วิธีที่ข้อความขาเข้าถูกแมปไปยัง `sessionKey`)
- **ที่เก็บเซสชัน** (`sessions.json`) และสิ่งที่ติดตาม
- **การคงอยู่ของทรานสคริปต์** (`*.jsonl`) และโครงสร้างของมัน
- **สุขอนามัยของทรานสคริปต์** (การปรับแก้เฉพาะผู้ให้บริการก่อนรัน)
- **ขีดจำกัดบริบท** (หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม)
- **Compaction** (Compaction แบบแมนนวลและอัตโนมัติ) และจุดสำหรับเชื่อมงานก่อน Compaction
- **งานดูแลเงียบ** (การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

หากต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

- [การจัดการเซสชัน](/th/concepts/session)
- [Compaction](/th/concepts/compaction)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [สุขอนามัยของทรานสคริปต์](/th/reference/transcript-hygiene)

---

## แหล่งความจริง: Gateway

OpenClaw ออกแบบโดยมี **กระบวนการ Gateway** เดียวที่เป็นเจ้าของสถานะเซสชัน

- UI (แอป macOS, Control UI บนเว็บ, TUI) ควรสอบถาม Gateway เพื่อดูรายการเซสชันและจำนวนโทเค็น
- ในโหมดรีโมต ไฟล์เซสชันอยู่บนโฮสต์รีโมต; “การตรวจไฟล์บน Mac เครื่องของคุณ” จะไม่สะท้อนสิ่งที่ Gateway ใช้อยู่

---

## เลเยอร์การคงอยู่สองชั้น

OpenClaw คงอยู่เซสชันในสองเลเยอร์:

1. **ที่เก็บเซสชัน (`sessions.json`)**
   - แมปคีย์/ค่า: `sessionKey -> SessionEntry`
   - ขนาดเล็ก เปลี่ยนแปลงได้ แก้ไขได้อย่างปลอดภัย (หรือลบรายการได้)
   - ติดตามเมตาดาต้าเซสชัน (id เซสชันปัจจุบัน กิจกรรมล่าสุด สวิตช์ ตัวนับโทเค็น ฯลฯ)

2. **ทรานสคริปต์ (`<sessionId>.jsonl`)**
   - ทรานสคริปต์แบบต่อท้ายอย่างเดียวพร้อมโครงสร้างต้นไม้ (รายการมี `id` + `parentId`)
   - จัดเก็บการสนทนาจริง + การเรียกเครื่องมือ + สรุป Compaction
   - ใช้สร้างบริบทโมเดลใหม่สำหรับเทิร์นในอนาคต
   - จุดตรวจดีบักขนาดใหญ่ก่อน Compaction จะถูกข้ามเมื่อทรานสคริปต์ที่ใช้งานอยู่
     เกินเพดานขนาดจุดตรวจ เพื่อหลีกเลี่ยงการทำสำเนา `.checkpoint.*.jsonl`
     ขนาดยักษ์ชุดที่สอง

ตัวอ่านประวัติของ Gateway ควรหลีกเลี่ยงการ materialize ทรานสคริปต์ทั้งหมด เว้นแต่
พื้นผิวนั้นต้องการการเข้าถึงประวัติตามอำเภอใจอย่างชัดเจน ประวัติหน้าแรก
ประวัติแชตแบบฝัง การกู้คืนหลังรีสตาร์ต และการตรวจโทเค็น/การใช้งาน ใช้การอ่านส่วนท้ายแบบมีขอบเขต
การสแกนทรานสคริปต์เต็มรูปแบบผ่านดัชนีทรานสคริปต์แบบ async ซึ่ง
แคชด้วยเส้นทางไฟล์ร่วมกับ `mtimeMs`/`size` และแชร์ระหว่างตัวอ่านที่ทำงานพร้อมกัน

---

## ตำแหน่งบนดิสก์

ต่อเอเจนต์ บนโฮสต์ Gateway:

- ที่เก็บ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- ทรานสคริปต์: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve ตำแหน่งเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษาที่เก็บและการควบคุมดิสก์

การคงอยู่ของเซสชันมีการควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json`, artifact ของทรานสคริปต์ และ sidecar ของ trajectory:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: เกณฑ์อายุรายการที่ค้าง (ค่าเริ่มต้น `30d`)
- `maxEntries`: เพดานรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- `resetArchiveRetention`: ระยะเก็บรักษา archive ทรานสคริปต์ `*.reset.<timestamp>` (ค่าเริ่มต้น: เหมือน `pruneAfter`; `false` ปิดการล้างข้อมูล)
- `maxDiskBytes`: งบประมาณไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังล้างข้อมูล (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

การเขียนปกติของ Gateway ไหลผ่านตัวเขียนเซสชันต่อที่เก็บ ซึ่ง serialize การเปลี่ยนแปลงในกระบวนการโดยไม่ต้องใช้ runtime file lock ตัวช่วยแพตช์ใน hot path ยืมแคชที่เปลี่ยนแปลงได้ซึ่งผ่านการตรวจแล้วระหว่างที่ถือสล็อตตัวเขียนนั้น ดังนั้นไฟล์ `sessions.json` ขนาดใหญ่จะไม่ถูก clone หรืออ่านซ้ำสำหรับการอัปเดตเมตาดาต้าทุกครั้ง โค้ด runtime ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)`; การบันทึกทั้งที่เก็บโดยตรงเป็นเครื่องมือความเข้ากันได้และการบำรุงรักษาแบบออฟไลน์ เมื่อเข้าถึง Gateway ได้ `openclaw sessions cleanup` และ `openclaw agents delete` แบบไม่ใช่ dry run จะมอบหมายการเปลี่ยนแปลงที่เก็บให้ Gateway เพื่อให้การล้างข้อมูลเข้าคิวตัวเขียนเดียวกัน; `--store <path>` คือเส้นทางซ่อมแซมออฟไลน์แบบชัดเจนสำหรับการบำรุงรักษาไฟล์โดยตรง การล้าง `maxEntries` ยัง batch สำหรับเพดานระดับ production ดังนั้นที่เก็บอาจเกินเพดานที่กำหนดไว้ชั่วครู่ก่อนการล้าง high-water ครั้งถัดไปจะเขียนให้ลดลง การอ่านที่เก็บเซสชันไม่ตัดแต่งหรือจำกัดรายการระหว่างเริ่มต้น Gateway; ใช้การเขียนหรือ `openclaw sessions cleanup --enforce` เพื่อล้างข้อมูล `openclaw sessions cleanup --enforce` ยังใช้เพดานที่กำหนดไว้ทันที และตัดแต่ง artifact ทรานสคริปต์ จุดตรวจ และ trajectory เก่าที่ไม่ถูกอ้างอิง แม้ไม่ได้กำหนดงบประมาณดิสก์

การบำรุงรักษาจะเก็บตัวชี้การสนทนาภายนอกที่คงทน เช่น เซสชันกลุ่ม
และเซสชันแชตที่ scoped ตามเธรด แต่รายการ runtime สังเคราะห์สำหรับ Cron, hooks,
Heartbeat, ACP และ sub-agents ยังอาจถูกลบได้เมื่อเกิน
อายุ จำนวน หรืองบประมาณดิสก์ที่กำหนดไว้

OpenClaw ไม่สร้าง backup หมุนเวียนอัตโนมัติ `sessions.json.bak.*` ระหว่างการเขียนของ Gateway อีกต่อไป คีย์เดิม `session.maintenance.rotateBytes` จะถูกละเว้น และ `openclaw doctor --fix` จะลบคีย์นี้ออกจาก config เก่า

การเปลี่ยนแปลงทรานสคริปต์ใช้ session write lock บนไฟล์ทรานสคริปต์ การขอ lock จะรอได้สูงสุด
`session.writeLock.acquireTimeoutMs` ก่อนแสดงข้อผิดพลาดเซสชันไม่ว่าง ค่าเริ่มต้นคือ `60000`
ms เพิ่มค่านี้เฉพาะเมื่อการเตรียม การล้างข้อมูล Compaction หรืองาน mirror ทรานสคริปต์ที่ถูกต้องตามปกติแย่ง lock
นานกว่านั้นบนเครื่องที่ช้า การตรวจ lock ค้างและคำเตือนเวลาถือ lock สูงสุดยังคงเป็นนโยบายแยกกัน

ลำดับการบังคับใช้สำหรับการล้างตามงบประมาณดิสก์ (`mode: "enforce"`):

1. ลบ artifact ที่ archive ไว้ รายการทรานสคริปต์กำพร้า หรือ trajectory กำพร้าที่เก่าที่สุดก่อน
2. หากยังเกินเป้าหมาย ให้ evict รายการเซสชันที่เก่าที่สุดและไฟล์ทรานสคริปต์/trajectory ของรายการนั้น
3. ทำต่อจนกว่าการใช้งานจะอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการ evict ที่อาจเกิดขึ้น แต่ไม่เปลี่ยนแปลงที่เก็บ/ไฟล์

รันการบำรุงรักษาตามต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และบันทึกการรัน

การรัน Cron แบบแยกยังสร้างรายการเซสชัน/ทรานสคริปต์ด้วย และมีการควบคุมการเก็บรักษาเฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ตัดแต่งเซสชันการรัน Cron แบบแยกเก่าออกจากที่เก็บเซสชัน (`false` ปิดใช้)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` ตัดแต่งไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` ไบต์ และ `2000` บรรทัด)

เมื่อ Cron บังคับสร้างเซสชันการรันแบบแยกใหม่ จะ sanitize รายการเซสชัน
`cron:<jobId>` ก่อนหน้า ก่อนเขียนแถวใหม่ โดยนำ preference ที่ปลอดภัย
เช่น การตั้งค่า thinking/fast/verbose, ป้ายกำกับ และ model/auth override
ที่ผู้ใช้เลือกไว้อย่างชัดเจนติดไปด้วย และทิ้งบริบทการสนทนาโดยรอบ
เช่น การกำหนดเส้นทาง channel/group, นโยบายการส่งหรือคิว, elevation, origin และ ACP
runtime binding เพื่อให้การรันแบบแยกที่สดใหม่ไม่สามารถสืบทอดการส่งมอบหรือ
อำนาจ runtime ที่ค้างจากการรันเก่า

---

## คีย์เซสชัน (`sessionKey`)

`sessionKey` ระบุว่า _คุณอยู่ในถังการสนทนาใด_ (การกำหนดเส้นทาง + การแยก)

รูปแบบทั่วไป:

- แชตหลัก/โดยตรง (ต่อเอเจนต์): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่ถูก override)

กฎ canonical มีเอกสารที่ [/concepts/session](/th/concepts/session)

---

## id เซสชัน (`sessionId`)

แต่ละ `sessionKey` ชี้ไปยัง `sessionId` ปัจจุบัน (ไฟล์ทรานสคริปต์ที่ต่อเนื่องการสนทนา)

หลักปฏิบัติคร่าว ๆ:

- **รีเซ็ต** (`/new`, `/reset`) สร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **รีเซ็ตรายวัน** (ค่าเริ่มต้น 4:00 AM เวลาท้องถิ่นบนโฮสต์ Gateway) สร้าง `sessionId` ใหม่ในข้อความถัดไปหลังผ่านขอบเขตรีเซ็ต
- **หมดอายุจากการไม่ได้ใช้งาน** (`session.reset.idleMinutes` หรือเดิม `session.idleMinutes`) สร้าง `sessionId` ใหม่เมื่อมีข้อความมาถึงหลังพ้นช่วง idle window เมื่อกำหนดค่าทั้งรายวัน + idle ไว้ ตัวใดหมดอายุก่อนจะมีผล
- **เหตุการณ์ระบบ** (Heartbeat, การปลุก Cron, การแจ้งเตือน exec, งาน bookkeeping ของ Gateway) อาจเปลี่ยนแถวเซสชัน แต่ไม่ยืดความสดของการรีเซ็ตรายวัน/idle การ rollover จากรีเซ็ตจะทิ้งประกาศเหตุการณ์ระบบที่เข้าคิวไว้สำหรับเซสชันก่อนหน้า ก่อนสร้าง prompt ใหม่
- **นโยบาย parent fork** ใช้ active branch ของ PI เมื่อสร้างเธรดหรือ subagent fork หาก branch นั้นใหญ่เกินไป OpenClaw จะเริ่ม child ด้วยบริบทแบบแยกแทนที่จะล้มเหลวหรือสืบทอดประวัติที่ใช้ไม่ได้ นโยบายการคำนวณขนาดเป็นอัตโนมัติ; config เดิม `session.parentForkMaxTokens` ถูกลบโดย `openclaw doctor --fix`

รายละเอียดการใช้งาน: การตัดสินใจเกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## สคีมาที่เก็บเซสชัน (`sessions.json`)

ชนิดค่าของที่เก็บคือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: id ทรานสคริปต์ปัจจุบัน (ชื่อไฟล์ derive จากค่านี้ เว้นแต่ตั้ง `sessionFile`)
- `sessionStartedAt`: timestamp เริ่มต้นสำหรับ `sessionId` ปัจจุบัน; ความสดของการรีเซ็ตรายวัน
  ใช้ค่านี้ แถวเดิมอาจ derive จาก header เซสชัน JSONL
- `lastInteractionAt`: timestamp ของการโต้ตอบจริงครั้งล่าสุดจากผู้ใช้/channel; ความสดของการรีเซ็ต idle
  ใช้ค่านี้เพื่อให้ Heartbeat, Cron และเหตุการณ์ exec ไม่คงเซสชัน
  ให้มีชีวิตอยู่ แถวเดิมที่ไม่มีฟิลด์นี้จะ fallback ไปยังเวลาเริ่มเซสชันที่กู้คืนได้
  สำหรับความสดของ idle
- `updatedAt`: timestamp การเปลี่ยนแปลงแถวที่เก็บล่าสุด ใช้สำหรับการแสดงรายการ การตัดแต่ง และ
  bookkeeping ไม่ใช่แหล่งอำนาจสำหรับความสดของการรีเซ็ตรายวัน/idle
- `sessionFile`: override เส้นทางทรานสคริปต์แบบ explicit ที่ไม่บังคับ
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายการส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: เมตาดาต้าสำหรับ labeling กลุ่ม/channel
- สวิตช์:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (best-effort / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ความถี่ที่ auto-compaction เสร็จสมบูรณ์สำหรับคีย์เซสชันนี้
- `memoryFlushAt`: timestamp สำหรับการ flush หน่วยความจำก่อน Compaction ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction เมื่อการ flush ล่าสุดรัน

ที่เก็บแก้ไขได้อย่างปลอดภัย แต่ Gateway คือแหล่งอำนาจ: อาจเขียนใหม่หรือ rehydrate รายการเมื่อเซสชันรัน

---

## โครงสร้างทรานสคริปต์ (`*.jsonl`)

ทรานสคริปต์จัดการโดย `SessionManager` ของ `@mariozechner/pi-coding-agent`

ไฟล์เป็น JSONL:

- บรรทัดแรก: header เซสชัน (`type: "session"`, มี `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- จากนั้น: รายการเซสชันที่มี `id` + `parentId` (ต้นไม้)

ชนิดรายการที่น่าสนใจ:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension inject ซึ่ง _เข้า_ บริบทโมเดล (ซ่อนจาก UI ได้)
- `custom`: สถานะ extension ที่ _ไม่เข้า_ บริบทโมเดล
- `compaction`: สรุป Compaction ที่คงอยู่ พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่คงอยู่เมื่อนำทาง branch ของต้นไม้

OpenClaw ตั้งใจ **ไม่** “fix up” ทรานสคริปต์; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียนมัน

---

## หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม

มีแนวคิดที่ต่างกันสองอย่างที่สำคัญ:

1. **หน้าต่างบริบทโมเดล**: เพดานแข็งต่อโมเดล (โทเค็นที่โมเดลมองเห็น)
2. **ตัวนับในที่เก็บเซสชัน**: สถิติ rolling ที่เขียนลงใน `sessions.json` (ใช้สำหรับ /status และแดชบอร์ด)

หากคุณกำลังปรับจูนขีดจำกัด:

- หน้าต่างบริบทมาจาก catalog โมเดล (และสามารถ override ผ่าน config ได้)
- `contextTokens` ในที่เก็บเป็นค่าประมาณ/ค่ารายงาน runtime; อย่าถือว่าเป็นการรับประกันที่เข้มงวด

ดูเพิ่มเติมที่ [/token-use](/th/reference/token-use)

---

## Compaction: คืออะไร

Compaction สรุปการสนทนาเก่าลงในรายการ `compaction` ที่คงอยู่ในทรานสคริปต์ และเก็บข้อความล่าสุดไว้ครบถ้วน

หลัง Compaction เทิร์นในอนาคตจะเห็น:

- สรุป Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction เป็นแบบ **persistent** (ต่างจากการตัดแต่งเซสชัน) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขตชิ้นส่วน Compaction และการจับคู่เครื่องมือ

เมื่อ OpenClaw แบ่งทรานสคริปต์ยาวออกเป็นชิ้นส่วน Compaction ระบบจะเก็บ
การเรียกเครื่องมือของผู้ช่วยให้จับคู่กับรายการ `toolResult` ที่ตรงกัน

- หากการแบ่งตามสัดส่วนโทเค็นตกอยู่ระหว่างการเรียกเครื่องมือและผลลัพธ์ของเครื่องมือนั้น OpenClaw
  จะเลื่อนขอบเขตไปที่ข้อความการเรียกเครื่องมือของผู้ช่วยแทนการแยก
  คู่ออกจากกัน
- หากบล็อกผลลัพธ์เครื่องมือท้ายสุดจะทำให้ชิ้นส่วนเกินเป้าหมาย
  OpenClaw จะคงบล็อกเครื่องมือที่ค้างอยู่นั้นไว้และเก็บส่วนท้ายที่ยังไม่ได้สรุป
  ให้สมบูรณ์
- บล็อกการเรียกเครื่องมือที่ถูกยกเลิก/เกิดข้อผิดพลาดจะไม่ทำให้การแบ่งที่ค้างอยู่เปิดค้างไว้

---

## เมื่อ auto-compaction เกิดขึ้น (รันไทม์ Pi)

ในเอเจนต์ Pi แบบฝัง auto-compaction จะทำงานในสองกรณี:

1. **การกู้คืนจากการล้น**: โมเดลส่งคืนข้อผิดพลาด context overflow
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และตัวแปรที่มีรูปแบบตามผู้ให้บริการที่คล้ายกัน) → compact → ลองใหม่
2. **การดูแลตามเกณฑ์**: หลังจากเทิร์นสำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือ context window ของโมเดล
- `reserveTokens` คือพื้นที่เผื่อที่สงวนไว้สำหรับพรอมป์ + เอาต์พุตโมเดลถัดไป

นี่คือความหมายเชิงรันไทม์ของ Pi (OpenClaw บริโภคเหตุการณ์ แต่ Pi เป็นผู้ตัดสินใจว่าจะ compact เมื่อใด)

OpenClaw ยังสามารถเรียก local compaction แบบ preflight ก่อนเปิดรันถัดไป
เมื่อมีการตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` และไฟล์
ทรานสคริปต์ที่ใช้งานอยู่ถึงขนาดนั้น นี่เป็น guard ตามขนาดไฟล์เพื่อลดต้นทุน
การเปิดใหม่ในเครื่อง ไม่ใช่การเก็บถาวรแบบดิบ: OpenClaw ยังคงรัน semantic compaction
ตามปกติ และต้องใช้ `truncateAfterCompaction` เพื่อให้สรุปที่ compact แล้วกลายเป็น
ทรานสคริปต์สืบทอดใหม่ได้

สำหรับรัน Pi แบบฝัง `agents.defaults.compaction.midTurnPrecheck.enabled: true`
จะเพิ่ม tool-loop guard แบบเลือกเปิด หลังจากผนวกผลลัพธ์เครื่องมือและก่อน
การเรียกโมเดลครั้งถัดไป OpenClaw จะประเมินแรงกดดันของพรอมป์โดยใช้ตรรกะงบประมาณ
preflight เดียวกับที่ใช้ตอนเริ่มเทิร์น หาก context ไม่พอดีอีกต่อไป guard จะ
ไม่ compact ภายใน hook `transformContext` ของ Pi แต่จะส่งสัญญาณ precheck
กลางเทิร์นแบบมีโครงสร้าง หยุดการส่งพรอมป์ปัจจุบัน และให้
ลูปรันภายนอกใช้เส้นทางกู้คืนที่มีอยู่: ตัดผลลัพธ์เครื่องมือที่ใหญ่เกินไป
เมื่อเพียงพอ หรือเรียกโหมด Compaction ที่กำหนดค่าไว้แล้วลองใหม่ ตัวเลือกนี้
ปิดไว้โดยค่าเริ่มต้นและทำงานได้ทั้งกับโหมด Compaction `default` และ `safeguard`
รวมถึง provider-backed safeguard compaction
สิ่งนี้เป็นอิสระจาก `maxActiveTranscriptBytes`: guard ตามขนาดไบต์จะรัน
ก่อนเปิดเทิร์น ขณะที่ mid-turn precheck จะรันภายหลังใน tool loop ของ Pi แบบฝัง
หลังจากมีการผนวกผลลัพธ์เครื่องมือใหม่แล้ว

---

## การตั้งค่า Compaction (`reserveTokens`, `keepRecentTokens`)

การตั้งค่า Compaction ของ Pi อยู่ในการตั้งค่า Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw ยังบังคับใช้ค่าพื้นความปลอดภัยสำหรับรันแบบฝังด้วย:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะเพิ่มค่าให้
- ค่าพื้นเริ่มต้นคือ `20000` โทเค็น
- ตั้งค่า `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิดใช้ค่าพื้น
- หากค่าสูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม
- `/compact` แบบแมนนวลจะเคารพ `agents.defaults.compaction.keepRecentTokens`
  ที่ระบุชัดเจน และคงจุดตัดส่วนท้ายล่าสุดของ Pi ไว้ หากไม่มีงบประมาณ keep ที่ระบุชัดเจน
  Compaction แบบแมนนวลจะยังคงเป็น checkpoint แบบเด็ดขาด และ context ที่สร้างใหม่จะเริ่มจาก
  สรุปใหม่
- ตั้งค่า `agents.defaults.compaction.midTurnPrecheck.enabled: true` เพื่อรัน
  precheck ของ tool loop แบบเลือกใช้หลังผลลัพธ์เครื่องมือใหม่และก่อนการเรียกโมเดล
  ครั้งถัดไป นี่เป็นเพียง trigger เท่านั้น การสร้างสรุปยังคงใช้เส้นทาง
  Compaction ที่กำหนดค่าไว้ สิ่งนี้เป็นอิสระจาก `maxActiveTranscriptBytes` ซึ่งเป็น
  guard ตามขนาดไบต์ของทรานสคริปต์ที่ใช้งานอยู่ตอนเริ่มเทิร์น
- ตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` เป็นค่าไบต์หรือ
  สตริง เช่น `"20mb"` เพื่อรัน local compaction ก่อนเทิร์นเมื่อทรานสคริปต์
  ที่ใช้งานอยู่มีขนาดใหญ่ guard นี้ทำงานเฉพาะเมื่อเปิดใช้
  `truncateAfterCompaction` ด้วย ปล่อยไว้ไม่ตั้งค่าหรือตั้งเป็น `0` เพื่อ
  ปิดใช้
- เมื่อเปิดใช้ `agents.defaults.compaction.truncateAfterCompaction`
  OpenClaw จะหมุนทรานสคริปต์ที่ใช้งานอยู่ไปเป็น JSONL สืบทอดที่ compact แล้วหลัง
  Compaction ทรานสคริปต์เต็มเก่าจะยังคงถูกเก็บถาวรและเชื่อมโยงจาก
  checkpoint ของ Compaction แทนการเขียนทับที่เดิม

เหตุผล: เว้นพื้นที่เผื่อให้เพียงพอสำหรับ “งานดูแลระบบ” แบบหลายเทิร์น (เช่น การเขียนหน่วยความจำ) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

การติดตั้งใช้งาน: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(เรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## ผู้ให้บริการ Compaction แบบเสียบได้

Plugin สามารถลงทะเบียนผู้ให้บริการ Compaction ผ่าน `registerCompactionProvider()` บน API ของ Plugin ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งค่าเป็น id ของผู้ให้บริการที่ลงทะเบียนไว้ Plugin safeguard จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline `summarizeInStages` ในตัว

- `provider`: id ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ ปล่อยไว้ไม่ตั้งค่าสำหรับการสรุปด้วย LLM เริ่มต้น
- การตั้งค่า `provider` จะบังคับ `mode: "safeguard"`
- ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการรักษาตัวระบุเดียวกับเส้นทางในตัว
- safeguard ยังคงรักษา context ส่วนต่อท้ายของเทิร์นล่าสุดและเทิร์นที่ถูกแบ่งหลังเอาต์พุตจากผู้ให้บริการ
- การสรุป safeguard ในตัวจะกลั่นสรุปก่อนหน้าซ้ำพร้อมข้อความใหม่
  แทนการเก็บสรุปก่อนหน้าทั้งหมดแบบคำต่อคำ
- โหมด safeguard เปิดใช้การตรวจสอบคุณภาพสรุปตามค่าเริ่มต้น; ตั้งค่า
  `qualityGuard.enabled: false` เพื่อข้ามพฤติกรรมลองใหม่เมื่อเอาต์พุตมีรูปแบบผิด
- หากผู้ให้บริการล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะถอยกลับไปใช้การสรุปด้วย LLM ในตัวโดยอัตโนมัติ
- สัญญาณ abort/timeout จะถูกโยนต่อ (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกจากผู้เรียก

แหล่งที่มา: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็น

คุณสามารถสังเกต Compaction และสถานะเซสชันได้ผ่าน:

- `/status` (ในเซสชันแชทใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- โหมดละเอียด: `🧹 Auto-compaction complete` + จำนวน Compaction

---

## งานดูแลระบบแบบเงียบ (`NO_REPLY`)

OpenClaw รองรับเทิร์น “เงียบ” สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ข้อตกลง:

- ผู้ช่วยเริ่มเอาต์พุตด้วยโทเค็นเงียบที่ตรงเป๊ะ `NO_REPLY` /
  `no_reply` เพื่อระบุว่า “อย่าส่งคำตอบไปยังผู้ใช้”
- OpenClaw จะลบ/ระงับสิ่งนี้ในชั้นการส่งมอบ
- การระงับด้วยโทเค็นเงียบแบบตรงเป๊ะไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` จึงนับทั้งคู่เมื่อ payload ทั้งหมดเป็นเพียงโทเค็นเงียบ
- สิ่งนี้ใช้สำหรับเทิร์นเบื้องหลัง/ไม่ส่งมอบจริงเท่านั้น ไม่ใช่ทางลัดสำหรับ
  คำขอผู้ใช้ทั่วไปที่ต้องดำเนินการ

ตั้งแต่ `2026.1.10` เป็นต้นไป OpenClaw ยังระงับ **การสตรีมฉบับร่าง/กำลังพิมพ์** เมื่อ
ชิ้นส่วนบางส่วนเริ่มด้วย `NO_REPLY` เพื่อให้การทำงานแบบเงียบไม่รั่วไหลเอาต์พุตบางส่วน
กลางเทิร์น

---

## "memory flush" ก่อน Compaction (ติดตั้งใช้งานแล้ว)

เป้าหมาย: ก่อน auto-compaction เกิดขึ้น ให้รันเทิร์น agentic แบบเงียบที่เขียนสถานะ
ถาวรลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ใน workspace ของเอเจนต์) เพื่อให้ Compaction ไม่สามารถ
ลบ context สำคัญได้

OpenClaw ใช้แนวทาง **pre-threshold flush**:

1. ตรวจสอบการใช้งาน context ของเซสชัน
2. เมื่อข้าม “soft threshold” (ต่ำกว่าเกณฑ์ Compaction ของ Pi) ให้รัน directive แบบเงียบ
   “write memory now” ไปยังเอเจนต์
3. ใช้โทเค็นเงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้ไม่เห็น
   อะไรเลย

การกำหนดค่า (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `model` (การ override ผู้ให้บริการ/โมเดลแบบตรงเป๊ะสำหรับเทิร์น flush, เช่น `ollama/qwen3:8b`, ไม่บังคับ)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับเทิร์น flush)
- `systemPrompt` (พรอมป์ระบบเพิ่มเติมที่ผนวกสำหรับเทิร์น flush)

หมายเหตุ:

- พรอมป์/พรอมป์ระบบเริ่มต้นมีคำใบ้ `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- เมื่อตั้งค่า `model` เทิร์น flush จะใช้โมเดลนั้นโดยไม่สืบทอด
  fallback chain ของเซสชันที่ใช้งานอยู่ ดังนั้นงานดูแลระบบที่ใช้เฉพาะเครื่องจึงไม่
  ถอยกลับไปใช้โมเดลสนทนาแบบเสียเงินอย่างเงียบ ๆ
- flush จะรันหนึ่งครั้งต่อรอบ Compaction (ติดตามใน `sessions.json`)
- flush จะรันเฉพาะสำหรับเซสชัน Pi แบบฝัง (backend ของ CLI จะข้าม)
- flush จะถูกข้ามเมื่อ workspace ของเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [Memory](/th/concepts/memory) สำหรับเลย์เอาต์ไฟล์ workspace และรูปแบบการเขียน

Pi ยังเปิดเผย hook `session_before_compact` ใน API ของ Plugin ด้วย แต่ตรรกะ
flush ของ OpenClaw อยู่ฝั่ง Gateway ในปัจจุบัน

---

## รายการตรวจสอบการแก้ไขปัญหา

- คีย์เซสชันผิดหรือไม่? เริ่มจาก [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- store กับทรานสคริปต์ไม่ตรงกันหรือไม่? ยืนยันโฮสต์ Gateway และเส้นทาง store จาก `openclaw status`
- มี Compaction ถี่เกินไปหรือไม่? ตรวจสอบ:
  - context window ของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` สูงเกินไปสำหรับหน้าต่างโมเดลอาจทำให้ Compaction เกิดเร็วขึ้น)
  - ผลลัพธ์เครื่องมือบวม: เปิดใช้/ปรับการตัดแต่งเซสชัน
- เทิร์นเงียบรั่วไหลหรือไม่? ยืนยันว่าคำตอบเริ่มด้วย `NO_REPLY` (โทเค็นตรงเป๊ะแบบไม่คำนึงถึงตัวพิมพ์เล็กใหญ่) และคุณอยู่บนบิลด์ที่มีการแก้ไขการระงับการสตรีมแล้ว

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [เอนจิน Context](/th/concepts/context-engine)
