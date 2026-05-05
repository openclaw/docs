---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การส่งข้อมูล
    - การเพิ่มสถานการณ์ QA ที่อิงจากรีโพซิทอรี
    - การสร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อ้างอิงรีโป, เลนการขนส่งแบบสด, อะแดปเตอร์การขนส่ง และการรายงาน.'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-05-05T06:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงกว่าและมีลักษณะคล้าย channel มากกว่าที่ unit test เดี่ยวจะทำได้

ชิ้นส่วนปัจจุบัน:

- `extensions/qa-channel`: channel ข้อความสังเคราะห์ที่มีพื้นผิว DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และ QA bus สำหรับสังเกต transcript,
  inject ข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, runner Plugin ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับเคลื่อน channel จริงภายใน QA gateway ลูก
- `qa/`: seed asset ที่สำรองด้วย repo สำหรับ kickoff task และ baseline QA
  scenario
- [Mantis](/th/concepts/mantis): การยืนยันก่อนและหลังแบบ live สำหรับบั๊กที่
  ต้องใช้ transport จริง, browser screenshot, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุก QA flow ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายคำสั่งมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่รวมมาให้; เขียนรายงาน Markdown                                                                                                                                             |
| `qa suite`                                          | รัน scenario ที่สำรองด้วย repo เทียบกับ QA gateway lane Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                       |
| `qa coverage`                                       | พิมพ์ scenario-coverage inventory แบบ markdown (`--json` สำหรับ output ที่เครื่องอ่านได้)                                                                                                                |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic                                                                                                               |
| `qa character-eval`                                 | รัน character QA scenario ข้ามหลาย live model พร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                                                 |
| `qa manual`                                         | รัน prompt ครั้งเดียวกับ provider/model lane ที่เลือก                                                                                                                               |
| `qa ui`                                             | เริ่ม QA debugger UI และ QA bus ในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                                         |
| `qa docker-build-image`                             | สร้าง image Docker QA ที่เตรียมไว้ล่วงหน้า                                                                                                                                                          |
| `qa docker-scaffold`                                | เขียน docker-compose scaffold สำหรับ QA dashboard + gateway lane                                                                                                                         |
| `qa up`                                             | สร้าง QA site, เริ่มสแต็กที่สำรองด้วย Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; variant `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                       |
| `qa aimock`                                         | เริ่มเฉพาะ server provider AIMock                                                                                                                                                       |
| `qa mock-openai`                                    | เริ่มเฉพาะ server provider `mock-openai` ที่รับรู้ scenario                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการ pool credential Convex ที่ใช้ร่วมกัน                                                                                                                                                    |
| `qa matrix`                                         | live transport lane เทียบกับ Tuwunel homeserver แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                           |
| `qa telegram`                                       | live transport lane เทียบกับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                   |
| `qa discord`                                        | live transport lane เทียบกับ channel ใน Discord guild ส่วนตัวจริง                                                                                                                            |
| `qa slack`                                          | live transport lane เทียบกับ channel Slack ส่วนตัวจริง                                                                                                                                    |
| `qa mantis`                                         | runner ยืนยันก่อนและหลังสำหรับบั๊ก live transport พร้อมหลักฐาน status-reactions ของ Discord, desktop/browser smoke ของ Crabbox และ Slack-in-VNC smoke ดู [Mantis](/th/concepts/mantis) |

## Flow ของผู้ปฏิบัติงาน

flow ของผู้ปฏิบัติงาน QA ปัจจุบันคือ QA site แบบสอง pane:

- ซ้าย: Gateway dashboard (Control UI) พร้อม agent
- ขวา: QA Lab แสดง transcript แบบ Slack-ish และ scenario plan

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้าง QA site, เริ่ม gateway lane ที่สำรองด้วย Docker และเปิดหน้า
QA Lab ที่ผู้ปฏิบัติงานหรือ automation loop สามารถมอบ QA
mission ให้ agent, สังเกตพฤติกรรม channel จริง และบันทึกว่าสิ่งใดทำงาน สำเร็จ ล้มเหลว หรือ
ยังถูกบล็อกอยู่

เพื่อให้ iterate QA Lab UI ในเครื่องได้เร็วขึ้นโดยไม่ต้องสร้าง Docker image ใหม่ทุกครั้ง
ให้เริ่มสแต็กด้วย QA Lab bundle ที่ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` ทำให้ Docker services ใช้ image ที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปใน container `qa-lab` ส่วน `qa:lab:watch`
สร้าง bundle นั้นใหม่เมื่อมีการเปลี่ยนแปลง และ browser จะ reload อัตโนมัติเมื่อ hash ของ asset QA Lab
เปลี่ยน

