---
read_when:
    - การขยาย qa-lab หรือ qa-channel
    - การเพิ่มสถานการณ์ QA ที่อิงกับรีโป
    - การสร้างระบบอัตโนมัติ QA ที่มีความสมจริงสูงขึ้นรอบแดชบอร์ด Gateway
summary: รูปแบบระบบอัตโนมัติ QA แบบส่วนตัวสำหรับ qa-lab, qa-channel, สถานการณ์ที่ seed ไว้ และรายงานโปรโตคอล
title: ระบบอัตโนมัติ QA E2E
x-i18n:
    generated_at: "2026-04-26T11:28:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

สแตก QA แบบส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงและมีรูปทรงคล้ายช่องมากกว่าที่การทดสอบยูนิตเดี่ยวจะทำได้

องค์ประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องข้อความสังเคราะห์ที่มีพื้นผิวสำหรับ DM, ช่อง, เธรด, รีแอ็กชัน, การแก้ไข และการลบ
- `extensions/qa-lab`: UI สำหรับดีบักและ QA bus สำหรับสังเกตทรานสคริปต์, ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `qa/`: แอสเซ็ต seed ที่อิงกับรีโปสำหรับงาน kickoff และสถานการณ์ QA พื้นฐาน

โฟลว์ของผู้ปฏิบัติงาน QA ปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab แสดงทรานสคริปต์ลักษณะคล้าย Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้จะ build ไซต์ QA, เริ่ม lane ของ gateway ที่รองรับด้วย Docker และเปิดหน้า QA Lab ที่ซึ่งผู้ปฏิบัติงานหรือลูประบบอัตโนมัติสามารถมอบภารกิจ QA ให้เอเจนต์ สังเกตพฤติกรรมจริงของช่อง และบันทึกว่าสิ่งใดทำงาน สิ่งใดล้มเหลว หรือสิ่งใดยังคงติดขัดอยู่

หากต้องการวนรอบพัฒนา UI ของ QA Lab ให้เร็วขึ้นโดยไม่ต้อง rebuild อิมเมจ Docker ทุกครั้ง ให้เริ่มสแตกด้วยบันเดิล QA Lab แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` จะคงบริการ Docker ไว้บนอิมเมจที่ build ไว้ล่วงหน้าและ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` ส่วน `qa:lab:watch`
จะ rebuild บันเดิลนั้นเมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะรีโหลดอัตโนมัติเมื่อแฮชแอสเซ็ตของ QA Lab เปลี่ยน

สำหรับ smoke ของ OpenTelemetry trace ในเครื่อง ให้รัน:

```bash
pnpm qa:otel:smoke
```

สคริปต์นี้จะเริ่มตัวรับ OTLP/HTTP trace ในเครื่อง รันสถานการณ์ QA
`otel-trace-smoke` โดยเปิดใช้ Plugin `diagnostics-otel` จากนั้น
ถอดรหัส protobuf spans ที่ส่งออกและตรวจสอบรูปร่างที่สำคัญต่อ release:
ต้องมี `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` และ `openclaw.message.delivery`;
การเรียกโมเดลต้องไม่ส่งออก `StreamAbandoned` ในเทิร์นที่สำเร็จ; raw diagnostic IDs และ
แอตทริบิวต์ `openclaw.content.*` ต้องไม่อยู่ใน trace มันจะเขียน
`otel-smoke-summary.json` ไว้ข้างอาร์ติแฟกต์ของ QA suite

สำหรับ lane smoke ของ Matrix แบบ transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix
```

lane นี้จะ provision homeserver Tuwunel แบบใช้แล้วทิ้งใน Docker ลงทะเบียนผู้ใช้ชั่วคราวสำหรับ driver, SUT และ observer สร้างห้องส่วนตัวหนึ่งห้อง จากนั้นรัน Plugin Matrix จริงภายใน gateway child ของ QA lane transport จริงจะคง config ของ child ให้มีขอบเขตอยู่กับ transport ที่กำลังทดสอบ ดังนั้น Matrix จึงทำงานได้โดยไม่มี `qa-channel` อยู่ใน config ของ child มันจะเขียนอาร์ติแฟกต์รายงานแบบมีโครงสร้างและ log stdout/stderr แบบรวมไว้ในไดเรกทอรีผลลัพธ์ Matrix QA ที่เลือก หากต้องการเก็บผลลัพธ์ build/launcher ภายนอกจาก `scripts/run-node.mjs` ด้วย ให้ตั้ง `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ไปยังไฟล์ log ภายในรีโป ความคืบหน้าของ Matrix จะถูกพิมพ์ตามค่าเริ่มต้น `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ใช้จำกัดเวลาการรันทั้งหมด และ `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ใช้จำกัดเวลาการ cleanup เพื่อให้การ teardown Docker ที่ค้างอยู่รายงานคำสั่งกู้คืนที่แน่นอนแทนการค้างไปเรื่อย ๆ

