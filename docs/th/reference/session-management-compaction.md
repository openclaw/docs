---
read_when:
    - คุณต้องดีบักรหัสเซสชัน, JSONL ของทรานสคริปต์ หรือฟิลด์ของ sessions.json
    - คุณกำลังเปลี่ยนพฤติกรรม auto-Compaction หรือเพิ่มงานดูแลจัดการ “pre-Compaction”
    - คุณต้องการใช้งานการล้างหน่วยความจำหรือเทิร์นระบบแบบเงียบ
summary: 'เจาะลึก: ที่เก็บเซสชัน + ทรานสคริปต์ วงจรชีวิต และกลไกภายในของ Compaction (อัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-04-30T16:30:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw จัดการเซสชันแบบครบวงจรในพื้นที่เหล่านี้:

- **การกำหนดเส้นทางเซสชัน** (วิธีที่ข้อความขาเข้าถูกแมปไปยัง `sessionKey`)
- **ที่เก็บเซสชัน** (`sessions.json`) และสิ่งที่ติดตาม
- **การคงอยู่ของทรานสคริปต์** (`*.jsonl`) และโครงสร้างของมัน
- **สุขอนามัยของทรานสคริปต์** (การปรับแก้เฉพาะผู้ให้บริการก่อนรัน)
- **ขีดจำกัดบริบท** (หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม)
- **Compaction** (การบีบอัดด้วยตนเองและอัตโนมัติ) และตำแหน่งที่จะ hook งานก่อนการบีบอัด
- **งานดูแลเบื้องหลังแบบเงียบ** (การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

หากต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

- [การจัดการเซสชัน](/th/concepts/session)
- [Compaction](/th/concepts/compaction)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [สุขอนามัยของทรานสคริปต์](/th/reference/transcript-hygiene)

---

## แหล่งความจริง: Gateway

OpenClaw ถูกออกแบบโดยมี **กระบวนการ Gateway** เดียวที่เป็นเจ้าของสถานะเซสชัน

- UI (แอป macOS, Control UI บนเว็บ, TUI) ควรสอบถาม Gateway สำหรับรายการเซสชันและจำนวนโทเค็น
- ในโหมดระยะไกล ไฟล์เซสชันอยู่บนโฮสต์ระยะไกล; “การตรวจสอบไฟล์ใน Mac เครื่องของคุณ” จะไม่สะท้อนสิ่งที่ Gateway ใช้อยู่

---

## เลเยอร์การคงอยู่สองชั้น

OpenClaw คงอยู่เซสชันในสองเลเยอร์:

1. **ที่เก็บเซสชัน (`sessions.json`)**
   - แมปคีย์/ค่า: `sessionKey -> SessionEntry`
   - ขนาดเล็ก เปลี่ยนแปลงได้ และแก้ไขได้อย่างปลอดภัย (หรือลบรายการได้)
   - ติดตามเมทาดาทาของเซสชัน (รหัสเซสชันปัจจุบัน กิจกรรมล่าสุด toggle ตัวนับโทเค็น ฯลฯ)

2. **ทรานสคริปต์ (`<sessionId>.jsonl`)**
   - ทรานสคริปต์แบบ append-only พร้อมโครงสร้างต้นไม้ (รายการมี `id` + `parentId`)
   - เก็บบทสนทนาจริง + การเรียกเครื่องมือ + สรุป Compaction
   - ใช้สร้างบริบทโมเดลใหม่สำหรับ turn ในอนาคต
   - จุดตรวจดีบักขนาดใหญ่ก่อน Compaction จะถูกข้ามเมื่อทรานสคริปต์ที่ใช้งานอยู่มีขนาดเกินเพดานขนาดจุดตรวจ เพื่อหลีกเลี่ยงการสร้างสำเนา `.checkpoint.*.jsonl` ขนาดใหญ่อีกชุด

---

## ตำแหน่งบนดิสก์

ต่อ agent บนโฮสต์ Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve ตำแหน่งเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษา store และการควบคุมดิสก์

การคงอยู่ของเซสชันมีการควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json`, อาร์ทิแฟกต์ทรานสคริปต์ และ sidecar ของ trajectory:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: cutoff อายุของรายการเก่า (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวนรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- `resetArchiveRetention`: ระยะเวลาเก็บรักษา archive ทรานสคริปต์ `*.reset.<timestamp>` (ค่าเริ่มต้น: เหมือน `pruneAfter`; `false` ปิดการล้างข้อมูล)
- `maxDiskBytes`: งบประมาณไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังล้างข้อมูล (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

การเขียน Gateway ปกติจะ batch การล้างข้อมูล `maxEntries` สำหรับ cap ขนาด production ดังนั้น store อาจเกิน cap ที่กำหนดไว้ชั่วครู่ก่อนที่การล้างข้อมูล high-water ครั้งถัดไปจะเขียนกลับให้ลดลง `openclaw sessions cleanup --enforce` ยังคงใช้ cap ที่กำหนดไว้ทันที

OpenClaw ไม่สร้าง backup หมุนเวียนอัตโนมัติ `sessions.json.bak.*` ระหว่างการเขียน Gateway อีกต่อไป คีย์ legacy `session.maintenance.rotateBytes` จะถูกเพิกเฉย และ `openclaw doctor --fix` จะลบออกจาก config รุ่นเก่า

ลำดับการ enforce สำหรับการล้างข้อมูลงบประมาณดิสก์ (`mode: "enforce"`):

1. ลบอาร์ทิแฟกต์ที่ archive แล้วเก่าที่สุด ทรานสคริปต์ orphan หรือ trajectory orphan ก่อน
2. หากยังเกินเป้าหมาย ให้ขับรายการเซสชันที่เก่าที่สุดออกพร้อมไฟล์ทรานสคริปต์/trajectory ของรายการนั้น
3. ทำต่อจนกว่าการใช้งานจะอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการขับออกที่อาจเกิดขึ้น แต่จะไม่แก้ไข store/ไฟล์

รันการบำรุงรักษาตามต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และ log การรัน

การรัน cron แบบแยกยังสร้างรายการเซสชัน/ทรานสคริปต์ด้วย และมีการควบคุม retention เฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ตัดแต่งเซสชันการรัน cron แบบแยกที่เก่าออกจากที่เก็บเซสชัน (`false` ปิดใช้งาน)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` ตัดแต่งไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` ไบต์ และ `2000` บรรทัด)

เมื่อ cron บังคับสร้างเซสชันการรันแบบแยกใหม่ มันจะ sanitize รายการเซสชัน `cron:<jobId>` ก่อนหน้าก่อนเขียนแถวใหม่ โดยจะนำค่ากำหนดที่ปลอดภัยติดไปด้วย เช่น การตั้งค่า thinking/fast/verbose, label และการ override โมเดล/auth ที่ผู้ใช้เลือกไว้อย่างชัดเจน มันจะทิ้งบริบทบทสนทนาแวดล้อม เช่น การกำหนดเส้นทาง channel/group, นโยบายการส่งหรือคิว, elevation, origin และการผูก runtime ของ ACP เพื่อให้การรันแบบแยกใหม่ไม่สามารถสืบทอดการส่งที่ค้างหรืออำนาจ runtime จากการรันเก่า

---

## คีย์เซสชัน (`sessionKey`)

`sessionKey` ระบุว่า _คุณอยู่ใน bucket บทสนทนาใด_ (การกำหนดเส้นทาง + การแยก)

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

หลักคร่าว ๆ:

- **Reset** (`/new`, `/reset`) สร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **การ reset รายวัน** (ค่าเริ่มต้น 4:00 AM ตามเวลาท้องถิ่นบนโฮสต์ gateway) สร้าง `sessionId` ใหม่เมื่อมีข้อความถัดไปหลังขอบเขตการ reset
- **การหมดอายุเมื่อ idle** (`session.reset.idleMinutes` หรือ legacy `session.idleMinutes`) สร้าง `sessionId` ใหม่เมื่อข้อความมาถึงหลังช่วงเวลา idle เมื่อกำหนดค่าทั้งรายวัน + idle อันใดหมดอายุก่อนจะชนะ
- **เหตุการณ์ระบบ** (heartbeat, การปลุก cron, การแจ้งเตือน exec, งาน bookkeeping ของ gateway) อาจแก้ไขแถวเซสชัน แต่ไม่ยืดความสดใหม่ของการ reset รายวัน/idle การ rollover ของ reset จะทิ้งประกาศเหตุการณ์ระบบที่คิวไว้สำหรับเซสชันก่อนหน้าก่อนสร้าง prompt ใหม่
- **ตัวป้องกัน parent fork ของเธรด** (`session.parentForkMaxTokens`, ค่าเริ่มต้น `100000`) ข้ามการ fork ทรานสคริปต์ parent เมื่อเซสชัน parent ใหญ่เกินไปแล้ว; เธรดใหม่เริ่มใหม่ ตั้งค่า `0` เพื่อปิดใช้งาน

รายละเอียด implementation: การตัดสินใจเกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## schema ของที่เก็บเซสชัน (`sessions.json`)

ชนิดค่าของ store คือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: รหัสทรานสคริปต์ปัจจุบัน (ชื่อไฟล์ derive จากค่านี้ เว้นแต่ตั้ง `sessionFile`)
- `sessionStartedAt`: timestamp เริ่มต้นสำหรับ `sessionId` ปัจจุบัน; ความสดใหม่ของการ reset รายวันใช้ค่านี้ แถว legacy อาจ derive จาก header เซสชัน JSONL
- `lastInteractionAt`: timestamp การโต้ตอบจริงล่าสุดของผู้ใช้/channel; ความสดใหม่ของการ reset เมื่อ idle ใช้ค่านี้ เพื่อให้ heartbeat, cron และเหตุการณ์ exec ไม่ทำให้เซสชันคงอยู่ แถว legacy ที่ไม่มีฟิลด์นี้จะ fallback ไปยังเวลาเริ่มเซสชันที่กู้คืนได้สำหรับความสดใหม่เมื่อ idle
- `updatedAt`: timestamp การแก้ไขแถว store ล่าสุด ใช้สำหรับการแสดงรายการ การตัดแต่ง และ bookkeeping ไม่ใช่ authority สำหรับความสดใหม่ของการ reset รายวัน/idle
- `sessionFile`: override เส้นทางทรานสคริปต์แบบ explicit ที่ไม่บังคับ
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายการส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: เมทาดาทาสำหรับ labeling กลุ่ม/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (best-effort / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: จำนวนครั้งที่ auto-compaction เสร็จสำหรับคีย์เซสชันนี้
- `memoryFlushAt`: timestamp สำหรับการ flush หน่วยความจำก่อน Compaction ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction เมื่อการ flush ครั้งล่าสุดรัน

store แก้ไขได้อย่างปลอดภัย แต่ Gateway คือ authority: มันอาจเขียนใหม่หรือ rehydrate รายการเมื่อเซสชันรัน

---

## โครงสร้างทรานสคริปต์ (`*.jsonl`)

ทรานสคริปต์ถูกจัดการโดย `SessionManager` ของ `@mariozechner/pi-coding-agent`

ไฟล์เป็น JSONL:

- บรรทัดแรก: header เซสชัน (`type: "session"` รวม `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- จากนั้น: รายการเซสชันพร้อม `id` + `parentId` (ต้นไม้)

ชนิดรายการที่น่าสังเกต:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension inject ซึ่ง _เข้าสู่_ บริบทโมเดล (สามารถซ่อนจาก UI ได้)
- `custom`: สถานะ extension ที่ _ไม่เข้าสู่_ บริบทโมเดล
- `compaction`: สรุป Compaction ที่คงอยู่พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่คงอยู่เมื่อ navigate branch ของต้นไม้

OpenClaw ตั้งใจ **ไม่** “fix up” ทรานสคริปต์; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียน

---

## หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม

มีสองแนวคิดต่างกันที่สำคัญ:

1. **หน้าต่างบริบทของโมเดล**: cap แข็งต่อโมเดล (โทเค็นที่โมเดลเห็นได้)
2. **ตัวนับในที่เก็บเซสชัน**: สถิติ rolling ที่เขียนลง `sessions.json` (ใช้สำหรับ /status และ dashboard)

หากกำลังปรับแต่งขีดจำกัด:

- หน้าต่างบริบทมาจาก catalog โมเดล (และสามารถ override ผ่าน config ได้)
- `contextTokens` ใน store เป็นค่าประมาณ/ค่ารายงาน runtime; อย่าถือว่าเป็นการรับประกันแบบเข้มงวด

ดูเพิ่มเติมที่ [/token-use](/th/reference/token-use)

---

## Compaction: คืออะไร

Compaction สรุปบทสนทนาเก่าเข้าเป็นรายการ `compaction` ที่คงอยู่ในทรานสคริปต์ และคงข้อความล่าสุดไว้ครบถ้วน

หลัง Compaction, turn ในอนาคตจะเห็น:

- สรุป Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction เป็นแบบ **คงอยู่** (ต่างจากการตัดแต่งเซสชัน) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขต chunk ของ Compaction และการจับคู่เครื่องมือ

เมื่อ OpenClaw แบ่งทรานสคริปต์ยาวเป็น chunk สำหรับ Compaction มันจะเก็บการเรียกเครื่องมือของ assistant คู่กับรายการ `toolResult` ที่ตรงกัน

- หากการแบ่งตามสัดส่วนโทเค็นตกอยู่ระหว่างการเรียกเครื่องมือกับผลลัพธ์ OpenClaw จะเลื่อนขอบเขตไปที่ข้อความเรียกเครื่องมือของ assistant แทนที่จะแยกคู่ออกจากกัน
- หาก block ผลลัพธ์เครื่องมือท้ายสุดจะทำให้ chunk เกินเป้าหมาย OpenClaw จะรักษา block เครื่องมือที่ค้างอยู่นั้นไว้และคง tail ที่ยังไม่ได้สรุปไว้ครบถ้วน
- block การเรียกเครื่องมือที่ถูกยกเลิก/เกิดข้อผิดพลาดจะไม่เปิด pending split ค้างไว้

---

## auto-compaction เกิดขึ้นเมื่อใด (runtime ของ Pi)

ใน agent Pi แบบฝัง auto-compaction จะ trigger ในสองกรณี:

1. **การกู้คืนเมื่อ overflow**: โมเดลส่งคืนข้อผิดพลาด context overflow
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และ variant รูปแบบผู้ให้บริการที่คล้ายกัน) → compact → retry
2. **การบำรุงรักษาตาม threshold**: หลัง turn สำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือหน้าต่างบริบทของโมเดล
- `reserveTokens` คือ headroom ที่กันไว้สำหรับ prompt + เอาต์พุตโมเดลถัดไป

