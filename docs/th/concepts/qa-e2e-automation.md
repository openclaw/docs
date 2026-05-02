---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การส่งผ่าน
    - การเพิ่มสถานการณ์การประกันคุณภาพที่อิงจากคลังเก็บโค้ด
    - การสร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิงคลังโค้ด, เลนการส่งผ่านแบบใช้งานจริง, อะแดปเตอร์การส่งผ่าน และการรายงาน.'
title: ภาพรวมการประกันคุณภาพ
x-i18n:
    generated_at: "2026-05-02T20:43:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแตก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงกว่าและมีลักษณะเหมือนช่องทางมากกว่าที่ unit test เพียงตัวเดียวทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, ช่องทาง, เธรด,
  reaction, การแก้ไข และการลบ
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์,
  แทรกข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin ตัวรันในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับช่องทางจริงภายใน Gateway QA ลูก
- `qa/`: แอสเซ็ตตั้งต้นที่รองรับด้วย repo สำหรับงาน kickoff และสถานการณ์ QA
  baseline

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่รวมมาให้; เขียนรายงาน Markdown                                                                                                                       |
| `qa suite`                                          | เรียกใช้สถานการณ์ที่รองรับด้วย repo กับเลน Gateway QA Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                 |
| `qa coverage`                                       | พิมพ์ inventory ความครอบคลุมสถานการณ์แบบ markdown (`--json` สำหรับเอาต์พุตสำหรับเครื่อง)                                                                                          |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic                                                                                         |
| `qa character-eval`                                 | เรียกใช้สถานการณ์ character QA ข้ามหลายโมเดล live พร้อมรายงานที่มีการตัดสิน ดู [การรายงาน](#reporting)                                                           |
| `qa manual`                                         | เรียกใช้พรอมป์แบบครั้งเดียวกับเลน provider/model ที่เลือกไว้                                                                                                         |
| `qa ui`                                             | เริ่ม QA debugger UI และบัส QA ภายในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                   |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่เตรียมไว้ล่วงหน้า                                                                                                                                    |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                   |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแตกที่รองรับด้วย Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`) |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                 |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูลข้อมูลประจำตัว Convex ที่ใช้ร่วมกัน                                                                                                                              |
| `qa matrix`                                         | เลน live transport กับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                     |
| `qa telegram`                                       | เลน live transport กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                             |
| `qa discord`                                        | เลน live transport กับช่อง guild Discord ส่วนตัวจริง                                                                                                      |

## โฟลว์ผู้ปฏิบัติงาน

โฟลว์ผู้ปฏิบัติงาน QA ปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดงทรานสคริปต์ลักษณะคล้าย Slack และแผนสถานการณ์

เรียกใช้ด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนั้นจะสร้างไซต์ QA, เริ่มเลน Gateway ที่รองรับด้วย Docker และเปิดเผยหน้า
QA Lab ที่ผู้ปฏิบัติงานหรือ automation loop สามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือยังถูกบล็อกอยู่

สำหรับการวนปรับ UI ของ QA Lab ให้เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง,
ให้เริ่มสแตกด้วยบันเดิล QA Lab แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
จะสร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะโหลดใหม่อัตโนมัติเมื่อแฮชแอสเซ็ต QA Lab
เปลี่ยน

สำหรับ smoke trace OpenTelemetry ภายในเครื่อง ให้เรียกใช้:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ trace OTLP/HTTP ภายในเครื่อง, เรียกใช้สถานการณ์ QA
`otel-trace-smoke` พร้อมเปิดใช้งาน Plugin `diagnostics-otel`, จากนั้น
ถอดรหัส protobuf spans ที่ส่งออกและ assert รูปทรงที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model calls ต้องไม่ส่งออก `StreamAbandoned` บน turn ที่สำเร็จ; ID diagnostic ดิบและ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace สคริปต์จะเขียน
`otel-smoke-summary.json` ไว้ข้างอาร์ติแฟกต์ QA suite

Observability QA ยังคงเป็นเฉพาะ source checkout เท่านั้น npm tarball จงใจละเว้น
QA Lab ดังนั้นเลน package Docker release จะไม่เรียกใช้คำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน instrumentation
diagnostics

สำหรับเลน smoke Matrix ที่เป็น transport จริง ให้เรียกใช้:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

เอกสารอ้างอิง CLI ฉบับเต็ม, แคตตาล็อก profile/scenario, env vars และเลย์เอาต์อาร์ติแฟกต์สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: คำสั่ง provision homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว, เรียกใช้ Plugin Matrix จริงภายใน Gateway QA ลูกที่จำกัดขอบเขตอยู่กับ transport นั้น (ไม่มี `qa-channel`), จากนั้นเขียนรายงาน Markdown, สรุป JSON, อาร์ติแฟกต์ observed-events และบันทึกเอาต์พุตรวมไว้ภายใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับเลน smoke Telegram และ Discord ที่เป็น transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

ทั้งสองเล็งไปยังช่องทางจริงที่มีอยู่ก่อนแล้วพร้อมบอตสองตัว (driver + SUT) env vars ที่จำเป็น, รายการสถานการณ์, อาร์ติแฟกต์เอาต์พุต และพูลข้อมูลประจำตัว Convex ถูกบันทึกไว้ใน [เอกสารอ้างอิง QA สำหรับ Telegram และ Discord](#telegram-and-discord-qa-reference) ด้านล่าง

ก่อนใช้ข้อมูลประจำตัว live แบบพูล ให้เรียกใช้:

```bash
pnpm openclaw qa credentials doctor
```

doctor จะตรวจ env ของ broker Convex, ตรวจสอบการตั้งค่า endpoint และยืนยันการเข้าถึง admin/list เมื่อมี secret ของ maintainer อยู่ โดยรายงานเฉพาะสถานะตั้งค่าแล้ว/ขาดหายสำหรับ secrets

## ความครอบคลุม live transport

เลน live transport ใช้ contract เดียวกันแทนที่จะให้แต่ละเลนประดิษฐ์รูปทรงรายการสถานการณ์ของตัวเอง `qa-channel` เป็น suite พฤติกรรมผลิตภัณฑ์เชิงสังเคราะห์แบบกว้าง และไม่เป็นส่วนหนึ่งของ matrix ความครอบคลุม live transport

| เลน     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | คำสั่ง Help | การลงทะเบียนคำสั่ง native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

สิ่งนี้ทำให้ `qa-channel` เป็น suite พฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และ live transports ในอนาคตใช้ checklist transport-contract ที่ชัดเจนร่วมกัน

สำหรับเลน Linux VM แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาใน path QA ให้เรียกใช้:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต guest Multipass ใหม่, ติดตั้ง dependencies, build OpenClaw
ภายใน guest, เรียกใช้ `qa suite`, จากนั้นคัดลอกรายงาน QA และสรุปตามปกติ
กลับมายัง `.artifacts/qa-e2e/...` บน host
คำสั่งนี้ใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บน host
การรัน suite บน host และ Multipass จะเรียกใช้สถานการณ์ที่เลือกหลายรายการพร้อมกัน
โดยมี gateway workers ที่แยกกันตามค่าเริ่มต้น `qa-channel` ตั้งค่า concurrency
เริ่มต้นเป็น 4 โดยจำกัดไม่เกินจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการรันแบบลำดับ
คำสั่งจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการอาร์ติแฟกต์โดยไม่มี exit code ที่ล้มเหลว
การรัน live จะส่งต่ออินพุต auth ของ QA ที่รองรับและเหมาะกับ guest:
provider keys แบบ env, path config provider live ของ QA และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ root ของ repo เพื่อให้ guest
สามารถเขียนกลับผ่าน workspace ที่ mount ไว้ได้

## เอกสารอ้างอิง QA สำหรับ Telegram และ Discord

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เพราะมีจำนวนสถานการณ์และการ provision homeserver ที่รองรับด้วย Docker มากกว่า Telegram และ Discord มีขนาดเล็กกว่า — มีสถานการณ์อย่างละไม่กี่รายการ, ไม่มีระบบ profile, ทำงานกับช่องทางจริงที่มีอยู่ก่อนแล้ว — ดังนั้นเอกสารอ้างอิงของทั้งสองจึงอยู่ที่นี่

### CLI flags ที่ใช้ร่วมกัน

ทั้งสองเลนลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับ flags เดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                                   | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตพบ และล็อกเอาต์พุต พาธแบบสัมพัทธ์จะอิงจาก `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                           | รากของรีโพซิทอรีเมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | ID บัญชีชั่วคราวภายในการกำหนดค่า QA gateway                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` หรือ `live-frontier` (`live-openai` แบบเดิมยังใช้งานได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของผู้ให้บริการ                                          | การอ้างอิงโมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                       | โหมดเร็วของผู้ให้บริการในที่ที่รองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | ดู [พูลข้อมูลรับรอง Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, นอกนั้นเป็น `maintainer`                        | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

ทั้งสองจะออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ทิแฟกต์โดยไม่ตั้งค่ารหัสออกเป็นล้มเหลว

### QA ของ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอทสองตัวแยกกัน (driver + SUT) บอท SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอทต่อบอททำงานได้ดีที่สุดเมื่อบอททั้งสองเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

Env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` จะเก็บเนื้อหาข้อความไว้ในอาร์ทิแฟกต์ข้อความที่สังเกตพบ (ค่าเริ่มต้นจะปกปิด)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

อาร์ทิแฟกต์เอาต์พุต:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตพบการตอบกลับของ SUT) โดยเริ่มจาก canary
- `telegram-qa-observed-messages.json` — เนื้อหาจะถูกปกปิดเว้นแต่ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA ของ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปยังแชนเนลกิลด์ Discord ส่วนตัวจริงหนึ่งแชนเนลที่มีบอทสองตัว: บอท driver ที่ควบคุมโดย harness และบอท SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Discord Plugin ที่บันเดิลมา ตรวจสอบการจัดการการกล่าวถึงแชนเนล และยืนยันว่าบอท SUT ได้ลงทะเบียนคำสั่ง `/help` แบบเนทีฟกับ Discord แล้ว

