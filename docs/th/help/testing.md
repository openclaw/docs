---
read_when:
    - การรันทดสอบในเครื่องหรือใน CI
    - การเพิ่ม regression สำหรับบั๊กของโมเดล/provider
    - การดีบักพฤติกรรมของ Gateway + เอเจนต์
summary: 'ชุดเครื่องมือทดสอบ: ชุดทดสอบ unit/e2e/live, ตัวรัน Docker และสิ่งที่แต่ละการทดสอบครอบคลุม'
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-25T13:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw มีชุดทดสอบ Vitest อยู่ 3 ชุด (unit/integration, e2e, live) และมีชุดตัวรัน Docker ขนาดเล็ก
เอกสารนี้คือคู่มือ “วิธีที่เราทดสอบ”:

- แต่ละชุดทดสอบครอบคลุมอะไรบ้าง (และตั้งใจ **ไม่** ครอบคลุมอะไร)
- ควรรันคำสั่งใดสำหรับเวิร์กโฟลว์ทั่วไป (ในเครื่อง, ก่อน push, ดีบัก)
- การทดสอบแบบ live ค้นหา credential และเลือกโมเดล/provider อย่างไร
- วิธีเพิ่ม regression สำหรับปัญหาโมเดล/provider ที่เกิดขึ้นจริง

## เริ่มต้นอย่างรวดเร็ว

ในวันทั่วไป:

