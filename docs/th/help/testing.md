---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบป้องกันข้อผิดพลาดซ้ำสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การแก้ไขข้อบกพร่องของลักษณะการทำงานของ Gateway และเอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดการทดสอบระดับหน่วย/e2e/แบบใช้งานจริง ตัวรัน Docker และขอบเขตที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-07-12T16:14:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (ยูนิต/การผสานรวม, e2e, ไลฟ์) รวมถึงตัวรัน Docker
หน้านี้อธิบายขอบเขตของแต่ละชุด คำสั่งที่ต้องรันสำหรับเวิร์กโฟลว์แต่ละแบบ
วิธีที่การทดสอบไลฟ์ค้นหาข้อมูลรับรอง และวิธีเพิ่มการทดสอบการถดถอย
สำหรับข้อบกพร่องของผู้ให้บริการ/โมเดลที่พบในการใช้งานจริง

<Note>
**สแตก QA (qa-lab, qa-channel, เลนการขนส่งไลฟ์)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม ชุดคำสั่ง และการเขียนสถานการณ์ทดสอบ
- [QA แบบเมทริกซ์](/th/concepts/qa-matrix) - เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ตารางคะแนนระดับความพร้อม](/th/maturity/scorecard) - หลักฐาน QA ของรุ่นช่วยสนับสนุนการตัดสินใจด้านเสถียรภาพและ LTS อย่างไร
- [ช่องทาง QA](/th/channels/qa-channel) - Plugin การขนส่งจำลองที่สถานการณ์ทดสอบซึ่งอิงกับรีโพซิทอรีใช้

หน้านี้ครอบคลุมชุดทดสอบปกติและตัวรัน Docker/Parallels ส่วน [ตัวรันเฉพาะสำหรับ QA](#qa-specific-runners) ด้านล่างแสดงคำสั่ง `qa` ที่ใช้จริงและอ้างกลับไปยังเอกสารด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

สำหรับการใช้งานส่วนใหญ่ในแต่ละวัน:

- เกตเต็มรูปแบบ (ควรรันก่อนพุช): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- รันชุดทดสอบทั้งหมดภายในเครื่องได้เร็วขึ้นบนเครื่องที่มีทรัพยากรเพียงพอ: `pnpm test:max`
- ลูปเฝ้าดู Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงรองรับพาธของ Plugin/ช่องทางด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อตรวจแก้ความล้มเหลวรายการเดียว ให้เริ่มจากการรันเฉพาะส่วนที่เกี่ยวข้องก่อน
- ไซต์ QA ที่ใช้ Docker: `pnpm qa:lab:up`
- เลน QA ที่ใช้ VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแก้ไขการทดสอบหรือต้องการความมั่นใจเพิ่มขึ้น:

- รายงานความครอบคลุม V8 เพื่อให้ข้อมูล: `pnpm test:coverage`
- ชุดทดสอบ E2E: `pnpm test:e2e`

## ไดเรกทอรีชั่วคราวสำหรับการทดสอบ

ใช้ตัวช่วยร่วมใน `test/helpers/temp-dir.ts` สำหรับไดเรกทอรีชั่วคราว
ที่การทดสอบเป็นเจ้าของ เพื่อให้ระบุความเป็นเจ้าของอย่างชัดเจนและให้การล้างข้อมูล
อยู่ภายในวงจรชีวิตของการทดสอบ:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` ตั้งใจไม่เปิดเผยเมธอด
ล้างข้อมูลด้วยตนเอง เนื่องจาก Vitest เป็นผู้จัดการการล้างข้อมูลหลังการทดสอบแต่ละรายการ
ตัวช่วยระดับล่างแบบเก่า (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`)
ยังคงมีอยู่สำหรับการทดสอบที่ยังไม่ได้ย้ายระบบ หลีกเลี่ยงการใช้งานใหม่และหลีกเลี่ยง
การเรียก `fs.mkdtemp*` โดยตรงแบบใหม่ เว้นแต่การทดสอบนั้นกำลังตรวจสอบพฤติกรรม
ดิบของไดเรกทอรีชั่วคราวโดยเฉพาะ เมื่อจำเป็นต้องใช้ไดเรกทอรีชั่วคราวโดยตรงจริง ๆ
ให้เพิ่มความคิดเห็นอนุญาตที่ตรวจสอบย้อนหลังได้พร้อมเหตุผล:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` รายงานการสร้างไดเรกทอรีชั่วคราว
โดยตรงรายการใหม่และการใช้งานตัวช่วยร่วมแบบสั่งด้วยตนเองรายการใหม่ในบรรทัดที่เพิ่ม
ใน diff โดยไม่ขัดขวางรูปแบบการล้างข้อมูลเดิม โดยใช้การจำแนกพาธการทดสอบแบบเดียวกับ
`scripts/changed-lanes.mjs` และข้ามตัวการทำงานของตัวช่วยร่วมเอง
`check:changed` รันรายงานนี้สำหรับพาธการทดสอบที่เปลี่ยนแปลงเป็นสัญญาณ CI
แบบเตือนเท่านั้น (คำอธิบายประกอบคำเตือนของ GitHub ไม่ใช่ความล้มเหลว)

## เวิร์กโฟลว์ไลฟ์และ Docker/Parallels

เมื่อตรวจแก้ผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลรับรองจริง):

- ชุดทดสอบไลฟ์ (โมเดล + การตรวจสอบเครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ไลฟ์หนึ่งไฟล์แบบลดข้อความรบกวน: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพขณะรันไทม์: เรียกใช้ `OpenClaw Performance` โดยตั้ง
  `live_openai_candidate=true` สำหรับหนึ่งรอบการทำงานจริงของเอเจนต์
  `openai/gpt-5.6-luna` หรือ `deep_profile=true` สำหรับอาร์ติแฟกต์ CPU/ฮีป/เทรซ
  ของ Kova การรันตามกำหนดการรายวันเผยแพร่รายงานเลนผู้ให้บริการจำลอง
  โปรไฟล์เชิงลึก และ GPT-5.6 Luna ไปยัง `openclaw/clawgrit-reports`
  จากงานผู้เผยแพร่แยกต่างหากที่ใช้อาร์ติแฟกต์ หากการยืนยันตัวตนของผู้เผยแพร่
  ขาดหายหรือไม่ถูกต้อง การรันตามกำหนดการและการรัน `profile=release` จะล้มเหลว
  การเรียกใช้ด้วยตนเองที่ไม่ใช่รุ่นเผยแพร่จะเก็บอาร์ติแฟกต์ GitHub ไว้
  และถือว่าการเผยแพร่รายงานเป็นเพียงคำแนะนำ รายงานผู้ให้บริการจำลองยังรวม
  ตัวเลขการบูต Gateway ระดับซอร์ส หน่วยความจำ แรงกดดันจาก Plugin
  ลูปทักทายซ้ำของโมเดลจำลอง และการเริ่มต้น CLI
- การกวาดทดสอบโมเดลไลฟ์ด้วย Docker: `pnpm test:docker:live-models`
  - โมเดลที่เลือกแต่ละรายการจะรันหนึ่งรอบข้อความพร้อมการตรวจสอบขนาดเล็ก
    ในลักษณะการอ่านไฟล์ โมเดลที่ข้อมูลเมตาระบุว่ารองรับอินพุต `image`
    จะรันรูปภาพขนาดเล็กหนึ่งรอบด้วย ปิดการตรวจสอบเพิ่มเติมด้วย
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อต้องการแยกตรวจความล้มเหลวของผู้ให้บริการ
  - ความครอบคลุมของ CI: ทั้ง `OpenClaw Scheduled Live And E2E Checks`
    รายวันและ `OpenClaw Release Checks` ที่เรียกใช้ด้วยตนเองจะเรียกเวิร์กโฟลว์
    ไลฟ์/E2E ที่นำกลับมาใช้ซ้ำได้โดยตั้ง `include_live_suites: true`
    ซึ่งรวมงานเมทริกซ์โมเดลไลฟ์ของ Docker ที่แบ่งชาร์ดตามผู้ให้บริการ
  - สำหรับการรัน CI ซ้ำเฉพาะจุด ให้เรียกใช้
    `OpenClaw Live And E2E Checks (Reusable)` โดยตั้ง
    `include_live_suites: true` และ `live_models_only: true`
  - เพิ่มซีเคร็ตของผู้ให้บริการใหม่ที่ให้สัญญาณสูงลงใน
    `scripts/ci-hydrate-live-auth.sh` รวมถึง
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
    และตัวเรียกตามกำหนดการ/รุ่นเผยแพร่ของไฟล์นั้น
- การตรวจสอบเบื้องต้นของแชตที่ผูกกับ Codex แบบเนทีฟ: `pnpm test:docker:live-codex-bind`
  - รันเลนไลฟ์ Docker กับพาธเซิร์ฟเวอร์แอป Codex ผูก DM Slack จำลอง
    ด้วย `/codex bind` ทดสอบ `/codex fast` และ `/codex permissions`
    จากนั้นตรวจสอบว่าการตอบกลับแบบข้อความธรรมดาและไฟล์แนบรูปภาพ
    ถูกกำหนดเส้นทางผ่านการผูก Plugin แบบเนทีฟแทน ACP
- การตรวจสอบเบื้องต้นของชุดทดสอบเซิร์ฟเวอร์แอป Codex: `pnpm test:docker:live-codex-harness`
  - รันรอบการทำงานของเอเจนต์ Gateway ผ่านชุดทดสอบเซิร์ฟเวอร์แอป Codex
    ที่ Plugin เป็นเจ้าของ ตรวจสอบ `/codex status` และ `/codex models`
    และตามค่าเริ่มต้นจะทดสอบรูปภาพ, cron MCP, เอเจนต์ย่อย และ Guardian
    ปิดการตรวจสอบเอเจนต์ย่อยด้วย `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`
    เมื่อต้องการแยกตรวจความล้มเหลวอื่น สำหรับการตรวจสอบเอเจนต์ย่อยเฉพาะจุด
    ให้ปิดการตรวจสอบอื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    การทำงานนี้จะออกหลังการตรวจสอบเอเจนต์ย่อย เว้นแต่ตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- การตรวจสอบเบื้องต้นของการติดตั้ง Codex ตามต้องการ: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง tarball OpenClaw ที่จัดแพ็กเกจแล้วใน Docker รันการเริ่มต้นใช้งาน
    ด้วยคีย์ API ของ OpenAI และตรวจสอบว่า Plugin Codex พร้อมการขึ้นต่อกัน
    `@openai/codex` ถูกดาวน์โหลดลงในรูทโปรเจกต์ npm ที่มีการจัดการตามต้องการ
- การตรวจสอบเบื้องต้นของการขึ้นต่อกันของเครื่องมือ Plugin แบบไลฟ์: `pnpm test:docker:live-plugin-tool`
  - จัดแพ็กเกจ Plugin ฟิกซ์เจอร์ที่มีการขึ้นต่อกันจริงกับ `slugify`
    ติดตั้งผ่าน `npm-pack:` ตรวจสอบการขึ้นต่อกันภายใต้รูทโปรเจกต์ npm
    ที่มีการจัดการ จากนั้นขอให้โมเดล OpenAI แบบไลฟ์เรียกเครื่องมือของ Plugin
    และส่งคืนสลักที่ซ่อนไว้
- การตรวจสอบเบื้องต้นของคำสั่งกู้คืน Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจสอบเสริมแบบหลายชั้นที่เลือกเปิดใช้ได้สำหรับชุดคำสั่งกู้คืน
    ของช่องทางข้อความ ทดสอบ `/crestodian status` จัดคิวการเปลี่ยนโมเดล
    แบบถาวร ตอบกลับ `/crestodian yes` และตรวจสอบพาธการเขียนบันทึกตรวจสอบ/การกำหนดค่า
- การตรวจสอบเบื้องต้นของการรัน Crestodian ครั้งแรกด้วย Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ที่ว่างเปล่า และพิสูจน์ก่อนว่า CLI
    `openclaw crestodian` ที่จัดแพ็กเกจแล้วจะหยุดทำงานอย่างปลอดภัยเมื่อไม่มี
    การอนุมาน จากนั้นทดสอบและเปิดใช้งาน Claude จำลองผ่านโมดูลเปิดใช้งาน
    ที่จัดแพ็กเกจแล้ว หลังจากนั้นเท่านั้น คำขอ CLI แบบคลุมเครือที่จัดแพ็กเกจแล้ว
    จึงจะเข้าถึงตัววางแผนและแปลงเป็นการตั้งค่าแบบมีชนิด ตามด้วยการดำเนินการ
    แบบครั้งเดียวสำหรับโมเดล เอเจนต์ Plugin Discord และ SecretRef
    โดยจะตรวจสอบรายการการกำหนดค่าและบันทึกตรวจสอบ นี่เป็นหลักฐานประกอบ
    สำหรับเกต/การดำเนินการ ไม่ใช่หลักฐานของการเริ่มต้นใช้งานแบบโต้ตอบ
    หรือเอเจนต์/เครื่องมือ/การอนุมัติของ Crestodian เลนเดียวกันนี้เปิดให้ใช้
    ใน QA Lab ผ่าน `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- การตรวจสอบเบื้องต้นของค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY`
  ให้รัน `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกส่วนกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6
  และทรานสคริปต์ของผู้ช่วยจัดเก็บ `usage.cost` ที่ปรับให้อยู่ในรูปแบบมาตรฐาน

<Tip>
เมื่อคุณต้องการตรวจสอบเพียงกรณีที่ล้มเหลวหนึ่งกรณี ให้จำกัดขอบเขตการทดสอบไลฟ์ผ่านตัวแปรสภาพแวดล้อมรายการอนุญาตที่อธิบายไว้ด้านล่าง
</Tip>

