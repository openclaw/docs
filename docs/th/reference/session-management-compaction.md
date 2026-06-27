---
read_when:
    - คุณต้องดีบักรหัสเซสชัน, transcript JSONL หรือฟิลด์ sessions.json
    - คุณกำลังเปลี่ยนพฤติกรรม auto-Compaction หรือเพิ่มงานดูแล housekeeping แบบ "ก่อน Compaction"
    - คุณต้องการนำการล้างหน่วยความจำหรือเทิร์นของระบบแบบเงียบไปใช้
summary: 'เจาะลึก: ที่เก็บเซสชัน + บันทึกถอดความ วงจรชีวิต และกลไกภายในของ Compaction (อัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-06-27T18:21:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw จัดการเซสชันแบบครบวงจรในพื้นที่เหล่านี้:

- **การกำหนดเส้นทางเซสชัน** (ข้อความขาเข้าแมปกับ `sessionKey` อย่างไร)
- **ที่เก็บเซสชัน** (`sessions.json`) และสิ่งที่ติดตาม
- **การคงอยู่ของบันทึกบทสนทนา** (`*.jsonl`) และโครงสร้างของมัน
- **สุขอนามัยของบันทึกบทสนทนา** (การแก้ไขเฉพาะผู้ให้บริการก่อนรัน)
- **ขีดจำกัดบริบท** (หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม)
- **Compaction** (การ Compaction แบบแมนนวลและอัตโนมัติ) และตำแหน่งสำหรับเชื่อมงานก่อน Compaction
- **งานดูแลเงียบ** (การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

หากต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

- [การจัดการเซสชัน](/th/concepts/session)
- [Compaction](/th/concepts/compaction)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [การตัดเซสชัน](/th/concepts/session-pruning)
- [สุขอนามัยของบันทึกบทสนทนา](/th/reference/transcript-hygiene)

---

## แหล่งข้อมูลจริง: Gateway

OpenClaw ถูกออกแบบโดยมี **กระบวนการ Gateway** เดียวที่เป็นเจ้าของสถานะเซสชัน

- UI (แอป macOS, Control UI บนเว็บ, TUI) ควรสอบถาม Gateway เพื่อดูรายการเซสชันและจำนวนโทเค็น
- ในโหมดระยะไกล ไฟล์เซสชันอยู่บนโฮสต์ระยะไกล; "การตรวจสอบไฟล์บน Mac เครื่องของคุณ" จะไม่สะท้อนสิ่งที่ Gateway ใช้อยู่

---

## ชั้นการคงอยู่สองชั้น

OpenClaw คงอยู่เซสชันในสองชั้น:

1. **ที่เก็บเซสชัน (`sessions.json`)**
   - แมปคีย์/ค่า: `sessionKey -> SessionEntry`
   - เล็ก เปลี่ยนแปลงได้ แก้ไขได้อย่างปลอดภัย (หรือลบรายการได้)
   - ติดตามเมทาดาทาเซสชัน (id เซสชันปัจจุบัน, กิจกรรมล่าสุด, ตัวสลับ, ตัวนับโทเค็น ฯลฯ)

2. **บันทึกบทสนทนา (`<sessionId>.jsonl`)**
   - บันทึกบทสนทนาแบบ append-only พร้อมโครงสร้างต้นไม้ (รายการมี `id` + `parentId`)
   - เก็บบทสนทนาจริง + การเรียกเครื่องมือ + สรุปการ Compaction
   - ใช้สร้างบริบทโมเดลขึ้นใหม่สำหรับเทิร์นในอนาคต
   - เช็กพอยต์ Compaction เป็นเมทาดาทาบนบันทึกบทสนทนาตัวสืบทอดที่ถูกบีบอัดแล้ว
     การ Compaction ใหม่จะไม่เขียนสำเนา `.checkpoint.*.jsonl`
     ชุดที่สอง

ตัวอ่านประวัติ Gateway ควรหลีกเลี่ยงการ materialize บันทึกบทสนทนาทั้งหมด เว้นแต่
พื้นผิวนั้นต้องการการเข้าถึงประวัติแบบกำหนดเองได้จริง ๆ ประวัติหน้าแรก,
ประวัติแชตแบบฝัง, การกู้คืนหลังรีสตาร์ต, และการตรวจสอบโทเค็น/การใช้งาน ใช้การอ่านท้ายไฟล์แบบมีขอบเขต
การสแกนบันทึกบทสนทนาแบบเต็มจะผ่านดัชนีบันทึกบทสนทนาแบบ async ซึ่ง
ถูกแคชตามพาธไฟล์ร่วมกับ `mtimeMs`/`size` และแชร์ระหว่างตัวอ่านพร้อมกัน

---

## ตำแหน่งบนดิสก์

ต่อหนึ่งเอเจนต์ บนโฮสต์ Gateway:

- ที่เก็บ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- บันทึกบทสนทนา: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw แก้ค่าเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษาที่เก็บและการควบคุมดิสก์

การคงอยู่ของเซสชันมีการควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json`, artifact ของบันทึกบทสนทนา, และ sidecar ของ trajectory:

- `mode`: `enforce` (ค่าเริ่มต้น) หรือ `warn`
- `pruneAfter`: เกณฑ์อายุรายการเก่า (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวนรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- การเก็บรักษา probe การรันโมเดลของ Gateway อายุสั้นถูกกำหนดไว้ที่ `24h` แต่มีการควบคุมตามแรงกดดัน: จะลบแถว strict probe ที่เก่าแล้วเฉพาะเมื่อถึงแรงกดดันด้านการบำรุงรักษา/เพดานของรายการเซสชันเท่านั้น สิ่งนี้ใช้เฉพาะกับคีย์ explicit probe แบบ strict ที่ตรงกับ `agent:*:explicit:model-run-<uuid>` และจะรันก่อนการล้าง/จำกัดเพดานรายการเก่าทั่วโลกเมื่อมันรัน
- `resetArchiveRetention`: การเก็บรักษาไฟล์เก็บถาวรบันทึกบทสนทนา `*.reset.<timestamp>` (ค่าเริ่มต้น: เหมือน `pruneAfter`; `false` ปิดการล้าง)
- `maxDiskBytes`: งบประมาณไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังล้าง (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

การเขียน Gateway ปกติไหลผ่านตัวเขียนเซสชันต่อที่เก็บ ซึ่งทำให้การเปลี่ยนแปลงในกระบวนการเป็นลำดับโดยไม่ต้องใช้ runtime file lock ตัวช่วยแพตช์ hot-path ยืมแคช mutable ที่ผ่านการตรวจสอบแล้วในขณะที่ถือช่องตัวเขียนนั้นอยู่ ดังนั้นไฟล์ `sessions.json` ขนาดใหญ่จะไม่ถูกโคลนหรืออ่านซ้ำสำหรับทุกการอัปเดตเมทาดาทา โค้ดรันไทม์ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)`; การบันทึกทั้งที่เก็บโดยตรงเป็นเครื่องมือสำหรับความเข้ากันได้และการบำรุงรักษาออฟไลน์ เมื่อเข้าถึง Gateway ได้ `openclaw sessions cleanup` และ `openclaw agents delete` ที่ไม่ใช่ dry run จะมอบหมายการเปลี่ยนแปลงที่เก็บให้ Gateway เพื่อให้การล้างเข้าคิวตัวเขียนเดียวกัน; `--store <path>` คือพาธซ่อมแซมออฟไลน์ที่ชัดเจนสำหรับการบำรุงรักษาไฟล์โดยตรง การล้าง `maxEntries` ยังคงถูก batch สำหรับเพดานขนาดโปรดักชัน ดังนั้นที่เก็บอาจเกินเพดานที่กำหนดชั่วครู่ก่อนที่การล้าง high-water ครั้งถัดไปจะเขียนกลับลงมา การอ่านที่เก็บเซสชันจะไม่ prune หรือจำกัดเพดานรายการระหว่างการเริ่มต้น Gateway; ใช้การเขียนหรือ `openclaw sessions cleanup --enforce` สำหรับการล้าง `openclaw sessions cleanup --enforce` ยังคงใช้เพดานที่กำหนดทันทีและ prune artifact ของบันทึกบทสนทนา เช็กพอยต์ และ trajectory เก่าที่ไม่มีการอ้างอิง แม้ไม่ได้กำหนดงบประมาณดิสก์ไว้

การบำรุงรักษาจะเก็บตัวชี้บทสนทนาภายนอกที่ทนทาน เช่น เซสชันกลุ่ม
และเซสชันแชตที่จำกัดตามเธรด แต่รายการรันไทม์สังเคราะห์สำหรับ cron, hooks,
Heartbeat, ACP, และ sub-agents ยังสามารถถูกลบได้เมื่อเกิน
อายุ จำนวน หรืองบประมาณดิสก์ที่กำหนดไว้ เซสชัน probe การรันโมเดลของ Gateway ใช้การเก็บรักษา model-run
แยกต่างหาก `24h` เฉพาะเมื่อคีย์ตรงกับ
`agent:*:explicit:model-run-<uuid>` เท่านั้น; เซสชัน explicit อื่นไม่อยู่ใน
การเก็บรักษานั้น การล้าง model-run จะถูกใช้เฉพาะภายใต้แรงกดดันเพดานรายการเซสชัน
การรัน Cron แบบแยกเดี่ยวจะมีการควบคุม `cron.sessionRetention` ของตัวเอง
แยกจากการเก็บรักษา probe การรันโมเดล

OpenClaw ไม่สร้างการสำรองแบบหมุนเวียน `sessions.json.bak.*` อัตโนมัติระหว่างการเขียน Gateway อีกต่อไป คีย์ legacy `session.maintenance.rotateBytes` จะถูกละเว้น และ `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า

การเปลี่ยนแปลงบันทึกบทสนทนาใช้ session write lock บนไฟล์บันทึกบทสนทนา การขอ lock จะรอสูงสุด
`session.writeLock.acquireTimeoutMs` ก่อนแสดงข้อผิดพลาดว่าเซสชันไม่ว่าง; ค่าเริ่มต้นคือ `60000`
ms เพิ่มค่านี้เฉพาะเมื่อมีงานเตรียม ล้าง Compaction หรือ mirror บันทึกบทสนทนาที่ถูกต้องตามจริงชนกัน
นานกว่านี้บนเครื่องที่ช้า `session.writeLock.staleMs` ควบคุมว่า lock ที่มีอยู่จะถูก
ยึดคืนเป็น stale ได้เมื่อใด; ค่าเริ่มต้นคือ `1800000` ms `session.writeLock.maxHoldMs` ควบคุม
เกณฑ์ปล่อย watchdog ในกระบวนการ; ค่าเริ่มต้นคือ `300000` ms env override ฉุกเฉินคือ
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`, และ
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`

ลำดับการบังคับใช้สำหรับการล้างงบประมาณดิสก์ (`mode: "enforce"`):

1. ลบ artifact ที่เก็บถาวรเก่าที่สุด บันทึกบทสนทนาที่ orphan หรือ trajectory ที่ orphan ก่อน
2. หากยังเกินเป้าหมาย ให้ขับรายการเซสชันเก่าที่สุดและไฟล์บันทึกบทสนทนา/trajectory ของรายการนั้นออก
3. ทำต่อจนกว่าการใช้งานจะอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการขับออกที่อาจเกิดขึ้น แต่ไม่เปลี่ยนแปลงที่เก็บ/ไฟล์

รันการบำรุงรักษาตามต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และบันทึกการรัน

การรัน Cron แบบแยกเดี่ยวจะสร้างรายการเซสชัน/บันทึกบทสนทนาด้วย และมีการควบคุมการเก็บรักษาเฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) prune เซสชันการรัน Cron แบบแยกเดี่ยวเก่าออกจากที่เก็บเซสชัน (`false` ปิดใช้งาน)
- `cron.runLog.keepLines` prune แถวประวัติการรัน SQLite ที่เก็บไว้ต่อหนึ่งงาน cron (ค่าเริ่มต้น: `2000`) `cron.runLog.maxBytes` ยังคงยอมรับสำหรับบันทึกการรันแบบ file-backed เก่า

เมื่อ cron บังคับสร้างเซสชันการรันแบบแยกเดี่ยวใหม่ จะ sanitize รายการเซสชัน
`cron:<jobId>` ก่อนหน้าก่อนเขียนแถวใหม่ มันนำค่ากำหนดที่ปลอดภัย
เช่น การตั้งค่า thinking/fast/verbose, ป้ายกำกับ, และการ override โมเดล/auth ที่ผู้ใช้เลือกอย่างชัดเจน
ติดไปด้วย มันตัดบริบทบทสนทนาแวดล้อมออก เช่น
การกำหนดเส้นทาง channel/group, นโยบาย send หรือ queue, elevation, origin, และการผูก ACP
runtime เพื่อให้การรันแบบแยกเดี่ยวใหม่ไม่สามารถสืบทอด delivery หรือ
authority ของ runtime ที่ stale จากการรันเก่า

---

## คีย์เซสชัน (`sessionKey`)

`sessionKey` ระบุว่า _คุณอยู่ใน bucket บทสนทนาใด_ (การกำหนดเส้นทาง + การแยก)

รูปแบบทั่วไป:

- แชตหลัก/โดยตรง (ต่อเอเจนต์): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่ถูก override)

กฎ canonical ถูกบันทึกไว้ที่ [/concepts/session](/th/concepts/session)

---

## id เซสชัน (`sessionId`)

แต่ละ `sessionKey` ชี้ไปยัง `sessionId` ปัจจุบัน (ไฟล์บันทึกบทสนทนาที่ดำเนินบทสนทนาต่อ)

หลักทั่วไป:

- **Reset** (`/new`, `/reset`) สร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **การรีเซ็ตรายวัน** (ค่าเริ่มต้น 4:00 AM ตามเวลาท้องถิ่นบนโฮสต์ gateway) สร้าง `sessionId` ใหม่ในข้อความถัดไปหลังขอบเขตการรีเซ็ต
- **การหมดอายุเมื่อไม่ได้ใช้งาน** (`session.reset.idleMinutes` หรือ legacy `session.idleMinutes`) สร้าง `sessionId` ใหม่เมื่อมีข้อความมาถึงหลังหน้าต่าง idle เมื่อกำหนดทั้งรายวัน + idle ไว้ ตัวที่หมดอายุก่อนจะชนะ
- **การ resume เมื่อ Control UI เชื่อมต่อใหม่** สามารถคงเซสชันที่มองเห็นอยู่ปัจจุบันไว้สำหรับการส่งหลังเชื่อมต่อใหม่หนึ่งครั้ง เมื่อ Gateway ได้รับ `sessionId` ที่ตรงกันจากไคลเอนต์ UI ของผู้ปฏิบัติงาน การส่ง stale แบบปกติยังคงสร้าง `sessionId` ใหม่
- **เหตุการณ์ระบบ** (Heartbeat, การปลุก cron, การแจ้งเตือน exec, งาน bookkeeping ของ gateway) อาจเปลี่ยนแปลงแถวเซสชันแต่ไม่ขยายความสดของการรีเซ็ตรายวัน/idle การ rollover ของการรีเซ็ตจะทิ้ง notice เหตุการณ์ระบบที่เข้าคิวไว้สำหรับเซสชันก่อนหน้า ก่อนสร้าง prompt ใหม่
- **นโยบาย parent fork** ใช้ active branch ของ OpenClaw เมื่อสร้างเธรดหรือ fork ของ subagent หาก branch นั้นใหญ่เกินไป OpenClaw จะเริ่ม child ด้วยบริบทแบบแยกแทนการล้มเหลวหรือสืบทอดประวัติที่ใช้ไม่ได้ นโยบายการกำหนดขนาดเป็นแบบอัตโนมัติ; คอนฟิก legacy `session.parentForkMaxTokens` ถูกลบโดย `openclaw doctor --fix`

รายละเอียดการใช้งาน: การตัดสินใจเกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## สคีมาที่เก็บเซสชัน (`sessions.json`)

ชนิดค่าของที่เก็บคือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: id บันทึกบทสนทนาปัจจุบัน (ชื่อไฟล์ถูก derive จากค่านี้ เว้นแต่ตั้งค่า `sessionFile`)
- `sessionStartedAt`: timestamp เริ่มต้นสำหรับ `sessionId` ปัจจุบัน; ความสดของการรีเซ็ตรายวัน
  ใช้ค่านี้ แถว legacy อาจ derive จาก header เซสชัน JSONL
- `lastInteractionAt`: timestamp การโต้ตอบจริงล่าสุดของผู้ใช้/channel; ความสดของการรีเซ็ตเมื่อ idle
  ใช้ค่านี้เพื่อให้ Heartbeat, cron, และ exec events ไม่ทำให้เซสชัน
  ยังมีชีวิตอยู่ แถว legacy ที่ไม่มีฟิลด์นี้จะ fallback ไปยังเวลาเริ่มเซสชันที่กู้คืน
  สำหรับความสดของ idle
- `updatedAt`: timestamp การเปลี่ยนแปลงแถวที่เก็บล่าสุด ใช้สำหรับการแสดงรายการ การ pruning และ
  bookkeeping ค่านี้ไม่ใช่ authority สำหรับความสดของการรีเซ็ตรายวัน/idle
- `sessionFile`: override พาธบันทึกบทสนทนาแบบชัดเจนที่เป็นตัวเลือก
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายการส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: เมทาดาทาสำหรับการตั้งป้ายกำกับ group/channel
- ตัวสลับ:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (best-effort / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: จำนวนครั้งที่ auto-compaction เสร็จสิ้นสำหรับคีย์เซสชันนี้
- `memoryFlushAt`: timestamp สำหรับการ flush หน่วยความจำก่อน Compaction ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction เมื่อตอนที่ flush ล่าสุดรัน

ที่เก็บสามารถแก้ไขได้อย่างปลอดภัย แต่ Gateway คือ authority: มันอาจเขียนใหม่หรือ rehydrate รายการเมื่อเซสชันรัน

---

## โครงสร้างบันทึกบทสนทนา (`*.jsonl`)

บันทึกบทสนทนาถูกจัดการโดย `SessionManager` ของ `openclaw/plugin-sdk/agent-sessions`

ไฟล์เป็น JSONL:

- บรรทัดแรก: header เซสชัน (`type: "session"`, มี `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- จากนั้น: รายการเซสชันที่มี `id` + `parentId` (ต้นไม้)

ชนิดรายการที่น่าสนใจ:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ส่วนขยายแทรกเข้ามาซึ่ง _เข้าสู่_ บริบทของโมเดล (สามารถซ่อนจาก UI ได้)
- `custom`: สถานะของส่วนขยายที่ _ไม่_ เข้าสู่บริบทของโมเดล
- `compaction`: สรุป Compaction ที่คงอยู่ พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่คงอยู่เมื่อนำทางไปยังสาขาของต้นไม้

OpenClaw ตั้งใจ **ไม่** "แก้แต่ง" ทรานสคริปต์; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียนทรานสคริปต์เหล่านั้น

---

## หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม

มีสองแนวคิดที่สำคัญต่างกัน:

1. **หน้าต่างบริบทของโมเดล**: ขีดจำกัดตายตัวต่อโมเดล (โทเค็นที่โมเดลมองเห็น)
2. **ตัวนับของที่เก็บเซสชัน**: สถิติแบบต่อเนื่องที่เขียนลงใน `sessions.json` (ใช้สำหรับ /status และแดชบอร์ด)

หากคุณกำลังปรับแต่งขีดจำกัด:

- หน้าต่างบริบทมาจากแคตตาล็อกโมเดล (และสามารถเขียนทับผ่าน config ได้)
- `contextTokens` ในที่เก็บเป็นค่าประมาณ/ค่ารายงานขณะรันไทม์; อย่าถือว่าเป็นการรับประกันที่เข้มงวด

ดูเพิ่มเติมที่ [/token-use](/th/reference/token-use)

---

## Compaction: คืออะไร

Compaction สรุปบทสนทนาเก่าลงในรายการ `compaction` ที่คงอยู่ในทรานสคริปต์ และเก็บข้อความล่าสุดไว้ตามเดิม

หลังจาก Compaction เทิร์นในอนาคตจะเห็น:

- สรุป Compaction
- ข้อความหลัง `firstKeptEntryId`

การฉีดส่วน AGENTS.md กลับเข้าไปหลัง Compaction เป็นแบบเลือกเปิดผ่าน
`agents.defaults.compaction.postCompactionSections`; เมื่อไม่ได้ตั้งค่าหรือเป็น `[]`
OpenClaw จะไม่ผนวกข้อความตัดตอนจาก AGENTS.md ทับบนสรุป Compaction

Compaction เป็นแบบ **คงอยู่** (ต่างจากการตัดแต่งเซสชัน) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขตชังก์ของ Compaction และการจับคู่เครื่องมือ

เมื่อ OpenClaw แบ่งทรานสคริปต์ยาวออกเป็นชังก์ Compaction จะคงการจับคู่
การเรียกใช้เครื่องมือของ assistant กับรายการ `toolResult` ที่ตรงกันไว้

- หากการแบ่งตามสัดส่วนโทเค็นตกอยู่ระหว่างการเรียกใช้เครื่องมือกับผลลัพธ์ OpenClaw
  จะเลื่อนขอบเขตไปที่ข้อความเรียกใช้เครื่องมือของ assistant แทนที่จะแยก
  คู่นั้นออกจากกัน
- หากบล็อกผลลัพธ์เครื่องมือท้ายสุดจะทำให้ชังก์เกินเป้าหมาย OpenClaw
  จะรักษาบล็อกเครื่องมือที่รออยู่นั้นไว้ และคงส่วนท้ายที่ยังไม่ได้สรุปไว้
  ตามเดิม
- บล็อกการเรียกใช้เครื่องมือที่ถูกยกเลิก/เกิดข้อผิดพลาดจะไม่เปิดการแบ่งที่รออยู่ค้างไว้

---

## เมื่อใดที่ auto-compaction เกิดขึ้น (รันไทม์ OpenClaw)

ในเอเจนต์ OpenClaw แบบฝัง auto-compaction จะทริกเกอร์ในสองกรณี:

1. **การกู้คืนเมื่อเกินขีดจำกัด**: โมเดลส่งคืนข้อผิดพลาดบริบทล้น
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และรูปแบบอื่นที่คล้ายกันตามผู้ให้บริการ) → compact → ลองใหม่
   เมื่อผู้ให้บริการรายงานจำนวนโทเค็นที่พยายามใช้ OpenClaw จะส่งต่อ
   จำนวนที่สังเกตได้นั้นเข้าสู่ Compaction เพื่อกู้คืนจากการล้น หากผู้ให้บริการยืนยัน
   การล้นแต่ไม่เปิดเผยจำนวนที่แยกวิเคราะห์ได้ OpenClaw จะส่งจำนวนสังเคราะห์
   ที่เกินงบประมาณขั้นต่ำไปยังเอนจิน Compaction และ diagnostics
   หากการกู้คืนเมื่อเกินขีดจำกัดยังล้มเหลว OpenClaw จะแสดงคำแนะนำที่ชัดเจนแก่
   ผู้ใช้ และรักษาการแมปเซสชันปัจจุบันไว้ แทนที่จะหมุนคีย์เซสชันไปยัง id เซสชันใหม่
   อย่างเงียบ ๆ ขั้นตอนถัดไปอยู่ภายใต้การควบคุมของผู้ปฏิบัติงาน:
   ลองส่งข้อความอีกครั้ง, รัน `/compact`, หรือรัน `/new` เมื่อต้องการเซสชันใหม่
