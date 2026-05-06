---
read_when:
    - การเรียกใช้การทดสอบภายในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway และเอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบยูนิต/แบบปลายทางถึงปลายทาง/แบบสด, รันเนอร์ Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-06T09:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runner ขนาดเล็ก
เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และตั้งใจ _ไม่_ ครอบคลุมอะไรบ้าง)
- คำสั่งที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, การดีบัก)
- วิธีที่การทดสอบ live ค้นพบข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการ
- วิธีเพิ่มรีเกรสชันสำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียนสถานการณ์
- [QA แบบ Matrix](/th/concepts/qa-matrix) - เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ช่องทาง QA](/th/channels/qa-channel) - transport Plugin สังเคราะห์ที่ใช้โดยสถานการณ์ที่อิงกับรีโพ

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runner ส่วน runner เฉพาะ QA ด้านล่าง ([runner เฉพาะ QA](#qa-specific-runners)) แสดงการเรียกใช้ `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ส่วนใหญ่ในแต่ละวัน:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรมาก: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ส่งต่อเส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ให้เลือกการรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ข้อผิดพลาดเดียว
- ไซต์ QA ที่รองรับด้วย Docker: `pnpm qa:lab:up`
- QA lane ที่รองรับด้วย Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแก้ไขการทดสอบหรือต้องการความมั่นใจเพิ่มเติม:

- Coverage gate: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (โมเดล + การ probe เครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพรันไทม์: dispatch `OpenClaw Performance` พร้อม
  `live_gpt54=true` สำหรับ agent turn จริงของ `openai/gpt-5.4` หรือ
  `deep_profile=true` สำหรับอาร์ติแฟกต์ CPU/heap/trace ของ Kova การรันตามกำหนดรายวัน
  จะเผยแพร่อาร์ติแฟกต์ lane ของ mock-provider, deep-profile และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อมีการกำหนดค่า `CLAWGRIT_REPORTS_TOKEN`
  รายงาน mock-provider ยังรวมตัวเลขระดับซอร์สของ gateway boot, หน่วยความจำ,
  plugin-pressure, fake-model hello-loop ซ้ำ และการเริ่มต้น CLI ด้วย
- การ sweep โมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - ตอนนี้แต่ละโมเดลที่เลือกจะรัน text turn พร้อม probe ขนาดเล็กแบบอ่านไฟล์
    โมเดลที่เมตาดาตาระบุว่ารองรับอินพุต `image` จะรัน image turn ขนาดเล็กด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อต้องการแยกความล้มเหลวของผู้ให้บริการ
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวมงาน Docker live model matrix แยกต่างหาก
    ที่ shard ตามผู้ให้บริการ
  - สำหรับการรัน CI ซ้ำแบบโฟกัส ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ของผู้ให้บริการที่มีสัญญาณสูงรายการใหม่ไปยัง `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียก
    scheduled/release ของ workflow นั้น
- smoke แชตแบบ bound ของ Native Codex: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับเส้นทาง Codex app-server, ผูก Slack DM สังเคราะห์ด้วย
    `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบคำตอบแบบธรรมดาและเส้นทางไฟล์แนบรูปภาพ
    ผ่านการผูก Plugin แบบ native แทน ACP
- smoke harness ของ Codex app-server: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turn ผ่าน harness ของ Codex app-server ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models`, และโดยค่าเริ่มต้นจะทดสอบ probe ของ image,
    cron MCP, sub-agent และ Guardian ปิด probe ของ sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อต้องการแยกความล้มเหลวอื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบโฟกัส ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    คำสั่งนี้จะออกหลังจาก probe ของ sub-agent เว้นแต่ตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke คำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in ที่รัดกุมเป็นพิเศษสำหรับพื้นผิวคำสั่ง rescue ของช่องทางข้อความ
    คำสั่งนี้ทดสอบ `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบถาวร,
    ตอบกลับ `/crestodian yes`, และตรวจสอบเส้นทางการเขียน audit/config
- smoke Docker ของ Crestodian planner: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fallback ของ fuzzy planner แปลเป็นการเขียน config แบบ typed ที่มีการ audit
- smoke Docker สำหรับการรันครั้งแรกของ Crestodian: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ที่ว่างเปล่า, ส่ง `openclaw` เปล่าไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Discord Plugin + SecretRef,
    ตรวจสอบ config, และตรวจสอบรายการ audit เส้นทาง setup Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab ด้วย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ต้นทุน Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json`, จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของผู้ช่วยเก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวหนึ่งกรณี ให้เลือกจำกัดขอบเขตการทดสอบ live ผ่าน env var แบบ allowlist ที่อธิบายไว้ด้านล่าง
</Tip>

## runner เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงของ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ภายใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ workflow ของ PR แบบ standalone
การตรวจสอบแบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release
แบบ stable/default จะเก็บ live/Docker soak แบบครอบคลุมไว้หลัง `run_release_soak=true`;
โปรไฟล์ `full` จะบังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch โดยมี mock parity lane, live
Matrix lane, live Telegram lane ที่จัดการด้วย Convex และ live Discord
lane ที่จัดการด้วย Convex เป็นงานขนาน Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ input ของ manual workflow
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อม Matrix แบบ fast และ Telegram lane ก่อนการอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ release transport เพื่อให้คง determinism
และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway ของ live transport เหล่านี้
ปิด memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

shard ของ live media สำหรับ full release ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shard ของ Docker live model/backend ใช้ image
`ghcr.io/openclaw/openclaw-live-test:<sha>` ร่วมกันที่สร้างหนึ่งครั้งต่อ commit
ที่เลือก จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อิงกับรีโปโดยตรงบนโฮสต์
  - รันสถานการณ์ที่เลือกไว้หลายรายการแบบขนานเป็นค่าเริ่มต้นด้วยตัวทำงาน
    gateway แบบแยกกัน `qa-channel` มีค่าเริ่มต้นของ concurrency เป็น 4 (จำกัดตาม
    จำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวนตัวทำงาน
    หรือ `--concurrency 1` สำหรับเลนแบบอนุกรมเดิม
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ provider ภายในเครื่องที่อิงกับ AIMock สำหรับการครอบคลุม
    fixture และ protocol-mock แบบทดลอง โดยไม่แทนที่เลน `mock-openai` ที่รู้บริบทของสถานการณ์
- `pnpm test:plugins:kitchen-sink-live`
  - รันชุดทดสอบหนักของ OpenAI Kitchen Sink Plugin แบบสดผ่าน QA Lab โดยจะ
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory ของพื้นผิว plugin SDK
    probe `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ gateway
    รันเทิร์น OpenAI แบบสดหนึ่งครั้ง และตรวจสอบ diagnostics เชิงโจมตี
    ต้องมี auth ของ OpenAI แบบสด เช่น `OPENAI_API_KEY` ในเซสชัน Testbox
    ที่เติมข้อมูลแล้ว ระบบจะ source โปรไฟล์ live-auth ของ Testbox โดยอัตโนมัติเมื่อมี helper
    `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - รัน bench การเริ่มต้น gateway พร้อมชุดสถานการณ์ mock QA Lab ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวม
    ไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้น flag เฉพาะการสังเกต CPU ร้อนที่ต่อเนื่อง (`--cpu-core-warn`
    ร่วมกับ `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ตอนเริ่มต้นจะถูกบันทึกเป็นเมตริก
    โดยไม่ดูเหมือน regression ที่ gateway ใช้ CPU เต็มหลายนาที
  - ใช้อาร์ติแฟกต์ `dist` ที่ build แล้ว; รัน build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รันชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้ flag การเลือก provider/model ชุดเดียวกับ `qa suite`
  - การรันแบบสดจะ forward อินพุต auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    provider key ที่อิงกับ env, path config provider แบบสดของ QA และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรี output ต้องอยู่ใต้รากรีโปเพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ได้
  - เขียนรายงาน QA และสรุปปกติพร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิงกับ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build tarball ของ npm จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker รัน onboarding แบบไม่โต้ตอบด้วย OpenAI API key ตั้งค่า Telegram
    เป็นค่าเริ่มต้น ตรวจสอบว่า runtime ของ Plugin ที่แพ็กแล้วโหลดได้โดยไม่ต้องซ่อม
    dependency ตอนเริ่มต้น รัน doctor และรันเทิร์น agent ภายในเครื่องหนึ่งครั้งกับ
    endpoint OpenAI ที่ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลน packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน Docker smoke ของ built-app แบบ deterministic สำหรับ transcript ของ embedded runtime context
    โดยตรวจสอบว่า runtime context ของ OpenClaw ที่ซ่อนอยู่ถูก persist เป็นข้อความ custom
    ที่ไม่แสดงผลแทนที่จะรั่วเข้าไปในเทิร์นผู้ใช้ที่มองเห็น จากนั้น seed JSONL ของ session
    ที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า `openclaw doctor --fix` เขียนใหม่ไปยัง
    active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker รัน onboarding ของ installed-package
    ตั้งค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นนำเลน Telegram QA แบบสดมาใช้ซ้ำ
    โดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในเครื่องที่ resolve แล้วแทนการ
    ติดตั้งจาก registry
  - ใช้ credential env ของ Telegram หรือแหล่ง credential ของ Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret ของ Convex มีอยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ env credential ของ Telegram หรือ Convex บนโฮสต์ก่อน
    งาน build/install ของ Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อจงใจ debug การตั้งค่าก่อน credential
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น
  - GitHub Actions เปิดเผยเลนนี้เป็น workflow แบบ manual สำหรับ maintainer
    `NPM Telegram Beta E2E` โดยจะไม่รันเมื่อ merge workflow ใช้
    environment `qa-live-shared` และ lease credential CI ของ Convex
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับ candidate package หนึ่งรายการ โดยรับ trusted ref, npm spec ที่ publish แล้ว,
  URL tarball HTTPS พร้อม SHA-256 หรืออาร์ติแฟกต์ tarball จากการรันอื่น อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  scheduler Docker E2E ที่มีอยู่ด้วยโปรไฟล์เลน smoke, package, product, full หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน workflow
  Telegram QA กับอาร์ติแฟกต์ `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL tarball แบบเจาะจงต้องมี digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- หลักฐานอาร์ติแฟกต์จะดาวน์โหลดอาร์ติแฟกต์ tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    โดยตั้งค่า OpenAI แล้วเปิดใช้ channel/Plugin ที่ bundled ผ่านการแก้ไข config
  - ตรวจสอบว่า setup discovery เว้น Plugin ที่ดาวน์โหลดได้ซึ่งยังไม่ได้ตั้งค่าไว้
    ให้ไม่ปรากฏ การซ่อม doctor ครั้งแรกที่ตั้งค่าไว้จะติดตั้ง Plugin ที่ดาวน์โหลดได้
    แต่ละรายการที่หายไปอย่างชัดเจน และการ restart ครั้งที่สองจะไม่รันการซ่อม
    dependency ที่ซ่อนอยู่
  - ติดตั้ง baseline npm รุ่นเก่าที่ทราบด้วย เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ล้างเศษ dependency ของ Plugin รุ่นเก่าโดยไม่มีการซ่อม postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดต packaged-install แบบ native ข้าม guest ของ Parallels แต่ละ
    platform ที่เลือกจะติดตั้ง baseline package ที่ร้องขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง
    สถานะการอัปเดต ความพร้อมของ gateway และเทิร์น agent ภายในเครื่องหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ระหว่าง
    iterate กับ guest หนึ่งรายการ ใช้ `--json` สำหรับ path อาร์ติแฟกต์สรุปและ
    สถานะต่อเลน
  - เลน OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐานเทิร์น agent แบบสดเป็น
    ค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบ OpenAI model อื่น
  - ห่อการรันภายในเครื่องที่ยาวด้วย timeout ของโฮสต์ เพื่อไม่ให้ Parallels transport stall
    ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียน log ของเลนแบบซ้อนใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสันนิษฐานว่า outer wrapper ค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลังอัปเดตและงาน
    อัปเดตแพ็กเกจบน guest ที่ยังเย็นอยู่ ซึ่งยังถือว่าปกติเมื่อ log debug ของ npm
    แบบซ้อนยังเดินหน้าอยู่
  - อย่ารัน wrapper แบบรวมนี้พร้อมกันกับเลน smoke ของ Parallels รายตัวสำหรับ
    macOS, Windows หรือ Linux เพราะใช้ state ของ VM ร่วมกันและอาจชนกันที่
    snapshot restore, package serving หรือ state ของ gateway ใน guest
  - หลักฐานหลังอัปเดตรันพื้นผิว Plugin ที่ bundled ตามปกติ เพราะ facade ของ capability
    เช่น speech, image generation และ media understanding ถูกโหลดผ่าน runtime API
    ที่ bundled แม้ว่าเทิร์น agent เองจะตรวจเพียงคำตอบข้อความง่าย ๆ

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ภายในเครื่องสำหรับการทดสอบ protocol smoke โดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน Matrix QA แบบสดกับ Tuwunel homeserver แบบใช้แล้วทิ้งที่อิงกับ Docker เฉพาะ source-checkout เท่านั้น - packaged install ไม่ได้ ship `qa-lab`
  - CLI แบบเต็ม, catalog ของ profile/scenario, env vars และ layout ของอาร์ติแฟกต์: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รันเลน Telegram QA แบบสดกับกลุ่ม private จริงโดยใช้ token ของ driver และ SUT bot จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credential แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled lease
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - ต้องมี bot สองตัวที่แตกต่างกันในกลุ่ม private เดียวกัน โดย SUT bot ต้องเปิดเผย username ของ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจสอบให้แน่ใจว่า driver bot สังเกต traffic ของ bot ในกลุ่มได้
  - เขียนรายงาน Telegram QA, สรุป และอาร์ติแฟกต์ observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่ตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการสังเกตคำตอบของ SUT

เลน transport แบบสดใช้ contract มาตรฐานเดียวกันร่วมกัน เพื่อไม่ให้ transport ใหม่เบี่ยงเบน เมทริกซ์การครอบคลุมต่อเลนอยู่ใน [ภาพรวม QA → การครอบคลุม transport แบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุด synthetic แบบกว้าง และไม่เป็นส่วนหนึ่งของเมทริกซ์นั้น

### Credential ของ Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` แล้ว QA lab จะรับ lease แบบ exclusive จาก pool ที่อิงกับ Convex, Heartbeat
lease นั้นขณะเลนกำลังรัน และปล่อย lease เมื่อ shutdown

scaffold อ้างอิงของโปรเจกต์ Convex:

- `qa/convex-credential-broker/`

env vars ที่ต้องมี:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นของ Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (มีค่าเริ่มต้นเป็น `ci` ใน CI, ไม่เช่นนั้นเป็น `maintainer`)

env vars แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL ของ Convex แบบ loopback `http://` สำหรับการพัฒนาเฉพาะภายในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแลสำหรับ maintainer (pool add/remove/list) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจสอบ URL ของไซต์ Convex, ความลับของ broker,
คำนำหน้า endpoint, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์
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
- `POST /admin/add` (ความลับของ maintainer เท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ความลับของ maintainer เท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ความลับของ maintainer เท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปทรง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปทรงนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มช่องทางเข้า QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: ใช้งาน transport runner บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ plugin, เมานต์เป็น `openclaw qa <runner>` และเขียน scenario ภายใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้มองชุดทดสอบเป็น "ความสมจริงที่เพิ่มขึ้น" (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- คอนฟิก: การรันแบบไม่เจาะจงเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็นคอนฟิกต่อโปรเจกต์เพื่อการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ unit ของ UI ทำงานใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ในโปรเซส (การยืนยันตัวตน Gateway, การกำหนดเส้นทาง, tooling, การแยกวิเคราะห์, คอนฟิก)
  - regression ที่กำหนดผลได้สำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` ในวงกว้างด้วย fixture plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส plugin ที่ bundled จริง การโหลด API ของ plugin จริงควรอยู่ใน
    ชุด contract/integration ที่ plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` แบบไม่เจาะจงเป้าหมายรันคอนฟิก shard ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนโปรเซส root-project แบบ native ขนาดยักษ์ชุดเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลด และป้องกันไม่ให้งาน auto-reply/extension เบียดชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ `vitest.config.ts` root แบบ native เพราะ loop watch แบบหลาย shard ไม่เหมาะกับการใช้งานจริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดผ่าน lane แบบ scoped ก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จะไม่ต้องจ่ายต้นทุนการเริ่มต้นของ root project ทั้งหมด
    - `pnpm test:changed` ขยาย path ของ git ที่เปลี่ยนเป็น lane แบบ scoped ที่ประหยัดตามค่าเริ่มต้น: การแก้ไข test โดยตรง, ไฟล์ sibling `*.test.ts`, การแมปซอร์สที่ระบุชัด และ dependent ใน import-graph ภายในเครื่อง การแก้ไข config/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate การตรวจสอบภายในเครื่องแบบ smart ตามปกติสำหรับงานแคบ มันจำแนก diff เป็น core, การทดสอบ core, extensions, การทดสอบ extension, apps, docs, metadata ของ release, tooling สำหรับ Docker แบบ live และ tooling จากนั้นรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดสำหรับหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็น metadata ของ release เท่านั้นจะรันการตรวจสอบเวอร์ชัน/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข harness ACP ของ Docker แบบ live จะรันการตรวจสอบที่โฟกัส: syntax ของ shell สำหรับสคริปต์ auth ของ Docker แบบ live และ dry-run ของ scheduler Docker แบบ live การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่นยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบ unit แบบ import-light จาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีล้วนที่คล้ายกัน จะถูกส่งผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime-heavy ยังคงอยู่บน lane เดิม
    - ไฟล์ซอร์สตัวช่วย `plugin-sdk` และ `commands` ที่เลือกไว้บางไฟล์ยังแมปการรัน changed-mode ไปยังการทดสอบ sibling ที่ระบุชัดใน lane เบาเหล่านั้นด้วย ดังนั้นการแก้ไขตัวช่วยจะหลีกเลี่ยงการรันชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับตัวช่วย core ระดับบนสุด, การทดสอบ integration `reply.*` ระดับบนสุด และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply เป็น shard ของ agent-runner, dispatch และ commands/state-routing เพิ่มเติม เพื่อไม่ให้ bucket ที่ import หนักหนึ่งชุดเป็นเจ้าของ tail ของ Node ทั้งหมด
    - CI สำหรับ PR/main ปกติจงใจข้าม extension batch sweep และ shard `agentic-plugins` ที่ใช้เฉพาะ release การตรวจสอบ Full Release Validation จะ dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยน input สำหรับการค้นพบ message-tool หรือ context runtime ของ compaction
      ให้คง coverage ทั้งสองระดับไว้
    - เพิ่ม regression ของตัวช่วยที่โฟกัสสำหรับขอบเขต routing และ normalization
      แบบล้วน
    - รักษาชุด integration ของ embedded runner ให้ทำงานดี:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม compaction ยังคงไหล
      ผ่าน path `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะตัวช่วย
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับ path integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานตั้งค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้
      runner แบบไม่ isolated ทั่วทั้งโปรเจกต์ root, e2e และคอนฟิก live
    - lane UI ของ root คง setup และ optimizer `jsdom` ไว้ แต่ก็รันบน
      runner แบบไม่ isolated ที่ใช้ร่วมกันเช่นกัน
    - shard `pnpm test` แต่ละชุดสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` สำหรับโปรเซส Node ลูกของ Vitest
      ตามค่าเริ่มต้นเพื่อลด V8 compile churn ระหว่างการรันภายในเครื่องขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff เรียก lane สถาปัตยกรรมใดบ้าง
    - hook pre-commit ทำเฉพาะ formatting เท่านั้น มัน stage ไฟล์ที่จัดรูปแบบแล้วใหม่ และ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องใช้ gate การตรวจสอบภายในเครื่องแบบ smart
    - `pnpm test:changed` ส่งผ่าน lane แบบ scoped ที่ประหยัดตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract ต้องการ
      coverage ของ Vitest ที่กว้างกว่าจริงๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่มี worker cap ที่สูงกว่า
    - การปรับขนาด worker ภายในเครื่องโดยอัตโนมัตินั้นตั้งใจให้ conservative และลดระดับลง
      เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกัน
      จึงสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานกำหนด projects/config files เป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำ changed-mode ยังคงถูกต้องเมื่อ wiring ของ test
      เปลี่ยน
    - คอนฟิกคง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดใช้งานบนโฮสต์ที่รองรับ
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดหนึ่งตำแหน่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดใช้รายงาน import-duration ของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดขอบเขตมุมมอง profiling เดียวกันไปยัง
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้ path ของคอนฟิกเป็น key; shard ของ CI แบบ include-pattern
      จะต่อท้ายชื่อ shard เพื่อให้ติดตาม shard ที่ถูกกรองได้
      แยกกัน
    - เมื่อการทดสอบที่ร้อนหนึ่งรายการยังคงใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency ที่หนักไว้หลัง seam `*.runtime.ts` ภายในเครื่องที่แคบ และ
      mock seam นั้นโดยตรงแทนการ deep-import ตัวช่วย runtime เพียง
      เพื่อส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ routed กับ path root-project แบบ native สำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดย routing รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ของ root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead การเริ่มต้นและ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profiles ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงพร้อมเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ Gateway สังเคราะห์, memory และ large-payload ผ่าน path เหตุการณ์ diagnostic
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - assert ว่า recorder ยังคงมีขอบเขต, ตัวอย่าง RSS สังเคราะห์อยู่ต่ำกว่า pressure budget และ queue depth ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - lane แคบสำหรับการติดตาม stability-regression ไม่ใช่ตัวแทนของชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ bundled-Plugin ภายใต้ `extensions/`
- ค่าเริ่มต้นของ Runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของ repo
  - ใช้ worker แบบปรับตามสภาพแวดล้อม (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - ทำงานในโหมดเงียบเป็นค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดใช้ output ของ console แบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ Gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ Node และ networking ที่หนักขึ้น
- ความคาดหวัง:
  - ทำงานใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนที่เคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Gateway OpenShell แบบแยก isolated บน host ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile local ชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ใช้แบบ opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องพร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolated แล้วทำลาย Gateway และ sandbox สำหรับการทดสอบ
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary หรือ wrapper script ของ CLI ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ bundled-Plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?"
  - ตรวจจับการเปลี่ยนแปลง format ของผู้ให้บริการ, พฤติกรรมเฉพาะของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ตั้งใจให้ไม่เสถียรสำหรับ CI (network จริง, policy จริงของผู้ให้บริการ, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่แคบลงแทน "ทุกอย่าง"
- การรัน live จะ source `~/.profile` เพื่อดึง API key ที่ขาดอยู่
- โดยค่าเริ่มต้น การรัน live ยังคง isolate `HOME` และคัดลอก config/auth material ไปยัง test home ชั่วคราว เพื่อให้ fixture ของ unit ไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นเป็นค่าเริ่มต้น: ยังคง output ความคืบหน้า `[live] ...` ไว้ แต่ซ่อน notice เพิ่มเติมของ `~/.profile` และ mute log bootstrap ของ Gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ response ของ rate limit
- output ความคืบหน้า/Heartbeat:
  - ตอนนี้ชุด live จะ emit บรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า call ไปยังผู้ให้บริการที่ใช้เวลานานยัง active อยู่ แม้การ capture console ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการดัก console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/Gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ Gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- แก้ logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ Gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- debug "บอทของฉันล่ม" / failure เฉพาะผู้ให้บริการ / tool calling: รัน `pnpm test:live` แบบแคบลง

## การทดสอบ Live (แตะ network)

สำหรับ matrix ของโมเดล live, smoke ของ backend CLI, smoke ของ ACP, harness ของ Codex app-server
และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - รวมถึงการจัดการ credential สำหรับการรัน live - ดู
[การทดสอบชุด live](/th/help/testing-live) สำหรับ checklist เฉพาะด้านการอัปเดตและ
การตรวจสอบ Plugin ดู
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## Docker runner (การตรวจสอบ "ใช้งานได้ใน Linux" แบบ optional)

Docker runner เหล่านี้แบ่งเป็นสองกลุ่ม:

- runner โมเดล live: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ที่ตรงกับ profile-key ของตัวเองภายใน Docker image ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount config dir และ workspace local ของคุณ (และ source `~/.profile` หาก mount ไว้) entrypoint local ที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runner ใช้ smoke cap ที่เล็กกว่าเป็นค่าเริ่มต้นเพื่อให้การ sweep Docker แบบเต็มยังใช้งานได้จริง:
  `test:docker:live-models` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env var เหล่านี้เมื่อคุณ
  ต้องการ scan ที่ใหญ่และครอบคลุมกว่าอย่างชัดเจน
- `test:docker:all` build Docker image สำหรับ live หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้น build/reuse image `scripts/e2e/Dockerfile` สองรายการ image แบบ bare เป็นเพียง runner Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้า image แบบ functional ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันของแอปที่ build แล้ว definition ของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` execute plan ที่เลือก aggregate ใช้ scheduler local แบบ weighted: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slot ส่วน resource cap ป้องกันไม่ให้ lane ที่หนักอย่าง live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่ active อยู่ scheduler ยังสามารถเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วให้รันเดี่ยวต่อไปจนกว่าจะมี capacity กลับมาอีกครั้ง ค่าเริ่มต้นคือ 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ host Docker มี headroom มากขึ้น runner จะทำ Docker preflight เป็นค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่ยาวกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane แบบ weighted โดยไม่ build หรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ plan ของ CI สำหรับ lane ที่เลือก, ความต้องการ package/image และ credential
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ใช้งานได้เป็น product หรือไม่?" โดย resolve candidate package หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, upload เป็น `package-under-test` จากนั้นรัน lane Docker E2E ที่ reusable กับ tarball นั้นอย่างตรงตัว แทนการ repack ref ที่เลือก profile เรียงตามความกว้าง: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับ contract ของ package/update/Plugin, matrix ของ published-upgrade survivor, ค่าเริ่มต้นของ release และการ triage failure
- การตรวจสอบ build และ release จะรัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน graph ที่ build แล้วแบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และ fail หาก startup ก่อน dispatch import dependency ของ package เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; นอกจากนี้ยังคุม chunk การรัน Gateway ที่ bundle แล้วให้อยู่ใน budget และปฏิเสธ static import ของ cold Gateway path ที่รู้จัก smoke ของ CLI แบบ packaged ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- compatibility แบบ legacy ของ Package Acceptance ถูกจำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่างของ metadata ใน package ที่เคย ship แล้ว: รายการ private QA inventory ที่ถูก omit, ไม่มี `gateway install --wrapper`, ไม่มีไฟล์ patch ใน git fixture ที่ derived จาก tarball, ไม่มี `update.channel` ที่ persist ไว้, ตำแหน่ง legacy ของ plugin install-record, ไม่มีการ persist marketplace install-record และการ migrate config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นจะเป็น failure แบบเข้มงวด
- runner smoke ของ container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` boot container จริงหนึ่งตัวหรือมากกว่า และตรวจสอบ path integration ระดับสูง

Docker runner ของโมเดล live ยัง bind-mount เฉพาะ CLI auth home ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกทำให้แคบลง) แล้วคัดลอกไปยัง home ของ container ก่อนการรัน เพื่อให้ OAuth ของ external-CLI refresh token ได้โดยไม่แก้ไข auth store ของ host:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์ dev: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` เป็นเลน private QA source-checkout ตั้งใจไม่รวมไว้ในเลน Docker release ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, การ scaffold เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น, รัน doctor และรันหนึ่งเทิร์นเอเจนต์ OpenAI แบบ mock ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บน host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยน channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจสอบ channel ที่ persist ไว้และการทำงานหลังอัปเดตของ plugin จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มีเอเจนต์, การกำหนดค่า channel, allowlist ของ plugin, สถานะ dependency ของ plugin ที่เก่า และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบ non-interactive โดยไม่มี live provider หรือ channel keys จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงไว้ของ config/state รวมถึง budget ของ startup/status
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริง, กำหนดค่า baseline นั้นด้วย baked command recipe, ตรวจสอบ config ที่ได้, อัปเดต install ที่ publish แล้วนั้นไปยัง candidate tarball, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intent ที่กำหนดค่าไว้, การคงไว้ของ state, startup, `/healthz`, `/readyz` และ budget ของสถานะ RPC override baseline หนึ่งรายการได้ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ aggregate scheduler ขยาย baseline local ที่เจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยาย fixture ที่มีรูปร่างตาม issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมการติดตั้ง OpenClaw plugin ภายนอกโดยอัตโนมัติ Package Acceptance เปิดเผยสิ่งเหล่านี้เป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`, resolve โทเค็น meta baseline เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยาย package gate แบบ release-soak เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` ตรวจสอบการ persist transcript ของ hidden runtime context พร้อมการซ่อมโดย doctor สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งได้รับผลกระทบ
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน bundled image providers แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache เดียวร่วมกันระหว่างคอนเทนเนอร์ root, update และ direct-npm ของมัน Update smoke ใช้ค่าเริ่มต้นเป็น npm `latest` เป็น stable baseline ก่อนอัปเกรดเป็น candidate tarball override ได้ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบ installer แบบ non-root เก็บ npm cache ที่แยกไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของปิดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำในการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดต direct-npm global ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุมการใช้ `npm install -g` โดยตรง
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image จาก root Dockerfile ตามค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อม workspace หนึ่งรายการใน container home ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้ image install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E จาก source พร้อม layer ของ Chromium, เริ่ม Chromium ด้วย raw CDP, รัน `browser doctor --deep` และตรวจสอบว่า snapshot ของ role จาก CDP ครอบคลุม URL ของลิงก์, clickable ที่ cursor-promoted, iframe refs และ metadata ของ frame
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบ mock ผ่าน Gateway, ตรวจสอบว่า `web_search` เพิ่ม `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ provider schema reject และตรวจสอบว่ารายละเอียดดิบปรากฏใน log ของ Gateway
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ใน bundle ของ Pi (เซิร์ฟเวอร์ stdio MCP จริง + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (Gateway จริง + การ teardown ของ child stdio MCP หลังการรัน cron แบบ isolated และ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke สำหรับ local path, `file:`, npm registry ที่มี dependency แบบ hoisted, git moving refs, ClawHub kitchen-sink, marketplace updates และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่ package/runtime แบบ kitchen-sink เริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในที่แยกขาดจากภายนอก
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วในคอนเทนเนอร์เปล่า, ติดตั้ง npm plugin, สลับ enable/disable, อัปเกรดและดาวน์เกรดผ่าน npm registry ในเครื่อง, ลบโค้ดที่ติดตั้งแล้ว จากนั้นตรวจสอบว่า uninstall ยังลบ stale state ได้ พร้อม log metric RSS/CPU สำหรับแต่ละช่วงของ lifecycle
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุม install/update smoke สำหรับ local path, `file:`, npm registry ที่มี dependency แบบ hoisted, git moving refs, fixture ของ ClawHub, marketplace updates และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ plugin ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง npm plugin พร้อมติดตาม resource, enable, disable, upgrade, downgrade และการ uninstall เมื่อโค้ดหายไป

เพื่อ prebuild และใช้ shared functional image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

override image เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังมีผลเหนือกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง remote shared image สคริปต์จะ pull image นั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer เก็บ Dockerfile ของตัวเองไว้ เพราะตรวจสอบพฤติกรรมของ package/install แทนที่จะเป็น runtime ของ built-app ที่ใช้ร่วมกัน

ตัวเรียกใช้ Docker สำหรับโมเดลสดจะ bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวด้วย และ
stage มันเข้าไปใน workdir ชั่วคราวภายในคอนเทนเนอร์ สิ่งนี้ทำให้ runtime
image มีขนาดเล็ก ขณะที่ยังคงรัน Vitest กับซอร์ส/คอนฟิกโลคัลที่ตรงกันของคุณ
ขั้นตอน staging จะข้ามแคชขนาดใหญ่ที่มีเฉพาะในเครื่องและเอาต์พุตการ build แอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` เฉพาะแอปหรือ
Gradle เพื่อให้การรัน Docker live ไม่ใช้เวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
นอกจากนี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ gateway live probes ไม่เริ่ม
channel workers จริงของ Telegram/Discord/ฯลฯ ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น gateway
live coverage จาก Docker lane นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ OpenClaw gateway พร้อมเปิดใช้งาน HTTP endpoints ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันที่ pin ไว้กับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default`, จากนั้นส่ง
คำขอแชทจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
lane นี้คาดหวัง key โมเดลสดที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) เป็นวิธีหลักในการจัดเตรียม key นั้นในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้กำหนดผลลัพธ์ได้แน่นอน และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway ที่ seed ไว้,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบ
การค้นหาบทสนทนาที่ route แล้ว, การอ่าน transcript, metadata ของ attachment,
พฤติกรรม live event queue, การ route การส่ง outbound และการแจ้งเตือน channel +
permission แบบ Claude ผ่านสะพาน stdio MCP จริง การตรวจสอบการแจ้งเตือน
ตรวจดูเฟรม stdio MCP ดิบโดยตรง ดังนั้น smoke จึงตรวจสอบสิ่งที่
bridge emit จริง ไม่ใช่แค่สิ่งที่ client SDK เฉพาะตัวหนึ่งบังเอิญแสดงออกมา
`test:docker:pi-bundle-mcp-tools` กำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้ live
model key มัน build image Docker ของ repo, เริ่มเซิร์ฟเวอร์ probe MCP stdio จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime MCP ของ Pi bundle
ที่ฝังอยู่, execute tool, จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
tools `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองออก
`test:docker:cron-mcp-cleanup` กำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้ live model
key มันเริ่ม Gateway ที่ seed ไว้พร้อมเซิร์ฟเวอร์ probe MCP stdio จริง, รัน
cron turn แบบ isolated และ child turn แบบ one-shot ของ `/subagents spawn`, จากนั้นตรวจสอบว่า
process ลูก MCP exit หลังจากการรันแต่ละครั้ง

Manual ACP plain-language thread smoke (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจต้องใช้อีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบมัน

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปยัง `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปยัง `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปยัง `/home/node/.profile` และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปยัง `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่ cache ไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ external CLI ภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกเข้าไปใน `/home/node/...` ก่อนเริ่ม tests
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง providers ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อนำ image `openclaw:local-live` ที่มีอยู่มาใช้ซ้ำสำหรับการ rerun ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image Open WebUI ที่ pin ไว้

## การตรวจสอบความสมเหตุสมผลของเอกสาร

รันการตรวจสอบเอกสารหลังจากแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือ regression แบบ "real pipeline" โดยไม่มี providers จริง:

- Gateway tool calling (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

เรามี tests ที่ปลอดภัยสำหรับ CI อยู่แล้วสองสามรายการซึ่งทำงานเหมือน "agent reliability evals":

- Mock tool-calling ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- Flow wizard แบบ end-to-end ที่ตรวจสอบ session wiring และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ skills ใน prompt, agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงอันที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาเวิร์กโฟลว์:** สถานการณ์หลาย turn ที่ assert ลำดับ tool, การส่งต่อ session history และขอบเขต sandbox

evals ในอนาคตควรกำหนดผลลัพธ์ได้แน่นอนก่อน:

- scenario runner ที่ใช้ mock providers เพื่อ assert tool calls + order, การอ่านไฟล์ skill และ session wiring
- ชุดเล็กของสถานการณ์ที่เน้น skill (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- optional live evals (opt-in, gated ด้วย env) หลังจากมี suite ที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปร่างของ plugin และ channel)

Contract tests ตรวจสอบว่า plugin และ channel ทุกตัวที่ลงทะเบียนไว้สอดคล้องกับ
interface contract ของตัวเอง พวกมัน iterate ผ่าน plugins ทั้งหมดที่ค้นพบและรันชุด
assertions ด้าน shape และ behavior lane unit ของ `pnpm test` ค่าเริ่มต้นตั้งใจ
ข้าม shared seam และ smoke files เหล่านี้; ให้รันคำสั่ง contract โดยชัดเจน
เมื่อคุณแตะ shared channel หรือ provider surfaces

### คำสั่ง

- contracts ทั้งหมด: `pnpm test:contracts`
- channel contracts เท่านั้น: `pnpm test:contracts:channels`
- provider contracts เท่านั้น: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ plugin (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความ inbound
- **actions** - ตัวจัดการ channel action
- **threading** - การจัดการ thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - Channel status probes
- **registry** - รูปร่างของ plugin registry

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของ auth flow
- **auth-choice** - การเลือก/selection auth
- **catalog** - Model catalog API
- **discovery** - การค้นพบ plugin
- **loader** - การโหลด plugin
- **runtime** - Provider runtime
- **shape** - รูปร่าง/interface ของ plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังจากเปลี่ยน plugin-sdk exports หรือ subpaths
- หลังจากเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลังจาก refactor การลงทะเบียนหรือการค้นพบ plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหา provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (mock/stub provider หรือ capture การแปลง request-shape ที่แน่นอน)
- ถ้าโดยธรรมชาติเป็น live-only (rate limits, auth policies) ให้ทำ live test ให้แคบและ opt-in ผ่าน env vars
- ควร target layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug การแปลง/replay คำขอ provider → direct models test
  - bug ใน gateway session/history/tool pipeline → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก registry metadata (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า exec ids แบบ traversal-segment ถูกปฏิเสธ
  - ถ้าคุณเพิ่ม family ของ target `includeInPlan` SecretRef ใหม่ใน `src/secrets/target-registry-data.ts`, ให้อัปเดต `classifyTargetClass` ใน test นั้น test ตั้งใจ fail กับ target ids ที่ยังไม่จัดคลาส เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
