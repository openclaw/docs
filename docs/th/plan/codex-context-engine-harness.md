---
read_when:
    - คุณกำลังเชื่อมพฤติกรรมวงจรชีวิตของเอนจินบริบทเข้ากับฮาร์เนส Codex
    - คุณต้องใช้ lossless-claw หรือ Plugin เอนจินบริบทอื่นเพื่อทำงานกับเซสชันฮาร์เนสแบบฝังของ codex/*
    - คุณกำลังเปรียบเทียบพฤติกรรมบริบทของ PI แบบฝังและเซิร์ฟเวอร์แอป Codex
summary: ข้อกำหนดสำหรับทำให้ฮาร์เนสแอปเซิร์ฟเวอร์ Codex ที่มาพร้อมชุดรองรับ Plugin เอนจินบริบทของ OpenClaw
title: การพอร์ตเอนจินบริบทของ Codex Harness
x-i18n:
    generated_at: "2026-05-03T10:14:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## สถานะ

ข้อกำหนดการใช้งานฉบับร่าง

## เป้าหมาย

ทำให้ bundled Codex app-server harness เคารพสัญญาวงจรชีวิต context-engine ของ OpenClaw แบบเดียวกับที่ embedded PI turns เคารพอยู่แล้ว

เซสชันที่ใช้ `agents.defaults.embeddedHarness.runtime: "codex"` หรือโมเดล `codex/*` ควรยังคงให้ context-engine plugin ที่เลือกไว้ เช่น `lossless-claw` ควบคุมการประกอบ context, การ ingest หลัง turn, การบำรุงรักษา และนโยบาย compaction ระดับ OpenClaw ได้เท่าที่ขอบเขต Codex app-server อนุญาต

## สิ่งที่ไม่ใช่เป้าหมาย

- ไม่ reimplement internals ของ Codex app-server
- ไม่ทำให้ native thread compaction ของ Codex สร้างสรุปแบบ lossless-claw
- ไม่บังคับให้โมเดลที่ไม่ใช่ Codex ใช้ Codex harness
- ไม่เปลี่ยนพฤติกรรมเซสชัน ACP/acpx ข้อกำหนดนี้มีไว้สำหรับ path ของ non-ACP embedded agent harness เท่านั้น
- ไม่ทำให้ third-party plugins ลงทะเบียน Codex app-server extension factories; ขอบเขตความไว้วางใจของ bundled-plugin ที่มีอยู่ยังคงไม่เปลี่ยนแปลง

## สถาปัตยกรรมปัจจุบัน

embedded run loop จะ resolve context engine ที่กำหนดค่าไว้หนึ่งครั้งต่อ run ก่อนเลือก low-level harness ที่เป็นรูปธรรม:

- `src/agents/pi-embedded-runner/run.ts`
  - เริ่มต้น context-engine plugins
  - เรียก `resolveContextEngine(params.config)`
  - ส่ง `contextEngine` และ `contextTokenBudget` เข้าไปยัง `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegate ไปยัง agent harness ที่เลือกไว้:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness ลงทะเบียนโดย bundled Codex plugin:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

implementation ของ Codex harness ได้รับ `EmbeddedRunAttemptParams` เดียวกับ attempts ที่หนุนด้วย PI:

- `extensions/codex/src/app-server/run-attempt.ts`

นั่นหมายความว่า hook point ที่ต้องใช้คือโค้ดที่ OpenClaw ควบคุม ขอบเขตภายนอกคือโปรโตคอล Codex app-server เอง: OpenClaw ควบคุมสิ่งที่ส่งไปยัง `thread/start`, `thread/resume` และ `turn/start` ได้ และสังเกต notifications ได้ แต่ไม่สามารถเปลี่ยน thread store ภายในหรือ native compactor ของ Codex ได้

## ช่องว่างปัจจุบัน

Embedded PI attempts เรียกวงจรชีวิต context-engine โดยตรง:

- bootstrap/maintenance ก่อน attempt
- assemble ก่อน model call
- afterTurn หรือ ingest หลัง attempt
- maintenance หลัง turn ที่สำเร็จ
- context-engine compaction สำหรับ engines ที่เป็นเจ้าของ compaction

โค้ด PI ที่เกี่ยวข้อง:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server attempts ในปัจจุบันรัน generic agent-harness hooks และ mirror transcript แต่ไม่เรียก `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` หรือ `params.contextEngine.maintain`

โค้ด Codex ที่เกี่ยวข้อง:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## พฤติกรรมที่ต้องการ

สำหรับ turns ของ Codex harness OpenClaw ควรรักษาวงจรชีวิตนี้:

1. อ่าน mirrored OpenClaw session transcript
2. Bootstrap context engine ที่ใช้งานอยู่เมื่อมีไฟล์เซสชันก่อนหน้าอยู่
3. รัน bootstrap maintenance เมื่อพร้อมใช้งาน
4. Assemble context โดยใช้ context engine ที่ใช้งานอยู่
5. แปลง context ที่ assemble แล้วเป็น inputs ที่เข้ากันได้กับ Codex
6. เริ่มหรือ resume Codex thread ด้วย developer instructions ที่รวม context-engine `systemPromptAddition` ใดๆ
7. เริ่ม Codex turn ด้วย prompt ที่ assemble แล้วสำหรับผู้ใช้
8. Mirror ผลลัพธ์ Codex กลับเข้า OpenClaw transcript
9. เรียก `afterTurn` หาก implement ไว้ มิฉะนั้นใช้ `ingestBatch`/`ingest` โดยใช้ mirrored transcript snapshot
10. รัน turn maintenance หลัง turns ที่สำเร็จและไม่ถูกยกเลิก
11. รักษา native compaction signals ของ Codex และ OpenClaw compaction hooks

## ข้อจำกัดในการออกแบบ

### Codex app-server ยังคงเป็น canonical สำหรับ native thread state

Codex เป็นเจ้าของ native thread และ internal extended history ใดๆ ของตัวเอง OpenClaw ไม่ควรพยายาม mutate internal history ของ app-server ยกเว้นผ่าน protocol calls ที่รองรับ

transcript mirror ของ OpenClaw ยังคงเป็นแหล่งข้อมูลสำหรับฟีเจอร์ของ OpenClaw:

- chat history
- search
- การทำ bookkeeping ของ `/new` และ `/reset`
- การสลับ model หรือ harness ในอนาคต
- สถานะ context-engine plugin

### Context engine assembly ต้องถูก project เป็น Codex inputs

interface ของ context-engine คืนค่า OpenClaw `AgentMessage[]` ไม่ใช่ Codex thread patch Codex app-server `turn/start` รับ current user input ขณะที่ `thread/start` และ `thread/resume` รับ developer instructions

ดังนั้น implementation จึงต้องมี projection layer เวอร์ชันแรกที่ปลอดภัยควรหลีกเลี่ยงการแสร้งว่าสามารถแทนที่ internal history ของ Codex ได้ ควร inject context ที่ assemble แล้วเป็น prompt/developer-instruction material แบบ deterministic รอบ current turn

### ความเสถียรของ prompt-cache สำคัญ

สำหรับ engines อย่าง lossless-claw context ที่ assemble แล้วควรเป็น deterministic สำหรับ inputs ที่ไม่เปลี่ยนแปลง อย่าเพิ่ม timestamps, random ids หรือการเรียงลำดับที่ไม่ deterministic ในข้อความ context ที่สร้างขึ้น

### semantics ของ runtime selection ไม่เปลี่ยน

Harness selection ยังคงเหมือนเดิม:

- `runtime: "pi"` บังคับใช้ PI
- `runtime: "codex"` เลือก Codex harness ที่ลงทะเบียนไว้
- `runtime: "auto"` ให้ plugin harnesses claim providers ที่รองรับ
- `auto` runs ที่ไม่ match จะใช้ PI

งานนี้เปลี่ยนสิ่งที่เกิดขึ้นหลังจากเลือก Codex harness แล้ว

## แผน implementation

### 1. Export หรือย้าย reusable context-engine attempt helpers

ปัจจุบัน reusable lifecycle helpers อยู่ใต้ PI runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex ไม่ควร import จาก implementation path ที่ชื่อสื่อถึง PI หากหลีกเลี่ยงได้

สร้างโมดูลแบบ harness-neutral เช่น:

- `src/agents/harness/context-engine-lifecycle.ts`

ย้ายหรือ re-export:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- wrapper ขนาดเล็กรอบ `runContextEngineMaintenance`

ทำให้ PI imports ยังใช้งานได้ โดย re-export จากไฟล์เดิมหรืออัปเดต PI call sites ใน PR เดียวกัน

ชื่อ helper ที่เป็นกลางไม่ควรกล่าวถึง PI

ชื่อที่แนะนำ:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. เพิ่ม Codex context projection helper

เพิ่มโมดูลใหม่:

- `extensions/codex/src/app-server/context-engine-projection.ts`

หน้าที่:

- รับ `AgentMessage[]` ที่ assemble แล้ว, original mirrored history และ current prompt
- กำหนดว่า context ใดควรอยู่ใน developer instructions เทียบกับ current user input
- รักษา current user prompt ให้เป็น actionable request สุดท้าย
- render prior messages ในรูปแบบที่ stable และชัดเจน
- หลีกเลี่ยง metadata ที่ volatile

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

- ใส่ `systemPromptAddition` เข้าไปใน developer instructions
- ใส่ assembled transcript context ก่อน current prompt ใน `promptText`
- ติดป้ายอย่างชัดเจนว่าเป็น OpenClaw assembled context
- ให้ current prompt อยู่ท้ายสุด
- ไม่รวม current user prompt ซ้ำหากปรากฏอยู่ที่ tail แล้ว

ตัวอย่างรูปแบบ prompt:

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

วิธีนี้สวยงามน้อยกว่า native Codex history surgery แต่ implement ได้ภายใน OpenClaw และรักษา semantics ของ context-engine

การปรับปรุงในอนาคต: หาก Codex app-server เปิดเผย protocol สำหรับแทนที่หรือเสริม thread history ให้เปลี่ยน projection layer นี้ไปใช้ API นั้น

### 3. Wire bootstrap ก่อน Codex thread startup

ใน `extensions/codex/src/app-server/run-attempt.ts`:

- อ่าน mirrored session history เหมือนปัจจุบัน
- กำหนดว่าไฟล์เซสชันมีอยู่ก่อน run นี้หรือไม่ ควรใช้ helper ที่ตรวจ `fs.stat(params.sessionFile)` ก่อน mirror writes
- เปิด `SessionManager` หรือใช้ narrow session manager adapter หาก helper ต้องการ
- เรียก neutral bootstrap helper เมื่อมี `params.contextEngine`

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

ใช้ convention ของ `sessionKey` เดียวกับ Codex tool bridge และ transcript mirror ปัจจุบัน Codex คำนวณ `sandboxSessionKey` จาก `params.sessionKey` หรือ `params.sessionId`; ใช้ค่านี้อย่างสม่ำเสมอ เว้นแต่มีเหตุผลให้รักษา raw `params.sessionKey`

### 4. Wire assemble ก่อน `thread/start` / `thread/resume` และ `turn/start`

ใน `runCodexAppServerAttempt`:

1. สร้าง dynamic tools ก่อน เพื่อให้ context engine เห็นชื่อเครื่องมือจริงที่พร้อมใช้งาน
2. อ่าน mirrored session history
3. รัน context-engine `assemble(...)` เมื่อมี `params.contextEngine`
4. Project ผลลัพธ์ที่ assemble แล้วเป็น:
   - developer instruction addition
   - prompt text สำหรับ `turn/start`

hook call ที่มีอยู่:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

ควรกลายเป็น context-aware:

1. คำนวณ base developer instructions ด้วย `buildDeveloperInstructions(params)`
2. apply context-engine assembly/projection
3. รัน `before_prompt_build` ด้วย projected prompt/developer instructions

ลำดับนี้ทำให้ generic prompt hooks เห็น prompt เดียวกับที่ Codex จะได้รับ หากเราต้องการ strict PI parity ให้รัน context-engine assembly ก่อน hook composition เพราะ PI apply context-engine `systemPromptAddition` กับ final system prompt หลัง prompt pipeline ของมัน invariant สำคัญคือทั้ง context engine และ hooks ได้ลำดับที่ deterministic และมีเอกสารกำกับ

ลำดับที่แนะนำสำหรับ implementation แรก:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. append/prepend `systemPromptAddition` ไปยัง developer instructions
4. project assembled messages เป็น prompt text
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. ส่ง final developer instructions ไปยัง `startOrResumeThread(...)`
7. ส่ง final prompt text ไปยัง `buildTurnStartParams(...)`

spec ควรถูก encode ใน tests เพื่อไม่ให้การเปลี่ยนแปลงในอนาคต reorder โดยไม่ตั้งใจ

### 5. รักษา formatting ที่ stable สำหรับ prompt-cache

projection helper ต้องสร้าง output ที่ byte-stable สำหรับ inputs ที่เหมือนกัน:

- ลำดับ message ที่ stable
- role labels ที่ stable
- ไม่มี generated timestamps
- ไม่มี object key order leakage
- ไม่มี random delimiters
- ไม่มี per-run ids

ใช้ fixed delimiters และ sections ที่ชัดเจน

### 6. Wire post-turn หลัง transcript mirroring

Codex `CodexAppServerEventProjector` สร้าง `messagesSnapshot` ภายในสำหรับ
turn ปัจจุบัน `mirrorTranscriptBestEffort(...)` เขียน snapshot นั้นลงใน
transcript mirror ของ OpenClaw

หลังจากการ mirror สำเร็จหรือล้มเหลว ให้เรียก context-engine finalizer ด้วย
message snapshot ที่ดีที่สุดที่มี:

- เลือกใช้ context ของ session ที่ mirror แล้วแบบเต็มหลังจากเขียนก่อน เพราะ `afterTurn`
  คาดหวัง snapshot ของ session ไม่ใช่เฉพาะ turn ปัจจุบัน
- fallback เป็น `historyMessages + result.messagesSnapshot` หากเปิดไฟล์ session
  ซ้ำไม่ได้

Pseudo-flow:

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

หากการ mirror ล้มเหลว ยังคงเรียก `afterTurn` ด้วย fallback snapshot แต่ให้บันทึกว่า
context engine กำลัง ingest จากข้อมูล turn fallback

### 7. ปรับ usage และ runtime context ของ prompt-cache ให้เป็นมาตรฐาน

ผลลัพธ์ของ Codex มี usage ที่ปรับเป็นมาตรฐานจาก token notification ของ app-server เมื่อ
มีให้ใช้ ส่ง usage นั้นเข้าไปใน runtime context ของ context-engine

หากในที่สุด Codex app-server เปิดเผยรายละเอียดการอ่าน/เขียน cache ให้ map รายละเอียดนั้นเข้า
`ContextEnginePromptCacheInfo` จนกว่าจะถึงตอนนั้น ให้ละ `promptCache` แทนการ
สร้างค่าศูนย์ขึ้นมาเอง

### 8. นโยบาย Compaction

มีระบบ Compaction สองระบบ:

1. `compact()` ของ context-engine ใน OpenClaw
2. `thread/compact/start` แบบ native ของ Codex app-server

อย่ารวมสองอย่างนี้เข้าด้วยกันแบบเงียบ ๆ

#### `/compact` และ Compaction ของ OpenClaw แบบ explicit

เมื่อ context engine ที่เลือกมี `info.ownsCompaction === true` Compaction ของ
OpenClaw แบบ explicit ควรเลือกใช้ผลลัพธ์ `compact()` ของ context engine เป็นหลักสำหรับ
transcript mirror ของ OpenClaw และ state ของ Plugin

เมื่อ Codex harness ที่เลือกมี native thread binding เราอาจ request Compaction แบบ native
ของ Codex เพิ่มเติมเพื่อให้ thread ของ app-server ยังอยู่ในสภาพดี แต่ต้องรายงานสิ่งนี้เป็น
backend action แยกต่างหากในรายละเอียด

พฤติกรรมที่แนะนำ:

- หาก `contextEngine.info.ownsCompaction === true`:
  - เรียก `compact()` ของ context-engine ก่อน
  - จากนั้นเรียก Compaction แบบ native ของ Codex แบบ best-effort เมื่อมี thread binding
  - คืนผลลัพธ์ของ context-engine เป็นผลลัพธ์หลัก
  - ใส่สถานะ Compaction แบบ native ของ Codex ใน `details.codexNativeCompaction`
- หาก context engine ที่ active ไม่ได้เป็นเจ้าของ Compaction:
  - รักษาพฤติกรรม Compaction แบบ native ของ Codex ปัจจุบันไว้

สิ่งนี้น่าจะต้องเปลี่ยน `extensions/codex/src/app-server/compact.ts` หรือ
ห่อจากเส้นทาง Compaction ทั่วไป ขึ้นอยู่กับว่า
`maybeCompactAgentHarnessSession(...)` ถูก invoke ที่ไหน

#### เหตุการณ์ contextCompaction แบบ native ของ Codex ระหว่าง turn

Codex อาจ emit เหตุการณ์ item แบบ `contextCompaction` ระหว่าง turn ให้คงการ emit hook
Compaction before/after ปัจจุบันใน `event-projector.ts` แต่ไม่ต้องถือว่าสิ่งนั้นเป็น
Compaction ของ context-engine ที่เสร็จสมบูรณ์แล้ว

สำหรับ engine ที่เป็นเจ้าของ Compaction ให้ emit diagnostic แบบ explicit เมื่อ Codex ทำ
Compaction แบบ native อยู่ดี:

- ชื่อ stream/event: stream `compaction` ที่มีอยู่ยอมรับได้
- รายละเอียด: `{ backend: "codex-app-server", ownsCompaction: true }`

สิ่งนี้ทำให้ตรวจสอบการแยกส่วนได้

### 9. การ reset session และพฤติกรรม binding

`reset(...)` ของ Codex harness ที่มีอยู่จะล้าง Codex app-server binding ออกจาก
ไฟล์ session ของ OpenClaw ให้รักษาพฤติกรรมนั้นไว้

และต้องให้แน่ใจว่าการ cleanup state ของ context-engine ยังคงเกิดขึ้นผ่านเส้นทาง lifecycle
ของ session OpenClaw ที่มีอยู่ อย่าเพิ่ม cleanup เฉพาะ Codex เว้นแต่ lifecycle ของ
context-engine ปัจจุบันจะพลาดเหตุการณ์ reset/delete สำหรับทุก harness

### 10. การจัดการข้อผิดพลาด

ทำตาม semantics ของ PI:

- bootstrap failures เตือนและดำเนินต่อ
- assemble failures เตือนและ fallback ไปยัง pipeline messages/prompt ที่ยังไม่ได้ assemble
- afterTurn/ingest failures เตือนและทำเครื่องหมาย post-turn finalization ว่าไม่สำเร็จ
- maintenance ทำงานเฉพาะหลังจาก turn ที่สำเร็จ ไม่ถูก abort และไม่ใช่ yield turns
- compaction errors ไม่ควรถูก retry เป็น prompt ใหม่

ส่วนเพิ่มเติมเฉพาะ Codex:

- หาก context projection ล้มเหลว ให้เตือนและ fallback ไปยัง prompt เดิม
- หาก transcript mirror ล้มเหลว ยังพยายาม finalization ของ context-engine ด้วย
  fallback messages
- หาก Compaction แบบ native ของ Codex ล้มเหลวหลังจาก Compaction ของ context-engine สำเร็จ
  อย่าทำให้ Compaction ทั้งหมดของ OpenClaw ล้มเหลวเมื่อ context engine เป็นตัวหลัก

## แผนการทดสอบ

### Unit tests

เพิ่ม tests ภายใต้ `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex เรียก `bootstrap` เมื่อมีไฟล์ session อยู่
   - Codex เรียก `assemble` พร้อม mirrored messages, token budget, tool names,
     citations mode, model id และ prompt
   - `systemPromptAddition` รวมอยู่ใน developer instructions
   - Assembled messages ถูก project เข้าไปใน prompt ก่อน request ปัจจุบัน
   - Codex เรียก `afterTurn` หลัง transcript mirroring
   - หากไม่มี `afterTurn` Codex เรียก `ingestBatch` หรือ `ingest` ราย message
   - Turn maintenance ทำงานหลัง turn ที่สำเร็จ
   - Turn maintenance ไม่ทำงานเมื่อมี prompt error, abort หรือ yield abort

2. `context-engine-projection.test.ts`
   - output คงที่สำหรับ input ที่เหมือนกัน
   - ไม่มี current prompt ซ้ำเมื่อ assembled history มีอยู่แล้ว
   - รองรับ history ว่าง
   - รักษาลำดับ role
   - ใส่ system prompt addition เฉพาะใน developer instructions

3. `compact.context-engine.test.ts`
   - ผลลัพธ์หลักของ context engine ที่เป็นเจ้าของชนะ
   - สถานะ Compaction แบบ native ของ Codex ปรากฏในรายละเอียดเมื่อมีการพยายามด้วย
   - ความล้มเหลวแบบ native ของ Codex ไม่ทำให้ Compaction ของ context-engine ที่เป็นเจ้าของล้มเหลว
   - context engine ที่ไม่ได้เป็นเจ้าของรักษาพฤติกรรม Compaction แบบ native ปัจจุบันไว้

### Tests ที่มีอยู่ที่ต้องอัปเดต

- `extensions/codex/src/app-server/run-attempt.test.ts` หากมีอยู่ มิฉะนั้นใช้
  tests การ run ของ Codex app-server ที่ใกล้ที่สุด
- `extensions/codex/src/app-server/event-projector.test.ts` เฉพาะเมื่อรายละเอียดเหตุการณ์
  Compaction เปลี่ยน
- `src/agents/harness/selection.test.ts` ไม่ควรต้องเปลี่ยน เว้นแต่พฤติกรรม config
  เปลี่ยน ควรคงเสถียร
- Tests context-engine ของ PI ควรผ่านต่อไปโดยไม่เปลี่ยนแปลง

### Integration / live tests

เพิ่มหรือขยาย live Codex harness smoke tests:

- configure `plugins.slots.contextEngine` เป็น test engine
- configure `agents.defaults.model` เป็น model `codex/*`
- configure `agents.defaults.embeddedHarness.runtime = "codex"`
- assert ว่า test engine สังเกตเห็น:
  - bootstrap
  - assemble
  - afterTurn หรือ ingest
  - maintenance

หลีกเลี่ยงการต้องใช้ lossless-claw ใน core tests ของ OpenClaw ใช้ fake
context engine plugin ขนาดเล็กใน repo

## Observability

เพิ่ม debug logs รอบการเรียก lifecycle ของ Codex context-engine:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` พร้อมเหตุผล
- `codex native compaction completed alongside context-engine compaction`

หลีกเลี่ยงการ log prompt หรือ transcript contents แบบเต็ม

เพิ่ม structured fields เมื่อมีประโยชน์:

- `sessionId`
- `sessionKey` redacted หรือละไว้ตามแนวปฏิบัติการ logging ที่มีอยู่
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## การ migration / ความเข้ากันได้

สิ่งนี้ควร backward-compatible:

- หากไม่มี context engine ถูก configure พฤติกรรม context engine แบบ legacy ควรเทียบเท่ากับ
  พฤติกรรม Codex harness ในปัจจุบัน
- หาก `assemble` ของ context-engine ล้มเหลว Codex ควรดำเนินต่อด้วยเส้นทาง
  prompt เดิม
- Codex thread bindings ที่มีอยู่ควรยัง valid
- Dynamic tool fingerprinting ไม่ควรรวม output ของ context-engine มิฉะนั้น
  การเปลี่ยน context ทุกครั้งอาจบังคับให้เกิด Codex thread ใหม่ ควรให้เฉพาะ tool catalog
  มีผลต่อ dynamic tool fingerprint

## คำถามที่ยังเปิดอยู่

1. ควร inject assembled context ทั้งหมดเข้า user prompt ทั้งหมดเข้า
   developer instructions หรือ split?

   คำแนะนำ: split ใส่ `systemPromptAddition` ใน developer instructions;
   ใส่ assembled transcript context ใน user prompt wrapper วิธีนี้ตรงกับ
   protocol ของ Codex ปัจจุบันที่สุดโดยไม่ mutate native thread history

2. ควรปิดใช้งาน Compaction แบบ native ของ Codex เมื่อ context engine เป็นเจ้าของ
   Compaction หรือไม่?

   คำแนะนำ: ไม่ใช่ในตอนแรก Compaction แบบ native ของ Codex อาจยังจำเป็นเพื่อให้
   thread ของ app-server ยังทำงานได้ แต่ต้องรายงานเป็น Compaction แบบ native ของ Codex
   ไม่ใช่ Compaction ของ context-engine

3. `before_prompt_build` ควรรันก่อนหรือหลัง context-engine assembly?

   คำแนะนำ: หลัง context-engine projection สำหรับ Codex เพื่อให้ generic harness
   hooks เห็น prompt/developer instructions จริงที่ Codex จะได้รับ หาก parity กับ PI
   ต้องการตรงกันข้าม ให้ encode ลำดับที่เลือกใน tests และ document ไว้ที่นี่

4. Codex app-server สามารถรับ structured context/history override ในอนาคตได้หรือไม่?

   ไม่ทราบ หากทำได้ ให้แทนที่ text projection layer ด้วย protocol นั้นและ
   คง lifecycle calls ไว้เหมือนเดิม

## Acceptance criteria

- turn ของ embedded harness `codex/*` invoke lifecycle assemble ของ context engine
  ที่เลือก
- `systemPromptAddition` ของ context-engine ส่งผลต่อ developer instructions ของ Codex
- Assembled context ส่งผลต่อ input ของ Codex turn อย่างกำหนดซ้ำได้
- Codex turns ที่สำเร็จเรียก `afterTurn` หรือ ingest fallback
- Codex turns ที่สำเร็จรัน turn maintenance ของ context-engine
- turns ที่ failed/aborted/yield-aborted ไม่รัน turn maintenance
- Compaction ที่ context-engine เป็นเจ้าของยังเป็นตัวหลักสำหรับ state ของ OpenClaw/Plugin
- Compaction แบบ native ของ Codex ยังคงตรวจสอบได้ในฐานะพฤติกรรม native ของ Codex
- พฤติกรรม context-engine ของ PI ที่มีอยู่ไม่เปลี่ยนแปลง
- พฤติกรรม Codex harness ที่มีอยู่ไม่เปลี่ยนแปลงเมื่อไม่ได้เลือก context engine
  ที่ไม่ใช่ legacy หรือเมื่อ assembly ล้มเหลว