2. **การบำรุงรักษาตามเกณฑ์**: หลังเทิร์นสำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือหน้าต่างบริบทของโมเดล
- `reserveTokens` คือพื้นที่เผื่อที่สำรองไว้สำหรับพรอมป์ + เอาต์พุตโมเดลถัดไป

สิ่งเหล่านี้คือซีแมนติกของรันไทม์ OpenClaw

OpenClaw ยังสามารถทริกเกอร์ Compaction แบบ local ก่อนเปิดการรันถัดไป
ได้เมื่อมีการตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` และไฟล์
ทรานสคริปต์ที่ใช้งานอยู่มีขนาดถึงค่านั้น นี่เป็นตัวป้องกันตามขนาดไฟล์สำหรับต้นทุน
การเปิดซ้ำแบบ local ไม่ใช่การเก็บถาวรแบบดิบ: OpenClaw ยังคงรัน Compaction
เชิงความหมายตามปกติ และต้องใช้ `truncateAfterCompaction` เพื่อให้สรุปที่ถูก compact
กลายเป็นทรานสคริปต์ตัวสืบทอดใหม่ได้

สำหรับการรัน OpenClaw แบบฝัง `agents.defaults.compaction.midTurnPrecheck.enabled: true`
จะเพิ่มตัวป้องกันลูปเครื่องมือแบบเลือกเปิด หลังจากผนวกผลลัพธ์เครื่องมือและก่อนการเรียก
โมเดลถัดไป OpenClaw จะประมาณแรงกดดันของพรอมป์โดยใช้ตรรกะงบประมาณ preflight
เดียวกับที่ใช้ตอนเริ่มเทิร์น หากบริบทไม่พอดีอีกต่อไป ตัวป้องกันจะไม่ compact ภายใน hook
`transformContext` ของรันไทม์ OpenClaw แต่จะส่งสัญญาณ precheck กลางเทิร์นแบบมีโครงสร้าง
หยุดการส่งพรอมป์ปัจจุบัน และให้ลูปการรันด้านนอกใช้เส้นทางกู้คืนที่มีอยู่: ตัดผลลัพธ์เครื่องมือ
ที่ใหญ่เกินไปเมื่อเพียงพอ หรือทริกเกอร์โหมด Compaction ที่กำหนดค่าไว้แล้วลองใหม่ ตัวเลือกนี้
ปิดไว้ตามค่าเริ่มต้น และทำงานได้กับโหมด Compaction ทั้ง `default` และ `safeguard`
รวมถึง safeguard Compaction ที่มีผู้ให้บริการหนุนหลัง
สิ่งนี้เป็นอิสระจาก `maxActiveTranscriptBytes`: ตัวป้องกันตามขนาดไบต์จะรัน
ก่อนเปิดเทิร์น ขณะที่ precheck กลางเทิร์นจะรันภายหลังในลูปเครื่องมือ OpenClaw แบบฝัง
หลังจากผนวกผลลัพธ์เครื่องมือใหม่แล้ว

---

## การตั้งค่า Compaction (`reserveTokens`, `keepRecentTokens`)

การตั้งค่า Compaction ของรันไทม์ OpenClaw อยู่ในการตั้งค่าเอเจนต์:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw ยังบังคับใช้ค่าขั้นต่ำเพื่อความปลอดภัยสำหรับการรันแบบฝัง:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะเพิ่มค่านั้น
- ค่าขั้นต่ำเริ่มต้นคือ `20000` โทเค็น
- ตั้งค่า `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิดใช้ค่าขั้นต่ำ
- หากค่านั้นสูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม
- `/compact` แบบ manual จะเคารพ `agents.defaults.compaction.keepRecentTokens`
  ที่ระบุชัดเจน และคงจุดตัดส่วนท้ายล่าสุดของรันไทม์ OpenClaw ไว้ หากไม่มีงบประมาณ keep
  ที่ระบุชัดเจน manual Compaction จะยังคงเป็นเช็คพอยต์แบบแข็ง และบริบทที่สร้างใหม่จะเริ่มจาก
  สรุปใหม่
