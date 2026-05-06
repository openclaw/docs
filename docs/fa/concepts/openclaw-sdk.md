---
read_when:
    - شما در حال ساخت یک برنامهٔ خارجی، اسکریپت، داشبورد، کار ادغام پیوسته، یا افزونهٔ محیط توسعهٔ یکپارچه هستید که با OpenClaw ارتباط برقرار می‌کند
    - شما در حال انتخاب بین App SDK و Plugin SDK هستید
    - شما در حال یکپارچه‌سازی با اجراها، نشست‌ها، رویدادها، تأییدیه‌ها، مدل‌ها یا ابزارهای عامل Gateway هستید
sidebarTitle: App SDK
summary: SDK عمومی برنامه OpenClaw برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
title: SDK برنامه OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:12:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**، API عمومی کلاینت برای برنامه‌هایی خارج از فرایند OpenClaw است. زمانی از `@openclaw/sdk` استفاده کنید که یک اسکریپت، داشبورد، کار CI، افزونه IDE یا برنامه خارجی دیگر بخواهد به Gateway وصل شود، اجرای عامل‌ها را شروع کند، رویدادها را استریم کند، منتظر نتایج بماند، کار را لغو کند یا منابع Gateway را بررسی کند.

<Note>
  App SDK با [Plugin SDK](/fa/plugins/sdk-overview) متفاوت است.
  `@openclaw/sdk` از بیرون OpenClaw با Gateway صحبت می‌کند.
  `openclaw/plugin-sdk/*` فقط برای Pluginهایی است که داخل OpenClaw اجرا می‌شوند و ارائه‌دهنده‌ها، کانال‌ها، ابزارها، هوک‌ها یا runtimeهای مورد اعتماد را ثبت می‌کنند.
</Note>

## آنچه امروز عرضه می‌شود

`@openclaw/sdk` شامل موارد زیر است:

| سطح                      | وضعیت  | کاری که انجام می‌دهد                                                               |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | آماده   | نقطه ورود اصلی کلاینت. مالک ترنسپورت، اتصال، درخواست‌ها و رویدادهاست.             |
| `GatewayClientTransport`  | آماده   | ترنسپورت WebSocket مبتنی بر کلاینت Gateway.                                       |
| `oc.agents`               | آماده   | دسته‌های عامل را فهرست می‌کند، می‌سازد، به‌روزرسانی می‌کند، حذف می‌کند و می‌گیرد. |
| `Agent.run()`             | آماده   | یک اجرای Gateway از نوع `agent` را شروع می‌کند و یک `Run` برمی‌گرداند.             |
| `oc.runs`                 | آماده   | اجراها را می‌سازد، می‌گیرد، منتظرشان می‌ماند، لغو می‌کند و استریم می‌کند.          |
| `Run.events()`            | آماده   | رویدادهای نرمال‌شده هر اجرا را با بازپخش برای اجراهای سریع استریم می‌کند.          |
| `Run.wait()`              | آماده   | `agent.wait` را صدا می‌زند و یک `RunResult` پایدار برمی‌گرداند.                    |
| `Run.cancel()`            | آماده   | `sessions.abort` را با شناسه اجرا و در صورت وجود با کلید نشست صدا می‌زند.          |
| `oc.sessions`             | آماده   | دسته‌های نشست را می‌سازد، resolve می‌کند، به آن‌ها می‌فرستد، patch می‌کند، compact می‌کند و می‌گیرد. |
| `Session.send()`          | آماده   | `sessions.send` را صدا می‌زند و یک `Run` برمی‌گرداند.                              |
| `oc.models`               | آماده   | `models.list` و RPC وضعیت فعلی `models.authStatus` را صدا می‌زند.                  |
| `oc.tools`                | آماده   | ابزارهای Gateway را از طریق پایپ‌لاین سیاست فهرست، scope و invoke می‌کند.          |
| `oc.artifacts`            | آماده   | آرتیفکت‌های transcript Gateway را فهرست می‌کند، می‌گیرد و دانلود می‌کند.           |
| `oc.approvals`            | آماده   | تأییدیه‌های exec را از طریق RPCهای تأیید Gateway فهرست و resolve می‌کند.           |
| `oc.environments`         | جزئی    | گزینه‌های محیط محلی Gateway و node را فهرست می‌کند؛ ساخت/حذف وصل نشده‌اند.         |
| `oc.rawEvents()`          | آماده   | رویدادهای خام Gateway را برای مصرف‌کنندگان پیشرفته در دسترس می‌گذارد.             |
| `normalizeGatewayEvent()` | آماده   | رویدادهای خام Gateway را به شکل پایدار رویداد SDK تبدیل می‌کند.                    |

