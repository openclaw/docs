---
read_when:
    - أنت تنفذ حزمة تطوير تطبيقات OpenClaw العامة المقترحة
    - تحتاج إلى عقد مساحة أسماء المسودة أو الحدث أو النتيجة أو الأثر أو الموافقة أو الأمان لحزمة تطوير برامج التطبيق
    - أنت تقارن موارد بروتوكول Gateway بغلاف SDK لتطبيق OpenClaw عالي المستوى
sidebarTitle: App SDK API design
summary: تصميم مرجعي لواجهة API العامة لـ OpenClaw App SDK، وتصنيف الأحداث، والمخرجات، والموافقات، وبنية الحزمة
title: تصميم واجهة API لحزمة SDK لتطبيق OpenClaw
x-i18n:
    generated_at: "2026-05-06T08:12:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

هذه الصفحة هي تصميم مرجع API المفصل لـ
[OpenClaw App SDK](/ar/concepts/openclaw-sdk) العام. وهي منفصلة عمدا عن
[Plugin SDK](/ar/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` هو حزمة التطبيق/العميل الخارجية للتخاطب مع
  Gateway. أما `openclaw/plugin-sdk/*` فهو عقد تأليف Plugin داخل العملية.
  لا تستورد المسارات الفرعية لـ Plugin SDK من التطبيقات التي تحتاج فقط إلى تشغيل الوكلاء.
</Note>

ينبغي بناء SDK التطبيق العام على طبقتين:

1. عميل Gateway منخفض المستوى ومولّد.
2. غلاف عالي المستوى ومريح مع كائنات `OpenClaw` و`Agent` و`Session` و`Run`
   و`Task` و`Artifact` و`Approval` و`Environment`.

## تصميم مساحة الأسماء

ينبغي أن تتبع مساحات الأسماء منخفضة المستوى موارد Gateway بشكل وثيق:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

ينبغي أن تعيد الأغلفة عالية المستوى كائنات تجعل التدفقات الشائعة مريحة:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## عقد الأحداث

ينبغي أن يعرّض SDK العام أحداثا موحدة وقابلة لإعادة التشغيل ومحددة الإصدارات.

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: unknown;
};
```

`id` هو مؤشر إعادة تشغيل. ينبغي أن يتمكن المستهلكون من إعادة الاتصال باستخدام
`events({ after: id })` وتلقي الأحداث الفائتة عندما تسمح سياسة الاحتفاظ بذلك.

عائلات الأحداث الموحدة الموصى بها:

| الحدث                 | المعنى                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | تم قبول التشغيل.                                               |
| `run.queued`          | التشغيل ينتظر مسار جلسة أو وقت تشغيل أو بيئة. |
| `run.started`         | بدأ وقت التشغيل التنفيذ.                                  |
| `run.completed`       | انتهى التشغيل بنجاح.                                  |
| `run.failed`          | انتهى التشغيل بخطأ.                                    |
| `run.cancelled`       | تم إلغاء التشغيل.                                          |
| `run.timed_out`       | تجاوز التشغيل مهلته.                                   |
| `assistant.delta`     | فرق نص المساعد.                                       |
| `assistant.message`   | رسالة مساعد كاملة أو بديل لها.                  |
| `thinking.delta`      | فرق استدلال أو خطة، عندما تسمح السياسة بعرضه.       |
| `tool.call.started`   | بدأت استدعاءة الأداة.                                            |
| `tool.call.delta`     | بثت استدعاءة الأداة تقدمها أو مخرجات جزئية.              |
| `tool.call.completed` | عادت استدعاءة الأداة بنجاح.                            |
| `tool.call.failed`    | فشلت استدعاءة الأداة.                                           |
| `approval.requested`  | يحتاج تشغيل أو أداة إلى موافقة.                               |
| `approval.resolved`   | تم منح الموافقة أو رفضها أو انتهت صلاحيتها أو ألغيت.        |
| `question.requested`  | يطلب وقت التشغيل إدخالا من المستخدم أو التطبيق المضيف.                |
| `question.answered`   | قدم التطبيق المضيف إجابة.                                |
| `artifact.created`    | أثر جديد متاح.                                     |
| `artifact.updated`    | تغير أثر موجود.                                  |
| `session.created`     | تم إنشاء الجلسة.                                            |
| `session.updated`     | تغيرت بيانات تعريف الجلسة.                                   |
| `session.compacted`   | حدثت Compaction للجلسة.                                |
| `task.updated`        | تغيرت حالة مهمة الخلفية.                              |
| `git.branch`          | لاحظ وقت التشغيل حالة الفرع أو غيّرها.                   |
| `git.diff`            | أنتج وقت التشغيل فرقا أو غيّره.                         |
| `git.pr`              | فتح وقت التشغيل طلب سحب أو حدّثه أو ربطه.          |

ينبغي أن تكون الحمولات الأصلية لوقت التشغيل متاحة عبر `raw`، لكن لا ينبغي أن تضطر التطبيقات إلى
تحليل `raw` لواجهة المستخدم العادية.

## عقد النتيجة

ينبغي أن يعيد `Run.wait()` غلاف نتيجة مستقرا:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

ينبغي أن تكون النتيجة بسيطة ومستقرة. تحتفظ قيم الطوابع الزمنية بشكل Gateway،
لذلك عادة ما تبلغ عمليات التشغيل الحالية المدعومة بدورة الحياة عن أرقام ميلي ثانية منذ الحقبة
بينما قد تظل المحولات تعرض سلاسل ISO. تنتمي واجهة المستخدم الغنية وآثار الأدوات والتفاصيل
الأصلية لوقت التشغيل إلى الأحداث والآثار.

`accepted` هي نتيجة انتظار غير نهائية: تعني أن موعد انتظار Gateway النهائي
انتهى قبل أن ينتج التشغيل نهاية/خطأ دورة حياة. يجب ألا تعامل على أنها
`timed_out`؛ إذ إن `timed_out` محفوظة للتشغيل الذي تجاوز مهلة وقت تشغيله
الخاصة.

## الموافقات والأسئلة

يجب أن تكون الموافقات من الدرجة الأولى لأن وكلاء البرمجة يعبرون حدود الأمان باستمرار.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

ينبغي أن تحمل أحداث الموافقة:

- معرف الموافقة
- معرف التشغيل ومعرف الجلسة
- نوع الطلب
- ملخص الإجراء المطلوب
- اسم الأداة أو إجراء البيئة
- مستوى المخاطر
- القرارات المتاحة
- انتهاء الصلاحية
- ما إذا كان يمكن إعادة استخدام القرار

الأسئلة منفصلة عن الموافقات. يطلب السؤال معلومات من المستخدم أو التطبيق المضيف.
أما الموافقة فتطلب الإذن لتنفيذ إجراء.

## نموذج ToolSpace

تحتاج التطبيقات إلى فهم سطح الأدوات دون استيراد داخليات Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

ينبغي أن يعرّض SDK:

- بيانات تعريف موحدة للأدوات
- المصدر: OpenClaw أو MCP أو Plugin أو قناة أو وقت تشغيل أو تطبيق
- ملخص المخطط
- سياسة الموافقة
- توافق وقت التشغيل
- ما إذا كانت الأداة مخفية أو للقراءة فقط أو قادرة على الكتابة أو قادرة على المضيف

ينبغي أن يكون استدعاء الأدوات عبر SDK صريحا ومحدود النطاق. ينبغي لمعظم التطبيقات
تشغيل الوكلاء، لا استدعاء أدوات عشوائية مباشرة.

## نموذج الآثار

ينبغي أن تغطي الآثار أكثر من الملفات.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

أمثلة شائعة:

- تعديلات الملفات والملفات المولدة
- حزم التصحيحات
- فروق VCS
- لقطات الشاشة ومخرجات الوسائط
- السجلات وحزم التتبع
- روابط طلبات السحب
- مسارات وقت التشغيل
- لقطات مساحات عمل البيئات المدارة

ينبغي أن يدعم الوصول إلى الآثار التنقيح والاحتفاظ وعناوين URL للتنزيل دون
افتراض أن كل أثر هو ملف محلي عادي.

## نموذج الأمان

يجب أن يكون SDK التطبيق صريحا بشأن الصلاحية.

نطاقات الرموز المميزة الموصى بها:

| النطاق               | يسمح بـ                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | سرد الوكلاء وفحصهم.                            |
| `agent.run`         | بدء عمليات التشغيل.                                         |
| `session.read`      | قراءة بيانات تعريف الجلسة والرسائل.                 |
| `session.write`     | إنشاء الجلسات والإرسال إليها وتفريعها وضغطها وإجهاضها. |
| `task.read`         | قراءة حالة مهمة الخلفية.                         |
| `task.write`        | إلغاء سياسة إشعارات المهمة أو تعديلها.          |
| `approval.respond`  | قبول الطلبات أو رفضها.                           |
| `tools.invoke`      | استدعاء الأدوات المعروضة مباشرة.                      |
| `artifacts.read`    | سرد الآثار وتنزيلها.                        |
| `environment.write` | إنشاء البيئات المدارة أو إتلافها.             |
| `admin`             | عمليات إدارية.                          |

الإعدادات الافتراضية:

- لا تمرير للأسرار افتراضيا
- لا تمرير غير مقيد لمتغيرات البيئة
- مراجع الأسرار بدلا من قيم الأسرار
- سياسة صندوق عزل وشبكة صريحة
- احتفاظ صريح بالبيئة البعيدة
- موافقات على تنفيذ المضيف ما لم تثبت السياسة خلاف ذلك
- تنقيح أحداث وقت التشغيل الخام قبل أن تغادر Gateway ما لم يكن لدى المستدعي
  نطاق تشخيص أقوى

## مزود البيئة المدارة

ينبغي تنفيذ الوكلاء المدارين كمزودي بيئة.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

لا يحتاج التنفيذ الأول إلى أن يكون SaaS مستضافا. يمكنه استهداف
مضيفي Node الحاليين أو مساحات العمل المؤقتة أو مشغلات بنمط CI أو بيئات بنمط Testbox.
العقد المهم هو:

1. إعداد مساحة العمل
2. ربط بيئة وأسرار آمنة
3. بدء التشغيل
4. بث الأحداث
5. جمع الآثار
6. التنظيف أو الاحتفاظ حسب السياسة

بمجرد أن يستقر هذا، يمكن لخدمة سحابية مستضافة تنفيذ عقد المزود نفسه.

## بنية الحزمة

الحزم الموصى بها:

| الحزمة                 | الغرض                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK عام عالي المستوى وعميل Gateway منخفض المستوى مولد. |
| `@openclaw/sdk-react`   | خطافات React اختيارية للوحات التحكم وبناة التطبيقات.         |
| `@openclaw/sdk-testing` | مساعدات اختبار وخادم Gateway زائف لتكاملات التطبيقات.    |

يحتوي المستودع بالفعل على `openclaw/plugin-sdk/*` من أجل Plugins. أبق مساحة الأسماء تلك
منفصلة لتجنب إرباك مؤلفي Plugin مع مطوري التطبيقات.

## استراتيجية العميل المولد

ينبغي توليد العميل منخفض المستوى من مخططات بروتوكول Gateway محددة الإصدارات،
ثم تغليفه بفئات مريحة مكتوبة يدويا.

الطبقات:

1. مصدر الحقيقة لمخطط Gateway.
2. عميل TypeScript منخفض المستوى ومولَّد.
3. أدوات تحقق وقت التشغيل للمدخلات الخارجية وحِمولات الأحداث.
4. مغلّفات `OpenClaw` و`Agent` و`Session` و`Run` و`Task` و`Artifact`
   عالية المستوى.
5. أمثلة دليل الوصفات واختبارات التكامل.

الفوائد:

- يصبح انحراف البروتوكول مرئيًا
- يمكن للاختبارات مقارنة الطرق المولَّدة مع تصديرات Gateway
- يبقى SDK التطبيق مستقلًا عن الأجزاء الداخلية لـ Plugin SDK
- يظل لدى المستهلكين منخفضي المستوى وصول كامل إلى البروتوكول
- يحصل المستهلكون عالي المستوى على API المنتج الصغيرة

## ذو صلة

- [SDK تطبيق OpenClaw](/ar/concepts/openclaw-sdk)
- [مرجع RPC لـ Gateway](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [المهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
