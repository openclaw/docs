---
read_when:
    - การเรียกใช้การทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบป้องกันการถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบยูนิต/e2e/สด, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละชุดครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-10T19:42:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ “วิธีที่เราทดสอบ”:

- แต่ละชุดครอบคลุมอะไร (และจงใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, debugging)
- วิธีที่การทดสอบ live ค้นหา credentials และเลือก models/providers
- วิธีเพิ่ม regression สำหรับปัญหา model/provider ในโลกจริง

<Note>
**สแตก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) - เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [QA channel](/th/channels/qa-channel) - transport Plugin สังเคราะห์ที่ใช้โดย scenario ที่อิงกับ repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runners เฉพาะ QA ด้านล่าง ([runners เฉพาะ QA](#qa-specific-runners)) แสดงคำสั่ง `qa` ที่เป็นรูปธรรม และชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ในวันส่วนใหญ่:

- gate เต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- รัน full-suite ในเครื่องได้เร็วขึ้นบนเครื่องที่มีทรัพยากรเหลือเฟือ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การเจาะจงไฟล์โดยตรงตอนนี้ route เส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อกำลังวนแก้ failure เดียว ให้เลือก targeted runs ก่อน
- ไซต์ QA ที่มี Docker หนุนหลัง: `pnpm qa:lab:up`
- QA lane ที่มี Linux VM หนุนหลัง: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- coverage gate: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อ debug providers/models จริง (ต้องใช้ creds จริง):

- ชุด live (models + gateway tool/image probes): `pnpm test:live`
- เจาะจงไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพ runtime: dispatch `OpenClaw Performance` พร้อม
  `live_gpt54=true` สำหรับ turn ของ agent `openai/gpt-5.4` จริง หรือ
  `deep_profile=true` สำหรับ artifacts CPU/heap/trace ของ Kova การรันตามกำหนดรายวัน
  publish artifacts ของ lane mock-provider, deep-profile, และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` ไว้ รายงาน
  mock-provider ยังมีตัวเลขระดับซอร์สของ gateway boot, memory,
  plugin-pressure, fake-model hello-loop ซ้ำ, และ CLI startup
- Docker live model sweep: `pnpm test:docker:live-models`
  - model ที่เลือกแต่ละตัวตอนนี้รัน text turn พร้อม probe เล็กแบบอ่านไฟล์
    model ที่ metadata ระบุว่ารับ input `image` จะรัน image turn ขนาดเล็กด้วย
    ปิด probes เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกปัญหา provider
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างก็เรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวมงาน Docker live model matrix แยกต่างหาก
    ที่ shard ตาม provider
  - สำหรับ CI reruns แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ที่ให้สัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ callers
    แบบ scheduled/release ของมัน
- native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับเส้นทาง Codex app-server, bind Slack DM สังเคราะห์
    ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจยืนยัน plain reply และเส้นทาง image attachment
    ผ่าน native plugin binding แทน ACP
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turns ผ่าน Codex app-server harness ที่ Plugin เป็นเจ้าของ,
    ตรวจยืนยัน `/codex status` และ `/codex models`, และตามค่าเริ่มต้นจะทดสอบ image,
    cron MCP, sub-agent, และ Guardian probes ปิด sub-agent probe ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยก failure อื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probes อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลัง sub-agent probe เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง OpenClaw tarball ที่แพ็กแล้วใน Docker, รัน onboarding ด้วย OpenAI API key,
    และตรวจยืนยันว่า Codex Plugin พร้อม dependency `@openai/codex`
    ถูกดาวน์โหลดไปยัง managed npm root ตามต้องการ
- live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - แพ็ก fixture plugin ที่มี dependency `slugify` จริง, ติดตั้งผ่าน
    `npm-pack:`, ตรวจยืนยัน dependency ใต้ managed npm root, แล้วขอให้
    live OpenAI model เรียก plugin tool และคืน hidden slug
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in เพื่อเพิ่มความมั่นใจซ้ำสำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    โดยทดสอบ `/crestodian status`, คิวการเปลี่ยน model แบบ persistent,
    ตอบ `/crestodian yes`, และตรวจยืนยันเส้นทางเขียน audit/config
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มี config โดยมี Claude CLI ปลอมอยู่บน `PATH`
    และตรวจยืนยันว่า fuzzy planner fallback แปลเป็น typed config write ที่ถูก audit แล้ว
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก OpenClaw state dir ว่าง, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord plugin + SecretRef writes,
    validate config, และตรวจยืนยัน audit entries เส้นทาง setup Ring 0 เดียวกันนี้
    ครอบคลุมใน QA Lab ด้วยโดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Moonshot/Kimi cost smoke: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json`, จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจยืนยันว่า JSON รายงาน Moonshot/K2.6 และ
  assistant transcript เก็บ `usage.cost` ที่ normalized แล้ว

<Tip>
เมื่อคุณต้องการเพียง case ที่ fail หนึ่งรายการ ให้เลือกจำกัด live tests ผ่าน allowlist env vars ที่อธิบายด้านล่าง
</Tip>

## runners เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflows เฉพาะ Agentic parity ถูกซ้อนอยู่ใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ PR workflow แบบ standalone
การตรวจ validation แบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release
แบบ stable/default เก็บ live/Docker soak แบบ exhaustive ไว้หลัง `run_release_soak=true`;
profile `full` บังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch โดยมี mock parity lane, live
Matrix lane, Convex-managed live Telegram lane, และ Convex-managed live Discord
lane เป็นงานขนานกัน Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ manual workflow input
ยังเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อม fast Matrix และ Telegram lanes ก่อนอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ผล deterministic
และหลีกเลี่ยง startup ของ provider-plugin ตามปกติ live transport gateways เหล่านี้
ปิด memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

full release live media shards ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Docker live model/backend shards ใช้อิมเมจร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build ครั้งเดียวต่อ commit
ที่เลือก จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงกับ repo โดยตรงบน host
  - เรียกใช้สถานการณ์ที่เลือกไว้หลายรายการแบบขนานตามค่าเริ่มต้นด้วย worker ของ
    gateway ที่แยกกัน `qa-channel` มีค่าเริ่มต้นเป็น concurrency 4 (จำกัดตาม
    จำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือใช้ `--concurrency 1` สำหรับ lane แบบอนุกรมเดิม
  - ออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai`, และ `aimock`
    `aimock` เริ่ม provider server ในเครื่องที่อิงกับ AIMock สำหรับ coverage
    fixture เชิงทดลองและ protocol-mock โดยไม่แทนที่ lane `mock-openai`
    ที่รับรู้สถานการณ์
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้ชุดทดสอบหนักของ Plugin Kitchen Sink แบบ live ของ OpenAI ผ่าน QA Lab โดย
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory ของผิวสัมผัส plugin SDK
    probe `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ Gateway
    เรียกใช้หนึ่ง turn ของ OpenAI แบบ live และตรวจสอบ diagnostics เชิง adversarial
    ต้องมี auth ของ OpenAI แบบ live เช่น `OPENAI_API_KEY` ใน session ของ Testbox
    ที่ hydrate แล้ว จะ source โปรไฟล์ live-auth ของ Testbox โดยอัตโนมัติเมื่อมีตัวช่วย
    `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ bench การเริ่มต้น Gateway พร้อมแพ็กสถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวม
    ไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - flag เฉพาะการสังเกต CPU ร้อนที่ต่อเนื่องตามค่าเริ่มต้น (`--cpu-core-warn`
    ร่วมกับ `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ตอนเริ่มต้นจะถูกบันทึกเป็น metric
    โดยไม่ดูเหมือน regression ที่ทำให้ Gateway ตรึง CPU นานหลายนาที
  - ใช้ artifact `dist` ที่ build แล้ว ให้รัน build ก่อนเมื่อ checkout ยังไม่มี
    runtime output ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บน host
  - ใช้ flag การเลือก provider/model ชุดเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่ออินพุต auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    คีย์ provider จาก env, path config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรี output ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ได้
  - เขียนรายงาน QA และสรุปตามปกติ พร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิงกับ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker รัน onboarding สำหรับคีย์ OpenAI API แบบ non-interactive, configure Telegram
    ตามค่าเริ่มต้น, ตรวจสอบว่า runtime ของ Plugin ที่แพ็กมาถูก load ได้โดยไม่มีการซ่อม
    dependency ตอนเริ่มต้น, รัน doctor และรันหนึ่ง turn ของ agent ในเครื่องกับ
    endpoint OpenAI แบบ mocked
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน lane packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน smoke ของ built-app ใน Docker แบบ deterministic สำหรับ transcript ของ embedded runtime context
    โดยตรวจสอบว่า runtime context ที่ซ่อนอยู่ของ OpenClaw ถูก persist เป็น custom message
    ที่ไม่แสดงผล แทนที่จะรั่วเข้าไปใน turn ของผู้ใช้ที่มองเห็นได้
    จากนั้น seed session JSONL ที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker, รัน onboarding ของ installed-package,
    configure Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้น reuse lane QA ของ Telegram แบบ live
    โดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - wrapper mount เฉพาะ source ของ harness `qa-lab` จาก checkout; แพ็กเกจที่ติดตั้ง
    เป็นเจ้าของ `dist`, `openclaw/plugin-sdk`, และ runtime ของ Plugin ที่ bundled
    เพื่อไม่ให้ lane ผสม Plugin จาก checkout ปัจจุบันเข้าไปในแพ็กเกจที่อยู่ระหว่างทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ในเครื่องที่ resolve แล้วแทนการติดตั้งจาก registry
  - ใช้ credential จาก env ของ Telegram หรือแหล่ง credential ของ Convex ชุดเดียวกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret อยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ env ของ credential สำหรับ Telegram หรือ Convex บน host ก่อน
    งาน build/install ของ Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อจงใจ debug การตั้งค่าก่อนมี credential
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override ค่า shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` สำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น workflow สำหรับ maintainer แบบ manual
    `NPM Telegram Beta E2E` โดยจะไม่รันตอน merge workflow ใช้ environment
    `qa-live-shared` และ lease credential ของ Convex CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับ package candidate หนึ่งรายการ โดยรับ ref ที่เชื่อถือได้, npm spec ที่เผยแพร่แล้ว,
  URL tarball แบบ HTTPS พร้อม SHA-256 หรือ artifact tarball จากการรันอื่น, upload
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  scheduler Docker E2E ที่มีอยู่ด้วยโปรไฟล์ lane แบบ smoke, package, product, full หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน workflow QA ของ
  Telegram กับ artifact `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL tarball ที่แน่นอนต้องมี digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- หลักฐาน artifact จะ download artifact tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - pack และติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker, เริ่ม Gateway
    โดย configure OpenAI แล้ว จากนั้นเปิดใช้ channel/Plugin ที่ bundled ผ่านการแก้ config
  - ตรวจสอบว่า setup discovery ปล่อยให้ Plugin ที่ดาวน์โหลดได้แต่ยังไม่ได้ configure นั้นไม่มีอยู่,
    การซ่อม doctor ที่ configure ครั้งแรกติดตั้ง Plugin ที่ดาวน์โหลดได้แต่ละตัวที่ขาดอย่างชัดเจน,
    และการ restart ครั้งที่สองไม่รันการซ่อม dependency แบบซ่อน
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ, เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลัง update ของ candidate
    ล้างเศษ dependency ของ Plugin legacy โดยไม่มีการซ่อม postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke สำหรับการ update แบบ packaged-install native ข้าม guest ของ Parallels
    แต่ละ platform ที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง,
    สถานะ update, ความพร้อมของ Gateway และหนึ่ง turn ของ agent ในเครื่อง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะ iterate
    กับ guest เดียว ใช้ `--json` สำหรับ path artifact สรุปและสถานะต่อ lane
  - lane ของ OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน agent-turn แบบ live
    ตามค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจ validate model อื่นของ OpenAI
  - ครอบการรันในเครื่องที่ยาวด้วย timeout ของ host เพื่อไม่ให้ transport stall ของ Parallels
    ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script เขียน log ของ lane แบบซ้อนใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การ update บน Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลัง update และการ update
    package บน guest ที่เย็น ซึ่งยังถือว่าปกติเมื่อ log debug ของ npm ที่ซ้อนอยู่ยังเดินหน้า
  - ห้ามรัน wrapper แบบรวมนี้พร้อมกันกับ lane smoke ของ Parallels สำหรับ macOS, Windows
    หรือ Linux แบบรายตัว เพราะใช้ state ของ VM ร่วมกันและอาจชนกันระหว่างการ restore snapshot,
    การ serve package หรือ state ของ Gateway ใน guest
  - หลักฐานหลัง update รันผิวสัมผัส Plugin ที่ bundled ตามปกติ เพราะ facade ของ capability
    เช่น speech, image generation และ media understanding ถูก load ผ่าน runtime API
    ที่ bundled แม้ตัว turn ของ agent เองจะตรวจเพียง text response แบบง่าย

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะ provider server AIMock ในเครื่องสำหรับการทดสอบ protocol smoke โดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane QA ของ Matrix แบบ live กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่อิงกับ Docker เฉพาะ source-checkout เท่านั้น - การติดตั้งแบบ packaged ไม่ได้ ship `qa-lab`
  - CLI แบบเต็ม, catalog ของ profile/scenario, env var และ layout ของ artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รัน lane QA ของ Telegram แบบ live กับกลุ่มส่วนตัวจริง โดยใช้ token ของ driver และ SUT bot จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` โดย group id ต้องเป็น numeric Telegram chat id
  - รองรับ `--credential-source convex` สำหรับ credential ที่ pooled ร่วมกัน ใช้โหมด env ตามค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled leases
  - ค่าเริ่มต้นครอบคลุม canary, mention gating, command addressing, `/status`, reply ที่กล่าวถึงระหว่าง bot-to-bot และ reply ของ core native command ค่าเริ่มต้นของ `mock-openai` ยังครอบคลุม regression ของ reply-chain แบบ deterministic และการ stream final-message ของ Telegram ใช้ `--list-scenarios` สำหรับ probe ทางเลือก เช่น `session_status`
  - ออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องมี bot สองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดย SUT bot ต้องเปิดเผย username ของ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจให้แน่ใจว่า driver bot สังเกต traffic ของ bot ในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และ artifact observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับรวม RTT ตั้งแต่ request ส่งของ driver จนถึง reply ของ SUT ที่สังเกตได้

`Mantis Telegram Live` คือ wrapper สำหรับหลักฐาน PR รอบ lane นี้ โดยรัน
candidate ref ด้วย credential ของ Telegram ที่ lease จาก Convex, render transcript
observed-message ที่ redact แล้วใน browser desktop ของ Crabbox, บันทึกหลักฐาน MP4,
สร้าง GIF ที่ตัดตาม motion, upload bundle artifact และ post หลักฐาน PR แบบ inline
ผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number` maintainer สามารถเริ่มจาก UI
ของ Actions ผ่าน `Mantis Scenario` (`scenario_id:
telegram-live`) หรือโดยตรงจาก comment ใน pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - เช่าหรือใช้เดสก์ท็อป Linux ของ Crabbox ซ้ำ ติดตั้ง Telegram Desktop แบบเนทีฟ กำหนดค่า OpenClaw ด้วยโทเคนบอต Telegram SUT ที่เช่าไว้ เริ่ม Gateway และบันทึกหลักฐานภาพหน้าจอ/MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้
  - ค่าเริ่มต้นคือ `--credential-source convex` เพื่อให้เวิร์กโฟลว์ต้องใช้เพียงความลับของโบรกเกอร์ Convex เท่านั้น ใช้ `--credential-source env` กับตัวแปร `OPENCLAW_QA_TELEGRAM_*` เดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังต้องมีการเข้าสู่ระบบ/โปรไฟล์ผู้ใช้ โทเคนบอตกำหนดค่าเฉพาะ OpenClaw เท่านั้น ใช้ `--telegram-profile-archive-env <name>` สำหรับไฟล์เก็บถาวรโปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` แล้วเข้าสู่ระบบด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` และ `telegram-desktop-builder.mp4` ไว้ใต้ไดเรกทอรีเอาต์พุต

เลนการขนส่งแบบสดใช้สัญญามาตรฐานเดียวร่วมกัน เพื่อไม่ให้การขนส่งใหม่คลาดเคลื่อน เมทริกซ์ความครอบคลุมรายเลนอยู่ใน [ภาพรวม QA → ความครอบคลุมการขนส่งแบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` เป็นชุดทดสอบสังเคราะห์แบบกว้าง และไม่ใช่ส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
QA การขนส่งแบบสด QA lab จะขอ lease แบบเอกสิทธิ์จากพูลที่รองรับด้วย Convex ส่ง Heartbeat ให้
lease นั้นระหว่างที่เลนกำลังทำงาน และปล่อย lease เมื่อปิดระบบ ชื่อส่วนนี้มีมาก่อน
การรองรับ Discord, Slack และ WhatsApp สัญญา lease ใช้ร่วมกันข้ามชนิดต่าง ๆ

โครงร่างโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- ความลับหนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลประจำตัว:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI และเป็น `maintainer` ในกรณีอื่น)

ตัวแปร env ทางเลือก:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (รหัสติดตามทางเลือก)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาเฉพาะในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแลของผู้ดูแลรักษา (เพิ่ม/ลบ/แสดงรายการพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแลรักษา:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบสดเพื่อตรวจสอบ URL ไซต์ Convex, ความลับโบรกเกอร์,
คำนำหน้า endpoint, หมดเวลา HTTP และการเข้าถึง admin/list โดยไม่พิมพ์
ค่าความลับ ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี
CI

สัญญา endpoint เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - ใช้หมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - สำเร็จ: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /admin/add` (ความลับของผู้ดูแลรักษาเท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ความลับของผู้ดูแลรักษาเท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ความลับของผู้ดูแลรักษาเท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชท Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่มีรูปแบบผิด

รูปร่าง payload สำหรับชนิดผู้ใช้จริง Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริง hex ของ SHA-256
- `kind: "telegram-user"` แทนบัญชี Telegram แบบ burner หนึ่งบัญชี ให้ถือว่า lease ครอบคลุมทั้งบัญชี: ไดรเวอร์ CLI ของ TDLib และพยานภาพ Telegram Desktop จะกู้คืนจาก payload เดียวกัน และควรมีงานเดียวเท่านั้นที่ถือ lease ในแต่ละครั้ง

การกู้คืน lease ผู้ใช้จริง Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

ใช้โปรไฟล์ Desktop ที่กู้คืนกับ `Telegram -workdir "$tmp/desktop"` เมื่อต้องมีการบันทึกภาพ ในสภาพแวดล้อมผู้ปฏิบัติงานในเครื่อง `scripts/e2e/telegram-user-credential.ts` จะอ่าน `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` เป็นค่าเริ่มต้นหากไม่มีตัวแปร env ของกระบวนการ

เซสชัน Crabbox ที่ขับเคลื่อนโดยเอเจนต์:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` เช่าข้อมูลประจำตัว `telegram-user` กู้คืนบัญชีเดียวกันลงใน
TDLib และ Telegram Desktop บนเดสก์ท็อป Linux ของ Crabbox เริ่ม Gateway
SUT จำลองในเครื่องจาก checkout ปัจจุบัน เปิดแชท Telegram ที่มองเห็นได้ เริ่ม
การบันทึกเดสก์ท็อป และเขียน `session.json` ส่วนตัว ระหว่างที่เซสชันยังมีชีวิตอยู่
เอเจนต์สามารถทดสอบต่อได้จนกว่าจะพอใจ:

- `send --session <file> --text <message>` ส่งผ่านผู้ใช้ TDLib จริงและรอคำตอบจาก SUT
- `run --session <file> -- <remote command>` รันคำสั่งใดก็ได้บน Crabbox และบันทึกเอาต์พุต เช่น `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`
- `screenshot --session <file>` จับภาพเดสก์ท็อปที่มองเห็นในปัจจุบัน
- `status --session <file>` พิมพ์ lease และคำสั่ง WebVNC
- `finish --session <file>` หยุดตัวบันทึก จับภาพหน้าจอ/วิดีโอ/อาร์ติแฟกต์ที่ตัดตามการเคลื่อนไหว ปล่อยข้อมูลประจำตัว Convex หยุดกระบวนการ SUT ในเครื่อง และหยุด lease ของ Crabbox เว้นแต่จะส่ง `--keep-box`
- `publish --session <file> --pr <number>` เผยแพร่คอมเมนต์ PR เฉพาะ GIF เป็นค่าเริ่มต้น ส่ง `--full-artifacts` เฉพาะเมื่อต้องการบันทึกหรืออาร์ติแฟกต์ JSON โดยตั้งใจเท่านั้น

สำหรับการจำลองภาพซ้ำได้แบบกำหนดแน่นอน ให้ส่ง `--mock-response-file <path>` ไปยัง `start`
หรือไปยังชวเลขคำสั่งเดียว `probe` ตัวรันใช้ค่าเริ่มต้นเป็นคลาส Crabbox
มาตรฐาน การบันทึก 24fps ตัวอย่าง GIF การเคลื่อนไหว 24fps และความกว้าง GIF
1920px แทนที่ด้วย `--class`, `--record-fps`, `--preview-fps` และ
`--preview-width` เฉพาะเมื่อหลักฐานต้องใช้การตั้งค่าการจับภาพที่ต่างออกไป

หลักฐาน Crabbox แบบคำสั่งเดียว:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

คำสั่ง `probe` เริ่มต้นเป็นชวเลขสำหรับรอบ start/send/finish หนึ่งรอบ ใช้
สำหรับ smoke `/status` อย่างรวดเร็ว ใช้คำสั่งเซสชันสำหรับการรีวิว PR,
งานจำลองบั๊กซ้ำ หรือกรณีใด ๆ ที่เอเจนต์ต้องการเวลาหลายนาทีสำหรับการทดลอง
ตามอำเภอใจก่อนตัดสินว่าหลักฐานเสร็จสมบูรณ์ ใช้ `--id <cbx_...>` เพื่อ
ใช้ lease เดสก์ท็อปที่อุ่นอยู่ซ้ำ, `--keep-box` เพื่อให้ VNC เปิดอยู่หลัง finish,
`--desktop-chat-title <name>` เพื่อเลือกแชทที่มองเห็น และ `--tdlib-url <tgz>`
เมื่อใช้ไฟล์เก็บถาวร `libtdjson.so` สำหรับ Linux ที่เตรียมไว้ล่วงหน้าแทนการสร้าง TDLib บน
กล่องใหม่ ตัวรันตรวจสอบ `--tdlib-url` ด้วย `--tdlib-sha256 <hex>` หรือ
โดยค่าเริ่มต้นด้วยไฟล์พี่น้อง `<url>.sha256`

payload หลายช่องทางที่ตรวจสอบโดยโบรกเกอร์:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถเช่าจากพูลได้เช่นกัน แต่การตรวจสอบ payload ของ Slack ในปัจจุบัน
อยู่ในตัวรัน QA ของ Slack แทนที่จะอยู่ในโบรกเกอร์ ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางลงใน QA

สถาปัตยกรรมและชื่อ helper ของสถานการณ์สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: ติดตั้งใช้งานตัวรันการขนส่งบน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน ประกาศ `qaRunners` ใน manifest ของ Plugin เมานต์เป็น `openclaw qa <runner>` และเขียนสถานการณ์ไว้ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดถึงชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่นิ่ง/ต้นทุนที่เพิ่มขึ้น):

### ยูนิต / อินทิเกรชัน (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- การกำหนดค่า: การรันที่ไม่ได้เจาะจงใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard หลายโปรเจกต์เป็นการกำหนดค่ารายโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: รายการ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบยูนิต UI ทำงานใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบยูนิตล้วน
  - การทดสอบอินทิเกรชันในกระบวนการ (การยืนยันตัวตน Gateway, การกำหนดเส้นทาง, เครื่องมือ, การแยกวิเคราะห์, config)
  - การทดสอบ regression แบบกำหนดแน่นอนสำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และตัวโหลด public-surface ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่รวมมาจริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดสัญญา/อินทิเกรชันที่ Plugin เป็นเจ้าของ

นโยบาย dependency แบบเนทีฟ:

- การติดตั้งทดสอบเริ่มต้นข้าม build opus ของ Discord แบบเนทีฟที่เป็นทางเลือก การรับเสียง Discord ใช้ตัวถอดรหัส `opusscript` แบบ JS ล้วน และ `@discordjs/opus` ยังคงอยู่ใน `ignoredBuiltDependencies` เพื่อให้การทดสอบในเครื่องและเลน Testbox ไม่คอมไพล์ addon แบบเนทีฟ
- ใช้เลนประสิทธิภาพเสียง Discord หรือเลนสดเฉพาะหากคุณตั้งใจต้องการเปรียบเทียบ build opus แบบเนทีฟ อย่าเพิ่ม `@discordjs/opus` กลับเข้าไปใน `onlyBuiltDependencies` เริ่มต้น เพราะจะทำให้ลูปติดตั้ง/ทดสอบที่ไม่เกี่ยวข้องคอมไพล์โค้ดเนทีฟ

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิก shard ขนาดเล็กกว่า 12 ชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project native ขนาดใหญ่ชุดเดียว วิธีนี้ลด peak RSS บนเครื่องที่มีโหลดสูง และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจน suite ที่ไม่เกี่ยวข้องทำงานช้า
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ root native ของ `vitest.config.ts` เพราะลูป watch แบบ multi-shard ไม่เหมาะกับการใช้งานจริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน lane ที่จำกัดขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จะหลีกเลี่ยงต้นทุนการเริ่มโปรเจกต์ root ทั้งหมด
    - `pnpm test:changed` จะขยาย path จาก git ที่เปลี่ยนแปลงเป็น lane ที่จำกัดขอบเขตราคาถูกตามค่าเริ่มต้น: การแก้ไข test โดยตรง, ไฟล์ sibling `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน และ dependent จาก local import-graph การแก้ไข config/setup/package จะไม่รัน test แบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบ local อัจฉริยะตามปกติสำหรับงานขอบเขตแคบ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling แล้วรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รัน Vitest tests; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` แบบชัดเจนเพื่อใช้เป็นหลักฐาน test การ bump เวอร์ชันเฉพาะ release metadata จะรันการตรวจสอบเวอร์ชัน/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยน package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข live Docker ACP harness จะรันการตรวจสอบแบบโฟกัส: shell syntax สำหรับสคริปต์ live Docker auth และ dry-run ของ live Docker scheduler การเปลี่ยน `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่นๆ ยังคงใช้ guard ที่กว้างกว่า
    - unit tests แบบ import-light จาก agents, commands, plugins, auto-reply helpers, `plugin-sdk` และพื้นที่ pure utility ที่คล้ายกันจะถูกส่งผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime-heavy ยังคงอยู่บน lane เดิม
    - ไฟล์ซอร์ส helper บางไฟล์ของ `plugin-sdk` และ `commands` ยังแมปการรัน changed-mode ไปยัง sibling tests ที่ระบุชัดเจนใน lane แบบเบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จะหลีกเลี่ยงการรัน suite หนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับ core helpers ระดับบนสุด, integration tests ระดับบนสุด `reply.*` และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply เพิ่มเป็น shard ของ agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import-heavy หนึ่งชุดครอบครอง tail ของ Node ทั้งหมด
    - CI สำหรับ PR/main ตามปกติจงใจข้ามการ sweep batch ของ extension และ shard `agentic-plugins` ที่ใช้เฉพาะ release การ dispatch ของ Full Release Validation จะเรียก child workflow `Plugin Prerelease` แยกต่างหากสำหรับ suite ที่หนักด้าน plugin/extension เหล่านั้นบน release candidates

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยน input ของการค้นหา message-tool หรือบริบท runtime ของ Compaction
      ให้รักษา coverage ทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบโฟกัสสำหรับขอบเขต pure routing และ normalization
    - รักษา suite integration ของ embedded runner ให้สมบูรณ์:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - suite เหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม Compaction ยังไหลผ่าน
      path จริงของ `run.ts` / `compact.ts`; test เฉพาะ helper
      ไม่เพียงพอแทน path integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานใช้ค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้
      runner แบบไม่แยก isolation ในโปรเจกต์ root, e2e และคอนฟิก live
    - lane UI ของ root ยังคง setup และ optimizer ของ `jsdom` ไว้ แต่รันบน
      runner แบบไม่แยก isolation ที่ใช้ร่วมกันเช่นกัน
    - shard ของ `pnpm test` แต่ละชุดสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กระบวนการ Node ลูกของ Vitest
      ตามค่าเริ่มต้น เพื่อลดการ churn ของการ compile V8 ระหว่างการรัน local ขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      ปกติ

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้น lane สถาปัตยกรรมใดบ้าง
    - hook pre-commit ทำเฉพาะการจัดรูปแบบ มันจะ stage ไฟล์ที่จัดรูปแบบแล้วใหม่ และ
      ไม่รัน lint, typecheck หรือ tests
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบ local อัจฉริยะ
    - `pnpm test:changed` จะส่งผ่าน lane ที่จำกัดขอบเขตราคาถูกตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract ต้องการ
      coverage ของ Vitest ที่กว้างขึ้นจริงๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่มี worker cap ที่สูงกว่า
    - การปรับ worker แบบอัตโนมัติในเครื่องตั้งใจให้ระมัดระวัง และจะลดระดับ
      เมื่อ load average ของ host สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุด
      จะสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำใน changed-mode ยังถูกต้องเมื่อ
      wiring ของ test เปลี่ยน
    - คอนฟิกเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บน host ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache เดียวที่ระบุชัดเจนสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดใช้รายงาน import-duration ของ Vitest พร้อม
      output import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันให้กับ
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรัน whole-config ใช้ path ของคอนฟิกเป็น key; shard ของ CI แบบ include-pattern
      จะต่อท้ายชื่อ shard เพื่อให้ติดตาม shard ที่ถูกกรองแยกกันได้
    - เมื่อ test ที่ร้อนหนึ่งตัวยังใช้เวลาส่วนใหญ่ไปกับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam local `*.runtime.ts` ที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import helper runtime เพียงเพื่อ
      ส่งผ่านไปยัง `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก route กับ path root-project native สำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม macOS max RSS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดยส่งรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ของ root
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ
      startup ของ Vitest/Vite และ overhead ของ transform
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับ
      unit suite โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงพร้อมเปิด diagnostics ตามค่าเริ่มต้น
  - ส่ง churn ของข้อความ gateway, memory และ large-payload สังเคราะห์ผ่าน path ของ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper persistence ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังคงถูกจำกัดขนาด, ตัวอย่าง RSS สังเคราะห์ยังอยู่ใต้ pressure budget และ depth ของ queue ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - lane แคบสำหรับการติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทน Gateway suite เต็มรูปแบบ

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และ E2E tests ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ซึ่งตรงกับส่วนที่เหลือของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: 1 ตามค่าเริ่มต้น)
  - รันใน silent mode ตามค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด output console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ Node และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนที่เคลื่อนไหวมากกว่า unit tests (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบ isolated บน host ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile local ชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้อง opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี CLI `openshell` ใน local พร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolated แล้วทำลาย test gateway และ sandbox
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้ test เมื่อรัน suite e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และ live tests ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วย credential จริงหรือไม่?"
  - จับการเปลี่ยนรูปแบบของ provider, ความเฉพาะของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่ได้ออกแบบให้เสถียรสำหรับ CI (network จริง, policy จริงของ provider, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่จำกัดขอบเขตแทน "ทุกอย่าง"
- การรัน live จะ source `~/.profile` เพื่อดึง API keys ที่ขาดหาย
- ตามค่าเริ่มต้น การรัน live ยังคง isolate `HOME` และคัดลอก config/auth material ไปยัง temp test home เพื่อไม่ให้ fixture ของ unit แก้ไข `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้ live tests ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้ mode ที่เงียบขึ้นเป็นค่าเริ่มต้น: มันยังคง output ความคืบหน้า `[live] ...` ไว้ แต่ปิด notice เพิ่มเติมของ `~/.profile` และปิดเสียง log bootstrap ของ gateway/Bonjour chatter ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ log startup แบบเต็มกลับมา
- การ rotate API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; tests จะ retry เมื่อได้รับ response rate limit
- output ความคืบหน้า/Heartbeat:
  - ตอนนี้ live suites ส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า provider calls ที่ยาวยัง active อยู่ แม้ console capture ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการ intercept console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรัน suite ใด?

ใช้ตารางตัดสินใจนี้:

- การแก้ไขลอจิก/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงจำนวนมาก)
- แตะเครือข่าย Gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก "บอตของฉันล่ม" / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบแบบใช้งานจริง (แตะเครือข่าย)

สำหรับเมทริกซ์โมเดลแบบใช้งานจริง, การ smoke แบ็กเอนด์ CLI, การ smoke ACP, ชุดทดสอบ
harness ของเซิร์ฟเวอร์แอป Codex และการทดสอบแบบใช้งานจริงของผู้ให้บริการสื่อทั้งหมด
(Deepgram, BytePlus, ComfyUI, รูปภาพ, เพลง, วิดีโอ, media harness) รวมถึงการจัดการข้อมูลประจำตัวสำหรับการรันแบบใช้งานจริง ให้ดู
[การทดสอบชุดทดสอบแบบใช้งานจริง](/th/help/testing-live) สำหรับรายการตรวจสอบเฉพาะด้านการอัปเดตและ
การตรวจสอบความถูกต้องของ Plugin ให้ดู
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## ตัวรัน Docker (การตรวจสอบ "ทำงานใน Linux" แบบไม่บังคับ)

ตัวรัน Docker เหล่านี้แบ่งเป็นสองกลุ่ม:

- ตัวรันโมเดลแบบใช้งานจริง: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์แบบใช้งานจริงของคีย์โปรไฟล์ที่ตรงกันภายในอิมเมจ Docker ของรีโป (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรีคอนฟิกและพื้นที่ทำงานในเครื่องของคุณ (และ source `~/.profile` หากถูกเมานต์ไว้) จุดเข้าใช้งานในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรันแบบใช้งานจริงบน Docker มีค่าเริ่มต้นเป็นขีดจำกัด smoke ที่เล็กกว่า เพื่อให้การกวาด Docker ทั้งหมดยังคงใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้ override ตัวแปรสภาพแวดล้อมเหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบละเอียดขนาดใหญ่อย่างชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker แบบใช้งานจริงหนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น tarball npm ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/นำอิมเมจ `scripts/e2e/Dockerfile` สองอิมเมจกลับมาใช้ใหม่ อิมเมจเปล่าเป็นเพียงตัวรัน Node/Git สำหรับเลนติดตั้ง/อัปเดต/การพึ่งพา Plugin เท่านั้น เลนเหล่านั้นจะเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจฟังก์ชันจะติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันการทำงานของแอปที่ build แล้ว นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิกตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตามแผนที่เลือก ชุดรวมใช้ตัวจัดตารางเวลาในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุมสล็อตของโปรเซส ขณะที่ขีดจำกัดทรัพยากรป้องกันไม่ให้เลนแบบใช้งานจริงที่หนัก, การติดตั้ง npm และหลายบริการเริ่มพร้อมกันทั้งหมด หากเลนเดียวหนักกว่าขีดจำกัดที่ใช้งานอยู่ ตัวจัดตารางเวลายังสามารถเริ่มเลนนั้นได้เมื่อพูลว่าง แล้วให้รันเพียงลำพังจนกว่าจะมีความจุอีกครั้ง ค่าเริ่มต้นคือ 10 สล็อต, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มีพื้นที่รองรับมากขึ้น ตัวรันจะทำ preflight ของ Docker ตามค่าเริ่มต้น, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บเวลาเลนที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่มเลนที่ใช้เวลานานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest เลนแบบถ่วงน้ำหนักโดยไม่ build หรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์แผน CI สำหรับเลนที่เลือก, ความต้องการแพ็กเกจ/อิมเมจ และข้อมูลประจำตัว
- `Package Acceptance` คือเกตแพ็กเกจแบบเนทีฟของ GitHub สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่?" โดยจะ resolve แพ็กเกจตัวเลือกหนึ่งจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` จากนั้นรันเลน Docker E2E ที่นำกลับมาใช้ใหม่กับ tarball นั้นโดยตรง แทนที่จะ repack ref ที่เลือก โปรไฟล์เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับสัญญาแพ็กเกจ/อัปเดต/Plugin, เมทริกซ์ผู้รอดจากการอัปเกรดที่เผยแพร่แล้ว, ค่าเริ่มต้นของ release และการคัดแยกความล้มเหลว
- การตรวจสอบ build และ release จะรัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown ตัว guard จะเดินกราฟ build แบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหากการเริ่มต้นก่อน dispatch นำเข้าการพึ่งพาแพ็กเกจ เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; นอกจากนี้ยังคุมขนาด bundled gateway run chunk ให้อยู่ในงบ และปฏิเสธ static imports ของเส้นทาง gateway เย็นที่รู้จัก การ smoke CLI แบบแพ็กเกจยังครอบคลุม help ราก, onboard help, doctor help, status, config schema และคำสั่งรายการโมเดล
- ความเข้ากันได้แบบดั้งเดิมของ Package Acceptance ถูกจำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึงจุดตัดนั้น harness จะยอมรับเฉพาะช่องว่างของ metadata ในแพ็กเกจที่จัดส่งแล้วเท่านั้น: รายการ private QA inventory ที่ละไว้, ไม่มี `gateway install --wrapper`, ไม่มีไฟล์ patch ใน git fixture ที่ได้จาก tarball, ไม่มี `update.channel` ที่ persist ไว้, ตำแหน่ง install-record ของ Plugin แบบดั้งเดิม, ไม่มีการ persist install-record ของ marketplace และการ migrate metadata ของคอนฟิกระหว่าง `plugins update` สำหรับแพ็กเกจหลัง `2026.4.25` เส้นทางเหล่านั้นเป็นความล้มเหลวแบบเข้มงวด
- ตัวรัน smoke ของคอนเทนเนอร์: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` จะบูตคอนเทนเนอร์จริงหนึ่งตัวหรือมากกว่าและตรวจสอบเส้นทางการผสานรวมระดับสูงกว่า

ตัวรัน Docker ของโมเดลแบบใช้งานจริงยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน home ของคอนเทนเนอร์ก่อนการรัน เพื่อให้ OAuth ของ CLI ภายนอกสามารถรีเฟรช token ได้โดยไม่แก้ไข auth store ของโฮสต์:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` เป็นเลน QA แบบ private source-checkout ตั้งใจไม่รวมอยู่ในเลน Docker release ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน env-ref onboarding พร้อม Telegram ตามค่าเริ่มต้น, รัน doctor และรันหนึ่งรอบ agent ของ OpenAI แบบ mocked ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บน host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`
- Skill install smoke: `pnpm test:docker:skill-install` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, ปิดใช้งานการติดตั้ง archive ที่อัปโหลดในการกำหนดค่า, resolve slug ของ skill ใน ClawHub live ปัจจุบันจากการค้นหา, ติดตั้งด้วย `openclaw skills install` และตรวจสอบ skill ที่ติดตั้งพร้อม metadata ต้นทาง/lock ของ `.clawhub`
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจสอบ channel ที่ persist แล้วและงานหลังอัปเดตของ Plugin จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มี agents, การกำหนดค่า channel, allowlists ของ Plugin, สถานะ dependency ของ Plugin ที่ล้าสมัย และไฟล์ workspace/session ที่มีอยู่ รัน package update พร้อม non-interactive doctor โดยไม่มี provider live หรือ channel keys จากนั้นเริ่ม loopback Gateway และตรวจสอบการคงไว้ของ config/state พร้อมงบประมาณ startup/status
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริง, กำหนดค่า baseline นั้นด้วย command recipe ที่ฝังไว้, validate config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ตัว candidate, รัน non-interactive doctor, เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม loopback Gateway และตรวจสอบ intents ที่กำหนดค่าไว้, การคงไว้ของ state, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC override baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ aggregate scheduler ขยาย baseline แบบ local ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยาย fixture รูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมการติดตั้ง Plugin ภายนอกของ OpenClaw โดยอัตโนมัติ Package Acceptance เปิดเผยสิ่งเหล่านี้เป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`, resolve meta baseline tokens เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยาย release-soak package gate เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` ตรวจสอบการ persist transcript ของ hidden runtime context พร้อมการซ่อมโดย doctor สำหรับสาขา prompt-rewrite ที่ซ้ำกันและได้รับผลกระทบ
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home แยก และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน bundled image providers แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache เดียวร่วมกันระหว่าง root, update และ direct-npm containers update smoke ใช้ npm `latest` เป็น stable baseline ตามค่าเริ่มต้นก่อนอัปเกรดไปยัง candidate tarball override ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ใน local หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจ installer แบบ non-root เก็บ npm cache ที่แยกไว้ เพื่อไม่ให้ cache entries ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ root/update/direct-npm cache ซ้ำในการรันซ้ำใน local
- Install Smoke CI ข้าม direct-npm global update ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ใน local โดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม `npm install -g` โดยตรง
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image จาก root Dockerfile ตามค่าเริ่มต้น, seed agents สองตัวพร้อม workspace หนึ่งรายการใน container home ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ไว้ ใช้ install-smoke image ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- Gateway networking (สอง containers, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build source E2E image พร้อม Chromium layer, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่า CDP role snapshots ครอบคลุม link URLs, clickables ที่ cursor-promoted, iframe refs และ frame metadata
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รัน mocked OpenAI server ผ่าน Gateway, ตรวจสอบว่า `web_search` เพิ่ม `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ provider schema reject และตรวจสอบว่า raw detail ปรากฏใน Gateway logs
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (real stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + stdio MCP child teardown หลังการรัน cron แบบแยกและ one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke สำหรับ local path, `file:`, npm registry พร้อม dependencies แบบ hoisted, git moving refs, ClawHub kitchen-sink, marketplace updates และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่ package/runtime แบบ kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้ fixture server ของ ClawHub แบบ hermetic local
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วใน container เปล่า, ติดตั้ง npm plugin, toggle enable/disable, upgrade และ downgrade ผ่าน local npm registry, ลบ code ที่ติดตั้งแล้ว จากนั้นตรวจสอบว่า uninstall ยังคงลบ state ที่ล้าสมัย พร้อมบันทึก metrics RSS/CPU สำหรับแต่ละ lifecycle phase
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุม install/update smoke สำหรับ local path, `file:`, npm registry พร้อม dependencies แบบ hoisted, git moving refs, ClawHub fixtures, marketplace updates และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรม update แบบ unchanged สำหรับ plugins ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง npm plugin แบบ resource-tracked, enable, disable, upgrade, downgrade และ missing-code uninstall

หากต้องการ prebuild และใช้ shared functional image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Image overrides เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง remote shared image สคริปต์จะ pull หากยังไม่มีใน local การทดสอบ QR และ installer Docker เก็บ Dockerfiles ของตัวเองไว้ เพราะตรวจสอบพฤติกรรม package/install แทนที่จะเป็น runtime ของ built-app ที่ใช้ร่วมกัน

ตัวรัน Docker สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวและ
stage เข้าไปใน workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้อิมเมจ runtime
มีขนาดเล็ก ขณะที่ยังรัน Vitest กับซอร์ส/คอนฟิกภายในเครื่องของคุณอย่างตรงตัว
ขั้นตอน staging จะข้าม cache ขนาดใหญ่ที่ใช้เฉพาะภายในเครื่องและผลลัพธ์ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีผลลัพธ์ `.build` ภายในแอปหรือ
Gradle เพื่อให้การรัน Docker live ไม่ต้องเสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
ตัวรันเหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ gateway live probes ไม่เริ่ม
channel workers ของ Telegram/Discord/ฯลฯ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น gateway
live coverage จาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่มคอนเทนเนอร์
OpenClaw gateway โดยเปิดใช้ endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ pin ไว้กับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` แสดง `openclaw/default`, จากนั้นส่ง
คำขอแชตจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
ตั้งค่า `OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจ CI ใน release path ที่ควรหยุด
หลังจากลงชื่อเข้าใช้ Open WebUI และค้นพบโมเดล โดยไม่ต้องรอ completion จาก live model
การรันครั้งแรกอาจช้ากว่าปกติอย่างสังเกตได้ เพราะ Docker อาจต้อง pull อิมเมจ
Open WebUI และ Open WebUI อาจต้องทำ cold-start setup ของตัวเองให้เสร็จ
lane นี้คาดหวัง live model key ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) คือวิธีหลักในการจัดหา key นั้นในการรันผ่าน Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้ deterministic และไม่ต้องมีบัญชี
Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway ที่ seed ไว้,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบ
การค้นพบบทสนทนาที่ route แล้ว, การอ่าน transcript, metadata ของ attachment,
พฤติกรรม live event queue, การ route การส่งออกขาออก และการแจ้งเตือน channel +
permission แบบ Claude ผ่าน stdio MCP bridge จริง การตรวจการแจ้งเตือน
จะตรวจ frame stdio MCP ดิบโดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่
bridge emit จริง ไม่ใช่แค่สิ่งที่ SDK client เฉพาะตัวใดตัวหนึ่งแสดงออกมา
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องมี live
model key มัน build อิมเมจ Docker ของ repo, เริ่ม stdio MCP probe server จริง
ภายในคอนเทนเนอร์, materialize server นั้นผ่าน runtime MCP ของ Pi bundle ที่ฝังไว้,
execute tool, จากนั้นตรวจสอบว่า `coding` และ `messaging` เก็บ tool
`bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` filter ออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องมี live model
key มันเริ่ม Gateway ที่ seed ไว้พร้อม stdio MCP probe server จริง, รัน
cron turn แบบแยก และ `/subagents spawn` child turn แบบ one-shot, จากนั้นตรวจสอบว่า
MCP child process ออกหลังการรันแต่ละครั้ง

Manual ACP plain-language thread smoke (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow regression/debug อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบออก

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับ cached CLI installs ภายใน Docker
- external CLI auth dirs/files ภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกเข้า `/home/node/...` ก่อนเริ่ม tests
  - dirs ค่าเริ่มต้น: `.minimax`
  - files ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดจะ mount เฉพาะ dirs/files ที่จำเป็นซึ่ง infer จาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อ filter providers ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อ reuse อิมเมจ `openclaw:local-live` ที่มีอยู่สำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway expose สำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override nonce-check prompt ที่ Open WebUI smoke ใช้
- `OPENWEBUI_IMAGE=...` เพื่อ override tag อิมเมจ Open WebUI ที่ pin ไว้

## การตรวจ sanity ของเอกสาร

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

สิ่งเหล่านี้คือ regression ของ "pipeline จริง" โดยไม่มี provider จริง:

- Gateway tool calling (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

เรามี tests ที่ปลอดภัยสำหรับ CI อยู่แล้วสองสามรายการ ซึ่งทำงานเหมือน "agent reliability evals":

- Mock tool-calling ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- wizard flows แบบ end-to-end ที่ validate session wiring และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **Decisioning:** เมื่อมีการระบุ skills ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยง skill ที่ไม่เกี่ยวข้องหรือไม่)?
- **Compliance:** agent อ่าน `SKILL.md` ก่อนใช้และทำตาม steps/args ที่จำเป็นหรือไม่?
- **Workflow contracts:** สถานการณ์แบบ multi-turn ที่ assert ลำดับ tool, การ carryover ประวัติ session และ sandbox boundaries

evals ในอนาคตควรเริ่มจาก deterministic ก่อน:

- scenario runner ที่ใช้ mock providers เพื่อ assert tool calls + ลำดับ, การอ่าน skill file และ session wiring
- ชุดสถานการณ์ขนาดเล็กที่มุ่งเน้น skill (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- live evals แบบ optional (opt-in, env-gated) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## Contract tests (รูปทรงของ Plugin และ channel)

Contract tests ตรวจสอบว่า Plugin และ channel ที่ register ทุกตัวสอดคล้องกับ
interface contract ของตน มัน iterate ผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertions ด้าน shape และ behavior lane unit `pnpm test` เริ่มต้นตั้งใจ
ข้าม shared seam และ smoke files เหล่านี้; ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะ shared channel หรือ provider surfaces

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - shape พื้นฐานของ Plugin (id, name, capabilities)
- **setup** - setup wizard contract
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง message payload
- **inbound** - การจัดการ inbound message
- **actions** - channel action handlers
- **threading** - การจัดการ thread ID
- **directory** - directory/roster API
- **group-policy** - การบังคับใช้นโยบาย group

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - channel status probes
- **registry** - shape ของ Plugin registry

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - auth flow contract
- **auth-choice** - auth choice/selection
- **catalog** - model catalog API
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - provider runtime
- **shape** - Plugin shape/interface
- **wizard** - setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน plugin-sdk exports หรือ subpaths
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การ register หรือ discovery ของ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหา provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub provider หรือ capture การแปลง request-shape ที่ตรงจุด)
- หากเป็น live-only โดยธรรมชาติ (rate limits, auth policies) ให้เก็บ live test ให้แคบและ opt-in ผ่าน env vars
- ควร target layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug การแปลง/replay คำขอ provider → direct models test
  - bug ใน gateway session/history/tool pipeline → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อ SecretRef class จาก registry metadata (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า traversal-segment exec ids ถูก reject
  - หากคุณเพิ่ม target family ของ SecretRef `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ใน test นั้น test ตั้งใจ fail เมื่อมี target ids ที่ยังไม่ได้ classify เพื่อไม่ให้ classes ใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