## ตัวรันเฉพาะสำหรับ QA

ใช้คำสั่งเหล่านี้ควบคู่กับชุดทดสอบหลักเมื่อต้องการความสมจริงระดับ QA Lab

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ ความสอดคล้องแบบเอเจนต์อยู่ภายใต้
`QA-Lab - All Lanes` และการตรวจสอบรุ่นเผยแพร่ ไม่ใช่เวิร์กโฟลว์ PR
แบบแยกเดี่ยว การตรวจสอบแบบกว้างควรใช้ `Full Release Validation`
โดยตั้ง `rerun_group=qa-parity` หรือใช้กลุ่ม QA ของการตรวจสอบรุ่นเผยแพร่
การตรวจสอบรุ่นเผยแพร่แบบเสถียร/ค่าเริ่มต้นจะเก็บการทดสอบแช่ไลฟ์/Docker
แบบครอบคลุมไว้หลัง `run_release_soak=true` ส่วนโปรไฟล์ `full`
จะบังคับเปิดการทดสอบแช่ `QA-Lab - All Lanes` รันทุกคืนบน `main`
และจากการเรียกใช้ด้วยตนเอง โดยรันเลนความสอดคล้องจำลอง เลน Matrix แบบไลฟ์
เลน Telegram แบบไลฟ์ที่ Convex จัดการ และเลน Discord แบบไลฟ์ที่ Convex
จัดการเป็นงานคู่ขนาน QA ตามกำหนดการและการตรวจสอบรุ่นเผยแพร่จะส่ง
`--profile fast` ให้ Matrix อย่างชัดเจน ขณะที่ CLI ของ Matrix
และอินพุตเวิร์กโฟลว์แบบสั่งด้วยตนเองยังคงมีค่าเริ่มต้นเป็น `all`
การเรียกใช้ด้วยตนเองสามารถแบ่งชาร์ด `all` เป็นงาน `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release Checks`
รันความสอดคล้อง รวมถึงเลน Matrix แบบเร็วและเลน Telegram
ก่อนอนุมัติรุ่นเผยแพร่ โดยใช้ `mock-openai/gpt-5.6-luna`
สำหรับการตรวจสอบการขนส่งของรุ่นเผยแพร่ เพื่อให้ผลลัพธ์คงที่
และหลีกเลี่ยงการเริ่มต้น Plugin ของผู้ให้บริการตามปกติ Gateway
การขนส่งไลฟ์เหล่านี้ปิดการค้นหาหน่วยความจำ ส่วนพฤติกรรมหน่วยความจำ
ยังคงครอบคลุมโดยชุดทดสอบความสอดคล้องของ QA

ชาร์ดสื่อไลฟ์สำหรับรุ่นเผยแพร่เต็มรูปแบบใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว ชาร์ดโมเดล/แบ็กเอนด์ไลฟ์ของ Docker
ใช้อิมเมจร่วม `ghcr.io/openclaw/openclaw-live-test:<sha>` ที่สร้าง
หนึ่งครั้งต่อคอมมิตที่เลือก จากนั้นดึงอิมเมจด้วย
`OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการสร้างใหม่ภายในทุกชาร์ด

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์จำลอง QA ที่อ้างอิงจากรีโพซิทอรีโดยตรงบนโฮสต์
  - เขียนอาร์ติแฟกต์ระดับบนสุด `qa-evidence.json`, `qa-suite-summary.json` และ
    `qa-suite-report.md` สำหรับชุดสถานการณ์จำลองที่เลือก รวมถึงการเลือกสถานการณ์จำลอง
    แบบโฟว์ผสม, Vitest และ Playwright
  - เมื่อเรียกผ่าน `pnpm openclaw qa run --qa-profile <profile>` จะฝัง
    ตารางสรุปคะแนนโปรไฟล์อนุกรมวิธานที่เลือกไว้ใน `qa-evidence.json` เดียวกัน
    `smoke-ci` เขียนหลักฐานแบบย่อ (`evidenceMode: "slim"` โดยไม่มี
    `execution` แยกตามรายการ) `release` ครอบคลุมส่วนที่คัดสรรสำหรับความพร้อมในการเผยแพร่ ส่วน `all`
    เลือกทุกหมวดหมู่วุฒิภาวะที่ใช้งานอยู่ และมุ่งเป้าไปที่การสั่งเรียกเวิร์กโฟลว์ QA Profile
    Evidence อย่างชัดเจนเมื่อต้องใช้อาร์ติแฟกต์ตารางสรุปคะแนนฉบับเต็ม
  - เรียกใช้สถานการณ์จำลองที่เลือกหลายรายการแบบขนานโดยค่าเริ่มต้น ด้วย
    เวิร์กเกอร์ Gateway ที่แยกจากกัน `qa-channel` ใช้ค่าการทำงานพร้อมกันเริ่มต้นเป็น 4 (จำกัดตาม
    จำนวนสถานการณ์จำลองที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวนเวิร์กเกอร์
    หรือใช้ `--concurrency 1` สำหรับเลนแบบลำดับรุ่นเก่า
  - จบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์เมื่อสถานการณ์จำลองใดล้มเหลว ใช้ `--allow-failures` เพื่อสร้าง
    อาร์ติแฟกต์โดยไม่มีรหัสจบการทำงานที่บ่งชี้ความล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการภายในเครื่องที่ทำงานด้วย AIMock สำหรับ
    ความครอบคลุมของฟิกซ์เจอร์เชิงทดลองและม็อกโปรโตคอล โดยไม่แทนที่เลน
    `mock-openai` ที่รับรู้สถานการณ์จำลอง
- `pnpm openclaw qa coverage --match <query>`
  - ค้นหา ID สถานการณ์จำลอง ชื่อ พื้นผิว ID ความครอบคลุม การอ้างอิงเอกสาร การอ้างอิง
    โค้ด Plugin และข้อกำหนดของผู้ให้บริการ จากนั้นพิมพ์เป้าหมายชุดทดสอบที่ตรงกัน
  - ใช้คำสั่งนี้ก่อนเรียกใช้ QA Lab เมื่อคุณทราบพฤติกรรมหรือพาธไฟล์ที่ถูกแก้ไข
    แต่ไม่ทราบสถานการณ์จำลองที่เล็กที่สุด เป็นเพียงคำแนะนำเท่านั้น — ยังคงต้องเลือกหลักฐานแบบม็อก
    แบบสด, Multipass, Matrix หรือการขนส่งตามพฤติกรรมที่กำลังเปลี่ยนแปลง
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้ด่านทดสอบ Plugin Kitchen Sink ของ OpenAI แบบสดผ่าน QA Lab
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบรายการพื้นผิวของ plugin SDK
    ตรวจสอบ `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ Gateway
    เรียกใช้รอบโต้ตอบ OpenAI แบบสด และตรวจสอบการวินิจฉัยเชิงปฏิปักษ์
    ต้องมีการยืนยันตัวตน OpenAI แบบสด เช่น `OPENAI_API_KEY` ใน
    เซสชัน Testbox ที่เติมข้อมูลไว้ ระบบจะโหลดโปรไฟล์การยืนยันตัวตนแบบสดของ Testbox โดยอัตโนมัติ
    เมื่อมีตัวช่วย `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้เบนช์มาร์กการเริ่มต้น Gateway พร้อมชุดสถานการณ์จำลอง QA Lab แบบม็อกขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวม
    ไว้ภายใต้ `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้นจะแจ้งเฉพาะการสังเกต CPU ร้อนที่เกิดขึ้นต่อเนื่อง (`--cpu-core-warn`
    ค่าเริ่มต้น `0.9`; `--hot-wall-warn-ms` ค่าเริ่มต้น `30000`) ดังนั้นช่วงพุ่งสูงสั้น ๆ
    ระหว่างเริ่มต้นจะถูกบันทึกเป็นเมตริก โดยไม่ดูเหมือนการถดถอยที่ทำให้
    Gateway ใช้ CPU เต็มต่อเนื่องหลายนาที
  - ทำงานกับอาร์ติแฟกต์ `dist` ที่สร้างแล้ว ให้เรียกใช้การสร้างก่อนเมื่อเช็กเอาต์
    ยังไม่มีเอาต์พุตรันไทม์ที่เป็นปัจจุบัน
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ชุด QA เดียวกันภายใน VM Linux ของ Multipass แบบใช้แล้วทิ้ง โดยคง
    แฟล็กการเลือกสถานการณ์จำลองและผู้ให้บริการ/โมเดลแบบเดียวกับ `qa suite`
  - การเรียกใช้แบบสดจะส่งต่ออินพุตการยืนยันตัวตน QA ที่ใช้ได้จริงสำหรับเกสต์:
    คีย์ผู้ให้บริการจากสภาพแวดล้อม พาธการกำหนดค่าผู้ให้บริการแบบสดของ QA และ
    `CODEX_HOME` เมื่อมีอยู่
  - ไดเรกทอรีเอาต์พุตต้องอยู่ภายใต้รูทของรีโพซิทอรี เพื่อให้เกสต์เขียนกลับ
    ผ่านเวิร์กสเปซที่เมานต์ไว้ได้
  - เขียนรายงานและสรุป QA ตามปกติ พร้อมบันทึก Multipass ภายใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่ทำงานบน Docker สำหรับงาน QA ในรูปแบบผู้ปฏิบัติงาน
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้างทาร์บอล npm จากเช็กเอาต์ปัจจุบัน ติดตั้งแบบส่วนกลางใน
    Docker เรียกใช้การเริ่มต้นใช้งานด้วยคีย์ API ของ OpenAI แบบไม่โต้ตอบ กำหนดค่า
    Telegram โดยค่าเริ่มต้น ตรวจสอบว่ารันไทม์ Plugin ที่บรรจุในแพ็กเกจโหลดได้โดยไม่ต้อง
    ซ่อมแซมการขึ้นต่อกันระหว่างเริ่มต้น เรียกใช้ doctor และเรียกใช้รอบการทำงานของเอเจนต์ภายในเครื่องหนึ่งรอบ
    กับปลายทาง OpenAI แบบม็อก
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อเรียกใช้เลนการติดตั้งจากแพ็กเกจ
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - เรียกใช้การทดสอบเบื้องต้นด้วย Docker ของแอปที่สร้างแล้วแบบกำหนดผลลัพธ์ได้ สำหรับทรานสคริปต์บริบทรันไทม์
    ที่ฝังไว้ ตรวจสอบว่าบริบทรันไทม์ OpenClaw ที่ซ่อนอยู่คงอยู่ในรูป
    ข้อความกำหนดเองที่ไม่แสดงผล แทนที่จะรั่วไหลไปยังรอบโต้ตอบที่ผู้ใช้มองเห็น
    จากนั้นเตรียม JSONL ของเซสชันที่เสียหายและได้รับผลกระทบ แล้วตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยังกิ่งที่ใช้งานอยู่พร้อมข้อมูลสำรอง
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งแพ็กเกจ OpenClaw รุ่นผู้สมัครใน Docker เรียกใช้การเริ่มต้นใช้งาน
    ของแพ็กเกจที่ติดตั้ง กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้ง จากนั้นนำ
    เลน QA ของ Telegram แบบสดกลับมาใช้กับแพ็กเกจที่ติดตั้งนั้นในฐานะ Gateway
    ของระบบภายใต้การทดสอบ
  - ตัวห่อหุ้มเมานต์เฉพาะซอร์สฮาร์เนส `qa-lab` จากเช็กเอาต์
    แพ็กเกจที่ติดตั้งเป็นเจ้าของ `dist`, `openclaw/plugin-sdk` และรันไทม์
    Plugin ที่รวมมา ดังนั้นเลนนี้จะไม่ผสม Plugin จากเช็กเอาต์ปัจจุบันเข้าไป
    ในแพ็กเกจที่กำลังทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบทาร์บอลภายในเครื่องที่ได้รับการแก้ไขแล้ว
    แทนการติดตั้งจากรีจิสทรี
  - โดยค่าเริ่มต้นจะส่งออกการจับเวลา RTT ซ้ำใน `qa-evidence.json` ด้วย
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` กำหนดค่าแทน
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับการเรียกใช้
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` รับรายการ ID การตรวจสอบ QA ของ
    Telegram ที่คั่นด้วยจุลภาคเพื่อสุ่มตัวอย่าง เมื่อไม่ได้ตั้งค่า การตรวจสอบเริ่มต้น
    ที่รองรับ RTT คือ `telegram-mentioned-message-reply`
  - ใช้ข้อมูลประจำตัวจากสภาพแวดล้อมของ Telegram หรือแหล่งข้อมูลประจำตัว Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับระบบอัตโนมัติ CI/การเผยแพร่ ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และข้อมูลลับของบทบาท หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และข้อมูลลับของบทบาท Convex ใน
    CI ตัวห่อหุ้ม Docker จะเลือก Convex โดยอัตโนมัติ
  - ตัวห่อหุ้มจะตรวจสอบสภาพแวดล้อมข้อมูลประจำตัวของ Telegram หรือ Convex บนโฮสต์
    ก่อนงานสร้าง/ติดตั้ง Docker ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` เฉพาะเมื่อ
    ตั้งใจดีบักการตั้งค่าก่อนมีข้อมูลประจำตัว
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` กำหนดค่าแทน
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น เมื่อเลือกข้อมูลประจำตัว
    Convex และไม่ได้ตั้งค่าบทบาท ตัวห่อหุ้มจะใช้ `ci` ใน CI
    และ `maintainer` ภายนอก CI
  - GitHub Actions เปิดให้ใช้เลนนี้ในชื่อเวิร์กโฟลว์สำหรับผู้ดูแลแบบสั่งเอง
    `NPM Telegram Beta E2E` โดยจะไม่ทำงานเมื่อผสาน เวิร์กโฟลว์ใช้
    สภาพแวดล้อม `qa-live-shared` และสัญญาเช่าข้อมูลประจำตัว CI ของ Convex
