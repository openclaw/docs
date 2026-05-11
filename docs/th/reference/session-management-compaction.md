---
read_when:
    - คุณต้องแก้ไขข้อบกพร่องเกี่ยวกับ ID เซสชัน, JSONL ของบันทึกบทสนทนา หรือฟิลด์ของ sessions.json
    - คุณกำลังเปลี่ยนพฤติกรรมการทำ Compaction อัตโนมัติหรือเพิ่มงานดูแลจัดการ "ก่อน Compaction"
    - คุณต้องการนำการล้างหน่วยความจำหรือรอบของระบบแบบเงียบไปใช้
summary: 'เจาะลึก: ที่เก็บเซสชัน + ทรานสคริปต์ วงจรชีวิต และกลไกภายในของ Compaction อัตโนมัติ'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-05-11T20:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw จัดการเซสชันตั้งแต่ต้นจนจบในพื้นที่เหล่านี้:

- **การกำหนดเส้นทางเซสชัน** (วิธีที่ข้อความขาเข้าถูกแมปไปยัง `sessionKey`)
- **ที่เก็บเซสชัน** (`sessions.json`) และสิ่งที่ติดตาม
- **การคงอยู่ของทรานสคริปต์** (`*.jsonl`) และโครงสร้างของมัน
- **สุขอนามัยของทรานสคริปต์** (การปรับแก้เฉพาะผู้ให้บริการก่อนการรัน)
- **ขีดจำกัดบริบท** (หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม)
- **Compaction** (การ Compaction แบบแมนนวลและอัตโนมัติ) และตำแหน่งที่จะ hook งานก่อน Compaction
- **การดูแลระบบแบบเงียบ** (การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

หากคุณต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

- [การจัดการเซสชัน](/th/concepts/session)
- [Compaction](/th/concepts/compaction)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [สุขอนามัยของทรานสคริปต์](/th/reference/transcript-hygiene)

---

## แหล่งข้อมูลจริง: Gateway

OpenClaw ออกแบบโดยมี **กระบวนการ Gateway** เดียวที่เป็นเจ้าของสถานะเซสชัน

- ส่วนติดต่อผู้ใช้ (แอป macOS, UI ควบคุมบนเว็บ, TUI) ควรสอบถาม Gateway เพื่อรับรายการเซสชันและจำนวนโทเค็น
- ในโหมดรีโมต ไฟล์เซสชันอยู่บนโฮสต์รีโมต; “การตรวจสอบไฟล์ใน Mac เครื่องคุณ” จะไม่สะท้อนสิ่งที่ Gateway ใช้งานอยู่

---

## ชั้นการคงอยู่สองชั้น

OpenClaw คงอยู่เซสชันในสองชั้น:

1. **ที่เก็บเซสชัน (`sessions.json`)**
   - แผนที่คีย์/ค่า: `sessionKey -> SessionEntry`
   - ขนาดเล็ก เปลี่ยนแปลงได้ แก้ไขได้อย่างปลอดภัย (หรือลบรายการได้)
   - ติดตามเมทาดาทาของเซสชัน (รหัสเซสชันปัจจุบัน กิจกรรมล่าสุด toggle ตัวนับโทเค็น ฯลฯ)

2. **ทรานสคริปต์ (`<sessionId>.jsonl`)**
   - ทรานสคริปต์แบบ append-only พร้อมโครงสร้างต้นไม้ (รายการมี `id` + `parentId`)
   - เก็บบทสนทนาจริง + การเรียกเครื่องมือ + สรุป Compaction
   - ใช้สร้างบริบทโมเดลใหม่สำหรับเทิร์นในอนาคต
   - checkpoint ดีบักขนาดใหญ่ก่อน Compaction จะถูกข้ามเมื่อทรานสคริปต์ที่ active
     เกินเพดานขนาด checkpoint เพื่อหลีกเลี่ยงสำเนา `.checkpoint.*.jsonl`
     ขนาดยักษ์ชุดที่สอง

ตัวอ่านประวัติของ Gateway ควรหลีกเลี่ยงการ materialize ทรานสคริปต์ทั้งหมด เว้นแต่
พื้นผิวจะต้องการการเข้าถึงประวัติแบบกำหนดเองจริง ๆ ประวัติหน้าแรก
ประวัติแชตแบบฝัง การกู้คืนหลังรีสตาร์ต และการตรวจสอบโทเค็น/การใช้งาน ใช้การอ่าน tail
แบบมีขอบเขต การสแกนทรานสคริปต์เต็มรูปแบบจะผ่านดัชนีทรานสคริปต์แบบ async ซึ่ง
แคชตาม path ไฟล์บวก `mtimeMs`/`size` และแชร์ระหว่างตัวอ่านพร้อมกัน

---

## ตำแหน่งบนดิสก์

ต่อ agent บนโฮสต์ Gateway:

- ที่เก็บ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- ทรานสคริปต์: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve สิ่งเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษาที่เก็บและการควบคุมดิสก์

การคงอยู่ของเซสชันมีการควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json`, artifact ของทรานสคริปต์ และ sidecar ของ trajectory:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: cutoff อายุของรายการที่ค้างเก่า (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวนรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- `resetArchiveRetention`: ระยะเวลาเก็บรักษา archive ทรานสคริปต์ `*.reset.<timestamp>` (ค่าเริ่มต้น: เหมือน `pruneAfter`; `false` ปิดการ cleanup)
- `maxDiskBytes`: งบประมาณไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายแบบไม่บังคับหลัง cleanup (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

การเขียนปกติของ Gateway ไหลผ่าน writer เซสชันต่อที่เก็บ ซึ่งทำให้ mutation ในกระบวนการเป็นลำดับโดยไม่ต้องใช้ runtime file lock helper สำหรับ patch บน hot path จะยืม mutable cache ที่ตรวจสอบแล้วขณะถือ slot ของ writer นั้น ดังนั้นไฟล์ `sessions.json` ขนาดใหญ่จะไม่ถูก clone หรือ reread สำหรับทุกการอัปเดตเมทาดาทา โค้ด runtime ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)`; การบันทึกทั้งที่เก็บโดยตรงเป็นเครื่องมือสำหรับความเข้ากันได้และการบำรุงรักษาแบบ offline เมื่อเข้าถึง Gateway ได้ `openclaw sessions cleanup` แบบไม่ใช่ dry-run และ `openclaw agents delete` จะมอบหมาย mutation ของที่เก็บให้ Gateway เพื่อให้ cleanup เข้าคิว writer เดียวกัน; `--store <path>` คือเส้นทางซ่อมแซม offline แบบชัดเจนสำหรับการบำรุงรักษาไฟล์โดยตรง cleanup ของ `maxEntries` ยังคง batched สำหรับ cap ขนาด production ดังนั้นที่เก็บอาจเกิน cap ที่ตั้งค่าไว้ชั่วครู่ก่อนที่ cleanup high-water ครั้งถัดไปจะเขียนลดกลับลงมา การอ่านที่เก็บเซสชันจะไม่ prune หรือ cap รายการระหว่างการเริ่มต้น Gateway; ใช้การเขียนหรือ `openclaw sessions cleanup --enforce` สำหรับ cleanup `openclaw sessions cleanup --enforce` ยังคงใช้ cap ที่ตั้งค่าไว้ทันที และ prune artifact ของทรานสคริปต์ checkpoint และ trajectory เก่าที่ไม่มีการอ้างอิง แม้ไม่ได้กำหนดงบประมาณดิสก์

การบำรุงรักษาจะเก็บ pointer การสนทนาภายนอกที่คงทน เช่น เซสชันกลุ่ม
และเซสชันแชตแบบจำกัดขอบเขตตามเธรด แต่รายการ runtime สังเคราะห์สำหรับ cron, hook,
Heartbeat, ACP และ sub-agent ยังอาจถูกลบได้เมื่อเกินอายุ จำนวน หรืองบประมาณดิสก์
ที่ตั้งค่าไว้

OpenClaw ไม่สร้าง backup หมุนเวียนอัตโนมัติ `sessions.json.bak.*` ระหว่างการเขียนของ Gateway อีกต่อไป คีย์เดิม `session.maintenance.rotateBytes` จะถูกเพิกเฉย และ `openclaw doctor --fix` จะลบออกจาก config เก่า

mutation ของทรานสคริปต์ใช้ session write lock บนไฟล์ทรานสคริปต์ การได้ lock จะรอได้สูงสุด
`session.writeLock.acquireTimeoutMs` ก่อนแสดงข้อผิดพลาด busy-session; ค่าเริ่มต้นคือ `60000`
มิลลิวินาที เพิ่มค่านี้เฉพาะเมื่อการเตรียม การ cleanup การ Compaction หรืองาน mirror ทรานสคริปต์ที่ถูกต้องตามปกติชนกัน
นานกว่าบนเครื่องที่ช้า การตรวจจับ stale-lock และคำเตือน hold สูงสุดยังคงเป็นนโยบายแยกกัน

ลำดับการบังคับใช้สำหรับ cleanup งบประมาณดิสก์ (`mode: "enforce"`):

1. ลบ artifact ที่ archive ไว้เก่าสุด ทรานสคริปต์กำพร้า หรือ trajectory กำพร้าก่อน
2. หากยังเกินเป้าหมาย ให้ขับรายการเซสชันเก่าสุดและไฟล์ทรานสคริปต์/trajectory ของรายการเหล่านั้นออก
3. ทำต่อไปจนกว่าการใช้งานจะอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการขับออกที่อาจเกิดขึ้น แต่จะไม่ mutate ที่เก็บ/ไฟล์

รันการบำรุงรักษาตามต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และ run log

การรัน cron แบบแยกส่วนยังสร้างรายการเซสชัน/ทรานสคริปต์ด้วย และมีการควบคุมการเก็บรักษาเฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) prune เซสชันการรัน cron แบบแยกส่วนเก่าจากที่เก็บเซสชัน (`false` ปิดใช้งาน)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` prune ไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` ไบต์ และ `2000` บรรทัด)

