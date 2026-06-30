---
read_when:
    - ทำความเข้าใจว่าสแตก QA เชื่อมโยงกันอย่างไร
    - การขยาย qa-lab, qa-channel หรืออะแดปเตอร์การรับส่ง
    - การเพิ่มสถานการณ์ QA ที่มี repo รองรับ
    - การสร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นรอบแดชบอร์ด Gateway
summary: 'ภาพรวมสแต็ก QA: qa-lab, qa-channel, สถานการณ์ที่อิงจาก repo, เลนการขนส่งแบบ live, อะแดปเตอร์การขนส่ง และการรายงาน.'
title: ภาพรวม QA
x-i18n:
    generated_at: "2026-06-30T14:30:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

สแต็ก QA ส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงและมีลักษณะเหมือนช่องทางมากกว่าการทดสอบหน่วยเดียวจะทำได้

ชิ้นส่วนปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิว DM, ช่องทาง, เธรด,
  รีแอ็กชัน, การแก้ไข และการลบ
- `extensions/qa-lab`: UI ดีบักเกอร์และบัส QA สำหรับสังเกตทรานสคริปต์,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `extensions/qa-matrix`, Plugin รันเนอร์ในอนาคต: อะแดปเตอร์การขนส่งสดที่
  ขับช่องทางจริงภายใน Gateway QA ลูก
- `qa/`: แอสเซ็ตตั้งต้นที่หนุนด้วย repo สำหรับงานเริ่มต้นและสถานการณ์ QA
  พื้นฐาน
- [Mantis](/th/concepts/mantis): การยืนยันสดก่อนและหลังสำหรับบั๊กที่
  ต้องใช้การขนส่งจริง, ภาพหน้าจอเบราว์เซอร์, สถานะ VM และหลักฐาน PR

## พื้นผิวคำสั่ง

ทุกโฟลว์ QA ทำงานภายใต้ `pnpm openclaw qa <subcommand>` หลายคำสั่งมีนามแฝงสคริปต์ `pnpm qa:*`;
รองรับทั้งสองรูปแบบ

