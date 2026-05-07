---
read_when:
    - باید بدانید از کدام زیرمسیر SDK واردسازی کنید
    - شما یک مرجع برای همهٔ روش‌های ثبت در OpenClawPluginApi می‌خواهید
    - شما در حال جست‌وجوی یک خروجی مشخص از کیت توسعه نرم‌افزار هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ واردسازی، مرجع API ثبت و معماری SDK
title: نمای کلی SDK Plugin
x-i18n:
    generated_at: "2026-05-07T13:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK مربوط به Plugin، قرارداد نوع‌دهی‌شده بین Pluginها و هسته است. این صفحه
مرجع **چیزی که باید import کنید** و **چیزی که می‌توانید ثبت کنید** است.

<Note>
  این صفحه برای نویسندگان Plugin است که از `openclaw/plugin-sdk/*` درون
  OpenClaw استفاده می‌کنند. برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها،
  کارهای CI و افزونه‌های IDE که می‌خواهند agentها را از طریق Gateway اجرا کنند،
  به‌جای آن از [SDK برنامه OpenClaw](/fa/concepts/openclaw-sdk) و بسته
  `@openclaw/sdk` استفاده کنید.
</Note>

<Tip>
به‌جای آن دنبال راهنمای چگونگی انجام کار هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای provider از [Pluginهای provider](/fa/plugins/sdk-provider-plugins)، برای backendهای CLI هوش مصنوعی محلی از [Pluginهای backend CLI](/fa/plugins/cli-backend-plugins)، و برای Pluginهای hook ابزار یا چرخهٔ عمر از [hookهای Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک subpath مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر subpath یک ماژول کوچک و خودبسنده است. این کار startup را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای entry/build مخصوص
کانال، `openclaw/plugin-sdk/channel-core` را ترجیح دهید؛
`openclaw/plugin-sdk/core` را برای سطح چتری گسترده‌تر و helperهای مشترک مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. subpath
`plugin-sdk/channel-config-schema` برای primitiveهای schema مشترک و builder
عمومی است. Pluginهای همراه OpenClaw برای schemaهای حفظ‌شدهٔ کانال‌های همراه
از `plugin-sdk/bundled-channel-config-schema` استفاده می‌کنند. exportهای
سازگاری منسوخ‌شده همچنان روی `plugin-sdk/channel-config-schema-legacy` باقی
می‌مانند؛ هیچ‌کدام از subpathهای schema همراه، الگویی برای Pluginهای جدید
نیستند.

<Warning>
  seamهای راحتی دارای برند provider یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای همراه، subpathهای عمومی SDK را درون barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان
  barrelهای محلیِ Plugin استفاده کنند یا وقتی نیاز واقعاً میان‌کانالی است، یک
  قرارداد عمومی و محدود SDK اضافه کنند.

مجموعهٔ کوچکی از seamهای helper مربوط به Pluginهای همراه، وقتی کاربرد مالکانهٔ
ردیابی‌شده داشته باشند، هنوز در export map تولیدشده دیده می‌شوند. این‌ها فقط
برای نگه‌داری Pluginهای همراه وجود دارند و مسیرهای import پیشنهادی برای
Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ‌شده برای کاربرد مالکانهٔ ردیابی‌شده نگه داشته
شده‌اند. این مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از
helperهای runtime تزریق‌شده و subpathهای عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع subpath

SDK مربوط به Plugin به‌صورت مجموعه‌ای از subpathهای محدود ارائه می‌شود که بر
اساس حوزه گروه‌بندی شده‌اند (entry مربوط به Plugin، کانال، provider، احراز
هویت، runtime، capability، memory، و helperهای رزروشدهٔ Pluginهای همراه). برای
کاتالوگ کامل، همراه با گروه‌بندی و لینک‌ها، [subpathهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths)
را ببینید.

فهرست تولیدشدهٔ بیش از ۲۰۰ subpath در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

## API ثبت

callback مربوط به `register(api)` یک شیء `OpenClawPluginApi` با این متدها دریافت می‌کند:

### ثبت قابلیت

| روش                                             | آنچه ثبت می‌کند                  |
| ----------------------------------------------- | -------------------------------- |
| `api.registerProvider(...)`                     | استنتاج متن (LLM)                |
| `api.registerAgentHarness(...)`                 | اجراکننده آزمایشی سطح پایین عامل |
| `api.registerCliBackend(...)`                   | بک‌اند استنتاج CLI محلی          |
| `api.registerChannel(...)`                      | کانال پیام‌رسانی                 |
| `api.registerSpeechProvider(...)`               | تبدیل متن به گفتار / سنتز STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی بی‌درنگ جریانی           |
| `api.registerRealtimeVoiceProvider(...)`        | نشست‌های صوتی بی‌درنگ دوطرفه     |
| `api.registerMediaUnderstandingProvider(...)`   | تحلیل تصویر/صدا/ویدیو            |
| `api.registerImageGenerationProvider(...)`      | تولید تصویر                      |
| `api.registerMusicGenerationProvider(...)`      | تولید موسیقی                     |
| `api.registerVideoGenerationProvider(...)`      | تولید ویدیو                      |
| `api.registerWebFetchProvider(...)`             | ارائه‌دهنده دریافت / خزش وب      |
| `api.registerWebSearchProvider(...)`            | جستجوی وب                        |

### ابزارها و فرمان‌ها

| روش                            | آنچه ثبت می‌کند                              |
| ------------------------------ | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار عامل (اجباری یا `{ optional: true }`) |
| `api.registerCommand(def)`      | فرمان سفارشی (LLM را دور می‌زند)             |

فرمان‌های Plugin می‌توانند زمانی که عامل به یک راهنمای کوتاه مسیریابیِ متعلق به فرمان نیاز دارد، `agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود فرمان نگه دارید؛ خط‌مشی مخصوص ارائه‌دهنده یا Plugin را به سازنده‌های پرامپت هسته اضافه نکنید.

### زیرساخت

| روش                                           | آنچه ثبت می‌کند                                  |
| --------------------------------------------- | ------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`    | هوک رویداد                                      |
| `api.registerHttpRoute(params)`               | نقطه پایانی HTTP در Gateway                     |
| `api.registerGatewayMethod(name, handler)`    | روش RPC در Gateway                              |
| `api.registerGatewayDiscoveryService(service)` | اعلان‌کننده کشف Gateway محلی                    |
| `api.registerCli(registrar, opts?)`           | زیرفرمان CLI                                    |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI قابلیت Node زیر `openclaw nodes`            |
| `api.registerService(service)`                | سرویس پس‌زمینه                                  |
| `api.registerInteractiveHandler(registration)` | هندلر تعاملی                                    |
| `api.registerAgentToolResultMiddleware(...)`  | میان‌افزار نتیجه ابزار در زمان اجرا             |
| `api.registerMemoryPromptSupplement(builder)` | بخش پرامپت افزایشی مجاور حافظه                  |
| `api.registerMemoryCorpusSupplement(adapter)` | بدنه افزایشی جستجو/خواندن حافظه                 |

### هوک‌های میزبان برای Pluginهای گردش کار

هوک‌های میزبان مرزهای SDK برای Pluginهایی هستند که باید در چرخه عمر میزبان مشارکت کنند، نه اینکه فقط یک ارائه‌دهنده، کانال یا ابزار اضافه کنند. آن‌ها قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما گردش‌های کار تأیید، دروازه‌های خط‌مشی فضای کاری، پایشگرهای پس‌زمینه، راه‌اندازهای مرحله‌ای و Pluginهای همراه UI هم می‌توانند از آن‌ها استفاده کنند.

| روش                                                                     | قراردادی که مالک آن است                                                                                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                     | وضعیت نشست متعلق به Plugin و سازگار با JSON که از طریق نشست‌های Gateway منعکس می‌شود                                               |
| `api.enqueueNextTurnInjection(...)`                                     | زمینه پایدار دقیقاً یک‌بار که برای یک نشست به نوبت بعدی عامل تزریق می‌شود                                                           |
| `api.registerTrustedToolPolicy(...)`                                    | خط‌مشی ابزار پیشا-Plugin بسته‌بندی‌شده/قابل اعتماد که می‌تواند پارامترهای ابزار را مسدود یا بازنویسی کند                           |
| `api.registerToolMetadata(...)`                                         | فراداده نمایش کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                                             |
| `api.registerCommand(...)`                                              | فرمان‌های Plugin دامنه‌دار؛ نتایج فرمان می‌توانند `continueAgent: true` را تنظیم کنند؛ فرمان‌های بومی Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.registerControlUiDescriptor(...)`                                  | توصیفگرهای مشارکت Control UI برای سطح‌های نشست، ابزار، اجرا یا تنظیمات                                                             |
| `api.registerRuntimeLifecycle(...)`                                     | callbackهای پاک‌سازی برای منابع زمان اجرای متعلق به Plugin در مسیرهای reset/delete/reload                                           |
| `api.registerAgentEventSubscription(...)`                               | اشتراک‌های رویداد پاک‌سازی‌شده برای وضعیت گردش کار و پایشگرها                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | وضعیت موقت Plugin برای هر اجرا که در چرخه عمر پایانی اجرا پاک می‌شود                                                                 |
| `api.registerSessionSchedulerJob(...)`                                  | رکوردهای کار زمان‌بند نشست متعلق به Plugin با پاک‌سازی قطعی                                                                         |

قراردادها عمداً اختیار را تفکیک می‌کنند:

- Pluginهای خارجی می‌توانند مالک افزونه‌های نشست، توصیفگرهای UI، فرمان‌ها، فراداده ابزار، تزریق‌های نوبت بعدی و هوک‌های عادی باشند.
- خط‌مشی‌های ابزار قابل اعتماد پیش از هوک‌های معمولی `before_tool_call` اجرا می‌شوند و فقط بسته‌بندی‌شده هستند، چون در خط‌مشی ایمنی میزبان مشارکت دارند.
- مالکیت فرمان رزرو‌شده فقط برای موارد بسته‌بندی‌شده است. Pluginهای خارجی باید از نام‌ها یا نام‌های مستعار فرمان خودشان استفاده کنند.
- `allowPromptInjection=false` هوک‌های تغییردهنده پرامپت را غیرفعال می‌کند، از جمله `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`، فیلدهای پرامپت از `before_agent_start` قدیمی، و `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| الگوی Plugin                  | هوک‌های استفاده‌شده                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| گردش کار تأیید                | افزونه نشست، ادامه فرمان، تزریق نوبت بعدی، توصیفگر UI                                                                              |
| دروازه خط‌مشی بودجه/فضای کاری | خط‌مشی ابزار قابل اعتماد، فراداده ابزار، نمایش نشست                                                                                |
| پایشگر چرخه عمر پس‌زمینه      | پاک‌سازی چرخه عمر زمان اجرا، اشتراک رویداد عامل، مالکیت/پاک‌سازی زمان‌بند نشست، مشارکت پرامپت Heartbeat، توصیفگر UI              |
| راه‌انداز مرحله‌ای یا onboarding | افزونه نشست، فرمان‌های دامنه‌دار، توصیفگر Control UI                                                                               |

<Note>
  فضاهای نام مدیریتی رزروشده هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` باقی می‌مانند، حتی اگر یک Plugin تلاش کند یک
  دامنه روش Gateway محدودتر اختصاص دهد. برای روش‌های متعلق به Plugin، پیشوندهای
  مخصوص Plugin را ترجیح دهید.
</Note>

<Accordion title="When to use tool-result middleware">
  Pluginهای بسته‌بندی‌شده می‌توانند زمانی از `api.registerAgentToolResultMiddleware(...)` استفاده کنند که
  نیاز دارند نتیجه ابزار را پس از اجرا و پیش از اینکه زمان اجرا آن نتیجه را دوباره به مدل
  بدهد، بازنویسی کنند. این مرز قابل اعتماد و بی‌طرف نسبت به زمان اجرا برای کاهش‌دهنده‌های خروجی ناهمگام مانند tokenjuice است.

Pluginهای همراه باید برای هر زمان اجرای هدف، برای مثال `["pi", "codex"]`، مقدار `contracts.agentToolResultMiddleware` را اعلام کنند. Pluginهای خارجی نمی‌توانند این middleware را ثبت کنند؛ برای کاری که به زمان‌بندی نتیجهٔ ابزار پیش از مدل نیاز ندارد، از hookهای عادی Plugin در OpenClaw استفاده کنید. مسیر قدیمی ثبت factory افزونهٔ تعبیه‌شدهٔ مخصوص Pi حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را روی یک انتقال کشف محلی مانند mDNS/Bonjour اعلام کند. وقتی کشف محلی فعال باشد، OpenClaw هنگام راه‌اندازی Gateway این سرویس را فراخوانی می‌کند، portهای فعلی Gateway و داده‌های راهنمای TXT غیرمحرمانه را ارسال می‌کند، و هنگام خاموش شدن Gateway، handler بازگردانده‌شدهٔ `stop` را فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT اعلام‌شده را به‌عنوان راز یا احراز هویت در نظر بگیرند. کشف فقط یک راهنمای مسیریابی است؛ احراز هویت Gateway و pinning TLS همچنان مالک اعتماد هستند.

### metadata ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع metadata فرمان را می‌پذیرد:

- `commands`: نام‌های صریح فرمان که مالکیت آن‌ها با registrar است
- `descriptors`: توصیفگرهای فرمان در زمان parse برای راهنمای CLI،
  مسیریابی، و ثبت تنبل CLI متعلق به Plugin
- `parentPath`: مسیر اختیاری فرمان والد برای گروه‌های فرمان تودرتو، مانند
  `["nodes"]`

برای قابلیت‌های node جفت‌شده، `api.registerNodeCliFeature(registrar, opts?)` را ترجیح دهید. این یک wrapper کوچک پیرامون `api.registerCli(..., { parentPath: ["nodes"] })` است و فرمان‌هایی مانند `openclaw nodes canvas` را به‌عنوان قابلیت‌های node متعلق به Plugin صریح می‌کند.

اگر می‌خواهید یک فرمان Plugin در مسیر عادی CLI ریشه به‌صورت lazy-loaded باقی بماند، `descriptors`هایی ارائه کنید که هر ریشهٔ فرمان سطح بالای ارائه‌شده توسط آن registrar را پوشش دهند.

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

فرمان‌های تودرتو فرمان والد resolve‌شده را به‌عنوان `program` دریافت می‌کنند:

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

فقط زمانی `commands` را به‌تنهایی استفاده کنید که به ثبت تنبل CLI ریشه نیاز ندارید. آن مسیر سازگاری eager همچنان پشتیبانی می‌شود، اما placeholderهای مبتنی بر descriptor را برای lazy loading در زمان parse نصب نمی‌کند.

### ثبت backend برای CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد پیکربندی پیش‌فرض یک backend محلی CLI هوش مصنوعی مانند `codex-cli` را مالک شود.

- مقدار `id` برای backend به پیشوند provider در ارجاع‌های مدل مانند `codex-cli/gpt-5` تبدیل می‌شود.
- مقدار `config` برای backend از همان شکل `agents.defaults.cliBackends.<id>` استفاده می‌کند.
- پیکربندی کاربر همچنان برنده است. OpenClaw پیش از اجرای CLI، مقدار `agents.defaults.cliBackends.<id>` را روی پیش‌فرض Plugin merge می‌کند.
- وقتی یک backend پس از merge به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای مثال، عادی‌سازی شکل‌های قدیمی flag).
- برای بازنویسی‌های argv در محدودهٔ درخواست که به dialect مربوط به CLI تعلق دارند، از `resolveExecutionArgs` استفاده کنید، مانند نگاشت سطح‌های thinking در OpenClaw به یک flag بومی effort.

برای راهنمای کامل نویسندگی، ببینید
[Pluginهای backend برای CLI](/fa/plugins/cli-backend-plugins).

### slotهای انحصاری

| روش                                       | آنچه ثبت می‌کند                                                                                                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | موتور context (هر بار فقط یکی فعال است). callback با نام `assemble()` مقدارهای `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزوده‌های prompt را تنظیم کند. |
| `api.registerMemoryCapability(capability)` | قابلیت یکپارچهٔ memory                                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | سازندهٔ بخش prompt مربوط به memory                                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | resolver برای برنامهٔ flush مربوط به memory                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | adapter زمان اجرای memory                                                                                                                                              |

### adapterهای embedding برای memory

| روش                                           | آنچه ثبت می‌کند                                |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding مربوط به memory برای Plugin فعال |

- `registerMemoryCapability` API ترجیحی Plugin حافظهٔ انحصاری است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)`
  را expose کند تا Pluginهای همراه بتوانند artifactهای memory صادرشده را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، به‌جای اینکه وارد layout خصوصی یک
  Plugin حافظهٔ مشخص شوند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan`، و
  `registerMemoryRuntime` APIهای سازگار با legacy برای Plugin حافظهٔ انحصاری هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت flush را به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` ثابت کند، بدون اینکه زنجیرهٔ fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` به Plugin حافظهٔ فعال اجازه می‌دهد یک یا چند شناسهٔ adapter برای embedding ثبت کند (برای مثال `openai`، `gemini`، یا یک شناسهٔ سفارشی تعریف‌شده توسط Plugin).