สำหรับ OpenTelemetry trace smoke ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ trace OTLP/HTTP ในเครื่อง, รัน scenario QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel` จากนั้น
decode protobuf spans ที่ส่งออกและ assert รูปทรงที่ critical ต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model call ต้องไม่ export `StreamAbandoned` ใน turn ที่สำเร็จ; raw diagnostic IDs และ
attribute `openclaw.content.*` ต้องไม่อยู่ใน trace คำสั่งจะเขียน
`otel-smoke-summary.json` ไว้ข้าง artifact ของ QA suite

Observability QA คงเป็น source-checkout เท่านั้น npm tarball จงใจละเว้น
QA Lab ดังนั้น lane release Docker package จะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน diagnostics
instrumentation

สำหรับ transport-real Matrix smoke lane ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

ข้อมูลอ้างอิง CLI ฉบับเต็ม, catalog ของ profile/scenario, env vars และ layout artifact สำหรับ lane นี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: คำสั่งจะ provision Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker, ลงทะเบียน user driver/SUT/observer ชั่วคราว, รัน Matrix Plugin จริงภายใน QA gateway ลูกที่ scoped กับ transport นั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown, summary JSON, artifact observed-events และ output log รวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับ smoke lane แบบ transport-real ของ Telegram, Discord และ Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

คำสั่งเหล่านี้ target channel จริงที่มีอยู่แล้วพร้อม bot สองตัว (driver + SUT) env vars ที่จำเป็น, รายการ scenario, output artifacts และ pool credential Convex มีเอกสารอยู่ใน [ข้อมูลอ้างอิง QA ของ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

สำหรับการรัน VM desktop ของ Slack แบบเต็มพร้อม VNC rescue ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้น lease เครื่อง desktop/browser ของ Crabbox, รัน Slack live lane
ภายใน VM, เปิด Slack Web ใน browser ของ VNC, capture desktop และ
copy `slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
กลับไปยัง directory artifact ของ Mantis เมื่อมี video capture ใช้ `--lease-id <cbx_...>` ซ้ำหลังจาก login เข้า Slack Web ด้วยตนเอง
ผ่าน VNC เมื่อใช้ `--gateway-setup` Mantis จะปล่อยให้ OpenClaw Slack
gateway แบบ persistent รันอยู่ภายใน VM บน port `38973`; หากไม่ใช้ flag นี้ คำสั่งจะรัน
Slack QA lane แบบ bot-to-bot ตามปกติและออกหลัง capture artifact

