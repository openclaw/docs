---
read_when:
    - การเรียกใช้การทดสอบในเครื่องหรือใน CI
    - การเพิ่มรีเกรสชันสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดทดสอบ: ชุด unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-07-04T04:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไร (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งใดที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบแบบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกไว้ต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) - อ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ตารางคะแนน maturity](/th/maturity/scorecard) - หลักฐาน QA สำหรับ release สนับสนุนการตัดสินใจด้านเสถียรภาพและ LTS อย่างไร
- [ช่องทาง QA](/th/channels/qa-channel) - Plugin การขนส่งสังเคราะห์ที่ใช้โดย scenario ที่มี repo รองรับ

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runner เฉพาะ QA ด้านล่าง ([runner เฉพาะ QA](#qa-specific-runners)) แสดงการเรียกใช้ `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไป:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite ในเครื่องที่เร็วขึ้นบนเครื่องที่มีพื้นที่เพียงพอ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การกำหนดเป้าหมายไฟล์โดยตรงตอนนี้ route path ของส่วนขยาย/ช่องทางด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ให้เลือกการรันแบบเจาะจงก่อนเมื่อคุณกำลัง iterate กับความล้มเหลวเดียว
- ไซต์ QA ที่มี Docker รองรับ: `pnpm qa:lab:up`
- เลน QA ที่มี Linux VM รองรับ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

## ไดเรกทอรีชั่วคราวสำหรับการทดสอบ

ควรใช้ helper ที่ใช้ร่วมกันใน `test/helpers/temp-dir.ts` สำหรับไดเรกทอรีชั่วคราวที่การทดสอบเป็นเจ้าของ helper เหล่านี้ทำให้ ownership ชัดเจนและให้ cleanup อยู่ใน lifecycle เดียวกับการทดสอบ:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` ตั้งใจไม่เปิดเผยเมธอด cleanup แบบ manual; Vitest เป็นเจ้าของการ cleanup หลังการทดสอบแต่ละรายการ helper ระดับต่ำที่มีอยู่ยังคงอยู่สำหรับการทดสอบที่ยังไม่ได้ย้าย แต่การทดสอบใหม่และการทดสอบที่ migrate แล้วควรใช้ tracker ที่ cleanup อัตโนมัติ หลีกเลี่ยงการใช้งาน `makeTempDir`, `cleanupTempDirs` หรือ `createTempDirTracker` แบบ manual ใหม่ และหลีกเลี่ยงการเรียก `fs.mkdtemp*` แบบเปล่าใหม่ในการทดสอบ เว้นแต่กรณีนั้นกำลังตรวจสอบพฤติกรรม temp-dir ดิบอย่างชัดเจน เพิ่มคอมเมนต์ allow ที่ audit ได้พร้อมเหตุผลที่เป็นรูปธรรมเมื่อการทดสอบตั้งใจต้องใช้ไดเรกทอรีชั่วคราวแบบเปล่า:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

เพื่อให้เห็นการ migration, `node scripts/report-test-temp-creations.mjs` รายงานการสร้าง temp-dir แบบเปล่าใหม่และการใช้งาน shared-helper แบบ manual ใหม่ในบรรทัด diff ที่เพิ่ม โดยไม่บล็อกสไตล์ cleanup ที่มีอยู่ ขอบเขตไฟล์ของมันตั้งใจทำตามการจัดประเภท test-path เดียวกับที่ `scripts/changed-lanes.mjs` ใช้ แทนการดูแล heuristic ชื่อไฟล์ test-helper แยกต่างหาก พร้อมข้าม implementation ของ shared helper เอง `check:changed` รันรายงานนี้สำหรับ path การทดสอบที่เปลี่ยนเป็นสัญญาณ CI แบบเตือนเท่านั้น; findings เป็น annotation คำเตือนของ GitHub ไม่ใช่ความล้มเหลว

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุด live (โมเดล + probe เครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- กำหนดเป้าหมายไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงาน performance ของ runtime: dispatch `OpenClaw Performance` พร้อม
  `live_openai_candidate=true` สำหรับ agent turn จริงของ `openai/gpt-5.5` หรือ
  `deep_profile=true` สำหรับ artifact CPU/heap/trace ของ Kova การรันตามตารางรายวัน publish artifact ของเลน mock-provider, deep-profile และ GPT 5.5 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว รายงาน
  mock-provider ยังรวมตัวเลขระดับ source สำหรับการบูต Gateway, memory,
  plugin-pressure, hello-loop ของ fake-model ซ้ำ และการเริ่มต้น CLI
- การ sweep โมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - ตอนนี้แต่ละโมเดลที่เลือกจะรัน turn ข้อความและ probe ขนาดเล็กแบบอ่านไฟล์
    โมเดลที่ metadata ประกาศ input `image` ยังรัน turn รูปภาพขนาดเล็กด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกความล้มเหลวของผู้ให้บริการ
  - Coverage ของ CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก reusable workflow live/E2E ด้วย
    `include_live_suites: true` ซึ่งรวม job matrix ของ Docker live model แยกตาม provider และ shard แล้ว
  - สำหรับการ rerun CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ของผู้ให้บริการที่มีสัญญาณสูงใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller แบบ scheduled/release ของมัน
- Smoke ของ native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รันเลน Docker live กับ path app-server ของ Codex, bind Slack DM สังเคราะห์ด้วย `/codex bind`, exercise `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบ reply แบบธรรมดาและ route attachment รูปภาพผ่าน binding ของ Plugin แบบ native แทน ACP
- Smoke ของ Codex app-server harness: `pnpm test:docker:live-codex-harness`
  - รัน agent turn ของ Gateway ผ่าน harness Codex app-server ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้น exercise probe รูปภาพ,
    cron MCP, sub-agent และ Guardian ปิด probe sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกความล้มเหลวอื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    การทำเช่นนี้จะออกหลัง probe sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Smoke การติดตั้ง Codex ตามต้องการ: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง tarball OpenClaw ที่ package แล้วใน Docker, รัน onboarding ด้วย OpenAI API-key
    และตรวจสอบว่า Plugin Codex พร้อม dependency `@openai/codex`
    ถูกดาวน์โหลดเข้าไปใน root โปรเจกต์ npm ที่จัดการไว้ตามต้องการ
- Smoke dependency ของเครื่องมือ Plugin แบบ live: `pnpm test:docker:live-plugin-tool`
  - Pack fixture Plugin ที่มี dependency `slugify` จริง, ติดตั้งผ่าน
    `npm-pack:`, ตรวจสอบ dependency ใต้ root โปรเจกต์ npm ที่จัดการไว้,
    จากนั้นขอให้โมเดล OpenAI แบบ live เรียกเครื่องมือ Plugin และส่งคืน slug ที่ซ่อนอยู่
- Smoke คำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in belt-and-suspenders สำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    มัน exercise `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบ persistent,
    reply `/crestodian yes` และตรวจสอบ path การเขียน audit/config
- Smoke ของ Crestodian planner ด้วย Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fallback ของ fuzzy planner แปลเป็นการเขียน typed config ที่มี audit แล้ว
- Smoke first-run ของ Crestodian ด้วย Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก state dir ของ OpenClaw ที่ว่างเปล่า, ตรวจสอบ entrypoint Crestodian ของ onboard แบบ modern,
    ใช้การเขียน setup/model/agent/Discord Plugin + SecretRef,
    validate config และตรวจสอบ audit entries path การตั้งค่า Ring 0 เดียวกันยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Smoke ต้นทุน Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบ isolated กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวหนึ่งกรณี ให้เลือกจำกัดการทดสอบ live ผ่าน env vars แบบ allowlist ที่อธิบายไว้ด้านล่าง
</Tip>

## runner เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ workflow PR แบบ standalone
การ validation แบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release แบบ stable/default
เก็บ soak แบบ live/Docker ที่ละเอียดไว้หลัง `run_release_soak=true`; profile
`full` บังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อมเลน mock parity, เลน Matrix แบบ live,
เลน Telegram live ที่จัดการโดย Convex และเลน Discord live ที่จัดการโดย Convex
เป็น job คู่ขนาน Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่า default ของ Matrix CLI และ input ของ manual workflow
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็น job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อมเลน Matrix แบบ fast และ Telegram ก่อนการอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ release transport เพื่อให้ deterministic
และหลีกเลี่ยงการเริ่มต้น provider-plugin ปกติ Gateway การขนส่งแบบ live เหล่านี้
ปิด memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

Shard ของ live media สำหรับ full release ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Shard ของ Docker live model/backend ใช้ image
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ใช้ร่วมกันซึ่ง build หนึ่งครั้งต่อ commit
ที่เลือก จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงกับรีโปโดยตรงบนโฮสต์
  - เขียนอาร์ติแฟกต์ระดับบนสุด `qa-evidence.json`, `qa-suite-summary.json` และ
    `qa-suite-report.md` สำหรับชุดสถานการณ์ที่เลือก รวมถึงการเลือกสถานการณ์แบบ
    mixed flow, Vitest และ Playwright
  - เมื่อถูกส่งงานโดย `pnpm openclaw qa run --qa-profile <profile>` จะฝัง
    สกอร์การ์ดโปรไฟล์ taxonomy ที่เลือกไว้ใน `qa-evidence.json` เดียวกัน
    `smoke-ci` เขียนหลักฐานแบบย่อ ซึ่งตั้งค่า `evidenceMode: "slim"` และละเว้น
    `execution` รายรายการ `release` ครอบคลุมส่วนคัดสรรสำหรับความพร้อมของรีลีส;
    `all` เลือกทุกหมวด maturity ที่ใช้งานอยู่ และมีไว้สำหรับการส่งงานเวิร์กโฟลว์
    QA Profile Evidence อย่างชัดเจนเมื่อจำเป็นต้องมีอาร์ติแฟกต์สกอร์การ์ดเต็มรูปแบบ
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการแบบขนานโดยค่าเริ่มต้นด้วย
    gateway worker ที่แยกกัน `qa-channel` มีค่าเริ่มต้นเป็น concurrency 4
    (จำกัดด้วยจำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน
    worker หรือ `--concurrency 1` สำหรับเลนแบบอนุกรมเดิม
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures`
    เมื่อต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ provider ในเครื่องที่อิง AIMock สำหรับความครอบคลุม
    fixture และ protocol-mock เชิงทดลอง โดยไม่แทนที่เลน `mock-openai`
    ที่รับรู้สถานการณ์
- `pnpm openclaw qa coverage --match <query>`
  - ค้นหา ID สถานการณ์ ชื่อเรื่อง surface, coverage ID, การอ้างอิงเอกสาร,
    การอ้างอิงโค้ด, plugins และข้อกำหนดของ provider จากนั้นพิมพ์เป้าหมายชุดทดสอบ
    ที่ตรงกัน
  - ใช้สิ่งนี้ก่อนการรัน QA Lab เมื่อคุณรู้พฤติกรรมหรือพาธไฟล์ที่ถูกแตะ
    แต่ไม่รู้สถานการณ์ที่เล็กที่สุด คำสั่งนี้เป็นเพียงคำแนะนำเท่านั้น;
    ยังต้องเลือกหลักฐาน mock, live, Multipass, Matrix หรือ transport จากพฤติกรรม
    ที่กำลังเปลี่ยน
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้การทดสอบ live OpenAI Kitchen Sink plugin แบบ gauntlet ผ่าน QA Lab
    โดยติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory ของพื้นผิว plugin SDK
    โพรบ `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ gateway เรียกใช้
    OpenAI turn แบบ live และตรวจสอบ diagnostics เชิงปฏิปักษ์ ต้องมี auth OpenAI
    แบบ live เช่น `OPENAI_API_KEY` ในเซสชัน Testbox ที่ hydrate แล้ว จะ source
    โปรไฟล์ live-auth ของ Testbox โดยอัตโนมัติเมื่อมีตัวช่วย
    `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ bench การเริ่มต้น gateway พร้อมกับแพ็กสถานการณ์ QA Lab แบบ mock
    ขนาดเล็ก (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวมไว้ใต้
    `.artifacts/gateway-cpu-scenarios/`
  - แจ้งเฉพาะการสังเกต CPU ร้อนที่คงอยู่นานโดยค่าเริ่มต้น (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ตอนเริ่มต้นจะถูกบันทึกเป็น
    metrics โดยไม่ดูเหมือน regression ที่ทำให้ gateway ตรึง CPU นานหลายนาที
  - ใช้อาร์ติแฟกต์ `dist` ที่ build แล้ว; รัน build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์เหมือนกับ `qa suite` บนโฮสต์
  - ใช้ flags การเลือก provider/model เดียวกันกับ `qa suite`
  - การรันแบบ live จะส่งต่อ input auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    คีย์ provider ผ่าน env, พาธ config provider แบบ live ของ QA และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรี output ต้องอยู่ใต้รากรีโปเพื่อให้ guest เขียนกลับผ่าน workspace
    ที่ mount ได้
  - เขียนรายงานและสรุป QA ปกติพร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิง Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน Docker
    รันการ onboarding ด้วย OpenAI API key แบบไม่โต้ตอบ กำหนดค่า Telegram
    โดยค่าเริ่มต้น ตรวจสอบว่า runtime ของ packaged plugin โหลดได้โดยไม่ต้องซ่อม
    dependency ตอนเริ่มต้น รัน doctor และรัน agent turn ในเครื่องหนึ่งครั้งกับ
    endpoint OpenAI แบบ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลน packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน smoke ของ built-app ใน Docker แบบกำหนดได้แน่นอนสำหรับ transcript ของ
    embedded runtime context โดยตรวจสอบว่า runtime context ของ OpenClaw ที่ซ่อนอยู่
    ถูก persist เป็น custom message ที่ไม่แสดงผล แทนที่จะรั่วไปยัง user turn
    ที่มองเห็นได้ จากนั้น seed JSONL ของ session ที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker รัน onboarding ของแพ็กเกจที่ติดตั้ง
    กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้ง จากนั้นใช้เลน Telegram QA แบบ live
    ซ้ำโดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น Gateway ของ SUT
  - wrapper mount เฉพาะซอร์ส harness `qa-lab` จาก checkout; แพ็กเกจที่ติดตั้ง
    เป็นเจ้าของ `dist`, `openclaw/plugin-sdk` และ runtime ของ bundled plugin
    เพื่อให้เลนไม่ผสม plugins จาก checkout ปัจจุบันเข้าไปในแพ็กเกจที่ทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ในเครื่องที่ resolve แล้ว
    แทนการติดตั้งจาก registry
  - ปล่อย timing RTT ซ้ำใน `qa-evidence.json` โดยค่าเริ่มต้นด้วย
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` ปรับทับ
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับการรัน RTT
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` รับรายการ ID การตรวจสอบ Telegram QA
    ที่คั่นด้วยจุลภาคสำหรับสุ่มตัวอย่าง; เมื่อไม่ได้ตั้งค่า การตรวจสอบเริ่มต้น
    ที่รองรับ RTT คือ `telegram-mentioned-message-reply`
  - ใช้ credentials env ของ Telegram หรือแหล่ง credentials ของ Convex เดียวกันกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ env ของ credentials Telegram หรือ Convex บนโฮสต์ก่อนงาน
    Docker build/install ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อตั้งใจ debug การตั้งค่าก่อนมี credentials
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น เมื่อเลือก
    credentials ของ Convex และไม่ได้ตั้ง role wrapper จะใช้ `ci` ใน CI และ
    `maintainer` นอก CI
  - GitHub Actions เปิดเลนนี้เป็นเวิร์กโฟลว์ maintainer แบบ manual
    `NPM Telegram Beta E2E` เลนนี้ไม่รันเมื่อ merge เวิร์กโฟลว์ใช้ environment
    `qa-live-shared` และ lease credentials CI ของ Convex
- GitHub Actions ยังเปิด `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับแพ็กเกจ candidate หนึ่งรายการด้วย โดยรับ ref ที่เชื่อถือได้, npm spec
  ที่เผยแพร่แล้ว, URL tarball แบบ HTTPS พร้อม SHA-256 หรืออาร์ติแฟกต์ tarball
  จากการรันอื่น อัปโหลด `openclaw-current.tgz` ที่ normalize แล้วเป็น
  `package-under-test` จากนั้นรัน Docker E2E scheduler ที่มีอยู่ด้วยโปรไฟล์เลน
  smoke, package, product, full หรือ custom ตั้งค่า `telegram_mode=mock-openai`
  หรือ `live-frontier` เพื่อรันเวิร์กโฟลว์ Telegram QA กับอาร์ติแฟกต์
  `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL tarball แบบระบุแน่นอนต้องใช้ digest และใช้นโยบายความปลอดภัย
  ของ URL สาธารณะ:

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

`source=trusted-url` อ่าน `.github/package-trusted-sources.json` จาก ref
เวิร์กโฟลว์ที่เชื่อถือได้ และไม่รับ credentials ของ URL หรือ bypass
private-network ผ่าน workflow-input หากนโยบายที่ระบุชื่อประกาศ bearer auth
ให้กำหนดค่า secret คงที่ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`

- หลักฐานอาร์ติแฟกต์ดาวน์โหลดอาร์ติแฟกต์ tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้วเปิดใช้ channel/plugins ที่ bundled ผ่านการแก้ไข config
  - ตรวจสอบว่า setup discovery ปล่อยให้ downloadable plugins ที่ยังไม่ได้กำหนดค่า
    ไม่ปรากฏอยู่ การซ่อม doctor ครั้งแรกที่กำหนดค่าแล้วติดตั้ง downloadable
    plugin ที่ขาดหายแต่ละรายการอย่างชัดเจน และการ restart ครั้งที่สองไม่รัน
    การซ่อม dependency ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลัง update
    ของ candidate ทำความสะอาดเศษ dependency ของ legacy plugin โดยไม่มีการซ่อม
    postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การ update แบบ packaged-install native ข้าม guest ของ Parallels
    แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง
    สถานะ update ความพร้อมของ gateway และ agent turn ในเครื่องหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux`
    ระหว่าง iterate บน guest หนึ่งรายการ ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุป
    และสถานะต่อเลน
  - เลน OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน agent-turn แบบ live
    โดยค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อตั้งใจตรวจสอบโมเดล OpenAI อื่น
  - ครอบการรันในเครื่องที่ใช้เวลานานด้วย timeout ของโฮสต์ เพื่อไม่ให้การค้างของ
    transport ของ Parallels ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียน log ของเลนที่ซ้อนกันไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การ update บน Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลัง update
    และงาน update แพ็กเกจบน guest ที่เย็นอยู่; ยังถือว่าปกติเมื่อ npm debug log
    ที่ซ้อนอยู่ยังคืบหน้า
  - อย่ารัน wrapper รวมนี้ขนานกับเลน smoke แยกของ Parallels macOS, Windows หรือ
    Linux เพราะใช้สถานะ VM ร่วมกันและอาจชนกันในการ restore snapshot การเสิร์ฟแพ็กเกจ
    หรือสถานะ gateway ของ guest
  - หลักฐานหลัง update รันพื้นผิว bundled plugin ปกติ เพราะ capability facade
    เช่น speech, image generation และ media understanding ถูกโหลดผ่าน bundled
    runtime APIs แม้ว่า agent turn เองจะตรวจเพียง response ข้อความแบบง่าย

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการทดสอบ smoke
    ของโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รันเลน QA สดของ Matrix กับ Tuwunel homeserver แบบใช้แล้วทิ้งที่รองรับด้วย Docker เฉพาะ source-checkout เท่านั้น - การติดตั้งแบบแพ็กเกจไม่ได้ส่ง `qa-lab` มาด้วย
  - CLI แบบเต็ม แคตตาล็อกโปรไฟล์/สถานการณ์ ตัวแปรสภาพแวดล้อม และโครงร่าง artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รันเลน QA สดของ Telegram กับกลุ่มส่วนตัวจริง โดยใช้โทเค็นบอต driver และ SUT จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` id ของกลุ่มต้องเป็น id แชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลประจำตัวแบบพูลร่วม ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบพูล
  - ค่าเริ่มต้นครอบคลุม canary, mention gating, command addressing, `/status`, การตอบกลับแบบบอตถึงบอตที่ถูก mention และการตอบกลับคำสั่ง native หลัก ค่าเริ่มต้น `mock-openai` ยังครอบคลุมรีเกรสชันของ reply-chain แบบกำหนดแน่นอนและการสตรีม final-message ของ Telegram ด้วย ใช้ `--list-scenarios` สำหรับ probe เสริม เช่น `session_status`
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องใช้บอตที่แตกต่างกันสองตัวในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อการสังเกตบอตถึงบอตที่เสถียร ให้เปิดใช้งาน Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับบอตทั้งสองตัว และตรวจสอบว่าบอต driver สามารถสังเกตทราฟฟิกบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และ `qa-evidence.json` ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับของ SUT ที่สังเกตพบ

`Mantis Telegram Live` คือ wrapper หลักฐาน PR รอบเลนนี้ โดยจะรัน ref ผู้สมัครด้วยข้อมูลประจำตัว Telegram ที่ lease ผ่าน Convex, เรนเดอร์รายงาน QA
และชุดหลักฐานที่ redacted ในเบราว์เซอร์เดสก์ท็อป Crabbox, บันทึกหลักฐาน MP4,
สร้าง GIF ที่ตัดแต่งตามการเคลื่อนไหว, อัปโหลดชุด artifact และโพสต์หลักฐาน PR
แบบ inline ผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number` ผู้ดูแลสามารถ
เริ่มจาก Actions UI ผ่าน `Mantis Scenario` (`scenario_id:
telegram-live`) หรือโดยตรงจากคอมเมนต์ใน pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` คือ wrapper แบบ agentic สำหรับ Telegram Desktop
native ก่อน/หลัง สำหรับหลักฐานภาพของ PR เริ่มจาก Actions UI ด้วย
`instructions` แบบ freeform, ผ่าน `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) หรือจากคอมเมนต์ PR:

```text
@openclaw-mantis telegram desktop proof
```

agent ของ Mantis อ่าน PR, ตัดสินใจว่าพฤติกรรมที่มองเห็นได้ใน Telegram ใดพิสูจน์
การเปลี่ยนแปลง, รันเลนพิสูจน์ Telegram Desktop ผ่าน Crabbox แบบผู้ใช้จริงบน ref baseline และ
candidate, ทำซ้ำจนกว่า GIF native จะมีประโยชน์, เขียน manifest `motionPreview`
แบบจับคู่ และโพสต์ตาราง GIF 2 คอลัมน์เดียวกันผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number`

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Lease หรือใช้เดสก์ท็อป Linux ของ Crabbox เดิมซ้ำ, ติดตั้ง Telegram Desktop native, กำหนดค่า OpenClaw ด้วยโทเค็นบอต SUT ของ Telegram ที่ถูก lease, เริ่ม Gateway และบันทึกหลักฐาน screenshot/MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้
  - ค่าเริ่มต้นเป็น `--credential-source convex` เพื่อให้ workflow ต้องใช้เฉพาะ secret ของ broker Convex ใช้ `--credential-source env` กับตัวแปร `OPENCLAW_QA_TELEGRAM_*` เดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังคงต้องมีการเข้าสู่ระบบ/โปรไฟล์ผู้ใช้ โทเค็นบอตกำหนดค่าเฉพาะ OpenClaw ใช้ `--telegram-profile-archive-env <name>` สำหรับ archive โปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` และเข้าสู่ระบบด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` และ `telegram-desktop-builder.mp4` ใต้ไดเรกทอรีเอาต์พุต

เลน transport สดใช้สัญญามาตรฐานเดียวกันเพื่อไม่ให้ transport ใหม่เบี่ยงออกไป เมทริกซ์ความครอบคลุมต่อเลนอยู่ใน [ภาพรวม QA → ความครอบคลุม transport สด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุดทดสอบสังเคราะห์แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลประจำตัว Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้งาน `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
QA transport สด, QA lab จะขอรับ lease แบบเอกสิทธิ์จากพูลที่รองรับด้วย Convex, ส่ง Heartbeat ให้
lease นั้นขณะเลนกำลังรัน และปล่อย lease เมื่อปิดการทำงาน ชื่อส่วนนี้มีมาก่อน
การรองรับ Discord, Slack และ WhatsApp; สัญญา lease ใช้ร่วมกันข้ามชนิด

scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลประจำตัว:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

ตัวแปร env เสริม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id เสริม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ local loopback `http://` สำหรับการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแล maintainer (เพิ่ม/ลบ/แสดงรายการพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

helper ของ CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันสดเพื่อตรวจสอบ URL ไซต์ Convex, secret ของ broker,
prefix ของ endpoint, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์
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
- `POST /admin/add` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - guard สำหรับ lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปทรง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง id แชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปทรงนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่มีรูปแบบไม่ถูกต้อง

รูปทรง payload สำหรับชนิดผู้ใช้จริงของ Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริง hex SHA-256
- `kind: "telegram-user"` สงวนไว้สำหรับ workflow พิสูจน์ Mantis Telegram Desktop เลน QA Lab ทั่วไปต้องไม่ acquire ชนิดนี้

payload หลายช่องทางที่ broker ตรวจสอบ:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถ lease จากพูลได้เช่นกัน แต่การตรวจสอบ payload ของ Slack ในปัจจุบัน
อยู่ใน runner QA ของ Slack แทนที่จะอยู่ใน broker ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางเข้า QA

ชื่อสถาปัตยกรรมและ helper ของสถานการณ์สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement runner ของ transport บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, เมานต์เป็น `openclaw qa <runner>` และเขียนสถานการณ์ไว้ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดว่าชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่ระบุเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config ต่อโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventory core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard เฉพาะ `unit-ui`
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ภายใน process (การ auth ของ Gateway, routing, tooling, parsing, config)
  - รีเกรสชันแบบกำหนดแน่นอนสำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และ loader ของ public-surface ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่ bundled จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

นโยบาย dependency แบบ native:

- การติดตั้งทดสอบค่าเริ่มต้นข้าม build opus native ของ Discord แบบเสริม Discord voice ใช้ `libopus-wasm` ที่ bundled และ `@discordjs/opus` ยังคงถูกปิดใช้งานใน `allowBuilds` เพื่อให้การทดสอบภายในเครื่องและเลน Testbox ไม่คอมไพล์ addon native
- เปรียบเทียบประสิทธิภาพ opus native ใน repo benchmark ของ `libopus-wasm` ไม่ใช่ใน loop ติดตั้ง/ทดสอบเริ่มต้นของ OpenClaw อย่าตั้งค่า `@discordjs/opus` เป็น `true` ใน `allowBuilds` ค่าเริ่มต้น เพราะจะทำให้ loop ติดตั้ง/ทดสอบที่ไม่เกี่ยวข้องคอมไพล์โค้ด native

<AccordionGroup>
  <Accordion title="โปรเจกต์, shard และเลนแบบกำหนดขอบเขต">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิก shard ที่เล็กกว่า 12 ชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project แบบเนทีฟขนาดใหญ่เพียงชุดเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลดสูง และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังใช้กราฟโปรเจกต์ root แบบเนทีฟ `vitest.config.ts` เพราะลูป watch แบบหลาย shard ไม่เหมาะในทางปฏิบัติ
    - `pnpm test`, `pnpm test:watch`, และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่าน lane ตามขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องเสียต้นทุนเริ่มต้นของ root project ทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็น lane ตามขอบเขตราคาถูกโดยค่าเริ่มต้น: การแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน, และ dependent ในกราฟ import ภายในเครื่อง การแก้ไข config/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบภายในเครื่องแบบฉลาดสำหรับงานขอบเขตแคบตามปกติ มันจัดประเภท diff เป็น core, การทดสอบ core, extensions, การทดสอบ extension, apps, docs, metadata รุ่นเผยแพร่, เครื่องมือ live Docker, และ tooling จากนั้นรันคำสั่ง typecheck, lint, และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อเป็นหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจสอบเวอร์ชัน/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข live Docker ACP harness จะรันการตรวจสอบเฉพาะจุด: syntax ของ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler ของ live Docker การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่น ๆ ยังใช้ guard ที่กว้างกว่า
    - การทดสอบ unit แบบ import เบาจาก agents, commands, plugins, helper ของ auto-reply, `plugin-sdk`, และพื้นที่ utility ล้วนที่คล้ายกัน จะถูกส่งผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime หนักยังคงอยู่บน lane เดิม
    - ไฟล์ซอร์ส helper บางส่วนของ `plugin-sdk` และ `commands` ยังแมปการรัน changed-mode ไปยังการทดสอบพี่น้องที่ระบุชัดเจนใน lane เบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จึงเลี่ยงการรันชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด, การทดสอบ integration ระดับบนสุด `reply.*`, และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply เพิ่มเป็น shard agent-runner, dispatch, และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักเพียงชุดเดียวแบกช่วงท้ายของ Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้าม sweep แบบ batch ของ extension และ shard `agentic-plugins` ที่ใช้เฉพาะ release การ dispatch Full Release Validation จะเรียก workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="ความครอบคลุมของ embedded runner">

    - เมื่อคุณเปลี่ยน input ของการค้นหา message-tool หรือ context runtime ของ Compaction
      ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบเจาะจงสำหรับขอบเขตการ routing และ normalization
      แบบล้วน
    - รักษาชุด integration ของ embedded runner ให้สมบูรณ์:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, และ
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจสอบว่า scoped id และพฤติกรรม Compaction ยังคงไหลผ่าน
      พาธจริง `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ Vitest pool และ isolation">

    - คอนฟิก Vitest พื้นฐานมีค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ร่วมกำหนด `isolate: false` และใช้ runner
      แบบไม่ isolate ใน root projects, e2e, และคอนฟิก live
    - lane UI ของ root ยังคงใช้ setup และ optimizer ของ `jsdom` แต่รันบน
      runner ร่วมแบบไม่ isolate เช่นกัน
    - แต่ละ shard ของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ร่วม
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กระบวนการลูก Node
      ของ Vitest โดยค่าเริ่มต้น เพื่อลด churn ของการ compile V8 ระหว่างการรันภายในเครื่องขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน
    - `scripts/run-vitest.mjs` จะยุติการรัน Vitest แบบ non-watch ที่ระบุชัดเจนหลังจาก
      5 นาทีหากไม่มี output stdout หรือ stderr ตั้งค่า
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` เพื่อปิด watchdog สำหรับการสืบสวน
      ที่ตั้งใจให้เงียบ

  </Accordion>

  <Accordion title="การทำซ้ำภายในเครื่องอย่างรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้น lane ทางสถาปัตยกรรมใดบ้าง
    - hook pre-commit ทำเฉพาะ formatting มัน restage ไฟล์ที่จัดรูปแบบแล้วและ
      ไม่รัน lint, typecheck, หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบภายในเครื่องแบบฉลาด
    - `pnpm test:changed` ส่งผ่าน lane ตามขอบเขตราคาถูกโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package, หรือ contract ต้องการ
      ความครอบคลุม Vitest ที่กว้างกว่าจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่ใช้ขีดจำกัด worker ที่สูงกว่า
    - การปรับขนาด worker ภายในเครื่องโดยอัตโนมัติตั้งใจให้ระมัดระวัง และจะลดระดับลง
      เมื่อค่า load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุด
      จะสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมาย projects/config files เป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำแบบ changed-mode ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` บนโฮสต์ที่รองรับ
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนหนึ่งแห่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดการรายงานระยะเวลา import ของ Vitest พร้อม
      output import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันให้กับ
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็น key; shard ของ CI แบบ include-pattern
      จะต่อท้ายชื่อ shard เพื่อให้ติดตาม shard ที่ถูกกรองแยกกันได้
    - เมื่อการทดสอบที่ร้อนรายการหนึ่งยังใช้เวลาส่วนใหญ่ไปกับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam ภายในเครื่องแบบแคบ `*.runtime.ts` และ
      mock seam นั้นโดยตรง แทนการ deep-import helper runtime เพียงเพื่อ
      ส่งผ่านไปยัง `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ผ่าน routing กับพาธ root-project แบบเนทีฟสำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดยส่งรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ของ root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead การ startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน profile CPU+heap ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, memory, และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper persistence ของ diagnostic stability bundle
  - assert ว่า recorder ยังคงถูกจำกัดขนาด, ตัวอย่าง RSS สังเคราะห์ยังอยู่ใต้ budget ความกดดัน, และ queue depth ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เป็น lane แคบสำหรับการติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (ภาพรวม repo)

- คำสั่ง: `pnpm test:e2e`
- ขอบเขต:
  - รัน lane E2E gateway smoke
  - รัน lane E2E browser ของ Control UI แบบ mock
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - ต้องติดตั้ง Playwright Chromium

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e:gateway`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, และการทดสอบ E2E ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมด silent โดยค่าเริ่มต้น เพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด verbose console output อีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ node, และเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีชิ้นส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E (browser ของ Control UI แบบ mock)

- คำสั่ง: `pnpm test:ui:e2e`
- คอนฟิก: `test/vitest/vitest.ui-e2e.config.ts`
- ไฟล์: `ui/src/**/*.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Vite Control UI
  - ขับหน้า Chromium จริงผ่าน Playwright
  - แทนที่ Gateway WebSocket ด้วย mock ใน browser ที่ deterministic
- ความคาดหวัง:
  - รันใน CI เป็นส่วนหนึ่งของ `pnpm test:e2e`
  - ไม่ต้องใช้ Gateway, agents, หรือ key ของ provider จริง
  - ต้องมี dependency ของ browser (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - ใช้ gateway ของ OpenShell ภายในเครื่องที่ active อยู่ซ้ำ
  - สร้าง sandbox จาก Dockerfile ภายในเครื่องชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - opt-in เท่านั้น; ไม่ได้เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่องพร้อม Docker daemon ที่ใช้งานได้
  - ต้องมี gateway OpenShell ภายในเครื่องที่ active และแหล่งคอนฟิกของมัน
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolate แล้วทำลาย sandbox ทดสอบ
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` เพื่อเปิดเผยคอนฟิก gateway ที่ลงทะเบียนไว้ให้กับการทดสอบแบบ isolate
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` เพื่อ override IP ของ Docker gateway ที่ใช้โดย fixture ของ host policy

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบแบบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?"
  - ตรวจจับการเปลี่ยนรูปแบบของ provider, ความเฉพาะตัวของการเรียกใช้เครื่องมือ, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่ได้ออกแบบให้เสถียรสำหรับ CI (เครือข่ายจริง, นโยบาย provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่จำกัดขอบเขตแทนที่จะรัน "ทุกอย่าง"
- การรันแบบ live ใช้ API key ที่ export ไว้แล้วและโปรไฟล์ auth ที่เตรียมไว้
- โดยค่าเริ่มต้น การรันแบบ live ยังคงแยก `HOME` และคัดลอกวัสดุ config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ fixture ของ unit test แก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบแบบ live ใช้โฮมไดเรกทอรีจริงของคุณ
- `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: จะคง output ความคืบหน้า `[live] ...` ไว้ และปิดเสียง log bootstrap ของ gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการให้ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ราย live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ response rate limit
- Output ความคืบหน้า/Heartbeat:
  - ตอนนี้ suite แบบ live จะปล่อยบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียก provider ที่ใช้เวลานานยังทำงานอยู่ แม้การจับ console ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรันแบบ live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรัน suite ใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- Debug "บอตของฉันล่ม" / failure เฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบแบบ Live (แตะเครือข่าย)

สำหรับ live model matrix, smoke ของ CLI backend, smoke ของ ACP, harness ของ Codex app-server
และการทดสอบแบบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) รวมถึงการจัดการ credential สำหรับการรันแบบ live โปรดดู
[การทดสอบ live suites](/th/help/testing-live) สำหรับ checklist เฉพาะด้าน update และ
การตรวจสอบ Plugin โปรดดู
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

## Docker runners (การตรวจสอบ "ใช้งานได้ใน Linux" แบบ optional)

Docker runners เหล่านี้แบ่งเป็นสองกลุ่ม:

- Live-model runners: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ที่ตรงกับ profile-key ของตนภายใน Docker image ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount config dir ในเครื่อง, workspace และไฟล์ env profile ที่เป็น optional entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners คง cap ที่ใช้งานจริงของตนไว้เมื่อจำเป็น:
  `test:docker:live-models` ใช้ชุด curated supported high-signal เป็นค่าเริ่มต้น และ
  `test:docker:live-gateway` ใช้ `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` เป็นค่าเริ่มต้น ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS`
  หรือ env vars ของ gateway เมื่อคุณต้องการ cap ที่เล็กลงหรือการสแกนที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` build live Docker image หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้น build/reuse image `scripts/e2e/Dockerfile` สองตัว image แบบ bare เป็นเพียง Node/Git runner สำหรับ lane install/update/plugin-dependency เท่านั้น; lane เหล่านั้น mount tarball ที่ prebuilt ไว้ image แบบ functional ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันของ built-app คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` รัน plan ที่เลือก aggregate ใช้ scheduler แบบ weighted local: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slots ขณะที่ resource caps กันไม่ให้ lane หนักอย่าง live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่ active อยู่ scheduler ยังสามารถเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วปล่อยให้รันเดี่ยวจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ Docker host มี headroom มากขึ้น runner ทำ Docker preflight โดยค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บเวลาของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่ม lane ที่ยาวกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ CI plan สำหรับ lane ที่เลือก, ความต้องการ package/image และ credentials
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่?" มัน resolve candidate package หนึ่งตัวจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, upload เป็น `package-under-test` จากนั้นรัน lane Docker E2E ที่ reusable กับ tarball นั้นโดยตรงแทนการ repack ref ที่เลือก Profile เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` ดู contract ของ package/update/plugin, survivor matrix ของ published-upgrade, ค่าเริ่มต้นของ release และการ triage failure ได้ที่ [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และ fail หาก startup ก่อน dispatch import package dependencies เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; นอกจากนี้ยังคุม bundled gateway run chunk ให้อยู่ใน budget และปฏิเสธ static import ของ cold gateway paths ที่รู้จัก Packaged CLI smoke ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance ถูก cap ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่าง metadata ของ shipped-package: รายการ private QA inventory ที่ละไว้, ไม่มี `gateway install --wrapper`, ไม่มี patch files ใน fixture git ที่ derive จาก tarball, ไม่มี `update.channel` ที่ persist, ตำแหน่ง install-record ของ Plugin แบบ legacy, ไม่มี persistence ของ marketplace install-record และการ migrate config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นเป็น failure แบบ strict
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` boot container จริงหนึ่งตัวหรือมากกว่าและ verify path integration ระดับสูง
- Docker/Bash E2E lanes ที่ติดตั้ง packed OpenClaw tarball ผ่าน `scripts/lib/openclaw-e2e-instance.sh` cap `npm install` ที่ `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (ค่าเริ่มต้น `600s`; ตั้งค่า `0` เพื่อปิด wrapper สำหรับ debugging)

Live-model Docker runners ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้จำกัดขอบเขต) จากนั้นคัดลอกเข้า container home ก่อนรัน เพื่อให้ OAuth ของ external-CLI refresh token ได้โดยไม่แก้ไข auth store ของ host:

- Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini โดยค่าเริ่มต้น พร้อม coverage แบบ strict สำหรับ Droid/OpenCode ผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` และ `pnpm qa:observability:smoke` เป็น lane private QA source-checkout โดยตั้งใจไม่รวมอยู่ใน lane Docker release ของ package เพราะ npm tarball ละเว้น QA Lab
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง packed OpenClaw tarball แบบ global ใน Docker, configure OpenAI ผ่าน env-ref onboarding พร้อม Telegram โดยค่าเริ่มต้น, รัน doctor และรัน agent turn ของ OpenAI ที่ mock หนึ่งครั้ง ใช้ tarball ที่ prebuilt ซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บน host ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`

- สโมคการเดินทางผู้ใช้ของรุ่นเผยแพร่: `pnpm test:docker:release-user-journey` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วทั้งระบบใน Docker home ที่สะอาด, รันการเริ่มต้นใช้งาน, กำหนดค่า provider OpenAI แบบจำลอง, รันหนึ่ง agent turn, ติดตั้ง/ถอนการติดตั้ง Plugin ภายนอก, กำหนดค่า ClickClack กับ fixture ภายในเครื่อง, ตรวจสอบข้อความขาออก/ขาเข้า, รีสตาร์ท Gateway, และรัน doctor
- สโมคการเริ่มต้นใช้งานแบบ typed ของรุ่นเผยแพร่: `pnpm test:docker:release-typed-onboarding` ติดตั้ง tarball ที่แพ็กแล้ว, ขับ `openclaw onboard` ผ่าน TTY จริง, กำหนดค่า OpenAI เป็น provider แบบ env-ref, ตรวจสอบว่าไม่มีการคงอยู่ของคีย์ดิบ, และรัน agent turn แบบจำลอง
- สโมคสื่อ/หน่วยความจำของรุ่นเผยแพร่: `pnpm test:docker:release-media-memory` ติดตั้ง tarball ที่แพ็กแล้ว, ตรวจสอบความเข้าใจภาพจากไฟล์แนบ PNG, เอาต์พุตการสร้างภาพแบบเข้ากันได้กับ OpenAI, การเรียกคืนจากการค้นหาหน่วยความจำ, และการเรียกคืนยังอยู่รอดหลังรีสตาร์ท Gateway
- สโมคการเดินทางผู้ใช้สำหรับอัปเกรดรุ่นเผยแพร่: `pnpm test:docker:release-upgrade-user-journey` โดยค่าเริ่มต้นจะติดตั้ง baseline ที่เผยแพร่ล่าสุดซึ่งเก่ากว่า tarball ผู้สมัคร, กำหนดค่าสถานะ provider/Plugin/ClickClack บนแพ็กเกจที่เผยแพร่, อัปเกรดเป็น tarball ผู้สมัคร, แล้วรันการเดินทางหลักของ agent/Plugin/channel อีกครั้ง หากไม่มี baseline ที่เผยแพร่เก่ากว่า จะใช้เวอร์ชันผู้สมัครซ้ำ แทนที่ baseline ด้วย `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`
- สโมคตลาด Plugin ของรุ่นเผยแพร่: `pnpm test:docker:release-plugin-marketplace` ติดตั้งจากตลาด fixture ภายในเครื่อง, อัปเดต Plugin ที่ติดตั้งแล้ว, ถอนการติดตั้ง, และตรวจสอบว่า CLI ของ Plugin หายไปพร้อมกับ metadata การติดตั้งที่ถูกตัดออก
- สโมคการติดตั้ง Skill: `pnpm test:docker:skill-install` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วทั้งระบบใน Docker, ปิดการติดตั้ง archive ที่อัปโหลดในการกำหนดค่า, resolve slug ของ ClawHub skill สดปัจจุบันจากการค้นหา, ติดตั้งด้วย `openclaw skills install`, และตรวจสอบ skill ที่ติดตั้งพร้อม metadata ต้นทาง/ล็อก `.clawhub`
- สโมคการสลับ update channel: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบทั่วทั้งระบบใน Docker, สลับจากแพ็กเกจ `stable` เป็น git `dev`, ตรวจสอบ channel ที่คงอยู่และงานหลังอัปเดตของ Plugin, จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- สโมคผู้รอดจากการอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มี agents, การกำหนดค่า channel, allowlists ของ Plugin, สถานะ dependency ของ Plugin ที่ค้าง, และไฟล์ workspace/session ที่มีอยู่ โดยจะรันการอัปเดตแพ็กเกจพร้อม doctor แบบ non-interactive โดยไม่มี provider สดหรือคีย์ channel, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงอยู่ของ config/state พร้อมงบประมาณ startup/status
- สโมคผู้รอดจากการอัปเกรดที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น, seed ไฟล์ผู้ใช้ที่มีอยู่แบบสมจริง, กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่ bake ไว้, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ผู้สมัคร, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intents ที่กำหนดค่า, การคงอยู่ของสถานะ, startup, `/healthz`, `/readyz`, และงบประมาณสถานะ RPC แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ตัวจัดตารางแบบรวมขยาย baseline ภายในเครื่องที่ระบุแน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, และขยาย fixture ที่มีรูปทรงเป็น issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมการติดตั้ง OpenClaw Plugin ภายนอกโดยอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, และ `published_upgrade_survivor_scenarios`, resolve โทเค็น meta baseline เช่น `last-stable-4` หรือ `all-since-2026.4.23`, และ Full Release Validation ขยาย package gate ของ release-soak เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- สโมคบริบท runtime ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ พร้อมการซ่อมโดย doctor ของกิ่ง prompt-rewrite ที่ซ้ำและได้รับผลกระทบ
- สโมคการติดตั้ง Bun แบบ global: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้, และตรวจสอบว่า `openclaw infer image providers --json` คืน provider ภาพที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- สโมค Docker ตัวติดตั้ง: `bash scripts/test-install-sh-docker.sh` แชร์แคช npm หนึ่งชุดระหว่างคอนเทนเนอร์ root, update, และ direct-npm สโมค update ใช้ npm `latest` เป็น baseline stable โดยค่าเริ่มต้นก่อนอัปเกรดเป็น tarball ผู้สมัคร แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ภายในเครื่อง, หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบตัวติดตั้งแบบ non-root เก็บแคช npm ที่แยกไว้ เพื่อไม่ให้รายการแคชที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งภายในเครื่องของผู้ใช้ ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้แคช root/update/direct-npm ซ้ำในการรันซ้ำภายในเครื่อง
- Install Smoke CI ข้ามการอัปเดต global แบบ direct-npm ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ภายในเครื่องโดยไม่มี env นั้นเมื่อต้องการความครอบคลุมของ `npm install -g` โดยตรง
- สโมค CLI ลบ workspace ที่แชร์ของ Agents: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image จาก root Dockerfile โดยค่าเริ่มต้น, seed agents สองตัวที่มี workspace เดียวใน home ของคอนเทนเนอร์ที่แยกไว้, รัน `agents delete --json`, และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้ image install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- สโมคสแนปช็อต Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image source E2E พร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep`, และตรวจสอบว่า role snapshots ของ CDP ครอบคลุม URL ของลิงก์, clickables ที่เลื่อนระดับจาก cursor, refs ของ iframe, และ metadata ของ frame
- รีเกรสชัน reasoning ขั้นต่ำของ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบจำลองผ่าน Gateway, ตรวจสอบว่า `web_search` เพิ่ม `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ provider schema ปฏิเสธและตรวจสอบว่ารายละเอียดดิบปรากฏในบันทึก Gateway
- สะพาน MCP channel (Gateway ที่ seed แล้ว + stdio bridge + สโมค notification-frame ดิบของ Claude): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ bundle OpenClaw (เซิร์ฟเวอร์ stdio MCP จริง + สโมค allow/deny ของโปรไฟล์ OpenClaw ที่ฝังไว้): `pnpm test:docker:agent-bundle-mcp-tools` (สคริปต์: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- การล้าง Cron/subagent MCP (Gateway จริง + การรื้อ stdio MCP child หลังรัน cron แบบแยกและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (สโมค install/update สำหรับ path ภายในเครื่อง, `file:`, npm registry ที่มี dependencies แบบ hoisted, metadata แพ็กเกจ npm ที่ malformed, refs ของ git ที่เคลื่อนที่, ClawHub kitchen-sink, การอัปเดต marketplace, และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub, หรือแทนที่คู่ package/runtime แบบ kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในเครื่องแบบ hermetic
- สโมคการอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- สโมคเมทริกซ์ lifecycle ของ Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วในคอนเทนเนอร์เปล่า, ติดตั้ง npm Plugin, สลับ enable/disable, อัปเกรดและดาวน์เกรดผ่าน npm registry ภายในเครื่อง, ลบโค้ดที่ติดตั้งแล้ว, จากนั้นตรวจสอบว่า uninstall ยังลบสถานะค้างได้พร้อมบันทึกเมตริก RSS/CPU สำหรับแต่ละเฟสของ lifecycle
- สโมค metadata reload ของ config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุมสโมค install/update สำหรับ path ภายในเครื่อง, `file:`, npm registry ที่มี dependencies แบบ hoisted, refs ของ git ที่เคลื่อนที่, fixtures ของ ClawHub, การอัปเดต marketplace, และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ Plugins ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง npm Plugin ที่ติดตามทรัพยากร, enable, disable, upgrade, downgrade, และ uninstall เมื่อโค้ดหายไป

เพื่อ prebuild และใช้ image functional ที่แชร์ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

image override เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง image ที่แชร์แบบ remote สคริปต์จะ pull image นั้นถ้ายังไม่มีในเครื่อง การทดสอบ QR และ Docker ตัวติดตั้งเก็บ Dockerfiles ของตนเองไว้ เพราะตรวจสอบพฤติกรรมแพ็กเกจ/การติดตั้ง ไม่ใช่ runtime ของแอปที่ build แล้วแบบแชร์

รันเนอร์ Docker สำหรับโมเดลสดยัง bind-mount เช็กเอาต์ปัจจุบันแบบอ่านอย่างเดียว และ
จัดวางลงใน workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้อิมเมจรันไทม์
มีขนาดเล็ก แต่ยังคงรัน Vitest กับซอร์ส/คอนฟิกในเครื่องของคุณได้ตรงตามจริง
ขั้นตอนการจัดวางจะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและเอาต์พุตบิลด์ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` เฉพาะแอปหรือ
Gradle เพื่อให้การรัน Docker แบบสดไม่ต้องใช้เวลาหลายนาทีคัดลอก
อาร์ทิแฟกต์เฉพาะเครื่อง
รันเนอร์เหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้โพรบสดของ gateway ไม่เริ่ม
เวิร์กเกอร์ช่องทาง Telegram/Discord/ฯลฯ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้นความครอบคลุมสดของ gateway
จากเลน Docker นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ gateway ของ OpenClaw พร้อมเปิดใช้งานปลายทาง HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันที่ปักหมุดไว้กับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` แล้วส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
กำหนด `OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจ CI ในเส้นทางรีลีสที่ควรหยุด
หลังจากลงชื่อเข้าใช้ Open WebUI และค้นพบโมเดล โดยไม่รอให้โมเดลสด
ตอบ completion
การรันครั้งแรกอาจช้าลงอย่างสังเกตได้ เพราะ Docker อาจต้องดึง
อิมเมจ Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
เลนนี้คาดหวังคีย์โมเดลสดที่ใช้งานได้ ให้จัดเตรียมผ่านสภาพแวดล้อมของโปรเซส
โปรไฟล์ auth ที่จัดวางไว้ หรือ `OPENCLAW_PROFILE_FILE` ที่ระบุอย่างชัดเจน
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้ deterministic และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway ที่ seed แล้ว,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve` จากนั้น
ตรวจสอบการค้นพบบทสนทนาที่ถูก route, การอ่าน transcript, เมทาดาทาของไฟล์แนบ,
พฤติกรรมคิวเหตุการณ์สด, การ route การส่งออก และการแจ้งเตือนช่องทาง +
สิทธิ์แบบ Claude ผ่านสะพาน MCP stdio จริง การตรวจการแจ้งเตือน
ตรวจเฟรม MCP stdio ดิบโดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่
สะพาน emit จริง ไม่ใช่เพียงสิ่งที่ SDK ไคลเอนต์เฉพาะรายบังเอิญแสดงออกมา
`test:docker:agent-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้คีย์โมเดลสด
มันบิลด์อิมเมจ Docker ของ repo, เริ่มเซิร์ฟเวอร์โพรบ MCP stdio จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่านรันไทม์ MCP ของบันเดิล OpenClaw ที่ฝังไว้,
เรียกใช้เครื่องมือ แล้วตรวจสอบว่า `coding` และ `messaging` เก็บ
เครื่องมือ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้คีย์โมเดลสด
มันเริ่ม Gateway ที่ seed แล้วพร้อมเซิร์ฟเวอร์โพรบ MCP stdio จริง, รัน
cron turn แบบแยกเดี่ยวและ child turn แบบ one-shot ของ `sessions_spawn` จากนั้นตรวจสอบว่า
โปรเซสลูก MCP ออกจากระบบหลังการรันแต่ละครั้ง

smoke เธรด ACP แบบภาษาธรรมดาด้วยตนเอง (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจต้องใช้อีกครั้งสำหรับการตรวจสอบความถูกต้องของการ route เธรด ACP ดังนั้นอย่าลบ

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` mount และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี mount สำหรับ auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองโดยใช้ `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง providers ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้อิมเมจ `openclaw:local-live` ที่มีอยู่ซ้ำสำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ใช้โดย smoke ของ Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อ override แท็กอิมเมจ Open WebUI ที่ปักหมุดไว้

## การตรวจ sanity ของเอกสาร

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Regression แบบออฟไลน์ (ปลอดภัยสำหรับ CI)

สิ่งเหล่านี้คือ regression ของ "pipeline จริง" โดยไม่มี providers จริง:

- การเรียกเครื่องมือของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- วิซาร์ด Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Evals ความน่าเชื่อถือของ Agent (skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานคล้ายกับ "agent reliability evals":

- การเรียกเครื่องมือแบบ mock ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- โฟลว์วิซาร์ดแบบ end-to-end ที่ตรวจสอบการเชื่อม session และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ skills ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยง skill ที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาของเวิร์กโฟลว์:** สถานการณ์แบบหลาย turn ที่ assert ลำดับเครื่องมือ, การส่งต่อประวัติ session และขอบเขต sandbox

evals ในอนาคตควรเน้น deterministic ก่อน:

- scenario runner ที่ใช้ mock providers เพื่อ assert การเรียกเครื่องมือ + ลำดับ, การอ่านไฟล์ skill และการเชื่อม session
- ชุดสถานการณ์ขนาดเล็กที่เน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- evals แบบสดที่เป็นทางเลือก (opt-in, gated ด้วย env) เฉพาะหลังจากมีชุดทดสอบที่ปลอดภัยสำหรับ CI แล้ว

## การทดสอบสัญญา (รูปทรง plugin และช่องทาง)

การทดสอบสัญญาจะตรวจสอบว่า plugin และช่องทางที่ลงทะเบียนทุกตัวสอดคล้องกับ
สัญญา interface ของตนเอง การทดสอบจะวนผ่าน plugins ที่ค้นพบทั้งหมดและรันชุด
assertions ด้านรูปทรงและพฤติกรรม เลน unit ของ `pnpm test` เริ่มต้นตั้งใจ
ข้ามไฟล์ smoke และ seam ที่ใช้ร่วมกันเหล่านี้ ให้รันคำสั่ง contract อย่างชัดเจน
เมื่อคุณแตะพื้นผิวช่องทางหรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- สัญญาช่องทางเท่านั้น: `pnpm test:contracts:channels`
- สัญญา provider เท่านั้น: `pnpm test:contracts:plugins`

### สัญญาช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรง plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญาวิซาร์ดการตั้งค่า
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - handlers ของ action ช่องทาง
- **threading** - การจัดการ Thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### สัญญาสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - โพรบสถานะช่องทาง
- **registry** - รูปทรง registry ของ Plugin

### สัญญา provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาโฟลว์ Auth
- **auth-choice** - ตัวเลือก/การเลือก Auth
- **catalog** - API แค็ตตาล็อกโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - รันไทม์ provider
- **shape** - รูปทรง/interface ของ Plugin
- **wizard** - วิซาร์ดการตั้งค่า

### ควรรันเมื่อใด

- หลังเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไขช่องทางหรือ provider plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ plugin

การทดสอบสัญญารันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ปัญหา provider/model ที่พบจากการรันสด:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub provider หรือจับ transformation ของ request-shape ที่ตรงจุด)
- ถ้ามันเป็นแบบ live-only โดยธรรมชาติ (rate limits, auth policies) ให้การทดสอบสดมีขอบเขตแคบและ opt-in ผ่าน env vars
- ควรเล็งไปที่เลเยอร์ที่เล็กที่สุดซึ่งจับบั๊กได้:
  - บั๊กการแปลง/เล่นซ้ำคำขอของ provider → การทดสอบ models โดยตรง
  - บั๊ก pipeline ของ session/history/tool ของ gateway → gateway live smoke หรือการทดสอบ mock gateway ที่ปลอดภัยสำหรับ CI
- Guardrail การ traverse SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` ดึง target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จากเมทาดาทา registry (`listSecretTargetRegistryEntries()`) แล้ว assert ว่า exec ids ที่เป็น traversal segment ถูกปฏิเสธ
  - หากคุณเพิ่ม target family ของ SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในการทดสอบนั้น การทดสอบตั้งใจ fail กับ target ids ที่ยังไม่ถูกจัดประเภท เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบแบบสด](/th/help/testing-live)
- [การทดสอบอัปเดตและ plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