- پیکربندی کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` در برابر همان شناسه‌های adapter ثبت‌شده resolve می‌شود.

### رویدادها و چرخهٔ عمر

| روش                                         | کاری که انجام می‌دهد          |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook چرخهٔ عمر typed          |
| `api.onConversationBindingResolved(handler)` | callback اتصال conversation   |

برای مثال‌ها، نام‌های رایج hook، و semanticsهای guard، ببینید [hookهای Plugin](/fa/plugins/hooks).

### semantics تصمیم hook

- `before_tool_call`: بازگرداندن `{ block: true }` نهایی است. پس از اینکه هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: بازگرداندن `{ block: true }` نهایی است. پس از اینکه هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` نهایی است. پس از اینکه هر handler مالکیت dispatch را claim کند، handlerهای با اولویت پایین‌تر و مسیر dispatch پیش‌فرض مدل رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` نهایی است. پس از اینکه هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، از فیلد typed با نام `threadId` استفاده کنید. `metadata` را برای موارد اضافهٔ مختص کانال نگه دارید.
- `message_sending`: پیش از fallback به `metadata` مختص کانال، از فیلدهای مسیریابی typed با نام‌های `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای state راه‌اندازی متعلق به gateway، به‌جای تکیه بر hookهای داخلی `gateway:startup`، از `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخهٔ عمر Cron متعلق به gateway را مشاهده کنید. هنگام sync کردن schedulerهای wake خارجی، از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را به‌عنوان منبع حقیقت برای بررسی‌های موعددار و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | شناسهٔ Plugin                                                                               |
| `api.name`               | `string`                  | نام نمایشی                                                                                  |
| `api.version`            | `string?`                 | نسخهٔ Plugin (اختیاری)                                                                      |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                      |
| `api.source`             | `string`                  | مسیر source مربوط به Plugin                                                                 |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشهٔ Plugin (اختیاری)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (snapshot زمان اجرای درون‌حافظه‌ای فعال، وقتی در دسترس باشد)        |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مختص Plugin از `plugins.entries.<id>.config`                                       |
| `api.runtime`            | `PluginRuntime`           | [helperهای runtime](/fa/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | logger scoped (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت load فعلی؛ `"setup-runtime"` پنجرهٔ سبک startup/setup پیش از entry کامل است           |
| `api.resolvePath(input)` | `(string) => string`      | resolve کردن مسیر نسبت به ریشهٔ Plugin                                                      |

## قرارداد module داخلی

درون Plugin خود، برای importهای داخلی از فایل‌های barrel محلی استفاده کنید:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  هرگز Plugin خود را از کد production از طریق `openclaw/plugin-sdk/<your-plugin>`
  import نکنید. importهای داخلی را از طریق `./api.ts` یا
  `./runtime-api.ts` مسیریابی کنید. مسیر SDK فقط contract خارجی است.
</Warning>

سطح‌های عمومی Plugin همراه که با facade load می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts`، و فایل‌های entry عمومی مشابه)، وقتی OpenClaw در حال اجرا باشد، snapshot پیکربندی runtime فعال را ترجیح می‌دهند. اگر هنوز snapshot runtime وجود نداشته باشد، به فایل پیکربندی resolve‌شده روی disk fallback می‌کنند. facadeهای Plugin همراه بسته‌بندی‌شده باید از طریق loaderهای facade Plugin در OpenClaw load شوند؛ importهای مستقیم از `dist/extensions/...` بررسی‌های manifest و sidecar runtime را که نصب‌های بسته‌بندی‌شده برای کد متعلق به Plugin استفاده می‌کنند، دور می‌زنند.

