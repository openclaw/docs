---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีเรียกใช้การทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-02T20:59:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือทดสอบครบถ้วน (ชุดทดสอบ, การทดสอบจริง, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- `pnpm test:force`: ฆ่ากระบวนการ Gateway ที่ยังค้างอยู่และยึดพอร์ตควบคุมเริ่มต้น จากนั้นรันชุดทดสอบ Vitest ทั้งหมดโดยใช้พอร์ต Gateway แยกเฉพาะ เพื่อให้การทดสอบเซิร์ฟเวอร์ไม่ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้านี้ปล่อยให้พอร์ต 18789 ถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุดทดสอบหน่วยพร้อมความครอบคลุมของ V8 (ผ่าน `vitest.unit.config.ts`) นี่เป็นเกตความครอบคลุมของหน่วยสำหรับไฟล์ที่ถูกโหลด ไม่ใช่ความครอบคลุมทุกไฟล์ทั้งรีโป เกณฑ์คือ 70% สำหรับบรรทัด/ฟังก์ชัน/คำสั่ง และ 55% สำหรับกิ่งเงื่อนไข เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดไฟล์ที่ถูกโหลดโดยชุดทดสอบความครอบคลุมของหน่วย แทนที่จะถือว่าไฟล์ซอร์สทุกไฟล์ในเลนที่แยกไว้ไม่มีความครอบคลุม
- `pnpm test:coverage:changed`: รันความครอบคลุมของหน่วยเฉพาะไฟล์ที่เปลี่ยนแปลงตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบแบบเปลี่ยนแปลงอัจฉริยะราคาถูก จะรันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัดเจน และกราฟ import ภายในเครื่อง การเปลี่ยนแปลงแบบกว้าง/คอนฟิก/แพ็กเกจจะถูกข้าม เว้นแต่จะแมปไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบแบบเปลี่ยนแปลงกว้างที่ระบุชัดเจน ใช้เมื่อต้องการให้การแก้ไข test harness/คอนฟิก/แพ็กเกจย้อนกลับไปใช้พฤติกรรมการทดสอบแบบเปลี่ยนแปลงที่กว้างขึ้นของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกกระตุ้นโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกตตรวจสอบแบบเปลี่ยนแปลงอัจฉริยะสำหรับ diff เทียบกับ `origin/main` โดยรัน typecheck, lint และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อใช้เป็นหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลน Vitest ตามขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่ม shard คงที่และขยายเป็นคอนฟิกปลายทางสำหรับการทำงานขนานภายในเครื่อง กลุ่ม extension จะขยายเป็นคอนฟิก shard ต่อ extension เสมอ แทนที่จะเป็นกระบวนการโปรเจกต์รากขนาดใหญ่เพียงหนึ่งเดียว
- การรันผ่านตัวครอบทดสอบจะจบด้วยสรุปสั้น ๆ แบบ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดราย shard
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture คอนฟิก, workspace, ไดเรกทอรี agent หรือ auth-profile store ที่แยกเฉพาะ
- ตัวช่วย E2E ระดับกระบวนการ: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับกระบวนการของ Vitest ต้องการ Gateway ที่กำลังรัน, สภาพแวดล้อม CLI, การเก็บ log และการล้างข้อมูลในที่เดียว
- ตัวช่วย Docker/Bash E2E: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์หลาย home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละ flow ผู้เรียกระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet shell ในคอนเทนเนอร์ หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์สภาพแวดล้อมโฮสต์ที่ source ได้ `--` ก่อน `create` ป้องกันไม่ให้ runtime Node รุ่นใหม่ตีความ `--env-file` เป็น flag ของ Node เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายในคอนเทนเนอร์เพื่อใช้การแก้ entrypoint, การเริ่มต้น OpenAI จำลอง, การเปิด Gateway แบบ foreground/background, readiness probes, การ export สภาพแวดล้อมสถานะ, การ dump log และการล้างกระบวนการ
- การรัน shard แบบเต็ม, extension และ include-pattern จะอัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันทั้งคอนฟิกในภายหลังจะใช้ข้อมูลเวลาเหล่านี้เพื่อปรับสมดุล shard ที่ช้าและเร็ว shard ของ CI แบบ include-pattern จะเติมชื่อ shard ต่อท้ายคีย์เวลา ซึ่งทำให้เห็นเวลาของ shard ที่ถูกกรองโดยไม่แทนที่ข้อมูลเวลาทั้งคอนฟิก ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact เวลาในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ถูกส่งผ่านเลนเบาเฉพาะทางที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยกรณีที่ใช้ runtime หนักไว้บนเลนเดิม
- ไฟล์ซอร์สที่มีการทดสอบพี่น้องจะถูกแมปไปยังไฟล์พี่น้องนั้นก่อน แล้วจึงค่อยย้อนกลับไปยัง glob ไดเรกทอรีที่กว้างกว่า การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟ import ภายในเครื่องเพื่อรันการทดสอบที่ import ไฟล์เหล่านั้น แทนที่จะรัน shard ทุกตัวแบบกว้างเมื่อเส้นทาง dependency มีความแม่นยำ
- `auto-reply` ตอนนี้แยกเป็นคอนฟิกเฉพาะสามชุดด้วย (`core`, `top-level`, `reply`) เพื่อให้ reply harness ไม่ครอบงำการทดสอบสถานะ/token/helper ระดับบนที่เบากว่า
- คอนฟิก Vitest พื้นฐานตอนนี้ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบไม่แยก isolate ที่ใช้ร่วมกันทั่วทั้งคอนฟิกของรีโป
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/plugin ทั้งหมด channel plugins ที่หนัก, browser plugin และ OpenAI รันเป็น shard เฉพาะ ส่วนกลุ่ม plugin อื่นยังคงถูกรวมเป็น batch ใช้ `pnpm test extensions/<id>` สำหรับเลน plugin ที่ bundled หนึ่งตัว
- `pnpm test:perf:imports`: เปิดใช้รายงานระยะเวลา import และรายละเอียด import ของ Vitest ขณะยังคงใช้การกำหนดเส้นทางเลนตามขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: การทำ profiling import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนแปลงตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูก route เทียบกับการรัน root-project แบบ native สำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับเธรดหลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU และ heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันคอนฟิกปลายทาง Vitest ของ full-suite ทุกตัวแบบ serial และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/log รายคอนฟิก Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้ไขการทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่มุ่งเน้นประสิทธิภาพ
- การผสานรวม Gateway: เลือกเปิดใช้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันการทดสอบ smoke แบบ end-to-end ของ Gateway (การจับคู่หลายอินสแตนซ์ WS/HTTP/node) ค่าเริ่มต้นคือ `threads` + `isolate: false` พร้อม adaptive workers ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการข้าม
- `pnpm test:docker:all`: build image live-test ที่ใช้ร่วมกัน, pack OpenClaw หนึ่งครั้งเป็น npm tarball, build/นำกลับมาใช้ใหม่ image runner Node/Git เปล่า รวมถึง functional image ที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรันเลน smoke ของ Docker ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน scheduler แบบมีน้ำหนัก image เปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้น mount tarball ที่ build ไว้ล่วงหน้าแทนการใช้ซอร์สรีโปที่คัดลอกมา functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็นตัว pack แพ็กเกจเดียวสำหรับ local/CI และตรวจสอบ tarball รวมถึง `dist/postinstall-inventory.json` ก่อนที่ Docker จะนำไปใช้ นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตาม plan ที่เลือก `node scripts/test-docker-all.mjs --plan-json` ปล่อย plan ของ CI ที่ scheduler เป็นเจ้าของสำหรับเลนที่เลือก, ชนิด image, ความต้องการ package/live-image, scenario สถานะ และการตรวจ credentials โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมช่องกระบวนการและค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม tail pool ที่ไวต่อ provider และค่าเริ่มต้นเป็น 10 ค่าเริ่มต้นของขีดจำกัดเลนหนักคือ `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ค่าเริ่มต้นของขีดจำกัด provider คือหนึ่งเลนหนักต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ขนาดใหญ่กว่า หากเลนหนึ่งเกินน้ำหนักหรือขีดจำกัดทรัพยากรที่มีผลบนโฮสต์ที่มี parallelism ต่ำ เลนนั้นยังเริ่มจาก pool ว่างได้และจะรันลำพังจนกว่าจะคืน capacity การเริ่มเลนจะถูกหน่วงเป็นช่วงห่าง 2 วินาทีตามค่าเริ่มต้นเพื่อหลีกเลี่ยงพายุการสร้างของ Docker daemon ภายในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner จะ preflight Docker ตามค่าเริ่มต้น, ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้าง, ปล่อยสถานะ active-lane ทุก 30 วินาที, แชร์ cache เครื่องมือ CLI ของ provider ระหว่างเลนที่เข้ากันได้, retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บเวลาเลนไว้ใน `.artifacts/docker-tests/lane-timings.json` เพื่อเรียงลำดับ longest-first ในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ lane manifest โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับ output สถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการนำเวลาเดิมกลับมาใช้ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias แพ็กเกจคือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only จะรวมเลน live หลักและ tail เป็น pool เดียวแบบ longest-first เพื่อให้ bucket ของ provider สามารถอัดงาน Claude, Codex และ Gemini เข้าด้วยกัน runner จะหยุด schedule เลน pooled ใหม่หลังความล้มเหลวครั้งแรก เว้นแต่ตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี fallback timeout 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail ที่เลือกใช้ขีดจำกัดรายเลนที่เข้มกว่า คำสั่งตั้งค่า Docker ของ CLI backend มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log รายเลน, `summary.json`, `failures.json` และเวลาแต่ละ phase จะถูกเขียนใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงที่ราคาถูก
- `pnpm test:docker:browser-cdp-snapshot`: build คอนเทนเนอร์ E2E จากซอร์สที่ใช้ Chromium, เริ่ม CDP ดิบพร้อม Gateway ที่แยกเฉพาะ, รัน `browser doctor --deep` และตรวจว่า snapshot บทบาท CDP มี URL ของลิงก์, clickables ที่เลื่อนระดับจาก cursor, refs ของ iframe และ metadata ของ frame
- probe live Docker ของ CLI backend สามารถรันเป็นเลนเฉพาะจุดได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่สอดคล้องกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI แบบ Dockerized, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจ `/api/models` จากนั้นรันแชตจริงที่ proxy ผ่าน `/api/chat/completions` ต้องมี key ของ live model ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`), ดึง image Open WebUI ภายนอก และไม่คาดว่าจะเสถียรสำหรับ CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seed แล้วและคอนเทนเนอร์ client ตัวที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจการค้นพบการสนทนาที่ถูก route, การอ่าน transcript, metadata ของ attachment, พฤติกรรมคิวเหตุการณ์ live, การ route การส่งออก และการแจ้งเตือน channel + permission แบบ Claude ผ่านสะพาน stdio จริง assertion การแจ้งเตือน Claude อ่านเฟรม MCP stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่สะพานปล่อยออกมาจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง tarball OpenClaw ที่แพ็กแล้วทับฟิกซ์เจอร์ผู้ใช้เก่าที่มีสถานะไม่สะอาด รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือคีย์ช่องทางแบบสด จากนั้นเริ่ม Gateway แบบลูปแบ็กและตรวจสอบว่าเอเจนต์ การกำหนดค่าช่องทาง รายการอนุญาต Plugin ไฟล์เวิร์กสเปซ/เซสชัน สถานะ dependency ของ Plugin ดั้งเดิมที่ค้างอยู่ การเริ่มต้น และสถานะ RPC ยังคงอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น เติมไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มีคีย์ผู้ให้บริการหรือคีย์ช่องทางแบบสด กำหนดค่าค่าพื้นฐานนั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้ อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball OpenClaw ที่แพ็กแล้ว รัน doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบลูปแบ็กและตรวจสอบว่าเจตนาที่กำหนดค่าไว้ ไฟล์เวิร์กสเปซ/เซสชัน การกำหนดค่า Plugin ที่ค้างอยู่และสถานะ dependency ดั้งเดิม การเริ่มต้น `/healthz`, `/readyz` และสถานะ RPC ยังคงอยู่รอดหรือซ่อมแซมได้อย่างสะอาด แทนที่ค่าพื้นฐานหนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขยายเมทริกซ์แบบเจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `all-since-2026.4.23` หรือเพิ่มฟิกซ์เจอร์สถานการณ์ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` เพื่อยืนยันว่า Plugin OpenClaw ภายนอกที่กำหนดค่าไว้จะติดตั้งโดยอัตโนมัติระหว่างการอัปเกรด Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- `pnpm test:docker:update-migration`: รันฮาร์เนส published-upgrade survivor ในสถานการณ์ `plugin-deps-cleanup` ที่เน้นการล้างข้อมูล โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น เวิร์กโฟลว์ `Update Migration` แยกต่างหากจะขยายเลนนี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้แพ็กเกจที่เผยแพร่แบบเสถียรทุกตัวตั้งแต่ `.23` เป็นต้นไปอัปเดตเป็นตัวเลือกเผยแพร่ และพิสูจน์การล้าง dependency ของ Plugin ที่กำหนดค่าไว้นอก Full Release CI
- `pnpm test:docker:plugins`: รัน smoke สำหรับการติดตั้ง/อัปเดตสำหรับพาธภายในเครื่อง, `file:`, แพ็กเกจรีจิสทรี npm ที่มี dependency แบบ hoisted, ref ของ git ที่เคลื่อนที่, ฟิกซ์เจอร์ ClawHub, การอัปเดต marketplace และการเปิดใช้งาน/ตรวจสอบชุด Claude

## เกต PR ในเครื่อง

สำหรับการตรวจสอบ land/gate ของ PR ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` เกิด flaky บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็น regression จากนั้นแยกทดสอบด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์เวลาแฝงของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env เสริม: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมต์เริ่มต้น: “ตอบด้วยคำเดียว: ok. ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม”

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

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

เอาต์พุตประกอบด้วย `sampleCount`, avg, p50, p95, min/max, การกระจาย exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อรอบการรัน เพื่อให้การจับเวลาและการเก็บโปรไฟล์ใช้ harness เดียวกัน

ข้อตกลงสำหรับเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์ smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นตัวเลือกเสริม จำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบคอนเทนเนอร์เท่านั้น

โฟลว์เริ่มต้นใหม่ทั้งหมดในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## Smoke การนำเข้า QR (Docker)

ตรวจให้แน่ใจว่า runtime helper ของ QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime ของ Docker Node ที่รองรับ (Node 24 เป็นค่าเริ่มต้น, Node 22 เข้ากันได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบการอัปเดตและ plugins](/th/help/testing-updates-plugins)