สำหรับ lane smoke ของ Telegram แบบ transport จริง ให้รัน:

```bash
pnpm openclaw qa telegram
```

lane นี้กำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มแทนการ provision เซิร์ฟเวอร์แบบใช้แล้วทิ้ง ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` พร้อมบอตสองตัวที่ต่างกันในกลุ่มส่วนตัวเดียวกัน บอต SUT ต้องมีชื่อผู้ใช้ Telegram และการสังเกตแบบบอตต่อบอตจะทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิด Bot-to-Bot Communication Mode ใน `@BotFather`
คำสั่งจะออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อคุณต้องการอาร์ติแฟกต์โดยไม่ให้ออกด้วยโค้ดล้มเหลว
รายงานและสรุปของ Telegram จะมี RTT ต่อคำตอบ โดยนับจากคำขอส่งข้อความของ driver ไปจนถึงคำตอบของ SUT ที่สังเกตได้ โดยเริ่มจาก canary

ก่อนใช้ข้อมูลรับรองแบบสดที่มาจากพูล ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor จะตรวจสอบ env ของ Convex broker ตรวจสอบการตั้งค่า endpoint และยืนยันการเข้าถึงระดับ admin/list เมื่อมี maintainer secret อยู่ มันจะรายงานเพียงสถานะว่ามีการตั้งค่า/ขาดหายของ secrets

สำหรับ lane smoke ของ Discord แบบ transport จริง ให้รัน:

```bash
pnpm openclaw qa discord
```

lane นี้กำหนดเป้าหมายไปยังช่องกิลด์ Discord ส่วนตัวจริงหนึ่งช่องด้วยบอตสองตัว: บอต driver ที่ถูกควบคุมโดย harness และบอต SUT ที่เริ่มโดย gateway child ของ OpenClaw ผ่าน Plugin Discord ที่รวมมาให้ ต้องใช้
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
และ `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` เมื่อใช้ข้อมูลรับรองแบบ env
lane นี้จะตรวจสอบการจัดการ mention ของช่องและตรวจเช็กว่าบอต SUT ได้
ลงทะเบียนคำสั่งเนทีฟ `/help` กับ Discord แล้ว
คำสั่งจะออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการอาร์ติแฟกต์โดยไม่ให้ออกด้วยโค้ดล้มเหลว

ตอนนี้ live transport lanes ใช้สัญญาร่วมขนาดเล็กชุดเดียว แทนที่แต่ละตัวจะสร้างรูปแบบรายการสถานการณ์ของตัวเอง:

`qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบสังเคราะห์ที่ครอบคลุม และไม่ใช่ส่วนหนึ่ง
ของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | การควบคุมด้วย mention | การบล็อกแบบ allowlist | การตอบกลับระดับบนสุด | การกลับมาทำงานหลังรีสตาร์ต | การติดตามต่อในเธรด | การแยกเธรด | การสังเกตรีแอ็กชัน | คำสั่ง help | การลงทะเบียนคำสั่งเนทีฟ |
| -------- | ------ | ---------------------- | --------------------- | --------------------- | --------------------------- | ------------------- | ----------- | ------------------- | ----------- | ------------------------ |
| Matrix   | x      | x                      | x                     | x                     | x                           | x                   | x           | x                   |             |                          |
| Telegram | x      | x                      |                       |                       |                             |                     |             |                     | x           |                          |
| Discord  | x      | x                      |                       |                       |                             |                     |             |                     |             | x                        |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์ที่ครอบคลุม ขณะที่ Matrix,
Telegram และ live transport ในอนาคตใช้เช็กลิสต์สัญญา transport ร่วมกันที่ชัดเจนหนึ่งชุด