นี่คือ semantics ของ runtime Pi (OpenClaw ใช้ event เหล่านี้ แต่ Pi เป็นผู้ตัดสินใจว่าเมื่อใดต้อง compact)

OpenClaw ยังสามารถ trigger การทำ local compaction แบบ preflight ก่อนเปิด run ถัดไปเมื่อกำหนด `agents.defaults.compaction.maxActiveTranscriptBytes` และไฟล์ทรานสคริปต์ที่ใช้งานอยู่มีขนาดถึงค่านั้น นี่เป็น guard ขนาดไฟล์สำหรับต้นทุนการ reopen ในเครื่อง ไม่ใช่การ archive ดิบ: OpenClaw ยังคงรัน semantic compaction ตามปกติ และต้องใช้ `truncateAfterCompaction` เพื่อให้สรุปที่ถูก compact กลายเป็นทรานสคริปต์ successor ใหม่ได้

สำหรับการรัน Pi แบบฝังตัว `agents.defaults.compaction.midTurnPrecheck.enabled: true`
จะเพิ่มตัวป้องกันลูปเครื่องมือแบบเลือกเปิดใช้ หลังจากผนวกผลลัพธ์เครื่องมือแล้วและก่อนการเรียก
โมเดลครั้งถัดไป OpenClaw จะประเมินแรงกดดันต่อพรอมป์ต์โดยใช้ตรรกะงบประมาณก่อนรัน
แบบเดียวกับที่ใช้ตอนเริ่มเทิร์น หากบริบทไม่พอดีอีกต่อไป ตัวป้องกันจะไม่ทำ
Compaction ภายในฮุก `transformContext` ของ Pi แต่จะส่งสัญญาณตรวจสอบก่อนรันกลางเทิร์น
แบบมีโครงสร้าง หยุดการส่งพรอมป์ต์ปัจจุบัน และให้ลูปรันชั้นนอกใช้เส้นทางกู้คืนที่มีอยู่:
ตัดทอนผลลัพธ์เครื่องมือที่ใหญ่เกินไปเมื่อแค่นั้นเพียงพอ หรือทริกเกอร์โหมด Compaction ที่กำหนดค่าไว้
แล้วลองใหม่ ตัวเลือกนี้ปิดไว้ตามค่าเริ่มต้นและทำงานได้กับโหมด Compaction ทั้ง `default` และ `safeguard`
รวมถึง Compaction แบบ safeguard ที่มี provider รองรับ
สิ่งนี้แยกจาก `maxActiveTranscriptBytes`: ตัวป้องกันขนาดไบต์จะทำงาน
ก่อนเปิดเทิร์น ส่วนการตรวจสอบก่อนรันกลางเทิร์นจะทำงานภายหลังในลูปเครื่องมือ Pi แบบฝังตัว
หลังจากผนวกผลลัพธ์เครื่องมือใหม่แล้ว

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

