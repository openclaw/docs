---
read_when:
    - ย้ายข้อมูลรันไทม์ แคช ทรานสคริปต์ สถานะงาน หรือไฟล์ชั่วคราวของ OpenClaw ไปยัง SQLite
    - การออกแบบการย้ายข้อมูลของ doctor จากไฟล์ JSON หรือ JSONL แบบเดิม
    - การเปลี่ยนพฤติกรรมการสำรองข้อมูล การกู้คืน VFS หรือที่เก็บข้อมูลของ worker
    - การลบการล็อกเซสชัน การตัดแต่ง การตัดทอน หรือเส้นทางความเข้ากันได้ของ JSON
summary: แผนการย้ายเพื่อทำให้ SQLite เป็นเลเยอร์หลักสำหรับสถานะถาวรและแคช โดยยังคงให้การกำหนดค่าอิงไฟล์
title: ปรับโครงสร้างสถานะโดยยึดฐานข้อมูลเป็นหลัก
x-i18n:
    generated_at: "2026-06-27T18:19:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# การปรับโครงสร้างสถานะแบบให้ฐานข้อมูลมาก่อน

## การตัดสินใจ

ใช้เลย์เอาต์ SQLite สองระดับ:

- ฐานข้อมูลส่วนกลาง: `~/.openclaw/state/openclaw.sqlite`
- ฐานข้อมูล Agent: ฐานข้อมูล SQLite หนึ่งชุดต่อ Agent สำหรับพื้นที่ทำงานที่ Agent เป็นเจ้าของ,
  transcript, VFS, artifact และสถานะรันไทม์ขนาดใหญ่แบบต่อ Agent
- การกำหนดค่ายังคงอิงไฟล์: `openclaw.json` ยังคงอยู่นอก
  ฐานข้อมูล โปรไฟล์ยืนยันตัวตนรันไทม์ย้ายไป SQLite; ไฟล์ข้อมูลประจำตัวของ provider ภายนอกหรือ CLI
  ยังคงให้เจ้าของจัดการอยู่นอกฐานข้อมูลของ OpenClaw

ฐานข้อมูลส่วนกลางคือฐานข้อมูล control-plane โดยเป็นเจ้าของการค้นพบ Agent,
สถานะ Gateway ที่ใช้ร่วมกัน, การจับคู่, สถานะอุปกรณ์/Node, บัญชีแยกประเภทงานและโฟลว์, สถานะ Plugin,
สถานะรันไทม์ของตัวกำหนดเวลา, metadata การสำรองข้อมูล และสถานะการย้ายข้อมูล

ฐานข้อมูล Agent คือฐานข้อมูล data-plane โดยเป็นเจ้าของ metadata เซสชันของ Agent,
สตรีมเหตุการณ์ transcript, พื้นที่ทำงาน VFS หรือ namespace scratch, artifact ของเครื่องมือ,
artifact ของการรัน และข้อมูลแคชเฉพาะ Agent ที่ค้นหา/จัดทำดัชนีได้

สิ่งนี้ให้มุมมองส่วนกลางที่คงทนหนึ่งชุดโดยไม่บังคับพื้นที่ทำงาน Agent ขนาดใหญ่,
transcript และข้อมูล scratch แบบไบนารีเข้าสู่ช่องทางเขียน Gateway ที่ใช้ร่วมกัน

## สัญญาแบบเข้มงวด

การย้ายข้อมูลนี้มีรูปทรงรันไทม์มาตรฐานหนึ่งเดียว:

- แถวเซสชันเก็บเฉพาะ metadata ของเซสชันเท่านั้น ต้องไม่เก็บ
  `transcriptLocator`, เส้นทางไฟล์ transcript, เส้นทาง JSONL พี่น้อง, เส้นทาง lock,
  metadata การ pruning หรือ pointer ความเข้ากันได้ยุคไฟล์
- ตัวตนของ transcript เป็นตัวตน SQLite เสมอ: `{agentId, sessionId}` รวมถึง
  metadata หัวข้อแบบไม่บังคับเมื่อ protocol ต้องใช้
- `sqlite-transcript://...` ไม่ใช่ตัวตนรันไทม์หรือ protocol โค้ดใหม่ต้อง
  ไม่ derive, persist, pass, parse หรือ migrate transcript locator รันไทม์และ
  การทดสอบไม่ควรมี pseudo-locator เลย; เอกสารอาจกล่าวถึงสตริงนี้
  เฉพาะเพื่อห้ามใช้
- `sessions.json` เดิม, transcript JSONL, `.jsonl.lock`, pruning, truncation,
  และตรรกะ session-path เก่า อยู่ได้เฉพาะในเส้นทาง migration/import ของ doctor
- alias config เซสชันเดิมอยู่ได้เฉพาะในการย้ายข้อมูลของ doctor รันไทม์ไม่
  ตีความ `session.idleMinutes`, `session.resetByType.dm` หรือ
  alias main-session ข้าม Agent แบบ `agent:main:*` สำหรับ Agent อื่นที่กำหนดค่าไว้
- ตัวตนการกำหนดเส้นทางเซสชันเป็นสถานะเชิงสัมพันธ์ที่มีชนิด เส้นทางรันไทม์และ UI ที่ร้อน
  ควรอ่าน `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` และ
  `session_conversations`; ต้องไม่ parse `session_key` หรือขุด
  `session_entries.entry_json` เพื่อหาตัวตน provider ยกเว้นในฐานะเงาความเข้ากันได้
  ระหว่างลบ call site เก่า
- marker ข้อความโดยตรงระดับ channel เช่น `dm` เทียบกับ `direct` เป็นคำศัพท์การกำหนดเส้นทาง
  ไม่ใช่ transcript locator หรือ handle ความเข้ากันได้ของ file-store
- config hook handler เดิมอยู่ได้เฉพาะบนพื้นผิวคำเตือน/การย้ายข้อมูลของ doctor
  รันไทม์ต้องไม่โหลด `hooks.internal.handlers`; hook ทำงานผ่านไดเรกทอรี hook ที่ค้นพบ
  และ metadata `HOOK.md` เท่านั้น
- การเริ่มต้นรันไทม์, เส้นทางตอบกลับร้อน, Compaction, reset, recovery, diagnostics,
  TTS, memory hooks, subagents, การกำหนดเส้นทางคำสั่ง Plugin, ขอบเขต protocol และ
  hooks ต้องส่ง `{agentId, sessionId}` ผ่านรันไทม์
- การทดสอบควร seed และ assert แถว transcript ของ SQLite ผ่าน
  `{agentId, sessionId}` การทดสอบที่พิสูจน์เฉพาะการส่งต่อเส้นทาง JSONL,
  การคง locator ที่ caller ส่งมา หรือความเข้ากันได้ของไฟล์ transcript ควร
  ถูกลบ เว้นแต่ว่าครอบคลุม doctor import, การ materialize วัสดุ support/debug ที่ไม่ใช่เซสชัน
  หรือรูปทรง protocol
- `runEmbeddedPiAgent(...)`, การรัน worker ที่เตรียมไว้ และ attempt แบบ embedded ภายใน
  ต้องไม่รับ transcript locator ต้องเปิดตัวจัดการ transcript SQLite
  ด้วย `{agentId, sessionId}` และส่งตัวจัดการนั้นให้เซสชัน Agent ที่เข้ากันได้กับ PI
  ซึ่ง internalize แล้ว เพื่อไม่ให้ caller เก่าทำให้ runner เขียน
  transcript JSON/JSONL ได้
- diagnostics ของ runner ต้องเก็บระเบียน trace runtime/cache/payload ใน SQLite
  diagnostics รันไทม์ต้องไม่เปิดเผย knob override ไฟล์ JSONL หรือ helper export
  transcript JSONL แบบทั่วไป; export ที่ผู้ใช้เห็นสามารถ materialize artifact ที่ชัดเจน
  จากแถวฐานข้อมูลโดยไม่ป้อนชื่อไฟล์กลับเข้าสู่รันไทม์
- การบันทึก raw stream ใช้ `OPENCLAW_RAW_STREAM=1` พร้อมแถว diagnostics ของ SQLite
  สัญญา file logger เดิมของ pi-mono ได้แก่ `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` และ
  `raw-openai-completions.jsonl` ไม่เป็นส่วนหนึ่งของรันไทม์หรือการทดสอบของ OpenClaw
- การทำดัชนีหน่วยความจำ QMD ต้องไม่ export transcript SQLite เป็นไฟล์ markdown
  QMD จัดทำดัชนีเฉพาะไฟล์หน่วยความจำที่กำหนดค่าไว้; การค้นหา transcript เซสชันยังคง
  อิง SQLite
- subpath ของ QMD SDK เป็นของ QMD เท่านั้นสำหรับโค้ดใหม่ helper การทำดัชนี transcript
  เซสชัน SQLite อยู่บน `memory-core-host-engine-session-transcripts`; การ re-export
  ของ QMD ใดๆ เป็นเพียงความเข้ากันได้และต้องไม่ถูกใช้โดยโค้ดรันไทม์
- ดัชนีหน่วยความจำในตัวอยู่ในฐานข้อมูล Agent ที่เป็นเจ้าของ config รันไทม์และ
  สัญญารันไทม์ที่ resolve แล้วต้องไม่เปิดเผย `memorySearch.store.path`; doctor
  ลบคีย์ config เดิมนั้น และโค้ดปัจจุบันส่ง
  `databasePath` ของ Agent ภายใน

งาน implement ควรลบโค้ดต่อไปจนกว่าข้อความเหล่านี้จะเป็นจริง
โดยไม่มีข้อยกเว้นนอกขอบเขต doctor/import/export/debug

## สถานะเป้าหมายและความคืบหน้า

### เป้าหมายเข้มงวด

- ฐานข้อมูล SQLite ส่วนกลางหนึ่งชุดเป็นเจ้าของสถานะ control-plane:
  `state/openclaw.sqlite`
- ฐานข้อมูล SQLite แบบต่อ Agent หนึ่งชุดเป็นเจ้าของสถานะ data-plane:
  `agents/<agentId>/agent/openclaw-agent.sqlite`
- config ยังคงอิงไฟล์ `openclaw.json` ไม่เป็นส่วนหนึ่งของการปรับโครงสร้าง
  ฐานข้อมูลนี้
- ไฟล์เดิมเป็นเพียงอินพุตการย้ายข้อมูลของ doctor
- รันไทม์ไม่เขียนหรืออ่าน JSONL ของเซสชันหรือ transcript เป็นสถานะ active

### สถานะเป้าหมาย

- `not-started`: โค้ดรันไทม์ยุคไฟล์ยังคงเขียนสถานะ active
- `migrating`: โค้ด doctor/import สามารถย้ายข้อมูลไฟล์เข้า SQLite
- `dual-read`: สะพานชั่วคราวอ่านทั้ง SQLite และไฟล์เดิม สถานะนี้
  ถูกห้ามสำหรับการปรับโครงสร้างนี้ เว้นแต่จะมีเอกสารระบุชัดเจนว่า
  เป็น doctor-only
- `sqlite-runtime`: รันไทม์อ่านและเขียนเฉพาะ SQLite
- `clean`: API และการทดสอบรันไทม์เดิมถูกลบ และ guard ป้องกัน
  regression
- `done`: เอกสาร, การทดสอบ, การสำรองข้อมูล, การย้ายข้อมูล doctor และ changed checks พิสูจน์
  สถานะ clean

### สถานะปัจจุบัน

- Sessions: `clean` สำหรับรันไทม์ แถวเซสชันอยู่ในฐานข้อมูลแบบต่อ Agent,
  API รันไทม์ใช้ `{agentId, sessionId}` หรือ `{agentId, sessionKey}` และ
  `sessions.json` เป็นอินพุต legacy ของ doctor เท่านั้น
- Transcripts: `clean` สำหรับรันไทม์ เหตุการณ์ transcript, ตัวตน, snapshot
  และเหตุการณ์รันไทม์ trajectory อยู่ในฐานข้อมูลแบบต่อ Agent รันไทม์ไม่
  รับ transcript locator หรือเส้นทาง transcript JSONL อีกต่อไป
- PI embedded runner: `clean` การรัน PI แบบ embedded, worker ที่เตรียมไว้, Compaction
  และลูป retry ใช้ scope เซสชัน SQLite และปฏิเสธ handle transcript เก่า
- Cron: `clean` สำหรับรันไทม์ รันไทม์ใช้ `cron_jobs` และ `cron_run_logs`;
  การทดสอบรันไทม์ใช้การตั้งชื่อ `storeKey` แบบ SQLite และเส้นทาง Cron ยุคไฟล์ยังคงอยู่ใน
  การทดสอบ migration legacy ของ doctor เท่านั้น
- Task registry: `clean` แถวรันไทม์ของ Task และ Task Flow อยู่ใน
  `state/openclaw.sqlite`; importer SQLite sidecar ที่ยังไม่ shipped ถูกลบแล้ว
- สถานะ Plugin: `clean` แถวสถานะ/blob ของ Plugin อยู่ในฐานข้อมูลส่วนกลางที่ใช้ร่วมกัน;
  helper SQLite sidecar ของสถานะ Plugin เก่าถูก guard ไว้
- Memory: `sqlite-runtime` สำหรับหน่วยความจำในตัวและการทำดัชนี transcript เซสชัน
  ตารางดัชนีหน่วยความจำอยู่ในฐานข้อมูลแบบต่อ Agent, สถานะหน่วยความจำ Plugin ใช้
  แถว plugin-state ที่ใช้ร่วมกัน และไฟล์หน่วยความจำเดิมเป็นอินพุตการย้ายข้อมูลของ doctor
  หรือเนื้อหา workspace ของผู้ใช้
- Backup: `sqlite-runtime` ขั้นตอนสำรองข้อมูล compact snapshot SQLite, ละเว้น
  WAL/SHM sidecar ที่ยังทำงานอยู่, ตรวจสอบ integrity ของ SQLite และบันทึกการรัน backup ใน
  ฐานข้อมูลส่วนกลาง
- การย้ายข้อมูล doctor: `migrating` โดยตั้งใจ doctor import JSON legacy,
  JSONL และ store sidecar ที่เลิกใช้แล้วเข้า SQLite, บันทึกการรัน/แหล่งที่มาของ migration
  และลบแหล่งที่มาที่สำเร็จ
- สคริปต์ E2E: `clean` สำหรับความครอบคลุมรันไทม์ การ seed Docker MCP เขียนแถว SQLite
  สคริปต์ Docker runtime-context สร้าง JSONL legacy เฉพาะใน
  seed การย้ายข้อมูลของ doctor และตั้งชื่อเส้นทางดัชนีเซสชัน legacy อย่างชัดเจน

### งานที่เหลือ

- [x] เปลี่ยนชื่อ variable store ของการทดสอบรันไทม์ Cron ออกจาก `storePath` เว้นแต่
      จะเป็นอินพุต legacy ของ doctor
      ไฟล์: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`
      หลักฐาน: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`
- [x] ลบหรือเปลี่ยนชื่อ mock การทดสอบ export ยุคไฟล์ที่ล้าสมัย
      ไฟล์: `src/auto-reply/reply/commands-export-test-mocks.ts`
      หลักฐาน: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`
- [x] ทำให้ seed JSONL legacy ของ Docker runtime-context ชัดเจนว่าเป็น doctor-only
      ไฟล์: `scripts/e2e/session-runtime-context-docker-client.ts`
      หลักฐาน: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` แสดงเฉพาะ
      `seedBrokenLegacySessionForDoctorMigration`
- [x] รักษา type ที่ generated โดย Kysely ให้ตรงหลังการเปลี่ยนแปลง schema ใดๆ
      ไฟล์: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`
      หลักฐาน: ไม่มีการเปลี่ยนแปลง schema ในรอบนี้; `pnpm db:kysely:check`;
      `pnpm lint:kysely`
- [x] รันการทดสอบแบบโฟกัสซ้ำสำหรับ store, command และสคริปต์ที่แตะ
      หลักฐาน: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`
- [x] ก่อนประกาศ `done`, รัน changed gate หรือ broad proof ระยะไกล
      หลักฐาน: `pnpm check:changed --timed -- <changed extension paths>` ผ่านบน
      Hetzner Crabbox run `run_3f1cabf6b25c` หลังการตั้งค่า Node 24/pnpm ชั่วคราวและ
      การกำหนดเส้นทาง path ชัดเจนสำหรับ workspace ที่ sync แล้วซึ่งไม่มี `.git`

### อย่าให้ถดถอย

- ไม่มี transcript locator
- ไม่มีไฟล์เซสชัน active
- ไม่มี fixture ทดสอบ JSONL ปลอม ยกเว้นการทดสอบ migration legacy ของ doctor
- ไม่มีการเข้าถึง SQLite แบบ raw ในที่ที่คาดหวัง Kysely
- ไม่มีการย้ายข้อมูล DB legacy ใหม่ เลย์เอาต์นี้ยังไม่ได้ shipped; คง schema version
  ไว้ที่ `1` เว้นแต่จะมีเหตุผลหนักแน่น

## สมมติฐานจากการอ่านโค้ด

ไม่มีการตัดสินใจผลิตภัณฑ์เพิ่มเติมที่บล็อกแผนนี้ การ implement ควร
ดำเนินต่อด้วยสมมติฐานเหล่านี้:

- ใช้ `node:sqlite` โดยตรงและกำหนดให้เส้นทางพื้นที่จัดเก็บนี้ต้องใช้ runtime
  Node 22+
- เก็บไฟล์การกำหนดค่าปกติไว้เพียงไฟล์เดียวเท่านั้น อย่าย้าย config, plugin
  manifests หรือ Git workspaces เข้าไปใน SQLite ในการ refactor นี้
- ไม่จำเป็นต้องมีไฟล์ความเข้ากันได้ของ runtime ไฟล์ JSON และ JSONL แบบ legacy
  เป็นเพียงอินพุตสำหรับ migration เท่านั้น ส่วน SQLite sidecars แบบ branch-local
  ไม่เคยถูกเผยแพร่และจะถูกลบแทนการ import
- `openclaw doctor --fix` เป็นเจ้าของขั้นตอน migration จากไฟล์ legacy ไปยังฐานข้อมูล
  การเริ่มต้น runtime และ `openclaw migrate` ไม่ควรแบกรับเส้นทางอัปเกรดฐานข้อมูล
  OpenClaw แบบ legacy
- ความเข้ากันได้ของ credential ใช้กฎเดียวกัน: credential ของ runtime อยู่ใน
  SQLite ไฟล์เก่า `auth-profiles.json`, `auth.json` ราย agent และไฟล์ร่วม
  `credentials/oauth.json` เป็นอินพุตสำหรับ doctor migration จากนั้นจะถูกลบ
  หลัง import
- สถานะ catalog ของโมเดลที่สร้างขึ้นต้องมีฐานข้อมูลรองรับ โค้ด runtime ต้องไม่เขียน
  `agents/<agentId>/agent/models.json`; ไฟล์ `models.json` ที่มีอยู่เป็นอินพุต
  legacy สำหรับ doctor และจะถูกลบหลัง import เข้า `agent_model_catalogs`
- Runtime ต้องไม่ migrate, normalize หรือ bridge transcript locators ตัวตนของ
  transcript ที่ active คือ `{agentId, sessionId}` ใน SQLite เส้นทางไฟล์เป็นเพียง
  อินพุต legacy สำหรับ doctor และ `sqlite-transcript://...` ต้องหายไปจากพื้นผิว
  runtime, protocol, hook และ plugin แทนที่จะถูกถือเป็น boundary handle
- การอ่าน transcript จาก SQLite ใน runtime จะไม่รัน migration รูปทรง entry แบบ
  JSONL เก่าหรือเขียน transcript ทั้งหมดใหม่เพื่อความเข้ากันได้ การ normalize entry
  แบบ legacy อยู่ในยูทิลิตี doctor/import ที่ชัดเจนเท่านั้น Doctor จะ normalize
  ไฟล์ transcript JSONL แบบ legacy ก่อนแทรกแถว SQLite; แถว runtime ปัจจุบันถูกเขียน
  ด้วย schema transcript ปัจจุบันอยู่แล้ว การ export trajectory/session อ่านแถวเหล่านั้น
  ตามเดิมและต้องไม่ทำ migration legacy ระหว่าง export
- helper สำหรับ parse/migration transcript JSONL แบบ legacy เป็นของ doctor เท่านั้น
  โค้ดรูปแบบ transcript ของ runtime สร้าง context transcript SQLite ปัจจุบันเท่านั้น;
  doctor เป็นเจ้าของการอัปเกรด entry JSONL เก่าก่อนแทรกแถว
- helper streaming transcript JSONL เดิมที่ runtime เป็นเจ้าของถูกลบแล้ว โค้ด import
  ของ doctor เป็นเจ้าของการอ่านไฟล์ legacy อย่างชัดเจน; ประวัติ session ของ runtime
  อ่านแถว SQLite
- binding ของ Codex app-server ใช้ `sessionId` ของ OpenClaw เป็นคีย์ canonical
  ใน namespace plugin-state ของ Codex `sessionKey` เป็น metadata สำหรับ routing/display
  และต้องไม่แทนที่ session id ที่คงทนหรือทำให้ตัวตน transcript-file กลับมา
- context engines ได้รับ contract runtime ปัจจุบันโดยตรง registry ต้องไม่ wrap engine
  ด้วย retry shims ที่ลบ `sessionKey`, `transcriptScope` หรือ `prompt`; engine ที่รับ
  params ปัจจุบันแบบ database-first ไม่ได้ควร fail loudly แทนที่จะถูก bridge
- เอาต์พุต backup ควรยังเป็นไฟล์ archive เดียว เนื้อหาฐานข้อมูลควรเข้า archive นั้น
  เป็น snapshot SQLite แบบ compact ไม่ใช่ live WAL sidecars ดิบ
- การค้นหา transcript มีประโยชน์แต่ไม่จำเป็นสำหรับรอบแรกแบบ database-first
  ให้ออกแบบ schema เพื่อให้เพิ่ม FTS ได้ในภายหลัง
- การทำงานของ worker ควรยังคงเป็น experimental อยู่หลัง settings ระหว่างที่ boundary
  ของฐานข้อมูลยังนิ่งตัว

## สิ่งที่พบจากการอ่านโค้ด

branch ปัจจุบันผ่านขั้น proof-of-concept มาแล้ว ฐานข้อมูลร่วมมีอยู่จริง, Node
`node:sqlite` ถูกเชื่อมผ่าน helper runtime ขนาดเล็ก และ store เดิมตอนนี้เขียนไปที่
`state/openclaw.sqlite` หรือฐานข้อมูล `openclaw-agent.sqlite` ของเจ้าของ

งานที่เหลือไม่ใช่การเลือก SQLite แต่คือการรักษา boundary ใหม่ให้สะอาดและลบ interface
รูปทรงความเข้ากันได้ที่ยังดูเหมือนโลกไฟล์เก่า:

- Session `storePath` ไม่ใช่ตัวตน runtime, รูปทรง test fixture หรือฟิลด์ status payload
  อีกต่อไป การทดสอบ runtime และ bridge ไม่มีชื่อ contract `storePath` แล้ว;
  โค้ด doctor/migration เป็นเจ้าของคำศัพท์ legacy นั้น
- การเขียน session ไม่ผ่าน queue `store-writer.ts` แบบ in-process เดิมอีกต่อไป
  การเขียน patch ของ SQLite ใช้ conflict detection และ bounded retry แทน
- การค้นหาเส้นทาง legacy ยังมีการใช้งานด้าน migration ที่ถูกต้อง แต่โค้ด runtime ควรหยุด
  ถือว่า `sessions.json` และไฟล์ transcript JSONL เป็นเป้าหมายการเขียนที่เป็นไปได้
- ตารางที่ agent เป็นเจ้าของอยู่ในฐานข้อมูล SQLite ราย agent ฐานข้อมูล global เก็บแถว
  registry/control-plane; ตัวตน transcript คือ `{agentId, sessionId}` ในแถว transcript
  ราย agent โค้ด runtime ต้องไม่ persist เส้นทางไฟล์ transcript หรือ migrate
  transcript locators
- Doctor import ไฟล์ legacy หลายไฟล์อยู่แล้ว การ cleanup คือทำให้สิ่งนั้นเป็น
  implementation migration แบบชัดเจนเพียงชุดเดียวที่ doctor เรียกใช้ พร้อมรายงาน
  migration ที่คงทน

ไม่มีคำถามด้านผลิตภัณฑ์เพิ่มเติมที่ขวางการ implement

## รูปทรงโค้ดปัจจุบัน

branch นี้มีฐาน SQLite ร่วมที่ใช้งานจริงแล้ว:

- พื้นฐานรันไทม์ขั้นต่ำตอนนี้คือ Node 22+: `package.json`, ตัวป้องกันรันไทม์ของ CLI,
  ค่าเริ่มต้นของตัวติดตั้ง, ตัวค้นหารันไทม์บน macOS, CI และเอกสารการติดตั้งสาธารณะทั้งหมด
  สอดคล้องกันแล้ว เลนความเข้ากันได้กับ Node 22 แบบเก่าถูกนำออกแล้ว
