---
read_when:
    - การรันการทดสอบในเครื่องหรือใน CI
    - การเพิ่มการทดสอบถดถอยสำหรับบั๊กของโมเดล/ผู้ให้บริการ
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่การทดสอบแต่ละรายการครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-05-03T10:12:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw มีชุดทดสอบ Vitest สามชุด (หน่วย/การผสานรวม, e2e, live) และชุดตัวรัน Docker ขนาดเล็ก เอกสารนี้เป็นคู่มือ "วิธีที่เราทดสอบ":

- แต่ละชุดทดสอบครอบคลุมอะไร (และตั้งใจ _ไม่_ ครอบคลุมอะไร)
- คำสั่งที่ควรรันสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, การดีบัก)
- วิธีที่การทดสอบ live ค้นหาข้อมูลรับรองและเลือกโมเดล/ผู้ให้บริการ
- วิธีเพิ่มการทดสอบถดถอยสำหรับปัญหาโมเดล/ผู้ให้บริการในโลกจริง

<Note>
**สแต็ก QA (qa-lab, qa-channel, เลนขนส่ง live)** มีเอกสารแยกต่างหาก:

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สถาปัตยกรรม, พื้นผิวคำสั่ง, การเขียนสถานการณ์
- [Matrix QA](/th/concepts/qa-matrix) — เอกสารอ้างอิงสำหรับ `pnpm openclaw qa matrix`
- [ช่องทาง QA](/th/channels/qa-channel) — Plugin ขนส่งสังเคราะห์ที่ใช้โดยสถานการณ์ที่อิงกับ repo

