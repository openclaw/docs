---
read_when:
    - أنت توصل سلوك دورة حياة محرك السياق إلى Codex harness
    - تحتاج إلى عمل lossless-claw أو Plugin آخر لمحرك السياق مع جلسات harness المضمّنة من codex/*
    - أنت تقارن سلوك السياق بين PI المضمّن وCodex app-server
summary: مواصفة لجعل harness المضمّن لـ Codex app-server يحترم Plugins الخاصة بمحرك السياق في OpenClaw
title: منفذ محرك السياق لـ Codex Harness
x-i18n:
    generated_at: "2026-04-24T07:51:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# منفذ محرك السياق لـ Codex Harness

## الحالة

مسودة مواصفة تنفيذ.

## الهدف

جعل app-server harness المضمّن لـ Codex يحترم عقد دورة حياة
محرك السياق نفسه في OpenClaw الذي تحترمه بالفعل دورات PI المضمّنة.

يجب أن تظل الجلسة التي تستخدم `agents.defaults.embeddedHarness.runtime: "codex"` أو
النموذج `codex/*` تسمح لـ Plugin محرك السياق المحدد، مثل
`lossless-claw`, بالتحكم في تجميع السياق، والاستيعاب بعد الدورة، والصيانة،
وسياسة Compaction على مستوى OpenClaw بالقدر الذي تسمح به حدود Codex app-server.

## غير الأهداف

- لا تعيد تنفيذ مكوّنات Codex app-server الداخلية.
- لا تجعل Compaction الأصلية لخيط Codex تنتج ملخصًا من lossless-claw.
- لا تشترط على النماذج غير Codex استخدام Codex harness.
- لا تغيّر سلوك جلسات ACP/acpx. فهذه المواصفة خاصة بمسار
  agent harness المضمّن غير ACP فقط.
- لا تجعل Plugins الخارجية تسجل factories لامتدادات Codex app-server؛
  إذ يبقى حد الثقة الحالي الخاص بـ Plugin المضمّن من دون تغيير.

## البنية الحالية

تحلّق حلقة التشغيل المضمّنة محرك السياق المهيأ مرة واحدة لكل تشغيل قبل
اختيار harness منخفضة المستوى الفعلية:

- `src/agents/pi-embedded-runner/run.ts`
  - يهيّئ Plugins محرك السياق
  - يستدعي `resolveContextEngine(params.config)`
  - يمرّر `contextEngine` و`contextTokenBudget` إلى
    `runEmbeddedAttemptWithBackend(...)`

وتقوم `runEmbeddedAttemptWithBackend(...)` بالتفويض إلى agent harness المحددة:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

يُسجَّل Codex app-server harness بواسطة Plugin Codex المضمّن:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

ويتلقى تنفيذ Codex harness نفس `EmbeddedRunAttemptParams`
التي تتلقاها محاولات PI المدعومة:

- `extensions/codex/src/app-server/run-attempt.ts`

وهذا يعني أن نقطة hook المطلوبة موجودة في شيفرة يتحكم بها OpenClaw. أما الحد
الخارجي فهو بروتوكول Codex app-server نفسه: يمكن لـ OpenClaw التحكم فيما
يرسله إلى `thread/start`, و`thread/resume`, و`turn/start`, ويمكنه
رصد الإشعارات، لكنه لا يستطيع تغيير متجر الخيوط الداخلي الخاص بـ Codex أو
المُضغِّط الأصلي.

## الفجوة الحالية

تستدعي محاولات PI المضمّنة دورة حياة محرك السياق مباشرةً:

- bootstrap/maintenance قبل المحاولة
- assemble قبل استدعاء النموذج
- afterTurn أو ingest بعد المحاولة
- maintenance بعد دورة ناجحة
- Compaction لمحرك السياق بالنسبة إلى المحركات التي تملك Compaction

شيفرة PI ذات الصلة:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

أما محاولات Codex app-server فتشغّل حاليًا hooks عامة خاصة بـ agent-harness وتعمل على mirror
لـ transcript, لكنها لا تستدعي `params.contextEngine.bootstrap`,
أو `params.contextEngine.assemble`, أو `params.contextEngine.afterTurn`,
أو `params.contextEngine.ingestBatch`, أو `params.contextEngine.ingest`, أو
`params.contextEngine.maintain`.

شيفرة Codex ذات الصلة:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## السلوك المطلوب

في دورات Codex harness، يجب على OpenClaw الحفاظ على دورة الحياة التالية:

1. قراءة transcript الجلسة المنعكسة في OpenClaw.
2. تنفيذ Bootstrap لمحرك السياق النشط عندما يوجد ملف جلسة سابق.
3. تشغيل bootstrap maintenance عندما تكون متاحة.
4. تجميع السياق باستخدام محرك السياق النشط.
5. تحويل السياق المجمّع إلى مدخلات متوافقة مع Codex.
6. بدء أو استئناف خيط Codex مع تعليمات للمطور تتضمن أي
   قيمة `systemPromptAddition` من محرك السياق.
7. بدء دورة Codex باستخدام prompt المجمّعة المواجهة للمستخدم.
8. عكس نتيجة Codex مرة أخرى إلى transcript الخاصة بـ OpenClaw.
9. استدعاء `afterTurn` إذا كانت مطبقة، وإلا `ingestBatch`/`ingest`, باستخدام
   لقطة transcript المنعكسة.
10. تشغيل maintenance الخاصة بالدورة بعد الدورات الناجحة غير المُجهَضة.
11. الحفاظ على إشارات Compaction الأصلية لـ Codex وhooks الخاصة بـ OpenClaw Compaction.

## قيود التصميم

### يظل Codex app-server مرجعًا قانونيًا لحالة الخيط الأصلية

يمتلك Codex خيطه الأصلي وأي سجل داخلي ممتد. ويجب على OpenClaw
ألا يحاول تعديل السجل الداخلي لـ app-server إلا عبر استدعاءات
بروتوكول مدعومة.

تظل transcript المنعكسة الخاصة بـ OpenClaw هي المصدر لميزات OpenClaw:

- سجل الدردشة
- البحث
- سجلات `/new` و`/reset`
- تبديل النموذج أو harness مستقبلًا
- حالة Plugin محرك السياق

### يجب إسقاط تجميع محرك السياق إلى مدخلات Codex

تعيد واجهة محرك السياق `AgentMessage[]` من OpenClaw، وليس تصحيحًا لخيط Codex. وتقبل `turn/start` في Codex app-server إدخال مستخدم حاليًا، بينما تقبل `thread/start` و`thread/resume` تعليمات للمطور.

ولذلك يحتاج التنفيذ إلى طبقة إسقاط. ويجب أن تتجنب النسخة الآمنة الأولى الادعاء بأنها تستطيع استبدال السجل الداخلي لـ Codex. بل يجب أن تحقن السياق المجمّع في صورة مادة prompt/تعليمات مطور حتمية تحيط بالدورة الحالية.

### استقرار Prompt-cache مهم

بالنسبة إلى محركات مثل lossless-claw, يجب أن يكون السياق المجمّع حتميًا
للمدخلات غير المتغيرة. لا تضف طوابع زمنية، أو معرّفات عشوائية، أو ترتيبًا غير حتمي إلى نص السياق المولّد.

### لا تتغير دلالات الرجوع الاحتياطي لـ PI

يبقى اختيار harness كما هو:

- `runtime: "pi"` يفرض PI
- `runtime: "codex"` يختار Codex harness المسجلة
- `runtime: "auto"` يسمح لـ plugin harness بالمطالبة بالمزوّدات المدعومة
- `fallback: "none"` يعطّل رجوع PI الاحتياطي عندما لا تتطابق أي plugin harness

يغيّر هذا العمل ما يحدث بعد اختيار Codex harness.

## خطة التنفيذ

### 1. تصدير أو نقل مساعدات محاولات محرك السياق القابلة لإعادة الاستخدام

تعيش مساعدات دورة الحياة القابلة لإعادة الاستخدام اليوم تحت PI runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

يجب ألا يستورد Codex من مسار تنفيذ يحمل اسمًا يوحي بـ PI إذا
استطعنا تجنب ذلك.

أنشئ وحدة محايدة بالنسبة إلى harness, مثلًا:

- `src/agents/harness/context-engine-lifecycle.ts`

انقل أو أعد تصدير:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- غلافًا صغيرًا حول `runContextEngineMaintenance`

أبقِ واردات PI تعمل إما عبر إعادة التصدير من الملفات القديمة أو عبر تحديث مواضع استدعاء PI في طلب السحب نفسه.

يجب ألا تذكر الأسماء المحايدة للمساعدات PI.

الأسماء المقترحة:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. إضافة مساعد إسقاط سياق لـ Codex

أضف وحدة جديدة:

- `extensions/codex/src/app-server/context-engine-projection.ts`

المسؤوليات:

- قبول `AgentMessage[]` المجمّعة، وسجل mirror الأصلي، وprompt الحالية.
- تحديد أي سياق يجب أن يذهب إلى تعليمات المطور مقابل إدخال المستخدم الحالي.
- الحفاظ على prompt المستخدم الحالية باعتبارها الطلب الإجرائي النهائي.
- عرض الرسائل السابقة بتنسيق ثابت وصريح.
- تجنب البيانات الوصفية المتغيرة.

الواجهة البرمجية المقترحة:

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

الإسقاط الأول الموصى به:

- ضع `systemPromptAddition` في تعليمات المطور.
- ضع سياق transcript المجمّع قبل prompt الحالية في `promptText`.
- ضع علامة واضحة عليه على أنه سياق OpenClaw مُجمّع.
- أبقِ prompt الحالية في النهاية.
- استبعد prompt المستخدم الحالية المكررة إذا كانت موجودة بالفعل في الذيل.

شكل prompt مقترح:

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

هذا أقل أناقة من الجراحة الأصلية على سجل Codex, لكنه قابل للتنفيذ
داخل OpenClaw ويحافظ على دلالات محرك السياق.

تحسين مستقبلي: إذا كشف Codex app-server عن بروتوكول لاستبدال
سجل الخيط أو استكماله، فاستبدل طبقة الإسقاط هذه لاستخدام تلك الواجهة البرمجية.

### 3. توصيل bootstrap قبل بدء خيط Codex

في `extensions/codex/src/app-server/run-attempt.ts`:

- اقرأ سجل الجلسة المنعكس كما هو اليوم.
- حدّد ما إذا كان ملف الجلسة موجودًا قبل هذا التشغيل. وفضّل مساعدًا
  يفحص `fs.stat(params.sessionFile)` قبل كتابات mirror.
- افتح `SessionManager` أو استخدم مهايئًا ضيقًا لمدير الجلسة إذا كان المساعد
  يتطلب ذلك.
- استدعِ المساعد المحايد bootstrap عندما توجد `params.contextEngine`.

تدفق شبه برمجي:

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

استخدم اصطلاح `sessionKey` نفسه الذي يستخدمه جسر أدوات Codex وmirror الخاصة بـ transcript. ويحسب Codex اليوم `sandboxSessionKey` من `params.sessionKey` أو
`params.sessionId`; فاستخدم ذلك بشكل متسق ما لم يكن هناك سبب للحفاظ على القيمة الخام `params.sessionKey`.

### 4. توصيل assemble قبل `thread/start` / `thread/resume` و`turn/start`

في `runCodexAppServerAttempt`:

1. ابنِ الأدوات الديناميكية أولًا، حتى يرى محرك السياق أسماء الأدوات الفعلية المتاحة.
2. اقرأ سجل mirror الخاص بالجلسة.
3. شغّل `assemble(...)` الخاصة بمحرك السياق عندما توجد `params.contextEngine`.
4. أسقط النتيجة المجمعة إلى:
   - إضافة تعليمات مطور
   - نص prompt لـ `turn/start`

يجب أن يصبح استدعاء hook الحالي:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

مدركًا للسياق:

1. احسب تعليمات المطور الأساسية باستخدام `buildDeveloperInstructions(params)`
2. طبّق تجميع/إسقاط محرك السياق
3. شغّل `before_prompt_build` باستخدام prompt/تعليمات المطور المسقطة

يتيح هذا الترتيب لـ hooks العامة الخاصة بـ prompt رؤية prompt نفسها التي سيتلقاها Codex. وإذا
احتجنا إلى تكافؤ صارم مع PI, فشغّل تجميع محرك السياق قبل تركيب hook,
لأن PI تطبق `systemPromptAddition` الخاصة بمحرك السياق على system prompt النهائية بعد خط أنابيب prompt لديها. والثابت المهم هو أن كلاً من محرك السياق وhooks يحصلان على ترتيب حتمي وموثّق.

الترتيب الموصى به للتنفيذ الأول:

1. `buildDeveloperInstructions(params)`
2. `assemble()` الخاصة بمحرك السياق
3. إلحاق/إضافة `systemPromptAddition` قبل تعليمات المطور
4. إسقاط الرسائل المجمعة إلى نص prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. تمرير تعليمات المطور النهائية إلى `startOrResumeThread(...)`
7. تمرير نص prompt النهائي إلى `buildTurnStartParams(...)`

يجب ترميز المواصفة في اختبارات حتى لا تعيد تغييرات مستقبلية ترتيبها عن طريق الخطأ.

### 5. الحفاظ على تنسيق Prompt-cache مستقر

يجب أن يُنتج مساعد الإسقاط مخرجات مستقرة بايتًا ببايت للمدخلات المتطابقة:

- ترتيب رسائل مستقر
- تسميات أدوار مستقرة
- بلا طوابع زمنية مولدة
- بلا تسرب لترتيب مفاتيح الكائنات
- بلا فواصل عشوائية
- بلا معرّفات لكل تشغيل

استخدم فواصل ثابتة وأقسامًا صريحة.

### 6. توصيل ما بعد الدورة بعد عكس transcript

يبني `CodexAppServerEventProjector` الخاص بـ Codex قيمة `messagesSnapshot` محلية للدورة
الحالية. وتكتب `mirrorTranscriptBestEffort(...)` تلك اللقطة في mirror الخاصة بـ transcript في OpenClaw.

بعد نجاح عملية mirror أو فشلها، استدعِ المُنهِي الخاص بمحرك السياق باستخدام
أفضل لقطة رسائل متاحة:

- فضّل سياق الجلسة المنعكس الكامل بعد الكتابة، لأن `afterTurn`
  تتوقع لقطة الجلسة، وليس الدورة الحالية فقط.
- عد احتياطيًا إلى `historyMessages + result.messagesSnapshot` إذا تعذر
  إعادة فتح ملف الجلسة.

تدفق شبه برمجي:

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

إذا فشلت عملية mirror, فاستدعِ `afterTurn` مع لقطة الرجوع الاحتياطي أيضًا، لكن سجّل
أن محرك السياق يستوعب من بيانات الدورة الاحتياطية.

### 7. تطبيع سياق وقت التشغيل الخاص بالاستخدام وPrompt-cache

تتضمن نتائج Codex استخدامًا مطبّعًا من إشعارات رموز app-server عندما
يكون متاحًا. مرّر هذا الاستخدام إلى سياق وقت التشغيل الخاص بمحرك السياق.

إذا كشف Codex app-server في النهاية عن تفاصيل قراءة/كتابة cache, فقم بربطها إلى
`ContextEnginePromptCacheInfo`. وحتى ذلك الحين، احذف `promptCache` بدلًا من
اختراع أصفار.

### 8. سياسة Compaction

هناك نظامان لـ Compaction:

1. `compact()` الخاصة بمحرك السياق في OpenClaw
2. ‏`thread/compact/start` الأصلية في Codex app-server

لا تخلط بينهما بصمت.

#### `/compact` وCompaction الصريحة في OpenClaw

عندما يحتوي محرك السياق المحدد على `info.ownsCompaction === true`, يجب أن تُفضّل
Compaction الصريحة في OpenClaw نتيجة `compact()` الخاصة بمحرك السياق بالنسبة إلى mirror الخاصة بـ transcript في OpenClaw وحالة Plugin.

وعندما تحتوي Codex harness المحددة على binding أصلية للخيط، فقد نطلب أيضًا
Compaction الأصلية في Codex، بأفضل جهد، للحفاظ على سلامة خيط app-server, لكن
يجب الإبلاغ عن ذلك بوصفه إجراءً خلفيًا منفصلًا في التفاصيل.

السلوك الموصى به:

- إذا كانت `contextEngine.info.ownsCompaction === true`:
  - استدعِ `compact()` الخاصة بمحرك السياق أولًا
  - ثم استدعِ Codex native compaction بأفضل جهد عندما يوجد binding للخيط
  - أعد نتيجة محرك السياق باعتبارها النتيجة الأساسية
  - أدرج حالة Codex native compaction في `details.codexNativeCompaction`
- إذا كان محرك السياق النشط لا يملك Compaction:
  - فاحتفظ بالسلوك الحالي لـ Codex native compaction

وهذا على الأرجح يتطلب تغيير `extensions/codex/src/app-server/compact.ts` أو
تغليفه من مسار Compaction العام، بحسب الموضع الذي
يُستدعى منه `maybeCompactAgentHarnessSession(...)`.

#### أحداث Codex الأصلية داخل الدورة الخاصة بـ contextCompaction

قد يصدر Codex أحداث عناصر `contextCompaction` أثناء الدورة. احتفظ بالإصدار الحالي لـ
hooks الخاصة بـ before/after compaction في `event-projector.ts`, لكن لا تتعامل
مع ذلك على أنه Compaction مكتملة خاصة بمحرك السياق.

وبالنسبة إلى المحركات التي تملك Compaction, فأصدر تشخيصًا صريحًا عندما ينفذ Codex
Compaction أصلية على أي حال:

- اسم stream/event: ‏stream الحالية `compaction` مقبولة
- التفاصيل: ‏`{ backend: "codex-app-server", ownsCompaction: true }`

وهذا يجعل الانقسام قابلًا للتدقيق.

### 9. سلوك إعادة تعيين الجلسة وbinding

يؤدي `reset(...)` الحالي في Codex harness إلى مسح Codex app-server binding من
ملف جلسة OpenClaw. حافظ على هذا السلوك.

وتأكد أيضًا من أن تنظيف حالة محرك السياق يستمر في الحدوث عبر مسارات دورة حياة الجلسة
الحالية في OpenClaw. ولا تضف تنظيفًا خاصًا بـ Codex ما لم تكن دورة حياة
محرك السياق تفوّت حاليًا أحداث reset/delete لجميع harnesses.

### 10. معالجة الأخطاء

اتبع دلالات PI:

- تفشل bootstrap مع تحذير ويستمر التنفيذ
- تفشل assemble مع تحذير والرجوع إلى رسائل/Prompt خط الأنابيب غير المجمعة
- تفشل afterTurn/ingest مع تحذير وتضع علامة على أن الإنهاء بعد الدورة غير ناجح
- تعمل maintenance فقط بعد الدورات الناجحة غير المُجهضة وغير المُوقفة مؤقتًا
- يجب ألا يُعادَت محاولة أخطاء Compaction باعتبارها prompts جديدة

إضافات خاصة بـ Codex:

- إذا فشل إسقاط السياق، فاحذر وعد إلى prompt الأصلية.
- إذا فشلت mirror الخاصة بـ transcript, فحاول مع ذلك إنهاء محرك السياق باستخدام
  الرسائل الاحتياطية.
- إذا فشلت Codex native compaction بعد نجاح Compaction الخاصة بمحرك السياق،
  فلا تفشل Compaction الكاملة في OpenClaw عندما يكون محرك السياق هو الأساسي.

## خطة الاختبار

### اختبارات الوحدة

أضف اختبارات تحت `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - يستدعي Codex الدالة `bootstrap` عندما يوجد ملف جلسة.
   - يستدعي Codex الدالة `assemble` مع الرسائل المنعكسة، وميزانية الرموز، وأسماء الأدوات،
     ووضع citations, ومعرّف النموذج، وprompt.
   - تُدرج `systemPromptAddition` في تعليمات المطور.
   - تُسقط الرسائل المجمعة إلى prompt قبل الطلب الحالي.
   - يستدعي Codex الدالة `afterTurn` بعد mirroring الخاصة بـ transcript.
   - من دون `afterTurn`, يستدعي Codex الدالة `ingestBatch` أو `ingest` لكل رسالة.
   - تعمل maintenance الخاصة بالدورة بعد الدورات الناجحة.
   - لا تعمل maintenance الخاصة بالدورة عند prompt error أو abort أو yield abort.

2. `context-engine-projection.test.ts`
   - مخرجات مستقرة للمدخلات المتطابقة
   - عدم تكرار prompt الحالية عندما يتضمن السجل المجمّع هذه prompt
   - التعامل مع سجل فارغ
   - الحفاظ على ترتيب الأدوار
   - تضمين system prompt addition في تعليمات المطور فقط

3. `compact.context-engine.test.ts`
   - تفوز النتيجة الأساسية لمحرك السياق المالك
   - تظهر حالة Codex native compaction في التفاصيل عندما تُجرَّب أيضًا
   - لا يؤدي فشل Codex native إلى فشل Compaction الخاصة بمحرك السياق المالك
   - يحافظ محرك السياق غير المالك على السلوك الحالي لـ native compaction

### الاختبارات الموجودة التي يجب تحديثها

- `extensions/codex/src/app-server/run-attempt.test.ts` إن وجدت، وإلا
  أقرب اختبارات تشغيل لـ Codex app-server.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط إذا تغيرت
  تفاصيل حدث Compaction.
- يجب ألا يحتاج `src/agents/harness/selection.test.ts` إلى تغييرات ما لم يتغير
  سلوك التهيئة؛ ويجب أن يبقى مستقرًا.
- يجب أن تستمر اختبارات PI الخاصة بمحرك السياق بالنجاح من دون تغيير.

### اختبارات التكامل / الاختبارات الحية

أضف أو وسّع اختبارات smoke الحية لـ Codex harness:

- هيّئ `plugins.slots.contextEngine` إلى محرك اختبار
- هيّئ `agents.defaults.model` إلى نموذج `codex/*`
- هيّئ `agents.defaults.embeddedHarness.runtime = "codex"`
- أكّد أن محرك الاختبار رصد:
  - bootstrap
  - assemble
  - afterTurn أو ingest
  - maintenance

تجنّب فرض lossless-claw في اختبارات core الخاصة بـ OpenClaw. استخدم
Plugin محرك سياق مزيّفًا صغيرًا داخل المستودع.

## الرصد

أضف سجلات تصحيح حول استدعاءات دورة حياة محرك السياق الخاصة بـ Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` مع السبب
- `codex native compaction completed alongside context-engine compaction`

تجنب تسجيل كامل prompts أو محتويات transcript.

أضف حقولًا منظّمة عند الحاجة:

- `sessionId`
- `sessionKey` مخفية أو محذوفة وفق ممارسة التسجيل الحالية
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## الترحيل / التوافق

يجب أن يكون هذا متوافقًا مع الإصدارات السابقة:

- إذا لم يكن أي محرك سياق مهيأ، فيجب أن يكون سلوك محرك السياق القديم
  مكافئًا لسلوك Codex harness الحالي.
- إذا فشلت `assemble` الخاصة بمحرك السياق، فيجب أن يستمر Codex في مسار
  prompt الأصلية.
- يجب أن تظل bindings الخيوط الحالية الخاصة بـ Codex صالحة.
- يجب ألا تتضمن Dynamic tool fingerprint ناتج محرك السياق؛ وإلا
  فإن كل تغيير في السياق قد يفرض خيط Codex جديدًا. ويجب أن يؤثر
  كتالوج الأدوات فقط في Dynamic tool fingerprint.

## أسئلة مفتوحة

1. هل يجب حقن السياق المجمّع بالكامل في prompt المستخدم، أم بالكامل
   في تعليمات المطور، أم تقسيمه؟

   التوصية: تقسيمه. ضع `systemPromptAddition` في تعليمات المطور؛
   وضع سياق transcript المجمّع في غلاف prompt المستخدم. وهذا يطابق أفضل
   بروتوكول Codex الحالي من دون تعديل السجل الأصلي للخيط.

2. هل يجب تعطيل Codex native compaction عندما يملك محرك السياق
   Compaction؟

   التوصية: لا، ليس في البداية. فقد تكون Codex native compaction ما تزال
   ضرورية لإبقاء خيط app-server حيًا. لكن يجب الإبلاغ عنها بوصفها
   Codex native compaction, لا بوصفها context-engine compaction.

3. هل يجب أن تعمل `before_prompt_build` قبل أم بعد تجميع محرك السياق؟

   التوصية: بعد إسقاط محرك السياق بالنسبة إلى Codex, حتى ترى hooks العامة الخاصة بـ harness
   الـ prompt/تعليمات المطور الفعلية التي سيتلقاها Codex. وإذا كانت مساواة PI
   تتطلب العكس، فشفّر الترتيب المختار في الاختبارات ووثقه
   هنا.

4. هل يستطيع Codex app-server قبول تجاوز منظّم مستقبلي للسياق/السجل؟

   غير معروف. وإذا كان يستطيع، فاستبدل طبقة الإسقاط النصية بتلك الواجهة البرمجية
   وأبقِ استدعاءات دورة الحياة من دون تغيير.

## معايير القبول

- تستدعي دورة harness مضمّنة من نوع `codex/*` دورة `assemble`
  الخاصة بمحرك السياق المحدد.
- تؤثر `systemPromptAddition` الخاصة بمحرك السياق في تعليمات المطور الخاصة بـ Codex.
- يؤثر السياق المجمّع في مدخلات دورة Codex بشكل حتمي.
- تستدعي دورات Codex الناجحة `afterTurn` أو الرجوع الاحتياطي لـ ingest.
- تشغّل دورات Codex الناجحة maintenance الخاصة بدورة محرك السياق.
- لا تشغّل الدورات الفاشلة/المجهضة/الموقفة مؤقتًا maintenance الخاصة بالدورة.
- تظل Compaction المملوكة لمحرك السياق أساسية بالنسبة إلى حالة OpenClaw/Plugin.
- تظل Codex native compaction قابلة للتدقيق بوصفها سلوك Codex أصليًا.
- يظل سلوك PI الخاص بمحرك السياق دون تغيير.
- يظل سلوك Codex harness الحالي دون تغيير عندما لا يكون أي محرك سياق غير قديم
  محددًا أو عندما تفشل assemble.
