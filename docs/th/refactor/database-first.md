---
read_when:
    - ย้ายข้อมูลรันไทม์ แคช ทรานสคริปต์ สถานะงาน หรือไฟล์ชั่วคราวของ OpenClaw ไปยัง SQLite
    - การออกแบบการย้ายข้อมูลของ doctor จากไฟล์ JSON หรือ JSONL
    - การเปลี่ยนแปลงพฤติกรรมของการสำรองข้อมูล การกู้คืน VFS หรือพื้นที่จัดเก็บของ worker
    - การลบล็อกเซสชัน การตัดแต่ง การตัดทอน หรือพาธความเข้ากันได้ของ JSON
summary: แผนการย้ายระบบเพื่อทำให้ SQLite เป็นเลเยอร์หลักสำหรับสถานะถาวรและแคช โดยยังคงใช้ไฟล์คอนฟิกเป็นแบ็กเอนด์
title: การปรับโครงสร้างสถานะแบบให้ฐานข้อมูลมาก่อน
x-i18n:
    generated_at: "2026-07-01T20:40:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# การรีแฟกเตอร์สถานะโดยยึดฐานข้อมูลเป็นหลัก

## การตัดสินใจ

ใช้เลย์เอาต์ SQLite สองระดับ:

- ฐานข้อมูลส่วนกลาง: `~/.openclaw/state/openclaw.sqlite`
- ฐานข้อมูลเอเจนต์: ฐานข้อมูล SQLite หนึ่งชุดต่อเอเจนต์สำหรับพื้นที่ทำงานที่เอเจนต์เป็นเจ้าของ,
  transcript, VFS, artifact, และสถานะรันไทม์ขนาดใหญ่แบบรายเอเจนต์
- การกำหนดค่ายังคงสำรองด้วยไฟล์: `openclaw.json` ยังคงอยู่นอก
  ฐานข้อมูล โปรไฟล์การยืนยันตัวตนของรันไทม์ย้ายไป SQLite; ไฟล์ข้อมูลรับรองของผู้ให้บริการภายนอกหรือ CLI
  ยังคงจัดการโดยเจ้าของอยู่นอกฐานข้อมูลของ OpenClaw

ฐานข้อมูลส่วนกลางคือฐานข้อมูล control-plane โดยเป็นเจ้าของการค้นพบเอเจนต์,
สถานะ Gateway ที่ใช้ร่วมกัน, การจับคู่, สถานะอุปกรณ์/โหนด, บัญชีแยกประเภทงานและโฟลว์, สถานะ Plugin,
สถานะรันไทม์ของตัวจัดตาราง, เมทาดาทาสำรองข้อมูล, และสถานะการย้ายข้อมูล

ฐานข้อมูลเอเจนต์คือฐานข้อมูล data-plane โดยเป็นเจ้าของเมทาดาทาเซสชันของเอเจนต์,
สตรีมเหตุการณ์ transcript, พื้นที่ทำงาน VFS หรือเนมสเปซ scratch, artifact ของเครื่องมือ,
artifact ของการรัน, และข้อมูลแคชในเครื่องของเอเจนต์ที่ค้นหา/ทำดัชนีได้

สิ่งนี้ให้มุมมองส่วนกลางที่คงทนหนึ่งชุดโดยไม่บังคับให้พื้นที่ทำงานเอเจนต์ขนาดใหญ่,
transcript, และข้อมูล scratch แบบไบนารีเข้าไปอยู่ในเลนการเขียน Gateway ที่ใช้ร่วมกัน

## สัญญาแบบเข้มงวด

การย้ายข้อมูลนี้มีรูปแบบรันไทม์มาตรฐานหนึ่งเดียว:

- แถวเซสชันคงไว้เฉพาะเมทาดาทาเซสชันเท่านั้น แถวเหล่านั้นต้องไม่คงค่า
  `transcriptLocator`, พาธไฟล์ transcript, พาธ JSONL ข้างเคียง, พาธล็อก,
  เมทาดาทาการตัดแต่ง, หรือตัวชี้ความเข้ากันได้ยุคไฟล์
- อัตลักษณ์ของ transcript คืออัตลักษณ์ SQLite เสมอ: `{agentId, sessionId}` พร้อม
  เมทาดาทาหัวข้อแบบไม่บังคับเมื่อโปรโตคอลต้องใช้
- `sqlite-transcript://...` ไม่ใช่อัตลักษณ์รันไทม์หรือโปรโตคอล โค้ดใหม่ต้อง
  ไม่ derive, persist, pass, parse, หรือ migrate transcript locators รันไทม์และ
  การทดสอบไม่ควรมี pseudo-locators เลย; เอกสารอาจกล่าวถึงสตริงนี้
  เฉพาะเพื่อห้ามใช้เท่านั้น
- `sessions.json` เดิม, transcript JSONL, `.jsonl.lock`, การตัดแต่ง, การตัดทอน,
  และตรรกะพาธเซสชันเก่าอยู่เฉพาะในพาธการย้ายข้อมูล/นำเข้าของ doctor เท่านั้น
- alias การกำหนดค่าเซสชันเดิมอยู่เฉพาะในการย้ายข้อมูลของ doctor รันไทม์ไม่
  ตีความ `session.idleMinutes`, `session.resetByType.dm`, หรือ
  alias เซสชันหลักข้ามเอเจนต์ `agent:main:*` สำหรับเอเจนต์ที่กำหนดค่าอีกตัวหนึ่ง
- อัตลักษณ์การกำหนดเส้นทางเซสชันคือสถานะแบบ relational ที่มี type พาธรันไทม์ที่ร้อนและ UI
  ควรอ่าน `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, และ
  `session_conversations`; ต้องไม่ parse `session_key` หรือขุด
  `session_entries.entry_json` เพื่อหาอัตลักษณ์ผู้ให้บริการ ยกเว้นเป็นเงาความเข้ากันได้
  ระหว่างที่ call site เก่ากำลังถูกลบ
- เครื่องหมายข้อความโดยตรงระดับช่องทาง เช่น `dm` เทียบกับ `direct` เป็นศัพท์ของการกำหนดเส้นทาง
  ไม่ใช่ transcript locators หรือ handle ความเข้ากันได้ของ file-store
- การกำหนดค่า hook handler เดิมอยู่เฉพาะบนพื้นผิวคำเตือน/การย้ายข้อมูลของ doctor เท่านั้น
  รันไทม์ต้องไม่โหลด `hooks.internal.handlers`; hooks ทำงานผ่านไดเรกทอรี hook
  ที่ค้นพบและเมทาดาทา `HOOK.md` เท่านั้น
- การเริ่มต้นรันไทม์, พาธตอบกลับที่ร้อน, Compaction, การรีเซ็ต, การกู้คืน, diagnostics,
  TTS, memory hooks, subagents, การกำหนดเส้นทางคำสั่ง Plugin, ขอบเขตโปรโตคอล, และ
  hooks ต้องส่ง `{agentId, sessionId}` ผ่านรันไทม์
- การทดสอบควร seed และ assert แถว transcript ของ SQLite ผ่าน
  `{agentId, sessionId}` การทดสอบที่พิสูจน์เฉพาะการส่งต่อพาธ JSONL,
  การคงค่า locator ที่ caller ส่งมา, หรือความเข้ากันได้ของไฟล์ transcript ควร
  ถูกลบ เว้นแต่จะครอบคลุมการนำเข้าของ doctor, การ materialize ข้อมูลสนับสนุน/ดีบักที่ไม่ใช่เซสชัน,
  หรือรูปทรงโปรโตคอล
- `runEmbeddedPiAgent(...)`, การรัน worker ที่เตรียมไว้, และความพยายาม embedded ภายใน
  ต้องไม่รับ transcript locators สิ่งเหล่านี้เปิดตัวจัดการ transcript ของ SQLite
  ด้วย `{agentId, sessionId}` และส่งตัวจัดการนั้นไปยังเซสชันเอเจนต์ที่เข้ากันได้กับ PI
  ซึ่งถูก internalize แล้ว เพื่อให้ caller ที่ล้าสมัยไม่สามารถทำให้ runner เขียน
  transcript JSON/JSONL ได้
- diagnostics ของ runner ต้องเก็บเรกคอร์ด trace รันไทม์/แคช/payload ใน SQLite
  diagnostics ของรันไทม์ต้องไม่เปิดเผยปุ่มปรับแต่ง override ไฟล์ JSONL หรือ helper ส่งออก
  transcript JSONL ทั่วไป; การส่งออกสำหรับผู้ใช้สามารถ materialize artifact ที่ชัดเจน
  จากแถวฐานข้อมูลได้โดยไม่ป้อนชื่อไฟล์กลับเข้าไปในรันไทม์
- การบันทึก raw stream ใช้ `OPENCLAW_RAW_STREAM=1` พร้อมแถว diagnostics ของ SQLite
  สัญญา file logger แบบ pi-mono เก่า `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`, และ
  `raw-openai-completions.jsonl` ไม่ใช่ส่วนหนึ่งของรันไทม์หรือการทดสอบของ OpenClaw
- การทำดัชนีหน่วยความจำ QMD ต้องไม่ส่งออก transcript ของ SQLite ไปเป็นไฟล์ markdown
  QMD ทำดัชนีเฉพาะไฟล์หน่วยความจำที่กำหนดค่าไว้; การค้นหา transcript เซสชันยังคง
  สำรองด้วย SQLite
- subpath ของ QMD SDK ใช้สำหรับ QMD เท่านั้นสำหรับโค้ดใหม่ helper การทำดัชนี transcript
  เซสชัน SQLite อยู่บน `memory-core-host-engine-session-transcripts`; การ re-export
  ของ QMD ใด ๆ เป็นเพียงความเข้ากันได้เท่านั้นและต้องไม่ถูกใช้โดยโค้ดรันไทม์
- ดัชนีหน่วยความจำในตัวอยู่ในฐานข้อมูลเอเจนต์ที่เป็นเจ้าของ การกำหนดค่ารันไทม์และ
  สัญญารันไทม์ที่ resolve แล้วต้องไม่เปิดเผย `memorySearch.store.path`; doctor
  ลบคีย์การกำหนดค่าเดิมนั้น และโค้ดปัจจุบันส่ง `databasePath` ของเอเจนต์ภายใน

งานติดตั้งควรลบโค้ดต่อไปจนกว่าข้อความเหล่านี้จะเป็นจริง
โดยไม่มีข้อยกเว้นนอกขอบเขต doctor/import/export/debug

## สถานะเป้าหมายและความคืบหน้า

### เป้าหมายแบบเข้มงวด

- ฐานข้อมูล SQLite ส่วนกลางหนึ่งชุดเป็นเจ้าของสถานะ control-plane:
  `state/openclaw.sqlite`.
- ฐานข้อมูล SQLite รายเอเจนต์หนึ่งชุดเป็นเจ้าของสถานะ data-plane:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- การกำหนดค่ายังคงสำรองด้วยไฟล์ `openclaw.json` ไม่ใช่ส่วนหนึ่งของ
  การรีแฟกเตอร์ฐานข้อมูลนี้
- ไฟล์เดิมเป็นอินพุตการย้ายข้อมูลของ doctor เท่านั้น
- รันไทม์ไม่เขียนหรืออ่านเซสชันหรือ transcript JSONL เป็นสถานะ active เลย

### สถานะเป้าหมาย

- `not-started`: โค้ดรันไทม์ยุคไฟล์ยังคงเขียนสถานะ active
- `migrating`: โค้ด doctor/import สามารถย้ายข้อมูลไฟล์เข้า SQLite
- `dual-read`: สะพานชั่วคราวอ่านทั้ง SQLite และไฟล์เดิม สถานะนี้
  ถูกห้ามสำหรับการรีแฟกเตอร์นี้ เว้นแต่จะมีการบันทึกไว้อย่างชัดเจนว่า
  เป็น doctor-only
- `sqlite-runtime`: รันไทม์อ่านและเขียนเฉพาะ SQLite
- `clean`: API และการทดสอบรันไทม์เดิมถูกลบออก และ guard ป้องกัน
  regression
- `done`: เอกสาร, การทดสอบ, backup, การย้ายข้อมูลของ doctor, และ changed checks พิสูจน์
  สถานะ clean

### สถานะปัจจุบัน

- เซสชัน: `clean` สำหรับรันไทม์ แถวเซสชันอยู่ในฐานข้อมูลรายเอเจนต์,
  API รันไทม์ใช้ `{agentId, sessionId}` หรือ `{agentId, sessionKey}`, และ
  `sessions.json` เป็นอินพุตเดิมเฉพาะ doctor เท่านั้น
- Transcript: `clean` สำหรับรันไทม์ เหตุการณ์ transcript, อัตลักษณ์, snapshot,
  และเหตุการณ์รันไทม์ trajectory อยู่ในฐานข้อมูลรายเอเจนต์ รันไทม์ไม่
  รับ transcript locators หรือพาธ transcript JSONL อีกต่อไป
- PI embedded runner: `clean` การรัน PI แบบ embedded, worker ที่เตรียมไว้, Compaction,
  และลูป retry ใช้ขอบเขตเซสชัน SQLite และปฏิเสธ handle transcript ที่ล้าสมัย
- Cron: `clean` สำหรับรันไทม์ รันไทม์ใช้ `cron_jobs` และ `cron_run_logs`;
  การทดสอบรันไทม์ใช้การตั้งชื่อ `storeKey` ของ SQLite และพาธ cron ยุคไฟล์ยังคงอยู่ใน
  การทดสอบการย้ายข้อมูลเดิมของ doctor เท่านั้น
- รีจิสทรีงาน: `clean` แถวรันไทม์ Task และ Task Flow อยู่ใน
  `state/openclaw.sqlite`; importer SQLite sidecar ที่ยังไม่เคย ship ถูกลบแล้ว
- สถานะ Plugin: `clean` แถวสถานะ/blob ของ Plugin อยู่ในฐานข้อมูลส่วนกลางที่ใช้ร่วมกัน;
  helper SQLite sidecar สำหรับสถานะ Plugin เก่าถูก guard ไว้
- หน่วยความจำ: `sqlite-runtime` สำหรับหน่วยความจำในตัวและการทำดัชนี transcript เซสชัน
  ตารางดัชนีหน่วยความจำอยู่ในฐานข้อมูลรายเอเจนต์, สถานะหน่วยความจำของ Plugin ใช้
  แถว plugin-state ที่ใช้ร่วมกัน, และไฟล์หน่วยความจำเดิมเป็นอินพุตการย้ายข้อมูลของ doctor
  หรือเนื้อหาพื้นที่ทำงานของผู้ใช้
- Backup: `sqlite-runtime` ขั้นตอน backup compact snapshot ของ SQLite, ละเว้น sidecar
  WAL/SHM ที่ live, ตรวจสอบความสมบูรณ์ของ SQLite, และบันทึกการรัน backup ใน
  ฐานข้อมูลส่วนกลาง
- การย้ายข้อมูลของ doctor: `migrating` โดยเจตนา Doctor นำเข้า JSON,
  JSONL, และ store sidecar ที่เลิกใช้แล้วเข้าสู่ SQLite, บันทึกการรัน/แหล่งที่มาของการย้ายข้อมูล,
  และลบแหล่งที่มาที่สำเร็จ
- สคริปต์ E2E: `clean` สำหรับความครอบคลุมรันไทม์ การ seed Docker MCP เขียนแถว SQLite
  สคริปต์ Docker runtime-context สร้าง JSONL เดิมเฉพาะภายใน
  seed การย้ายข้อมูลของ doctor และตั้งชื่อพาธดัชนีเซสชันเดิมไว้อย่างชัดเจน

### งานที่เหลือ

- [x] เปลี่ยนชื่อ store variables ของการทดสอบรันไทม์ cron ออกจาก `storePath` เว้นแต่
      จะเป็นอินพุตเดิมของ doctor
      ไฟล์: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      หลักฐาน: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] ลบหรือเปลี่ยนชื่อ mock การทดสอบ export ยุคไฟล์ที่เลิกใช้แล้ว
      ไฟล์: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      หลักฐาน: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] ทำให้ seed JSONL เดิมของ Docker runtime-context ชัดเจนว่าเป็น doctor-only
      ไฟล์: `scripts/e2e/session-runtime-context-docker-client.ts`.
      หลักฐาน: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` แสดงเฉพาะ
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] รักษา type ที่ Kysely สร้างให้สอดคล้องหลังการเปลี่ยน schema ใด ๆ
      ไฟล์: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      หลักฐาน: ไม่มีการเปลี่ยน schema ในรอบนี้; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] รันการทดสอบแบบโฟกัสซ้ำสำหรับ store, command, และสคริปต์ที่แตะ
      หลักฐาน: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] ก่อนประกาศ `done` ให้รัน changed gate หรือ proof ระยะกว้างแบบ remote
      หลักฐาน: `pnpm check:changed --timed -- <changed extension paths>` ผ่านบน
      Hetzner Crabbox run `run_3f1cabf6b25c` หลังการตั้งค่า Node 24/pnpm ชั่วคราวและ
      การกำหนดเส้นทางพาธอย่างชัดเจนสำหรับ workspace ที่ sync แล้วและไม่มี `.git`

### ห้ามถอยหลัง

- ไม่มี transcript locators
- ไม่มีไฟล์เซสชัน active
- ไม่มี fixture ทดสอบ JSONL ปลอม ยกเว้นการทดสอบการย้ายข้อมูลเดิมของ doctor
- ไม่มีการเข้าถึง SQLite ดิบในจุดที่คาดว่าจะใช้ Kysely
- ไม่มี migration DB เดิมใหม่ เลย์เอาต์นี้ยังไม่เคย ship; คงเวอร์ชัน schema
  ไว้ที่ `1` เว้นแต่มีเหตุผลหนักแน่น

## สมมติฐานจากการอ่านโค้ด

ไม่มีการตัดสินใจผลิตภัณฑ์ต่อเนื่องที่บล็อกแผนนี้ การติดตั้งควร
ดำเนินต่อด้วยสมมติฐานเหล่านี้:

- ใช้ `node:sqlite` โดยตรง และต้องใช้รันไทม์ Node 22+ สำหรับเส้นทางสตอเรจนี้
- เก็บไฟล์การกำหนดค่าปกติไว้เพียงไฟล์เดียวเท่านั้น อย่าย้าย config, plugin
  manifests หรือ Git workspaces เข้าไปใน SQLite ในการรีแฟกเตอร์นี้
- ไม่จำเป็นต้องมีไฟล์ความเข้ากันได้ของรันไทม์ ไฟล์ JSON และ JSONL เดิมเป็น
  อินพุตสำหรับการย้ายข้อมูลเท่านั้น ส่วน SQLite sidecars เฉพาะ branch-local
  ไม่เคยถูกส่งมอบจริง และจะถูกลบแทนการนำเข้า
- `openclaw doctor --fix` เป็นเจ้าของขั้นตอนการย้ายข้อมูลจากไฟล์เดิมไปยังฐานข้อมูล
  การเริ่มต้นรันไทม์และ `openclaw migrate` ไม่ควรแบกเส้นทางอัปเกรดฐานข้อมูล
  OpenClaw แบบเดิมไว้
- ความเข้ากันได้ของข้อมูลรับรองใช้กฎเดียวกัน: ข้อมูลรับรองของรันไทม์อยู่ใน
  SQLite ไฟล์ `auth-profiles.json`, `auth.json` ราย agent และไฟล์
  `credentials/oauth.json` แบบแชร์ เป็นอินพุตสำหรับการย้ายข้อมูลของ doctor
  จากนั้นจะถูกลบหลังจากนำเข้า
- สถานะ catalog ของโมเดลที่สร้างขึ้นรองรับด้วยฐานข้อมูล โค้ดรันไทม์ต้องไม่เขียน
  `agents/<agentId>/agent/models.json`; ไฟล์ `models.json` ที่มีอยู่เป็นอินพุต
  เดิมของ doctor และจะถูกลบหลังจากนำเข้าไปยัง `agent_model_catalogs`
- รันไทม์ต้องไม่ย้ายข้อมูล ทำ normalization หรือเชื่อม transcript locators
  ตัวตน transcript ที่ใช้งานอยู่คือ `{agentId, sessionId}` ใน SQLite เส้นทางไฟล์เป็น
  อินพุตเดิมของ doctor เท่านั้น และ `sqlite-transcript://...` ต้องหายไปจากพื้นผิว
  ของรันไทม์ โปรโตคอล hook และ Plugin แทนที่จะถูกปฏิบัติเป็น boundary handle
- การอ่าน transcript จาก SQLite ของรันไทม์ไม่เรียกใช้การย้ายข้อมูลรูปทรง entry
  แบบ JSONL เดิม หรือเขียน transcript ทั้งชุดใหม่เพื่อความเข้ากันได้ การ normalize
  entry เดิมยังคงอยู่ในยูทิลิตี doctor/import แบบชัดเจน doctor จะ normalize ไฟล์
  transcript JSONL เดิมก่อนแทรกแถว SQLite; แถวรันไทม์ปัจจุบันถูกเขียนด้วย schema
  transcript ปัจจุบันอยู่แล้ว การ export trajectory/session อ่านแถวเหล่านั้นตามเดิม
  และต้องไม่ทำการย้ายข้อมูลเดิมตอน export
- helper สำหรับ parse/ย้ายข้อมูล transcript JSONL เดิมเป็นของ doctor เท่านั้น
  โค้ดรูปแบบ transcript ของรันไทม์สร้างเฉพาะ context ของ transcript SQLite ปัจจุบัน;
  doctor เป็นเจ้าของการอัปเกรด entry JSONL เดิมก่อนแทรกแถว
- helper streaming transcript JSONL เดิมที่รันไทม์เป็นเจ้าของถูกลบแล้ว โค้ด import
  ของ doctor เป็นเจ้าของการอ่านไฟล์เดิมแบบชัดเจน; การอ่านประวัติ session ของรันไทม์
  อ่านแถว SQLite
- bindings ของ Codex app-server ใช้ `sessionId` ของ OpenClaw เป็นคีย์ canonical
  ใน namespace plugin-state ของ Codex `sessionKey` เป็น metadata สำหรับ
  routing/display และต้องไม่แทนที่ session id ที่ทนทาน หรือฟื้นตัวตนแบบไฟล์
  transcript กลับมา
- context engines รับสัญญารันไทม์ปัจจุบันโดยตรง registry ต้องไม่ห่อ engines ด้วย
  retry shims ที่ลบ `sessionKey`, `transcriptScope` หรือ `prompt`; engines ที่ไม่สามารถ
  รับ params แบบ database-first ปัจจุบันควรล้มเหลวอย่างชัดเจนแทนการถูกเชื่อม
- เอาต์พุต backup ควรยังเป็นไฟล์ archive เดียว เนื้อหาฐานข้อมูลควรเข้าไปใน archive
  นั้นเป็น snapshot ของ SQLite ขนาดกะทัดรัด ไม่ใช่ WAL sidecars สดแบบ raw
- การค้นหา transcript มีประโยชน์แต่ไม่จำเป็นสำหรับรอบแรกของ database-first
  ออกแบบ schema ให้สามารถเพิ่ม FTS ได้ภายหลัง
- การ execute ของ worker ควรยังคงเป็นเชิงทดลองอยู่หลัง settings ขณะที่ boundary
  ของฐานข้อมูลยังนิ่งตัว

## ข้อค้นพบจากการอ่านโค้ด

branch ปัจจุบันผ่านขั้น proof-of-concept ไปแล้ว ฐานข้อมูลแบบแชร์มีอยู่จริง,
Node `node:sqlite` ถูกเชื่อมผ่าน helper รันไทม์ขนาดเล็ก และ store เดิมตอนนี้เขียนไปที่
`state/openclaw.sqlite` หรือฐานข้อมูล `openclaw-agent.sqlite` ที่เป็นเจ้าของ

งานที่เหลือไม่ใช่การเลือก SQLite แต่คือการรักษา boundary ใหม่ให้สะอาด
และลบ interface ที่มีรูปทรงเพื่อความเข้ากันได้ซึ่งยังดูเหมือนโลกไฟล์เดิม:

- Session `storePath` ไม่ใช่ตัวตนของรันไทม์ รูปทรง test fixture หรือฟิลด์ใน status
  payload อีกต่อไป การทดสอบรันไทม์และ bridge ไม่มีชื่อสัญญา `storePath` แล้ว;
  โค้ด doctor/migration เป็นเจ้าของคำศัพท์เดิมนั้น
- การเขียน session ไม่ผ่าน queue `store-writer.ts` แบบ in-process เดิมอีกต่อไป
  การเขียน patch ไปยัง SQLite ใช้การตรวจจับ conflict และ retry แบบมีขอบเขตแทน
- การค้นหา path เดิมยังมีประโยชน์ที่ถูกต้องสำหรับการย้ายข้อมูล แต่โค้ดรันไทม์ควรหยุด
  ปฏิบัติต่อ `sessions.json` และไฟล์ transcript JSONL ว่าเป็นเป้าหมายการเขียนที่เป็นไปได้
- ตารางที่ agent เป็นเจ้าของอยู่ในฐานข้อมูล SQLite ราย agent ฐานข้อมูล global เก็บแถว
  registry/control-plane; ตัวตน transcript คือ `{agentId, sessionId}` ในแถว transcript
  ราย agent โค้ดรันไทม์ต้องไม่ persist เส้นทางไฟล์ transcript หรือย้ายข้อมูล
  transcript locators
- doctor นำเข้าไฟล์เดิมหลายรายการอยู่แล้ว งาน cleanup คือทำให้สิ่งนั้นเป็นการใช้งาน
  การย้ายข้อมูลแบบชัดเจนเพียงชุดเดียวที่ doctor เรียกใช้ พร้อมรายงานการย้ายข้อมูล
  ที่ทนทาน

ไม่มีคำถามด้านผลิตภัณฑ์เพิ่มเติมที่ขวางการ implement

## รูปทรงโค้ดปัจจุบัน

branch นี้มีฐาน SQLite แบบแชร์จริงอยู่แล้ว:

- ข้อกำหนดขั้นต่ำของ runtime ตอนนี้คือ Node 22+: `package.json`, ตัวป้องกัน runtime ของ CLI,
  ค่าเริ่มต้นของตัวติดตั้ง, ตัวค้นหา runtime บน macOS, CI และเอกสารติดตั้งสาธารณะทั้งหมด
  สอดคล้องกันแล้ว เลนความเข้ากันได้กับ Node 22 แบบเก่าถูกนำออกแล้ว
