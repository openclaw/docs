---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่งข้อมูล
    - การเพิ่มสถานการณ์ QA ที่อิงจากคลังเก็บโค้ด
    - การสร้างระบบอัตโนมัติ QA ที่มีความสมจริงสูงขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิงกับรีโป, เลนทรานสปอร์ตแบบสด, อะแดปเตอร์ทรานสปอร์ต และการรายงาน.'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-05-05T01:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงและมีลักษณะตามช่องทางมากกว่าที่ unit test เดี่ยวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกต transcript,
  แทรกข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin runner ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับเคลื่อนช่องทางจริงภายใน Gateway QA ลูก
- `qa/`: แอสเซ็ต seed ที่อ้างอิงจาก repo สำหรับงาน kickoff และสถานการณ์ QA
  baseline
- [Mantis](/th/concepts/mantis): การตรวจสอบสดก่อนและหลังสำหรับบั๊กที่ต้องใช้
  transport จริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายคำสั่งมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่รวมมาให้; เขียนรายงาน Markdown                                                                                                                                             |
| `qa suite`                                          | รันสถานการณ์ที่อ้างอิงจาก repo กับเลน QA Gateway alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                       |
| `qa coverage`                                       | พิมพ์ inventory ความครอบคลุมสถานการณ์แบบ markdown (`--json` สำหรับเอาต์พุตของเครื่อง)                                                                                                                |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic                                                                                                               |
| `qa character-eval`                                 | รันสถานการณ์ QA ด้าน character ข้ามโมเดลสดหลายตัวพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                                                 |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                                               |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA local (alias: `pnpm qa:lab:ui`)                                                                                                                         |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่ prebake ไว้                                                                                                                                                          |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                                         |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแต็กที่รองรับด้วย Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                       |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                                       |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูล credential Convex ที่ใช้ร่วมกัน                                                                                                                                                    |
| `qa matrix`                                         | เลน transport สดกับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                           |
| `qa telegram`                                       | เลน transport สดกับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                   |
| `qa discord`                                        | เลน transport สดกับ channel ของ guild Discord ส่วนตัวจริง                                                                                                                            |
| `qa slack`                                          | เลน transport สดกับ channel Slack ส่วนตัวจริง                                                                                                                                    |
| `qa mantis`                                         | runner ตรวจสอบก่อนและหลังสำหรับบั๊ก transport สด พร้อมหลักฐาน status-reactions ของ Discord, smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox และ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) |

## โฟลว์ผู้ปฏิบัติการ

โฟลว์ผู้ปฏิบัติการ QA ปัจจุบันเป็นไซต์ QA แบบสอง pane:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดง transcript แบบคล้าย Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้างไซต์ QA, เริ่มเลน Gateway ที่รองรับด้วย Docker และเปิดเผยหน้า
QA Lab ที่ผู้ปฏิบัติการหรือลูปอัตโนมัติสามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรมช่องทางจริง และบันทึกสิ่งที่ทำงาน สำเร็จ ล้มเหลว หรือยังติดบล็อกอยู่

สำหรับการวนซ้ำ UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้อง rebuild อิมเมจ Docker ทุกครั้ง,
เริ่มสแต็กด้วยบันเดิล QA Lab ที่ bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
rebuild บันเดิลนั้นเมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะ reload อัตโนมัติเมื่อ hash ของแอสเซ็ต QA Lab
เปลี่ยน

