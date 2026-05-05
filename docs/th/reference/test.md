---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเวลาที่ควรใช้โหมดบังคับ/ความครอบคลุมการทดสอบ
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-05T06:18:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือการทดสอบครบถ้วน (ชุดทดสอบ, แบบสด, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- `pnpm test:force`: ยุติโปรเซส Gateway ที่ยังค้างอยู่ซึ่งยึดพอร์ตควบคุมเริ่มต้นไว้ จากนั้นรันชุดทดสอบ Vitest เต็มรูปแบบด้วยพอร์ต Gateway แบบแยกต่างหาก เพื่อให้การทดสอบเซิร์ฟเวอร์ไม่ชนกับอินสแตนซ์ที่กำลังทำงานอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ไว้ในสถานะถูกใช้งาน
- `pnpm test:coverage`: รันชุดทดสอบหน่วยพร้อมความครอบคลุม V8 (ผ่าน `vitest.unit.config.ts`) นี่เป็นเกตความครอบคลุมของหน่วยสำหรับไฟล์ที่ถูกโหลด ไม่ใช่ความครอบคลุมทุกไฟล์ทั้ง repo เกณฑ์คือ 70% สำหรับบรรทัด/ฟังก์ชัน/คำสั่ง และ 55% สำหรับสาขา เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดไฟล์ที่ถูกโหลดโดยชุดความครอบคลุมของหน่วย แทนที่จะถือว่าไฟล์ซอร์สทุกไฟล์ในเลนที่แยกไว้ไม่มีความครอบคลุม
- `pnpm test:coverage:changed`: รันความครอบคลุมของหน่วยเฉพาะไฟล์ที่เปลี่ยนแปลงตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันทดสอบแบบเปลี่ยนแปลงอัจฉริยะราคาถูก รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัดเจน และกราฟอิมพอร์ตในเครื่อง การเปลี่ยนแปลงแบบกว้าง/คอนฟิก/แพ็กเกจจะถูกข้าม เว้นแต่ว่าจะแมปไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันทดสอบแบบเปลี่ยนแปลงกว้างที่ระบุชัดเจน ใช้เมื่อการแก้ไขฮาร์เนสทดสอบ/คอนฟิก/แพ็กเกจควรถอยกลับไปใช้พฤติกรรมการทดสอบแบบเปลี่ยนแปลงที่กว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกทริกเกอร์โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกตตรวจสอบแบบเปลี่ยนแปลงอัจฉริยะสำหรับ diff เทียบกับ `origin/main` คำสั่งนี้รัน typecheck, lint และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อเป็นหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลน Vitest ตามขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่มชาร์ดคงที่และขยายเป็นคอนฟิกใบสำหรับการทำงานแบบขนานในเครื่อง กลุ่มส่วนขยายจะขยายเป็นคอนฟิกชาร์ดรายส่วนขยายเสมอ แทนที่จะเป็นโปรเซสโปรเจกต์รากขนาดใหญ่ตัวเดียว
- การรันตัวครอบทดสอบจะจบด้วยสรุปสั้น ๆ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดต่อชาร์ด
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, ฟิกซ์เจอร์คอนฟิก, เวิร์กสเปซ, ไดเรกทอรีเอเจนต์ หรือที่เก็บโปรไฟล์การยืนยันตัวตนที่แยกต่างหาก
- ตัวช่วย E2E ระดับโปรเซส: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่กำลังทำงาน สภาพแวดล้อม CLI การเก็บล็อก และการล้างข้อมูลในที่เดียว
- ตัวช่วย E2E Docker/Bash: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์หลายโฮมสามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละโฟลว์ ผู้เรียกระดับต่ำกว่าสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับสแนปเป็ตเชลล์ในคอนเทนเนอร์ หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ของโฮสต์ที่ source ได้ `--` ก่อน `create` ช่วยป้องกันไม่ให้รันไทม์ Node รุ่นใหม่ตีความ `--env-file` เป็นแฟล็กของ Node เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายในคอนเทนเนอร์เพื่อใช้การแก้ตำแหน่ง entrypoint การเริ่มต้น OpenAI จำลอง การเปิด Gateway แบบ foreground/background โพรบความพร้อม การส่งออก env สถานะ การ dump ล็อก และการล้างโปรเซส
- การรันชาร์ดแบบเต็ม แบบส่วนขยาย และแบบแพตเทิร์นรวม จะอัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันทั้งคอนฟิกในภายหลังจะใช้เวลานั้นเพื่อบาลานซ์ชาร์ดที่ช้าและเร็ว ชาร์ด CI แบบแพตเทิร์นรวมจะเติมชื่อชาร์ดต่อท้ายคีย์เวลา ทำให้เวลาชาร์ดที่ถูกกรองยังมองเห็นได้โดยไม่แทนที่ข้อมูลเวลาทั้งคอนฟิก ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact เวลาในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกตอนนี้ถูกส่งผ่านเลนเบาเฉพาะทางที่คงไว้เพียง `test/setup.ts` โดยปล่อยกรณีที่หนักด้านรันไทม์ไว้บนเลนเดิม
- ไฟล์ซอร์สที่มีการทดสอบพี่น้องจะแมปไปยังไฟล์พี่น้องนั้นก่อนถอยกลับไปยัง glob ไดเรกทอรีที่กว้างกว่า การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟอิมพอร์ตในเครื่องเพื่อรันการทดสอบที่อิมพอร์ต แทนที่จะรันทุกชาร์ดแบบกว้างเมื่อเส้นทาง dependency แม่นยำ
- `auto-reply` ตอนนี้แยกเป็นคอนฟิกเฉพาะสามรายการด้วย (`core`, `top-level`, `reply`) เพื่อให้ฮาร์เนสตอบกลับไม่ครอบงำการทดสอบสถานะ/โทเคน/ตัวช่วยระดับบนที่เบากว่า
- คอนฟิก Vitest ฐานตอนนี้ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` โดยเปิดใช้งานตัวรันแบบไม่แยกที่ใช้ร่วมกันทั่วทั้งคอนฟิกของ repo
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รันชาร์ดส่วนขยาย/Plugin ทั้งหมด Plugin ช่องทางที่หนัก, Plugin เบราว์เซอร์ และ OpenAI รันเป็นชาร์ดเฉพาะ ส่วนกลุ่ม Plugin อื่นยังคงถูกรวมเป็นชุด ใช้ `pnpm test extensions/<id>` สำหรับเลน Plugin ที่ bundled รายเดียว
- `pnpm test:perf:imports`: เปิดใช้งานการรายงานระยะเวลาอิมพอร์ตและรายละเอียดอิมพอร์ตของ Vitest ขณะยังใช้การกำหนดเส้นทางเลนตามขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: การทำโปรไฟล์อิมพอร์ตแบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนแปลงตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` เบนช์มาร์กเส้นทางโหมดเปลี่ยนแปลงที่ถูกกำหนดเส้นทางเทียบกับการรันโปรเจกต์รากแบบ native สำหรับ git diff ที่ commit แล้วเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` เบนช์มาร์กชุดการเปลี่ยนแปลงของ worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียนโปรไฟล์ CPU สำหรับเธรดหลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียนโปรไฟล์ CPU + heap สำหรับตัวรันหน่วย (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันคอนฟิกใบของ Vitest ทุกตัวในชุดเต็มแบบอนุกรม และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/ล็อกต่อคอนฟิก Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่มุ่งเน้นประสิทธิภาพ
- การผสานรวม Gateway: เลือกใช้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันการทดสอบ smoke end-to-end ของ Gateway (การจับคู่หลายอินสแตนซ์ WS/HTTP/node) ค่าเริ่มต้นคือ `threads` + `isolate: false` พร้อม workers แบบปรับตัวใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้งค่า `OPENCLAW_E2E_VERBOSE=1` สำหรับล็อกแบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของผู้ให้บริการ (minimax/zai) ต้องใช้ API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะผู้ให้บริการ) เพื่อเลิกข้าม
- `pnpm test:docker:all`: สร้างอิมเมจ live-test ที่ใช้ร่วมกัน แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball สร้าง/ใช้ซ้ำอิมเมจ runner แบบ Node/Git เปล่า และอิมเมจใช้งานที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรันเลน smoke ของ Docker ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่านตัวจัดตารางแบบถ่วงน้ำหนัก อิมเมจเปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้น mount tarball ที่สร้างไว้ล่วงหน้าแทนการใช้ซอร์ส repo ที่คัดลอกมา อิมเมจใช้งาน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันการทำงานของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็นตัวแพ็กแพ็กเกจ local/CI เพียงตัวเดียว และตรวจสอบ tarball พร้อม `dist/postinstall-inventory.json` ก่อนที่ Docker จะใช้งาน นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิกตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการแผนที่เลือก `node scripts/test-docker-all.mjs --plan-json` ส่งออกแผน CI ที่ตัวจัดตารางเป็นเจ้าของสำหรับเลนที่เลือก ชนิดอิมเมจ ความต้องการ package/live-image สถานการณ์สถานะ และการตรวจสอบ credential โดยไม่ build หรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมสล็อตโปรเซสและมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุมพูลท้ายที่อ่อนไหวต่อผู้ให้บริการและมีค่าเริ่มต้นเป็น 10 ขีดจำกัดเลนหนักมีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ขีดจำกัดผู้ให้บริการมีค่าเริ่มต้นเป็นหนึ่งเลนหนักต่อผู้ให้บริการผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ที่ใหญ่กว่า หากเลนหนึ่งเกินขีดจำกัดน้ำหนักหรือทรัพยากรที่มีผลบนโฮสต์ที่มี parallelism ต่ำ เลนนั้นยังสามารถเริ่มจากพูลว่างและจะรันลำพังจนกว่าจะคืน capacity การเริ่มเลนถูกหน่วงห่างกัน 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยง create storm ของ Docker daemon ในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ตัวรันทำ preflight Docker ตามค่าเริ่มต้น ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ ส่งออกสถานะเลนที่ใช้งานทุก 30 วินาที แชร์แคชเครื่องมือ CLI ของผู้ให้บริการระหว่างเลนที่เข้ากันได้ retry ความล้มเหลว transient ของ live-provider หนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บเวลาเลนใน `.artifacts/docker-tests/lane-timings.json` เพื่อจัดลำดับแบบนานที่สุดก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของเลนโดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้เวลาซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias ของแพ็กเกจคือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวมเลน live หลักและท้ายเข้าพูลนานที่สุดก่อนหนึ่งพูล เพื่อให้ bucket ของผู้ให้บริการแพ็กงาน Claude, Codex และ Gemini ร่วมกันได้ ตัวรันหยุดจัดตารางเลน pooled ใหม่หลังความล้มเหลวครั้งแรก เว้นแต่ว่าจะตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี timeout สำรอง 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail ที่เลือกใช้ขีดจำกัดต่อเลนที่เข้มงวดกว่า คำสั่งตั้งค่า Docker ของ backend CLI มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) ล็อกต่อเลน, `summary.json`, `failures.json` และเวลาเฟสถูกเขียนไว้ภายใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงราคาถูก
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ E2E ซอร์สที่มี Chromium หนุนหลัง เริ่ม CDP ดิบพร้อม Gateway ที่แยกต่างหาก รัน `browser doctor --deep` และตรวจสอบว่า snapshot บทบาท CDP มี URL ของลิงก์ clickable ที่เลื่อนระดับด้วยเคอร์เซอร์ iframe refs และ metadata ของเฟรม
- โพรบ Docker live ของ backend CLI สามารถรันเป็นเลนเฉพาะจุดได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่สอดคล้องกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI ใน Docker, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models` จากนั้นรันแชตที่ถูก proxy จริงผ่าน `/api/chat/completions` ต้องใช้คีย์โมเดล live ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`) ดึงอิมเมจ Open WebUI ภายนอก และไม่คาดว่าจะเสถียรใน CI เหมือนชุดทดสอบ unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seed ไว้และคอนเทนเนอร์ client ตัวที่สองที่ spawn `openclaw mcp serve` จากนั้นตรวจสอบการค้นพบการสนทนาที่ถูก route การอ่าน transcript metadata ของ attachment พฤติกรรมคิว event สด การ route การส่งขาออก และการแจ้งเตือนช่องทาง + permission แบบ Claude ผ่าน stdio bridge จริง assertion การแจ้งเตือนของ Claude อ่านเฟรม MCP stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ส่งออกจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้งไฟล์ tarball ของ OpenClaw ที่แพ็กไว้ทับ fixture ผู้ใช้เก่าแบบสกปรก รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางแบบสด จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่าเอเจนต์ การกำหนดค่าช่องทาง allowlists ของ Plugin ไฟล์ workspace/session สถานะ dependency ของ Plugin รุ่นเก่าที่ค้างอยู่ การเริ่มต้น และสถานะ RPC ยังคงอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` เป็นค่าเริ่มต้น เติมไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางแบบสด กำหนดค่า baseline นั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้ อัปเดตการติดตั้งที่เผยแพร่นั้นไปยังไฟล์ tarball ของ OpenClaw ที่แพ็กไว้ รัน doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า intents ที่กำหนดค่าไว้ ไฟล์ workspace/session การกำหนดค่า Plugin ที่ค้างอยู่และสถานะ dependency รุ่นเก่า การเริ่มต้น `/healthz`, `/readyz` และสถานะ RPC ยังคงอยู่รอดหรือซ่อมแซมได้อย่างสะอาด แทนที่ baseline เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขยาย matrix ภายในเครื่องแบบเจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` หรือเพิ่ม scenario fixtures ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` เพื่อตรวจสอบว่า Plugin ภายนอกของ OpenClaw ที่กำหนดค่าไว้ติดตั้งโดยอัตโนมัติระหว่างการอัปเกรด และ `stale-source-plugin-shadow` เพื่อป้องกันไม่ให้เงา Plugin แบบมีเฉพาะซอร์สทำให้การเริ่มต้นเสียหาย Package Acceptance แสดงสิ่งเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` และ resolve โทเค็น meta baseline เช่น `last-stable-4` หรือ `all-since-2026.4.23` ก่อนส่ง package specs ที่เจาะจงไปยัง Docker lanes
- `pnpm test:docker:update-migration`: รัน harness ของ published-upgrade survivor ใน scenario `plugin-deps-cleanup` ที่เน้นการ cleanup อย่างหนัก โดยเริ่มที่ `openclaw@2026.4.23` เป็นค่าเริ่มต้น workflow `Update Migration` ที่แยกออกมาขยาย lane นี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้ทุกแพ็กเกจ stable ที่เผยแพร่ตั้งแต่ `.23` เป็นต้นไปอัปเดตไปยัง candidate และพิสูจน์การ cleanup dependency ของ configured-plugin นอก Full Release CI
- `pnpm test:docker:plugins`: รัน smoke สำหรับการติดตั้ง/อัปเดตสำหรับ local path, `file:`, แพ็กเกจ npm registry ที่มี dependencies แบบ hoisted, git moving refs, ClawHub fixtures, marketplace updates และการเปิดใช้/ตรวจสอบ Claude-bundle

## เกต PR ในเครื่อง

สำหรับการตรวจสอบการ land/เกต PR ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` มีอาการไม่เสถียรบนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็นรีเกรสชัน จากนั้นแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เกณฑ์วัดเวลาแฝงของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

วิธีใช้:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env ไม่บังคับ: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: “ตอบด้วยคำเดียว: ok. ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม”

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax ค่ามัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus ค่ามัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

## เกณฑ์วัดการเริ่มต้น CLI

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

ผลลัพธ์มี `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจายของรหัสออก/สัญญาณ และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการบันทึกโปรไฟล์ใช้ชุดทดสอบเดียวกัน

ข้อตกลงของผลลัพธ์ที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์ smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรชฟิกซ์เจอร์ baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

ฟิกซ์เจอร์ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับฟิกซ์เจอร์ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นตัวเลือกเสริม ส่วนนี้จำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบคอนเทนเนอร์เท่านั้น

โฟลว์ cold-start แบบเต็มในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## การทดสอบ smoke การนำเข้า QR (Docker)

ตรวจสอบให้แน่ใจว่าตัวช่วยรันไทม์ QR ที่ดูแลอยู่โหลดได้ภายใต้รันไทม์ Docker Node ที่รองรับ (Node 24 เป็นค่าเริ่มต้น, Node 22 ใช้งานร่วมกันได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)