Env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับ ID ผู้ใช้ของบอท SUT ที่ Discord ส่งคืน (ไม่เช่นนั้นเลนจะล้มเหลวทันที)

ตัวเลือกเสริม:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` จะเก็บเนื้อหาข้อความไว้ในอาร์ทิแฟกต์ข้อความที่สังเกตพบ

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

อาร์ทิแฟกต์เอาต์พุต:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — เนื้อหาจะถูกปกปิดเว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`

### พูลข้อมูลรับรอง Convex

เลนทั้ง Telegram และ Discord สามารถเช่าข้อมูลรับรองจากพูล Convex ที่ใช้ร่วมกันแทนการอ่าน env vars ข้างต้น ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะรับ lease แบบเอกสิทธิ์ ส่ง heartbeat ตลอดระยะเวลาการรัน และปล่อยคืนเมื่อปิดระบบ ชนิดของพูลคือ `"telegram"` และ `"discord"`

รูปทรง payload ที่ broker ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`

Env vars สำหรับการปฏิบัติการและสัญญา endpoint ของ Convex broker อยู่ใน [การทดสอบ → ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนมีมาก่อนการรองรับ Discord; ความหมายของ broker เหมือนกันสำหรับทั้งสองชนิด)

## Seed ที่อิงกับรีโพซิทอรี

สินทรัพย์ seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ไฟล์เหล่านี้อยู่ใน git โดยตั้งใจ เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็น runner มาร์กดาวน์ทั่วไป ไฟล์มาร์กดาวน์ของแต่ละสถานการณ์เป็น
แหล่งความจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- เมทาดาทาของสถานการณ์
- เมทาดาทาหมวดหมู่ ความสามารถ เลน และความเสี่ยงที่เป็นตัวเลือก
- การอ้างอิงเอกสารและโค้ด
- ข้อกำหนด Plugin ที่เป็นตัวเลือก
- แพตช์การกำหนดค่า Gateway ที่เป็นตัวเลือก
- `qa-flow` ที่เรียกใช้ได้

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` ได้รับอนุญาตให้คงเป็นแบบทั่วไป
และครอบคลุมหลายส่วนได้ เช่น สถานการณ์มาร์กดาวน์สามารถรวม helper ฝั่ง transport
กับ helper ฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน
Gateway seam `browser.request` โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนที่จะอิงตามโฟลเดอร์
source tree รักษา ID สถานการณ์ให้คงที่เมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการติดตามย้อนกลับไปยังการติดตั้งใช้งาน

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และแชนเนล
- พฤติกรรม thread
- วงจรชีวิตการดำเนินการกับข้อความ
- callback ของ cron
- การเรียกคืนความจำ
- การสลับโมเดล
- การส่งมอบให้ subagent
- การอ่านรีโพซิทอรีและการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของผู้ให้บริการ

