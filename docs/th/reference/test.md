---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบภายในเครื่อง (vitest) และควรใช้โหมด force/coverage เมื่อใด
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-02T10:28:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- ชุดทดสอบแบบครบถ้วน (ชุดทดสอบ, แบบสด, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- `pnpm test:force`: ฆ่าโปรเซส Gateway ที่ยังค้างอยู่และยึดพอร์ตควบคุมเริ่มต้น จากนั้นรันชุด Vitest เต็มรูปแบบด้วยพอร์ต Gateway ที่แยกโดดเดี่ยว เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ไว้ในสถานะถูกใช้งาน
- `pnpm test:coverage`: รันชุดยูนิตพร้อมการครอบคลุม V8 (ผ่าน `vitest.unit.config.ts`) นี่คือเกตการครอบคลุมยูนิตของไฟล์ที่ถูกโหลด ไม่ใช่การครอบคลุมทุกไฟล์ทั้งรีโป เกณฑ์คือ 70% สำหรับบรรทัด/ฟังก์ชัน/สเตตเมนต์ และ 55% สำหรับแบรนช์ เนื่องจาก `coverage.all` เป็น false เกตนี้จึงวัดไฟล์ที่ถูกโหลดโดยชุดการครอบคลุมยูนิต แทนที่จะถือว่าไฟล์ซอร์สทุกไฟล์ในเลนที่แยกไว้ไม่ถูกครอบคลุม
- `pnpm test:coverage:changed`: รันการครอบคลุมยูนิตเฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันการทดสอบแบบเปลี่ยนแปลงอัจฉริยะราคาถูก จะรันเป้าหมายที่แม่นยำจากการแก้ไขการทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัดเจน และกราฟอิมพอร์ตภายในเครื่อง การเปลี่ยนแปลงวงกว้าง/คอนฟิก/แพ็กเกจจะถูกข้าม เว้นแต่มันจะแมปไปยังการทดสอบที่แม่นยำ
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันการทดสอบแบบเปลี่ยนแปลงวงกว้างที่ระบุชัดเจน ใช้เมื่อการแก้ไขชุดเครื่องมือทดสอบ/คอนฟิก/แพ็กเกจควรถอยกลับไปใช้พฤติกรรมการทดสอบแบบเปลี่ยนแปลงที่กว้างขึ้นของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกทริกเกอร์โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกตตรวจสอบการเปลี่ยนแปลงอัจฉริยะสำหรับ diff เทียบกับ `origin/main` โดยรัน typecheck, lint และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อเป็นหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลน Vitest ตามขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่ม shard คงที่และขยายเป็นคอนฟิกปลายทางสำหรับการรันแบบขนานภายในเครื่อง กลุ่มส่วนขยายจะขยายเป็นคอนฟิก shard รายส่วนขยายเสมอ แทนที่จะเป็นโปรเซส root-project ขนาดยักษ์หนึ่งโปรเซส
- การรันตัวห่อการทดสอบจบด้วยสรุปสั้น ๆ `[test] passed|failed|skipped ... in ...` บรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดราย shard
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, ฟิกซ์เจอร์คอนฟิก, เวิร์กสเปซ, ไดเรกทอรีเอเจนต์ หรือที่เก็บ auth-profile ที่แยกโดดเดี่ยว
- ตัวช่วย Process E2E: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับโปรเซสของ Vitest ต้องการ Gateway ที่กำลังรัน, env ของ CLI, การจับล็อก และการล้างข้อมูลในที่เดียว
- ตัวช่วย Docker/Bash E2E: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์หลายบ้านสามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละโฟลว์ ผู้เรียกระดับต่ำกว่าสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับสแนปเป็ตเชลล์ในคอนเทนเนอร์ หรือ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์ env ของโฮสต์ที่ source ได้ `--` ก่อน `create` ช่วยไม่ให้รันไทม์ Node รุ่นใหม่กว่าถือว่า `--env-file` เป็นแฟล็กของ Node เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายในคอนเทนเนอร์สำหรับการแก้ entrypoint, การเริ่มต้น OpenAI จำลอง, การเปิด Gateway แบบ foreground/background, โพรบความพร้อม, การส่งออก state env, การ dump ล็อก และการล้างโปรเซส
- การรัน shard แบบเต็ม ส่วนขยาย และ include-pattern อัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันทั้งคอนฟิกภายหลังใช้เวลานั้นเพื่อบาลานซ์ shard ที่ช้าและเร็ว shard ของ CI แบบ include-pattern จะต่อท้ายชื่อ shard เข้ากับคีย์เวลา ซึ่งทำให้เวลาของ shard ที่ถูกกรองยังมองเห็นได้โดยไม่แทนที่ข้อมูลเวลาทั้งคอนฟิก ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อเพิกเฉยต่ออาร์ติแฟกต์เวลาในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้ถูกส่งผ่านเลนเบาเฉพาะที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยเคสรันไทม์หนักไว้บนเลนเดิมของมัน
- ไฟล์ซอร์สที่มีการทดสอบพี่น้องจะแมปไปยังพี่น้องนั้นก่อนถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างกว่า การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟอิมพอร์ตภายในเครื่องเพื่อรันการทดสอบที่อิมพอร์ตมัน แทนที่จะรันทุก shard แบบกว้างเมื่อพาธ dependency แม่นยำ
- `auto-reply` ตอนนี้ยังแยกเป็นคอนฟิกเฉพาะสามรายการ (`core`, `top-level`, `reply`) เพื่อให้ชุดเครื่องมือตอบกลับไม่ครอบงำการทดสอบสถานะ/token/ตัวช่วยระดับบนที่เบากว่า
- คอนฟิก Vitest พื้นฐานตอนนี้มีค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบไม่แยกโดดเดี่ยวที่ใช้ร่วมกันทั่วทั้งคอนฟิกของรีโป
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของส่วนขยาย/Plugin ทั้งหมด Plugin ช่องทางที่หนัก, Plugin เบราว์เซอร์ และ OpenAI รันเป็น shard เฉพาะ ส่วนกลุ่ม Plugin อื่นยังคงถูกรวมเป็นแบตช์ ใช้ `pnpm test extensions/<id>` สำหรับเลน Plugin ที่บันเดิลไว้หนึ่งรายการ
- `pnpm test:perf:imports`: เปิดใช้การรายงานระยะเวลาการอิมพอร์ตและรายละเอียดการอิมพอร์ตของ Vitest ขณะยังใช้การกำหนดเส้นทางเลนตามขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: การทำโปรไฟล์อิมพอร์ตแบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` เบนช์มาร์กพาธโหมดเปลี่ยนแปลงที่ถูกกำหนดเส้นทางเทียบกับการรัน root-project ดั้งเดิมสำหรับ git diff ที่คอมมิตแล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` เบนช์มาร์กชุดการเปลี่ยนแปลงของ worktree ปัจจุบันโดยไม่ต้องคอมมิตก่อน
- `pnpm test:perf:profile:main`: เขียนโปรไฟล์ CPU สำหรับเธรดหลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียนโปรไฟล์ CPU + heap สำหรับยูนิต runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันคอนฟิกปลายทาง Vitest ของชุดเต็มทุกชุดแบบอนุกรม และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อมอาร์ติแฟกต์ JSON/ล็อกรายคอนฟิก Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่มุ่งเน้นประสิทธิภาพ
- การผสานรวม Gateway: เลือกเปิดใช้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันการทดสอบ smoke แบบ end-to-end ของ Gateway (การจับคู่หลายอินสแตนซ์ WS/HTTP/node) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม worker แบบปรับตัวได้ใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้งค่า `OPENCLAW_E2E_VERBOSE=1` สำหรับล็อกแบบละเอียด
- `pnpm test:live`: รันการทดสอบ live ของ provider (minimax/zai) ต้องใช้ API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการข้าม
- `pnpm test:docker:all`: สร้างอิมเมจ live-test ที่ใช้ร่วมกัน แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball สร้าง/นำอิมเมจ runner Node/Git เปล่ากลับมาใช้ รวมถึงอิมเมจเชิงฟังก์ชันที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรันเลน smoke ของ Docker ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่าน scheduler แบบถ่วงน้ำหนัก อิมเมจเปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้าแทนการใช้ซอร์สรีโปที่คัดลอกมา อิมเมจเชิงฟังก์ชัน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันการทำงานของแอปที่สร้างแล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็นตัวแพ็กแพ็กเกจเดี่ยวสำหรับ local/CI และตรวจสอบความถูกต้องของ tarball รวมถึง `dist/postinstall-inventory.json` ก่อน Docker ใช้งาน นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการแผนที่เลือก `node scripts/test-docker-all.mjs --plan-json` ปล่อยแผน CI ที่ scheduler เป็นเจ้าของสำหรับเลนที่เลือก ชนิดอิมเมจ ความต้องการ package/live-image, state scenario และการตรวจ credential โดยไม่สร้างหรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมสล็อตโปรเซสและมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุมพูลส่วนท้ายที่ไวต่อ provider และมีค่าเริ่มต้นเป็น 10 เพดานเลนหนักมีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; เพดาน provider มีค่าเริ่มต้นเป็นหนึ่งเลนหนักต่อ provider ผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ที่ใหญ่กว่า หากเลนหนึ่งเกินน้ำหนักที่มีผลหรือเพดานทรัพยากรบนโฮสต์ที่มี parallelism ต่ำ มันยังสามารถเริ่มจากพูลว่างและจะรันเดี่ยวจนกว่าจะคืนความจุ การเริ่มเลนถูกหน่วงเหลื่อมกัน 2 วินาทีตามค่าเริ่มต้นเพื่อหลีกเลี่ยงพายุการ create ของ Docker daemon ภายในเครื่อง; แทนที่ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner preflight Docker ตามค่าเริ่มต้น ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างเก่า ส่งสถานะเลนที่ทำงานอยู่ทุก 30 วินาที แชร์แคชเครื่องมือ CLI ของ provider ระหว่างเลนที่เข้ากันได้ ลองซ้ำความล้มเหลวของ live-provider ชั่วคราวหนึ่งครั้งตามค่าเริ่มต้น (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บเวลาเลนไว้ที่ `.artifacts/docker-tests/lane-timings.json` สำหรับการเรียงลำดับจากยาวที่สุดก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของเลนโดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการนำเวลากลับมาใช้ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias ของแพ็กเกจคือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวมเลน live หลักและส่วนท้ายเป็นพูลเดียวแบบยาวที่สุดก่อน เพื่อให้ bucket ของ provider สามารถบรรจุงาน Claude, Codex และ Gemini เข้าด้วยกัน runner จะหยุดจัดตารางเลนในพูลใหม่หลังความล้มเหลวครั้งแรก เว้นแต่ตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี timeout สำรอง 120 นาทีที่แทนที่ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail ที่เลือกใช้เพดานรายเลนที่เข้มงวดกว่า คำสั่งตั้งค่า Docker ของ backend CLI มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) ล็อกรายเลน, `summary.json`, `failures.json` และเวลา phase ถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่งรันซ้ำแบบกำหนดเป้าหมายราคาถูก
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ E2E ซอร์สที่หนุนด้วย Chromium เริ่ม raw CDP พร้อม Gateway ที่แยกโดดเดี่ยว รัน `browser doctor --deep` และตรวจยืนยันว่า snapshot บทบาทของ CDP รวม URL ของลิงก์, clickable ที่ถูกยกระดับด้วยเคอร์เซอร์, iframe refs และ metadata ของเฟรม
- โพรบ Docker แบบ live ของ backend CLI สามารถรันเป็นเลนแบบมุ่งเน้นได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่สอดคล้องกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI แบบ Dockerized, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจ `/api/models` จากนั้นรันแชตที่ถูกพร็อกซีจริงผ่าน `/api/chat/completions` ต้องใช้คีย์โมเดล live ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`) ดึงอิมเมจ Open WebUI ภายนอก และไม่ได้คาดหวังว่าจะเสถียรใน CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seed ไว้และคอนเทนเนอร์ไคลเอนต์ที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจยืนยันการค้นพบบทสนทนาที่ถูกกำหนดเส้นทาง การอ่านข้อความถอดความ metadata ของไฟล์แนบ พฤติกรรมคิวอีเวนต์ live การกำหนดเส้นทางการส่งออก และการแจ้งเตือนช่องทาง + permission แบบ Claude ผ่านบริดจ์ stdio จริง แอสเซิร์ตการแจ้งเตือนของ Claude อ่านเฟรม MCP stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่บริดจ์ปล่อยออกมาจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty, รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่ต้องโต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางจริง จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่าเอเจนต์, การกำหนดค่าช่องทาง, รายการอนุญาต Plugin, ไฟล์ workspace/session, สถานะ dependency ของ Plugin รุ่นเก่าที่ค้างอยู่, การเริ่มทำงาน และสถานะ RPC ยังคงอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางจริง, กำหนดค่า baseline นั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้, อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ของ OpenClaw ที่แพ็กแล้ว, รัน doctor แบบไม่ต้องโต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า intents ที่กำหนดค่าไว้, ไฟล์ workspace/session, config ของ Plugin ที่ค้างอยู่และสถานะ dependency รุ่นเก่า, การเริ่มทำงาน, `/healthz`, `/readyz` และสถานะ RPC ยังคงอยู่รอดหรือซ่อมแซมได้สะอาด Override baseline เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขยายเมทริกซ์แบบระบุชัดด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` หรือเพิ่ม fixture ของสถานการณ์ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance แสดงค่าเหล่านี้เป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- `pnpm test:docker:update-migration`: รัน harness ของ published-upgrade survivor ในสถานการณ์ `plugin-deps-cleanup` ที่เน้นการล้างข้อมูล โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น workflow `Update Migration` แยกต่างหากจะขยาย lane นี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้แพ็กเกจ stable ที่เผยแพร่ทุกตัวตั้งแต่ `.23` เป็นต้นไปอัปเดตเป็น candidate และพิสูจน์การล้าง dependency ของ Plugin ที่กำหนดค่าไว้ภายนอก Full Release CI
- `pnpm test:docker:plugins`: รัน smoke สำหรับการติดตั้ง/อัปเดตสำหรับ local path, `file:`, แพ็กเกจ npm registry ที่มี dependency แบบ hoisted, git moving refs, fixture ของ ClawHub, การอัปเดต marketplace และการเปิดใช้/ตรวจสอบ Claude-bundle

## เกต PR ภายในเครื่อง

สำหรับการตรวจสอบ land/gate ของ PR ภายในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` เกิด flake บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็น regression จากนั้นแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์ความหน่วงของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env ที่เลือกได้: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
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

เอาต์พุตประกอบด้วย `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจาย exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 ต่อการรัน เพื่อให้การจับเวลาและการเก็บโปรไฟล์ใช้ harness เดียวกัน

แบบแผนเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ทิแฟกต์ smoke แบบเจาะจงที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ทิแฟกต์ชุดเต็มที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## E2E การเริ่มใช้งาน (Docker)

Docker เป็นทางเลือก จำเป็นเฉพาะสำหรับการทดสอบ smoke ของการเริ่มใช้งานแบบ containerized

โฟลว์ cold-start แบบเต็มในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## Smoke การนำเข้า QR (Docker)

ตรวจสอบให้แน่ใจว่า helper ของ QR runtime ที่ดูแลอยู่โหลดได้ภายใต้ Docker Node runtime ที่รองรับ (ค่าเริ่มต้น Node 24, เข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)
