---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-10T19:56:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือการทดสอบฉบับเต็ม (ชุดทดสอบ, live, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของแพ็กเกจอัปเดตและ Plugin: [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

- `pnpm test:force`: หยุดกระบวนการ Gateway ที่ค้างอยู่และกำลังยึดพอร์ตควบคุมเริ่มต้น จากนั้นรันชุดทดสอบ Vitest ทั้งหมดด้วยพอร์ต Gateway ที่แยกไว้ เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังทำงานอยู่ ใช้คำสั่งนี้เมื่อการรัน Gateway ก่อนหน้าทิ้งพอร์ต 18789 ให้ถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุดทดสอบหน่วยพร้อมความครอบคลุมของ V8 (ผ่าน `vitest.unit.config.ts`) นี่เป็นเกตความครอบคลุมของเลนหน่วยเริ่มต้น ไม่ใช่ความครอบคลุมทั้งรีโพของทุกไฟล์ ค่าเกณฑ์คือ 70% สำหรับบรรทัด/ฟังก์ชัน/คำสั่ง และ 55% สำหรับแขนง เนื่องจาก `coverage.all` เป็น false และเลนเริ่มต้นจำกัดขอบเขตไฟล์ที่นับความครอบคลุมไว้ที่การทดสอบหน่วยแบบไม่เร็วซึ่งมีไฟล์ซอร์สคู่กัน เกตนี้จึงวัดซอร์สที่เลนนี้เป็นเจ้าของ แทนที่จะวัดทุกอิมพอร์ตสืบทอดที่บังเอิญโหลดขึ้นมา
- `pnpm test:coverage:changed`: รันความครอบคลุมของการทดสอบหน่วยเฉพาะไฟล์ที่เปลี่ยนไปตั้งแต่ `origin/main`
- `pnpm test:changed`: การรันการทดสอบแบบเปลี่ยนแปลงที่ฉลาดและเบา คำสั่งนี้รันเป้าหมายที่แม่นยำจากการแก้ไขไฟล์ทดสอบโดยตรง ไฟล์ `*.test.ts` คู่กัน การแมปซอร์สที่ระบุชัดเจน และกราฟอิมพอร์ตในเครื่อง การเปลี่ยนแปลงวงกว้าง/คอนฟิก/แพ็กเกจจะถูกข้าม เว้นแต่จะแมปไปยังการทดสอบที่แม่นยำได้
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: การรันการทดสอบแบบเปลี่ยนแปลงวงกว้างที่ระบุชัดเจน ใช้เมื่อการแก้ไขชุดเครื่องมือทดสอบ/คอนฟิก/แพ็กเกจควรถอยกลับไปใช้พฤติกรรมการทดสอบไฟล์ที่เปลี่ยนแปลงแบบกว้างกว่าของ Vitest
- `pnpm changed:lanes`: แสดงเลนสถาปัตยกรรมที่ถูกเรียกใช้โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รันเกตตรวจสอบการเปลี่ยนแปลงแบบฉลาดสำหรับ diff เทียบกับ `origin/main` คำสั่งนี้รันการตรวจชนิด ลินต์ และคำสั่ง guard สำหรับเลนสถาปัตยกรรมที่ได้รับผลกระทบ แต่ไม่รันการทดสอบ Vitest ใช้ `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนสำหรับหลักฐานการทดสอบ
- `pnpm test`: ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลน Vitest ที่มีขอบเขต การรันที่ไม่ระบุเป้าหมายใช้กลุ่มชาร์ดคงที่และขยายเป็นคอนฟิกปลายทางสำหรับการรันแบบขนานในเครื่อง กลุ่ม Plugin จะขยายเป็นคอนฟิกชาร์ดราย Plugin เสมอ แทนที่จะเป็นกระบวนการโปรเจกต์รูทรวมขนาดใหญ่หนึ่งตัว
- การรันผ่าน wrapper ทดสอบจะจบด้วยสรุปสั้น ๆ แบบ `[test] passed|failed|skipped ... in ...` ส่วนบรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดรายชาร์ด
- สถานะทดสอบ OpenClaw ที่ใช้ร่วมกัน: ใช้ `src/test-utils/openclaw-test-state.ts` จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, ฟิกซ์เจอร์คอนฟิก, เวิร์กสเปซ, ไดเรกทอรีเอเจนต์ หรือที่เก็บโปรไฟล์ยืนยันตัวตนแบบแยก
- ตัวช่วย E2E ระดับกระบวนการ: ใช้ `test/helpers/openclaw-test-instance.ts` เมื่อการทดสอบ E2E ระดับกระบวนการของ Vitest ต้องการ Gateway ที่กำลังทำงานอยู่ สภาพแวดล้อม CLI การจับล็อก และการล้างข้อมูลในที่เดียว
- ตัวช่วย Docker/Bash E2E: เลนที่ source `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์หลาย home สามารถส่ง `docker_e2e_test_state_function_b64` แล้วเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละโฟลว์ได้ ผู้เรียกระดับต่ำกว่าสามารถใช้ `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` สำหรับชิ้นส่วน shell ภายในคอนเทนเนอร์ หรือใช้ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` สำหรับไฟล์สภาพแวดล้อมโฮสต์ที่ source ได้ เครื่องหมาย `--` ก่อน `create` ป้องกันไม่ให้รันไทม์ Node รุ่นใหม่ตีความ `--env-file` เป็นแฟล็กของ Node เลน Docker/Bash ที่เปิด Gateway สามารถ source `scripts/lib/openclaw-e2e-instance.sh` ภายในคอนเทนเนอร์เพื่อจัดการการหา entrypoint, การเริ่มต้น OpenAI จำลอง, การเปิด Gateway แบบ foreground/background, การตรวจ readiness, การ export สภาพแวดล้อมสถานะ, การ dump ล็อก และการล้างกระบวนการ
- การรันชาร์ดแบบเต็ม แบบ Plugin และแบบ include-pattern จะอัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันทั้งคอนฟิกภายหลังใช้เวลาเหล่านั้นเพื่อบาลานซ์ชาร์ดที่ช้าและเร็ว ชาร์ด CI แบบ include-pattern จะเติมชื่อชาร์ดต่อท้ายคีย์เวลา ซึ่งทำให้เวลาชาร์ดที่ถูกกรองยังมองเห็นได้โดยไม่แทนที่ข้อมูลเวลาทั้งคอนฟิก ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ artifact เวลาในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกไว้ตอนนี้จะถูกส่งผ่านเลนเบาเฉพาะที่คงไว้เฉพาะ `test/setup.ts` โดยปล่อยเคสที่หนักด้านรันไทม์ไว้บนเลนเดิม
- ไฟล์ซอร์สที่มีการทดสอบคู่กันจะแมปไปยังไฟล์คู่กันนั้นก่อน แล้วจึงถอยกลับไปใช้ glob ไดเรกทอรีที่กว้างกว่า การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟอิมพอร์ตในเครื่องเพื่อรันการทดสอบที่อิมพอร์ตอยู่ แทนที่จะรันทุกชาร์ดแบบกว้างเมื่อเส้นทาง dependency มีความแม่นยำ
- `auto-reply` ตอนนี้ยังแยกเป็นคอนฟิกเฉพาะสามชุด (`core`, `top-level`, `reply`) เพื่อไม่ให้ชุดเครื่องมือ reply ครอบงำการทดสอบสถานะ/token/ตัวช่วยระดับบนที่เบากว่า
- คอนฟิกฐานของ Vitest ตอนนี้ตั้งค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ runner แบบไม่แยกร่วมกันทั่วคอนฟิกของรีโพ
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รันชาร์ด Plugin ทั้งหมด Plugin ช่องทางที่หนัก, Plugin เบราว์เซอร์ และ OpenAI จะรันเป็นชาร์ดเฉพาะ ส่วนกลุ่ม Plugin อื่นยังคงถูกจัดเป็นชุด ใช้ `pnpm test extensions/<id>` สำหรับเลน Plugin ที่บันเดิลไว้หนึ่งตัว
- `pnpm test:perf:imports`: เปิดใช้การรายงานระยะเวลาอิมพอร์ตและรายละเอียดแยกย่อยของอิมพอร์ตของ Vitest โดยยังใช้การจัดเส้นทางตามเลนที่มีขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจน
- `pnpm test:perf:imports:changed`: การทำโปรไฟล์อิมพอร์ตแบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนไปตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` วัดประสิทธิภาพเส้นทางโหมด changed ที่ถูกจัดเส้นทาง เทียบกับการรันโปรเจกต์รูทแบบเนทีฟสำหรับ git diff ที่ commit แล้วเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` วัดประสิทธิภาพชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียนโปรไฟล์ CPU สำหรับเธรดหลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียนโปรไฟล์ CPU และ heap สำหรับ runner หน่วย (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันคอนฟิกปลายทาง Vitest ของชุดทดสอบเต็มทุกตัวแบบต่อเนื่อง และเขียนข้อมูลระยะเวลาแบบจัดกลุ่มพร้อม artifact JSON/log รายคอนฟิก เอเจนต์ประสิทธิภาพการทดสอบใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้การทดสอบที่ช้า
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานที่จัดกลุ่มหลังการเปลี่ยนแปลงที่มุ่งเน้นประสิทธิภาพ
- การผสานรวม Gateway: เลือกเปิดใช้ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันการทดสอบ smoke แบบ end-to-end ของ Gateway (การจับคู่หลายอินสแตนซ์ WS/HTTP/node) ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม workers แบบปรับตัวใน `vitest.e2e.config.ts`; ปรับด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` สำหรับล็อกแบบละเอียด
- `pnpm test:live`: รันการทดสอบสดของผู้ให้บริการ (minimax/zai) ต้องมีคีย์ API และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะผู้ให้บริการ) เพื่อยกเลิกการข้าม
- `pnpm test:docker:all`: สร้างอิมเมจ live-test ที่ใช้ร่วมกัน แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball สร้าง/ใช้ซ้ำอิมเมจ runner Node/Git เปล่าและอิมเมจฟังก์ชันที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นรันเลน smoke ของ Docker ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ผ่านตัวจัดตารางแบบถ่วงน้ำหนัก อิมเมจเปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) ใช้สำหรับเลน installer/update/plugin-dependency; เลนเหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้าแทนการใช้ซอร์สรีโพที่คัดลอกมา อิมเมจฟังก์ชัน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) ใช้สำหรับเลนฟังก์ชันการทำงานของแอปที่ build แล้วตามปกติ `scripts/package-openclaw-for-docker.mjs` เป็นตัวแพ็กแพ็กเกจ local/CI เพียงตัวเดียวและตรวจสอบ tarball รวมถึง `dist/postinstall-inventory.json` ก่อนที่ Docker จะนำไปใช้ นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการ plan ที่เลือกไว้ `node scripts/test-docker-all.mjs --plan-json` ปล่อย plan ของ CI ที่ตัวจัดตารางเป็นเจ้าของสำหรับเลนที่เลือก ชนิดอิมเมจ ความต้องการแพ็กเกจ/อิมเมจสด สถานการณ์สถานะ และการตรวจข้อมูลรับรอง โดยไม่สร้างหรือรัน Docker `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ควบคุมสล็อตกระบวนการและมีค่าเริ่มต้นเป็น 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ควบคุมพูลท้ายที่ไวต่อผู้ให้บริการและมีค่าเริ่มต้นเป็น 10 ค่า cap ของเลนหนักเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ค่า cap ของผู้ให้บริการเริ่มต้นเป็นหนึ่งเลนหนักต่อผู้ให้บริการผ่าน `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` และ `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ใช้ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` สำหรับโฮสต์ที่ใหญ่กว่า หากเลนหนึ่งเกินน้ำหนักมีผลหรือ cap ทรัพยากรบนโฮสต์ที่มี parallelism ต่ำ เลนนั้นยังเริ่มจากพูลว่างได้และจะรันเพียงลำพังจนกว่าจะปล่อยความจุ การเริ่มเลนจะถูกหน่วงห่างกัน 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยงการสร้างงานพร้อมกันจำนวนมากของ Docker daemon ในเครื่อง; override ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` runner จะ preflight Docker โดยค่าเริ่มต้น ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แสดงสถานะเลนที่ทำงานอยู่ทุก 30 วินาที แชร์แคชเครื่องมือ CLI ของผู้ให้บริการระหว่างเลนที่เข้ากันได้ ลองใหม่หนึ่งครั้งโดยค่าเริ่มต้นสำหรับความล้มเหลวชั่วคราวของ live-provider (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) และเก็บเวลาเลนใน `.artifacts/docker-tests/lane-timings.json` เพื่อเรียงจากนานที่สุดก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของเลนโดยไม่รัน Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` เพื่อปรับเอาต์พุตสถานะ หรือ `OPENCLAW_DOCKER_ALL_TIMINGS=0` เพื่อปิดการใช้เวลาเดิมซ้ำ ใช้ `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` สำหรับเลน deterministic/local เท่านั้น หรือ `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` สำหรับเลน live-provider เท่านั้น; alias ของแพ็กเกจคือ `pnpm test:docker:local:all` และ `pnpm test:docker:live:all` โหมด live-only รวมเลน live หลักและท้ายไว้ในพูลเดียวที่เรียงจากนานที่สุดก่อน เพื่อให้ bucket ผู้ให้บริการสามารถจัดงาน Claude, Codex และ Gemini เข้าด้วยกันได้ runner จะหยุดจัดตารางเลนใหม่ในพูลหลังความล้มเหลวแรก เว้นแต่ตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละเลนมี fallback timeout 120 นาที ซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; เลน live/tail ที่เลือกใช้ cap รายเลนที่เข้มงวดกว่า คำสั่งตั้งค่า Docker ของแบ็กเอนด์ CLI มี timeout ของตัวเองผ่าน `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (ค่าเริ่มต้น 180) ล็อกรายเลน, `summary.json`, `failures.json` และเวลาของแต่ละเฟสจะถูกเขียนใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจเลนที่ช้า และ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่ง rerun แบบเจาะจงที่ประหยัด
- `pnpm test:docker:browser-cdp-snapshot`: สร้างคอนเทนเนอร์ E2E จากซอร์สที่หนุนด้วย Chromium เริ่ม CDP ดิบพร้อม Gateway ที่แยกไว้ รัน `browser doctor --deep` และตรวจสอบว่าสแนปช็อตบทบาท CDP มี URL ของลิงก์ องค์ประกอบที่คลิกได้ซึ่งถูกโปรโมตด้วยเคอร์เซอร์ iframe refs และ metadata ของเฟรม
- `pnpm test:docker:skill-install`: ติดตั้ง OpenClaw tarball ที่แพ็กไว้ใน Docker runner เปล่า ปิดใช้งาน `skills.install.allowUploadedArchives` resolve slug ของ skill ปัจจุบันจากการค้นหา ClawHub สด ติดตั้งผ่าน `openclaw skills install` และตรวจสอบ `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` และ `skills info --json`
- โพรบ Docker สดของแบ็กเอนด์ CLI สามารถรันเป็นเลนแบบเจาะจงได้ เช่น `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` หรือ `pnpm test:docker:live-cli-backend:codex:mcp` Claude และ Gemini มี alias `:resume` และ `:mcp` ที่ตรงกัน
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI แบบ Dockerized ลงชื่อเข้าใช้ผ่าน Open WebUI ตรวจ `/api/models` จากนั้นรันแชตที่ proxy จริงผ่าน `/api/chat/completions` ต้องมีคีย์โมเดลสดที่ใช้ได้ (เช่น OpenAI ใน `~/.profile`) ดึงอิมเมจ Open WebUI ภายนอก และไม่ได้คาดหวังว่าจะเสถียรสำหรับ CI เหมือนชุดทดสอบหน่วย/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ใส่ข้อมูลตั้งต้นไว้และคอนเทนเนอร์ไคลเอนต์ตัวที่สองซึ่งสร้าง `openclaw mcp serve` จากนั้นตรวจสอบการค้นพบการสนทนาที่ถูกกำหนดเส้นทาง การอ่านทรานสคริปต์ เมตาดาต้าไฟล์แนบ พฤติกรรมคิวเหตุการณ์สด การกำหนดเส้นทางการส่งออก และการแจ้งเตือนช่องทางแบบ Claude พร้อมสิทธิ์ผ่านบริดจ์ stdio จริง การยืนยันการแจ้งเตือนของ Claude อ่านเฟรม MCP ของ stdio ดิบโดยตรง เพื่อให้ smoke สะท้อนสิ่งที่บริดจ์ปล่อยออกมาจริง
- `pnpm test:docker:upgrade-survivor`: ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบสกปรก รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการสดหรือคีย์ช่องทาง จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่าเอเจนต์ การกำหนดค่าช่องทาง allowlist ของ Plugin ไฟล์ workspace/session สถานะ dependency เดิมของ Plugin ที่ค้างอยู่ การเริ่มต้น และสถานะ RPC ยังอยู่รอด
- `pnpm test:docker:published-upgrade-survivor`: ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น ใส่ไฟล์ผู้ใช้เดิมที่สมจริงโดยไม่มีคีย์ผู้ให้บริการสดหรือคีย์ช่องทาง กำหนดค่า baseline นั้นด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้ อัปเดตการติดตั้งที่เผยแพร่แล้วนั้นไปเป็น tarball ของ OpenClaw ที่แพ็กแล้ว รัน doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบว่า intent ที่กำหนดค่าไว้ ไฟล์ workspace/session การกำหนดค่า Plugin ที่ค้างอยู่และสถานะ dependency เดิม การเริ่มต้น `/healthz`, `/readyz` และสถานะ RPC ยังอยู่รอดหรือซ่อมแซมได้อย่างเรียบร้อย แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขยายเมทริกซ์ local ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` หรือเพิ่ม scenario fixture ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; ชุด reported-issues มี `configured-plugin-installs` เพื่อยืนยันว่า OpenClaw Plugin ภายนอกที่กำหนดค่าไว้ติดตั้งโดยอัตโนมัติระหว่างการอัปเกรด และ `stale-source-plugin-shadow` เพื่อกันไม่ให้เงา Plugin แบบ source-only ทำให้การเริ่มต้นเสีย Package Acceptance เปิดเผยสิ่งเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` และ resolve โทเคน meta baseline เช่น `last-stable-4` หรือ `all-since-2026.4.23` ก่อนส่ง package spec ที่แน่นอนไปยัง Docker lanes
- `pnpm test:docker:update-migration`: รัน harness published-upgrade survivor ใน scenario `plugin-deps-cleanup` ที่เน้นการล้างข้อมูล โดยเริ่มที่ `openclaw@2026.4.23` ตามค่าเริ่มต้น workflow `Update Migration` ที่แยกต่างหากจะขยาย lane นี้ด้วย `baselines=all-since-2026.4.23` เพื่อให้ทุกแพ็กเกจ stable ที่เผยแพร่ตั้งแต่ `.23` เป็นต้นไปอัปเดตไปยัง candidate และพิสูจน์การล้าง dependency ของ Plugin ที่กำหนดค่าไว้ภายนอก Full Release CI
- `pnpm test:docker:plugins`: รัน smoke สำหรับการติดตั้ง/อัปเดตของ local path, `file:`, แพ็กเกจ npm registry ที่มี dependency แบบ hoisted, ref ของ git ที่เคลื่อนที่ได้, fixture ของ ClawHub, การอัปเดต marketplace และการเปิดใช้/ตรวจสอบ Claude-bundle

