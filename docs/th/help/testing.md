---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - เพิ่มการทดสอบถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway และเอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-30T18:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุดเล็ก ๆ
ของ Docker runners เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และจงใจ _ไม่_ ครอบคลุมอะไรบ้าง)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, การดีบัก)
- การทดสอบ live ค้นพบข้อมูลประจำตัวและเลือกโมเดล/ผู้ให้บริการอย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**สแตก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, command surface, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) — ข้อมูลอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [QA channel](/th/channels/qa-channel) — transport plugin สังเคราะห์ที่ใช้โดย scenario ที่อิง repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน QA-specific runners ด้านล่าง ([QA-specific runners](#qa-specific-runners)) แสดงรายการคำสั่ง `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ส่วนใหญ่ในแต่ละวัน:

- gate เต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite ภายในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรเพียงพอ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ route พาธ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มด้วยการรันแบบกำหนดเป้าหมายก่อนเมื่อคุณกำลังวนแก้ failure เดียว
- ไซต์ QA ที่อิง Docker: `pnpm qa:lab:up`
- QA lane ที่อิง Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะ tests หรือต้องการความมั่นใจเพิ่ม:

- Coverage gate: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องใช้ creds จริง):

- ชุด live (โมเดล + gateway tool/image probes): `pnpm test:live`
- กำหนดเป้าหมายไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - โมเดลที่เลือกแต่ละตัวตอนนี้รัน text turn พร้อม probe ขนาดเล็กแบบ file-read-style
    โมเดลที่ metadata ระบุว่ารองรับ input แบบ `image` จะรัน tiny image turn ด้วย
    ปิด probe เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกวิเคราะห์ provider failures
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวม Docker live model
    matrix jobs แยกตามผู้ให้บริการ
  - สำหรับการ rerun CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ที่มีสัญญาณสูงใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ scheduled/release callers ของมัน
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับพาธ Codex app-server, bind Slack DM สังเคราะห์ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบว่าการตอบกลับแบบ plain และ image attachment
    route ผ่าน native plugin binding แทน ACP
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turns ผ่าน Codex app-server harness ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models`, และตามค่าเริ่มต้นจะทดสอบ image,
    cron MCP, sub-agent, และ Guardian probes ปิด sub-agent probe ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกวิเคราะห์ Codex
    app-server failures อื่น ๆ สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probes อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลัง sub-agent probe เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in เพื่อความรอบคอบสำหรับ surface ของ message-channel rescue command
    คำสั่งนี้ทดสอบ `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบ persistent,
    ตอบกลับ `/crestodian yes`, และตรวจสอบพาธการเขียน audit/config
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรี state ของ OpenClaw ที่ว่างเปล่า, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord plugin + SecretRef writes,
    ตรวจสอบ config, และตรวจสอบ audit entries พาธ setup Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Moonshot/Kimi cost smoke: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  assistant transcript เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียงกรณีที่ failing หนึ่งกรณี ให้เลือกจำกัด live tests ผ่าน allowlist env vars ที่อธิบายด้านล่าง
</Tip>

## QA-specific runners

คำสั่งเหล่านี้อยู่เคียงข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงของ QA-lab:

CI รัน QA Lab ใน workflow เฉพาะ `Parity gate` รันบน PRs ที่ตรงเงื่อนไขและ
จาก manual dispatch ด้วย mock providers `QA-Lab - All Lanes` รันทุกคืนบน
`main` และจาก manual dispatch ด้วย mock parity gate, live Matrix lane,
Convex-managed live Telegram lane, และ Convex-managed live Discord lane เป็น
parallel jobs Scheduled QA และ release checks ส่ง Matrix `--profile fast`
อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ manual workflow input ยังคงเป็น
`all`; manual dispatch สามารถ shard `all` เป็น `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, และ `e2ee-cli` jobs ได้ `OpenClaw Release Checks` รัน parity รวมถึง
fast Matrix และ Telegram lanes ก่อนการอนุมัติ release โดยใช้
`mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ยัง deterministic
และหลีกเลี่ยง startup ของ provider-plugin ปกติ live transport gateways เหล่านี้ปิด
memory search; พฤติกรรม memory ยังคงครอบคลุมโดย QA parity suites

Full release live media shards ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Docker live model/backend shards ใช้ image ร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build ครั้งเดียวต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - รัน repo-backed QA scenarios โดยตรงบน host
  - รัน scenarios ที่เลือกหลายรายการแบบขนานโดยค่าเริ่มต้นด้วย
    gateway workers ที่แยกกัน `qa-channel` มีค่า concurrency เริ่มต้นเป็น 4 (จำกัดด้วย
    จำนวน scenario ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ serial lane แบบเก่า
  - ออกด้วย non-zero เมื่อ scenario ใด ๆ fail ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่มี failing exit code
  - รองรับ provider modes `live-frontier`, `mock-openai`, และ `aimock`
    `aimock` เริ่ม local AIMock-backed provider server สำหรับ experimental
    fixture และ protocol-mock coverage โดยไม่แทนที่ lane `mock-openai`
    ที่รู้จัก scenario
- `pnpm test:gateway:cpu-scenarios`
  - รัน gateway startup bench พร้อม mock QA Lab scenario pack ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียน CPU observation
    summary แบบรวมไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - โดยค่าเริ่มต้นจะ flag เฉพาะ sustained hot CPU observations (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น startup bursts สั้น ๆ จะถูกบันทึกเป็น metrics
    โดยไม่ดูเหมือน regression ที่ gateway ใช้ CPU เต็มนานหลายนาที
  - ใช้ artifacts `dist` ที่ build แล้ว; รัน build ก่อนเมื่อ checkout ยังไม่มี
    runtime output ที่ใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันใน Multipass Linux VM แบบ disposable
  - คงพฤติกรรมการเลือก scenario แบบเดียวกับ `qa suite` บน host
  - ใช้ flags การเลือก provider/model เดียวกับ `qa suite`
  - การรัน live forward inputs สำหรับ QA auth ที่รองรับและเหมาะกับ guest:
    env-based provider keys, พาธ QA live provider config, และ `CODEX_HOME`
    เมื่อมี
  - output dirs ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ mount ไว้ได้
  - เขียน QA report + summary ปกติพร้อม Multipass logs ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิง Docker สำหรับงาน QA แบบ operator-style
- `pnpm test:docker:npm-onboard-channel-agent`
  - build npm tarball จาก checkout ปัจจุบัน, ติดตั้งแบบ global ใน
    Docker, รัน OpenAI API-key onboarding แบบ non-interactive, กำหนดค่า Telegram
    ตามค่าเริ่มต้น, ตรวจสอบว่าการเปิดใช้ Plugin ติดตั้ง runtime dependencies ตามต้องการ,
    รัน doctor, และรัน local agent turn หนึ่งครั้งกับ mocked OpenAI
    endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน packaged-install
    lane เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน deterministic built-app Docker smoke สำหรับ transcripts ของ embedded runtime context
    ตรวจสอบว่า hidden OpenClaw runtime context ถูก persist เป็น
    non-display custom message แทนที่จะรั่วไหลไปยัง user turn ที่มองเห็นได้,
    จากนั้น seed session JSONL ที่เสียหายและได้รับผลกระทบ แล้วตรวจสอบว่า
    `openclaw doctor --fix` rewrite ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง OpenClaw package candidate ใน Docker, รัน onboarding สำหรับ installed-package,
    กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นใช้ live Telegram QA lane
    ซ้ำโดยใช้ package ที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ local tarball ที่ resolve แล้วแทนการ
    ติดตั้งจาก registry
  - ใช้ Telegram env credentials หรือ Convex credential source เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI,
    Docker wrapper จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ร่วมเฉพาะสำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น manual maintainer workflow
    `NPM Telegram Beta E2E` คำสั่งนี้ไม่รันเมื่อ merge workflow ใช้
    environment `qa-live-shared` และ Convex CI credential leases
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับ product proof แบบ side-run
  กับ candidate package หนึ่งรายการ โดยรับ trusted ref, published npm spec,
  HTTPS tarball URL พร้อม SHA-256, หรือ tarball artifact จาก run อื่น, อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test`, จากนั้นรัน
  Docker E2E scheduler ที่มีอยู่ด้วย smoke, package, product, full, หรือ custom
  lane profiles ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน
  Telegram QA workflow กับ artifact `package-under-test` เดียวกัน
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- การพิสูจน์ด้วย URL tarball ที่เจาะจงต้องใช้ digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- หลักฐาน Artifact จะดาวน์โหลด Artifact แบบ tarball จากการรัน Actions อีกรอบหนึ่ง:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker, เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้วเปิดใช้ช่องทาง/Plugin ที่บันเดิลมาผ่านการแก้ไข
    config
  - ตรวจสอบว่าการค้นพบตอนตั้งค่าปล่อยให้ dependency รันไทม์ของ Plugin ที่ยังไม่ได้กำหนดค่า
    ไม่ปรากฏอยู่, การรัน Gateway หรือ doctor ครั้งแรกที่กำหนดค่าจะติดตั้ง dependency รันไทม์
    ของ Plugin ที่บันเดิลมาแต่ละตัวตามต้องการ, และการรีสตาร์ตครั้งที่สองจะไม่
    ติดตั้ง dependency ที่เปิดใช้งานไปแล้วซ้ำ
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ, เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>`, และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ซ่อม dependency รันไทม์ของช่องทางที่บันเดิลมาได้โดยไม่ต้องซ่อม postinstall
    ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดตแบบติดตั้งแพ็กเกจเนทีฟข้าม guest ของ Parallels แต่ละ
    แพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรัน
    คำสั่ง `openclaw update` ที่ติดตั้งไว้ใน guest เดียวกัน และตรวจสอบ
    เวอร์ชันที่ติดตั้ง, สถานะการอัปเดต, ความพร้อมของ Gateway, และ turn ของ agent ภายในเครื่อง
    หนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows`, หรือ `--platform linux` ระหว่าง
    วนแก้ไขกับ guest หนึ่งตัว ใช้ `--json` สำหรับพาธ Artifact สรุปและ
    สถานะราย lane
  - lane ของ OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน turn ของ agent แบบสดโดย
    ค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบความถูกต้องของ
    โมเดล OpenAI อื่น
  - ครอบการรันภายในเครื่องที่ใช้เวลานานด้วย timeout ของ host เพื่อไม่ให้การค้างของ transport ของ Parallels
    กินเวลาทดสอบที่เหลือ:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียน log ของ lane ที่ซ้อนกันไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log`, หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในขั้น doctor/การซ่อม dependency
    รันไทม์หลังอัปเดตบน guest ที่ยังเย็นอยู่ ซึ่งยังถือว่าปกติเมื่อ log debug ของ npm
    ที่ซ้อนอยู่ยังคืบหน้า
  - อย่ารัน wrapper รวมนี้พร้อมกันกับ lane smoke ของ Parallels
    macOS, Windows, หรือ Linux แบบเดี่ยว เพราะทั้งหมดใช้สถานะ VM ร่วมกันและอาจชนกันใน
    การคืน snapshot, การให้บริการแพ็กเกจ, หรือสถานะ Gateway ของ guest
  - หลักฐานหลังอัปเดตรันพื้นผิว Plugin ที่บันเดิลมาตามปกติ เพราะ
    capability facade เช่น speech, image generation, และ media
    understanding ถูกโหลดผ่าน API รันไทม์ที่บันเดิลมา แม้ว่า turn ของ agent
    เองจะตรวจแค่การตอบกลับข้อความง่าย ๆ

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ภายในเครื่องสำหรับการทดสอบ smoke
    โปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane QA แบบสดของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่มี Docker รองรับ ใช้ได้เฉพาะ source-checkout เท่านั้น — การติดตั้งแบบแพ็กเกจไม่ได้จัดส่ง `qa-lab`
  - CLI เต็มรูปแบบ, แค็ตตาล็อก profile/scenario, env var, และเลย์เอาต์ Artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รัน lane QA แบบสดของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้ token ของ bot driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` id ของกลุ่มต้องเป็น id แชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credential แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบ pooled
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ Artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องมี bot สองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดย bot SUT ต้องเปิดเผย username ของ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจให้แน่ใจว่า bot driver สามารถสังเกตทราฟฟิก bot ในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป, และ Artifact observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` scenario แบบตอบกลับรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับของ SUT ที่สังเกตได้

lane transport แบบสดใช้สัญญามาตรฐานเดียวร่วมกันเพื่อให้ transport ใหม่ไม่เบี่ยงเบน; เมทริกซ์ coverage ราย lane อยู่ใน [ภาพรวม QA → coverage ของ transport แบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุดทดสอบสังเคราะห์แบบกว้างและไม่ใช่ส่วนหนึ่งของเมทริกซ์นั้น

### credential Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะรับ lease แบบเฉพาะตัวจาก pool ที่รองรับด้วย Convex, ส่ง Heartbeat
ให้ lease นั้นขณะ lane กำลังรัน, และปล่อย lease เมื่อ shutdown

โครง scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env var ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, ไม่เช่นนั้นเป็น `maintainer`)

env var เพิ่มเติม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id เพิ่มเติม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ local loopback `http://` สำหรับการพัฒนาเฉพาะภายในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin ของ maintainer (เพิ่ม/ลบ/แสดงรายการ pool) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบสดเพื่อตรวจ URL เว็บไซต์ Convex, secret ของ broker,
prefix ของ endpoint, HTTP timeout, และการเข้าถึง admin/list โดยไม่พิมพ์
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
- `POST /admin/add` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - guard ของ lease ที่ active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะ secret ของ maintainer)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปทรง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง id แชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปทรงนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มช่องทางลงใน QA

ชื่อ architecture และ scenario-helper สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement transport runner บน seam host `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>`, และเขียน scenario ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้มองชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความ flakiness/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันแบบไม่เจาะจงใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config รายโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit ล้วน
  - การทดสอบ integration ใน process (auth ของ gateway, routing, tooling, parsing, config)
  - regression แบบ deterministic สำหรับ bug ที่ทราบ
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้ key จริง
  - ควรรวดเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback แบบกว้างของ `api.js` และ
    `runtime-api.js` ด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API source ของ Plugin ที่บันเดิลมาจริง การโหลด API ของ Plugin จริงอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="โปรเจกต์, shard, และ lane แบบกำหนดขอบเขต">

    - `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิก shard ขนาดเล็กกว่าสิบสองรายการ (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project ดั้งเดิมขนาดใหญ่เพียงตัวเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลดมาก และหลีกเลี่ยงไม่ให้งาน auto-reply/extension แย่งทรัพยากรจนชุดทดสอบอื่นที่ไม่เกี่ยวข้องขาดทรัพยากร
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ root ดั้งเดิมของ `vitest.config.ts` เพราะลูป watch แบบหลาย shard ไม่เหมาะในทางปฏิบัติ
    - `pnpm test`, `pnpm test:watch`, และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลนที่กำหนดขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องจ่ายต้นทุนการเริ่มต้นโปรเจกต์ root ทั้งหมด
    - `pnpm test:changed` ขยายพาธ git ที่เปลี่ยนเป็นเลนกำหนดขอบเขตราคาถูกตามค่าเริ่มต้น: การแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ชัดเจน, และ dependent ในกราฟ import ภายในเครื่อง การแก้ไขคอนฟิก/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณจะใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบภายในเครื่องแบบอัจฉริยะตามปกติสำหรับงานขอบเขตแคบ โดยจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, และ tooling จากนั้นรัน typecheck, lint, และคำสั่ง guard ที่ตรงกัน คำสั่งนี้ไม่รันการทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อเป็นหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจสอบเวอร์ชัน/คอนฟิก/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข harness ของ live Docker ACP จะรันการตรวจสอบแบบโฟกัส: ไวยากรณ์ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler สำหรับ live Docker การเปลี่ยนแปลง `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version, และพื้นผิว package อื่น ๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบ unit แบบ import-light จาก agents, commands, plugins, auto-reply helpers, `plugin-sdk`, และพื้นที่ utility ล้วนที่คล้ายกันจะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มีสถานะหรือหนักด้าน runtime จะยังคงอยู่บนเลนเดิม
    - ไฟล์ซอร์ส helper บางส่วนของ `plugin-sdk` และ `commands` ยังแมปการรัน changed-mode ไปยังการทดสอบพี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จึงหลีกเลี่ยงการรันชุดหนักทั้งชุดซ้ำสำหรับไดเรกทอรีนั้น
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด, การทดสอบ integration `reply.*` ระดับบนสุด, และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree ของ reply เป็น shard agent-runner, dispatch, และ commands/state-routing เพิ่มเติม เพื่อไม่ให้ bucket ที่หนักด้าน import เพียงตัวเดียวครอง tail ของ Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้ามการกวาด extension แบบ batch และ shard `agentic-plugins` ที่ใช้เฉพาะ release การ dispatch ของ Full Release Validation จะเรียก workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยน input ของการค้นพบ message-tool หรือ context runtime ของ compaction
      ให้คง coverage ทั้งสองระดับไว้
    - เพิ่ม regression helper แบบโฟกัสสำหรับขอบเขตการ route และ normalization
      แบบล้วน
    - รักษาชุด integration ของ embedded runner ให้ทำงานได้ดี:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจสอบว่า scoped ids และพฤติกรรม compaction ยังคงไหลผ่าน
      พาธจริงของ `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานตั้งค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่แชร์กำหนด `isolate: false` และใช้
      runner แบบไม่ isolated ข้ามโปรเจกต์ root, e2e, และคอนฟิก live
    - เลน UI ของ root ยังคงใช้ setup และ optimizer แบบ `jsdom` ของตัวเอง แต่ก็รันบน
      runner ที่แชร์แบบไม่ isolated เช่นกัน
    - shard แต่ละตัวของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่แชร์
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` สำหรับกระบวนการ Node ลูกของ Vitest
      ตามค่าเริ่มต้น เพื่อลด churn จากการคอมไพล์ V8 ระหว่างการรันภายในเครื่องขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใดบ้าง
    - hook pre-commit ทำเฉพาะการจัดรูปแบบ โดย stage ไฟล์ที่จัดรูปแบบแล้วใหม่ และ
      ไม่รัน lint, typecheck, หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่อหรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบภายในเครื่องแบบอัจฉริยะ
    - `pnpm test:changed` จะ route ผ่านเลนกำหนดขอบเขตราคาถูกตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package, หรือ contract ต้องการ
      coverage Vitest ที่กว้างกว่าจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการ route
      เดิม เพียงแต่มีขีดจำกัด worker สูงขึ้น
    - การ auto-scale worker ภายในเครื่องตั้งใจให้ระมัดระวังและจะลดระดับลง
      เมื่อ load average ของ host สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายชุด
      จะสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำใน changed-mode ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บน host ที่รองรับ
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนหนึ่งตำแหน่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดใช้รายงานระยะเวลา import ของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันให้กับ
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลา shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็น key; shard CI แบบ include-pattern
      จะต่อท้ายชื่อ shard เพื่อให้ shard ที่กรองแล้วถูกติดตาม
      แยกกันได้
    - เมื่อการทดสอบ hot หนึ่งรายการยังคงใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam `*.runtime.ts` ภายในเครื่องที่แคบ และ
      mock seam นั้นโดยตรง แทนที่จะ deep-import runtime helpers เพียง
      เพื่อส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูก route แล้วกับพาธ root-project ดั้งเดิมสำหรับ diff ที่ commit แล้ว
      และพิมพ์ wall time พร้อม RSS สูงสุดบน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดย route รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ของ root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead การ startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profile ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### ความเสถียร (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับเป็น worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงพร้อมเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, memory, และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper การ persist diagnostic stability bundle
  - assert ว่า recorder ยังคงมีขอบเขต, sample RSS สังเคราะห์ยังต่ำกว่า pressure budget, และ queue depth ต่อ session drain กลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เป็นเลนแคบสำหรับการติดตาม stability-regression ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, และการทดสอบ E2E ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ซึ่งตรงกับส่วนที่เหลือของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, ภายในเครื่อง: ค่าเริ่มต้น 1)
  - รันในโหมด silent ตามค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบ verbose อีกครั้ง
- ขอบเขต:
  - พฤติกรรม gateway end-to-end แบบหลาย instance
  - พื้นผิว WebSocket/HTTP, การ pairing node, และเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีชิ้นส่วนที่เคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: smoke ของแบ็กเอนด์ OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม gateway OpenShell แบบ isolated บน host ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ภายในเครื่องแบบชั่วคราว
  - ทดสอบแบ็กเอนด์ OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ค่าเริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่องพร้อม Docker daemon ที่ทำงานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบ isolated แล้วจึงทำลาย test gateway และ sandbox
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, และการทดสอบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วย creds จริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของ provider, ลักษณะเฉพาะของ tool-calling, ปัญหา auth, และพฤติกรรม rate limit
- ความคาดหวัง:
  - ตั้งใจให้ไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบาย provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่จำกัดขอบเขตแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อรับ API key ที่ขาด
- ตามค่าเริ่มต้น การรัน live ยังคง isolate `HOME` และคัดลอก config/auth material ไปยัง home ทดสอบชั่วคราว เพื่อไม่ให้ fixture ของ unit แก้ไข `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นตามค่าเริ่มต้น: ยังคงเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ระงับ notice เพิ่มเติมของ `~/.profile` และปิดเสียง log การ bootstrap gateway/การพูดคุย Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ log startup เต็มรูปแบบกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ response rate limit
- เอาต์พุตความคืบหน้า/heartbeat:
  - ตอนนี้ชุด live emit บรรทัดความคืบหน้าไปยัง stderr เพื่อให้การเรียก provider ที่ยาวนานแสดงว่ายัง active อยู่ แม้เมื่อ console capture ของ Vitest เงียบ
  - `vitest.live.config.ts` ปิดการ intercept console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ heartbeats ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeats ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดใด?

- แก้ไขตรรกะ/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนหลายส่วน)
- แตะส่วนเครือข่ายของ Gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอทของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกเครื่องมือ: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบสด (ที่แตะเครือข่าย)

สำหรับเมทริกซ์โมเดลสด, smoke ของแบ็กเอนด์ CLI, smoke ของ ACP, ฮาร์เนสแอปเซิร์ฟเวอร์ของ Codex และการทดสอบสดของผู้ให้บริการสื่อทั้งหมด (Deepgram, BytePlus, ComfyUI, รูปภาพ, เพลง, วิดีโอ, ฮาร์เนสสื่อ) — รวมถึงการจัดการข้อมูลรับรองสำหรับการรันสด — โปรดดู
[การทดสอบ — ชุดทดสอบสด](/th/help/testing-live)

## ตัวรัน Docker (การตรวจสอบ “ใช้งานได้ใน Linux” แบบไม่บังคับ)

ตัวรัน Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวรันโมเดลสด: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์สดที่ตรงกับคีย์โปรไฟล์ของตัวเองภายในอิมเมจ Docker ของรีโป (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรีคอนฟิกและเวิร์กสเปซในเครื่องของคุณ (และโหลด `~/.profile` หากมีการเมานต์) จุดเข้าใช้งานในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรัน Docker สดมีค่าเริ่มต้นเป็นขีดจำกัด smoke ที่เล็กลง เพื่อให้การกวาด Docker เต็มชุดยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้เขียนทับตัวแปรสภาพแวดล้อมเหล่านี้เมื่อคุณต้องการการสแกนครอบคลุมที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker สดหนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` แล้วสร้าง/ใช้ซ้ำอิมเมจ `scripts/e2e/Dockerfile` สองรายการ อิมเมจเปล่าเป็นเพียงตัวรัน Node/Git สำหรับเลน install/update/plugin-dependency เท่านั้น เลนเหล่านั้นจะเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจฟังก์ชันจะติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันของแอปที่สร้างแล้ว นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ตรรกะตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินแผนที่เลือก ตัวรวมใช้ตัวจัดตารางในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุมสล็อตกระบวนการ ขณะที่ขีดจำกัดทรัพยากรป้องกันไม่ให้เลนสดที่หนัก, เลน npm-install และเลนหลายบริการเริ่มพร้อมกันทั้งหมด หากเลนเดียวหนักกว่าขีดจำกัดที่ใช้งานอยู่ ตัวจัดตารางยังสามารถเริ่มเลนนั้นได้เมื่อพูลว่าง แล้วให้รันเดี่ยวต่อไปจนกว่าจะมีความจุอีกครั้ง ค่าเริ่มต้นคือ 10 สล็อต, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มีพื้นที่เผื่อมากขึ้น ตัวรันทำ Docker preflight ตามค่าเริ่มต้น ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ พิมพ์สถานะทุก 30 วินาที เก็บเวลาของเลนที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่มเลนที่ยาวกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์แมนิเฟสต์เลนแบบถ่วงน้ำหนักโดยไม่สร้างหรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์แผน CI สำหรับเลนที่เลือก ความต้องการแพ็กเกจ/อิมเมจ และข้อมูลรับรอง
- `Package Acceptance` คือเกตแพ็กเกจแบบเนทีฟของ GitHub สำหรับ “tarball ที่ติดตั้งได้นี้ใช้งานเป็นผลิตภัณฑ์ได้หรือไม่?” โดยจะ resolve แพ็กเกจตัวเลือกหนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` แล้วรันเลน Docker E2E ที่ใช้ซ้ำได้กับ tarball นั้นโดยตรงแทนการแพ็ก ref ที่เลือกใหม่ `workflow_ref` เลือก workflow/สคริปต์ฮาร์เนสที่เชื่อถือได้ ขณะที่ `package_ref` เลือก commit/branch/tag ต้นทางที่จะแพ็กเมื่อ `source=ref`; วิธีนี้ทำให้ตรรกะ acceptance ปัจจุบันสามารถตรวจสอบ commit เก่าที่เชื่อถือได้ โปรไฟล์เรียงตามความครอบคลุม: `smoke` คือ install/channel/agent แบบเร็วพร้อม gateway/config, `package` คือสัญญา package/update/plugin พร้อม fixture keyless upgrade-survivor และเป็นตัวแทนเนทีฟเริ่มต้นสำหรับความครอบคลุม package/update ของ Parallels ส่วนใหญ่, `product` เพิ่มช่องทาง MCP, การล้าง cron/subagent, การค้นเว็บของ OpenAI และ OpenWebUI และ `full` รันชิ้นส่วน Docker เส้นทางรีลีสพร้อม OpenWebUI การตรวจสอบรีลีสรันเดลตาแพ็กเกจแบบกำหนดเอง (`bundled-channel-deps-compat plugins-offline`) พร้อม QA แพ็กเกจ Telegram เพราะชิ้นส่วน Docker เส้นทางรีลีสครอบคลุมเลน package/update/plugin ที่ทับซ้อนอยู่แล้ว คำสั่งรันซ้ำ Docker บน GitHub แบบเจาะจงที่สร้างจากอาร์ติแฟกต์จะรวมอาร์ติแฟกต์แพ็กเกจก่อนหน้าและอินพุตอิมเมจที่เตรียมไว้เมื่อมี เพื่อให้เลนที่ล้มเหลวหลีกเลี่ยงการสร้างแพ็กเกจและอิมเมจใหม่ได้
- การตรวจสอบ build และ release จะรัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะไล่กราฟที่สร้างแบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหาก startup ก่อน dispatch นำเข้า dependency ของแพ็กเกจ เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; นอกจากนี้ยังคุมขนาด chunk การรัน gateway ที่ bundle ไว้ให้อยู่ภายใต้งบประมาณ และปฏิเสธ static import ของเส้นทาง gateway เย็นที่รู้จัก smoke ของ CLI ที่แพ็กแล้วครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่งรายการโมเดลด้วย
- ความเข้ากันได้แบบ legacy ของ Package Acceptance จำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึงจุดตัดนั้น ฮาร์เนสยอมรับเฉพาะช่องว่างของเมทาดาทาแพ็กเกจที่เคยเผยแพร่แล้ว: รายการ private QA inventory ที่ละไว้, `gateway install --wrapper` ที่ขาดหาย, ไฟล์แพตช์ที่ขาดใน git fixture ที่ได้จาก tarball, `update.channel` ที่ไม่ได้ persist, ตำแหน่ง install-record ของ Plugin แบบ legacy, การ persist install-record ของ marketplace ที่ขาดหาย และการย้ายเมทาดาทาคอนฟิกระหว่าง `plugins update` สำหรับแพ็กเกจหลัง `2026.4.25` เส้นทางเหล่านั้นถือเป็นความล้มเหลวแบบเข้มงวด
- ตัวรัน container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะบูตคอนเทนเนอร์จริงหนึ่งรายการขึ้นไปและตรวจสอบเส้นทางการผสานรวมระดับสูงกว่า

ตัวรัน Docker สำหรับโมเดลสดยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน home ของคอนเทนเนอร์ก่อนรัน เพื่อให้ OAuth ของ CLI ภายนอกสามารถ refresh token ได้โดยไม่แก้ไข auth store ของโฮสต์:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมการครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` เป็นเลนตรวจสอบซอร์ส checkout QA แบบส่วนตัว โดยตั้งใจไม่รวมอยู่ในเลนเผยแพร่ package Docker เพราะ npm tarball ละเว้น QA Lab
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง tarball OpenClaw ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบอ้างอิง env พร้อม Telegram ตามค่าเริ่มต้น, ตรวจสอบว่า doctor ซ่อมแซม runtime deps ของ Plugin ที่เปิดใช้งานแล้ว และรัน agent turn ของ OpenAI ที่ mock ไว้หนึ่งครั้ง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild ฝั่งโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball OpenClaw ที่แพ็กแล้วแบบ global ใน Docker, สลับจาก package `stable` ไปยัง git `dev`, ตรวจสอบช่องทางที่ persist ไว้และงานหลังอัปเดตของ Plugin, จากนั้นสลับกลับไปยัง package `stable` และตรวจสอบสถานะการอัปเดต
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มี agents, config ช่องทาง, allowlists ของ Plugin, สถานะ runtime-deps ของ Plugin ที่เก่าแล้ว และไฟล์ workspace/session ที่มีอยู่ รัน package update พร้อม doctor แบบ non-interactive โดยไม่มีคีย์ provider หรือช่องทางแบบ live, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงอยู่ของ config/state รวมถึงงบประมาณ startup/status
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` ตรวจสอบการ persist transcript ของ runtime context ที่ซ่อนอยู่ พร้อมการซ่อมแซมของ doctor สำหรับ branch prompt-rewrite ที่ซ้ำกันและได้รับผลกระทบ
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน image providers ที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache หนึ่งชุดระหว่าง container แบบ root, update และ direct-npm ของมัน Update smoke ใช้ npm `latest` เป็น baseline stable ตามค่าเริ่มต้นก่อนอัปเกรดเป็น tarball ผู้สมัคร Override ได้ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ภายในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบตัวติดตั้งแบบ non-root เก็บ npm cache ที่แยกไว้ เพื่อไม่ให้ entry cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำระหว่างการรันใหม่ในเครื่อง
- Install Smoke CI ข้ามการอัปเดต global แบบ direct-npm ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ภายในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม `npm install -g` โดยตรง
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image Dockerfile รากตามค่าเริ่มต้น, seed agent สองตัวพร้อมหนึ่ง workspace ใน container home ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้ image install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- Gateway networking (สอง container, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image source E2E พร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP แบบ raw, รัน `browser doctor --deep` และตรวจสอบว่า snapshot บทบาท CDP ครอบคลุม URL ของลิงก์, clickable ที่เลื่อนสถานะมาจาก cursor, ref ของ iframe และ metadata ของ frame
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI ที่ mock ไว้ผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ provider schema reject และตรวจสอบว่า detail แบบ raw ปรากฏใน log ของ Gateway
- MCP channel bridge (Gateway ที่ seed แล้ว + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ Pi bundle (เซิร์ฟเวอร์ stdio MCP จริง + smoke allow/deny ของโปรไฟล์ Pi ที่ฝังไว้): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้าง Cron/subagent MCP (Gateway จริง + teardown ของ child stdio MCP หลังจาก cron ที่แยกไว้และการรัน subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, การติดตั้ง/ถอนการติดตั้ง ClawHub kitchen-sink, marketplace updates และการเปิดใช้/ตรวจสอบ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่ package/runtime แบบ kitchen-sink เริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในที่ปิดล้อม
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` build image runner Docker ขนาดเล็กตามค่าเริ่มต้น, build และแพ็ก OpenClaw หนึ่งครั้งบนโฮสต์, จากนั้น mount tarball นั้นเข้าไปในแต่ละสถานการณ์ติดตั้ง Linux ใช้ image ซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ rebuild ฝั่งโฮสต์หลังจาก build ในเครื่องใหม่ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปยัง tarball ที่มีอยู่ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` Docker aggregate แบบเต็มและ chunk bundled-channel ของ release-path จะ pre-pack tarball นี้หนึ่งครั้ง แล้ว shard การตรวจสอบ bundled channel เป็นเลนอิสระ รวมถึงเลนอัปเดตแยกสำหรับ Telegram, Discord, Slack, Feishu, memory-lancedb และ ACPX chunk release แยก channel smokes, update targets และ setup/runtime contracts เป็น `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` และ `bundled-channels-contracts`; chunk aggregate `bundled-channels` ยังคงมีไว้สำหรับการรันใหม่แบบ manual workflow release ยังแยก chunk provider installer และ chunk ติดตั้ง/ถอนการติดตั้ง bundled plugin; chunk legacy `package-update`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias aggregate สำหรับการรันใหม่แบบ manual ใช้ `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` เพื่อจำกัดเมทริกซ์ช่องทางเมื่อรันเลน bundled โดยตรง หรือ `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` เพื่อจำกัดสถานการณ์อัปเดต การรัน Docker ต่อสถานการณ์ใช้ค่าเริ่มต้นเป็น `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; สถานการณ์อัปเดตหลาย target ใช้ค่าเริ่มต้นเป็น `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` เลนนี้ยังตรวจสอบด้วยว่า `channels.<id>.enabled=false` และ `plugins.entries.<id>.enabled=false` ระงับการซ่อม runtime-dependency ของ doctor
- จำกัด bundled plugin runtime deps ระหว่าง iterate โดยปิดสถานการณ์ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

เพื่อ prebuild และใช้ image functional ที่แชร์ซ้ำแบบ manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การ override image เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อถูกตั้งค่า เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง image ที่แชร์แบบ remote สคริปต์จะ pull มาหากยังไม่มีในเครื่อง การทดสอบ QR และ installer Docker เก็บ Dockerfile ของตัวเองไว้ เพราะตรวจสอบพฤติกรรม package/install แทน runtime ของ built-app ที่แชร์ไว้

ตัวรัน Docker แบบ live-model จะ bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวด้วย และ
จัดวางลงใน workdir ชั่วคราวภายใน container วิธีนี้ทำให้ runtime
image มีขนาดเล็ก แต่ยังคงรัน Vitest กับซอร์ส/คอนฟิกภายในเครื่องของคุณตามจริง
ขั้นตอนการจัดวางจะข้ามแคชขนาดใหญ่ที่ใช้เฉพาะในเครื่องและเอาต์พุต build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` เฉพาะแอป หรือ
Gradle เพื่อให้การรัน live ของ Docker ไม่เสียเวลาหลายนาทีไปกับการคัดลอก
อาร์ติแฟกต์เฉพาะเครื่อง
ตัวรันเหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ live probe ของ gateway เริ่ม
channel worker จริงของ Telegram/Discord/ฯลฯ ภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งต่อ
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น coverage แบบ live ของ Gateway
จาก lane ของ Docker นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ในระดับสูงกว่า: เริ่ม
container ของ OpenClaw gateway พร้อมเปิดใช้ endpoint HTTP ที่เข้ากันได้กับ OpenAI
เริ่ม container ของ Open WebUI เวอร์ชันที่ pin ไว้ให้เชื่อมกับ Gateway นั้น เข้าสู่ระบบผ่าน
Open WebUI ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` แล้วส่ง
คำขอแชตจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้องดึง
image ของ Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จก่อน
lane นี้คาดหวัง key ของ live model ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) คือวิธีหลักในการจัดเตรียม key นั้นในการรันผ่าน Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง โดยจะบูต container ของ Gateway ที่ seed ไว้
เริ่ม container ที่สองซึ่ง spawn `openclaw mcp serve` จากนั้น
ตรวจสอบการค้นพบการสนทนาที่ route แล้ว การอ่าน transcript, metadata ของ attachment,
พฤติกรรม queue ของ event แบบ live, การ route การส่งออก และการแจ้งเตือน channel +
permission แบบ Claude ผ่าน bridge MCP แบบ stdio จริง การตรวจสอบการแจ้งเตือน
จะตรวจ frame MCP แบบ stdio ดิบโดยตรง เพื่อให้ smoke ตรวจยืนยันสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่แค่สิ่งที่ SDK ฝั่ง client บางตัวแสดงออกมา
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ key ของ live
model โดยจะ build image Docker ของ repo เริ่มเซิร์ฟเวอร์ probe MCP แบบ stdio จริง
ภายใน container ทำให้เซิร์ฟเวอร์นั้น materialize ผ่าน runtime MCP ของ bundle Pi ที่ฝังไว้
เรียกใช้เครื่องมือ จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
เครื่องมือ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ key ของ live model
โดยจะเริ่ม Gateway ที่ seed ไว้พร้อมเซิร์ฟเวอร์ probe MCP แบบ stdio จริง รัน
turn ของ Cron แบบแยกเดี่ยวและ turn ลูกแบบ one-shot ของ `/subagents spawn` จากนั้นตรวจสอบว่า
process ลูกของ MCP ออกหลังการรันแต่ละครั้ง

