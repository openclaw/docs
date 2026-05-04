---
read_when:
    - باید بدانید از کدام زیرمسیر SDK واردسازی کنید
    - به مرجعی برای همهٔ روش‌های ثبت در OpenClawPluginApi نیاز دارید
    - در حال جست‌وجوی یک خروجی مشخص از SDK هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ واردسازی، مرجع API ثبت، و معماری SDK
title: نمای کلی SDK Plugin
x-i18n:
    generated_at: "2026-05-04T18:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK قرارداد تایپ‌شده بین Pluginها و هسته است. این صفحه مرجع **آنچه باید import کنید** و **آنچه می‌توانید ثبت کنید** است.

<Note>
  این صفحه برای نویسندگان Plugin است که از `openclaw/plugin-sdk/*` داخل
  OpenClaw استفاده می‌کنند. برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
  که می‌خواهند agentها را از طریق Gateway اجرا کنند، به‌جای آن از
  [OpenClaw App SDK](/fa/concepts/openclaw-sdk) و بسته `@openclaw/sdk`
  استفاده کنید.
</Note>

<Tip>
به‌جای آن دنبال یک راهنمای چگونگی انجام کار هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Channel plugins](/fa/plugins/sdk-channel-plugins)، برای Pluginهای provider از [Provider plugins](/fa/plugins/sdk-provider-plugins)، و برای Pluginهای hook ابزار یا چرخه عمر از [Plugin hooks](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک زیرمسیر مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر زیرمسیر یک ماژول کوچک و مستقل است. این کار شروع‌به‌کار را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای entry/build ویژه کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترکی مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. زیرمسیر `plugin-sdk/channel-config-schema`
برای primitiveهای schema مشترک و builder عمومی است. Pluginهای همراه OpenClaw
برای schemaهای حفظ‌شده کانال‌های همراه از `plugin-sdk/bundled-channel-config-schema` استفاده می‌کنند.
exportهای سازگاری منسوخ روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌کدام از زیرمسیرهای schema همراه الگویی
برای Pluginهای جدید نیستند.

<Warning>
  seamهای راحتی با نام provider یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`،‏ `.../discord`،‏ `.../signal`،‏ `.../whatsapp`).
  Pluginهای همراه زیرمسیرهای عمومی SDK را داخل barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان barrelهای محلی Plugin
  استفاده کنند یا وقتی نیاز واقعا میان‌کانالی است، یک قرارداد عمومی SDK باریک اضافه کنند.

مجموعه کوچکی از seamهای helper مربوط به Pluginهای همراه، وقتی استفاده مالک پیگیری‌شده دارند،
همچنان در نقشه export تولیدشده ظاهر می‌شوند. آن‌ها فقط برای نگهداری Pluginهای همراه وجود دارند
و مسیرهای import پیشنهادی برای Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ برای استفاده مالک پیگیری‌شده نگه داشته شده‌اند. این مسیرهای import را
در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
زیرمسیرهای عمومی channel SDK استفاده کنید.
</Warning>

## مرجع زیرمسیرها

Plugin SDK به‌صورت مجموعه‌ای از زیرمسیرهای باریک ارائه می‌شود که بر اساس حوزه گروه‌بندی شده‌اند (entry
Plugin، کانال، provider، auth، runtime، قابلیت، memory، و helperهای رزروشده
Pluginهای همراه). برای فهرست کامل، گروه‌بندی‌شده و لینک‌شده، ببینید
[زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths).

فهرست تولیدشده بیش از 200 زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

## API ثبت

callback `register(api)` یک شیء `OpenClawPluginApi` با این
متدها دریافت می‌کند:

### ثبت قابلیت

| متد                                             | آنچه ثبت می‌کند                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متن (LLM)                     |
| `api.registerAgentHarness(...)`                  | اجراکننده agent سطح پایین آزمایشی      |
| `api.registerCliBackend(...)`                    | backend استنتاج CLI محلی              |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                      |
| `api.registerSpeechProvider(...)`                | تبدیل متن به گفتار / سنتز STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی realtime جریانی                |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صدای realtime دوسویه          |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدئو                 |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                           |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                          |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدئو                           |
| `api.registerWebFetchProvider(...)`              | provider دریافت / scrape وب           |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                           |

### ابزارها و فرمان‌ها

| متد                            | آنچه ثبت می‌کند                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار agent (الزامی یا `{ optional: true }`)   |
| `api.registerCommand(def)`      | فرمان سفارشی (LLM را دور می‌زند)               |

فرمان‌های Plugin می‌توانند زمانی که agent به یک راهنمای کوتاه routing متعلق به فرمان نیاز دارد،
`agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود فرمان نگه دارید؛
policy ویژه provider یا Plugin را به سازنده‌های prompt هسته اضافه نکنید.

### زیرساخت

| متد                                           | آنچه ثبت می‌کند                          |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook رویداد                             |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway                |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | آگهی‌دهنده کشف Gateway محلی             |
| `api.registerCli(registrar, opts?)`            | زیرفرمان CLI                            |
| `api.registerService(service)`                 | سرویس پس‌زمینه                          |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                          |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی مجاور memory         |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزایشی جست‌وجو/خواندن memory    |

### hookهای میزبان برای Pluginهای workflow

hookهای میزبان seamهای SDK برای Pluginهایی هستند که باید در چرخه عمر میزبان مشارکت کنند،
نه اینکه فقط یک provider، کانال، یا ابزار اضافه کنند. آن‌ها
قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای approval،
دروازه‌های policy workspace، مانیتورهای پس‌زمینه، wizardهای setup، و Pluginهای همراه UI
نیز می‌توانند.

| متد                                                                      | قراردادی که مالک آن است                                                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | وضعیت session متعلق به Plugin و سازگار با JSON که از طریق sessionهای Gateway بازنمایی می‌شود                                      |
| `api.enqueueNextTurnInjection(...)`                                      | context پایدار دقیقا-یک‌بار که برای یک session در turn بعدی agent تزریق می‌شود                                                     |
| `api.registerTrustedToolPolicy(...)`                                     | policy ابزار پیش از Plugin همراه/قابل‌اعتماد که می‌تواند params ابزار را مسدود یا بازنویسی کند                                    |
| `api.registerToolMetadata(...)`                                          | metadata نمایشی کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                                         |
| `api.registerCommand(...)`                                               | فرمان‌های scoped متعلق به Plugin؛ نتایج فرمان می‌توانند `continueAgent: true` تنظیم کنند؛ فرمان‌های native در Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.registerControlUiDescriptor(...)`                                   | descriptorهای مشارکت Control UI برای سطح‌های session، ابزار، run، یا settings                                                     |
| `api.registerRuntimeLifecycle(...)`                                      | callbackهای پاک‌سازی برای منابع runtime متعلق به Plugin در مسیرهای reset/delete/reload                                            |
| `api.registerAgentEventSubscription(...)`                                | subscriptionهای رویداد sanitized برای وضعیت workflow و مانیتورها                                                                  |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | وضعیت scratch متعلق به Plugin برای هر run که در چرخه عمر پایانی run پاک می‌شود                                                     |
| `api.registerSessionSchedulerJob(...)`                                   | رکوردهای job زمان‌بند session متعلق به Plugin با پاک‌سازی deterministic                                                           |

این قراردادها عمدا اختیار را تفکیک می‌کنند:

- Pluginهای خارجی می‌توانند مالک session extensionها، descriptorهای UI، فرمان‌ها، metadata ابزار،
  تزریق‌های turn بعدی، و hookهای عادی باشند.
- policyهای ابزار قابل‌اعتماد پیش از hookهای معمولی `before_tool_call` اجرا می‌شوند و
  فقط همراه هستند، چون در policy ایمنی میزبان مشارکت دارند.
- مالکیت فرمان رزروشده فقط همراه است. Pluginهای خارجی باید از
  نام‌ها یا aliasهای فرمان خودشان استفاده کنند.
- `allowPromptInjection=false`، hookهای تغییردهنده prompt از جمله
  `agent_turn_prepare`،‏ `before_prompt_build`،‏ `heartbeat_prompt_contribution`،
  فیلدهای prompt از `before_agent_start` قدیمی، و
  `enqueueNextTurnInjection` را غیرفعال می‌کند.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| الگوی Plugin                 | hookهای استفاده‌شده                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow approval            | session extension، ادامه فرمان، تزریق turn بعدی، descriptor UI                                                                        |
| دروازه policy بودجه/workspace | policy ابزار قابل‌اعتماد، metadata ابزار، projection session                                                                          |
| مانیتور چرخه عمر پس‌زمینه     | پاک‌سازی چرخه عمر runtime، subscription رویداد agent، مالکیت/پاک‌سازی scheduler session، مشارکت prompt heartbeat، descriptor UI      |
| wizard setup یا onboarding    | session extension، فرمان‌های scoped، descriptor در Control UI                                                                         |

<Note>
  namespaceهای ادمین هسته رزروشده (`config.*`،‏ `exec.approvals.*`،‏ `wizard.*`،
  `update.*`) همیشه `operator.admin` می‌مانند، حتی اگر یک Plugin تلاش کند
  scope متد gateway باریک‌تری اختصاص دهد. برای متدهای متعلق به Plugin،
  prefixهای ویژه Plugin را ترجیح دهید.
</Note>

<Accordion title="چه زمانی از middleware نتیجه ابزار استفاده کنید">
  Pluginهای همراه می‌توانند وقتی لازم است نتیجه ابزار را بعد از اجرا و پیش از اینکه runtime
  آن نتیجه را به مدل برگرداند بازنویسی کنند، از `api.registerAgentToolResultMiddleware(...)` استفاده کنند.
  این seam قابل‌اعتماد و مستقل از runtime برای reducerهای خروجی async مانند tokenjuice است.

Pluginهای همراه باید برای هر runtime هدف،
`contracts.agentToolResultMiddleware` را declare کنند، برای مثال `["pi", "codex"]`. Pluginهای خارجی
نمی‌توانند این middleware را ثبت کنند؛ برای کاری که به زمان‌بندی نتیجه ابزار پیش از مدل نیاز ندارد،
hookهای عادی Plugin در OpenClaw را نگه دارید. مسیر ثبت factory افزونه embedشده قدیمی فقط برای Pi
حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را روی یک انتقال کشف محلی مانند mDNS/Bonjour اعلام کند. OpenClaw هنگام راه‌اندازی Gateway و وقتی کشف محلی فعال باشد، این سرویس را فراخوانی می‌کند، پورت‌های Gateway فعلی و داده‌های راهنمای TXT غیرمحرمانه را پاس می‌دهد، و هنگام خاموش‌شدن Gateway هندلر `stop` برگردانده‌شده را فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT اعلام‌شده را به‌عنوان اسرار یا احراز هویت در نظر بگیرند. کشف فقط یک راهنمای مسیریابی است؛ اعتماد همچنان بر عهده احراز هویت Gateway و pinning مربوط به TLS است.

### فراداده ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فراداده سطح بالا را می‌پذیرد:

- `commands`: ریشه‌های فرمان صریح که در مالکیت ثبت‌کننده هستند
- `descriptors`: توصیفگرهای فرمان در زمان parse که برای راهنمای CLI ریشه،
  مسیریابی، و ثبت CLI تنبل Plugin استفاده می‌شوند

اگر می‌خواهید یک فرمان Plugin در مسیر عادی CLI ریشه به‌صورت تنبل بارگذاری شود، `descriptors`ای ارائه کنید که هر ریشه فرمان سطح بالایی را که آن ثبت‌کننده در معرض استفاده قرار می‌دهد پوشش دهد.

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

فقط زمانی `commands` را به‌تنهایی استفاده کنید که به ثبت تنبل CLI ریشه نیاز ندارید. آن مسیر سازگاری eager همچنان پشتیبانی می‌شود، اما placeholderهای مبتنی بر توصیفگر را برای بارگذاری تنبل در زمان parse نصب نمی‌کند.

### ثبت backend CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد پیکربندی پیش‌فرض یک backend محلی CLI هوش مصنوعی مانند `codex-cli` را مالک شود.

- `id` مربوط به backend در ارجاع‌های مدل مانند `codex-cli/gpt-5` به پیشوند provider تبدیل می‌شود.
- `config` مربوط به backend همان شکل `agents.defaults.cliBackends.<id>` را استفاده می‌کند.
- پیکربندی کاربر همچنان برنده است. OpenClaw پیش از اجرای CLI، `agents.defaults.cliBackends.<id>` را روی پیش‌فرض Plugin merge می‌کند.
- وقتی یک backend پس از merge به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای مثال عادی‌سازی شکل‌های قدیمی flag).
- برای بازنویسی‌های argv در محدوده درخواست که به dialect مربوط به CLI تعلق دارند، از `resolveExecutionArgs` استفاده کنید؛ مانند نگاشت سطوح تفکر OpenClaw به یک flag بومی effort.

### اسلات‌های انحصاری

| متد                                       | آنچه ثبت می‌کند                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)` | موتور زمینه (هر بار فقط یکی فعال است). callback مربوط به `assemble()` مقدارهای `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزوده‌های prompt را تنظیم کند. |
| `api.registerMemoryCapability(capability)` | قابلیت حافظه یکپارچه                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش prompt حافظه                                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`  | resolver برنامه flush حافظه                                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`     | adapter runtime حافظه                                                                                                                                             |

### adapterهای embedding حافظه

| متد                                           | آنچه ثبت می‌کند                                  |
| -------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding حافظه برای Plugin فعال         |

- `registerMemoryCapability` API ترجیحی انحصاری Plugin حافظه است.
- `registerMemoryCapability` همچنین ممکن است `publicArtifacts.listArtifacts(...)` را در معرض استفاده قرار دهد
  تا Pluginهای همراه بتوانند artifactهای حافظه صادرشده را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، به‌جای اینکه وارد چیدمان خصوصی یک Plugin حافظه مشخص شوند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan`، و
  `registerMemoryRuntime` APIهای انحصاری سازگار با legacy برای Plugin حافظه هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت flush را بدون به‌ارث‌بردن زنجیره fallback فعال، به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` pin کند.
- `registerMemoryEmbeddingProvider` به Plugin حافظه فعال اجازه می‌دهد یک یا چند شناسه adapter embedding ثبت کند
  (برای مثال `openai`، `gemini`، یا یک شناسه سفارشی تعریف‌شده توسط Plugin).
- پیکربندی کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` در برابر همان شناسه‌های adapter ثبت‌شده resolve می‌شود.

### رویدادها و چرخه عمر

| متد                                         | کاری که انجام می‌دهد              |
| ------------------------------------------ | --------------------------------- |
| `api.on(hookName, handler, opts?)`         | hook چرخه عمر تایپ‌شده            |
| `api.onConversationBindingResolved(handler)` | callback مربوط به binding مکالمه |

برای نمونه‌ها، نام‌های رایج hook، و معناشناسی guard به [hookهای Plugin](/fa/plugins/hooks) مراجعه کنید.

### معناشناسی تصمیم hook

- `before_tool_call`: برگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: برگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: برگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: برگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: برگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler مسئولیت dispatch را claim کند، handlerهای با اولویت پایین‌تر و مسیر dispatch پیش‌فرض مدل رد می‌شوند.
- `message_sending`: برگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: برگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، از فیلد تایپ‌شده `threadId` استفاده کنید. `metadata` را برای جزئیات اضافه مختص کانال نگه دارید.
- `message_sending`: پیش از fallback به `metadata` مختص کانال، از فیلدهای مسیریابی تایپ‌شده `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: به‌جای تکیه بر hookهای داخلی `gateway:startup`، برای وضعیت راه‌اندازی متعلق به Gateway از `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخه عمر Cron متعلق به Gateway را مشاهده کنید. هنگام همگام‌سازی زمان‌بندهای بیدارسازی خارجی از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را به‌عنوان منبع حقیقت برای بررسی‌های موعد و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | شناسه Plugin                                                                                 |
| `api.name`               | `string`                  | نام نمایشی                                                                                  |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                        |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                       |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                             |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                              |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (snapshot runtime فعال در حافظه، وقتی در دسترس باشد)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مختص Plugin از `plugins.entries.<id>.config`                                        |
| `api.runtime`            | `PluginRuntime`           | [helperهای runtime](/fa/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger محدوده‌بندی‌شده (`debug`، `info`، `warn`، `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/setup پیش از full-entry است       |
| `api.resolvePath(input)` | `(string) => string`      | resolve مسیر نسبت به ریشه Plugin                                                             |

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
  هرگز از کد production، Plugin خودتان را از طریق `openclaw/plugin-sdk/<your-plugin>`
  import نکنید. importهای داخلی را از مسیر `./api.ts` یا
  `./runtime-api.ts` عبور دهید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطح‌های عمومی Pluginهای bundled که از طریق facade بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts`، و فایل‌های ورودی عمومی مشابه)، وقتی OpenClaw از قبل در حال اجرا باشد، snapshot پیکربندی runtime فعال را ترجیح می‌دهند. اگر هنوز snapshot runtime وجود نداشته باشد، به فایل پیکربندی resolveشده روی دیسک fallback می‌کنند. facadeهای Pluginهای bundled بسته‌بندی‌شده باید از طریق loaderهای facade Plugin در OpenClaw بارگذاری شوند؛ import مستقیم از `dist/extensions/...` بررسی‌های manifest و sidecar runtime را که نصب‌های بسته‌بندی‌شده برای کد متعلق به Plugin استفاده می‌کنند دور می‌زند.

Pluginهای provider می‌توانند یک barrel قرارداد باریک و محلیِ Plugin را در معرض استفاده قرار دهند، وقتی یک helper عمداً مختص provider است و هنوز به یک زیرمسیر generic در SDK تعلق ندارد. نمونه‌های bundled:

- **Anthropic**: seam عمومی `api.ts` / `contract-api.ts` برای helperهای stream مربوط به beta-header و `service_tier` در Claude.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های provider،
  helperهای default-model، و سازنده‌های provider realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده provider
  به‌علاوه helperهای onboarding/config را export می‌کند.

<Warning>
  کد production مربوط به Extension نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک helper واقعاً مشترک است، به‌جای coupling دو Plugin به یکدیگر، آن را به یک زیرمسیر خنثی SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا سطح دیگری با محوریت قابلیت ارتقا دهید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقاط ورود" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="کمک‌کننده‌های زمان اجرا" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل فضای نام `api.runtime`.
  </Card>
  <Card title="راه‌اندازی و پیکربندی" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، مانیفست‌ها، و اسکیماهای پیکربندی.
  </Card>
  <Card title="آزمون" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای آزمون و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطح‌های منسوخ.
  </Card>
  <Card title="درونیات Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری تفصیلی و مدل قابلیت‌ها.
  </Card>
</CardGroup>
