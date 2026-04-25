---
read_when:
    - คุณต้องดีบัก session ids, JSONL ของทรานสคริปต์ หรือฟิลด์ใน sessions.json
    - คุณกำลังเปลี่ยนพฤติกรรม Compaction อัตโนมัติ หรือเพิ่มงาน housekeeping “ก่อน Compaction”
    - คุณต้องการใช้งานการ flush หน่วยความจำหรือ silent system turns
summary: 'เจาะลึก: session store + ทรานสคริปต์, วงจรชีวิต และโครงสร้างภายในของ Compaction (รวมถึงอัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-04-25T13:58:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

หน้านี้อธิบายวิธีที่ OpenClaw จัดการเซสชันแบบครบวงจร:

- **การกำหนดเส้นทางเซสชัน** (ข้อความขาเข้า map ไปยัง `sessionKey` อย่างไร)
- **Session store** (`sessions.json`) และสิ่งที่มันติดตาม
- **การคงอยู่ของทรานสคริปต์** (`*.jsonl`) และโครงสร้างของมัน
- **Transcript hygiene** (การปรับแก้เฉพาะ provider ก่อนการรัน)
- **ขีดจำกัดบริบท** (context window เทียบกับโทเค็นที่ติดตาม)
- **Compaction** (Compaction แบบ manual + auto-compaction) และตำแหน่งสำหรับ hook งานก่อน Compaction
- **งาน housekeeping แบบเงียบ** (เช่น การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

หากคุณต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

- [Session management](/th/concepts/session)
- [Compaction](/th/concepts/compaction)
- [Memory overview](/th/concepts/memory)
- [Memory search](/th/concepts/memory-search)
- [Session pruning](/th/concepts/session-pruning)
- [Transcript hygiene](/th/reference/transcript-hygiene)

---

## แหล่งข้อมูลจริง: Gateway

OpenClaw ถูกออกแบบให้มี **โปรเซส Gateway เดียว** ที่เป็นเจ้าของสถานะของเซสชัน

- UI ต่าง ๆ (แอป macOS, เว็บ Control UI, TUI) ควร query Gateway เพื่อดูรายการเซสชันและจำนวนโทเค็น
- ในโหมด remote ไฟล์เซสชันจะอยู่บนโฮสต์ปลายทาง ดังนั้น “การตรวจดูไฟล์บน Mac ในเครื่องของคุณ” จะไม่สะท้อนสิ่งที่ Gateway กำลังใช้อยู่

---

## ชั้นการคงอยู่สองชั้น

OpenClaw คงข้อมูลเซสชันไว้สองชั้น:

1. **Session store (`sessions.json`)**
   - แผนที่คีย์/ค่า: `sessionKey -> SessionEntry`
   - ขนาดเล็ก, เปลี่ยนแปลงได้, แก้ไขได้อย่างปลอดภัย (หรือลบ entries ก็ได้)
   - ติดตามเมทาดาทาของเซสชัน (session id ปัจจุบัน, กิจกรรมล่าสุด, toggles, ตัวนับโทเค็น ฯลฯ)

2. **ทรานสคริปต์ (`<sessionId>.jsonl`)**
   - ทรานสคริปต์แบบ append-only ที่มีโครงสร้างเป็นต้นไม้ (entries มี `id` + `parentId`)
   - เก็บบทสนทนาจริง + การเรียก tool + สรุปจาก Compaction
   - ใช้สร้างบริบทของโมเดลขึ้นใหม่สำหรับ turns ในอนาคต

---

## ตำแหน่งบนดิสก์

ต่อ agent, บนโฮสต์ของ Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- ทรานสคริปต์: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve สิ่งเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การดูแล store และการควบคุมบนดิสก์

การคงอยู่ของเซสชันมีตัวควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json` และ artifact ของทรานสคริปต์:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: ค่าตัดอายุของ entries ที่ stale (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวน entries ใน `sessions.json` (ค่าเริ่มต้น `500`)
- `rotateBytes`: rotate `sessions.json` เมื่อมีขนาดใหญ่เกินไป (ค่าเริ่มต้น `10mb`)
- `resetArchiveRetention`: ระยะเวลาเก็บ archive ของทรานสคริปต์ `*.reset.<timestamp>` (ค่าเริ่มต้น: เท่ากับ `pruneAfter`; `false` จะปิดการล้างข้อมูล)
- `maxDiskBytes`: budget ของไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายหลัง cleanup แบบไม่บังคับ (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

ลำดับการบังคับใช้สำหรับ cleanup ตาม budget ของดิสก์ (`mode: "enforce"`):

1. ลบ artifact ของทรานสคริปต์แบบ archived หรือ orphan ที่เก่าที่สุดก่อน
2. หากยังเกินเป้าหมาย ให้ไล่ลบ session entries ที่เก่าที่สุดและไฟล์ทรานสคริปต์ของมัน
3. ทำต่อไปจนการใช้งานอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการไล่ลบที่อาจเกิดขึ้น แต่จะไม่แก้ไข store/ไฟล์

รัน maintenance ตามต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และบันทึกการรัน

การรัน Cron แบบแยกอิสระก็สร้าง session entries/ทรานสคริปต์ด้วย และมีตัวควบคุม retention เฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะ prune เซสชันการรัน Cron แบบแยกอิสระเก่าออกจาก session store (`false` จะปิด)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะ prune ไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` ไบต์ และ `2000` บรรทัด)

