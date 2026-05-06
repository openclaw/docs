---
read_when:
    - شما در حال پیاده‌سازی SDK عمومی پیشنهادی برنامه OpenClaw هستید
    - به قرارداد پیش‌نویسِ فضای نام، رویداد، نتیجه، آرتیفکت، تأیید یا امنیت برای SDK برنامه نیاز دارید
    - شما در حال مقایسهٔ منابع پروتکل Gateway با پوشش سطح‌بالای SDK برنامهٔ OpenClaw هستید
sidebarTitle: App SDK API design
summary: طراحی مرجع برای API عمومی SDK برنامه OpenClaw، رده‌بندی رویدادها، آرتیفکت‌ها، تأییدیه‌ها و ساختار بسته
title: طراحی واسط برنامه‌نویسی کاربردی کیت توسعه نرم‌افزار برنامه OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:41:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

این صفحه طراحی مرجع تفصیلی API برای
[OpenClaw App SDK](/fa/concepts/openclaw-sdk) عمومی است. این صفحه عمدا از
[Plugin SDK](/fa/plugins/sdk-overview) جدا است.

<Note>
  `@openclaw/sdk` بسته خارجی برنامه/کلاینت برای ارتباط با
  Gateway است. `openclaw/plugin-sdk/*` قرارداد درون‌فرایندی نویسندگی Plugin است.
  از مسیرهای فرعی Plugin SDK در برنامه‌هایی که فقط نیاز به اجرای عامل‌ها دارند، import نکنید.
</Note>

SDK عمومی برنامه باید در دو لایه ساخته شود:

1. یک کلاینت Gateway سطح پایین و تولیدشده.
2. یک پوشش سطح بالا و خوش‌دست با اشیای `OpenClaw`، `Agent`، `Session`، `Run`،
   `Task`، `Artifact`، `Approval` و `Environment`.

## طراحی فضای نام

فضاهای نام سطح پایین باید منابع Gateway را از نزدیک دنبال کنند:

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

پوشش‌های سطح بالا باید اشیایی برگردانند که جریان‌های رایج را دلپذیر کنند:

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

## قرارداد رویداد

SDK عمومی باید رویدادهای نسخه‌دار، قابل بازپخش و نرمال‌شده ارائه کند.

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

`id` یک نشانگر بازپخش است. مصرف‌کنندگان باید بتوانند با
`events({ after: id })` دوباره متصل شوند و وقتی نگهداشت اجازه می‌دهد، رویدادهای ازدست‌رفته را دریافت کنند.

خانواده‌های پیشنهادی رویدادهای نرمال‌شده:

| رویداد                 | معنا                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | اجرا پذیرفته شد.                                               |
| `run.queued`          | اجرا منتظر یک مسیر نشست، زمان اجرا، یا محیط است. |
| `run.started`         | زمان اجرا اجرای کار را شروع کرد.                                  |
| `run.completed`       | اجرا با موفقیت پایان یافت.                                  |
| `run.failed`          | اجرا با خطا پایان یافت.                                    |
| `run.cancelled`       | اجرا لغو شد.                                          |
| `run.timed_out`       | اجرا از مهلت زمانی خود فراتر رفت.                                   |
| `assistant.delta`     | دلتای متن دستیار.                                       |
| `assistant.message`   | پیام کامل دستیار یا جایگزین آن.                  |
| `thinking.delta`      | دلتای استدلال یا برنامه، زمانی که سیاست اجازه نمایش می‌دهد.       |
| `tool.call.started`   | فراخوانی ابزار آغاز شد.                                            |
| `tool.call.delta`     | فراخوانی ابزار پیشرفت یا خروجی جزئی را به‌صورت جریانی ارسال کرد.              |
| `tool.call.completed` | فراخوانی ابزار با موفقیت برگشت.                            |
| `tool.call.failed`    | فراخوانی ابزار شکست خورد.                                           |
| `approval.requested`  | یک اجرا یا ابزار به تأیید نیاز دارد.                               |
| `approval.resolved`   | تأیید پذیرفته، رد، منقضی، یا لغو شد.        |
| `question.requested`  | زمان اجرا از کاربر یا برنامه میزبان ورودی می‌خواهد.                |
| `question.answered`   | برنامه میزبان پاسخی ارائه کرد.                                |
| `artifact.created`    | مصنوع جدید در دسترس است.                                     |
| `artifact.updated`    | مصنوع موجود تغییر کرد.                                  |
| `session.created`     | نشست ایجاد شد.                                            |
| `session.updated`     | فراداده نشست تغییر کرد.                                   |
| `session.compacted`   | فشرده‌سازی نشست رخ داد.                                |
| `task.updated`        | وضعیت وظیفه پس‌زمینه تغییر کرد.                              |
| `git.branch`          | زمان اجرا وضعیت شاخه را مشاهده یا تغییر داد.                   |
| `git.diff`            | زمان اجرا یک diff تولید یا تغییر داد.                         |
| `git.pr`              | زمان اجرا یک pull request باز، به‌روزرسانی، یا پیوند کرد.          |

