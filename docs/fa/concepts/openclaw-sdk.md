---
read_when:
    - شما در حال طراحی یا پیاده‌سازی یک SDK عمومی برای اپلیکیشن OpenClaw هستید
    - شما APIهای عامل OpenClaw را با Cursor، Claude Agent SDK، OpenAI Agents، Google ADK، OpenCode، Codex یا ACP مقایسه می‌کنید
    - باید تصمیم بگیرید که یک قابلیت باید در SDK عمومی برنامه، SDK Plugin، پروتکل Gateway، بک‌اند ACP، یا لایهٔ محیط مدیریت‌شده قرار بگیرد
summary: پیشنهاد طراحی برای کیت توسعه نرم‌افزار عمومی برنامه OpenClaw برای اجراهای عامل‌ها، نشست‌ها، وظایف، مصنوعات و محیط‌های مدیریت‌شده
title: طراحی SDK OpenClaw
x-i18n:
    generated_at: "2026-04-30T00:06:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffd4380e556e0e2e1218acaa9e5934e8b308b3420aa25a6d2598d35c7f9a7ab2
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

این صفحه یک پیشنهاد طراحی برای **OpenClaw app SDK** عمومی آینده است. این
صفحه از [plugin SDK](/fa/plugins/sdk-overview) موجود جدا است.

plugin SDK برای کدی است که داخل OpenClaw اجرا می‌شود و providerها،
channelها، ابزارها، hookها و runtimeهای مورد اعتماد را گسترش می‌دهد. app SDK باید برای
برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، jobهای CI، افزونه‌های IDE و
سامانه‌های خودکاری‌سازی باشد که می‌خواهند agentهای OpenClaw را از طریق یک API عمومی
پایدار اجرا و مشاهده کنند.

## وضعیت

معماری پیش‌نویس.

این سند جهت‌گیری طراحی را از یک بازبینی مقایسه‌ای این
SDKهای agent و سطوح runtime ثبت می‌کند:

| پروژه             | درس مفید                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| کتاب آشپزی Cursor SDK | بهترین API محصول در سطح بالا: `Agent`، `Run`، runtimeهای محلی و ابری، streaming، لغو، کشف مدل، repositoryها، artifactها و جریان‌های cloud pull request.    |
| Claude Agent SDK    | client session دوسویه قوی، پشتیبانی از interrupt و steer، حالت‌های permission، hookها، ابزارهای سفارشی، ذخیره‌گاه‌های session و transcriptهای قابل ازسرگیری.                        |
| OpenAI Agents SDK   | مفاهیم workflow قوی: handoffها، guardrailها، تأییدهای انسانی، tracing، وضعیت run، شیءهای نتیجه streaming و resume پس از interruptionها.                             |
| Google ADK          | معماری داخلی قوی: runner، session service، memory service، artifact service، credential service، Pluginها، event actionها و تأییدهای long running tool.  |
| OpenCode            | شکل client/server قوی: client API تولیدشده، REST به‌همراه SSE، sessionها، workspaceها، worktreeها، permissionها، questionها، fileها، VCS، PTY، toolها، agentها، skills و MCP. |
| Codex               | مرز runtime محلی قوی: approvalها، sandboxing، سیاست شبکه، serverهای exec محلی و remote، eventهای protocol ساختاریافته و sessionهای app-server آگاه از thread.     |
| ACP و acpx        | لایه interoperability قوی برای harnessهای کدنویسی خارجی با sessionهای نام‌گذاری‌شده، prompt queueها، cancellation تعاونی و adapterهای runtime.                            |

توصیه این است که یک facade عمومی ساده در سبک Cursor روی یک
client تولیدشده Gateway در سبک OpenCode ساخته شود، درحالی‌که مفاهیم Claude، OpenAI Agents،
ADK، Codex و ACP به‌عنوان ارجاع‌های طراحی داخلی در جاهایی که مناسب‌اند حفظ شوند.

## اهداف