สำหรับ lane บน Linux VM แบบใช้แล้วทิ้งโดยไม่นำ Docker เข้ามาอยู่ในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest ใหม่ของ Multipass ติดตั้ง dependencies build OpenClaw
ภายใน guest รัน `qa suite` แล้วคัดลอกรายงานและสรุป QA ปกติกลับไปยัง `.artifacts/qa-e2e/...` บนโฮสต์
มันใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์
การรัน suite ทั้งบนโฮสต์และ Multipass จะรันหลายสถานการณ์ที่เลือกไว้แบบขนานโดยมี gateway workers ที่แยกจากกันตามค่าเริ่มต้น `qa-channel` ใช้ concurrency เริ่มต้นเป็น 4 โดยมีเพดานตามจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker หรือ `--concurrency 1` เพื่อรันแบบลำดับ
คำสั่งจะออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการอาร์ติแฟกต์โดยไม่ให้ออกด้วยโค้ดล้มเหลว
การรันแบบสดจะส่งต่ออินพุตการยืนยันตัวตน QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ
guest: provider keys แบบ env, พาธ config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ ให้เก็บ `--output-dir` ไว้ภายใต้รากรีโป เพื่อให้ guest
สามารถเขียนกลับผ่าน workspace ที่ถูก mount ได้

## seed ที่อิงกับรีโป

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ไฟล์เหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้ทั้งมนุษย์และเอเจนต์มองเห็นแผน QA ได้

`qa-lab` ควรคงความเป็นตัวรัน Markdown แบบทั่วไป ไฟล์ Markdown ของแต่ละสถานการณ์คือแหล่งข้อมูลจริงสำหรับการทดสอบหนึ่งครั้ง และควรกำหนด:

- เมทาดาต้าของสถานการณ์
- เมทาดาต้า category, capability, lane และ risk แบบไม่บังคับ
- docs refs และ code refs
- ข้อกำหนดของ Plugin แบบไม่บังคับ
- gateway config patch แบบไม่บังคับ
- `qa-flow` ที่รันได้

พื้นผิว runtime แบบใช้ซ้ำที่รองรับ `qa-flow` ได้รับอนุญาตให้คงความเป็นทั่วไป
และใช้ข้ามส่วนได้ ตัวอย่างเช่น สถานการณ์แบบ Markdown สามารถรวมตัวช่วยฝั่ง transport
เข้ากับตัวช่วยฝั่งเบราว์เซอร์ที่ขับเคลื่อน Control UI แบบฝังผ่าน seam `browser.request` ของ Gateway ได้ โดยไม่ต้องเพิ่มตัวรันกรณีพิเศษ

ควรจัดกลุ่มไฟล์สถานการณ์ตามความสามารถของผลิตภัณฑ์ ไม่ใช่ตามโฟลเดอร์ของ source tree ให้คง scenario IDs ให้เสถียรเมื่อมีการย้ายไฟล์ และใช้ `docsRefs` กับ `codeRefs` เพื่อการติดตามย้อนกลับไปยัง implementation

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชตแบบ DM และแบบช่อง
- พฤติกรรมของเธรด
- วงจรชีวิตของ message action
- callback ของ Cron
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่องานไปยัง subagent
- การอ่านรีโปและการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## provider mock lanes

`qa suite` มี provider mock lanes ในเครื่องสองแบบ:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ มันยังคงเป็น
  mock lane แบบกำหนดแน่นอนค่าเริ่มต้นสำหรับ QA ที่อิงกับรีโปและ parity gates
- `aimock` จะเริ่มเซิร์ฟเวอร์ผู้ให้บริการที่รองรับด้วย AIMock สำหรับความครอบคลุมด้าน protocol,
  fixture, record/replay และ chaos แบบทดลอง มันเป็นส่วนเสริม และไม่มาแทน
  ตัว dispatch สถานการณ์ `mock-openai`

implementation ของ provider lane อยู่ภายใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตนเอง การเริ่มเซิร์ฟเวอร์ในเครื่อง การกำหนดค่าโมเดลของ Gateway
ความต้องการ staging ของ auth-profile และแฟล็กความสามารถแบบ live/mock
โค้ด suite และ gateway ที่ใช้ร่วมกันควรกำหนดเส้นทางผ่าน registry ของ provider แทนการ branching ตามชื่อ provider

## transport adapters

`qa-lab` เป็นเจ้าของ seam transport แบบทั่วไปสำหรับสถานการณ์ QA แบบ Markdown
`qa-channel` คือ adapter ตัวแรกบน seam นี้ แต่เป้าหมายการออกแบบกว้างกว่านั้น:
ช่องจริงหรือช่องสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกันได้
แทนการเพิ่มตัวรัน QA ที่เฉพาะกับ transport