- `src/state/openclaw-state-db.ts` เปิด `openclaw.sqlite`, ตั้งค่า WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` และใช้
  โมดูลสคีมาที่สร้างขึ้นจาก
  `src/state/openclaw-state-schema.sql`
- ประเภทตารางของ Kysely และโมดูลสคีมา runtime ถูกสร้างจากฐานข้อมูล
  SQLite แบบใช้แล้วทิ้งที่สร้างจากไฟล์ `.sql` ที่ commit ไว้; โค้ด runtime
  ไม่เก็บสตริงสคีมาที่คัดลอกวางไว้สำหรับฐานข้อมูลส่วนกลาง, ต่อ agent หรือ proxy
  capture อีกต่อไป
- สโตร์ runtime อนุมานประเภทแถวที่เลือกและแทรกจากอินเทอร์เฟซ Kysely `DB`
  ที่สร้างขึ้นเหล่านั้น แทนการทำเงารูปร่างแถว SQLite ด้วยมือ Raw SQL
  ยังคงจำกัดอยู่แค่การใช้สคีมา, pragmas และ DDL สำหรับ migration เท่านั้น
- สคีมา SQLite ถูกรวมให้เป็น `user_version = 1` เพราะเลย์เอาต์ฐานข้อมูลนี้
  ยังไม่ถูกเผยแพร่ Runtime openers สร้างเฉพาะสคีมาปัจจุบันเท่านั้น;
  การนำเข้าจากไฟล์สู่ฐานข้อมูลยังอยู่ในโค้ด doctor และ helper อัปเกรดฐานข้อมูล
  เฉพาะ branch ถูกลบแล้ว
- บังคับใช้ความเป็นเจ้าของเชิงสัมพันธ์ในจุดที่ขอบเขตความเป็นเจ้าของเป็น canonical:
  แถว source migration cascade จาก `migration_runs`, สถานะการส่งมอบ task
  cascade จาก `task_runs` และแถว identity ของ transcript cascade จาก
  transcript events
- ตาราง shared ปัจจุบันประกอบด้วย `agent_databases`,
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
- สถานะที่ Plugin เป็นเจ้าของเองจะไม่ได้ตาราง typed ที่ host เป็นเจ้าของ
  Plugin ที่ติดตั้งใช้ `plugin_state_entries` สำหรับ payload JSON แบบมีเวอร์ชัน และ
  `plugin_blob_entries` สำหรับ bytes พร้อมความเป็นเจ้าของ namespace/key, การล้าง TTL,
  backup และระเบียน migration ของ Plugin สถานะ orchestration ของ Plugin ที่ host เป็นเจ้าของ
  ยังมีตาราง typed ได้เมื่อ host เป็นเจ้าของสัญญา query เช่น
  `plugin_binding_approvals`
- Plugin migrations คือ data migrations บน namespaces ที่ Plugin เป็นเจ้าของ ไม่ใช่
  host schema migrations Plugin สามารถ migrate entries state/blob แบบมีเวอร์ชันของตัวเอง
  ผ่าน migration provider และ host จะบันทึกสถานะ source/run ใน migration ledger ปกติ
  การติดตั้ง Plugin ใหม่ไม่จำเป็นต้องเปลี่ยน
  `openclaw-state-schema.sql` เว้นแต่ host เองจะเข้าถือความเป็นเจ้าของ
  สัญญา cross-plugin ใหม่
- `src/state/openclaw-agent-db.ts` เปิด
  `agents/<agentId>/agent/openclaw-agent.sqlite`, ลงทะเบียนฐานข้อมูลใน
  global DB และเป็นเจ้าของตาราง session, transcript, VFS, artifact, cache
  และ memory-index เฉพาะ agent การค้นพบ runtime ที่ใช้ร่วมกันตอนนี้อ่าน registry
  `agent_databases` แบบ generated-typed แทนการเขียน query นั้นซ้ำที่แต่ละ call site
- ฐานข้อมูล global และต่อ agent บันทึกแถว `schema_meta` พร้อมบทบาทฐานข้อมูล,
  เวอร์ชันสคีมา, timestamps และ agent id สำหรับฐานข้อมูล agent เลย์เอาต์ยังคงอยู่ที่
  `user_version = 1` เพราะสคีมา SQLite นี้ยังไม่ถูกเผยแพร่
- identity ของ session ต่อ agent ตอนนี้มีตาราง root `sessions` แบบ canonical ที่ใช้
  `session_id` เป็น key พร้อม `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamps, display fields, model metadata,
  harness id และ parent/spawn linkage เป็นคอลัมน์ที่ query ได้ `session_routes`
  คือดัชนี active route ที่ unique จาก `session_key` ไปยัง `session_id` ปัจจุบัน
  ดังนั้น route key จึงย้ายไปยัง durable session ใหม่ได้โดยไม่ทำให้ hot reads
  ต้องเลือกระหว่างแถว `sessions.session_key` ที่ซ้ำกัน payload รูปแบบ compatibility
  เดิมของ `session_entries.entry_json` แขวนอยู่กับ root `session_id` แบบ durable
  ด้วย foreign key; มันไม่ใช่ representation ระดับสคีมาเพียงอย่างเดียวของ session อีกต่อไป
- identity ของ external conversation ต่อ agent ก็เป็นเชิงสัมพันธ์เช่นกัน:
  `conversations` เก็บ identity ของ provider/account/conversation ที่ normalize แล้ว และ
  `session_conversations` เชื่อมหนึ่ง OpenClaw session กับ external conversations
  หนึ่งรายการหรือมากกว่า สิ่งนี้ครอบคลุม shared-main DM sessions ที่ peers หลายราย
  สามารถ map ไปยัง session เดียวโดยตั้งใจได้โดยไม่โกหกใน `session_key` SQLite ยังบังคับ
  uniqueness สำหรับ identity ตามธรรมชาติของ provider เพื่อไม่ให้ tuple
  channel/account/kind/peer/thread เดียวกันแตกออกไปคนละ conversation id
  direct peers แบบ shared-main ถูกเชื่อมด้วย role `participant` ดังนั้นหนึ่ง
  OpenClaw session จึงแทน external DM peers หลายรายได้โดยไม่ลดสถานะ peers เก่า
  ให้เป็นแถว related ที่คลุมเครือ `sessions.primary_conversation_id` ยังชี้ไปที่
  typed delivery target ปัจจุบัน คอลัมน์ routing/status แบบ closed ถูกบังคับด้วยข้อจำกัด
  `CHECK` ของ SQLite แทนการพึ่งพา TypeScript unions เพียงอย่างเดียว
  Runtime session projection ล้างเงา routing compatibility จาก
  `session_entries.entry_json` ก่อนใช้คอลัมน์ typed session/conversation
  ดังนั้น payload JSON เก่าจึงไม่สามารถปลุก delivery targets กลับมาได้
  การ route ประกาศของ Subagent ก็ต้องใช้ typed SQLite delivery context เช่นกัน;
  มันไม่ fallback ไปยังฟิลด์ route ของ `SessionEntry` แบบ compatibility อีกต่อไป
  การสืบทอดการส่งมอบแบบ explicit ของ Gateway `chat.send` อ่าน typed SQLite
  delivery context แทนฟิลด์ compatibility `origin`/`last*`
  `tools.effective` ก็อนุมาน context ของ provider/account/thread จากแถว typed
  SQLite delivery/routing ไม่ใช่เงา `last*` ของ session-entry ที่เก่า
  context prompt ของ system-event สร้างฟิลด์ channel/to/account/thread ใหม่จาก
  typed delivery fields แทนเงา `origin`
  helper `deliveryContextFromSession` ที่ใช้ร่วมกันและ mapper session-to-conversation
  ตอนนี้ไม่สนใจ `SessionEntry.origin` โดยสิ้นเชิง; มีเพียง typed delivery fields
  และแถว conversation เชิงสัมพันธ์เท่านั้นที่สร้าง hot route identity ได้
  การ normalize session entry ของ runtime ตัด `origin` ออกก่อน persist หรือ project
  `entry_json` และ inbound metadata เขียนฟิลด์ typed channel/chat พร้อมแถว
  conversation เชิงสัมพันธ์ แทนการสร้างเงา origin ใหม่
- Transcript events, transcript snapshots และ trajectory runtime events ตอนนี้
  อ้างอิง root `sessions` แบบ canonical ต่อ agent และ cascade เมื่อ session ถูกลบ
  แถว identity/idempotency ของ transcript ยังคง cascade จากแถว transcript event
  ที่ตรงกัน
- ดัชนี memory-core ตอนนี้ใช้ตาราง agent-database ที่ชัดเจน
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` และ
  `memory_embedding_cache` โดยมี `memory_index_state` ติดตามการเปลี่ยน revision
  side indexes สำหรับ FTS/vector ที่เป็น optional มีชื่อว่า `memory_index_chunks_fts` และ
  `memory_index_chunks_vec` แทนตาราง generic `meta`, `files`, `chunks`,
  `chunks_fts` หรือ `chunks_vec` ชื่อ canonical คงรูปร่างแถว path/source
  ปัจจุบันและความเข้ากันได้ของ serialized embedding ตารางเหล่านี้เป็น derived/search cache
  ไม่ใช่ canonical transcript storage; สามารถลบและ rebuild จากไฟล์ memory workspace
  และแหล่งที่กำหนดค่าไว้ได้ การเปิด memory index ชื่อ generic ที่เผยแพร่แล้วจะ migrate
  metadata, sources, chunks และ embedding cache เข้าสู่ตาราง canonical;
  ตาราง derived FTS/vector จะถูก rebuild ภายใต้ชื่อ canonical
- สถานะ recovery ของ subagent run ตอนนี้อยู่ในแถว typed shared `subagent_runs`
  พร้อม child, requester และ controller session keys ที่ indexed แล้ว ไฟล์
  `subagents/runs.json` เดิมเป็น input สำหรับ doctor migration เท่านั้น
- Current conversation bindings ตอนนี้อยู่ในแถว typed shared
  `current_conversation_bindings` ที่ keyed ด้วย conversation id ที่ normalize แล้ว
  พร้อมคอลัมน์ target agent/session, conversation kind, status, expiry และ metadata
  ที่เก็บเป็นคอลัมน์เชิงสัมพันธ์แทนระเบียน binding ทึบที่ซ้ำกัน key binding แบบ durable
  รวม conversation kind ที่ normalize แล้ว ดังนั้น refs แบบ direct/group/channel
  จึงไม่ชนกัน และ SQLite ปฏิเสธค่า binding kind/status ที่ไม่ถูกต้อง ไฟล์
  `bindings/current-conversations.json` เดิมเป็น input สำหรับ doctor migration เท่านั้น
- การ recovery ของ delivery queue ตอนนี้ overlay คอลัมน์ typed queue สำหรับ channel, target,
  account, session, retry, error, platform-send และ recovery state บน replay JSON
  `entry_json` เก็บ replay payloads, hooks และ formatting payload แต่คอลัมน์ typed
  เป็นแหล่งอ้างอิงหลักสำหรับ hot queue routing/state
- pointers สำหรับ restore last-session ของ TUI ตอนนี้อยู่ในแถว typed shared
  `tui_last_sessions` ที่ keyed ด้วย scope การเชื่อมต่อ/session ของ TUI ที่ hash แล้ว
  ไฟล์ JSON ของ TUI เดิมเป็น input สำหรับ doctor migration เท่านั้น
- ค่า prefs เริ่มต้นของ TTS ตอนนี้อยู่ในแถว SQLite ของ plugin-state ที่ใช้ร่วมกัน
  keyed ภายใต้ Plugin `speech-core` ไฟล์ `settings/tts.json` เดิมเป็น input
  สำหรับ doctor migration เท่านั้น; runtime ไม่อ่านหรือเขียนไฟล์ JSON ของ prefs TTS
  อีกต่อไป และตัว resolve path แบบ legacy อยู่ในโมดูล doctor migration
- metadata ของ secret target ตอนนี้พูดถึง stores แทนการทำเหมือนทุก credential target
  เป็นไฟล์ config `openclaw.json` ยังคงเป็น config store; auth-profile targets
  ใช้แถว SQLite `auth_profile_stores` แบบ typed พร้อม credentials รูปทรง provider
  ที่เก็บเป็น payload JSON
- Secret audit ไม่สแกนไฟล์ `auth.json` ต่อ agent ที่เลิกใช้แล้วอีกต่อไป Doctor
  เป็นเจ้าของการเตือน, การนำเข้า และการลบไฟล์ legacy นั้น
- helper path ของ auth profile แบบ legacy ตอนนี้อยู่ในโค้ด legacy ของ doctor
  helper path ของ core auth profile เปิดเผย identity และ display locations ของ
  auth-store SQLite ไม่ใช่ runtime paths `auth-profiles.json` หรือ `auth-state.json`
- โมดูล runtime สำหรับ subagent run recovery และ OpenRouter model capability cache
  ตอนนี้แยก SQLite snapshot readers/writers ออกจาก helper นำเข้า JSON legacy
  เฉพาะ doctor ความสามารถของ OpenRouter ใช้แถว generic typed
  `model_capability_cache` ภายใต้ `provider_id = "openrouter"` แทน cache blob
  ทึบก้อนเดียวหรือตาราง host เฉพาะ provider Subagent run
  `taskName` ถูกเก็บในคอลัมน์ typed `subagent_runs.task_name`; สำเนา
  `payload_json` เป็นข้อมูล replay/debug ไม่ใช่แหล่งข้อมูลสำหรับฟิลด์ hot display
  หรือ lookup
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implements a SQLite VFS
  over the agent database `vfs_entries` table. Directory reads, recursive
  exports, deletes, and renames use indexed `(namespace, path)` prefix ranges
  instead of scanning a whole namespace or relying on `LIKE` path matching.
- `src/agents/runtime-worker.entry.ts` creates per-run SQLite VFS, tool artifact,
  run artifact, and scoped cache stores for workers.
- Workspace bootstrap completion markers now live in typed shared
  `workspace_setup_state` rows keyed by resolved workspace path instead of
  `.openclaw/workspace-state.json`; runtime no longer reads or rewrites the
  legacy workspace marker, and helper APIs no longer pass around a fake
  `.openclaw/setup-state` path just to derive storage identity.
- Exec approvals now live in the typed shared SQLite `exec_approvals_config`
  singleton row. Doctor imports legacy `~/.openclaw/exec-approvals.json`;
  runtime writes no longer create, rewrite, or report that file as its active
  store location. The macOS companion reads and writes the same
  `state/openclaw.sqlite` table row; it keeps only the Unix prompt socket on disk
  because that is IPC, not durable runtime state.
- Device identity, device auth, and bootstrap runtime modules now keep their
  SQLite snapshot readers/writers separate from doctor-only legacy JSON import
  helpers. Device identity uses typed `device_identities` rows and device auth
  tokens use typed `device_auth_tokens` rows. Device auth writes reconcile rows
  by device/role instead of truncating the token table, and runtime no longer
  routes single-token updates through the old whole-store adapter. The legacy
  เพย์โหลด JSON เวอร์ชัน 1 มีอยู่เฉพาะในฐานะรูปแบบนำเข้า/ส่งออกของ doctor เท่านั้น
- แคชการแลกเปลี่ยนโทเค็นของ GitHub Copilot ใช้ตารางสถานะ Plugin แบบ SQLite ที่ใช้ร่วมกัน
  ภายใต้ `github-copilot/token-cache/default` ซึ่งเป็นสถานะแคชที่ provider เป็นเจ้าของ
  จึงตั้งใจไม่เพิ่มตารางสคีมาของโฮสต์
- Compaction ของ GitHub Copilot จะไม่เขียนไฟล์ข้างเคียงของเวิร์กสเปซ `openclaw-compaction-*.json`
  อีกต่อไป harness จะเรียกใช้ RPC ของ Compaction ประวัติใน SDK สำหรับ
  เซสชัน SDK ที่ติดตามอยู่ และ OpenClaw จะเก็บสถานะเซสชัน/ทรานสคริปต์ที่คงทนไว้ใน
  SQLite แทนไฟล์ marker สำหรับความเข้ากันได้
- รันไทม์ Swift ที่ใช้ร่วมกัน (`OpenClawKit`) ใช้แถว
  `state/openclaw.sqlite` เดียวกันสำหรับข้อมูลระบุตัวตนอุปกรณ์และการตรวจสอบสิทธิ์อุปกรณ์ ตัวช่วยแอป macOS
  นำเข้าตัวช่วย SQLite ที่ใช้ร่วมกันแทนการเป็นเจ้าของพาธ JSON หรือ
  SQLite ชุดที่สอง ไฟล์เดิมตกค้าง `identity/device.json` จะบล็อกการสร้างข้อมูลระบุตัวตน
  จนกว่า doctor จะนำเข้าไฟล์นั้นไปยัง SQLite ซึ่งตรงกับเกตเริ่มต้นของ TypeScript และ Android
- ข้อมูลระบุตัวตนอุปกรณ์ Android ใช้วัสดุคีย์ที่เข้ากันได้กับ TypeScript ชุดเดียวกัน
  ซึ่งจัดเก็บในแถวแบบมีชนิด `state/openclaw.sqlite#table/device_identities` โดยจะไม่
  อ่านหรือเขียน `openclaw/identity/device.json`; ไฟล์เดิมที่ตกค้างจะบล็อก
  การเริ่มต้นจนกว่า doctor จะนำเข้าไฟล์นั้นไปยัง SQLite
- โทเค็นการตรวจสอบสิทธิ์อุปกรณ์ Android ที่แคชไว้ก็ใช้แถวแบบมีชนิด
  `state/openclaw.sqlite#table/device_auth_tokens` และใช้ความหมายของโทเค็นเวอร์ชัน 1
  แบบเดียวกับ TypeScript และ Swift รันไทม์จะไม่อ่านคีย์ความเข้ากันได้ `SecurePrefs`
  `gateway.deviceToken*` อีกต่อไป; คีย์เหล่านั้นเป็นของตรรกะ migration/doctor เท่านั้น
- ประวัติแพ็กเกจล่าสุดของการแจ้งเตือน Android ใช้แถวแบบมีชนิด
  `android_notification_recent_packages` รันไทม์จะไม่ย้ายหรือ
  อ่านคีย์ CSV เดิมของ SharedPreferences อีกต่อไป
- การสร้างข้อมูลระบุตัวตนอุปกรณ์จะล้มเหลวแบบปิดเมื่อมี `identity/device.json`
  เดิมอยู่ เมื่อแถวข้อมูลระบุตัวตนใน SQLite ไม่ถูกต้อง หรือเมื่อไม่สามารถเปิด
  ที่เก็บข้อมูลระบุตัวตน SQLite ได้ doctor จะนำเข้าและลบไฟล์นั้นก่อน ดังนั้นการเริ่มต้น
  รันไทม์จึงไม่สามารถหมุนเวียนข้อมูลระบุตัวตนสำหรับการจับคู่แบบเงียบ ๆ ก่อน migration
- การเลือกข้อมูลระบุตัวตนอุปกรณ์คือคีย์แถว SQLite ไม่ใช่ตัวระบุไฟล์ JSON การทดสอบ
  และตัวช่วย Gateway ส่งคีย์ข้อมูลระบุตัวตนที่ชัดเจน; มีเพียง migration ของ doctor และ
  เกตเริ่มต้นแบบล้มเหลวแบบปิดเท่านั้นที่รู้จักชื่อไฟล์ `identity/device.json` ที่เลิกใช้แล้ว
- ความเข้ากันได้ของการรีเซ็ตเซสชันตอนนี้อยู่ใน migration คอนฟิกของ doctor:
  `session.idleMinutes` ถูกย้ายไปยัง `session.reset.idleMinutes`,
  `session.resetByType.dm` ถูกย้ายไปยัง `session.resetByType.direct` และนโยบายรีเซ็ตของ
  รันไทม์จะอ่านเฉพาะคีย์รีเซ็ตตามรูปแบบมาตรฐานเท่านั้น
- ความเข้ากันได้ของคอนฟิกเดิมตอนนี้อยู่ภายใต้ `src/commands/doctor/` การตรวจสอบ
  `readConfigFileSnapshot()` ปกติจะไม่นำเข้าตัวตรวจจับแบบเดิมของ doctor
  หรือใส่คำอธิบายประกอบปัญหาเดิม; `runDoctorConfigPreflight()` จะเพิ่มปัญหาเหล่านั้นสำหรับ
  การซ่อมแซม/รายงานของ doctor โฟลว์คอนฟิกของ doctor นำเข้า
  `src/commands/doctor/legacy-config.ts` และการซ่อม profile-id ของ OAuth เดิมอยู่
  ภายใต้
  `src/commands/doctor/legacy/oauth-profile-ids.ts`
- คำสั่งที่ไม่ใช่ doctor จะไม่เรียกใช้การซ่อมคอนฟิกเดิมโดยอัตโนมัติ ตัวอย่างเช่น
  `openclaw update --channel` ตอนนี้จะล้มเหลวเมื่อพบคอนฟิกเดิมที่ไม่ถูกต้อง และขอให้
  ผู้ใช้เรียกใช้ doctor แทนการนำเข้าโค้ด migration ของ doctor แบบเงียบ ๆ
- Web push, APNs, Voice Wake, การตรวจสอบอัปเดต และสุขภาพคอนฟิกตอนนี้ใช้ตาราง SQLite
  แบบมีชนิดที่ใช้ร่วมกันสำหรับการสมัครรับข้อมูล, คีย์ VAPID, การลงทะเบียนโหนด, แถวทริกเกอร์,
  แถวการกำหนดเส้นทาง, สถานะการแจ้งเตือนอัปเดต และรายการสุขภาพคอนฟิก แทน
  blob JSON ทึบทั้งก้อน การเขียนสแนปช็อตของ Web push และ APNs ตอนนี้จะปรับให้ตรงกัน
  สำหรับการสมัครรับข้อมูล/การลงทะเบียนตามคีย์หลักแทนการล้างตารางของรายการเหล่านั้น;
  สุขภาพคอนฟิกทำแบบเดียวกันตามพาธคอนฟิก
  โมดูลรันไทม์ของรายการเหล่านี้แยกตัวอ่าน/ตัวเขียนสแนปช็อต SQLite ออกจาก
  ตัวช่วยนำเข้า JSON เดิมที่ใช้เฉพาะ doctor
- คอนฟิกโฮสต์ Node ตอนนี้ใช้แถวซิงเกิลตันแบบมีชนิดในฐานข้อมูล SQLite ที่ใช้ร่วมกัน;
  doctor จะนำเข้าไฟล์ `node.json` เดิมก่อนการใช้งานรันไทม์ปกติ
- การจับคู่อุปกรณ์/โหนด, การจับคู่ช่องทาง, allowlist ของช่องทาง และสถานะ bootstrap
  ตอนนี้ใช้แถว SQLite แบบมีชนิดแทน blob JSON ทึบทั้งก้อน การอนุมัติการผูก Plugin
  และสถานะงาน Cron ใช้การแยกแบบเดียวกัน: โมดูลรันไทม์เปิดเผย
  การดำเนินการที่รองรับด้วย SQLite และตัวช่วยสแนปช็อตที่เป็นกลาง และการเขียนสแนปช็อต
  สำหรับการจับคู่/bootstrap รวมถึงการอนุมัติการผูก Plugin จะปรับแถวให้ตรงกันตามคีย์หลัก
  แทนการตัดตารางทิ้ง ขณะที่ doctor นำเข้า/ลบไฟล์ JSON เดิมผ่าน
  โมดูล `src/commands/doctor/legacy/*`
- ระเบียน Plugin ที่ติดตั้งแล้วตอนนี้อยู่ในดัชนี Plugin ที่ติดตั้งแล้วของ SQLite
  การอ่าน/เขียนคอนฟิกรันไทม์จะไม่ย้ายหรือเก็บข้อมูลคอนฟิกที่ผู้ใช้เขียนแบบเดิม
  `plugins.installs` อีกต่อไป; doctor จะนำเข้ารูปแบบคอนฟิกเดิมนั้น
  ไปยัง SQLite ก่อนการใช้งานรันไทม์ปกติ
- สแนปช็อตการกู้คืนข้อมูลประจำตัวของ QQBot ตอนนี้อยู่ในสถานะ Plugin ของ SQLite ภายใต้
  `qqbot/credential-backups` รันไทม์จะไม่เขียน
  `qqbot/data/credential-backup*.json` อีกต่อไป; สัญญา doctor ของ QQBot จะนำเข้าและ
  เก็บถาวรไฟล์สำรองเดิมเหล่านั้นจากไดเรกทอรีสถานะที่ใช้งานอยู่
- การวางแผนโหลด Gateway ใหม่เปรียบเทียบสแนปช็อตดัชนี Plugin ที่ติดตั้งแล้วของ SQLite ภายใต้
  namespace diff ภายใน `installedPluginIndex.installRecords.*` การตัดสินใจโหลดใหม่ของรันไทม์
  จะไม่ห่อแถวเหล่านั้นไว้ในอ็อบเจ็กต์คอนฟิก `plugins.installs` ปลอมอีกต่อไป
- การอัปเกรดข้อมูลประจำตัวของบัญชีที่ตั้งชื่อไว้ของ Matrix จะไม่เกิดขึ้นระหว่างการอ่านของรันไทม์
  อีกต่อไป doctor เป็นเจ้าของการเปลี่ยนชื่อ `credentials/matrix/credentials.json`
  ระดับบนสุดเดิม เมื่อสามารถแก้บัญชี Matrix เดี่ยว/ค่าเริ่มต้นได้
- โมดูลรันไทม์การจับคู่หลักและ Cron จะไม่ส่งออกตัวสร้างพาธ JSON เดิม
  อีกต่อไป โมดูลเดิมที่ doctor เป็นเจ้าของจะสร้างพาธต้นทาง `pending.json`, `paired.json`,
  `bootstrap.json` และ `cron/jobs.json` สำหรับการทดสอบนำเข้าและ
  migration เท่านั้น การทำให้ job-shape ของ Cron เดิมเป็นมาตรฐานและการนำเข้า run-log ของ Cron
  อยู่ภายใต้ `src/commands/doctor/legacy/cron*.ts`