- دادن یک API کوچک سطح بالا به توسعه‌دهندگان app برای اجرای agentهای OpenClaw.
- نگه‌داشتن OpenClaw محلی‌اول به‌عنوان runtime پیش‌فرض.
- تبدیل محیط‌های ابری یا managed به یک environment provider افزایشی، نه یک
  API متفاوت برای agent.
- حفظ مرزهای موجود OpenClaw: Gateway مالک protocol عمومی است، plugin
  SDK مالک extensionهای in-process است، ACP مالک interop با harness خارجی است.
- پشتیبانی از `stream`، `wait`، `cancel`، `resume`، `fork`، artifactها، approvalها
  و taskهای پس‌زمینه به‌عنوان عملیات‌های درجه‌یک.
- ارائه eventهای normalizeشده پایدار در کنار حفظ eventهای raw بومی runtime برای
  مصرف‌کنندگان پیشرفته.
- صریح‌کردن permissionهای SDK، forwarding رازها، approvalها، sandboxing و محیط‌های remote.
- کوچک نگه‌داشتن contract عمومی تا مستندسازی، آزمایش، version و
  generate آن ممکن باشد.

## غیرهدف‌ها

- `openclaw/plugin-sdk/*` را به‌عنوان app SDK در معرض استفاده قرار ندهید.
- ACP را تنها مدل runtime نکنید.
- پیش از مفیدشدن SDK، به یک سرویس ابری نیاز نداشته باشید.
- APIهای Cursor، Claude، OpenAI، ADK، OpenCode، Codex یا ACP را
  دقیقاً clone نکنید.
- payloadهای event نامحدود `any` را به‌عنوان تنها contract عمومی در معرض استفاده قرار ندهید.
- برای یک harness خارجی وعده sandbox یا network isolation ندهید، مگر اینکه
  محیط انتخاب‌شده واقعاً بتواند آن را enforce کند.
- کاری نکنید نویسندگان Plugin در کد runtime Plugin به شیءهای app SDK وابسته شوند.

## تناسب فعلی OpenClaw

OpenClaw از قبل بیشتر زیرساخت لازم را دارد:

| سطح موجود                                    | آنچه فراهم می‌کند                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Agent loop](/fa/concepts/agent-loop)                  | lifecycle اجرای `agent` و `agent.wait`، streaming، timeout و serialization session.                                     |
| [Agent runtimes](/fa/concepts/agent-runtimes)          | جداسازی provider، model، runtime و channel.                                                                          |
| [ACP agents](/fa/tools/acp-agents)                     | sessionهای harness خارجی برای Claude Code، Cursor، Gemini CLI، OpenCode، ACP صریح Codex و ابزارهای مشابه.            |
| [Background tasks](/fa/automation/tasks)               | ledger فعالیت جداشده برای ACP، subagentها، Cron، عملیات‌های CLI و jobهای async media.                                   |
| [Sub-agents](/fa/tools/subagents)                      | اجرای agentهای پس‌زمینه ایزوله، context forkشده اختیاری، تحویل دوباره به sessionهای درخواست‌کننده.                              |
| [Agent harness plugins](/fa/plugins/sdk-agent-harness) | ثبت runtime native مورد اعتماد برای harnessهای embedded مانند Codex.                                                  |
| schemaهای protocol Gateway                            | تعریف‌های typed method و event فعلی برای parameterهای agent، sessionها، subscriptionها، abortها، Compaction و checkpointها. |

شکاف در اجرای agent نیست. شکاف یک facade عمومی پایدار و دوستانه روی
این اجزاست.

## مدل اصلی

app SDK باید از مجموعه کوچکی از اسم‌های پایدار استفاده کند.