- ตั้งค่า `agents.defaults.compaction.midTurnPrecheck.enabled: true` เพื่อรัน
  precheck ลูปเครื่องมือแบบไม่บังคับหลังผลลัพธ์เครื่องมือใหม่และก่อนการเรียกโมเดล
  ถัดไป สิ่งนี้เป็นเพียงทริกเกอร์; การสร้างสรุปยังคงใช้เส้นทาง Compaction
  ที่กำหนดค่าไว้ สิ่งนี้เป็นอิสระจาก `maxActiveTranscriptBytes` ซึ่งเป็น
  ตัวป้องกันขนาดไบต์ของทรานสคริปต์ที่ใช้งานอยู่ตอนเริ่มเทิร์น
- ตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` เป็นค่าไบต์หรือ
  สตริง เช่น `"20mb"` เพื่อรัน Compaction แบบ local ก่อนเริ่มเทิร์นเมื่อทรานสคริปต์
  ที่ใช้งานอยู่มีขนาดใหญ่ ตัวป้องกันนี้ทำงานเฉพาะเมื่อเปิดใช้
  `truncateAfterCompaction` ด้วยเท่านั้น ปล่อยว่างไว้หรือตั้งค่า `0` เพื่อ
  ปิดใช้
- เมื่อเปิดใช้ `agents.defaults.compaction.truncateAfterCompaction`
  OpenClaw จะหมุนทรานสคริปต์ที่ใช้งานอยู่ไปเป็น JSONL ตัวสืบทอดที่ถูก compact หลัง
  Compaction การดำเนินการเช็คพอยต์ branch/restore จะใช้ตัวสืบทอดที่ถูก compact นั้น;
  ไฟล์เช็คพอยต์ pre-compaction แบบ legacy ยังคงอ่านได้ขณะยังถูกอ้างอิง

เหตุผล: เหลือพื้นที่เผื่อให้เพียงพอสำหรับ "งานดูแลระบบ" หลายเทิร์น (เช่น การเขียน memory) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

การใช้งาน: `applyAgentCompactionSettingsFromConfig()` ใน `src/agents/agent-settings.ts`
(ถูกเรียกจากเส้นทางเทิร์นของ embedded-runner และการตั้งค่า Compaction)

---

## ผู้ให้บริการ Compaction แบบเสียบได้

Plugins สามารถลงทะเบียนผู้ให้บริการ Compaction ผ่าน `registerCompactionProvider()` บน API ของ plugin ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งค่าเป็น id ของผู้ให้บริการที่ลงทะเบียน ส่วนขยาย safeguard จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline `summarizeInStages` ในตัว

- `provider`: id ของ plugin ผู้ให้บริการ Compaction ที่ลงทะเบียน ปล่อยว่างไว้เพื่อใช้การสรุป LLM เริ่มต้น
- การตั้งค่า `provider` จะบังคับ `mode: "safeguard"`
- ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการรักษาตัวระบุเหมือนกับเส้นทางในตัว
- safeguard ยังคงรักษาบริบท suffix ของเทิร์นล่าสุดและเทิร์นที่ถูกแบ่งหลังเอาต์พุตของผู้ให้บริการ
- การสรุป safeguard ในตัวจะกลั่นสรุปก่อนหน้าซ้ำด้วยข้อความใหม่
  แทนที่จะรักษาสรุปก่อนหน้าเต็มรูปแบบไว้ตามตัวอักษร
- โหมด safeguard เปิดใช้การตรวจสอบคุณภาพสรุปตามค่าเริ่มต้น; ตั้งค่า
  `qualityGuard.enabled: false` เพื่อข้ามพฤติกรรม retry-on-malformed-output
- หากผู้ให้บริการล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะ fallback ไปใช้การสรุป LLM ในตัวโดยอัตโนมัติ
- สัญญาณ abort/timeout จะถูกโยนซ้ำ (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกของผู้เรียก

แหล่งที่มา: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็น

คุณสามารถสังเกต Compaction และสถานะเซสชันได้ผ่าน:

- `/status` (ในเซสชันแชตใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- บันทึก Gateway (`pnpm gateway:watch` หรือ `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- โหมด verbose: `🧹 Auto-compaction complete` + จำนวน Compaction