เมื่อ cron บังคับสร้างเซสชันการรันแบบแยกส่วนใหม่ มันจะ sanitize รายการเซสชัน
`cron:<jobId>` ก่อนหน้าก่อนเขียนแถวใหม่ มันนำ preference ที่ปลอดภัย
เช่นการตั้งค่า thinking/fast/verbose, label และการ override โมเดล/auth ที่ผู้ใช้เลือกไว้ชัดเจน
ติดไปด้วย มันทิ้งบริบทการสนทนาแวดล้อม เช่น การกำหนดเส้นทาง channel/group,
นโยบายส่งหรือคิว, elevation, origin และการผูก runtime ของ ACP เพื่อไม่ให้การรันแบบแยกส่วนใหม่
สืบทอดการส่งมอบหรือสิทธิ์ runtime ที่ค้างเก่าจากการรันก่อนหน้า

---

## คีย์เซสชัน (`sessionKey`)

`sessionKey` ระบุว่า _คุณอยู่ใน bucket การสนทนาใด_ (การกำหนดเส้นทาง + การแยกส่วน)

รูปแบบทั่วไป:

- แชตหลัก/โดยตรง (ต่อ agent): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่ถูก override)

กฎ canonical มีเอกสารที่ [/concepts/session](/th/concepts/session)