## เกต PR ภายในเครื่อง

สำหรับการตรวจสอบการ land/เกต PR ภายในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` ล้มเหลวแบบไม่เสถียรบนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็นการถดถอย จากนั้นแยกทดสอบด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เบนช์มาร์กเวลาแฝงของโมเดล (คีย์ภายในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env ที่เลือกได้: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: "ตอบด้วยคำเดียว: ok ไม่มีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม"

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax มัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus มัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

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

เอาต์พุตมี `sampleCount`, ค่าเฉลี่ย, p50, p95, ต่ำสุด/สูงสุด, การกระจายของ exit-code/signal และสรุป RSS สูงสุดสำหรับแต่ละคำสั่ง `--cpu-prof-dir` / `--heap-prof-dir` ที่เลือกได้จะเขียนโปรไฟล์ V8 ต่อรอบ เพื่อให้การจับเวลาและการจับโปรไฟล์ใช้ harness เดียวกัน

ธรรมเนียมของเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` เขียนอาร์ติแฟกต์ smoke ที่เจาะจงไว้ที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` เขียนอาร์ติแฟกต์ชุดเต็มไว้ที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` รีเฟรช fixture baseline ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก ซึ่งจำเป็นเฉพาะสำหรับการทดสอบ smoke ของ onboarding แบบคอนเทนเนอร์เท่านั้น

โฟลว์เริ่มต้นแบบ cold start เต็มรูปแบบในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้ขับเคลื่อนตัวช่วยตั้งค่าแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม Gateway และรัน `openclaw health`

## smoke การนำเข้า QR (Docker)

ตรวจให้แน่ใจว่า helper runtime QR ที่ดูแลอยู่โหลดได้ภายใต้ runtime Docker Node ที่รองรับ (ค่าเริ่มต้น Node 24, เข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบ live](/th/help/testing-live)
- [การทดสอบการอัปเดตและ plugins](/th/help/testing-updates-plugins)
