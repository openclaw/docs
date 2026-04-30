---
read_when:
    - شما در حال پیاده‌سازی SDK عمومی پیشنهادی برنامهٔ OpenClaw هستید
    - به قرارداد پیش‌نویس فضای نام، رویداد، نتیجه، آرتیفکت، تأیید، یا امنیت برای SDK برنامه نیاز دارید
    - شما منابع پروتکل Gateway را با لایهٔ پوششی سطح‌بالای SDK OpenClaw مقایسه می‌کنید
summary: طراحی مرجع برای API عمومی پیشنهادی SDK برنامه OpenClaw، رده‌بندی رویدادها، آرتیفکت‌ها، تأییدیه‌ها، و ساختار بسته
title: طراحی API در SDK OpenClaw
x-i18n:
    generated_at: "2026-04-30T00:08:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4dd0123581f4ba8332b6af9c673467092082a16488a61b5cbeac1b33e9a5dd1
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

این صفحه طراحی مرجع API تفصیلی برای
[OpenClaw SDK](/fa/concepts/openclaw-sdk) عمومی پیشنهادی است. این صفحه عمدا از
[SDKِ Plugin](/fa/plugins/sdk-overview) جداست.

SDK عمومی برنامه باید در دو لایه ساخته شود:

1. یک کلاینت Gateway تولیدشده سطح پایین.
2. یک پوشش ارگونومیک سطح بالا با اشیای `OpenClaw`، `Agent`، `Session`، `Run`،
   `Task`، `Artifact`، `Approval`، و `Environment`.

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

پوشش‌های سطح بالا باید اشیایی برگردانند که جریان‌های رایج را خوشایند می‌کنند:

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

SDK عمومی باید رویدادهای نسخه‌دار، قابل بازپخش، و نرمال‌شده ارائه کند.

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

خانواده‌های رویداد نرمال‌شده پیشنهادی:

| رویداد                 | معنا                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | اجرا پذیرفته شد.                                               |
| `run.queued`          | اجرا منتظر یک مسیر نشست، زمان اجرا، یا محیط است. |
| `run.started`         | زمان اجرا اجرای عملیات را آغاز کرد.                                  |
| `run.completed`       | اجرا با موفقیت پایان یافت.                                  |
| `run.failed`          | اجرا با خطا پایان یافت.                                    |
| `run.cancelled`       | اجرا لغو شد.                                          |
| `run.timed_out`       | اجرا از مهلت زمانی خود فراتر رفت.                                   |
| `assistant.delta`     | دلتای متن دستیار.                                       |
| `assistant.message`   | پیام کامل دستیار یا جایگزین آن.                  |
| `thinking.delta`      | دلتای استدلال یا برنامه، وقتی سیاست اجازه نمایش می‌دهد.       |
| `tool.call.started`   | فراخوانی ابزار آغاز شد.                                            |
| `tool.call.delta`     | فراخوانی ابزار پیشرفت جریانی یا خروجی جزئی را ارسال کرد.              |
| `tool.call.completed` | فراخوانی ابزار با موفقیت برگشت.                            |
| `tool.call.failed`    | فراخوانی ابزار شکست خورد.                                           |
| `approval.requested`  | یک اجرا یا ابزار به تأیید نیاز دارد.                               |
| `approval.resolved`   | تأیید اعطا، رد، منقضی، یا لغو شد.        |
| `question.requested`  | زمان اجرا از کاربر یا برنامه میزبان ورودی می‌خواهد.                |
| `question.answered`   | برنامه میزبان پاسخی ارائه کرد.                                |
| `artifact.created`    | آرتیفکت جدید در دسترس است.                                     |
| `artifact.updated`    | آرتیفکت موجود تغییر کرد.                                  |
| `session.created`     | نشست ایجاد شد.                                            |
| `session.updated`     | فراداده نشست تغییر کرد.                                   |
| `session.compacted`   | Compaction نشست انجام شد.                                |
| `task.updated`        | وضعیت وظیفه پس‌زمینه تغییر کرد.                              |
| `git.branch`          | زمان اجرا وضعیت شاخه را مشاهده کرد یا تغییر داد.                   |
| `git.diff`            | زمان اجرا یک diff تولید کرد یا تغییر داد.                         |
| `git.pr`              | زمان اجرا یک pull request را باز، به‌روزرسانی، یا پیوند کرد.          |

