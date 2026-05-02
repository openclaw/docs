---
read_when:
    - คุณต้องดีบักรหัสเซสชัน, JSONL บันทึกการสนทนา หรือฟิลด์ sessions.json
    - คุณกำลังเปลี่ยนลักษณะการทำงานของการบีบอัดอัตโนมัติ หรือเพิ่มงานดูแลความเรียบร้อย “ก่อนการบีบอัด”
    - คุณต้องการนำการล้างหน่วยความจำหรือเทิร์นระบบแบบเงียบไปใช้
summary: 'เจาะลึก: ที่เก็บเซสชัน + บันทึกบทสนทนา วงจรชีวิต และกลไกภายในของ Compaction (อัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-05-02T10:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw จัดการเซสชันตั้งแต่ต้นจนจบในพื้นที่เหล่านี้:

- **การกำหนดเส้นทางเซสชัน** (วิธีที่ข้อความขาเข้าจับคู่กับ `sessionKey`)
- **ที่เก็บเซสชัน** (`sessions.json`) และสิ่งที่ติดตาม
- **การคงอยู่ของทรานสคริปต์** (`*.jsonl`) และโครงสร้างของมัน
- **สุขอนามัยของทรานสคริปต์** (การแก้ไขเฉพาะผู้ให้บริการก่อนรัน)
- **ขีดจำกัดบริบท** (หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม)
- **Compaction** (การทำ Compaction แบบแมนนวลและอัตโนมัติ) และจุดสำหรับเชื่อมงานก่อน Compaction
- **งานดูแลเงียบ** (การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

ถ้าคุณต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

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
- ในโหมดระยะไกล ไฟล์เซสชันอยู่บนโฮสต์ระยะไกล; “การตรวจไฟล์บน Mac เครื่องของคุณ” จะไม่สะท้อนสิ่งที่ Gateway ใช้งานอยู่

---

## ชั้นการคงอยู่สองชั้น

OpenClaw คงอยู่เซสชันในสองชั้น:

1. **ที่เก็บเซสชัน (`sessions.json`)**
   - แผนที่คีย์/ค่า: `sessionKey -> SessionEntry`
   - เล็ก เปลี่ยนแปลงได้ แก้ไขได้อย่างปลอดภัย (หรือลบรายการได้)
   - ติดตามเมทาดาทาของเซสชัน (รหัสเซสชันปัจจุบัน กิจกรรมล่าสุด ตัวสลับ ตัวนับโทเค็น เป็นต้น)

2. **ทรานสคริปต์ (`<sessionId>.jsonl`)**
   - ทรานสคริปต์แบบผนวกท้ายอย่างเดียวพร้อมโครงสร้างแบบต้นไม้ (รายการมี `id` + `parentId`)
   - เก็บบทสนทนาจริง + การเรียกเครื่องมือ + สรุป Compaction
   - ใช้สร้างบริบทโมเดลใหม่สำหรับเทิร์นในอนาคต
   - ข้ามเช็กพอยต์ดีบักขนาดใหญ่ก่อน Compaction เมื่อทรานสคริปต์ที่ใช้งานอยู่
     เกินขีดจำกัดขนาดเช็กพอยต์ เพื่อหลีกเลี่ยงการสร้างสำเนา `.checkpoint.*.jsonl`
     ขนาดยักษ์อีกชุด

ตัวอ่านประวัติของ Gateway ควรหลีกเลี่ยงการสร้างทรานสคริปต์ทั้งชุดในหน่วยความจำ เว้นแต่
พื้นผิวนั้นต้องการเข้าถึงประวัติใดๆ ได้โดยตรงอย่างชัดเจน ประวัติหน้าแรก,
ประวัติแชตแบบฝัง, การกู้คืนหลังรีสตาร์ต และการตรวจโทเค็น/การใช้งาน ใช้การอ่านส่วนท้ายแบบมีขอบเขต
การสแกนทรานสคริปต์แบบเต็มจะผ่านดัชนีทรานสคริปต์แบบอะซิงโครนัส ซึ่ง
แคชตามเส้นทางไฟล์ร่วมกับ `mtimeMs`/`size` และแชร์ระหว่างตัวอ่านที่ทำงานพร้อมกัน

---

## ตำแหน่งบนดิสก์

ต่อเอเจนต์ บนโฮสต์ Gateway:

- ที่เก็บ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- ทรานสคริปต์: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw แก้ค่าเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษาที่เก็บและการควบคุมดิสก์

การคงอยู่ของเซสชันมีการควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json`, อาร์ติแฟกต์ทรานสคริปต์ และไฟล์เสริม trajectory:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: อายุสูงสุดของรายการเก่า (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวนรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- `resetArchiveRetention`: ระยะเวลาเก็บรักษาอาร์ไคฟ์ทรานสคริปต์ `*.reset.<timestamp>` (ค่าเริ่มต้น: เหมือน `pruneAfter`; `false` ปิดการล้าง)
- `maxDiskBytes`: งบประมาณไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังล้างข้อมูล (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

การเขียนของ Gateway ตามปกติจะรวมการล้าง `maxEntries` เป็นชุดสำหรับขีดจำกัดขนาดระดับโปรดักชัน ดังนั้นที่เก็บอาจเกินขีดจำกัดที่กำหนดไว้ชั่วครู่ก่อนที่การล้างระดับน้ำสูงครั้งถัดไปจะเขียนให้ลดลงอีกครั้ง การอ่านที่เก็บเซสชันจะไม่ตัดแต่งหรือจำกัดรายการระหว่างการเริ่มต้น Gateway; ใช้การเขียนหรือ `openclaw sessions cleanup --enforce` เพื่อล้างข้อมูล `openclaw sessions cleanup --enforce` ยังคงใช้ขีดจำกัดที่กำหนดไว้ทันที

การบำรุงรักษาจะเก็บตัวชี้บทสนทนาภายนอกที่คงทน เช่น เซสชันกลุ่ม
และเซสชันแชตที่จำกัดตามเธรด แต่รายการรันไทม์สังเคราะห์สำหรับ cron, hooks,
heartbeat, ACP และเอเจนต์ย่อยยังคงถูกนำออกได้เมื่อเกิน
อายุ จำนวน หรืองบประมาณดิสก์ที่กำหนดค่าไว้

OpenClaw จะไม่สร้างแบ็กอัปหมุนเวียน `sessions.json.bak.*` อัตโนมัติระหว่างการเขียนของ Gateway อีกต่อไป คีย์เดิม `session.maintenance.rotateBytes` จะถูกละเว้น และ `openclaw doctor --fix` จะลบคีย์นี้ออกจากคอนฟิกเก่า

ลำดับการบังคับใช้สำหรับการล้างงบประมาณดิสก์ (`mode: "enforce"`):

1. นำอาร์ติแฟกต์ที่เก็บถาวรเก่าสุด, ทรานสคริปต์กำพร้า หรือ trajectory กำพร้าออกก่อน
2. ถ้ายังสูงกว่าเป้าหมาย ให้ขับรายการเซสชันเก่าสุดและไฟล์ทรานสคริปต์/trajectory ของรายการนั้นออก
3. ทำต่อจนกว่าการใช้งานจะเท่ากับหรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการขับออกที่อาจเกิดขึ้น แต่จะไม่เปลี่ยนแปลงที่เก็บ/ไฟล์

รันการบำรุงรักษาเมื่อต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และบันทึกการรัน

การรัน cron แบบแยกยังสร้างรายการเซสชัน/ทรานสคริปต์ด้วย และมีการควบคุมการเก็บรักษาเฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ตัดแต่งเซสชันการรัน cron แบบแยกเก่าออกจากที่เก็บเซสชัน (`false` ปิดใช้งาน)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` ตัดแต่งไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` ไบต์ และ `2000` บรรทัด)

เมื่อ cron บังคับสร้างเซสชันการรันแบบแยกใหม่ จะทำความสะอาดรายการเซสชัน
`cron:<jobId>` ก่อนหน้าก่อนเขียนแถวใหม่ โดยนำการตั้งค่าที่ปลอดภัย
เช่น การตั้งค่า thinking/fast/verbose, ป้ายกำกับ และการแทนที่โมเดล/โปรไฟล์ auth
ที่ผู้ใช้เลือกไว้อย่างชัดเจนติดไปด้วย และทิ้งบริบทบทสนทนาแวดล้อม เช่น
การกำหนดเส้นทางช่อง/กลุ่ม, นโยบายการส่งหรือคิว, การยกระดับ, ต้นทาง และการผูก
รันไทม์ ACP เพื่อให้การรันแบบแยกใหม่ไม่สืบทอดการส่งมอบเก่าหรือ
อำนาจรันไทม์จากการรันเก่า

---

## คีย์เซสชัน (`sessionKey`)

`sessionKey` ระบุว่า _คุณอยู่ในบัคเก็ตบทสนทนาใด_ (การกำหนดเส้นทาง + การแยก)

รูปแบบทั่วไป:

- แชตหลัก/โดยตรง (ต่อเอเจนต์): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/ช่อง (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่ถูกแทนที่)

กฎมาตรฐานมีเอกสารที่ [/concepts/session](/th/concepts/session)

---

## รหัสเซสชัน (`sessionId`)

`sessionKey` แต่ละรายการชี้ไปที่ `sessionId` ปัจจุบัน (ไฟล์ทรานสคริปต์ที่ดำเนินบทสนทนาต่อ)

กฎโดยทั่วไป:

- **รีเซ็ต** (`/new`, `/reset`) สร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **รีเซ็ตรายวัน** (ค่าเริ่มต้น 4:00 AM ตามเวลาท้องถิ่นบนโฮสต์ gateway) สร้าง `sessionId` ใหม่ในข้อความถัดไปหลังขอบเขตการรีเซ็ต
- **หมดอายุเมื่อไม่ได้ใช้งาน** (`session.reset.idleMinutes` หรือเดิม `session.idleMinutes`) สร้าง `sessionId` ใหม่เมื่อมีข้อความมาถึงหลังหน้าต่างว่างงาน เมื่อกำหนดค่าทั้งรายวัน + ว่างงาน รายการใดหมดอายุก่อนจะมีผลก่อน
- **เหตุการณ์ระบบ** (heartbeat, การปลุก cron, การแจ้งเตือน exec, งานบันทึกสถานะของ gateway) อาจเปลี่ยนแถวเซสชัน แต่ไม่ขยายความสดของการรีเซ็ตรายวัน/ว่างงาน การเปลี่ยนรอบรีเซ็ตจะทิ้งประกาศเหตุการณ์ระบบที่เข้าคิวไว้สำหรับเซสชันก่อนหน้า ก่อนสร้างพรอมป์ใหม่
- **นโยบาย parent fork** ใช้สาขาที่ใช้งานอยู่ของ PI เมื่อสร้างเธรดหรือ fork เอเจนต์ย่อย ถ้าสาขานั้นใหญ่เกินไป OpenClaw จะเริ่มลูกด้วยบริบทแบบแยกแทนการล้มเหลวหรือสืบทอดประวัติที่ใช้งานไม่ได้ นโยบายการวัดขนาดเป็นอัตโนมัติ; คอนฟิกเดิม `session.parentForkMaxTokens` ถูกลบโดย `openclaw doctor --fix`

รายละเอียดการใช้งาน: การตัดสินใจเกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## สคีมาที่เก็บเซสชัน (`sessions.json`)

ชนิดค่าของที่เก็บคือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: รหัสทรานสคริปต์ปัจจุบัน (ชื่อไฟล์ได้มาจากค่านี้ เว้นแต่ตั้งค่า `sessionFile`)
- `sessionStartedAt`: เวลาประทับเริ่มต้นสำหรับ `sessionId` ปัจจุบัน; ความสดของการรีเซ็ตรายวัน
  ใช้ค่านี้ แถวเดิมอาจได้ค่ามาจากส่วนหัวเซสชัน JSONL
- `lastInteractionAt`: เวลาประทับของการโต้ตอบจริงล่าสุดจากผู้ใช้/ช่อง; ความสดของการรีเซ็ตเมื่อไม่ได้ใช้งาน
  ใช้ค่านี้เพื่อให้ heartbeat, cron และเหตุการณ์ exec ไม่ทำให้เซสชัน
  ยังมีชีวิตอยู่ แถวเดิมที่ไม่มีฟิลด์นี้จะ fallback ไปใช้เวลาเริ่มต้นเซสชันที่กู้คืนมา
  สำหรับความสดเมื่อไม่ได้ใช้งาน
- `updatedAt`: เวลาประทับการเปลี่ยนแปลงแถวที่เก็บล่าสุด ใช้สำหรับการแสดงรายการ การตัดแต่ง และ
  งานบันทึกสถานะ ไม่ใช่แหล่งอำนาจสำหรับความสดของการรีเซ็ตรายวัน/ว่างงาน
- `sessionFile`: การแทนที่เส้นทางทรานสคริปต์แบบชัดเจนที่ไม่บังคับ
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายการส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: เมทาดาทาสำหรับการติดป้ายกำกับกลุ่ม/ช่อง
- ตัวสลับ:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (การแทนที่ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (ดีที่สุดเท่าที่ทำได้ / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: จำนวนครั้งที่ auto-compaction เสร็จสมบูรณ์สำหรับคีย์เซสชันนี้
- `memoryFlushAt`: เวลาประทับสำหรับการ flush หน่วยความจำก่อน Compaction ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction เมื่อการ flush ครั้งล่าสุดรัน

ที่เก็บแก้ไขได้อย่างปลอดภัย แต่ Gateway คือแหล่งอำนาจ: อาจเขียนใหม่หรือคืนสภาพรายการเมื่อเซสชันรัน

---

## โครงสร้างทรานสคริปต์ (`*.jsonl`)

ทรานสคริปต์จัดการโดย `SessionManager` ของ `@mariozechner/pi-coding-agent`

ไฟล์เป็น JSONL:

- บรรทัดแรก: ส่วนหัวเซสชัน (`type: "session"`, มี `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- จากนั้น: รายการเซสชันที่มี `id` + `parentId` (ต้นไม้)

ชนิดรายการที่สำคัญ:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension แทรกซึ่ง _เข้าสู่_ บริบทโมเดล (สามารถซ่อนจาก UI ได้)
- `custom`: สถานะ extension ที่ _ไม่เข้าสู่_ บริบทโมเดล
- `compaction`: สรุป Compaction ที่คงอยู่พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่คงอยู่เมื่อนำทางสาขาต้นไม้

OpenClaw ตั้งใจที่จะ **ไม่** “แก้ไข” ทรานสคริปต์; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียนทรานสคริปต์

---

## หน้าต่างบริบทเทียบกับโทเค็นที่ติดตาม

แนวคิดสองอย่างที่สำคัญ:

1. **หน้าต่างบริบทของโมเดล**: ขีดจำกัดแข็งต่อโมเดล (โทเค็นที่โมเดลมองเห็นได้)
2. **ตัวนับที่เก็บเซสชัน**: สถิติแบบเลื่อนที่เขียนลงใน `sessions.json` (ใช้สำหรับ /status และแดชบอร์ด)

ถ้าคุณกำลังปรับขีดจำกัด:

- หน้าต่างบริบทมาจากแคตตาล็อกโมเดล (และสามารถแทนที่ผ่านคอนฟิกได้)
- `contextTokens` ในที่เก็บเป็นค่าประมาณ/ค่ารายงานตอนรันไทม์; อย่าถือเป็นการรับประกันแบบเข้มงวด

ดูเพิ่มเติมที่ [/token-use](/th/reference/token-use)

---

## Compaction: คืออะไร

Compaction สรุปบทสนทนาเก่าเป็นรายการ `compaction` ที่คงอยู่ในทรานสคริปต์ และคงข้อความล่าสุดไว้ครบถ้วน

หลัง Compaction เทิร์นในอนาคตจะเห็น:

- สรุป Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction **คงอยู่ถาวร** (ต่างจากการตัดแต่งเซสชัน) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขตชังก์ Compaction และการจับคู่เครื่องมือ

เมื่อ OpenClaw แบ่งทรานสคริปต์ยาวเป็นชังก์ Compaction จะเก็บ
การเรียกเครื่องมือของ assistant ให้จับคู่กับรายการ `toolResult` ที่ตรงกัน

- ถ้าการแบ่งตามสัดส่วนโทเค็นตกอยู่ระหว่างการเรียกเครื่องมือกับผลลัพธ์ของมัน OpenClaw
  จะเลื่อนขอบเขตไปที่ข้อความการเรียกเครื่องมือของ assistant แทนการแยก
  คู่นั้นออกจากกัน
- ถ้าบล็อก tool-result ท้ายสุดอาจทำให้ชังก์เกินเป้าหมาย OpenClaw
  จะคงบล็อกเครื่องมือที่ค้างอยู่นั้นไว้ และคงส่วนท้ายที่ยังไม่ได้สรุป
  ไว้อย่างครบถ้วน
- บล็อกการเรียกเครื่องมือที่ถูกยกเลิก/มีข้อผิดพลาดจะไม่ทำให้การแบ่งที่ค้างอยู่ยังเปิดค้างไว้

---

## เมื่อ auto-compaction เกิดขึ้น (รันไทม์ Pi)

ในเอเจนต์ Pi แบบฝัง auto-compaction จะทริกเกอร์ในสองกรณี:

1. **การกู้คืนจากโอเวอร์โฟลว์**: โมเดลส่งกลับข้อผิดพลาด context overflow
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และรูปแบบที่คล้ายกันจากผู้ให้บริการ) → compact → ลองใหม่
2. **การบำรุงรักษาเกณฑ์**: หลังจาก turn สำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือ context window ของโมเดล
- `reserveTokens` คือพื้นที่เผื่อที่สำรองไว้สำหรับ prompt + เอาต์พุตโมเดลถัดไป

