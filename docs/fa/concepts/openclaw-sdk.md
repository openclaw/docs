---
read_when:
    - شما در حال ساخت یک برنامهٔ خارجی، اسکریپت، داشبورد، کار CI، یا افزونهٔ IDE هستید که با OpenClaw ارتباط برقرار می‌کند
    - شما در حال انتخاب بین SDK برنامه و SDK Plugin هستید
    - شما در حال یکپارچه‌سازی با اجراهای عامل در Gateway، نشست‌ها، رویدادها، تأییدیه‌ها، مدل‌ها یا ابزارها هستید
sidebarTitle: App SDK
summary: SDK عمومی برنامه OpenClaw برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
title: کیت توسعه نرم‌افزار برنامه OpenClaw
x-i18n:
    generated_at: "2026-05-01T11:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**SDK اپلیکیشن OpenClaw** API عمومی کلاینت برای اپلیکیشن‌های خارج از فرایند
OpenClaw است. از `@openclaw/sdk` زمانی استفاده کنید که یک اسکریپت، داشبورد، وظیفه CI، افزونه IDE
یا اپلیکیشن خارجی دیگری بخواهد به Gateway متصل شود، اجرای عامل‌ها را شروع کند،
رویدادها را استریم کند، منتظر نتایج بماند، کار را لغو کند یا منابع Gateway را بررسی کند.

<Note>
  SDK اپلیکیشن با [SDK Plugin](/fa/plugins/sdk-overview) متفاوت است.
  `@openclaw/sdk` از بیرون OpenClaw با Gateway صحبت می‌کند.
  `openclaw/plugin-sdk/*` فقط برای pluginهایی است که داخل OpenClaw اجرا می‌شوند و
  ارائه‌دهنده‌ها، کانال‌ها، ابزارها، hookها یا runtimeهای مورد اعتماد را ثبت می‌کنند.
</Note>

## آنچه امروز ارائه می‌شود

`@openclaw/sdk` همراه با موارد زیر ارائه می‌شود:

| سطح                       | وضعیت | کاری که انجام می‌دهد                                                        |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | آماده  | نقطه ورود اصلی کلاینت. مالک انتقال، اتصال، درخواست‌ها و رویدادها است. |
| `GatewayClientTransport`  | آماده  | انتقال WebSocket مبتنی بر کلاینت Gateway.                                  |
| `oc.agents`               | آماده  | handleهای عامل را فهرست، ایجاد، به‌روزرسانی، حذف و دریافت می‌کند.          |
| `Agent.run()`             | آماده  | اجرای `agent` در Gateway را شروع می‌کند و یک `Run` برمی‌گرداند.            |
| `oc.runs`                 | آماده  | اجراها را ایجاد، دریافت، منتظر، لغو و استریم می‌کند.                       |
| `Run.events()`            | آماده  | رویدادهای نرمال‌شده هر اجرا را همراه با replay برای اجراهای سریع استریم می‌کند. |
| `Run.wait()`              | آماده  | `agent.wait` را فراخوانی می‌کند و یک `RunResult` پایدار برمی‌گرداند.       |
| `Run.cancel()`            | آماده  | `sessions.abort` را بر اساس شناسه اجرا و در صورت موجود بودن با کلید نشست فراخوانی می‌کند. |
| `oc.sessions`             | آماده  | handleهای نشست را ایجاد، resolve، ارسال، patch، compact و دریافت می‌کند.  |
| `Session.send()`          | آماده  | `sessions.send` را فراخوانی می‌کند و یک `Run` برمی‌گرداند.                 |
| `oc.models`               | آماده  | `models.list` و RPC وضعیت فعلی `models.authStatus` را فراخوانی می‌کند.     |
| `oc.tools`                | آماده  | ابزارهای Gateway را از طریق pipeline سیاست فهرست، scope و فراخوانی می‌کند. |
| `oc.artifacts`            | آماده  | artifactهای transcript Gateway را فهرست، دریافت و دانلود می‌کند.           |
| `oc.approvals`            | آماده  | approvalهای exec را از طریق RPCهای approval در Gateway فهرست و resolve می‌کند. |
| `oc.rawEvents()`          | آماده  | رویدادهای خام Gateway را برای مصرف‌کنندگان پیشرفته در دسترس می‌گذارد.     |
| `normalizeGatewayEvent()` | آماده  | رویدادهای خام Gateway را به شکل پایدار رویداد SDK تبدیل می‌کند.            |