بارهای داده بومی زمان اجرا باید از طریق `raw` در دسترس باشند، اما برنامه‌ها نباید
برای UI عادی ناچار به پردازش `raw` باشند.

## قرارداد نتیجه

`Run.wait()` باید یک پوش نتیجه پایدار برگرداند:

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

نتیجه باید ساده و پایدار باشد. مقادیر مهر زمانی شکل Gateway را حفظ می‌کنند،
بنابراین اجراهای فعلی مبتنی بر چرخه عمر معمولا اعداد میلی‌ثانیه epoch گزارش می‌کنند
در حالی که آداپتورها ممکن است هنوز رشته‌های ISO را نشان دهند. UI غنی، ردپاهای ابزار، و
جزئیات بومی زمان اجرا به رویدادها و آرتیفکت‌ها تعلق دارند.

`accepted` یک نتیجه انتظار غیرنهایی است: یعنی مهلت انتظار Gateway
پیش از آنکه اجرا پایان/خطای چرخه عمر تولید کند منقضی شده است. نباید با
`timed_out` یکی گرفته شود؛ `timed_out` برای اجرایی رزرو شده که از مهلت زمانی
خودش فراتر رفته است.

## تأییدها و پرسش‌ها

تأییدها باید موجودیت‌های درجه‌یک باشند، زیرا عامل‌های کدنویسی دائما از مرزهای ایمنی
عبور می‌کنند.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

رویدادهای تأیید باید شامل این موارد باشند:

- شناسه تأیید
- شناسه اجرا و شناسه نشست
- نوع درخواست
- خلاصه اقدام درخواستی
- نام ابزار یا اقدام محیط
- سطح ریسک
- تصمیم‌های موجود
- انقضا
- اینکه آیا تصمیم می‌تواند دوباره استفاده شود یا نه

پرسش‌ها از تأییدها جدا هستند. پرسش از کاربر یا برنامه میزبان اطلاعات می‌خواهد.
تأیید برای انجام یک اقدام اجازه می‌خواهد.

## مدل ToolSpace

برنامه‌ها باید بدون وارد کردن جزئیات داخلی Plugin سطح ابزار را درک کنند.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK باید ارائه کند:

- فراداده ابزار نرمال‌شده
- منبع: OpenClaw، MCP، Plugin، کانال، زمان اجرا، یا برنامه
- خلاصه schema
- سیاست تأیید
- سازگاری زمان اجرا
- اینکه ابزار پنهان، فقط‌خواندنی، دارای قابلیت نوشتن، یا دارای قابلیت میزبان است یا نه

فراخوانی ابزار از طریق SDK باید صریح و محدود به scope باشد. بیشتر برنامه‌ها باید
عامل‌ها را اجرا کنند، نه اینکه مستقیما ابزارهای دلخواه را فراخوانی کنند.

## مدل آرتیفکت

آرتیفکت‌ها باید بیش از فایل‌ها را پوشش دهند.

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
- اسکرین‌شات‌ها و خروجی‌های رسانه‌ای
- لاگ‌ها و بسته‌های trace
- پیوندهای pull request
- مسیرهای زمان اجرا
- snapshotهای فضای کاری محیط مدیریت‌شده

دسترسی به آرتیفکت باید از ویرایش محرمانه، نگهداشت، و URLهای دانلود پشتیبانی کند
بدون اینکه فرض کند هر آرتیفکت یک فایل محلی عادی است.

## مدل امنیت

SDK برنامه باید درباره اختیار صریح باشد.

scopeهای توکن پیشنهادی:

| Scope               | مجاز می‌کند                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | فهرست کردن و بررسی عامل‌ها.                            |
| `agent.run`         | شروع اجراها.                                         |
| `session.read`      | خواندن فراداده و پیام‌های نشست.                 |
| `session.write`     | ایجاد، ارسال به، fork، compact، و abort کردن نشست‌ها. |
| `task.read`         | خواندن وضعیت وظیفه پس‌زمینه.                         |
| `task.write`        | لغو یا تغییر سیاست اعلان وظیفه.          |
| `approval.respond`  | تأیید یا رد درخواست‌ها.                           |
| `tools.invoke`      | فراخوانی مستقیم ابزارهای نمایان‌شده.                      |
| `artifacts.read`    | فهرست کردن و دانلود آرتیفکت‌ها.                        |
| `environment.write` | ایجاد یا نابود کردن محیط‌های مدیریت‌شده.             |
| `admin`             | عملیات مدیریتی.                          |