SDK همچنین نوع‌های اصلی استفاده‌شده توسط این سطح‌ها را export می‌کند:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` و نوع‌های نتیجه مرتبط.

## اتصال به Gateway

یک کلاینت با URL صریح Gateway بسازید، یا برای تست‌ها و runtimeهای برنامه embedded یک ترنسپورت سفارشی inject کنید.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` معادل `url` است. گزینه
`gateway: "auto"` توسط سازنده پذیرفته می‌شود، اما کشف خودکار Gateway هنوز یک قابلیت جداگانه SDK نیست؛ زمانی که برنامه از قبل نمی‌داند چگونه Gateway را کشف کند، `url` را پاس بدهید.

برای تست‌ها، شیئی را پاس بدهید که `OpenClawTransport` را پیاده‌سازی می‌کند:

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

وقتی برنامه یک دسته عامل می‌خواهد، از `oc.agents.get(id)` استفاده کنید، سپس
`agent.run()` را صدا بزنید.

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

ارجاع‌های مدل با ارائه‌دهنده، مانند `openai/gpt-5.5`، به overrideهای `provider` و `model` در Gateway تقسیم می‌شوند. `timeoutMs` در SDK بر حسب میلی‌ثانیه باقی می‌ماند و برای RPC نوع `agent` به ثانیه timeout در Gateway تبدیل می‌شود.

`run.wait()` از RPC `agent.wait` در Gateway استفاده می‌کند. اگر مهلت انتظار در حالی تمام شود که اجرا هنوز فعال است، به‌جای وانمود کردن به اینکه خود اجرا timeout شده، `status: "accepted"` برمی‌گرداند. timeoutهای runtime، اجراهای abortشده و اجراهای لغوشده به `timed_out` یا `cancelled` نرمال می‌شوند.

## ساخت و استفاده دوباره از نشست‌ها

