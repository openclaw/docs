---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบการถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway และเอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบยูนิต/e2e/แบบใช้งานจริง, ตัวรัน Docker และขอบเขตที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-07-19T07:16:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20e0aa22bf16561334f83342abffabb387ed0b41b901773939123ecfbc0ae330
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) รวมถึงตัวรัน
Docker หน้านี้อธิบายขอบเขตของแต่ละชุด คำสั่งที่ต้องเรียกใช้สำหรับ
เวิร์กโฟลว์แต่ละแบบ วิธีที่การทดสอบ live ค้นหาข้อมูลประจำตัว และวิธีเพิ่ม
การทดสอบการถดถอยสำหรับบั๊กของผู้ให้บริการ/โมเดลที่เกิดขึ้นจริง

<Note>
**สแตก QA (qa-lab, qa-channel, เลนการขนส่ง live)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม พื้นผิวคำสั่ง การเขียนสถานการณ์ และโปรไฟล์ Matrix
- [ตารางประเมินระดับความสมบูรณ์](/th/maturity/scorecard) - หลักฐาน QA ของรุ่นที่เผยแพร่สนับสนุนการตัดสินใจด้านความเสถียรและ LTS อย่างไร
- [ช่องทาง QA](/th/channels/qa-channel) - Plugin การขนส่งสังเคราะห์ที่สถานการณ์ซึ่งอิงกับรีโพใช้

หน้านี้ครอบคลุมชุดทดสอบปกติและตัวรัน Docker/Parallels [ตัวรันเฉพาะ QA](#qa-specific-runners) ด้านล่างแสดงการเรียกใช้ `qa` ที่เจาะจงและอ้างกลับไปยังข้อมูลอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ในวันทำงานส่วนใหญ่:

- เกตแบบเต็ม (คาดว่าต้องผ่านก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มในเครื่องที่เร็วกว่าเมื่อใช้เครื่องที่มีทรัพยากรเพียงพอ: `pnpm test:max`
- ลูปเฝ้าดู Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงรองรับเส้นทาง Plugin/ช่องทางด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อวนแก้ความล้มเหลวรายการเดียว ให้เลือกการรันแบบเจาะจงก่อน
- ไซต์ QA ที่ใช้ Docker: `pnpm qa:lab:up`
- เลน QA ที่ใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อแก้ไขการทดสอบหรือต้องการความมั่นใจเพิ่มเติม:

- รายงานความครอบคลุม V8 เพื่อให้ข้อมูล: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

## ไดเรกทอรีชั่วคราวสำหรับการทดสอบ

ใช้ตัวช่วยร่วมใน `test/helpers/temp-dir.ts` สำหรับไดเรกทอรีชั่วคราว
ที่การทดสอบเป็นเจ้าของ เพื่อให้ระบุความเป็นเจ้าของชัดเจนและการล้างข้อมูลยังอยู่ในวงจรชีวิตของการทดสอบ:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("ใช้พื้นที่ทำงานชั่วคราว", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // ใช้พื้นที่ทำงาน
});
```

`useAutoCleanupTempDirTracker(afterEach)` ตั้งใจไม่เปิดเผยเมธอด
ล้างข้อมูลด้วยตนเอง เพราะ Vitest เป็นผู้ควบคุมการล้างข้อมูลหลังการทดสอบแต่ละครั้ง ตัวช่วยระดับล่างรุ่นเก่า
(`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) ยังคงมีอยู่
สำหรับการทดสอบที่ยังไม่ได้ย้าย หลีกเลี่ยงการใช้งานใหม่และหลีกเลี่ยงการเรียก
`fs.mkdtemp*` โดยตรงใหม่ เว้นแต่การทดสอบกำลังตรวจสอบพฤติกรรมดิบของไดเรกทอรีชั่วคราว
อย่างชัดเจน เมื่อจำเป็นต้องใช้ไดเรกทอรีชั่วคราวโดยตรงจริง ๆ ให้เพิ่มคอมเมนต์อนุญาต
ที่ตรวจสอบย้อนหลังได้พร้อมเหตุผล:

```ts
// openclaw-temp-dir: allow ตรวจสอบพฤติกรรมดิบของการล้างข้อมูล fs
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` รายงานการสร้างไดเรกทอรีชั่วคราวโดยตรงใหม่
และการใช้ตัวช่วยร่วมแบบกำหนดเองใหม่ในบรรทัด diff ที่เพิ่มเข้ามา โดยไม่
ขัดขวางรูปแบบการล้างข้อมูลที่มีอยู่ ระบบใช้การจำแนกเส้นทางทดสอบแบบเดียวกับ
`scripts/changed-lanes.mjs` และข้ามการใช้งานตัวช่วยร่วม
เอง `check:changed` เรียกใช้รายงานนี้สำหรับเส้นทางทดสอบที่เปลี่ยนแปลงในฐานะ
สัญญาณ CI แบบเตือนเท่านั้น (คำอธิบายประกอบคำเตือนของ GitHub ไม่ใช่ความล้มเหลว)

## เวิร์กโฟลว์ live และ Docker/Parallels

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลประจำตัวจริง):

