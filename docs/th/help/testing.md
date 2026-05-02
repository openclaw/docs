---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับข้อบกพร่องของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-02T10:20:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (unit/integration, e2e, live) และชุด Docker runner ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดครอบคลุมอะไรบ้าง (และจงใจ _ไม่_ ครอบคลุมอะไร)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (local, pre-push, debugging)
- live tests ค้นหา credentials และเลือก models/providers อย่างไร
- วิธีเพิ่ม regressions สำหรับปัญหา models/providers ในโลกจริง

<Note>
**QA stack (qa-lab, qa-channel, live transport lanes)** มีเอกสารแยกไว้ต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, command surface, การเขียน scenario
- [Matrix QA](/th/concepts/qa-matrix) — อ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [QA channel](/th/channels/qa-channel) — Plugin synthetic transport ที่ใช้โดย scenarios ที่อิง repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและ Docker/Parallels runners ส่วน QA-specific runners ด้านล่าง ([QA-specific runners](#qa-specific-runners)) แสดงคำสั่ง `qa` ที่ใช้จริงและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ส่วนใหญ่ในแต่ละวัน:

- gate แบบเต็ม (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full-suite ในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรมาก: `pnpm test:max`
- loop watch ของ Vitest โดยตรง: `pnpm test:watch`
- การ target ไฟล์โดยตรงตอนนี้ route paths ของ extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรใช้ targeted runs ก่อนเมื่อคุณกำลังวนแก้ failure เดียว
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะ tests หรือต้องการความมั่นใจเพิ่ม:

- Coverage gate: `pnpm test:coverage`
- E2E suite: `pnpm test:e2e`

เมื่อ debug providers/models จริง (ต้องมี credentials จริง):

- Live suite (models + gateway tool/image probes): `pnpm test:live`
- target ไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - ตอนนี้ model ที่เลือกแต่ละตัวรัน text turn พร้อม probe แบบ file-read-style ขนาดเล็ก
    Models ที่ metadata ระบุว่ารองรับ input `image` จะรัน image turn ขนาดเล็กด้วย
    ปิด probes เพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกตรวจ provider failures
  - CI coverage: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียก reusable live/E2E workflow ด้วย
    `include_live_suites: true` ซึ่งรวม Docker live model
    matrix jobs แยกตาม provider
  - สำหรับ CI reruns ที่เจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secrets ที่มีสัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อม `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ callers
    แบบ scheduled/release ของมัน
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับ path ของ Codex app-server, bind Slack DM สังเคราะห์
    ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบ plain reply และ image attachment
    ที่ route ผ่าน native Plugin binding แทน ACP
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - รัน gateway agent turns ผ่าน Codex app-server harness ที่ Plugin เป็นเจ้าของ,
    ตรวจสอบ `/codex status` และ `/codex models`, และโดย default จะทดสอบ image,
    cron MCP, sub-agent, และ Guardian probes ปิด sub-agent probe ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกตรวจ Codex
    app-server failures อื่น สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิด probes อื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    คำสั่งนี้จะออกหลัง sub-agent probe เว้นแต่ตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบ opt-in belt-and-suspenders สำหรับ surface ของคำสั่ง rescue บน message-channel
    โดยทดสอบ `/crestodian status`, queue การเปลี่ยน model แบบ persistent,
    ตอบ `/crestodian yes`, และตรวจสอบ path การเขียน audit/config
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม fake Claude CLI บน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็นการเขียน config แบบ typed ที่มี audit
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก OpenClaw state dir ว่าง, route `openclaw` เปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord Plugin + SecretRef writes,
    validate config, และตรวจสอบ audit entries path setup Ring 0 เดียวกัน
    ยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- Moonshot/Kimi cost smoke: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json`, จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบ isolated กับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  assistant transcript เก็บ `usage.cost` ที่ normalized แล้ว

<Tip>
เมื่อคุณต้องการเพียง case ที่ failing หนึ่งรายการ ควร narrow live tests ผ่าน allowlist env vars ที่อธิบายไว้ด้านล่าง
</Tip>

## QA-specific runners

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ใน workflows เฉพาะ `Parity gate` รันบน PRs ที่ตรงเงื่อนไขและ
จาก manual dispatch ด้วย mock providers `QA-Lab - All Lanes` รันทุกคืนบน
`main` และจาก manual dispatch ด้วย mock parity gate, live Matrix lane,
Convex-managed live Telegram lane, และ Convex-managed live Discord lane เป็น
parallel jobs Scheduled QA และ release checks ส่ง Matrix `--profile fast`
อย่างชัดเจน ขณะที่ Matrix CLI และ input ของ manual workflow ยังคง default เป็น
`all`; manual dispatch สามารถ shard `all` เป็น jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, และ `e2ee-cli` ได้ `OpenClaw Release Checks` รัน parity พร้อม
fast Matrix และ Telegram lanes ก่อนอนุมัติ release โดยใช้
`mock-openai/gpt-5.5` สำหรับ release transport checks เพื่อให้ deterministic
และหลีกเลี่ยงการ startup ของ provider-plugin ตามปกติ live transport gateways เหล่านี้ปิด
memory search; พฤติกรรม memory ยังถูกครอบคลุมโดย QA parity suites

Full release live media shards ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว Docker live model/backend shards ใช้ image ร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build หนึ่งครั้งต่อ commit
ที่เลือก แล้ว pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - รัน repo-backed QA scenarios โดยตรงบน host
  - รัน scenarios ที่เลือกหลายรายการแบบ parallel โดย default ด้วย
    gateway workers ที่ isolated `qa-channel` default เป็น concurrency 4 (จำกัดโดย
    จำนวน scenarios ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ serial lane แบบเก่า
  - ออกด้วย non-zero เมื่อ scenario ใด ๆ fail ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifacts โดยไม่มี exit code ที่ failing
  - รองรับ provider modes `live-frontier`, `mock-openai`, และ `aimock`
    `aimock` เริ่ม local AIMock-backed provider server สำหรับ coverage ของ
    fixture และ protocol-mock เชิงทดลอง โดยไม่แทนที่ lane `mock-openai`
    ที่รู้บริบท scenario
- `pnpm test:gateway:cpu-scenarios`
  - รัน gateway startup bench พร้อม mock QA Lab scenario pack ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียน combined CPU observation
    summary ใต้ `.artifacts/gateway-cpu-scenarios/`
  - flag เฉพาะ sustained hot CPU observations โดย default (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น startup bursts สั้น ๆ จะถูกบันทึกเป็น metrics
    โดยไม่ดูเหมือน regression ที่ gateway ใช้ CPU เต็มนานหลายนาที
  - ใช้ artifacts จาก `dist` ที่ build แล้ว; รัน build ก่อนเมื่อ checkout ยังไม่มี
    runtime output ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันภายใน Multipass Linux VM แบบ disposable
  - คงพฤติกรรม scenario-selection เดียวกับ `qa suite` บน host
  - ใช้ provider/model selection flags เดียวกับ `qa suite`
  - live runs forward QA auth inputs ที่รองรับและใช้ได้จริงสำหรับ guest:
    env-based provider keys, path ของ QA live provider config, และ `CODEX_HOME`
    เมื่อมี
  - output dirs ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน
    mounted workspace ได้
  - เขียน QA report + summary ปกติ พร้อม Multipass logs ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่ม Docker-backed QA site สำหรับงาน QA แบบ operator-style
- `pnpm test:docker:npm-onboard-channel-agent`
  - build npm tarball จาก checkout ปัจจุบัน, install แบบ global ใน
    Docker, รัน onboarding ของ OpenAI API-key แบบ non-interactive, configure Telegram
    โดย default, ตรวจสอบว่า packaged Plugin runtime load ได้โดยไม่มี startup
    dependency repair, รัน doctor, และรัน local agent turn หนึ่งครั้งกับ
    mocked OpenAI endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน packaged-install
    lane เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - รัน built-app Docker smoke แบบ deterministic สำหรับ transcripts ของ embedded runtime context
    โดยตรวจสอบว่า hidden OpenClaw runtime context ถูก persist เป็น
    non-display custom message แทนการรั่วเข้าไปใน visible user turn,
    จากนั้น seed session JSONL ที่ broken และได้รับผลกระทบ แล้วตรวจสอบว่า
    `openclaw doctor --fix` rewrite ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - install OpenClaw package candidate ใน Docker, รัน installed-package
    onboarding, configure Telegram ผ่าน installed CLI, จากนั้น reuse
    live Telegram QA lane โดยใช้ installed package นั้นเป็น SUT Gateway
  - default เป็น `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ local tarball ที่ resolve แล้วแทนการ
    install จาก registry
  - ใช้ Telegram env credentials เดียวกันหรือ Convex credential source เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ CI/release automation ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI,
    Docker wrapper จะเลือก Convex อัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override ค่า shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` สำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น manual maintainer workflow
    `NPM Telegram Beta E2E` โดยไม่รันเมื่อ merge workflow ใช้
    environment `qa-live-shared` และ Convex CI credential leases
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับ side-run product proof
  กับ candidate package หนึ่งรายการ โดยรับ trusted ref, published npm spec,
  HTTPS tarball URL พร้อม SHA-256, หรือ tarball artifact จาก run อื่น, upload
  `openclaw-current.tgz` ที่ normalized แล้วเป็น `package-under-test`, จากนั้นรัน
  Docker E2E scheduler ที่มีอยู่ด้วย lane profiles แบบ smoke, package, product, full, หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อรัน
  Telegram QA workflow กับ artifact `package-under-test` เดียวกัน
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof ด้วย exact tarball URL ต้องมี digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- หลักฐาน artifact ดาวน์โหลด artifact แบบ tarball จากการรัน Actions อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - แพ็กและติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker, เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้วเปิดใช้ช่องทาง/Plugin ที่รวมมาให้ผ่านการแก้ไข
    config
  - ตรวจสอบว่าการค้นพบการตั้งค่าปล่อยให้ Plugin ที่ดาวน์โหลดได้และยังไม่ได้กำหนดค่าไม่ปรากฏ,
    การซ่อมแซม doctor ครั้งแรกที่กำหนดค่าแล้วติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายแต่ละรายการ
    อย่างชัดเจน และการรีสตาร์ตครั้งที่สองไม่รันการซ่อมแซม dependency
    ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ, เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลังอัปเดตของ candidate
    ล้างเศษ dependency ของ Plugin แบบเก่าโดยไม่มีการซ่อมแซม postinstall
    ฝั่ง harness
- `pnpm test:parallels:npm-update`
  - รัน smoke การอัปเดตแบบ packaged-install ดั้งเดิมข้าม guest ของ Parallels แต่ละ
    แพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน จากนั้นรัน
    คำสั่ง `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบ
    เวอร์ชันที่ติดตั้ง, สถานะการอัปเดต, ความพร้อมของ gateway และ turn ของ agent
    ในเครื่องหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ขณะ
    วนทำงานกับ guest หนึ่งตัว ใช้ `--json` สำหรับพาธ artifact สรุปและ
    สถานะราย lane
  - lane ของ OpenAI ใช้ `openai/gpt-5.5` สำหรับหลักฐาน turn ของ agent แบบ live
    ตามค่าเริ่มต้น ส่ง `--model <provider/model>` หรือตั้งค่า
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบความถูกต้องของโมเดล
    OpenAI อื่น
  - ครอบการรันในเครื่องที่ยาวด้วย timeout ของ host เพื่อไม่ให้การค้างของ transport ของ Parallels
    ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์เขียน log ของ lane แบบซ้อนภายใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลังอัปเดตและการอัปเดตแพ็กเกจ
    บน guest ที่ยังไม่อุ่นเครื่อง ซึ่งยังถือว่าปกติเมื่อ debug log ของ npm
    แบบซ้อนยังคืบหน้าอยู่
  - อย่ารัน wrapper รวมนี้พร้อมกันกับ lane smoke ของ Parallels
    macOS, Windows หรือ Linux แบบแยกเดี่ยว เนื่องจากใช้สถานะ VM ร่วมกันและอาจชนกันที่
    การกู้คืน snapshot, การให้บริการแพ็กเกจ หรือสถานะ gateway ของ guest
  - หลักฐานหลังอัปเดตรันพื้นผิว Plugin ที่รวมมาให้ตามปกติ เพราะ
    facade ความสามารถ เช่น คำพูด, การสร้างภาพ และความเข้าใจสื่อ
    ถูกโหลดผ่าน runtime API ที่รวมมาให้ แม้ว่า turn ของ agent
    เองจะตรวจเฉพาะคำตอบข้อความง่ายๆ

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ในเครื่องสำหรับการทดสอบ smoke
    ของโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รัน lane QA แบบ live ของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่หนุนด้วย Docker เฉพาะ source-checkout เท่านั้น — การติดตั้งแบบแพ็กเกจไม่ได้ส่ง `qa-lab`
  - CLI เต็ม, แคตตาล็อกโปรไฟล์/สถานการณ์, env vars และโครงสร้าง artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - รัน lane QA แบบ live ของ Telegram กับกลุ่มส่วนตัวจริง โดยใช้ token ของบอต driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น chat id ของ Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับข้อมูลรับรองแบบ pooled ที่ใช้ร่วมกัน ใช้โหมด env ตามค่าเริ่มต้น หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบ pooled
  - ออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องมีบอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน โดยบอต SUT ต้องเปิดเผยชื่อผู้ใช้ Telegram
  - เพื่อการสังเกตบอตถึงบอตที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับบอตทั้งสอง และตรวจสอบให้แน่ใจว่าบอต driver สามารถสังเกต traffic ของบอตในกลุ่มได้
  - เขียนรายงาน QA ของ Telegram, สรุป และ artifact observed-messages ภายใต้ `.artifacts/qa-e2e/...` สถานการณ์การตอบกลับรวม RTT ตั้งแต่คำขอส่งของ driver จนถึงคำตอบ SUT ที่สังเกตเห็น

lane transport แบบ live ใช้ contract มาตรฐานร่วมกันหนึ่งชุดเพื่อไม่ให้ transport ใหม่เบี่ยงเบน; เมทริกซ์ coverage ราย lane อยู่ใน [ภาพรวม QA → coverage ของ transport แบบ live](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` เป็นชุดทดสอบสังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของเมทริกซ์นั้น

### ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะขอ lease แบบผูกขาดจาก pool ที่หนุนด้วย Convex, ส่ง Heartbeat
ให้ lease นั้นระหว่างที่ lane กำลังรัน และปล่อย lease เมื่อปิดการทำงาน

scaffold โปรเจกต์ Convex สำหรับอ้างอิง:

- `qa/convex-credential-broker/`

env vars ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของข้อมูลรับรอง:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, มิฉะนั้นเป็น `maintainer`)

env vars แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL ของ Convex แบบ `http://` ผ่าน loopback สำหรับการพัฒนาเฉพาะในเครื่อง

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการทำงานปกติ

คำสั่ง admin สำหรับ maintainer (เพิ่ม/ลบ/แสดงรายการ pool) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรันแบบ live เพื่อตรวจ URL ไซต์ Convex, broker secrets,
endpoint prefix, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับ output ที่เครื่องอ่านได้ในสคริปต์และเครื่องมือ
CI

contract ของ endpoint ค่าเริ่มต้น (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - guard สำหรับ lease ที่ active: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret ของ maintainer เท่านั้น)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่าง payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง chat id ของ Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ผิดรูปแบบ

### การเพิ่มช่องทางไปยัง QA

สถาปัตยกรรมและชื่อ scenario-helper สำหรับ adapter ของช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: implement transport runner บน seam host `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, mount เป็น `openclaw qa <runner>` และเขียนสถานการณ์ภายใต้ `qa/scenarios/`

## ชุดทดสอบ (รันอะไรที่ไหน)

ให้คิดว่าชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### หน่วย / การผสานรวม (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันที่ไม่ระบุเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็น config รายโปรเจกต์สำหรับการจัดกำหนดการแบบขนาน
- ไฟล์: inventory ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts` และ `test/**/*.test.ts`; การทดสอบหน่วย UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบหน่วยล้วน
  - การทดสอบการผสานรวมใน process (การยืนยันตัวตนของ gateway, การ routing, tooling, parsing, config)
  - regression แบบกำหนดผลได้สำหรับ bug ที่ทราบ
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้ key จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และ public-surface loader ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API จากซอร์ส Plugin ที่รวมมาให้จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุดทดสอบ contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` แบบไม่ระบุเป้าหมายจะรันคอนฟิกชาร์ดย่อยสิบสองชุด (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project เนทีฟขนาดใหญ่หนึ่งชุด วิธีนี้ลดค่า RSS สูงสุดบนเครื่องที่มีโหลดสูง และป้องกันไม่ให้งาน auto-reply/ส่วนขยายทำให้ชุดทดสอบที่ไม่เกี่ยวข้องขาดทรัพยากร
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์ root เนทีฟ `vitest.config.ts` เพราะลูป watch แบบหลายชาร์ดใช้งานจริงได้ไม่ดี
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดเจนผ่านเลนที่กำหนดขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องจ่ายต้นทุนเริ่มต้นของโปรเจกต์ root ทั้งหมด
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนเป็นเลนราคาถูกที่กำหนดขอบเขตตามค่าเริ่มต้น: การแก้ไขไฟล์ทดสอบโดยตรง, ไฟล์พี่น้อง `*.test.ts`, การแมปซอร์สที่ระบุชัดเจน และ dependent ในกราฟ import ภายในเครื่อง การแก้ไขคอนฟิก/setup/package จะไม่รันชุดทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` เป็นเกตตรวจสอบภายในเครื่องแบบอัจฉริยะตามปกติสำหรับงานขอบเขตแคบ มันจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling และ tooling จากนั้นรันคำสั่ง typecheck, lint และ guard ที่ตรงกัน มันไม่รันชุดทดสอบ Vitest; ให้เรียก `pnpm test:changed` หรือ `pnpm test <target>` ที่ระบุชัดเจนเพื่อใช้เป็นหลักฐานการทดสอบ การเพิ่มเวอร์ชันที่เป็น release metadata เท่านั้นจะรันการตรวจ version/config/root-dependency แบบเจาะจง พร้อม guard ที่ปฏิเสธการเปลี่ยน package นอกฟิลด์ version ระดับบนสุด
    - การแก้ไข harness ของ live Docker ACP จะรันการตรวจแบบโฟกัส: ไวยากรณ์ shell สำหรับสคริปต์ auth ของ live Docker และ dry-run ของ scheduler live Docker การเปลี่ยน `package.json` จะถูกรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version และพื้นผิว package อื่น ๆ ยังคงใช้ guard ที่กว้างกว่า
    - การทดสอบ unit แบบ import-light จาก agents, commands, plugins, helper ของ auto-reply, `plugin-sdk` และพื้นที่ยูทิลิตีล้วนที่คล้ายกันจะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี state/พึ่ง runtime หนักจะยังอยู่บนเลนเดิม
    - ไฟล์ซอร์ส helper ของ `plugin-sdk` และ `commands` ที่เลือกไว้จะยังแมปการรันในโหมด changed ไปยังการทดสอบพี่น้องที่ระบุชัดเจนในเลนเบาเหล่านั้นด้วย ดังนั้นการแก้ helper จึงเลี่ยงการรันชุดหนักทั้งหมดซ้ำสำหรับไดเรกทอรีนั้น
    - `auto-reply` มี bucket เฉพาะสำหรับ helper core ระดับบนสุด, การทดสอบ integration ระดับบนสุด `reply.*` และ subtree `src/auto-reply/reply/**` CI ยังแยก subtree ของ reply เป็นชาร์ด agent-runner, dispatch และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักหนึ่งชุดกินหาง Node ทั้งหมด
    - CI ปกติของ PR/main ตั้งใจข้ามการ sweep ชุดส่วนขยายและชาร์ด `agentic-plugins` สำหรับ release เท่านั้น Full Release Validation จะ dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดที่หนักด้าน Plugin/ส่วนขยายเหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยนอินพุตการค้นหา message-tool หรือ context runtime ของ Compaction
      ให้คงความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบโฟกัสสำหรับ boundary ของการ routing และ normalization
      ที่เป็นโค้ดล้วน
    - รักษาชุด integration ของตัวรันแบบฝังให้ใช้งานได้ดี:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจยืนยันว่า id ที่กำหนดขอบเขตและพฤติกรรม Compaction ยังไหลผ่าน
      พาธจริง `run.ts` / `compact.ts`; การทดสอบเฉพาะ helper
      ไม่เพียงพอที่จะทดแทนพาธ integration เหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานมีค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันตรึง `isolate: false` และใช้ตัวรัน
      แบบไม่แยก isolate ในโปรเจกต์ root, e2e และคอนฟิก live
    - เลน UI ของ root ยังคง setup และ optimizer แบบ `jsdom` ของตัวเอง แต่ก็รันบน
      ตัวรันแบบไม่แยก isolate ที่ใช้ร่วมกันด้วย
    - แต่ละชาร์ดของ `pnpm test` สืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กระบวนการ Node ลูกของ Vitest
      ตามค่าเริ่มต้น เพื่อลดการ churn ของการคอมไพล์ V8 ระหว่างการรันภายในเครื่องขนาดใหญ่
      ตั้งค่า `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใดบ้าง
    - hook pre-commit มีไว้สำหรับการฟอร์แมตเท่านั้น มันจะ stage ไฟล์ที่ฟอร์แมตแล้วใหม่ และ
      ไม่รัน lint, typecheck หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่อหรือ push เมื่อคุณ
      ต้องการเกตตรวจสอบภายในเครื่องแบบอัจฉริยะ
    - `pnpm test:changed` จะ routing ผ่านเลนราคาถูกที่กำหนดขอบเขตตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อเอเจนต์
      ตัดสินว่าการแก้ harness, คอนฟิก, package หรือ contract จำเป็นต้องมี
      ความครอบคลุม Vitest ที่กว้างขึ้นจริง ๆ
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรม routing
      เดิมไว้ เพียงแต่มีเพดาน worker สูงขึ้น
    - การปรับ worker ภายในเครื่องอัตโนมัติถูกตั้งใจให้ค่อนข้างระมัดระวัง และจะลดระดับลง
      เมื่อ load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกัน
      จะสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำในโหมด changed ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกยังเปิดใช้ `OPENCLAW_VITEST_FS_MODULE_CACHE` บนโฮสต์ที่รองรับ;
      ตั้งค่า `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่งแคชที่ระบุชัดเจนหนึ่งแห่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดใช้รายงานระยะเวลา import ของ Vitest พร้อม
      เอาต์พุต import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันไว้ที่
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลาของชาร์ดจะถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรันทั้งคอนฟิกใช้พาธคอนฟิกเป็นคีย์; ชาร์ด CI แบบ include-pattern
      จะต่อท้ายชื่อชาร์ด เพื่อให้ติดตามชาร์ดที่กรองแล้วแยกกันได้
    - เมื่อการทดสอบ hot หนึ่งชุดยังใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam `*.runtime.ts` ภายในเครื่องที่แคบ และ
      mock seam นั้นโดยตรง แทนการ deep-import helper runtime เพียงเพื่อ
      ส่งผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ผ่าน routing กับพาธ root-project เนทีฟสำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อมค่า RSS สูงสุดของ macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดย routing รายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest ของ root
    - `pnpm test:perf:profile:main` เขียน CPU profile ของ main-thread สำหรับ
      overhead การ startup และ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียน CPU+heap profile ของ runner สำหรับ
      ชุด unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงพร้อมเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ gateway, หน่วยความจำ และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านพาธเหตุการณ์ diagnostic
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุม helper persistence ของ bundle เสถียรภาพ diagnostic
  - assert ว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS สังเคราะห์ยังต่ำกว่างบประมาณแรงกดดัน และความลึกของคิวต่อเซสชัน drain กลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เลนแคบสำหรับการติดตาม regression ด้านเสถียรภาพ ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และการทดสอบ E2E ของ Plugin ที่ bundle ไว้ภายใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ `threads` ของ Vitest พร้อม `isolate: false` ให้ตรงกับส่วนอื่นของ repo
  - ใช้ worker แบบปรับตัวได้ (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมด silent ตามค่าเริ่มต้นเพื่อลด overhead ของ console I/O
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิดเอาต์พุต console แบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ Node และเครือข่ายที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้ใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนที่เคลื่อนไหวมากกว่าการทดสอบ unit (อาจช้ากว่า)

### E2E: smoke ของ backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway ที่แยก isolate บนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ภายในเครื่องแบบชั่วคราว
  - ทดสอบ backend OpenShell ของ OpenClaw ผ่าน `sandbox ssh-config` จริง + SSH exec
  - ตรวจยืนยันพฤติกรรมระบบไฟล์แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - opt-in เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี CLI `openshell` ภายในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` ที่แยก isolate แล้วทำลาย test gateway และ sandbox
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง binary หรือ wrapper script ของ CLI ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- คอนฟิก: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ Plugin ที่ bundle ไว้ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วย credential จริงหรือไม่?”
  - จับการเปลี่ยนรูปแบบของผู้ให้บริการ, รายละเอียดเฉพาะของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - โดยการออกแบบไม่เสถียรพอสำหรับ CI (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, โควตา, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่แคบแทน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อรับ API key ที่ขาด
- ตามค่าเริ่มต้น การรัน live ยังคงแยก isolate `HOME` และคัดลอก config/auth material ไปยัง test home ชั่วคราว เพื่อไม่ให้ fixture unit แก้ไข `~/.openclaw` จริงของคุณ
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณต้องการให้การทดสอบ live ใช้โฮมไดเรกทอรีจริงของคุณโดยตั้งใจ
- ตอนนี้ `pnpm test:live` มีค่าเริ่มต้นเป็นโหมดที่เงียบขึ้น: ยังคงเอาต์พุตความคืบหน้า `[live] ...` ไว้ แต่ซ่อนประกาศ `~/.profile` เพิ่มเติม และปิดเสียง log ตอน bootstrap ของ gateway/เสียงรบกวน Bonjour ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ response rate limit
- เอาต์พุตความคืบหน้า/Heartbeat:
  - ตอนนี้ชุด live จะส่งบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า call ผู้ให้บริการที่ยาวยังทำงานอยู่ แม้เมื่อการ capture console ของ Vitest เงียบ
  - `vitest.live.config.ts` ปิดการดัก console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/gateway stream ทันทีระหว่างการรัน live
  - ปรับ Heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ Heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ฉันควรรันชุดใด?

ใช้ตารางตัดสินใจนี้:

- การแก้ไขลอจิก/การทดสอบ: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนแปลงเยอะ)
- แตะเครือข่าย Gateway / โปรโตคอล WS / การจับคู่: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / การเรียกใช้เครื่องมือ: รัน `pnpm test:live` ที่จำกัดขอบเขตแล้ว

## การทดสอบแบบสด (ที่เข้าถึงเครือข่าย)

สำหรับเมทริกซ์โมเดลแบบสด, การทดสอบควันของแบ็กเอนด์ CLI, การทดสอบควัน ACP, ฮาร์เนสเซิร์ฟเวอร์แอป Codex และการทดสอบสดของผู้ให้บริการสื่อทั้งหมด (Deepgram, BytePlus, ComfyUI, รูปภาพ, เพลง, วิดีโอ, ฮาร์เนสสื่อ) — รวมถึงการจัดการข้อมูลประจำตัวสำหรับการรันแบบสด — โปรดดู [การทดสอบชุดทดสอบสด](/th/help/testing-live) สำหรับเช็กลิสต์เฉพาะด้านการอัปเดตและการตรวจสอบ Plugin โปรดดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## รันเนอร์ Docker (การตรวจสอบเสริมว่า "ใช้งานได้ใน Linux")

รันเนอร์ Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- รันเนอร์โมเดลสด: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์สดของคีย์โปรไฟล์ที่ตรงกันภายในอิมเมจ Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดยเมานต์ไดเรกทอรีคอนฟิกและ workspace ในเครื่องของคุณ (และโหลด `~/.profile` หากถูกเมานต์ไว้) จุดเข้าใช้งานในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- รันเนอร์ Docker แบบสดตั้งค่าเริ่มต้นเป็นเพดานการทดสอบควันที่เล็กกว่า เพื่อให้การกวาดตรวจ Docker เต็มชุดยังคงใช้งานได้จริง:
  `test:docker:live-models` ตั้งค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` ตั้งค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้ override ตัวแปรสภาพแวดล้อมเหล่านั้นเมื่อคุณต้องการสแกนแบบครอบคลุมขนาดใหญ่โดยชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker แบบสดหนึ่งครั้งผ่าน `test:docker:live-build`, แพ็ก OpenClaw หนึ่งครั้งเป็น tarball ของ npm ผ่าน `scripts/package-openclaw-for-docker.mjs` จากนั้นสร้าง/นำอิมเมจ `scripts/e2e/Dockerfile` สองตัวกลับมาใช้ใหม่ อิมเมจเปล่าเป็นเพียงรันเนอร์ Node/Git สำหรับเลนติดตั้ง/อัปเดต/การพึ่งพา Plugin เท่านั้น; เลนเหล่านั้นเมานต์ tarball ที่สร้างไว้ล่วงหน้า อิมเมจเชิงฟังก์ชันติดตั้ง tarball เดียวกันเข้าใน `/app` สำหรับเลนฟังก์ชันของแอปที่สร้างแล้ว นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; ลอจิกตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` เรียกใช้แผนที่เลือกไว้ ตัวรวมใช้ตัวจัดตารางในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุมสล็อตกระบวนการ ขณะที่เพดานทรัพยากรป้องกันไม่ให้เลนหนักแบบสด, การติดตั้ง npm และหลายบริการเริ่มพร้อมกันทั้งหมด หากเลนเดียวหนักกว่าเพดานที่ใช้งานอยู่ ตัวจัดตารางยังสามารถเริ่มเลนนั้นเมื่อพูลว่าง แล้วปล่อยให้รันเพียงลำพังจนกว่าจะมีความจุพร้อมอีกครั้ง ค่าเริ่มต้นคือ 10 สล็อต, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มีทรัพยากรเหลือมากขึ้นเท่านั้น รันเนอร์ทำการตรวจสอบล่วงหน้า Docker โดยค่าเริ่มต้น, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บเวลาของเลนที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้เวลาเหล่านั้นเพื่อเริ่มเลนที่ยาวกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์แมนิเฟสต์เลนแบบถ่วงน้ำหนักโดยไม่สร้างหรือรัน Docker หรือใช้ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์แผน CI สำหรับเลนที่เลือก, ความต้องการแพ็กเกจ/อิมเมจ และข้อมูลประจำตัว
- `Package Acceptance` คือเกตแพ็กเกจแบบเนทีฟของ GitHub สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" โดยจะ resolve แพ็กเกจผู้สมัครหนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` แล้วรันเลน Docker E2E ที่นำกลับมาใช้ใหม่กับ tarball นั้นโดยตรง แทนที่จะแพ็ก ref ที่เลือกใหม่ โปรไฟล์เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) สำหรับสัญญาแพ็กเกจ/อัปเดต/Plugin, เมทริกซ์การอยู่รอดจากการอัปเกรดที่เผยแพร่แล้ว, ค่าเริ่มต้นของรีลีส และการคัดแยกความล้มเหลว
- การตรวจสอบบิลด์และรีลีสรัน `scripts/check-cli-bootstrap-imports.mjs` หลังจาก tsdown ตัวป้องกันเดินกราฟบิลด์แบบ static จาก `dist/entry.js` และ `dist/cli/run-main.js` และล้มเหลวหากการเริ่มต้นก่อน dispatch นำเข้าการพึ่งพาแพ็กเกจ เช่น Commander, UI พรอมป์, undici หรือการทำ logging ก่อนการ dispatch คำสั่ง; นอกจากนี้ยังรักษาขนาดชังก์การรัน Gateway ที่รวมมาด้วยให้อยู่ในงบ และปฏิเสธการนำเข้า static ของพาธ Gateway เย็นที่รู้จัก การทดสอบควัน CLI แบบแพ็กเกจยังครอบคลุมความช่วยเหลือราก, ความช่วยเหลือ onboard, ความช่วยเหลือ doctor, สถานะ, schema คอนฟิก และคำสั่งแสดงรายการโมเดล
- ความเข้ากันได้แบบเดิมของ `Package Acceptance` จำกัดสูงสุดที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึงจุดตัดนั้น ฮาร์เนสยอมรับเฉพาะช่องว่างเมทาดาทาของแพ็กเกจที่เคยเผยแพร่แล้ว: รายการคลัง QA แบบ private ที่ถูกละไว้, ไม่มี `gateway install --wrapper`, ไม่มีไฟล์ patch ใน fixture git ที่ได้จาก tarball, ไม่มี `update.channel` ที่คงอยู่, ตำแหน่งระเบียนการติดตั้ง Plugin แบบเดิม, ไม่มีการคงอยู่ของระเบียนการติดตั้ง marketplace และการย้ายเมทาดาทาคอนฟิกระหว่าง `plugins update` สำหรับแพ็กเกจหลัง `2026.4.25` พาธเหล่านั้นเป็นความล้มเหลวแบบเข้มงวด
- รันเนอร์ทดสอบควันคอนเทนเนอร์: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` บูตคอนเทนเนอร์จริงหนึ่งตัวหรือมากกว่า และตรวจสอบพาธการผสานรวมระดับสูงกว่า

รันเนอร์ Docker โมเดลสดยัง bind-mount เฉพาะโฮมการยืนยันตัวตน CLI ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปยังโฮมของคอนเทนเนอร์ก่อนการรัน เพื่อให้ OAuth ของ CLI ภายนอกสามารถ refresh token ได้โดยไม่แก้ไขที่เก็บการยืนยันตัวตนของโฮสต์:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- สโมกเทสต์การ bind ของ ACP: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- สโมกเทสต์แบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- สโมกเทสต์ชุดทดสอบ harness ของแอปเซิร์ฟเวอร์ Codex: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + เอเจนต์สำหรับพัฒนา: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- สโมกเทสต์ observability: `pnpm qa:otel:smoke` เป็นเลนตรวจซอร์สแบบ checkout ส่วนตัวของ QA โดยตั้งใจไม่ให้เป็นส่วนหนึ่งของเลน Docker release ของแพ็กเกจ เพราะ npm tarball ละเว้น QA Lab
- สโมกเทสต์แบบสดของ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ด onboarding (TTY, scaffolding เต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- สโมกเทสต์ onboarding/channel/agent ของ Npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น, รัน doctor และรันหนึ่งรอบของเอเจนต์ OpenAI แบบ mock ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือเปลี่ยน channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- สโมกเทสต์การสลับ update channel: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` ไปเป็น git `dev`, ตรวจสอบ channel ที่บันทึกไว้และงานหลังอัปเดตของ Plugin, จากนั้นสลับกลับไปเป็นแพ็กเกจ `stable` และตรวจสถานะการอัปเดต
- สโมกเทสต์ผู้รอดจากการอัปเกรด: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าที่มีสถานะสกปรก พร้อมเอเจนต์, config ของ channel, allowlist ของ Plugin, สถานะ dependency ของ Plugin ที่เก่า และไฟล์ workspace/session ที่มีอยู่ รัน package update พร้อม doctor แบบ non-interactive โดยไม่มี provider สดหรือคีย์ channel จากนั้นเริ่ม Gateway แบบ loopback และตรวจการคงสภาพ config/state พร้อมงบเวลาของ startup/status
- สโมกเทสต์ผู้รอดจากการอัปเกรดเวอร์ชันที่เผยแพร่แล้ว: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้เดิมที่สมจริง, กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นไปเป็น tarball ตัว candidate, รัน doctor แบบ non-interactive, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจ configured intents, การคงสภาพ state, startup, `/healthz`, `/readyz` และงบเวลาของสถานะ RPC Override baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ aggregate scheduler ขยาย baseline แบบเจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` และขยาย fixture รูปแบบ issue ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- สโมกเทสต์ runtime context ของ session: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของทรานสคริปต์ runtime context ที่ซ่อนอยู่ พร้อมการซ่อมแซมด้วย doctor สำหรับ branch การเขียน prompt ซ้ำที่ซ้ำกันและได้รับผลกระทบ
- สโมกเทสต์การติดตั้ง Bun แบบ global: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกออกมา และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืนผู้ให้บริการภาพที่ bundling มาแทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ build บนโฮสต์ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- สโมกเทสต์ Installer Docker: `bash scripts/test-install-sh-docker.sh` ใช้ npm cache เดียวร่วมกันระหว่างคอนเทนเนอร์ root, update และ direct-npm สโมกเทสต์ update ใช้ npm `latest` เป็น baseline stable ตามค่าเริ่มต้นก่อนอัปเกรดไปยัง candidate tarball Override ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วย input `update_baseline_version` ของ workflow Install Smoke บน GitHub การตรวจ installer แบบไม่ใช่ root ใช้ npm cache ที่แยกออกมาเพื่อไม่ให้รายการ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อนำ cache root/update/direct-npm กลับมาใช้ซ้ำระหว่างการรันซ้ำในเครื่อง
- Install Smoke CI ข้ามการอัปเดตแบบ direct-npm global ที่ซ้ำกันด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม direct `npm install -g`
- สโมกเทสต์ CLI สำหรับการลบ workspace ที่ใช้ร่วมกันของเอเจนต์: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) build image จาก Dockerfile รากตามค่าเริ่มต้น, seed เอเจนต์สองตัวพร้อม workspace หนึ่งรายการใน container home ที่แยกออกมา, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการเก็บ workspace ไว้ ใช้ install-smoke image ซ้ำได้ด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- สโมกเทสต์ snapshot ของ Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E จากซอร์สพร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่า snapshot ของบทบาท CDP ครอบคลุม URL ของลิงก์, clickable ที่ยกระดับจาก cursor, iframe refs และ metadata ของ frame
- รีเกรสชัน reasoning ขั้นต่ำของ OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบ mock ผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ schema ของ provider reject และตรวจว่ารายละเอียดดิบปรากฏใน log ของ Gateway
- บริดจ์ channel ของ MCP (Gateway ที่ seed แล้ว + stdio bridge + สโมกเทสต์ notification-frame ดิบของ Claude): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ของ bundle Pi (เซิร์ฟเวอร์ MCP stdio จริง + สโมกเทสต์ allow/deny ของโปรไฟล์ Pi ที่ฝังไว้): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การ cleanup MCP ของ Cron/subagent (Gateway จริง + teardown ของ child MCP stdio หลังการรัน cron แบบ isolated และ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (สโมกเทสต์ install/update สำหรับ local path, `file:`, npm registry พร้อม dependencies ที่ hoist แล้ว, git moving refs, ClawHub kitchen-sink, marketplace updates และการ enable/inspect Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือ override คู่แพ็กเกจ/runtime kitchen-sink ตามค่าเริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub แบบ hermetic ในเครื่อง
- สโมกเทสต์การอัปเดต Plugin ที่ไม่มีการเปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- สโมกเทสต์ metadata สำหรับการ reload config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` ครอบคลุมสโมกเทสต์ install/update สำหรับ local path, `file:`, npm registry พร้อม dependencies ที่ hoist แล้ว, git moving refs, fixture ของ ClawHub, marketplace updates และการ enable/inspect Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่มีการเปลี่ยนแปลงสำหรับ Plugin ที่ติดตั้งแล้ว

หากต้องการ prebuild และใช้ image ฟังก์ชันที่ใช้ร่วมกันซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

ค่า override image เฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังมีผลเหนือกว่าเมื่อถูกตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง image ที่ใช้ร่วมกันจาก remote สคริปต์จะ pull image นั้นหากยังไม่มีในเครื่อง การทดสอบ QR และ installer Docker เก็บ Dockerfile ของตัวเองไว้ เพราะตรวจสอบพฤติกรรมของ package/install แทนที่จะตรวจ runtime ของแอปที่ build แล้วซึ่งใช้ร่วมกัน

ตัวรัน Docker สำหรับ live-model ยัง bind-mount checkout ปัจจุบันแบบ read-only และ
stage ไปยัง workdir ชั่วคราวภายในคอนเทนเนอร์ด้วย วิธีนี้ช่วยให้ runtime
image มีขนาดเล็ก ในขณะที่ยังรัน Vitest กับซอร์ส/config ในเครื่องของคุณแบบตรงตัว
ขั้นตอน staging จะข้าม cache ขนาดใหญ่ที่มีเฉพาะในเครื่องและ output การ build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี output `.build` ภายในแอปหรือ
Gradle เพื่อไม่ให้การรัน Docker แบบสดเสียเวลาหลายนาทีไปกับการคัดลอก
artifact เฉพาะเครื่อง
ตัวรันเหล่านี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อไม่ให้ probe สดของ Gateway เริ่ม
worker ของ channel จริงอย่าง Telegram/Discord/ฯลฯ ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้นความครอบคลุมสดของ Gateway
จากเลน Docker นั้น
`test:docker:openwebui` เป็นสโมกเทสต์ compatibility ระดับสูงกว่า: เริ่มคอนเทนเนอร์
OpenClaw gateway โดยเปิดใช้ endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ pin ไว้กับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default`, จากนั้นส่ง
คำขอแชทจริงผ่าน proxy `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้ากว่าอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
image ของ Open WebUI และ Open WebUI อาจต้องตั้งค่า cold-start ของตัวเองให้เสร็จ
เลนนี้คาดหวังคีย์โมเดลสดที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` ตามค่าเริ่มต้น) เป็นวิธีหลักในการจัดหาให้ในการรันแบบ Dockerized
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกตั้งใจให้ deterministic และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง โดยบูตคอนเทนเนอร์ Gateway ที่ seed แล้ว,
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve`, จากนั้น
ตรวจสอบการค้นพบ conversation แบบ routed, การอ่าน transcript, metadata ของ attachment,
พฤติกรรมคิว event สด, routing การส่งออก และการแจ้งเตือน channel +
permission แบบ Claude ผ่าน stdio MCP bridge จริง การตรวจ notification
ตรวจ frame stdio MCP ดิบโดยตรง เพื่อให้สโมกเทสต์ตรวจสอบสิ่งที่
bridge ปล่อยออกมาจริง ไม่ใช่เพียงสิ่งที่ client SDK เฉพาะรายบังเอิญแสดงขึ้นมา
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้คีย์โมเดลสด
โดย build Docker image ของ repo, เริ่มเซิร์ฟเวอร์ probe MCP stdio จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime MCP ของ bundle Pi ที่ฝังไว้,
เรียกใช้เครื่องมือ จากนั้นตรวจสอบว่า `coding` และ `messaging` เก็บ
เครื่องมือ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองเครื่องมือเหล่านั้นออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้คีย์โมเดลสด
โดยเริ่ม Gateway ที่ seed แล้วพร้อมเซิร์ฟเวอร์ probe MCP stdio จริง, รัน
รอบ cron แบบ isolated และรอบ child one-shot ของ `/subagents spawn`, จากนั้นตรวจสอบว่า
process ลูกของ MCP ออกหลังการรันแต่ละครั้ง

สโมกเทสต์เธรด ACP ภาษาธรรมดาแบบ manual (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow รีเกรสชัน/ดีบัก อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบ routing เธรด ACP ดังนั้นอย่าลบออก

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) เมานต์ไปยัง `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) เมานต์ไปยัง `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) เมานต์ไปยัง `/home/node/.profile` และถูก source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env vars ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราว และไม่มีการเมานต์ auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) เมานต์ไปยัง `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกภายใต้ `$HOME` จะถูกเมานต์แบบอ่านอย่างเดียวภายใต้ `/host-auth...` แล้วคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดขอบเขตจะเมานต์เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - แทนที่ด้วยตนเองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง providers ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ image `openclaw:local-live` ที่มีอยู่แล้วซ้ำสำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือก model ที่ Gateway เปิดเผยให้ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อแทนที่ nonce-check prompt ที่ Open WebUI smoke ใช้
- `OPENWEBUI_IMAGE=...` เพื่อแทนที่ tag ของ image Open WebUI ที่ปักหมุดไว้

## การตรวจสอบความสมเหตุสมผลของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`.
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจสอบหัวข้อภายในหน้าด้วย: `pnpm docs:check-links:anchors`.

## การถดถอยแบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือการถดถอยแบบ “pipeline จริง” โดยไม่มี providers จริง:

- การเรียกใช้เครื่องมือของ Gateway (mock OpenAI, gateway จริง + agent loop): `src/gateway/gateway.test.ts` (กรณี: "รันการเรียกใช้เครื่องมือ OpenAI แบบ mock ตั้งแต่ต้นจนจบผ่าน gateway agent loop")
- ตัวช่วยตั้งค่า Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (กรณี: "รัน wizard ผ่าน ws และเขียน config ของ auth token")

## การประเมินความน่าเชื่อถือของ agent (skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานเหมือน “การประเมินความน่าเชื่อถือของ agent”:

- การเรียกใช้เครื่องมือแบบ mock ผ่าน Gateway จริง + agent loop (`src/gateway/gateway.test.ts`).
- โฟลว์ wizard ตั้งแต่ต้นจนจบที่ตรวจสอบ session wiring และผลของ config (`src/gateway/gateway.test.ts`).

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อ skills ถูกแสดงใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงอันที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตามข้อกำหนด:** agent อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญาของ workflow:** สถานการณ์หลาย turn ที่ assert ลำดับเครื่องมือ การส่งต่อประวัติ session และขอบเขต sandbox

การประเมินในอนาคตควรเริ่มจากความกำหนดซ้ำได้ก่อน:

- ตัวรันสถานการณ์ที่ใช้ mock providers เพื่อ assert การเรียกเครื่องมือ + ลำดับ การอ่านไฟล์ skill และ session wiring
- ชุดสถานการณ์ขนาดเล็กที่เน้น skill (ใช้ vs หลีกเลี่ยง, gating, prompt injection)
- การประเมิน live แบบไม่บังคับ (opt-in, ควบคุมด้วย env) หลังจากชุดที่ปลอดภัยสำหรับ CI พร้อมแล้วเท่านั้น

## การทดสอบสัญญา (รูปร่างของ plugin และ channel)

การทดสอบสัญญาตรวจสอบว่า Plugin และ channel ที่ลงทะเบียนทุกตัวสอดคล้องกับ
สัญญา interface ของตน โดยจะวนผ่าน plugins ที่ค้นพบทั้งหมดและรันชุด
assertion ด้านรูปร่างและพฤติกรรม lane unit ของ `pnpm test` ค่าเริ่มต้นตั้งใจ
ข้ามไฟล์ shared seam และ smoke เหล่านี้ ให้รันคำสั่ง contract อย่างชัดเจน
เมื่อคุณแตะพื้นผิว channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- สัญญา channel เท่านั้น: `pnpm test:contracts:channels`
- สัญญา provider เท่านั้น: `pnpm test:contracts:plugins`

### สัญญา channel

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่าง Plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญา setup wizard
- **session-binding** - พฤติกรรม session binding
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของ channel
- **threading** - การจัดการ thread ID
- **directory** - Directory/roster API
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### สัญญาสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`.

- **status** - การตรวจสอบสถานะ channel
- **registry** - รูปร่าง registry ของ Plugin

### สัญญา provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญาโฟลว์ auth
- **auth-choice** - ตัวเลือก/การเลือก auth
- **catalog** - Model catalog API
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - Runtime ของ provider
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - Setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน exports หรือ subpaths ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

การทดสอบสัญญารันใน CI และไม่ต้องใช้ API keys จริง

## การเพิ่มการถดถอย (แนวทาง)

เมื่อคุณแก้ปัญหา provider/model ที่พบจาก live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI ถ้าเป็นไปได้ (mock/stub provider หรือจับ transformation ของ request-shape ที่แน่นอน)
- ถ้าเป็น live-only โดยเนื้อแท้ (rate limits, auth policies) ให้รักษาการทดสอบ live ให้แคบและ opt-in ผ่าน env vars
- เลือกเลเยอร์ที่เล็กที่สุดที่จับ bug ได้:
  - bug การแปลง/replay request ของ provider → การทดสอบ models โดยตรง
  - bug ใน pipeline ของ gateway session/history/tool → gateway live smoke หรือการทดสอบ gateway mock ที่ปลอดภัยสำหรับ CI
- Guardrail การ traversal ของ SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ที่สุ่มตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`), แล้ว assert ว่า exec ids แบบ traversal-segment ถูก reject
  - ถ้าคุณเพิ่ม target family ของ SecretRef แบบ `includeInPlan` ใหม่ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในการทดสอบนั้น การทดสอบตั้งใจให้ fail เมื่อเจอ target ids ที่ไม่ได้ classify เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบ live](/th/help/testing-live)
- [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