---

## รหัสเซสชัน (`sessionId`)

แต่ละ `sessionKey` ชี้ไปยัง `sessionId` ปัจจุบัน (ไฟล์ทรานสคริปต์ที่ดำเนินบทสนทนาต่อ)

หลักทั่วไป:

- **Reset** (`/new`, `/reset`) สร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **Daily reset** (ค่าเริ่มต้น 4:00 AM ตามเวลาท้องถิ่นบนโฮสต์ Gateway) สร้าง `sessionId` ใหม่เมื่อมีข้อความถัดไปหลังขอบเขต reset
- **Idle expiry** (`session.reset.idleMinutes` หรือ legacy `session.idleMinutes`) สร้าง `sessionId` ใหม่เมื่อมีข้อความมาถึงหลังช่วง idle เมื่อกำหนดทั้ง daily + idle ไว้ ตัวที่หมดอายุก่อนจะชนะ
- **System events** (Heartbeat, การปลุก cron, การแจ้งเตือน exec, งานบัญชีของ gateway) อาจ mutate แถวเซสชัน แต่ไม่ขยายความสดใหม่ของ daily/idle reset การ rollover ของ reset จะทิ้งประกาศ system-event ที่เข้าคิวไว้สำหรับเซสชันก่อนหน้า ก่อนสร้าง prompt ใหม่
- **Parent fork policy** ใช้ branch ที่ active ของ PI เมื่อสร้างเธรดหรือ fork subagent หาก branch นั้นใหญ่เกินไป OpenClaw จะเริ่ม child ด้วยบริบทแบบแยกส่วนแทนการล้มเหลวหรือสืบทอดประวัติที่ใช้งานไม่ได้ นโยบาย sizing เป็นอัตโนมัติ; config เดิม `session.parentForkMaxTokens` จะถูกลบโดย `openclaw doctor --fix`

