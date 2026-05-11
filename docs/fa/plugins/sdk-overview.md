---
read_when:
    - باید بدانید از کدام زیرمسیر SDK باید وارد کنید
    - به مرجعی برای همهٔ متدهای ثبت در OpenClawPluginApi نیاز دارید
    - در حال جست‌وجوی یک خروجی مشخص از SDK هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ واردسازی، مرجع API ثبت، و معماری SDK
title: نمای کلی Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin قرارداد تایپ‌شده میان Pluginها و هسته است. این صفحه
مرجع **چیزهایی است که باید import کنید** و **چیزهایی است که می‌توانید ثبت کنید**.

<Note>
  این صفحه برای نویسندگان Plugin است که از `openclaw/plugin-sdk/*` داخل
  OpenClaw استفاده می‌کنند. برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها،
  کارهای CI و افزونه‌های IDE که می‌خواهند عامل‌ها را از طریق Gateway اجرا کنند،
  به‌جای آن از
  [OpenClaw App SDK](/fa/concepts/openclaw-sdk) و بسته `@openclaw/sdk`
  استفاده کنید.
</Note>

<Tip>
به‌دنبال راهنمای آموزشی هستید؟ از [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای ارائه‌دهنده از [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)، برای بک‌اندهای محلی CLI هوش مصنوعی از [Pluginهای بک‌اند CLI](/fa/plugins/cli-backend-plugins)، و برای Pluginهای ابزار یا هوک چرخه‌عمر از [هوک‌های Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک زیرمسیر مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر زیرمسیر یک ماژول کوچک و خودکفاست. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای ورود/ساخت ویژه کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترک مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. زیرمسیر `plugin-sdk/channel-config-schema`
برای primitiveهای شِمای مشترک و builder عمومی است. Pluginهای همراه OpenClaw
برای شِماهای حفظ‌شده کانال‌های همراه از `plugin-sdk/bundled-channel-config-schema`
استفاده می‌کنند. exportهای سازگاری منسوخ‌شده روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌یک از زیرمسیرهای شِمای همراه
الگویی برای Pluginهای جدید نیست.

<Warning>
  seamهای راحتی با برند ارائه‌دهنده یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای همراه زیرمسیرهای عمومی SDK را داخل barrelهای `api.ts` /
  `runtime-api.ts` خود ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان barrelهای محلی Plugin
  استفاده کنند یا وقتی نیاز واقعا میان‌کانالی است، یک قرارداد عمومی و محدود SDK اضافه کنند.

مجموعه کوچکی از seamهای helper مربوط به Pluginهای همراه هنوز وقتی استفاده مالکانه ردیابی‌شده دارند
در نقشه export تولیدشده ظاهر می‌شوند. این‌ها فقط برای نگهداری Pluginهای همراه وجود دارند
و مسیرهای import پیشنهادی برای Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ‌شده برای استفاده مالکانه ردیابی‌شده نگه داشته شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
زیرمسیرهای عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع زیرمسیرها

SDK Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود ارائه می‌شود که بر اساس حوزه گروه‌بندی شده‌اند (ورودی Plugin،
کانال، ارائه‌دهنده، احراز هویت، runtime، قابلیت، حافظه، و helperهای رزروشده
Pluginهای همراه). برای فهرست کامل، گروه‌بندی‌شده و دارای پیوند، به
[زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.

فهرست entrypointهای کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای بسته از
زیرمجموعه عمومی و پس از کم‌کردن زیرمسیرهای تست/داخلی محلی مخزن که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند تولید می‌شوند. برای
ممیزی تعداد exportهای عمومی، `pnpm plugin-sdk:surface` را اجرا کنید. زیرمسیرهای عمومی
منسوخ‌شده که به‌اندازه کافی قدیمی‌اند و توسط کد production افزونه‌های همراه استفاده نمی‌شوند
در `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ردیابی می‌شوند؛ barrelهای
باز-export منسوخ گسترده در
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` ردیابی می‌شوند.

## API ثبت

callback `register(api)` یک شیء `OpenClawPluginApi` با این
متدها دریافت می‌کند:

### ثبت قابلیت

| متد                                             | چیزی که ثبت می‌کند                         |
| ------------------------------------------------ | ------------------------------------------ |
| `api.registerProvider(...)`                      | استنتاج متنی (LLM)                         |
| `api.registerAgentHarness(...)`                  | مجری آزمایشی سطح‌پایین عامل                |
| `api.registerCliBackend(...)`                    | بک‌اند محلی استنتاج CLI                    |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                           |
| `api.registerSpeechProvider(...)`                | تبدیل متن به گفتار / سنتز STT              |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی realtime جریانی                    |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صدای realtime دوسویه              |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدیو                      |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                                |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                               |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدیو                                |
| `api.registerWebFetchProvider(...)`              | ارائه‌دهنده fetch / scrape وب              |
| `api.registerWebSearchProvider(...)`             | جستجوی وب                                  |

### ابزارها و دستورها

| متد                            | چیزی که ثبت می‌کند                                  |
| ------------------------------- | --------------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار عامل (الزامی یا `{ optional: true }`)          |
| `api.registerCommand(def)`      | دستور سفارشی (LLM را دور می‌زند)                    |

دستورهای Plugin وقتی عامل به یک راهنمای مسیریابی کوتاه و متعلق به دستور نیاز دارد
می‌توانند `agentPromptGuidance` تنظیم کنند. آن متن را درباره خود دستور نگه دارید؛
سیاست ویژه ارائه‌دهنده یا Plugin را به prompt builderهای هسته اضافه نکنید.

### زیرساخت

| متد                                           | چیزی که ثبت می‌کند                         |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | هوک رویداد                                 |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                         |
| `api.registerGatewayDiscoveryService(service)` | منتشرکننده کشف Gateway محلی                |
| `api.registerCli(registrar, opts?)`            | زیردستور CLI                               |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ویژگی Node زیر `openclaw nodes`        |
| `api.registerService(service)`                 | سرویس پس‌زمینه                             |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                             |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار در runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی نزدیک به حافظه          |
| `api.registerMemoryCorpusSupplement(adapter)`  | پیکره افزایشی جستجو/خواندن حافظه           |

### هوک‌های میزبان برای Pluginهای workflow

هوک‌های میزبان seamهای SDK برای Pluginهایی هستند که باید به‌جای فقط افزودن یک ارائه‌دهنده،
کانال یا ابزار، در چرخه‌عمر میزبان مشارکت کنند. این‌ها
قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای تأیید،
دروازه‌های سیاست workspace، پایشگرهای پس‌زمینه، جادوگرهای راه‌اندازی و Pluginهای همراه UI
نیز می‌توانند از آن‌ها استفاده کنند.

| متد                                                                                 | قراردادی که مالک آن است                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | وضعیت نشست متعلق به Plugin و سازگار با JSON که از طریق نشست‌های Gateway نمایش داده می‌شود                                         |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | زمینه پایدار و exactly-once که برای یک نشست به نوبت بعدی عامل تزریق می‌شود                                                        |
| `api.registerTrustedToolPolicy(...)`                                                 | سیاست ابزار پیش از Plugin همراه/مورداعتماد که می‌تواند پارامترهای ابزار را مسدود یا بازنویسی کند                                  |
| `api.registerToolMetadata(...)`                                                      | metadata نمایش کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                                          |
| `api.registerCommand(...)`                                                           | دستورهای محدود به Plugin؛ نتایج دستور می‌توانند `continueAgent: true` تنظیم کنند؛ دستورهای native Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.session.controls.registerControlUiDescriptor(...)`                              | descriptorهای مشارکت UI کنترلی برای سطح‌های نشست، ابزار، اجرا یا تنظیمات                                                          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | callbackهای پاک‌سازی برای منابع runtime متعلق به Plugin در مسیرهای reset/delete/reload                                             |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراک‌های رویداد پاک‌سازی‌شده برای وضعیت workflow و پایشگرها                                                                      |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | وضعیت موقت متعلق به Plugin برای هر اجرا که در چرخه‌عمر پایانی اجرا پاک می‌شود                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | metadata پاک‌سازی برای کارهای scheduler متعلق به Plugin؛ کاری را زمان‌بندی نمی‌کند یا رکورد task نمی‌سازد                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تحویل فایل پیوست با میانجی‌گری میزبان و فقط برای همراه‌ها به مسیر نشست direct-outbound فعال                                      |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | نوبت‌های نشست زمان‌بندی‌شده با پشتوانه Cron و فقط برای همراه‌ها، به‌همراه پاک‌سازی مبتنی بر tag                                  |
| `api.session.controls.registerSessionAction(...)`                                    | کنش‌های نشست تایپ‌شده که کلاینت‌ها می‌توانند از طریق Gateway dispatch کنند                                                        |

برای کد Plugin جدید از namespaceهای گروه‌بندی‌شده استفاده کنید:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

متدهای flat معادل همچنان به‌عنوان aliasهای سازگاری منسوخ‌شده
برای Pluginهای موجود در دسترس هستند. کد Plugin جدیدی اضافه نکنید که مستقیما
`api.registerSessionExtension`، `api.enqueueNextTurnInjection`،
`api.registerControlUiDescriptor`، `api.registerRuntimeLifecycle`،
`api.registerAgentEventSubscription`، `api.emitAgentEvent`،
`api.setRunContext`، `api.getRunContext`، `api.clearRunContext`،
`api.registerSessionSchedulerJob`، `api.registerSessionAction`،
`api.sendSessionAttachment`، `api.scheduleSessionTurn` یا
`api.unscheduleSessionTurnsByTag` را فراخوانی کند.

`scheduleSessionTurn(...)` یک میان‌بر با دامنهٔ نشست روی زمان‌بند Cron در Gateway است. Cron مالک زمان‌بندی است و هنگام اجرای turn، رکورد task پس‌زمینه را ایجاد می‌کند؛ Plugin SDK فقط نشست مقصد، نام‌گذاری تحت مالکیت plugin، و پاک‌سازی را محدود می‌کند. وقتی خود کار به وضعیت پایدار Task Flow چندمرحله‌ای نیاز دارد، داخل turn زمان‌بندی‌شده از `api.runtime.tasks.managedFlows` استفاده کنید.

قراردادها عمداً اختیار را تفکیک می‌کنند:

- pluginهای خارجی می‌توانند مالک افزونه‌های نشست، توصیفگرهای UI، فرمان‌ها، فرادادهٔ ابزار، تزریق‌های turn بعدی، و hookهای عادی باشند.
- سیاست‌های ابزارِ مورد اعتماد پیش از hookهای عادی `before_tool_call` اجرا می‌شوند و فقط bundled هستند، چون در سیاست ایمنی میزبان مشارکت دارند.
- مالکیت فرمان‌های رزروشده فقط bundled است. pluginهای خارجی باید از نام‌ها یا aliasهای فرمان خودشان استفاده کنند.
- `allowPromptInjection=false` hookهای تغییردهندهٔ prompt را غیرفعال می‌کند، از جمله `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`، فیلدهای prompt از `before_agent_start` قدیمی، و `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کنندگان غیرِ Plan:

| کهن‌الگوی Plugin             | hookهای استفاده‌شده                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| گردش کار تأیید            | افزونهٔ نشست، ادامهٔ فرمان، تزریق turn بعدی، توصیفگر UI                                                            |
| gate سیاست بودجه/فضای کاری | سیاست ابزار مورد اعتماد، فرادادهٔ ابزار، projection نشست                                                                                 |
| پایشگر چرخهٔ عمر پس‌زمینه | پاک‌سازی چرخهٔ عمر runtime، اشتراک رویداد agent، مالکیت/پاک‌سازی زمان‌بند نشست، مشارکت prompt مربوط به Heartbeat، توصیفگر UI |
| ویزارد راه‌اندازی یا onboarding   | افزونهٔ نشست، فرمان‌های scoped، توصیفگر Control UI                                                                              |

<Note>
  فضاهای نام مدیریتی core رزروشده (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` می‌مانند، حتی اگر یک plugin تلاش کند یک
  محدودهٔ متد Gateway محدودتر اختصاص دهد. برای متدهای تحت مالکیت plugin،
  پیشوندهای ویژهٔ همان plugin را ترجیح دهید.
</Note>

<Accordion title="چه زمانی از middleware نتیجهٔ ابزار استفاده کنید">
  pluginهای bundled می‌توانند وقتی نیاز دارند نتیجهٔ یک ابزار را پس از اجرا و پیش از آنکه runtime آن نتیجه را دوباره به مدل بدهد بازنویسی کنند، از `api.registerAgentToolResultMiddleware(...)` استفاده کنند. این seam مورد اعتماد و مستقل از runtime برای reducerهای خروجی async مانند tokenjuice است.

pluginهای bundled باید برای هر runtime هدف، `contracts.agentToolResultMiddleware` را اعلام کنند، برای نمونه `["pi", "codex"]`. pluginهای خارجی نمی‌توانند این middleware را ثبت کنند؛ برای کاری که به زمان‌بندی نتیجهٔ ابزار پیش از مدل نیاز ندارد، hookهای عادی plugin در OpenClaw را نگه دارید. مسیر قدیمی ثبت factory افزونهٔ embedded مختص Pi حذف شده است.
</Accordion>

### ثبت discovery در Gateway

`api.registerGatewayDiscoveryService(...)` به یک plugin اجازه می‌دهد Gateway فعال را روی یک انتقال discovery محلی مانند mDNS/Bonjour تبلیغ کند. OpenClaw هنگام راه‌اندازی Gateway، وقتی discovery محلی فعال باشد، service را فراخوانی می‌کند، پورت‌های فعلی Gateway و داده‌های راهنمای TXT غیرمحرمانه را پاس می‌دهد، و هنگام خاموشی Gateway handler برگشتی `stop` را فراخوانی می‌کند.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

pluginهای discovery مربوط به Gateway نباید مقادیر TXT تبلیغ‌شده را secret یا authentication در نظر بگیرند. Discovery فقط یک راهنمای routing است؛ auth مربوط به Gateway و TLS pinning همچنان مالک trust هستند.

### فرادادهٔ ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فرادادهٔ فرمان را می‌پذیرد:

- `commands`: نام‌های صریح فرمان که در مالکیت registrar هستند
- `descriptors`: توصیفگرهای فرمان در زمان parse که برای help در CLI،
  routing، و ثبت lazy CLI برای plugin استفاده می‌شوند
- `parentPath`: مسیر اختیاری فرمان والد برای گروه‌های فرمان تو‌در‌تو، مانند
  `["nodes"]`

برای قابلیت‌های paired-node، `api.registerNodeCliFeature(registrar, opts?)` را ترجیح دهید. این یک wrapper کوچک پیرامون `api.registerCli(..., { parentPath: ["nodes"] })` است و فرمان‌هایی مانند `openclaw nodes canvas` را به‌عنوان قابلیت‌های node تحت مالکیت plugin صریح می‌کند.

اگر می‌خواهید یک فرمان plugin در مسیر عادی root CLI به‌صورت lazy-loaded باقی بماند، `descriptors`هایی ارائه کنید که همهٔ ریشه‌های فرمان top-level را که آن registrar آشکار می‌کند پوشش دهند.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

فرمان‌های تو‌در‌تو فرمان والد resolve‌شده را به‌عنوان `program` دریافت می‌کنند:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

فقط وقتی از `commands` به‌تنهایی استفاده کنید که به ثبت lazy ریشهٔ CLI نیاز ندارید. آن مسیر سازگاری eager همچنان پشتیبانی می‌شود، اما placeholderهای پشتیبانی‌شده با descriptor را برای lazy loading در زمان parse نصب نمی‌کند.

### ثبت backend در CLI

`api.registerCliBackend(...)` به یک plugin اجازه می‌دهد مالک config پیش‌فرض برای یک backend محلی AI CLI مانند `codex-cli` باشد.

- `id` مربوط به backend به پیشوند provider در model refهایی مانند `codex-cli/gpt-5` تبدیل می‌شود.
- `config` مربوط به backend همان شکل `agents.defaults.cliBackends.<id>` را به‌کار می‌برد.
- config کاربر همچنان برنده است. OpenClaw پیش از اجرای CLI، `agents.defaults.cliBackends.<id>` را روی پیش‌فرض plugin merge می‌کند.
- وقتی یک backend پس از merge به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای مثال normalize کردن شکل‌های قدیمی flag).
- برای بازنویسی‌های argv با دامنهٔ request که به dialect مربوط به CLI تعلق دارند، از `resolveExecutionArgs` استفاده کنید، مانند نگاشت سطح‌های thinking در OpenClaw به یک flag effort بومی.

برای راهنمای end-to-end نویسندگی، ببینید
[pluginهای backend در CLI](/fa/plugins/cli-backend-plugins).

### slotهای انحصاری

| متد                                     | چه چیزی را ثبت می‌کند                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | موتور context (هر بار یکی فعال است). callback مربوط به `assemble()` مقدارهای `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزوده‌های prompt را متناسب کند. |
| `api.registerMemoryCapability(capability)` | قابلیت unified memory                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | سازندهٔ بخش prompt مربوط به memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | resolver طرح flush مربوط به memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | adapter مربوط به runtime حافظه                                                                                                                                    |

### adapterهای embedding حافظه

| متد                                         | چه چیزی را ثبت می‌کند                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding حافظه برای plugin فعال |

- `registerMemoryCapability` API ترجیحی و انحصاری memory-plugin است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)` را آشکار کند
  تا pluginهای همراه بتوانند artifactهای exportشدهٔ memory را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، نه اینکه به layout خصوصی یک
  plugin خاص memory دسترسی مستقیم داشته باشند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan`، و
  `registerMemoryRuntime` APIهای انحصاری memory-plugin سازگار با legacy هستند.
- `MemoryFlushPlan.model` می‌تواند flush turn را به یک reference دقیق `provider/model`
  مانند `ollama/qwen3:8b` pin کند، بدون اینکه زنجیرهٔ fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` به plugin فعال memory اجازه می‌دهد یک
  یا چند id adapter embedding ثبت کند (برای مثال `openai`، `gemini`، یا یک id سفارشی
  تعریف‌شده توسط plugin).
- config کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` در برابر همان idهای adapter ثبت‌شده resolve می‌شود.

### رویدادها و چرخهٔ عمر

| متد                                       | چه کاری انجام می‌دهد                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook چرخهٔ عمر typed          |
| `api.onConversationBindingResolved(handler)` | callback مربوط به binding مکالمه |

برای نمونه‌ها، نام‌های رایج hook، و semantics مربوط به guard، ببینید [hookهای Plugin](/fa/plugins/hooks).

### semantics تصمیم hook

- `before_tool_call`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود (مانند حذف `block`)، نه به‌عنوان override.
- `before_install`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود (مانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler ادعای dispatch کند، handlerهای با اولویت پایین‌تر و مسیر dispatch پیش‌فرض مدل رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم تلقی می‌شود (مانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به routing ورودی thread/topic نیاز دارید، از فیلد typed `threadId` استفاده کنید. `metadata` را برای اضافات ویژهٔ channel نگه دارید.
- `message_sending`: پیش از fallback به `metadata` ویژهٔ channel، از فیلدهای routing typed یعنی `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: به‌جای تکیه بر hookهای داخلی `gateway:startup`، برای وضعیت راه‌اندازی تحت مالکیت gateway از `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخهٔ عمر cron تحت مالکیت gateway را observe کنید. هنگام sync کردن wake schedulerهای خارجی، از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را به‌عنوان منبع حقیقت برای due checkها و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | شناسه Plugin                                                                                |
| `api.name`               | `string`                  | نام نمایشی                                                                                  |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                       |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                      |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                            |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                            |
| `api.config`             | `OpenClawConfig`          | اسنپ‌شات پیکربندی فعلی (اسنپ‌شات فعال زمان اجرای درون‌حافظه‌ای، در صورت موجود بودن)       |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [کمک‌کننده‌های زمان اجرا](/fa/plugins/sdk-runtime)                                             |
| `api.logger`             | `PluginLogger`            | لاگر محدوده‌دار (`debug`، `info`، `warn`، `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/تنظیم پیش از ورودی کامل است    |
| `api.resolvePath(input)` | `(string) => string`      | حل مسیر نسبت به ریشه Plugin                                                                 |

## قرارداد ماژول داخلی

درون Plugin خود، برای importهای داخلی از فایل‌های barrel محلی استفاده کنید:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  هرگز Plugin خودتان را از کد تولیدی از طریق `openclaw/plugin-sdk/<your-plugin>`
  import نکنید. importهای داخلی را از مسیر `./api.ts` یا
  `./runtime-api.ts` عبور دهید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطح‌های عمومی Plugin بسته‌بندی‌شده داخلی که از طریق facade بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts`، و فایل‌های ورودی عمومی مشابه)، وقتی OpenClaw از قبل در حال اجرا است،
اسنپ‌شات پیکربندی زمان اجرای فعال را ترجیح می‌دهند. اگر هنوز اسنپ‌شات زمان اجرا وجود نداشته باشد،
به فایل پیکربندی حل‌شده روی دیسک fallback می‌کنند.
facadeهای Plugin بسته‌بندی‌شده داخلی باید از طریق loaderهای facade Plugin در OpenClaw بارگذاری شوند؛
import مستقیم از `dist/extensions/...` بررسی‌های manifest و sidecar زمان اجرا را که نصب‌های بسته‌بندی‌شده
برای کد متعلق به Plugin استفاده می‌کنند دور می‌زند.

Pluginهای provider می‌توانند یک barrel قرارداد باریک و محلی برای Plugin ارائه کنند، وقتی یک
کمک‌کننده عمدا مخصوص provider است و هنوز به یک زیرمسیر عمومی SDK تعلق ندارد. نمونه‌های داخلی:

- **Anthropic**: seam عمومی `api.ts` / `contract-api.ts` برای کمک‌کننده‌های استریم
  beta-header کلود و `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های provider،
  کمک‌کننده‌های مدل پیش‌فرض، و سازنده‌های provider بلادرنگ را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده provider
  به‌علاوه کمک‌کننده‌های onboarding/پیکربندی را export می‌کند.

<Warning>
  کد تولیدی افزونه نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک کمک‌کننده واقعا مشترک است، آن را به یک زیرمسیر خنثای SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا سطح دیگری
  با محوریت capability ارتقا دهید، به‌جای اینکه دو Plugin را به هم وابسته کنید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل namespace مربوط به `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، manifestها، و schemaهای پیکربندی.
  </Card>
  <Card title="Testing" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای تست و قواعد lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطح‌های منسوخ‌شده.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل capability.
  </Card>
</CardGroup>
