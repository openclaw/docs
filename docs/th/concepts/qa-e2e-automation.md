---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA เชื่อมโยงกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การขนส่ง
    - การเพิ่มสถานการณ์ QA ที่อิงกับรีโป
    - การสร้างระบบอัตโนมัติด้านการประกันคุณภาพที่สมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิง repo, ช่องทางการขนส่งแบบ live, อะแดปเตอร์การขนส่ง และการรายงาน.'
title: ภาพรวมการประกันคุณภาพ
x-i18n:
    generated_at: "2026-05-04T02:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแตก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงและมีลักษณะเหมือนช่องทางมากกว่าที่ unit test เดี่ยวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, ช่องทาง, เธรด,
  รีแอ็กชัน, การแก้ไข และการลบ
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกต transcript,
  แทรกข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin ตัวรันเนอร์ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับช่องทางจริงภายใน Gateway QA ย่อย
- `qa/`: แอสเซต seed ที่รองรับโดยรีโปสำหรับงาน kickoff และสถานการณ์ QA
  baseline
- [Mantis](/th/concepts/mantis): การตรวจสอบแบบ live ก่อนและหลังสำหรับบั๊กที่
  ต้องใช้ transport จริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่บันเดิลมา; เขียนรายงาน Markdown                                                                                                                          |
