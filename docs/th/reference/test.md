---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันทดสอบในเครื่อง (vitest) และควรใช้โหมด force/coverage เมื่อใด
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-25T13:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- ชุดเครื่องมือการทดสอบแบบเต็ม (ชุดทดสอบ, live, Docker): [การทดสอบ](/th/help/testing)

- `pnpm test:force`: ปิด process gateway ที่ยังค้างอยู่ซึ่งยึด control port เริ่มต้น จากนั้นรันชุดทดสอบ Vitest เต็มด้วย gateway port แบบแยก เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับ instance ที่กำลังรันอยู่ ใช้ตัวเลือกนี้เมื่อการรัน gateway ก่อนหน้าทิ้งให้พอร์ต 18789 ยังถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุด unit พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่คือเกต coverage ของ unit สำหรับไฟล์ที่ถูกโหลด ไม่ใช่ coverage ทั้ง repo สำหรับทุกไฟล์ เกณฑ์ขั้นต่ำคือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดเฉพาะไฟล์ที่ถูกโหลดโดยชุด unit coverage แทนที่จะถือว่าไฟล์ซอร์สทุกไฟล์ใน split lane ที่ไม่ได้ถูกโหลดนั้นไม่ครอบคลุม
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:changed`: ขยายพาธ git ที่เปลี่ยนให้เป็น Vitest lane แบบจำกัดขอบเขต เมื่อ diff แตะเฉพาะไฟล์ซอร์ส/ทดสอบที่สามารถกำหนดเส้นทางได้ การเปลี่ยนแปลงด้าน config/setup จะยัง fallback ไปใช้การรัน root projects แบบ native เพื่อให้การแก้ wiring รันซ้ำในวงกว้างเมื่อจำเป็น
- `pnpm changed:lanes`: แสดง lane เชิงสถาปัตยกรรมที่ถูกกระตุ้นโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน changed gate อัจฉริยะสำหรับ diff เทียบกับ `origin/main` โดยจะรันงาน core กับ core test lanes, งาน extension กับ extension test lanes, งานที่แตะเฉพาะ tests กับ typecheck/tests ของ test เท่านั้น, ขยายการเปลี่ยนแปลงใน public Plugin SDK หรือ plugin contract ไปเป็นการตรวจสอบ extension หนึ่งรอบ และคงการชน version bump ที่เป็น metadata ของ release เท่านั้นไว้ที่การตรวจสอบ version/config/root-dependency แบบเจาะจง
- `pnpm test`: กำหนดเส้นทางเป้าหมายไฟล์/ไดเรกทอรีแบบ explicit ผ่าน Vitest lane ที่จำกัดขอบเขต การรันที่ไม่ระบุเป้าหมายจะใช้กลุ่ม shard แบบคงที่และขยายไปยัง leaf configs เพื่อรันขนานในเครื่อง กลุ่ม extension จะขยายไปยัง per-extension shard configs เสมอ แทนที่จะเป็น process root-project ขนาดใหญ่เพียงตัวเดียว
- การรัน full และ extension shard จะอัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันครั้งถัดไปจะใช้เวลานี้เพื่อถ่วงดุล shard ที่ช้าและเร็ว ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ timing artifact ในเครื่องนี้
- ไฟล์ทดสอบบางรายการใน `plugin-sdk` และ `commands` ตอนนี้จะถูกกำหนดเส้นทางผ่าน light lanes โดยเฉพาะ ซึ่งคงไว้เพียง `test/setup.ts` และปล่อยให้เคสที่หนักด้าน runtime อยู่ใน lane เดิม
- ไฟล์ซอร์ส helper บางรายการใน `plugin-sdk` และ `commands` ยังแมป `pnpm test:changed` ไปยังการทดสอบ sibling แบบ explicit ใน light lanes เหล่านั้นด้วย ดังนั้นการแก้ helper เล็ก ๆ จะไม่ทำให้ต้องรันชุดทดสอบหนักที่พึ่งพา runtime ซ้ำ
- `auto-reply` ตอนนี้ยังถูกแยกเป็น config เฉพาะสามตัว (`core`, `top-level`, `reply`) เพื่อไม่ให้ reply harness ครอบงำชุดทดสอบ top-level status/token/helper ที่เบากว่า
- Vitest config พื้นฐานตอนนี้ใช้ค่าเริ่มต้น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบ non-isolated ที่ใช้ร่วมกันทั่วทั้ง repo configs
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน extension/plugin shards ทั้งหมด Plugin ช่องทางที่หนัก, browser plugin และ OpenAI จะรันเป็น shard เฉพาะ ส่วนกลุ่ม Plugin อื่นยังคงถูกรวมเป็นชุด ใช้ `pnpm test extensions/<id>` สำหรับ lane ของ bundled plugin ตัวเดียว
- `pnpm test:perf:imports`: เปิดการรายงาน Vitest import-duration และ import-breakdown โดยยังคงใช้การกำหนดเส้นทางแบบ scoped lane สำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุ explicit
- `pnpm test:perf:imports:changed`: profiling import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูกกำหนดเส้นทาง เทียบกับการรัน root-project แบบ native สำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ Vitest main thread (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันทุก full-suite Vitest leaf config แบบอนุกรม และเขียนข้อมูล duration แบบจัดกลุ่ม พร้อม JSON/log artifact ราย config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้นด้านประสิทธิภาพ
- Gateway integration: เปิดใช้แบบ opt-in ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน gateway end-to-end smoke tests (การจับคู่หลาย instance ผ่าน WS/HTTP/node) ใช้ค่าเริ่มต้น `threads` + `isolate: false` พร้อม workers แบบปรับตามสภาพใน `vitest.e2e.config.ts`; ปรับได้ด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` เพื่อดู log แบบละเอียด
- `pnpm test:live`: รัน provider live tests (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:all`: สร้าง shared live-test image และ Docker E2E image หนึ่งครั้ง จากนั้นรัน Docker smoke lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน weighted scheduler `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมจำนวน process slots และมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม tail pool ที่ไวต่อ provider และมีค่าเริ่มต้นเป็น 10 ขีดจำกัด heavy lane มีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ขีดจำกัด provider มีค่าเริ่มต้นเป็น heavy lane หนึ่งตัวต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับเครื่องที่ใหญ่กว่า การเริ่ม lane จะถูกหน่วงห่างกัน 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยง create storm ของ Docker daemon ในเครื่อง; override ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ตัว runner จะ preflight Docker โดยค่าเริ่มต้น, ล้าง OpenClaw E2E containers ที่ค้างอยู่, แสดงสถานะ active lanes ทุก 30 วินาที, แชร์ provider CLI tool caches ระหว่าง lane ที่เข้ากันได้, retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งโดยค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บ lane timings ไว้ที่ `.artifacts/docker-tests/lane-timings.json` เพื่อใช้เรียงแบบ longest-first ในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ lane manifest โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับสถานะ output หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้ timing ซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับ lane แบบ deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับ lane ของ live-provider เท่านั้น; package aliases คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only จะรวม main และ tail live lanes เข้าเป็น longest-first pool เดียว เพื่อให้ bucket ของ provider จัดงาน Claude, Codex และ Gemini ร่วมกันได้ ตัว runner จะหยุดจัดตาราง lane ใหม่หลังความล้มเหลวครั้งแรก เว้นแต่ตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี fallback timeout 120 นาที ซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; live/tail lane บางตัวใช้ขีดจำกัดต่อ lane ที่เข้มกว่า คำสั่ง Docker setup สำหรับ CLI backend มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log ราย lane จะถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`
- live Docker probes ของ CLI backend สามารถรันเป็น focused lanes ได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` ส่วน Claude และ Gemini ก็มี aliases แบบ `:resume` และ `:mcp` เช่นกัน
- `pnpm test:docker:openwebui`: เริ่ม Dockerized OpenClaw + Open WebUI, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models` แล้วรัน proxied chat จริงผ่าน `/api/chat/completions` ต้องมี live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`), ดึง external Open WebUI image และไม่ได้คาดหวังให้เสถียรใน CI แบบเดียวกับชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่ม seeded Gateway container และ client container ตัวที่สองซึ่งเรียก `openclaw mcp serve` จากนั้นตรวจสอบการค้นหาการสนทนาแบบ routed, การอ่าน transcript, metadata ของ attachment, พฤติกรรม live event queue, การกำหนดเส้นทาง outbound send และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง การยืนยัน notification ของ Claude จะอ่าน raw stdio MCP frames โดยตรง เพื่อให้ smoke test สะท้อนสิ่งที่ bridge ปล่อยจริง