รายละเอียดการใช้งาน: การตัดสินใจเกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## สคีมาที่เก็บเซสชัน (`sessions.json`)

ประเภทค่าของที่เก็บคือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: รหัสทรานสคริปต์ปัจจุบัน (filename derive จากค่านี้ เว้นแต่ตั้ง `sessionFile`)
- `sessionStartedAt`: timestamp เริ่มต้นสำหรับ `sessionId` ปัจจุบัน; ความสดใหม่ของ daily reset
  ใช้ค่านี้ แถว legacy อาจ derive จาก session header ของ JSONL
- `lastInteractionAt`: timestamp ของ interaction จริงล่าสุดจากผู้ใช้/channel; ความสดใหม่ของ idle reset
  ใช้ค่านี้เพื่อให้ Heartbeat, cron และ exec events ไม่ทำให้เซสชัน
  มีชีวิตต่อ แถว legacy ที่ไม่มีฟิลด์นี้ fallback ไปยังเวลาเริ่มต้นเซสชันที่กู้คืนมา
  สำหรับความสดใหม่ของ idle
- `updatedAt`: timestamp ของ mutation แถวที่เก็บล่าสุด ใช้สำหรับการแสดงรายการ การ prune และ
  งานบัญชี ไม่ใช่ authority สำหรับความสดใหม่ของ daily/idle reset
