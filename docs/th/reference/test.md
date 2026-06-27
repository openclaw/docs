---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมดบังคับ/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-06-27T18:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- ชุดทดสอบครบถ้วน (ชุดทดสอบ, live, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- ลำดับการทดสอบในเครื่องตามปกติ:
  1. `pnpm test:changed` สำหรับหลักฐาน Vitest ตามขอบเขตที่เปลี่ยนแปลง
  2. `pnpm test <path-or-filter>` สำหรับไฟล์เดียว ไดเรกทอรีเดียว หรือเป้าหมายที่ระบุชัดเจน
  3. `pnpm test` เฉพาะเมื่อคุณตั้งใจต้องใช้ชุด Vitest ในเครื่องทั้งหมด
- `pnpm test:force`: ฆ่าโปรเซส gateway ที่ค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้นไว้ จากนั้นรันชุด Vitest ทั้งหมดด้วยพอร์ต gateway แบบแยก เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน gateway ก่อนหน้าทิ้งให้พอร์ต 18789 ถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุด unit พร้อม coverage ของ V8 (ผ่าน `vitest.unit.config.ts`) นี่เป็นเกต coverage ของ lane unit เริ่มต้น ไม่ใช่ coverage ทุกไฟล์ทั้ง repo เกณฑ์คือ 70% สำหรับบรรทัด/ฟังก์ชัน/statement และ 55% สำหรับ branch เนื่องจาก `coverage.all` เป็น false และ lane เริ่มต้นจำกัด coverage includes ไว้ที่การทดสอบ unit ที่ไม่ใช่ fast พร้อมไฟล์ซอร์สพี่น้อง เกตนี้จึงวัดซอร์สที่ lane นี้เป็นเจ้าของแทนที่จะวัดทุก transitive import ที่บังเอิญโหลดเข้ามา
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบแบบเปลี่ยนแปลงอัจฉริยะราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัดเจน และกราฟ import ในเครื่อง การเปลี่ยนแปลงกว้าง ๆ ใน config/package จะถูกข้าม เว้นแต่จะแมปไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบแบบเปลี่ยนแปลงกว้างที่ระบุชัดเจน ใช้เมื่อการแก้ไข test harness/config/package ควรถอยกลับไปใช้พฤติกรรม changed-test ที่กว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดง lane สถาปัตยกรรมที่ถูกทริกเกอร์โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: delegate ไปยัง Crabbox/Testbox ตามค่าเริ่มต้นนอก CI จากนั้นรันเกตตรวจสอบแบบเปลี่ยนแปลงอัจฉริยะสำหรับ diff เทียบกับ `origin/main` ภายใน remote child รัน typecheck, lint และคำสั่ง guard สำหรับ lane สถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนสำหรับหลักฐานการทดสอบ
- worktree ของ Codex และ checkout แบบ linked/sparse: หลีกเลี่ยง `pnpm test*`, `pnpm check*` และ `pnpm crabbox:run` ในเครื่องโดยตรง เว้นแต่คุณยืนยันแล้วว่า pnpm จะไม่ reconcile dependencies สำหรับหลักฐานไฟล์เฉพาะขนาดเล็ก ใช้ `node scripts/run-vitest.mjs <path-or-filter>`; สำหรับเกตแบบเปลี่ยนแปลงหรือหลักฐานกว้าง ใช้ `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` เพื่อให้ pnpm รันภายใน Testbox
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: จำกัดการ serialize heavy-check ไว้ภายใน worktree ปัจจุบันแทน Git common dir สำหรับคำสั่งเช่น `pnpm check:changed` และ `pnpm test ...` แบบเจาะจง ใช้เฉพาะบนโฮสต์ในเครื่องที่มีความจุสูง เมื่อคุณตั้งใจรันการตรวจสอบอิสระข้าม linked worktrees
- `pnpm test`: route เป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน lane Vitest ตามขอบเขต การรันแบบไม่เจาะจงเป้าหมายเป็นหลักฐาน full-suite: ใช้กลุ่ม shard คงที่ ขยายเป็น leaf configs สำหรับการรัน parallel ในเครื่อง และพิมพ์ fanout ของ shard ในเครื่องที่คาดไว้ก่อนเริ่ม กลุ่ม extension จะขยายเป็น config shard ต่อ extension เสมอ แทนการใช้โปรเซส root-project ขนาดใหญ่เพียงตัวเดียว
- การรัน test wrapper จบด้วยสรุปสั้น ๆ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดต่อ shard
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture config, workspace, agent dir หรือ auth-profile store แบบแยก
- `pnpm test:env-mutations:report`: รายงานแบบไม่บล็อกของการทดสอบและ harness ที่ mutate `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` หรือคีย์ env ที่เกี่ยวข้องกับ OpenClaw โดยตรง ใช้เพื่อหาผู้สมัครสำหรับการย้ายไปยัง helper test-state ที่ใช้ร่วมกัน
- Control UI mocked E2E: ใช้ `pnpm test:ui:e2e` สำหรับ lane Vitest + Playwright ที่เริ่ม Vite Control UI และขับหน้า Chromium จริงกับ Gateway WebSocket แบบ mocked การทดสอบอยู่ใน `ui/src/**/*.e2e.test.ts`; mock และ control ที่ใช้ร่วมกันอยู่ใน `ui/src/test-helpers/control-ui-e2e.ts` `pnpm test:e2e` รวม lane นี้ไว้ด้วย ใน worktree ของ Codex ให้ใช้ `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` สำหรับหลักฐานแบบเจาะจงขนาดเล็กหลังติดตั้ง dependencies แล้ว หรือใช้ Testbox/Crabbox สำหรับหลักฐาน GUI ที่กว้างกว่า
- helper Process E2E: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่กำลังรัน, env ของ CLI, การจับ log และการ cleanup รวมไว้ในที่เดียว
- การทดสอบ TUI PTY: ใช้ `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` สำหรับ lane PTY fake-backend ที่เร็ว ใช้ `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` หรือ `pnpm tui:pty:test:watch --mode local` สำหรับ smoke `tui --local` ที่ช้ากว่า ซึ่ง mock เฉพาะ endpoint โมเดลภายนอก ให้ assert ข้อความที่มองเห็นได้อย่างเสถียรหรือการเรียก fixture ไม่ใช่ snapshot ANSI ดิบ
- helper Docker/Bash E2E: lane ที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้า container และ decode ด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์หลาย home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ได้ caller ระดับต่ำกว่าสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet shell ใน container หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ของโฮสต์ที่ source ได้ เครื่องหมาย `--` ก่อน `create` ป้องกันไม่ให้ runtime Node รุ่นใหม่ตีความ `--env-file` เป็น flag ของ Node lane Docker/Bash ที่ launch Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายใน container สำหรับการ resolve entrypoint, startup OpenAI แบบ mock, การ launch Gateway แบบ foreground/background, readiness probes, การ export state env, การ dump log และการ cleanup โปรเซส
- การรัน shard แบบ full, extension และ include-pattern จะอัปเดตข้อมูล timing ในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรัน whole-config ภายหลังใช้ timing เหล่านั้นเพื่อ balance shard ที่ช้าและเร็ว shard CI แบบ include-pattern จะ append ชื่อ shard เข้ากับคีย์ timing ซึ่งทำให้ timing ของ shard ที่ถูก filter มองเห็นได้โดยไม่แทนที่ข้อมูล timing ของ whole-config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact timing ในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ route ผ่าน lane เบาเฉพาะที่เก็บเฉพาะ `test/setup.ts` และปล่อยเคสที่หนักด้าน runtime ไว้บน lane เดิม
- ไฟล์ซอร์สที่มีการทดสอบพี่น้องจะ map ไปยังพี่น้องนั้นก่อนถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างกว่า การแก้ไข helper ใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟ import ในเครื่องเพื่อรันการทดสอบที่ import เข้ามาแทนการรันทุก shard แบบกว้างเมื่อ dependency path แม่นยำ
- ตอนนี้ `auto-reply` ยังแยกเป็น config เฉพาะสามตัว (`core`, `top-level`, `reply`) เพื่อให้ harness reply ไม่ครอบงำการทดสอบ status/token/helper ระดับบนที่เบากว่า
- config Vitest พื้นฐานตอนนี้มีค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบไม่ isolated ที่ใช้ร่วมกันทั่ว config ของ repo
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/Plugin ทั้งหมด Plugin ช่องทางที่หนัก, Plugin เบราว์เซอร์ และ OpenAI จะรันเป็น shard เฉพาะ ส่วนกลุ่ม Plugin อื่นยังคง batched ใช้ `pnpm test extensions/<id>` สำหรับ lane Plugin bundled ตัวเดียว
- `pnpm test:perf:imports`: เปิดใช้รายงาน import-duration + import-breakdown ของ Vitest ขณะที่ยังใช้ scoped lane routing สำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: profiling import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark path changed-mode ที่ถูก route เทียบกับการรัน root-project ดั้งเดิมสำหรับ git diff ที่ commit แล้วเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงของ worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ thread หลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รัน leaf config ของ Vitest full-suite ทุกตัวแบบ serial และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/log ต่อ config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้น performance
- `pnpm test:docker:timings <summary.json>` ตรวจสอบ lane Docker ที่ช้าหลังการรัน Docker ทั้งหมด; ใช้ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงราคาถูกจาก artifact เดียวกัน
- การผสานรวม Gateway: opt-in ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน aggregate E2E ของ repo: การทดสอบ smoke end-to-end ของ gateway พร้อม lane E2E เบราว์เซอร์ mocked ของ Control UI
- `pnpm test:e2e:gateway`: รันการทดสอบ smoke end-to-end ของ gateway (การจับคู่หลายอินสแตนซ์ WS/HTTP/node) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม worker แบบ adaptive ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องใช้ API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการข้าม
- `pnpm test:docker:all`: สร้างอิมเมจ live-test ที่ใช้ร่วมกัน, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball, สร้าง/นำอิมเมจ bare Node/Git runner กลับมาใช้ซ้ำ พร้อมกับอิมเมจฟังก์ชันที่ติดตั้ง tarball นั้นลงใน `/app`, จากนั้นรัน Docker smoke lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่านตัวจัดตารางแบบถ่วงน้ำหนัก อิมเมจ bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับ lanes ของ installer/update/plugin-dependency; lanes เหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้าแทนการใช้ซอร์ส repo ที่คัดลอกมา อิมเมจฟังก์ชัน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับ lanes ฟังก์ชันการทำงานของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็นตัวแพ็กแพ็กเกจเดียวสำหรับ local/CI และตรวจสอบ tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะนำไปใช้ คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการ plan ที่เลือก `node scripts/test-docker-all.mjs --plan-json` ส่งออก plan ของ CI ที่ตัวจัดตารางเป็นเจ้าของสำหรับ lanes ที่เลือก, ชนิดอิมเมจ, ความต้องการ package/live-image, state scenarios, และการตรวจสอบ credential โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุม process slots และค่าเริ่มต้นคือ 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม provider-sensitive tail pool และค่าเริ่มต้นคือ 10 ค่า cap ของ heavy lane มีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ค่า provider caps เริ่มต้นเป็น heavy lane หนึ่งรายการต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ที่ใหญ่กว่า หาก lane หนึ่งเกิน weight หรือ resource cap ที่มีผลบนโฮสต์ที่มี parallelism ต่ำ มันยังสามารถเริ่มจาก pool ว่างและจะรันเพียงลำพังจนกว่าจะปล่อย capacity การเริ่ม lane จะถูกหน่วงห่างกัน 2 วินาทีตามค่าเริ่มต้นเพื่อหลีกเลี่ยงการสร้างงานพุ่งพร้อมกันใน Docker daemon ภายในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner จะ preflight Docker ตามค่าเริ่มต้น, ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะ active-lane ทุก 30 วินาที, แชร์ cache ของ provider CLI tool ระหว่าง lanes ที่เข้ากันได้, retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), และเก็บ timing ของ lane ไว้ใน `.artifacts/docker-tests/lane-timings.json` เพื่อจัดลำดับ longest-first ในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ, หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการนำ timing กลับมาใช้ซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับ lanes แบบ deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับ lanes ของ live-provider เท่านั้น; package aliases คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only จะรวม main และ tail live lanes เป็น pool แบบ longest-first เดียว เพื่อให้ provider buckets สามารถจัดงาน Claude, Codex, และ Gemini ร่วมกันได้ runner จะหยุดจัดตาราง lanes ใหม่ใน pool หลังจากความล้มเหลวครั้งแรก เว้นแต่ตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี fallback timeout 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lanes แบบ live/tail ที่เลือกจะใช้ caps ต่อ lane ที่เข้มงวดกว่า คำสั่งตั้งค่า CLI backend Docker มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) logs ต่อ lane, `summary.json`, `failures.json`, และ phase timings จะถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบ lanes ที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงที่ประหยัด
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ source E2E ที่ใช้ Chromium, เริ่ม raw CDP พร้อม Gateway ที่แยกไว้, รัน `browser doctor --deep`, และตรวจสอบว่า CDP role snapshots มี link URLs, clickables ที่ cursor-promoted, iframe refs, และ frame metadata
- `pnpm test:docker:skill-install`: ติดตั้ง OpenClaw tarball ที่แพ็กแล้วใน bare Docker runner, ปิดใช้ `skills.install.allowUploadedArchives`, resolve skill slug ปัจจุบันจาก live ClawHub search, ติดตั้งผ่าน `openclaw skills install`, และตรวจสอบ `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, และ `skills info --json`
- โพรบ CLI backend live Docker สามารถรันเป็น lanes แบบเจาะจงได้ เช่น `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume`, หรือ `pnpm test:docker:live-cli-backend:claude:mcp` Gemini มี aliases `:resume` และ `:mcp` ที่ตรงกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI ใน Docker, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models`, จากนั้นรันแชตจริงที่ proxy ผ่าน `/api/chat/completions` ต้องมี usable live model key, ดึงอิมเมจ Open WebUI ภายนอก, และไม่ได้คาดว่าจะเสถียรสำหรับ CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seed แล้วและคอนเทนเนอร์ client ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบ routed conversation discovery, transcript reads, attachment metadata, พฤติกรรม live event queue, outbound send routing, และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง assertion ของการแจ้งเตือน Claude อ่าน raw stdio MCP frames โดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ปล่อยออกมาจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ของผู้ใช้เก่าที่สกปรก, รัน package update พร้อม doctor แบบ non-interactive โดยไม่มี live provider หรือ channel keys, จากนั้นเริ่ม loopback Gateway และตรวจสอบว่า agents, channel config, plugin allowlists, workspace/session files, stale legacy plugin dependency state, startup, และ RPC status ยังอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ existing-user ที่สมจริงโดยไม่มี live provider หรือ channel keys, กำหนดค่า baseline นั้นด้วย baked recipe ของคำสั่ง `openclaw config set`, อัปเดต install ที่เผยแพร่แล้วนั้นเป็น OpenClaw tarball ที่แพ็กแล้ว, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม loopback Gateway และตรวจสอบว่า configured intents, workspace/session files, stale plugin config และ legacy dependency state, startup, `/healthz`, `/readyz`, และ RPC status ยังอยู่รอดหรือซ่อมแซมได้สะอาด Override baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขยายเมทริกซ์ local ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, หรือเพิ่ม scenario fixtures ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues มี `configured-plugin-installs` เพื่อตรวจสอบว่า OpenClaw plugins ภายนอกที่กำหนดค่าไว้จะติดตั้งโดยอัตโนมัติระหว่าง upgrade และ `stale-source-plugin-shadow` เพื่อป้องกันไม่ให้เงา plugin ที่มีเฉพาะ source ทำให้ startup เสีย Package Acceptance เปิดเผยสิ่งเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, และ `published_upgrade_survivor_scenarios`, และ resolve meta baseline tokens เช่น `last-stable-4` หรือ `all-since-2026.4.23` ก่อนส่ง package specs ที่แน่นอนให้ Docker lanes
- `pnpm test:docker:update-migration`: รัน harness ของ published-upgrade survivor ใน scenario `plugin-deps-cleanup` ที่เน้น cleanup สูง โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น workflow `Update Migration` แยกต่างหากจะขยาย lane นี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้ทุก stable published package ตั้งแต่ `.23` เป็นต้นไปอัปเดตเป็น candidate และพิสูจน์ configured-plugin dependency cleanup นอก Full Release CI
- `pnpm test:docker:plugins`: รัน smoke สำหรับ install/update ของ local path, `file:`, แพ็กเกจ npm registry ที่มี hoisted dependencies, git moving refs, ClawHub fixtures, marketplace updates, และ Claude-bundle enable/inspect