وقتی برنامه وضعیت transcript پایدار می‌خواهد، از نشست‌ها استفاده کنید.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`، `sessions.send` را صدا می‌زند و یک `Run` برمی‌گرداند. دسته‌های نشست همچنین پشتیبانی می‌کنند از:

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

نوع‌های رایج رویداد شامل این مواردند:

| نوع رویداد             | رویداد منبع Gateway                         |
| --------------------- | ------------------------------------------- |
| `run.started`         | شروع چرخه عمر `agent`                       |
| `run.completed`       | پایان چرخه عمر `agent`                      |
| `run.failed`          | خطای چرخه عمر `agent`                       |
| `run.cancelled`       | پایان چرخه عمر abort/لغوشده                 |
| `run.timed_out`       | پایان چرخه عمر timeout                      |
| `assistant.delta`     | دلتای استریم دستیار                         |
| `assistant.message`   | پیام دستیار                                 |
| `thinking.delta`      | استریم تفکر یا برنامه                       |
| `tool.call.started`   | شروع ابزار/آیتم/فرمان                       |
| `tool.call.delta`     | به‌روزرسانی ابزار/آیتم/فرمان                |
| `tool.call.completed` | تکمیل ابزار/آیتم/فرمان                      |
| `tool.call.failed`    | شکست ابزار/آیتم/فرمان یا وضعیت مسدودشده    |
| `approval.requested`  | درخواست تأیید exec یا Plugin                |
| `approval.resolved`   | resolve شدن تأیید exec یا Plugin            |
| `session.created`     | ساخت `sessions.changed`                     |
| `session.updated`     | به‌روزرسانی `sessions.changed`              |
| `session.compacted`   | compaction در `sessions.changed`            |
| `task.updated`        | رویدادهای به‌روزرسانی task                  |
| `artifact.updated`    | رویدادهای استریم patch                      |
| `raw`                 | هر رویدادی که هنوز نگاشت پایدار SDK ندارد   |

`Run.events()` رویدادها را به یک شناسه اجرا فیلتر می‌کند و رویدادهای دیده‌شده قبلی را برای اجراهای سریع بازپخش می‌کند. یعنی جریان مستندشده امن است:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

برای استریم‌های کل برنامه، از `oc.events()` استفاده کنید. برای فریم‌های خام Gateway، از
`oc.rawEvents()` استفاده کنید.

## مدل‌ها، ابزارها، آرتیفکت‌ها و تأییدیه‌ها

helperهای مدل به متدهای فعلی Gateway نگاشت می‌شوند:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

helperهای ابزار کاتالوگ Gateway، نمای مؤثر ابزار و invoke مستقیم ابزار Gateway را در دسترس می‌گذارند. `oc.tools.invoke()` به‌جای throw کردن برای رد شدن توسط سیاست یا تأیید، یک envelope typed برمی‌گرداند.

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

helperهای آرتیفکت projection آرتیفکت Gateway را برای context نشست، اجرا یا task در دسترس می‌گذارند. هر فراخوانی به یک scope صریح از `sessionKey`، `runId` یا `taskId` نیاز دارد:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

helperهای تأیید از RPCهای تأیید exec استفاده می‌کنند:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

helperهای محیط، کشف فقط‌خواندنی محلی Gateway و node را در دسترس می‌گذارند:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## مواردی که امروز صراحتاً پشتیبانی نمی‌شوند

SDK نام‌هایی را برای مدل محصولی که می‌خواهیم شامل می‌شود، اما در سکوت وانمود نمی‌کند RPCهای Gateway وجود دارند. این فراخوانی‌ها در حال حاضر خطاهای صریح unsupported throw می‌کنند:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

فیلدهای `workspace`، `runtime`، `environment` و `approvals` در سطح هر اجرا به‌عنوان شکل آینده typed شده‌اند، اما Gateway فعلی از این overrideها روی RPC نوع `agent` پشتیبانی نمی‌کند. اگر فراخوان‌ها آن‌ها را پاس بدهند، SDK پیش از ارسال اجرا throw می‌کند تا کار به‌طور تصادفی با رفتار پیش‌فرض workspace، runtime، environment یا approval اجرا نشود.

## App SDK در برابر Plugin SDK

وقتی کد بیرون از OpenClaw زندگی می‌کند، از App SDK استفاده کنید:

- اسکریپت‌های Node که اجرای عامل‌ها را شروع یا مشاهده می‌کنند
- کارهای CI که Gateway را صدا می‌زنند
- داشبوردها و پنل‌های مدیریت
- افزونه‌های IDE
- bridgeهای خارجی که لازم نیست به Plugin کانال تبدیل شوند
- تست‌های یکپارچه‌سازی با ترنسپورت‌های Gateway جعلی یا واقعی

وقتی کد داخل OpenClaw اجرا می‌شود، از Plugin SDK استفاده کنید:

- Pluginهای ارائه‌دهنده
- Pluginهای کانال
- هوک‌های ابزار یا چرخه عمر
- Pluginهای harness عامل
- helperهای runtime مورد اعتماد

کد App SDK باید از `@openclaw/sdk` import کند. کد Plugin باید از زیردسترسی‌های مستندشده `openclaw/plugin-sdk/*` import کند. این دو قرارداد را با هم مخلوط نکنید.

## مرتبط

- [طراحی API مربوط به OpenClaw App SDK](/fa/reference/openclaw-sdk-api-design)
- [مرجع RPC مربوط به Gateway](/fa/reference/rpc)
- [حلقه عامل](/fa/concepts/agent-loop)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [نشست‌ها](/fa/concepts/session)
- [کارهای پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