- `src/commands/doctor/legacy/runtime-state.ts` นำเข้าไฟล์สถานะ JSON เดิม
  รวมถึงคอนฟิกโฮสต์โหนด ไปยัง SQLite จาก doctor ตัวนำเข้าไฟล์เดิมใหม่
  จะอยู่ภายใต้ `src/commands/doctor/legacy/`
- `src/commands/doctor/state-migrations.ts` นำเข้า `sessions.json` เดิมและ
  ทรานสคริปต์ `*.jsonl` โดยตรงไปยัง SQLite และลบแหล่งที่มาที่สำเร็จแล้ว โดยจะ
  ไม่ staging ทรานสคริปต์เดิมระดับรากผ่าน
  `agents/<agentId>/sessions/*.jsonl` หรือสร้างเป้าหมาย JSONL มาตรฐานก่อน
  การนำเข้าอีกต่อไป
- การตรวจสอบความสมบูรณ์ของสถานะโดย doctor จะไม่สแกนไดเรกทอรีเซสชันเดิมหรือ
  เสนอการลบ JSONL กำพร้าอีกต่อไป ไฟล์ทรานสคริปต์เดิมเป็นอินพุตสำหรับ migration
  เท่านั้น และขั้นตอน migration เป็นเจ้าของการนำเข้าและการลบแหล่งที่มา
- การนำเข้า registry sandbox เดิมอยู่ภายใต้
  `src/commands/doctor/legacy/sandbox-registry.ts`; การอ่านและเขียน registry sandbox
  ที่ใช้งานอยู่ยังคงเป็น SQLite เท่านั้น
- การซ่อมแซมสุขภาพ/การนำเข้าทรานสคริปต์เซสชันเดิมอยู่ภายใต้
  `src/commands/doctor/legacy/session-transcript-health.ts`; โมดูลคำสั่งรันไทม์
  จะไม่พกโค้ดแยกวิเคราะห์ทรานสคริปต์ JSONL หรือโค้ดซ่อมแซม active-branch อีกต่อไป

ไฮไลต์การรวมและการลบที่เสร็จสมบูรณ์:

- สถานะ Plugin ตอนนี้ใช้ฐานข้อมูล `state/openclaw.sqlite` ที่ใช้ร่วมกันแล้ว ตัวนำเข้า sidecar แบบเฉพาะสาขาเก่า `plugin-state/state.sqlite` ถูกลบออก เพราะเค้าโครง SQLite นั้นไม่เคยถูกปล่อยใช้งาน ตัวช่วย probe/test รายงาน `databasePath` ที่ใช้ร่วมกันแทนการเปิดเผยพาธ SQLite เฉพาะ plugin-state
- ตารางรันไทม์ Task และ Task Flow ตอนนี้อยู่ในฐานข้อมูล `state/openclaw.sqlite` ที่ใช้ร่วมกัน แทน `tasks/runs.sqlite` และ `tasks/flows/registry.sqlite`; ตัวนำเข้า sidecar เก่าถูกลบออกด้วยเหตุผลเดียวกันว่าเป็นเค้าโครงที่ไม่เคยถูกปล่อยใช้งาน
- `src/config/sessions/store.ts` ไม่ต้องใช้ `storePath` สำหรับเมทาดาทาขาเข้า การอัปเดตเส้นทาง หรือการอ่าน updated-at อีกต่อไป การคงอยู่ของคำสั่ง การล้างเซสชัน CLI ความลึกของ subagent การแทนที่ auth และอัตลักษณ์เซสชัน transcript ใช้ API แถว agent/session การเขียนถูกปรับใช้เป็นแพตช์แถว SQLite พร้อมการลองใหม่เมื่อเกิดความขัดแย้งแบบ optimistic
- การแก้เป้าหมายเซสชันตอนนี้เปิดเผยเป้าหมายฐานข้อมูลต่อ agent ไม่ใช่พาธ `sessions.json` แบบเก่า Shared gateway, เมทาดาทา ACP, การซ่อมเส้นทางของ doctor และ `openclaw sessions` แจกแจง `agent_databases` รวมถึง agent ที่กำหนดค่าไว้
- การกำหนดเส้นทางเซสชันของ Gateway ตอนนี้ใช้ `resolveGatewaySessionDatabaseTarget`; เป้าหมายที่ส่งกลับมี `databasePath` และคีย์แถว SQLite ที่เป็นตัวเลือก แทนพาธไฟล์ session-store แบบเก่า
- ชนิดรันไทม์ของเซสชันช่องทางตอนนี้เปิดเผย `{agentId, sessionKey}` สำหรับการอ่าน updated-at, เมทาดาทาขาเข้า และการอัปเดต last-route ชนิด compatibility เก่า `saveSessionStore(storePath, store)` หายไปแล้ว
- รันไทม์ Plugin, extension API และพื้นผิว barrel ของ `config/sessions` ตอนนี้นำโค้ด plugin ไปยังตัวช่วยแถวเซสชันที่หนุนด้วย SQLite export compatibility ของไลบรารีราก (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) ยังคงอยู่เป็น shim ที่เลิกใช้แล้วสำหรับผู้ใช้เดิม ตัวช่วยเก่า `resolveLegacySessionStorePath` หายไปแล้ว; การสร้างพาธ `sessions.json` แบบเก่าตอนนี้อยู่เฉพาะใน migration และ fixture ทดสอบ
- `src/config/sessions/session-entries.sqlite.ts` ตอนนี้จัดเก็บรายการเซสชัน canonical ในฐานข้อมูลต่อ agent และรองรับแพตช์อ่าน/upsert/delete ระดับแถว รันไทม์ upsert/patch/delete ไม่สแกนหา variant ตัวพิมพ์หรือ prune คีย์ alias เก่าอีกต่อไป; doctor เป็นเจ้าของ canonicalization ตัวช่วยนำเข้า JSON แบบสแตนด์อโลนหายไปแล้ว และ migration ผสานการ upsert แถวใหม่กว่าแทนการแทนที่ตารางเซสชันทั้งชุด ตัวช่วยอ่าน/list/load สาธารณะ project เมทาดาทาเซสชัน hot จากแถว `sessions` และ `conversations` ที่มีชนิด; `entry_json` เป็นเงา compatibility/debug และอาจเก่าหรือไม่ถูกต้องได้โดยไม่สูญเสียอัตลักษณ์เซสชันหรือบริบทการส่งที่มีชนิด
- `src/config/sessions/delivery-info.ts` ตอนนี้แก้บริบทการส่งจากแถว `sessions` + `conversations` + `session_conversations` ต่อ agent ที่มีชนิด มันไม่สร้างอัตลักษณ์การส่งของรันไทม์ใหม่จาก `session_entries.entry_json` อีกต่อไป; แถว conversation ที่มีชนิดหายไปเป็นปัญหา migration/repair ของ doctor ไม่ใช่ fallback ของรันไทม์
- การตัดสินใจรีเซ็ต stored-session ตอนนี้ให้ความสำคัญกับเมทาดาทา `sessions.session_scope`, `sessions.chat_type` และ `sessions.channel` ที่มีชนิด การ parse `sessionKey` ยังคงมีไว้เฉพาะสำหรับ suffix thread/topic ที่ชัดเจนบนเป้าหมายคำสั่ง; การจัดประเภทการรีเซ็ต group เทียบกับ direct ไม่ได้มาจากรูปทรงคีย์อีกต่อไป
- การจัดประเภทการแสดงผลรายการ/สถานะเซสชันตอนนี้ใช้เมทาดาทา chat ที่มีชนิดและชนิดเซสชัน Gateway มันไม่ถือว่า substring `:group:` หรือ `:channel:` ภายใน `session_key` เป็นความจริงที่คงทนของ group/direct อีกต่อไป
- การเลือกนโยบาย silent-reply ตอนนี้ใช้เฉพาะชนิด conversation หรือเมทาดาทา surface ที่ชัดเจนเท่านั้น มันไม่เดานโยบาย direct/group จาก substring ของ `session_key` อีกต่อไป
- การแก้โมเดลแสดงผลเซสชันตอนนี้ได้รับ id ของ agent จากเป้าหมายฐานข้อมูลเซสชัน SQLite แทนการแยกออกจาก `session_key`
- การเติมข้อมูลเป้าหมาย announce จาก agent-to-agent ตอนนี้ใช้เฉพาะ `deliveryContext` ของ `sessions.list` ที่มีชนิดเท่านั้น มันไม่กู้คืนการกำหนดเส้นทาง channel/account/thread จาก `origin` เก่า ฟิลด์ `last*` ที่ mirror หรือรูปทรง `session_key` อีกต่อไป
- การปฏิเสธเป้าหมาย thread ของ `sessions_send` ตอนนี้อ่านเมทาดาทาการกำหนดเส้นทาง SQLite ที่มีชนิด มันไม่ปฏิเสธหรือยอมรับเป้าหมายด้วยการ parse suffix thread ออกจากคีย์เป้าหมายอีกต่อไป
- การตรวจสอบนโยบายเครื่องมือที่มีขอบเขต group ตอนนี้อ่านการกำหนดเส้นทาง conversation SQLite ที่มีชนิดสำหรับเซสชันปัจจุบันหรือที่ spawn แล้ว มันไม่เชื่ออัตลักษณ์ group/channel ด้วยการ decode `sessionKey` อีกต่อไป; id group ที่ caller ให้มาจะถูกทิ้งเมื่อไม่มีแถวเซสชันที่มีชนิดรับรอง
- การจับคู่การแทนที่โมเดลของช่องทางตอนนี้ใช้เมทาดาทา group และ parent conversation ที่ชัดเจน มันไม่ decode id parent conversation จาก `parentSessionKey` อีกต่อไป
- การสืบทอด stored model override ตอนนี้ต้องใช้ parent session key ที่ชัดเจนจากบริบทเซสชันที่มีชนิด มันไม่ derive parent override จาก suffix `:thread:` หรือ `:topic:` ใน `sessionKey` อีกต่อไป
- wrapper thread-info เซสชันเก่าและ parser thread ของ loaded-plugin หายไปแล้ว; ไม่มีโค้ดรันไทม์ใด import `config/sessions/thread-info`
- ตัวช่วย channel conversation ไม่เปิดเผย bridge สำหรับ parse full-session-key อีกต่อไป Core ยัง normalize id conversation raw ที่ provider เป็นเจ้าของผ่าน `resolveSessionConversation(...)` แต่ไม่สร้างข้อเท็จจริงเส้นทางใหม่จาก `sessionKey`
- การส่ง completion, send policy และการบำรุงรักษา task ไม่ derive ชนิด chat จากรูปทรง `session_key` อีกต่อไป parser คีย์ chat-type เก่าถูกลบแล้ว; เส้นทางเหล่านี้ต้องใช้เมทาดาทาเซสชันที่มีชนิด บริบทการส่งที่มีชนิด หรือคำศัพท์เป้าหมายการส่งที่ชัดเจน
- รายการ/สถานะเซสชัน diagnostics การผูกบัญชี approval การกรอง Heartbeat ของ TUI และสรุปการใช้งาน ไม่ขุด `SessionEntry.origin` สำหรับการกำหนดเส้นทาง provider/account/thread/display อีกต่อไป การอ่าน `origin` ในรันไทม์ที่เหลืออยู่มีเพียงแนวคิดที่ไม่ใช่เซสชันหรือออบเจ็กต์การส่งของ turn ปัจจุบัน
- การ lookup conversation native ของ approval-request ตอนนี้อ่านแถวการกำหนดเส้นทางเซสชันต่อ agent ที่มีชนิด มันไม่ parse อัตลักษณ์ conversation ของ channel/group/thread จาก `sessionKey` อีกต่อไป; เมทาดาทาที่มีชนิดหายไปเป็นปัญหา migration/repair
- payload อีเวนต์ Gateway session changed/chat/session ไม่ echo `SessionEntry.origin` หรือเงาเส้นทาง `last*` อีกต่อไป; client ได้รับ `channel`, `chatType` และ `deliveryContext` ที่มีชนิด
- การแก้การส่ง Heartbeat ตอนนี้รับ `deliveryContext` SQLite ที่มีชนิดได้โดยตรง และรันไทม์ heartbeat ส่งแถวการส่งเซสชันต่อ agent แทนการพึ่งเงา compatibility `session_entries` สำหรับการกำหนดเส้นทางปัจจุบัน
- การแก้เป้าหมายการส่ง isolated-agent ของ Cron ก็เติมข้อมูลเส้นทางปัจจุบันจากแถวการส่งเซสชันต่อ agent ที่มีชนิดก่อน fallback ไปยัง payload รายการ compatibility
- การแก้ origin ของ subagent announce ตอนนี้ส่งผ่านบริบทการส่ง requester-session ที่มีชนิดผ่าน `loadRequesterSessionEntry` และให้ความสำคัญกับแถวนั้นมากกว่าเงา compatibility `last*`/`deliveryContext`
- การอัปเดตเมทาดาทาเซสชันขาเข้าตอนนี้ merge กับแถวการส่งต่อ agent ที่มีชนิดก่อน; ฟิลด์การส่ง `SessionEntry` เก่าเป็นเพียง fallback เมื่อไม่มีแถว conversation ที่มีชนิด
- การ extract การส่งจาก restart/update ตอนนี้ให้ `threadId` ของการส่ง SQLite ที่มีชนิดชนะ fragment topic/thread ที่ parse จาก `sessionKey`; การ parse เป็นเพียง fallback สำหรับคีย์รูปทรง thread แบบเก่า
- id ช่องทางบริบท hook agent ตอนนี้ให้ความสำคัญกับอัตลักษณ์ conversation SQLite ที่มีชนิด แล้วจึงเป็นเมทาดาทาข้อความที่ชัดเจน มันไม่ parse fragment provider/group/channel จาก `sessionKey` อีกต่อไป
- การสืบทอด external-route ของ Gateway `chat.send` ตอนนี้อ่านเมทาดาทาการกำหนดเส้นทางเซสชัน SQLite ที่มีชนิด แทนการ infer ขอบเขต channel/direct/group จากชิ้นส่วน `sessionKey` เซสชันที่มีขอบเขต channel จะสืบทอดเฉพาะเมื่อช่องทางเซสชันและชนิด chat ที่มีชนิดตรงกับบริบทการส่งที่จัดเก็บไว้; เซสชัน shared-main คงกฎ CLI/no-client-metadata ที่เข้มกว่าไว้
- การ wake ของ restart-sentinel และการกำหนดเส้นทาง continuation ตอนนี้อ่านแถวการส่ง/กำหนดเส้นทาง SQLite ที่มีชนิดก่อน queue heartbeat wake หรือ continuation ของ agent-turn ที่ถูกกำหนดเส้นทาง มันไม่สร้างบริบทการส่งใหม่จากเงา JSON ของ session-entry อีกต่อไป
- การแก้บริบท Gateway `tools.effective` ตอนนี้อ่านแถวการส่ง/กำหนดเส้นทาง SQLite ที่มีชนิดสำหรับอินพุต provider, account, target, thread และ reply-mode มันไม่กู้คืนฟิลด์การกำหนดเส้นทาง hot เหล่านั้นจากเงา origin `session_entries.entry_json` ที่เก่าอีกต่อไป
- การกำหนดเส้นทาง realtime voice consult ตอนนี้แก้ parent/call delivery จากแถวเซสชัน SQLite ต่อ agent ที่มีชนิด มันไม่ fallback ไปยังเงา compatibility `SessionEntry.deliveryContext` อีกต่อไปเมื่อเลือกเส้นทางข้อความ agent ที่ฝังอยู่
- การ relay Heartbeat ของ ACP spawn และการกำหนดเส้นทาง parent-stream ตอนนี้อ่าน parent delivery จากแถวเซสชัน SQLite ที่มีชนิด มันไม่สร้างบริบท parent delivery ใหม่จากเงา session-entry ของ compatibility อีกต่อไป
- การรักษาเส้นทางการส่งเซสชันตอนนี้ทำตามเมทาดาทา chat ที่มีชนิดและคอลัมน์การส่งที่คงอยู่ มันไม่ extract hint ของช่องทาง เครื่องหมาย direct/main หรือรูปทรง thread จาก `sessionKey` อีกต่อไป; เส้นทาง webchat ภายในจะสืบทอดเป้าหมายภายนอกเฉพาะเมื่อ SQLite มีอัตลักษณ์การส่งที่มีชนิด/คงอยู่แล้วสำหรับเซสชัน
- การ extract การส่งเซสชันทั่วไปตอนนี้อ่านเฉพาะแถวการส่งเซสชัน SQLite ที่มีชนิดตรงกันเท่านั้น มันไม่ parse suffix thread/topic หรือ fallback จากคีย์รูปทรง thread ไปยังคีย์เซสชันฐานอีกต่อไป
- การ dispatch reply, การกู้คืน restart sentinel และการกำหนดเส้นทาง realtime voice consult ตอนนี้ใช้แถวเซสชัน/conversation SQLite ที่มีชนิดตรงกันสำหรับการกำหนดเส้นทาง thread มันไม่กู้คืน id thread หรือบริบทการส่งของ base-session ด้วยการ parse คีย์เซสชันรูปทรง thread อีกต่อไป
- การจำกัดประวัติ Embedded PI ตอนนี้ใช้ projection การกำหนดเส้นทางเซสชัน SQLite ที่มีชนิด (`sessions` + `conversations` หลัก) สำหรับ provider, ชนิด chat และอัตลักษณ์ peer มันไม่ parse provider, DM, group หรือรูปทรง thread ออกจาก `sessionKey` อีกต่อไป
- การ infer การส่งเครื่องมือ Cron ตอนนี้ใช้การส่งที่ชัดเจนหรือบริบทการส่งที่มีชนิดปัจจุบันเท่านั้น มันไม่ decode เป้าหมาย channel, peer, account หรือ thread จาก `agentSessionKey` อีกต่อไป
- แถวเซสชันรันไทม์ไม่พก alias เส้นทางเก่า `lastProvider` อีกต่อไป ตัวช่วยและการทดสอบใช้ฟิลด์ `lastChannel` และ `deliveryContext` ที่มีชนิด; doctor migration เป็นที่เดียวที่ควรแปล alias เส้นทางเก่าหรือเงา `origin` ที่คงอยู่
- อีเวนต์ transcript, แถว VFS และแถว artifact ของเครื่องมือตอนนี้เขียนไปยังฐานข้อมูลต่อ agent ตาราง mapping ไฟล์ transcript แบบ global ที่ไม่เคยปล่อยใช้งานหายไปแล้ว; doctor บันทึกพาธต้นทางเก่าในแถว migration ที่คงทนแทน
- การ lookup transcript ของรันไทม์ไม่สแกน byte offset ของ JSONL หรือ probe ไฟล์ transcript เก่าอีกต่อไป เส้นทาง chat/media/history ของ Gateway อ่านแถว transcript จาก SQLite; session JSONL ตอนนี้เป็นเพียงอินพุต doctor แบบเก่า ไม่ใช่สถานะรันไทม์หรือรูปแบบ export
- ความสัมพันธ์ parent และ branch ของ transcript ใช้เมทาดาทา `parentTranscriptScope: {agentId, sessionId}` แบบมีโครงสร้างใน header transcript ของ SQLite ไม่ใช่สตริง locator รูปทรงพาธ `agent-db:...transcript_events...`
- สัญญา transcript manager ไม่เปิดเผย constructor `create(cwd)` หรือ `continueRecent(cwd)` ที่ persisted โดยนัยอีกต่อไป transcript manager ที่ persisted ถูกเปิดด้วย scope `{agentId, sessionId}` ที่ชัดเจน; เฉพาะ manager ในหน่วยความจำเท่านั้นที่ยังไม่มี scope สำหรับการทดสอบและ transform transcript ล้วน
- API runtime transcript store แก้ scope SQLite ไม่ใช่พาธ filesystem ตัวช่วยเก่า `resolve...ForPath` และตัวเลือกเขียน `transcriptPath` ที่ไม่ได้ใช้หายไปจาก caller รันไทม์แล้ว
- การแก้เซสชันของรันไทม์ตอนนี้ใช้ `{agentId, sessionId}` และต้องไม่ derive สตริง `sqlite-transcript://<agent>/<session>` สำหรับขอบเขตภายนอก พาธ JSONL absolute แบบเก่าเป็นเพียงอินพุต migration ของ doctor เท่านั้น
- record direct-bridge ของ native hook relay ตอนนี้อยู่ในแถว `native_hook_relay_bridges` ที่ใช้ร่วมกันและมีชนิด ซึ่ง key ด้วย relay id รันไทม์ไม่เขียน registry JSON ใน `/tmp` หรือ record generic ทึบแสงสำหรับ record bridge อายุสั้นเหล่านั้นอีกต่อไป
- `runEmbeddedPiAgent(...)` ไม่มีพารามิเตอร์ transcript-locator อีกต่อไป
  ตัวบรรยาย worker ที่เตรียมไว้จะละตัวระบุตำแหน่ง transcript ด้วยเช่นกัน สถานะเซสชัน runtime
  และงานติดตามผลที่อยู่ในคิวจะพก `{agentId, sessionId}` แทน
  handle ของ transcript ที่อนุมานขึ้น
- Embedded compaction ตอนนี้รับขอบเขต SQLite จาก `agentId` และ `sessionId`
  ห้ามส่ง handle `sqlite-transcript://...` ที่อนุมานขึ้นให้กับ hook ของ Compaction, การเรียก context-engine, การมอบหมายงาน CLI และการตอบกลับของโปรโตคอล
  โค้ด export/debug สามารถสร้าง artifact ของผู้ใช้แบบชัดเจนจากแถวได้ แต่จะไม่จัดเตรียมเส้นทาง export JSONL ของเซสชันแบบทั่วไป หรือป้อนชื่อไฟล์กลับเข้าไปในตัวตนของ runtime
- `/export-session` อ่านแถว transcript จาก SQLite และเขียนเฉพาะ
  มุมมอง HTML แบบสแตนด์อโลนที่ร้องขอเท่านั้น viewer แบบ embedded จะไม่สร้างใหม่หรือ
  ดาวน์โหลด JSONL ของเซสชันจากแถวเหล่านั้นอีกต่อไป
- การมอบหมายงาน context-engine จะไม่ parse ตัวระบุตำแหน่ง transcript เพื่อกู้คืน
  ตัวตนของ agent อีกต่อไป context ของ runtime ที่เตรียมไว้จะพก `agentId` ที่ resolve แล้ว
  เข้าไปใน adapter Compaction แบบ built-in
- การเขียน transcript ใหม่และการตัดทอนผลลัพธ์เครื่องมือแบบ live ตอนนี้อ่านและ persist
  สถานะ transcript ด้วย `{agentId, sessionId}` และไม่อนุมานตัวระบุตำแหน่งชั่วคราว
  สำหรับ payload ของอีเวนต์ transcript-update
- พื้นผิว helper ของสถานะ transcript ไม่มี variant ที่อิงตัวระบุตำแหน่งอย่าง
  `readTranscriptState`, `replaceTranscriptStateEvents` หรือ
  `persistTranscriptStateMutation` อีกต่อไป caller ของ runtime ต้องใช้ API
  `{agentId, sessionId}` การ import ของ Doctor อ่านไฟล์ legacy ด้วย file path ที่ชัดเจน
  และเขียนแถว SQLite โดยจะไม่ migrate string ตัวระบุตำแหน่ง
- contract ของ runtime session-manager จะไม่ expose `open(locator)`,
  `forkFrom(locator)` หรือ `setTranscriptLocator(...)` อีกต่อไป session manager
  ที่ persist แล้วจะเปิดด้วย `{agentId, sessionId}` เท่านั้น; helper สำหรับ list/fork จะอยู่บน
  API session และ checkpoint ที่ยึดตามแถว แทน facade ของ transcript manager
- API ตัวอ่าน transcript ของ Gateway เป็นแบบ scope-first โดยรับ
  `{agentId, sessionId}` และไม่ยอมรับตัวระบุตำแหน่ง transcript แบบ positional ที่
  อาจกลายเป็นตัวตนของ runtime โดยไม่ตั้งใจ การ parse active transcript locator ถูกลบแล้ว; source path แบบ legacy จะถูกอ่านโดยโค้ด import ของ Doctor เท่านั้น
- อีเวนต์อัปเดต transcript ก็เป็นแบบ scope-first เช่นกัน `emitSessionTranscriptUpdate`
  จะไม่รับ string ตัวระบุตำแหน่งล้วนอีกต่อไป และ listener จะ route ด้วย
  `{agentId, sessionId}` โดยไม่ parse handle
- การ broadcast session-message ของ Gateway resolve session key จากขอบเขต agent/session
  ไม่ใช่จากตัวระบุตำแหน่ง transcript resolver/cache แบบเก่าที่แปลง transcript-locator เป็น session key ถูกลบแล้ว
- ตัวกรอง SSE ของ session-history ใน Gateway กรองการอัปเดต live ตามขอบเขต agent/session
  โดยจะไม่ canonicalize candidate ของ transcript locator, realpath หรือ identity ของ transcript
  ที่มีรูปทรงเป็นไฟล์เพื่อพิจารณาว่า stream ควรได้รับการอัปเดตหรือไม่อีกต่อไป
- hook วงจรชีวิตของเซสชันจะไม่อนุมานหรือ expose transcript locator บน
  `session_end` อีกต่อไป ผู้ใช้ hook จะได้รับ `sessionId`, `sessionKey`, id ของ next-session
  และ context ของ agent; ไฟล์ transcript ไม่ใช่ส่วนหนึ่งของ contract วงจรชีวิต
- hook สำหรับ reset จะไม่อนุมานหรือ expose transcript locator เช่นกัน
  payload `before_reset` พกข้อความ SQLite ที่กู้คืนได้พร้อมเหตุผลการ reset
  ขณะที่ตัวตนของเซสชันยังอยู่ใน context ของ hook
- การ reset ของ agent harness จะไม่รับตัวระบุตำแหน่ง transcript อีกต่อไป การ dispatch reset
  ถูกกำหนดขอบเขตด้วย `sessionId`/`sessionKey` พร้อมเหตุผล
- ประเภท session ของ agent extension จะไม่ expose `transcriptLocator` อีกต่อไป; extension
  ควรใช้ context ของเซสชันและ API runtime แทนการเอื้อมไปใช้ตัวตน transcript
  ที่มีรูปทรงเป็นไฟล์
