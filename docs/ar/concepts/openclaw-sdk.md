---
read_when:
    - أنت تبني تطبيقًا خارجيًا أو سكربتًا أو لوحة معلومات أو وظيفة CI أو امتدادًا لبيئة تطوير متكاملة يتواصل مع OpenClaw
    - أنت تختار بين عدة تطوير برمجيات التطبيق وعدة تطوير برمجيات Plugin
    - أنت تتكامل مع عمليات تشغيل وكلاء Gateway أو الجلسات أو الأحداث أو الموافقات أو النماذج أو الأدوات
sidebarTitle: App SDK
summary: حزمة تطوير تطبيقات OpenClaw العامة للتطبيقات الخارجية، والبرامج النصية، ولوحات المعلومات، ومهام CI، وامتدادات IDE
title: SDK تطبيق OpenClaw
x-i18n:
    generated_at: "2026-04-30T07:54:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

حزمة **SDK لتطبيقات OpenClaw** هي واجهة API العامة للعميل للتطبيقات خارج عملية
OpenClaw. استخدم `@openclaw/sdk` عندما يريد سكربت أو لوحة معلومات أو مهمة CI أو
إضافة IDE أو أي تطبيق خارجي آخر الاتصال بـ Gateway أو بدء تشغيلات الوكلاء أو
بث الأحداث أو انتظار النتائج أو إلغاء العمل أو فحص موارد Gateway.

<Note>
  تختلف حزمة SDK للتطبيقات عن [Plugin SDK](/ar/plugins/sdk-overview).
  يتحدث `@openclaw/sdk` مع Gateway من خارج OpenClaw.
  `openclaw/plugin-sdk/*` مخصص فقط للـ plugins التي تعمل داخل OpenClaw
  وتسجل مزودي الخدمة أو القنوات أو الأدوات أو الخطافات أو بيئات التشغيل الموثوقة.
</Note>

## ما الذي يتوفر اليوم

تأتي `@openclaw/sdk` مع:

| الواجهة                   | الحالة  | ما الذي تفعله                                                                 |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | جاهز   | نقطة دخول العميل الرئيسية. تدير النقل والاتصال والطلبات والأحداث.   |
| `GatewayClientTransport`  | جاهز   | نقل WebSocket مدعوم بعميل Gateway.                            |
| `oc.agents`               | جاهز   | تسرد مقابض الوكلاء وتنشئها وتحدثها وتحذفها وتحصل عليها.                    |
| `Agent.run()`             | جاهز   | تبدأ تشغيل `agent` عبر Gateway وتعيد `Run`.                            |
| `oc.runs`                 | جاهز   | تنشئ التشغيلات وتحصل عليها وتنتظرها وتلغيها وتبثها.                         |
| `Run.events()`            | جاهز   | تبث أحداثا موحدة لكل تشغيل مع إعادة تشغيل للتشغيلات السريعة.                 |
| `Run.wait()`              | جاهز   | تستدعي `agent.wait` وتعيد `RunResult` مستقرة.                         |
| `Run.cancel()`            | جاهز   | تستدعي `sessions.abort` حسب معرف التشغيل، مع مفتاح الجلسة عند توفره.           |
| `oc.sessions`             | جاهز   | تنشئ مقابض الجلسات وتحلها وترسل إليها وترقعها وتضغطها وتحصل عليها.    |
| `Session.send()`          | جاهز   | تستدعي `sessions.send` وتعيد `Run`.                                   |
| `oc.models`               | جاهز   | تستدعي `models.list` وRPC الحالية لحالة `models.authStatus`.          |
| `oc.tools`                | جزئي | تسرد كتالوج الأدوات والأدوات الفعالة؛ استدعاء الأدوات المباشر غير موصل. |
| `oc.approvals`            | جاهز   | تسرد موافقات التنفيذ وتحلها عبر RPCs موافقات Gateway.             |
| `oc.rawEvents()`          | جاهز   | تكشف أحداث Gateway الخام للمستهلكين المتقدمين.                           |
| `normalizeGatewayEvent()` | جاهز   | تحول أحداث Gateway الخام إلى شكل حدث SDK المستقر.                 |

تصدر SDK أيضا الأنواع الأساسية المستخدمة بواسطة هذه الواجهات:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode`, وأنواع النتائج ذات الصلة.

## الاتصال بـ Gateway

أنشئ عميلا باستخدام عنوان URL صريح لـ Gateway، أو احقن نقلا مخصصا
للاختبارات وبيئات تشغيل التطبيقات المضمنة.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` مكافئ لـ `url`. يقبل المنشئ خيار
`gateway: "auto"`، لكن اكتشاف Gateway التلقائي ليس ميزة SDK منفصلة بعد؛ مرر
`url` عندما لا يعرف التطبيق بالفعل كيفية اكتشاف Gateway.

للاختبارات، مرر كائنا ينفذ `OpenClawTransport`:

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

يتم تقسيم مراجع النماذج المؤهلة بالمزود مثل `openai/gpt-5.5` إلى تجاوزات
`provider` و`model` في Gateway. تبقى `timeoutMs` بالميلي ثانية في SDK
وتحول إلى ثواني مهلة Gateway من أجل RPC الخاصة بـ `agent`.