- `src/state/openclaw-state-db.ts` เปิด `openclaw.sqlite`, ตั้งค่า WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` และใช้
  โมดูลสคีมาที่สร้างขึ้นซึ่งได้มาจาก
  `src/state/openclaw-state-schema.sql`
- ประเภทตาราง Kysely และโมดูลสคีมารันไทม์ถูกสร้างจากฐานข้อมูล
  SQLite แบบใช้แล้วทิ้งที่สร้างจากไฟล์ `.sql` ที่ commit ไว้; โค้ดรันไทม์จะไม่เก็บ
  สตริงสคีมาที่คัดลอกวางไว้เองสำหรับฐานข้อมูลส่วนกลาง, ต่อเอเจนต์ หรือ proxy
  capture อีกต่อไป
- สโตร์รันไทม์ได้ประเภทแถวที่เลือกและแทรกจากอินเทอร์เฟซ Kysely `DB`
  ที่สร้างขึ้นเหล่านั้น แทนการสะท้อนรูปทรงแถว SQLite ด้วยมือ Raw SQL
  ยังคงจำกัดไว้เฉพาะการใช้สคีมา, pragmas และ DDL เฉพาะการย้ายข้อมูลเท่านั้น
- สคีมา SQLite ถูกยุบเหลือ `user_version = 1` เพราะเลย์เอาต์ฐานข้อมูลนี้
  ยังไม่เคยถูกปล่อยใช้งานจริง ตัวเปิดรันไทม์สร้างเฉพาะสคีมาปัจจุบัน;
  การนำเข้าจากไฟล์สู่ฐานข้อมูลยังอยู่ในโค้ด doctor และ helper อัปเกรด
  ฐานข้อมูลเฉพาะ branch ถูกลบแล้ว
- ความเป็นเจ้าของเชิงสัมพันธ์ถูกบังคับใช้ในจุดที่ขอบเขตความเป็นเจ้าของเป็น canonical:
  แถวการย้ายแหล่งที่มาจะ cascade จาก `migration_runs`, สถานะการส่ง task
  จะ cascade จาก `task_runs` และแถวตัวตน transcript จะ cascade จาก
  เหตุการณ์ transcript
- ตาราง shared ปัจจุบันรวมถึง `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` และ `backup_runs`
- สถานะใดๆ ที่ Plugin เป็นเจ้าของจะไม่ได้ตาราง typed ที่ host เป็นเจ้าของ
  Plugin ที่ติดตั้งใช้ `plugin_state_entries` สำหรับ payload JSON แบบมีเวอร์ชัน และ
  `plugin_blob_entries` สำหรับ bytes พร้อมความเป็นเจ้าของ namespace/key, การล้าง TTL,
  backup และระเบียนการย้ายข้อมูลของ Plugin สถานะ orchestration ของ Plugin ที่ host เป็นเจ้าของ
  ยังมีตาราง typed ได้เมื่อ host เป็นเจ้าของสัญญาการ query เช่น
  `plugin_binding_approvals`
- การย้ายข้อมูลของ Plugin คือการย้ายข้อมูลเหนือ namespace ที่ Plugin เป็นเจ้าของ ไม่ใช่
  การย้ายสคีมาของ host Plugin สามารถย้าย state/blob entries แบบมีเวอร์ชันของตนเอง
  ผ่าน migration provider ได้ และ host จะบันทึกสถานะ source/run ใน
  ledger การย้ายข้อมูลปกติ การติดตั้ง Plugin ใหม่ไม่จำเป็นต้องเปลี่ยน
  `openclaw-state-schema.sql` เว้นแต่ host เองจะรับความเป็นเจ้าของ
  สัญญาข้าม Plugin ใหม่
- `src/state/openclaw-agent-db.ts` เปิด
  `agents/<agentId>/agent/openclaw-agent.sqlite`, ลงทะเบียนฐานข้อมูลใน
  DB ส่วนกลาง และเป็นเจ้าของตาราง session, transcript, VFS, artifact, cache
  และ memory-index ในเครื่องเอเจนต์ ขณะนี้การค้นพบรันไทม์ shared อ่านรีจิสทรี
  `agent_databases` ที่มี typed ที่สร้างไว้แล้ว แทนการทำ query นั้นซ้ำในแต่ละ
  call site
- ฐานข้อมูลส่วนกลางและต่อเอเจนต์บันทึกแถว `schema_meta` พร้อมบทบาทฐานข้อมูล,
  เวอร์ชันสคีมา, timestamps และ agent id สำหรับฐานข้อมูลเอเจนต์ เลย์เอาต์ยังคงอยู่ที่
  `user_version = 1` เพราะสคีมา SQLite นี้ยังไม่เคยถูกปล่อยใช้งานจริง
- ตัวตน session ต่อเอเจนต์ตอนนี้มีตารางราก canonical `sessions` ที่ใช้
  `session_id` เป็น key พร้อม `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamps, display fields, metadata ของ model,
  harness id และลิงก์ parent/spawn เป็นคอลัมน์ที่ query ได้ `session_routes`
  คือดัชนี route ที่ใช้งานอยู่แบบ unique จาก `session_key` ไปยัง
  `session_id` ปัจจุบัน เพื่อให้ route key ย้ายไปยัง session durable ใหม่ได้โดยไม่ทำให้
  hot reads ต้องเลือกระหว่างแถว `sessions.session_key` ที่ซ้ำกัน payload รูปทรงเข้ากันได้เก่า
  `session_entries.entry_json` ผูกกับราก durable `session_id`
  ด้วย foreign key; มันไม่ใช่ตัวแทนของ session เพียงตัวเดียวในระดับสคีมาอีกต่อไป
- ตัวตนการสนทนาภายนอกต่อเอเจนต์ก็เป็นเชิงสัมพันธ์เช่นกัน:
  `conversations` เก็บตัวตน provider/account/conversation ที่ normalize แล้ว และ
  `session_conversations` เชื่อมหนึ่ง session ของ OpenClaw กับการสนทนาภายนอกหนึ่งรายการหรือมากกว่า
  สิ่งนี้ครอบคลุม session DM แบบ shared-main ที่ peer หลายรายสามารถตั้งใจ map ไปยัง session เดียว
  โดยไม่โกหกใน `session_key` SQLite ยังบังคับ uniqueness สำหรับตัวตน provider ตามธรรมชาติ
  เพื่อไม่ให้ tuple channel/account/kind/peer/thread เดียวกันแตกออกเป็น conversation ids หลายรายการได้
  peer แบบ direct ของ shared-main ถูกลิงก์ด้วย role `participant` เพื่อให้หนึ่ง
  session ของ OpenClaw แทน peer DM ภายนอกหลายรายได้โดยไม่ลดสถานะ peer เก่า
  เป็นแถว related ที่คลุมเครือ `sessions.primary_conversation_id` ยังชี้ไปที่
  เป้าหมายการส่งแบบ typed ปัจจุบัน คอลัมน์ routing/status แบบปิดถูกบังคับใช้ด้วย
  ข้อจำกัด SQLite `CHECK` แทนการพึ่งพาเพียง union ของ TypeScript
  การฉาย session รันไทม์ล้างเงา routing สำหรับความเข้ากันได้จาก
  `session_entries.entry_json` ก่อนใช้คอลัมน์ session/conversation แบบ typed
  เพื่อไม่ให้ payload JSON เก่าปลุกเป้าหมายการส่งกลับมาได้
  การ routing การประกาศของ subagent ก็ต้องใช้บริบทการส่งแบบ typed ของ SQLite เช่นกัน;
  มันไม่ fallback ไปยัง field route ของ `SessionEntry` เพื่อความเข้ากันได้อีกต่อไป
  การสืบทอดการส่งแบบชัดเจนของ Gateway `chat.send` อ่านบริบทการส่งแบบ typed ของ SQLite
  แทน field ความเข้ากันได้ `origin`/`last*`
  `tools.effective` ก็ได้บริบท provider/account/thread จากแถวการส่ง/routing แบบ typed ของ SQLite
  ไม่ใช่เงา session-entry `last*` ที่ค้างอยู่
  บริบท prompt ของเหตุการณ์ระบบสร้าง field channel/to/account/thread ใหม่จาก
  field การส่งแบบ typed แทนเงา `origin`
  helper shared `deliveryContextFromSession` และ mapper session-to-conversation
  ตอนนี้ละเว้น `SessionEntry.origin` ทั้งหมด; เฉพาะ field การส่งแบบ typed
  และแถว conversation เชิงสัมพันธ์เท่านั้นที่สร้างตัวตน hot route ได้
  การ normalize entry ของ session รันไทม์จะตัด `origin` ออกก่อน persist หรือ
  project `entry_json` และการเขียน metadata ขาเข้าจะเขียน field channel/chat แบบ typed
  พร้อมแถว conversation เชิงสัมพันธ์ แทนการสร้างเงา origin ใหม่
- เหตุการณ์ transcript, snapshots ของ transcript และเหตุการณ์รันไทม์ trajectory ตอนนี้
  อ้างอิงราก `sessions` canonical ต่อเอเจนต์และ cascade เมื่อ session
  ถูกลบ แถวตัวตน/idempotency ของ transcript ยังคง cascade จาก
  แถวเหตุการณ์ transcript ที่ตรงกัน
- ดัชนี memory-core ตอนนี้ใช้ตารางฐานข้อมูลเอเจนต์ที่ชัดเจน
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` และ
  `memory_embedding_cache` โดย `memory_index_state` ติดตามการเปลี่ยนแปลง revision
  ดัชนีข้าง FTS/vector แบบ optional มีชื่อว่า `memory_index_chunks_fts` และ
  `memory_index_chunks_vec` แทนตาราง generic `meta`, `files`, `chunks`,
  `chunks_fts` หรือ `chunks_vec` ชื่อ canonical ยังคงรูปทรงแถว path/source
  ปัจจุบันและความเข้ากันได้ของ embedding ที่ serialize แล้ว ตารางเหล่านี้เป็น
  derived/search cache ไม่ใช่ที่เก็บ transcript canonical; สามารถลบและสร้างใหม่
  จากไฟล์ workspace memory และแหล่งที่กำหนดค่าได้
  การเปิดดัชนี memory ชื่อ generic ที่เคยปล่อยใช้งานแล้วจะย้าย metadata, sources,
  chunks และ embedding cache ไปยังตาราง canonical; ตาราง FTS/vector
  ที่ได้มาจะถูกสร้างใหม่ภายใต้ชื่อ canonical
- สถานะการกู้คืนการรัน subagent ตอนนี้อยู่ในแถว shared `subagent_runs` แบบ typed
  พร้อมคีย์ session ของ child, requester และ controller ที่ทำดัชนีไว้ ไฟล์เก่า
  `subagents/runs.json` เป็นเพียงอินพุตการย้ายข้อมูลของ doctor เท่านั้น
- bindings ของการสนทนาปัจจุบันตอนนี้อยู่ในแถว shared
  `current_conversation_bindings` แบบ typed ซึ่ง key ด้วย conversation id ที่ normalize แล้ว พร้อม
  คอลัมน์ agent/session เป้าหมาย, ชนิดการสนทนา, สถานะ, expiry และ metadata
  ที่เก็บเป็นคอลัมน์เชิงสัมพันธ์แทนระเบียน binding ทึบแสงที่ซ้ำกัน
  key ของ binding แบบ durable รวมชนิดการสนทนาที่ normalize แล้วไว้ด้วย เพื่อให้
  refs direct/group/channel ไม่ชนกัน และ SQLite ปฏิเสธค่า binding
  kind/status ที่ไม่ถูกต้อง ไฟล์เก่า
  `bindings/current-conversations.json` เป็นเพียงอินพุตการย้ายข้อมูลของ doctor เท่านั้น
- การกู้คืนคิวการส่งตอนนี้ overlay คอลัมน์คิวแบบ typed สำหรับ channel, target,
  account, session, retry, error, platform-send และสถานะ recovery ลงบน
  replay JSON `entry_json` เก็บ payload replay, hooks และ payload formatting
  ไว้ แต่คอลัมน์ typed เป็น authoritative สำหรับ routing/state ของ hot queue
- pointers สำหรับ restore session ล่าสุดของ TUI ตอนนี้อยู่ในแถว shared
  `tui_last_sessions` แบบ typed ซึ่ง key ด้วย scope ของการเชื่อมต่อ/session TUI ที่ hash แล้ว
  ไฟล์ JSON ของ TUI เก่าเป็นเพียงอินพุตการย้ายข้อมูลของ doctor เท่านั้น
- prefs เริ่มต้นของ TTS ตอนนี้อยู่ในแถว SQLite ของ plugin-state shared ซึ่ง key ภายใต้
  Plugin `speech-core` ไฟล์เก่า `settings/tts.json` เป็นเพียงอินพุตการย้ายข้อมูลของ doctor
  เท่านั้น; รันไทม์ไม่อ่านหรือเขียนไฟล์ JSON prefs ของ TTS อีกต่อไป และ
  resolver ของ path เก่าอยู่ในโมดูลการย้ายข้อมูลของ doctor
- metadata ของ secret target ตอนนี้พูดถึงสโตร์แทนการแสร้งว่าทุก
  credential target เป็นไฟล์ config `openclaw.json` ยังคงเป็น config store;
  target ของ auth-profile ใช้แถว SQLite `auth_profile_stores` แบบ typed พร้อม
  credentials รูปทรง provider ที่เก็บเป็น payload JSON
- การ audit secret ไม่สแกนไฟล์ `auth.json` ต่อเอเจนต์ที่เลิกใช้แล้วอีกต่อไป Doctor เป็นเจ้าของ
  การเตือน การนำเข้า และการลบไฟล์ legacy นั้น
- helper path ของ auth profile legacy ตอนนี้อยู่ในโค้ด legacy ของ doctor helper path ของ core auth
  profile เปิดเผยตัวตนของ SQLite auth-store และตำแหน่งแสดงผล
  ไม่ใช่ path รันไทม์ `auth-profiles.json` หรือ `auth-state.json`
- โมดูลรันไทม์การกู้คืนการรัน subagent และ cache ความสามารถของ model OpenRouter
  ตอนนี้แยก snapshot readers/writers ของ SQLite ออกจาก helper นำเข้า JSON legacy ที่มีเฉพาะ doctor
  ความสามารถของ OpenRouter ใช้แถว generic
  `model_capability_cache` แบบ typed ภายใต้ `provider_id = "openrouter"` แทน
  blob cache ทึบแสงหนึ่งก้อนหรือตาราง host เฉพาะ provider การรัน subagent
  `taskName` ถูกเก็บในคอลัมน์ typed `subagent_runs.task_name`; สำเนา
  `payload_json` เป็นข้อมูล replay/debug ไม่ใช่แหล่งที่มาสำหรับ hot display หรือ
  field lookup
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` ใช้งาน SQLite VFS
  เหนือตาราง `vfs_entries` ของฐานข้อมูลเอเจนต์ การอ่าน directory, exports แบบ recursive,
  การลบ และการ rename ใช้ช่วง prefix `(namespace, path)` ที่ทำดัชนีแล้ว
  แทนการสแกนทั้ง namespace หรือพึ่งพาการจับคู่ path ด้วย `LIKE`
- `src/agents/runtime-worker.entry.ts` สร้าง SQLite VFS ต่อ run, tool artifact,
  run artifact และ scoped cache stores สำหรับ workers
- markers การเสร็จสิ้น bootstrap ของ workspace ตอนนี้อยู่ในแถว shared
  `workspace_setup_state` แบบ typed ซึ่ง key ด้วย path workspace ที่ resolve แล้ว แทน
  `.openclaw/workspace-state.json`; รันไทม์ไม่อ่านหรือเขียน marker workspace legacy อีกต่อไป
  และ API helper ไม่ส่ง path ปลอม
  `.openclaw/setup-state` ไปมาเพียงเพื่อหา identity ของ storage อีกต่อไป
- exec approvals ตอนนี้อยู่ในแถว singleton ของ SQLite shared แบบ typed `exec_approvals_config`
  Doctor นำเข้า legacy `~/.openclaw/exec-approvals.json`;
  การเขียนของรันไทม์ไม่สร้าง, เขียนซ้ำ หรือรายงานไฟล์นั้นเป็นตำแหน่งสโตร์ที่ active อีกต่อไป
  companion บน macOS อ่านและเขียนแถวตาราง
  `state/openclaw.sqlite` เดียวกัน; มันเก็บไว้บนดิสก์เฉพาะ Unix prompt socket
  เพราะนั่นคือ IPC ไม่ใช่สถานะรันไทม์ durable
- โมดูลรันไทม์ของ device identity, device auth และ bootstrap ตอนนี้แยก
  snapshot readers/writers ของ SQLite ออกจาก helper นำเข้า JSON legacy ที่มีเฉพาะ doctor
  Device identity ใช้แถว `device_identities` แบบ typed และ token ของ device auth
  ใช้แถว `device_auth_tokens` แบบ typed การเขียน device auth จะ reconcile แถว
  ตาม device/role แทนการ truncate ตาราง token และรันไทม์ไม่ route
  การอัปเดต token เดี่ยวผ่าน adapter whole-store เก่าอีกต่อไป Legacy
  เพย์โหลด JSON version-1 มีอยู่เฉพาะในรูปแบบนำเข้า/ส่งออกของ doctor เท่านั้น.
- แคชการแลกเปลี่ยนโทเค็น GitHub Copilot ใช้ตารางสถานะ Plugin ของ SQLite ที่ใช้ร่วมกัน
  ภายใต้ `github-copilot/token-cache/default` นี่เป็นสถานะแคชที่ผู้ให้บริการเป็นเจ้าของ
  จึงตั้งใจไม่เพิ่มตารางสคีมาของโฮสต์.
- Compaction ของ GitHub Copilot จะไม่เขียนไฟล์เสริมเวิร์กสเปซ `openclaw-compaction-*.json`
  อีกต่อไป ฮาร์เนสเรียก RPC ของ compaction ประวัติ SDK สำหรับ
  เซสชัน SDK ที่ติดตาม และ OpenClaw เก็บสถานะเซสชัน/ทรานสคริปต์แบบคงทนใน
  SQLite แทนไฟล์มาร์กเกอร์ความเข้ากันได้.
- รันไทม์ Swift ที่ใช้ร่วมกัน (`OpenClawKit`) ใช้แถว
  `state/openclaw.sqlite` เดียวกันสำหรับตัวตนอุปกรณ์และการยืนยันตัวตนอุปกรณ์ ตัวช่วยแอป macOS
  นำเข้าตัวช่วย SQLite ที่ใช้ร่วมกัน แทนการเป็นเจ้าของพาธ JSON หรือ
  SQLite ที่สอง ไฟล์เดิมที่เหลืออยู่ `identity/device.json` จะบล็อกการสร้างตัวตน
  จนกว่า doctor จะนำเข้าไฟล์นั้นไปยัง SQLite ซึ่งตรงกับเกตเริ่มต้นของ TypeScript และ Android.
- ตัวตนอุปกรณ์ Android ใช้วัสดุคีย์ที่เข้ากันได้กับ TypeScript ชุดเดียวกัน
  ซึ่งเก็บอยู่ในแถวแบบมีชนิด `state/openclaw.sqlite#table/device_identities` มันจะไม่
  อ่านหรือเขียน `openclaw/identity/device.json`; ไฟล์เดิมที่เหลืออยู่จะบล็อก
  การเริ่มต้นจนกว่า doctor จะนำเข้าไฟล์นั้นไปยัง SQLite.
- โทเค็นการยืนยันตัวตนอุปกรณ์ Android ที่แคชไว้ยังใช้แถวแบบมีชนิด
  `state/openclaw.sqlite#table/device_auth_tokens` และใช้ซีแมนติกโทเค็น version-1
  เดียวกับ TypeScript และ Swift รันไทม์จะไม่อ่านคีย์ความเข้ากันได้ `SecurePrefs`
  `gateway.deviceToken*` อีกต่อไป; คีย์เหล่านั้นเป็นของตรรกะการย้ายข้อมูล/doctor
  เท่านั้น.
- ประวัติแพ็กเกจล่าสุดของการแจ้งเตือน Android ใช้แถวแบบมีชนิด
  `android_notification_recent_packages` รันไทม์จะไม่ย้ายข้อมูลหรือ
  อ่านคีย์ CSV ของ SharedPreferences แบบเก่าอีกต่อไป.
- การสร้างตัวตนอุปกรณ์จะล้มเหลวแบบปิดเมื่อมี `identity/device.json` เดิม
  อยู่ เมื่อแถวตัวตนใน SQLite ไม่ถูกต้อง หรือเมื่อเปิดที่เก็บตัวตน SQLite
  ไม่ได้ doctor จะนำเข้าและลบไฟล์นั้นก่อน ดังนั้นการเริ่มต้นรันไทม์
  จึงไม่สามารถหมุนเวียนตัวตนการจับคู่แบบเงียบ ๆ ก่อนการย้ายข้อมูลได้.
- การเลือกตัวตนอุปกรณ์เป็นคีย์แถว SQLite ไม่ใช่ตัวระบุตำแหน่งไฟล์ JSON การทดสอบ
  และตัวช่วย Gateway ส่งคีย์ตัวตนที่ชัดเจน; มีเพียงการย้ายข้อมูลของ doctor และ
  เกตเริ่มต้นแบบล้มเหลวปิดเท่านั้นที่รู้ชื่อไฟล์ `identity/device.json` ที่เลิกใช้แล้ว.
- ความเข้ากันได้ของการรีเซ็ตเซสชันตอนนี้อยู่ในการย้ายข้อมูลคอนฟิกของ doctor:
  `session.idleMinutes` ถูกย้ายไปยัง `session.reset.idleMinutes`,
  `session.resetByType.dm` ถูกย้ายไปยัง `session.resetByType.direct` และนโยบายรีเซ็ตของ
  รันไทม์จะอ่านเฉพาะคีย์รีเซ็ตมาตรฐานเท่านั้น.
- ความเข้ากันได้ของคอนฟิกเดิมตอนนี้อยู่ภายใต้ `src/commands/doctor/` การตรวจสอบ
  `readConfigFileSnapshot()` ปกติจะไม่นำเข้าตัวตรวจจับเดิมของ doctor
  หรือใส่คำอธิบายประเด็นเดิม; `runDoctorConfigPreflight()` เพิ่มประเด็นเหล่านั้นสำหรับ
  การซ่อมแซม/รายงานของ doctor โฟลว์คอนฟิก doctor นำเข้า
  `src/commands/doctor/legacy-config.ts` และการซ่อมแซม profile-id ของ OAuth เก่าอยู่
  ภายใต้
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- คำสั่งที่ไม่ใช่ doctor จะไม่เรียกใช้การซ่อมแซมคอนฟิกเดิมโดยอัตโนมัติ ตัวอย่างเช่น
  `openclaw update --channel` ตอนนี้จะล้มเหลวเมื่อพบคอนฟิกเดิมที่ไม่ถูกต้องและขอให้
  ผู้ใช้เรียกใช้ doctor แทนการนำเข้าโค้ดย้ายข้อมูลของ doctor แบบเงียบ ๆ.
- Web push, APNs, Voice Wake, การตรวจสอบอัปเดต และสุขภาพคอนฟิกตอนนี้ใช้ตาราง SQLite ที่ใช้ร่วมกันแบบมีชนิด
  สำหรับการสมัครรับ, คีย์ VAPID, การลงทะเบียน Node, แถวทริกเกอร์,
  แถวการกำหนดเส้นทาง, สถานะการแจ้งเตือนอัปเดต และรายการสุขภาพคอนฟิก แทน
  บล็อบ JSON ทึบทั้งก้อน ตอนนี้การเขียนสแนปชอต Web push และ APNs จะกระทบยอด
  การสมัครรับ/การลงทะเบียนตามคีย์หลักแทนการล้างตาราง;
  สุขภาพคอนฟิกทำแบบเดียวกันตามพาธคอนฟิก.
  โมดูลรันไทม์ของรายการเหล่านี้แยกตัวอ่าน/ตัวเขียนสแนปชอต SQLite ออกจาก
  ตัวช่วยนำเข้า JSON เดิมที่ใช้เฉพาะ doctor.
- คอนฟิกโฮสต์ Node ตอนนี้ใช้แถวซิงเกิลตันแบบมีชนิดในฐานข้อมูล SQLite ที่ใช้ร่วมกัน;
  doctor นำเข้าไฟล์ `node.json` เก่าก่อนการใช้งานรันไทม์ปกติ.
- การจับคู่อุปกรณ์/Node, การจับคู่ช่องทาง, allowlist ของช่องทาง และสถานะบูตสแตรป
  ตอนนี้ใช้แถว SQLite แบบมีชนิดแทนบล็อบ JSON ทึบทั้งก้อน การอนุมัติการผูก Plugin
  และสถานะงาน cron ใช้การแยกแบบเดียวกัน: โมดูลรันไทม์เปิดเผย
  การดำเนินการที่หนุนด้วย SQLite และตัวช่วยสแนปชอตที่เป็นกลาง และการเขียนสแนปชอตการจับคู่/บูตสแตรป
  รวมถึงการอนุมัติการผูก Plugin จะกระทบยอดแถวตามคีย์หลัก
  แทนการตัดตารางทิ้ง ขณะที่ doctor นำเข้า/ลบไฟล์ JSON เก่าผ่าน
  โมดูล `src/commands/doctor/legacy/*`.
- ระเบียน Plugin ที่ติดตั้งแล้วตอนนี้อยู่ในดัชนี Plugin ที่ติดตั้งแล้วของ SQLite.
  การอ่าน/เขียนคอนฟิกรันไทม์จะไม่ย้ายข้อมูลหรือคงข้อมูล authored-config เก่า
  `plugins.installs` อีกต่อไป; doctor นำเข้ารูปแบบคอนฟิกเดิมนั้น
  ไปยัง SQLite ก่อนการใช้งานรันไทม์ปกติ.
- สแนปชอตกู้คืนข้อมูลประจำตัว QQBot ตอนนี้อยู่ในสถานะ Plugin ของ SQLite ภายใต้
  `qqbot/credential-backups` รันไทม์จะไม่เขียน
  `qqbot/data/credential-backup*.json` อีกต่อไป; doctor นำเข้าและลบไฟล์สำรองเดิมเหล่านั้น
  พร้อมกับอินพุตสถานะ QQBot อื่น ๆ.
- การวางแผนรีโหลด Gateway เปรียบเทียบสแนปชอตดัชนี Plugin ที่ติดตั้งแล้วของ SQLite ภายใต้
  เนมสเปซ diff ภายใน `installedPluginIndex.installRecords.*` การตัดสินใจรีโหลดของรันไทม์
  จะไม่ห่อแถวเหล่านั้นไว้ในออบเจ็กต์คอนฟิก `plugins.installs` ปลอมอีกต่อไป.
- การอัปเกรดข้อมูลประจำตัวของบัญชี Matrix แบบมีชื่อจะไม่เกิดขึ้นระหว่างการอ่านของรันไทม์
  อีกต่อไป doctor เป็นเจ้าของการเปลี่ยนชื่อ `credentials/matrix/credentials.json`
  ระดับบนสุดแบบเก่า เมื่อสามารถแก้บัญชี Matrix เดียว/ค่าเริ่มต้นได้.
