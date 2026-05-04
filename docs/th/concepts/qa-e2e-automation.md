---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA เชื่อมโยงกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่งข้อมูล
    - การเพิ่มสถานการณ์ QA ที่อ้างอิงจากรีโป
    - การสร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นรอบแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่รองรับด้วยรีโป, เลนการส่งผ่านแบบสด, อะแดปเตอร์การส่งผ่าน และการรายงาน.'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-05-04T07:05:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Private QA stack มีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงกว่าและมีรูปทรงตามช่องทาง
มากกว่าที่ unit test เดียวจะทำได้

ชิ้นส่วนปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกต transcript,
  แทรกข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin รันเนอร์ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับช่องทางจริงภายใน child QA gateway
- `qa/`: แอสเซ็ต seed ที่อิงกับ repo สำหรับงานเริ่มต้นและสถานการณ์ QA
  baseline
- [Mantis](/th/concepts/mantis): การยืนยันสดก่อนและหลังสำหรับบั๊กที่
  ต้องใช้ transport จริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่บันเดิลมา; เขียนรายงาน Markdown                                                                                                                                             |
| `qa suite`                                          | รันสถานการณ์ที่อิงกับ repo กับเลน QA gateway Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                       |
| `qa coverage`                                       | พิมพ์ inventory coverage ของสถานการณ์ในรูปแบบ markdown (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                                                |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน agentic parity                                                                                                               |
| `qa character-eval`                                 | รันสถานการณ์ character QA ข้ามโมเดลสดหลายตัวพร้อมรายงานที่มีการตัดสิน ดู [การรายงาน](#reporting)                                                                                 |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลน provider/model ที่เลือกไว้                                                                                                                               |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                                         |
| `qa docker-build-image`                             | สร้างอิมเมจ QA Docker ที่อบไว้ล่วงหน้า                                                                                                                                                          |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับแดชบอร์ด QA + เลน gateway                                                                                                                         |
| `qa up`                                             | สร้างไซต์ QA, เริ่ม stack ที่อิงกับ Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; variant `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                       |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                                       |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการ pool credential Convex ที่ใช้ร่วมกัน                                                                                                                                                    |
| `qa matrix`                                         | เลน live transport กับ Tuwunel homeserver แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                           |
| `qa telegram`                                       | เลน live transport กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                   |
| `qa discord`                                        | เลน live transport กับช่อง guild Discord ส่วนตัวจริง                                                                                                                            |
| `qa slack`                                          | เลน live transport กับช่อง Slack ส่วนตัวจริง                                                                                                                                    |
| `qa mantis`                                         | รันเนอร์การยืนยันก่อนและหลังสำหรับบั๊ก live transport พร้อมหลักฐาน status-reactions ของ Discord, smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox และ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) |

## โฟลว์ผู้ปฏิบัติการ

โฟลว์ผู้ปฏิบัติการ QA ปัจจุบันคือไซต์ QA แบบสอง pane:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดง transcript แบบ Slack-ish และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้างไซต์ QA, เริ่มเลน gateway ที่อิงกับ Docker และเปิดเผยหน้า
QA Lab ที่ผู้ปฏิบัติการหรือลูปอัตโนมัติสามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรมช่องทางจริง และบันทึกสิ่งที่ทำงานได้ ล้มเหลว หรือ
ยังติดบล็อกอยู่

สำหรับการวนแก้ UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง,
ให้เริ่ม stack ด้วยบันเดิล QA Lab แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปใน container `qa-lab` `qa:lab:watch`
สร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะโหลดซ้ำอัตโนมัติเมื่อ hash แอสเซ็ต QA Lab
เปลี่ยนไป

สำหรับ smoke trace OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่ม receiver trace OTLP/HTTP ในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้งาน Plugin `diagnostics-otel`, จากนั้น
ถอดรหัส protobuf spans ที่ส่งออกและ assert รูปทรงที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model calls ต้องไม่ส่งออก `StreamAbandoned` ใน turn ที่สำเร็จ; ID diagnostic ดิบและ
attribute `openclaw.content.*` ต้องไม่อยู่ใน trace คำสั่งนี้เขียน
`otel-smoke-summary.json` ข้าง artifacts ของ QA suite

QA ด้าน observability ยังคงเป็น source-checkout เท่านั้น npm tarball จงใจละเว้น
QA Lab ดังนั้นเลน release Docker ของแพ็กเกจจะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน instrumentation
diagnostics

สำหรับเลน smoke Matrix ที่เป็น transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

เอกสารอ้างอิง CLI ฉบับเต็ม, catalog ของ profile/scenario, env vars และ layout artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) สรุปโดยย่อ: คำสั่งนี้ provision Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Plugin Matrix จริงภายใน child QA gateway ที่จำกัดขอบเขตไว้กับ transport นั้น (ไม่มี `qa-channel`), จากนั้นเขียนรายงาน Markdown, summary JSON, artifact observed-events และ log เอาต์พุตรวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับเลน smoke Telegram, Discord และ Slack ที่เป็น transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

เลนเหล่านี้มุ่งเป้าไปที่ช่องทางจริงที่มีอยู่แล้วพร้อม bot สองตัว (driver + SUT) env vars ที่จำเป็น, รายการสถานการณ์, output artifacts และ pool credential Convex มีเอกสารอยู่ใน [เอกสารอ้างอิง QA ของ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

สำหรับการรัน Slack desktop VM เต็มรูปแบบพร้อม VNC rescue ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นเช่าเครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox, รันเลนสด Slack
ภายใน VM, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อป และ
คัดลอก `slack-qa/` พร้อม `slack-desktop-smoke.png` กลับไปยังไดเรกทอรี artifact
ของ Mantis ใช้ `--lease-id <cbx_...>` ซ้ำหลังจากล็อกอิน Slack Web ด้วยตนเอง
ผ่าน VNC เมื่อใช้ `--gateway-setup` Mantis จะคง Gateway Slack ของ OpenClaw
แบบถาวรที่ทำงานอยู่ภายใน VM บนพอร์ต `38973`; ถ้าไม่ใช้ คำสั่งจะรัน
เลน QA Slack แบบ bot-to-bot ปกติและออกหลังจากจับ artifact แล้ว

ก่อนใช้ credential สดจาก pool ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจสอบ env ของ broker Convex, validate การตั้งค่า endpoint และยืนยันการเข้าถึง admin/list เมื่อมี maintainer secret อยู่ โดยจะรายงานเฉพาะสถานะ set/missing สำหรับ secrets

## Coverage ของ live transport

เลน live transport ใช้ contract เดียวกันแทนที่แต่ละเลนจะสร้างรูปทรงรายการสถานการณ์ของตัวเอง `qa-channel` คือ suite พฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของ matrix coverage ของ live transport

| เลน     | Canary | การ gate mention | Bot-to-bot | บล็อก allowlist | การตอบกลับระดับบนสุด | resume หลัง restart | follow-up ใน thread | isolation ของ thread | การสังเกต reaction | คำสั่ง help | การลงทะเบียนคำสั่ง native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

สิ่งนี้คง `qa-channel` ไว้เป็น suite พฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และ live transports ในอนาคตใช้ checklist transport-contract ที่ชัดเจนร่วมกัน

สำหรับเลน Linux VM แบบใช้แล้วทิ้งโดยไม่ดึง Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต Multipass guest ใหม่ ติดตั้ง dependency สร้าง OpenClaw
ภายใน guest รัน `qa suite` จากนั้นคัดลอกรายงาน QA ปกติและ
สรุปกลับไปยัง `.artifacts/qa-e2e/...` บน host
คำสั่งนี้ใช้พฤติกรรมการเลือก scenario เดียวกับ `qa suite` บน host
การรันชุดทดสอบบน host และ Multipass จะดำเนินการ scenario ที่เลือกหลายรายการแบบขนาน
ด้วย worker ของ Gateway ที่แยกกันโดยค่าเริ่มต้น `qa-channel` ตั้งค่าเริ่มต้นของ concurrency
เป็น 4 โดยจำกัดไม่เกินจำนวน scenario ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการดำเนินการแบบลำดับเดียว
คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
การรันแบบ live จะส่งต่อ input การยืนยันตัวตน QA ที่รองรับและใช้งานได้จริงสำหรับ
guest ได้แก่ key ของ provider จาก env, path config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount ไว้ได้

## อ้างอิง QA สำหรับ Telegram, Discord และ Slack

Matrix มี[หน้าเฉพาะ](/th/concepts/qa-matrix)เนื่องจากมีจำนวน scenario มากและมีการจัดเตรียม homeserver ที่ใช้ Docker รองรับ Telegram, Discord และ Slack มีขนาดเล็กกว่า โดยมีเพียงไม่กี่ scenario ต่อรายการ ไม่มีระบบ profile และทดสอบกับ channel จริงที่มีอยู่แล้ว ดังนั้นอ้างอิงของรายการเหล่านี้จึงอยู่ที่นี่

### flag ของ CLI ที่ใช้ร่วมกัน

lane เหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับ flag เดียวกัน:

| Flag                                  | ค่าเริ่มต้น                                                     | คำอธิบาย                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | รันเฉพาะ scenario นี้ ทำซ้ำได้                                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียน report/summary/observed message และ output log path แบบ relative จะ resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | root ของ repository เมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                |
| `--sut-account <id>`                  | `sut`                                                           | id บัญชีชั่วคราวภายใน config ของ QA Gateway                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (`live-openai` แบบ legacy ยังใช้งานได้)                                           |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                        | ref ของ model หลัก/สำรอง                                                                                             |
| `--fast`                              | ปิด                                                             | โหมดเร็วของ provider ในที่ที่รองรับ                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [pool ของ credential ใน Convex](#convex-credential-pool)                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, นอกนั้นเป็น `maintainer`                            | role ที่ใช้เมื่อ `--credential-source convex`                                                                        |

แต่ละ lane จะออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว `--allow-failures` จะเขียน artifact โดยไม่ตั้ง exit code ที่ล้มเหลว

### Telegram QA

```bash
pnpm openclaw qa telegram
```

เป้าหมายคือกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มี bot สองตัวแยกกัน (driver + SUT) SUT bot ต้องมี username ของ Telegram; การสังเกตการณ์ bot-to-bot ทำงานได้ดีที่สุดเมื่อ bot ทั้งสองตัวเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id ของ chat แบบตัวเลข (string)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifact ของ observed-message (ค่าเริ่มต้นจะ redact)

Scenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artifact ที่ส่งออก:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อ reply (driver ส่ง → สังเกตเห็น SUT reply) เริ่มจาก canary
- `telegram-qa-observed-messages.json` — redact เนื้อหา เว้นแต่ตั้งค่า `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### Discord QA

```bash
pnpm openclaw qa discord
```

เป้าหมายคือ channel ของ Discord guild ส่วนตัวจริงหนึ่ง channel ที่มี bot สองตัว: driver bot ที่ควบคุมโดย harness และ SUT bot ที่เริ่มโดย child OpenClaw Gateway ผ่าน Plugin Discord ที่ bundle มา ตรวจสอบการจัดการการ mention ใน channel, การที่ SUT bot ลงทะเบียนคำสั่ง native `/help` กับ Discord แล้ว และ scenario หลักฐานของ Mantis แบบ opt-in

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับ user id ของ SUT bot ที่ Discord ส่งคืน (ไม่เช่นนั้น lane จะล้มเหลวอย่างรวดเร็ว)

ตัวเลือกเสริม:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifact ของ observed-message

Scenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenario ของ Mantis แบบ opt-in รันเดี่ยวเพราะจะสลับ SUT เป็นการ reply ใน guild แบบ always-on และ tool-only ด้วย `messages.statusReactions.enabled=true` จากนั้นจับ timeline ของ REST reaction พร้อม artifact ภาพ HTML/PNG

รัน scenario status-reaction ของ Mantis โดยระบุอย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artifact ที่ส่งออก:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — redact เนื้อหา เว้นแต่ตั้งค่า `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อรัน scenario status-reaction

### Slack QA

```bash
pnpm openclaw qa slack
```

เป้าหมายคือ channel ของ Slack ส่วนตัวจริงหนึ่ง channel ที่มี bot สองตัวแยกกัน: driver bot ที่ควบคุมโดย harness และ SUT bot ที่เริ่มโดย child OpenClaw Gateway ผ่าน Plugin Slack ที่ bundle มา

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifact ของ observed-message

Scenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artifact ที่ส่งออก:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — redact เนื้อหา เว้นแต่ตั้งค่า `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

### pool ของ credential ใน Convex

lane ของ Telegram, Discord และ Slack สามารถเช่า credential จาก pool ของ Convex ที่ใช้ร่วมกันแทนการอ่าน env var ข้างต้น ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะรับ lease แบบ exclusive, ส่ง Heartbeat ตลอดระยะเวลาการรัน และ release เมื่อ shutdown kind ของ pool คือ `"telegram"`, `"discord"` และ `"slack"`

รูปทรง payload ที่ broker ตรวจสอบใน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็น string ของ chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`

env var สำหรับการปฏิบัติงานและ contract endpoint ของ broker Convex อยู่ใน [การทดสอบ → credential Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อ section เกิดก่อนการรองรับ Discord; semantic ของ broker เหมือนกันสำหรับทั้งสอง kind)

## seed ที่รองรับด้วย repo

asset ของ seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจให้อยู่ใน git เพื่อให้ทั้งมนุษย์และ
agent มองเห็นแผน QA

`qa-lab` ควรคงเป็น runner markdown ทั่วไป แต่ละไฟล์ markdown ของ scenario คือ
source of truth สำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของ scenario
- metadata ของ category, capability, lane และ risk แบบเสริม
- ref ของ docs และ code
- ข้อกำหนด Plugin แบบเสริม
- patch ของ config Gateway แบบเสริม
- `qa-flow` ที่ดำเนินการได้

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` สามารถคงความเป็นทั่วไป
และข้ามส่วนงานได้ ตัวอย่างเช่น scenario markdown สามารถรวม helper ฝั่ง transport
กับ helper ฝั่ง browser ที่ขับ Control UI ที่ฝังไว้ผ่าน
seam `browser.request` ของ Gateway โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์ scenario ควรถูกจัดกลุ่มตาม capability ของผลิตภัณฑ์แทน folder ของ source tree
คง id ของ scenario ให้เสถียรเมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อ trace การ implementation

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- chat แบบ DM และ channel
- พฤติกรรม thread
- lifecycle ของ message action
- callback ของ Cron
- การ recall memory
- การสลับ model
- การส่งต่อให้ subagent
- การอ่าน repo และการอ่าน docs
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## lane ของ provider mock

`qa suite` มี lane provider mock ใน local สอง lane:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้ scenario ยังคงเป็น lane mock แบบกำหนดผลได้
  เริ่มต้นสำหรับ QA ที่รองรับด้วย repo และ parity gate
- `aimock` เริ่ม server ของ provider ที่รองรับด้วย AIMock สำหรับ protocol,
  fixture, record/replay และ coverage แบบ chaos เชิงทดลอง เป็นส่วนเสริมและไม่ได้
  แทนที่ dispatcher ของ scenario `mock-openai`

implementation ของ provider-lane อยู่ใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตนเอง, การเริ่ม server local, config model ของ Gateway,
ความต้องการ staging ของ auth-profile และ flag capability แบบ live/mock code ของ suite และ
Gateway ที่ใช้ร่วมกันควร route ผ่าน registry ของ provider แทนการ branch ตาม
ชื่อ provider

## adapter ของ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับ scenario QA แบบ markdown `qa-channel` คือ adapter แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: channel จริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกันแทนการเพิ่ม runner QA เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการดำเนินการ scenario ทั่วไป, concurrency ของ worker, การเขียน artifact และการรายงาน
- adapter ของ transport เป็นเจ้าของ config Gateway, readiness, การสังเกตการณ์ inbound และ outbound, action ของ transport และสถานะ transport ที่ normalize แล้ว
- ไฟล์ scenario markdown ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิว runtime ที่ใช้ซ้ำได้เพื่อดำเนินการไฟล์เหล่านั้น

### การเพิ่ม channel

การเพิ่ม channel ลงในระบบ QA markdown ต้องมีสองอย่างพอดี:

1. adapter ของ transport สำหรับ channel
2. pack ของ scenario ที่ทดสอบ contract ของ channel

อย่าเพิ่ม root คำสั่ง QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- รูทคำสั่ง `openclaw qa`
- การเริ่มต้นและการปิดชุดทดสอบ
- ภาวะพร้อมกันของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินการ scenario
- นามแฝงความเข้ากันได้สำหรับ scenario `qa-channel` รุ่นเก่า

Plugin ตัวรันเป็นเจ้าของสัญญาของ transport:

- วิธี mount `openclaw qa <runner>` ใต้รูท `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า Gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธีฉีด event ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalized แล้ว
- วิธีดำเนิน action ที่มี transport รองรับ
- วิธีจัดการการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการนำช่องทางใหม่มาใช้:

1. ให้ `qa-lab` เป็นเจ้าของรูท `qa` ที่ใช้ร่วมกันต่อไป
2. Implement ตัวรัน transport บน seam โฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน Plugin ตัวรันหรือ harness ของช่องทาง
4. Mount ตัวรันเป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่งรูทที่แข่งขันกัน Plugin ตัวรันควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาไว้ ส่วน CLI แบบ lazy และการดำเนินการตัวรันควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับ scenario แบบ Markdown ใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ helper scenario แบบ generic สำหรับ scenario ใหม่
7. รักษานามแฝงความเข้ากันได้ที่มีอยู่ให้ใช้งานได้ เว้นแต่ repo กำลังทำการ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ transport ของช่องทางเดียว ให้เก็บไว้ใน Plugin ตัวรันนั้นหรือ harness ของ Plugin
- หาก scenario ต้องการ capability ใหม่ที่มากกว่าหนึ่งช่องทางสามารถใช้ได้ ให้เพิ่ม helper แบบ generic แทน branch เฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียวเท่านั้น ให้คง scenario นั้นเป็นแบบเฉพาะ transport และระบุให้ชัดเจนในสัญญาของ scenario

### ชื่อ helper ของ scenario

helper แบบ generic ที่แนะนำสำหรับ scenario ใหม่:

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

นามแฝงความเข้ากันได้ยังพร้อมใช้งานสำหรับ scenario ที่มีอยู่ — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียน scenario ใหม่ควรใช้ชื่อแบบ generic นามแฝงเหล่านี้มีไว้เพื่อหลีกเลี่ยงการ migration แบบ flag-day ไม่ใช่โมเดลสำหรับอนาคต

## การรายงาน

`qa-lab` export รายงานโปรโตคอล Markdown จาก timeline ของ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังคงถูกบล็อก
- scenario ติดตามผลใดที่ควรค่าแก่การเพิ่ม

สำหรับ inventory ของ scenario ที่พร้อมใช้งาน ซึ่งมีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อม transport ใหม่ ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับ output ที่ machine-readable)

สำหรับการตรวจ character และ style ให้รัน scenario เดียวกันกับ ref ของโมเดล live หลายตัว
และเขียนรายงาน Markdown ที่ตัดสินแล้ว:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

คำสั่งนี้รันกระบวนการลูกของ Gateway QA ในเครื่อง ไม่ใช่ Docker scenario ประเมิน character
ควรตั้ง persona ผ่าน `SOUL.md` จากนั้นรัน turn ผู้ใช้ทั่วไป
เช่น แชต ความช่วยเหลือเกี่ยวกับ workspace และงานไฟล์เล็ก ๆ ไม่ควรบอกโมเดล candidate
ว่ากำลังถูกประเมิน คำสั่งจะเก็บ transcript เต็มแต่ละรายการ
บันทึกสถิติการรันพื้นฐาน แล้วถามโมเดล judge ในโหมด fast พร้อม
reasoning `xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ provider: prompt ของ judge ยังได้รับ
ทุก transcript และสถานะการรัน แต่ ref ของ candidate จะถูกแทนที่ด้วย label กลาง
เช่น `candidate-01`; รายงานจะ map การจัดอันดับกลับไปยัง ref จริงหลังจาก
parse แล้ว
การรัน candidate ใช้ thinking ค่าเริ่มต้นเป็น `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ ref eval ของ OpenAI รุ่นเก่าที่รองรับ Override candidate เฉพาะรายการแบบ inline ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังตั้งค่า
fallback ส่วนกลาง และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังคงไว้เพื่อความเข้ากันได้
ref candidate ของ OpenAI ใช้โหมด fast เป็นค่าเริ่มต้นเพื่อใช้ priority processing ในที่ที่
provider รองรับ เพิ่ม `,fast`, `,no-fast`, หรือ `,fast=false` แบบ inline เมื่อ
candidate หรือ judge รายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อต้องการ
บังคับเปิดโหมด fast สำหรับโมเดล candidate ทุกตัว ระยะเวลาของ candidate และ judge
จะถูกบันทึกในรายงานสำหรับการวิเคราะห์ benchmark แต่ prompt ของ judge ระบุอย่างชัดเจน
ว่าอย่าจัดอันดับตามความเร็ว
การรันโมเดล candidate และ judge ใช้ concurrency 16 เป็นค่าเริ่มต้น ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัดของ provider หรือแรงกดดันต่อ Gateway
ในเครื่องทำให้การรันมี noise มากเกินไป
เมื่อไม่ได้ส่ง candidate `--model` การประเมิน character จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` judge จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [QA แบบเมทริกซ์](/th/concepts/qa-matrix)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
