---
read_when:
    - การขยาย qa-lab หรือ qa-channel
    - การเพิ่ม QA scenarios ที่อิงกับ repo
    - การสร้างระบบอัตโนมัติ QA ที่มีความสมจริงสูงขึ้นรอบแดชบอร์ด Gateway
summary: โครงสร้างระบบอัตโนมัติ QA แบบส่วนตัวสำหรับ qa-lab, qa-channel, seeded scenarios และรายงานโปรโตคอล
title: ระบบอัตโนมัติ QA E2E
x-i18n:
    generated_at: "2026-04-25T13:45:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

สแตก QA แบบส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงและมีลักษณะเหมือนช่องทางมากกว่า
ที่ unit test เดี่ยวจะทำได้

องค์ประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิวสำหรับ DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI สำหรับดีบักและ QA bus สำหรับสังเกต transcript,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `qa/`: seed assets ที่อิงกับ repo สำหรับงาน kickoff และ baseline QA
  scenarios

โฟลว์ของผู้ปฏิบัติงาน QA ปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab ซึ่งแสดง transcript แบบคล้าย Slack และแผน scenario

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้จะ build ไซต์ QA เริ่ม lane ของ gateway ที่รองรับด้วย Docker และเปิดหน้า
QA Lab ที่ซึ่งผู้ปฏิบัติงานหรือลูประบบอัตโนมัติสามารถมอบภารกิจ QA ให้เอเจนต์
สังเกตพฤติกรรมจริงของช่องทาง และบันทึกสิ่งที่ใช้งานได้ ล้มเหลว หรือยังคงติดขัด

หากต้องการวนรอบพัฒนา UI ของ QA Lab ได้เร็วขึ้นโดยไม่ต้อง build Docker image ใหม่ทุกครั้ง
ให้เริ่มสแตกด้วย QA Lab bundle ที่ bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` จะคง Docker services ไว้บน image ที่ build ไว้ล่วงหน้า และ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` `qa:lab:watch`
จะ rebuild bundle นั้นเมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะรีโหลดอัตโนมัติเมื่อ asset hash ของ QA Lab เปลี่ยน

สำหรับ Matrix smoke lane แบบ transport-real ให้รัน:

```bash
pnpm openclaw qa matrix
```

lane นี้จะ provision Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker ลงทะเบียน
ผู้ใช้ชั่วคราวสำหรับ driver, SUT และ observer สร้างห้องส่วนตัวหนึ่งห้อง จากนั้นรัน
Plugin Matrix จริงภายใน child QA gateway live transport lane จะคงคอนฟิกของ child
ให้จำกัดอยู่กับ transport ที่กำลังทดสอบ ดังนั้น Matrix จะรันโดยไม่มี
`qa-channel` อยู่ในคอนฟิกของ child lane นี้จะเขียน structured report artifacts และ
ล็อก stdout/stderr ที่รวมกันไว้ในไดเรกทอรีผลลัพธ์ Matrix QA ที่เลือกไว้ หากต้องการ
เก็บเอาต์พุต build/launcher ภายนอกของ `scripts/run-node.mjs` ด้วย ให้ตั้งค่า
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` เป็นไฟล์ล็อกภายใน repo
ความคืบหน้าของ Matrix จะถูกพิมพ์โดยค่าเริ่มต้น `OPENCLAW_QA_MATRIX_TIMEOUT_MS` ใช้จำกัดเวลารันทั้งหมด
และ `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ใช้จำกัดเวลา cleanup เพื่อให้การ teardown Docker ที่ค้างรายงานคำสั่งกู้คืนที่แน่นอนแทนการค้างไม่จบ

สำหรับ Telegram smoke lane แบบ transport-real ให้รัน:

```bash
pnpm openclaw qa telegram
```