SDK همچنین typeهای اصلی استفاده‌شده توسط این سطح‌ها را صادر می‌کند:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` و typeهای نتیجه مرتبط.

## اتصال به Gateway

یک کلاینت با URL صریح Gateway بسازید، یا برای تست‌ها و runtimeهای اپلیکیشن تعبیه‌شده
یک transport سفارشی تزریق کنید.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` معادل `url` است. گزینه
`gateway: "auto"` توسط سازنده پذیرفته می‌شود، اما کشف خودکار Gateway
هنوز یک قابلیت جداگانه SDK نیست؛ وقتی اپلیکیشن از قبل نمی‌داند چگونه Gateway را کشف کند،
`url` را پاس دهید.

برای تست‌ها، شیئی را پاس دهید که `OpenClawTransport` را پیاده‌سازی می‌کند:

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

## اجرای یک عامل

وقتی اپلیکیشن یک handle عامل می‌خواهد، از `oc.agents.get(id)` استفاده کنید، سپس
`agent.run()` را فراخوانی کنید.

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

ارجاع‌های مدل دارای provider مانند `openai/gpt-5.5` به overrideهای Gateway برای
`provider` و `model` تقسیم می‌شوند. `timeoutMs` در SDK بر حسب میلی‌ثانیه باقی می‌ماند و
برای RPC مربوط به `agent` به ثانیه‌های timeout در Gateway تبدیل می‌شود.

`run.wait()` از RPC Gateway به نام `agent.wait` استفاده می‌کند. deadline انتظاری که
وقتی اجرا هنوز فعال است منقضی می‌شود، به‌جای وانمود کردن به اینکه خود اجرا timeout شده،
`status: "accepted"` برمی‌گرداند. timeoutهای runtime، اجراهای abortشده و اجراهای لغوشده
به `timed_out` یا `cancelled` نرمال می‌شوند.

## ایجاد و استفاده دوباره از نشست‌ها