- full gate (คาดหวังให้รันก่อน push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- การรัน full suite ในเครื่องที่เร็วขึ้นบนเครื่องที่ทรัพยากรเพียงพอ: `pnpm test:max`
- ลูป watch ของ Vitest โดยตรง: `pnpm test:watch`
- ตอนนี้การระบุไฟล์โดยตรงจะกำหนดเส้นทางพาธ extension/channel ได้ด้วย: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- ควรเริ่มจากการรันแบบเจาะจงก่อนเสมอเมื่อคุณกำลังวนแก้ปัญหาความล้มเหลวเพียงจุดเดียว
- QA site ที่ใช้ Docker: `pnpm qa:lab:up`
- QA lane ที่ใช้ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

เมื่อคุณแตะไฟล์ทดสอบหรือต้องการความมั่นใจเพิ่มขึ้น:

- coverage gate: `pnpm test:coverage`
- ชุดทดสอบ E2E: `pnpm test:e2e`

เมื่อดีบัก provider/โมเดลจริง (ต้องใช้ credential จริง):

- ชุดทดสอบ live (โมเดล + การตรวจสอบ gateway tool/image): `pnpm test:live`
- เลือกไฟล์ live ไฟล์เดียวแบบเงียบ: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- การกวาดโมเดล live ด้วย Docker: `pnpm test:docker:live-models`
  - ตอนนี้แต่ละโมเดลที่เลือกจะรันหนึ่งเทิร์นข้อความพร้อมการตรวจสอบเล็ก ๆ แบบอ่านไฟล์
    โมเดลที่ metadata ระบุว่ารองรับอินพุต `image` จะรันเทิร์นรูปภาพขนาดเล็กด้วย
    ปิดการตรวจสอบเพิ่มเติมเหล่านี้ได้ด้วย `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` หรือ
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` เมื่อต้องการแยกปัญหาของ provider
  - ความครอบคลุมใน CI: งาน `OpenClaw Scheduled Live And E2E Checks` รายวัน และงาน
    `OpenClaw Release Checks` แบบแมนนวล ต่างก็เรียกใช้ reusable workflow สำหรับ live/E2E โดยตั้ง
    `include_live_suites: true` ซึ่งรวมถึงงาน Docker live model matrix แยก shard ตาม provider
  - สำหรับการ rerun ใน CI แบบเจาะจง ให้ dispatch `OpenClaw Live And E2E Checks (Reusable)`
    พร้อม `include_live_suites: true` และ `live_models_only: true`
  - เพิ่ม provider secret ที่มีสัญญาณสูงใหม่ลงใน `scripts/ci-hydrate-live-auth.sh`
    พร้อมทั้ง `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` และตัวเรียกแบบ
    schedule/release ของมัน
- smoke แบบ native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - รัน Docker live lane กับเส้นทาง Codex app-server, bind Slack DM สังเคราะห์ด้วย `/codex bind`, ทดสอบ `/codex fast` และ
    `/codex permissions`, จากนั้นตรวจสอบว่าทั้งการตอบกลับธรรมดาและไฟล์แนบรูปภาพ
    ถูกกำหนดเส้นทางผ่าน native plugin binding แทน ACP
- smoke ของคำสั่งกู้คืน Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - การตรวจสอบแบบเลือกเปิดเพิ่มเติมสำหรับพื้นผิวคำสั่งกู้คืนของ message-channel
    โดยจะทดสอบ `/crestodian status`, เข้าคิวการเปลี่ยนโมเดลแบบ persistent,
    ตอบ `/crestodian yes`, และตรวจสอบเส้นทาง audit/config write
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - รัน Crestodian ใน container ที่ไม่มี config พร้อม Claude CLI ปลอมบน `PATH`
    และตรวจสอบว่า fuzzy planner fallback แปลเป็น typed config write ที่มี audit
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - เริ่มจาก state dir ของ OpenClaw ที่ว่างเปล่า, กำหนดเส้นทาง `openclaw` แบบเปล่าไปยัง
    Crestodian, ใช้ setup/model/agent/Discord Plugin + การเขียน SecretRef,
    ตรวจสอบ config และยืนยันรายการ audit เส้นทาง setup แบบ Ring 0 เดียวกันนี้
    ยังถูกครอบคลุมใน QA Lab โดย
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
- smoke ด้านต้นทุนของ Moonshot/Kimi: เมื่อมีการตั้ง `MOONSHOT_API_KEY` ให้รัน
  `openclaw models list --provider moonshot --json` จากนั้นรัน
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  แบบแยกเดี่ยวกับ `moonshot/kimi-k2.6` ตรวจสอบว่า JSON รายงาน Moonshot/K2.6 และ transcript ของ assistant เก็บ `usage.cost` ที่ถูก normalize

เคล็ดลับ: เมื่อคุณต้องการเพียงกรณีที่ล้มเหลวกรณีเดียว ให้ใช้การจำกัดขอบเขต live tests ผ่าน env var แบบ allowlist ที่อธิบายไว้ด้านล่าง

## ตัวรันเฉพาะ QA

คำสั่งเหล่านี้อยู่ข้างชุดทดสอบหลักเมื่อคุณต้องการความสมจริงแบบ QA-lab:

CI จะรัน QA Lab ใน workflow เฉพาะ `Parity gate` จะรันบน PR ที่ตรงเงื่อนไขและ
จาก manual dispatch โดยใช้ mock provider ส่วน `QA-Lab - All Lanes` จะรันทุกคืนบน
`main` และจาก manual dispatch โดยมี mock parity gate, live Matrix lane และ
live Telegram lane ที่จัดการด้วย Convex เป็นงานขนานกัน `OpenClaw Release Checks`
จะรัน lane เดียวกันก่อนการอนุมัติ release

- `pnpm openclaw qa suite`
  - รัน QA scenario ที่อิงกับ repo โดยตรงบนโฮสต์
  - รันหลาย scenario ที่เลือกพร้อมกันโดยค่าเริ่มต้นด้วย
    gateway worker ที่แยกจากกัน `qa-channel` ใช้ concurrency เริ่มต้นเป็น 4 (จำกัดตาม
    จำนวน scenario ที่เลือก) ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
    หรือ `--concurrency 1` สำหรับ lane แบบอนุกรมรุ่นเก่า
  - ออกด้วยสถานะ non-zero เมื่อมี scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อต้องการ artifact โดยไม่ให้ออกจากโปรแกรมด้วยสถานะล้มเหลว
  - รองรับโหมด provider แบบ `live-frontier`, `mock-openai` และ `aimock`
    โดย `aimock` จะเริ่มเซิร์ฟเวอร์ provider แบบ AIMock ในเครื่องสำหรับความครอบคลุมแบบ experimental ของ fixture และ protocol-mock โดยไม่แทนที่
    lane `mock-openai` ที่รับรู้ scenario อยู่แล้ว
- `pnpm openclaw qa suite --runner multipass`
  - รัน QA suite เดียวกันภายใน Linux VM แบบใช้แล้วทิ้งของ Multipass
  - คงพฤติกรรมการเลือก scenario เหมือนกับ `qa suite` บนโฮสต์
  - ใช้แฟล็กการเลือก provider/model ชุดเดียวกับ `qa suite`
  - การรันแบบ live จะส่งต่ออินพุต auth ของ QA ที่รองรับซึ่งใช้งานได้จริงใน guest:
    provider key แบบ env, พาธ config ของ QA live provider และ `CODEX_HOME`
    เมื่อมีการกำหนด
  - ไดเรกทอรีผลลัพธ์ต้องอยู่ใต้รูทของ repo เพื่อให้ guest เขียนกลับผ่าน
    workspace ที่ถูก mount ได้
  - เขียนรายงาน QA + สรุปตามปกติ พร้อม log ของ Multipass ไว้ใต้
    `.artifacts/qa-e2e/...`
- `pnpm qa:lab:up`
  - เริ่ม QA site ที่ใช้ Docker สำหรับงาน QA แบบ operator
- `pnpm test:docker:npm-onboard-channel-agent`
  - สร้าง npm tarball จาก checkout ปัจจุบัน, ติดตั้งแบบ global ใน
    Docker, รัน onboarding แบบไม่โต้ตอบด้วย OpenAI API key, กำหนดค่า Telegram ตามค่าเริ่มต้น, ตรวจสอบว่าการเปิดใช้ Plugin จะติดตั้ง runtime dependency ตามต้องการ, รัน doctor, และรันหนึ่งเทิร์นของเอเจนต์ในเครื่องกับ mocked OpenAI endpoint
  - ใช้ `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` เพื่อรัน lane แบบ packaged-install เดียวกัน
    กับ Discord
- `pnpm test:docker:npm-telegram-live`
  - ติดตั้งแพ็กเกจ OpenClaw ที่เผยแพร่แล้วใน Docker, รัน installed-package
    onboarding, กำหนดค่า Telegram ผ่าน CLI ที่ติดตั้งแล้ว จากนั้นนำ live Telegram QA lane กลับมาใช้ซ้ำโดยใช้แพ็กเกจที่ติดตั้งนั้นเป็น SUT Gateway
  - ค่าเริ่มต้นคือ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`
  - ใช้ credential Telegram แบบ env หรือแหล่ง credential ของ Convex เดียวกับ
    `pnpm openclaw qa telegram` สำหรับระบบอัตโนมัติ CI/release ให้ตั้ง
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` พร้อม
    `OPENCLAW_QA_CONVEX_SITE_URL` และ role secret หากมี
    `OPENCLAW_QA_CONVEX_SITE_URL` และ Convex role secret อยู่ใน CI
    wrapper ของ Docker จะเลือก Convex โดยอัตโนมัติ
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` จะ override
    `OPENCLAW_QA_CREDENTIAL_ROLE` ที่ใช้ร่วมกันสำหรับ lane นี้เท่านั้น
  - GitHub Actions เปิดให้ใช้ lane นี้เป็น workflow แบบแมนนวลสำหรับ maintainer ชื่อ
    `NPM Telegram Beta E2E` ซึ่งจะไม่รันเมื่อ merge workflow นี้ใช้
    environment `qa-live-shared` และ lease credential CI ของ Convex
- `pnpm test:docker:bundled-channel-deps`
  - pack และติดตั้งบิลด์ OpenClaw ปัจจุบันใน Docker, เริ่ม Gateway
    โดยกำหนดค่า OpenAI ไว้แล้ว จากนั้นเปิดใช้ channel/Plugin ที่ bundle มาผ่านการแก้ config
  - ตรวจสอบว่า setup discovery ยังคงไม่ติดตั้ง runtime dependency ของ Plugin ที่ยังไม่ถูกกำหนดค่า, การรัน Gateway หรือ doctor ครั้งแรกหลังตั้งค่า
    จะติดตั้ง runtime dependency ของแต่ละ bundled Plugin ตามต้องการ, และการ restart ครั้งที่สองจะไม่ติดตั้ง dependency ซ้ำสำหรับสิ่งที่ถูกเปิดใช้แล้ว
  - ยังติดตั้ง npm baseline รุ่นเก่าที่ทราบแน่ชัด, เปิดใช้ Telegram ก่อนรัน
    `openclaw update --tag <candidate>`, และตรวจสอบว่า post-update doctor ของ
    candidate จะซ่อมแซม bundled channel runtime dependency โดยไม่ต้องใช้
    harness-side postinstall repair
- `pnpm test:parallels:npm-update`
  - รัน smoke ของการอัปเดต packaged-install แบบเนทีฟผ่าน guest ของ Parallels แต่ละ
    แพลตฟอร์มที่เลือกจะติดตั้งแพ็กเกจ baseline ที่ร้องขอก่อน แล้วจึงรันคำสั่ง
    `openclaw update` ที่ติดตั้งไว้ภายใน guest เดียวกัน และตรวจสอบเวอร์ชันที่ติดตั้ง, สถานะการอัปเดต, ความพร้อมของ gateway และหนึ่งเทิร์นของเอเจนต์ในเครื่อง
  - ใช้ `--platform macos`, `--platform windows` หรือ `--platform linux` เมื่อต้องการวนทำงานกับ guest เพียงตัวเดียว ใช้ `--json` สำหรับพาธของ artifact สรุปและสถานะต่อ lane
  - ครอบการรันในเครื่องที่ยาวด้วย timeout ของโฮสต์ เพื่อไม่ให้ transport stall ของ Parallels
    ใช้เวลาทดสอบที่เหลือทั้งหมด:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - สคริปต์จะเขียน log ของ lane แบบ nested ไว้ใต้ `/tmp/openclaw-parallels-npm-update.*`
    ตรวจสอบ `windows-update.log`, `macos-update.log` หรือ `linux-update.log`
    ก่อนสรุปว่า wrapper ด้านนอกค้าง
  - การอัปเดตบน Windows อาจใช้เวลา 10 ถึง 15 นาทีในขั้นตอน post-update doctor/runtime
    dependency repair บน guest ที่ยังเย็นอยู่; นี่ยังถือว่าปกติเมื่อ npm debug log ชั้นในยังคงขยับ
  - อย่ารัน aggregate wrapper นี้ขนานกับ smoke lane ของ Parallels แบบเดี่ยวบน
    macOS, Windows หรือ Linux เพราะใช้สถานะ VM ร่วมกันและอาจชนกันในเรื่อง
    snapshot restore, package serving หรือสถานะ gateway ของ guest
  - หลักฐานหลังการอัปเดตจะรันพื้นผิวของ bundled Plugin ตามปกติ เพราะ
    facade ของ capability เช่น speech, การสร้างภาพ และการทำความเข้าใจสื่อ
    ถูกโหลดผ่าน bundled runtime API แม้ว่าเทิร์นของเอเจนต์เองจะตรวจสอบเพียงการตอบข้อความง่าย ๆ ก็ตาม

- `pnpm openclaw qa aimock`
  - เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock ในเครื่อง สำหรับการทดสอบ smoke ของโปรโตคอลโดยตรง
- `pnpm openclaw qa matrix`
  - รัน Matrix live QA lane กับ Tuwunel homeserver แบบใช้ Docker และใช้แล้วทิ้ง
  - ปัจจุบันโฮสต์ QA นี้ใช้สำหรับ repo/dev เท่านั้น การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่มาพร้อม
    `qa-lab` ดังนั้นจึงไม่เปิดเผย `openclaw qa`
  - checkout ของ repo จะโหลด bundled runner โดยตรง; ไม่ต้องมีขั้นตอนติดตั้ง Plugin แยก
  - เตรียม Matrix user ชั่วคราว 3 ราย (`driver`, `sut`, `observer`) พร้อม private room หนึ่งห้อง จากนั้นเริ่ม child ของ QA gateway โดยใช้ Matrix Plugin จริงเป็น transport ของ SUT
  - ใช้ Tuwunel image รุ่น stable ที่ตรึงไว้ `ghcr.io/matrix-construct/tuwunel:v1.5.1` ตามค่าเริ่มต้น ใช้ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` เพื่อ override เมื่อต้องการทดสอบกับ image อื่น
  - Matrix ไม่เปิดเผยแฟล็ก credential-source แบบใช้ร่วมกัน เพราะ lane นี้เตรียม user แบบใช้แล้วทิ้งในเครื่อง
  - เขียนรายงาน Matrix QA, สรุป, artifact ของ observed-events และ output log ที่รวม stdout/stderr ไว้ใต้ `.artifacts/qa-e2e/...`
  - แสดงความคืบหน้าตามค่าเริ่มต้นและบังคับ hard timeout ของการรันด้วย `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (ค่าเริ่มต้น 30 นาที) การ cleanup ถูกจำกัดด้วย `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` และเมื่อเกิดความล้มเหลวจะรวมคำสั่งกู้คืน `docker compose ... down --remove-orphans`
- `pnpm openclaw qa telegram`
  - รัน Telegram live QA lane กับ private group จริง โดยใช้ bot token ของ driver และ SUT จาก env
  - ต้องมี `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` โดย group id ต้องเป็น Telegram chat id แบบตัวเลข
  - รองรับ `--credential-source convex` สำหรับ credential ที่ใช้ร่วมกันแบบ pooled ให้ใช้โหมด env ตามค่าเริ่มต้น หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` เพื่อเลือกใช้ lease จาก pool
  - ออกด้วยสถานะ non-zero เมื่อมี scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อต้องการ
    artifact โดยไม่ให้ออกด้วยสถานะล้มเหลว
  - ต้องใช้บอตที่แตกต่างกันสองตัวใน private group เดียวกัน โดยบอต SUT ต้องเปิดเผย Telegram username
  - เพื่อให้การสังเกตบอตต่อบอตเสถียร ให้เปิด Bot-to-Bot Communication Mode ใน `@BotFather` สำหรับทั้งสองบอต และตรวจสอบว่าบอต driver สามารถสังเกตทราฟฟิกของบอตในกลุ่มได้
  - เขียนรายงาน Telegram QA, สรุป และ artifact ของ observed-messages ไว้ใต้ `.artifacts/qa-e2e/...` scenario ที่มีการตอบกลับจะรวม RTT ตั้งแต่คำขอส่งของ driver ไปจนถึงการตอบกลับของ SUT ที่สังเกตได้

live transport lane ใช้สัญญาร่วมมาตรฐานเดียวกัน เพื่อไม่ให้ transport ใหม่เกิดการเบี่ยงเบน:

`qa-channel` ยังคงเป็นชุด QA แบบสังเคราะห์กว้าง ๆ และไม่เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Credential Telegram แบบใช้ร่วมกันผ่าน Convex (v1)

เมื่อเปิดใช้ `--credential-source convex` (หรือ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) สำหรับ
`openclaw qa telegram`, QA lab จะขอ lease แบบ exclusive จาก pool ที่รองรับด้วย Convex, ส่ง heartbeat
ของ lease ระหว่างที่ lane กำลังรัน และปล่อย lease เมื่อปิดระบบ

โครงร่างโปรเจกต์ Convex อ้างอิง:

- `qa/convex-credential-broker/`

env var ที่จำเป็น:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ตัวอย่างเช่น `https://your-deployment.convex.site`)
- secret หนึ่งตัวสำหรับ role ที่เลือก:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` สำหรับ `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` สำหรับ `ci`
- การเลือก role ของ credential:
  - CLI: `--credential-role maintainer|ci`
  - ค่าเริ่มต้นผ่าน env: `OPENCLAW_QA_CREDENTIAL_ROLE` (ค่าเริ่มต้นคือ `ci` ใน CI, และ `maintainer` ในกรณีอื่น)

env var แบบไม่บังคับ:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (ค่าเริ่มต้น `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (ค่าเริ่มต้น `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (ค่าเริ่มต้น `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (ค่าเริ่มต้น `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (ค่าเริ่มต้น `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id แบบไม่บังคับ)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` อนุญาต URL Convex แบบ loopback `http://` สำหรับการพัฒนาในเครื่องเท่านั้น

`OPENCLAW_QA_CONVEX_SITE_URL` ควรใช้ `https://` ในการใช้งานตามปกติ

คำสั่งแอดมินสำหรับ maintainer (เพิ่ม/ลบ/แสดง pool) ต้องใช้
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` โดยเฉพาะ

ตัวช่วย CLI สำหรับ maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ใช้ `doctor` ก่อนการรัน live เพื่อตรวจสอบ Convex site URL, broker secret,
endpoint prefix, HTTP timeout และการเข้าถึง admin/list โดยไม่พิมพ์ค่า secret
ใช้ `--json` สำหรับผลลัพธ์ที่เครื่องอ่านได้ในสคริปต์และยูทิลิตีของ CI

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
- `POST /admin/add` (ใช้ได้เฉพาะ maintainer secret)
  - คำขอ: `{ kind, actorId, payload, note?, status? }`
  - สำเร็จ: `{ status: "ok", credential }`
- `POST /admin/remove` (ใช้ได้เฉพาะ maintainer secret)
  - คำขอ: `{ credentialId, actorId }`
  - สำเร็จ: `{ status: "ok", changed, credential }`
  - ตัวป้องกัน lease ที่ยังใช้งานอยู่: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (ใช้ได้เฉพาะ maintainer secret)
  - คำขอ: `{ kind?, status?, includePayload?, limit? }`
  - สำเร็จ: `{ status: "ok", credentials, count }`

รูปร่างของ payload สำหรับชนิด Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` ต้องเป็นสตริง Telegram chat id แบบตัวเลข
- `admin/add` จะตรวจสอบรูปร่างนี้สำหรับ `kind: "telegram"` และปฏิเสธ payload ที่ไม่ถูกต้อง

### การเพิ่มช่องทางเข้า QA

การเพิ่มช่องทางเข้าไปในระบบ QA แบบ markdown ต้องมีเพียงสองสิ่งเท่านั้น:

1. transport adapter สำหรับช่องทางนั้น
2. scenario pack ที่ทดสอบสัญญาของช่องทางนั้น

อย่าเพิ่ม root command ของ QA ระดับบนใหม่ เมื่อโฮสต์ `qa-lab` ที่ใช้ร่วมกันสามารถ
เป็นเจ้าของโฟลว์นี้ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- root command `openclaw qa`
- การเริ่มต้นและปิดชุดทดสอบ
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การรัน scenario
- compatibility alias สำหรับ scenario `qa-channel` แบบเก่า

Runner Plugin เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีตั้งค่า gateway สำหรับ transport นั้น
- วิธีตรวจ readiness
- วิธี inject event ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalize แล้ว
- วิธีรัน action ที่อิงกับ transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการรับช่องทางใหม่คือ:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. ติดตั้ง transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ใน runner Plugin หรือ harness ของ Plugin ช่องทางนั้น
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน
   Runner Plugin ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts`
   ทำให้ `runtime-api.ts` มีน้ำหนักเบา; CLI แบบ lazy และการรัน runner ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับ scenario แบบ markdown ใต้ไดเรกทอรีธีม `qa/scenarios/`
6. ใช้ตัวช่วย scenario แบบทั่วไปสำหรับ scenario ใหม่
7. รักษา compatibility alias ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ repo กำลังย้ายอย่างตั้งใจ

กฎการตัดสินใจเป็นแบบเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้นำไปไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นอยู่กับ transport ของช่องทางเดียว ให้เก็บไว้ใน runner Plugin หรือ Plugin harness นั้น
- หาก scenario ต้องการ capability ใหม่ที่มากกว่าหนึ่งช่องทางใช้ได้ ให้เพิ่ม generic helper แทน branch เฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้เก็บ scenario นั้นไว้แบบเฉพาะ transport และระบุสิ่งนั้นอย่างชัดเจนในสัญญาของ scenario

ชื่อ generic helper ที่แนะนำสำหรับ scenario ใหม่คือ:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

compatibility alias ยังคงใช้ได้สำหรับ scenario ที่มีอยู่ รวมถึง:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

งานช่องทางใหม่ควรใช้ชื่อ generic helper
compatibility alias มีไว้เพื่อหลีกเลี่ยงการย้ายระบบแบบ flag day ไม่ใช่เป็นต้นแบบสำหรับ
การเขียน scenario ใหม่

## ชุดทดสอบ (สิ่งที่รันที่ไหน)

ให้คิดว่าชุดทดสอบเหล่านี้คือ “ความสมจริงที่เพิ่มขึ้น” (และความเปราะบาง/ต้นทุนที่เพิ่มขึ้น):

### Unit / integration (ค่าเริ่มต้น)

- คำสั่ง: `pnpm test`
- Config: การรันแบบไม่ระบุเป้าหมายจะใช้ชุด shard `vitest.full-*.config.ts` และอาจขยาย multi-project shard ออกเป็น config ต่อโปรเจกต์เพื่อการจัดตารางแบบขนาน
- ไฟล์: inventory ของ core/unit ภายใต้ `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` และการทดสอบ node ใน `ui` ที่อยู่ใน allowlist ซึ่งครอบคลุมโดย `vitest.unit.config.ts`
- ขอบเขต:
  - การทดสอบ unit แบบล้วน
  - การทดสอบ integration ภายในโปรเซส (gateway auth, routing, tooling, parsing, config)
  - regression แบบกำหนดแน่นอนสำหรับบั๊กที่ทราบแล้ว
- ความคาดหวัง:
  - รันใน CI
  - ไม่ต้องใช้ key จริง
  - ควรเร็วและเสถียร

<AccordionGroup>
  <Accordion title="โปรเจกต์ shard และ lane แบบระบุขอบเขต">

    - การรัน `pnpm test` แบบไม่ระบุเป้าหมายจะใช้ shard config ขนาดเล็ก 12 ตัว (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) แทนการใช้ root-project process แบบ native ขนาดใหญ่เพียงตัวเดียว วิธีนี้ช่วยลด RSS สูงสุดบนเครื่องที่มีโหลดสูง และหลีกเลี่ยงไม่ให้งาน auto-reply/extension ไปแย่งทรัพยากรจากชุดทดสอบอื่นที่ไม่เกี่ยวข้อง
    - `pnpm test --watch` ยังคงใช้กราฟโปรเจกต์จาก root `vitest.config.ts` แบบ native เพราะลูป watch แบบหลาย shard ใช้งานจริงได้ยาก
    - `pnpm test`, `pnpm test:watch` และ `pnpm test:perf:imports` จะกำหนดเส้นทางเป้าหมายที่เป็นไฟล์/ไดเรกทอรีแบบระบุชัดเจนผ่าน lane ที่มีขอบเขตก่อน ดังนั้น `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` จะไม่ต้องจ่ายต้นทุนการเริ่มต้นเต็มของ root project
    - `pnpm test:changed` จะขยายพาธ git ที่เปลี่ยนแปลงไปเป็น lane ที่มีขอบเขตเดียวกัน เมื่อ diff แตะเฉพาะไฟล์ source/test ที่กำหนดเส้นทางได้ ส่วนการแก้ไข config/setup จะยัง fallback ไปใช้การ rerun แบบกว้างของ root-project
    - `pnpm check:changed` คือ smart local gate ปกติสำหรับงานแคบ ๆ โดยจะจัดประเภท diff เป็น core, core tests, extensions, extension tests, apps, docs, release metadata และ tooling จากนั้นจึงรัน lane ของ typecheck/lint/test ที่ตรงกัน การเปลี่ยนแปลงต่อ public Plugin SDK และ plugin-contract จะรวมรอบการตรวจสอบ extension หนึ่งครั้ง เพราะ extension พึ่งพา contract หลักเหล่านั้น การ bump เวอร์ชันที่แตะเฉพาะ release metadata จะรันการตรวจสอบ version/config/root-dependency แบบเจาะจงแทน full suite พร้อม guard ที่ปฏิเสธการเปลี่ยนแปลง package นอกเหนือจากฟิลด์ version ระดับบนสุด
    - unit test ที่ import น้อยจาก agents, commands, plugins, ตัวช่วย auto-reply, `plugin-sdk` และพื้นที่ utility ล้วนที่คล้ายกัน จะถูกกำหนดเส้นทางผ่าน lane `unit-fast` ซึ่งข้าม `test/setup-openclaw-runtime.ts`; ไฟล์ที่มี state/runtime หนักจะยังคงอยู่ใน lane เดิม
    - source file ของตัวช่วยใน `plugin-sdk` และ `commands` ที่เลือกไว้ บางไฟล์ยังแมปการรันโหมด changed ไปยังการทดสอบพี่น้องแบบชัดเจนใน lane แบบเบาเหล่านั้นด้วย ทำให้การแก้ helper ไม่ต้อง rerun heavy suite ทั้งไดเรกทอรี
    - `auto-reply` มี bucket เฉพาะสามแบบ: top-level core helper, integration test ของ `reply.*` ระดับบน และ subtree `src/auto-reply/reply/**` วิธีนี้ช่วยย้ายงาน reply harness ที่หนักที่สุดออกจากการทดสอบ status/chunk/token แบบเบา

  </Accordion>

  <Accordion title="ความครอบคลุมของ embedded runner">

    - เมื่อคุณเปลี่ยนอินพุตการค้นพบ message-tool หรือ runtime
      context ของ Compaction ให้รักษาความครอบคลุมทั้งสองระดับไว้
    - เพิ่ม regression ของ helper แบบเจาะจงสำหรับขอบเขต
      การกำหนดเส้นทางและการ normalize แบบล้วน
    - รักษา suite integration ของ embedded runner ให้ใช้งานได้ดี:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` และ
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`
    - suite เหล่านี้ตรวจสอบว่า id แบบกำหนดขอบเขตและพฤติกรรมของ Compaction
      ยังคงไหลผ่านเส้นทาง `run.ts` / `compact.ts` จริง; การทดสอบเฉพาะ helper
      ไม่เพียงพอที่จะใช้แทนเส้นทาง integration เหล่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ Vitest pool และ isolation">

    - config พื้นฐานของ Vitest ใช้ค่าเริ่มต้นเป็น `threads`
    - config Vitest ที่ใช้ร่วมกันจะตรึง `isolate: false` และใช้
      non-isolated runner ใน root projects, config ของ e2e และ live
    - lane UI หลักยังคงใช้ `jsdom` setup และ optimizer เดิม แต่รันบน
      non-isolated runner แบบใช้ร่วมกันเช่นกัน
    - shard ของ `pnpm test` แต่ละตัวจะสืบทอดค่าเริ่มต้น `threads` + `isolate: false` เดียวกันจาก shared Vitest config
    - `scripts/run-vitest.mjs` จะเพิ่ม `--no-maglev` ให้กับ child Node
      process ของ Vitest ตามค่าเริ่มต้น เพื่อลด V8 compile churn ระหว่างการรันในเครื่องขนาดใหญ่
      ตั้ง `OPENCLAW_VITEST_ENABLE_MAGLEV=1` เพื่อเปรียบเทียบกับพฤติกรรม
      V8 แบบมาตรฐาน

  </Accordion>

  <Accordion title="การวนงานในเครื่องอย่างรวดเร็ว">

    - `pnpm changed:lanes` จะแสดงว่า diff หนึ่ง ๆ ทริกเกอร์ architectural lane ใดบ้าง
    - pre-commit hook ทำเฉพาะการจัดรูปแบบเท่านั้น โดยจะ restage ไฟล์ที่ถูก format
      และจะไม่รัน lint, typecheck หรือ test
    - รัน `pnpm check:changed` อย่างชัดเจนก่อนส่งต่องานหรือ push เมื่อคุณ
      ต้องการ smart local gate การเปลี่ยนแปลง public Plugin SDK และ plugin-contract
      จะรวมรอบการตรวจสอบ extension หนึ่งครั้ง
    - `pnpm test:changed` จะกำหนดเส้นทางผ่าน lane ที่มีขอบเขตเมื่อพาธที่เปลี่ยนแปลง
      แมปไปยัง suite ที่เล็กกว่าได้อย่างชัดเจน
    - `pnpm test:max` และ `pnpm test:changed:max` คงพฤติกรรมการกำหนดเส้นทางเดียวกัน
      เพียงแต่ใช้ขีดจำกัด worker ที่สูงขึ้น
    - การปรับขนาด worker อัตโนมัติในเครื่องถูกออกแบบให้ระมัดระวังโดยตั้งใจ และจะลดระดับ
      เมื่อค่าเฉลี่ยโหลดของโฮสต์สูงอยู่แล้ว ดังนั้นการรัน Vitest หลายชุดพร้อมกันจึงสร้างผลกระทบน้อยลงตามค่าเริ่มต้น
    - config พื้นฐานของ Vitest ทำเครื่องหมายไฟล์ project/config เป็น
      `forceRerunTriggers` เพื่อให้การ rerun แบบ changed-mode ยังคงถูกต้องเมื่อการต่อสายของ test เปลี่ยนไป
    - config นี้จะเปิด `OPENCLAW_VITEST_FS_MODULE_CACHE` ไว้บนโฮสต์ที่รองรับ;
      ตั้ง `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` หากคุณต้องการ
      ตำแหน่งแคชแบบชัดเจนตำแหน่งเดียวสำหรับการทำ profiling โดยตรง

  </Accordion>

  <Accordion title="การดีบักด้านประสิทธิภาพ">

    - `pnpm test:perf:imports` จะเปิดรายงานระยะเวลา import ของ Vitest พร้อม
      output การแจกแจง import
    - `pnpm test:perf:imports:changed` จะจำกัดมุมมอง profiling เดียวกันไปยัง
      ไฟล์ที่เปลี่ยนตั้งแต่ `origin/main`
    - เมื่อ hot test ตัวหนึ่งยังใช้เวลาส่วนใหญ่ไปกับ startup import
      ให้เก็บ dependency ที่หนักไว้หลัง seam เฉพาะแบบแคบใน `*.runtime.ts`
      และ mock seam นั้นโดยตรง แทนการ deep-import helper ของ runtime
      เพียงเพื่อส่งผ่านไปยัง `vi.mock(...)`
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` จะเปรียบเทียบ
      `test:changed` ที่กำหนดเส้นทางแล้วกับเส้นทาง root-project แบบ native สำหรับ diff ที่ commit แล้วนั้น และพิมพ์ทั้ง wall time และ macOS max RSS
    - `pnpm test:perf:changed:bench -- --worktree` จะทำ benchmark กับ
      worktree ที่ยังสกปรกอยู่ปัจจุบัน โดยกำหนดเส้นทางรายการไฟล์ที่เปลี่ยนผ่าน
      `scripts/test-projects.mjs` และ root Vitest config
    - `pnpm test:perf:profile:main` จะเขียน CPU profile ของ main-thread สำหรับ
      overhead จากการเริ่มต้นและ transform ของ Vitest/Vite
    - `pnpm test:perf:profile:runner` จะเขียนทั้ง CPU+heap profile ของ runner สำหรับ
      unit suite โดยปิด file parallelism

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- คำสั่ง: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, บังคับใช้ worker เดียว
- ขอบเขต:
  - เริ่ม Gateway แบบ loopback จริง โดยเปิด diagnostics ตามค่าเริ่มต้น
  - ขับ churn ของข้อความ, หน่วยความจำ และ payload ขนาดใหญ่แบบสังเคราะห์ผ่านเส้นทาง event ของ diagnostics
  - query `diagnostics.stability` ผ่าน Gateway WS RPC
  - ครอบคลุมตัวช่วย persistence ของ diagnostic stability bundle
  - ยืนยันว่า recorder ยังอยู่ในขอบเขต, ตัวอย่าง RSS แบบสังเคราะห์ยังต่ำกว่างบประมาณแรงกดดัน และความลึกของคิวต่อเซสชันลดกลับเป็นศูนย์
- ความคาดหวัง:
  - ปลอดภัยสำหรับ CI และไม่ต้องใช้ key
  - เป็น lane แบบแคบสำหรับติดตาม regression ด้าน stability ไม่ใช่ตัวแทนของ full Gateway suite

### E2E (gateway smoke)

- คำสั่ง: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ไฟล์: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` และ bundled-plugin E2E tests ภายใต้ `extensions/`
- ค่าเริ่มต้นของ runtime:
  - ใช้ Vitest `threads` กับ `isolate: false` เหมือนกับส่วนอื่นของ repo
  - ใช้ adaptive workers (CI: สูงสุด 2, local: ค่าเริ่มต้น 1)
  - รันในโหมด silent ตามค่าเริ่มต้นเพื่อลด overhead จาก console I/O
- การแทนที่ที่มีประโยชน์:
  - `OPENCLAW_E2E_WORKERS=<n>` เพื่อบังคับจำนวน worker (จำกัดที่ 16)
  - `OPENCLAW_E2E_VERBOSE=1` เพื่อเปิด verbose console output อีกครั้ง
- ขอบเขต:
  - พฤติกรรมแบบ end-to-end ของ gateway หลายอินสแตนซ์
  - พื้นผิว WebSocket/HTTP, node pairing และ networking ที่หนักกว่า
- ความคาดหวัง:
  - รันใน CI (เมื่อเปิดใช้งานใน pipeline)
  - ไม่ต้องใช้ key จริง
  - มีส่วนเคลื่อนไหวมากกว่า unit test (อาจช้ากว่า)

### E2E: OpenShell backend smoke

- คำสั่ง: `pnpm test:e2e:openshell`
- ไฟล์: `extensions/openshell/src/backend.e2e.test.ts`
- ขอบเขต:
  - เริ่ม OpenShell gateway แบบแยกตัวบนโฮสต์ผ่าน Docker
  - สร้าง sandbox จาก Dockerfile ชั่วคราวในเครื่อง
  - ทดสอบ OpenShell backend ของ OpenClaw ผ่าน `sandbox ssh-config` + SSH exec จริง
  - ตรวจสอบพฤติกรรม filesystem แบบ remote-canonical ผ่าน sandbox fs bridge
- ความคาดหวัง:
  - เป็นแบบเลือกเปิดเท่านั้น; ไม่รวมอยู่ในการรัน `pnpm test:e2e` ตามค่าเริ่มต้น
  - ต้องมี `openshell` CLI ในเครื่องและ Docker daemon ที่ใช้งานได้
  - ใช้ `HOME` / `XDG_CONFIG_HOME` แบบแยกตัว จากนั้นทำลาย test gateway และ sandbox
- การแทนที่ที่มีประโยชน์:
  - `OPENCLAW_E2E_OPENSHELL=1` เพื่อเปิดใช้การทดสอบเมื่อรันชุด e2e ที่กว้างกว่าด้วยตนเอง
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` เพื่อชี้ไปยัง CLI binary หรือ wrapper script ที่ไม่ใช่ค่าเริ่มต้น

### Live (provider จริง + โมเดลจริง)

- คำสั่ง: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ไฟล์: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` และ bundled-plugin live tests ภายใต้ `extensions/`
- ค่าเริ่มต้น: **เปิดใช้งาน** โดย `pnpm test:live` (ตั้งค่า `OPENCLAW_LIVE_TEST=1`)
- ขอบเขต:
  - “provider/โมเดลนี้ยังใช้งานได้จริง _วันนี้_ ด้วย credential จริงหรือไม่?”
  - จับการเปลี่ยนแปลงรูปแบบของ provider, ความแปลกของการเรียก tool, ปัญหา auth และพฤติกรรม rate limit
- ความคาดหวัง:
  - ไม่เสถียรสำหรับ CI โดยธรรมชาติ (เครือข่ายจริง, นโยบาย provider จริง, quota, outage)
  - มีค่าใช้จ่าย / ใช้ rate limit
  - ควรรันเป็นชุดย่อยแบบแคบแทนการรัน “ทั้งหมด”
- การรันแบบ live จะ source `~/.profile` เพื่อดึง API key ที่ขาดหายไป
- ตามค่าเริ่มต้น การรันแบบ live ยังคงแยก `HOME` ออกและคัดลอกวัสดุ config/auth เข้า home ชั่วคราวสำหรับทดสอบ เพื่อให้ fixture ของ unit ไม่ไปแก้ `~/.openclaw` จริงของคุณ
- ตั้ง `OPENCLAW_LIVE_USE_REAL_HOME=1` เฉพาะเมื่อคุณตั้งใจให้ live tests ใช้ home directory จริงของคุณ
- ตอนนี้ `pnpm test:live` ใช้โหมดที่เงียบขึ้นตามค่าเริ่มต้น: ยังแสดงความคืบหน้า `[live] ...` แต่ซ่อนข้อความเพิ่มเติมเรื่อง `~/.profile` และปิดเสียง log ตอน bootstrap ของ gateway/Bonjour chatter ตั้ง `OPENCLAW_LIVE_TEST_QUIET=0` หากต้องการ log ตอนเริ่มต้นแบบเต็มกลับมา
- การหมุนเวียน API key (เฉพาะแต่ละ provider): ตั้ง `*_API_KEYS` ในรูปแบบคั่นด้วย comma/semicolon หรือ `*_API_KEY_1`, `*_API_KEY_2` (เช่น `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) หรือใช้การ override ราย live ผ่าน `OPENCLAW_LIVE_*_KEY`; การทดสอบจะลองใหม่เมื่อเจอ response แบบ rate limit
- output ความคืบหน้า/heartbeat:
  - ตอนนี้ live suite จะปล่อยบรรทัดความคืบหน้าไปยัง stderr เพื่อให้เห็นชัดว่าการเรียก provider ที่ใช้เวลานานยังทำงานอยู่ แม้ว่า Vitest จะจับ console แบบเงียบ
  - `vitest.live.config.ts` ปิดการดักจับ console ของ Vitest เพื่อให้บรรทัดความคืบหน้าของ provider/gateway ไหลออกมาทันทีระหว่างการรันแบบ live
  - ปรับ heartbeat ของ direct-model ด้วย `OPENCLAW_LIVE_HEARTBEAT_MS`
  - ปรับ heartbeat ของ gateway/probe ด้วย `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## ควรรัน suite ไหน?

ใช้ตารางตัดสินใจนี้:

- แก้ logic/tests: รัน `pnpm test` (และ `pnpm test:coverage` หากคุณเปลี่ยนเยอะ)
- แตะ gateway networking / WS protocol / pairing: เพิ่ม `pnpm test:e2e`
- ดีบัก “บอตของฉันล่ม” / ความล้มเหลวเฉพาะ provider / การเรียก tool: รัน `pnpm test:live` แบบจำกัดขอบเขต

## การทดสอบแบบ live (แตะเครือข่าย)

สำหรับ live model matrix, smoke ของ CLI backend, ACP smoke, Codex app-server
harness และ media-provider live tests ทั้งหมด (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — รวมถึงการจัดการ credential สำหรับการรันแบบ live — ดู
[Testing — live suites](/th/help/testing-live)

## ตัวรัน Docker (ทางเลือกสำหรับการตรวจสอบแบบ “ทำงานบน Linux”)

ตัวรัน Docker เหล่านี้แบ่งออกเป็นสองกลุ่ม:

- ตัวรัน live-model: `test:docker:live-models` และ `test:docker:live-gateway` จะรันเฉพาะไฟล์ live ที่ตรงกับ profile-key ภายใน repo Docker image (`src/agents/models.profiles.live.test.ts` และ `src/gateway/gateway-models.profiles.live.test.ts`) โดย mount ไดเรกทอรี config และ workspace ในเครื่องของคุณ (และ source `~/.profile` หากถูก mount) entrypoint ในเครื่องที่ตรงกันคือ `test:live:models-profiles` และ `test:live:gateway-profiles`
- ตัวรัน Docker live ใช้ smoke cap ที่เล็กลงตามค่าเริ่มต้น เพื่อให้การกวาด Docker แบบเต็มยังใช้งานได้จริง:
  `test:docker:live-models` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_MAX_MODELS=12`, และ
  `test:docker:live-gateway` มีค่าเริ่มต้นเป็น `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` และ
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ให้ override env var เหล่านั้นเมื่อคุณ
  ต้องการการสแกนแบบ exhaustive ที่ใหญ่กว่านี้อย่างชัดเจน
- `test:docker:all` จะสร้าง live Docker image หนึ่งครั้งผ่าน `test:docker:live-build` จากนั้นนำกลับมาใช้ซ้ำสำหรับ Docker live lane และยังสร้าง image ที่ใช้ร่วมกันเพียงหนึ่งเดียวจาก `scripts/e2e/Dockerfile` ผ่าน `test:docker:e2e-build` แล้วนำกลับมาใช้ซ้ำสำหรับ E2E container smoke runner ที่ทดสอบแอปที่ build แล้ว ตัว aggregate ใช้ weighted local scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` ควบคุม process slot ส่วน resource cap จะกันไม่ให้ live lane ที่หนัก, npm-install lane และ multi-service lane ทั้งหมดเริ่มพร้อมกัน ค่าเริ่มต้นคือ 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ปรับ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` หรือ `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` เฉพาะเมื่อ Docker host มี headroom มากขึ้น ตัวรันจะทำ Docker preflight ตามค่าเริ่มต้น, ลบ OpenClaw E2E container เก่าที่ค้างอยู่, พิมพ์สถานะทุก 30 วินาที, เก็บ timing ของ lane ที่สำเร็จไว้ใน `.artifacts/docker-tests/lane-timings.json` และใช้ timing เหล่านั้นเพื่อเริ่ม lane ที่นานกว่าก่อนในการรันครั้งถัดไป ใช้ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` เพื่อพิมพ์ weighted lane manifest โดยไม่ build หรือรัน Docker
- container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` และ `test:docker:config-reload` จะบูต container จริงหนึ่งตัวหรือหลายตัว และตรวจสอบเส้นทาง integration ระดับสูงกว่า

ตัวรัน Docker ของ live-model ยัง bind-mount เฉพาะ home สำหรับ CLI auth ที่จำเป็น (หรือทุกตัวที่รองรับเมื่อการรันไม่ได้ถูกจำกัดขอบเขต) จากนั้นคัดลอกเข้า home ของ container ก่อนเริ่มรัน เพื่อให้ OAuth ของ external-CLI สามารถรีเฟรช token ได้โดยไม่แก้ที่เก็บ auth บนโฮสต์:

- Direct models: `pnpm test:docker:live-models` (สคริปต์: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (สคริปต์: `scripts/test-live-acp-bind-docker.sh`; ครอบคลุม Claude, Codex และ Gemini ตามค่าเริ่มต้น พร้อมความครอบคลุม OpenCode แบบเข้มงวดผ่าน `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (สคริปต์: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (สคริปต์: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (สคริปต์: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (สคริปต์: `scripts/e2e/openwebui-docker.sh`)
- wizard Onboarding (TTY, scaffolding แบบเต็ม): `pnpm test:docker:onboard` (สคริปต์: `scripts/e2e/onboard-docker.sh`)
- smoke ของ onboarding/channel/agent ผ่าน npm tarball: `pnpm test:docker:npm-onboard-channel-agent` จะติดตั้ง OpenClaw tarball ที่ pack แล้วแบบ global ใน Docker, กำหนดค่า OpenAI ผ่าน onboarding แบบ env-ref พร้อม Telegram ตามค่าเริ่มต้น, ตรวจสอบว่า doctor ซ่อม runtime deps ของ Plugin ที่ถูกเปิดใช้, และรันหนึ่งเทิร์นของเอเจนต์กับ mocked OpenAI ใช้ tarball ที่สร้างไว้ล่วงหน้าได้ด้วย `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้ามการ rebuild ฝั่งโฮสต์ด้วย `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` หรือสลับช่องทางด้วย `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` จะ pack tree ปัจจุบัน, ติดตั้งด้วย `bun install -g` ใน home ที่แยกออกมา และตรวจสอบว่า `openclaw infer image providers --json` คืน bundled image provider แทนที่จะค้าง ใช้ tarball ที่สร้างไว้ล่วงหน้าได้ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ข้าม host build ด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` หรือคัดลอก `dist/` จาก Docker image ที่ build แล้วด้วย `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` แชร์ npm cache ชุดเดียวกันให้กับ container ของ root, update และ direct-npm โดย update smoke ใช้ npm `latest` เป็น stable baseline ก่อนอัปเกรดไปยัง candidate tarball การตรวจสอบ installer แบบ non-root จะใช้ npm cache แบบแยกตัว เพื่อไม่ให้ cache ที่ root เป็นเจ้าของบดบังพฤติกรรมการติดตั้งแบบ user-local ตั้ง `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` เพื่อใช้ cache ของ root/update/direct-npm ซ้ำในการ rerun ในเครื่อง
- Install Smoke CI จะข้าม direct-npm global update ที่ซ้ำด้วย `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; ให้รันสคริปต์ในเครื่องโดยไม่ตั้ง env นี้เมื่อจำเป็นต้องมีความครอบคลุมของ `npm install -g` โดยตรง
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (สคริปต์: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) จะ build root Dockerfile image ตามค่าเริ่มต้น, seed เอเจนต์สองตัวด้วย workspace เดียวใน home ของ container ที่แยกออกมา, รัน `agents delete --json` และตรวจสอบทั้ง JSON ที่ถูกต้องและพฤติกรรมการคง workspace ใช้ image ของ install-smoke ซ้ำได้ด้วย `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`
- Gateway networking (สอง container, WS auth + health): `pnpm test:docker:gateway-network` (สคริปต์: `scripts/e2e/gateway-network-docker.sh`)
- regression สำหรับ OpenAI Responses web_search แบบ minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (สคริปต์: `scripts/e2e/openai-web-search-minimal-docker.sh`) จะรัน mocked OpenAI server ผ่าน Gateway, ตรวจสอบว่า `web_search` ยกระดับ `reasoning.effort` จาก `minimal` เป็น `low`, จากนั้นบังคับให้ provider schema reject และตรวจสอบว่ารายละเอียดดิบปรากฏใน Gateway log
- MCP channel bridge (Gateway ที่ seed แล้ว + stdio bridge + smoke ของ raw Claude notification-frame): `pnpm test:docker:mcp-channels` (สคริปต์: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (stdio MCP server จริง + smoke ของ embedded Pi profile allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (สคริปต์: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (Gateway จริง + การ teardown stdio MCP child หลัง isolated cron และ one-shot subagent run): `pnpm test:docker:cron-mcp-cleanup` (สคริปต์: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + alias `/plugin` + semantics ของการ restart แบบ Claude-bundle): `pnpm test:docker:plugins` (สคริปต์: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (สคริปต์: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (สคริปต์: `scripts/e2e/config-reload-source-docker.sh`)
- bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` จะ build Docker runner image ขนาดเล็กตามค่าเริ่มต้น, build และ pack OpenClaw หนึ่งครั้งบนโฮสต์ จากนั้น mount tarball นั้นเข้าไปในแต่ละ Linux install scenario ใช้ image เดิมซ้ำได้ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`, ข้ามการ rebuild บนโฮสต์หลังการ build ใหม่ในเครื่องด้วย `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, หรือชี้ไปยัง tarball ที่มีอยู่แล้วด้วย `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ตัว aggregate ของ Docker แบบเต็มจะ pre-pack tarball นี้เพียงครั้งเดียว จากนั้น shard การตรวจสอบ bundled channel ออกเป็น lane อิสระ รวมถึง update lane แยกสำหรับ Telegram, Discord, Slack, Feishu, memory-lancedb และ ACPX ใช้ `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` เพื่อจำกัดเมทริกซ์ช่องทางเมื่อรัน bundled lane โดยตรง หรือ `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` เพื่อจำกัด update scenario lane นี้ยังตรวจสอบด้วยว่า `channels.<id>.enabled=false` และ `plugins.entries.<id>.enabled=false` จะระงับการซ่อม doctor/runtime-dependency
- จำกัด bundled plugin runtime deps ขณะวนทำงานด้วยการปิด scenario ที่ไม่เกี่ยวข้อง ตัวอย่างเช่น:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

หากต้องการ prebuild และใช้ shared built-app image ซ้ำด้วยตนเอง:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

การ override image แบบเฉพาะ suite เช่น `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` จะยังมีผลเหนือกว่าเมื่อมีการตั้งค่าไว้ เมื่อ `OPENCLAW_SKIP_DOCKER_BUILD=1` ชี้ไปยัง shared image แบบ remote สคริปต์จะ pull image นั้นหากยังไม่มีในเครื่อง การทดสอบ QR และ installer แบบ Docker ยังคงใช้ Dockerfile ของตัวเอง เพราะทดสอบพฤติกรรม package/install ไม่ใช่ shared built-app runtime

ตัวรัน Docker ของ live-model ยัง bind-mount checkout ปัจจุบันแบบอ่านอย่างเดียว และ
stage เข้าไปยัง workdir ชั่วคราวภายใน container ด้วย วิธีนี้ช่วยให้ runtime
image มีขนาดเล็ก ขณะเดียวกันก็ยังรัน Vitest กับ source/config ในเครื่องของคุณได้ตรงตามจริง
ขั้นตอน staging จะข้ามแคชขนาดใหญ่ที่มีไว้ใช้ในเครื่องเท่านั้น และ output ของการ build แอป เช่น
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` และไดเรกทอรี `.build` หรือ
Gradle output ภายในแอป เพื่อไม่ให้การรัน Docker live ใช้เวลาหลายนาทีในการคัดลอก
artifact ที่ผูกกับเครื่องเฉพาะ
นอกจากนี้ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อให้ gateway live probe ไม่เริ่ม
worker ของช่องทางจริงอย่าง Telegram/Discord ฯลฯ ภายใน container
`test:docker:live-models` ยังคงรัน `pnpm test:live` ดังนั้นให้ส่งผ่าน
`OPENCLAW_LIVE_GATEWAY_*` ด้วยเมื่อคุณต้องการจำกัดขอบเขตหรือยกเว้นความครอบคลุมของ gateway
live จาก Docker lane นั้น
`test:docker:openwebui` เป็น smoke ด้านความเข้ากันได้ในระดับที่สูงกว่า: มันจะเริ่ม
OpenClaw gateway container โดยเปิดใช้ OpenAI-compatible HTTP endpoint,
เริ่ม Open WebUI container รุ่นที่ตรึงไว้ให้ชี้มาที่ gateway นั้น, ลงชื่อเข้าใช้ผ่าน
Open WebUI, ตรวจสอบว่า `/api/models` แสดง `openclaw/default`, จากนั้นส่ง
คำขอแชตจริงผ่าน proxy ของ `/api/chat/completions` ใน Open WebUI
การรันครั้งแรกอาจช้ากว่าปกติอย่างเห็นได้ชัด เพราะ Docker อาจต้อง pull
Open WebUI image และ Open WebUI เองอาจต้องทำ cold-start setup ของตัวเองให้เสร็จ
lane นี้คาดหวังให้มี live model key ที่ใช้งานได้ และ `OPENCLAW_PROFILE_FILE`
(ค่าเริ่มต้นคือ `~/.profile`) คือวิธีหลักในการจัดหา key นั้นในการรันแบบ Docker
เมื่อรันสำเร็จจะพิมพ์ JSON payload ขนาดเล็ก เช่น `{ "ok": true, "model":
"openclaw/default", ... }`
`test:docker:mcp-channels` ถูกออกแบบให้เป็นแบบกำหนดแน่นอนโดยตั้งใจ และไม่ต้องใช้
บัญชี Telegram, Discord หรือ iMessage จริง มันจะบูต
Gateway container ที่ seed แล้ว, เริ่ม container ตัวที่สองซึ่งสตาร์ต `openclaw mcp serve`, จากนั้น
ตรวจสอบ routed conversation discovery, การอ่าน transcript, metadata ของไฟล์แนบ,
พฤติกรรมของ live event queue, การกำหนดเส้นทางการส่งขาออก และการแจ้งเตือนแบบช่องทาง +
สิทธิ์สไตล์ Claude ผ่าน stdio MCP bridge จริง การตรวจสอบ notification
จะตรวจสอบ raw stdio MCP frame โดยตรง ดังนั้น smoke นี้จึงตรวจสอบสิ่งที่ bridge
ปล่อยออกมาจริง ไม่ใช่เพียงสิ่งที่ client SDK ใด SDK หนึ่งบังเอิญเปิดเผย
`test:docker:pi-bundle-mcp-tools` เป็นแบบกำหนดแน่นอนและไม่ต้องใช้
live model key มันจะ build Docker image ของ repo, เริ่ม stdio MCP probe server จริง
ภายใน container, materialize เซิร์ฟเวอร์นั้นผ่าน embedded Pi bundle
MCP runtime, รัน tool จากนั้นตรวจสอบว่า `coding` และ `messaging` ยังคงเก็บ
tool ของ `bundle-mcp` ไว้ ขณะที่ `minimal` และ `tools.deny: ["bundle-mcp"]` จะกรองออก
`test:docker:cron-mcp-cleanup` เป็นแบบกำหนดแน่นอนและไม่ต้องใช้ live model
key มันจะเริ่ม Gateway ที่ seed แล้วพร้อม stdio MCP probe server จริง, รัน
เทิร์น Cron แบบ isolated และเทิร์นลูกแบบ one-shot จาก `/subagents spawn`, จากนั้นตรวจสอบว่า
MCP child process ออกจากระบบหลังจบแต่ละการรัน

Manual ACP plain-language thread smoke (ไม่อยู่ใน CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- เก็บสคริปต์นี้ไว้สำหรับเวิร์กโฟลว์ regression/การดีบัก อาจจำเป็นต้องใช้อีกครั้งสำหรับการตรวจสอบ ACP thread routing ดังนั้นอย่าลบทิ้ง

env var ที่มีประโยชน์:

- `OPENCLAW_CONFIG_DIR=...` (ค่าเริ่มต้น: `~/.openclaw`) จะถูก mount ไปที่ `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (ค่าเริ่มต้น: `~/.openclaw/workspace`) จะถูก mount ไปที่ `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (ค่าเริ่มต้น: `~/.profile`) จะถูก mount ไปที่ `/home/node/.profile` และ source ก่อนรันการทดสอบ
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` เพื่อตรวจสอบเฉพาะ env var ที่ source จาก `OPENCLAW_PROFILE_FILE` โดยใช้ config/workspace dir ชั่วคราว และไม่มีการ mount external CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (ค่าเริ่มต้น: `~/.cache/openclaw/docker-cli-tools`) จะถูก mount ไปที่ `/home/node/.npm-global` สำหรับ CLI install ที่แคชไว้ภายใน Docker
- ไดเรกทอรี/ไฟล์ external CLI auth ภายใต้ `$HOME` จะถูก mount แบบอ่านอย่างเดียวไว้ใต้ `/host-auth...` จากนั้นคัดลอกเข้า `/home/node/...` ก่อนเริ่มการทดสอบ
  - ไดเรกทอรีค่าเริ่มต้น: `.minimax`
  - ไฟล์ค่าเริ่มต้น: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - การรันที่จำกัด provider จะ mount เฉพาะไดเรกทอรี/ไฟล์ที่จำเป็นตามที่อนุมานจาก `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - override เองได้ด้วย `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` หรือรายการคั่นด้วย comma เช่น `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` เพื่อจำกัดขอบเขตการรัน
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` เพื่อกรอง provider ภายใน container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อใช้ `openclaw:local-live` image ที่มีอยู่แล้วซ้ำสำหรับการรันใหม่ที่ไม่ต้อง rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` เพื่อให้แน่ใจว่า credential มาจาก profile store (ไม่ใช่ env)
- `OPENCLAW_OPENWEBUI_MODEL=...` เพื่อเลือกโมเดลที่ gateway จะเปิดเผยให้กับ Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` เพื่อ override nonce-check prompt ที่ใช้โดย Open WebUI smoke
- `OPENWEBUI_IMAGE=...` เพื่อ override image tag ของ Open WebUI ที่ตรึงไว้

## ความถูกต้องของเอกสาร

รันการตรวจสอบเอกสารหลังแก้ไข docs: `pnpm check:docs`
รันการตรวจสอบ anchor ของ Mintlify แบบเต็มเมื่อคุณต้องการตรวจ heading ภายในหน้าด้วย: `pnpm docs:check-links:anchors`

## Regression แบบออฟไลน์ (ปลอดภัยสำหรับ CI)

สิ่งเหล่านี้คือ regression แบบ “pipeline จริง” โดยไม่ใช้ provider จริง:

- การเรียก tool ผ่าน Gateway (mock OpenAI, gateway + agent loop จริง): `src/gateway/gateway.test.ts` (เคส: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, เขียน config + บังคับใช้ auth): `src/gateway/gateway.test.ts` (เคส: "runs wizard over ws and writes auth token config")

## การประเมินความน่าเชื่อถือของเอเจนต์ (Skills)

เรามีการทดสอบที่ปลอดภัยสำหรับ CI อยู่แล้วบางส่วนซึ่งทำหน้าที่คล้าย “การประเมินความน่าเชื่อถือของเอเจนต์”:

- การเรียก tool แบบ mock ผ่าน gateway + agent loop จริง (`src/gateway/gateway.test.ts`)
- โฟลว์ wizard แบบ end-to-end ที่ตรวจสอบการต่อสายของเซสชันและผลกระทบของ config (`src/gateway/gateway.test.ts`)

สิ่งที่ยังขาดสำหรับ Skills (ดู [Skills](/th/tools/skills)):

- **การตัดสินใจ:** เมื่อ Skills ถูกแสดงใน prompt เอเจนต์เลือก Skill ที่ถูกต้อง (หรือหลีกเลี่ยง Skill ที่ไม่เกี่ยวข้อง) หรือไม่
- **การปฏิบัติตาม:** เอเจนต์อ่าน `SKILL.md` ก่อนใช้งานและทำตามขั้นตอน/อาร์กิวเมนต์ที่กำหนดหรือไม่
- **สัญญาเวิร์กโฟลว์:** scenario หลายเทิร์นที่ยืนยันลำดับของ tool, การส่งต่อประวัติเซสชัน และขอบเขตของ sandbox

eval ในอนาคตควรยังคงเป็นแบบกำหนดแน่นอนก่อน:

- scenario runner ที่ใช้ mock provider เพื่อยืนยันการเรียก tool + ลำดับ, การอ่านไฟล์ skill และการต่อสายของเซสชัน
- ชุด scenario ขนาดเล็กที่เน้นเรื่อง skill (ใช้เทียบกับหลีกเลี่ยง, gating, prompt injection)
- live eval แบบเลือกเปิด (ควบคุมด้วย env) เฉพาะหลังจากมีชุดที่ปลอดภัยสำหรับ CI แล้วเท่านั้น

## Contract test (รูปร่างของ plugin และ channel)

contract test ใช้ตรวจสอบว่า plugin และ channel ที่ลงทะเบียนทุกตัวเป็นไปตาม
interface contract ของตนหรือไม่ โดยจะวนผ่าน plugin ที่ค้นพบทั้งหมดและรันชุด assertion
เกี่ยวกับรูปร่างและพฤติกรรม unit lane ปกติของ `pnpm test` ตั้งใจข้ามไฟล์ seam และ smoke ที่ใช้ร่วมกันเหล่านี้; ให้รันคำสั่ง contract โดยตรง
เมื่อคุณแตะพื้นผิว channel หรือ provider ที่ใช้ร่วมกัน

### คำสั่ง

- contract ทั้งหมด: `pnpm test:contracts`
- เฉพาะ channel contract: `pnpm test:contracts:channels`
- เฉพาะ provider contract: `pnpm test:contracts:plugins`

### Channel contract

อยู่ที่ `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - รูปร่างพื้นฐานของ Plugin (id, name, capabilities)
- **setup** - contract ของ setup wizard
- **session-binding** - พฤติกรรมของ session binding
- **outbound-payload** - โครงสร้าง payload ของข้อความ
- **inbound** - การจัดการข้อความขาเข้า
- **actions** - ตัวจัดการ action ของช่องทาง
- **threading** - การจัดการ thread ID
- **directory** - API ของ directory/roster
- **group-policy** - การบังคับใช้นโยบายกลุ่ม

### Provider status contract

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`

- **status** - การ probe สถานะของช่องทาง
- **registry** - รูปร่างของ registry ของ Plugin

### Provider contract

อยู่ที่ `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract ของ auth flow
- **auth-choice** - การเลือก/การคัดเลือก auth
- **catalog** - API ของ model catalog
- **discovery** - การค้นพบ Plugin
- **loader** - การโหลด Plugin
- **runtime** - runtime ของ provider
- **shape** - รูปร่าง/interface ของ Plugin
- **wizard** - setup wizard

### ควรรันเมื่อใด

- หลังเปลี่ยน export หรือ subpath ของ plugin-sdk
- หลังเพิ่มหรือแก้ไข channel หรือ provider Plugin
- หลัง refactor การลงทะเบียนหรือการค้นพบ Plugin

contract test รันใน CI และไม่ต้องใช้ API key จริง

## การเพิ่ม regression (แนวทาง)

เมื่อคุณแก้ปัญหา provider/โมเดลที่พบในการรันแบบ live:

- เพิ่ม regression ที่ปลอดภัยสำหรับ CI หากเป็นไปได้ (mock/stub provider หรือจับการแปลงรูปร่างของ request ที่แน่นอน)
- หากเป็นกรณีที่เป็น live-only โดยเนื้อแท้ (rate limit, นโยบาย auth) ให้เก็บ live test ไว้ให้แคบและเป็นแบบเลือกเปิดผ่าน env var
- ควรกำหนดเป้าหมายไปยังชั้นที่เล็กที่สุดซึ่งสามารถจับบั๊กได้:
  - บั๊กการแปลง/เล่นซ้ำ request ของ provider → direct models test
  - บั๊กใน pipeline ของ gateway session/history/tool → gateway live smoke หรือ gateway mock test แบบปลอดภัยสำหรับ CI
- ราวกันตกของการ traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` จะ derive target ตัวอย่างหนึ่งรายการต่อ SecretRef class จาก metadata ของ registry (`listSecretTargetRegistryEntries()`), แล้วตรวจสอบว่า exec id ของ traversal-segment ถูกปฏิเสธ
  - หากคุณเพิ่มตระกูล target ของ SecretRef ใหม่แบบ `includeInPlan` ใน `src/secrets/target-registry-data.ts` ให้ปรับปรุง `classifyTargetClass` ในการทดสอบนั้น การทดสอบนี้ตั้งใจล้มเหลวเมื่อเจอ target id ที่ยังไม่ถูกจัดประเภท เพื่อไม่ให้ class ใหม่ถูกข้ามแบบเงียบ ๆ

## ที่เกี่ยวข้อง

- [Testing live](/th/help/testing-live)
- [CI](/th/ci)
