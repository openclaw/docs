---
read_when:
    - आप Codex हार्नेस में context-engine lifecycle व्यवहार जोड़ रहे हैं
    - codex/* अंतर्निहित हार्नेस सत्रों के साथ काम करने के लिए आपको lossless-claw या किसी अन्य context-engine Plugin की आवश्यकता है
    - आप एम्बेडेड OpenClaw और Codex ऐप-सर्वर संदर्भ व्यवहार की तुलना कर रहे हैं
summary: बंडल किए गए Codex app-server harness को OpenClaw context-engine Plugin का सम्मान कराने के लिए विनिर्देश
title: Codex Harness संदर्भ इंजन पोर्ट
x-i18n:
    generated_at: "2026-06-28T23:26:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## स्थिति

मसौदा कार्यान्वयन विनिर्देश।

## लक्ष्य

बंडल किए गए Codex ऐप-सर्वर हार्नेस से वही OpenClaw संदर्भ-इंजन
लाइफसाइकल अनुबंध मान्य कराना, जिसे एम्बेडेड OpenClaw टर्न पहले से मानते हैं।

`agentRuntime.id: "codex"` प्रदाता/मॉडल या `codex/*` मॉडल का उपयोग करने वाला
सेशन अब भी चुने गए संदर्भ-इंजन Plugin, जैसे
`lossless-claw`, को संदर्भ असेंबली, टर्न के बाद ingest, रखरखाव, और
Codex ऐप-सर्वर सीमा जितनी अनुमति देती है उतनी OpenClaw-स्तरीय Compaction नीति
नियंत्रित करने देना चाहिए।

## गैर-लक्ष्य

- Codex ऐप-सर्वर के आंतरिक हिस्सों को दोबारा लागू न करें।
- Codex native थ्रेड Compaction से lossless-claw सारांश उत्पन्न न कराएं।
- गैर-Codex मॉडलों के लिए Codex हार्नेस का उपयोग आवश्यक न करें।
- ACP/acpx सेशन व्यवहार न बदलें। यह विनिर्देश केवल
  गैर-ACP एम्बेडेड एजेंट हार्नेस पथ के लिए है।
- तृतीय-पक्ष Plugins से Codex ऐप-सर्वर एक्सटेंशन फैक्टरियां रजिस्टर न कराएं;
  मौजूदा बंडल्ड-Plugin विश्वास सीमा अपरिवर्तित रहती है।

## मौजूदा आर्किटेक्चर

एम्बेडेड रन लूप ठोस निम्न-स्तरीय हार्नेस चुनने से पहले हर रन में कॉन्फ़िगर किए गए संदर्भ इंजन को एक बार रिज़ॉल्व करता है:

- `src/agents/embedded-agent-runner/run.ts`
  - संदर्भ-इंजन Plugins आरंभ करता है
  - `resolveContextEngine(params.config)` कॉल करता है
  - `contextEngine` और `contextTokenBudget` को
    `runEmbeddedAttemptWithBackend(...)` में पास करता है

`runEmbeddedAttemptWithBackend(...)` चुने गए एजेंट हार्नेस को सौंपता है:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex ऐप-सर्वर हार्नेस बंडल्ड Codex Plugin द्वारा रजिस्टर किया जाता है:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex हार्नेस कार्यान्वयन को वही `EmbeddedRunAttemptParams` मिलते हैं
जो बिल्ट-इन OpenClaw attempts को मिलते हैं:

- `extensions/codex/src/app-server/run-attempt.ts`

इसका मतलब है कि आवश्यक हुक बिंदु OpenClaw-नियंत्रित कोड में है। बाहरी
सीमा Codex ऐप-सर्वर प्रोटोकॉल स्वयं है: OpenClaw नियंत्रित कर सकता है कि वह
`thread/start`, `thread/resume`, और `turn/start` को क्या भेजता है, और
notifications देख सकता है, लेकिन वह Codex के आंतरिक थ्रेड स्टोर या native
compactor को बदल नहीं सकता।

## मौजूदा अंतर

बिल्ट-इन OpenClaw attempts संदर्भ-इंजन लाइफसाइकल को सीधे कॉल करते हैं:

- attempt से पहले bootstrap/maintenance
- मॉडल कॉल से पहले assemble
- attempt के बाद afterTurn या ingest
- सफल टर्न के बाद maintenance
- उन इंजनों के लिए संदर्भ-इंजन Compaction जो Compaction के स्वामी हैं

संबंधित OpenClaw कोड:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex ऐप-सर्वर attempts वर्तमान में सामान्य एजेंट-हार्नेस हुक चलाते हैं और
transcript को mirror करते हैं, लेकिन `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, या
`params.contextEngine.maintain` को कॉल नहीं करते।

संबंधित Codex कोड:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## वांछित व्यवहार

Codex हार्नेस टर्न के लिए, OpenClaw को यह लाइफसाइकल सुरक्षित रखनी चाहिए:

1. mirrored OpenClaw सेशन transcript पढ़ें।
2. पिछले सेशन की फ़ाइल मौजूद होने पर सक्रिय संदर्भ इंजन को bootstrap करें।
3. उपलब्ध होने पर bootstrap maintenance चलाएं।
4. सक्रिय संदर्भ इंजन का उपयोग करके संदर्भ assemble करें।
5. assembled संदर्भ को Codex-संगत inputs में बदलें।
6. Codex थ्रेड को उन developer instructions के साथ start या resume करें जिनमें कोई भी
   संदर्भ-इंजन `systemPromptAddition` शामिल हो।
7. assembled user-facing prompt के साथ Codex टर्न शुरू करें।
8. Codex परिणाम को वापस OpenClaw transcript में mirror करें।
9. लागू हो तो `afterTurn` कॉल करें, अन्यथा mirrored transcript snapshot का उपयोग करके
   `ingestBatch`/`ingest` कॉल करें।
10. सफल non-aborted टर्न के बाद turn maintenance चलाएं।
11. Codex native Compaction संकेत और OpenClaw Compaction हुक सुरक्षित रखें।

## डिज़ाइन बाधाएं

### Codex ऐप-सर्वर native थ्रेड state के लिए canonical रहता है

Codex अपने native थ्रेड और किसी भी आंतरिक विस्तारित history का स्वामी है। OpenClaw को
समर्थित प्रोटोकॉल calls के अलावा ऐप-सर्वर की आंतरिक history को mutate करने की कोशिश
नहीं करनी चाहिए।

OpenClaw का transcript mirror OpenClaw सुविधाओं के लिए स्रोत रहता है:

- chat history
- search
- `/new` और `/reset` bookkeeping
- भविष्य में मॉडल या हार्नेस switching
- संदर्भ-इंजन Plugin state

### संदर्भ इंजन assembly को Codex inputs में project करना होगा

संदर्भ-इंजन interface OpenClaw `AgentMessage[]` लौटाता है, Codex
thread patch नहीं। Codex ऐप-सर्वर `turn/start` current user input स्वीकार करता है, जबकि
`thread/start` और `thread/resume` developer instructions स्वीकार करते हैं।

इसलिए कार्यान्वयन को projection layer चाहिए। सुरक्षित पहला version
यह दिखावा करने से बचना चाहिए कि वह Codex की आंतरिक history बदल सकता है। उसे
मौजूदा टर्न के आसपास deterministic prompt/developer-instruction सामग्री के रूप में
assembled context inject करना चाहिए।

### Prompt-cache stability महत्वपूर्ण है

lossless-claw जैसे इंजनों के लिए, assembled context अपरिवर्तित inputs के लिए
deterministic होना चाहिए। generated context text में timestamps, random ids, या
nondeterministic ordering न जोड़ें।

### Runtime selection semantics नहीं बदलते

हार्नेस चयन जैसा है वैसा ही रहता है:

- `runtime: "openclaw"` बिल्ट-इन OpenClaw हार्नेस चुनता है
- `runtime: "codex"` registered Codex हार्नेस चुनता है
- `runtime: "auto"` Plugin हार्नेस को supported providers claim करने देता है
- unmatched `auto` runs बिल्ट-इन OpenClaw हार्नेस का उपयोग करते हैं

यह कार्य Codex हार्नेस चुने जाने के बाद होने वाली चीज़ों को बदलता है।

## कार्यान्वयन योजना

### 1. पुनः उपयोग योग्य संदर्भ-इंजन attempt helpers को export या relocate करें

आज reusable lifecycle helpers embedded agent runner के अंतर्गत रहते हैं:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex को runner implementation details में पहुंचने के बजाय harness-neutral helpers
import करने चाहिए।

एक harness-neutral module बनाएं, उदाहरण के लिए:

- `src/agents/harness/context-engine-lifecycle.ts`

Move या re-export करें:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` के चारों ओर एक छोटा wrapper

उसी PR में बिल्ट-इन हार्नेस call sites अपडेट करें।

Neutral helper names में बिल्ट-इन हार्नेस का उल्लेख नहीं होना चाहिए।

सुझाए गए नाम:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex context projection helper जोड़ें

नया module जोड़ें:

- `extensions/codex/src/app-server/context-engine-projection.ts`

ज़िम्मेदारियां:

- assembled `AgentMessage[]`, original mirrored history, और current
  prompt स्वीकार करें।
- तय करें कि कौन-सा संदर्भ developer instructions में जाएगा और कौन-सा current user
  input में।
- मौजूदा user prompt को अंतिम actionable request के रूप में सुरक्षित रखें।
- पिछले messages को stable, explicit format में render करें।
- volatile metadata से बचें।

प्रस्तावित API:

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

अनुशंसित पहला projection:

- `systemPromptAddition` को developer instructions में रखें।
- current prompt से पहले assembled transcript context को `promptText` में रखें।
- इसे OpenClaw assembled context के रूप में स्पष्ट label करें।
- current prompt को अंत में रखें।
- अगर duplicate current user prompt पहले से tail पर दिखाई देता है तो उसे exclude करें।

Example prompt shape:

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

यह native Codex history surgery जितना elegant नहीं है, लेकिन यह OpenClaw के भीतर
implementable है और संदर्भ-इंजन semantics सुरक्षित रखता है।

भविष्य का सुधार: अगर Codex ऐप-सर्वर thread history को replace या supplement करने के लिए
protocol expose करता है, तो इस projection layer को उस API का उपयोग करने के लिए बदलें।

### 3. Codex थ्रेड startup से पहले bootstrap wire करें

`extensions/codex/src/app-server/run-attempt.ts` में:

- आज की तरह mirrored session history पढ़ें।
- यह निर्धारित करें कि इस run से पहले session file मौजूद थी या नहीं। ऐसा helper prefer करें
  जो mirroring writes से पहले `fs.stat(params.sessionFile)` check करे।
- `SessionManager` खोलें या helper को इसकी आवश्यकता हो तो narrow session manager adapter उपयोग करें।
- `params.contextEngine` मौजूद होने पर neutral bootstrap helper call करें।

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

Codex tool bridge और transcript mirror जैसी `sessionKey` convention का उपयोग करें।
आज Codex `sandboxSessionKey` को `params.sessionKey` या
`params.sessionId` से compute करता है; इसे consistently उपयोग करें जब तक raw
`params.sessionKey` preserve करने का कोई कारण न हो।

### 4. `thread/start` / `thread/resume` और `turn/start` से पहले assemble wire करें

`runCodexAppServerAttempt` में:

1. Dynamic tools पहले build करें, ताकि context engine actual available
   tool names देख सके।
2. Mirrored session history पढ़ें।
3. `params.contextEngine` मौजूद होने पर context-engine `assemble(...)` चलाएं।
4. Assembled result को इनमें project करें:
   - developer instruction addition
   - `turn/start` के लिए prompt text

मौजूदा hook call:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

context-aware बनना चाहिए:

1. `buildDeveloperInstructions(params)` के साथ base developer instructions compute करें
2. context-engine assembly/projection apply करें
3. projected prompt/developer instructions के साथ `before_prompt_build` चलाएं

यह order generic prompt hooks को वही prompt देखने देता है जो Codex को मिलेगा। अगर
strict OpenClaw parity चाहिए, तो hook composition से पहले context-engine assembly चलाएं,
क्योंकि बिल्ट-इन हार्नेस अपने prompt pipeline के बाद context-engine
`systemPromptAddition` को final system prompt पर apply करता है। महत्वपूर्ण invariant यह है
कि context engine और hooks दोनों को deterministic, documented order मिले।

पहले implementation के लिए अनुशंसित order:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. developer instructions में `systemPromptAddition` append/prepend करें
4. assembled messages को prompt text में project करें
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. final developer instructions को `startOrResumeThread(...)` में pass करें
7. final prompt text को `buildTurnStartParams(...)` में pass करें

Spec को tests में encode किया जाना चाहिए ताकि future changes गलती से इसे reorder न करें।

### 5. Prompt-cache stable formatting सुरक्षित रखें

Projection helper को समान inputs के लिए byte-stable output बनाना होगा:

- stable message order
- stable role labels
- कोई generated timestamps नहीं
- कोई object key order leakage नहीं
- कोई random delimiters नहीं
- कोई per-run ids नहीं

Fixed delimiters और explicit sections उपयोग करें।

### 6. Transcript mirroring के बाद post-turn wire करें

Codex का `CodexAppServerEventProjector` वर्तमान turn के लिए स्थानीय `messagesSnapshot` बनाता है। `mirrorTranscriptBestEffort(...)` उस snapshot को OpenClaw transcript mirror में लिखता है।

Mirroring सफल या विफल होने के बाद, उपलब्ध सर्वोत्तम message snapshot के साथ context-engine finalizer को कॉल करें:

- write के बाद पूर्ण mirrored session context को प्राथमिकता दें, क्योंकि `afterTurn` session snapshot की अपेक्षा करता है, केवल वर्तमान turn की नहीं।
- यदि session file फिर से नहीं खोली जा सकती, तो `historyMessages + result.messagesSnapshot` पर fall back करें।

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

यदि mirroring विफल हो, तब भी fallback snapshot के साथ `afterTurn` को कॉल करें, लेकिन log करें कि context engine fallback turn data से ingest कर रहा है।

### 7. usage और prompt-cache runtime context को normalize करें

Codex results में उपलब्ध होने पर app-server token notifications से normalized usage शामिल होता है। उस usage को context-engine runtime context में पास करें।

यदि Codex app-server अंततः cache read/write details expose करता है, तो उन्हें `ContextEnginePromptCacheInfo` में map करें। तब तक, zeros गढ़ने के बजाय `promptCache` को omit करें।

### 8. Compaction नीति

दो compaction systems हैं:

1. OpenClaw context-engine `compact()`
2. Codex app-server native `thread/compact/start`

उन्हें चुपचाप एक जैसा न मानें।

#### `/compact` और explicit OpenClaw compaction

जब selected context engine में `info.ownsCompaction === true` हो, तो explicit OpenClaw compaction को OpenClaw transcript mirror और plugin state के लिए context engine के `compact()` result को प्राथमिकता देनी चाहिए।

जब selected Codex harness के पास native thread binding हो, तो हम app-server thread को स्वस्थ रखने के लिए अतिरिक्त रूप से Codex native compaction का request कर सकते हैं, लेकिन इसे details में अलग backend action के रूप में report करना होगा।

अनुशंसित behavior:

- यदि `contextEngine.info.ownsCompaction === true`:
  - पहले context-engine `compact()` कॉल करें
  - फिर thread binding मौजूद होने पर best-effort Codex native compaction call करें
  - context-engine result को primary result के रूप में return करें
  - `details.codexNativeCompaction` में Codex native compaction status शामिल करें
- यदि active context engine compaction own नहीं करता:
  - मौजूदा Codex native compaction behavior सुरक्षित रखें

यह संभवतः `extensions/codex/src/app-server/compact.ts` बदलने या generic compaction path से उसे wrap करने की मांग करता है, यह इस पर निर्भर करता है कि `maybeCompactAgentHarnessSession(...)` कहाँ invoke होता है।

#### In-turn Codex native contextCompaction events

Codex किसी turn के दौरान `contextCompaction` item events emit कर सकता है। `event-projector.ts` में मौजूदा before/after compaction hook emission बनाए रखें, लेकिन उसे completed context-engine compaction के रूप में treat न करें।

जो engines compaction own करते हैं, उनके लिए जब Codex फिर भी native compaction करता है, तो explicit diagnostic emit करें:

- stream/event name: मौजूदा `compaction` stream स्वीकार्य है
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

यह split को auditable बनाता है।

### 9. Session reset और binding behavior

मौजूदा Codex harness `reset(...)` OpenClaw session file से Codex app-server binding clear करता है। यह behavior बनाए रखें।

यह भी सुनिश्चित करें कि context-engine state cleanup मौजूदा OpenClaw session lifecycle paths के माध्यम से होता रहे। Codex-specific cleanup न जोड़ें, जब तक context-engine lifecycle वर्तमान में सभी harnesses के लिए reset/delete events miss न करता हो।

### 10. Error handling

Built-in OpenClaw semantics का पालन करें:

- bootstrap failures warn करते हैं और continue करते हैं
- assemble failures warn करते हैं और unassembled pipeline messages/prompt पर fall back करते हैं
- afterTurn/ingest failures warn करते हैं और post-turn finalization को unsuccessful mark करते हैं
- maintenance केवल successful, non-aborted, non-yield turns के बाद चलती है
- compaction errors को fresh prompts के रूप में retry नहीं किया जाना चाहिए

Codex-specific additions:

- यदि context projection विफल हो, तो warn करें और original prompt पर fall back करें।
- यदि transcript mirror विफल हो, तब भी fallback messages के साथ context-engine finalization का प्रयास करें।
- यदि context-engine compaction सफल होने के बाद Codex native compaction विफल हो, तो जब context engine primary हो, पूरे OpenClaw compaction को fail न करें।

## Test plan

### Unit tests

`extensions/codex/src/app-server` के अंतर्गत tests जोड़ें:

1. `run-attempt.context-engine.test.ts`
   - session file मौजूद होने पर Codex `bootstrap` कॉल करता है।
   - Codex mirrored messages, token budget, tool names, citations mode, model id, और prompt के साथ `assemble` कॉल करता है।
   - `systemPromptAddition` developer instructions में शामिल होता है।
   - Assembled messages वर्तमान request से पहले prompt में project किए जाते हैं।
   - Codex transcript mirroring के बाद `afterTurn` कॉल करता है।
   - `afterTurn` के बिना, Codex `ingestBatch` या per-message `ingest` कॉल करता है।
   - Turn maintenance successful turns के बाद चलती है।
   - Turn maintenance prompt error, abort, या yield abort पर नहीं चलती।

2. `context-engine-projection.test.ts`
   - समान inputs के लिए stable output
   - जब assembled history में current prompt शामिल हो, तो duplicate current prompt नहीं
   - empty history संभालता है
   - role order सुरक्षित रखता है
   - system prompt addition केवल developer instructions में शामिल करता है

3. `compact.context-engine.test.ts`
   - owning context engine primary result जीतता है
   - साथ में attempt किए जाने पर details में Codex native compaction status दिखाई देता है
   - Codex native failure owning context-engine compaction को fail नहीं करता
   - non-owning context engine मौजूदा native compaction behavior सुरक्षित रखता है

### Update करने के लिए मौजूदा tests

- `extensions/codex/src/app-server/run-attempt.test.ts` यदि मौजूद हो, अन्यथा निकटतम Codex app-server run tests।
- `extensions/codex/src/app-server/event-projector.test.ts` केवल तब जब compaction event details बदलें।
- `src/agents/harness/selection.test.ts` में changes की आवश्यकता नहीं होनी चाहिए, जब तक config behavior न बदले; इसे stable रहना चाहिए।
- Built-in harness context-engine tests बिना बदलाव pass होते रहने चाहिए।

### Integration / live tests

Live Codex harness smoke tests जोड़ें या extend करें:

- `plugins.slots.contextEngine` को test engine पर configure करें
- `agents.defaults.model` को `codex/*` model पर configure करें
- provider/model `agentRuntime.id = "codex"` configure करें
- assert करें कि test engine ने देखा:
  - bootstrap
  - assemble
  - afterTurn या ingest
  - maintenance

OpenClaw core tests में lossless-claw की आवश्यकता से बचें। छोटे in-repo fake context engine plugin का उपयोग करें।

## Observability

Codex context-engine lifecycle calls के आसपास debug logs जोड़ें:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` with reason
- `codex native compaction completed alongside context-engine compaction`

Full prompts या transcript contents log करने से बचें।

जहाँ उपयोगी हो, structured fields जोड़ें:

- `sessionId`
- `sessionKey` existing logging practice के अनुसार redacted या omitted
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / compatibility

यह backward-compatible होना चाहिए:

- यदि कोई context engine configured नहीं है, तो legacy context engine behavior आज के Codex harness behavior के equivalent होना चाहिए।
- यदि context-engine `assemble` विफल हो, तो Codex original prompt path के साथ continue करना चाहिए।
- मौजूदा Codex thread bindings valid रहने चाहिए।
- Dynamic tool fingerprinting में context-engine output शामिल नहीं होना चाहिए; अन्यथा हर context change नया Codex thread force कर सकता है। केवल tool catalog को dynamic tool fingerprint को affect करना चाहिए।

## Open questions

1. क्या assembled context को पूरी तरह user prompt में, पूरी तरह developer instructions में, या split करके inject किया जाना चाहिए?

   Recommendation: split. `systemPromptAddition` को developer instructions में रखें; assembled transcript context को user prompt wrapper में रखें। यह native thread history mutate किए बिना current Codex protocol से सबसे अच्छा match करता है।

2. क्या context engine के compaction own करने पर Codex native compaction disable कर देना चाहिए?

   Recommendation: नहीं, शुरुआत में नहीं। App-server thread को alive रखने के लिए Codex native compaction फिर भी आवश्यक हो सकता है। लेकिन इसे native Codex compaction के रूप में report किया जाना चाहिए, context-engine compaction के रूप में नहीं।

3. क्या `before_prompt_build` context-engine assembly से पहले चले या बाद में?

   Recommendation: Codex के लिए context-engine projection के बाद, ताकि generic harness hooks वही actual prompt/developer instructions देखें जो Codex को मिलेंगे। यदि built-in harness parity इसके विपरीत order की मांग करती है, तो चुने गए order को tests में encode करें और यहाँ document करें।

4. क्या Codex app-server भविष्य में structured context/history override accept कर सकता है?

   Unknown. यदि कर सकता है, तो text projection layer को उस protocol से replace करें और lifecycle calls unchanged रखें।

## Acceptance criteria

- एक `codex/*` embedded harness turn selected context engine के assemble lifecycle को invoke करता है।
- context-engine `systemPromptAddition` Codex developer instructions को affect करता है।
- Assembled context Codex turn input को deterministically affect करता है।
- Successful Codex turns `afterTurn` या ingest fallback call करते हैं।
- Successful Codex turns context-engine turn maintenance चलाते हैं।
- Failed/aborted/yield-aborted turns turn maintenance नहीं चलाते।
- Context-engine-owned compaction OpenClaw/plugin state के लिए primary रहता है।
- Codex native compaction native Codex behavior के रूप में auditable रहता है।
- मौजूदा built-in harness context-engine behavior unchanged है।
- जब कोई non-legacy context engine selected नहीं है या assembly विफल होती है, तो मौजूदा Codex harness behavior unchanged है।