สำหรับงาน desktop แบบ agent/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` lease หรือ reuse เครื่อง desktop/browser ของ Crabbox, เริ่ม
`crabbox record --while`, ขับเคลื่อน browser ที่มองเห็นผ่าน
`visual-driver` แบบซ้อน, capture `visual-task.png`, รัน `openclaw infer image describe`
กับ screenshot เมื่อเลือก `--vision-mode image-describe` และ
เขียน `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` vision prompt จะขอ verdict JSON แบบมีโครงสร้าง
และผ่านก็ต่อเมื่อ model รายงานหลักฐานเชิงบวกที่มองเห็นได้; คำตอบเชิงลบที่เพียง quote target text จะไม่ผ่าน assertion
ใช้ `--vision-mode metadata` สำหรับ no-model smoke ที่พิสูจน์ desktop,
browser, screenshot และ video plumbing โดยไม่เรียก provider ที่เข้าใจภาพ
Recording เป็น artifact ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox record
ไม่มี `visual-task.mp4` ที่ไม่ว่าง งานจะล้มเหลวแม้ visual driver
ผ่านแล้วก็ตาม เมื่อ failure, Mantis จะคง lease ไว้สำหรับ VNC เว้นแต่งานนั้น
ผ่านไปแล้วและไม่ได้ตั้ง `--keep-lease`

ก่อนใช้ pooled live credentials ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจสอบ env ของ Convex broker, ตรวจสอบ endpoint settings และยืนยัน admin/list reachability เมื่อมี maintainer secret โดยรายงานเฉพาะสถานะ set/missing สำหรับ secrets

## ความครอบคลุม live transport

live transport lane ใช้ contract เดียวร่วมกันแทนที่แต่ละ lane จะประดิษฐ์รูปทรงรายการ scenario ของตัวเอง `qa-channel` คือ suite พฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้างและไม่ได้เป็นส่วนหนึ่งของ matrix ความครอบคลุม live transport

| เลน     | Canary | การกำกับด้วยการเมนชัน | บอตต่อบอต | การบล็อกด้วยรายการอนุญาต | การตอบกลับระดับบนสุด | กลับมาทำต่อหลังรีสตาร์ต | การติดตามผลในเธรด | การแยกเธรด | การสังเกตปฏิกิริยา | คำสั่งช่วยเหลือ | การลงทะเบียนคำสั่งเนทีฟ |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และ live transport ในอนาคตใช้เช็กลิสต์สัญญา transport ที่ชัดเจนร่วมกัน

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest Multipass ใหม่ ติดตั้ง dependencies สร้าง OpenClaw
ภายใน guest รัน `qa suite` จากนั้นคัดลอกรายงาน QA และ
สรุปตามปกติกลับไปยัง `.artifacts/qa-e2e/...` บน host
โดยใช้พฤติกรรมการเลือก scenario เดียวกับ `qa suite` บน host
การรัน suite บน host และ Multipass จะดำเนินการ scenario ที่เลือกหลายรายการแบบขนาน
โดยใช้ gateway worker ที่แยกกันเป็นค่าเริ่มต้น `qa-channel` มีค่า concurrency
เริ่มต้นเป็น 4 และจำกัดด้วยจำนวน scenario ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือใช้ `--concurrency 1` สำหรับการทำงานแบบอนุกรม
คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่มี exit code ที่บ่งชี้ความล้มเหลว
การรัน live จะส่งต่ออินพุต auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ
guest ได้แก่ provider key จาก env, เส้นทาง config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้ guest
เขียนกลับผ่าน workspace ที่เมานต์ไว้ได้

## อ้างอิง QA สำหรับ Telegram, Discord และ Slack

Matrix มี[หน้าเฉพาะ](/th/concepts/qa-matrix)เนื่องจากมีจำนวน scenario มากและมีการจัดเตรียม homeserver ที่ใช้ Docker รองรับ Telegram, Discord และ Slack มีขนาดเล็กกว่า คือมีเพียงไม่กี่ scenario ต่อรายการ ไม่มีระบบโปรไฟล์ และทดสอบกับ channel จริงที่มีอยู่แล้ว ดังนั้นอ้างอิงของรายการเหล่านี้จึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                                         | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | รันเฉพาะ scenario นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตได้ และ output log เส้นทางสัมพัทธ์จะ resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository root เมื่อเรียกจาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | id บัญชีชั่วคราวภายใน config ของ QA gateway                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (ค่า legacy `live-openai` ยังใช้งานได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                                | ref ของโมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                             | โหมดเร็วของ provider เมื่อรองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [พูล credential ของ Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                              | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

แต่ละเลนจะออกด้วยสถานะไม่เป็นศูนย์เมื่อ scenario ใดล้มเหลว `--allow-failures` จะเขียน artifacts โดยไม่ตั้ง exit code ที่บ่งชี้ความล้มเหลว

### QA สำหรับ Telegram

```bash
pnpm openclaw qa telegram
```

มุ่งเป้าไปที่กลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแยกกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram การสังเกตบอตต่อบอตจะทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ข้อความที่สังเกตได้ (ค่าเริ่มต้นจะปกปิด)

Scenarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Output artifacts:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตเห็นการตอบกลับของ SUT) เริ่มจาก canary
- `telegram-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA สำหรับ Discord

```bash
pnpm openclaw qa discord
```

