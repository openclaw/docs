---
read_when:
    - شما در حال پیاده‌سازی SDK عمومی پیشنهادی برنامهٔ OpenClaw هستید
    - برای SDK برنامه به قرارداد پیش‌نویسِ فضای نام، رویداد، نتیجه، آرتیفکت، تأیید یا امنیت نیاز دارید
    - شما منابع پروتکل Gateway را با پوشش سطح‌بالای OpenClaw App SDK مقایسه می‌کنید
sidebarTitle: App SDK API design
summary: طراحی مرجع برای API عمومی SDK اپلیکیشن OpenClaw، رده‌بندی رویدادها، آرتیفکت‌ها، تأییدیه‌ها و ساختار بسته
title: طراحی رابط برنامه‌نویسی کاربردی کیت توسعه نرم‌افزار برنامه OpenClaw
x-i18n:
    generated_at: "2026-05-10T20:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

این صفحه طراحی مرجع تفصیلی API برای
[OpenClaw App SDK](/fa/concepts/openclaw-sdk) عمومی است. این مرجع عمدا جدا از
[Plugin SDK](/fa/plugins/sdk-overview) نگه داشته شده است.

<Note>
  `@openclaw/sdk` بسته خارجی app/client برای ارتباط با
  Gateway است. `openclaw/plugin-sdk/*` قرارداد نگارش Plugin درون‌فرایندی است.
  از زیرمسیرهای Plugin SDK در appهایی که فقط باید agent اجرا کنند import نکنید.
</Note>

SDK عمومی app باید در دو لایه ساخته شود:

1. یک کلاینت Gateway تولیدشده سطح پایین.
2. یک پوشش سطح بالای خوش‌دست با اشیای `OpenClaw`، `Agent`، `Session`، `Run`،
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

`id` یک نشانگر بازپخش است. مصرف‌کننده‌ها باید بتوانند با
`events({ after: id })` دوباره وصل شوند و وقتی نگهداشت اجازه می‌دهد، رویدادهای ازدست‌رفته را دریافت کنند.

خانواده‌های پیشنهادی رویداد نرمال‌شده:

| رویداد                 | معنا                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | اجرا پذیرفته شد.                                               |
| `run.queued`          | اجرا منتظر lane نشست، runtime، یا environment است. |
| `run.started`         | Runtime اجرا را شروع کرد.                                  |
| `run.completed`       | اجرا با موفقیت پایان یافت.                                  |
| `run.failed`          | اجرا با خطا پایان یافت.                                    |
| `run.cancelled`       | اجرا لغو شد.                                          |
| `run.timed_out`       | اجرا از مهلت زمانی خود فراتر رفت.                                   |
| `assistant.delta`     | delta متن assistant.                                       |
| `assistant.message`   | پیام کامل assistant یا جایگزین آن.                  |
| `thinking.delta`      | delta استدلال یا برنامه، وقتی policy اجازه نمایش بدهد.       |
| `tool.call.started`   | فراخوانی ابزار آغاز شد.                                            |
| `tool.call.delta`     | پیشرفت جریانی یا خروجی جزئی فراخوانی ابزار.              |
| `tool.call.completed` | فراخوانی ابزار با موفقیت برگشت.                            |
| `tool.call.failed`    | فراخوانی ابزار شکست خورد.                                           |
| `approval.requested`  | یک اجرا یا ابزار به تایید نیاز دارد.                               |
| `approval.resolved`   | تایید اعطا، رد، منقضی، یا لغو شد.        |
| `question.requested`  | Runtime از کاربر یا app میزبان ورودی می‌خواهد.                |
| `question.answered`   | app میزبان پاسخی ارائه کرد.                                |
| `artifact.created`    | artifact جدید در دسترس است.                                     |
| `artifact.updated`    | artifact موجود تغییر کرد.                                  |
| `session.created`     | نشست ایجاد شد.                                            |
| `session.updated`     | فراداده نشست تغییر کرد.                                   |
| `session.compacted`   | Compaction نشست رخ داد.                                |
| `task.updated`        | وضعیت task پس‌زمینه تغییر کرد.                              |
| `git.branch`          | Runtime وضعیت branch را مشاهده یا تغییر داد.                   |
| `git.diff`            | Runtime یک diff تولید یا تغییر داد.                         |
| `git.pr`              | Runtime یک pull request باز، به‌روزرسانی، یا لینک کرد.          |

