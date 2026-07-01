---
read_when:
    - ทำความเข้าใจว่าสแต็ก QA ทำงานร่วมกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การขนส่ง
    - การเพิ่มสถานการณ์ QA ที่รองรับโดยรีโป
    - การสร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นรอบแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์จำลองที่รองรับด้วยรีโป, เลนการขนส่งแบบสด, อะแดปเตอร์การขนส่ง และการรายงาน.'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-07-01T08:42:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงกว่าและ
มีลักษณะเป็นช่องทางมากกว่าที่ unit test เดี่ยวจะทำได้

ส่วนประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, ช่องทาง, เธรด,
  reaction, edit และ delete
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin ตัวรันในอนาคต: อะแดปเตอร์ live-transport ที่
  ขับช่องทางจริงภายใน QA gateway ลูก
- `qa/`: seed assets ที่อิง repo สำหรับงาน kickoff และ baseline QA
  scenarios
- [Mantis](/th/concepts/mantis): การตรวจสอบ live ก่อนและหลังสำหรับบั๊กที่
  ต้องใช้ transport จริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุก QA flow รันภายใต้ `pnpm openclaw qa <subcommand>` หลายคำสั่งมี alias script `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | QA self-check แบบ bundled โดยไม่มี `--qa-profile`; ตัวรัน maturity profile ที่อิง taxonomy พร้อม `--qa-profile smoke-ci`, `--qa-profile release` หรือ `--qa-profile all`                                                                                                      |
| `qa suite`                                          | รัน scenarios ที่อิง repo กับเลน QA gateway Alias: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                                                                                                  |
| `qa coverage`                                       | พิมพ์ inventory ของ scenario coverage แบบ YAML (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                                                                                                                               |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงาน agentic parity หรือใช้ `--runtime-axis --token-efficiency` เพื่อเขียนรายงาน runtime parity และ token-efficiency ของ Codex-vs-OpenClaw จากสรุป runtime-pair หนึ่งรายการ                                         |
| `qa character-eval`                                 | รัน character QA scenario ข้าม live models หลายตัวพร้อมรายงานที่มีการตัดสิน ดู [การรายงาน](#reporting)                                                                                                                                                            |
| `qa manual`                                         | รัน prompt แบบครั้งเดียวกับเลน provider/model ที่เลือก                                                                                                                                                                                                          |
| `qa ui`                                             | เริ่ม QA debugger UI และ QA bus ภายในเครื่อง (alias: `pnpm qa:lab:ui`)                                                                                                                                                                                                    |
| `qa docker-build-image`                             | สร้าง QA Docker image ที่ prebake ไว้                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | เขียน docker-compose scaffold สำหรับ QA dashboard + gateway lane                                                                                                                                                                                                    |
| `qa up`                                             | สร้าง QA site, เริ่มสแต็กที่อิง Docker, พิมพ์ URL (alias: `pnpm qa:lab:up`; variant `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                                                                                                  |
| `qa aimock`                                         | เริ่มเฉพาะ AIMock provider server                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | เริ่มเฉพาะ provider server `mock-openai` ที่รับรู้ scenario                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการ credential pool ของ Convex ที่ใช้ร่วมกัน                                                                                                                                                                                                                               |
| `qa matrix`                                         | เลน live transport กับ Tuwunel homeserver แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                                                                                                      |
| `qa telegram`                                       | เลน live transport กับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                                                                                              |
| `qa discord`                                        | เลน live transport กับช่อง guild ของ Discord ส่วนตัวจริง                                                                                                                                                                                                       |
| `qa slack`                                          | เลน live transport กับช่อง Slack ส่วนตัวจริง                                                                                                                                                                                                               |
| `qa whatsapp`                                       | เลน live transport กับบัญชี WhatsApp Web จริง                                                                                                                                                                                                                 |
| `qa mantis`                                         | ตัวรันการตรวจสอบก่อนและหลังสำหรับบั๊ก live transport พร้อมหลักฐาน status-reactions ของ Discord, smoke ของ Crabbox desktop/browser และ smoke ของ Slack-in-VNC ดู [Mantis](/th/concepts/mantis) และ [Mantis Slack Desktop Runbook](/th/concepts/mantis-slack-desktop-runbook) |

`qa run` ที่อิง profile อ่านสมาชิกจาก `taxonomy.yaml` แล้ว dispatch
scenarios ที่ resolve แล้วผ่าน `qa suite` `--surface` และ
`--category` กรอง profile ที่เลือกแทนการกำหนดเลนแยกต่างหาก
`qa-evidence.json` ที่ได้จะมีสรุป scorecard ของ profile พร้อม
จำนวน selected-category และ coverage IDs ที่ขาดหาย; รายการหลักฐาน
แต่ละรายการยังคงเป็น source of truth สำหรับ tests, coverage roles และ results
Taxonomy feature coverage IDs เป็นเป้าหมาย proof ที่ตรงตัว ไม่ใช่ alias Primary
scenario coverage เติมเต็ม ID ที่ตรงกัน; secondary coverage ยังคงเป็นคำแนะนำ
Coverage IDs ใช้รูปแบบจุด `namespace.behavior` โดยมี segment ตัวพิมพ์เล็ก
แบบ alphanumeric/dash; profile, surface และ category IDs ยังอาจใช้
taxonomy IDs แบบ dash หรือ dotted ที่มีอยู่ได้
Slim evidence ละเว้น `execution` รายรายการและตั้ง `evidenceMode: "slim"`;
`smoke-ci` ใช้ slim เป็นค่าเริ่มต้น และ `--evidence-mode full` คืนค่า entries แบบเต็ม:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

ใช้ `smoke-ci` สำหรับ proof ของ profile ที่ deterministic พร้อม mock model providers และ
Crabline local provider servers ใช้ `release` สำหรับ proof ของ Stable/LTS กับ live
channels ใช้ `all` เฉพาะสำหรับการรันหลักฐาน full-taxonomy อย่างชัดเจน; โดยจะเลือก
ทุก active maturity category และสามารถ dispatch ผ่าน workflow `QA Profile
Evidence` ด้วย `qa_profile=all` เมื่อคำสั่งต้องการ root profile ของ OpenClaw ด้วย
ให้ใส่ root profile ก่อนคำสั่ง QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flow ของ operator

Flow ของ QA operator ปัจจุบันเป็น QA site แบบสอง pane:

- ซ้าย: Gateway dashboard (Control UI) พร้อม agent
- ขวา: QA Lab แสดงทรานสคริปต์แบบคล้าย Slack และ scenario plan

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้าง QA site, เริ่มเลน gateway ที่อิง Docker และเปิดเผยหน้า
QA Lab ซึ่ง operator หรือ automation loop สามารถมอบ QA
mission ให้ agent, สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน,
ล้มเหลว หรือยังถูกบล็อกอยู่

สำหรับการ iterate QA Lab UI ภายในเครื่องให้เร็วขึ้นโดยไม่ต้องสร้าง Docker image ใหม่ทุกครั้ง
ให้เริ่มสแต็กด้วย QA Lab bundle ที่ bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บน image ที่ prebuilt แล้วและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปใน container `qa-lab` `qa:lab:watch`
สร้าง bundle นั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์ reload อัตโนมัติเมื่อ hash ของ asset QA Lab
เปลี่ยนไป

