---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมดบังคับ/ความครอบคลุม
title: การทดสอบ
x-i18n:
    generated_at: "2026-06-28T00:13:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือการทดสอบครบชุด (ชุดทดสอบ, การทดสอบจริง, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- ลำดับการทดสอบภายในเครื่องตามปกติ:
  1. `pnpm test:changed` สำหรับหลักฐาน Vitest ตามขอบเขตที่เปลี่ยนแปลง
  2. `pnpm test <path-or-filter>` สำหรับไฟล์เดียว ไดเรกทอรีเดียว หรือเป้าหมายที่ระบุชัดเจน
  3. `pnpm test` เฉพาะเมื่อคุณตั้งใจต้องใช้ชุด Vitest ภายในเครื่องแบบเต็ม
- `pnpm test:force`: ฆ่าโปรเซส gateway ที่ค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้นไว้ จากนั้นเรียกใช้ชุด Vitest แบบเต็มด้วยพอร์ต gateway แยกต่างหากเพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังทำงาน ใช้คำสั่งนี้เมื่อการรัน gateway ก่อนหน้าปล่อยให้พอร์ต 18789 ถูกใช้งานอยู่
- `pnpm test:coverage`: เรียกใช้ชุด unit พร้อมความครอบคลุม V8 (ผ่าน `vitest.unit.config.ts`) นี่คือเกตความครอบคลุมของเลน unit เริ่มต้น ไม่ใช่ความครอบคลุมทุกไฟล์ทั้งรีโป Thresholds คือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false และเลนเริ่มต้นจำกัด coverage includes ไว้ที่การทดสอบ unit ที่ไม่ใช่แบบเร็วพร้อมไฟล์ซอร์สข้างเคียง เกตนี้จึงวัดซอร์สที่เลนนี้เป็นเจ้าของ แทนที่จะวัดทุก transitive import ที่บังเอิญโหลด
- `pnpm test:coverage:changed`: เรียกใช้ความครอบคลุม unit เฉพาะไฟล์ที่เปลี่ยนไปตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบ changed แบบ smart ราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขการทดสอบโดยตรง ไฟล์ `*.test.ts` ข้างเคียง การแมปซอร์สที่ระบุชัดเจน และกราฟ import ภายในเครื่อง การเปลี่ยนแปลง broad/config/package จะถูกข้าม เว้นแต่จะ map ไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบ changed แบบกว้างที่ระบุชัดเจน ใช้เมื่อการแก้ไข test harness/config/package ควรถอยกลับไปใช้พฤติกรรม changed-test ที่กว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกทริกเกอร์โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: delegate ไปยัง Crabbox/Testbox เป็นค่าเริ่มต้นนอก CI จากนั้นรันเกต smart changed check สำหรับ diff เทียบกับ `origin/main` ภายใน remote child คำสั่งนี้รัน typecheck, lint และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนสำหรับหลักฐานการทดสอบ
- Codex worktrees และ linked/sparse checkouts: หลีกเลี่ยงการรัน `pnpm test*`, `pnpm check*` และ `pnpm crabbox:run` ภายในเครื่องโดยตรง เว้นแต่คุณได้ตรวจสอบแล้วว่า pnpm จะไม่ reconcile dependencies สำหรับหลักฐานไฟล์เดียวขนาดเล็กที่ระบุชัดเจน ให้ใช้ `node scripts/run-vitest.mjs <path-or-filter>`; สำหรับ changed gates หรือหลักฐานแบบกว้าง ให้ใช้ `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` เพื่อให้ pnpm รันภายใน Testbox
- หลักฐาน Testbox-through-Crabbox: ใช้ `exitCode` สุดท้ายของ wrapper และ timing JSON เป็นผลลัพธ์คำสั่ง การรัน Blacksmith GitHub Actions ที่ถูก delegate อาจแสดง `cancelled` หลังคำสั่ง SSH สำเร็จ เพราะ Testbox ถูกหยุดจากภายนอก keepalive action; ตรวจสอบสรุปของ wrapper และเอาต์พุตคำสั่งก่อนถือว่านั่นเป็นความล้มเหลวของการทดสอบ
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: จำกัดการ serialize heavy-check ให้อยู่ภายใน worktree ปัจจุบันแทน Git common dir สำหรับคำสั่งอย่าง `pnpm check:changed` และ `pnpm test ...` แบบเจาะจง ใช้เฉพาะบนโฮสต์ภายในเครื่องที่มีความจุสูง เมื่อคุณตั้งใจรัน checks อิสระข้าม linked worktrees
- `pnpm test`: route เป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลน Vitest ตามขอบเขต การรันแบบไม่ระบุเป้าหมายเป็นหลักฐาน full-suite: ใช้กลุ่ม shard คงที่ ขยายเป็น leaf configs สำหรับการรันแบบขนานภายในเครื่อง และพิมพ์ local shard fanout ที่คาดไว้ก่อนเริ่ม กลุ่ม extension จะขยายเป็น per-extension shard configs เสมอ แทนการใช้โปรเซสรูทโปรเจกต์ขนาดใหญ่หนึ่งตัว
- การรัน test wrapper จบด้วยสรุปสั้น ๆ `[test] passed|failed|skipped ... in ...` บรรทัด duration ของ Vitest เองยังคงเป็นรายละเอียดต่อ shard
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir หรือ auth-profile store ที่แยกกัน
- `pnpm test:env-mutations:report`: รายงานแบบไม่บล็อกของการทดสอบและ harnesses ที่ mutate `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` หรือคีย์ env ของ OpenClaw ที่เกี่ยวข้องโดยตรง ใช้เพื่อหาผู้สมัครสำหรับ migration ไปยัง shared test-state helper
- Control UI mocked E2E: ใช้ `pnpm test:ui:e2e` สำหรับเลน Vitest + Playwright ที่เริ่ม Vite Control UI และขับหน้า Chromium จริงกับ Gateway WebSocket แบบ mocked การทดสอบอยู่ใน `ui/src/**/*.e2e.test.ts`; mocks และ controls ที่ใช้ร่วมกันอยู่ใน `ui/src/test-helpers/control-ui-e2e.ts` `pnpm test:e2e` รวมเลนนี้ไว้ด้วย ใน Codex worktrees ให้ใช้ `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` สำหรับหลักฐานเป้าหมายเล็กหลังติดตั้ง dependencies แล้ว หรือใช้ Testbox/Crabbox สำหรับหลักฐาน GUI ที่กว้างกว่า
- Process E2E helpers: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่ทำงานอยู่, CLI env, การจับ log และ cleanup ในที่เดียว
- การทดสอบ TUI PTY: ใช้ `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` สำหรับเลน PTY fake-backend ที่เร็ว ใช้ `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` หรือ `pnpm tui:pty:test:watch --mode local` สำหรับ smoke `tui --local` ที่ช้ากว่า ซึ่ง mock เฉพาะ external model endpoint ตรวจ assert ข้อความที่มองเห็นได้อย่างเสถียรหรือ fixture calls ไม่ใช่ raw ANSI snapshots
- Docker/Bash E2E helpers: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้า container และ decode ด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์ multi-home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ผู้เรียกระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet shell ภายใน container หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env บนโฮสต์ที่ source ได้ `--` ก่อน `create` ป้องกันไม่ให้ Node runtimes รุ่นใหม่ตีความ `--env-file` เป็น Node flag เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายใน container สำหรับการ resolve entrypoint, การเริ่ม mock OpenAI, การเปิด Gateway แบบ foreground/background, readiness probes, การ export state env, log dumps และ process cleanup
- การรัน shard แบบ full, extension และ include-pattern อัปเดตข้อมูล timing ภายในเครื่องใน `.artifacts/vitest-shard-timings.json`; การรัน whole-config ภายหลังใช้ timings เหล่านั้นเพื่อ balance shard ที่ช้าและเร็ว CI shards แบบ include-pattern จะ append ชื่อ shard ต่อท้าย timing key ซึ่งทำให้มองเห็น filtered shard timings ได้โดยไม่แทนที่ข้อมูล whole-config timing ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่สนใจ local timing artifact
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือก ตอนนี้ route ผ่านเลนเบาเฉพาะที่เก็บไว้เฉพาะ `test/setup.ts` โดยปล่อยเคสที่หนักด้าน runtime ไว้บนเลนเดิม
- ไฟล์ซอร์สที่มีการทดสอบข้างเคียงจะ map ไปยังไฟล์ข้างเคียงนั้นก่อนถอยกลับไปใช้ directory globs ที่กว้างกว่า การแก้ไข helper ใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟ import ภายในเครื่องเพื่อรันการทดสอบที่ import แทนการรันทุก shard แบบกว้างเมื่อ dependency path มีความแม่นยำ
- `auto-reply` ตอนนี้ยังแยกเป็นสาม configs เฉพาะ (`core`, `top-level`, `reply`) เพื่อให้ reply harness ไม่ครอบงำการทดสอบ status/token/helper ระดับ top-level ที่เบากว่า
- Base Vitest config ตอนนี้มีค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ shared non-isolated runner ข้าม configs ของรีโป
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/Plugin ทั้งหมด Plugin ช่องทางที่หนัก, browser plugin และ OpenAI จะรันเป็น shard เฉพาะ; กลุ่ม Plugin อื่นยังคง batch รวมกัน ใช้ `pnpm test extensions/<id>` สำหรับเลน Plugin แบบ bundled หนึ่งรายการ
- `pnpm test:perf:imports`: เปิดใช้งานรายงาน Vitest import-duration + import-breakdown ขณะที่ยังใช้ scoped lane routing สำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: การทำ import profiling แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนไปตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูก route เทียบกับการรัน native root-project สำหรับ git diff ที่ commit แล้วเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงของ worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ main thread ของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รัน leaf config ของ Vitest แบบ full-suite ทุกตัวตามลำดับ และเขียนข้อมูล duration แบบ grouped พร้อม artifacts JSON/log ต่อ config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้ slow-test
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบ grouped reports หลังการเปลี่ยนแปลงที่เน้น performance
- `pnpm test:docker:timings <summary.json>` ตรวจดูเลน Docker ที่ช้าหลังการรัน Docker all; ใช้ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงราคาถูกจาก artifacts เดียวกัน
- การรวม Gateway: opt-in ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันชุดรวม E2E ของรีโป: การทดสอบ smoke แบบ gateway end-to-end พร้อมเลน Control UI mocked browser E2E
- `pnpm test:e2e:gateway`: รันการทดสอบ smoke แบบ gateway end-to-end (การจับคู่ multi-instance WS/HTTP/node) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม workers แบบ adaptive ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ logs แบบละเอียด
- `pnpm test:live`: รัน provider live tests (minimax/zai) ต้องใช้ API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:all`: สร้างอิมเมจ live-test ที่ใช้ร่วมกัน, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball, สร้าง/ใช้อิมเมจรันเนอร์ Node/Git แบบเปล่าซ้ำ พร้อมอิมเมจฟังก์ชันที่ติดตั้ง tarball นั้นลงใน `/app`, จากนั้นรันเลน Docker smoke ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่านตัวจัดตารางแบบถ่วงน้ำหนัก อิมเมจแบบเปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้าแทนการใช้ซอร์สของรีโปที่คัดลอกมา อิมเมจฟังก์ชัน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันการทำงานปกติของแอปที่ build แล้ว `scripts/package-openclaw-for-docker.mjs` เป็นตัวแพ็กแพ็กเกจ local/CI เพียงตัวเดียว และตรวจสอบ tarball รวมถึง `dist/postinstall-inventory.json` ก่อนที่ Docker จะนำไปใช้ นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะของตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ใช้รันแผนที่เลือก `node scripts/test-docker-all.mjs --plan-json` ส่งออกแผน CI ที่ตัวจัดตารางเป็นเจ้าของสำหรับเลนที่เลือก, ชนิดอิมเมจ, ความต้องการ package/live-image, สถานการณ์ state, และการตรวจสอบ credential โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมช่อง process และมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุมพูล tail ที่อ่อนไหวต่อ provider และมีค่าเริ่มต้นเป็น 10 ค่า cap ของเลนหนักมีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ค่า cap ของ provider มีค่าเริ่มต้นเป็นเลนหนักหนึ่งเลนต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ขนาดใหญ่กว่า หากเลนหนึ่งเกินน้ำหนักหรือ resource cap ที่มีผลบนโฮสต์ที่มี parallelism ต่ำ เลนนั้นยังเริ่มจากพูลว่างได้ และจะรันเดี่ยวจนกว่าจะคืนความจุ การเริ่มเลนจะถูกหน่วงห่างกัน 2 วินาทีตามค่าเริ่มต้นเพื่อหลีกเลี่ยงการสร้างงานถาโถมใส่ Docker daemon ในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` รันเนอร์จะ preflight Docker ตามค่าเริ่มต้น, ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะเลนที่ทำงานอยู่ทุก 30 วินาที, แชร์แคชเครื่องมือ CLI ของ provider ระหว่างเลนที่เข้ากันได้, retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), และเก็บ timing ของเลนใน `.artifacts/docker-tests/lane-timings.json` เพื่อเรียงลำดับแบบ longest-first ในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์แมนิเฟสต์เลนโดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ, หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้ timing ซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias ของแพ็กเกจคือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมดเฉพาะ live จะรวมเลน live หลักและ tail เข้าเป็นพูล longest-first เดียว เพื่อให้ bucket ของ provider จัดงาน Claude, Codex, และ Gemini ร่วมกันได้ รันเนอร์จะหยุดจัดตารางเลน pooled ใหม่หลังความล้มเหลวครั้งแรก เว้นแต่ตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี timeout สำรอง 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail บางเลนที่เลือกใช้ cap ต่อเลนที่เข้มงวดกว่า คำสั่งตั้งค่า Docker ของ CLI backend มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log รายเลน, `summary.json`, `failures.json`, และ timing ของ phase จะถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงที่ประหยัด
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ source E2E ที่ใช้ Chromium, เริ่ม raw CDP พร้อม Gateway ที่แยกโดดเดี่ยว, รัน `browser doctor --deep`, และตรวจสอบว่า snapshot ของบทบาท CDP มี URL ของลิงก์, clickables ที่ถูกเลื่อนขั้นจาก cursor, refs ของ iframe, และ metadata ของ frame
- `pnpm test:docker:skill-install`: ติดตั้ง OpenClaw tarball ที่แพ็กแล้วใน Docker runner แบบเปล่า, ปิดใช้งาน `skills.install.allowUploadedArchives`, resolve slug ของ skill ปัจจุบันจากการค้นหา ClawHub แบบ live, ติดตั้งผ่าน `openclaw skills install`, และตรวจสอบ `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, และ `skills info --json`
- probe Docker แบบ live ของ CLI backend สามารถรันเป็นเลนแบบโฟกัสได้ เช่น `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume`, หรือ `pnpm test:docker:live-cli-backend:claude:mcp` Gemini มี alias `:resume` และ `:mcp` ที่ตรงกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI ใน Docker, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models`, จากนั้นรันแชทจริงที่ถูก proxy ผ่าน `/api/chat/completions` ต้องมี key ของ live model ที่ใช้ได้, pull อิมเมจ Open WebUI ภายนอก, และไม่คาดว่าจะเสถียรใน CI เท่ากับชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seed แล้วและคอนเทนเนอร์ client ตัวที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบการค้นพบการสนทนาที่ route แล้ว, การอ่าน transcript, metadata ของ attachment, พฤติกรรม live event queue, การ route การส่งออก, และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง assertion การแจ้งเตือนของ Claude อ่าน frame MCP ของ stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ส่งออกจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าที่มีสถานะสกปรก, รันการอัปเดตแพ็กเกจพร้อม doctor แบบ non-interactive โดยไม่มี key ของ live provider หรือ channel, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า agents, config ของ channel, allowlists ของ plugin, ไฟล์ workspace/session, สถานะ dependency ของ legacy plugin ที่ค้างอยู่, startup, และสถานะ RPC ยังอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มี key ของ live provider หรือ channel, ตั้งค่า baseline นั้นด้วยสูตรคำสั่ง `openclaw config set` ที่อบไว้, อัปเดต install ที่เผยแพร่นั้นเป็น OpenClaw tarball ที่แพ็กแล้ว, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า intents ที่ตั้งค่าไว้, ไฟล์ workspace/session, config ของ plugin ที่ค้างอยู่และสถานะ dependency แบบ legacy, startup, `/healthz`, `/readyz`, และสถานะ RPC ยังอยู่รอดหรือซ่อมแซมได้สะอาด Override baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขยายเมทริกซ์ local แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, หรือเพิ่ม scenario fixtures ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues มี `configured-plugin-installs` เพื่อตรวจสอบว่า OpenClaw plugins ภายนอกที่ตั้งค่าไว้ติดตั้งอัตโนมัติระหว่างอัปเกรด และ `stale-source-plugin-shadow` เพื่อป้องกันไม่ให้เงา plugin แบบ source-only ทำให้ startup พัง Package Acceptance เปิดเผยสิ่งเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, และ `published_upgrade_survivor_scenarios` และ resolve token baseline แบบ meta เช่น `last-stable-4` หรือ `all-since-2026.4.23` ก่อนส่ง package spec แบบ exact ให้เลน Docker
- `pnpm test:docker:update-migration`: รัน harness published-upgrade survivor ใน scenario `plugin-deps-cleanup` ที่เน้น cleanup หนัก โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น workflow `Update Migration` แยกต่างหากจะขยายเลนนี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้ทุกแพ็กเกจ stable ที่เผยแพร่ตั้งแต่ `.23` เป็นต้นไปอัปเดตเป็น candidate และพิสูจน์การ cleanup dependency ของ configured-plugin นอก Full Release CI
- `pnpm test:docker:plugins`: รัน install/update smoke สำหรับ local path, `file:`, แพ็กเกจ npm registry ที่มี dependency แบบ hoisted, refs ของ git ที่เปลี่ยนได้, fixtures ของ ClawHub, marketplace updates, และการ enable/inspect bundle ของ Claude

