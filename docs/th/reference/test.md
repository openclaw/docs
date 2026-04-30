---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-30T10:15:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือทดสอบแบบครบถ้วน (ชุดทดสอบ, แบบสด, Docker): [การทดสอบ](/th/help/testing)

- `pnpm test:force`: ฆ่า process Gateway ที่ค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้นไว้ จากนั้นรันชุด Vitest เต็มชุดด้วยพอร์ต Gateway แยก เพื่อให้การทดสอบเซิร์ฟเวอร์ไม่ชนกับอินสแตนซ์ที่กำลังทำงานอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งให้พอร์ต 18789 ถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุดยูนิตพร้อมความครอบคลุม V8 (ผ่าน `vitest.unit.config.ts`) นี่คือเกตความครอบคลุมยูนิตของไฟล์ที่ถูกโหลด ไม่ใช่ความครอบคลุมทุกไฟล์ทั้ง repo ค่าเกณฑ์คือ 70% สำหรับบรรทัด/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดไฟล์ที่ชุดความครอบคลุมยูนิตโหลด แทนที่จะถือว่าไฟล์ซอร์สทุกไฟล์ในเลนที่แยกไว้เป็นไฟล์ที่ยังไม่ครอบคลุม
- `pnpm test:coverage:changed`: รันความครอบคลุมยูนิตเฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบ changed แบบ smart ราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์ sibling `*.test.ts` การแมปซอร์สแบบชัดเจน และกราฟ import ภายในเครื่อง การเปลี่ยนแปลงกว้าง ๆ ใน config/package จะถูกข้าม เว้นแต่จะ map ไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบ changed แบบกว้างโดยชัดเจน ใช้เมื่อการแก้ไข test harness/config/package ควรถอยกลับไปใช้พฤติกรรม changed-test ที่กว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกเรียกจาก diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกตตรวจสอบ smart changed สำหรับ diff เทียบกับ `origin/main` คำสั่งนี้รัน typecheck, lint และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` แบบชัดเจนสำหรับหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลน Vitest ที่จำกัดขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่ม shard คงที่และขยายเป็น config ใบปลายสำหรับการรันแบบขนานภายในเครื่อง กลุ่ม extension จะขยายเป็น config shard ราย extension เสมอ แทนที่จะเป็น process root-project ขนาดใหญ่หนึ่งตัว
- การรัน test wrapper จบด้วยสรุปสั้น ๆ แบบ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดราย shard
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir หรือ auth-profile store ที่แยกต่างหาก
- ตัวช่วย E2E สำหรับ process: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับ process ของ Vitest ต้องการ Gateway ที่กำลังทำงาน, env ของ CLI, การเก็บ log และการ cleanup ไว้ในที่เดียว
- ตัวช่วย E2E สำหรับ Docker/Bash: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้า container แล้วถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์แบบหลาย home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ได้ ผู้เรียกระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet shell ใน container หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ฝั่ง host ที่ source ได้ `--` ก่อน `create` ป้องกันไม่ให้ runtime Node รุ่นใหม่มอง `--env-file` เป็น flag ของ Node เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายใน container สำหรับการแก้ entrypoint, การเริ่ม mock OpenAI, การเปิด Gateway แบบ foreground/background, readiness probes, การ export env สถานะ, การ dump log และการ cleanup process
- การรัน shard แบบ full, extension และ include-pattern จะอัปเดตข้อมูลเวลาภายในเครื่องใน `.artifacts/vitest-shard-timings.json`; การรันทั้ง config ครั้งถัดไปจะใช้เวลานั้นเพื่อถ่วงสมดุล shard ที่ช้าและเร็ว shard ของ CI แบบ include-pattern จะเติมชื่อ shard ต่อท้าย timing key ซึ่งทำให้เห็น timing ของ shard ที่ถูกกรองโดยไม่แทนที่ข้อมูล timing ของทั้ง config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact timing ภายในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ถูกส่งผ่านเลนเบาเฉพาะทางที่เก็บไว้เฉพาะ `test/setup.ts` โดยปล่อยกรณีที่หนักด้าน runtime ไว้บนเลนเดิม
- ไฟล์ซอร์สที่มีการทดสอบแบบ sibling จะ map ไปยัง sibling นั้นก่อน แล้วจึงถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างกว่า การแก้ไข helper ใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟ import ภายในเครื่องเพื่อรันการทดสอบที่ import ไฟล์นั้น แทนที่จะรันทุก shard แบบกว้างเมื่อ dependency path แม่นยำ
- `auto-reply` ตอนนี้แยกเป็นสาม config เฉพาะทางด้วย (`core`, `top-level`, `reply`) เพื่อให้ harness ของ reply ไม่ครอบงำการทดสอบสถานะ/token/helper ระดับบนที่เบากว่า
- Config พื้นฐานของ Vitest ตอนนี้ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบไม่แยกที่ใช้ร่วมกันทั่ว config ใน repo
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/plugin ทั้งหมด Plugin ช่องทางหนัก, Plugin เบราว์เซอร์ และ OpenAI รันเป็น shard เฉพาะ ส่วนกลุ่ม Plugin อื่นยังคง batched ใช้ `pnpm test extensions/<id>` สำหรับเลน Plugin ที่ bundled หนึ่งตัว
- `pnpm test:perf:imports`: เปิดการรายงานระยะเวลา import และรายละเอียด import ของ Vitest โดยยังคงใช้การ routing เลนที่จำกัดขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: การทำโปรไฟล์ import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูก route เทียบกับการรัน root-project ดั้งเดิมสำหรับ git diff ที่ commit แล้วเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ thread หลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รัน config ใบปลายของ Vitest แบบ full-suite ทุกตัวตามลำดับ และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/log ราย config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้น performance
- การผสาน Gateway: opt-in ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันการทดสอบ smoke end-to-end ของ Gateway (การจับคู่หลายอินสแตนซ์ผ่าน WS/HTTP/node) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม workers แบบปรับตามสถานการณ์ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการข้าม
- `pnpm test:docker:all`: build image live-test ที่ใช้ร่วมกัน, pack OpenClaw หนึ่งครั้งเป็น npm tarball, build/reuse image runner Node/Git เปล่าและ image functional ที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรันเลน Docker smoke ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน scheduler แบบ weighted image เปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้น mount tarball ที่ build ไว้ล่วงหน้าแทนการใช้ซอร์ส repo ที่ copy มา image functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็น package packer เดียวสำหรับ local/CI และตรวจสอบ tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะใช้งาน นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` รัน plan ที่เลือก `node scripts/test-docker-all.mjs --plan-json` ส่งออก plan ของ CI ที่ scheduler เป็นเจ้าของสำหรับเลนที่เลือก ชนิด image ความต้องการ package/live-image สถานะ scenarios และการตรวจ credentials โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุม slot ของ process และค่าเริ่มต้นคือ 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม pool ส่วนท้ายที่อ่อนไหวต่อ provider และค่าเริ่มต้นคือ 10 ค่า cap ของเลนหนักเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ค่า cap ของ provider เริ่มต้นเป็นหนึ่งเลนหนักต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับ host ที่ใหญ่กว่า หากเลนหนึ่งเกิน weight หรือ resource cap ที่มีผลบน host ที่มี parallelism ต่ำ เลนนั้นยังคงเริ่มจาก pool ว่างได้และจะรันลำพังจนกว่าจะปล่อย capacity การเริ่มเลนถูก stagger ครั้งละ 2 วินาทีโดยค่าเริ่มต้น เพื่อหลีกเลี่ยงการสร้างงานจำนวนมากบน Docker daemon ภายในเครื่องในคราวเดียว; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner จะ preflight Docker โดยค่าเริ่มต้น ล้าง container OpenClaw E2E เก่า ส่งสถานะเลนที่ทำงานอยู่ทุก 30 วินาที แชร์ cache ของเครื่องมือ CLI ของ provider ระหว่างเลนที่เข้ากันได้ retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งโดยค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บ timing ของเลนไว้ใน `.artifacts/docker-tests/lane-timings.json` เพื่อเรียงลำดับ longest-first ในการรันครั้งต่อไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของเลนโดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้ timing ซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias ของ package คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวมเลน live หลักและส่วนท้ายเป็น pool เดียวแบบ longest-first เพื่อให้ bucket ของ provider จัดงาน Claude, Codex และ Gemini ร่วมกันได้ runner จะหยุด schedule เลนใหม่ใน pool หลังความล้มเหลวแรก เว้นแต่จะตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี fallback timeout 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail ที่เลือกใช้ cap รายเลนที่แคบกว่า คำสั่งตั้งค่า Docker สำหรับ backend ของ CLI มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log รายเลน, `summary.json`, `failures.json` และ timing ราย phase ถูกเขียนใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบ targeted ราคาถูก
- `pnpm test:docker:browser-cdp-snapshot`: build container E2E ซอร์สที่ใช้ Chromium, เริ่ม raw CDP พร้อม Gateway ที่แยกไว้, รัน `browser doctor --deep` และตรวจว่า snapshot ของ role ใน CDP มี URL ของ link, clickables ที่ยกระดับจาก cursor, iframe refs และ metadata ของ frame
- probe แบบ live ของ backend CLI ใน Docker สามารถรันเป็นเลนที่โฟกัสได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่ตรงกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI ใน Docker, sign in ผ่าน Open WebUI, ตรวจ `/api/models` จากนั้นรัน chat จริงที่ proxied ผ่าน `/api/chat/completions` ต้องใช้ live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`) ดึง image Open WebUI ภายนอก และไม่ได้คาดว่าจะเสถียรใน CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่ม Gateway container ที่ seed แล้วและ client container ตัวที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจการค้นหา conversation ที่ถูก route, การอ่าน transcript, metadata ของ attachment, พฤติกรรม live event queue, การ route การส่งออก และการแจ้งเตือน channel + permission แบบ Claude ผ่าน bridge stdio จริง assertion ของการแจ้งเตือน Claude อ่าน frame MCP stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ส่งออกจริง

## เกต PR ภายในเครื่อง

สำหรับการตรวจ PR ที่จะ land/การตรวจ gate ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` เกิดผลไม่เสถียรบนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็น regression จากนั้นแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์ latency ของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

วิธีใช้:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env เสริม: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: “ตอบด้วยคำเดียว: ok ไม่ต้องมีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม”

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax มัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus มัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

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

เอาต์พุตมี `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจายของ exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือกเสริม `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการจับโปรไฟล์ใช้ harness เดียวกัน

ข้อตกลงของเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์การตรวจสอบเบื้องต้นแบบกำหนดเป้าหมายที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดทดสอบเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรชฟิกซ์เจอร์ค่าฐานที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

ฟิกซ์เจอร์ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับฟิกซ์เจอร์ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือกเสริม จำเป็นเฉพาะสำหรับการทดสอบ onboarding แบบตรวจสอบเบื้องต้นที่รันในคอนเทนเนอร์เท่านั้น

โฟลว์ cold-start เต็มรูปแบบในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ควบคุมตัวช่วยตั้งค่าแบบโต้ตอบผ่าน TTY เสมือน ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## การตรวจสอบเบื้องต้นการนำเข้า QR (Docker)

ทำให้มั่นใจว่า runtime helper ของ QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (ค่าเริ่มต้น Node 24, เข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