## เกต PR ในเครื่อง

สำหรับการตรวจ land/gate ของ PR ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` มีอาการ flaky บนเครื่องที่โหลดหนัก ให้รันซ้ำหนึ่งครั้งก่อนจะถือว่าเป็น regression จากนั้นค่อยแยกด้วย `pnpm test <path/to/test>` สำหรับเครื่องที่หน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## benchmark latency ของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

วิธีใช้:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env แบบเลือกได้: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt เริ่มต้น: “Reply with a single word: ok. No punctuation or extra text.”

ผลการรันล่าสุด (2025-12-31, 20 รอบ):

- minimax median 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus median 2454ms (ต่ำสุด 1224, สูงสุด 3170)

## benchmark การเริ่มต้น CLI

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสอง preset

เอาต์พุตจะมี `sampleCount`, avg, p50, p95, min/max, การกระจาย exit-code/signal และสรุป max RSS ของแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียน V8 profiles ต่อการรัน เพื่อให้การวัดเวลาและการเก็บ profile ใช้ harness เดียวกัน

ธรรมเนียมการบันทึกเอาต์พุต:

- `pnpm test:startup:bench:smoke` จะเขียน targeted smoke artifact ไปที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` จะเขียน full-suite artifact ไปที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` จะรีเฟรช baseline fixture ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นตัวเลือกเสริม; จำเป็นเฉพาะสำหรับ containerized onboarding smoke tests

โฟลว์ cold-start แบบเต็มใน Linux container ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับเคลื่อนวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม gateway และรัน `openclaw health`

## smoke การนำเข้า QR (Docker)

ยืนยันว่า QR runtime helper ที่ดูแลรักษาอยู่โหลดได้ภายใต้ Docker Node runtimes ที่รองรับ (ค่าเริ่มต้น Node 24, ใช้งานร่วมกับ Node 22 ได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