- `sessionFile`: override path ทรานสคริปต์แบบชัดเจนที่ไม่บังคับ
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: เมทาดาทาสำหรับการตั้ง label ของกลุ่ม/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (best-effort / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ความถี่ที่ auto-compaction เสร็จสมบูรณ์สำหรับคีย์เซสชันนี้
- `memoryFlushAt`: timestamp สำหรับการ flush หน่วยความจำก่อน Compaction ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction เมื่อ flush ล่าสุดรัน

ที่เก็บแก้ไขได้อย่างปลอดภัย แต่ Gateway คือ authority: มันอาจเขียนใหม่หรือ rehydrate รายการขณะเซสชันรัน

---

## โครงสร้างทรานสคริปต์ (`*.jsonl`)

ทรานสคริปต์จัดการโดย `SessionManager` ของ `@earendil-works/pi-coding-agent`

ไฟล์เป็น JSONL:

- บรรทัดแรก: session header (`type: "session"`, รวม `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- จากนั้น: รายการเซสชันที่มี `id` + `parentId` (ต้นไม้)

ประเภท entry ที่น่าสนใจ:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension inject เข้ามาซึ่ง _เข้า_ บริบทโมเดล (ซ่อนจาก UI ได้)
- `custom`: สถานะ extension ที่ _ไม่เข้า_ บริบทโมเดล
- `compaction`: สรุป Compaction ที่คงอยู่พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่คงอยู่เมื่อนำทาง branch ของต้นไม้

OpenClaw ตั้งใจ **ไม่** “fix up” ทรานสคริปต์; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียน

---

## หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม

มีแนวคิดต่างกันสองอย่างที่สำคัญ:

1. **หน้าต่างบริบทของโมเดล**: hard cap ต่อโมเดล (โทเค็นที่โมเดลมองเห็นได้)
2. **ตัวนับที่เก็บเซสชัน**: สถิติ rolling ที่เขียนลง `sessions.json` (ใช้สำหรับ /status และ dashboard)

หากคุณกำลังปรับแต่งขีดจำกัด:

- หน้าต่างบริบทมาจาก catalog โมเดล (และ override ผ่าน config ได้)
- `contextTokens` ในที่เก็บเป็นค่าประมาณ/ค่ารายงานขณะ runtime; อย่าถือว่าเป็นการรับประกันแบบเข้มงวด

ดูเพิ่มเติมที่ [/token-use](/th/reference/token-use)

---

## Compaction: คืออะไร

Compaction สรุปบทสนทนาเก่าเป็น entry `compaction` ที่คงอยู่ในทรานสคริปต์ และเก็บข้อความล่าสุดไว้เหมือนเดิม

หลัง Compaction เทิร์นในอนาคตจะเห็น:

- สรุป Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction เป็นแบบ **ถาวร** (ไม่เหมือนการตัดแต่งเซสชัน) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขตชังก์ของ Compaction และการจับคู่เครื่องมือ

เมื่อ OpenClaw แบ่งทรานสคริปต์ที่ยาวออกเป็นชังก์ Compaction ระบบจะเก็บ
การเรียกเครื่องมือของผู้ช่วยให้จับคู่กับรายการ `toolResult` ที่ตรงกัน

- หากการแบ่งตามสัดส่วนโทเคนตกอยู่ระหว่างการเรียกเครื่องมือกับผลลัพธ์ OpenClaw
  จะเลื่อนขอบเขตไปที่ข้อความการเรียกเครื่องมือของผู้ช่วยแทนการแยกคู่นั้นออกจากกัน
- หากบล็อกผลลัพธ์เครื่องมือท้ายสุดจะทำให้ชังก์เกินเป้าหมายในกรณีปกติ
  OpenClaw จะรักษาบล็อกเครื่องมือที่ค้างอยู่นั้นไว้ และคงส่วนท้ายที่ยังไม่ได้สรุปไว้ครบถ้วน
- บล็อกการเรียกเครื่องมือที่ถูกยกเลิก/เกิดข้อผิดพลาดจะไม่ทำให้การแบ่งที่ค้างอยู่เปิดต่อไป

---

## เมื่อใดที่ auto-compaction เกิดขึ้น (รันไทม์ Pi)

ในเอเจนต์ Pi แบบฝังตัว auto-compaction จะถูกทริกเกอร์ในสองกรณี:

1. **การกู้คืนจากการล้น**: โมเดลส่งคืนข้อผิดพลาดบริบทล้น
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และรูปแบบคล้ายกันตามผู้ให้บริการ) → compact → ลองใหม่
2. **การดูแลรักษาตามเกณฑ์**: หลังจากเทิร์นสำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือหน้าต่างบริบทของโมเดล
- `reserveTokens` คือพื้นที่เผื่อที่สงวนไว้สำหรับพรอมป์ + เอาต์พุตโมเดลถัดไป

นี่คือความหมายเชิงรันไทม์ของ Pi (OpenClaw ใช้อีเวนต์ แต่ Pi เป็นผู้ตัดสินใจว่าจะ compact เมื่อใด)

OpenClaw ยังสามารถทริกเกอร์ Compaction ภายในเครื่องแบบ preflight ก่อนเปิดการรันถัดไป
เมื่อมีการตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` และไฟล์ทรานสคริปต์ที่ใช้งานอยู่มีขนาดถึงค่านั้น นี่เป็นตัวป้องกันตามขนาดไฟล์เพื่อลดต้นทุนการเปิดใหม่ภายในเครื่อง
ไม่ใช่การเก็บถาวรแบบดิบ: OpenClaw ยังคงรัน Compaction เชิงความหมายตามปกติ
และต้องใช้ `truncateAfterCompaction` เพื่อให้สรุปที่ถูก compact แล้วกลายเป็น
ทรานสคริปต์ตัวสืบทอดใหม่ได้

สำหรับการรัน Pi แบบฝังตัว `agents.defaults.compaction.midTurnPrecheck.enabled: true`
จะเพิ่มตัวป้องกันลูปเครื่องมือแบบเลือกเปิดใช้ หลังจากต่อท้ายผลลัพธ์เครื่องมือและก่อน
การเรียกโมเดลถัดไป OpenClaw จะประเมินแรงกดดันของพรอมป์โดยใช้ตรรกะงบประมาณ preflight
เดียวกับที่ใช้ตอนเริ่มเทิร์น หากบริบทไม่พอดีอีกต่อไป ตัวป้องกันจะไม่ compact
ภายในฮุก `transformContext` ของ Pi แต่จะส่งสัญญาณ precheck กลางเทิร์นแบบมีโครงสร้าง
หยุดการส่งพรอมป์ปัจจุบัน และปล่อยให้ลูปรันภายนอกใช้เส้นทางกู้คืนที่มีอยู่:
ตัดทอนผลลัพธ์เครื่องมือที่ใหญ่เกินไปเมื่อเพียงพอ หรือทริกเกอร์โหมด Compaction
ที่กำหนดค่าไว้แล้วลองใหม่ ตัวเลือกนี้ปิดไว้โดยค่าเริ่มต้น และทำงานได้กับทั้งโหมด Compaction
`default` และ `safeguard` รวมถึง Compaction แบบ safeguard ที่มีผู้ให้บริการรองรับ
สิ่งนี้เป็นอิสระจาก `maxActiveTranscriptBytes`: ตัวป้องกันตามขนาดไบต์จะทำงาน
ก่อนเปิดเทิร์น ส่วน mid-turn precheck จะทำงานภายหลังในลูปเครื่องมือ Pi แบบฝังตัว
หลังจากผลลัพธ์เครื่องมือใหม่ถูกต่อท้ายแล้ว

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

OpenClaw ยังบังคับใช้ค่าพื้นขั้นต่ำเพื่อความปลอดภัยสำหรับการรันแบบฝังตัวด้วย:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะเพิ่มค่าให้
- ค่าพื้นเริ่มต้นคือ `20000` โทเคน
- ตั้งค่า `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิดใช้ค่าพื้น
- หากค่าสูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม
- `/compact` แบบแมนนวลจะเคารพ `agents.defaults.compaction.keepRecentTokens`
  ที่ระบุชัดเจน และเก็บจุดตัดส่วนท้ายล่าสุดของ Pi ไว้ หากไม่มีงบประมาณการเก็บที่ระบุชัดเจน
  Compaction แบบแมนนวลจะยังคงเป็นเช็กพอยต์แบบแข็ง และบริบทที่สร้างใหม่จะเริ่มจาก
  สรุปใหม่
- ตั้งค่า `agents.defaults.compaction.midTurnPrecheck.enabled: true` เพื่อรัน
  precheck ของลูปเครื่องมือที่เป็นตัวเลือก หลังจากมีผลลัพธ์เครื่องมือใหม่และก่อนการเรียกโมเดล
  ถัดไป นี่เป็นเพียงทริกเกอร์เท่านั้น; การสร้างสรุปยังคงใช้เส้นทาง Compaction
  ที่กำหนดค่าไว้ สิ่งนี้เป็นอิสระจาก `maxActiveTranscriptBytes` ซึ่งเป็นตัวป้องกัน
  ตามขนาดไบต์ของทรานสคริปต์ที่ใช้งานอยู่ตอนเริ่มเทิร์น
- ตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` เป็นค่าไบต์หรือ
  สตริง เช่น `"20mb"` เพื่อรัน Compaction ภายในเครื่องก่อนเทิร์นเมื่อทรานสคริปต์
  ที่ใช้งานอยู่มีขนาดใหญ่ ตัวป้องกันนี้จะทำงานเฉพาะเมื่อเปิดใช้
  `truncateAfterCompaction` ด้วย ปล่อยไว้ไม่ตั้งค่าหรือตั้ง `0` เพื่อปิดใช้
- เมื่อเปิดใช้ `agents.defaults.compaction.truncateAfterCompaction`
  OpenClaw จะหมุนทรานสคริปต์ที่ใช้งานอยู่ไปเป็น JSONL ตัวสืบทอดที่ถูก compact แล้ว
  หลัง Compaction ทรานสคริปต์เต็มเดิมยังคงถูกเก็บถาวรและลิงก์จากเช็กพอยต์
  Compaction แทนการเขียนทับในที่เดิม

เหตุผล: เว้นพื้นที่เผื่อให้เพียงพอสำหรับ "งานดูแลระบบ" หลายเทิร์น (เช่น การเขียนหน่วยความจำ) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

การใช้งาน: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(เรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## ผู้ให้บริการ Compaction แบบเสียบเปลี่ยนได้

Plugin ต่าง ๆ สามารถลงทะเบียนผู้ให้บริการ Compaction ผ่าน `registerCompactionProvider()` บน API ของ Plugin ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งเป็น id ของผู้ให้บริการที่ลงทะเบียนไว้ ส่วนขยาย safeguard จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทนไปป์ไลน์ `summarizeInStages` ในตัว

- `provider`: id ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ ปล่อยว่างไว้เพื่อใช้การสรุปด้วย LLM เริ่มต้น
- การตั้งค่า `provider` จะบังคับ `mode: "safeguard"`
- ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการรักษาตัวระบุแบบเดียวกับเส้นทางในตัว
- safeguard ยังคงรักษาบริบทส่วนต่อท้ายของเทิร์นล่าสุดและเทิร์นที่ถูกแบ่งไว้หลังเอาต์พุตของผู้ให้บริการ
- การสรุป safeguard ในตัวจะกลั่นสรุปก่อนหน้าซ้ำร่วมกับข้อความใหม่
  แทนการรักษาสรุปก่อนหน้าแบบเต็มไว้ตามตัวอักษร
- โหมด safeguard เปิดใช้การตรวจสอบคุณภาพสรุปโดยค่าเริ่มต้น; ตั้งค่า
  `qualityGuard.enabled: false` เพื่อข้ามพฤติกรรมลองใหม่เมื่อเอาต์พุตมีรูปแบบผิด
- หากผู้ให้บริการล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะย้อนกลับไปใช้การสรุปด้วย LLM ในตัวโดยอัตโนมัติ
- สัญญาณยกเลิก/หมดเวลาจะถูกโยนซ้ำ (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกของผู้เรียก

แหล่งที่มา: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็น

คุณสามารถสังเกต Compaction และสถานะเซสชันได้ผ่าน:

- `/status` (ในเซสชันแชตใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- ล็อก Gateway (`pnpm gateway:watch` หรือ `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- โหมดละเอียด: `🧹 Auto-compaction complete` + จำนวน Compaction

---

## งานดูแลระบบแบบเงียบ (`NO_REPLY`)

OpenClaw รองรับเทิร์นแบบ "เงียบ" สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ข้อตกลง:

- ผู้ช่วยเริ่มเอาต์พุตด้วยโทเคนเงียบที่ตรงเป๊ะ `NO_REPLY` /
  `no_reply` เพื่อระบุว่า "ไม่ต้องส่งคำตอบให้ผู้ใช้"
- OpenClaw จะตัด/ระงับสิ่งนี้ในชั้นการส่งมอบ
- การระงับด้วยโทเคนเงียบที่ตรงเป๊ะไม่สนใจตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` จะนับทั้งคู่เมื่อเพย์โหลดทั้งหมดมีเพียงโทเคนเงียบ
- สิ่งนี้มีไว้สำหรับเทิร์นเบื้องหลัง/ไม่ส่งมอบจริงเท่านั้น; ไม่ใช่ทางลัดสำหรับ
  คำขอผู้ใช้ทั่วไปที่ต้องดำเนินการได้

ตั้งแต่ `2026.1.10` เป็นต้นมา OpenClaw ยังระงับ **การสตรีมแบบร่าง/กำลังพิมพ์** เมื่อ
ชังก์บางส่วนเริ่มด้วย `NO_REPLY` ดังนั้นงานแบบเงียบจะไม่รั่วเอาต์พุตบางส่วน
กลางเทิร์น

---

## "การล้างหน่วยความจำ" ก่อน Compaction (ใช้งานแล้ว)

เป้าหมาย: ก่อนที่ auto-compaction จะเกิดขึ้น ให้รันเทิร์น agentic แบบเงียบที่เขียนสถานะถาวร
ลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ในเวิร์กสเปซเอเจนต์) เพื่อให้ Compaction ไม่สามารถ
ลบบริบทสำคัญได้

OpenClaw ใช้แนวทาง **การล้างก่อนถึงเกณฑ์**:

1. ตรวจสอบการใช้งานบริบทของเซสชัน
2. เมื่อข้าม "เกณฑ์อ่อน" (ต่ำกว่าเกณฑ์ Compaction ของ Pi) ให้รันคำสั่งเงียบ
   "เขียนหน่วยความจำตอนนี้" ไปยังเอเจนต์
3. ใช้โทเคนเงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้ไม่เห็น
   อะไรเลย

การกำหนดค่า (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `model` (ตัวเลือกการแทนที่ผู้ให้บริการ/โมเดลแบบตรงเป๊ะที่เป็นทางเลือกสำหรับเทิร์นล้าง เช่น `ollama/qwen3:8b`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับเทิร์นล้าง)
- `systemPrompt` (พรอมป์ระบบเพิ่มเติมที่ต่อท้ายสำหรับเทิร์นล้าง)

หมายเหตุ:

- พรอมป์/พรอมป์ระบบเริ่มต้นมีคำใบ้ `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- เมื่อตั้งค่า `model` เทิร์นล้างจะใช้โมเดลนั้นโดยไม่สืบทอด
  เชน fallback ของเซสชันที่ใช้งานอยู่ ดังนั้นงานดูแลระบบเฉพาะเครื่องจะไม่
  fallback ไปยังโมเดลสนทนาแบบเสียเงินอย่างเงียบ ๆ
- การล้างจะรันหนึ่งครั้งต่อรอบ Compaction (ติดตามใน `sessions.json`)
- การล้างจะรันเฉพาะสำหรับเซสชัน Pi แบบฝังตัว (แบ็กเอนด์ CLI จะข้าม)
- การล้างจะถูกข้ามเมื่อเวิร์กสเปซเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [หน่วยความจำ](/th/concepts/memory) สำหรับเลย์เอาต์ไฟล์เวิร์กสเปซและรูปแบบการเขียน

Pi ยังเปิดเผยฮุก `session_before_compact` ใน API ของส่วนขยายด้วย แต่ตรรกะการล้างของ OpenClaw
ปัจจุบันอยู่ฝั่ง Gateway

---

## เช็กลิสต์การแก้ปัญหา

- คีย์เซสชันผิดหรือไม่? เริ่มจาก [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- ที่เก็บกับทรานสคริปต์ไม่ตรงกันหรือไม่? ยืนยันโฮสต์ Gateway และเส้นทางที่เก็บจาก `openclaw status`
- Compaction ถี่เกินไปหรือไม่? ตรวจสอบ:
  - หน้าต่างบริบทของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` สูงเกินไปสำหรับหน้าต่างโมเดลอาจทำให้ Compaction เกิดเร็วขึ้น)
  - ผลลัพธ์เครื่องมือบวม: เปิดใช้/ปรับแต่งการตัดแต่งเซสชัน
- เทิร์นเงียบรั่วหรือไม่? ยืนยันว่าคำตอบเริ่มด้วย `NO_REPLY` (โทเคนตรงเป๊ะแบบไม่สนใจตัวพิมพ์เล็กใหญ่) และคุณอยู่บนบิลด์ที่มีการแก้ไขการระงับสตรีมมิงแล้ว

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [เอนจินบริบท](/th/concepts/context-engine)