นี่คือ runtime semantics ของ Pi (OpenClaw ใช้ event เหล่านี้ แต่ Pi เป็นผู้ตัดสินใจว่าจะ compact เมื่อใด)

OpenClaw ยังสามารถทริกเกอร์ local compaction แบบ preflight ก่อนเปิด run ถัดไปได้ด้วย
เมื่อมีการตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` และไฟล์
active transcript มีขนาดถึงค่านั้น นี่เป็นตัวป้องกันขนาดไฟล์สำหรับต้นทุนการ
reopen ภายในเครื่อง ไม่ใช่การเก็บถาวรแบบดิบ: OpenClaw ยังคงเรียกใช้ semantic compaction
ตามปกติ และต้องใช้ `truncateAfterCompaction` เพื่อให้สรุปที่ถูก compact แล้วกลายเป็น
transcript สืบทอดชุดใหม่ได้

สำหรับ embedded Pi runs, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
จะเพิ่มตัวป้องกัน tool-loop แบบเลือกเปิดใช้ หลังจาก append ผลลัพธ์ของเครื่องมือและก่อน
การเรียกโมเดลครั้งถัดไป OpenClaw จะประมาณแรงกดดันของ prompt โดยใช้ตรรกะงบประมาณ preflight
เดียวกับที่ใช้ตอนเริ่ม turn หาก context ไม่พออีกต่อไป ตัวป้องกันจะไม่ compact ภายใน hook
`transformContext` ของ Pi แต่จะส่งสัญญาณ mid-turn precheck แบบมีโครงสร้าง หยุดการส่ง prompt
ปัจจุบัน และให้ outer run loop ใช้เส้นทางกู้คืนที่มีอยู่: ตัดผลลัพธ์เครื่องมือที่ใหญ่เกิน
เมื่อเพียงพอ หรือทริกเกอร์โหมด Compaction ที่กำหนดค่าไว้แล้วลองใหม่ ตัวเลือกนี้ปิดไว้โดย
ค่าเริ่มต้น และทำงานได้ทั้งกับโหมด Compaction `default` และ `safeguard` รวมถึง safeguard
compaction ที่มีผู้ให้บริการรองรับ
สิ่งนี้แยกจาก `maxActiveTranscriptBytes`: ตัวป้องกันขนาด byte จะทำงานก่อนเปิด turn
ส่วน mid-turn precheck จะทำงานภายหลังใน tool loop ของ embedded Pi หลังจาก append ผลลัพธ์
เครื่องมือใหม่แล้ว

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

OpenClaw ยังบังคับใช้ค่าขั้นต่ำด้านความปลอดภัยสำหรับ embedded runs ด้วย:

- หาก `compaction.reserveTokens < reserveTokensFloor`, OpenClaw จะเพิ่มค่านั้น
- ค่า floor เริ่มต้นคือ `20000` tokens
- ตั้งค่า `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิดใช้งาน floor
- หากค่านั้นสูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม
- `/compact` แบบ manual จะเคารพ `agents.defaults.compaction.keepRecentTokens`
  ที่ระบุไว้อย่างชัดเจน และคงจุดตัด recent-tail ของ Pi ไว้ หากไม่มีงบประมาณ keep ที่ชัดเจน
  manual compaction จะยังคงเป็น checkpoint แบบแข็ง และ context ที่สร้างใหม่จะเริ่มจาก
  สรุปใหม่