มุ่งเป้าไปที่ channel ของ guild Discord ส่วนตัวจริงหนึ่งรายการที่มีบอตสองตัว: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Plugin Discord ที่ bundled ไว้ ตรวจสอบการจัดการการเมนชันใน channel, ว่าบอต SUT ได้ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว และ scenario หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับ id ผู้ใช้บอต SUT ที่ Discord ส่งกลับมา (ไม่เช่นนั้นเลนจะล้มเหลวอย่างรวดเร็ว)

ตัวเลือก:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ข้อความที่สังเกตได้

Scenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenario Mantis แบบ opt-in รันแยกเดี่ยวเพราะสลับ SUT ให้ตอบกลับใน guild แบบ always-on และ tool-only ด้วย `messages.statusReactions.enabled=true` จากนั้นจับ timeline ปฏิกิริยาจาก REST รวมถึง artifacts ภาพ HTML/PNG รายงานก่อน/หลังของ Mantis ยังเก็บ artifacts MP4 ที่ scenario ให้มาเป็น `baseline.mp4` และ `candidate.mp4`

รัน scenario ปฏิกิริยาสถานะของ Mantis อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Output artifacts:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อรัน scenario ปฏิกิริยาสถานะ

### QA สำหรับ Slack

```bash
pnpm openclaw qa slack
```

มุ่งเป้าไปที่ channel Slack ส่วนตัวจริงหนึ่งรายการที่มีบอตสองตัวแยกกัน: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Plugin Slack ที่ bundled ไว้

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ข้อความที่สังเกตได้

Scenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Output artifacts:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

#### การตั้งค่า workspace ของ Slack

เลนนี้ต้องใช้แอป Slack สองรายการแยกกันใน workspace เดียว พร้อม channel ที่บอตทั้งสองเป็นสมาชิก:

- `channelId` — id `Cxxxxxxxxxx` ของ channel ที่บอตทั้งสองได้รับเชิญแล้ว ใช้ channel เฉพาะ เพราะเลนนี้จะโพสต์ทุกครั้งที่รัน
- `driverBotToken` — โทเค็นบอต (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` — โทเค็นบอต (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกจาก driver เพื่อให้ id ผู้ใช้บอตของมันแตกต่างกัน
- `sutAppToken` — โทเค็นระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับ events ได้

ควรใช้ workspace Slack ที่ทุ่มเทให้ QA โดยเฉพาะแทนการใช้ workspace production ซ้ำ

manifest ของ SUT ด้านล่างสะท้อนการติดตั้ง production ของ Plugin Slack ที่ bundled ไว้ (`extensions/slack/src/setup-shared.ts:10`) สำหรับการตั้งค่า channel production ตามที่ผู้ใช้เห็น โปรดดู [การตั้งค่า channel Slack อย่างรวดเร็ว](/th/channels/slack#quick-setup); คู่ QA Driver/SUT แยกออกมาตั้งใจเพราะเลนนี้ต้องการ id ผู้ใช้บอตสองรายการแยกกันใน workspace เดียว

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) — ค่านี้จะกลายเป็น `driverBotToken` driver ต้องการเพียงโพสต์ข้อความและระบุตัวเอง ไม่ต้องมี events และไม่ต้องใช้ Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _Create New App → From a manifest_ ใน workspace เดียวกัน ชุด scope สะท้อนการติดตั้ง production ของ Plugin Slack ที่ bundled ไว้ (`extensions/slack/src/setup-shared.ts:10`):

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

หลังจาก Slack สร้างแอปแล้ว ให้ทำสองอย่างในหน้าการตั้งค่าของแอป:

- _Install to Workspace_ → คัดลอก _Bot User OAuth Token_ → ค่านั้นจะเป็น `sutBotToken`
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → เพิ่มขอบเขต `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านั้นจะเป็น `sutAppToken`

ตรวจสอบว่าบอตทั้งสองมีรหัสผู้ใช้ที่แตกต่างกันโดยเรียก `auth.test` กับแต่ละโทเค็น รันไทม์แยกไดรเวอร์กับ SUT ด้วยรหัสผู้ใช้ การใช้แอปเดียวซ้ำสำหรับทั้งสองฝั่งจะทำให้การกั้นตามการกล่าวถึงล้มเหลวทันที

**3. สร้างช่อง**

ในเวิร์กสเปซ QA ให้สร้างช่องหนึ่งช่อง (เช่น `#openclaw-qa`) แล้วเชิญบอตทั้งสองจากภายในช่อง:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอกรหัส `Cxxxxxxxxxx` จาก _channel info → About → Channel ID_ — ค่านั้นจะเป็น `channelId` ช่องสาธารณะใช้งานได้ หากใช้ช่องส่วนตัว ทั้งสองแอปมี `groups:history` อยู่แล้ว ดังนั้นการอ่านประวัติของ harness จะยังสำเร็จ

**4. ลงทะเบียนข้อมูลรับรอง**

มีสองตัวเลือก ใช้ env vars สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัว แล้วส่ง `--credential-source env`) หรือ seed พูล Convex ที่ใช้ร่วมกันเพื่อให้ CI และผู้ดูแลคนอื่นเช่าใช้งานได้