## เกต PR ภายในเครื่อง

สำหรับการตรวจ land/gate ของ PR ภายในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` flake บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็น regression จากนั้นแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์ latency ของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

วิธีใช้:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- env ทางเลือก: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt เริ่มต้น: "ตอบด้วยคำเดียว: ok ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม"

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## เบนช์การเริ่มต้น CLI

สคริปต์: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

วิธีใช้:

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

พรีเซ็ต:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสองพรีเซ็ต

เอาต์พุตประกอบด้วย `sampleCount`, avg, p50, p95, min/max, การกระจาย exit-code/signal และสรุป max RSS สำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการจับโปรไฟล์ใช้ harness เดียวกัน

ข้อตกลงของเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียน artifact smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียน artifact ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## เบนช์การเริ่มต้น Gateway

สคริปต์: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

benchmark ใช้ค่าเริ่มต้นเป็น entry ของ CLI ที่ build แล้วที่ `dist/entry.js`; ให้รัน
`pnpm build` ก่อนใช้คำสั่ง package-script หากต้องการวัด source
runner แทน ให้ส่ง `--entry scripts/run-node.mjs` และเก็บผลลัพธ์เหล่านั้น
แยกจาก baseline ของ built-entry

วิธีใช้:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

รหัส case:

- `default`: การเริ่มต้น Gateway ตามปกติ
- `skipChannels`: การเริ่มต้น Gateway โดยข้ามการเริ่มต้น channel
- `oneInternalHook`: internal hook ที่ตั้งค่าไว้หนึ่งรายการ
- `allInternalHooks`: internal hook ทั้งหมด
- `fiftyPlugins`: manifest plugins 50 รายการ
- `fiftyStartupLazyPlugins`: startup-lazy manifest plugins 50 รายการ

เอาต์พุตประกอบด้วยเอาต์พุตแรกของ process, `/healthz`, `/readyz`, เวลา log ของการ listen HTTP,
เวลา log ที่ Gateway พร้อม, เวลา CPU, อัตราส่วน CPU core, max RSS, heap, metric ของ startup trace,
event-loop delay และ metric รายละเอียดของ plugin lookup-table สคริปต์
เปิดใช้ `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ในสภาพแวดล้อม Gateway ลูก