| คำสั่ง                                             | วัตถุประสงค์                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | การตรวจสอบตัวเอง QA ที่บันเดิลมาโดยไม่ใช้ `--qa-profile`; รันเนอร์โปรไฟล์วุฒิภาวะที่อิง taxonomy ด้วย `--qa-profile smoke-ci`, `--qa-profile release` หรือ `--qa-profile all`                                                                                                      |
| `qa suite`                                          | รันสถานการณ์ที่หนุนด้วย repo กับเลน Gateway QA นามแฝง: `pnpm openclaw qa suite --runner multipass` สำหรับ Linux VM แบบใช้แล้วทิ้ง                                                                                                                                  |
| `qa coverage`                                       | พิมพ์อินเวนทอรีความครอบคลุมสถานการณ์ YAML (`--json` สำหรับเอาต์พุตเครื่อง)                                                                                                                                                                                               |
| `qa parity-report`                                  | เปรียบเทียบไฟล์ `qa-suite-summary.json` สองไฟล์และเขียนรายงานความเสมอภาคเชิง agentic หรือใช้ `--runtime-axis --token-efficiency` เพื่อเขียนรายงานความเสมอภาคของรันไทม์ Codex เทียบกับ OpenClaw และประสิทธิภาพโทเคนจากสรุปคู่รันไทม์หนึ่งรายการ                                         |
| `qa character-eval`                                 | รันสถานการณ์ QA ด้านคาแรกเตอร์ข้ามโมเดลสดหลายตัวพร้อมรายงานที่ตัดสินแล้ว ดู [การรายงาน](#reporting)                                                                                                                                                            |
| `qa manual`                                         | รันพรอมป์ครั้งเดียวกับเลนผู้ให้บริการ/โมเดลที่เลือก                                                                                                                                                                                                          |
| `qa ui`                                             | เริ่ม UI ดีบักเกอร์ QA และบัส QA ในเครื่อง (นามแฝง: `pnpm qa:lab:ui`)                                                                                                                                                                                                    |
| `qa docker-build-image`                             | สร้างอิมเมจ Docker QA ที่อบไว้ล่วงหน้า                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | เขียนสแคฟโฟลด์ docker-compose สำหรับแดชบอร์ด QA + เลน Gateway                                                                                                                                                                                                    |
| `qa up`                                             | สร้างไซต์ QA, เริ่มสแต็กที่หนุนด้วย Docker, พิมพ์ URL (นามแฝง: `pnpm qa:lab:up`; ตัวแปร `:fast` เพิ่ม `--use-prebuilt-image --bind-ui-dist --skip-ui-build`)                                                                                                  |
| `qa aimock`                                         | เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ AIMock                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | เริ่มเฉพาะเซิร์ฟเวอร์ผู้ให้บริการ `mock-openai` ที่รับรู้สถานการณ์                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | จัดการพูลข้อมูลรับรอง Convex ที่ใช้ร่วมกัน                                                                                                                                                                                                                               |
| `qa matrix`                                         | เลนการขนส่งสดกับ homeserver Tuwunel แบบใช้แล้วทิ้ง ดู [Matrix QA](/th/concepts/qa-matrix)                                                                                                                                                                      |
| `qa telegram`                                       | เลนการขนส่งสดกับกลุ่ม Telegram ส่วนตัวจริง                                                                                                                                                                                                              |
| `qa discord`                                        | เลนการขนส่งสดกับช่อง guild Discord ส่วนตัวจริง                                                                                                                                                                                                       |
| `qa slack`                                          | เลนการขนส่งสดกับช่อง Slack ส่วนตัวจริง                                                                                                                                                                                                               |
| `qa whatsapp`                                       | เลนการขนส่งสดกับบัญชี WhatsApp Web จริง                                                                                                                                                                                                                 |
| `qa mantis`                                         | รันเนอร์การยืนยันก่อนและหลังสำหรับบั๊กการขนส่งสด พร้อมหลักฐานรีแอ็กชันสถานะ Discord, การ smoke เดสก์ท็อป/เบราว์เซอร์ Crabbox และการ smoke Slack-in-VNC ดู [Mantis](/th/concepts/mantis) และ [Runbook เดสก์ท็อป Slack ของ Mantis](/th/concepts/mantis-slack-desktop-runbook) |

`qa run` ที่หนุนด้วยโปรไฟล์อ่านสมาชิกจาก `taxonomy.yaml` แล้วส่งต่อ
สถานการณ์ที่ resolve แล้วผ่าน `qa suite` `--surface` และ
`--category` กรองโปรไฟล์ที่เลือกแทนการกำหนดเลนแยกต่างหาก
`qa-evidence.json` ที่ได้จะรวมสรุป scorecard ของโปรไฟล์พร้อม
จำนวนหมวดหมู่ที่เลือกและ ID ความครอบคลุมที่ขาดหาย; รายการหลักฐาน
แต่ละรายการยังคงเป็นแหล่งความจริงสำหรับการทดสอบ บทบาทความครอบคลุม และผลลัพธ์
ID ความครอบคลุมฟีเจอร์ของ taxonomy เป็นเป้าหมายหลักฐานที่ตรงตัว ไม่ใช่นามแฝง ความครอบคลุม
สถานการณ์หลักเติมเต็ม ID ที่ตรงกัน; ความครอบคลุมรองยังคงเป็นคำแนะนำ
ID ความครอบคลุมใช้รูปแบบ `namespace.behavior` แบบจุด โดยมีเซกเมนต์
ตัวอักษรและตัวเลขตัวพิมพ์เล็ก/ขีดกลาง; ID โปรไฟล์, พื้นผิว และหมวดหมู่อาจยังใช้
ID taxonomy แบบขีดกลางหรือแบบจุดที่มีอยู่
หลักฐานแบบบางละเว้น `execution` ต่อรายการและตั้งค่า `evidenceMode: "slim"`;
`smoke-ci` มีค่าเริ่มต้นเป็นแบบบาง และ `--evidence-mode full` กู้คืนรายการเต็ม:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

ใช้ `smoke-ci` สำหรับหลักฐานโปรไฟล์แบบกำหนดซ้ำได้ด้วยผู้ให้บริการโมเดลจำลองและ
เซิร์ฟเวอร์ผู้ให้บริการในเครื่อง Crabline ใช้ `release` สำหรับหลักฐาน Stable/LTS กับ
ช่องทางสด ใช้ `all` เฉพาะสำหรับการรันหลักฐาน taxonomy เต็มรูปแบบอย่างชัดเจน; คำสั่งนี้เลือก
ทุกหมวดหมู่วุฒิภาวะที่ใช้งานอยู่และสามารถส่งผ่านเวิร์กโฟลว์ `QA Profile
Evidence` ด้วย `qa_profile=all` เมื่อคำสั่งต้องใช้โปรไฟล์รากของ OpenClaw ด้วย
ให้วางโปรไฟล์รากไว้ก่อนคำสั่ง QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## โฟลว์ผู้ปฏิบัติการ

โฟลว์ผู้ปฏิบัติการ QA ปัจจุบันเป็นไซต์ QA สองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab ที่แสดงทรานสคริปต์แบบ Slack-ish และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้สร้างไซต์ QA, เริ่มเลน Gateway ที่หนุนด้วย Docker และเปิดเผยหน้า
QA Lab ซึ่งผู้ปฏิบัติการหรือลูปอัตโนมัติสามารถมอบภารกิจ QA ให้ agent,
สังเกตพฤติกรรมช่องทางจริง และบันทึกว่าสิ่งใดทำงาน ล้มเหลว หรือ
ยังถูกบล็อกอยู่

สำหรับการวนทำงาน UI ของ QA Lab ในเครื่องให้เร็วขึ้นโดยไม่ต้องสร้างอิมเมจ Docker ใหม่ทุกครั้ง
ให้เริ่มสแต็กด้วยบันเดิล QA Lab ที่ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` คงบริการ Docker ไว้บนอิมเมจที่สร้างไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
สร้างบันเดิลนั้นใหม่เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์โหลดใหม่อัตโนมัติเมื่อแฮชแอสเซ็ตของ QA Lab
เปลี่ยน

สำหรับการ smoke สัญญาณ OpenTelemetry ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นั้นเริ่มตัวรับ OTLP/HTTP ในเครื่อง, รันสถานการณ์ QA `otel-trace-smoke`
โดยเปิดใช้ Plugin `diagnostics-otel` แล้วตรวจยืนยันว่ามีการส่งออก traces,
metrics และ logs สคริปต์ถอดรหัส trace spans ของ protobuf ที่ส่งออก
และตรวจรูปทรงที่สำคัญต่อรีลีส:
ต้องมี `openclaw.run`, `openclaw.harness.run`, span เรียกโมเดลตาม semantic-convention
GenAI ล่าสุด, `openclaw.context.assembled` และ `openclaw.message.delivery`
การ smoke บังคับ
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ดังนั้น span เรียกโมเดล
ต้องใช้ชื่อ `{gen_ai.operation.name} {gen_ai.request.model}`;
การเรียกโมเดลต้องไม่ส่งออก `StreamAbandoned` ในเทิร์นที่สำเร็จ; ID วินิจฉัยดิบและ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace เพย์โหลด OTLP ดิบ
ต้องไม่มี sentinel ของพรอมป์, sentinel ของคำตอบ หรือคีย์เซสชัน QA
สคริปต์เขียน `otel-smoke-summary.json` ถัดจากอาร์ติแฟกต์ชุด QA

สำหรับการ smoke OpenTelemetry ที่หนุนด้วย collector ให้รัน:

```bash
pnpm qa:otel:collector-smoke
```

เลนนั้นวางคอนเทนเนอร์ Docker ของ OpenTelemetry Collector จริงไว้หน้าตัวรับในเครื่อง
ตัวเดียวกัน ใช้เมื่อเปลี่ยนการต่อสาย endpoint, ความเข้ากันได้ของ collector
หรือพฤติกรรมการส่งออก OTLP ที่ตัวรับในโปรเซสอาจปกปิดได้

สำหรับการ smoke การ scrape Prometheus ที่ได้รับการป้องกัน ให้รัน:

```bash
pnpm qa:prometheus:smoke
```

แ alias นั้นรันสถานการณ์ QA `docker-prometheus-smoke` โดยเปิดใช้
`diagnostics-prometheus` ตรวจสอบว่า scrape แบบไม่ผ่านการยืนยันตัวตนถูกปฏิเสธ
จากนั้นตรวจสอบว่า scrape แบบผ่านการยืนยันตัวตนมีชุด metric family ที่สำคัญต่อการเผยแพร่
โดยไม่มีเนื้อหา prompt, เนื้อหา response, ตัวระบุ diagnostic ดิบ, โทเค็น auth
หรือพาธภายในเครื่อง

หากต้องการรัน smoke ด้าน observability ทั้งสองรายการต่อเนื่องกัน ให้ใช้:

```bash
pnpm qa:observability:smoke
```

สำหรับเลน OpenTelemetry ที่มี collector หนุนหลังร่วมกับ smoke ของ Prometheus scrape
ที่มีการป้องกัน ให้ใช้:

```bash
pnpm qa:observability:collector-smoke
```

Observability QA ใช้ได้เฉพาะกับ source checkout เท่านั้น npm tarball จงใจละเว้น
QA Lab ดังนั้นเลน Docker release ของแพ็กเกจจะไม่รันคำสั่ง `qa` ใช้
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` หรือ
`pnpm qa:observability:smoke` จาก source checkout ที่ build แล้วเมื่อเปลี่ยนแปลง
diagnostics instrumentation

สำหรับเลน smoke ของ Matrix ที่ใช้ transport จริงและไม่ต้องใช้ credential ของ model provider
ให้รันโปรไฟล์แบบเร็วด้วย provider OpenAI จำลองแบบ deterministic:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

สำหรับเลน provider live-frontier ให้ระบุ credential ที่เข้ากันได้กับ OpenAI
อย่างชัดเจน:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

อ้างอิง CLI ฉบับเต็ม, แค็ตตาล็อก profile/scenario, env vars และโครงสร้าง artifact สำหรับเลนนี้อยู่ใน [Matrix QA](/th/concepts/qa-matrix) โดยสรุป: ระบบจะจัดเตรียม homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker, ลงทะเบียนผู้ใช้ driver/SUT/observer ชั่วคราว, รัน Plugin Matrix จริงภายใน child QA gateway ที่จำกัดขอบเขตไว้ที่ transport นั้น (ไม่มี `qa-channel`) จากนั้นเขียนรายงาน Markdown, สรุป JSON, artifact observed-events และบันทึก output รวมไว้ใต้ `.artifacts/qa-e2e/matrix-<timestamp>/`

สถานการณ์ครอบคลุมพฤติกรรม transport ที่ unit test พิสูจน์แบบ end to end ไม่ได้: mention gating, นโยบาย allow-bot, allowlists, การตอบกลับระดับบนสุดและใน thread, การ routing DM, การจัดการ reaction, การระงับ edit ขาเข้า, การ dedupe การ replay หลัง restart, การกู้คืนจากการขัดจังหวะของ homeserver, การส่ง metadata การอนุมัติ, การจัดการสื่อ และ flow การ bootstrap/recovery/verification ของ Matrix E2EE โปรไฟล์ CLI ของ E2EE ยังขับคำสั่ง `openclaw matrix encryption setup` และคำสั่ง verification ผ่าน homeserver แบบใช้แล้วทิ้งเดียวกันก่อนตรวจสอบการตอบกลับของ Gateway

Discord ยังมีสถานการณ์แบบ opt-in เฉพาะ Mantis สำหรับการจำลองบั๊ก ใช้
`--scenario discord-status-reactions-tool-only` สำหรับ timeline ของ status reaction
แบบชัดเจน หรือ `--scenario discord-thread-reply-filepath-attachment` เพื่อสร้าง
thread จริงใน Discord และตรวจสอบว่า `message.thread-reply` เก็บรักษา attachment
แบบ `filePath` ไว้ สถานการณ์เหล่านี้ไม่อยู่ในเลน Discord live เริ่มต้น
เพราะเป็น probe จำลองก่อน/หลังมากกว่าความครอบคลุม smoke แบบกว้าง
workflow Mantis สำหรับ thread-attachment ยังสามารถเพิ่มวิดีโอพยานจาก Discord Web
ที่ล็อกอินแล้วได้เมื่อกำหนด `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` หรือ
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ในสภาพแวดล้อม QA
โปรไฟล์ viewer นั้นใช้สำหรับการจับภาพด้วยสายตาเท่านั้น การตัดสิน pass/fail
ยังมาจาก oracle ของ Discord REST

CI ใช้พื้นผิวคำสั่งเดียวกันใน `.github/workflows/qa-live-transports-convex.yml`
การรันตามกำหนดและการรัน manual เริ่มต้นจะรันโปรไฟล์ Matrix แบบเร็วด้วย
credential live-frontier ที่ QA จัดให้, `--fast` และ
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ส่วน manual `matrix_profile=all`
จะแตกออกเป็น shard ของ profile ทั้งห้า

สำหรับเลน smoke ของ Telegram, Discord, Slack และ WhatsApp ที่ใช้ transport จริง:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

เลนเหล่านี้กำหนดเป้าหมายไปยังช่องจริงที่มีอยู่แล้วพร้อม bot หรือบัญชีสองตัว (driver + SUT) env vars ที่จำเป็น, รายการ scenario, output artifacts และ pool credential ของ Convex มีเอกสารใน [อ้างอิง QA สำหรับ Telegram, Discord, Slack และ WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) ด้านล่าง

สำหรับการรัน VM เดสก์ท็อป Slack แบบเต็มพร้อม VNC rescue ให้รัน:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนั้นเช่าเครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox, รันเลน Slack live
ภายใน VM, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อป และคัดลอก
`slack-qa/`, `slack-desktop-smoke.png` และ `slack-desktop-smoke.mp4`
เมื่อมีการจับวิดีโอกลับไปยังไดเรกทอรี artifact ของ Mantis lease เดสก์ท็อป/เบราว์เซอร์ของ Crabbox
มีเครื่องมือจับภาพและแพ็กเกจช่วย build แบบ browser/native เตรียมไว้ล่วงหน้า
ดังนั้นสถานการณ์ควรติดตั้ง fallback เฉพาะบน lease รุ่นเก่าเท่านั้น
Mantis รายงานเวลารวมและเวลาราย phase ใน
`mantis-slack-desktop-smoke-report.md` เพื่อให้การรันที่ช้าแสดงได้ว่าเวลาใช้ไปกับ
การ warmup lease, การรับ credential, การตั้งค่า remote หรือการคัดลอก artifact
ใช้ `--lease-id <cbx_...>` ซ้ำหลังจากล็อกอิน Slack Web ด้วยตนเองผ่าน VNC
lease ที่ใช้ซ้ำจะรักษา cache ของ pnpm store ของ Crabbox ให้อุ่นไว้ด้วย ค่าเริ่มต้น
`--hydrate-mode source` ตรวจสอบจาก source checkout และรัน install/build
ภายใน VM ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace remote ที่ใช้ซ้ำ
มี `node_modules` และ `dist/` ที่ build แล้วเท่านั้น โหมดนั้นข้ามขั้นตอน
install/build ที่ใช้เวลามากและ fail closed เมื่อ workspace ยังไม่พร้อม
เมื่อใช้ `--gateway-setup` Mantis จะปล่อย Gateway Slack ของ OpenClaw แบบ persistent
ให้รันอยู่ภายใน VM บนพอร์ต `38973`; หากไม่ใช้ คำสั่งจะรันเลน Slack QA แบบ
bot-to-bot ปกติและออกหลังจับ artifact

เพื่อพิสูจน์ UI การอนุมัติแบบ native ของ Slack ด้วยหลักฐานเดสก์ท็อป ให้รันโหมด
checkpoint การอนุมัติของ Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

โหมดนี้ใช้ร่วมกับ `--gateway-setup` ไม่ได้ โหมดจะรันสถานการณ์การอนุมัติของ Slack,
ปฏิเสธ scenario ids ที่ไม่ใช่การอนุมัติ, รอในแต่ละสถานะ approval ที่ pending และ
resolved, render ข้อความ Slack API ที่สังเกตเห็นเป็น
`approval-checkpoints/<scenario>-pending.png` และ
`approval-checkpoints/<scenario>-resolved.png` จากนั้นล้มเหลวหาก checkpoint,
หลักฐานข้อความ, acknowledgement หรือ screenshot ที่ render ขาดหายหรือว่างเปล่า
lease CI แบบ cold อาจยังแสดงหน้าลงชื่อเข้าใช้ Slack ใน `slack-desktop-smoke.png`;
ภาพ checkpoint การอนุมัติคือหลักฐานภาพสำหรับเลนนี้

checklist สำหรับ operator, คำสั่ง dispatch ของ GitHub workflow, สัญญา evidence-comment,
ตารางตัดสินใจ hydrate-mode, การตีความเวลา และขั้นตอนการจัดการความล้มเหลว
อยู่ใน [Mantis Slack Desktop Runbook](/th/concepts/mantis-slack-desktop-runbook)

สำหรับงานเดสก์ท็อปสไตล์ agent/CV ให้รัน:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` จะเช่าหรือใช้เครื่องเดสก์ท็อป/เบราว์เซอร์ Crabbox ซ้ำ, เริ่ม
`crabbox record --while`, ขับเบราว์เซอร์ที่มองเห็นผ่าน
`visual-driver` แบบซ้อน, จับ `visual-task.png`, รัน `openclaw infer image describe`
กับ screenshot เมื่อเลือก `--vision-mode image-describe` และเขียน
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` และ `mantis-visual-task-report.md`
เมื่อกำหนด `--expect-text` prompt ด้าน vision จะขอ verdict เป็น JSON แบบมีโครงสร้าง
และผ่านเฉพาะเมื่อ model รายงานหลักฐานที่มองเห็นได้เป็นบวกเท่านั้น
response เชิงลบที่เพียง quote ข้อความเป้าหมายจะทำให้ assertion ล้มเหลว
ใช้ `--vision-mode metadata` สำหรับ smoke แบบไม่ใช้ model ที่พิสูจน์ plumbing ของ
เดสก์ท็อป, เบราว์เซอร์, screenshot และวิดีโอโดยไม่เรียก provider ที่เข้าใจภาพ
การบันทึกเป็น artifact ที่จำเป็นสำหรับ `visual-task`; หาก Crabbox ไม่บันทึก
`visual-task.mp4` ที่ไม่ว่าง งานจะล้มเหลวแม้ visual driver จะผ่านแล้วก็ตาม
เมื่อเกิดความล้มเหลว Mantis จะเก็บ lease ไว้สำหรับ VNC เว้นแต่งานผ่านแล้ว
และไม่ได้ตั้ง `--keep-lease`

ก่อนใช้ credential live แบบ pooled ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor ตรวจสอบ env ของ broker Convex, ตรวจสอบการตั้งค่า endpoint และตรวจสอบการเข้าถึง admin/list เมื่อมี maintainer secret ระบบรายงานเฉพาะสถานะ set/missing สำหรับ secrets

## ความครอบคลุม transport แบบ live

เลน transport แบบ live ใช้สัญญาเดียวร่วมกันแทนที่แต่ละเลนจะคิดรูปแบบรายการ scenario ของตัวเอง `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบ synthetic ที่กว้าง และไม่เป็นส่วนหนึ่งของ matrix ความครอบคลุม transport แบบ live

runner ของ transport แบบ live ควร import scenario ids ร่วม, helper ความครอบคลุม
baseline และ helper การเลือก scenario จาก
`openclaw/plugin-sdk/qa-live-transport-scenarios`

| เลน      | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

สิ่งนี้คงให้ `qa-channel` เป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่ Matrix,
Telegram และ transport live อื่น ๆ ใช้ checklist สัญญา transport ที่ชัดเจนร่วมกัน

สำหรับเลน VM Linux แบบใช้แล้วทิ้งโดยไม่ดึง Docker เข้ามาในพาธ QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้บูต guest Multipass ใหม่, ติดตั้ง dependency, build OpenClaw
ภายใน guest, รัน `qa suite` จากนั้นคัดลอกรายงาน QA และ
summary ปกติกลับไปยัง `.artifacts/qa-e2e/...` บน host
คำสั่งใช้พฤติกรรมการเลือก scenario เดียวกับ `qa suite` บน host
การรัน suite บน host และ Multipass จะ execute scenario ที่เลือกหลายรายการแบบขนาน
ด้วย gateway worker ที่แยกกันโดยค่าเริ่มต้น `qa-channel` มี concurrency เริ่มต้น
เป็น 4 และถูกจำกัดด้วยจำนวน scenario ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการ execute แบบ serial
ใช้ `--pack personal-agent` เพื่อรัน benchmark pack ของ personal assistant
ตัวเลือก pack เป็นแบบ additive ร่วมกับ flag `--scenario` ที่ระบุซ้ำได้: scenario
ที่ระบุชัดเจนจะรันก่อน จากนั้น scenario ใน pack จะรันตามลำดับ pack พร้อมลบรายการซ้ำ
ใช้ `--pack observability` เมื่อ runner QA แบบกำหนดเองจัดเตรียมการตั้งค่า
OpenTelemetry collector ให้อยู่แล้ว และต้องการเลือกสถานการณ์ smoke ของ diagnostics
สำหรับ OpenTelemetry และ Prometheus ร่วมกัน
คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อมี scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifact โดยไม่มี exit code แบบล้มเหลว
การรัน live จะ forward อินพุต auth ของ QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ
guest: provider keys แบบ env, พาธ config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ เก็บ `--output-dir` ไว้ใต้ repo root เพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount ไว้ได้

## ข้อมูลอ้างอิง QA สำหรับ Telegram, Discord, Slack และ WhatsApp

Matrix มี[หน้าเฉพาะ](/th/concepts/qa-matrix)เนื่องจากมีจำนวนสถานการณ์จำนวนมากและการจัดเตรียม homeserver ที่รองรับด้วย Docker ส่วน Telegram, Discord, Slack และ WhatsApp ทำงานกับทรานสปอร์ตจริงที่มีอยู่แล้ว ดังนั้นข้อมูลอ้างอิงของทรานสปอร์ตเหล่านี้จึงอยู่ที่นี่

### แฟล็ก CLI ที่ใช้ร่วมกัน

เลนเหล่านี้ลงทะเบียนผ่าน `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` และรับแฟล็กเดียวกัน:

| แฟล็ก                                  | ค่าเริ่มต้น                                            | คำอธิบาย                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | เรียกใช้เฉพาะสถานการณ์นี้ ทำซ้ำได้                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | ตำแหน่งที่เขียนรายงาน สรุป หลักฐาน อาร์ติแฟกต์เฉพาะทรานสปอร์ต และบันทึกเอาต์พุต พาธสัมพัทธ์จะถูก resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`                  | `process.cwd()`                                    | รากของรีโพสิทอรีเมื่อเรียกใช้จาก cwd ที่เป็นกลาง                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | id บัญชีชั่วคราวภายในคอนฟิก QA gateway                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` หรือ `live-frontier` (`live-openai` แบบเก่ายังใช้งานได้)                                                                            |
| `--model <ref>` / `--alt-model <ref>` | ค่าเริ่มต้นของ provider                                   | refs โมเดลหลัก/สำรอง                                                                                                                   |
| `--fast`                              | ปิด                                                | โหมดเร็วของ provider เมื่อรองรับ                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | ดู [พูลข้อมูลประจำตัว Convex](#convex-credential-pool)                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` ใน CI, มิฉะนั้นเป็น `maintainer`                 | บทบาทที่ใช้เมื่อ `--credential-source convex`                                                                                                    |

แต่ละเลนจะออกด้วย non-zero เมื่อสถานการณ์ใดล้มเหลว `--allow-failures` จะเขียนอาร์ติแฟกต์โดยไม่ตั้งรหัสออกเป็นล้มเหลว

### QA สำหรับ Telegram

```bash
pnpm openclaw qa telegram
```

กำหนดเป้าหมายไปยังกลุ่มส่วนตัวจริงหนึ่งกลุ่มใน Telegram ที่มีบอทแยกกันสองตัว (driver + SUT) บอท SUT ต้องมีชื่อผู้ใช้ Telegram; การสังเกตแบบบอทถึงบอทจะทำงานได้ดีที่สุดเมื่อบอททั้งสองเปิดใช้ **Bot-to-Bot Communication Mode** ใน `@BotFather`

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - chat id แบบตัวเลข (สตริง)
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

ชุดค่าเริ่มต้นโดยนัยจะครอบคลุม canary, mention gating, การตอบกลับคำสั่ง native, การระบุที่อยู่คำสั่ง และการตอบกลับกลุ่มแบบบอทถึงบอทเสมอ ค่าเริ่มต้นของ `mock-openai` ยังรวมการตรวจสอบ reply-chain แบบกำหนดตายตัวและการสตรีมข้อความสุดท้ายด้วย `telegram-current-session-status-tool` ยังคงเป็นแบบ opt-in เพราะเสถียรเฉพาะเมื่อรันต่อโดยตรงหลัง canary ไม่ใช่หลังการตอบกลับคำสั่ง native แบบใดก็ได้ ใช้ `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` เพื่อพิมพ์การแบ่งค่าเริ่มต้น/ตัวเลือกปัจจุบันพร้อม refs การถดถอย

อาร์ติแฟกต์เอาต์พุต:

- `telegram-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบทรานสปอร์ตแบบ live รวมถึงฟิลด์ profile, coverage, provider, channel, artifacts, result และ RTT

การรัน Telegram ในแพ็กเกจใช้สัญญาข้อมูลประจำตัว Telegram เดียวกัน การวัด RTT ซ้ำเป็นส่วนหนึ่งของเลน live Telegram ในแพ็กเกจตามปกติ; การกระจาย RTT จะถูกรวมเข้าใน `qa-evidence.json` ภายใต้ `result.timing` สำหรับการตรวจสอบ RTT ที่เลือก

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

เมื่อกำหนด `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` wrapper live ของแพ็กเกจจะเช่า credential `kind: "telegram"` ส่งออก env ของกลุ่ม/driver/SUT bot ที่เช่าไปยังการรันแพ็กเกจที่ติดตั้งแล้ว ส่ง Heartbeat ให้ lease และ release เมื่อปิดตัว wrapper ของแพ็กเกจมีค่าเริ่มต้นเป็นการตรวจสอบ RTT 20 ครั้งของ `telegram-mentioned-message-reply`, timeout RTT 30 วินาที และบทบาท Convex `maintainer` นอก CI เมื่อเลือก Convex ปรับ `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` หรือ `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` เพื่อปรับแต่งการวัด RTT โดยไม่ต้องสร้างคำสั่ง RTT หรือรูปแบบสรุปเฉพาะ Telegram แยกต่างหาก

### QA สำหรับ Discord

```bash
pnpm openclaw qa discord
```

กำหนดเป้าหมายไปยังช่อง guild ส่วนตัวจริงหนึ่งช่องใน Discord ที่มีบอทสองตัว: บอท driver ที่ควบคุมโดย harness และบอท SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Discord plugin ที่บันเดิลไว้ ตรวจสอบการจัดการ channel mention, ว่าบอท SUT ได้ลงทะเบียนคำสั่ง native `/help` กับ Discord แล้ว และสถานการณ์หลักฐาน Mantis แบบ opt-in

env ที่จำเป็นเมื่อ `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - ต้องตรงกับ id ผู้ใช้บอท SUT ที่ Discord ส่งกลับมา (มิฉะนั้นเลนจะ fail fast)

ตัวเลือก:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ในอาร์ติแฟกต์ observed-message
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` เลือกช่องเสียง/stage สำหรับ `discord-voice-autojoin`; หากไม่มี สถานการณ์จะเลือกช่องเสียง/stage แรกที่มองเห็นได้สำหรับบอท SUT

สถานการณ์ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - สถานการณ์เสียงแบบ opt-in รันแยกเดี่ยว เปิดใช้ `channels.discord.voice.autoJoin` และตรวจสอบว่าสถานะเสียง Discord ปัจจุบันของบอท SUT คือช่องเสียง/stage เป้าหมาย credential Discord ของ Convex อาจมี `voiceChannelId` แบบไม่บังคับ; มิฉะนั้น runner จะค้นหาช่องเสียง/stage แรกที่มองเห็นได้ใน guild
- `discord-status-reactions-tool-only` - สถานการณ์ Mantis แบบ opt-in รันแยกเดี่ยวเพราะจะสลับ SUT ไปเป็นการตอบกลับ guild แบบ always-on, tool-only ด้วย `messages.statusReactions.enabled=true` จากนั้นจับ timeline ของ reaction ผ่าน REST พร้อมอาร์ติแฟกต์ภาพ HTML/PNG รายงาน Mantis ก่อน/หลังยังเก็บอาร์ติแฟกต์ MP4 ที่สถานการณ์ให้มาเป็น `baseline.mp4` และ `candidate.mp4` ด้วย

รันสถานการณ์ voice auto-join ของ Discord โดยระบุชัดเจน:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

รันสถานการณ์ status-reaction ของ Mantis โดยระบุชัดเจน:

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
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบทรานสปอร์ตแบบ live
- `discord-qa-observed-messages.json` - เนื้อหาถูกปกปิด เว้นแต่ `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
- `discord-qa-reaction-timelines.json` และ `discord-status-reactions-tool-only-timeline.png` เมื่อสถานการณ์ status-reaction รัน

### QA สำหรับ Slack

```bash
pnpm openclaw qa slack
```

กำหนดเป้าหมายไปยังช่องส่วนตัวจริงหนึ่งช่องใน Slack ที่มีบอทแยกกันสองตัว: บอท driver ที่ควบคุมโดย harness และบอท SUT ที่เริ่มโดย OpenClaw gateway ลูกผ่าน Slack plugin ที่บันเดิลไว้

env ที่จำเป็นเมื่อ `--credential-source env`:

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
- `slack-approval-exec-native` - สถานการณ์อนุมัติ exec แบบ native Slack ที่เป็น opt-in ขออนุมัติ exec ผ่าน Gateway ตรวจสอบว่าข้อความ Slack มีปุ่มอนุมัติ native, resolve แล้วตรวจสอบอัปเดต Slack ที่ resolve แล้ว
- `slack-approval-plugin-native` - สถานการณ์อนุมัติ plugin แบบ native Slack ที่เป็น opt-in เปิดใช้การส่งต่อการอนุมัติ exec และ plugin ร่วมกัน เพื่อไม่ให้เหตุการณ์ plugin ถูกระงับโดยการ route การอนุมัติ exec จากนั้นตรวจสอบเส้นทาง UI native Slack แบบ pending/resolved เดียวกัน

อาร์ติแฟกต์เอาต์พุต:

- `slack-qa-report.md`
- `qa-evidence.json` - รายการหลักฐานสำหรับการตรวจสอบทรานสปอร์ตแบบ live
- `slack-qa-observed-messages.json` - เนื้อหาถูกปกปิด เว้นแต่ `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`
- `approval-checkpoints/` - เฉพาะเมื่อ Mantis ตั้งค่า `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; มี checkpoint JSON, acknowledgement JSON และสกรีนช็อต pending/resolved

#### การตั้งค่า workspace ของ Slack

เลนนี้ต้องมีแอป Slack แยกกันสองแอปใน workspace เดียวกัน พร้อมช่องที่บอททั้งสองเป็นสมาชิก:

- `channelId` - id `Cxxxxxxxxxx` ของช่องที่บอททั้งสองได้รับเชิญแล้ว ใช้ช่องเฉพาะ; เลนจะโพสต์ทุกครั้งที่รัน
- `driverBotToken` - token บอท (`xoxb-...`) ของแอป **Driver**
- `sutBotToken` - token บอท (`xoxb-...`) ของแอป **SUT** ซึ่งต้องเป็นแอป Slack แยกจาก driver เพื่อให้ id ผู้ใช้บอทของแอปนี้แตกต่างกัน
- `sutAppToken` - token ระดับแอป (`xapp-...`) ของแอป SUT ที่มี `connections:write` ใช้โดย Socket Mode เพื่อให้แอป SUT รับเหตุการณ์ได้

ควรใช้ Slack workspace ที่จัดไว้สำหรับ QA แทนการใช้ workspace โปรดักชันซ้ำ

manifest ของ SUT ด้านล่างตั้งใจจำกัดการติดตั้งโปรดักชันของ Slack plugin ที่บันเดิลไว้ (`extensions/slack/src/setup-shared.ts:10`) ให้เหลือเฉพาะสิทธิ์และเหตุการณ์ที่ครอบคลุมโดยชุด QA live Slack สำหรับการตั้งค่าช่องโปรดักชันตามที่ผู้ใช้เห็น โปรดดู [การตั้งค่าด่วนช่อง Slack](/th/channels/slack#quick-setup); คู่ QA Driver/SUT แยกออกโดยตั้งใจเพราะเลนต้องใช้ id ผู้ใช้บอทแยกกันสอง id ใน workspace เดียวกัน

**1. สร้างแอป Driver**

ไปที่ [api.slack.com/apps](https://api.slack.com/apps) → _สร้างแอปใหม่_ → _จาก manifest_ → เลือก workspace สำหรับ QA, วาง manifest ต่อไปนี้ แล้วเลือก _ติดตั้งไปยัง Workspace_:

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

คัดลอก _Bot User OAuth Token_ (`xoxb-...`) - ค่านั้นจะเป็น `driverBotToken` ไดรเวอร์ต้องใช้เพียงการโพสต์ข้อความและระบุตัวตนของตัวเองเท่านั้น ไม่ต้องมีอีเวนต์และไม่ต้องใช้ Socket Mode

**2. สร้างแอป SUT**

ทำซ้ำ _สร้างแอปใหม่ → จาก manifest_ ใน workspace เดียวกัน แอป QA นี้ตั้งใจใช้ manifest เวอร์ชันที่แคบกว่าของ Slack Plugin ที่บันเดิลมาสำหรับการใช้งานจริง (`extensions/slack/src/setup-shared.ts:10`): ละเว้น scopes และอีเวนต์เกี่ยวกับ reaction เพราะชุดทดสอบ Slack QA แบบ live ยังไม่ครอบคลุมการจัดการ reaction

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

หลังจาก Slack สร้างแอปแล้ว ให้ทำสองอย่างในหน้าการตั้งค่า:

- _ติดตั้งไปยัง Workspace_ → คัดลอก _Bot User OAuth Token_ → ค่านั้นจะเป็น `sutBotToken`
- _ข้อมูลพื้นฐาน → App-Level Tokens → สร้าง Token และ Scopes_ → เพิ่ม scope `connections:write` → บันทึก → คัดลอกค่า `xapp-...` → ค่านั้นจะเป็น `sutAppToken`

ตรวจสอบว่าบอตทั้งสองมี user id ต่างกันโดยเรียก `auth.test` กับ token แต่ละตัว runtime แยก driver และ SUT ด้วย user id; การใช้แอปเดียวซ้ำสำหรับทั้งสองบทบาทจะทำให้ mention-gating ล้มเหลวทันที

**3. สร้าง channel**

ใน workspace สำหรับ QA ให้สร้าง channel (เช่น `#openclaw-qa`) และเชิญบอตทั้งสองจากภายใน channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

คัดลอก id `Cxxxxxxxxxx` จาก _ข้อมูล channel → เกี่ยวกับ → Channel ID_ - ค่านั้นจะเป็น `channelId` ใช้ channel สาธารณะได้; ถ้าคุณใช้ channel ส่วนตัว ทั้งสองแอปมี `groups:history` อยู่แล้ว ดังนั้นการอ่านประวัติของ harness จะยังสำเร็จ

**4. ลงทะเบียนข้อมูลลับ**

มีสองตัวเลือก ใช้ env vars สำหรับการดีบักบนเครื่องเดียว (ตั้งค่าตัวแปร `OPENCLAW_QA_SLACK_*` ทั้งสี่ตัวและส่ง `--credential-source env`) หรือ seed shared Convex pool เพื่อให้ CI และ maintainers คนอื่นสามารถ lease ได้

สำหรับ Convex pool ให้เขียนทั้งสี่ฟิลด์ลงในไฟล์ JSON:

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

**5. ตรวจสอบแบบ end to end**

รัน lane ในเครื่องเพื่อยืนยันว่าบอตทั้งสองคุยกันผ่าน broker ได้:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

การรันที่ผ่านจะเสร็จภายในไม่ถึง 30 วินาที และ `slack-qa-report.md` จะแสดงทั้ง `slack-canary` และ `slack-mention-gating` ด้วยสถานะ `pass` ถ้า lane ค้างประมาณ 90 วินาทีแล้วออกด้วย `Convex credential pool exhausted for kind "slack"` แปลว่า pool ว่างหรือทุกแถวถูก lease อยู่ - `qa credentials list --kind slack --status all --json` จะบอกคุณว่าเป็นกรณีใด

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

เป้าหมายคือบัญชี WhatsApp Web เฉพาะสองบัญชี: บัญชี driver ที่ควบคุมโดย
harness และบัญชี SUT ที่เริ่มโดย Gateway ลูกของ OpenClaw ผ่าน
WhatsApp Plugin ที่บันเดิลมา

env ที่จำเป็นเมื่อใช้ `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

ไม่บังคับ:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` เปิดใช้ scenario แบบกลุ่ม เช่น
  `whatsapp-mention-gating` และ `whatsapp-group-allowlist-block`
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` เก็บเนื้อหาข้อความไว้ใน
  artifact ของข้อความที่สังเกตพบ

แคตตาล็อก scenario (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline และการ gating แบบกลุ่ม: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`
- คำสั่ง native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`
- พฤติกรรมการตอบกลับและ final-output: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`
- สื่อขาเข้าและข้อความแบบมีโครงสร้าง: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating` รายการเหล่านี้ส่งอีเวนต์รูปภาพ เสียง
  เอกสาร ตำแหน่งที่ตั้ง รายชื่อติดต่อ และสติกเกอร์จริงของ WhatsApp ผ่าน driver
- ความครอบคลุมของ Gateway ขาออกและ message action:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`
- ความครอบคลุมของการควบคุมการเข้าถึง: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`
- การอนุมัติ native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`
- Status reactions: `whatsapp-status-reactions`

ปัจจุบันแคตตาล็อกมี 36 scenarios lane เริ่มต้น `live-frontier` ถูกคงให้เล็ก
ที่ 10 scenarios เพื่อให้ครอบคลุม smoke ได้รวดเร็ว lane เริ่มต้น `mock-openai`
รัน deterministic scenarios 31 รายการผ่าน transport จริงของ WhatsApp โดย
mock เฉพาะ output ของโมเดล scenarios การอนุมัติและการตรวจสอบที่หนักหรือบล็อกบางรายการ
ยังคงต้องระบุด้วย scenario id โดยตรง

driver สำหรับ WhatsApp QA สังเกตอีเวนต์ live แบบมีโครงสร้าง (`text`, `media`,
`location`, `reaction` และ `poll`) และสามารถส่งสื่อ polls รายชื่อติดต่อ
ตำแหน่งที่ตั้ง และสติกเกอร์ได้แบบ active QA Lab import driver นั้นผ่าน
package surface `@openclaw/whatsapp/api.js` แทนการเข้าถึงไฟล์ runtime
ส่วนตัวของ WhatsApp โดยตรง เนื้อหาข้อความถูก redact ตามค่าเริ่มต้น ความครอบคลุม
ของ poll ขาออกและการอัปโหลดไฟล์รันผ่านการเรียก Gateway `poll` และ
`message.action` ที่ deterministic แทนการเรียก tool ผ่าน model-prompt เท่านั้น

Output artifacts:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - รายการ evidence สำหรับการตรวจสอบ live transport
- `whatsapp-qa-observed-messages.json` - เนื้อหาถูก redact เว้นแต่ตั้งค่า `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`

### Convex credential pool

lane ของ Telegram, Discord, Slack และ WhatsApp สามารถ lease ข้อมูลลับจาก Convex pool ที่แชร์ร่วมกันแทนการอ่าน env vars ด้านบนได้ ส่ง `--credential-source convex` (หรือตั้งค่า `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab จะขอ exclusive lease, ส่ง Heartbeat ตลอดระยะเวลาการรัน และ release เมื่อ shutdown ชนิดของ pool คือ `"telegram"`, `"discord"`, `"slack"` และ `"whatsapp"`

รูปแบบ payload ที่ broker ตรวจสอบใน `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` ต้องเป็นสตริง chat-id แบบตัวเลข
- Telegram real user (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - สำหรับหลักฐาน Mantis Telegram Desktop เท่านั้น lane ทั่วไปของ QA Lab ต้องไม่ขอชนิดนี้
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - หมายเลขโทรศัพท์ต้องเป็นสตริง E.164 ที่แตกต่างกัน

Workflow หลักฐาน Mantis Telegram Desktop ถือ exclusive Convex
`telegram-user` lease หนึ่งรายการสำหรับทั้ง driver ของ TDLib CLI และพยาน
Telegram Desktop แล้ว release หลังจากเผยแพร่หลักฐาน

เมื่อ PR ต้องใช้ visual diff ที่ deterministic Mantis สามารถใช้คำตอบ mock model
เดียวกันบน `main` และบน PR head ขณะที่ Telegram formatter หรือเลเยอร์การส่ง
เปลี่ยนไป ค่าเริ่มต้นของการจับภาพถูกปรับให้เหมาะกับคอมเมนต์ PR: Crabbox
class มาตรฐาน, การบันทึกเดสก์ท็อป 24fps, motion GIF 24fps และความกว้างพรีวิว 1920px
คอมเมนต์ก่อน/หลังควรเผยแพร่ bundle ที่สะอาดซึ่งมีเฉพาะ GIF ที่ตั้งใจไว้เท่านั้น

Slack lanes ก็ใช้ pool ได้เช่นกัน การตรวจสอบรูปแบบ Slack payload ปัจจุบันอยู่ใน Slack QA runner แทน broker; ใช้ `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` พร้อม Slack channel id เช่น `Cxxxxxxxxxx` ดู [การตั้งค่า Slack workspace](#setting-up-the-slack-workspace) สำหรับการจัดเตรียมแอปและ scope

Operational env vars และสัญญา endpoint ของ Convex broker อยู่ใน [การทดสอบ → ข้อมูลลับ Telegram ที่แชร์ผ่าน Convex](/th/help/testing#shared-telegram-credentials-via-convex-v1) (ชื่อส่วนนี้มาก่อน multi-channel pool; semantics ของ lease ใช้ร่วมกันทุกชนิด)

## Seeds ที่อิง repo

Seed assets อยู่ใน `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

รายการเหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้แผน QA มองเห็นได้ทั้งสำหรับมนุษย์และ
agent

`qa-lab` ควรคงเป็น generic YAML scenario runner แต่ละไฟล์ scenario YAML
เป็น source of truth สำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนด:

- `title` ระดับบนสุด
- metadata ของ `scenario`
- metadata หมวดหมู่ capability, lane และ risk ที่ไม่บังคับใน `scenario`
- docs และ code refs ใน `scenario`
- ข้อกำหนด Plugin ที่ไม่บังคับใน `scenario`
- gateway config patch ที่ไม่บังคับใน `scenario`
- `flow` ระดับบนสุดที่ executable สำหรับ flow scenarios หรือ `scenario.execution.kind` /
  `scenario.execution.path` สำหรับ Vitest และ Playwright scenarios

พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งรองรับ `flow` ได้รับอนุญาตให้คงความเป็นทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ YAML สามารถรวมตัวช่วยฝั่งทรานสปอร์ต
เข้ากับตัวช่วยฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่านจุดเชื่อมต่อ
Gateway `browser.request` โดยไม่ต้องเพิ่มรันเนอร์กรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์ แทนที่จะจัดตามโฟลเดอร์
ในซอร์สทรี รักษา ID สถานการณ์ให้เสถียรเมื่อย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการติดตามกลับไปยังการใช้งานจริง

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และแชตช่องทาง
- พฤติกรรมของเธรด
- วงจรชีวิตของการกระทำกับข้อความ
- คอลแบ็ก cron
- การเรียกคืนหน่วยความจำ
- การสลับโมเดล
- การส่งต่อไปยัง subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## เลน mock ของผู้ให้บริการ

`qa suite` มีเลน mock ผู้ให้บริการแบบโลคัลสองเลน:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ โดยยังคงเป็นเลน mock
  แบบกำหนดผลได้เริ่มต้นสำหรับ QA ที่อิง repo และเกต parity
- `aimock` เริ่มเซิร์ฟเวอร์ผู้ให้บริการที่ใช้ AIMock สำหรับการครอบคลุมโปรโตคอล
  fixture, record/replay และ chaos แบบทดลอง เลนนี้เป็นส่วนเพิ่มและไม่ได้แทนที่
  dispatcher สถานการณ์ `mock-openai`

การใช้งานเลนผู้ให้บริการอยู่ใต้ `extensions/qa-lab/src/providers/`
ผู้ให้บริการแต่ละรายเป็นเจ้าของค่าเริ่มต้นของตนเอง การเริ่มเซิร์ฟเวอร์โลคัล
การกำหนดค่าโมเดล Gateway ความต้องการ staging ของ auth-profile และแฟล็กความสามารถ
แบบ live/mock โค้ด suite และ gateway ที่ใช้ร่วมกันควรส่งผ่าน provider registry
แทนการแตกแขนงตามชื่อผู้ให้บริการ

## อะแดปเตอร์ทรานสปอร์ต

`qa-lab` เป็นเจ้าของจุดเชื่อมต่อทรานสปอร์ตทั่วไปสำหรับสถานการณ์ QA แบบ YAML `qa-channel` คือค่าเริ่มต้นสังเคราะห์ `crabline` เริ่มเซิร์ฟเวอร์โลคัลที่มีรูปแบบเหมือนผู้ให้บริการ และรัน Plugin ช่องทางปกติของ OpenClaw กับเซิร์ฟเวอร์เหล่านั้น `live` สงวนไว้สำหรับข้อมูลรับรองผู้ให้บริการจริงและช่องทางภายนอก

ในระดับสถาปัตยกรรม การแบ่งมีดังนี้:

- `qa-lab` เป็นเจ้าของการดำเนินสถานการณ์ทั่วไป การทำงานพร้อมกันของ worker การเขียน artifact และการรายงาน
- อะแดปเตอร์ทรานสปอร์ตเป็นเจ้าของการกำหนดค่า gateway, readiness, การสังเกต inbound และ outbound, การกระทำของทรานสปอร์ต และสถานะทรานสปอร์ตที่ทำให้เป็นมาตรฐานแล้ว
- ไฟล์สถานการณ์ YAML ใต้ `qa/scenarios/` กำหนดการรันทดสอบ; `qa-lab` ให้พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งดำเนินการสถานการณ์เหล่านั้น

### การเพิ่มช่องทาง

การเพิ่มช่องทางเข้าไปในระบบ QA แบบ YAML ต้องมีทั้งการใช้งานช่องทางและ
ชุดสถานการณ์ที่ทดสอบสัญญาของช่องทาง สำหรับการครอบคลุม smoke CI ให้เพิ่ม
เซิร์ฟเวอร์ผู้ให้บริการโลคัล Crabline ที่ตรงกัน และเปิดเผยผ่านไดรเวอร์ `crabline`

อย่าเพิ่ม root คำสั่ง QA ระดับบนใหม่เมื่อ host `qa-lab` ที่ใช้ร่วมกันสามารถเป็นเจ้าของ flow ได้

`qa-lab` เป็นเจ้าของกลไก host ที่ใช้ร่วมกัน:

- root คำสั่ง `openclaw qa`
- การเริ่มและการ teardown ของ suite
- การทำงานพร้อมกันของ worker
- การเขียน artifact
- การสร้างรายงาน
- การดำเนินสถานการณ์
- alias ความเข้ากันได้สำหรับสถานการณ์ `qa-channel` รุ่นเก่า

Plugin รันเนอร์เป็นเจ้าของสัญญาทรานสปอร์ต:

- วิธี mount `openclaw qa <runner>` ใต้ root `qa` ที่ใช้ร่วมกัน
- วิธีกำหนดค่า gateway สำหรับทรานสปอร์ตนั้น
- วิธีตรวจสอบ readiness
- วิธี inject เหตุการณ์ inbound
- วิธีสังเกตข้อความ outbound
- วิธีเปิดเผย transcript และสถานะทรานสปอร์ตที่ทำให้เป็นมาตรฐานแล้ว
- วิธีดำเนินการกระทำที่มีทรานสปอร์ตหนุนหลัง
- วิธีจัดการ reset หรือ cleanup เฉพาะทรานสปอร์ต

เกณฑ์ขั้นต่ำสำหรับการนำช่องทางใหม่มาใช้:

1. ให้ `qa-lab` เป็นเจ้าของ root `qa` ที่ใช้ร่วมกันต่อไป
2. ใช้งานรันเนอร์ทรานสปอร์ตบนจุดเชื่อมต่อ host `qa-lab` ที่ใช้ร่วมกัน
3. เก็บกลไกเฉพาะทรานสปอร์ตไว้ภายใน Plugin รันเนอร์หรือ harness ของช่องทาง
4. Mount รันเนอร์เป็น `openclaw qa <runner>` แทนการลงทะเบียนคำสั่ง root ที่แข่งขันกัน Plugin รันเนอร์ควรประกาศ `qaRunners` ใน `openclaw.plugin.json` และ export อาร์เรย์ `qaRunnerCliRegistrations` ที่ตรงกันจาก `runtime-api.ts` ทำให้ `runtime-api.ts` เบาไว้; CLI แบบ lazy และการดำเนินรันเนอร์ควรอยู่หลัง entrypoint แยกต่างหาก
5. เขียนหรือปรับสถานการณ์ YAML ใต้ไดเรกทอรี `qa/scenarios/` ที่จัดตามธีม
6. ใช้ตัวช่วยสถานการณ์ทั่วไปสำหรับสถานการณ์ใหม่
7. รักษา alias ความเข้ากันได้ที่มีอยู่ให้ทำงานต่อ เว้นแต่ repo กำลังทำ migration โดยตั้งใจ

กฎการตัดสินเข้มงวด:

- หากพฤติกรรมสามารถแสดงได้ครั้งเดียวใน `qa-lab` ให้ใส่ไว้ใน `qa-lab`
- หากพฤติกรรมขึ้นกับทรานสปอร์ตของช่องทางเดียว ให้เก็บไว้ใน Plugin รันเนอร์นั้นหรือ harness ของ Plugin
- หากสถานการณ์ต้องการความสามารถใหม่ที่มากกว่าหนึ่งช่องทางใช้ได้ ให้เพิ่มตัวช่วยทั่วไปแทน branch เฉพาะช่องทางใน `suite.ts`
- หากพฤติกรรมมีความหมายเฉพาะกับทรานสปอร์ตเดียว ให้คงสถานการณ์เป็นแบบเฉพาะทรานสปอร์ต และระบุให้ชัดเจนในสัญญาสถานการณ์

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

alias ความเข้ากันได้ยังคงพร้อมใช้งานสำหรับสถานการณ์ที่มีอยู่ - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - แต่การเขียนสถานการณ์ใหม่ควรใช้ชื่อทั่วไป alias มีอยู่เพื่อหลีกเลี่ยง migration แบบวันเดียวพร้อมกันทั้งหมด ไม่ใช่เพื่อเป็นโมเดลต่อไปในอนาคต

## การรายงาน

`qa-lab` export รายงานโปรโตคอล Markdown จากไทม์ไลน์ bus ที่สังเกตได้
รายงานควรตอบว่า:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังถูกบล็อกอยู่
- สถานการณ์ติดตามผลใดควรค่าแก่การเพิ่ม

สำหรับ inventory ของสถานการณ์ที่พร้อมใช้งาน - มีประโยชน์เมื่อประเมินขนาดงานติดตามผลหรือ wiring ทรานสปอร์ตใหม่ - ให้รัน `pnpm openclaw qa coverage` (เพิ่ม `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้)
เมื่อเลือกหลักฐานแบบเจาะจงสำหรับพฤติกรรมหรือพาธไฟล์ที่ถูกแตะ ให้รัน `pnpm openclaw qa coverage --match <query>`
รายงาน match จะค้นหา metadata ของสถานการณ์, docs refs, code refs, coverage IDs, Plugin และข้อกำหนดผู้ให้บริการ จากนั้นพิมพ์ target `qa suite --scenario ...` ที่ตรงกัน
การรัน `qa suite` ทุกครั้งจะเขียน artifact ระดับบนสุด `qa-evidence.json`,
`qa-suite-summary.json` และ `qa-suite-report.md` สำหรับชุดสถานการณ์ที่เลือก
สถานการณ์ที่ประกาศ `execution.kind: vitest` หรือ
`execution.kind: playwright` จะรันพาธทดสอบที่ตรงกันและเขียน log ต่อสถานการณ์ด้วย
สถานการณ์ที่ประกาศ `execution.kind: script` จะรัน
evidence producer ที่ `execution.path` ผ่าน `node --import tsx` (โดยขยาย
`${outputDir}` และ `${scenarioId}` ใน `execution.args`); producer จะเขียน
`qa-evidence.json` ของตนเอง ซึ่ง entry ของมันจะถูก import เข้าเอาต์พุต suite
และพาธ artifact ของมันจะถูก resolve โดยอิงจาก `qa-evidence.json` ของ producer นั้น
เมื่อเข้าถึง `qa suite` ผ่าน
`qa run --qa-profile` ไฟล์ `qa-evidence.json` เดียวกันจะรวมสรุป scorecard
ของ profile สำหรับหมวด taxonomy ที่เลือกไว้ด้วย
ให้ถือเป็นเครื่องมือช่วยค้นหา ไม่ใช่สิ่งทดแทนเกต; สถานการณ์ที่เลือกยังคงต้องใช้โหมดผู้ให้บริการ, ทรานสปอร์ต live, Multipass, Testbox หรือเลน release ที่ถูกต้องสำหรับพฤติกรรมภายใต้การทดสอบ
สำหรับบริบท scorecard ดู [Maturity scorecard](/th/maturity/scorecard)

สำหรับการตรวจสอบลักษณะตัวละครและสไตล์ ให้รันสถานการณ์เดียวกันข้าม model ref แบบ live หลายตัว
และเขียนรายงาน Markdown ที่ตัดสินแล้ว:

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

คำสั่งนี้รันโปรเซสลูก QA gateway แบบโลคัล ไม่ใช่ Docker สถานการณ์ character eval
ควรตั้ง persona ผ่าน `SOUL.md` แล้วรัน turn ผู้ใช้ตามปกติ
เช่น แชต ความช่วยเหลือใน workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลผู้สมัครว่า
กำลังถูกประเมิน คำสั่งจะเก็บ transcript เต็มของแต่ละรายการ บันทึกสถิติการรันพื้นฐาน
จากนั้นถาม judge models ในโหมด fast พร้อม reasoning `xhigh` เมื่อรองรับ
เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: prompt ของ judge ยังคงได้รับ
ทุก transcript และสถานะการรัน แต่ candidate refs จะถูกแทนที่ด้วย label เป็นกลาง
เช่น `candidate-01`; รายงานจะ map อันดับกลับไปยัง ref จริงหลังการ parsing
การรันผู้สมัครตั้งค่าเริ่มต้นเป็น thinking `high` โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ eval refs ของ OpenAI รุ่นเก่าที่รองรับ Override ผู้สมัครเฉพาะแบบ inline ด้วย
`--model provider/model,thinking=<level>` `--thinking <level>` ยังคงตั้งค่า
fallback ส่วนกลาง และรูปแบบเดิม `--model-thinking <provider/model=level>` ยังคง
เก็บไว้เพื่อความเข้ากันได้
candidate refs ของ OpenAI ตั้งค่าเริ่มต้นเป็นโหมด fast เพื่อใช้ priority processing
เมื่อผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
ผู้สมัครหรือ judge รายเดียวต้องการ override ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast สำหรับ candidate model ทุกตัว ระยะเวลาของ candidate และ judge
จะถูกบันทึกในรายงานเพื่อการวิเคราะห์ benchmark แต่ judge prompts ระบุชัดเจนว่า
ไม่ให้จัดอันดับตามความเร็ว
การรัน candidate และ judge model ทั้งคู่ตั้งค่าเริ่มต้นเป็น concurrency 16 ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อขีดจำกัดของผู้ให้บริการหรือแรงกดดัน
ต่อ gateway โลคัลทำให้การรันมี noise มากเกินไป
เมื่อไม่มีการส่ง candidate `--model` character eval จะตั้งค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่มีการส่ง `--model`
เมื่อไม่มีการส่ง `--judge-model` judge จะตั้งค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-8,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [QA แบบเมทริกซ์](/th/concepts/qa-matrix)
- [Maturity scorecard](/th/maturity/scorecard)
- [ชุด benchmark agent ส่วนบุคคล](/th/concepts/personal-agent-benchmark-pack)
- [ช่องทาง QA](/th/channels/qa-channel)
- [การทดสอบ](/th/help/testing)
- [แดชบอร์ด](/th/web/dashboard)