| اسم          | معنا                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OpenClaw`    | نقطه ورود client. مالک کشف Gateway، auth، دسترسی low-level client و namespace factoryها.                        |
| `Agent`       | actor پیکربندی‌شده. agent id، مدل پیش‌فرض، runtime پیش‌فرض، سیاست ابزار پیش‌فرض و helperهای روبه‌روی app را حمل می‌کند.           |
| `Session`     | transcript پایدار، routing، workspace، context و اتصال runtime.                                                      |
| `Run`         | یک turn یا task ارسال‌شده. eventها را stream می‌کند، منتظر نتیجه می‌ماند، لغو می‌کند و artifactها را در معرض استفاده قرار می‌دهد.                              |
| `Task`        | ورودی ledger فعالیت جداشده یا پس‌زمینه. subagentها، spawnهای ACP، jobهای cron، runهای CLI و jobهای async را پوشش می‌دهد.           |
| `Artifact`    | fileها، patchها، diffها، media، logها، trajectoryها، pull requestها، screenshotها و bundleهای تولیدشده.                       |
| `Environment` | جایی که run اجرا می‌شود: Gateway محلی، workspace محلی، node host، harness ACP، managed runner یا workspace ابری آینده. |
| `ToolSpace`   | سطح ابزار مؤثر: ابزارهای OpenClaw، serverهای MCP، ابزارهای channel، ابزارهای app، ruleهای approval و metadata ابزار.      |
| `Approval`    | تصمیم انسانی یا policy که توسط یک run، tool، environment یا harness درخواست شده است.                                                |

این اسم‌ها به‌خوبی به مفاهیم موجود OpenClaw نگاشت می‌شوند اما از نشت
نام‌های وابسته به پیاده‌سازی مانند داخلیات PI runner، ثبت plugin harness
یا جزئیات adapter ACP جلوگیری می‌کنند.

## شکل محصول

SDK سطح بالا باید این‌گونه حس شود:

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({ gateway: "auto" });
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
});

for await (const event of run.events()) {
  if (event.type === "assistant.delta") {
    process.stdout.write(event.text);
  }
}

const result = await run.wait();
console.log(result.status);
```

همان app باید بتواند از یک session پایدار استفاده کند:

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

یادداشت پیاده‌سازی فعلی: `@openclaw/sdk` با سطح پشتیبانی‌شده توسط Gateway
که امروز وجود دارد شروع می‌شود. ارجاع‌های مدل دارای provider مانند
`openai/gpt-5.5` به overrideهای `provider` و `model` در Gateway تقسیم می‌شوند.
انتخاب‌های per-run برای `workspace`، `runtime`، `environment` و `approvals` هنوز
هدف‌های طراحی هستند؛ وقتی callerها آن‌ها را تنظیم کنند client خطا می‌دهد تا requestها
بی‌صدا با defaultها اجرا نشوند. helperهای task، artifact، environment و generic tool
invocation نیز به‌عنوان شکل API آینده scaffold شده‌اند و تا زمانی که RPCهای Gateway
برای آن‌ها وجود داشته باشد خطاهای صریح unsupported می‌دهند.

و همان API باید بتواند از یک harness خارجی ACP استفاده کند:

```typescript
const run = await oc.runs.create({
  input: "Deep review this repository and return only high-risk findings.",
  workspace: { cwd: process.cwd() },
  runtime: { type: "acp", harness: "claude" },
  mode: "task",
});
```

محیط‌های managed نباید API سطح بالا را تغییر دهند:

```typescript
const run = await agent.run({
  input: "Run the full changed gate and summarize failures.",
  workspace: { repo: "openclaw/openclaw", ref: "main" },
  runtime: {
    type: "managed",
    provider: "testbox",
    timeoutMinutes: 90,
  },
});
```

## انتخاب runtime

app SDK باید انتخاب runtime را به‌عنوان یک union normalizeشده ارائه کند:

```typescript
type RuntimeSelection =
  | "auto"
  | { type: "embedded"; id: "pi" | "codex" | string }
  | { type: "cli"; id: "claude-cli" | string }
  | { type: "acp"; harness: "claude" | "cursor" | "gemini" | "opencode" | string }
  | { type: "managed"; provider: "local" | "node" | "testbox" | "cloud" | string };
```

قواعد:

- `auto` از قواعد انتخاب runtime در OpenClaw پیروی می‌کند.
- `embedded` harnessهای in-process مورد اعتمادی را هدف می‌گیرد که از طریق plugin
  SDK ثبت شده‌اند، مانند `pi` یا `codex`.
- `cli` اجرای backend مربوط به CLI تحت مالکیت OpenClaw را در جاهایی که موجود است هدف می‌گیرد.
- `acp` harnessهای خارجی را از طریق ACP/acpx هدف می‌گیرد.
- `managed` یک environment provider را هدف می‌گیرد و ممکن است همچنان یک runtime embedded،
  CLI یا ACP را داخل آن environment اجرا کند.

شیء انتخاب runtime باید توصیفی باشد. این شیء نباید جایی باشد
که مدیریت رازها، سیاست sandbox یا provisioning workspace در آن پنهان می‌شود.

## مدل environment

environment زیرلایه اجراست. باید صریح باشد زیرا runهای CLI محلی،
harnessهای خارجی، node hostها و workspaceهای ابری ویژگی‌های safety و lifecycle
متفاوتی دارند.

```typescript
type EnvironmentSelection =
  | { type: "local"; cwd?: string }
  | { type: "gateway"; url?: string; cwd?: string }
  | { type: "node"; nodeId: string; cwd?: string }
  | { type: "managed"; provider: string; repo?: string; ref?: string }
  | { type: "ephemeral"; provider: string; repo?: string; ref?: string };
```

environment مالک موارد زیر است:

- آماده‌سازی checkout یا workspace
- دسترسی process و file
- enforcement برای sandbox و network
- متغیرهای محیطی و ارجاع‌های راز
- logها، traceها و artifactها
- cleanup و retention
- دسترس‌پذیری runtime

این جداسازی agentهای managed را به یک extension طبیعی SDK تبدیل می‌کند. یک agent managed
یک run عادی در یک environment managed است، نه یک انشعاب محصول ویژه.

قراردادهای detailed namespace، event، result، approval، artifact، security، package
و environment provider در
[طراحی API OpenClaw SDK](/fa/reference/openclaw-sdk-api-design) قرار دارند.

## برنامه cookbook

SDK باید همراه با یک cookbook عرضه شود، نه فقط docs مرجع.

نمونه‌های پیشنهادی:

| نمونه                      | نشان می‌دهد                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| شروع سریع                   | ساخت کلاینت، اجرای یک عامل، جریان‌دادن خروجی، انتظار برای نتیجه.                                 |
| CLI عامل کدنویسی             | فضای کاری محلی، انتخاب‌گر مدل، لغو، تأییدها، خروجی JSON.                         |
| داشبورد عامل              | نشست‌ها، اجراها، وظایف پس‌زمینه، آرتیفکت‌ها، بازپخش رویداد، فیلترهای وضعیت.                   |
| سازنده اپ                  | عامل یک فضای کاری را ویرایش می‌کند در حالی که یک سرور پیش‌نمایش کنار آن اجرا می‌شود.                               |
| بازبین درخواست Pull        | اجرا روی یک مرجع مخزن، گردآوری نظرهای diff و آرتیفکت‌ها.                           |
| کنسول تأیید             | اشتراک در تأییدها و پاسخ‌دادن به آن‌ها از یک UI.                                            |
| اجراکننده مهار ACP           | اجرای Claude Code، Cursor، Gemini CLI، یا OpenCode از طریق ACP با استفاده از همان API `Run`.       |
| ارائه‌دهنده محیط مدیریت‌شده | ارائه‌دهنده‌ای حداقلی که یک فضای کاری را آماده می‌کند، رویدادها را جریان می‌دهد، آرتیفکت‌ها را ذخیره می‌کند، و پاک‌سازی انجام می‌دهد.  |
| پل Slack یا Discord      | اپ خارجی رویدادها را دریافت می‌کند و خلاصه‌های پیشرفت را بدون تبدیل‌شدن به Plugin کانال منتشر می‌کند. |
| پژوهش چندعاملی         | ایجاد اجراهای موازی، گردآوری آرتیفکت‌ها، و ترکیب یک گزارش نهایی.                       |