`qa suite` มีเลน mock ของผู้ให้บริการในเครื่องสองเลน:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ มันยังคงเป็นเลน mock
  แบบกำหนดผลลัพธ์ได้ค่าเริ่มต้นสำหรับ QA ที่อิงกับรีโพซิทอรีและ parity gates
- `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่อิงกับ AIMock สำหรับความครอบคลุมด้าน protocol
  เชิงทดลอง, fixture, record/replay และ chaos เป็นแบบเพิ่มเติมและไม่แทนที่
  dispatcher สถานการณ์ `mock-openai`

การติดตั้งใช้งานเลนผู้ให้บริการอยู่ใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้นของตน การเริ่มเซิร์ฟเวอร์ในเครื่อง การกำหนดค่าโมเดล Gateway
ความต้องการ staging ของ auth-profile และแฟล็กความสามารถ live/mock โค้ด suite และ
gateway ที่ใช้ร่วมกันควร route ผ่านรีจิสทรีผู้ให้บริการแทนการ branch ตาม
ชื่อผู้ให้บริการ

## Transport adapters

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับสถานการณ์ QA แบบมาร์กดาวน์ `qa-channel` เป็น adapter แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่านั้น: ช่องทางจริงหรือสังเคราะห์ในอนาคตควร plug into suite runner เดียวกันแทนการเพิ่ม QA runner เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการดำเนินการสถานการณ์ทั่วไป concurrency ของ worker การเขียนอาร์ทิแฟกต์ และการรายงาน
- transport adapter เป็นเจ้าของการกำหนดค่า Gateway ความพร้อม การสังเกตขาเข้าและขาออก การดำเนินการ transport และสถานะ transport ที่ normalize แล้ว
- ไฟล์สถานการณ์มาร์กดาวน์ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` จัดเตรียมพื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งเรียกใช้ไฟล์เหล่านั้น

