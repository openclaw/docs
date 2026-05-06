---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และควรใช้โหมด force/coverage เมื่อใด
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-06T09:30:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือทดสอบครบชุด (ชุดทดสอบ, สด, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- `pnpm test:force`: ฆ่าโปรเซส Gateway ที่ค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้นไว้ จากนั้นรันชุด Vitest ทั้งหมดด้วยพอร์ต Gateway แบบแยก เพื่อให้การทดสอบเซิร์ฟเวอร์ไม่ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ให้ถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุด unit พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่เป็น coverage gate ของ default-unit-lane ไม่ใช่ coverage ทั้งรีโปสำหรับทุกไฟล์ เกณฑ์คือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false และ lane เริ่มต้นจำกัด coverage includes ไว้ที่การทดสอบ unit แบบ non-fast ที่มีไฟล์ซอร์สพี่น้องกัน gate นี้จึงวัดซอร์สที่ lane นี้เป็นเจ้าของแทนที่จะวัดทุก transitive import ที่บังเอิญโหลดขึ้นมา
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบ changed แบบ smart ราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัดเจน และกราฟ import ภายในเครื่อง การเปลี่ยนแปลง broad/config/package จะถูกข้ามเว้นแต่จะแมปไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบ changed แบบ broad ที่ระบุชัดเจน ใช้เมื่อการแก้ไข test harness/config/package ควรถอยกลับไปใช้พฤติกรรม changed-test ที่กว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดง lane ทางสถาปัตยกรรมที่ถูกกระตุ้นโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน smart changed check gate สำหรับ diff เทียบกับ `origin/main` คำสั่งนี้รัน typecheck, lint และคำสั่ง guard สำหรับ lane ทางสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อเป็นหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน lane Vitest ที่จำกัดขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่ม shard คงที่และขยายเป็น leaf config สำหรับการรันแบบขนานภายในเครื่อง กลุ่ม extension จะขยายเป็น config shard ราย extension เสมอ แทนที่จะเป็นโปรเซสรูตโปรเจกต์ขนาดใหญ่เพียงตัวเดียว
- การรัน test wrapper จะจบด้วยสรุปสั้น ๆ รูปแบบ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดราย shard
- สถานะทดสอบร่วมของ OpenClaw: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture คอนฟิก, workspace, agent dir หรือ auth-profile store แบบแยก
- ตัวช่วย Process E2E: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่กำลังรัน, env ของ CLI, การจับ log และการ cleanup ในที่เดียว
- ตัวช่วย Docker/Bash E2E: lane ที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์แบบหลาย home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ได้ caller ระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet shell ในคอนเทนเนอร์ หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ของ host ที่ source ได้ เครื่องหมาย `--` ก่อน `create` ป้องกันไม่ให้ runtime Node รุ่นใหม่ตีความ `--env-file` เป็น flag ของ Node lane Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายในคอนเทนเนอร์สำหรับการ resolve entrypoint, การเริ่ม mock OpenAI, การเปิด Gateway แบบ foreground/background, readiness probe, การ export state env, การ dump log และการ cleanup โปรเซส
- การรัน shard แบบ full, extension และ include-pattern อัปเดตข้อมูล timing ภายในเครื่องใน `.artifacts/vitest-shard-timings.json`; การรัน whole-config ภายหลังใช้ timing เหล่านั้นเพื่อถ่วงดุล shard ที่ช้าและเร็ว shard CI แบบ include-pattern จะต่อท้ายชื่อ shard เข้าในคีย์ timing ซึ่งทำให้ timing ของ shard ที่ถูกกรองยังมองเห็นได้โดยไม่แทนที่ข้อมูล timing ของ whole-config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact timing ภายในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ถูกส่งผ่าน lane เบาเฉพาะทางที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยเคสที่หนักด้าน runtime ให้อยู่บน lane เดิมของมัน
- ไฟล์ซอร์สที่มีการทดสอบพี่น้องกันจะถูกแมปไปยังไฟล์พี่น้องนั้นก่อน แล้วจึงถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างกว่า การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟ import ภายในเครื่องเพื่อรันการทดสอบที่ import อยู่ แทนที่จะรันทุก shard แบบ broad เมื่อ path ของ dependency แม่นยำ
- ตอนนี้ `auto-reply` แยกออกเป็น config เฉพาะสามชุดด้วย (`core`, `top-level`, `reply`) เพื่อให้ reply harness ไม่ครอบงำการทดสอบสถานะ/token/helper ระดับ top-level ที่เบากว่า
- ตอนนี้ base Vitest config ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบ non-isolated ที่ใช้ร่วมกันข้าม config ในรีโป
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/Plugin ทั้งหมด Plugin ช่องทางหนัก, Plugin เบราว์เซอร์ และ OpenAI รันเป็น shard เฉพาะ ส่วนกลุ่ม Plugin อื่นยังคงถูกรวมเป็น batch ใช้ `pnpm test extensions/<id>` สำหรับ lane ของ Plugin bundled เพียงตัวเดียว
- `pnpm test:perf:imports`: เปิดใช้การรายงานระยะเวลา import และ import-breakdown ของ Vitest โดยยังใช้ scoped lane routing สำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: profiling การ import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูก route เทียบกับการรัน root-project แบบ native สำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ thread หลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profile สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รัน leaf config ของ Vitest แบบ full-suite ทั้งหมดทีละชุดและเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/log ราย config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่มุ่งเน้น performance
- การผสานรวม Gateway: เลือกเปิดใช้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน smoke test แบบ end-to-end ของ Gateway (การจับคู่หลายอินสแตนซ์ผ่าน WS/HTTP/node) ค่าเริ่มต้นคือ `threads` + `isolate: false` พร้อม worker แบบปรับตามสถานการณ์ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องมี API key และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:all`: สร้าง image live-test ที่ใช้ร่วมกัน, pack OpenClaw หนึ่งครั้งเป็น npm tarball, สร้าง/ใช้ซ้ำ image runner แบบ bare Node/Git พร้อม image เชิงฟังก์ชันที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรัน lane smoke ของ Docker ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน scheduler แบบถ่วงน้ำหนัก image แบบ bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับ lane installer/update/plugin-dependency; lane เหล่านั้น mount tarball ที่สร้างไว้ล่วงหน้าแทนการใช้ซอร์สจากรีโปที่คัดลอกมา image เชิงฟังก์ชัน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับ lane ฟังก์ชันการทำงานปกติของแอปที่ build แล้ว `scripts/package-openclaw-for-docker.mjs` เป็น package packer เดียวสำหรับ local/CI และตรวจสอบ tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะใช้ นิยาม lane ของ Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` รันแผนที่เลือก `node scripts/test-docker-all.mjs --plan-json` ปล่อยแผน CI ที่ scheduler เป็นเจ้าของสำหรับ lane ที่เลือก, ชนิด image, ความต้องการ package/live-image, scenario สถานะ และการตรวจ credential โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุม slot ของโปรเซสและมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม tail pool ที่อ่อนไหวต่อ provider และมีค่าเริ่มต้นเป็น 10 cap ของ lane หนักมีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; cap ของ provider มีค่าเริ่มต้นเป็น lane หนักหนึ่ง lane ต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับ host ที่ใหญ่กว่า หาก lane หนึ่งเกินน้ำหนักที่มีผลหรือ resource cap บน host ที่มี parallelism ต่ำ lane นั้นยังสามารถเริ่มจาก pool ว่างได้และจะรันเดี่ยวจนกว่าจะปล่อย capacity การเริ่ม lane ถูกหน่วงห่างกัน 2 วินาทีตามค่าเริ่มต้นเพื่อหลีกเลี่ยง create storm ของ Docker daemon ภายในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner จะ preflight Docker ตามค่าเริ่มต้น, ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะ active-lane ทุก 30 วินาที, แชร์ cache ของ provider CLI tool ระหว่าง lane ที่เข้ากันได้, retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บ timing ของ lane ไว้ใน `.artifacts/docker-tests/lane-timings.json` เพื่อจัดลำดับแบบ longest-first ในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้ timing ซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับ lane แบบ deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับ lane ของ live-provider เท่านั้น; alias ของ package คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวม lane live หลักและ tail เข้าสู่ pool เดียวแบบ longest-first เพื่อให้ bucket ของ provider สามารถจัดงาน Claude, Codex และ Gemini ร่วมกันได้ runner จะหยุด schedule lane ใหม่ใน pool หลังความล้มเหลวครั้งแรก เว้นแต่ตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี timeout fallback 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail ที่เลือกใช้ cap ราย lane ที่เข้มกว่า คำสั่ง setup ของ Docker สำหรับ CLI backend มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log ราย lane, `summary.json`, `failures.json` และ phase timing จะถูกเขียนไว้ภายใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจดู lane ที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบกำหนดเป้าหมายที่ราคาถูก
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ E2E จากซอร์สที่ใช้ Chromium, เริ่ม raw CDP พร้อม Gateway แบบแยก, รัน `browser doctor --deep` และตรวจสอบว่า snapshot ของ role CDP มี URL ของลิงก์, clickable ที่ถูกยกระดับจาก cursor, iframe ref และ metadata ของ frame
- probe Docker แบบ live สำหรับ CLI backend สามารถรันเป็น lane แบบ focused ได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่สอดคล้องกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI ใน Docker, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models` จากนั้นรันแชตจริงที่ proxy ผ่าน `/api/chat/completions` ต้องมี key ของ live model ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`), ดึง image Open WebUI ภายนอก และไม่คาดว่าจะเสถียรสำหรับ CI เท่ากับชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seeded แล้ว และคอนเทนเนอร์ไคลเอนต์ตัวที่สองที่ spawn `openclaw mcp serve` จากนั้นตรวจสอบการค้นพบบทสนทนาที่ถูก route, การอ่าน transcript, metadata ของ attachment, พฤติกรรมคิว live event, การ route การส่งออก และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง การ assert การแจ้งเตือนของ Claude จะอ่าน raw stdio MCP frames โดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ปล่อยออกมาจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง OpenClaw tarball ที่แพ็กไว้ทับ fixture ผู้ใช้เก่าแบบ dirty, รัน package update พร้อม doctor แบบ non-interactive โดยไม่มี live provider หรือ channel keys จากนั้นเริ่ม loopback Gateway และตรวจสอบว่า agents, channel config, plugin allowlists, workspace/session files, สถานะ dependency ของ legacy plugin ที่ค้างอยู่, startup และ RPC status ยังอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มี live provider หรือ channel keys, กำหนดค่า baseline นั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ baked ไว้, อัปเดต published install นั้นเป็น OpenClaw tarball ที่แพ็กไว้, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม loopback Gateway และตรวจสอบว่า configured intents, workspace/session files, plugin config ที่ค้างอยู่และสถานะ legacy dependency, startup, `/healthz`, `/readyz` และ RPC status ยังอยู่รอดหรือซ่อมแซมได้สะอาด Override baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขยาย exact local matrix ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` หรือเพิ่ม scenario fixtures ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues มี `configured-plugin-installs` เพื่อตรวจสอบว่า OpenClaw plugins ภายนอกที่กำหนดค่าไว้ถูกติดตั้งอัตโนมัติระหว่างอัปเกรด และ `stale-source-plugin-shadow` เพื่อป้องกันไม่ให้ source-only plugin shadows ทำให้ startup พัง Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` และ resolve meta baseline tokens เช่น `last-stable-4` หรือ `all-since-2026.4.23` ก่อนส่ง exact package specs ให้ Docker lanes
- `pnpm test:docker:update-migration`: รัน published-upgrade survivor harness ใน scenario `plugin-deps-cleanup` ที่เน้น cleanup หนัก โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น workflow `Update Migration` แยกต่างหากจะขยาย lane นี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้ published package stable ทุกตัวตั้งแต่ `.23` เป็นต้นไปอัปเดตเป็น candidate และพิสูจน์การ cleanup dependency ของ configured-plugin นอก Full Release CI
- `pnpm test:docker:plugins`: รัน install/update smoke สำหรับ local path, `file:`, npm registry packages ที่มี hoisted dependencies, git moving refs, ClawHub fixtures, marketplace updates และ Claude-bundle enable/inspect