- ตั้งค่า `agents.defaults.compaction.midTurnPrecheck.enabled: true` เพื่อเรียกใช้
  tool-loop precheck ทางเลือกหลังผลลัพธ์เครื่องมือใหม่และก่อนการเรียกโมเดลถัดไป
  นี่เป็นเพียง trigger เท่านั้น; การสร้างสรุปยังคงใช้เส้นทาง Compaction ที่กำหนดค่าไว้
  สิ่งนี้แยกจาก `maxActiveTranscriptBytes` ซึ่งเป็นตัวป้องกันขนาด byte ของ active-transcript
  ตอนเริ่ม turn
- ตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` เป็นค่า byte หรือ
  string เช่น `"20mb"` เพื่อเรียกใช้ local compaction ก่อน turn เมื่อ active transcript
  มีขนาดใหญ่ ตัวป้องกันนี้จะทำงานเฉพาะเมื่อเปิดใช้ `truncateAfterCompaction` ด้วยเท่านั้น
  ปล่อยไว้ไม่ตั้งค่าหรือตั้งเป็น `0` เพื่อปิดใช้งาน
- เมื่อเปิดใช้ `agents.defaults.compaction.truncateAfterCompaction`,
  OpenClaw จะหมุน active transcript ไปเป็น JSONL สืบทอดที่ถูก compact แล้วหลัง
  Compaction transcript ฉบับเต็มเดิมจะยังคงถูกเก็บถาวรและเชื่อมโยงจาก
  checkpoint ของ Compaction แทนที่จะถูกเขียนทับในที่เดิม

เหตุผล: เว้นพื้นที่เผื่อให้มากพอสำหรับ “งานดูแลระบบ” หลาย turn (เช่น การเขียน memory) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

การติดตั้งใช้งาน: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(ถูกเรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## ผู้ให้บริการ Compaction แบบเสียบเปลี่ยนได้

Plugin สามารถลงทะเบียนผู้ให้บริการ Compaction ผ่าน `registerCompactionProvider()` บน plugin API ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งเป็น provider id ที่ลงทะเบียนไว้ safeguard extension จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline `summarizeInStages` ในตัว

- `provider`: id ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ ปล่อยไว้ไม่ตั้งค่าสำหรับการสรุปด้วย LLM เริ่มต้น
- การตั้งค่า `provider` จะบังคับ `mode: "safeguard"`
- ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการรักษา identifier เหมือนกับเส้นทางในตัว
- safeguard จะยังคงรักษา context ของ recent-turn และ split-turn suffix หลังเอาต์พุตจากผู้ให้บริการ
- การสรุป safeguard ในตัวจะ re-distill สรุปก่อนหน้าพร้อมข้อความใหม่
  แทนการรักษาสรุปก่อนหน้าทั้งหมดไว้ตามตัวอักษร
- โหมด safeguard เปิดใช้การตรวจสอบคุณภาพสรุปโดยค่าเริ่มต้น; ตั้งค่า
  `qualityGuard.enabled: false` เพื่อข้ามพฤติกรรมลองใหม่เมื่อเอาต์พุตมีรูปแบบผิด
- หากผู้ให้บริการล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะ fallback กลับไปใช้การสรุปด้วย LLM ในตัวโดยอัตโนมัติ
- สัญญาณ abort/timeout จะถูก throw ซ้ำ (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกของ caller

แหล่งที่มา: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็น

คุณสามารถสังเกต Compaction และสถานะ session ได้ผ่าน:

- `/status` (ใน chat session ใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- โหมดละเอียด: `🧹 Auto-compaction complete` + จำนวน Compaction

---

## งานดูแลระบบแบบเงียบ (`NO_REPLY`)

OpenClaw รองรับ turn แบบ “เงียบ” สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ข้อตกลง:

- ผู้ช่วยเริ่มเอาต์พุตด้วย silent token ตรงตัว `NO_REPLY` /
  `no_reply` เพื่อระบุว่า “อย่าส่งคำตอบให้ผู้ใช้”
- OpenClaw จะลบ/ระงับสิ่งนี้ใน delivery layer
- การระงับ silent-token ที่ตรงตัวไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` จึงนับทั้งคู่เมื่อ payload ทั้งหมดเป็นเพียง silent token
- สิ่งนี้มีไว้สำหรับ turn เบื้องหลัง/ไม่ส่งมอบอย่างแท้จริงเท่านั้น; ไม่ใช่ทางลัดสำหรับ
  คำขอปกติของผู้ใช้ที่ต้องดำเนินการ