เมื่อ Cron บังคับสร้างเซสชันการรันแบบแยกอิสระใหม่ มันจะ sanitize
`cron:<jobId>` session entry ก่อนหน้าก่อนเขียนแถวใหม่ มันจะคง
ค่ากำหนดที่ปลอดภัย เช่น การตั้งค่า thinking/fast/verbose, labels และ model/auth overrides
ที่ผู้ใช้เลือกไว้อย่างชัดเจน มันจะลบบริบทบทสนทนารอบข้าง เช่น
การกำหนดเส้นทาง channel/group, นโยบายการส่งหรือเข้าคิว, elevation, origin และการผูก runtime ของ ACP
เพื่อให้การรันแบบแยกอิสระครั้งใหม่ไม่สามารถสืบทอดอำนาจการส่งมอบหรือ
อำนาจรันไทม์ที่ stale จากการรันเก่าได้

---

## Session keys (`sessionKey`)

`sessionKey` ระบุว่าคุณอยู่ใน _bucket ของบทสนทนาใด_ (การกำหนดเส้นทาง + การแยกจากกัน)

รูปแบบที่พบบ่อย:

- แชตหลัก/แชตตรง (ต่อ agent): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/แชนเนล (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่จะ override)

กฎ canonical ถูกบันทึกไว้ที่ [/concepts/session](/th/concepts/session)

---

## Session ids (`sessionId`)

แต่ละ `sessionKey` จะชี้ไปยัง `sessionId` ปัจจุบัน (ไฟล์ทรานสคริปต์ที่ใช้ต่อบทสนทนา)

กฎคร่าว ๆ:

- **Reset** (`/new`, `/reset`) จะสร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **Daily reset** (ค่าเริ่มต้น 4:00 AM ตามเวลาท้องถิ่นบนโฮสต์ gateway) จะสร้าง `sessionId` ใหม่เมื่อมีข้อความถัดไปหลังผ่านขอบเขตเวลาการรีเซ็ต
- **Idle expiry** (`session.reset.idleMinutes` หรือแบบเดิม `session.idleMinutes`) จะสร้าง `sessionId` ใหม่เมื่อมีข้อความเข้ามาหลังพ้นช่วง idle หากกำหนดทั้ง daily + idle ระบบจะใช้ตัวที่หมดอายุก่อน
- **Thread parent fork guard** (`session.parentForkMaxTokens`, ค่าเริ่มต้น `100000`) จะข้ามการ fork ทรานสคริปต์ของ parent เมื่อเซสชัน parent มีขนาดใหญ่เกินไปอยู่แล้ว thread ใหม่จะเริ่มต้นแบบสดใหม่ ตั้งค่า `0` เพื่อปิด

รายละเอียดการทำงาน: การตัดสินใจนี้เกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## สคีมาของ session store (`sessions.json`)

