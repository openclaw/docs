---
read_when:
    - การรันการทดสอบภายในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-30T09:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (ยูนิต/อินทิเกรชัน, e2e, live) และชุด Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และตั้งใจ _ไม่_ ครอบคลุมอะไรบ้าง)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- การทดสอบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการที่เกิดขึ้นจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, ช่องทางขนส่ง live)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) — ข้อมูลอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ช่องทาง QA](/th/channels/qa-channel) — Plugin ขนส่งสังเคราะห์ที่ใช้โดย scenario ที่อิงกับ repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runners เฉพาะ QA ด้านล่าง ([runners เฉพาะ QA](#qa-specific-runners)) แสดงคำสั่ง `qa` ที่เป็นรูปธรรมและชี้กลับไปยังข้อมูลอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยทั่วไป:

- gate แบบเต็ม (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรพอ: `pnpm test:max`
- วงจร watch ของ Vitest โดยตรง: `pnpm test:watch`
- การเจาะไฟล์โดยตรงตอนนี้ route เส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- เมื่อคุณกำลังวนแก้ failure เดียว ให้เลือกการรันแบบเจาะจงก่อน
- ไซต์ QA ที่มี Docker รองรับ: `pnpm qa:lab:up`
- ช่องทาง QA ที่มี Linux VM รองรับ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่มเติม:

- gate ความครอบคลุม: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องมีข้อมูลรับรองจริง):

- ชุด live (โมเดล + การ probe เครื่องมือ/รูปภาพของ gateway): `pnpm test:live`
- เจาะไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- การ sweep โมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกตอนนี้รันหนึ่ง turn ข้อความพร้อม probe ขนาดเล็กแบบอ่านไฟล์
    โมเดลที่ metadata ประกาศ input แบบ `image` จะรัน turn รูปภาพขนาดเล็กด้วย
    ปิด probe เพิ่มเติมได้ด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกวิเคราะห์ failure ของผู้ให้บริการ
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก workflow live/E2E ที่ใช้ซ้ำได้ด้วย
    `include_live_suites: true` ซึ่งรวม jobs เมทริกซ์โมเดล live ของ Docker แยกต่างหาก
    ที่แบ่ง shard ตามผู้ให้บริการ
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secrets ของผู้ให้บริการที่มีสัญญาณสูงรายการใหม่ไปที่ `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller
    แบบ scheduled/release ของมัน
- smoke การ bound-chat ของ Native Codex: `pnpm test:docker:live-codex-bind`
  - รันช่องทาง live ของ Docker กับ path app-server ของ Codex, bind Slack DM สังเคราะห์ด้วย
    `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นยืนยัน reply ธรรมดาและ attachment รูปภาพ
    route ผ่านการ binding ของ Plugin แบบ native แทน ACP
- smoke harness ของ Codex app-server: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turns ผ่าน harness ของ Codex app-server ที่ Plugin เป็นเจ้าของ,
    ยืนยัน `/codex status` และ `/codex models` และโดยค่าเริ่มต้นทดสอบ probe ของรูปภาพ,
    cron MCP, sub-agent และ Guardian ปิด probe ของ sub-agent ได้ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกวิเคราะห์ failure อื่นของ Codex
    app-server สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probe อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    คำสั่งนี้จะออกหลัง probe ของ sub-agent เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke คำสั่ง rescue ของ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in ที่เพิ่มความรอบคอบสำหรับพื้นผิวคำสั่ง rescue ของ message-channel
    โดยทดสอบ `/crestodian status`, ต่อคิวการเปลี่ยนโมเดลแบบ persistent,
    reply `/crestodian yes` และยืนยัน path การเขียน audit/config
- smoke Docker ของ Crestodian planner: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และยืนยันว่า fallback ของ fuzzy planner แปลงเป็นการเขียน config แบบ typed ที่ถูก audit แล้ว
- smoke Docker ของ first-run ใน Crestodian: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก state dir ว่างของ OpenClaw, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Discord plugin + SecretRef,
    ตรวจสอบ config และยืนยัน audit entries path การตั้งค่า Ring 0 เดียวกันนี้
    ครอบคลุมใน QA Lab ด้วยโดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ต้นทุน Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ยืนยันว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียง case ที่ fail หนึ่งรายการ ให้เลือกจำกัดการทดสอบ live ผ่าน env vars แบบ allowlist ที่อธิบายด้านล่าง
</Tip>

## runners เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ `Parity gate` รันบน PR ที่ตรงเงื่อนไขและ
จาก manual dispatch พร้อมผู้ให้บริการ mock `QA-Lab - All Lanes` รันทุกคืนบน
`main` และจาก manual dispatch พร้อม mock parity gate, ช่องทาง Matrix live,
ช่องทาง Telegram live ที่ Convex จัดการ และช่องทาง Discord live ที่ Convex จัดการเป็น
jobs แบบขนาน Scheduled QA และ release checks ส่ง Matrix `--profile fast`
อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ input workflow แบบ manual ยังคงเป็น
`all`; manual dispatch สามารถแบ่ง shard `all` เป็น jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release Checks` รัน parity พร้อม
ช่องทาง Matrix และ Telegram แบบ fast ก่อนอนุมัติ release โดยใช้
`mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ deterministic
และเลี่ยง startup ปกติของ provider-plugin Gateway ขนส่ง live เหล่านี้ปิด
memory search; พฤติกรรม memory ยังคงครอบคลุมโดยชุด QA parity

shards live media แบบ release เต็มใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shards โมเดล/backend live ของ Docker ใช้ image ร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build หนึ่งครั้งต่อ commit
ที่เลือก แล้ว pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ในทุก shard

- `pnpm openclaw qa suite`
  - รัน scenario QA ที่อิงกับ repo โดยตรงบน host
  - รัน scenario ที่เลือกหลายรายการแบบขนานโดยค่าเริ่มต้นด้วย gateway workers ที่แยกกัน
    `qa-channel` ค่าเริ่มต้นเป็น concurrency 4 (จำกัดด้วยจำนวน scenario ที่เลือก)
    ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1`
    สำหรับช่องทาง serial แบบเก่า
  - ออกด้วย non-zero เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
  - รองรับโหมดผู้ให้บริการ `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่ม server ผู้ให้บริการที่มี AIMock รองรับในเครื่องสำหรับความครอบคลุม
    fixture และ protocol-mock แบบทดลอง โดยไม่แทนที่ช่องทาง `mock-openai`
    ที่รู้จัก scenario
- `pnpm test:gateway:cpu-scenarios`
  - รัน bench startup ของ gateway พร้อมชุด scenario QA Lab mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU รวมไว้ใต้
    `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้นจะแจ้งเฉพาะการสังเกต CPU ร้อนที่ต่อเนื่อง (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น burst สั้น ๆ ระหว่าง startup จะถูกบันทึกเป็น metrics
    โดยไม่ดูเหมือน regression ที่ gateway peg นานหลายนาที
  - ใช้ artifacts `dist` ที่ build แล้ว; ให้รัน build ก่อนเมื่อ checkout ยังไม่มี
    runtime output ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รันชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือก scenario แบบเดียวกับ `qa suite` บน host
  - ใช้ flags การเลือกผู้ให้บริการ/โมเดลแบบเดียวกับ `qa suite`
  - การรัน live forward input auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    provider keys ผ่าน env, path config ผู้ให้บริการ live ของ QA และ `CODEX_HOME`
    เมื่อมีอยู่
  - output dirs ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ได้
  - เขียนรายงาน + สรุป QA ปกติ พร้อม logs ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่มี Docker รองรับสำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - build tarball npm จาก checkout ปัจจุบัน, ติดตั้งแบบ global ใน
    Docker, รัน onboarding OpenAI API-key แบบ non-interactive, config Telegram
    โดยค่าเริ่มต้น, ยืนยันว่าการเปิดใช้ Plugin ติดตั้ง runtime dependencies
    ตามต้องการ, รัน doctor และรัน agent turn ในเครื่องหนึ่งครั้งกับ endpoint OpenAI ที่ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรันช่องทาง packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน smoke Docker ของ built-app แบบ deterministic สำหรับ transcripts ของ runtime context
    แบบฝัง โดยยืนยันว่า runtime context ที่ซ่อนอยู่ของ OpenClaw ถูก persist เป็น
    custom message แบบไม่แสดงผล แทนการรั่วไปยัง user turn ที่มองเห็นได้
    จากนั้น seed JSONL ของ session ที่เสียหายซึ่งได้รับผลกระทบและยืนยันว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง branch ที่ active พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง candidate package ของ OpenClaw ใน Docker, รัน onboarding ของ installed-package,
    config Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นใช้ช่องทาง QA Telegram live
    ซ้ำโดยใช้ package ที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นเป็น `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ในเครื่องที่ resolve แล้วแทนการ
    ติดตั้งจาก registry
  - ใช้ข้อมูลรับรอง env ของ Telegram หรือแหล่งข้อมูลรับรอง Convex แบบเดียวกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI,
    wrapper Docker จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override ค่า shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` สำหรับช่องทางนี้เท่านั้น
  - GitHub Actions เปิดเผยช่องทางนี้เป็น workflow maintainer แบบ manual
    `NPM Telegram Beta E2E` มันไม่รันเมื่อ merge workflow ใช้ environment
    `qa-live-shared` และ leases ข้อมูลรับรอง Convex CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับหลักฐานผลิตภัณฑ์แบบ side-run
  กับ candidate package หนึ่งรายการ โดยรับ ref ที่เชื่อถือได้, spec npm ที่ publish แล้ว,
  URL tarball HTTPS พร้อม SHA-256 หรือ artifact tarball จาก run อื่น, upload
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  scheduler Docker E2E ที่มีอยู่ด้วย profile ช่องทาง smoke, package, product, full หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน workflow QA Telegram
  กับ artifact `package-under-test` เดียวกัน
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

- หลักฐาน artifact จะดาวน์โหลด artifact แบบ tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker เริ่ม Gateway
    พร้อมกำหนดค่า OpenAI แล้วเปิดใช้ช่องทาง/Plugin ที่รวมมาด้วยผ่านการแก้ไข config
  - ตรวจสอบว่าการค้นพบการตั้งค่าทิ้ง dependencies ของรันไทม์ Plugin
    ที่ยังไม่ได้กำหนดค่าให้ไม่มีอยู่ การรัน Gateway หรือ doctor ครั้งแรกที่กำหนดค่าแล้วติดตั้ง
    dependencies ของรันไทม์สำหรับ Plugin ที่รวมมาด้วยแต่ละตัวตามต้องการ และการรีสตาร์ทครั้งที่สองไม่
    ติดตั้ง dependencies ที่ถูกเปิดใช้งานแล้วซ้ำ
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ซ่อมแซม dependencies ของรันไทม์ช่องทางที่รวมมาด้วยได้โดยไม่ต้องมีการซ่อมแซม postinstall ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke สำหรับการอัปเดตการติดตั้งแพ็กเกจแบบ native ข้าม guest ของ Parallels แต่ละ
    แพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรันคำสั่ง
    `openclaw update` ที่ติดตั้งไว้ใน guest เดียวกัน และตรวจสอบ
    เวอร์ชันที่ติดตั้ง สถานะการอัปเดต ความพร้อมของ Gateway และ agent turn ภายในเครื่องหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะ
    ทำซ้ำกับ guest หนึ่งตัว ใช้ `--json` สำหรับพาธ artifact สรุปและ
    สถานะราย lane
  - lane ของ OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน agent-turn แบบ live โดย
    ค่าเริ่มต้น ส่ง `--model <provider/model>` หรือกำหนด
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อตั้งใจตรวจสอบโมเดล OpenAI อื่น
  - ครอบการรันภายในเครื่องที่ใช้เวลานานด้วย timeout ฝั่ง host เพื่อไม่ให้การค้างของ transport Parallels
    ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียนบันทึก lane แบบซ้อนภายใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจดู `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีใน doctor หลังอัปเดต/การซ่อมแซม
    dependency ของรันไทม์บน guest ที่ยังเย็นอยู่ ซึ่งยังถือว่าปกติเมื่อบันทึก debug ของ
    npm แบบซ้อนยังคืบหน้าอยู่
  - อย่ารัน wrapper รวมนี้พร้อมกันกับ lane smoke ของ Parallels
    macOS, Windows หรือ Linux แบบแยก พวกมันใช้สถานะ VM ร่วมกันและอาจชนกันใน
    การกู้คืน snapshot การให้บริการแพ็กเกจ หรือสถานะ Gateway ของ guest
  - หลักฐานหลังอัปเดตรันพื้นผิว Plugin ที่รวมมาด้วยตามปกติ เพราะ
    capability facade เช่น speech, image generation และ media
    understanding ถูกโหลดผ่าน API รันไทม์ที่รวมมาด้วย แม้ว่า agent
    turn เองจะตรวจเพียงการตอบกลับข้อความธรรมดา

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ภายในเครื่องสำหรับการทดสอบ smoke
    โปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane QA แบบ live ของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่รองรับด้วย Docker เฉพาะ source-checkout เท่านั้น — การติดตั้งแบบแพ็กเกจไม่ได้ส่ง `qa-lab`
  - CLI แบบเต็ม แค็ตตาล็อก profile/scenario, env vars และโครงร่าง artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รัน lane QA แบบ live ของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้โทเค็นบอตของ driver และ SUT จาก env
  - ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` id กลุ่มต้องเป็น id แชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลประจำตัวที่ใช้ร่วมกันแบบ pooled ใช้โหมด env เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบ pooled
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องใช้บอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อให้การสังเกตบอตต่อบอตเสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับบอตทั้งสองตัว และตรวจสอบว่าบอต driver สามารถสังเกตทราฟฟิกบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram สรุป และ artifact observed-messages ภายใต้ `.artifacts/qa-e2e/...` scenario การตอบกลับรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับ SUT ที่สังเกตเห็น

lane transport แบบ live ใช้สัญญามาตรฐานเดียวกันเพื่อไม่ให้ transport ใหม่เบี่ยงเบน เมทริกซ์ความครอบคลุมราย lane อยู่ใน [ภาพรวม QA → ความครอบคลุม transport แบบ live](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุดทดสอบสังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` แล้ว QA lab จะได้รับ lease แบบเอกสิทธิ์จาก pool ที่รองรับด้วย Convex ส่ง Heartbeat
ให้ lease นั้นขณะ lane กำลังรัน และปล่อย lease เมื่อปิดระบบ

โครง scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env vars ที่ต้องใช้:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของข้อมูลประจำตัว:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นจาก env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI และเป็น `maintainer` ในกรณีอื่น)

env vars ที่ไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex `http://` แบบ loopback สำหรับการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานตามปกติ

คำสั่ง admin ของ maintainer (เพิ่ม/ลบ/แสดงรายการ pool) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจ URL ของไซต์ Convex, broker secrets,
endpoint prefix, HTTP timeout และความสามารถในการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี้ CI

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
- `POST /admin/add` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - guard สำหรับ lease ที่ active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับ kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง id แชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มช่องทางไปยัง QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับ channel adapter ใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement transport runner บน host seam `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>` และเขียน scenario ภายใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้คิดว่าชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่ได้กำหนดเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard หลายโปรเจกต์เป็น config รายโปรเจกต์สำหรับการจัดกำหนดการแบบขนาน
- ไฟล์: inventory core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ใน process (auth ของ Gateway, routing, tooling, parsing, config)
  - regression แบบ deterministic สำหรับบั๊กที่ทราบ
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ของซอร์ส Plugin ที่รวมมาด้วยจริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดทดสอบ contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="โปรเจกต์, shard และ lane ที่กำหนดขอบเขต">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิกชาร์ดย่อยสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project แบบเนทีฟขนาดใหญ่เพียงชุดเดียว วิธีนี้ลดค่า RSS สูงสุดบนเครื่องที่มีโหลด และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจนชุดทดสอบที่ไม่เกี่ยวข้องทำงานช้า
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจ็กต์ root แบบเนทีฟ `vitest.config.ts` เพราะลูป watch หลายชาร์ดไม่เหมาะกับการใช้งานจริง
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลนตามขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงหลีกเลี่ยงค่าเริ่มต้นของโปรเจ็กต์ root ทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนไปเป็นเลนตามขอบเขตราคาถูกโดยค่าเริ่มต้น: การแก้ไขเทสต์โดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน และ dependents จากกราฟอิมพอร์ตภายใน การแก้ไข config/setup/package จะไม่รันเทสต์แบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือเกตตรวจสอบแบบสมาร์ตในเครื่องตามปกติสำหรับงานขอบเขตแคบ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling จากนั้นรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รัน Vitest tests; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อใช้เป็นหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจสอบ version/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยน package นอกฟิลด์ version ระดับบนสุด
    - การแก้ไข harness ของ live Docker ACP จะรันการตรวจสอบแบบโฟกัส: ไวยากรณ์ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler live Docker การเปลี่ยน `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่นๆ ยังคงใช้ guard ที่กว้างกว่า
    - เทสต์หน่วยแบบ import-light จาก agents, commands, plugins, helper ของ auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีบริสุทธิ์ที่คล้ายกันจะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มีสถานะหรือพึ่งพา runtime หนักยังคงอยู่บนเลนเดิม
    - ไฟล์ซอร์ส helper ที่เลือกไว้บางส่วนใน `plugin-sdk` และ `commands` ยังแมปรันแบบ changed-mode ไปยังเทสต์พี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จึงไม่ต้องรันชุดทดสอบหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มีบักเก็ตเฉพาะสำหรับ helper core ระดับบน, เทสต์ integration `reply.*` ระดับบน และซับทรี `src/auto-reply/reply/**` CI ยังแบ่งซับทรี reply เป็นชาร์ด agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้บักเก็ตที่ import หนักเพียงชุดเดียวถือครองช่วงท้ายของ Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้ามการ sweep แบบ batch ของ extension และชาร์ด release-only `agentic-plugins` การ dispatch ของ Full Release Validation จะเรียกเวิร์กโฟลว์ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidates

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยนอินพุตสำหรับการค้นพบ message-tool หรือบริบท runtime ของ Compaction
      ให้รักษาความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression helper แบบโฟกัสสำหรับขอบเขตการ routing และ normalization
      ที่เป็น pure logic
    - รักษา integration suites ของ embedded runner ให้ทำงานได้ดี:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม Compaction ยังคงไหลผ่าน
      พาธจริงของ `run.ts` / `compact.ts`; เทสต์เฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest ฐานใช้ค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้ runner
      แบบไม่แยก isolation ในโปรเจ็กต์ root, คอนฟิก e2e และ live
    - เลน UI ของ root ยังคงใช้การตั้งค่าและ optimizer ของ `jsdom` แต่ก็รันบน
      runner แบบไม่แยก isolation ที่ใช้ร่วมกันเช่นกัน
    - ชาร์ด `pnpm test` แต่ละชุดสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กับกระบวนการ Node ลูกของ Vitest
      โดยค่าเริ่มต้น เพื่อลด churn ของการคอมไพล์ V8 ระหว่างการรันขนาดใหญ่ในเครื่อง
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff ทริกเกอร์เลนสถาปัตยกรรมใดบ้าง
    - pre-commit hook ทำเฉพาะการจัดรูปแบบ มัน restage ไฟล์ที่จัดรูปแบบแล้ว และ
      ไม่รัน lint, typecheck หรือ tests
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่อหรือ push เมื่อคุณ
      ต้องการเกตตรวจสอบแบบสมาร์ตในเครื่อง
    - `pnpm test:changed` จะ routing ผ่านเลนตามขอบเขตราคาถูกโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract จำเป็นต้องมี
      ความครอบคลุม Vitest ที่กว้างขึ้นจริงๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing เดิม
      เพียงแต่เพิ่มเพดาน worker ให้สูงขึ้น
    - การปรับจำนวน worker อัตโนมัติในเครื่องตั้งใจให้อนุรักษ์นิยม และจะลดระดับ
      เมื่อค่า load average ของ host สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกัน
      จึงสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest ฐานทำเครื่องหมายไฟล์ projects/config เป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำแบบ changed-mode ยังคงถูกต้องเมื่อ
      wiring ของเทสต์เปลี่ยน
    - คอนฟิกคง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดใช้งานบน host ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่งแคชที่ระบุชัดเจนเพียงตำแหน่งเดียวสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดใช้รายงานระยะเวลาอิมพอร์ตของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันให้กับ
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของชาร์ดถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็นคีย์; ชาร์ด CI แบบ include-pattern
      จะต่อท้ายชื่อชาร์ดเพื่อให้ติดตามชาร์ดที่ถูกกรองแยกกันได้
    - เมื่อเทสต์ร้อนหนึ่งชุดยังคงใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam `*.runtime.ts` ภายในที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import helper runtime เพียงเพื่อ
      ส่งผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ผ่าน routing กับพาธ root-project แบบเนทีฟสำหรับ diff
      ที่ commit แล้วนั้น และพิมพ์ wall time พร้อม max RSS บน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดย routing รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest root
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ
      ค่าใช้จ่าย startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### ความเสถียร (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงโดยเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, memory และ payload ขนาดใหญ่แบบ synthetic ผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper การคงอยู่ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังมีขอบเขตจำกัด, sample RSS synthetic อยู่ต่ำกว่างบประมาณ pressure และ queue depth ต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เป็นเลนแคบสำหรับการติดตาม stability-regression ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และเทสต์ E2E ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ `threads` ของ Vitest พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: 1 โดยค่าเริ่มต้น)
  - รันใน silent mode โดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด verbose console output อีกครั้ง
- ขอบเขต:
  - พฤติกรรม gateway แบบ end-to-end หลาย instance
  - พื้นผิว WebSocket/HTTP, การ pairing ของ node และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้งานใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีชิ้นส่วนเคลื่อนไหวมากกว่า unit tests (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบ isolated บน host ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ภายในเครื่องแบบชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้อง opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องและ Docker daemon ที่ทำงานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolated แล้วทำลาย test gateway และ sandbox
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้เทสต์เมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary หรือ wrapper script ของ CLI ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และเทสต์ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วย creds จริงหรือไม่?”
  - จับการเปลี่ยน format ของ provider, ความเฉพาะตัวของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่ได้ออกแบบให้เสถียรสำหรับ CI (network จริง, policy จริงของ provider, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limits
  - ควรรัน subset ที่แคบกว่าแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อรับ API keys ที่ขาดไป
- โดยค่าเริ่มต้น การรัน live ยังคง isolate `HOME` และคัดลอก material ของ config/auth ไปยัง test home ชั่วคราว เพื่อไม่ให้ fixture ของ unit แก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้ live tests ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าโดยค่าเริ่มต้น: มันคงเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ซ่อน notice เพิ่มเติมของ `~/.profile` และปิดเสียง log bootstrap ของ gateway/Bonjour chatter ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการให้ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; tests จะ retry เมื่อได้รับ response แบบ rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ live suites จะปล่อยบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า provider calls ที่ยาวยัง active อยู่ แม้เมื่อ Vitest console capture เงียบ
  - `vitest.live.config.ts` ปิดการ intercept console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดใด?

- การแก้ไขลอจิก/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงมาก)
- แตะส่วนเครือข่ายของ Gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` ที่จำกัดขอบเขตให้แคบลง

## การทดสอบแบบสด (แตะเครือข่าย)

สำหรับเมทริกซ์โมเดลแบบสด, การทดสอบ smoke ของ backend CLI, การทดสอบ smoke ของ ACP, harness ของ Codex app-server
และการทดสอบแบบสดทั้งหมดของผู้ให้บริการสื่อ (Deepgram, BytePlus, ComfyUI, รูปภาพ,
เพลง, วิดีโอ, media harness) — รวมถึงการจัดการข้อมูลประจำตัวสำหรับการรันแบบสด — ดู
[การทดสอบ — ชุดทดสอบแบบสด](/th/help/testing-live)

## ตัวรัน Docker (ตัวเลือกการตรวจสอบ "ใช้งานได้ใน Linux")

ตัวรัน Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวรันโมเดลแบบสด: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์แบบสดของ profile-key ที่ตรงกันภายในอิมเมจ Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรี config ภายในเครื่องและ workspace ของคุณ (และ source `~/.profile` หากมีการเมานต์) entrypoint ภายในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรันแบบสดของ Docker ตั้งค่าเริ่มต้นเป็นขีดจำกัด smoke ที่เล็กกว่า เพื่อให้การกวาดตรวจ Docker แบบเต็มยังทำได้จริง:
  `test:docker:live-models` ตั้งค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ตั้งค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` แทนที่ env vars เหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบ exhaustive ที่ใหญ่กว่าอย่างชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker แบบสดหนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/นำอิมเมจ `scripts/e2e/Dockerfile` สองรายการกลับมาใช้ซ้ำ อิมเมจ bare เป็นเพียงตัวรัน Node/Git สำหรับเลน install/update/plugin-dependency; เลนเหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจ functional ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันของแอปที่ build แล้ว นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิก planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตามแผนที่เลือก aggregate ใช้ scheduler ภายในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุมช่อง process ขณะที่ resource caps ป้องกันไม่ให้เลนหนักแบบสด, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หากเลนเดียวหนักกว่า caps ที่ใช้งานอยู่ scheduler ยังเริ่มเลนนั้นได้เมื่อ pool ว่าง แล้วปล่อยให้รันเดี่ยวต่อไปจนกว่าจะมีความจุอีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มี headroom มากขึ้น ตัวรันทำ Docker preflight โดยค่าเริ่มต้น, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บเวลาของเลนที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่มเลนที่นานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ manifest ของเลนแบบถ่วงน้ำหนักโดยไม่ build หรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์แผน CI สำหรับเลนที่เลือก, ความต้องการ package/image และข้อมูลประจำตัว
- `Package Acceptance` คือ gate package แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่?" โดยจะ resolve package ผู้สมัครหนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` จากนั้นรันเลน Docker E2E ที่นำกลับมาใช้ซ้ำกับ tarball นั้นตรงๆ แทนการแพ็ก ref ที่เลือกใหม่ `workflow_ref` เลือก workflow/harness scripts ที่เชื่อถือได้ ขณะที่ `package_ref` เลือก commit/branch/tag ต้นทางที่จะแพ็กเมื่อ `source=ref`; วิธีนี้ทำให้ลอจิก acceptance ปัจจุบันตรวจสอบ commit เก่าที่เชื่อถือได้ได้ Profiles เรียงตามความครอบคลุม: `smoke` คือ install/channel/agent แบบเร็ว รวมถึง gateway/config, `package` คือสัญญา package/update/Plugin และเป็นตัวแทน native เริ่มต้นสำหรับ coverage ส่วนใหญ่ของ package/update ใน Parallels, `product` เพิ่มช่อง MCP, การล้าง cron/subagent, OpenAI web search และ OpenWebUI และ `full` รันชิ้นส่วน Docker ของเส้นทาง release พร้อม OpenWebUI การตรวจสอบ release รัน package delta แบบกำหนดเอง (`bundled-channel-deps-compat plugins-offline`) รวมถึง Telegram package QA เพราะชิ้นส่วน Docker ของเส้นทาง release ครอบคลุมเลน package/update/Plugin ที่ซ้อนทับอยู่แล้ว คำสั่งรันซ้ำ Docker แบบเจาะจงบน GitHub ที่สร้างจาก artifacts จะรวม package artifact เดิมและ input อิมเมจที่เตรียมไว้เมื่อมี ดังนั้นเลนที่ล้มเหลวจึงหลีกเลี่ยงการ build package และอิมเมจใหม่ได้
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลังจาก tsdown guard จะเดิน graph ที่ build แล้วแบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหาก startup ก่อน dispatch import package dependencies เช่น Commander, prompt UI, undici หรือ logging ก่อนการ dispatch คำสั่ง; นอกจากนี้ยังรักษา bundled gateway run chunk ให้อยู่ในงบ และปฏิเสธ static imports ของเส้นทาง gateway แบบ cold ที่รู้จัก การทดสอบ smoke ของ CLI ที่แพ็กแล้วครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list ด้วย
- ความเข้ากันได้แบบเดิมของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness ยอมรับเฉพาะช่องว่าง metadata ของ shipped-package เท่านั้น: รายการ private QA inventory ที่ละไว้, `gateway install --wrapper` ที่ขาดหาย, patch files ที่ขาดหายใน git fixture ที่ได้จาก tarball, `update.channel` ที่ persist ไว้ซึ่งขาดหาย, ตำแหน่ง install-record ของ Plugin แบบเดิม, การ persist install-record ของ marketplace ที่ขาดหาย และการ migrate config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` เส้นทางเหล่านั้นถือเป็นความล้มเหลวแบบ strict
- ตัวรัน container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` boot คอนเทนเนอร์จริงหนึ่งรายการหรือมากกว่า และตรวจสอบเส้นทาง integration ระดับสูงกว่า

ตัวรัน Docker โมเดลแบบสดยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้จำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน home ของคอนเทนเนอร์ก่อนรัน เพื่อให้ OAuth ของ external-CLI refresh tokens ได้โดยไม่เปลี่ยนแปลง auth store ของ host:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- การทดสอบเบื้องต้นการผูก ACP: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- การทดสอบเบื้องต้นแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- การทดสอบเบื้องต้นฮาร์เนส app-server ของ Codex: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์สำหรับพัฒนา: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- การทดสอบเบื้องต้นด้านการสังเกตการณ์: `pnpm qa:otel:smoke` เป็นเลนตรวจสอบซอร์สเช็กเอาต์ QA แบบส่วนตัว โดยตั้งใจไม่รวมอยู่ในเลนเผยแพร่ Docker ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- การทดสอบเบื้องต้น Open WebUI แบบสด: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ดเริ่มต้นใช้งาน (TTY, สร้างโครงทั้งหมด): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- การทดสอบเบื้องต้นการเริ่มต้นใช้งาน/ช่องทาง/เอเจนต์จาก npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบโกลบอลใน Docker, กำหนดค่า OpenAI ผ่านการเริ่มต้นใช้งานแบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น, ตรวจสอบว่า doctor ซ่อม deps รันไทม์ของ Plugin ที่เปิดใช้งานแล้ว และรันหนึ่งเทิร์นเอเจนต์ OpenAI แบบจำลอง ใช้ tarball ที่สร้างไว้แล้วซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการสร้างใหม่บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- การทดสอบเบื้องต้นการสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบโกลบอลใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจสอบช่องทางที่คงอยู่และการทำงานหลังอัปเดตของ Plugin แล้วสลับกลับเป็นแพ็กเกจ `stable` และตรวจสอบสถานะอัปเดต
- การทดสอบเบื้องต้นบริบทรันไทม์ของเซสชัน: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของทรานสคริปต์บริบทรันไทม์ที่ซ่อนอยู่ รวมถึงการซ่อมด้วย doctor สำหรับสาขา prompt-rewrite ที่ซ้ำกันและได้รับผลกระทบ
- การทดสอบเบื้องต้นการติดตั้ง Bun แบบโกลบอล: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็กต้นไม้ปัจจุบัน, ติดตั้งด้วย `bun install -g` ในโฮมที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืนผู้ให้บริการรูปภาพที่บันเดิลไว้แทนที่จะค้าง ใช้ tarball ที่สร้างไว้แล้วซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการสร้างบนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่สร้างแล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- การทดสอบเบื้องต้น Installer Docker: `bash scripts/test-install-sh-docker.sh` แชร์แคช npm เดียวกันระหว่างคอนเทนเนอร์ root, update และ direct-npm การทดสอบเบื้องต้นการอัปเดตใช้ npm `latest` เป็นค่าเริ่มต้นสำหรับบรรทัดฐาน stable ก่อนอัปเกรดเป็น tarball ตัวเลือก Override ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วยอินพุต `update_baseline_version` ของเวิร์กโฟลว์ Install Smoke บน GitHub การตรวจสอบตัวติดตั้งแบบไม่ใช่ root จะเก็บแคช npm ที่แยกไว้ เพื่อให้รายการแคชที่ root เป็นเจ้าของไม่บดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้แคช root/update/direct-npm ซ้ำในการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดตโกลบอล direct-npm ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม `npm install -g` โดยตรง
- การทดสอบเบื้องต้น CLI สำหรับลบพื้นที่ทำงานที่แชร์ของเอเจนต์: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) สร้างอิมเมจ Dockerfile รากตามค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อมพื้นที่ทำงานหนึ่งรายการในโฮมคอนเทนเนอร์ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องรวมถึงพฤติกรรมการคงพื้นที่ทำงานไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, การยืนยันตัวตน WS + สุขภาพ): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- การทดสอบเบื้องต้นสแนปช็อต Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) สร้างอิมเมจ E2E จากซอร์สพร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่าสแนปช็อตบทบาท CDP ครอบคลุม URL ของลิงก์, clickables ที่โปรโมตด้วยเคอร์เซอร์, iframe refs และเมทาดาทาของเฟรม
- การถดถอย reasoning ขั้นต่ำของ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบจำลองผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้สคีมาของผู้ให้บริการปฏิเสธและตรวจว่ารายละเอียดดิบปรากฏในบันทึก Gateway
- บริดจ์ช่องทาง MCP (Gateway ที่ seed แล้ว + บริดจ์ stdio + การทดสอบเบื้องต้นเฟรมการแจ้งเตือน Claude ดิบ): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของบันเดิล Pi (เซิร์ฟเวอร์ stdio MCP จริง + การทดสอบเบื้องต้น allow/deny ของโปรไฟล์ Pi แบบฝัง): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้าง MCP ของ Cron/subagent (Gateway จริง + การรื้อถอน child stdio MCP หลังการรัน cron แบบแยกและ subagent แบบครั้งเดียว): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (การทดสอบเบื้องต้นการติดตั้ง, การติดตั้ง/ถอนการติดตั้งแบบ kitchen-sink ของ ClawHub, การอัปเดต marketplace และการเปิดใช้/ตรวจสอบ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่แพ็กเกจ/รันไทม์ kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub แบบปิดภายในเครื่อง
- การทดสอบเบื้องต้นการอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- การทดสอบเบื้องต้นเมทาดาทาโหลด config ใหม่: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- deps รันไทม์ของ Plugin ที่บันเดิลไว้: `pnpm test:docker:bundled-channel-deps` สร้างอิมเมจรันเนอร์ Docker ขนาดเล็กตามค่าเริ่มต้น, สร้างและแพ็ก OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้นเมานต์ tarball นั้นเข้าในแต่ละสถานการณ์การติดตั้ง Linux ใช้อิมเมจซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการสร้างใหม่บนโฮสต์หลังจากมีบิลด์ในเครื่องที่สดใหม่ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` การรวม Docker แบบเต็มและชังก์ bundled-channel ตามเส้นทางรีลีสจะแพ็ก tarball นี้ล่วงหน้าหนึ่งครั้ง จากนั้น shard การตรวจสอบช่องทางที่บันเดิลเป็นเลนอิสระ รวมถึงเลนอัปเดตแยกสำหรับ Telegram, Discord, Slack, Feishu, memory-lancedb และ ACPX ชังก์รีลีสแยกการทดสอบเบื้องต้นของช่องทาง, เป้าหมายอัปเดต และสัญญา setup/runtime เป็น `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` และ `bundled-channels-contracts`; ชังก์รวม `bundled-channels` ยังพร้อมใช้สำหรับการรันซ้ำด้วยตนเอง เวิร์กโฟลว์รีลีสยังแยกชังก์ตัวติดตั้งผู้ให้บริการและชังก์ติดตั้ง/ถอนการติดตั้ง Plugin ที่บันเดิลไว้; ชังก์เดิม `package-update`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็นนามแฝงรวมสำหรับการรันซ้ำด้วยตนเอง ใช้ `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` เพื่อจำกัดเมทริกซ์ช่องทางเมื่อรันเลนที่บันเดิลโดยตรง หรือ `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` เพื่อจำกัดสถานการณ์การอัปเดต การรัน Docker ต่อสถานการณ์ใช้ค่าเริ่มต้นเป็น `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; สถานการณ์อัปเดตหลายเป้าหมายใช้ค่าเริ่มต้นเป็น `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` เลนยังตรวจสอบว่า `channels.<id>.enabled=false` และ `plugins.entries.<id>.enabled=false` ระงับการซ่อม deps ของ doctor/runtime-dependency
- จำกัด deps รันไทม์ของ Plugin ที่บันเดิลไว้ระหว่างวนปรับแก้โดยปิดใช้งานสถานการณ์ที่ไม่เกี่ยวข้อง ตัวอย่างเช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

เพื่อสร้างล่วงหน้าและใช้ซ้ำอิมเมจ functional ที่แชร์ด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การ override อิมเมจเฉพาะชุดทดสอบ เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่า เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจแชร์ระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ QR และ installer Docker จะเก็บ Dockerfiles ของตัวเองไว้ เพราะตรวจสอบพฤติกรรมแพ็กเกจ/การติดตั้งแทนรันไทม์แอปที่สร้างแบบแชร์

รันเนอร์ Docker สำหรับ live-model ยัง bind-mount เช็กเอาต์ปัจจุบันแบบอ่านอย่างเดียวและ
stage เข้าไปยัง workdir ชั่วคราวภายในคอนเทนเนอร์ วิธีนี้ทำให้อิมเมจรันไทม์
เล็กลง ขณะยังรัน Vitest กับซอร์ส/config ในเครื่องของคุณแบบตรงตัว
ขั้นตอน staging จะข้ามแคชเฉพาะเครื่องขนาดใหญ่และเอาต์พุตบิลด์แอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` เฉพาะแอปหรือ
Gradle เพื่อให้การรัน Docker แบบสดไม่ใช้เวลาหลายนาทีคัดลอก
อาร์ติแฟกต์เฉพาะเครื่อง
นอกจากนี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ live probes ของ gateway ไม่เริ่ม
worker ช่องทาง Telegram/Discord/ฯลฯ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้นการครอบคลุม Gateway
แบบสดจากเลน Docker นั้น
`test:docker:openwebui` เป็นการทดสอบเบื้องต้นความเข้ากันได้ระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ Gateway ของ OpenClaw โดยเปิดใช้งานปลายทาง HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันตรึงไว้เทียบกับ Gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` แล้วส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้าลงอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
อิมเมจ Open WebUI และ Open WebUI อาจต้องทำ setup แบบ cold-start ของตัวเองให้เสร็จ
เลนนี้คาดหวังคีย์โมเดลสดที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` ตามค่าเริ่มต้น) เป็นวิธีหลักในการระบุคีย์นั้นในการรันผ่าน Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้เป็นแบบกำหนดแน่นอนและไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันบูตคอนเทนเนอร์ Gateway
ที่ seed แล้ว, เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve` จากนั้น
ตรวจสอบการค้นพบบทสนทนาที่ถูก route, การอ่านทรานสคริปต์, เมทาดาทาไฟล์แนบ,
พฤติกรรมคิวเหตุการณ์สด, การ route การส่งออกขาออก และการแจ้งเตือนช่องทาง +
สิทธิ์แบบ Claude ผ่านบริดจ์ stdio MCP จริง การตรวจสอบการแจ้งเตือน
ตรวจเฟรม stdio MCP ดิบโดยตรง เพื่อให้การทดสอบเบื้องต้นตรวจสอบสิ่งที่
บริดจ์ปล่อยออกมาจริง ไม่ใช่เพียงสิ่งที่ SDK ไคลเอนต์เฉพาะตัวบังเอิญแสดง
`test:docker:pi-bundle-mcp-tools` เป็นแบบกำหนดแน่นอนและไม่ต้องใช้คีย์โมเดลสด
มันสร้างอิมเมจ Docker ของ repo, เริ่มเซิร์ฟเวอร์ probe stdio MCP จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่านรันไทม์ MCP ของบันเดิล Pi แบบฝัง,
เรียกใช้เครื่องมือ จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคง
เครื่องมือ `bundle-mcp` ไว้ ในขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองออก
`test:docker:cron-mcp-cleanup` เป็นแบบกำหนดแน่นอนและไม่ต้องใช้คีย์โมเดลสด
มันเริ่ม Gateway ที่ seed แล้วพร้อมเซิร์ฟเวอร์ probe stdio MCP จริง, รัน
เทิร์น cron แบบแยกและเทิร์น child แบบครั้งเดียวของ `/subagents spawn` จากนั้นตรวจสอบว่า
โปรเซส child ของ MCP ออกหลังจากการรันแต่ละครั้ง

การทดสอบเบื้องต้นเธรด ACP ภาษาธรรมดาแบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/debug อาจต้องใช้อีกครั้งสำหรับการตรวจสอบ routing ของเธรด ACP ดังนั้นอย่าลบทิ้ง

ตัวแปรสภาพแวดล้อมที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) เมานต์ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะตัวแปรสภาพแวดล้อมที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราว และไม่มีการเมานต์ auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) เมานต์ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูกเมานต์แบบอ่านอย่างเดียวภายใต้ `/host-auth...` จากนั้นคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยคอมมา เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า credentials มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือก model ที่ Gateway เปิดให้ใช้งานสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ใช้โดย smoke ของ Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image ของ Open WebUI ที่ pin ไว้

## ตรวจความถูกต้องของเอกสาร

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`.
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`.

## Offline regression (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็น regression ของ “pipeline จริง” โดยไม่มี provider จริง:

- การเรียกใช้เครื่องมือของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (เคส: "รันการเรียกเครื่องมือ mock OpenAI แบบครบวงจรผ่าน gateway agent loop")
- วิซาร์ด Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (เคส: "รันวิซาร์ดผ่าน ws และเขียน config token auth")

## การประเมินความเชื่อถือได้ของเอเจนต์ (skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางรายการ ซึ่งทำงานคล้าย “การประเมินความเชื่อถือได้ของเอเจนต์”:

- Mock การเรียกใช้เครื่องมือผ่าน Gateway จริง + agent loop (`src/gateway/gateway.test.ts`).
- โฟลว์วิซาร์ดแบบ end-to-end ที่ตรวจสอบการเชื่อม session และผลของ config (`src/gateway/gateway.test.ts`).

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ skills ใน prompt เอเจนต์เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงรายการที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาของเวิร์กโฟลว์:** สถานการณ์หลาย turn ที่ยืนยันลำดับเครื่องมือ การส่งต่อประวัติ session และขอบเขต sandbox

การประเมินในอนาคตควรรักษาความเป็น deterministic ไว้ก่อน:

- ตัวรันสถานการณ์ที่ใช้ mock provider เพื่อยืนยันการเรียกเครื่องมือ + ลำดับ การอ่านไฟล์ skill และการเชื่อม session
- ชุดสถานการณ์ขนาดเล็กที่มุ่งเน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- การประเมินแบบ live ที่เป็นตัวเลือก (opt-in, ควบคุมด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้ว

## Contract tests (รูปแบบของ Plugin และช่องทาง)

Contract tests ตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนทุกตัวเป็นไปตาม
interface contract ของตน การทดสอบจะวนผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertions ด้านรูปแบบและพฤติกรรม lane unit ของ `pnpm test` เริ่มต้นตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้; ให้รันคำสั่ง contract อย่างชัดเจน
เมื่อคุณแตะ surface ของช่องทางหรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- contracts ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contracts: `pnpm test:contracts:channels`
- เฉพาะ provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปแบบ Plugin พื้นฐาน (id, name, capabilities)
- **setup** - contract ของวิซาร์ดการตั้งค่า
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของช่องทาง
- **threading** - การจัดการ thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`.

- **status** - การ probe สถานะช่องทาง
- **registry** - รูปแบบ registry ของ Plugin

### Provider contracts

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของโฟลว์ auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - Model catalog API
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - Runtime ของ provider
- **shape** - รูปแบบ/interface ของ Plugin
- **wizard** - วิซาร์ดการตั้งค่า

### ควรรันเมื่อใด

- หลังเปลี่ยนแปลง exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไขช่องทางหรือ Plugin provider
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

Contract tests รันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regressions (แนวทาง)

เมื่อคุณแก้ไขปัญหา provider/model ที่ค้นพบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub provider หรือ capture การแปลง request-shape ที่แน่นอน)
- หากเป็นแบบ live-only โดยธรรมชาติ (rate limits, นโยบาย auth) ให้ทำให้การทดสอบ live แคบและ opt-in ผ่าน env vars
- เลือก target เป็น layer ที่เล็กที่สุดซึ่งจับบั๊กได้:
  - บั๊กการแปลง/เล่นซ้ำ request ของ provider → ทดสอบ models โดยตรง
  - บั๊ก gateway session/history/tool pipeline → gateway live smoke หรือการทดสอบ gateway mock ที่ปลอดภัยสำหรับ CI
- Guardrail การไล่ผ่าน SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` สร้าง target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`), จากนั้น assert ว่า exec ids ที่มี traversal segment ถูกปฏิเสธ
  - หากคุณเพิ่ม family ของ target SecretRef ที่เป็น `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในการทดสอบนั้น การทดสอบตั้งใจให้ล้มเหลวเมื่อมี target ids ที่ไม่ได้จัดคลาส เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [CI](/th/ci)
