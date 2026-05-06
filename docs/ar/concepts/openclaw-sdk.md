---
read_when:
    - أنت تبني تطبيقًا خارجيًا أو نصًا برمجيًا أو لوحة معلومات أو مهمة CI أو إضافة IDE تتواصل مع OpenClaw
    - أنت تختار بين App SDK وPlugin SDK
    - أنت تتكامل مع عمليات تشغيل وكلاء Gateway أو الجلسات أو الأحداث أو الموافقات أو النماذج أو الأدوات
sidebarTitle: App SDK
summary: حزمة SDK العامة لتطبيق OpenClaw للتطبيقات الخارجية والبرامج النصية ولوحات المعلومات ومهام CI وامتدادات IDE
title: حزمة تطوير تطبيق OpenClaw
x-i18n:
    generated_at: "2026-05-06T07:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

تُعد **OpenClaw App SDK** واجهة API العامة للعملاء للتطبيقات خارج عملية
OpenClaw. استخدم `@openclaw/sdk` عندما يريد سكربت أو لوحة معلومات أو مهمة CI أو
إضافة IDE أو أي تطبيق خارجي آخر الاتصال بـ Gateway، أو بدء تشغيلات الوكيل، أو
بث الأحداث، أو انتظار النتائج، أو إلغاء العمل، أو فحص موارد Gateway.

<Note>
  تختلف App SDK عن [Plugin SDK](/ar/plugins/sdk-overview).
  يتواصل `@openclaw/sdk` مع Gateway من خارج OpenClaw.
  أما `openclaw/plugin-sdk/*` فهو مخصص فقط للـ plugins التي تعمل داخل OpenClaw
  وتسجل المزودين أو القنوات أو الأدوات أو الخطافات أو بيئات التشغيل الموثوقة.
</Note>

## ما الذي يُشحن اليوم

يُشحن `@openclaw/sdk` مع:

| السطح                    | الحالة  | ما الذي يفعله                                                                      |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | جاهز    | نقطة الدخول الرئيسية للعميل. يمتلك النقل والاتصال والطلبات والأحداث.              |
| `GatewayClientTransport`  | جاهز    | نقل WebSocket مدعوم بعميل Gateway.                                                 |
| `oc.agents`               | جاهز    | يعرض مقابض الوكلاء وينشئها ويحدّثها ويحذفها ويحصل عليها.                         |
| `Agent.run()`             | جاهز    | يبدأ تشغيل Gateway `agent` ويعيد `Run`.                                            |
| `oc.runs`                 | جاهز    | ينشئ التشغيلات ويحصل عليها وينتظرها ويلغيها ويبثها.                              |
| `Run.events()`            | جاهز    | يبث أحداثًا موحّدة لكل تشغيل مع إعادة تشغيل للتشغيلات السريعة.                  |
| `Run.wait()`              | جاهز    | يستدعي `agent.wait` ويعيد `RunResult` مستقرًا.                                     |
| `Run.cancel()`            | جاهز    | يستدعي `sessions.abort` حسب معرّف التشغيل، مع مفتاح الجلسة عند توفره.            |
| `oc.sessions`             | جاهز    | ينشئ مقابض الجلسات ويحلها ويرسل إليها ويرقعها ويضغطها ويحصل عليها.              |
| `Session.send()`          | جاهز    | يستدعي `sessions.send` ويعيد `Run`.                                                |
| `oc.models`               | جاهز    | يستدعي `models.list` وحالة RPC الحالية `models.authStatus`.                       |
| `oc.tools`                | جاهز    | يعرض أدوات Gateway ويحدد نطاقها ويستدعيها عبر مسار السياسة.                      |
| `oc.artifacts`            | جاهز    | يعرض آثار سجل Gateway ويحصل عليها وينزلها.                                        |
| `oc.approvals`            | جاهز    | يعرض موافقات التنفيذ ويحلها عبر استدعاءات RPC للموافقات في Gateway.              |
| `oc.environments`         | جزئي    | يعرض مرشحي البيئات المحلية لـ Gateway وnode؛ الإنشاء والحذف غير موصولين.         |
| `oc.rawEvents()`          | جاهز    | يكشف أحداث Gateway الخام للمستهلكين المتقدمين.                                   |
| `normalizeGatewayEvent()` | جاهز    | يحول أحداث Gateway الخام إلى شكل حدث SDK المستقر.                                |

تصدّر SDK أيضًا الأنواع الأساسية المستخدمة بواسطة تلك الأسطح:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`، وأنواع النتائج
ذات الصلة.

## الاتصال بـ Gateway

أنشئ عميلًا بعنوان URL صريح لـ Gateway، أو احقن نقلًا مخصصًا للاختبارات
وبيئات تشغيل التطبيقات المضمنة.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` مكافئ لـ `url`. يقبل المنشئ خيار
`gateway: "auto"`، لكن الاكتشاف التلقائي لـ Gateway ليس ميزة مستقلة في SDK
حتى الآن؛ مرّر `url` عندما لا يعرف التطبيق مسبقًا كيفية اكتشاف Gateway.

للاختبارات، مرّر كائنًا يطبق `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## تشغيل وكيل

استخدم `oc.agents.get(id)` عندما يريد التطبيق مقبض وكيل، ثم استدعِ
`agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

تُقسّم مراجع النماذج المؤهلة بالمزود مثل `openai/gpt-5.5` إلى تجاوزات Gateway
لـ `provider` و`model`. يبقى `timeoutMs` بالمللي ثانية في SDK ويُحوّل إلى ثواني
مهلة Gateway لاستدعاء RPC الخاص بـ `agent`.

