---
read_when:
    - شما در حال ساخت یک برنامه، اسکریپت، داشبورد، کار CI، یا افزونه IDE خارجی هستید که با OpenClaw ارتباط برقرار می‌کند
    - شما در حال انتخاب بین App SDK و Plugin SDK هستید
    - در حال یکپارچه‌سازی با اجراهای عامل Gateway، نشست‌ها، رویدادها، تأییدها، مدل‌ها یا ابزارها هستید
sidebarTitle: App SDK
summary: SDK عمومی OpenClaw App برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، وظایف CI و افزونه‌های IDE
title: کیت توسعه نرم‌افزار برنامه OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:36:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**SDK اپلیکیشن OpenClaw** API عمومی کلاینت برای اپلیکیشن‌های بیرون از فرایند OpenClaw است. وقتی یک اسکریپت، داشبورد، کار CI، افزونه IDE، یا اپلیکیشن خارجی دیگر می‌خواهد به Gateway وصل شود، اجرای عامل‌ها را شروع کند، رویدادها را استریم کند، منتظر نتایج بماند، کار را لغو کند، یا منابع Gateway را بررسی کند، از `@openclaw/sdk` استفاده کنید.

<Note>
  App SDK با [Plugin SDK](/fa/plugins/sdk-overview) فرق دارد.
  `@openclaw/sdk` از بیرون OpenClaw با Gateway صحبت می‌کند.
  `openclaw/plugin-sdk/*` فقط برای Pluginهایی است که داخل OpenClaw اجرا می‌شوند و
  ارائه‌دهنده‌ها، کانال‌ها، ابزارها، هوک‌ها، یا runtimeهای معتمد را ثبت می‌کنند.
</Note>

## آنچه امروز عرضه می‌شود

`@openclaw/sdk` همراه با این موارد عرضه می‌شود:

| سطح                       | وضعیت | کاری که انجام می‌دهد                                                        |
| ------------------------- | ----- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | آماده | نقطه ورود اصلی کلاینت. transport، اتصال، درخواست‌ها، و رویدادها را در اختیار دارد. |
| `GatewayClientTransport`  | آماده | transport وب‌سوکت که به کلاینت Gateway متکی است.                            |
| `oc.agents`               | آماده | handleهای عامل را فهرست می‌کند، می‌سازد، به‌روزرسانی می‌کند، حذف می‌کند، و می‌گیرد. |
| `Agent.run()`             | آماده | یک اجرای Gateway `agent` را شروع می‌کند و یک `Run` برمی‌گرداند.              |
| `oc.runs`                 | آماده | runها را می‌سازد، می‌گیرد، منتظرشان می‌ماند، لغو می‌کند، و استریم می‌کند.   |
| `Run.events()`            | آماده | رویدادهای نرمال‌شده هر run را با replay برای runهای سریع استریم می‌کند.     |
| `Run.wait()`              | آماده | `agent.wait` را فراخوانی می‌کند و یک `RunResult` پایدار برمی‌گرداند.         |
| `Run.cancel()`            | آماده | `sessions.abort` را با شناسه run و در صورت وجود با کلید session فراخوانی می‌کند. |
| `oc.sessions`             | آماده | handleهای session را می‌سازد، resolve می‌کند، به آن‌ها ارسال می‌کند، patch می‌کند، compact می‌کند، و می‌گیرد. |
| `Session.send()`          | آماده | `sessions.send` را فراخوانی می‌کند و یک `Run` برمی‌گرداند.                  |
| `oc.models`               | آماده | `models.list` و RPC وضعیت فعلی `models.authStatus` را فراخوانی می‌کند.       |
| `oc.tools`                | جزئی  | کاتالوگ ابزار و ابزارهای موثر را فهرست می‌کند؛ فراخوانی مستقیم ابزار وصل نشده است. |
| `oc.approvals`            | آماده | تاییدهای exec را از طریق RPCهای تایید Gateway فهرست و resolve می‌کند.       |
| `oc.rawEvents()`          | آماده | رویدادهای خام Gateway را برای مصرف‌کنندگان پیشرفته در دسترس می‌گذارد.       |
| `normalizeGatewayEvent()` | آماده | رویدادهای خام Gateway را به شکل پایدار رویداد SDK تبدیل می‌کند.             |

SDK همچنین typeهای اصلی استفاده‌شده توسط این سطح‌ها را export می‌کند:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode`, و typeهای نتیجه مرتبط.

## اتصال به Gateway

یک کلاینت با URL صریح Gateway بسازید، یا برای تست‌ها و runtimeهای اپلیکیشن embedded یک transport سفارشی تزریق کنید.

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
`gateway: "auto"` توسط سازنده پذیرفته می‌شود، اما کشف خودکار Gateway هنوز یک قابلیت جداگانه SDK نیست؛ وقتی اپلیکیشن از قبل نمی‌داند چطور Gateway را کشف کند، `url` را پاس بدهید.

برای تست‌ها، آبجکتی را پاس بدهید که `OpenClawTransport` را پیاده‌سازی می‌کند:

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

ارجاع‌های model با provider مشخص، مانند `openai/gpt-5.5`، به overrideهای Gateway
`provider` و `model` تقسیم می‌شوند. `timeoutMs` در SDK بر حسب میلی‌ثانیه می‌ماند و برای RPC
`agent` به timeout بر حسب ثانیه در Gateway تبدیل می‌شود.

`run.wait()` از RPC Gateway با نام `agent.wait` استفاده می‌کند. اگر مهلت wait در حالی تمام شود که run هنوز فعال است، به جای اینکه وانمود کند خود run timeout شده، `status: "accepted"` برمی‌گرداند. timeoutهای runtime، runهای abortشده، و runهای cancelled به `timed_out` یا `cancelled` نرمال می‌شوند.

## ساخت و استفاده دوباره از sessionها

وقتی اپلیکیشن وضعیت transcript پایدار می‌خواهد، از sessionها استفاده کنید.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`، `sessions.send` را فراخوانی می‌کند و یک `Run` برمی‌گرداند. handleهای session همچنین از این موارد پشتیبانی می‌کنند:

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

