---
read_when:
    - ทำความเข้าใจว่า QA stack ประกอบเข้าด้วยกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่งข้อมูล
    - การเพิ่มสถานการณ์การประกันคุณภาพที่อิงกับคลังเก็บโค้ด
    - การสร้างระบบอัตโนมัติด้านการประกันคุณภาพที่สมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิงจากรีโป, เลนการส่งผ่านแบบสด, อะแดปเตอร์การส่งผ่าน และการรายงาน'
title: ภาพรวมการประกันคุณภาพ
x-i18n:
    generated_at: "2026-04-30T09:48:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงและมีรูปแบบตามช่องทางมากกว่าการทดสอบหน่วยเดียวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความจำลองที่มีพื้นผิว DM, ช่องทาง, เธรด,
  รีแอ็กชัน, การแก้ไข และการลบ
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์,
  แทรกข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin รันเนอร์ในอนาคต: อะแดปเตอร์การขนส่งสดที่
  ขับช่องทางจริงภายใน Gateway QA ลูก
- `qa/`: แอสเซ็ตตั้งต้นที่อิงกับรีโปสำหรับงานเริ่มต้นและสถานการณ์ QA
  พื้นฐาน

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA รันภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมีนามแฝงสคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | การตรวจสอบตัวเอง QA ที่รวมมาให้; เขียนรายงาน Markdown                                                                                                                       |
| `qa suite`                                          | รันสถานการณ์ที่อิงกับรีโปกับเลน Gateway QA นามแฝง: `pnpm openclaw qa suite --runner multipass` สำหรับ VM Linux แบบใช้แล้วทิ้ง                                 |
| `qa coverage`                                       | พิมพ์คลังรายการความครอบคลุมสถานการณ์แบบ Markdown (`--json` สำหรับเอาต์พุตเครื่องอ่านได้)                                                                                          |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงานเกตความเท่าเทียมแบบเอเจนต์                                                                                    |
| `qa character-eval`                                 | รันสถานการณ์ QA ตัวละครข้ามโมเดลสดหลายตัวพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                           |
| `qa manual`                                         | รันพรอมป์ครั้งเดียวกับเลนผู้ให้บริการ/โมเดลที่เลือก                                                                                                         |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ในเครื่อง (นามแฝง: `pnpm qa:lab:ui`)                                                                                                   |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่อบไว้ล่วงหน้า                                                                                                                                    |
| `qa docker-scaffold`                                | เขียนสแกฟโฟลด์ docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                   |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแต็กที่มี Docker รองรับ, พิมพ์ URL (นามแฝง: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`) |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock                                                                                                                                 |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ `mock-openai` ที่รับรู้สถานการณ์                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูลข้อมูลประจำตัว Convex ที่ใช้ร่วมกัน                                                                                                                              |
| `qa matrix`                                         | เลนการขนส่งสดกับโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                     |
| `qa telegram`                                       | เลนการขนส่งสดกับกลุ่ม Telegram ส่วนตัวจริง                                                                                                             |
| `qa discord`                                        | เลนการขนส่งสดกับช่องกิลด์ Discord ส่วนตัวจริง                                                                                                      |

## โฟลว์ผู้ปฏิบัติงาน

โฟลว์ผู้ปฏิบัติงาน QA ปัจจุบันคือไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab ที่แสดงทรานสคริปต์คล้าย Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้างไซต์ QA, เริ่มเลน Gateway ที่มี Docker รองรับ, และเปิดเผยหน้า
QA Lab ซึ่งผู้ปฏิบัติงานหรือลูปอัตโนมัติสามารถมอบภารกิจ QA ให้เอเจนต์,
สังเกตพฤติกรรมช่องทางจริง, และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือยังถูกบล็อกอยู่

สำหรับการวนซ้ำ UI ของ QA Lab ในเครื่องที่เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง,
เริ่มสแต็กด้วยบันเดิล QA Lab ที่เมาต์แบบผูก:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและเมาต์แบบผูก
`extensions/qa-lab/web/dist` เข้าในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
สร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะโหลดใหม่อัตโนมัติเมื่อแฮชแอสเซ็ต QA Lab
เปลี่ยน

สำหรับการตรวจควันเทรซ OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับเทรซ OTLP/HTTP ในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel`, จากนั้น
ถอดรหัสสแปน protobuf ที่ส่งออกและยืนยันรูปทรงที่สำคัญต่อการปล่อยรุ่น:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, และ `openclaw.message.delivery`;
การเรียกโมเดลต้องไม่ส่งออก `StreamAbandoned` ในเทิร์นที่สำเร็จ; ID วินิจฉัยดิบและ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่เข้าไปอยู่ในเทรซ สคริปต์เขียน
`otel-smoke-summary.json` ถัดจากอาร์ติแฟกต์ชุด QA

QA ด้านการสังเกตการณ์ยังคงใช้ได้เฉพาะซอร์สเช็กเอาต์เท่านั้น แพ็กเกจ npm tarball ตั้งใจละเว้น
QA Lab ดังนั้นเลนปล่อยรุ่น Docker ของแพ็กเกจจึงไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จากซอร์สเช็กเอาต์ที่สร้างแล้วเมื่อเปลี่ยนเครื่องมือวัดการวินิจฉัย

สำหรับเลนตรวจควัน Matrix ที่เป็นการขนส่งจริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

ข้อมูลอ้างอิง CLI ฉบับเต็ม แคตตาล็อกโปรไฟล์/สถานการณ์ ตัวแปรสภาพแวดล้อม และผังอาร์ติแฟกต์สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: คำสั่งจัดเตรียมโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ไดรเวอร์/SUT/ผู้สังเกตการณ์ชั่วคราว, รัน Plugin Matrix จริงภายใน Gateway QA ลูกที่จำกัดขอบเขตกับการขนส่งนั้น (ไม่มี `qa-channel`), จากนั้นเขียนรายงาน Markdown, สรุป JSON, อาร์ติแฟกต์เหตุการณ์ที่สังเกตได้, และล็อกเอาต์พุตรวมภายใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับเลนตรวจควัน Telegram และ Discord ที่เป็นการขนส่งจริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

ทั้งสองเลนกำหนดเป้าหมายไปที่ช่องจริงที่มีอยู่ก่อนพร้อมบอตสองตัว (ไดรเวอร์ + SUT) ตัวแปรสภาพแวดล้อมที่จำเป็น รายการสถานการณ์ อาร์ติแฟกต์เอาต์พุต และพูลข้อมูลประจำตัว Convex มีเอกสารใน [ข้อมูลอ้างอิง QA สำหรับ Telegram และ Discord](#telegram-and-discord-qa-reference) ด้านล่าง

ก่อนใช้ข้อมูลประจำตัวสดแบบพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจ env ของโบรกเกอร์ Convex, ตรวจสอบการตั้งค่าเอนด์พอยต์, และยืนยันการเข้าถึง admin/list เมื่อมีความลับผู้ดูแลอยู่ โดยรายงานเฉพาะสถานะตั้งค่า/ขาดหายสำหรับความลับ

## ความครอบคลุมการขนส่งสด

เลนการขนส่งสดใช้สัญญาร่วมกันหนึ่งชุดแทนที่แต่ละเลนจะประดิษฐ์รูปทรงรายการสถานการณ์ของตัวเอง `qa-channel` คือชุดพฤติกรรมผลิตภัณฑ์จำลองแบบกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุมการขนส่งสด

| เลน     | คานารี | การควบคุมเมนชัน | บอตถึงบอต | บล็อก allowlist | การตอบกลับระดับบนสุด | เริ่มใหม่แล้วทำต่อ | การติดตามผลเธรด | การแยกเธรด | การสังเกตรีแอ็กชัน | คำสั่งช่วยเหลือ | การลงทะเบียนคำสั่งเนทีฟ |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

สิ่งนี้ทำให้ `qa-channel` เป็นชุดพฤติกรรมผลิตภัณฑ์แบบกว้างต่อไป ขณะที่ Matrix,
Telegram, และการขนส่งสดในอนาคตใช้รายการตรวจสอบสัญญาการขนส่งที่ชัดเจนร่วมกัน

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่นำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูตเกสต์ Multipass ใหม่, ติดตั้งการพึ่งพา, สร้าง OpenClaw
ภายในเกสต์, รัน `qa suite`, จากนั้นคัดลอกรายงาน QA ปกติและ
สรุปกลับไปยัง `.artifacts/qa-e2e/...` บนโฮสต์
คำสั่งใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์ซ้ำ
การรันชุดบนโฮสต์และ Multipass ดำเนินสถานการณ์ที่เลือกหลายรายการแบบขนาน
ด้วยเวิร์กเกอร์ Gateway ที่แยกกันตามค่าเริ่มต้น `qa-channel` ตั้งค่าความพร้อมกันเริ่มต้นเป็น
4 โดยจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวนเวิร์กเกอร์ หรือ `--concurrency 1` สำหรับการดำเนินแบบอนุกรม
คำสั่งจบด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
การรันสดส่งต่ออินพุตการยืนยันตัวตน QA ที่รองรับและใช้งานได้จริงสำหรับ
เกสต์: คีย์ผู้ให้บริการจาก env, พาธคอนฟิกผู้ให้บริการสด QA, และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้รูทของรีโปเพื่อให้เกสต์
สามารถเขียนกลับผ่านเวิร์กสเปซที่เมาต์ได้

## ข้อมูลอ้างอิง QA สำหรับ Telegram และ Discord

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เพราะจำนวนสถานการณ์และการจัดเตรียมโฮมเซิร์ฟเวอร์ที่มี Docker รองรับ Telegram และ Discord มีขนาดเล็กกว่า — มีสถานการณ์อย่างละไม่กี่รายการ ไม่มีระบบโปรไฟล์ และรันกับช่องจริงที่มีอยู่ก่อน — ดังนั้นข้อมูลอ้างอิงจึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

ทั้งสองเลนลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และยอมรับแฟล็กเดียวกัน:

| Flag                                  | Default                                                   | Description                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตพบ และบันทึกเอาต์พุต พาธสัมพัทธ์จะอิงจาก `--repo-root`                         |
| `--repo-root <path>`                  | `process.cwd()`                                           | รากของรีโพเมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                                  |
| `--sut-account <id>`                  | `sut`                                                     | รหัสบัญชีชั่วคราวภายในการกำหนดค่า Gateway สำหรับ QA                                                                         |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` หรือ `live-frontier` (`live-openai` แบบเดิมยังใช้งานได้)                                                       |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของผู้ให้บริการ                                | ref โมเดลหลัก/สำรอง                                                                                                         |
| `--fast`                              | ปิด                                                       | โหมดเร็วของผู้ให้บริการเมื่อรองรับ                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                                     | ดู [พูลข้อมูลประจำตัว Convex](#convex-credential-pool)                                                                      |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                     | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                                |

ทั้งสองจะออกด้วยรหัสไม่เป็นศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้งรหัสออกเป็นล้มเหลว

### QA ของ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายเป็นกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบ็อตสองตัวแยกกัน (driver + SUT) บ็อต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบ็อตถึงบ็อตจะทำงานได้ดีที่สุดเมื่อบ็อตทั้งสองเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — รหัสแชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเพิ่มเติม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตพบ (ค่าเริ่มต้นจะปกปิดข้อมูล)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

อาร์ติแฟกต์เอาต์พุต:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตพบการตอบกลับของ SUT) โดยเริ่มจาก canary
- `telegram-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA ของ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายเป็นช่องในกิลด์ Discord ส่วนตัวจริงหนึ่งช่องที่มีบ็อตสองตัว: บ็อต driver ที่ควบคุมโดยชุดทดสอบ และบ็อต SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Discord ที่มาพร้อมกัน ตรวจสอบการจัดการการกล่าวถึงในช่อง และตรวจสอบว่าบ็อต SUT ได้ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับรหัสผู้ใช้ของบ็อต SUT ที่ Discord ส่งกลับ (ไม่เช่นนั้นเลนจะล้มเหลวอย่างรวดเร็ว)

ตัวเลือกเพิ่มเติม:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตพบ

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

อาร์ติแฟกต์เอาต์พุต:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`

### พูลข้อมูลประจำตัว Convex

ทั้งเลน Telegram และ Discord สามารถเช่าข้อมูลประจำตัวจากพูล Convex ที่ใช้ร่วมกันแทนการอ่านตัวแปร env ด้านบนได้ ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอ lease แบบเอกสิทธิ์ ทำ Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดระบบ ชนิดของพูลคือ `"telegram"` และ `"discord"`

รูปแบบ payload ที่ broker ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`

ตัวแปร env สำหรับการปฏิบัติการและสัญญา endpoint ของ broker Convex อยู่ใน [การทดสอบ → ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนมีมาก่อนการรองรับ Discord; ความหมายของ broker เหมือนกันสำหรับทั้งสองชนิด)

## seed ที่อิงรีโพ

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

รายการเหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็นตัวรัน markdown แบบทั่วไป ไฟล์ markdown ของแต่ละสถานการณ์คือ
แหล่งความจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของสถานการณ์
- metadata เพิ่มเติมสำหรับหมวดหมู่ ความสามารถ เลน และความเสี่ยง
- ref ของเอกสารและโค้ด
- ข้อกำหนด Plugin เพิ่มเติม
- แพตช์การกำหนดค่า Gateway เพิ่มเติม
- `qa-flow` ที่เรียกใช้ได้

พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` สามารถคงความทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ markdown สามารถรวมตัวช่วยฝั่ง transport
กับตัวช่วยฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน
seam `browser.request` ของ Gateway ได้โดยไม่ต้องเพิ่มตัวรันกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนโฟลเดอร์ source tree
รักษา ID สถานการณ์ให้คงที่เมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการตรวจสอบย้อนกลับของการใช้งานจริง

รายการ baseline ควรกว้างพอให้ครอบคลุม:

- แชต DM และช่อง
- พฤติกรรมของ thread
- วงจรชีวิตของการกระทำกับข้อความ
- callback ของ cron
- การเรียกคืนหน่วยความจำ
- การสลับโมเดล
- การส่งต่อให้ subagent
- การอ่านรีโพและการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลนม็อกผู้ให้บริการ

`qa suite` มีเลนม็อกผู้ให้บริการแบบ local สองเลน:

- `mock-openai` คือม็อก OpenClaw ที่รับรู้สถานการณ์ ยังคงเป็นเลนม็อกแบบกำหนดผลได้
  ค่าเริ่มต้นสำหรับ QA ที่อิงรีโพและ parity gate
- `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่อิง AIMock สำหรับความครอบคลุมด้านโปรโตคอล
  fixture, record/replay และ chaos แบบทดลอง เป็นส่วนเสริมและไม่ได้แทนที่
  dispatcher สถานการณ์ `mock-openai`

การใช้งานเลนผู้ให้บริการอยู่ภายใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้น การเริ่มเซิร์ฟเวอร์ local การกำหนดค่าโมเดล Gateway
ความต้องการ staging สำหรับ auth-profile และแฟล็กความสามารถ live/mock ของตน โค้ดชุดทดสอบและ
Gateway ที่ใช้ร่วมกันควรกำหนดเส้นทางผ่าน registry ผู้ให้บริการแทนการ branch ตาม
ชื่อผู้ให้บริการ

## อะแดปเตอร์ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับสถานการณ์ QA แบบ markdown `qa-channel` เป็นอะแดปเตอร์แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่านั้น: ช่องจริงหรือช่องสังเคราะห์ในอนาคตควรเสียบเข้ากับตัวรันชุดเดียวกัน แทนการเพิ่มตัวรัน QA เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการรันสถานการณ์ทั่วไป concurrency ของ worker การเขียนอาร์ติแฟกต์ และการรายงาน
- อะแดปเตอร์ transport เป็นเจ้าของการกำหนดค่า Gateway ความพร้อม การสังเกตขาเข้าและขาออก การกระทำของ transport และสถานะ transport ที่ normalized
- ไฟล์สถานการณ์ markdown ภายใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` จัดเตรียมพื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งใช้เรียกใช้ไฟล์เหล่านั้น

### การเพิ่มช่อง

การเพิ่มช่องเข้าในระบบ QA แบบ markdown ต้องมีเพียงสองอย่าง:

1. อะแดปเตอร์ transport สำหรับช่อง
2. แพ็กสถานการณ์ที่ทดสอบสัญญาของช่อง

อย่าเพิ่ม root คำสั่ง QA ระดับบนใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มต้นและการปิดชุดทดสอบ
- concurrency ของ worker
- การเขียนอาร์ติแฟกต์
- การสร้างรายงาน
- การรันสถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Plugin ตัวรันเป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีที่ Gateway ถูกกำหนดค่าสำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธีฉีด event ขาเข้า
- วิธีสังเกตข้อความขาออก
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalized
- วิธีเรียกใช้การกระทำที่อิง transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำสำหรับการนำช่องใหม่มาใช้:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. ใช้งานตัวรัน transport บน seam host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน Plugin ตัวรันหรือ harness ของช่อง
4. Mount ตัวรันเป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่ง root ที่แข่งขันกัน Plugin ตัวรันควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` รักษา `runtime-api.ts` ให้เบา; CLI แบบ lazy และการรันตัวรันควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือดัดแปลงสถานการณ์ markdown ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ตัวช่วยสถานการณ์ทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias ความเข้ากันได้เดิมให้ทำงานต่อไป เว้นแต่รีโพกำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ transport ของช่องหนึ่ง ให้เก็บไว้ใน Plugin ตัวรันหรือ harness ของ Plugin นั้น
- หากสถานการณ์ต้องการความสามารถใหม่ที่มากกว่าหนึ่งช่องใช้ได้ ให้เพิ่มตัวช่วยทั่วไปแทน branch เฉพาะช่องใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport หนึ่งเท่านั้น ให้สถานการณ์นั้นเป็นแบบเฉพาะ transport และระบุให้ชัดเจนในสัญญาสถานการณ์

### ชื่อตัวช่วยสถานการณ์

ตัวช่วยทั่วไปที่แนะนำสำหรับสถานการณ์ใหม่:

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

alias ความเข้ากันได้ยังคงมีให้ใช้สำหรับสถานการณ์เดิม — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อทั่วไป alias มีอยู่เพื่อหลีกเลี่ยง migration แบบต้องเปลี่ยนพร้อมกันทั้งหมด ไม่ใช่เป็นโมเดลสำหรับอนาคต

## การรายงาน

`qa-lab` export รายงานโปรโตคอล Markdown จากไทม์ไลน์ bus ที่สังเกตพบ
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อกอยู่
- สถานการณ์ติดตามผลใดคุ้มค่าที่จะเพิ่ม

สำหรับรายการคลังของสถานการณ์ที่มีให้ใช้งาน ซึ่งมีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อมต่อชั้นขนส่งใหม่ ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` เพื่อให้ได้เอาต์พุตที่เครื่องอ่านได้)

สำหรับการตรวจสอบคาแรกเตอร์และสไตล์ ให้รันสถานการณ์เดียวกันกับข้อมูลอ้างอิงโมเดลจริงหลายรายการ
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

คำสั่งนี้รันกระบวนการลูกของ Gateway QA ในเครื่อง ไม่ใช่ Docker สถานการณ์ประเมินคาแรกเตอร์
ควรกำหนดบุคลิกผ่าน `SOUL.md` แล้วจึงรันเทิร์นผู้ใช้ตามปกติ
เช่น แชต ความช่วยเหลือเกี่ยวกับเวิร์กสเปซ และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลผู้ถูกประเมิน
ว่ากำลังถูกประเมินอยู่ คำสั่งนี้จะเก็บทรานสคริปต์ฉบับเต็มแต่ละรายการ
บันทึกสถิติพื้นฐานของการรัน จากนั้นขอให้โมเดลผู้ตัดสินในโหมดเร็วพร้อมการใช้เหตุผลระดับ
`xhigh` เมื่อรองรับ จัดอันดับการรันตามความเป็นธรรมชาติ โทน และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: พรอมป์ของผู้ตัดสินยังคงได้รับ
ทรานสคริปต์และสถานะการรันทั้งหมด แต่ข้อมูลอ้างอิงของผู้ถูกประเมินจะถูกแทนที่ด้วย
ป้ายกำกับกลาง เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยังข้อมูลอ้างอิงจริงหลังจาก
แยกวิเคราะห์แล้ว
การรันของผู้ถูกประเมินมีค่าเริ่มต้นเป็นการคิดระดับ `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับข้อมูลอ้างอิงการประเมิน OpenAI รุ่นเก่าที่รองรับ แทนที่ผู้ถูกประเมินเฉพาะรายการแบบอินไลน์ด้วย
`--model provider/model,thinking=<level>` ได้ `--thinking <level>` ยังใช้ตั้งค่า
สำรองส่วนกลาง และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังคง
เก็บไว้เพื่อความเข้ากันได้
ข้อมูลอ้างอิงผู้ถูกประเมินของ OpenAI มีค่าเริ่มต้นเป็นโหมดเร็ว เพื่อให้ใช้การประมวลผลแบบมีลำดับความสำคัญในจุดที่
ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบอินไลน์เมื่อ
ผู้ถูกประเมินหรือผู้ตัดสินรายเดียวต้องมีการแทนที่ ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมดเร็วสำหรับโมเดลผู้ถูกประเมินทุกตัว ระยะเวลาของผู้ถูกประเมินและผู้ตัดสิน
จะถูกบันทึกในรายงานสำหรับการวิเคราะห์เบนช์มาร์ก แต่พรอมป์ของผู้ตัดสินระบุอย่างชัดเจนว่า
ห้ามจัดอันดับตามความเร็ว
การรันโมเดลผู้ถูกประเมินและผู้ตัดสินมีค่าเริ่มต้นเป็นการทำงานพร้อมกัน 16 รายการทั้งคู่ ลดค่า
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัดของผู้ให้บริการหรือแรงกดดันต่อ Gateway ในเครื่อง
ทำให้การรันแปรปรวนมากเกินไป
เมื่อไม่ได้ส่ง `--model` ของผู้ถูกประเมิน การประเมินคาแรกเตอร์จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` ผู้ตัดสินจะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Matrix QA](/th/concepts/qa-matrix)
- [QA Channel](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