สำหรับ smoke trace OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นี้เริ่มตัวรับ trace OTLP/HTTP ในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel`, จากนั้น
decode span protobuf ที่ส่งออกมาและ assert รูปทรงที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model call ต้องไม่ส่งออก `StreamAbandoned` ใน turn ที่สำเร็จ; raw diagnostic IDs และ
attribute `openclaw.content.*` ต้องไม่อยู่ใน trace คำสั่งนี้เขียน
`otel-smoke-summary.json` ไว้ข้าง artifact ของ QA suite

QA ด้าน observability อยู่เฉพาะ source-checkout เท่านั้น npm tarball ตั้งใจละเว้น
QA Lab ดังนั้นเลน release Docker ของ package จึงไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน instrumentation
ด้าน diagnostics

สำหรับเลน smoke Matrix ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

เอกสารอ้างอิง CLI ฉบับเต็ม, แคตตาล็อก profile/scenario, env vars และ layout artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: คำสั่งจะ provision homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker, register ผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Plugin Matrix จริงภายใน Gateway QA ลูกที่ scope กับ transport นั้น (ไม่มี `qa-channel`), จากนั้นเขียนรายงาน Markdown, summary JSON, artifact observed-events และ log เอาต์พุตรวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับเลน smoke Telegram, Discord และ Slack ที่ใช้ transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

เลนเหล่านี้ target ช่องทางจริงที่มีอยู่แล้วด้วย bot สองตัว (driver + SUT) env vars ที่ต้องใช้, รายการสถานการณ์, artifact เอาต์พุต และพูล credential Convex มีเอกสารไว้ใน [เอกสารอ้างอิง QA ของ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

สำหรับการรัน VM เดสก์ท็อป Slack แบบเต็มพร้อม VNC rescue ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนี้ lease เครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox, รันเลนสด Slack
ภายใน VM, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อป และ
คัดลอก `slack-qa/` พร้อม `slack-desktop-smoke.png` กลับไปยังไดเรกทอรี artifact
ของ Mantis ใช้ `--lease-id <cbx_...>` ซ้ำหลังจากเข้าสู่ระบบ Slack Web ด้วยตนเอง
ผ่าน VNC เมื่อใช้ `--gateway-setup`, Mantis จะทิ้ง Gateway Slack ของ OpenClaw
แบบถาวรที่กำลังทำงานอยู่ภายใน VM บนพอร์ต `38973`; หากไม่ใช้ ตัวคำสั่งจะรันเลน QA
Slack แบบ bot-to-bot ปกติและออกหลังจากจับ artifact

ก่อนใช้ credential สดจากพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจสอบ env ของ broker Convex, ตรวจสอบความถูกต้องของการตั้งค่า endpoint และตรวจสอบความสามารถในการเข้าถึง admin/list เมื่อมี secret ของ maintainer อยู่ โดยรายงานเฉพาะสถานะ set/missing ของ secret

## ความครอบคลุม transport สด

เลน transport สดใช้ contract ร่วมกันหนึ่งชุดแทนที่จะให้แต่ละเลนสร้างรูปทรงรายการสถานการณ์ของตัวเอง `qa-channel` เป็น suite พฤติกรรมผลิตภัณฑ์สังเคราะห์ที่กว้าง และไม่เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุม transport สด

| เลน     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

สิ่งนี้คงให้ `qa-channel` เป็น suite พฤติกรรมผลิตภัณฑ์ที่กว้าง ในขณะที่ Matrix,
Telegram และ transport สดในอนาคตใช้ checklist transport-contract ที่ชัดเจนร่วมกัน

สำหรับเลน Linux VM แบบใช้แล้วทิ้งโดยไม่นำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

การดำเนินการนี้จะบูตเกสต์ Multipass ใหม่ ติดตั้ง dependencies สร้าง OpenClaw
ภายในเกสต์ รัน `qa suite` จากนั้นคัดลอกรายงาน QA ปกติและ
สรุปกลับเข้าไปยัง `.artifacts/qa-e2e/...` บนโฮสต์
ใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์
การรันชุดทดสอบบนโฮสต์และ Multipass จะดำเนินการหลายสถานการณ์ที่เลือกแบบขนาน
ด้วยเวิร์กเกอร์ gateway ที่แยกกันตามค่าเริ่มต้น `qa-channel` มีค่าเริ่มต้น concurrency
เป็น 4 โดยจำกัดไม่เกินจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวนเวิร์กเกอร์ หรือ `--concurrency 1` สำหรับการดำเนินการแบบลำดับ
คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่มี exit code ที่ล้มเหลว
การรันแบบ live จะส่งต่ออินพุต QA auth ที่รองรับและใช้งานได้จริงสำหรับ
เกสต์ ได้แก่คีย์ provider แบบ env, พาธ config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้เกสต์
เขียนกลับผ่าน workspace ที่ mount ได้

## ข้อมูลอ้างอิง QA สำหรับ Telegram, Discord และ Slack

Matrix มี[หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากจำนวนสถานการณ์และการจัดเตรียม homeserver ที่ใช้ Docker รองรับ Telegram, Discord และ Slack มีขนาดเล็กกว่า โดยมีสถานการณ์ไม่กี่รายการต่อแต่ละตัว ไม่มีระบบโปรไฟล์ และทำงานกับช่องจริงที่มีอยู่แล้ว ดังนั้นข้อมูลอ้างอิงของสิ่งเหล่านี้จึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                                         | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | รันเฉพาะสถานการณ์นี้ ใช้ซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตเห็น และล็อกเอาต์พุต พาธแบบสัมพัทธ์จะ resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | รากของ repository เมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | id บัญชีชั่วคราวภายใน config ของ QA gateway                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (`live-openai` แบบ legacy ยังใช้งานได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                                | refs ของโมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                             | โหมด fast ของ provider ในกรณีที่รองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [พูล credential ของ Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                              | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

แต่ละเลนจะออกด้วยสถานะไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียน artifacts โดยไม่ตั้งค่า exit code ที่ล้มเหลว

### QA สำหรับ Telegram

```bash
pnpm openclaw qa telegram
```

มุ่งเป้าไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแยกกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอตต่อบอตทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้งาน**โหมดการสื่อสารระหว่างบอต**ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ข้อความที่สังเกตเห็น (ค่าเริ่มต้นจะปิดบัง)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

artifacts เอาต์พุต:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตเห็นการตอบกลับของ SUT) โดยเริ่มจาก canary
- `telegram-qa-observed-messages.json` — เนื้อหาจะถูกปิดบังเว้นแต่ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA สำหรับ Discord

```bash
pnpm openclaw qa discord
```

มุ่งเป้าไปยังช่อง guild Discord ส่วนตัวจริงหนึ่งช่องที่มีบอตสองตัว: บอต driver ที่ harness ควบคุม และบอต SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Plugin Discord ที่ bundled มา ตรวจสอบการจัดการ mention ในช่อง, ว่าบอต SUT ได้ลงทะเบียนคำสั่ง native `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับ id ผู้ใช้ของบอต SUT ที่ Discord ส่งกลับ (มิฉะนั้นเลนจะล้มเหลวทันที)