typeهای رایج رویداد شامل این موارد هستند:

| نوع رویداد              | رویداد Gateway منبع                         |
| ----------------------- | ------------------------------------------- |
| `run.started`           | شروع lifecycle `agent`                     |
| `run.completed`         | پایان lifecycle `agent`                    |
| `run.failed`            | خطای lifecycle `agent`                     |
| `run.cancelled`         | پایان lifecycle abortشده/cancelled         |
| `run.timed_out`         | پایان lifecycle timeout                    |
| `assistant.delta`       | delta استریم دستیار                         |
| `assistant.message`     | پیام دستیار                                 |
| `thinking.delta`        | استریم thinking یا plan                     |
| `tool.call.started`     | شروع ابزار/آیتم/فرمان                       |
| `tool.call.delta`       | به‌روزرسانی ابزار/آیتم/فرمان                |
| `tool.call.completed`   | تکمیل ابزار/آیتم/فرمان                      |
| `tool.call.failed`      | شکست ابزار/آیتم/فرمان یا وضعیت مسدودشده    |
| `approval.requested`    | درخواست تایید exec یا Plugin               |
| `approval.resolved`     | resolve شدن تایید exec یا Plugin           |
| `session.created`       | ساخت `sessions.changed`                    |
| `session.updated`       | به‌روزرسانی `sessions.changed`             |
| `session.compacted`     | Compaction در `sessions.changed`            |
| `task.updated`          | رویدادهای به‌روزرسانی task                  |
| `artifact.updated`      | رویدادهای استریم patch                      |
| `raw`                   | هر رویدادی که هنوز mapping پایدار SDK ندارد |

`Run.events()` رویدادها را به یک شناسه run فیلتر می‌کند و رویدادهایی را که قبلا دیده شده‌اند برای runهای سریع replay می‌کند. یعنی flow مستندشده امن است:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

برای استریم‌های کل اپلیکیشن، از `oc.events()` استفاده کنید. برای frameهای خام Gateway، از
`oc.rawEvents()` استفاده کنید.

## مدل‌ها، ابزارها، و تاییدها

helperهای model به متدهای فعلی Gateway نگاشت می‌شوند:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

helperهای ابزار، کاتالوگ Gateway و نمای ابزار موثر را در دسترس می‌گذارند:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

helperهای تایید از RPCهای تایید exec استفاده می‌کنند:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## مواردی که امروز صریحا پشتیبانی نمی‌شوند

SDK نام‌هایی برای مدل محصولی که می‌خواهیم دارد، اما بی‌سروصدا وانمود نمی‌کند RPCهای Gateway وجود دارند. این فراخوانی‌ها در حال حاضر خطاهای صریح unsupported پرتاب می‌کنند:

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

فیلدهای هر run با نام‌های `workspace`، `runtime`، `environment`، و `approvals` به عنوان شکل آینده type شده‌اند، اما Gateway فعلی از این overrideها روی RPC
`agent` پشتیبانی نمی‌کند. اگر فراخواننده‌ها آن‌ها را پاس بدهند، SDK قبل از ارسال run خطا پرتاب می‌کند تا کار ناخواسته با رفتار پیش‌فرض workspace، runtime، environment، یا approval اجرا نشود.

## App SDK در برابر Plugin SDK

وقتی کد بیرون از OpenClaw قرار دارد، از App SDK استفاده کنید:

- اسکریپت‌های Node که runهای عامل را شروع یا مشاهده می‌کنند
- کارهای CI که یک Gateway را فراخوانی می‌کنند
- داشبوردها و پنل‌های مدیریت
- افزونه‌های IDE
- bridgeهای خارجی که لازم نیست به channel plugin تبدیل شوند
- تست‌های integration با transportهای Gateway جعلی یا واقعی

وقتی کد داخل OpenClaw اجرا می‌شود، از Plugin SDK استفاده کنید:

- Pluginهای provider
- Pluginهای channel
- هوک‌های tool یا lifecycle
- Pluginهای agent harness
- helperهای runtime معتمد

کد App SDK باید از `@openclaw/sdk` import کند. کد Plugin باید از subpathهای مستندشده `openclaw/plugin-sdk/*` import کند. این دو قرارداد را با هم ترکیب نکنید.

## مستندات مرتبط

- [طراحی API مربوط به OpenClaw App SDK](/fa/reference/openclaw-sdk-api-design)
- [مرجع RPC در Gateway](/fa/reference/rpc)
- [حلقه عامل](/fa/concepts/agent-loop)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [Sessionها](/fa/concepts/session)
- [taskهای پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
