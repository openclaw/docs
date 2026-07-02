---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มรีเกรสชันสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway และเอเจนต์
summary: 'ชุดทดสอบ: ชุด unit/e2e/live, Docker runners และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-07-02T08:55:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุดเล็กๆ
ของตัวรัน Docker เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งใดที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, debugging)
- การทดสอบ live ค้นพบข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการจากโลกจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม พื้นผิวคำสั่ง และการเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) - อ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [Maturity scorecard](/th/maturity/scorecard) - หลักฐาน QA ของ release สนับสนุนการตัดสินใจด้านเสถียรภาพและ LTS อย่างไร
- [QA channel](/th/channels/qa-channel) - Plugin ขนส่งจำลองที่ใช้โดย scenario ที่ผูกกับ repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและตัวรัน Docker/Parallels ส่วนตัวรันเฉพาะ QA ด้านล่าง ([ตัวรันเฉพาะ QA](#qa-specific-runners)) แสดงการเรียกใช้ `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไป:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite ในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรเหลือเฟือ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การเจาะจงไฟล์โดยตรงตอนนี้ route path ของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อคุณกำลังวนแก้ failure เดียว ให้เริ่มจากการรันแบบเจาะจงก่อน
- ไซต์ QA ที่มี Docker รองรับ: `pnpm qa:lab:up`
- lane QA ที่มี Linux VM รองรับ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะต้องการทดสอบหรือต้องการความมั่นใจเพิ่มเติม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

## ไดเรกทอรีชั่วคราวของการทดสอบ

ควรใช้ helper ที่ใช้ร่วมกันใน `test/helpers/temp-dir.ts` สำหรับไดเรกทอรีชั่วคราว
ที่การทดสอบเป็นเจ้าของ พวกมันทำให้ความเป็นเจ้าของชัดเจนและเก็บ cleanup ไว้ใน
วงจรชีวิตเดียวกับการทดสอบ:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` ตั้งใจไม่เปิดเผยเมธอด cleanup แบบ manual; Vitest
เป็นเจ้าของ cleanup หลังแต่ละการทดสอบ helper ระดับต่ำเดิมยังคงอยู่สำหรับการทดสอบที่
ยังไม่ได้ย้าย แต่การทดสอบใหม่และที่ย้ายแล้วควรใช้ tracker ที่ cleanup อัตโนมัติ
หลีกเลี่ยงการใช้ `makeTempDir`, `cleanupTempDirs` หรือ
`createTempDirTracker` แบบ manual ใหม่ และหลีกเลี่ยงการเรียก `fs.mkdtemp*`
เปล่าๆ ใหม่ในการทดสอบ เว้นแต่ case นั้นกำลังตรวจสอบพฤติกรรม temp-dir ดิบอย่างชัดเจน
เพิ่มคอมเมนต์ allow ที่ตรวจสอบได้พร้อมเหตุผลที่เป็นรูปธรรมเมื่อการทดสอบตั้งใจต้องใช้
ไดเรกทอรีชั่วคราวเปล่าๆ:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

เพื่อให้เห็นภาพการ migration, `node scripts/report-test-temp-creations.mjs` จะรายงาน
การสร้าง temp-dir เปล่าๆ ใหม่และการใช้ shared-helper แบบ manual ใหม่ในบรรทัด diff
ที่เพิ่มเข้ามา โดยไม่บล็อกสไตล์ cleanup เดิม ขอบเขตไฟล์ของมันตั้งใจทำตาม
การจัดประเภท test-path เดียวกับที่ `scripts/changed-lanes.mjs` ใช้
แทนที่จะดูแล heuristic ชื่อไฟล์ test-helper แยกต่างหาก พร้อมทั้งข้าม
implementation ของ shared helper เอง `check:changed` รันรายงานนี้สำหรับ
path การทดสอบที่เปลี่ยนเป็นสัญญาณ CI แบบ warning-only; findings เป็น annotation
คำเตือนของ GitHub ไม่ใช่ failure

เมื่อ debug ผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (โมเดล + probe ของ gateway tool/image): `pnpm test:live`
- เจาะจงไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพ runtime: dispatch `OpenClaw Performance` ด้วย
  `live_openai_candidate=true` สำหรับ agent turn จริงของ `openai/gpt-5.5` หรือ
  `deep_profile=true` สำหรับ artifact CPU/heap/trace ของ Kova การรันตามกำหนดรายวัน
  publish artifact lane mock-provider, deep-profile และ GPT 5.5 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว
  รายงาน mock-provider ยังรวมตัวเลขระดับซอร์สสำหรับการ boot gateway, memory,
  plugin-pressure, fake-model hello-loop ซ้ำ และ CLI startup
- การ sweep โมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - โมเดลที่เลือกแต่ละตัวตอนนี้รัน text turn พร้อม probe แบบ file-read ขนาดเล็ก
    โมเดลที่ metadata โฆษณาว่ารับ input แบบ `image` จะรัน image turn ขนาดเล็กด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกปัญหาผู้ให้บริการ
  - Coverage ของ CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ทั้งคู่เรียก workflow live/E2E ที่ใช้ซ้ำได้ด้วย
    `include_live_suites: true` ซึ่งรวม job matrix โมเดล live ของ Docker แยกต่างหาก
    ที่ shard ตามผู้ให้บริการ
  - สำหรับการ rerun CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ผู้ให้บริการที่สัญญาณสูงใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller
    scheduled/release ของมัน
- Smoke native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รัน lane live ของ Docker กับ path app-server ของ Codex, bind Slack DM จำลองด้วย
    `/codex bind`, exercise `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบ reply ธรรมดาและ image attachment
    ว่า route ผ่าน binding Plugin แบบ native แทน ACP
- Smoke harness app-server ของ Codex: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turn ผ่าน harness app-server ของ Codex ที่ Plugin เป็นเจ้าของ
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้นจะ exercise probe สำหรับ image,
    cron MCP, sub-agent และ Guardian ปิด probe sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยก failure อื่นของ
    app-server Codex สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลัง probe sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Smoke การติดตั้ง Codex แบบ on-demand: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง tarball OpenClaw ที่แพ็กแล้วใน Docker, รัน onboarding ด้วย OpenAI API-key
    และตรวจสอบว่า Plugin Codex พร้อม dependency `@openai/codex`
    ถูกดาวน์โหลดเข้า root โปรเจกต์ npm ที่จัดการไว้ตามต้องการ
- Smoke dependency ของ live plugin tool: `pnpm test:docker:live-plugin-tool`
  - แพ็ก fixture Plugin ที่มี dependency `slugify` จริง ติดตั้งผ่าน
    `npm-pack:` ตรวจสอบ dependency ใต้ root โปรเจกต์ npm ที่จัดการไว้
    จากนั้นขอให้โมเดล OpenAI แบบ live เรียก plugin tool และคืน slug ที่ซ่อนอยู่
- Smoke คำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจ opt-in แบบ belt-and-suspenders สำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    มัน exercise `/crestodian status`, queue การเปลี่ยนโมเดลแบบ persistent,
    reply `/crestodian yes` และตรวจสอบ path การเขียน audit/config
- Smoke Docker ของ planner Crestodian: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit
- Smoke Docker ของ first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก state dir ของ OpenClaw ที่ว่าง ตรวจสอบ entrypoint Crestodian แบบ onboard สมัยใหม่
    ใช้การเขียน setup/model/agent/Discord Plugin + SecretRef,
    validate config และตรวจสอบรายการ audit path setup Ring 0 เดียวกันนี้ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Smoke ค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกอิสระกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของผู้ช่วยเก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียง case ที่ล้มเหลวหนึ่ง case ให้เลือกจำกัดการทดสอบ live ผ่าน env var allowlist ที่อธิบายไว้ด้านล่าง
</Tip>

## ตัวรันเฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ workflow PR แบบ standalone
การ validation แบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release
แบบ stable/default เก็บ live/Docker soak แบบละเอียดไว้หลัง `run_release_soak=true`;
profile `full` บังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อม lane mock parity, lane live
Matrix, lane Telegram live ที่ Convex จัดการ และ lane Discord live ที่ Convex จัดการ
เป็น job แบบ parallel Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่า default ของ Matrix CLI และ input workflow แบบ manual
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็น job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อม lane Matrix และ Telegram แบบ fast ก่อนการอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ deterministic
และหลีกเลี่ยง startup ปกติของ provider-plugin gateway ขนส่งแบบ live เหล่านี้
ปิด memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

Shard live media ของ full release ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Shard โมเดล/backend แบบ live ของ Docker ใช้ image ที่ใช้ร่วมกัน
`ghcr.io/openclaw/openclaw-live-test:<sha>` ซึ่ง build หนึ่งครั้งต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อ้างอิงจาก repo โดยตรงบนโฮสต์
  - เขียนอาร์ติแฟกต์ระดับบนสุด `qa-evidence.json`, `qa-suite-summary.json` และ
    `qa-suite-report.md` สำหรับชุดสถานการณ์ที่เลือก รวมถึงการเลือกสถานการณ์
    mixed flow, Vitest และ Playwright
  - เมื่อถูกสั่งงานโดย `pnpm openclaw qa run --qa-profile <profile>` จะฝัง
    scorecard โปรไฟล์ taxonomy ที่เลือกไว้ใน `qa-evidence.json` เดียวกัน
    `smoke-ci` เขียนหลักฐานแบบย่อ ซึ่งตั้งค่า `evidenceMode: "slim"` และละเว้น
    `execution` รายรายการ `release` ครอบคลุมส่วน release-readiness ที่คัดไว้;
    `all` เลือกทุกหมวดหมู่ maturity ที่ใช้งานอยู่ และมีไว้สำหรับการสั่งงาน
    workflow QA Profile Evidence แบบชัดเจนเมื่อจำเป็นต้องมีอาร์ติแฟกต์ scorecard
    ฉบับเต็ม
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการพร้อมกันตามค่าเริ่มต้นด้วย worker ของ
    gateway ที่แยกกัน `qa-channel` ใช้ concurrency ค่าเริ่มต้นเป็น 4 (จำกัดตาม
    จำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ lane แบบ serial เดิม
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มี exit code ที่ล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ provider ภายในเครื่องที่ใช้ AIMock สำหรับ coverage
    fixture เชิงทดลองและ protocol-mock โดยไม่แทนที่ lane `mock-openai` ที่รับรู้
    สถานการณ์
- `pnpm openclaw qa coverage --match <query>`
  - ค้นหา ID สถานการณ์ ชื่อเรื่อง surface, coverage ID, docs ref, code ref,
    plugins และข้อกำหนด provider จากนั้นพิมพ์เป้าหมาย suite ที่ตรงกัน
  - ใช้คำสั่งนี้ก่อนการรัน QA Lab เมื่อคุณรู้พฤติกรรมหรือพาธไฟล์ที่ถูกแตะ แต่ไม่รู้
    สถานการณ์ที่เล็กที่สุด คำสั่งนี้เป็นเพียงคำแนะนำเท่านั้น; ยังต้องเลือกหลักฐาน
    mock, live, Multipass, Matrix หรือ transport จากพฤติกรรมที่กำลังถูกเปลี่ยน
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้ live OpenAI Kitchen Sink plugin gauntlet ผ่าน QA Lab โดยจะติดตั้ง
    แพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory ของพื้นผิว plugin SDK
    probe `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ gateway
    เรียกใช้เทิร์น OpenAI แบบ live และตรวจสอบ diagnostics เชิง adversarial
    ต้องมี auth OpenAI แบบ live เช่น `OPENAI_API_KEY` ในเซสชัน Testbox ที่ hydrate
    แล้ว จะ source โปรไฟล์ live-auth ของ Testbox โดยอัตโนมัติเมื่อมี helper
    `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ gateway startup bench พร้อมชุดสถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวมไว้ใต้
    `.artifacts/gateway-cpu-scenarios/`
  - flag เฉพาะการสังเกต CPU ร้อนที่ต่อเนื่องตามค่าเริ่มต้น (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น burst สั้นช่วงเริ่มต้นจะถูกบันทึกเป็น
    metric โดยไม่ดูเหมือน regression ที่ทำให้ gateway ใช้ CPU เต็มนานหลายนาที
  - ใช้อาร์ติแฟกต์ `dist` ที่ build แล้ว; ให้รัน build ก่อนเมื่อ checkout ยังไม่มี
    runtime output ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ QA suite เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์
  - ใช้ flag การเลือก provider/model เดียวกับ `qa suite`
  - การรันแบบ live จะ forward input auth ของ QA ที่รองรับและเหมาะกับ guest:
    key ของ provider จาก env, พาธ config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรี output ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน workspace
    ที่ mount ไว้ได้
  - เขียนรายงานและสรุป QA ปกติพร้อม log ของ Multipass ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่ใช้ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - build npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน Docker
    เรียกใช้ onboarding แบบไม่โต้ตอบด้วย OpenAI API-key, config Telegram
    ตามค่าเริ่มต้น ตรวจสอบว่า packaged plugin runtime โหลดได้โดยไม่ต้องซ่อม
    dependency ตอนเริ่มต้น รัน doctor และรันหนึ่งเทิร์นของ agent ภายในเครื่องกับ
    endpoint OpenAI แบบ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน lane การติดตั้งแพ็กเกจ
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - เรียกใช้ smoke ของ Docker สำหรับแอปที่ build แล้วแบบ deterministic สำหรับ
    transcript ของ embedded runtime context โดยตรวจสอบว่า context runtime ของ
    OpenClaw ที่ซ่อนอยู่ถูก persist เป็นข้อความ custom แบบไม่แสดงผล แทนที่จะรั่วไป
    ในเทิร์นผู้ใช้ที่มองเห็นได้ จากนั้น seed JSONL ของเซสชันเสียที่ได้รับผลกระทบ
    และตรวจสอบว่า `openclaw doctor --fix` เขียนใหม่ไปยัง branch ที่ใช้งานอยู่
    พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker เรียกใช้ onboarding ของ
    แพ็กเกจที่ติดตั้ง config Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นนำ lane QA
    Telegram แบบ live กลับมาใช้โดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - wrapper mount เฉพาะ source ของ harness `qa-lab` จาก checkout; แพ็กเกจที่
    ติดตั้งเป็นเจ้าของ `dist`, `openclaw/plugin-sdk` และ bundled plugin runtime
    ดังนั้น lane จะไม่ผสม plugins จาก checkout ปัจจุบันเข้าไปในแพ็กเกจที่ทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในเครื่องที่ resolve แล้ว
    แทนการติดตั้งจาก registry
  - ปล่อย timing RTT ซ้ำใน `qa-evidence.json` ตามค่าเริ่มต้นด้วย
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` override
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับการรัน RTT
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` รับรายการ ID การตรวจสอบ QA ของ Telegram
    ที่คั่นด้วยจุลภาคเพื่อสุ่มตัวอย่าง; เมื่อไม่ได้ตั้งค่า การตรวจสอบเริ่มต้นที่รองรับ
    RTT คือ `telegram-mentioned-message-reply`
  - ใช้ credential env ของ Telegram หรือแหล่ง credential Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ secret ของ role หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และ secret ของ role Convex อยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ credential env ของ Telegram หรือ Convex บนโฮสต์ก่อนงาน
    build/install ของ Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อจงใจ debug การตั้งค่าก่อน credential
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันเฉพาะสำหรับ lane นี้เท่านั้น เมื่อเลือก
    credential Convex และไม่ได้ตั้ง role wrapper จะใช้ `ci` ใน CI และ
    `maintainer` นอก CI
  - GitHub Actions เปิดเผย lane นี้เป็น workflow สำหรับ maintainer แบบ manual
    `NPM Telegram Beta E2E` โดยจะไม่รันตอน merge workflow ใช้ environment
    `qa-live-shared` และ lease credential Convex CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับแพ็กเกจ candidate หนึ่งรายการ โดยรับ ref ที่เชื่อถือได้, spec npm ที่ publish แล้ว,
  URL tarball แบบ HTTPS พร้อม SHA-256 หรืออาร์ติแฟกต์ tarball จาก run อื่น
  อัปโหลด `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test`
  จากนั้นรัน scheduler Docker E2E ที่มีอยู่ด้วยโปรไฟล์ lane แบบ smoke, package,
  product, full หรือ custom ตั้งค่า `telegram_mode=mock-openai` หรือ
  `live-frontier` เพื่อรัน workflow QA ของ Telegram กับอาร์ติแฟกต์
  `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL tarball ที่เจาะจงต้องใช้ digest และใช้นโยบายความปลอดภัยของ URL สาธารณะ:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- mirror tarball สำหรับ enterprise/private ใช้นโยบาย trusted-source แบบชัดเจน:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` อ่าน `.github/package-trusted-sources.json` จาก ref workflow ที่เชื่อถือได้ และไม่รับ credential ของ URL หรือ bypass private-network จาก workflow-input หากนโยบายที่ตั้งชื่อประกาศ bearer auth ให้ config secret คงที่ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`

- หลักฐานอาร์ติแฟกต์ดาวน์โหลดอาร์ติแฟกต์ tarball จาก run ของ Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - pack และติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    โดย config OpenAI แล้วเปิดใช้งาน channel/plugins ที่ bundled ผ่านการแก้ config
  - ตรวจสอบว่า setup discovery ไม่ทิ้ง plugins ที่ดาวน์โหลดได้แต่ยังไม่ได้ config ไว้,
    doctor repair ครั้งแรกที่ถูก config ติดตั้ง plugin ที่ดาวน์โหลดได้แต่ละตัวที่หายไปอย่าง
    ชัดเจน และการ restart ครั้งที่สองไม่รันการซ่อม dependency ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ เปิดใช้งาน Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ
    candidate ทำความสะอาดเศษ dependency ของ plugin รุ่นเก่าโดยไม่มีการซ่อม
    postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - เรียกใช้ smoke การอัปเดต packaged-install แบบ native ข้าม guest ของ Parallels
    แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งไว้ใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง
    สถานะการอัปเดต ความพร้อมของ gateway และหนึ่งเทิร์นของ agent ภายในเครื่อง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ระหว่าง
    iterate บน guest เดียว ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุปและสถานะราย lane
  - lane OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐานเทิร์นของ agent แบบ live
    ตามค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบโมเดล OpenAI อื่น
  - ห่อการรันภายในเครื่องที่ยาวด้วย timeout ของโฮสต์ เพื่อให้ transport stall ของ
    Parallels ไม่กินช่วงเวลาทดสอบที่เหลือ:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียน log ของ lane แบบซ้อนใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลังอัปเดตและงาน
    อัปเดตแพ็กเกจบน guest ที่ยังเย็นอยู่; ถือว่ายังปกติเมื่อ log debug ของ npm
    ที่ซ้อนอยู่ยังเดินหน้า
  - อย่ารัน wrapper แบบ aggregate นี้พร้อมกับ lane smoke ของ Parallels สำหรับ
    macOS, Windows หรือ Linux แบบรายตัว ทั้งหมดใช้สถานะ VM ร่วมกันและอาจชนกัน
    ในการ restore snapshot, การเสิร์ฟแพ็กเกจ หรือสถานะ gateway ของ guest
  - หลักฐานหลังอัปเดตรันพื้นผิว bundled plugin ปกติ เพราะ facade ความสามารถ เช่น
    speech, image generation และ media understanding ถูกโหลดผ่าน API runtime
    ที่ bundled แม้ว่าเทิร์นของ agent เองจะตรวจเฉพาะการตอบกลับข้อความธรรมดาก็ตาม

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการทดสอบ smoke
    โปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน QA แบบ live ของ Matrix กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่มี Docker รองรับ ใช้ได้เฉพาะ source checkout - การติดตั้งแบบแพ็กเกจไม่ได้ส่งมอบ `qa-lab`
  - CLI แบบเต็ม, แค็ตตาล็อกโปรไฟล์/สถานการณ์, env vars และรูปแบบ artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รันเลน QA แบบ live ของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้โทเคนบอต driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รหัสกลุ่มต้องเป็นรหัสแชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบพูลที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease จากพูล
  - ค่าเริ่มต้นครอบคลุม canary, การ gate การ mention, การระบุคำสั่ง, `/status`, การตอบกลับที่มีการ mention ระหว่างบอตกับบอต และการตอบกลับคำสั่ง native หลัก ค่าเริ่มต้นของ `mock-openai` ยังครอบคลุม regression ของ reply-chain แบบกำหนดผลได้แน่นอนและการสตรีมข้อความสุดท้ายของ Telegram ใช้ `--list-scenarios` สำหรับ probe เสริม เช่น `session_status`
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องมีบอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อการสังเกตบอตต่อบอตที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับบอตทั้งสองตัว และตรวจสอบให้แน่ใจว่าบอต driver สังเกตทราฟฟิกบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และ `qa-evidence.json` ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับของ SUT ที่สังเกตเห็น

`Mantis Telegram Live` คือ wrapper หลักฐาน PR รอบเลนนี้ โดยจะรัน ref ผู้สมัครด้วยข้อมูลรับรอง Telegram ที่ lease ผ่าน Convex, render ชุดรายงาน/หลักฐาน QA ที่ redact แล้วในเบราว์เซอร์เดสก์ท็อป Crabbox, บันทึกหลักฐาน MP4, สร้าง GIF ที่ตัดแต่งตาม motion, อัปโหลดชุด artifact และโพสต์หลักฐาน PR แบบ inline ผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number` Maintainer สามารถเริ่มจาก Actions UI ผ่าน `Mantis Scenario` (`scenario_id:
telegram-live`) หรือจากคอมเมนต์ pull request โดยตรง:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` คือ wrapper แบบ agentic สำหรับ Telegram Desktop แบบ native ก่อน/หลัง สำหรับหลักฐานภาพของ PR เริ่มจาก Actions UI ด้วย `instructions` แบบ freeform, ผ่าน `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) หรือจากคอมเมนต์ PR:

```text
@openclaw-mantis telegram desktop proof
```

เอเจนต์ Mantis อ่าน PR, ตัดสินใจว่าพฤติกรรมที่มองเห็นได้ใน Telegram ใดพิสูจน์การเปลี่ยนแปลง, รันเลน proof ของ Telegram Desktop ผ่านผู้ใช้จริงบน Crabbox บน baseline และ ref ผู้สมัคร, วนซ้ำจนกว่า GIF แบบ native จะใช้งานได้ดี, เขียน manifest `motionPreview` แบบจับคู่ และโพสต์ตาราง GIF แบบ 2 คอลัมน์เดียวกันผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number`

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - lease หรือใช้เดสก์ท็อป Linux ของ Crabbox ซ้ำ, ติดตั้ง Telegram Desktop แบบ native, กำหนดค่า OpenClaw ด้วยโทเคนบอต SUT ของ Telegram ที่ lease มา, เริ่ม Gateway และบันทึกหลักฐาน screenshot/MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้
  - ค่าเริ่มต้นเป็น `--credential-source convex` เพื่อให้ workflow ต้องใช้เพียง secret ของ broker Convex ใช้ `--credential-source env` กับตัวแปร `OPENCLAW_QA_TELEGRAM_*` ชุดเดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังต้องมีการเข้าสู่ระบบ/โปรไฟล์ผู้ใช้ โทเคนบอตกำหนดค่าเฉพาะ OpenClaw เท่านั้น ใช้ `--telegram-profile-archive-env <name>` สำหรับ archive โปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` แล้วเข้าสู่ระบบด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` และ `telegram-desktop-builder.mp4` ไว้ใต้ไดเรกทอรีผลลัพธ์

เลน transport แบบ live ใช้สัญญามาตรฐานเดียวกันเพื่อให้ transport ใหม่ไม่เบี่ยงเบน เมทริกซ์ coverage รายเลนอยู่ใน [ภาพรวม QA → coverage ของ transport แบบ live](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุด synthetic แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
QA transport แบบ live, QA lab จะขอ lease แบบเอกสิทธิ์จากพูลที่มี Convex รองรับ, ส่ง Heartbeat ให้
lease นั้นระหว่างที่เลนกำลังรัน และปล่อย lease เมื่อปิดตัวลง ชื่อส่วนนี้มีมาก่อน
การรองรับ Discord, Slack และ WhatsApp สัญญา lease ใช้ร่วมกันข้าม kind

โครง scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env vars ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นของ Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

env vars เสริม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id เสริม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin สำหรับ Maintainer (เพิ่ม/ลบ/แสดงพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรัน live เพื่อตรวจสอบ URL site ของ Convex, secret ของ broker,
endpoint prefix, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

สัญญา endpoint เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - หมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - สำเร็จ: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /admin/add` (เฉพาะ secret ของ Maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของ Maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ยัง active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของ Maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปทรง payload สำหรับ kind ของ Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปทรงนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

รูปทรง payload สำหรับ kind ผู้ใช้จริงของ Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริง hex แบบ SHA-256
- `kind: "telegram-user"` ถูกสงวนไว้สำหรับ workflow proof ของ Mantis Telegram Desktop เลน QA Lab ทั่วไปต้องไม่ acquire kind นี้

payload หลายช่องทางที่ broker ตรวจสอบ:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถ lease จากพูลได้เช่นกัน แต่การตรวจสอบ payload ของ Slack ปัจจุบัน
อยู่ในตัวรัน QA ของ Slack แทนที่จะอยู่ใน broker ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางเข้า QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>` และเขียนสถานการณ์ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

คิดถึงชุดทดสอบเป็น "ความสมจริงที่เพิ่มขึ้น" (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- คอนฟิก: การรันที่ไม่ได้เจาะจงเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard หลายโปรเจกต์เป็นคอนฟิกต่อโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard เฉพาะ `unit-ui`
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ใน process (Gateway auth, routing, tooling, parsing, config)
  - regression แบบกำหนดผลได้แน่นอนสำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้ key จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และตัวโหลด public-surface ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่ bundled จริง การโหลด API ของ Plugin จริงอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

นโยบาย dependency แบบ native:

- การติดตั้งทดสอบค่าเริ่มต้นข้าม optional native Discord opus builds เสียงของ Discord ใช้ `libopus-wasm` ที่ bundled และ `@discordjs/opus` ยังคงถูกปิดใน `allowBuilds` เพื่อให้การทดสอบในเครื่องและเลน Testbox ไม่ compile native addon
- เปรียบเทียบประสิทธิภาพ native opus ใน repo benchmark ของ `libopus-wasm` ไม่ใช่ในลูป install/test ค่าเริ่มต้นของ OpenClaw อย่าตั้ง `@discordjs/opus` เป็น `true` ใน `allowBuilds` ค่าเริ่มต้น เพราะจะทำให้ลูป install/test ที่ไม่เกี่ยวข้อง compile native code

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิกชาร์ดย่อยสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project แบบเนทีฟขนาดใหญ่เพียงตัวเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลดสูง และป้องกันไม่ให้งาน auto-reply/extension แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ root แบบเนทีฟ `vitest.config.ts` เพราะลูป watch แบบหลายชาร์ดใช้งานจริงได้ไม่สะดวก
    - `pnpm test`, `pnpm test:watch`, และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลนตามขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงหลีกเลี่ยงต้นทุนการเริ่มต้นโปรเจกต์ root ทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็นเลนตามขอบเขตที่ประหยัดโดยค่าเริ่มต้น: การแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน, และ dependent ในกราฟ import แบบโลคัล การแก้ไข config/setup/package จะไม่รันทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือเกตตรวจสอบโลคัลแบบฉลาดตามปกติสำหรับงานขอบเขตแคบ คำสั่งนี้จัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, และ tooling จากนั้นรันคำสั่ง typecheck, lint, และ guard ที่ตรงกัน คำสั่งนี้ไม่รันการทดสอบ Vitest ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนสำหรับหลักฐานการทดสอบ การปรับเวอร์ชันที่มีเฉพาะ release metadata จะรันการตรวจ version/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกฟิลด์ version ระดับบนสุด
    - การแก้ไข live Docker ACP harness จะรันการตรวจแบบโฟกัส: ไวยากรณ์ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler live Docker การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version, และพื้นผิว package อื่น ๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบ unit แบบ import-light จาก agents, commands, plugins, auto-reply helpers, `plugin-sdk`, และพื้นที่ utility บริสุทธิ์ที่คล้ายกันจะส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime-heavy จะยังอยู่บนเลนเดิม
    - ไฟล์ซอร์ส helper บางไฟล์ใน `plugin-sdk` และ `commands` ยังแมปการรัน changed-mode ไปยังการทดสอบพี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จะหลีกเลี่ยงการรันชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด, การทดสอบ integration `reply.*` ระดับบนสุด, และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply ออกเป็นชาร์ด agent-runner, dispatch, และ commands/state-routing เพิ่มเติม เพื่อไม่ให้ bucket ที่ import หนักเพียงชุดเดียวครอบครอง tail ของ Node ทั้งหมด
    - CI ของ PR/main ตามปกติตั้งใจข้าม extension batch sweep และชาร์ด `agentic-plugins` ที่ใช้เฉพาะ release Full Release Validation จะ dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบ plugin/extension-heavy เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยนอินพุตการค้นพบ message-tool หรือบริบท runtime ของ compaction
      ให้คง coverage ทั้งสองระดับไว้
    - เพิ่ม regression helper แบบโฟกัสสำหรับขอบเขต routing และ normalization
      ที่เป็น pure
    - รักษาชุด integration ของ embedded runner ให้ทำงานได้ดี:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, และ
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม compaction ยังคงไหลผ่าน
      พาธจริง `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานมีค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้ runner
      แบบ non-isolated ในโปรเจกต์ root, e2e, และคอนฟิก live
    - เลน UI ของ root ยังคงใช้ setup และ optimizer ของ `jsdom` แต่ก็รันบน
      runner แบบ non-isolated ที่ใช้ร่วมกันด้วย
    - แต่ละชาร์ด `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กับกระบวนการ Node ลูกของ Vitest
      โดยค่าเริ่มต้น เพื่อลด churn ของการ compile V8 ระหว่างการรันโลคัลขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน
    - `scripts/run-vitest.mjs` จะยุติการรัน Vitest แบบ non-watch ที่ระบุชัดเจนหลังจาก
      5 นาทีโดยไม่มี stdout หรือ stderr output ตั้งค่า
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` เพื่อปิด watchdog สำหรับการสืบสวน
      ที่ตั้งใจให้เงียบ

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff จะทริกเกอร์เลนสถาปัตยกรรมใด
    - hook pre-commit ทำเฉพาะการจัดรูปแบบ โดยจะ stage ไฟล์ที่จัดรูปแบบแล้วใหม่ และ
      ไม่รัน lint, typecheck, หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการเกตตรวจสอบโลคัลแบบฉลาด
    - `pnpm test:changed` จะ route ผ่านเลนตามขอบเขตที่ประหยัดโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินใจว่าการแก้ไข harness, config, package, หรือ contract จำเป็นต้องมี
      coverage ของ Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing เดิม
      เพียงแต่มี worker cap ที่สูงกว่า
    - การปรับจำนวน worker โลคัลอัตโนมัติตั้งใจให้อนุรักษ์นิยม และจะลดลง
      เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุด
      จึงสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมาย projects/config files เป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำใน changed-mode ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกคง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดใช้งานบนโฮสต์ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนเพียงตำแหน่งเดียวสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดใช้รายงาน import-duration ของ Vitest พร้อม
      output import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลา shard จะถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็น key; ชาร์ด CI แบบ include-pattern
      จะต่อท้ายชื่อชาร์ด เพื่อให้ติดตามชาร์ดที่ถูกกรองแยกกันได้
    - เมื่อการทดสอบที่ร้อนเพียงชุดเดียวยังคงใช้เวลาส่วนใหญ่กับ startup imports
      ให้ซ่อน dependency หนักไว้หลัง seam โลคัล `*.runtime.ts` ที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import helper runtime เพียงเพื่อส่งผ่าน
      `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก route กับพาธ root-project แบบเนทีฟสำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่มีการแก้ไข โดย route รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ของ root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead การเริ่มต้นและ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profile ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### ความเสถียร (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, memory, และ large-payload จำลองผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper การคงอยู่ของ diagnostic stability bundle
  - assert ว่า recorder ยังคงมีขอบเขต, ตัวอย่าง RSS จำลองอยู่ต่ำกว่า pressure budget, และความลึกของ queue ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เป็นเลนแคบสำหรับการติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุด Gateway ทั้งหมด

### E2E (repo aggregate)

- คำสั่ง: `pnpm test:e2e`
- ขอบเขต:
  - รันเลน E2E gateway smoke
  - รันเลน E2E เบราว์เซอร์ Control UI แบบ mocked
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - ต้องติดตั้ง Playwright Chromium

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e:gateway`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, และการทดสอบ E2E ของ bundled-plugin ใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, โลคัล: ค่าเริ่มต้น 1)
  - รันใน silent mode โดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด output console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ node, และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนที่เคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E (เบราว์เซอร์ Control UI แบบ mocked)

- คำสั่ง: `pnpm test:ui:e2e`
- คอนฟิก: `test/vitest/vitest.ui-e2e.config.ts`
- ไฟล์: `ui/src/**/*.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Vite Control UI
  - ขับหน้า Chromium จริงผ่าน Playwright
  - แทนที่ Gateway WebSocket ด้วย mock ในเบราว์เซอร์ที่ deterministic
- ความคาดหวัง:
  - รันใน CI เป็นส่วนหนึ่งของ `pnpm test:e2e`
  - ไม่ต้องใช้ Gateway, agents, หรือ key ของ provider จริง
  - ต้องมี browser dependency (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - ใช้ gateway OpenShell โลคัลที่ active อยู่ซ้ำ
  - สร้าง sandbox จาก Dockerfile โลคัลชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - เปิดใช้แบบ opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` โลคัลและ Docker daemon ที่ทำงานได้
  - ต้องมี gateway OpenShell โลคัลที่ active และ config source ของมัน
  - ใช้ `HOME` / `XDG_CONFIG_HOME` ที่แยกไว้ จากนั้นทำลาย sandbox ทดสอบ
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` เพื่อเปิดเผย config ของ gateway ที่ลงทะเบียนไว้ให้กับการทดสอบที่แยกไว้
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` เพื่อ override IP ของ Docker gateway ที่ใช้โดย host policy fixture

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบแบบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?"
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของ provider, ความเฉพาะตัวของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่ได้ออกแบบให้เสถียรสำหรับ CI (เครือข่ายจริง, นโยบาย provider จริง, โควตา, เหตุขัดข้อง)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันเฉพาะชุดย่อยที่แคบลงแทนที่จะรัน "ทุกอย่าง"
- การรัน live ใช้ API key ที่ export ไว้แล้วและโปรไฟล์ auth ที่จัดเตรียมไว้
- โดยค่าเริ่มต้น การรัน live ยังแยก `HOME` และคัดลอก material ของ config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ unit fixture เปลี่ยนแปลง `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ไดเรกทอรี home จริงของคุณ
- `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: จะคง output ความคืบหน้า `[live] ...` ไว้ และปิดเสียง log การ bootstrap ของ gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการให้ log การเริ่มต้นแบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ราย live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อเจอการตอบกลับ rate limit
- Output ความคืบหน้า/Heartbeat:
  - ขณะนี้ชุดทดสอบ live ส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้การเรียก provider ที่ใช้เวลานานเห็นว่ายังทำงานอยู่ แม้การ capture console ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงมาก)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- Debug "บอทของฉันล่ม" / ความล้มเหลวเฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบ live (แตะเครือข่าย)

สำหรับ live model matrix, CLI backend smoke, ACP smoke, harness ของ Codex app-server
และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) รวมถึงการจัดการ credential สำหรับการรัน live โปรดดู
[การทดสอบชุด live](/th/help/testing-live) สำหรับ checklist เฉพาะของการอัปเดตและ
การตรวจสอบ Plugin โปรดดู
[การทดสอบการอัปเดตและ plugins](/th/help/testing-updates-plugins)

## Docker runners (การตรวจสอบ "ทำงานใน Linux" ที่ไม่บังคับ)

Docker runners เหล่านี้แบ่งเป็นสองกลุ่ม:

- Live-model runners: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายใน image Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount ไดเรกทอรี config ภายในเครื่อง, workspace และไฟล์ env ของ profile ที่เป็นตัวเลือก entrypoint ภายในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners มีขีดจำกัดเชิงปฏิบัติของตัวเองเมื่อจำเป็น:
  `test:docker:live-models` มีค่าเริ่มต้นเป็นชุดที่ curated และรองรับแล้วซึ่งมีสัญญาณสูง และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS`
  หรือ env vars ของ gateway เมื่อคุณต้องการขีดจำกัดที่เล็กลงหรือการสแกนที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` build image Docker live หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้น build/reuse image `scripts/e2e/Dockerfile` สองชุด image เปล่าเป็นเพียง runner ของ Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้า image แบบ functional จะติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันของ built-app คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตาม plan ที่เลือก aggregate ใช้ scheduler ภายในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slots ในขณะที่ resource caps ป้องกันไม่ให้ lane หนักแบบ live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า active caps scheduler ยังสามารถเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วปล่อยให้รันลำพังจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ host Docker มี headroom มากกว่า runner ทำ Docker preflight เป็นค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้างเก่า, พิมพ์สถานะทุก 30 วินาที, เก็บเวลาของ lane ที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่ม lane ที่นานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane แบบถ่วงน้ำหนักโดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ plan ของ CI สำหรับ lane ที่เลือก, ความต้องการ package/image และ credentials
- `Package Acceptance` คือ gate ของ package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็น product ได้หรือไม่?" โดย resolve package candidate หนึ่งจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` จากนั้นรัน Docker E2E lane ที่ reuse ได้กับ tarball นั้นโดยตรงแทนที่จะ repack ref ที่เลือก โปรไฟล์เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ plugins](/th/help/testing-updates-plugins) สำหรับ package/update/plugin contract, survivor matrix ของ published-upgrade, ค่าเริ่มต้นของ release และการ triage ความล้มเหลว
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะไล่ static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหากการ import ตอน startup ก่อน dispatch ดึง package dependencies เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; และยังคง chunk การรัน gateway ที่ bundled ให้อยู่ใต้ budget และ reject static imports ของ cold gateway paths ที่รู้จัก Packaged CLI smoke ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance ถูกจำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) ถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่าง metadata ของ shipped-package: รายการ private QA inventory ที่ละไว้, ไม่มี `gateway install --wrapper`, ไม่มี patch files ใน git fixture ที่ได้จาก tarball, ไม่มี persisted `update.channel`, ตำแหน่ง legacy ของ plugin install-record, ไม่มี persistence ของ marketplace install-record และ config metadata migration ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นเป็นความล้มเหลวแบบ strict
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` boot container จริงหนึ่งตัวหรือมากกว่าและตรวจสอบ integration paths ระดับสูง
- Docker/Bash E2E lanes ที่ติดตั้ง OpenClaw tarball ที่ pack แล้วผ่าน `scripts/lib/openclaw-e2e-instance.sh` จำกัด `npm install` ที่ `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (ค่าเริ่มต้น `600s`; ตั้งค่า `0` เพื่อปิด wrapper สำหรับ debugging)