- โมดูลรันไทม์การจับคู่หลักและ cron จะไม่ส่งออกตัวสร้างพาธ JSON เดิมอีกต่อไป
  โมดูลเดิมที่ doctor เป็นเจ้าของสร้างพาธต้นทาง `pending.json`, `paired.json`,
  `bootstrap.json` และ `cron/jobs.json` สำหรับการทดสอบนำเข้าและ
  การย้ายข้อมูลเท่านั้น การปรับรูปแบบงาน cron เดิมให้เป็นมาตรฐานและการนำเข้า run-log ของ cron
  อยู่ภายใต้ `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` นำเข้าไฟล์สถานะ JSON เดิม
  รวมถึงคอนฟิกโฮสต์ Node ไปยัง SQLite จาก doctor ตัวนำเข้าไฟล์เดิมใหม่
  ยังคงอยู่ภายใต้ `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` นำเข้า `sessions.json` เดิมและ
  ทรานสคริปต์ `*.jsonl` โดยตรงไปยัง SQLite และลบแหล่งที่สำเร็จ มัน
  จะไม่จัดสเตจทรานสคริปต์เดิมระดับรูตผ่าน
  `agents/<agentId>/sessions/*.jsonl` หรือสร้างเป้าหมาย JSONL มาตรฐานก่อน
  การนำเข้าอีกต่อไป.
- การตรวจสอบความสมบูรณ์ของสถานะโดย doctor จะไม่สแกนไดเรกทอรีเซสชันเดิมหรือ
  เสนอการลบ JSONL กำพร้าอีกต่อไป ไฟล์ทรานสคริปต์เดิมเป็นอินพุตการย้ายข้อมูล
  เท่านั้น และขั้นตอนการย้ายข้อมูลเป็นเจ้าของการนำเข้าและการลบแหล่งที่มา.
- การนำเข้ารีจิสทรี sandbox เดิมอยู่ภายใต้
  `src/commands/doctor/legacy/sandbox-registry.ts`; การอ่านและเขียนรีจิสทรี sandbox ที่ใช้งานอยู่ยังคงเป็น SQLite เท่านั้น.
- การซ่อมแซมสุขภาพ/การนำเข้าทรานสคริปต์เซสชันเดิมอยู่ภายใต้
  `src/commands/doctor/legacy/session-transcript-health.ts`; โมดูลคำสั่งรันไทม์
  จะไม่พกโค้ดแยกวิเคราะห์ทรานสคริปต์ JSONL หรือซ่อมแซม active-branch อีกต่อไป.

ไฮไลต์การรวมและการลบที่เสร็จสมบูรณ์:

- สถานะ Plugin ตอนนี้ใช้ฐานข้อมูล `state/openclaw.sqlite` ที่ใช้ร่วมกัน ตัวนำเข้า sidecar เดิมของ
  `plugin-state/state.sqlite` แบบเฉพาะ branch ถูกลบออกแล้วเพราะ
  เลย์เอาต์ SQLite นั้นไม่เคยถูกปล่อยใช้งาน ตัวช่วย probe/test รายงาน
  `databasePath` ที่ใช้ร่วมกันแทนการเปิดเผยพาธ SQLite เฉพาะสถานะ Plugin
- ตารางรันไทม์ของ Task และ Task Flow ตอนนี้อยู่ในฐานข้อมูล
  `state/openclaw.sqlite` ที่ใช้ร่วมกันแทน `tasks/runs.sqlite` และ
  `tasks/flows/registry.sqlite`; ตัวนำเข้า sidecar เดิมถูกลบออกด้วย
  เหตุผลเดียวกันว่าเลย์เอาต์นั้นไม่เคยถูกปล่อยใช้งาน
- `src/config/sessions/store.ts` ไม่ต้องใช้ `storePath` อีกต่อไปสำหรับ
  เมทาดาทาขาเข้า การอัปเดต route หรือการอ่าน updated-at การคงอยู่ของคำสั่ง การล้างข้อมูล session ของ CLI
  ความลึกของ subagent การ override การยืนยันตัวตน และอัตลักษณ์ session ของ transcript
  ใช้ API แถว agent/session การเขียนถูกนำไปใช้เป็นแพตช์แถว SQLite
  พร้อมการลองใหม่เมื่อเกิดความขัดแย้งแบบ optimistic
- การระบุเป้าหมายของ session ตอนนี้เปิดเผยเป้าหมายฐานข้อมูลต่อ agent ไม่ใช่พาธ
  `sessions.json` แบบเดิม Shared gateway, เมทาดาทา ACP, การซ่อมแซม route ของ doctor และ
  `openclaw sessions` จะไล่รายการ `agent_databases` รวมถึง agent ที่กำหนดค่าไว้
- การกำหนด route ของ session ใน Gateway ตอนนี้ใช้ `resolveGatewaySessionDatabaseTarget`;
  เป้าหมายที่คืนกลับมาจะมี `databasePath` และคีย์แถว SQLite ผู้สมัครแทน
  พาธไฟล์ session-store แบบเดิม
- ชนิดรันไทม์ของ session ช่องทางตอนนี้เปิดเผย `{agentId, sessionKey}` สำหรับ
  การอ่าน updated-at, เมทาดาทาขาเข้า และการอัปเดต last-route ชนิดความเข้ากันได้เดิม
  `saveSessionStore(storePath, store)` ถูกลบแล้ว
- พื้นผิวของรันไทม์ Plugin, extension API และ barrel ของ `config/sessions` ตอนนี้นำ
  โค้ด Plugin ไปใช้ตัวช่วยแถว session ที่รองรับด้วย SQLite export ความเข้ากันได้ของไลบรารีราก
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) ยังคงอยู่เป็น
  shim ที่เลิกใช้แล้วสำหรับผู้ใช้งานเดิม ตัวช่วยเดิม
  `resolveLegacySessionStorePath` ถูกลบแล้ว; การสร้างพาธ `sessions.json` แบบเดิม
  ตอนนี้อยู่เฉพาะใน migration และ fixture ทดสอบ
- `src/config/sessions/session-entries.sqlite.ts` ตอนนี้จัดเก็บรายการ session แบบ canonical
  ในฐานข้อมูลต่อ agent และรองรับแพตช์ read/upsert/delete ระดับแถว
  runtime upsert/patch/delete จะไม่สแกนหาตัวแปรต่างกรณีอักษรหรือ
  ตัดคีย์ alias เดิมอีกต่อไป; doctor เป็นเจ้าของการ canonicalize ตัวช่วยนำเข้า JSON
  แบบ standalone ถูกลบแล้ว และ migration จะ merge upsert แถวที่ใหม่กว่า
  แทนการแทนที่ตาราง session ทั้งหมด ตัวช่วย read/list/load สาธารณะ
  project เมทาดาทา session hot จากแถว `sessions` และ `conversations` ที่มีชนิดกำกับ;
  `entry_json` เป็นเงาความเข้ากันได้/debug และอาจ stale หรือไม่ถูกต้อง
  ได้โดยไม่สูญเสียอัตลักษณ์ session หรือบริบทการส่งมอบที่มีชนิดกำกับ
- `src/config/sessions/delivery-info.ts` ตอนนี้ระบุบริบทการส่งมอบจากแถว
  `sessions` + `conversations` + `session_conversations` แบบมีชนิดกำกับต่อ agent
  มันจะไม่สร้างอัตลักษณ์การส่งมอบของ runtime ใหม่จาก
  `session_entries.entry_json` อีกต่อไป; แถว conversation แบบมีชนิดกำกับที่หายไปเป็นปัญหา
  migration/repair ของ doctor ไม่ใช่ fallback ของ runtime
- การตัดสินใจรีเซ็ต stored-session ตอนนี้ให้ความสำคัญกับเมทาดาทา `sessions.session_scope`,
  `sessions.chat_type` และ `sessions.channel` แบบมีชนิดกำกับ การ parse `sessionKey`
  ยังคงมีเฉพาะสำหรับ suffix ของ thread/topic ที่ชัดเจนบนเป้าหมายคำสั่ง; การจัดประเภทการรีเซ็ต
  แบบ group เทียบกับ direct จะไม่มาจากรูปทรงคีย์อีกต่อไป
- การจัดประเภทการแสดงรายการ/สถานะ session ตอนนี้ใช้เมทาดาทา chat ที่มีชนิดกำกับและ
  ชนิด session ของ gateway มันจะไม่ถือว่า substring `:group:` หรือ `:channel:`
  ภายใน `session_key` เป็นความจริงถาวรของ group/direct อีกต่อไป
- การเลือกนโยบาย silent-reply ตอนนี้ใช้เฉพาะชนิด conversation หรือเมทาดาทา surface ที่ชัดเจน
  มันจะไม่เดานโยบาย direct/group จาก substring ของ
  `session_key` อีกต่อไป
- การระบุโมเดลแสดงผลของ session ตอนนี้รับ id ของ agent จากเป้าหมายฐานข้อมูล session
  SQLite แทนการแยกออกมาจาก `session_key`
- การเติมข้อมูลเป้าหมายประกาศ agent-to-agent ตอนนี้ใช้เฉพาะ `deliveryContext` จาก
  `sessions.list` แบบมีชนิดกำกับ มันจะไม่กู้คืน route ของ channel/account/thread
  จาก `origin` เดิม ฟิลด์ `last*` ที่ mirror ไว้ หรือรูปทรง `session_key` อีกต่อไป
- การปฏิเสธเป้าหมาย thread ของ `sessions_send` ตอนนี้อ่านเมทาดาทา routing ของ SQLite
  ที่มีชนิดกำกับ มันจะไม่ปฏิเสธหรือยอมรับเป้าหมายด้วยการ parse suffix ของ thread
  ออกจากคีย์เป้าหมายอีกต่อไป
- การตรวจสอบนโยบายเครื่องมือแบบ group-scoped ตอนนี้อ่าน routing conversation ของ SQLite
  ที่มีชนิดกำกับสำหรับ session ปัจจุบันหรือ session ที่ spawn ขึ้น มันจะไม่เชื่อถืออัตลักษณ์ group/channel
  ด้วยการถอดรหัส `sessionKey` อีกต่อไป; id ของ group ที่ caller ให้มาจะถูกทิ้งเมื่อ
  ไม่มีแถว session แบบมีชนิดกำกับรับรอง
- การจับคู่ override โมเดลของ channel ตอนนี้ใช้เมทาดาทา group และ parent
  conversation ที่ชัดเจน มันจะไม่ถอดรหัส id ของ parent conversation จาก
  `parentSessionKey` อีกต่อไป
- การสืบทอด stored model override ตอนนี้ต้องมี parent session key ที่ชัดเจน
  จากบริบท session แบบมีชนิดกำกับ มันจะไม่ derive parent overrides จาก
  suffix `:thread:` หรือ `:topic:` ใน `sessionKey` อีกต่อไป
- wrapper thread-info ของ session แบบเดิมและ parser thread ของ loaded-plugin ถูกลบแล้ว;
  ไม่มีโค้ด runtime ใด import `config/sessions/thread-info`
- ตัวช่วย conversation ของ channel จะไม่เปิดเผย bridge สำหรับการ parse full-session-key อีกต่อไป
  core ยังคง normalize id conversation ดิบที่ provider เป็นเจ้าของผ่าน
  `resolveSessionConversation(...)` แต่จะไม่สร้างข้อเท็จจริง route ใหม่
  จาก `sessionKey`
- การส่งมอบ completion, นโยบาย send และการบำรุงรักษา task จะไม่ derive ชนิด chat
  จากรูปทรง `session_key` อีกต่อไป parser คีย์ chat-type เดิมถูกลบแล้ว;
  พาธเหล่านี้ต้องใช้เมทาดาทา session แบบมีชนิดกำกับ บริบทการส่งมอบแบบมีชนิดกำกับ หรือ
  ศัพท์เป้าหมายการส่งมอบที่ชัดเจน
- รายการ/สถานะ session, diagnostics, การผูกบัญชี approval, การกรอง TUI heartbeat
  และสรุปการใช้งานจะไม่ขุด `SessionEntry.origin` เพื่อหา
  routing provider/account/thread/display อีกต่อไป การอ่าน `origin` ใน runtime
  ที่เหลืออยู่มีเพียงแนวคิดที่ไม่ใช่ session หรือวัตถุการส่งมอบของ turn ปัจจุบัน
- การค้นหา native conversation ของ approval-request ตอนนี้อ่านแถว routing session
  แบบมีชนิดกำกับต่อ agent มันจะไม่ parse อัตลักษณ์ conversation ของ channel/group/thread
  จาก `sessionKey` อีกต่อไป; เมทาดาทาแบบมีชนิดกำกับที่หายไปเป็นปัญหา migration/repair
- payload เหตุการณ์ session changed/chat/session ของ Gateway จะไม่ echo
  `SessionEntry.origin` หรือเงา route `last*` อีกต่อไป; client จะได้รับ
  `channel`, `chatType` และ `deliveryContext` แบบมีชนิดกำกับ
- การระบุการส่งมอบ Heartbeat ตอนนี้รับ `deliveryContext` ของ SQLite
  แบบมีชนิดกำกับได้โดยตรง และรันไทม์ heartbeat ส่งแถวการส่งมอบ session ต่อ agent
  แทนการพึ่งพาเงา `session_entries` ความเข้ากันได้สำหรับ routing ปัจจุบัน
- การระบุเป้าหมายการส่งมอบ agent แยกของ Cron ก็เติม route ปัจจุบัน
  จากแถวการส่งมอบ session แบบมีชนิดกำกับต่อ agent ก่อน fallback ไปยัง
  payload รายการความเข้ากันได้เช่นกัน
- การระบุ origin ของประกาศ subagent ตอนนี้ส่งต่อบริบทการส่งมอบ requester-session
  แบบมีชนิดกำกับผ่าน `loadRequesterSessionEntry` และให้ความสำคัญกับแถวนั้นเหนือ
  เงา `last*`/`deliveryContext` ความเข้ากันได้
- การอัปเดตเมทาดาทา session ขาเข้าตอนนี้ merge กับแถวการส่งมอบต่อ agent
  แบบมีชนิดกำกับก่อน; ฟิลด์การส่งมอบ `SessionEntry` เดิมเป็นเพียง fallback
  เมื่อไม่มีแถว conversation แบบมีชนิดกำกับ
- การแยกข้อมูลการส่งมอบ restart/update ตอนนี้ให้ `threadId` ของการส่งมอบ SQLite
  แบบมีชนิดกำกับชนะ fragment topic/thread ที่ parse จาก `sessionKey`; การ parse
  เป็นเพียง fallback สำหรับคีย์แบบ thread-shaped เดิม
- id ของ channel ในบริบท hook agent ตอนนี้ให้ความสำคัญกับอัตลักษณ์ conversation ของ SQLite
  แบบมีชนิดกำกับ จากนั้นเป็นเมทาดาทาข้อความที่ชัดเจน มันจะไม่ parse fragment provider/group/channel
  จาก `sessionKey` อีกต่อไป
- การสืบทอด external-route ของ Gateway `chat.send` ตอนนี้อ่านเมทาดาทา routing session ของ SQLite
  แบบมีชนิดกำกับแทนการอนุมาน scope channel/direct/group จาก
  ชิ้นส่วน `sessionKey` session แบบ channel-scoped จะสืบทอดเฉพาะเมื่อ channel ของ session
  แบบมีชนิดกำกับและชนิด chat ตรงกับบริบทการส่งมอบที่จัดเก็บไว้; session shared-main
  ยังคงใช้กฎ CLI/no-client-metadata ที่เข้มงวดกว่า
- wake ของ restart-sentinel และ routing การ continuation ตอนนี้อ่านแถว delivery/routing ของ SQLite
  แบบมีชนิดกำกับก่อน queue heartbeat wake หรือ continuation agent-turn ที่ routed
  มันจะไม่สร้างบริบทการส่งมอบใหม่จากเงา JSON ของ session-entry อีกต่อไป
- การระบุบริบท Gateway `tools.effective` ตอนนี้อ่านแถว delivery/routing ของ SQLite
  แบบมีชนิดกำกับสำหรับ input provider, account, target, thread และ reply-mode
  มันจะไม่กู้คืนฟิลด์ routing hot เหล่านั้นจากเงา origin ของ
  `session_entries.entry_json` ที่ stale อีกต่อไป
- routing ของ realtime voice consult ตอนนี้ระบุ parent/call delivery จากแถว session SQLite
  แบบมีชนิดกำกับต่อ agent มันจะไม่ fallback ไปยังเงา
  `SessionEntry.deliveryContext` ความเข้ากันได้เมื่อเลือก route ข้อความ agent แบบ embedded
- relay heartbeat ของ ACP spawn และ routing parent-stream ตอนนี้อ่าน parent delivery
  จากแถว session SQLite แบบมีชนิดกำกับ มันจะไม่สร้างบริบท parent delivery
  ใหม่จากเงา session-entry ความเข้ากันได้อีกต่อไป
- การคง route การส่งมอบ session ตอนนี้ตามเมทาดาทา chat แบบมีชนิดกำกับและ
  คอลัมน์การส่งมอบที่คงอยู่ มันจะไม่แยก hint ของ channel, marker direct/main
  หรือรูปทรง thread จาก `sessionKey` อีกต่อไป; route webchat ภายในจะ
  สืบทอดเป้าหมายภายนอกเฉพาะเมื่อ SQLite มีอัตลักษณ์ delivery แบบมีชนิดกำกับ/คงอยู่
  สำหรับ session อยู่แล้ว
- การแยกข้อมูลการส่งมอบ session แบบ generic ตอนนี้อ่านเฉพาะแถวการส่งมอบ session SQLite
  แบบมีชนิดกำกับที่ตรงกันเท่านั้น มันจะไม่ parse suffix thread/topic หรือ fallback
  จากคีย์แบบ thread-shaped ไปยังคีย์ session ฐานอีกต่อไป
- reply dispatch, การกู้คืน restart sentinel และ routing realtime voice consult
  ตอนนี้ใช้แถว session/conversation ของ SQLite แบบมีชนิดกำกับที่ตรงกันสำหรับ routing thread
  มันจะไม่กู้คืน id thread หรือบริบท delivery ของ base-session ด้วยการ parse
  session key แบบ thread-shaped อีกต่อไป
- การจำกัดประวัติ Embedded PI ตอนนี้ใช้ projection routing session ของ SQLite
  แบบมีชนิดกำกับ (`sessions` + `conversations` หลัก) สำหรับ provider, ชนิด chat
  และอัตลักษณ์ peer มันจะไม่ parse provider, DM, group หรือรูปทรง thread
  ออกจาก `sessionKey` อีกต่อไป
- การอนุมานการส่งมอบเครื่องมือ Cron ตอนนี้ใช้เฉพาะการส่งมอบที่ชัดเจนหรือบริบทการส่งมอบ
  แบบมีชนิดกำกับปัจจุบันเท่านั้น มันจะไม่ถอดรหัสเป้าหมาย channel, peer, account หรือ thread
  จาก `agentSessionKey` อีกต่อไป
- แถว session ของ runtime จะไม่พก alias route เดิม `lastProvider` อีกต่อไป
  ตัวช่วยและการทดสอบใช้ฟิลด์ `lastChannel` และ `deliveryContext` แบบมีชนิดกำกับ;
  migration ของ doctor เป็นที่เดียวที่ควรแปล alias route เก่าหรือเงา `origin` ที่คงอยู่
- เหตุการณ์ transcript, แถว VFS และแถว artifact ของเครื่องมือตอนนี้เขียนไปยังฐานข้อมูลต่อ agent
  ตาราง mapping transcript-file ระดับ global ที่ไม่เคยถูกปล่อยใช้งานถูกลบแล้ว; doctor
  บันทึกพาธ source เดิมในแถว migration ที่คงทนแทน
- การค้นหา transcript ของ runtime จะไม่สแกน byte offset ของ JSONL หรือ probe ไฟล์ transcript เดิมอีกต่อไป
  พาธ chat/media/history ของ Gateway อ่านแถว transcript จาก
  SQLite; session JSONL ตอนนี้เป็นเพียง input เดิมของ doctor ไม่ใช่ state ของ runtime
  หรือรูปแบบ export
- ความสัมพันธ์ parent และ branch ของ transcript ใช้เมทาดาทา
  `parentTranscriptScope: {agentId, sessionId}` แบบมีโครงสร้างใน header transcript ของ SQLite
  ไม่ใช่สตริง locator แบบ path-like `agent-db:...transcript_events...`
- contract ของ transcript manager จะไม่เปิดเผย constructor แบบ implicit persisted
  `create(cwd)` หรือ `continueRecent(cwd)` อีกต่อไป transcript manager แบบ persisted
  จะถูกเปิดด้วย scope `{agentId, sessionId}` ที่ชัดเจน; มีเพียง manager
  ในหน่วยความจำเท่านั้นที่ยังไม่ต้องมี scope สำหรับการทดสอบและ transform transcript ล้วน
- API store transcript ของ runtime ระบุ scope SQLite ไม่ใช่พาธ filesystem ตัวช่วย
  `resolve...ForPath` เดิมและตัวเลือกเขียน `transcriptPath` ที่ไม่ได้ใช้
  ถูกลบออกจาก caller ของ runtime แล้ว
- การระบุ session ของ runtime ตอนนี้ใช้ `{agentId, sessionId}` และต้องไม่ derive
  สตริง `sqlite-transcript://<agent>/<session>` สำหรับ boundary ภายนอก
  พาธ JSONL แบบ absolute เดิมเป็น input migration ของ doctor เท่านั้น
- ระเบียน direct-bridge ของ native hook relay ตอนนี้อยู่ในแถว
  `native_hook_relay_bridges` ที่มีชนิดกำกับและใช้ร่วมกัน keyed by relay id runtime จะไม่เขียน
  registry JSON ใน `/tmp` หรือระเบียน generic ทึบสำหรับระเบียน bridge อายุสั้นเหล่านั้นอีกต่อไป
- `runEmbeddedPiAgent(...)` ไม่มีพารามิเตอร์ transcript-locator อีกต่อไป
  ตัวบรรยาย worker ที่เตรียมไว้จะไม่รวมตัวระบุตำแหน่ง transcript อีกต่อไป สถานะเซสชันของรันไทม์
  และรันติดตามผลที่เข้าคิวจะพก `{agentId, sessionId}` แทน
  handle ของ transcript ที่อนุมานมา
- Embedded compaction ตอนนี้รับขอบเขต SQLite จาก `agentId` และ `sessionId`
  Hook ของ Compaction, การเรียก context-engine, การมอบหมายจาก CLI และการตอบกลับของโปรโตคอล
  ต้องไม่รับ handle ที่อนุมานมาในรูป `sqlite-transcript://...` โค้ด
  export/debug สามารถสร้าง artifact ผู้ใช้แบบชัดเจนจากแถวได้ แต่จะไม่ให้เส้นทาง export JSONL
  ของเซสชันแบบทั่วไปหรือป้อนชื่อไฟล์กลับเข้าไปเป็นอัตลักษณ์
  ของรันไทม์
- `/export-session` อ่านแถว transcript จาก SQLite และเขียนเฉพาะมุมมอง HTML
  แบบ standalone ที่ร้องขอเท่านั้น Viewer แบบ embedded จะไม่ประกอบหรือ
  ดาวน์โหลด JSONL ของเซสชันขึ้นใหม่จากแถวเหล่านั้นอีก
- การมอบหมาย context-engine จะไม่แยกวิเคราะห์ตัวระบุตำแหน่ง transcript เพื่อกู้คืน
  อัตลักษณ์ของ agent อีกต่อไป บริบทรันไทม์ที่เตรียมไว้จะพก `agentId`
  ที่ resolve แล้วเข้าไปใน adapter Compaction ในตัว
- การ rewrite transcript และการตัดทอน live tool-result ตอนนี้อ่านและ persist
  สถานะ transcript ด้วย `{agentId, sessionId}` และไม่อนุมานตัวระบุตำแหน่ง
  ชั่วคราวสำหรับ payload เหตุการณ์ transcript-update
- พื้นผิว helper ของสถานะ transcript จะไม่มี variant แบบอิงตัวระบุตำแหน่ง
  `readTranscriptState`, `replaceTranscriptStateEvents` หรือ
  `persistTranscriptStateMutation` อีกต่อไป ผู้เรียกรันไทม์ต้องใช้ API
  `{agentId, sessionId}` การนำเข้า Doctor อ่านไฟล์ legacy ด้วย path ไฟล์
  ที่ชัดเจนและเขียนแถว SQLite โดยจะไม่ migrate string ตัวระบุตำแหน่ง
- สัญญา session-manager ของรันไทม์จะไม่ expose `open(locator)`,
  `forkFrom(locator)` หรือ `setTranscriptLocator(...)` อีกต่อไป session
  manager แบบ persisted เปิดด้วย `{agentId, sessionId}` เท่านั้น; helper list/fork อยู่บน
  API session และ checkpoint แบบเน้นแถวแทน facade ของ transcript manager
- API reader ของ Gateway transcript เป็นแบบ scope-first โดยรับ
  `{agentId, sessionId}` และไม่ยอมรับตัวระบุตำแหน่ง transcript แบบ positional ที่
  อาจกลายเป็นอัตลักษณ์ของรันไทม์โดยไม่ตั้งใจ การแยกวิเคราะห์ตัวระบุตำแหน่ง transcript
  ที่ active ถูกลบออกแล้ว; path แหล่งที่มา legacy อ่านโดยโค้ดนำเข้า doctor เท่านั้น
- เหตุการณ์อัปเดต transcript ก็เป็นแบบ scope-first เช่นกัน `emitSessionTranscriptUpdate`
  จะไม่รับ string ตัวระบุตำแหน่งเปล่าอีกต่อไป และ listener route ด้วย
  `{agentId, sessionId}` โดยไม่แยกวิเคราะห์ handle
- การ broadcast session-message ของ Gateway resolve session key จากขอบเขต agent/session
  ไม่ใช่จากตัวระบุตำแหน่ง transcript ตัว resolver/cache จาก transcript-locator ไปเป็น session
  key แบบเก่าถูกลบแล้ว