สำหรับพูล Convex ให้เขียนฟิลด์ทั้งสี่ลงในไฟล์ JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

เมื่อ export `OPENCLAW_QA_CONVEX_SITE_URL` และ `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ในเชลล์แล้ว ให้ลงทะเบียนและตรวจสอบ:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

ควรได้ `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบแบบครบวงจร**

รัน lane ภายในเครื่องเพื่อยืนยันว่าบอตทั้งสองคุยกันผ่านโบรกเกอร์ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านจะเสร็จภายในไม่ถึง 30 วินาที และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` ที่สถานะ `pass` หาก lane ค้างประมาณ 90 วินาทีแล้วออกด้วย `Convex credential pool exhausted for kind "slack"` แสดงว่าพูลว่างหรือทุกแถวถูกเช่าอยู่ — `qa credentials list --kind slack --status all --json` จะบอกได้ว่าเป็นกรณีใด

### พูลข้อมูลรับรอง Convex

lane ของ Telegram, Discord และ Slack สามารถเช่าข้อมูลรับรองจากพูล Convex ที่ใช้ร่วมกัน แทนการอ่าน env vars ข้างต้นได้ ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะรับ lease แบบเอกสิทธิ์ ส่ง Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดระบบ ชนิดของพูลคือ `"telegram"`, `"discord"` และ `"slack"`

รูปทรง payload ที่โบรกเกอร์ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็นสตริงรหัสแชตแบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` ต้องตรงกับ `^[A-Z][A-Z0-9]+$` (รหัส Slack เช่น `Cxxxxxxxxxx`) ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและขอบเขต

env vars สำหรับงานปฏิบัติการและสัญญา endpoint ของโบรกเกอร์ Convex อยู่ใน [การทดสอบ → ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มีมาก่อนการรองรับ Discord; ความหมายของโบรกเกอร์เหมือนกันสำหรับทั้งสองชนิด)

## seed ที่อิงกับ repo

แอสเซต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ไฟล์เหล่านี้ตั้งใจให้อยู่ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ agent

`qa-lab` ควรคงเป็นตัวรัน Markdown ทั่วไป ไฟล์ Markdown ของแต่ละสถานการณ์เป็นแหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของสถานการณ์
- metadata ของหมวดหมู่ ความสามารถ lane และความเสี่ยงที่ไม่บังคับ
- อ้างอิงเอกสารและโค้ด
- ข้อกำหนด Plugin ที่ไม่บังคับ
- แพตช์การกำหนดค่า Gateway ที่ไม่บังคับ
- `qa-flow` ที่เรียกใช้งานได้

พื้นผิวรันไทม์ที่ใช้ซ้ำซึ่งรองรับ `qa-flow` สามารถคงความเป็นทั่วไปและครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ Markdown สามารถรวม helper ฝั่งขนส่งเข้ากับ helper ฝั่งเบราว์เซอร์ที่ควบคุม Control UI แบบฝังผ่าน seam `browser.request` ของ Gateway โดยไม่ต้องเพิ่มตัวรันกรณีพิเศษ

