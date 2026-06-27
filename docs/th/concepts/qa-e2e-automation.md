---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การขนส่ง
    - การเพิ่มสถานการณ์ QA ที่สำรองด้วยรีポジトリ
    - สร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นรอบแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิงกับ repo, เลนการขนส่งแบบสด, อะแดปเตอร์การขนส่ง และการรายงาน'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-06-27T17:29:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA แบบส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงกว่าและมีลักษณะเป็น channel มากกว่าที่ unit test เดี่ยวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: channel ข้อความสังเคราะห์ที่มีพื้นผิว DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกต transcript,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin runner ในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับ channel จริงภายใน Gateway QA ลูก
- `qa/`: แอสเซ็ต seed ที่อิง repo สำหรับงานเริ่มต้นและสถานการณ์ QA baseline
- [Mantis](/th/concepts/mantis): การตรวจสอบสดก่อนและหลังสำหรับบั๊กที่
  ต้องใช้ transport จริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุก flow ของ QA รันภายใต้ `pnpm openclaw qa <subcommand>` หลายรายการมี alias สคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | self-check QA ที่ bundle มาโดยไม่มี `--qa-profile`; runner โปรไฟล์ maturity ที่อิง taxonomy ด้วย `--qa-profile smoke-ci`, `--qa-profile release` หรือ `--qa-profile all`                                                                                                      |