lane นี้จะกำหนดเป้าหมายไปยังกลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่มแทนการ provision เซิร์ฟเวอร์แบบใช้แล้วทิ้ง โดยต้องมี
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รวมถึงบอตสองตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน
บอต SUT ต้องมี Telegram username และการสังเกตการณ์แบบ bot-to-bot จะทำงานได้ดีที่สุดเมื่อทั้งสองบอตเปิด Bot-to-Bot Communication Mode
ใน `@BotFather`
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อมี scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
รายงานและสรุปของ Telegram จะมี RTT ต่อคำตอบ โดยวัดจากคำขอส่งข้อความของ driver
ไปจนถึงคำตอบของ SUT ที่ถูกสังเกตเห็น เริ่มตั้งแต่ canary

ก่อนใช้ข้อมูลรับรอง live แบบ pooled ให้รัน:

```bash
pnpm openclaw qa credentials doctor
```

doctor จะตรวจสอบ env ของ Convex broker, ตรวจสอบการตั้งค่า endpoint และยืนยันการเข้าถึงแบบ admin/list เมื่อมี maintainer secret อยู่
โดยจะรายงานเฉพาะสถานะ set/missing สำหรับ secrets

สำหรับ Discord smoke lane แบบ transport-real ให้รัน:

```bash
pnpm openclaw qa discord
```

lane นี้จะกำหนดเป้าหมายไปยัง guild channel ส่วนตัวจริงหนึ่งช่องของ Discord พร้อมบอตสองตัว: บอต driver ที่ harness ควบคุม และบอต SUT ที่เริ่มโดย child
OpenClaw gateway ผ่าน Plugin Discord ที่มาพร้อมระบบ โดยต้องใช้
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
และ `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` เมื่อใช้ข้อมูลรับรองจาก env
lane นี้จะตรวจสอบการจัดการ channel mention และตรวจสอบว่าบอต SUT
ได้ลงทะเบียนคำสั่ง `/help` แบบเนทีฟกับ Discord แล้ว
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อมี scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว

ตอนนี้ live transport lanes ใช้ contract ชุดเล็กชุดเดียวร่วมกันแทนการที่แต่ละตัวสร้าง
รูปแบบรายการ scenario ของตัวเองขึ้นมา:

`qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบสังเคราะห์ที่ครอบคลุม และไม่ใช่ส่วนหนึ่ง
ของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์ที่ครอบคลุม ในขณะที่
Matrix, Telegram และ live transports ในอนาคตใช้รายการตรวจสอบ transport-contract ที่ชัดเจนชุดเดียวกัน

สำหรับ lane ของ Linux VM แบบใช้แล้วทิ้งโดยไม่ต้องนำ Docker เข้ามาในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest Multipass ใหม่ ติดตั้ง dependencies build OpenClaw ภายใน guest รัน `qa suite` แล้วคัดลอกรายงาน QA และสรุปตามปกติกลับมายัง `.artifacts/qa-e2e/...` บนโฮสต์
โดยใช้พฤติกรรมการเลือก scenario แบบเดียวกับ `qa suite` บนโฮสต์
การรัน suite บนโฮสต์และบน Multipass จะรันหลาย scenarios ที่เลือกไว้แบบขนานพร้อม gateway workers ที่แยกจากกันโดยค่าเริ่มต้น `qa-channel` ใช้ concurrency เริ่มต้นที่ 4 โดยถูกจำกัดด้วยจำนวน scenario ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับจำนวน workers หรือ `--concurrency 1` สำหรับการรันแบบอนุกรม
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อมี scenario ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
การรันแบบ live จะส่งต่อ QA auth inputs ที่รองรับและใช้งานได้จริงสำหรับ
guest: provider keys จาก env, พาธคอนฟิก provider live QA และ
`CODEX_HOME` เมื่อมีอยู่ ให้คง `--output-dir` ไว้ใต้ root ของ repo เพื่อให้ guest
สามารถเขียนกลับผ่าน workspace ที่ mount ไว้ได้

## Repo-backed seeds

seed assets อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้ทั้งมนุษย์และ
เอเจนต์มองเห็นแผน QA ได้

`qa-lab` ควรคงเป็น markdown runner แบบทั่วไป ไฟล์ markdown ของแต่ละ scenario
คือแหล่งข้อมูลจริงสำหรับการทดสอบหนึ่งครั้ง และควรกำหนด:

- ข้อมูลเมตาของ scenario
- ข้อมูลเมตา category, capability, lane และ risk แบบทางเลือก
- refs ของ docs และโค้ด
- ความต้องการของ Plugin แบบทางเลือก
- gateway config patch แบบทางเลือก
- `qa-flow` ที่สามารถรันได้

พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` ได้รับอนุญาตให้คงความเป็นทั่วไป
และใช้ข้ามส่วนต่างๆ ได้ ตัวอย่างเช่น markdown scenarios สามารถรวม
helpers ฝั่ง transport กับ helpers ฝั่งเบราว์เซอร์ที่ขับเคลื่อน Control UI แบบฝังตัวผ่าน
seam `browser.request` ของ Gateway โดยไม่ต้องเพิ่ม runner เฉพาะกรณี

