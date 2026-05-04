---
read_when:
    - การเรียกใช้การทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบรีเกรสชันสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, รันเนอร์ Docker และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-04T07:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และอะไรที่ตั้งใจ _ไม่_ ครอบคลุม)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ภายในเครื่อง, ก่อน push, การดีบัก)
- live tests ค้นพบข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, command surface, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) — ข้อมูลอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [QA channel](/th/channels/qa-channel) — synthetic transport plugin ที่ใช้โดย scenario ที่อ้างอิง repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน QA-specific runners ด้านล่าง ([QA-specific runners](#qa-specific-runners)) แสดงรายการการเรียกใช้ `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ในวันส่วนใหญ่:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite ภายในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรพอ: `pnpm test:max`
- วงจร Vitest watch โดยตรง: `pnpm test:watch`
- การเจาะจงไฟล์โดยตรงตอนนี้ route เส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรใช้ targeted runs ก่อนเมื่อคุณกำลังวนแก้ failure เดียว
- ไซต์ QA ที่อิง Docker: `pnpm qa:lab:up`
- QA lane ที่อิง Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะ tests หรือต้องการความมั่นใจเพิ่มเติม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ creds จริง):

- ชุด live (models + gateway tool/image probes): `pnpm test:live`
- เจาะจง live file เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงาน runtime performance: dispatch `OpenClaw Performance` พร้อม
  `live_gpt54=true` สำหรับ agent turn จริงของ `openai/gpt-5.4` หรือ
  `deep_profile=true` สำหรับ artifact CPU/heap/trace ของ Kova การรันรายวันตามกำหนดเวลา
  เผยแพร่ artifact ของ mock-provider, deep-profile, และ GPT 5.4 lane ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว รายงาน
  mock-provider ยังรวมตัวเลขระดับ source สำหรับ gateway boot, memory,
  plugin-pressure, fake-model hello-loop ซ้ำ, และ CLI startup ด้วย
- Docker live model sweep: `pnpm test:docker:live-models`
  - โมเดลที่เลือกแต่ละตัวตอนนี้รัน text turn พร้อม probe ขนาดเล็กแบบ file-read-style
    โมเดลที่ metadata ประกาศอินพุต `image` จะรัน tiny image turn ด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกตรวจ failure ของผู้ให้บริการ
  - coverage ใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวม Docker live model matrix jobs แยกตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ที่มี signal สูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller
    แบบ scheduled/release ของไฟล์นั้น
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับเส้นทาง Codex app-server, bind synthetic
    Slack DM ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบ plain reply และ image attachment
    route ผ่าน native plugin binding แทน ACP
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turns ผ่าน Codex app-server harness ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models`, และโดยค่าเริ่มต้นจะทดสอบ image,
    cron MCP, sub-agent, และ Guardian probes ปิด sub-agent probe ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกตรวจ failure อื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลังจาก sub-agent probe เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in belt-and-suspenders สำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    โดยทดสอบ `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบ persistent,
    ตอบกลับ `/crestodian yes`, และตรวจสอบเส้นทางการเขียน audit/config
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม fake Claude CLI บน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ที่ว่างเปล่า, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord plugin + SecretRef writes,
    ตรวจสอบ config, และตรวจสอบ audit entries เส้นทางตั้งค่า Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab ด้วย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Moonshot/Kimi cost smoke: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json`, จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบ isolated กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการ failure case เดียวเท่านั้น ควรจำกัด live tests ให้แคบลงด้วย allowlist env vars ที่อธิบายไว้ด้านล่าง
</Tip>

## QA-specific runners

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ PR workflow แบบ standalone
การตรวจสอบแบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อม mock parity lane, live
Matrix lane, Convex-managed live Telegram lane, และ Convex-managed live Discord
lane เป็นงานขนาน Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ manual workflow input
ยังเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity รวมถึง fast Matrix และ Telegram lanes ก่อนอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ deterministic
และหลีกเลี่ยงการ startup ปกติของ provider-plugin live transport gateways เหล่านี้
ปิด memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

full release live media shards ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Docker live model/backend shards ใช้อิมเมจร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build ครั้งเดียวต่อ commit
ที่เลือก แล้วจึง pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อ้างอิงรีโปโดยตรงบนโฮสต์
  - รันสถานการณ์ที่เลือกหลายรายการแบบขนานเป็นค่าเริ่มต้นด้วย Gateway worker ที่แยกกัน `qa-channel` ใช้ concurrency ค่าเริ่มต้นเป็น 4 (จำกัดตามจำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1` สำหรับเลนแบบอนุกรมเดิม
  - ออกด้วยสถานะไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai`, และ `aimock` `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการภายในเครื่องที่อ้างอิง AIMock สำหรับความครอบคลุมของ fixture เชิงทดลองและ protocol-mock โดยไม่แทนที่เลน `mock-openai` ที่รับรู้สถานการณ์
- `pnpm test:gateway:cpu-scenarios`
  - รันเบนช์มาร์กการเริ่มต้น Gateway พร้อมแพ็กสถานการณ์ QA Lab แบบจำลองขนาดเล็ก (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวมไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - ตั้งค่าสถานะเฉพาะการสังเกต CPU ร้อนที่ต่อเนื่องเป็นค่าเริ่มต้น (`--cpu-core-warn` พร้อม `--hot-wall-warn-ms`) ดังนั้นการพุ่งสั้น ๆ ตอนเริ่มต้นจะถูกบันทึกเป็นเมตริกโดยไม่ดูเหมือนการถดถอยที่ Gateway ใช้ CPU เต็มนานหลายนาที
  - ใช้อาร์ติแฟกต์ `dist` ที่ build แล้ว ให้รัน build ก่อนเมื่อ checkout ยังไม่มีเอาต์พุตรันไทม์ที่ใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รันชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์
  - ใช้แฟล็กการเลือกผู้ให้บริการ/โมเดลเดียวกับ `qa suite`
  - การรันสดจะส่งต่ออินพุต auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    คีย์ผู้ให้บริการจาก env, พาธ config ผู้ให้บริการสดของ QA, และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรีเอาต์พุตต้องอยู่ใต้รูทของรีโปเพื่อให้ guest เขียนกลับผ่าน workspace ที่เมานต์ได้
  - เขียนรายงาน QA ปกติ + สรุป พร้อมล็อก Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อ้างอิง Docker สำหรับงาน QA แบบผู้ปฏิบัติงาน
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน Docker รันการ onboarding คีย์ OpenAI API แบบไม่โต้ตอบ ตั้งค่า Telegram เป็นค่าเริ่มต้น ตรวจสอบว่ารันไทม์ Plugin ที่แพ็กโหลดได้โดยไม่ต้องซ่อมแซม dependency ตอนเริ่มต้น รัน doctor และรันหนึ่ง agent turn ภายในเครื่องกับ endpoint OpenAI จำลอง
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลน packaged-install เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน smoke ของ Docker สำหรับแอปที่ build แล้วแบบกำหนดแน่นอนสำหรับทรานสคริปต์ embedded runtime context ตรวจสอบว่า OpenClaw runtime context ที่ซ่อนอยู่ถูกคงอยู่เป็นข้อความ custom ที่ไม่แสดงผล แทนที่จะรั่วไปยัง user turn ที่มองเห็นได้ จากนั้น seed session JSONL ที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า `openclaw doctor --fix` เขียนใหม่ไปยังสาขาที่ใช้งานพร้อมสำรองข้อมูล
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งตัวเลือกแพ็กเกจ OpenClaw ใน Docker รัน onboarding ของแพ็กเกจที่ติดตั้ง ตั้งค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นนำเลน QA สดของ Telegram มาใช้ซ้ำโดยมีแพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในเครื่องที่ resolve แล้วแทนการติดตั้งจาก registry
  - ใช้ credentials จาก env ของ Telegram หรือแหล่ง credential ของ Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับระบบอัตโนมัติของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ env ของ credential สำหรับ Telegram หรือ Convex บนโฮสต์ก่อนงาน build/install ของ Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อจงใจดีบักการตั้งค่าก่อนมี credential เท่านั้น
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น
  - GitHub Actions เปิดเผยเลนนี้เป็น workflow สำหรับ maintainer แบบ manual
    `NPM Telegram Beta E2E` เลนนี้ไม่รันเมื่อ merge workflow ใช้
    environment `qa-live-shared` และ lease credential CI ของ Convex
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับ proof ของผลิตภัณฑ์แบบ side-run
  กับแพ็กเกจตัวเลือกหนึ่งรายการ โดยรับ trusted ref, npm spec ที่เผยแพร่แล้ว,
  URL tarball HTTPS พร้อม SHA-256, หรือ tarball artifact จากการรันอื่น อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  scheduler Docker E2E ที่มีอยู่ด้วยโปรไฟล์เลน smoke, package, product, full, หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน workflow QA ของ
  Telegram กับอาร์ติแฟกต์ `package-under-test` เดียวกัน
  - proof ผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof ด้วย URL tarball ที่แน่นอนต้องมี digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- proof ด้วยอาร์ติแฟกต์จะดาวน์โหลดอาร์ติแฟกต์ tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    โดยตั้งค่า OpenAI แล้ว จากนั้นเปิดใช้ channel/Plugin ที่ bundled ผ่านการแก้ไข config
  - ตรวจสอบว่า setup discovery ปล่อยให้ Plugin ที่ดาวน์โหลดได้และยังไม่ได้ตั้งค่าไม่ปรากฏอยู่ การซ่อม doctor ครั้งแรกที่ตั้งค่าแล้วจะติดตั้ง Plugin ที่ดาวน์โหลดได้แต่ละตัวที่หายไปอย่างชัดเจน และการ restart ครั้งที่สองจะไม่รันการซ่อมแซม dependency แบบซ่อน
  - ยังติดตั้ง baseline npm รุ่นเก่าที่รู้จัก เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ล้างเศษ dependency ของ Plugin เดิมโดยไม่มีการซ่อม postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke ของการอัปเดต packaged-install แบบ native ข้าม guest ของ Parallels แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรันคำสั่ง `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง สถานะการอัปเดต ความพร้อมของ Gateway และหนึ่ง agent turn ภายในเครื่อง
  - ใช้ `--platform macos`, `--platform windows`, หรือ `--platform linux` ขณะวนปรับบน guest หนึ่งตัว ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุปและสถานะต่อเลน
  - เลน OpenAI ใช้ `openai/gpt-5.5` สำหรับ proof ของ agent-turn สดเป็นค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบโมเดล OpenAI อื่น
  - ครอบการรันภายในเครื่องที่ยาวด้วย timeout ของโฮสต์เพื่อไม่ให้การค้างของ transport Parallels ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียนล็อกเลนแบบซ้อนใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log`, หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลังอัปเดตและการอัปเดตแพ็กเกจบน guest ที่ยังไม่อุ่น ซึ่งยังถือว่าปกติเมื่อ nested npm
    debug log กำลังก้าวหน้า
  - อย่ารัน wrapper แบบรวมนี้ขนานกับเลน smoke ของ Parallels สำหรับ
    macOS, Windows, หรือ Linux แยกต่างหาก เพราะทั้งหมดใช้สถานะ VM ร่วมกันและอาจชนกันที่ snapshot restore, การเสิร์ฟแพ็กเกจ, หรือสถานะ Gateway ของ guest
  - proof หลังอัปเดตรันพื้นผิว Plugin ที่ bundled ปกติ เพราะ facade ของ capability เช่น speech, image generation, และ media
    understanding ถูกโหลดผ่าน API รันไทม์แบบ bundled แม้ตัว agent turn เองจะตรวจเพียงการตอบกลับข้อความง่าย ๆ

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการทดสอบ smoke ของ protocol โดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน QA สดของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่อ้างอิง Docker เฉพาะ source-checkout เท่านั้น — การติดตั้งแบบแพ็กเกจไม่ได้จัดส่ง `qa-lab`
  - CLI เต็ม, แค็ตตาล็อก profile/scenario, env vars, และเลย์เอาต์อาร์ติแฟกต์: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รันเลน QA สดของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้ token ของ driver และ SUT bot จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น id แชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credentials แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled lease
  - ออกด้วยสถานะไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - ต้องมี bot สองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดย SUT bot ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจให้แน่ใจว่า driver bot สามารถสังเกตทราฟฟิก bot ในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป, และอาร์ติแฟกต์ observed-messages ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับของ SUT ที่สังเกตได้

เลน transport สดใช้ contract มาตรฐานเดียวกันร่วมกันเพื่อไม่ให้ transport ใหม่คลาดเคลื่อน เมทริกซ์ความครอบคลุมต่อเลนอยู่ใน [ภาพรวม QA → ความครอบคลุม transport สด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุด synthetic กว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### credentials Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` QA lab จะรับ lease แบบ exclusive จาก pool ที่อ้างอิง Convex, ส่ง Heartbeat
ให้ lease นั้นระหว่างที่เลนกำลังรัน, และปล่อย lease เมื่อ shutdown

scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env vars ที่ต้องมี:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

env vars ทางเลือก:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id ทางเลือก)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ `http://` สำหรับ local loopback เพื่อการพัฒนาภายในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin สำหรับ maintainer (เพิ่ม/ลบ/แสดงรายการ pool) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจสอบ URL ไซต์ Convex, secret ของ broker,
prefix ของ endpoint, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

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
- `POST /admin/add` (secret สำหรับ maintainer เท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (secret สำหรับ maintainer เท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ยัง active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret สำหรับ maintainer เท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบ payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่มีรูปแบบไม่ถูกต้อง

### การเพิ่มช่องทางไปยัง QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำคือ: implement transport runner บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>` และเขียน scenario ภายใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดว่าชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (พร้อมความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- การกำหนดค่า: การรันที่ไม่ได้ target ใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config รายโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ UI unit ทำงานใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ใน process (การ auth ของ Gateway, routing, tooling, parsing, config)
  - regression ที่กำหนดผลได้แน่นอนสำหรับ bug ที่รู้จัก
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้ key จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ซอร์สของ Plugin ที่ bundle มาจริง การโหลด API ของ Plugin จริงอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` ที่ไม่ได้ target จะรัน config shard ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทน process root-project native ขนาดใหญ่ชุดเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลด และป้องกันไม่ให้งาน auto-reply/extension แย่งทรัพยากรจน suite ที่ไม่เกี่ยวข้องขาดทรัพยากร
    - `pnpm test --watch` ยังใช้ graph โปรเจกต์ `vitest.config.ts` root native เพราะ watch loop แบบหลาย shard ไม่เหมาะในทางปฏิบัติ
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะ route target ไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน scoped lanes ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงหลีกเลี่ยงต้นทุน startup ของ root project ทั้งหมด
    - `pnpm test:changed` ขยาย path ของ git ที่เปลี่ยนเป็น scoped lanes ราคาถูกตามค่าเริ่มต้น: การแก้ไข test โดยตรง, ไฟล์ sibling `*.test.ts`, การ mapping ซอร์สที่ระบุชัดเจน และ dependent ใน import-graph แบบ local การแก้ไข config/setup/package จะไม่รัน test แบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ smart local check gate ปกติสำหรับงานขอบเขตแคบ โดยจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling จากนั้นรัน typecheck, lint และคำสั่ง guard ที่ตรงกัน คำสั่งนี้ไม่รัน Vitest test; เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อใช้เป็นหลักฐานการทดสอบ การ bump version ที่เป็น release metadata เท่านั้นจะรันการตรวจ version/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอก field version ระดับบนสุด
    - การแก้ไข live Docker ACP harness จะรันการตรวจเฉพาะจุด: syntax ของ shell สำหรับสคริปต์ live Docker auth และ dry-run ของ live Docker scheduler การเปลี่ยนแปลง `package.json` จะรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่น ๆ ยังใช้ guard ที่กว้างกว่า
    - การทดสอบ unit แบบ import-light จาก agents, commands, plugins, helper ของ auto-reply, `plugin-sdk` และพื้นที่ utility ล้วนที่คล้ายกัน จะ route ผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime-heavy ยังคงอยู่บน lane เดิม
    - ไฟล์ซอร์ส helper บางไฟล์ใน `plugin-sdk` และ `commands` ยัง map การรัน changed-mode ไปยัง test sibling ที่ระบุชัดเจนใน lane เบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จึงหลีกเลี่ยงการรัน suite หนักทั้งหมดของไดเรกทอรีนั้นอีกครั้ง
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบน, test integration `reply.*` ระดับบน และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply เพิ่มเป็น shard agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import-heavy หนึ่งชุดครอง Node tail ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้าม extension batch sweep และ shard `agentic-plugins` ที่ใช้เฉพาะ release Full Release Validation dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับ suite ที่เน้น plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยน input ของการค้นพบ message-tool หรือ context runtime ของ compaction
      ให้คง coverage ทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบเจาะจงสำหรับขอบเขต pure routing และ normalization
    - รักษา suite integration ของ embedded runner ให้ healthy:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - Suite เหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม compaction ยังคงไหลผ่าน
      path `run.ts` / `compact.ts` จริง; test เฉพาะ helper ไม่ใช่
      สิ่งทดแทนที่เพียงพอสำหรับ path integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - ค่าเริ่มต้นของ config Vitest พื้นฐานคือ `threads`
    - config Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้
      runner แบบ non-isolated ข้าม root projects, e2e และ config live
    - lane UI root คงการตั้งค่า `jsdom` และ optimizer ของตัวเองไว้ แต่ก็ทำงานบน
      runner non-isolated ที่ใช้ร่วมกันเช่นกัน
    - shard `pnpm test` แต่ละชุดสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจาก config Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` สำหรับ process Node ลูกของ Vitest
      ตามค่าเริ่มต้นเพื่อลด V8 compile churn ระหว่างการรัน local ขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      แบบ stock

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff ทำให้ lane เชิงสถาปัตยกรรมใดทำงาน
    - pre-commit hook ทำเฉพาะ formatting โดย restage ไฟล์ที่ format แล้ว และ
      ไม่รัน lint, typecheck หรือ test
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการ smart local check gate
    - `pnpm test:changed` route ผ่าน scoped lanes ราคาถูกตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract จำเป็นต้องมี
      coverage Vitest ที่กว้างกว่า
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing เดิม
      เพียงแต่ใช้ worker cap ที่สูงขึ้น
    - การ auto-scale worker แบบ local ตั้งใจให้ conservative และถอยลง
      เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุด
      จึงสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - config Vitest พื้นฐานทำเครื่องหมาย projects/config files เป็น
      `forceRerunTriggers` เพื่อให้การ rerun แบบ changed-mode ยังคงถูกต้องเมื่อ
      wiring ของ test เปลี่ยน
    - config เปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บนโฮสต์ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      location cache ที่ระบุชัดเจนหนึ่งแห่งสำหรับ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดการรายงาน import-duration ของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้ง config ใช้ path ของ config เป็น key; shard CI แบบ include-pattern
      จะต่อท้ายชื่อ shard เพื่อให้ติดตาม shard ที่ filtered แยกกันได้
    - เมื่อ test ที่ร้อนหนึ่งตัวยังใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam local `*.runtime.ts` ที่แคบ และ
      mock seam นั้นโดยตรงแทนการ deep-import runtime helper เพียงเพื่อ
      ส่งต่อเข้า `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ route แล้วกับ path root-project native สำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม max RSS ของ macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบันที่ dirty
      โดย route รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และ config Vitest root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead ของ startup และ transform ใน Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profile ของ runner สำหรับ
      suite unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### Stability (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- การกำหนดค่า: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับ churn ของข้อความ Gateway, memory และ large-payload สังเคราะห์ผ่าน path เหตุการณ์ diagnostic
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper persistence ของ diagnostic stability bundle
  - assert ว่า recorder ยังคงมีขอบเขตจำกัด, sample RSS สังเคราะห์อยู่ต่ำกว่า pressure budget และความลึก queue ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - lane แคบสำหรับการติดตาม stability-regression ไม่ใช่สิ่งทดแทน suite Gateway ทั้งหมด

### E2E (smoke test ของ Gateway)

- คำสั่ง: `pnpm test:e2e`
- การกำหนดค่า: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ Plugin ที่บันเดิลไว้ภายใต้ `extensions/`
- ค่าเริ่มต้นของรันไทม์:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของรีโป
  - ใช้เวิร์กเกอร์แบบปรับตามสภาพแวดล้อม (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมดเงียบตามค่าเริ่มต้นเพื่อลดโอเวอร์เฮด I/O ของคอนโซล
- การแทนที่ค่าที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวนเวิร์กเกอร์ (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุตคอนโซลแบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรมแบบ end-to-end ของ gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, การจับคู่ node และระบบเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีชิ้นส่วนที่เคลื่อนไหวมากกว่าการทดสอบหน่วย (อาจช้ากว่า)

### E2E: สโมกของแบ็กเอนด์ OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Gateway OpenShell แบบแยกบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรมระบบไฟล์แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้องเลือกเปิดใช้เท่านั้น ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยก จากนั้นทำลาย test gateway และ sandbox
- การแทนที่ค่าที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือสคริปต์ wrapper ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- การกำหนดค่า: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ Plugin ที่บันเดิลไว้ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?”
  - ตรวจจับการเปลี่ยนรูปแบบของผู้ให้บริการ ความเฉพาะของการเรียกใช้เครื่องมือ ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ตั้งใจให้อยู่ไม่เสถียรสำหรับ CI (เครือข่ายจริง นโยบายผู้ให้บริการจริง quota จริง การหยุดให้บริการ)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันชุดย่อยที่จำกัดขอบเขตแทนการรัน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อรับคีย์ API ที่ขาดหาย
- ตามค่าเริ่มต้น การรัน live ยังแยก `HOME` และคัดลอกวัสดุ config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ fixture ของการทดสอบหน่วยกลายพันธุ์ `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ไดเรกทอรี home จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: ยังคงเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ซ่อนประกาศ `~/.profile` เพิ่มเติมและปิดเสียง log การ bootstrap gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการ log การเริ่มต้นแบบเต็มกลับมา
- การหมุนเวียนคีย์ API (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (ตัวอย่างเช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือแทนที่ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อได้รับการตอบสนอง rate limit
- เอาต์พุตความคืบหน้า/heartbeat:
  - ตอนนี้ชุด live จะส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังทำงานอยู่ แม้เมื่อการจับคอนโซลของ Vitest เงียบ
  - `vitest.live.config.ts` ปิดการดักจับคอนโซลของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/gateway สตรีมทันทีระหว่างการรัน live
  - ปรับ direct-model heartbeats ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ gateway/probe heartbeats ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไขลอจิก/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงมาก)
- แตะระบบเครือข่ายของ gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบ Live (แตะเครือข่าย)

สำหรับเมทริกซ์โมเดล live, สโมกแบ็กเอนด์ CLI, สโมก ACP, harness ของ app-server Codex
และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการข้อมูลรับรองสำหรับการรัน live — ดู
[การทดสอบชุด live](/th/help/testing-live) สำหรับเช็กลิสต์เฉพาะด้านการอัปเดตและ
การตรวจสอบ Plugin ดู
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## Docker runners (การตรวจสอบ “ทำงานใน Linux” แบบไม่บังคับ)

Docker runners เหล่านี้แบ่งเป็นสองกลุ่ม:

- ตัวรัน live-model: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายในอิมเมจ Docker ของรีโป (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรี config และ workspace ในเครื่องของคุณ (และ source `~/.profile` หากเมานต์ไว้) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners ใช้ขีดจำกัดสโมกที่เล็กกว่าเป็นค่าเริ่มต้นเพื่อให้การกวาด Docker ทั้งหมดยังคงใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` แทนที่ env vars เหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบครบถ้วนที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker live หนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/ใช้ซ้ำอิมเมจ `scripts/e2e/Dockerfile` สองรายการ อิมเมจเปล่าเป็นเพียงตัวรัน Node/Git สำหรับ lane การติดตั้ง/อัปเดต/plugin-dependency; lane เหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจ functional ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันของแอปที่ build แล้ว นิยาม lane ของ Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิก planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการ plan ที่เลือก aggregate ใช้ scheduler ในเครื่องแบบมีน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slots ขณะที่ resource caps ป้องกันไม่ให้ lane ที่หนักอย่าง live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า caps ที่ใช้งานอยู่ scheduler ยังสามารถเริ่มได้เมื่อ pool ว่าง แล้วปล่อยให้รันลำพังจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มี headroom มากขึ้น ตัวรันทำ Docker preflight ตามค่าเริ่มต้น ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ พิมพ์สถานะทุก 30 วินาที เก็บเวลาของ lane ที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่ม lane ที่นานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane แบบมีน้ำหนักโดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ plan ของ CI สำหรับ lane ที่เลือก ความต้องการ package/image และข้อมูลรับรอง
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ “tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่?” โดย resolve candidate package หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` จากนั้นรัน lane Docker E2E ที่นำกลับมาใช้ซ้ำได้กับ tarball นั้นโดยตรงแทนการแพ็ก ref ที่เลือกใหม่ โปรไฟล์เรียงตามความกว้าง: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับสัญญา package/update/plugin, เมทริกซ์ published-upgrade survivor, ค่าเริ่มต้นของ release และการ triage ความล้มเหลว
- การตรวจสอบ build และ release จะรัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดินกราฟ built แบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหาก startup ก่อน dispatch นำเข้า package dependencies เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; ยังรักษาขนาด chunk การรัน gateway ที่บันเดิลไว้ให้อยู่ภายใต้งบประมาณและปฏิเสธ static imports ของ cold gateway paths ที่รู้จัก สโมก CLI แบบแพ็กเกจยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่าง metadata ของ package ที่เผยแพร่แล้ว: รายการ private QA inventory ที่ถูกละไว้, `gateway install --wrapper` ที่ขาดหาย, ไฟล์ patch ที่ขาดหายใน git fixture ที่ได้จาก tarball, `update.channel` ที่ไม่ถูก persist, ตำแหน่ง install-record ของ Plugin แบบ legacy, การ persist marketplace install-record ที่ขาดหาย และการย้าย config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นเป็นความล้มเหลวที่เข้มงวด
- ตัวรัน container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` บูตคอนเทนเนอร์จริงหนึ่งตัวหรือมากกว่า และตรวจสอบ path การผสานรวมระดับสูงกว่า

ตัวรัน Docker ของ live-model ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน home ของคอนเทนเนอร์ก่อนรัน เพื่อให้ OAuth ของ CLI ภายนอกรีเฟรช token ได้โดยไม่กลายพันธุ์ที่เก็บ auth ของโฮสต์:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- การทดสอบเบื้องต้นของการ bind ACP: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini โดยค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- การทดสอบเบื้องต้นของแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- การทดสอบเบื้องต้นของ harness สำหรับแอปเซิร์ฟเวอร์ Codex: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- การทดสอบเบื้องต้นด้าน observability: `pnpm qa:otel:smoke` เป็นเลนตรวจซอร์สแบบ private QA จาก checkout โดยตั้งใจไม่รวมอยู่ในเลน Docker release ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- การทดสอบเบื้องต้นแบบ live ของ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, การสร้างโครงครบถ้วน): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- การทดสอบเบื้องต้นของ onboarding/channel/agent สำหรับ npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, ตั้งค่า OpenAI ผ่าน env-ref onboarding พร้อม Telegram โดยค่าเริ่มต้น, รัน doctor และรัน agent turn ของ OpenAI แบบ mock หนึ่งครั้ง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยน channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- การทดสอบเบื้องต้นของการสลับ update channel: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปยัง git `dev`, ตรวจสอบ channel ที่คงค่าไว้และงานหลังอัปเดตของ Plugin แล้วสลับกลับไปยังแพ็กเกจ `stable` และตรวจสถานะอัปเดต
- การทดสอบเบื้องต้นของ upgrade survivor: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มี agents, การตั้งค่า channel, allowlists ของ Plugin, สถานะ dependency ของ Plugin ที่ค้าง, และไฟล์ workspace/session ที่มีอยู่ รัน package update พร้อม doctor แบบ non-interactive โดยไม่มี live provider หรือคีย์ channel จากนั้นเริ่ม Gateway แบบ loopback และตรวจการคงค่าของ config/state รวมถึงงบประมาณ startup/status
- การทดสอบเบื้องต้นของ published upgrade survivor: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น, seed ไฟล์ existing-user ที่สมจริง, ตั้งค่า baseline นั้นด้วย command recipe ที่ฝังไว้, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้ง published นั้นไปยัง candidate tarball, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจ configured intents, การคงค่า state, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC Override baseline เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ aggregate scheduler ขยาย baseline แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `all-since-2026.4.23`, และขยาย fixture รูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin ภายนอกของ OpenClaw แบบอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- การทดสอบเบื้องต้นของ session runtime context: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript ของ hidden runtime context พร้อมการซ่อมแซมด้วย doctor สำหรับ branch prompt-rewrite ที่ซ้ำกันและได้รับผลกระทบ
- การทดสอบเบื้องต้นของการติดตั้ง Bun แบบ global: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` คืน image providers ที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบเบื้องต้นของ Installer Docker: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache เดียวร่วมกันระหว่าง root, update และ direct-npm containers การทดสอบเบื้องต้นของ update ใช้ npm `latest` เป็น baseline stable โดยค่าเริ่มต้นก่อนอัปเกรดเป็น candidate tarball Override ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` แบบ local หรือด้วย input `update_baseline_version` ของ Install Smoke workflow บน GitHub การตรวจ installer แบบ non-root เก็บ npm cache ที่แยกไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำในการรัน local ซ้ำ
- Install Smoke CI ข้ามการอัปเดต direct-npm global ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์แบบ local โดยไม่มี env นั้นเมื่อจำเป็นต้องมีการครอบคลุม `npm install -g` โดยตรง
- การทดสอบเบื้องต้นของ CLI สำหรับ agents delete shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image จาก Dockerfile รากโดยค่าเริ่มต้น, seed agents สองตัวพร้อม workspace หนึ่งรายการใน container home ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ไว้ ใช้ install-smoke image ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- Gateway networking (สอง containers, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- การทดสอบเบื้องต้นของ Browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build source E2E image พร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย raw CDP, รัน `browser doctor --deep` และตรวจสอบว่า CDP role snapshots ครอบคลุม link URLs, clickables ที่ cursor-promoted, iframe refs และ frame metadata
- การถดถอยของ minimal reasoning สำหรับ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบ mock ผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ provider schema ปฏิเสธและตรวจว่ารายละเอียดดิบปรากฏใน Gateway logs
- MCP channel bridge (seeded Gateway + stdio bridge + การทดสอบเบื้องต้นของ raw Claude notification-frame): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ Pi bundle (เซิร์ฟเวอร์ stdio MCP จริง + การทดสอบเบื้องต้นของ allow/deny สำหรับ embedded Pi profile): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การ cleanup MCP ของ Cron/subagent (Gateway จริง + การ teardown ของ stdio MCP child หลังการรัน cron แบบแยกและ one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (การทดสอบเบื้องต้นของการติดตั้ง/อัปเดตสำหรับ local path, `file:`, npm registry ที่มี hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่ package/runtime kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub แบบ local ที่ปิดล้อม
- การทดสอบเบื้องต้นของ Plugin update unchanged: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบเบื้องต้นของ Plugin lifecycle matrix: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วใน container เปล่า, ติดตั้ง npm Plugin, toggle enable/disable, อัปเกรดและดาวน์เกรดผ่าน npm registry แบบ local, ลบโค้ดที่ติดตั้งแล้ว จากนั้นตรวจสอบว่า uninstall ยังลบสถานะค้างได้ พร้อมบันทึกเมตริก RSS/CPU สำหรับแต่ละช่วง lifecycle
- การทดสอบเบื้องต้นของ config reload metadata: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุมการทดสอบเบื้องต้นของ install/update สำหรับ local path, `file:`, npm registry ที่มี hoisted dependencies, git moving refs, ClawHub fixtures, marketplace updates และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรม update unchanged สำหรับ Plugins ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการ install, enable, disable, upgrade, downgrade และ missing-code uninstall ของ npm Plugin พร้อมติดตามทรัพยากร

เพื่อ prebuild และใช้ image functional ที่ใช้ร่วมกันซ้ำแบบ manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

image override เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่า เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง image shared ระยะไกล สคริปต์จะ pull ถ้ายังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer เก็บ Dockerfiles ของตัวเองไว้ เพราะตรวจสอบพฤติกรรม package/install แทนที่จะตรวจ runtime ของแอปที่ build แล้วแบบ shared

ตัวรัน Docker สำหรับ live-model จะ bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวด้วย และ
จัดวางลงใน workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้อิมเมจ runtime
มีขนาดเล็ก ขณะที่ยังคงรัน Vitest กับซอร์ส/คอนฟิกในเครื่องของคุณอย่างตรงตัว
ขั้นตอนการจัดวางจะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและเอาต์พุตบิลด์ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` ของแอปในเครื่องหรือ
Gradle เพื่อให้การรัน Docker แบบ live ไม่ต้องใช้เวลาหลายนาทีในการคัดลอก
อาร์ติแฟกต์เฉพาะเครื่อง
ขั้นตอนเหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้โพรบ live ของ Gateway ไม่เริ่ม
เวิร์กเกอร์ช่องทาง Telegram/Discord/ฯลฯ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้นการครอบคลุม live ของ Gateway
จากเลน Docker นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ระดับสูงกว่า: มันเริ่มคอนเทนเนอร์
Gateway ของ OpenClaw โดยเปิดใช้งาน endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ pin ไว้กับ Gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอแชทจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้องดึงอิมเมจ
Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จก่อน
เลนนี้คาดหวังคีย์โมเดล live ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) เป็นวิธีหลักในการจัดเตรียมคีย์นั้นในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้กำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway
ที่ seed ไว้, เริ่มคอนเทนเนอร์ที่สองที่ spawn `openclaw mcp serve`, จากนั้น
ตรวจสอบการค้นหาบทสนทนาที่ถูก route, การอ่าน transcript, เมตาดาต้าไฟล์แนบ,
พฤติกรรมคิวอีเวนต์ live, การ route การส่งออก, และการแจ้งเตือนช่องทางแบบ Claude +
สิทธิ์ผ่าน stdio MCP bridge จริง การตรวจสอบการแจ้งเตือนจะตรวจดูเฟรม stdio MCP ดิบ
โดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่ bridge ส่งออกจริง ไม่ใช่แค่สิ่งที่ SDK ไคลเอนต์เฉพาะตัวหนึ่งแสดงขึ้นมา
`test:docker:pi-bundle-mcp-tools` ถูกกำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้คีย์โมเดล live
มันบิลด์อิมเมจ Docker ของ repo, เริ่มเซิร์ฟเวอร์โพรบ stdio MCP จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime MCP ของ Pi bundle
ที่ฝังมา, เรียกใช้เครื่องมือ, จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคง
เครื่องมือ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก
`test:docker:cron-mcp-cleanup` ถูกกำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้คีย์โมเดล live
มันเริ่ม Gateway ที่ seed ไว้พร้อมเซิร์ฟเวอร์โพรบ stdio MCP จริง, รัน
turn ของ cron แบบแยกโดดเดี่ยวและ turn ลูกแบบ one-shot ของ `/subagents spawn`, จากนั้นตรวจสอบว่า
โปรเซสลูก MCP ออกหลังจากการรันแต่ละครั้ง

Smoke thread ภาษาธรรมดาของ ACP แบบแมนนวล (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบการ route thread ของ ACP ดังนั้นอย่าลบทิ้ง

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรันเทสต์
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะตัวแปร env ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มีการ mount auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกไปยัง `/home/node/...` ก่อนเริ่มเทสต์
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยคอมมา เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้อิมเมจ `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันซ้ำที่ไม่ต้องบิลด์ใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ Gateway เปิดเผยสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจสอบ nonce ที่ใช้โดย smoke ของ Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อ override tag อิมเมจ Open WebUI ที่ pin ไว้

## การตรวจสุขภาพเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Regression แบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็น regression ของ “pipeline จริง” โดยไม่มี provider จริง:

- การเรียกใช้เครื่องมือของ Gateway (mock OpenAI, Gateway จริง + agent loop จริง): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- วิซาร์ด Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval ความน่าเชื่อถือของ agent (Skills)

เรามีเทสต์ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำงานเหมือน “eval ความน่าเชื่อถือของ agent”:

- การเรียกใช้เครื่องมือแบบ mock ผ่าน Gateway จริง + agent loop จริง (`src/gateway/gateway.test.ts`)
- โฟลว์วิซาร์ดแบบ end-to-end ที่ตรวจสอบ wiring ของ session และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อ Skills ถูกระบุไว้ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยง skill ที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตามข้อกำหนด:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาเวิร์กโฟลว์:** สถานการณ์หลาย turn ที่ assert ลำดับเครื่องมือ, การส่งต่อประวัติ session และขอบเขต sandbox

eval ในอนาคตควรเริ่มจากการกำหนดผลลัพธ์ได้แน่นอนก่อน:

- scenario runner ที่ใช้ provider แบบ mock เพื่อ assert การเรียกใช้เครื่องมือ + ลำดับ, การอ่านไฟล์ skill และ wiring ของ session
- ชุดสถานการณ์ขนาดเล็กที่เน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- eval แบบ live ที่เป็นตัวเลือก (opt-in, ควบคุมด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## เทสต์สัญญา (รูปทรงของ Plugin และช่องทาง)

เทสต์สัญญาตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนทุกรายการสอดคล้องกับ
สัญญาอินเทอร์เฟซของตน เทสต์จะวนผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertion ด้านรูปทรงและพฤติกรรม เลน unit ของ `pnpm test` ค่าเริ่มต้นตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้; ให้รันคำสั่งสัญญาอย่างชัดเจน
เมื่อคุณแตะพื้นผิวช่องทางหรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- สัญญาช่องทางเท่านั้น: `pnpm test:contracts:channels`
- สัญญา provider เท่านั้น: `pnpm test:contracts:plugins`

### สัญญาช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรง Plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญาวิซาร์ดการตั้งค่า
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - handler action ของช่องทาง
- **threading** - การจัดการ thread ID
- **directory** - API directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### สัญญาสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - โพรบสถานะช่องทาง
- **registry** - รูปทรง registry ของ Plugin

### สัญญา provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาโฟลว์ auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API แค็ตตาล็อกโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปทรง/อินเทอร์เฟซของ Plugin
- **wizard** - วิซาร์ดการตั้งค่า

### ควรรันเมื่อใด

- หลังจากเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังจากเพิ่มหรือแก้ไขช่องทางหรือ Plugin provider
- หลังจาก refactor การลงทะเบียนหรือการค้นพบ Plugin

เทสต์สัญญารันใน CI และไม่ต้องใช้คีย์ API จริง

## การเพิ่ม regression (คำแนะนำ)

เมื่อคุณแก้ปัญหา provider/model ที่พบจาก live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (mock/stub provider หรือบันทึกการแปลงรูปทรงคำขอที่ตรงจุด)
- ถ้าเป็นเรื่อง live-only โดยธรรมชาติ (rate limit, นโยบาย auth) ให้เทสต์ live มีขอบเขตแคบและ opt-in ผ่านตัวแปร env
- ควรเล็งไปที่ชั้นที่เล็กที่สุดซึ่งจับบั๊กได้:
  - บั๊กการแปลง/เล่นซ้ำคำขอของ provider → เทสต์ models โดยตรง
  - บั๊ก pipeline ของ session/history/tool ใน Gateway → smoke live ของ Gateway หรือเทสต์ mock ของ Gateway ที่ปลอดภัยสำหรับ CI
- guardrail การ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จากเมตาดาต้า registry (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า exec id ที่มี traversal segment ถูกปฏิเสธ
  - หากคุณเพิ่มตระกูล target ของ SecretRef ใหม่ที่มี `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในเทสต์นั้น เทสต์ตั้งใจให้ล้มเหลวเมื่อพบ target id ที่ยังไม่ได้จัดคลาส เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)
- [CI](/th/ci)