ควรจัดกลุ่มไฟล์สถานการณ์ตามความสามารถของผลิตภัณฑ์แทนโฟลเดอร์ใน source tree รักษา ID ของสถานการณ์ให้เสถียรเมื่อย้ายไฟล์ ใช้ `docsRefs` และ `codeRefs` เพื่อการติดตามย้อนกลับถึงการนำไปใช้

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และช่อง
- พฤติกรรมของเธรด
- lifecycle ของการกระทำกับข้อความ
- callback ของ Cron
- การเรียกคืนหน่วยความจำ
- การสลับโมเดล
- การส่งต่อให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## lane mock ของ provider

`qa suite` มี lane mock ของ provider ภายในเครื่องสอง lane:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ ยังคงเป็น lane mock แบบ deterministic เริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gate
- `aimock` เริ่มเซิร์ฟเวอร์ provider ที่ใช้ AIMock สำหรับการครอบคลุมโปรโตคอลทดลอง fixture การบันทึก/เล่นซ้ำ และ chaos เป็นส่วนเพิ่ม และไม่ได้แทนที่ dispatcher สถานการณ์ `mock-openai`

การนำ provider-lane ไปใช้อยู่ภายใต้ `extensions/qa-lab/src/providers/` provider แต่ละตัวเป็นเจ้าของค่าเริ่มต้น การเริ่มเซิร์ฟเวอร์ภายในเครื่อง การกำหนดค่าโมเดล Gateway ความต้องการ staging ของ auth-profile และแฟล็กความสามารถ live/mock โค้ด suite และ Gateway ที่ใช้ร่วมกันควร route ผ่าน registry ของ provider แทนการแตกแขนงตามชื่อ provider

## adapter ขนส่ง

`qa-lab` เป็นเจ้าของ seam ขนส่งทั่วไปสำหรับสถานการณ์ QA แบบ Markdown `qa-channel` เป็น adapter แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: ช่องจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับตัวรัน suite เดียวกัน แทนการเพิ่มตัวรัน QA เฉพาะขนส่ง

ในระดับสถาปัตยกรรม การแยกคือ:

- `qa-lab` เป็นเจ้าของการดำเนินสถานการณ์ทั่วไป concurrency ของ worker การเขียน artifact และการรายงาน
- adapter ขนส่งเป็นเจ้าของการกำหนดค่า Gateway ความพร้อม การสังเกต inbound และ outbound การกระทำขนส่ง และสถานะขนส่งที่ทำให้เป็นรูปแบบปกติแล้ว
- ไฟล์สถานการณ์ Markdown ภายใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิวรันไทม์ที่ใช้ซ้ำซึ่งเรียกใช้งานไฟล์เหล่านั้น

### การเพิ่มช่อง

การเพิ่มช่องเข้าในระบบ QA แบบ Markdown ต้องมีสองอย่างพอดี:

1. adapter ขนส่งสำหรับช่อง
2. pack สถานการณ์ที่ทดสอบสัญญาของช่อง

อย่าเพิ่ม root คำสั่ง QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มและ teardown ของ suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินสถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Plugin ตัวรันเป็นเจ้าของสัญญาขนส่ง:

- วิธี mount `openclaw qa <runner>` ไว้ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า Gateway สำหรับขนส่งนั้น
- วิธีตรวจสอบความพร้อม
- วิธี inject เหตุการณ์ inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และสถานะขนส่งที่ทำให้เป็นรูปแบบปกติแล้ว
- วิธีดำเนินการกระทำที่รองรับด้วยขนส่ง
- วิธีจัดการ reset หรือ cleanup เฉพาะขนส่ง

เกณฑ์ขั้นต่ำสำหรับการรับช่องใหม่:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. นำตัวรันขนส่งไปใช้บน seam host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะขนส่งไว้ภายใน Plugin ตัวรันหรือ harness ของช่อง
4. Mount ตัวรันเป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน Plugin ตัวรันควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาอยู่เสมอ; CLI แบบ lazy และการดำเนินตัวรันควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ Markdown ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ helper สถานการณ์ทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias ความเข้ากันได้เดิมให้ทำงาน เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับขนส่งของช่องหนึ่ง ให้เก็บไว้ใน Plugin ตัวรันหรือ harness ของ Plugin นั้น
- หากสถานการณ์ต้องการความสามารถใหม่ที่มากกว่าหนึ่งช่องใช้ได้ ให้เพิ่ม helper ทั่วไปแทนการแตกแขนงเฉพาะช่องใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับขนส่งหนึ่ง ให้คงสถานการณ์เป็นแบบเฉพาะขนส่งและระบุให้ชัดเจนในสัญญาสถานการณ์