---

## งานดูแลระบบแบบเงียบ (`NO_REPLY`)

OpenClaw รองรับเทิร์นแบบ "เงียบ" สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ข้อตกลง:

- assistant เริ่มเอาต์พุตด้วยโทเค็นเงียบที่ตรงกันทุกตัวอักษร `NO_REPLY` /
  `no_reply` เพื่อระบุว่า "อย่าส่งคำตอบให้ผู้ใช้"
- OpenClaw จะลบ/ระงับสิ่งนี้ในเลเยอร์การส่ง
- การระงับโทเค็นเงียบแบบตรงกันทุกตัวอักษรไม่สนใจตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` นับทั้งคู่เมื่อ payload ทั้งหมดเป็นเพียงโทเค็นเงียบ
- สิ่งนี้มีไว้สำหรับเทิร์นเบื้องหลัง/ไม่ส่งมอบจริงเท่านั้น; ไม่ใช่ทางลัดสำหรับ
  คำขอผู้ใช้ที่ต้องดำเนินการตามปกติ

ตั้งแต่ `2026.1.10` OpenClaw ยังระงับ **การสตรีม draft/typing** เมื่อ
ชังก์บางส่วนเริ่มด้วย `NO_REPLY` เพื่อไม่ให้การทำงานแบบเงียบรั่วเอาต์พุตบางส่วน
ระหว่างเทิร์น

---

## "memory flush" ก่อน Compaction (ใช้งานแล้ว)

เป้าหมาย: ก่อนเกิด auto-compaction ให้รันเทิร์น agentic แบบเงียบที่เขียนสถานะถาวร
ลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ในพื้นที่ทำงานของเอเจนต์) เพื่อไม่ให้ Compaction
ลบบริบทสำคัญ

OpenClaw ใช้แนวทาง **pre-threshold flush**:

1. ตรวจสอบการใช้บริบทของเซสชัน
2. เมื่อข้าม "soft threshold" (ต่ำกว่าเกณฑ์ Compaction ของรันไทม์ OpenClaw) ให้รัน directive แบบเงียบ
   "write memory now" ไปยังเอเจนต์
3. ใช้โทเค็นเงียบที่ตรงกันทุกตัวอักษร `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้ไม่เห็น
   อะไรเลย

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `model` (การเขียนทับ provider/model ที่ตรงกันทุกตัวอักษรแบบไม่บังคับสำหรับเทิร์น flush เช่น `ollama/qwen3:8b`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับเทิร์น flush)
- `systemPrompt` (พรอมป์ระบบเพิ่มเติมที่ผนวกสำหรับเทิร์น flush)