- GitHub Actions ยังเปิดให้ใช้ `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบเรียกใช้แยก
  กับแพ็กเกจผู้สมัครหนึ่งรายการ โดยรับ Git ref, ข้อกำหนด npm ที่เผยแพร่แล้ว,
  URL ทาร์บอล HTTPS พร้อม SHA-256, นโยบาย URL ที่เชื่อถือได้ หรืออาร์ติแฟกต์ทาร์บอล
  จากการเรียกใช้อื่น (`source=ref|npm|url|trusted-url|artifact`) อัปโหลด
  `openclaw-current.tgz` ที่ปรับให้เป็นมาตรฐานเป็น `package-under-test` จากนั้นเรียกใช้
  ตัวจัดกำหนดการ E2E ของ Docker ที่มีอยู่ด้วยโปรไฟล์เลน `smoke`, `package`, `product`, `full`
  หรือ `custom` ตั้งค่า `telegram_mode=mock-openai` หรือ
  `live-frontier` เพื่อเรียกใช้เวิร์กโฟลว์ QA ของ Telegram กับอาร์ติแฟกต์
  `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์เบต้าล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL ทาร์บอลแบบตรงต้องมีไดเจสต์ และใช้นโยบายความปลอดภัยของ URL สาธารณะ:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- มิเรอร์ทาร์บอลระดับองค์กร/ส่วนตัวใช้นโยบายแหล่งที่เชื่อถือได้อย่างชัดเจน:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` อ่าน `.github/package-trusted-sources.json` จาก ref เวิร์กโฟลว์ที่เชื่อถือได้ และไม่ยอมรับข้อมูลประจำตัวใน URL หรือการข้ามข้อจำกัดเครือข่ายส่วนตัวผ่านอินพุตเวิร์กโฟลว์ หากนโยบายที่ระบุประกาศใช้การยืนยันตัวตนแบบ bearer ให้กำหนดค่าข้อมูลลับ `OPENCLAW_TRUSTED_PACKAGE_TOKEN` แบบคงที่

- หลักฐานอาร์ติแฟกต์ดาวน์โหลดอาร์ติแฟกต์ทาร์บอลจากการเรียกใช้ Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม
    Gateway โดยกำหนดค่า OpenAI แล้วเปิดใช้ช่องทาง/Plugin ที่รวมมาผ่าน
    การแก้ไขการกำหนดค่า
  - ตรวจสอบว่าการค้นพบระหว่างตั้งค่าปล่อยให้ Plugin ที่ดาวน์โหลดได้แต่ยังไม่ได้กำหนดค่า
    ไม่มีอยู่ การซ่อมแซมด้วย doctor ครั้งแรกหลังการกำหนดค่าจะติดตั้ง Plugin ที่ดาวน์โหลดได้
    แต่ละรายการที่ขาดหายอย่างชัดเจน และการเริ่มใหม่ครั้งที่สองจะไม่เรียกใช้
    การซ่อมแซมการขึ้นต่อกันแบบซ่อน
  - นอกจากนี้ยังติดตั้งค่าอ้างอิง npm รุ่นเก่าที่ทราบ เปิดใช้ Telegram ก่อน
    เรียกใช้ `openclaw update --tag <candidate>` และตรวจสอบว่า
    doctor หลังการอัปเดตของรุ่นผู้สมัครล้างเศษซากการขึ้นต่อกันของ Plugin แบบเดิม
    โดยไม่ต้องใช้การซ่อมแซมหลังติดตั้งจากฝั่งฮาร์เนส
- `pnpm test:parallels:npm-update`
  - เรียกใช้การทดสอบเบื้องต้นการอัปเดตการติดตั้งจากแพ็กเกจแบบเนทีฟกับเกสต์ Parallels
    แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจค่าอ้างอิงที่ร้องขอก่อน
    จากนั้นเรียกใช้คำสั่ง `openclaw update` ที่ติดตั้งแล้วในเกสต์เดียวกัน และ
    ตรวจสอบเวอร์ชันที่ติดตั้ง สถานะการอัปเดต ความพร้อมของ Gateway และ
    รอบการทำงานของเอเจนต์ภายในเครื่องหนึ่งรอบ
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux`
    ขณะทำซ้ำกับเกสต์เดียว ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุป
    และสถานะแต่ละเลน
  - เลน OpenAI ใช้ `openai/gpt-5.6-luna` สำหรับหลักฐานรอบการทำงานของเอเจนต์แบบสดโดย
    ค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เพื่อตรวจสอบโมเดล OpenAI อื่น
  - ครอบการเรียกใช้ภายในเครื่องที่ใช้เวลานานด้วยการหมดเวลาของโฮสต์ เพื่อไม่ให้การค้างของการขนส่ง
    Parallels ใช้เวลาที่เหลือทั้งหมดของช่วงทดสอบ:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียนบันทึกเลนแบบซ้อนภายใต้
    `/tmp/openclaw-parallels-npm-update.*` ตรวจสอบ `windows-update.log`,
    `macos-update.log` หรือ `linux-update.log` ก่อนสรุปว่าตัวห่อหุ้ม
    ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีใน doctor หลังการอัปเดตและ
    งานอัปเดตแพ็กเกจบนเกสต์ที่ยังไม่อุ่น ซึ่งยังถือว่าปกติเมื่อ
    บันทึกดีบัก npm แบบซ้อนยังคงมีความคืบหน้า
  - อย่าเรียกใช้ตัวห่อหุ้มแบบรวมนี้พร้อมกันกับเลนทดสอบเบื้องต้น Parallels
    สำหรับ macOS, Windows หรือ Linux แยกกัน เนื่องจากใช้สถานะ VM ร่วมกันและอาจ
    ชนกันระหว่างการคืนค่าสแนปช็อต การให้บริการแพ็กเกจ หรือสถานะ Gateway ของเกสต์
  - หลักฐานหลังการอัปเดตเรียกใช้พื้นผิว Plugin ที่รวมมาตามปกติ เนื่องจาก
    ฟาซาดความสามารถ เช่น เสียงพูด การสร้างภาพ และการทำความเข้าใจสื่อ
    โหลดผ่าน API รันไทม์ที่รวมมา แม้ว่ารอบการทำงานของเอเจนต์
    จะตรวจสอบเพียงการตอบกลับข้อความอย่างง่ายก็ตาม

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการทดสอบควันของโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - เรียกใช้เลน QA แบบสดของ Matrix กับโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งที่ทำงานบน Docker ใช้ได้เฉพาะจากการเช็กเอาต์ซอร์สเท่านั้น—การติดตั้งจากแพ็กเกจไม่มี `qa-lab`
  - รายละเอียด CLI ทั้งหมด แค็ตตาล็อกโปรไฟล์/สถานการณ์ ตัวแปรสภาพแวดล้อม และโครงสร้างอาร์ติแฟกต์:
    [QA ของ Matrix](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - เรียกใช้เลน QA แบบสดของ Telegram กับกลุ่มส่วนตัวจริง โดยใช้โทเค็นบอตไดรเวอร์และบอต SUT จากตัวแปรสภาพแวดล้อม
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รหัสกลุ่มต้องเป็นรหัสแชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบพูลที่ใช้ร่วมกัน
    ใช้โหมดตัวแปรสภาพแวดล้อมเป็นค่าเริ่มต้น หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    เพื่อเลือกใช้สัญญาเช่าจากพูล
  - ค่าเริ่มต้นครอบคลุมการทดสอบคานารี การควบคุมด้วยการกล่าวถึง การระบุปลายทางคำสั่ง `/status`
    การตอบกลับระหว่างบอตที่มีการกล่าวถึง และการตอบกลับคำสั่งเนทีฟหลัก
    ค่าเริ่มต้นของ `mock-openai` ยังครอบคลุมการถดถอยของสายโซ่การตอบกลับแบบกำหนดผลลัพธ์ได้
    และการสตรีมข้อความสุดท้ายของ Telegram ใช้ `--list-scenarios`
    สำหรับโพรบเสริม เช่น `session_status`
  - จบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดก็ตามล้มเหลว ใช้ `--allow-failures`
    เพื่อสร้างอาร์ติแฟกต์โดยไม่ให้รหัสจบการทำงานบ่งชี้ความล้มเหลว
  - ต้องใช้บอตที่แตกต่างกันสองตัวในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องมีชื่อผู้ใช้ Telegram
  - เพื่อให้การสังเกตการสื่อสารระหว่างบอตมีเสถียรภาพ ให้เปิดใช้งาน Bot-to-Bot Communication Mode
    ใน `@BotFather` สำหรับบอตทั้งสอง และตรวจสอบว่าบอตไดรเวอร์สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram สรุป และ `qa-evidence.json` ไว้ภายใต้
    `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของไดรเวอร์
    จนถึงการสังเกตพบการตอบกลับจาก SUT

`Mantis Telegram Live` เป็นตัวห่อหุ้มสำหรับหลักฐาน PR ของเลนนี้ โดยเรียกใช้
รีเฟอเรนซ์ผู้สมัครด้วยข้อมูลรับรอง Telegram ที่เช่าผ่าน Convex แสดงผลชุดรายงาน/หลักฐาน QA
ที่ปกปิดข้อมูลสำคัญในเบราว์เซอร์เดสก์ท็อป Crabbox บันทึกหลักฐานเป็น MP4
สร้าง GIF ที่ตัดช่วงไร้การเคลื่อนไหว อัปโหลดชุดอาร์ติแฟกต์ และโพสต์หลักฐานแบบอินไลน์ใน PR
ผ่าน Mantis GitHub App เมื่อตั้งค่า `pr_number` ผู้ดูแลสามารถเริ่มงานจาก Actions UI
ผ่าน `Mantis Scenario` (`scenario_id: telegram-live`) หรือโดยตรงจากความคิดเห็นในคำขอดึง:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` เป็นตัวห่อหุ้ม Telegram Desktop แบบเนทีฟที่ทำงานด้วยเอเจนต์
สำหรับหลักฐานภาพก่อน/หลังของ PR เริ่มได้จาก Actions UI ด้วย `instructions` แบบข้อความอิสระ
ผ่าน `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) หรือจากความคิดเห็นใน PR:

```text
@openclaw-mantis telegram desktop proof
```

เอเจนต์ Mantis อ่าน PR ตัดสินว่าพฤติกรรมใดที่มองเห็นได้ใน Telegram สามารถพิสูจน์
การเปลี่ยนแปลง เรียกใช้เลนพิสูจน์ Telegram Desktop ของผู้ใช้จริงผ่าน Crabbox
กับรีเฟอเรนซ์พื้นฐานและรีเฟอเรนซ์ผู้สมัคร ปรับซ้ำจน GIF แบบเนทีฟใช้งานได้ดี
เขียนแมนิเฟสต์ `motionPreview` แบบจับคู่ และโพสต์ตาราง GIF แบบ 2 คอลัมน์เดียวกัน
ผ่าน Mantis GitHub App เมื่อตั้งค่า `pr_number`

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - เช่าหรือนำเดสก์ท็อป Linux ของ Crabbox กลับมาใช้ใหม่ ติดตั้ง Telegram Desktop
    แบบเนทีฟ กำหนดค่า OpenClaw ด้วยโทเค็นบอต Telegram SUT ที่เช่ามา
    เริ่ม Gateway และบันทึกหลักฐานภาพหน้าจอ/MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้
  - ใช้ `--credential-source convex` เป็นค่าเริ่มต้น เพื่อให้เวิร์กโฟลว์ต้องใช้เพียง
    ข้อมูลลับของนายหน้า Convex ใช้ `--credential-source env` ร่วมกับตัวแปร
    `OPENCLAW_QA_TELEGRAM_*` ชุดเดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังคงต้องมีการเข้าสู่ระบบ/โปรไฟล์ของผู้ใช้ โทเค็นบอต
    ใช้กำหนดค่า OpenClaw เท่านั้น ใช้ `--telegram-profile-archive-env <name>`
    สำหรับอาร์ไคฟ์โปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` แล้วเข้าสู่ระบบ
    ด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` และ `telegram-desktop-builder.mp4`
    ไว้ภายใต้ไดเรกทอรีเอาต์พุต

เลนการขนส่งแบบสดใช้สัญญามาตรฐานเดียวกันร่วมกัน เพื่อป้องกันไม่ให้การขนส่งใหม่
เบี่ยงเบนออกจากกัน เมทริกซ์ความครอบคลุมของแต่ละเลนอยู่ใน
[ภาพรวม QA—ความครอบคลุมการขนส่งแบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage)
`qa-channel` เป็นชุดทดสอบสังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์ดังกล่าว

### ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
สำหรับ QA การขนส่งแบบสด ห้องปฏิบัติการ QA จะขอสัญญาเช่าแบบเอกสิทธิ์จากพูลที่ใช้ Convex
ส่ง Heartbeat ให้สัญญาเช่านั้นระหว่างที่เลนกำลังทำงาน และคืนสัญญาเช่าเมื่อปิดระบบ
ชื่อส่วนนี้มีมาก่อนการรองรับ Discord, Slack และ WhatsApp แต่สัญญาการเช่าใช้ร่วมกัน
สำหรับทุกชนิด

โครงร่างโปรเจกต์ Convex สำหรับใช้อ้างอิง: `qa/convex-credential-broker/`

ตัวแปรสภาพแวดล้อมที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- ข้อมูลลับหนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจากตัวแปรสภาพแวดล้อม: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI และเป็น `maintainer` ในกรณีอื่น)

ตัวแปรสภาพแวดล้อมเสริม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (รหัสการติดตามเสริม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL ของ Convex แบบ local loopback `http://` สำหรับการพัฒนาภายในเครื่องเท่านั้น

ในการทำงานตามปกติ `OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://`

คำสั่งผู้ดูแลระบบสำหรับผู้ดูแล (เพิ่ม/ลบ/แสดงรายการพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแล:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการเรียกใช้แบบสด เพื่อตรวจสอบ URL ไซต์ Convex ข้อมูลลับของนายหน้า
คำนำหน้าเอนด์พอยต์ การหมดเวลา HTTP และความสามารถในการเข้าถึงการดูแลระบบ/รายการ
โดยไม่พิมพ์ค่าข้อมูลลับ ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

สัญญาเอนด์พอยต์เริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`)
คำขอยืนยันตัวตนด้วยส่วนหัว `Authorization: Bearer <role secret>`;
เนื้อหาคำขอด้านล่างละส่วนหัวดังกล่าวไว้:

- `POST /acquire`
  - คำขอ: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - สำเร็จ: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - พูลหมด/ลองใหม่ได้: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - สำเร็จ: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /release`
  - คำขอ: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - สำเร็จ: `{ status: "ok" }` (หรือ `2xx` ว่าง)
- `POST /admin/add` (เฉพาะข้อมูลลับของผู้ดูแล)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะข้อมูลลับของผู้ดูแล)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกันสัญญาเช่าที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะข้อมูลลับของผู้ดูแล)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบเพย์โหลดสำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธเพย์โหลดที่มีรูปแบบไม่ถูกต้อง

