---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่ม regression สำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละแบบครอบคลุม'
title: Testing
x-i18n:
    generated_at: "2026-04-26T11:33:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw มี Vitest อยู่สามชุด (unit/integration, e2e, live) และมีชุดตัวรัน Docker ขนาดเล็กอีกจำนวนหนึ่ง เอกสารนี้เป็นคู่มือ “เราทดสอบกันอย่างไร”:

- แต่ละชุดครอบคลุมอะไร (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบแบบสดค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

## เริ่มต้นอย่างรวดเร็ว

เกือบทุกวัน:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันทั้งชุดแบบเต็มที่เร็วขึ้นในเครื่องบนเครื่องที่มีทรัพยากรเหลือเฟือ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้กำหนดเส้นทางไฟล์ส่วน extension/channel ได้ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรใช้การรันแบบเจาะจงเป้าหมายก่อน เมื่อคุณกำลังวนรอบกับความล้มเหลวเพียงรายการเดียว
- ไซต์ QA ที่รองรับด้วย Docker: `pnpm qa:lab:up`
- lane QA ที่รองรับด้วย Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะต้องการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกตความครอบคลุม: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (models + gateway tool/image probes): `pnpm test:live`
- กำหนดเป้าหมายไฟล์ live ไฟล์เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- การกวาดโมเดลสดใน Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่ถูกเลือกตอนนี้จะรันทั้งเทิร์นข้อความและ probe แบบอ่านไฟล์ขนาดเล็ก
    โมเดลที่เมทาดาต้าประกาศว่ารองรับอินพุต `image` จะรันเทิร์นภาพขนาดเล็กด้วย
    ปิด probes เพิ่มเติมเหล่านี้ด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อต้องการแยกปัญหาของผู้ให้บริการ
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` แบบรายวัน และ
    `OpenClaw Release Checks` แบบแมนนวล
    ทั้งคู่เรียก reusable live/E2E workflow พร้อม
    `include_live_suites: true` ซึ่งรวมงาน Docker live model matrix แบบแยกตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secrets ของผู้ให้บริการที่มีสัญญาณสูงรายการใหม่เข้าไปใน `scripts/ci-hydrate-live-auth.sh`
    พร้อมทั้ง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียกใช้งานแบบ
    scheduled/release ของมัน
- smoke ของ native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับเส้นทาง Codex app-server, bind
    Slack DM แบบสังเคราะห์ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบว่าทั้งการตอบกลับแบบข้อความธรรมดาและ
    ไฟล์แนบภาพถูกกำหนดเส้นทางผ่าน native plugin binding แทน ACP
- smoke ของ Codex app-server harness: `pnpm test:docker:live-codex-harness`
  - รันเทิร์นเอเจนต์ของ Gateway ผ่าน Codex app-server harness ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models`, และโดยค่าเริ่มต้นจะทดสอบ probes สำหรับ image,
    Cron MCP, sub-agent และ Guardian ปิด sub-agent probe ได้ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อต้องการแยกปัญหา Codex
    app-server อื่น ๆ สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probes อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลังจบ sub-agent probe เว้นแต่จะตั้ง
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke ของคำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ belt-and-suspenders ที่เลือกเปิดใช้สำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    มันจะทดสอบ `/crestodian status`, เข้าคิวการเปลี่ยนโมเดลแบบ persistent,
    ตอบ `/crestodian yes`, และตรวจสอบเส้นทาง audit/config write
- smoke ของ Crestodian planner ใน Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มี config โดยมี Claude CLI ปลอมอยู่บน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลไปเป็น typed config write ที่มี audit
- smoke ของ Crestodian first-run ใน Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก OpenClaw state dir ที่ว่างเปล่า, กำหนดเส้นทาง `openclaw` แบบ bare ไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Discord plugin + SecretRef,
    validate config และตรวจสอบรายการ audit เส้นทาง setup แบบ Ring 0 เดียวกันนี้
    ยังถูกครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ของค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้ง `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบ isolated กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  ทรานสคริปต์ของ assistant เก็บ `usage.cost` ที่ถูกทำ normalization แล้ว

เคล็ดลับ: เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวกรณีเดียว ควรจำกัดการทดสอบแบบสดด้วย allowlist env vars ที่อธิบายไว้ด้านล่าง

## ตัวรันเฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลัก เมื่อคุณต้องการความสมจริงระดับ QA-lab:

CI รัน QA Lab ใน workflows เฉพาะ `Parity gate` จะรันบน PRs ที่ตรงเงื่อนไข
และจาก manual dispatch โดยใช้ mock providers `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจาก manual dispatch โดยมี mock parity gate, live Matrix lane และ
live Telegram lane ที่จัดการด้วย Convex เป็นงานแบบขนาน `OpenClaw Release Checks`
จะรัน lanes ชุดเดียวกันก่อนอนุมัติ release

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อิงกับรีโปโดยตรงบนโฮสต์
  - รันหลายสถานการณ์ที่เลือกไว้แบบขนานตามค่าเริ่มต้นด้วย gateway workers ที่แยกจากกัน
    `qa-channel` ใช้ concurrency เริ่มต้นเป็น 4 (ถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก)
    ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1` เพื่อใช้ serial lane แบบเก่า
  - ออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่ให้ออกด้วยโค้ดล้มเหลว
  - รองรับ provider modes คือ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` จะเริ่มเซิร์ฟเวอร์ผู้ให้บริการในเครื่องที่รองรับด้วย AIMock สำหรับความครอบคลุมเชิงทดลองด้าน
    fixture และ protocol-mock โดยไม่มาแทน lane `mock-openai` ที่รับรู้สถานการณ์
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้แฟล็กการเลือก provider/model แบบเดียวกับ `qa suite`
  - การรันแบบสดจะส่งต่ออินพุตการยืนยันตัวตน QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ guest:
    provider keys แบบ env, พาธ config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีอยู่
  - output dirs ต้องอยู่ภายใต้รากรีโป เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ถูก mount ได้
  - เขียนรายงาน + สรุป QA ปกติ พร้อมทั้ง Multipass logs ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่รองรับด้วย Docker สำหรับงาน QA แบบผู้ปฏิบัติงาน
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน, ติดตั้งแบบ global ใน
    Docker, รัน onboarding แบบไม่โต้ตอบด้วย OpenAI API key, กำหนดค่า Telegram
    ตามค่าเริ่มต้น, ตรวจสอบว่าการเปิดใช้ Plugin ติดตั้ง runtime dependencies แบบตามต้องการ,
    รัน doctor และรันหนึ่ง local agent turn กับ mocked OpenAI
    endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน packaged-install
    lane เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน deterministic built-app Docker smoke สำหรับทรานสคริปต์บริบท runtime แบบ embedded
    มันตรวจสอบว่า hidden OpenClaw runtime context ถูกเก็บเป็น
    custom message แบบไม่แสดงผล แทนที่จะรั่วเข้าไปใน user turn ที่มองเห็นได้
    จากนั้น seed session JSONL ที่เสียหายตามกรณี และตรวจสอบว่า
    `openclaw doctor --fix` เขียนมันใหม่ไปยังสาขาที่ใช้งานอยู่พร้อมแบ็กอัป
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งแพ็กเกจ OpenClaw ที่เผยแพร่แล้วใน Docker, รัน onboarding ของแพ็กเกจที่ติดตั้งแล้ว,
    กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นใช้ live Telegram QA lane เดิม
    โดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`
  - ใช้ข้อมูลรับรอง Telegram แบบ env หรือแหล่งข้อมูลรับรอง Convex เดียวกันกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้ง
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI,
    Docker wrapper จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ใช้แทน
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกัน สำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น workflow ของ maintainer แบบแมนนวล
    `NPM Telegram Beta E2E` มันจะไม่รันเมื่อ merge workflow นี้ใช้
    environment `qa-live-shared` และ Convex CI credential leases
- `pnpm test:docker:bundled-channel-deps`
  - pack และติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker, เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้ว จากนั้นเปิดใช้ bundled channel/plugins ผ่าน config edits
  - ตรวจสอบว่าการค้นหา setup ปล่อย runtime dependencies ของ plugin ที่ยังไม่ได้กำหนดค่าไว้
    ให้อยู่ในสถานะไม่ถูกติดตั้ง, และการรัน Gateway หรือ doctor ครั้งแรกที่มีการกำหนดค่า
    จะติดตั้ง runtime dependencies ของ bundled plugin แต่ละตัวตามต้องการ, และการรีสตาร์ตรอบที่สองจะไม่
    ติดตั้ง dependencies ที่ถูก activate ไปแล้วซ้ำอีก
  - ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบแน่ชัด, เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังการอัปเดตของ
    candidate ซ่อม runtime dependencies ของ bundled channel โดยไม่ต้องอาศัย
    postinstall repair ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดตแบบ packaged-install เนทีฟข้าม Parallels guests แต่ละ
    แพลตฟอร์มที่เลือกจะติดตั้ง baseline package ที่ร้องขอก่อน จากนั้นรัน
    คำสั่ง `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง,
    สถานะการอัปเดต, ความพร้อมของ Gateway และหนึ่ง local agent turn
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะ
    วนรอบกับ guest ตัวเดียว ใช้ `--json` สำหรับพาธของ summary artifact และ
    สถานะแบบต่อ lane
  - OpenAI lane ใช้ `openai/gpt-5.5` สำหรับหลักฐาน live agent-turn ตามค่าเริ่มต้น
    ส่ง `--model <provider/model>` หรือกำหนด
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อตั้งใจตรวจสอบ
    โมเดล OpenAI อื่น
  - ครอบการรันในเครื่องที่ใช้เวลานานด้วย host timeout เพื่อไม่ให้การค้างของ Parallels transport
    กินเวลาทดสอบที่เหลือไปทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์จะเขียน nested lane logs ไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ให้ตรวจดู `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า outer wrapper ค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในขั้น post-update doctor/runtime
    dependency repair บน guest ที่ยังเย็นอยู่; สิ่งนี้ยังถือว่าปกติเมื่อ nested
    npm debug log ยังเดินหน้าอยู่
  - อย่ารัน aggregate wrapper นี้แบบขนานกับ Parallels macOS, Windows หรือ Linux smoke lanes แบบเดี่ยว พวกมันใช้สถานะ VM ร่วมกันและอาจชนกันในเรื่อง
    snapshot restore, package serving หรือสถานะ gateway ของ guest
  - หลักฐานหลังการอัปเดตจะรันพื้นผิว bundled plugin ตามปกติ เพราะ
    capability facades เช่น speech, image generation และ media
    understanding ถูกโหลดผ่าน bundled runtime APIs แม้ว่า agent turn เอง
    จะตรวจเพียงการตอบกลับข้อความแบบง่าย ๆ ก็ตาม

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ในเครื่องสำหรับการทดสอบ protocol smoke โดยตรง
- `pnpm openclaw qa matrix`
  - รัน Matrix live QA lane กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่รองรับด้วย Docker
  - โฮสต์ QA นี้ยังเป็นแบบ repo/dev-only ในตอนนี้ การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ส่ง
    `qa-lab` มาด้วย จึงไม่เปิดเผย `openclaw qa`
  - checkout ของรีโปจะโหลด bundled runner โดยตรง โดยไม่ต้องมีขั้นตอนติดตั้ง Plugin แยก
  - provision ผู้ใช้ Matrix ชั่วคราวสามราย (`driver`, `sut`, `observer`) พร้อมห้องส่วนตัวหนึ่งห้อง จากนั้นเริ่ม QA gateway child โดยใช้ Plugin Matrix จริงเป็น SUT transport
  - ใช้อิมเมจ Tuwunel เสถียรที่ปักหมุดไว้ `ghcr.io/matrix-construct/tuwunel:v1.5.1` ตามค่าเริ่มต้น แทนที่ได้ด้วย `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เมื่อต้องการทดสอบอิมเมจอื่น
  - Matrix ไม่เปิดเผยแฟล็ก shared credential-source เพราะ lane นี้ provision ผู้ใช้แบบใช้แล้วทิ้งภายในเครื่อง
  - เขียนรายงาน Matrix QA, สรุป, อาร์ติแฟกต์ observed-events และ log stdout/stderr แบบรวมไว้ใต้ `.artifacts/qa-e2e/...`
  - แสดงความคืบหน้าตามค่าเริ่มต้นและบังคับ hard run timeout ด้วย `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (ค่าเริ่มต้น 30 นาที) การ cleanup ถูกจำกัดด้วย `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` และความล้มเหลวจะรวมคำสั่งกู้คืน `docker compose ... down --remove-orphans`
- `pnpm openclaw qa telegram`
  - รัน Telegram live QA lane กับกลุ่มส่วนตัวจริง โดยใช้ driver และ SUT bot tokens จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองที่ใช้ร่วมกันแบบ pooled ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled leases
  - ออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่ให้ออกด้วยโค้ดล้มเหลว
  - ต้องมีบอตสองตัวที่ต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องมี Telegram username
  - เพื่อให้การสังเกตแบบบอตต่อบอตมีเสถียรภาพ ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอต และตรวจสอบให้แน่ใจว่าบอต driver สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียนรายงาน Telegram QA, สรุป และอาร์ติแฟกต์ observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver ไปจนถึงคำตอบของ SUT ที่สังเกตได้

live transport lanes ใช้สัญญามาตรฐานชุดเดียวร่วมกัน เพื่อไม่ให้ transport ใหม่เบี่ยงเบนไปคนละทาง:

`qa-channel` ยังคงเป็นชุด QA แบบสังเคราะห์ที่ครอบคลุม และไม่ใช่ส่วนหนึ่งของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | การควบคุมด้วย mention | การบล็อกแบบ allowlist | การตอบกลับระดับบนสุด | การกลับมาทำงานหลังรีสตาร์ต | การติดตามต่อในเธรด | การแยกเธรด | การสังเกตรีแอ็กชัน | คำสั่ง help |
| -------- | ------ | ---------------------- | --------------------- | --------------------- | --------------------------- | ------------------- | ----------- | ------------------- | ----------- |
| Matrix   | x      | x                      | x                     | x                     | x                           | x                   | x           | x                   |             |
| Telegram | x      |                        |                       |                       |                             |                     |             |                     | x           |

### ข้อมูลรับรอง Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะขอ lease แบบ exclusive จากพูลที่รองรับด้วย Convex, ส่ง heartbeat
ให้ lease นั้นขณะ lane กำลังรัน และปล่อย lease เมื่อปิดตัวลง

โครงร่างโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env vars ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งตัวสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (มีค่าเริ่มต้นเป็น `ci` ใน CI, และ `maintainer` ในกรณีอื่น)

env vars แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต Convex URLs แบบ loopback `http://` สำหรับการพัฒนาในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการใช้งานปกติ

คำสั่ง admin สำหรับ maintainer (pool add/remove/list) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

CLI helpers สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบสดเพื่อตรวจสอบ Convex site URL, broker secrets,
endpoint prefix, HTTP timeout และการเข้าถึงระดับ admin/list โดยไม่พิมพ์
ค่า secret ออกมา ใช้ `--json` สำหรับผลลัพธ์ที่อ่านได้ด้วยเครื่องในสคริปต์และเครื่องมือ CI

สัญญา endpoint ค่าเริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - ทรัพยากรหมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่างเปล่า)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่างเปล่า)
- `POST /admin/add` (เฉพาะ maintainer secret)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ maintainer secret)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ active อยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ maintainer secret)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง Telegram chat id แบบตัวเลข
- `admin/add` จะตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ไม่ถูกต้อง

