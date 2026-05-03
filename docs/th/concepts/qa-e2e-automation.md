---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ประกอบเข้าด้วยกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การขนส่ง
    - การเพิ่มสถานการณ์ QA ที่อ้างอิงจากคลังโค้ด
    - การสร้างระบบ QA อัตโนมัติที่สมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิงกับคลังโค้ด, เลนการรับส่งแบบสด, อะแดปเตอร์การรับส่ง, และการรายงาน.'
title: ภาพรวมการประกันคุณภาพ
x-i18n:
    generated_at: "2026-05-03T21:30:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแตก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงและมีรูปแบบเหมือนช่องทาง
มากกว่าที่การทดสอบหน่วยเดียวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin รันเนอร์ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับเคลื่อนช่องทางจริงภายใน Gateway QA ลูก
- `qa/`: แอสเซตเริ่มต้นที่อิงรีโพสำหรับงาน kickoff และสถานการณ์ QA
  พื้นฐาน
- [Mantis](/th/concepts/mantis): การตรวจสอบสดก่อนและหลังสำหรับบั๊กที่
  ต้องใช้ทรานสปอร์ตจริง ภาพหน้าจอเบราว์เซอร์ สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี
นามแฝงสคริปต์ `pnpm qa:*`; รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | การตรวจสอบตัวเอง QA ที่รวมมาให้; เขียนรายงาน Markdown                                                                                                                       |
| `qa suite`                                          | รันสถานการณ์ที่อิงรีโพกับเลน Gateway QA นามแฝง: `pnpm openclaw qa suite --runner multipass` สำหรับ VM Linux แบบใช้แล้วทิ้ง                                 |
| `qa coverage`                                       | พิมพ์อินเวนทอรีความครอบคลุมของสถานการณ์ในรูปแบบ markdown (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                          |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน agentic parity                                                                                         |
| `qa character-eval`                                 | รันสถานการณ์ QA ด้านตัวละครข้ามหลายโมเดลสดพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                           |
| `qa manual`                                         | รันพรอมป์ครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                         |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ในเครื่อง (นามแฝง: `pnpm qa:lab:ui`)                                                                                                   |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่อบไว้ล่วงหน้า                                                                                                                                    |
| `qa docker-scaffold`                                | เขียนสแกฟโฟลด์ docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                   |
| `qa up`                                             | สร้างไซต์ QA เริ่มสแตกที่อิง Docker และพิมพ์ URL (นามแฝง: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`) |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                 |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูลข้อมูลรับรอง Convex ที่ใช้ร่วมกัน                                                                                                                              |
| `qa matrix`                                         | เลนทรานสปอร์ตสดกับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [QA ของ Matrix](/th/concepts/qa-matrix)                                                                     |
| `qa telegram`                                       | เลนทรานสปอร์ตสดกับกลุ่ม Telegram ส่วนตัวจริง                                                                                                             |
| `qa discord`                                        | เลนทรานสปอร์ตสดกับช่อง guild Discord ส่วนตัวจริง                                                                                                      |
| `qa mantis`                                         | รันเนอร์การตรวจสอบก่อนและหลังสำหรับบั๊กทรานสปอร์ตสด พร้อมสถานการณ์ status-reactions แรกของ Discord ดู [Mantis](/th/concepts/mantis)                        |

## โฟลว์ผู้ปฏิบัติงาน

โฟลว์ผู้ปฏิบัติงาน QA ปัจจุบันคือไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab แสดงทรานสคริปต์คล้าย Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้างไซต์ QA เริ่มเลน Gateway ที่อิง Docker และเปิดเผยหน้า
QA Lab ซึ่งผู้ปฏิบัติงานหรือลูปอัตโนมัติสามารถมอบภารกิจ QA ให้เอเจนต์
สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือ
ยังถูกบล็อกอยู่

สำหรับการวนปรับ UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง
ให้เริ่มสแตกด้วยบันเดิล QA Lab ที่เมานต์แบบ bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
จะสร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะโหลดใหม่อัตโนมัติเมื่อแฮชแอสเซต
QA Lab เปลี่ยน

สำหรับการตรวจสอบควัน trace OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ trace OTLP/HTTP ในเครื่อง รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel` จากนั้น
ถอดรหัส protobuf spans ที่ส่งออกและยืนยันรูปทรงที่สำคัญต่อการปล่อยรุ่น:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model calls ต้องไม่ส่งออก `StreamAbandoned` ในเทิร์นที่สำเร็จ; ID การวินิจฉัยดิบและ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace สคริปต์เขียน
`otel-smoke-summary.json` ไว้ข้างอาร์ติแฟกต์ชุด QA

QA ด้าน observability คงเป็นแบบ source-checkout เท่านั้น npm tarball จงใจไม่รวม
QA Lab ดังนั้นเลนปล่อยแพ็กเกจ Docker จะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่สร้างแล้วเมื่อเปลี่ยนเครื่องมือวัด
การวินิจฉัย

สำหรับเลนตรวจสอบควัน Matrix ที่ใช้ทรานสปอร์ตจริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

ข้อมูลอ้างอิง CLI เต็ม แค็ตตาล็อกโปรไฟล์/สถานการณ์ ตัวแปร env และเลย์เอาต์อาร์ติแฟกต์สำหรับเลนนี้อยู่ใน [QA ของ Matrix](/th/concepts/qa-matrix) โดยสรุป: คำสั่งจะจัดเตรียม homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว รัน Plugin Matrix จริงภายใน Gateway QA ลูกที่จำกัดขอบเขตไว้กับทรานสปอร์ตนั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown สรุป JSON อาร์ติแฟกต์ observed-events และล็อกเอาต์พุตรวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สำหรับเลนตรวจสอบควัน Telegram และ Discord ที่ใช้ทรานสปอร์ตจริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

ทั้งสองเล็งไปที่ช่องทางจริงที่มีอยู่แล้วพร้อมบอทสองตัว (driver + SUT) ตัวแปร env ที่จำเป็น รายการสถานการณ์ อาร์ติแฟกต์เอาต์พุต และพูลข้อมูลรับรอง Convex มีเอกสารอยู่ใน [ข้อมูลอ้างอิง QA ของ Telegram และ Discord](#telegram-and-discord-qa-reference) ด้านล่าง

ก่อนใช้ข้อมูลรับรองสดจากพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจสอบ env ของโบรกเกอร์ Convex ตรวจสอบความถูกต้องของการตั้งค่า endpoint และยืนยันการเข้าถึง admin/list เมื่อมีความลับของผู้ดูแลอยู่ โดยรายงานเฉพาะสถานะตั้งค่าแล้ว/ขาดหายสำหรับความลับ

## ความครอบคลุมทรานสปอร์ตสด

เลนทรานสปอร์ตสดใช้สัญญาร่วมกันหนึ่งชุด แทนที่แต่ละเลนจะประดิษฐ์รูปทรงรายการสถานการณ์ของตัวเอง `qa-channel` คือชุดพฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้าง และไม่ใช่ส่วนหนึ่งของเมทริกซ์ความครอบคลุมทรานสปอร์ตสด

| เลน     | Canary | การกั้น mention | บอทถึงบอท | บล็อก allowlist | การตอบกลับระดับบน | กลับมาทำต่อหลังรีสตาร์ต | การติดตาม thread | การแยก thread | การสังเกต reaction | คำสั่งช่วยเหลือ | การลงทะเบียนคำสั่งเนทีฟ |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

สิ่งนี้คง `qa-channel` ไว้เป็นชุดพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และทรานสปอร์ตสดในอนาคตใช้เช็กลิสต์สัญญาทรานสปอร์ตที่ชัดเจนร่วมกันหนึ่งชุด

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต guest Multipass ใหม่ ติดตั้ง dependency สร้าง OpenClaw
ภายใน guest รัน `qa suite` จากนั้นคัดลอกรายงาน QA และสรุปตามปกติ
กลับไปยัง `.artifacts/qa-e2e/...` บน host
คำสั่งใช้พฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บน host
การรันชุดบน host และ Multipass ดำเนินสถานการณ์หลายรายการที่เลือกพร้อมกัน
ด้วย worker Gateway ที่แยกกันโดยค่าเริ่มต้น `qa-channel` ตั้งค่าเริ่มต้นเป็น concurrency
4 โดยถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการดำเนินการแบบอนุกรม
คำสั่งออกด้วยสถานะไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการอาร์ติแฟกต์โดยไม่มีรหัสออกที่ล้มเหลว
การรันสดส่งต่ออินพุต auth ของ QA ที่รองรับและเหมาะสำหรับ
guest: คีย์ provider ที่อิง env, พาธคอนฟิก provider สดของ QA และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้รากรีโพเพื่อให้ guest
เขียนกลับผ่าน workspace ที่เมานต์ได้

## ข้อมูลอ้างอิง QA ของ Telegram และ Discord

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากจำนวนสถานการณ์และการจัดเตรียม homeserver ที่อิง Docker Telegram และ Discord มีขนาดเล็กกว่า — มีสถานการณ์อย่างละไม่กี่รายการ ไม่มีระบบโปรไฟล์ และรันกับช่องทางจริงที่มีอยู่แล้ว — ดังนั้นข้อมูลอ้างอิงจึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

ทั้งสองเลนลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                                   | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตพบ และบันทึกผลลัพธ์ พาธแบบสัมพัทธ์จะอ้างอิงจาก `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                           | รากของ Repository เมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | ID บัญชีชั่วคราวภายในคอนฟิก Gateway ของ QA                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` หรือ `live-frontier` (`live-openai` แบบเดิมยังใช้งานได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของผู้ให้บริการ                                          | ref ของโมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                       | โหมดเร็วของผู้ให้บริการเมื่อรองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | ดู [พูลข้อมูลรับรอง Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                        | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

ทั้งสองจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้งรหัสออกให้เป็นสถานะล้มเหลว

### QA ของ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแยกกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตการณ์แบบบอตต่อบอตทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้งาน **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเพิ่มเติม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` จะเก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตพบ (ค่าเริ่มต้นจะปกปิด)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

อาร์ติแฟกต์ผลลัพธ์:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตพบการตอบกลับของ SUT) เริ่มตั้งแต่ canary
- `telegram-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ตั้ง `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA ของ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปยังช่องใน Discord guild ส่วนตัวจริงหนึ่งช่องที่มีบอตสองตัว: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ย่อยของ OpenClaw ผ่าน Plugin Discord ที่บันเดิลมา ตรวจสอบการจัดการการ mention ในช่อง ว่าบอต SUT ได้ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — ต้องตรงกับ ID ผู้ใช้ของบอต SUT ที่ Discord ส่งกลับมา (ไม่เช่นนั้น lane จะล้มเหลวทันที)

ตัวเลือกเพิ่มเติม:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` จะเก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตพบ

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — สถานการณ์ Mantis แบบ opt-in รันแยกเดี่ยวเพราะจะสลับ SUT ไปเป็นการตอบกลับใน guild แบบเปิดตลอดเวลาและใช้เฉพาะเครื่องมือ โดยตั้ง `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์ reaction ผ่าน REST รวมถึงอาร์ติแฟกต์ภาพ HTML/PNG

รันสถานการณ์ status-reaction ของ Mantis อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

อาร์ติแฟกต์ผลลัพธ์:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — เนื้อหาจะถูกปกปิด เว้นแต่ตั้ง `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์ status-reaction รัน

### พูลข้อมูลรับรอง Convex

ทั้ง lane ของ Telegram และ Discord สามารถเช่าข้อมูลรับรองจากพูล Convex ที่ใช้ร่วมกันแทนการอ่าน env vars ด้านบน ส่ง `--credential-source convex` (หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะรับ lease แบบเอกสิทธิ์ ส่ง Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดระบบ ชนิดของพูลคือ `"telegram"` และ `"discord"`

รูปแบบ payload ที่ broker ตรวจสอบใน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`

env vars สำหรับปฏิบัติการและสัญญาของ endpoint broker ของ Convex อยู่ใน [การทดสอบ → ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มีมาก่อนการรองรับ Discord; ความหมายของ broker เหมือนกันสำหรับทั้งสองชนิด)

## seed ที่อิง Repository

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ไฟล์เหล่านี้ตั้งใจให้อยู่ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็น runner markdown ทั่วไป ไฟล์ markdown ของแต่ละสถานการณ์เป็น
แหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- เมทาดาต้าของสถานการณ์
- เมทาดาต้าหมวดหมู่ ความสามารถ lane และความเสี่ยงแบบเลือกได้
- refs ของเอกสารและโค้ด
- ข้อกำหนด Plugin แบบเลือกได้
- แพตช์คอนฟิก Gateway แบบเลือกได้
- `qa-flow` ที่เรียกใช้งานได้

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` สามารถคงเป็นแบบทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ markdown สามารถรวม helper ฝั่ง transport
กับ helper ฝั่งเบราว์เซอร์ที่ควบคุม Control UI แบบฝังผ่าน
seam `browser.request` ของ Gateway ได้ โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนที่จะตามโฟลเดอร์
source tree รักษา ID สถานการณ์ให้คงที่เมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อให้ตรวจสอบย้อนกลับไปยังการนำไปใช้ได้

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และช่อง
- พฤติกรรมของเธรด
- วงจรชีวิตของ action ข้อความ
- callback ของ cron
- การเรียกคืนหน่วยความจำ
- การสลับโมเดล
- การส่งต่อไปยัง subagent
- การอ่าน Repository และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## Lane mock ของผู้ให้บริการ

`qa suite` มี lane mock ของผู้ให้บริการภายในเครื่องสองแบบ:

- `mock-openai` คือ mock ของ OpenClaw ที่รู้จักสถานการณ์ ยังคงเป็น lane mock
  แบบกำหนดผลได้ค่าเดิมสำหรับ QA ที่อิง Repository และ parity gates
- `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่อิง AIMock สำหรับความครอบคลุมของ protocol
  ทดลอง fixture การบันทึก/เล่นซ้ำ และ chaos เป็นส่วนเพิ่มเติมและไม่ได้
  แทนที่ dispatcher สถานการณ์ `mock-openai`

การนำ lane ของผู้ให้บริการไปใช้อยู่ภายใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้นของตนเอง การเริ่มเซิร์ฟเวอร์ภายในเครื่อง คอนฟิกโมเดล Gateway
ความต้องการ staging ของ auth-profile และแฟล็กความสามารถ live/mock โค้ด suite และ
Gateway ที่ใช้ร่วมกันควร route ผ่าน registry ของผู้ให้บริการแทนการ branching ตาม
ชื่อผู้ให้บริการ

## Adapter ของ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับสถานการณ์ QA แบบ markdown `qa-channel` เป็น adapter แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: ช่องจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกันแทนการเพิ่ม QA runner เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งมีดังนี้:

- `qa-lab` เป็นเจ้าของการเรียกใช้สถานการณ์ทั่วไป concurrency ของ worker การเขียนอาร์ติแฟกต์ และการรายงาน
- Adapter ของ transport เป็นเจ้าของคอนฟิก Gateway ความพร้อม การสังเกตการณ์ inbound และ outbound, action ของ transport และสถานะ transport ที่ทำให้เป็นมาตรฐานแล้ว
- ไฟล์สถานการณ์ markdown ภายใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งเรียกใช้ไฟล์เหล่านั้น

### การเพิ่มช่อง

การเพิ่มช่องเข้าในระบบ QA แบบ markdown ต้องมีสองอย่างเท่านั้น:

1. Adapter ของ transport สำหรับช่องนั้น
2. ชุดสถานการณ์ที่ทดสอบสัญญาของช่องนั้น

อย่าเพิ่ม root คำสั่ง QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มและการรื้อถอน suite
- concurrency ของ worker
- การเขียนอาร์ติแฟกต์
- การสร้างรายงาน
- การเรียกใช้สถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Plugin ของ runner เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ไว้ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีคอนฟิก Gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธี inject event inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และสถานะ transport ที่ทำให้เป็นมาตรฐานแล้ว
- วิธีเรียกใช้ action ที่อิง transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการรับช่องใหม่:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกัน
2. นำ transport runner ไปใช้บน seam host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน Plugin ของ runner หรือ harness ของช่อง
4. Mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งขันกัน Plugin ของ runner ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export array `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาไว้; CLI แบบ lazy และการเรียกใช้ runner ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ markdown ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ helper สถานการณ์ทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias ความเข้ากันได้ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ Repository กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นอยู่กับ transport ของช่องหนึ่ง ให้เก็บไว้ใน Plugin ของ runner นั้นหรือ harness ของ Plugin
- หากสถานการณ์ต้องการความสามารถใหม่ที่หลายช่องสามารถใช้ได้ ให้เพิ่ม helper ทั่วไปแทน branch เฉพาะช่องใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport หนึ่งเท่านั้น ให้คงสถานการณ์เป็นแบบเฉพาะ transport และระบุให้ชัดเจนในสัญญาของสถานการณ์

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

Aliases ความเข้ากันได้ยังคงพร้อมใช้งานสำหรับสถานการณ์ที่มีอยู่ — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อทั่วไป Aliases มีไว้เพื่อหลีกเลี่ยงการย้ายแบบเปลี่ยนพร้อมกันทั้งหมด ไม่ใช่เป็นรูปแบบสำหรับอนาคต

## การรายงาน

`qa-lab` ส่งออกรายงานโปรโตคอล Markdown จากไทม์ไลน์ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังคงถูกบล็อก
- สถานการณ์ติดตามผลใดควรค่าแก่การเพิ่ม

สำหรับรายการสถานการณ์ที่พร้อมใช้งาน — มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อมต่อ transport ใหม่ — ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)

สำหรับการตรวจสอบบุคลิกและสไตล์ ให้รันสถานการณ์เดียวกันกับ refs ของโมเดลจริงหลายรายการ
และเขียนรายงาน Markdown ที่ผ่านการตัดสิน:

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

คำสั่งนี้รันโปรเซสลูกของ Gateway QA ภายในเครื่อง ไม่ใช่ Docker สถานการณ์ character eval
ควรกำหนด persona ผ่าน `SOUL.md` แล้วรันเทิร์นผู้ใช้ทั่วไป
เช่น แชต ความช่วยเหลือเกี่ยวกับ workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลผู้สมัคร
ว่ากำลังถูกประเมิน คำสั่งจะเก็บ transcript แบบเต็มแต่ละรายการ
บันทึกสถิติการรันพื้นฐาน จากนั้นขอให้โมเดลผู้ตัดสินในโหมดเร็วพร้อมการให้เหตุผล
`xhigh` เมื่อรองรับ จัดอันดับการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: prompt ของผู้ตัดสินยังคงได้รับ
transcript และสถานะการรันทุกอย่าง แต่ refs ของผู้สมัครจะถูกแทนที่ด้วยป้ายกำกับกลาง
เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง refs จริงหลังการแยกวิเคราะห์
การรันผู้สมัครมีค่าเริ่มต้นเป็นการคิดระดับ `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ refs การประเมิน OpenAI รุ่นเก่าที่รองรับ แทนที่ค่าของผู้สมัครเฉพาะรายแบบ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้งค่า
fallback ส่วนกลาง และรูปแบบเดิม `--model-thinking <provider/model=level>` ยังคง
เก็บไว้เพื่อความเข้ากันได้
refs ผู้สมัครของ OpenAI มีค่าเริ่มต้นเป็นโหมดเร็วเพื่อให้ใช้การประมวลผลแบบ priority ในที่ที่
ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
ผู้สมัครหรือผู้ตัดสินรายเดียวต้องการการแทนที่ ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมดเร็วสำหรับโมเดลผู้สมัครทุกตัว ระยะเวลาของผู้สมัครและผู้ตัดสิน
จะถูกบันทึกไว้ในรายงานสำหรับการวิเคราะห์ benchmark แต่ prompt ของผู้ตัดสินระบุอย่างชัดเจน
ว่าอย่าจัดอันดับตามความเร็ว
การรันโมเดลผู้สมัครและผู้ตัดสินทั้งคู่มีค่าเริ่มต้นเป็น concurrency 16 ลดค่า
`--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดของผู้ให้บริการหรือแรงกดดันต่อ Gateway
ภายในเครื่องทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่ได้ส่ง `--model` ของผู้สมัคร character eval จะมีค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` ผู้ตัดสินจะมีค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Matrix QA](/th/concepts/qa-matrix)
- [ช่อง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