รูปแบบเพย์โหลดสำหรับชนิดผู้ใช้จริงของ Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริงเลขฐานสิบหก SHA-256
- `kind: "telegram-user"` สงวนไว้สำหรับเวิร์กโฟลว์พิสูจน์ Mantis Telegram Desktop เลน QA Lab ทั่วไปต้องไม่ขอรับชนิดนี้

เพย์โหลดหลายช่องทางที่นายหน้าตรวจสอบ:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถเช่าจากพูลได้เช่นกัน แต่ขณะนี้การตรวจสอบเพย์โหลด Slack
อยู่ในตัวเรียกใช้ QA ของ Slack แทนที่จะอยู่ในนายหน้า ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางใน QA

สถาปัตยกรรมและชื่อของตัวช่วยสถานการณ์สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน
[ภาพรวม QA—การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel)
ข้อกำหนดขั้นต่ำ: ใช้งานตัวเรียกใช้การขนส่งบนรอยต่อโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
เพิ่ม `adapterFactory` สำหรับสถานการณ์ที่ใช้ร่วมกัน ประกาศ `qaRunners` ในแมนิเฟสต์
ของ Plugin เมานต์เป็น `openclaw qa <runner>` และเขียนสถานการณ์ภายใต้
`qa/scenarios/`

## ชุดการทดสอบ (สิ่งใดทำงานที่ใด)

ให้มองชุดทดสอบเหล่านี้ว่าเป็น “ระดับความสมจริงที่เพิ่มขึ้น” (พร้อมความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น)

### ยูนิต / การผสานรวม (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- การกำหนดค่า: การเรียกใช้ที่ไม่ระบุเป้าหมายจะใช้ชุดชาร์ด `vitest.full-*.config.ts`
  และอาจขยายชาร์ดแบบหลายโปรเจกต์เป็นการกำหนดค่ารายโปรเจกต์
  เพื่อจัดกำหนดการแบบขนาน
- ไฟล์: รายการทดสอบหลัก/ยูนิตภายใต้ `src/**/*.test.ts`,
  `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบยูนิต UI ทำงานใน
  ชาร์ด `unit-ui` โดยเฉพาะ
- ขอบเขต:
  - การทดสอบยูนิตล้วน
  - การทดสอบการผสานรวมภายในโปรเซส (การยืนยันตัวตนของ Gateway การกำหนดเส้นทาง เครื่องมือ การแยกวิเคราะห์ การกำหนดค่า)
  - การทดสอบการถดถอยแบบกำหนดผลลัพธ์ได้สำหรับข้อบกพร่องที่ทราบ
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบตัวแก้ไขพาธและตัวโหลดพื้นผิวสาธารณะต้องพิสูจน์พฤติกรรมสำรองแบบกว้างของ `api.js`
    และ `runtime-api.js` ด้วยฟิกซ์เจอร์ Plugin ขนาดเล็กที่สร้างขึ้น
    ไม่ใช่ API จากซอร์ส Plugin ที่รวมมาให้จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดสัญญา/การผสานรวมที่ Plugin นั้นเป็นเจ้าของ

นโยบายการพึ่งพาแบบเนทีฟ:

- การติดตั้งเพื่อทดสอบตามค่าเริ่มต้นจะข้ามการบิลด์ opus แบบเนทีฟซึ่งเป็นทางเลือกของ Discord
  เสียงของ Discord ใช้ `libopus-wasm` ที่รวมมาให้ และปิดใช้งาน `@discordjs/opus`
  ใน `allowBuilds` เพื่อไม่ให้การทดสอบภายในเครื่องและเลน Testbox คอมไพล์
  ส่วนเสริมแบบเนทีฟ
- เปรียบเทียบประสิทธิภาพ opus แบบเนทีฟในรีโพซิทอรีเบนช์มาร์ก `libopus-wasm`
  ไม่ใช่ในวงจรติดตั้ง/ทดสอบเริ่มต้นของ OpenClaw อย่าตั้ง `@discordjs/opus`
  เป็น `true` ใน `allowBuilds` เริ่มต้น เพราะจะทำให้วงจรติดตั้ง/ทดสอบที่ไม่เกี่ยวข้อง
  ต้องคอมไพล์โค้ดเนทีฟ

<AccordionGroup>
  <Accordion title="โปรเจกต์ ชาร์ด และเลนที่กำหนดขอบเขต">

    - การรัน `pnpm test` โดยไม่ระบุเป้าหมายจะใช้การกำหนดค่าชาร์ดขนาดเล็กสิบสามชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการโปรเจกต์รากแบบเนทีฟขนาดใหญ่เพียงกระบวนการเดียว วิธีนี้ช่วยลด RSS สูงสุดบนเครื่องที่มีภาระงานสูง และป้องกันไม่ให้งาน auto-reply/Plugin แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์แบบเนทีฟของ `vitest.config.ts` ที่ราก เนื่องจากลูปเฝ้าดูแบบหลายชาร์ดใช้งานจริงได้ยาก
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจนผ่านเลนตามขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องแบกรับต้นทุนการเริ่มต้นของโปรเจกต์รากทั้งหมด
    - โดยค่าเริ่มต้น `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนแปลงเป็นเลนตามขอบเขตที่มีต้นทุนต่ำ ได้แก่ การแก้ไขไฟล์ทดสอบโดยตรง ไฟล์ `*.test.ts` ข้างเคียง การแมปซอร์สที่ระบุชัดเจน และไฟล์ที่ขึ้นต่อกันตามกราฟการนำเข้าภายใน การแก้ไขการกำหนดค่า/การตั้งค่า/แพ็กเกจจะไม่เรียกใช้การทดสอบแบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือด่านตรวจสอบภายในเครื่องแบบอัจฉริยะตามปกติสำหรับงานขอบเขตแคบ โดยจะจำแนก diff เป็นคอร์ การทดสอบคอร์ ส่วนขยาย การทดสอบส่วนขยาย แอป เอกสาร เมทาดาทารุ่น เครื่องมือ Docker แบบใช้งานจริง และเครื่องมือทั่วไป จากนั้นเรียกใช้คำสั่งตรวจสอบชนิด lint และ guard ที่ตรงกัน คำสั่งนี้ไม่เรียกใช้การทดสอบ Vitest ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` โดยระบุเป้าหมายสำหรับหลักฐานการทดสอบ การเพิ่มหมายเลขเวอร์ชันที่เปลี่ยนเฉพาะเมทาดาทารุ่นจะเรียกใช้การตรวจสอบเวอร์ชัน/การกำหนดค่า/การขึ้นต่อกันระดับรากแบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลงแพ็กเกจนอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไขชุดทดสอบ ACP ของ Docker แบบใช้งานจริงจะเรียกใช้การตรวจสอบเฉพาะจุด ได้แก่ ไวยากรณ์เชลล์ของสคริปต์ยืนยันตัวตน Docker แบบใช้งานจริง และการทดลองรันตัวจัดกำหนดการ Docker แบบใช้งานจริงโดยไม่ดำเนินการจริง การเปลี่ยนแปลง `package.json` จะรวมอยู่ด้วยเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]` เท่านั้น ส่วนการแก้ไขการขึ้นต่อกัน การส่งออก เวอร์ชัน และพื้นผิวอื่นของแพ็กเกจยังคงใช้ guard ที่ครอบคลุมกว่า
    - การทดสอบหน่วยที่นำเข้าโมดูลน้อยจากเอเจนต์ คำสั่ง Plugin ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีบริสุทธิ์ที่คล้ายกัน จะส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts` ส่วนไฟล์ที่มีสถานะหรือใช้รันไทม์หนักจะยังคงอยู่ในเลนเดิม
    - ไฟล์ซอร์สตัวช่วย `plugin-sdk` และ `commands` ที่เลือกไว้ยังแมปการรันโหมดเปลี่ยนแปลงไปยังการทดสอบข้างเคียงที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย เพื่อให้การแก้ไขตัวช่วยไม่ต้องรันชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มีบักเก็ตเฉพาะสำหรับตัวช่วยคอร์ระดับบนสุด การทดสอบการผสานรวม `reply.*` ระดับบนสุด และแผนผังย่อย `src/auto-reply/reply/**` นอกจากนี้ CI ยังแบ่งแผนผังย่อย reply เป็นชาร์ด agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้บักเก็ตที่นำเข้าโมดูลจำนวนมากบักเก็ตเดียวครอบครองช่วงท้ายทั้งหมดของ Node
    - CI ปกติสำหรับ PR/main จะข้ามการกวาดชุด Plugin ที่รวมมาให้และชาร์ด `agentic-plugins` ซึ่งใช้เฉพาะการออกรุ่นโดยตั้งใจ การตรวจสอบความถูกต้องของรุ่นฉบับเต็มจะเรียกเวิร์กโฟลว์ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่ใช้ Plugin หนักเหล่านั้นบนรุ่นผู้สมัคร

  </Accordion>

  <Accordion title="ความครอบคลุมของตัวรันแบบฝัง">

    - เมื่อคุณเปลี่ยนอินพุตการค้นหาเครื่องมือข้อความหรือบริบท
      รันไทม์ของ Compaction ให้คงความครอบคลุมไว้ทั้งสองระดับ
    - เพิ่มการทดสอบการถดถอยแบบเจาะจงสำหรับขอบเขตการกำหนดเส้นทางและ
      การทำให้เป็นมาตรฐานที่เป็นตรรกะบริสุทธิ์
    - รักษาชุดทดสอบการผสานรวมของตัวรันแบบฝังให้ทำงานได้สมบูรณ์:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` และ
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านี้ยืนยันว่า ID ตามขอบเขตและพฤติกรรม Compaction ยังคงไหลผ่าน
      พาธจริงของ `run.ts` / `compact.ts` การทดสอบเฉพาะตัวช่วย
      ไม่สามารถใช้ทดแทนพาธการผสานรวมเหล่านั้นได้อย่างเพียงพอ

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของพูลและการแยกการทำงานใน Vitest">

    - การกำหนดค่าพื้นฐานของ Vitest ใช้ `threads` เป็นค่าเริ่มต้น
    - การกำหนดค่า Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` ไว้ตายตัว และใช้
      ตัวรันแบบไม่แยกการทำงานกับโปรเจกต์ราก การทดสอบ e2e และการกำหนดค่าแบบใช้งานจริง
    - เลน UI ที่รากยังคงใช้การตั้งค่าและตัวเพิ่มประสิทธิภาพ `jsdom` แต่ทำงานบน
      ตัวรันแบบไม่แยกการทำงานที่ใช้ร่วมกันด้วย
    - แต่ละชาร์ดของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากการกำหนดค่า Vitest ที่ใช้ร่วมกัน
    - โดยค่าเริ่มต้น `scripts/run-vitest.mjs` จะเพิ่ม `--no-maglev` ให้กระบวนการลูก Node
      ของ Vitest เพื่อลดการคอมไพล์ซ้ำของ V8 ระหว่างการรันขนาดใหญ่ภายในเครื่อง
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม
      มาตรฐานของ V8
    - `scripts/run-vitest.mjs` จะยุติการรัน Vitest แบบไม่เฝ้าดูที่ระบุชัดเจน
      หลังจากไม่มีเอาต์พุต stdout หรือ stderr เป็นเวลา 5 นาที ตั้งค่า
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` เพื่อปิดตัวเฝ้าระวังสำหรับ
      การตรวจสอบที่ตั้งใจให้ไม่มีเอาต์พุต

  </Accordion>

  <Accordion title="การวนซ้ำภายในเครื่องอย่างรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใดบ้าง
    - ฮุก pre-commit ทำเฉพาะการจัดรูปแบบ โดยจะเพิ่มไฟล์ที่จัดรูปแบบแล้วเข้า staging อีกครั้ง
      และไม่เรียกใช้ lint การตรวจสอบชนิด หรือการทดสอบ
    - เรียกใช้ `pnpm check:changed` อย่างชัดเจนก่อนส่งมอบหรือ push เมื่อคุณ
      ต้องการด่านตรวจสอบภายในเครื่องแบบอัจฉริยะ
    - โดยค่าเริ่มต้น `pnpm test:changed` จะกำหนดเส้นทางผ่านเลนตามขอบเขตที่มีต้นทุนต่ำ ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อเอเจนต์
      ตัดสินว่าการแก้ไขชุดทดสอบ การกำหนดค่า แพ็กเกจ หรือสัญญาจำเป็นต้องมี
      ความครอบคลุมของ Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการกำหนดเส้นทาง
      เดิมไว้ เพียงแต่มีขีดจำกัดเวิร์กเกอร์สูงขึ้น
    - การปรับจำนวนเวิร์กเกอร์ภายในเครื่องโดยอัตโนมัติถูกออกแบบให้ระมัดระวัง และจะลดระดับลง
      เมื่อค่าเฉลี่ยโหลดของโฮสต์สูงอยู่แล้ว เพื่อให้การรัน Vitest พร้อมกันหลายรายการ
      ส่งผลกระทบน้อยลงโดยค่าเริ่มต้น
    - การกำหนดค่าพื้นฐานของ Vitest ทำเครื่องหมายไฟล์โปรเจกต์/การกำหนดค่าเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำในโหมดเปลี่ยนแปลงยังคงถูกต้องเมื่อ
      การเชื่อมโยงการทดสอบเปลี่ยนแปลง
    - การกำหนดค่าจะเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` บน
      โฮสต์ที่รองรับ ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      เพื่อระบุตำแหน่งแคชเดียวอย่างชัดเจนสำหรับการทำโปรไฟล์โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดใช้การรายงานระยะเวลาการนำเข้าของ Vitest พร้อม
      เอาต์พุตแจกแจงรายละเอียดการนำเข้า
    - `pnpm test:perf:imports:changed` จำกัดมุมมองการทำโปรไฟล์เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนแปลงนับจาก `origin/main`
    - ข้อมูลเวลาของชาร์ดจะเขียนไปยัง `.artifacts/vitest-shard-timings.json`
      การรันทั้งการกำหนดค่าจะใช้พาธการกำหนดค่าเป็นคีย์ ส่วนชาร์ด CI ที่ใช้รูปแบบการรวม
      จะต่อท้ายชื่อชาร์ดเพื่อให้ติดตามชาร์ดที่กรองแล้ว
      แยกจากกันได้
    - เมื่อการทดสอบที่ใช้เวลามากรายการหนึ่งยังคงใช้เวลาส่วนใหญ่กับการนำเข้าตอนเริ่มต้น
      ให้เก็บการขึ้นต่อกันที่มีน้ำหนักมากไว้หลังขอบเขต `*.runtime.ts` ภายในที่แคบ และ
      จำลองขอบเขตนั้นโดยตรง แทนการนำเข้าตัวช่วยรันไทม์แบบลึก
      เพียงเพื่อส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ผ่านการกำหนดเส้นทางกับพาธโปรเจกต์รากแบบเนทีฟสำหรับ
      diff ที่คอมมิตนั้น และแสดงเวลาจริงพร้อม RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` วัดประสิทธิภาพของ
      แผนผังงานปัจจุบันที่ยังไม่สะอาด โดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนแปลงผ่าน
      `scripts/test-projects.mjs` และการกำหนดค่า Vitest ที่ราก
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของเธรดหลักสำหรับ
      ค่าใช้จ่ายส่วนเกินในการเริ่มต้นและการแปลงของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+ฮีปของตัวรันสำหรับ
      ชุดทดสอบหน่วยโดยปิดการทำงานแบบขนานระดับไฟล์

  </Accordion>
</AccordionGroup>

### ความเสถียร (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- การกำหนดค่า: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` และ `test/vitest/vitest.infra.config.ts` โดยแต่ละรายการถูกบังคับให้ใช้หนึ่งเวิร์กเกอร์
- ขอบเขต:
  - เริ่ม Gateway แบบ local loopback จริง โดยเปิดใช้การวินิจฉัยเป็นค่าเริ่มต้น
  - ขับเคลื่อนการหมุนเวียนของข้อความ Gateway หน่วยความจำ และเพย์โหลดขนาดใหญ่แบบสังเคราะห์ผ่านพาธเหตุการณ์วินิจฉัย
  - สอบถาม `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วยคงข้อมูลบันเดิลความเสถียรของการวินิจฉัย
  - ยืนยันว่าตัวบันทึกยังคงมีขอบเขตจำกัด ตัวอย่าง RSS สังเคราะห์อยู่ต่ำกว่างบประมาณแรงกดดัน และความลึกของคิวต่อเซสชันลดกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เป็นเลนขอบเขตแคบสำหรับติดตามการถดถอยด้านความเสถียร ไม่ใช่สิ่งทดแทนชุดทดสอบ Gateway ฉบับเต็ม

### E2E (การรวมทั้งที่เก็บ)

- คำสั่ง: `pnpm test:e2e`
- ขอบเขต:
  - เรียกใช้เลน E2E สำหรับการทดสอบควันของ Gateway
  - เรียกใช้เลน E2E ของเบราว์เซอร์ Control UI แบบจำลอง
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - ต้องติดตั้ง Playwright Chromium

### E2E (การทดสอบควันของ Gateway)

- คำสั่ง: `pnpm test:e2e:gateway`
- การกำหนดค่า: `test/vitest/vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ Plugin ที่รวมมาให้ภายใต้ `extensions/`
- ค่าเริ่มต้นของรันไทม์:
  - ใช้ `threads` ของ Vitest พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของที่เก็บ
  - ใช้จำนวนเวิร์กเกอร์แบบปรับตัว (CI: สูงสุด 2, ภายในเครื่อง: ค่าเริ่มต้น 1)
  - ทำงานในโหมดเงียบโดยค่าเริ่มต้น เพื่อลดค่าใช้จ่ายส่วนเกินของ I/O คอนโซล
- การแทนค่าที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวนเวิร์กเกอร์ (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดใช้เอาต์พุตคอนโซลแบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรมแบบครบวงจรของ Gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP การจับคู่ Node และเครือข่ายที่หนักขึ้น
- ความคาดหวัง:
  - ทำงานใน CI (เมื่อเปิดใช้ในไปป์ไลน์)
  - ไม่ต้องใช้คีย์จริง
  - มีองค์ประกอบที่เคลื่อนไหวมากกว่าการทดสอบหน่วย (อาจช้ากว่า)

### E2E (เบราว์เซอร์ Control UI แบบจำลอง)

- คำสั่ง: `pnpm test:ui:e2e`
- การกำหนดค่า: `test/vitest/vitest.ui-e2e.config.ts`
- ไฟล์: `ui/src/**/*.e2e.test.ts`
- ขอบเขต:
  - เริ่ม Vite Control UI
  - ขับเคลื่อนหน้า Chromium จริงผ่าน Playwright
  - แทนที่ WebSocket ของ Gateway ด้วยวัตถุจำลองในเบราว์เซอร์ที่ให้ผลลัพธ์แน่นอน
- ความคาดหวัง:
  - ทำงานใน CI เป็นส่วนหนึ่งของ `pnpm test:e2e`
  - ไม่ต้องใช้ Gateway จริง เอเจนต์ หรือคีย์ผู้ให้บริการ
  - ต้องมีการขึ้นต่อกันของเบราว์เซอร์ (`pnpm --dir ui exec playwright install chromium`)

### E2E: การทดสอบควันของแบ็กเอนด์ OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - ใช้ OpenShell Gateway ภายในเครื่องที่กำลังทำงานอยู่ซ้ำ
  - สร้างแซนด์บ็อกซ์จาก Dockerfile ชั่วคราวภายในเครื่อง
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + การเรียกใช้ SSH
  - ตรวจสอบพฤติกรรมระบบไฟล์ที่ยึดฝั่งรีโมตเป็นมาตรฐานผ่านบริดจ์ fs ของแซนด์บ็อกซ์
- ความคาดหวัง:
  - ต้องเลือกเข้าร่วมเท่านั้น ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` เริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่องและดีมอน Docker ที่ทำงานได้
  - ต้องมี OpenShell Gateway ภายในเครื่องที่กำลังทำงานอยู่และแหล่งการกำหนดค่าของมัน
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยก จากนั้นทำลายแซนด์บ็อกซ์ทดสอบ
- การแทนค่าที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อเรียกใช้ชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือสคริปต์ตัวห่อหุ้มที่ไม่ใช่ค่าเริ่มต้น
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` เพื่อเปิดเผยการกำหนดค่า Gateway ที่ลงทะเบียนไว้ให้แก่การทดสอบแบบแยก
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` เพื่อแทนที่ IP ของ Gateway Docker ที่ฟิกซ์เจอร์นโยบายโฮสต์ใช้