وقتی اپلیکیشن state ماندگار transcript می‌خواهد، از نشست‌ها استفاده کنید.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`، `sessions.send` را فراخوانی می‌کند و یک `Run` برمی‌گرداند. handleهای نشست همچنین
موارد زیر را پشتیبانی می‌کنند:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## استریم رویدادها

SDK رویدادهای خام Gateway را به یک envelope پایدار `OpenClawEvent` نرمال می‌کند:

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

نوع‌های رایج رویداد شامل این‌ها هستند:

| نوع رویداد            | رویداد منبع Gateway                        |
| --------------------- | ------------------------------------------- |
| `run.started`         | شروع چرخهٔ عمر `agent`                     |
| `run.completed`       | پایان چرخهٔ عمر `agent`                       |
| `run.failed`          | خطای چرخهٔ عمر `agent`                     |
| `run.cancelled`       | پایان چرخهٔ عمر لغوشده/متوقف‌شده             |
| `run.timed_out`       | پایان چرخهٔ عمر به‌دلیل پایان مهلت                       |
| `assistant.delta`     | دلتای استریم Assistant                   |
| `assistant.message`   | پیام Assistant                           |
| `thinking.delta`      | استریم تفکر یا برنامه                     |
| `tool.call.started`   | شروع ابزار/آیتم/فرمان                     |
| `tool.call.delta`     | به‌روزرسانی ابزار/آیتم/فرمان                    |
| `tool.call.completed` | تکمیل ابزار/آیتم/فرمان                |
| `tool.call.failed`    | شکست ابزار/آیتم/فرمان یا وضعیت مسدودشده |
| `approval.requested`  | درخواست تأیید اجرای فرمان یا Plugin             |
| `approval.resolved`   | تعیین تکلیف تأیید اجرای فرمان یا Plugin          |
| `session.created`     | ایجاد `sessions.changed`                   |
| `session.updated`     | به‌روزرسانی `sessions.changed`                   |
| `session.compacted`   | Compaction در `sessions.changed`               |
| `task.updated`        | رویدادهای به‌روزرسانی وظیفه                          |
| `artifact.updated`    | رویدادهای استریم patch                         |
| `raw`                 | هر رویدادی که هنوز نگاشت پایدار SDK ندارد  |

`Run.events()` رویدادها را به یک شناسهٔ run محدود می‌کند و رویدادهای قبلاً دیده‌شده را برای
runهای سریع بازپخش می‌کند. یعنی جریان مستندشده امن است:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

برای استریم‌های سراسری برنامه، از `oc.events()` استفاده کنید. برای فریم‌های خام Gateway، از
`oc.rawEvents()` استفاده کنید.

## مدل‌ها، ابزارها، آرتیفکت‌ها و تأییدها

کمک‌تابع‌های مدل به متدهای فعلی Gateway نگاشت می‌شوند:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

کمک‌تابع‌های ابزار، کاتالوگ Gateway، نمای مؤثر ابزار، و فراخوانی مستقیم ابزار Gateway را در دسترس قرار می‌دهند. `oc.tools.invoke()` به‌جای پرتاب خطا برای ردهای مربوط به سیاست یا تأیید، یک envelope تایپ‌شده برمی‌گرداند.

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

کمک‌تابع‌های آرتیفکت، تصویر آرتیفکت Gateway را برای زمینهٔ session، run یا
task در دسترس قرار می‌دهند. هر فراخوانی به یک محدودهٔ صریح `sessionKey`، `runId` یا
`taskId` نیاز دارد:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

کمک‌تابع‌های تأیید از RPCهای تأیید اجرا استفاده می‌کنند:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## مواردی که امروز صراحتاً پشتیبانی نمی‌شوند

SDK نام‌هایی برای مدل محصولی که می‌خواهیم دارد، اما بی‌سروصدا وانمود نمی‌کند
RPCهای Gateway وجود دارند. این فراخوانی‌ها در حال حاضر خطاهای صریحِ پشتیبانی‌نشدن
پرتاب می‌کنند:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

فیلدهای `workspace`، `runtime`، `environment` و `approvals` برای هر run به‌عنوان
شکل آینده تایپ شده‌اند، اما Gateway فعلی از این overrideها روی
RPC مربوط به `agent` پشتیبانی نمی‌کند. اگر فراخوان‌ها آن‌ها را ارسال کنند، SDK پیش از ارسال run خطا می‌دهد
تا کار به‌طور تصادفی با رفتار پیش‌فرض workspace، runtime،
environment یا approval اجرا نشود.

## App SDK در برابر Plugin SDK

وقتی کد بیرون از OpenClaw قرار دارد، از App SDK استفاده کنید:

- اسکریپت‌های Node که runهای agent را شروع یا مشاهده می‌کنند
- jobهای CI که یک Gateway را فراخوانی می‌کنند
- داشبوردها و پنل‌های مدیریتی
- افزونه‌های IDE
- پل‌های خارجی که لازم نیست به Pluginهای کانال تبدیل شوند
- تست‌های یکپارچه‌سازی با transportهای جعلی یا واقعی Gateway

وقتی کد داخل OpenClaw اجرا می‌شود، از Plugin SDK استفاده کنید:

- Pluginهای provider
- Pluginهای کانال
- hookهای ابزار یا چرخهٔ عمر
- Pluginهای harness عامل
- کمک‌کننده‌های runtime قابل اعتماد

کد App SDK باید از `@openclaw/sdk` import کند. کد Plugin باید از
زیرمسیرهای مستندشدهٔ `openclaw/plugin-sdk/*` import کند. این دو قرارداد را با هم مخلوط نکنید.

## اسناد مرتبط

- [طراحی API مربوط به OpenClaw App SDK](/fa/reference/openclaw-sdk-api-design)
- [مرجع RPC مربوط به Gateway](/fa/reference/rpc)
- [حلقهٔ عامل](/fa/concepts/agent-loop)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [Sessionها](/fa/concepts/session)
- [وظایف پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
