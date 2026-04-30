---
read_when:
    - شما در حال پیاده‌سازی SDK عمومی پیشنهادی برنامه OpenClaw هستید
    - به فضای نام، رویداد، نتیجه، آرتیفکت، تأیید، یا قرارداد امنیتی پیش‌نویس برای SDK برنامه نیاز دارید
    - شما منابع پروتکل Gateway را با لایهٔ پوششی سطح‌بالای SDK برنامهٔ OpenClaw مقایسه می‌کنید
sidebarTitle: App SDK API design
summary: طراحی مرجع برای API عمومی OpenClaw App SDK، رده‌بندی رویدادها، آرتیفکت‌ها، تأییدیه‌ها و ساختار بسته
title: طراحی رابط برنامه‌نویسی کاربردی کیت توسعه نرم‌افزار برنامه OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:43:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

این صفحه طراحی مرجع API تفصیلی برای
[OpenClaw App SDK](/fa/concepts/openclaw-sdk) عمومی است. این صفحه عمدا از
[Plugin SDK](/fa/plugins/sdk-overview) جدا نگه داشته شده است.

<Note>
  `@openclaw/sdk` بسته خارجی برنامه/کلاینت برای ارتباط با
  Gateway است. `openclaw/plugin-sdk/*` قرارداد درون‌فرایندی برای نگارش Plugin است.
  از برنامه‌هایی که فقط نیاز به اجرای عامل‌ها دارند، زیربرنامه‌های Plugin SDK را import نکنید.
</Note>

SDK عمومی برنامه باید در دو لایه ساخته شود:

1. یک کلاینت Gateway سطح پایین و تولیدشده.
2. یک پوشش سطح بالا و خوش‌دست با اشیای `OpenClaw`، `Agent`، `Session`، `Run`،
   `Task`، `Artifact`، `Approval` و `Environment`.

## طراحی Namespace

Namespaceهای سطح پایین باید منابع Gateway را از نزدیک دنبال کنند:

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

پوشش‌های سطح بالا باید اشیایی برگردانند که جریان‌های رایج را دلپذیر می‌کنند:

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

`id` یک مکان‌نمای بازپخش است. مصرف‌کنندگان باید بتوانند با
`events({ after: id })` دوباره وصل شوند و وقتی نگهداشت اجازه می‌دهد، رویدادهای از دست‌رفته را دریافت کنند.

خانواده‌های پیشنهادی رویدادهای نرمال‌شده:

| رویداد                | معنا                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | اجرا پذیرفته شد.                                           |
| `run.queued`          | اجرا منتظر یک مسیر نشست، runtime یا محیط است.              |
| `run.started`         | Runtime اجرا را شروع کرد.                                  |
| `run.completed`       | اجرا با موفقیت تمام شد.                                    |
| `run.failed`          | اجرا با خطا پایان یافت.                                    |
| `run.cancelled`       | اجرا لغو شد.                                                |
| `run.timed_out`       | اجرا از زمان مجاز خود فراتر رفت.                           |
| `assistant.delta`     | دلتای متن دستیار.                                          |
| `assistant.message`   | پیام کامل دستیار یا جایگزین آن.                            |
| `thinking.delta`      | دلتای استدلال یا طرح، وقتی سیاست اجازه نمایش می‌دهد.       |
| `tool.call.started`   | فراخوانی ابزار آغاز شد.                                    |
| `tool.call.delta`     | پیشرفت جریانی یا خروجی جزئی فراخوانی ابزار.                |
| `tool.call.completed` | فراخوانی ابزار با موفقیت برگشت.                            |
| `tool.call.failed`    | فراخوانی ابزار شکست خورد.                                  |
| `approval.requested`  | یک اجرا یا ابزار به تایید نیاز دارد.                       |
| `approval.resolved`   | تایید اعطا، رد، منقضی یا لغو شد.                           |
| `question.requested`  | Runtime از کاربر یا برنامه میزبان ورودی می‌خواهد.          |
| `question.answered`   | برنامه میزبان پاسخی ارائه کرد.                             |
| `artifact.created`    | آرتیفکت جدید در دسترس است.                                 |
| `artifact.updated`    | آرتیفکت موجود تغییر کرد.                                   |
| `session.created`     | نشست ایجاد شد.                                             |
| `session.updated`     | فراداده نشست تغییر کرد.                                    |
| `session.compacted`   | Compaction نشست رخ داد.                                    |
| `task.updated`        | وضعیت وظیفه پس‌زمینه تغییر کرد.                            |
| `git.branch`          | Runtime وضعیت شاخه را مشاهده کرد یا تغییر داد.             |
| `git.diff`            | Runtime یک diff تولید کرد یا تغییر داد.                    |
| `git.pr`              | Runtime یک pull request را باز، به‌روزرسانی یا پیوند کرد.  |