payloadهای بومی زمان اجرا باید از طریق `raw` در دسترس باشند، اما برنامه‌ها نباید
برای UI عادی مجبور به parse کردن `raw` باشند.

## قرارداد نتیجه

`Run.wait()` باید یک پاکت نتیجه پایدار برگرداند:

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

نتیجه باید ساده و پایدار باشد. مقدارهای timestamp شکل Gateway را حفظ می‌کنند،
بنابراین اجراهای فعلی پشتیبانی‌شده توسط چرخه عمر معمولا عددهای میلی‌ثانیه epoch
گزارش می‌کنند، در حالی که adapterها ممکن است همچنان رشته‌های ISO را نمایش دهند. UI غنی، traceهای ابزار، و
جزئیات بومی زمان اجرا در رویدادها و مصنوع‌ها جای دارند.

`accepted` یک نتیجه انتظار غیرنهایی است: یعنی مهلت انتظار Gateway
پیش از اینکه اجرا پایان/خطای چرخه عمر تولید کند منقضی شده است. نباید با
`timed_out` یکسان تلقی شود؛ `timed_out` برای اجرایی رزرو شده است که از مهلت زمانی
خودش در زمان اجرا فراتر رفته باشد.

## تأییدها و پرسش‌ها

تأییدها باید first-class باشند چون عامل‌های کدنویسی پیوسته از مرزهای ایمنی
عبور می‌کنند.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

رویدادهای تأیید باید این موارد را حمل کنند:

- شناسه تأیید
- شناسه اجرا و شناسه نشست
- نوع درخواست
- خلاصه کنش درخواستی
- نام ابزار یا کنش محیط
- سطح ریسک
- تصمیم‌های موجود
- انقضا
- اینکه تصمیم می‌تواند دوباره استفاده شود یا نه

پرسش‌ها از تأییدها جدا هستند. پرسش از کاربر یا برنامه میزبان اطلاعات می‌خواهد.
تأیید برای انجام یک کنش اجازه می‌خواهد.

## مدل ToolSpace

برنامه‌ها باید سطح ابزار را بدون import کردن جزئیات داخلی Plugin بفهمند.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK باید این موارد را ارائه کند:

- فراداده ابزار نرمال‌شده
- منبع: OpenClaw، MCP، Plugin، کانال، زمان اجرا، یا برنامه
- خلاصه schema
- سیاست تأیید
- سازگاری زمان اجرا
- اینکه ابزار پنهان، فقط‌خواندنی، قادر به نوشتن، یا قادر به میزبانی است

فراخوانی ابزار از طریق SDK باید صریح و scoped باشد. بیشتر برنامه‌ها باید
عامل‌ها را اجرا کنند، نه اینکه ابزارهای دلخواه را مستقیم فراخوانی کنند.

## مدل مصنوع

مصنوع‌ها باید بیش از فایل‌ها را پوشش دهند.

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

نمونه‌های رایج:

- ویرایش‌های فایل و فایل‌های تولیدشده
- بسته‌های patch
- diffهای VCS
- screenshotها و خروجی‌های رسانه‌ای
- logها و بسته‌های trace
- پیوندهای pull request
- trajectoryهای زمان اجرا
- snapshotهای workspace محیط مدیریت‌شده

دسترسی به مصنوع باید redaction، نگهداشت، و URLهای دانلود را پشتیبانی کند، بدون اینکه
فرض کند هر مصنوع یک فایل محلی عادی است.

## مدل امنیتی

SDK برنامه باید درباره اختیار صریح باشد.

scopeهای پیشنهادی token:

| Scope               | اجازه می‌دهد                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | عامل‌ها را فهرست و بررسی کند.                            |
| `agent.run`         | اجراها را شروع کند.                                         |
| `session.read`      | فراداده و پیام‌های نشست را بخواند.                 |
| `session.write`     | نشست‌ها را ایجاد کند، به آن‌ها ارسال کند، fork کند، compact کند، و abort کند. |
| `task.read`         | وضعیت وظیفه پس‌زمینه را بخواند.                         |
| `task.write`        | سیاست اعلان وظیفه را لغو یا اصلاح کند.          |
| `approval.respond`  | درخواست‌ها را تأیید یا رد کند.                           |
| `tools.invoke`      | ابزارهای ارائه‌شده را مستقیم فراخوانی کند.                      |
| `artifacts.read`    | مصنوع‌ها را فهرست و دانلود کند.                        |
| `environment.write` | محیط‌های مدیریت‌شده را ایجاد یا نابود کند.             |
| `admin`             | عملیات مدیریتی.                          |

پیش‌فرض‌ها:

- به‌صورت پیش‌فرض هیچ secretی forward نشود
- هیچ pass-through نامحدود متغیر محیطی انجام نشود
- ارجاع‌های secret به‌جای مقدارهای secret
- سیاست صریح sandbox و شبکه
- نگهداشت صریح محیط راه دور
- تأییدها برای اجرای میزبان، مگر اینکه سیاست خلاف آن را اثبات کند
- رویدادهای خام زمان اجرا پیش از خروج از Gateway redacted شوند، مگر اینکه فراخواننده
  scope تشخیصی قوی‌تری داشته باشد

## ارائه‌دهنده محیط مدیریت‌شده

عامل‌های مدیریت‌شده باید به‌صورت ارائه‌دهنده‌های محیط پیاده‌سازی شوند.

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

پیاده‌سازی نخست لازم نیست SaaS میزبانی‌شده باشد. می‌تواند
node hostهای موجود، workspaceهای گذرا، runnerهای سبک CI، یا محیط‌های سبک Testbox
را هدف بگیرد. قرارداد مهم این است:

1. آماده‌سازی workspace
2. bind کردن محیط امن و secretها
3. شروع اجرا
4. stream کردن رویدادها
5. جمع‌آوری مصنوع‌ها
6. پاک‌سازی یا نگهداشت بر اساس سیاست

وقتی این پایدار شد، یک سرویس cloud میزبانی‌شده می‌تواند همان قرارداد ارائه‌دهنده را
پیاده‌سازی کند.

## ساختار بسته

بسته‌های پیشنهادی:

| بسته                 | هدف                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK سطح بالای عمومی و کلاینت سطح پایین تولیدشده Gateway. |
| `@openclaw/sdk-react`   | hookهای اختیاری React برای dashboardها و سازندگان برنامه.         |
| `@openclaw/sdk-testing` | helperهای تست و سرور Gateway جعلی برای integrationهای برنامه.    |

repo از قبل `openclaw/plugin-sdk/*` را برای Pluginها دارد. آن فضای نام را
جدا نگه دارید تا نویسندگان Plugin با توسعه‌دهندگان برنامه اشتباه گرفته نشوند.

## راهبرد کلاینت تولیدشده

کلاینت سطح پایین باید از schemaهای نسخه‌دار پروتکل Gateway
تولید شود، سپس با کلاس‌های خوش‌دست دست‌نویس پوشش داده شود.

لایه‌بندی:

1. منبع حقیقت schema Gateway.
2. کلاینت TypeScript سطح پایین تولیدشده.
3. اعتبارسنج‌های زمان اجرا برای ورودی‌های خارجی و payloadهای رویداد.
4. پوشش‌دهنده‌های سطح بالای `OpenClaw`، `Agent`، `Session`، `Run`، `Task` و `Artifact`.
5. نمونه‌های Cookbook و تست‌های یکپارچه‌سازی.

مزایا:

- انحراف پروتکل قابل مشاهده است
- تست‌ها می‌توانند متدهای تولیدشده را با exportهای Gateway مقایسه کنند
- SDK برنامه از جزئیات داخلی SDK Plugin مستقل می‌ماند
- مصرف‌کنندگان سطح پایین همچنان به کل پروتکل دسترسی دارند
- مصرف‌کنندگان سطح بالا API کوچک محصول را دریافت می‌کنند

## مرتبط

- [SDK برنامه OpenClaw](/fa/concepts/openclaw-sdk)
- [مرجع RPC Gateway](/fa/reference/rpc)
- [حلقه عامل](/fa/concepts/agent-loop)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [وظایف پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