payloadهای بومی runtime باید از طریق `raw` در دسترس باشند، اما appها نباید
برای UI عادی مجبور به parse کردن `raw` باشند.

## قرارداد نتیجه

`Run.wait()` باید یک envelope نتیجه پایدار برگرداند:

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
بنابراین اجراهای فعلی متکی بر lifecycle معمولا عددهای epoch millisecond گزارش می‌کنند،
در حالی که adapterها همچنان ممکن است رشته‌های ISO نمایش دهند. UI غنی، ردگیری‌های ابزار، و
جزئیات بومی runtime به رویدادها و artifactها تعلق دارند.

`accepted` یک نتیجه wait غیرنهایی است: یعنی مهلت wait در Gateway
پیش از آنکه اجرا پایان/خطای lifecycle تولید کند، منقضی شده است. نباید با
`timed_out` یکسان تلقی شود؛ `timed_out` برای اجرایی رزرو شده که از timeout runtime خود
فراتر رفته است.

## تاییدها و پرسش‌ها

تاییدها باید شهروند درجه‌یک باشند، چون agentهای کدنویسی دائما از مرزهای safety
عبور می‌کنند.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

رویدادهای تایید باید شامل موارد زیر باشند:

- شناسه تایید
- شناسه اجرا و شناسه نشست
- نوع درخواست
- خلاصه action درخواست‌شده
- نام ابزار یا action مربوط به environment
- سطح ریسک
- تصمیم‌های در دسترس
- انقضا
- اینکه آیا تصمیم می‌تواند دوباره استفاده شود یا نه

پرسش‌ها از تاییدها جدا هستند. پرسش از کاربر یا app میزبان اطلاعات می‌خواهد.
تایید برای انجام یک action مجوز می‌خواهد.

## مدل ToolSpace

appها باید بدون import کردن internals مربوط به Plugin، سطح ابزار را بفهمند.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK باید موارد زیر را ارائه کند:

- فراداده ابزار نرمال‌شده
- منبع: OpenClaw، MCP، plugin، channel، runtime، یا app
- خلاصه schema
- policy تایید
- سازگاری runtime
- اینکه یک ابزار پنهان، readonly، دارای قابلیت write، یا دارای قابلیت host هست یا نه

فراخوانی ابزار از طریق SDK باید صریح و محدود به scope باشد. بیشتر appها باید
agentها را اجرا کنند، نه اینکه مستقیما ابزارهای دلخواه را فراخوانی کنند.

## مدل artifact

artifactها باید فراتر از فایل‌ها را پوشش دهند.

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
- screenshotها و خروجی‌های media
- logها و بسته‌های trace
- لینک‌های pull request
- trajectoryهای runtime
- snapshotهای workspace مربوط به environmentهای مدیریت‌شده

دسترسی به artifact باید از redaction، نگهداشت، و URLهای دانلود پشتیبانی کند،
بدون اینکه فرض کند هر artifact یک فایل محلی عادی است.

## مدل امنیت

SDK مربوط به app باید درباره اختیار صریح باشد.

scopeهای پیشنهادی token:

| Scope               | اجازه می‌دهد                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | فهرست کردن و بازرسی agentها.                            |
| `agent.run`         | شروع اجراها.                                         |
| `session.read`      | خواندن فراداده و پیام‌های نشست.                 |
| `session.write`     | ایجاد، ارسال به، fork، compact، و abort کردن نشست‌ها. |
| `task.read`         | خواندن وضعیت task پس‌زمینه.                         |
| `task.write`        | لغو یا تغییر policy اعلان task.          |
| `approval.respond`  | تایید یا رد درخواست‌ها.                           |
| `tools.invoke`      | فراخوانی مستقیم ابزارهای expose شده.                      |
| `artifacts.read`    | فهرست کردن و دانلود artifactها.                        |
| `environment.write` | ایجاد یا نابود کردن environmentهای مدیریت‌شده.             |
| `admin`             | عملیات مدیریتی.                          |