ตั้งแต่ `2026.1.10` เป็นต้นมา OpenClaw ยังระงับ **draft/typing streaming** เมื่อ
chunk บางส่วนเริ่มต้นด้วย `NO_REPLY` ดังนั้นการทำงานแบบเงียบจะไม่รั่วเอาต์พุตบางส่วน
ระหว่าง turn

---

## "memory flush" ก่อน Compaction (ติดตั้งใช้งานแล้ว)

เป้าหมาย: ก่อนเกิด auto-compaction ให้เรียกใช้ agentic turn แบบเงียบที่เขียนสถานะถาวร
ลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ใน agent workspace) เพื่อให้ Compaction ไม่สามารถ
ลบบริบทสำคัญได้

OpenClaw ใช้แนวทาง **pre-threshold flush**:

1. ตรวจสอบการใช้ context ของ session
2. เมื่อเกิน “soft threshold” (ต่ำกว่าเกณฑ์ Compaction ของ Pi) ให้เรียกใช้คำสั่งแบบเงียบ
   “write memory now” กับ agent
3. ใช้ silent token ตรงตัว `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้ไม่เห็น
   อะไรเลย

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `model` (การ override ผู้ให้บริการ/โมเดลที่ตรงตัวสำหรับ flush turn แบบไม่บังคับ เช่น `ollama/qwen3:8b`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับ flush turn)
- `systemPrompt` (system prompt เพิ่มเติมที่ append สำหรับ flush turn)

หมายเหตุ:

- prompt/system prompt เริ่มต้นมี hint `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- เมื่อกำหนด `model` แล้ว flush turn จะใช้โมเดลนั้นโดยไม่สืบทอด
  fallback chain ของ active session ดังนั้นงานดูแลระบบแบบ local-only จะไม่
  fallback ไปยังโมเดลสนทนาแบบชำระเงินอย่างเงียบๆ