OpenClaw ยังบังคับใช้ค่าพื้นขั้นต่ำเพื่อความปลอดภัยสำหรับการรันแบบฝังตัว:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะเพิ่มค่าให้
- ค่าพื้นเริ่มต้นคือ `20000` โทเค็น
- ตั้งค่า `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิดใช้ค่าพื้น
- หากค่าสูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม
- `/compact` แบบแมนนวลจะเคารพค่า `agents.defaults.compaction.keepRecentTokens`
  ที่ระบุอย่างชัดเจน และคงจุดตัดส่วนท้ายล่าสุดของ Pi ไว้ หากไม่มีงบประมาณการเก็บรักษาที่ระบุอย่างชัดเจน
  Compaction แบบแมนนวลจะยังคงเป็นเช็กพอยต์แบบแข็ง และบริบทที่สร้างใหม่จะเริ่มจาก
  สรุปใหม่
- ตั้งค่า `agents.defaults.compaction.midTurnPrecheck.enabled: true` เพื่อรันการตรวจสอบก่อนรัน
  ในลูปเครื่องมือที่เป็นทางเลือก หลังจากมีผลลัพธ์เครื่องมือใหม่และก่อนการเรียกโมเดลครั้งถัดไป
  สิ่งนี้เป็นเพียงทริกเกอร์เท่านั้น การสร้างสรุปยังคงใช้เส้นทาง Compaction ที่กำหนดค่าไว้
  สิ่งนี้แยกจาก `maxActiveTranscriptBytes` ซึ่งเป็นตัวป้องกันขนาดไบต์ของ active transcript
  ตอนเริ่มเทิร์น
- ตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` เป็นค่าไบต์หรือ
  สตริง เช่น `"20mb"` เพื่อรัน Compaction ภายในเครื่องก่อนเริ่มเทิร์นเมื่อ active
  transcript มีขนาดใหญ่ ตัวป้องกันนี้จะทำงานก็ต่อเมื่อ
  `truncateAfterCompaction` เปิดใช้อยู่ด้วย ปล่อยค่าว่างไว้หรือตั้งค่าเป็น `0` เพื่อ
  ปิดใช้
