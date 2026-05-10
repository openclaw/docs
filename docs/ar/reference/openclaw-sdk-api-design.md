---
read_when:
    - أنت تنفذ حزمة تطوير تطبيقات OpenClaw العامة المقترحة
    - تحتاج إلى عقد مساحة الأسماء المسودة أو الحدث أو النتيجة أو العنصر الناتج أو الموافقة أو الأمان لـ SDK التطبيق
    - أنت تقارن موارد بروتوكول Gateway بغلاف OpenClaw App SDK عالي المستوى
sidebarTitle: App SDK API design
summary: تصميم مرجعي لواجهة API العامة لـ OpenClaw App SDK، وتصنيف الأحداث، والعناصر الناتجة، والموافقات، وبنية الحزمة
title: تصميم واجهة برمجة التطبيقات لحزمة تطوير تطبيقات OpenClaw
x-i18n:
    generated_at: "2026-05-10T20:00:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

هذه الصفحة هي تصميم مرجع API المفصل للحزمة العامة
[OpenClaw App SDK](/ar/concepts/openclaw-sdk). وهي منفصلة عمدا عن
[Plugin SDK](/ar/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` هي حزمة التطبيق/العميل الخارجية للتخاطب مع
  Gateway. أما `openclaw/plugin-sdk/*` فهو عقد تأليف Plugin داخل العملية.
  لا تستورد المسارات الفرعية لـ Plugin SDK من التطبيقات التي تحتاج فقط إلى تشغيل الوكلاء.
</Note>

يجب بناء SDK التطبيقات العام في طبقتين:

1. عميل Gateway منخفض المستوى ومولّد.
2. غلاف عالي المستوى ومريح مع كائنات `OpenClaw` و`Agent` و`Session` و`Run`
   و`Task` و`Artifact` و`Approval` و`Environment`.

## تصميم مساحات الأسماء

يجب أن تتبع مساحات الأسماء منخفضة المستوى موارد Gateway عن قرب:

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

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
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

يجب أن تعيد الأغلفة عالية المستوى كائنات تجعل التدفقات الشائعة مريحة:

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

يجب أن يكشف SDK العام أحداثا ذات إصدارات، قابلة لإعادة التشغيل، ومطبعة.

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

`id` هو مؤشر إعادة تشغيل. يجب أن يتمكن المستهلكون من إعادة الاتصال باستخدام
`events({ after: id })` وتلقي الأحداث الفائتة عندما تسمح مدة الاحتفاظ بذلك.

عائلات الأحداث المطبعة الموصى بها:

| الحدث                 | المعنى                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | تم قبول التشغيل.                                               |
| `run.queued`          | التشغيل ينتظر مسار جلسة أو وقت تشغيل أو بيئة. |
| `run.started`         | بدأ وقت التشغيل التنفيذ.                                  |
| `run.completed`       | انتهى التشغيل بنجاح.                                  |
| `run.failed`          | انتهى التشغيل بخطأ.                                    |
| `run.cancelled`       | تم إلغاء التشغيل.                                          |
| `run.timed_out`       | تجاوز التشغيل مهلته الزمنية.                                   |
| `assistant.delta`     | فرق نص المساعد.                                       |
| `assistant.message`   | رسالة مساعد كاملة أو بديل.                  |
| `thinking.delta`      | فرق الاستدلال أو الخطة، عندما تسمح السياسة بالكشف عنه.       |
| `tool.call.started`   | بدأت استدعاءة الأداة.                                            |
| `tool.call.delta`     | بثت استدعاءة الأداة تقدمها أو خرجا جزئيا.              |
| `tool.call.completed` | عادت استدعاءة الأداة بنجاح.                            |
| `tool.call.failed`    | فشلت استدعاءة الأداة.                                           |
| `approval.requested`  | يحتاج تشغيل أو أداة إلى موافقة.                               |
| `approval.resolved`   | تم منح الموافقة أو رفضها أو انتهت صلاحيتها أو ألغيت.        |
| `question.requested`  | يطلب وقت التشغيل إدخالا من المستخدم أو تطبيق المضيف.                |
| `question.answered`   | قدم تطبيق المضيف إجابة.                                |
| `artifact.created`    | أصبح أثر جديد متاحا.                                     |
| `artifact.updated`    | تغير أثر موجود.                                  |
| `session.created`     | تم إنشاء الجلسة.                                            |
| `session.updated`     | تغيرت بيانات الجلسة الوصفية.                                   |
| `session.compacted`   | حدث Compaction للجلسة.                                |
| `task.updated`        | تغيرت حالة المهمة الخلفية.                              |
| `git.branch`          | رصد وقت التشغيل حالة الفرع أو غيرها.                   |
| `git.diff`            | أنتج وقت التشغيل فرقا أو غيره.                         |
| `git.pr`              | فتح وقت التشغيل طلب سحب أو حدثه أو ربطه.          |

يجب أن تكون الحمولات الأصلية لوقت التشغيل متاحة عبر `raw`، لكن لا ينبغي أن تضطر التطبيقات
إلى تحليل `raw` من أجل واجهة المستخدم العادية.

## عقد النتائج

يجب أن يعيد `Run.wait()` غلاف نتائج مستقرا:

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

يجب أن تكون النتيجة عادية ومستقرة. تحافظ قيم الطوابع الزمنية على شكل Gateway،
لذلك عادة ما تبلغ التشغيلات الحالية المدعومة بدورة الحياة عن أرقام بالميلي ثانية منذ الحقبة
بينما قد تظل المحولات تعرض سلاسل ISO. تنتمي واجهة المستخدم الغنية وآثار الأدوات
والتفاصيل الأصلية لوقت التشغيل إلى الأحداث والآثار.

`accepted` هي نتيجة انتظار غير نهائية: وتعني أن مهلة انتظار Gateway
انتهت قبل أن ينتج التشغيل نهاية دورة حياة أو خطأ. يجب ألا تعامل على أنها
`timed_out`؛ فـ `timed_out` مخصصة للتشغيل الذي تجاوز مهلة وقت التشغيل الخاصة به.

## الموافقات والأسئلة

يجب أن تكون الموافقات كيانا من الدرجة الأولى لأن وكلاء البرمجة يعبرون باستمرار حدود السلامة.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

يجب أن تحمل أحداث الموافقة:

- معرف الموافقة
- معرف التشغيل ومعرف الجلسة
- نوع الطلب
- ملخص الإجراء المطلوب
- اسم الأداة أو إجراء البيئة
- مستوى المخاطر
- القرارات المتاحة
- انتهاء الصلاحية
- ما إذا كان يمكن إعادة استخدام القرار

الأسئلة منفصلة عن الموافقات. يطلب السؤال معلومات من المستخدم أو تطبيق المضيف.
أما الموافقة فتطلب إذنا لتنفيذ إجراء.

## نموذج ToolSpace

تحتاج التطبيقات إلى فهم سطح الأدوات دون استيراد داخليات Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

يجب أن يكشف SDK:

- بيانات وصفية مطبعة للأدوات
- المصدر: OpenClaw أو MCP أو Plugin أو قناة أو وقت تشغيل أو تطبيق
- ملخص المخطط
- سياسة الموافقة
- توافق وقت التشغيل
- ما إذا كانت الأداة مخفية أو للقراءة فقط أو قادرة على الكتابة أو قادرة على المضيف

يجب أن يكون استدعاء الأدوات عبر SDK صريحا ومحدد النطاق. يجب أن تشغل معظم التطبيقات
الوكلاء، لا أن تستدعي أدوات عشوائية مباشرة.

## نموذج الآثار

يجب أن تغطي الآثار أكثر من الملفات.

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
- حزم الرقع
- فروق VCS
- لقطات الشاشة ومخرجات الوسائط
- السجلات وحزم التتبع
- روابط طلبات السحب
- مسارات وقت التشغيل
- لقطات مساحات عمل البيئة المدارة

يجب أن يدعم الوصول إلى الآثار التنقيح والاحتفاظ وروابط التنزيل دون
افتراض أن كل أثر هو ملف محلي عادي.

## نموذج الأمان

يجب أن يكون SDK التطبيق صريحا بشأن الصلاحية.

نطاقات الرموز الموصى بها:

| النطاق               | يسمح بـ                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | سرد الوكلاء وفحصهم.                            |
| `agent.run`         | بدء التشغيلات.                                         |
| `session.read`      | قراءة بيانات الجلسة الوصفية والرسائل.                 |
| `session.write`     | إنشاء الجلسات والإرسال إليها وتفريعها وضغطها وإجهاضها. |
| `task.read`         | قراءة حالة المهمة الخلفية.                         |
| `task.write`        | إلغاء سياسة إشعارات المهام أو تعديلها.          |
| `approval.respond`  | الموافقة على الطلبات أو رفضها.                           |
| `tools.invoke`      | استدعاء الأدوات المكشوفة مباشرة.                      |
| `artifacts.read`    | سرد الآثار وتنزيلها.                        |
| `environment.write` | إنشاء البيئات المدارة أو تدميرها.             |
| `admin`             | عمليات إدارية.                          |

الإعدادات الافتراضية:

- لا يوجد تمرير للأسرار بشكل افتراضي
- لا يوجد تمرير غير مقيد لمتغيرات البيئة
- مراجع الأسرار بدلا من قيم الأسرار
- سياسة صريحة للصندوق الرملي والشبكة
- احتفاظ صريح بالبيئة البعيدة
- موافقات لتنفيذ المضيف ما لم تثبت السياسة خلاف ذلك
- تنقيح أحداث وقت التشغيل الخام قبل مغادرتها Gateway ما لم يكن لدى المستدعي
  نطاق تشخيصي أقوى

## مزود البيئة المدارة

يجب تنفيذ الوكلاء المدارين كمزودي بيئة.

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

لا يلزم أن يكون التنفيذ الأول خدمة SaaS مستضافة. يمكنه استهداف
مضيفي Node الحاليين أو مساحات عمل مؤقتة أو مشغلات بأسلوب CI أو بيئات بأسلوب Testbox.
العقد المهم هو:

1. تحضير مساحة العمل
2. ربط بيئة آمنة وأسرار آمنة
3. بدء التشغيل
4. بث الأحداث
5. جمع الآثار
6. التنظيف أو الاحتفاظ حسب السياسة

بمجرد أن يستقر ذلك، يمكن لخدمة سحابية مستضافة تنفيذ عقد المزود نفسه.

## بنية الحزم

الحزم الموصى بها:

| الحزمة                 | الغرض                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK عام عالي المستوى وعميل Gateway منخفض المستوى مولد. |
| `@openclaw/sdk-react`   | خطافات React اختيارية للوحات المعلومات وبناة التطبيقات.         |
| `@openclaw/sdk-testing` | مساعدين للاختبار وخادم Gateway مزيف لتكاملات التطبيقات.    |

يحتوي المستودع بالفعل على `openclaw/plugin-sdk/*` من أجل Plugins. أبق مساحة الاسم تلك
منفصلة لتجنب إرباك مؤلفي Plugin بمطوري التطبيقات.

## استراتيجية العميل المولد

يجب إنشاء العميل منخفض المستوى من مخططات بروتوكول Gateway ذات الإصدارات،
ثم تغليفه بفئات مريحة مكتوبة يدويا.

الطبقات:

1. مصدر الحقيقة لمخطط Gateway.
2. عميل TypeScript منخفض المستوى مُولَّد.
3. مُدقِّقات وقت التشغيل للمدخلات الخارجية وحمولات الأحداث.
4. أغلفة عالية المستوى لـ `OpenClaw` و`Agent` و`Session` و`Run` و`Task` و`Artifact`.
5. أمثلة وصفات واختبارات تكامل.

الفوائد:

- يصبح انجراف البروتوكول مرئيًا
- يمكن للاختبارات مقارنة الأساليب المُولَّدة مع صادرات Gateway
- تظل App SDK مستقلة عن داخليات Plugin SDK
- يظل لدى المستهلكين منخفضي المستوى وصول كامل إلى البروتوكول
- يحصل المستهلكون عاليي المستوى على واجهة API المنتج الصغيرة

## ذات صلة

- [OpenClaw App SDK](/ar/concepts/openclaw-sdk)
- [مرجع Gateway RPC](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [مهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