### แบบใช้งานจริง (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- การกำหนดค่า: `test/vitest/vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบจริงของ Plugin ที่รวมมาให้ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _ในวันนี้_ ด้วยข้อมูลรับรองจริงหรือไม่?"
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ ลักษณะเฉพาะของการเรียกใช้เครื่องมือ ปัญหาการยืนยันตัวตน และพฤติกรรมการจำกัดอัตรา
- สิ่งที่คาดหมาย:
  - ออกแบบมาให้ไม่มีเสถียรภาพระดับ CI (เครือข่ายจริง นโยบายจริงของผู้ให้บริการ โควตา และเหตุขัดข้อง)
  - มีค่าใช้จ่าย / ใช้โควตาการจำกัดอัตรา
  - ควรรันเฉพาะชุดย่อยที่จำกัดขอบเขต แทนการรัน "ทุกอย่าง"
- การรันจริงใช้คีย์ API ที่ส่งออกไว้แล้วและโปรไฟล์การยืนยันตัวตนที่จัดเตรียมไว้
- ตามค่าเริ่มต้น การรันจริงยังคงแยก `HOME` และคัดลอกข้อมูลการกำหนดค่า/การยืนยันตัวตนไปยังโฮมทดสอบชั่วคราว เพื่อไม่ให้ฟิกซ์เจอร์ของการทดสอบหน่วยแก้ไข `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณต้องการให้การทดสอบจริงใช้ไดเรกทอรีโฮมจริงของคุณโดยเจตนา
- `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น โดยยังคงแสดงผลความคืบหน้า `[live] ...` และปิดเสียงบันทึกการเริ่มต้น Gateway/ข้อความจาก Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการให้แสดงบันทึกการเริ่มต้นทั้งหมดอีกครั้ง
- การหมุนเวียนคีย์ API (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ในรูปแบบคั่นด้วยจุลภาค/อัฒภาค หรือ `*_API_KEY_1`, `*_API_KEY_2` (ตัวอย่างเช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือแทนที่เฉพาะการทดสอบจริงผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อได้รับการตอบกลับว่าถูกจำกัดอัตรา
- ผลลัพธ์ความคืบหน้า/Heartbeat:
  - ชุดการทดสอบจริงส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่ายังทำงานอยู่ระหว่างการเรียกผู้ให้บริการที่ใช้เวลานาน แม้การดักจับคอนโซลของ Vitest จะอยู่ในโหมดเงียบ
  - `test/vitest/vitest.live.config.ts` ปิดการดักจับคอนโซลของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/Gateway แสดงแบบสตรีมทันทีระหว่างการรันจริง
  - ปรับ Heartbeat ของโมเดลโดยตรงด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ Gateway/โพรบด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดการทดสอบใด?

ใช้ตารางการตัดสินใจนี้:

- แก้ไขตรรกะ/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงหลายส่วน)
- แก้ไขเครือข่ายของ Gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก "บอตของฉันใช้งานไม่ได้" / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` โดยจำกัดขอบเขต

## การทดสอบจริง (ที่ติดต่อเครือข่าย)

สำหรับเมทริกซ์โมเดลจริง การตรวจสอบเบื้องต้นของแบ็กเอนด์ CLI การตรวจสอบเบื้องต้นของ ACP ชุดควบคุมเซิร์ฟเวอร์แอป Codex และการทดสอบจริงของผู้ให้บริการสื่อทั้งหมด (Deepgram, BytePlus, ComfyUI รูปภาพ เพลง วิดีโอ และชุดควบคุมสื่อ) รวมถึงการจัดการข้อมูลรับรองสำหรับการรันจริง

- ดู [การทดสอบชุดการทดสอบจริง](/th/help/testing-live) สำหรับรายการตรวจสอบเฉพาะด้านการอัปเดตและการตรวจสอบ Plugin โปรดดู
  [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## ตัวรัน Docker (การตรวจสอบ "ทำงานได้บน Linux" ซึ่งเป็นทางเลือก)

ตัวรัน Docker เหล่านี้แบ่งเป็นสองกลุ่ม:

- ตัวรันโมเดลจริง: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์จริงที่ใช้คีย์โปรไฟล์ซึ่งตรงกันภายในอิมเมจ Docker ของรีโพ (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรีการกำหนดค่าภายในเครื่อง พื้นที่ทำงาน และไฟล์สภาพแวดล้อมของโปรไฟล์ที่เป็นทางเลือก จุดเริ่มต้นภายในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรันจริงของ Docker ยังคงใช้ขีดจำกัดเชิงปฏิบัติของตนเองในจุดที่จำเป็น:
  `test:docker:live-models` ใช้ชุดโมเดลที่รองรับและคัดสรรมาให้สัญญาณสูงเป็นค่าเริ่มต้น และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ตั้งค่า `OPENCLAW_LIVE_MAX_MODELS`
  หรือตัวแปรสภาพแวดล้อมของ Gateway เมื่อคุณต้องการขีดจำกัดที่เล็กลงหรือการสแกนที่กว้างขึ้นโดยชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker สำหรับการทดสอบจริงหนึ่งครั้งผ่าน `test:docker:live-build` แพ็ก OpenClaw หนึ่งครั้งเป็น tarball ของ npm ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/นำอิมเมจ `scripts/e2e/Dockerfile` สองอิมเมจกลับมาใช้ใหม่ อิมเมจพื้นฐานเป็นเพียงตัวรัน Node/Git สำหรับช่องทางการติดตั้ง/อัปเดต/การขึ้นต่อกันของ Plugin โดยช่องทางเหล่านั้นจะเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจเชิงฟังก์ชันจะติดตั้ง tarball เดียวกันลงใน `/app` สำหรับช่องทางการทำงานของแอปที่สร้างแล้ว คำจำกัดความช่องทาง Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` เรียกใช้แผนที่เลือก ตัวรวมใช้ตัวจัดตารางภายในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุมช่องกระบวนการ ขณะที่ขีดจำกัดทรัพยากรป้องกันไม่ให้ช่องทางการทดสอบจริงที่หนัก การติดตั้ง npm และบริการหลายตัวเริ่มพร้อมกันทั้งหมด หากช่องทางใดช่องทางหนึ่งหนักกว่าขีดจำกัดที่ใช้งานอยู่ ตัวจัดตารางยังคงสามารถเริ่มช่องทางนั้นได้เมื่อพูลว่าง แล้วปล่อยให้ทำงานเพียงลำพังจนกว่าจะมีความจุอีกครั้ง ค่าเริ่มต้นคือ 10 ช่อง, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (รวมถึงการแทนที่ `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` อื่น ๆ) เฉพาะเมื่อโฮสต์ Docker มีทรัพยากรสำรองมากขึ้น ตัวรันดำเนินการตรวจสอบ Docker ล่วงหน้าตามค่าเริ่มต้น ลบคอนเทนเนอร์ E2E ของ OpenClaw ที่ค้างอยู่ แสดงสถานะทุก 30 วินาที จัดเก็บเวลาของช่องทางที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่มช่องทางที่ใช้เวลานานกว่าก่อนในการรันครั้งต่อไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อแสดงรายการช่องทางแบบถ่วงน้ำหนักโดยไม่สร้างหรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อแสดงแผน CI สำหรับช่องทางที่เลือก ความต้องการแพ็กเกจ/อิมเมจ และข้อมูลรับรอง
- `Package Acceptance` เป็นเกตแพ็กเกจที่ทำงานโดยตรงบน GitHub สำหรับตรวจสอบว่า "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่?" โดยจะเลือกแพ็กเกจ候选หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url`, `source=trusted-url` หรือ `source=artifact` อัปโหลดเป็น `package-under-test` จากนั้นรันช่องทาง Docker E2E ที่นำกลับมาใช้ใหม่ได้กับ tarball นั้นโดยตรง แทนการแพ็ก ref ที่เลือกใหม่ โปรไฟล์เรียงตามความครอบคลุม ได้แก่ `smoke`, `package`, `product` และ `full` (รวมถึง `custom` สำหรับรายการช่องทางที่ระบุอย่างชัดเจน) ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับสัญญาของแพ็กเกจ/การอัปเดต/Plugin เมทริกซ์การอยู่รอดหลังอัปเกรดเวอร์ชันที่เผยแพร่ ค่าเริ่มต้นของรีลีส และการคัดแยกความล้มเหลว
- การตรวจสอบการสร้างและรีลีสจะรัน `scripts/check-cli-bootstrap-imports.mjs` หลังจาก tsdown ตัวป้องกันจะไล่กราฟบิลด์แบบสแตติกจาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหากกราฟเริ่มต้นก่อนส่งต่อคำสั่งนั้นนำเข้าแพ็กเกจภายนอกแบบสแตติก (Commander, UI พร้อมท์, undici, การบันทึก และการขึ้นต่อกันอื่นที่ทำให้การเริ่มต้นหนักล้วนถูกนับ) ก่อนส่งต่อคำสั่ง นอกจากนี้ยังจำกัดส่วนบันเดิลสำหรับรัน Gateway ไว้ที่ 70 KB และปฏิเสธการนำเข้าแบบสแตติกของเส้นทาง Gateway ที่ทราบว่าใช้งานภายหลัง (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) จากส่วนนั้น `scripts/release-check.ts` จะแยกตรวจสอบเบื้องต้นของ CLI ที่แพ็กแล้วด้วย `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` และ `models list --provider openai`
- ความเข้ากันได้กับระบบเดิมของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึงจุดตัดดังกล่าว ชุดควบคุมจะยอมรับเฉพาะช่องว่างของเมทาดาทาในแพ็กเกจที่เผยแพร่แล้ว ได้แก่ รายการคลัง QA ส่วนตัวที่ถูกละไว้, ไม่มี `gateway install --wrapper`, ไม่มีไฟล์แพตช์ในฟิกซ์เจอร์ Git ที่สร้างจาก tarball, ไม่มี `update.channel` ที่คงอยู่, ตำแหน่งบันทึกการติดตั้ง Plugin แบบเดิม, ไม่มีการคงอยู่ของบันทึกการติดตั้งจากมาร์เก็ตเพลส และการย้ายเมทาดาทาการกำหนดค่าระหว่าง `plugins update` สำหรับแพ็กเกจหลัง `2026.4.25` เส้นทางเหล่านี้จะถือเป็นความล้มเหลวอย่างเคร่งครัด
- ตัวรันตรวจสอบเบื้องต้นของคอนเทนเนอร์: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` จะบูตคอนเทนเนอร์จริงอย่างน้อยหนึ่งตัวและตรวจสอบเส้นทางการผสานรวมระดับสูง
- ช่องทาง Docker/Bash E2E ที่ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วผ่าน `scripts/lib/openclaw-e2e-instance.sh` จำกัดเวลา `npm install` ด้วย `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (ค่าเริ่มต้น `600s`; ตั้งเป็น `0` เพื่อปิดตัวครอบสำหรับการดีบัก)

ตัวรัน Docker สำหรับโมเดลจริงยัง bind-mount เฉพาะโฮมการยืนยันตัวตนของ CLI ที่จำเป็น
(หรือทั้งหมดที่รองรับเมื่อไม่ได้จำกัดขอบเขตการรัน) จากนั้นคัดลอกไปยังโฮมของ
คอนเทนเนอร์ก่อนรัน เพื่อให้ OAuth ของ CLI ภายนอกรีเฟรชโทเค็นได้
โดยไม่แก้ไขที่เก็บการยืนยันตัวตนบนโฮสต์:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- การตรวจสอบการผูก ACP เบื้องต้น: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini เป็นค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- การตรวจสอบแบ็กเอนด์ CLI เบื้องต้น: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- การตรวจสอบชุดควบคุมเซิร์ฟเวอร์แอป Codex เบื้องต้น: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์สำหรับการพัฒนา: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- การตรวจสอบความสามารถในการสังเกตการณ์เบื้องต้น: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` และ `pnpm qa:observability:smoke` เป็นช่องทาง QA ส่วนตัวสำหรับเช็กเอาต์ซอร์ส โดยตั้งใจไม่รวมไว้ในช่องทางรีลีส Docker ของแพ็กเกจ เนื่องจาก tarball ของ npm ไม่รวม QA Lab
- การตรวจสอบจริงของ Open WebUI เบื้องต้น: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- ตัวช่วยเริ่มต้นใช้งาน (TTY, การจัดโครงสร้างครบถ้วน): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- การตรวจสอบการเริ่มต้นใช้งาน/ช่องทาง/เอเจนต์ของ tarball npm เบื้องต้น: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบส่วนกลางใน Docker กำหนดค่า OpenAI ผ่านการเริ่มต้นใช้งานที่อ้างอิงตัวแปรสภาพแวดล้อมพร้อม Telegram เป็นค่าเริ่มต้น รัน doctor และรันเอเจนต์ OpenAI จำลองหนึ่งรอบ ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ข้ามการสร้างใหม่บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยนช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`

- การทดสอบควันเส้นทางผู้ใช้รุ่นเผยแพร่: `pnpm test:docker:release-user-journey` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบส่วนกลางในโฮม Docker ที่สะอาด เรียกใช้การเริ่มต้นใช้งาน กำหนดค่าผู้ให้บริการ OpenAI จำลอง เรียกใช้หนึ่งรอบของเอเจนต์ ติดตั้ง/ถอนการติดตั้ง Plugin ภายนอก กำหนดค่า ClickClack กับฟิกซ์เจอร์ภายในเครื่อง ตรวจสอบการส่งข้อความขาออก/ขาเข้า รีสตาร์ต Gateway และเรียกใช้ doctor
- การทดสอบควันการเริ่มต้นใช้งานแบบมีชนิดสำหรับรุ่นเผยแพร่: `pnpm test:docker:release-typed-onboarding` ติดตั้ง tarball ที่แพ็กแล้ว ควบคุม `openclaw onboard` ผ่าน TTY จริง กำหนดค่า OpenAI เป็นผู้ให้บริการแบบอ้างอิงตัวแปรสภาพแวดล้อม ตรวจสอบว่าไม่มีการเก็บคีย์ดิบอย่างถาวร และเรียกใช้หนึ่งรอบของเอเจนต์จำลอง
- การทดสอบควันสื่อ/หน่วยความจำสำหรับรุ่นเผยแพร่: `pnpm test:docker:release-media-memory` ติดตั้ง tarball ที่แพ็กแล้ว ตรวจสอบความเข้าใจรูปภาพจากไฟล์แนบ PNG ผลลัพธ์การสร้างรูปภาพที่เข้ากันได้กับ OpenAI การเรียกคืนจากการค้นหาหน่วยความจำ และการคงอยู่ของความสามารถในการเรียกคืนหลังรีสตาร์ต Gateway
- การทดสอบควันเส้นทางผู้ใช้อัปเกรดรุ่นเผยแพร่: `pnpm test:docker:release-upgrade-user-journey` โดยค่าเริ่มต้นจะติดตั้งรุ่นฐานที่เผยแพร่ล่าสุดซึ่งเก่ากว่า tarball รุ่นทดสอบ กำหนดค่าสถานะผู้ให้บริการ/Plugin/ClickClack บนแพ็กเกจที่เผยแพร่ อัปเกรดเป็น tarball รุ่นทดสอบ แล้วเรียกใช้เส้นทางหลักของเอเจนต์/Plugin/ช่องทางซ้ำ หากไม่มีรุ่นฐานที่เผยแพร่ซึ่งเก่ากว่า จะใช้เวอร์ชันรุ่นทดสอบซ้ำ กำหนดรุ่นฐานเองด้วย `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`
- การทดสอบควันมาร์เก็ตเพลส Plugin สำหรับรุ่นเผยแพร่: `pnpm test:docker:release-plugin-marketplace` ติดตั้งจากฟิกซ์เจอร์มาร์เก็ตเพลสภายในเครื่อง อัปเดต Plugin ที่ติดตั้ง ถอนการติดตั้ง และตรวจสอบว่า CLI ของ Plugin หายไปพร้อมกับข้อมูลเมตาการติดตั้งที่ถูกตัดออก
- การทดสอบควันการติดตั้ง Skill: `pnpm test:docker:skill-install` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบส่วนกลางใน Docker ปิดใช้งานการติดตั้งอาร์ไคฟ์ที่อัปโหลดในการกำหนดค่า แก้ค่า slug ของ skill สดปัจจุบันจากการค้นหาใน ClawHub ติดตั้งด้วย `openclaw skills install` และตรวจสอบ skill ที่ติดตั้งพร้อมข้อมูลเมตาต้นทาง/ล็อก `.clawhub`
- การทดสอบควันการสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบส่วนกลางใน Docker สลับจากแพ็กเกจ `stable` ไปเป็น git `dev` ตรวจสอบช่องทางที่เก็บไว้อย่างถาวรและการทำงานของ Plugin หลังอัปเดต จากนั้นสลับกลับไปเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- การทดสอบควันความอยู่รอดหลังอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับฟิกซ์เจอร์ผู้ใช้เก่าที่มีสถานะไม่สะอาด ซึ่งมีเอเจนต์ การกำหนดค่าช่องทาง รายการอนุญาตของ Plugin สถานะการพึ่งพาของ Plugin ที่ล้าสมัย และไฟล์เวิร์กสเปซ/เซสชันที่มีอยู่ การทดสอบจะเรียกใช้การอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางจริง จากนั้นเริ่ม Gateway บน local loopback และตรวจสอบการคงอยู่ของการกำหนดค่า/สถานะ รวมถึงงบเวลาการเริ่มทำงาน/สถานะ
- การทดสอบควันความอยู่รอดหลังอัปเกรดจากรุ่นที่เผยแพร่: `pnpm test:docker:published-upgrade-survivor` โดยค่าเริ่มต้นจะติดตั้ง `openclaw@latest` เติมไฟล์ผู้ใช้เดิมที่สมจริง กำหนดค่ารุ่นฐานนั้นด้วยชุดคำสั่งที่ฝังไว้ ตรวจสอบความถูกต้องของการกำหนดค่าที่ได้ อัปเดตการติดตั้งรุ่นที่เผยแพร่นั้นเป็น tarball รุ่นทดสอบ เรียกใช้ doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway บน local loopback และตรวจสอบเจตนาที่กำหนดค่าไว้ การคงอยู่ของสถานะ การเริ่มทำงาน `/healthz`, `/readyz` และงบเวลาสถานะ RPC กำหนดรุ่นฐานหนึ่งรายการเองด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` สั่งให้ตัวจัดตารางแบบรวมขยายรุ่นฐานภายในเครื่องที่ระบุแน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยายฟิกซ์เจอร์ที่จำลองรูปแบบปัญหาด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุดปัญหาที่รายงานมี `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin ภายนอกของ OpenClaw โดยอัตโนมัติ การยอมรับแพ็กเกจเปิดเผยค่าเหล่านี้เป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios` แก้ค่าโทเค็นรุ่นฐานเชิงเมตา เช่น `last-stable-4` หรือ `all-since-2026.4.23` และการตรวจสอบความถูกต้องของรุ่นเผยแพร่เต็มรูปแบบจะขยายเกตแพ็กเกจทดสอบความทนทานของรุ่นเผยแพร่เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- การทดสอบควันบริบทรันไทม์ของเซสชัน: `pnpm test:docker:session-runtime-context` ตรวจสอบการเก็บทรานสคริปต์บริบทรันไทม์ที่ซ่อนไว้อย่างถาวร พร้อมการซ่อมแซมด้วย doctor สำหรับแขนงการเขียนพรอมป์ใหม่ที่ซ้ำกันและได้รับผลกระทบ
- การทดสอบควันการติดตั้งส่วนกลางด้วย Bun: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็กโครงสร้างปัจจุบัน ติดตั้งด้วย `bun install -g` ในโฮมที่แยกออกมา และตรวจสอบว่า `openclaw infer image providers --json` คืนค่าผู้ให้บริการรูปภาพที่รวมมาให้แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ข้ามการสร้างบนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่สร้างแล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบควันตัวติดตั้งใน Docker: `bash scripts/test-install-sh-docker.sh` ใช้แคช npm หนึ่งชุดร่วมกันระหว่างคอนเทนเนอร์ root, update และ direct-npm โดยค่าเริ่มต้น การทดสอบควันการอัปเดตจะใช้ npm `latest` เป็นรุ่นฐานเสถียรก่อนอัปเกรดเป็น tarball รุ่นทดสอบ กำหนดเองภายในเครื่องด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` หรือใช้ข้อมูลนำเข้า `update_baseline_version` ของเวิร์กโฟลว์ Install Smoke บน GitHub การตรวจสอบตัวติดตั้งที่ไม่ใช่ root จะใช้แคช npm ที่แยกออกมา เพื่อไม่ให้รายการแคชที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งภายในของผู้ใช้ ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้แคช root/update/direct-npm ซ้ำในการเรียกใช้ภายในเครื่องครั้งต่อไป
- CI ของ Install Smoke ข้ามการอัปเดตส่วนกลางผ่าน direct-npm ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; เรียกใช้สคริปต์ภายในเครื่องโดยไม่มีตัวแปรสภาพแวดล้อมนี้เมื่อต้องการความครอบคลุมของ `npm install -g` โดยตรง
- การทดสอบควัน CLI สำหรับเอเจนต์ที่ลบเวิร์กสเปซร่วม: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) โดยค่าเริ่มต้นจะสร้างอิมเมจจาก Dockerfile ราก เติมเอเจนต์สองตัวที่ใช้เวิร์กสเปซเดียวกันในโฮมคอนเทนเนอร์ที่แยกออกมา เรียกใช้ `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บเวิร์กสเปซไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway และวงจรชีวิตโฮสต์: `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`) คงการทดสอบควันการตรวจสอบสิทธิ์/สุขภาพ WebSocket ผ่าน LAN แบบสองคอนเทนเนอร์ไว้ จากนั้นใช้ Admin HTTP ผ่าน local loopback เพื่อพิสูจน์การกั้นระหว่างการเตรียม การเข้าถึงการควบคุมที่คงไว้ การกู้คืนด้วยการทำงานต่อ และการหยุด/เริ่มที่เตรียมไว้ภายในคอนเทนเนอร์เดียวกัน การตรวจสอบการรีสตาร์ตต้องเสร็จก่อนสัญญาเช่าเดิมหมดอายุ ตรวจสอบว่าสถานะการระงับเป็นสถานะภายในกระบวนการ ขณะที่การกำหนดค่า Gateway ที่เก็บถาวรและอัตลักษณ์คอนเทนเนอร์ยังคงอยู่ และส่งออก JSON เวลาของแต่ละระยะที่เครื่องอ่านได้
- การทดสอบควันสแนปช็อต CDP ของเบราว์เซอร์: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) สร้างอิมเมจ E2E จากซอร์สพร้อมเลเยอร์ Chromium เริ่ม Chromium ด้วย CDP ดิบ เรียกใช้ `browser doctor --deep` และตรวจสอบว่าสแนปช็อตบทบาท CDP ครอบคลุม URL ของลิงก์ องค์ประกอบที่คลิกได้ซึ่งเลื่อนระดับจากเคอร์เซอร์ การอ้างอิง iframe และข้อมูลเมตาเฟรม
- การทดสอบการถดถอยของ OpenAI Responses `web_search` ด้วยการใช้เหตุผลขั้นต่ำ: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) เรียกใช้เซิร์ฟเวอร์ OpenAI จำลองผ่าน Gateway ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้สคีมาของผู้ให้บริการปฏิเสธและตรวจสอบว่ารายละเอียดดิบปรากฏในบันทึก Gateway
- บริดจ์ช่องทาง MCP (Gateway ที่เติมข้อมูลแล้ว + บริดจ์ stdio + การทดสอบควันเฟรมการแจ้งเตือน Claude ดิบ): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของบันเดิล OpenClaw (เซิร์ฟเวอร์ MCP แบบ stdio จริง + การทดสอบควันรายการอนุญาต/ปฏิเสธของโปรไฟล์ OpenClaw แบบฝัง): `pnpm test:docker:agent-bundle-mcp-tools` (สคริปต์: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- การล้าง MCP ของ Cron/เอเจนต์ย่อย (Gateway จริง + การยุติโพรเซสลูก MCP แบบ stdio หลังการเรียกใช้ Cron ที่แยกออกมาและเอเจนต์ย่อยแบบครั้งเดียว): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (การทดสอบควันการติดตั้ง/อัปเดตสำหรับพาธภายในเครื่อง, `file:`, รีจิสทรี npm ที่มีการยกระดับการพึ่งพา ข้อมูลเมตาแพ็กเกจ npm ที่ผิดรูป การอ้างอิง git ที่เคลื่อนที่ได้ ชุดทดสอบครอบคลุมของ ClawHub การอัปเดตมาร์เก็ตเพลส และการเปิดใช้/ตรวจสอบบันเดิล Claude): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือกำหนดคู่แพ็กเกจ/รันไทม์ชุดทดสอบครอบคลุมเริ่มต้นเองด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ฟิกซ์เจอร์ ClawHub ภายในเครื่องแบบปิดล้อม
- การทดสอบควันการอัปเดต Plugin ที่ไม่มีการเปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบควันเมทริกซ์วงจรชีวิต Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วในคอนเทนเนอร์เปล่า ติดตั้ง Plugin จาก npm สลับเปิด/ปิดใช้งาน อัปเกรดและดาวน์เกรดผ่านรีจิสทรี npm ภายในเครื่อง ลบโค้ดที่ติดตั้ง จากนั้นตรวจสอบว่าการถอนการติดตั้งยังคงลบสถานะเก่า พร้อมบันทึกเมตริก RSS/CPU สำหรับแต่ละระยะของวงจรชีวิต
- การทดสอบควันข้อมูลเมตาการโหลดการกำหนดค่าใหม่: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` ครอบคลุมการทดสอบควันการติดตั้ง/อัปเดตสำหรับพาธภายในเครื่อง, `file:`, รีจิสทรี npm ที่มีการยกระดับการพึ่งพา การอ้างอิง git ที่เคลื่อนที่ได้ ฟิกซ์เจอร์ ClawHub การอัปเดตมาร์เก็ตเพลส และการเปิดใช้/ตรวจสอบบันเดิล Claude `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่มีการเปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง เปิดใช้ ปิดใช้งาน อัปเกรด ดาวน์เกรด และถอนการติดตั้งเมื่อโค้ดหายไปของ Plugin จาก npm พร้อมติดตามทรัพยากร

หากต้องการสร้างล่วงหน้าและใช้อิมเมจฟังก์ชันร่วมซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

ค่ากำหนดอิมเมจเฉพาะชุดทดสอบ เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีลำดับความสำคัญสูงกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจร่วมระยะไกล สคริปต์จะดึงอิมเมจนั้นหากยังไม่มีอยู่ภายในเครื่อง การทดสอบ QR และตัวติดตั้งใน Docker ยังคงใช้ Dockerfile ของตนเอง เพราะตรวจสอบพฤติกรรมแพ็กเกจ/การติดตั้ง ไม่ใช่รันไทม์แอปที่สร้างแล้วร่วมกัน

ตัวเรียกใช้ Docker สำหรับโมเดลจริงยังเมานต์ไดเรกทอรีทำงานปัจจุบันแบบอ่านอย่างเดียว
และจัดเตรียมไว้ในไดเรกทอรีทำงานชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ช่วยให้อิมเมจ
รันไทม์มีขนาดเล็ก ขณะที่ยังเรียกใช้ Vitest กับซอร์ส/การกำหนดค่าภายในเครื่อง
ที่ตรงกันทุกประการ ขั้นตอนการจัดเตรียมจะข้ามแคชขนาดใหญ่ที่มีเฉพาะในเครื่องและผลลัพธ์
การสร้างแอป เช่น `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และ
ไดเรกทอรีผลลัพธ์ `.build` หรือ Gradle ภายในแอป เพื่อให้การเรียกใช้ Docker แบบสดไม่
เสียเวลาหลายนาทีคัดลอกอาร์ติแฟกต์เฉพาะเครื่อง นอกจากนี้ยังตั้งค่า
`OPENCLAW_SKIP_CHANNELS=1` เพื่อให้โพรบ Gateway แบบสดไม่เริ่มเวิร์กเกอร์ช่องทางจริงของ
Telegram/Discord/ฯลฯ ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงเรียกใช้ `pnpm test:live` ดังนั้นให้ส่งต่อ
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อต้องการจำกัดหรือยกเว้นความครอบคลุมแบบสดของ Gateway
จากเลน Docker นั้น

`test:docker:openwebui` เป็นการทดสอบความเข้ากันได้แบบ smoke test ระดับสูงกว่า โดยจะเริ่มคอนเทนเนอร์ Gateway ของ OpenClaw ที่เปิดใช้งานปลายทาง HTTP ซึ่งเข้ากันได้กับ OpenAI จากนั้นเริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันที่ตรึงไว้ให้เชื่อมต่อกับ Gateway ดังกล่าว ลงชื่อเข้าใช้ผ่าน Open WebUI ตรวจสอบว่า `/api/models` แสดง `openclaw/default` แล้วจึงส่งคำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI ตั้งค่า `OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจสอบ CI บนเส้นทางการเผยแพร่ที่ควรหยุดหลังจากลงชื่อเข้าใช้ Open WebUI และค้นพบโมเดลแล้ว โดยไม่รอให้โมเดลจริงสร้างผลลัพธ์ให้เสร็จ การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เนื่องจาก Docker อาจต้องดึงอิมเมจ Open WebUI และ Open WebUI อาจต้องดำเนินการตั้งค่าเริ่มต้นแบบ cold start ของตนให้เสร็จ เลนนี้คาดว่าจะมีคีย์ของโมเดลจริงที่ใช้งานได้ ซึ่งส่งผ่านสภาพแวดล้อมของโพรเซส โปรไฟล์การยืนยันตัวตนที่จัดเตรียมไว้ หรือ `OPENCLAW_PROFILE_FILE` ที่ระบุอย่างชัดเจน การรันที่สำเร็จจะแสดงเพย์โหลด JSON ขนาดเล็ก เช่น `{ "ok": true, "model": "openclaw/default", ... }`

`test:docker:mcp-channels` ถูกออกแบบให้ให้ผลลัพธ์แบบกำหนดแน่นอน และไม่จำเป็นต้องมีบัญชี Telegram, Discord หรือ iMessage จริง โดยจะบูตคอนเทนเนอร์ Gateway ที่มีข้อมูลตั้งต้น เริ่มคอนเทนเนอร์ที่สองซึ่งสร้างโพรเซส `openclaw mcp serve` จากนั้นตรวจสอบการค้นหาบทสนทนาที่กำหนดเส้นทางแล้ว การอ่านทรานสคริปต์ เมทาดาทาของไฟล์แนบ พฤติกรรมของคิวเหตุการณ์แบบสด การกำหนดเส้นทางการส่งขาออก และการแจ้งเตือนช่องทางพร้อมสิทธิ์แบบ Claude ผ่านบริดจ์ MCP แบบ stdio จริง การตรวจสอบการแจ้งเตือนจะตรวจเฟรม MCP แบบ stdio ดิบโดยตรง เพื่อให้ smoke test ตรวจสอบสิ่งที่บริดจ์ส่งออกจริง ไม่ใช่เพียงสิ่งที่ SDK ของไคลเอนต์รายใดรายหนึ่งแสดงให้เห็น

`test:docker:agent-bundle-mcp-tools` ให้ผลลัพธ์แบบกำหนดแน่นอนและไม่จำเป็นต้องมีคีย์ของโมเดลจริง โดยจะสร้างอิมเมจ Docker ของรีโพซิทอรี เริ่มเซิร์ฟเวอร์ตรวจสอบ MCP แบบ stdio จริงภายในคอนเทนเนอร์ ทำให้เซิร์ฟเวอร์ดังกล่าวพร้อมใช้งานผ่านรันไทม์ MCP ของบันเดิล OpenClaw ที่ฝังอยู่ เรียกใช้เครื่องมือ แล้วตรวจสอบว่า `coding` และ `messaging` ยังคงมีเครื่องมือ `bundle-mcp` ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก

`test:docker:cron-mcp-cleanup` ให้ผลลัพธ์แบบกำหนดแน่นอนและไม่จำเป็นต้องมีคีย์ของโมเดลจริง โดยจะเริ่ม Gateway ที่มีข้อมูลตั้งต้นพร้อมเซิร์ฟเวอร์ตรวจสอบ MCP แบบ stdio จริง รันรอบการทำงาน Cron แบบแยกเดี่ยวและรอบการทำงานลูกแบบครั้งเดียวของ `sessions_spawn` จากนั้นตรวจสอบว่าโพรเซสลูก MCP สิ้นสุดหลังการรันแต่ละครั้ง

การทดสอบ smoke test ของเธรด ACP ด้วยภาษาธรรมดาแบบดำเนินการด้วยตนเอง (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์การทดสอบการถดถอย/ดีบัก อาจต้องใช้อีกครั้งในการตรวจสอบความถูกต้องของการกำหนดเส้นทางเธรด ACP ดังนั้นอย่าลบสคริปต์นี้

ตัวแปรสภาพแวดล้อมที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปยัง `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปยัง `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` เมานต์และโหลดเป็นแหล่งข้อมูลก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อยืนยันเฉพาะตัวแปรสภาพแวดล้อมที่โหลดมาจาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรีการกำหนดค่า/พื้นที่ทำงานชั่วคราว และไม่เมานต์การยืนยันตัวตนของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools` เว้นแต่การรันนั้นใช้ไดเรกทอรี bind ของ CI/ที่มีการจัดการอยู่แล้ว) เมานต์ไปยัง `/home/node/.npm-global` สำหรับแคชการติดตั้งเครื่องมือ CLI ภายใน Docker
- ไดเรกทอรี/ไฟล์การยืนยันตัวตนของ CLI ภายนอกภายใต้ `$HOME` จะถูกเมานต์เป็นแบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น (ใช้เมื่อการรันไม่ได้จำกัดไว้เฉพาะผู้ให้บริการบางราย): `.factory`, `.gemini`, `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันที่จำกัดผู้ให้บริการจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - เขียนทับด้วยตนเองโดยใช้ `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการที่คั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรองผู้ให้บริการภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อนำอิมเมจ `openclaw:local-live` ที่มีอยู่กลับมาใช้สำหรับการรันซ้ำที่ไม่จำเป็นต้องสร้างใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่าข้อมูลรับรองมาจากที่เก็บโปรไฟล์ (ไม่ใช่ตัวแปรสภาพแวดล้อม)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ Gateway เปิดให้ใช้สำหรับ smoke test ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อเขียนทับพรอมต์ตรวจสอบ nonce ที่ smoke test ของ Open WebUI ใช้
- `OPENWEBUI_IMAGE=...` เพื่อเขียนทับแท็กอิมเมจ Open WebUI ที่ตรึงไว้

## การตรวจสอบความสมเหตุสมผลของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor แบบเต็มของ Mintlify เมื่อต้องการตรวจสอบหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## การทดสอบการถดถอยแบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็นการทดสอบการถดถอยของ “ไปป์ไลน์จริง” โดยไม่ใช้ผู้ให้บริการจริง:

- การเรียกใช้เครื่องมือของ Gateway (OpenAI จำลอง, Gateway จริง + ลูปเอเจนต์): `src/gateway/gateway.test.ts` (กรณี: "รันการเรียกใช้เครื่องมือ OpenAI จำลองแบบต้นทางถึงปลายทางผ่านลูปเอเจนต์ของ Gateway")
- วิซาร์ดของ Gateway (`wizard.start`/`wizard.next` ผ่าน WS, เขียนการกำหนดค่า + บังคับใช้การยืนยันตัวตน): `src/gateway/gateway.test.ts` (กรณี: "รันวิซาร์ดผ่าน ws และเขียนการกำหนดค่าโทเค็นการยืนยันตัวตน")

## การประเมินความน่าเชื่อถือของเอเจนต์ (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI บางส่วนซึ่งทำงานคล้าย “การประเมินความน่าเชื่อถือของเอเจนต์” อยู่แล้ว:

- การเรียกใช้เครื่องมือจำลองผ่าน Gateway จริง + ลูปเอเจนต์ (`src/gateway/gateway.test.ts`)
- โฟลว์วิซาร์ดแบบต้นทางถึงปลายทางที่ตรวจสอบการเชื่อมโยงเซสชันและผลกระทบต่อการกำหนดค่า (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อพรอมต์แสดงรายการ Skills เอเจนต์เลือก Skills ที่ถูกต้อง (หรือหลีกเลี่ยง Skills ที่ไม่เกี่ยวข้อง) หรือไม่
- **การปฏิบัติตามข้อกำหนด:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/อาร์กิวเมนต์ที่กำหนดหรือไม่
- **สัญญาเวิร์กโฟลว์:** สถานการณ์แบบหลายรอบที่ยืนยันลำดับเครื่องมือ การสืบทอดประวัติเซสชัน และขอบเขตของแซนด์บ็อกซ์

การประเมินในอนาคตควรเริ่มจากการให้ผลลัพธ์แบบกำหนดแน่นอน:

- ตัวรันสถานการณ์ที่ใช้ผู้ให้บริการจำลองเพื่อยืนยันการเรียกใช้เครื่องมือพร้อมลำดับ การอ่านไฟล์ Skills และการเชื่อมโยงเซสชัน
- ชุดสถานการณ์ขนาดเล็กที่มุ่งเน้น Skills (ใช้เทียบกับหลีกเลี่ยง การควบคุมเงื่อนไข และการแทรกคำสั่งในพรอมต์)
- การประเมินแบบสดเพิ่มเติม (เลือกเข้าร่วมและควบคุมด้วยตัวแปรสภาพแวดล้อม) หลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## การทดสอบสัญญา (รูปแบบ Plugin และช่องทาง)

การทดสอบสัญญาจะตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนทุกรายการเป็นไปตามสัญญาอินเทอร์เฟซของตน โดยจะวนผ่าน Plugin ที่ค้นพบทั้งหมดและรันชุดการยืนยันรูปแบบและพฤติกรรม เลนยูนิต `pnpm test` เริ่มต้นจะข้ามไฟล์จุดเชื่อมร่วมและ smoke test เหล่านี้โดยตั้งใจ ให้รันคำสั่งสัญญาอย่างชัดเจนเมื่อแก้ไขพื้นผิวช่องทางหรือผู้ให้บริการที่ใช้ร่วมกัน

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- เฉพาะสัญญาช่องทาง: `pnpm test:contracts:channels`
- เฉพาะสัญญาผู้ให้บริการ: `pnpm test:contracts:plugins`

### สัญญาช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts` หมวดหมู่ระดับบนสุดในปัจจุบัน:

- **แค็ตตาล็อกช่องทาง** - เมทาดาทารายการแค็ตตาล็อกช่องทางแบบรวมมาให้/รีจิสทรี
- **Plugin** (รองรับด้วยรีจิสทรี, แบ่งชาร์ด) - รูปแบบพื้นฐานของการลงทะเบียน Plugin
- **เฉพาะพื้นผิว** (รองรับด้วยรีจิสทรี, แบ่งชาร์ด) - การตรวจสอบรูปแบบแยกตามพื้นผิวสำหรับ `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` และ `gateway`
- **การเชื่อมโยงเซสชัน** (รองรับด้วยรีจิสทรี) - พฤติกรรมการเชื่อมโยงเซสชัน
- **เพย์โหลดขาออก** - โครงสร้างและการปรับให้เป็นมาตรฐานของเพย์โหลดข้อความ
- **นโยบายกลุ่ม** (ทางเลือกสำรอง) - การบังคับใช้นโยบายกลุ่มเริ่มต้นแยกตามช่องทาง
- **การจัดเธรด** (รองรับด้วยรีจิสทรี, แบ่งชาร์ด) - การจัดการรหัสเธรด
- **ไดเรกทอรี** (รองรับด้วยรีจิสทรี, แบ่งชาร์ด) - API ไดเรกทอรี/รายชื่อสมาชิก
- **รีจิสทรี** และ **แกนหลักของ Plugin.\*** - รีจิสทรี Plugin ช่องทาง ตัวโหลด และรายละเอียดภายในของการอนุญาตให้เขียนการกำหนดค่า

ตัวช่วยฮาร์เนสสำหรับจับการส่งต่อขาเข้าและเพย์โหลดขาออกที่ชุดเหล่านี้ใช้ จะเปิดให้ใช้ภายในผ่าน `src/plugin-sdk/channel-contract-testing.ts` (ไม่รวมใน npm และไม่ใช่พาธย่อยของ SDK สาธารณะ) ไม่มีไฟล์ `inbound.contract.test.ts` แยกต่างหากในไดเรกทอรีนี้

### สัญญาผู้ให้บริการ

อยู่ใน `src/plugins/contracts/*.contract.test.ts` หมวดหมู่ปัจจุบันประกอบด้วย:

- **รูปแบบ** - รูปแบบของแมนิเฟสต์ Plugin, API และการส่งออกของรันไทม์
- **การลงทะเบียน Plugin** (+ แบบขนาน) - กรณีการลงทะเบียนแมนิเฟสต์
- **แมนิเฟสต์แพ็กเกจ** - ข้อกำหนดของแมนิเฟสต์แพ็กเกจ
- **ตัวโหลด** - พฤติกรรมการตั้งค่า/รื้อถอนตัวโหลด Plugin
- **รีจิสทรี** - เนื้อหาและการค้นหาในรีจิสทรีสัญญาของ Plugin
- **ผู้ให้บริการ** - พฤติกรรมของผู้ให้บริการที่ใช้ร่วมกันในผู้ให้บริการแบบรวมมาให้ รวมถึงผู้ให้บริการค้นหาเว็บ
- **ตัวเลือกการยืนยันตัวตน** - เมทาดาทาตัวเลือกการยืนยันตัวตนและพฤติกรรมการตั้งค่า
- **การเลิกใช้งานแค็ตตาล็อกผู้ให้บริการ** - เมทาดาทาแค็ตตาล็อกผู้ให้บริการที่เลิกใช้งานแล้ว
- **การแก้ไขตัวเลือกของวิซาร์ด**, **ตัวเลือกโมเดลของวิซาร์ด**, **ตัวเลือกการตั้งค่าของวิซาร์ด** - สัญญาวิซาร์ดการตั้งค่าผู้ให้บริการ
- **ผู้ให้บริการเวกเตอร์ฝัง**, **ผู้ให้บริการเวกเตอร์ฝังของหน่วยความจำ**, **ผู้ให้บริการดึงข้อมูลเว็บ**, **การแปลงข้อความเป็นเสียงพูด** - สัญญาผู้ให้บริการเฉพาะความสามารถ
- **การดำเนินการเซสชัน**, **ไฟล์แนบเซสชัน**, **การฉายภาพรายการเซสชัน** - สัญญาสถานะเซสชันที่ Plugin เป็นเจ้าของ
- **รอบการทำงานตามกำหนดเวลา** - เมทาดาทารอบการทำงานตามกำหนดเวลาของ Plugin และขอบเขตเวลาประทับ
- **ฮุกของโฮสต์**, **วงจรชีวิตบริบทการรัน**, **ผลข้างเคียงจากการนำเข้ารันไทม์**, **จุดเชื่อมรันไทม์** - สัญญาวงจรชีวิตของโฮสต์/รันไทม์ Plugin และขอบเขตการนำเข้า
- **การขึ้นต่อกันของรันไทม์ส่วนขยาย** - ตำแหน่งของการขึ้นต่อกันของรันไทม์สำหรับส่วนขยาย

### ควรรันเมื่อใด

- หลังจากเปลี่ยนการส่งออกหรือพาธย่อยของ plugin-sdk
- หลังจากเพิ่มหรือแก้ไข Plugin ช่องทางหรือผู้ให้บริการ
- หลังจากปรับโครงสร้างการลงทะเบียนหรือการค้นพบ Plugin

การทดสอบสัญญาจะรันใน CI และไม่จำเป็นต้องใช้คีย์ API จริง

## การเพิ่มการทดสอบการถดถอย (แนวทาง)

เมื่อแก้ไขปัญหาของผู้ให้บริการ/โมเดลที่ค้นพบในการทดสอบแบบสด:

- เพิ่มการทดสอบการถดถอยที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (ผู้ให้บริการจำลอง/สตับ หรือจับการแปลงรูปแบบคำขอที่แน่นอน)
- หากปัญหานั้นเกิดได้เฉพาะแบบสดโดยธรรมชาติ (ขีดจำกัดอัตรา นโยบายการยืนยันตัวตน) ให้จำกัดขอบเขตการทดสอบแบบสดและกำหนดให้เลือกเข้าร่วมผ่านตัวแปรสภาพแวดล้อม
- ควรมุ่งเป้าไปยังเลเยอร์ที่เล็กที่สุดซึ่งตรวจพบข้อบกพร่องได้:
  - ข้อบกพร่องในการแปลง/เล่นซ้ำคำขอของผู้ให้บริการ -> การทดสอบโมเดลโดยตรง
  - ข้อบกพร่องของไปป์ไลน์เซสชัน/ประวัติ/เครื่องมือของ Gateway -> smoke test แบบสดของ Gateway หรือการทดสอบจำลอง Gateway ที่ปลอดภัยสำหรับ CI
- กลไกป้องกันการสืบค้น SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะสร้างเป้าหมายตัวอย่างหนึ่งรายการต่อคลาส SecretRef จากเมทาดาทารีจิสทรี (`listSecretTargetRegistryEntries()`) แล้วจึงยืนยันว่ารหัส exec ที่มีส่วนเส้นทางแบบไล่ระดับถูกปฏิเสธ
  - หากเพิ่มตระกูลเป้าหมาย SecretRef ใหม่ที่มี `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในการทดสอบดังกล่าว การทดสอบนี้ตั้งใจให้ล้มเหลวเมื่อพบรหัสเป้าหมายที่ยังไม่ได้จำแนกประเภท เพื่อไม่ให้คลาสใหม่ถูกข้ามโดยไม่มีการแจ้งเตือน

## เนื้อหาที่เกี่ยวข้อง

- [การทดสอบแบบสด](/th/help/testing-live)
- [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)
- [CI](/th/ci)