ในระดับสถาปัตยกรรม การแบ่งส่วนคือ:

- `qa-lab` เป็นเจ้าของการรันสถานการณ์แบบทั่วไป concurrency ของ worker การเขียนอาร์ติแฟกต์ และการรายงาน
- transport adapter เป็นเจ้าของ gateway config, readiness, การสังเกตขาเข้าและขาออก, transport actions และ normalized transport state
- ไฟล์สถานการณ์ Markdown ภายใต้ `qa/scenarios/` เป็นตัวกำหนดการทดสอบ; `qa-lab` ให้พื้นผิว runtime แบบใช้ซ้ำที่ใช้รันมัน

แนวทางการนำไปใช้สำหรับ maintainer สำหรับ channel adapters ใหม่อยู่ใน
[Testing](/th/help/testing#adding-a-channel-to-qa)

## การรายงาน

`qa-lab` จะส่งออกรายงานโปรโตคอลแบบ Markdown จากไทม์ไลน์ bus ที่สังเกตได้
รายงานควรตอบคำถามต่อไปนี้:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังคงติดขัด
- สถานการณ์ติดตามผลใดที่ควรเพิ่ม

สำหรับการตรวจสอบด้านลักษณะนิสัยและสไตล์ ให้รันสถานการณ์เดียวกันกับ model refs แบบสดหลายตัว และเขียนรายงาน Markdown ที่มีการตัดสินผล:

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

คำสั่งนี้รัน child process ของ QA gateway ในเครื่อง ไม่ใช่ Docker สถานการณ์ character eval
ควรกำหนด persona ผ่าน `SOUL.md` จากนั้นรันเทิร์นผู้ใช้ปกติ เช่น แชต, ความช่วยเหลือเกี่ยวกับ workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดลตัวเลือกว่ากำลังถูกประเมินอยู่ คำสั่งนี้จะเก็บทรานสคริปต์ฉบับเต็มของแต่ละรอบ บันทึกสถิติพื้นฐานของการรัน แล้วขอให้โมเดลผู้ตัดสินในโหมด fast พร้อมการให้เหตุผลแบบ `xhigh` เมื่อรองรับ จัดอันดับผลการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน ใช้ `--blind-judge-models` เมื่อต้องการเปรียบเทียบผู้ให้บริการ: พรอมป์ของผู้ตัดสินจะยังได้รับทุกทรานสคริปต์และสถานะการรัน แต่ candidate refs จะถูกแทนที่ด้วยป้ายกำกับกลาง ๆ เช่น `candidate-01`; รายงานจะแมปอันดับกลับไปยัง ref จริงหลังจากแยกวิเคราะห์แล้ว
การรันของ candidate ใช้การคิดแบบ `high` ตามค่าเริ่มต้น โดยใช้ `medium` สำหรับ GPT-5.5 และ `xhigh`
สำหรับ OpenAI eval refs รุ่นเก่าที่รองรับ แทนที่ค่าของ candidate เฉพาะรายแบบอินไลน์ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงใช้ตั้งค่า fallback ส่วนกลาง และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังคงมีไว้เพื่อความเข้ากันได้
candidate refs ของ OpenAI ใช้โหมด fast ตามค่าเริ่มต้น เพื่อให้ใช้การประมวลผลแบบ priority เมื่อผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบอินไลน์เมื่อ candidate หรือผู้ตัดสินเฉพาะรายต้องการการแทนที่ ส่ง `--fast` เฉพาะเมื่อคุณต้องการบังคับเปิดโหมด fast ให้กับโมเดล candidate ทุกตัว ระยะเวลาของ candidate และผู้ตัดสินจะถูกบันทึกในรายงานเพื่อใช้วิเคราะห์ benchmark แต่พรอมป์ของผู้ตัดสินจะระบุชัดว่าไม่ให้จัดอันดับตามความเร็ว
ทั้งการรันของ candidate และผู้ตัดสินใช้ concurrency 16 ตามค่าเริ่มต้น ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัดของผู้ให้บริการหรือแรงกดดันจาก gateway ในเครื่อง
ทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่มีการส่ง candidate `--model` character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่มีการส่ง `--model`
เมื่อไม่มีการส่ง `--judge-model` ผู้ตัดสินจะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.5,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [QA Channel](/th/channels/qa-channel)
- [Dashboard](/th/web/dashboard)