## เกต PR ในเครื่อง

สำหรับการตรวจ land/gate ของ PR ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` เกิด flake บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็น regression แล้วค่อยแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์มาร์ก latency ของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- env ทางเลือก: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt เริ่มต้น: "ตอบกลับด้วยคำเดียว: ok ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม"

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax มัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus มัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

## เบนช์มาร์กการเริ่มต้น CLI

สคริปต์: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

การใช้งาน:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสอง preset

เอาต์พุตรวม `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจายของ exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการเก็บโปรไฟล์ใช้ harness เดียวกัน

แนวทางการบันทึกเอาต์พุต:

- `pnpm test:startup:bench:smoke` เขียน artifact smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียน artifact ของชุดทดสอบเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่ check-in ไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่ check-in ไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## เบนช์มาร์กการเริ่มต้น Gateway

สคริปต์: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

เบนช์มาร์กมีค่าเริ่มต้นเป็น entry ของ CLI ที่ build แล้วที่ `dist/entry.js`; ให้รัน
`pnpm build` ก่อนใช้คำสั่งจาก package script หากต้องการวัด source
runner แทน ให้ส่ง `--entry scripts/run-node.mjs` และแยกผลลัพธ์เหล่านั้น
ออกจาก baseline ของ entry ที่ build แล้ว