ชนิดค่าของ store คือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: id ของทรานสคริปต์ปัจจุบัน (ชื่อไฟล์จะ derive จากค่านี้ เว้นแต่จะตั้ง `sessionFile`)
- `updatedAt`: เวลาประทับกิจกรรมล่าสุด
- `sessionFile`: override พาธทรานสคริปต์แบบชัดเจนเพิ่มเติม
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายการส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: เมทาดาทาสำหรับการติดป้ายชื่อกลุ่ม/แชนเนล
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ระดับเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (best-effort / ขึ้นอยู่กับ provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: จำนวนครั้งที่ auto-compaction เสร็จสมบูรณ์สำหรับ session key นี้
- `memoryFlushAt`: เวลาประทับของการ flush หน่วยความจำก่อน Compaction ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction ตอนที่มีการ flush ล่าสุด

store สามารถแก้ไขได้อย่างปลอดภัย แต่ Gateway คือผู้มีอำนาจหลัก: มันอาจเขียนทับหรือ rehydrate entries ขณะเซสชันทำงาน

---

## โครงสร้างของทรานสคริปต์ (`*.jsonl`)

ทรานสคริปต์ถูกจัดการโดย `@mariozechner/pi-coding-agent` ผ่าน `SessionManager`

ไฟล์เป็นรูปแบบ JSONL:

- บรรทัดแรก: ส่วนหัวของเซสชัน (`type: "session"` รวม `id`, `cwd`, `timestamp`, และ `parentSession` แบบไม่บังคับ)
- ต่อจากนั้น: session entries ที่มี `id` + `parentId` (โครงสร้างต้นไม้)

ประเภท entry ที่น่าสนใจ:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension inject เข้าไปและ _เข้าสู่บริบทของโมเดล_ (สามารถซ่อนจาก UI ได้)
- `custom`: สถานะของ extension ที่ _ไม่_ เข้าสู่บริบทของโมเดล
- `compaction`: สรุปจาก Compaction ที่ถูกคงไว้ พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่ถูกคงไว้เมื่อมีการนำทางกิ่งของต้นไม้

OpenClaw ตั้งใจ **ไม่** “ปรับแก้” ทรานสคริปต์เอง; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียนมัน

---

## Context windows เทียบกับ tracked tokens

มีสองแนวคิดที่สำคัญ:

1. **Model context window**: เพดานตายตัวต่อโมเดล (โทเค็นที่โมเดลมองเห็นได้)
2. **ตัวนับใน session store**: สถิติแบบ rolling ที่เขียนลงใน `sessions.json` (ใช้สำหรับ /status และแดชบอร์ด)

หากคุณกำลังปรับแต่งขีดจำกัด:

- context window มาจาก model catalog (และ override ได้ผ่าน config)
- `contextTokens` ใน store เป็นค่า estimate/reporting ระหว่างรันไทม์; อย่าถือว่าเป็นการรับประกันที่เข้มงวด

ดูเพิ่มเติมที่ [/token-use](/th/reference/token-use)

---

## Compaction: มันคืออะไร

Compaction จะสรุปบทสนทนาเก่าลงเป็น entry `compaction` ที่คงอยู่ในทรานสคริปต์ และเก็บข้อความล่าสุดไว้ตามเดิม

หลังจาก Compaction turns ในอนาคตจะเห็น:

- สรุปจาก Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction เป็นแบบ **persistent** (ต่างจาก session pruning) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขต chunk ของ Compaction และการจับคู่ tools

เมื่อ OpenClaw แบ่งทรานสคริปต์ยาวออกเป็น chunk สำหรับ Compaction มันจะคง
assistant tool calls ให้จับคู่กับ entries `toolResult` ที่ตรงกัน

- หากจุดแบ่งตามสัดส่วนโทเค็นไปตกอยู่ระหว่าง tool call กับผลลัพธ์ OpenClaw
  จะเลื่อนขอบเขตกลับไปที่ข้อความ assistant tool-call แทนที่จะแยกคู่นั้นออกจากกัน
- หากบล็อก tool-result ตอนท้ายจะทำให้ chunk เกินเป้าหมาย OpenClaw
  จะคงบล็อก tool ที่ยังค้างอยู่นั้นไว้ และเก็บส่วนท้ายที่ยังไม่ถูกสรุปให้คงเดิม
- บล็อก tool-call ที่ถูกยกเลิก/เกิดข้อผิดพลาด จะไม่ทำให้การแบ่งที่รออยู่ถูกค้างไว้

---

## Auto-compaction เกิดขึ้นเมื่อใด (Pi runtime)

ใน Pi agent แบบฝังตัว auto-compaction จะทำงานในสองกรณี:

1. **การกู้คืนจาก overflow**: โมเดลส่งคืนข้อผิดพลาดว่า context overflow
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และรูปแบบคล้ายกันตาม provider) → compact → retry
2. **การบำรุงรักษาตาม threshold**: หลังจาก turn สำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือ context window ของโมเดล
- `reserveTokens` คือ headroom ที่สงวนไว้สำหรับ prompts + เอาต์พุตของโมเดลครั้งถัดไป

