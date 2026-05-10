---
read_when:
    - ทำความเข้าใจว่า QA stack ประกอบเข้าด้วยกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่งข้อมูล
    - การเพิ่มสถานการณ์ QA ที่อ้างอิงจาก repo
    - การสร้างระบบอัตโนมัติด้านการประกันคุณภาพที่มีความสมจริงสูงขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อ้างอิงรีโพซิทอรี, เลนการขนส่งแบบสด, อะแดปเตอร์การขนส่ง และการรายงาน.'
title: ภาพรวมการประกันคุณภาพ
x-i18n:
    generated_at: "2026-05-10T19:35:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแตก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงกว่าและมีรูปแบบเหมือน channel มากกว่าที่ unit test เพียงรายการเดียวจะทำได้

ชิ้นส่วนปัจจุบัน:

- `extensions/qa-channel`: channel ข้อความสังเคราะห์ที่มีพื้นผิว DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และ QA bus สำหรับสังเกต transcript,
  inject ข้อความขาเข้า และ export รายงาน Markdown
- `extensions/qa-matrix`, Plugin runner ในอนาคต: live-transport adapters ที่
  ขับ channel จริงภายใน child QA gateway
- `qa/`: seed assets ที่อิง repo สำหรับ kickoff task และสถานการณ์ QA พื้นฐาน
- [Mantis](/th/concepts/mantis): การตรวจสอบสดก่อนและหลังสำหรับบั๊กที่ต้องใช้
  transport จริง, screenshot ของเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุก flow ของ QA รันภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี alias script `pnpm qa:*`
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่ bundled มา; เขียนรายงาน Markdown                                                                                                                                                                                                                        |
| `qa suite`                                          | รันสถานการณ์ที่อิง repo กับเลน QA gateway Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                                                                                                  |
| `qa coverage`                                       | พิมพ์ inventory coverage ของสถานการณ์แบบ markdown (`--json` สำหรับเอาต์พุตให้เครื่องอ่าน)                                                                                                                                                                                           |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic                                                                                                                                                                                          |
| `qa character-eval`                                 | รันสถานการณ์ character QA ข้ามโมเดลสดหลายตัวพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                                                                                                                            |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                                                                                                                          |
| `qa ui`                                             | เริ่ม QA debugger UI และ local QA bus (alias: `pnpm qa:lab:ui`)                                                                                                                                                                                                    |
| `qa docker-build-image`                             | build image Docker QA ที่ prebake ไว้                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | เขียน docker-compose scaffold สำหรับ dashboard QA + เลน Gateway                                                                                                                                                                                                    |
| `qa up`                                             | build ไซต์ QA, เริ่มสแตกที่ใช้ Docker รองรับ, พิมพ์ URL (alias: `pnpm qa:lab:up`; variant `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                                                                                                  |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการ pool credential Convex ที่ใช้ร่วมกัน                                                                                                                                                                                                                               |
| `qa matrix`                                         | เลน live transport กับ Tuwunel homeserver แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                                                                                                      |
| `qa telegram`                                       | เลน live transport กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                                                                                              |
| `qa discord`                                        | เลน live transport กับ channel guild Discord ส่วนตัวจริง                                                                                                                                                                                                       |
| `qa slack`                                          | เลน live transport กับ channel Slack ส่วนตัวจริง                                                                                                                                                                                                               |
| `qa mantis`                                         | runner ตรวจสอบก่อนและหลังสำหรับบั๊ก live transport พร้อมหลักฐาน status-reactions ของ Discord, smoke desktop/browser ของ Crabbox และ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) และ [Mantis Slack Desktop Runbook](/th/concepts/mantis-slack-desktop-runbook) |

## Flow ของ operator

Flow operator QA ปัจจุบันเป็นไซต์ QA แบบสอง pane:

- ซ้าย: Dashboard ของ Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดง transcript แบบ Slack-ish และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้ build ไซต์ QA, เริ่มเลน gateway ที่ Docker รองรับ และเปิดหน้า
QA Lab ที่ operator หรือ automation loop สามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรม channel จริง และบันทึกสิ่งที่ทำงาน ล้มเหลว หรือ
ยังถูกบล็อกอยู่ได้

สำหรับการ iterate UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้อง rebuild Docker image ทุกครั้ง
ให้เริ่มสแตกด้วย bundle QA Lab ที่ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บน image ที่ build ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปใน container `qa-lab` `qa:lab:watch`
rebuild bundle นั้นเมื่อมีการเปลี่ยนแปลง และ browser จะ reload อัตโนมัติเมื่อ hash ของ asset QA Lab
เปลี่ยน

สำหรับ trace smoke OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

script นั้นเริ่ม OTLP/HTTP trace receiver ในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel`, จากนั้น
decode protobuf spans ที่ export แล้ว assert รูปทรงที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model calls ต้องไม่ export `StreamAbandoned` ใน turn ที่สำเร็จ; diagnostic IDs ดิบและ
attributes `openclaw.content.*` ต้องไม่อยู่ใน trace คำสั่งนี้เขียน
`otel-smoke-summary.json` ถัดจาก artifacts ของ QA suite

Observability QA ยังคงเป็น source-checkout เท่านั้น npm tarball ตั้งใจละเว้น
QA Lab ดังนั้นเลน release Docker ของ package จะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน instrumentation
diagnostics

สำหรับเลน smoke Matrix ที่เป็น transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

CLI reference ฉบับเต็ม, catalog profile/scenario, env vars และ layout artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: คำสั่งนี้ provision Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker, register ผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Plugin Matrix จริงภายใน child QA gateway ที่จำกัด scope เฉพาะ transport นั้น (ไม่มี `qa-channel`), จากนั้นเขียนรายงาน Markdown, summary JSON, artifact observed-events และ log output รวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สถานการณ์ครอบคลุมพฤติกรรม transport ที่ unit tests ไม่สามารถพิสูจน์ได้ครบตั้งแต่ต้นจนจบ: mention gating, นโยบาย allow-bot, allowlists, reply ระดับบนสุดและแบบ threaded, การ route DM, การจัดการ reaction, การ suppress inbound edit, dedupe replay หลัง restart, การกู้คืนจากการขัดจังหวะ homeserver, การส่ง metadata การอนุมัติ, การจัดการ media และ flow bootstrap/recovery/verification ของ Matrix E2EE โปรไฟล์ CLI ของ E2EE ยังขับคำสั่ง `openclaw matrix encryption setup` และคำสั่ง verification ผ่าน homeserver แบบใช้แล้วทิ้งเดียวกันก่อนตรวจสอบ reply ของ gateway

Discord ยังมีสถานการณ์ opt-in เฉพาะ Mantis สำหรับการทำซ้ำบั๊ก ใช้
`--scenario discord-status-reactions-tool-only` สำหรับ timeline status reaction
ที่ชัดเจน หรือ `--scenario discord-thread-reply-filepath-attachment` เพื่อสร้าง
thread Discord จริงและตรวจสอบว่า `message.thread-reply` รักษา attachment
`filePath` ไว้ สถานการณ์เหล่านี้ไม่อยู่ในเลน Discord สดเริ่มต้น
เพราะเป็น probe repro ก่อน/หลังมากกว่าครอบคลุม smoke แบบกว้าง
Workflow Mantis ของ thread-attachment ยังสามารถเพิ่มวิดีโอ witness จาก Discord Web
ที่ login แล้วได้เมื่อกำหนดค่า `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` หรือ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ในสภาพแวดล้อม QA
profile viewer นั้นใช้สำหรับการจับภาพเท่านั้น; การตัดสิน pass/fail
ยังมาจาก oracle Discord REST

CI ใช้พื้นผิวคำสั่งเดียวกันใน `.github/workflows/qa-live-transports-convex.yml` การรันตาม schedule และ manual เริ่มต้นจะ execute profile Matrix แบบ fast พร้อม credential frontier สด, `--fast` และ `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ส่วน manual `matrix_profile=all` จะ fan out เป็น shard profile ห้ารายการ เพื่อให้ catalog แบบ exhaustive รันขนานกันได้โดยยังคงมี directory artifact หนึ่งรายการต่อ shard

สำหรับเลน smoke Telegram, Discord และ Slack ที่เป็น transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

เลนเหล่านี้ target channel จริงที่มีอยู่แล้วพร้อมบอทสองตัว (driver + SUT) env vars ที่ต้องใช้, รายการสถานการณ์, artifacts เอาต์พุต และ pool credential Convex มีเอกสารอยู่ใน [reference QA สำหรับ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

สำหรับการรัน VM เดสก์ท็อป Slack แบบเต็มพร้อมการช่วยเหลือผ่าน VNC ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นจะเช่าเครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox, รันเลน Slack แบบสด
ภายใน VM, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อป และ
คัดลอก `slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
เมื่อมีการจับวิดีโอได้ กลับไปยังไดเรกทอรีอาร์ติแฟกต์ของ Mantis การเช่า
เดสก์ท็อป/เบราว์เซอร์ของ Crabbox มีเครื่องมือจับภาพและแพ็กเกจตัวช่วย
สำหรับเบราว์เซอร์/เนทีฟบิลด์เตรียมไว้ล่วงหน้า ดังนั้นสถานการณ์ควรติดตั้ง
fallback เฉพาะบน lease รุ่นเก่าเท่านั้น Mantis รายงานเวลารวมและเวลารายเฟสใน
`mantis-slack-desktop-smoke-report.md` เพื่อให้การรันที่ช้าแสดงได้ว่าเวลาใช้ไปกับ
การอุ่น lease, การรับข้อมูลรับรอง, การตั้งค่าระยะไกล หรือการคัดลอกอาร์ติแฟกต์ ใช้ซ้ำ
`--lease-id <cbx_...>` หลังจากล็อกอินเข้า Slack Web ด้วยตนเองผ่าน VNC;
lease ที่ใช้ซ้ำยังทำให้แคช pnpm store ของ Crabbox อุ่นอยู่ด้วย ค่าเริ่มต้น
`--hydrate-mode source` ตรวจสอบจาก source checkout และรัน install/build
ภายใน VM ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace ระยะไกลที่ใช้ซ้ำ
มี `node_modules` และ `dist/` ที่บิลด์แล้วอยู่แล้วเท่านั้น โหมดนั้นจะข้ามขั้นตอน
install/build ที่ใช้เวลามาก และล้มเหลวแบบปิดเมื่อ workspace ยังไม่พร้อม
เมื่อใช้ `--gateway-setup` Mantis จะปล่อย Gateway OpenClaw Slack แบบคงอยู่
ให้รันภายใน VM บนพอร์ต `38973`; หากไม่ใช้ คำสั่งจะรันเลน Slack QA
แบบบอตถึงบอตตามปกติ และออกหลังจากจับอาร์ติแฟกต์แล้ว

เช็กลิสต์ของผู้ปฏิบัติงาน, คำสั่ง dispatch ของ GitHub workflow, สัญญา
คอมเมนต์หลักฐาน, ตารางตัดสินใจ hydrate-mode, การตีความเวลา และขั้นตอน
จัดการความล้มเหลวอยู่ใน [Runbook เดสก์ท็อป Mantis Slack](/th/concepts/mantis-slack-desktop-runbook)

สำหรับงานเดสก์ท็อปสไตล์ agent/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` จะเช่าหรือใช้เครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox ซ้ำ, เริ่ม
`crabbox record --while`, ควบคุมเบราว์เซอร์ที่มองเห็นได้ผ่าน
`visual-driver` แบบซ้อน, จับภาพ `visual-task.png`, รัน `openclaw infer image describe`
กับภาพหน้าจอเมื่อเลือก `--vision-mode image-describe` และเขียน
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` พรอมป์ด้านการมองเห็นจะขอ verdict แบบ JSON ที่มีโครงสร้าง
และผ่านเฉพาะเมื่อโมเดลรายงานหลักฐานที่มองเห็นได้ในเชิงบวกเท่านั้น
คำตอบเชิงลบที่เพียงอ้างข้อความเป้าหมายจะทำให้ assertion ล้มเหลว
ใช้ `--vision-mode metadata` สำหรับ smoke แบบไม่ใช้โมเดลที่พิสูจน์ระบบเชื่อมต่อ
เดสก์ท็อป, เบราว์เซอร์, ภาพหน้าจอ และวิดีโอ โดยไม่เรียก provider
ด้านความเข้าใจภาพ การบันทึกเป็นอาร์ติแฟกต์ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox
ไม่บันทึก `visual-task.mp4` ที่ไม่ว่าง งานจะล้มเหลวแม้ visual driver
จะผ่านแล้วก็ตาม เมื่อล้มเหลว Mantis จะเก็บ lease ไว้สำหรับ VNC เว้นแต่งานนั้น
ผ่านไปแล้วและไม่ได้ตั้ง `--keep-lease`

ก่อนใช้ข้อมูลรับรองสดแบบพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor จะตรวจสอบ env ของ Convex broker, ตรวจสอบความถูกต้องของการตั้งค่า endpoint และตรวจสอบการเข้าถึง admin/list เมื่อมี maintainer secret อยู่ โดยจะรายงานเฉพาะสถานะตั้งค่าแล้ว/ขาดหายสำหรับ secret เท่านั้น

## ความครอบคลุมของ transport แบบสด

เลน transport แบบสดใช้สัญญาเดียวร่วมกัน แทนที่แต่ละเลนจะประดิษฐ์รูปแบบรายการสถานการณ์ของตนเอง `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบสังเคราะห์ที่กว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุมของ transport แบบสด

| เลน      | Canary | การกั้นด้วยการเมนชัน | บอตถึงบอต | การบล็อก allowlist | การตอบกลับระดับบนสุด | ดำเนินต่อหลังรีสตาร์ต | การติดตามผลในเธรด | การแยกเธรด | การสังเกต reaction | คำสั่งช่วยเหลือ | การลงทะเบียนคำสั่งเนทีฟ |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

สิ่งนี้คงให้ `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์ที่กว้าง ขณะที่ Matrix,
Telegram และ transport แบบสดในอนาคตใช้เช็กลิสต์สัญญา transport
ที่ชัดเจนร่วมกัน

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่ดึง Docker เข้ามาในพาธ QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest Multipass ใหม่, ติดตั้ง dependency, บิลด์ OpenClaw
ภายใน guest, รัน `qa suite` จากนั้นคัดลอกรายงาน QA และ
สรุปตามปกติกลับมายัง `.artifacts/qa-e2e/...` บน host
คำสั่งนี้ใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บน host
การรันชุดทดสอบบน Host และ Multipass จะดำเนินสถานการณ์ที่เลือกหลายรายการแบบขนาน
ด้วย gateway worker ที่แยกกันโดยค่าเริ่มต้น `qa-channel` ตั้งค่าเริ่มต้นเป็น concurrency
4 โดยจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการรันแบบอนุกรม
คำสั่งจะออกด้วย non-zero เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการอาร์ติแฟกต์โดยไม่ให้ exit code ล้มเหลว
การรันแบบสดจะส่งต่ออินพุต auth ของ QA ที่รองรับและเหมาะกับ
guest ได้แก่ key ของ provider ที่อิง env, พาธ config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ root ของ repo เพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount อยู่ได้

## อ้างอิง QA สำหรับ Telegram, Discord และ Slack

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เพราะมีจำนวนสถานการณ์มากและการจัดเตรียม homeserver ที่รองรับด้วย Docker Telegram, Discord และ Slack มีขนาดเล็กกว่า - แต่ละรายการมีสถานการณ์เพียงไม่กี่รายการ, ไม่มีระบบโปรไฟล์, ทดสอบกับช่องจริงที่มีอยู่ก่อน - ดังนั้นอ้างอิงของรายการเหล่านี้จึงอยู่ที่นี่

### flag CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับ flag เดียวกัน:

| Flag                                  | ค่าเริ่มต้น                                                     | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตได้และ output log พาธสัมพัทธ์จะ resolve กับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | root ของ repository เมื่อเรียกจาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | id บัญชีชั่วคราวภายใน config ของ QA Gateway                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (`live-openai` แบบ legacy ยังใช้งานได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                        | ref ของโมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                            | โหมดเร็วของ provider เมื่อรองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [พูลข้อมูลรับรอง Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                              | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

แต่ละเลนจะออกด้วย non-zero เมื่อสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้ง exit code ที่ล้มเหลว

### Telegram QA

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแตกต่างกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอตถึงบอตทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้งาน **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อความข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตได้ (ค่าเริ่มต้นจะปกปิด)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

ชุดค่าเริ่มต้นโดยนัยครอบคลุม canary, การกั้นด้วยการเมนชัน, การตอบกลับคำสั่งเนทีฟ, การระบุที่อยู่คำสั่ง และการตอบกลับกลุ่มแบบบอตถึงบอตเสมอ ค่าเริ่มต้นของ `mock-openai` ยังรวมการตรวจสอบ reply-chain แบบ deterministic และการสตรีม final-message ด้วย `telegram-current-session-status-tool` ยังคงเป็นแบบ opt-in เพราะจะเสถียรเฉพาะเมื่อเธรดต่อจาก canary โดยตรง ไม่ใช่หลังจากการตอบกลับคำสั่งเนทีฟใดๆ ใช้ `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` เพื่อพิมพ์การแบ่งค่าเริ่มต้น/ตัวเลือกเสริมปัจจุบันพร้อม ref ของ regression

อาร์ติแฟกต์ผลลัพธ์:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตเห็นการตอบกลับ SUT) เริ่มจาก canary
- `telegram-qa-observed-messages.json` - เนื้อความถูกปกปิด เว้นแต่ตั้ง `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### Discord QA

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปยังช่อง guild ส่วนตัวจริงหนึ่งช่องใน Discord ที่มีบอตสองตัว: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย child OpenClaw Gateway ผ่าน Plugin Discord ที่ bundled มา ตรวจสอบการจัดการการเมนชันช่อง, ว่าบอต SUT ได้ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - ต้องตรงกับรหัสผู้ใช้บอท SUT ที่ Discord ส่งคืนมา (ไม่เช่นนั้นเลนจะล้มเหลวอย่างรวดเร็ว)

ไม่บังคับ:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตพบ
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` เลือกช่องเสียง/เวทีสำหรับ `discord-voice-autojoin`; หากไม่มีค่านี้ สถานการณ์จะเลือกช่องเสียง/เวทีแรกที่มองเห็นได้สำหรับบอท SUT

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - สถานการณ์เสียงแบบเลือกใช้ รันโดยลำพัง เปิดใช้ `channels.discord.voice.autoJoin` และตรวจสอบว่าสถานะเสียง Discord ปัจจุบันของบอท SUT คือช่องเสียง/เวทีเป้าหมาย ข้อมูลรับรอง Convex Discord อาจมี `voiceChannelId` แบบไม่บังคับ; มิฉะนั้นตัวรันจะค้นหาช่องเสียง/เวทีแรกที่มองเห็นได้ในกิลด์
- `discord-status-reactions-tool-only` - สถานการณ์ Mantis แบบเลือกใช้ รันโดยลำพังเพราะจะสลับ SUT เป็นการตอบกลับกิลด์แบบเปิดตลอดเวลาและใช้เครื่องมือเท่านั้นด้วย `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์รีแอ็กชัน REST พร้อมอาร์ติแฟกต์ภาพ HTML/PNG รายงานก่อน/หลังของ Mantis ยังเก็บอาร์ติแฟกต์ MP4 ที่สถานการณ์ให้มาเป็น `baseline.mp4` และ `candidate.mp4` ด้วย

รันสถานการณ์เข้าร่วมเสียง Discord อัตโนมัติอย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

รันสถานการณ์รีแอ็กชันสถานะของ Mantis อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

อาร์ติแฟกต์เอาต์พุต:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - เนื้อหาจะถูกปกปิด เว้นแต่ตั้งค่า `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์รีแอ็กชันสถานะรัน

### QA ของ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายเป็นช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอทต่างกันสองตัว: บอทไดรเวอร์ที่ควบคุมโดยฮาร์เนส และบอท SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Slack ที่รวมมาให้

ตัวแปรสภาพแวดล้อมที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ไม่บังคับ:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตพบ

สถานการณ์ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

อาร์ติแฟกต์เอาต์พุต:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - เนื้อหาจะถูกปกปิด เว้นแต่ตั้งค่า `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

#### การตั้งค่าเวิร์กสเปซ Slack

เลนนี้ต้องใช้แอป Slack สองแอปที่แยกกันในเวิร์กสเปซเดียวกัน พร้อมช่องที่บอททั้งสองเป็นสมาชิก:

- `channelId` - รหัส `Cxxxxxxxxxx` ของช่องที่เชิญบอททั้งสองเข้าแล้ว ใช้ช่องเฉพาะ; เลนจะโพสต์ทุกครั้งที่รัน
- `driverBotToken` - โทเค็นบอท (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` - โทเค็นบอท (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกต่างหากจากไดรเวอร์ เพื่อให้รหัสผู้ใช้บอทแตกต่างกัน
- `sutAppToken` - โทเค็นระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับเหตุการณ์ได้

ควรใช้เวิร์กสเปซ Slack ที่แยกไว้สำหรับ QA มากกว่าการใช้เวิร์กสเปซการผลิตซ้ำ

แมนิเฟสต์ SUT ด้านล่างตั้งใจจำกัดการติดตั้งการผลิตของ Plugin Slack ที่รวมมาให้ (`extensions/slack/src/setup-shared.ts:10`) ให้เหลือสิทธิ์และเหตุการณ์ที่ครอบคลุมโดยชุด QA Slack สด สำหรับการตั้งค่าช่องการผลิตตามที่ผู้ใช้เห็น โปรดดู [การตั้งค่าช่อง Slack อย่างรวดเร็ว](/th/channels/slack#quick-setup); คู่ QA Driver/SUT แยกไว้โดยตั้งใจ เพราะเลนต้องใช้รหัสผู้ใช้บอทสองรหัสที่แตกต่างกันในเวิร์กสเปซเดียว

**1. สร้างแอป Driver**

ไปที่ [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → เลือกเวิร์กสเปซ QA วางแมนิเฟสต์ต่อไปนี้ แล้วเลือก _Install to Workspace_:

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) - ค่านี้จะกลายเป็น `driverBotToken` ไดรเวอร์ต้องใช้เพียงเพื่อโพสต์ข้อความและระบุตัวเองเท่านั้น; ไม่มีเหตุการณ์ ไม่มี Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _Create New App → From a manifest_ ในเวิร์กสเปซเดียวกัน แอป QA นี้ตั้งใจใช้เวอร์ชันที่แคบกว่าของแมนิเฟสต์การผลิตของ Plugin Slack ที่รวมมาให้ (`extensions/slack/src/setup-shared.ts:10`): ละเว้นขอบเขตและเหตุการณ์ของรีแอ็กชัน เพราะชุด QA Slack สดยังไม่ครอบคลุมการจัดการรีแอ็กชัน

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
        "pin_removed"
      ]
    }
  }
}
```

หลังจาก Slack สร้างแอปแล้ว ให้ทำสองอย่างในหน้าการตั้งค่าของแอป:

- _Install to Workspace_ → คัดลอก _Bot User OAuth Token_ → ค่านี้จะกลายเป็น `sutBotToken`
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → เพิ่มขอบเขต `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านี้จะกลายเป็น `sutAppToken`

