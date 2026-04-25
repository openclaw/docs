---
read_when:
    - คุณกำลังเชื่อมพฤติกรรมวงจรชีวิตของ context-engine เข้ากับชุดเครื่องมือ Codex
    - คุณต้องการให้ lossless-claw หรือ context-engine plugin อื่นทำงานกับเซสชันชุดเครื่องมือแบบฝังตัวของ codex/*
    - คุณกำลังเปรียบเทียบพฤติกรรม context ของ embedded Pi และ app-server ของ Codex
summary: ข้อกำหนดสำหรับการทำให้ชุดเครื่องมือ app-server ของ Codex ที่ bundle มาเคารพ context-engine plugin ของ OpenClaw
title: การพอร์ต Context Engine สำหรับชุดเครื่องมือ Codex
x-i18n:
    generated_at: "2026-04-25T13:51:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## สถานะ

ร่างข้อกำหนดการติดตั้งใช้งาน

## เป้าหมาย

ทำให้ชุดเครื่องมือ app-server ของ Codex ที่ bundle มากับระบบเคารพสัญญาวงจรชีวิตของ
context-engine ของ OpenClaw แบบเดียวกับที่เทิร์นของ embedded Pi
รองรับอยู่แล้ว

เซสชันที่ใช้ `agents.defaults.embeddedHarness.runtime: "codex"` หรือ
model `codex/*` ควรยังคงเปิดโอกาสให้ context-engine plugin ที่ถูกเลือก เช่น
`lossless-claw` ควบคุมการประกอบ context, การ ingest หลังจบเทิร์น, maintenance และ
นโยบาย Compaction ระดับ OpenClaw ได้เท่าที่ขอบเขตของ Codex app-server อนุญาต

## สิ่งที่ไม่อยู่ในขอบเขต

- ไม่ทำการติดตั้งใช้งาน internals ของ Codex app-server ใหม่ทั้งหมด
- ไม่ทำให้ native thread compaction ของ Codex สร้างสรุปแบบ lossless-claw
- ไม่บังคับให้ model ที่ไม่ใช่ Codex ต้องใช้ชุดเครื่องมือ Codex
- ไม่เปลี่ยนพฤติกรรมของเซสชัน ACP/acpx ข้อกำหนดนี้ใช้กับเส้นทาง non-ACP embedded agent harness เท่านั้น
- ไม่ทำให้ third-party plugins ลงทะเบียน Codex app-server extension factory;
  ขอบเขตความเชื่อถือของ bundled-plugin ที่มีอยู่ยังคงเดิม

## สถาปัตยกรรมปัจจุบัน

ลูปการรันแบบ embedded จะ resolve context engine ที่กำหนดค่าไว้หนึ่งครั้งต่อการรัน ก่อน
เลือก harness ระดับล่างที่เป็นรูปธรรม:

- `src/agents/pi-embedded-runner/run.ts`
  - เริ่มต้น context-engine plugins
  - เรียก `resolveContextEngine(params.config)`
  - ส่ง `contextEngine` และ `contextTokenBudget` เข้าไปใน
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` จะส่งต่อไปยัง agent harness ที่เลือกไว้:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness ถูกลงทะเบียนโดย bundled Codex Plugin:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

implementation ของ Codex harness ได้รับ `EmbeddedRunAttemptParams` ชุดเดียวกัน
กับ PI-backed attempts:

- `extensions/codex/src/app-server/run-attempt.ts`

นั่นหมายความว่าจุด hook ที่ต้องใช้ อยู่ในโค้ดที่ OpenClaw ควบคุมได้ ขอบเขตภายนอก
คือ protocol ของ Codex app-server เอง: OpenClaw สามารถควบคุมสิ่งที่มันส่งไปยัง
`thread/start`, `thread/resume` และ `turn/start` และสามารถสังเกต
notifications ได้ แต่ไม่สามารถเปลี่ยน internal thread store หรือ native
compactor ของ Codex ได้

## ช่องว่างในปัจจุบัน

embedded PI attempts เรียกวงจรชีวิตของ context engine โดยตรง:

- bootstrap/maintenance ก่อน attempt
- assemble ก่อนเรียก model
- afterTurn หรือ ingest หลัง attempt
- maintenance หลังเทิร์นที่สำเร็จ
- Compaction ของ context-engine สำหรับ engine ที่เป็นเจ้าของ Compaction

โค้ด PI ที่เกี่ยวข้อง:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

ปัจจุบัน Codex app-server attempts รัน generic agent-harness hooks และ mirror
transcript แต่ไม่ได้เรียก `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` หรือ
`params.contextEngine.maintain`

โค้ด Codex ที่เกี่ยวข้อง:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## พฤติกรรมที่ต้องการ

สำหรับเทิร์นของ Codex harness OpenClaw ควรรักษาวงจรชีวิตนี้ไว้:

1. อ่าน transcript ของเซสชัน OpenClaw ที่ถูก mirror ไว้
2. Bootstrap context engine ที่ active เมื่อมีไฟล์เซสชันก่อนหน้าอยู่
3. รัน bootstrap maintenance หากมี
4. ประกอบ context โดยใช้ context engine ที่ active
5. แปลง context ที่ประกอบแล้วให้เป็นอินพุตที่เข้ากันได้กับ Codex
6. เริ่มหรือกลับเข้าสู่ Codex thread ด้วย developer instructions ที่รวม
   `systemPromptAddition` ของ context-engine ถ้ามี
7. เริ่ม Codex turn ด้วยพรอมต์ฝั่งผู้ใช้ที่ประกอบแล้ว
8. Mirror ผลลัพธ์ของ Codex กลับเข้า transcript ของ OpenClaw
9. เรียก `afterTurn` ถ้ามี implementation มิฉะนั้นใช้ `ingestBatch`/`ingest` โดยใช้
   transcript snapshot ที่ถูก mirror แล้ว
10. รัน turn maintenance หลังเทิร์นที่สำเร็จและไม่ถูกยกเลิก
11. คงสัญญาณ native compaction ของ Codex และ hook ของ Compaction ฝั่ง OpenClaw ไว้

## ข้อจำกัดของการออกแบบ

### Codex app-server ยังคงเป็นแหล่งอ้างอิงหลักสำหรับ native thread state

Codex เป็นเจ้าของ native thread และ extended history ภายในของมันเอง OpenClaw ไม่ควร
พยายามเปลี่ยนประวัติภายในของ app-server ยกเว้นผ่านการเรียก protocol ที่รองรับ

transcript mirror ของ OpenClaw ยังคงเป็นแหล่งอ้างอิงสำหรับฟีเจอร์ของ OpenClaw:

- ประวัติแชต
- การค้นหา
- งาน bookkeeping ของ `/new` และ `/reset`
- การสลับ model หรือ harness ในอนาคต
- สถานะของ context-engine plugin

### การประกอบ context engine ต้องถูกฉายผลไปยังอินพุตของ Codex

อินเทอร์เฟซ context-engine คืนค่า `AgentMessage[]` ของ OpenClaw ไม่ใช่ Codex
thread patch ขณะที่ `turn/start` ของ Codex app-server รับ current user input และ
`thread/start` กับ `thread/resume` รับ developer instructions

ดังนั้น implementation จึงต้องมีชั้น projection เวอร์ชันแรกที่ปลอดภัย
ควรหลีกเลี่ยงการทำเหมือนว่ามันสามารถแทนที่ประวัติภายในของ Codex ได้ แต่ควร inject
context ที่ประกอบแล้วเป็น prompt/developer-instruction material แบบกำหนดแน่นอนรอบ
เทิร์นปัจจุบันแทน

### ความเสถียรของ prompt cache มีความสำคัญ

สำหรับ engine อย่าง lossless-claw, context ที่ประกอบแล้วควรเป็นแบบกำหนดแน่นอน
เมื่ออินพุตไม่เปลี่ยนแปลง อย่าเพิ่ม timestamp, id แบบสุ่ม หรือการจัดลำดับที่ไม่แน่นอน
ลงในข้อความ context ที่สร้างขึ้น

### ความหมายของ PI fallback ไม่เปลี่ยน

การเลือก harness ยังคงเหมือนเดิม:

- `runtime: "pi"` บังคับใช้ PI
- `runtime: "codex"` เลือก Codex harness ที่ลงทะเบียนไว้
- `runtime: "auto"` ให้ plugin harnesses อ้างสิทธิ์ provider ที่รองรับได้
- `fallback: "none"` ปิด PI fallback เมื่อไม่มี plugin harness ใดตรงกัน

งานนี้เปลี่ยนเฉพาะสิ่งที่เกิดขึ้นหลังจากเลือก Codex harness แล้ว

## แผนการติดตั้งใช้งาน

### 1. export หรือย้ายตัวช่วย attempt ของ context-engine ที่ใช้ซ้ำได้

ปัจจุบันตัวช่วยวงจรชีวิตที่ใช้ซ้ำได้อยู่ใต้ PI runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex ไม่ควร import จาก implementation path ที่มีชื่อสื่อถึง PI ถ้าเราหลีกเลี่ยงได้

สร้างโมดูลที่เป็นกลางต่อ harness เช่น:

- `src/agents/harness/context-engine-lifecycle.ts`

ย้ายหรือ re-export:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper ขนาดเล็กรอบ `runContextEngineMaintenance`

คงให้ import ฝั่ง PI ทำงานต่อได้ ไม่ว่าจะโดย re-export จากไฟล์เก่า หรืออัปเดต call site
ของ PI ใน PR เดียวกัน

ชื่อตัวช่วยแบบเป็นกลางไม่ควรอ้างถึง PI

ชื่อที่แนะนำ:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. เพิ่มตัวช่วย projection ของ Codex context

เพิ่มโมดูลใหม่:

- `extensions/codex/src/app-server/context-engine-projection.ts`

หน้าที่รับผิดชอบ:

- รับ `AgentMessage[]` ที่ประกอบแล้ว, ประวัติที่ mirror ไว้ดั้งเดิม และพรอมต์ปัจจุบัน
- ตัดสินว่า context ส่วนใดควรอยู่ใน developer instructions เทียบกับ current user input
- คง current user prompt ไว้เป็นคำขอที่ปฏิบัติได้จริงลำดับสุดท้าย
- เรนเดอร์ข้อความก่อนหน้าในรูปแบบที่ชัดเจนและเสถียร
- หลีกเลี่ยง metadata ที่เปลี่ยนแปลงได้

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

projection เริ่มต้นที่แนะนำ:

- ใส่ `systemPromptAddition` ลงใน developer instructions
- วาง context ของ transcript ที่ประกอบแล้วไว้ก่อนพรอมต์ปัจจุบันใน `promptText`
- ติดป้ายกำกับอย่างชัดเจนว่าเป็น context ที่ OpenClaw ประกอบขึ้นสำหรับเทิร์นนี้
- คง current prompt ไว้ลำดับสุดท้าย
- ตัด current user prompt ที่ซ้ำออก หากมันปรากฏซ้ำอยู่ที่ท้ายอยู่แล้ว

รูปร่างพรอมต์ตัวอย่าง:

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

สิ่งนี้อาจไม่สวยเท่าการผ่าตัดแก้ประวัติภายในของ Codex โดยตรง แต่สามารถติดตั้งใช้งาน
ภายใน OpenClaw ได้ และยังคงความหมายของ context-engine

การปรับปรุงในอนาคต: หาก Codex app-server เปิด protocol สำหรับแทนที่หรือเสริม
thread history ให้สลับ projection layer นี้ไปใช้ API นั้น

### 3. เชื่อม bootstrap ก่อนการเริ่ม Codex thread

ใน `extensions/codex/src/app-server/run-attempt.ts`:

- อ่านประวัติของเซสชันที่ mirror ไว้เหมือนปัจจุบัน
- ระบุว่าไฟล์เซสชันมีอยู่ก่อนการรันครั้งนี้หรือไม่ ควรใช้ helper ที่ตรวจ `fs.stat(params.sessionFile)` ก่อนมีการเขียน mirror
- เปิด `SessionManager` หรือใช้อะแดปเตอร์ session manager แบบแคบ หาก helper นั้นต้องใช้
- เรียก neutral bootstrap helper เมื่อมี `params.contextEngine`

pseudo-flow:

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

ใช้ข้อตกลง `sessionKey` เดียวกับ Codex tool bridge และ transcript mirror ปัจจุบัน Codex คำนวณ `sandboxSessionKey` จาก `params.sessionKey` หรือ `params.sessionId`; ใช้แบบนั้นอย่างสม่ำเสมอ เว้นแต่จะมีเหตุผลให้คง `params.sessionKey` ดิบไว้

### 4. เชื่อม assemble ก่อน `thread/start` / `thread/resume` และ `turn/start`

ใน `runCodexAppServerAttempt`:

1. สร้าง dynamic tools ก่อน เพื่อให้ context engine มองเห็นชื่อ tool ที่พร้อมใช้งานจริง
2. อ่านประวัติของเซสชันที่ mirror ไว้
3. รัน context-engine `assemble(...)` เมื่อมี `params.contextEngine`
4. ฉายผลลัพธ์ที่ประกอบแล้วไปยัง:
   - developer instruction addition
   - ข้อความพรอมต์สำหรับ `turn/start`

การเรียก hook ที่มีอยู่:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

ควรเปลี่ยนให้รับรู้ context:

1. คำนวณ developer instructions พื้นฐานด้วย `buildDeveloperInstructions(params)`
2. ใช้ context-engine assembly/projection
3. รัน `before_prompt_build` ด้วย prompt/developer instructions ที่ฉายผลแล้ว

ลำดับนี้ช่วยให้ generic prompt hooks มองเห็นพรอมต์เดียวกับที่ Codex จะได้รับ หาก
เราต้องการความสอดคล้องแบบเข้มกับ PI ให้รัน context-engine assembly ก่อนการประกอบ hook
เพราะ PI ใช้ `systemPromptAddition` ของ context-engine กับ system prompt สุดท้ายหลัง
prompt pipeline ของมัน ค่าคงที่ที่สำคัญคือทั้ง context engine และ hooks ต้องได้
ลำดับที่กำหนดแน่นอนและมีเอกสารรองรับ

ลำดับที่แนะนำสำหรับ implementation แรก:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. append/prepend `systemPromptAddition` ไปยัง developer instructions
4. ฉายข้อความที่ประกอบแล้วไปยังข้อความพรอมต์
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. ส่ง developer instructions สุดท้ายไปยัง `startOrResumeThread(...)`
7. ส่งข้อความพรอมต์สุดท้ายไปยัง `buildTurnStartParams(...)`

ข้อกำหนดนี้ควรถูกเข้ารหัสไว้ในชุดทดสอบ เพื่อให้การเปลี่ยนแปลงในอนาคตไม่สลับลำดับโดยไม่ตั้งใจ

### 5. คงรูปแบบที่เสถียรต่อ prompt cache

projection helper ต้องสร้างเอาต์พุตที่เสถียรระดับไบต์เมื่ออินพุตเหมือนเดิม:

- ลำดับข้อความที่เสถียร
- ป้ายกำกับ role ที่เสถียร
- ไม่มี timestamp ที่สร้างขึ้น
- ไม่มีการรั่วของลำดับ object key
- ไม่มี delimiter แบบสุ่ม
- ไม่มี id ต่อการรัน

ใช้ delimiter แบบคงที่และส่วนต่าง ๆ ที่ระบุชัดเจน

### 6. เชื่อม post-turn หลัง transcript mirroring

`CodexAppServerEventProjector` ของ Codex จะสร้าง `messagesSnapshot` ภายในเครื่องสำหรับ
เทิร์นปัจจุบัน `mirrorTranscriptBestEffort(...)` จะเขียน snapshot นั้นลงใน transcript mirror ของ OpenClaw

หลังจาก mirror สำเร็จหรือล้มเหลว ให้เรียก context-engine finalizer พร้อม
message snapshot ที่ดีที่สุดเท่าที่มี:

- ให้ใช้ mirrored session context แบบเต็มหลังการเขียนก่อน เพราะ `afterTurn`
  คาดหวัง session snapshot ไม่ใช่เฉพาะเทิร์นปัจจุบันเท่านั้น
- ถอยกลับไปใช้ `historyMessages + result.messagesSnapshot` หากไม่สามารถเปิดไฟล์เซสชันได้อีกครั้ง

pseudo-flow:

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

หากการ mirror ล้มเหลว ก็ยังคงเรียก `afterTurn` ด้วย fallback snapshot แต่ให้บันทึก log
ว่า context engine กำลัง ingest จาก fallback turn data

### 7. ทำให้ usage และ prompt-cache runtime context เป็นมาตรฐานเดียวกัน

ผลลัพธ์ของ Codex มี normalized usage จาก token notification ของ app-server เมื่อมี
ให้ส่ง usage นั้นเข้าไปใน context runtime ของ context-engine

หากในอนาคต Codex app-server เปิดเผยรายละเอียด cache read/write ให้นำมาแมปเข้า
`ContextEnginePromptCacheInfo` จนกว่าจะถึงตอนนั้น ให้ละเว้น `promptCache` แทนการแต่งศูนย์ขึ้นมาเอง

### 8. นโยบาย Compaction

มีระบบ Compaction อยู่สองระบบ:

1. `compact()` ของ context-engine ฝั่ง OpenClaw
2. `thread/compact/start` แบบ native ของ Codex app-server

อย่าทำให้สองอย่างนี้ปะปนกันแบบเงียบ ๆ

#### `/compact` และ OpenClaw Compaction แบบ explicit

เมื่อ context engine ที่เลือกมี `info.ownsCompaction === true`,
OpenClaw Compaction แบบ explicit ควรให้ผลลัพธ์ของ `compact()` ของ context engine
เป็นหลักสำหรับ transcript mirror และสถานะของ Plugin ฝั่ง OpenClaw

เมื่อ Codex harness ที่ถูกเลือกมี native thread binding เราอาจร้องขอ
Codex native compaction เพิ่มเติมเพื่อให้ app-server thread ยังอยู่ในสภาพดีได้ แต่ต้อง
รายงานสิ่งนี้เป็น backend action แยกต่างหากใน details

พฤติกรรมที่แนะนำ:

- หาก `contextEngine.info.ownsCompaction === true`:
  - เรียก `compact()` ของ context engine ก่อน
  - จากนั้นเรียก Codex native compaction แบบ best-effort เมื่อมี thread binding
  - คืนผลลัพธ์ของ context engine เป็นผลลัพธ์หลัก
  - ใส่สถานะของ Codex native compaction ลงใน `details.codexNativeCompaction`
- หาก context engine ที่ active ไม่ได้เป็นเจ้าของ Compaction:
  - คงพฤติกรรม native compaction ปัจจุบันของ Codex ไว้

สิ่งนี้น่าจะต้องแก้ `extensions/codex/src/app-server/compact.ts` หรือ
ครอบมันจาก generic compaction path ขึ้นอยู่กับว่า
`maybeCompactAgentHarnessSession(...)` ถูกเรียกจากที่ใด

#### event `contextCompaction` แบบ native ของ Codex ระหว่างเทิร์น

Codex อาจปล่อย item event `contextCompaction` ระหว่างเทิร์น ให้คงการปล่อย
hook ของ before/after compaction ปัจจุบันไว้ใน `event-projector.ts` แต่
อย่าถือว่านั่นคือ context-engine compaction ที่เสร็จสมบูรณ์แล้ว

สำหรับ engine ที่เป็นเจ้าของ Compaction ให้ปล่อย diagnostic แบบ explicit เมื่อ Codex ยังทำ
native compaction อยู่:

- ชื่อ stream/event: ใช้ stream `compaction` ที่มีอยู่ได้
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

สิ่งนี้จะทำให้การแยกความรับผิดชอบสามารถตรวจสอบย้อนหลังได้

### 9. พฤติกรรมการรีเซ็ตเซสชันและ binding

`reset(...)` ของ Codex harness ที่มีอยู่จะล้าง Codex app-server binding ออกจากไฟล์เซสชันของ OpenClaw ให้คงพฤติกรรมนี้ไว้

และให้แน่ใจว่าการ cleanup สถานะของ context-engine ยังคงเกิดขึ้นผ่านเส้นทางวงจรชีวิตเซสชันของ OpenClaw ที่มีอยู่ อย่าเพิ่ม cleanup แบบเฉพาะ Codex เว้นแต่วงจรชีวิตของ context-engine ปัจจุบันพลาดเหตุการณ์ reset/delete สำหรับทุก harness อยู่แล้ว

### 10. การจัดการข้อผิดพลาด

ให้ทำตามความหมายของ PI:

- ความล้มเหลวของ bootstrap ให้เตือนแล้วทำต่อ
- ความล้มเหลวของ assemble ให้เตือนและ fallback ไปใช้ pipeline messages/prompt ที่ยังไม่ได้ประกอบ
- ความล้มเหลวของ afterTurn/ingest ให้เตือนและทำเครื่องหมายว่า post-turn finalization ไม่สำเร็จ
- maintenance ให้รันเฉพาะหลังเทิร์นที่สำเร็จ, ไม่ถูกยกเลิก และไม่ใช่ yield turn
- ข้อผิดพลาดของ Compaction ไม่ควรถูกลองใหม่ในฐานะพรอมต์ใหม่

ส่วนเสริมเฉพาะของ Codex:

- หาก context projection ล้มเหลว ให้เตือนและ fallback ไปใช้พรอมต์ต้นฉบับ
- หาก transcript mirror ล้มเหลว ก็ยังพยายาม finalization ของ context-engine ด้วย fallback messages
- หาก Codex native compaction ล้มเหลวหลังจาก context-engine compaction สำเร็จแล้ว
  อย่าทำให้ OpenClaw Compaction ทั้งหมดล้มเหลว เมื่อ context engine เป็นตัวหลัก

## แผนการทดสอบ

### Unit tests

เพิ่มชุดทดสอบภายใต้ `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex เรียก `bootstrap` เมื่อมีไฟล์เซสชันอยู่
   - Codex เรียก `assemble` พร้อม mirrored messages, token budget, tool names,
     โหมด citations, model id และ prompt
   - `systemPromptAddition` ถูกรวมอยู่ใน developer instructions
   - ข้อความที่ประกอบแล้วถูกฉายเข้าไปในพรอมต์ก่อน current request
   - Codex เรียก `afterTurn` หลัง transcript mirroring
   - หากไม่มี `afterTurn`, Codex จะเรียก `ingestBatch` หรือ `ingest` รายข้อความ
   - turn maintenance รันหลังเทิร์นที่สำเร็จ
   - turn maintenance ไม่รันเมื่อเกิด prompt error, abort หรือ yield abort

2. `context-engine-projection.test.ts`
   - เอาต์พุตคงที่เมื่ออินพุตเหมือนเดิม
   - ไม่มี current prompt ซ้ำเมื่อ assembled history มีมันอยู่แล้ว
   - รองรับกรณีประวัติว่าง
   - คงลำดับ role
   - รวม system prompt addition เฉพาะใน developer instructions

3. `compact.context-engine.test.ts`
   - ผลลัพธ์หลักของ owning context engine เป็นฝ่ายชนะ
   - สถานะ Codex native compaction ปรากฏใน details เมื่อมีการพยายามทำด้วย
   - ความล้มเหลวของ Codex native ไม่ทำให้ compaction ของ owning context-engine ล้มเหลว
   - context engine ที่ไม่ได้เป็นเจ้าของยังคงพฤติกรรม native compaction ปัจจุบันไว้

### ชุดทดสอบที่มีอยู่ที่ต้องอัปเดต

- `extensions/codex/src/app-server/run-attempt.test.ts` หากมีอยู่ มิฉะนั้นใช้
  ชุดทดสอบ run ที่ใกล้เคียงที่สุดของ Codex app-server
- `extensions/codex/src/app-server/event-projector.test.ts` เฉพาะเมื่อรายละเอียดของ event ด้าน compaction เปลี่ยน
- `src/agents/harness/selection.test.ts` ไม่ควรต้องเปลี่ยน เว้นแต่พฤติกรรมของ config เปลี่ยน; ควรยังคงเสถียร
- ชุดทดสอบ context-engine ของ PI ควรยังผ่านได้โดยไม่ต้องเปลี่ยน

### Integration / live tests

เพิ่มหรือขยาย live Codex harness smoke tests:

- ตั้งค่า `plugins.slots.contextEngine` เป็น test engine
- ตั้งค่า `agents.defaults.model` เป็น model `codex/*`
- ตั้งค่า `agents.defaults.embeddedHarness.runtime = "codex"`
- assert ว่า test engine สังเกตเห็น:
  - bootstrap
  - assemble
  - afterTurn หรือ ingest
  - maintenance

หลีกเลี่ยงการบังคับใช้ lossless-claw ในชุดทดสอบแกนกลางของ OpenClaw ใช้ fake
context engine plugin ขนาดเล็กภายใน repo แทน

## การสังเกตการณ์

เพิ่ม debug logs รอบการเรียกวงจรชีวิต context-engine ของ Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` พร้อมเหตุผล
- `codex native compaction completed alongside context-engine compaction`

หลีกเลี่ยงการบันทึกพรอมต์เต็มหรือเนื้อหา transcript ทั้งหมด

เพิ่ม structured fields เมื่อมีประโยชน์:

- `sessionId`
- `sessionKey` ให้ redact หรือละเว้นตามแนวปฏิบัติ logging ที่มีอยู่
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## การย้าย / ความเข้ากันได้

สิ่งนี้ควรเข้ากันได้ย้อนหลัง:

- หากไม่ได้กำหนด context engine ไว้ พฤติกรรมของ legacy context engine ควร
  เทียบเท่ากับพฤติกรรมของ Codex harness ในปัจจุบัน
- หาก `assemble` ของ context-engine ล้มเหลว Codex ควรทำงานต่อด้วย
  เส้นทางพรอมต์ต้นฉบับ
- Codex thread bindings ที่มีอยู่ควรยังใช้ได้
- dynamic tool fingerprinting ไม่ควรรวมเอาต์พุตของ context-engine; มิฉะนั้น
  ทุกการเปลี่ยน context อาจบังคับให้สร้าง Codex thread ใหม่ ควรมีเพียง tool catalog
  เท่านั้นที่ส่งผลต่อ dynamic tool fingerprint

## คำถามที่ยังเปิดอยู่

1. ควร inject context ที่ประกอบแล้วทั้งหมดเข้าไปใน user prompt ทั้งหมด,
   ทั้งหมดเข้าไปใน developer instructions หรือแยกกัน?

   ข้อแนะนำ: แยกกัน ใส่ `systemPromptAddition` ใน developer instructions;
   ใส่ context ของ transcript ที่ประกอบแล้วในตัวครอบ user prompt วิธีนี้สอดคล้องที่สุด
   กับ protocol ของ Codex ในปัจจุบัน โดยไม่แก้ไข native thread history

2. ควรปิด Codex native compaction เมื่อ context engine เป็นเจ้าของ
   Compaction หรือไม่?

   ข้อแนะนำ: ไม่ อย่างน้อยในระยะแรก Codex native compaction อาจยัง
   จำเป็นต่อการคง thread ของ app-server ให้ทำงานได้ แต่ต้องถูกรายงานว่าเป็น
   native Codex compaction ไม่ใช่ context-engine compaction

3. `before_prompt_build` ควรรันก่อนหรือหลัง context-engine assembly?

   ข้อแนะนำ: หลัง context-engine projection สำหรับ Codex เพื่อให้ generic harness
   hooks มองเห็น prompt/developer instructions จริงที่ Codex จะได้รับ หาก PI
   parity ต้องการตรงกันข้าม ให้เข้ารหัสลำดับที่เลือกไว้ในชุดทดสอบและบันทึกไว้
   ที่นี่

4. Codex app-server สามารถรับ structured context/history override ในอนาคตได้หรือไม่?

   ยังไม่ทราบ หากทำได้ ให้แทนที่ text projection layer ด้วย protocol นั้น และคงการเรียกวงจรชีวิตไว้เหมือนเดิม

## เกณฑ์การยอมรับ

- เทิร์นของ `codex/*` embedded harness เรียกวงจรชีวิต assemble ของ context engine ที่เลือก
- `systemPromptAddition` ของ context-engine มีผลต่อ developer instructions ของ Codex
- context ที่ประกอบแล้วมีผลต่ออินพุต turn ของ Codex อย่างกำหนดแน่นอน
- เทิร์น Codex ที่สำเร็จเรียก `afterTurn` หรือ ingest fallback
- เทิร์น Codex ที่สำเร็จรัน turn maintenance ของ context-engine
- เทิร์นที่ล้มเหลว/ถูกยกเลิก/yield-aborted ไม่รัน turn maintenance
- Compaction ที่ context-engine เป็นเจ้าของยังคงเป็นตัวหลักสำหรับสถานะของ OpenClaw/Plugin
- Codex native compaction ยังคงสามารถตรวจสอบย้อนหลังได้ในฐานะพฤติกรรม native ของ Codex
- พฤติกรรม context-engine ของ PI ที่มีอยู่ไม่เปลี่ยน
- พฤติกรรม Codex harness ที่มีอยู่ไม่เปลี่ยนเมื่อไม่ได้เลือก non-legacy context engine
  หรือเมื่อ assembly ล้มเหลว