Live-model Docker runners ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้จำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน container home ก่อนรัน เพื่อให้ OAuth ของ external-CLI refresh token ได้โดยไม่เปลี่ยนแปลง auth store ของ host:

- Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini เป็นค่าเริ่มต้น พร้อม coverage แบบ strict สำหรับ Droid/OpenCode ผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` และ `pnpm qa:observability:smoke` เป็น private QA source-checkout lanes โดยตั้งใจไม่ให้เป็นส่วนหนึ่งของ package Docker release lanes เพราะ npm tarball ละ QA Lab ออก
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker, config OpenAI ผ่าน env-ref onboarding พร้อม Telegram เป็นค่าเริ่มต้น, รัน doctor และรันหนึ่ง mocked OpenAI agent turn ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บน host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยน channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`

- การทดสอบเบื้องต้นเส้นทางผู้ใช้ของรีลีส: `pnpm test:docker:release-user-journey` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วระบบในโฮม Docker ที่สะอาด รันการเริ่มใช้งาน กำหนดค่าผู้ให้บริการ OpenAI แบบจำลอง รันหนึ่งรอบของ agent ติดตั้ง/ถอนการติดตั้ง Plugin ภายนอก กำหนดค่า ClickClack กับ fixture ภายในเครื่อง ตรวจสอบการส่งข้อความขาออก/ขาเข้า รีสตาร์ท Gateway และรัน doctor
- การทดสอบเบื้องต้นการเริ่มใช้งานแบบ typed ของรีลีส: `pnpm test:docker:release-typed-onboarding` ติดตั้ง tarball ที่แพ็กแล้ว ขับ `openclaw onboard` ผ่าน TTY จริง กำหนดค่า OpenAI เป็นผู้ให้บริการแบบอ้างอิง env ตรวจสอบว่าไม่มีการคงอยู่ของคีย์ดิบ และรันหนึ่งรอบของ agent แบบจำลอง
- การทดสอบเบื้องต้นสื่อ/หน่วยความจำของรีลีส: `pnpm test:docker:release-media-memory` ติดตั้ง tarball ที่แพ็กแล้ว ตรวจสอบการเข้าใจรูปภาพจากไฟล์แนบ PNG เอาต์พุตการสร้างรูปภาพที่เข้ากันได้กับ OpenAI การเรียกคืนจากการค้นหาหน่วยความจำ และการเรียกคืนที่ยังคงอยู่หลังรีสตาร์ท Gateway
- การทดสอบเบื้องต้นเส้นทางผู้ใช้อัปเกรดของรีลีส: `pnpm test:docker:release-upgrade-user-journey` โดยค่าเริ่มต้นจะติดตั้ง baseline ที่เผยแพร่ล่าสุดซึ่งเก่ากว่า tarball ของ candidate กำหนดค่าสถานะผู้ให้บริการ/Plugin/ClickClack บนแพ็กเกจที่เผยแพร่ อัปเกรดเป็น tarball ของ candidate แล้วรันเส้นทางหลักของ agent/Plugin/ช่องทางอีกครั้ง หากไม่มี baseline ที่เผยแพร่เก่ากว่า จะใช้เวอร์ชัน candidate ซ้ำ แทนที่ baseline ด้วย `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`
- การทดสอบเบื้องต้นตลาด Plugin ของรีลีส: `pnpm test:docker:release-plugin-marketplace` ติดตั้งจากตลาด fixture ภายในเครื่อง อัปเดต Plugin ที่ติดตั้ง ถอนการติดตั้ง และตรวจสอบว่า CLI ของ Plugin หายไปพร้อมกับตัด metadata การติดตั้งออก
- การทดสอบเบื้องต้นการติดตั้ง Skill: `pnpm test:docker:skill-install` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วระบบใน Docker ปิดใช้การติดตั้ง archive ที่อัปโหลดในการกำหนดค่า resolve slug ของ skill ClawHub สดปัจจุบันจากการค้นหา ติดตั้งด้วย `openclaw skills install` และตรวจสอบ skill ที่ติดตั้งพร้อม metadata ต้นทาง/lock ของ `.clawhub`
- การทดสอบเบื้องต้นการสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วระบบใน Docker สลับจากแพ็กเกจ `stable` ไปเป็น git `dev` ตรวจสอบช่องทางที่คงอยู่และการทำงานหลังอัปเดตของ Plugin จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- การทดสอบเบื้องต้นการอยู่รอดหลังอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าที่มีสถานะสกปรก ซึ่งมี agents, การกำหนดค่าช่องทาง, allowlist ของ Plugin, สถานะ dependency ของ Plugin ที่ค้างอยู่ และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการสดหรือช่องทาง จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงอยู่ของ config/state พร้อมงบประมาณ startup/status
- การทดสอบเบื้องต้นการอยู่รอดหลังอัปเกรดจากแพ็กเกจที่เผยแพร่: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น ใส่ไฟล์ผู้ใช้เดิมที่สมจริง กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้ ตรวจสอบ config ที่ได้ อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ของ candidate รัน doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intents ที่กำหนดค่าไว้ การคงอยู่ของสถานะ การเริ่มต้น `/healthz`, `/readyz` และงบประมาณสถานะ RPC แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขอให้ scheduler รวมขยาย baseline ภายในเครื่องแบบระบุแน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยาย fixture รูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin OpenClaw ภายนอกโดยอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` resolve token baseline แบบ meta เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยาย gate แพ็กเกจ release-soak เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- การทดสอบเบื้องต้น context รันไทม์ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript context รันไทม์ที่ซ่อนอยู่ พร้อมการซ่อมแซมโดย doctor สำหรับสาขา prompt-rewrite ที่ซ้ำกันซึ่งได้รับผลกระทบ
- การทดสอบเบื้องต้นการติดตั้ง Bun แบบทั่วระบบ: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน ติดตั้งด้วย `bun install -g` ในโฮมที่แยกโดดเดี่ยว และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืนผู้ให้บริการรูปภาพที่ bundling มาแทนที่จะค้าง ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ข้ามการ build บน host ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบเบื้องต้น Docker ของตัวติดตั้ง: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache หนึ่งชุดระหว่างคอนเทนเนอร์ root, update และ direct-npm ของมัน การทดสอบเบื้องต้น update ใช้ค่าเริ่มต้นเป็น npm `latest` เป็น baseline stable ก่อนอัปเกรดเป็น tarball ของ candidate แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ภายในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบตัวติดตั้งแบบไม่ใช่ root เก็บ npm cache ที่แยกโดดเดี่ยวเพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำในการรันซ้ำภายในเครื่อง
- Install Smoke CI ข้ามการอัปเดตแบบ direct-npm global ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ภายในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุมการทดสอบ `npm install -g` โดยตรง
- การทดสอบเบื้องต้น CLI การลบ shared workspace ของ agents: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build อิมเมจ Dockerfile ที่ root โดยค่าเริ่มต้น ใส่ agents สองตัวพร้อม workspace หนึ่งชุดในโฮมคอนเทนเนอร์ที่แยกโดดเดี่ยว รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, การยืนยันตัวตน WS + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- การทดสอบเบื้องต้น snapshot ของ Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build อิมเมจ E2E จาก source พร้อมเลเยอร์ Chromium เริ่ม Chromium ด้วย CDP ดิบ รัน `browser doctor --deep` และตรวจสอบว่า snapshot บทบาท CDP ครอบคลุม URL ของลิงก์ clickable ที่เลื่อนระดับจาก cursor, refs ของ iframe และ metadata ของ frame
- regression การใช้ reasoning ขั้นต่ำของ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบจำลองผ่าน Gateway ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ของผู้ให้บริการ reject และตรวจสอบว่ารายละเอียดดิบปรากฏใน log ของ Gateway
- bridge ช่องทาง MCP (Gateway ที่ seed แล้ว + stdio bridge + การทดสอบเบื้องต้น raw notification-frame ของ Claude): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ใน bundle ของ OpenClaw (เซิร์ฟเวอร์ stdio MCP จริง + การทดสอบเบื้องต้น allow/deny ของโปรไฟล์ OpenClaw แบบฝัง): `pnpm test:docker:agent-bundle-mcp-tools` (สคริปต์: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- การล้างข้อมูล Cron/subagent MCP (Gateway จริง + การ teardown child ของ stdio MCP หลังรัน cron แบบแยกโดดเดี่ยวและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (การทดสอบเบื้องต้น install/update สำหรับ path ภายในเครื่อง, `file:`, npm registry พร้อม dependency ที่ hoist แล้ว, metadata แพ็กเกจ npm ที่ผิดรูปแบบ, refs ของ git ที่เคลื่อนที่, ClawHub kitchen-sink, การอัปเดต marketplace และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่แพ็กเกจ/รันไทม์ kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในเครื่องแบบ hermetic
- การทดสอบเบื้องต้นการอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบเบื้องต้นเมทริกซ์ lifecycle ของ Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วในคอนเทนเนอร์เปล่า ติดตั้ง Plugin npm สลับ enable/disable อัปเกรดและดาวน์เกรดผ่าน npm registry ภายในเครื่อง ลบโค้ดที่ติดตั้ง จากนั้นตรวจสอบว่า uninstall ยังคงลบสถานะค้างได้ พร้อมบันทึก metrics RSS/CPU สำหรับแต่ละระยะของ lifecycle
- การทดสอบเบื้องต้น metadata การ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุมการทดสอบเบื้องต้น install/update สำหรับ path ภายในเครื่อง, `file:`, npm registry พร้อม dependency ที่ hoist แล้ว, refs ของ git ที่เคลื่อนที่, fixture ของ ClawHub, การอัปเดต marketplace และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้ง `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง Plugin npm ที่ติดตามทรัพยากร enable, disable, upgrade, downgrade และ uninstall เมื่อโค้ดหายไป

