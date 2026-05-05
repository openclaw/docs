---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-05T01:49:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือการทดสอบครบถ้วน (ชุดทดสอบ, แบบสด, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- `pnpm test:force`: ฆ่าโปรเซส gateway ที่ค้างอยู่และยึดพอร์ตควบคุมเริ่มต้น จากนั้นรันชุด Vitest ทั้งหมดด้วยพอร์ต Gateway แยกต่างหาก เพื่อให้การทดสอบเซิร์ฟเวอร์ไม่ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ไว้ในสถานะถูกใช้งาน
- `pnpm test:coverage`: รันชุด unit พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่คือ gate ของ unit coverage สำหรับไฟล์ที่ถูกโหลด ไม่ใช่ coverage ทุกไฟล์ทั้ง repo ค่า threshold คือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false, gate นี้จึงวัดไฟล์ที่ชุด unit coverage โหลด แทนที่จะถือว่าไฟล์ source ทุกไฟล์ใน split-lane ยังไม่ถูกครอบคลุม
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:changed`: การรัน smart changed test แบบประหยัด โดยรัน target ที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์ sibling `*.test.ts`, source mappings แบบชัดเจน, และ local import graph การเปลี่ยนแปลงแบบกว้าง/config/package จะถูกข้าม เว้นแต่ว่าจะ map ไปยังการทดสอบที่แม่นยำ
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรัน broad changed test แบบชัดเจน ใช้เมื่อการแก้ไข test harness/config/package ควรถอยกลับไปใช้พฤติกรรม changed-test ที่กว้างขึ้นของ Vitest
- `pnpm changed:lanes`: แสดง architectural lanes ที่ถูก trigger โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน smart changed check gate สำหรับ diff เทียบกับ `origin/main` โดยรัน typecheck, lint, และคำสั่ง guard สำหรับ architectural lanes ที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` แบบชัดเจนสำหรับหลักฐานการทดสอบ
- `pnpm test`: route target ไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน scoped Vitest lanes การรันแบบไม่ระบุ target ใช้ fixed shard groups และขยายเป็น leaf configs สำหรับการทำงาน parallel ในเครื่อง; extension group จะขยายเป็น per-extension shard configs เสมอ แทนที่จะเป็น root-project process ขนาดใหญ่ตัวเดียว
- การรัน test wrapper จบด้วยสรุปสั้น ๆ `[test] passed|failed|skipped ... in ...` ส่วนบรรทัดระยะเวลาของ Vitest เองยังเป็นรายละเอียดต่อ shard
- สถานะทดสอบ OpenClaw ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir, หรือ auth-profile store ที่แยกออกมา
- ตัวช่วย Process E2E: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่กำลังรัน, CLI env, การเก็บ log, และ cleanup ในที่เดียว
- ตัวช่วย Docker/Bash E2E: lanes ที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้า container และ decode ด้วย `scripts/lib/openclaw-e2e-instance.sh`; scripts แบบ multi-home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ได้ caller ระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ shell snippet ภายใน container หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับ host env file ที่ source ได้ `--` ก่อน `create` ช่วยกันไม่ให้ runtime Node รุ่นใหม่ตีความ `--env-file` เป็น flag ของ Node lanes Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายใน container สำหรับ entrypoint resolution, mock การเริ่มต้น OpenAI, การเปิด Gateway foreground/background, readiness probes, การ export state env, log dumps, และ process cleanup
- การรัน shard แบบ full, extension, และ include-pattern อัปเดตข้อมูล timing ภายในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรัน whole-config ครั้งถัดไปใช้ timing เหล่านั้นเพื่อ balance shards ที่ช้าและเร็ว include-pattern CI shards จะเติมชื่อ shard ต่อท้าย timing key ซึ่งทำให้ timing ของ shard ที่ถูก filter ยังมองเห็นได้โดยไม่แทนที่ข้อมูล timing ของ whole-config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ local timing artifact
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` บางไฟล์จะ route ผ่าน light lanes เฉพาะที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยกรณีที่ runtime-heavy ไว้บน lanes เดิม
- ไฟล์ source ที่มี sibling tests จะ map ไปยัง sibling นั้นก่อน แล้วค่อยถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างขึ้น การแก้ helper ใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, และ `src/plugins/contracts` ใช้ local import graph เพื่อรันการทดสอบที่ import ไฟล์เหล่านั้น แทนที่จะรันทุก shard แบบกว้างเมื่อ dependency path แม่นยำ
- `auto-reply` ตอนนี้แยกเป็น config เฉพาะสามชุดด้วย (`core`, `top-level`, `reply`) เพื่อให้ reply harness ไม่ครอบงำการทดสอบ status/token/helper ระดับ top-level ที่เบากว่า
- Base Vitest config ตอนนี้ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ shared non-isolated runner ทั่ว repo configs
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน extension/plugin shards ทั้งหมด plugins ของช่องทางที่หนัก, browser Plugin, และ OpenAI รันเป็น shards เฉพาะ; กลุ่ม Plugin อื่นยังคง batch อยู่ ใช้ `pnpm test extensions/<id>` สำหรับ lane ของ bundled Plugin เดียว
- `pnpm test:perf:imports`: เปิดใช้การรายงาน import-duration + import-breakdown ของ Vitest ขณะที่ยังใช้ scoped lane routing สำหรับ target ไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: import profiling เหมือนกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง routed changed-mode เทียบกับการรัน native root-project สำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ main thread ของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รัน leaf config ของ Vitest ใน full-suite ทุกตัวแบบ serial และเขียน grouped duration data พร้อม artifacts JSON/log ต่อ config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้ slow-test
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบ grouped reports หลังการเปลี่ยนแปลงที่เน้น performance
- การผสานรวม Gateway: opt-in ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน gateway end-to-end smoke tests (การจับคู่ multi-instance WS/HTTP/node) ค่าเริ่มต้นคือ `threads` + `isolate: false` พร้อม adaptive workers ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รัน provider live tests (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:all`: build shared live-test image, pack OpenClaw หนึ่งครั้งเป็น npm tarball, build/reuse bare Node/Git runner image พร้อม functional image ที่ติดตั้ง tarball นั้นลงใน `/app`, จากนั้นรัน Docker smoke lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน weighted scheduler bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับ lanes installer/update/plugin-dependency; lanes เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้าแทนการใช้ source จาก repo ที่ copy มา functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับ lanes functionality ของ built-app ปกติ `scripts/package-openclaw-for-docker.mjs` เป็น package packer เดียวสำหรับ local/CI และ validate tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะใช้งาน คำจำกัดความของ Docker lanes อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; planner logic อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` execute plan ที่เลือก `node scripts/test-docker-all.mjs --plan-json` ปล่อย CI plan ที่ scheduler เป็นเจ้าของสำหรับ lanes ที่เลือก, image kinds, ความต้องการ package/live-image, state scenarios, และ credential checks โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุม process slots และมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม provider-sensitive tail pool และมีค่าเริ่มต้นเป็น 10 ค่าเริ่มต้นของ heavy lane caps คือ `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps มีค่าเริ่มต้นเป็นหนึ่ง heavy lane ต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับ hosts ที่ใหญ่ขึ้น หาก lane หนึ่งเกิน effective weight หรือ resource cap บน host ที่ parallelism ต่ำ ก็ยังสามารถเริ่มจาก pool ว่างและจะรันลำพังจนกว่าจะปล่อย capacity การเริ่ม lane ถูก stagger ครั้งละ 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยง local Docker daemon create storms; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner preflight Docker โดยค่าเริ่มต้น, ล้าง containers OpenClaw E2E ที่ค้างอยู่, แสดง active-lane status ทุก 30 วินาที, แชร์ provider CLI tool caches ระหว่าง lanes ที่เข้ากันได้, retry transient live-provider failures หนึ่งครั้งโดยค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), และเก็บ lane timings ใน `.artifacts/docker-tests/lane-timings.json` สำหรับการจัดลำดับแบบ longest-first ในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ lane manifest โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับ status output, หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการ reuse timing ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับ deterministic/local lanes เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับ live-provider lanes เท่านั้น; package aliases คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวม main และ tail live lanes เป็น pool เดียวแบบ longest-first เพื่อให้ provider buckets สามารถ pack งาน Claude, Codex, และ Gemini ด้วยกัน runner หยุด schedule pooled lanes ใหม่หลัง failure แรก เว้นแต่ว่าจะตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี fallback timeout 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; live/tail lanes ที่เลือกใช้ caps ต่อ lane ที่เข้มงวดกว่า คำสั่ง Docker setup ของ CLI backend มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log ต่อ lane, `summary.json`, `failures.json`, และ phase timings ถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบ lanes ที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบ targeted ที่ประหยัด
- `pnpm test:docker:browser-cdp-snapshot`: build source E2E container ที่มี Chromium รองรับ, start raw CDP พร้อม Gateway ที่แยกออกมา, รัน `browser doctor --deep`, และ verify ว่า CDP role snapshots รวม link URLs, clickables ที่เลื่อนระดับจาก cursor, iframe refs, และ frame metadata
- probe Docker แบบ live ของ CLI backend สามารถรันเป็น focused lanes ได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี aliases `:resume` และ `:mcp` ที่สอดคล้องกัน
- `pnpm test:docker:openwebui`: start OpenClaw + Open WebUI ใน Docker, sign in ผ่าน Open WebUI, ตรวจ `/api/models`, จากนั้นรัน proxied chat จริงผ่าน `/api/chat/completions` ต้องมี live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`), pull image Open WebUI ภายนอก, และไม่คาดหวังให้ CI-stable เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: start Gateway container ที่ seed แล้วและ client container ตัวที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้น verify routed conversation discovery, transcript reads, attachment metadata, พฤติกรรม live event queue, outbound send routing, และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง assertion การแจ้งเตือน Claude อ่าน raw stdio MCP frames โดยตรงเพื่อให้ smoke สะท้อนสิ่งที่ bridge emit จริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty, รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ provider หรือช่องทางแบบ live, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า agents, การกำหนดค่าช่องทาง, รายการอนุญาต Plugin, ไฟล์ workspace/session, สถานะ dependency ของ Plugin แบบ legacy ที่ค้างอยู่, การเริ่มต้น, และสถานะ RPC ยังอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, เตรียมไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มีคีย์ provider หรือช่องทางแบบ live, กำหนดค่า baseline นั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้, อัปเดตการติดตั้งที่เผยแพร่นั้นไปยัง tarball ของ OpenClaw ที่แพ็กแล้ว, รัน doctor แบบไม่โต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า intents ที่กำหนดค่าไว้, ไฟล์ workspace/session, การกำหนดค่า Plugin ที่ค้างอยู่และสถานะ dependency แบบ legacy, การเริ่มต้น, `/healthz`, `/readyz`, และสถานะ RPC ยังอยู่รอดหรือซ่อมแซมได้สะอาด แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขยายเมทริกซ์ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `all-since-2026.4.23`, หรือเพิ่ม fixture ของ scenario ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues มี `configured-plugin-installs` เพื่อยืนยันว่า Plugin ภายนอกของ OpenClaw ที่กำหนดค่าไว้ติดตั้งอัตโนมัติระหว่างการอัปเกรด และ `stale-source-plugin-shadow` เพื่อป้องกันไม่ให้ shadow ของ Plugin ที่มีเฉพาะ source ทำให้การเริ่มต้นเสีย Package Acceptance เปิดเผยรายการเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, และ `published_upgrade_survivor_scenarios`
- `pnpm test:docker:update-migration`: รันชุดทดสอบ published-upgrade survivor ใน scenario `plugin-deps-cleanup` ที่เน้นการล้างข้อมูล โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น workflow `Update Migration` แยกต่างหากจะขยาย lane นี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้ทุกแพ็กเกจ stable ที่เผยแพร่ตั้งแต่ `.23` เป็นต้นไปอัปเดตไปยัง candidate และพิสูจน์การล้าง dependency ของ Plugin ที่กำหนดค่าไว้นอก Full Release CI
- `pnpm test:docker:plugins`: รัน smoke สำหรับการติดตั้ง/อัปเดตสำหรับพาธ local, `file:`, แพ็กเกจ npm registry ที่มี dependency แบบ hoisted, git moving refs, fixture ของ ClawHub, การอัปเดต marketplace, และการเปิดใช้/ตรวจสอบ Claude-bundle

## ด่านตรวจสอบ PR ภายในเครื่อง

สำหรับการตรวจสอบการ land/ด่าน PR ภายในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` เกิด flaky บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็น regression จากนั้นแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์เวลาแฝงของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env ทางเลือก: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: “ตอบกลับด้วยคำเดียว: ok. ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม”

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax มัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus มัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

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

เอาต์พุตประกอบด้วย `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจาย exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการบันทึกโปรไฟล์ใช้ harness เดียวกัน

ข้อตกลงของเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียน artifact สำหรับ smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียน artifact ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก จำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบใช้คอนเทนเนอร์

โฟลว์ cold-start เต็มรูปแบบในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับ wizard แบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## Smoke การนำเข้า QR (Docker)

ทำให้แน่ใจว่า runtime helper สำหรับ QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (Node 24 เป็นค่าเริ่มต้น, Node 22 เข้ากันได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)
