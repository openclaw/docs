---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - เพิ่มการทดสอบถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, Docker runners และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-06-27T17:42:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไร (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งใดที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, debugging)
- การทดสอบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**QA stack (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) - อ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [การ์ดคะแนนวุฒิภาวะ](/th/maturity/scorecard) - หลักฐาน QA สำหรับ release สนับสนุนการตัดสินใจด้านเสถียรภาพและ LTS อย่างไร
- [ช่อง QA](/th/channels/qa-channel) - transport plugin สังเคราะห์ที่ใช้โดย scenario ที่อิงกับ repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runners เฉพาะ QA ด้านล่าง ([runners เฉพาะ QA](#qa-specific-runners)) แสดงการเรียกใช้ `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไป:

- gate เต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite ในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรเหลือเฟือ: `pnpm test:max`
- loop เฝ้าดู Vitest โดยตรง: `pnpm test:watch`
- การกำหนดเป้าหมายไฟล์โดยตรงตอนนี้ route path ของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ failure เดียว
- ไซต์ QA ที่อิงกับ Docker: `pnpm qa:lab:up`
- lane QA ที่อิงกับ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- gate coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

## ไดเรกทอรีชั่วคราวสำหรับการทดสอบ

ควรใช้ helper ที่ใช้ร่วมกันใน `test/helpers/temp-dir.ts` สำหรับไดเรกทอรีชั่วคราวที่การทดสอบเป็นเจ้าของ helper เหล่านี้ทำให้ ownership ชัดเจนและเก็บ cleanup ไว้ใน lifecycle เดียวกับการทดสอบ:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

ใช้ `makeTempDir(tempDirs, prefix)` และ `cleanupTempDirs(tempDirs)` เมื่อการทดสอบเป็นเจ้าของ array หรือ set ของ path อยู่แล้ว หลีกเลี่ยงการเรียก `fs.mkdtemp*` แบบเปล่าใหม่ใน test เว้นแต่กรณีนั้นกำลังตรวจสอบพฤติกรรม temp-dir ดิบโดยชัดเจน เพิ่มคอมเมนต์ allow ที่ตรวจสอบย้อนหลังได้พร้อมเหตุผลที่เป็นรูปธรรมเมื่อการทดสอบตั้งใจต้องใช้ไดเรกทอรีชั่วคราวแบบเปล่า:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

เพื่อการมองเห็น migration, `node scripts/report-test-temp-creations.mjs` จะรายงานการสร้าง temp-dir แบบเปล่าใหม่ในบรรทัด diff ที่เพิ่มเข้ามาโดยไม่บล็อกรูปแบบ cleanup เดิม ขอบเขตไฟล์ของมันตั้งใจใช้การจัดประเภท test-path เดียวกับที่ `scripts/changed-lanes.mjs` ใช้ แทนที่จะดูแล heuristic ชื่อไฟล์ test-helper แยกต่างหาก ขณะเดียวกันก็ข้าม implementation ของ helper ที่ใช้ร่วมกันเอง `check:changed` รันรายงานนี้สำหรับ path ทดสอบที่เปลี่ยนเป็นสัญญาณ CI แบบเตือนเท่านั้น; finding เป็น annotation คำเตือนของ GitHub ไม่ใช่ failure

เมื่อ debugging ผู้ให้บริการ/โมเดลจริง (ต้องใช้ creds จริง):

- ชุด live (โมเดล + probe เครื่องมือ/image ของ Gateway): `pnpm test:live`
- กำหนดเป้าหมายไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพ runtime: dispatch `OpenClaw Performance` พร้อม
  `live_openai_candidate=true` สำหรับ agent turn จริงของ `openai/gpt-5.5` หรือ
  `deep_profile=true` สำหรับ artifact CPU/heap/trace ของ Kova การรันตามกำหนดการรายวันจะเผยแพร่ artifact ของ lane mock-provider, deep-profile และ GPT 5.5 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` รายงาน
  mock-provider ยังรวมตัวเลขการบูต Gateway ระดับ source, หน่วยความจำ,
  plugin-pressure, fake-model hello-loop ซ้ำ และการเริ่มต้น CLI ด้วย
- sweep โมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกตอนนี้รัน text turn พร้อม probe ขนาดเล็กแบบ file-read โมเดลที่ metadata ประกาศ input แบบ `image` จะรัน image turn ขนาดเล็กด้วย ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยก failure ของผู้ให้บริการ
  - coverage ใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก workflow live/E2E ที่ใช้ซ้ำได้พร้อม
    `include_live_suites: true` ซึ่งรวม job matrix โมเดล live บน Docker แยกต่างหากที่ shard ตามผู้ให้บริการ
  - สำหรับการ rerun CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ของผู้ให้บริการที่มีสัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller แบบ scheduled/release ของมัน
- smoke bound-chat ของ Codex native: `pnpm test:docker:live-codex-bind`
  - รัน lane live ของ Docker กับ path app-server ของ Codex, bind Slack DM สังเคราะห์ด้วย `/codex bind`, exercise `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบ reply ธรรมดาและ route ของ image attachment ผ่าน binding plugin native แทน ACP
- smoke harness app-server ของ Codex: `pnpm test:docker:live-codex-harness`
  - รัน agent turn ของ Gateway ผ่าน harness app-server Codex ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้น exercise probe image,
    cron MCP, sub-agent และ Guardian ปิด probe sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยก failure อื่นของ app-server Codex สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    สิ่งนี้จะออกหลังจาก probe sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke การติดตั้ง Codex on-demand: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง tarball OpenClaw ที่แพ็กแล้วใน Docker, รัน onboarding ด้วย OpenAI API-key
    และตรวจสอบว่า Codex plugin พร้อม dependency `@openai/codex`
    ถูกดาวน์โหลดเข้าไปใน root ของโปรเจกต์ npm ที่จัดการไว้ตามต้องการ
- smoke dependency ของเครื่องมือ Plugin แบบ live: `pnpm test:docker:live-plugin-tool`
  - แพ็ก fixture plugin พร้อม dependency `slugify` จริง, ติดตั้งผ่าน
    `npm-pack:`, ตรวจสอบ dependency ใต้ root ของโปรเจกต์ npm ที่จัดการไว้,
    จากนั้นขอให้โมเดล OpenAI live เรียกเครื่องมือ plugin และส่งคืน slug ที่ซ่อนไว้
- smoke คำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in ที่รัดกุมซ้ำชั้นสำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    มัน exercise `/crestodian status`, เข้าคิวการเปลี่ยนโมเดลแบบ persistent,
    ตอบ `/crestodian yes` และตรวจสอบ path การเขียน audit/config
- smoke planner ของ Crestodian บน Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config โดยมี Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit
- smoke first-run ของ Crestodian บน Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรี state ของ OpenClaw ที่ว่าง, ตรวจสอบ entrypoint Crestodian onboard สมัยใหม่, ใช้การเขียน setup/model/agent/Discord plugin + SecretRef,
    validate config และตรวจสอบรายการ audit path การตั้งค่า Ring 0 เดียวกันนี้ครอบคลุมใน QA Lab ด้วยโดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรันแบบ isolated
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียงกรณีที่ fail หนึ่งกรณี ควรจำกัดขอบเขตการทดสอบ live ผ่าน env vars allowlist ที่อธิบายไว้ด้านล่าง
</Tip>

## runners เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงของ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ workflow PR แบบ standalone
การ validate แบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release
stable/default จะเก็บ soak live/Docker แบบ exhaustive ไว้หลัง `run_release_soak=true`; profile
`full` บังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อม lane mock parity, lane live
Matrix, lane Telegram live ที่จัดการโดย Convex และ lane Discord live ที่จัดการโดย Convex
เป็น job แบบขนาน Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ input ของ manual workflow
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็น job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อม Matrix แบบ fast และ lane Telegram ก่อนอนุมัติ release,
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ transport ของ release เพื่อให้คง determinism
และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway transport live เหล่านี้
ปิดการค้นหา memory; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

shard live media ของ full release ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shard โมเดล/backend live ของ Docker ใช้ image ที่ใช้ร่วมกัน
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build หนึ่งครั้งต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงจาก repo โดยตรงบน host
  - เขียน artifact ระดับบนสุด `qa-evidence.json`, `qa-suite-summary.json` และ
    `qa-suite-report.md` สำหรับชุดสถานการณ์ที่เลือก รวมถึงการเลือกสถานการณ์แบบ
    mixed flow, Vitest และ Playwright
  - เมื่อถูก dispatch โดย `pnpm openclaw qa run --qa-profile <profile>` จะฝัง
    scorecard ของ taxonomy profile ที่เลือกไว้ใน `qa-evidence.json` เดียวกัน
    `smoke-ci` เขียนหลักฐานแบบย่อ ซึ่งตั้งค่า `evidenceMode: "slim"` และละเว้น
    `execution` ราย entry ส่วน `release` ครอบคลุมส่วนที่คัดสรรสำหรับความพร้อมของ release;
    `all` เลือกทุกหมวด maturity ที่ active และมีไว้สำหรับการ dispatch workflow
    QA Profile Evidence อย่างชัดเจนเมื่อจำเป็นต้องใช้ artifact scorecard แบบเต็ม
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการพร้อมกันโดยค่าเริ่มต้นด้วย
    gateway worker ที่แยกออกจากกัน `qa-channel` มีค่าเริ่มต้น concurrency เป็น 4
    (จำกัดโดยจำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน
    worker หรือ `--concurrency 1` สำหรับเลน serial แบบเก่า
  - ออกด้วยสถานะ non-zero เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่ม server ผู้ให้บริการภายในเครื่องที่อิง AIMock สำหรับ coverage
    fixture และ protocol-mock เชิงทดลอง โดยไม่แทนที่เลน `mock-openai` ที่รู้จักสถานการณ์
- `pnpm openclaw qa coverage --match <query>`
  - ค้นหา scenario ID, ชื่อเรื่อง, surface, coverage ID, docs ref, code ref,
    Plugin และข้อกำหนดของผู้ให้บริการ จากนั้นพิมพ์ suite target ที่ตรงกัน
  - ใช้สิ่งนี้ก่อนการรัน QA Lab เมื่อคุณรู้พฤติกรรมหรือ file path ที่ถูกแตะ
    แต่ไม่รู้สถานการณ์ที่เล็กที่สุด สิ่งนี้เป็นเพียงคำแนะนำเท่านั้น; ยังต้องเลือก
    mock, live, Multipass, Matrix หรือหลักฐาน transport จากพฤติกรรมที่กำลังเปลี่ยน
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้การทดสอบ live OpenAI Kitchen Sink plugin gauntlet ผ่าน QA Lab โดยจะ
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory ของ surface Plugin SDK
    probe `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ Gateway
    เรียกใช้ turn ของ OpenAI แบบ live และตรวจสอบ diagnostics เชิง adversarial
    ต้องมี auth ของ OpenAI แบบ live เช่น `OPENAI_API_KEY` ใน session Testbox
    ที่ hydrate แล้ว จะ source โปรไฟล์ live-auth ของ Testbox โดยอัตโนมัติเมื่อมี
    helper `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ bench การเริ่มต้น Gateway พร้อมกับ pack สถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียน summary การสังเกต CPU แบบรวมไว้ใต้
    `.artifacts/gateway-cpu-scenarios/`
  - flag เฉพาะการสังเกต CPU ร้อนต่อเนื่องโดยค่าเริ่มต้น (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น burst ช่วงเริ่มต้นสั้น ๆ จะถูกบันทึกเป็น metric
    โดยไม่ดูเหมือน regression ที่ทำให้ Gateway ใช้ CPU เต็มนานหลายนาที
  - ใช้ artifact `dist` ที่ build แล้ว; ให้รัน build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ QA suite เดียวกันภายใน VM Linux แบบ disposable ของ Multipass
  - คงพฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บน host
  - ใช้ flag การเลือกผู้ให้บริการ/โมเดลเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่อ input auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    key ผู้ให้บริการแบบ env, path config ผู้ให้บริการ QA live และ `CODEX_HOME`
    เมื่อมีอยู่
  - output dir ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน workspace ที่ mount ได้
  - เขียนรายงาน QA + summary ตามปกติพร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิง Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - build tarball npm จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน Docker
    รัน onboarding แบบ non-interactive ด้วย API key ของ OpenAI ตั้งค่า Telegram
    โดยค่าเริ่มต้น ตรวจสอบว่า runtime ของ Plugin ที่แพ็กเกจไว้โหลดได้โดยไม่ต้องซ่อม
    dependency ตอนเริ่มต้น รัน doctor และรัน local agent turn หนึ่งครั้งกับ endpoint
    OpenAI แบบ mocked
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลน packaged-install เดียวกัน
    กับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน smoke ของ built-app ใน Docker แบบ deterministic สำหรับ transcript ของ
    embedded runtime context โดยตรวจสอบว่า runtime context ที่ซ่อนของ OpenClaw
    ถูก persist เป็น custom message แบบไม่แสดงผล แทนที่จะรั่วเข้าไปใน user turn
    ที่มองเห็นได้ จากนั้น seed session JSONL ที่เสียหายและได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง branch ที่ active พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker รัน onboarding ของแพ็กเกจที่ติดตั้ง
    ตั้งค่า Telegram ผ่าน CLI ที่ติดตั้ง จากนั้นนำเลน QA ของ Telegram แบบ live
    มาใช้ซ้ำ โดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - wrapper mount เฉพาะ source ของ harness `qa-lab` จาก checkout; แพ็กเกจที่ติดตั้ง
    เป็นเจ้าของ `dist`, `openclaw/plugin-sdk` และ runtime ของ Plugin ที่ bundled
    ดังนั้นเลนจะไม่ผสม Plugin จาก checkout ปัจจุบันเข้าไปในแพ็กเกจที่กำลังทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในเครื่องที่ resolve แล้ว
    แทนการติดตั้งจาก registry
  - emit การจับเวลา RTT ซ้ำใน `qa-evidence.json` โดยค่าเริ่มต้นด้วย
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` override
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับการรัน RTT
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` รับรายการ ID การตรวจสอบ QA ของ Telegram
    ที่คั่นด้วยจุลภาคเพื่อ sample; เมื่อไม่ได้ตั้งค่า การตรวจสอบเริ่มต้นที่รองรับ RTT
    คือ `telegram-mentioned-message-reply`
  - ใช้ credential env ของ Telegram หรือ source credential ของ Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret ใน CI
    Docker wrapper จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ credential env ของ Telegram หรือ Convex บน host ก่อนงาน
    build/install ของ Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อจงใจ debug การตั้งค่าก่อน credential
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น เมื่อเลือก
    credential ของ Convex และไม่ได้ตั้ง role ไว้ wrapper จะใช้ `ci` ใน CI และ
    `maintainer` นอก CI
  - GitHub Actions เปิดเผยเลนนี้เป็น workflow แบบ manual สำหรับ maintainer ชื่อ
    `NPM Telegram Beta E2E` โดยจะไม่รันเมื่อ merge workflow ใช้ environment
    `qa-live-shared` และ lease credential ของ Convex CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับ package candidate หนึ่งรายการ โดยรับ trusted ref, spec npm ที่ publish แล้ว,
  URL tarball HTTPS พร้อม SHA-256 หรือ artifact tarball จาก run อื่น อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  scheduler Docker E2E ที่มีอยู่ด้วยโปรไฟล์เลน smoke, package, product, full หรือ custom
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

- หลักฐาน URL tarball ที่แน่นอนต้องใช้ digest และใช้นโยบายความปลอดภัยของ URL สาธารณะ:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- mirror tarball สำหรับ enterprise/private ใช้นโยบาย trusted-source ที่ระบุชัดเจน:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` อ่าน `.github/package-trusted-sources.json` จาก trusted workflow ref และไม่รับ credential ของ URL หรือ bypass private-network ผ่าน workflow input หากนโยบายที่ระบุประกาศ bearer auth ให้ตั้งค่า secret แบบ fixed ชื่อ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`

- หลักฐาน artifact ดาวน์โหลด artifact tarball จาก Actions run อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - pack และติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    โดยตั้งค่า OpenAI แล้วเปิดใช้ channel/Plugin ที่ bundled ผ่านการแก้ไข config
  - ตรวจสอบว่า setup discovery ปล่อยให้ Plugin แบบ downloadable ที่ยังไม่ได้ตั้งค่าไม่อยู่
    การซ่อม doctor ที่ตั้งค่าไว้ครั้งแรกติดตั้ง Plugin แบบ downloadable แต่ละตัวที่หายไป
    อย่างชัดเจน และการ restart ครั้งที่สองไม่รันการซ่อม dependency แบบซ่อน
  - ยังติดตั้ง baseline npm เวอร์ชันเก่าที่รู้จัก เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ล้างเศษ dependency ของ Plugin legacy โดยไม่มี postinstall repair ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดต packaged-install แบบ native ข้าม guest ของ Parallels
    แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งไว้ใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง
    สถานะการอัปเดต ความพร้อมของ Gateway และ local agent turn หนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะ iterate
    กับ guest หนึ่งตัว ใช้ `--json` สำหรับ path ของ summary artifact และสถานะรายเลน
  - เลน OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน agent-turn แบบ live โดยค่าเริ่มต้น
    ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจ validate โมเดล OpenAI อื่น
  - ครอบการรันภายในเครื่องที่ยาวด้วย timeout ของ host เพื่อไม่ให้ transport stall
    ของ Parallels ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script เขียน log ของเลนแบบ nested ไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า outer wrapper ค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีใน doctor หลังอัปเดตและงานอัปเดตแพ็กเกจ
    บน guest ที่ cold; ยังถือว่าปกติเมื่อ log debug npm แบบ nested ยังมีความคืบหน้า
  - อย่ารัน aggregate wrapper นี้พร้อมกันกับเลน smoke ของ Parallels รายตัวสำหรับ
    macOS, Windows หรือ Linux เพราะใช้สถานะ VM ร่วมกันและอาจชนกันในการ restore snapshot,
    การ serve แพ็กเกจ หรือสถานะ Gateway ของ guest
  - หลักฐานหลังอัปเดตรัน surface ของ Plugin ที่ bundled ตามปกติ เพราะ capability facade
    เช่น speech, image generation และ media understanding ถูกโหลดผ่าน API runtime
    ที่ bundled แม้ว่า agent turn เองจะตรวจสอบเฉพาะคำตอบข้อความอย่างง่าย

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการทดสอบ smoke
    โปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน QA แบบสดของ Matrix กับ homeserver Tuwunel แบบใช้ครั้งเดียวที่มี Docker หนุนอยู่ สำหรับ source-checkout เท่านั้น - การติดตั้งแบบแพ็กเกจไม่มี `qa-lab` มาด้วย
  - CLI แบบเต็ม, แค็ตตาล็อกโปรไฟล์/สถานการณ์, env vars และโครงร่างอาร์ติแฟกต์: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รันเลน QA แบบสดของ Telegram กับกลุ่มส่วนตัวจริง โดยใช้โทเค็นบอต driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รหัสกลุ่มต้องเป็นรหัสแชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบรวมศูนย์ที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease จากพูล
  - ค่าเริ่มต้นครอบคลุม canary, mention gating, command addressing, `/status`, การตอบกลับที่กล่าวถึงแบบบอตต่อบอต และการตอบกลับคำสั่ง native หลัก ค่าเริ่มต้นของ `mock-openai` ยังครอบคลุมการถดถอยของ reply-chain แบบกำหนดได้แน่นอนและการสตรีมข้อความสุดท้ายของ Telegram ใช้ `--list-scenarios` สำหรับ probe เสริม เช่น `session_status`
  - ออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - ต้องมีบอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อให้การสังเกตแบบบอตต่อบอตเสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับบอตทั้งสอง และตรวจสอบให้แน่ใจว่าบอต driver สังเกตทราฟฟิกบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และ `qa-evidence.json` ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับ SUT ที่สังเกตได้

`Mantis Telegram Live` คือ wrapper สำหรับหลักฐาน PR รอบเลนนี้ โดยรัน ref ผู้สมัครด้วยข้อมูลรับรอง Telegram ที่ lease จาก Convex, แสดงผลชุดรายงาน/หลักฐาน QA ที่ redact แล้วในเบราว์เซอร์เดสก์ท็อป Crabbox, บันทึกหลักฐาน MP4, สร้าง GIF ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว, อัปโหลดชุดอาร์ติแฟกต์ และโพสต์หลักฐานแบบ inline ใน PR ผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number` ผู้ดูแลสามารถเริ่มจาก Actions UI ผ่าน `Mantis Scenario` (`scenario_id:
telegram-live`) หรือโดยตรงจากคอมเมนต์ใน pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` คือ wrapper แบบ agentic สำหรับ Telegram Desktop native ก่อน/หลัง เพื่อหลักฐานภาพของ PR เริ่มจาก Actions UI ด้วย `instructions` แบบ freeform, ผ่าน `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) หรือจากคอมเมนต์ PR:

```text
@openclaw-mantis telegram desktop proof
```

เอเจนต์ Mantis อ่าน PR, ตัดสินว่าพฤติกรรมที่มองเห็นได้ใน Telegram ใดพิสูจน์การเปลี่ยนแปลง, รันเลน proof ของ Crabbox Telegram Desktop ด้วยผู้ใช้จริงบน ref baseline และ candidate, ทำซ้ำจนกว่า GIF native จะมีประโยชน์, เขียน manifest `motionPreview` แบบคู่ และโพสต์ตาราง GIF 2 คอลัมน์เดียวกันผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number`

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - lease หรือใช้เดสก์ท็อป Linux ของ Crabbox ซ้ำ, ติดตั้ง Telegram Desktop native, กำหนดค่า OpenClaw ด้วยโทเค็นบอต SUT ของ Telegram ที่ lease มา, เริ่ม Gateway และบันทึกหลักฐาน screenshot/MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้
  - ค่าเริ่มต้นเป็น `--credential-source convex` เพื่อให้ workflow ต้องใช้เพียง secret broker ของ Convex ใช้ `--credential-source env` กับตัวแปร `OPENCLAW_QA_TELEGRAM_*` เดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังต้องมีการเข้าสู่ระบบ/โปรไฟล์ผู้ใช้ โทเค็นบอตกำหนดค่าเฉพาะ OpenClaw เท่านั้น ใช้ `--telegram-profile-archive-env <name>` สำหรับ archive โปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` แล้วเข้าสู่ระบบด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` และ `telegram-desktop-builder.mp4` ใต้ไดเรกทอรีเอาต์พุต

เลน transport แบบสดใช้สัญญามาตรฐานเดียวกันเพื่อไม่ให้ transport ใหม่เบี่ยงเบน; เมทริกซ์ความครอบคลุมรายเลนอยู่ใน [ภาพรวม QA → ความครอบคลุม transport แบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุดสังเคราะห์แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
QA transport แบบสด QA lab จะได้ lease แบบ exclusive จากพูลที่มี Convex หนุนอยู่, ส่ง Heartbeat ให้
lease นั้นระหว่างที่เลนกำลังรัน และปล่อย lease เมื่อปิดระบบ ชื่อส่วนนี้มีมาก่อน
การรองรับ Discord, Slack และ WhatsApp; สัญญา lease ใช้ร่วมกันระหว่างชนิดต่าง ๆ

โครง scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env vars ที่ต้องมี:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

env vars เสริม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id เสริม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ `http://` สำหรับ local loopback เพื่อการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแล maintainer (เพิ่ม/ลบ/แสดงรายการพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบสดเพื่อตรวจสอบ URL ไซต์ Convex, secret ของ broker,
endpoint prefix, HTTP timeout และความสามารถในการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

สัญญา endpoint เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - หมด/ลองซ้ำได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - สำเร็จ: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /admin/add` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

รูปร่าง payload สำหรับชนิดผู้ใช้จริงของ Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริง hex SHA-256
- `kind: "telegram-user"` ถูกสงวนไว้สำหรับ workflow proof ของ Mantis Telegram Desktop เลน QA Lab ทั่วไปต้องไม่ acquire ชนิดนี้

payload หลายช่องทางที่ broker ตรวจสอบ:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถ lease จากพูลได้เช่นกัน แต่การตรวจสอบ payload ของ Slack ปัจจุบัน
อยู่ใน runner QA ของ Slack แทนที่จะอยู่ใน broker ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางใน QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement runner ของ transport บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>` และเขียนสถานการณ์ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดว่าชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และ flakiness/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่ได้เจาะจงใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard หลายโปรเจกต์เป็น config รายโปรเจกต์เพื่อการจัดตารางแบบขนาน
- ไฟล์: inventory core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ในโปรเซส (Gateway auth, routing, tooling, parsing, config)
  - การถดถอยแบบกำหนดได้แน่นอนสำหรับบั๊กที่รู้แล้ว
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่ bundled จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

นโยบาย dependency native:

- การติดตั้งทดสอบค่าเริ่มต้นข้าม build opus native ของ Discord ที่เป็น optional เสียงของ Discord ใช้ `libopus-wasm` ที่ bundled และ `@discordjs/opus` ยังคงถูกปิดใน `allowBuilds` เพื่อให้การทดสอบภายในเครื่องและเลน Testbox ไม่คอมไพล์ addon native
- เปรียบเทียบประสิทธิภาพ opus native ใน repo benchmark ของ `libopus-wasm` ไม่ใช่ใน loop ติดตั้ง/ทดสอบค่าเริ่มต้นของ OpenClaw อย่าตั้ง `@discordjs/opus` เป็น `true` ใน `allowBuilds` ค่าเริ่มต้น เพราะจะทำให้ loop ติดตั้ง/ทดสอบที่ไม่เกี่ยวข้องคอมไพล์โค้ด native

<AccordionGroup>
  <Accordion title="โปรเจกต์, shard และเลนแบบ scoped">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิกชาร์ดย่อยสิบสองรายการ (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการโปรเจกต์รากแบบเนทีฟขนาดใหญ่เพียงรายการเดียว วิธีนี้ลดค่า RSS สูงสุดบนเครื่องที่มีโหลดมาก และป้องกันไม่ให้งานตอบกลับอัตโนมัติ/ส่วนขยายแย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์รากแบบเนทีฟ `vitest.config.ts` เพราะลูป watch แบบหลายชาร์ดไม่เหมาะกับการใช้งานจริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจนผ่านเลนแบบมีขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องเสียต้นทุนการเริ่มต้นโปรเจกต์รากทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็นเลนแบบมีขอบเขตราคาถูกโดยค่าเริ่มต้น ได้แก่ การแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน และ dependent ในกราฟ import เฉพาะที่ การแก้ไขคอนฟิก/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือเกตตรวจสอบโลคัลอัจฉริยะตามปกติสำหรับงานขอบเขตแคบ คำสั่งนี้จัดประเภท diff เป็น core, การทดสอบ core, ส่วนขยาย, การทดสอบส่วนขยาย, แอป, เอกสาร, เมตาดาทารีลีส, เครื่องมือ Docker แบบ live และเครื่องมือทั่วไป จากนั้นรัน typecheck, lint และคำสั่ง guard ที่ตรงกัน คำสั่งนี้ไม่รันการทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนสำหรับหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็นเมตาดาทารีลีสเท่านั้นจะรันการตรวจสอบเวอร์ชัน/คอนฟิก/dependency ระดับรากแบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยน package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไขฮาร์เนส Docker ACP แบบ live จะรันการตรวจสอบแบบเจาะจง: ไวยากรณ์ shell สำหรับสคริปต์ auth ของ Docker แบบ live และ dry-run ของ scheduler Docker แบบ live การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่น ๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบหน่วยที่ import เบาจาก agents, commands, plugins, helper การตอบกลับอัตโนมัติ, `plugin-sdk` และพื้นที่ utility บริสุทธิ์ที่คล้ายกัน จะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime หนักจะยังอยู่บนเลนเดิม
    - ไฟล์ซอร์ส helper บางรายการของ `plugin-sdk` และ `commands` ยังแมปรันในโหมด changed ไปยังการทดสอบพี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จึงหลีกเลี่ยงการรันชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด, การทดสอบ integration ระดับบนสุด `reply.*` และ subtree `src/auto-reply/reply/**` CI ยังแบ่ง subtree ของ reply เพิ่มเป็นชาร์ด agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักเพียงตัวเดียวครอบครอง tail ของ Node ทั้งหมด
    - CI ของ PR/main ปกติจงใจข้ามการ sweep ชุดส่วนขยายและชาร์ด `agentic-plugins` ที่ใช้เฉพาะรีลีส Full Release Validation จะ dispatch เวิร์กโฟลว์ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน Plugin/ส่วนขยายเหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="ความครอบคลุมของ runner แบบฝัง">

    - เมื่อคุณเปลี่ยนอินพุตการค้นหา message-tool หรือคอนเท็กซ์ runtime ของ compaction
      ให้รักษาความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบเจาะจงสำหรับขอบเขตการ routing และการ normalize
      แบบบริสุทธิ์
    - รักษาชุด integration ของ runner แบบฝังให้สมบูรณ์:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` และ
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านั้นยืนยันว่า scoped ids และพฤติกรรม compaction ยังคงไหลผ่าน
      พาธจริง `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ pool และ isolation ของ Vitest">

    - คอนฟิก Vitest พื้นฐานตั้งค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้
      runner แบบไม่แยก isolation ทั่วทั้งโปรเจกต์ราก, e2e และคอนฟิก live
    - เลน UI รากยังคงเก็บ setup และ optimizer ของ `jsdom` ไว้ แต่ก็รันบน
      runner แบบไม่แยก isolation ที่ใช้ร่วมกันด้วย
    - แต่ละชาร์ด `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` สำหรับกระบวนการ Node ลูกของ Vitest
      โดยค่าเริ่มต้นเพื่อลด churn การ compile ของ V8 ระหว่างการรันโลคัลขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเทียบกับพฤติกรรม V8
      มาตรฐาน
    - `scripts/run-vitest.mjs` จะยุติการรัน Vitest แบบไม่ใช่ watch ที่ระบุชัดเจนหลังจาก
      5 นาทีโดยไม่มีเอาต์พุต stdout หรือ stderr ตั้งค่า
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` เพื่อปิด watchdog สำหรับการสืบสวน
      ที่ตั้งใจให้เงียบ

  </Accordion>

  <Accordion title="การวนซ้ำแบบโลคัลอย่างรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใดบ้าง
    - hook pre-commit ทำเฉพาะการจัดรูปแบบเท่านั้น โดยจะ stage ไฟล์ที่จัดรูปแบบใหม่อีกครั้งและ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งมอบหรือ push เมื่อคุณ
      ต้องใช้เกตตรวจสอบโลคัลอัจฉริยะ
    - `pnpm test:changed` ส่งผ่านเลนแบบมีขอบเขตราคาถูกโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไขฮาร์เนส, คอนฟิก, package หรือ contract ต้องการ
      ความครอบคลุมของ Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการ routing
      แบบเดิม เพียงแต่เพิ่มเพดาน worker ให้สูงขึ้น
    - การปรับขนาด worker โลคัลอัตโนมัติจงใจตั้งไว้อย่างอนุรักษนิยม และจะลดระดับลง
      เมื่อค่า load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายรายการพร้อมกัน
      จึงสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำในโหมด changed ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกคง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดใช้งานบนโฮสต์ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนเพียงแห่งเดียวสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดใช้การรายงานระยะเวลา import ของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลา shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็น key; ชาร์ด CI แบบ include-pattern
      จะต่อท้ายชื่อชาร์ดเพื่อให้ติดตามชาร์ดที่ถูกกรองแยกกันได้
    - เมื่อการทดสอบที่ร้อนเพียงรายการเดียวยังใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam เฉพาะที่แบบแคบ `*.runtime.ts` และ
      mock seam นั้นโดยตรง แทนการ deep-import helper ของ runtime เพียงเพื่อ
      ส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก routing กับพาธโปรเจกต์รากแบบเนทีฟสำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อมค่า RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ dirty โดย routing รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ราก
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ
      overhead การ startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway local loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, memory และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper persistence ของ bundle เสถียรภาพ diagnostic
  - assert ว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS สังเคราะห์อยู่ใต้ budget แรงกดดัน และความลึกของคิวต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เลนแคบสำหรับการติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (ภาพรวม repo)

- คำสั่ง: `pnpm test:e2e`
- ขอบเขต:
  - รันเลน E2E smoke ของ gateway
  - รันเลน E2E เบราว์เซอร์ Control UI แบบ mock
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - ต้องติดตั้ง Playwright Chromium

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e:gateway`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้ worker แบบปรับตัวได้ (CI: สูงสุด 2, โลคัล: ค่าเริ่มต้น 1)
  - รันในโหมด silent โดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ node และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้งานใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนเคลื่อนไหวมากกว่าการทดสอบหน่วย (อาจช้ากว่า)

### E2E (เบราว์เซอร์ Control UI แบบ mock)

- คำสั่ง: `pnpm test:ui:e2e`
- คอนฟิก: `test/vitest/vitest.ui-e2e.config.ts`
- ไฟล์: `ui/src/**/*.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Vite Control UI
  - ขับหน้า Chromium จริงผ่าน Playwright
  - แทนที่ Gateway WebSocket ด้วย mock ในเบราว์เซอร์ที่กำหนดผลลัพธ์ได้แน่นอน
- ความคาดหวัง:
  - รันใน CI เป็นส่วนหนึ่งของ `pnpm test:e2e`
  - ไม่ต้องใช้ Gateway จริง, agents หรือ key ของ provider
  - ต้องมี dependency ของเบราว์เซอร์ (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - ใช้ gateway OpenShell โลคัลที่ active อยู่ซ้ำ
  - สร้าง sandbox จาก Dockerfile โลคัลชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้องเลือกเปิดใช้เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` โลคัลพร้อม Docker daemon ที่ใช้งานได้
  - ต้องมี gateway OpenShell โลคัลที่ active อยู่และแหล่งคอนฟิกของมัน
  - ใช้ `HOME` / `XDG_CONFIG_HOME` ที่แยก isolation แล้วทำลาย sandbox ทดสอบ
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` เพื่อเปิดเผยคอนฟิก gateway ที่ลงทะเบียนไว้ให้การทดสอบที่แยก isolation
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` เพื่อ override IP ของ Docker gateway ที่ fixture นโยบายโฮสต์ใช้

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- การกำหนดค่า: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, และการทดสอบสดของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?"
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของ provider, ความเฉพาะทางของการเรียกใช้เครื่องมือ, ปัญหา auth, และพฤติกรรม rate limit
- ความคาดหวัง:
  - โดยการออกแบบ ไม่ได้เสถียรสำหรับ CI (เครือข่ายจริง, นโยบาย provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันเฉพาะชุดย่อยที่จำกัดขอบเขต แทนที่จะรัน "ทุกอย่าง"
- การรันสดใช้ API key ที่ export ไว้แล้วและโปรไฟล์ auth ที่ staged ไว้
- โดยค่าเริ่มต้น การรันสดยังคงแยก `HOME` และคัดลอกข้อมูล config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ unit fixture แก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบสดใช้ไดเรกทอรี home จริงของคุณ
- `pnpm test:live` มีค่าเริ่มต้นเป็นโหมดที่เงียบกว่า: จะคง output ความคืบหน้า `[live] ...` ไว้ และปิดเสียง log การ bootstrap ของ gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการให้ log การเริ่มต้นแบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override เฉพาะ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ response rate limit
- Output ความคืบหน้า/Heartbeat:
  - ตอนนี้ชุดทดสอบสดจะ emit บรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียก provider ที่ใช้เวลานานยังทำงานอยู่ แม้เมื่อการจับ console ของ Vitest เงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรันสด
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงมาก)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก "bot ของฉันล่ม" / failure เฉพาะ provider / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบสด (แตะเครือข่าย)

สำหรับ live model matrix, CLI backend smoke, ACP smoke, harness ของ Codex app-server
และการทดสอบสดของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - รวมถึงการจัดการ credential สำหรับการรันสด - ดู
[การทดสอบชุดสด](/th/help/testing-live) สำหรับ checklist เฉพาะด้านการอัปเดตและ
การตรวจสอบ Plugin ดู
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## Docker runner (การตรวจสอบ "ใช้งานได้ใน Linux" แบบไม่บังคับ)

Docker runner เหล่านี้แบ่งเป็นสองกลุ่ม:

- Live-model runner: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายใน image Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount ไดเรกทอรี config ในเครื่อง, workspace, และไฟล์ env ของ profile แบบไม่บังคับ entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runner มี cap เชิงปฏิบัติของตัวเองในจุดที่จำเป็น:
  `test:docker:live-models` มีค่าเริ่มต้นเป็นชุด curated ที่รองรับและให้สัญญาณสูง และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS`
  หรือ env vars ของ gateway เมื่อคุณต้องการ cap ที่เล็กลงหรือการสแกนที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` build image Docker สดหนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs`, จากนั้น build/reuse image `scripts/e2e/Dockerfile` สองชุด image เปล่าเป็นเพียง runner Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้า image functional ติดตั้ง tarball เดียวกันเข้า `/app` สำหรับ lane ฟังก์ชันของแอปที่ build แล้ว นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการ plan ที่เลือก aggregate ใช้ scheduler ภายในแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slot ขณะที่ resource cap ป้องกันไม่ให้ lane หนักอย่าง live, npm-install, และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่ใช้งานอยู่ scheduler ยังเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วปล่อยให้รันเดี่ยวจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ host Docker มี headroom มากขึ้น runner ทำ Docker preflight โดยค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้าง, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json`, และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่ยาวกว่าก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ plan ของ CI สำหรับ lane ที่เลือก, ความต้องการ package/image, และ credential
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ใช้งานเป็นผลิตภัณฑ์ได้หรือไม่?" โดย resolve candidate package หนึ่งตัวจาก `source=npm`, `source=ref`, `source=url`, หรือ `source=artifact`, upload เป็น `package-under-test`, จากนั้นรัน lane Docker E2E ที่ใช้ซ้ำได้กับ tarball นั้นโดยตรง แทนที่จะ repack ref ที่เลือก โปรไฟล์เรียงตามความครอบคลุม: `smoke`, `package`, `product`, และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับสัญญา package/update/plugin, matrix ผู้รอดจาก published-upgrade, ค่าเริ่มต้นของ release, และการ triage failure
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และ fail หาก startup ก่อน dispatch import dependency ของ package เช่น Commander, prompt UI, undici, หรือ logging ก่อน command dispatch; นอกจากนี้ยังคุม chunk การรัน bundled gateway ให้อยู่ใน budget และปฏิเสธ static import ของ path gateway เย็นที่รู้จัก smoke ของ CLI ที่ package แล้วครอบคลุม root help, onboard help, doctor help, status, config schema, และคำสั่ง model-list ด้วย
- ความเข้ากันได้แบบ legacy ของ Package Acceptance ถูก cap ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะ tolerate เฉพาะ gap ของ metadata จาก package ที่ shipped แล้ว: รายการ private QA inventory ที่ละไว้, `gateway install --wrapper` ที่หายไป, patch file ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่ persist หายไป, ตำแหน่ง legacy plugin install-record, persistence ของ marketplace install-record ที่หายไป, และ migration metadata config ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นเป็น failure แบบ strict
- Container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, และ `test:docker:config-reload` boot container จริงหนึ่งตัวขึ้นไป และตรวจสอบ path integration ระดับสูง
- Docker/Bash E2E lane ที่ติดตั้ง tarball OpenClaw ที่ pack แล้วผ่าน `scripts/lib/openclaw-e2e-instance.sh` จะ cap `npm install` ที่ `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (ค่าเริ่มต้น `600s`; ตั้งค่า `0` เพื่อปิด wrapper สำหรับการดีบัก)

Docker runner ของ live-model ยัง bind-mount เฉพาะ CLI auth home ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) แล้วคัดลอกเข้าไปใน container home ก่อนรัน เพื่อให้ external-CLI OAuth refresh token ได้โดยไม่แก้ไข auth store ของ host:

- Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex, และ Gemini โดยค่าเริ่มต้น พร้อม coverage แบบ strict สำหรับ Droid/OpenCode ผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, และ `pnpm qa:observability:smoke` เป็น lane private QA source-checkout โดยตั้งใจไม่รวมอยู่ใน lane package Docker release เพราะ npm tarball ไม่รวม QA Lab
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง tarball OpenClaw ที่ pack แล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram โดยค่าเริ่มต้น, รัน doctor, และรัน mocked OpenAI agent turn หนึ่งครั้ง ใช้ tarball ที่ build ไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บน host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`

- การทดสอบ smoke เส้นทางผู้ใช้ของรีลีส: `pnpm test:docker:release-user-journey` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วระบบใน Docker home ที่สะอาด รันการเริ่มต้นใช้งาน กำหนดค่า provider OpenAI แบบจำลอง รันหนึ่งรอบของ agent ติดตั้ง/ถอนการติดตั้ง Plugin ภายนอก กำหนดค่า ClickClack กับ fixture ในเครื่อง ตรวจสอบการส่งข้อความขาออก/ขาเข้า รีสตาร์ท Gateway และรัน doctor
- การทดสอบ smoke การเริ่มต้นใช้งานแบบ typed ของรีลีส: `pnpm test:docker:release-typed-onboarding` ติดตั้ง tarball ที่แพ็กแล้ว ขับ `openclaw onboard` ผ่าน TTY จริง กำหนดค่า OpenAI เป็น provider แบบ env-ref ตรวจสอบว่าไม่มีการคงอยู่ของคีย์ดิบ และรันหนึ่งรอบของ agent แบบจำลอง
- การทดสอบ smoke สื่อ/หน่วยความจำของรีลีส: `pnpm test:docker:release-media-memory` ติดตั้ง tarball ที่แพ็กแล้ว ตรวจสอบความเข้าใจรูปภาพจากไฟล์แนบ PNG, เอาต์พุตการสร้างรูปภาพที่เข้ากันได้กับ OpenAI, การเรียกคืนจากการค้นหาหน่วยความจำ และการคงอยู่ของการเรียกคืนหลังรีสตาร์ท Gateway
- การทดสอบ smoke เส้นทางผู้ใช้สำหรับการอัปเกรดรีลีส: `pnpm test:docker:release-upgrade-user-journey` โดยค่าเริ่มต้นจะติดตั้ง baseline ที่เผยแพร่ล่าสุดซึ่งเก่ากว่า tarball ของ candidate กำหนดค่าสถานะ provider/Plugin/ClickClack บนแพ็กเกจที่เผยแพร่ อัปเกรดเป็น tarball ของ candidate จากนั้นรันเส้นทางหลักของ agent/Plugin/channel อีกครั้ง หากไม่มี baseline ที่เผยแพร่ซึ่งเก่ากว่า จะใช้เวอร์ชัน candidate ซ้ำ แทนที่ baseline ด้วย `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`
- การทดสอบ smoke marketplace ของ Plugin ในรีลีส: `pnpm test:docker:release-plugin-marketplace` ติดตั้งจาก marketplace fixture ในเครื่อง อัปเดต Plugin ที่ติดตั้ง ถอนการติดตั้ง และตรวจสอบว่า CLI ของ Plugin หายไปพร้อมกับ metadata การติดตั้งที่ถูกตัดออก
- การทดสอบ smoke การติดตั้ง Skill: `pnpm test:docker:skill-install` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วระบบใน Docker ปิดใช้งานการติดตั้ง archive ที่อัปโหลดในการกำหนดค่า resolve slug ของ skill ClawHub จริงปัจจุบันจากการค้นหา ติดตั้งด้วย `openclaw skills install` และตรวจสอบ skill ที่ติดตั้งพร้อม metadata ต้นทาง/lock ของ `.clawhub`
- การทดสอบ smoke การสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วระบบใน Docker สลับจากแพ็กเกจ `stable` ไปเป็น git `dev` ตรวจสอบช่องทางที่คงไว้และการทำงานของ Plugin หลังอัปเดต จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะอัปเดต
- การทดสอบ smoke ผู้รอดจากการอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าที่ไม่สะอาดซึ่งมี agent, การกำหนดค่า channel, allowlist ของ Plugin, สถานะ dependency ของ Plugin ที่ค้าง และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบ non-interactive โดยไม่มี provider จริงหรือคีย์ channel จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงอยู่ของ config/state พร้อมงบประมาณ startup/status
- การทดสอบ smoke ผู้รอดจากการอัปเกรดที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` โดยค่าเริ่มต้นจะติดตั้ง `openclaw@latest` เติมไฟล์ผู้ใช้ที่มีอยู่ให้สมจริง กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้ ตรวจสอบการกำหนดค่าที่ได้ อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ของ candidate รัน doctor แบบ non-interactive เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intent ที่กำหนดค่าไว้ การคงอยู่ของ state, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขอให้ aggregate scheduler ขยาย baseline ในเครื่องแบบเจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยาย fixture ที่มีรูปแบบเหมือน issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin OpenClaw ภายนอกโดยอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` resolve token baseline แบบ meta เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยาย package gate ของ release-soak เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- การทดสอบ smoke บริบท runtime ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ พร้อมการซ่อมแซมโดย doctor สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งได้รับผลกระทบ
- การทดสอบ smoke การติดตั้งแบบทั่วระบบด้วย Bun: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน provider รูปภาพที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ข้ามการ build บน host ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบ smoke Docker ของ installer: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache เดียวกันระหว่างคอนเทนเนอร์ root, update และ direct-npm การทดสอบ smoke การอัปเดตใช้ npm `latest` เป็น baseline stable โดยค่าเริ่มต้นก่อนอัปเกรดเป็น tarball ของ candidate แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วยอินพุต `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบ installer แบบ non-root จะเก็บ npm cache ที่แยกไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของปกปิดพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำระหว่างการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดตแบบ direct-npm global ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม direct `npm install -g`
- การทดสอบ smoke CLI การลบ workspace ที่แชร์ของ agent: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build อิมเมจ Dockerfile รากโดยค่าเริ่มต้น เติม agent สองตัวที่มี workspace เดียวใน home ของคอนเทนเนอร์ที่แยกไว้ รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, การยืนยันตัวตน WS + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- การทดสอบ smoke snapshot ของ Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build อิมเมจ E2E จากซอร์สพร้อมเลเยอร์ Chromium เริ่ม Chromium ด้วย CDP ดิบ รัน `browser doctor --deep` และตรวจสอบว่า snapshot ของ role ใน CDP ครอบคลุม URL ของลิงก์ clickable ที่ถูกยกระดับจาก cursor, iframe ref และ metadata ของ frame
- การถดถอยของ OpenAI Responses web_search สำหรับ reasoning ขั้นต่ำ: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบจำลองผ่าน Gateway ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ของ provider ปฏิเสธและตรวจสอบว่ารายละเอียดดิบปรากฏใน log ของ Gateway
- บริดจ์ channel ของ MCP (Gateway ที่ seed แล้ว + บริดจ์ stdio + การทดสอบ smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP bundle ของ OpenClaw (เซิร์ฟเวอร์ MCP stdio จริง + การทดสอบ smoke allow/deny ของโปรไฟล์ OpenClaw ที่ฝังไว้): `pnpm test:docker:agent-bundle-mcp-tools` (สคริปต์: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- การล้าง Cron/subagent MCP (Gateway จริง + การรื้อถอน child stdio MCP หลังการรัน cron แบบแยกและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (การทดสอบ smoke ติดตั้ง/อัปเดตสำหรับ path ในเครื่อง, `file:`, npm registry พร้อม dependency ที่ hoist แล้ว, metadata แพ็กเกจ npm ที่ผิดรูป, git moving refs, ClawHub kitchen-sink, การอัปเดต marketplace และการเปิดใช้/ตรวจสอบ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่แพ็กเกจ/runtime kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ในเครื่องแบบ hermetic
- การทดสอบ smoke การอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบ smoke matrix lifecycle ของ Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วในคอนเทนเนอร์เปล่า ติดตั้ง Plugin npm สลับ enable/disable อัปเกรดและดาวน์เกรดผ่าน npm registry ในเครื่อง ลบโค้ดที่ติดตั้ง จากนั้นตรวจสอบว่า uninstall ยังคงลบ stale state พร้อมบันทึก metrics RSS/CPU สำหรับแต่ละช่วง lifecycle
- การทดสอบ smoke metadata การ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุมการทดสอบ smoke ติดตั้ง/อัปเดตสำหรับ path ในเครื่อง, `file:`, npm registry พร้อม dependency ที่ hoist แล้ว, git moving refs, fixture ของ ClawHub, การอัปเดต marketplace และการเปิดใช้/ตรวจสอบ Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง เปิดใช้ ปิดใช้ อัปเกรด ดาวน์เกรด และถอนการติดตั้งเมื่อโค้ดหายไปของ Plugin npm พร้อมการติดตามทรัพยากร

หากต้องการ prebuild และใช้ภาพ functional ที่แชร์ด้วยตนเองซ้ำ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

override อิมเมจเฉพาะชุด เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่า เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจแชร์ระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer จะคง Dockerfile ของตนเองไว้ เพราะทดสอบพฤติกรรมแพ็กเกจ/การติดตั้งแทน runtime ของแอปที่ build แล้วและแชร์ร่วมกัน

รันเนอร์ Docker สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวและ
stage เข้าไปยัง workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้ runtime
image มีขนาดเล็ก แต่ยังคงรัน Vitest กับซอร์ส/คอนฟิกในเครื่องของคุณแบบตรงตัว
ขั้นตอน staging จะข้ามแคชขนาดใหญ่ที่มีเฉพาะในเครื่องและเอาต์พุต build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` เฉพาะแอปหรือ
Gradle เพื่อให้การรัน Docker live ไม่ต้องใช้เวลาหลายนาทีในการคัดลอก
อาร์ติแฟกต์เฉพาะเครื่อง
นอกจากนี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ gateway live probes เริ่ม
channel workers จริงของ Telegram/Discord/ฯลฯ ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งต่อ
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น gateway
live coverage จาก Docker lane นั้น
`test:docker:openwebui` เป็น compatibility smoke ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ Gateway ของ OpenClaw โดยเปิดใช้ HTTP endpoints ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ปักเวอร์ชันไว้กับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` แสดง `openclaw/default`, จากนั้นส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
ตั้งค่า `OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจ CI ใน release path ที่ควรหยุด
หลังจากการลงชื่อเข้าใช้ Open WebUI และการค้นพบโมเดล โดยไม่ต้องรอ live model
completion
การรันครั้งแรกอาจช้ากว่าชัดเจน เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
lane นี้คาดหวัง live model key ที่ใช้งานได้ ให้ระบุผ่าน process
environment, auth profiles ที่ stage ไว้ หรือ `OPENCLAW_PROFILE_FILE` ที่ชัดเจน
การรันที่สำเร็จจะพิมพ์ JSON payload ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway ที่ seed ไว้,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบ
การค้นพบบทสนทนาที่ถูก route, การอ่าน transcript, attachment metadata,
พฤติกรรม live event queue, outbound send routing และการแจ้งเตือนแบบ channel +
permission สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจ notification
ตรวจสอบ raw stdio MCP frames โดยตรง เพื่อให้ smoke ตรวจยืนยันสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่เพียงสิ่งที่ client SDK เฉพาะตัวหนึ่งบังเอิญแสดง
`test:docker:agent-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ live
model key มัน build Docker image ของ repo, เริ่ม stdio MCP probe server จริง
ภายในคอนเทนเนอร์, materialize server นั้นผ่าน runtime MCP ของ OpenClaw bundle
ที่ฝังมา, execute tool, จากนั้นตรวจสอบว่า `coding` และ `messaging` เก็บ
tools ของ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ live model
key มันเริ่ม Gateway ที่ seed ไว้พร้อม stdio MCP probe server จริง, รัน
cron turn แบบ isolated และ child turn แบบ one-shot ของ `sessions_spawn`, จากนั้นตรวจสอบว่า
MCP child process ออกหลังการรันแต่ละครั้ง

Manual ACP plain-language thread smoke (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow ด้าน regression/debug อาจต้องใช้ซ้ำสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบ

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` ถูก mount และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับ CLI installs ที่ cache ไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกเข้าไปใน `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง providers ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อนำ image `openclaw:local-live` ที่มีอยู่มาใช้ซ้ำสำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway expose สำหรับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ Open WebUI smoke ใช้
- `OPENWEBUI_IMAGE=...` เพื่อ override tag ของ Open WebUI image ที่ปักไว้

## การตรวจเอกสารเบื้องต้น

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`.
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ headings ภายในหน้าด้วย: `pnpm docs:check-links:anchors`.

## Offline regression (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือ regression แบบ "real pipeline" โดยไม่มี providers จริง:

- Gateway tool calling (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานเหมือน "agent reliability evals":

- Mock tool-calling ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- Flow ของ wizard แบบ end-to-end ที่ตรวจ session wiring และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมี skills อยู่ใน prompt agent เลือก skill ที่ถูกต้อง (หรือหลีกเลี่ยงรายการที่ไม่เกี่ยวข้อง) หรือไม่?
- **การปฏิบัติตามข้อกำหนด:** agent อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญา workflow:** สถานการณ์หลาย turn ที่ assert ลำดับ tool, การส่งต่อ session history และ sandbox boundaries

evals ในอนาคตควรเริ่มจาก deterministic ก่อน:

- scenario runner ที่ใช้ mock providers เพื่อ assert tool calls + ลำดับ, การอ่านไฟล์ skill และ session wiring
- ชุด scenario ขนาดเล็กที่เน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- live evals แบบเลือกใช้ได้ (opt-in, ควบคุมด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## Contract tests (รูปทรง Plugin และ channel)

Contract tests ตรวจสอบว่า Plugin และ channel ที่ลงทะเบียนทุกตัวสอดคล้องกับ
interface contract ของตัวเอง มันวนผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertions ด้าน shape และ behavior lane unit ของ `pnpm test` เริ่มต้นตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้ ให้รันคำสั่ง contract อย่างชัดเจน
เมื่อคุณแตะ shared channel หรือ provider surfaces

### คำสั่ง

- contracts ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรง Plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญา setup wizard
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง message payload
- **inbound** - การจัดการ inbound message
- **actions** - ตัวจัดการ channel action
- **threading** - การจัดการ thread ID
- **directory** - API directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - รูปทรง Plugin registry

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญา auth flow
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API model catalog
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - Provider runtime
- **shape** - รูปทรง/interface ของ Plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน plugin-sdk exports หรือ subpaths
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (คำแนะนำ)

เมื่อคุณแก้ปัญหา provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub provider หรือ capture การแปลง request-shape ที่ตรงจุด)
- หากเป็น live-only โดยธรรมชาติ (rate limits, auth policies) ให้ live test แคบและ opt-in ผ่าน env vars
- ควร target เลเยอร์ที่เล็กที่สุดที่จับ bug ได้:
  - bug การแปลง/replay request ของ provider → direct models test
  - bug ใน gateway session/history/tool pipeline → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- Guardrail การ traverse SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อ SecretRef class จาก registry metadata (`listSecretTargetRegistryEntries()`) แล้ว assert ว่า exec ids ที่มี traversal segment ถูกปฏิเสธ
  - หากคุณเพิ่ม target family ของ SecretRef `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้ update `classifyTargetClass` ใน test นั้น test ตั้งใจ fail เมื่อ target ids ยังไม่ถูก classify เพื่อให้ classes ใหม่ไม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [Testing live](/th/help/testing-live)
- [Testing updates and plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
