---
read_when:
    - การรันการทดสอบภายในเครื่องหรือใน CI
    - การเพิ่มการทดสอบ regression สำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-02T20:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และจงใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, debugging)
- การทดสอบ live ค้นพบข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**สแตก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียน scenario
- [QA แบบ Matrix](/th/concepts/qa-matrix) — ข้อมูลอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [QA channel](/th/channels/qa-channel) — Plugin ขนส่งจำลองที่ใช้โดย scenario ที่อ้างอิง repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runners เฉพาะ QA ด้านล่าง ([runners เฉพาะ QA](#qa-specific-runners)) แสดงรายการคำสั่ง `qa` ที่ใช้จริงและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไป:

- เกตแบบเต็ม (คาดว่าต้องรันก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มแบบ local ที่เร็วขึ้นบนเครื่องที่มีทรัพยากรมาก: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ route เส้นทาง extension/channel ได้ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ failure เดียว
- ไซต์ QA ที่มี Docker หนุนหลัง: `pnpm qa:lab:up`
- เลน QA ที่มี Linux VM หนุนหลัง: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อ debugging ผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (โมเดล + การ probe เครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงาน performance runtime: dispatch `OpenClaw Performance` พร้อม
  `live_gpt54=true` สำหรับ turn ของ agent `openai/gpt-5.4` จริง หรือ
  `deep_profile=true` สำหรับ artifact CPU/heap/trace ของ Kova การรันตามกำหนดการรายวัน
  publish artifact ของเลน mock-provider, deep-profile, และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว
  รายงาน mock-provider ยังรวมตัวเลข gateway boot ระดับซอร์ส, หน่วยความจำ,
  plugin-pressure, fake-model hello-loop แบบทำซ้ำ, และ CLI startup ด้วย
- การกวาดโมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - โมเดลที่เลือกแต่ละตัวตอนนี้รัน turn แบบข้อความบวก probe ขนาดเล็กแนวอ่านไฟล์
    โมเดลที่ metadata ประกาศว่ารับ input `image` จะรัน turn รูปภาพขนาดเล็กด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยก failure ของผู้ให้บริการ
  - coverage ใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างก็เรียก workflow live/E2E ที่ใช้ซ้ำได้พร้อม
    `include_live_suites: true` ซึ่งรวมงาน matrix ของโมเดล live บน Docker แยกต่างหาก
    โดย shard ตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบโฟกัส ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ของผู้ให้บริการที่สัญญาณสูงใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller
    แบบ scheduled/release ของไฟล์นั้น
- smoke ของ native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รันเลน Docker live กับเส้นทาง app-server ของ Codex, bind Slack DM จำลองด้วย `/codex bind`, ทดลอง `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบว่า reply ธรรมดาและ attachment รูปภาพ
    route ผ่านการ binding Plugin แบบ native แทน ACP
- smoke ของ Codex app-server harness: `pnpm test:docker:live-codex-harness`
  - รัน turn ของ agent Gateway ผ่าน harness app-server ของ Codex ที่ Plugin เป็นเจ้าของ
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้นจะทดลอง probe รูปภาพ,
    cron MCP, sub-agent, และ Guardian ปิด probe sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยก failure อื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบโฟกัส ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลัง probe sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke ของคำสั่งช่วยเหลือ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in เพื่อความมั่นใจซ้ำสำหรับพื้นผิวคำสั่งช่วยเหลือของ message-channel
    โดยทดลอง `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบ persistent,
    reply `/crestodian yes`, และตรวจสอบเส้นทางเขียน audit/config
- smoke ของ Crestodian planner บน Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลงเป็นการเขียน config แบบ typed
    ที่มี audit
- smoke ของ Crestodian first-run บน Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก state dir ของ OpenClaw ที่ว่างเปล่า, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Discord Plugin + SecretRef,
    validate config, และตรวจสอบรายการ audit เส้นทาง setup Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบ isolated กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการแค่ case ที่ fail หนึ่งรายการ ให้จำกัดขอบเขตการทดสอบ live ผ่านตัวแปร env allowlist ที่อธิบายไว้ด้านล่าง
</Tip>

## runners เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ workflow PR แยกเดี่ยว
การ validation แบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อมเลน mock parity, เลน live
Matrix, เลน live Telegram ที่ Convex จัดการ, และเลน live Discord
ที่ Convex จัดการเป็นงาน parallel Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ input ของ manual workflow
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อมเลน fast Matrix และ Telegram ก่อนอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ release transport เพื่อให้ deterministic
และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway ของ live transport เหล่านี้
ปิดการค้นหาหน่วยความจำไว้ พฤติกรรมหน่วยความจำยังคงครอบคลุมโดยชุด QA parity

shard live media สำหรับ release แบบเต็มใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shard โมเดล/backend แบบ Docker live ใช้อิมเมจร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build ครั้งเดียวต่อ commit
ที่เลือก จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงกับ repo โดยตรงบนเครื่องโฮสต์
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการแบบขนานโดยค่าเริ่มต้นด้วย worker
    Gateway ที่แยกกัน `qa-channel` ใช้ concurrency 4 เป็นค่าเริ่มต้น (จำกัดตาม
    จำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับเลนแบบ serial เดิม
  - ออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่บ่งชี้ความล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai`, และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ provider ภายในที่อิงกับ AIMock สำหรับ coverage
    ด้าน fixture เชิงทดลองและ protocol-mock โดยไม่แทนที่เลน
    `mock-openai` ที่รับรู้สถานการณ์
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ bench การเริ่มต้น Gateway พร้อมแพ็กสถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวมไว้ใต้
    `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้นจะ flag เฉพาะการสังเกต CPU ร้อนที่ต่อเนื่อง (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ระหว่างเริ่มต้นจะถูกบันทึกเป็น metric
    โดยไม่ดูเหมือน regression ที่ทำให้ Gateway ใช้ CPU เต็มเป็นเวลาหลายนาที
  - ใช้อาร์ติแฟกต์ `dist` ที่ build แล้ว; ให้รัน build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ QA suite เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์เหมือน `qa suite` บนเครื่องโฮสต์
  - ใช้ flag การเลือก provider/model ชุดเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่อ input การยืนยันตัวตน QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    key ของ provider จาก env, path config ของ QA live provider, และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรี output ต้องอยู่ใต้ root ของ repo เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ได้
  - เขียนรายงาน QA และสรุปตามปกติ พร้อม log ของ Multipass ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิงกับ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker รัน onboarding ของ OpenAI API key แบบไม่โต้ตอบ กำหนดค่า Telegram
    เป็นค่าเริ่มต้น ตรวจสอบว่า runtime ของ Plugin ที่แพ็กไว้โหลดได้โดยไม่ต้อง repair
    dependency ตอนเริ่มต้น รัน doctor และรัน agent turn ภายในหนึ่งครั้งกับ
    endpoint OpenAI แบบ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลน packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน built-app Docker smoke แบบ deterministic สำหรับ transcript ของ embedded runtime context
    ตรวจสอบว่า runtime context ที่ซ่อนอยู่ของ OpenClaw ถูกคงไว้เป็นข้อความ custom
    ที่ไม่แสดงผล แทนที่จะรั่วเข้าไปใน user turn ที่มองเห็นได้ จากนั้น seed ไฟล์ JSONL
    ของ session ที่เสียหายซึ่งได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง branch ที่ใช้งานอยู่พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง candidate package ของ OpenClaw ใน Docker รัน onboarding ของ installed-package
    กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นใช้เลน QA live ของ Telegram
    ซ้ำโดยใช้ package ที่ติดตั้งนั้นเป็น Gateway ของ SUT
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้ง
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ local tarball ที่ resolve แล้วแทนการ
    ติดตั้งจาก registry
  - ใช้ credential env ของ Telegram หรือแหล่ง credential ของ Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้ง
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น
  - GitHub Actions เปิดเผยเลนนี้เป็น workflow maintainer แบบ manual
    `NPM Telegram Beta E2E` เลนนี้ไม่รันเมื่อ merge workflow ใช้
    environment `qa-live-shared` และ lease credential CI ของ Convex
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับ proof ด้านผลิตภัณฑ์แบบ side-run
  กับ candidate package หนึ่งรายการ โดยรับ ref ที่เชื่อถือได้, npm spec ที่เผยแพร่แล้ว,
  URL tarball แบบ HTTPS พร้อม SHA-256 หรืออาร์ติแฟกต์ tarball จาก run อื่น อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  ตัวจัดตาราง Docker E2E ที่มีอยู่ด้วย profile เลน smoke, package, product, full หรือ custom
  ตั้ง `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน workflow QA ของ
  Telegram กับอาร์ติแฟกต์ `package-under-test` เดียวกัน
  - proof ด้านผลิตภัณฑ์ของ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof ด้วย URL tarball แบบ exact ต้องใช้ digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- proof ด้วยอาร์ติแฟกต์จะดาวน์โหลดอาร์ติแฟกต์ tarball จาก Actions run อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    พร้อมกำหนดค่า OpenAI จากนั้นเปิดใช้ channel/plugins ที่ bundle มาผ่านการแก้ไข config
  - ตรวจสอบว่า setup discovery ปล่อยให้ Plugin ที่ดาวน์โหลดได้แต่ยังไม่ได้กำหนดค่าไม่ปรากฏอยู่
    การ repair โดย doctor ครั้งแรกที่กำหนดค่าไว้จะติดตั้ง Plugin ที่ดาวน์โหลดได้แต่ละรายการ
    ที่ขาดหายอย่างชัดเจน และการ restart ครั้งที่สองจะไม่รัน dependency
    repair ที่ซ่อนอยู่
  - ยังติดตั้ง npm baseline รุ่นเก่าที่รู้จัก เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ
    candidate ทำความสะอาดเศษ dependency ของ Plugin รุ่น legacy โดยไม่มี
    postinstall repair ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน update smoke ของ packaged-install แบบ native ข้าม guest ของ Parallels แต่ละ
    platform ที่เลือกจะติดตั้ง baseline package ที่ร้องขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง
    สถานะการอัปเดต ความพร้อมของ Gateway และ agent turn ภายในหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows`, หรือ `--platform linux` ขณะ
    iterate กับ guest หนึ่งรายการ ใช้ `--json` สำหรับ path อาร์ติแฟกต์สรุปและสถานะต่อเลน
  - เลน OpenAI ใช้ `openai/gpt-5.5` สำหรับ proof agent-turn แบบ live โดยค่าเริ่มต้น
    ส่ง `--model <provider/model>` หรือตั้ง
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อตั้งใจ validate โมเดล OpenAI อื่น
  - ครอบการรันภายในที่ยาวด้วย timeout บนโฮสต์ เพื่อไม่ให้ transport ของ Parallels ค้าง
    จนใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียน log ของเลนแบบ nested ไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log`, หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีใน doctor หลังอัปเดตและงานอัปเดต package
    บน guest ที่เย็นอยู่; ยังคงถือว่าปกติเมื่อ debug log ของ npm แบบ nested
    ยังเดินหน้า
  - อย่ารัน wrapper รวมนี้พร้อมกันกับเลน smoke ของ Parallels แต่ละรายการสำหรับ
    macOS, Windows หรือ Linux เลนเหล่านี้ใช้สถานะ VM ร่วมกันและอาจชนกันในการ restore
    snapshot, การ serve package หรือสถานะ Gateway ของ guest
  - proof หลังอัปเดตรัน surface ของ Plugin ที่ bundle มาตามปกติ เพราะ capability facade
    เช่น speech, image generation และ media understanding ถูกโหลดผ่าน API runtime ที่ bundle มา
    แม้ agent turn เองจะตรวจเพียงการตอบกลับข้อความอย่างง่าย

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ภายในสำหรับการทดสอบ protocol smoke โดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน QA live ของ Matrix กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่อิงกับ Docker เฉพาะ source-checkout เท่านั้น — packaged install ไม่ได้จัดส่ง `qa-lab`
  - CLI, catalog ของ profile/scenario, env var และ layout อาร์ติแฟกต์ทั้งหมด: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รันเลน QA live ของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้ token ของ driver และ SUT bot จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น numeric Telegram chat id
  - รองรับ `--credential-source convex` สำหรับ credential แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled lease
  - ออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่บ่งชี้ความล้มเหลว
  - ต้องใช้ bot สองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดย SUT bot ต้องเปิดเผย username ของ Telegram
  - เพื่อให้การสังเกต bot-to-bot เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจสอบว่า driver bot สามารถสังเกต traffic ของ bot ในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และอาร์ติแฟกต์ observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่ตอบกลับจะรวม RTT จาก request ส่งของ driver ถึงการตอบกลับของ SUT ที่สังเกตได้

เลน live transport ใช้สัญญามาตรฐานเดียวกันเพื่อไม่ให้ transport ใหม่ drift; เมทริกซ์ coverage ต่อเลนอยู่ใน [ภาพรวม QA → coverage ของ live transport](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือ suite synthetic แบบกว้างและไม่ใช่ส่วนหนึ่งของเมทริกซ์นั้น

### credential Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` QA lab จะขอ lease แบบ exclusive จาก pool ที่อิงกับ Convex ส่ง Heartbeat
ให้ lease นั้นขณะเลนกำลังรัน และปล่อย lease เมื่อ shutdown

scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env var ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI และ `maintainer` ในกรณีอื่น)

env var แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาภายในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin สำหรับ maintainer (pool add/remove/list) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

CLI helper สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจสอบ URL ไซต์ Convex, broker secret,
endpoint prefix, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์ค่า
secret ใช้ `--json` สำหรับ output ที่เครื่องอ่านได้ในสคริปต์และ utility ของ CI

สัญญา endpoint เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - หมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /admin/add` (เฉพาะความลับของผู้ดูแลเท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะความลับของผู้ดูแลเท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะความลับของผู้ดูแลเท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบ Payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง id แชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่มีรูปแบบไม่ถูกต้อง

### การเพิ่มช่องทางใน QA

ชื่อสถาปัตยกรรมและตัวช่วย scenario สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำคือ: implement transport runner บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>`, และเขียน scenarios ไว้ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดถึงชุดทดสอบเหล่านี้ว่าเป็น “ความสมจริงที่เพิ่มขึ้น” (พร้อมความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันแบบไม่เจาะจงเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config รายโปรเจกต์เพื่อจัดตารางแบบขนาน
- ไฟล์: รายการ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, และ `test/**/*.test.ts`; การทดสอบ unit ของ UI ทำงานใน shard `unit-ui` โดยเฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ใน process (auth ของ Gateway, routing, tooling, parsing, config)
  - regression ที่กำหนดผลได้แน่นอนสำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้ key จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API จากซอร์ส Plugin ที่ bundle มาจริง การโหลด API ของ Plugin จริงอยู่ใน
    ชุดทดสอบ contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="โปรเจกต์, shards, และ lanes แบบ scoped">

    - `pnpm test` แบบไม่เจาะจงเป้าหมายรัน config shard ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทน process root-project native ขนาดใหญ่อันเดียว วิธีนี้ลด peak RSS บนเครื่องที่มีโหลดและหลีกเลี่ยงงาน auto-reply/extension ที่แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังใช้กราฟโปรเจกต์ `vitest.config.ts` root native เพราะ watch loop แบบหลาย shard ทำได้ไม่เหมาะสม
    - `pnpm test`, `pnpm test:watch`, และ `pnpm test:perf:imports` ส่ง target แบบไฟล์/ไดเรกทอรีที่ระบุชัดผ่าน lanes แบบ scoped ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงหลีกเลี่ยงต้นทุน startup ของ root project ทั้งหมด
    - `pnpm test:changed` ขยาย path git ที่เปลี่ยนเป็น lanes แบบ scoped ราคาถูกตามค่าเริ่มต้น: การแก้ไข test โดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัด, และ dependent ใน import-graph เฉพาะที่ การแก้ไข config/setup/package จะไม่รันทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบ local แบบ smart ปกติสำหรับงานแคบ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, และ tooling แล้วรันคำสั่ง typecheck, lint, และ guard ที่ตรงกัน มันไม่รัน Vitest tests; เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเพื่อหลักฐานการทดสอบ การ bump เวอร์ชันแบบ release metadata-only รันการตรวจสอบ version/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอก field เวอร์ชันระดับบนสุด
    - การแก้ไข harness ของ live Docker ACP รันการตรวจสอบแบบ focused: syntax ของ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler live Docker การเปลี่ยนแปลง `package.json` จะรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version, และ surface อื่นของ package ยังใช้ guards ที่กว้างกว่า
    - การทดสอบ unit ที่ import เบาจาก agents, commands, plugins, auto-reply helpers, `plugin-sdk`, และพื้นที่ utility ล้วนที่คล้ายกันจะผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime-heavy จะยังอยู่บน lanes เดิม
    - ไฟล์ซอร์ส helper บางส่วนของ `plugin-sdk` และ `commands` ยังแมปการรัน changed-mode ไปยังการทดสอบพี่น้องที่ระบุชัดใน lanes เบาเหล่านั้นด้วย ทำให้การแก้ไข helper ไม่ต้อง rerun ชุดทดสอบหนักเต็มชุดของไดเรกทอรีนั้น
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด, การทดสอบ integration `reply.*` ระดับบนสุด, และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree ของ reply เพิ่มเป็น shard agent-runner, dispatch, และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักหนึ่งชุดครอง tail ของ Node ทั้งหมด
    - CI ของ PR/main ปกติจงใจข้ามการ sweep batch ของ extension และ shard `agentic-plugins` เฉพาะ release Full Release Validation dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน Plugin/extension เหล่านั้นบน release candidates

  </Accordion>

  <Accordion title="Coverage ของ embedded runner">

    - เมื่อคุณเปลี่ยน inputs สำหรับการค้นหา message-tool หรือ context runtime ของ Compaction
      ให้รักษา coverage ทั้งสองระดับไว้
    - เพิ่ม regression helper แบบ focused สำหรับขอบเขต routing และ normalization
      แบบล้วน
    - รักษาชุดทดสอบ integration ของ embedded runner ให้ healthy:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านั้นยืนยันว่า scoped ids และพฤติกรรม Compaction ยังไหลผ่าน
      path จริงของ `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับ path integration เหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ Vitest pool และ isolation">

    - Config พื้นฐานของ Vitest ใช้ค่าเริ่มต้นเป็น `threads`
    - Config Vitest ที่ใช้ร่วมกัน fix `isolate: false` และใช้
      runner แบบ non-isolated ในโปรเจกต์ root, e2e, และ config live
    - lane UI ของ root คงการตั้งค่า `jsdom` และ optimizer ของตัวเองไว้ แต่ก็รันบน
      runner แบบ non-isolated ที่ใช้ร่วมกันด้วย
    - แต่ละ shard ของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจาก config Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้ process Node ลูกของ Vitest
      ตามค่าเริ่มต้นเพื่อลด churn การ compile ของ V8 ระหว่างการรัน local ขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเทียบกับพฤติกรรม V8
      แบบ stock

  </Accordion>

  <Accordion title="การ iterate local อย่างรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้น lane เชิงสถาปัตยกรรมใด
    - pre-commit hook ทำเฉพาะ formatting เท่านั้น มัน stage ไฟล์ที่ format แล้วอีกครั้งและ
      ไม่รัน lint, typecheck, หรือ tests
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบ local แบบ smart
    - `pnpm test:changed` ส่งผ่าน lanes แบบ scoped ราคาถูกตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package, หรือ contract จำเป็นต้องมี
      coverage Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่มี worker cap ที่สูงขึ้น
    - การ auto-scale worker ใน local ตั้งใจให้ conservative และ back off
      เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายตัว
      จะสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - Config พื้นฐานของ Vitest ทำเครื่องหมาย projects/config files เป็น
      `forceRerunTriggers` เพื่อให้ rerun ใน changed-mode ยังคงถูกต้องเมื่อ wiring ของ test
      เปลี่ยน
    - Config คง `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้ให้เปิดใช้บนโฮสต์ที่รองรับ
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดหนึ่งแห่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบัก perf">

    - `pnpm test:perf:imports` เปิดใช้รายงาน duration ของ import ใน Vitest พร้อม
      output import-breakdown
    - `pnpm test:perf:imports:changed` scope มุมมอง profiling เดียวกันไปยัง
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้ง config ใช้ path ของ config เป็น key; shard CI แบบ include-pattern
      ต่อท้ายชื่อ shard เพื่อให้ shard ที่ถูก filter ติดตามแยกกันได้
    - เมื่อ test ที่ hot หนึ่งตัวยังใช้เวลาส่วนใหญ่ไปกับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam `*.runtime.ts` local ที่แคบ และ
      mock seam นั้นโดยตรงแทนการ deep-import runtime helpers เพียงเพื่อ
      ส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก route กับ path root-project native สำหรับ diff ที่ commit แล้ว
      และพิมพ์ wall time พร้อม max RSS บน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบันที่
      dirty โดยส่งรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และ config Vitest root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profiles ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### Stability (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway loopback จริงโดยเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ message, memory, และ churn ของ payload ขนาดใหญ่ของ gateway สังเคราะห์ผ่าน path event diagnostic
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper persistence ของ diagnostic stability bundle
  - assert ว่า recorder ยังถูกจำกัดขอบเขต, sample RSS สังเคราะห์ยังต่ำกว่างบ pressure, และ queue depth ต่อ session drain กลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - lane แคบสำหรับการติดตาม stability-regression ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, และการทดสอบ E2E ของ bundled-plugin ใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ `threads` ของ Vitest พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: 1 ตามค่าเริ่มต้น)
  - รันในโหมด silent ตามค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด output console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - Surface WebSocket/HTTP, การ pair Node, และ networking ที่หนักขึ้น
- ความคาดหวัง:
  - ทำงานใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell Gateway แบบแยกอิสระบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ภายในเครื่องแบบชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + การ exec ผ่าน SSH
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้องเลือกเปิดใช้เท่านั้น; ไม่อยู่ในการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่อง พร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกอิสระ แล้วทำลาย Gateway ทดสอบและ sandbox
- การ override ที่เป็นประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI ที่ไม่ใช่ค่าเริ่มต้นหรือ wrapper script

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ Plugin ที่บันเดิลไว้ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วย credential จริงหรือไม่?”
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของ provider, ความเฉพาะตัวของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - โดยออกแบบแล้วไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบาย provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่จำกัดขอบเขตแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อดึง API key ที่ขาดไป
- โดยค่าเริ่มต้น การรัน live ยังคงแยก `HOME` และคัดลอกวัสดุ config/auth ไปยัง test home ชั่วคราว เพื่อให้ fixture ของ unit ไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นเป็นค่าเริ่มต้น: ยังคงเก็บ output ความคืบหน้า `[live] ...` แต่ซ่อนประกาศเพิ่มเติมของ `~/.profile` และปิดเสียง log การ bootstrap Gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการให้ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองซ้ำเมื่อได้รับการตอบกลับแบบ rate limit
- Output ความคืบหน้า/Heartbeat:
  - ตอนนี้ชุด live จะส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า call ไปยัง provider ที่ใช้เวลานานยังทำงานอยู่ แม้การจับ console ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการ intercept console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/Gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ Gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / failure เฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบ Live (ที่แตะเครือข่าย)

สำหรับ live model matrix, smoke ของ CLI backend, smoke ของ ACP, harness ของ Codex app-server
และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) รวมถึงการจัดการ credential สำหรับการรัน live ดู
[การทดสอบชุด live](/th/help/testing-live) สำหรับ checklist เฉพาะด้าน update และ
การตรวจสอบ Plugin ดู
[การทดสอบ update และ Plugin](/th/help/testing-updates-plugins)

## Docker runner (การตรวจสอบ "ใช้งานได้ใน Linux" แบบไม่บังคับ)

Docker runner เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- Live-model runner: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายใน repo Docker image (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount config dir และ workspace ภายในเครื่องของคุณ (และ source `~/.profile` หาก mount ไว้) entrypoint ภายในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runner ใช้ smoke cap ที่เล็กกว่าเป็นค่าเริ่มต้น เพื่อให้การ sweep Docker แบบเต็มยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env var เหล่านี้เมื่อคุณ
  ต้องการสแกนแบบละเอียดครบถ้วนที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` สร้าง live Docker image หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/นำ image `scripts/e2e/Dockerfile` สองตัวกลับมาใช้ซ้ำ bare image เป็นเพียง runner ของ Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่สร้างไว้ล่วงหน้า functional image ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันการทำงานของแอปที่ build แล้ว นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` รันแผนที่เลือก aggregate ใช้ scheduler ภายในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slot ขณะที่ resource cap ป้องกันไม่ให้ lane หนักอย่าง live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่เปิดใช้อยู่ scheduler ยังสามารถเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วให้ lane นั้นรันเดี่ยวต่อไปจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ Docker host มี headroom มากขึ้น runner จะทำ Docker preflight เป็นค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่ใช้เวลานานกว่าก่อนในการรันครั้งต่อไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์แผน CI สำหรับ lane ที่เลือก, ความต้องการ package/image และ credential
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ใช้งานเป็นผลิตภัณฑ์ได้หรือไม่?" โดย resolve package ผู้สมัครหนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, upload เป็น `package-under-test` จากนั้นรัน lane Docker E2E ที่ reusable กับ tarball นั้นโดยตรง แทนที่จะ repack ref ที่เลือก profile เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` ดู [การทดสอบ update และ Plugin](/th/help/testing-updates-plugins) สำหรับ contract ของ package/update/Plugin, matrix ของ published-upgrade survivor, ค่าเริ่มต้นของ release และการ triage failure
- การตรวจสอบ build และ release จะรัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และ fail หาก startup ก่อน dispatch import dependency ของ package เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; ยังรักษา bundled gateway run chunk ให้อยู่ต่ำกว่า budget และปฏิเสธ static import ของ cold gateway path ที่รู้จัก smoke ของ packaged CLI ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance ถูกจำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่าง metadata ของ package ที่เคยจัดส่งแล้ว: รายการ private QA inventory ที่ละไว้, `gateway install --wrapper` ที่ขาด, patch file ที่ขาดใน git fixture ที่มาจาก tarball, `update.channel` ที่ persist ไว้ขาดหาย, ตำแหน่ง install-record ของ Plugin แบบ legacy, persistence ของ marketplace install-record ที่ขาด และการ migrate config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นเป็น failure แบบเข้มงวด
- Container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะ boot container จริงหนึ่งตัวหรือมากกว่า และตรวจสอบ path integration ระดับสูง

Live-model Docker runner ยัง bind-mount เฉพาะ CLI auth home ที่จำเป็น (หรือทุกตัวที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปยัง container home ก่อนการรัน เพื่อให้ OAuth ของ external-CLI สามารถ refresh token ได้โดยไม่แก้ไข host auth store:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ควันตรวจ ACP bind: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini เป็นค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- ควันตรวจแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- ควันตรวจฮาร์เนสแอปเซิร์ฟเวอร์ Codex: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์ dev: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- ควันตรวจ Observability: `pnpm qa:otel:smoke` เป็นเลนตรวจสอบซอร์สเช็กเอาต์ QA ส่วนตัว ตั้งใจไม่ให้เป็นส่วนหนึ่งของเลน Docker release ของแพ็กเกจ เพราะ npm tarball ละเว้น QA Lab
- ควันตรวจ Open WebUI แบบ live: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, การ scaffold แบบเต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- ควันตรวจ onboarding/channel/agent ของ Npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบโกลบอลใน Docker, ตั้งค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram เป็นค่าเริ่มต้น, รัน doctor และรันเทิร์นเอเจนต์ OpenAI ที่ mock หนึ่งครั้ง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- ควันตรวจการสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบโกลบอลใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจยืนยันว่า channel ที่บันทึกถาวรและ Plugin หลังอัปเดตทำงาน จากนั้นสลับกลับไปเป็นแพ็กเกจ `stable` และตรวจสถานะอัปเดต
- ควันตรวจผู้รอดจากการอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับฟิกซ์เจอร์ผู้ใช้เก่าแบบสกปรกที่มีเอเจนต์, การตั้งค่า channel, allowlist ของ Plugin, สถานะ dependency ของ Plugin ที่ค้างเก่า และไฟล์ workspace/session ที่มีอยู่ โดยรันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ provider หรือ channel แบบ live จากนั้นเริ่ม Gateway แบบ loopback และตรวจการคงอยู่ของ config/state พร้อมงบประมาณ startup/status
- ควันตรวจผู้รอดจากการอัปเกรดที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` เป็นค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมแบบสมจริง, ตั้งค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้, ตรวจยืนยัน config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นไปยัง tarball ผู้สมัคร, รัน doctor แบบไม่โต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจ intents ที่ตั้งค่าไว้, การคงอยู่ของ state, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC เขียนทับ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ตัวจัดตารางรวมขยาย baseline แบบเจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `all-since-2026.4.23` และขยายฟิกซ์เจอร์ที่มีรูปทรงตาม issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues มี `configured-plugin-installs` สำหรับการซ่อมการติดตั้ง Plugin ภายนอกของ OpenClaw โดยอัตโนมัติ Package Acceptance เปิดเผยสิ่งเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- ควันตรวจบริบท runtime ของ session: `pnpm test:docker:session-runtime-context` ตรวจยืนยันการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ พร้อมการซ่อมของ doctor สำหรับ branch prompt-rewrite ที่ซ้ำและได้รับผลกระทบ
- ควันตรวจการติดตั้ง Bun แบบโกลบอล: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจยืนยันว่า `openclaw infer image providers --json` ส่งคืน provider ภาพที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- ควันตรวจ Docker ของตัวติดตั้ง: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache เดียวกันระหว่างคอนเทนเนอร์ root, update และ direct-npm ของตัวเอง ควันตรวจ update ใช้ npm `latest` เป็น baseline stable ก่อนอัปเกรดไปยัง tarball ผู้สมัครเป็นค่าเริ่มต้น เขียนทับด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วยอินพุต `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจตัวติดตั้งแบบ non-root เก็บ npm cache แบบแยกไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งในเครื่องของผู้ใช้ ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำระหว่างการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดต direct-npm แบบโกลบอลที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องมีการครอบคลุม `npm install -g` โดยตรง
- ควันตรวจ CLI สำหรับการลบ workspace ที่ใช้ร่วมกันของเอเจนต์: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build อิมเมจ Dockerfile รากเป็นค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อม workspace หนึ่งรายการใน home ของคอนเทนเนอร์ที่แยกไว้, รัน `agents delete --json` และตรวจยืนยัน JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, การยืนยันตัวตน WS + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- ควันตรวจ snapshot ของ Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build อิมเมจ E2E จากซอร์สพร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจยืนยันว่า snapshot บทบาท CDP ครอบคลุม URL ของลิงก์, clickable ที่โปรโมตจากเคอร์เซอร์, refs ของ iframe และ metadata ของ frame
- รีเกรสชัน reasoning ขั้นต่ำของ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI ที่ mock ผ่าน Gateway, ตรวจยืนยันว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้สคีมา provider ปฏิเสธและตรวจว่ารายละเอียดดิบปรากฏใน log ของ Gateway
- บริดจ์ MCP channel (Gateway ที่ seed แล้ว + stdio bridge + ควันตรวจ notification-frame ของ Claude แบบดิบ): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ Pi bundle (เซิร์ฟเวอร์ MCP stdio จริง + ควันตรวจ allow/deny ของโปรไฟล์ Pi แบบฝัง): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้าง MCP ของ Cron/subagent (Gateway จริง + การ teardown child ของ stdio MCP หลังการรัน cron แบบแยกและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (ควันตรวจ install/update สำหรับ path ในเครื่อง, `file:`, npm registry พร้อม dependency ที่ hoist แล้ว, ref ของ git ที่เคลื่อนที่ได้, kitchen-sink ของ ClawHub, marketplace updates และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือเขียนทับคู่แพ็กเกจ/runtime kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ฟิกซ์เจอร์ ClawHub ในเครื่องแบบ hermetic
- ควันตรวจการอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- ควันตรวจ metadata ของการ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` ครอบคลุมควันตรวจ install/update สำหรับ path ในเครื่อง, `file:`, npm registry พร้อม dependency ที่ hoist แล้ว, ref ของ git ที่เคลื่อนที่ได้, ฟิกซ์เจอร์ ClawHub, marketplace updates และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรม update ที่ไม่เปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้งแล้ว

หากต้องการ prebuild และใช้อิมเมจ functional ที่แชร์ด้วยตนเองซ้ำ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การเขียนทับอิมเมจเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังชนะเมื่อถูกตั้งค่า เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปที่อิมเมจแชร์ระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ QR และ Docker ของตัวติดตั้งเก็บ Dockerfile ของตัวเองไว้ เพราะทดสอบพฤติกรรมแพ็กเกจ/การติดตั้ง ไม่ใช่ runtime แอปที่ build แล้วแบบแชร์

ตัวรัน Docker ของ live-model ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวและ
stage ไปยัง workdir ชั่วคราวภายในคอนเทนเนอร์ด้วย วิธีนี้ทำให้อิมเมจ runtime
ยังเล็ก ขณะที่ยังรัน Vitest กับซอร์ส/config ในเครื่องของคุณอย่างตรงตัว
ขั้นตอน staging จะข้าม cache เฉพาะเครื่องขนาดใหญ่และ output การ build แอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี output `.build` หรือ
Gradle เฉพาะแอป เพื่อให้การรัน Docker live ไม่เสียเวลาหลายนาทีในการคัดลอก
artifact เฉพาะเครื่อง
ตัวรันเหล่านี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ probe live ของ Gateway ไม่เริ่ม
worker channel ของ Telegram/Discord/อื่น ๆ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องจำกัดหรือยกเว้นการครอบคลุม live ของ Gateway
จากเลน Docker นั้น
`test:docker:openwebui` เป็นควันตรวจความเข้ากันได้ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ OpenClaw gateway โดยเปิด endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ pin ไว้โดยชี้ไปยัง gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจยืนยันว่า `/api/models` เปิดเผย `openclaw/default`, จากนั้นส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้าลงอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull อิมเมจ
Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
เลนนี้คาดหวังคีย์โมเดล live ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` เป็นค่าเริ่มต้น) เป็นวิธีหลักในการจัดหาให้ในการรันแบบ Dockerized
การรันสำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway ที่ seed แล้ว,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้น
ตรวจยืนยันการค้นพบ conversation ที่ route แล้ว, การอ่าน transcript, metadata ของ attachment,
พฤติกรรมคิว event แบบ live, การ route การส่งออก และ notification แบบ channel +
permission สไตล์ Claude ผ่านบริดจ์ MCP stdio จริง การตรวจ notification
ตรวจ frame MCP stdio ดิบโดยตรง ดังนั้นควันตรวจจึงตรวจยืนยันสิ่งที่
บริดจ์ปล่อยออกมาจริง ไม่ใช่เพียงสิ่งที่ SDK client เฉพาะรายใดรายหนึ่งแสดงขึ้นมา
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้คีย์โมเดล live
มัน build อิมเมจ Docker ของ repo, เริ่มเซิร์ฟเวอร์ probe MCP stdio จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime MCP ของ Pi bundle
แบบฝัง, execute เครื่องมือ แล้วตรวจยืนยันว่า `coding` และ `messaging` เก็บ
เครื่องมือ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้คีย์โมเดล live
มันเริ่ม Gateway ที่ seed แล้วพร้อมเซิร์ฟเวอร์ probe MCP stdio จริง, รัน
เทิร์น cron แบบแยกและเทิร์น child แบบ one-shot ของ `/subagents spawn`, จากนั้นตรวจยืนยันว่า
กระบวนการ child ของ MCP ออกหลังการรันแต่ละครั้ง

ควันตรวจเธรด ACP ภาษาธรรมดาแบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow รีเกรสชัน/ดีบัก อาจต้องใช้อีกครั้งสำหรับการตรวจยืนยันการ route เธรด ACP ดังนั้นอย่าลบ

env var ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) เมานต์ไปที่ `/home/node/.profile` และโหลดด้วย source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะตัวแปรสภาพแวดล้อมที่โหลดด้วย source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มีเมานต์การยืนยันตัวตน CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) เมานต์ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI แบบแคชภายใน Docker
- ไดเรกทอรี/ไฟล์การยืนยันตัวตน CLI ภายนอกภายใต้ `$HOME` จะถูกเมานต์แบบอ่านอย่างเดียวภายใต้ `/host-auth...` จากนั้นคัดลอกเข้าไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันผู้ให้บริการแบบจำกัดขอบเขตจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - เขียนทับด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่ซ้ำสำหรับการรันใหม่ที่ไม่จำเป็นต้อง build ใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่าข้อมูลรับรองมาจากที่เก็บโปรไฟล์ (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกรุ่นที่ Gateway เปิดเผยให้ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อเขียนทับพรอมต์ตรวจสอบ nonce ที่ Open WebUI smoke ใช้
- `OPENWEBUI_IMAGE=...` เพื่อเขียนทับแท็ก image ของ Open WebUI ที่ปักหมุดไว้

## การตรวจสอบความสมเหตุสมผลของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`.
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจสอบหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`.

## การถดถอยแบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือการถดถอยของ “pipeline จริง” โดยไม่มีผู้ให้บริการจริง:

- การเรียกใช้เครื่องมือของ Gateway (จำลอง OpenAI, Gateway จริง + ลูป agent จริง): `src/gateway/gateway.test.ts` (กรณี: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- วิซาร์ด Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (กรณี: "runs wizard over ws and writes auth token config")

## การประเมินความน่าเชื่อถือของ agent (skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำงานเหมือน “การประเมินความน่าเชื่อถือของ agent”:

- การเรียกใช้เครื่องมือแบบจำลองผ่าน Gateway จริง + ลูป agent (`src/gateway/gateway.test.ts`).
- โฟลว์วิซาร์ดแบบต้นทางถึงปลายทางที่ตรวจสอบการเชื่อมต่อ session และผลของ config (`src/gateway/gateway.test.ts`).

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อ skills ถูกระบุไว้ในพรอมต์ agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงรายการที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/อาร์กิวเมนต์ที่กำหนดหรือไม่?
- **สัญญาของเวิร์กโฟลว์:** สถานการณ์หลายรอบที่ assert ลำดับเครื่องมือ การส่งต่อประวัติ session และขอบเขต sandbox

การประเมินในอนาคตควรคงความ deterministic ไว้ก่อน:

- ตัวรันสถานการณ์ที่ใช้ผู้ให้บริการจำลองเพื่อ assert การเรียกใช้เครื่องมือ + ลำดับ การอ่านไฟล์ skill และการเชื่อมต่อ session
- ชุดสถานการณ์ขนาดเล็กที่เน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- การประเมินสดแบบเลือกใช้ได้ (opt-in, ควบคุมด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## การทดสอบสัญญา (รูปร่างของ Plugin และช่องทาง)

การทดสอบสัญญาตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนทุกตัวสอดคล้องกับ
สัญญาอินเทอร์เฟซของตน การทดสอบจะวนผ่าน Plugin ที่ค้นพบทั้งหมดและรันชุด
assertion ด้านรูปร่างและพฤติกรรม lane unit ของ `pnpm test` เริ่มต้นตั้งใจ
ข้ามไฟล์ seam ร่วมและ smoke เหล่านี้ ให้รันคำสั่งสัญญาอย่างชัดเจน
เมื่อคุณแตะพื้นผิวช่องทางหรือผู้ให้บริการร่วม

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- เฉพาะสัญญาช่องทาง: `pnpm test:contracts:channels`
- เฉพาะสัญญาผู้ให้บริการ: `pnpm test:contracts:plugins`

### สัญญาช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - สัญญาวิซาร์ดการตั้งค่า
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของช่องทาง
- **threading** - การจัดการ ID ของ thread
- **directory** - API ไดเรกทอรี/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### สัญญาสถานะผู้ให้บริการ

อยู่ใน `src/plugins/contracts/*.contract.test.ts`.

- **status** - การ probe สถานะช่องทาง
- **registry** - รูปร่าง registry ของ Plugin

### สัญญาผู้ให้บริการ

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาโฟลว์ auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API แค็ตตาล็อกโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - รันไทม์ผู้ให้บริการ
- **shape** - รูปร่าง/อินเทอร์เฟซของ Plugin
- **wizard** - วิซาร์ดการตั้งค่า

### ควรรันเมื่อใด

- หลังเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไขช่องทางหรือ Plugin ผู้ให้บริการ
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

การทดสอบสัญญารันใน CI และไม่ต้องใช้คีย์ API จริง

## การเพิ่มการถดถอย (แนวทาง)

เมื่อคุณแก้ปัญหาผู้ให้บริการ/โมเดลที่พบในการรันสด:

- เพิ่มการถดถอยที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (จำลอง/stub ผู้ให้บริการ หรือจับการแปลงรูปร่าง request ที่แน่นอน)
- ถ้าโดยธรรมชาติเป็นแบบ live-only (rate limits, นโยบาย auth) ให้คงการทดสอบสดแบบจำกัดขอบเขตและเลือกใช้ผ่าน env vars
- ควรมุ่งเป้าไปยังเลเยอร์ที่เล็กที่สุดซึ่งจับบั๊กได้:
  - บั๊กการแปลง/replay request ของผู้ให้บริการ → การทดสอบโมเดลโดยตรง
  - บั๊ก pipeline ของ session/history/tool ใน Gateway → gateway live smoke หรือการทดสอบ mock ของ Gateway ที่ปลอดภัยสำหรับ CI
- guardrail การ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` ดึงเป้าหมายตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`) จากนั้น assert ว่า exec ids ที่มีเซกเมนต์ traversal ถูกปฏิเสธ
  - ถ้าคุณเพิ่มตระกูลเป้าหมาย SecretRef `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้ปรับปรุง `classifyTargetClass` ในการทดสอบนั้น การทดสอบตั้งใจให้ล้มเหลวเมื่อพบ target ids ที่ยังไม่ถูกจัดคลาส เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบๆ

## ที่เกี่ยวข้อง

- [การทดสอบแบบสด](/th/help/testing-live)
- [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)
- [CI](/th/ci)