smoke แบบเธรดภาษาธรรมดาของ ACP แบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow การถดถอย/ดีบัก อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบการ route เธรด ACP ดังนั้นอย่าลบ

ตัวแปรสภาพแวดล้อมที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรัน test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะตัวแปรสภาพแวดล้อมที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรีคอนฟิก/workspace ชั่วคราวและไม่มีการ mount auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่ cache ไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวใต้ `/host-auth...` แล้วคัดลอกเข้า `/home/node/...` ก่อนเริ่ม test
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override เองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อนำ image `openclaw:local-live` ที่มีอยู่มาใช้ซ้ำสำหรับการรันซ้ำที่ไม่ต้อง build ใหม่
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือก model ที่ Gateway เปิดเผยสำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ smoke ของ Open WebUI ใช้
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image ของ Open WebUI ที่ pin ไว้

## การตรวจสุขภาพ docs

รันการตรวจ docs หลังแก้ไข doc: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## การถดถอยแบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็นการถดถอยของ “pipeline จริง” โดยไม่มี provider จริง:

- การเรียกเครื่องมือของ Gateway (mock OpenAI, gateway จริง + loop ของ agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard ของ Gateway (WS `wizard.start`/`wizard.next`, เขียนคอนฟิก + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## eval ความน่าเชื่อถือของ agent (skills)

เรามี test ที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำงานเหมือน “eval ความน่าเชื่อถือของ agent”:

- การเรียกเครื่องมือแบบ mock ผ่าน Gateway จริง + loop ของ agent (`src/gateway/gateway.test.ts`)
- flow ของ wizard แบบ end-to-end ที่ตรวจ session wiring และผลของคอนฟิก (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมี skills แสดงอยู่ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยง skill ที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาของ workflow:** สถานการณ์หลาย turn ที่ assert ลำดับเครื่องมือ การส่งต่อประวัติ session และขอบเขต sandbox

eval ในอนาคตควรให้ความสำคัญกับความ deterministic ก่อน:

- scenario runner ที่ใช้ provider แบบ mock เพื่อ assert การเรียกเครื่องมือ + ลำดับ การอ่านไฟล์ skill และ session wiring
- ชุด scenario ขนาดเล็กที่มุ่งเน้น skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- eval แบบ live ที่เป็น optional (opt-in, gate ด้วย env) หลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract test (รูปร่างของ plugin และ channel)

Contract test ตรวจสอบว่า Plugin และ channel ที่ลงทะเบียนทุกตัวสอดคล้องกับ
interface contract ของตัวเอง โดยจะวนผ่าน Plugin ทั้งหมดที่ค้นพบและรันชุด
assertion ด้านรูปร่างและพฤติกรรม lane unit ของ `pnpm test` ค่าเริ่มต้นตั้งใจ
ข้ามไฟล์ seam ที่ใช้ร่วมกันและ smoke เหล่านี้ ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิว channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- contract ของ channel เท่านั้น: `pnpm test:contracts:channels`
- contract ของ provider เท่านั้น: `pnpm test:contracts:plugins`

### contract ของ channel

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ plugin (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - handler ของ action ฝั่ง channel
- **threading** - การจัดการ Thread ID
- **directory** - API ไดเรกทอรี/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### contract ของสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - probe สถานะของ channel
- **registry** - รูปร่างของ registry ของ Plugin

### contract ของ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของ flow auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API catalog ของ model
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ plugin

Contract test รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่มการถดถอย (แนวทาง)

เมื่อคุณแก้ปัญหา provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub provider หรือจับการแปลงรูปแบบคำขอที่แน่นอน)
- หากเป็นสิ่งที่ทำได้เฉพาะ live โดยธรรมชาติ (rate limit, นโยบาย auth) ให้ test แบบ live มีขอบเขตแคบและ opt-in ผ่าน env vars
- เลือกเลเยอร์ที่เล็กที่สุดซึ่งจับบั๊กได้:
  - บั๊กการแปลง/เล่นซ้ำคำขอของ provider → test model โดยตรง
  - บั๊ก pipeline ของ session/history/tool ใน Gateway → smoke แบบ live ของ Gateway หรือ test mock ของ Gateway ที่ปลอดภัยสำหรับ CI
- guardrail การ traverse ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`) จากนั้น assert ว่า exec id ที่มี traversal segment ถูกปฏิเสธ
  - หากคุณเพิ่ม target family ของ SecretRef ที่เป็น `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ใน test นั้น test นี้ตั้งใจให้ล้มเหลวเมื่อเจอ target id ที่ไม่ได้จัดคลาส เพื่อไม่ให้คลาสใหม่ถูกข้ามเงียบ ๆ

## ที่เกี่ยวข้อง

- [Testing live](/th/help/testing-live)
- [CI](/th/ci)