ตรวจสอบว่าบอททั้งสองมีรหัสผู้ใช้แตกต่างกันโดยเรียก `auth.test` กับแต่ละโทเค็น รันไทม์แยกไดรเวอร์และ SUT ด้วยรหัสผู้ใช้; การใช้แอปเดียวกันซ้ำสำหรับทั้งสองฝั่งจะทำให้ mention-gating ล้มเหลวทันที

**3. สร้างช่อง**

ในเวิร์กสเปซ QA ให้สร้างช่องหนึ่งช่อง (เช่น `#openclaw-qa`) และเชิญบอททั้งสองจากภายในช่อง:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอกรหัส `Cxxxxxxxxxx` จาก _channel info → About → Channel ID_ - ค่านี้จะกลายเป็น `channelId` ช่องสาธารณะใช้ได้; หากคุณใช้ช่องส่วนตัว แอปทั้งสองมี `groups:history` อยู่แล้ว ดังนั้นการอ่านประวัติของฮาร์เนสจะยังสำเร็จ

**4. ลงทะเบียนข้อมูลรับรอง**

มีสองตัวเลือก ใช้ตัวแปรสภาพแวดล้อมสำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือเติมพูล Convex ที่ใช้ร่วมกันเพื่อให้ CI และผู้ดูแลคนอื่นยืมใช้ได้