หน้านี้ครอบคลุมการรันชุดทดสอบปกติและตัวรัน Docker/Parallels ส่วนตัวรันเฉพาะ QA ด้านล่าง ([ตัวรันเฉพาะ QA](#qa-specific-runners)) แสดงคำสั่ง `qa` ที่เป็นรูปธรรมและชี้กลับไปยังเอกสารอ้างอิงด้านบน
</Note>

## เริ่มต้นอย่างรวดเร็ว

ในวันส่วนใหญ่:

- เกตเต็มรูปแบบ (คาดหวังก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรันชุดทดสอบเต็มในเครื่องที่เร็วขึ้นบนเครื่องที่มีทรัพยากรมาก: `pnpm test:max`
- ลูปเฝ้าดู Vitest โดยตรง: `pnpm test:watch`
- การระบุไฟล์โดยตรงตอนนี้กำหนดเส้นทาง extension/channel ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรใช้การรันแบบเจาะจงก่อนเมื่อคุณกำลังวนแก้ความล้มเหลวเดียว
- ไซต์ QA ที่รองรับด้วย Docker: `pnpm qa:lab:up`
- เลน QA ที่รองรับด้วย VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะการทดสอบหรือต้องการความมั่นใจเพิ่ม:

- เกตความครอบคลุม: `pnpm test:coverage`
- ชุดทดสอบ E2E: `pnpm test:e2e`

เมื่อดีบักผู้ให้บริการ/โมเดลจริง (ต้องมีข้อมูลรับรองจริง):

- ชุดทดสอบ live (โมเดล + การตรวจสอบ Gateway tool/image): `pnpm test:live`
- เจาะจงไฟล์ live หนึ่งไฟล์แบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- รายงานประสิทธิภาพรันไทม์: dispatch `OpenClaw Performance` ด้วย
  `live_gpt54=true` สำหรับเทิร์น agent `openai/gpt-5.4` จริง หรือ
  `deep_profile=true` สำหรับอาร์ติแฟกต์ CPU/heap/trace ของ Kova การรันตามกำหนดรายวัน
  เผยแพร่อาร์ติแฟกต์เลน mock-provider, deep-profile และ GPT 5.4 ไปยัง
  `openclaw/clawgrit-reports` เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว
  รายงาน mock-provider ยังรวมตัวเลขการบูต Gateway ระดับซอร์ส, หน่วยความจำ,
  plugin-pressure, fake-model hello-loop ซ้ำ และการเริ่มต้น CLI ด้วย
- การกวาดโมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - แต่ละโมเดลที่เลือกตอนนี้รันเทิร์นข้อความและโพรบขนาดเล็กแบบอ่านไฟล์
    โมเดลที่ metadata ระบุว่ารับอินพุต `image` จะรันเทิร์นรูปภาพขนาดจิ๋วด้วย
    ปิดโพรบเพิ่มเติมด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อแยกปัญหาผู้ให้บริการ
  - ความครอบคลุมใน CI: `OpenClaw Scheduled Live And E2E Checks` รายวันและ
    `OpenClaw Release Checks` แบบ manual ต่างเรียกเวิร์กโฟลว์ live/E2E ที่นำกลับใช้ซ้ำได้ด้วย
    `include_live_suites: true` ซึ่งรวมงานเมทริกซ์โมเดล live ของ Docker แยกต่างหาก
    ที่ shard ตามผู้ให้บริการ
  - สำหรับการรันซ้ำ CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    ด้วย `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม secret ผู้ให้บริการที่มีสัญญาณสูงใหม่ใน `scripts/ci-hydrate-live-auth.sh`
    รวมถึง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และ caller
    แบบ scheduled/release ของมัน
- smoke สำหรับแชตที่ bind กับ Codex native: `pnpm test:docker:live-codex-bind`
  - รันเลน Docker live กับพาธ app-server ของ Codex, bind Slack DM สังเคราะห์ด้วย `/codex bind`,
    ทดสอบ `/codex fast` และ
    `/codex permissions` จากนั้นตรวจสอบการตอบกลับธรรมดาและเส้นทางไฟล์แนบรูปภาพ
    ผ่านการ binding Plugin แบบ native แทน ACP
- smoke สำหรับ harness app-server ของ Codex: `pnpm test:docker:live-codex-harness`
  - รันเทิร์น agent ของ Gateway ผ่าน harness app-server ของ Codex ที่ Plugin เป็นเจ้าของ
    ตรวจสอบ `/codex status` และ `/codex models` และโดยค่าเริ่มต้นทดสอบโพรบรูปภาพ,
    Cron MCP, sub-agent และ Guardian ปิดโพรบ sub-agent ด้วย
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` เมื่อแยกความล้มเหลวอื่นของ
    app-server Codex สำหรับการตรวจ sub-agent แบบเจาะจง ให้ปิดโพรบอื่น:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`
    คำสั่งนี้จะออกหลังโพรบ sub-agent เว้นแต่ตั้งค่า
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`
- smoke คำสั่งกู้คืน Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจแบบสมัครใจที่รัดกุมเป็นพิเศษสำหรับพื้นผิวคำสั่งกู้คืน message-channel
    โดยจะทดสอบ `/crestodian status`, จัดคิวการเปลี่ยนโมเดลแบบถาวร,
    ตอบกลับ `/crestodian yes` และตรวจสอบพาธการเขียน audit/config
- smoke Docker สำหรับ planner ของ Crestodian: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ในคอนเทนเนอร์ที่ไม่มีคอนฟิกพร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fallback planner แบบ fuzzy แปลเป็นการเขียนคอนฟิกแบบ typed ที่มี audit
- smoke Docker สำหรับการรันครั้งแรกของ Crestodian: `pnpm test:docker:crestodian-first-run`
  - เริ่มจากไดเรกทอรีสถานะ OpenClaw ว่าง, กำหนดเส้นทาง `openclaw` เปล่าไปยัง
    Crestodian, ใช้การเขียน setup/model/agent/Discord Plugin + SecretRef,
    ตรวจสอบคอนฟิก และตรวจสอบรายการ audit พาธตั้งค่า Ring 0 เดียวกันยังครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ต้นทุน Moonshot/Kimi: เมื่อตั้งค่า `MOONSHOT_API_KEY` แล้ว ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ
  transcript ของ assistant เก็บ `usage.cost` ที่ normalized แล้ว

<Tip>
เมื่อคุณต้องการเฉพาะกรณีที่ล้มเหลวหนึ่งกรณี ควรจำกัดขอบเขตการทดสอบ live ผ่านตัวแปร env allowlist ที่อธิบายด้านล่าง
</Tip>

## ตัวรันเฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI รัน QA Lab ในเวิร์กโฟลว์เฉพาะ Agentic parity ซ้อนอยู่ภายใต้
`QA-Lab - All Lanes` และการตรวจสอบ release ไม่ใช่เวิร์กโฟลว์ PR แยกต่างหาก
การตรวจสอบแบบกว้างควรใช้ `Full Release Validation` ด้วย
`rerun_group=qa-parity` หรือกลุ่ม QA ของ release-checks `QA-Lab - All Lanes`
รันทุกคืนบน `main` และจาก manual dispatch พร้อมเลน mock parity, เลน Matrix live,
เลน Telegram live ที่ Convex จัดการ และเลน Discord live ที่ Convex จัดการ
เป็นงานแบบขนาน Scheduled QA และ release checks ส่ง Matrix
`--profile fast` อย่างชัดเจน ขณะที่ค่าเริ่มต้นของ Matrix CLI และ input เวิร์กโฟลว์แบบ manual
ยังคงเป็น `all`; manual dispatch สามารถ shard `all` เป็นงาน `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` ได้ `OpenClaw Release
Checks` รัน parity รวมถึงเลน Matrix และ Telegram แบบ fast ก่อนอนุมัติ release
โดยใช้ `mock-openai/gpt-5.5` สำหรับการตรวจ release transport เพื่อให้ผลคงที่
และหลีกเลี่ยงการเริ่มต้น provider-plugin ตามปกติ Gateway ขนส่ง live เหล่านี้
ปิดการค้นหาหน่วยความจำไว้; พฤติกรรมหน่วยความจำยังครอบคลุมโดยชุด QA parity

shard สื่อ live สำหรับ full release ใช้
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งมี
`ffmpeg` และ `ffprobe` อยู่แล้ว shard โมเดล/แบ็กเอนด์ live ของ Docker ใช้อิมเมจร่วม
`ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ build หนึ่งครั้งต่อ commit ที่เลือก
จากนั้น pull ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` แทนการ rebuild
ภายในทุก shard

- `pnpm openclaw qa suite`
  - เรียกใช้สถานการณ์ QA ที่อิงกับ repo โดยตรงบนโฮสต์
  - เรียกใช้สถานการณ์ที่เลือกหลายรายการพร้อมกันตามค่าเริ่มต้นด้วย Gateway worker
    ที่แยกกัน `qa-channel` ใช้ concurrency 4 เป็นค่าเริ่มต้น (จำกัดด้วยจำนวน
    สถานการณ์ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ lane แบบ serial เดิม
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - รองรับโหมด provider `live-frontier`, `mock-openai` และ `aimock`
    `aimock` เริ่มเซิร์ฟเวอร์ provider ภายในเครื่องที่อิงกับ AIMock สำหรับ
    fixture เชิงทดลองและความครอบคลุม protocol-mock โดยไม่แทนที่ lane
    `mock-openai` ที่รับรู้สถานการณ์
- `pnpm test:gateway:cpu-scenarios`
  - เรียกใช้ bench การเริ่มต้น Gateway พร้อมชุดสถานการณ์ QA Lab แบบ mock ขนาดเล็ก
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) และเขียนสรุปการสังเกต CPU แบบรวมไว้ใต้
    `.artifacts/gateway-cpu-scenarios/`
  - ทำเครื่องหมายเฉพาะการสังเกต CPU ร้อนที่ต่อเนื่องตามค่าเริ่มต้น (`--cpu-core-warn`
    พร้อม `--hot-wall-warn-ms`) ดังนั้น burst สั้นๆ ตอนเริ่มต้นจะถูกบันทึกเป็น metric
    โดยไม่ดูเหมือน regression ที่ทำให้ Gateway ตรึง CPU นานหลายนาที
  - ใช้ artifact `dist` ที่ build แล้ว; เรียกใช้ build ก่อนเมื่อ checkout ยังไม่มี
    output runtime ที่สดใหม่
- `pnpm openclaw qa suite --runner multipass`
  - เรียกใช้ชุด QA เดียวกันภายใน Multipass Linux VM แบบใช้แล้วทิ้ง
  - คงพฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
  - ใช้ flag การเลือก provider/model เดียวกับ `qa suite`
  - การรัน live จะส่งต่อ input การยืนยันตัวตน QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
    key ของ provider จาก env, path config provider live ของ QA และ `CODEX_HOME`
    เมื่อมีอยู่
  - output dir ต้องอยู่ใต้ repo root เพื่อให้ guest เขียนกลับผ่าน workspace ที่ mount ได้
  - เขียนรายงาน QA + สรุปตามปกติ พร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่มไซต์ QA ที่อิงกับ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - build npm tarball จาก checkout ปัจจุบัน ติดตั้งแบบ global ใน
    Docker เรียกใช้ onboarding ของ OpenAI API-key แบบไม่โต้ตอบ กำหนดค่า Telegram
    ตามค่าเริ่มต้น ตรวจสอบว่า runtime ของ Plugin ที่ package แล้วโหลดได้โดยไม่ต้อง
    ซ่อม dependency ตอนเริ่มต้น เรียกใช้ doctor และเรียกใช้ agent turn ภายในเครื่องหนึ่งครั้งกับ
    endpoint OpenAI ที่ mock
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อเรียกใช้ lane packaged-install
    เดียวกันกับ Discord
- `pnpm test:docker:session-runtime-context`
  - เรียกใช้ Docker smoke ของแอปที่ build แล้วแบบ deterministic สำหรับ transcript
    runtime context แบบฝังตัว โดยตรวจสอบว่า runtime context ที่ซ่อนของ OpenClaw
    ถูก persist เป็นข้อความ custom ที่ไม่แสดงผล แทนที่จะรั่วไปยัง user turn ที่มองเห็นได้
    จากนั้น seed JSONL ของ session ที่เสียซึ่งได้รับผลกระทบ และตรวจสอบว่า
    `openclaw doctor --fix` เขียนใหม่ไปยัง active branch พร้อม backup
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้ง package candidate ของ OpenClaw ใน Docker เรียกใช้ onboarding
    ของ installed-package กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นใช้
    lane QA live ของ Telegram ซ้ำ โดยใช้ package ที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` หรือ
    `OPENCLAW_CURRENT_PACKAGE_TGZ` เพื่อทดสอบ tarball ภายในเครื่องที่ resolve แล้วแทนการ
    ติดตั้งจาก registry
  - ใช้ credential env ของ Telegram เดียวกันหรือแหล่ง credential Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับ automation ของ CI/release ให้ตั้งค่า
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หาก
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret มีอยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` override ค่า shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` สำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดเผย lane นี้เป็น workflow maintainer แบบ manual
    `NPM Telegram Beta E2E` ซึ่งไม่ทำงานเมื่อ merge workflow ใช้ environment
    `qa-live-shared` และ lease credential ของ Convex CI
- GitHub Actions ยังเปิดเผย `Package Acceptance` สำหรับ product proof แบบ side-run
  กับ package candidate หนึ่งรายการ โดยรับ trusted ref, spec npm ที่ publish แล้ว,
  URL tarball HTTPS พร้อม SHA-256 หรือ artifact tarball จาก run อื่น อัปโหลด
  `openclaw-current.tgz` ที่ normalize แล้วเป็น `package-under-test` จากนั้นเรียกใช้
  Docker E2E scheduler ที่มีอยู่ด้วย profile lane smoke, package, product, full หรือ custom
  ตั้งค่า `telegram_mode=mock-openai` หรือ `live-frontier` เพื่อเรียกใช้ workflow QA
  ของ Telegram กับ artifact `package-under-test` เดียวกัน
  - product proof ของ beta ล่าสุด:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof ด้วย URL tarball แบบเจาะจงต้องใช้ digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- proof ด้วย artifact จะดาวน์โหลด artifact tarball จาก Actions run อื่น:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - pack และติดตั้ง build ปัจจุบันของ OpenClaw ใน Docker เริ่ม Gateway
    โดยกำหนดค่า OpenAI แล้วเปิดใช้ channel/plugins ที่ bundled ผ่านการแก้ config
  - ตรวจสอบว่า setup discovery ปล่อยให้ Plugin ที่ดาวน์โหลดได้แต่ยังไม่ได้กำหนดค่าไม่ปรากฏอยู่
    การซ่อม doctor ครั้งแรกที่กำหนดค่าจะติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายแต่ละรายการอย่างชัดเจน
    และการ restart ครั้งที่สองไม่เรียกใช้การซ่อม dependency ที่ซ่อนอยู่
  - ยังติดตั้ง baseline npm รุ่นเก่าที่ทราบ เปิดใช้ Telegram ก่อนเรียกใช้
    `openclaw update --tag <candidate>` และตรวจสอบว่า doctor หลัง update ของ candidate
    ล้างเศษ dependency ของ Plugin แบบ legacy โดยไม่มีการซ่อม postinstall จากฝั่ง harness
- `pnpm test:parallels:npm-update`
  - เรียกใช้ smoke การอัปเดต packaged-install แบบ native ครอบคลุม guest ของ Parallels
    แต่ละ platform ที่เลือกจะติดตั้ง package baseline ที่ร้องขอก่อน จากนั้นเรียกใช้คำสั่ง
    `openclaw update` ที่ติดตั้งแล้วใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง
    สถานะการอัปเดต ความพร้อมของ Gateway และ agent turn ภายในเครื่องหนึ่งครั้ง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` ระหว่าง
    iterate กับ guest หนึ่งรายการ ใช้ `--json` สำหรับ path ของ summary artifact และ
    สถานะต่อ lane
  - lane OpenAI ใช้ `openai/gpt-5.5` สำหรับ proof agent-turn แบบ live ตามค่าเริ่มต้น
    ส่ง `--model <provider/model>` หรือกำหนด
    `OPENCLAW_PARALLELS_OPENAI_MODEL` เมื่อจงใจตรวจสอบ OpenAI model อื่น
  - ห่อการรันภายในเครื่องที่ยาวด้วย timeout ของโฮสต์ เพื่อไม่ให้การค้างของ transport
    Parallels ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script เขียน log ของ lane แบบ nested ไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสันนิษฐานว่า wrapper ชั้นนอกค้าง
  - การอัปเดต Windows อาจใช้เวลา 10 ถึง 15 นาทีในงาน doctor หลัง update และงาน
    update package บน guest ที่ยัง cold; ยังถือว่าปกติเมื่อ nested npm
    debug log กำลังคืบหน้า
  - อย่าเรียกใช้ wrapper แบบ aggregate นี้พร้อมกันกับ lane smoke รายตัวของ Parallels
    macOS, Windows หรือ Linux เนื่องจากแชร์สถานะ VM และอาจชนกันในการ restore snapshot,
    การให้บริการ package หรือสถานะ Gateway ของ guest
  - proof หลัง update เรียกใช้พื้นผิว Plugin แบบ bundled ตามปกติ เพราะ
    capability facade เช่น speech, image generation และ media
    understanding ถูกโหลดผ่าน runtime API ที่ bundled แม้ agent
    turn เองจะตรวจสอบเพียง response ข้อความง่ายๆ

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ภายในเครื่องสำหรับการทดสอบ smoke ของ protocol โดยตรง
- `pnpm openclaw qa matrix`
  - เรียกใช้ lane QA live ของ Matrix กับ homeserver Tuwunel แบบใช้แล้วทิ้งที่อิงกับ Docker เฉพาะ source-checkout เท่านั้น — packaged install ไม่ได้ ship `qa-lab`
  - CLI เต็ม, catalog ของ profile/scenario, env var และ layout artifact: [Matrix QA](/th/concepts/qa-matrix)
- `pnpm openclaw qa telegram`
  - เรียกใช้ lane QA live ของ Telegram กับ private group จริงโดยใช้ driver และ token ของ SUT bot จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` group id ต้องเป็น chat id ของ Telegram แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credential แบบ pooled ที่แชร์กัน ใช้โหมด env เป็นค่าเริ่มต้น หรือกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease แบบ pooled
  - ออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณ
    ต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
  - ต้องใช้ bot สองตัวที่แตกต่างกันใน private group เดียวกัน โดย SUT bot ต้องเปิดเผย username ของ Telegram
  - เพื่อการสังเกต bot-to-bot ที่เสถียร ให้เปิดใช้ Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับ bot ทั้งสองตัว และตรวจสอบว่า driver bot สังเกต traffic ของ bot ใน group ได้
  - เขียนรายงาน QA ของ Telegram, สรุป และ artifact observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` สถานการณ์ที่มีการตอบกลับรวม RTT ตั้งแต่คำขอส่งของ driver ไปจนถึง reply ของ SUT ที่สังเกตได้

lane transport live ใช้ contract มาตรฐานเดียวกันเพื่อไม่ให้ transport ใหม่ drift; matrix ความครอบคลุมต่อ lane อยู่ใน [ภาพรวม QA → ความครอบคลุม transport live](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` คือชุด synthetic แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของ matrix นั้น

### credential Telegram ที่แชร์ผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram` แล้ว QA lab จะได้ lease แบบ exclusive จาก pool ที่อิงกับ Convex, ส่ง heartbeat
ให้ lease นั้นขณะ lane กำลังทำงาน และปล่อย lease เมื่อ shutdown

โครง scaffold โปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env var ที่ต้องมี:

- `OPENCLAW_QA_CONVEX_SITE_URL` (เช่น `https://your-deployment.convex.site`)
- secret หนึ่งรายการสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้น env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นเป็น `ci` ใน CI, ไม่เช่นนั้นเป็น `maintainer`)

env var เสริม:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id เสริม)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนา local-only

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
endpoint prefix, HTTP timeout และความสามารถในการเข้าถึง admin/list โดยไม่พิมพ์
ค่า secret ใช้ `--json` สำหรับ output ที่อ่านโดยเครื่องได้ใน script และ utility ของ CI

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
- `POST /admin/add` (เฉพาะความลับของผู้ดูแล)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (เฉพาะความลับของผู้ดูแล)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (เฉพาะความลับของผู้ดูแล)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปแบบ payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริงรหัสแชต Telegram แบบตัวเลข
- `admin/add` ตรวจสอบรูปแบบนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่มีรูปแบบไม่ถูกต้อง

### การเพิ่มช่องทางใน QA

ชื่อสถาปัตยกรรมและตัวช่วยสถานการณ์สำหรับอะแดปเตอร์ช่องทางใหม่อยู่ใน [ภาพรวม QA → การเพิ่มช่องทาง](/th/concepts/qa-e2e-automation#adding-a-channel) เกณฑ์ขั้นต่ำ: ใช้งานตัวรัน transport บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน, ประกาศ `qaRunners` ใน manifest ของ Plugin, เมานต์เป็น `openclaw qa <runner>`, และเขียนสถานการณ์ใต้ `qa/scenarios/`

## ชุดทดสอบ (อะไรทำงานที่ไหน)

ให้มองชุดทดสอบเป็น “ความสมจริงที่เพิ่มขึ้น” (และความไม่เสถียร/ต้นทุนที่เพิ่มขึ้น):

### หน่วย / อินทิเกรชัน (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- คอนฟิก: การรันที่ไม่ได้ระบุเป้าหมายใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย shard แบบหลายโปรเจกต์เป็นคอนฟิกต่อโปรเจกต์เพื่อการจัดตารางแบบขนาน
- ไฟล์: รายการ core/unit ใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, และ `test/**/*.test.ts`; การทดสอบหน่วย UI รันใน shard `unit-ui` เฉพาะ
- ขอบเขต:
  - การทดสอบหน่วยล้วน
  - การทดสอบอินทิเกรชันในกระบวนการ (การยืนยันตัวตนของ Gateway, การจัดเส้นทาง, tooling, การแยกวิเคราะห์, คอนฟิก)
  - regression แบบกำหนดผลได้สำหรับบั๊กที่รู้จัก
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้คีย์จริง
  - ควรเร็วและเสถียร
  - การทดสอบ resolver และตัวโหลด public-surface ต้องพิสูจน์พฤติกรรม fallback ของ `api.js` และ
    `runtime-api.js` แบบกว้างด้วย fixture Plugin ขนาดเล็กที่สร้างขึ้น ไม่ใช่
    API ซอร์สของ Plugin ที่ bundled จริง การโหลด API ของ Plugin จริงควรอยู่ใน
    ชุด contract/integration ที่ Plugin เป็นเจ้าของ

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` ที่ไม่ได้ระบุเป้าหมายรันคอนฟิก shard ขนาดเล็กสิบสองรายการ (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนกระบวนการ root-project แบบเนทีฟขนาดใหญ่ตัวเดียว วิธีนี้ลด RSS สูงสุดบนเครื่องที่มีโหลด และป้องกันไม่ให้งาน auto-reply/extension แย่งทรัพยากรจนชุดทดสอบที่ไม่เกี่ยวข้องขาดช่วง
    - `pnpm test --watch` ยังใช้กราฟโปรเจกต์ root `vitest.config.ts` แบบเนทีฟ เพราะลูป watch แบบหลาย shard ไม่เหมาะกับการใช้งานจริง
    - `pnpm test`, `pnpm test:watch`, และ `pnpm test:perf:imports` ส่งเป้าหมายไฟล์/ไดเรกทอรีที่ระบุชัดผ่านเลนที่มีขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จึงไม่ต้องเสียต้นทุนเริ่มต้นเต็มของ root project
    - `pnpm test:changed` ขยาย path ของ git ที่เปลี่ยนเป็นเลนขอบเขตราคาถูกตามค่าเริ่มต้น: การแก้ไขทดสอบโดยตรง, ไฟล์ sibling `*.test.ts`, การแมปซอร์สที่ระบุชัด, และตัวพึ่งพาในกราฟ import ภายใน การแก้ไขคอนฟิก/setup/package จะไม่รันการทดสอบแบบกว้าง เว้นแต่คุณใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` อย่างชัดเจน
    - `pnpm check:changed` คือ gate ตรวจสอบ local อัจฉริยะปกติสำหรับงานแคบ มันจัดประเภท diff เป็น core, การทดสอบ core, extensions, การทดสอบ extension, apps, docs, เมทาดาทา release, tooling Docker สด, และ tooling จากนั้นรันคำสั่ง typecheck, lint, และ guard ที่ตรงกัน มันไม่รันการทดสอบ Vitest; เรียก `pnpm test:changed` หรือ `pnpm test <target>` แบบระบุชัดสำหรับหลักฐานการทดสอบ การ bump เวอร์ชันที่เป็น release metadata-only รันการตรวจ version/config/root-dependency แบบเจาะจง โดยมี guard ที่ปฏิเสธการเปลี่ยน package นอกฟิลด์ version ระดับบนสุด
    - การแก้ไข harness Docker ACP สดรันการตรวจแบบมุ่งเน้น: syntax shell สำหรับสคริปต์ auth ของ Docker สดและ dry-run ของ scheduler Docker สด การเปลี่ยนแปลง `package.json` จะรวมเฉพาะเมื่อ diff จำกัดอยู่ที่ `scripts["test:docker:live-*"]`; การแก้ไข dependency, export, version, และพื้นผิว package อื่นยังใช้ guard ที่กว้างกว่า
    - การทดสอบหน่วยที่ import เบาจาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk`, และพื้นที่ utility ล้วนที่คล้ายกัน จะถูกส่งผ่านเลน `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มีสถานะหรือ runtime หนักยังอยู่บนเลนเดิม
    - ไฟล์ซอร์สตัวช่วย `plugin-sdk` และ `commands` บางรายการยังแมปการรัน changed-mode ไปยังการทดสอบ sibling ที่ระบุชัดในเลนเบาเหล่านั้น เพื่อให้การแก้ไขตัวช่วยไม่ต้องรันชุดหนักทั้งหมดของไดเรกทอรีนั้นซ้ำ
    - `auto-reply` มี bucket เฉพาะสำหรับตัวช่วย core ระดับบน, การทดสอบอินทิเกรชัน `reply.*` ระดับบน, และ subtree `src/auto-reply/reply/**` CI ยังแบ่ง subtree reply เพิ่มเป็น shard agent-runner, dispatch, และ commands/state-routing เพื่อไม่ให้ bucket ที่ import หนักตัวเดียวครอบครอง tail ของ Node ทั้งหมด
    - CI ของ PR/main ปกติจงใจข้ามการกวาด batch extension และ shard `agentic-plugins` เฉพาะ release Full Release Validation dispatch workflow ลูก `Plugin Prerelease` แยกต่างหากสำหรับชุดที่หนักด้าน plugin/extension เหล่านั้นบน release candidate

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - เมื่อคุณเปลี่ยน input ของการค้นพบ message-tool หรือ context runtime ของ compaction
      ให้คง coverage ทั้งสองระดับไว้
    - เพิ่ม regression ของตัวช่วยแบบมุ่งเน้นสำหรับขอบเขตการจัดเส้นทางและ normalization
      แบบล้วน
    - รักษาชุดอินทิเกรชันของ embedded runner ให้แข็งแรง:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - ชุดเหล่านั้นตรวจสอบว่า id แบบมีขอบเขตและพฤติกรรม Compaction ยังคงไหล
      ผ่าน path `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะตัวช่วย
      ไม่ใช่สิ่งทดแทนที่เพียงพอสำหรับ path อินทิเกรชันเหล่านั้น

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - คอนฟิก Vitest พื้นฐานตั้งค่าเริ่มต้นเป็น `threads`
    - คอนฟิก Vitest ที่ใช้ร่วมกันตรึง `isolate: false` และใช้ตัวรัน
      แบบไม่ isolated ในโปรเจกต์ root, e2e, และคอนฟิก live
    - เลน UI root ยังคง setup และ optimizer `jsdom` ของตัวเอง แต่รันบนตัวรัน
      แบบไม่ isolated ที่ใช้ร่วมกันเช่นกัน
    - shard `pnpm test` แต่ละรายการสืบทอดค่าเริ่มต้น `threads` + `isolate: false`
      เดียวกันจากคอนฟิก Vitest ที่ใช้ร่วมกัน
    - `scripts/run-vitest.mjs` เพิ่ม `--no-maglev` ให้กระบวนการ Node ลูกของ Vitest
      ตามค่าเริ่มต้นเพื่อลด V8 compile churn ระหว่างการรัน local ขนาดใหญ่
      ตั้ง `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม V8
      มาตรฐาน

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` แสดงว่า diff กระตุ้นเลนสถาปัตยกรรมใด
    - hook pre-commit มีไว้สำหรับการฟอร์แมตเท่านั้น มัน stage ไฟล์ที่ฟอร์แมตแล้วใหม่และ
      ไม่รัน lint, typecheck, หรือการทดสอบ
    - รัน `pnpm check:changed` อย่างชัดเจนก่อน handoff หรือ push เมื่อคุณ
      ต้องการ gate ตรวจสอบ local อัจฉริยะ
    - `pnpm test:changed` ส่งผ่านเลนที่มีขอบเขตราคาถูกตามค่าเริ่มต้น ใช้
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อ agent
      ตัดสินว่าการแก้ไข harness, คอนฟิก, package, หรือ contract ต้องการ
      coverage Vitest ที่กว้างขึ้นจริง
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการจัดเส้นทาง
      เดิมไว้ เพียงแต่มีเพดาน worker สูงกว่า
    - การปรับขนาด worker local อัตโนมัติจงใจตั้งไว้อย่างระมัดระวังและลดระดับ
      เมื่อค่า load average ของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest พร้อมกันหลายรายการ
      จะสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - คอนฟิก Vitest พื้นฐานทำเครื่องหมายโปรเจกต์/ไฟล์คอนฟิกเป็น
      `forceRerunTriggers` เพื่อให้การรันซ้ำใน changed-mode ยังคงถูกต้องเมื่อ wiring
      ของการทดสอบเปลี่ยน
    - คอนฟิกคง `OPENCLAW_VITEST_FS_MODULE_CACHE` ให้เปิดใช้งานบนโฮสต์ที่รองรับ;
      ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่ง cache ชัดเจนหนึ่งตำแหน่งสำหรับการ profiling โดยตรง

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` เปิดการรายงานระยะเวลา import ของ Vitest พร้อม
      output รายละเอียด import-breakdown
    - `pnpm test:perf:imports:changed` จำกัดมุมมอง profiling เดียวกันให้อยู่กับ
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - ข้อมูลเวลา shard ถูกเขียนไปที่ `.artifacts/vitest-shard-timings.json`
      การรัน whole-config ใช้ path คอนฟิกเป็น key; shard CI แบบ include-pattern
      ต่อท้ายชื่อ shard เพื่อให้ shard ที่ถูกกรองสามารถติดตามแยกกันได้
    - เมื่อการทดสอบ hot หนึ่งรายการยังใช้เวลาส่วนใหญ่กับ startup imports
      ให้เก็บ dependency หนักไว้หลัง seam local `*.runtime.ts` แคบ ๆ และ
      mock seam นั้นโดยตรงแทนการ deep-import ตัวช่วย runtime เพียง
      เพื่อส่งต่อผ่าน `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` เปรียบเทียบ
      `test:changed` ที่ถูกจัดเส้นทางกับ path root-project แบบเนทีฟสำหรับ diff ที่ commit แล้วนั้น
      และพิมพ์ wall time พร้อม RSS สูงสุดของ macOS
    - `pnpm test:perf:changed:bench -- --worktree` benchmark tree ปัจจุบัน
      ที่ยัง dirty โดยส่งรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และคอนฟิก Vitest root
    - `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU ของ main-thread สำหรับ
      overhead การเริ่มต้นและ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU+heap ของ runner สำหรับชุด
      unit โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### เสถียรภาพ (Gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- คอนฟิก: `vitest.gateway.config.ts`, บังคับให้ใช้ worker หนึ่งตัว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริงโดยเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ Gateway, memory, และ payload ขนาดใหญ่แบบสังเคราะห์ผ่าน path event diagnostic
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังคงมีขอบเขตจำกัด, ตัวอย่าง RSS สังเคราะห์อยู่ใต้ budget ความกดดัน, และความลึกของคิวต่อ session ระบายกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้คีย์
  - เลนแคบสำหรับการติดตาม stability-regression ไม่ใช่สิ่งทดแทนชุด Gateway เต็ม

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- คอนฟิก: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, และการทดสอบ E2E ของ bundled-plugin ใต้ `extensions/`
- ค่าเริ่มต้น runtime:
  - ใช้ `threads` ของ Vitest พร้อม `isolate: false` ให้ตรงกับส่วนที่เหลือของ repo
  - ใช้ worker แบบ adaptive (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมด silent ตามค่าเริ่มต้นเพื่อลด overhead I/O ของ console
- override ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดสูงสุดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด output console แบบละเอียดอีกครั้ง
- ขอบเขต:
  - พฤติกรรม end-to-end ของ Gateway หลาย instance
  - พื้นผิว WebSocket/HTTP, การจับคู่ node, และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้งานใน pipeline)
  - ไม่ต้องใช้คีย์จริง
  - มีส่วนที่เคลื่อนไหวมากกว่าการทดสอบหน่วย (อาจช้ากว่า)

### E2E: smoke backend OpenShell

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell Gateway แบบแยกเดี่ยวบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบ backend ของ OpenShell ใน OpenClaw ผ่าน `sandbox ssh-config` จริง + การ exec ผ่าน SSH
  - ตรวจสอบพฤติกรรมระบบไฟล์แบบ remote-canonical ผ่านบริดจ์ fs ของ sandbox
- ความคาดหวัง:
  - ต้องเลือกเปิดใช้เท่านั้น; ไม่เป็นส่วนหนึ่งของการรัน `pnpm test:e2e` เริ่มต้น
  - ต้องมี CLI `openshell` ในเครื่องพร้อม Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกเดี่ยว แล้วทำลาย test Gateway และ sandbox
- การ override ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างขึ้นด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยังไบนารี CLI หรือสคริปต์ wrapper ที่ไม่ใช่ค่าเริ่มต้น

### Live (ผู้ให้บริการจริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- การกำหนดค่า: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และการทดสอบ live ของ bundled-plugin ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “ผู้ให้บริการ/โมเดลนี้ใช้งานได้จริง _วันนี้_ ด้วย credentials จริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของผู้ให้บริการ, พฤติกรรมพิเศษของ tool-calling, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ตั้งใจให้ไม่เสถียรสำหรับ CI (เครือข่ายจริง, นโยบายผู้ให้บริการจริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรัน subset ที่แคบลงแทนการรัน “ทุกอย่าง”
- การรัน live จะ source `~/.profile` เพื่อดึง API key ที่ขาดหายไป
- โดยค่าเริ่มต้น การรัน live ยังแยก `HOME` และคัดลอก config/auth material ไปยัง temp test home เพื่อให้ unit fixture ไม่สามารถแก้ไข `~/.openclaw` จริงของคุณได้
- ตั้งค่า `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้การทดสอบ live ใช้ไดเรกทอรี home จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบกว่าเป็นค่าเริ่มต้น: ยังคงเก็บเอาต์พุตความคืบหน้า `[live] ...` แต่ปิดประกาศ `~/.profile` เพิ่มเติมและปิดเสียง log/bootstrap ของ Gateway รวมถึง Bonjour chatter ตั้งค่า `OPENCLAW_LIVE_TEST_QUIET=0` หากคุณต้องการ log startup แบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะผู้ให้บริการ): ตั้งค่า `*_API_KEYS` ด้วยรูปแบบ comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือ override ต่อ live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะ retry เมื่อได้รับ rate limit response
- เอาต์พุต progress/heartbeat:
  - ตอนนี้ชุด live จะ emit บรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นว่า provider call ที่ใช้เวลานานยังทำงานอยู่ แม้เมื่อ Vitest console capture เงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของผู้ให้บริการ/Gateway stream ทันทีระหว่างการรัน live
  - ปรับ heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeat ของ Gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรัน suite ใด?

ใช้ตารางตัดสินใจนี้:

- แก้ไข logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอทของฉันล่ม” / ความล้มเหลวเฉพาะผู้ให้บริการ / tool calling: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบ Live (ที่แตะเครือข่าย)

สำหรับ live model matrix, smoke ของ CLI backend, smoke ของ ACP, harness ของ Codex app-server
และการทดสอบ live ของ media-provider ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) รวมถึงการจัดการ credentials สำหรับการรัน live โปรดดู
[การทดสอบ live suites](/th/help/testing-live) สำหรับ checklist เฉพาะด้านการอัปเดตและ
การตรวจสอบ Plugin โปรดดู
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

## Docker runners (การตรวจสอบ "ทำงานใน Linux" แบบไม่บังคับ)

Docker runners เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- Live-model runners: `test:docker:live-models` และ `test:docker:live-gateway` รันเฉพาะไฟล์ live ที่ตรงกับ profile-key ภายในอิมเมจ Docker ของ repo (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount ไดเรกทอรี config และ workspace ในเครื่องของคุณ (และ source `~/.profile` หากถูก mount) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- Docker live runners ตั้งค่าเริ่มต้นเป็น smoke cap ที่เล็กกว่าเพื่อให้การ sweep Docker เต็มยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12` และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` override env var เหล่านี้เมื่อคุณ
  ต้องการสแกนแบบ exhaustive ที่ใหญ่ขึ้นอย่างชัดเจน
- `test:docker:all` สร้างอิมเมจ Docker live หนึ่งครั้งผ่าน `test:docker:live-build`, pack OpenClaw หนึ่งครั้งเป็น npm tarball ผ่าน `scripts/package-openclaw-for-docker.mjs` แล้วสร้าง/ใช้ซ้ำอิมเมจ `scripts/e2e/Dockerfile` สองชุด อิมเมจ bare เป็นเพียง runner Node/Git สำหรับ lane install/update/plugin-dependency; lane เหล่านั้น mount tarball ที่สร้างไว้ล่วงหน้า อิมเมจ functional ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันของแอปที่ build แล้ว คำนิยาม lane ของ Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`; logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ดำเนินการตาม plan ที่เลือก aggregate ใช้ scheduler ในเครื่องแบบถ่วงน้ำหนัก: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slot ขณะที่ resource cap ป้องกันไม่ให้ lane หนักอย่าง live, npm-install และ multi-service เริ่มพร้อมกันทั้งหมด หาก lane เดียวหนักกว่า cap ที่ active อยู่ scheduler ยังสามารถเริ่มได้เมื่อ pool ว่าง แล้วปล่อยให้รันเพียงตัวเดียวจนกว่าจะมี capacity อีกครั้ง ค่าเริ่มต้นคือ 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อโฮสต์ Docker มี headroom มากขึ้น runner จะทำ Docker preflight เป็นค่าเริ่มต้น, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จใน `.artifacts/docker-tests/lane-timings.json` และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่นานกว่าก่อนในการรันภายหลัง ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker หรือ `node scripts/test-docker-all.mjs --plan-json` เพื่อพิมพ์แผน CI สำหรับ lane ที่เลือก, ความต้องการ package/image และ credentials
- `Package Acceptance` คือ package gate แบบ native ของ GitHub สำหรับ "tarball ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่?" มัน resolve candidate package หนึ่งรายการจาก `source=npm`, `source=ref`, `source=url` หรือ `source=artifact`, อัปโหลดเป็น `package-under-test` แล้วรัน lane Docker E2E ที่ใช้ซ้ำได้กับ tarball นั้นโดยตรง แทนการ repack ref ที่เลือก profile เรียงตามความครอบคลุม: `smoke`, `package`, `product` และ `full` โปรดดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) สำหรับ contract ของ package/update/plugin, matrix survivor ของ published-upgrade, ค่าเริ่มต้นของ release และการ triage ความล้มเหลว
- การตรวจสอบ build และ release รัน `scripts/check-cli-bootstrap-imports.mjs` หลัง tsdown guard จะเดิน static built graph จาก `dist/entry.js` และ `dist/cli/run-main.js` และ fail หาก startup ก่อน dispatch import package dependency เช่น Commander, prompt UI, undici หรือ logging ก่อน command dispatch; มันยังคงควบคุม bundled gateway run chunk ให้อยู่ใน budget และปฏิเสธ static import ของ path gateway ที่ cold ที่รู้จัก smoke ของ CLI แบบ packaged ยังครอบคลุม root help, onboard help, doctor help, status, config schema และคำสั่ง model-list
- ความเข้ากันได้แบบ legacy ของ Package Acceptance ถูกจำกัดสูงสุดที่ `2026.4.25` (รวม `2026.4.25-beta.*`) จนถึง cutoff นั้น harness ยอมรับเฉพาะช่องว่าง metadata ของ shipped-package: รายการ private QA inventory ที่ถูกละไว้, `gateway install --wrapper` ที่หายไป, patch file ที่หายไปใน git fixture ที่มาจาก tarball, `update.channel` ที่ persist หายไป, ตำแหน่ง install-record ของ Plugin แบบ legacy, การ persist marketplace install-record ที่หายไป และการ migrate config metadata ระหว่าง `plugins update` สำหรับ package หลัง `2026.4.25` path เหล่านั้นจะเป็นความล้มเหลวแบบ strict
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` และ `test:docker:config-reload` boot คอนเทนเนอร์จริงหนึ่งตัวหรือมากกว่า และตรวจสอบ path การผสานรวมระดับสูง

Live-model Docker runners ยัง bind-mount เฉพาะ CLI auth home ที่จำเป็น (หรือทั้งหมดที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้าไปใน home ของคอนเทนเนอร์ก่อนการรัน เพื่อให้ OAuth ของ external-CLI สามารถ refresh token ได้โดยไม่แก้ไข host auth store:

- โมเดลโดยตรง: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมความครอบคลุม Droid/OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:droid` และ `pnpm test:docker:live-acp-bind:opencode`)
- smoke สำหรับแบ็กเอนด์ CLI: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- smoke สำหรับ Codex app-server harness: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- smoke สำหรับการสังเกตการณ์: `pnpm qa:otel:smoke` เป็นเลน QA ส่วนตัวสำหรับซอร์สเช็กเอาต์ โดยตั้งใจไม่รวมอยู่ในเลนแพ็กเกจ Docker release เพราะ npm tarball ละเว้น QA Lab
- smoke สดของ Open WebUI: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- วิซาร์ดเริ่มต้นใช้งาน (TTY, การสร้างโครงเต็มรูปแบบ): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- smoke สำหรับการเริ่มต้นใช้งาน/channel/agent ของ Npm tarball: `pnpm test:docker:npm-onboard-channel-agent` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่านการเริ่มต้นใช้งานแบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น, รัน doctor และรันหนึ่งรอบของ OpenAI agent แบบจำลอง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการสร้างใหม่บนโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับ channel ด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- smoke สำหรับการสลับ update channel: `pnpm test:docker:update-channel-switch` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วแบบ global ใน Docker, สลับจากแพ็กเกจ `stable` เป็น git `dev`, ตรวจสอบ channel ที่บันทึกคงอยู่และ Plugin ทำงานหลังอัปเดต จากนั้นสลับกลับไปยังแพ็กเกจ `stable` และตรวจสอบสถานะการอัปเดต
- smoke สำหรับ upgrade survivor: `pnpm test:docker:upgrade-survivor` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เก่าแบบ dirty ที่มี agents, การกำหนดค่า channel, plugin allowlists, สถานะ dependency ของ Plugin ที่ล้าสมัย และไฟล์ workspace/session ที่มีอยู่ รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ provider หรือ channel สด จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบการคงสภาพ config/state รวมถึงงบประมาณ startup/status
- smoke สำหรับ published upgrade survivor: `pnpm test:docker:published-upgrade-survivor` ติดตั้ง `openclaw@latest` ตามค่าเริ่มต้น, seed ไฟล์ผู้ใช้ที่มีอยู่แบบสมจริง, กำหนดค่า baseline นั้นด้วยสูตรคำสั่งที่ฝังไว้, ตรวจสอบ config ที่ได้, อัปเดตการติดตั้งที่เผยแพร่นั้นไปยัง tarball ผู้สมัคร, รัน doctor แบบไม่โต้ตอบ, เขียน `.artifacts/upgrade-survivor/summary.json`, จากนั้นเริ่ม Gateway แบบ loopback และตรวจสอบ intents ที่กำหนดค่าไว้, การคงสภาพ state, startup, `/healthz`, `/readyz` และงบประมาณสถานะ RPC แทนที่ baseline หนึ่งรายการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, ขอให้ตัวจัดกำหนดการรวมขยาย baseline ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` เช่น `all-since-2026.4.23` และขยาย fixtures แบบ issue-shaped ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` เช่น `reported-issues`; ชุด reported-issues รวม `configured-plugin-installs` สำหรับการซ่อมแซมการติดตั้ง Plugin ภายนอกของ OpenClaw โดยอัตโนมัติ Package Acceptance เปิดเผยค่าเหล่านั้นเป็น `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` และ `published_upgrade_survivor_scenarios`
- smoke สำหรับ session runtime context: `pnpm test:docker:session-runtime-context` ตรวจสอบการคงอยู่ของ transcript บริบท runtime ที่ซ่อนอยู่ รวมถึงการซ่อมแซม doctor สำหรับสาขา prompt-rewrite ที่ซ้ำกันซึ่งได้รับผลกระทบ
- smoke สำหรับการติดตั้ง Bun แบบ global: `bash scripts/e2e/bun-global-install-smoke.sh` แพ็ก tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกไว้ และตรวจสอบว่า `openclaw infer image providers --json` ส่งคืน provider รูปภาพที่บันเดิลมาแทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าซ้ำด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จากอิมเมจ Docker ที่สร้างแล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- smoke สำหรับ Installer Docker: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache หนึ่งชุดระหว่างคอนเทนเนอร์ root, update และ direct-npm ของมัน smoke การอัปเดตใช้ npm `latest` เป็น stable baseline ตามค่าเริ่มต้นก่อนอัปเกรดไปยัง tarball ผู้สมัคร แทนที่ด้วย `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ในเครื่อง หรือด้วยอินพุต `update_baseline_version` ของเวิร์กโฟลว์ Install Smoke บน GitHub การตรวจสอบ installer แบบ non-root ใช้ npm cache ที่แยกไว้เพื่อให้รายการ cache ที่ root เป็นเจ้าของไม่บดบังพฤติกรรมการติดตั้งแบบ user-local ตั้งค่า `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache root/update/direct-npm ซ้ำระหว่างการรันในเครื่องซ้ำ
- Install Smoke CI ข้ามการอัปเดต direct-npm global ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; รันสคริปต์ในเครื่องโดยไม่มี env นั้นเมื่อจำเป็นต้องครอบคลุม `npm install -g` โดยตรง
- smoke สำหรับ CLI ลบ workspace ที่ใช้ร่วมกันของ Agents: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) สร้างอิมเมจ Dockerfile ระดับ root ตามค่าเริ่มต้น, seed agents สองตัวที่มี workspace หนึ่งรายการใน container home ที่แยกไว้, รัน `agents delete --json` และตรวจสอบ JSON ที่ถูกต้องพร้อมพฤติกรรมการคง workspace ไว้ ใช้อิมเมจ install-smoke ซ้ำด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- เครือข่าย Gateway (สองคอนเทนเนอร์, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- smoke สำหรับ snapshot ของ Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (สคริปต์: `scripts/e2e/browser-cdp-snapshot-docker.sh`) สร้างอิมเมจ source E2E พร้อมเลเยอร์ Chromium, เริ่ม Chromium ด้วย CDP ดิบ, รัน `browser doctor --deep` และตรวจสอบว่า snapshot ของบทบาท CDP ครอบคลุม URL ของลิงก์, clickable ที่เลื่อนระดับจาก cursor, iframe refs และ frame metadata
- regression สำหรับ OpenAI Responses web_search minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) รันเซิร์ฟเวอร์ OpenAI แบบจำลองผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ schema ของ provider ปฏิเสธและตรวจสอบว่ารายละเอียดดิบปรากฏในบันทึก Gateway
- MCP channel bridge (Gateway ที่ seed แล้ว + stdio bridge + smoke สำหรับ raw Claude notification-frame): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- เครื่องมือ MCP ในบันเดิล Pi (เซิร์ฟเวอร์ MCP stdio จริง + smoke สำหรับโปรไฟล์ Pi แบบฝังที่ allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- การล้างข้อมูล Cron/subagent MCP (Gateway จริง + การรื้อถอน child stdio MCP หลังจากรัน cron แบบแยกและ subagent แบบ one-shot): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke สำหรับติดตั้ง/อัปเดตสำหรับ local path, `file:`, npm registry ที่มี dependency แบบ hoisted, git moving refs, ClawHub kitchen-sink, marketplace updates และการเปิดใช้/ตรวจสอบ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
  ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อข้ามบล็อก ClawHub หรือแทนที่คู่แพ็กเกจ/runtime kitchen-sink เริ่มต้นด้วย `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` และ `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` หากไม่มี `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` การทดสอบจะใช้เซิร์ฟเวอร์ fixture ClawHub ในเครื่องแบบปิดครบ
- smoke สำหรับการอัปเดต Plugin ที่ไม่เปลี่ยนแปลง: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- smoke สำหรับเมทริกซ์วงจรชีวิต Plugin: `pnpm test:docker:plugin-lifecycle-matrix` ติดตั้ง OpenClaw tarball ที่แพ็กแล้วในคอนเทนเนอร์เปล่า, ติดตั้ง npm plugin, สลับเปิด/ปิด, อัปเกรดและดาวน์เกรดผ่าน npm registry ในเครื่อง, ลบโค้ดที่ติดตั้งแล้ว จากนั้นตรวจสอบว่า uninstall ยังลบ state ที่ล้าสมัยได้ พร้อมบันทึกเมตริก RSS/CPU สำหรับแต่ละช่วงของวงจรชีวิต
- smoke สำหรับ metadata reload ของ config: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` ครอบคลุม smoke สำหรับติดตั้ง/อัปเดตสำหรับ local path, `file:`, npm registry ที่มี dependency แบบ hoisted, git moving refs, fixtures ของ ClawHub, marketplace updates และการเปิดใช้/ตรวจสอบ Claude-bundle `pnpm test:docker:plugin-update` ครอบคลุมพฤติกรรมการอัปเดตที่ไม่เปลี่ยนแปลงสำหรับ Plugins ที่ติดตั้งแล้ว `pnpm test:docker:plugin-lifecycle-matrix` ครอบคลุมการติดตั้ง npm plugin แบบติดตามทรัพยากร, เปิดใช้, ปิดใช้, อัปเกรด, ดาวน์เกรด และถอนการติดตั้งเมื่อโค้ดหายไป

หากต้องการสร้างอิมเมจ functional ที่ใช้ร่วมกันล่วงหน้าและนำมาใช้ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การแทนที่อิมเมจเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` ยังคงมีผลเหนือกว่าเมื่อกำหนดไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยังอิมเมจ shared ระยะไกล สคริปต์จะ pull อิมเมจนั้นหากยังไม่มีในเครื่อง การทดสอบ Docker สำหรับ QR และ installer เก็บ Dockerfile ของตัวเองไว้ เพราะตรวจสอบพฤติกรรมแพ็กเกจ/การติดตั้ง แทนที่จะเป็น runtime ของแอปที่สร้างร่วมกัน

ตัวรัน Docker สำหรับโมเดลแบบสดยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียว และ
stage ลงใน workdir ชั่วคราวภายในคอนเทนเนอร์ด้วย วิธีนี้ช่วยให้ runtime
image มีขนาดเล็ก แต่ยังคงรัน Vitest กับซอร์ส/คอนฟิกในเครื่องของคุณได้ตรงตัว
ขั้นตอน staging จะข้ามแคชขนาดใหญ่ที่มีเฉพาะในเครื่องและเอาต์พุต build ของแอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรีเอาต์พุต `.build` ในเครื่องแอปหรือ
Gradle เพื่อให้การรัน Docker แบบสดไม่เสียเวลาหลายนาทีในการคัดลอก
อาร์ติแฟกต์เฉพาะเครื่อง
ตัวรันเหล่านี้ยังกำหนด `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ probe สดของ gateway ไม่เริ่ม
worker ของช่องทางจริง เช่น Telegram/Discord/ฯลฯ ภายในคอนเทนเนอร์
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดหรือยกเว้น coverage สดของ gateway
จาก lane Docker นั้น
`test:docker:openwebui` เป็น smoke ความเข้ากันได้ระดับสูงกว่า: จะเริ่ม
คอนเทนเนอร์ OpenClaw gateway โดยเปิด endpoint HTTP ที่เข้ากันได้กับ OpenAI,
เริ่มคอนเทนเนอร์ Open WebUI ที่ pin ไว้ให้เชื่อมกับ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` เปิดเผย `openclaw/default` แล้วส่ง
คำขอแชตจริงผ่านพร็อกซี `/api/chat/completions` ของ Open WebUI
การรันครั้งแรกอาจช้าลงอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull image ของ
Open WebUI และ Open WebUI อาจต้องทำขั้นตอน cold-start ของตัวเองให้เสร็จ
lane นี้คาดหวัง key ของโมเดลสดที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(`~/.profile` โดยค่าเริ่มต้น) เป็นวิธีหลักในการจัดหา key นั้นในการรันแบบ Docker
การรันที่สำเร็จจะพิมพ์ payload JSON ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ตั้งใจให้ deterministic และไม่ต้องใช้บัญชี
Telegram, Discord หรือ iMessage จริง โดยจะบูตคอนเทนเนอร์ Gateway ที่ seed ไว้
เริ่มคอนเทนเนอร์ที่สองซึ่ง spawn `openclaw mcp serve` แล้ว
ตรวจสอบการค้นพบบทสนทนาที่ถูก route, การอ่าน transcript, metadata ของ attachment,
พฤติกรรมคิว event สด, routing การส่งออกขาออก และการแจ้งเตือน channel +
permission แบบ Claude ผ่านสะพาน stdio MCP จริง การตรวจสอบการแจ้งเตือน
จะตรวจ frame stdio MCP ดิบโดยตรง เพื่อให้ smoke ตรวจสอบสิ่งที่
สะพานปล่อยออกมาจริง ไม่ใช่แค่สิ่งที่ client SDK เฉพาะตัวหนึ่งบังเอิญ expose
`test:docker:pi-bundle-mcp-tools` เป็น deterministic และไม่ต้องใช้ key ของโมเดลสด
โดยจะ build image Docker ของ repo, เริ่มเซิร์ฟเวอร์ probe stdio MCP จริง
ภายในคอนเทนเนอร์, materialize เซิร์ฟเวอร์นั้นผ่าน runtime MCP ของ bundle Pi ที่ฝังอยู่,
เรียกใช้ tool แล้วตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
tool `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` กรองออก
`test:docker:cron-mcp-cleanup` เป็น deterministic และไม่ต้องใช้ key ของโมเดลสด
โดยจะเริ่ม Gateway ที่ seed ไว้พร้อมเซิร์ฟเวอร์ probe stdio MCP จริง, รัน
turn cron แบบ isolated และ turn ลูกแบบ one-shot ของ `/subagents spawn` แล้วตรวจสอบว่า
process ลูก MCP ออกหลังจากแต่ละรัน

Smoke เธรด ACP ภาษาธรรมดาแบบแมนนวล (ไม่ใช่ CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับ workflow การ regression/debug อาจต้องใช้ซ้ำอีกสำหรับการตรวจสอบ routing เธรด ACP ดังนั้นอย่าลบ

ตัวแปร env ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) mount ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะตัวแปร env ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ไดเรกทอรี config/workspace ชั่วคราวและไม่มี mount auth ของ CLI ภายนอก
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) mount ไปที่ `/home/node/.npm-global` สำหรับการติดตั้ง CLI ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ auth ของ CLI ภายนอกใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวใต้ `/host-auth...` แล้วคัดลอกไปยัง `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีเริ่มต้น: `.minimax`
  - ไฟล์เริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรัน provider แบบจำกัดจะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นซึ่งอนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override ด้วยตนเองด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วยจุลภาค เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายในคอนเทนเนอร์
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อนำ image `openclaw:local-live` ที่มีอยู่กลับมาใช้สำหรับการรันซ้ำที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า creds มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway expose สำหรับ smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override prompt ตรวจ nonce ที่ใช้โดย smoke Open WebUI
- `OPENWEBUI_IMAGE=...` เพื่อ override tag image Open WebUI ที่ pin ไว้

## ตรวจสอบความสมเหตุสมผลของเอกสาร

รันการตรวจเอกสารหลังแก้ไขเอกสาร: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Regression แบบออฟไลน์ (ปลอดภัยสำหรับ CI)

รายการเหล่านี้คือ regression แบบ “pipeline จริง” โดยไม่มี provider จริง:

- การเรียก tool ของ Gateway (mock OpenAI, gateway จริง + ลูป agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard ของ Gateway (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval ความน่าเชื่อถือของ agent (skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วน ซึ่งทำงานคล้าย “eval ความน่าเชื่อถือของ agent”:

- การเรียก tool แบบ mock ผ่าน gateway จริง + ลูป agent (`src/gateway/gateway.test.ts`)
- flow wizard แบบ end-to-end ที่ตรวจสอบ wiring ของ session และผลกระทบต่อ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อมีการระบุ skills ใน prompt agent เลือก skill ที่ถูกต้องหรือไม่ (หรือหลีกเลี่ยงตัวที่ไม่เกี่ยวข้องหรือไม่)?
- **การปฏิบัติตามข้อกำหนด:** agent อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/args ที่กำหนดหรือไม่?
- **สัญญา workflow:** สถานการณ์หลาย turn ที่ assert ลำดับ tool, การส่งต่อประวัติ session และขอบเขต sandbox

Eval ในอนาคตควรเน้น deterministic ก่อน:

- ตัวรันสถานการณ์ที่ใช้ provider แบบ mock เพื่อ assert การเรียก tool + ลำดับ, การอ่านไฟล์ skill และ wiring ของ session
- ชุดสถานการณ์ขนาดเล็กที่โฟกัส skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- Eval สดแบบเลือกใช้ได้ (opt-in, ควบคุมด้วย env) หลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## การทดสอบสัญญา (รูปทรงของ plugin และ channel)

การทดสอบสัญญาตรวจสอบว่า plugin และ channel ที่ลงทะเบียนทุกตัวสอดคล้องกับ
สัญญา interface ของตัวเอง โดยจะวนผ่าน plugin ทั้งหมดที่ค้นพบและรันชุด
assertion ด้านรูปทรงและพฤติกรรม lane unit เริ่มต้นของ `pnpm test` ตั้งใจ
ข้ามไฟล์ seam ร่วมและ smoke เหล่านี้ ให้รันคำสั่งสัญญาอย่างชัดเจน
เมื่อคุณแตะ surface ร่วมของ channel หรือ provider

### คำสั่ง

- สัญญาทั้งหมด: `pnpm test:contracts`
- เฉพาะสัญญา channel: `pnpm test:contracts:channels`
- เฉพาะสัญญา provider: `pnpm test:contracts:plugins`

### สัญญา channel

อยู่ใน `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปทรง Plugin พื้นฐาน (id, name, capabilities)
- **setup** - สัญญา setup wizard
- **session-binding** - พฤติกรรมการ bind session
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - handler action ของ channel
- **threading** - การจัดการ thread ID
- **directory** - API directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### สัญญาสถานะ provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`

- **status** - probe สถานะ channel
- **registry** - รูปทรง registry ของ Plugin

### สัญญา provider

อยู่ใน `src/plugins/contracts/*.contract.test.ts`:

- **auth** - สัญญา auth flow
- **auth-choice** - การเลือก/ตัวเลือก auth
- **catalog** - API catalog ของโมเดล
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปทรง/interface ของ Plugin
- **wizard** - setup wizard

### ควรรันเมื่อใด

- หลังจากเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังจากเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลังจาก refactor การลงทะเบียนหรือการค้นพบ Plugin

การทดสอบสัญญารันใน CI และไม่ต้องใช้ key API จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ไขปัญหา provider/model ที่พบจากการรันสด:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (provider แบบ mock/stub หรือจับ transformation ของรูปทรงคำขอที่ตรงตัว)
- หากเป็นเรื่องเฉพาะการรันสดโดยเนื้อแท้ (rate limit, นโยบาย auth) ให้คงการทดสอบสดให้แคบและ opt-in ผ่านตัวแปร env
- ควร target layer ที่เล็กที่สุดซึ่งจับ bug ได้:
  - bug การแปลง/replay คำขอของ provider → การทดสอบ models โดยตรง
  - bug pipeline ของ session/history/tool ใน gateway → smoke สดของ gateway หรือการทดสอบ mock gateway ที่ปลอดภัยสำหรับ CI
- guardrail การ traverse SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derive target ตัวอย่างหนึ่งรายการต่อคลาส SecretRef จาก metadata ของ registry (`listSecretTargetRegistryEntries()`) แล้ว assert ว่า exec id แบบ traversal-segment ถูกปฏิเสธ
  - หากคุณเพิ่ม target family ของ SecretRef ใหม่ที่มี `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้อัปเดต `classifyTargetClass` ในการทดสอบนั้น การทดสอบตั้งใจ fail เมื่อมี target id ที่จัดคลาสไม่ได้ เพื่อไม่ให้คลาสใหม่ถูกข้ามอย่างเงียบ ๆ

## ที่เกี่ยวข้อง

- [การทดสอบแบบสด](/th/help/testing-live)
- [การทดสอบอัปเดตและ plugins](/th/help/testing-updates-plugins)
- [CI](/th/ci)