สำหรับ smoke ของสัญญาณ OpenTelemetry ภายในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

script นี้เริ่ม OTLP/HTTP receiver ภายในเครื่อง, รัน QA
scenario `otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel` แล้ว assert ว่า traces,
metrics และ logs ถูก export มัน decode exported protobuf trace spans
และตรวจ shape ที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, span model-call ตาม GenAI semantic-convention ล่าสุด,
`openclaw.context.assembled` และ `openclaw.message.delivery` อยู่ smoke บังคับ
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ดังนั้น span model-call
ต้องใช้ชื่อ `{gen_ai.operation.name} {gen_ai.request.model}`;
model calls ต้องไม่ export `StreamAbandoned` ใน turn ที่สำเร็จ; raw diagnostic IDs และ
attributes `openclaw.content.*` ต้องไม่อยู่ใน trace raw OTLP
payloads ต้องไม่มี prompt sentinel, response sentinel หรือ QA session
key คำสั่งนี้เขียน `otel-smoke-summary.json` ไว้ข้าง artifacts ของ QA suite

สำหรับ smoke ของ OpenTelemetry ที่อิง collector ให้รัน:

```bash
pnpm qa:otel:collector-smoke
```

เลนนี้วาง Docker container ของ OpenTelemetry Collector จริงไว้ด้านหน้า
receiver ภายในเครื่องตัวเดียวกัน ใช้เมื่อเปลี่ยน endpoint wiring, ความเข้ากันได้ของ collector
หรือพฤติกรรม OTLP export ที่ in-process receiver อาจปิดบังได้

สำหรับ protected Prometheus scrape smoke ให้รัน:

```bash
pnpm qa:prometheus:smoke
```

นามแฝงนั้นเรียกใช้สถานการณ์ QA `docker-prometheus-smoke` โดยเปิดใช้
`diagnostics-prometheus` ตรวจสอบว่าการ scrape ที่ไม่ได้ยืนยันตัวตนถูกปฏิเสธ
จากนั้นตรวจว่า scrape ที่ยืนยันตัวตนแล้วมีตระกูลเมตริกที่สำคัญต่อการปล่อยเวอร์ชัน
โดยไม่มีเนื้อหา prompt, เนื้อหา response, ตัวระบุการวินิจฉัยดิบ, โทเค็น auth
หรือพาธภายในเครื่อง

หากต้องการรัน smoke สำหรับการสังเกตการณ์ทั้งสองแบบต่อเนื่องกัน ให้ใช้:

```bash
pnpm qa:observability:smoke
```

สำหรับเลน OpenTelemetry ที่มี collector รองรับ ร่วมกับ smoke ของ Prometheus scrape
ที่ได้รับการป้องกัน ให้ใช้:

```bash
pnpm qa:observability:collector-smoke
```

QA ด้านการสังเกตการณ์ยังคงใช้ได้เฉพาะ source checkout เท่านั้น npm tarball
ตั้งใจละเว้น QA Lab ดังนั้นเลนปล่อยเวอร์ชัน Docker แบบแพ็กเกจจะไม่รันคำสั่ง `qa`
ให้ใช้ `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` หรือ
`pnpm qa:observability:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยน
เครื่องมือวินิจฉัย

สำหรับเลน smoke ของ Matrix ที่ใช้ transport จริงและไม่ต้องใช้ข้อมูลรับรอง
model-provider ให้รันโปรไฟล์ fast ด้วย mock OpenAI provider แบบกำหนดผลแน่นอน:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

สำหรับเลน live-frontier provider ให้ระบุข้อมูลรับรองที่เข้ากันได้กับ OpenAI
อย่างชัดเจน:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

ข้อมูลอ้างอิง CLI ฉบับเต็ม แคตตาล็อกโปรไฟล์/สถานการณ์ env vars และผัง artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: ระบบจะจัดเตรียม Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว รัน Matrix plugin จริงภายใน Gateway QA ลูกที่จำกัดขอบเขตไว้กับ transport นั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown, สรุป JSON, artifact เหตุการณ์ที่สังเกตได้ และบันทึกเอาต์พุตรวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สถานการณ์เหล่านี้ครอบคลุมพฤติกรรม transport ที่ unit test ไม่สามารถพิสูจน์ได้ครบตั้งแต่ต้นจนจบ: การ gate ด้วย mention, นโยบาย allow-bot, allowlists, การตอบกลับระดับบนสุดและแบบ thread, การ route DM, การจัดการ reaction, การระงับ edit ขาเข้า, การ dedupe replay หลัง restart, การกู้คืนเมื่อ homeserver ถูกรบกวน, การส่ง metadata การอนุมัติ, การจัดการ media และ flow การ bootstrap/recovery/verification ของ Matrix E2EE โปรไฟล์ CLI ของ E2EE ยังขับ `openclaw matrix encryption setup` และคำสั่ง verification ผ่าน homeserver แบบใช้แล้วทิ้งเดียวกันก่อนตรวจการตอบกลับของ Gateway

Discord ยังมีสถานการณ์แบบ opt-in เฉพาะ Mantis สำหรับการทำซ้ำ bug ใช้
`--scenario discord-status-reactions-tool-only` สำหรับไทม์ไลน์ status reaction
แบบชัดเจน หรือ `--scenario discord-thread-reply-filepath-attachment` เพื่อสร้าง
thread จริงของ Discord และตรวจสอบว่า `message.thread-reply` คง attachment
`filePath` ไว้ สถานการณ์เหล่านี้ไม่อยู่ในเลน Discord live ค่าเริ่มต้น
เพราะเป็น probe ทำซ้ำก่อน/หลัง ไม่ใช่ความครอบคลุม smoke แบบกว้าง
เวิร์กโฟลว์ Mantis สำหรับ thread attachment ยังสามารถเพิ่มวิดีโอพยานของ Discord Web
ที่ล็อกอินแล้วได้ เมื่อกำหนดค่า `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` หรือ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ในสภาพแวดล้อม QA
โปรไฟล์ viewer นั้นใช้สำหรับการบันทึกภาพเท่านั้น การตัดสินผ่าน/ไม่ผ่าน
ยังมาจาก oracle ของ Discord REST

CI ใช้พื้นผิวคำสั่งเดียวกันใน `.github/workflows/qa-live-transports-convex.yml`
การรันตามกำหนดเวลาและการรันด้วยตนเองค่าเริ่มต้นจะเรียกใช้โปรไฟล์ Matrix แบบ fast
พร้อมข้อมูลรับรอง live-frontier ที่ QA จัดเตรียมให้, `--fast` และ
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` การรันด้วยตนเองที่กำหนด
`matrix_profile=all` จะแยกออกเป็น shard โปรไฟล์ทั้งห้า

สำหรับเลน smoke ของ Telegram, Discord, Slack และ WhatsApp ที่ใช้ transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

เลนเหล่านี้ชี้ไปยังช่องจริงที่มีอยู่แล้ว พร้อม bot หรือบัญชีสองชุด (driver + SUT) env vars ที่จำเป็น รายการสถานการณ์ artifact เอาต์พุต และ pool ข้อมูลรับรอง Convex มีเอกสารไว้ใน [ข้อมูลอ้างอิง QA สำหรับ Telegram, Discord, Slack และ WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) ด้านล่าง