หากต้องการ prebuild และใช้ shared functional image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การแทนที่อิมเมจเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจ shared ระยะไกล สคริปต์จะ pull หากยังไม่มีอยู่ในเครื่อง การทดสอบ QR และ Docker ของตัวติดตั้งยังคงใช้ Dockerfile ของตัวเอง เพราะตรวจสอบพฤติกรรม package/install แทนรันไทม์ built-app ที่แชร์

Docker runners สำหรับโมเดล live ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวและ
stage เข้าไปใน workdir ชั่วคราวภายใน container วิธีนี้ช่วยให้ runtime
image มีขนาดเล็ก ขณะยังรัน Vitest กับซอร์ส/คอนฟิกในเครื่องของคุณอย่างตรงตัว
ขั้นตอน staging จะข้าม cache ขนาดใหญ่ที่มีเฉพาะในเครื่องและเอาต์พุต build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` เฉพาะแอปหรือ
Gradle เพื่อให้การรัน Docker live ไม่เสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
นอกจากนี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ gateway live probes เริ่ม
channel workers จริงของ Telegram/Discord/อื่น ๆ ภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น gateway
live coverage จาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
OpenClaw gateway container พร้อมเปิดใช้งาน HTTP endpoints ที่เข้ากันได้กับ OpenAI,
เริ่ม Open WebUI container เวอร์ชันที่ pin ไว้ให้เชื่อมกับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` แสดง `openclaw/default`, แล้วส่ง
คำขอแชตจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
ตั้งค่า `OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจ CI บนเส้นทาง release ที่ควรหยุด
หลังจากลงชื่อเข้าใช้ Open WebUI และค้นพบโมเดล โดยไม่ต้องรอการตอบกลับจากโมเดล live
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
Open WebUI image และ Open WebUI อาจต้องทำขั้นตอน cold-start setup ของตัวเองให้เสร็จ
lane นี้คาดหวัง key ของโมเดล live ที่ใช้งานได้ ให้ส่งผ่าน process
environment, auth profiles ที่ stage ไว้, หรือ `OPENCLAW_PROFILE_FILE` ที่ระบุอย่างชัดเจน
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มัน boot Gateway
container ที่ seed ไว้, เริ่ม container ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้น
ตรวจสอบการค้นหาบทสนทนาที่ routed แล้ว, การอ่าน transcript, metadata ของ attachment,
พฤติกรรม live event queue, routing การส่งออก, และการแจ้งเตือนแบบ channel +
permission สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจการแจ้งเตือนจะ
ตรวจเฟรม stdio MCP ดิบโดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่แค่สิ่งที่ client SDK เฉพาะตัวหนึ่งบังเอิญแสดงให้เห็น
`test:docker:agent-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ live
model key มัน build repo Docker image, เริ่ม stdio MCP probe server จริง
ภายใน container, materialize server นั้นผ่าน OpenClaw bundle
MCP runtime ที่ฝังไว้, execute tool, จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคง
มี tools `bundle-mcp` ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ live model
key มันเริ่ม Gateway ที่ seed ไว้พร้อม stdio MCP probe server จริง, รัน
cron turn แบบ isolated และ child turn แบบ one-shot ของ `sessions_spawn`, จากนั้นตรวจสอบว่า
MCP child process ออกจากระบบหลังการรันแต่ละครั้ง

