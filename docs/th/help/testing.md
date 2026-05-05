---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือสำหรับการทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-05T01:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ “วิธีที่เราทดสอบ”:

- แต่ละชุดครอบคลุมอะไร (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- live tests ค้นหาข้อมูลประจำตัวและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่มการทดสอบถดถอยสำหรับปัญหาโมเดล/ผู้ให้บริการที่เกิดขึ้นจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียนสถานการณ์
- [Matrix QA](/th/concepts/qa-matrix) — เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [QA channel](/th/channels/qa-channel) — Plugin ขนส่งจำลองที่ใช้โดยสถานการณ์ที่อ้างอิง repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน QA-specific runners ด้านล่าง ([QA-specific runners](#qa-specific-runners)) แสดงรายการการเรียกใช้ `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ในวันส่วนใหญ่:

- เกตเต็มรูปแบบ (คาดว่าต้องผ่านก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- รันชุดทดสอบเต็มในเครื่องให้เร็วขึ้นบนเครื่องที่มีทรัพยากรเหลือเฟือ: `pnpm test:max`
- วงจร watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ route เส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อกำลังวนแก้ความล้มเหลวเดียว ให้เลือกรันแบบเจาะจงก่อน
- ไซต์ QA ที่ใช้ Docker: `pnpm qa:lab:up`
- เลน QA ที่ใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะ tests หรือต้องการความมั่นใจเพิ่ม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลประจำตัวจริง):

- ชุด live (โมเดล + โพรบเครื่องมือ/ภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพ runtime: dispatch `OpenClaw Performance` ด้วย
  `live_gpt54=true` สำหรับเทิร์น agent จริงของ `openai/gpt-5.4` หรือ
  `deep_profile=true` สำหรับอาร์ติแฟกต์ CPU/heap/trace ของ Kova การรันตามกำหนดรายวัน
  เผยแพร่อาร์ติแฟกต์เลน mock-provider, deep-profile และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว
  รายงาน mock-provider ยังรวมตัวเลขระดับซอร์สของการบูต Gateway, หน่วยความจำ,
  plugin-pressure, fake-model hello-loop ซ้ำ และการเริ่มต้น CLI
- การ sweep โมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกตอนนี้รันเทิร์นข้อความพร้อมโพรบแบบอ่านไฟล์ขนาดเล็ก
    โมเดลที่ metadata ระบุว่ารับอินพุต `image` จะรันเทิร์นภาพขนาดเล็กด้วย
    ปิดโพรบเพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกปัญหาผู้ให้บริการ
  - coverage ใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวมงาน matrix สำหรับ Docker live model
    แยกต่างหากที่ shard ตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secrets ผู้ให้บริการที่มีสัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller
    แบบ scheduled/release ของมัน
- smoke ของ native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รันเลน Docker live กับเส้นทาง Codex app-server, bind Slack DM จำลองด้วย
    `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบ reply ธรรมดาและเส้นทางไฟล์แนบภาพ
    ผ่าน native Plugin binding แทน ACP
- smoke ของ Codex app-server harness: `pnpm test:docker:live-codex-harness`
  - รันเทิร์น Gateway agent ผ่าน harness ของ Codex app-server ที่ Plugin เป็นเจ้าของ
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้นจะทดสอบโพรบภาพ,
    cron MCP, sub-agent และ Guardian ปิดโพรบ sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกความล้มเหลวอื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิดโพรบอื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    คำสั่งนี้จะออกหลังโพรบ sub-agent เว้นแต่ตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke ของคำสั่งช่วยกู้คืน Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in belt-and-suspenders สำหรับพื้นผิวคำสั่งช่วยกู้คืนใน message-channel
    โดยทดสอบ `/crestodian status`, queue การเปลี่ยนโมเดลแบบ persistent,
    reply `/crestodian yes` และตรวจสอบเส้นทางเขียน audit/config
- smoke ของ Crestodian planner บน Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มี config โดยมี Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit แล้ว
- smoke ของ Crestodian first-run บน Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ว่าง, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Discord Plugin + SecretRef,
    ตรวจสอบ config และตรวจสอบรายการ audit เส้นทาง setup เดียวกันของ Ring 0
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวหนึ่งกรณี ให้เลือกจำกัด live tests ผ่าน env vars แบบ allowlist ที่อธิบายด้านล่าง
</Tip>

## QA-specific runners

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงของ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity ซ้อนอยู่ภายใต้
`QA-Lab - All Lanes` และ release validation ไม่ใช่ workflow ของ PR แบบ standalone
การตรวจสอบแบบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจ release
แบบ stable/default เก็บ exhaustive live/Docker soak ไว้หลัง `run_release_soak=true`;
โปรไฟล์ `full` บังคับให้เปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch โดยมีเลน mock parity, เลน live
Matrix, เลน live Telegram ที่ Convex จัดการ และเลน live Discord
ที่ Convex จัดการเป็นงาน parallel Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่า default ของ Matrix CLI และอินพุต workflow
แบบ manual ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli`
`OpenClaw Release Checks` รัน parity พร้อมเลน Matrix และ Telegram แบบ fast
ก่อนการอนุมัติ release โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ release transport
เพื่อให้ deterministic และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway
ของ live transport เหล่านี้ปิด memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด
QA parity

shard ของ full release live media ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shard ของ Docker live model/backend ใช้อิมเมจร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่สร้างหนึ่งครั้งต่อ commit
ที่เลือก จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ build ใหม่
ในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงรีโปโดยตรงบนโฮสต์
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการแบบขนานโดยค่าเริ่มต้นด้วยเวิร์กเกอร์ Gateway ที่แยกกัน `qa-channel` ใช้ค่าพร้อมกันเริ่มต้นเป็น 4 (ถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวนเวิร์กเกอร์ หรือ `--concurrency 1` สำหรับเลนแบบอนุกรมเดิม
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock` `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการภายในเครื่องที่อิง AIMock สำหรับความครอบคลุมของฟิกซ์เจอร์เชิงทดลองและม็อกโปรโตคอล โดยไม่แทนที่เลน `mock-openai` ที่รับรู้สถานการณ์
- `pnpm test:plugins:kitchen-sink-live`
  - เรียกใช้ชุดทดสอบทรหด Plugin Kitchen Sink ของ OpenAI แบบสดผ่าน QA Lab โดยจะติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบสินค้าคงคลังพื้นผิว plugin SDK ตรวจสอบ `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ Gateway เรียกใช้รอบ OpenAI แบบสดหนึ่งรอบ และตรวจสอบการวินิจฉัยแบบเป็นปรปักษ์ ต้องมีการยืนยันตัวตน OpenAI แบบสด เช่น `OPENAI_API_KEY` ในเซสชัน Testbox ที่เติมข้อมูลแล้ว จะโหลดโปรไฟล์การยืนยันตัวตนแบบสดของ Testbox โดยอัตโนมัติเมื่อมีตัวช่วย `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้เบนช์มาร์กการเริ่มต้น Gateway พร้อมแพ็กสถานการณ์ QA Lab แบบม็อกขนาดเล็ก (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวมไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้นจะทำเครื่องหมายเฉพาะการสังเกต CPU สูงต่อเนื่อง (`--cpu-core-warn` พร้อม `--hot-wall-warn-ms`) ดังนั้นการพุ่งสั้นๆ ตอนเริ่มต้นจะถูกบันทึกเป็นเมตริกโดยไม่ดูเหมือนการถดถอยที่ Gateway ตรึง CPU นานหลายนาที
  - ใช้อาร์ติแฟกต์ `dist` ที่สร้างแล้ว ให้รันบิลด์ก่อนเมื่อเช็กเอาต์ยังไม่มีเอาต์พุตรันไทม์ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ชุด QA เดียวกันภายใน VM Linux ของ Multipass แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์เหมือนกับ `qa suite` บนโฮสต์
  - ใช้แฟล็กการเลือกผู้ให้บริการ/โมเดลเดียวกันกับ `qa suite`
  - การรันแบบสดจะส่งต่ออินพุตการยืนยันตัวตน QA ที่รองรับและใช้งานได้จริงสำหรับเกสต์: คีย์ผู้ให้บริการแบบอิง env, พาธคอนฟิกผู้ให้บริการ QA แบบสด และ `CODEX_HOME` เมื่อมี
  - ไดเรกทอรีเอาต์พุตต้องอยู่ใต้รากรีโปเพื่อให้เกสต์เขียนกลับผ่านเวิร์กสเปซที่เมานต์ได้
  - เขียนรายงานและสรุป QA ตามปกติ พร้อมบันทึก Multipass ไว้ใต้ `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิง Docker สำหรับงาน QA แบบโอเปอเรเตอร์
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จากเช็กเอาต์ปัจจุบัน ติดตั้งแบบโกลบอลใน Docker เรียกใช้การเริ่มต้นใช้งานแบบไม่โต้ตอบด้วยคีย์ API ของ OpenAI กำหนดค่า Telegram โดยค่าเริ่มต้น ตรวจสอบว่ารันไทม์ Plugin ที่แพ็กแล้วโหลดได้โดยไม่มีการซ่อมแซม dependency ตอนเริ่มต้น รัน doctor และรันรอบเอเจนต์ภายในเครื่องหนึ่งรอบกับปลายทาง OpenAI ที่ม็อกไว้
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันเลนติดตั้งแพ็กเกจเดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - เรียกใช้การตรวจควัน Docker ของแอปที่บิลด์แล้วแบบกำหนดได้สำหรับทรานสคริปต์บริบทรันไทม์ที่ฝังอยู่ โดยตรวจสอบว่าบริบทรันไทม์ OpenClaw ที่ซ่อนอยู่ถูกคงอยู่เป็นข้อความกำหนดเองที่ไม่แสดงผล แทนที่จะรั่วไปยังรอบผู้ใช้ที่มองเห็นได้ จากนั้น seed JSONL เซสชันเสียที่ได้รับผลกระทบ และตรวจสอบว่า `openclaw doctor --fix` เขียนใหม่ไปยังสาขาที่ใช้งานอยู่พร้อมสำรองข้อมูล
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งแพ็กเกจ OpenClaw ตัวเลือกใน Docker เรียกใช้การเริ่มต้นใช้งานแพ็กเกจที่ติดตั้ง กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นใช้เลน QA ของ Telegram แบบสดซ้ำโดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น Gateway ของ SUT
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในเครื่องที่ resolve แล้วแทนการติดตั้งจากรีจิสทรี
  - ใช้ข้อมูลประจำตัว env ของ Telegram หรือแหล่งข้อมูลประจำตัว Convex เดียวกันกับ `pnpm openclaw qa telegram` สำหรับระบบอัตโนมัติของ CI/รีลีส ให้ตั้งค่า `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม `OPENCLAW_QA_CONVEX_SITE_URL` และ secret ของ role หากมี `OPENCLAW_QA_CONVEX_SITE_URL` และ secret ของ role Convex อยู่ใน CI ตัวครอบ Docker จะเลือก Convex โดยอัตโนมัติ
  - ตัวครอบจะตรวจสอบ env ข้อมูลประจำตัวของ Telegram หรือ Convex บนโฮสต์ก่อนงานบิลด์/ติดตั้ง Docker ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` เฉพาะเมื่อจงใจดีบักการตั้งค่าก่อนข้อมูลประจำตัว
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` จะแทนที่ `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับเลนนี้เท่านั้น
  - GitHub Actions เปิดเผยเลนนี้เป็นเวิร์กโฟลว์ผู้ดูแลแบบแมนนวล `NPM Telegram Beta E2E` เลนนี้ไม่รันเมื่อ merge เวิร์กโฟลว์ใช้สภาพแวดล้อม `qa-live-shared` และลีสข้อมูลประจำตัว CI ของ Convex
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบรันข้างเคียงกับแพ็กเกจตัวเลือกหนึ่งรายการ โดยรับ ref ที่เชื่อถือได้, spec npm ที่เผยแพร่แล้ว, URL tarball แบบ HTTPS พร้อม SHA-256 หรืออาร์ติแฟกต์ tarball จากการรันอื่น อัปโหลด `openclaw-current.tgz` ที่ปรับให้เป็นมาตรฐานเป็น `package-under-test` จากนั้นรันตัวกำหนดตาราง Docker E2E ที่มีอยู่ด้วยโปรไฟล์เลนแบบ smoke, package, product, full หรือ custom ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรันเวิร์กโฟลว์ QA ของ Telegram กับอาร์ติแฟกต์ `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์ของเบต้าล่าสุด:

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

- หลักฐานอาร์ติแฟกต์จะดาวน์โหลดอาร์ติแฟกต์ tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม Gateway โดยกำหนดค่า OpenAI แล้ว จากนั้นเปิดใช้งาน channel/plugins ที่บันเดิลผ่านการแก้ไขคอนฟิก
  - ตรวจสอบว่าการค้นพบการตั้งค่าปล่อยให้ Plugin ที่ดาวน์โหลดได้ซึ่งยังไม่ได้กำหนดค่าขาดหายไป การซ่อมแซม doctor ครั้งแรกที่กำหนดค่าจะติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปแต่ละรายการอย่างชัดเจน และการรีสตาร์ตครั้งที่สองจะไม่รันการซ่อมแซม dependency ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ เปิดใช้งาน Telegram ก่อนรัน `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของตัวเลือกทำความสะอาดเศษ dependency ของ Plugin รุ่นเก่าโดยไม่มีการซ่อมแซม postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - เรียกใช้การตรวจควันการอัปเดตการติดตั้งแพ็กเกจแบบเนทีฟข้ามเกสต์ Parallels แต่ละแพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรันคำสั่ง `openclaw update` ที่ติดตั้งไว้ในเกสต์เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง สถานะการอัปเดต ความพร้อมของ Gateway และรอบเอเจนต์ภายในเครื่องหนึ่งรอบ
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะวนทำงานกับเกสต์หนึ่งรายการ ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุปและสถานะรายเลน
  - เลน OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐานรอบเอเจนต์แบบสดโดยค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบโมเดล OpenAI อื่น
  - ครอบการรันภายในเครื่องที่ยาวด้วย timeout ของโฮสต์ เพื่อไม่ให้การค้างของทรานสปอร์ต Parallels กินเวลาการทดสอบที่เหลือ:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียนบันทึกเลนซ้อนกันไว้ใต้ `/tmp/openclaw-parallels-npm-update.*` ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log` ก่อนสันนิษฐานว่าตัวครอบภายนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลังอัปเดตและการอัปเดตแพ็กเกจบนเกสต์ที่เย็นอยู่ ซึ่งยังถือว่าปกติเมื่อบันทึกดีบัก npm ที่ซ้อนอยู่ยังคืบหน้า
  - อย่ารันตัวครอบแบบรวมนี้ขนานกับเลนตรวจควัน Parallels macOS, Windows หรือ Linux รายตัว พวกมันใช้สถานะ VM ร่วมกันและอาจชนกันในการกู้คืนสแนปช็อต การให้บริการแพ็กเกจ หรือสถานะ Gateway ของเกสต์
  - หลักฐานหลังอัปเดตรันพื้นผิว Plugin ที่บันเดิลตามปกติ เพราะ capability facade เช่น คำพูด การสร้างภาพ และความเข้าใจสื่อถูกโหลดผ่าน API รันไทม์ที่บันเดิล แม้รอบเอเจนต์เองจะตรวจเฉพาะการตอบกลับข้อความแบบง่าย

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ภายในเครื่องสำหรับการตรวจควันโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - เรียกใช้เลน QA ของ Matrix แบบสดกับ Tuwunel homeserver แบบใช้แล้วทิ้งที่อิง Docker เฉพาะเช็กเอาต์ซอร์สเท่านั้น — การติดตั้งแบบแพ็กเกจไม่ได้ส่ง `qa-lab`
  - CLI เต็ม แค็ตตาล็อกโปรไฟล์/สถานการณ์ ตัวแปรสภาพแวดล้อม และเลย์เอาต์อาร์ติแฟกต์: [QA ของ Matrix](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - เรียกใช้เลน QA ของ Telegram แบบสดกับกลุ่มส่วนตัวจริงโดยใช้โทเค็นบอต driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` id ของกลุ่มต้องเป็น id แชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลประจำตัวแบบพูลที่ใช้ร่วมกัน ใช้โหมด env โดยค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ลีสแบบพูล
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
  - ต้องมีบอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้งานโหมด Bot-to-Bot Communication ใน `@BotFather` สำหรับบอตทั้งสอง และตรวจให้แน่ใจว่าบอต driver สามารถสังเกตทราฟฟิกบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และอาร์ติแฟกต์ข้อความที่สังเกตได้ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver ไปจนถึงการตอบกลับของ SUT ที่สังเกตได้

เลนทรานสปอร์ตแบบสดใช้สัญญามาตรฐานเดียวกันเพื่อไม่ให้ทรานสปอร์ตใหม่เบี่ยงเบน เมทริกซ์ความครอบคลุมรายเลนอยู่ใน [ภาพรวม QA → ความครอบคลุมทรานสปอร์ตแบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุดสังเคราะห์แบบกว้างและไม่เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้งาน `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` QA lab จะรับลีสแบบเอกสิทธิ์จากพูลที่อิง Convex ส่ง Heartbeat
ให้ลีสนั้นระหว่างที่เลนกำลังรัน และปล่อยลีสเมื่อปิดตัว

สแกฟโฟลด์โปรเจกต์อ้างอิงของ Convex:

- `qa/convex-credential-broker/`

ตัวแปรสภาพแวดล้อมที่ต้องมี:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของข้อมูลประจำตัว:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นของ env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

ตัวแปรสภาพแวดล้อมทางเลือก:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแลของ maintainer (pool add/remove/list) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจสอบ Convex site URL, broker secrets,
endpoint prefix, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี
CI

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
- `POST /admin/add` (เฉพาะ maintainer secret)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ maintainer secret)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ maintainer secret)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบ payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง id แชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่ม channel ไปยัง QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับ adapter ของ channel ใหม่อยู่ใน [ภาพรวม QA → การเพิ่ม channel](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: ใช้งาน transport runner บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>` และเขียน scenario ภายใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้มองชุดทดสอบเป็น “ระดับความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- คอนฟิก: การรันที่ไม่เจาะจงเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็นคอนฟิกต่อโปรเจกต์เพื่อการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ UI unit ทำงานใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ในโปรเซส (Gateway auth, routing, tooling, parsing, config)
  - regression แบบกำหนดผลได้สำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - ทำงานใน CI
  - ไม่ต้องใช้ key จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback แบบกว้างของ `api.js` และ
    `runtime-api.js` ด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่ bundled จริง การโหลด API ของ Plugin จริงอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="โปรเจกต์, shard และ lane ตามขอบเขต">

    - `pnpm test` ที่ไม่เจาะจงเป้าหมายรันคอนฟิก shard ขนาดเล็กสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนโปรเซสรูทโปรเจกต์ native ขนาดใหญ่หนึ่งชุด วิธีนี้ลด RSS สูงสุดบนเครื่องที่โหลดหนักและป้องกันไม่ให้งาน auto-reply/ส่วนขยายแย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ native root `vitest.config.ts` เพราะ loop watch แบบหลาย shard ใช้งานจริงได้ยาก
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดผ่าน lane ตามขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องจ่ายต้นทุน startup ของรูทโปรเจกต์เต็ม
    - `pnpm test:changed` ขยาย path git ที่เปลี่ยนเป็น lane ตามขอบเขตที่ราคาถูกโดยค่าเริ่มต้น: การแก้ไข test โดยตรง, ไฟล์ sibling `*.test.ts`, mapping ซอร์สที่ระบุชัด และ dependent ใน import-graph แบบ local การแก้ไข config/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบ local อัจฉริยะปกติสำหรับงานแคบ โดยจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling จากนั้นรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดสำหรับหลักฐานการทดสอบ การ bump เวอร์ชันแบบ release metadata-only รันการตรวจสอบ version/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยน package นอก field เวอร์ชันระดับบนสุด
    - การแก้ไข live Docker ACP harness รันการตรวจสอบแบบโฟกัส: syntax ของ shell สำหรับสคริปต์ live Docker auth และ dry-run ของ live Docker scheduler การเปลี่ยน `package.json` จะรวมอยู่เฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และ package-surface อื่น ๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบ unit ที่ import เบาจาก agents, commands, plugins, auto-reply helpers, `plugin-sdk` และพื้นที่ pure utility ที่คล้ายกันจะถูกส่งผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime หนักยังคงอยู่บน lane เดิม
    - ไฟล์ซอร์ส helper ที่เลือกใน `plugin-sdk` และ `commands` ยัง map การรัน changed-mode ไปยังการทดสอบ sibling ที่ระบุชัดใน lane เบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จึงเลี่ยงการรันชุดหนักเต็มสำหรับไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบน, การทดสอบ integration `reply.*` ระดับบน และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply เพิ่มเป็น shard agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักหนึ่งชุดครอบครอง tail ของ Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้ามการ sweep batch ของส่วนขยายและ shard `agentic-plugins` ที่ใช้เฉพาะ release Full Release Validation dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน Plugin/ส่วนขยายเหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="ความครอบคลุมของ embedded runner">

    - เมื่อคุณเปลี่ยน input ของ message-tool discovery หรือ context runtime ของ Compaction
      ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบโฟกัสสำหรับขอบเขต routing และ normalization
      แบบ pure
    - รักษาสุขภาพของชุด integration ของ embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม Compaction ยังคงไหลผ่าน
      path จริงของ `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่ตัวแทนที่เพียงพอสำหรับ path integration เหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ pool และ isolation ของ Vitest">

    - คอนฟิก Vitest พื้นฐานตั้งค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันตรึง `isolate: false` และใช้
      runner แบบไม่แยก isolation ทั่วทั้งรูทโปรเจกต์, e2e และคอนฟิก live
    - lane UI ของรูทยังคงใช้ setup และ optimizer แบบ `jsdom` แต่ก็ทำงานบน
      runner แบบไม่แยก isolation ที่ใช้ร่วมกันเช่นกัน
    - แต่ละ shard ของ `pnpm test` รับค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้โปรเซส Node ลูกของ Vitest
      โดยค่าเริ่มต้นเพื่อลด V8 compile churn ระหว่างการรัน local ขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="การวนทำงาน local ที่รวดเร็ว">

    - `pnpm changed:lanes` แสดง lane สถาปัตยกรรมที่ diff จะกระตุ้น
    - hook pre-commit ทำเฉพาะ formatting มัน restage ไฟล์ที่ format แล้วและ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบ local อัจฉริยะ
    - `pnpm test:changed` ส่งผ่าน lane ตามขอบเขตราคาถูกโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินใจว่าการแก้ไข harness, config, package หรือ contract ต้องการ
      ความครอบคลุม Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing เดิม
      เพียงแต่เพิ่ม worker cap ให้สูงขึ้น
    - การปรับจำนวน worker local อัตโนมัติถูกตั้งใจให้อนุรักษนิยมและจะลดระดับ
      เมื่อค่า load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest
      หลายชุดพร้อมกันจึงก่อผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานระบุ projects/config files เป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำแบบ changed-mode ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกคง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดบนโฮสต์ที่รองรับ
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ชัดเจนหนึ่งตำแหน่งสำหรับ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดการรายงาน import-duration ของ Vitest พร้อมกับ
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไปยัง
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของ shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้ path ของคอนฟิกเป็น key; shard ของ CI แบบ include-pattern
      จะต่อท้ายชื่อ shard เพื่อให้ติดตาม shard ที่ถูกกรองแยกกันได้
    - เมื่อ test ที่ร้อนอยู่ชุดหนึ่งยังคงใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam local `*.runtime.ts` ที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import runtime helper เพียงเพื่อ
      ส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก route กับ path ของรูทโปรเจกต์ native สำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม max RSS บน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดย route รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest รูท
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead ของ startup และ transform ใน Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profile ของ runner สำหรับชุด
      unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### Stability (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงพร้อมเปิด diagnostics โดยค่าเริ่มต้น
  - ขับ churn ของข้อความ Gateway สังเคราะห์, memory และ large-payload ผ่าน path diagnostic event
  - Query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper สำหรับการคงอยู่ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังคงมีขอบเขต, ตัวอย่าง RSS สังเคราะห์อยู่ต่ำกว่า pressure budget และความลึกของ queue ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - lane แคบสำหรับการติดตาม regression ด้าน stability ไม่ใช่ตัวแทนของชุด Gateway เต็ม

### E2E (Gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้นของรันไทม์:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้จำนวน worker แบบปรับตามสภาพแวดล้อม (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมดเงียบโดยค่าเริ่มต้นเพื่อลดภาระ I/O ของคอนโซล
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุตคอนโซลแบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ node และเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนประกอบที่เคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม gateway OpenShell แบบแยกโดดเดี่ยวบน host ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ในเครื่องชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + การ exec ผ่าน SSH
  - ตรวจสอบพฤติกรรมระบบไฟล์แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้องเลือกเปิดใช้เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกโดดเดี่ยว แล้วทำลาย gateway และ sandbox สำหรับทดสอบ
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือสคริปต์ wrapper ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วย credentials จริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ, พฤติกรรมเฉพาะของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ตั้งใจให้อาจไม่เสถียรใน CI (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันเฉพาะ subset ที่แคบลงแทนการรัน “ทุกอย่าง”
- การรัน live source `~/.profile` เพื่อรับ API key ที่ขาดไป
- โดยค่าเริ่มต้น การรัน live ยังแยก `HOME` และคัดลอก config/auth material ไปยัง test home ชั่วคราว เพื่อให้ fixture ของ unit ไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: ยังคงเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ซ่อน notice เพิ่มเติมของ `~/.profile` และปิดเสียง log bootstrap ของ gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้ response แบบ rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ชุด live ปล่อยบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่าการเรียกผู้ให้บริการที่ใช้เวลานานยังทำงานอยู่ แม้เมื่อการ capture คอนโซลของ Vitest เงียบ
  - `vitest.live.config.ts` ปิดการดักคอนโซลของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงมาก)
- แตะเครือข่าย gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก “bot ของฉันล่ม” / failure เฉพาะผู้ให้บริการ / tool calling: รัน `pnpm test:live` ที่จำกัดขอบเขตให้แคบลง

## การทดสอบ Live (ที่แตะเครือข่าย)

สำหรับเมทริกซ์โมเดล live, smoke ของ backend CLI, smoke ของ ACP, harness ของ app-server
Codex และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการ credential สำหรับการรัน live — ดู
[การทดสอบชุด live](/th/help/testing-live) สำหรับ checklist เฉพาะด้านการอัปเดตและ
การตรวจสอบ Plugin ดู
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## runner Docker (การตรวจสอบ "ใช้งานได้ใน Linux" แบบ optional)

runner Docker เหล่านี้แบ่งเป็นสองกลุ่ม:

- runner live-model: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายในอิมเมจ Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount ไดเรกทอรี config และ workspace ในเครื่องของคุณ (และ source `~/.profile` หาก mount อยู่) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- runner live ของ Docker ใช้ smoke cap ที่เล็กกว่าเป็นค่าเริ่มต้น เพื่อให้การ sweep Docker แบบเต็มยังใช้งานได้จริง:
  `test:docker:live-models` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env var เหล่านี้เมื่อคุณ
  ตั้งใจต้องการ scan แบบ exhaustive ที่ใหญ่กว่า
- `test:docker:all` build อิมเมจ Docker สำหรับ live หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น tarball npm ผ่าน `scripts/package-openclaw-for-docker.mjs` แล้ว build/reuse อิมเมจ `scripts/e2e/Dockerfile` สองตัว อิมเมจ bare เป็นเพียง runner Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้า อิมเมจ functional ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane functionality ของ built-app นิยาม lane ของ Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` execute plan ที่เลือก aggregate ใช้ scheduler ในเครื่องแบบมีน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม slot ของ process ขณะที่ resource cap ป้องกันไม่ให้ lane live, npm-install และ multi-service ที่หนักเริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่ใช้งานอยู่ scheduler ยังสามารถเริ่ม lane นั้นได้เมื่อ pool ว่าง แล้วปล่อยให้รันเดี่ยวต่อไปจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ host Docker มี headroom มากขึ้น runner ทำ Docker preflight โดยค่าเริ่มต้น, ลบ container E2E ของ OpenClaw ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่นานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane แบบมีน้ำหนักโดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ plan ของ CI สำหรับ lane ที่เลือก, ความต้องการ package/image และ credential
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานในฐานะ product ได้หรือไม่?" โดย resolve candidate package หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` แล้วรัน lane Docker E2E ที่ reuse ได้กับ tarball นั้นพอดี แทนการ pack ref ที่เลือกใหม่ Profile เรียงตามความกว้าง: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับ contract ของ package/update/plugin, เมทริกซ์ survivor ของ published-upgrade, ค่าเริ่มต้นของ release และการ triage failure
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard เดินกราฟ build แบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหาก startup import ก่อน dispatch ดึง dependency ของ package เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; นอกจากนี้ยังรักษาขนาด chunk การรัน gateway ที่ bundle ให้อยู่ใต้ budget และปฏิเสธ static import ของ path gateway cold ที่รู้จัก smoke ของ CLI ที่ package แล้วยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้ย้อนหลังของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness ยอมรับเฉพาะช่องว่าง metadata ของ shipped-package: รายการ private QA inventory ที่ถูก omit, `gateway install --wrapper` ที่หายไป, patch file ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่ persist หายไป, ตำแหน่ง install-record ของ Plugin แบบ legacy, การ persist install-record ของ marketplace ที่หายไป และการ migrate metadata ของ config ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นเป็น failure แบบ strict
- runner smoke ของ container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` boot container จริงอย่างน้อยหนึ่งตัวและตรวจสอบ path การ integrate ระดับสูงกว่า

runner Docker ของ live-model ยัง bind-mount เฉพาะ home auth ของ CLI ที่ต้องใช้ (หรือทุกตัวที่รองรับเมื่อการรันไม่ได้จำกัดขอบเขต) แล้วคัดลอกเข้าไปใน home ของ container ก่อนรัน เพื่อให้ OAuth ของ external-CLI refresh token ได้โดยไม่แก้ไข auth store ของ host:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini โดยค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์ dev: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` เป็นเลนตรวจสอบซอร์สแบบ private QA source-checkout โดยตั้งใจไม่รวมอยู่ในเลนเผยแพร่ Docker ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ดการเริ่มต้นใช้งาน (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่านการเริ่มต้นใช้งานแบบ env-ref รวมถึง Telegram โดยค่าเริ่มต้น, รัน doctor และรัน mocked OpenAI agent turn หนึ่งครั้ง ใช้ tarball ที่สร้างไว้แล้วซ้ำได้ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยนช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจาก package `stable` ไปเป็น git `dev`, ตรวจสอบ channel ที่ persist ไว้และการทำงานหลังอัปเดตของ Plugin แล้วสลับกลับไปเป็น package `stable` และตรวจสอบสถานะการอัปเดต
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าที่ไม่สะอาด ซึ่งมีเอเจนต์, การกำหนดค่า channel, plugin allowlists, สถานะ stale plugin dependency และไฟล์ workspace/session ที่มีอยู่แล้ว จากนั้นรัน package update พร้อม doctor แบบ non-interactive โดยไม่มี live provider หรือ channel keys แล้วเริ่ม Gateway แบบ loopback และตรวจสอบการคงค่า config/state รวมถึงงบประมาณ startup/status
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น, seed ไฟล์ผู้ใช้ที่มีอยู่จริงสมจริง, กำหนดค่า baseline นั้นด้วย baked command recipe, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้ง published นั้นไปยัง candidate tarball, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json` แล้วเริ่ม Gateway แบบ loopback และตรวจสอบ intents ที่กำหนดค่าไว้, การคงสถานะ, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC override baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ aggregate scheduler ขยาย baseline ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `all-since-2026.4.23` และขยาย fixture ตามรูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin OpenClaw ภายนอกแบบอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`; Full Release Validation ใช้ baseline latest ตามค่าเริ่มต้นในเส้นทาง blocking และขยายเป็น all-since/reported-issues เฉพาะสำหรับ `run_release_soak=true` หรือ `release_profile=full`
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` ตรวจสอบการ persist transcript ของ hidden runtime context รวมถึงการซ่อมแซมโดย doctor สำหรับ branch prompt-rewrite ที่ซ้ำซ้อนและได้รับผลกระทบ
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกออกมา และตรวจสอบว่า `openclaw infer image providers --json` คืนค่า bundled image providers แทนที่จะค้าง ใช้ tarball ที่สร้างไว้แล้วซ้ำได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่สร้างไว้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache เดียวร่วมกันในคอนเทนเนอร์ root, update และ direct-npm ของมัน Update smoke ใช้ npm `latest` เป็น stable baseline โดยค่าเริ่มต้นก่อนอัปเกรดไปยัง candidate tarball override ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบ installer แบบ non-root ใช้ npm cache ที่แยกออกมา เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำระหว่างการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดต direct-npm global ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องมีการครอบคลุม direct `npm install -g`
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) สร้างอิมเมจ root Dockerfile โดยค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อม workspace หนึ่งรายการใน home ของคอนเทนเนอร์ที่แยกออกมา, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องรวมถึงพฤติกรรมการคง workspace ไว้ ใช้อิมเมจ install-smoke ซ้ำได้ด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- Gateway networking (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) สร้างอิมเมจ source E2E พร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย raw CDP, รัน `browser doctor --deep` และตรวจสอบว่า CDP role snapshots ครอบคลุม link URLs, clickables ที่ cursor-promoted, iframe refs และ frame metadata
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รัน mocked OpenAI server ผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ provider schema reject และตรวจสอบว่า raw detail ปรากฏใน log ของ Gateway
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ Pi bundle (เซิร์ฟเวอร์ stdio MCP จริง + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้าง Cron/subagent MCP (Gateway จริง + การ teardown ของ stdio MCP child หลังการรัน cron แบบ isolated และ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke สำหรับ local path, `file:`, npm registry ที่มี hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates และ Claude-bundle enable/inspect): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่ package/runtime แบบ kitchen-sink เริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ในเครื่องแบบ hermetic
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วในคอนเทนเนอร์เปล่า, ติดตั้ง npm Plugin, toggle enable/disable, อัปเกรดและดาวน์เกรดผ่าน local npm registry, ลบโค้ดที่ติดตั้งไว้ จากนั้นตรวจสอบว่า uninstall ยังลบ stale state พร้อมบันทึก metrics RSS/CPU สำหรับแต่ละ phase ของ lifecycle
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุม install/update smoke สำหรับ local path, `file:`, npm registry ที่มี hoisted dependencies, git moving refs, ClawHub fixtures, marketplace updates และ Claude-bundle enable/inspect `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรม unchanged update สำหรับ Plugin ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุม npm Plugin install, enable, disable, upgrade, downgrade และ missing-code uninstall พร้อมติดตามทรัพยากร

เพื่อ prebuild และใช้ functional image ที่ใช้ร่วมกันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

image overrides เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังมีผลเหนือกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจ shared ระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ QR และ installer Docker ยังคงใช้ Dockerfile ของตัวเอง เพราะตรวจสอบพฤติกรรม package/install ไม่ใช่ runtime ของ built-app ที่ใช้ร่วมกัน

ตัวรัน Docker สำหรับโมเดลแบบไลฟ์ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวและ
stage เข้าไปใน workdir ชั่วคราวภายใน container ด้วย วิธีนี้ทำให้ runtime
image มีขนาดเล็ก ในขณะที่ยังรัน Vitest กับ source/config ในเครื่องของคุณอย่างตรงตัว
ขั้นตอน staging จะข้าม cache ขนาดใหญ่ที่มีเฉพาะในเครื่องและ output จากการ build แอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี `.build` เฉพาะแอปหรือ
ไดเรกทอรี output ของ Gradle เพื่อให้การรัน Docker live ไม่เสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
ตัวรันเหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้การ probe Gateway แบบไลฟ์ไม่เริ่ม
worker ของช่องทาง Telegram/Discord/ฯลฯ จริงภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อต้องการจำกัดหรือยกเว้น coverage แบบไลฟ์ของ Gateway
จาก lane Docker นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ระดับสูงกว่า โดยเริ่ม
container ของ OpenClaw gateway พร้อม endpoint HTTP ที่เข้ากันได้กับ OpenAI ที่เปิดใช้งาน
เริ่ม container ของ Open WebUI เวอร์ชันที่ pin ไว้ให้เชื่อมกับ gateway นั้น ลงชื่อเข้าใช้ผ่าน
Open WebUI ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` จากนั้นส่ง
คำขอ chat จริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
lane นี้คาดว่าจะมี key ของโมเดลไลฟ์ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) เป็นวิธีหลักในการจัดเตรียม key นั้นในการรันผ่าน Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้ deterministic โดยตั้งใจและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง โดยจะบูต container ของ Gateway ที่ seed ไว้
เริ่ม container ตัวที่สองซึ่ง spawn `openclaw mcp serve` จากนั้นตรวจสอบ
การค้นพบ conversation ที่ถูก route แล้ว การอ่าน transcript, metadata ของ attachment,
พฤติกรรม queue ของ event แบบไลฟ์, routing สำหรับการส่ง outbound และ notification แบบช่องทาง +
permission สไตล์ Claude ผ่าน bridge stdio MCP จริง การตรวจสอบ notification
จะตรวจ frame stdio MCP ดิบโดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่
bridge emit จริง ไม่ใช่เพียงสิ่งที่ SDK client เฉพาะตัวหนึ่งบังเอิญแสดงออกมา
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ key ของโมเดลไลฟ์
โดยจะ build image Docker ของ repo เริ่ม probe server stdio MCP จริง
ภายใน container, materialize server นั้นผ่าน runtime MCP ของ bundle Pi ที่ฝังไว้
เรียกใช้ tool จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคง
tool `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรอง tool เหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ key ของโมเดลไลฟ์
โดยจะเริ่ม Gateway ที่ seed ไว้พร้อม probe server stdio MCP จริง รัน
turn ของ cron แบบ isolated และ turn ลูกแบบ one-shot ผ่าน `/subagents spawn` จากนั้นตรวจสอบว่า
process ลูกของ MCP ออกจากการทำงานหลังการรันแต่ละครั้ง

smoke thread ภาษาธรรมดาของ ACP แบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บ script นี้ไว้สำหรับ workflow regression/debug อาจต้องใช้อีกครั้งสำหรับการตรวจสอบ routing ของ thread ACP ดังนั้นอย่าลบทิ้ง

env var ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปยัง `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปยัง `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปยัง `/home/node/.profile` และ source ก่อนรัน test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อยืนยันเฉพาะ env var ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี mount auth CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปยัง `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่ cache ไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่ม test
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override เองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่ซ้ำสำหรับการ rerun ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway เปิดเผยสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt สำหรับตรวจ nonce ที่ smoke ของ Open WebUI ใช้
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image ของ Open WebUI ที่ pin ไว้

## การตรวจ sanity ของเอกสาร

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจ anchor ของ Mintlify แบบเต็มเมื่อต้องตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Offline regression (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็น regression “pipeline จริง” ที่ไม่มี provider จริง:

- การเรียก tool ของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard ของ Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## eval ความน่าเชื่อถือของ Agent (skills)

เรามี test ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำงานเหมือน “eval ความน่าเชื่อถือของ agent”:

- การเรียก tool แบบ mock ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- flow wizard แบบ end-to-end ที่ตรวจสอบการเชื่อม session และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมี skills อยู่ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงสิ่งที่ไม่เกี่ยวข้องหรือไม่)
- **การปฏิบัติตามข้อกำหนด:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่
- **สัญญาของ workflow:** scenario หลาย turn ที่ assert ลำดับ tool, การส่งต่อประวัติ session และขอบเขต sandbox

eval ในอนาคตควรให้ deterministic เป็นอันดับแรก:

- scenario runner ที่ใช้ mock provider เพื่อ assert การเรียก tool + ลำดับ, การอ่านไฟล์ skill และการเชื่อม session
- ชุด scenario ขนาดเล็กที่เน้น skill (ใช้กับหลีกเลี่ยง, gating, prompt injection)
- eval แบบไลฟ์ที่เป็น optional (opt-in, ควบคุมด้วย env) เฉพาะหลังจากมี suite ที่ปลอดภัยสำหรับ CI แล้ว

## Contract tests (รูปร่างของ Plugin และช่องทาง)

Contract tests ตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนทุกตัวสอดคล้องกับ
interface contract ของตน โดยจะ iterate ผ่าน Plugin ที่ค้นพบทั้งหมดและรันชุดของ
assertion ด้านรูปร่างและพฤติกรรม lane unit ของ `pnpm test` ค่าเริ่มต้นตั้งใจ
ข้ามไฟล์ smoke และ shared seam เหล่านี้ ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะ surface ของช่องทางหรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ contract ของช่องทาง: `pnpm test:contracts:channels`
- เฉพาะ contract ของ provider: `pnpm test:contracts:plugins`

### Contract ของช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรมการ bind session
- **outbound-payload** - โครงสร้าง payload ของ message
- **inbound** - การจัดการ message ขาเข้า
- **actions** - handler action ของช่องทาง
- **threading** - การจัดการ thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Contract สถานะของ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - probe สถานะช่องทาง
- **registry** - รูปร่าง registry ของ Plugin

### Contract ของ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของ flow auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - Model catalog API
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังเพิ่มหรือแก้ไขช่องทางหรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ issue ของ provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากทำได้ (mock/stub provider หรือ capture การแปลง request-shape ที่ตรงตัว)
- หากเป็น live-only โดยธรรมชาติ (rate limit, นโยบาย auth) ให้ test แบบไลฟ์แคบและ opt-in ผ่าน env var
- ควร target layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug การแปลง/replay request ของ provider → test models โดยตรง
  - bug pipeline session/history/tool ของ gateway → smoke gateway แบบไลฟ์หรือ mock test ของ gateway ที่ปลอดภัยสำหรับ CI
- Guardrail การ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งตัวต่อ class ของ SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`) จากนั้น assert ว่า exec id ที่เป็น traversal-segment ถูก reject
  - หากคุณเพิ่มตระกูล target ของ SecretRef ที่มี `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ใน test นั้น test นี้ตั้งใจ fail เมื่อ target id ไม่ถูกจัด class เพื่อให้ class ใหม่ไม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)
- [CI](/th/ci)