สำหรับการรัน Slack desktop VM แบบเต็มพร้อม VNC rescue ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นจะเช่าเครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox รันเลน Slack live
ภายใน VM เปิด Slack Web ในเบราว์เซอร์ VNC จับภาพเดสก์ท็อป และคัดลอก
`slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
เมื่อมีการบันทึกวิดีโอ กลับไปยังไดเรกทอรี artifact ของ Mantis lease ของ Crabbox
สำหรับเดสก์ท็อป/เบราว์เซอร์มีเครื่องมือจับภาพและแพ็กเกจ helper สำหรับ
browser/native-build ให้พร้อมล่วงหน้า ดังนั้นสถานการณ์ควรติดตั้ง fallback
เฉพาะบน lease รุ่นเก่าเท่านั้น Mantis รายงานเวลารวมและเวลาต่อ phase ใน
`mantis-slack-desktop-smoke-report.md` เพื่อให้การรันที่ช้าบอกได้ว่าเวลาไปอยู่ที่
การ warmup lease, การรับข้อมูลรับรอง, การตั้งค่าระยะไกล หรือการคัดลอก artifact
ใช้ `--lease-id <cbx_...>` ซ้ำหลังจากล็อกอินเข้า Slack Web ด้วยตนเองผ่าน VNC;
lease ที่ใช้ซ้ำยังทำให้ cache ของ pnpm store ใน Crabbox อุ่นอยู่ด้วย ค่าเริ่มต้น
`--hydrate-mode source` ตรวจสอบจาก source checkout และรัน install/build
ภายใน VM ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace ระยะไกลที่ใช้ซ้ำ
มี `node_modules` และ `dist/` ที่ build แล้วเท่านั้น โหมดนั้นข้ามขั้นตอน
install/build ที่แพง และ fail closed เมื่อ workspace ยังไม่พร้อม
เมื่อใช้ `--gateway-setup` Mantis จะปล่อยให้ OpenClaw Slack Gateway แบบถาวร
รันอยู่ใน VM บนพอร์ต `38973`; หากไม่ใช้ คำสั่งจะรันเลน Slack QA แบบ bot-to-bot
ปกติและออกหลังจับ artifact

เพื่อพิสูจน์ UI อนุมัติแบบ native ของ Slack พร้อมหลักฐานเดสก์ท็อป ให้รันโหมด
approval checkpoint ของ Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

โหมดนี้ใช้ร่วมกับ `--gateway-setup` ไม่ได้ โหมดนี้รันสถานการณ์การอนุมัติของ Slack,
ปฏิเสธ scenario ids ที่ไม่ใช่การอนุมัติ, รอที่สถานะการอนุมัติ pending และ resolved
แต่ละครั้ง, render ข้อความ Slack API ที่สังเกตได้เป็น
`approval-checkpoints/<scenario>-pending.png` และ
`approval-checkpoints/<scenario>-resolved.png` จากนั้นล้มเหลวหาก checkpoint,
หลักฐานข้อความ, acknowledgement หรือ screenshot ที่ render แล้วรายการใดขาดหาย
หรือว่างเปล่า lease CI แบบ cold อาจยังแสดงการลงชื่อเข้า Slack ใน
`slack-desktop-smoke.png`; รูปภาพ approval checkpoint คือหลักฐานภาพสำหรับเลนนี้

operator checklist, คำสั่ง dispatch ของ GitHub workflow, สัญญา evidence-comment,
ตารางตัดสินใจ hydrate-mode, การตีความเวลา และขั้นตอนจัดการความล้มเหลวอยู่ใน
[Mantis Slack Desktop Runbook](/th/concepts/mantis-slack-desktop-runbook)

สำหรับงานเดสก์ท็อปแบบ agent/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` เช่าหรือใช้เครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox ซ้ำ เริ่ม
`crabbox record --while` ขับเบราว์เซอร์ที่มองเห็นได้ผ่าน `visual-driver`
แบบ nested จับ `visual-task.png` รัน `openclaw infer image describe`
กับ screenshot เมื่อเลือก `--vision-mode image-describe` และเขียน
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` prompt สำหรับ vision จะขอ verdict แบบ JSON
มีโครงสร้าง และผ่านเฉพาะเมื่อโมเดลรายงานหลักฐานที่มองเห็นได้ในเชิงบวกเท่านั้น
response เชิงลบที่เพียง quote ข้อความเป้าหมายจะทำให้ assertion ล้มเหลว
ใช้ `--vision-mode metadata` สำหรับ smoke แบบไม่ใช้โมเดลที่พิสูจน์ plumbing
ของเดสก์ท็อป เบราว์เซอร์ screenshot และวิดีโอ โดยไม่เรียก provider ที่เข้าใจรูปภาพ
การบันทึกเป็น artifact ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox ไม่บันทึก
`visual-task.mp4` ที่ไม่ว่างเปล่า งานจะล้มเหลวแม้ visual driver จะผ่านแล้วก็ตาม
เมื่อเกิดความล้มเหลว Mantis จะเก็บ lease ไว้สำหรับ VNC เว้นแต่งานผ่านไปแล้วและ
ไม่ได้กำหนด `--keep-lease`

ก่อนใช้ข้อมูลรับรอง live แบบ pooled ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจ env ของ broker Convex, ตรวจสอบการตั้งค่า endpoint และยืนยันว่าเข้าถึง admin/list ได้เมื่อมี maintainer secret อยู่ โดยรายงานเฉพาะสถานะ set/missing สำหรับ secrets

## ความครอบคลุมของ transport live

เลน transport live ใช้สัญญาเดียวร่วมกัน แทนที่แต่ละเลนจะสร้างรูปแบบรายการสถานการณ์ของตนเอง `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์สังเคราะห์แบบกว้าง และไม่ได้เป็นส่วนหนึ่งของเมทริกซ์ความครอบคลุม transport live

runner ของ transport live ควร import scenario ids ที่ใช้ร่วมกัน, helper
ความครอบคลุม baseline และ helper การเลือกสถานการณ์จาก
`openclaw/plugin-sdk/qa-live-transport-scenarios`

| เลน      | Canary | การ gate ด้วย mention | Bot-to-bot | บล็อก allowlist | การตอบกลับระดับบนสุด | การตอบกลับแบบ quote | กลับมาทำงานต่อหลัง restart | การตามต่อใน thread | การแยก thread | การสังเกต reaction | คำสั่ง help | การลงทะเบียนคำสั่ง native |
| -------- | ------ | ---------------------- | ---------- | ---------------- | ---------------------- | -------------------- | ---------------------------- | ------------------- | ------------- | -------------------- | ---------- | --------------------------- |
| Matrix   | x      | x                      | x          | x                | x                      |                      | x                            | x                   | x             | x                    |            |                             |
| Telegram | x      | x                      | x          |                  |                        |                      |                              |                     |               |                      | x          |                             |
| Discord  | x      | x                      | x          |                  |                        |                      |                              |                     |               |                      |            | x                           |
| Slack    | x      | x                      | x          | x                | x                      |                      | x                            | x                   | x             |                      |            |                             |
| WhatsApp | x      | x                      |            | x                | x                      | x                    | x                            |                     |               | x                    | x          |                             |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และ transport live อื่น ๆ ใช้ checklist สัญญา transport ที่ชัดเจนร่วมกัน