ทั้งหมดนี้คือ semantics ของ Pi runtime (OpenClaw บริโภค events แต่ Pi เป็นผู้ตัดสินใจว่าจะ compact เมื่อใด)

---

## การตั้งค่า Compaction (`reserveTokens`, `keepRecentTokens`)

การตั้งค่า Compaction ของ Pi อยู่ใน Pi settings:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw ยังบังคับใช้ safety floor สำหรับการรันแบบฝังตัว:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะเพิ่มค่าให้
- floor ค่าเริ่มต้นคือ `20000` โทเค็น
- ตั้งค่า `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิด floor
- หากตั้งไว้สูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม
- `/compact` แบบ manual จะเคารพ `agents.defaults.compaction.keepRecentTokens`
  ที่กำหนดไว้อย่างชัดเจน และคงจุดตัดส่วนท้ายล่าสุดของ Pi ไว้ หากไม่มี budget การเก็บล่าสุดแบบชัดเจน
  manual Compaction จะยังคงเป็น hard checkpoint และบริบทที่สร้างขึ้นใหม่จะเริ่มจาก
  summary ใหม่

เหตุผล: ต้องเหลือ headroom เพียงพอสำหรับ “housekeeping” หลาย turn (เช่น การเขียนหน่วยความจำ) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

การทำงานอยู่ใน: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(ถูกเรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## Compaction providers แบบเสียบเพิ่มได้

Plugins สามารถลงทะเบียน compaction provider ผ่าน `registerCompactionProvider()` บน Plugin API ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งเป็น id ของ provider ที่ลงทะเบียนไว้ safeguard extension จะมอบหมายการสรุปให้ provider นั้นแทน pipeline `summarizeInStages` ที่มีมาในตัว

- `provider`: id ของ compaction provider plugin ที่ลงทะเบียนไว้ ปล่อยว่างไว้เพื่อใช้การสรุปด้วย LLM แบบค่าเริ่มต้น
- การตั้งค่า `provider` จะบังคับให้เป็น `mode: "safeguard"`
- Providers จะได้รับคำสั่ง Compaction และนโยบายการคง identifier แบบเดียวกับเส้นทางที่มีมาในตัว
- safeguard จะยังคงรักษาบริบทของ recent-turn และ split-turn suffix หลังเอาต์พุตจาก provider
- การสรุปแบบ safeguard ที่มีมาในตัวจะกลั่นสรุปก่อนหน้าใหม่ร่วมกับข้อความใหม่
  แทนที่จะคงสรุปก่อนหน้าทั้งหมดแบบคำต่อคำ
- โหมด safeguard จะเปิดใช้การตรวจสอบคุณภาพของ summary โดยค่าเริ่มต้น; ตั้งค่า
  `qualityGuard.enabled: false` เพื่อข้ามพฤติกรรม retry เมื่อเอาต์พุตมีรูปแบบไม่ถูกต้อง
- หาก provider ล้มเหลวหรือคืนค่าผลลัพธ์ว่าง OpenClaw จะ fallback ไปใช้การสรุปด้วย LLM แบบมีมาในตัวโดยอัตโนมัติ
- สัญญาณ abort/timeout จะถูกโยนซ้ำ (ไม่ถูกกลืนทิ้ง) เพื่อเคารพการยกเลิกจากผู้เรียก

แหล่งที่มา: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็นได้

คุณสามารถสังเกต Compaction และสถานะของเซสชันได้ผ่าน:

- `/status` (ในเซสชันแชตใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- โหมด verbose: `🧹 Auto-compaction complete` + จำนวนครั้งของ Compaction

---

## งาน housekeeping แบบเงียบ (`NO_REPLY`)

OpenClaw รองรับ turns แบบ “เงียบ” สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

แนวทางปฏิบัติ:

- ผู้ช่วยเริ่มเอาต์พุตด้วย silent token ที่ตรงกันทุกตัวอักษร `NO_REPLY` /
  `no_reply` เพื่อระบุว่า “อย่าส่งคำตอบให้ผู้ใช้”
- OpenClaw จะตัด/ระงับสิ่งนี้ในชั้นการส่งมอบ
- การระงับ silent token แบบตรงตัวจะไม่สนตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` จะนับเหมือนกันเมื่อ payload ทั้งหมดมีเพียง silent token เท่านั้น
- สิ่งนี้มีไว้สำหรับ turns แบบเบื้องหลังจริง ๆ/ไม่ส่งมอบเท่านั้น; ไม่ใช่ทางลัดสำหรับ
  คำขอปกติของผู้ใช้ที่สามารถดำเนินการได้