ไฟล์ scenario ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์แทนโฟลเดอร์ของ source tree
ให้คง scenario IDs ให้เสถียรเมื่อย้ายไฟล์ ใช้ `docsRefs` และ `codeRefs`
เพื่อการติดตามย้อนกลับไปยัง implementation

รายการ baseline ควรกว้างพอที่จะครอบคลุม:

- แชต DM และ channel
- พฤติกรรมของ thread
- วงจรชีวิตของ action บนข้อความ
- Cron callbacks
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่องานไปยัง subagent
- การอ่าน repo และการอ่าน docs
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## Provider mock lanes

`qa suite` มี provider mock lanes ภายในเครื่องสองแบบ:

- `mock-openai` คือ OpenClaw mock ที่รับรู้ scenario โดยยังคงเป็น
  mock lane แบบ deterministic เริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gates
- `aimock` จะเริ่มเซิร์ฟเวอร์ provider ที่รองรับด้วย AIMock สำหรับการครอบคลุมแบบทดลองด้าน protocol,
  fixture, record/replay และ chaos โดยเป็นส่วนเสริมและไม่ได้แทนที่ตัวกระจาย scenario ของ `mock-openai`

implementation ของ provider-lane อยู่ภายใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตัวเอง การเริ่มเซิร์ฟเวอร์ภายในเครื่อง
gateway model config ความต้องการในการจัดเตรียม auth-profile และแฟล็กความสามารถแบบ live/mock
โค้ดของ suite และ gateway ที่ใช้ร่วมกันควรกำหนดเส้นทางผ่าน provider registry
แทนการแตกกิ่งตามชื่อ provider

## Transport adapters

`qa-lab` เป็นเจ้าของ seam transport แบบทั่วไปสำหรับ markdown QA scenarios
`qa-channel` คือ adapter ตัวแรกบน seam นี้ แต่เป้าหมายของการออกแบบกว้างกว่านั้น:
channels ในอนาคตที่เป็นจริงหรือสังเคราะห์ควรเสียบเข้ากับ suite runner เดียวกัน
แทนการเพิ่ม QA runner ที่เฉพาะกับ transport

ในระดับสถาปัตยกรรม การแยกส่วนคือ:

- `qa-lab` เป็นเจ้าของการรัน scenario แบบทั่วไป, worker concurrency, การเขียน artifacts และการรายงาน
- transport adapter เป็นเจ้าของ gateway config, readiness, การสังเกตขาเข้าและขาออก, transport actions และ normalized transport state
- ไฟล์ markdown scenario ภายใต้ `qa/scenarios/` เป็นตัวกำหนดการทดสอบ; `qa-lab` จัดเตรียมพื้นผิวรันไทม์ที่ใช้ซ้ำได้เพื่อรันสิ่งเหล่านั้น

