---
read_when:
    - أنت تبني تطبيقًا خارجيًا أو برنامجًا نصيًا أو لوحة معلومات أو مهمة CI أو امتداد IDE يتواصل مع OpenClaw
    - أنت تختار بين حزمة SDK للتطبيقات وحزمة SDK للـ Plugin
    - أنت تتكامل مع تشغيلات وكلاء Gateway أو الجلسات أو الأحداث أو الموافقات أو النماذج أو الأدوات
sidebarTitle: App SDK
summary: حزمة تطوير تطبيقات OpenClaw العامة للتطبيقات الخارجية والنصوص البرمجية ولوحات المعلومات ومهام CI وامتدادات IDE
title: حزمة تطوير البرمجيات لتطبيق OpenClaw
x-i18n:
    generated_at: "2026-05-01T07:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

تُعد **OpenClaw App SDK** واجهة API العامة للعميل للتطبيقات خارج عملية
OpenClaw. استخدم `@openclaw/sdk` عندما يريد برنامج نصي أو لوحة معلومات أو مهمة CI أو إضافة IDE
أو تطبيق خارجي آخر الاتصال بـ Gateway، أو بدء تشغيلات الوكلاء،
أو بث الأحداث، أو انتظار النتائج، أو إلغاء العمل، أو فحص موارد Gateway.

<Note>
  تختلف App SDK عن [Plugin SDK](/ar/plugins/sdk-overview).
  يتواصل `@openclaw/sdk` مع Gateway من خارج OpenClaw.
  لا يُستخدم `openclaw/plugin-sdk/*` إلا للإضافات التي تعمل داخل OpenClaw
  وتسجل المزوّدين أو القنوات أو الأدوات أو الخطافات أو بيئات التشغيل الموثوقة.
</Note>

## ما الذي يُشحن اليوم

يُشحن `@openclaw/sdk` مع:

| السطح                    | الحالة | ما يفعله                                                                     |
| ------------------------ | ------ | ----------------------------------------------------------------------------- |
| `OpenClaw`                | جاهز   | نقطة الدخول الرئيسية للعميل. يملك النقل والاتصال والطلبات والأحداث.          |
| `GatewayClientTransport`  | جاهز   | نقل WebSocket مدعوم بعميل Gateway.                                           |
| `oc.agents`               | جاهز   | يسرد مقابض الوكلاء وينشئها ويحدّثها ويحذفها ويحصل عليها.                    |
| `Agent.run()`             | جاهز   | يبدأ تشغيل Gateway `agent` ويعيد `Run`.                                      |
| `oc.runs`                 | جاهز   | ينشئ التشغيلات ويحصل عليها وينتظرها ويلغيها ويبثها.                         |
| `Run.events()`            | جاهز   | يبث أحداثًا موحّدة لكل تشغيل مع إعادة تشغيل للتشغيلات السريعة.              |
| `Run.wait()`              | جاهز   | يستدعي `agent.wait` ويعيد `RunResult` مستقرًا.                               |
| `Run.cancel()`            | جاهز   | يستدعي `sessions.abort` حسب معرّف التشغيل، مع مفتاح الجلسة عند توفره.        |
| `oc.sessions`             | جاهز   | ينشئ مقابض الجلسات ويحلها ويرسل إليها ويصححها ويضغطها ويحصل عليها.          |
| `Session.send()`          | جاهز   | يستدعي `sessions.send` ويعيد `Run`.                                          |
| `oc.models`               | جاهز   | يستدعي `models.list` وحالة `models.authStatus` RPC الحالية.                  |
| `oc.tools`                | جزئي   | يسرد كتالوج الأدوات والأدوات الفعالة؛ استدعاء الأدوات المباشر غير موصول.    |
| `oc.artifacts`            | جاهز   | يسرد مصنوعات نصوص Gateway ويحصل عليها وينزلها.                              |
| `oc.approvals`            | جاهز   | يسرد موافقات التنفيذ ويحلها عبر RPCs موافقات Gateway.                       |
| `oc.rawEvents()`          | جاهز   | يعرّض أحداث Gateway الخام للمستهلكين المتقدمين.                             |
| `normalizeGatewayEvent()` | جاهز   | يحوّل أحداث Gateway الخام إلى شكل حدث SDK المستقر.                          |

تصدّر SDK أيضًا الأنواع الأساسية التي تستخدمها تلك الأسطح:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`، وأنواع النتائج
ذات الصلة.

## الاتصال بـ Gateway

أنشئ عميلًا باستخدام عنوان URL صريح لـ Gateway، أو احقن نقلًا مخصصًا للاختبارات
وبيئات تشغيل التطبيقات المضمنة.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` مكافئ لـ `url`. يُقبل خيار
`gateway: "auto"` في المُنشئ، لكن اكتشاف Gateway التلقائي ليس ميزة SDK مستقلة
بعد؛ مرّر `url` عندما لا يعرف التطبيق بالفعل كيف يكتشف Gateway.

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

تُقسّم مراجع النماذج المؤهلة بالمزوّد مثل `openai/gpt-5.5` إلى تجاوزات Gateway
لـ `provider` و`model`. يبقى `timeoutMs` بالمللي ثانية في SDK
ويُحوّل إلى ثواني مهلة Gateway من أجل RPC الخاص بـ `agent`.