Pluginهای ارائه‌دهنده می‌توانند یک barrel قراردادی محدود و محلیِ Plugin را در معرض استفاده قرار دهند، زمانی که یک helper عمداً مختص ارائه‌دهنده است و هنوز به یک زیربخش SDK عمومی تعلق ندارد. نمونه‌های bundled:

- **Anthropic**: مسیر عمومی `api.ts` / `contract-api.ts` برای helperهای Claude
  beta-header و جریان `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های ارائه‌دهنده،
  helperهای مدل پیش‌فرض، و سازنده‌های ارائه‌دهنده realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده ارائه‌دهنده
  به‌همراه helperهای onboarding/config را export می‌کند.

<Warning>
  کد تولیدی extension همچنین باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک helper واقعاً مشترک است، آن را به یک زیربخش SDK خنثی
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا سطح دیگری
  با محوریت قابلیت ارتقا دهید، به‌جای اینکه دو Plugin را به هم وابسته کنید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقاط ورود" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="helperهای runtime" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل namespaceِ `api.runtime`.
  </Card>
  <Card title="راه‌اندازی و config" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، manifestها، و schemaهای config.
  </Card>
  <Card title="آزمایش" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای تست و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطح‌های منسوخ‌شده.
  </Card>
  <Card title="درون‌ساخت Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل قابلیت‌ها.
  </Card>
</CardGroup>