สำหรับเลน Linux VM แบบใช้แล้วทิ้งโดยไม่ดึง Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้ boot guest Multipass ใหม่ ติดตั้ง dependencies, build OpenClaw
ภายใน guest, รัน `qa suite` จากนั้นคัดลอกรายงาน QA และสรุปปกติกลับเข้า
`.artifacts/qa-e2e/...` บน host
คำสั่งนี้ใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บน host
การรัน suite บน host และ Multipass จะดำเนินการหลายสถานการณ์ที่เลือกแบบ parallel
ด้วย Gateway workers ที่แยกจากกันเป็นค่าเริ่มต้น `qa-channel` มี concurrency
ค่าเริ่มต้นเป็น 4 โดยถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>`
เพื่อปรับจำนวน worker หรือ `--concurrency 1` สำหรับการทำงานแบบ serial
ใช้ `--pack personal-agent` เพื่อรันแพ็ก benchmark ผู้ช่วยส่วนตัว ตัวเลือก pack
เป็นแบบ additive ร่วมกับ flag `--scenario` ที่ซ้ำได้: สถานการณ์ที่ระบุชัดเจน
จะรันก่อน จากนั้นสถานการณ์ใน pack จะรันตามลำดับ pack โดยตัดรายการซ้ำออก
ใช้ `--pack observability` เมื่อ runner QA แบบกำหนดเองจัดเตรียมการตั้งค่า
OpenTelemetry collector อยู่แล้ว และต้องการเลือกสถานการณ์ smoke ด้านการวินิจฉัย
OpenTelemetry และ Prometheus พร้อมกัน
คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures`
เมื่อคุณต้องการ artifact โดยไม่มี exit code ที่ล้มเหลว
การรัน live จะส่งต่ออินพุต auth ของ QA ที่รองรับและใช้งานได้จริงสำหรับ guest:
provider keys จาก env, พาธ config ของ QA live provider และ `CODEX_HOME`
เมื่อมีอยู่ ให้เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้ guest เขียนกลับ
ผ่าน workspace ที่ mount ไว้ได้

## เอกสารอ้างอิง QA สำหรับ Telegram, Discord, Slack และ WhatsApp

