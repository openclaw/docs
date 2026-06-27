---
read_when:
    - คุณกำลังเชื่อมพฤติกรรมวงจรชีวิตของ context-engine เข้ากับฮาร์เนสของ Codex
    - คุณต้องใช้ lossless-claw หรือ Plugin เอนจินบริบทอื่นเพื่อทำงานกับเซสชัน harness แบบฝังของ codex/*
    - คุณกำลังเปรียบเทียบพฤติกรรมบริบทของแอปเซิร์ฟเวอร์ OpenClaw และ Codex แบบฝังตัว
summary: ข้อกำหนดสำหรับทำให้ฮาร์เนส app-server ของ Codex ที่บันเดิลมารองรับ Plugin context-engine ของ OpenClaw
title: พอร์ตเครื่องยนต์บริบทของ Codex Harness
x-i18n:
    generated_at: "2026-06-27T17:47:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## สถานะ

ข้อกำหนดการใช้งานฉบับร่าง

## เป้าหมาย

ทำให้ฮาร์เนส Codex app-server ที่บันเดิลมาด้วยปฏิบัติตามสัญญาวงจรชีวิต
context-engine เดียวกับที่เทิร์น OpenClaw แบบฝังตัวปฏิบัติตามอยู่แล้ว

เซสชันที่ใช้ provider/model `agentRuntime.id: "codex"` หรือโมเดล `codex/*`
ควรยังคงให้ Plugin context-engine ที่เลือกไว้ เช่น
`lossless-claw` ควบคุมการประกอบบริบท การนำเข้าหลังเทิร์น การบำรุงรักษา และ
นโยบาย Compaction ระดับ OpenClaw ได้เท่าที่ขอบเขต Codex app-server อนุญาต

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่ต้องนำ internals ของ Codex app-server มาใช้งานใหม่
- ไม่ต้องทำให้ Compaction เธรดแบบเนทีฟของ Codex สร้างสรุปแบบ lossless-claw
- ไม่ต้องบังคับให้โมเดลที่ไม่ใช่ Codex ใช้ฮาร์เนส Codex
- ไม่ต้องเปลี่ยนพฤติกรรมเซสชัน ACP/acpx ข้อกำหนดนี้มีไว้สำหรับเส้นทาง
  ฮาร์เนสเอเจนต์แบบฝังตัวที่ไม่ใช่ ACP เท่านั้น
- ไม่ต้องให้ Plugin จากบุคคลที่สามลงทะเบียน factory ส่วนขยาย Codex app-server;
  ขอบเขตความเชื่อถือของ bundled-plugin ที่มีอยู่ยังคงไม่เปลี่ยนแปลง

## สถาปัตยกรรมปัจจุบัน

ลูปรันแบบฝังตัวจะแก้ไขเอนจินบริบทที่กำหนดค่าไว้หนึ่งครั้งต่อการรันก่อน
เลือกฮาร์เนสระดับต่ำที่เป็นรูปธรรม:

- `src/agents/embedded-agent-runner/run.ts`
  - เริ่มต้น Plugin context-engine
  - เรียก `resolveContextEngine(params.config)`
  - ส่ง `contextEngine` และ `contextTokenBudget` เข้าไปใน
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` มอบหมายต่อให้ฮาร์เนสเอเจนต์ที่เลือก:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

ฮาร์เนส Codex app-server ลงทะเบียนโดย Plugin Codex ที่บันเดิลมาด้วย:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

การใช้งานฮาร์เนส Codex ได้รับ `EmbeddedRunAttemptParams` เดียวกับ
attempt OpenClaw ในตัว:

- `extensions/codex/src/app-server/run-attempt.ts`

นั่นหมายความว่าจุด hook ที่ต้องการอยู่ในโค้ดที่ OpenClaw ควบคุม ขอบเขตภายนอก
คือโปรโตคอล Codex app-server เอง: OpenClaw ควบคุมสิ่งที่ส่งไปยัง
`thread/start`, `thread/resume` และ `turn/start` ได้ และสังเกตการณ์
notifications ได้ แต่ไม่สามารถเปลี่ยนแปลง store เธรดภายในหรือ compactor
แบบเนทีฟของ Codex ได้

## ช่องว่างปัจจุบัน

attempt OpenClaw ในตัวเรียกวงจรชีวิต context-engine โดยตรง:

- bootstrap/maintenance ก่อน attempt
- assemble ก่อนการเรียกโมเดล
- afterTurn หรือ ingest หลัง attempt
- maintenance หลังเทิร์นที่สำเร็จ
- Compaction ของ context-engine สำหรับเอนจินที่เป็นเจ้าของ Compaction

โค้ด OpenClaw ที่เกี่ยวข้อง:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

attempt Codex app-server ปัจจุบันรัน hook ฮาร์เนสเอเจนต์ทั่วไปและ mirror
ทรานสคริปต์ แต่ไม่เรียก `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` หรือ
`params.contextEngine.maintain`

โค้ด Codex ที่เกี่ยวข้อง:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## พฤติกรรมที่ต้องการ

สำหรับเทิร์นฮาร์เนส Codex, OpenClaw ควรรักษาวงจรชีวิตนี้ไว้:

1. อ่านทรานสคริปต์เซสชัน OpenClaw ที่ mirror ไว้
2. Bootstrap เอนจินบริบทที่ใช้งานอยู่เมื่อมีไฟล์เซสชันก่อนหน้า
3. รัน bootstrap maintenance เมื่อพร้อมใช้งาน
4. ประกอบบริบทโดยใช้เอนจินบริบทที่ใช้งานอยู่
5. แปลงบริบทที่ประกอบแล้วให้เป็นอินพุตที่เข้ากันได้กับ Codex
6. เริ่มหรือ resume เธรด Codex ด้วยคำสั่งสำหรับนักพัฒนาที่รวม
   `systemPromptAddition` ของ context-engine ถ้ามี
7. เริ่มเทิร์น Codex ด้วยพรอมป์ที่ผู้ใช้เห็นซึ่งประกอบแล้ว
8. Mirror ผลลัพธ์ Codex กลับเข้าไปในทรานสคริปต์ OpenClaw
9. เรียก `afterTurn` หากมีการใช้งาน มิฉะนั้นใช้ `ingestBatch`/`ingest` โดยใช้
   snapshot ทรานสคริปต์ที่ mirror ไว้
10. รัน maintenance ของเทิร์นหลังเทิร์นที่สำเร็จและไม่ถูกยกเลิก
11. รักษาสัญญาณ Compaction แบบเนทีฟของ Codex และ hook Compaction ของ OpenClaw

## ข้อจำกัดด้านการออกแบบ

### Codex app-server ยังคงเป็น canonical สำหรับสถานะเธรดแบบเนทีฟ

Codex เป็นเจ้าของเธรดแบบเนทีฟและประวัติแบบขยายภายในใดๆ OpenClaw ไม่ควรพยายาม
แก้ไขประวัติภายในของ app-server ยกเว้นผ่านการเรียกโปรโตคอลที่รองรับ

ทรานสคริปต์ mirror ของ OpenClaw ยังคงเป็นแหล่งที่มาสำหรับฟีเจอร์ OpenClaw:

- ประวัติแชต
- การค้นหา
- งานบันทึกบัญชีของ `/new` และ `/reset`
- การสลับโมเดลหรือฮาร์เนสในอนาคต
- สถานะ Plugin context-engine

### การประกอบของเอนจินบริบทต้องถูก project เข้าไปในอินพุต Codex

อินเทอร์เฟซ context-engine คืนค่า OpenClaw `AgentMessage[]` ไม่ใช่ patch เธรด
Codex `turn/start` ของ Codex app-server รับอินพุตผู้ใช้ปัจจุบัน ในขณะที่
`thread/start` และ `thread/resume` รับคำสั่งสำหรับนักพัฒนา

ดังนั้นการใช้งานจึงต้องมีเลเยอร์ projection เวอร์ชันแรกที่ปลอดภัยควรหลีกเลี่ยง
การทำเหมือนว่าสามารถแทนที่ประวัติภายในของ Codex ได้ ควร inject บริบทที่ประกอบแล้ว
เป็นเนื้อหาพรอมป์/คำสั่งสำหรับนักพัฒนาแบบกำหนดแน่นอนรอบเทิร์นปัจจุบัน

### ความเสถียรของ prompt-cache สำคัญ

สำหรับเอนจินอย่าง lossless-claw บริบทที่ประกอบแล้วควร deterministic สำหรับ
อินพุตที่ไม่เปลี่ยนแปลง อย่าเพิ่ม timestamp, id แบบสุ่ม หรือการจัดลำดับที่
ไม่ deterministic ลงในข้อความบริบทที่สร้างขึ้น

### ความหมายของการเลือก runtime ไม่เปลี่ยนแปลง

การเลือกฮาร์เนสยังคงเหมือนเดิม:

- `runtime: "openclaw"` เลือกฮาร์เนส OpenClaw ในตัว
- `runtime: "codex"` เลือกฮาร์เนส Codex ที่ลงทะเบียนไว้
- `runtime: "auto"` ให้ฮาร์เนส Plugin อ้างสิทธิ์ provider ที่รองรับ
- การรัน `auto` ที่ไม่ match ใช้ฮาร์เนส OpenClaw ในตัว

งานนี้เปลี่ยนสิ่งที่เกิดขึ้นหลังจากเลือกฮาร์เนส Codex แล้ว

## แผนการใช้งาน

### 1. Export หรือย้าย helper attempt ของ context-engine ที่ใช้ซ้ำได้

วันนี้ helper วงจรชีวิตที่ใช้ซ้ำได้อยู่ใต้ embedded agent runner:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex ควร import helper ที่เป็นกลางต่อฮาร์เนสแทนที่จะเอื้อมเข้าไปในรายละเอียดการใช้งานของ runner

สร้างโมดูลที่เป็นกลางต่อฮาร์เนส เช่น:

- `src/agents/harness/context-engine-lifecycle.ts`

ย้ายหรือ re-export:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper ขนาดเล็กรอบ `runContextEngineMaintenance`

อัปเดต call site ของฮาร์เนสในตัวใน PR เดียวกัน

ชื่อ helper ที่เป็นกลางไม่ควรกล่าวถึงฮาร์เนสในตัว

ชื่อที่แนะนำ:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. เพิ่ม helper projection บริบทของ Codex

เพิ่มโมดูลใหม่:

- `extensions/codex/src/app-server/context-engine-projection.ts`

ความรับผิดชอบ:

- รับ `AgentMessage[]` ที่ประกอบแล้ว ประวัติที่ mirror เดิม และพรอมป์ปัจจุบัน
- ตัดสินใจว่าบริบทใดควรอยู่ในคำสั่งสำหรับนักพัฒนาเทียบกับอินพุตผู้ใช้ปัจจุบัน
- รักษาพรอมป์ผู้ใช้ปัจจุบันให้เป็นคำขอที่ actionable ขั้นสุดท้าย
- Render ข้อความก่อนหน้าในรูปแบบที่เสถียรและชัดเจน
- หลีกเลี่ยง metadata ที่ผันผวน

API ที่เสนอ:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

projection แรกที่แนะนำ:

- ใส่ `systemPromptAddition` เข้าไปในคำสั่งสำหรับนักพัฒนา
- ใส่บริบททรานสคริปต์ที่ประกอบแล้วไว้ก่อนพรอมป์ปัจจุบันใน `promptText`
- ติดป้ายชัดเจนว่าเป็นบริบทที่ OpenClaw ประกอบไว้
- เก็บพรอมป์ปัจจุบันไว้ท้ายสุด
- ตัดพรอมป์ผู้ใช้ปัจจุบันที่ซ้ำออก หากปรากฏอยู่ที่ส่วนท้ายแล้ว

รูปร่างพรอมป์ตัวอย่าง:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

วิธีนี้สง่างามน้อยกว่าการผ่าตัดประวัติ Codex แบบเนทีฟ แต่ใช้งานได้ภายใน OpenClaw
และรักษาความหมายของ context-engine

การปรับปรุงในอนาคต: หาก Codex app-server เปิดเผยโปรโตคอลสำหรับแทนที่หรือ
เสริมประวัติเธรด ให้สลับเลเยอร์ projection นี้ไปใช้ API นั้น

### 3. Wire bootstrap ก่อน startup เธรด Codex

ใน `extensions/codex/src/app-server/run-attempt.ts`:

- อ่านประวัติเซสชันที่ mirror ไว้ตามปัจจุบัน
- ระบุว่าไฟล์เซสชันมีอยู่ก่อนการรันนี้หรือไม่ ควรใช้ helper ที่ตรวจ
  `fs.stat(params.sessionFile)` ก่อนการเขียน mirror
- เปิด `SessionManager` หรือใช้ adapter session manager แบบแคบหาก helper ต้องการ
- เรียก helper bootstrap ที่เป็นกลางเมื่อมี `params.contextEngine`

Pseudo-flow:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

ใช้ convention `sessionKey` เดียวกับ tool bridge ของ Codex และ transcript mirror
ปัจจุบัน Codex คำนวณ `sandboxSessionKey` จาก `params.sessionKey` หรือ
`params.sessionId`; ใช้ค่านั้นอย่างสอดคล้อง เว้นแต่มีเหตุผลให้รักษา
`params.sessionKey` ดิบไว้

### 4. Wire assemble ก่อน `thread/start` / `thread/resume` และ `turn/start`

ใน `runCodexAppServerAttempt`:

1. สร้าง dynamic tools ก่อน เพื่อให้เอนจินบริบทเห็นชื่อเครื่องมือที่พร้อมใช้จริง
2. อ่านประวัติเซสชันที่ mirror ไว้
3. รัน `assemble(...)` ของ context-engine เมื่อมี `params.contextEngine`
4. Project ผลลัพธ์ที่ประกอบแล้วเป็น:
   - ส่วนเพิ่มคำสั่งสำหรับนักพัฒนา
   - ข้อความพรอมป์สำหรับ `turn/start`

การเรียก hook ที่มีอยู่:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

ควรกลายเป็นแบบรู้บริบท:

1. คำนวณคำสั่งสำหรับนักพัฒนาฐานด้วย `buildDeveloperInstructions(params)`
2. apply การประกอบ/projection ของ context-engine
3. รัน `before_prompt_build` ด้วยพรอมป์/คำสั่งสำหรับนักพัฒนาที่ project แล้ว

ลำดับนี้ทำให้ hook พรอมป์ทั่วไปเห็นพรอมป์เดียวกับที่ Codex จะได้รับ หากเราต้องการ
ความเท่าเทียมกับ OpenClaw อย่างเข้มงวด ให้รันการประกอบ context-engine ก่อน
การประกอบ hook เพราะฮาร์เนสในตัว apply `systemPromptAddition` ของ context-engine
กับ system prompt ขั้นสุดท้ายหลัง pipeline พรอมป์ของมัน invariant สำคัญคือ
ทั้ง context engine และ hook ได้ลำดับที่ deterministic และจัดทำเอกสารไว้

ลำดับที่แนะนำสำหรับการใช้งานครั้งแรก:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. append/prepend `systemPromptAddition` เข้าไปในคำสั่งสำหรับนักพัฒนา
4. project ข้อความที่ประกอบแล้วเข้าไปในข้อความพรอมป์
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. ส่งคำสั่งสำหรับนักพัฒนาขั้นสุดท้ายไปยัง `startOrResumeThread(...)`
7. ส่งข้อความพรอมป์ขั้นสุดท้ายไปยัง `buildTurnStartParams(...)`

ควร encode spec นี้ไว้ใน tests เพื่อไม่ให้การเปลี่ยนแปลงในอนาคต reorder โดยไม่ตั้งใจ

### 5. รักษาการจัดรูปแบบที่เสถียรสำหรับ prompt-cache

helper projection ต้องสร้างเอาต์พุตที่ byte-stable สำหรับอินพุตเดียวกัน:

- ลำดับข้อความที่เสถียร
- ป้าย role ที่เสถียร
- ไม่มี timestamp ที่สร้างขึ้น
- ไม่มีการรั่วไหลของลำดับ key ของ object
- ไม่มี delimiter แบบสุ่ม
- ไม่มี id ต่อการรัน

ใช้ delimiter คงที่และ section ที่ชัดเจน

### 6. Wire post-turn หลัง transcript mirroring

`CodexAppServerEventProjector` ของ Codex สร้าง `messagesSnapshot` ภายในเครื่องสำหรับ
รอบปัจจุบัน `mirrorTranscriptBestEffort(...)` เขียนสแนปชอตนั้นไปยังมิเรอร์ทรานสคริปต์ของ
OpenClaw

หลังจากมิเรอร์สำเร็จหรือล้มเหลว ให้เรียก finalizer ของ context-engine ด้วย
สแนปชอตข้อความที่ดีที่สุดที่มีอยู่:

- ควรใช้บริบทเซสชันที่มิเรอร์แล้วแบบเต็มหลังการเขียน เพราะ `afterTurn`
  คาดหวังสแนปชอตของเซสชัน ไม่ใช่เฉพาะรอบปัจจุบัน
- ย้อนกลับไปใช้ `historyMessages + result.messagesSnapshot` หากไม่สามารถ
  เปิดไฟล์เซสชันซ้ำได้

โฟลว์จำลอง:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

หากการมิเรอร์ล้มเหลว ยังคงเรียก `afterTurn` ด้วยสแนปชอตสำรอง แต่ให้บันทึกว่า
context engine กำลังนำเข้าจากข้อมูลรอบสำรอง

### 7. ทำให้ usage และบริบทรันไทม์ของ prompt-cache เป็นมาตรฐาน

ผลลัพธ์ของ Codex รวม usage ที่ทำให้เป็นมาตรฐานจากการแจ้งเตือนโทเค็นของ app-server เมื่อ
มีข้อมูล ส่ง usage นั้นเข้าไปในบริบทรันไทม์ของ context-engine

หากในอนาคต Codex app-server เปิดเผยรายละเอียดการอ่าน/เขียนแคช ให้แมปข้อมูลเหล่านั้นเข้า
`ContextEnginePromptCacheInfo` ก่อนถึงตอนนั้น ให้ละ `promptCache` แทนที่จะ
สร้างค่าศูนย์ขึ้นมาเอง

### 8. นโยบาย Compaction

มีระบบ Compaction อยู่สองระบบ:

1. context-engine `compact()` ของ OpenClaw
2. `thread/compact/start` เนทีฟของ Codex app-server

อย่ารวมสองระบบนี้เข้าด้วยกันโดยเงียบๆ

#### `/compact` และ Compaction ของ OpenClaw แบบชัดเจน

เมื่อ context engine ที่เลือกมี `info.ownsCompaction === true` การทำ Compaction ของ
OpenClaw แบบชัดเจนควรให้ความสำคัญกับผลลัพธ์ `compact()` ของ context engine สำหรับ
มิเรอร์ทรานสคริปต์ของ OpenClaw และสถานะของ Plugin

เมื่อ Codex harness ที่เลือกมี binding ของเธรดเนทีฟ เราอาจร้องขอ Compaction เนทีฟของ
Codex เพิ่มเติมเพื่อให้เธรด app-server ยังทำงานได้ดี แต่ต้องรายงานเป็นการกระทำของ
แบ็กเอนด์แยกต่างหากในรายละเอียด

พฤติกรรมที่แนะนำ:

- หาก `contextEngine.info.ownsCompaction === true`:
  - เรียก `compact()` ของ context-engine ก่อน
  - จากนั้นเรียก Compaction เนทีฟของ Codex แบบ best-effort เมื่อมี binding ของเธรด
  - ส่งผลลัพธ์ของ context-engine กลับเป็นผลลัพธ์หลัก
  - รวมสถานะ Compaction เนทีฟของ Codex ไว้ใน `details.codexNativeCompaction`
- หาก context engine ที่ใช้งานอยู่ไม่ได้เป็นเจ้าของ Compaction:
  - รักษาพฤติกรรม Compaction เนทีฟของ Codex ปัจจุบันไว้

สิ่งนี้น่าจะต้องเปลี่ยน `extensions/codex/src/app-server/compact.ts` หรือ
ห่อจากเส้นทาง Compaction ทั่วไป ขึ้นอยู่กับว่า
`maybeCompactAgentHarnessSession(...)` ถูกเรียกใช้ที่ใด

#### เหตุการณ์ contextCompaction เนทีฟของ Codex ระหว่างรอบ

Codex อาจปล่อยเหตุการณ์ไอเท็ม `contextCompaction` ระหว่างรอบ ให้คงการปล่อยฮุก
Compaction ก่อน/หลังปัจจุบันไว้ใน `event-projector.ts` แต่อย่าถือว่านั่นเป็น
Compaction ของ context-engine ที่เสร็จสมบูรณ์แล้ว

สำหรับเอนจินที่เป็นเจ้าของ Compaction ให้ปล่อย diagnostic อย่างชัดเจนเมื่อ Codex ทำ
Compaction เนทีฟอยู่ดี:

- ชื่อสตรีม/เหตุการณ์: ใช้สตรีม `compaction` ที่มีอยู่ได้
- รายละเอียด: `{ backend: "codex-app-server", ownsCompaction: true }`

สิ่งนี้ทำให้การแยกตรวจสอบได้

### 9. การรีเซ็ตเซสชันและพฤติกรรม binding

`reset(...)` ของ Codex harness ที่มีอยู่ล้าง binding ของ Codex app-server ออกจาก
ไฟล์เซสชันของ OpenClaw ให้รักษาพฤติกรรมนั้นไว้

ตรวจสอบด้วยว่าการล้างสถานะของ context-engine ยังคงเกิดขึ้นผ่านเส้นทาง lifecycle
เซสชันของ OpenClaw ที่มีอยู่ อย่าเพิ่มการล้างเฉพาะ Codex เว้นแต่ lifecycle ของ
context-engine จะพลาดเหตุการณ์ reset/delete สำหรับ harness ทั้งหมดในปัจจุบัน

### 10. การจัดการข้อผิดพลาด

ทำตามความหมายในตัวของ OpenClaw:

- ความล้มเหลวของ bootstrap ให้เตือนและดำเนินการต่อ
- ความล้มเหลวของ assemble ให้เตือนและ fallback ไปยังข้อความ/พรอมป์ของ pipeline ที่ยังไม่ได้ assemble
- ความล้มเหลวของ afterTurn/ingest ให้เตือนและทำเครื่องหมายว่าการ finalize หลังรอบไม่สำเร็จ
- maintenance ทำงานเฉพาะหลังรอบที่สำเร็จ ไม่ถูกยกเลิก และไม่ใช่ yield เท่านั้น
- ข้อผิดพลาดของ Compaction ไม่ควรถูกลองใหม่เป็นพรอมป์ใหม่

ส่วนเพิ่มเติมเฉพาะ Codex:

- หากการฉายบริบทล้มเหลว ให้เตือนและ fallback ไปยังพรอมป์เดิม
- หากมิเรอร์ทรานสคริปต์ล้มเหลว ยังคงพยายาม finalize context-engine ด้วย
  ข้อความสำรอง
- หาก Compaction เนทีฟของ Codex ล้มเหลวหลังจาก Compaction ของ context-engine สำเร็จ
  อย่าทำให้ Compaction ทั้งหมดของ OpenClaw ล้มเหลวเมื่อ context engine เป็นหลัก

## แผนการทดสอบ

### การทดสอบหน่วย

เพิ่มการทดสอบใต้ `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex เรียก `bootstrap` เมื่อมีไฟล์เซสชันอยู่
   - Codex เรียก `assemble` ด้วยข้อความที่มิเรอร์แล้ว, งบโทเค็น, ชื่อเครื่องมือ,
     โหมด citations, id ของโมเดล และพรอมป์
   - `systemPromptAddition` รวมอยู่ในคำสั่งสำหรับนักพัฒนา
   - ข้อความที่ assemble แล้วถูกฉายเข้าไปในพรอมป์ก่อนคำขอปัจจุบัน
   - Codex เรียก `afterTurn` หลังจากมิเรอร์ทรานสคริปต์
   - หากไม่มี `afterTurn` Codex เรียก `ingestBatch` หรือ `ingest` รายข้อความ
   - turn maintenance ทำงานหลังรอบที่สำเร็จ
   - turn maintenance ไม่ทำงานเมื่อเกิดข้อผิดพลาดของพรอมป์ การยกเลิก หรือ yield abort

2. `context-engine-projection.test.ts`
   - เอาต์พุตคงที่สำหรับอินพุตที่เหมือนกัน
   - ไม่มีพรอมป์ปัจจุบันซ้ำเมื่อประวัติที่ assemble แล้วรวมพรอมป์นั้นอยู่
   - รองรับประวัติว่าง
   - รักษาลำดับ role
   - รวม system prompt addition เฉพาะในคำสั่งสำหรับนักพัฒนา

3. `compact.context-engine.test.ts`
   - ผลลัพธ์หลักของ context engine ที่เป็นเจ้าของชนะ
   - สถานะ Compaction เนทีฟของ Codex ปรากฏในรายละเอียดเมื่อพยายามทำด้วย
   - ความล้มเหลวเนทีฟของ Codex ไม่ทำให้ Compaction ของ context-engine ที่เป็นเจ้าของล้มเหลว
   - context engine ที่ไม่ได้เป็นเจ้าของรักษาพฤติกรรม Compaction เนทีฟปัจจุบันไว้

### การทดสอบที่มีอยู่ที่ต้องอัปเดต

- `extensions/codex/src/app-server/run-attempt.test.ts` หากมี มิฉะนั้นให้ใช้
  การทดสอบการรันของ Codex app-server ที่ใกล้ที่สุด
- `extensions/codex/src/app-server/event-projector.test.ts` เฉพาะเมื่อรายละเอียดเหตุการณ์
  Compaction เปลี่ยน
- `src/agents/harness/selection.test.ts` ไม่ควรต้องเปลี่ยน เว้นแต่พฤติกรรม config
  เปลี่ยน ควรคงที่
- การทดสอบ context-engine ของ harness ในตัวควรผ่านต่อไปโดยไม่เปลี่ยนแปลง

### การทดสอบ Integration / live

เพิ่มหรือขยายการทดสอบ smoke แบบ live ของ Codex harness:

- กำหนดค่า `plugins.slots.contextEngine` เป็นเอนจินทดสอบ
- กำหนดค่า `agents.defaults.model` เป็นโมเดล `codex/*`
- กำหนดค่า provider/model `agentRuntime.id = "codex"`
- ยืนยันว่าเอนจินทดสอบสังเกตเห็น:
  - bootstrap
  - assemble
  - afterTurn หรือ ingest
  - maintenance

หลีกเลี่ยงการต้องใช้ lossless-claw ในการทดสอบ core ของ OpenClaw ใช้ Plugin
context engine ปลอมขนาดเล็กภายในรีโป

## ความสามารถในการสังเกต

เพิ่มล็อก debug รอบการเรียก lifecycle ของ context-engine ของ Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` พร้อมเหตุผล
- `codex native compaction completed alongside context-engine compaction`

หลีกเลี่ยงการล็อกพรอมป์เต็มหรือเนื้อหาทรานสคริปต์

เพิ่มฟิลด์แบบมีโครงสร้างเมื่อเป็นประโยชน์:

- `sessionId`
- `sessionKey` ที่ redact หรือละไว้ตามแนวปฏิบัติการล็อกที่มีอยู่
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## การย้ายข้อมูล / ความเข้ากันได้

สิ่งนี้ควรเข้ากันได้ย้อนหลัง:

- หากไม่ได้กำหนดค่า context engine พฤติกรรม context engine แบบเดิมควรเทียบเท่ากับ
  พฤติกรรม Codex harness ในปัจจุบัน
- หาก `assemble` ของ context-engine ล้มเหลว Codex ควรดำเนินต่อด้วยเส้นทางพรอมป์เดิม
- binding ของเธรด Codex ที่มีอยู่ควรยังคงใช้ได้
- dynamic tool fingerprinting ไม่ควรรวมเอาต์พุตของ context-engine มิฉะนั้น
  การเปลี่ยนบริบททุกครั้งอาจบังคับให้สร้างเธรด Codex ใหม่ เฉพาะแค็ตตาล็อกเครื่องมือ
  เท่านั้นที่ควรมีผลต่อ dynamic tool fingerprint

## คำถามเปิด

1. ควรฉีดบริบทที่ assemble แล้วทั้งหมดเข้าไปในพรอมป์ผู้ใช้ ทั้งหมดเข้าไปใน
   คำสั่งสำหรับนักพัฒนา หรือแบ่งกัน?

   คำแนะนำ: แบ่งกัน ใส่ `systemPromptAddition` ในคำสั่งสำหรับนักพัฒนา;
   ใส่บริบททรานสคริปต์ที่ assemble แล้วใน wrapper ของพรอมป์ผู้ใช้ วิธีนี้สอดคล้องกับ
   โปรโตคอล Codex ปัจจุบันที่สุดโดยไม่แก้ไขประวัติเธรดเนทีฟ

2. ควรปิดใช้งาน Compaction เนทีฟของ Codex เมื่อ context engine เป็นเจ้าของ
   Compaction หรือไม่?

   คำแนะนำ: ไม่ใช่ในตอนแรก Compaction เนทีฟของ Codex อาจยังจำเป็นเพื่อให้เธรด
   app-server ยังทำงานอยู่ แต่ต้องรายงานเป็น Compaction เนทีฟของ Codex
   ไม่ใช่ Compaction ของ context-engine

3. `before_prompt_build` ควรทำงานก่อนหรือหลังการ assemble ของ context-engine?

   คำแนะนำ: หลังการฉาย context-engine สำหรับ Codex เพื่อให้ฮุก harness ทั่วไป
   เห็นพรอมป์/คำสั่งสำหรับนักพัฒนาจริงที่ Codex จะได้รับ หากความเท่าเทียมกับ
   harness ในตัวต้องการลำดับตรงข้าม ให้เข้ารหัสลำดับที่เลือกไว้ในการทดสอบและบันทึกไว้ที่นี่

4. Codex app-server สามารถรับ structured context/history override ในอนาคตได้หรือไม่?

   ยังไม่ทราบ หากทำได้ ให้แทนที่เลเยอร์การฉายข้อความด้วยโปรโตคอลนั้นและ
   คงการเรียก lifecycle ไว้เหมือนเดิม

## เกณฑ์การยอมรับ

- รอบของ embedded harness แบบ `codex/*` เรียก lifecycle assemble ของ context engine ที่เลือก
- `systemPromptAddition` ของ context-engine มีผลต่อคำสั่งสำหรับนักพัฒนาของ Codex
- บริบทที่ assemble แล้วมีผลต่ออินพุตรอบของ Codex อย่างกำหนดแน่นอน
- รอบ Codex ที่สำเร็จเรียก `afterTurn` หรือ ingest fallback
- รอบ Codex ที่สำเร็จเรียกใช้ turn maintenance ของ context-engine
- รอบที่ล้มเหลว/ถูกยกเลิก/yield-aborted ไม่เรียกใช้ turn maintenance
- Compaction ที่ context-engine เป็นเจ้าของยังคงเป็นหลักสำหรับสถานะ OpenClaw/Plugin
- Compaction เนทีฟของ Codex ยังคงตรวจสอบได้ในฐานะพฤติกรรมเนทีฟของ Codex
- พฤติกรรม context-engine ของ harness ในตัวที่มีอยู่ไม่เปลี่ยนแปลง
- พฤติกรรม Codex harness ที่มีอยู่ไม่เปลี่ยนแปลงเมื่อไม่ได้เลือก context engine
  ที่ไม่ใช่ legacy หรือเมื่อ assembly ล้มเหลว
