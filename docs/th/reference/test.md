---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-30T18:38:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือทดสอบครบชุด (ชุดทดสอบ, แบบสด, Docker): [การทดสอบ](/th/help/testing)

- `pnpm test:force`: ฆ่าโปรเซส Gateway ที่ยังค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้นไว้ จากนั้นรันชุด Vitest ทั้งหมดด้วยพอร์ต Gateway แบบแยกเดี่ยว เพื่อให้การทดสอบเซิร์ฟเวอร์ไม่ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทำให้พอร์ต 18789 ยังถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุด unit พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่เป็นเกต unit coverage สำหรับไฟล์ที่ถูกโหลด ไม่ใช่ coverage แบบทุกไฟล์ทั้งรีโพ เกณฑ์ขั้นต่ำคือ 70% สำหรับบรรทัด/ฟังก์ชัน/สเตตเมนต์ และ 55% สำหรับ branch เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดไฟล์ที่ถูกโหลดโดยชุด unit coverage แทนที่จะถือว่าทุกไฟล์ซอร์สแบบ split-lane ไม่ถูก cover
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบ changed แบบ smart ราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์ `*.test.ts` ข้างเคียง การแมปซอร์สที่ระบุชัดเจน และกราฟ import ในเครื่อง การเปลี่ยนแปลงแบบกว้าง/config/package จะถูกข้าม เว้นแต่ว่าจะ map ไปยังการทดสอบที่แม่นยำ
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบ changed แบบกว้างที่ระบุชัดเจน ใช้เมื่อการแก้ไข test harness/config/package ควรถอยกลับไปใช้พฤติกรรม changed-test ที่กว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดง lane ทางสถาปัตยกรรมที่ถูกกระตุ้นโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกต smart changed check สำหรับ diff เทียบกับ `origin/main` โดยรัน typecheck, lint และคำสั่ง guard สำหรับ lane ทางสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนสำหรับหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน lane Vitest ที่มีขอบเขต การรันที่ไม่ได้ระบุเป้าหมายใช้กลุ่ม shard คงที่และขยายเป็น config ปลายทางสำหรับการรันขนานในเครื่อง กลุ่ม extension จะขยายเป็น config shard ต่อ extension เสมอ แทนที่จะเป็นโปรเซสรูทโปรเจกต์ขนาดใหญ่เพียงตัวเดียว
- การรัน test wrapper จบด้วยสรุปสั้น ๆ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดต่อ shard
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir หรือ auth-profile store แบบแยกเดี่ยว
- ตัวช่วย Process E2E: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่กำลังรัน, env ของ CLI, การเก็บ log และ cleanup ในที่เดียว
- ตัวช่วย Docker/Bash E2E: lane ที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้า container และ decode ด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์ multi-home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ได้ ผู้เรียกระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet ของ shell ภายใน container หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ฝั่ง host ที่ source ได้ เครื่องหมาย `--` ก่อน `create` ทำให้ runtime Node รุ่นใหม่ไม่ตีความ `--env-file` เป็น flag ของ Node lane Docker/Bash ที่ launch Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายใน container สำหรับการ resolve entrypoint, การ startup OpenAI จำลอง, การ launch Gateway แบบ foreground/background, readiness probe, การ export state env, การ dump log และ cleanup โปรเซส
- การรัน shard แบบ full, extension และ include-pattern จะอัปเดตข้อมูล timing ในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันทั้ง config ในภายหลังใช้ timing เหล่านั้นเพื่อ balance shard ที่ช้าและเร็ว shard CI แบบ include-pattern จะ append ชื่อ shard ต่อท้าย timing key ซึ่งทำให้ timing ของ shard ที่ถูก filter ยังมองเห็นได้โดยไม่แทนที่ข้อมูล timing ของทั้ง config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact timing ในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ถูก route ผ่าน lane เบาเฉพาะที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยเคสที่หนักด้าน runtime ไว้บน lane เดิมของมัน
- ไฟล์ซอร์สที่มีการทดสอบข้างเคียงจะ map ไปยังไฟล์ข้างเคียงนั้นก่อนถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างกว่า การแก้ไข helper ภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟ import ในเครื่องเพื่อรันการทดสอบที่ import ไฟล์เหล่านั้น แทนที่จะรันทุก shard แบบกว้างเมื่อ dependency path แม่นยำ
- `auto-reply` ตอนนี้ยังแยกเป็น config เฉพาะสามชุด (`core`, `top-level`, `reply`) เพื่อให้ reply harness ไม่ครอบงำการทดสอบ status/token/helper ระดับ top-level ที่เบากว่า
- config Vitest พื้นฐานตอนนี้ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้งาน runner แบบ non-isolated ที่ใช้ร่วมกันทั่ว config ของรีโพ
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/Plugin ทั้งหมด Plugin ช่องทางที่หนัก, Plugin เบราว์เซอร์ และ OpenAI รันเป็น shard เฉพาะ ส่วนกลุ่ม Plugin อื่นยังคง batch อยู่ ใช้ `pnpm test extensions/<id>` สำหรับ lane ของ Plugin ที่ bundled หนึ่งตัว
- `pnpm test:perf:imports`: เปิดการรายงาน import-duration + import-breakdown ของ Vitest โดยยังคงใช้ scoped lane routing สำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: profiling การ import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูก route เทียบกับการรันรูทโปรเจกต์ดั้งเดิมสำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ thread หลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profile สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รัน config ปลายทางของ Vitest แบบ full-suite ทุกตัวตามลำดับ และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/log ต่อ config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้น performance
- การผสานรวม Gateway: เลือกใช้ได้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน gateway end-to-end smoke tests (การจับคู่ multi-instance WS/HTTP/node) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม worker แบบปรับตัวใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องมี API key และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อ unskip
- `pnpm test:docker:all`: สร้าง shared live-test image, pack OpenClaw หนึ่งครั้งเป็น npm tarball, สร้าง/นำ bare Node/Git runner image กลับมาใช้ใหม่พร้อม functional image ที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรัน Docker smoke lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน scheduler แบบ weighted bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับ lane installer/update/plugin-dependency; lane เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้าแทนการใช้ซอร์สรีโพที่คัดลอกมา functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับ lane ฟังก์ชันการทำงานของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็นตัว pack package สำหรับ local/CI เพียงตัวเดียว และ validate tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะใช้ นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` execute plan ที่เลือก `node scripts/test-docker-all.mjs --plan-json` emit plan ของ CI ที่ scheduler เป็นเจ้าของสำหรับ lane, ชนิด image, ความต้องการ package/live-image, scenario สถานะ และการตรวจ credential ที่เลือก โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมช่องโปรเซสและมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม tail pool ที่ไวต่อ provider และมีค่าเริ่มต้นเป็น 10 ค่า cap ของ lane หนักมีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ค่า cap ของ provider มีค่าเริ่มต้นเป็น lane หนักหนึ่ง lane ต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับ host ที่ใหญ่กว่า หาก lane หนึ่งเกิน weight หรือ resource cap ที่มีผลบน host ที่มี parallelism ต่ำ ก็ยังเริ่มจาก pool ว่างได้และจะรันลำพังจนกว่าจะคืน capacity การเริ่ม lane จะถูกหน่วงห่างกัน 2 วินาทีตามค่าเริ่มต้นเพื่อหลีกเลี่ยง create storm ของ Docker daemon ในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner ทำ Docker preflight ตามค่าเริ่มต้น, ล้าง container E2E ของ OpenClaw ที่ค้าง, emit สถานะ active-lane ทุก 30 วินาที, แชร์ cache ของ provider CLI tool ระหว่าง lane ที่เข้ากันได้, retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บ timing ของ lane ใน `.artifacts/docker-tests/lane-timings.json` สำหรับการเรียง longest-first ในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับ output สถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้ timing ซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับ lane deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับ lane live-provider เท่านั้น; alias ของ package คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวม lane live หลักและ tail เป็น pool longest-first เดียว เพื่อให้ bucket ของ provider สามารถ pack งาน Claude, Codex และ Gemini ร่วมกัน runner จะหยุด schedule lane ใหม่ใน pool หลังความล้มเหลวครั้งแรก เว้นแต่ตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี timeout fallback 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail ที่เลือกใช้ cap ต่อ lane ที่เข้มกว่า คำสั่งตั้งค่า Docker สำหรับ CLI backend มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log ต่อ lane, `summary.json`, `failures.json` และ phase timing จะถูกเขียนไว้ภายใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจ lane ที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงที่ประหยัด
- `pnpm test:docker:browser-cdp-snapshot`: สร้าง container E2E จากซอร์สที่ใช้ Chromium, เริ่ม raw CDP พร้อม Gateway แบบแยกเดี่ยว, รัน `browser doctor --deep` และตรวจยืนยันว่า snapshot ของบทบาท CDP มี URL ของลิงก์, clickables ที่ cursor-promoted, iframe refs และ metadata ของ frame
- probe Docker live สำหรับ CLI backend สามารถรันเป็น lane เฉพาะจุดได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่ตรงกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI แบบ Dockerized, sign in ผ่าน Open WebUI, ตรวจ `/api/models` จากนั้นรันแชทจริงที่ proxied ผ่าน `/api/chat/completions` ต้องมี live model key ที่ใช้งานได้ (ตัวอย่างเช่น OpenAI ใน `~/.profile`), ดึง image Open WebUI ภายนอก และไม่ได้คาดหวังให้เสถียรสำหรับ CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่ม Gateway container ที่ seed แล้วและ client container ตัวที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจยืนยัน routed conversation discovery, การอ่าน transcript, metadata ของ attachment, พฤติกรรม live event queue, outbound send routing และการแจ้งเตือน channel + permission สไตล์ Claude ผ่าน stdio bridge จริง assertion การแจ้งเตือนของ Claude อ่าน frame MCP ของ stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge emit จริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ของผู้ใช้เก่าที่มีสถานะสกปรก รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ provider หรือช่องทางจริง จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่าเอเจนต์ การกำหนดค่าช่องทาง allowlist ของ plugin ไฟล์ workspace/session สถานะ runtime-deps ของ plugin ที่ค้างเก่า การเริ่มต้น และสถานะ RPC ยังคงอยู่ได้

## เกต PR ภายในเครื่อง

สำหรับการตรวจสอบการรวม/เกต PR ภายในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` ล้มเหลวแบบไม่สม่ำเสมอบนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็นการถดถอย จากนั้นแยกตรวจสอบด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์ latency ของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- ตัวแปรสภาพแวดล้อมทางเลือก: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: “ตอบกลับด้วยคำเดียว: ok ห้ามมีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม”

การรันล่าสุด (2025-12-31, 20 รอบ):

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

ผลลัพธ์ประกอบด้วย `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจาย exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการเก็บโปรไฟล์ใช้ harness เดียวกัน

ข้อตกลงของผลลัพธ์ที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์ smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก จำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบคอนเทนเนอร์เท่านั้น

โฟลว์ cold-start เต็มรูปแบบในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ควบคุมวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## QR import smoke (Docker)

ทำให้แน่ใจว่าตัวช่วย QR runtime ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (ค่าเริ่มต้น Node 24, เข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
