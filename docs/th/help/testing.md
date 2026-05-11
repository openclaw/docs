---
read_when:
    - การรันการทดสอบภายในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-11T20:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด runner ของ Docker ขนาดเล็ก เอกสารนี้เป็นคู่มือ “วิธีที่เราทดสอบ”:

- แต่ละชุดทดสอบครอบคลุมอะไรบ้าง (และจงใจ _ไม่_ ครอบคลุมอะไรบ้าง)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบ live ค้นหาข้อมูลประจำตัวและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการที่เกิดขึ้นจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, เลนขนส่ง live)** มีเอกสารแยกไว้ต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียนสถานการณ์
- [Matrix QA](/th/concepts/qa-matrix) - เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ช่องทาง QA](/th/channels/qa-channel) - Plugin ขนส่งสังเคราะห์ที่ใช้โดยสถานการณ์ซึ่งมี repo รองรับ

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ runner ของ Docker/Parallels ส่วน runner เฉพาะ QA ด้านล่าง ([runner เฉพาะ QA](#qa-specific-runners)) แสดงรายการการเรียกใช้ `qa` แบบเป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ในวันส่วนใหญ่:

- gate เต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มรูปแบบในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรพอ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ route path ของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อคุณกำลังวนแก้ความล้มเหลวเดียว ให้เลือกการรันแบบเจาะจงก่อน
- ไซต์ QA ที่มี Docker รองรับ: `pnpm qa:lab:up`
- เลน QA ที่มี Linux VM รองรับ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- gate coverage: `pnpm test:coverage`
- ชุดทดสอบ E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ข้อมูลประจำตัวจริง):

- ชุดทดสอบ live (โมเดล + การ probe เครื่องมือ/รูปภาพของ Gateway): `pnpm test:live`
- ระบุไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพรันไทม์: dispatch `OpenClaw Performance` พร้อม
  `live_gpt54=true` สำหรับรอบ agent จริงของ `openai/gpt-5.4` หรือ
  `deep_profile=true` สำหรับ artifact CPU/heap/trace ของ Kova การรันตามกำหนดการรายวัน
  เผยแพร่ artifact ของเลน mock-provider, deep-profile และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว รายงาน
  mock-provider ยังรวมตัวเลขระดับซอร์สสำหรับการบูต Gateway, หน่วยความจำ,
  plugin-pressure, hello-loop ของ fake-model ซ้ำ และการเริ่มต้น CLI
- การกวาดโมเดล live บน Docker: `pnpm test:docker:live-models`
  - ตอนนี้แต่ละโมเดลที่เลือกจะรันรอบข้อความพร้อม probe ขนาดเล็กแบบอ่านไฟล์
    โมเดลที่ metadata ประกาศว่ารองรับอินพุต `image` จะรันรอบรูปภาพขนาดเล็กด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกความล้มเหลวของผู้ให้บริการ
  - coverage ใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก workflow live/E2E ที่ใช้ซ้ำได้ด้วย
    `include_live_suites: true` ซึ่งรวมงาน matrix ของโมเดล live บน Docker แยกต่างหาก
    ที่ shard ตามผู้ให้บริการ
  - สำหรับการรันซ้ำใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ของผู้ให้บริการที่มีสัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียกตามกำหนดการ/รีลีสของมัน
- smoke ของแชตแบบ bind ของ Codex native: `pnpm test:docker:live-codex-bind`
  - รันเลน live ของ Docker กับ path app-server ของ Codex, bind Slack DM สังเคราะห์ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบ reply ธรรมดาและ route ไฟล์แนบรูปภาพผ่าน binding Plugin native แทน ACP
- smoke ของ harness app-server ของ Codex: `pnpm test:docker:live-codex-harness`
  - รันรอบ agent ของ Gateway ผ่าน harness app-server ของ Codex ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้นจะทดสอบ probe ของรูปภาพ,
    Cron MCP, sub-agent และ Guardian ปิด probe sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกความล้มเหลวอื่นของ
    app-server Codex สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลัง probe sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke การติดตั้ง Codex แบบ on-demand: `pnpm test:docker:codex-on-demand`
  - ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วใน Docker, รัน onboarding ด้วย OpenAI API-key
    และตรวจสอบว่า Plugin Codex พร้อม dependency `@openai/codex`
    ถูกดาวน์โหลดเข้าไปใน npm root ที่จัดการไว้เมื่อต้องใช้
- smoke ของ dependency เครื่องมือ Plugin แบบ live: `pnpm test:docker:live-plugin-tool`
  - แพ็ก Plugin fixture ที่มี dependency `slugify` จริง, ติดตั้งผ่าน
    `npm-pack:`, ตรวจสอบ dependency ใต้ npm root ที่จัดการไว้ จากนั้นขอให้
    โมเดล OpenAI แบบ live เรียกเครื่องมือ Plugin และคืน slug ที่ซ่อนไว้
- smoke คำสั่งกู้ภัย Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in ที่รัดกุมเป็นพิเศษสำหรับพื้นผิวคำสั่งกู้ภัยของ message-channel
    โดยทดสอบ `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบถาวร,
    reply `/crestodian yes` และตรวจสอบ path การเขียน audit/config
- smoke ของ planner Crestodian บน Docker: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม CLI Claude ปลอมบน `PATH`
    และตรวจสอบว่า fallback ของ fuzzy planner แปลเป็นการเขียน config แบบ typed ที่มี audit
- smoke การรันครั้งแรกของ Crestodian บน Docker: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ว่าง, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Plugin Discord + SecretRef,
    ตรวจสอบ config และตรวจสอบรายการ audit path การตั้งค่า Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ค่าใช้จ่าย Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรันแบบแยก
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวหนึ่งกรณี ให้เลือกจำกัดการทดสอบ live ผ่าน env var allowlist ที่อธิบายด้านล่าง
</Tip>

## runner เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงของ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ Agentic parity อยู่ซ้อนอยู่ภายใต้
`QA-Lab - All Lanes` และการตรวจสอบรีลีส ไม่ใช่ workflow PR แบบสแตนด์อโลน
การตรวจสอบกว้างควรใช้ `Full Release Validation` พร้อม
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks การตรวจสอบรีลีสแบบ stable/default
จะเก็บ soak แบบ live/Docker ที่ละเอียดไว้หลัง `run_release_soak=true`; profile
`full` จะบังคับเปิด soak `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch ด้วยเลน mock parity, เลน Matrix live,
เลน Telegram live ที่ Convex จัดการ และเลน Discord live ที่ Convex จัดการ
เป็นงานแบบขนาน QA ตามกำหนดการและ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่า default ของ Matrix CLI และ input ของ manual workflow
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity พร้อมเลน Matrix แบบ fast และ Telegram ก่อนอนุมัติรีลีส
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ transport ของรีลีสเพื่อให้ deterministic
และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway ขนส่ง live เหล่านี้
ปิดการค้นหาหน่วยความจำไว้; พฤติกรรมหน่วยความจำยังคงครอบคลุมโดยชุดทดสอบ QA parity

shard สื่อ live ของรีลีสเต็มรูปแบบใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shard โมเดล/backend แบบ live บน Docker ใช้อิมเมจที่ใช้ร่วมกัน
`ghcr.io/openclaw/openclaw-live-test:<sha>` ซึ่ง build หนึ่งครั้งต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - รันสถานการณ์ QA ที่อิง repo โดยตรงบนโฮสต์
  - รันสถานการณ์ที่เลือกหลายรายการแบบขนานตามค่าเริ่มต้น โดยใช้ worker ของ
    gateway ที่แยกกัน `qa-channel` มีค่าเริ่มต้นเป็น concurrency 4 (จำกัดตามจำนวน
    สถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ lane แบบลำดับเดิม
  - ออกด้วยค่าไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มีรหัสออกที่แสดงความล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai`, และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่อิง AIMock ในเครื่อง สำหรับความครอบคลุม
    fixture และ protocol-mock เชิงทดลอง โดยไม่แทนที่ lane `mock-openai`
    ที่รับรู้สถานการณ์
- `pnpm test:plugins:kitchen-sink-live`
  - รันชุดทดสอบถึกของ Plugin OpenAI Kitchen Sink แบบ live ผ่าน QA Lab โดย
    ติดตั้งแพ็กเกจ Kitchen Sink ภายนอก ตรวจสอบ inventory พื้นผิว plugin SDK
    probe `/healthz` และ `/readyz` บันทึกหลักฐาน CPU/RSS ของ Gateway
    รันหนึ่ง turn OpenAI แบบ live และตรวจสอบ diagnostics เชิงปฏิปักษ์
    ต้องใช้ auth OpenAI แบบ live เช่น `OPENAI_API_KEY` ในเซสชัน Testbox
    ที่ hydrate แล้ว จะ source โปรไฟล์ live-auth ของ Testbox โดยอัตโนมัติเมื่อมี
    helper `openclaw-testbox-env`
- `pnpm test:gateway:cpu-scenarios`
  - รัน benchmark การเริ่มต้น Gateway พร้อมแพ็กสถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวม
    ไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - ตามค่าเริ่มต้นจะ flag เฉพาะการสังเกต CPU ร้อนที่ต่อเนื่อง (`--cpu-core-warn`
    บวก `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ตอนเริ่มต้นจะถูกบันทึกเป็น metrics
    โดยไม่ดูเหมือน regression ที่ทำให้ Gateway ตรึง CPU นานหลายนาที
  - ใช้ artifact `dist` ที่ build แล้ว; รัน build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รันชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์เหมือนกับ `qa suite` บนโฮสต์
  - ใช้ flag การเลือกผู้ให้บริการ/โมเดลชุดเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่อ input auth ของ QA ที่รองรับและเหมาะกับ guest:
    key ผู้ให้บริการแบบ env, path config ผู้ให้บริการ QA live, และ `CODEX_HOME`
    เมื่อมีอยู่
  - ไดเรกทอรี output ต้องอยู่ใต้ root ของ repo เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ได้
  - เขียนรายงาน QA + สรุปตามปกติ รวมถึง log ของ Multipass ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิง Docker สำหรับงาน QA สไตล์ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker รัน onboarding แบบ non-interactive ด้วย OpenAI API key, configure Telegram
    ตามค่าเริ่มต้น, ตรวจสอบว่า runtime ของ Plugin ที่แพ็กมาโหลดได้โดยไม่ต้องซ่อม
    dependency ตอนเริ่มต้น, รัน doctor, และรันหนึ่ง turn ของ agent ในเครื่องกับ
    endpoint OpenAI แบบ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน lane packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน smoke ของ built-app ใน Docker แบบกำหนดแน่นอนสำหรับ transcript ของ embedded runtime context
    โดยตรวจสอบว่า hidden OpenClaw runtime context ถูก persist เป็น custom message
    ที่ไม่แสดงผล แทนที่จะรั่วไปยัง turn ของผู้ใช้ที่มองเห็นได้ จากนั้น seed session JSONL
    ที่เสียหายซึ่งได้รับผลกระทบ และตรวจสอบว่า `openclaw doctor --fix` เขียนใหม่
    ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker, รัน onboarding ของแพ็กเกจที่ติดตั้ง,
    configure Telegram ผ่าน CLI ที่ติดตั้ง จากนั้นใช้ lane QA Telegram แบบ live
    ซ้ำ โดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - wrapper mount เฉพาะ source ของ harness `qa-lab` จาก checkout; แพ็กเกจที่ติดตั้ง
    เป็นเจ้าของ `dist`, `openclaw/plugin-sdk`, และ runtime ของ Plugin ที่ bundle มา
    เพื่อไม่ให้ lane ผสม Plugin จาก checkout ปัจจุบันเข้าไปในแพ็กเกจที่ทดสอบ
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ในเครื่องที่ resolve แล้วแทน
    การติดตั้งจาก registry
  - ใช้ credential env ของ Telegram หรือ source credential Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret ใน CI,
    wrapper Docker จะเลือก Convex โดยอัตโนมัติ
  - wrapper ตรวจสอบ env credential ของ Telegram หรือ Convex บนโฮสต์ก่อน
    งาน Docker build/install ตั้งค่า `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    เฉพาะเมื่อจงใจ debug การตั้งค่าก่อน credential เท่านั้น
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override ค่า shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` สำหรับ lane นี้เท่านั้น
  - GitHub Actions แสดง lane นี้เป็น workflow maintainer แบบ manual
    `NPM Telegram Beta E2E` โดยไม่รันตอน merge workflow ใช้ environment
    `qa-live-shared` และ lease credential Convex CI
- GitHub Actions ยังแสดง `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับแพ็กเกจ candidate หนึ่งรายการ โดยรับ trusted ref, npm spec ที่ publish แล้ว,
  URL tarball HTTPS พร้อม SHA-256, หรือ artifact tarball จาก run อื่น, upload
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test`, จากนั้นรัน
  scheduler Docker E2E ที่มีอยู่ด้วยโปรไฟล์ lane smoke, package, product, full,
  หรือ custom ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน
  workflow QA Telegram กับ artifact `package-under-test` เดียวกัน
  - หลักฐานผลิตภัณฑ์ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- หลักฐาน URL tarball แบบเจาะจงต้องใช้ digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- หลักฐาน artifact download artifact tarball จาก Actions run อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pack และติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker, เริ่ม Gateway
    โดย configure OpenAI แล้วเปิดใช้งาน channel/Plugin ที่ bundle มาผ่านการแก้ไข config
  - ตรวจสอบว่า setup discovery ปล่อยให้ Plugin แบบ downloadable ที่ยังไม่ได้ configure
    ไม่ปรากฏอยู่ การซ่อม doctor ครั้งแรกที่ configure แล้วติดตั้ง Plugin แบบ downloadable
    ที่ขาดแต่ละรายการอย่างชัดเจน และการ restart ครั้งที่สองไม่รันการซ่อม dependency
    ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่รู้จัก, เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>`, และตรวจสอบว่า doctor หลัง update ของ candidate
    ทำความสะอาดเศษ dependency Plugin แบบ legacy โดยไม่ต้องใช้การซ่อม postinstall
    ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดต packaged-install แบบ native ข้าม guest ของ Parallels โดยแต่ละ
    platform ที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งไว้ใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง,
    สถานะการอัปเดต, ความพร้อมของ Gateway, และหนึ่ง turn ของ agent ในเครื่อง
  - ใช้ `--platform macos`, `--platform windows`, หรือ `--platform linux` ขณะ
    iterate กับ guest หนึ่งตัว ใช้ `--json` สำหรับ path artifact สรุปและสถานะ
    ต่อ lane
  - lane OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน agent-turn แบบ live ตาม
    ค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบโมเดล OpenAI อื่น
  - ครอบการรันในเครื่องที่ยาวด้วย timeout ฝั่งโฮสต์ เพื่อไม่ให้ transport stall ของ
    Parallels ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script เขียน log lane แบบ nested ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log`, หรือ `linux-update.log`
    ก่อนสรุปว่า outer wrapper ค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลัง update และการอัปเดต
    แพ็กเกจบน guest ที่เย็น; ยังถือว่าปกติเมื่อ log debug npm แบบ nested
    ยังเดินหน้าอยู่
  - อย่ารัน aggregate wrapper นี้แบบขนานกับ lane smoke ของ Parallels
    macOS, Windows, หรือ Linux รายตัว เพราะใช้สถานะ VM ร่วมกันและอาจชนกันตอน
    restore snapshot, serve package, หรือสถานะ Gateway ของ guest
  - หลักฐานหลัง update รันพื้นผิว Plugin ที่ bundle มาตามปกติ เพราะ capability facade
    เช่น speech, image generation, และ media understanding ถูกโหลดผ่าน API runtime
    ที่ bundle มา แม้ turn ของ agent เองจะตรวจสอบเพียง response ข้อความแบบง่าย

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock ในเครื่องสำหรับการทดสอบ smoke
    protocol โดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane QA Matrix แบบ live กับ homeserver Tuwunel ที่อิง Docker แบบใช้แล้วทิ้ง checkout source เท่านั้น - การติดตั้งแบบแพ็กเกจไม่ได้ ship `qa-lab`
  - CLI แบบเต็ม, catalog profile/สถานการณ์, env var, และ layout artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รัน lane QA Telegram แบบ live กับกลุ่มส่วนตัวจริง โดยใช้ token ของ driver และ SUT bot จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น numeric Telegram chat id
  - รองรับ `--credential-source convex` สำหรับ credential แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env ตามค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ pooled leases
  - ค่าเริ่มต้นครอบคลุม canary, mention gating, command addressing, `/status`, การตอบกลับ bot-to-bot ที่ถูก mention, และการตอบกลับคำสั่ง native core ค่าเริ่มต้น `mock-openai` ยังครอบคลุม regression ของ reply-chain แบบกำหนดแน่นอนและ final-message streaming ของ Telegram ใช้ `--list-scenarios` สำหรับ probe เสริม เช่น `session_status`
  - ออกด้วยค่าไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มีรหัสออกที่แสดงความล้มเหลว
  - ต้องใช้ bot สองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดย SUT bot ต้องเปิดเผย username ของ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสอง และตรวจสอบว่า driver bot สามารถสังเกต traffic bot ในกลุ่มได้
  - เขียนรายงาน QA Telegram, สรุป, และ artifact observed-messages ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับจะรวม RTT จากคำขอส่งของ driver ถึง response จาก SUT ที่สังเกตได้

`Mantis Telegram Live` เป็น wrapper หลักฐาน PR รอบ lane นี้ โดยรัน
candidate ref พร้อม credential Telegram ที่ lease จาก Convex, render transcript
observed-message ที่ redact แล้วใน browser desktop ของ Crabbox, บันทึกหลักฐาน MP4,
สร้าง GIF ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว, upload bundle artifact, และโพสต์หลักฐาน
PR แบบ inline ผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number` maintainer สามารถ
เริ่มได้จาก Actions UI ผ่าน `Mantis Scenario` (`scenario_id:
telegram-live`) หรือโดยตรงจาก comment ใน pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` เป็น wrapper Telegram Desktop แบบ native เชิง agentic
สำหรับหลักฐานภาพก่อน/หลังของ PR เริ่มจาก Actions UI ด้วย
`instructions` แบบ freeform, ผ่าน `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), หรือจาก comment ใน PR:

```text
@Mantis telegram desktop proof
```

เอเจนต์ Mantis อ่าน PR, ตัดสินใจว่าพฤติกรรมที่มองเห็นได้ใน Telegram แบบใดพิสูจน์การเปลี่ยนแปลงได้, รันเลนพิสูจน์ Crabbox Telegram Desktop ด้วยผู้ใช้จริงบน refs baseline และ candidate, ทำซ้ำจนกว่า GIF เนทีฟจะใช้งานได้ดี, เขียน manifest `motionPreview` แบบคู่, และโพสต์ตาราง GIF 2 คอลัมน์เดียวกันผ่าน Mantis GitHub App เมื่อมีการตั้งค่า `pr_number`

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - เช่าหรือใช้เดสก์ท็อป Linux ของ Crabbox ซ้ำ, ติดตั้ง Telegram Desktop เนทีฟ, กำหนดค่า OpenClaw ด้วยโทเค็นบอต Telegram SUT ที่เช่าไว้, เริ่ม Gateway, และบันทึกหลักฐานภาพหน้าจอ/MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้
  - ค่าเริ่มต้นเป็น `--credential-source convex` เพื่อให้เวิร์กโฟลว์ต้องใช้เพียง secret ของ Convex broker ใช้ `--credential-source env` กับตัวแปร `OPENCLAW_QA_TELEGRAM_*` ชุดเดียวกับ `pnpm openclaw qa telegram`
  - Telegram Desktop ยังต้องมีการเข้าสู่ระบบ/โปรไฟล์ผู้ใช้ โทเค็นบอตกำหนดค่าเฉพาะ OpenClaw ใช้ `--telegram-profile-archive-env <name>` สำหรับไฟล์เก็บถาวรโปรไฟล์ `.tgz` แบบ base64 หรือใช้ `--keep-lease` แล้วเข้าสู่ระบบด้วยตนเองผ่าน VNC หนึ่งครั้ง
  - เขียน `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, และ `telegram-desktop-builder.mp4` ไว้ใต้ไดเรกทอรีเอาต์พุต

เลนการขนส่งจริงใช้สัญญามาตรฐานร่วมกันหนึ่งชุดเพื่อไม่ให้ทรานสปอร์ตใหม่เบี่ยงเบน เมทริกซ์ความครอบคลุมต่อเลนอยู่ใน [ภาพรวม QA → ความครอบคลุมการขนส่งจริง](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` เป็นชุดทดสอบสังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
QA การขนส่งจริง, QA lab จะรับ lease แบบเอกสิทธิ์จากพูลที่ใช้ Convex เป็นแบ็กเอนด์, ส่ง Heartbeat ให้
lease นั้นระหว่างที่เลนกำลังรัน, และปล่อย lease เมื่อปิดระบบ ชื่อส่วนนี้มีมาก่อน
การรองรับ Discord, Slack, และ WhatsApp; สัญญา lease ใช้ร่วมกันข้ามชนิด

สแคฟโฟลด์โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับบทบาทที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือกบทบาทข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

ตัวแปร env ทางเลือก:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id ทางเลือก)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ local loopback `http://` สำหรับการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่งผู้ดูแลสำหรับผู้ดูแลโครงการ (เพิ่ม/ลบ/แสดงพูล) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับผู้ดูแลโครงการ:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจสอบ URL ของไซต์ Convex, secret ของ broker,
คำนำหน้า endpoint, HTTP timeout, และการเข้าถึง admin/list โดยไม่พิมพ์
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
- `POST /admin/add` (เฉพาะ secret ของผู้ดูแลโครงการ)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของผู้ดูแลโครงการ)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของผู้ดูแลโครงการ)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปทรง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปทรงนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่มีรูปแบบผิด

รูปทรง payload สำหรับชนิดผู้ใช้จริงของ Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, และ `telegramApiId` ต้องเป็นสตริงตัวเลข
- `tdlibArchiveSha256` และ `desktopTdataArchiveSha256` ต้องเป็นสตริง hex SHA-256
- `kind: "telegram-user"` แทนบัญชี Telegram burner หนึ่งบัญชี ให้ถือว่า lease ครอบคลุมทั้งบัญชี: ไดรเวอร์ TDLib CLI และพยานภาพจาก Telegram Desktop จะกู้คืนจาก payload เดียวกัน และควรมีเพียงงานเดียวที่ถือ lease ในแต่ละครั้ง

การกู้คืน lease ผู้ใช้จริงของ Telegram:

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

ใช้โปรไฟล์ Desktop ที่กู้คืนแล้วกับ `Telegram -workdir "$tmp/desktop"` เมื่อจำเป็นต้องมีการบันทึกภาพ ในสภาพแวดล้อมผู้ปฏิบัติงานภายในเครื่อง, `scripts/e2e/telegram-user-credential.ts` จะอ่าน `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` เป็นค่าเริ่มต้นหากไม่มีตัวแปร env ของกระบวนการ

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

`start` เช่าข้อมูลรับรอง `telegram-user`, กู้คืนบัญชีเดียวกันเข้าใน
TDLib และ Telegram Desktop บนเดสก์ท็อป Linux ของ Crabbox, เริ่ม Gateway SUT จำลองภายในเครื่อง
จาก checkout ปัจจุบัน, เปิดแชต Telegram ที่มองเห็นได้, เริ่ม
การบันทึกเดสก์ท็อป, และเขียน `session.json` แบบส่วนตัว ขณะที่เซสชันยัง
ทำงานอยู่ เอเจนต์สามารถทดสอบต่อจนกว่าจะพอใจได้:

- `send --session <file> --text <message>` ส่งผ่านผู้ใช้ TDLib จริงและรอการตอบกลับจาก SUT
- `run --session <file> -- <remote command>` รันคำสั่งใดก็ได้บน Crabbox และบันทึกเอาต์พุต ตัวอย่างเช่น `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`
- `screenshot --session <file>` จับภาพเดสก์ท็อปที่มองเห็นอยู่ในปัจจุบัน
- `status --session <file>` พิมพ์ lease และคำสั่ง WebVNC
- `finish --session <file>` หยุดเครื่องบันทึก, จับภาพหน้าจอ/วิดีโอ/อาร์ติแฟกต์ motion-trim, ปล่อยข้อมูลรับรอง Convex, หยุดกระบวนการ SUT ภายในเครื่อง, และหยุด lease ของ Crabbox เว้นแต่จะส่ง `--keep-box`
- `publish --session <file> --pr <number>` เผยแพร่คอมเมนต์ PR แบบ GIF เท่านั้นโดยค่าเริ่มต้น ส่ง `--full-artifacts` เฉพาะเมื่อจำเป็นต้องใช้ logs หรืออาร์ติแฟกต์ JSON โดยตั้งใจ

สำหรับการจำลองซ้ำด้านภาพที่กำหนดผลได้ ให้ส่ง `--mock-response-file <path>` ไปยัง `start`
หรือไปยังชวเลขคำสั่งเดียว `probe` runner มีค่าเริ่มต้นเป็นคลาส
Crabbox มาตรฐาน, การบันทึก 24fps, ตัวอย่าง GIF แบบ motion 24fps, และความกว้าง GIF
1920px แทนที่ด้วย `--class`, `--record-fps`, `--preview-fps`, และ
`--preview-width` เฉพาะเมื่อหลักฐานต้องใช้การตั้งค่าการจับภาพที่แตกต่าง

หลักฐาน Crabbox แบบคำสั่งเดียว:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

คำสั่ง `probe` เริ่มต้นเป็นชวเลขสำหรับรอบ start/send/finish หนึ่งรอบ ใช้
สำหรับ smoke `/status` อย่างรวดเร็ว ใช้คำสั่งเซสชันสำหรับการรีวิว PR,
งานทำซ้ำบั๊ก, หรือกรณีใดก็ตามที่เอเจนต์ต้องใช้เวลาหลายนาทีในการ
ทดลองแบบอิสระก่อนตัดสินว่าหลักฐานสมบูรณ์ ใช้ `--id <cbx_...>` เพื่อ
ใช้ lease เดสก์ท็อปที่อุ่นอยู่ซ้ำ, `--keep-box` เพื่อคง VNC ไว้เปิดหลัง finish,
`--desktop-chat-title <name>` เพื่อเลือกแชตที่มองเห็นได้, และ `--tdlib-url <tgz>`
เมื่อใช้ไฟล์เก็บถาวร `libtdjson.so` สำหรับ Linux ที่เตรียมไว้ล่วงหน้าแทนการสร้าง TDLib บน
กล่องใหม่ runner ตรวจสอบ `--tdlib-url` ด้วย `--tdlib-sha256 <hex>` หรือ,
โดยค่าเริ่มต้น, ไฟล์พี่น้อง `<url>.sha256`

payload หลายช่องทางที่ตรวจสอบโดย broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

เลน Slack สามารถเช่าจากพูลได้เช่นกัน แต่การตรวจสอบ payload ของ Slack ในปัจจุบัน
อยู่ใน runner QA ของ Slack แทนที่จะอยู่ใน broker ใช้
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
สำหรับแถว Slack

### การเพิ่มช่องทางเข้า QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement runner การขนส่งบน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, เมานต์เป็น `openclaw qa <runner>`, และเขียน scenarios ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดถึงชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่เจาะจงเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config ต่อโปรเจกต์เพื่อการจัดตารางแบบขนาน
- ไฟล์: อินเวนทอรี core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ภายในกระบวนการ (การยืนยันตัวตน Gateway, การกำหนดเส้นทาง, tooling, การ parse, config)
  - regression ที่กำหนดผลได้สำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้ key จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback กว้างของ `api.js` และ
    `runtime-api.js` ด้วย fixtures Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่ bundled จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดทดสอบสัญญา/integration ที่ Plugin เป็นเจ้าของ

นโยบาย dependency เนทีฟ:

- การติดตั้งทดสอบค่าเริ่มต้นจะข้ามการ build opus แบบ native ที่เป็นทางเลือกของ Discord การรับเสียงของ Discord ใช้ตัวถอดรหัส `opusscript` แบบ pure-JS และ `@discordjs/opus` จะยังถูกปิดใช้ใน `allowBuilds` เพื่อให้การทดสอบในเครื่องและเลน Testbox ไม่คอมไพล์ native addon
- ใช้เลนประสิทธิภาพเสียง Discord หรือเลน live เฉพาะ หากคุณตั้งใจต้องเปรียบเทียบการ build opus แบบ native อย่าตั้งค่า `@discordjs/opus` เป็น `true` ใน `allowBuilds` ค่าเริ่มต้น เพราะจะทำให้รอบติดตั้ง/ทดสอบที่ไม่เกี่ยวข้องต้องคอมไพล์โค้ด native

<AccordionGroup>
  <Accordion title="โปรเจกต์ ชาร์ด และเลนแบบกำหนดขอบเขต">

    - `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิกชาร์ดย่อยสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project แบบ native ขนาดใหญ่ชุดเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลดสูง และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังใช้กราฟโปรเจกต์ `vitest.config.ts` รากแบบ native เพราะลูป watch หลายชาร์ดไม่เหมาะต่อการใช้งานจริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลนแบบกำหนดขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องเสียต้นทุนเริ่มต้นของโปรเจกต์รากทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็นเลนแบบกำหนดขอบเขตราคาถูกโดยค่าเริ่มต้น ได้แก่ การแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สอย่างชัดเจน และ dependent ในกราฟ import เฉพาะที่ การแก้ไขคอนฟิก/เซ็ตอัป/package จะไม่รันทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือเกตตรวจสอบในเครื่องแบบชาญฉลาดตามปกติสำหรับงานขอบเขตแคบ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling แล้วรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อพิสูจน์ด้วยการทดสอบ การ bump เวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจสอบเวอร์ชัน/คอนฟิก/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข harness live Docker ACP จะรันการตรวจสอบแบบโฟกัส ได้แก่ syntax ของ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler live Docker การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่นๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบยูนิตที่ import เบาจาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีล้วนที่คล้ายกัน จะวิ่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มีสถานะหรือพึ่งพา runtime หนักจะยังอยู่บนเลนเดิม
    - ไฟล์ซอร์สตัวช่วยบางรายการของ `plugin-sdk` และ `commands` ยังแมปรันแบบ changed-mode ไปยังการทดสอบพี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ไขตัวช่วยจึงหลีกเลี่ยงการรันชุดทดสอบหนักเต็มชุดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มีบักเก็ตเฉพาะสำหรับตัวช่วย core ระดับบนสุด การทดสอบ integration ระดับบนสุด `reply.*` และซับทรี `src/auto-reply/reply/**` CI ยังแบ่งซับทรี reply เพิ่มเป็นชาร์ด agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้บักเก็ตที่ import หนักชุดเดียวครอบครองส่วนท้าย Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้าม batch sweep ของ extension และชาร์ด `agentic-plugins` ที่ใช้เฉพาะ release การ dispatch แบบ Full Release Validation จะรัน workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="ความครอบคลุมของ embedded runner">

    - เมื่อคุณเปลี่ยน input สำหรับการค้นพบ message-tool หรือ context runtime ของ Compaction
      ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression ของตัวช่วยแบบโฟกัสสำหรับขอบเขตการ routing และ normalization
      แบบล้วน
    - รักษาชุดทดสอบ integration ของ embedded runner ให้พร้อมใช้งาน:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านั้นตรวจสอบว่า scoped id และพฤติกรรม Compaction ยังไหล
      ผ่านพาธจริง `run.ts` / `compact.ts`; การทดสอบเฉพาะตัวช่วย
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของพูล Vitest และการแยก isolation">

    - คอนฟิก Vitest พื้นฐานมีค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้ runner
      แบบไม่แยก isolation ครอบคลุมโปรเจกต์ราก, e2e และคอนฟิก live
    - เลน UI รากยังคงเซ็ตอัป `jsdom` และ optimizer ของตนเองไว้ แต่รันบน
      runner แบบไม่แยก isolation ที่ใช้ร่วมกันเช่นกัน
    - ชาร์ด `pnpm test` แต่ละชุดสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กระบวนการ Node ลูกของ Vitest
      โดยค่าเริ่มต้น เพื่อลดงานคอมไพล์ซ้ำของ V8 ระหว่างการรันขนาดใหญ่ในเครื่อง
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="การวนรอบในเครื่องแบบรวดเร็ว">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใดบ้าง
    - hook pre-commit เป็นเฉพาะการจัดรูปแบบ มันจะ stage ไฟล์ที่จัดรูปแบบแล้วใหม่ และ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งมอบหรือ push เมื่อคุณ
      ต้องการเกตตรวจสอบในเครื่องแบบชาญฉลาด
    - `pnpm test:changed` จะ route ผ่านเลนแบบกำหนดขอบเขตราคาถูกโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract ต้องการ
      ความครอบคลุม Vitest ที่กว้างขึ้นจริงๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่มีเพดาน worker สูงขึ้น
    - การปรับจำนวน worker อัตโนมัติในเครื่องตั้งใจให้ระมัดระวัง และจะลดลง
      เมื่อค่า load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกัน
      จึงสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานกำหนดให้ไฟล์โปรเจกต์/คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำใน changed-mode ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกยังคงเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` บนโฮสต์ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนหนึ่งตำแหน่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักประสิทธิภาพ">

    - `pnpm test:perf:imports` เปิดใช้รายงานระยะเวลา import ของ Vitest พร้อม
      output แบบแจกแจง import
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลา shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็น key; ชาร์ด CI แบบ include-pattern
      จะต่อท้ายชื่อชาร์ดเพื่อให้ติดตามชาร์ดที่ถูกกรองแยกกันได้
    - เมื่อการทดสอบที่ร้อนหนึ่งรายการยังใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam `*.runtime.ts` เฉพาะที่แบบแคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import ตัวช่วย runtime เพียงเพื่อ
      ส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก route กับพาธ root-project แบบ native สำหรับ diff
      ที่ commit แล้วนั้น และพิมพ์ wall time พร้อม macOS max RSS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดย route รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ราก
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ
      startup ของ Vitest/Vite และ overhead ของ transform
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับชุด
      unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### ความเสถียร (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway local loopback จริงโดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ขับเคลื่อน gateway message, memory และ churn ของ payload ขนาดใหญ่แบบสังเคราะห์ผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังคงถูกจำกัดขนาด, ตัวอย่าง RSS สังเคราะห์อยู่ต่ำกว่า pressure budget และความลึกของคิวต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เลนแคบสำหรับการติดตาม stability-regression ไม่ใช่สิ่งทดแทนชุดทดสอบ Gateway เต็มรูปแบบ

### E2E (smoke ของ Gateway)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ bundled-plugin ใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, ในเครื่อง: ค่าเริ่มต้น 1)
  - รันในโหมด silent โดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด output console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม gateway แบบ end-to-end หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ node และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีชิ้นส่วนเคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม gateway OpenShell แบบ isolated บนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile เฉพาะที่ชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรมระบบไฟล์แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องพร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolated จากนั้นทำลาย test gateway และ sandbox
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - "provider/model นี้ใช้งานได้จริง _วันนี้_ กับข้อมูลรับรองจริงหรือไม่?"
  - ตรวจจับการเปลี่ยนแปลงรูปแบบของ provider, ลักษณะเฉพาะของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่ได้ออกแบบมาให้เสถียรระดับ CI (เครือข่ายจริง, นโยบาย provider จริง, โควตา, เหตุขัดข้อง)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันชุดย่อยที่จำกัดขอบเขต แทนการรัน "ทุกอย่าง"
- การรัน live จะ source `~/.profile` เพื่อรับ API key ที่ขาดอยู่
- โดยค่าเริ่มต้น การรัน live ยังคงแยก `HOME` และคัดลอกวัสดุ config/auth ไปยัง test home ชั่วคราว เพื่อให้ unit fixture ไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: ยังคงแสดงผลความคืบหน้า `[live] ...` แต่ระงับประกาศ `~/.profile` เพิ่มเติม และปิดเสียง log การ bootstrap ของ gateway/ข้อความ Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ log ตอนเริ่มต้นแบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อได้รับ response แบบ rate limit
- ผลลัพธ์ความคืบหน้า/Heartbeat:
  - ตอนนี้ suite แบบ live จะส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า call ไปยัง provider ที่ใช้เวลานานยังทำงานอยู่ แม้เมื่อการ capture console ของ Vitest อยู่ในโหมดเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรัน suite ใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนหลายอย่าง)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก "bot ของฉันล่ม" / ความล้มเหลวเฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบ live (ที่แตะเครือข่าย)

สำหรับ live model matrix, smoke ของ CLI backend, smoke ของ ACP, harness ของ Codex app-server
และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - รวมถึงการจัดการข้อมูลรับรองสำหรับการรัน live - ดู
[การทดสอบ suite แบบ live](/th/help/testing-live) สำหรับ checklist เฉพาะด้านการอัปเดตและ
การตรวจสอบ Plugin ดู
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## Docker runner (การตรวจสอบ "ใช้งานได้ใน Linux" แบบไม่บังคับ)

Docker runner เหล่านี้แบ่งเป็นสองกลุ่ม:

- Live-model runner: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายใน Docker image ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount config dir และ workspace ในเครื่องของคุณ (และ source `~/.profile` หากถูก mount) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runner ใช้ smoke cap ที่เล็กกว่าเป็นค่าเริ่มต้นเพื่อให้การ sweep Docker แบบเต็มยังทำได้จริง:
  `test:docker:live-models` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env var เหล่านั้นเมื่อคุณ
  ต้องการสแกนแบบครอบคลุมที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` build Docker image แบบ live หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้น build/นำ image `scripts/e2e/Dockerfile` สองตัวมาใช้ซ้ำ image เปล่าเป็นเพียง runner ของ Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่ build ไว้ล่วงหน้า image แบบ functional ติดตั้ง tarball เดียวกันเข้าไปที่ `/app` สำหรับ lane functionality ของ built-app นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตาม plan ที่เลือก aggregate ใช้ local scheduler แบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม slot ของ process ขณะที่ resource cap ป้องกันไม่ให้ lane แบบ heavy live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่ใช้งานอยู่ scheduler ยังสามารถเริ่ม lane นั้นเมื่อ pool ว่าง แล้วปล่อยให้รันเดี่ยวจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ host ของ Docker มี headroom มากขึ้น runner จะทำ Docker preflight โดยค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บเวลาของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลานั้นเพื่อเริ่ม lane ที่นานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของ lane แบบถ่วงน้ำหนักโดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ plan ของ CI สำหรับ lane ที่เลือก, ความต้องการ package/image และข้อมูลรับรอง
- `Package Acceptance` คือ package gate แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ใช้งานเป็นผลิตภัณฑ์ได้หรือไม่?" โดย resolve package ผู้สมัครหนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, upload เป็น `package-under-test` จากนั้นรัน lane Docker E2E ที่นำกลับมาใช้ซ้ำกับ tarball นั้นโดยตรง แทนการ repack ref ที่เลือก Profile เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับ contract ของ package/update/Plugin, matrix ผู้รอดจาก published-upgrade, ค่าเริ่มต้นของ release และการ triage ความล้มเหลว
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหากการเริ่มต้นก่อน dispatch import dependency ของ package เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; นอกจากนี้ยังคุม bundled gateway run chunk ให้อยู่ในงบประมาณและปฏิเสธ static import ของ cold gateway path ที่รู้จัก smoke ของ packaged CLI ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness จะยอมรับเฉพาะช่องว่าง metadata ของ shipped-package: รายการ private QA inventory ที่ถูกละไว้, `gateway install --wrapper` ที่หายไป, ไฟล์ patch ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่ persist ไว้หายไป, ตำแหน่ง install-record ของ Plugin แบบ legacy, persistence ของ marketplace install-record ที่หายไป และการ migration metadata ของ config ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นจะเป็นความล้มเหลวแบบ strict
- Container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` boot container จริงอย่างน้อยหนึ่งตัวและตรวจสอบ path integration ระดับสูง

Live-model Docker runner ยัง bind-mount เฉพาะ CLI auth home ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน container home ก่อนรัน เพื่อให้ external-CLI OAuth refresh token ได้โดยไม่แก้ไข auth store ของ host:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- smoke สำหรับ ACP bind: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini โดยค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- smoke สำหรับแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- smoke สำหรับ Codex app-server harness: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์ dev: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- smoke สำหรับ Observability: `pnpm qa:otel:smoke` เป็นเลนตรวจสอบซอร์สแบบเช็กเอาต์ QA ส่วนตัว โดยตั้งใจไม่รวมอยู่ในเลนเผยแพร่ Docker ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- smoke แบบสดสำหรับ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- ตัวช่วยสร้าง onboarding (TTY, scaffolding แบบเต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- smoke สำหรับ onboarding/channel/agent ของ npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบอ้างอิง env พร้อม Telegram โดยค่าเริ่มต้น, รัน doctor และรัน mocked OpenAI agent turn หนึ่งครั้ง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการสร้างใหม่บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` หรือ `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`
- smoke สำหรับติดตั้ง Skill: `pnpm test:docker:skill-install` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, ปิดใช้งานการติดตั้ง archive ที่อัปโหลดในการกำหนดค่า, resolve slug ของ Skills สดปัจจุบันจาก ClawHub ผ่านการค้นหา, ติดตั้งด้วย `openclaw skills install` และตรวจสอบ Skills ที่ติดตั้งพร้อม metadata ต้นทาง/lock ของ `.clawhub`
- smoke สำหรับสลับ update channel: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจสอบ channel ที่คงอยู่และงานหลังอัปเดตของ Plugin จากนั้นสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- smoke สำหรับผู้รอดจากการอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าที่สกปรก ซึ่งมีเอเจนต์, การกำหนดค่า channel, allowlist ของ Plugin, สถานะ dependency ของ Plugin ที่ล้าสมัย และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ provider หรือ channel สด จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการเก็บรักษา config/state พร้อมงบเวลา startup/status
- smoke สำหรับผู้รอดจากการอัปเกรดที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น, seed ไฟล์ผู้ใช้ที่มีอยู่จริง, กำหนดค่าค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้, ตรวจสอบการกำหนดค่าที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นไปยัง tarball ผู้สมัคร, รัน doctor แบบไม่โต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intent ที่กำหนดค่าไว้, การเก็บรักษาสถานะ, startup, `/healthz`, `/readyz` และงบเวลา RPC status แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ aggregate scheduler ขยาย baseline ภายในแบบระบุชัดเจนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` และขยาย fixture รูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมการติดตั้ง OpenClaw Plugin ภายนอกโดยอัตโนมัติ Package Acceptance แสดงค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`, resolve token baseline แบบ meta เช่น `last-stable-4` หรือ `all-since-2026.4.23` และ Full Release Validation ขยาย package gate แบบ release-soak เป็น `last-stable-4 2026.4.23 2026.5.2 2026.4.15` พร้อม `reported-issues`
- smoke สำหรับบริบท runtime ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ พร้อมการซ่อมของ doctor สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งได้รับผลกระทบ
- smoke สำหรับการติดตั้งแบบ global ด้วย Bun: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็กต้นไม้ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน provider รูปภาพที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- smoke สำหรับ Installer Docker: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache หนึ่งชุดในคอนเทนเนอร์ root, update และ direct-npm smoke สำหรับอัปเดตใช้ npm `latest` เป็น baseline stable ตามค่าเริ่มต้นก่อนอัปเกรดเป็น tarball ผู้สมัคร แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบ installer แบบ non-root ใช้ npm cache ที่แยกไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำในการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดต direct-npm global ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อต้องการความครอบคลุมของ `npm install -g` โดยตรง
- smoke สำหรับ CLI ลบ workspace ที่แชร์ของ agents: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image จาก Dockerfile รากโดยค่าเริ่มต้น, seed สองเอเจนต์พร้อม workspace หนึ่งรายการใน home ของคอนเทนเนอร์ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ไว้ ใช้ image install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, การยืนยันตัวตน WS + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- smoke สำหรับสแนปช็อต Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E จากซอร์สพร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่า role snapshot ของ CDP ครอบคลุม URL ของลิงก์, clickable ที่ยกระดับจาก cursor, refs ของ iframe และ metadata ของ frame
- regression สำหรับ reasoning ขั้นต่ำของ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI จำลองผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ของ provider ปฏิเสธ และตรวจสอบว่ารายละเอียดดิบปรากฏในบันทึก Gateway
- บริดจ์ MCP channel (Gateway ที่ seed แล้ว + stdio bridge + smoke สำหรับ raw Claude notification-frame): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ Pi bundle (เซิร์ฟเวอร์ MCP stdio จริง + smoke สำหรับโปรไฟล์ Pi แบบ embedded allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้าง Cron/subagent MCP (Gateway จริง + การ teardown ลูก MCP stdio หลังจาก cron ที่แยกไว้และการรัน subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke สำหรับติดตั้ง/อัปเดต local path, `file:`, npm registry พร้อม dependencies ที่ hoist แล้ว, git moving refs, ClawHub kitchen-sink, marketplace updates และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่แพ็กเกจ/runtime kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในที่ปิดล้อม
- smoke สำหรับ Plugin update ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- smoke สำหรับเมทริกซ์ lifecycle ของ Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วในคอนเทนเนอร์เปล่า, ติดตั้ง npm Plugin, สลับ enable/disable, อัปเกรดและดาวน์เกรดผ่าน npm registry ภายใน, ลบโค้ดที่ติดตั้ง จากนั้นตรวจสอบว่า uninstall ยังลบสถานะค้างอยู่ พร้อมบันทึกเมตริก RSS/CPU สำหรับแต่ละช่วง lifecycle
- smoke สำหรับ metadata การ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุม smoke สำหรับติดตั้ง/อัปเดต local path, `file:`, npm registry พร้อม dependencies ที่ hoist แล้ว, git moving refs, fixture ClawHub, marketplace updates และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ Plugins ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง npm Plugin ที่ติดตามทรัพยากร, enable, disable, upgrade, downgrade และ uninstall เมื่อไม่มีโค้ด

หากต้องการ prebuild และใช้ image functional ที่แชร์ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

image override เฉพาะชุดทดสอบ เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง image ที่แชร์จากระยะไกล สคริปต์จะ pull หากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer ยังคงใช้ Dockerfile ของตนเอง เพราะตรวจสอบพฤติกรรม package/install แทนที่จะตรวจ runtime ของ built-app ที่แชร์

Docker runner สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียว และ
stage เข้าไปยัง workdir ชั่วคราวภายใน container ด้วย วิธีนี้ทำให้ runtime
image มีขนาดเล็ก ขณะที่ยังคงรัน Vitest กับ source/config ท้องถิ่นของคุณอย่างตรงกัน
ขั้นตอน staging จะข้าม cache เฉพาะเครื่องขนาดใหญ่และ output จากการ build แอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, และ directory output `.build` เฉพาะแอปหรือ
Gradle เพื่อให้การรัน live ผ่าน Docker ไม่เสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
นอกจากนี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ live probe ของ gateway ไม่เริ่ม
channel worker จริงของ Telegram/Discord/ฯลฯ ภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งต่อ
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น coverage แบบ live ของ gateway
จาก lane ของ Docker นั้น
`test:docker:openwebui` เป็น smoke ด้าน compatibility ระดับสูงกว่า: โดยจะเริ่ม
container ของ OpenClaw gateway พร้อมเปิดใช้งาน HTTP endpoint ที่เข้ากันได้กับ OpenAI,
เริ่ม container ของ Open WebUI เวอร์ชันที่ pin ไว้ให้เชื่อมกับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default`, จากนั้นส่ง
คำขอ chat จริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
ตั้งค่า `OPENWEBUI_SMOKE_MODE=models` สำหรับการตรวจ CI ใน release-path ที่ควรหยุด
หลังจากลงชื่อเข้าใช้ Open WebUI และค้นพบ model โดยไม่ต้องรอ completion จาก live model
การรันครั้งแรกอาจช้าลงอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องทำ cold-start setup ของตัวเองให้เสร็จ
lane นี้ต้องใช้ live model key ที่พร้อมใช้งาน และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดย default) เป็นวิธีหลักในการส่งค่า key นั้นในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ JSON payload ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้ deterministic และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง โดยจะบูต container ของ Gateway ที่ seed ไว้,
เริ่ม container ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบ
การค้นพบการสนทนาแบบ routed, การอ่านข้อความ transcript, metadata ของ attachment,
พฤติกรรม live event queue, routing สำหรับการส่ง outbound, และ notification แบบช่องทาง +
permission สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจ notification
จะตรวจเฟรม stdio MCP ดิบโดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่แค่สิ่งที่ SDK client เฉพาะบางตัวแสดงขึ้นมา
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ live
model key โดยจะ build image Docker ของ repo, เริ่ม server probe แบบ stdio MCP จริง
ภายใน container, materialize server นั้นผ่าน runtime MCP ของ Pi bundle ที่ฝังมา,
เรียกใช้ tool, จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
tool ของ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ live model
key โดยจะเริ่ม Gateway ที่ seed ไว้พร้อม server probe แบบ stdio MCP จริง, รัน
turn ของ cron แบบ isolated และ turn ลูกแบบ one-shot ของ `/subagents spawn`, จากนั้นตรวจสอบว่า
child process ของ MCP ออกหลังการรันแต่ละครั้ง

smoke thread ภาษาธรรมดาของ ACP แบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บ script นี้ไว้สำหรับ workflow regression/debug อาจต้องใช้ซ้ำสำหรับการตรวจสอบ routing ของ thread ACP ดังนั้นอย่าลบ

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ directory config/workspace ชั่วคราวและไม่มี mount สำหรับ auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่ cache ไว้ภายใน Docker
- directory/file auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกไปยัง `/home/node/...` ก่อน tests เริ่ม
  - directory default: `.minimax`
  - file default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะ directory/file ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า credential มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือก model ที่ gateway เปิดเผยสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ใช้โดย smoke ของ Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image ของ Open WebUI ที่ pin ไว้

## ตรวจความถูกต้องของ Docs

รันการตรวจ docs หลังแก้ไขเอกสาร: `pnpm check:docs`.
รันการตรวจ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`.

## Regression แบบ offline (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือ regression ของ "pipeline จริง" โดยไม่มี provider จริง:

- การเรียก tool ของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard ของ Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval ความน่าเชื่อถือของ agent (skills)

เรามี test ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานคล้าย "agent reliability evals":

- Mock tool-calling ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- Flow wizard แบบ end-to-end ที่ตรวจสอบ session wiring และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ skills ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงรายการที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาของ workflow:** scenario แบบหลาย turn ที่ assert ลำดับ tool, การส่งต่อ session history, และขอบเขต sandbox

eval ในอนาคตควรให้ deterministic ก่อน:

- scenario runner ที่ใช้ mock provider เพื่อ assert tool calls + ลำดับ, การอ่านไฟล์ skill, และ session wiring
- ชุด scenario ขนาดเล็กที่เน้น skill (ใช้หรือหลีกเลี่ยง, gating, prompt injection)
- eval แบบ live ที่เป็น optional (opt-in, ควบคุมด้วย env) หลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract tests (รูปทรงของ plugin และ channel)

Contract tests ตรวจสอบว่า plugin และ channel ที่ลงทะเบียนทุกตัวสอดคล้องกับ
interface contract ของตน โดย iterate ผ่าน plugin ทั้งหมดที่ค้นพบและรันชุด
assertion ด้าน shape และ behavior lane unit ของ `pnpm test` ที่เป็น default จะจงใจ
ข้ามไฟล์ seam และ smoke ที่ shared เหล่านี้ ให้รันคำสั่ง contract อย่าง explicit
เมื่อคุณแตะ surface ของ channel หรือ provider ที่ shared

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ contract ของ channel: `pnpm test:contracts:channels`
- เฉพาะ contract ของ provider: `pnpm test:contracts:plugins`

### Contract ของ channel

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรง plugin พื้นฐาน (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง payload ของ message
- **inbound** - การจัดการ message ขาเข้า
- **actions** - handler ของ channel action
- **threading** - การจัดการ Thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้ group policy

### Contract ของ status provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`.

- **status** - probe status ของ channel
- **registry** - รูปทรง registry ของ Plugin

### Contract ของ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของ auth flow
- **auth-choice** - การเลือก/selection ของ auth
- **catalog** - API ของ model catalog
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปทรง/interface ของ Plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ plugin

Contract tests รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่ม regression (คำแนะนำ)

เมื่อคุณแก้ไขปัญหา provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (mock/stub provider, หรือ capture การแปลง request-shape ที่ตรงจุด)
- ถ้าเป็นแบบ live-only โดยธรรมชาติ (rate limits, auth policies) ให้ live test มีขอบเขตแคบและ opt-in ผ่าน env vars
- เลือก layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug ในการแปลง/replay request ของ provider → test models โดยตรง
  - bug ใน pipeline session/history/tool ของ gateway → smoke แบบ live ของ gateway หรือ mock test ของ gateway ที่ปลอดภัยสำหรับ CI
- guardrail สำหรับการ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งตัวต่อคลาส SecretRef จาก registry metadata (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า exec ids แบบ traversal-segment ถูก reject
  - ถ้าคุณเพิ่ม target family ของ SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ใน test นั้น test นี้จงใจ fail เมื่อพบ target ids ที่ยังไม่ได้ classify เพื่อไม่ให้ class ใหม่ถูกข้ามไปอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบ update และ plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