- flush จะทำงานหนึ่งครั้งต่อรอบ Compaction (ติดตามใน `sessions.json`)
- flush จะทำงานเฉพาะกับ embedded Pi sessions (CLI backends จะข้าม)
- flush จะถูกข้ามเมื่อ session workspace เป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [Memory](/th/concepts/memory) สำหรับ layout ไฟล์ workspace และรูปแบบการเขียน

Pi ยังเปิดเผย hook `session_before_compact` ใน extension API ด้วย แต่ตรรกะ flush ของ OpenClaw
อยู่ฝั่ง Gateway ในปัจจุบัน

---

## เช็กลิสต์การแก้ไขปัญหา

- Session key ผิดหรือไม่? เริ่มที่ [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- Store กับ transcript ไม่ตรงกันหรือไม่? ยืนยัน host ของ Gateway และ path ของ store จาก `openclaw status`
- Compaction spam หรือไม่? ตรวจสอบ:
  - context window ของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` สูงเกินไปสำหรับ window ของโมเดลอาจทำให้ Compaction เกิดเร็วขึ้น)
  - tool-result bloat: เปิดใช้/ปรับแต่ง session pruning
- Silent turns รั่วหรือไม่? ยืนยันว่าคำตอบเริ่มด้วย `NO_REPLY` (token ตรงตัวแบบไม่คำนึงถึงตัวพิมพ์เล็กใหญ่) และคุณอยู่บน build ที่รวม streaming suppression fix แล้ว

## ที่เกี่ยวข้อง

- [การจัดการ session](/th/concepts/session)
- [Session pruning](/th/concepts/session-pruning)
- [Context engine](/th/concepts/context-engine)
