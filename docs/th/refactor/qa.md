---
read_when:
    - การรีแฟกเตอร์นิยามสถานการณ์ QA หรือโค้ด harness ของ qa-lab
    - การย้ายพฤติกรรม QA ระหว่างสถานการณ์ใน Markdown และตรรกะ harness ใน TypeScript
summary: แผนรีแฟกเตอร์ QA สำหรับการรวมแค็ตตาล็อกสถานการณ์และการรวมศูนย์ harness
title: รีแฟกเตอร์ QA
x-i18n:
    generated_at: "2026-04-23T10:23:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# รีแฟกเตอร์ QA

สถานะ: การย้ายโครงสร้างพื้นฐานหลักเสร็จแล้ว

## เป้าหมาย

ย้าย QA ของ OpenClaw จากโมเดลนิยามแบบแยกส่วนไปสู่แหล่งข้อมูลจริงเพียงหนึ่งเดียว:

- metadata ของสถานการณ์
- พรอมป์ที่ส่งไปยังโมเดล
- การตั้งค่าและการเก็บกวาด
- ตรรกะของ harness
- assertion และเกณฑ์ความสำเร็จ
- artifact และ hint สำหรับรายงาน

สถานะเป้าหมายที่ต้องการคือ QA harness แบบ generic ที่โหลดไฟล์นิยามสถานการณ์ที่ทรงพลัง แทนการ hardcode พฤติกรรมส่วนใหญ่ไว้ใน TypeScript

## สถานะปัจจุบัน

แหล่งข้อมูลจริงหลักตอนนี้อยู่ใน `qa/scenarios/index.md` พร้อมไฟล์แยกหนึ่งไฟล์ต่อ
สถานการณ์ภายใต้ `qa/scenarios/<theme>/*.md`

ที่ทำแล้ว:

- `qa/scenarios/index.md`
  - metadata มาตรฐานของ QA pack
  - identity ของ operator
  - ภารกิจ kickoff
- `qa/scenarios/<theme>/*.md`
  - หนึ่งไฟล์ Markdown ต่อหนึ่งสถานการณ์
  - metadata ของสถานการณ์
  - การผูกกับ handler
  - คอนฟิกการทำงานเฉพาะสถานการณ์