يستخدم `run.wait()` RPC الخاصة بـ Gateway وهي `agent.wait`. مهلة انتظار تنتهي
بينما لا يزال التشغيل نشطا تعيد `status: "accepted"` بدلا من الادعاء بأن
التشغيل نفسه انتهت مهلته. يتم توحيد مهل وقت التشغيل والتشغيلات المجهضة
والتشغيلات الملغاة إلى `timed_out` أو `cancelled`.

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

يستدعي `Session.send()` الدالة `sessions.send` ويعيد `Run`. تدعم مقابض الجلسات أيضا:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## بث الأحداث

توحد SDK أحداث Gateway الخام في غلاف `OpenClawEvent` مستقر:

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

| نوع الحدث            | حدث Gateway المصدر                        |
| --------------------- | ------------------------------------------- |
| `run.started`         | بدء دورة حياة `agent`                     |
| `run.completed`       | انتهاء دورة حياة `agent`                       |
| `run.failed`          | خطأ دورة حياة `agent`                     |
| `run.cancelled`       | انتهاء دورة حياة مجهضة/ملغاة             |
| `run.timed_out`       | انتهاء دورة حياة بسبب المهلة                       |
| `assistant.delta`     | فرق بث المساعد                   |
| `assistant.message`   | رسالة المساعد                           |
| `thinking.delta`      | بث التفكير أو الخطة                     |
| `tool.call.started`   | بدء أداة/عنصر/أمر                     |
| `tool.call.delta`     | تحديث أداة/عنصر/أمر                    |
| `tool.call.completed` | اكتمال أداة/عنصر/أمر                |
| `tool.call.failed`    | فشل أداة/عنصر/أمر أو حالة محظورة |
| `approval.requested`  | طلب موافقة تنفيذ أو plugin             |
| `approval.resolved`   | حل موافقة تنفيذ أو plugin          |
| `session.created`     | إنشاء `sessions.changed`                   |
| `session.updated`     | تحديث `sessions.changed`                   |
| `session.compacted`   | ضغط `sessions.changed`               |
| `task.updated`        | أحداث تحديث المهمة                          |
| `artifact.updated`    | أحداث بث الرقع                         |
| `raw`                 | أي حدث بلا ربط SDK مستقر بعد  |

يرشح `Run.events()` الأحداث إلى معرف تشغيل واحد ويعيد تشغيل الأحداث التي شوهدت
بالفعل للتشغيلات السريعة. هذا يعني أن التدفق الموثق آمن:

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

## النماذج والأدوات والموافقات

تتطابق مساعدات النماذج مع طرق Gateway الحالية:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

تكشف مساعدات الأدوات كتالوج Gateway وعرض الأدوات الفعالة:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

تستخدم مساعدات الموافقات RPCs موافقة التنفيذ:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## غير مدعوم صراحة اليوم

تتضمن SDK أسماء لنموذج المنتج الذي نريده، لكنها لا تتظاهر بصمت بأن RPCs
Gateway موجودة. ترمي هذه الاستدعاءات حاليا أخطاء صريحة بأنها غير مدعومة:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

حقول `workspace` و`runtime` و`environment` و`approvals` لكل تشغيل مطبوعة
كشكل مستقبلي، لكن Gateway الحالية لا تدعم هذه التجاوزات على RPC الخاصة بـ
`agent`. إذا مررها المستدعون، ترمي SDK قبل إرسال التشغيل حتى لا ينفذ العمل
بالخطأ بسلوك مساحة العمل أو وقت التشغيل أو البيئة أو الموافقات الافتراضي.

## App SDK مقابل Plugin SDK

استخدم App SDK عندما يعيش الكود خارج OpenClaw:

- سكربتات Node التي تبدأ تشغيلات الوكلاء أو تراقبها
- مهام CI التي تستدعي Gateway
- لوحات المعلومات ولوحات الإدارة
- إضافات IDE
- الجسور الخارجية التي لا تحتاج إلى أن تصبح plugins قنوات
- اختبارات التكامل مع عمليات نقل Gateway مزيفة أو حقيقية

استخدم Plugin SDK عندما يعمل الكود داخل OpenClaw:

- plugins مزودي الخدمة
- plugins القنوات
- خطافات الأدوات أو دورة الحياة
- plugins أحزمة الوكلاء
- مساعدات وقت التشغيل الموثوقة

ينبغي لكود App SDK الاستيراد من `@openclaw/sdk`. وينبغي لكود Plugin الاستيراد من
المسارات الفرعية الموثقة `openclaw/plugin-sdk/*`. لا تخلط بين العقدين.

## مستندات ذات صلة

- [تصميم API لحزمة SDK لتطبيقات OpenClaw](/ar/reference/openclaw-sdk-api-design)
- [مرجع RPC الخاص بـ Gateway](/ar/reference/rpc)
- [حلقة الوكيل](/ar/concepts/agent-loop)
- [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [الجلسات](/ar/concepts/session)
- [مهام الخلفية](/ar/automation/tasks)
- [وكلاء ACP](/ar/tools/acp-agents)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
