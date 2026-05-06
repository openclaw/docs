---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่งข้อมูล
    - การเพิ่มสถานการณ์ QA ที่ใช้คลังโค้ดรองรับ
    - การสร้างระบบอัตโนมัติด้านการประกันคุณภาพที่สมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแตก QA: qa-lab, qa-channel, สถานการณ์ที่รองรับด้วยรีโพ, เลนการขนส่งแบบสด, อะแดปเตอร์การขนส่ง และการรายงาน'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-05-06T09:10:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแตก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงและมีลักษณะเหมือนช่องทางมากกว่าที่ unit test เดี่ยวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์พร้อมพื้นผิว DM, ช่องทาง, เธรด,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin ตัวรันเนอร์ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับเคลื่อนช่องทางจริงภายใน QA gateway ลูก
- `qa/`: แอสเซ็ต seed ที่ผูกกับรีโปสำหรับงาน kickoff และสถานการณ์ QA
  พื้นฐาน
- [Mantis](/th/concepts/mantis): การยืนยันแบบ live ก่อนและหลังสำหรับบั๊กที่
  ต้องใช้ transport จริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA รันภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check ของ QA ที่บันเดิลมา; เขียนรายงาน Markdown                                                                                                                                                                                                                        |
| `qa suite`                                          | รันสถานการณ์ที่ผูกกับรีโปกับเลน QA gateway Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                                                                                                  |
| `qa coverage`                                       | พิมพ์ inventory ความครอบคลุมสถานการณ์แบบ markdown (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                                                                                                                           |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน agentic parity                                                                                                                                                                                          |
| `qa character-eval`                                 | รันสถานการณ์ character QA ข้ามโมเดล live หลายตัวพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                                                                                                                            |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลนผู้ให้บริการ/โมเดลที่เลือก                                                                                                                                                                                                          |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                                                                                                                    |
| `qa docker-build-image`                             | สร้างอิมเมจ QA Docker ที่เตรียมไว้ล่วงหน้า                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                                                                                                                    |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแตกที่รองรับด้วย Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; variant `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                                                                                                  |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูล credential Convex ที่ใช้ร่วมกัน                                                                                                                                                                                                                               |
| `qa matrix`                                         | เลน transport แบบ live กับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                                                                                                      |
| `qa telegram`                                       | เลน transport แบบ live กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                                                                                              |
| `qa discord`                                        | เลน transport แบบ live กับช่อง guild ของ Discord ส่วนตัวจริง                                                                                                                                                                                                       |
| `qa slack`                                          | เลน transport แบบ live กับช่อง Slack ส่วนตัวจริง                                                                                                                                                                                                               |
| `qa mantis`                                         | ตัวรันการยืนยันก่อนและหลังสำหรับบั๊ก transport แบบ live พร้อมหลักฐาน status-reactions ของ Discord, smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox และ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) และ [Mantis Slack Desktop Runbook](/th/concepts/mantis-slack-desktop-runbook) |

## โฟลว์ผู้ปฏิบัติการ

โฟลว์ผู้ปฏิบัติการ QA ปัจจุบันคือไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab แสดงทรานสคริปต์แบบ Slack-ish และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนั้นสร้างไซต์ QA, เริ่มเลน Gateway ที่รองรับด้วย Docker และเปิดเผยหน้า
QA Lab ที่ผู้ปฏิบัติการหรือ automation loop สามารถมอบภารกิจ QA ให้เอเจนต์,
สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือยัง
ถูกบล็อกอยู่

สำหรับการวนซ้ำ UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง,
เริ่มสแตกด้วยบันเดิล QA Lab แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` ทำให้บริการ Docker ใช้อิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
สร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะรีโหลดอัตโนมัติเมื่อ hash แอสเซ็ตของ QA Lab
เปลี่ยน

สำหรับ smoke ของ trace OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ trace OTLP/HTTP ในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ `diagnostics-otel` plugin จากนั้น
ถอดรหัส spans protobuf ที่ส่งออกและ assert รูปทรงที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
model calls ต้องไม่ส่งออก `StreamAbandoned` ในเทิร์นที่สำเร็จ; ID diagnostic ดิบและ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace สคริปต์เขียน
`otel-smoke-summary.json` ไว้ข้าง artifacts ของ QA suite

Observability QA ยังเป็นแบบ source-checkout เท่านั้น tarball npm จงใจละเว้น
QA Lab ดังนั้นเลน release Docker ของ package จึงไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่สร้างแล้วเมื่อเปลี่ยน instrumentation
diagnostics

สำหรับเลน smoke Matrix ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

เอกสารอ้างอิง CLI แบบเต็ม แค็ตตาล็อก profile/สถานการณ์ env vars และเลย์เอาต์ artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) ภาพรวมคือ: มันจัดเตรียม homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Matrix Plugin จริงภายใน QA gateway ลูกที่ scoped กับ transport นั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown, สรุป JSON, artifact observed-events และ log เอาต์พุตรวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สถานการณ์ครอบคลุมพฤติกรรม transport ที่ unit test ไม่สามารถพิสูจน์ได้ครบตั้งแต่ต้นจนจบ: mention gating, นโยบาย allow-bot, allowlists, การตอบกลับระดับบนสุดและแบบเธรด, การ routing DM, การจัดการ reaction, การระงับ edit ขาเข้า, การ dedupe replay หลัง restart, การกู้คืนจากการขัดจังหวะ homeserver, การส่งมอบ metadata approval, การจัดการ media และโฟลว์ bootstrap/recovery/verification ของ Matrix E2EE โปรไฟล์ CLI ของ E2EE ยังขับเคลื่อน `openclaw matrix encryption setup` และคำสั่ง verification ผ่าน homeserver แบบใช้แล้วทิ้งเดียวกันก่อนตรวจคำตอบของ Gateway