نمونه‌های کتاب آشپزی باید ابتدا از API سطح بالا استفاده کنند. نمونه‌های
کلاینت تولیدشده سطح پایین در بخش پیشرفته قرار می‌گیرند.

## پیاده‌سازی مرحله‌ای

### مرحله ۰: RFC و واژگان

- بر سر اسم‌ها و نام‌های عمومی توافق کنید.
- نام‌های بسته‌ها را تعیین کنید.
- نخستین طبقه‌بندی رویدادها را تعریف کنید.
- SDK فعلی Plugin را در مستندات به‌عنوان موردی عمداً جداگانه علامت‌گذاری کنید.

### مرحله ۱: کلاینت تولیدشده سطح پایین

- یک کلاینت TypeScript از اسکیماهای پروتکل Gateway تولید کنید.
- ابتدا `agent`، `agent.wait`، نشست‌ها، اشتراک‌ها، لغوها، و وظایف را پوشش دهید.
- تست‌های smoke اضافه کنید که بررسی کنند متدهای تولیدشده با نام متدهای Gateway و شکل‌های اسکیما
  مطابقت دارند.
- آن را به‌عنوان بسته آزمایشی یا داخلی منتشر کنید.

### مرحله ۲: API اجرای سطح بالا

- `OpenClaw`، `Agent`، `Session`، و `Run` را اضافه کنید.
- از `run.events()`، `run.wait()`، و `run.cancel()` پشتیبانی کنید.
- از کشف Gateway محلی و URLهای صریح Gateway پشتیبانی کنید.
- از نشست‌های بادوام و ارسال نشست پشتیبانی کنید.

### مرحله ۳: تصویرسازی رویداد نرمال‌شده

- تصویرسازی رویداد نرمال‌شده سمت Gateway را کنار رویدادهای خام موجود اضافه کنید.
- رویدادهای خام زمان اجرا را تا جایی که سیاست اجازه می‌دهد حفظ کنید.
- نشانگرهای بازپخش و رفتار اتصال مجدد را اضافه کنید.
- رویدادهای PI، Codex، ACP، و وظیفه را به طبقه‌بندی پایدار نگاشت کنید.

### مرحله ۴: آرتیفکت‌ها و تأییدها

- فهرست‌کردن و دانلود آرتیفکت را اضافه کنید.
- کمک‌کننده‌های اشتراک تأیید و پاسخ را اضافه کنید.
- کمک‌کننده‌های اشتراک پرسش و پاسخ را اضافه کنید.
- کنسول تأیید کتاب آشپزی را اضافه کنید.

### مرحله ۵: ارائه‌دهندگان محیط

- قراردادهای ارائه‌دهنده محیط محلی، node، و مدیریت‌شده را معرفی کنید.
- با محیطی شروع کنید که از نظر عملیاتی از قبل وجود دارد.
- آماده‌سازی فضای کاری، لاگ‌ها، آرتیفکت‌ها، مهلت زمانی، پاک‌سازی، و نگه‌داری را اضافه کنید.

### مرحله ۶: گردش‌کارهای به سبک ابر

- اجراهای مبتنی بر مخزن و شاخه را اضافه کنید.
- آرتیفکت‌های درخواست Pull را اضافه کنید.
- بردهای اجرا را که بر اساس مخزن، شاخه، وضعیت، و مسئول گروه‌بندی شده‌اند اضافه کنید.
- نشست‌های مدیریت‌شده بلندمدت و سیاست نگه‌داری را اضافه کنید.

## انتخاب‌های طراحی برای الگوگیری

این ایده‌ها را الگو بگیرید:

- از Cursor: `Agent` به‌همراه `Run`، تقارن محلی و ابری، کشف مدل،
  آرتیفکت‌ها، و آشنایی اولیه مبتنی بر کتاب آشپزی.
