---
read_when:
    - أنت تبني تطبيقًا خارجيًا أو برنامجًا نصيًا أو لوحة معلومات أو مهمة CI أو إضافة IDE تتواصل مع OpenClaw
    - أنت تختار بين App SDK وPlugin SDK
    - أنت تتكامل مع عمليات تشغيل الوكلاء في Gateway، أو الجلسات، أو الأحداث، أو الموافقات، أو النماذج، أو الأدوات
sidebarTitle: App SDK
summary: حزمة تطوير تطبيقات OpenClaw العامة للتطبيقات الخارجية والنصوص البرمجية ولوحات المعلومات ومهام CI وامتدادات IDE
title: حزمة تطوير تطبيق OpenClaw
x-i18n:
    generated_at: "2026-05-02T07:25:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** هي واجهة API العامة للعميل للتطبيقات خارج عملية
OpenClaw. استخدم `@openclaw/sdk` عندما يريد سكربت أو لوحة معلومات أو مهمة CI أو إضافة IDE
أو أي تطبيق خارجي آخر الاتصال بـ Gateway، أو بدء تشغيلات الوكيل،
أو بث الأحداث، أو انتظار النتائج، أو إلغاء العمل، أو فحص موارد Gateway.

<Note>
  يختلف App SDK عن [Plugin SDK](/ar/plugins/sdk-overview).
  يتواصل `@openclaw/sdk` مع Gateway من خارج OpenClaw.
  يُستخدم `openclaw/plugin-sdk/*` فقط للـ plugins التي تعمل داخل OpenClaw وتسجل
  الموفرين أو القنوات أو الأدوات أو الخطافات أو بيئات التشغيل الموثوقة.
</Note>

## ما يتم شحنه اليوم

يأتي `@openclaw/sdk` مع:

| السطح                    | الحالة | ما يفعله                                                                  |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | جاهز   | نقطة الدخول الرئيسية للعميل. يدير النقل والاتصال والطلبات والأحداث. |
| `GatewayClientTransport`  | جاهز   | نقل WebSocket مدعوم بعميل Gateway.                          |
| `oc.agents`               | جاهز   | يسرد مقابض الوكلاء وينشئها ويحدثها ويحذفها ويحصل عليها.                  |
| `Agent.run()`             | جاهز   | يبدأ تشغيل Gateway من نوع `agent` ويعيد `Run`.                          |
| `oc.runs`                 | جاهز   | ينشئ التشغيلات ويحصل عليها وينتظرها ويلغيها ويبثها.                       |
| `Run.events()`            | جاهز   | يبث أحداثا موحدة لكل تشغيل مع إعادة تشغيل للتشغيلات السريعة.               |
| `Run.wait()`              | جاهز   | يستدعي `agent.wait` ويعيد `RunResult` مستقرا.                       |
| `Run.cancel()`            | جاهز   | يستدعي `sessions.abort` بواسطة معرف التشغيل، مع مفتاح الجلسة عند توفره.         |
| `oc.sessions`             | جاهز   | ينشئ مقابض الجلسات ويحلها ويرسل إليها ويرقعها ويضغطها ويحصل عليها.  |
| `Session.send()`          | جاهز   | يستدعي `sessions.send` ويعيد `Run`.                                 |
| `oc.models`               | جاهز   | يستدعي `models.list` وRPC الحالة الحالية `models.authStatus`.        |
| `oc.tools`                | جاهز   | يسرد أدوات Gateway ويحدد نطاقها ويستدعيها عبر مسار السياسة.      |
| `oc.artifacts`            | جاهز   | يسرد artifacts نصوص Gateway ويحصل عليها وينزلها.                   |
| `oc.approvals`            | جاهز   | يسرد موافقات التنفيذ ويحلها عبر RPCs موافقة Gateway.           |
| `oc.rawEvents()`          | جاهز   | يكشف أحداث Gateway الخام للمستهلكين المتقدمين.                         |
| `normalizeGatewayEvent()` | جاهز   | يحول أحداث Gateway الخام إلى شكل حدث SDK المستقر.               |

