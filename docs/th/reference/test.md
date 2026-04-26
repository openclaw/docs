---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และควรใช้โหมด force/coverage เมื่อใด
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-26T11:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- ชุดเครื่องมือทดสอบแบบครบชุด (suites, live, Docker): [การทดสอบ](/th/help/testing)

- `pnpm test:force`: ปิด process Gateway ที่ค้างอยู่ซึ่งยังยึด control port ค่าเริ่มต้น จากนั้นรันชุด Vitest เต็มด้วยพอร์ต Gateway แบบแยก เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับ instance ที่กำลังรันอยู่ ใช้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ไว้ในสถานะถูกใช้งาน
- `pnpm test:coverage`: รันชุด unit พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่คือ coverage gate ของ unit สำหรับไฟล์ที่ถูกโหลด ไม่ใช่ coverage แบบทุกไฟล์ทั้งรีโป เกณฑ์ขั้นต่ำคือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false gate นี้จึงวัดจากไฟล์ที่ถูกโหลดโดยชุด unit coverage แทนที่จะถือว่าไฟล์ source ทั้งหมดใน split-lane ที่ไม่ได้โหลดเป็น uncovered
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:changed`: ขยายเส้นทาง git ที่เปลี่ยนให้เป็น Vitest lanes แบบจำกัดขอบเขต เมื่อ diff แตะเฉพาะไฟล์ source/test ที่กำหนดเส้นทางได้ การเปลี่ยน config/setup จะยัง fallback ไปใช้การรัน root projects แบบ native เพื่อให้การแก้ wiring รันซ้ำในวงกว้างเมื่อจำเป็น
- `pnpm test:changed:focused`: การรันทดสอบ changed แบบ inner-loop จะรันเฉพาะเป้าหมายที่เจาะจงจากการแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์ `*.test.ts` ที่เป็น sibling, source mappings แบบ explicit และ local import graph การเปลี่ยนแปลงแบบกว้าง/config/package จะถูกข้ามแทนที่จะขยายไปเป็น full changed-test fallback
- `pnpm changed:lanes`: แสดง architectural lanes ที่ถูกทริกเกอร์โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน smart changed gate สำหรับ diff เทียบกับ `origin/main` โดยรันงาน core พร้อม core test lanes, งาน extension พร้อม extension test lanes, งานที่แตะเฉพาะ test พร้อมเฉพาะ test typecheck/tests, ขยายการเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract ไปเป็นการตรวจสอบ extension หนึ่งรอบ และคง version bumps ที่แตะเฉพาะ release metadata ไว้ใน targeted version/config/root-dependency checks
- `pnpm test`: กำหนดเส้นทางเป้าหมาย file/directory แบบ explicit ผ่าน Vitest lanes ที่จำกัดขอบเขต การรันแบบไม่ระบุเป้าหมายจะใช้ shard groups แบบคงที่และขยายไปยัง leaf configs เพื่อให้รันขนานในเครื่องได้ โดยกลุ่ม extension จะขยายไปยัง per-extension shard configs เสมอ แทนที่จะเป็น root-project process ขนาดใหญ่ตัวเดียว
- การรันแบบ full, extension และ include-pattern shard จะอัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรัน whole-config ครั้งถัดไปจะใช้ข้อมูลนี้เพื่อถ่วงสมดุล shard ที่ช้าและเร็ว include-pattern CI shards จะต่อท้าย shard name ลงใน timing key เพื่อให้ timing ของ filtered shards ยังมองเห็นได้โดยไม่แทนที่ข้อมูล timing ของ whole-config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ timing artifact ในเครื่อง
- ไฟล์ทดสอบบางรายการใน `plugin-sdk` และ `commands` ตอนนี้จะถูกกำหนดเส้นทางผ่าน light lanes โดยเฉพาะ ซึ่งคงไว้เพียง `test/setup.ts` และปล่อยให้เคสที่หนักด้าน runtime อยู่ใน lanes เดิม
- ไฟล์ source ที่มี sibling tests จะ map ไปยัง sibling นั้นก่อน แล้วค่อย fallback ไปยัง directory globs ที่กว้างกว่า การแก้ helper ภายใต้ `test/helpers/channels` และ `test/helpers/plugins` จะใช้ local import graph เพื่อรันทดสอบที่ import helper นั้น แทนการรันทุก shard แบบกว้างเมื่อเส้นทาง dependency มีความแม่นยำ
- `auto-reply` ตอนนี้ถูกแยกเป็น 3 configs เฉพาะ (`core`, `top-level`, `reply`) เพื่อให้ reply harness ไม่กลบการทดสอบ top-level status/token/helper ที่เบากว่า
- Base Vitest config ตอนนี้ใช้ค่าเริ่มต้น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ shared non-isolated runner ร่วมกันทั้งรีโป configs
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shards ของ extension/plugin ทั้งหมด โดย channel plugins ที่หนัก, browser plugin และ OpenAI จะรันเป็น shards เฉพาะ ส่วนกลุ่ม plugin อื่นยังคงถูกรวมเป็นชุด ใช้ `pnpm test extensions/<id>` สำหรับ bundled plugin lane เดียว
- `pnpm test:perf:imports`: เปิดรายงาน Vitest import-duration + import-breakdown โดยยังคงใช้ scoped lane routing สำหรับเป้าหมาย file/directory แบบ explicit
- `pnpm test:perf:imports:changed`: โปรไฟล์ import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่กำหนดเส้นทางแล้วเทียบกับ native root-project run สำหรับ committed git diff เดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ Vitest main thread (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันทุก full-suite Vitest leaf config แบบอนุกรม และเขียนข้อมูล duration แบบจัดกลุ่มพร้อม per-config JSON/log artifacts Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้นประสิทธิภาพ
- Gateway integration: เปิดใช้แบบ opt-in ด้วย `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน Gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing) โดยค่าเริ่มต้นใช้ `threads` + `isolate: false` พร้อม adaptive workers ใน `vitest.e2e.config.ts`; ปรับได้ด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` เพื่อดูล็อกแบบละเอียด
- `pnpm test:live`: รัน provider live tests (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะผู้ให้บริการ) เพื่อยกเลิกการข้าม
- `pnpm test:docker:all`: สร้าง shared live-test image และ Docker E2E image หนึ่งครั้ง จากนั้นรัน Docker smoke lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน weighted scheduler `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมจำนวน process slots และค่าเริ่มต้นคือ 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม provider-sensitive tail pool และค่าเริ่มต้นคือ 10 ขีดจำกัด heavy lane เริ่มต้นคือ `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps เริ่มต้นคือหนึ่ง heavy lane ต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับเครื่องที่ใหญ่กว่า การเริ่ม lane จะถูกหน่วง 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยงภาระ create storm ของ local Docker daemon; override ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner จะ preflight Docker โดยค่าเริ่มต้น, ล้าง stale OpenClaw E2E containers, แสดงสถานะ active-lane ทุก 30 วินาที, แชร์ provider CLI tool caches ระหว่าง lanes ที่เข้ากันได้, retry transient live-provider failures หนึ่งครั้งโดยค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บ lane timings ไว้ที่ `.artifacts/docker-tests/lane-timings.json` เพื่อจัดลำดับ longest-first ในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ lane manifest โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับสถานะ output หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิด timing reuse ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับ lanes แบบ deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับ live-provider lanes เท่านั้น; aliases ของ package คือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only จะรวม main และ tail live lanes เป็น longest-first pool เดียว เพื่อให้ provider buckets สามารถจัดงาน Claude, Codex และ Gemini ร่วมกันได้ runner จะหยุด schedule pooled lanes ใหม่หลัง failure แรก เว้นแต่ตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี fallback timeout 120 นาทีซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; live/tail lanes บางรายการใช้ per-lane caps ที่เข้มกว่า คำสั่ง Docker setup สำหรับ CLI backend มี timeout แยกผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) per-lane logs จะถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`
- `pnpm test:docker:browser-cdp-snapshot`: สร้าง source E2E container ที่ใช้ Chromium, เริ่ม raw CDP พร้อม Gateway แบบแยก, รัน `browser doctor --deep` และตรวจสอบว่า CDP role snapshots มี link URLs, cursor-promoted clickables, iframe refs และ frame metadata
- การตรวจสอบ CLI backend live Docker สามารถรันเป็น focused lanes ได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` โดย Claude และ Gemini มี aliases `:resume` และ `:mcp` ที่สอดคล้องกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI แบบ Dockerized, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models` จากนั้นรัน proxied chat จริงผ่าน `/api/chat/completions` ต้องใช้ live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`), ดึง external Open WebUI image และไม่ได้คาดหวังให้เสถียรใน CI เท่ากับชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่ม seeded Gateway container และ client container ตัวที่สองซึ่งรัน `openclaw mcp serve` จากนั้นตรวจสอบ routed conversation discovery, transcript reads, attachment metadata, พฤติกรรม live event queue, outbound send routing และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง assertion ของ Claude notification จะอ่าน raw stdio MCP frames โดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ส่งออกจริง

## PR gate ในเครื่อง

สำหรับการตรวจ land/gate ของ PR ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` มีอาการ flake บนเครื่องที่มีภาระสูง ให้รันซ้ำหนึ่งครั้งก่อนจะสรุปว่าเป็น regression จากนั้นค่อยแยกด้วย `pnpm test <path/to/test>` สำหรับเครื่องที่มีข้อจำกัดด้านหน่วยความจำ ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## benchmark ความหน่วงของโมเดล (local keys)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