- `extensions/qa-lab/src/scenario-catalog.ts`
  - ตัวพาร์ส Markdown pack + การตรวจสอบด้วย zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - การเรนเดอร์ plan จาก Markdown pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - สร้างไฟล์เพื่อความเข้ากันได้รวมถึง `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - เลือกสถานการณ์ที่รันได้ผ่านการผูก handler ที่นิยามใน Markdown
- โปรโตคอล QA bus + UI
  - attachment แบบ inline ทั่วไปสำหรับการเรนเดอร์ image/video/audio/file

พื้นผิวที่ยังแยกอยู่:

- `extensions/qa-lab/src/suite.ts`
  - ยังคงเป็นเจ้าของตรรกะ handler แบบกำหนดเองที่รันได้เกือบทั้งหมด
- `extensions/qa-lab/src/report.ts`
  - ยังคง derive โครงสร้างรายงานจากผลลัพธ์ระหว่างรันไทม์

ดังนั้นปัญหาการแยกแหล่งข้อมูลจริงถูกแก้แล้ว แต่การทำงานยังคงพึ่ง handler เป็นหลัก มากกว่าจะเป็น declarative เต็มรูปแบบ

## พื้นผิวของสถานการณ์จริงหน้าตาเป็นอย่างไร

เมื่ออ่าน suite ปัจจุบัน จะเห็นคลาสของสถานการณ์ที่ต่างกันอยู่ไม่กี่แบบ

### การโต้ตอบแบบง่าย

- baseline ของช่องทาง
- baseline ของ DM
- การติดตามผลในเธรด
- การสลับโมเดล
- การทำตาม flow การอนุมัติ
- reaction/edit/delete

### การกลายพันธุ์ของคอนฟิกและรันไทม์

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### assertion เกี่ยวกับระบบไฟล์และรีโป

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### orchestration ของ memory

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### การผสานรวมเครื่องมือและ Plugin

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### หลายเทิร์นและหลายผู้มีส่วนร่วม

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

หมวดหมู่เหล่านี้สำคัญ เพราะเป็นตัวกำหนดความต้องการของ DSL รายการแบบแบนที่มีแค่ prompt + expected text นั้นไม่พอ

## ทิศทาง

### แหล่งข้อมูลจริงเพียงหนึ่งเดียว

ใช้ `qa/scenarios/index.md` พร้อม `qa/scenarios/<theme>/*.md` เป็น
แหล่งข้อมูลจริงที่ใช้เขียน

pack ควรคงคุณสมบัติดังนี้:

- มนุษย์อ่านรีวิวได้ง่าย
- เครื่องพาร์สได้
- สมบูรณ์พอที่จะขับเคลื่อน:
  - การรัน suite
  - QA workspace bootstrap
  - metadata ของ QA Lab UI
  - พรอมป์สำหรับ docs/discovery
  - การสร้างรายงาน

### รูปแบบการเขียนที่แนะนำ

ใช้ Markdown เป็นรูปแบบระดับบนสุด โดยมี YAML แบบมีโครงสร้างอยู่ภายใน

รูปแบบที่แนะนำ:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
  - prerequisites
- ส่วนข้อความบรรยาย
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

สิ่งนี้ให้:

- อ่าน PR ได้ดีกว่า JSON ก้อนใหญ่
- มีบริบทมากกว่า YAML ล้วน
- พาร์สแบบเข้มงวดและตรวจสอบด้วย zod ได้

Raw JSON ยอมรับได้เฉพาะในฐานะรูปแบบกลางที่สร้างขึ้นเท่านั้น

## รูปร่างไฟล์สถานการณ์ที่เสนอ

ตัวอย่าง:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# วัตถุประสงค์

ตรวจสอบว่าสื่อที่สร้างขึ้นถูกแนบกลับมาอีกครั้งในเทิร์นติดตามผล

# การตั้งค่า

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# ขั้นตอน

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# สิ่งที่คาดหวัง

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## ความสามารถของ runner ที่ DSL ต้องครอบคลุม

จาก suite ปัจจุบัน runner แบบ generic ต้องทำได้มากกว่าการรัน prompt

### action สำหรับสภาพแวดล้อมและการตั้งค่า

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### action สำหรับเทิร์นของเอเจนต์

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### action สำหรับคอนฟิกและรันไทม์

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### action สำหรับไฟล์และ artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### action สำหรับ memory และ cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### action สำหรับ MCP

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## ตัวแปรและการอ้างอิง artifact

DSL ต้องรองรับการบันทึกผลลัพธ์แล้วอ้างอิงกลับมาใช้ภายหลัง

ตัวอย่างจาก suite ปัจจุบัน:

- สร้างเธรด แล้วนำ `threadId` กลับมาใช้
- สร้างเซสชัน แล้วนำ `sessionKey` กลับมาใช้
- สร้างรูปภาพ แล้วแนบไฟล์นั้นในเทิร์นถัดไป
- สร้างสตริง wake marker แล้ว assert ว่ามันปรากฏในภายหลัง

ความสามารถที่ต้องมี:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- การอ้างอิงแบบมีชนิดสำหรับ path, session key, thread id, marker, tool output

หากไม่มีการรองรับตัวแปร harness จะยังคงมีตรรกะของสถานการณ์รั่วกลับไปอยู่ใน TypeScript

## อะไรควรคงไว้เป็น escape hatch

runner แบบ declarative บริสุทธิ์ 100% ไม่สมจริงใน phase 1

บางสถานการณ์มีน้ำหนักด้าน orchestration โดยธรรมชาติ:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

ตอนนี้ควรใช้ custom handler แบบ explicit กับกรณีเหล่านี้

กฎที่แนะนำ:

- declarative 85-90%
- ใช้ขั้นตอน `customHandler` แบบ explicit สำหรับส่วนที่ยากที่เหลือ
- custom handler ต้องมีชื่อและมีเอกสารกำกับเท่านั้น
- ไม่มีโค้ด inline แบบไม่ระบุชื่อในไฟล์สถานการณ์

สิ่งนี้ช่วยให้ generic engine สะอาด ขณะเดียวกันยังเดินหน้าต่อได้

## การเปลี่ยนแปลงสถาปัตยกรรม

### ปัจจุบัน

Markdown ของสถานการณ์เป็นแหล่งข้อมูลจริงแล้วสำหรับ:

- การรัน suite
- ไฟล์ bootstrap ของ workspace
- แค็ตตาล็อกสถานการณ์ของ QA Lab UI
- metadata ของรายงาน
- พรอมป์สำหรับ discovery

ความเข้ากันได้ที่สร้างขึ้น:

- workspace ที่ seed แล้วยังคงมี `QA_KICKOFF_TASK.md`
- workspace ที่ seed แล้วยังคงมี `QA_SCENARIO_PLAN.md`
- workspace ที่ seed แล้วตอนนี้มี `QA_SCENARIOS.md` เพิ่มด้วย

## แผนรีแฟกเตอร์

### Phase 1: loader และ schema

เสร็จแล้ว

- เพิ่ม `qa/scenarios/index.md`
- แยกสถานการณ์ไปไว้ใน `qa/scenarios/<theme>/*.md`
- เพิ่มตัวพาร์สสำหรับเนื้อหา markdown YAML pack แบบมีชื่อ
- ตรวจสอบด้วย zod
- เปลี่ยน consumer ให้ใช้ pack ที่พาร์สแล้ว
- ลบ `qa/seed-scenarios.json` และ `qa/QA_KICKOFF_TASK.md` ระดับรีโป

### Phase 2: generic engine

- แยก `extensions/qa-lab/src/suite.ts` ออกเป็น:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- คง helper function ที่มีอยู่เดิมไว้ในฐานะ operation ของ engine

ผลลัพธ์ที่ส่งมอบ:

- engine รันสถานการณ์ declarative แบบง่ายได้

เริ่มจากสถานการณ์ที่ส่วนใหญ่เป็น prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

ผลลัพธ์ที่ส่งมอบ:

- มีสถานการณ์จริงชุดแรกที่นิยามใน Markdown และส่งผ่าน generic engine

### Phase 4: ย้ายสถานการณ์ระดับกลาง

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

ผลลัพธ์ที่ส่งมอบ:

- พิสูจน์แล้วว่า variables, artifacts, tool assertions, request-log assertions ใช้งานได้จริง

### Phase 5: คงสถานการณ์ยากไว้บน custom handlers

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

ผลลัพธ์ที่ส่งมอบ:

- ใช้รูปแบบการเขียนเดียวกัน แต่มีบล็อก custom-step แบบ explicit เมื่อจำเป็น

### Phase 6: ลบแผนที่สถานการณ์แบบ hardcoded

เมื่อ coverage ของ pack ดีพอแล้ว:

- ลบ branching แบบเฉพาะสถานการณ์ใน TypeScript ออกจาก `extensions/qa-lab/src/suite.ts` เป็นส่วนใหญ่

## การรองรับ Fake Slack / Rich Media

QA bus ปัจจุบันเน้นข้อความเป็นหลัก

ไฟล์ที่เกี่ยวข้อง:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

ปัจจุบัน QA bus รองรับ:

- ข้อความ
- reaction
- เธรด

ยังไม่สามารถจำลอง attachment สื่อแบบ inline ได้

### สัญญา transport ที่ต้องมี

เพิ่มโมเดล attachment ของ QA bus แบบทั่วไป:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

จากนั้นเพิ่ม `attachments?: QaBusAttachment[]` ให้กับ:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### ทำไมต้อง generic ก่อน

อย่าสร้างโมเดลสื่อที่เฉพาะ Slack เท่านั้น

ให้ใช้:

- โมเดล transport ของ QA แบบ generic เพียงหนึ่งเดียว
- ตัวเรนเดอร์หลายตัวอยู่ด้านบน
  - แชต QA Lab ปัจจุบัน
  - fake Slack web ในอนาคต
  - มุมมอง transport จำลองอื่น ๆ

สิ่งนี้ป้องกันตรรกะซ้ำซ้อน และทำให้สถานการณ์ด้านสื่อยังคงไม่ผูกกับ transport

### งาน UI ที่ต้องทำ

อัปเดต QA UI ให้เรนเดอร์:

- พรีวิวภาพแบบ inline
- เครื่องเล่นเสียงแบบ inline
- เครื่องเล่นวิดีโอแบบ inline
- ชิปไฟล์แนบ

UI ปัจจุบันเรนเดอร์เธรดและ reaction ได้อยู่แล้ว ดังนั้นการเรนเดอร์ attachment ควรวางซ้อนอยู่บนโมเดล message card เดียวกันได้

### งานด้านสถานการณ์ที่จะทำได้เมื่อมี media transport

เมื่อ attachment ไหลผ่าน QA bus ได้แล้ว เราจะเพิ่มสถานการณ์ fake-chat ที่สมบูรณ์ขึ้นได้:

- การตอบกลับด้วยภาพแบบ inline ใน fake Slack
- ความเข้าใจ attachment แบบเสียง
- ความเข้าใจ attachment แบบวิดีโอ
- ลำดับของ attachment แบบผสม
- การตอบกลับในเธรดโดยคงสื่อไว้

## คำแนะนำ

งานถัดไปที่ควรลงมือทำคือ:

1. เพิ่ม loader ของสถานการณ์ Markdown + zod schema
2. สร้างแค็ตตาล็อกปัจจุบันจาก Markdown
3. ย้ายสถานการณ์ง่าย ๆ ก่อนบางส่วน
4. เพิ่มการรองรับ attachment ใน QA bus แบบ generic
5. เรนเดอร์ภาพแบบ inline ใน QA UI
6. จากนั้นค่อยขยายไปยังเสียงและวิดีโอ

นี่คือเส้นทางที่เล็กที่สุดที่พิสูจน์ทั้งสองเป้าหมาย:

- QA แบบ generic ที่นิยามด้วย Markdown
- พื้นผิวการส่งข้อความจำลองที่สมบูรณ์ขึ้น

## คำถามที่ยังเปิดอยู่

- ควรอนุญาตให้ไฟล์สถานการณ์มีเทมเพลตพรอมป์ Markdown แบบฝังพร้อมการแทนค่าตัวแปรหรือไม่
- การตั้งค่า/การเก็บกวาดควรเป็นส่วนที่มีชื่อ หรือเป็นเพียงรายการ action ตามลำดับ
- การอ้างอิง artifact ควรมีชนิดที่เข้มงวดใน schema หรือใช้แบบสตริง
- custom handler ควรอยู่ใน registry เดียว หรือแยกเป็น registry รายพื้นผิว
- ไฟล์ความเข้ากันได้แบบ JSON ที่สร้างขึ้นควรยังคงถูกเช็กอินไว้ระหว่างการย้ายระบบหรือไม่