- hook Compaction ของ Plugin จะไม่ expose transcript locator อีกต่อไป context ของ hook
  พกตัวตนของเซสชันอยู่แล้ว และการอ่าน transcript ต้องผ่าน API ที่รู้ขอบเขต SQLite
  แทน handle ที่มีรูปทรงเป็นไฟล์
- hook `before_agent_finalize` จะไม่ expose `transcriptPath` อีกต่อไป รวมถึง
  payload relay ของ native hook ด้วย hook การ finalize ใช้ context ของเซสชันเท่านั้น
- การตอบกลับ reset ของ Gateway จะไม่สังเคราะห์ตัวระบุตำแหน่ง transcript บน
  entry ที่ส่งคืนอีกต่อไป การ reset จะสร้างแถว transcript ใน SQLite, ส่งคืน entry ของเซสชันที่สะอาด
  และปล่อยให้การเข้าถึง transcript เป็นหน้าที่ของ reader ที่รู้ขอบเขต
- ผลลัพธ์ embedded run และ Compaction จะไม่ surface transcript locator สำหรับ
  การทำบัญชีเซสชันอีกต่อไป Automatic compaction จะอัปเดตเฉพาะ `sessionId` ที่ active,
  counter ของ Compaction และ metadata ของ token
- ผลลัพธ์ embedded attempt จะไม่ส่งคืน `transcriptLocatorUsed` อีกต่อไป และ
  ผลลัพธ์ `compact()` ของ context-engine จะไม่ส่งคืน transcript locator อีกต่อไป
  loop retry ของ runtime จะรับเฉพาะ `sessionId` ตัวสืบทอด
- ผลลัพธ์การ append transcript ของ delivery-mirror จะไม่ส่งคืน transcript
  locator อีกต่อไป caller จะได้รับ `messageId` ที่ append แล้ว; สัญญาณอัปเดต transcript ใช้
  ขอบเขต SQLite
- helper สำหรับ fork parent-session จะส่งคืนเฉพาะ `sessionId` ที่ fork แล้ว การเตรียม subagent
  ส่งขอบเขต agent/session ของ child ไปยัง engine
- params ของ CLI runner และการ reseed history จะไม่รับ transcript locator อีกต่อไป
  การอ่าน history ของ CLI จะ resolve ขอบเขต transcript ใน SQLite จาก `{agentId,
sessionId}` และ context ของ session key
- fixture ทดสอบ CLI และ embedded-runner ตอนนี้ seed และอ่านแถว transcript ใน SQLite
  ด้วย session id แทนการแสร้งว่า session ที่ active เป็นไฟล์ `*.jsonl` หรือ
  ส่ง string `sqlite-transcript://...` ผ่าน params ของ runtime
- อีเวนต์ guard ของ tool-result ในเซสชัน emit จากขอบเขตเซสชันที่ทราบ แม้เมื่อ
  manager ในหน่วยความจำไม่มีตัวระบุตำแหน่งที่อนุมานได้ การทดสอบของมันจะไม่ปลอมไฟล์ transcript
  `/tmp/*.jsonl` ที่ active อีกต่อไป
- helper BTW และ compaction-checkpoint ตอนนี้อ่านและ fork แถว transcript ตาม
  ขอบเขต SQLite metadata ของ checkpoint ตอนนี้เก็บเฉพาะ session id และ leaf/entry id
  เท่านั้น; ตัวระบุตำแหน่งที่อนุมานขึ้นจะไม่ถูกเขียนลงใน payload checkpoint อีกต่อไป
- การ lookup transcript-key ของ Gateway ใช้ขอบเขต transcript ของ SQLite ที่ boundary
  โปรโตคอล และจะไม่ realpath หรือ stat ชื่อไฟล์ transcript อีกต่อไป
- การหมุน transcript ของ Automatic compaction เขียนแถว transcript ตัวสืบทอด
  โดยตรงผ่าน store transcript ของ SQLite แถว session เก็บเฉพาะตัวตนของเซสชันตัวสืบทอด
  ไม่ใช่ path JSONL ที่คงทนหรือตัวระบุตำแหน่งที่ persist แล้ว
- Embedded context-engine compaction ใช้ helper การหมุน transcript ที่ตั้งชื่อตาม SQLite
  การทดสอบ rotation จะไม่สร้าง path JSONL ตัวสืบทอดหรือจำลอง session ที่ active เป็นไฟล์อีกต่อไป
- managed outgoing image retention ใช้ key cache ข้อความ transcript จาก
  stats ของ transcript ใน SQLite แทนการเรียก stat ของ filesystem
- lock ของ session ใน runtime และ lane Doctor สำหรับ legacy `.jsonl.lock`
  แบบสแตนด์อโลนถูกลบแล้ว
- barrel ของ runtime Microsoft Teams และ public plugin SDK จะไม่ re-export
  helper file-lock เก่าอีกต่อไป; path ของสถานะ Plugin ที่ durable backed ด้วย SQLite
- การ prune ตามอายุ/จำนวนของเซสชันและการ cleanup เซสชันแบบชัดเจนถูกลบแล้ว
  Doctor เป็นเจ้าของ legacy import; session ค้างจะถูก reset หรือลบอย่างชัดเจน
- integrity check ของ Doctor จะไม่นับไฟล์ JSONL legacy เป็น transcript ที่ active
  ที่ถูกต้องสำหรับแถว session ของ SQLite อีกต่อไป สุขภาพของ active transcript เป็น SQLite-only;
  ไฟล์ JSONL legacy จะถูกรายงานเป็น input สำหรับ migration/orphan-cleanup
- Doctor จะไม่ถือว่า `agents/<agent>/sessions/` เป็นสถานะ runtime ที่จำเป็นอีกต่อไป
  โดยจะ scan ไดเรกทอรีนั้นเฉพาะเมื่อมีอยู่แล้ว ในฐานะ input สำหรับ legacy import
  หรือ orphan-cleanup
- Gateway `sessions.resolve`, path patch/reset/compact ของเซสชัน, การ spawn subagent,
  fast abort, metadata ของ ACP, session ที่แยกด้วย Heartbeat และการ patch TUI
  จะไม่ migrate หรือ prune session key legacy เป็น side effect ของงาน runtime ปกติอีกต่อไป
- การ resolve เซสชันของคำสั่ง CLI ตอนนี้ส่งคืน `agentId` เจ้าของ แทน
  `storePath` และจะไม่คัดลอกแถว main-session legacy ระหว่างการ resolve ปกติ
  ของ `--to` หรือ `--session-id` อีกต่อไป การ canonicalize main-row legacy เป็นหน้าที่ของ Doctor เท่านั้น
- การ resolve depth ของ subagent ใน runtime จะไม่อ่าน `sessions.json` หรือ store เซสชัน JSON5
  อีกต่อไป โดยอ่าน `session_entries` ของ SQLite ตาม agent id และ metadata depth/session
  แบบ legacy จะเข้ามาได้เฉพาะผ่าน path import ของ Doctor เท่านั้น
- การ override เซสชันของ auth profile persist ผ่านการ upsert แถว `{agentId, sessionKey}`
  โดยตรง แทนการ lazy-load runtime ของ session-store ที่มีรูปทรงเป็นไฟล์
- verbose gating ของ auto-reply และ helper อัปเดตเซสชันตอนนี้อ่าน/upsert แถวเซสชัน SQLite
  ตามตัวตนของเซสชัน และไม่ต้องมี path store legacy ก่อนแตะสถานะแถวที่ persist แล้วอีกต่อไป
- helper metadata ของ command-run session ตอนนี้ใช้ชื่อและ path module ที่เน้น entry;
  พื้นผิว helper คำสั่ง `session-store` เก่าถูกลบแล้ว
- การ seed bootstrap header และการ harden boundary ของ manual compaction ตอนนี้ mutate
  แถว transcript ใน SQLite โดยตรง caller ของ runtime ส่งตัวตนของเซสชัน ไม่ใช่
  path `.jsonl` ที่เขียนได้
- การ replay ของ silent session-rotation คัดลอก turn ล่าสุดของ user/assistant ด้วย
  `{agentId, sessionId}` จากแถว transcript ใน SQLite โดยจะไม่รับ
  ตัวระบุตำแหน่ง transcript ต้นทางหรือปลายทางอีกต่อไป
- แถว session ใหม่ของ runtime จะไม่เก็บ transcript locator อีกต่อไป caller ใช้
  `{agentId, sessionId}` โดยตรง; คำสั่ง export/debug สามารถเลือกชื่อไฟล์ output
  เมื่อสร้างแถวออกมาเป็นรูปธรรม
- การเริ่ม session transcript แบบ persist ใหม่ตอนนี้เปิดแถว SQLite ตาม
  ขอบเขตเสมอ session manager จะไม่ใช้ path หรือตัวระบุตำแหน่ง transcript จากยุคไฟล์ก่อนหน้า
  เป็นตัวตนของเซสชันใหม่อีกต่อไป
- session transcript ที่ persist แล้วใช้ API แบบชัดเจน
  `openTranscriptSessionManagerForSession({agentId, sessionId})` facade static เก่าอย่าง
  `SessionManager.create/openForSession/list/forkFromSession` ถูกลบแล้ว เพื่อให้
  การทดสอบและโค้ด runtime ไม่เผลอสร้างการค้นหาเซสชันยุคไฟล์ขึ้นมาใหม่
- runtime ของ Plugin จะไม่ expose `api.runtime.agent.session.resolveTranscriptLocatorPath` อีกต่อไป;
  โค้ด Plugin ใช้ helper แถว SQLite และค่า scope
- พื้นผิว SDK สาธารณะ `session-store-runtime` ตอนนี้ export เฉพาะ helper แถว session
  และแถว transcript เท่านั้น helper SQLite schema/path/transaction แบบ focused
  อยู่ใน `sqlite-runtime`; helper raw open/close/reset ยังคงเป็น local-only สำหรับ
  การทดสอบ first-party
- classifier ชื่อไฟล์ trajectory/checkpoint `.jsonl` แบบ legacy ตอนนี้อยู่ใน
  module legacy session-file ของ Doctor การ validate session ของ core จะไม่ import
  helper file-artifact เพื่อพิจารณา session id ของ SQLite ปกติอีกต่อไป
- การรัน subagent แบบ blocking ของ Active Memory ใช้แถว transcript ใน SQLite แทนการ
  สร้างไฟล์ `session.jsonl` ชั่วคราวหรือที่ persist แล้วใต้สถานะ Plugin ตัวเลือก
  `transcriptDir` เก่าถูกลบแล้ว
- การสร้าง slug แบบ one-off และการรัน planner ของ Crestodian ใช้แถว transcript ใน SQLite
  แทนการสร้างไฟล์ `session.jsonl` ชั่วคราว
- การรัน helper `llm-task` และการ extraction ของ hidden commitment ก็ใช้แถว transcript
  ใน SQLite เช่นกัน ดังนั้น session helper สำหรับ model-only เหล่านี้จะไม่สร้าง
  ไฟล์ transcript JSON/JSONL ชั่วคราวอีกต่อไป
- `TranscriptSessionManager` ตอนนี้เป็นเพียงขอบเขต transcript ของ SQLite ที่เปิดแล้ว
  โค้ด runtime เปิดด้วย `openTranscriptSessionManagerForSession({agentId,
sessionId})`; flow create, branch, continue, list และ fork อยู่ใน helper แถว SQLite
  ที่เป็นเจ้าของ แทน facade static ของ manager
  โค้ด Doctor/import/debug จัดการไฟล์ source legacy ที่ชัดเจนนอก
  runtime session manager
- method facade เก่า `SessionManager.newSession()` และ
  `SessionManager.createBranchedSession()` ถูกลบแล้ว session ใหม่
  และ descendant ของ transcript จะถูกสร้างโดย workflow SQLite ที่เป็นเจ้าของ
  แทนการ mutate manager ที่เปิดอยู่แล้วให้เป็น session ที่ persist คนละตัว
- การตัดสินใจ fork parent transcript และการสร้าง fork จะไม่รับ
  `storePath` หรือ `sessionsDir` อีกต่อไป แต่ใช้ขอบเขต transcript SQLite
  `{agentId, sessionId}` แทน metadata path ของ filesystem ที่เก็บไว้
- memory-host จะไม่ export helper classification transcript ของ session-directory
  แบบ no-op อีกต่อไป; การกรอง transcript ตอนนี้อนุมานจาก metadata ของแถว SQLite
  ระหว่างการสร้าง entry
- การทดสอบ session-export ของ memory-host และ QMD ใช้ขอบเขต transcript ของ SQLite
  path เก่า `agents/<agentId>/sessions/*.jsonl` ยังถูกครอบคลุมเฉพาะจุดที่การทดสอบ
  ตั้งใจพิสูจน์ compatibility ของ Doctor/import/export
- การตรวจสอบ session แบบ raw ของ QA-lab ตอนนี้ใช้ `sessions.list` ผ่าน Gateway
  แทนการอ่าน `agents/qa/sessions/sessions.json`; ข้อเสนอแนะของ MSteams
  ผนวกเข้ากับทรานสคริปต์ SQLite โดยตรงโดยไม่สร้างเส้นทาง JSONL ขึ้นมาเอง
- เทิร์นช่องทางขาเข้าที่ใช้ร่วมกันตอนนี้พา `{agentId, sessionKey}` แทน
  `storePath` แบบเดิม เส้นทางการบันทึกของ LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch และ QQBot ตอนนี้อ่านเมทาดาทา updated-at และบันทึก
  แถวเซสชันขาเข้าผ่านตัวตน SQLite
- การคงอยู่ของตัวระบุตำแหน่งทรานสคริปต์ถูกลบออกจากแถวเซสชันที่ใช้งานอยู่
  `resolveSessionTranscriptTarget` คืนค่า `agentId`, `sessionId` และเมทาดาทาหัวข้อ
  แบบไม่บังคับ; doctor เป็นโค้ดเดียวที่นำเข้าชื่อไฟล์ทรานสคริปต์เดิม
- ส่วนหัวทรานสคริปต์ของ runtime เริ่มที่เวอร์ชัน SQLite `1` การอัปเกรด
  รูปทรง JSONL V1/V2/V3 เก่าอยู่เฉพาะในการนำเข้าของ doctor และทำให้ส่วนหัวที่นำเข้า
  เป็นเวอร์ชันทรานสคริปต์ SQLite ปัจจุบันก่อนจัดเก็บแถว
- guard แบบ database-first ตอนนี้ห้ามใช้ `SessionManager.listAll` และ
  `SessionManager.forkFromSession`; เวิร์กโฟลว์การแสดงรายการเซสชันและ fork/restore
  ต้องอยู่บน API SQLite แบบแถว/มีขอบเขต
- guard ยังห้ามชื่อ helper สำหรับการ parse JSONL ทรานสคริปต์เดิม/ซ่อมแซม active-branch
  นอกโค้ด doctor/import เพื่อไม่ให้ runtime เพิ่มเส้นทางการย้ายทรานสคริปต์เดิม
  เส้นทางที่สอง
- การรัน PI แบบฝังตัวปฏิเสธ handle ทรานสคริปต์ขาเข้า โดยใช้ตัวตน SQLite
  `{agentId, sessionId}` ก่อนเปิด worker และอีกครั้งก่อนที่ attempt จะแตะ
  สถานะทรานสคริปต์ อินพุต `/tmp/*.jsonl` ที่เก่าแล้วไม่สามารถเลือก
  เป้าหมายการเขียนของ runtime ได้
- ระเบียน cache trace, payload Anthropic, raw stream และ diagnostics timeline
  ตอนนี้เขียนเป็นแถว SQLite `diagnostic_events` แบบมีชนิด Gateway stability bundle
  ตอนนี้เขียนเป็นแถว SQLite `diagnostic_stability_bundles` แบบมีชนิด เส้นทาง override JSONL เก่า
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` และ
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` ถูกลบแล้ว และการจับ stability ปกติ
  จะไม่เขียนไฟล์ `logs/stability/*.json` อีกต่อไป
- การคงอยู่ของ Cron ตอนนี้กระทบยอดแถว SQLite `cron_jobs` แทนการ
  ลบ/แทรกทั้งตารางงานใหม่ทุกครั้งที่บันทึก การเขียนกลับเป้าหมาย Plugin
  อัปเดตแถว cron ที่ตรงกันโดยตรง และคงสถานะ cron ของ runtime ไว้ใน
  transaction ฐานข้อมูลสถานะเดียวกัน
- ผู้เรียก Cron runtime ตอนนี้ใช้คีย์ SQLite cron store ที่เสถียร เส้นทาง
  `cron.store` เดิมเป็นอินพุตนำเข้าของ doctor เท่านั้น; เส้นทาง production gateway,
  task maintenance, status, run-log และการเขียนกลับเป้าหมาย Telegram ใช้
  `resolveCronStoreKey` และไม่ normalize เส้นทางของคีย์อีกต่อไป สถานะ Cron ตอนนี้
  รายงาน `storeKey` แทนฟิลด์ `storePath` แบบรูปทรงไฟล์เก่า
- การโหลดและการจัดตาราง Cron runtime จะไม่ normalize รูปทรงงานที่คงอยู่แบบเดิม
  เช่น `jobId`, `schedule.cron`, `atMs` แบบตัวเลข, boolean แบบสตริง หรือ
  `sessionTarget` ที่หายไปอีกต่อไป การนำเข้าเดิมของ doctor เป็นเจ้าของการซ่อมเหล่านั้น
  ก่อนแทรกแถวลงใน SQLite
- ACP spawn จะไม่ resolve หรือคงอยู่เส้นทางไฟล์ JSONL ของทรานสคริปต์อีกต่อไป
  การตั้งค่า spawn และ thread-bind จะคงอยู่แถวเซสชัน SQLite โดยตรง และเก็บ
  session id เป็นตัวตนทรานสคริปต์ที่รักษาไว้
- API เมทาดาทาเซสชัน ACP ตอนนี้อ่าน/แสดงรายการ/upsert แถว SQLite ตาม `agentId` และ
  ไม่เปิดเผย `storePath` เป็นส่วนหนึ่งของสัญญา entry เซสชัน ACP อีกต่อไป
- การคิดบัญชีการใช้งานเซสชันและการรวมการใช้งานของ Gateway ตอนนี้ resolve ทรานสคริปต์
  ด้วย `{agentId, sessionId}` เท่านั้น แคช cost/usage และสรุป discovered-session
  จะไม่สังเคราะห์หรือคืนค่าสตริงตัวระบุตำแหน่งทรานสคริปต์อีกต่อไป
- การ append แชตของ Gateway, การคงอยู่ abort-partial, `/sessions.send` และ
  การเขียนทรานสคริปต์สื่อ webchat ผนวกโดยตรงผ่านขอบเขตทรานสคริปต์ SQLite
  helper สำหรับ transcript-injection ของ Gateway จะไม่รับพารามิเตอร์
  `transcriptLocator` อีกต่อไป
- การค้นพบทริานสคริปต์ SQLite ตอนนี้แสดงเฉพาะขอบเขตและสถิติของทรานสคริปต์:
  `{agentId, sessionId, updatedAt, eventCount}` helper compatibility
  `listSqliteSessionTranscriptLocators` ที่ตายแล้วและฟิลด์ `locator` ต่อแถว
  ถูกลบแล้ว