- ตัวกรอง SSE ของ session-history ใน Gateway กรอง live update ด้วยขอบเขต agent/session
  มันจะไม่ canonicalize candidate ของตัวระบุตำแหน่ง transcript, realpath หรืออัตลักษณ์
  transcript รูปแบบไฟล์เพื่อใช้ตัดสินว่า stream ควรได้รับ update หรือไม่อีก
- Hook lifecycle ของเซสชันจะไม่อนุมานหรือ expose ตัวระบุตำแหน่ง transcript บน
  `session_end` อีกต่อไป ผู้บริโภค hook จะได้รับ `sessionId`, `sessionKey`, id ของเซสชันถัดไป
  และบริบท agent; ไฟล์ transcript ไม่เป็นส่วนหนึ่งของสัญญา lifecycle
- Hook reset จะไม่อนุมานหรือ expose ตัวระบุตำแหน่ง transcript เช่นกัน
  payload `before_reset` พกข้อความ SQLite ที่กู้คืนได้พร้อมเหตุผลการ reset
  ขณะที่อัตลักษณ์เซสชันยังอยู่ในบริบท hook
- การ reset ของ agent harness จะไม่รับตัวระบุตำแหน่ง transcript อีกต่อไป การ dispatch reset
  ถูกจำกัดขอบเขตด้วย `sessionId`/`sessionKey` พร้อมเหตุผล
- ชนิดเซสชันของส่วนขยาย agent จะไม่ expose `transcriptLocator` อีกต่อไป; extension
  ควรใช้บริบทเซสชันและ API รันไทม์แทนการเอื้อมไปหาอัตลักษณ์ transcript
  รูปแบบไฟล์
- Hook Compaction ของ Plugin จะไม่ expose ตัวระบุตำแหน่ง transcript อีกต่อไป บริบท hook
  พกอัตลักษณ์เซสชันอยู่แล้ว และการอ่าน transcript ต้องผ่าน API ที่รับรู้ขอบเขต SQLite
  แทน handle รูปแบบไฟล์
- Hook `before_agent_finalize` จะไม่ expose `transcriptPath` อีกต่อไป รวมถึง
  payload relay ของ hook native ด้วย Hook finalization ใช้เฉพาะบริบทเซสชัน
- การตอบกลับ reset ของ Gateway จะไม่สังเคราะห์ตัวระบุตำแหน่ง transcript บน entry
  ที่ส่งคืนอีกต่อไป การ reset สร้างแถว transcript SQLite, ส่งคืน entry เซสชันสะอาด
  และปล่อยให้การเข้าถึง transcript เป็นหน้าที่ของ reader ที่รับรู้ขอบเขต
- ผลลัพธ์ embedded run และ Compaction จะไม่เผยตัวระบุตำแหน่ง transcript สำหรับ
  การคิดบัญชีเซสชันอีกต่อไป Automatic Compaction อัปเดตเฉพาะ `sessionId` ที่ active,
  counter ของ Compaction และ metadata token
- ผลลัพธ์ embedded attempt จะไม่ส่งคืน `transcriptLocatorUsed` อีกต่อไป และ
  ผลลัพธ์ `compact()` ของ context-engine จะไม่ส่งคืนตัวระบุตำแหน่ง transcript อีกต่อไป
  ลูป retry ของรันไทม์ยอมรับเฉพาะ `sessionId` ตัวถัดไป
- ผลลัพธ์ append transcript ของ delivery-mirror จะไม่ส่งคืนตัวระบุตำแหน่ง
  transcript อีกต่อไป ผู้เรียกจะได้รับ `messageId` ที่ append แล้ว; สัญญาณอัปเดต transcript
  ใช้ขอบเขต SQLite
- Helper fork ของ parent-session ส่งคืนเฉพาะ `sessionId` ที่ fork แล้ว การเตรียม subagent
  ส่งขอบเขต agent/session ลูกไปยัง engine
- พารามิเตอร์ CLI runner และการ reseed ประวัติจะไม่รับตัวระบุตำแหน่ง transcript อีกต่อไป
  การอ่านประวัติของ CLI resolve ขอบเขต transcript SQLite จาก `{agentId,
sessionId}` และบริบท session key
- Fixture ทดสอบ CLI และ embedded-runner ตอนนี้ seed และอ่านแถว transcript SQLite
  ด้วย session id แทนการแกล้งทำว่าเซสชัน active เป็นไฟล์ `*.jsonl` หรือ
  ส่ง string `sqlite-transcript://...` ผ่านพารามิเตอร์รันไทม์
- เหตุการณ์ guard ของ session tool-result emit จากขอบเขตเซสชันที่รู้จัก แม้เมื่อ
  manager ในหน่วยความจำไม่มีตัวระบุตำแหน่งที่อนุมานมา การทดสอบของมันจะไม่ปลอมไฟล์
  transcript `/tmp/*.jsonl` ที่ active อีกต่อไป
- Helper BTW และ compaction-checkpoint ตอนนี้อ่านและ fork แถว transcript ด้วย
  ขอบเขต SQLite ตอนนี้ metadata checkpoint เก็บเฉพาะ session id และ leaf/entry id
  เท่านั้น; ตัวระบุตำแหน่งที่อนุมานมาจะไม่ถูกเขียนลงใน payload checkpoint อีก
- การ lookup transcript-key ของ Gateway ใช้ขอบเขต transcript SQLite ที่ขอบเขตโปรโตคอล
  และจะไม่ realpath หรือ stat ชื่อไฟล์ transcript อีกต่อไป
- การหมุน transcript ของ Automatic Compaction เขียนแถว transcript ตัวถัดไป
  ผ่าน SQLite transcript store โดยตรง แถวเซสชันเก็บเฉพาะอัตลักษณ์เซสชัน
  ตัวถัดไป ไม่ใช่ path JSONL ถาวรหรือตัวระบุตำแหน่งที่ persist ไว้
- Embedded context-engine Compaction ใช้ helper การหมุน transcript ที่ตั้งชื่อด้วย SQLite
  การทดสอบการหมุนจะไม่สร้าง path JSONL ตัวถัดไปหรือจำลองเซสชัน active เป็นไฟล์อีก
- การเก็บรักษารูปภาพขาออกแบบ managed ใช้ key ของแคช transcript-message จาก
  stats ของ transcript SQLite แทนการเรียก stat ของ filesystem
- lock เซสชันรันไทม์และ lane doctor legacy `.jsonl.lock` แบบ standalone
  ถูกลบแล้ว
- barrel รันไทม์ของ Microsoft Teams และ plugin SDK สาธารณะจะไม่ re-export
  helper file-lock เก่าอีกต่อไป; path สถานะ Plugin แบบ durable รองรับด้วย SQLite
- การ prune เซสชันตามอายุ/จำนวนและการ cleanup เซสชันแบบ explicit ถูกลบแล้ว
  Doctor เป็นเจ้าของการนำเข้า legacy; เซสชันที่ stale จะถูก reset หรือลบอย่างชัดเจน
- การตรวจสอบ integrity ของ Doctor จะไม่นับไฟล์ JSONL legacy เป็น transcript active
  ที่ valid สำหรับแถวเซสชัน SQLite อีกต่อไป สุขภาพของ transcript active เป็น SQLite-only;
  ไฟล์ JSONL legacy จะถูกรายงานเป็น input สำหรับ migration/orphan-cleanup
- Doctor จะไม่ถือว่า `agents/<agent>/sessions/` เป็นสถานะรันไทม์ที่จำเป็น
  อีกต่อไป มันจะ scan directory นั้นเฉพาะเมื่อมีอยู่แล้ว ในฐานะ input สำหรับการนำเข้า legacy
  หรือ orphan-cleanup
- Gateway `sessions.resolve`, path session patch/reset/compact, การ spawn subagent,
  fast abort, metadata ACP, เซสชันที่แยก Heartbeat และการ patch TUI
  จะไม่ migrate หรือ prune session key legacy เป็น side effect ของงานรันไทม์
  ปกติอีกต่อไป
- การ resolve เซสชันของคำสั่ง CLI ตอนนี้ส่งคืน `agentId` เจ้าของแทน
  `storePath` และจะไม่คัดลอกแถว main-session legacy ระหว่างการ resolve
  `--to` หรือ `--session-id` ตามปกติอีกต่อไป การ canonicalize main-row legacy เป็นของ
  doctor เท่านั้น
- การ resolve ความลึก subagent ของรันไทม์จะไม่อ่าน `sessions.json` หรือ store เซสชัน JSON5
  อีกต่อไป มันอ่าน `session_entries` ของ SQLite ด้วย agent id และ metadata
  depth/session legacy สามารถเข้ามาได้ผ่าน path นำเข้าของ doctor เท่านั้น
- override เซสชันของ auth profile persist ผ่าน upsert แถว `{agentId, sessionKey}`
  โดยตรง แทนการ lazy-load รันไทม์ session-store รูปแบบไฟล์
- gating แบบ verbose ของ auto-reply และ helper อัปเดตเซสชัน ตอนนี้อ่าน/upsert แถว
  เซสชัน SQLite ด้วยอัตลักษณ์เซสชัน และไม่ต้องใช้ path store legacy
  ก่อนแตะสถานะแถวที่ persist อีกต่อไป
- Helper metadata เซสชันของ command-run ตอนนี้ใช้ชื่อและ module path แบบเน้น entry;
  พื้นผิว helper คำสั่ง `session-store` แบบเก่าถูกลบแล้ว
- การ seed bootstrap header และการ harden ขอบเขต manual Compaction ตอนนี้ mutate
  แถว transcript SQLite โดยตรง ผู้เรียกรันไทม์ส่งอัตลักษณ์เซสชัน ไม่ใช่
  path `.jsonl` ที่เขียนได้
- การ replay การหมุนเซสชันแบบเงียบคัดลอก turn ล่าสุดของ user/assistant ด้วย
  `{agentId, sessionId}` จากแถว transcript SQLite มันจะไม่รับตัวระบุตำแหน่ง
  transcript ต้นทางหรือปลายทางอีกต่อไป
- แถวเซสชันรันไทม์ใหม่จะไม่เก็บตัวระบุตำแหน่ง transcript อีกต่อไป ผู้เรียกใช้
  `{agentId, sessionId}` โดยตรง; คำสั่ง export/debug สามารถเลือกชื่อไฟล์ output
  เมื่อ materialize แถวได้
- การเริ่มเซสชัน transcript แบบ persisted ใหม่ ตอนนี้จะเปิดแถว SQLite ด้วย
  ขอบเขตเสมอ session manager จะไม่ reuse path หรือตัวระบุตำแหน่ง transcript
  ยุคไฟล์ก่อนหน้าเป็นอัตลักษณ์สำหรับเซสชันใหม่อีกต่อไป
- เซสชัน transcript แบบ persisted ใช้ API ที่ชัดเจน
  `openTranscriptSessionManagerForSession({agentId, sessionId})` facade แบบ static เก่า
  `SessionManager.create/openForSession/list/forkFromSession` ถูกลบแล้ว เพื่อให้
  การทดสอบและโค้ดรันไทม์ไม่สามารถสร้างการค้นพบเซสชันยุคไฟล์ขึ้นใหม่โดยไม่ตั้งใจ
- รันไทม์ Plugin จะไม่ expose `api.runtime.agent.session.resolveTranscriptLocatorPath`
  อีกต่อไป; โค้ด Plugin ใช้ helper แถว SQLite และค่าขอบเขต
- พื้นผิว SDK สาธารณะ `session-store-runtime` ตอนนี้ export เฉพาะ helper แถวเซสชัน
  และแถว transcript เท่านั้น Helper schema/path/transaction ของ SQLite ที่เฉพาะเจาะจง
  อยู่ใน `sqlite-runtime`; helper open/close/reset ดิบยังเป็น local-only สำหรับ
  การทดสอบ first-party
- ตัว classifier ชื่อไฟล์ trajectory/checkpoint `.jsonl` legacy ตอนนี้อยู่ใน
  module session-file legacy ของ doctor การ validate เซสชันหลักจะไม่นำเข้า
  helper file-artifact เพื่อใช้ตัดสิน session id SQLite ปกติอีกต่อไป
- รัน subagent แบบ blocking ของ Active Memory ใช้แถว transcript SQLite แทน
  การสร้างไฟล์ `session.jsonl` ชั่วคราวหรือ persisted ใต้สถานะ Plugin
  ตัวเลือก `transcriptDir` แบบเก่าถูกลบแล้ว
- การสร้าง slug แบบครั้งเดียวและรัน planner ของ Crestodian ใช้แถว transcript SQLite
  แทนการสร้างไฟล์ `session.jsonl` ชั่วคราว
- รัน helper `llm-task` และการสกัด commitment ที่ซ่อนอยู่ก็ใช้แถว transcript SQLite
  เช่นกัน ดังนั้นเซสชัน helper เฉพาะโมเดลเหล่านี้จะไม่สร้างไฟล์ transcript
  JSON/JSONL ชั่วคราวอีกต่อไป
- `TranscriptSessionManager` ตอนนี้เป็นเพียงขอบเขต transcript SQLite ที่เปิดแล้ว
  โค้ดรันไทม์เปิดด้วย `openTranscriptSessionManagerForSession({agentId,
sessionId})`; flow create, branch, continue, list และ fork อยู่ใน helper แถว SQLite
  ที่เป็นเจ้าของ แทน facade manager แบบ static
  โค้ด Doctor/import/debug จัดการไฟล์ต้นทาง legacy ที่ชัดเจนภายนอก
  runtime session manager
- method facade `SessionManager.newSession()` และ
  `SessionManager.createBranchedSession()` ที่ stale ถูกลบแล้ว เซสชันใหม่
  และ descendant ของ transcript ถูกสร้างโดย workflow SQLite ที่เป็นเจ้าของ
  แทนการ mutate manager ที่เปิดอยู่แล้วให้กลายเป็นเซสชัน persisted อื่น
- การตัดสินใจ fork parent transcript และการสร้าง fork จะไม่รับ
  `storePath` หรือ `sessionsDir` อีกต่อไป โดยใช้ขอบเขต transcript SQLite
  `{agentId, sessionId}` แทน metadata path filesystem ที่เก็บไว้
- memory-host จะไม่ export helper classification ของ transcript ใน session-directory
  แบบ no-op อีกต่อไป; การกรอง transcript ตอนนี้อนุมานจาก metadata แถว SQLite
  ระหว่างการสร้าง entry
- การทดสอบ session-export ของ memory-host และ QMD ใช้ขอบเขต transcript SQLite
  path เก่า `agents/<agentId>/sessions/*.jsonl` ยังครอบคลุมเฉพาะในที่ที่การทดสอบ
  ตั้งใจพิสูจน์ความเข้ากันได้ของ doctor/import/export
- การตรวจสอบเซสชัน raw ของ QA-lab ตอนนี้ใช้ `sessions.list` ผ่าน Gateway
  แทนการอ่าน `agents/qa/sessions/sessions.json`; ฟีดแบ็ก MSteams
  ผนวกเข้ากับทรานสคริปต์ SQLite โดยตรงโดยไม่สร้าง path JSONL ปลอม
- รอบของช่องทางขาเข้าที่ใช้ร่วมกันตอนนี้พก `{agentId, sessionKey}` แทน
  `storePath` แบบเดิม path การบันทึกของ LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch, และ QQBot ตอนนี้อ่านเมทาดาต้า updated-at และบันทึกแถวเซสชันขาเข้า
  ผ่านตัวตน SQLite
- เอาการคงอยู่ของตัวระบุตำแหน่งทรานสคริปต์ออกจากแถวเซสชันที่ใช้งานอยู่แล้ว
  `resolveSessionTranscriptTarget` ส่งคืน `agentId`, `sessionId`, และเมทาดาต้า
  หัวข้อที่เป็นทางเลือก; doctor เป็นโค้ดเดียวที่นำเข้าชื่อไฟล์ทรานสคริปต์เดิม
- ส่วนหัวทรานสคริปต์รันไทม์เริ่มที่ SQLite เวอร์ชัน `1` การอัปเกรดรูปแบบ JSONL V1/V2/V3
  เก่าอยู่เฉพาะในการนำเข้า doctor และปรับส่วนหัวที่นำเข้าให้เป็น
  เวอร์ชันทรานสคริปต์ SQLite ปัจจุบันก่อนจัดเก็บแถว
- การ์ด database-first ตอนนี้ห้าม `SessionManager.listAll` และ
  `SessionManager.forkFromSession`; เวิร์กโฟลว์การแสดงรายการเซสชันและ fork/restore
  ต้องอยู่บน API SQLite แบบแถว/มีขอบเขต
- การ์ดยังห้ามชื่อ helper แบบเดิมสำหรับ parse ทรานสคริปต์ JSONL/ซ่อม active-branch
  นอกโค้ด doctor/import เพื่อไม่ให้รันไทม์ขยาย path การย้ายทรานสคริปต์เดิมตัวที่สอง
- การรัน PI แบบฝังปฏิเสธ handle ทรานสคริปต์ขาเข้า โดยใช้ตัวตน SQLite
  `{agentId, sessionId}` ก่อนเปิด worker และอีกครั้งก่อน attempt
  แตะสถานะทรานสคริปต์ อินพุต `/tmp/*.jsonl` ที่ค้างเก่าไม่สามารถเลือก
  เป้าหมายการเขียนรันไทม์ได้