สำหรับพูล Convex ให้เขียนฟิลด์ทั้งสี่ลงในไฟล์ JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

เมื่อส่งออก `OPENCLAW_QA_CONVEX_SITE_URL` และ `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ในเชลล์แล้ว ให้ลงทะเบียนและตรวจสอบ:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

คาดหวัง `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบตั้งแต่ต้นจนจบ**

รันเลนในเครื่องเพื่อยืนยันว่าบอททั้งสองคุยกันผ่านโบรกเกอร์ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านจะเสร็จภายในเวลาไม่ถึง 30 วินาทีอย่างมาก และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` ที่สถานะ `pass` หากเลนค้างประมาณ 90 วินาทีและออกด้วย `Convex credential pool exhausted for kind "slack"` แสดงว่าพูลว่างหรือทุกแถวถูกยืมอยู่ - `qa credentials list --kind slack --status all --json` จะบอกได้ว่าเป็นกรณีใด

### พูลข้อมูลรับรอง Convex

เลน Telegram, Discord, Slack และ WhatsApp สามารถยืมข้อมูลรับรองจากพูล Convex ที่ใช้ร่วมกันแทนการอ่านตัวแปรสภาพแวดล้อมด้านบน ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอสิทธิ์เช่าแบบเอกสิทธิ์ ส่ง Heartbeat ตลอดระยะเวลาการรัน และปล่อยสิทธิ์เมื่อปิดการทำงาน ชนิดของพูลคือ `"telegram"`, `"discord"`, `"slack"` และ `"whatsapp"`

รูปแบบเพย์โหลดที่โบรกเกอร์ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` ต้องเป็นสตริงรหัสแชตแบบตัวเลข
- ผู้ใช้จริงของ Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - สิทธิ์เช่าบัญชีใช้งานชั่วคราวแบบเอกสิทธิ์หนึ่งรายการที่ใช้ร่วมกันโดยทั้งไดรเวอร์ CLI ของ TDLib และพยานภาพจาก Telegram Desktop
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - หมายเลขโทรศัพท์ต้องเป็นสตริง E.164 ที่แตกต่างกัน