### ชื่อ helper ของสถานการณ์

helper ทั่วไปที่แนะนำสำหรับสถานการณ์ใหม่:

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

alias ความเข้ากันได้ยังคงพร้อมใช้งานสำหรับสถานการณ์เดิม — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อทั่วไป alias เหล่านี้มีไว้เพื่อหลีกเลี่ยง migration แบบเปลี่ยนพร้อมกันทั้งหมด ไม่ใช่เป็นโมเดลสำหรับอนาคต

## การรายงาน

`qa-lab` export รายงานโปรโตคอล Markdown จาก timeline ของ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อก
- สถานการณ์ติดตามผลใดควรค่าแก่การเพิ่ม

สำหรับ inventory ของสถานการณ์ที่มีอยู่ — มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือ wiring ขนส่งใหม่ — ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)

สำหรับการตรวจอักขระและสไตล์ ให้รันสถานการณ์เดียวกันกับ ref โมเดล live หลายตัว แล้วเขียนรายงาน Markdown ที่ตัดสินผลแล้ว:

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

คำสั่งนี้รันกระบวนการลูกของ QA Gateway ภายในเครื่อง ไม่ใช่ Docker สถานการณ์การประเมินคาแรกเตอร์ควรกำหนด persona ผ่าน `SOUL.md` แล้วจึงรันรอบผู้ใช้ตามปกติ เช่น แชต ความช่วยเหลือเกี่ยวกับพื้นที่ทำงาน และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลผู้สมัครว่ากำลังถูกประเมิน คำสั่งนี้จะเก็บ transcript ฉบับเต็มแต่ละรายการ บันทึกสถิติพื้นฐานของการรัน จากนั้นถามโมเดลผู้ตัดสินในโหมดเร็วพร้อมการให้เหตุผล `xhigh` ในที่ที่รองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: พรอมป์ผู้ตัดสินยังคงได้รับ transcript และสถานะการรันทั้งหมด แต่ refs ของผู้สมัครจะถูกแทนที่ด้วยป้ายกำกับที่เป็นกลาง เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง refs จริงหลังจากแยกวิเคราะห์
การรันผู้สมัครมีค่าเริ่มต้นเป็นการคิดระดับ `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh` สำหรับ refs การประเมิน OpenAI รุ่นเก่าที่รองรับ แทนที่ค่าสำหรับผู้สมัครเฉพาะรายแบบ inline ด้วย `--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงตั้ง fallback ส่วนกลาง และรูปแบบเดิม `--model-thinking <provider/model=level>` ยังคงเก็บไว้เพื่อความเข้ากันได้
refs ผู้สมัครของ OpenAI ใช้โหมดเร็วเป็นค่าเริ่มต้น เพื่อให้ใช้การประมวลผลแบบมีลำดับความสำคัญในที่ที่ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อผู้สมัครหรือผู้ตัดสินรายเดียวต้องการค่าแทนที่ ส่ง `--fast` เฉพาะเมื่อคุณต้องการบังคับเปิดโหมดเร็วสำหรับโมเดลผู้สมัครทุกตัว ระยะเวลาของผู้สมัครและผู้ตัดสินจะถูกบันทึกในรายงานสำหรับการวิเคราะห์ benchmark แต่พรอมป์ผู้ตัดสินระบุอย่างชัดเจนว่าไม่ให้จัดอันดับตามความเร็ว
การรันโมเดลผู้สมัครและผู้ตัดสินต่างมีค่า concurrency เริ่มต้นเป็น 16 ลด `--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดของผู้ให้บริการหรือแรงกดดันต่อ Gateway ภายในเครื่องทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่ได้ส่ง `--model` ของผู้สมัคร การประเมินคาแรกเตอร์จะใช้ค่าเริ่มต้นเป็น `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` และ `google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` ผู้ตัดสินจะใช้ค่าเริ่มต้นเป็น `openai/gpt-5.5,thinking=xhigh,fast` และ `anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Matrix QA](/th/concepts/qa-matrix)
- [QA Channel](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