การใช้งาน:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

รหัส case:

- `default`: การเริ่มต้น Gateway ปกติ
- `skipChannels`: การเริ่มต้น Gateway โดยข้ามการเริ่มต้นช่องทาง
- `oneInternalHook`: internal hook ที่กำหนดค่าไว้หนึ่งตัว
- `allInternalHooks`: internal hook ทั้งหมด
- `fiftyPlugins`: Plugin manifest 50 รายการ
- `fiftyStartupLazyPlugins`: Plugin manifest แบบ startup-lazy 50 รายการ

เอาต์พุตรวมเอาต์พุตแรกของ process, `/healthz`, `/readyz`, เวลา log การ listen ของ HTTP,
เวลา log ที่ Gateway พร้อมใช้งาน, เวลา CPU, อัตราส่วนแกน CPU, RSS สูงสุด, heap, เมตริก startup trace,
event-loop delay และเมตริกรายละเอียดของตาราง lookup ของ Plugin สคริปต์จะเปิดใช้
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` ในสภาพแวดล้อม Gateway ของ child

อ่าน `/healthz` เป็น liveness: เซิร์ฟเวอร์ HTTP สามารถตอบได้ อ่าน `/readyz` เป็น
ความพร้อมใช้งานจริง: sidecar ของ Plugin ตอนเริ่มต้น, ช่องทาง และงาน
post-attach ที่ critical ต่อความพร้อมได้ settle แล้ว startup hook ของ Gateway จะถูก dispatch
แบบ asynchronous และไม่เป็นส่วนหนึ่งของการรับประกันความพร้อม เวลา log พร้อมใช้งานคือ timestamp ของ log พร้อมใช้งานภายใน
Gateway; มีประโยชน์สำหรับการระบุที่มาฝั่ง process
แต่ไม่ใช่สิ่งทดแทน probe ภายนอก `/readyz`

ใช้เอาต์พุต JSON หรือ `--output` เมื่อเปรียบเทียบการเปลี่ยนแปลง ใช้ `--cpu-prof-dir` เฉพาะ
หลังจากเอาต์พุต trace ชี้ไปที่ import, compile หรืองานที่ใช้ CPU สูงซึ่งไม่สามารถ
อธิบายได้จาก timing ของ phase เพียงอย่างเดียว อย่าเปรียบเทียบผลลัพธ์จาก source-runner กับ
ผลลัพธ์ `dist/entry.js` ที่ build แล้วเสมือนเป็น baseline เดียวกัน

## เบนช์มาร์กการรีสตาร์ต Gateway

สคริปต์: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

เบนช์มาร์กการรีสตาร์ตรองรับเฉพาะ macOS และ Linux เท่านั้น ใช้ SIGUSR1 สำหรับ
การรีสตาร์ตภายใน process และจะล้มเหลวทันทีบน Windows

เบนช์มาร์กมีค่าเริ่มต้นเป็น entry ของ CLI ที่ build แล้วที่ `dist/entry.js`; ให้รัน
`pnpm build` ก่อนใช้คำสั่งจาก package script หากต้องการวัด source
runner แทน ให้ส่ง `--entry scripts/run-node.mjs` และแยกผลลัพธ์เหล่านั้น
ออกจาก baseline ของ entry ที่ build แล้ว

การใช้งาน:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

รหัส case:

- `skipChannels`: รีสตาร์ตโดยข้ามช่องทาง
- `skipChannelsAcpxProbe`: รีสตาร์ตโดยข้ามช่องทางและเปิด probe การเริ่มต้น ACPX
- `skipChannelsNoAcpxProbe`: รีสตาร์ตโดยข้ามช่องทางและปิด probe การเริ่มต้น ACPX
- `default`: รีสตาร์ตปกติ
- `fiftyPlugins`: รีสตาร์ตพร้อม Plugin manifest 50 รายการ

เอาต์พุตรวม `/healthz` ถัดไป, `/readyz` ถัดไป, downtime, timing ของความพร้อมหลังรีสตาร์ต,
CPU, RSS, เมตริก startup trace สำหรับ process ทดแทน และเมตริก restart trace
สำหรับการจัดการ signal, การ drain active-work, phase การปิด, การเริ่มต้นถัดไป, timing
ความพร้อม และ snapshot หน่วยความจำ สคริปต์จะเปิดใช้
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` และ `OPENCLAW_GATEWAY_RESTART_TRACE=1` ใน
สภาพแวดล้อม Gateway ของ child