คำแนะนำการนำไปใช้สำหรับผู้ดูแลระบบเกี่ยวกับ channel adapters ใหม่อยู่ใน
[Testing](/th/help/testing#adding-a-channel-to-qa)

## การรายงาน

`qa-lab` ส่งออกรายงานโปรโตคอลแบบ Markdown จาก timeline ของ bus ที่สังเกตเห็น
รายงานควรตอบคำถามเหล่านี้:

- อะไรที่ใช้งานได้
- อะไรที่ล้มเหลว
- อะไรที่ยังคงติดขัด
- ควรเพิ่ม follow-up scenarios ใดบ้าง

สำหรับการตรวจสอบลักษณะและสไตล์ ให้รัน scenario เดียวกันกับ live model
refs หลายตัวและเขียนรายงาน Markdown ที่มีการตัดสินผล:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

คำสั่งนี้รัน child processes ของ QA gateway ภายในเครื่อง ไม่ใช่ Docker Character eval
scenarios ควรกำหนด persona ผ่าน `SOUL.md` จากนั้นจึงรัน ordinary user turns
เช่น การแชต การช่วยเหลือเกี่ยวกับ workspace และงานไฟล์ขนาดเล็ก โมเดลผู้สมัคร
ไม่ควรถูกบอกว่ากำลังถูกประเมิน คำสั่งนี้จะเก็บ transcript เต็มของแต่ละรายการไว้
บันทึกสถิติพื้นฐานของการรัน จากนั้นจึงให้ judge models ใน fast mode พร้อม
การใช้เหตุผลแบบ `xhigh` เมื่อรองรับ เพื่อจัดอันดับการรันตามความเป็นธรรมชาติ vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: prompt ของผู้ตัดสินยังคงได้รับ
ทุก transcript และสถานะการรัน แต่ candidate refs จะถูกแทนที่ด้วยป้ายชื่อกลางๆ
เช่น `candidate-01`; รายงานจะจับคู่อันดับกลับไปยัง refs จริงหลังการแยกวิเคราะห์

การรันของผู้สมัครใช้ `high` thinking เป็นค่าเริ่มต้น โดยใช้ `medium` สำหรับ GPT-5.4 และ `xhigh`
สำหรับ OpenAI eval refs รุ่นเก่าที่รองรับ สามารถ override ผู้สมัครรายตัวแบบ inline ได้ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงใช้ตั้งค่า fallback แบบ global และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังคงไว้เพื่อความเข้ากันได้ย้อนหลัง

OpenAI candidate refs ใช้ fast mode เป็นค่าเริ่มต้น เพื่อให้ใช้การประมวลผลแบบ priority เมื่อ
ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อ
ผู้สมัครหรือผู้ตัดสินรายใดรายหนึ่งต้องการ override ส่ง `--fast` ก็ต่อเมื่อคุณต้องการ
บังคับเปิด fast mode ให้กับทุก candidate model ระยะเวลาของ candidate และ judge
จะถูกบันทึกไว้ในรายงานเพื่อใช้วิเคราะห์ benchmark แต่ prompt ของ judge ระบุไว้อย่างชัดเจนว่า
ไม่ให้จัดอันดับตามความเร็ว

ทั้งการรัน candidate และ judge model ใช้ concurrency 16 เป็นค่าเริ่มต้น ลด
`--concurrency` หรือ `--judge-concurrency` เมื่อข้อจำกัดของผู้ให้บริการหรือแรงกดดันจาก gateway ภายในเครื่อง
ทำให้การรันมีสัญญาณรบกวนมากเกินไป

เมื่อไม่มีการส่ง candidate `--model` มา character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่มีการส่ง `--model` มา

เมื่อไม่มีการส่ง `--judge-model` มา judges จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.4,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [QA Channel](/th/channels/qa-channel)
- [Dashboard](/th/web/dashboard)