## เกต PR ภายในเครื่อง

สำหรับการตรวจสอบ land/gate ของ PR ภายในเครื่อง ให้เรียกใช้:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` เกิดความไม่เสถียรบนโฮสต์ที่มีโหลดสูง ให้เรียกซ้ำหนึ่งครั้งก่อนถือว่าเป็นการถดถอย จากนั้นแยกตรวจสอบด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์ความหน่วงของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env เสริม: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมต์เริ่มต้น: "ตอบกลับด้วยคำเดียว: ok ห้ามมีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม"

การรันล่าสุด (2025-12-31, 20 ครั้ง):

- minimax ค่ามัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus ค่ามัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

## เบนช์การเริ่มต้น CLI

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

พรีเซ็ต:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสองพรีเซ็ต

เอาต์พุตประกอบด้วย `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจายของ exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง `--cpu-prof-dir` / `--heap-prof-dir` ที่เป็นตัวเลือกเสริมจะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการจับโปรไฟล์ใช้ฮาร์เนสเดียวกัน

ข้อตกลงของเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์ smoke แบบเจาะจงไว้ที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดเต็มไว้ที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นตัวเลือกเสริม; ต้องใช้เฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบคอนเทนเนอร์เท่านั้น

โฟลว์ cold-start เต็มรูปแบบในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## QR import smoke (Docker)

ตรวจสอบให้แน่ใจว่าตัวช่วย QR runtime ที่ดูแลอยู่โหลดได้ภายใต้ Docker Node runtimes ที่รองรับ (ค่าเริ่มต้น Node 24, เข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบการอัปเดตและ plugins](/th/help/testing-updates-plugins)