### การเพิ่มแชนเนล

การเพิ่มแชนเนลเข้าสู่ระบบ QA แบบมาร์กดาวน์ต้องมีเพียงสองอย่าง:

1. transport adapter สำหรับแชนเนล
2. ชุดสถานการณ์ที่ทดสอบสัญญาของแชนเนล

อย่าเพิ่มรากคำสั่ง QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- รากคำสั่ง `openclaw qa`
- การเริ่มและการ teardown ของ suite
- concurrency ของ worker
- การเขียนอาร์ทิแฟกต์
- การสร้างรายงาน
- การดำเนินการสถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Runner Plugin เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ไว้ใต้ราก `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า Gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธีฉีดเหตุการณ์ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalize แล้ว
- วิธีเรียกใช้การดำเนินการที่อิงกับ transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์การนำไปใช้ขั้นต่ำสำหรับแชนเนลใหม่:

1. ให้ `qa-lab` เป็นเจ้าของราก `qa` ที่ใช้ร่วมกันต่อไป
2. ติดตั้งใช้งาน transport runner บน host seam `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน Runner Plugin หรือ channel harness
4. Mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่งรากที่แข่งขันกัน Runner Plugin ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาไว้; CLI แบบ lazy และการเรียกใช้ runner ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์มาร์กดาวน์ใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ helper สถานการณ์ทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias ความเข้ากันได้เดิมให้ทำงานต่อไป เว้นแต่รีโพซิทอรีกำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงเพียงครั้งเดียวใน `qa-lab` ได้ ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ transport ของแชนเนลหนึ่ง ให้เก็บไว้ใน Runner Plugin หรือ Plugin harness นั้น
- หากสถานการณ์ต้องการความสามารถใหม่ที่มากกว่าหนึ่งแชนเนลใช้ได้ ให้เพิ่ม helper ทั่วไปแทน branch เฉพาะแชนเนลใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะสำหรับ transport หนึ่ง ให้คงสถานการณ์เป็นแบบเฉพาะ transport และระบุให้ชัดเจนในสัญญาสถานการณ์

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