อ่าน `/healthz` เป็น liveness: เซิร์ฟเวอร์ HTTP สามารถตอบได้ อ่าน `/readyz` เป็น
readiness ที่ใช้งานได้: startup plugin sidecars, channels และงาน
post-attach ที่ ready-critical เข้าสู่สภาวะนิ่งแล้ว Gateway startup hooks จะถูก dispatch
แบบ asynchronous และไม่เป็นส่วนหนึ่งของการรับประกัน readiness เวลา ready log คือ
timestamp ของ ready log ภายใน Gateway; มีประโยชน์สำหรับการระบุที่มาฝั่ง process
แต่ไม่ใช่สิ่งทดแทน probe `/readyz` ภายนอก

ใช้เอาต์พุต JSON หรือ `--output` เมื่อเปรียบเทียบการเปลี่ยนแปลง ใช้ `--cpu-prof-dir` เฉพาะ
หลังจากเอาต์พุต trace ชี้ไปที่งาน import, compile หรืองานที่ผูกกับ CPU ซึ่งไม่สามารถ
อธิบายได้จาก phase timings เพียงอย่างเดียว อย่าเปรียบเทียบผลลัพธ์ของ source-runner กับ
ผลลัพธ์ของ `dist/entry.js` ที่ build แล้วในฐานะ baseline เดียวกัน