สำหรับหลักฐาน Telegram แบบผู้ใช้จริงเชิงภาพ ควรใช้เซสชัน Crabbox ที่คงไว้:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` ถือสิทธิ์เช่า Convex `telegram-user` แบบเอกสิทธิ์หนึ่งรายการสำหรับทั้งไดรเวอร์ CLI ของ TDLib
และพยานจาก Telegram Desktop เริ่มการบันทึกเดสก์ท็อป และคง Crabbox ไว้ให้ใช้งาน
สำหรับขั้นตอนจำลองปัญหาที่ขับเคลื่อนโดยเอเจนต์ได้ตามต้องการ เอเจนต์สามารถใช้ `send`,
`run`, `screenshot` และ `status` จนกว่าจะพอใจ จากนั้น `finish`
จะรวบรวมภาพหน้าจอ วิดีโอ วิดีโอ/GIF ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว เอาต์พุตโพรบของ TDLib
และล็อกก่อนปล่อยข้อมูลรับรอง `publish --session <file> --pr
<number>` จะแสดงความคิดเห็นเฉพาะ GIF การเคลื่อนไหวโดยค่าเริ่มต้น; `--full-artifacts` เป็นการเลือกใช้
อย่างชัดเจนสำหรับล็อกและเอาต์พุต JSON คำสั่ง `probe` เริ่มต้นยังคงเป็น
คำย่อแบบคำสั่งเดียวสำหรับการตรวจสอบ smoke `/status` อย่างรวดเร็ว

ใช้ `--mock-response-file <path>` เมื่อ PR ต้องการ visual diff ที่กำหนดซ้ำได้:
สามารถรันคำตอบจำลองของโมเดลชุดเดียวกันบน `main` และบนหัวของ PR ได้ ในขณะที่
ตัวจัดรูปแบบ Telegram หรือชั้นการส่งเปลี่ยนแปลง ค่าเริ่มต้นของการบันทึกถูกปรับไว้สำหรับคอมเมนต์ PR:
คลาส Crabbox มาตรฐาน, การบันทึกเดสก์ท็อป 24fps, GIF การเคลื่อนไหว 24fps และ
ความกว้างพรีวิว 1920px คอมเมนต์ก่อน/หลังควรเผยแพร่ชุดไฟล์ที่สะอาดซึ่ง
มีเฉพาะ GIF ที่ตั้งใจไว้เท่านั้น

เลน Slack สามารถใช้พูลได้เช่นกัน การตรวจรูปร่าง payload ของ Slack ปัจจุบันอยู่ในตัวรัน QA ของ Slack แทนที่จะอยู่ใน broker; ใช้ `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` พร้อม id ช่อง Slack เช่น `Cxxxxxxxxxx` ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและ scope

ตัวแปรสภาพแวดล้อมด้านปฏิบัติการและสัญญา endpoint ของ Convex broker อยู่ใน [การทดสอบ → ข้อมูลประจำตัว Telegram ที่แชร์ผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มาก่อนพูลหลายช่องทาง; semantics ของ lease ใช้ร่วมกันในทุกชนิด)

## seed ที่อิง repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ไฟล์เหล่านี้จงใจอยู่ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็นตัวรัน markdown ทั่วไป ไฟล์ markdown ของแต่ละ scenario เป็น
แหล่งความจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของ scenario
- metadata ของหมวดหมู่ ความสามารถ เลน และความเสี่ยงที่เป็นทางเลือก
- refs ของเอกสารและโค้ด
- ข้อกำหนด Plugin ที่เป็นทางเลือก
- patch การกำหนดค่า Gateway ที่เป็นทางเลือก
- `qa-flow` ที่รันได้

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` ได้รับอนุญาตให้คงความทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น scenario แบบ markdown สามารถรวม helper ฝั่ง transport
เข้ากับ helper ฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน seam
Gateway `browser.request` โดยไม่ต้องเพิ่ม runner เฉพาะกรณี