يستخدم `run.wait()` استدعاء RPC في Gateway باسم `agent.wait`. إذا انتهت مهلة
الانتظار بينما لا يزال التشغيل نشطًا، فإنه يعيد `status: "accepted"` بدلًا من
الإيحاء بأن التشغيل نفسه انتهت مهلته. تُوحّد مهل التشغيل وعمليات التشغيل
المجهضة والملغاة إلى `timed_out` أو `cancelled`.

## إنشاء الجلسات وإعادة استخدامها

استخدم الجلسات عندما يريد التطبيق حالة سجل دائمة.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

يستدعي `Session.send()` ‎`sessions.send` ويعيد `Run`. كما تدعم مقابض الجلسات:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## بث الأحداث

توحّد SDK أحداث Gateway الخام في غلاف `OpenClawEvent` مستقر:

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
  raw?: GatewayEvent;
};
```

تشمل أنواع الأحداث الشائعة:

| نوع الحدث             | حدث Gateway المصدر                         |
| --------------------- | ------------------------------------------- |
| `run.started`         | بداية دورة حياة `agent`                    |
| `run.completed`       | نهاية دورة حياة `agent`                    |
| `run.failed`          | خطأ دورة حياة `agent`                      |
| `run.cancelled`       | نهاية دورة حياة مُجهضة/ملغاة              |
| `run.timed_out`       | نهاية دورة حياة بسبب انتهاء المهلة        |
| `assistant.delta`     | فرق بث المساعد                             |
| `assistant.message`   | رسالة المساعد                              |
| `thinking.delta`      | بث التفكير أو الخطة                        |
| `tool.call.started`   | بدء أداة/عنصر/أمر                          |
| `tool.call.delta`     | تحديث أداة/عنصر/أمر                        |
| `tool.call.completed` | إكمال أداة/عنصر/أمر                        |
| `tool.call.failed`    | فشل أداة/عنصر/أمر أو حالة محظورة          |
| `approval.requested`  | طلب موافقة تنفيذ أو Plugin                 |
| `approval.resolved`   | حل موافقة تنفيذ أو Plugin                  |
| `session.created`     | إنشاء `sessions.changed`                   |
| `session.updated`     | تحديث `sessions.changed`                   |
| `session.compacted`   | ضغط `sessions.changed`                     |
| `task.updated`        | أحداث تحديث المهمة                         |
| `artifact.updated`    | أحداث بث الرقع                             |
| `raw`                 | أي حدث بلا تعيين مستقر في SDK حتى الآن    |

يرشح `Run.events()` الأحداث إلى معرّف تشغيل واحد ويعيد تشغيل الأحداث التي
شوهِدت بالفعل للتشغيلات السريعة. وهذا يعني أن التدفق الموثق آمن:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

للبث على مستوى التطبيق، استخدم `oc.events()`. ولإطارات Gateway الخام، استخدم
`oc.rawEvents()`.

## النماذج والأدوات والآثار والموافقات

تتطابق مساعدات النماذج مع طرق Gateway الحالية:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

تكشف مساعدات الأدوات فهرس Gateway، وعرض الأدوات الفعلي، والاستدعاء المباشر
لأدوات Gateway. يعيد `oc.tools.invoke()` غلافًا ذا نوع بدلًا من الرمي عند رفض
السياسة أو الموافقة.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

تكشف مساعدات الآثار إسقاط آثار Gateway لسياق الجلسة أو التشغيل أو المهمة.
يتطلب كل استدعاء نطاقًا صريحًا واحدًا هو `sessionKey` أو `runId` أو `taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

تستخدم مساعدات الموافقات استدعاءات RPC الخاصة بموافقات التنفيذ:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

تكشف مساعدات البيئات اكتشافًا للقراءة فقط للبيئات المحلية لـ Gateway وnode:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## غير مدعوم صراحةً اليوم

تتضمن SDK أسماءً لنموذج المنتج الذي نريده، لكنها لا تتظاهر بصمت بأن استدعاءات
RPC في Gateway موجودة. ترمي هذه الاستدعاءات حاليًا أخطاء صريحة تفيد بأنها غير
مدعومة:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

تُكتب حقول `workspace` و`runtime` و`environment` و`approvals` لكل تشغيل كشكل
مستقبلي، لكن Gateway الحالي لا يدعم هذه التجاوزات على استدعاء RPC الخاص بـ
`agent`. إذا مررها المستدعون، ترمي SDK قبل إرسال التشغيل كي لا يُنفذ العمل
عرضًا بسلوك مساحة العمل أو بيئة التشغيل أو البيئة أو الموافقة الافتراضي.

## App SDK مقابل Plugin SDK

استخدم App SDK عندما تكون الشفرة خارج OpenClaw:

- سكربتات Node التي تبدأ تشغيلات الوكيل أو تراقبها
- مهام CI التي تستدعي Gateway
- لوحات المعلومات ولوحات الإدارة
- إضافات IDE
- الجسور الخارجية التي لا تحتاج إلى أن تصبح plugins قنوات
- اختبارات التكامل مع نواقل Gateway مزيفة أو حقيقية

استخدم Plugin SDK عندما تعمل الشفرة داخل OpenClaw:

- plugins المزودين
- plugins القنوات
- خطافات الأدوات أو دورة الحياة
- plugins أحزمة الوكيل
- مساعدات بيئة التشغيل الموثوقة

يجب أن تستورد شفرة App SDK من `@openclaw/sdk`. ويجب أن تستورد شفرة Plugin من
المسارات الفرعية الموثقة `openclaw/plugin-sdk/*`. لا تخلط بين العقدين.

## ذو صلة

- [تصميم API لـ OpenClaw App SDK](/ar/reference/openclaw-sdk-api-design)
- [مرجع RPC لـ Gateway](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [الجلسات](/ar/concepts/session)
- [المهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