ตัวเลือก:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ข้อความที่สังเกตเห็น

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — สถานการณ์ Mantis แบบ opt-in รันแยกเดี่ยวเพราะจะสลับ SUT เป็นการตอบกลับ guild แบบเปิดตลอดเวลา เฉพาะเครื่องมือ ด้วย `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์ reaction ของ REST พร้อม artifact ภาพแบบ HTML/PNG

รันสถานการณ์ status-reaction ของ Mantis อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

artifacts เอาต์พุต:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — เนื้อหาจะถูกปิดบังเว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์ status-reaction รัน

### QA สำหรับ Slack

```bash
pnpm openclaw qa slack
```

มุ่งเป้าไปยังช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอตสองตัวแยกกัน: บอต driver ที่ harness ควบคุม และบอต SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Plugin Slack ที่ bundled มา

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ข้อความที่สังเกตเห็น

สถานการณ์ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

artifacts เอาต์พุต:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — เนื้อหาจะถูกปิดบังเว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

#### การตั้งค่า workspace ของ Slack

เลนต้องใช้แอป Slack สองแอปแยกกันใน workspace เดียว พร้อมช่องที่บอตทั้งสองเป็นสมาชิก:

- `channelId` — id `Cxxxxxxxxxx` ของช่องที่บอตทั้งสองได้รับเชิญเข้าไปแล้ว ใช้ช่องเฉพาะ; เลนจะโพสต์ทุกครั้งที่รัน
- `driverBotToken` — โทเคนบอต (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` — โทเคนบอต (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกจาก driver เพื่อให้ id ผู้ใช้บอตแตกต่างกัน
- `sutAppToken` — โทเคนระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับ events ได้

ควรใช้ workspace ของ Slack ที่จัดไว้สำหรับ QA โดยเฉพาะ แทนการใช้ workspace production ซ้ำ

manifest ของ SUT ด้านล่างสะท้อนการติดตั้ง production ของ Plugin Slack ที่ bundled มา (`extensions/slack/src/setup-shared.ts:10`) สำหรับการตั้งค่าช่อง production ตามที่ผู้ใช้เห็น ดู [การตั้งค่าช่อง Slack แบบเร็ว](/th/channels/slack#quick-setup); คู่ QA Driver/SUT แยกออกมาโดยตั้งใจเพราะเลนต้องใช้ id ผู้ใช้บอตสองรายการแยกกันใน workspace เดียว

**1. สร้างแอป Driver**

ไปที่ [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → เลือก workspace QA, วาง manifest ต่อไปนี้ แล้วเลือก _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) — ค่านี้จะเป็น `driverBotToken` driver ต้องใช้เพียงการโพสต์ข้อความและระบุตัวเอง; ไม่มี events, ไม่มี Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _Create New App → From a manifest_ ใน workspace เดียวกัน ชุด scope สะท้อนการติดตั้ง production ของ Plugin Slack ที่ bundled มา (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

หลังจาก Slack สร้างแอปแล้ว ให้ทำสองอย่างบนหน้าการตั้งค่าของแอป:

- _Install to Workspace_ → คัดลอก _Bot User OAuth Token_ → ค่านี้จะเป็น `sutBotToken`
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → เพิ่ม scope `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านี้จะเป็น `sutAppToken`

ตรวจสอบว่าบอตทั้งสองมี ID ผู้ใช้ที่ต่างกันโดยเรียก `auth.test` กับแต่ละโทเค็น รันไทม์แยก driver และ SUT ด้วย ID ผู้ใช้ การใช้แอปเดียวกันซ้ำสำหรับทั้งสองอย่างจะทำให้การควบคุมด้วยการ mention ล้มเหลวทันที

**3. สร้างช่อง**

ในเวิร์กสเปซ QA ให้สร้างช่องหนึ่งช่อง (เช่น `#openclaw-qa`) แล้วเชิญบอตทั้งสองจากภายในช่อง:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอก ID `Cxxxxxxxxxx` จาก _channel info → About → Channel ID_ ซึ่งจะกลายเป็น `channelId` ช่องสาธารณะใช้ได้ หากคุณใช้ช่องส่วนตัว ทั้งสองแอปมี `groups:history` อยู่แล้ว ดังนั้นการอ่านประวัติของ harness จะยังสำเร็จ

**4. ลงทะเบียนข้อมูลประจำตัว**

มีสองตัวเลือก ใช้ env vars สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือ seed pool Convex ที่แชร์ไว้เพื่อให้ CI และ maintainer คนอื่น ๆ เช่าใช้ได้

สำหรับ pool Convex ให้เขียนสี่ฟิลด์ลงในไฟล์ JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

เมื่อ export `OPENCLAW_QA_CONVEX_SITE_URL` และ `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ใน shell แล้ว ให้ลงทะเบียนและตรวจสอบ:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

ควรได้ `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบตั้งแต่ต้นจนจบ**

รัน lane ในเครื่องเพื่อยืนยันว่าบอตทั้งสองคุยกันผ่าน broker ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านจะเสร็จในเวลาน้อยกว่า 30 วินาทีมาก และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` ด้วยสถานะ `pass` หาก lane ค้างประมาณ 90 วินาทีแล้วออกด้วย `Convex credential pool exhausted for kind "slack"` แปลว่า pool ว่างหรือทุกแถวถูกเช่าอยู่ โดย `qa credentials list --kind slack --status all --json` จะบอกคุณว่าเป็นกรณีใด

### pool ข้อมูลประจำตัว Convex

lane ของ Telegram, Discord และ Slack สามารถเช่าข้อมูลประจำตัวจาก pool Convex ที่แชร์ไว้ แทนการอ่าน env vars ด้านบน ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอ lease แบบเอกสิทธิ์ ส่ง Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดระบบ ชนิดของ pool คือ `"telegram"`, `"discord"` และ `"slack"`

รูปทรง payload ที่ broker ตรวจสอบใน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` ต้องตรงกับ `^[A-Z][A-Z0-9]+$` (ID Slack เช่น `Cxxxxxxxxxx`) ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและ scope

env vars สำหรับปฏิบัติการและสัญญา endpoint ของ broker Convex อยู่ใน [การทดสอบ → ข้อมูลประจำตัว Telegram ที่แชร์ผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มีมาก่อนการรองรับ Discord แต่ semantics ของ broker เหมือนกันสำหรับทั้งสองชนิด)

## seed ที่อิงกับ repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ไฟล์เหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ agent

`qa-lab` ควรคงเป็น runner markdown แบบทั่วไป ไฟล์ markdown scenario แต่ละไฟล์คือแหล่งความจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของ scenario
- metadata หมวดหมู่ ความสามารถ lane และความเสี่ยงแบบไม่บังคับ
- refs ของเอกสารและโค้ด
- ข้อกำหนด Plugin แบบไม่บังคับ
- patch config ของ Gateway แบบไม่บังคับ
- `qa-flow` ที่รันได้

พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` อนุญาตให้ยังเป็นแบบทั่วไปและครอบคลุมหลายด้านได้ ตัวอย่างเช่น markdown scenario สามารถรวม helper ฝั่ง transport กับ helper ฝั่ง browser ที่ขับ Control UI แบบฝังผ่าน seam `browser.request` ของ Gateway โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์ scenario ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์ ไม่ใช่ตามโฟลเดอร์ source tree รักษา ID ของ scenario ให้คงที่เมื่อย้ายไฟล์ ใช้ `docsRefs` และ `codeRefs` เพื่อการติดตามย้อนกลับไปยัง implementation

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และแชตช่อง
- พฤติกรรม thread
- วงจรชีวิตของ message action
- callback ของ cron
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่องานให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## lane mock provider

`qa suite` มี lane mock provider ในเครื่องสองแบบ:

- `mock-openai` คือ mock OpenClaw ที่รับรู้ scenario และยังคงเป็น lane mock แบบ deterministic ค่าเริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gates
- `aimock` เริ่ม provider server ที่อิงกับ AIMock สำหรับ coverage ด้าน protocol, fixture, record/replay และ chaos แบบทดลอง เป็นส่วนเสริมและไม่ได้แทนที่ dispatcher scenario `mock-openai`

implementation ของ provider-lane อยู่ใต้ `extensions/qa-lab/src/providers/` แต่ละ provider เป็นเจ้าของค่าเริ่มต้น การเริ่ม server ในเครื่อง config โมเดลของ Gateway ความต้องการ staging ของ auth-profile และแฟล็กความสามารถ live/mock ของตนเอง โค้ด suite และ Gateway ที่แชร์กันควร route ผ่าน registry ของ provider แทนการ branch ตามชื่อ provider

## adapter ของ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับ markdown QA scenario `qa-channel` คือ adapter แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: ช่องจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกัน แทนการเพิ่ม QA runner เฉพาะ transport

ในระดับสถาปัตยกรรม การแยกส่วนคือ:

- `qa-lab` เป็นเจ้าของการรัน scenario ทั่วไป concurrency ของ worker การเขียน artifact และการรายงาน
- adapter ของ transport เป็นเจ้าของ config Gateway, readiness, การสังเกต inbound และ outbound, action ของ transport และ state ของ transport ที่ normalize แล้ว
- ไฟล์ markdown scenario ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งนำไป execute

### การเพิ่มช่อง

การเพิ่มช่องเข้าในระบบ markdown QA ต้องมีสองสิ่งเท่านั้น:

1. adapter ของ transport สำหรับช่องนั้น
2. pack scenario ที่ทดสอบสัญญาของช่องนั้น

อย่าเพิ่ม root command QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่แชร์กันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่แชร์กัน:

- root command `openclaw qa`
- การเริ่มและการ teardown suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การรัน scenario
- alias ความเข้ากันได้สำหรับ scenario `qa-channel` รุ่นเก่า

Runner Plugin เป็นเจ้าของสัญญาของ transport:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่แชร์กัน
- วิธี config Gateway สำหรับ transport นั้น
- วิธีตรวจสอบ readiness
- วิธี inject event inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และ state ของ transport ที่ normalize แล้ว
- วิธี execute action ที่อิงกับ transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำสำหรับการรับช่องใหม่:

1. คง `qa-lab` เป็นเจ้าของ root `qa` ที่แชร์กัน
2. implement transport runner บน seam host `qa-lab` ที่แชร์กัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน runner Plugin หรือ channel harness
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งกัน Runner Plugin ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export array `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาอยู่เสมอ; CLI แบบ lazy และการ execute runner ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับ markdown scenario ใต้ไดเรกทอรีตามธีม `qa/scenarios/`
6. ใช้ helper scenario ทั่วไปสำหรับ scenario ใหม่
7. รักษา alias ความเข้ากันได้ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงครั้งเดียวใน `qa-lab` ได้ ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ transport ของช่องหนึ่งช่อง ให้เก็บไว้ใน runner Plugin หรือ harness ของ Plugin นั้น
- หาก scenario ต้องการความสามารถใหม่ที่มากกว่าหนึ่งช่องใช้ได้ ให้เพิ่ม helper ทั่วไปแทน branch เฉพาะช่องใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้เก็บ scenario ให้เฉพาะ transport และระบุให้ชัดเจนในสัญญา scenario

### ชื่อ helper ของ scenario

helper ทั่วไปที่แนะนำสำหรับ scenario ใหม่:

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

alias ความเข้ากันได้ยังใช้งานได้สำหรับ scenario ที่มีอยู่ — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียน scenario ใหม่ควรใช้ชื่อทั่วไป alias มีไว้เพื่อหลีกเลี่ยง migration แบบเปลี่ยนพร้อมกันทั้งระบบ ไม่ใช่เป็นโมเดลในอนาคต

## การรายงาน

`qa-lab` export รายงาน protocol Markdown จาก timeline ของ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อก
- scenario ติดตามผลใดควรค่าแก่การเพิ่ม

สำหรับ inventory ของ scenario ที่มีอยู่ ซึ่งมีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อม transport ใหม่ ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับ output ที่อ่านได้ด้วยเครื่อง)

สำหรับการตรวจสอบตัวละครและสไตล์ ให้รัน scenario เดียวกันกับ refs ของโมเดล live หลายรายการ แล้วเขียนรายงาน Markdown ที่ตัดสินแล้ว:

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

คำสั่งนี้เรียกใช้โปรเซสลูกของ Gateway QA ในเครื่อง ไม่ใช่ Docker สถานการณ์การประเมินตัวละครควรกำหนดบุคลิกผ่าน `SOUL.md` แล้วเรียกใช้รอบการโต้ตอบของผู้ใช้ตามปกติ เช่น การแชต ความช่วยเหลือเกี่ยวกับเวิร์กสเปซ และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลตัวเลือกว่ากำลังถูกประเมิน คำสั่งนี้จะเก็บทรานสคริปต์ฉบับเต็มแต่ละรายการ บันทึกสถิติพื้นฐานของการรัน จากนั้นขอให้โมเดลผู้ตัดสินในโหมดเร็วพร้อมการให้เหตุผลระดับ `xhigh` เมื่อรองรับ จัดอันดับการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: พรอมป์ของผู้ตัดสินยังคงได้รับทรานสคริปต์และสถานะการรันทุกอย่าง แต่ refs ของตัวเลือกจะถูกแทนที่ด้วยป้ายกำกับกลาง เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง refs จริงหลังจากแยกวิเคราะห์แล้ว
การรันตัวเลือกมีค่าเริ่มต้นเป็นการคิดระดับ `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh` สำหรับ refs การประเมิน OpenAI รุ่นเก่าที่รองรับ แทนที่ตัวเลือกเฉพาะแบบอินไลน์ด้วย `--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้งค่าทางเลือกสำรองส่วนกลาง และรูปแบบเดิม `--model-thinking <provider/model=level>` ยังคงเก็บไว้เพื่อความเข้ากันได้
refs ตัวเลือกของ OpenAI มีค่าเริ่มต้นเป็นโหมดเร็ว เพื่อให้ใช้การประมวลผลแบบลำดับความสำคัญเมื่อผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบอินไลน์เมื่อจำเป็นต้องแทนที่ค่าสำหรับตัวเลือกหรือผู้ตัดสินเพียงรายการเดียว ส่ง `--fast` เฉพาะเมื่อคุณต้องการบังคับเปิดโหมดเร็วสำหรับโมเดลตัวเลือกทุกตัว ระยะเวลาของตัวเลือกและผู้ตัดสินจะถูกบันทึกในรายงานสำหรับการวิเคราะห์เบนช์มาร์ก แต่พรอมป์ของผู้ตัดสินระบุอย่างชัดเจนว่าไม่ให้จัดอันดับตามความเร็ว
การรันโมเดลตัวเลือกและโมเดลผู้ตัดสินมีค่าเริ่มต้นเป็นการทำงานพร้อมกัน 16 รายการทั้งคู่ ลด `--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดของผู้ให้บริการหรือแรงกดดันต่อ Gateway ในเครื่องทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่ได้ส่ง `--model` ของตัวเลือก การประเมินตัวละครจะใช้ค่าเริ่มต้นเป็น `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` และ `google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` ผู้ตัดสินจะใช้ค่าเริ่มต้นเป็น `openai/gpt-5.5,thinking=xhigh,fast` และ `anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [เมทริกซ์ QA](/th/concepts/qa-matrix)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