بارهای بومی Runtime باید از طریق `raw` در دسترس باشند، اما برنامه‌ها نباید
برای رابط کاربری معمولی مجبور به تجزیه `raw` باشند.

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

نتیجه باید ساده و پایدار باشد. مقادیر timestamp شکل Gateway را حفظ می‌کنند،
بنابراین اجراهای فعلی پشتیبانی‌شده با چرخه عمر معمولا اعداد میلی‌ثانیه epoch
گزارش می‌کنند، در حالی که adapterها ممکن است هنوز رشته‌های ISO نمایش دهند. رابط کاربری غنی، ردگیری ابزارها و
جزئیات بومی Runtime به رویدادها و آرتیفکت‌ها تعلق دارند.

`accepted` یک نتیجه انتظار غیرپایانی است: یعنی مهلت انتظار Gateway
پیش از آن‌که اجرا پایان/خطای چرخه عمر تولید کند منقضی شده است. نباید آن را
`timed_out` دانست؛ `timed_out` برای اجرایی محفوظ است که از timeout خود runtime
فراتر رفته است.

## تاییدها و پرسش‌ها

تاییدها باید شهروند درجه‌یک باشند، چون عامل‌های کدنویسی مدام از مرزهای ایمنی
عبور می‌کنند.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

رویدادهای تایید باید شامل این موارد باشند:

- شناسه تایید
- شناسه اجرا و شناسه نشست
- نوع درخواست
- خلاصه اقدام درخواست‌شده
- نام ابزار یا اقدام محیط
- سطح ریسک
- تصمیم‌های در دسترس
- انقضا
- این‌که آیا تصمیم قابل استفاده مجدد است یا نه

پرسش‌ها از تاییدها جدا هستند. پرسش از کاربر یا برنامه میزبان اطلاعات می‌خواهد.
تایید برای انجام یک اقدام اجازه می‌خواهد.

## مدل ToolSpace

برنامه‌ها باید سطح ابزار را بدون import کردن جزئیات داخلی Plugin درک کنند.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK باید این موارد را ارائه کند:

- فراداده ابزار نرمال‌شده
- منبع: OpenClaw، MCP، Plugin، کانال، runtime یا برنامه
- خلاصه schema
- سیاست تایید
- سازگاری runtime
- این‌که آیا ابزار پنهان، فقط‌خواندنی، دارای قابلیت نوشتن یا دارای قابلیت میزبان است

فراخوانی ابزار از طریق SDK باید صریح و محدود به دامنه باشد. بیشتر برنامه‌ها باید
عامل‌ها را اجرا کنند، نه این‌که مستقیما ابزارهای دلخواه را فراخوانی کنند.

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

- ویرایش فایل‌ها و فایل‌های تولیدشده
- بسته‌های patch
- diffهای VCS
- خروجی‌های screenshot و رسانه
- گزارش‌ها و بسته‌های trace
- پیوندهای pull request
- مسیرهای runtime
- snapshotهای workspace محیط مدیریت‌شده

دسترسی به آرتیفکت باید بدون فرض این‌که هر آرتیفکت یک فایل محلی معمولی است،
از ویرایش محرمانه، نگهداشت و URLهای دانلود پشتیبانی کند.

## مدل امنیتی

SDK برنامه باید درباره اختیار صریح باشد.

دامنه‌های پیشنهادی token:

| دامنه               | اجازه می‌دهد                                         |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | فهرست کردن و بررسی عامل‌ها.                         |
| `agent.run`         | شروع اجراها.                                        |
| `session.read`      | خواندن فراداده و پیام‌های نشست.                     |
| `session.write`     | ایجاد، ارسال به، fork، compact و abort نشست‌ها.     |
| `task.read`         | خواندن وضعیت وظیفه پس‌زمینه.                        |
| `task.write`        | لغو یا تغییر سیاست اعلان وظیفه.                     |
| `approval.respond`  | تایید یا رد درخواست‌ها.                             |
| `tools.invoke`      | فراخوانی مستقیم ابزارهای ارائه‌شده.                 |
| `artifacts.read`    | فهرست کردن و دانلود آرتیفکت‌ها.                     |
| `environment.write` | ایجاد یا نابود کردن محیط‌های مدیریت‌شده.            |
| `admin`             | عملیات مدیریتی.                                     |

پیش‌فرض‌ها:

- بدون انتقال secret به‌صورت پیش‌فرض
- بدون عبور نامحدود متغیرهای محیطی
- ارجاع‌های secret به‌جای مقادیر secret
- سیاست صریح sandbox و شبکه
- نگهداشت صریح محیط remote
- تاییدها برای اجرای میزبان، مگر این‌که سیاست خلاف آن را ثابت کند
- رویدادهای خام runtime پیش از خروج از Gateway ویرایش محرمانه شوند، مگر این‌که فراخواننده
  دامنه تشخیصی قوی‌تری داشته باشد

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
node hostهای موجود، workspaceهای موقتی، runnerهای سبک CI یا محیط‌های سبک Testbox را هدف بگیرد.
قرارداد مهم این است:

1. آماده‌سازی workspace
2. اتصال محیط و secretهای ایمن
3. شروع اجرا
4. جریان‌دهی رویدادها
5. جمع‌آوری آرتیفکت‌ها
6. پاک‌سازی یا نگهداشت طبق سیاست

وقتی این پایدار شد، یک سرویس cloud میزبانی‌شده می‌تواند همان قرارداد ارائه‌دهنده را
پیاده‌سازی کند.

## ساختار بسته

بسته‌های پیشنهادی:

| بسته                   | هدف                                                          |
| ----------------------- | ------------------------------------------------------------ |
| `@openclaw/sdk`         | SDK سطح بالای عمومی و کلاینت سطح پایین تولیدشده Gateway.    |
| `@openclaw/sdk-react`   | hookهای اختیاری React برای داشبوردها و سازندگان برنامه.     |
| `@openclaw/sdk-testing` | helperهای تست و سرور Gateway جعلی برای یکپارچه‌سازی برنامه. |

این repo از قبل `openclaw/plugin-sdk/*` را برای Pluginها دارد. آن namespace را
جدا نگه دارید تا نویسندگان Plugin با توسعه‌دهندگان برنامه اشتباه گرفته نشوند.

## راهبرد کلاینت تولیدشده

کلاینت سطح‌پایین باید از طرحواره‌های نسخه‌بندی‌شدهٔ پروتکل Gateway
تولید شود، سپس با کلاس‌های خوش‌دستِ دست‌نویس پوشانده شود.

لایه‌بندی:

1. منبع حقیقت طرحوارهٔ Gateway.
2. کلاینت TypeScript سطح‌پایینِ تولیدشده.
3. اعتبارسنج‌های زمان اجرا برای ورودی‌های خارجی و محموله‌های رویداد.
4. پوشش‌های سطح‌بالای `OpenClaw`، `Agent`، `Session`، `Run`، `Task` و `Artifact`.
5. نمونه‌های cookbook و آزمون‌های یکپارچه‌سازی.

مزایا:

- انحراف پروتکل قابل مشاهده است
- آزمون‌ها می‌توانند متدهای تولیدشده را با خروجی‌های Gateway مقایسه کنند
- SDK برنامه از اجزای داخلی Plugin SDK مستقل می‌ماند
- مصرف‌کنندگان سطح‌پایین همچنان به کل پروتکل دسترسی کامل دارند
- مصرف‌کنندگان سطح‌بالا API کوچک محصول را دریافت می‌کنند

## مستندات مرتبط

- [OpenClaw App SDK](/fa/concepts/openclaw-sdk)
- [مرجع RPC Gateway](/fa/reference/rpc)
- [حلقهٔ عامل](/fa/concepts/agent-loop)
- [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes)
- [وظایف پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
