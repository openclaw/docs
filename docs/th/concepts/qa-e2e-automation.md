---
read_when:
    - การขยาย qa-lab หรือ qa-channel
    - การเพิ่มสถานการณ์ QA ที่อิงกับ repo
    - การสร้างระบบอัตโนมัติ QA ที่สมจริงยิ่งขึ้นรอบแดชบอร์ด Gateway
summary: โครงสร้างระบบอัตโนมัติ QA แบบส่วนตัวสำหรับ qa-lab, qa-channel, สถานการณ์ที่มีการ seed และรายงานโปรโตคอล
title: ระบบอัตโนมัติ QA E2E
x-i18n:
    generated_at: "2026-04-23T10:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# ระบบอัตโนมัติ QA E2E

สแตก QA แบบส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในลักษณะที่สมจริงและมีรูปแบบเหมือน channel
มากกว่าที่ unit test เดี่ยวจะทำได้

องค์ประกอบปัจจุบัน:

- `extensions/qa-channel`: channel ข้อความสังเคราะห์ที่รองรับพื้นผิวของ DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI สำหรับดีบักและ QA bus สำหรับสังเกต transcript,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `qa/`: แอสเซ็ต seed ที่อิงกับ repo สำหรับงาน kickoff และสถานการณ์ QA
  พื้นฐาน

กระบวนการทำงานของผู้ปฏิบัติการ QA ในปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อม agent
- ขวา: QA Lab แสดง transcript แบบคล้าย Slack และแผนของสถานการณ์

รันได้ด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้จะ build ไซต์ QA เริ่ม gateway lane ที่ทำงานบน Docker และเปิดเผย
หน้า QA Lab ที่ผู้ปฏิบัติการหรือ automation loop สามารถมอบภารกิจ QA
ให้ agent สังเกตพฤติกรรมจริงของ channel และบันทึกสิ่งที่ทำงานได้ ล้มเหลว หรือ
ยังคงติดขัด

หากต้องการวนพัฒนา UI ของ QA Lab ให้เร็วขึ้นโดยไม่ต้อง build Docker image ใหม่ทุกครั้ง
ให้เริ่มสแตกด้วย QA Lab bundle แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` จะคง Docker services ไว้บน image ที่ build ไว้ล่วงหน้า และ bind-mount
`extensions/qa-lab/web/dist` เข้าไปในคอนเทนเนอร์ `qa-lab` ส่วน `qa:lab:watch`
จะ rebuild bundle นั้นเมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะรีโหลดอัตโนมัติเมื่อ asset hash ของ QA Lab เปลี่ยน

สำหรับ Matrix smoke lane ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix
```

lane นี้จะจัดเตรียม Tuwunel homeserver แบบใช้ชั่วคราวใน Docker ลงทะเบียน
ผู้ใช้ชั่วคราวสำหรับ driver, SUT และ observer สร้าง private room หนึ่งห้อง จากนั้นรัน
Matrix plugin จริงภายใน QA gateway child lane แบบสดนี้
จะคง child config ให้จำกัดอยู่กับ transport ที่กำลังทดสอบ ดังนั้น Matrix จึงรันได้โดยไม่มี
`qa-channel` ใน child config และจะเขียน structured report artifacts และ
log stdout/stderr ที่รวมกันไว้ในไดเรกทอรีเอาต์พุต Matrix QA ที่เลือกไว้ หากต้องการ
เก็บเอาต์พุต build/launcher ภายนอกของ `scripts/run-node.mjs` ด้วย ให้ตั้ง
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ไปยังไฟล์ log ภายใน repo

สำหรับ Telegram smoke lane ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa telegram
```

lane นี้จะทดสอบกับ private Telegram group จริงหนึ่งกลุ่ม แทนการจัดเตรียมเซิร์ฟเวอร์ชั่วคราว
ต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รวมทั้งบอตสองตัวที่ต่างกันภายใน
private group เดียวกัน SUT bot ต้องมี Telegram username และการสังเกตการณ์แบบ bot-to-bot
จะทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้งาน Bot-to-Bot Communication Mode
ใน `@BotFather`
คำสั่งนี้จะออกด้วย non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code เป็นสถานะล้มเหลว
รายงานและสรุปของ Telegram จะรวม RTT ต่อการตอบกลับ โดยนับจากคำขอส่งข้อความของ driver
ไปจนถึงคำตอบของ SUT ที่สังเกตได้ โดยเริ่มตั้งแต่ canary

ตอนนี้ live transport lanes ใช้ contract ที่เล็กกว่าร่วมกันหนึ่งชุด แทนที่แต่ละตัวจะนิยาม
รูปแบบรายการสถานการณ์ของตัวเอง

`qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบสังเคราะห์ที่ครอบคลุม และไม่ใช่ส่วนหนึ่ง
ของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์ที่ครอบคลุม ขณะที่ Matrix,
Telegram และ live transports ในอนาคต ใช้รายการตรวจสอบ transport-contract แบบชัดเจนชุดเดียวกัน