| `qa suite`                                          | รันสถานการณ์ที่รองรับโดยรีโปกับเลน Gateway QA Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                    |
| `qa coverage`                                       | พิมพ์ inventory ความครอบคลุมของสถานการณ์ใน markdown (`--json` สำหรับเอาต์พุตสำหรับเครื่อง)                                                                                             |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic                                                                                            |
| `qa character-eval`                                 | รันสถานการณ์ QA ด้านคาแรกเตอร์กับโมเดล live หลายตัวพร้อมรายงานที่มีการตัดสิน ดู [การรายงาน](#reporting)                                                              |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                            |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ภายในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                      |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่ prebake ไว้                                                                                                                                       |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                      |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแตกที่รองรับด้วย Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; variant `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)    |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                    |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รู้จักสถานการณ์                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูล credential Convex ที่ใช้ร่วมกัน                                                                                                                                 |
| `qa matrix`                                         | เลน transport live กับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                        |
| `qa telegram`                                       | เลน transport live กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                |
| `qa discord`                                        | เลน transport live กับช่อง guild Discord ส่วนตัวจริง                                                                                                         |
| `qa slack`                                          | เลน transport live กับช่อง Slack ส่วนตัวจริง                                                                                                                 |
| `qa mantis`                                         | ตัวรันตรวจสอบก่อนและหลังสำหรับบั๊ก transport live พร้อมหลักฐาน status-reactions ของ Discord และ smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox ดู [Mantis](/th/concepts/mantis) |

## โฟลว์ผู้ปฏิบัติการ

โฟลว์ผู้ปฏิบัติการ QA ปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดง transcript แบบคล้าย Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนั้นสร้างไซต์ QA, เริ่มเลน Gateway ที่รองรับด้วย Docker และเปิดหน้า
QA Lab ซึ่งผู้ปฏิบัติการหรือ automation loop สามารถให้ภารกิจ QA กับ agent,
สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือยังถูกบล็อก

สำหรับการวนปรับ UI ของ QA Lab ภายในเครื่องให้เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง,
ให้เริ่มสแตกด้วยบันเดิล QA Lab แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าในคอนเทนเนอร์ `qa-lab` ส่วน `qa:lab:watch`
จะสร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะ reload อัตโนมัติเมื่อ hash แอสเซต QA Lab
เปลี่ยนไป

สำหรับ smoke trace OpenTelemetry ภายในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ trace OTLP/HTTP ภายในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel` จากนั้น
decode protobuf spans ที่ export แล้วตรวจยืนยันรูปร่างที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
การเรียกโมเดลต้องไม่ export `StreamAbandoned` ในเทิร์นที่สำเร็จ; raw diagnostic IDs และ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace โดยเขียน
`otel-smoke-summary.json` ไว้ถัดจาก artifacts ของ QA suite

Observability QA ใช้ได้เฉพาะจาก source checkout เท่านั้น npm tarball จงใจละเว้น
QA Lab ดังนั้นเลน Docker release ของแพ็กเกจจึงไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน instrumentation
ด้าน diagnostics

สำหรับเลน smoke Matrix ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

เอกสารอ้างอิง CLI ฉบับเต็ม, แคตตาล็อก profile/scenario, env vars และเลย์เอาต์ artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: มัน provision homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Plugin Matrix จริงภายใน Gateway QA ย่อยที่ scope กับ transport นั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown, สรุป JSON, artifact observed-events และ log เอาต์พุตรวมภายใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับเลน smoke Telegram, Discord และ Slack ที่ใช้ transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

เลนเหล่านี้เล็งไปที่ช่องทางจริงที่มีอยู่แล้วพร้อมบอตสองตัว (driver + SUT) env vars ที่จำเป็น, รายการสถานการณ์, output artifacts และพูล credential Convex มีเอกสารอยู่ใน [เอกสารอ้างอิง QA สำหรับ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

ก่อนใช้ credential live แบบ pooled ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจ env ของ broker Convex, ตรวจสอบการตั้งค่า endpoint และตรวจยืนยันว่าเข้าถึง admin/list ได้เมื่อมี secret ของ maintainer อยู่ โดยรายงานเฉพาะสถานะตั้งค่าแล้ว/ขาดหายสำหรับ secrets

## ความครอบคลุม transport live

เลน transport live ใช้ contract เดียวร่วมกันแทนที่แต่ละเลนจะประดิษฐ์รูปร่างรายการสถานการณ์ของตัวเอง `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้างและไม่เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุม transport live

| เลน     | Canary | Mention gating | Bot-to-bot | บล็อก allowlist | การตอบกลับระดับบนสุด | กลับมาทำต่อหลัง restart | follow-up ของเธรด | การแยกเธรด | การสังเกตรีแอ็กชัน | คำสั่งช่วยเหลือ | การลงทะเบียนคำสั่ง native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

สิ่งนี้คง `qa-channel` ไว้เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และ transport live ในอนาคตใช้ checklist transport-contract ที่ชัดเจนร่วมกัน

สำหรับเลน Linux VM แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต guest Multipass ใหม่, ติดตั้ง dependency, build OpenClaw
ภายใน guest, รัน `qa suite` จากนั้นคัดลอกรายงาน QA และ
สรุปปกติกลับเข้า `.artifacts/qa-e2e/...` บน host
มันใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บน host
การรัน suite บน host และ Multipass จะ execute สถานการณ์ที่เลือกหลายรายการพร้อมกัน
ด้วย worker Gateway ที่แยกกันโดยค่าเริ่มต้น `qa-channel` ค่าเริ่มต้น concurrency
คือ 4 โดยถูก cap ตามจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการ execute แบบ serial
คำสั่งจะ exit ด้วยค่าไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่มี exit code ที่ล้มเหลว
การรัน live จะส่งต่ออินพุต auth ของ QA ที่รองรับและใช้ได้จริงสำหรับ
guest: provider keys ผ่าน env, path คอนฟิก QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ คง `--output-dir` ไว้ภายใต้ root ของรีโปเพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount ไว้ได้

## เอกสารอ้างอิง QA สำหรับ Telegram, Discord และ Slack

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากจำนวนสถานการณ์และการ provision homeserver ที่รองรับด้วย Docker Telegram, Discord และ Slack มีขนาดเล็กกว่า — มีสถานการณ์ไม่กี่รายการต่อแต่ละตัว, ไม่มีระบบ profile, ทำงานกับช่องทางจริงที่มีอยู่แล้ว — ดังนั้นเอกสารอ้างอิงของพวกมันจึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                                         | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | เรียกใช้เฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตได้ และบันทึกเอาต์พุต พาธสัมพัทธ์จะอิงจาก `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | รากของ repository เมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | ID บัญชีชั่วคราวภายในคอนฟิก Gateway ของ QA                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (`live-openai` แบบเดิมยังใช้งานได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของผู้ให้บริการ                                                | การอ้างอิงโมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                             | โหมดเร็วของผู้ให้บริการเมื่อรองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [กลุ่มข้อมูลประจำตัว Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                              | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

แต่ละ lane จะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียน artifacts โดยไม่ตั้งค่า exit code เป็นล้มเหลว

### QA ของ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอทแตกต่างกันสองตัว (driver + SUT) บอท SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอทถึงบอททำงานได้ดีที่สุดเมื่อบอททั้งสองเปิดใช้ **โหมดการสื่อสารแบบบอทถึงบอท** ใน `@BotFather`

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ของข้อความที่สังเกตได้ (ค่าเริ่มต้นจะปกปิด)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artifacts เอาต์พุต:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตเห็น SUT ตอบกลับ) โดยเริ่มจาก canary
- `telegram-qa-observed-messages.json` — เนื้อหาถูกปกปิด เว้นแต่ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA ของ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปยังช่อง guild ส่วนตัวจริงหนึ่งช่องใน Discord ด้วยบอทสองตัว: บอท driver ที่ควบคุมโดย harness และบอท SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Discord ที่ bundled มา ตรวจสอบการจัดการการกล่าวถึงช่อง, การที่บอท SUT ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว, และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับ ID ผู้ใช้ของบอท SUT ที่ Discord ส่งคืน (มิฉะนั้น lane จะล้มเหลวอย่างรวดเร็ว)

ตัวเลือกเสริม:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ของข้อความที่สังเกตได้

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — สถานการณ์ Mantis แบบ opt-in ทำงานด้วยตัวเองเพราะจะสลับ SUT ให้ตอบกลับ guild แบบเปิดตลอดเวลาและใช้เฉพาะเครื่องมือด้วย `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์ reaction ผ่าน REST พร้อม artifact ภาพ HTML/PNG

เรียกใช้สถานการณ์ status-reaction ของ Mantis อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artifacts เอาต์พุต:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — เนื้อหาถูกปกปิด เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์ status-reaction ทำงาน

### QA ของ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายไปยังช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอทแตกต่างกันสองตัว: บอท driver ที่ควบคุมโดย harness และบอท SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Slack ที่ bundled มา

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน artifacts ของข้อความที่สังเกตได้

สถานการณ์ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artifacts เอาต์พุต:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — เนื้อหาถูกปกปิด เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

### กลุ่มข้อมูลประจำตัว Convex

lane ของ Telegram, Discord, และ Slack สามารถเช่าข้อมูลประจำตัวจากกลุ่ม Convex ที่ใช้ร่วมกันแทนการอ่าน env vars ข้างต้นได้ ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอ lease แบบเอกสิทธิ์ ส่ง Heartbeat ตลอดช่วงเวลาการรัน และปล่อย lease เมื่อปิดระบบ ชนิดของกลุ่มคือ `"telegram"`, `"discord"`, และ `"slack"`

รูปแบบ payload ที่ broker ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`

env vars สำหรับปฏิบัติการและสัญญา endpoint ของ broker Convex อยู่ใน [การทดสอบ → ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มีมาก่อนการรองรับ Discord; ความหมายของ broker เหมือนกันสำหรับทั้งสองชนิด)

## Seeds ที่อิงจาก repo

Seed assets อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจให้อยู่ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรยังคงเป็น runner markdown ทั่วไป ไฟล์ markdown ของแต่ละสถานการณ์คือ
แหล่งความจริงสำหรับการทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของสถานการณ์
- metadata หมวดหมู่, capability, lane, และความเสี่ยงแบบเลือกได้
- refs ของเอกสารและโค้ด
- ข้อกำหนด Plugin แบบเลือกได้
- patch คอนฟิก Gateway แบบเลือกได้
- `qa-flow` ที่เรียกใช้ได้

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` สามารถคงความทั่วไป
และข้ามหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ markdown สามารถรวม helper ฝั่ง transport
กับ helper ฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน
seam `browser.request` ของ Gateway ได้โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ควรจัดกลุ่มไฟล์สถานการณ์ตาม capability ของผลิตภัณฑ์แทนที่จะตามโฟลเดอร์ source tree
ให้ ID สถานการณ์คงที่เมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อให้ตามรอยการ implement ได้

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และช่อง
- พฤติกรรมของ thread
- lifecycle ของ message action
- callbacks ของ cron
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่อให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## Lane mock ของผู้ให้บริการ

`qa suite` มี lane mock ผู้ให้บริการแบบ local สอง lane:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ มันยังคงเป็น lane mock แบบกำหนดแน่นอนค่าเริ่มต้นสำหรับ QA ที่อิงจาก repo และ parity gates
- `aimock` เริ่ม server ผู้ให้บริการที่อิงจาก AIMock สำหรับความครอบคลุมของ protocol, fixture, record/replay, และ chaos เชิงทดลอง เป็นส่วนเสริมและไม่แทนที่ dispatcher สถานการณ์ `mock-openai`

การ implement provider-lane อยู่ใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้น, การเริ่ม server local, คอนฟิกโมเดล Gateway,
ความต้องการ staging ของ auth-profile, และ flag capability แบบ live/mock โค้ด suite และ
Gateway ที่ใช้ร่วมกันควร route ผ่าน provider registry แทนการ branch ตาม
ชื่อผู้ให้บริการ

## Transport adapters

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับสถานการณ์ QA แบบ markdown `qa-channel` คือ adapter ตัวแรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: channel จริงหรือสังเคราะห์ในอนาคตควร plug into suite runner เดียวกันแทนการเพิ่ม runner QA เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการดำเนินการสถานการณ์ทั่วไป, concurrency ของ worker, การเขียน artifact, และการรายงาน
- transport adapter เป็นเจ้าของคอนฟิก Gateway, readiness, การสังเกต inbound และ outbound, transport actions, และสถานะ transport ที่ normalize แล้ว
- ไฟล์สถานการณ์ markdown ใต้ `qa/scenarios/` กำหนดการทดสอบ; `qa-lab` ให้พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งเรียกใช้ไฟล์เหล่านั้น

### การเพิ่ม channel

การเพิ่ม channel ให้ระบบ QA แบบ markdown ต้องมีสองสิ่งเท่านั้น:

1. transport adapter สำหรับ channel
2. scenario pack ที่ทดสอบสัญญา channel

อย่าเพิ่มรากคำสั่ง QA ระดับบนใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- รากคำสั่ง `openclaw qa`
- การเริ่มและ teardown ของ suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินการสถานการณ์
- alias เพื่อ compatibility สำหรับสถานการณ์ `qa-channel` เก่า

Runner plugins เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ราก `qa` ที่ใช้ร่วมกัน
- วิธีคอนฟิก Gateway สำหรับ transport นั้น
- วิธีตรวจ readiness
- วิธี inject เหตุการณ์ inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcripts และสถานะ transport ที่ normalize แล้ว
- วิธีดำเนินการ actions ที่อิงจาก transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการนำ channel ใหม่มาใช้:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. นำ transport runner ไปใช้งานบนจุดเชื่อมของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ใน Plugin ของ runner หรือ harness ของ channel
4. เมานต์ runner เป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่ง root ที่แข่งขันกัน Plugin ของ runner ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และส่งออกอาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ทำให้ `runtime-api.ts` เบาไว้; การทำงานของ CLI และ runner แบบ lazy ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ markdown ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ helper สถานการณ์แบบทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias สำหรับความเข้ากันได้เดิมให้ใช้งานได้ต่อไป เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- ถ้าพฤติกรรมสามารถอธิบายได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- ถ้าพฤติกรรมขึ้นกับ channel transport หนึ่งรายการ ให้เก็บไว้ใน Plugin ของ runner หรือ harness ของ Plugin นั้น
- ถ้าสถานการณ์ต้องการความสามารถใหม่ที่มากกว่าหนึ่ง channel ใช้ได้ ให้เพิ่ม helper แบบทั่วไปแทน branch เฉพาะ channel ใน `suite.ts`
- ถ้าพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้สถานการณ์เป็นแบบเฉพาะ transport และระบุเรื่องนั้นให้ชัดเจนในสัญญาของสถานการณ์

### ชื่อ helper ของสถานการณ์

helper แบบทั่วไปที่แนะนำสำหรับสถานการณ์ใหม่:

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

alias สำหรับความเข้ากันได้ยังคงมีให้ใช้สำหรับสถานการณ์เดิม — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อแบบทั่วไป alias เหล่านี้มีไว้เพื่อหลีกเลี่ยงการ migration แบบบังคับพร้อมกันทั้งหมด ไม่ใช่โมเดลสำหรับอนาคต

## การรายงาน

`qa-lab` ส่งออกรายงานโปรโตคอล Markdown จากไทม์ไลน์ของ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อกอยู่
- สถานการณ์ติดตามผลใดควรเพิ่ม

สำหรับรายการสถานการณ์ที่มีอยู่ — ซึ่งมีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อมต่อ transport ใหม่ — ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)