- เมื่อเปิดใช้ `agents.defaults.compaction.truncateAfterCompaction`
  OpenClaw จะหมุนเวียน active transcript ไปยัง JSONL ตัวสืบทอดที่ผ่านการ compact แล้วหลัง
  Compaction transcript ฉบับเต็มเดิมจะยังคงถูกเก็บถาวรและลิงก์จาก
  เช็กพอยต์ Compaction แทนการเขียนทับที่เดิม

เหตุผล: เว้นพื้นที่เผื่อให้เพียงพอสำหรับ “งานดูแลระบบ” แบบหลายเทิร์น (เช่น การเขียนหน่วยความจำ) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

การใช้งาน: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(เรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## ผู้ให้บริการ Compaction แบบเสียบแทนได้

Plugin สามารถลงทะเบียน provider สำหรับ Compaction ผ่าน `registerCompactionProvider()` บน API ของ Plugin ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งค่าเป็น ID ของ provider ที่ลงทะเบียนไว้ ส่วนขยาย safeguard จะมอบหมายการสรุปให้ provider นั้นแทนไปป์ไลน์ `summarizeInStages` ในตัว

- `provider`: ID ของ Plugin provider สำหรับ Compaction ที่ลงทะเบียนไว้ ปล่อยว่างเพื่อใช้การสรุปด้วย LLM ตามค่าเริ่มต้น
- การตั้งค่า `provider` จะบังคับ `mode: "safeguard"`
- Provider จะได้รับคำสั่ง Compaction และนโยบายการรักษาตัวระบุแบบเดียวกับเส้นทางในตัว
- safeguard ยังคงรักษาบริบทส่วนต่อท้ายของเทิร์นล่าสุดและเทิร์นที่ถูกแบ่งหลังจากผลลัพธ์ของ provider
- การสรุป safeguard ในตัวจะกลั่นสรุปก่อนหน้าใหม่พร้อมข้อความใหม่
  แทนการรักษาสรุปก่อนหน้าทั้งหมดไว้ตามตัวอักษร
- โหมด safeguard เปิดใช้การตรวจสอบคุณภาพสรุปตามค่าเริ่มต้น ตั้งค่า
  `qualityGuard.enabled: false` เพื่อข้ามพฤติกรรมลองใหม่เมื่อเอาต์พุตมีรูปแบบผิด
- หาก provider ล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะถอยกลับไปใช้การสรุปด้วย LLM ในตัวโดยอัตโนมัติ
- สัญญาณยกเลิก/หมดเวลาจะถูกโยนซ้ำ (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกของผู้เรียก

แหล่งที่มา: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็นได้

คุณสามารถสังเกต Compaction และสถานะเซสชันได้ผ่าน:

- `/status` (ในเซสชันแชตใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- โหมดละเอียด: `🧹 Auto-compaction complete` + จำนวน Compaction

---

## งานดูแลระบบแบบเงียบ (`NO_REPLY`)

OpenClaw รองรับเทิร์นแบบ “เงียบ” สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ข้อตกลง:

- ผู้ช่วยเริ่มเอาต์พุตด้วยโทเค็นเงียบที่ตรงเป๊ะ `NO_REPLY` /
  `no_reply` เพื่อระบุว่า “อย่าส่งคำตอบให้ผู้ใช้”
- OpenClaw จะตัด/ระงับสิ่งนี้ในชั้นการส่งมอบ
- การระงับโทเค็นเงียบที่ตรงเป๊ะไม่สนใจตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` ทั้งคู่จะนับเมื่อ payload ทั้งหมดเป็นเพียงโทเค็นเงียบ
- สิ่งนี้ใช้สำหรับเทิร์นเบื้องหลัง/ไม่ส่งมอบจริงเท่านั้น ไม่ใช่ทางลัดสำหรับ
  คำขอผู้ใช้ทั่วไปที่ต้องดำเนินการ

ตั้งแต่ `2026.1.10` เป็นต้นมา OpenClaw ยังระงับ **สตรีมมิงแบบร่าง/กำลังพิมพ์** เมื่อ
ชังก์บางส่วนเริ่มด้วย `NO_REPLY` ดังนั้นการทำงานแบบเงียบจะไม่รั่วเอาต์พุตบางส่วน
กลางเทิร์น

---

## "การฟลัชหน่วยความจำ" ก่อน Compaction (ใช้งานแล้ว)

เป้าหมาย: ก่อนเกิด Compaction อัตโนมัติ ให้รันเทิร์นแบบ agentic เงียบที่เขียนสถานะถาวร
ลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ในพื้นที่ทำงานของเอเจนต์) เพื่อไม่ให้ Compaction
ลบบริบทสำคัญได้

OpenClaw ใช้แนวทาง **ฟลัชก่อนถึงเกณฑ์**:

1. ตรวจสอบการใช้บริบทของเซสชัน
2. เมื่อเกิน “เกณฑ์แบบอ่อน” (ต่ำกว่าเกณฑ์ Compaction ของ Pi) ให้รันคำสั่งเงียบ
   “เขียนหน่วยความจำตอนนี้” ไปยังเอเจนต์
3. ใช้โทเค็นเงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้ไม่เห็น
   อะไรเลย

การกำหนดค่า (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `model` (ตัวเลือก override provider/model ที่ตรงเป๊ะสำหรับเทิร์นฟลัช เช่น `ollama/qwen3:8b`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับเทิร์นฟลัช)
- `systemPrompt` (พรอมป์ต์ระบบเพิ่มเติมที่ผนวกสำหรับเทิร์นฟลัช)

หมายเหตุ:

- พรอมป์ต์/พรอมป์ต์ระบบเริ่มต้นมีคำใบ้ `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- เมื่อกำหนด `model` เทิร์นฟลัชจะใช้โมเดลนั้นโดยไม่สืบทอด
  เชน fallback ของเซสชันที่ใช้งานอยู่ ดังนั้นงานดูแลระบบเฉพาะภายในเครื่องจะไม่
  fallback ไปยังโมเดลสนทนาแบบเสียเงินอย่างเงียบ ๆ
- ฟลัชจะรันหนึ่งครั้งต่อรอบ Compaction (ติดตามใน `sessions.json`)
- ฟลัชจะรันเฉพาะสำหรับเซสชัน Pi แบบฝังตัว (แบ็กเอนด์ CLI จะข้าม)
- ฟลัชจะถูกข้ามเมื่อพื้นที่ทำงานของเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [หน่วยความจำ](/th/concepts/memory) สำหรับโครงร่างไฟล์พื้นที่ทำงานและรูปแบบการเขียน

Pi ยังเปิดเผยฮุก `session_before_compact` ใน API ของส่วนขยายด้วย แต่ตรรกะ
ฟลัชของ OpenClaw อยู่ฝั่ง Gateway ในปัจจุบัน

---

## เช็กลิสต์การแก้ไขปัญหา

- คีย์เซสชันผิดหรือไม่ เริ่มจาก [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- store กับ transcript ไม่ตรงกันหรือไม่ ยืนยันโฮสต์ Gateway และพาธ store จาก `openclaw status`
- Compaction เกิดถี่เกินไปหรือไม่ ตรวจสอบ:
  - หน้าต่างบริบทของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` สูงเกินไปสำหรับหน้าต่างโมเดลอาจทำให้เกิด Compaction เร็วขึ้น)
  - ผลลัพธ์เครื่องมือบวม: เปิดใช้/ปรับการตัดแต่งเซสชัน
- เทิร์นเงียบรั่วหรือไม่ ยืนยันว่าคำตอบเริ่มด้วย `NO_REPLY` (โทเค็นตรงเป๊ะแบบไม่สนใจตัวพิมพ์เล็กใหญ่) และคุณอยู่บนบิลด์ที่มีการแก้ไขการระงับสตรีมมิงแล้ว

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [เอนจินบริบท](/th/concepts/context-engine)