پیش‌فرض‌ها:

- بدون ارسال secret به‌صورت پیش‌فرض
- بدون عبور نامحدود متغیرهای محیطی
- ارجاع‌های secret به‌جای مقدارهای secret
- سیاست صریح sandbox و شبکه
- نگهداشت صریح محیط دوردست
- تأیید برای اجرای میزبان مگر اینکه سیاست خلاف آن را اثبات کند
- رویدادهای خام زمان اجرا پیش از خروج از Gateway ویرایش محرمانه شوند، مگر اینکه فراخواننده
  scope تشخیصی قوی‌تری داشته باشد

## ارائه‌دهنده محیط مدیریت‌شده

عامل‌های مدیریت‌شده باید به‌صورت ارائه‌دهندگان محیط پیاده‌سازی شوند.

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

پیاده‌سازی نخست لازم نیست یک SaaS میزبانی‌شده باشد. می‌تواند
میزبان‌های Node موجود، فضاهای کاری موقت، اجراکننده‌های سبک CI، یا
محیط‌های سبک Testbox را هدف بگیرد. قرارداد مهم این است:

1. آماده‌سازی فضای کاری
2. اتصال امن محیط و secretها
3. شروع اجرا
4. جریان دادن رویدادها
5. جمع‌آوری آرتیفکت‌ها
6. پاک‌سازی یا نگهداشت طبق سیاست

وقتی این پایدار شد، یک سرویس ابری میزبانی‌شده می‌تواند همان قرارداد
ارائه‌دهنده را پیاده‌سازی کند.

## ساختار بسته

بسته‌های پیشنهادی:

| بسته                 | هدف                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK عمومی سطح بالا و کلاینت Gateway سطح پایین تولیدشده. |
| `@openclaw/sdk-react`   | hookهای اختیاری React برای داشبوردها و سازندگان برنامه.         |
| `@openclaw/sdk-testing` | کمک‌کننده‌های تست و سرور Gateway جعلی برای یکپارچه‌سازی‌های برنامه.    |

مخزن از قبل `openclaw/plugin-sdk/*` را برای Pluginها دارد. آن فضای نام را
جدا نگه دارید تا نویسندگان Plugin با توسعه‌دهندگان برنامه اشتباه گرفته نشوند.

## راهبرد کلاینت تولیدشده

کلاینت سطح پایین باید از schemaهای نسخه‌دار پروتکل Gateway تولید شود،
سپس با کلاس‌های ارگونومیک دست‌نویس پوشانده شود.

لایه‌بندی:

1. منبع حقیقت طرحواره Gateway.
2. کلاینت TypeScript سطح پایین تولیدشده.
3. اعتبارسنج‌های زمان اجرا برای ورودی‌های خارجی و payloadهای رویداد.
4. wrapperهای سطح بالا برای `OpenClaw`، `Agent`، `Session`، `Run`، `Task` و `Artifact`.
5. نمونه‌های cookbook و تست‌های یکپارچه‌سازی.

مزایا:

- drift پروتکل قابل مشاهده است
- تست‌ها می‌توانند متدهای تولیدشده را با exportهای Gateway مقایسه کنند
- SDK برنامه مستقل از جزئیات داخلی SDK Plugin می‌ماند
- مصرف‌کنندگان سطح پایین همچنان به کل پروتکل دسترسی کامل دارند
- مصرف‌کنندگان سطح بالا API کوچک محصول را دریافت می‌کنند

## اسناد مرتبط

- [طراحی SDK OpenClaw](/fa/concepts/openclaw-sdk)
- [مرجع RPC Gateway](/fa/reference/rpc)
- [حلقه عامل](/fa/concepts/agent-loop)
- [محیط‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [کارهای پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