Discord ยังมีสถานการณ์ opt-in เฉพาะ Mantis สำหรับการทำซ้ำบั๊ก ใช้
`--scenario discord-status-reactions-tool-only` สำหรับไทม์ไลน์ status reaction
ที่ชัดเจน หรือ `--scenario discord-thread-reply-filepath-attachment` เพื่อสร้าง
เธรด Discord จริงและยืนยันว่า `message.thread-reply` รักษาไฟล์แนบ
`filePath` ไว้ สถานการณ์เหล่านี้อยู่นอกเลน Discord live เริ่มต้น
เพราะเป็น probe ทำซ้ำก่อน/หลัง ไม่ใช่ความครอบคลุม smoke แบบกว้าง
เวิร์กโฟลว์ Mantis ของ thread-attachment ยังสามารถเพิ่มวิดีโอพยาน Discord Web
ที่ล็อกอินแล้วเมื่อกำหนดค่า `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` หรือ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ในสภาพแวดล้อม QA
โปรไฟล์ผู้ดูนั้นใช้เพื่อการจับภาพเท่านั้น; การตัดสิน pass/fail
ยังมาจาก Discord REST oracle

CI ใช้พื้นผิวคำสั่งเดียวกันใน `.github/workflows/qa-live-transports-convex.yml` การรันตามกำหนดเวลาและการรัน manual เริ่มต้นจะ execute โปรไฟล์ Matrix แบบ fast พร้อม credential frontier แบบ live, `--fast` และ `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` การตั้งค่า manual `matrix_profile=all` จะแยกออกเป็น profile shards ห้าชุดเพื่อให้แค็ตตาล็อกแบบ exhaustive รันแบบขนานได้ โดยยังคงมีไดเรกทอรี artifact หนึ่งรายการต่อ shard

สำหรับเลน smoke Telegram, Discord และ Slack ที่ใช้ transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