- ชุด live (โมเดล + การตรวจสอบเครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพรันไทม์: dispatch `OpenClaw Performance` พร้อม
  `live_openai_candidate=true` สำหรับเทิร์นเอเจนต์ `openai/gpt-5.6-luna` จริง หรือ
  `deep_profile=true` สำหรับอาร์ติแฟกต์ CPU/ฮีป/เทรซของ Kova การรันตามกำหนดการรายวัน
  เผยแพร่รายงานเลนผู้ให้บริการจำลอง โปรไฟล์เชิงลึก และ GPT-5.6 Luna ไปยัง
  `openclaw/clawgrit-reports` จากงานผู้เผยแพร่แยกต่างหากที่ใช้อาร์ติแฟกต์
  การยืนยันตัวตนของผู้เผยแพร่ที่ขาดหายหรือไม่ถูกต้องทำให้การรันตามกำหนดการและ
  `profile=release` ล้มเหลว การ dispatch ด้วยตนเองที่ไม่ใช่รุ่นเผยแพร่จะเก็บอาร์ติแฟกต์ GitHub
  ไว้และถือว่าการเผยแพร่รายงานเป็นเพียงคำแนะนำ รายงานผู้ให้บริการจำลองยัง
  รวมตัวเลขการบูต Gateway ระดับซอร์ส หน่วยความจำ แรงกดดันจาก Plugin ลูป hello ของ
  โมเดลปลอมแบบทำซ้ำ และการเริ่มต้น CLI
- การกวาดทดสอบโมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกจะรันเทิร์นข้อความพร้อมการตรวจสอบขนาดเล็กในลักษณะอ่านไฟล์
    โมเดลที่ข้อมูลเมตาระบุอินพุต `image` จะรันเทิร์นรูปภาพขนาดเล็กด้วย
    ปิดการตรวจสอบเพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกวิเคราะห์ความล้มเหลวของผู้ให้บริการ
  - ความครอบคลุม CI: ทั้ง `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบกำหนดเองจะเรียกเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ใหม่ได้ด้วย
    `include_live_suites: true` ซึ่งรวมงานเมทริกซ์โมเดล live ของ Docker
    ที่แบ่งชาร์ดตามผู้ให้บริการ
  - สำหรับการรัน CI ซ้ำแบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secrets ของผู้ให้บริการใหม่ที่ให้สัญญาณสูงลงใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และผู้เรียกใช้ตามกำหนดการ/รุ่นเผยแพร่
- การทดสอบ smoke ของแชตผูกกับ Codex แบบเนทีฟ: `pnpm test:docker:live-codex-bind`
  - รันเลน live ของ Docker กับเส้นทาง app-server ของ Codex ผูก DM สังเคราะห์ของ Slack
    ด้วย `/codex bind` ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบว่าการตอบกลับแบบข้อความธรรมดาและไฟล์แนบรูปภาพ
    ผ่านการผูก Plugin แบบเนทีฟแทน ACP
- การทดสอบ smoke ของฮาร์เนส app-server ของ Codex: `pnpm test:docker:live-codex-harness`
  - รันเทิร์นเอเจนต์ของ Gateway ผ่านฮาร์เนส app-server ของ Codex
    ที่ Plugin เป็นเจ้าของ ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้น
    ทดสอบการตรวจสอบรูปภาพ cron MCP เอเจนต์ย่อย และ Guardian ปิด
    การตรวจสอบเอเจนต์ย่อยด้วย `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อ
    แยกวิเคราะห์ความล้มเหลวอื่น สำหรับการตรวจสอบเอเจนต์ย่อยแบบเจาะจง ให้ปิด
    การตรวจสอบอื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    การทำงานนี้จะจบหลังการตรวจสอบเอเจนต์ย่อย เว้นแต่
    จะตั้งค่า `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- การทดสอบ smoke ของการติดตั้ง Codex ตามต้องการ: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วใน Docker รันการเริ่มต้นใช้งานด้วย
    คีย์ API ของ OpenAI และตรวจสอบว่า Plugin Codex พร้อมดีเพนเดนซี `@openai/codex`
    ถูกดาวน์โหลดลงในรากโปรเจกต์ npm ที่จัดการไว้ตามต้องการ
- การทดสอบ smoke แพ็กเกจ live ของ npm-plugin Codex: `pnpm test:docker:live-codex-npm-plugin`
  - ติดตั้งแพ็กเกจ OpenClaw ตัวเลือกและ Plugin Codex เวอร์ชันตรงกันลงใน Docker
    จากนั้นใช้คีย์ OpenAI จริงสำหรับการตรวจสอบก่อนเริ่มของ CLI และเทิร์นในเซสชันเดียวกัน
  - เทิร์นต่อเนื่องที่ใช้การคิดระดับกลางและไม่ลองซ้ำต้องส่งความคืบหน้า ทำงานต่อ
    ผ่านการอ่านพื้นที่ทำงานแบบสุ่มและเขียนอาร์ติแฟกต์ให้ตรงตามกำหนด
    แล้วส่งสถานะเสร็จสิ้น เทิร์นปลายทางที่มีเฉพาะความคืบหน้าจะทำให้เลนล้มเหลว
- การทดสอบ smoke แบบ live ของดีเพนเดนซีเครื่องมือ Plugin: `pnpm test:docker:live-plugin-tool`
  - แพ็ก Plugin ฟิกซ์เจอร์ที่มีดีเพนเดนซี `slugify` จริง ติดตั้งผ่าน
    `npm-pack:` ตรวจสอบดีเพนเดนซีใต้รากโปรเจกต์ npm
    ที่จัดการไว้ จากนั้นขอให้โมเดล OpenAI แบบ live เรียกเครื่องมือ Plugin และ
    ส่งคืน slug ที่ซ่อนไว้
- การทดสอบ smoke ของคำสั่งกู้คืน OpenClaw: `pnpm test:live:system-agent-rescue-channel`
  - การตรวจสอบเสริมแบบซ้ำซ้อนที่เลือกเปิดได้สำหรับพื้นผิวคำสั่งกู้คืน
    ของช่องทางข้อความ ทดสอบ `/openclaw status` จัดคิวการเปลี่ยนโมเดล
    แบบถาวร ตอบกลับ `/openclaw yes` และตรวจสอบเส้นทางการเขียน
    การตรวจสอบย้อนหลัง/การกำหนดค่า
- การทดสอบ smoke ของ Docker ในการรัน OpenClaw ครั้งแรก: `pnpm test:docker:system-agent-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ว่างและพิสูจน์ก่อนว่า CLI
    `openclaw setup` ที่แพ็กแล้วจะปฏิเสธการทำงานอย่างปลอดภัยเมื่อไม่มีการอนุมาน จากนั้น
    ทดสอบและเปิดใช้งาน Claude ปลอมผ่านโมดูลเปิดใช้งานที่แพ็กแล้ว
    หลังจากนั้นเท่านั้นคำขอ CLI แบบคลุมเครือที่แพ็กแล้วจึงจะไปถึงตัววางแผนและ
    แปลงเป็นการตั้งค่าแบบมีชนิด ตามด้วยการดำเนินการแบบครั้งเดียวสำหรับโมเดล เอเจนต์
    การกำหนดค่า Discord และ SecretRef ระบบตรวจสอบการกำหนดค่าและรายการตรวจสอบย้อนหลัง นี่คือ
    หลักฐานประกอบสำหรับเกต/การดำเนินการ ไม่ใช่การเริ่มต้นใช้งานแบบโต้ตอบหรือ
    หลักฐานเอเจนต์/เครื่องมือ/การอนุมัติของ OpenClaw เลนเดียวกันนี้เปิดให้ใช้ใน QA Lab ผ่าน
    `pnpm openclaw qa suite --scenario system-agent-ring-zero-setup`
- การทดสอบ smoke ด้านค่าใช้จ่ายของ Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` แบบแยก
  กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และทรานสคริปต์
  ของผู้ช่วยจัดเก็บ `usage.cost` ที่ปรับให้อยู่ในรูปแบบมาตรฐานแล้ว

<Tip>
เมื่อต้องการเพียงกรณีเดียวที่ล้มเหลว ให้จำกัดการทดสอบ live ด้วยตัวแปรสภาพแวดล้อม allowlist ที่อธิบายไว้ด้านล่าง
</Tip>

## ตัวรันเฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อต้องการความสมจริงจาก QA Lab

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ ความสอดคล้องแบบเอเจนต์ซ้อนอยู่ภายใต้
`QA-Lab - All Lanes` และการตรวจสอบรุ่นเผยแพร่ ไม่ใช่เวิร์กโฟลว์ PR แบบแยกเดี่ยว
การตรวจสอบแบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของการตรวจสอบรุ่นเผยแพร่ การตรวจสอบรุ่นเผยแพร่
แบบ stable/ค่าเริ่มต้นจะเก็บการทดสอบ soak แบบ live/Docker อย่างละเอียดไว้เบื้องหลัง `run_release_soak=true`;
โปรไฟล์ `full` บังคับเปิด soak `QA-Lab - All Lanes` รันทุกคืนบน `main` และ
จากการ dispatch ด้วยตนเอง โดยมีเลนความสอดคล้องจำลอง เลน Matrix แบบ live
เลน Telegram แบบ live ที่จัดการโดย Convex และเลน Discord แบบ live ที่จัดการโดย Convex
เป็นงานคู่ขนาน QA ตามกำหนดการและการตรวจสอบรุ่นเผยแพร่รันโปรไฟล์รุ่นเผยแพร่ของ Matrix
ผ่านอะแดปเตอร์ live ที่ใช้ร่วมกัน ค่าเริ่มต้นของ CLI Matrix และอินพุตเวิร์กโฟลว์แบบกำหนดเอง
ยังคงเป็น `all`; การ dispatch `all` แบบกำหนดเองจะแตกแขนงไปยังโปรไฟล์การขนส่ง สื่อ และ
E2EE ขณะที่การ dispatch แบบเจาะจงสามารถเลือก `fast`, `release` หรือ
`transport` ได้ `OpenClaw Release Checks` รันความสอดคล้องพร้อมโปรไฟล์
อะแดปเตอร์ live ของ Matrix ที่นำกลับมาใช้ใหม่ได้และเลน Telegram ก่อนอนุมัติรุ่นเผยแพร่
การตรวจสอบการขนส่งของรุ่นเผยแพร่ใช้ `mock-openai/gpt-5.6-luna` เพื่อให้ทำซ้ำได้อย่างแน่นอนและ
หลีกเลี่ยงการเริ่มต้น Plugin ผู้ให้บริการตามปกติ Gateway การขนส่ง live เหล่านี้
ปิดการค้นหาหน่วยความจำ ส่วนพฤติกรรมหน่วยความจำยังคงครอบคลุมโดยชุดความสอดคล้อง QA

ชาร์ดสื่อ live แบบเต็มสำหรับรุ่นเผยแพร่ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว ชาร์ดโมเดล/แบ็กเอนด์ live ของ Docker ใช้อิมเมจ
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ใช้ร่วมกัน ซึ่งสร้างครั้งเดียวต่อ commit
ที่เลือก จากนั้นดึงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการสร้างใหม่
ภายในทุกชาร์ด

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงกับรีโพโดยตรงบนโฮสต์
  - เขียนอาร์ติแฟกต์ระดับบนสุด `qa-evidence.json`, `qa-suite-summary.json` และ
    `qa-suite-report.md` สำหรับชุดสถานการณ์ที่เลือก รวมถึง
    การเลือกสถานการณ์แบบโฟลว์ผสม, Vitest และ Playwright
  - เมื่อถูกส่งให้ทำงานโดย `pnpm openclaw qa run --qa-profile <profile>` จะฝัง
    สกอร์การ์ดโปรไฟล์อนุกรมวิธานที่เลือกไว้ใน `qa-evidence.json` เดียวกัน
    `smoke-ci` เขียนหลักฐานแบบย่อ (`evidenceMode: "slim"` โดยไม่มี
    `execution` ต่อรายการ) `release` ครอบคลุมส่วนที่คัดสรรสำหรับความพร้อมเผยแพร่ ส่วน `all`
    เลือกหมวดหมู่วุฒิภาวะที่ใช้งานอยู่ทั้งหมด และมุ่งเป้าไปที่การส่งให้เวิร์กโฟลว์ QA Profile
    Evidence ทำงานโดยชัดแจ้ง เมื่อต้องการอาร์ติแฟกต์สกอร์การ์ดฉบับเต็ม
  - โดยค่าเริ่มต้นจะเรียกใช้สถานการณ์ที่เลือกหลายรายการพร้อมกันด้วย
    เวิร์กเกอร์ Gateway ที่แยกจากกัน `qa-channel` มีค่าการทำงานพร้อมกันเริ่มต้นเป็น 4 (จำกัดด้วย
    จำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับ
    จำนวนเวิร์กเกอร์ หรือใช้ `--concurrency 1` สำหรับเลนแบบอนุกรมรุ่นเก่า
  - ออกด้วยสถานะที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` สำหรับ
    อาร์ติแฟกต์โดยไม่ให้รหัสออกระบุความล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการภายในที่รองรับโดย AIMock เพื่อการครอบคลุม
    ฟิกซ์เจอร์เชิงทดลองและม็อกโปรโตคอล โดยไม่แทนที่เลน
    `mock-openai` ที่รับรู้สถานการณ์
- `pnpm openclaw qa coverage --match <query>`
  - ค้นหา ID สถานการณ์ ชื่อ พื้นผิว ID ความครอบคลุม การอ้างอิงเอกสาร การอ้างอิงโค้ด
    plugins และข้อกำหนดของผู้ให้บริการ แล้วพิมพ์เป้าหมายชุดทดสอบ
    ที่ตรงกัน
  - ใช้สิ่งนี้ก่อนเรียกใช้ QA Lab เมื่อทราบพฤติกรรมหรือพาธไฟล์ที่ถูกแก้ไข
    แต่ไม่ทราบสถานการณ์ที่เล็กที่สุด ใช้เพื่อเป็นคำแนะนำเท่านั้น — ยังคงต้องเลือกหลักฐานแบบม็อก
    ไลฟ์ Multipass, Matrix หรือการขนส่งตามพฤติกรรมที่กำลัง
    เปลี่ยนแปลง
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้ด่านทดสอบ plugin OpenAI Kitchen Sink แบบไลฟ์ผ่าน QA Lab
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบรายการพื้นผิว
    SDK ของ plugin โพรบ `/healthz` และ `/readyz` บันทึกหลักฐาน
    CPU/RSS ของ Gateway เรียกใช้รอบ OpenAI แบบไลฟ์ และตรวจสอบการวินิจฉัย
    เชิงปฏิปักษ์ ต้องใช้การยืนยันตัวตน OpenAI แบบไลฟ์ เช่น `OPENAI_API_KEY` ใน
    เซสชัน Testbox ที่มีการเติมข้อมูล ระบบจะโหลดโปรไฟล์การยืนยันตัวตนแบบไลฟ์ของ Testbox
    โดยอัตโนมัติเมื่อมีตัวช่วย `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้เบนช์มาร์กการเริ่มต้น Gateway พร้อมชุดสถานการณ์ม็อกขนาดเล็กของ QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวม
    ไว้ภายใต้ `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้นจะแจ้งเฉพาะการสังเกต CPU ร้อนต่อเนื่อง (`--cpu-core-warn`,
    ค่าเริ่มต้น `0.9`; `--hot-wall-warn-ms`, ค่าเริ่มต้น `30000`) ดังนั้นการพุ่งขึ้นช่วงสั้น ๆ
    ระหว่างเริ่มต้นจะถูกบันทึกเป็นเมตริกโดยไม่ดูเหมือนรีเกรสชัน
    Gateway ที่ตรึง CPU นานหลายนาที
  - เรียกใช้กับอาร์ติแฟกต์ `dist` ที่บิลด์แล้ว ให้บิลด์ก่อนเมื่อเช็กเอาต์
    ยังไม่มีเอาต์พุตรันไทม์ที่ใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ชุด QA เดียวกันภายใน VM Linux แบบ Multipass ที่ใช้แล้วทิ้ง โดยคง
    แฟล็กการเลือกสถานการณ์และผู้ให้บริการ/โมเดลเหมือนกับ `qa suite`
  - การเรียกใช้แบบไลฟ์จะส่งต่ออินพุตการยืนยันตัวตน QA ที่ใช้งานได้สำหรับเกสต์ ได้แก่
    คีย์ผู้ให้บริการที่อิงกับสภาพแวดล้อม พาธการกำหนดค่าผู้ให้บริการแบบไลฟ์ของ QA และ
    `CODEX_HOME` เมื่อมี
  - ไดเรกทอรีเอาต์พุตต้องอยู่ภายใต้รากของรีโพ เพื่อให้เกสต์เขียนกลับ
    ผ่านเวิร์กสเปซที่เมานต์ไว้ได้
  - เขียนรายงานและสรุป QA ตามปกติ พร้อมล็อก Multipass ไว้ภายใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่รองรับโดย Docker สำหรับงาน QA ในรูปแบบผู้ปฏิบัติงาน
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง tarball npm จากเช็กเอาต์ปัจจุบัน ติดตั้งแบบส่วนกลางใน
    Docker เรียกใช้การเริ่มต้นใช้งานด้วยคีย์ API ของ OpenAI แบบไม่โต้ตอบ กำหนดค่า
    Telegram ตามค่าเริ่มต้น ตรวจสอบว่ารันไทม์ plugin ที่อยู่ในแพ็กเกจโหลดได้โดยไม่ต้อง
    ซ่อมแซมการขึ้นต่อกันระหว่างเริ่มต้น เรียกใช้ doctor และเรียกใช้รอบเอเจนต์ภายในหนึ่งรอบ
    กับปลายทาง OpenAI แบบม็อก
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อเรียกใช้เลนการติดตั้ง
    จากแพ็กเกจเดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - เรียกใช้การทดสอบควัน Docker ของแอปที่บิลด์แล้วแบบกำหนดผลได้ สำหรับทรานสคริปต์บริบท
    รันไทม์แบบฝัง ตรวจสอบว่าบริบทรันไทม์ OpenClaw ที่ซ่อนอยู่ยังคงอยู่ในรูป
    ข้อความแบบกำหนดเองที่ไม่แสดงผล แทนที่จะรั่วไหลเข้าสู่รอบที่ผู้ใช้มองเห็น
    จากนั้นเติม JSONL ของเซสชันที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยังกิ่งที่ใช้งานอยู่พร้อมข้อมูลสำรอง
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งแพ็กเกจผู้สมัครของ OpenClaw ใน Docker เรียกใช้การเริ่มต้นใช้งาน
    ของแพ็กเกจที่ติดตั้ง กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้ง แล้วนำ
    เลน QA ของ Telegram แบบไลฟ์กลับมาใช้กับแพ็กเกจที่ติดตั้งนั้นในฐานะ Gateway
    ของระบบภายใต้การทดสอบ
  - ตัวห่อหุ้มเมานต์เฉพาะซอร์สของชุดทดสอบ `qa-lab` จากเช็กเอาต์
    แพ็กเกจที่ติดตั้งเป็นเจ้าของ `dist`, `openclaw/plugin-sdk` และรันไทม์
    plugin ที่รวมมา ดังนั้นเลนนี้จึงไม่ผสม plugins จากเช็กเอาต์ปัจจุบันเข้าไปใน
    แพ็กเกจภายใต้การทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในที่แก้ไขพาธแล้ว แทน
    การติดตั้งจากรีจิสทรี
  - โดยค่าเริ่มต้นจะปล่อยข้อมูลเวลาวัด RTT ซ้ำใน `qa-evidence.json` ด้วย
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` ปรับค่า
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับแต่งการเรียกใช้
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` เลือกสถานการณ์ QA ของ Telegram ที่จะ
    สุ่มตัวอย่าง เป้าหมาย RTT ที่รองรับคือ `channel-canary`
  - ใช้ข้อมูลรับรองสภาพแวดล้อมของ Telegram หรือแหล่งข้อมูลรับรอง Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับระบบอัตโนมัติ CI/การเผยแพร่ ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อมกับ
    `OPENCLAW_QA_CONVEX_SITE_URL` และข้อมูลลับของบทบาท หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และข้อมูลลับของบทบาท Convex ใน
    CI ตัวห่อหุ้ม Docker จะเลือก Convex โดยอัตโนมัติ
  - ตัวห่อหุ้มตรวจสอบสภาพแวดล้อมข้อมูลรับรอง Telegram หรือ Convex บนโฮสต์
    ก่อนงานบิลด์/ติดตั้ง Docker ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` เฉพาะเมื่อ
    ตั้งใจดีบักการตั้งค่าก่อนมีข้อมูลรับรอง
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` เขียนทับ
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น เมื่อเลือกข้อมูลรับรอง
    Convex และไม่ได้ตั้งค่าบทบาท ตัวห่อหุ้มจะใช้ `ci` ใน CI
    และ `maintainer` ภายนอก CI
  - GitHub Actions เปิดเผยเลนนี้เป็นเวิร์กโฟลว์สำหรับผู้ดูแลที่เรียกด้วยตนเอง
    `NPM Telegram Beta E2E` โดยจะไม่ทำงานเมื่อผสาน เวิร์กโฟลว์ใช้
    สภาพแวดล้อม `qa-live-shared` และสัญญาเช่าข้อมูลรับรอง Convex สำหรับ CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบรันข้างเคียง
  กับแพ็กเกจผู้สมัครหนึ่งรายการ โดยรับ Git ref, ข้อกำหนด npm ที่เผยแพร่แล้ว,
  URL ของ tarball แบบ HTTPS พร้อม SHA-256, นโยบาย URL ที่เชื่อถือได้ หรืออาร์ติแฟกต์ tarball
  จากการเรียกใช้อื่น (`source=ref|npm|url|trusted-url|artifact`) อัปโหลด
  `openclaw-current.tgz` ที่ทำให้เป็นมาตรฐานแล้วในชื่อ `package-under-test` จากนั้นเรียกใช้
  ตัวจัดตาราง E2E ของ Docker ที่มีอยู่ด้วยโปรไฟล์เลน `smoke`, `package`, `product`, `full`
  หรือ `custom` ตั้งค่า `telegram_mode=mock-openai` หรือ
  `live-frontier` เพื่อเรียกใช้เวิร์กโฟลว์ QA ของ Telegram กับ
  อาร์ติแฟกต์ `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์เบต้าล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL ของ tarball ที่แน่นอนต้องใช้ไดเจสต์และใช้นโยบายความปลอดภัยของ URL สาธารณะ:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- มิเรอร์ tarball สำหรับองค์กร/ส่วนตัวใช้นโยบายแหล่งที่เชื่อถือได้อย่างชัดแจ้ง:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` อ่าน `.github/package-trusted-sources.json` จาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ และไม่รับข้อมูลรับรอง URL หรือการข้ามเครือข่ายส่วนตัวผ่านอินพุตเวิร์กโฟลว์ หากนโยบายที่ระบุประกาศการยืนยันตัวตนแบบ bearer ให้กำหนดค่าข้อมูลลับ `OPENCLAW_TRUSTED_PACKAGE_TOKEN` แบบคงที่

- หลักฐานอาร์ติแฟกต์ดาวน์โหลดอาร์ติแฟกต์ tarball จากการเรียกใช้ Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม
    Gateway โดยกำหนดค่า OpenAI แล้วเปิดใช้งานช่องทาง/plugins ที่รวมมาผ่าน
    การแก้ไขการกำหนดค่า
  - ตรวจสอบว่าการค้นพบระหว่างตั้งค่าปล่อยให้ plugins ที่ดาวน์โหลดได้แต่ยังไม่ได้กำหนดค่า
    ไม่มีอยู่ การซ่อมแซมด้วย doctor ครั้งแรกหลังการกำหนดค่าติดตั้ง plugin ที่ดาวน์โหลดได้
    แต่ละรายการซึ่งขาดหายไปอย่างชัดแจ้ง และการเริ่มใหม่ครั้งที่สองไม่เรียกใช้
    การซ่อมแซมการขึ้นต่อกันที่ซ่อนอยู่
  - ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบ เปิดใช้งาน Telegram ก่อน
    เรียกใช้ `openclaw update --tag <candidate>` และตรวจสอบว่า
    doctor หลังอัปเดตของผู้สมัครล้างเศษซากการขึ้นต่อกันของ plugin แบบเดิม
    โดยไม่ต้องใช้การซ่อมแซม postinstall ฝั่งชุดทดสอบ
- `pnpm test:parallels:npm-update`
  - เรียกใช้การทดสอบควันการอัปเดตการติดตั้งจากแพ็กเกจแบบเนทีฟข้ามเกสต์ Parallels
    แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน
    จากนั้นเรียกใช้คำสั่ง `openclaw update` ที่ติดตั้งไว้ในเกสต์เดียวกัน และ
    ตรวจสอบเวอร์ชันที่ติดตั้ง สถานะการอัปเดต ความพร้อมของ Gateway และ
    รอบเอเจนต์ภายในหนึ่งรอบ
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux`
    ขณะวนแก้ไขบนเกสต์หนึ่งเครื่อง ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุป
    และสถานะต่อเลน
  - เลน OpenAI ใช้ `openai/gpt-5.6-luna` สำหรับหลักฐานรอบเอเจนต์แบบไลฟ์
    โดยค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เพื่อตรวจสอบโมเดล OpenAI อื่น
  - ครอบการเรียกใช้ภายในที่ใช้เวลานานด้วยการหมดเวลาฝั่งโฮสต์ เพื่อไม่ให้การค้างของ
    การขนส่ง Parallels ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียนล็อกเลนแบบซ้อนไว้ภายใต้
    `/tmp/openclaw-parallels-npm-update.*` ตรวจสอบ `windows-update.log`,
    `macos-update.log` หรือ `linux-update.log` ก่อนสรุปว่าตัวห่อหุ้ม
    ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีใน doctor หลังอัปเดตและ
    งานอัปเดตแพ็กเกจบนเกสต์ที่ยังไม่วอร์ม ซึ่งยังถือว่าปกติหาก
    ล็อกดีบัก npm แบบซ้อนยังเดินหน้าอยู่
  - อย่าเรียกใช้ตัวห่อหุ้มแบบรวมนี้พร้อมกับเลนทดสอบควัน Parallels
    ของ macOS, Windows หรือ Linux แต่ละรายการ เพราะใช้สถานะ VM ร่วมกันและอาจ
    ชนกันระหว่างการคืนค่าสแนปช็อต การให้บริการแพ็กเกจ หรือสถานะ Gateway ของเกสต์
  - หลักฐานหลังอัปเดตเรียกใช้พื้นผิว plugin ที่รวมมาตามปกติ เนื่องจาก
    ฟาซาดความสามารถ เช่น การพูด การสร้างรูปภาพ และการทำความเข้าใจ
    สื่อ โหลดผ่าน API รันไทม์ที่รวมมา แม้ว่ารอบเอเจนต์
    จะตรวจสอบเพียงการตอบกลับข้อความแบบง่ายเท่านั้น

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการทดสอบควันของโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - เรียกใช้เลน QA แบบสดของ Matrix กับโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งที่มี Docker รองรับ ใช้ได้เฉพาะการเช็กเอาต์ซอร์สเท่านั้น การติดตั้งแบบแพ็กเกจไม่มี
    `qa-lab`
  - CLI ฉบับเต็ม แค็ตตาล็อกโปรไฟล์/สถานการณ์ ตัวแปรสภาพแวดล้อม และโครงร่างอาร์ติแฟกต์:
    [เลนทดสอบควันของ Matrix](/th/concepts/qa-e2e-automation#matrix-smoke-lanes)
- `pnpm openclaw qa telegram`
  - เรียกใช้เลน QA แบบสดของ Telegram กับกลุ่มส่วนตัวจริง โดยใช้โทเค็นบอตไดรเวอร์และบอต SUT จากสภาพแวดล้อม
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รหัสกลุ่มต้องเป็นรหัสแชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลประจำตัวแบบพูลที่ใช้ร่วมกัน
    ใช้โหมดสภาพแวดล้อมเป็นค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    เพื่อเลือกใช้สัญญาเช่าแบบพูล
  - ค่าเริ่มต้นครอบคลุมคานารี การควบคุมด้วยการกล่าวถึง การระบุที่อยู่คำสั่ง `/status`
    การตอบกลับแบบบอตถึงบอตที่มีการกล่าวถึง และการตอบกลับคำสั่งแบบเนทีฟหลัก
    ค่าเริ่มต้นของ `mock-openai` ยังครอบคลุมการถดถอยของสายโซ่การตอบกลับแบบกำหนดแน่นอนและ
    การสตรีมข้อความสุดท้ายของ Telegram ใช้ `--list-scenarios`
    สำหรับโพรบเสริม เช่น `session_status`
  - ออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เพื่อสร้าง
    อาร์ติแฟกต์โดยไม่ใช้รหัสออกที่ระบุความล้มเหลว
  - ต้องใช้บอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT
    ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อให้การสังเกตแบบบอตถึงบอตมีเสถียรภาพ ให้เปิดใช้งาน Bot-to-Bot Communication Mode
    ใน `@BotFather` สำหรับบอตทั้งสอง และตรวจสอบว่าบอตไดรเวอร์สามารถสังเกต
    การรับส่งข้อมูลของบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram สรุป และ `qa-evidence.json` ไว้ภายใต้
    `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับรวม RTT ตั้งแต่คำขอส่งของไดรเวอร์
    จนถึงการสังเกตพบการตอบกลับของ SUT

`Mantis Telegram Live` เป็นตัวห่อหลักฐาน PR รอบเลนนี้ โดยเรียกใช้
ref ของผู้สมัครด้วยข้อมูลประจำตัว Telegram ที่เช่าผ่าน Convex แสดงผล
บันเดิลรายงาน/หลักฐาน QA ที่ปกปิดข้อมูลในเบราว์เซอร์เดสก์ท็อป Crabbox บันทึกหลักฐาน MP4
สร้าง GIF ที่ตัดช่วงตามการเคลื่อนไหว อัปโหลดบันเดิลอาร์ติแฟกต์ และ
โพสต์หลักฐานในบรรทัดของ PR ผ่าน Mantis GitHub App เมื่อตั้งค่า `pr_number`
ผู้ดูแลสามารถเริ่มจาก Actions UI ผ่าน `Mantis Scenario`
(`scenario_id: telegram-live`) หรือโดยตรงจากความคิดเห็นใน pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
```

`Mantis Telegram Desktop Proof` เป็นตัวห่อ Telegram Desktop แบบเนทีฟที่ทำงานด้วยเอเจนต์
สำหรับหลักฐานภาพก่อน/หลังของ PR เริ่มจาก Actions UI ด้วย
`instructions` แบบข้อความอิสระ ผ่าน `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) หรือจากความคิดเห็นใน PR:

```text
@openclaw-mantis telegram desktop proof
```

เอเจนต์ Mantis อ่าน PR ตัดสินว่าพฤติกรรมใดที่มองเห็นได้ใน Telegram สามารถพิสูจน์
การเปลี่ยนแปลง เรียกใช้เลนพิสูจน์ Telegram Desktop แบบผู้ใช้จริงของ Crabbox กับ
ref พื้นฐานและ ref ผู้สมัคร ทำซ้ำจนกว่า GIF แบบเนทีฟจะใช้งานได้
เขียนไฟล์กำกับ `motionPreview` แบบจับคู่ และโพสต์ตาราง GIF แบบ 2 คอลัมน์เดียวกัน
ผ่าน Mantis GitHub App เมื่อตั้งค่า `pr_number`

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - เช่าหรือนำเดสก์ท็อป Linux ของ Crabbox กลับมาใช้ ติดตั้ง Telegram
    Desktop แบบเนทีฟ กำหนดค่า OpenClaw ด้วยโทเค็นบอต Telegram SUT ที่เช่ามา
    เริ่ม Gateway และบันทึกหลักฐานภาพหน้าจอ/MP4 จาก
    เดสก์ท็อป VNC ที่มองเห็นได้
  - ใช้ `--credential-source convex` เป็นค่าเริ่มต้น เพื่อให้เวิร์กโฟลว์ต้องใช้เฉพาะ
    ซีเคร็ตของโบรกเกอร์ Convex ใช้ `--credential-source env` กับตัวแปร
    `OPENCLAW_QA_TELEGRAM_*` ชุดเดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังคงต้องใช้การเข้าสู่ระบบ/โปรไฟล์ผู้ใช้ โทเค็นบอต
    กำหนดค่าเฉพาะ OpenClaw เท่านั้น ใช้ `--telegram-profile-archive-env <name>`
    สำหรับไฟล์เก็บถาวรโปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` แล้วเข้าสู่ระบบ
    ด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` และ `telegram-desktop-builder.mp4`
    ไว้ภายใต้ไดเรกทอรีเอาต์พุต

เลนการขนส่งแบบสดใช้สัญญามาตรฐานเดียวกันร่วมกันเพื่อไม่ให้การขนส่งใหม่
เบี่ยงเบน เมทริกซ์ความครอบคลุมของแต่ละเลนอยู่ใน
[ภาพรวม QA - ความครอบคลุมการขนส่งแบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage)
`qa-channel` เป็นชุดทดสอบสังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้งาน `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
สำหรับ QA การขนส่งแบบสด แล็บ QA จะรับสัญญาเช่าแบบเอกสิทธิ์จาก
พูลที่มี Convex รองรับ ส่ง Heartbeat ให้สัญญาเช่านั้นขณะที่เลนกำลังทำงาน และ
ปล่อยสัญญาเช่าเมื่อปิดระบบ ชื่อส่วนนี้มีมาก่อนการรองรับ Discord, Slack และ
WhatsApp โดยสัญญาการเช่าใช้ร่วมกันในทุกประเภท

โครงร่างโปรเจกต์ Convex อ้างอิง: `qa/convex-credential-broker/`

ตัวแปรสภาพแวดล้อมที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- ซีเคร็ตหนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลประจำตัว:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจากสภาพแวดล้อม: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI และเป็น `maintainer` ในกรณีอื่น)

ตัวแปรสภาพแวดล้อมเสริม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (รหัสการติดตามเสริม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL ของ Convex แบบลูปแบ็ก `http://` สำหรับการพัฒนาภายในเครื่องเท่านั้น

ในการทำงานปกติ `OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://`