يصدر SDK أيضا الأنواع الأساسية المستخدمة بواسطة تلك الأسطح:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`، وأنواع النتائج
ذات الصلة.

## الاتصال بـ Gateway

أنشئ عميلا باستخدام عنوان URL صريح لـ Gateway، أو احقن نقلا مخصصا للاختبارات
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

`new OpenClaw({ gateway: "ws://..." })` يكافئ `url`. خيار
`gateway: "auto"` مقبول من المنشئ، لكن الاكتشاف التلقائي لـ Gateway
ليس ميزة SDK منفصلة بعد؛ مرر `url` عندما لا يعرف التطبيق مسبقا كيفية
اكتشاف Gateway.

للاختبارات، مرر كائنا يطبق `OpenClawTransport`:

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

استخدم `oc.agents.get(id)` عندما يريد التطبيق مقبض وكيل، ثم استدع
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

تُقسم مراجع النماذج المؤهلة بالموفر مثل `openai/gpt-5.5` إلى تجاوزات Gateway
لـ `provider` و`model`. يبقى `timeoutMs` بالمللي ثانية في SDK ويتم تحويله
إلى مهلة Gateway بالثواني من أجل RPC الخاص بـ `agent`.

يستخدم `run.wait()` RPC الخاص بـ Gateway باسم `agent.wait`. مهلة انتظار تنتهي
بينما لا يزال التشغيل نشطا تعيد `status: "accepted"` بدلا من الادعاء بأن
التشغيل نفسه انتهت مهلته. يتم توحيد مهل التشغيل، والتشغيلات المجهضة، والتشغيلات الملغاة
إلى `timed_out` أو `cancelled`.

## إنشاء الجلسات وإعادة استخدامها

استخدم الجلسات عندما يريد التطبيق حالة نص محادثة دائمة.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

يستدعي `Session.send()` الأمر `sessions.send` ويعيد `Run`. كما تدعم مقابض الجلسات:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## بث الأحداث

يوحد SDK أحداث Gateway الخام داخل غلاف `OpenClawEvent` مستقر:

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
| `run.started`         | بدء دورة حياة `agent`                     |
| `run.completed`       | نهاية دورة حياة `agent`                       |
| `run.failed`          | خطأ دورة حياة `agent`                     |
| `run.cancelled`       | نهاية دورة حياة مجهضة/ملغاة             |
| `run.timed_out`       | نهاية دورة حياة بسبب المهلة                       |
| `assistant.delta`     | دلتا بث المساعد                   |
| `assistant.message`   | رسالة المساعد                           |
| `thinking.delta`      | بث التفكير أو الخطة                     |
| `tool.call.started`   | بدء أداة/عنصر/أمر                     |
| `tool.call.delta`     | تحديث أداة/عنصر/أمر                    |
| `tool.call.completed` | اكتمال أداة/عنصر/أمر                |
| `tool.call.failed`    | فشل أداة/عنصر/أمر أو حالة حظر |
| `approval.requested`  | طلب موافقة تنفيذ أو Plugin             |
| `approval.resolved`   | حل موافقة تنفيذ أو Plugin          |
| `session.created`     | إنشاء `sessions.changed`                   |
| `session.updated`     | تحديث `sessions.changed`                   |
| `session.compacted`   | ضغط `sessions.changed`               |
| `task.updated`        | أحداث تحديث المهمة                          |
| `artifact.updated`    | أحداث بث التصحيح                         |
| `raw`                 | أي حدث لا يملك تعيينا مستقرا في SDK بعد  |

يرشح `Run.events()` الأحداث إلى معرف تشغيل واحد ويعيد تشغيل الأحداث التي شوهدت مسبقا
للتشغيلات السريعة. يعني ذلك أن التدفق الموثق آمن:

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

## النماذج والأدوات وArtifacts والموافقات

تتطابق مساعدات النماذج مع طرق Gateway الحالية:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

تكشف مساعدات الأدوات كتالوج Gateway، وعرض الأدوات الفعال، والاستدعاء المباشر
لأدوات Gateway. يعيد `oc.tools.invoke()` غلافا ذا نوع بدلا من الرمي عند رفض
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

تكشف مساعدات Artifacts إسقاط artifact في Gateway لسياق الجلسة أو التشغيل أو
المهمة. يتطلب كل استدعاء نطاقا صريحا واحدا من `sessionKey` أو `runId` أو
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

تستخدم مساعدات الموافقات RPCs موافقة التنفيذ:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## غير مدعوم صراحة اليوم

يتضمن SDK أسماء لنموذج المنتج الذي نريده، لكنه لا يتظاهر بصمت
بوجود RPCs في Gateway. ترمي هذه الاستدعاءات حاليا أخطاء عدم دعم صريحة:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

حقول كل تشغيل `workspace` و`runtime` و`environment` و`approvals` منمطة
كشكل مستقبلي، لكن Gateway الحالي لا يدعم تلك التجاوزات على
RPC الخاص بـ `agent`. إذا مررها المستدعون، يرمي SDK قبل إرسال التشغيل
حتى لا يتم تنفيذ العمل عن غير قصد بسلوك مساحة العمل أو بيئة التشغيل أو
البيئة أو الموافقة الافتراضي.

## App SDK مقابل Plugin SDK

استخدم App SDK عندما تعيش الشيفرة خارج OpenClaw:

- سكربتات Node التي تبدأ تشغيلات الوكلاء أو تراقبها
- مهام CI التي تستدعي Gateway
- لوحات المعلومات ولوحات الإدارة
- إضافات IDE
- الجسور الخارجية التي لا تحتاج إلى أن تصبح channel plugins
- اختبارات التكامل مع نُقُل Gateway وهمية أو حقيقية

استخدم Plugin SDK عندما تعمل الشيفرة داخل OpenClaw:

- provider plugins
- channel plugins
- خطافات الأدوات أو دورة الحياة
- agent harness plugins
- مساعدات بيئة تشغيل موثوقة

ينبغي أن تستورد شيفرة App SDK من `@openclaw/sdk`. وينبغي أن تستورد شيفرة Plugin من
المسارات الفرعية الموثقة `openclaw/plugin-sdk/*`. لا تخلط بين العقدين.

## مستندات ذات صلة

- [تصميم API لـ OpenClaw App SDK](/ar/reference/openclaw-sdk-api-design)
- [مرجع RPC لـ Gateway](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [الجلسات](/ar/concepts/session)
- [مهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