Matrix มี[หน้าเฉพาะ](/th/concepts/qa-matrix) เนื่องจากมีจำนวนสถานการณ์มากและมีการจัดเตรียม homeserver ที่รองรับด้วย Docker ส่วน Telegram, Discord, Slack และ WhatsApp ทำงานกับ transport จริงที่มีอยู่ก่อนแล้ว ดังนั้นเอกสารอ้างอิงของรายการเหล่านี้จึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                            | คำอธิบาย                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | ตำแหน่งที่เขียนรายงาน สรุป หลักฐาน อาร์ติแฟกต์เฉพาะ transport และบันทึกเอาต์พุต พาธสัมพัทธ์จะอ้างอิงจาก `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                    | รูทของรีโพซิทอรีเมื่อเรียกจาก cwd ที่เป็นกลาง                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | รหัสบัญชีชั่วคราวภายในคอนฟิก Gateway ของ QA                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` หรือ `live-frontier` (`live-openai` แบบเดิมยังใช้งานได้)                                                                            |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                   | การอ้างอิงโมเดลหลัก/สำรอง                                                                                                                   |
| `--fast`                              | ปิด                                                | โหมดเร็วของ provider เมื่อรองรับ                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | ดู [พูลข้อมูลประจำตัว Convex](#convex-credential-pool)                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                 | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                                                    |

แต่ละเลนจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้งค่า exit code ที่ล้มเหลว

### QA สำหรับ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายเป็นกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มที่มีบอตสองตัวแยกกัน (driver + SUT) บอต SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอตถึงบอตทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - รหัสแชตแบบตัวเลข (สตริง)
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

ชุดค่าเริ่มต้นโดยนัยจะครอบคลุม canary, mention gating, การตอบคำสั่งเนทีฟ, การระบุที่อยู่ของคำสั่ง และการตอบกลับในกลุ่มแบบบอตถึงบอตเสมอ ค่าเริ่มต้นของ `mock-openai` ยังรวมการตรวจสอบ reply-chain แบบกำหนดแน่นอนและการสตรีม final-message ด้วย `telegram-current-session-status-tool` ยังคงเป็นแบบเลือกใช้ เพราะมีความเสถียรเฉพาะเมื่อรันต่อจาก canary โดยตรง ไม่ใช่หลังการตอบคำสั่งเนทีฟใดๆ ใช้ `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` เพื่อพิมพ์การแบ่งค่าเริ่มต้น/ตัวเลือกปัจจุบันพร้อม regression refs

อาร์ติแฟกต์เอาต์พุต:

- `telegram-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบ transport สด รวมถึงฟิลด์ profile, coverage, provider, channel, artifacts, result และ RTT

การรัน Telegram แบบแพ็กเกจใช้สัญญาข้อมูลประจำตัว Telegram เดียวกัน การวัด RTT ซ้ำเป็นส่วนหนึ่งของเลน Telegram สดแบบแพ็กเกจตามปกติ การกระจาย RTT จะถูกรวมเข้าใน `qa-evidence.json` ภายใต้ `result.timing` สำหรับการตรวจสอบ RTT ที่เลือก

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

เมื่อมีการตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` wrapper สดของแพ็กเกจจะเช่าข้อมูลประจำตัว `kind: "telegram"` ส่งออก env ของกลุ่ม/driver/บอต SUT ที่เช่าเข้าไปในการรันแพ็กเกจที่ติดตั้งแล้ว ส่ง Heartbeat ให้ lease และปล่อย lease เมื่อปิดการทำงาน wrapper ของแพ็กเกจมีค่าเริ่มต้นเป็นการตรวจสอบ RTT 20 ครั้งของ `telegram-mentioned-message-reply`, timeout RTT 30 วินาที และบทบาท Convex `maintainer` นอก CI เมื่อเลือก Convex override `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับการวัด RTT โดยไม่ต้องสร้างคำสั่ง RTT แยกหรือรูปแบบสรุปเฉพาะ Telegram

### QA สำหรับ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายเป็นช่อง guild ส่วนตัวจริงของ Discord หนึ่งช่องที่มีบอตสองตัว: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Discord ที่รวมมาให้ ตรวจสอบการจัดการ mention ในช่อง, ว่าบอต SUT ได้ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบเลือกใช้

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - ต้องตรงกับรหัสผู้ใช้บอต SUT ที่ Discord ส่งกลับมา (มิฉะนั้นเลนจะล้มเหลวทันที)

ตัวเลือก:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` เลือกช่องเสียง/เวทีสำหรับ `discord-voice-autojoin`; หากไม่มี สถานการณ์จะเลือกช่องเสียง/เวทีแรกที่บอต SUT มองเห็นได้

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - สถานการณ์เสียงแบบเลือกใช้ รันแยกเดี่ยว เปิดใช้ `channels.discord.voice.autoJoin` และตรวจสอบว่าสถานะเสียง Discord ปัจจุบันของบอต SUT เป็นช่องเสียง/เวทีเป้าหมาย ข้อมูลประจำตัว Discord ของ Convex อาจรวม `voiceChannelId` แบบไม่บังคับ; มิฉะนั้น runner จะค้นพบช่องเสียง/เวทีแรกที่มองเห็นได้ใน guild
- `discord-status-reactions-tool-only` - สถานการณ์ Mantis แบบเลือกใช้ รันแยกเดี่ยวเพราะจะสลับ SUT เป็นการตอบกลับ guild แบบเปิดตลอดเวลาและ tool-only ด้วย `messages.statusReactions.enabled=true` จากนั้นจับไทม์ไลน์ reaction ผ่าน REST พร้อมอาร์ติแฟกต์ภาพ HTML/PNG รายงานก่อน/หลังของ Mantis ยังเก็บอาร์ติแฟกต์ MP4 ที่สถานการณ์ให้มาเป็น `baseline.mp4` และ `candidate.mp4`

รันสถานการณ์ voice auto-join ของ Discord อย่างชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

รันสถานการณ์ status-reaction ของ Mantis อย่างชัดเจน:

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
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบ transport สด
- `discord-qa-observed-messages.json` - เนื้อหาถูก redact เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์ status-reaction ทำงาน

### QA สำหรับ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายเป็นช่อง Slack ส่วนตัวจริงหนึ่งช่องที่มีบอตสองตัวแยกกัน: บอต driver ที่ควบคุมโดย harness และบอต SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน Plugin Slack ที่รวมมาให้

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

ตัวเลือก:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` เปิดใช้ checkpoint การอนุมัติแบบภาพสำหรับ Mantis runner จะเขียน `<scenario>.pending.json` และ `<scenario>.resolved.json` จากนั้นรอไฟล์ `.ack.json` ที่ตรงกัน
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` override timeout การรับทราบ checkpoint ค่าเริ่มต้นคือ `120000`

สถานการณ์ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - สถานการณ์อนุมัติ exec เนทีฟของ Slack แบบเลือกใช้ ขอการอนุมัติ exec ผ่าน Gateway, ตรวจสอบว่าข้อความ Slack มีปุ่มอนุมัติเนทีฟ, resolve รายการนั้น และตรวจสอบอัปเดต Slack ที่ resolve แล้ว
- `slack-approval-plugin-native` - สถานการณ์อนุมัติ Plugin เนทีฟของ Slack แบบเลือกใช้ เปิดใช้การส่งต่อการอนุมัติ exec และ Plugin พร้อมกันเพื่อไม่ให้เหตุการณ์ Plugin ถูกระงับโดยการกำหนดเส้นทางการอนุมัติ exec จากนั้นตรวจสอบพาธ UI เนทีฟของ Slack แบบ pending/resolved เดียวกัน

อาร์ติแฟกต์เอาต์พุต:

- `slack-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบ transport สด
- `slack-qa-observed-messages.json` - เนื้อหาถูก redact เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`
- `approval-checkpoints/` - เฉพาะเมื่อ Mantis ตั้งค่า `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; ประกอบด้วย JSON ของ checkpoint, JSON การรับทราบ และภาพหน้าจอ pending/resolved

#### การตั้งค่า workspace ของ Slack

เลนนี้ต้องใช้แอป Slack สองแอปแยกกันใน workspace เดียว พร้อมช่องที่บอตทั้งสองเป็นสมาชิก:

- `channelId` - รหัส `Cxxxxxxxxxx` ของช่องที่บอตทั้งสองได้รับเชิญแล้ว ใช้ช่องเฉพาะ; เลนจะโพสต์ในการรันทุกครั้ง
- `driverBotToken` - โทเคนบอต (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` - โทเคนบอต (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกจาก driver เพื่อให้รหัสผู้ใช้บอตของมันแตกต่างกัน
- `sutAppToken` - โทเคนระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ซึ่ง Socket Mode ใช้เพื่อให้แอป SUT รับเหตุการณ์ได้

ควรใช้ workspace Slack ที่จัดไว้สำหรับ QA โดยเฉพาะ แทนการนำ workspace production มาใช้ซ้ำ

manifest ของ SUT ด้านล่างนี้ตั้งใจจำกัดการติดตั้ง production ของ Plugin Slack ที่รวมมาให้ (`extensions/slack/src/setup-shared.ts:10`) ให้เหลือเฉพาะสิทธิ์และเหตุการณ์ที่ครอบคลุมโดยชุดทดสอบ QA สดของ Slack สำหรับการตั้งค่าช่อง production ตามที่ผู้ใช้เห็น โปรดดู [การตั้งค่าด่วนของช่อง Slack](/th/channels/slack#quick-setup); คู่ QA Driver/SUT ตั้งใจแยกต่างหากเพราะเลนต้องใช้รหัสผู้ใช้บอตสองรหัสที่แตกต่างกันใน workspace เดียว

**1. สร้างแอป Driver**

ไปที่ [api.slack.com/apps](https://api.slack.com/apps) → _สร้างแอปใหม่_ → _จาก manifest_ → เลือกเวิร์กสเปซ QA, วาง manifest ต่อไปนี้ แล้วเลือก _ติดตั้งลงในเวิร์กสเปซ_:

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) - ค่านี้จะเป็น `driverBotToken` ไดรเวอร์ต้องการเพียงการโพสต์ข้อความและระบุตัวเองเท่านั้น ไม่ต้องใช้อีเวนต์หรือ Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _สร้างแอปใหม่ → จาก manifest_ ในเวิร์กสเปซเดียวกัน แอป QA นี้ตั้งใจใช้ manifest สำหรับโปรดักชันของ Slack plugin ที่บันเดิลมาในเวอร์ชันที่แคบกว่า (`extensions/slack/src/setup-shared.ts:10`): ตัด scope และอีเวนต์สำหรับ reaction ออก เพราะชุดทดสอบ Slack QA แบบ live ยังไม่ครอบคลุมการจัดการ reaction

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

- _ติดตั้งลงในเวิร์กสเปซ_ → คัดลอก _Bot User OAuth Token_ → ค่านี้จะเป็น `sutBotToken`
- _ข้อมูลพื้นฐาน → โทเค็นระดับแอป → สร้างโทเค็นและ scope_ → เพิ่ม scope `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านี้จะเป็น `sutAppToken`

ตรวจสอบว่าบอตทั้งสองมี id ผู้ใช้ต่างกันโดยเรียก `auth.test` กับแต่ละโทเค็น runtime แยก driver และ SUT ด้วย id ผู้ใช้ การใช้แอปเดียวกันซ้ำสำหรับทั้งสองฝั่งจะทำให้ mention-gating ล้มเหลวทันที

**3. สร้าง channel**

ในเวิร์กสเปซ QA ให้สร้าง channel (เช่น `#openclaw-qa`) แล้วเชิญบอตทั้งสองจากภายใน channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอก id `Cxxxxxxxxxx` จาก _ข้อมูล channel → เกี่ยวกับ → Channel ID_ - ค่านี้จะเป็น `channelId` channel สาธารณะใช้งานได้ หากคุณใช้ channel ส่วนตัว แอปทั้งสองมี `groups:history` อยู่แล้ว ดังนั้นการอ่าน history ของ harness จะยังสำเร็จ

**4. ลงทะเบียน credential**

มีสองตัวเลือก ใช้ env vars สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือ seed พูล Convex ที่แชร์ไว้เพื่อให้ CI และ maintainer คนอื่นเช่าใช้ได้

สำหรับพูล Convex ให้เขียนฟิลด์ทั้งสี่ลงในไฟล์ JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

เมื่อ export `OPENCLAW_QA_CONVEX_SITE_URL` และ `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ใน shell ของคุณแล้ว ให้ลงทะเบียนและตรวจสอบ:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

คาดว่าจะได้ `count: 1`, `status: "active"` และไม่มีฟิลด์ `lease`

**5. ตรวจสอบ end to end**

รัน lane ในเครื่องเพื่อยืนยันว่าบอตทั้งสองคุยกันผ่าน broker ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านจะเสร็จในเวลาน้อยกว่า 30 วินาทีมาก และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` เป็นสถานะ `pass` หาก lane ค้างประมาณ 90 วินาทีแล้วออกด้วย `Convex credential pool exhausted for kind "slack"` แปลว่าพูลว่างหรือทุกแถวถูกเช่าอยู่ - `qa credentials list --kind slack --status all --json` จะบอกได้ว่าเป็นกรณีใด

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

กำหนดเป้าหมายไปที่บัญชี WhatsApp Web เฉพาะสองบัญชี: บัญชี driver ที่ควบคุมโดย
harness และบัญชี SUT ที่เริ่มโดย child OpenClaw gateway ผ่าน
WhatsApp plugin ที่บันเดิลมา

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

ไม่บังคับ:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` เปิดใช้ scenario แบบกลุ่ม เช่น
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenario action/media/poll แบบกลุ่ม และ
  `whatsapp-group-allowlist-block`
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน
  artifact ของ observed-message

แคตตาล็อก scenario (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline และ group gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`
- คำสั่ง native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`
- พฤติกรรมการตอบกลับและ final-output: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`
- action ข้อความตามเส้นทางผู้ใช้: `whatsapp-agent-message-action-react` เริ่มจาก
  DM จริงของ driver ให้โมเดลเรียกใช้เครื่องมือ `message` และสังเกต
  reaction native ของ WhatsApp `whatsapp-agent-message-action-upload-file` ใช้
  posture เดียวกันสำหรับ `message(action=upload-file)` และสังเกต media native
  ของ WhatsApp `whatsapp-group-agent-message-action-react` และ
  `whatsapp-group-agent-message-action-upload-file` พิสูจน์ action ที่ผู้ใช้มองเห็นแบบเดียวกัน
  ในกลุ่ม WhatsApp จริง
- Group fanout: `whatsapp-broadcast-group-fanout` เริ่มจากข้อความกลุ่ม WhatsApp
  หนึ่งข้อความที่มีการ mention และตรวจสอบการตอบกลับที่มองเห็นได้ต่างกันจาก `main` และ
  `qa-second`
- Group activation: `whatsapp-group-activation-always` เปลี่ยน session กลุ่มจริง
  เป็น `/activation always` พิสูจน์ว่าข้อความกลุ่มที่ไม่มี mention ปลุก
  agent ได้ แล้วกู้คืนเป็น `/activation mention` `whatsapp-group-reply-to-bot-triggers`
  seed การตอบกลับของบอต ส่ง native quoted reply ไปยังข้อความนั้นโดยไม่มี
  mention ชัดเจน และตรวจสอบว่า agent ถูกปลุกจาก context ของการตอบกลับนั้น
- สื่อขาเข้าและข้อความแบบมีโครงสร้าง: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`
  รายการเหล่านี้ส่งอีเวนต์รูปภาพ เสียง เอกสาร ตำแหน่งที่ตั้ง รายชื่อผู้ติดต่อ สติกเกอร์
  และ reaction ของ WhatsApp จริงผ่าน driver
- โพรบสัญญา Gateway โดยตรง:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape` รายการเหล่านี้ตั้งใจข้ามการ prompt โมเดลและ
  พิสูจน์สัญญา `send`, `poll` และ `message.action` ของ Gateway/channel
  แบบกำหนดแน่นอน
- การครอบคลุม access-control: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`
- การอนุมัติ native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`
- Status reactions: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`

ปัจจุบันแคตตาล็อกมี 50 scenario lane ค่าเริ่มต้น `live-frontier` ถูก
คงให้เล็กที่ 10 scenario เพื่อการครอบคลุม smoke ที่รวดเร็ว lane ค่าเริ่มต้น
`mock-openai` รัน scenario แบบกำหนดแน่นอน 44 รายการผ่าน transport WhatsApp จริง โดย
mock เฉพาะ output ของโมเดล scenario การอนุมัติและการตรวจสอบที่หนักกว่าหรืออาจบล็อกบางรายการ
ยังคงต้องระบุด้วย scenario id โดยตรง

ไดรเวอร์ WhatsApp QA สังเกตอีเวนต์ live แบบมีโครงสร้าง (`text`, `media`,
`location`, `reaction` และ `poll`) และสามารถส่ง media, poll,
รายชื่อผู้ติดต่อ ตำแหน่งที่ตั้ง และสติกเกอร์ได้อย่าง active QA Lab นำเข้า driver นั้นผ่าน
package surface `@openclaw/whatsapp/api.js` แทนการเข้าถึงไฟล์ runtime
WhatsApp ส่วนตัว สำหรับการสังเกตกลุ่ม `fromJid` คือ JID ของกลุ่ม ส่วน
`participantJid` และ `fromPhoneE164` ระบุผู้ส่งที่เป็นสมาชิก เนื้อหา
ข้อความถูก redact เป็นค่าเริ่มต้น โพรบ Gateway โดยตรงสำหรับ
poll, upload-file, media, group poll, group media และ reply-shape เป็นการตรวจสอบสัญญา transport/API
ไม่ถือเป็นหลักฐานว่า user prompt ทำให้ agent เลือก
action เดียวกัน หลักฐาน action ตามเส้นทางผู้ใช้มาจาก scenario เช่น
`whatsapp-agent-message-action-react` และ
`whatsapp-group-agent-message-action-react` ซึ่ง driver ส่งข้อความ
WhatsApp ปกติ และ QA Lab สังเกต artifact native ของ WhatsApp ที่เกิดขึ้น
รายงาน WhatsApp รวม posture ของแต่ละ scenario (`user-path`, `direct-gateway`,
หรือ `native-approval`) เพื่อไม่ให้เข้าใจหลักฐานผิดว่าเป็นสัญญาที่แข็งแรงกว่า
สิ่งที่พิสูจน์จริง

Output artifacts:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบ transport แบบ live
- `whatsapp-qa-observed-messages.json` - เนื้อหาถูก redact เว้นแต่ตั้งค่า `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`

### พูล credential ของ Convex

lane ของ Telegram, Discord, Slack และ WhatsApp สามารถเช่า credential จากพูล Convex ที่แชร์ไว้แทนการอ่าน env vars ด้านบน ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอ lease แบบ exclusive ส่ง Heartbeat ตลอดระยะเวลาการรัน และปล่อย lease เมื่อปิดระบบ ชนิดของพูลคือ `"telegram"`, `"discord"`, `"slack"` และ `"whatsapp"`

รูปทรง payload ที่ broker ตรวจสอบใน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- ผู้ใช้จริงของ Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - สำหรับหลักฐาน Mantis Telegram Desktop เท่านั้น เลน QA Lab ทั่วไปต้องไม่รับชนิดนี้
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - หมายเลขโทรศัพท์ต้องเป็นสตริง E.164 ที่แตกต่างกัน

เวิร์กโฟลว์หลักฐาน Mantis Telegram Desktop ถือ lease Convex
`telegram-user` แบบเอกสิทธิ์หนึ่งรายการสำหรับทั้งไดรเวอร์ TDLib CLI และพยาน
Telegram Desktop จากนั้นปล่อย lease หลังเผยแพร่หลักฐาน

เมื่อ PR ต้องการ visual diff ที่กำหนดซ้ำได้ Mantis สามารถใช้การตอบกลับ mock model
เดียวกันบน `main` และบน PR head ขณะที่ตัวจัดรูปแบบ Telegram หรือเลเยอร์การส่งมอบ
เปลี่ยนแปลง ค่าเริ่มต้นการจับภาพถูกปรับไว้สำหรับความคิดเห็น PR: คลาส Crabbox
มาตรฐาน, การบันทึกเดสก์ท็อป 24fps, GIF การเคลื่อนไหว 24fps และความกว้างพรีวิว 1920px
ความคิดเห็นก่อน/หลังควรเผยแพร่บันเดิลสะอาดที่มีเฉพาะ GIF ที่ตั้งใจไว้เท่านั้น

เลน Slack สามารถใช้พูลได้เช่นกัน การตรวจสอบรูปร่าง payload ของ Slack ปัจจุบันอยู่ในตัวรัน Slack QA แทนที่จะอยู่ใน broker; ใช้ `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` พร้อม id ช่อง Slack เช่น `Cxxxxxxxxxx` ดู [การตั้งค่าเวิร์กสเปซ Slack](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและ scope

env vars เชิงปฏิบัติการและสัญญา endpoint ของ Convex broker อยู่ใน [การทดสอบ → ข้อมูลรับรอง Telegram ที่ใช้ร่วมกันผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้เกิดก่อนพูลหลายช่องทาง; semantics ของ lease ใช้ร่วมกันข้ามชนิด)

## seed ที่อิงกับ repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

รายการเหล่านี้ตั้งใจให้อยู่ใน git เพื่อให้ทั้งมนุษย์และ agent
มองเห็นแผน QA

`qa-lab` ควรคงเป็นตัวรัน scenario YAML ทั่วไป ไฟล์ YAML ของแต่ละ scenario
เป็นแหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- `title` ระดับบนสุด
- metadata ของ `scenario`
- metadata หมวดหมู่, capability, lane และความเสี่ยงแบบไม่บังคับใน `scenario`
- refs ของเอกสารและโค้ดใน `scenario`
- ข้อกำหนด Plugin แบบไม่บังคับใน `scenario`
- แพตช์ config Gateway แบบไม่บังคับใน `scenario`
- `flow` ระดับบนสุดที่เรียกใช้งานได้สำหรับ flow scenarios หรือ `scenario.execution.kind` /
  `scenario.execution.path` สำหรับ scenario Vitest และ Playwright

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `flow` อนุญาตให้คงความทั่วไป
และตัดข้ามหลายส่วนได้ ตัวอย่างเช่น scenario YAML สามารถรวม helper ฝั่ง transport
กับ helper ฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน seam
Gateway `browser.request` โดยไม่ต้องเพิ่มตัวรันเฉพาะกรณี

ไฟล์ scenario ควรถูกจัดกลุ่มตาม capability ของผลิตภัณฑ์แทนโฟลเดอร์
source tree รักษา ID ของ scenario ให้เสถียรเมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการตรวจสอบย้อนกลับการนำไปใช้

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และช่อง
- พฤติกรรม thread
- lifecycle ของ message action
- callback ของ cron
- การเรียกคืน memory
- การสลับ model
- การส่งต่อให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของ provider

`qa suite` มีเลน mock provider ในเครื่องสองเลน:

- `mock-openai` คือ mock OpenClaw ที่รับรู้ scenario และยังคงเป็นเลน mock
  แบบกำหนดซ้ำได้เริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gates
- `aimock` เริ่มเซิร์ฟเวอร์ provider ที่รองรับ AIMock สำหรับความครอบคลุมเชิงทดลองด้าน protocol,
  fixture, record/replay และ chaos โดยเป็นส่วนเสริมและไม่แทนที่
  dispatcher scenario ของ `mock-openai`

การนำเลน provider ไปใช้อยู่ใต้ `extensions/qa-lab/src/providers/`
provider แต่ละตัวเป็นเจ้าของค่าเริ่มต้นของตนเอง, การเริ่มเซิร์ฟเวอร์ในเครื่อง, config model ของ gateway,
ความต้องการ staging ของ auth-profile และแฟล็ก capability แบบ live/mock โค้ด suite และ
gateway ที่ใช้ร่วมกันควร route ผ่าน provider registry แทนการ branch ตาม
ชื่อ provider

## อะแดปเตอร์ transport

`qa-lab` เป็นเจ้าของ seam transport ทั่วไปสำหรับ scenario QA แบบ YAML `qa-channel` คือ
ค่าเริ่มต้นสังเคราะห์ `crabline` เริ่มเซิร์ฟเวอร์ในเครื่องที่มีรูปร่างเหมือน provider และรัน
Plugin ช่องปกติของ OpenClaw กับเซิร์ฟเวอร์เหล่านั้น `live` สงวนไว้สำหรับ
ข้อมูลรับรอง provider จริงและช่องภายนอก

ในระดับสถาปัตยกรรม การแบ่งคือ:

- `qa-lab` เป็นเจ้าของการดำเนินการ scenario ทั่วไป, concurrency ของ worker, การเขียน artifact และการรายงาน
- อะแดปเตอร์ transport เป็นเจ้าของ config ของ gateway, readiness, การสังเกต inbound และ outbound, transport actions และสถานะ transport ที่ normalize แล้ว
- ไฟล์ scenario YAML ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งดำเนินการไฟล์เหล่านั้น

### การเพิ่มช่อง

การเพิ่มช่องลงในระบบ QA แบบ YAML ต้องมีการนำช่องไปใช้พร้อม
scenario pack ที่ทดสอบสัญญาของช่องนั้น สำหรับความครอบคลุม smoke CI ให้เพิ่ม
เซิร์ฟเวอร์ provider ในเครื่องของ Crabline ที่ตรงกันและเปิดเผยผ่าน driver `crabline`

อย่าเพิ่ม root คำสั่ง QA ระดับบนสุดใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มต้นและ teardown ของ suite
- concurrency ของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินการ scenario
- alias ความเข้ากันได้สำหรับ scenario `qa-channel` รุ่นเก่า

Plugin ตัวรันเป็นเจ้าของสัญญา transport:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า gateway สำหรับ transport นั้น
- วิธีตรวจ readiness
- วิธี inject เหตุการณ์ inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และสถานะ transport ที่ normalize แล้ว
- วิธีดำเนินการ action ที่อิงกับ transport
- วิธีจัดการ reset หรือ cleanup เฉพาะ transport

เกณฑ์ขั้นต่ำในการรับช่องใหม่:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. นำ transport runner ไปใช้บน seam host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะ transport ไว้ภายใน runner plugin หรือ channel harness
4. Mount runner เป็น `openclaw qa <runner>` แทนการลงทะเบียน root command ที่แข่งกัน Runner plugins ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ให้ `runtime-api.ts` เบาไว้; CLI แบบ lazy และการดำเนินการ runner ควรอยู่หลัง entrypoints แยกต่างหาก
5. เขียนหรือปรับ scenario YAML ใต้ไดเรกทอรี `qa/scenarios/` ตาม theme
6. ใช้ helper scenario ทั่วไปสำหรับ scenario ใหม่
7. รักษา alias ความเข้ากันได้ที่มีอยู่ให้ทำงานต่อไป เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินใจเข้มงวด:

- หากพฤติกรรมสามารถแสดงครั้งเดียวใน `qa-lab` ได้ ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับ transport ของช่องเดียว ให้เก็บไว้ใน runner plugin หรือ plugin harness นั้น
- หาก scenario ต้องการ capability ใหม่ที่มากกว่าหนึ่งช่องสามารถใช้ได้ ให้เพิ่ม helper ทั่วไปแทน branch เฉพาะช่องใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับ transport เดียว ให้ scenario เป็นแบบเฉพาะ transport และระบุให้ชัดเจนในสัญญา scenario

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

alias ความเข้ากันได้ยังคงพร้อมใช้งานสำหรับ scenario ที่มีอยู่ - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - แต่การเขียน scenario ใหม่ควรใช้ชื่อทั่วไป alias มีอยู่เพื่อหลีกเลี่ยงการ migration แบบ flag-day ไม่ใช่ในฐานะโมเดลในอนาคต

## การรายงาน

`qa-lab` export รายงาน protocol แบบ Markdown จาก timeline ของ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อก
- scenario ติดตามผลใดควรค่าแก่การเพิ่ม

สำหรับ inventory ของ scenario ที่มีอยู่ - มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือเชื่อม transport ใหม่ - ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)
เมื่อเลือกหลักฐานแบบโฟกัสสำหรับพฤติกรรมหรือ path ไฟล์ที่ถูกแตะ ให้รัน `pnpm openclaw qa coverage --match <query>`
รายงาน match ค้นหา metadata ของ scenario, refs ของเอกสาร, refs ของโค้ด, coverage IDs, plugins และข้อกำหนด provider จากนั้นพิมพ์ target `qa suite --scenario ...` ที่ตรงกัน
การรัน `qa suite` ทุกครั้งจะเขียน artifact ระดับบนสุด `qa-evidence.json`,
`qa-suite-summary.json` และ `qa-suite-report.md` สำหรับชุด scenario
ที่เลือก scenario ที่ประกาศ `execution.kind: vitest` หรือ
`execution.kind: playwright` จะรัน path ทดสอบที่ตรงกันและเขียน
log ราย scenario ด้วย scenario ที่ประกาศ `execution.kind: script` จะรัน
ตัวผลิตหลักฐานที่ `execution.path` ผ่าน `node --import tsx` (โดยขยาย
`${outputDir}` และ `${scenarioId}` ใน `execution.args`); ตัวผลิตจะเขียน
`qa-evidence.json` ของตนเอง ซึ่ง entries จะถูก import เข้าเอาต์พุตของ suite
และ path artifact จะถูก resolve โดยสัมพันธ์กับ `qa-evidence.json`
ของตัวผลิตนั้น เมื่อเข้าถึง `qa suite` ผ่าน
`qa run --qa-profile` ไฟล์ `qa-evidence.json` เดียวกันจะรวมสรุป
scorecard ของ profile สำหรับหมวด taxonomy ที่เลือกด้วย
ให้ถือเป็นตัวช่วยค้นพบ ไม่ใช่ตัวแทน gate; scenario ที่เลือกยังต้องมี provider mode, live transport, Multipass, Testbox หรือ release lane ที่เหมาะสมสำหรับพฤติกรรมที่กำลังทดสอบ
สำหรับบริบท scorecard ดู [Maturity scorecard](/th/maturity/scorecard)

สำหรับการตรวจสอบ character และ style ให้รัน scenario เดียวกันข้าม ref ของ live model
หลายรายการและเขียนรายงาน Markdown ที่ผ่านการตัดสิน:

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

คำสั่งนี้เรียกใช้โปรเซสลูกของ QA gateway ภายในเครื่อง ไม่ใช่ Docker สถานการณ์การประเมินคาแรกเตอร์
ควรกำหนด persona ผ่าน `SOUL.md` แล้วจึงเรียกใช้เทิร์นของผู้ใช้ตามปกติ
เช่น แชต ความช่วยเหลือในพื้นที่ทำงาน และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดล candidate
ว่ากำลังถูกประเมินอยู่ คำสั่งจะเก็บ transcript ฉบับเต็มแต่ละรายการไว้
บันทึกสถิติพื้นฐานของการรัน จากนั้นถามโมเดล judge ในโหมดเร็วพร้อมการให้เหตุผลระดับ
`xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ โทน และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ provider: prompt ของ judge ยังคงได้รับ
transcript และสถานะการรันทั้งหมด แต่ refs ของ candidate จะถูกแทนที่ด้วยป้ายกำกับกลาง
เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง refs จริงหลังจากแยกวิเคราะห์แล้ว
การรัน candidate มีค่าเริ่มต้นเป็นการคิดระดับ `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ refs การประเมิน OpenAI รุ่นเก่าที่รองรับ แทนที่ candidate เฉพาะรายการแบบ inline ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงตั้งค่า
fallback ส่วนกลาง และรูปแบบเดิม `--model-thinking <provider/model=level>` ยังคง
เก็บไว้เพื่อความเข้ากันได้
refs ของ candidate OpenAI มีค่าเริ่มต้นเป็นโหมดเร็ว เพื่อให้ใช้การประมวลผลแบบ priority
เมื่อ provider รองรับ เพิ่ม `,fast`, `,no-fast`, หรือ `,fast=false` แบบ inline เมื่อ
candidate หรือ judge รายเดียวต้องการการแทนที่ ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมดเร็วสำหรับโมเดล candidate ทุกตัว ระยะเวลาของ candidate และ judge
จะถูกบันทึกในรายงานสำหรับการวิเคราะห์ benchmark แต่ prompt ของ judge ระบุไว้อย่างชัดเจน
ว่าอย่าจัดอันดับตามความเร็ว
การรันโมเดล candidate และ judge มีค่า concurrency เริ่มต้นที่ 16 ทั้งคู่ ลดค่า
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัดของ provider หรือแรงกดดันต่อ gateway
ภายในเครื่องทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่ได้ส่ง candidate `--model` การประเมินคาแรกเตอร์จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` judge จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-8,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [QA เมทริกซ์](/th/concepts/qa-matrix)
- [ตารางคะแนนวุฒิภาวะ](/th/maturity/scorecard)
- [ชุด benchmark เอเจนต์ส่วนบุคคล](/th/concepts/personal-agent-benchmark-pack)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