### การเพิ่มช่องเข้า QA

การเพิ่มช่องเข้าระบบ QA แบบ Markdown ต้องมีเพียงสองสิ่งเท่านั้น:

1. transport adapter สำหรับช่องนั้น
2. scenario pack ที่ทดสอบสัญญาของช่องนั้น

อย่าเพิ่มรากคำสั่ง QA ระดับบนสุดใหม่ เมื่อโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
สามารถเป็นเจ้าของโฟลว์นั้นได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- รากคำสั่ง `openclaw qa`
- การเริ่มต้นและ teardown ของ suite
- worker concurrency
- การเขียนอาร์ติแฟกต์
- การสร้างรายงาน
- การรันสถานการณ์
- compatibility aliases สำหรับสถานการณ์ `qa-channel` แบบเก่า

runner plugins เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ราก `qa` ที่ใช้ร่วมกัน
- วิธีตั้งค่า Gateway สำหรับ transport นั้น
- วิธีตรวจสอบ readiness
- วิธีฉีดเหตุการณ์ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผยทรานสคริปต์และ normalized transport state
- วิธีรัน transport-backed actions
- วิธีจัดการ reset หรือ cleanup ที่เฉพาะกับ transport

เกณฑ์ขั้นต่ำสำหรับการนำ channel ใหม่มาใช้คือ:

1. ให้ `qa-lab` เป็นเจ้าของราก `qa` ที่ใช้ร่วมกันต่อไป
2. implement transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกที่เฉพาะกับ transport ไว้ภายใน runner plugin หรือ channel harness
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน
   runner plugins ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts`
   ให้ `runtime-api.ts` มีน้ำหนักเบา; การรัน CLI และ runner แบบ lazy ควรอยู่หลัง entrypoints ที่แยกกัน
5. เขียนหรือดัดแปลงสถานการณ์ Markdown ภายใต้ไดเรกทอรีตามธีมใน `qa/scenarios/`
6. ใช้ generic scenario helpers สำหรับสถานการณ์ใหม่
7. ให้ compatibility aliases ที่มีอยู่ยังคงทำงาน เว้นแต่รีโปกำลังทำการย้ายแบบตั้งใจ

กฎการตัดสินใจเป็นแบบเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ channel transport หนึ่งตัว ให้เก็บไว้ใน runner plugin หรือ plugin harness ของมัน
- หากสถานการณ์ต้องการ capability ใหม่ที่มากกว่าหนึ่งช่องใช้ได้ ให้เพิ่ม generic helper แทนการแตกกิ่งแบบเฉพาะช่องใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้คงสถานการณ์นั้นเป็นแบบ transport-specific และระบุสิ่งนั้นให้ชัดในสัญญาของสถานการณ์

ชื่อ generic helper ที่แนะนำสำหรับสถานการณ์ใหม่คือ:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

compatibility aliases ยังคงมีให้ใช้สำหรับสถานการณ์เดิม รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งานช่องใหม่ควรใช้ชื่อ generic helper
compatibility aliases มีไว้เพื่อหลีกเลี่ยงการย้ายแบบ flag day ไม่ใช่เป็นต้นแบบสำหรับ
การเขียนสถานการณ์ใหม่

## ชุดทดสอบ (อะไรไปรันที่ไหน)

ให้คิดถึงชุดทดสอบว่าเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันแบบไม่กำหนดเป้าหมายจะใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย multi-project shards ออกเป็น per-project configs สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventories ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และการทดสอบ node ของ `ui` ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - การทดสอบยูนิตแบบล้วน
  - การทดสอบ integration แบบ in-process (gateway auth, routing, tooling, parsing, config)
  - regression แบบกำหนดแน่นอนสำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร

<AccordionGroup>
  <Accordion title="โปรเจกต์, shards และ scoped lanes">

    - การรัน `pnpm test` แบบไม่กำหนดเป้าหมายจะใช้ shard configs ขนาดเล็ก 12 ชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนที่จะเป็น root-project process ขนาดยักษ์เพียงตัวเดียว วิธีนี้ช่วยลด RSS สูงสุดบนเครื่องที่มีโหลด และป้องกันไม่ให้งาน auto-reply/extension แย่งทรัพยากรจาก suites อื่น
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์จาก root `vitest.config.ts` แบบเนทีฟ เพราะลูป watch แบบหลาย shard ไม่ใช่สิ่งที่ใช้งานได้จริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะกำหนดเส้นทางเป้าหมายไฟล์/ไดเรกทอรีแบบ explicit ผ่าน scoped lanes ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องจ่ายต้นทุนเริ่มต้นของ root project ทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนไปเป็น scoped lanes แบบเดียวกัน เมื่อ diff แตะเฉพาะ source/test files ที่กำหนดเส้นทางได้สะอาด; การแก้ config/setup จะยัง fallback ไป rerun root-project แบบกว้าง
    - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานแคบ ๆ มันจะแยกประเภท diff ออกเป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling จากนั้นรัน typecheck/lint/test lanes ที่ตรงกัน การเปลี่ยนแปลง Public Plugin SDK และ plugin-contract จะรวม extension validation pass หนึ่งรอบ เพราะ extensions พึ่งพาสัญญาแกนกลางเหล่านั้น การ bump เวอร์ชันที่เป็นเฉพาะ release metadata จะรัน targeted version/config/root-dependency checks แทน full suite โดยมีตัวป้องกันที่ปฏิเสธ package changes นอกเหนือจาก top-level version field
    - การแก้ ACP harness ของ live Docker จะรัน focused local gate: shell syntax สำหรับ live Docker auth scripts, live Docker scheduler dry-run, ACP bind unit tests และ ACPX extension tests การเปลี่ยน `package.json` จะรวมอยู่ด้วยก็ต่อเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ dependency, export, version และ package-surface อื่น ๆ จะยังใช้ guards ที่กว้างกว่า
    - unit tests ที่ import น้อยจาก agents, commands, plugins, auto-reply helpers, `plugin-sdk` และพื้นที่ utility แบบล้วนลักษณะคล้ายกัน จะถูกกำหนดเส้นทางผ่าน `unit-fast` lane ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มีสถานะหรือหนักด้าน runtime จะยังคงอยู่บน lanes เดิม
    - source files ตัวช่วยบางส่วนของ `plugin-sdk` และ `commands` ยังแมปการรันแบบ changed-mode ไปยัง sibling tests แบบ explicit ใน light lanes เหล่านั้นด้วย ดังนั้นการแก้ helper จึงไม่ต้อง rerun heavy suite ทั้งหมดสำหรับไดเรกทอรีนั้น
    - `auto-reply` มี bucket เฉพาะสำหรับ top-level core helpers, top-level `reply.*` integration tests และ subtree `src/auto-reply/reply/**` CI ยังแยก reply subtree ออกเป็น shards สำหรับ agent-runner, dispatch และ commands/state-routing อีกด้วย เพื่อไม่ให้ bucket ที่ import หนัก bucket เดียวครอบครอง tail ของ Node ทั้งหมด

  </Accordion>

  <Accordion title="ความครอบคลุมของ embedded runner">

    - เมื่อคุณเปลี่ยนอินพุตการค้นหา message-tool หรือบริบท runtime ของ Compaction ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression แบบ focused helper สำหรับขอบเขตการกำหนดเส้นทางและการทำ normalization แบบล้วน
    - รักษา integration suites ของ embedded runner ให้สมบูรณ์:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - suites เหล่านี้ตรวจสอบว่า scoped ids และพฤติกรรมของ Compaction ยังคงไหลผ่าน
      เส้นทางจริงของ `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper เพียงอย่างเดียว
      ไม่เพียงพอที่จะใช้แทน integration paths เหล่านี้

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ Vitest pool และ isolation">

    - Base Vitest config ใช้ค่าเริ่มต้นเป็น `threads`
    - shared Vitest config ล็อก `isolate: false` และใช้
      non-isolated runner ข้าม root projects, e2e และ live configs
    - UI lane ที่ root ยังคงมี `jsdom` setup และ optimizer ของตัวเอง แต่รันบน
      shared non-isolated runner เช่นกัน
    - แต่ละ shard ของ `pnpm test` จะสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจาก shared Vitest config
    - `scripts/run-vitest.mjs` จะเพิ่ม `--no-maglev` ให้กับ Vitest child Node
      processes ตามค่าเริ่มต้น เพื่อลด V8 compile churn ระหว่างการรันในเครื่องขนาดใหญ่
      ตั้ง `OPENCLAW_VITEST_ENABLE_MAGLEV=1` หากต้องการเปรียบเทียบกับพฤติกรรม V8 แบบปกติ

  </Accordion>

  <Accordion title="การวนรอบในเครื่องแบบรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff หนึ่งชุดทริกเกอร์ architectural lanes อะไรบ้าง
    - pre-commit hook ทำเฉพาะ formatting เท่านั้น มันจะ restage ไฟล์ที่ถูกจัดรูปแบบแล้ว และ
      ไม่รัน lint, typecheck หรือ tests
    - รัน `pnpm check:changed` แบบ explicit ก่อนส่งต่องานหรือ push เมื่อคุณ
      ต้องการ smart local gate การเปลี่ยนแปลง Public Plugin SDK และ plugin-contract
      จะรวม extension validation pass หนึ่งรอบ
    - `pnpm test:changed` จะกำหนดเส้นทางผ่าน scoped lanes เมื่อพาธที่เปลี่ยน
      แมปกับชุดที่เล็กกว่าได้อย่างชัดเจน
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการกำหนดเส้นทางแบบเดิม
      เพียงแต่ใช้เพดาน worker ที่สูงขึ้น
    - การปรับขนาด worker อัตโนมัติในเครื่องมีความระมัดระวังโดยตั้งใจ และจะถอยกลับ
      เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุด
      จะสร้างผลเสียได้น้อยลงตามค่าเริ่มต้น
    - base Vitest config ทำเครื่องหมายโปรเจกต์/ไฟล์ config เป็น
      `forceRerunTriggers` เพื่อให้ reruns แบบ changed-mode ยังคงถูกต้องเมื่อมีการเปลี่ยน test wiring
    - config จะเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บนโฮสต์ที่รองรับ;
      ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่งแคชแบบ explicit หนึ่งตำแหน่งสำหรับการทำ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดใช้การรายงานระยะเวลา import ของ Vitest พร้อม
      ผลลัพธ์การแจกแจง import
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไปยัง
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลา shard จะถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันแบบทั้ง config จะใช้พาธ config เป็นคีย์; shards ของ CI แบบ include-pattern
      จะเติมชื่อ shard ต่อท้าย เพื่อให้ติดตาม filtered shards แยกกันได้
    - เมื่อ hot test หนึ่งตัวยังคงใช้เวลาส่วนใหญ่ไปกับ startup imports
      ให้เก็บ dependencies ที่หนักไว้หลัง seam แบบ local `*.runtime.ts` ที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import runtime helpers เพียงเพื่อส่งผ่านเข้า `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูกกำหนดเส้นทางกับเส้นทาง root-project แบบเนทีฟสำหรับ diff ที่ commit ไว้ และพิมพ์ wall time พร้อม macOS max RSS
    - `pnpm test:perf:changed:bench -- --worktree` ทำ benchmark ให้ worktree ที่มีการเปลี่ยนแปลงอยู่ในปัจจุบัน โดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และ root Vitest config
    - `pnpm test:perf:profile:main` เขียน main-thread CPU profile สำหรับ
      overhead ของการเริ่ม Vitest/Vite และการ transform
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profiles ของ runner สำหรับ
      unit suite โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### Stability (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, บังคับให้ใช้หนึ่ง worker
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริง โดยเปิด diagnostics ตามค่าเริ่มต้น
  - ขับเคลื่อน synthetic gateway message, memory และ large-payload churn ผ่านเส้นทาง diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - ตรวจสอบว่า recorder ยังคงมีขอบเขต, ตัวอย่าง RSS แบบ synthetic ยังต่ำกว่างบแรงกดดัน และความลึกของคิวต่อเซสชันระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็น lane แบบแคบสำหรับติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนของ Gateway suite แบบเต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และ bundled-plugin E2E tests ภายใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` ร่วมกับ `isolate: false` เหมือนส่วนอื่นของรีโป
  - ใช้ adaptive workers (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันใน silent mode ตามค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- overrides ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (มีเพดานที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดผลลัพธ์ console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ Gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, node pairing และเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกขาดบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ในเครื่องชั่วคราว
  - ทดสอบ OpenShell backend ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - เป็นแบบเลือกใช้เท่านั้น; ไม่ใช่ส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกขาด จากนั้นทำลาย test gateway และ sandbox
- overrides ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบนี้เมื่อรัน broader e2e suite แบบแมนนวล
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง CLI binary หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และ bundled-plugin live tests ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้ง `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?”
  - จับการเปลี่ยนรูปแบบของผู้ให้บริการ, ความแปลกของการเรียกใช้เครื่องมือ, ปัญหาการยืนยันตัวตน และพฤติกรรม rate limit
- ความคาดหวัง:
  - โดยตั้งใจแล้วไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, โควตา, การล่ม)
  - มีค่าใช้จ่าย / ใช้ rate limits
  - ควรรันเฉพาะส่วนย่อยที่แคบ แทนที่จะรัน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อหยิบ API keys ที่ขาดหาย
- ตามค่าเริ่มต้น การรัน live ยังคงแยก `HOME` ออกและคัดลอกวัสดุ config/auth ไปยัง temp test home เพื่อไม่ให้ unit fixtures แก้ไข `~/.openclaw` จริงของคุณ
- ตั้ง `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจต้องการให้ live tests ใช้โฮมไดเรกทอรีจริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นตามค่าเริ่มต้น: มันยังคงแสดงผลความคืบหน้า `[live] ...` แต่ระงับข้อความแจ้ง `~/.profile` เพิ่มเติมและปิดเสียง gateway bootstrap logs/Bonjour chatter ตั้ง `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการล็อกการเริ่มต้นทั้งหมดกลับมา
- การหมุน API key (เฉพาะผู้ให้บริการ): ตั้ง `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือใช้ per-live override ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อเจอการตอบกลับแบบ rate limit
- ผลลัพธ์ความคืบหน้า/heartbeat:
  - ตอนนี้ live suites จะส่งบรรทัดความคืบหน้าไปที่ stderr เพื่อให้การเรียกผู้ให้บริการที่ใช้เวลานานยังดูเหมือนกำลังทำงานอยู่ แม้เมื่อ Vitest console capture เงียบ
  - `vitest.live.config.ts` ปิดการสกัดกั้น console ของ Vitest ดังนั้นบรรทัดความคืบหน้าของผู้ให้บริการ/Gateway จะสตรีมออกทันทีระหว่างการรัน live
  - ปรับ heartbeat ของ direct-model ได้ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeat ของ gateway/probe ได้ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดไหน?

ใช้ตารางการตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบแบบสด (แตะเครือข่าย)

สำหรับ live model matrix, CLI backend smokes, ACP smokes, Codex app-server
harness และการทดสอบสดของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการข้อมูลรับรองสำหรับการรันแบบสด — ดู
[Testing — live suites](/th/help/testing-live)

## ตัวรัน Docker (ตัวเลือกสำหรับการตรวจ “ใช้งานได้บน Linux”)

ตัวรัน Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวรัน live-model: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ที่ตรงกับ profile-key ภายใน repo Docker image (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount local config dir และ workspace ของคุณ (และ source `~/.profile` หากมีการ mount) entrypoints ฝั่ง local ที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรัน Docker live มีค่าเริ่มต้นเป็น smoke cap ที่เล็กลง เพื่อให้การกวาด Docker แบบเต็มยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12`, และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้ override env vars เหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบ exhaustive ที่ใหญ่กว่านี้อย่างชัดเจน
- `test:docker:all` จะ build live Docker image หนึ่งครั้งผ่าน `test:docker:live-build` แล้วใช้ซ้ำสำหรับ live Docker lanes นอกจากนี้ยัง build shared image หนึ่งตัวจาก `scripts/e2e/Dockerfile` ผ่าน `test:docker:e2e-build` และใช้ซ้ำสำหรับ E2E container smoke runners ที่ทดสอบ built app ตัวรวมนี้ใช้ weighted local scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slots ขณะที่ resource caps ป้องกันไม่ให้ lanes แบบ live หนัก, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มี headroom มากขึ้น ตัวรันจะทำ Docker preflight ตามค่าเริ่มต้น, ลบ OpenClaw E2E containers ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ lane timings ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้ timings เหล่านั้นเพื่อเริ่ม lanes ที่ใช้เวลานานก่อนในรอบถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker
- container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะบูตคอนเทนเนอร์จริงหนึ่งตัวหรือมากกว่า และตรวจสอบเส้นทาง integration ระดับสูงกว่า

ตัวรัน Docker สำหรับ live-model จะ bind-mount เฉพาะ homes ของ CLI auth ที่จำเป็นเท่านั้น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปยัง container home ก่อนการรัน เพื่อให้ OAuth ของ external-CLI สามารถรีเฟรชโทเค็นได้โดยไม่แก้ไข host auth store:

- Direct models: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อม strict Droid/OpenCode coverage ผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, full scaffolding): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- smoke ของ onboarding/channel/agent จาก npm tarball: `pnpm test:docker:npm-onboard-channel-agent` จะติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น, ตรวจสอบว่า doctor ซ่อม runtime deps ของ Plugin ที่ activate แล้ว และรันหนึ่ง mocked OpenAI agent turn ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild ฝั่ง host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับช่องด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- smoke ของ update channel switch: `pnpm test:docker:update-channel-switch` จะติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker, สลับจาก package `stable` ไปเป็น git `dev`, ตรวจสอบ persisted channel และ plugin post-update แล้วสลับกลับเป็น package `stable` และตรวจสอบสถานะการอัปเดต
- smoke ของ session runtime context: `pnpm test:docker:session-runtime-context` ตรวจสอบการเก็บทรานสคริปต์ hidden runtime context พร้อม doctor repair ของสาขา prompt-rewrite ที่ซ้ำกันและได้รับผลกระทบ
- smoke ของ Bun global install: `bash scripts/e2e/bun-global-install-smoke.sh` จะ pack tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน isolated home และตรวจสอบว่า `openclaw infer image providers --json` คืนค่า bundled image providers แทนที่จะค้าง ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก built Docker image ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache ร่วมกันหนึ่งชุดระหว่างคอนเทนเนอร์ root, update และ direct-npm ของมัน update smoke มีค่าเริ่มต้นเป็น npm `latest` เป็น stable baseline ก่อนอัปเกรดไปยัง candidate tarball การตรวจสอบ installer แบบ non-root จะคง npm cache แบบแยกขาดไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้ง `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ root/update/direct-npm cache ซ้ำข้ามการ rerun ในเครื่อง
- Install Smoke CI จะข้าม direct-npm global update ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ให้รันสคริปต์ในเครื่องโดยไม่มี env นี้เมื่อจำเป็นต้องครอบคลุม direct `npm install -g`
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) จะ build root Dockerfile image ตามค่าเริ่มต้น, seed สองเอเจนต์ด้วยหนึ่ง workspace ใน isolated container home, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ไว้ ใช้ install-smoke image ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- Gateway networking (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) จะ build source E2E image พร้อม Chromium layer, เริ่ม Chromium ด้วย raw CDP, รัน `browser doctor --deep` และตรวจสอบว่า CDP role snapshots ครอบคลุม link URLs, clickables ที่เลื่อนตำแหน่งด้วย cursor, iframe refs และ frame metadata
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) จะรัน mocked OpenAI server ผ่าน Gateway, ตรวจสอบว่า `web_search` เพิ่ม `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ provider schema ปฏิเสธและตรวจสอบว่ารายละเอียดดิบปรากฏใน Gateway logs
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (real stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + stdio MCP child teardown หลัง isolated cron และ one-shot subagent runs): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, ติดตั้ง/ถอนการติดตั้ง ClawHub, อัปเดต marketplace และเปิดใช้/ตรวจสอบ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้ง `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub แบบสด หรือแทนที่แพ็กเกจค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` จะ build Docker runner image ขนาดเล็กตามค่าเริ่มต้น, build และ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้น mount tarball นั้นเข้าแต่ละ Linux install scenario ใช้อิมเมจเดิมซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้าม host rebuild หลังจาก build ในเครื่องใหม่ ๆ ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่แล้วด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ตัวรวม Docker แบบเต็มจะ pre-pack tarball นี้หนึ่งครั้ง จากนั้นแยก bundled channel checks ออกเป็น lanes อิสระ รวมถึง update lanes แยกสำหรับ Telegram, Discord, Slack, Feishu, memory-lancedb และ ACPX ใช้ `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` เพื่อจำกัด channel matrix เมื่อรัน bundled lane โดยตรง หรือ `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` เพื่อจำกัด update scenario lane นี้ยังตรวจสอบด้วยว่า `channels.<id>.enabled=false` และ `plugins.entries.<id>.enabled=false` ระงับการซ่อม doctor/runtime-dependency
- จำกัด bundled plugin runtime deps ให้แคบลงขณะวนรอบ โดยปิด scenarios ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ prebuild และใช้งาน shared built-app image ซ้ำแบบแมนนวล:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

suite-specific image overrides เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` จะยังมีความสำคัญสูงกว่าเมื่อมีการตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง remote shared image สคริปต์จะ pull มันหากยังไม่มีในเครื่อง ส่วนการทดสอบ Docker ของ QR และ installer ยังคงใช้ Dockerfiles ของตัวเอง เพราะพวกมันตรวจสอบพฤติกรรมแพ็กเกจ/การติดตั้ง ไม่ใช่ shared built-app runtime

ตัวรัน Docker สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบ read-only และ
stage มันเข้าไปยัง workdir ชั่วคราวภายในคอนเทนเนอร์ด้วย วิธีนี้ทำให้ runtime
image มีขนาดเล็ก ขณะเดียวกันยังคงรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตามจริง
ขั้นตอน staging จะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและผลลัพธ์ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และ
`.build` หรือไดเรกทอรีผลลัพธ์ของ Gradle ที่อยู่ในแอป เพื่อไม่ให้ Docker live runs
เสียเวลาหลายนาทีในการคัดลอกอาร์ติแฟกต์ที่เฉพาะเครื่อง
พวกมันยังตั้ง `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ gateway live probes เริ่ม
channel workers จริงของ Telegram/Discord/ฯลฯ ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้นความครอบคลุมของ gateway
live จาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ OpenClaw gateway โดยเปิดใช้ OpenAI-compatible HTTP endpoints,
เริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันที่ปักหมุดไว้ให้ชี้มาที่ gateway นั้น, ลงชื่อเข้าใช้
ผ่าน Open WebUI, ตรวจสอบว่า `/api/models` แสดง `openclaw/default`, จากนั้นส่ง
คำขอแชตจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
อิมเมจ Open WebUI และ Open WebUI อาจต้องทำ cold-start setup ของตัวเองให้เสร็จ
lane นี้คาดหวังคีย์โมเดลสดที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` ตามค่าเริ่มต้น) เป็นวิธีหลักในการให้คีย์นั้นใน Dockerized runs
การรันที่สำเร็จจะพิมพ์ JSON payload ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้เป็นแบบกำหนดแน่นอนและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันจะบูต seeded Gateway
container, เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้น
ตรวจสอบ routed conversation discovery, transcript reads, attachment metadata,
พฤติกรรมของ live event queue, outbound send routing และการแจ้งเตือนแบบช่อง +
permission สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจสอบ notification
จะตรวจ raw stdio MCP frames โดยตรง ดังนั้น smoke นี้จึงตรวจสอบสิ่งที่ bridge
ส่งออกจริง ๆ ไม่ใช่เพียงสิ่งที่ client SDK ใด SDK หนึ่งเผอิญเปิดเผย
`test:docker:pi-bundle-mcp-tools` เป็นแบบกำหนดแน่นอนและไม่ต้องใช้
คีย์โมเดลสด มันจะ build repo Docker image, เริ่ม stdio MCP probe server จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน embedded Pi bundle
MCP runtime, รันเครื่องมือ จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงมี
เครื่องมือ `bundle-mcp` ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองมันออก
`test:docker:cron-mcp-cleanup` เป็นแบบกำหนดแน่นอนและไม่ต้องใช้คีย์โมเดลสด
มันจะเริ่ม seeded Gateway พร้อม stdio MCP probe server จริง, รัน
isolated cron turn และ `/subagents spawn` one-shot child turn จากนั้นตรวจสอบว่า
MCP child process ออกหลังจบแต่ละการรัน

Manual ACP plain-language thread smoke (ไม่อยู่ใน CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- ให้เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจจำเป็นต้องใช้มันอีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบทิ้ง

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อยืนยันเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ config/workspace dirs ชั่วคราวและไม่มี external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับ cached CLI installs ภายใน Docker
- external CLI auth dirs/files ภายใต้ `$HOME` จะถูก mount แบบ read-only ภายใต้ `/host-auth...` จากนั้นคัดลอกไปที่ `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันผู้ให้บริการแบบจำกัดขอบเขตจะ mount เฉพาะ dirs/files ที่จำเป็น ซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override แบบแมนนวลได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้อิมเมจ `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการ rerun ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่าข้อมูลรับรองมาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ Gateway เปิดเผยให้กับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override nonce-check prompt ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อ override pinned Open WebUI image tag

## การตรวจสอบเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ Mintlify anchor แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

นี่คือ regressions แบบ “pipeline จริง” ที่ไม่ต้องใช้ผู้ให้บริการจริง:

- การเรียกใช้เครื่องมือของ Gateway (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (กรณี: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + มีการบังคับใช้ auth): `src/gateway/gateway.test.ts` (กรณี: "runs wizard over ws and writes auth token config")

## evals ความเชื่อถือได้ของเอเจนต์ (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งมีลักษณะเหมือน “evals ความเชื่อถือได้ของเอเจนต์”:

- การเรียกใช้เครื่องมือแบบ mock ผ่าน real gateway + agent loop (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบการเชื่อมต่อของเซสชันและผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **Decisioning:** เมื่อมีการระบุ skills ในพรอมป์ เอเจนต์เลือก skill ที่ถูกต้อง (หรือหลีกเลี่ยงตัวที่ไม่เกี่ยวข้อง) หรือไม่?
- **Compliance:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่จำเป็นหรือไม่?
- **Workflow contracts:** สถานการณ์หลายเทิร์นที่ยืนยันลำดับเครื่องมือ, การ carryover ประวัติเซสชัน และขอบเขต sandbox

evals ในอนาคตควรยังคงเป็นแบบกำหนดแน่นอนก่อน:

- scenario runner ที่ใช้ mock providers เพื่อยืนยันการเรียกใช้เครื่องมือ + ลำดับ, การอ่านไฟล์ skill และการเชื่อมต่อของเซสชัน
- ชุดสถานการณ์ขนาดเล็กที่เน้น skill (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- live evals แบบไม่บังคับ (เลือกเปิดใช้, ถูกควบคุมด้วย env) หลังจากที่มีชุดทดสอบที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปแบบของ plugin และ channel)

contract tests ตรวจสอบว่า plugin และ channel ทุกตัวที่ลงทะเบียนไว้
เป็นไปตาม interface contract ของตน มันจะวนผ่าน plugins ที่ค้นพบทั้งหมดและรันชุดของ
การยืนยันรูปแบบและพฤติกรรม default `pnpm test` unit lane ตั้งใจข้าม shared seam และ smoke files เหล่านี้; ให้รันคำสั่ง contract โดยตรงเมื่อคุณแตะพื้นผิว channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรมของ session binding
- **outbound-payload** - โครงสร้าง message payload
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ channel action
- **threading** - การจัดการ thread ID
- **directory** - API ของไดเรกทอรี/บัญชีรายชื่อ
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - การ probe สถานะของช่อง
- **registry** - รูปร่างของ plugin registry

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของ auth flow
- **auth-choice** - การเลือก/การคัดเลือก auth
- **catalog** - API ของ model catalog
- **discovery** - การค้นหา Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของผู้ให้บริการ
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - setup wizard

### เมื่อใดควรรัน

- หลังจากเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังจากเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลังจาก refactor การลงทะเบียนหรือการค้นหา Plugin

contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหาผู้ให้บริการ/โมเดลที่ค้นพบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าทำได้ (mock/stub ผู้ให้บริการ หรือจับการแปลงรูปร่างคำขอที่แน่นอน)
- หากโดยเนื้อแท้เป็น live-only (rate limits, นโยบาย auth) ให้คง live test ไว้แบบแคบและ opt-in ผ่าน env vars
- ควรกำหนดเป้าหมายไปยังชั้นที่เล็กที่สุดที่จับบั๊กได้:
  - บั๊กการแปลงคำขอ/การเล่นซ้ำของผู้ให้บริการ → direct models test
  - บั๊กของ gateway session/history/tool pipeline → gateway live smoke หรือ CI-safe gateway mock test
- ราวกันตกของ SecretRef traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะดึง sampled target หนึ่งรายการต่อ SecretRef class จาก registry metadata (`listSecretTargetRegistryEntries()`), จากนั้นยืนยันว่า exec ids ที่เป็น traversal-segment ถูกปฏิเสธ
  - หากคุณเพิ่ม `includeInPlan` SecretRef target family ใหม่ใน `src/secrets/target-registry-data.ts`, ให้อัปเดต `classifyTargetClass` ในการทดสอบนั้น การทดสอบนี้ตั้งใจให้ล้มเหลวเมื่อเจอ target ids ที่ยังไม่ได้จัดประเภท เพื่อไม่ให้ class ใหม่ถูกข้ามไปอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [Testing live](/th/help/testing-live)
- [CI](/th/ci)