alias ความเข้ากันได้ยังพร้อมใช้งานสำหรับสถานการณ์เดิม — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อทั่วไป alias เหล่านี้มีไว้เพื่อหลีกเลี่ยงการ migration แบบ flag-day ไม่ใช่เป็นโมเดลต่อไปในอนาคต

## การรายงาน

`qa-lab` export รายงาน protocol แบบมาร์กดาวน์จาก timeline ของ bus ที่สังเกตพบ
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อก
- สถานการณ์ติดตามผลใดควรค่าแก่การเพิ่ม

สำหรับรายการสถานการณ์ที่พร้อมใช้งาน ซึ่งมีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อมต่อ transport ใหม่ ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)

สำหรับการตรวจสอบคาแรกเตอร์และสไตล์ ให้รันสถานการณ์เดียวกันกับ model
refs แบบ live หลายรายการ แล้วเขียนรายงาน Markdown ที่ผ่านการตัดสินแล้ว:

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

คำสั่งนี้รันกระบวนการลูกของ QA Gateway ในเครื่อง ไม่ใช่ Docker สถานการณ์ character eval
ควรตั้ง persona ผ่าน `SOUL.md` จากนั้นรันรอบผู้ใช้ตามปกติ
เช่น แชต ความช่วยเหลือเกี่ยวกับ workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอก
model ผู้สมัครว่ากำลังถูกประเมิน คำสั่งจะเก็บ transcript ฉบับเต็มแต่ละรายการ
บันทึกสถิติการรันพื้นฐาน จากนั้นถาม judge models ในโหมด fast ด้วย
reasoning ระดับ `xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ providers: judge prompt ยังคงได้รับ
transcript และสถานะการรันทุกอย่าง แต่ candidate refs จะถูกแทนที่ด้วย
ป้ายกำกับกลาง เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง refs จริงหลังจาก
แยกวิเคราะห์แล้ว
การรันผู้สมัครมีค่าเริ่มต้นเป็น thinking ระดับ `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ OpenAI eval refs รุ่นเก่าที่รองรับ แทนที่ผู้สมัครเฉพาะรายแบบ inline ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงตั้งค่า
fallback ส่วนกลาง และรูปแบบเดิม `--model-thinking <provider/model=level>` ยัง
คงไว้เพื่อความเข้ากันได้
OpenAI candidate refs ใช้โหมด fast เป็นค่าเริ่มต้น เพื่อให้ใช้ priority processing ในที่ที่
provider รองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
ผู้สมัครหรือ judge รายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast สำหรับ candidate model ทุกตัว ระยะเวลาของผู้สมัครและ judge
จะถูกบันทึกในรายงานสำหรับการวิเคราะห์ benchmark แต่ judge prompts ระบุอย่างชัดเจนว่า
ห้ามจัดอันดับตามความเร็ว
การรัน candidate และ judge model ทั้งคู่ใช้ concurrency 16 เป็นค่าเริ่มต้น ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดของ provider หรือแรงกดดันบน local gateway
ทำให้การรันมี noise มากเกินไป
เมื่อไม่ได้ส่ง candidate `--model` character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` judges จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Matrix QA](/th/concepts/qa-matrix)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
