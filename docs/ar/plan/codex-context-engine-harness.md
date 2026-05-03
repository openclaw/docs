---
read_when:
    - أنت تدمج سلوك دورة حياة محرك السياق في إطار تشغيل Codex
    - تحتاج إلى lossless-claw أو Plugin آخر لمحرك السياق للعمل مع جلسات أداة التشغيل المضمّنة الخاصة بـ codex/*
    - أنت تقارن سلوك السياق بين PI المضمّن وخادم تطبيق Codex
summary: مواصفة لجعل إطار اختبار خادم التطبيق المضمّن في Codex يراعي Plugins محرك السياق في OpenClaw
title: نقل محرك السياق إلى Codex Harness
x-i18n:
    generated_at: "2026-05-03T07:33:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## الحالة

مواصفة تنفيذ مسودة.

## الهدف

جعل عدة تشغيل خادم تطبيق Codex المضمنة تحترم عقد دورة حياة محرك السياق نفسه في OpenClaw الذي تحترمه بالفعل دورات PI المضمنة.

يجب أن تظل الجلسة التي تستخدم `agents.defaults.embeddedHarness.runtime: "codex"` أو نموذج `codex/*` تتيح لـ Plugin محرك السياق المحدد، مثل `lossless-claw`، التحكم في تجميع السياق، والاستيعاب بعد الدورة، والصيانة، وسياسة Compaction على مستوى OpenClaw بقدر ما تسمح به حدود خادم تطبيق Codex.

## خارج النطاق

- عدم إعادة تنفيذ الأجزاء الداخلية لخادم تطبيق Codex.
- عدم جعل Compaction الأصلي لسلسلة Codex ينتج ملخص `lossless-claw`.
- عدم إلزام النماذج غير Codex باستخدام عدة Codex.
- عدم تغيير سلوك جلسات ACP/acpx. هذه المواصفة مخصصة لمسار عدة الوكيل المضمن غير ACP فقط.
- عدم جعل Plugins الطرف الثالث تسجل مصانع امتداد لخادم تطبيق Codex؛ يظل حد الثقة الحالي لـ Plugin المضمن دون تغيير.

## البنية الحالية

تحل حلقة التشغيل المضمنة محرك السياق المكوّن مرة واحدة لكل تشغيل قبل اختيار عدة منخفضة المستوى ملموسة:

- `src/agents/pi-embedded-runner/run.ts`
  - تهيئ Plugins محرك السياق
  - تستدعي `resolveContextEngine(params.config)`
  - تمرر `contextEngine` و`contextTokenBudget` إلى
    `runEmbeddedAttemptWithBackend(...)`

تفوض `runEmbeddedAttemptWithBackend(...)` إلى عدة الوكيل المحددة:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

تسجل عدة خادم تطبيق Codex بواسطة Plugin Codex المضمن:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

يتلقى تنفيذ عدة Codex نفس `EmbeddedRunAttemptParams` مثل محاولات PI المدعومة:

- `extensions/codex/src/app-server/run-attempt.ts`

هذا يعني أن نقطة الربط المطلوبة موجودة في كود تتحكم به OpenClaw. الحد الخارجي هو بروتوكول خادم تطبيق Codex نفسه: يمكن لـ OpenClaw التحكم فيما ترسله إلى `thread/start` و`thread/resume` و`turn/start`، ويمكنها مراقبة الإشعارات، لكنها لا تستطيع تغيير مخزن سلاسل Codex الداخلي أو الضاغط الأصلي.

## الفجوة الحالية

تستدعي محاولات PI المضمنة دورة حياة محرك السياق مباشرة:

- التمهيد/الصيانة قبل المحاولة
- التجميع قبل استدعاء النموذج
- afterTurn أو الاستيعاب بعد المحاولة
- الصيانة بعد دورة ناجحة
- Compaction لمحرك السياق للمحركات التي تملك Compaction

كود PI ذو الصلة:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

تشغل محاولات خادم تطبيق Codex حاليا ربطات عدة الوكيل العامة وتعكس النص، لكنها لا تستدعي `params.contextEngine.bootstrap` أو `params.contextEngine.assemble` أو `params.contextEngine.afterTurn` أو `params.contextEngine.ingestBatch` أو `params.contextEngine.ingest` أو `params.contextEngine.maintain`.

كود Codex ذو الصلة:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## السلوك المطلوب

بالنسبة إلى دورات عدة Codex، يجب أن تحافظ OpenClaw على دورة الحياة هذه:

1. قراءة نص جلسة OpenClaw المعكوس.
2. تمهيد محرك السياق النشط عند وجود ملف جلسة سابق.
3. تشغيل صيانة التمهيد عند توفرها.
4. تجميع السياق باستخدام محرك السياق النشط.
5. تحويل السياق المجمع إلى مدخلات متوافقة مع Codex.
6. بدء سلسلة Codex أو استئنافها بتعليمات مطور تتضمن أي `systemPromptAddition` لمحرك السياق.
7. بدء دورة Codex بالمطالبة المجمعة المواجهة للمستخدم.
8. عكس نتيجة Codex مرة أخرى إلى نص OpenClaw.
9. استدعاء `afterTurn` إذا كان منفذا، وإلا `ingestBatch`/`ingest`، باستخدام لقطة النص المعكوس.
10. تشغيل صيانة الدورة بعد الدورات الناجحة غير الملغاة.
11. الحفاظ على إشارات Compaction الأصلية في Codex وربطات Compaction في OpenClaw.

## قيود التصميم

### يظل خادم تطبيق Codex المرجع الأساسي لحالة السلسلة الأصلية

يمتلك Codex سلسلته الأصلية وأي سجل موسع داخلي. يجب ألا تحاول OpenClaw تعديل السجل الداخلي لخادم التطبيق إلا عبر استدعاءات البروتوكول المدعومة.

يبقى انعكاس النص في OpenClaw هو المصدر لميزات OpenClaw:

- سجل المحادثة
- البحث
- مسك دفاتر `/new` و`/reset`
- تبديل النموذج أو العدة مستقبلا
- حالة Plugin محرك السياق

### يجب إسقاط تجميع محرك السياق إلى مدخلات Codex

تعيد واجهة محرك السياق `AgentMessage[]` في OpenClaw، وليس تصحيح سلسلة Codex. يقبل `turn/start` في خادم تطبيق Codex إدخال المستخدم الحالي، بينما يقبل `thread/start` و`thread/resume` تعليمات المطور.

لذلك يحتاج التنفيذ إلى طبقة إسقاط. يجب أن تتجنب النسخة الأولى الآمنة الادعاء بأنها تستطيع استبدال سجل Codex الداخلي. يجب أن تحقن السياق المجمع كمادة مطالبة/تعليمات مطور حتمية حول الدورة الحالية.

### استقرار ذاكرة المطالبات المخبئية مهم

بالنسبة إلى محركات مثل lossless-claw، يجب أن يكون السياق المجمع حتميا للمدخلات غير المتغيرة. لا تضف طوابع زمنية أو معرفات عشوائية أو ترتيبا غير حتمي إلى نص السياق المولد.

### دلالات اختيار وقت التشغيل لا تتغير

يبقى اختيار العدة كما هو:

- `runtime: "pi"` يفرض PI
- `runtime: "codex"` يختار عدة Codex المسجلة
- `runtime: "auto"` يتيح لعدد Plugins المطالبة بالموفرين المدعومين
- تشغيلات `auto` غير المطابقة تستخدم PI

يغير هذا العمل ما يحدث بعد اختيار عدة Codex.

## خطة التنفيذ

### 1. تصدير أو نقل مساعدات محاولة محرك السياق القابلة لإعادة الاستخدام

توجد مساعدات دورة الحياة القابلة لإعادة الاستخدام اليوم تحت مشغل PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

لا ينبغي أن يستورد Codex من مسار تنفيذ يوحي اسمه بـ PI إذا أمكن تجنب ذلك.

أنشئ وحدة محايدة للعدة، على سبيل المثال:

- `src/agents/harness/context-engine-lifecycle.ts`

انقل أو أعد تصدير:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- غلاف صغير حول `runContextEngineMaintenance`

أبق استيرادات PI تعمل إما بإعادة التصدير من الملفات القديمة أو بتحديث مواقع استدعاء PI في PR نفسه.

يجب ألا تذكر أسماء المساعدات المحايدة PI.

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

- قبول `AgentMessage[]` المجمع، والسجل المعكوس الأصلي، والمطالبة الحالية.
- تحديد أي سياق ينتمي إلى تعليمات المطور مقابل إدخال المستخدم الحالي.
- الحفاظ على مطالبة المستخدم الحالية بوصفها الطلب التنفيذي النهائي.
- عرض الرسائل السابقة بتنسيق مستقر وصريح.
- تجنب البيانات الوصفية المتغيرة.

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

- ضع `systemPromptAddition` ضمن تعليمات المطور.
- ضع سياق النص المجمع قبل المطالبة الحالية في `promptText`.
- ضع له تسمية واضحة كسياق مجمع من OpenClaw.
- أبق المطالبة الحالية أخيرة.
- استبعد تكرار مطالبة المستخدم الحالية إذا كانت تظهر بالفعل في الذيل.

شكل المطالبة النموذجي:

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

هذا أقل أناقة من تعديل سجل Codex الأصلي، لكنه قابل للتنفيذ داخل OpenClaw ويحافظ على دلالات محرك السياق.

تحسين مستقبلي: إذا كشف خادم تطبيق Codex بروتوكولا لاستبدال سجل السلسلة أو تكميله، فبدل طبقة الإسقاط هذه لاستخدام تلك API.

### 3. توصيل التمهيد قبل بدء سلسلة Codex

في `extensions/codex/src/app-server/run-attempt.ts`:

- اقرأ سجل الجلسة المعكوس كما يحدث اليوم.
- حدد ما إذا كان ملف الجلسة موجودا قبل هذا التشغيل. فضل مساعدا يفحص `fs.stat(params.sessionFile)` قبل كتابات الانعكاس.
- افتح `SessionManager` أو استخدم محولا ضيقا لمدير الجلسة إذا كان المساعد يتطلب ذلك.
- استدع مساعد التمهيد المحايد عند وجود `params.contextEngine`.

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

استخدم نفس اصطلاح `sessionKey` مثل جسر أدوات Codex وانعكاس النص. يحسب Codex اليوم `sandboxSessionKey` من `params.sessionKey` أو `params.sessionId`؛ استخدم ذلك باتساق ما لم يكن هناك سبب للحفاظ على `params.sessionKey` الخام.

### 4. توصيل التجميع قبل `thread/start` / `thread/resume` و`turn/start`

في `runCodexAppServerAttempt`:

1. ابن الأدوات الديناميكية أولا، حتى يرى محرك السياق أسماء الأدوات الفعلية المتاحة.
2. اقرأ سجل الجلسة المعكوس.
3. شغل `assemble(...)` لمحرك السياق عند وجود `params.contextEngine`.
4. أسقط النتيجة المجمعة إلى:
   - إضافة تعليمات المطور
   - نص المطالبة لـ `turn/start`

يجب أن يصبح استدعاء الربط الحالي:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

واعيا بالسياق:

1. احسب تعليمات المطور الأساسية باستخدام `buildDeveloperInstructions(params)`
2. طبق تجميع/إسقاط محرك السياق
3. شغل `before_prompt_build` بالمطالبة/تعليمات المطور المسقطة

يتيح هذا الترتيب للربطات العامة للمطالبات رؤية المطالبة نفسها التي سيتلقاها Codex. إذا احتجنا إلى تطابق صارم مع PI، فشغل تجميع محرك السياق قبل تركيب الربطات، لأن PI يطبق `systemPromptAddition` لمحرك السياق على مطالبة النظام النهائية بعد مسار المطالبات الخاص به. الثابت المهم هو أن يحصل كل من محرك السياق والربطات على ترتيب حتمي وموثق.

الترتيب الموصى به للتنفيذ الأول:

1. `buildDeveloperInstructions(params)`
2. `assemble()` لمحرك السياق
3. إلحاق/إضافة `systemPromptAddition` إلى تعليمات المطور
4. إسقاط الرسائل المجمعة إلى نص المطالبة
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. تمرير تعليمات المطور النهائية إلى `startOrResumeThread(...)`
7. تمرير نص المطالبة النهائي إلى `buildTurnStartParams(...)`

يجب ترميز المواصفة في اختبارات حتى لا تعيد التغييرات المستقبلية ترتيبها بالخطأ.

### 5. الحفاظ على تنسيق مستقر لذاكرة المطالبات المخبئية

يجب أن ينتج مساعد الإسقاط مخرجا مستقرا على مستوى البايت للمدخلات المتطابقة:

- ترتيب رسائل مستقر
- تسميات أدوار مستقرة
- عدم توليد طوابع زمنية
- عدم تسرب ترتيب مفاتيح الكائنات
- عدم استخدام محددات عشوائية
- عدم استخدام معرفات لكل تشغيل

استخدم محددات ثابتة وأقساما صريحة.

### 6. توصيل ما بعد الدورة بعد انعكاس النص

يبني `CodexAppServerEventProjector` الخاص بـ Codex لقطة `messagesSnapshot` محلية
للدور الحالي. تكتب `mirrorTranscriptBestEffort(...)` تلك اللقطة في مرآة سجل OpenClaw.

بعد نجاح النسخ المرآتي أو فشله، استدعِ مُنهي محرك السياق باستخدام أفضل لقطة رسائل
متاحة:

- فضّل سياق الجلسة المنسوخ بالكامل بعد الكتابة، لأن `afterTurn`
  يتوقع لقطة الجلسة، وليس الدور الحالي فقط.
- ارجع إلى `historyMessages + result.messagesSnapshot` إذا تعذرت إعادة فتح ملف
  الجلسة.

التدفق الشبيه بالكود:

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

إذا فشل النسخ المرآتي، فاستدعِ مع ذلك `afterTurn` باستخدام اللقطة الاحتياطية، لكن سجّل
أن محرك السياق يستوعب البيانات من بيانات الدور الاحتياطية.

### 7. طبّع سياق وقت التشغيل للاستخدام وذاكرة التخزين المؤقت للموجه

تتضمن نتائج Codex استخداما مطبعا من إشعارات رموز app-server عند
توفرها. مرر ذلك الاستخدام إلى سياق وقت تشغيل محرك السياق.

إذا كشف app-server الخاص بـ Codex لاحقا تفاصيل قراءة/كتابة ذاكرة التخزين المؤقت، فحوّلها إلى
`ContextEnginePromptCacheInfo`. إلى ذلك الحين، احذف `promptCache` بدلا من
اختراع أصفار.

### 8. سياسة Compaction

يوجد نظامان لـ Compaction:

1. `compact()` الخاص بمحرك سياق OpenClaw
2. `thread/compact/start` الأصلي في app-server الخاص بـ Codex

لا تدمجهما بصمت.

#### `/compact` وCompaction الصريح في OpenClaw

عندما يكون محرك السياق المحدد لديه `info.ownsCompaction === true`، يجب أن يفضّل
Compaction الصريح في OpenClaw نتيجة `compact()` الخاصة بمحرك السياق
لمرآة سجل OpenClaw وحالة Plugin.

عندما يكون لدى أداة Codex المحددة ربط سلسلة أصلي، قد نطلب بالإضافة إلى ذلك
Compaction الأصلي من Codex للحفاظ على سلامة سلسلة app-server، لكن يجب
الإبلاغ عن ذلك كإجراء خلفي منفصل في التفاصيل.

السلوك الموصى به:

- إذا كان `contextEngine.info.ownsCompaction === true`:
  - استدعِ `compact()` الخاص بمحرك السياق أولا
  - ثم استدعِ Compaction الأصلي في Codex بأفضل جهد عند وجود ربط سلسلة
  - أعد نتيجة محرك السياق باعتبارها النتيجة الأساسية
  - ضمّن حالة Compaction الأصلي في Codex داخل `details.codexNativeCompaction`
- إذا كان محرك السياق النشط لا يملك Compaction:
  - حافظ على سلوك Compaction الأصلي الحالي في Codex

يتطلب هذا على الأرجح تغيير `extensions/codex/src/app-server/compact.ts` أو
تغليفه من مسار Compaction العام، اعتمادا على مكان استدعاء
`maybeCompactAgentHarnessSession(...)`.

#### أحداث contextCompaction الأصلية داخل الدور في Codex

قد يصدر Codex أحداث عناصر `contextCompaction` أثناء الدور. أبقِ إصدار خطاف
ما قبل/ما بعد Compaction الحالي في `event-projector.ts`، لكن لا تتعامل
مع ذلك باعتباره Compaction مكتملًا لمحرك السياق.

بالنسبة إلى المحركات التي تملك Compaction، أصدر تشخيصا صريحا عندما ينفذ Codex
Compaction الأصلي على أي حال:

- اسم التدفق/الحدث: يمكن استخدام تدفق `compaction` الحالي
- التفاصيل: `{ backend: "codex-app-server", ownsCompaction: true }`

هذا يجعل الفصل قابلا للتدقيق.

### 9. إعادة تعيين الجلسة وسلوك الربط

تمسح `reset(...)` الحالية في أداة Codex ربط app-server الخاص بـ Codex من
ملف جلسة OpenClaw. حافظ على هذا السلوك.

تأكد أيضا من استمرار تنظيف حالة محرك السياق عبر مسارات دورة حياة جلسة
OpenClaw الحالية. لا تضف تنظيفا خاصا بـ Codex إلا إذا كانت دورة حياة
محرك السياق تفوّت حاليا أحداث reset/delete لكل الأدوات.

### 10. معالجة الأخطاء

اتبع دلالات PI:

- تحذر إخفاقات bootstrap وتستمر
- تحذر إخفاقات assemble وتعود إلى رسائل/موجه خط الأنابيب غير المجمعة
- تحذر إخفاقات afterTurn/ingest وتعلّم إنهاء ما بعد الدور بأنه غير ناجح
- تعمل الصيانة فقط بعد أدوار ناجحة وغير مُجهضة ولا تتضمن yield
- يجب ألا يعاد تنفيذ أخطاء Compaction كموجهات جديدة

إضافات خاصة بـ Codex:

- إذا فشل إسقاط السياق، فحذر وارجع إلى الموجه الأصلي.
- إذا فشلت مرآة السجل، فحاول مع ذلك إنهاء محرك السياق باستخدام
  رسائل احتياطية.
- إذا فشل Compaction الأصلي في Codex بعد نجاح Compaction محرك السياق،
  فلا تفشل Compaction الكامل في OpenClaw عندما يكون محرك السياق هو الأساسي.

## خطة الاختبار

### اختبارات الوحدة

أضف اختبارات ضمن `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - يستدعي Codex ‏`bootstrap` عند وجود ملف جلسة.
   - يستدعي Codex ‏`assemble` مع الرسائل المعكوسة، وميزانية الرموز، وأسماء الأدوات،
     ووضع الاستشهادات، ومعرّف النموذج، والمطالبة.
   - يتم تضمين `systemPromptAddition` في تعليمات المطوّر.
   - يتم إسقاط الرسائل المجمّعة في المطالبة قبل الطلب الحالي.
   - يستدعي Codex ‏`afterTurn` بعد عكس النصّ المنسوخ.
   - بدون `afterTurn`، يستدعي Codex ‏`ingestBatch` أو `ingest` لكل رسالة.
   - تعمل صيانة الدور بعد الأدوار الناجحة.
   - لا تعمل صيانة الدور عند خطأ المطالبة، أو الإلغاء، أو إلغاء التسليم.

2. `context-engine-projection.test.ts`
   - مخرجات مستقرة للمدخلات المتطابقة
   - عدم تكرار المطالبة الحالية عندما يتضمن السجل المجمّع تلك المطالبة
   - التعامل مع السجل الفارغ
   - الحفاظ على ترتيب الأدوار
   - تضمين إضافة مطالبة النظام في تعليمات المطوّر فقط

3. `compact.context-engine.test.ts`
   - تكون النتيجة الأساسية لمحرك السياق المالك هي الفائزة
   - تظهر حالة Compaction الأصلية في Codex ضمن التفاصيل عند محاولة تنفيذها أيضًا
   - لا يؤدي فشل Compaction الأصلية في Codex إلى إفشال Compaction لمحرك السياق المالك
   - يحافظ محرك السياق غير المالك على سلوك Compaction الأصلي الحالي

### الاختبارات الحالية المطلوب تحديثها

- `extensions/codex/src/app-server/run-attempt.test.ts` إذا كان موجودًا، وإلا
  أقرب اختبارات تشغيل لخادم تطبيق Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط إذا تغيّرت
  تفاصيل حدث Compaction.
- يجب ألا يحتاج `src/agents/harness/selection.test.ts` إلى تغييرات ما لم يتغير
  سلوك الإعدادات؛ ويجب أن يبقى مستقرًا.
- يجب أن تستمر اختبارات محرك السياق في PI بالنجاح دون تغيير.

### اختبارات التكامل / الاختبارات الحية

أضف أو وسّع اختبارات الدخان الحية لحاضنة Codex:

- اضبط `plugins.slots.contextEngine` على محرك اختبار
- اضبط `agents.defaults.model` على نموذج `codex/*`
- اضبط `agents.defaults.embeddedHarness.runtime = "codex"`
- تأكد من أن محرك الاختبار رصد:
  - bootstrap
  - assemble
  - afterTurn أو ingest
  - الصيانة

تجنب اشتراط lossless-claw في اختبارات OpenClaw الأساسية. استخدم Plugin صغيرًا
مزيفًا لمحرك السياق داخل المستودع.

## قابلية المراقبة

أضف سجلات تصحيح حول استدعاءات دورة حياة محرك السياق في Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` مع السبب
- `codex native compaction completed alongside context-engine compaction`

تجنب تسجيل المطالبات الكاملة أو محتويات النصوص المنسوخة.

أضف حقولًا منظّمة حيثما كان ذلك مفيدًا:

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

- إذا لم يتم إعداد محرك سياق، فيجب أن يكون سلوك محرك السياق القديم
  مكافئًا لسلوك حاضنة Codex اليوم.
- إذا فشل `assemble` في محرك السياق، فيجب أن يواصل Codex مسار المطالبة الأصلي.
- يجب أن تظل ارتباطات سلاسل Codex الحالية صالحة.
- يجب ألا تتضمن بصمة الأدوات الديناميكية مخرجات محرك السياق؛ وإلا فقد
  يفرض كل تغيير في السياق سلسلة Codex جديدة. يجب أن يؤثر كتالوج الأدوات فقط
  في بصمة الأدوات الديناميكية.

## أسئلة مفتوحة

1. هل يجب حقن السياق المجمّع بالكامل في مطالبة المستخدم، أو بالكامل
   في تعليمات المطوّر، أو تقسيمه؟

   التوصية: تقسيمه. ضع `systemPromptAddition` في تعليمات المطوّر؛
   وضع سياق النص المنسوخ المجمّع في مغلّف مطالبة المستخدم. يطابق هذا بروتوكول
   Codex الحالي على أفضل نحو دون تعديل سجل السلسلة الأصلي.

2. هل يجب تعطيل Compaction الأصلية في Codex عندما يملك محرك سياق
   عملية Compaction؟

   التوصية: لا، ليس في البداية. قد تظل Compaction الأصلية في Codex
   ضرورية للحفاظ على بقاء سلسلة خادم التطبيق. لكن يجب الإبلاغ عنها باعتبارها
   Compaction أصلية في Codex، لا باعتبارها Compaction لمحرك السياق.

3. هل يجب تشغيل `before_prompt_build` قبل تجميع محرك السياق أم بعده؟

   التوصية: بعد إسقاط محرك السياق في Codex، بحيث ترى خطافات الحاضنة العامة
   المطالبة/تعليمات المطوّر الفعلية التي سيتلقاها Codex. إذا كان تكافؤ PI
   يتطلب العكس، فقم بترميز الترتيب المختار في الاختبارات ووثّقه هنا.

4. هل يستطيع خادم تطبيق Codex قبول تجاوز منظّم للسياق/السجل في المستقبل؟

   غير معروف. إذا استطاع ذلك، فاستبدل طبقة الإسقاط النصية بذلك البروتوكول
   وأبقِ استدعاءات دورة الحياة دون تغيير.

## معايير القبول

- يستدعي دور حاضنة مضمنة `codex/*` دورة حياة التجميع لمحرك السياق المحدد.
- يؤثر `systemPromptAddition` في محرك السياق على تعليمات المطوّر في Codex.
- يؤثر السياق المجمّع على مدخلات دور Codex بشكل حتمي.
- تستدعي أدوار Codex الناجحة `afterTurn` أو بديل ingest.
- تشغّل أدوار Codex الناجحة صيانة دور محرك السياق.
- لا تشغّل الأدوار الفاشلة/الملغاة/الملغاة أثناء التسليم صيانة الدور.
- تبقى Compaction المملوكة لمحرك السياق أساسية لحالة OpenClaw/Plugin.
- تبقى Compaction الأصلية في Codex قابلة للتدقيق باعتبارها سلوكًا أصليًا في Codex.
- لا يتغير سلوك محرك السياق الحالي في PI.
- لا يتغير سلوك حاضنة Codex الحالي عندما لا يتم تحديد محرك سياق غير قديم
  أو عندما يفشل التجميع.