สำหรับ lane บน Linux VM แบบใช้ชั่วคราวโดยไม่ต้องนำ Docker เข้ามาอยู่ในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest ของ Multipass ใหม่ ติดตั้ง dependencies build OpenClaw
ภายใน guest รัน `qa suite` แล้วคัดลอกรายงาน QA และสรุปตามปกติกลับมายัง
`.artifacts/qa-e2e/...` บนโฮสต์
โดยจะใช้พฤติกรรมการเลือกสถานการณ์แบบเดียวกับ `qa suite` บนโฮสต์
การรันทั้งบนโฮสต์และผ่าน Multipass จะรันหลายสถานการณ์ที่เลือกไว้แบบขนาน
โดยใช้ gateway workers ที่แยกจากกันเป็นค่าเริ่มต้น `qa-channel` ใช้ concurrency เริ่มต้นเป็น
4 โดยถูกจำกัดตามจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับจำนวน worker
หรือ `--concurrency 1` เพื่อรันแบบลำดับ
คำสั่งนี้จะออกด้วย non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code ล้มเหลว
การรันแบบสดจะส่งต่ออินพุต auth ของ QA ที่รองรับและเหมาะสมสำหรับ
guest ได้แก่ provider keys ที่อิง env, พาธ config ของ QA live provider และ
`CODEX_HOME` เมื่อมี ให้เก็บ `--output-dir` ไว้ใต้รากของ repo เพื่อให้ guest
สามารถเขียนกลับผ่าน workspace ที่ถูก mount ได้

## seeds ที่อิงกับ repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

ตั้งใจให้สิ่งเหล่านี้อยู่ใน git เพื่อให้ทั้งมนุษย์และ
agent มองเห็นแผน QA ได้

`qa-lab` ควรคงเป็นตัวรัน markdown แบบทั่วไป แต่ละไฟล์ markdown ของสถานการณ์
เป็นแหล่งข้อมูลจริงสำหรับการทดสอบหนึ่งครั้ง และควรกำหนด:

- เมทาดาทาของสถานการณ์
- เมทาดาทาแบบไม่บังคับสำหรับ category, capability, lane และ risk
- docs refs และ code refs
- ข้อกำหนดของ plugin แบบไม่บังคับ
- gateway config patch แบบไม่บังคับ
- `qa-flow` ที่สามารถรันได้จริง