สำหรับการตรวจสอบลักษณะตัวละครและสไตล์ ให้รันสถานการณ์เดียวกันกับ ref ของโมเดล live หลายรายการ
แล้วเขียนรายงาน Markdown ที่ผ่านการตัดสิน:

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

คำสั่งนี้รันโปรเซสลูกของ QA gateway ในเครื่อง ไม่ใช่ Docker สถานการณ์ character eval
ควรกำหนด persona ผ่าน `SOUL.md` จากนั้นรัน turn ผู้ใช้ตามปกติ
เช่น chat, ความช่วยเหลือใน workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลผู้สมัคร
ว่ากำลังถูกประเมิน คำสั่งจะเก็บ transcript ฉบับเต็มแต่ละรายการ
บันทึกสถิติพื้นฐานของการรัน จากนั้นถามโมเดลผู้ตัดสินในโหมด fast พร้อมการให้เหตุผล
`xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: prompt ของผู้ตัดสินยังคงได้รับ
transcript และสถานะการรันทุกอย่าง แต่ ref ของผู้สมัครจะถูกแทนที่ด้วย
ป้ายกำกับกลาง เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง ref จริงหลังจาก
parse แล้ว
การรันผู้สมัครมีค่าเริ่มต้นเป็น thinking `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ ref eval ของ OpenAI รุ่นเก่าที่รองรับ กำหนดทับผู้สมัครเฉพาะรายแบบ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้งค่า
fallback ส่วนกลาง และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังคง
เก็บไว้เพื่อความเข้ากันได้
ref ผู้สมัครของ OpenAI มีค่าเริ่มต้นเป็นโหมด fast เพื่อให้ใช้ priority processing ในจุดที่
ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
ผู้สมัครหรือผู้ตัดสินรายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast สำหรับโมเดลผู้สมัครทุกตัว ระยะเวลาของผู้สมัครและผู้ตัดสินจะ
ถูกบันทึกในรายงานสำหรับการวิเคราะห์ benchmark แต่ prompt ของผู้ตัดสินระบุอย่างชัดเจน
ว่าอย่าจัดอันดับตามความเร็ว
การรันโมเดลผู้สมัครและผู้ตัดสินมีค่า concurrency เริ่มต้นเป็น 16 ทั้งคู่ ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดของผู้ให้บริการหรือแรงกดบน gateway
ในเครื่องทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่ได้ส่ง `--model` ของผู้สมัคร character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` ผู้ตัดสินจะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [QA แบบเมทริกซ์](/th/concepts/qa-matrix)
- [QA Channel](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