คำสั่งผู้ดูแลระบบสำหรับผู้ดูแล (เพิ่ม/ลบ/แสดงรายการพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการเรียกใช้แบบสด เพื่อตรวจสอบ URL ไซต์ Convex ซีเคร็ตของโบรกเกอร์
คำนำหน้าเอนด์พอยต์ หมดเวลา HTTP และการเข้าถึงของผู้ดูแล/การแสดงรายการ โดยไม่พิมพ์
ค่าซีเคร็ต ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

สัญญาเอนด์พอยต์เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`)
คำขอตรวจสอบสิทธิ์ด้วยส่วนหัว `Authorization: Bearer <role secret>`
เนื้อหาด้านล่างละเว้นส่วนหัวดังกล่าว:

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
- `POST /admin/add` (ซีเคร็ตสำหรับผู้ดูแลเท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ซีเคร็ตสำหรับผู้ดูแลเท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกันสัญญาเช่าที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ซีเคร็ตสำหรับผู้ดูแลเท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบเพย์โหลดสำหรับประเภท Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธเพย์โหลดที่มีรูปแบบไม่ถูกต้อง

รูปแบบเพย์โหลดสำหรับประเภทผู้ใช้จริงของ Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริงเลขฐานสิบหก SHA-256
- `kind: "telegram-user"` สงวนไว้สำหรับเวิร์กโฟลว์พิสูจน์ Telegram Desktop ของ Mantis เลน QA Lab ทั่วไปต้องไม่รับรายการนี้

เพย์โหลดหลายช่องทางที่โบรกเกอร์ตรวจสอบแล้ว:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถเช่าจากพูลได้เช่นกัน แต่ขณะนี้การตรวจสอบเพย์โหลด Slack
อยู่ในตัวเรียกใช้ QA ของ Slack แทนที่จะอยู่ในโบรกเกอร์ ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางใน QA

สถาปัตยกรรมและชื่อตัวช่วยสถานการณ์สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน
[ภาพรวม QA - การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel)
ข้อกำหนดขั้นต่ำ: ใช้ตัวเรียกใช้การขนส่งบนซีมโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
เพิ่ม `adapterFactory` สำหรับสถานการณ์ที่ใช้ร่วมกัน ประกาศ `qaRunners` ใน
ไฟล์กำกับ Plugin เมานต์เป็น `openclaw qa <runner>` และเขียนสถานการณ์ภายใต้
`qa/scenarios/`

## ชุดทดสอบ (ชุดใดทำงานที่ใด)

ให้นึกถึงชุดทดสอบว่าเป็น "ความสมจริงที่เพิ่มขึ้น" (พร้อมกับความไม่แน่นอน/ต้นทุนที่เพิ่มขึ้น)

### ยูนิต / การผสานรวม (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- การกำหนดค่า: การเรียกใช้แบบไม่ระบุเป้าหมายใช้ชุดชาร์ด `vitest.full-*.config.ts` และอาจ
  ขยายชาร์ดหลายโปรเจกต์เป็นการกำหนดค่าต่อโปรเจกต์เพื่อจัดกำหนดการ
  แบบขนาน
- ไฟล์: รายการคงคลังหลัก/ยูนิตภายใต้ `src/**/*.test.ts`,
  `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบยูนิต UI ทำงานใน
  ชาร์ด `unit-ui` โดยเฉพาะ
- ขอบเขต:
  - การทดสอบยูนิตล้วน
  - การทดสอบการผสานรวมภายในกระบวนการ (การตรวจสอบสิทธิ์ Gateway, การกำหนดเส้นทาง, เครื่องมือ, การแยกวิเคราะห์, การกำหนดค่า)
  - การทดสอบการถดถอยแบบกำหนดแน่นอนสำหรับบั๊กที่ทราบ
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบตัวแก้ไขและตัวโหลดพื้นผิวสาธารณะต้องพิสูจน์พฤติกรรมทางเลือก `api.js` และ
    `runtime-api.js` แบบกว้างด้วยฟิกซ์เจอร์ Plugin ขนาดเล็กที่สร้างขึ้น
    ไม่ใช่ API ซอร์สของ Plugin แบบบันเดิลจริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดทดสอบสัญญา/การผสานรวมที่ Plugin เป็นเจ้าของ

นโยบายการพึ่งพาแบบเนทีฟ:

- การติดตั้งเพื่อทดสอบตามค่าเริ่มต้นจะข้ามบิลด์ opus แบบเนทีฟเสริมของ Discord ฟีเจอร์เสียงของ Discord
  ใช้ `libopus-wasm` ที่บันเดิลมา และ `@discordjs/opus` ยังคงปิดใช้งานใน
  `allowBuilds` เพื่อให้การทดสอบภายในเครื่องและเลน Testbox ไม่คอมไพล์แอดออน
  แบบเนทีฟ
- เปรียบเทียบประสิทธิภาพ opus แบบเนทีฟในรีโพเกณฑ์มาตรฐาน `libopus-wasm` ไม่ใช่
  ในลูปการติดตั้ง/ทดสอบ OpenClaw ตามค่าเริ่มต้น อย่าตั้งค่า `@discordjs/opus` เป็น
  `true` ใน `allowBuilds` ตามค่าเริ่มต้น เพราะจะทำให้ลูปการติดตั้ง/ทดสอบ
  ที่ไม่เกี่ยวข้องคอมไพล์โค้ดเนทีฟ

<AccordionGroup>
  <Accordion title="โปรเจกต์ ชาร์ด และเลนที่จำกัดขอบเขต">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะเรียกใช้การกำหนดค่าชาร์ดย่อย 13 รายการ (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการเนทีฟขนาดใหญ่เพียงกระบวนการเดียวของโปรเจกต์ราก วิธีนี้ช่วยลดค่า RSS สูงสุดบนเครื่องที่มีโหลดสูง และป้องกันไม่ให้งานตอบกลับอัตโนมัติ/Plugin แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ `vitest.config.ts` แบบเนทีฟของราก เนื่องจากลูปเฝ้าดูแบบหลายชาร์ดไม่เหมาะสำหรับการใช้งานจริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจนผ่านเลนแบบจำกัดขอบเขตก่อน เพื่อให้ `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ไม่ต้องเสียต้นทุนการเริ่มต้นโปรเจกต์รากทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนแปลงเป็นเลนแบบจำกัดขอบเขตที่ประหยัดโดยค่าเริ่มต้น ได้แก่ การแก้ไขการทดสอบโดยตรง ไฟล์ `*.test.ts` ที่อยู่ข้างกัน การแมปซอร์สที่ระบุชัดเจน และรายการที่ขึ้นต่อกันตามกราฟการนำเข้าในเครื่อง การแก้ไขการกำหนดค่า/การตั้งค่า/แพ็กเกจจะไม่เรียกใช้การทดสอบในวงกว้าง เว้นแต่จะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` เป็นเกตตรวจสอบภายในเครื่องแบบอัจฉริยะตามปกติสำหรับงานที่มีขอบเขตแคบ โดยจะจำแนก diff เป็นคอร์ การทดสอบคอร์ ส่วนขยาย การทดสอบส่วนขยาย แอป เอกสาร เมทาดาทารีลีส เครื่องมือ Docker แบบสด และเครื่องมืออื่น ๆ จากนั้นเรียกใช้คำสั่งตรวจสอบชนิด lint และคำสั่งป้องกันที่ตรงกัน โดยจะไม่เรียกใช้การทดสอบ Vitest โปรดเรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อใช้เป็นหลักฐานการทดสอบ การปรับเวอร์ชันที่เปลี่ยนเฉพาะเมทาดาทารีลีสจะเรียกใช้การตรวจสอบเวอร์ชัน/การกำหนดค่า/การขึ้นต่อกันระดับรากแบบเจาะจง พร้อมเกตที่ปฏิเสธการเปลี่ยนแปลงแพ็กเกจนอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไขชุดทดสอบ ACP ของ Docker แบบสดจะเรียกใช้การตรวจสอบแบบเจาะจง ได้แก่ ไวยากรณ์เชลล์สำหรับสคริปต์การยืนยันตัวตนของ Docker แบบสด และการทดลองรันตัวจัดกำหนดการ Docker แบบสดโดยไม่ดำเนินการจริง การเปลี่ยนแปลง `package.json` จะรวมอยู่ด้วยเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]` ส่วนการแก้ไขการขึ้นต่อกัน การส่งออก เวอร์ชัน และพื้นผิวแพ็กเกจอื่น ๆ จะยังคงใช้เกตที่ครอบคลุมกว่า
    - การทดสอบหน่วยที่นำเข้าน้อยจากเอเจนต์ คำสั่ง Plugin ตัวช่วยตอบกลับอัตโนมัติ `plugin-sdk` และพื้นที่ยูทิลิตีแบบเพียวที่คล้ายกัน จะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts` ส่วนไฟล์ที่มีสถานะหรือใช้รันไทม์หนักจะยังคงอยู่บนเลนเดิม
    - ไฟล์ซอร์สตัวช่วย `plugin-sdk` และ `commands` ที่เลือกไว้จะแมปการรันในโหมดเปลี่ยนแปลงไปยังการทดสอบข้างเคียงที่ระบุชัดเจนในเลนแบบเบาเหล่านั้นด้วย เพื่อให้การแก้ไขตัวช่วยไม่ต้องเรียกใช้ชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มีบักเก็ตเฉพาะสำหรับตัวช่วยคอร์ระดับบนสุด การทดสอบการผสานรวม `reply.*` ระดับบนสุด และทรีย่อย `src/auto-reply/reply/**` นอกจากนี้ CI ยังแยกทรีย่อยการตอบกลับออกเป็นชาร์ดสำหรับตัวรันเอเจนต์ การจัดส่ง และคำสั่ง/การกำหนดเส้นทางสถานะ เพื่อไม่ให้บักเก็ตที่มีการนำเข้าหนักเพียงบักเก็ตเดียวครอบครองช่วงท้ายของ Node ทั้งหมด
    - CI ปกติสำหรับ PR/main จงใจข้ามการกวาดชุด Plugin ที่รวมมาให้และชาร์ด `agentic-plugins` สำหรับรีลีสเท่านั้น Full Release Validation จะเรียกใช้เวิร์กโฟลว์ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่ใช้ Plugin หนักเหล่านั้นบนรีลีสแคนดิเดต

  </Accordion>

  <Accordion title="ความครอบคลุมของตัวรันแบบฝัง">

    - เมื่อเปลี่ยนอินพุตการค้นหาเครื่องมือข้อความหรือบริบท
      รันไทม์ของ Compaction ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่มการทดสอบถดถอยของตัวช่วยแบบเจาะจงสำหรับขอบเขตการกำหนดเส้นทางและการทำให้เป็นมาตรฐาน
      แบบเพียว
    - ดูแลให้ชุดทดสอบการผสานรวมของตัวรันแบบฝังยังทำงานได้:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` และ
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านี้ตรวจสอบว่า ID แบบจำกัดขอบเขตและพฤติกรรม Compaction ยังคงไหลผ่าน
      พาธ `run.ts` / `compact.ts` จริง การทดสอบเฉพาะตัวช่วย
      ไม่สามารถทดแทนพาธการผสานรวมเหล่านั้นได้อย่างเพียงพอ

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของพูลและการแยกสภาพแวดล้อม Vitest">

    - การกำหนดค่า Vitest พื้นฐานใช้ `threads` เป็นค่าเริ่มต้น
    - การกำหนดค่า Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` คงที่และใช้
      ตัวรันแบบไม่แยกสภาพแวดล้อมกับโปรเจกต์ราก การกำหนดค่า e2e และการกำหนดค่าแบบสด
    - เลน UI ของรากยังคงใช้การตั้งค่าและตัวเพิ่มประสิทธิภาพ `jsdom` แต่ทำงานบน
      ตัวรันแบบไม่แยกสภาพแวดล้อมที่ใช้ร่วมกันด้วย
    - ชาร์ด `pnpm test` แต่ละรายการรับช่วงค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากการกำหนดค่า Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` สำหรับกระบวนการลูก Node ของ Vitest
      โดยค่าเริ่มต้น เพื่อลดการคอมไพล์ซ้ำของ V8 ระหว่างการรันภายในเครื่องขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับ
      พฤติกรรม V8 มาตรฐาน
    - `scripts/run-vitest.mjs` จะยุติการรัน Vitest แบบไม่เฝ้าดูที่ระบุชัดเจน
      หลังจากไม่มีเอาต์พุต stdout หรือ stderr เป็นเวลา 5 นาที ตั้งค่า
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` เพื่อปิดใช้ตัวเฝ้าระวังสำหรับ
      การตรวจสอบที่ตั้งใจให้ไม่มีเอาต์พุต

  </Accordion>

  <Accordion title="การวนซ้ำภายในเครื่องอย่างรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff เรียกใช้เลนสถาปัตยกรรมใดบ้าง
    - ฮุกก่อนคอมมิตจะจัดรูปแบบเท่านั้น โดยจะเพิ่มไฟล์ที่จัดรูปแบบแล้วลง staging อีกครั้ง
      และไม่เรียกใช้ lint การตรวจสอบชนิด หรือการทดสอบ
    - เรียกใช้ `pnpm check:changed` อย่างชัดเจนก่อนส่งมอบหรือพุช เมื่อ
      ต้องการเกตตรวจสอบภายในเครื่องแบบอัจฉริยะ
    - `pnpm test:changed` จะกำหนดเส้นทางผ่านเลนแบบจำกัดขอบเขตที่ประหยัดโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อเอเจนต์
      ตัดสินใจว่าการแก้ไขชุดทดสอบ การกำหนดค่า แพ็กเกจ หรือสัญญา จำเป็นต้องมี
      ความครอบคลุม Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` ยังคงมีพฤติกรรมการกำหนดเส้นทาง
      แบบเดียวกัน เพียงแต่เพิ่มขีดจำกัดจำนวนเวิร์กเกอร์
    - การปรับจำนวนเวิร์กเกอร์ภายในเครื่องอัตโนมัติจงใจตั้งค่าอย่างระมัดระวังและจะลดระดับลง
      เมื่อค่าเฉลี่ยโหลดของโฮสต์สูงอยู่แล้ว เพื่อให้การรัน Vitest หลายรายการพร้อมกัน
      สร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - การกำหนดค่า Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์การกำหนดค่าเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำในโหมดเปลี่ยนแปลงยังคงถูกต้องเมื่อการเชื่อมโยง
      การทดสอบเปลี่ยนแปลง
    - การกำหนดค่ายังคงเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` บน
      โฮสต์ที่รองรับ ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      เพื่อระบุตำแหน่งแคชเดียวอย่างชัดเจนสำหรับการทำโปรไฟล์โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดใช้การรายงานระยะเวลาการนำเข้าของ Vitest พร้อม
      เอาต์พุตแจกแจงรายละเอียดการนำเข้า
    - `pnpm test:perf:imports:changed` จำกัดมุมมองการทำโปรไฟล์แบบเดียวกันให้เหลือ
      ไฟล์ที่เปลี่ยนแปลงนับจาก `origin/main`
    - ข้อมูลเวลาของชาร์ดจะเขียนลงใน `.artifacts/vitest-shard-timings.json`
      การรันการกำหนดค่าทั้งหมดจะใช้พาธการกำหนดค่าเป็นคีย์ ส่วนชาร์ด CI
      ที่ใช้รูปแบบการรวมจะต่อท้ายชื่อชาร์ด เพื่อให้สามารถติดตามชาร์ดที่กรองแล้ว
      แยกจากกันได้
    - เมื่อการทดสอบที่ใช้ทรัพยากรสูงรายการหนึ่งยังคงใช้เวลาส่วนใหญ่กับการนำเข้าตอนเริ่มต้น
      ให้เก็บการขึ้นต่อกันที่หนักไว้หลังจุดเชื่อม `*.runtime.ts` ภายในเครื่องแบบแคบ และ
      จำลองจุดเชื่อมนั้นโดยตรง แทนที่จะนำเข้าตัวช่วยรันไทม์แบบลึก
      เพียงเพื่อส่งผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ผ่านการกำหนดเส้นทางกับพาธโปรเจกต์รากแบบเนทีฟสำหรับ
      diff ที่คอมมิตนั้น และพิมพ์เวลาตามนาฬิกาจริงพร้อมค่า RSS สูงสุดของ macOS
    - `pnpm test:perf:changed:bench -- --worktree` ทำเบนช์มาร์กทรีปัจจุบัน
      ที่ยังมีการเปลี่ยนแปลง โดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และการกำหนดค่า Vitest ของราก
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของเธรดหลักสำหรับ
      โอเวอร์เฮดการเริ่มต้นและการแปลงของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+ฮีปของตัวรันสำหรับ
      ชุดทดสอบหน่วยโดยปิดใช้การทำงานไฟล์แบบขนาน

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- การกำหนดค่า: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` และ `test/vitest/vitest.infra.config.ts` โดยบังคับให้แต่ละรายการใช้เวิร์กเกอร์หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบลูปแบ็กจริงโดยเปิดใช้การวินิจฉัยเป็นค่าเริ่มต้น
  - สร้างภาระงานสังเคราะห์ด้านข้อความ Gateway หน่วยความจำ และเพย์โหลดขนาดใหญ่ ผ่านพาธเหตุการณ์การวินิจฉัย
  - สอบถาม `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วยการคงอยู่ของบันเดิลเสถียรภาพการวินิจฉัย
  - ยืนยันว่าตัวบันทึกยังคงมีขอบเขตจำกัด ตัวอย่าง RSS สังเคราะห์ยังอยู่ต่ำกว่างบประมาณแรงกดดัน และความลึกคิวต่อเซสชันลดกลับเป็นศูนย์
- สิ่งที่คาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เลนขอบเขตแคบสำหรับการติดตามผลการถดถอยด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุดทดสอบ Gateway แบบเต็ม

### E2E (การรวมทั้งรีโพซิทอรี)

- คำสั่ง: `pnpm test:e2e`
- ขอบเขต:
  - เรียกใช้เลน E2E แบบสโมกของ Gateway
  - เรียกใช้เลน E2E ของเบราว์เซอร์ Control UI แบบจำลอง
- สิ่งที่คาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - ต้องติดตั้ง Playwright Chromium

### E2E (สโมกของ Gateway)

- คำสั่ง: `pnpm test:e2e:gateway`
- การกำหนดค่า: `test/vitest/vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ Plugin ที่รวมมาให้ภายใต้ `extensions/`
- ค่าเริ่มต้นของรันไทม์:
  - ใช้ `threads` ของ Vitest ร่วมกับ `isolate: false` ให้สอดคล้องกับส่วนอื่นของรีโพซิทอรี
  - ใช้เวิร์กเกอร์แบบปรับได้ (CI: สูงสุด 2, ภายในเครื่อง: ค่าเริ่มต้น 1)
  - ทำงานในโหมดเงียบโดยค่าเริ่มต้นเพื่อลดโอเวอร์เฮด I/O ของคอนโซล
- การแทนค่าที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวนเวิร์กเกอร์ (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดใช้เอาต์พุตคอนโซลแบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรมแบบครบวงจรของ Gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP การจับคู่ Node และระบบเครือข่ายที่หนักกว่า
- สิ่งที่คาดหวัง:
  - ทำงานใน CI (เมื่อเปิดใช้ในไปป์ไลน์)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนประกอบที่ทำงานร่วมกันมากกว่าการทดสอบหน่วย (จึงอาจช้ากว่า)

### E2E (เบราว์เซอร์ Control UI แบบจำลอง)

- คำสั่ง: `pnpm test:ui:e2e`
- การกำหนดค่า: `test/vitest/vitest.ui-e2e.config.ts`
- ไฟล์: `ui/src/**/*.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Control UI ของ Vite
  - ควบคุมหน้า Chromium จริงผ่าน Playwright
  - แทนที่ WebSocket ของ Gateway ด้วยม็อกในเบราว์เซอร์ที่ให้ผลลัพธ์แน่นอน
- สิ่งที่คาดหวัง:
  - ทำงานใน CI โดยเป็นส่วนหนึ่งของ `pnpm test:e2e`
  - ไม่ต้องใช้ Gateway เอเจนต์ หรือคีย์ของผู้ให้บริการจริง
  - ต้องมีส่วนขึ้นต่อกันของเบราว์เซอร์ (`pnpm --dir ui exec playwright install chromium`)

### E2E: สโมกของแบ็กเอนด์ OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - นำ Gateway ของ OpenShell ที่กำลังทำงานภายในเครื่องกลับมาใช้
  - สร้างแซนด์บ็อกซ์จาก Dockerfile ชั่วคราวภายในเครื่อง
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + การดำเนินการผ่าน SSH
  - ตรวจสอบพฤติกรรมระบบไฟล์ที่ยึดฝั่งรีโมตเป็นมาตรฐานผ่านบริดจ์ fs ของแซนด์บ็อกซ์
- สิ่งที่คาดหวัง:
  - เปิดใช้ตามต้องการเท่านั้น ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` เริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่องพร้อมเดมอน Docker ที่ทำงานได้
  - ต้องมี Gateway ของ OpenShell ที่กำลังทำงานภายในเครื่องและแหล่งการกำหนดค่าของ Gateway นั้น
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกสภาพแวดล้อม จากนั้นทำลายแซนด์บ็อกซ์ทดสอบ
- การแทนค่าที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อเรียกใช้ชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือสคริปต์แรปเปอร์ที่ไม่ใช่ค่าเริ่มต้น
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` เพื่อเปิดเผยการกำหนดค่า Gateway ที่ลงทะเบียนไว้แก่การทดสอบแบบแยกสภาพแวดล้อม
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` เพื่อแทนที่ IP ของ Docker Gateway ที่ฟิกซ์เจอร์นโยบายโฮสต์ใช้

### แบบสด (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- การกำหนดค่า: `test/vitest/vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบแบบสดของ Plugin ที่รวมมาให้ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _ในวันนี้_ ด้วยข้อมูลประจำตัวจริงหรือไม่"
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ ลักษณะเฉพาะของการเรียกใช้เครื่องมือ ปัญหาการตรวจสอบสิทธิ์ และพฤติกรรมเมื่อถึงขีดจำกัดอัตรา
- สิ่งที่คาดหวัง:
  - ตั้งใจออกแบบให้ไม่เสถียรใน CI (เครือข่ายจริง นโยบายจริงของผู้ให้บริการ โควตา และเหตุขัดข้อง)
  - มีค่าใช้จ่าย / ใช้โควตาขีดจำกัดอัตรา
  - ควรเรียกใช้เฉพาะชุดย่อยที่จำกัดขอบเขต แทนการเรียกใช้ "ทุกอย่าง"
- การเรียกใช้แบบสดใช้คีย์ API ที่ส่งออกไว้แล้วและโปรไฟล์การตรวจสอบสิทธิ์ที่จัดเตรียมไว้
- โดยค่าเริ่มต้น การเรียกใช้แบบสดยังคงแยก `HOME` และคัดลอกข้อมูลการกำหนดค่า/การตรวจสอบสิทธิ์ไปยังโฮมทดสอบชั่วคราว เพื่อไม่ให้ฟิกซ์เจอร์ทดสอบหน่วยแก้ไข `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อตั้งใจให้การทดสอบแบบสดใช้ไดเรกทอรีโฮมจริงของคุณ
- `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น โดยยังคงเอาต์พุตความคืบหน้า `[live] ...` และปิดเสียงบันทึกการบูต Gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการให้แสดงบันทึกการเริ่มต้นทั้งหมดอีกครั้ง
- การหมุนเวียนคีย์ API (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบที่คั่นด้วยจุลภาค/อัฒภาค หรือ `*_API_KEY_1`, `*_API_KEY_2` (ตัวอย่างเช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือแทนที่สำหรับการทดสอบแบบสดแต่ละครั้งผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อได้รับการตอบกลับว่าถึงขีดจำกัดอัตรา
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ชุดทดสอบแบบสดส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังคงทำงานอยู่ แม้การดักจับคอนโซลของ Vitest จะไม่มีเอาต์พุต
  - `test/vitest/vitest.live.config.ts` ปิดการดักจับคอนโซลของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/Gateway แสดงผลทันทีระหว่างการเรียกใช้แบบสด
  - ปรับ Heartbeat ของโมเดลโดยตรงด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ Gateway/โพรบด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรเรียกใช้ชุดทดสอบใด

ใช้ตารางการตัดสินใจนี้:

- แก้ไขลอจิก/การทดสอบ: เรียกใช้ `pnpm test` (และ `pnpm test:coverage` หากเปลี่ยนแปลงหลายส่วน)
- แก้ไขเครือข่ายของ Gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- แก้จุดบกพร่องกรณี "บอตของฉันใช้งานไม่ได้" / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: เรียกใช้ `pnpm test:live` โดยจำกัดขอบเขต

## การทดสอบแบบสด (ที่เชื่อมต่อเครือข่าย)

สำหรับเมทริกซ์โมเดลแบบสด การทดสอบเบื้องต้นของแบ็กเอนด์ CLI การทดสอบเบื้องต้นของ ACP ชุดทดสอบ
Codex app-server และการทดสอบแบบสดของผู้ให้บริการสื่อทั้งหมด (Deepgram, BytePlus, ComfyUI,
รูปภาพ เพลง วิดีโอ ชุดทดสอบสื่อ) รวมถึงการจัดการข้อมูลประจำตัวสำหรับการเรียกใช้แบบสด

- โปรดดู [การทดสอบชุดทดสอบแบบสด](/th/help/testing-live) สำหรับรายการตรวจสอบเฉพาะด้านการอัปเดตและ
  การตรวจสอบความถูกต้องของ Plugin โปรดดู
  [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## ตัวเรียกใช้ Docker (การตรวจสอบ "ทำงานบน Linux" ซึ่งเลือกใช้ได้)

ตัวเรียกใช้ Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวเรียกใช้โมเดลแบบสด: `test:docker:live-models` และ `test:docker:live-gateway` เรียกใช้เฉพาะไฟล์แบบสดของคีย์โปรไฟล์ที่ตรงกันภายในอิมเมจ Docker ของรีโพ (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรีการกำหนดค่าในเครื่อง เวิร์กสเปซ และไฟล์สภาพแวดล้อมของโปรไฟล์ที่เลือกใช้ได้ จุดเริ่มต้นภายในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวเรียกใช้ Docker แบบสดยังคงใช้ขีดจำกัดที่เหมาะสมของตนเมื่อจำเป็น:
  `test:docker:live-models` ใช้ชุดสัญญาณสูงที่รองรับและคัดสรรไว้เป็นค่าเริ่มต้น และ
  `test:docker:live-gateway` ใช้ `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` เป็นค่าเริ่มต้น ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS`
  หรือตัวแปรสภาพแวดล้อมของ Gateway เมื่อต้องการขีดจำกัดที่เล็กลงหรือการสแกนที่กว้างขึ้นอย่างชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker แบบสดหนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น tarball npm ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/นำอิมเมจ `scripts/e2e/Dockerfile` สองอิมเมจกลับมาใช้ใหม่ อิมเมจเปล่าเป็นเพียงตัวเรียกใช้ Node/Git สำหรับเลนติดตั้ง/อัปเดต/การขึ้นต่อกันของ Plugin โดยเลนเหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจฟังก์ชันติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันการทำงานของแอปที่สร้างแล้ว นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิกตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตามแผนที่เลือก ตัวรวมใช้ตัวจัดกำหนดการภายในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุมสล็อตกระบวนการ ขณะที่ขีดจำกัดทรัพยากรป้องกันไม่ให้เลนแบบสดที่ใช้ทรัพยากรมาก เลนติดตั้ง npm และเลนหลายบริการเริ่มทำงานพร้อมกันทั้งหมด หากเลนเดียวใช้ทรัพยากรมากกว่าขีดจำกัดที่ใช้งานอยู่ ตัวจัดกำหนดการยังคงเริ่มเลนนั้นได้เมื่อพูลว่าง แล้วปล่อยให้ทำงานเพียงเลนเดียวจนกว่าจะมีความจุอีกครั้ง ค่าเริ่มต้นคือ 10 สล็อต, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (และค่าที่แทนที่ `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` อื่นๆ) เฉพาะเมื่อโฮสต์ Docker มีทรัพยากรสำรองมากขึ้น ตัวเรียกใช้ดำเนินการตรวจสอบเบื้องต้นของ Docker โดยค่าเริ่มต้น ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แสดงสถานะทุก 30 วินาที จัดเก็บเวลาของเลนที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่มเลนที่ใช้เวลานานกว่าก่อนในการเรียกใช้ครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อแสดงรายการเลนแบบถ่วงน้ำหนักโดยไม่สร้างหรือเรียกใช้ Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อแสดงแผน CI สำหรับเลนที่เลือก ความต้องการแพ็กเกจ/อิมเมจ และข้อมูลประจำตัว
- `Package Acceptance` เป็นเกตแพ็กเกจที่ทำงานบน GitHub โดยตรงสำหรับตรวจสอบว่า "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" โดยเลือกแพ็กเกจผู้สมัครหนึ่งรายการจาก `source=npm`, `source=ref`, `source=url`, `source=trusted-url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` แล้วเรียกใช้เลน Docker E2E ที่ใช้ซ้ำได้กับ tarball นั้นโดยตรง แทนที่จะแพ็กอ้างอิงที่เลือกใหม่ โปรไฟล์เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` (รวมถึง `custom` สำหรับรายการเลนที่ระบุอย่างชัดเจน) โปรดดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับสัญญาของแพ็กเกจ/การอัปเดต/Plugin เมทริกซ์ผู้รอดจากการอัปเกรดเวอร์ชันที่เผยแพร่ ค่าเริ่มต้นของรุ่นเผยแพร่ และการคัดแยกความล้มเหลว
- การตรวจสอบการสร้างและการเผยแพร่เรียกใช้ `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown ตัวป้องกันจะไล่กราฟบิลด์แบบสแตติกจาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหากกราฟบูตสแตรปก่อนการส่งต่อนั้นนำเข้าแพ็กเกจภายนอกแบบสแตติก (Commander, UI พรอมต์, undici, การบันทึก และการขึ้นต่อกันอื่นที่ทำให้การเริ่มต้นหนักล้วนถูกนับ) ก่อนส่งต่อคำสั่ง นอกจากนี้ยังจำกัดส่วนบันเดิลสำหรับเรียกใช้ Gateway ไว้ที่ 70 KB และปฏิเสธการนำเข้าแบบสแตติกของพาธ Gateway ที่ทราบว่าไม่ใช้งานช่วงเริ่มต้น (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) จากส่วนนั้น `scripts/release-check.ts` แยกทดสอบเบื้องต้น CLI ที่แพ็กแล้วด้วย `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` และ `models list --provider openai`
- ความเข้ากันได้กับระบบเดิมของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึงจุดตัดดังกล่าว ชุดทดสอบยอมรับเฉพาะช่องว่างของข้อมูลเมตาในแพ็กเกจที่เผยแพร่แล้ว ได้แก่ รายการคลัง QA ส่วนตัวที่ถูกละเว้น ไม่มี `gateway install --wrapper`, ไม่มีไฟล์แพตช์ในฟิกซ์เจอร์ git ที่สร้างจาก tarball, ไม่มี `update.channel` ที่คงอยู่, ตำแหน่งระเบียนการติดตั้ง Plugin แบบเดิม, ไม่มีการคงอยู่ของระเบียนการติดตั้งจากมาร์เก็ตเพลส และการย้ายข้อมูลเมตาการกำหนดค่าระหว่าง `plugins update` สำหรับแพ็กเกจหลัง `2026.4.25` พาธเหล่านั้นถือเป็นความล้มเหลวอย่างเคร่งครัด
- ตัวเรียกใช้ทดสอบเบื้องต้นของคอนเทนเนอร์: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` บูตคอนเทนเนอร์จริงอย่างน้อยหนึ่งรายการและตรวจสอบพาธการผสานรวมระดับสูง
- เลน Docker/Bash E2E ที่ติดตั้ง tarball OpenClaw ที่แพ็กแล้วผ่าน `scripts/lib/openclaw-e2e-instance.sh` จำกัด `npm install` ไว้ที่ `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (ค่าเริ่มต้น `600s`; ตั้งค่า `0` เพื่อปิดใช้ตัวห่อหุ้มสำหรับการแก้จุดบกพร่อง)

ตัวเรียกใช้ Docker สำหรับโมเดลแบบสดยังผูกเมานต์เฉพาะโฮมการตรวจสอบสิทธิ์ CLI ที่จำเป็น
(หรือทั้งหมดที่รองรับเมื่อไม่ได้จำกัดขอบเขตการเรียกใช้) จากนั้นคัดลอกไปยัง
โฮมของคอนเทนเนอร์ก่อนเรียกใช้ เพื่อให้ OAuth ของ CLI ภายนอกรีเฟรชโทเค็นได้
โดยไม่แก้ไขที่เก็บการตรวจสอบสิทธิ์ของโฮสต์:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- การทดสอบเบื้องต้นการผูก ACP: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini โดยค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode อย่างเคร่งครัดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- การทดสอบเบื้องต้นของแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- การทดสอบเบื้องต้นของชุดทดสอบ Codex app-server: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์สำหรับการพัฒนา: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- การทดสอบเบื้องต้นด้านการสังเกตการณ์: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` และ `pnpm qa:observability:smoke` เป็นเลน QA ส่วนตัวสำหรับเช็กเอาต์ซอร์ส โดยตั้งใจไม่รวมอยู่ในเลนเผยแพร่ Docker ของแพ็กเกจ เนื่องจาก tarball npm ไม่รวม QA Lab
- การทดสอบเบื้องต้นแบบสดของ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ดเริ่มต้นใช้งาน (TTY, สร้างโครงทั้งหมด): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- การทดสอบเบื้องต้นของการเริ่มต้นใช้งาน/ช่องทาง/เอเจนต์ด้วย tarball npm: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง tarball OpenClaw ที่แพ็กแล้วแบบส่วนกลางใน Docker, กำหนดค่า OpenAI ผ่านการเริ่มต้นใช้งานแบบอ้างอิงตัวแปรสภาพแวดล้อม รวมถึง Telegram โดยค่าเริ่มต้น เรียกใช้ doctor และเรียกใช้เอเจนต์ OpenAI จำลองหนึ่งรอบ นำ tarball ที่สร้างไว้ล่วงหน้ากลับมาใช้ใหม่ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการสร้างใหม่บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยนช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`

- การทดสอบเบื้องต้นเส้นทางผู้ใช้ของรุ่นเผยแพร่: `pnpm test:docker:release-user-journey` ติดตั้ง tarball ของ OpenClaw ที่แพ็กไว้แบบส่วนกลางในโฮม Docker ที่สะอาด เรียกใช้การเริ่มต้นใช้งาน กำหนดค่าผู้ให้บริการ OpenAI จำลอง เรียกใช้หนึ่งรอบของเอเจนต์ ติดตั้ง/ถอนการติดตั้ง Plugin ภายนอก กำหนดค่า ClickClack กับฟิกซ์เจอร์ภายในเครื่อง ตรวจสอบการรับส่งข้อความขาออก/ขาเข้า รีสตาร์ต Gateway และเรียกใช้ doctor
- การทดสอบเบื้องต้นการเริ่มต้นใช้งานแบบระบุชนิดของรุ่นเผยแพร่: `pnpm test:docker:release-typed-onboarding` ติดตั้ง tarball ที่แพ็กไว้ ดำเนินการ `openclaw onboard` ผ่าน TTY จริง กำหนดค่า OpenAI เป็นผู้ให้บริการแบบ env-ref ตรวจสอบว่าไม่มีการคงอยู่ของคีย์ดิบ และเรียกใช้หนึ่งรอบของเอเจนต์จำลอง
- การทดสอบเบื้องต้นสื่อ/หน่วยความจำของรุ่นเผยแพร่: `pnpm test:docker:release-media-memory` ติดตั้ง tarball ที่แพ็กไว้ ตรวจสอบความเข้าใจรูปภาพจากไฟล์แนบ PNG เอาต์พุตการสร้างรูปภาพที่เข้ากันได้กับ OpenAI การเรียกคืนจากการค้นหาหน่วยความจำ และการคงอยู่ของความสามารถในการเรียกคืนหลังรีสตาร์ต Gateway
- การทดสอบเบื้องต้นเส้นทางผู้ใช้ในการอัปเกรดรุ่นเผยแพร่: โดยค่าเริ่มต้น `pnpm test:docker:release-upgrade-user-journey` ติดตั้งรุ่นฐานที่เผยแพร่ล่าสุดซึ่งเก่ากว่า tarball รุ่นที่จะทดสอบ กำหนดค่าสถานะผู้ให้บริการ/Plugin/ClickClack บนแพ็กเกจที่เผยแพร่ อัปเกรดเป็น tarball รุ่นที่จะทดสอบ แล้วเรียกใช้เส้นทางหลักของเอเจนต์/Plugin/ช่องทางอีกครั้ง หากไม่มีรุ่นฐานที่เผยแพร่ซึ่งเก่ากว่า ระบบจะใช้เวอร์ชันรุ่นที่จะทดสอบซ้ำ แทนที่รุ่นฐานด้วย `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`
- การทดสอบเบื้องต้นมาร์เก็ตเพลส Plugin ของรุ่นเผยแพร่: `pnpm test:docker:release-plugin-marketplace` ติดตั้งจากมาร์เก็ตเพลสฟิกซ์เจอร์ภายในเครื่อง อัปเดต Plugin ที่ติดตั้ง ถอนการติดตั้ง และตรวจสอบว่า CLI ของ Plugin หายไปพร้อมกับการล้างข้อมูลเมตาการติดตั้ง
- การทดสอบเบื้องต้นการติดตั้ง Skills: `pnpm test:docker:skill-install` ติดตั้ง tarball ของ OpenClaw ที่แพ็กไว้แบบส่วนกลางใน Docker ปิดใช้งานการติดตั้งไฟล์เก็บถาวรที่อัปโหลดในการกำหนดค่า แก้ไข slug ของ skill ปัจจุบันที่ใช้งานจริงใน ClawHub จากการค้นหา ติดตั้งด้วย `openclaw skills install` และตรวจสอบ skill ที่ติดตั้งพร้อมข้อมูลเมตาต้นทาง/ล็อกของ `.clawhub`
- การทดสอบเบื้องต้นการสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กไว้แบบส่วนกลางใน Docker สลับจากแพ็กเกจ `stable` เป็น git `dev` ตรวจสอบช่องทางที่คงอยู่และการทำงานของ Plugin หลังอัปเดต จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- การทดสอบเบื้องต้นการคงอยู่หลังอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กไว้ทับฟิกซ์เจอร์ผู้ใช้เก่าแบบมีการแก้ไข ซึ่งมีเอเจนต์ การกำหนดค่าช่องทาง รายการอนุญาต Plugin สถานะการขึ้นต่อกันของ Plugin ที่ล้าสมัย และไฟล์พื้นที่ทำงาน/เซสชันที่มีอยู่ ระบบเรียกใช้การอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางจริง จากนั้นเริ่ม Gateway แบบลูปแบ็กและตรวจสอบการรักษาการกำหนดค่า/สถานะ รวมถึงงบเวลาการเริ่มต้น/สถานะ
- การทดสอบเบื้องต้นการคงอยู่หลังอัปเกรดจากรุ่นที่เผยแพร่: โดยค่าเริ่มต้น `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` เตรียมไฟล์ผู้ใช้เดิมที่สมจริง กำหนดค่ารุ่นฐานนั้นด้วยสูตรคำสั่งที่ฝังไว้ ตรวจสอบความถูกต้องของการกำหนดค่าที่ได้ อัปเดตการติดตั้งจากรุ่นที่เผยแพร่นั้นเป็น tarball รุ่นที่จะทดสอบ เรียกใช้ doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบลูปแบ็กและตรวจสอบเจตนาที่กำหนดค่าไว้ การรักษาสถานะ การเริ่มต้น `/healthz` `/readyz` และงบเวลาสถานะ RPC แทนที่รุ่นฐานหนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` สั่งให้ตัวจัดกำหนดการรวมขยายรุ่นฐานภายในเครื่องที่ระบุแน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยายฟิกซ์เจอร์ที่จำลองลักษณะปัญหาด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุดปัญหาที่รายงานมี `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin ภายนอกของ OpenClaw โดยอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` แก้ไขโทเค็นรุ่นฐานเมตา เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยายเกตแพ็กเกจสำหรับการทดสอบแช่รุ่นเผยแพร่เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- การทดสอบเบื้องต้นบริบทเวลารันของเซสชัน: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของทรานสคริปต์บริบทเวลารันที่ซ่อนอยู่ พร้อมการซ่อมแซมโดย doctor สำหรับแขนงการเขียนพรอมต์ใหม่ที่ซ้ำกันซึ่งได้รับผลกระทบ
- การทดสอบเบื้องต้นการติดตั้ง Bun แบบส่วนกลาง: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็กโครงสร้างปัจจุบัน ติดตั้งด้วย `bun install -g` ในโฮมที่แยกออกมา และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืนผู้ให้บริการรูปภาพที่รวมมาให้แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ข้ามการสร้างบนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่สร้างแล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบเบื้องต้นตัวติดตั้งใน Docker: `bash scripts/test-install-sh-docker.sh` ใช้แคช npm เดียวร่วมกันระหว่างคอนเทนเนอร์ root, update และ direct-npm การทดสอบเบื้องต้นการอัปเดตใช้ npm `latest` เป็นรุ่นฐานเสถียรโดยค่าเริ่มต้น ก่อนอัปเกรดเป็น tarball รุ่นที่จะทดสอบ แทนที่ภายในเครื่องด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` หรือด้วยอินพุต `update_baseline_version` ของเวิร์กโฟลว์ Install Smoke บน GitHub การตรวจสอบตัวติดตั้งแบบไม่ใช่ root จะเก็บแคช npm แยกต่างหาก เพื่อไม่ให้รายการแคชที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งภายในเครื่องของผู้ใช้ ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้แคช root/update/direct-npm ซ้ำในการเรียกใช้ซ้ำภายในเครื่อง
- ไปป์ไลน์ CI ของ Install Smoke ข้ามการอัปเดตแบบส่วนกลางผ่าน direct-npm ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; เรียกใช้สคริปต์ภายในเครื่องโดยไม่มี env นั้นเมื่อต้องการความครอบคลุมของ `npm install -g` โดยตรง
- การทดสอบเบื้องต้น CLI สำหรับการลบพื้นที่ทำงานร่วมของเอเจนต์: โดยค่าเริ่มต้น `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) สร้างอิมเมจจาก Dockerfile ราก เตรียมเอเจนต์สองตัวที่ใช้พื้นที่ทำงานเดียวกันในโฮมคอนเทนเนอร์ที่แยกออกมา เรียกใช้ `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการรักษาพื้นที่ทำงาน ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่ายและวงจรชีวิตโฮสต์ของ Gateway: `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`) รักษาการทดสอบเบื้องต้นการยืนยันตัวตน/สถานะความพร้อมของ WebSocket ผ่าน LAN แบบสองคอนเทนเนอร์ จากนั้นใช้ Admin HTTP ผ่านลูปแบ็กเพื่อพิสูจน์การกั้นระยะเตรียมพร้อม การเข้าถึงโดยคงการควบคุมไว้ การกู้คืนเมื่อดำเนินการต่อ และการหยุด/เริ่มที่เตรียมไว้ภายในคอนเทนเนอร์เดียวกัน การตรวจสอบการรีสตาร์ตต้องเสร็จก่อนสัญญาเช่าเดิมหมดอายุ ตรวจสอบว่าสถานะการระงับเป็นสถานะเฉพาะภายในโปรเซส ขณะที่การกำหนดค่า Gateway ที่คงอยู่และอัตลักษณ์คอนเทนเนอร์ยังคงอยู่ และส่งออก JSON เวลาของแต่ละระยะที่เครื่องอ่านได้
- การทดสอบเบื้องต้นสแนปชอต CDP ของเบราว์เซอร์: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) สร้างอิมเมจ E2E จากซอร์สพร้อมเลเยอร์ Chromium เริ่ม Chromium ด้วย CDP ดิบ เรียกใช้ `browser doctor --deep` และตรวจสอบว่าสแนปชอตบทบาทของ CDP ครอบคลุม URL ของลิงก์ องค์ประกอบที่คลิกได้ซึ่งเลื่อนระดับจากเคอร์เซอร์ การอ้างอิง iframe และข้อมูลเมตาเฟรม
- การถดถอยของการให้เหตุผลขั้นต่ำสำหรับ web_search ใน OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) เรียกใช้เซิร์ฟเวอร์ OpenAI จำลองผ่าน Gateway ตรวจสอบว่า `web_search` เพิ่ม `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้สคีมาผู้ให้บริการปฏิเสธ และตรวจสอบว่ารายละเอียดดิบปรากฏในบันทึก Gateway
- บริดจ์ช่องทาง MCP (Gateway ที่เตรียมข้อมูลไว้ + บริดจ์ stdio + การทดสอบเบื้องต้นเฟรมการแจ้งเตือนดิบของ Claude): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ในบันเดิล OpenClaw (เซิร์ฟเวอร์ MCP ผ่าน stdio จริง + การทดสอบเบื้องต้นการอนุญาต/ปฏิเสธของโปรไฟล์ OpenClaw ที่ฝังไว้): `pnpm test:docker:agent-bundle-mcp-tools` (สคริปต์: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- การล้าง MCP ของ Cron/เอเจนต์ย่อย (Gateway จริง + การยุติโปรเซสลูก MCP ผ่าน stdio หลังการเรียกใช้ Cron แบบแยกและเอเจนต์ย่อยแบบครั้งเดียว): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (การทดสอบเบื้องต้นการติดตั้ง/อัปเดตสำหรับพาธภายในเครื่อง, `file:`, รีจิสทรี npm ที่มีการยกการขึ้นต่อกันขึ้นระดับบน, ข้อมูลเมตาแพ็กเกจ npm ที่ผิดรูปแบบ, การอ้างอิง git ที่เคลื่อนที่, ClawHub แบบครอบคลุมทุกกรณี, การอัปเดตจากมาร์เก็ตเพลส และการเปิดใช้งาน/ตรวจสอบบันเดิล Claude): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่แพ็กเกจ/เวลารันแบบครอบคลุมทุกกรณีเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ฟิกซ์เจอร์ ClawHub ภายในเครื่องที่แยกจากภายนอก
- การทดสอบเบื้องต้นเมื่อการอัปเดต Plugin ไม่มีการเปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบเบื้องต้นเมทริกซ์วงจรชีวิต Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง tarball ของ OpenClaw ที่แพ็กไว้ในคอนเทนเนอร์เปล่า ติดตั้ง Plugin npm สลับเปิด/ปิดใช้งาน อัปเกรดและดาวน์เกรดผ่านรีจิสทรี npm ภายในเครื่อง ลบโค้ดที่ติดตั้ง จากนั้นตรวจสอบว่าการถอนการติดตั้งยังคงลบสถานะที่ล้าสมัย พร้อมบันทึกเมตริก RSS/CPU สำหรับแต่ละระยะของวงจรชีวิต
- การทดสอบเบื้องต้นข้อมูลเมตาการโหลดการกำหนดค่าใหม่: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` ครอบคลุมการทดสอบเบื้องต้นการติดตั้ง/อัปเดตสำหรับพาธภายในเครื่อง, `file:`, รีจิสทรี npm ที่มีการยกการขึ้นต่อกันขึ้นระดับบน, การอ้างอิง git ที่เคลื่อนที่, ฟิกซ์เจอร์ ClawHub, การอัปเดตจากมาร์เก็ตเพลส และการเปิดใช้งาน/ตรวจสอบบันเดิล Claude `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตแบบไม่มีการเปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้ง `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง การเปิดใช้งาน การปิดใช้งาน การอัปเกรด การดาวน์เกรด และการถอนการติดตั้งเมื่อโค้ดหายไปของ Plugin npm โดยติดตามทรัพยากร

หากต้องการสร้างล่วงหน้าและใช้ร่วมอิมเมจฟังก์ชันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

ค่าที่แทนที่อิมเมจเฉพาะชุดทดสอบ เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีลำดับความสำคัญเมื่อกำหนดไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจที่ใช้ร่วมกันจากระยะไกล สคริปต์จะดึงอิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ QR และตัวติดตั้งใน Docker ยังคงใช้ Dockerfile ของตนเอง เนื่องจากตรวจสอบพฤติกรรมของแพ็กเกจ/การติดตั้ง ไม่ใช่เวลารันแอปที่สร้างไว้ซึ่งใช้ร่วมกัน

ตัวเรียกใช้ Docker สำหรับโมเดลจริงยังเมานต์ checkout ปัจจุบันแบบอ่านอย่างเดียว
และจัดเตรียมไว้ในไดเรกทอรีทำงานชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ช่วยให้อิมเมจ
เวลารันมีขนาดเล็ก ขณะที่ยังเรียกใช้ Vitest กับซอร์ส/การกำหนดค่าภายในเครื่อง
ของคุณอย่างตรงกัน ขั้นตอนการจัดเตรียมจะข้ามแคชขนาดใหญ่ที่มีเฉพาะในเครื่องและ
เอาต์พุตการสร้างแอป เช่น `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และ
`.build` ภายในแอป หรือไดเรกทอรีเอาต์พุต Gradle เพื่อไม่ให้การเรียกใช้ Docker แบบสด
ใช้เวลาหลายนาทีคัดลอกอาร์ติแฟกต์เฉพาะเครื่อง นอกจากนี้ยังตั้งค่า
`OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้โพรบ Gateway แบบสดเริ่มตัวทำงานของช่องทาง
Telegram/Discord/ฯลฯ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงเรียกใช้ `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อต้องการจำกัดหรือยกเว้นความครอบคลุมแบบสดของ Gateway
จากเลน Docker นั้น

`test:docker:openwebui` เป็นการทดสอบเบื้องต้นด้านความเข้ากันได้ระดับสูงกว่า โดยเริ่ม
คอนเทนเนอร์ Gateway ของ OpenClaw ที่เปิดใช้งานเอนด์พอยต์ HTTP ที่เข้ากันได้กับ OpenAI
เริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันที่ตรึงไว้ให้เชื่อมต่อกับ Gateway นั้น ลงชื่อเข้าใช้ผ่าน
Open WebUI ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI ตั้งค่า
`OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจสอบไปป์ไลน์ CI ตามเส้นทางรุ่นเผยแพร่ที่ควรหยุด
หลังลงชื่อเข้าใช้ Open WebUI และค้นพบโมเดล โดยไม่รอการตอบกลับจากโมเดลจริง
การเรียกใช้ครั้งแรกอาจช้าลงอย่างเห็นได้ชัด เนื่องจาก Docker อาจต้อง
ดึงอิมเมจ Open WebUI และ Open WebUI อาจต้องดำเนินการตั้งค่า
เมื่อเริ่มต้นแบบเย็นของตนเองให้เสร็จ เลนนี้ต้องใช้คีย์โมเดลจริงที่ใช้งานได้ ซึ่งให้ผ่าน
สภาพแวดล้อมของโปรเซส โปรไฟล์การยืนยันตัวตนที่จัดเตรียมไว้ หรือ
`OPENCLAW_PROFILE_FILE` ที่ระบุอย่างชัดเจน การเรียกใช้สำเร็จจะแสดงเพย์โหลด JSON ขนาดเล็ก เช่น
`{ "ok": true, "model": "openclaw/default", ... }`

`test:docker:mcp-channels` ถูกออกแบบให้กำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง ระบบบูตคอนเทนเนอร์ Gateway
ที่เตรียมข้อมูลไว้ เริ่มคอนเทนเนอร์ที่สองซึ่งสร้าง `openclaw mcp serve` จากนั้น
ตรวจสอบการค้นหาการสนทนาที่มีการกำหนดเส้นทาง การอ่านทรานสคริปต์ ข้อมูลเมตา
ไฟล์แนบ พฤติกรรมคิวเหตุการณ์สด การกำหนดเส้นทางการส่งขาออก และการแจ้งเตือน
ช่องทาง + สิทธิ์แบบ Claude ผ่านบริดจ์ MCP stdio จริง การตรวจสอบ
การแจ้งเตือนจะตรวจสอบเฟรม MCP stdio ดิบโดยตรง เพื่อให้การทดสอบเบื้องต้น
ตรวจสอบสิ่งที่บริดจ์ส่งออกจริง ไม่ใช่เพียงสิ่งที่ SDK ของไคลเอนต์เฉพาะราย
บังเอิญเปิดเผย

`test:docker:agent-bundle-mcp-tools` ทำงานแบบกำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้
คีย์โมเดลจริง โดยจะสร้างอิมเมจ Docker ของ repo เริ่มเซิร์ฟเวอร์โพรบ MCP แบบ stdio จริง
ภายในคอนเทนเนอร์ ทำให้เซิร์ฟเวอร์นั้นพร้อมใช้งานผ่านรันไทม์ MCP ของบันเดิล OpenClaw
ที่ฝังอยู่ เรียกใช้เครื่องมือ แล้วตรวจสอบว่า
`coding` และ `messaging` ยังคงใช้เครื่องมือ `bundle-mcp` ขณะที่ `minimal` และ
`tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก

`test:docker:cron-mcp-cleanup` ทำงานแบบกำหนดผลลัพธ์ได้แน่นอนและไม่ต้องใช้คีย์
โมเดลจริง โดยจะเริ่ม Gateway ที่มีข้อมูลตั้งต้นพร้อมเซิร์ฟเวอร์โพรบ MCP แบบ stdio จริง
เรียกใช้รอบ Cron แบบแยกสภาพแวดล้อมและรอบลูกแบบครั้งเดียว `sessions_spawn` จากนั้น
ตรวจสอบว่าโปรเซสลูก MCP สิ้นสุดหลังการทำงานแต่ละครั้ง

การทดสอบ smoke ของเธรด ACP ด้วยภาษาธรรมดาแบบดำเนินการด้วยตนเอง (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์การทดสอบการถดถอย/ดีบัก อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบความถูกต้องของการกำหนดเส้นทางเธรด ACP ดังนั้นอย่าลบสคริปต์นี้

ตัวแปรสภาพแวดล้อมที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปยัง `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปยัง `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` เมานต์และโหลดเป็นซอร์สก่อนเรียกใช้การทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะตัวแปรสภาพแวดล้อมที่โหลดเป็นซอร์สจาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรีการกำหนดค่า/พื้นที่ทำงานชั่วคราวและไม่เมานต์การยืนยันตัวตนของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools` เว้นแต่การทำงานนั้นใช้ไดเรกทอรี bind ของ CI/ระบบจัดการอยู่แล้ว) เมานต์ไปยัง `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์การยืนยันตัวตนของ CLI ภายนอกภายใต้ `$HOME` จะถูกเมานต์แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น (ใช้เมื่อการทำงานไม่ได้จำกัดเฉพาะผู้ให้บริการที่ระบุ): `.factory`, `.gemini`, `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การทำงานที่จำกัดผู้ให้บริการจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - แทนที่ด้วยตนเองโดยใช้ `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการที่คั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการทำงาน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อนำอิมเมจ `openclaw:local-live` ที่มีอยู่กลับมาใช้กับการทำงานซ้ำที่ไม่ต้องสร้างใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่าข้อมูลประจำตัวมาจากที่จัดเก็บโปรไฟล์ (ไม่ใช่ตัวแปรสภาพแวดล้อม)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ Gateway เปิดให้ใช้สำหรับการทดสอบ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อแทนที่พรอมต์ตรวจสอบ nonce ที่ใช้โดยการทดสอบ smoke ของ Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อแทนที่แท็กอิมเมจ Open WebUI ที่ตรึงไว้

## การตรวจสอบเบื้องต้นของเอกสาร

เรียกใช้การตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
เรียกใช้การตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อต้องตรวจสอบหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## การทดสอบการถดถอยแบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็นการทดสอบการถดถอยของ "ไปป์ไลน์จริง" โดยไม่ใช้ผู้ให้บริการจริง:

- การเรียกใช้เครื่องมือผ่าน Gateway (OpenAI จำลอง, Gateway จริง + ลูปเอเจนต์): `src/gateway/gateway.test.ts` (กรณี: "เรียกใช้การเรียกเครื่องมือ OpenAI จำลองแบบต้นทางถึงปลายทางผ่านลูปเอเจนต์ของ Gateway")
- วิซาร์ด Gateway (WS `wizard.start`/`wizard.next`, เขียนการกำหนดค่า + บังคับใช้การยืนยันตัวตน): `src/gateway/gateway.test.ts` (กรณี: "เรียกใช้วิซาร์ดผ่าน ws และเขียนการกำหนดค่าโทเค็นการยืนยันตัวตน")

## การประเมินความน่าเชื่อถือของเอเจนต์ (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานเสมือน "การประเมินความน่าเชื่อถือของเอเจนต์":

- การเรียกใช้เครื่องมือจำลองผ่าน Gateway จริง + ลูปเอเจนต์ (`src/gateway/gateway.test.ts`)
- โฟลว์วิซาร์ดแบบต้นทางถึงปลายทางที่ตรวจสอบการเชื่อมโยงเซสชันและผลของการกำหนดค่า (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมี Skills แสดงอยู่ในพรอมต์ เอเจนต์เลือก Skills ที่ถูกต้อง (หรือหลีกเลี่ยง Skills ที่ไม่เกี่ยวข้อง) หรือไม่
- **การปฏิบัติตามข้อกำหนด:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/อาร์กิวเมนต์ที่กำหนดหรือไม่
- **สัญญาของเวิร์กโฟลว์:** สถานการณ์หลายรอบที่ยืนยันลำดับเครื่องมือ การส่งต่อประวัติเซสชัน และขอบเขตแซนด์บ็อกซ์

การประเมินในอนาคตควรเริ่มจากการกำหนดผลลัพธ์ได้แน่นอน:

- ตัวเรียกใช้สถานการณ์ที่ใช้ผู้ให้บริการจำลองเพื่อยืนยันการเรียกใช้เครื่องมือ + ลำดับ การอ่านไฟล์ Skills และการเชื่อมโยงเซสชัน
- ชุดสถานการณ์ขนาดเล็กที่เน้น Skills (ใช้กับหลีกเลี่ยง, การควบคุมสิทธิ์, การแทรกพรอมต์)
- การประเมินแบบสดที่เป็นทางเลือก (เลือกเข้าร่วม, ควบคุมด้วยตัวแปรสภาพแวดล้อม) หลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## การทดสอบสัญญา (รูปแบบ Plugin และช่องทาง)

การทดสอบสัญญาตรวจสอบว่า Plugin และช่องทางทุกตัวที่ลงทะเบียนเป็นไปตาม
สัญญาอินเทอร์เฟซของตน โดยวนซ้ำ Plugin ทั้งหมดที่ค้นพบและเรียกใช้
ชุดการยืนยันรูปแบบและพฤติกรรม เลนยูนิต `pnpm test` เริ่มต้น
จงใจข้ามไฟล์รอยต่อร่วมและไฟล์ smoke เหล่านี้ ให้เรียกใช้คำสั่งสัญญา
อย่างชัดเจนเมื่อแก้ไขพื้นผิวช่องทางหรือผู้ให้บริการที่ใช้ร่วมกัน

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- สัญญาช่องทางเท่านั้น: `pnpm test:contracts:channels`
- สัญญาผู้ให้บริการเท่านั้น: `pnpm test:contracts:plugins`

### สัญญาช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts` หมวดหมู่
ระดับบนสุดในปัจจุบัน:

- **channel-catalog** - ข้อมูลเมตาของรายการแค็ตตาล็อกช่องทางแบบบันเดิล/รีจิสทรี
- **plugin** (อิงรีจิสทรี, แบ่งชาร์ด) - รูปแบบพื้นฐานของการลงทะเบียน Plugin
- **surfaces-only** (อิงรีจิสทรี, แบ่งชาร์ด) - การตรวจสอบรูปแบบแยกตามพื้นผิวสำหรับ `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` และ `gateway`
- **session-binding** (อิงรีจิสทรี) - พฤติกรรมการเชื่อมโยงเซสชัน
- **outbound-payload** - โครงสร้างและการปรับข้อมูลเพย์โหลดข้อความให้เป็นมาตรฐาน
- **group-policy** (สำรอง) - การบังคับใช้นโยบายกลุ่มเริ่มต้นแยกตามช่องทาง
- **threading** (อิงรีจิสทรี, แบ่งชาร์ด) - การจัดการรหัสเธรด
- **directory** (อิงรีจิสทรี, แบ่งชาร์ด) - API ไดเรกทอรี/รายชื่อสมาชิก
- **registry** และ **plugins-core.\*** - รีจิสทรี Plugin ช่องทาง ตัวโหลด และรายละเอียดภายในของการอนุญาตให้เขียนการกำหนดค่า

ตัวช่วยของชุดทดสอบสำหรับการจับการส่งต่อขาเข้าและเพย์โหลดขาออกที่ใช้โดย
ชุดเหล่านี้เปิดให้ใช้ภายในผ่าน `src/plugin-sdk/channel-contract-testing.ts`
(ไม่รวมใน npm และไม่ใช่เส้นทางย่อย SDK สาธารณะ) ไม่มีไฟล์
`inbound.contract.test.ts` แบบแยกเดี่ยวในไดเรกทอรีนี้

### สัญญาผู้ให้บริการ

อยู่ใน `src/plugins/contracts/*.contract.test.ts` หมวดหมู่ปัจจุบัน
ประกอบด้วย:

- **shape** - รูปแบบไฟล์กำกับ Plugin, API และการส่งออกของรันไทม์
- **plugin-registration** (+ ขนาน) - กรณีการลงทะเบียนไฟล์กำกับ
- **package-manifest** - ข้อกำหนดของไฟล์กำกับแพ็กเกจ
- **loader** - พฤติกรรมการตั้งค่า/ยกเลิกการตั้งค่าตัวโหลด Plugin
- **registry** - เนื้อหาและการค้นหาของรีจิสทรีสัญญา Plugin
- **providers** - พฤติกรรมผู้ให้บริการที่ใช้ร่วมกันในผู้ให้บริการแบบบันเดิล รวมถึงผู้ให้บริการค้นหาเว็บ
- **auth-choice** - ข้อมูลเมตาของตัวเลือกการยืนยันตัวตนและพฤติกรรมการตั้งค่า
- **provider-catalog-deprecation** - ข้อมูลเมตาของแค็ตตาล็อกผู้ให้บริการที่เลิกใช้แล้ว
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - สัญญาวิซาร์ดการตั้งค่าผู้ให้บริการ
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - สัญญาผู้ให้บริการเฉพาะความสามารถ
- **session-actions**, **session-attachments**, **session-entry-projection** - สัญญาสถานะเซสชันที่ Plugin เป็นเจ้าของ
- **scheduled-turns** - ข้อมูลเมตาของรอบตามกำหนดเวลาของ Plugin และขอบเขตเวลา
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - วงจรชีวิตโฮสต์/รันไทม์ของ Plugin และสัญญาขอบเขตการนำเข้า
- **extension-runtime-dependencies** - ตำแหน่งการวางการขึ้นต่อกันของรันไทม์สำหรับส่วนขยาย

### ควรเรียกใช้เมื่อใด

- หลังเปลี่ยนการส่งออกหรือเส้นทางย่อยของ plugin-sdk
- หลังเพิ่มหรือแก้ไข Plugin ช่องทางหรือผู้ให้บริการ
- หลังปรับโครงสร้างการลงทะเบียนหรือการค้นพบ Plugin

การทดสอบสัญญาทำงานใน CI และไม่ต้องใช้คีย์ API จริง

## การเพิ่มการทดสอบการถดถอย (คำแนะนำ)

เมื่อแก้ไขปัญหาผู้ให้บริการ/โมเดลที่พบในการทำงานจริง:

- เพิ่มการทดสอบการถดถอยที่ปลอดภัยสำหรับ CI หากทำได้ (ผู้ให้บริการจำลอง/สตับ หรือจับการแปลงรูปแบบคำขอที่แน่นอน)
- หากโดยธรรมชาติแล้วทดสอบได้เฉพาะแบบสด (ขีดจำกัดอัตรา, นโยบายการยืนยันตัวตน) ให้จำกัดขอบเขตการทดสอบแบบสดและเลือกเข้าร่วมผ่านตัวแปรสภาพแวดล้อม
- ควรมุ่งเป้าไปยังเลเยอร์ที่เล็กที่สุดซึ่งตรวจจับบั๊กได้:
  - บั๊กการแปลง/เล่นซ้ำคำขอของผู้ให้บริการ -> การทดสอบโมเดลโดยตรง
  - บั๊กในไปป์ไลน์เซสชัน/ประวัติ/เครื่องมือของ Gateway -> การทดสอบ smoke ของ Gateway แบบสดหรือการทดสอบจำลอง Gateway ที่ปลอดภัยสำหรับ CI
- แนวป้องกันการท่องผ่าน SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` สร้างเป้าหมายตัวอย่างหนึ่งรายการต่อคลาส SecretRef จากข้อมูลเมตาของรีจิสทรี (`listSecretTargetRegistryEntries()`) จากนั้นยืนยันว่ารหัสการดำเนินการที่มีเซกเมนต์การท่องผ่านถูกปฏิเสธ
  - หากเพิ่มตระกูลเป้าหมาย SecretRef ใหม่ `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในการทดสอบนั้น การทดสอบจงใจล้มเหลวเมื่อพบรหัสเป้าหมายที่ยังไม่ได้จัดประเภท เพื่อไม่ให้ข้ามคลาสใหม่โดยไม่มีการแจ้งเตือน

## ที่เกี่ยวข้อง

- [การทดสอบแบบสด](/th/help/testing-live)
- [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)
- [CI](/th/ci)
