---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบัก Gateway + พฤติกรรมของเอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, runner ของ Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-01T10:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด
Docker runners ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไร (และจงใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งใดที่ต้องรันสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- live tests ค้นหา credentials และเลือก models/providers อย่างไร
- วิธีเพิ่ม regressions สำหรับปัญหา model/provider ในโลกจริง

<Note>
**สแตก QA (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, command surface, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) — เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ช่องทาง QA](/th/channels/qa-channel) — transport Plugin สังเคราะห์ที่ใช้โดย scenarios ที่อิงกับ repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน runners เฉพาะ QA ด้านล่าง ([runners เฉพาะ QA](#qa-specific-runners)) แสดงการเรียก `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

โดยมากในแต่ละวัน:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- รัน full-suite ในเครื่องได้เร็วขึ้นบนเครื่องที่มีทรัพยากรเพียงพอ: `pnpm test:max`
- วงจร Vitest watch โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้ route paths ของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ failure เดียว
- ไซต์ QA ที่หนุนด้วย Docker: `pnpm qa:lab:up`
- QA lane ที่หนุนด้วย Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะ tests หรือต้องการความมั่นใจเพิ่ม:

- เกต coverage: `pnpm test:coverage`
- ชุด E2E: `pnpm test:e2e`

เมื่อดีบัก providers/models จริง (ต้องใช้ creds จริง):

- ชุด live (models + gateway tool/image probes): `pnpm test:live`
- เจาะจงไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - แต่ละ model ที่เลือกตอนนี้รัน text turn พร้อม probe ขนาดเล็กแบบอ่านไฟล์
    Models ที่ metadata ระบุว่า advertise input แบบ `image` จะรัน image turn ขนาดเล็กด้วย
    ปิด probes เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกปัญหา provider
  - Coverage ใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ทั้งคู่เรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวม Docker live model
    matrix jobs ที่แยก shard ตาม provider
  - สำหรับการ rerun CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ที่สัญญาณสูงใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ
    callers แบบ scheduled/release ของไฟล์นั้น
- Smoke สำหรับ native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับ path ของ Codex app-server, bind Slack DM สังเคราะห์ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบ reply ธรรมดาและ route ของ image attachment
    ผ่าน native Plugin binding แทน ACP
- Smoke สำหรับ Codex app-server harness: `pnpm test:docker:live-codex-harness`
  - รัน Gateway agent turns ผ่าน Codex app-server harness ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้นจะทดสอบ image,
    cron MCP, sub-agent, และ Guardian probes ปิด sub-agent probe ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกปัญหา Codex
    app-server อื่น สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probes อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะ exit หลัง sub-agent probe เว้นแต่จะตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Smoke สำหรับคำสั่ง Crestodian rescue: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in เพื่อความมั่นใจซ้ำสำหรับ command surface ของ message-channel rescue
    คำสั่งนี้ทดสอบ `/crestodian status`, queue การเปลี่ยน model แบบ persistent,
    reply `/crestodian yes` และตรวจสอบ path การเขียน audit/config
- Docker smoke สำหรับ Crestodian planner: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config โดยมี Claude CLI จำลองบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit
- Docker smoke สำหรับ Crestodian first-run: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก dir สถานะ OpenClaw ว่าง, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord Plugin + SecretRef writes,
    validate config และตรวจสอบ audit entries path setup Ring 0 เดียวกันนี้
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Moonshot/Kimi cost smoke: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบ isolated กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalize แล้ว

<Tip>
เมื่อคุณต้องการเพียง case ที่ fail หนึ่งรายการ ให้เลือกจำกัด live tests ผ่าน allowlist env vars ที่อธิบายไว้ด้านล่าง
</Tip>

## runners เฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflows เฉพาะ `Parity gate` รันบน PRs ที่ตรงเงื่อนไขและ
จาก manual dispatch ด้วย mock providers `QA-Lab - All Lanes` รันทุกคืนบน
`main` และจาก manual dispatch โดยมี mock parity gate, live Matrix lane,
Convex-managed live Telegram lane และ Convex-managed live Discord lane เป็น
parallel jobs QA แบบ scheduled และ release checks ส่ง Matrix `--profile fast`
อย่างชัดเจน ในขณะที่ค่า default ของ Matrix CLI และ manual workflow input ยังคงเป็น
`all`; manual dispatch สามารถ shard `all` เป็น jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release Checks` รัน parity พร้อม
fast Matrix และ Telegram lanes ก่อน release approval โดยใช้
`mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ deterministic
และหลีกเลี่ยงการ startup provider-plugin ตามปกติ live transport gateways เหล่านี้ปิด
memory search; behavior ของ memory ยังคงครอบคลุมโดย QA parity suites

Full release live media shards ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Docker live model/backend shards ใช้ image ร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build หนึ่งครั้งต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนที่จะ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - รัน QA scenarios ที่อิงกับ repo โดยตรงบน host
  - รัน scenarios ที่เลือกหลายรายการแบบ parallel ตามค่า default พร้อม
    gateway workers แบบ isolated `qa-channel` ค่า default คือ concurrency 4 (จำกัดด้วย
    จำนวน scenarios ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ serial lane แบบเก่า
  - exit ด้วย non-zero เมื่อ scenario ใด fail ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่มี failing exit code
  - รองรับ provider modes `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่ม local AIMock-backed provider server สำหรับ
    coverage ของ fixture และ protocol-mock แบบทดลองโดยไม่แทนที่ lane
    `mock-openai` ที่รับรู้ scenario
- `pnpm test:gateway:cpu-scenarios`
  - รัน gateway startup bench พร้อม pack scenario QA Lab mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียน summary การสังเกต CPU รวม
    ไว้ใต้ `.artifacts/gateway-cpu-scenarios/`
  - โดยค่า default จะ flag เฉพาะการสังเกต hot CPU ที่ต่อเนื่อง (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น startup bursts ระยะสั้นจะถูกบันทึกเป็น metrics
    โดยไม่ดูเหมือน regression ที่ gateway pegged นานเป็นนาที
  - ใช้ artifacts `dist` ที่ build แล้ว; รัน build ก่อนเมื่อ checkout ยังไม่มี
    runtime output สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันใน Multipass Linux VM แบบ disposable
  - คง behavior การเลือก scenario เหมือนกับ `qa suite` บน host
  - ใช้ flags การเลือก provider/model เดียวกันกับ `qa suite`
  - live runs forward inputs สำหรับ QA auth ที่รองรับและใช้งานได้จริงสำหรับ guest:
    provider keys ผ่าน env, path config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีอยู่
  - output dirs ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    mounted workspace ได้
  - เขียน QA report + summary ปกติพร้อม logs ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่หนุนด้วย Docker สำหรับงาน QA แบบ operator-style
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build npm tarball จาก checkout ปัจจุบัน, install แบบ global ใน
    Docker, รัน onboarding OpenAI API-key แบบ non-interactive, configure Telegram
    ตามค่า default, ตรวจสอบว่าการ enable Plugin ติดตั้ง runtime dependencies ตามต้องการ,
    รัน doctor และรัน local agent turn หนึ่งครั้งกับ mocked OpenAI
    endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน packaged-install
    lane เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน deterministic built-app Docker smoke สำหรับ embedded runtime context
    transcripts ตรวจสอบว่า hidden OpenClaw runtime context ถูก persist เป็น
    non-display custom message แทนที่จะ leak เข้าไปใน visible user turn,
    จากนั้น seed affected broken session JSONL และตรวจสอบว่า
    `openclaw doctor --fix` rewrite ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - Install OpenClaw package candidate ใน Docker, รัน installed-package
    onboarding, configure Telegram ผ่าน CLI ที่ install แล้ว จากนั้น reuse
    live Telegram QA lane โดยใช้ installed package นั้นเป็น SUT Gateway
  - ค่า default คือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ local tarball ที่ resolve แล้วแทนการ
    install จาก registry
  - ใช้ Telegram env credentials หรือ Convex credential source เดียวกันกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI,
    Docker wrapper จะเลือก Convex อัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับ lane นี้เท่านั้น
  - GitHub Actions expose lane นี้เป็น workflow maintainer แบบ manual
    `NPM Telegram Beta E2E` โดยไม่รันตอน merge workflow ใช้
    environment `qa-live-shared` และ Convex CI credential leases
- GitHub Actions ยัง expose `Package Acceptance` สำหรับ product proof แบบ side-run
  กับ candidate package หนึ่งรายการ รองรับ trusted ref, published npm spec,
  HTTPS tarball URL พร้อม SHA-256 หรือ tarball artifact จาก run อื่น, upload
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นรัน
  Docker E2E scheduler เดิมด้วย profiles ของ lane แบบ smoke, package, product, full หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน
  Telegram QA workflow กับ artifact `package-under-test` เดียวกัน
  - product proof สำหรับ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof ด้วย tarball URL แบบ exact ต้องใช้ digest:

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

- `pnpm test:docker:bundled-channel-deps`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker, เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้วเปิดใช้งานช่องทาง/Plugin ที่รวมมาให้ผ่านการแก้ไข
    config
  - ตรวจสอบว่าการค้นพบการตั้งค่าปล่อยให้ dependency รันไทม์ของ Plugin
    ที่ยังไม่ได้กำหนดค่าไม่มีอยู่, การรัน Gateway หรือ doctor ครั้งแรกที่กำหนดค่าแล้วติดตั้ง
    dependency รันไทม์ของ Plugin ที่รวมมาให้แต่ละรายการตามต้องการ, และการรีสตาร์ตครั้งที่สองจะไม่
    ติดตั้ง dependency ที่เปิดใช้งานแล้วซ้ำ
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ, เปิดใช้งาน Telegram ก่อนรัน
    `openclaw update --tag <candidate>`, และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ซ่อม dependency รันไทม์ของช่องทางที่รวมมาให้โดยไม่ต้องใช้การซ่อมหลังติดตั้งฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดตการติดตั้งแพ็กเกจแบบ native ข้าม guest ของ Parallels แต่ละ
    แพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ขอก่อน จากนั้นรัน
    คำสั่ง `openclaw update` ที่ติดตั้งไว้ใน guest เดียวกัน และตรวจสอบ
    เวอร์ชันที่ติดตั้ง, สถานะอัปเดต, ความพร้อมของ Gateway, และ turn ของ agent
    ในเครื่องหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows`, หรือ `--platform linux` ขณะ
    ทำซ้ำบน guest หนึ่งตัว ใช้ `--json` สำหรับพาธอาร์ติแฟกต์สรุปและ
    สถานะราย lane
  - lane ของ OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน turn ของ agent แบบ live โดย
    ค่าเริ่มต้น ส่ง `--model <provider/model>` หรือกำหนด
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบโมเดล OpenAI อื่น
  - ครอบการรันในเครื่องที่ยาวด้วย timeout ฝั่ง host เพื่อไม่ให้ transport ของ Parallels ค้าง
    แล้วใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียนล็อก lane แบบซ้อนใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log`, หรือ `linux-update.log`
    ก่อนสันนิษฐานว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีใน doctor หลังอัปเดต/การซ่อม
    dependency รันไทม์บน guest ที่ยังเย็นอยู่ ซึ่งยังถือว่าปกติเมื่อ nested
    npm debug log กำลังเดินหน้า
  - อย่ารัน wrapper รวมนี้พร้อมกันกับ lane smoke ของ Parallels
    macOS, Windows, หรือ Linux แบบรายตัว เนื่องจากทั้งหมดใช้สถานะ VM ร่วมกันและอาจชนกันระหว่าง
    การ restore snapshot, การเสิร์ฟแพ็กเกจ, หรือสถานะ gateway ของ guest
  - หลักฐานหลังอัปเดตรันพื้นผิว Plugin ที่รวมมาให้ตามปกติ เพราะ
    facade ความสามารถ เช่น speech, การสร้างภาพ, และการเข้าใจสื่อ
    ถูกโหลดผ่าน API รันไทม์ที่รวมมาให้ แม้ turn ของ agent เองจะตรวจเพียง
    คำตอบข้อความแบบง่ายก็ตาม

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ในเครื่องสำหรับการทดสอบ smoke
    โปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane QA แบบ live ของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่รองรับด้วย Docker เฉพาะ source-checkout เท่านั้น — การติดตั้งแบบแพ็กเกจไม่ได้ส่ง `qa-lab` ไปด้วย
  - CLI แบบเต็ม, แค็ตตาล็อก profile/scenario, ตัวแปร env, และโครงร่างอาร์ติแฟกต์: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รัน lane QA แบบ live ของ Telegram กับกลุ่มส่วนตัวจริงโดยใช้โทเค็น bot ของ driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` id กลุ่มต้องเป็น id แชต Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credential แบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบ pooled
  - ออกจากโปรเซสด้วยค่าที่ไม่ใช่ศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการอาร์ติแฟกต์โดยไม่มี exit code ที่ล้มเหลว
  - ต้องมี bot สองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดย bot ของ SUT ต้องเปิดเผย username ของ Telegram
  - เพื่อให้การสังเกต bot-to-bot เสถียร ให้เปิดใช้งาน Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจสอบให้แน่ใจว่า bot ของ driver สังเกต traffic ของ bot ในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป, และอาร์ติแฟกต์ observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` scenario ที่ตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงการตอบกลับของ SUT ที่สังเกตได้

lane transport แบบ live ใช้ contract มาตรฐานเดียวกัน เพื่อไม่ให้ transport ใหม่เบี่ยงเบน; เมทริกซ์ coverage ราย lane อยู่ใน [ภาพรวม QA → coverage transport แบบ live](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` เป็นชุดทดสอบสังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### credential Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้งาน `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะขอ lease แบบ exclusive จาก pool ที่รองรับโดย Convex, ส่ง Heartbeat
ให้ lease นั้นขณะ lane กำลังรัน, และปล่อย lease เมื่อ shutdown

scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

ตัวแปร env ที่ต้องมี:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นของ env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

ตัวแปร env ทางเลือก:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id ทางเลือก)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาเฉพาะในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin ของ maintainer (pool add/remove/list) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

helper CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรัน live เพื่อตรวจสอบ URL ไซต์ Convex, secret ของ broker,
prefix ของ endpoint, HTTP timeout, และการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ในสคริปต์และยูทิลิตี CI

contract endpoint ค่าเริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (secret ของ maintainer เท่านั้น)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (secret ของ maintainer เท่านั้น)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - guard ของ lease ที่ active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret ของ maintainer เท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปทรง payload สำหรับ kind ของ Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง id แชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปทรงนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูป

### การเพิ่มช่องทางใน QA

สถาปัตยกรรมและชื่อ helper ของ scenario สำหรับ adapter ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement transport runner บน shared seam ของ host `qa-lab`, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>`, และเขียน scenario ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรถูกรันที่ไหน)

ให้คิดถึงชุดทดสอบเหล่านี้ว่าเป็น “ความสมจริงที่เพิ่มขึ้น” (และ flakiness/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่ระบุเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config รายโปรเจกต์สำหรับการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, และ `test/**/*.test.ts`; การทดสอบ unit ของ UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบ unit แบบ pure
  - การทดสอบ integration ในโปรเซส (auth ของ gateway, routing, tooling, parsing, config)
  - regression แบบกำหนดผลได้สำหรับบั๊กที่ทราบ
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้ key จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ซอร์สของ Plugin ที่รวมมาให้จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดทดสอบ contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิกชาร์ดย่อยสิบสองรายการ (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการโปรเจกต์รากเนทีฟขนาดใหญ่รายการเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลด และป้องกันไม่ให้งาน auto-reply/extension แย่งทรัพยากรจากชุดทดสอบที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์รากเนทีฟ `vitest.config.ts` เพราะลูป watch แบบหลายชาร์ดใช้งานจริงได้ยาก
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลนที่จำกัดขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จะหลีกเลี่ยงต้นทุนการเริ่มต้นโปรเจกต์รากเต็มรูปแบบ
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็นเลนราคาถูกที่จำกัดขอบเขตโดยค่าเริ่มต้น ได้แก่ การแก้ไขไฟล์ทดสอบโดยตรง ไฟล์พี่น้อง `*.test.ts` การแมปซอร์สที่ระบุชัดเจน และตัวพึ่งพาในกราฟ import ภายในเครื่อง การแก้ไขคอนฟิก/setup/package จะไม่รันทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือเกตตรวจสอบภายในเครื่องแบบอัจฉริยะตามปกติสำหรับงานขอบเขตแคบ มันจัดประเภท diff เป็น core, การทดสอบ core, extensions, การทดสอบ extension, apps, docs, เมตาดาตา release, เครื่องมือ live Docker และ tooling จากนั้นรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อใช้เป็นหลักฐานการทดสอบ การ bump เวอร์ชันที่มีเฉพาะเมตาดาตา release จะรันการตรวจสอบเวอร์ชัน/คอนฟิก/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกฟิลด์เวอร์ชันระดับบนสุด
    - การแก้ไข harness ของ live Docker ACP จะรันการตรวจสอบแบบเจาะจง: ไวยากรณ์ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler live Docker การเปลี่ยนแปลง `package.json` จะรวมอยู่เฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่นๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบหน่วยที่ import เบาจาก agents, commands, plugins, helper ของ auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีล้วนที่คล้ายกันจะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี stateful/runtime หนักยังคงอยู่บนเลนเดิม
    - ไฟล์ซอร์ส helper บางไฟล์ใน `plugin-sdk` และ `commands` ยังแมปการรันโหมด changed ไปยังไฟล์ทดสอบพี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ไข helper จะหลีกเลี่ยงการรันชุดทดสอบหนักเต็มรูปแบบของไดเรกทอรีนั้นอีกครั้ง
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด การทดสอบ integration ระดับบนสุด `reply.*` และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree reply เพิ่มเป็นชาร์ด agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักหนึ่งรายการครอบครองช่วงท้ายของ Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้ามการ sweep แบบ batch ของ extension และชาร์ด `agentic-plugins` ที่มีเฉพาะ release การ dispatch Full Release Validation จะเรียก child workflow `Plugin Prerelease` แยกต่างหากสำหรับชุดทดสอบที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยน input ของการค้นพบ message-tool หรือบริบท runtime ของ compaction
      ให้คง coverage ทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบเจาะจงสำหรับขอบเขต routing และ normalization
      ที่เป็น pure
    - รักษา integration suite ของ embedded runner ให้ปกติ:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดทดสอบเหล่านั้นยืนยันว่า scoped ids และพฤติกรรม compaction ยังคงไหล
      ผ่านพาธจริง `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานตั้งค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันกำหนด `isolate: false` และใช้ runner
      แบบไม่ isolate ทั่วทั้งโปรเจกต์ราก, e2e และคอนฟิก live
    - เลน UI รากยังคง setup และ optimizer ของ `jsdom` ไว้ แต่รันบน
      runner แบบไม่ isolate ที่ใช้ร่วมกันเช่นกัน
    - ชาร์ด `pnpm test` แต่ละรายการสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กระบวนการ Node
      ลูกของ Vitest โดยค่าเริ่มต้น เพื่อลดงาน compile churn ของ V8 ระหว่างการรันภายในเครื่องขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใดบ้าง
    - pre-commit hook มีเฉพาะการจัดรูปแบบเท่านั้น มันจะ stage ไฟล์ที่จัดรูปแบบแล้วอีกครั้ง และ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่อหรือ push เมื่อคุณ
      ต้องการเกตตรวจสอบภายในเครื่องแบบอัจฉริยะ
    - `pnpm test:changed` จะส่งผ่านเลนราคาถูกที่จำกัดขอบเขตโดยค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, config, package หรือ contract จำเป็นต้องมี
      coverage ของ Vitest ที่กว้างขึ้นจริงๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่ใช้เพดาน worker ที่สูงขึ้น
    - การปรับจำนวน worker ภายในเครื่องโดยอัตโนมัติตั้งใจให้ระมัดระวัง และจะลดระดับ
      เมื่อค่า load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายรายการพร้อมกัน
      จะสร้างผลกระทบน้อยลงโดยค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำในโหมด changed ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกยังเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บนโฮสต์ที่รองรับ
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ที่ระบุชัดเจนหนึ่งตำแหน่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดการรายงานระยะเวลา import ของ Vitest พร้อม
      output แบบ import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูล timing ของชาร์ดถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็น key; ชาร์ด CI แบบ include-pattern
      จะต่อท้ายชื่อชาร์ดเพื่อให้ติดตามชาร์ดที่กรองแล้วแยกกันได้
    - เมื่อการทดสอบที่ร้อนหนึ่งรายการยังคงใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam เฉพาะที่แคบแบบ `*.runtime.ts` และ
      mock seam นั้นโดยตรงแทนการ deep-import helper runtime เพียง
      เพื่อส่งผ่านไปยัง `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ routed กับพาธโปรเจกต์รากเนทีฟสำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม max RSS บน macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดยส่งรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ราก
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead ของ startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profile ของ runner สำหรับ
      ชุดทดสอบหน่วยโดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งรายการ
- ขอบเขต:
  - เริ่ม Gateway จริงแบบ loopback โดยเปิด diagnostics เป็นค่าเริ่มต้น
  - ส่ง churn ของข้อความ gateway, memory และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านพาธ diagnostic event
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper การ persist ชุด diagnostic stability
  - ยืนยันว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS สังเคราะห์ยังอยู่ต่ำกว่า pressure budget และความลึก queue ต่อ session ลดกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เลนแคบสำหรับการติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุดทดสอบ Gateway เต็มรูปแบบ

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ bundled-plugin ใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของ repo
  - ใช้ worker แบบปรับตามสภาพแวดล้อม (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมดเงียบโดยค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด output console แบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การ pairing ของ node และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีชิ้นส่วนที่เคลื่อนไหวมากกว่าการทดสอบหน่วย (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม gateway OpenShell ที่ isolate บนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ภายในเครื่องชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - ต้อง opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` เริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่องพร้อม daemon Docker ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` ที่ isolate แล้วทำลาย test gateway และ sandbox
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary CLI หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (provider จริง + model จริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ bundled-plugin ใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/model นี้ใช้งานได้จริง _วันนี้_ ด้วย credential จริงหรือไม่”
  - จับการเปลี่ยนแปลงรูปแบบของ provider, quirks ของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ตั้งใจให้ไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบาย provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่แคบลงแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อรับ API key ที่ขาดหายไป
- โดยค่าเริ่มต้น การรัน live ยังคง isolate `HOME` และคัดลอก config/auth material ไปยัง home สำหรับทดสอบชั่วคราว เพื่อให้ fixture หน่วยไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นเป็นค่าเริ่มต้น: ยังคง output ความคืบหน้า `[live] ...` ไว้ แต่ suppress notice เพิ่มเติมของ `~/.profile` และ mute log การ bootstrap gateway/Bonjour chatter ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการ log startup เต็มรูปแบบกลับมา
- การหมุนเวียน API key (เฉพาะ provider): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อเจอ response แบบ rate limit
- Output ความคืบหน้า/heartbeat:
  - ตอนนี้ suite live จะ emit บรรทัดความคืบหน้าไปยัง stderr เพื่อให้การเรียก provider ที่ยาวยังมองเห็นว่า active อยู่ แม้การจับ console ของ Vitest จะเงียบ
  - `vitest.live.config.ts` ปิดการ intercept console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway stream ทันทีระหว่างการรัน live
  - ปรับ heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรัน suite ใด?

ใช้ตารางตัดสินใจนี้:

- การแก้ไขลอจิก/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนหลายอย่าง)
- แตะ Gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะ provider / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบแบบ live (ที่แตะเครือข่าย)

สำหรับเมทริกซ์โมเดลแบบ live, smoke ของ CLI backend, smoke ของ ACP, harness ของ Codex app-server
และการทดสอบแบบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการข้อมูลประจำตัวสำหรับการรันแบบ live — ดู
[การทดสอบ — ชุดทดสอบแบบ live](/th/help/testing-live)

## Docker runners (การตรวจสอบ "ทำงานใน Linux" ที่เลือกได้)

Docker runners เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- Live-model runners: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ของ profile-key ที่ตรงกันภายใน Docker image ของรีโป (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมาต์ไดเรกทอรี config ภายในเครื่องและ workspace ของคุณ (และ source `~/.profile` หากถูกเมาต์) entrypoint ภายในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners ตั้งค่าเริ่มต้นเป็น smoke cap ที่เล็กลง เพื่อให้การ sweep Docker เต็มรูปแบบยังคงใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env vars เหล่านั้นเมื่อคุณ
  ต้องการสแกนแบบครอบคลุมขนาดใหญ่กว่าอย่างชัดเจน
- `test:docker:all` สร้าง live Docker image หนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/ใช้ซ้ำ image `scripts/e2e/Dockerfile` สองตัว bare image เป็นเพียง Node/Git runner สำหรับ lane install/update/plugin-dependency; lane เหล่านั้นเมาต์ tarball ที่สร้างไว้ล่วงหน้า functional image ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันการทำงานของแอปที่ build แล้ว นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิก planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตาม plan ที่เลือก aggregate ใช้ scheduler ภายในเครื่องแบบ weighted: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slots ขณะที่ resource caps กันไม่ให้ lane หนักแบบ live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า caps ที่ใช้งานอยู่ scheduler ยังสามารถเริ่มได้เมื่อ pool ว่าง แล้วให้รันเพียงลำพังจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ Docker host มี headroom มากขึ้น runner ทำ Docker preflight เป็นค่าเริ่มต้น, ลบ container OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่ใช้เวลานานกว่าก่อนในการรันถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์ CI plan สำหรับ lane ที่เลือก, ความต้องการ package/image และข้อมูลประจำตัว
- `Package Acceptance` คือ package gate แบบ GitHub-native สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" มัน resolve candidate package หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` จากนั้นรัน Docker E2E lane ที่นำกลับมาใช้ซ้ำได้กับ tarball นั้นโดยตรงแทนการแพ็ก ref ที่เลือกใหม่ `workflow_ref` เลือกสคริปต์ workflow/harness ที่เชื่อถือได้ ขณะที่ `package_ref` เลือก source commit/branch/tag ที่จะแพ็กเมื่อ `source=ref`; สิ่งนี้ทำให้ลอจิก acceptance ปัจจุบันตรวจสอบ commit เก่าที่เชื่อถือได้ได้ profile เรียงตามความกว้าง: `smoke` คือ install/channel/agent แบบเร็ว รวมถึง Gateway/config, `package` คือ package/update/plugin contract รวมถึง keyless upgrade-survivor fixture, lane published-baseline upgrade survivor และ native replacement เริ่มต้นสำหรับ coverage package/update ส่วนใหญ่ของ Parallels, `product` เพิ่ม MCP channels, การล้าง cron/subagent, OpenAI web search และ OpenWebUI และ `full` รัน Docker chunks ของ release-path พร้อม OpenWebUI สำหรับ `published-upgrade-survivor`, Package Acceptance ใช้ `package-under-test` เป็น candidate และ `published_upgrade_survivor_baseline` เป็น published baseline สำรองเสมอ โดยค่าเริ่มต้นเป็น `openclaw@latest`; ตั้งค่า `published_upgrade_survivor_baselines=release-history` เพื่อ shard lane ข้ามเมทริกซ์ที่ dedupe แล้วของ stable release ล่าสุดหกรายการ, `2026.4.23` และ stable release ล่าสุดก่อน `2026-03-15` lane ที่เผยแพร่กำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ baked ไว้ จากนั้นบันทึกขั้นตอน recipe ในสรุป lane การตรวจสอบ release รัน custom package delta (`bundled-channel-deps-compat plugins-offline`) พร้อม Telegram package QA เพราะ Docker chunks ของ release-path ครอบคลุม lane package/update/plugin ที่ทับซ้อนอยู่แล้ว คำสั่ง rerun Docker แบบกำหนดเป้าหมายบน GitHub ที่สร้างจาก artifacts รวม package artifact ก่อนหน้า, input image ที่เตรียมไว้ และรายการ baseline published upgrade-survivor เมื่อมี เพื่อให้ lane ที่ล้มเหลวหลีกเลี่ยงการ rebuild package และ image ได้
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard เดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหาก startup ก่อน dispatch import dependency ของ package เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; มันยังคุม bundled gateway run chunk ให้อยู่ในงบประมาณและปฏิเสธ static import ของ cold Gateway paths ที่รู้จัก CLI smoke แบบ packaged ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance ถูกจำกัดไว้ที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึงจุดตัดนั้น harness ยอมรับเฉพาะช่องว่าง metadata ของ shipped-package เท่านั้น: รายการ private QA inventory ที่ถูกละไว้, `gateway install --wrapper` ที่หายไป, patch files ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่ persist หายไป, ตำแหน่ง install-record ของ Plugin แบบ legacy, การ persist marketplace install-record ที่หายไป และการ migrate config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` paths เหล่านั้นเป็นความล้มเหลวแบบ strict
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` boot container จริงหนึ่งตัวหรือมากกว่า และตรวจสอบ path การผสานรวมระดับสูงกว่า

Live-model Docker runners ยัง bind-mount เฉพาะ CLI auth homes ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน home ของ container ก่อนรัน เพื่อให้ OAuth ของ external-CLI สามารถ refresh token ได้โดยไม่เปลี่ยนแปลง host auth store:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- smoke การ bind ACP: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini เป็นค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- smoke แบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- smoke ชุดทดสอบ app-server ของ Codex: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์ dev: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- smoke ด้าน Observability: `pnpm qa:otel:smoke` เป็นเลนตรวจสอบซอร์สแบบ checkout สำหรับ QA ส่วนตัว ตั้งใจไม่รวมไว้ในเลน Docker release ของแพ็กเกจ เพราะ npm tarball ไม่รวม QA Lab
- smoke สดของ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ดเริ่มต้นใช้งาน (TTY, scaffold เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- smoke การเริ่มต้นใช้งาน/ช่องทาง/เอเจนต์ของ npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่านการเริ่มต้นใช้งานแบบ env-ref พร้อม Telegram เป็นค่าเริ่มต้น, ตรวจสอบว่า doctor ซ่อม runtime deps ของ Plugin ที่เปิดใช้งานแล้ว และรันเทิร์นเอเจนต์ OpenAI แบบ mock หนึ่งครั้ง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยนช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- smoke การสลับช่องทางอัปเดต: `pnpm test:docker:update-channel-switch` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจสอบช่องทางที่บันทึกไว้และการทำงานของ Plugin หลังอัปเดต จากนั้นสลับกลับไปเป็นแพ็กเกจ `stable` และตรวจสอบสถานะอัปเดต
- smoke ผู้รอดจากการอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง tarball ของ OpenClaw ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบสกปรกที่มีเอเจนต์, การกำหนดค่าช่องทาง, allowlist ของ Plugin, สถานะ runtime-deps ของ Plugin ที่ค้างเก่า และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการหรือช่องทางสด จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงไว้ของ config/state รวมถึงงบประมาณ startup/status
- smoke ผู้รอดจากการอัปเกรดที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` เป็นค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริง, กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่อบไว้, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นเป็น tarball ผู้สมัคร, รัน doctor แบบไม่โต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json` จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intent ที่กำหนดค่าไว้, การคงไว้ของ state, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ตัวจัดกำหนดการรวมขยาย baseline ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` และขยาย fixture รูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- smoke บริบท runtime ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ พร้อมการซ่อมของ doctor สำหรับกิ่ง prompt-rewrite ที่ซ้ำกันและได้รับผลกระทบ
- smoke การติดตั้ง Bun แบบ global: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` คืนผู้ให้บริการภาพที่ bundled แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- smoke Installer Docker: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache เดียวร่วมกันระหว่างคอนเทนเนอร์ root, update และ direct-npm ของตัวเอง smoke อัปเดตใช้ npm `latest` เป็น baseline stable ก่อนอัปเกรดเป็น tarball ผู้สมัครโดยค่าเริ่มต้น แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วยอินพุต `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจสอบ installer แบบไม่ใช่ root จะคง npm cache ที่แยกไว้ เพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำในการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดต global แบบ direct-npm ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุมการ `npm install -g` โดยตรง
- smoke CLI การลบ workspace ร่วมของเอเจนต์: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build อิมเมจ Dockerfile รากเป็นค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อม workspace หนึ่งรายการใน home ของคอนเทนเนอร์ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- smoke สแนปช็อต Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build อิมเมจ source E2E พร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่าสแนปช็อตบทบาท CDP ครอบคลุม URL ของลิงก์, รายการที่คลิกได้ซึ่งโปรโมตโดยเคอร์เซอร์, iframe refs และ metadata ของเฟรม
- regression ของ OpenAI Responses web_search แบบ reasoning ขั้นต่ำ: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบ mock ผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low` จากนั้นบังคับให้ schema ของผู้ให้บริการ reject และตรวจสอบว่ารายละเอียดดิบปรากฏใน log ของ Gateway
- บริดจ์ช่องทาง MCP (Gateway ที่ seed แล้ว + stdio bridge + smoke เฟรมการแจ้งเตือน Claude ดิบ): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ bundle Pi (เซิร์ฟเวอร์ MCP stdio จริง + smoke allow/deny ของโปรไฟล์ Pi ที่ฝังอยู่): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้าง Cron/subagent MCP (Gateway จริง + การ teardown ลูก MCP stdio หลังจากรัน cron แบบแยกและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (install smoke, การติดตั้ง/ถอนการติดตั้ง ClawHub kitchen-sink, การอัปเดต marketplace และการ enable/inspect bundle ของ Claude): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่แพ็กเกจ/runtime แบบ kitchen-sink ค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ภายในเครื่องแบบ hermetic
- smoke การอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- smoke metadata การ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- runtime deps ของ bundled Plugin: `pnpm test:docker:bundled-channel-deps` build อิมเมจ runner Docker ขนาดเล็กเป็นค่าเริ่มต้น, build และแพ็ก OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้น mount tarball นั้นเข้าไปในแต่ละสถานการณ์ติดตั้ง Linux ใช้อิมเมจซ้ำด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ build บนโฮสต์หลังจาก build ในเครื่องใหม่ด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` หรือชี้ไปที่ tarball ที่มีอยู่ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` Docker aggregate แบบเต็มและชิ้นส่วน bundled-channel ของ release-path จะ pre-pack tarball นี้หนึ่งครั้ง จากนั้น shard การตรวจสอบ bundled channel เป็นเลนอิสระ รวมถึงเลนอัปเดตแยกสำหรับ Telegram, Discord, Slack, Feishu, memory-lancedb และ ACPX ชิ้นส่วน release แยก smoke ของช่องทาง, เป้าหมายอัปเดต และสัญญา setup/runtime เป็น `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` และ `bundled-channels-contracts`; ชิ้นส่วน aggregate `bundled-channels` ยังคงพร้อมใช้งานสำหรับการรันซ้ำแบบ manual workflow release ยังแยกชิ้นส่วน installer ของผู้ให้บริการและชิ้นส่วนการติดตั้ง/ถอนการติดตั้ง bundled Plugin; ชิ้นส่วน legacy `package-update`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias แบบ aggregate สำหรับการรันซ้ำแบบ manual ใช้ `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` เพื่อจำกัด channel matrix เมื่อรัน bundled lane โดยตรง หรือ `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` เพื่อจำกัดสถานการณ์อัปเดต การรัน Docker ต่อสถานการณ์มีค่าเริ่มต้นเป็น `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; สถานการณ์อัปเดตหลายเป้าหมายมีค่าเริ่มต้นเป็น `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` เลนนี้ยังตรวจสอบด้วยว่า `channels.<id>.enabled=false` และ `plugins.entries.<id>.enabled=false` ระงับการซ่อม runtime-dependency ของ doctor
- จำกัด runtime deps ของ bundled Plugin ระหว่าง iterating โดยปิดใช้สถานการณ์ที่ไม่เกี่ยวข้อง เช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

หากต้องการ prebuild และใช้อิมเมจ functional ที่ใช้ร่วมกันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การแทนที่อิมเมจเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปที่อิมเมจ shared ระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer จะเก็บ Dockerfile ของตัวเองไว้ เพราะทดสอบพฤติกรรมแพ็กเกจ/การติดตั้ง ไม่ใช่ runtime ของแอปที่ build ร่วมกัน

ตัวรัน Docker สำหรับโมเดลจริงจะ bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียวและ
stage ไว้ใน workdir ชั่วคราวภายในคอนเทนเนอร์ด้วย วิธีนี้ช่วยให้ runtime
image มีขนาดเล็ก ในขณะที่ยังคงรัน Vitest กับ source/config ในเครื่องของคุณแบบตรงตัว
ขั้นตอน staging จะข้าม cache ขนาดใหญ่ที่ใช้เฉพาะในเครื่องและผลลัพธ์ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีผลลัพธ์ `.build`
หรือ Gradle เฉพาะแอป เพื่อให้การรัน Docker แบบ live ไม่ต้องเสียเวลาหลายนาทีคัดลอก
artifact เฉพาะเครื่อง
ตัวรันเหล่านี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ gateway live probes ไม่เริ่ม
worker ของช่องทาง Telegram/Discord/ฯลฯ จริงภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือแยก
gateway live coverage ออกจาก lane Docker นั้น
`test:docker:openwebui` เป็น smoke test ความเข้ากันได้ในระดับสูงกว่า: มันเริ่ม
คอนเทนเนอร์ OpenClaw gateway โดยเปิดใช้งาน endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI เวอร์ชันที่ pin ไว้กับ Gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` แล้วส่ง
คำขอแชทจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าที่สังเกตได้ เพราะ Docker อาจต้อง pull image ของ
Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
lane นี้คาดหวัง key ของโมเดลจริงที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` ตามค่าเริ่มต้น) เป็นวิธีหลักในการจัดหา key นั้นในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่จำเป็นต้องมีบัญชี
Telegram, Discord หรือ iMessage จริง มัน boot คอนเทนเนอร์ Gateway ที่ seed ไว้,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้นตรวจสอบ
การค้นพบ conversation ที่ route แล้ว, การอ่าน transcript, metadata ของ attachment,
พฤติกรรม live event queue, การ route การส่งออก, และการแจ้งเตือนช่องทาง +
สิทธิ์แบบ Claude ผ่าน stdio MCP bridge จริง การตรวจสอบ notification จะ inspect
frame stdio MCP ดิบโดยตรง เพื่อให้ smoke validate สิ่งที่ bridge emit จริง
ไม่ใช่แค่สิ่งที่ SDK client เฉพาะตัวใดตัวหนึ่งบังเอิญ surface
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่จำเป็นต้องมี key ของโมเดลจริง
มัน build image Docker ของ repo, เริ่มเซิร์ฟเวอร์ probe stdio MCP จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime MCP ของ Pi bundle
แบบ embedded, execute tool แล้วตรวจสอบว่า `coding` และ `messaging` ยังคง
เก็บ tool `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]`
filter tool เหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่จำเป็นต้องมี key ของโมเดลจริง
มันเริ่ม Gateway ที่ seed ไว้พร้อมเซิร์ฟเวอร์ probe stdio MCP จริง, รัน
cron turn แบบ isolated และ child turn แบบ one-shot ของ `/subagents spawn`,
จากนั้นตรวจสอบว่า process ลูก MCP exit หลังการรันแต่ละครั้ง

Smoke ของ ACP thread ภาษา plain language แบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow regression/debug อาจจำเป็นต้องใช้อีกสำหรับการ validate การ route ACP thread ดังนั้นอย่าลบทิ้ง

env vars ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรัน tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี mount auth CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการ install CLI แบบ cached ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth CLI ภายนอกภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกไปที่ `/home/node/...` ก่อนเริ่ม tests
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider ที่จำกัดขอบเขตจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่ง infer จาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตัวเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อ filter provider ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อ reuse image `openclaw:local-live` ที่มีอยู่สำหรับการ rerun ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ Gateway expose สำหรับ smoke ของ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจสอบ nonce ที่ใช้โดย smoke ของ Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image ของ Open WebUI ที่ pin ไว้

## การตรวจความถูกต้องของ docs

รันการตรวจ docs หลังแก้ไขเอกสาร: `pnpm check:docs`.
รันการ validate anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`.

## Regression แบบ offline (ปลอดภัยสำหรับ CI)

รายการเหล่านี้เป็น regression ของ “pipeline จริง” โดยไม่มี provider จริง:

- การเรียกใช้ tool ของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard ของ Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval ความน่าเชื่อถือของ agent (skills)

เรามี tests ที่ปลอดภัยสำหรับ CI อยู่แล้วบางรายการ ซึ่งทำงานเหมือน “agent reliability evals”:

- การเรียกใช้ tool แบบ mock ผ่าน gateway จริง + agent loop (`src/gateway/gateway.test.ts`)
- flow wizard แบบ end-to-end ที่ validate การเชื่อม session และผลของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อ skills ถูกระบุใน prompt, agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยง skill ที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตาม:** agent อ่าน `SKILL.md` ก่อนใช้และทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญา workflow:** scenario แบบ multi-turn ที่ assert ลำดับ tool, การส่งต่อประวัติ session และ boundary ของ sandbox

Eval ในอนาคตควรให้ deterministic ก่อน:

- scenario runner ที่ใช้ mock providers เพื่อ assert การเรียก tool + ลำดับ, การอ่านไฟล์ skill และการเชื่อม session
- ชุด scenario ขนาดเล็กที่เน้น skill (ใช้หรือเลี่ยง, gating, prompt injection)
- live eval แบบ optional (opt-in, gate ด้วย env) หลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## การทดสอบสัญญา (รูปทรงของ Plugin และช่องทาง)

การทดสอบสัญญาตรวจสอบว่า Plugin และช่องทางที่ลงทะเบียนทุกตัวเป็นไปตาม
สัญญา interface ของตัวเอง มัน iterate ผ่าน Plugin ทั้งหมดที่ค้นพบ และรันชุด
assertion ด้าน shape และ behavior lane unit เริ่มต้นของ `pnpm test` ตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้; ให้รันคำสั่งสัญญาอย่างชัดเจน
เมื่อคุณแตะพื้นผิวช่องทางหรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- สัญญาช่องทางเท่านั้น: `pnpm test:contracts:channels`
- สัญญา provider เท่านั้น: `pnpm test:contracts:plugins`

### สัญญาช่องทาง

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรง Plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญา setup wizard
- **session-binding** - พฤติกรรมการผูก session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - handler action ของช่องทาง
- **threading** - การจัดการ thread ID
- **directory** - API directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### สัญญาสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`.

- **status** - probe สถานะช่องทาง
- **registry** - รูปทรง registry ของ Plugin

### สัญญา provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญา flow auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - API catalog ของโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปทรง/interface ของ Plugin
- **wizard** - setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังเพิ่มหรือแก้ไขช่องทางหรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

การทดสอบสัญญารันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ issue ของ provider/model ที่พบใน live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (mock/stub provider หรือ capture การแปลง request-shape แบบตรงตัว)
- ถ้าเป็น live-only โดยเนื้อแท้ (rate limits, นโยบาย auth) ให้ test live แคบและ opt-in ผ่าน env vars
- ควรมุ่งเป้าไปที่ layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug การแปลง/replay คำขอ provider → test โมเดลโดยตรง
  - bug pipeline gateway session/history/tool → gateway live smoke หรือ gateway mock test ที่ปลอดภัยสำหรับ CI
- guardrail การ traverse SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`), แล้ว assert ว่า exec ids แบบ traversal-segment ถูก reject
  - หากคุณเพิ่มตระกูล target SecretRef `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts`, ให้อัปเดต `classifyTargetClass` ใน test นั้น test ตั้งใจ fail เมื่อพบ target ids ที่ยังไม่ classify เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [CI](/th/ci)