ณ `2026.1.10` OpenClaw ยังระงับ **draft/typing streaming** เมื่อ
partial chunk เริ่มต้นด้วย `NO_REPLY` ด้วย ดังนั้นการทำงานแบบเงียบจะไม่รั่ว
เอาต์พุตบางส่วนระหว่าง turn

---

## "Memory flush" ก่อน Compaction (มีการใช้งานแล้ว)

เป้าหมาย: ก่อนเกิด auto-compaction ให้รัน agentic turn แบบเงียบที่เขียนสถานะถาวร
ลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ใน workspace ของ agent) เพื่อให้ Compaction
ไม่สามารถลบบริบทสำคัญได้

OpenClaw ใช้วิธี **pre-threshold flush**:

1. เฝ้าติดตามการใช้บริบทของเซสชัน
2. เมื่อข้าม “soft threshold” (ต่ำกว่า threshold ของ Compaction ของ Pi) ให้รันคำสั่ง
   “เขียนหน่วยความจำตอนนี้” แบบเงียบไปยัง agent
3. ใช้ silent token แบบตรงตัว `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้
   ไม่เห็นอะไรเลย

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับ flush turn)
- `systemPrompt` (system prompt เพิ่มเติมที่ต่อท้ายสำหรับ flush turn)

หมายเหตุ:

- prompt/system prompt ค่าเริ่มต้นมี hint `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- flush จะรันหนึ่งครั้งต่อหนึ่งรอบของ Compaction (ติดตามไว้ใน `sessions.json`)
- flush จะรันเฉพาะสำหรับเซสชัน Pi แบบฝังตัวเท่านั้น (แบ็กเอนด์ CLI จะข้าม)
- flush จะถูกข้ามเมื่อ workspace ของเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [Memory](/th/concepts/memory) สำหรับโครงร่างไฟล์ใน workspace และรูปแบบการเขียน

Pi ยังเปิดเผย hook `session_before_compact` ใน Plugin API ด้วย แต่ตรรกะ flush ของ OpenClaw
ยังอยู่ฝั่ง Gateway ในปัจจุบัน

---

## เช็กลิสต์การแก้ปัญหา

- session key ผิดหรือไม่? เริ่มจาก [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- store กับทรานสคริปต์ไม่ตรงกัน? ยืนยันโฮสต์ของ Gateway และพาธของ store จาก `openclaw status`
- Compaction ถี่เกินไป? ตรวจสอบ:
  - context window ของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` ที่สูงเกินไปสำหรับ context window ของโมเดลอาจทำให้เกิด Compaction เร็วขึ้น)
  - tool-result ที่พองเกินไป: เปิดใช้/ปรับ session pruning
- silent turns รั่วหรือไม่? ยืนยันว่าคำตอบเริ่มต้นด้วย `NO_REPLY` (exact token แบบไม่สนตัวพิมพ์เล็กใหญ่) และคุณใช้ build ที่มีการแก้ไขการระงับสตรีมมิงแล้ว

## ที่เกี่ยวข้อง

- [Session management](/th/concepts/session)
- [Session pruning](/th/concepts/session-pruning)
- [Context engine](/th/concepts/context-engine)