پیش‌فرض‌ها:

- بدون forward کردن secret به‌صورت پیش‌فرض
- بدون pass-through نامحدود متغیرهای environment
- ارجاع‌های secret به‌جای مقدارهای secret
- policy صریح sandbox و network
- نگهداشت صریح environment راه‌دور
- تاییدها برای اجرای host مگر اینکه policy خلاف آن را ثابت کند
- رویدادهای خام runtime پیش از خروج از Gateway redacted می‌شوند، مگر اینکه caller یک
  scope تشخیصی قوی‌تر داشته باشد

## ارائه‌دهنده environment مدیریت‌شده

agentهای مدیریت‌شده باید به‌صورت ارائه‌دهنده‌های environment پیاده‌سازی شوند.

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

پیاده‌سازی اول لازم نیست یک SaaS میزبانی‌شده باشد. می‌تواند
میزبان‌های node موجود، workspaceهای موقتی، runnerهای سبک CI، یا
environmentهای سبک Testbox را هدف بگیرد. قرارداد مهم این است:

1. آماده‌سازی workspace
2. bind کردن environment و secretهای ایمن
3. شروع اجرا
4. stream کردن رویدادها
5. جمع‌آوری artifactها
6. پاک‌سازی یا نگهداشت طبق policy

وقتی این پایدار شد، یک سرویس ابری میزبانی‌شده می‌تواند همان قرارداد provider
را پیاده‌سازی کند.

## ساختار package

packageهای پیشنهادی:

| Package                 | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK سطح بالای عمومی و کلاینت Gateway تولیدشده سطح پایین. |
| `@openclaw/sdk-react`   | hookهای اختیاری React برای dashboardها و app builderها.         |
| `@openclaw/sdk-testing` | helperهای تست و سرور Gateway جعلی برای integrationهای app.    |

این repo از قبل `openclaw/plugin-sdk/*` را برای Pluginها دارد. آن namespace را
جدا نگه دارید تا نویسندگان Plugin با توسعه‌دهندگان app اشتباه گرفته نشوند.

## راهبرد کلاینت تولیدشده

کلاینت سطح پایین باید از schemaهای نسخه‌دار protocol Gateway تولید شود،
سپس با classهای خوش‌دست دست‌نویس پوشش داده شود.

لایه‌بندی:

1. منبع حقیقت طرح‌واره Gateway.
2. کلاینت سطح پایین TypeScript تولیدشده.
3. اعتبارسنج‌های زمان اجرا برای ورودی‌های خارجی و payloadهای رویداد.
4. پوشش‌دهنده‌های سطح بالای `OpenClaw`، `Agent`، `Session`، `Run`، `Task` و `Artifact`.
5. نمونه‌های cookbook و تست‌های یکپارچه‌سازی.

مزایا:

- انحراف پروتکل قابل مشاهده است
- تست‌ها می‌توانند متدهای تولیدشده را با خروجی‌های Gateway مقایسه کنند
- App SDK مستقل از جزئیات داخلی Plugin SDK باقی می‌ماند
- مصرف‌کنندگان سطح پایین همچنان به کل پروتکل دسترسی کامل دارند
- مصرف‌کنندگان سطح بالا API کوچک محصول را دریافت می‌کنند

## مرتبط

- [OpenClaw App SDK](/fa/concepts/openclaw-sdk)
- [مرجع RPC Gateway](/fa/reference/rpc)
- [حلقه Agent](/fa/concepts/agent-loop)
- [زمان‌های اجرای Agent](/fa/concepts/agent-runtimes)
- [وظایف پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