| `qa suite`                                          | รันสถานการณ์ที่อิง repo กับเลน Gateway QA Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ VM Linux แบบใช้แล้วทิ้ง                                                                                                                                  |
| `qa coverage`                                       | พิมพ์ inventory ความครอบคลุมสถานการณ์ YAML (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                                                                                                                               |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน parity แบบ agentic หรือใช้ `--runtime-axis --token-efficiency` เพื่อเขียนรายงาน parity runtime Codex-vs-OpenClaw และรายงานประสิทธิภาพ token จาก summary คู่ runtime เดียว                                         |
| `qa character-eval`                                 | รันสถานการณ์ QA ด้าน character ข้าม live model หลายตัวพร้อมรายงานที่ผ่านการตัดสิน ดู [การรายงาน](#reporting)                                                                                                                                                            |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                                                                                                                          |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                                                                                                                    |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่เตรียมไว้ล่วงหน้า                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | เขียน scaffold docker-compose สำหรับ dashboard QA + เลน Gateway                                                                                                                                                                                                    |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแต็กที่อิง Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                                                                                                  |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ provider AIMock                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ provider `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูลข้อมูลประจำตัว Convex ที่ใช้ร่วมกัน                                                                                                                                                                                                                               |
| `qa matrix`                                         | เลน live transport กับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                                                                                                      |
| `qa telegram`                                       | เลน live transport กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                                                                                              |
| `qa discord`                                        | เลน live transport กับ channel ใน guild Discord ส่วนตัวจริง                                                                                                                                                                                                       |
| `qa slack`                                          | เลน live transport กับ channel Slack ส่วนตัวจริง                                                                                                                                                                                                               |
| `qa whatsapp`                                       | เลน live transport กับบัญชี WhatsApp Web จริง                                                                                                                                                                                                                 |
| `qa mantis`                                         | runner ตรวจสอบก่อนและหลังสำหรับบั๊ก live transport พร้อมหลักฐาน status-reaction ของ Discord, smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox และ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) และ [Runbook Mantis Slack Desktop](/th/concepts/mantis-slack-desktop-runbook) |

`qa run` ที่อิงโปรไฟล์อ่านสมาชิกจาก `taxonomy.yaml` จากนั้น dispatch
สถานการณ์ที่ resolve แล้วผ่าน `qa suite` `--surface` และ
`--category` กรองโปรไฟล์ที่เลือกแทนการกำหนดเลนแยก
`qa-evidence.json` ที่ได้จะมี summary scorecard ของโปรไฟล์พร้อม
จำนวนหมวดหมู่ที่เลือกและ ID ความครอบคลุมที่ขาดไป; รายการหลักฐานรายตัว
ยังคงเป็นแหล่งความจริงสำหรับการทดสอบ บทบาทความครอบคลุม และผลลัพธ์
ID ความครอบคลุมฟีเจอร์ taxonomy เป็นเป้าหมายหลักฐานที่ตรงตัว ไม่ใช่ alias ความครอบคลุม
สถานการณ์หลักเติมเต็ม ID ที่ตรงกัน; ความครอบคลุมรองยังเป็นเพียงคำแนะนำ
ID ความครอบคลุมใช้รูปแบบ dotted `namespace.behavior` โดยมี segment
ตัวอักษรและตัวเลขตัวพิมพ์เล็ก/ขีดกลาง; ID โปรไฟล์, surface และ category ยังอาจใช้
ID taxonomy แบบขีดกลางหรือ dotted ที่มีอยู่ได้
หลักฐานแบบ slim ละเว้น `execution` รายรายการและตั้งค่า `evidenceMode: "slim"`;
`smoke-ci` ตั้งค่าเริ่มต้นเป็น slim และ `--evidence-mode full` คืนค่ารายการเต็ม:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

ใช้ `smoke-ci` สำหรับหลักฐานโปรไฟล์แบบ deterministic ด้วย provider โมเดล mock และ
เซิร์ฟเวอร์ provider ปลอม Crabline ใช้ `release` สำหรับหลักฐาน Stable/LTS กับ live
channels ใช้ `all` เฉพาะสำหรับการรันหลักฐาน taxonomy เต็มแบบชัดเจนเท่านั้น; มันเลือก
ทุกหมวด maturity ที่ active และสามารถ dispatch ผ่าน workflow `QA Profile
Evidence` ด้วย `qa_profile=all` เมื่อคำสั่งต้องใช้โปรไฟล์ root ของ OpenClaw ด้วย
ให้วางโปรไฟล์ root ก่อนคำสั่ง QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flow ของ operator

flow ของ operator QA ปัจจุบันเป็นไซต์ QA แบบสอง pane:

- ซ้าย: dashboard Gateway (Control UI) พร้อม agent
- ขวา: QA Lab ที่แสดง transcript แบบ Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนั้นสร้างไซต์ QA, เริ่มเลน Gateway ที่อิง Docker และเปิดเผย
หน้า QA Lab ที่ operator หรือ loop automation สามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรม channel จริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือ
ยังถูกบล็อกอยู่

สำหรับการ iterate UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้อง rebuild อิมเมจ Docker ทุกครั้ง
ให้เริ่มสแต็กด้วย bundle QA Lab แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
rebuild bundle นั้นเมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะ reload อัตโนมัติเมื่อ hash แอสเซ็ต QA Lab
เปลี่ยน

สำหรับ smoke สัญญาณ OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ OTLP/HTTP ในเครื่อง, รันสถานการณ์ QA `otel-trace-smoke`
โดยเปิดใช้ Plugin `diagnostics-otel` จากนั้น assert ว่า trace,
metric และ log ถูกส่งออก มัน decode span trace protobuf ที่ส่งออก
และตรวจรูปทรงที่สำคัญต่อ release:
`openclaw.run`, `openclaw.harness.run`, span การเรียกโมเดลตาม semantic-convention
GenAI ล่าสุด, `openclaw.context.assembled` และ `openclaw.message.delivery`
ต้องมีอยู่ smoke บังคับใช้
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ดังนั้น span การเรียกโมเดล
ต้องใช้ชื่อ `{gen_ai.operation.name} {gen_ai.request.model}`;
การเรียกโมเดลต้องไม่ส่งออก `StreamAbandoned` ใน turn ที่สำเร็จ; ID diagnostic ดิบและ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace payload OTLP ดิบ
ต้องไม่มี sentinel ของ prompt, sentinel ของ response หรือคีย์ session QA
มันเขียน `otel-smoke-summary.json` ถัดจาก artifact ของ QA suite

สำหรับ smoke OpenTelemetry ที่มี collector รองรับ ให้รัน:

```bash
pnpm qa:otel:collector-smoke
```

เลนนั้นวางคอนเทนเนอร์ Docker OpenTelemetry Collector จริงไว้ด้านหน้า
ตัวรับในเครื่องตัวเดียวกัน ใช้เมื่อเปลี่ยน endpoint wiring, ความเข้ากันได้กับ collector
หรือพฤติกรรม export OTLP ที่ตัวรับใน process อาจปิดบังได้

สำหรับ smoke scrape Prometheus ที่ป้องกันไว้ ให้รัน:

```bash
pnpm qa:prometheus:smoke
```

นามแฝงนั้นรันสถานการณ์ QA `docker-prometheus-smoke` โดยเปิดใช้
`diagnostics-prometheus` ตรวจสอบว่าการ scrape แบบไม่ผ่านการยืนยันตัวตนถูกปฏิเสธ
จากนั้นตรวจสอบว่า scrape ที่ผ่านการยืนยันตัวตนมีชุดเมตริกสำคัญต่อรีลีส
โดยไม่มีเนื้อหา prompt, เนื้อหา response, ตัวระบุการวินิจฉัยดิบ, โทเค็น auth
หรือพาธภายในเครื่อง

หากต้องการรัน smoke ด้าน observability ทั้งสองรายการต่อเนื่องกัน ให้ใช้:

```bash
pnpm qa:observability:smoke
```

สำหรับเลน OpenTelemetry ที่มี collector รองรับ พร้อมกับ smoke การ scrape
Prometheus ที่มีการป้องกัน ให้ใช้:

```bash
pnpm qa:observability:collector-smoke
```

QA ด้าน observability ยังคงใช้ได้เฉพาะ source checkout เท่านั้น npm tarball
จงใจไม่รวม QA Lab ดังนั้นเลนรีลีสแพ็กเกจ Docker จะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` หรือ
`pnpm qa:observability:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน
เครื่องมือวัด diagnostics

สำหรับเลน smoke Matrix ที่ใช้ transport จริงและไม่ต้องใช้ข้อมูลรับรองของ
model-provider ให้รันโปรไฟล์แบบเร็วด้วย provider OpenAI จำลองที่กำหนดผลแน่นอน:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

สำหรับเลน provider live-frontier ให้ระบุข้อมูลรับรองที่เข้ากันได้กับ OpenAI
อย่างชัดเจน:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

เอกสารอ้างอิง CLI ฉบับเต็ม แค็ตตาล็อกโปรไฟล์/สถานการณ์ env vars และผัง artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุปคือ เลนนี้จัดเตรียม Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว รัน Plugin Matrix จริงภายใน Gateway QA ลูกที่จำกัดขอบเขตเฉพาะ transport นั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown สรุป JSON artifact เหตุการณ์ที่สังเกตได้ และ log output รวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สถานการณ์ครอบคลุมพฤติกรรม transport ที่ unit test ไม่สามารถพิสูจน์แบบครบวงจรได้ ได้แก่ mention gating, นโยบาย allow-bot, allowlist, การตอบกลับระดับบนสุดและแบบ thread, การกำหนดเส้นทาง DM, การจัดการ reaction, การระงับ inbound edit, การ dedupe replay หลัง restart, การกู้คืนจาก homeserver interruption, การส่ง metadata approval, การจัดการ media และ flow การ bootstrap/recovery/verification ของ Matrix E2EE โปรไฟล์ CLI ของ E2EE ยังขับคำสั่ง `openclaw matrix encryption setup` และคำสั่ง verification ผ่าน homeserver แบบใช้แล้วทิ้งเดียวกันก่อนตรวจสอบการตอบกลับของ Gateway

Discord ยังมีสถานการณ์ opt-in เฉพาะ Mantis สำหรับการทำซ้ำ bug ใช้
`--scenario discord-status-reactions-tool-only` สำหรับ timeline ของ status reaction
แบบชัดเจน หรือ `--scenario discord-thread-reply-filepath-attachment` เพื่อสร้าง
thread Discord จริงและตรวจสอบว่า `message.thread-reply` เก็บรักษาไฟล์แนบ
`filePath` สถานการณ์เหล่านี้ไม่อยู่ในเลน Discord live เริ่มต้น
เพราะเป็น probe ทำซ้ำก่อน/หลังมากกว่าความครอบคลุม smoke แบบกว้าง
workflow Mantis สำหรับ thread-attachment ยังสามารถเพิ่มวิดีโอพยานจาก Discord Web
ที่ล็อกอินแล้วได้เมื่อกำหนดค่า `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` หรือ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ในสภาพแวดล้อม QA
โปรไฟล์ viewer นั้นใช้สำหรับจับภาพเท่านั้น การตัดสิน pass/fail
ยังมาจาก oracle ของ Discord REST

CI ใช้พื้นผิวคำสั่งเดียวกันใน `.github/workflows/qa-live-transports-convex.yml`
การรันตามตารางเวลาและการรันด้วยมือแบบเริ่มต้นจะรันโปรไฟล์ Matrix แบบเร็วด้วย
ข้อมูลรับรอง live-frontier ที่ QA จัดเตรียมไว้, `--fast` และ
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` การรันด้วยมือที่ `matrix_profile=all`
จะแยกออกเป็น shard โปรไฟล์ห้ารายการ

สำหรับเลน smoke Telegram, Discord, Slack และ WhatsApp ที่ใช้ transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

เลนเหล่านี้ชี้ไปยัง channel จริงที่มีอยู่แล้วพร้อม bot หรือ account สองตัว (driver + SUT) env vars ที่จำเป็น รายการสถานการณ์ output artifacts และ pool ข้อมูลรับรอง Convex มีเอกสารใน [เอกสารอ้างอิง QA สำหรับ Telegram, Discord, Slack และ WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) ด้านล่าง

สำหรับการรัน Slack desktop VM แบบเต็มพร้อม VNC rescue ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นเช่าเครื่อง desktop/browser ของ Crabbox รันเลน Slack live
ภายใน VM เปิด Slack Web ใน browser ของ VNC จับภาพ desktop และคัดลอก
`slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
เมื่อมีการจับวิดีโอกลับไปยังไดเรกทอรี artifact ของ Mantis lease แบบ
desktop/browser ของ Crabbox มีเครื่องมือจับภาพและแพ็กเกจช่วย browser/native-build
ให้ล่วงหน้า ดังนั้นสถานการณ์ควรติดตั้ง fallback เฉพาะบน lease รุ่นเก่าเท่านั้น
Mantis รายงานเวลาโดยรวมและราย phase ใน
`mantis-slack-desktop-smoke-report.md` เพื่อให้การรันที่ช้าแสดงได้ว่าเวลาเสียไปกับ
lease warmup, การรับข้อมูลรับรอง, remote setup หรือการคัดลอก artifact
ใช้ `--lease-id <cbx_...>` ซ้ำหลังจากล็อกอินเข้า Slack Web ด้วยตนเองผ่าน VNC
lease ที่ใช้ซ้ำยังคงทำให้ cache pnpm store ของ Crabbox อุ่นอยู่ ค่าเริ่มต้น
`--hydrate-mode source` ตรวจสอบจาก source checkout และรัน install/build
ภายใน VM ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace ระยะไกลที่ใช้ซ้ำ
มี `node_modules` และ `dist/` ที่ build แล้วอยู่แล้ว โหมดนั้นข้ามขั้นตอน
install/build ที่มีต้นทุนสูงและ fail closed เมื่อ workspace ยังไม่พร้อม
เมื่อมี `--gateway-setup` Mantis จะคง Gateway Slack ของ OpenClaw ที่ทำงานต่อเนื่อง
ไว้ภายใน VM บนพอร์ต `38973`; หากไม่มี คำสั่งจะรันเลน QA Slack แบบ bot-to-bot
ปกติและออกหลังจากจับ artifact

เพื่อพิสูจน์ UI approval ของ Slack แบบ native พร้อมหลักฐาน desktop ให้รันโหมด
approval checkpoint ของ Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

โหมดนี้ใช้ร่วมกับ `--gateway-setup` ไม่ได้ โหมดนี้รันสถานการณ์ approval ของ Slack
ปฏิเสธ scenario ids ที่ไม่ใช่ approval รอในแต่ละสถานะ approval ที่ pending และ
resolved render ข้อความ Slack API ที่สังเกตได้เป็น
`approval-checkpoints/<scenario>-pending.png` และ
`approval-checkpoints/<scenario>-resolved.png` จากนั้นล้มเหลวหาก checkpoint,
หลักฐานข้อความ, acknowledgement หรือ screenshot ที่ render ใดหายไปหรือว่างเปล่า
lease CI แบบ cold อาจยังแสดงหน้า sign-in ของ Slack ใน `slack-desktop-smoke.png`;
รูปภาพ approval checkpoint คือหลักฐานภาพสำหรับเลนนี้

checklist สำหรับ operator, คำสั่ง GitHub workflow dispatch, contract ของ evidence-comment,
ตารางตัดสินใจ hydrate-mode, การตีความ timing และขั้นตอนจัดการ failure อยู่ใน [Runbook Mantis Slack Desktop](/th/concepts/mantis-slack-desktop-runbook)

สำหรับงาน desktop แบบ agent/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` เช่าหรือใช้เครื่อง desktop/browser ของ Crabbox ซ้ำ เริ่ม
`crabbox record --while` ขับ browser ที่มองเห็นได้ผ่าน `visual-driver` ซ้อน
จับ `visual-task.png` รัน `openclaw infer image describe`
กับ screenshot เมื่อเลือก `--vision-mode image-describe` และเขียน
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` prompt ของ vision จะขอ verdict แบบ JSON ที่มีโครงสร้าง
และจะผ่านเฉพาะเมื่อ model รายงานหลักฐานที่มองเห็นได้เชิงบวกเท่านั้น response
เชิงลบที่เพียง quote ข้อความเป้าหมายจะทำให้ assertion ล้มเหลว
ใช้ `--vision-mode metadata` สำหรับ smoke แบบไม่ใช้ model ที่พิสูจน์ plumbing ของ
desktop, browser, screenshot และ video โดยไม่เรียก provider ด้าน image-understanding
การบันทึกเป็น artifact ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox ไม่บันทึก
`visual-task.mp4` ที่ไม่ว่าง งานจะล้มเหลวแม้ visual driver จะผ่านแล้วก็ตาม
เมื่อ failure Mantis จะเก็บ lease ไว้สำหรับ VNC เว้นแต่งานจะผ่านแล้วและไม่ได้ตั้ง
`--keep-lease`

ก่อนใช้ข้อมูลรับรอง live แบบ pooled ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจสอบ env ของ broker Convex ตรวจสอบ endpoint settings และตรวจสอบการเข้าถึง admin/list เมื่อมี maintainer secret โดยรายงานเฉพาะสถานะ set/missing ของ secrets

## ความครอบคลุม transport live

เลน transport live ใช้ contract เดียวกัน แทนที่แต่ละเลนจะคิดรูปแบบรายการสถานการณ์ของตนเอง `qa-channel` คือชุดทดสอบ product-behavior แบบสังเคราะห์ที่กว้าง และไม่ได้เป็นส่วนหนึ่งของ matrix ความครอบคลุม transport live

runner ของ transport live ควร import scenario ids ที่ใช้ร่วมกัน
helper coverage baseline และ helper สำหรับเลือกสถานการณ์จาก
`openclaw/plugin-sdk/qa-live-transport-scenarios`

| เลน      | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

สิ่งนี้คง `qa-channel` ไว้เป็นชุดทดสอบ product-behavior แบบกว้าง ขณะที่ Matrix,
Telegram และ transport live อื่น ๆ ใช้ checklist transport-contract ที่ชัดเจนชุดเดียวกัน

สำหรับเลน Linux VM แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาในพาธ QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้ boot guest Multipass ใหม่ ติดตั้ง dependencies build OpenClaw
ภายใน guest รัน `qa suite` จากนั้นคัดลอกรายงาน QA และสรุปปกติ
กลับไปยัง `.artifacts/qa-e2e/...` บน host
คำสั่งนี้ใช้พฤติกรรมการเลือกสถานการณ์เดียวกันกับ `qa suite` บน host
การรัน suite บน host และ Multipass จะรันสถานการณ์ที่เลือกหลายรายการแบบ parallel
โดยใช้ worker ของ Gateway ที่แยกกันเป็นค่าเริ่มต้น `qa-channel` มีค่า concurrency
เริ่มต้นเป็น 4 และถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับจำนวน
worker หรือ `--concurrency 1` สำหรับการรันแบบ serial
ใช้ `--pack personal-agent` เพื่อรัน benchmark pack ของ personal assistant
ตัวเลือก pack เป็นแบบ additive ร่วมกับ flag `--scenario` ที่ระบุซ้ำได้:
สถานการณ์ที่ระบุโดยตรงจะรันก่อน จากนั้นสถานการณ์ใน pack จะรันตามลำดับ pack
พร้อมลบรายการซ้ำ
ใช้ `--pack observability` เมื่อ runner QA แบบกำหนดเองจัดเตรียมการตั้งค่า
OpenTelemetry collector อยู่แล้วและต้องการเลือกสถานการณ์ smoke ของ diagnostics
OpenTelemetry และ Prometheus ร่วมกัน
คำสั่งจะออกด้วย non-zero เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
ต้องการ artifact โดยไม่ให้ exit code ล้มเหลว
การรัน live จะ forward input auth ของ QA ที่รองรับและใช้ได้จริงสำหรับ guest:
provider keys ผ่าน env, พาธ config ของ provider live สำหรับ QA และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount ไว้ได้

## ข้อมูลอ้างอิง QA สำหรับ Telegram, Discord, Slack และ WhatsApp

Matrix มี[หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากมีจำนวนสถานการณ์มากและมีการจัดเตรียม homeserver ที่รองรับด้วย Docker ส่วน Telegram, Discord, Slack และ WhatsApp ทำงานกับระบบขนส่งจริงที่มีอยู่แล้ว ดังนั้นข้อมูลอ้างอิงของระบบเหล่านี้จึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                            | คำอธิบาย                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | ตำแหน่งที่เขียนรายงาน สรุป หลักฐาน อาร์ติแฟกต์เฉพาะระบบขนส่ง และบันทึกเอาต์พุต พาธสัมพัทธ์จะ resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                    | รากของรีโพสิทอรีเมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | id บัญชีชั่วคราวภายใน config ของ QA gateway                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` หรือ `live-frontier` (`live-openai` แบบ legacy ยังใช้งานได้)                                                                            |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                   | refs ของโมเดลหลัก/สำรอง                                                                                                                   |
| `--fast`                              | ปิด                                                | โหมดเร็วของ provider เมื่อรองรับ                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | ดู [พูลข้อมูลประจำตัว Convex](#convex-credential-pool)                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                 | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                                                    |

แต่ละเลนจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อมีสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้งรหัสออกเป็นล้มเหลว

### QA สำหรับ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปที่กลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแยกกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอตต่อบอตทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้ **โหมดการสื่อสารแบบบอตต่อบอต** ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id แชตตัวเลข (สตริง)
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

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

ชุดค่าเริ่มต้นโดยนัยจะครอบคลุม canary, mention gating, การตอบกลับคำสั่ง native, การระบุที่อยู่คำสั่ง และการตอบกลับในกลุ่มแบบบอตต่อบอตเสมอ ค่าเริ่มต้นของ `mock-openai` ยังรวมการตรวจสอบ reply-chain แบบกำหนดได้และการสตรีม final-message ด้วย `telegram-current-session-status-tool` ยังคงเป็นแบบ opt-in เพราะเสถียรเฉพาะเมื่อถูกร้อยต่อโดยตรงหลัง canary ไม่ใช่หลังการตอบกลับคำสั่ง native ใดๆ ใช้ `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` เพื่อพิมพ์การแบ่งค่าเริ่มต้น/ตัวเลือกปัจจุบันพร้อม refs ของ regression

อาร์ติแฟกต์เอาต์พุต:

- `telegram-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบระบบขนส่งแบบ live รวมถึงฟิลด์ profile, coverage, provider, channel, artifacts, result และ RTT

การรัน Telegram ของแพ็กเกจใช้สัญญาข้อมูลประจำตัว Telegram เดียวกัน การวัด RTT ซ้ำเป็นส่วนหนึ่งของเลน live Telegram ของแพ็กเกจตามปกติ; การกระจาย RTT จะถูกรวมไว้ใน `qa-evidence.json` ภายใต้ `result.timing` สำหรับการตรวจสอบ RTT ที่เลือก

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

เมื่อกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` wrapper live ของแพ็กเกจจะเช่าข้อมูลประจำตัว `kind: "telegram"` ส่งออก env ของกลุ่ม/driver/บอต SUT ที่เช่าไปยังการรันแพ็กเกจที่ติดตั้งแล้ว ทำ Heartbeat กับสัญญาเช่า และปล่อยสัญญาเช่าเมื่อ shutdown wrapper ของแพ็กเกจมีค่าเริ่มต้นเป็นการตรวจสอบ RTT 20 ครั้งของ `telegram-mentioned-message-reply`, timeout RTT 30 วินาที และบทบาท Convex เป็น `maintainer` นอก CI เมื่อเลือก Convex ปรับ `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับการวัด RTT โดยไม่ต้องสร้างคำสั่ง RTT แยกต่างหากหรือรูปแบบสรุปเฉพาะ Telegram

### QA สำหรับ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปที่ช่อง guild ส่วนตัวจริงของ Discord หนึ่งช่องที่มีบอตสองตัว: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ย่อยของ OpenClaw ผ่าน Plugin Discord ที่ bundle มา ตรวจสอบการจัดการการ mention ในช่อง ว่าบอต SUT ได้ลงทะเบียนคำสั่ง native `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - ต้องตรงกับ id ผู้ใช้ของบอต SUT ที่ Discord ส่งคืน (มิฉะนั้นเลนจะล้มเหลวอย่างรวดเร็ว)

ตัวเลือก:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` เลือกช่อง voice/stage สำหรับ `discord-voice-autojoin`; หากไม่มี สถานการณ์จะเลือกช่อง voice/stage แรกที่มองเห็นได้สำหรับบอต SUT

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - สถานการณ์เสียงแบบ opt-in รันแยกเดี่ยว เปิดใช้ `channels.discord.voice.autoJoin` และตรวจสอบว่าสถานะเสียง Discord ปัจจุบันของบอต SUT คือช่อง voice/stage เป้าหมาย ข้อมูลประจำตัว Discord ของ Convex อาจรวม `voiceChannelId` ที่เป็นตัวเลือก; มิฉะนั้น runner จะค้นหาช่อง voice/stage แรกที่มองเห็นได้ใน guild
- `discord-status-reactions-tool-only` - สถานการณ์ Mantis แบบ opt-in รันแยกเดี่ยวเพราะเปลี่ยน SUT ให้เป็นการตอบกลับ guild แบบ always-on และ tool-only ด้วย `messages.statusReactions.enabled=true` จากนั้นจับ timeline ของ reaction ผ่าน REST พร้อมอาร์ติแฟกต์ภาพ HTML/PNG รายงาน Mantis before/after ยังเก็บอาร์ติแฟกต์ MP4 ที่สถานการณ์ให้มาเป็น `baseline.mp4` และ `candidate.mp4`

รันสถานการณ์ Discord voice auto-join โดยระบุชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

รันสถานการณ์ Mantis status-reaction โดยระบุชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

อาร์ติแฟกต์เอาต์พุต:

- `discord-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบระบบขนส่งแบบ live
- `discord-qa-observed-messages.json` - เนื้อหาจะถูก redact เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อรันสถานการณ์ status-reaction

### QA สำหรับ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายไปที่ช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอตสองตัวแยกกัน: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ย่อยของ OpenClaw ผ่าน Plugin Slack ที่ bundle มา

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` เปิดใช้ checkpoint การอนุมัติแบบภาพสำหรับ Mantis runner จะเขียน `<scenario>.pending.json` และ `<scenario>.resolved.json` จากนั้นรอไฟล์ `.ack.json` ที่ตรงกัน
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` override timeout การ acknowledgement ของ checkpoint ค่าเริ่มต้นคือ `120000`

สถานการณ์ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - สถานการณ์การอนุมัติ exec native ของ Slack แบบ opt-in ขอการอนุมัติ exec ผ่าน Gateway ตรวจสอบว่าข้อความ Slack มีปุ่มอนุมัติ native แก้ไขสถานะ แล้วตรวจสอบการอัปเดต Slack ที่แก้ไขแล้ว
- `slack-approval-plugin-native` - สถานการณ์การอนุมัติ Plugin native ของ Slack แบบ opt-in เปิดใช้การส่งต่อการอนุมัติ exec และ Plugin พร้อมกันเพื่อไม่ให้เหตุการณ์ Plugin ถูกระงับโดยการ routing การอนุมัติ exec จากนั้นตรวจสอบเส้นทาง UI ของ Slack native แบบ pending/resolved เดียวกัน

อาร์ติแฟกต์เอาต์พุต:

- `slack-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบระบบขนส่งแบบ live
- `slack-qa-observed-messages.json` - เนื้อหาจะถูก redact เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`
- `approval-checkpoints/` - เฉพาะเมื่อ Mantis ตั้งค่า `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; มี JSON ของ checkpoint, JSON ของ acknowledgement และภาพหน้าจอ pending/resolved

#### การตั้งค่า workspace ของ Slack

เลนนี้ต้องมีแอป Slack สองแอปแยกกันใน workspace เดียว พร้อมช่องที่บอตทั้งสองเป็นสมาชิก:

- `channelId` - id `Cxxxxxxxxxx` ของช่องที่บอตทั้งสองได้รับเชิญ ใช้ช่องเฉพาะ; เลนจะโพสต์ทุกครั้งที่รัน
- `driverBotToken` - โทเค็นบอต (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` - โทเค็นบอต (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกจาก driver เพื่อให้ id ผู้ใช้บอตไม่ซ้ำกัน
- `sutAppToken` - โทเค็นระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับเหตุการณ์ได้

ควรใช้ workspace ของ Slack ที่จัดไว้สำหรับ QA โดยเฉพาะแทนการใช้ workspace production ซ้ำ

manifest ของ SUT ด้านล่างจงใจจำกัดการติดตั้ง production ของ Plugin Slack ที่ bundle มา (`extensions/slack/src/setup-shared.ts:10`) ให้เหลือ permissions และ events ที่ครอบคลุมโดยชุด QA แบบ live ของ Slack สำหรับการตั้งค่าช่อง production ตามที่ผู้ใช้เห็น ดู [การตั้งค่าด่วนช่อง Slack](/th/channels/slack#quick-setup); คู่ QA Driver/SUT ถูกแยกไว้โดยตั้งใจเพราะเลนต้องใช้ id ผู้ใช้บอตสองตัวที่แตกต่างกันใน workspace เดียว

**1. สร้างแอป Driver**

ไปที่ [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → เลือกเวิร์กสเปซ QA วาง manifest ต่อไปนี้ แล้วกด _Install to Workspace_:

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) - ค่านี้จะเป็น `driverBotToken` Driver ต้องใช้เพียงการโพสต์ข้อความและระบุตัวตนของตัวเองเท่านั้น ไม่ต้องมี events และไม่ต้องใช้ Socket Mode

**2. สร้างแอป SUT**

ทำ _Create New App → From a manifest_ ซ้ำในเวิร์กสเปซเดียวกัน แอป QA นี้ตั้งใจใช้ manifest สำหรับโปรดักชันของ Slack plugin ที่บันเดิลมาในเวอร์ชันที่แคบกว่า (`extensions/slack/src/setup-shared.ts:10`): ละเว้น reaction scopes และ events เพราะชุดทดสอบ Slack QA แบบ live ยังไม่ครอบคลุมการจัดการ reaction

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

ตรวจสอบว่า bot ทั้งสองมี user id แยกกันโดยเรียก `auth.test` กับแต่ละ token Runtime แยก driver และ SUT ด้วย user id; การใช้แอปเดียวซ้ำสำหรับทั้งสองอย่างจะทำให้ mention-gating ล้มเหลวทันที

**3. สร้างช่อง**

ในเวิร์กสเปซ QA ให้สร้างช่องหนึ่งช่อง (เช่น `#openclaw-qa`) และเชิญ bot ทั้งสองจากภายในช่อง:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอก id `Cxxxxxxxxxx` จาก _channel info → About → Channel ID_ - ค่านี้จะเป็น `channelId` ช่องสาธารณะใช้ได้ หากคุณใช้ช่องส่วนตัว ทั้งสองแอปมี `groups:history` อยู่แล้ว ดังนั้นการอ่าน history ของ harness จะยังสำเร็จ

**4. ลงทะเบียนข้อมูลประจำตัว**

มีสองตัวเลือก ใช้ env vars สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือ seed shared Convex pool เพื่อให้ CI และผู้ดูแลรายอื่น lease ได้

สำหรับ Convex pool ให้เขียนฟิลด์ทั้งสี่ลงในไฟล์ JSON:

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

คาดหวัง `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบแบบ end to end**

รัน lane ในเครื่องเพื่อยืนยันว่า bot ทั้งสองคุยกันผ่าน broker ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านจะเสร็จภายในไม่ถึง 30 วินาที และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` เป็นสถานะ `pass` หาก lane ค้างประมาณ 90 วินาทีแล้วออกด้วย `Convex credential pool exhausted for kind "slack"` แปลว่า pool ว่างหรือทุกแถวถูก lease อยู่ - `qa credentials list --kind slack --status all --json` จะบอกได้ว่าเป็นกรณีใด

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

กำหนดเป้าหมายไปยังบัญชี WhatsApp Web เฉพาะสองบัญชี: บัญชี driver ที่ควบคุมโดย harness และบัญชี SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน WhatsApp plugin ที่บันเดิลมา

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

ตัวเลือกเพิ่มเติม:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` เปิดใช้งานสถานการณ์กลุ่ม เช่น
  `whatsapp-mention-gating` และ `whatsapp-group-allowlist-block`
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน
  artifacts ของ observed-message

แคตตาล็อกสถานการณ์ (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline และ group gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- คำสั่ง native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- พฤติกรรม reply และ final-output: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- สื่อขาเข้าและข้อความแบบมีโครงสร้าง: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. รายการเหล่านี้ส่งเหตุการณ์รูปภาพ เสียง
  เอกสาร ตำแหน่งที่ตั้ง รายชื่อผู้ติดต่อ และสติกเกอร์ของ WhatsApp จริงผ่าน driver
- ความครอบคลุมของ Gateway ขาออกและ message action:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- ความครอบคลุมของ access-control: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- การอนุมัติ native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Status reactions: `whatsapp-status-reactions`.

ปัจจุบันแคตตาล็อกมี 36 สถานการณ์ lane เริ่มต้น `live-frontier` ถูกจำกัดให้เล็กที่ 10 สถานการณ์เพื่อให้มี smoke coverage ที่รวดเร็ว lane เริ่มต้น `mock-openai` รันสถานการณ์แบบ deterministic 31 รายการผ่าน WhatsApp transport จริง โดย mock เฉพาะผลลัพธ์ของ model สถานการณ์ approval และการตรวจสอบที่หนักกว่าหรืออาจบล็อกบางรายการยังคงต้องระบุ scenario id อย่างชัดเจน

WhatsApp QA driver สังเกตการณ์ live events แบบมีโครงสร้าง (`text`, `media`,
`location`, `reaction` และ `poll`) และสามารถส่งสื่อ โพล รายชื่อผู้ติดต่อ ตำแหน่งที่ตั้ง และสติกเกอร์ได้โดยตรง QA Lab นำเข้า driver นั้นผ่านพื้นผิวแพ็กเกจ `@openclaw/whatsapp/api.js` แทนการเข้าถึงไฟล์ runtime ส่วนตัวของ WhatsApp โดยตรง เนื้อหาข้อความจะถูก redact ตามค่าเริ่มต้น ความครอบคลุมของ poll ขาออกและ upload-file รันผ่านการเรียก Gateway `poll` และ `message.action` แบบ deterministic แทนการเรียกใช้เครื่องมือด้วย model prompt อย่างเดียว

Artifacts เอาต์พุต:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบ live transport
- `whatsapp-qa-observed-messages.json` - เนื้อหาจะถูก redact เว้นแต่ตั้งค่า `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`

### Convex credential pool

lane ของ Telegram, Discord, Slack และ WhatsApp สามารถ lease ข้อมูลประจำตัวจาก shared Convex pool แทนการอ่าน env vars ด้านบนได้ ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอ lease แบบ exclusive, ส่ง Heartbeat ตลอดระยะเวลาการรัน และ release เมื่อ shutdown ชนิดของ pool คือ `"telegram"`, `"discord"`, `"slack"` และ `"whatsapp"`

รูปทรง payload ที่ broker ตรวจสอบบน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- ผู้ใช้จริงของ Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - สำหรับ Mantis Telegram Desktop proof เท่านั้น lane ทั่วไปของ QA Lab ต้องไม่ acquire ชนิดนี้
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - หมายเลขโทรศัพท์ต้องเป็นสตริง E.164 ที่แตกต่างกัน

เวิร์กโฟลว์ Mantis Telegram Desktop proof ถือ lease `telegram-user` ของ Convex แบบ exclusive หนึ่งรายการสำหรับทั้ง TDLib CLI driver และ Telegram Desktop witness จากนั้นจึง release หลังเผยแพร่ proof

เมื่อ PR ต้องใช้ visual diff แบบ deterministic Mantis สามารถใช้คำตอบ mock model เดียวกันบน `main` และบน PR head ขณะที่ formatter หรือ delivery layer ของ Telegram เปลี่ยนแปลง ค่าเริ่มต้นของ capture ถูกปรับให้เหมาะกับ PR comments: คลาส Crabbox มาตรฐาน, การบันทึกเดสก์ท็อป 24fps, motion GIF 24fps และความกว้าง preview 1920px ความคิดเห็น before/after ควรเผยแพร่ bundle ที่สะอาดซึ่งมีเฉพาะ GIF ที่ตั้งใจไว้เท่านั้น

Slack lanes สามารถใช้ pool ได้เช่นกัน การตรวจสอบรูปทรง payload ของ Slack ปัจจุบันอยู่ใน Slack QA runner แทน broker; ใช้ `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` พร้อม Slack channel id เช่น `Cxxxxxxxxxx` ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการเตรียมแอปและ scope

env vars สำหรับการปฏิบัติงานและ contract ของ Convex broker endpoint อยู่ใน [การทดสอบ → ข้อมูลประจำตัว Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มีมาก่อน multi-channel pool; semantics ของ lease ใช้ร่วมกันทุกชนิด)

## Seeds ที่อิง repo

Seed assets อยู่ใน `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

ไฟล์เหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ agent

`qa-lab` ควรคงเป็นตัวรันสถานการณ์ YAML แบบทั่วไป ไฟล์ YAML ของแต่ละสถานการณ์คือแหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- `title` ระดับบนสุด
- metadata `scenario`
- metadata หมวดหมู่ capability, lane และ risk แบบไม่บังคับใน `scenario`
- refs ของ docs และ code ใน `scenario`
- ข้อกำหนด Plugin แบบไม่บังคับใน `scenario`
- patch การกำหนดค่า Gateway แบบไม่บังคับใน `scenario`
- `flow` ระดับบนสุดที่ execute ได้สำหรับสถานการณ์ flow หรือ `scenario.execution.kind` /
  `scenario.execution.path` สำหรับสถานการณ์ Vitest และ Playwright

พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งรองรับ `flow` ได้รับอนุญาตให้คงความเป็นแบบทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ YAML สามารถผสานตัวช่วยฝั่งทรานสปอร์ต
กับตัวช่วยฝั่งเบราว์เซอร์ที่ขับเคลื่อน Control UI แบบฝังผ่านรอยต่อ
Gateway `browser.request` โดยไม่ต้องเพิ่มรันเนอร์กรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนที่จะเป็นโฟลเดอร์
ในซอร์สทรี รักษา ID ของสถานการณ์ให้คงที่เมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการสืบย้อนกลับไปยังการนำไปใช้

รายการพื้นฐานควรกว้างพอที่จะครอบคลุม:

- แชต DM และช่องทาง
- พฤติกรรมเธรด
- วงจรชีวิตของการกระทำกับข้อความ
- การเรียกกลับ cron
- การเรียกคืนหน่วยความจำ
- การสลับโมเดล
- การส่งต่อไปยังเอเจนต์ย่อย
- การอ่านรีโพและการอ่านเอกสาร
- งานบิลด์ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของผู้ให้บริการ

`qa suite` มีเลน mock ผู้ให้บริการภายในเครื่องสองเลน:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ เลนนี้ยังคงเป็นเลน mock
  แบบกำหนดแน่นอนเริ่มต้นสำหรับ QA ที่มีรีโพรองรับและเกตความเท่าเทียม
- `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่รองรับด้วย AIMock สำหรับความครอบคลุมด้านโปรโตคอล
  ฟิกซ์เจอร์ การบันทึก/เล่นซ้ำ และ chaos แบบทดลอง เป็นส่วนเสริมและไม่ได้แทนที่
  ตัวแจกจ่ายสถานการณ์ `mock-openai`

การนำเลนผู้ให้บริการไปใช้อยู่ภายใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้น การเริ่มเซิร์ฟเวอร์ภายในเครื่อง การกำหนดค่าโมเดล Gateway
ความต้องการเตรียม auth-profile และแฟล็กความสามารถ live/mock ของตน โค้ด suite และ
gateway ที่ใช้ร่วมกันควรเส้นทางผ่าน registry ผู้ให้บริการแทนการแตกแขนงตาม
ชื่อผู้ให้บริการ

## อะแดปเตอร์ทรานสปอร์ต

`qa-lab` เป็นเจ้าของรอยต่อทรานสปอร์ตทั่วไปสำหรับสถานการณ์ QA แบบ YAML `qa-channel` คือ
ค่าเริ่มต้นสังเคราะห์ `crabline` เริ่มเซิร์ฟเวอร์ภายในเครื่องที่มีรูปทรงเหมือนผู้ให้บริการและรัน
Plugin ช่องทางปกติของ OpenClaw กับเซิร์ฟเวอร์เหล่านั้น `live` สงวนไว้สำหรับ
ข้อมูลรับรองผู้ให้บริการจริงและช่องทางภายนอก

ในระดับสถาปัตยกรรม การแบ่งเป็นดังนี้:

- `qa-lab` เป็นเจ้าของการดำเนินสถานการณ์ทั่วไป การทำงานพร้อมกันของ worker การเขียน artifact และการรายงาน
- อะแดปเตอร์ทรานสปอร์ตเป็นเจ้าของการกำหนดค่า gateway, readiness, การสังเกต inbound และ outbound, การกระทำทรานสปอร์ต และสถานะทรานสปอร์ตที่ถูกทำให้เป็นมาตรฐาน
- ไฟล์สถานการณ์ YAML ภายใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` จัดเตรียมพื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งดำเนินการไฟล์เหล่านั้น

### การเพิ่มช่องทาง

การเพิ่มช่องทางเข้าสู่ระบบ QA แบบ YAML ต้องมีการนำช่องทางไปใช้พร้อม
ชุดสถานการณ์ที่ทดสอบสัญญาของช่องทาง สำหรับความครอบคลุม CI แบบ smoke ให้เพิ่ม
เซิร์ฟเวอร์ผู้ให้บริการปลอม Crabline ที่ตรงกันและเปิดให้ใช้ผ่านไดรเวอร์ `crabline`

อย่าเพิ่มรูทคำสั่ง QA ระดับบนสุดใหม่เมื่อโฮสต์ `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไกโฮสต์ที่ใช้ร่วมกัน:

- รูทคำสั่ง `openclaw qa`
- การเริ่มต้นและการปิด suite
- การทำงานพร้อมกันของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินสถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Plugin รันเนอร์เป็นเจ้าของสัญญาทรานสปอร์ต:

- วิธีติดตั้ง `openclaw qa <runner>` ใต้รูท `qa` ที่ใช้ร่วมกัน
- วิธีตั้งค่า gateway สำหรับทรานสปอร์ตนั้น
- วิธีตรวจสอบ readiness
- วิธีฉีดเหตุการณ์ inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และสถานะทรานสปอร์ตที่ถูกทำให้เป็นมาตรฐาน
- วิธีดำเนินการกระทำที่มีทรานสปอร์ตรองรับ
- วิธีจัดการการรีเซ็ตหรือการล้างข้อมูลเฉพาะทรานสปอร์ต

เกณฑ์ขั้นต่ำสำหรับการรับช่องทางใหม่:

1. ให้ `qa-lab` เป็นเจ้าของรูท `qa` ที่ใช้ร่วมกันต่อไป
2. นำรันเนอร์ทรานสปอร์ตไปใช้บนรอยต่อโฮสต์ `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะทรานสปอร์ตไว้ภายใน Plugin รันเนอร์หรือ harness ช่องทาง
4. ติดตั้งรันเนอร์เป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่งรูทที่แข่งขันกัน Plugin รันเนอร์ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และส่งออกอาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` รักษา `runtime-api.ts` ให้เบา; CLI แบบ lazy และการดำเนินรันเนอร์ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ YAML ภายใต้ไดเรกทอรี `qa/scenarios/` ตามธีม
6. ใช้ตัวช่วยสถานการณ์ทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias ความเข้ากันได้ที่มีอยู่ให้ทำงานต่อไป เว้นแต่รีโพกำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงครั้งเดียวใน `qa-lab` ได้ ให้วางไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับทรานสปอร์ตช่องทางเดียว ให้เก็บไว้ใน Plugin รันเนอร์หรือ harness Plugin นั้น
- หากสถานการณ์ต้องการความสามารถใหม่ที่มากกว่าหนึ่งช่องทางสามารถใช้ได้ ให้เพิ่มตัวช่วยทั่วไปแทนการแตกแขนงเฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะสำหรับทรานสปอร์ตเดียว ให้รักษาสถานการณ์ให้เฉพาะทรานสปอร์ตและทำให้ชัดเจนในสัญญาสถานการณ์

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

alias ความเข้ากันได้ยังคงมีให้สำหรับสถานการณ์ที่มีอยู่ - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อทั่วไป alias มีอยู่เพื่อหลีกเลี่ยง migration วันเดียวทั้งระบบ ไม่ใช่เพื่อเป็นรูปแบบต่อไปในอนาคต

## การรายงาน

`qa-lab` ส่งออกรายงานโปรโตคอล Markdown จากไทม์ไลน์บัสที่สังเกตได้
รายงานควรตอบว่า:

- สิ่งใดทำงาน
- สิ่งใดล้มเหลว
- สิ่งใดยังคงถูกบล็อก
- สถานการณ์ติดตามผลใดที่ควรเพิ่ม

สำหรับ inventory ของสถานการณ์ที่มีให้ใช้ - มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อมทรานสปอร์ตใหม่ - ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)
เมื่อเลือกหลักฐานเฉพาะจุดสำหรับพฤติกรรมหรือพาธไฟล์ที่ถูกแตะ ให้รัน `pnpm openclaw qa coverage --match <query>`
รายงาน match จะค้นหา metadata ของสถานการณ์, refs เอกสาร, refs โค้ด, ID ความครอบคลุม, Plugin และข้อกำหนดผู้ให้บริการ จากนั้นพิมพ์เป้าหมาย `qa suite --scenario ...` ที่ตรงกัน
การรัน `qa suite` ทุกครั้งจะเขียน artifact ระดับบนสุด `qa-evidence.json`,
`qa-suite-summary.json` และ `qa-suite-report.md` สำหรับชุดสถานการณ์ที่เลือก
สถานการณ์ที่ประกาศ `execution.kind: vitest` หรือ
`execution.kind: playwright` จะรันพาธทดสอบที่ตรงกันและเขียน
ล็อกต่อสถานการณ์ด้วย สถานการณ์ที่ประกาศ `execution.kind: script` จะรัน
ผู้ผลิตหลักฐานที่ `execution.path` ผ่าน `node --import tsx` (โดยขยาย
`${outputDir}` และ `${scenarioId}` ใน `execution.args`); ผู้ผลิตจะเขียน
`qa-evidence.json` ของตนเอง ซึ่งรายการของมันจะถูกนำเข้าไปยังเอาต์พุต suite
และพาธ artifact ของมันจะถูก resolve โดยสัมพันธ์กับ
`qa-evidence.json` ของผู้ผลิตนั้น เมื่อเข้าถึง `qa suite` ผ่าน
`qa run --qa-profile` ไฟล์ `qa-evidence.json` เดียวกันจะรวมสรุป scorecard
ของโปรไฟล์สำหรับหมวด taxonomy ที่เลือกด้วย
ให้ถือเป็นตัวช่วยค้นพบ ไม่ใช่ตัวแทนเกต; สถานการณ์ที่เลือกยังต้องใช้โหมดผู้ให้บริการ live transport, Multipass, Testbox หรือเลน release ที่เหมาะสมสำหรับพฤติกรรมที่ทดสอบ
สำหรับบริบท scorecard โปรดดู [scorecard วุฒิภาวะ](/th/maturity/scorecard)

สำหรับการตรวจสอบอักขระและสไตล์ ให้รันสถานการณ์เดียวกันข้าม ref โมเดล live หลายรายการ
และเขียนรายงาน Markdown ที่ผ่านการตัดสิน:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

คำสั่งนี้รันกระบวนการลูก QA gateway ภายในเครื่อง ไม่ใช่ Docker สถานการณ์ character eval
ควรตั้ง persona ผ่าน `SOUL.md` แล้วรัน turn ผู้ใช้ปกติ
เช่น แชต ความช่วยเหลือใน workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลผู้สมัคร
ว่ากำลังถูกประเมิน คำสั่งจะเก็บ transcript เต็มแต่ละรายการ
บันทึกสถิติการรันพื้นฐาน จากนั้นถามโมเดลผู้ตัดสินในโหมด fast พร้อม
การให้เหตุผล `xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: prompt ผู้ตัดสินยังได้รับ
transcript และสถานะการรันทุกอย่าง แต่ ref ผู้สมัครจะถูกแทนที่ด้วย
ป้ายกำกับเป็นกลาง เช่น `candidate-01`; รายงานจะ map อันดับกลับไปยัง ref จริงหลัง
การ parse
การรันผู้สมัครตั้งค่าเริ่มต้นเป็น thinking `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ ref eval ของ OpenAI รุ่นเก่าที่รองรับ Override ผู้สมัครเฉพาะรายแบบ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้งค่า
fallback ทั่วโลก และรูปแบบเก่า `--model-thinking <provider/model=level>` ถูก
เก็บไว้เพื่อความเข้ากันได้
ref ผู้สมัคร OpenAI ตั้งค่าเริ่มต้นเป็นโหมด fast เพื่อให้ใช้ priority processing ในที่ที่
ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
ผู้สมัครหรือผู้ตัดสินรายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast สำหรับโมเดลผู้สมัครทุกตัว ระยะเวลาของผู้สมัครและผู้ตัดสินจะ
ถูกบันทึกในรายงานเพื่อการวิเคราะห์ benchmark แต่ prompt ผู้ตัดสินระบุอย่างชัดเจน
ว่าอย่าจัดอันดับตามความเร็ว
การรันโมเดลผู้สมัครและผู้ตัดสินต่างมีค่าเริ่มต้น concurrency เป็น 16 ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดผู้ให้บริการหรือแรงกดดัน
gateway ภายในเครื่องทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่ได้ส่ง `--model` ผู้สมัคร character eval จะตั้งค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` ผู้ตัดสินจะตั้งค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-8,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [เมทริกซ์ QA](/th/concepts/qa-matrix)
- [scorecard วุฒิภาวะ](/th/maturity/scorecard)
- [ชุด benchmark เอเจนต์ส่วนบุคคล](/th/concepts/personal-agent-benchmark-pack)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