เลนเหล่านี้กำหนดเป้าหมายไปยังช่องทางจริงที่มีอยู่แล้วพร้อม bot สองตัว (driver + SUT) env vars ที่ต้องใช้ รายการสถานการณ์ artifacts เอาต์พุต และพูล credential Convex ถูกบันทึกไว้ใน [เอกสารอ้างอิง QA สำหรับ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

สำหรับการรัน VM เดสก์ท็อป Slack แบบเต็มพร้อม VNC สำหรับกู้คืน ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นจะเช่าเครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox รันเลน Slack แบบ live
ภายใน VM เปิด Slack Web ในเบราว์เซอร์ VNC จับภาพเดสก์ท็อป และ
คัดลอก `slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
เมื่อมีการจับวิดีโอกลับไปยังไดเรกทอรีอาร์ติแฟกต์ Mantis สัญญาเช่า
เดสก์ท็อป/เบราว์เซอร์ Crabbox มีเครื่องมือจับภาพและแพ็กเกจช่วยสร้างแบบ browser/native-build
ให้ตั้งแต่ต้น ดังนั้นสถานการณ์ควรติดตั้งเฉพาะ fallback บนสัญญาเช่าเก่าเท่านั้น Mantis
รายงานเวลารวมและเวลาต่อเฟสใน
`mantis-slack-desktop-smoke-report.md` เพื่อให้การรันที่ช้าแสดงได้ว่าเวลาใช้ไปกับ
การอุ่นสัญญาเช่า การรับข้อมูลรับรอง การตั้งค่าระยะไกล หรือการคัดลอกอาร์ติแฟกต์ ใช้
`--lease-id <cbx_...>` ซ้ำหลังจากเข้าสู่ระบบ Slack Web ด้วยตนเองผ่าน VNC;
สัญญาเช่าที่ใช้ซ้ำยังทำให้แคช pnpm store ของ Crabbox อุ่นอยู่ ค่าเริ่มต้น
`--hydrate-mode source` ตรวจสอบจาก source checkout และรัน install/build
ภายใน VM ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace ระยะไกลที่ใช้ซ้ำ
มี `node_modules` และ `dist/` ที่สร้างไว้แล้วเท่านั้น โหมดนั้นข้ามขั้นตอน
install/build ที่มีค่าใช้จ่ายสูง และล้มเหลวแบบปิดเมื่อ workspace ยังไม่พร้อม
เมื่อใช้ `--gateway-setup` Mantis จะปล่อยให้ Gateway Slack ของ OpenClaw แบบถาวร
ทำงานภายใน VM บนพอร์ต `38973`; หากไม่ใช้ คำสั่งจะรันเลน QA Slack แบบ bot-to-bot ปกติ
และออกหลังจากจับอาร์ติแฟกต์

รายการตรวจสอบสำหรับผู้ปฏิบัติงาน คำสั่ง dispatch ของ GitHub workflow สัญญาคอมเมนต์หลักฐาน
ตารางตัดสินใจ hydrate-mode การตีความเวลา และขั้นตอนจัดการความล้มเหลวอยู่ใน [คู่มือการรันเดสก์ท็อป Slack ของ Mantis](/th/concepts/mantis-slack-desktop-runbook)

สำหรับงานเดสก์ท็อปสไตล์ agent/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` เช่าหรือใช้เครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox ซ้ำ เริ่ม
`crabbox record --while` ขับเบราว์เซอร์ที่มองเห็นได้ผ่าน
`visual-driver` แบบซ้อน จับภาพ `visual-task.png` รัน `openclaw infer image describe`
กับภาพหน้าจอเมื่อเลือก `--vision-mode image-describe` และ
เขียน `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` พรอมป์ vision จะขอคำตัดสิน JSON แบบมีโครงสร้าง
และผ่านเฉพาะเมื่อโมเดลรายงานหลักฐานที่มองเห็นได้เชิงบวก การตอบเชิงลบที่เพียงแค่
อ้างข้อความเป้าหมายจะทำให้ assertion ล้มเหลว
ใช้ `--vision-mode metadata` สำหรับ smoke แบบไม่ใช้โมเดลที่พิสูจน์การเชื่อมท่อของ
เดสก์ท็อป เบราว์เซอร์ ภาพหน้าจอ และวิดีโอโดยไม่เรียกผู้ให้บริการด้านความเข้าใจภาพ
การบันทึกเป็นอาร์ติแฟกต์ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox ไม่ได้บันทึก
`visual-task.mp4` ที่ไม่ว่างเปล่า งานจะล้มเหลวแม้ว่า visual driver จะผ่านแล้วก็ตาม
เมื่อเกิดความล้มเหลว Mantis จะเก็บสัญญาเช่าไว้สำหรับ VNC เว้นแต่งานจะผ่านไปแล้ว
และไม่ได้กำหนด `--keep-lease`

ก่อนใช้ข้อมูลรับรอง live แบบรวมพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor จะตรวจ env ของ Convex broker ตรวจสอบการตั้งค่า endpoint และตรวจสอบการเข้าถึง admin/list เมื่อมี secret ของ maintainer โดยรายงานเฉพาะสถานะ set/missing ของ secret

## ความครอบคลุมของทรานสปอร์ต live

เลนทรานสปอร์ต live ใช้สัญญาเดียวร่วมกัน แทนที่แต่ละเลนจะประดิษฐ์รูปแบบรายการสถานการณ์ของตัวเอง `qa-channel` คือชุดทดสอบพฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุมของทรานสปอร์ต live

| เลน     | Canary | การควบคุม mention | Bot-to-bot | บล็อก allowlist | การตอบกลับระดับบนสุด | กลับมาทำต่อหลัง restart | การติดตาม thread | การแยก thread | การสังเกต reaction | คำสั่ง help | การลงทะเบียนคำสั่ง native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และทรานสปอร์ต live ในอนาคตใช้รายการตรวจสอบสัญญาทรานสปอร์ตที่ชัดเจนร่วมกัน

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่ดึง Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต guest Multipass ใหม่ ติดตั้ง dependency สร้าง OpenClaw
ภายใน guest รัน `qa suite` จากนั้นคัดลอกรายงาน QA และ
สรุปปกติกลับไปยัง `.artifacts/qa-e2e/...` บนโฮสต์
คำสั่งนี้ใช้พฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
การรันชุดทดสอบบนโฮสต์และ Multipass จะดำเนินการสถานการณ์ที่เลือกหลายรายการแบบขนาน
ด้วย worker ของ Gateway ที่แยกกันตามค่าเริ่มต้น `qa-channel` มีค่า concurrency
เริ่มต้นเป็น 4 โดยจำกัดตามจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการดำเนินการแบบอนุกรม
คำสั่งจะออกด้วยรหัสไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
ต้องการอาร์ติแฟกต์โดยไม่มี exit code ที่ล้มเหลว
การรัน live จะส่งต่ออินพุต auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ
guest ได้แก่ provider keys แบบ env, เส้นทาง config ผู้ให้บริการ live ของ QA และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้ guest
เขียนกลับผ่าน workspace ที่เมานต์ไว้ได้

## ข้อมูลอ้างอิง QA ของ Telegram, Discord และ Slack

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากจำนวนสถานการณ์และการเตรียม homeserver ที่รองรับด้วย Docker ส่วน Telegram, Discord และ Slack มีขนาดเล็กกว่า - มีสถานการณ์อย่างละไม่กี่รายการ ไม่มีระบบโปรไฟล์ และทำงานกับแชนเนลจริงที่มีอยู่แล้ว - ดังนั้นข้อมูลอ้างอิงของพวกมันจึงอยู่ที่นี่

### flag ของ CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับ flag เดียวกัน:

| Flag                                  | ค่าเริ่มต้น                                                         | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตได้ และ output log เส้นทางสัมพัทธ์จะ resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | repo root เมื่อเรียกจาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | id บัญชีชั่วคราวภายใน config ของ Gateway QA                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (`live-openai` แบบ legacy ยังใช้ได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของผู้ให้บริการ                                                | ref โมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                             | โหมดเร็วของผู้ให้บริการเมื่อรองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [พูลข้อมูลรับรอง Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                              | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

แต่ละเลนจะออกด้วยรหัสไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้ง exit code ที่ล้มเหลว

### Telegram QA

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มด้วยบอทที่แตกต่างกันสองตัว (driver + SUT) บอท SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกต bot-to-bot ทำงานได้ดีที่สุดเมื่อทั้งสองบอทเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message (ค่าเริ่มต้นจะปิดทับ)

สถานการณ์ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

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

อาร์ติแฟกต์เอาต์พุต:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตเห็นการตอบกลับจาก SUT) เริ่มตั้งแต่ canary
- `telegram-qa-observed-messages.json` - เนื้อหาจะถูกปิดทับ เว้นแต่ `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### Discord QA

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปยังแชนเนล guild ส่วนตัวจริงหนึ่งแชนเนลของ Discord ด้วยบอทสองตัว: บอท driver ที่ควบคุมโดย harness และบอท SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Discord ที่รวมมา ตรวจสอบการจัดการ mention ในแชนเนล ว่าบอท SUT ได้ลงทะเบียนคำสั่ง native `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - ต้องตรงกับ id ผู้ใช้ของบอท SUT ที่ Discord ส่งคืน (มิฉะนั้นเลนจะล้มเหลวอย่างรวดเร็ว)

ตัวเลือก:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - สถานการณ์ Mantis แบบ opt-in รันแยกเดี่ยวเพราะจะสลับ SUT ให้ตอบกลับใน guild แบบ always-on และ tool-only ด้วย `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์ reaction ผ่าน REST พร้อมอาร์ติแฟกต์ภาพ HTML/PNG รายงานก่อน/หลังของ Mantis ยังเก็บอาร์ติแฟกต์ MP4 ที่สถานการณ์ให้มาเป็น `baseline.mp4` และ `candidate.mp4`

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
- `discord-qa-observed-messages.json` - เนื้อหาข้อความถูกปกปิด เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์ปฏิกิริยาสถานะทำงาน

### QA ของ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายเป็นช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอทสองตัวแยกจากกัน: บอทไดรเวอร์ที่ควบคุมโดยฮาร์เนส และบอท SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Slack ที่รวมมาให้

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ไม่บังคับ:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตได้

สถานการณ์ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

อาร์ติแฟกต์ผลลัพธ์:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - เนื้อหาข้อความถูกปกปิด เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

#### การตั้งค่าเวิร์กสเปซ Slack

เลนนี้ต้องใช้แอป Slack สองแอปที่แยกจากกันในเวิร์กสเปซเดียวกัน พร้อมช่องที่บอททั้งสองเป็นสมาชิก:

- `channelId` - id `Cxxxxxxxxxx` ของช่องที่บอททั้งสองได้รับเชิญแล้ว ใช้ช่องเฉพาะ เลนจะโพสต์ทุกครั้งที่รัน
- `driverBotToken` - โทเค็นบอท (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` - โทเค็นบอท (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack คนละตัวกับไดรเวอร์ เพื่อให้ id ผู้ใช้บอทแตกต่างกัน
- `sutAppToken` - โทเค็นระดับแอป (`xapp-...`) ของแอป SUT พร้อม `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับเหตุการณ์ได้

ควรใช้เวิร์กสเปซ Slack ที่อุทิศให้ QA แทนการนำเวิร์กสเปซ production มาใช้ซ้ำ

manifest ของ SUT ด้านล่างตั้งใจจำกัดการติดตั้ง production ของ Plugin Slack ที่รวมมาให้ (`extensions/slack/src/setup-shared.ts:10`) ให้เหลือเฉพาะสิทธิ์และเหตุการณ์ที่ครอบคลุมโดยชุด QA Slack แบบ live สำหรับการตั้งค่าช่อง production ตามที่ผู้ใช้เห็น ให้ดู [การตั้งค่าช่อง Slack แบบรวดเร็ว](/th/channels/slack#quick-setup); คู่ QA Driver/SUT ถูกแยกไว้โดยตั้งใจ เพราะเลนต้องใช้ id ผู้ใช้บอทสองตัวที่แตกต่างกันในเวิร์กสเปซเดียว

**1. สร้างแอป Driver**

ไปที่ [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → เลือกเวิร์กสเปซ QA วาง manifest ต่อไปนี้ แล้วเลือก _Install to Workspace_:

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) - ค่านี้จะเป็น `driverBotToken` ไดรเวอร์ต้องใช้เพียงเพื่อโพสต์ข้อความและระบุตัวตน ไม่มีเหตุการณ์ และไม่มี Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _Create New App → From a manifest_ ในเวิร์กสเปซเดียวกัน แอป QA นี้ตั้งใจใช้ manifest production ของ Plugin Slack ที่รวมมาให้ในเวอร์ชันที่แคบลง (`extensions/slack/src/setup-shared.ts:10`): scope และเหตุการณ์ของปฏิกิริยาถูกละไว้ เพราะชุด QA Slack แบบ live ยังไม่ครอบคลุมการจัดการปฏิกิริยา

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

- _Install to Workspace_ → คัดลอก _Bot User OAuth Token_ → ค่านี้จะเป็น `sutBotToken`
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → เพิ่ม scope `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านี้จะเป็น `sutAppToken`

ยืนยันว่าบอททั้งสองมี id ผู้ใช้ต่างกันโดยเรียก `auth.test` กับแต่ละโทเค็น runtime แยกไดรเวอร์กับ SUT ด้วย id ผู้ใช้ การใช้แอปเดียวกันซ้ำสำหรับทั้งสองบทบาทจะทำให้ mention-gating ล้มเหลวทันที

**3. สร้างช่อง**

ในเวิร์กสเปซ QA ให้สร้างช่องหนึ่งช่อง (เช่น `#openclaw-qa`) และเชิญบอททั้งสองจากภายในช่อง:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอก id `Cxxxxxxxxxx` จาก _channel info → About → Channel ID_ - ค่านี้จะเป็น `channelId` ช่องสาธารณะใช้ได้ หากคุณใช้ช่องส่วนตัว แอปทั้งสองมี `groups:history` อยู่แล้ว ดังนั้นการอ่านประวัติของฮาร์เนสจะยังสำเร็จ

**4. ลงทะเบียนข้อมูลประจำตัว**

มีสองตัวเลือก ใช้ตัวแปร env สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือ seed พูล Convex ที่ใช้ร่วมกัน เพื่อให้ CI และผู้ดูแลคนอื่นสามารถ lease ได้

สำหรับพูล Convex ให้เขียนฟิลด์ทั้งสี่ลงไฟล์ JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

เมื่อ export `OPENCLAW_QA_CONVEX_SITE_URL` และ `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ไว้ใน shell ของคุณแล้ว ให้ลงทะเบียนและตรวจสอบ:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

คาดว่าจะเห็น `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบแบบ end to end**

รันเลนในเครื่องเพื่อยืนยันว่าบอททั้งสองคุยกันผ่าน broker ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่สำเร็จจะเสร็จภายในเวลาไม่ถึง 30 วินาที และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` ที่สถานะ `pass` หากเลนค้างประมาณ 90 วินาทีแล้วออกด้วย `Convex credential pool exhausted for kind "slack"` แสดงว่าพูลว่างหรือทุกแถวถูก lease อยู่ - `qa credentials list --kind slack --status all --json` จะบอกคุณว่าเป็นกรณีใด

### พูลข้อมูลประจำตัว Convex

เลน Telegram, Discord และ Slack สามารถ lease ข้อมูลประจำตัวจากพูล Convex ที่ใช้ร่วมกันแทนการอ่านตัวแปร env ด้านบน ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะรับ lease แบบเอกสิทธิ์ ทำ Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดตัวลง ชนิดของพูลคือ `"telegram"`, `"discord"` และ `"slack"`

รูปแบบ payload ที่ broker ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` ต้องตรงกับ `^[A-Z][A-Z0-9]+$` (id Slack เช่น `Cxxxxxxxxxx`) ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและ scope

ตัวแปร env สำหรับการปฏิบัติการและสัญญา endpoint ของ broker Convex อยู่ใน [การทดสอบ → ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มาก่อนการรองรับ Discord; semantics ของ broker เหมือนกันสำหรับทั้งสองชนิด)

## seed ที่อิง repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจอยู่ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็น runner markdown ทั่วไป ไฟล์ markdown สถานการณ์แต่ละไฟล์เป็น
แหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของสถานการณ์
- metadata หมวดหมู่ ความสามารถ เลน และความเสี่ยงแบบไม่บังคับ
- refs ของเอกสารและโค้ด
- ข้อกำหนด Plugin แบบไม่บังคับ
- patch การตั้งค่า Gateway แบบไม่บังคับ
- `qa-flow` ที่รันได้

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` อนุญาตให้คงเป็นแบบทั่วไป
และครอบคลุมข้ามส่วนได้ ตัวอย่างเช่น สถานการณ์ markdown สามารถรวม helper ฝั่ง transport
กับ helper ฝั่ง browser ที่ขับ Control UI แบบฝังผ่าน seam `browser.request` ของ
Gateway โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนโฟลเดอร์ใน source tree
คง ID สถานการณ์ให้เสถียรเมื่อย้ายไฟล์ ใช้ `docsRefs` และ `codeRefs`
เพื่อการติดตามกลับไปยัง implementation

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และแชตช่อง
- พฤติกรรม thread
- วงจรชีวิตของการกระทำกับข้อความ
- callback ของ cron
- การเรียกคืน memory
- การสลับ model
- การส่งต่อไปยัง subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของ provider

`qa suite` มีเลน mock provider ในเครื่องสองเลน:

- `mock-openai` คือ mock OpenClaw ที่รับรู้สถานการณ์ ยังคงเป็นเลน mock แบบกำหนดผลได้เริ่มต้น
  สำหรับ QA ที่อิง repo และ gate parity
- `aimock` เริ่ม server provider ที่อิง AIMock สำหรับความครอบคลุมด้าน protocol เชิงทดลอง
  fixture, record/replay และ chaos เป็นแบบเพิ่มเติม และไม่ได้
  แทนที่ dispatcher สถานการณ์ `mock-openai`

implementation ของเลน provider อยู่ใต้ `extensions/qa-lab/src/providers/`
provider แต่ละตัวเป็นเจ้าของค่าเริ่มต้น การเริ่ม server ในเครื่อง config model ของ Gateway
ความต้องการ staging ของ auth-profile และแฟล็กความสามารถ live/mock ของตัวเอง โค้ดชุดทดสอบที่ใช้ร่วมกันและ
โค้ด Gateway ควร route ผ่าน registry ของ provider แทนการ branch ตาม
ชื่อ provider

## อะแดปเตอร์ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับสถานการณ์ QA แบบ markdown `qa-channel` เป็นอะแดปเตอร์แรกบน seam นั้น แต่เป้าหมายการออกแบบกว้างกว่า: ช่องจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ runner ชุดเดียวกัน แทนการเพิ่ม runner QA เฉพาะ transport

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการดำเนินการสถานการณ์ทั่วไป concurrency ของ worker การเขียนอาร์ติแฟกต์ และการรายงาน
- อะแดปเตอร์ transport เป็นเจ้าของ config ของ Gateway, readiness, การสังเกต inbound และ outbound, การกระทำของ transport และสถานะ transport ที่ทำให้อยู่ในรูปมาตรฐาน
- ไฟล์สถานการณ์ markdown ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งใช้ดำเนินการไฟล์เหล่านั้น

### การเพิ่มช่อง

การเพิ่มช่องลงในระบบ QA แบบ markdown ต้องใช้สองสิ่งพอดี:

1. อะแดปเตอร์ transport สำหรับช่อง
2. แพ็กสถานการณ์ที่ทดสอบสัญญาของช่อง

อย่าเพิ่ม root คำสั่ง QA ระดับบนใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- รากคำสั่ง `openclaw qa`
- การเริ่มต้นและการปิดท้ายชุดทดสอบ
- การทำงานพร้อมกันของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินการ scenario
- alias ความเข้ากันได้สำหรับ scenario `qa-channel` รุ่นเก่า

Plugin รันเนอร์เป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ภายใต้ราก `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อม
- วิธีฉีด inbound event
- วิธีสังเกต outbound message
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalize แล้ว
- วิธีดำเนินการ action ที่อิงกับ transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการรับช่องทางใหม่:

1. ให้ `qa-lab` เป็นเจ้าของราก `qa` ที่ใช้ร่วมกัน
2. Implement transport runner บน seam ของโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน runner plugin หรือ channel harness
4. Mount รันเนอร์เป็น `openclaw qa <runner>` แทนการ register คำสั่งรากที่แข่งขันกัน Runner plugin ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export array `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาไว้; CLI แบบ lazy และการดำเนินการ runner ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับ scenario แบบ markdown ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ helper scenario แบบ generic สำหรับ scenario ใหม่
7. รักษา compatibility alias ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ว่า repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากสามารถแสดง behavior ได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หาก behavior ขึ้นกับ channel transport หนึ่งช่อง ให้เก็บไว้ใน runner plugin หรือ plugin harness นั้น
- หาก scenario ต้องการ capability ใหม่ที่มากกว่าหนึ่งช่องทางใช้ได้ ให้เพิ่ม helper แบบ generic แทน branch เฉพาะช่องทางใน `suite.ts`
- หาก behavior มีความหมายเฉพาะกับ transport เดียว ให้ scenario เป็นแบบเฉพาะ transport และระบุให้ชัดเจนในสัญญา scenario

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

compatibility alias ยังคงมีให้ใช้สำหรับ scenario ที่มีอยู่ - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - แต่การเขียน scenario ใหม่ควรใช้ชื่อแบบ generic alias เหล่านี้มีไว้เพื่อเลี่ยง migration แบบ flag-day ไม่ใช่ model สำหรับอนาคต

## การรายงาน

`qa-lab` export รายงาน protocol แบบ Markdown จากไทม์ไลน์ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อก
- scenario ติดตามผลใดที่ควรเพิ่ม

สำหรับ inventory ของ scenario ที่มีอยู่ - มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อม transport ใหม่ - ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับ output ที่เครื่องอ่านได้)

สำหรับการตรวจ character และ style ให้รัน scenario เดียวกันข้าม live model
ref หลายรายการ แล้วเขียนรายงาน Markdown ที่ตัดสินแล้ว:

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

คำสั่งนี้รัน child process ของ QA gateway ในเครื่อง ไม่ใช่ Docker scenario สำหรับ character eval
ควรตั้ง persona ผ่าน `SOUL.md` แล้วรัน turn ของผู้ใช้ตามปกติ
เช่น chat, ความช่วยเหลือ workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอก candidate model
ว่ากำลังถูกประเมิน คำสั่งนี้เก็บ transcript เต็มแต่ละรายการ
บันทึกสถิติการรันพื้นฐาน จากนั้นถาม judge model ใน fast mode ด้วย
reasoning `xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ vibe และ humor
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ provider: prompt ของ judge ยังคงได้รับ
transcript และสถานะการรันทั้งหมด แต่ candidate ref จะถูกแทนด้วย
label กลาง เช่น `candidate-01`; รายงานจะ map การจัดอันดับกลับไปยัง ref จริงหลัง
การ parse
candidate run ตั้งค่าเริ่มต้นเป็น thinking `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ OpenAI eval ref รุ่นเก่าที่รองรับ Override candidate เฉพาะ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้ง
fallback ส่วนกลาง และรูปแบบเก่า `--model-thinking <provider/model=level>` จะ
คงไว้เพื่อความเข้ากันได้
OpenAI candidate ref ตั้งค่าเริ่มต้นเป็น fast mode เพื่อใช้ priority processing เมื่อ
provider รองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
candidate หรือ judge รายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิด fast mode สำหรับ candidate model ทุกตัว ระยะเวลาของ candidate และ judge
จะถูกบันทึกในรายงานเพื่อการวิเคราะห์ benchmark แต่ prompt ของ judge ระบุชัดเจนว่า
อย่าจัดอันดับตามความเร็ว
การรัน candidate และ judge model ตั้งค่า concurrency เริ่มต้นเป็น 16 ทั้งคู่ ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัด provider หรือแรงกดดันต่อ gateway
ในเครื่องทำให้การรันมี noise มากเกินไป
เมื่อไม่ส่ง candidate `--model` character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, และ
`google/gemini-3.1-pro-preview` เมื่อไม่ส่ง `--model`
เมื่อไม่ส่ง `--judge-model` judge จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Matrix QA](/th/concepts/qa-matrix)
- [QA Channel](/th/channels/qa-channel)
- [Testing](/th/help/testing)
- [Dashboard](/th/web/dashboard)