## เบนช์การรีสตาร์ต Gateway

สคริปต์: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

benchmark การรีสตาร์ตรองรับเฉพาะ macOS และ Linux เท่านั้น ใช้ SIGUSR1 สำหรับ
การรีสตาร์ตภายใน process และล้มเหลวทันทีบน Windows

benchmark ใช้ค่าเริ่มต้นเป็น entry ของ CLI ที่ build แล้วที่ `dist/entry.js`; ให้รัน
`pnpm build` ก่อนใช้คำสั่ง package-script หากต้องการวัด source
runner แทน ให้ส่ง `--entry scripts/run-node.mjs` และเก็บผลลัพธ์เหล่านั้น
แยกจาก baseline ของ built-entry

วิธีใช้:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

รหัส case:

- `skipChannels`: รีสตาร์ตโดยข้าม channels
- `skipChannelsAcpxProbe`: รีสตาร์ตโดยข้าม channels และเปิด ACPX startup probe
- `skipChannelsNoAcpxProbe`: รีสตาร์ตโดยข้าม channels และปิด ACPX startup probe
- `default`: รีสตาร์ตตามปกติ
- `fiftyPlugins`: รีสตาร์ตพร้อม manifest plugins 50 รายการ

เอาต์พุตประกอบด้วย `/healthz` ถัดไป, `/readyz` ถัดไป, downtime, timing ของ restart ready,
CPU, RSS, metric ของ startup trace สำหรับ process ทดแทน และ metric ของ restart trace
สำหรับการจัดการ signal, การ drain งานที่ active, phase การ close, การ start ถัดไป, timing ของ ready
และ snapshot หน่วยความจำ สคริปต์เปิดใช้
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` และ `OPENCLAW_GATEWAY_RESTART_TRACE=1` ใน
สภาพแวดล้อม Gateway ลูก

ใช้ benchmark นี้เมื่อการเปลี่ยนแปลงแตะ restart signaling, close handlers,
startup-after-restart, sidecar shutdown, service handoff หรือ readiness หลัง
รีสตาร์ต เริ่มด้วย `skipChannels` เมื่อแยกกลไก Gateway ออกจากการเริ่มต้น
channel ใช้ `default` หรือ case ที่มี Plugin หนักเฉพาะหลังจาก case แบบแคบอธิบาย
เส้นทางการรีสตาร์ตได้แล้ว

Trace metrics เป็นคำใบ้สำหรับการระบุที่มา ไม่ใช่ verdict การเปลี่ยนแปลงการรีสตาร์ตควร
ตัดสินจากตัวอย่างหลายชุด, owner span ที่ตรงกัน, พฤติกรรม `/healthz` และ `/readyz`
และสัญญาการรีสตาร์ตที่ผู้ใช้มองเห็นได้

## Onboarding E2E (Docker)

Docker เป็นทางเลือก; จำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบ containerized

โฟลว์ cold-start เต็มรูปแบบใน container Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับ interactive wizard ผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม gateway และรัน `openclaw health`

## QR import smoke (Docker)

ตรวจให้แน่ใจว่า runtime helper ของ QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (Node 24 เป็นค่าเริ่มต้น, Node 22 ใช้งานร่วมกันได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)