ใช้เบนช์มาร์กนี้เมื่อการเปลี่ยนแปลงแตะการส่งสัญญาณรีสตาร์ต, close handler,
startup-after-restart, การปิด sidecar, การส่งต่อบริการ หรือความพร้อมหลัง
รีสตาร์ต เริ่มด้วย `skipChannels` เมื่อแยกกลไกของ Gateway ออกจากการเริ่มต้น
ช่องทาง ใช้ `default` หรือ case ที่มี Plugin หนาแน่นหลังจาก case แคบอธิบาย
เส้นทางการรีสตาร์ตได้แล้วเท่านั้น

เมตริก trace เป็นคำใบ้สำหรับการระบุที่มา ไม่ใช่คำตัดสิน การเปลี่ยนแปลงด้านรีสตาร์ตควรถูก
ตัดสินจากหลาย sample, span ของ owner ที่ตรงกัน, พฤติกรรม `/healthz` และ `/readyz`
และสัญญาการรีสตาร์ตที่ผู้ใช้มองเห็นได้

## Onboarding E2E (Docker)

Docker เป็นทางเลือก; ส่วนนี้จำเป็นเฉพาะสำหรับ smoke test ของ onboarding แบบ containerized

โฟลว์ cold-start เต็มในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับ interactive wizard ผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม gateway และรัน `openclaw health`

## QR import smoke (Docker)

รับรองว่า runtime helper ของ QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (ค่าเริ่มต้น Node 24, ใช้งานร่วมกับ Node 22 ได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)