หมายเหตุ:

- พรอมป์/พรอมป์ระบบเริ่มต้นมีคำใบ้ `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- เมื่อมีการตั้งค่า `model` เทิร์น flush จะใช้โมเดลนั้นโดยไม่สืบทอด
  fallback chain ของเซสชันที่ใช้งานอยู่ ดังนั้นงานดูแลระบบแบบ local-only จะไม่
  fallback ไปยังโมเดลสนทนาแบบเสียเงินอย่างเงียบ ๆ
- flush จะรันหนึ่งครั้งต่อรอบ Compaction (ติดตามใน `sessions.json`)
- flush จะรันเฉพาะสำหรับเซสชัน OpenClaw แบบฝังเท่านั้น (แบ็กเอนด์ CLI จะข้าม)
- flush จะถูกข้ามเมื่อพื้นที่ทำงานของเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [Memory](/th/concepts/memory) สำหรับเลย์เอาต์ไฟล์พื้นที่ทำงานและรูปแบบการเขียน

OpenClaw ยังเปิดเผย hook `session_before_compact` ใน API ของส่วนขยายด้วย แต่ตรรกะ
flush ของ OpenClaw อยู่ฝั่ง Gateway ในปัจจุบัน

---

## เช็กลิสต์การแก้ปัญหา

- คีย์เซสชันผิดหรือไม่ เริ่มจาก [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- ที่เก็บกับทรานสคริปต์ไม่ตรงกันหรือไม่ ยืนยันโฮสต์ Gateway และเส้นทางที่เก็บจาก `openclaw status`
- Compaction เกิดถี่เกินไปหรือไม่ ตรวจสอบ:
  - หน้าต่างบริบทของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` สูงเกินไปสำหรับหน้าต่างโมเดลอาจทำให้ Compaction เกิดเร็วขึ้น)
  - ผลลัพธ์เครื่องมือบวม: เปิดใช้/ปรับแต่งการตัดแต่งเซสชัน
- เทิร์นเงียบรั่วหรือไม่ ยืนยันว่าคำตอบเริ่มด้วย `NO_REPLY` (โทเค็นตรงกันทุกตัวอักษรแบบไม่สนใจตัวพิมพ์เล็กใหญ่) และคุณอยู่บนบิลด์ที่มีการแก้ไขการระงับสตรีมมิง

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [เอนจินบริบท](/th/concepts/context-engine)
