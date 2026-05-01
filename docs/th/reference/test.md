---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-01T10:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07ca45e6c21016ad403ea010bd2e5460acc059c004138e04a714a3506f0e5cda
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือทดสอบครบชุด (ชุดทดสอบ, การทดสอบจริง, Docker): [การทดสอบ](/th/help/testing)

- `pnpm test:force`: ฆ่าโปรเซส Gateway ที่ยังค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้น จากนั้นรันชุดทดสอบ Vitest เต็มรูปแบบด้วยพอร์ต Gateway แบบแยก เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ให้ถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุดทดสอบยูนิตพร้อมความครอบคลุม V8 (ผ่าน `vitest.unit.config.ts`) นี่คือเกตความครอบคลุมยูนิตของไฟล์ที่ถูกโหลด ไม่ใช่ความครอบคลุมทุกไฟล์ทั้งรีโป เกณฑ์คือ 70% สำหรับบรรทัด/ฟังก์ชัน/คำสั่ง และ 55% สำหรับสาขา เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดไฟล์ที่ชุดทดสอบความครอบคลุมยูนิตโหลด แทนที่จะถือว่าไฟล์ซอร์สทุกไฟล์ในเลนที่แยกไว้ไม่มีความครอบคลุม
- `pnpm test:coverage:changed`: รันความครอบคลุมยูนิตเฉพาะไฟล์ที่เปลี่ยนไปตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันการทดสอบที่เปลี่ยนแบบอัจฉริยะราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัด และกราฟการนำเข้าในเครื่อง การเปลี่ยนแปลงกว้างๆ ในคอนฟิก/แพ็กเกจจะถูกข้าม เว้นแต่จะแมปไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันการทดสอบที่เปลี่ยนแบบกว้างอย่างชัดเจน ใช้เมื่อการแก้ไขชุดเครื่องมือทดสอบ/คอนฟิก/แพ็กเกจควรถอยกลับไปใช้พฤติกรรมการทดสอบไฟล์ที่เปลี่ยนแบบกว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกเรียกโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกตตรวจสอบการเปลี่ยนแปลงอัจฉริยะสำหรับ diff เทียบกับ `origin/main` โดยรัน typecheck, lint และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` แบบระบุชัดสำหรับหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดผ่านเลน Vitest ที่มีขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่มชาร์ดคงที่และขยายเป็นคอนฟิกปลายทางสำหรับการรันขนานในเครื่อง กลุ่มส่วนขยายจะขยายเป็นคอนฟิกชาร์ดต่อส่วนขยายเสมอ แทนที่จะเป็นโปรเซสรูทโปรเจกต์ขนาดใหญ่ตัวเดียว
- การรัน wrapper ทดสอบจบด้วยสรุปสั้นๆ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดต่อชาร์ด
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture คอนฟิก, workspace, ไดเรกทอรี agent หรือ auth-profile store แบบแยก
- ตัวช่วย E2E ของโปรเซส: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซส Vitest ต้องการ Gateway ที่กำลังรัน env ของ CLI การจับ log และการล้างทรัพยากรในที่เดียว
- ตัวช่วย E2E ของ Docker/Bash: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์หลาย home สามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละโฟลว์ได้ ผู้เรียกระดับล่างสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับ snippet shell ในคอนเทนเนอร์ หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ฝั่งโฮสต์ที่ source ได้ เครื่องหมาย `--` ก่อน `create` ป้องกันไม่ให้ runtime Node รุ่นใหม่ตีความ `--env-file` เป็นแฟล็กของ Node เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายในคอนเทนเนอร์สำหรับการ resolve entrypoint การเริ่มต้น OpenAI จำลอง การเปิด Gateway แบบ foreground/background โพรบความพร้อม การ export env สถานะ การ dump log และการล้างโปรเซส
- การรันชาร์ดแบบเต็ม แบบส่วนขยาย และแบบ include-pattern อัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรัน whole-config ภายหลังใช้เวลานั้นเพื่อถ่วงดุลชาร์ดที่ช้าและเร็ว ชาร์ด CI แบบ include-pattern เติมชื่อชาร์ดต่อท้ายคีย์เวลา ซึ่งทำให้เวลาแบบชาร์ดที่กรองแล้วยังคงมองเห็นได้โดยไม่แทนที่ข้อมูลเวลา whole-config ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่สนใจอาร์ติแฟกต์เวลาในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ถูกส่งผ่านเลนเบาเฉพาะที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยเคส runtime-heavy ไว้บนเลนเดิม
- ไฟล์ซอร์สที่มีการทดสอบพี่น้องจะแมปไปยังไฟล์พี่น้องนั้นก่อนถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างขึ้น การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟการนำเข้าในเครื่องเพื่อรันการทดสอบที่นำเข้าไฟล์นั้น แทนที่จะรันทุกชาร์ดแบบกว้างเมื่อเส้นทาง dependency แม่นยำ
- ตอนนี้ `auto-reply` ยังแยกเป็นสามคอนฟิกเฉพาะ (`core`, `top-level`, `reply`) เพื่อให้ชุดเครื่องมือ reply ไม่ครอบงำการทดสอบสถานะ/token/helper ระดับบนที่เบากว่า
- คอนฟิก Vitest ฐานตอนนี้มีค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` โดยเปิดใช้ runner แบบไม่แยกที่ใช้ร่วมกันทั่วคอนฟิกของรีโป
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รันชาร์ดส่วนขยาย/Plugin ทั้งหมด Plugin ช่องทางขนาดหนัก Plugin เบราว์เซอร์ และ OpenAI รันเป็นชาร์ดเฉพาะ ส่วนกลุ่ม Plugin อื่นยังคง batch อยู่ ใช้ `pnpm test extensions/<id>` สำหรับเลน Plugin ที่บันเดิลไว้หนึ่งตัว
- `pnpm test:perf:imports`: เปิดใช้การรายงานระยะเวลานำเข้า + รายละเอียดการนำเข้า ของ Vitest ขณะที่ยังใช้การกำหนดเส้นทางเลนแบบมีขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัด
- `pnpm test:perf:imports:changed`: การทำโปรไฟล์การนำเข้าแบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark เส้นทาง changed-mode ที่ถูกกำหนดเส้นทางเทียบกับการรัน root-project ดั้งเดิมสำหรับ git diff ที่ commit แล้วเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` benchmark ชุดการเปลี่ยนแปลงของ worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียนโปรไฟล์ CPU สำหรับ thread หลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียนโปรไฟล์ CPU + heap สำหรับ runner ยูนิต (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันคอนฟิกปลายทาง Vitest ของชุดเต็มทุกตัวแบบ serial และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อมอาร์ติแฟกต์ JSON/log ต่อคอนฟิก Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้น performance
- การผสานรวม Gateway: เลือกใช้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน smoke test end-to-end ของ Gateway (การจับคู่ WS/HTTP/node หลายอินสแตนซ์) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม worker แบบปรับตัวได้ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับ log แบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องใช้ API key และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:all`: สร้างอิมเมจ live-test ที่ใช้ร่วมกัน แพ็ก OpenClaw หนึ่งครั้งเป็น tarball npm สร้าง/ใช้ซ้ำอิมเมจ runner Node/Git เปล่า พร้อมอิมเมจ functional ที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรันเลน smoke ของ Docker ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน scheduler แบบมีน้ำหนัก อิมเมจเปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้น mount tarball ที่สร้างไว้แล้วแทนการใช้ซอร์สรีโปที่คัดลอกมา อิมเมจ functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็น packer แพ็กเกจแบบเดียวสำหรับ local/CI และตรวจสอบ tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะนำไปใช้ คำจำกัดความเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการแผนที่เลือก `node scripts/test-docker-all.mjs --plan-json` ปล่อยแผน CI ที่ scheduler เป็นเจ้าของสำหรับเลนที่เลือก ชนิดอิมเมจ ความต้องการ package/live-image สถานการณ์สถานะ และการตรวจสอบ credential โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมสล็อตโปรเซสและมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุม pool ส่วนท้ายที่ไวต่อ provider และมีค่าเริ่มต้นเป็น 10 เพดานเลนหนักมีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; เพดาน provider มีค่าเริ่มต้นเป็นหนึ่งเลนหนักต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ที่ใหญ่กว่า หากเลนหนึ่งเกินเพดานน้ำหนักหรือทรัพยากรที่มีผลบนโฮสต์ที่มี parallelism ต่ำ เลนนั้นยังเริ่มจาก pool ว่างได้และจะรันเดี่ยวจนกว่าจะคืน capacity การเริ่มเลนถูกหน่วงห่างกัน 2 วินาทีเป็นค่าเริ่มต้นเพื่อหลีกเลี่ยง create storm ของ Docker daemon ในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner ทำ preflight Docker ตามค่าเริ่มต้น ล้างคอนเทนเนอร์ E2E ของ OpenClaw ที่ค้างอยู่ ปล่อยสถานะเลนที่กำลังทำงานทุก 30 วินาที แชร์ cache เครื่องมือ CLI ของ provider ระหว่างเลนที่เข้ากันได้ retry ความล้มเหลวชั่วคราวของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บเวลาเลนไว้ใน `.artifacts/docker-tests/lane-timings.json` เพื่อเรียงจากยาวสุดก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ lane manifest โดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้เวลาซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias ของแพ็กเกจคือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวมเลน live หลักและส่วนท้ายเป็น pool เดียวที่เรียงจากยาวสุดก่อน เพื่อให้ bucket ของ provider pack งาน Claude, Codex และ Gemini เข้าด้วยกันได้ runner หยุด schedule เลน pooled ใหม่หลังความล้มเหลวครั้งแรก เว้นแต่ตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี timeout สำรอง 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail ที่เลือกใช้เพดานต่อเลนที่เข้มกว่า คำสั่งตั้งค่า Docker ของ backend CLI มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) log ต่อเลน, `summary.json`, `failures.json` และเวลาเฟสถูกเขียนไว้ภายใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบกำหนดเป้าหมายราคาถูก
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ E2E ซอร์สที่มี Chromium เป็น backend เริ่ม raw CDP พร้อม Gateway แบบแยก รัน `browser doctor --deep` และตรวจสอบว่าสแนปชอตบทบาท CDP มี URL ของลิงก์ clickable ที่ถูกโปรโมตจาก cursor, iframe refs และ metadata ของเฟรม
- โพรบ Docker แบบ live ของ backend CLI สามารถรันเป็นเลนเฉพาะได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่ตรงกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI ใน Docker, sign in ผ่าน Open WebUI, ตรวจ `/api/models` จากนั้นรันแชตจริงที่ proxied ผ่าน `/api/chat/completions` ต้องใช้คีย์โมเดล live ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`) ดึงอิมเมจ Open WebUI ภายนอก และไม่ได้คาดหวังให้เสถียรใน CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seed แล้วและคอนเทนเนอร์ client ที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจสอบการค้นพบการสนทนาที่ถูก route, การอ่าน transcript, metadata ของ attachment, พฤติกรรมคิว event สด, การ route การส่งออก และการแจ้งเตือนช่องทาง + permission แบบ Claude ผ่านสะพาน stdio จริง assertion การแจ้งเตือน Claude อ่านเฟรม MCP ของ stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่สะพานปล่อยออกมาจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง tarball ของ OpenClaw ที่แพ็กไว้ทับ fixture ผู้ใช้เก่าที่มีสถานะไม่สะอาด รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือคีย์ช่องทางแบบใช้งานจริง จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่าเอเจนต์ การกำหนดค่าช่องทาง รายการอนุญาตของ Plugin ไฟล์เวิร์กสเปซ/เซสชัน สถานะ runtime-deps ของ Plugin ที่ค้างเก่า การเริ่มต้น และสถานะ RPC ยังคงอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น เติมไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มีคีย์ผู้ให้บริการหรือคีย์ช่องทางแบบใช้งานจริง กำหนดค่าฐานตั้งต้นนั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้ อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ของ OpenClaw ที่แพ็กไว้ รัน doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า intent ที่กำหนดค่าไว้ ไฟล์เวิร์กสเปซ/เซสชัน สถานะ config/runtime-deps ของ Plugin ที่ค้างเก่า การเริ่มต้น `/healthz`, `/readyz` และสถานะ RPC ยังคงอยู่รอดหรือซ่อมแซมได้อย่างเรียบร้อย แทนที่ฐานตั้งต้นหนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขยายเมทริกซ์แบบระบุแน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` หรือเพิ่ม fixture สถานการณ์ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`

## เกต PR ภายในเครื่อง

สำหรับการตรวจสอบ PR ภายในเครื่องก่อนรวม/เกต ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` ล้มเหลวแบบไม่คงที่บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็นการถดถอย จากนั้นแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์มาร์กเวลาแฝงของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env ทางเลือก: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: “ตอบด้วยคำเดียว: ok. ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม”

การรันล่าสุด (2025-12-31, 20 การรัน):

- minimax ค่ามัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus ค่ามัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

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

พรีเซ็ต:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสองพรีเซ็ต

เอาต์พุตมี `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจายรหัสออก/สัญญาณ และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการเก็บโปรไฟล์ใช้ฮาร์เนสเดียวกัน

รูปแบบเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์ smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรชฟิกซ์เจอร์ baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

ฟิกซ์เจอร์ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับฟิกซ์เจอร์ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก ส่วนนี้จำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบคอนเทนเนอร์เท่านั้น

โฟลว์ cold-start เต็มรูปแบบในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับวิซาร์ดแบบอินเทอร์แอคทีฟผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## smoke การนำเข้า QR (Docker)

รับประกันว่า runtime helper ของ QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (Node 24 เป็นค่าเริ่มต้น, เข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบ live](/th/help/testing-live)