ไฟล์ scenario ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนที่จะจัดตามโฟลเดอร์
source tree รักษา ID ของ scenario ให้เสถียรเมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการติดตามกลับไปยัง implementation

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และแชตช่อง
- พฤติกรรม thread
- lifecycle ของ action ข้อความ
- callback ของ cron
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่อให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของ provider

`qa suite` มีเลน mock ของ provider แบบ local สองเลน:

- `mock-openai` คือ mock ของ OpenClaw ที่รู้จัก scenario ยังคงเป็นเลน mock
  แบบ deterministic เริ่มต้นสำหรับ QA ที่อิง repo และ parity gate
- `aimock` เริ่มเซิร์ฟเวอร์ provider ที่อิง AIMock สำหรับ protocol เชิงทดลอง,
  fixture, record/replay และ chaos coverage เป็นส่วนเสริมและไม่ได้
  แทนที่ตัวแจกจ่าย scenario `mock-openai`

implementation ของเลน provider อยู่ใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตนเอง, การเริ่มเซิร์ฟเวอร์ local, config โมเดลของ Gateway,
ความต้องการ staging ของ auth-profile และ flag ความสามารถแบบ live/mock โค้ดของ suite และ
Gateway ที่ใช้ร่วมกันควร route ผ่าน registry ของ provider แทนการแตก branch ตาม
ชื่อ provider