Manual ACP plain-language thread smoke (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow regression/debug อาจต้องใช้อีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบ

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` mount และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มีการ mount auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่ cache ไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวใต้ `/host-auth...` จากนั้นคัดลอกเข้า `/home/node/...` ก่อนเริ่ม tests
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตัวเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง providers ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันใหม่ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อ override tag ของ Open WebUI image ที่ pin ไว้

## การตรวจสุขภาพเอกสาร

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ในหน้าด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็น regression ของ "pipeline จริง" โดยไม่มี providers จริง:

- Gateway tool calling (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

เรามี tests ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำงานเหมือน "agent reliability evals":

- Mock tool-calling ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบ session wiring และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ skills ใน prompt agent เลือก skill ที่ถูกต้อง (หรือหลีกเลี่ยงสิ่งที่ไม่เกี่ยวข้อง) หรือไม่
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่
- **สัญญา workflow:** สถานการณ์หลาย turn ที่ assert ลำดับ tool, การส่งต่อ session history และขอบเขต sandbox

evals ในอนาคตควรคง deterministic เป็นอันดับแรก:

- scenario runner ที่ใช้ mock providers เพื่อ assert tool calls + order, การอ่านไฟล์ skill และ session wiring
- ชุดสถานการณ์ขนาดเล็กที่เน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- live evals แบบ optional (opt-in, gate ด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## Contract tests (รูปแบบ Plugin และ channel)

Contract tests ตรวจสอบว่า Plugin และ channel ทุกตัวที่ลงทะเบียนไว้สอดคล้องกับ
interface contract ของตัวเอง มันจะ iterate ผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertions ด้าน shape และ behavior lane unit ของ `pnpm test` ค่าเริ่มต้นตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้ ให้รันคำสั่ง contract อย่างชัดเจน
เมื่อคุณแตะพื้นผิว shared channel หรือ provider

### คำสั่ง

- contracts ทั้งหมด: `pnpm test:contracts`
- Channel contracts เท่านั้น: `pnpm test:contracts:channels`
- Provider contracts เท่านั้น: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปแบบ Plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญา setup wizard
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - channel action handlers
- **threading** - การจัดการ thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - Channel status probes
- **registry** - รูปแบบ Plugin registry

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญา auth flow
- **auth-choice** - auth choice/selection
- **catalog** - Model catalog API
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - Provider runtime
- **shape** - รูปแบบ/interface ของ Plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน plugin-sdk exports หรือ subpaths
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (คำแนะนำ)

เมื่อคุณแก้ปัญหา provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (mock/stub provider หรือ capture การแปลง request-shape ที่แน่นอน)
- หากเป็น live-only โดยเนื้อแท้ (rate limits, auth policies) ให้คง live test ให้แคบและ opt-in ผ่าน env vars
- ควรเล็ง layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug ในการแปลง/replay คำขอของ provider → direct models test
  - bug ใน gateway session/history/tool pipeline → gateway live smoke หรือ CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก registry metadata (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า exec ids แบบ traversal-segment ถูกปฏิเสธ
  - หากคุณเพิ่ม target family ของ SecretRef `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts`, ให้อัปเดต `classifyTargetClass` ใน test นั้น test ตั้งใจ fail กับ target ids ที่ไม่ได้จัดคลาส เพื่อไม่ให้คลาสใหม่ถูกข้ามไปเงียบ ๆ

## ที่เกี่ยวข้อง

- [Testing live](/th/help/testing-live)
- [Testing updates and plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
