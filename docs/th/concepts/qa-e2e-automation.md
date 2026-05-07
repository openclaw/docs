---
read_when:
    - ทำความเข้าใจว่าสแตก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่งข้อมูล
    - การเพิ่มสถานการณ์การประกันคุณภาพที่อิงตามรีโป
    - การสร้างระบบอัตโนมัติ QA ที่มีความสมจริงยิ่งขึ้นสำหรับแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่รองรับด้วยรีโพซิทอรี, เลนการขนส่งข้อมูลแบบสด, อะแดปเตอร์การขนส่งข้อมูล และการรายงาน.'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-05-07T13:16:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงและเป็นรูปแบบช่องทางมากกว่าที่การทดสอบหน่วยเดียวจะทำได้

องค์ประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, ช่องทาง, เธรด,
  รีแอ็กชัน, การแก้ไข และการลบ
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์,
  แทรกข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin รันเนอร์ในอนาคต: อะแดปเตอร์ขนส่งแบบสดที่
  ขับช่องทางจริงภายใน QA gateway ลูก
- `qa/`: แอสเซ็ตตั้งต้นที่หนุนด้วย repo สำหรับงานเริ่มต้นและสถานการณ์ QA
  baseline
- [Mantis](/th/concepts/mantis): การตรวจสอบแบบสดก่อนและหลังสำหรับบั๊กที่
  ต้องใช้การขนส่งจริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมีนามแฝงสคริปต์ `pnpm qa:*`
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | การตรวจสอบตัวเอง QA ที่บันเดิลไว้ เขียนรายงาน Markdown                                                                                                                                                                                                                        |
| `qa suite`                                          | รันสถานการณ์ที่หนุนด้วย repo กับเลน QA gateway นามแฝง: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                                                                                                  |
| `qa coverage`                                       | พิมพ์ inventory ความครอบคลุมสถานการณ์ markdown (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                                                                                                                           |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic                                                                                                                                                                                          |
| `qa character-eval`                                 | รันสถานการณ์ QA ด้านคาแรกเตอร์กับโมเดลสดหลายตัวพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                                                                                                                            |
| `qa manual`                                         | รันพรอมป์ครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                                                                                                                          |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ภายในเครื่อง (นามแฝง: `pnpm qa:lab:ui`)                                                                                                                                                                                                    |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่เตรียมไว้ล่วงหน้า                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับแดชบอร์ด QA + เลน gateway                                                                                                                                                                                                    |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแต็กที่หนุนด้วย Docker, พิมพ์ URL (นามแฝง: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                                                                                                  |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูลข้อมูลประจำตัว Convex ที่ใช้ร่วมกัน                                                                                                                                                                                                                               |
| `qa matrix`                                         | เลนขนส่งสดกับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                                                                                                      |
| `qa telegram`                                       | เลนขนส่งสดกับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                                                                                              |
| `qa discord`                                        | เลนขนส่งสดกับช่อง guild Discord ส่วนตัวจริง                                                                                                                                                                                                       |
| `qa slack`                                          | เลนขนส่งสดกับช่อง Slack ส่วนตัวจริง                                                                                                                                                                                                               |
| `qa mantis`                                         | รันเนอร์ตรวจสอบก่อนและหลังสำหรับบั๊กขนส่งสด พร้อมหลักฐานรีแอ็กชันสถานะ Discord, smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox และ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) และ [คู่มือปฏิบัติ Mantis Slack Desktop](/th/concepts/mantis-slack-desktop-runbook) |

## โฟลว์ผู้ปฏิบัติการ

โฟลว์ผู้ปฏิบัติการ QA ปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดงทรานสคริปต์แบบ Slack-ish และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนั้นสร้างไซต์ QA, เริ่มเลน gateway ที่หนุนด้วย Docker และเปิดเผยหน้า
QA Lab ที่ผู้ปฏิบัติการหรือ loop อัตโนมัติสามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือ
ยังถูกบล็อกอยู่

สำหรับการวนซ้ำ UI ของ QA Lab ภายในเครื่องที่เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง,
ให้เริ่มสแต็กด้วยบันเดิล QA Lab ที่ bind mount ไว้:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
สร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะโหลดซ้ำอัตโนมัติเมื่อ hash แอสเซ็ต QA Lab
เปลี่ยน

สำหรับ trace smoke OpenTelemetry ภายในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ trace OTLP/HTTP ภายในเครื่อง, รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel` จากนั้น
ถอดรหัส span protobuf ที่ส่งออกและ assert รูปทรงที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
การเรียกโมเดลต้องไม่ส่งออก `StreamAbandoned` บนเทิร์นที่สำเร็จ; ID diagnostic ดิบและแอตทริบิวต์
`openclaw.content.*` ต้องไม่อยู่ใน trace สคริปต์เขียน
`otel-smoke-summary.json` ไว้ข้างแอสเซ็ตชุด QA

QA ด้าน observability ยังจำกัดเฉพาะ source-checkout เท่านั้น tarball npm จงใจละเว้น
QA Lab ดังนั้นเลน release Docker ของแพ็กเกจจะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน instrumentation
ด้าน diagnostics

สำหรับเลน smoke Matrix ที่ใช้การขนส่งจริง ให้รัน:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

ข้อมูลอ้างอิง CLI ฉบับเต็ม, แค็ตตาล็อก profile/scenario, env vars และเลย์เอาต์ artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: มันจัดเตรียม homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Plugin Matrix จริงภายใน QA gateway ลูกที่จำกัดขอบเขตไว้กับขนส่งนั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown, สรุป JSON, artifact เหตุการณ์ที่สังเกตได้ และ log เอาต์พุตรวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สถานการณ์ครอบคลุมพฤติกรรมขนส่งที่การทดสอบหน่วยพิสูจน์แบบ end to end ไม่ได้: mention gating, นโยบาย allow-bot, allowlist, การตอบกลับระดับบนสุดและในเธรด, การกำหนดเส้นทาง DM, การจัดการรีแอ็กชัน, การระงับการแก้ไขขาเข้า, การลบซ้ำ replay หลังรีสตาร์ต, การกู้คืนจากการขัดจังหวะของ homeserver, การส่ง metadata การอนุมัติ, การจัดการสื่อ และโฟลว์ bootstrap/recovery/verification ของ Matrix E2EE profile CLI ของ E2EE ยังขับ `openclaw matrix encryption setup` และคำสั่ง verification ผ่าน homeserver แบบใช้แล้วทิ้งเดียวกันก่อนตรวจสอบการตอบกลับของ gateway

Discord ยังมีสถานการณ์แบบ opt-in เฉพาะ Mantis สำหรับการทำซ้ำบั๊ก ใช้
`--scenario discord-status-reactions-tool-only` สำหรับ timeline รีแอ็กชันสถานะแบบชัดเจน
หรือ `--scenario discord-thread-reply-filepath-attachment` เพื่อสร้าง
เธรด Discord จริงและตรวจสอบว่า `message.thread-reply` เก็บรักษาไฟล์แนบ
`filePath` ไว้ สถานการณ์เหล่านี้ไม่อยู่ในเลน Discord สดค่าเริ่มต้น
เพราะเป็น probe ทำซ้ำก่อน/หลัง มากกว่าความครอบคลุม smoke แบบกว้าง
เวิร์กโฟลว์ Mantis ของ thread-attachment ยังสามารถเพิ่มวิดีโอ witness ของ Discord Web
ที่ล็อกอินแล้วได้เมื่อกำหนดค่า `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` หรือ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ในสภาพแวดล้อม QA
โปรไฟล์ viewer นั้นใช้เพื่อการจับภาพเท่านั้น การตัดสินผ่าน/ไม่ผ่าน
ยังมาจาก oracle Discord REST

CI ใช้พื้นผิวคำสั่งเดียวกันใน `.github/workflows/qa-live-transports-convex.yml` การรันตามกำหนดเวลาและการรัน manual ค่าเริ่มต้นดำเนินการ profile Matrix แบบเร็วด้วยข้อมูลประจำตัว frontier สด, `--fast` และ `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` การรัน manual `matrix_profile=all` กระจายออกเป็น shard profile ห้าชุดเพื่อให้แค็ตตาล็อกแบบครบถ้วนรันขนานกันได้โดยยังคงมีไดเรกทอรี artifact หนึ่งรายการต่อ shard

สำหรับเลน smoke Telegram, Discord และ Slack ที่ใช้การขนส่งจริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

เลนเหล่านี้กำหนดเป้าหมายไปยังช่องจริงที่มีอยู่แล้วพร้อมบอตสองตัว (driver + SUT) env vars ที่จำเป็น, รายการสถานการณ์, artifact เอาต์พุต และพูลข้อมูลประจำตัว Convex มีเอกสารไว้ใน [ข้อมูลอ้างอิง QA ของ Telegram, Discord และ Slack](#telegram-discord-and-slack-qa-reference) ด้านล่าง

สำหรับการรัน VM เดสก์ท็อป Slack แบบเต็มพร้อมการกู้คืนผ่าน VNC ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นจะเช่าเครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox, รันเลนสดของ Slack
ภายใน VM, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อป และ
คัดลอก `slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
เมื่อการจับภาพวิดีโอพร้อมใช้งานกลับไปยังไดเรกทอรีอาร์ติแฟกต์ Mantis สัญญาเช่า
เดสก์ท็อป/เบราว์เซอร์ Crabbox มีเครื่องมือจับภาพและแพ็กเกจตัวช่วยสำหรับเบราว์เซอร์/เนทีฟบิลด์
มาให้ล่วงหน้า ดังนั้นสถานการณ์ควรติดตั้งเฉพาะตัวสำรองบนสัญญาเช่าเก่าเท่านั้น
Mantis รายงานเวลารวมและเวลาแยกตามเฟสใน
`mantis-slack-desktop-smoke-report.md` เพื่อให้การรันที่ช้าแสดงได้ว่าเวลาไปอยู่ที่
การอุ่นเครื่องสัญญาเช่า, การรับข้อมูลประจำตัว, การตั้งค่าระยะไกล หรือการคัดลอกอาร์ติแฟกต์ ใช้
`--lease-id <cbx_...>` ซ้ำหลังจากเข้าสู่ระบบ Slack Web ด้วยตนเองผ่าน VNC;
สัญญาเช่าที่ใช้ซ้ำยังทำให้แคช pnpm store ของ Crabbox อุ่นอยู่เสมอ ค่าเริ่มต้น
`--hydrate-mode source` ตรวจสอบจาก source checkout และรันการติดตั้ง/บิลด์
ภายใน VM ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อพื้นที่ทำงานระยะไกลที่ใช้ซ้ำ
มี `node_modules` และ `dist/` ที่บิลด์แล้วอยู่ก่อนเท่านั้น โหมดนั้นจะข้าม
ขั้นตอนติดตั้ง/บิลด์ที่มีค่าใช้จ่ายสูง และล้มเหลวแบบปิดเมื่อพื้นที่ทำงานยังไม่พร้อม
เมื่อใช้ `--gateway-setup` Mantis จะปล่อยให้ Gateway ของ OpenClaw Slack
แบบคงอยู่รันอยู่ภายใน VM บนพอร์ต `38973`; หากไม่ใช้ คำสั่งจะรัน
เลน QA ของ Slack แบบบอตถึงบอตปกติและออกหลังจากจับภาพอาร์ติแฟกต์เสร็จ

เช็กลิสต์ของผู้ปฏิบัติงาน, คำสั่ง dispatch สำหรับเวิร์กโฟลว์ GitHub, สัญญาคอมเมนต์หลักฐาน,
ตารางตัดสินใจ hydrate-mode, การตีความเวลา และขั้นตอนจัดการความล้มเหลวอยู่ใน [รันบุ๊กเดสก์ท็อป Slack ของ Mantis](/th/concepts/mantis-slack-desktop-runbook)

สำหรับงานเดสก์ท็อปแบบเอเจนต์/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` จะเช่าหรือใช้เครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox ซ้ำ, เริ่ม
`crabbox record --while`, ควบคุมเบราว์เซอร์ที่มองเห็นได้ผ่าน
`visual-driver` แบบซ้อน, จับภาพ `visual-task.png`, รัน `openclaw infer image describe`
กับภาพหน้าจอเมื่อเลือก `--vision-mode image-describe` และ
เขียน `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` พรอมป์วิชันจะขอผลตัดสิน JSON แบบมีโครงสร้าง
และจะผ่านเฉพาะเมื่อโมเดลรายงานหลักฐานเชิงบวกที่มองเห็นได้ การตอบเชิงลบ
ที่เพียงแค่อ้างข้อความเป้าหมายจะทำให้การยืนยันล้มเหลว
ใช้ `--vision-mode metadata` สำหรับ smoke แบบไม่ใช้โมเดลที่พิสูจน์ระบบเดสก์ท็อป,
เบราว์เซอร์, ภาพหน้าจอ และวิดีโอโดยไม่เรียกผู้ให้บริการทำความเข้าใจภาพ
การบันทึกเป็นอาร์ติแฟกต์ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox ไม่บันทึก
`visual-task.mp4` ที่ไม่ว่าง งานจะล้มเหลวแม้ว่า visual driver
จะผ่านแล้วก็ตาม เมื่อเกิดความล้มเหลว Mantis จะเก็บสัญญาเช่าไว้สำหรับ VNC เว้นแต่งานจะผ่านแล้ว
และไม่ได้ตั้งค่า `--keep-lease`

ก่อนใช้ข้อมูลประจำตัวสดแบบพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor จะตรวจสอบ env ของโบรกเกอร์ Convex, ตรวจสอบความถูกต้องของการตั้งค่า endpoint และตรวจสอบการเข้าถึง admin/list เมื่อมีความลับของผู้ดูแลอยู่ โดยรายงานเฉพาะสถานะตั้งค่าแล้ว/ขาดหายสำหรับความลับ

## ความครอบคลุมทรานสปอร์ตสด

เลนทรานสปอร์ตสดใช้สัญญาเดียวร่วมกัน แทนที่แต่ละเลนจะคิดรูปแบบรายการสถานการณ์ของตัวเอง `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้าง และไม่เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุมทรานสปอร์ตสด

| เลน     | คานารี | การกั้นด้วยการกล่าวถึง | บอตถึงบอต | การบล็อกด้วยรายการอนุญาต | การตอบกลับระดับบนสุด | กลับมาทำงานต่อหลังรีสตาร์ต | การติดตามผลในเธรด | การแยกเธรด | การสังเกตปฏิกิริยา | คำสั่งช่วยเหลือ | การลงทะเบียนคำสั่งเนทีฟ |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และทรานสปอร์ตสดในอนาคตใช้เช็กลิสต์สัญญาทรานสปอร์ตที่ชัดเจนร่วมกัน

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต guest Multipass ใหม่, ติดตั้ง dependencies, บิลด์ OpenClaw
ภายใน guest, รัน `qa suite` จากนั้นคัดลอกรายงาน QA และ
สรุปตามปกติกลับไปยัง `.artifacts/qa-e2e/...` บนโฮสต์
คำสั่งนี้ใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์
การรัน suite บนโฮสต์และ Multipass จะดำเนินการสถานการณ์ที่เลือกหลายรายการแบบขนาน
ด้วย worker ของ Gateway ที่แยกกันตามค่าเริ่มต้น `qa-channel` มีค่าเริ่มต้น concurrency
เป็น 4 โดยจำกัดสูงสุดตามจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการดำเนินการแบบอนุกรม
คำสั่งจะออกด้วยค่าที่ไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
ต้องการอาร์ติแฟกต์โดยไม่มี exit code ที่แสดงความล้มเหลว
การรันสดจะส่งต่ออินพุต auth ของ QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ
guest: คีย์ผู้ให้บริการที่อิง env, พาธคอนฟิกผู้ให้บริการสดของ QA และ
`CODEX_HOME` เมื่อมีอยู่ ให้เก็บ `--output-dir` ไว้ใต้รูทของ repo เพื่อให้ guest
เขียนกลับผ่านพื้นที่ทำงานที่ mount ได้

## อ้างอิง QA สำหรับ Telegram, Discord และ Slack

Matrix มี [หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากจำนวนสถานการณ์และการจัดเตรียม homeserver ที่หนุนด้วย Docker ส่วน Telegram, Discord และ Slack มีขนาดเล็กกว่า - มีเพียงไม่กี่สถานการณ์ต่อรายการ, ไม่มีระบบโปรไฟล์, และทำงานกับช่องจริงที่มีอยู่แล้ว - ดังนั้นอ้างอิงของรายการเหล่านี้อยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                                         | คำอธิบาย                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | ตำแหน่งที่เขียนรายงาน/สรุป/ข้อความที่สังเกตเห็น และ output log พาธสัมพัทธ์จะแก้โดยอ้างอิง `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                                 | รูทของ repository เมื่อเรียกจาก cwd ที่เป็นกลาง                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | id บัญชีชั่วคราวภายในคอนฟิก Gateway ของ QA                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` หรือ `live-frontier` (`live-openai` แบบ legacy ยังใช้ได้)                                                  |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของผู้ให้บริการ                                                | refs โมเดลหลัก/สำรอง                                                                                         |
| `--fast`                              | ปิด                                                             | โหมดเร็วของผู้ให้บริการในที่ที่รองรับ                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | ดู [พูลข้อมูลประจำตัว Convex](#convex-credential-pool)                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, ไม่เช่นนั้นเป็น `maintainer`                              | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                          |

แต่ละเลนจะออกด้วยค่าที่ไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว `--allow-failures` เขียนอาร์ติแฟกต์โดยไม่ตั้ง exit code ที่แสดงความล้มเหลว

### QA สำหรับ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแยกกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอตถึงบอตทำงานได้ดีที่สุดเมื่อทั้งสองบอตเปิดใช้ **โหมดการสื่อสารบอตถึงบอต** ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id แชตแบบตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

ตัวเลือกเสริม:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตเห็น (ค่าเริ่มต้นจะปกปิด)

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

อาร์ติแฟกต์ผลลัพธ์:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - รวม RTT ต่อการตอบกลับ (driver ส่ง → สังเกตเห็นการตอบกลับของ SUT) เริ่มจากคานารี
- `telegram-qa-observed-messages.json` - เนื้อหาจะถูกปกปิด เว้นแต่ตั้งค่า `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`

### QA สำหรับ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายช่อง guild ส่วนตัวจริงหนึ่งช่องใน Discord ด้วยบอตสองตัว: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Discord ที่รวมมาให้ ตรวจสอบการจัดการการกล่าวถึงในช่อง, การที่บอต SUT ได้ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - ต้องตรงกับ id ผู้ใช้ของบอต SUT ที่ Discord ส่งกลับ (ไม่เช่นนั้นเลนจะล้มเหลวอย่างรวดเร็ว)

ตัวเลือกเสริม:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ข้อความที่สังเกตเห็น
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` เลือกช่องเสียง/เวทีสำหรับ `discord-voice-autojoin`; หากไม่มี สถานการณ์จะเลือกช่องเสียง/เวทีแรกที่บอต SUT มองเห็นได้

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - สถานการณ์เสียงแบบเลือกใช้เอง รันแยกเดี่ยว เปิดใช้ `channels.discord.voice.autoJoin` และตรวจสอบว่าสถานะเสียง Discord ปัจจุบันของบอต SUT คือช่องเสียง/เวทีเป้าหมาย ข้อมูลรับรอง Convex Discord อาจมี `voiceChannelId` แบบไม่บังคับ มิฉะนั้นตัวรันเนอร์จะค้นหาช่องเสียง/เวทีแรกที่มองเห็นได้ในกิลด์
- `discord-status-reactions-tool-only` - สถานการณ์ Mantis แบบเลือกใช้เอง รันแยกเดี่ยวเพราะจะสลับ SUT เป็นการตอบกลับกิลด์แบบเปิดตลอดและใช้เครื่องมือเท่านั้นด้วย `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์รีแอคชัน REST พร้อมอาร์ติแฟกต์ภาพ HTML/PNG รายงาน Mantis ก่อน/หลังยังคงเก็บอาร์ติแฟกต์ MP4 ที่สถานการณ์จัดเตรียมไว้เป็น `baseline.mp4` และ `candidate.mp4`

รันสถานการณ์เข้าร่วมเสียงอัตโนมัติของ Discord อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

รันสถานการณ์รีแอคชันสถานะของ Mantis อย่างชัดเจน:

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
- `discord-qa-observed-messages.json` - เนื้อหาข้อความถูกปกปิด เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อรันสถานการณ์รีแอคชันสถานะ

### QA ของ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายเป็นช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอตสองตัวแยกกัน: บอตไดรเวอร์ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Slack ที่รวมมาให้

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

อาร์ติแฟกต์เอาต์พุต:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - เนื้อหาข้อความถูกปกปิด เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`

#### การตั้งค่าเวิร์กสเปซ Slack

เลนนี้ต้องใช้แอป Slack สองแอปที่แยกกันในเวิร์กสเปซเดียว พร้อมช่องที่บอตทั้งสองเป็นสมาชิก:

- `channelId` - id `Cxxxxxxxxxx` ของช่องที่เชิญบอตทั้งสองเข้าแล้ว ใช้ช่องเฉพาะสำหรับงานนี้ เลนจะโพสต์ทุกครั้งที่รัน
- `driverBotToken` - โทเค็นบอต (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` - โทเค็นบอต (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกจากไดรเวอร์ เพื่อให้ id ผู้ใช้ของบอตแตกต่างกัน
- `sutAppToken` - โทเค็นระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับเหตุการณ์ได้

ควรใช้เวิร์กสเปซ Slack ที่ทุ่มเทให้กับ QA แทนการนำเวิร์กสเปซโปรดักชันมาใช้ซ้ำ

manifest ของ SUT ด้านล่างตั้งใจจำกัดการติดตั้งโปรดักชันของ Plugin Slack ที่รวมมาให้ (`extensions/slack/src/setup-shared.ts:10`) ให้เหลือเฉพาะสิทธิ์และเหตุการณ์ที่ชุด QA สดของ Slack ครอบคลุม สำหรับการตั้งค่าช่องโปรดักชันตามที่ผู้ใช้เห็น โปรดดู [การตั้งค่าด่วนของช่อง Slack](/th/channels/slack#quick-setup); คู่ QA Driver/SUT ถูกแยกไว้โดยตั้งใจ เพราะเลนต้องใช้ id ผู้ใช้บอตสองตัวที่แตกต่างกันในเวิร์กสเปซเดียว

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) - ค่านี้จะเป็น `driverBotToken` ไดรเวอร์ต้องใช้เพียงเพื่อโพสต์ข้อความและระบุตัวเอง ไม่ต้องใช้เหตุการณ์ และไม่ต้องใช้ Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _Create New App → From a manifest_ ในเวิร์กสเปซเดียวกัน แอป QA นี้ตั้งใจใช้ manifest โปรดักชันของ Plugin Slack ที่รวมมาให้ในเวอร์ชันที่จำกัดกว่า (`extensions/slack/src/setup-shared.ts:10`): ละเว้น scope และเหตุการณ์ของรีแอคชัน เพราะชุด QA สดของ Slack ยังไม่ครอบคลุมการจัดการรีแอคชัน

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

หลังจาก Slack สร้างแอปแล้ว ให้ทำสองอย่างบนหน้าการตั้งค่าของแอป:

- _Install to Workspace_ → คัดลอก _Bot User OAuth Token_ → ค่านี้จะเป็น `sutBotToken`
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → เพิ่ม scope `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านี้จะเป็น `sutAppToken`

ตรวจสอบว่าบอตทั้งสองมี id ผู้ใช้ที่แตกต่างกันด้วยการเรียก `auth.test` บนแต่ละโทเค็น runtime แยกไดรเวอร์กับ SUT ด้วย id ผู้ใช้; การใช้แอปเดียวกันซ้ำสำหรับทั้งสองอย่างจะทำให้ mention-gating ล้มเหลวทันที

**3. สร้างช่อง**

ในเวิร์กสเปซ QA ให้สร้างช่องหนึ่งช่อง (เช่น `#openclaw-qa`) แล้วเชิญบอตทั้งสองจากภายในช่อง:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอก id `Cxxxxxxxxxx` จาก _channel info → About → Channel ID_ - ค่านี้จะเป็น `channelId` ใช้ช่องสาธารณะได้; หากคุณใช้ช่องส่วนตัว ทั้งสองแอปมี `groups:history` อยู่แล้ว ดังนั้นการอ่านประวัติของ harness จะยังสำเร็จ

**4. ลงทะเบียนข้อมูลรับรอง**

มีสองตัวเลือก ใช้ env vars สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือ seed พูล Convex ที่ใช้ร่วมกันเพื่อให้ CI และผู้ดูแลคนอื่นเช่าใช้ได้

สำหรับพูล Convex ให้เขียนฟิลด์ทั้งสี่ลงในไฟล์ JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

เมื่อ export `OPENCLAW_QA_CONVEX_SITE_URL` และ `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ในเชลล์ของคุณแล้ว ให้ลงทะเบียนและตรวจสอบ:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

ควรได้ `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบแบบครบวงจร**

รันเลนในเครื่องเพื่อยืนยันว่าบอตทั้งสองคุยกันผ่าน broker ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านสำเร็จจะเสร็จภายในไม่ถึง 30 วินาที และ `slack-qa-report.md` แสดงทั้ง `slack-canary` และ `slack-mention-gating` ที่สถานะ `pass` หากเลนค้างประมาณ 90 วินาทีและออกด้วย `Convex credential pool exhausted for kind "slack"` แสดงว่าพูลว่างหรือทุกแถวถูกเช่าอยู่ - `qa credentials list --kind slack --status all --json` จะบอกได้ว่าเป็นกรณีใด

### พูลข้อมูลรับรอง Convex

เลน Telegram, Discord และ Slack สามารถเช่าข้อมูลรับรองจากพูล Convex ที่ใช้ร่วมกันแทนการอ่าน env vars ด้านบน ส่ง `--credential-source convex` (หรือตั้ง `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะรับ lease แบบเอกสิทธิ์ ทำ Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดตัว ชนิดของพูลคือ `"telegram"`, `"discord"` และ `"slack"`

รูปแบบ payload ที่ broker ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` ต้องตรงกับ `^[A-Z][A-Z0-9]+$` (id ของ Slack เช่น `Cxxxxxxxxxx`) ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและ scope

env vars สำหรับการดำเนินงานและสัญญา endpoint ของ broker Convex อยู่ใน [การทดสอบ → ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มีมาก่อนการรองรับ Discord; ความหมายของ broker เหมือนกันสำหรับทั้งสองชนิด)

## seed ที่อิงกับ repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็น runner markdown ทั่วไป ไฟล์ markdown ของแต่ละสถานการณ์คือ
แหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของสถานการณ์
- metadata หมวดหมู่ ความสามารถ เลน และความเสี่ยงแบบไม่บังคับ
- refs ของเอกสารและโค้ด
- ข้อกำหนด Plugin แบบไม่บังคับ
- patch การกำหนดค่า Gateway แบบไม่บังคับ
- `qa-flow` ที่รันได้

พื้นผิว runtime ที่นำกลับมาใช้ซ้ำได้ซึ่งรองรับ `qa-flow` สามารถคงความทั่วไป
และตัดข้ามหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ markdown สามารถรวมตัวช่วยฝั่ง transport
เข้ากับตัวช่วยฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน seam `browser.request` ของ
Gateway โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์ แทนที่จะจัดตามโฟลเดอร์
source tree รักษา ID ของสถานการณ์ให้คงที่เมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการติดตามการนำไปใช้

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และช่อง
- พฤติกรรมเธรด
- วงจรชีวิตของ message action
- callback ของ cron
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่อให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของผู้ให้บริการ

`qa suite` มีเลน mock ผู้ให้บริการในเครื่องสองเลน:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ ยังคงเป็นเลน mock
  แบบกำหนดได้ซ้ำเริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gates
- `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่อิงกับ AIMock สำหรับความครอบคลุมด้าน protocol,
  fixture, record/replay และ chaos แบบทดลอง เป็นการเพิ่มเข้าไปและไม่ได้แทนที่
  dispatcher สถานการณ์ `mock-openai`

การนำเลนผู้ให้บริการไปใช้อยู่ภายใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้น การเริ่มเซิร์ฟเวอร์ในเครื่อง การกำหนดค่าโมเดล
ของ Gateway ความต้องการ staging ของ auth-profile และแฟล็กความสามารถแบบ live/mock
โค้ด suite และ Gateway ที่ใช้ร่วมกันควร route ผ่าน registry ของผู้ให้บริการแทนการแตกแขนงตาม
ชื่อผู้ให้บริการ

## อะแดปเตอร์ transport

`qa-lab` เป็นเจ้าของจุดเชื่อมต่อ transport แบบทั่วไปสำหรับสถานการณ์ QA แบบ Markdown `qa-channel` เป็น adapter แรกบนจุดเชื่อมต่อนั้น แต่เป้าหมายการออกแบบกว้างกว่า: ช่องทางจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกัน แทนที่จะเพิ่ม QA runner เฉพาะ transport ขึ้นมาอีกตัว

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการดำเนินสถานการณ์ทั่วไป, concurrency ของ worker, การเขียน artifact และการรายงาน
- transport adapter เป็นเจ้าของ config ของ gateway, ความพร้อมใช้งาน, การสังเกต inbound และ outbound, action ของ transport และสถานะ transport ที่ปรับให้อยู่ในรูปแบบมาตรฐาน
- ไฟล์สถานการณ์ Markdown ใต้ `qa/scenarios/` กำหนด test run; `qa-lab` ให้พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งใช้ดำเนินสถานการณ์เหล่านั้น

### การเพิ่มช่องทาง

การเพิ่มช่องทางเข้าในระบบ QA แบบ Markdown ต้องมีสองสิ่งพอดี:

1. transport adapter สำหรับช่องทางนั้น
2. scenario pack ที่ทดสอบ contract ของช่องทางนั้น

อย่าเพิ่ม root command ของ QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root ของคำสั่ง `openclaw qa`
- การเริ่มและ teardown ของ suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินสถานการณ์
- compatibility aliases สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Runner Plugin เป็นเจ้าของ transport contract:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธี config gateway สำหรับ transport นั้น
- วิธีตรวจสอบความพร้อมใช้งาน
- วิธี inject inbound events
- วิธีสังเกต outbound messages
- วิธีเปิดเผย transcripts และสถานะ transport ที่ปรับให้อยู่ในรูปแบบมาตรฐาน
- วิธีดำเนิน action ที่มี transport รองรับ
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการรับช่องทางใหม่:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. ใช้งาน transport runner บน seam ของ host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ใน runner Plugin หรือ channel harness
4. Mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่มาแข่งขันกัน Runner Plugin ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาไว้; CLI แบบ lazy และการดำเนิน runner ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ Markdown ใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ generic scenario helpers สำหรับสถานการณ์ใหม่
7. รักษา compatibility aliases ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎตัดสินใจเข้มงวด:

- ถ้าพฤติกรรมสามารถแสดงครั้งเดียวใน `qa-lab` ได้ ให้วางไว้ใน `qa-lab`
- ถ้าพฤติกรรมขึ้นกับ transport ของช่องทางเดียว ให้เก็บไว้ใน runner Plugin หรือ Plugin harness นั้น
- ถ้าสถานการณ์ต้องใช้ capability ใหม่ที่มากกว่าหนึ่งช่องทางใช้ได้ ให้เพิ่ม helper แบบทั่วไปแทน branch เฉพาะช่องทางใน `suite.ts`
- ถ้าพฤติกรรมมีความหมายสำหรับ transport เดียวเท่านั้น ให้เก็บสถานการณ์นั้นให้เป็นแบบเฉพาะ transport และระบุให้ชัดเจนใน scenario contract

### ชื่อ scenario helper

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

compatibility aliases ยังคงพร้อมใช้สำหรับสถานการณ์ที่มีอยู่ - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อแบบทั่วไป aliases มีอยู่เพื่อหลีกเลี่ยงการ migration แบบ flag-day ไม่ใช่เป็นโมเดลในอนาคต

## การรายงาน

`qa-lab` export รายงานโปรโตคอลแบบ Markdown จากไทม์ไลน์ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อกอยู่
- สถานการณ์ follow-up ใดควรค่าแก่การเพิ่ม

สำหรับรายการสถานการณ์ที่มีอยู่ - มีประโยชน์เมื่อประเมินขนาดงาน follow-up หรือเชื่อม transport ใหม่ - ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับ output ที่เครื่องอ่านได้)

สำหรับการตรวจสอบ character และ style ให้รันสถานการณ์เดียวกันกับ refs ของ live model หลายตัว
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

คำสั่งนี้รัน local QA gateway child processes ไม่ใช่ Docker สถานการณ์ character eval
ควรกำหนด persona ผ่าน `SOUL.md` จากนั้นรัน user turns ปกติ
เช่น chat, workspace help และงานไฟล์ขนาดเล็ก candidate model ไม่ควร
ถูกบอกว่ากำลังถูกประเมินอยู่ คำสั่งนี้จะรักษา transcript ฉบับเต็มแต่ละรายการไว้
บันทึกสถิติการรันพื้นฐาน จากนั้นถาม judge models ใน fast mode พร้อม
reasoning `xhigh` เมื่อรองรับ เพื่อจัดอันดับ run ตามความเป็นธรรมชาติ, vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ providers: judge prompt ยังคงได้รับ
transcript และสถานะ run ทุกอย่าง แต่ candidate refs จะถูกแทนด้วย
label เป็นกลาง เช่น `candidate-01`; รายงานจะ map อันดับกลับไปยัง refs จริงหลัง
parsing
Candidate runs ตั้งต้นเป็น thinking `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ OpenAI eval refs รุ่นเก่าที่รองรับ Override candidate เฉพาะตัวแบบ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้ง
fallback แบบ global และรูปแบบเก่า `--model-thinking <provider/model=level>` ถูก
เก็บไว้เพื่อ compatibility
OpenAI candidate refs ตั้งต้นเป็น fast mode เพื่อใช้ priority processing เมื่อ
provider รองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
candidate หรือ judge รายเดียวต้อง override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิด fast mode สำหรับ candidate model ทุกตัว ระยะเวลาของ candidate และ judge
จะถูกบันทึกในรายงานสำหรับการวิเคราะห์ benchmark แต่ judge prompts ระบุไว้อย่างชัดเจนว่า
ไม่ให้จัดอันดับตามความเร็ว
run ของ candidate และ judge model ทั้งคู่ตั้งต้นที่ concurrency 16 ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัดของ provider หรือแรงกดบน local gateway
ทำให้ run มี noise มากเกินไป
เมื่อไม่ได้ส่ง candidate `--model` character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` judges จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [QA แบบเมทริกซ์](/th/concepts/qa-matrix)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
