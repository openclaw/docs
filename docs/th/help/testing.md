---
read_when:
    - การรันการทดสอบภายในเครื่องหรือใน CI
    - เพิ่มการทดสอบถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือการทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-05T06:18:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุดเล็ก ๆ
ของ Docker runners เอกสารนี้เป็นคู่มือ “เราทดสอบอย่างไร”:

- แต่ละชุดครอบคลุมอะไร (และอะไรที่ตั้งใจ _ไม่_ ครอบคลุม)
- คำสั่งใดที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (โลคัล, ก่อน push, การดีบัก)
- การทดสอบกับระบบจริงค้นหา credentials และเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่มการทดสอบการถดถอยสำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, เลนขนส่งแบบใช้ระบบจริง)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) — เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ช่องทาง QA](/th/channels/qa-channel) — transport Plugin สังเคราะห์ที่ใช้โดย scenario ที่อิง repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runners เฉพาะ QA ด้านล่าง ([runners เฉพาะ QA](#qa-specific-runners)) แสดงคำสั่ง `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงข้างต้น
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไป:

- เกตเต็ม (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- รันชุดทดสอบเต็มแบบโลคัลให้เร็วขึ้นบนเครื่องที่มีทรัพยากรมาก: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ route เส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ failure รายการเดียว
- ไซต์ QA ที่มี Docker รองรับ: `pnpm qa:lab:up`
- เลน QA ที่มี Linux VM รองรับ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะ tests หรือต้องการความมั่นใจเพิ่ม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ credentials จริง):

- ชุดทดสอบกับระบบจริง (โมเดล + โพรบเครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพ runtime: dispatch `OpenClaw Performance` พร้อม
  `live_gpt54=true` สำหรับเทิร์น agent จริงของ `openai/gpt-5.4` หรือ
  `deep_profile=true` สำหรับ artifacts CPU/heap/trace ของ Kova การรันตามกำหนดรายวัน
  จะเผยแพร่ artifacts ของเลน mock-provider, deep-profile และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว
  รายงาน mock-provider ยังรวมตัวเลขการบูต Gateway ระดับซอร์ส, หน่วยความจำ,
  plugin-pressure, fake-model hello-loop แบบทำซ้ำ, และการเริ่ม CLI
- การกวาดโมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกตอนนี้รันเทิร์นข้อความพร้อมโพรบเล็ก ๆ แบบอ่านไฟล์
    โมเดลที่ metadata ระบุว่ารับ input แบบ `image` จะรันเทิร์นรูปภาพขนาดเล็กด้วย
    ปิดโพรบเพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกปัญหาของผู้ให้บริการ
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ทั้งคู่เรียกเวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้ด้วย
    `include_live_suites: true` ซึ่งรวม jobs matrix ของ Docker live model แยกต่างหาก
    ที่ shard ตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ที่ให้สัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียกแบบ
    scheduled/release ของมัน
- smoke ของแชต bound ของ Codex แบบ native: `pnpm test:docker:live-codex-bind`
  - รันเลน live ของ Docker กับเส้นทาง app-server ของ Codex, bind Slack DM สังเคราะห์
    ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบ reply ธรรมดาและ attachment รูปภาพ
    ว่า route ผ่าน binding ของ Plugin แบบ native แทน ACP
- smoke ของ harness app-server ของ Codex: `pnpm test:docker:live-codex-harness`
  - รันเทิร์น Gateway agent ผ่าน harness app-server ของ Codex ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models`, และโดยค่าเริ่มต้นจะทดสอบโพรบรูปภาพ,
    cron MCP, sub-agent, และ Guardian ปิดโพรบ sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกปัญหาอื่นของ app-server ของ Codex
    สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิดโพรบอื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    คำสั่งนี้จะออกหลังโพรบ sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke ของคำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in ที่รัดกุมเป็นพิเศษสำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    โดยจะทดสอบ `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบถาวร,
    reply `/crestodian yes`, และตรวจสอบเส้นทางการเขียน audit/config
- smoke ของ planner ของ Crestodian บน Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fallback ของ fuzzy planner แปลงเป็นการเขียน config แบบ typed ที่ผ่าน audit
- smoke ของ first-run ของ Crestodian บน Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ว่าง, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord plugin + การเขียน SecretRef,
    ตรวจสอบ config, และตรวจสอบรายการ audit เส้นทาง setup Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ต้นทุน Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json`, จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเฉพาะ case ที่ล้มเหลวหนึ่งรายการ ควรจำกัดขอบเขตการทดสอบ live ผ่าน env vars แบบ allowlist ที่อธิบายด้านล่าง
</Tip>

## runners เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงของ QA-lab:

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ Agentic parity ซ้อนอยู่ใต้
`QA-Lab - All Lanes` และการตรวจสอบ release ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone
การตรวจสอบแบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release แบบ stable/default
เก็บ exhaustive live/Docker soak ไว้หลัง `run_release_soak=true`; โปรไฟล์
`full` บังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อมเลน mock parity, เลน live
Matrix, เลน Convex-managed live Telegram, และเลน Convex-managed live Discord
เป็น jobs แบบ parallel Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ input ของ manual workflow
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็น jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อมเลน Matrix แบบ fast และ Telegram ก่อนการอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ release transport เพื่อให้ยังคง
deterministic และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway ของ live transport เหล่านี้
ปิด memory search; พฤติกรรมของ memory ยังครอบคลุมโดยชุด QA parity

shards ของ live media สำหรับ full release ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shards ของ Docker live model/backend ใช้ image ร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build ครั้งเดียวต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงกับ repo โดยตรงบนโฮสต์
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการแบบขนานตามค่าเริ่มต้นด้วย worker ของ
    Gateway ที่แยกกัน `qa-channel` มีค่าเริ่มต้นเป็น concurrency 4 (จำกัดด้วย
    จำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ lane แบบ serial เดิม
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่ม server provider แบบ local ที่อิงกับ AIMock สำหรับความครอบคลุม
    fixture และ protocol-mock เชิงทดลอง โดยไม่แทนที่ lane `mock-openai` ที่รับรู้สถานการณ์
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้ gauntlet ของ OpenAI Kitchen Sink Plugin แบบ live ผ่าน QA Lab โดยจะ
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory ของพื้นผิว plugin SDK
    probe `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ Gateway
    เรียกใช้ turn ของ OpenAI แบบ live และตรวจสอบ diagnostics เชิง adversarial
    ต้องมี auth ของ OpenAI แบบ live เช่น `OPENAI_API_KEY` ใน session ของ Testbox
    ที่ hydrated แล้ว จะ source profile live-auth ของ Testbox โดยอัตโนมัติเมื่อมี helper
    `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ bench การเริ่มต้น Gateway พร้อมกับ pack สถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวม
    ไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - flag เฉพาะการสังเกต CPU ที่ร้อนต่อเนื่องตามค่าเริ่มต้น (`--cpu-core-warn`
    ร่วมกับ `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ตอนเริ่มต้นจะถูกบันทึกเป็น metric
    โดยไม่ดูเหมือน regression ของ Gateway ที่ peg อยู่หลายนาที
  - ใช้ artifact `dist` ที่ build แล้ว; ให้ run build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ QA suite เดียวกันภายใน VM Linux แบบใช้แล้วทิ้งของ Multipass
  - คงพฤติกรรมการเลือกสถานการณ์เหมือนกับ `qa suite` บนโฮสต์
  - ใช้ flag การเลือก provider/model ชุดเดียวกับ `qa suite`
  - การ run แบบ live จะ forward input auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    key ของ provider ที่อิงกับ env, path config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีอยู่
  - output dir ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ได้
  - เขียนรายงาน QA + สรุปตามปกติ พร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิงกับ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - build tarball ของ npm จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker เรียกใช้ onboarding แบบ non-interactive ด้วย API key ของ OpenAI ตั้งค่า Telegram
    ตามค่าเริ่มต้น ตรวจสอบว่า runtime ของ Plugin ที่แพ็กมาสามารถโหลดได้โดยไม่ต้องซ่อมแซม
    dependency ตอนเริ่มต้น run doctor และ run agent turn แบบ local หนึ่งครั้งกับ
    endpoint OpenAI ที่ mock ไว้
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อเรียกใช้ lane packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - เรียกใช้ smoke ของ Docker สำหรับ built-app แบบ deterministic สำหรับ transcript ของ embedded runtime context
    โดยตรวจสอบว่า runtime context ที่ซ่อนอยู่ของ OpenClaw ถูก persist เป็น
    custom message ที่ไม่แสดงผล แทนที่จะรั่วเข้าไปใน user turn ที่มองเห็นได้
    จากนั้น seed JSONL ของ session ที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง branch ที่ใช้งานอยู่พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง candidate package ของ OpenClaw ใน Docker เรียกใช้ onboarding ของ installed-package
    ตั้งค่า Telegram ผ่าน CLI ที่ติดตั้ง แล้วนำ lane QA ของ Telegram แบบ live
    มาใช้ซ้ำโดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น Gateway ของ SUT
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball local ที่ resolve แล้วแทนการ
    ติดตั้งจาก registry
  - ใช้ข้อมูลรับรอง env ของ Telegram หรือแหล่งข้อมูลรับรอง Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อมกับ
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret อยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ env ข้อมูลรับรองของ Telegram หรือ Convex บนโฮสต์ก่อนเริ่มงาน
    build/install ของ Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อกำลัง debug การตั้งค่าก่อนมีข้อมูลรับรองโดยเจตนา
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น workflow สำหรับ maintainer แบบ manual
    `NPM Telegram Beta E2E` โดยจะไม่ run เมื่อ merge workflow ใช้
    environment `qa-live-shared` และ lease ข้อมูลรับรอง Convex CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับ proof ของผลิตภัณฑ์แบบ side-run
  กับ candidate package หนึ่งรายการ โดยรับ ref ที่เชื่อถือได้, npm spec ที่เผยแพร่แล้ว,
  URL tarball แบบ HTTPS พร้อม SHA-256 หรือ artifact tarball จาก run อื่น อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นเรียกใช้
  scheduler Docker E2E ที่มีอยู่ด้วย profile lane แบบ smoke, package, product, full หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อเรียกใช้
  workflow QA ของ Telegram กับ artifact `package-under-test` เดียวกัน
  - proof ผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof ด้วย URL tarball แบบเจาะจงต้องมี digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- proof ด้วย artifact จะดาวน์โหลด artifact tarball จาก run ของ Actions อื่น:

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
  - ตรวจสอบว่าการค้นพบการตั้งค่าปล่อยให้ Plugin ที่ดาวน์โหลดได้แต่ยังไม่ได้ตั้งค่าหายไป
    การซ่อมแซม doctor ครั้งแรกที่ตั้งค่าแล้วจะติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายแต่ละตัว
    อย่างชัดเจน และการ restart ครั้งที่สองจะไม่ run การซ่อมแซม dependency ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่รู้จัก เปิดใช้ Telegram ก่อน run
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลัง update ของ candidate
    ล้างเศษ dependency ของ Plugin รุ่นเก่าโดยไม่มีการซ่อมแซม postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - เรียกใช้ smoke การ update packaged-install แบบ native ข้าม guest ของ Parallels แต่ละ
    platform ที่เลือกจะติดตั้ง baseline package ที่ร้องขอก่อน จากนั้นเรียกใช้คำสั่ง
    `openclaw update` ที่ติดตั้งใน guest เดียวกัน และตรวจสอบ version ที่ติดตั้ง
    สถานะ update ความพร้อมของ Gateway และ agent turn แบบ local หนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะ
    iterate บน guest เดียว ใช้ `--json` สำหรับ path artifact สรุปและ
    สถานะราย lane
  - lane OpenAI ใช้ `openai/gpt-5.5` สำหรับ proof ของ agent-turn แบบ live
    ตามค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อกำลัง validate model OpenAI อื่นโดยเจตนา
  - ห่อการ run local ที่ยาวด้วย timeout ของโฮสต์ เพื่อให้ Parallels transport stall ไม่
    ใช้เวลาที่เหลือของหน้าต่างการทดสอบจนหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script เขียน log ของ lane แบบซ้อนใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ภายนอกค้าง
  - การ update บน Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลัง update และ package
    update บน guest ที่เย็น; ยังถือว่าปกติเมื่อ log debug ของ npm แบบซ้อน
    เดินหน้าอยู่
  - อย่า run wrapper แบบ aggregate นี้พร้อมกันกับ lane smoke รายตัวของ Parallels
    สำหรับ macOS, Windows หรือ Linux เพราะทั้งหมดใช้ state ของ VM ร่วมกันและอาจชนกันใน
    การ restore snapshot, การ serve package หรือ state ของ Gateway ใน guest
  - proof หลัง update จะ run พื้นผิว Plugin ที่ bundled ตามปกติ เพราะ
    capability facade เช่น speech, image generation และ media
    understanding ถูกโหลดผ่าน runtime API ที่ bundled แม้ agent
    turn เองจะตรวจเพียง response ข้อความแบบง่ายก็ตาม

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะ server provider AIMock แบบ local สำหรับการทดสอบ smoke ของ protocol โดยตรง
- `pnpm openclaw qa matrix`
  - เรียกใช้ lane QA แบบ live ของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่อิงกับ Docker เฉพาะ source-checkout เท่านั้น — packaged install ไม่ได้ ship `qa-lab`
  - CLI เต็ม, catalog ของ profile/scenario, env var และ layout ของ artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - เรียกใช้ lane QA แบบ live ของ Telegram กับกลุ่ม private จริงโดยใช้ token ของ driver และ SUT bot จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น chat id แบบตัวเลขของ Telegram
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env ตามค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อ opt in ไปใช้ pooled lease
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องมี bot สองตัวที่แตกต่างกันในกลุ่ม private เดียวกัน โดย bot ของ SUT ต้องเปิดเผย username ของ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจสอบให้แน่ใจว่า driver bot สามารถสังเกต traffic ของ bot ในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram สรุป และ artifact observed-messages ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่ตอบกลับจะรวม RTT จากคำขอส่งของ driver ถึง reply ของ SUT ที่สังเกตได้

lane transport แบบ live ใช้ contract มาตรฐานเดียวกันเพื่อให้ transport ใหม่ไม่ drift; matrix ความครอบคลุมราย lane อยู่ใน [ภาพรวม QA → ความครอบคลุม transport แบบ live](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือ suite synthetic แบบกว้างและไม่ได้เป็นส่วนหนึ่งของ matrix นั้น

### ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` แล้ว QA lab จะขอ lease แบบ exclusive จาก pool ที่อิงกับ Convex ส่ง Heartbeat
ให้ lease นั้นขณะ lane กำลัง run และ release lease เมื่อ shutdown

scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env var ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นของ env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, นอกนั้นเป็น `maintainer`)

env var แบบ optional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบ optional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ `http://` ผ่าน loopback สำหรับการพัฒนาแบบ local-only

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin สำหรับผู้ดูแล (pool add/remove/list) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจสอบ URL ไซต์ Convex, ความลับของโบรกเกอร์,
คำนำหน้า endpoint, timeout ของ HTTP และความสามารถในการเข้าถึง admin/list โดยไม่พิมพ์
ค่าความลับ ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

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
- `POST /admin/add` (ความลับของผู้ดูแลเท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ความลับของผู้ดูแลเท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - การป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ความลับของผู้ดูแลเท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบเพย์โหลดสำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธเพย์โหลดที่มีรูปแบบไม่ถูกต้อง

### การเพิ่มช่องทางลงใน QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำคือ: ติดตั้งตัวรัน transport บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, เมานต์เป็น `openclaw qa <runner>` และเขียนสถานการณ์ไว้ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรถูกรันที่ไหน)

ให้คิดถึงชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### ยูนิต / อินทิเกรชัน (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- การกำหนดค่า: การรันที่ไม่เจาะจงเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config รายโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบยูนิต UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบยูนิตล้วน
  - การทดสอบอินทิเกรชันในโปรเซส (การยืนยันตัวตน Gateway, การกำหนดเส้นทาง, เครื่องมือ, การแยกวิเคราะห์, config)
  - รีเกรสชันแบบกำหนดแน่นอนสำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่ bundle มาจริง การโหลด API ของ Plugin จริงอยู่ใน
    ชุดทดสอบสัญญา/อินทิเกรชันที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="โปรเจกต์, shard และ lane แบบกำหนดขอบเขต">

    - `pnpm test` ที่ไม่เจาะจงเป้าหมายรัน config shard ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนโปรเซส root-project ดั้งเดิมขนาดใหญ่ตัวเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลด และหลีกเลี่ยงไม่ให้งาน auto-reply/extension ทำให้ชุดทดสอบที่ไม่เกี่ยวข้องขาดทรัพยากร
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ root ดั้งเดิม `vitest.config.ts` เพราะลูป watch แบบหลาย shard ไม่เหมาะในทางปฏิบัติ
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` กำหนดเส้นทางเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน lane แบบกำหนดขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงหลีกเลี่ยงต้นทุนการเริ่มโปรเจกต์ root เต็มรูปแบบ
    - `pnpm test:changed` ขยายพาธ git ที่เปลี่ยนเป็น lane แบบกำหนดขอบเขตราคาถูกโดยค่าเริ่มต้น: การแก้ไขการทดสอบโดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน และ dependent ในกราฟ import เฉพาะที่ การแก้ไข config/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบแบบ smart local ปกติสำหรับงานแคบ มันจัดประเภท diff เป็น core, การทดสอบ core, extensions, การทดสอบ extension, apps, docs, release metadata, เครื่องมือ Docker แบบ live และ tooling จากนั้นรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest; เรียก `pnpm test:changed` หรือ `pnpm test <target>` แบบระบุชัดเจนสำหรับหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็น release metadata เท่านั้นรันการตรวจสอบเวอร์ชัน/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยน package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข harness Docker ACP แบบ live รันการตรวจสอบเฉพาะจุด: ไวยากรณ์ shell สำหรับสคริปต์ยืนยันตัวตน Docker แบบ live และ dry-run ของ scheduler Docker แบบ live การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่น ๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบยูนิตที่ import เบาจาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีล้วนที่คล้ายกันจะถูกกำหนดเส้นทางผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime หนักจะยังอยู่บน lane เดิม
    - ไฟล์ซอร์สตัวช่วย `plugin-sdk` และ `commands` ที่เลือกไว้ยังแมปการรันโหมด changed ไปยังการทดสอบพี่น้องที่ระบุชัดเจนใน lane เบาเหล่านั้น ดังนั้นการแก้ไขตัวช่วยจึงหลีกเลี่ยงการรันชุดทดสอบหนักเต็มรูปแบบของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับตัวช่วย core ระดับบน, การทดสอบอินทิเกรชัน `reply.*` ระดับบน และซับทรี `src/auto-reply/reply/**` CI ยังแยกซับทรี reply เพิ่มเป็น shard สำหรับ agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักหนึ่งตัวครอบครองส่วนท้ายของ Node ทั้งหมด
    - CI ของ PR/main ปกติจงใจข้าม batch sweep ของ extension และ shard `agentic-plugins` สำหรับ release เท่านั้น Full Release Validation dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="ความครอบคลุมของ runner แบบฝัง">

    - เมื่อคุณเปลี่ยนอินพุตการค้นพบ message-tool หรือบริบท runtime ของ compaction
      ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่มรีเกรสชันตัวช่วยแบบเจาะจงสำหรับ boundary ของการกำหนดเส้นทางและการทำ normalization แบบล้วน
    - รักษาชุดทดสอบอินทิเกรชันของ runner แบบฝังให้สมบูรณ์:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านั้นตรวจสอบว่า id แบบกำหนดขอบเขตและพฤติกรรม compaction ยังคงไหล
      ผ่านพาธ `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะตัวช่วย
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธอินทิเกรชันเหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ pool และ isolation ของ Vitest">

    - config พื้นฐานของ Vitest มีค่าเริ่มต้นเป็น `threads`
    - config Vitest ที่ใช้ร่วมกันตรึง `isolate: false` และใช้
      runner แบบไม่แยก isolation ในโปรเจกต์ root, e2e และ config live
    - lane UI root คง setup และ optimizer ของ `jsdom` ไว้ แต่ก็รันบน
      runner แบบไม่แยก isolation ที่ใช้ร่วมกันเช่นกัน
    - shard `pnpm test` แต่ละตัวสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจาก config Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้โปรเซส Node ลูกของ Vitest
      โดยค่าเริ่มต้น เพื่อลด churn การคอมไพล์ V8 ระหว่างการรัน local ขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="การวนซ้ำแบบ local ที่รวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้น lane สถาปัตยกรรมใดบ้าง
    - hook pre-commit เป็นการจัดรูปแบบเท่านั้น มัน stage ไฟล์ที่จัดรูปแบบแล้วอีกครั้ง และ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่อหรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบแบบ smart local
    - `pnpm test:changed` กำหนดเส้นทางผ่าน lane แบบกำหนดขอบเขตราคาถูกโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract จำเป็นต้องมี
      ความครอบคลุม Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการกำหนดเส้นทาง
      เดิมไว้ เพียงแต่มี worker cap ที่สูงขึ้น
    - การปรับขนาด worker local อัตโนมัติจงใจตั้งค่าแบบอนุรักษ์นิยม และถอยกลับ
      เมื่อค่าเฉลี่ยโหลดของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกัน
      จึงสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - config พื้นฐานของ Vitest ทำเครื่องหมายโปรเจกต์/ไฟล์ config เป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำในโหมด changed ยังคงถูกต้องเมื่อ wiring ของการทดสอบ
      เปลี่ยนไป
    - config คง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดไว้บนโฮสต์ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนหนึ่งตำแหน่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดการรายงานระยะเวลา import ของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปยัง `.artifacts/vitest-shard-timings.json`
      การรันทั้ง config ใช้พาธ config เป็นคีย์; shard ของ CI แบบ include-pattern
      ต่อท้ายชื่อ shard เพื่อให้ติดตาม shard ที่กรองแล้วแยกกันได้
    - เมื่อการทดสอบที่ร้อนหนึ่งตัวยังใช้เวลาส่วนใหญ่ไปกับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam `*.runtime.ts` เฉพาะที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import ตัวช่วย runtime เพียง
      เพื่อส่งผ่านไปยัง `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูกกำหนดเส้นทางกับพาธ root-project ดั้งเดิมสำหรับ diff ที่ commit แล้ว
      นั้น และพิมพ์ wall time พร้อม RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ที่ dirty ปัจจุบัน
      โดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และ config Vitest root
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ
      startup ของ Vitest/Vite และ overhead ของ transform
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับ
      ชุดยูนิตโดยปิดการทำ parallelism ระดับไฟล์

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- การกำหนดค่า: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงพร้อมเปิด diagnostics โดยค่าเริ่มต้น
  - ขับเคลื่อน churn ของข้อความ gateway, หน่วยความจำ และเพย์โหลดขนาดใหญ่แบบสังเคราะห์ผ่านพาธเหตุการณ์ diagnostic
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วยการคงอยู่ของ bundle เสถียรภาพ diagnostic
  - assert ว่า recorder ยังคงถูกจำกัด, ตัวอย่าง RSS สังเคราะห์อยู่ใต้ budget แรงกดดัน และความลึกของคิวต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - lane แคบสำหรับการติดตามรีเกรสชันด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุด Gateway เต็มรูปแบบ

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, และการทดสอบ E2E ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: ค่าเริ่มต้นคือ 1)
  - รันใน silent mode เป็นค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดใช้ verbose console output อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การ pairing ของ node, และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนที่เคลื่อนไหวมากกว่า unit tests (อาจช้ากว่า)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบ isolated บน host ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile local ชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - เป็นแบบ opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` local พร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolated แล้วทำลาย test gateway และ sandbox
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรัน e2e suite ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง CLI binary หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, และการทดสอบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วย credentials จริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของ provider, รายละเอียดเฉพาะของ tool-calling, ปัญหา auth, และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่ได้ออกแบบให้ stable สำหรับ CI (network จริง, policy ของ provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - แนะนำให้รัน subset ที่จำกัดขอบเขตแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อดึง API keys ที่ขาดอยู่
- โดยค่าเริ่มต้น การรัน live ยังคง isolate `HOME` และคัดลอก config/auth material เข้าไปใน temp test home เพื่อให้ unit fixtures ไม่สามารถเปลี่ยนแปลง `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้ live tests ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ตั้งค่าเริ่มต้นเป็นโหมดที่เงียบกว่า: ยังคงเก็บ progress output `[live] ...` ไว้ แต่ซ่อน notice เพิ่มเติมของ `~/.profile` และปิดเสียง gateway bootstrap logs/Bonjour chatter ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ startup logs แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ rate limit responses
- Output ของ progress/heartbeat:
  - ตอนนี้ live suites จะปล่อย progress lines ไปยัง stderr เพื่อให้เห็นว่า provider calls ที่ใช้เวลานานยังทำงานอยู่ แม้ Vitest console capture จะเงียบ
  - `vitest.live.config.ts` ปิดการดัก console ของ Vitest เพื่อให้ progress lines ของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรัน suite ใด?

ใช้ตารางการตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนหลายอย่าง)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- debug “bot ของฉันล่ม” / failures เฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบ Live (ที่แตะ network)

สำหรับ live model matrix, smoke ของ CLI backend, smoke ของ ACP, harness ของ Codex app-server,
และ live tests ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการ credentials สำหรับการรัน live — ดู
[การทดสอบ live suites](/th/help/testing-live) สำหรับ checklist เฉพาะด้าน update และ
การตรวจสอบ Plugin ดู
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

## Docker runners (การตรวจสอบ "ทำงานใน Linux" แบบ optional)

Docker runners เหล่านี้แบ่งเป็นสองกลุ่ม:

- Live-model runners: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ที่ตรงกับ profile-key ของตนภายใน Docker image ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount local config dir และ workspace ของคุณ (และ source `~/.profile` หาก mount ไว้) entrypoints local ที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners ตั้งค่าเริ่มต้นเป็น smoke cap ที่เล็กกว่า เพื่อให้ full Docker sweep ยังทำได้จริง:
  `test:docker:live-models` ตั้งค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12`, และ
  `test:docker:live-gateway` ตั้งค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env vars เหล่านั้นเมื่อคุณ
  ต้องการ exhaustive scan ที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` build live Docker image หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs`, แล้ว build/reuse image `scripts/e2e/Dockerfile` สองชุด bare image เป็นเพียง Node/Git runner สำหรับ lanes install/update/plugin-dependency; lanes เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้า functional image ติดตั้ง tarball เดียวกันเข้าไปใน `/app` สำหรับ lanes ของ built-app functionality นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` execute plan ที่เลือก aggregate ใช้ weighted local scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slots ขณะที่ resource caps ป้องกันไม่ให้ heavy live, npm-install, และ multi-service lanes เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า caps ที่ใช้งานอยู่ scheduler ยังคงเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วให้รันเดี่ยวต่อไปจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ Docker host มี headroom มากกว่า runner ทำ Docker preflight เป็นค่าเริ่มต้น, ลบ containers OpenClaw E2E ที่ค้างอยู่, พิมพ์ status ทุก 30 วินาที, เก็บ timings ของ lane ที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json`, และใช้ timings เหล่านั้นเพื่อเริ่ม lanes ที่ใช้เวลานานกว่าก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker, หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ CI plan สำหรับ lanes ที่เลือก, ความต้องการ package/image, และ credentials
- `Package Acceptance` คือ package gate แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็น product ได้หรือไม่?" โดย resolve candidate package หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url`, หรือ `source=artifact`, upload เป็น `package-under-test`, แล้วรัน Docker E2E lanes ที่ reusable กับ tarball นั้นโดยตรงแทนการ repack ref ที่เลือก Profiles เรียงตามความครอบคลุม: `smoke`, `package`, `product`, และ `full` ดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) สำหรับ package/update/plugin contract, matrix ของ published-upgrade survivor, ค่าเริ่มต้นของ release, และการ triage failure
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และ fail หาก startup imports ก่อน dispatch ดึง package dependencies เช่น Commander, prompt UI, undici, หรือ logging ก่อน command dispatch; และยังควบคุม bundled gateway run chunk ให้อยู่ใน budget และปฏิเสธ static imports ของ cold gateway paths ที่รู้จัก smoke ของ packaged CLI ยังครอบคลุม root help, onboard help, doctor help, status, config schema, และคำสั่ง model-list
- ความเข้ากันได้ legacy ของ Package Acceptance จำกัดที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่าง metadata ของ shipped-package: รายการ private QA inventory ที่ถูกละไว้, ไม่มี `gateway install --wrapper`, ไม่มี patch files ใน git fixture ที่ได้จาก tarball, ไม่มี persisted `update.channel`, ตำแหน่ง install-record ของ legacy plugin, ไม่มี marketplace install-record persistence, และการ migration ของ config metadata ระหว่าง `plugins update` สำหรับ packages หลัง `2026.4.25` paths เหล่านั้นเป็น strict failures
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, และ `test:docker:config-reload` boot containers จริงหนึ่งตัวหรือมากกว่าและตรวจสอบ integration paths ระดับสูงกว่า

Live-model Docker runners ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) แล้วคัดลอกเข้าไปใน container home ก่อนการรัน เพื่อให้ external-CLI OAuth สามารถ refresh tokens ได้โดยไม่เปลี่ยนแปลง host auth store:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- การทดสอบ smoke การ bind ของ ACP: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini โดยค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- การทดสอบ smoke ของแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- การทดสอบ smoke ของฮาร์เนสเซิร์ฟเวอร์แอป Codex: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์ dev: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- การทดสอบ smoke ด้านการสังเกตการณ์: `pnpm qa:otel:smoke` เป็นเลน QA แบบเช็กซอร์สเช็กเอาต์ส่วนตัว โดยตั้งใจไม่ให้เป็นส่วนหนึ่งของเลนรีลีส Docker ของแพ็กเกจ เพราะ tarball ของ npm ละเว้น QA Lab
- การทดสอบ smoke แบบ live ของ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- การทดสอบ smoke ของ npm tarball สำหรับ onboarding/ช่องทาง/เอเจนต์: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบอ้างอิง env พร้อม Telegram โดยค่าเริ่มต้น, รัน doctor และรันหนึ่งเทิร์นของเอเจนต์ OpenAI แบบ mock ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บน host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยนช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`
- การทดสอบ smoke การสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปยัง git `dev`, ตรวจสอบช่องทางที่คงอยู่และการทำงานหลังอัปเดตของ Plugin จากนั้นสลับกลับไปยังแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- การทดสอบ smoke การอยู่รอดหลังอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มีเอเจนต์, การกำหนดค่าช่องทาง, allowlist ของ Plugin, สถานะ dependency ของ Plugin ที่ค้างเก่า และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ provider หรือช่องทางแบบ live จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงอยู่ของ config/state พร้อม budget ของ startup/status
- การทดสอบ smoke การอยู่รอดหลังอัปเกรดจากเวอร์ชันที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริง, กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่แล้วนั้นไปยัง tarball ตัวเลือก, รัน doctor แบบไม่โต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intent ที่กำหนดค่าไว้, การคงอยู่ของ state, startup, `/healthz`, `/readyz` และ budget ของสถานะ RPC แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ scheduler แบบ aggregate ขยาย baseline ภายในที่ระบุชัดเจนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยาย fixture ที่มีรูปแบบตาม issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมการติดตั้ง Plugin ภายนอกของ OpenClaw โดยอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`, resolve โทเค็น baseline แบบ meta เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยาย gate แพ็กเกจแบบ release-soak เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- การทดสอบ smoke ของบริบท runtime ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ พร้อมการซ่อมด้วย doctor สำหรับ branch การเขียน prompt ซ้ำที่ซ้ำกันซึ่งได้รับผลกระทบ
- การทดสอบ smoke การติดตั้ง Bun แบบ global: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน provider รูปภาพที่ bundle มาแทนที่จะค้าง ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บน host ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบ smoke ของ installer ใน Docker: `bash scripts/test-install-sh-docker.sh` แชร์แคช npm หนึ่งชุดระหว่างคอนเทนเนอร์ root, update และ direct-npm ของมัน การทดสอบ smoke ของ update ใช้ npm `latest` เป็น baseline stable โดยค่าเริ่มต้นก่อนอัปเกรดไปยัง tarball ตัวเลือก แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ภายในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบ installer แบบ non-root ใช้แคช npm ที่แยกไว้เพื่อไม่ให้รายการแคชที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้แคช root/update/direct-npm ซ้ำระหว่างการรันซ้ำภายในเครื่อง
- Install Smoke CI ข้ามการอัปเดต direct-npm แบบ global ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ภายในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม `npm install -g` โดยตรง
- การทดสอบ smoke ของ CLI สำหรับการลบ workspace ที่แชร์ของเอเจนต์: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build อิมเมจ Dockerfile รากโดยค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อมหนึ่ง workspace ใน home ของคอนเทนเนอร์ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, การ auth ของ WS + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- การทดสอบ smoke ของสแนปช็อต Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build อิมเมจ E2E จากซอร์สพร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่าสแนปช็อต role ของ CDP ครอบคลุม URL ของลิงก์, clickable ที่เลื่อนระดับจาก cursor, ref ของ iframe และ metadata ของ frame
- รีเกรสชัน reasoning ขั้นต่ำของ OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบ mock ผ่าน Gateway, ตรวจสอบว่า `web_search` เพิ่ม `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ของ provider reject และตรวจสอบว่า detail ดิบปรากฏใน log ของ Gateway
- บริดจ์ช่องทาง MCP (Gateway ที่ seed แล้ว + stdio bridge + การทดสอบ smoke ของเฟรม notification ดิบของ Claude): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ในบันเดิล Pi (เซิร์ฟเวอร์ MCP แบบ stdio จริง + การทดสอบ smoke allow/deny ของโปรไฟล์ Pi ที่ฝังไว้): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้างข้อมูล MCP ของ Cron/subagent (Gateway จริง + การ teardown ของ child MCP แบบ stdio หลังการรัน cron แบบ isolated และ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (การทดสอบ smoke การติดตั้ง/อัปเดตสำหรับ local path, `file:`, npm registry ที่มี dependency แบบ hoisted, ref ของ git ที่เคลื่อนที่, ClawHub kitchen-sink, การอัปเดต marketplace และการ enable/inspect บันเดิล Claude): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่ package/runtime แบบ kitchen-sink เริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในแบบ hermetic
- การทดสอบ smoke การอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบ smoke เมทริกซ์วงจรชีวิต Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วในคอนเทนเนอร์เปล่า, ติดตั้ง npm Plugin, สลับ enable/disable, อัปเกรดและดาวน์เกรดผ่าน npm registry ภายใน, ลบโค้ดที่ติดตั้งไว้ จากนั้นตรวจสอบว่า uninstall ยังคงลบ state ที่ค้างอยู่ได้ พร้อมบันทึก metric RSS/CPU สำหรับแต่ละเฟสของวงจรชีวิต
- การทดสอบ smoke metadata การ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` ครอบคลุมการทดสอบ smoke การติดตั้ง/อัปเดตสำหรับ local path, `file:`, npm registry ที่มี dependency แบบ hoisted, ref ของ git ที่เคลื่อนที่, fixture ของ ClawHub, การอัปเดต marketplace และการ enable/inspect บันเดิล Claude `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง npm Plugin ที่ติดตามทรัพยากร, enable, disable, upgrade, downgrade และ uninstall เมื่อโค้ดหายไป

เพื่อ prebuild และใช้ functional image ที่แชร์ร่วมกันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การแทนที่อิมเมจเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจแชร์แบบ remote สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer เก็บ Dockerfile ของตนเองไว้ เพราะตรวจสอบพฤติกรรมของแพ็กเกจ/การติดตั้งแทนที่จะเป็น runtime แอปที่ build แล้วแบบแชร์

Docker runner สำหรับโมเดลจริงจะ bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวด้วย และ
stage ลงใน workdir ชั่วคราวภายใน container วิธีนี้ทำให้ runtime
image มีขนาดเล็ก ขณะเดียวกันยังรัน Vitest กับซอร์ส/คอนฟิกในเครื่องของคุณแบบตรงชุดได้
ขั้นตอน staging จะข้าม cache ขนาดใหญ่ที่มีเฉพาะในเครื่องและผลลัพธ์ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี `.build` หรือ
ผลลัพธ์ Gradle เฉพาะแอป เพื่อให้การรัน Docker live ไม่เสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
รายการเหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ gateway live probe ไม่เริ่ม
worker ของช่องทาง Telegram/Discord/ฯลฯ จริงภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องจำกัดหรือตัด coverage แบบ live ของ gateway
ออกจาก lane ของ Docker นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
container ของ OpenClaw gateway โดยเปิดใช้ HTTP endpoint ที่เข้ากันได้กับ OpenAI,
เริ่ม container ของ Open WebUI เวอร์ชันที่ pin ไว้ให้เชื่อมกับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอแชทจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องทำ setup แบบ cold-start ของตัวเองให้เสร็จก่อน
lane นี้คาดหวัง key ของโมเดล live ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) เป็นวิธีหลักในการจัดหา key นั้นในการรันผ่าน Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง มัน boot container ของ Gateway ที่ seed ไว้,
เริ่ม container ที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจสอบการค้นหาบทสนทนาที่ route แล้ว,
การอ่าน transcript, metadata ของ attachment,
พฤติกรรมคิว event แบบ live, routing การส่งออก และการแจ้งเตือน channel +
permission แบบ Claude ผ่าน bridge stdio MCP จริง การตรวจสอบ notification จะตรวจ
frame stdio MCP ดิบโดยตรง เพื่อให้ smoke ยืนยันสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่แค่สิ่งที่ client SDK เฉพาะตัวบังเอิญแสดงผล
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ key ของโมเดล live
มัน build image Docker ของ repo, เริ่ม server probe MCP แบบ stdio จริง
ภายใน container, materialize server นั้นผ่าน runtime MCP ของ bundle Pi ที่ฝังไว้,
execute tool จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
tool `bundle-mcp` ไว้ ในขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` filter ออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ key ของโมเดล live
มันเริ่ม Gateway ที่ seed ไว้พร้อม server probe MCP แบบ stdio จริง, รัน
turn ของ cron แบบ isolated และ turn ลูกแบบ one-shot ของ `/subagents spawn` จากนั้นตรวจสอบว่า
process ลูกของ MCP exit หลังจากแต่ละ run

Smoke แบบ manual สำหรับ thread ACP ภาษาธรรมชาติ (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow ด้าน regression/debug อาจต้องใช้อีกครั้งสำหรับการตรวจสอบ routing ของ thread ACP ดังนั้นอย่าลบ

Env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี mount สำหรับ auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI แบบ cached ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวไว้ใต้ `/host-auth...` แล้วคัดลอกเข้า `/home/node/...` ก่อนเริ่ม tests
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อ filter provider ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการ rerun ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt สำหรับ nonce-check ที่ smoke ของ Open WebUI ใช้
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image ของ Open WebUI ที่ pin ไว้

## ตรวจสอบความเรียบร้อยของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อต้องตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Regression แบบ offline (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือ regression ของ “pipeline จริง” โดยไม่มี provider จริง:

- การเรียก tool ของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard ของ Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval ความน่าเชื่อถือของ agent (Skills)

เรามี tests ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานคล้าย “eval ความน่าเชื่อถือของ agent”:

- Mock tool-calling ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- Flow ของ wizard แบบ end-to-end ที่ตรวจสอบการ wiring session และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ Skills ใน prompt agent เลือก Skills ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงรายการที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาของ workflow:** scenario หลาย turn ที่ assert ลำดับ tool, การส่งต่อประวัติ session และขอบเขต sandbox

Eval ในอนาคตควรยึด deterministic ก่อน:

- Scenario runner ที่ใช้ mock provider เพื่อ assert การเรียก tool + ลำดับ, การอ่านไฟล์ Skills และ session wiring
- ชุด scenario ขนาดเล็กที่เน้น Skills (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- Eval แบบ live ทางเลือก (opt-in, gated ด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## Contract tests (รูปทรงของ Plugin และ channel)

Contract tests ตรวจสอบว่า Plugin และ channel ที่ลงทะเบียนไว้ทุกรายการสอดคล้องกับ
สัญญา interface ของตัวเอง มัน iterate ผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertion ด้านรูปทรงและพฤติกรรม lane unit ของ `pnpm test` เริ่มต้นจะตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้ ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิว channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- Contract ทั้งหมด: `pnpm test:contracts`
- Contract ของ channel เท่านั้น: `pnpm test:contracts:channels`
- Contract ของ provider เท่านั้น: `pnpm test:contracts:plugins`

### Contract ของ channel

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรงพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - สัญญา setup wizard
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความ inbound
- **actions** - handler สำหรับ action ของ channel
- **threading** - การจัดการ thread ID
- **directory** - API directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Contract ของสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - Probe สถานะ channel
- **registry** - รูปทรงของ Plugin registry

### Contract ของ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญา flow auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API แคตตาล็อกโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - Runtime ของ provider
- **shape** - รูปทรง/interface ของ Plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ issue ของ provider/model ที่พบจาก live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากทำได้ (mock/stub provider หรือ capture การแปลง request-shape ที่ตรงจุด)
- ถ้าเป็นแบบ live-only โดยธรรมชาติ (rate limits, นโยบาย auth) ให้ทำ live test ให้แคบและ opt-in ผ่าน env vars
- เลือก target เป็น layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug ด้านการแปลง/replay request ของ provider → test โมเดลโดยตรง
  - bug ด้าน session/history/tool pipeline ของ gateway → gateway live smoke หรือ test mock gateway ที่ปลอดภัยสำหรับ CI
- Guardrail การ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า exec ids ที่เป็น traversal-segment ถูกปฏิเสธ
  - หากคุณเพิ่ม target family ของ SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ใน test นั้น test ตั้งใจ fail เมื่อเจอ target ids ที่ไม่ได้ classify เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบๆ

## ที่เกี่ยวข้อง

- [Testing live](/th/help/testing-live)
- [Testing updates and plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