- runtime ซ่อมแซมทรานสคริปต์ตอนนี้เปิดเผยเฉพาะ
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` helper ซ่อมแซม
  แบบอิง locator เก่าถูกลบแล้ว; โค้ด doctor/debug อ่านเส้นทางไฟล์ต้นทางที่ระบุชัดเจน
  และไม่ย้ายสตริง locator
- runtime ACP replay ledger ตอนนี้จัดเก็บแถว replay ต่อเซสชันในฐานข้อมูลสถานะ
  SQLite ที่ใช้ร่วมกันแทน `acp/event-ledger.json`; doctor นำเข้าและลบไฟล์เดิม
- helper อ่านทรานสคริปต์ของ Gateway ตอนนี้อยู่ใน
  `src/gateway/session-transcript-readers.ts` แทนชื่อโมดูลเก่า
  `session-utils.fs` การตรวจประวัติ fallback retry ถูกตั้งชื่อตาม
  เนื้อหาทรานสคริปต์ SQLite แทนพื้นผิว helper ไฟล์เก่า
- helper injected-chat และ compaction ของ Gateway ตอนนี้ส่งขอบเขตทรานสคริปต์ SQLite
  ผ่าน API helper ภายใน แทนการตั้งชื่อค่าเป็นเส้นทางทรานสคริปต์หรือ
  ไฟล์ต้นทาง
- การตรวจจับ bootstrap continuation ตอนนี้ตรวจแถวทรานสคริปต์ SQLite ผ่าน
  `hasCompletedBootstrapTranscriptTurn`; ไม่เปิดเผยชื่อ helper แบบรูปทรงไฟล์อีกต่อไป
- การทดสอบ embedded-runner ตอนนี้ใช้ตัวตนทรานสคริปต์ SQLite และการเปิด
  transcript manager ใหม่ต้องมี `sessionId` ที่ระบุชัดเจนเสมอ
- helper การทำดัชนี Memory ตอนนี้ใช้คำศัพท์ทรานสคริปต์ SQLite ตั้งแต่ต้นจนจบ:
  host export `listSessionTranscriptScopesForAgent` และ
  `sessionTranscriptKeyForScope`, คิวซิงก์แบบเจาะจง `sessionTranscripts`,
  hit การค้นหาเซสชันสาธารณะเปิดเผยเส้นทางทึบ `transcript:<agent>:<session>`,
  และคีย์ต้นทาง DB ภายในคือ `session:<session>` ภายใต้
  `source_kind='sessions'` แทนเส้นทางไฟล์ปลอม
- helper persistent-dedupe ของ Plugin SDK ทั่วไปจะไม่เปิดเผยตัวเลือกแบบรูปทรงไฟล์อีกต่อไป
  ผู้เรียกส่งคีย์ขอบเขต SQLite และแถว dedupe แบบ durable อยู่ในสถานะ Plugin ที่ใช้ร่วมกัน
- โทเคน SSO ของ Microsoft Teams ย้ายจากไฟล์ JSON ที่ล็อกไว้ไปยังสถานะ Plugin SQLite
  Doctor นำเข้า `msteams-sso-tokens.json`, สร้างคีย์โทเคน SSO แบบ canonical ใหม่จาก payload
  และลบไฟล์ต้นทาง โทเคน Delegated OAuth ยังคงอยู่บนขอบเขตไฟล์ credential ส่วนตัวเดิม
- สถานะแคช Matrix sync ย้ายจาก `bot-storage.json` ไปยังสถานะ Plugin SQLite
  Doctor นำเข้า payload sync เดิมแบบ raw หรือ wrapped และลบไฟล์ต้นทาง
  ไคลเอนต์ Matrix และ QA Matrix ที่ใช้งานอยู่ส่งไดเรกทอรีราก sync-store ของ SQLite
  ไม่ใช่เส้นทาง `sync-store.json` หรือ `bot-storage.json` ปลอม
- สถานะการย้าย legacy crypto ของ Matrix ย้ายจาก
  `legacy-crypto-migration.json` ไปยังสถานะ Plugin SQLite Doctor นำเข้า
  ไฟล์สถานะเก่า; snapshot IndexedDB ของ Matrix SDK ย้ายจาก
  `crypto-idb-snapshot.json` ไปยัง blob ของ Plugin SQLite คีย์กู้คืนและ
  credential ของ Matrix เป็นแถวสถานะ Plugin SQLite; ไฟล์ JSON เก่าของสิ่งเหล่านั้น
  เป็นอินพุตการย้ายของ doctor เท่านั้น
- บันทึกกิจกรรม Memory Wiki ตอนนี้ใช้สถานะ Plugin SQLite แทน
  `.openclaw-wiki/log.jsonl` provider การย้ายของ Memory Wiki นำเข้าบันทึก JSONL เก่า;
  markdown ของ wiki และเนื้อหา user vault ยังคง file-backed เป็น
  เนื้อหา workspace
- Memory Wiki จะไม่สร้าง `.openclaw-wiki/state.json` หรือไดเรกทอรี
  `.openclaw-wiki/locks` ที่ไม่ได้ใช้อีกต่อไป provider การย้ายจะลบไฟล์เมทาดาทา Plugin
  ที่ปลดระวางเหล่านั้น หาก vault เก่ายังมีอยู่
- รายการ audit ของ Crestodian ตอนนี้ใช้สถานะ Plugin SQLite ของ core แทน
  `audit/crestodian.jsonl` Doctor นำเข้าบันทึก audit JSONL เดิมและ
  ลบหลังจากนำเข้าสำเร็จ
- รายการ audit การเขียน/สังเกต config ตอนนี้ใช้สถานะ Plugin SQLite ของ core
  แทน `logs/config-audit.jsonl` Doctor นำเข้าบันทึก audit JSONL เดิมและ
  ลบหลังจากนำเข้าสำเร็จ
- macOS companion จะไม่เขียน sidecar `logs/config-audit.jsonl` หรือ
  `logs/config-health.json` ภายใน app ขณะแก้ไข `openclaw.json` อีกต่อไป ไฟล์ config
  ยังคง file-backed, snapshot กู้คืนอยู่ข้างไฟล์ config และสถานะ audit/health ของ config
  แบบ durable เป็นของ Gateway SQLite store
- การอนุมัติที่รอดำเนินการสำหรับ Crestodian rescue ตอนนี้ใช้สถานะ Plugin SQLite ของ core
  แทน `crestodian/rescue-pending/*.json` Doctor นำเข้าไฟล์การอนุมัติที่รอดำเนินการเดิม
  และลบหลังจากนำเข้าสำเร็จ
- สถานะ arm ชั่วคราวของ Phone Control ตอนนี้ใช้สถานะ Plugin SQLite แทน
  `plugins/phone-control/armed.json` Doctor นำเข้าไฟล์ armed-state เดิม
  เข้า namespace `phone-control/arm-state` และลบไฟล์นั้น
- Doctor จะไม่ซ่อมทรานสคริปต์ JSONL ในที่เดิมหรือสร้างไฟล์สำรอง JSONL
  อีกต่อไป โดยนำเข้า active branch เข้า SQLite และลบต้นทางเดิม
- การ lookup ทรานสคริปต์ของ session-memory hook ใช้การอ่าน SQLite แบบขอบเขตเท่านั้น
  `{agentId, sessionId}` helper ของมันจะไม่รับหรือ derive ตัวระบุตำแหน่งทรานสคริปต์,
  การอ่านไฟล์เดิม หรือ option เขียนไฟล์ใหม่อีกต่อไป
- การ binding conversation ของ Codex app-server ตอนนี้ key สถานะ Plugin SQLite ด้วย
  คีย์เซสชัน OpenClaw หรือขอบเขต `{agentId, sessionId}` ที่ระบุชัดเจน ต้องไม่
  เก็บ binding fallback แบบ transcript-path
- การอ่าน mirrored-history ของ Codex app-server ใช้เฉพาะขอบเขตทรานสคริปต์ SQLite;
  ต้องไม่กู้คืนตัวตนจากเส้นทางไฟล์ทรานสคริปต์
- เส้นทาง role-ordering และ compaction reset จะไม่ unlink ไฟล์ทรานสคริปต์เก่าอีกต่อไป;
  reset เพียงหมุนเวียนแถวเซสชัน SQLite และตัวตนทรานสคริปต์
- response reset และ checkpoint ของ Gateway คืนค่าแถวเซสชันที่สะอาดพร้อม session id
  และไม่สังเคราะห์ตัวระบุตำแหน่งทรานสคริปต์ SQLite ให้ไคลเอนต์อีกต่อไป
- Memory-core dreaming จะไม่ prune แถวเซสชันด้วยการ probe หาไฟล์ JSONL ที่หายไปอีกต่อไป
  การ cleanup subagent ผ่าน API runtime เซสชันแทนการตรวจการมีอยู่ของ filesystem
  การทดสอบ transcript-ingestion ของมัน seed แถว SQLite โดยตรงแทนการสร้าง fixture
  `agents/<id>/sessions` หรือ placeholder locator
- การทำดัชนีทรานสคริปต์ Memory อาจเปิดเผย `transcript:<agentId>:<sessionId>` เป็น
  เส้นทาง search-hit เสมือนสำหรับ helper citation/read แหล่งดัชนีแบบ durable เป็น
  เชิงสัมพันธ์ (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`) ดังนั้นค่านี้ไม่ใช่ตัวระบุตำแหน่งทรานสคริปต์ของ runtime,
  ไม่ใช่เส้นทาง filesystem และต้องไม่ถูกส่งกลับเข้า API runtime เซสชันเด็ดขาด
- สถานะ Memory ของ Gateway doctor อ่านจำนวน short-term recall และ phase-signal
  จากแถวสถานะ Plugin SQLite แทน `memory/.dreams/*.json`; เอาต์พุต CLI และ
  doctor ตอนนี้ติดป้าย storage นั้นเป็น SQLite store ไม่ใช่เส้นทาง
- Memory-core runtime, สถานะ CLI, เมธอด Gateway doctor และ facade ของ Plugin SDK
  จะไม่ audit หรือ archive ไฟล์ `.dreams/session-corpus` เดิมอีกต่อไป
  ไฟล์เหล่านั้นเป็นอินพุตการย้ายเท่านั้น; doctor นำเข้าเข้า SQLite และ
  ลบต้นทางหลังการตรวจสอบ แถวหลักฐาน active session-ingestion ตอนนี้ใช้เส้นทาง SQLite เสมือน
  `memory/session-ingestion/<day>.txt`; runtime ไม่เคยเขียนหรือ derive สถานะจาก
  `.dreams/session-corpus`
- artifact สาธารณะของ Memory-core เปิดเผย host event ของ SQLite เป็น artifact JSON เสมือน
  `memory/events/memory-host-events.json`; ไม่ใช้เส้นทางต้นทางเดิม
  `.dreams/events.jsonl` ซ้ำอีกต่อไป
- registry ของ sandbox container/browser ตอนนี้ใช้ตาราง SQLite
  `sandbox_registry_entries` ที่ใช้ร่วมกัน พร้อมคอลัมน์ session, image, timestamp,
  backend/config และ browser port แบบมีชนิด Doctor นำเข้าไฟล์ registry JSON เดิม
  ทั้งแบบ monolithic และ sharded และลบต้นทางที่สำเร็จ การอ่าน runtime ใช้
  คอลัมน์แถวแบบมีชนิดเป็นแหล่งความจริง; `entry_json` เป็นเพียงสำเนา replay/debug
- Commitments ตอนนี้ใช้ตาราง `commitments` ที่ใช้ร่วมกันแบบมีชนิด แทน blob JSON
  ทั้ง store การบันทึก snapshot upsert ตาม commitment id และลบเฉพาะแถวที่หายไป
  แทนการล้างและแทรกตารางใหม่ Runtime โหลด commitments จากคอลัมน์ scope,
  delivery-window, status, attempt และ text แบบมีชนิด; `record_json` เป็นเพียง
  สำเนา replay/debug Doctor นำเข้า `commitments.json` เดิมและลบหลังนำเข้าสำเร็จ
- นิยามงาน Cron, สถานะ schedule และประวัติการรันจะไม่มีตัวเขียนหรือตัวอ่าน JSON
  ของ runtime อีกต่อไป Runtime ใช้แถว `cron_jobs` พร้อม schedule แบบมีชนิด,
  เพย์โหลด การส่ง การแจ้งเตือนความล้มเหลว เซสชัน สถานะ และคอลัมน์สถานะรันไทม์ รวมถึงเมตาดาตา
  `cron_run_logs` แบบมีชนิดสำหรับสถานะ สรุปการวินิจฉัย สถานะ/ข้อผิดพลาดการส่ง
  เซสชัน/รัน โมเดล และยอดรวมโทเค็น `job_json` เป็นเพียงสำเนาสำหรับเล่นซ้ำ/ดีบัก; `state_json` เก็บการวินิจฉัยรันไทม์แบบซ้อน
  ที่ยังไม่มีฟิลด์คิวรีที่ใช้บ่อย ขณะที่รันไทม์
  กู้คืนฟิลด์สถานะที่ใช้บ่อยจากคอลัมน์แบบมีชนิด Doctor นำเข้า
  ไฟล์ `jobs.json`, `jobs-state.json` และ `runs/*.jsonl` เดิม แล้วลบ
  แหล่งข้อมูลที่นำเข้า การเขียนกลับเป้าหมาย Plugin จะอัปเดตแถว `cron_jobs`
  ที่ตรงกันแทนการโหลดและแทนที่ที่เก็บ cron ทั้งหมด
- การเริ่มต้น Gateway จะละเว้นมาร์กเกอร์ `notify: true` เดิมในการฉายภาพรันไทม์
  Doctor แปลมาร์กเกอร์เหล่านั้นเป็นการส่ง SQLite แบบชัดเจนเมื่อ
  `cron.webhook` ถูกต้อง ลบมาร์กเกอร์ที่ไม่ทำงานเมื่อไม่ได้ตั้งค่าไว้ และคง
  มาร์กเกอร์ไว้พร้อมคำเตือนเมื่อ Webhook ที่กำหนดค่าไม่ถูกต้อง
- คิวการส่งขาออกและเซสชันตอนนี้เก็บสถานะคิว ชนิดรายการ
  คีย์เซสชัน ช่องทาง เป้าหมาย รหัสบัญชี จำนวนครั้งที่ลองใหม่ ความพยายาม/ข้อผิดพลาดล่าสุด
  สถานะการกู้คืน และมาร์กเกอร์การส่งผ่านแพลตฟอร์มเป็นคอลัมน์แบบมีชนิดในตาราง
  `delivery_queue_entries` ที่ใช้ร่วมกัน การกู้คืนรันไทม์อ่านฟิลด์ที่ใช้บ่อยเหล่านั้นจาก
  คอลัมน์แบบมีชนิด และการเปลี่ยนแปลงการลองใหม่/กู้คืนจะอัปเดตคอลัมน์เหล่านั้นโดยตรง
  โดยไม่เขียน JSON สำหรับเล่นซ้ำใหม่ เพย์โหลด JSON แบบเต็มยังคงอยู่เพียงเป็น
  บล็อบสำหรับเล่นซ้ำ/ดีบักสำหรับเนื้อหาข้อความและข้อมูลเล่นซ้ำที่ไม่ค่อยใช้
- ระเบียนรูปภาพขาออกที่จัดการตอนนี้ใช้แถว
  `managed_outgoing_image_records` แบบมีชนิดที่ใช้ร่วมกัน โดยไบต์สื่อยังคงเก็บใน
  `media_blobs` ระเบียน JSON ยังคงอยู่เพียงเป็นสำเนาสำหรับเล่นซ้ำ/ดีบัก
- ค่ากำหนดตัวเลือกโมเดลของ Discord, แฮชการดีพลอยคำสั่ง และการผูกเธรด
  ตอนนี้ใช้สถานะ Plugin แบบ SQLite ที่ใช้ร่วมกัน แผนการนำเข้า JSON เดิมของสิ่งเหล่านี้อยู่ในพื้นผิว
  การตั้งค่า/การย้ายข้อมูลของ doctor ของ Plugin Discord ไม่ใช่ในโค้ดย้ายข้อมูลแกนหลัก
- ตัวตรวจจับการนำเข้าดั้งเดิมของ Plugin ใช้โมดูลที่ตั้งชื่อตาม doctor เช่น
  `doctor-legacy-state.ts` หรือ `doctor-state-imports.ts`; โมดูลรันไทม์ช่องทางปกติ
  ต้องไม่นำเข้าตัวตรวจจับ JSON เดิม
- เคอร์เซอร์ catchup และมาร์กเกอร์ dedupe ขาเข้าของ BlueBubbles ตอนนี้ใช้สถานะ Plugin แบบ SQLite
  ที่ใช้ร่วมกัน แผนการนำเข้า JSON เดิมของสิ่งเหล่านี้อยู่ในพื้นผิว
  การตั้งค่า/การย้ายข้อมูลของ doctor ของ Plugin BlueBubbles ไม่ใช่ในโค้ดย้ายข้อมูลแกนหลัก
- ออฟเซ็ตอัปเดตของ Telegram, แถวแคชสติกเกอร์, แถวแคชข้อความที่ส่ง,
  แถวแคชชื่อหัวข้อ และการผูกเธรด ตอนนี้ใช้สถานะ Plugin แบบ SQLite
  ที่ใช้ร่วมกัน แผนการนำเข้า JSON เดิมของสิ่งเหล่านี้อยู่ในพื้นผิว
  การตั้งค่า/การย้ายข้อมูลของ doctor ของ Plugin Telegram ไม่ใช่ในโค้ดย้ายข้อมูลแกนหลัก
- เคอร์เซอร์ catchup ของ iMessage, การแมป short-id ของการตอบกลับ และแถว dedupe sent-echo
  ตอนนี้ใช้สถานะ Plugin แบบ SQLite ที่ใช้ร่วมกัน ไฟล์ `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` และ `imessage/sent-echoes.jsonl` เดิมเป็น
  อินพุตของ doctor เท่านั้น
- แถว dedupe ข้อความของ Feishu ตอนนี้ใช้สถานะ Plugin แบบ SQLite ที่ใช้ร่วมกันแทน
  ไฟล์ `feishu/dedup/*.json` แผนการนำเข้า JSON เดิมของมันอยู่ในพื้นผิว
  การตั้งค่า/การย้ายข้อมูลของ doctor ของ Plugin Feishu ไม่ใช่ในโค้ดย้ายข้อมูลแกนหลัก
- การสนทนา โพล บัฟเฟอร์อัปโหลดที่รอดำเนินการ และการเรียนรู้จากข้อเสนอแนะของ
  Microsoft Teams ตอนนี้ใช้ตารางสถานะ/บล็อบของ Plugin แบบ SQLite ที่ใช้ร่วมกัน เส้นทางอัปโหลดที่รอดำเนินการ
  ใช้ `plugin_blob_entries` เพื่อให้บัฟเฟอร์สื่อถูกเก็บเป็น SQLite BLOB
  แทน JSON แบบ base64 ชื่อตัวช่วยรันไทม์ตอนนี้ใช้การตั้งชื่อ SQLite/สถานะ
  แทนการตั้งชื่อที่เก็บไฟล์ `*-fs` และชิม `storePath` เดิมถูกนำออก
  จากที่เก็บเหล่านี้แล้ว แผนการนำเข้า JSON เดิมของมันอยู่ในพื้นผิวการตั้งค่า/การย้ายข้อมูลของ doctor ของ Plugin Microsoft Teams
- สื่อขาออกที่โฮสต์โดย Zalo ตอนนี้ใช้ `plugin_blob_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทน sidecar ชั่วคราว JSON/bin ของ `openclaw-zalo-outbound-media`
- HTML และเมตาดาตาของตัวดู diff ตอนนี้ใช้ `plugin_blob_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนไฟล์ชั่วคราว `meta.json`/`viewer.html` เอาต์พุต PNG/PDF ที่เรนเดอร์แล้วยังคงเป็น
  การทำให้เป็นรูปธรรมชั่วคราว เพราะการส่งผ่านช่องทางยังต้องใช้เส้นทางไฟล์
- เอกสารที่จัดการของ Canvas ตอนนี้ใช้ `plugin_blob_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนไดเรกทอรีเริ่มต้น `state/canvas/documents` โฮสต์ Canvas ให้บริการบล็อบเหล่านั้น
  โดยตรง; ไฟล์โลคัลจะถูกสร้างเฉพาะสำหรับเนื้อหาผู้ปฏิบัติงาน `host.root`
  แบบชัดเจน หรือการทำให้เป็นรูปธรรมชั่วคราวเมื่อเครื่องอ่านสื่อปลายทาง
  ต้องการเส้นทาง
- การตัดสินใจ audit ของ File Transfer ตอนนี้ใช้ `plugin_state_entries` ของ SQLite ที่ใช้ร่วมกัน
  แทนบันทึกรันไทม์ `audit/file-transfer.jsonl` ที่ไม่จำกัดขนาด Doctor
  นำเข้าไฟล์ audit JSONL เดิมเข้าสู่สถานะ Plugin และลบแหล่งข้อมูล
  หลังจากนำเข้าเรียบร้อย
- lease ของกระบวนการ ACPX และตัวตนอินสแตนซ์ Gateway ตอนนี้ใช้สถานะ Plugin แบบ SQLite
  ที่ใช้ร่วมกัน Doctor นำเข้าไฟล์ `gateway-instance-id` เดิมเข้าสู่สถานะ Plugin
  และลบแหล่งข้อมูล
- สคริปต์ wrapper ที่ ACPX สร้างขึ้นและโฮม Codex ที่แยกไว้เป็นการทำให้เป็นรูปธรรมชั่วคราว
  ภายใต้รากชั่วคราวของ OpenClaw ไม่ใช่สถานะ OpenClaw แบบถาวร
  ระเบียนรันไทม์ ACPX แบบถาวรคือแถว lease ของ SQLite และ gateway-instance;
  พื้นผิว config `stateDir` ของ ACPX เดิมถูกลบออกเพราะไม่มีการเขียนสถานะรันไทม์
  ที่นั่นอีกต่อไป
- ไฟล์แนบสื่อของ Gateway ตอนนี้ใช้ตาราง SQLite `media_blobs` ที่ใช้ร่วมกันเป็น
  ที่เก็บไบต์ตามหลัก เส้นทางโลคัลที่ส่งคืนให้พื้นผิวความเข้ากันได้ของช่องทางและ sandbox
  เป็นการทำให้แถวฐานข้อมูลเป็นรูปธรรมชั่วคราว ไม่ใช่ที่เก็บสื่อถาวร
  allowlist สื่อรันไทม์ไม่รวมราก `media` เดิมของ
  `$OPENCLAW_STATE_DIR/media` หรือไดเรกทอรี config อีกต่อไป; ไดเรกทอรีเหล่านั้นเป็น
  แหล่งนำเข้าของ doctor เท่านั้น
- การเติมคำสั่งของ shell ไม่เขียนไฟล์แคช `$OPENCLAW_STATE_DIR/completions/*`
  อีกต่อไป เส้นทาง smoke ของการติดตั้ง doctor อัปเดต และรีลีสใช้เอาต์พุต
  การเติมคำสั่งที่สร้างขึ้นหรือการ source โปรไฟล์แทนไฟล์แคชการเติมคำสั่ง
  แบบถาวร
- staging การอัปโหลด Skills ของ Gateway ตอนนี้ใช้แถว `skill_uploads` ที่ใช้ร่วมกัน
  เมตาดาตาการอัปโหลด คีย์ idempotency และไบต์ archive อยู่ใน SQLite; ตัวติดตั้ง
  จะได้รับเฉพาะเส้นทาง archive ที่ทำให้เป็นรูปธรรมชั่วคราวขณะการติดตั้ง
  กำลังทำงาน
- ไฟล์แนบ inline ของ subagent ไม่ถูกทำให้เป็นรูปธรรมภายใต้
  `.openclaw/attachments/*` ของ workspace อีกต่อไป เส้นทาง spawn เตรียมรายการ seed ของ SQLite VFS,
  การรัน inline seed รายการเหล่านั้นเข้า namespace scratch รันไทม์ต่อเอเจนต์,
  และเครื่องมือที่อิงดิสก์ overlay scratch ของ SQLite นั้นสำหรับเส้นทางไฟล์แนบ คอลัมน์รีจิสทรี attachment-dir
  ของ subagent-run และ hook cleanup เดิมถูกลบแล้ว
- การ hydrate รูปภาพของ CLI ไม่ดูแลไฟล์แคช `openclaw-cli-images` ที่คงที่อีกต่อไป
  backend CLI ภายนอกยังคงได้รับเส้นทางไฟล์ แต่เส้นทางเหล่านั้นเป็น
  การทำให้เป็นรูปธรรมชั่วคราวต่อการรันพร้อม cleanup
- การวินิจฉัย cache-trace, การวินิจฉัยเพย์โหลด Anthropic, การวินิจฉัยสตรีมโมเดลดิบ,
  เหตุการณ์ timeline การวินิจฉัย และบันเดิลเสถียรภาพของ Gateway ตอนนี้
  เขียนแถว SQLite แทนไฟล์ `logs/*.jsonl` หรือ
  `logs/stability/*.json`
  แฟล็กและ env var สำหรับ override เส้นทางรันไทม์ถูกลบออกแล้ว; คำสั่ง export/debug
  สามารถทำให้ไฟล์เป็นรูปธรรมอย่างชัดเจนจากแถวฐานข้อมูล
- แอปคู่หู macOS ไม่มีตัวเขียน `diagnostics.jsonl` แบบ rolling อีกต่อไป บันทึกของแอป
  ไปยัง unified logging และการวินิจฉัย Gateway แบบถาวรยังคงอิง SQLite
- รายการระเบียน port-guardian ของ macOS ตอนนี้ใช้แถว
  `macos_port_guardian_records` ของ SQLite ที่ใช้ร่วมกันแบบมีชนิด แทนไฟล์ JSON ใน Application Support
  หรือบล็อบ singleton แบบทึบ
- ล็อก singleton ของ Gateway ตอนนี้ใช้แถว `state_leases` ของ SQLite ที่ใช้ร่วมกันแบบมีชนิดภายใต้
  scope `gateway_locks` แทนไฟล์ล็อกในไดเรกทอรีชั่วคราว เอกสารการแก้ปัญหา Fly และ OAuth
  ตอนนี้ชี้ไปที่ SQLite lease/auth refresh lock แทน
  การ cleanup file-lock ที่ล้าสมัย
- สถานะ restart sentinel ของ Gateway ตอนนี้ใช้แถว
  `gateway_restart_sentinel` ของ SQLite ที่ใช้ร่วมกันแบบมีชนิดแทน `restart-sentinel.json`; รันไทม์
  อ่านชนิด sentinel, สถานะ, routing, ข้อความ, continuation และ stats จาก
  คอลัมน์แบบมีชนิด `payload_json` เป็นเพียงสำเนาสำหรับเล่นซ้ำ/ดีบัก โค้ดรันไทม์ล้าง
  แถว SQLite โดยตรงและไม่พก plumbing cleanup ไฟล์อีกต่อไป
- สถานะ restart intent และ supervisor handoff ของ Gateway ตอนนี้ใช้แถว
  `gateway_restart_intent` และ `gateway_restart_handoff` ของ SQLite ที่ใช้ร่วมกันแบบมีชนิด แทน
  sidecar `gateway-restart-intent.json` และ
  `gateway-supervisor-restart-handoff.json`
- การประสานงาน singleton ของ Gateway ตอนนี้ใช้แถว `state_leases` แบบมีชนิดภายใต้
  `gateway_locks` แทนการเขียนไฟล์ `gateway.<hash>.lock` แถว lease
  เป็นเจ้าของ lock owner, expiry, Heartbeat และเพย์โหลดดีบัก; SQLite เป็นเจ้าของ
  ขอบเขต atomic acquire/release ตัวเลือกไดเรกทอรี file-lock ที่เลิกใช้แล้ว
  ถูกลบออก; การทดสอบใช้ตัวตนของแถว SQLite โดยตรง
- ตัวช่วยรายงานการใช้งาน cron เดิมที่ไม่มีการอ้างอิง ซึ่งสแกนไฟล์ `cron/runs/*.jsonl`
  ถูกลบแล้ว รายงานประวัติการรัน Cron ควรอ่านแถว SQLite
  `cron_run_logs` แบบมีชนิด
- การกู้คืน restart ของเซสชันหลักตอนนี้ค้นพบ agent ผู้สมัครผ่านรีจิสทรี
  `agent_databases` ของ SQLite แทนการสแกนไดเรกทอรี `agents/*/sessions`
- การกู้คืน session-corruption ของ Gemini ตอนนี้ลบเฉพาะแถวเซสชัน SQLite;
  ไม่ต้องใช้ gate `storePath` เดิมหรือพยายาม unlink เส้นทาง
  transcript JSONL ที่ derive มาอีกต่อไป
- การจัดการ path override ตอนนี้ถือค่า environment แบบ literal `undefined`/`null`
  เป็นไม่ได้ตั้งค่า ป้องกันฐานข้อมูล `undefined/state/*.sqlite`
  ภายใต้ราก repo โดยไม่ได้ตั้งใจระหว่างการทดสอบหรือการส่งต่อ shell
- fingerprint สุขภาพ config ตอนนี้ใช้แถว `config_health_entries` ของ SQLite ที่ใช้ร่วมกันแบบมีชนิด
  แทน `logs/config-health.json` ทำให้ไฟล์ config ปกติเป็น
  เอกสาร configuration ที่ไม่ใช่ credential เพียงอย่างเดียว แอปคู่หู macOS เก็บเฉพาะ
  สถานะสุขภาพภายในกระบวนการและไม่สร้าง sidecar JSON เดิมขึ้นใหม่
- รันไทม์โปรไฟล์ auth ไม่ได้นำเข้าหรือเขียนไฟล์ credential JSON อีกต่อไป
  ที่เก็บ credential ตามหลักคือ SQLite; `auth-profiles.json`, `auth.json`
  ต่อเอเจนต์ และ `credentials/oauth.json` ที่ใช้ร่วมกันเป็นอินพุตการย้ายข้อมูลของ doctor
  ที่จะถูกลบหลังนำเข้า
- การทดสอบ save/state ของโปรไฟล์ auth ตอนนี้ assert ตาราง auth ของ SQLite แบบมีชนิดโดยตรง
  และใช้ชื่อไฟล์ auth-profile เดิมเฉพาะสำหรับอินพุตการย้ายข้อมูลของ doctor
- `openclaw secrets apply` scrub เฉพาะไฟล์ config, ไฟล์ env และที่เก็บ
  auth-profile ของ SQLite เท่านั้น ไม่พกตรรกะความเข้ากันได้ที่แก้ไข
  `auth.json` ต่อเอเจนต์ที่เลิกใช้แล้วอีกต่อไป; doctor เป็นเจ้าของการนำเข้าและลบไฟล์นั้น
- แผนและการ apply การย้าย secret ของ Hermes นำเข้าโปรไฟล์ API-key
  เข้าสู่ที่เก็บ auth-profile ของ SQLite โดยตรง ไม่เขียนหรือตรวจสอบ
  `auth-profiles.json` เป็นเป้าหมายขั้นกลางอีกต่อไป
- เอกสาร auth สำหรับผู้ใช้ตอนนี้อธิบาย
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` แทนการบอกให้ผู้ใช้
  ตรวจสอบหรือคัดลอก `auth-profiles.json`; ชื่อ JSON เดิมของ OAuth/auth
  ยังคงถูกบันทึกไว้เฉพาะเป็นอินพุตการนำเข้าของ doctor
- ตัวช่วยเส้นทางสถานะแกนหลักไม่เปิดเผยไฟล์ `credentials/oauth.json`
  ที่เลิกใช้แล้วอีกต่อไป ชื่อไฟล์เดิมอยู่เฉพาะภายในเส้นทางนำเข้า auth ของ doctor
- เอกสารการติดตั้ง ความปลอดภัย onboarding, model-auth และ SecretRef ตอนนี้อธิบาย
  แถว auth-profile ของ SQLite และการสำรอง/ย้ายข้อมูลทั้งสถานะ แทน
  ไฟล์ JSON auth-profile ต่อเอเจนต์
- การค้นพบโมเดล PI ตอนนี้ส่ง credential ตามหลักเข้าสู่ที่เก็บ auth
  `pi-coding-agent` ในหน่วยความจำ ไม่สร้าง scrub หรือเขียน
  `auth.json` ต่อเอเจนต์ระหว่างการค้นพบอีกต่อไป
- การตั้งค่า trigger และ routing ของ Voice Wake ตอนนี้ใช้ตาราง SQLite ที่ใช้ร่วมกันแบบมีชนิด
  แทน `settings/voicewake.json`, `settings/voicewake-routing.json` หรือ
  แถว generic แบบทึบ; doctor นำเข้าไฟล์ JSON เดิมและลบออกหลังจาก
  การย้ายข้อมูลสำเร็จ
- สถานะ update-check ตอนนี้ใช้แถว `update_check_state` ที่ใช้ร่วมกันแบบมีชนิดแทน
  `update-check.json` หรือบล็อบ generic แบบทึบ; doctor นำเข้า
  ไฟล์ JSON เดิมและลบออกหลังจากการย้ายข้อมูลสำเร็จ
- สถานะสุขภาพ config ตอนนี้ใช้แถว `config_health_entries` ที่ใช้ร่วมกันแบบมีชนิดแทน
  `logs/config-health.json` หรือบล็อบ generic แบบทึบ; doctor
  นำเข้าไฟล์ JSON เดิมและลบออกหลังจากการย้ายข้อมูลสำเร็จ
- การอนุมัติการผูกการสนทนาของ Plugin ตอนนี้ใช้แถว
  `plugin_binding_approvals` แบบมีชนิดแทนสถานะ SQLite ที่ใช้ร่วมกันแบบทึบหรือ
  `plugin-binding-approvals.json`; ไฟล์เดิมเป็นอินพุตสำหรับการย้ายข้อมูลของ doctor
- การผูกกับบทสนทนาปัจจุบันแบบทั่วไปตอนนี้จัดเก็บแถว
  `current_conversation_bindings` ที่มีชนิดกำกับ แทนการเขียน
  `bindings/current-conversations.json` ใหม่; doctor นำเข้าไฟล์ JSON เดิมและ
  ลบออกหลังจากย้ายข้อมูลสำเร็จ
- บัญชีแยกประเภทการซิงก์แหล่งที่นำเข้าของ Memory Wiki ตอนนี้จัดเก็บแถวสถานะ Plugin ของ SQLite
  หนึ่งแถวต่อคีย์ vault/source แทนการเขียน `.openclaw-wiki/source-sync.json` ใหม่;
  ผู้ให้บริการการย้ายข้อมูลนำเข้าและลบบัญชีแยกประเภท JSON เดิม
- ระเบียน import-run ของ Memory Wiki ChatGPT ตอนนี้จัดเก็บแถวสถานะ Plugin ของ SQLite
  หนึ่งแถวต่อ vault/run id แทนการเขียน `.openclaw-wiki/import-runs/*.json`
  สแนปช็อต rollback ยังคงเป็นไฟล์ vault แบบชัดเจนจนกว่าการจัดเก็บถาวรของสแนปช็อต
  import-run จะถูกย้ายไปยังที่จัดเก็บ blob
- ไดเจสต์ที่คอมไพล์แล้วของ Memory Wiki ตอนนี้จัดเก็บแถว blob ของ Plugin ใน SQLite แทน
  การเขียน `.openclaw-wiki/cache/agent-digest.json` และ
  `.openclaw-wiki/cache/claims.jsonl` ผู้ให้บริการการย้ายข้อมูลนำเข้าไฟล์แคชเก่า
  และลบไดเรกทอรีแคชเมื่อว่างแล้ว
- การติดตามการติดตั้ง skill ของ ClawHub ตอนนี้จัดเก็บแถวสถานะ Plugin ของ SQLite หนึ่งแถวต่อ
  workspace/skill แทนการเขียนหรืออ่าน sidecar `.clawhub/lock.json` และ
  `.clawhub/origin.json` ขณะรันไทม์ โค้ดรันไทม์ใช้วัตถุสถานะ tracked-install
  แทนนามธรรม lockfile/origin ที่มีรูปแบบไฟล์ Doctor
  นำเข้า sidecar เดิมจาก workspace ของ agent ที่กำหนดค่าไว้และลบออก
  หลังจากนำเข้าอย่างสมบูรณ์
- ดัชนี Plugin ที่ติดตั้งแล้วตอนนี้อ่านและเขียนแถว singleton
  `installed_plugin_index` ของ SQLite แบบ shared ที่มีชนิดกำกับ แทน `plugins/installs.json`;
  ไฟล์ JSON เดิมเป็นเพียงอินพุตสำหรับการย้ายข้อมูลของ doctor และจะถูกลบหลังนำเข้า
- ตัวช่วย path ของ `plugins/installs.json` เดิมตอนนี้อยู่ในโค้ด legacy ของ doctor
  โมดูล runtime plugin-index เปิดเผยเฉพาะตัวเลือก persistence ที่รองรับด้วย SQLite
  ไม่ใช่ path ของไฟล์ JSON
- restart sentinel, restart intent และสถานะ supervisor handoff ของ Gateway ตอนนี้ใช้
  แถว SQLite แบบ shared ที่มีชนิดกำกับ (`gateway_restart_sentinel`,
  `gateway_restart_intent` และ `gateway_restart_handoff`) แทน blob ทึบแบบทั่วไป
  โค้ด restart ขณะรันไทม์ไม่มีสัญญา sentinel/intent/handoff ที่มีรูปแบบไฟล์
- แคชการซิงก์ Matrix, metadata ของ storage, การผูก thread, เครื่องหมาย inbound dedupe,
  สถานะ cooldown ของการยืนยันตอนเริ่มต้น, สแนปช็อต crypto ของ SDK IndexedDB,
  credentials และ recovery keys ตอนนี้ใช้ตารางสถานะ/blob ของ Plugin ใน SQLite แบบ shared
  โครงสร้าง path ขณะรันไทม์ไม่เปิดเผย path metadata `storage-meta.json` อีกต่อไป;
  ชื่อไฟล์นั้นเป็นเพียงอินพุตการย้ายข้อมูลเดิม แผนการนำเข้า JSON เดิมของรายการเหล่านี้
  อยู่ในพื้นผิวการตั้งค่า/การย้ายข้อมูล doctor ของ Matrix Plugin
- การเริ่มต้น Matrix ไม่สแกน รายงาน หรือทำสถานะไฟล์ Matrix เดิมให้เสร็จอีกต่อไป
  การตรวจจับไฟล์ Matrix, การสร้างสแนปช็อต crypto เดิม, สถานะการย้ายข้อมูลการกู้คืน room-key,
  การนำเข้า และการลบแหล่งที่มา เป็นความรับผิดชอบของ doctor ทั้งหมด
- barrel การย้ายข้อมูลของรันไทม์ Matrix ถูกลบแล้ว ตัวช่วยตรวจจับและแก้ไขสถานะ/crypto เดิม
  ถูก Matrix doctor นำเข้าโดยตรง แทนการเป็นส่วนหนึ่งของพื้นผิว API รันไทม์
- เครื่องหมาย reuse ของสแนปช็อตการย้ายข้อมูล Matrix ตอนนี้อยู่ในสถานะ Plugin ของ SQLite
  แทน `matrix/migration-snapshot.json`; doctor ยังสามารถนำ archive ก่อนย้ายข้อมูลที่ยืนยันแล้ว
  เดิมกลับมาใช้ซ้ำได้โดยไม่ต้องเขียนไฟล์สถานะ sidecar
- เคอร์เซอร์ bus และสถานะการเผยแพร่โปรไฟล์ของ Nostr ตอนนี้ใช้สถานะ Plugin ของ SQLite แบบ shared
  แผนการนำเข้า JSON เดิมของรายการเหล่านี้อยู่ในพื้นผิวการตั้งค่า/การย้ายข้อมูล doctor
  ของ Nostr Plugin
- toggle ของเซสชัน Active Memory ตอนนี้ใช้สถานะ Plugin ของ SQLite แบบ shared แทน
  `session-toggles.json`; การเปิด memory กลับมาอีกครั้งจะลบแถวแทนการเขียนวัตถุ JSON ใหม่
- ข้อเสนอและตัวนับการรีวิวของ Skill Workshop ตอนนี้ใช้สถานะ Plugin ของ SQLite แบบ shared
  แทน store `skill-workshop/<workspace>.json` ต่อ workspace แต่ละข้อเสนอ
  เป็นแถวแยกต่างหากภายใต้ `skill-workshop/proposals` และตัวนับการรีวิวเป็นแถวแยกต่างหาก
  ภายใต้ `skill-workshop/reviews`
- การรัน subagent ของผู้รีวิว Skill Workshop ตอนนี้ใช้ตัวแก้ transcript เซสชันของรันไทม์
  แทนการสร้าง path เซสชัน sidecar `skill-workshop/<sessionId>.json`
- lease ของกระบวนการ ACPX ตอนนี้ใช้สถานะ Plugin ของ SQLite แบบ shared ภายใต้
  `acpx/process-leases` แทนรีจิสทรีทั้งไฟล์ `process-leases.json`
  แต่ละ lease ถูกจัดเก็บเป็นแถวของตัวเอง โดยคงการเก็บกวาด stale-process ตอนเริ่มต้น
  ไว้โดยไม่มี path การเขียน JSON ใหม่ขณะรันไทม์
- สคริปต์ wrapper ของ ACPX และ Codex home แบบแยกส่วนถูกสร้างใน root ชั่วคราวของ
  OpenClaw รายการเหล่านี้ถูกสร้างใหม่ตามต้องการและไม่ใช่อินพุต backup หรือการย้ายข้อมูล
- persistence ของรีจิสทรีการรัน subagent ใช้แถว shared `subagent_runs` ที่มีชนิดกำกับ
  path `subagents/runs.json` เก่าตอนนี้เป็นเพียงอินพุตสำหรับการย้ายข้อมูลของ doctor และ
  ชื่อตัวช่วยรันไทม์ไม่อธิบายชั้นสถานะว่า disk-backed อีกต่อไป
  การทดสอบรันไทม์ไม่สร้าง fixture `runs.json` ที่ไม่ถูกต้องหรือว่างเปล่าเพื่อพิสูจน์
  พฤติกรรมรีจิสทรีอีกต่อไป; แต่ seed/read แถว SQLite โดยตรง
- Backup จัด staging ไดเรกทอรี state ก่อน archive, คัดลอกไฟล์ที่ไม่ใช่ฐานข้อมูล,
  snapshot ฐานข้อมูล `*.sqlite` ด้วย `VACUUM INTO`, ละเว้น sidecar WAL/SHM ที่ยังใช้งานอยู่,
  บันทึก metadata ของสแนปช็อตใน archive manifest และบันทึกการรัน backup ที่เสร็จแล้ว
  ใน SQLite พร้อม archive manifest `openclaw backup
create` ตรวจสอบ archive ที่เขียนแล้วโดยค่าเริ่มต้น; `--no-verify` คือ
  fast path แบบชัดเจน
- `openclaw backup restore` ตรวจสอบ archive ก่อนแตกไฟล์ ใช้ manifest ที่ normalize แล้ว
  ของ verifier ซ้ำ และกู้คืน asset ใน manifest ที่ยืนยันแล้วไปยัง path แหล่งที่มาที่บันทึกไว้
  ต้องใช้ `--yes` สำหรับการเขียนและรองรับ `--dry-run` สำหรับแผนการกู้คืน
- ตัวกรอง volatile-path ของ backup แบบเก่าถูกลบแล้ว Backup ไม่ต้องใช้
  live-tar skip list สำหรับไฟล์ JSON/JSONL ของเซสชันหรือ cron เดิมอีกต่อไป เพราะสแนปช็อต SQLite
  ถูก staging ก่อนสร้าง archive
- การเตรียม workspace ใน setup และ onboarding แบบปกติไม่สร้างไดเรกทอรี
  `agents/<agentId>/sessions/` อีกต่อไป รายการเหล่านี้สร้างเฉพาะ config/workspace;
  แถวเซสชัน SQLite และแถว transcript ถูกสร้างตามต้องการในฐานข้อมูลต่อ agent
- การซ่อมแซม permission ด้านความปลอดภัยตอนนี้กำหนดเป้าหมายฐานข้อมูล SQLite แบบ global และต่อ agent
  รวมถึง sidecar WAL/SHM แทน `sessions.json` และไฟล์ transcript JSONL
- ชื่อรันไทม์ของ sandbox registry ตอนนี้อธิบายชนิดรีจิสทรี SQLite โดยตรง
  แทนการพกศัพท์รีจิสทรี JSON เดิมผ่าน store ที่ใช้งานอยู่
- `openclaw reset --scope config+creds+sessions` ลบฐานข้อมูล
  `openclaw-agent.sqlite` ต่อ agent รวมถึง sidecar WAL/SHM ไม่ใช่เฉพาะไดเรกทอรี
  `sessions/` เดิม
- ตัวช่วยเซสชันรวมของ Gateway ตอนนี้ใช้ชื่อแบบเน้น entry:
  `loadCombinedSessionEntriesForGateway` คืนค่า `{ databasePath, entries }`
  การตั้งชื่อ combined-store แบบเก่าถูกลบออกจาก caller รันไทม์แล้ว
- การ seed ช่องทาง Docker MCP ตอนนี้เขียนแถวเซสชันหลักและเหตุการณ์ transcript
  ลงในฐานข้อมูล SQLite ต่อ agent แทนการสร้าง `sessions.json` และ transcript JSONL
- hook session-memory ที่ bundled ตอนนี้แก้ context ของเซสชันก่อนหน้าจาก
  SQLite ด้วย `{agentId, sessionId}` โดยไม่สแกน จัดเก็บ หรือสังเคราะห์
  path transcript หรือไดเรกทอรี `workspace/sessions` อีกต่อไป
- hook command-logger ที่ bundled ตอนนี้เขียนแถว audit ของคำสั่งลงในตาราง SQLite แบบ shared
  `command_log_entries` แทนการ append ไปยัง
  `logs/commands.log`
- allowlist สำหรับการจับคู่ช่องทางตอนนี้เปิดเผยเฉพาะตัวช่วยอ่าน/เขียนที่รองรับด้วย SQLite
  ในรันไทม์และใน Plugin SDK ตัวแก้ path และตัวอ่านไฟล์ `*-allowFrom.json`
  แบบเก่าอยู่เฉพาะภายใต้โค้ดนำเข้า legacy ของ doctor
- `migration_runs` บันทึกการดำเนินการย้ายข้อมูล legacy-state พร้อมสถานะ
  timestamp และรายงาน JSON
- `migration_sources` บันทึกแหล่งไฟล์เดิมแต่ละรายการที่นำเข้า พร้อม hash, size,
  จำนวนระเบียน, ตารางเป้าหมาย, run id, สถานะ และสถานะการลบแหล่งที่มา
- `backup_runs` บันทึก path ของ backup archive, สถานะ และ manifest JSON
- schema แบบ global ไม่เก็บตารางรีจิสทรี `agents` ที่ไม่ได้ใช้
  การค้นพบฐานข้อมูล agent คือรีจิสทรี `agent_databases` ที่เป็น canonical จนกว่ารันไทม์
  จะมีเจ้าของระเบียน agent จริง
- config แค็ตตาล็อกโมเดลที่สร้างขึ้นถูกจัดเก็บในแถว SQLite แบบ global ที่มีชนิดกำกับ
  `agent_model_catalogs` โดยใช้ไดเรกทอรี agent เป็นคีย์ caller รันไทม์ใช้
  `ensureOpenClawModelCatalog`; ไม่มี API ความเข้ากันได้ `models.json` ในโค้ดรันไทม์
  การใช้งานเขียน SQLite และรีจิสทรี PI ที่ฝังไว้ถูก hydrate จาก payload ที่จัดเก็บนั้น
  โดยไม่สร้างไฟล์ `models.json`
- การส่งออก transcript เซสชันเป็น markdown ของ QMD และ config `memory.qmd.sessions`
  ถูกลบแล้ว ไม่มีคอลเลกชัน transcript ของ QMD, ไม่มี path รันไทม์ `qmd/sessions*`,
  และไม่มี bridge session memory ที่รองรับด้วยไฟล์
- รันไทม์ memory-core นำเข้าตัวช่วย indexing transcript ของ SQLite จาก
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` ไม่ใช่
  subpath ของ QMD SDK subpath ของ QMD ยังคง compatibility re-export ไว้เฉพาะสำหรับ
  caller ภายนอกจนกว่าจะมีการล้าง SDK ครั้งใหญ่ที่สามารถลบออกได้
- `index.sqlite` ของ QMD เองตอนนี้เป็นการ materialization รันไทม์ชั่วคราวที่รองรับด้วย
  ตาราง SQLite หลัก `plugin_blob_entries` รันไทม์ไม่สร้าง sidecar แบบคงทน
  `~/.openclaw/agents/<agentId>/qmd` อีกต่อไป
- Plugin เสริม `memory-lancedb` ไม่สร้าง
  `~/.openclaw/memory/lancedb` เป็น store ที่ OpenClaw จัดการโดยนัยอีกต่อไป รายการนี้เป็น
  backend LanceDB ภายนอกและยังคงปิดใช้งานจนกว่า operator จะกำหนดค่า `dbPath`
  แบบชัดเจน
- `check:database-first-legacy-stores` ล้มเหลวเมื่อ source รันไทม์ใหม่จับคู่
  ชื่อ store เดิมกับ API ระบบไฟล์แบบเขียน นอกจากนี้ยังล้มเหลวเมื่อ source รันไทม์
  นำเครื่องหมาย transcript bridge ที่เลิกใช้แล้ว
  `transcriptLocator` หรือ `sqlite-transcript://...` กลับมาอีก โค้ดการย้ายข้อมูล,
  doctor, import และการส่งออกที่ไม่ใช่เซสชันแบบชัดเจนยังคงได้รับอนุญาต
  ชื่อสัญญา legacy ที่กว้างกว่า เช่น `sessionFile`, `storePath` และ facade ยุคไฟล์
  `SessionManager` เก่ายังมีเจ้าของปัจจุบันและต้องมีงาน guard การย้ายข้อมูลแยกต่างหาก
  ก่อนจะกลายเป็น required preflight check ได้ ตอนนี้ guard ยังครอบคลุม store รันไทม์
  `cache/*.json`, sidecar `thread-bindings.json` แบบทั่วไป, JSON สถานะ/run-log ของ cron,
  JSON สุขภาพ config, sidecar restart และ lock, การตั้งค่า Voice Wake, การอนุมัติการผูก Plugin,
  JSON ดัชนี Plugin ที่ติดตั้งแล้ว, JSONL audit ของ File Transfer, activity log ของ Memory Wiki,
  text log เก่าของ `command-logger` ที่ bundled และ knob diagnostics JSONL raw-stream ของ pi-mono
  นอกจากนี้ยังแบนชื่อโมดูล legacy ของ doctor ระดับ root แบบเก่าเพื่อให้โค้ด compatibility
  อยู่ภายใต้ `src/commands/doctor/` handler ดีบัก Android ยังใช้ logcat/เอาต์พุตในหน่วยความจำ
  แทนการ staging ไฟล์แคช `camera_debug.log` หรือ
  `debug_logs.txt`

## รูปร่างสคีมาเป้าหมาย

กำหนดสคีมาให้ชัดเจนอยู่เสมอ สถานะรันไทม์ที่โฮสต์เป็นเจ้าของใช้ตารางที่มีชนิดข้อมูลกำกับ สถานะทึบแสงที่ Plugin เป็นเจ้าของใช้ `plugin_state_entries` / `plugin_blob_entries`; ไม่มีตาราง `kv` ของโฮสต์แบบทั่วไป

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

ฐานข้อมูลของเอเจนต์:

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

ค่าขนาดใหญ่ควรใช้คอลัมน์ `blob` ไม่ใช่การเข้ารหัสเป็นสตริง JSON ให้ใช้ `value_json` สำหรับข้อมูลแบบมีโครงสร้างขนาดเล็กที่ต้องยังตรวจสอบได้ด้วยเครื่องมือ SQLite ทั่วไป

`agent_databases` คือรีจิสทรีมาตรฐานสำหรับสาขานี้ อย่าเพิ่มตาราง `agents` จนกว่าจะมีเจ้าของระเบียนเอเจนต์จริง; การกำหนดค่าเอเจนต์ยังคงอยู่ใน `openclaw.json`

## รูปร่างการย้ายข้อมูลของ Doctor

Doctor ควรเรียกขั้นตอนการย้ายข้อมูลที่ชัดเจนหนึ่งขั้นตอน ซึ่งรายงานได้และรันซ้ำได้อย่างปลอดภัย:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` เรียกใช้การติดตั้งใช้งานการย้ายข้อมูลสถานะหลังจากการตรวจล่วงหน้าการกำหนดค่าตามปกติ และสร้างข้อมูลสำรองที่ตรวจสอบแล้วก่อนนำเข้า การเริ่มต้นรันไทม์และ `openclaw migrate` ต้องไม่นำเข้าไฟล์สถานะ OpenClaw แบบเดิม

คุณสมบัติของการย้ายข้อมูล:

- การย้ายข้อมูลหนึ่งรอบค้นพบแหล่งไฟล์เดิมทั้งหมดและสร้างแผนก่อนแก้ไขสิ่งใด
- Doctor สร้างไฟล์เก็บถาวรสำรองก่อนย้ายข้อมูลที่ตรวจสอบแล้ว ก่อนนำเข้าไฟล์เดิม
- การนำเข้าเป็น idempotent และอิงคีย์จากพาธต้นทาง, mtime, ขนาด, แฮช และตารางเป้าหมาย
- ไฟล์ต้นทางที่สำเร็จจะถูกลบหรือเก็บถาวรหลังจากฐานข้อมูลเป้าหมาย commit แล้ว
- การนำเข้าที่ล้มเหลวจะปล่อยต้นทางไว้ไม่เปลี่ยนแปลงและบันทึกคำเตือนใน `migration_runs`
- โค้ดรันไทม์อ่านเฉพาะ SQLite หลังจากมีการย้ายข้อมูลแล้ว
- ไม่จำเป็นต้องมีพาธดาวน์เกรด/ส่งออกกลับไปเป็นไฟล์รันไทม์

## สินค้าคงคลังการย้ายข้อมูล

ย้ายรายการเหล่านี้เข้าไปในฐานข้อมูลส่วนกลาง:

- การเขียนรันไทม์ของรีจิสทรีงานตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; ตัวนำเข้า sidecar
  `tasks/runs.sqlite` ที่ยังไม่เคยจัดส่งถูกลบแล้ว การบันทึกสแนปช็อตจะ upsert ตาม task
  id และลบเฉพาะแถว task/delivery ที่หายไปเท่านั้น
- การเขียนรันไทม์ของ Task Flow ตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; ตัวนำเข้า sidecar
  `tasks/flows/registry.sqlite` ที่ยังไม่เคยจัดส่งถูกลบแล้ว การบันทึกสแนปช็อตจะ
  upsert ตาม flow id และลบเฉพาะแถว flow ที่หายไปเท่านั้น
- การเขียนรันไทม์ของสถานะ Plugin ตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; ตัวนำเข้า sidecar
  `plugin-state/state.sqlite` ที่ยังไม่เคยจัดส่งถูกลบแล้ว
- การค้นหาหน่วยความจำในตัวไม่ใช้ค่าเริ่มต้นเป็น `memory/<agentId>.sqlite` อีกต่อไป; ตาราง
  ดัชนีของมันอยู่ในฐานข้อมูลของเอเจนต์เจ้าของ และการเลือกใช้ sidecar แบบระบุชัดเจน
  `memorySearch.store.path` ถูกย้ายไปเป็นการย้าย config ของ doctor แล้ว
- การทำดัชนีใหม่ของหน่วยความจำในตัวจะรีเซ็ตเฉพาะตารางที่หน่วยความจำเป็นเจ้าของในฐานข้อมูลเอเจนต์
  ต้องไม่แทนที่ไฟล์ SQLite ทั้งไฟล์ เพราะฐานข้อมูลเดียวกันเป็นเจ้าของ
  เซสชัน ทรานสคริปต์ แถว VFS อาร์ติแฟกต์ และแคชรันไทม์
- รีจิสทรีคอนเทนเนอร์/เบราว์เซอร์ของแซนด์บ็อกซ์จาก JSON แบบโมโนลิธิกและแบบแบ่งชาร์ด การเขียนรันไทม์
  ตอนนี้ใช้ฐานข้อมูลที่ใช้ร่วมกันแล้ว; การนำเข้า JSON เดิมยังคงอยู่
- คำจำกัดความของงาน Cron, สถานะกำหนดการ และประวัติการรันตอนนี้ใช้ SQLite ที่ใช้ร่วมกัน;
  doctor นำเข้า/ลบไฟล์เดิม `jobs.json`, `jobs-state.json` และ
  `cron/runs/*.jsonl`
- ตัวตนอุปกรณ์/auth, push, การตรวจสอบอัปเดต, commitments, แคชโมเดล OpenRouter,
  ดัชนี Plugin ที่ติดตั้งแล้ว และการผูก app-server
- ระเบียนการจับคู่อุปกรณ์/Node และ bootstrap ตอนนี้ใช้ตาราง SQLite แบบมีชนิด
- ผู้สมัครรับการแจ้งเตือน device-pair และเครื่องหมาย delivered-request ตอนนี้ใช้ตาราง
  plugin-state ของ SQLite ที่ใช้ร่วมกันแทน `device-pair-notify.json`
- ระเบียนสายสนทนา voice-call ตอนนี้ใช้ตาราง plugin-state ของ SQLite ที่ใช้ร่วมกันภายใต้เนมสเปซ
  `voice-call` / `calls` แทน `calls.jsonl`; CLI ของ Plugin
  tail และสรุปประวัติสายสนทนาที่มี SQLite เป็นแบ็กเอนด์
- เซสชัน Gateway ของ QQBot, ระเบียน known-user และแคชคำอ้างอิง ref-index ตอนนี้ใช้
  สถานะ Plugin ของ SQLite ภายใต้เนมสเปซ `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) แทน `session-*.json`, `known-users.json`,
  และ `ref-index.jsonl` ไฟล์เดิมเหล่านั้นเป็นแคชและจะไม่ถูกย้าย
- ค่ากำหนดตัวเลือกโมเดลของ Discord, แฮช command-deploy และการผูกเธรด
  ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้เนมสเปซ `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  แทน `model-picker-preferences.json`, `command-deploy-cache.json` และ
  `thread-bindings.json`; การย้าย doctor/setup ของ Discord จะนำเข้าและ
  ลบไฟล์เดิม
- เคอร์เซอร์ catchup และเครื่องหมาย inbound dedupe ของ BlueBubbles ตอนนี้ใช้สถานะ Plugin ของ SQLite
  ภายใต้เนมสเปซ `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  แทน `bluebubbles/catchup/*.json` และ
  `bluebubbles/inbound-dedupe/*.json`; การย้าย doctor/setup ของ BlueBubbles
  จะนำเข้าและลบไฟล์เดิม
- ออฟเซ็ตอัปเดตของ Telegram, รายการแคชสติกเกอร์, รายการแคชข้อความ reply-chain,
  รายการแคช sent-message, รายการแคช topic-name และการผูกเธรด
  ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้เนมสเปซ `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) แทน `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` และ
  `thread-bindings-*.json`; การย้าย doctor/setup ของ Telegram จะนำเข้าและ
  ลบไฟล์เดิม
- เคอร์เซอร์ catchup ของ iMessage, การแมป reply short-id และแถว sent-echo dedupe
  ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้เนมสเปซ `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) แทน `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` และ `imessage/sent-echoes.jsonl`; การย้าย doctor/setup ของ iMessage
  จะนำเข้าและลบไฟล์เดิม
- การสนทนา โพล โทเค็น SSO และการเรียนรู้จากฟีดแบ็กของ Microsoft Teams ตอนนี้
  ใช้เนมสเปซสถานะ Plugin ของ SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) แทน `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` และ `*.learnings.json`; การย้าย
  doctor/setup ของ Microsoft Teams จะนำเข้าและเก็บถาวรไฟล์เดิม
  การอัปโหลดที่รอดำเนินการเป็นแคช SQLite อายุสั้น และไฟล์แคช JSON เก่า
  จะไม่ถูกย้าย
- แคชซิงก์ของ Matrix, เมทาดาทาที่เก็บข้อมูล, การผูกเธรด, เครื่องหมาย inbound dedupe,
  สถานะคูลดาวน์การตรวจสอบตอนเริ่มต้น, ข้อมูลประจำตัว, คีย์กู้คืน และสแนปช็อตคริปโต IndexedDB ของ SDK
  ตอนนี้ใช้เนมสเปซสถานะ/blob ของ Plugin SQLite ภายใต้
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  แทน `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` และ `crypto-idb-snapshot.json`; การย้าย doctor/setup ของ Matrix
  จะนำเข้าและลบไฟล์เดิมเหล่านั้นจากรากที่เก็บข้อมูล Matrix ตามขอบเขตบัญชี
- เคอร์เซอร์บัสและสถานะการเผยแพร่โปรไฟล์ของ Nostr ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้
  เนมสเปซ `nostr` (`bus-state`, `profile-state`) แทน
  `bus-state-*.json` และ `profile-state-*.json`; การย้าย doctor/setup ของ Nostr
  จะนำเข้าและลบไฟล์เดิม
- สวิตช์เซสชันของ Active Memory ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้
  `active-memory/session-toggles` แทน `session-toggles.json`
- คิวข้อเสนอและตัวนับรีวิวของ Skill Workshop ตอนนี้ใช้สถานะ Plugin ของ SQLite
  ภายใต้ `skill-workshop/proposals` และ `skill-workshop/reviews` แทน
  ไฟล์ `skill-workshop/<workspace>.json` แบบต่อเวิร์กสเปซ
- คิวการส่งออกและการส่งเซสชันตอนนี้ใช้ตาราง SQLite ส่วนกลาง
  `delivery_queue_entries` ร่วมกันภายใต้ชื่อคิวที่แยกกัน
  (`outbound-delivery`, `session-delivery`) แทนไฟล์ถาวร
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` และ
  `session-delivery-queue/*.json` ขั้นตอน legacy-state ของ doctor จะนำเข้า
  แถวที่รอดำเนินการและล้มเหลว ลบเครื่องหมายส่งแล้วที่ค้าง และลบไฟล์
  JSON เก่าหลังนำเข้า ฟิลด์การกำหนดเส้นทางด่วนและการลองใหม่เป็นคอลัมน์แบบมีชนิด; payload
  JSON จะคงไว้เฉพาะสำหรับ replay/debug
- lease กระบวนการ ACPX ตอนนี้ใช้สถานะ Plugin ของ SQLite ภายใต้ `acpx/process-leases`
  แทน `process-leases.json`
- เมทาดาทาการรันสำรองข้อมูลและการย้าย

ย้ายรายการเหล่านี้เข้าไปในฐานข้อมูลเอเจนต์:

- รากเซสชันเอเจนต์และ payload session-entry รูปทรงเข้ากันได้ เสร็จแล้วสำหรับ
  การเขียนรันไทม์: เมทาดาทาเซสชันที่ใช้งานบ่อย query ได้ใน `sessions` ขณะที่
  payload `SessionEntry` แบบเต็มรูปทรงเดิมยังคงอยู่ใน `session_entries`
- เหตุการณ์ทรานสคริปต์ของเอเจนต์ เสร็จแล้วสำหรับการเขียนรันไทม์
- checkpoint ของ Compaction และสแนปช็อตทรานสคริปต์ เสร็จแล้วสำหรับการเขียนรันไทม์:
  สำเนาทรานสคริปต์ของ checkpoint เป็นแถวทรานสคริปต์ SQLite และเมทาดาทา checkpoint
  ถูกบันทึกใน `transcript_snapshots` ตัวช่วย checkpoint ของ Gateway
  ตอนนี้เรียกค่าเหล่านี้ว่าสแนปช็อตทรานสคริปต์แทนไฟล์ต้นทาง
- เนมสเปซ scratch/workspace ของ VFS เอเจนต์ เสร็จแล้วสำหรับการเขียน VFS รันไทม์
- payload ไฟล์แนบของซับเอเจนต์ เสร็จแล้วสำหรับการเขียนรันไทม์: เป็นรายการ seed ของ VFS ใน SQLite
  และไม่เป็นไฟล์เวิร์กสเปซถาวร
- อาร์ติแฟกต์เครื่องมือ เสร็จแล้วสำหรับการเขียนรันไทม์
- อาร์ติแฟกต์การรัน เสร็จแล้วสำหรับการเขียนรันไทม์ของ worker ผ่านตารางต่อเอเจนต์
  `run_artifacts`
- แคชรันไทม์ภายในเอเจนต์ เสร็จแล้วสำหรับการเขียนแคชตามขอบเขตรันไทม์ของ worker ผ่าน
  ตารางต่อเอเจนต์ `cache_entries` แคชโมเดลระดับ Gateway ยังคงอยู่ในฐานข้อมูลส่วนกลาง
  เว้นแต่จะกลายเป็นข้อมูลเฉพาะเอเจนต์
- บันทึกสตรีมแม่ของ ACP เสร็จแล้วสำหรับการเขียนรันไทม์
- เซสชันบัญชี replay ของ ACP เสร็จแล้วสำหรับการเขียนรันไทม์ผ่าน
  `acp_replay_sessions` และ `acp_replay_events`; `acp/event-ledger.json` เดิม
  ยังคงอยู่เฉพาะเป็นอินพุตของ doctor
- เมทาดาทาเซสชัน ACP เสร็จแล้วสำหรับการเขียนรันไทม์ผ่าน `acp_sessions`; บล็อกเดิม
  `entry.acp` ใน `sessions.json` เป็นอินพุตการย้ายของ doctor เท่านั้น
- sidecar trajectory เมื่อไม่ใช่ไฟล์ export ที่ระบุชัดเจน เสร็จแล้วสำหรับการเขียนรันไทม์:
  การจับ trajectory เขียนแถว `trajectory_runtime_events` ในฐานข้อมูลเอเจนต์
  และ mirror อาร์ติแฟกต์ตามขอบเขตการรันเข้า SQLite sidecar เดิมเป็นอินพุตนำเข้าของ doctor
  เท่านั้น; export สามารถสร้างเอาต์พุต support-bundle JSONL ใหม่ได้
  แต่ไม่อ่านหรือย้าย sidecar trajectory/transcript เก่าที่รันไทม์
  การจับ trajectory ของรันไทม์เปิดเผยขอบเขต SQLite; ตัวช่วยพาธ JSONL
  ถูกแยกไว้สำหรับการสนับสนุน export/debug และไม่ถูก re-export จากโมดูลรันไทม์
  เมทาดาทา trajectory ของ embedded-runner บันทึกตัวตน `{agentId, sessionId, sessionKey}`
  แทนการคงอยู่ของตัวระบุที่ตั้งทรานสคริปต์

คงรายการเหล่านี้ให้มีไฟล์เป็นแบ็กเอนด์ไว้ก่อน:

- `openclaw.json`
- ไฟล์ข้อมูลประจำตัวของ provider หรือ CLI
- manifest ของ Plugin/package
- เวิร์กสเปซผู้ใช้และรีโพซิทอรี Git เมื่อเลือกโหมดดิสก์
- บันทึกที่ตั้งใจให้ผู้ปฏิบัติงาน tail เว้นแต่พื้นผิวบันทึกเฉพาะจะถูกย้าย

## แผนการย้าย

### ระยะที่ 0: ตรึงขอบเขต

ทำให้ขอบเขต durable-state ชัดเจนก่อนย้ายแถวเพิ่มเติม:

- เพิ่มตาราง `migration_runs` ลงในฐานข้อมูลส่วนกลาง
  เสร็จแล้วสำหรับรายงานการดำเนินการย้าย legacy-state
- เพิ่มบริการย้ายสถานะเดียวที่ doctor เป็นเจ้าของสำหรับการนำเข้าจากไฟล์สู่ฐานข้อมูล
  เสร็จแล้ว: `openclaw doctor --fix` ใช้การใช้งานการย้าย legacy-state
- ทำให้ `plan` เป็นอ่านอย่างเดียว และทำให้ `apply` สร้างข้อมูลสำรอง นำเข้า ตรวจสอบ และ
  จากนั้นลบหรือกักกันไฟล์เก่า
  เสร็จแล้ว: doctor สร้างข้อมูลสำรองก่อนย้ายที่ตรวจสอบแล้ว ส่งพาธข้อมูลสำรอง
  เข้า `migration_runs` และใช้พาธตัวนำเข้า/การลบซ้ำ
- เพิ่มข้อห้ามแบบสแตติกเพื่อให้โค้ดรันไทม์ใหม่เขียนไฟล์สถานะเดิมไม่ได้ ขณะที่
  โค้ดการย้ายและการทดสอบยัง seed/read ได้
  เสร็จแล้วสำหรับ store เดิมที่ย้ายแล้วในปัจจุบัน; guard ยังสแกน
  การทดสอบซ้อนสำหรับสัญญาตัวระบุที่ตั้งทรานสคริปต์ของรันไทม์ที่ต้องห้ามด้วย

### ระยะที่ 1: ทำ Control Plane ส่วนกลางให้เสร็จ

เก็บสถานะการประสานงานที่ใช้ร่วมกันใน `state/openclaw.sqlite`:

- เอเจนต์และรีจิสทรีฐานข้อมูลเอเจนต์
- ledger ของ Task และ Task Flow
- สถานะ Plugin
- รีจิสทรีคอนเทนเนอร์/เบราว์เซอร์ของแซนด์บ็อกซ์
- ประวัติการรัน Cron/scheduler
- การจับคู่ อุปกรณ์ push, update-check, TUI, แคช OpenRouter/model และสถานะรันไทม์ขนาดเล็กอื่น ๆ
  ตามขอบเขต Gateway
- เมทาดาทาการสำรองข้อมูลและการย้าย
- ไบต์ไฟล์แนบสื่อของ Gateway เสร็จแล้วสำหรับการเขียนรันไทม์; พาธไฟล์โดยตรง
  เป็นการ materialize ชั่วคราวเพื่อความเข้ากันได้กับตัวส่งของช่องทางและการ staging ของแซนด์บ็อกซ์
  allowlist ของรันไทม์ยอมรับพาธ materialization ของ SQLite ไม่ใช่ราก media ของ state/config เดิม
  doctor นำเข้าไฟล์สื่อเดิมเข้า `media_blobs` และลบไฟล์ต้นทาง
  หลังเขียนแถวสำเร็จ
- เซสชัน เหตุการณ์ และ payload blob ของการจับ debug proxy เสร็จแล้ว: capture อยู่
  ใน DB สถานะที่ใช้ร่วมกัน และเปิดผ่าน bootstrap, schema,
  WAL และการตั้งค่า busy-timeout ของ DB สถานะที่ใช้ร่วมกัน ไบต์ payload ถูกบีบอัดด้วย gzip ใน
  `capture_blobs.data`; ไม่มีการ override DB sidecar ของรันไทม์ debug proxy,
  ไดเรกทอรี blob หรือเป้าหมาย schema/codegen ที่สร้างเฉพาะ proxy-capture
  การย้าย doctor/startup จะนำเข้าแถว `debug-proxy/capture.sqlite` ที่จัดส่งแล้ว
  และ payload blob ที่อ้างอิง รวมถึง override สภาพแวดล้อม DB/blob เดิมที่ใช้งานอยู่
  จากนั้นเก็บถาวรแหล่งเหล่านั้นโดยปล่อยใบรับรอง CA ไว้เหมือนเดิม

ระยะนี้ยังลบตัวเปิด sidecar ที่ซ้ำกัน ตัวช่วยสิทธิ์ การตั้งค่า WAL
การตัดแต่งระบบไฟล์ และตัวเขียนความเข้ากันได้จากระบบย่อยเหล่านั้นด้วย

### ระยะที่ 2: แนะนำฐานข้อมูลต่อเอเจนต์

สร้างฐานข้อมูลหนึ่งชุดต่อเอเจนต์และลงทะเบียนจาก DB ส่วนกลาง:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

แถว `agent_databases` ส่วนกลางเก็บพาธ เวอร์ชัน schema, timestamp last-seen
และเมทาดาทาขนาด/ความสมบูรณ์พื้นฐาน โค้ดรันไทม์ถามรีจิสทรีเพื่อขอ
DB ของเอเจนต์แทนการอนุมานพาธไฟล์โดยตรง

DB ของเอเจนต์เป็นเจ้าของ:

- `sessions` เป็นรูทเซสชันตามมาตรฐาน โดยมี `session_entries` เป็นตารางเพย์โหลดรูปทรงความเข้ากันได้ที่ผูกกับรูทนั้น และ
  `session_routes` เป็นการค้นหา `session_key` ที่ใช้งานอยู่แบบไม่ซ้ำ
- `conversations` และ `session_conversations` เป็นตัวตนการกำหนดเส้นทางผู้ให้บริการแบบนอร์มัลไลซ์ที่ผูกกับเซสชัน
- `transcript_events`
- สแนปชอตทรานสคริปต์และเช็กพอยต์ Compaction เสร็จแล้วสำหรับการเขียนรันไทม์
- `vfs_entries`
- `tool_artifacts` และอาร์ติแฟกต์การรัน
- แถวรันไทม์/แคชเฉพาะเอเจนต์ เสร็จแล้วสำหรับแคชในขอบเขตเวิร์กเกอร์
- เหตุการณ์สตรีมพาเรนต์ ACP
- เหตุการณ์รันไทม์ทราเจกทอรีเมื่อไม่ใช่อาร์ติแฟกต์ส่งออกแบบชัดเจน

### ระยะที่ 3: แทนที่ API ที่เก็บเซสชัน

เสร็จแล้วสำหรับรันไทม์ พื้นผิวที่เก็บเซสชันรูปทรงไฟล์ไม่ใช่สัญญารันไทม์ที่ใช้งานอยู่:

- รันไทม์ไม่เรียก `loadSessionStore(storePath)` หรือถือว่า `storePath` เป็นตัวตนของเซสชันอีกต่อไป
- การดำเนินการกับแถวของรันไทม์คือ `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` และ `listSessionEntries`
- ตัวช่วยเขียนที่เก็บใหม่ทั้งชุด ตัวเขียนไฟล์ การทดสอบคิว การตัดแต่ง alias และพารามิเตอร์ลบคีย์เดิมถูกนำออกจากรันไทม์แล้ว
- การส่งออกความเข้ากันได้ของแพ็กเกจรูทที่เลิกใช้แล้วยังคงปรับเส้นทาง `sessions.json` ตามมาตรฐานเข้ากับ API แถว SQLite
- การแยกวิเคราะห์ `sessions.json` เหลืออยู่เฉพาะในโค้ดย้าย/นำเข้าของ doctor และการทดสอบ doctor
- การอ่าน fallback ของวงจรชีวิตรันไทม์อ่านส่วนหัวทรานสคริปต์จาก SQLite ไม่ใช่บรรทัดแรกของ JSONL

ลบทุกอย่างที่นำพารามิเตอร์ล็อกไฟล์ คำศัพท์การตัดแต่ง/ตัดทอนในฐานะการบำรุงรักษาไฟล์ ตัวตนเส้นทางที่เก็บ หรือการทดสอบที่มีข้อยืนยันเพียงอย่างเดียวคือการคงอยู่แบบ JSON กลับเข้ามา

### ระยะที่ 4: ย้ายทรานสคริปต์ สตรีม ACP ทราเจกทอรี และ VFS

ทำให้ทุกสตรีมข้อมูลเอเจนต์เป็นแบบเนทีฟของฐานข้อมูล:

- การเขียนต่อท้ายทรานสคริปต์ทำผ่านทรานแซกชัน SQLite เดียวที่รับรองส่วนหัวเซสชัน ตรวจสอบ idempotency ของข้อความ เลือกท้ายพาเรนต์ แทรกลงใน `transcript_events` และบันทึกเมทาดาต้าตัวตนที่ค้นหาได้ใน
  `transcript_event_identities` เสร็จแล้วสำหรับการต่อท้ายข้อความทรานสคริปต์โดยตรงและการต่อท้าย `TranscriptSessionManager` ที่คงอยู่ตามปกติ การดำเนินการกับสาขาแบบชัดเจนยังคงใช้ตัวเลือกพาเรนต์แบบชัดเจนของตน และยังเขียนแถว SQLite โดยไม่อนุมานตัวระบุตำแหน่งไฟล์ใด ๆ
- บันทึกสตรีมพาเรนต์ ACP กลายเป็นแถว ไม่ใช่ไฟล์ `.acp-stream.jsonl` เสร็จแล้ว
- การตั้งค่าการสปอว์น ACP ไม่คงเส้นทาง JSONL ของทรานสคริปต์อีกต่อไป เสร็จแล้ว
- การจับภาพทราเจกทอรีของรันไทม์เขียนแถว/อาร์ติแฟกต์เหตุการณ์โดยตรง คำสั่ง support/export แบบชัดเจนยังสามารถสร้างอาร์ติแฟกต์ JSONL ของ support bundle เป็นรูปแบบส่งออกได้ แต่การส่งออกเซสชันจะไม่สร้าง JSONL ของเซสชันขึ้นใหม่ เสร็จแล้ว
- เวิร์กสเปซบนดิสก์ยังคงอยู่บนดิสก์เมื่อกำหนดค่าเป็นโหมดดิสก์
- scratch ของ VFS และโหมดเวิร์กสเปซแบบ VFS-only เชิงทดลองใช้ฐานข้อมูลเอเจนต์

การย้ายจะนำเข้าไฟล์ JSONL เก่าหนึ่งครั้ง บันทึกจำนวน/แฮชใน `migration_runs` และลบไฟล์ที่นำเข้าแล้วหลังจากตรวจสอบความถูกต้องสมบูรณ์

### ระยะที่ 5: สำรองข้อมูล กู้คืน Vacuum และตรวจสอบ

ข้อมูลสำรองยังคงเป็นไฟล์อาร์ไคฟ์เดียว:

- ทำเช็กพอยต์ทุกฐานข้อมูลส่วนกลางและฐานข้อมูลเอเจนต์
- สแนปชอตแต่ละฐานข้อมูลด้วย semantics การสำรองข้อมูลของ SQLite หรือ `VACUUM INTO`
- อาร์ไคฟ์สแนปชอตฐานข้อมูลขนาดกะทัดรัด การกำหนดค่า ข้อมูลรับรองภายนอก และการส่งออกเวิร์กสเปซที่ร้องขอ
- ละเว้นไฟล์สดดิบ `*.sqlite-wal` และ `*.sqlite-shm`
- ตรวจสอบโดยเปิดทุกสแนปชอตฐานข้อมูลและรัน `PRAGMA integrity_check`
  `openclaw backup create` ทำการตรวจสอบอาร์ไคฟ์นี้โดยค่าเริ่มต้น;
  `--no-verify` ข้ามเฉพาะรอบหลังเขียนอาร์ไคฟ์ ไม่ใช่การตรวจสอบความถูกต้องสมบูรณ์ตอนสร้างสแนปชอต
- การกู้คืนคัดลอกสแนปชอตกลับไปยังเส้นทางเป้าหมาย สาขานี้รีเซ็ตเลย์เอาต์ SQLite ที่ยังไม่เผยแพร่เป็น `user_version = 1`; การเปลี่ยนแปลงสคีมาที่เผยแพร่ในอนาคตสามารถเพิ่มการย้ายแบบชัดเจนได้เมื่อจำเป็น

### ระยะที่ 6: รันไทม์เวิร์กเกอร์

ให้โหมดเวิร์กเกอร์เป็นเชิงทดลองต่อไประหว่างที่การแยกฐานข้อมูลลงจอด:

- เวิร์กเกอร์ได้รับ ID เอเจนต์, ID การรัน, โหมดระบบไฟล์ และตัวตนรีจิสทรีฐานข้อมูล
- เวิร์กเกอร์แต่ละตัวเปิดการเชื่อมต่อ SQLite ของตนเอง
- พาเรนต์คงอำนาจการส่งผ่านช่องทาง การอนุมัติ การกำหนดค่า และการยกเลิก
- เริ่มด้วยเวิร์กเกอร์หนึ่งตัวต่อการรันที่ใช้งานอยู่ เพิ่ม pooling หลังจากวงจรชีวิตและความเป็นเจ้าของการเชื่อมต่อฐานข้อมูลเสถียรแล้วเท่านั้น

### ระยะที่ 7: ลบโลกเก่า

เสร็จแล้วสำหรับการจัดการเซสชันรันไทม์ โลกเก่าได้รับอนุญาตเฉพาะเป็นอินพุต doctor แบบชัดเจนหรือเอาต์พุต support/export:

- ไม่มีการเขียน `sessions.json`, JSONL ของทรานสคริปต์, JSON รีจิสทรี sandbox, SQLite sidecar ของงาน หรือ SQLite sidecar ของสถานะ Plugin ในรันไทม์
- ไม่มีการตัดแต่งไฟล์ JSON/เซสชัน การตัดทอนไฟล์ทรานสคริปต์ ล็อกไฟล์เซสชัน หรือการทดสอบเซสชันรูปทรงล็อก
- ไม่มีการส่งออกความเข้ากันได้ของรันไทม์ที่มีจุดประสงค์เพื่อทำให้ไฟล์เซสชันเก่าทันสมัย
- การส่งออก support แบบชัดเจนยังคงเป็นรูปแบบอาร์ไคฟ์/การสร้างวัสดุตามที่ผู้ใช้ร้องขอ และต้องไม่ป้อนชื่อไฟล์กลับเข้าไปในตัวตนรันไทม์

## การสำรองข้อมูลและการกู้คืน

ข้อมูลสำรองควรเป็นไฟล์อาร์ไคฟ์เดียว แต่การจับฐานข้อมูลควรเป็นแบบเนทีฟของ SQLite:

1. หยุดกิจกรรมเขียนที่รันนาน หรือเข้าสู่กำแพงสำรองข้อมูลช่วงสั้น
2. สำหรับทุกฐานข้อมูลส่วนกลางและฐานข้อมูลเอเจนต์ ให้รันเช็กพอยต์
3. สแนปชอตแต่ละฐานข้อมูลโดยใช้ semantics การสำรองข้อมูลของ SQLite หรือ `VACUUM INTO` ไปยังไดเรกทอรีสำรองชั่วคราว
4. อาร์ไคฟ์สแนปชอตฐานข้อมูลที่ถูก compact แล้ว ไฟล์กำหนดค่า ไดเรกทอรีข้อมูลรับรอง เวิร์กสเปซที่เลือก และ manifest
5. ตรวจสอบอาร์ไคฟ์โดยเปิดทุกสแนปชอต SQLite ที่รวมอยู่และรัน
   `PRAGMA integrity_check`
   `openclaw backup create` ทำสิ่งนี้โดยค่าเริ่มต้น; `--no-verify` มีไว้เฉพาะสำหรับการข้ามรอบหลังเขียนอาร์ไคฟ์โดยตั้งใจ

อย่าพึ่งพาการคัดลอกไฟล์สดดิบ `*.sqlite`, `*.sqlite-wal` และ `*.sqlite-shm` เป็นรูปแบบสำรองข้อมูลหลัก manifest ของอาร์ไคฟ์ควรบันทึกบทบาทฐานข้อมูล, ID เอเจนต์, เวอร์ชันสคีมา, เส้นทางต้นทาง, เส้นทางสแนปชอต, ขนาดไบต์ และสถานะความถูกต้องสมบูรณ์

การกู้คืนควรสร้างไฟล์ฐานข้อมูลส่วนกลางและฐานข้อมูลเอเจนต์ใหม่จากสแนปชอตในอาร์ไคฟ์ เนื่องจากเลย์เอาต์ SQLite ยังไม่ถูกเผยแพร่ รีแฟกเตอร์นี้จึงเก็บเฉพาะสคีมาเวอร์ชัน 1 พร้อมการนำเข้าไฟล์สู่ฐานข้อมูลของ doctor คำสั่งกู้คืนตรวจสอบอาร์ไคฟ์ก่อน แล้วจึงแทนที่ asset แต่ละรายการใน manifest จากเพย์โหลดที่แตกออกมาและผ่านการตรวจสอบแล้ว

## แผนรีแฟกเตอร์รันไทม์

1. เพิ่ม API รีจิสทรีฐานข้อมูล
   - แก้ไขเส้นทางฐานข้อมูลส่วนกลางและฐานข้อมูลต่อเอเจนต์
   - เก็บสคีมาที่ยังไม่เผยแพร่ไว้ที่ `user_version = 1`; อย่าเพิ่มโค้ดตัวรันการย้ายสคีมาจนกว่าสคีมาที่เผยแพร่จะต้องใช้
   - เพิ่มตัวช่วยปิด/เช็กพอยต์/ตรวจสอบความถูกต้องสมบูรณ์ที่ใช้โดยการทดสอบ การสำรองข้อมูล และ doctor

2. รวมที่เก็บ SQLite sidecar
   - ย้ายตารางสถานะ Plugin เข้าไปในฐานข้อมูลส่วนกลาง เสร็จแล้วสำหรับการเขียนรันไทม์; ตัวนำเข้า sidecar เดิมที่ยังไม่เผยแพร่ถูกลบแล้ว
   - ย้ายตารางรีจิสทรีงานเข้าไปในฐานข้อมูลส่วนกลาง เสร็จแล้วสำหรับการเขียนรันไทม์; ตัวนำเข้า sidecar เดิมที่ยังไม่เผยแพร่ถูกลบแล้ว
   - ย้ายตาราง Task Flow เข้าไปในฐานข้อมูลส่วนกลาง เสร็จแล้วสำหรับการเขียนรันไทม์;
     ตัวนำเข้า sidecar เดิมที่ยังไม่เผยแพร่ถูกลบแล้ว
   - ย้ายตารางค้นหาหน่วยความจำในตัวเข้าไปในฐานข้อมูลเอเจนต์แต่ละตัว เสร็จแล้ว; `memorySearch.store.path` แบบกำหนดเองอย่างชัดเจนตอนนี้ถูกลบโดยการย้ายการกำหนดค่า doctor แล้ว
     การทำ reindex เต็มรันในที่เดิมกับตารางหน่วยความจำเท่านั้น; เส้นทางสลับทั้งไฟล์เดิมและตัวช่วยสลับดัชนี sidecar ถูกลบแล้ว
   - ลบตัวเปิดฐานข้อมูลซ้ำ การตั้งค่า WAL ตัวช่วยสิทธิ์ และเส้นทางปิดจากระบบย่อยเหล่านั้น

3. ย้ายตารางที่เอเจนต์เป็นเจ้าของเข้าไปในฐานข้อมูลต่อเอเจนต์
   - สร้างฐานข้อมูลเอเจนต์ตามต้องการผ่านรีจิสทรีฐานข้อมูลส่วนกลาง เสร็จแล้ว
   - ย้ายรายการเซสชันรันไทม์ เหตุการณ์ทรานสคริปต์ แถว VFS และอาร์ติแฟกต์เครื่องมือไปยังฐานข้อมูลเอเจนต์ เสร็จแล้ว
   - อย่าย้ายรายการเซสชันในฐานข้อมูลร่วมของสาขา เหตุการณ์ทรานสคริปต์ แถว VFS หรืออาร์ติแฟกต์เครื่องมือ; เลย์เอาต์นั้นไม่เคยเผยแพร่ เก็บเฉพาะการนำเข้าไฟล์เดิมสู่ฐานข้อมูลใน doctor

4. แทนที่ API ที่เก็บเซสชัน
   - นำ `storePath` ออกจากการเป็นตัวตนรันไทม์ เสร็จแล้วสำหรับรันไทม์และถูกป้องกันโดย `check:database-first-legacy-stores`: เมทาดาต้าเซสชัน การอัปเดตเส้นทาง การคงอยู่ของคำสั่ง การล้างเซสชัน CLI พรีวิวเหตุผลของ Feishu การคงอยู่ของสถานะทรานสคริปต์ ความลึกของซับเอเจนต์ การ override เซสชันโปรไฟล์ auth ตรรกะ parent-fork และการตรวจสอบ QA-lab ตอนนี้แก้ไขฐานข้อมูลจากคีย์เอเจนต์/เซสชันตามมาตรฐาน
     การตอบกลับรายการเซสชันของ Gateway/TUI/UI/macOS ตอนนี้เปิดเผย `databasePath` แทน `path` เดิม; พื้นผิวดีบัก macOS แสดงฐานข้อมูลต่อเอเจนต์เป็นสถานะแบบอ่านอย่างเดียวแทนการเขียนการกำหนดค่า `session.store`
     `/status`, การส่งออกทราเจกทอรีที่ขับจากแชต และพร็อกซีการพึ่งพา CLI ไม่ส่งต่อเส้นทางที่เก็บเดิมอีกต่อไป; fallback การใช้งานทรานสคริปต์อ่าน SQLite ตามตัวตนเอเจนต์/เซสชัน การทดสอบรันไทม์และ bridge ไม่เปิดเผย `storePath` อีกต่อไป; อินพุต doctor/การย้ายเป็นเจ้าของชื่อฟิลด์เดิมนั้น
     การโหลดเซสชันรวมของ Gateway ไม่มีสาขารันไทม์พิเศษสำหรับค่า `session.store` ที่ไม่ใช่เทมเพลตอีกต่อไป; จะรวมแถว SQLite ต่อเอเจนต์
     เลน doctor ของล็อกเซสชันเดิมและตัวช่วยล้าง `.jsonl.lock` ถูกนำออกแล้ว; ตอนนี้ SQLite เป็นขอบเขตภาวะพร้อมกันของเซสชัน
     จุดเรียกใช้รันไทม์ที่ร้อนใช้ชื่อตัวช่วยแบบเน้นแถว เช่น
     `resolveSessionRowEntry`; alias ความเข้ากันได้เดิม `resolveSessionStoreEntry` ถูกลบออกจากรันไทม์และการส่งออก Plugin SDK แล้ว

- ใช้การดำเนินการกับแถว `{ agentId, sessionKey }`
  เสร็จแล้ว: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` และ `listSessionEntries` เป็น API ที่ใช้ SQLite ก่อนและไม่ต้องใช้เส้นทางที่เก็บเซสชัน สรุปสถานะ สถานะเอเจนต์ภายในเครื่อง health และคำสั่งรายการ `openclaw sessions` ตอนนี้อ่านแถวต่อเอเจนต์โดยตรงและแสดงเส้นทางฐานข้อมูล SQLite ต่อเอเจนต์แทนเส้นทาง `sessions.json`
- แทนที่การลบ/แทรกทั้งที่เก็บด้วย `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` และคิวรีล้างข้อมูล SQL
  เสร็จแล้วสำหรับรันไทม์: เส้นทางร้อนตอนนี้ใช้ API แถวและแพตช์แถวที่ retry เมื่อขัดแย้ง;
  ตัวช่วยนำเข้า/แทนที่ทั้งที่เก็บที่เหลือถูกจำกัดไว้ในโค้ดนำเข้าการย้ายและการทดสอบแบ็กเอนด์ SQLite
  - ลบ `store-writer.ts` และการทดสอบ writer-queue เสร็จแล้ว
  - ลบการตัดแต่งคีย์เดิมในรันไทม์และพารามิเตอร์ลบ alias จากการ upsert/patch แถวเซสชัน เสร็จแล้ว

5. ลบพฤติกรรมรีจิสทรี JSON ในรันไทม์
   - ทำให้การอ่านและเขียนรีจิสทรี sandbox เป็น SQLite-only เสร็จแล้ว
   - นำเข้า JSON แบบ monolithic และ sharded จากขั้นตอนการย้ายเท่านั้น เสร็จแล้ว
   - ลบล็อกรีจิสทรีแบบ sharded และการเขียน JSON เสร็จแล้ว

- เก็บตารางรีจิสทรีที่มีชนิดเดียวแทนการเก็บแถวรีจิสทรีเป็น JSON ทึบแบบทั่วไป หากรูปทรงยังคงเป็นสถานะปฏิบัติการเส้นทางร้อน เสร็จแล้ว

6. ลบการกลายพันธุ์เซสชันรูปทรงล็อกไฟล์
   - เสร็จแล้วสำหรับการสร้างล็อกรันไทม์และ API ล็อกรันไทม์
   - เลนล้าง `.jsonl.lock` เดิมแบบ standalone ของ doctor ถูกนำออกแล้ว
   - `session.writeLock` เป็นการกำหนดค่าเดิมที่ doctor ย้าย ไม่ใช่การตั้งค่ารันไทม์ที่มีชนิด
   - ความถูกต้องสมบูรณ์ของสถานะไม่มีเส้นทางตัดแต่งไฟล์ทรานสคริปต์กำพร้าแยกต่างหากอีกต่อไป; การย้าย doctor นำเข้า/ลบแหล่ง JSONL เดิมในที่เดียว
   - การประสานงาน singleton ของ Gateway ใช้แถว SQLite `state_leases` ที่มีชนิดภายใต้ `gateway_locks` และไม่เปิดเผย seam ไดเรกทอรีล็อกไฟล์อีกต่อไป
   - การคงอยู่ของ dedupe ใน Plugin SDK ทั่วไปไม่ใช้ล็อกไฟล์หรือไฟล์ JSON อีกต่อไป; เขียนแถวสถานะ Plugin ของ SQLite ร่วม เสร็จแล้ว
   - การประสานงาน QMD embed ใช้ lease สถานะ SQLite แทน
     `qmd/embed.lock` เสร็จแล้ว

7. ทำให้เวิร์กเกอร์ตระหนักถึงฐานข้อมูล
   - เวิร์กเกอร์เปิดการเชื่อมต่อ SQLite ของตนเอง
   - พาเรนต์เป็นเจ้าของการส่ง การ callback ของช่องทาง และการกำหนดค่า
   - เวิร์กเกอร์ได้รับ ID เอเจนต์, ID การรัน, โหมดระบบไฟล์ และตัวตนรีจิสทรีฐานข้อมูล ไม่ใช่ handle สด
   - `vfs-only` ยังคงเป็นเชิงทดลองและใช้ฐานข้อมูลเอเจนต์เป็นรูทพื้นที่เก็บข้อมูล
   - ให้มีเวิร์กเกอร์หนึ่งตัวต่อการรันที่ใช้งานอยู่ก่อน Pooling รอได้จนกว่าอายุการเชื่อมต่อฐานข้อมูลและพฤติกรรมการยกเลิกจะเรียบง่าย

8. การผสานการสำรองข้อมูล
   - สอนให้การสำรองข้อมูลถ่ายสแนปช็อตฐานข้อมูล global และ agent ผ่าน SQLite backup หรือ
     `VACUUM INTO` เสร็จแล้วสำหรับไฟล์ `*.sqlite` ที่ค้นพบใต้ state asset
   - เพิ่มการตรวจสอบการสำรองข้อมูลสำหรับความสมบูรณ์ของ SQLite และเวอร์ชัน schema เสร็จแล้วสำหรับ
     การสร้างข้อมูลสำรองและการตรวจสอบความสมบูรณ์ของ archive เริ่มต้น
   - บันทึก metadata ของการรันสำรองข้อมูลใน SQLite เสร็จแล้วผ่านตาราง `backup_runs`
     ที่ใช้ร่วมกันพร้อม path ของ archive, สถานะ และ manifest JSON
   - เพิ่มการกู้คืนจากสแนปช็อต archive ที่ผ่านการตรวจสอบแล้ว เสร็จแล้ว: `openclaw backup
restore` ตรวจสอบก่อนแตกไฟล์ ใช้ manifest ที่ normalize แล้วของตัวตรวจสอบ
     รองรับ `--dry-run` และต้องใช้ `--yes` ก่อนแทนที่
     path ต้นทางที่บันทึกไว้
   - รวมการ export VFS/workspace เฉพาะเมื่อมีการร้องขอเท่านั้น; อย่า export session
     internals เป็น JSON หรือ JSONL

9. ลบการทดสอบและโค้ดที่ล้าสมัย เสร็จแล้วสำหรับพื้นผิว runtime session ที่ทราบ

- ลบการทดสอบที่ assert การสร้าง `sessions.json` หรือไฟล์ transcript
  JSONL โดย runtime เสร็จแล้วสำหรับ core session store, chat, gateway transcript events,
  preview, lifecycle, command session-entry updates, auto-reply reset/trace, และ
  memory-core dreaming fixtures, approval target routing, session transcript
  repair, security permission repair, trajectory export, และ session export
  ตอนนี้การทดสอบ transcript ของ active-memory assert ขอบเขต SQLite และไม่มีการสร้างไฟล์ JSONL แบบชั่วคราวหรือ
  ที่ persist ไว้
  การถดถอยของ heartbeat transcript-pruning เก่าถูกลบออกแล้ว เพราะ
  runtime ไม่ตัดทอน JSONL transcripts อีกต่อไป
  การทดสอบเครื่องมือ agent session-list ไม่ model path `sessions.json` แบบ legacy
  เป็นรูปร่างการตอบกลับของ gateway อีกต่อไป; การทดสอบ app/UI/macOS ใช้ `databasePath`
  ตอนนี้การทดสอบการใช้ transcript ของ `/status` seed แถว transcript ของ SQLite โดยตรง
  แทนการเขียนไฟล์ JSONL
  ตอนนี้การทดสอบ lifecycle ของ Gateway session ใช้ helper สำหรับ seed transcript SQLite
  โดยตรง; รูปร่าง fixture session-file แบบบรรทัดเดียวเก่าหายไปจาก coverage ของ reset
  และ delete
  `sessions.delete` ไม่คืนค่า field ยุคไฟล์ `archived: []` อีกต่อไป; การลบ
  รายงานเฉพาะผลการ mutate แถวเท่านั้น option `deleteTranscript` เก่า
  ก็หายไปด้วย: การลบ session จะลบ root `sessions` ที่เป็น canonical และปล่อยให้
  SQLite cascade แถว transcript, snapshot, และ trajectory ที่ session เป็นเจ้าของ ดังนั้น
  caller จึงไม่สามารถทิ้ง transcript orphan ไว้หรือหลงลืม branch cleanup ได้
  ตอนนี้การทดสอบการจับ trajectory ของ context-engine อ่านแถว `trajectory_runtime_events`
  จากฐานข้อมูล agent แยกต่างหาก แทนการอ่าน
  `session.trajectory.jsonl`
  ตอนนี้สคริปต์ seed ช่องทาง Docker MCP seed แถว SQLite โดยตรง การเขียน
  `sessions.json` โดยตรงจำกัดไว้เฉพาะ doctor fixtures
  Tool Search Gateway E2E อ่านหลักฐาน tool-call จากแถว transcript ของ SQLite
  แทนการสแกนไฟล์ `agents/<agentId>/sessions/*.jsonl`
  ตอนนี้ memory-core host events และแถว scratch ของ session-corpus อยู่ใน shared
  SQLite plugin-state; `events.jsonl` และ `session-corpus/*.txt` เป็นอินพุตการ migration ของ doctor แบบ legacy
  เท่านั้น แถว active ใช้ path virtual `memory/session-ingestion/`
  ไม่ใช่ `.dreams/session-corpus` โมดูลซ่อมแซม memory-core dreaming
  เก่าและการทดสอบ CLI/Gateway ของโมดูลนั้นถูกลบออก เพราะ runtime ไม่
  เป็นเจ้าของการซ่อมแซม file archive สำหรับ corpus นั้นอีกต่อไป การทดสอบ memory-core
  bridge/public-artifact ไม่แสดง `.dreams/events.jsonl` อีกต่อไป; ใช้
  ชื่อ artifact JSON virtual ที่ backed by SQLite
  เอกสารทดสอบ Public SDK/Codex ตอนนี้ระบุสถานะ session แบบ SQLite แทนไฟล์ session
  และตัวอย่าง channel-turn ไม่เปิดเผย argument `storePath` อีกต่อไป
  ตอนนี้ Matrix sync state ใช้ SQLite plugin-state store โดยตรง สัญญา client/runtime
  ที่ active ส่ง root สำหรับ account storage ไม่ใช่ path `bot-storage.json`
  และ doctor import `bot-storage.json` แบบ legacy เข้า SQLite ก่อนลบ
  ต้นทาง สถานการณ์ QA Matrix restart/destructive ตอนนี้ mutate แถว SQLite sync
  โดยตรง แทนการสร้างหรือลบไฟล์ `bot-storage.json` ปลอม และ
  E2EE substrate ส่ง sync-store root แทน path
  `sync-store.json` ปลอม
  การเลือก Matrix storage-root ไม่ให้คะแนน root ด้วยไฟล์ sync/thread JSON แบบ legacy
  อีกต่อไป; ใช้ metadata ของ root ที่คงทนร่วมกับสถานะ crypto จริง
  ชุดทดสอบ backend ของ runtime SQLite session ไม่สร้าง
  `sessions.json` ปลอมอีกต่อไป; fixture ต้นทางแบบ legacy ตอนนี้อยู่ในการทดสอบ doctor
  ที่ import มัน
  การทดสอบ Gateway session ไม่เปิดเผย helper `createSessionStoreDir` หรือ
  การตั้งค่า path temp session-store ที่ไม่ได้ใช้อีกต่อไป; fixture dirs ระบุชัดเจน และการตั้งค่า
  แถวโดยตรงใช้การตั้งชื่อ session-row ของ SQLite
  coverage parser ของ doctor-only JSON5 session-store ถูกย้ายออกจากการทดสอบ infra และ
  เข้าไปในการทดสอบ doctor migration ดังนั้นชุดทดสอบ runtime จึงไม่เป็นเจ้าของการ parse
  session-file แบบ legacy อีกต่อไป
  การทดสอบ Microsoft Teams runtime SSO/pending-upload ไม่พก fixture หรือ parser แบบ JSON sidecar
  อีกต่อไป; การ parse token SSO แบบ legacy อยู่เฉพาะในโมดูล migration ของ plugin
  เท่านั้น การทดสอบ Telegram ไม่ seed path store `/tmp/*.json` ปลอม
  อีกต่อไป; รีเซ็ต message cache ที่ backed by SQLite โดยตรง helper
  test-state ทั่วไปของ OpenClaw ไม่เปิดเผย writer `auth-profiles.json`
  แบบ legacy อีกต่อไป; การทดสอบ doctor auth migration เป็นเจ้าของ fixture นั้นในเครื่อง
  การทดสอบ runtime สำหรับ pointer last-session ของ TUI, exec approvals, active-memory
  toggles, Matrix dedupe/startup verification, Memory Wiki source sync,
  current-conversation bindings, onboarding auth, และ Hermes secret imports ไม่
  สร้างไฟล์ sidecar เก่า หรือ assert ว่า filename เก่าไม่มีอยู่อีกต่อไป พิสูจน์
  พฤติกรรมผ่านแถว SQLite และ API store สาธารณะ; การทดสอบ doctor/migration
  เป็นที่เดียวที่ควรมี filename ต้นทางแบบ legacy
  การทดสอบ runtime สำหรับ device/node pairing, channel allowFrom, restart intents,
  restart handoff, session delivery queue entries, config health, iMessage
  caches, cron jobs, header transcript ของ PI, subagent registries, และ managed
  image attachments ก็ไม่สร้างไฟล์ JSON/JSONL ที่เลิกใช้แล้วเพียงเพื่อพิสูจน์
  ว่าถูก ignore หรือไม่มีอยู่
  PI overflow recovery ไม่มี fallback การ rewrite/truncation ของ SessionManager อีกต่อไป:
  การตัดทอน tool-result และการ rewrite transcript ของ context-engine จะ mutate
  แถว transcript ของ SQLite แล้ว refresh active prompt state จากฐานข้อมูล
  การ append ข้อความของ SessionManager ที่ persist ไว้ delegate ไปยัง helper append transcript
  SQLite แบบ atomic สำหรับการเลือก parent และ idempotency การ append entry metadata/custom
  ปกติก็เลือก parent ปัจจุบันภายใน SQLite เช่นกัน ดังนั้น instance ของ manager ที่ stale
  จะไม่ปลุก race parent-chain ก่อน SQLite กลับมา
  การ cleanup synthetic PI tail สำหรับ mid-turn prechecks และ `sessions_yield` ตอนนี้
  ตัดแต่งสถานะ transcript ของ SQLite โดยตรง; bridge tail-removal ของ SessionManager
  เก่าและการทดสอบถูกลบแล้ว
  การ capture checkpoint ของ Compaction ก็ snapshot จาก SQLite เท่านั้น; caller ไม่
  ส่ง live SessionManager เป็นแหล่ง transcript ทางเลือกอีกต่อไป
- คงการทดสอบที่ seed ไฟล์ legacy ไว้เฉพาะสำหรับ migration
- หลักฐานไฟล์ JSON ถูกแทนที่ด้วยหลักฐานแถว SQL สำหรับพื้นผิว runtime
  ที่ active

- เพิ่ม static ban สำหรับการเขียน runtime ไปยัง path JSON session/cache แบบ legacy
  เสร็จแล้วสำหรับ repo guard

10. ทำให้รายงาน migration ตรวจสอบย้อนหลังได้
    - บันทึกการรัน migration ใน SQLite พร้อม timestamp เริ่ม/จบ, path ต้นทาง,
      hash ต้นทาง, จำนวน, คำเตือน, และ path สำรองข้อมูล
      เสร็จแล้ว: ตอนนี้การ execute migration legacy-state persist รายงาน `migration_runs`
      พร้อม inventory ของ source path/table, SHA-256 ของไฟล์ต้นทาง, ขนาด,
      จำนวน record, คำเตือน, และ path สำรองข้อมูล
      เสร็จแล้ว: การ execute migration legacy-state ยัง persist แถว `migration_sources`
      สำหรับ audit ระดับต้นทางและการตัดสินใจ skip/backfill ในอนาคต
    - ทำให้ apply เป็น idempotent การรันซ้ำหลัง import บางส่วนควร
      skip ต้นทางที่ import แล้ว หรือ merge ด้วย key ที่ stable
      เสร็จแล้ว: session indexes, transcripts, delivery queues, plugin state, task
      ledgers, และแถว SQLite global ที่ agent เป็นเจ้าของ import ผ่าน key ที่ stable หรือ
      semantics แบบ upsert/replace ดังนั้นการรันซ้ำจะ merge โดยไม่ duplicate
      แถว durable
    - import ที่ล้มเหลวต้องเก็บไฟล์ต้นทางเดิมไว้ที่เดิม
      เสร็จแล้ว: import transcript ที่ล้มเหลวตอนนี้ปล่อยต้นทาง JSONL เดิมไว้ที่
      path ที่ตรวจพบ และ `migration_sources` บันทึกต้นทางเป็น
      `warning` พร้อม `removed_source=0` สำหรับการรัน doctor ครั้งถัดไป

## กฎด้านประสิทธิภาพ

- หนึ่ง connection ต่อ thread/process ใช้ได้; อย่า share handle ข้าม
  worker
- ใช้ WAL, `foreign_keys=ON`, busy timeout 30 วินาที, และ transaction การเขียน `BEGIN IMMEDIATE`
  แบบสั้น
- คง helper transaction การเขียนไว้แบบ synchronous เว้นแต่/จนกว่า API transaction แบบ async
  จะเพิ่ม semantics mutex/backpressure ที่ชัดเจน
- คงการเขียน parent delivery ให้เล็กและเป็น transactional
- หลีกเลี่ยงการ rewrite ทั้ง store; ใช้ upsert/delete ระดับแถว
- เพิ่ม index สำหรับ path list-by-agent, list-by-session, updated-at, run id, และ
  expiration ก่อนย้ายโค้ด hot
- เก็บ artifact, media, และ vector ขนาดใหญ่เป็น BLOB หรือแถว BLOB แบบ chunked ไม่ใช่
  base64 หรือ JSON แบบ numeric-array
- คง entry plugin-state แบบ opaque ให้เล็กและ scoped
- เพิ่ม SQL cleanup สำหรับ TTL/expiration แทน filesystem pruning
  เสร็จแล้วสำหรับ store runtime ที่ database เป็นเจ้าของ: media, plugin state, plugin blobs,
  persistent dedupe, และ agent cache ทั้งหมด expire ผ่านแถว SQLite การ cleanup
  filesystem ที่เหลือจำกัดไว้เฉพาะ materialization ชั่วคราวหรือคำสั่ง
  removal ที่ชัดเจน

## Static Bans

เพิ่ม repo check ที่ fail การเขียน runtime ใหม่ไปยัง path state แบบ legacy:

- `sessions.json`
- `*.trajectory.jsonl` ยกเว้นเอาต์พุต support-bundle ที่ materialize แล้ว
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- ไฟล์แคช runtime `cache/*.json`
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
- ไฟล์ JSON bridge ของ native hook relay ใน `/tmp`
- `plugin-state/state.sqlite`
- sidecar runtime `openclaw-state.sqlite` แบบเฉพาะกิจ
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
- ตัวเปิดเซสชันที่ backed ด้วยไฟล์ `SessionManager.open(...)`
- facade สำหรับแสดงรายการ transcript `SessionManager.listAll(...)` และ `TranscriptSessionManager.listAll(...)`
- facade สำหรับ fork transcript `SessionManager.forkFromSession(...)` และ
  `TranscriptSessionManager.forkFromSession(...)`
- facade สำหรับแทนที่เซสชันที่แก้ไขได้ `SessionManager.newSession(...)` และ `TranscriptSessionManager.newSession(...)`
- facade สำหรับเซสชัน branch `SessionManager.createBranchedSession(...)` และ
  `TranscriptSessionManager.createBranchedSession(...)`

คำสั่งห้ามควรอนุญาตให้การทดสอบสร้าง fixture ดั้งเดิม และอนุญาตให้โค้ด migration
อ่าน/นำเข้า/ลบแหล่งไฟล์ดั้งเดิมได้ SQLite sidecar ที่ยังไม่เคยเผยแพร่ยังคงถูกห้าม
และไม่ได้รับข้อยกเว้นการนำเข้าของ doctor

## เกณฑ์การเสร็จสิ้น

- การเขียนข้อมูล runtime และแคชไปยังฐานข้อมูล SQLite ส่วนกลางหรือของ agent
- runtime ไม่เขียนดัชนีเซสชัน, JSONL ของ transcript, JSON ของรีจิสทรี sandbox, SQLite sidecar ของงาน หรือ SQLite sidecar ของ plugin-state อีกต่อไป ตัวนำเข้า SQLite sidecar ของงานและ plugin-state ที่ยังไม่เคยเผยแพร่ถูกลบแล้ว
- การนำเข้าไฟล์ดั้งเดิมทำได้เฉพาะใน doctor เท่านั้น
- การสำรองข้อมูลสร้าง archive เดียวพร้อม snapshot SQLite แบบกะทัดรัดและหลักฐานความถูกต้องสมบูรณ์
- worker ของ agent สามารถทำงานด้วย disk, scratch ของ VFS หรือ storage แบบ VFS-only เชิงทดลองได้
- ไฟล์ config และไฟล์ credential ชัดเจนยังคงเป็นไฟล์ควบคุมถาวรที่ไม่ใช่ฐานข้อมูลเพียงอย่างเดียวที่คาดไว้
- การตรวจสอบ repo ป้องกันการนำที่เก็บไฟล์ runtime ดั้งเดิมกลับเข้ามาอีกครั้ง