- از Claude Agent SDK: کلاینت‌های دوطرفه، interrupt، مجوزها، hookها،
  ابزارهای سفارشی، ذخیره‌گاه‌های نشست، و معناشناسی resume.
- از OpenAI Agents: handoffها، guardrailها، resume تأیید انسانی، tracing، و
  اشیای نتیجه ساختاریافته جریان‌یافته.
- از Google ADK: سرویس‌های پشت runner، کنش‌های رویداد، حافظه، آرتیفکت‌ها،
  سرویس‌های اعتبارنامه، و رهگیری Plugin پیرامون چرخه عمر اجرا.
- از OpenCode: کلاینت پروتکل تولیدشده، REST به‌همراه SSE، نشست‌ها،
  فضاهای کاری، پرسش‌ها، مجوزها، فایل‌ها، VCS، PTY، MCP، عامل‌ها، و Skills.
- از Codex: sandbox صریح، تأیید، شبکه، اجرای محلی و راه‌دور، و
  مرزهای نخ سرور اپ.
- از ACP و acpx: تعامل‌پذیری مهار خارجی مبتنی بر adapter و صف‌های نام‌دار prompt.

## انتخاب‌های طراحی برای پرهیز

از این دام‌ها پرهیز کنید:

- SDK عمومی‌ای که فقط تخلیه‌ای نازک از جزئیات داخلی Gateway باشد.
- SDK عمومی‌ای که زیرمسیرهای SDK Plugin را import کند.
- SDK عمومی‌ای که در آن رویدادها فقط `stream` به‌همراه `data` باشند.
- API ابرمحوری که باعث شود OpenClaw محلی شبیه حالت میراثی به نظر برسد.
- انتخاب زمان اجرا که در پیشوندهای شناسه مدل پنهان شده باشد.
- ارسال مخفیانه secretها در نگاشت‌های محیط.
- گزینه‌های ویژه ACP در سطح بالای هر اجرا.
- پرچم‌های sandbox که زمان اجرای انتخاب‌شده نتواند اعمالشان کند.
- یک شیء SDK که بخواهد هم‌زمان Plugin ارائه‌دهنده، Plugin کانال، کلاینت اپ،
  و runner مدیریت‌شده باشد.

## پرسش‌های باز

- آیا بسته اولیه باید در این مخزن باشد یا در یک مخزن SDK جداگانه؟
- آیا کلاینت تولیدشده سطح پایین باید پیش از پایدارشدن wrapper سطح بالا
  به‌صورت عمومی منتشر شود؟
- نخستین سازوکار auth اپ پشتیبانی‌شده چیست: token محلی، token ادمین،
  جریان دستگاه OAuth، یا ثبت‌نام امضاشده اپ؟
- SDK به‌طور پیش‌فرض چه مقدار از تاریخچه پیام نشست را باید نمایش دهد؟
- آیا محیط‌های مدیریت‌شده باید فقط در پیکربندی Gateway تنظیم شوند، یا فراخوان‌های SDK هم می‌توانند
  مستقیماً با tokenهای محدود آن‌ها را درخواست کنند؟
- چه قواعد نگه‌داری‌ای برای آرتیفکت‌های تولیدشده توسط اجراهای محلی اعمال می‌شود؟
- کدام payloadهای رویداد پیش از تحویل به اپ نیازمند redaction هستند؟
- آیا `Run` باید نوبت‌های عادی چت و وظایف جداشده را پوشش دهد، یا کار پس‌زمینه جداشده
  همیشه باید یک wrapper به نام `Task` با یک `Run` تو در تو برگرداند؟

## مستندات مرتبط

- [حلقه عامل](/fa/concepts/agent-loop)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [نشست](/fa/concepts/session)
- [زیرعامل‌ها](/fa/tools/subagents)
- [وظایف پس‌زمینه](/fa/automation/tasks)
- [عامل‌های ACP](/fa/tools/acp-agents)
- [Pluginهای مهار عامل](/fa/plugins/sdk-agent-harness)
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