## adapter ของ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับ scenario QA แบบ markdown `qa-channel` เป็น adapter แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: ช่องทางจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกันแทนที่จะเพิ่ม runner QA เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการรัน scenario ทั่วไป, concurrency ของ worker, การเขียน artifact และการรายงาน
- adapter ของ transport เป็นเจ้าของ config ของ Gateway, readiness, การสังเกต inbound และ outbound, action ของ transport และสถานะ transport ที่ normalize แล้ว
- ไฟล์ scenario แบบ markdown ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` จัดเตรียมพื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรันไฟล์เหล่านั้น

### การเพิ่มช่องทาง

การเพิ่มช่องทางเข้าในระบบ QA แบบ markdown ต้องการเพียงสองสิ่ง:

1. adapter ของ transport สำหรับช่องทางนั้น
2. ชุด scenario ที่ทดสอบสัญญาของช่องทางนั้น

อย่าเพิ่ม root คำสั่ง QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มและ teardown ของ suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การรัน scenario
- alias ความเข้ากันได้สำหรับ scenario `qa-channel` รุ่นเก่า

Plugin ของ runner เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า Gateway สำหรับ transport นั้น
- วิธีตรวจ readiness
- วิธี inject event inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalize แล้ว
- วิธีรัน action ที่อิง transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำสำหรับการนำช่องทางใหม่มาใช้:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกัน
2. implement runner ของ transport บน seam host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน Plugin runner หรือ harness ของช่องทาง
4. mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งกัน Plugin runner ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export array `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` รักษา `runtime-api.ts` ให้เบา; CLI แบบ lazy และการรัน runner ควรอยู่หลัง entrypoint แยกกัน
5. เขียนหรือปรับ scenario markdown ใต้ไดเรกทอรี `qa/scenarios/` ที่แบ่งตาม theme
6. ใช้ helper scenario ทั่วไปสำหรับ scenario ใหม่
7. รักษา alias ความเข้ากันได้เดิมให้ยังทำงาน เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงครั้งเดียวใน `qa-lab` ได้ ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ transport ของช่องทางหนึ่ง ให้เก็บไว้ใน Plugin runner หรือ harness ของ Plugin นั้น
- หาก scenario ต้องการความสามารถใหม่ที่มากกว่าหนึ่งช่องทางใช้ได้ ให้เพิ่ม helper ทั่วไปแทน branch เฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport หนึ่งเท่านั้น ให้คง scenario เป็นแบบเฉพาะ transport และทำให้ชัดเจนในสัญญา scenario

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

alias ความเข้ากันได้ยังคงมีให้ใช้สำหรับ scenario ที่มีอยู่ - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - แต่การเขียน scenario ใหม่ควรใช้ชื่อทั่วไป alias เหล่านี้มีไว้เพื่อหลีกเลี่ยง migration แบบ flag-day ไม่ใช่รูปแบบที่จะใช้ต่อไป

## การรายงาน

`qa-lab` export รายงาน protocol แบบ Markdown จาก timeline ของ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อก
- scenario ติดตามผลใดที่ควรเพิ่ม

สำหรับ inventory ของ scenario ที่มีอยู่ - มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อม transport ใหม่ - ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)

สำหรับการตรวจ character และ style ให้รัน scenario เดียวกันกับ ref ของโมเดล live หลายรายการ
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

คำสั่งนี้รัน process ลูกของ QA gateway แบบ local ไม่ใช่ Docker scenario สำหรับ character eval
ควรกำหนด persona ผ่าน `SOUL.md` แล้วรัน turn ของผู้ใช้ตามปกติ
เช่น แชต, ความช่วยเหลือใน workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดล candidate
ว่ากำลังถูกประเมิน คำสั่งจะเก็บ transcript ฉบับเต็มของแต่ละรายการ,
บันทึกสถิติการรันพื้นฐาน แล้วถามโมเดล judge ในโหมด fast พร้อม
reasoning `xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ, vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ provider: prompt ของ judge ยังคงได้
ทุก transcript และสถานะการรัน แต่ ref ของ candidate จะถูกแทนด้วย label กลาง
เช่น `candidate-01`; รายงานจะ map อันดับกลับไปยัง ref จริงหลังจาก
parse แล้ว
การรัน candidate มีค่าเริ่มต้นเป็น thinking `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ ref eval ของ OpenAI รุ่นเก่าที่รองรับ override candidate เฉพาะรายการแบบ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้งค่า
fallback ทั่วโลก และรูปแบบเก่า `--model-thinking <provider/model=level>` ถูก
เก็บไว้เพื่อความเข้ากันได้
ref candidate ของ OpenAI มีค่าเริ่มต้นเป็นโหมด fast เพื่อใช้ priority processing ในที่ที่
provider รองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
candidate หรือ judge รายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast สำหรับโมเดล candidate ทุกตัว ระยะเวลาของ candidate และ judge
ถูกบันทึกไว้ในรายงานสำหรับการวิเคราะห์ benchmark แต่ prompt ของ judge ระบุอย่างชัดเจน
ว่าอย่าจัดอันดับตามความเร็ว
การรันโมเดล candidate และ judge ทั้งคู่มีค่าเริ่มต้นเป็น concurrency 16 ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อ limit ของ provider หรือแรงกดบน Gateway
local ทำให้การรันมี noise มากเกินไป
เมื่อไม่ได้ส่ง candidate `--model` character eval จะมีค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` judge จะมีค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Matrix QA](/th/concepts/qa-matrix)
- [ช่อง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [Dashboard](/th/web/dashboard)
