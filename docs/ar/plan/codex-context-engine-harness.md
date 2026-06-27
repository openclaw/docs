---
read_when:
    - أنت تدمج سلوك دورة حياة محرك السياق في حزمة Codex الاختبارية
    - تحتاج إلى lossless-claw أو Plugin آخر لمحرك السياق للعمل مع جلسات الحاضنة المضمّنة codex/*
    - أنت تقارن سلوك السياق بين OpenClaw المضمّن وخادم تطبيق Codex.
summary: مواصفة لجعل حزمة أدوات خادم تطبيق Codex المضمنة تراعي Plugins محرك السياق في OpenClaw
title: منفذ محرك سياق حاضنة Codex
x-i18n:
    generated_at: "2026-06-27T17:56:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## الحالة

مواصفة تنفيذ مسودة.

## الهدف

جعل حزمة أداة تطبيق الخادم الخاصة بـ Codex تحترم عقد دورة حياة محرك السياق نفسه في OpenClaw الذي تحترمه بالفعل دورات OpenClaw المضمّنة.

يجب أن تظل الجلسة التي تستخدم المزوّد/النموذج `agentRuntime.id: "codex"` أو نموذج `codex/*` تتيح لـ Plugin محرك السياق المحدد، مثل `lossless-claw`، التحكم في تجميع السياق، واستيعاب ما بعد الدورة، والصيانة، وسياسة Compaction على مستوى OpenClaw بقدر ما تسمح به حدود تطبيق الخادم في Codex.

## غير الأهداف

- لا تُعد تنفيذ الأجزاء الداخلية لتطبيق الخادم في Codex.
- لا تجعل Compaction الأصلي لسلسلة Codex ينتج ملخص `lossless-claw`.
- لا تطلب من النماذج غير Codex استخدام أداة Codex.
- لا تغيّر سلوك جلسات ACP/acpx. هذه المواصفة مخصصة فقط لمسار أداة الوكيل المضمّن غير ACP.
- لا تجعل Plugins الجهات الخارجية تسجل مصانع امتدادات تطبيق الخادم في Codex؛ يظل حد الثقة الحالي الخاص بـ Plugin المضمّن دون تغيير.

## البنية الحالية

تحل حلقة التشغيل المضمّنة محرك السياق المهيأ مرة واحدة لكل تشغيل قبل اختيار أداة منخفضة المستوى ملموسة:

- `src/agents/embedded-agent-runner/run.ts`
  - تهيّئ Plugins محرك السياق
  - تستدعي `resolveContextEngine(params.config)`
  - تمرر `contextEngine` و`contextTokenBudget` إلى
    `runEmbeddedAttemptWithBackend(...)`

يفوّض `runEmbeddedAttemptWithBackend(...)` إلى أداة الوكيل المحددة:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

تسجل حزمة Plugin الخاصة بـ Codex أداة تطبيق الخادم في Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

يتلقى تنفيذ أداة Codex نفس `EmbeddedRunAttemptParams` التي تتلقاها محاولات OpenClaw المدمجة:

- `extensions/codex/src/app-server/run-attempt.ts`

يعني ذلك أن نقطة الربط المطلوبة موجودة في كود تتحكم به OpenClaw. الحد الخارجي هو بروتوكول تطبيق الخادم في Codex نفسه: يمكن لـ OpenClaw التحكم فيما ترسله إلى `thread/start` و`thread/resume` و`turn/start`، ويمكنها مراقبة الإشعارات، لكنها لا تستطيع تغيير مخزن السلاسل الداخلي في Codex أو أداة Compaction الأصلية.

## الفجوة الحالية

تستدعي محاولات OpenClaw المدمجة دورة حياة محرك السياق مباشرة:

- التمهيد/الصيانة قبل المحاولة
- التجميع قبل استدعاء النموذج
- afterTurn أو الاستيعاب بعد المحاولة
- الصيانة بعد دورة ناجحة
- Compaction محرك السياق للمحركات التي تملك Compaction

كود OpenClaw ذي الصلة:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

تشغّل محاولات تطبيق الخادم في Codex حاليًا خطافات أداة الوكيل العامة وتعكس النص المنسوخ، لكنها لا تستدعي `params.contextEngine.bootstrap` أو `params.contextEngine.assemble` أو `params.contextEngine.afterTurn` أو `params.contextEngine.ingestBatch` أو `params.contextEngine.ingest` أو
`params.contextEngine.maintain`.

كود Codex ذي الصلة:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## السلوك المطلوب

بالنسبة إلى دورات أداة Codex، يجب أن تحافظ OpenClaw على دورة الحياة هذه:

1. قراءة نص جلسة OpenClaw المنعكس.
2. تمهيد محرك السياق النشط عند وجود ملف جلسة سابق.
3. تشغيل صيانة التمهيد عند توفرها.
4. تجميع السياق باستخدام محرك السياق النشط.
5. تحويل السياق المجمّع إلى مدخلات متوافقة مع Codex.
6. بدء سلسلة Codex أو استئنافها بتعليمات مطوّر تتضمن أي
   `systemPromptAddition` من محرك السياق.
7. بدء دورة Codex بالموجّه المجمّع المواجه للمستخدم.
8. عكس نتيجة Codex مرة أخرى إلى نص OpenClaw.
9. استدعاء `afterTurn` إذا كان منفذًا، وإلا `ingestBatch`/`ingest`، باستخدام لقطة النص المنعكس.
10. تشغيل صيانة الدورة بعد الدورات الناجحة غير المُجهضة.
11. الحفاظ على إشارات Compaction الأصلية في Codex وخطافات Compaction في OpenClaw.

## قيود التصميم

### يظل تطبيق الخادم في Codex هو المصدر المعتمد لحالة السلسلة الأصلية

يمتلك Codex سلسلته الأصلية وأي سجل داخلي ممتد. يجب ألا تحاول OpenClaw تعديل السجل الداخلي لتطبيق الخادم إلا عبر استدعاءات البروتوكول المدعومة.

يظل انعكاس نص OpenClaw هو المصدر لميزات OpenClaw:

- سجل المحادثة
- البحث
- مسك دفاتر `/new` و`/reset`
- تبديل النموذج أو الأداة مستقبلًا
- حالة Plugin محرك السياق

### يجب إسقاط تجميع محرك السياق في مدخلات Codex

تعيد واجهة محرك السياق `AgentMessage[]` في OpenClaw، لا رقعة سلسلة Codex. يقبل `turn/start` في تطبيق الخادم في Codex إدخال المستخدم الحالي، بينما يقبل `thread/start` و`thread/resume` تعليمات المطوّر.

لذلك يحتاج التنفيذ إلى طبقة إسقاط. يجب أن تتجنب النسخة الأولى الآمنة الادعاء بأنها تستطيع استبدال سجل Codex الداخلي. يجب أن تحقن السياق المجمّع كمادة حتمية للموجّه/تعليمات المطوّر حول الدورة الحالية.

### استقرار ذاكرة التخزين المؤقت للموجّه مهم

بالنسبة إلى محركات مثل lossless-claw، يجب أن يكون السياق المجمّع حتميًا للمدخلات غير المتغيرة. لا تضف طوابع زمنية أو معرفات عشوائية أو ترتيبًا غير حتمي إلى نص السياق المُولّد.

### لا تتغير دلالات اختيار وقت التشغيل

يبقى اختيار الأداة كما هو:

- `runtime: "openclaw"` يحدد أداة OpenClaw المدمجة
- `runtime: "codex"` يحدد أداة Codex المسجلة
- `runtime: "auto"` يتيح لأدوات Plugins المطالبة بالمزوّدين المدعومين
- تشغيلات `auto` غير المطابقة تستخدم أداة OpenClaw المدمجة

يغيّر هذا العمل ما يحدث بعد اختيار أداة Codex.

## خطة التنفيذ

### 1. تصدير أو نقل مساعدين قابلين لإعادة الاستخدام لمحاولات محرك السياق

اليوم يعيش مساعدو دورة الحياة القابلون لإعادة الاستخدام ضمن مشغّل الوكيل المضمّن:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

يجب أن يستورد Codex مساعدين محايدين للأداة بدل الوصول إلى تفاصيل تنفيذ المشغّل.

أنشئ وحدة محايدة للأداة، مثلًا:

- `src/agents/harness/context-engine-lifecycle.ts`

انقل أو أعد تصدير:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- غلافًا صغيرًا حول `runContextEngineMaintenance`

حدّث مواقع استدعاء الأداة المدمجة في طلب السحب نفسه.

يجب ألا تذكر أسماء المساعدين المحايدة الأداة المدمجة.

الأسماء المقترحة:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. إضافة مساعد إسقاط سياق Codex

أضف وحدة جديدة:

- `extensions/codex/src/app-server/context-engine-projection.ts`

المسؤوليات:

- قبول `AgentMessage[]` المجمّعة، والسجل المنعكس الأصلي، والموجّه الحالي.
- تحديد أي سياق ينتمي إلى تعليمات المطوّر مقابل إدخال المستخدم الحالي.
- الحفاظ على موجّه المستخدم الحالي بصفته الطلب النهائي القابل للتنفيذ.
- عرض الرسائل السابقة بتنسيق ثابت وصريح.
- تجنب البيانات الوصفية المتقلبة.

واجهة API المقترحة:

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

- ضع `systemPromptAddition` في تعليمات المطوّر.
- ضع سياق النص المجمّع قبل الموجّه الحالي في `promptText`.
- صنّفه بوضوح كسياق مجمّع من OpenClaw.
- أبقِ الموجّه الحالي أخيرًا.
- استبعد موجّه المستخدم الحالي المكرر إذا كان يظهر بالفعل في الذيل.

شكل الموجّه المثال:

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

هذا أقل أناقة من جراحة سجل Codex الأصلية، لكنه قابل للتنفيذ داخل OpenClaw ويحافظ على دلالات محرك السياق.

تحسين مستقبلي: إذا كشف تطبيق الخادم في Codex بروتوكولًا لاستبدال سجل السلسلة أو استكماله، فبدّل طبقة الإسقاط هذه لاستخدام واجهة API تلك.

### 3. ربط التمهيد قبل بدء سلسلة Codex

في `extensions/codex/src/app-server/run-attempt.ts`:

- اقرأ سجل الجلسة المنعكس كما يحدث اليوم.
- حدد ما إذا كان ملف الجلسة موجودًا قبل هذا التشغيل. فضّل مساعدًا يتحقق من `fs.stat(params.sessionFile)` قبل كتابات الانعكاس.
- افتح `SessionManager` أو استخدم محوّل مدير جلسة ضيقًا إذا كان المساعد يتطلبه.
- استدعِ مساعد التمهيد المحايد عند وجود `params.contextEngine`.

التدفق شبه البرمجي:

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

استخدم اصطلاح `sessionKey` نفسه الذي يستخدمه جسر أدوات Codex وانعكاس النص. يحسب Codex اليوم `sandboxSessionKey` من `params.sessionKey` أو `params.sessionId`؛ استخدم ذلك باتساق ما لم يوجد سبب للحفاظ على `params.sessionKey` الخام.

### 4. ربط التجميع قبل `thread/start` / `thread/resume` و`turn/start`

في `runCodexAppServerAttempt`:

1. ابنِ الأدوات الديناميكية أولًا، لكي يرى محرك السياق أسماء الأدوات الفعلية المتاحة.
2. اقرأ سجل الجلسة المنعكس.
3. شغّل `assemble(...)` لمحرك السياق عند وجود `params.contextEngine`.
4. أسقط النتيجة المجمّعة في:
   - إضافة تعليمات المطوّر
   - نص الموجّه لـ `turn/start`

يجب أن يصبح استدعاء الخطاف الحالي:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

واعيًا بالسياق:

1. احسب تعليمات المطوّر الأساسية باستخدام `buildDeveloperInstructions(params)`
2. طبّق تجميع/إسقاط محرك السياق
3. شغّل `before_prompt_build` بالموجّه/تعليمات المطوّر المسقطة

يتيح هذا الترتيب لخطافات الموجّه العامة رؤية الموجّه نفسه الذي سيتلقاه Codex. إذا احتجنا إلى تكافؤ صارم مع OpenClaw، فشغّل تجميع محرك السياق قبل تركيب الخطاف، لأن الأداة المدمجة تطبّق
`systemPromptAddition` من محرك السياق على موجّه النظام النهائي بعد خط أنابيب الموجّه الخاص بها. الثابت المهم هو أن يحصل كل من محرك السياق والخطافات على ترتيب حتمي وموثق.

الترتيب الموصى به للتنفيذ الأول:

1. `buildDeveloperInstructions(params)`
2. `assemble()` لمحرك السياق
3. إلحاق/إضافة `systemPromptAddition` إلى تعليمات المطوّر
4. إسقاط الرسائل المجمّعة في نص الموجّه
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. تمرير تعليمات المطوّر النهائية إلى `startOrResumeThread(...)`
7. تمرير نص الموجّه النهائي إلى `buildTurnStartParams(...)`

يجب ترميز المواصفة في الاختبارات كي لا تعيد التغييرات المستقبلية ترتيبها عن طريق الخطأ.

### 5. الحفاظ على تنسيق مستقر لذاكرة التخزين المؤقت للموجّه

يجب أن ينتج مساعد الإسقاط خرجًا مستقرًا على مستوى البايت للمدخلات المتطابقة:

- ترتيب رسائل ثابت
- تسميات أدوار ثابتة
- بلا طوابع زمنية مولّدة
- بلا تسرب لترتيب مفاتيح الكائنات
- بلا محددات عشوائية
- بلا معرفات لكل تشغيل

استخدم محددات ثابتة وأقسامًا صريحة.

### 6. ربط ما بعد الدورة بعد انعكاس النص

يبني `CodexAppServerEventProjector` في Codex لقطة `messagesSnapshot` محلية للدورة
الحالية. تكتب `mirrorTranscriptBestEffort(...)` تلك اللقطة في مرآة نص OpenClaw.

بعد نجاح النسخ إلى المرآة أو فشله، استدعِ المنهي الخاص بمحرك السياق باستخدام أفضل
لقطة رسائل متاحة:

- فضّل سياق الجلسة المنسوخ بالكامل إلى المرآة بعد الكتابة، لأن `afterTurn`
  يتوقع لقطة الجلسة، وليس الدورة الحالية فقط.
- ارجع إلى `historyMessages + result.messagesSnapshot` إذا تعذر إعادة فتح ملف
  الجلسة.

التدفق الزائف:

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

إذا فشل النسخ إلى المرآة، فاستدعِ `afterTurn` مع اللقطة الاحتياطية مع ذلك، لكن سجّل
أن محرك السياق يستوعب البيانات من بيانات الدورة الاحتياطية.

### 7. طبّع الاستخدام وسياق وقت تشغيل ذاكرة تخزين المطالبات المؤقتة

تتضمن نتائج Codex استخداما مطبعا من إشعارات رموز خادم التطبيق عندما تكون
متاحة. مرّر ذلك الاستخدام إلى سياق وقت تشغيل محرك السياق.

إذا كشف خادم تطبيق Codex لاحقا تفاصيل قراءة/كتابة ذاكرة التخزين المؤقت، فحوّلها إلى
`ContextEnginePromptCacheInfo`. إلى ذلك الحين، احذف `promptCache` بدلا من
اختراع أصفار.

### 8. سياسة Compaction

يوجد نظاما Compaction:

1. `compact()` الخاص بمحرك سياق OpenClaw
2. `thread/compact/start` الأصلي الخاص بخادم تطبيق Codex

لا تدمجهما بصمت.

#### `/compact` وCompaction الصريح في OpenClaw

عندما يكون لمحرك السياق المحدد `info.ownsCompaction === true`، يجب أن يفضّل
Compaction الصريح في OpenClaw نتيجة `compact()` الخاصة بمحرك السياق لمرآة نص
OpenClaw وحالة Plugin.

عندما يكون لحزمة Codex المحددة ربط مؤشر ترابط أصلي، قد نطلب أيضا Compaction
الأصلي من Codex للحفاظ على سلامة مؤشر ترابط خادم التطبيق، لكن يجب الإبلاغ عن
ذلك كإجراء خلفية منفصل في التفاصيل.

السلوك الموصى به:

- إذا كان `contextEngine.info.ownsCompaction === true`:
  - استدعِ `compact()` الخاص بمحرك السياق أولا
  - ثم استدعِ Compaction الأصلي من Codex بأفضل جهد عند وجود ربط مؤشر ترابط
  - أعد نتيجة محرك السياق باعتبارها النتيجة الأساسية
  - ضمّن حالة Compaction الأصلي من Codex في `details.codexNativeCompaction`
- إذا لم يكن محرك السياق النشط يملك Compaction:
  - حافظ على سلوك Compaction الأصلي الحالي في Codex

يتطلب هذا على الأرجح تغيير `extensions/codex/src/app-server/compact.ts` أو
تغليفه من مسار Compaction العام، بحسب موضع استدعاء
`maybeCompactAgentHarnessSession(...)`.

#### أحداث `contextCompaction` الأصلية من Codex أثناء الدورة

قد يصدر Codex أحداث عناصر `contextCompaction` أثناء الدورة. أبقِ إصدار خطاف
Compaction قبل/بعد الحالي في `event-projector.ts`، لكن لا تتعامل معه على أنه
Compaction مكتمل لمحرك السياق.

بالنسبة إلى المحركات التي تملك Compaction، أصدر تشخيصا صريحا عندما ينفذ Codex
Compaction الأصلي على أي حال:

- اسم التدفق/الحدث: تدفق `compaction` الحالي مقبول
- التفاصيل: `{ backend: "codex-app-server", ownsCompaction: true }`

يجعل هذا الفصل قابلا للتدقيق.

### 9. إعادة ضبط الجلسة وسلوك الربط

يمسح `reset(...)` الحالي في حزمة Codex ربط خادم تطبيق Codex من ملف جلسة
OpenClaw. حافظ على هذا السلوك.

تأكد أيضا من استمرار حدوث تنظيف حالة محرك السياق عبر مسارات دورة حياة جلسة
OpenClaw الحالية. لا تضف تنظيفا خاصا بـ Codex إلا إذا كانت دورة حياة محرك السياق
لا تلتقط حاليا أحداث إعادة الضبط/الحذف لكل الحزم.

### 10. معالجة الأخطاء

اتبع دلالات OpenClaw المضمنة:

- تحذر إخفاقات التمهيد وتستمر
- تحذر إخفاقات التجميع وتعود إلى رسائل/مطالبة مسار المعالجة غير المجمعة
- تحذر إخفاقات `afterTurn`/الاستيعاب وتضع علامة على فشل الإنهاء بعد الدورة
- لا تعمل الصيانة إلا بعد الدورات الناجحة وغير الملغاة وغير دورات التنازل
- يجب عدم إعادة محاولة أخطاء Compaction كمطالبات جديدة

إضافات خاصة بـ Codex:

- إذا فشل إسقاط السياق، فحذّر وارجع إلى المطالبة الأصلية.
- إذا فشلت مرآة النص، فحاول مع ذلك إنهاء محرك السياق باستخدام الرسائل الاحتياطية.
- إذا فشل Compaction الأصلي من Codex بعد نجاح Compaction الخاص بمحرك السياق،
  فلا تفشل Compaction الكامل في OpenClaw عندما يكون محرك السياق هو الأساسي.

## خطة الاختبار

### اختبارات الوحدة

أضف اختبارات ضمن `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - يستدعي Codex الدالة `bootstrap` عند وجود ملف جلسة.
   - يستدعي Codex الدالة `assemble` مع الرسائل المنعكسة، وميزانية الرموز، وأسماء الأدوات،
     ووضع الاستشهادات، ومعرّف النموذج، والموجّه.
   - يتم تضمين `systemPromptAddition` في تعليمات المطوّر.
   - تُسقط الرسائل المجمّعة في الموجّه قبل الطلب الحالي.
   - يستدعي Codex الدالة `afterTurn` بعد انعكاس النص المنسوخ.
   - من دون `afterTurn`، يستدعي Codex الدالة `ingestBatch` أو `ingest` لكل رسالة.
   - تعمل صيانة الدور بعد الأدوار الناجحة.
   - لا تعمل صيانة الدور عند خطأ الموجّه أو الإجهاض أو إجهاض التسليم.

2. `context-engine-projection.test.ts`
   - مخرجات مستقرة للمدخلات المتطابقة
   - عدم تكرار الموجّه الحالي عندما يتضمن السجل المجمّع ذلك
   - يتعامل مع السجل الفارغ
   - يحافظ على ترتيب الأدوار
   - يتضمن إضافة موجّه النظام في تعليمات المطوّر فقط

3. `compact.context-engine.test.ts`
   - النتيجة الأساسية لمحرك السياق المالك لها الأولوية
   - تظهر حالة Compaction الأصلية في Codex ضمن التفاصيل عند محاولة تنفيذها أيضًا
   - لا يؤدي فشل Codex الأصلي إلى فشل Compaction لمحرك السياق المالك
   - يحافظ محرك السياق غير المالك على سلوك Compaction الأصلي الحالي

### الاختبارات الحالية المطلوب تحديثها

- `extensions/codex/src/app-server/run-attempt.test.ts` إن وُجد، وإلا
  أقرب اختبارات تشغيل Codex app-server.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط إذا تغيرت
  تفاصيل حدث Compaction.
- ينبغي ألا يحتاج `src/agents/harness/selection.test.ts` إلى تغييرات إلا إذا تغير
  سلوك الإعدادات؛ ويجب أن يبقى مستقرًا.
- يجب أن تستمر اختبارات محرك السياق المضمنة في المرور من دون تغيير.

### اختبارات التكامل / الاختبارات الحية

أضف أو وسّع اختبارات الدخان الحية لحزمة Codex:

- اضبط `plugins.slots.contextEngine` على محرك اختبار
- اضبط `agents.defaults.model` على نموذج `codex/*`
- اضبط `agentRuntime.id = "codex"` للمزوّد/النموذج
- تأكد من أن محرك الاختبار لاحظ:
  - bootstrap
  - assemble
  - afterTurn أو ingest
  - maintenance

تجنّب طلب lossless-claw في اختبارات OpenClaw الأساسية. استخدم Plugin محرك
سياق وهميًا صغيرًا داخل المستودع.

## قابلية الملاحظة

أضف سجلات تصحيح حول استدعاءات دورة حياة محرك السياق في Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` مع السبب
- `codex native compaction completed alongside context-engine compaction`

تجنّب تسجيل الموجّهات الكاملة أو محتويات النصوص المنسوخة.

أضف حقولًا منظّمة حيث يكون ذلك مفيدًا:

- `sessionId`
- `sessionKey` منقّح أو محذوف وفقًا لممارسة التسجيل الحالية
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## الترحيل / التوافق

يجب أن يكون هذا متوافقًا مع الإصدارات السابقة:

- إذا لم يتم إعداد أي محرك سياق، فيجب أن يكون سلوك محرك السياق القديم
  مكافئًا لسلوك حزمة Codex الحالي.
- إذا فشلت `assemble` الخاصة بمحرك السياق، فيجب أن يواصل Codex عبر مسار
  الموجّه الأصلي.
- يجب أن تظل ارتباطات خيوط Codex الحالية صالحة.
- يجب ألا يتضمن أخذ بصمة الأدوات الديناميكية مخرجات محرك السياق؛ وإلا
  فقد يفرض كل تغيير في السياق إنشاء خيط Codex جديد. يجب أن يؤثر كتالوج الأدوات
  فقط في بصمة الأدوات الديناميكية.

## أسئلة مفتوحة

1. هل يجب حقن السياق المجمّع بالكامل في موجّه المستخدم، أم بالكامل
   في تعليمات المطوّر، أم تقسيمه؟

   التوصية: التقسيم. ضع `systemPromptAddition` في تعليمات المطوّر؛
   وضع سياق النص المنسوخ المجمّع في غلاف موجّه المستخدم. يطابق هذا بروتوكول
   Codex الحالي بأفضل شكل من دون تعديل سجل الخيط الأصلي.

2. هل يجب تعطيل Compaction الأصلي في Codex عندما يملك محرك سياق
   عملية Compaction؟

   التوصية: لا، ليس في البداية. قد يظل Compaction الأصلي في Codex
   ضروريًا لإبقاء خيط app-server حيًا. لكن يجب الإبلاغ عنه بوصفه
   Compaction أصليًا في Codex، لا بوصفه Compaction لمحرك السياق.

3. هل يجب تشغيل `before_prompt_build` قبل تجميع محرك السياق أم بعده؟

   التوصية: بعد إسقاط محرك السياق في Codex، حتى ترى خطافات الحزمة العامة
   الموجّه/تعليمات المطوّر الفعلية التي سيتلقاها Codex. إذا تطلب تكافؤ
   الحزمة المضمنة العكس، فقم بترميز الترتيب المختار في الاختبارات ووثّقه هنا.

4. هل يمكن أن يقبل Codex app-server تجاوزًا منظّمًا للسياق/السجل في المستقبل؟

   غير معروف. إذا كان ذلك ممكنًا، فاستبدل طبقة الإسقاط النصي بذلك البروتوكول
   وأبقِ استدعاءات دورة الحياة من دون تغيير.

## معايير القبول

- يستدعي دور حزمة مضمنة `codex/*` دورة حياة assemble لمحرك السياق المحدد.
- تؤثر `systemPromptAddition` الخاصة بمحرك السياق في تعليمات مطوّر Codex.
- يؤثر السياق المجمّع في مُدخل دور Codex بشكل حتمي.
- تستدعي أدوار Codex الناجحة `afterTurn` أو بديل ingest.
- تشغّل أدوار Codex الناجحة صيانة دور محرك السياق.
- لا تشغّل الأدوار الفاشلة/المجهضة/المجهضة عند التسليم صيانة الدور.
- تبقى Compaction المملوكة لمحرك السياق أساسية لحالة OpenClaw/Plugin.
- تبقى Compaction الأصلية في Codex قابلة للتدقيق بوصفها سلوك Codex أصليًا.
- لا يتغير سلوك محرك السياق في الحزمة المضمنة الحالية.
- لا يتغير سلوك حزمة Codex الحالي عندما لا يتم تحديد محرك سياق غير قديم
  أو عندما يفشل التجميع.