พื้นผิว runtime ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` ได้รับอนุญาตให้คงความทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์แบบ markdown สามารถผสาน
ตัวช่วยฝั่ง transport กับตัวช่วยฝั่งเบราว์เซอร์ที่ขับเคลื่อน embedded Control UI ผ่าน
seam ของ Gateway `browser.request` ได้ โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์ ไม่ใช่ตามโฟลเดอร์ของ source tree
ให้คง scenario IDs ให้เสถียรเมื่อมีการย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
เพื่อการสืบย้อนการใช้งานไปยัง implementation

รายการพื้นฐานควรคงความกว้างพอที่จะครอบคลุม:

- แชตใน DM และ channel
- พฤติกรรมของ thread
- วงจรชีวิตของ message action
- callbacks ของ Cron
- การเรียกคืนหน่วยความจำ
- การสลับ model
- การส่งต่องานให้ subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build ขนาดเล็กหนึ่งงาน เช่น Lobster Invaders

## lanes ของ mock provider

`qa suite` มี lanes ของ local provider mock สองแบบ:

- `mock-openai` คือ OpenClaw mock ที่รับรู้สถานการณ์ ยังคงเป็น
  mock lane แบบกำหนดแน่นอนค่าเริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gates
- `aimock` จะเริ่มเซิร์ฟเวอร์ provider ที่อิงกับ AIMock สำหรับความครอบคลุมเชิงทดลองด้าน protocol,
  fixture, record/replay และ chaos เป็นส่วนเสริมและไม่ได้มาแทนที่ตัวส่งต่อ
  สถานการณ์ `mock-openai`

implementation ของ provider lane อยู่ภายใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตนเอง การเริ่มเซิร์ฟเวอร์ในเครื่อง gateway model config,
ความต้องการ staging ของ auth-profile และแฟล็กความสามารถแบบ live/mock
suite และโค้ด gateway ที่ใช้ร่วมกันควรกำหนดเส้นทางผ่าน registry ของ provider แทนการแตกแขนงตามชื่อ provider

## adapters ของ transport

`qa-lab` เป็นเจ้าของ seam ของ transport แบบทั่วไปสำหรับสถานการณ์ QA แบบ markdown
`qa-channel` เป็น adapter ตัวแรกบน seam นั้น แต่เป้าหมายของการออกแบบกว้างกว่านั้น:
channels จริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกัน แทนที่จะเพิ่ม
QA runner ที่เฉพาะกับ transport

ในระดับสถาปัตยกรรม การแยกส่วนคือ:

- `qa-lab` เป็นเจ้าของการรันสถานการณ์แบบทั่วไป worker concurrency การเขียน artifacts และการรายงาน
- transport adapter เป็นเจ้าของ gateway config, readiness, การสังเกตการณ์ขาเข้าและขาออก, transport actions และสถานะ transport ที่ผ่านการทำให้เป็นมาตรฐาน
- ไฟล์สถานการณ์แบบ markdown ภายใต้ `qa/scenarios/` เป็นตัวกำหนดการทดสอบ; `qa-lab` จัดให้มีพื้นผิว runtime ที่ใช้ซ้ำได้สำหรับรันไฟล์เหล่านั้น

แนวทางการนำไปใช้สำหรับผู้ดูแลเพื่อเพิ่ม channel adapters ใหม่ อยู่ใน
[Testing](/th/help/testing#adding-a-channel-to-qa)

## การรายงาน

`qa-lab` ส่งออกรายงานโปรโตคอลแบบ Markdown จากไทม์ไลน์ของ bus ที่สังเกตได้
รายงานควรตอบคำถามต่อไปนี้:

- อะไรที่ทำงานได้
- อะไรที่ล้มเหลว
- อะไรที่ยังคงติดขัด
- ควรเพิ่มสถานการณ์ติดตามผลใดบ้าง

สำหรับการตรวจสอบลักษณะและสไตล์ ให้รันสถานการณ์เดียวกันกับ live model refs หลายตัว
และเขียนรายงาน Markdown ที่มีการตัดสิน:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

คำสั่งนี้จะรัน local QA gateway child processes ไม่ใช่ Docker สถานการณ์สำหรับ character eval
ควรกำหนด persona ผ่าน `SOUL.md` แล้วรัน user turns ปกติ
เช่น การแชต การช่วยเหลือใน workspace และงานไฟล์ขนาดเล็ก
ไม่ควรบอก model ผู้สมัครว่ากำลังถูกประเมิน คำสั่งนี้จะเก็บ transcript
ฉบับเต็มของแต่ละรอบ บันทึกสถิติพื้นฐานของการรัน แล้วขอให้ judge models ในโหมด fast พร้อม
reasoning ระดับ `xhigh` จัดอันดับผลการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบ providers: prompt ของ judge จะยังคงได้รับ
ทุก transcript และสถานะการรัน แต่ candidate refs จะถูกแทนที่ด้วยป้ายชื่อกลาง ๆ
เช่น `candidate-01`; รายงานจะจับคู่การจัดอันดับกลับไปยัง refs จริงหลังการ parse
candidate runs ใช้ค่าเริ่มต้นเป็น `high` thinking และใช้ `xhigh` สำหรับ OpenAI models ที่
รองรับ สามารถ override candidate เฉพาะรายได้แบบ inline ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงตั้งค่า
fallback แบบรวมได้ และรูปแบบเก่า `--model-thinking <provider/model=level>` ก็ยังคงไว้
เพื่อความเข้ากันได้
OpenAI candidate refs ใช้โหมด fast เป็นค่าเริ่มต้น เพื่อใช้การประมวลผลแบบมีลำดับความสำคัญเมื่อ
provider รองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อต้องการ override ให้
candidate หรือ judge รายเดียว ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast ให้กับทุก candidate model ระยะเวลาของ candidate และ judge
จะถูกบันทึกไว้ในรายงานเพื่อใช้วิเคราะห์ benchmark แต่ prompt ของ judge ระบุชัดเจนว่า
ห้ามจัดอันดับตามความเร็ว
ทั้ง candidate model และ judge model ใช้ concurrency เริ่มต้นที่ 16
ให้ลด `--concurrency` หรือ `--judge-concurrency` เมื่อลิมิตของ provider หรือแรงกดดัน
บน local gateway ทำให้ผลการรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่มีการส่ง candidate `--model` มา character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview`
เมื่อไม่มีการส่ง `--judge-model` มา judges จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.4,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [QA Channel](/th/channels/qa-channel)
- [Dashboard](/th/web/dashboard)