วิธีใช้:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env ที่เลือกใช้ได้: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt ค่าเริ่มต้น: “Reply with a single word: ok. No punctuation or extra text.”

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

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสอง preset

ผลลัพธ์จะมี `sampleCount`, avg, p50, p95, min/max, การกระจายของ exit-code/signal และสรุป max RSS สำหรับแต่ละคำสั่ง การใช้ `--cpu-prof-dir` / `--heap-prof-dir` แบบเลือกได้จะเขียน V8 profiles ต่อการรัน เพื่อให้การจับเวลาและการเก็บ profile ใช้ harness เดียวกัน

ข้อกำหนดการตั้งชื่อสำหรับผลลัพธ์ที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` จะเขียน targeted smoke artifact ไปที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` จะเขียน full-suite artifact ไปที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` จะรีเฟรช baseline fixture ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก และจำเป็นเฉพาะสำหรับ containerized onboarding smoke tests

โฟลว์ cold-start แบบเต็มใน Linux container ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้จะขับเคลื่อน interactive wizard ผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม gateway และรัน `openclaw health`

## QR import smoke (Docker)

ตรวจสอบว่า QR runtime helper ที่มีการดูแลอยู่สามารถโหลดได้ภายใต้ Docker Node runtimes ที่รองรับ (Node 24 เป็นค่าเริ่มต้น, รองรับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