يستخدم `run.wait()` RPC الخاص بـ Gateway `agent.wait`. مهلة الانتظار التي تنتهي
بينما لا يزال التشغيل نشطًا تعيد `status: "accepted"` بدلًا من الادعاء بأن
التشغيل نفسه انتهت مهلته. تُوحّد مهل التشغيل وإجهاض التشغيلات والتشغيلات الملغاة
إلى `timed_out` أو `cancelled`.

## إنشاء الجلسات وإعادة استخدامها

استخدم الجلسات عندما يريد التطبيق حالة نص حوار دائمة.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

يستدعي `Session.send()` ‏`sessions.send` ويعيد `Run`. تدعم مقابض الجلسات أيضًا:

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
| --------------------- | ------------------------------------------ |
| `run.started`         | بداية دورة حياة `agent`                    |
| `run.completed`       | نهاية دورة حياة `agent`                    |
| `run.failed`          | خطأ دورة حياة `agent`                      |
| `run.cancelled`       | نهاية دورة حياة مُجهضة/ملغاة               |
| `run.timed_out`       | نهاية دورة حياة بسبب انتهاء المهلة         |
| `assistant.delta`     | جزء بث المساعد                             |
| `assistant.message`   | رسالة المساعد                              |
| `thinking.delta`      | بث التفكير أو الخطة                        |
| `tool.call.started`   | بدء أداة/عنصر/أمر                          |
| `tool.call.delta`     | تحديث أداة/عنصر/أمر                        |
| `tool.call.completed` | اكتمال أداة/عنصر/أمر                       |
| `tool.call.failed`    | فشل أداة/عنصر/أمر أو حالة محظورة           |
| `approval.requested`  | طلب موافقة تنفيذ أو إضافة                  |
| `approval.resolved`   | حل موافقة تنفيذ أو إضافة                   |
| `session.created`     | إنشاء `sessions.changed`                   |
| `session.updated`     | تحديث `sessions.changed`                   |
| `session.compacted`   | ضغط `sessions.changed`                     |
| `task.updated`        | أحداث تحديث المهمة                         |
| `artifact.updated`    | أحداث بث الرقع                             |
| `raw`                 | أي حدث بلا تعيين SDK مستقر بعد             |

يرشح `Run.events()` الأحداث إلى معرّف تشغيل واحد ويعيد تشغيل الأحداث التي شوهدت
بالفعل للتشغيلات السريعة. يعني ذلك أن التدفق الموثّق آمن:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

للبث على مستوى التطبيق، استخدم `oc.events()`. لإطارات Gateway الخام، استخدم
`oc.rawEvents()`.

## النماذج والأدوات والمصنوعات والموافقات

تعيّن مساعدات النماذج إلى طرق Gateway الحالية:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

تعرّض مساعدات الأدوات كتالوج Gateway وعرض الأدوات الفعالة:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

تعرّض مساعدات المصنوعات إسقاط مصنوعات Gateway لسياق الجلسة أو التشغيل أو
المهمة. يتطلب كل استدعاء نطاقًا صريحًا واحدًا من `sessionKey` أو `runId` أو
`taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

تستخدم مساعدات الموافقة RPCs موافقات التنفيذ:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## غير مدعوم صراحة اليوم

تتضمن SDK أسماء لنموذج المنتج الذي نريده، لكنها لا تتظاهر بصمت بوجود RPCs
في Gateway. تُلقي هذه الاستدعاءات حاليًا أخطاء عدم دعم صريحة:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

حقول `workspace` و`runtime` و`environment` و`approvals` لكل تشغيل مكتوبة
كشكل مستقبلي، لكن Gateway الحالي لا يدعم تلك التجاوزات في RPC الخاص بـ
`agent`. إذا مررها المستدعون، تُلقي SDK خطأ قبل إرسال التشغيل حتى لا يُنفذ
العمل عن طريق الخطأ بسلوك مساحة العمل أو بيئة التشغيل أو البيئة أو الموافقة
الافتراضي.

## App SDK مقابل Plugin SDK

استخدم App SDK عندما توجد الشفرة خارج OpenClaw:

- برامج Node النصية التي تبدأ تشغيلات الوكلاء أو تراقبها
- مهام CI التي تستدعي Gateway
- لوحات المعلومات ولوحات الإدارة
- إضافات IDE
- الجسور الخارجية التي لا تحتاج إلى أن تصبح إضافات قنوات
- اختبارات التكامل مع عمليات نقل Gateway وهمية أو حقيقية

استخدم Plugin SDK عندما تعمل الشفرة داخل OpenClaw:

- إضافات المزوّدين
- إضافات القنوات
- خطافات الأدوات أو دورة الحياة
- إضافات عُدد الوكلاء
- مساعدات بيئة التشغيل الموثوقة

ينبغي لشفرة App SDK الاستيراد من `@openclaw/sdk`. ينبغي لشفرة Plugin الاستيراد
من المسارات الفرعية الموثّقة `openclaw/plugin-sdk/*`. لا تخلط بين العقدين.

## مستندات ذات صلة

- [تصميم API لـ OpenClaw App SDK](/ar/reference/openclaw-sdk-api-design)
- [مرجع RPC لـ Gateway](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [الجلسات](/ar/concepts/session)
- [المهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