- ระเบียน cache trace, payload Anthropic, raw stream, และไทม์ไลน์ diagnostics
  ตอนนี้เขียนไปยังแถว SQLite `diagnostic_events` แบบมีชนิด บันเดิลความเสถียรของ Gateway
  ตอนนี้เขียนไปยังแถว SQLite `diagnostic_stability_bundles` แบบมีชนิด path override JSONL เก่า
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, และ
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` ถูกเอาออกแล้ว และการจับภาพความเสถียรปกติ
  จะไม่เขียนไฟล์ `logs/stability/*.json` อีกต่อไป
- การคงอยู่ของ Cron ตอนนี้ reconcile แถว SQLite `cron_jobs` แทนการ
  ลบ/แทรกซ้ำทั้งตารางงานในแต่ละครั้งที่บันทึก การ writeback เป้าหมาย Plugin
  อัปเดตแถว cron ที่ตรงกันโดยตรงและคงสถานะ cron รันไทม์ไว้ใน
  ทรานแซกชัน state-database เดียวกัน
- caller รันไทม์ Cron ตอนนี้ใช้คีย์ store cron SQLite ที่เสถียร path
  `cron.store` เดิมเป็นอินพุตนำเข้าของ doctor เท่านั้น; path writeback เป้าหมายของ Gateway ฝั่ง production,
  การบำรุงรักษางาน, สถานะ, run-log, และ Telegram ใช้
  `resolveCronStoreKey` และไม่ทำ path-normalize คีย์อีกต่อไป ตอนนี้สถานะ Cron
  รายงาน `storeKey` แทนฟิลด์ `storePath` รูปไฟล์แบบเก่า
- การโหลดและการจัดกำหนดการรันไทม์ Cron ไม่ normalize รูปแบบงานที่คงอยู่แบบเดิมอีกต่อไป
  เช่น `jobId`, `schedule.cron`, `atMs` แบบตัวเลข, boolean แบบ string, หรือ
  `sessionTarget` ที่หายไป การนำเข้า legacy ของ doctor เป็นเจ้าของการซ่อมเหล่านั้นก่อนแทรกแถว
  ลงใน SQLite
- ACP spawn ไม่ resolve หรือคงอยู่ path ไฟล์ JSONL ของทรานสคริปต์อีกต่อไป การตั้งค่า spawn
  และ thread-bind คงอยู่แถวเซสชัน SQLite โดยตรงและเก็บ session id
  เป็นตัวตนทรานสคริปต์ที่ retained
- API เมทาดาต้าเซสชัน ACP ตอนนี้อ่าน/list/upsert แถว SQLite ตาม `agentId` และ
  ไม่เปิดเผย `storePath` เป็นส่วนหนึ่งของสัญญา entry เซสชัน ACP อีกต่อไป
- การบัญชีการใช้งานเซสชันและการรวมการใช้งานของ Gateway ตอนนี้ resolve ทรานสคริปต์
  ด้วย `{agentId, sessionId}` เท่านั้น cache cost/usage และสรุป discovered-session
  ไม่สังเคราะห์หรือส่งคืน string ตัวระบุตำแหน่งทรานสคริปต์อีกต่อไป
- Gateway chat append, การคงอยู่ abort-partial, `/sessions.send`, และ
  การเขียนทรานสคริปต์สื่อ webchat ผนวกโดยตรงผ่าน scope ทรานสคริปต์ SQLite
  helper transcript-injection ของ Gateway ไม่รับพารามิเตอร์
  `transcriptLocator` อีกต่อไป
- การค้นพบททรานสคริปต์ SQLite ตอนนี้แสดงเฉพาะ scope และ stats ของทรานสคริปต์:
  `{agentId, sessionId, updatedAt, eventCount}` helper compatibility
  `listSqliteSessionTranscriptLocators` ที่เลิกใช้แล้วและฟิลด์ `locator`
  ต่อแถวหายไปแล้ว
- รันไทม์ซ่อมทรานสคริปต์ตอนนี้เปิดเผยเฉพาะ
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` helper ซ่อมแบบใช้
  locator เก่าถูกลบแล้ว; โค้ด doctor/debug อ่าน path ไฟล์ต้นทางที่ชัดเจน
  และไม่ย้าย string locator
- รันไทม์ ledger การ replay ของ ACP ตอนนี้เก็บแถว replay ต่อเซสชันในฐานข้อมูลสถานะ
  SQLite ที่ใช้ร่วมกันแทน `acp/event-ledger.json`; doctor นำเข้าและ
  เอาไฟล์เดิมออก
- helper ตัวอ่านทรานสคริปต์ของ Gateway ตอนนี้อยู่ใน
  `src/gateway/session-transcript-readers.ts` แทนชื่อโมดูล
  `session-utils.fs` เก่า การตรวจสอบ fallback retry history ตั้งชื่อตาม
  เนื้อหาทรานสคริปต์ SQLite แทนพื้นผิว file-helper เก่า
- helper injected-chat และ compaction ของ Gateway ตอนนี้ส่ง scope ทรานสคริปต์ SQLite
  ผ่าน API helper ภายในแทนการตั้งค่าชื่อเป็น path ทรานสคริปต์หรือ
  ไฟล์ต้นทาง
- การตรวจจับ bootstrap continuation ตอนนี้ตรวจแถวทรานสคริปต์ SQLite ผ่าน
  `hasCompletedBootstrapTranscriptTurn`; ไม่เปิดเผยชื่อ helper รูปไฟล์อีกต่อไป
- การทดสอบ embedded-runner ตอนนี้ใช้ตัวตนทรานสคริปต์ SQLite และการเปิด
  transcript manager ใหม่ต้องมี `sessionId` ที่ชัดเจนเสมอ
- helper การทำดัชนีหน่วยความจำตอนนี้ใช้คำศัพท์ทรานสคริปต์ SQLite ตลอดทั้งระบบ:
  host export `listSessionTranscriptScopesForAgent` และ
  `sessionTranscriptKeyForScope`, คิว targeted sync คือ `sessionTranscripts`,
  hit การค้นหาเซสชันสาธารณะเปิดเผย path ทึบ `transcript:<agent>:<session>`,
  และคีย์แหล่ง DB ภายในคือ `session:<session>` ภายใต้
  `source_kind='sessions'` แทน path ไฟล์ปลอม
- helper persistent-dedupe ของ plugin SDK ทั่วไปไม่เปิดเผยตัวเลือกที่มีรูปไฟล์อีกต่อไป
  caller ให้คีย์ scope SQLite และแถว dedupe ถาวรอยู่ใน
  สถานะ Plugin ที่ใช้ร่วมกัน
- โทเค็น SSO ของ Microsoft Teams ย้ายจากไฟล์ JSON ที่ล็อกไว้ไปยังสถานะ Plugin
  SQLite แล้ว Doctor นำเข้า `msteams-sso-tokens.json`, สร้างคีย์โทเค็น SSO แบบ canonical
  ใหม่จาก payload และเอาไฟล์ต้นทางออก โทเค็น OAuth แบบ delegated
  ยังคงอยู่บนขอบเขตไฟล์ credential ส่วนตัวเดิม
- สถานะ cache การ sync ของ Matrix ย้ายจาก `bot-storage.json` ไปยังสถานะ Plugin
  SQLite แล้ว Doctor นำเข้า payload sync แบบ raw หรือ wrapped เดิมและเอา
  ไฟล์ต้นทางออก ไคลเอนต์ Matrix และ QA Matrix ที่ใช้งานอยู่ส่ง directory ราก sync-store
  ของ SQLite ไม่ใช่ path `sync-store.json` หรือ `bot-storage.json` ปลอม
- สถานะการย้าย crypto เดิมของ Matrix ย้ายจาก
  `legacy-crypto-migration.json` ไปยังสถานะ Plugin SQLite แล้ว Doctor นำเข้า
  ไฟล์สถานะเก่า; snapshot IndexedDB ของ Matrix SDK ย้ายจาก
  `crypto-idb-snapshot.json` ไปยัง blob ของ Plugin SQLite แล้ว recovery key และ
  credential ของ Matrix เป็นแถว plugin-state ของ SQLite; ไฟล์ JSON เก่าของรายการเหล่านี้เป็นเพียง
  อินพุตการย้ายของ doctor เท่านั้น
- log กิจกรรม Memory Wiki ตอนนี้ใช้สถานะ Plugin SQLite แทน
  `.openclaw-wiki/log.jsonl` provider การย้าย Memory Wiki นำเข้า log JSONL เก่า;
  markdown ของ wiki และเนื้อหา vault ของผู้ใช้ยังคงมีไฟล์เป็น backend ในฐานะ
  เนื้อหา workspace
- Memory Wiki ไม่สร้าง `.openclaw-wiki/state.json` หรือ directory
  `.openclaw-wiki/locks` ที่ไม่ได้ใช้อีกต่อไป provider การย้ายเอาไฟล์เมทาดาต้า
  Plugin ที่เลิกใช้แล้วเหล่านั้นออกหาก vault เก่ายังมีอยู่
- entry audit ของ Crestodian ตอนนี้ใช้สถานะ Plugin SQLite ของ core แทน
  `audit/crestodian.jsonl` Doctor นำเข้า log audit JSONL เดิมและ
  เอาออกหลังนำเข้าสำเร็จ
- entry audit การเขียน/สังเกต config ตอนนี้ใช้สถานะ Plugin SQLite ของ core
  แทน `logs/config-audit.jsonl` Doctor นำเข้า log audit JSONL เดิมและ
  เอาออกหลังนำเข้าสำเร็จ
- companion ของ macOS ไม่เขียน sidecar `logs/config-audit.jsonl` หรือ
  `logs/config-health.json` แบบ app-local ขณะแก้ไข `openclaw.json` อีกต่อไป ไฟล์ config
  ยังคงมีไฟล์เป็น backend, snapshot การกู้คืนอยู่ถัดจากไฟล์ config,
  และสถานะ audit/health ของ config แบบถาวรเป็นของ store SQLite ของ Gateway
- pending approval ของ Crestodian rescue ตอนนี้ใช้สถานะ Plugin SQLite ของ core
  แทน `crestodian/rescue-pending/*.json` Doctor นำเข้าไฟล์ pending approval
  เดิมและเอาออกหลังนำเข้าสำเร็จ
- สถานะ arm ชั่วคราวของ Phone Control ตอนนี้ใช้สถานะ Plugin SQLite แทน
  `plugins/phone-control/armed.json` Doctor นำเข้าไฟล์ armed-state เดิม
  ไปยัง namespace `phone-control/arm-state` และเอาไฟล์ออก
- Doctor ไม่ซ่อมทรานสคริปต์ JSONL แบบ in place หรือสร้างไฟล์ JSONL สำรอง
  อีกต่อไป โดยนำเข้า active branch ไปยัง SQLite และเอา source เดิมออก
- การค้นหาทรานสคริปต์ของ hook session-memory ใช้การอ่าน SQLite แบบ scope-only
  `{agentId, sessionId}` helper ของมันไม่รับหรือ derive ตัวระบุตำแหน่งทรานสคริปต์,
  การอ่านไฟล์เดิม, หรือตัวเลือก rewrite ไฟล์อีกต่อไป
- binding การสนทนา app-server ของ Codex ตอนนี้ key สถานะ Plugin SQLite ตาม
  คีย์เซสชัน OpenClaw หรือ scope `{agentId, sessionId}` ที่ชัดเจน ต้องไม่
  เก็บ binding fallback แบบ transcript-path ไว้
- การอ่าน mirrored-history ของ app-server Codex ใช้เฉพาะ scope ทรานสคริปต์ SQLite;
  ต้องไม่กู้คืนตัวตนจาก path ไฟล์ทรานสคริปต์
- path role-ordering และ compaction reset ไม่ unlink ไฟล์ทรานสคริปต์เก่าอีกต่อไป;
  reset หมุนเฉพาะแถวเซสชัน SQLite และตัวตนทรานสคริปต์
- response ของ Gateway reset และ checkpoint ส่งคืนแถวเซสชันสะอาดพร้อม session id
  ไม่สังเคราะห์ตัวระบุตำแหน่งทรานสคริปต์ SQLite ให้ไคลเอนต์อีกต่อไป
- Dreaming ของ memory-core ไม่ prune แถวเซสชันด้วยการ probe หาไฟล์ JSONL
  ที่หายไปอีกต่อไป การ cleanup subagent ผ่าน API รันไทม์เซสชันแทน
  การตรวจสอบการมีอยู่ของ filesystem การทดสอบ transcript-ingestion seed แถว SQLite
  โดยตรงแทนการสร้าง fixture `agents/<id>/sessions` หรือ placeholder
  locator
- การทำดัชนีทรานสคริปต์หน่วยความจำอาจเปิดเผย `transcript:<agentId>:<sessionId>` เป็น
  path hit การค้นหาเสมือนสำหรับ helper citation/read แหล่งดัชนีถาวรเป็นแบบ relational
  (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`) ดังนั้นค่านี้ไม่ใช่ locator ทรานสคริปต์รันไทม์,
  ไม่ใช่ path filesystem, และต้องไม่ถูกส่งกลับเข้า API รันไทม์เซสชันโดยเด็ดขาด
- สถานะหน่วยความจำของ Gateway doctor อ่านจำนวน short-term recall และ phase-signal
  จากแถว plugin-state ของ SQLite แทน `memory/.dreams/*.json`; เอาต์พุต CLI และ
  doctor ตอนนี้ติดป้าย storage นั้นเป็น store SQLite ไม่ใช่ path
- รันไทม์ memory-core, สถานะ CLI, เมธอด Gateway doctor, และ facade ของ plugin SDK
  ไม่ audit หรือ archive ไฟล์ `.dreams/session-corpus` เดิมอีกต่อไป
  ไฟล์เหล่านั้นเป็นอินพุตการย้ายเท่านั้น; doctor นำเข้าไปยัง SQLite และ
  ลบ source หลังการตรวจสอบ แถวหลักฐาน active session-ingestion
  ตอนนี้ใช้ path SQLite เสมือน `memory/session-ingestion/<day>.txt`; รันไทม์
  ไม่เขียนหรือ derive สถานะจาก `.dreams/session-corpus`
- artifact สาธารณะของ memory-core เปิดเผย event ของ host SQLite เป็น artifact JSON
  เสมือน `memory/events/memory-host-events.json`; ไม่ใช้ path source
  `.dreams/events.jsonl` เดิมซ้ำอีกต่อไป
- registry ของ sandbox container/browser ตอนนี้ใช้ตาราง SQLite
  `sandbox_registry_entries` ที่ใช้ร่วมกัน พร้อมคอลัมน์ session, image, timestamp,
  backend/config, และ browser port แบบมีชนิด Doctor นำเข้าไฟล์ registry JSON แบบ monolithic
  และ sharded เดิมและเอา source ที่สำเร็จออก การอ่านรันไทม์ใช้คอลัมน์แถวแบบมีชนิด
  เป็นแหล่งความจริง; `entry_json` เป็นเพียงสำเนาสำหรับ replay/debug
- Commitments ตอนนี้ใช้ตาราง `commitments` ที่ใช้ร่วมกันแบบมีชนิดแทน blob JSON
  ทั้ง store การบันทึก snapshot upsert ตาม commitment id และลบเฉพาะ
  แถวที่หายไปแทนการ clear และแทรกตารางใหม่ รันไทม์โหลด
  commitments จากคอลัมน์ scope, delivery-window, status, attempt, และ text
  แบบมีชนิด; `record_json` เป็นเพียงสำเนาสำหรับ replay/debug Doctor นำเข้า
  `commitments.json` เดิมและเอาออกหลังนำเข้าสำเร็จ
- นิยามงาน Cron, สถานะ schedule, และประวัติการรันไม่มี writer หรือ reader JSON
  ในรันไทม์อีกต่อไป รันไทม์ใช้แถว `cron_jobs` พร้อม schedule แบบมีชนิด,
  คอลัมน์ payload, delivery, failure-alert, session, status และ runtime-state รวมถึงเมตาดาต้า `cron_run_logs` ที่มีชนิดกำกับสำหรับสถานะ, สรุปการวินิจฉัย, สถานะ/ข้อผิดพลาดการส่งมอบ,
  เซสชัน/การรัน, โมเดล และยอดรวมโทเค็น `job_json` เป็นเพียงสำเนาสำหรับเล่นซ้ำ/ดีบัก; `state_json` เก็บการวินิจฉัยรันไทม์แบบซ้อนที่ยังไม่มีฟิลด์สำหรับคิวรีร้อน ขณะที่รันไทม์
  เติมฟิลด์สถานะร้อนกลับจากคอลัมน์ที่มีชนิดกำกับ doctor นำเข้า
  ไฟล์ `jobs.json`, `jobs-state.json` และ `runs/*.jsonl` เดิม แล้วลบ
  แหล่งข้อมูลที่นำเข้า การเขียนกลับเป้าหมาย Plugin จะอัปเดตแถว `cron_jobs`
  ที่ตรงกันแทนการโหลดและแทนที่ cron store ทั้งหมด
- การเริ่มต้น Gateway จะละเว้นเครื่องหมาย `notify: true` เดิมในการฉายภาพรันไทม์
  doctor จะแปลงเครื่องหมายเหล่านั้นเป็นการส่งมอบ SQLite แบบชัดเจนเมื่อ
  `cron.webhook` ถูกต้อง ลบเครื่องหมายที่ไม่มีผลเมื่อไม่ได้ตั้งค่า และเก็บ
  เครื่องหมายไว้พร้อมคำเตือนเมื่อ Webhook ที่กำหนดค่าไว้ไม่ถูกต้อง
- คิวการส่งออกและการส่งมอบเซสชันตอนนี้เก็บสถานะคิว, ชนิดรายการ,
  คีย์เซสชัน, ช่องทาง, เป้าหมาย, ID บัญชี, จำนวนการลองซ้ำ, ความพยายาม/ข้อผิดพลาดล่าสุด,
  สถานะการกู้คืน และเครื่องหมายการส่งของแพลตฟอร์มเป็นคอลัมน์ที่มีชนิดกำกับในตาราง
  `delivery_queue_entries` ที่ใช้ร่วมกัน การกู้คืนรันไทม์อ่านฟิลด์ร้อนเหล่านั้นจาก
  คอลัมน์ที่มีชนิดกำกับ และการเปลี่ยนแปลงการลองซ้ำ/การกู้คืนจะอัปเดตคอลัมน์เหล่านั้นโดยตรง
  โดยไม่เขียน JSON สำหรับเล่นซ้ำใหม่ เพย์โหลด JSON เต็มยังคงอยู่เฉพาะในฐานะ
  บล็อบสำหรับเล่นซ้ำ/ดีบักสำหรับเนื้อหาข้อความและข้อมูลเล่นซ้ำเย็นอื่นๆ
- ระเบียนรูปภาพขาออกที่จัดการตอนนี้ใช้แถว
  `managed_outgoing_image_records` ที่ใช้ร่วมกันและมีชนิดกำกับ โดยไบต์สื่อยังคงเก็บใน
  `media_blobs` ระเบียน JSON ยังคงเป็นเพียงสำเนาสำหรับเล่นซ้ำ/ดีบัก
- ค่ากำหนดตัวเลือกโมเดลของ Discord, แฮชการ deploy คำสั่ง และการผูกเธรด
  ตอนนี้ใช้สถานะ Plugin ใน SQLite ที่ใช้ร่วมกัน แผนนำเข้า JSON เดิมของส่วนเหล่านี้อยู่ในพื้นผิว
  setup/doctor migration ของ Plugin Discord ไม่ใช่ในโค้ด migration หลัก
- ตัวตรวจจับการนำเข้าดั้งเดิมของ Plugin ใช้โมดูลที่ตั้งชื่อตาม doctor เช่น
  `doctor-legacy-state.ts` หรือ `doctor-state-imports.ts`; โมดูลรันไทม์ช่องทางปกติ
  ต้องไม่นำเข้าตัวตรวจจับ JSON เดิม
- เคอร์เซอร์ catchup ของ BlueBubbles และเครื่องหมาย dedupe ขาเข้าตอนนี้ใช้สถานะ
  Plugin ใน SQLite ที่ใช้ร่วมกัน แผนนำเข้า JSON เดิมของส่วนเหล่านี้อยู่ในพื้นผิว
  setup/doctor migration ของ Plugin BlueBubbles ไม่ใช่ในโค้ด migration หลัก
- ออฟเซ็ตอัปเดตของ Telegram, แถวแคชสติกเกอร์, แถวแคชข้อความที่ส่งแล้ว,
  แถวแคชชื่อหัวข้อ และการผูกเธรดตอนนี้ใช้สถานะ Plugin ใน SQLite ที่ใช้ร่วมกัน
  แผนนำเข้า JSON เดิมของส่วนเหล่านี้อยู่ในพื้นผิว
  setup/doctor migration ของ Plugin Telegram ไม่ใช่ในโค้ด migration หลัก
- เคอร์เซอร์ catchup ของ iMessage, การแมป short-id ของการตอบกลับ และแถว dedupe ของ sent-echo
  ตอนนี้ใช้สถานะ Plugin ใน SQLite ที่ใช้ร่วมกัน ไฟล์ `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` และ `imessage/sent-echoes.jsonl` เดิมเป็น
  อินพุตของ doctor เท่านั้น
- แถว dedupe ข้อความของ Feishu ตอนนี้ใช้สถานะ Plugin ใน SQLite ที่ใช้ร่วมกันแทน
  ไฟล์ `feishu/dedup/*.json` แผนนำเข้า JSON เดิมของส่วนนี้อยู่ในพื้นผิว
  setup/doctor migration ของ Plugin Feishu ไม่ใช่ในโค้ด migration หลัก
- การสนทนา, โพล, บัฟเฟอร์อัปโหลดที่ค้างอยู่ และการเรียนรู้จากฟีดแบ็กของ Microsoft Teams
  ตอนนี้ใช้ตารางสถานะ/บล็อบของ Plugin ใน SQLite ที่ใช้ร่วมกัน เส้นทางอัปโหลดที่ค้างอยู่
  ใช้ `plugin_blob_entries` เพื่อให้บัฟเฟอร์สื่อถูกเก็บเป็น SQLite BLOB
  แทน JSON แบบ base64 ชื่อตัวช่วยรันไทม์ตอนนี้ใช้การตั้งชื่อแบบ SQLite/state
  แทนการตั้งชื่อ file-store แบบ `*-fs` และ shim `storePath` เดิมถูกลบ
  ออกจาก store เหล่านี้แล้ว แผนนำเข้า JSON เดิมของส่วนนี้อยู่ในพื้นผิว
  setup/doctor migration ของ Plugin Microsoft Teams
- สื่อขาออกที่โฮสต์โดย Zalo ตอนนี้ใช้ `plugin_blob_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนไฟล์ข้างเคียงชั่วคราว JSON/bin ของ `openclaw-zalo-outbound-media`
- HTML และเมตาดาต้าของตัวดู Diffs ตอนนี้ใช้ `plugin_blob_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนไฟล์ชั่วคราว `meta.json`/`viewer.html` เอาต์พุต PNG/PDF ที่เรนเดอร์แล้วคงเป็น
  การ materialize ชั่วคราว เพราะการส่งมอบของช่องทางยังต้องใช้พาธไฟล์
- เอกสารที่จัดการโดย Canvas ตอนนี้ใช้ `plugin_blob_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนไดเรกทอรีเริ่มต้น `state/canvas/documents` โฮสต์ Canvas ให้บริการบล็อบเหล่านั้น
  โดยตรง; ไฟล์โลคัลถูกสร้างเฉพาะสำหรับเนื้อหา operator แบบ `host.root`
  ที่ระบุชัดเจน หรือการ materialize ชั่วคราวเมื่อ media reader ปลายน้ำ
  ต้องใช้พาธ
- การตัดสินใจ audit ของ File Transfer ตอนนี้ใช้ `plugin_state_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนบันทึกรันไทม์ `audit/file-transfer.jsonl` ที่ไม่จำกัดขนาด doctor
  นำเข้าไฟล์ audit JSONL เดิมเข้าสู่สถานะ Plugin และลบแหล่งข้อมูล
  หลังนำเข้าสะอาดแล้ว
- lease กระบวนการ ACPX และตัวตนอินสแตนซ์ Gateway ตอนนี้ใช้สถานะ Plugin
  ใน SQLite ที่ใช้ร่วมกัน doctor นำเข้าไฟล์ `gateway-instance-id` เดิมเข้าสู่สถานะ Plugin
  และลบแหล่งข้อมูล
- สคริปต์ wrapper ที่ ACPX สร้างขึ้นและ Codex home ที่แยกไว้เป็นการ materialize ชั่วคราว
  ภายใต้ temp root ของ OpenClaw ไม่ใช่สถานะ OpenClaw แบบถาวร ระเบียนรันไทม์ ACPX
  แบบถาวรคือแถว lease ของ SQLite และแถว gateway-instance;
  พื้นผิว config `stateDir` ของ ACPX เดิมถูกลบแล้ว เพราะไม่มีสถานะรันไทม์
  ถูกเขียนไว้ที่นั่นอีกต่อไป
- ไฟล์แนบสื่อของ Gateway ตอนนี้ใช้ตาราง SQLite `media_blobs` ที่ใช้ร่วมกันเป็น
  byte store ตามหลัก พาธโลคัลที่ส่งคืนให้พื้นผิวความเข้ากันได้ของช่องทางและ sandbox
  เป็นการ materialize ชั่วคราวของแถวฐานข้อมูล ไม่ใช่ media store แบบถาวร
  allowlist สื่อรันไทม์ไม่รวม root เดิม
  `$OPENCLAW_STATE_DIR/media` หรือ `media` ใน config-dir อีกต่อไป; ไดเรกทอรีเหล่านั้นเป็น
  แหล่งนำเข้าของ doctor เท่านั้น
- Shell completion ไม่เขียนไฟล์แคช `$OPENCLAW_STATE_DIR/completions/*` อีกต่อไป
  เส้นทาง smoke ของ install, doctor, update และ release ใช้เอาต์พุต completion
  ที่สร้างขึ้นหรือการ source โปรไฟล์แทนไฟล์แคช completion แบบถาวร
- การ staging การอัปโหลด Skills ของ Gateway ตอนนี้ใช้แถว `skill_uploads` ที่ใช้ร่วมกัน
  เมตาดาต้าอัปโหลด, idempotency key และไบต์ archive อยู่ใน SQLite; installer
  ได้รับเฉพาะพาธ archive ที่ materialize ชั่วคราวระหว่างที่การติดตั้ง
  กำลังทำงาน
- ไฟล์แนบ inline ของ subagent ไม่ materialize ภายใต้ workspace
  `.openclaw/attachments/*` อีกต่อไป เส้นทาง spawn เตรียมรายการ seed ของ SQLite VFS,
  การรัน inline seed รายการเหล่านั้นเข้าสู่ namespace scratch ของรันไทม์ต่อเอเจนต์,
  และเครื่องมือที่อิงดิสก์ overlay scratch ของ SQLite นั้นสำหรับพาธไฟล์แนบ
  คอลัมน์ registry attachment-dir ของ subagent-run เดิมและ cleanup hook ถูกลบแล้ว
- การ hydrate รูปภาพของ CLI ไม่ดูแลไฟล์แคช `openclaw-cli-images` ที่เสถียรอีกต่อไป
  แบ็กเอนด์ CLI ภายนอกยังคงได้รับพาธไฟล์ แต่พาธเหล่านั้นเป็นการ materialize
  ชั่วคราวรายรันพร้อม cleanup
- การวินิจฉัย cache-trace, การวินิจฉัยเพย์โหลด Anthropic, การวินิจฉัย raw model stream,
  อีเวนต์ไทม์ไลน์การวินิจฉัย และบันเดิลเสถียรภาพของ Gateway ตอนนี้
  เขียนแถว SQLite แทนไฟล์ `logs/*.jsonl` หรือ
  `logs/stability/*.json`
  แฟล็กและ env var สำหรับ override พาธรันไทม์ถูกลบแล้ว; คำสั่ง export/debug
  สามารถ materialize ไฟล์จากแถวฐานข้อมูลได้โดยชัดเจน
- companion บน macOS ไม่มี writer `diagnostics.jsonl` แบบ rolling อีกต่อไป บันทึกของแอป
  ไปยัง unified logging และการวินิจฉัย Gateway แบบถาวรยังคงหนุนด้วย SQLite
- รายการระเบียน port-guardian ของ macOS ตอนนี้ใช้แถว
  `macos_port_guardian_records` ของ SQLite ที่ใช้ร่วมกันและมีชนิดกำกับ แทนไฟล์ JSON ใน Application Support
  หรือบล็อบ singleton แบบทึบ
- singleton lock ของ Gateway ตอนนี้ใช้แถว `state_leases` ของ SQLite ที่ใช้ร่วมกันและมีชนิดกำกับภายใต้
  scope `gateway_locks` แทนไฟล์ lock ใน temp-dir เอกสารแก้ปัญหา Fly และ OAuth
  ตอนนี้ชี้ไปที่ lease ของ SQLite/auth refresh lock แทน
  cleanup file-lock ที่ล้าสมัย
- สถานะ restart sentinel ของ Gateway ตอนนี้ใช้แถว
  `gateway_restart_sentinel` ของ SQLite ที่ใช้ร่วมกันและมีชนิดกำกับ แทน `restart-sentinel.json`; รันไทม์
  อ่านชนิด sentinel, สถานะ, routing, ข้อความ, continuation และสถิติจาก
  คอลัมน์ที่มีชนิดกำกับ `payload_json` เป็นเพียงสำเนาสำหรับเล่นซ้ำ/ดีบัก โค้ดรันไทม์ล้าง
  แถว SQLite โดยตรงและไม่พก plumbing cleanup ไฟล์อีกต่อไป
- สถานะ restart intent และ supervisor handoff ของ Gateway ตอนนี้ใช้แถว
  `gateway_restart_intent` และ `gateway_restart_handoff` ของ SQLite ที่ใช้ร่วมกันและมีชนิดกำกับ แทนไฟล์ข้างเคียง
  `gateway-restart-intent.json` และ
  `gateway-supervisor-restart-handoff.json`
- การประสาน singleton ของ Gateway ตอนนี้ใช้แถว `state_leases` ที่มีชนิดกำกับภายใต้
  `gateway_locks` แทนการเขียนไฟล์ `gateway.<hash>.lock` แถว lease
  ถือครอง owner ของ lock, expiry, heartbeat และเพย์โหลดดีบัก; SQLite ถือครอง
  ขอบเขต acquire/release แบบ atomic ตัวเลือกไดเรกทอรี file-lock ที่เลิกใช้แล้วถูกลบ;
  การทดสอบใช้ตัวตนแถว SQLite โดยตรง
- ตัวช่วยรายงานการใช้งาน cron เก่าที่ไม่มีการอ้างอิงซึ่งสแกนไฟล์ `cron/runs/*.jsonl`
  ถูกลบแล้ว รายงานประวัติการรัน Cron ควรอ่านแถว SQLite
  `cron_run_logs` ที่มีชนิดกำกับ
- การกู้คืนการ restart ของ main-session ตอนนี้ค้นหาเอเจนต์ตัวเลือกผ่าน registry
  `agent_databases` ของ SQLite แทนการสแกนไดเรกทอรี `agents/*/sessions`
- การกู้คืน session-corruption ของ Gemini ตอนนี้ลบเฉพาะแถวเซสชันใน SQLite;
  ไม่ต้องใช้ gate `storePath` เดิมหรือพยายาม unlink พาธ transcript JSONL
  ที่ derive มาอีกต่อไป
- การจัดการ path override ตอนนี้ถือค่า environment แบบ literal `undefined`/`null`
  ว่าไม่ได้ตั้งค่า ป้องกันฐานข้อมูล `undefined/state/*.sqlite`
  ใต้ repo-root โดยไม่ตั้งใจระหว่างการทดสอบหรือการ handoff ผ่าน shell
- ลายนิ้วมือสุขภาพ config ตอนนี้ใช้แถว `config_health_entries`
  ของ SQLite ที่ใช้ร่วมกันและมีชนิดกำกับ แทน `logs/config-health.json` ทำให้ไฟล์ config ปกติเป็น
  เอกสารการกำหนดค่าเดียวที่ไม่ใช่ credential companion บน macOS เก็บเฉพาะ
  สถานะสุขภาพแบบ process-local และไม่สร้างไฟล์ข้างเคียง JSON เก่าขึ้นใหม่
- รันไทม์ auth profile ไม่ได้นำเข้าหรือเขียนไฟล์ JSON credential อีกต่อไป
  credential store ตามหลักคือ SQLite; `auth-profiles.json`, `auth.json`
  ต่อเอเจนต์ และ `credentials/oauth.json` ที่ใช้ร่วมกันเป็นอินพุต doctor migration
  ที่ถูกลบหลังนำเข้า
- การทดสอบ save/state ของ auth profile ตอนนี้ assert ตาราง auth ของ SQLite ที่มีชนิดกำกับโดยตรง
  และใช้ชื่อไฟล์ auth-profile เดิมเฉพาะสำหรับอินพุต doctor migration
- `openclaw secrets apply` scrub เฉพาะไฟล์ config, env file และ
  auth-profile store ของ SQLite เท่านั้น มันไม่พก logic ความเข้ากันได้ที่แก้ไข
  `auth.json` ต่อเอเจนต์ที่เลิกใช้แล้วอีกต่อไป; doctor เป็นเจ้าของการนำเข้าและลบไฟล์นั้น
- แผนและการ apply migration secret ของ Hermes นำเข้าโปรไฟล์ API-key โดยตรง
  เข้าสู่ auth-profile store ของ SQLite ไม่เขียนหรือตรวจสอบ
  `auth-profiles.json` เป็นเป้าหมายขั้นกลางอีกต่อไป
- เอกสาร auth สำหรับผู้ใช้ตอนนี้อธิบาย
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` แทนการ
  บอกให้ผู้ใช้ตรวจสอบหรือคัดลอก `auth-profiles.json`; ชื่อ JSON เดิมของ OAuth/auth
  ยังคงถูกบันทึกไว้เฉพาะในฐานะอินพุต doctor-import
- ตัวช่วยพาธสถานะหลักไม่ expose ไฟล์ `credentials/oauth.json`
  ที่เลิกใช้แล้วอีกต่อไป ชื่อไฟล์เดิมอยู่เฉพาะในเส้นทางนำเข้า auth ของ doctor
- เอกสาร install, security, onboarding, model-auth และ SecretRef ตอนนี้อธิบาย
  แถว auth-profile ของ SQLite และการสำรอง/ย้ายข้อมูลทั้งสถานะ แทน
  ไฟล์ JSON auth-profile ต่อเอเจนต์
- การค้นพบโมเดล PI ตอนนี้ส่ง credential ตามหลักเข้าสู่ auth storage
  `pi-coding-agent` ในหน่วยความจำ มันไม่สร้าง, scrub หรือเขียน
  `auth.json` ต่อเอเจนต์ระหว่างการค้นพบอีกต่อไป
- การตั้งค่า trigger และ routing ของ Voice Wake ตอนนี้ใช้ตาราง SQLite ที่ใช้ร่วมกันและมีชนิดกำกับ
  แทน `settings/voicewake.json`, `settings/voicewake-routing.json` หรือ
  แถว generic แบบทึบ; doctor นำเข้าไฟล์ JSON เดิมและลบออกหลังจาก
  migration สำเร็จ
- สถานะ update-check ตอนนี้ใช้แถว `update_check_state` ที่ใช้ร่วมกันและมีชนิดกำกับ แทน
  `update-check.json` หรือบล็อบ generic แบบทึบ; doctor นำเข้า
  ไฟล์ JSON เดิมและลบออกหลังจาก migration สำเร็จ
- สถานะสุขภาพ config ตอนนี้ใช้แถว `config_health_entries` ที่ใช้ร่วมกันและมีชนิดกำกับ
  แทน `logs/config-health.json` หรือบล็อบ generic แบบทึบ; doctor
  นำเข้าไฟล์ JSON เดิมและลบออกหลังจาก migration สำเร็จ
- การอนุมัติการผูกการสนทนาของ Plugin ตอนนี้ใช้แถว
  `plugin_binding_approvals` ที่มีชนิดกำกับ แทนสถานะ SQLite ที่ใช้ร่วมกันแบบทึบหรือ
  `plugin-binding-approvals.json`; ไฟล์ดั้งเดิมเป็นอินพุตสำหรับการย้ายข้อมูลของ doctor
- การผูกกับการสนทนาปัจจุบันแบบทั่วไปตอนนี้จัดเก็บแถว
  `current_conversation_bindings` ที่มีชนิดกำกับ แทนการเขียนซ้ำ
  `bindings/current-conversations.json`; doctor นำเข้าไฟล์ JSON ดั้งเดิมและ
  ลบไฟล์หลังจากย้ายข้อมูลสำเร็จ
- บัญชีแยกประเภทการซิงก์แหล่งที่มาที่นำเข้าของ Memory Wiki ตอนนี้จัดเก็บแถวสถานะ Plugin ของ SQLite
  หนึ่งแถวต่อคีย์ vault/source แทนการเขียนซ้ำ `.openclaw-wiki/source-sync.json`;
  ผู้ให้บริการการย้ายข้อมูลนำเข้าและลบบัญชีแยกประเภท JSON ดั้งเดิม
- ระเบียน import-run ของ Memory Wiki ChatGPT ตอนนี้จัดเก็บแถวสถานะ Plugin ของ SQLite
  หนึ่งแถวต่อ vault/run id แทนการเขียน `.openclaw-wiki/import-runs/*.json`
  สแนปช็อต rollback ยังคงเป็นไฟล์ vault แบบชัดเจนจนกว่าการจัดเก็บถาวรของสแนปช็อต import-run
  จะถูกย้ายไปยังที่เก็บ blob
- ไดเจสต์ที่คอมไพล์แล้วของ Memory Wiki ตอนนี้จัดเก็บเป็นแถว blob ของ Plugin ใน SQLite แทนการ
  เขียน `.openclaw-wiki/cache/agent-digest.json` และ
  `.openclaw-wiki/cache/claims.jsonl` ผู้ให้บริการการย้ายข้อมูลนำเข้าไฟล์แคชเก่า
  และลบไดเรกทอรีแคชเมื่อว่างเปล่า
- การติดตามการติดตั้ง skill ของ ClawHub ตอนนี้จัดเก็บแถวสถานะ Plugin ของ SQLite หนึ่งแถวต่อ
  workspace/skill แทนการเขียนหรืออ่าน sidecar `.clawhub/lock.json` และ
  `.clawhub/origin.json` ตอนรันไทม์ โค้ดรันไทม์ใช้วัตถุสถานะ tracked-install
  แทน abstraction ของ lockfile/origin ที่มีรูปทรงเหมือนไฟล์ Doctor
  นำเข้า sidecar ดั้งเดิมจาก workspace ของ agent ที่กำหนดค่าไว้และลบออก
  หลังจากนำเข้าได้เรียบร้อย
- ดัชนี Plugin ที่ติดตั้งแล้วตอนนี้อ่านและเขียนแถว singleton `installed_plugin_index`
  ของ SQLite ร่วมแบบมีชนิดกำกับ แทน `plugins/installs.json`; ไฟล์ JSON
  ดั้งเดิมเป็นเพียงอินพุตสำหรับการย้ายข้อมูลของ doctor และจะถูกลบหลังนำเข้า
- helper สำหรับพาธ `plugins/installs.json` ดั้งเดิมตอนนี้อยู่ในโค้ด legacy ของ doctor
  โมดูล plugin-index ของรันไทม์เปิดเผยเฉพาะตัวเลือก persistence ที่มี SQLite หนุนหลัง
  ไม่ใช่พาธไฟล์ JSON
- sentinel การรีสตาร์ทของ Gateway, เจตนาการรีสตาร์ท, และสถานะการส่งต่อให้ supervisor ตอนนี้ใช้
  แถว SQLite ร่วมแบบมีชนิดกำกับ (`gateway_restart_sentinel`,
  `gateway_restart_intent`, และ `gateway_restart_handoff`) แทน blob ทึบแบบทั่วไป
  โค้ดรีสตาร์ทของรันไทม์ไม่มีสัญญา sentinel/intent/handoff ที่มีรูปทรงเหมือนไฟล์
- แคชซิงก์ของ Matrix, เมทาดาทาของที่เก็บ, การผูกเธรด, marker การตัดซ้ำขาเข้า,
  สถานะ cooldown ของการตรวจสอบตอนเริ่มต้น, สแนปช็อต crypto ของ SDK IndexedDB,
  ข้อมูลประจำตัว, และคีย์กู้คืน ตอนนี้ใช้ตารางสถานะ/blob ของ Plugin ใน SQLite ร่วม
  struct พาธของรันไทม์ไม่เปิดเผยพาธเมทาดาทา `storage-meta.json` อีกต่อไป;
  ชื่อไฟล์นั้นเป็นเพียงอินพุตสำหรับการย้ายข้อมูลดั้งเดิมเท่านั้น แผนการนำเข้า JSON ดั้งเดิมของสิ่งเหล่านี้
  อยู่ในพื้นผิว setup/doctor migration ของ Plugin Matrix
- การเริ่มต้นของ Matrix ไม่สแกน รายงาน หรือทำให้สถานะไฟล์ Matrix ดั้งเดิมเสร็จสมบูรณ์อีกต่อไป
  การตรวจหาไฟล์ Matrix, การสร้างสแนปช็อต crypto ดั้งเดิม, สถานะการย้ายข้อมูล restore ของ room-key,
  การนำเข้า, และการลบแหล่งที่มา ล้วนเป็นหน้าที่ของ doctor
- barrel การย้ายข้อมูลของรันไทม์ Matrix ถูกลบแล้ว helper สำหรับการตรวจหาและแก้ไขสถานะ/crypto ดั้งเดิม
  ถูกนำเข้าโดย Matrix doctor โดยตรง แทนการเป็นส่วนหนึ่งของพื้นผิว API ของรันไทม์
- marker การนำสแนปช็อตการย้ายข้อมูลของ Matrix กลับมาใช้ซ้ำตอนนี้อยู่ในสถานะ Plugin ของ SQLite
  แทน `matrix/migration-snapshot.json`; doctor ยังสามารถนำ archive ก่อนย้ายข้อมูลที่ตรวจสอบแล้วชุดเดิม
  กลับมาใช้ซ้ำได้โดยไม่ต้องเขียนไฟล์สถานะ sidecar
- cursor ของบัส Nostr และสถานะการเผยแพร่โปรไฟล์ตอนนี้ใช้สถานะ Plugin ของ SQLite ร่วม
  แผนการนำเข้า JSON ดั้งเดิมของสิ่งเหล่านี้อยู่ในพื้นผิว setup/doctor migration ของ Plugin Nostr
- toggle เซสชันของ Active Memory ตอนนี้ใช้สถานะ Plugin ของ SQLite ร่วมแทน
  `session-toggles.json`; การเปิด memory กลับมาอีกครั้งจะลบแถวแทนการเขียนวัตถุ JSON ซ้ำ
- ข้อเสนอของ Skill Workshop และตัวนับรีวิวตอนนี้ใช้สถานะ Plugin ของ SQLite ร่วม
  แทน store `skill-workshop/<workspace>.json` ต่อ workspace แต่ละข้อเสนอเป็นแถวแยก
  ภายใต้ `skill-workshop/proposals` และตัวนับรีวิวเป็นแถวแยกภายใต้ `skill-workshop/reviews`
- การรัน subagent ของผู้รีวิว Skill Workshop ตอนนี้ใช้ตัวแก้ไข transcript เซสชันของรันไทม์
  แทนการสร้างพาธเซสชัน sidecar `skill-workshop/<sessionId>.json`
- lease ของกระบวนการ ACPX ตอนนี้ใช้สถานะ Plugin ของ SQLite ร่วมภายใต้
  `acpx/process-leases` แทน registry ทั้งไฟล์ `process-leases.json`
  แต่ละ lease ถูกจัดเก็บเป็นแถวของตัวเอง โดยยังคงการเก็บกวาดกระบวนการค้างตอนเริ่มต้น
  โดยไม่มีพาธเขียน JSON ซ้ำในรันไทม์
- สคริปต์ wrapper ของ ACPX และ home ของ Codex แบบแยกโดดถูกสร้างใน temp root ของ
  OpenClaw สิ่งเหล่านี้จะถูกสร้างใหม่ตามต้องการและไม่ใช่อินพุตสำหรับ backup หรือ
  migration
- persistence ของ registry การรัน subagent ใช้แถว `subagent_runs` ร่วมแบบมีชนิดกำกับ
  พาธเก่า `subagents/runs.json` ตอนนี้เป็นเพียงอินพุตสำหรับการย้ายข้อมูลของ doctor และ
  ชื่อ helper ของรันไทม์ไม่อธิบายเลเยอร์สถานะว่าเป็น disk-backed อีกต่อไป
  การทดสอบรันไทม์ไม่สร้าง fixture `runs.json` ที่ไม่ถูกต้องหรือว่างเปล่าเพื่อพิสูจน์
  พฤติกรรม registry อีกต่อไป; แต่ seed/read แถว SQLite โดยตรง
- Backup staging ไดเรกทอรีสถานะก่อนทำ archive, คัดลอกไฟล์ที่ไม่ใช่ฐานข้อมูล,
  snapshot ฐานข้อมูล `*.sqlite` ด้วย `VACUUM INTO`, ละเว้น sidecar WAL/SHM
  สด, บันทึกเมทาดาทาสแนปช็อตใน manifest ของ archive, และบันทึก
  การรัน backup ที่เสร็จสมบูรณ์ใน SQLite พร้อม manifest ของ archive `openclaw backup
create` ตรวจสอบ archive ที่เขียนแล้วเป็นค่าเริ่มต้น; `--no-verify` คือ
  fast path แบบชัดเจน
- `openclaw backup restore` ตรวจสอบ archive ก่อนแตกไฟล์ ใช้ manifest ที่ normalize แล้วของ
  verifier ซ้ำ และกู้คืน asset ใน manifest ที่ตรวจสอบแล้วไปยังพาธต้นทางที่บันทึกไว้
  ต้องใช้ `--yes` สำหรับการเขียน และรองรับ `--dry-run`
  สำหรับแผน restore
- ตัวกรอง volatile-path ของ backup แบบเก่าถูกลบแล้ว Backup ไม่ต้องใช้
  live-tar skip list สำหรับไฟล์ JSON/JSONL ของเซสชันหรือ cron ดั้งเดิมอีกต่อไป เพราะสแนปช็อต SQLite
  ถูก staging ก่อนสร้าง archive
- การเตรียม workspace สำหรับ setup และ onboarding แบบธรรมดาไม่สร้างไดเรกทอรี
  `agents/<agentId>/sessions/` อีกต่อไป สิ่งเหล่านี้สร้างเฉพาะ config/workspace;
  แถวเซสชัน SQLite และแถว transcript จะถูกสร้างตามต้องการใน
  ฐานข้อมูลต่อ agent
- การซ่อมสิทธิ์ด้านความปลอดภัยตอนนี้มุ่งไปที่ฐานข้อมูล SQLite ระดับ global และต่อ agent
  รวมถึง sidecar WAL/SHM แทน `sessions.json` และไฟล์ transcript
  JSONL
- ชื่อรันไทม์ของ sandbox registry ตอนนี้อธิบายชนิด registry ของ SQLite โดยตรง
  แทนการพกคำศัพท์ registry JSON ดั้งเดิมผ่าน active store
- `openclaw reset --scope config+creds+sessions` ลบฐานข้อมูล
  `openclaw-agent.sqlite` ต่อ agent รวมถึง sidecar WAL/SHM ไม่ใช่เพียง
  ไดเรกทอรี `sessions/` ดั้งเดิม
- helper เซสชันรวมของ Gateway ตอนนี้ใช้ชื่อที่เน้น entry:
  `loadCombinedSessionEntriesForGateway` คืนค่า `{ databasePath, entries }`
  การตั้งชื่อ combined-store แบบเก่าถูกลบออกจาก caller ของรันไทม์แล้ว
- การ seed ช่อง Docker MCP ตอนนี้เขียนแถวเซสชันหลักและเหตุการณ์ transcript
  ลงในฐานข้อมูล SQLite ต่อ agent แทนการสร้าง
  `sessions.json` และ transcript แบบ JSONL
- hook session-memory ที่ bundle มา ตอนนี้แก้ไข context ของเซสชันก่อนหน้าจาก
  SQLite ด้วย `{agentId, sessionId}` และไม่สแกน จัดเก็บ หรือสังเคราะห์
  พาธ transcript หรือไดเรกทอรี `workspace/sessions` อีกต่อไป
- hook command-logger ที่ bundle มา ตอนนี้เขียนแถว audit ของคำสั่งไปยังตาราง SQLite ร่วม
  `command_log_entries` แทนการ append
  `logs/commands.log`
- allowlist การจับคู่ช่องตอนนี้เปิดเผยเฉพาะ helper อ่าน/เขียนที่มี SQLite หนุนหลัง
  ในรันไทม์และใน Plugin SDK ตัวแก้ไขพาธ `*-allowFrom.json` แบบเก่าและ
  file reader อยู่เฉพาะภายใต้โค้ดนำเข้า legacy ของ doctor
- `migration_runs` บันทึกการดำเนินการย้ายข้อมูลสถานะดั้งเดิมพร้อมสถานะ
  timestamp และรายงาน JSON
- `migration_sources` บันทึกแหล่งไฟล์ดั้งเดิมแต่ละไฟล์ที่นำเข้า พร้อม hash, size,
  จำนวน record, ตารางปลายทาง, run id, สถานะ, และสถานะการลบแหล่งที่มา
- `backup_runs` บันทึกพาธ archive ของ backup, สถานะ, และ manifest JSON
- schema ระดับ global ไม่เก็บตาราง registry `agents` ที่ไม่ได้ใช้ การค้นพบ
  ฐานข้อมูล agent คือ registry `agent_databases` ที่เป็น canonical จนกว่ารันไทม์
  จะมีเจ้าของ agent-record จริง
- config ของ model catalog ที่สร้างขึ้นถูกจัดเก็บในแถว SQLite ระดับ global แบบมีชนิดกำกับ
  `agent_model_catalogs` โดยใช้ไดเรกทอรี agent เป็นคีย์ caller ของรันไทม์ใช้
  `ensureOpenClawModelCatalog`; ไม่มี API compatibility สำหรับ `models.json` ใน
  โค้ดรันไทม์ implementation เขียน SQLite และ embedded PI registry ถูก hydrate
  จาก payload ที่จัดเก็บไว้นั้นโดยไม่สร้างไฟล์ `models.json`
- การ export markdown transcript เซสชันของ QMD และ config `memory.qmd.sessions` ถูกลบแล้ว
  ไม่มีคอลเลกชัน transcript ของ QMD, ไม่มีพาธรันไทม์ `qmd/sessions*`,
  และไม่มี bridge memory ของเซสชันที่มีไฟล์หนุนหลัง
- รันไทม์ memory-core นำเข้า helper การทำดัชนี transcript ของ SQLite จาก
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` ไม่ใช่
  subpath ของ QMD SDK subpath ของ QMD เก็บ compatibility re-export ไว้เฉพาะสำหรับ
  caller ภายนอกจนกว่าการ cleanup SDK รุ่น major จะลบออกได้
- `index.sqlite` ของ QMD เองตอนนี้เป็นการ materialization ชั่วคราวของรันไทม์ที่หนุนหลังโดย
  ตาราง SQLite หลัก `plugin_blob_entries` รันไทม์ไม่สร้าง sidecar ถาวร
  `~/.openclaw/agents/<agentId>/qmd` อีกต่อไป
- Plugin `memory-lancedb` แบบไม่บังคับไม่สร้าง
  `~/.openclaw/memory/lancedb` เป็น store ที่ OpenClaw จัดการโดยนัยอีกต่อไป มันเป็น
  backend LanceDB ภายนอกและยังคงปิดใช้งานจนกว่าผู้ปฏิบัติงานจะกำหนดค่า
  `dbPath` อย่างชัดเจน
- `check:database-first-legacy-stores` ทำให้ source รันไทม์ใหม่ที่จับคู่
  ชื่อ store ดั้งเดิมกับ API ระบบไฟล์แบบเขียนล้มเหลว และยังทำให้ source รันไทม์
  ที่นำ marker bridge transcript ที่ปลดระวางแล้วกลับมาใช้ใหม่
  `transcriptLocator` หรือ `sqlite-transcript://...` ล้มเหลว โค้ด migration, doctor, import,
  และ non-session export แบบชัดเจนยังคงได้รับอนุญาต ชื่อสัญญาดั้งเดิมที่กว้างกว่า
  เช่น `sessionFile`, `storePath`, และ facade ยุคไฟล์ของ `SessionManager` เก่า
  ยังมีเจ้าของปัจจุบันและต้องมีงาน guard การย้ายข้อมูลแยกต่างหาก
  ก่อนจะกลายเป็นการตรวจ preflight ที่จำเป็นได้ guard ตอนนี้ยังครอบคลุม
  store `cache/*.json` ของรันไทม์, sidecar
  `thread-bindings.json` แบบทั่วไป, JSON ของสถานะ cron/run-log, JSON ของ config health,
  sidecar restart และ lock, การตั้งค่า Voice Wake, การอนุมัติการผูก Plugin,
  JSON ของดัชนี Plugin ที่ติดตั้งแล้ว, audit JSONL ของ File Transfer, activity
  log ของ Memory Wiki, text log `command-logger` ที่ bundle มาแบบเก่า, และ knob diagnostics
  JSONL ของ pi-mono raw-stream และยังแบนชื่อโมดูล legacy ของ doctor ระดับ root แบบเก่า เพื่อให้
  โค้ด compatibility อยู่ภายใต้ `src/commands/doctor/` handler debug ของ Android
  ยังใช้ logcat/เอาต์พุตในหน่วยความจำแทนการ staging ไฟล์แคช `camera_debug.log` หรือ
  `debug_logs.txt`

## รูปแบบสคีมาเป้าหมาย

รักษาสคีมาให้ชัดเจน สถานะรันไทม์ที่โฮสต์เป็นเจ้าของใช้ตารางที่มีชนิดข้อมูลกำกับ สถานะทึบที่ Plugin เป็นเจ้าของใช้ `plugin_state_entries` / `plugin_blob_entries`; ไม่มีตาราง `kv` ทั่วไปของโฮสต์

ฐานข้อมูลส่วนกลาง:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

ฐานข้อมูล Agent:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

การค้นหาในอนาคตสามารถเพิ่มตาราง FTS ได้โดยไม่ต้องเปลี่ยนตารางเหตุการณ์มาตรฐาน:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

ค่าขนาดใหญ่ควรใช้คอลัมน์ `blob` ไม่ใช่การเข้ารหัสเป็นสตริง JSON เก็บ `value_json` ไว้สำหรับข้อมูลเชิงโครงสร้างขนาดเล็กที่ต้องยังตรวจสอบได้ด้วยเครื่องมือ SQLite แบบธรรมดา

`agent_databases` คือ registry มาตรฐานสำหรับบรานช์นี้ อย่าเพิ่มตาราง `agents` จนกว่าจะมีเจ้าของเรคคอร์ด Agent จริง; การกำหนดค่า Agent ยังคงอยู่ใน `openclaw.json`

## รูปแบบการย้ายข้อมูลของ Doctor

Doctor ควรเรียกขั้นตอนการย้ายข้อมูลที่ชัดเจนเพียงขั้นตอนเดียว ซึ่งรายงานได้และรันซ้ำได้อย่างปลอดภัย:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` เรียกใช้การย้ายข้อมูลสถานะหลังจากการตรวจล่วงหน้าการกำหนดค่าตามปกติ และสร้างข้อมูลสำรองที่ตรวจยืนยันแล้วก่อนนำเข้า การเริ่มต้นรันไทม์และ `openclaw migrate` ต้องไม่นำเข้าไฟล์สถานะ OpenClaw รุ่นเก่า

คุณสมบัติของการย้ายข้อมูล:

- การย้ายข้อมูลหนึ่งรอบจะค้นพบแหล่งไฟล์รุ่นเก่าทั้งหมดและสร้างแผนก่อนแก้ไขสิ่งใด
- Doctor สร้างอาร์ไคฟ์สำรองก่อนย้ายข้อมูลที่ตรวจยืนยันแล้วก่อนนำเข้าไฟล์รุ่นเก่า
- การนำเข้าเป็นแบบ idempotent และใช้พาธแหล่งที่มา, mtime, ขนาด, แฮช และตารางเป้าหมายเป็นคีย์
- ไฟล์แหล่งที่มาที่สำเร็จจะถูกลบหรือเก็บถาวรหลังจากฐานข้อมูลเป้าหมาย commit แล้ว
- การนำเข้าที่ล้มเหลวจะปล่อยแหล่งที่มาไว้เหมือนเดิมและบันทึกคำเตือนใน `migration_runs`
- โค้ดรันไทม์อ่านเฉพาะ SQLite หลังจากมีการย้ายข้อมูลแล้ว
- ไม่จำเป็นต้องมีเส้นทาง downgrade/export-to-runtime-files

## บัญชีรายการการย้ายข้อมูล

ย้ายสิ่งเหล่านี้เข้าสู่ฐานข้อมูลส่วนกลาง:

- การเขียนขณะรันของรีจิสทรีงานตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; ตัวนำเข้าไฟล์ข้างเคียง
  `tasks/runs.sqlite` ที่ยังไม่เคยจัดส่งถูกลบแล้ว การบันทึกสแนปช็อตทำ upsert ตาม id
  ของงาน และลบเฉพาะแถวงาน/การส่งมอบที่หายไปเท่านั้น
- การเขียนขณะรันของ Task Flow ตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; ตัวนำเข้าไฟล์ข้างเคียง
  `tasks/flows/registry.sqlite` ที่ยังไม่เคยจัดส่งถูกลบแล้ว การบันทึกสแนปช็อต
  ทำ upsert ตาม flow id และลบเฉพาะแถว flow ที่หายไปเท่านั้น
- การเขียนขณะรันของสถานะ Plugin ตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; ตัวนำเข้าไฟล์ข้างเคียง
  `plugin-state/state.sqlite` ที่ยังไม่เคยจัดส่งถูกลบแล้ว
- การค้นหาหน่วยความจำในตัวไม่ใช้ค่าเริ่มต้นเป็น `memory/<agentId>.sqlite` อีกต่อไป; ตาราง
  ดัชนีของมันอยู่ในฐานข้อมูลของเอเจนต์เจ้าของ และการเลือกใช้ไฟล์ข้างเคียงแบบชัดเจนผ่าน
  `memorySearch.store.path` ถูกเลิกใช้และย้ายไปอยู่ในการย้ายข้อมูลคอนฟิกของ doctor แล้ว
- การทำดัชนีใหม่ของหน่วยความจำในตัวรีเซ็ตเฉพาะตารางที่หน่วยความจำเป็นเจ้าของในฐานข้อมูลเอเจนต์
  เท่านั้น ต้องไม่แทนที่ไฟล์ SQLite ทั้งไฟล์ เพราะฐานข้อมูลเดียวกันนี้เป็นเจ้าของ
  เซสชัน ทรานสคริปต์ แถว VFS อาร์ทิแฟกต์ และแคชขณะรัน
- รีจิสทรีคอนเทนเนอร์/เบราว์เซอร์ Sandbox จาก JSON แบบโมโนลิทิกและแบบแบ่งชาร์ด การเขียน
  ขณะรันตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; การนำเข้า JSON เดิมยังคงอยู่
- นิยามงาน Cron, สถานะกำหนดการ และประวัติการรัน ตอนนี้ใช้ SQLite ที่ใช้ร่วมกัน;
  doctor นำเข้า/ลบไฟล์เดิม `jobs.json`, `jobs-state.json` และ
  `cron/runs/*.jsonl`
- ตัวตน/การยืนยันตัวตนของอุปกรณ์, push, การตรวจอัปเดต, commitments, แคชโมเดล OpenRouter,
  ดัชนี Plugin ที่ติดตั้ง และการผูก app-server
- ระเบียนการจับคู่และ bootstrap ของอุปกรณ์/Node ตอนนี้ใช้ตาราง SQLite แบบมีชนิด
- ผู้สมัครรับการแจ้งเตือน device-pair และตัวทำเครื่องหมาย delivered-request ตอนนี้ใช้ตาราง
  plugin-state ของ SQLite ที่ใช้ร่วมกันแทน `device-pair-notify.json`
- ระเบียนสายโทรด้วยเสียงตอนนี้ใช้ตาราง plugin-state ของ SQLite ที่ใช้ร่วมกันภายใต้ namespace
  `voice-call` / `calls` แทน `calls.jsonl`; CLI ของ Plugin tail และสรุปประวัติสาย
  ที่มี SQLite หนุนหลัง
- เซสชัน Gateway ของ QQBot, ระเบียน known-user และแคชคำอ้างอิง ref-index ตอนนี้ใช้สถานะ
  Plugin ของ SQLite ภายใต้ namespace ของ `qqbot` (`sessions`, `known-users`,
  `ref-index`) แทน `session-*.json`, `known-users.json` และ
  `ref-index.jsonl`; การย้ายข้อมูล doctor/setup ของ QQBot นำเข้าและลบไฟล์เดิม
- ค่ากำหนดตัวเลือกโมเดลของ Discord, แฮช command-deploy และการผูกเธรด
  ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้ namespace ของ `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  แทน `model-picker-preferences.json`, `command-deploy-cache.json` และ
  `thread-bindings.json`; การย้ายข้อมูล doctor/setup ของ Discord นำเข้าและ
  ลบไฟล์เดิม
- เคอร์เซอร์ catchup และตัวทำเครื่องหมาย dedupe ขาเข้าของ BlueBubbles ตอนนี้ใช้สถานะ Plugin
  ของ SQLite ภายใต้ namespace ของ `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  แทน `bluebubbles/catchup/*.json` และ
  `bluebubbles/inbound-dedupe/*.json`; การย้ายข้อมูล doctor/setup ของ BlueBubbles
  นำเข้าและลบไฟล์เดิม
- ออฟเซ็ตอัปเดตของ Telegram, รายการแคชสติกเกอร์, รายการแคชข้อความ reply-chain,
  รายการแคช sent-message, รายการแคชชื่อหัวข้อ และการผูกเธรด
  ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้ namespace ของ `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) แทน `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` และ
  `thread-bindings-*.json`; การย้ายข้อมูล doctor/setup ของ Telegram นำเข้าและ
  ลบไฟล์เดิม
- เคอร์เซอร์ catchup ของ iMessage, การแมป short-id ของ reply และแถว dedupe sent-echo
  ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้ namespace ของ `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) แทน `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` และ `imessage/sent-echoes.jsonl`; การย้ายข้อมูล
  doctor/setup ของ iMessage นำเข้าและลบไฟล์เดิม
- บทสนทนา, โพล, โทเค็น SSO และ feedback learnings ของ Microsoft Teams ตอนนี้
  ใช้ namespace สถานะ Plugin ของ SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) แทน `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` และ `*.learnings.json`; การย้ายข้อมูล
  doctor/setup ของ Microsoft Teams นำเข้าและเก็บถาวรไฟล์เดิม
  การอัปโหลดที่รอดำเนินการเป็นแคช SQLite อายุสั้น และไฟล์แคช JSON เก่า
  จะไม่ถูกย้ายข้อมูล
- แคชซิงก์ของ Matrix, เมทาดาทาพื้นที่จัดเก็บ, การผูกเธรด, ตัวทำเครื่องหมาย dedupe ขาเข้า,
  สถานะ cooldown สำหรับการตรวจสอบตอนเริ่มต้น, ข้อมูลประจำตัว, คีย์กู้คืน และสแนปช็อตคริปโต
  IndexedDB ของ SDK ตอนนี้ใช้ namespace สถานะ/blob ของ Plugin ใน SQLite ภายใต้
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  แทน `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` และ `crypto-idb-snapshot.json`; การย้ายข้อมูล doctor/setup
  ของ Matrix นำเข้าและลบไฟล์เดิมเหล่านั้นจากรากพื้นที่จัดเก็บ Matrix ที่กำหนดขอบเขตตามบัญชี
- เคอร์เซอร์บัสและสถานะการเผยแพร่โปรไฟล์ของ Nostr ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้
  namespace ของ `nostr` (`bus-state`, `profile-state`) แทน
  `bus-state-*.json` และ `profile-state-*.json`; การย้ายข้อมูล doctor/setup
  ของ Nostr นำเข้าและลบไฟล์เดิม
- ตัวสลับเซสชันของ Active Memory ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้
  `active-memory/session-toggles` แทน `session-toggles.json`
- คิวข้อเสนอและตัวนับรีวิวของ Skill Workshop ตอนนี้ใช้สถานะ Plugin ของ SQLite
  ภายใต้ `skill-workshop/proposals` และ `skill-workshop/reviews` แทน
  ไฟล์ `skill-workshop/<workspace>.json` ต่อ workspace
- คิวการส่งมอบขาออกและการส่งมอบเซสชันตอนนี้ใช้ตาราง SQLite ส่วนกลาง
  `delivery_queue_entries` ร่วมกัน ภายใต้ชื่อคิวที่แยกกัน
  (`outbound-delivery`, `session-delivery`) แทนไฟล์ที่คงทน
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` และ
  `session-delivery-queue/*.json` ขั้นตอน legacy-state ของ doctor นำเข้า
  แถวที่รอดำเนินการและล้มเหลว ลบตัวทำเครื่องหมาย delivered ที่ค้างอยู่ และลบไฟล์
  JSON เก่าหลังนำเข้า ฟิลด์ hot routing และ retry เป็นคอลัมน์แบบมีชนิด; เพย์โหลด
  JSON ถูกเก็บไว้เฉพาะเพื่อ replay/debug เท่านั้น
- สัญญาเช่ากระบวนการ ACPX ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้ `acpx/process-leases`
  แทน `process-leases.json`
- เมทาดาทาการรันสำรองและการย้ายข้อมูล

ย้ายรายการเหล่านี้ไปยังฐานข้อมูลเอเจนต์:

- รากเซสชันเอเจนต์และเพย์โหลด session-entry รูปทรงที่เข้ากันได้ ดำเนินการแล้วสำหรับ
  การเขียนขณะรัน: เมทาดาทาเซสชันร้อนสามารถ query ได้ใน `sessions` ขณะที่เพย์โหลด
  `SessionEntry` เต็มรูปทรงเดิมยังคงอยู่ใน `session_entries`
- เหตุการณ์ทรานสคริปต์เอเจนต์ ดำเนินการแล้วสำหรับการเขียนขณะรัน
- เช็กพอยต์ Compaction และสแนปช็อตทรานสคริปต์ ดำเนินการแล้วสำหรับการเขียนขณะรัน:
  สำเนาทรานสคริปต์ของเช็กพอยต์เป็นแถวทรานสคริปต์ใน SQLite และเมทาดาทาเช็กพอยต์
  ถูกบันทึกใน `transcript_snapshots` ตัวช่วยเช็กพอยต์ของ Gateway ตอนนี้เรียกค่าเหล่านี้ว่า
  สแนปช็อตทรานสคริปต์แทนไฟล์ต้นทาง
- namespace scratch/workspace ของ VFS เอเจนต์ ดำเนินการแล้วสำหรับการเขียน VFS ขณะรัน
- เพย์โหลดไฟล์แนบของ subagent ดำเนินการแล้วสำหรับการเขียนขณะรัน: สิ่งเหล่านี้เป็นรายการ
  seed ของ SQLite VFS และไม่ใช่ไฟล์ workspace ที่คงทนอีกต่อไป
- อาร์ทิแฟกต์เครื่องมือ ดำเนินการแล้วสำหรับการเขียนขณะรัน
- อาร์ทิแฟกต์การรัน ดำเนินการแล้วสำหรับการเขียนขณะรันของ worker ผ่านตาราง
  `run_artifacts` ต่อเอเจนต์
- แคชขณะรันแบบ local ของเอเจนต์ ดำเนินการแล้วสำหรับการเขียนแคชขณะรันของ worker
  ที่กำหนดขอบเขตผ่านตาราง `cache_entries` ต่อเอเจนต์ แคชโมเดลระดับ Gateway
  ยังคงอยู่ในฐานข้อมูลส่วนกลาง เว้นแต่มันจะกลายเป็นข้อมูลเฉพาะเอเจนต์
- บันทึกสตรีมแม่ของ ACP ดำเนินการแล้วสำหรับการเขียนขณะรัน
- เซสชันบัญชีแยกประเภท replay ของ ACP ดำเนินการแล้วสำหรับการเขียนขณะรันผ่าน
  `acp_replay_sessions` และ `acp_replay_events`; `acp/event-ledger.json`
  เดิมยังคงอยู่เฉพาะในฐานะอินพุตของ doctor
- เมทาดาทาเซสชัน ACP ดำเนินการแล้วสำหรับการเขียนขณะรันผ่าน `acp_sessions`; บล็อก
  `entry.acp` เดิมใน `sessions.json` เป็นอินพุตการย้ายข้อมูลของ doctor เท่านั้น
- ไฟล์ข้างเคียง trajectory เมื่อไม่ใช่ไฟล์ส่งออกแบบชัดเจน ดำเนินการแล้วสำหรับการเขียน
  ขณะรัน: การจับ trajectory เขียนแถว `trajectory_runtime_events` ในฐานข้อมูลเอเจนต์
  และ mirror อาร์ทิแฟกต์ที่กำหนดขอบเขตตาม run เข้า SQLite ไฟล์ข้างเคียงเดิมเป็นอินพุต
  นำเข้าของ doctor เท่านั้น; export สามารถสร้างเอาต์พุต support-bundle JSONL ใหม่ได้
  แต่ไม่อ่านหรือย้ายข้อมูลไฟล์ข้างเคียง trajectory/transcript เก่าขณะรัน
  การจับ trajectory ขณะรันเปิดเผย scope ของ SQLite; ตัวช่วยพาธ JSONL ถูกแยกไว้สำหรับ
  การสนับสนุน export/debug และไม่ถูก re-export จากโมดูล runtime
  เมทาดาทา trajectory ของ embedded-runner บันทึกตัวตน `{agentId, sessionId, sessionKey}`
  แทนการคงอยู่ของตัวระบุตำแหน่งทรานสคริปต์

คงรายการเหล่านี้ให้มีไฟล์หนุนหลังไว้ก่อน:

- `openclaw.json`
- ไฟล์ข้อมูลประจำตัวของ provider หรือ CLI
- manifest ของ Plugin/package
- workspace ของผู้ใช้และ Git repositories เมื่อเลือกโหมดดิสก์
- logs ที่ตั้งใจให้ operator tail เว้นแต่ surface ของ log เฉพาะจะถูกย้าย

## แผนการย้ายข้อมูล

### ระยะที่ 0: ตรึงขอบเขตให้ชัดเจน

ทำให้ขอบเขต durable-state ชัดเจนก่อนย้ายแถวเพิ่มเติม:

- เพิ่มตาราง `migration_runs` ลงในฐานข้อมูลส่วนกลาง
  ดำเนินการแล้วสำหรับรายงานการดำเนินการย้ายข้อมูล legacy-state
- เพิ่มบริการย้ายสถานะที่ doctor เป็นเจ้าของเพียงบริการเดียวสำหรับการนำเข้าจากไฟล์สู่ฐานข้อมูล
  ดำเนินการแล้ว: `openclaw doctor --fix` ใช้ implementation การย้ายข้อมูล legacy-state
- ทำให้ `plan` เป็นแบบอ่านอย่างเดียว และทำให้ `apply` สร้างข้อมูลสำรอง นำเข้า ตรวจสอบ
  แล้วจึงลบหรือกักกันไฟล์เก่า
  ดำเนินการแล้ว: doctor สร้างข้อมูลสำรองก่อนย้ายข้อมูลที่ตรวจสอบแล้ว ส่งพาธข้อมูลสำรอง
  เข้า `migration_runs` และใช้พาธนำเข้า/ลบซ้ำ
- เพิ่มการแบนแบบ static เพื่อไม่ให้โค้ดขณะรันใหม่เขียนไฟล์สถานะเดิม ขณะที่โค้ดและการทดสอบ
  การย้ายข้อมูลยังสามารถ seed/read ไฟล์เหล่านั้นได้
  ดำเนินการแล้วสำหรับ store เดิมที่ย้ายแล้วในปัจจุบัน; guard ยังสแกนการทดสอบที่ซ้อนกัน
  เพื่อหาสัญญา transcript locator ขณะรันที่ต้องห้ามด้วย

### ระยะที่ 1: ทำ Control Plane ส่วนกลางให้เสร็จ

เก็บสถานะการประสานงานที่ใช้ร่วมกันไว้ใน `state/openclaw.sqlite`:

- เอเจนต์และรีจิสทรีฐานข้อมูลเอเจนต์
- บัญชีแยกประเภทของงานและ Task Flow
- สถานะ Plugin
- รีจิสทรีคอนเทนเนอร์/เบราว์เซอร์ Sandbox
- ประวัติการรัน Cron/scheduler
- การจับคู่, อุปกรณ์, push, update-check, TUI, แคช OpenRouter/model และสถานะขณะรันขนาดเล็กอื่นๆ
  ที่กำหนดขอบเขตระดับ Gateway
- เมทาดาทาสำรองและการย้ายข้อมูล
- ไบต์ไฟล์แนบสื่อของ Gateway ดำเนินการแล้วสำหรับการเขียนขณะรัน; พาธไฟล์โดยตรง
  เป็นการ materialize ชั่วคราวเพื่อความเข้ากันได้กับตัวส่งของช่องทางและการ staging ของ sandbox
  allowlist ขณะรันยอมรับพาธ materialization ของ SQLite ไม่ใช่ราก media ของ state/config เดิม
  doctor นำเข้าไฟล์สื่อเดิมเข้าสู่ `media_blobs` และลบไฟล์ต้นทางหลังเขียนแถวสำเร็จ
- เซสชัน, เหตุการณ์ และ blob เพย์โหลดของ debug proxy capture ดำเนินการแล้ว: capture อยู่ใน
  DB สถานะที่ใช้ร่วมกัน และเปิดผ่าน bootstrap, schema, WAL และการตั้งค่า busy-timeout
  ของ DB สถานะที่ใช้ร่วมกัน ไบต์เพย์โหลดถูกบีบอัดด้วย gzip ใน
  `capture_blobs.data`; ไม่มีการ override DB ข้างเคียงขณะรันเฉพาะ debug proxy,
  ไดเรกทอรี blob หรือเป้าหมาย schema/codegen ที่สร้างขึ้นสำหรับ proxy-capture เท่านั้น
  การย้ายข้อมูล doctor/startup นำเข้าแถว `debug-proxy/capture.sqlite` ที่จัดส่งแล้ว
  และ blob เพย์โหลดที่อ้างอิง รวมถึงการ override environment ของ DB/blob เดิมที่ยังใช้งานอยู่
  จากนั้นเก็บถาวรแหล่งเหล่านั้นโดยปล่อยใบรับรอง CA ไว้เหมือนเดิม

ระยะนี้ยังลบตัวเปิดไฟล์ข้างเคียงซ้ำๆ, ตัวช่วยสิทธิ์, การตั้งค่า WAL,
การตัดแต่งไฟล์ซิสเต็ม และตัวเขียนความเข้ากันได้ออกจากระบบย่อยเหล่านั้นด้วย

### ระยะที่ 2: เพิ่มฐานข้อมูลต่อเอเจนต์

สร้างฐานข้อมูลหนึ่งชุดต่อเอเจนต์ และลงทะเบียนจาก DB ส่วนกลาง:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

แถว `agent_databases` ส่วนกลางเก็บพาธ, เวอร์ชัน schema, timestamp last-seen
และเมทาดาทาขนาด/ความสมบูรณ์พื้นฐาน โค้ดขณะรันขอ DB เอเจนต์จากรีจิสทรี
แทนการสร้างพาธไฟล์โดยตรง

DB เอเจนต์เป็นเจ้าของ:

- `sessions` เป็นรูทเซสชันตามมาตรฐาน โดยมี `session_entries` เป็นตารางเพย์โหลดรูปแบบความเข้ากันได้ที่แนบกับรูทนั้น และ
  `session_routes` เป็นการค้นหา `session_key` ที่ใช้งานอยู่แบบไม่ซ้ำ
- `conversations` และ `session_conversations` เป็นข้อมูลระบุตัวตนการกำหนดเส้นทางผู้ให้บริการที่ทำให้เป็นมาตรฐานและแนบกับเซสชัน
- `transcript_events`
- สแนปชอตทรานสคริปต์และจุดตรวจ Compaction เสร็จแล้วสำหรับการเขียนของรันไทม์
- `vfs_entries`
- `tool_artifacts` และอาร์ติแฟกต์ของการรัน
- แถวรันไทม์/แคชภายในเอเจนต์ เสร็จแล้วสำหรับแคชที่อยู่ในขอบเขตเวิร์กเกอร์
- เหตุการณ์สตรีมพาเรนต์ ACP
- เหตุการณ์รันไทม์ทราเจกทอรีเมื่อไม่ใช่อาร์ติแฟกต์ส่งออกที่ชัดเจน

### ระยะที่ 3: แทนที่ API ของที่เก็บเซสชัน

เสร็จแล้วสำหรับรันไทม์ พื้นผิวที่เก็บเซสชันแบบไฟล์ไม่ได้เป็นสัญญารันไทม์ที่ใช้งานอยู่:

- รันไทม์ไม่เรียก `loadSessionStore(storePath)` อีกต่อไป และไม่ถือว่า `storePath` เป็นตัวระบุเซสชัน
- การดำเนินการกับแถวของรันไทม์คือ `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` และ `listSessionEntries`
- ตัวช่วยเขียนทั้งสโตร์ใหม่ ตัวเขียนไฟล์ การทดสอบคิว การตัด alias และพารามิเตอร์การลบคีย์เดิมถูกนำออกจากรันไทม์แล้ว
- export ความเข้ากันได้ของแพ็กเกจรูทที่เลิกใช้แล้วยังคงปรับพาธ `sessions.json` ตามมาตรฐานเข้ากับ API แถว SQLite
- การแยกวิเคราะห์ `sessions.json` เหลืออยู่เฉพาะในโค้ดการย้าย/นำเข้าของ doctor และการทดสอบ doctor
- การอ่าน fallback ของวงจรชีวิตรันไทม์อ่านส่วนหัวทรานสคริปต์จาก SQLite ไม่ใช่บรรทัดแรกของ JSONL

ลบสิ่งใดก็ตามที่นำพารามิเตอร์ file-lock คำศัพท์เกี่ยวกับ pruning/truncation-as-file-maintenance ตัวตนแบบ store-path หรือการทดสอบที่มีข้อยืนยันเพียงอย่างเดียวคือการคงอยู่ของ JSON กลับเข้ามา

### ระยะที่ 4: ย้ายทรานสคริปต์ สตรีม ACP ทราเจกทอรี และ VFS

ทำให้ทุกสตรีมข้อมูลเอเจนต์เป็นแบบฐานข้อมูลโดยตรง:

- การเขียน append ทรานสคริปต์ผ่านทรานแซกชัน SQLite เดียวที่รับประกันส่วนหัวเซสชัน ตรวจสอบ idempotency ของข้อความ เลือก tail ของพาเรนต์ แทรกลงใน `transcript_events` และบันทึกเมตาดาต้าตัวตนที่ค้นหาได้ใน
  `transcript_event_identities` เสร็จแล้วสำหรับการ append ข้อความทรานสคริปต์โดยตรงและการ append ของ `TranscriptSessionManager` ที่คงอยู่ตามปกติ การดำเนินการ branch ที่ชัดเจนยังคงใช้การเลือกพาเรนต์ที่ชัดเจนของตน และยังเขียนแถว SQLite โดยไม่อนุมานตัวระบุตำแหน่งไฟล์ใดๆ
- บันทึกสตรีมพาเรนต์ ACP กลายเป็นแถว ไม่ใช่ไฟล์ `.acp-stream.jsonl` เสร็จแล้ว
- การตั้งค่า spawn ของ ACP ไม่คงพาธ JSONL ของทรานสคริปต์อีกต่อไป เสร็จแล้ว
- การจับทราเจกทอรีของรันไทม์เขียนแถวเหตุการณ์/อาร์ติแฟกต์โดยตรง คำสั่ง support/export ที่ชัดเจนยังคงสร้างอาร์ติแฟกต์ JSONL ของ support-bundle เป็นรูปแบบส่งออกได้ แต่การส่งออกเซสชันจะไม่สร้าง JSONL ของเซสชันขึ้นใหม่ เสร็จแล้ว
- เวิร์กสเปซบนดิสก์ยังคงอยู่บนดิสก์เมื่อกำหนดค่าเป็นโหมดดิสก์
- VFS scratch และโหมดเวิร์กสเปซ VFS-only แบบทดลองใช้ DB ของเอเจนต์

การย้ายจะนำเข้าไฟล์ JSONL เก่าเพียงครั้งเดียว บันทึกจำนวน/แฮชใน
`migration_runs` และลบไฟล์ที่นำเข้าแล้วหลังจากตรวจสอบความสมบูรณ์

### ระยะที่ 5: สำรองข้อมูล กู้คืน Vacuum และตรวจสอบ

การสำรองข้อมูลยังคงเป็นไฟล์ archive เดียว:

- checkpoint ฐานข้อมูล global และฐานข้อมูลเอเจนต์ทุกตัว
- snapshot แต่ละ DB ด้วย semantics การสำรองข้อมูลของ SQLite หรือ `VACUUM INTO`
- archive สแนปชอต DB ขนาดกะทัดรัด config ข้อมูลประจำตัวภายนอก และการส่งออกเวิร์กสเปซที่ร้องขอ
- ละเว้นไฟล์ live ดิบ `*.sqlite-wal` และ `*.sqlite-shm`
- ตรวจสอบโดยเปิดสแนปชอต DB ทุกตัวและรัน `PRAGMA integrity_check`
  `openclaw backup create` ทำการตรวจสอบ archive นี้โดยค่าเริ่มต้น;
  `--no-verify` ข้ามเฉพาะ pass หลังเขียน archive ไม่ใช่การตรวจสอบความสมบูรณ์ตอนสร้างสแนปชอต
- การกู้คืนคัดลอกสแนปชอตกลับไปยังพาธเป้าหมาย branch นี้รีเซ็ตเลย์เอาต์ SQLite ที่ยังไม่ shipped เป็น `user_version = 1`; การเปลี่ยน schema ที่ shipped ในอนาคตสามารถเพิ่ม migration ที่ชัดเจนเมื่อจำเป็น

### ระยะที่ 6: รันไทม์ของเวิร์กเกอร์

คงโหมดเวิร์กเกอร์ไว้เป็นแบบทดลองขณะที่การแยกฐานข้อมูลกำลังลงตัว:

- เวิร์กเกอร์ได้รับ agent id, run id, โหมด filesystem และตัวตนของ registry DB
- เวิร์กเกอร์แต่ละตัวเปิดการเชื่อมต่อ SQLite ของตนเอง
- พาเรนต์ยังคงถืออำนาจการส่งผ่านช่องทาง การอนุมัติ config และการยกเลิก
- เริ่มด้วยเวิร์กเกอร์หนึ่งตัวต่อการรันที่ใช้งานอยู่ เพิ่ม pooling เฉพาะหลังจากวงจรชีวิตและความเป็นเจ้าของการเชื่อมต่อ DB เสถียรแล้ว

### ระยะที่ 7: ลบโลกเก่า

เสร็จแล้วสำหรับการจัดการเซสชันรันไทม์ โลกเก่าอนุญาตเฉพาะในฐานะอินพุต doctor ที่ชัดเจนหรือเอาต์พุต support/export เท่านั้น:

- ไม่มีการเขียน `sessions.json`, transcript JSONL, sandbox registry JSON, task
  sidecar SQLite หรือ plugin-state sidecar SQLite ในรันไทม์
- ไม่มีการ pruning ไฟล์ JSON/session, การตัดทอน transcript ไฟล์, session file locks หรือการทดสอบเซสชันรูปแบบ lock
- ไม่มี export ความเข้ากันได้ของรันไทม์ที่มีวัตถุประสงค์เพื่อทำให้ไฟล์เซสชันเก่าเป็นปัจจุบัน
- export ฝ่าย support ที่ชัดเจนยังคงเป็นรูปแบบ archive/materialization ที่ผู้ใช้ร้องขอ และต้องไม่ป้อนชื่อไฟล์กลับเข้าไปเป็นตัวตนของรันไทม์

## การสำรองข้อมูลและการกู้คืน

การสำรองข้อมูลควรเป็นไฟล์ archive เดียว แต่การจับฐานข้อมูลควรเป็นแบบ SQLite-native:

1. หยุดกิจกรรมเขียนที่รันยาวหรือเข้าสู่ backup barrier สั้นๆ
2. สำหรับฐานข้อมูล global และฐานข้อมูลเอเจนต์ทุกตัว ให้รัน checkpoint
3. snapshot ฐานข้อมูลแต่ละตัวโดยใช้ semantics การสำรองข้อมูลของ SQLite หรือ `VACUUM INTO` ไปยังไดเรกทอรีสำรองข้อมูลชั่วคราว
4. archive สแนปชอตฐานข้อมูลที่ compact แล้ว ไฟล์ config ไดเรกทอรีข้อมูลประจำตัว เวิร์กสเปซที่เลือก และ manifest
5. ตรวจสอบ archive โดยเปิดสแนปชอต SQLite ทุกตัวที่รวมอยู่และรัน
   `PRAGMA integrity_check`
   `openclaw backup create` ทำสิ่งนี้โดยค่าเริ่มต้น; `--no-verify` มีไว้เฉพาะสำหรับการข้าม pass หลังเขียน archive โดยตั้งใจ

อย่าพึ่งสำเนา live ดิบของ `*.sqlite`, `*.sqlite-wal` และ `*.sqlite-shm` เป็นรูปแบบสำรองข้อมูลหลัก manifest ของ archive ควรบันทึกบทบาทฐานข้อมูล, agent id, เวอร์ชัน schema, พาธต้นทาง, พาธสแนปชอต, ขนาดไบต์ และสถานะความสมบูรณ์

การกู้คืนควรสร้างไฟล์ฐานข้อมูล global และไฟล์ฐานข้อมูลเอเจนต์ใหม่จากสแนปชอตใน archive เนื่องจากเลย์เอาต์ SQLite ยังไม่ได้ shipped refactor นี้จึงคงไว้เฉพาะ schema เวอร์ชัน 1 พร้อมการนำเข้าไฟล์ไปยังฐานข้อมูลของ doctor คำสั่ง restore จะตรวจสอบ archive ก่อน จากนั้นแทนที่ asset แต่ละรายการใน manifest จาก payload ที่แตกไฟล์และตรวจสอบแล้ว

## แผน Refactor รันไทม์

1. เพิ่ม API registry ฐานข้อมูล
   - resolve พาธ DB global และ DB ต่อเอเจนต์
   - คง schema ที่ยังไม่ shipped ไว้ที่ `user_version = 1`; อย่าเพิ่มโค้ด schema migration runner จนกว่า schema ที่ shipped จะต้องใช้
   - เพิ่มตัวช่วย close/checkpoint/integrity ที่ใช้โดยการทดสอบ การสำรองข้อมูล และ doctor

2. รวม sidecar SQLite stores
   - ย้ายตาราง plugin state เข้าไปในฐานข้อมูล global เสร็จแล้วสำหรับการเขียนรันไทม์; ตัวนำเข้า sidecar legacy ที่ยังไม่ shipped ถูกลบแล้ว
   - ย้ายตาราง task registry เข้าไปในฐานข้อมูล global เสร็จแล้วสำหรับการเขียนรันไทม์; ตัวนำเข้า sidecar legacy ที่ยังไม่ shipped ถูกลบแล้ว
   - ย้ายตาราง Task Flow เข้าไปในฐานข้อมูล global เสร็จแล้วสำหรับการเขียนรันไทม์;
     ตัวนำเข้า sidecar legacy ที่ยังไม่ shipped ถูกลบแล้ว
   - ย้ายตาราง builtin memory-search เข้าไปในฐานข้อมูลเอเจนต์แต่ละตัว เสร็จแล้ว; `memorySearch.store.path` แบบกำหนดเองที่ชัดเจนถูกลบโดยการย้าย config ของ doctor แล้ว
     การ reindex เต็มรันในที่เดิมกับตาราง memory เท่านั้น; พาธ swap ทั้งไฟล์เก่าและตัวช่วย swap ดัชนี sidecar ถูกลบแล้ว
   - ลบตัวเปิดฐานข้อมูลซ้ำ การตั้งค่า WAL ตัวช่วย permission และพาธ close จาก subsystem เหล่านั้น

3. ย้ายตารางที่เอเจนต์เป็นเจ้าของเข้าไปในฐานข้อมูลต่อเอเจนต์
   - สร้าง DB เอเจนต์เมื่อต้องการผ่าน registry ฐานข้อมูล global เสร็จแล้ว
   - ย้าย session entries ของรันไทม์, transcript events, แถว VFS และ tool artifacts ไปยัง DB เอเจนต์ เสร็จแล้ว
   - อย่า migrate session entries, transcript events, แถว VFS หรือ tool artifacts ของ shared-DB เฉพาะ branch; เลย์เอาต์นั้นไม่เคย shipped คงไว้เฉพาะการนำเข้า legacy file-to-database ใน doctor

4. แทนที่ API ของที่เก็บเซสชัน
   - ลบ `storePath` ออกจากการเป็นตัวตนรันไทม์ เสร็จแล้วสำหรับรันไทม์และถูกป้องกันโดย `check:database-first-legacy-stores`: metadata เซสชัน, route updates,
     command persistence, CLI session cleanup, Feishu reasoning previews,
     transcript-state persistence, subagent depth, auth profile session
     overrides, parent-fork logic และการตรวจสอบ QA-lab ตอนนี้ resolve ฐานข้อมูลจาก agent/session keys ตามมาตรฐาน
     การตอบกลับ session-list ของ Gateway/TUI/UI/macOS ตอนนี้ expose `databasePath`
     แทน `path` แบบ legacy; พื้นผิว debug ของ macOS แสดงฐานข้อมูลต่อเอเจนต์เป็นสถานะอ่านอย่างเดียวแทนการเขียน config `session.store`
     `/status`, การส่งออกทราเจกทอรีที่ขับเคลื่อนด้วยแชต และ CLI dependency proxies ไม่ propagate legacy store paths อีกต่อไป; transcript usage fallback อ่าน SQLite ด้วยตัวตน agent/session การทดสอบ runtime และ bridge ไม่ expose
     `storePath` อีกต่อไป; อินพุต doctor/migration เป็นเจ้าของชื่อฟิลด์ legacy นั้น
     การโหลด combined-session ของ Gateway ไม่มี branch รันไทม์พิเศษสำหรับค่า `session.store` แบบ non-templated อีกต่อไป; โดย aggregate แถว SQLite ต่อเอเจนต์
     lane doctor ของ legacy session-lock และตัวช่วย cleanup `.jsonl.lock` ถูกลบแล้ว; ตอนนี้ SQLite เป็นขอบเขต concurrency ของเซสชัน
     call site รันไทม์แบบ hot ใช้ชื่อตัวช่วยเชิงแถว เช่น
     `resolveSessionRowEntry`; alias ความเข้ากันได้เก่า `resolveSessionStoreEntry` ถูกลบออกจาก runtime และ plugin SDK exports แล้ว

- ใช้การดำเนินการแถว `{ agentId, sessionKey }`
  เสร็จแล้ว: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` และ `listSessionEntries` เป็น API แบบ SQLite-first ที่ไม่ต้องใช้พาธ session store สรุปสถานะ สถานะเอเจนต์ local, health และคำสั่ง listing `openclaw sessions` ตอนนี้อ่านแถวต่อเอเจนต์โดยตรงและแสดงพาธฐานข้อมูล SQLite ต่อเอเจนต์แทนพาธ `sessions.json`
- แทนที่การ delete/insert ทั้งสโตร์ด้วย `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` และคำสั่ง cleanup SQL
  เสร็จแล้วสำหรับรันไทม์: hot paths ตอนนี้ใช้ row APIs และ row patches ที่ retry เมื่อ conflict;
  ตัวช่วย import/replace ทั้งสโตร์ที่เหลือถูกจำกัดไว้ที่โค้ด migration import และการทดสอบ backend SQLite
  - ลบ `store-writer.ts` และ writer-queue tests เสร็จแล้ว
  - ลบการ pruning legacy-key ของรันไทม์และพารามิเตอร์ alias-delete จาก session row upserts/patches เสร็จแล้ว

5. ลบพฤติกรรม JSON registry ของรันไทม์
   - ทำให้การอ่านและเขียน sandbox registry เป็น SQLite-only เสร็จแล้ว
   - นำเข้า JSON แบบ monolithic และ sharded เฉพาะจากขั้นตอน migration เสร็จแล้ว
   - ลบ sharded registry locks และการเขียน JSON เสร็จแล้ว

- คงตาราง registry ที่ typed หนึ่งตารางไว้แทนการเก็บแถว registry เป็น JSON ทึบ generic หากรูปทรงยังคงเป็นสถานะปฏิบัติการบน hot-path เสร็จแล้ว

6. ลบการกลายพันธุ์เซสชันรูปแบบ file-lock
   - เสร็จแล้วสำหรับการสร้าง lock ของรันไทม์และ API lock ของรันไทม์
   - lane cleanup doctor `.jsonl.lock` แบบ legacy แยกเดี่ยวถูกลบแล้ว
   - `session.writeLock` เป็น config legacy ที่ doctor-migrated ไม่ใช่การตั้งค่ารันไทม์แบบ typed
   - ความสมบูรณ์ของ state ไม่มีพาธ pruning ไฟล์ transcript กำพร้าแยกต่างหากอีกต่อไป; การย้ายของ doctor นำเข้า/ลบแหล่ง JSONL legacy ในที่เดียว
   - การประสานงาน singleton ของ Gateway ใช้แถว SQLite `state_leases` แบบ typed ใต้
     `gateway_locks` และไม่ expose seam ไดเรกทอรี file-lock อีกต่อไป
   - การคงอยู่ dedupe ของ plugin SDK แบบ generic ไม่ใช้ file locks หรือไฟล์ JSON อีกต่อไป; เขียนแถว plugin-state ของ SQLite ที่ใช้ร่วมกัน เสร็จแล้ว
   - การประสานงาน QMD embed ใช้ state lease ของ SQLite แทน
     `qmd/embed.lock` เสร็จแล้ว

7. ทำให้เวิร์กเกอร์รู้จักฐานข้อมูล
   - เวิร์กเกอร์เปิดการเชื่อมต่อ SQLite ของตนเอง
   - พาเรนต์เป็นเจ้าของ delivery, channel callbacks และ config
   - เวิร์กเกอร์ได้รับ agent id, run id, โหมด filesystem และตัวตนของ registry DB ไม่ใช่ live handles
   - `vfs-only` ยังคงเป็นแบบทดลองและใช้ฐานข้อมูลเอเจนต์เป็นรูทของ storage
   - คงเวิร์กเกอร์หนึ่งตัวต่อการรันที่ใช้งานอยู่ก่อน Pooling รอได้จนกว่าอายุการเชื่อมต่อ DB และพฤติกรรมการยกเลิกจะเรียบง่ายขึ้น

8. การผสานรวมการสำรองข้อมูล.
   - สอนให้การสำรองข้อมูล snapshot ฐานข้อมูลส่วนกลางและฐานข้อมูลของเอเจนต์ผ่านการสำรองข้อมูลของ SQLite หรือ
     `VACUUM INTO` เสร็จแล้วสำหรับไฟล์ `*.sqlite` ที่ค้นพบใต้แอสเซ็ตสถานะ
   - เพิ่มการตรวจสอบการสำรองข้อมูลสำหรับความสมบูรณ์ของ SQLite และเวอร์ชัน schema เสร็จแล้วสำหรับ
     การสร้างข้อมูลสำรองและการตรวจสอบความสมบูรณ์ของ archive เริ่มต้น
   - บันทึก metadata ของการรันสำรองข้อมูลใน SQLite เสร็จแล้วผ่านตาราง `backup_runs`
     ที่ใช้ร่วมกัน โดยมี path ของ archive, สถานะ และ manifest JSON
   - เพิ่มการกู้คืนจาก snapshot ของ archive ที่ผ่านการตรวจสอบแล้ว เสร็จแล้ว: `openclaw backup
restore` ตรวจสอบก่อนแตกไฟล์ ใช้ manifest ที่ normalize แล้วของ verifier
     รองรับ `--dry-run` และต้องใช้ `--yes` ก่อนแทนที่
     path ต้นทางที่บันทึกไว้
   - รวมการ export VFS/workspace เฉพาะเมื่อมีการร้องขอเท่านั้น; อย่า export internals ของ session
     เป็น JSON หรือ JSONL

9. ลบการทดสอบและโค้ดที่ล้าสมัย เสร็จแล้วสำหรับพื้นผิว runtime session ที่ทราบ

- ลบการทดสอบที่ assert การสร้าง `sessions.json` หรือไฟล์ transcript
  JSONL โดย runtime เสร็จแล้วสำหรับ core session store, chat, เหตุการณ์ transcript ของ Gateway,
  preview, lifecycle, การอัปเดต command session-entry, การ reset/trace ของ auto-reply และ
  fixture ของ memory-core dreaming, การ route approval target, การซ่อมแซม session transcript,
  การซ่อมแซม security permission, การ export trajectory และการ export session
  ตอนนี้การทดสอบ transcript ของ Active Memory assert scope ของ SQLite และไม่มีการสร้างไฟล์ JSONL
  ชั่วคราวหรือที่ persist แล้ว
  regression เก่าของ heartbeat transcript-pruning ถูกลบแล้วเพราะ
  runtime ไม่ truncate transcript JSONL อีกต่อไป
  การทดสอบเครื่องมือ agent session-list ไม่ model path `sessions.json` แบบ legacy
  เป็น shape ของการตอบกลับ Gateway อีกต่อไป; การทดสอบ app/UI/macOS ใช้ `databasePath`
  ตอนนี้การทดสอบ `/status` transcript-usage seed row ของ SQLite transcript โดยตรง
  แทนการเขียนไฟล์ JSONL
  ตอนนี้การทดสอบ Gateway session lifecycle ใช้ helper สำหรับ seed SQLite transcript
  โดยตรง; shape fixture session-file แบบ single-line เก่าหายไปจาก coverage
  ของ reset และ delete
  `sessions.delete` ไม่ return ฟิลด์ยุคไฟล์ `archived: []` อีกต่อไป; การลบ
  รายงานเฉพาะผลลัพธ์การ mutate row เท่านั้น ตัวเลือก `deleteTranscript` เก่า
  ก็หายไปด้วย: การลบ session จะลบ root `sessions` ที่เป็น canonical และให้
  SQLite cascade row ของ transcript, snapshot และ trajectory ที่ session เป็นเจ้าของ ดังนั้น
  caller จะไม่สามารถทิ้ง transcript orphan ไว้หรือพลาด branch cleanup ได้
  ตอนนี้การทดสอบ context-engine trajectory capture อ่าน row `trajectory_runtime_events`
  จากฐานข้อมูลเอเจนต์ที่แยกไว้ แทนการอ่าน
  `session.trajectory.jsonl`
  ตอนนี้สคริปต์ seed ของ Docker MCP channel seed row ของ SQLite โดยตรง การเขียน
  `sessions.json` โดยตรงถูกจำกัดไว้เฉพาะ fixture ของ doctor
  Tool Search Gateway E2E อ่านหลักฐาน tool-call จาก row ของ SQLite transcript
  แทนการ scan ไฟล์ `agents/<agentId>/sessions/*.jsonl`
  ตอนนี้ host events และ row ชั่วคราวของ session-corpus ใน memory-core อยู่ใน plugin-state
  ของ SQLite ที่ใช้ร่วมกัน; `events.jsonl` และ `session-corpus/*.txt` เป็นเพียง input
  migration แบบ legacy ของ doctor เท่านั้น Row ที่ active ใช้ path เสมือน
  `memory/session-ingestion/` ไม่ใช่ `.dreams/session-corpus` โมดูลซ่อมแซม
  memory-core dreaming เก่าและการทดสอบ CLI/Gateway ของโมดูลนั้นถูกลบแล้ว เพราะ runtime
  ไม่ได้เป็นเจ้าของการซ่อมแซม file archive สำหรับ corpus นั้นอีกต่อไป การทดสอบ
  bridge/public-artifact ของ memory-core ไม่ surface `.dreams/events.jsonl` อีกต่อไป; การทดสอบเหล่านั้น
  ใช้ชื่อ artifact JSON เสมือนที่ backing ด้วย SQLite
  ตอนนี้เอกสารการทดสอบ Public SDK/Codex ระบุสถานะ session ของ SQLite แทนไฟล์ session
  และตัวอย่าง channel-turn ไม่ expose argument `storePath` อีกต่อไป
  ตอนนี้ state การ sync ของ Matrix ใช้ store plugin-state ของ SQLite โดยตรง สัญญา
  client/runtime ที่ active ส่งผ่าน root ของ account storage ไม่ใช่ path `bot-storage.json`
  และ doctor import `bot-storage.json` แบบ legacy เข้า SQLite ก่อนลบ
  ต้นทาง ตอนนี้ scenario การ restart/destructive ของ QA Matrix mutate row sync ของ SQLite
  โดยตรง แทนการสร้างหรือลบไฟล์ `bot-storage.json` ปลอม และ
  substrate ของ E2EE ส่งผ่าน root ของ sync-store แทน path
  `sync-store.json` ปลอม
  การเลือก storage-root ของ Matrix ไม่ให้คะแนน root จากไฟล์ JSON sync/thread แบบ legacy
  อีกต่อไป; ใช้ root metadata ที่ durable พร้อม state crypto จริง
  test suite ของ runtime SQLite session backend ไม่ fabricate
  `sessions.json` อีกต่อไป; fixture ต้นทาง legacy ตอนนี้อยู่ในการทดสอบ doctor
  ที่ import fixture เหล่านั้น
  การทดสอบ Gateway session ไม่ expose helper `createSessionStoreDir` หรือ
  การตั้งค่า path session-store ชั่วคราวที่ไม่ได้ใช้อีกต่อไป; dir ของ fixture ชัดเจน และการตั้งค่า
  row โดยตรงใช้การตั้งชื่อ session-row ของ SQLite
  coverage parser ของ doctor-only JSON5 session-store ย้ายออกจากการทดสอบ infra และ
  ไปอยู่ในการทดสอบ migration ของ doctor ดังนั้น test suite ของ runtime จึงไม่ได้เป็นเจ้าของการ parse
  session-file แบบ legacy อีกต่อไป
  การทดสอบ runtime SSO/pending-upload ของ Microsoft Teams ไม่พก fixture sidecar
  JSON หรือ parser อีกต่อไป; การ parse token SSO แบบ legacy อยู่ในโมดูล migration
  ของ Plugin เท่านั้น การทดสอบ Telegram ไม่ seed path store `/tmp/*.json` ปลอมอีกต่อไป;
  การทดสอบเหล่านั้น reset message cache ที่ backing ด้วย SQLite โดยตรง helper
  test-state ทั่วไปของ OpenClaw ไม่ expose writer `auth-profiles.json`
  แบบ legacy อีกต่อไป; การทดสอบ auth migration ของ doctor เป็นเจ้าของ fixture นั้นแบบ local
  การทดสอบ runtime สำหรับ pointer last-session ของ TUI, exec approvals, toggle ของ active-memory,
  การตรวจสอบ Matrix dedupe/startup, การ sync source ของ Memory Wiki,
  binding ของ current-conversation, onboarding auth และ secret import ของ Hermes ไม่
  สร้างไฟล์ sidecar เก่าหรือ assert ว่า filename เก่าหายไปอีกต่อไป การทดสอบเหล่านั้น
  พิสูจน์พฤติกรรมผ่าน row ของ SQLite และ public store API; การทดสอบ doctor/migration
  เป็นที่เดียวที่ filename ต้นทาง legacy ควรอยู่
  การทดสอบ runtime สำหรับการจับคู่ device/node, channel allowFrom, restart intents,
  restart handoff, entry ของ session delivery queue, config health, cache ของ iMessage,
  cron jobs, header ของ PI transcript, registry ของ subagent และ image attachment ที่จัดการแล้ว
  ก็ไม่สร้างไฟล์ JSON/JSONL ที่ปลดระวางแล้วเพียงเพื่อพิสูจน์ว่าไฟล์เหล่านั้นถูก ignored หรือ absent อีกต่อไป
  PI overflow recovery ไม่มี fallback การ rewrite/truncation ของ SessionManager
  อีกต่อไป: การ truncate tool-result และการ rewrite transcript ของ context-engine mutate
  row ของ SQLite transcript แล้ว refresh active prompt state จากฐานข้อมูล
  การ append message ของ SessionManager ที่ persist แล้ว delegate ไปยัง helper append transcript
  ของ SQLite แบบ atomic สำหรับการเลือก parent และ idempotency การ append entry
  metadata/custom ปกติก็เลือก parent ปัจจุบันภายใน SQLite ด้วย ดังนั้น
  instance ของ manager ที่ stale จะไม่ resurrect race ของ parent-chain ก่อน SQLite
  การ cleanup tail แบบ synthetic ของ PI สำหรับ mid-turn precheck และ `sessions_yield` ตอนนี้
  trim state ของ SQLite transcript โดยตรง; bridge tail-removal ของ SessionManager เก่า
  และการทดสอบของมันถูกลบแล้ว
  การจับ checkpoint ของ Compaction ก็ snapshot จาก SQLite เท่านั้น; caller ไม่
  ส่ง SessionManager ที่ live เป็นแหล่ง transcript ทางเลือกอีกต่อไป
- เก็บการทดสอบที่ seed ไฟล์ legacy ไว้เฉพาะสำหรับ migration
- หลักฐานแบบไฟล์ JSON ถูกแทนที่ด้วยหลักฐาน row ของ SQL สำหรับพื้นผิว runtime
  ที่ active

- เพิ่ม static ban สำหรับ runtime writes ไปยัง path JSON ของ session/cache แบบ legacy
  เสร็จแล้วสำหรับ repo guard

10. ทำให้รายงาน migration ตรวจสอบย้อนหลังได้
    - บันทึกการรัน migration ใน SQLite พร้อม timestamp เริ่มต้น/สิ้นสุด, path ต้นทาง,
      hash ต้นทาง, count, warning และ path สำรองข้อมูล
      เสร็จแล้ว: ตอนนี้การทำงานของ legacy-state migration persist รายงาน `migration_runs`
      พร้อม inventory ของ source path/table, SHA-256 ของไฟล์ต้นทาง, size,
      record count, warning และ path สำรองข้อมูล
      เสร็จแล้ว: การทำงานของ legacy-state migration ยัง persist row `migration_sources`
      สำหรับ audit ระดับ source และการตัดสินใจ skip/backfill ในอนาคต
    - ทำให้การ apply เป็น idempotent การรันซ้ำหลังจาก import บางส่วนควร
      skip source ที่ import แล้ว หรือ merge ด้วย stable key
      เสร็จแล้ว: session index, transcript, delivery queue, plugin state, task
      ledger และ row ของ SQLite global ที่ agent เป็นเจ้าของ import ผ่าน stable key หรือ
      semantics แบบ upsert/replace ดังนั้นการรันซ้ำจะ merge โดยไม่ duplicate row
      durable
    - import ที่ล้มเหลวต้องเก็บไฟล์ต้นฉบับไว้ที่เดิม
      เสร็จแล้ว: ตอนนี้ import transcript ที่ล้มเหลวทิ้ง source JSONL เดิมไว้ที่
      path ที่ตรวจพบ และ `migration_sources` บันทึก source เป็น
      `warning` พร้อม `removed_source=0` สำหรับการรัน doctor ครั้งถัดไป

## กฎด้านประสิทธิภาพ

- หนึ่ง connection ต่อ thread/process ใช้ได้; อย่า share handle ข้าม
  worker
- ใช้ WAL, `foreign_keys=ON`, busy timeout 30 วินาที และ transaction เขียนแบบ `BEGIN IMMEDIATE`
  ที่สั้น
- ให้ helper ของ write transaction เป็น synchronous ต่อไป เว้นแต่/จนกว่า API transaction แบบ async
  จะเพิ่ม semantics ของ mutex/backpressure อย่างชัดเจน
- ให้การเขียน parent delivery เล็กและเป็น transactional
- หลีกเลี่ยงการ rewrite ทั้ง store; ใช้ upsert/delete ระดับ row
- เพิ่ม index สำหรับ path list-by-agent, list-by-session, updated-at, run id และ
  expiration ก่อนย้าย hot code
- เก็บ artifact, media และ vector ขนาดใหญ่เป็น BLOB หรือ row BLOB แบบ chunked ไม่ใช่
  JSON แบบ base64 หรือ numeric-array
- ให้ entry plugin-state แบบ opaque มีขนาดเล็กและ scoped
- เพิ่ม cleanup ของ SQL สำหรับ TTL/expiration แทนการ prune filesystem
  เสร็จแล้วสำหรับ runtime store ที่ฐานข้อมูลเป็นเจ้าของ: media, plugin state, plugin blobs,
  persistent dedupe และ agent cache ทั้งหมดหมดอายุผ่าน row ของ SQLite cleanup ของ
  filesystem ที่เหลือจำกัดไว้เฉพาะ materialization ชั่วคราวหรือคำสั่งลบ
  ที่ชัดเจน

## Static Ban

เพิ่ม repo check ที่ fail runtime writes ใหม่ไปยัง path state แบบ legacy:

- `sessions.json`
- `*.trajectory.jsonl` ยกเว้นเอาต์พุต support-bundle ที่ materialized แล้ว
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- ไฟล์แคชรันไทม์ `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` และ `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- ไฟล์ JSON shard ของรีจิสทรี sandbox
- ไฟล์ JSON bridge ของ native hook relay `/tmp`
- `plugin-state/state.sqlite`
- sidecar รันไทม์ `openclaw-state.sqlite` แบบเฉพาะกิจ
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- การตกแต่งโปรไฟล์เบราว์เซอร์ `.openclaw-profile-decorated`
- ตัวเปิดเซสชันที่รองรับด้วยไฟล์ `SessionManager.open(...)`
- facade การแสดงรายการ transcript ของ `SessionManager.listAll(...)` และ `TranscriptSessionManager.listAll(...)`
- facade การ fork transcript ของ `SessionManager.forkFromSession(...)` และ
  `TranscriptSessionManager.forkFromSession(...)`
- facade การแทนที่เซสชันที่เปลี่ยนแปลงได้ของ `SessionManager.newSession(...)` และ `TranscriptSessionManager.newSession(...)`
- facade เซสชัน branch ของ `SessionManager.createBranchedSession(...)` และ
  `TranscriptSessionManager.createBranchedSession(...)`

ข้อห้ามควรอนุญาตให้การทดสอบสร้าง fixture แบบ legacy และอนุญาตให้โค้ด migration
อ่าน/นำเข้า/ลบแหล่งไฟล์ legacy ได้ SQLite sidecar ที่ยังไม่ได้ ship ยังคงถูกห้าม
และไม่ได้รับข้อยกเว้นให้ doctor นำเข้า

## เกณฑ์เสร็จสิ้น

- การเขียนข้อมูลรันไทม์และแคชไปยังฐานข้อมูล SQLite ระดับ global หรือ agent
- รันไทม์ไม่เขียนดัชนีเซสชัน, transcript JSONL, JSON ของรีจิสทรี sandbox,
  task sidecar SQLite หรือ plugin-state sidecar SQLite อีกต่อไป ตัวนำเข้า task
  และ plugin-state sidecar SQLite ที่ยังไม่ได้ ship ถูกลบแล้ว
- การนำเข้าไฟล์ legacy ทำได้เฉพาะ doctor เท่านั้น
- Backup สร้าง archive เดียวที่มี snapshot SQLite แบบกระชับและหลักฐานความสมบูรณ์
- agent worker สามารถรันด้วย disk, VFS scratch หรือ storage แบบ VFS-only ทดลองได้
- ไฟล์ config และไฟล์ credential ที่ระบุชัดเจนยังคงเป็นไฟล์ควบคุมถาวรที่ไม่ใช่ฐานข้อมูลเพียงประเภทเดียวที่คาดไว้
- การตรวจสอบ repo ป้องกันการนำที่เก็บไฟล์รันไทม์ legacy กลับมาใช้อีกครั้ง
