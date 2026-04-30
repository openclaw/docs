---
read_when:
    - أنت تنفّذ حزمة SDK العامة لتطبيق OpenClaw.
    - تحتاج إلى عقد المسودة لمساحة الأسماء أو الحدث أو النتيجة أو الأثر أو الموافقة أو الأمان الخاص بـ SDK التطبيق
    - أنت تقارن موارد بروتوكول Gateway بغلاف OpenClaw App SDK عالي المستوى
sidebarTitle: App SDK API design
summary: تصميم مرجعي لواجهة API العامة لـ OpenClaw App SDK، وتصنيف الأحداث، والمخرجات، والموافقات، وبنية الحزمة
title: تصميم واجهة برمجة التطبيقات لـ SDK تطبيق OpenClaw
x-i18n:
    generated_at: "2026-04-30T08:24:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

هذه الصفحة هي تصميم مرجع API التفصيلي لحزمة
[OpenClaw App SDK](/ar/concepts/openclaw-sdk) العامة. وهي منفصلة عمدًا عن
[Plugin SDK](/ar/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` هي حزمة التطبيق/العميل الخارجية للتخاطب مع
  Gateway. أما `openclaw/plugin-sdk/*` فهو عقد تأليف Plugin داخل العملية.
  لا تستورد المسارات الفرعية لـ Plugin SDK من التطبيقات التي تحتاج فقط إلى تشغيل الوكلاء.
</Note>

ينبغي بناء حزمة SDK العامة للتطبيقات على طبقتين:

1. عميل Gateway منخفض المستوى ومولّد.
2. غلاف عالي المستوى وسهل الاستخدام يتضمن كائنات `OpenClaw` و`Agent` و`Session` و`Run`
   و`Task` و`Artifact` و`Approval` و`Environment`.

## تصميم مساحات الأسماء

ينبغي أن تتبع مساحات الأسماء منخفضة المستوى موارد Gateway عن قرب:

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
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
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

ينبغي أن تعرض حزمة SDK العامة أحداثًا ذات إصدارات، قابلة لإعادة التشغيل، ومُطبّعة.

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

`id` هو مؤشر إعادة تشغيل. ينبغي أن يتمكن المستهلكون من إعادة الاتصال عبر
`events({ after: id })` وتلقي الأحداث الفائتة عندما يسمح الاحتفاظ بذلك.

عائلات الأحداث المُطبّعة الموصى بها:

| الحدث                 | المعنى                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | تم قبول التشغيل.                                               |
| `run.queued`          | التشغيل ينتظر مسار جلسة أو وقت تشغيل أو بيئة. |
| `run.started`         | بدأ وقت التشغيل التنفيذ.                                  |
| `run.completed`       | انتهى التشغيل بنجاح.                                  |
| `run.failed`          | انتهى التشغيل بخطأ.                                    |
| `run.cancelled`       | تم إلغاء التشغيل.                                          |
| `run.timed_out`       | تجاوز التشغيل المهلة المحددة له.                                   |
| `assistant.delta`     | فرق نص المساعد.                                       |
| `assistant.message`   | رسالة المساعد الكاملة أو البديلة.                  |
| `thinking.delta`      | فرق الاستدلال أو الخطة عندما تسمح السياسة بإظهاره.       |
| `tool.call.started`   | بدأت استدعاء الأداة.                                            |
| `tool.call.delta`     | بث استدعاء الأداة تقدّمًا أو مخرجات جزئية.              |
| `tool.call.completed` | عاد استدعاء الأداة بنجاح.                            |
| `tool.call.failed`    | فشل استدعاء الأداة.                                           |
| `approval.requested`  | يحتاج تشغيل أو أداة إلى موافقة.                               |
| `approval.resolved`   | مُنحت الموافقة أو رُفضت أو انتهت صلاحيتها أو أُلغيت.        |
| `question.requested`  | يطلب وقت التشغيل مدخلات من المستخدم أو التطبيق المضيف.                |
| `question.answered`   | قدّم التطبيق المضيف إجابة.                                |
| `artifact.created`    | أصبح أثر جديد متاحًا.                                     |
| `artifact.updated`    | تغيّر أثر موجود.                                  |
| `session.created`     | تم إنشاء الجلسة.                                            |
| `session.updated`     | تغيّرت بيانات الجلسة الوصفية.                                   |
| `session.compacted`   | حدثت Compaction للجلسة.                                |
| `task.updated`        | تغيّرت حالة مهمة في الخلفية.                              |
| `git.branch`          | رصد وقت التشغيل حالة الفرع أو غيّرها.                   |
| `git.diff`            | أنشأ وقت التشغيل فرقًا أو غيّره.                         |
| `git.pr`              | فتح وقت التشغيل طلب سحب أو حدّثه أو ربطه.          |

ينبغي أن تكون الحمولات الأصلية لوقت التشغيل متاحة عبر `raw`، لكن لا ينبغي أن تضطر التطبيقات
إلى تحليل `raw` لواجهات المستخدم العادية.

## عقد النتيجة

ينبغي أن يعيد `Run.wait()` غلاف نتيجة ثابتًا:

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

ينبغي أن تكون النتيجة بسيطة وثابتة. تحتفظ قيم الطوابع الزمنية بشكل Gateway،
لذلك عادةً ما تُبلغ عمليات التشغيل الحالية المدعومة بدورة الحياة عن أرقام ميلي ثانية منذ الحقبة
بينما قد تظل المهايئات تعرض سلاسل ISO. تنتمي واجهات المستخدم الغنية، وآثار الأدوات، والتفاصيل
الأصلية لوقت التشغيل إلى الأحداث والآثار.

`accepted` هي نتيجة انتظار غير نهائية: وتعني أن مهلة انتظار Gateway
انتهت قبل أن ينتج التشغيل نهاية/خطأ دورة حياة. يجب ألا تُعامل على أنها
`timed_out`؛ إذ إن `timed_out` مخصصة لتشغيل تجاوز مهلة وقت التشغيل الخاصة به.

## الموافقات والأسئلة

يجب أن تكون الموافقات مواطنًا من الدرجة الأولى لأن وكلاء البرمجة يعبرون حدود السلامة باستمرار.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

ينبغي أن تحمل أحداث الموافقة:

- معرّف الموافقة
- معرّف التشغيل ومعرّف الجلسة
- نوع الطلب
- ملخص الإجراء المطلوب
- اسم الأداة أو إجراء البيئة
- مستوى المخاطر
- القرارات المتاحة
- انتهاء الصلاحية
- ما إذا كان يمكن إعادة استخدام القرار

الأسئلة منفصلة عن الموافقات. السؤال يطلب معلومات من المستخدم أو التطبيق المضيف.
أما الموافقة فتطلب إذنًا لتنفيذ إجراء.

## نموذج ToolSpace

تحتاج التطبيقات إلى فهم سطح الأدوات دون استيراد تفاصيل Plugin الداخلية.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

ينبغي أن تعرض حزمة SDK:

- بيانات وصفية مُطبّعة للأدوات
- المصدر: OpenClaw أو MCP أو Plugin أو قناة أو وقت تشغيل أو تطبيق
- ملخص المخطط
- سياسة الموافقة
- توافق وقت التشغيل
- ما إذا كانت الأداة مخفية، أو للقراءة فقط، أو قادرة على الكتابة، أو قادرة على العمل عبر المضيف

ينبغي أن يكون استدعاء الأدوات عبر SDK صريحًا ومحدّد النطاق. ينبغي أن تشغّل معظم التطبيقات
الوكلاء، لا أن تستدعي أدوات عشوائية مباشرةً.

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

- تعديلات الملفات والملفات المولّدة
- حزم الرقع
- فروقات VCS
- لقطات الشاشة ومخرجات الوسائط
- السجلات وحزم التتبع
- روابط طلبات السحب
- مسارات وقت التشغيل
- لقطات مساحات عمل البيئة المُدارة

ينبغي أن يدعم الوصول إلى الآثار التنقيح، والاحتفاظ، وروابط التنزيل دون
افتراض أن كل أثر هو ملف محلي عادي.

## نموذج الأمان

يجب أن تكون حزمة SDK للتطبيقات صريحة بشأن الصلاحية.

نطاقات الرموز المميزة الموصى بها:

| النطاق               | يسمح بـ                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | سرد الوكلاء وفحصهم.                            |
| `agent.run`         | بدء عمليات التشغيل.                                         |
| `session.read`      | قراءة بيانات الجلسة الوصفية والرسائل.                 |
| `session.write`     | إنشاء الجلسات، والإرسال إليها، وتفريعها، وضغطها، وإيقافها. |
| `task.read`         | قراءة حالة مهام الخلفية.                         |
| `task.write`        | إلغاء سياسة إشعارات المهام أو تعديلها.          |
| `approval.respond`  | الموافقة على الطلبات أو رفضها.                           |
| `tools.invoke`      | استدعاء الأدوات المكشوفة مباشرةً.                      |
| `artifacts.read`    | سرد الآثار وتنزيلها.                        |
| `environment.write` | إنشاء البيئات المُدارة أو إتلافها.             |
| `admin`             | عمليات إدارية.                          |

الإعدادات الافتراضية:

- لا تمرير للأسرار افتراضيًا
- لا تمرير غير مقيّد لمتغيرات البيئة
- مراجع الأسرار بدلًا من قيم الأسرار
- سياسة صندوق عزل وشبكة صريحة
- احتفاظ صريح بالبيئة البعيدة
- موافقات لتنفيذ المضيف ما لم تثبت السياسة خلاف ذلك
- تنقيح أحداث وقت التشغيل الخام قبل مغادرتها Gateway ما لم يكن لدى المستدعي
  نطاق تشخيص أقوى

## موفر البيئة المُدارة

ينبغي تنفيذ الوكلاء المُدارين كموفري بيئة.

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

لا يحتاج التنفيذ الأول إلى أن يكون خدمة SaaS مستضافة. يمكن أن يستهدف
مضيفي Node الحاليين، أو مساحات عمل مؤقتة، أو مشغلات بأسلوب CI، أو بيئات بأسلوب Testbox.
العقد المهم هو:

1. تجهيز مساحة العمل
2. ربط البيئة والأسرار بأمان
3. بدء التشغيل
4. بث الأحداث
5. جمع الآثار
6. التنظيف أو الاحتفاظ حسب السياسة

بعد أن يستقر هذا، يمكن لخدمة سحابية مستضافة تنفيذ عقد الموفّر نفسه.

## بنية الحزم

الحزم الموصى بها:

| الحزمة                 | الغرض                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK عامة عالية المستوى وعميل Gateway منخفض المستوى ومولّد. |
| `@openclaw/sdk-react`   | خطافات React اختيارية للوحات المعلومات وبناة التطبيقات.         |
| `@openclaw/sdk-testing` | مساعدات اختبار وخادم Gateway وهمي لتكاملات التطبيقات.    |

لدى المستودع بالفعل `openclaw/plugin-sdk/*` للـ Plugins. أبقِ مساحة الأسماء هذه
منفصلة لتجنب إرباك مؤلفي Plugin بمطوري التطبيقات.

## استراتيجية العميل المولّد

يجب توليد العميل منخفض المستوى من مخططات بروتوكول Gateway ذات الإصدارات، ثم تغليفه بفئات مريحة مكتوبة يدويًا.

الطبقات:

1. مخطط Gateway بوصفه مصدر الحقيقة.
2. عميل TypeScript منخفض المستوى مولَّد.
3. أدوات تحقق وقت التشغيل للمدخلات الخارجية وحمولات الأحداث.
4. أغلفة `OpenClaw` و`Agent` و`Session` و`Run` و`Task` و`Artifact`
   عالية المستوى.
5. أمثلة Cookbook واختبارات التكامل.

الفوائد:

- يصبح انحراف البروتوكول مرئيًا
- يمكن للاختبارات مقارنة التوابع المولَّدة بصادرات Gateway
- تبقى App SDK مستقلة عن داخليات Plugin SDK
- يظل لدى مستهلكي المستوى المنخفض وصول كامل إلى البروتوكول
- يحصل مستهلكو المستوى العالي على واجهة API صغيرة للمنتج

## مستندات ذات صلة

- [OpenClaw App SDK](/ar/concepts/openclaw-sdk)
- [مرجع Gateway RPC](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [المهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
