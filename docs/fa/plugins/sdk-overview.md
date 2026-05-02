---
read_when:
    - باید بدانید از کدام زیرمسیر SDK وارد کنید
    - یک مرجع برای همهٔ متدهای ثبت در OpenClawPluginApi می‌خواهید
    - در حال جست‌وجوی یک خروجی مشخص از SDK هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ واردسازی، مرجع رابط برنامه‌نویسی کاربردی ثبت، و معماری کیت توسعهٔ نرم‌افزار
title: نمای کلی Plugin SDK
x-i18n:
    generated_at: "2026-05-02T11:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDKِ Plugin قرارداد تایپ‌شده میان Pluginها و هسته است. این صفحه مرجع
**چیزهایی که باید import کنید** و **چیزهایی که می‌توانید ثبت کنید** است.

<Note>
  این صفحه برای نویسندگان Plugin است که از `openclaw/plugin-sdk/*` درون
  OpenClaw استفاده می‌کنند. برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
  که می‌خواهند agentها را از طریق Gateway اجرا کنند، به‌جای آن از
  [SDK برنامه OpenClaw](/fa/concepts/openclaw-sdk) و بسته `@openclaw/sdk`
  استفاده کنید.
</Note>

<Tip>
به‌دنبال یک راهنمای عملی هستید؟ از [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای provider از [Pluginهای provider](/fa/plugins/sdk-provider-plugins)، و برای Pluginهای هوک ابزار یا چرخه عمر از [هوک‌های Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک زیرمسیر مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر زیرمسیر یک ماژول کوچک و خودبسنده است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای ورود/ساخت ویژه کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترک مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. زیرمسیر `plugin-sdk/channel-config-schema`
برای primitiveهای schema مشترک و سازنده عمومی است. Pluginهای همراه OpenClaw
برای schemaهای حفظ‌شده کانال‌های همراه از `plugin-sdk/bundled-channel-config-schema` استفاده می‌کنند.
exportهای سازگاری منسوخ‌شده روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌کدام از زیرمسیرهای schema همراه
الگویی برای Pluginهای جدید نیستند.

<Warning>
  seamهای convenience دارای برند provider یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای همراه، زیرمسیرهای عمومی SDK را در barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان barrelهای محلی Plugin
  استفاده کنند یا وقتی نیاز واقعا
  میان‌کانالی است، یک قرارداد عمومی باریک SDK اضافه کنند.

مجموعه کوچکی از seamهای helper متعلق به Pluginهای همراه همچنان در map خروجی تولیدشده
ظاهر می‌شوند وقتی کاربرد مالک آن‌ها ردیابی شده باشد. آن‌ها فقط برای نگهداری Pluginهای همراه
وجود دارند و مسیرهای import توصیه‌شده برای Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` همچنین
به‌عنوان facadeهای سازگاری منسوخ‌شده برای کاربرد مالک ردیابی‌شده نگه داشته شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
زیرمسیرهای عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع زیرمسیر

SDKِ Plugin به‌صورت مجموعه‌ای از زیرمسیرهای باریک که بر اساس حوزه گروه‌بندی شده‌اند ارائه می‌شود (ورود Plugin،
کانال، provider، احراز هویت، runtime، capability، حافظه، و helperهای رزروشده Pluginهای همراه).
برای فهرست کامل، گروه‌بندی‌شده و لینک‌شده، [زیرمسیرهای SDKِ Plugin](/fa/plugins/sdk-subpaths) را ببینید.

فهرست تولیدشده بیش از ۲۰۰ زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

## API ثبت

callbackِ `register(api)` یک شیء `OpenClawPluginApi` با این
متدها دریافت می‌کند:

### ثبت capability

| متد                                             | آنچه ثبت می‌کند                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متنی (LLM)                    |
| `api.registerAgentHarness(...)`                  | اجراکننده سطح‌پایین آزمایشی agent     |
| `api.registerCliBackend(...)`                    | backend استنتاج CLI محلی              |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                      |
| `api.registerSpeechProvider(...)`                | متن‌به‌گفتار / ساخت STT               |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی بلادرنگ streaming             |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صدای بلادرنگ دوطرفه          |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدئو                 |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                           |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                          |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدئو                           |
| `api.registerWebFetchProvider(...)`              | provider دریافت / scrape وب           |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                           |

### ابزارها و فرمان‌ها

| متد                           | آنچه ثبت می‌کند                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار agent (الزامی یا `{ optional: true }`) |
| `api.registerCommand(def)`      | فرمان سفارشی (LLM را دور می‌زند)              |

فرمان‌های Plugin می‌توانند وقتی agent به یک راهنمای کوتاه routing متعلق به فرمان نیاز دارد
`agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود فرمان نگه دارید؛
سیاست ویژه provider یا Plugin را به سازنده‌های prompt هسته اضافه نکنید.

### زیرساخت

| متد                                            | آنچه ثبت می‌کند                            |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | هوک رویداد                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway                |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | تبلیغ‌کننده discovery محلی Gateway      |
| `api.registerCli(registrar, opts?)`            | زیر‌فرمان CLI                           |
| `api.registerService(service)`                 | سرویس پس‌زمینه                          |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                          |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار در runtime       |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی مجاور حافظه          |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزایشی جست‌وجو/خواندن حافظه     |

### هوک‌های میزبان برای Pluginهای workflow

هوک‌های میزبان، seamهای SDK برای Pluginهایی هستند که باید در چرخه عمر میزبان مشارکت کنند
نه اینکه فقط provider، کانال، یا ابزار اضافه کنند. آن‌ها
قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای تأیید،
gateهای سیاست workspace، مانیتورهای پس‌زمینه، wizardهای راه‌اندازی، و Pluginهای همراه UI نیز می‌توانند.

| متد                                                                       | قراردادی که مالک آن است                                                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | state نشست متعلق به Plugin و سازگار با JSON که از طریق نشست‌های Gateway project می‌شود                                           |
| `api.enqueueNextTurnInjection(...)`                                      | context پایدار exactly-once که برای یک نشست در نوبت بعدی agent تزریق می‌شود                                                     |
| `api.registerTrustedToolPolicy(...)`                                     | سیاست ابزار پیشا-Plugin همراه/مورداعتماد که می‌تواند پارامترهای ابزار را مسدود یا بازنویسی کند                                  |
| `api.registerToolMetadata(...)`                                          | metadata نمایش کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                                          |
| `api.registerCommand(...)`                                               | فرمان‌های Plugin با دامنه محدود؛ نتایج فرمان می‌توانند `continueAgent: true` تنظیم کنند؛ فرمان‌های native در Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.registerControlUiDescriptor(...)`                                   | descriptorهای contribution برای Control UI در سطح‌های نشست، ابزار، اجرا، یا تنظیمات                                             |
| `api.registerRuntimeLifecycle(...)`                                      | callbackهای پاک‌سازی برای منابع runtime متعلق به Plugin در مسیرهای reset/delete/reload                                          |
| `api.registerAgentEventSubscription(...)`                                | subscriptionهای رویداد پالایش‌شده برای state workflow و مانیتورها                                                                |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | state موقت Plugin برای هر اجرا که در چرخه عمر پایانی اجرا پاک می‌شود                                                             |
| `api.registerSessionSchedulerJob(...)`                                   | رکوردهای job زمان‌بند نشست متعلق به Plugin با پاک‌سازی قطعی                                                                       |

قراردادها عمدا اختیار را جدا می‌کنند:

- Pluginهای خارجی می‌توانند مالک extensionهای نشست، descriptorهای UI، فرمان‌ها، metadata ابزار،
  تزریق‌های نوبت بعدی، و هوک‌های عادی باشند.
- سیاست‌های ابزار مورداعتماد پیش از هوک‌های عادی `before_tool_call` اجرا می‌شوند و
  فقط همراه هستند، چون در سیاست ایمنی میزبان مشارکت دارند.
- مالکیت فرمان رزروشده فقط همراه است. Pluginهای خارجی باید از
  نام‌ها یا aliasهای فرمان خودشان استفاده کنند.
- `allowPromptInjection=false` هوک‌های تغییردهنده prompt را غیرفعال می‌کند، از جمله
  `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`،
  فیلدهای prompt از `before_agent_start` قدیمی، و
  `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| الگوی Plugin                  | هوک‌های استفاده‌شده                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow تأیید               | extension نشست، ادامه فرمان، تزریق نوبت بعدی، descriptor UI                                                                          |
| gate سیاست بودجه/workspace   | سیاست ابزار مورداعتماد، metadata ابزار، projection نشست                                                                               |
| مانیتور چرخه عمر پس‌زمینه    | پاک‌سازی چرخه عمر runtime، subscription رویداد agent، مالکیت/پاک‌سازی زمان‌بند نشست، contribution prompt در Heartbeat، descriptor UI |
| wizard راه‌اندازی یا onboarding | extension نشست، فرمان‌های scoped، descriptor در Control UI                                                                            |

<Note>
  namespaceهای مدیریتی رزروشده هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` می‌مانند، حتی اگر یک Plugin تلاش کند scope محدودتری برای
  متد gateway تعیین کند. برای متدهای متعلق به Plugin،
  prefixهای ویژه Plugin را ترجیح دهید.
</Note>

<Accordion title="چه زمانی از middleware نتیجه ابزار استفاده کنیم">
  Pluginهای همراه می‌توانند وقتی لازم است پس از اجرا و پیش از اینکه runtime
  نتیجه را دوباره به مدل بدهد، یک نتیجه ابزار را بازنویسی کنند، از `api.registerAgentToolResultMiddleware(...)` استفاده کنند.
  این seam مورداعتماد و runtime-neutral برای reducerهای خروجی async مانند tokenjuice است.

Pluginهای همراه باید برای هر runtime هدف، `contracts.agentToolResultMiddleware` را declare کنند،
برای مثال `["pi", "codex"]`. Pluginهای خارجی
نمی‌توانند این middleware را ثبت کنند؛ برای کاری که به timing نتیجه ابزار پیش از مدل نیاز ندارد،
هوک‌های عادی Plugin در OpenClaw را نگه دارید. مسیر قدیمی ثبت factory در extension تعبیه‌شده فقط-Pi
حذف شده است.
</Accordion>

### ثبت discovery در Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را روی یک انتقال کشف محلی مانند mDNS/Bonjour اعلام کند. OpenClaw هنگام راه‌اندازی Gateway، وقتی کشف محلی فعال است، این سرویس را فراخوانی می‌کند، پورت‌های فعلی Gateway و داده‌های راهنمای TXT غیرمحرمانه را پاس می‌دهد، و هنگام خاموش شدن Gateway هندلر بازگشتی `stop` را فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقدارهای TXT اعلام‌شده را راز یا احراز هویت تلقی کنند. کشف یک راهنمای مسیریابی است؛ احراز هویت Gateway و سنجاق‌کردن TLS همچنان مالک اعتماد هستند.

### فراداده ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فراداده سطح بالا را می‌پذیرد:

- `commands`: ریشه‌های فرمان صریح که متعلق به ثبت‌کننده هستند
- `descriptors`: توصیفگرهای فرمان در زمان تجزیه که برای راهنمای CLI ریشه،
  مسیریابی، و ثبت CLI تنبل Plugin استفاده می‌شوند

اگر می‌خواهید یک فرمان Plugin در مسیر عادی CLI ریشه به‌صورت تنبل بارگذاری شود،
`descriptors` را ارائه کنید که هر ریشه فرمان سطح بالای نمایان‌شده توسط آن
ثبت‌کننده را پوشش دهد.

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

از `commands` به‌تنهایی فقط زمانی استفاده کنید که به ثبت CLI ریشه تنبل نیاز ندارید.
آن مسیر سازگاری مشتاق همچنان پشتیبانی می‌شود، اما جای‌گیرهای مبتنی بر توصیفگر را
برای بارگذاری تنبل در زمان تجزیه نصب نمی‌کند.

### ثبت backend CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد پیکربندی پیش‌فرض یک backend
محلی CLI هوش مصنوعی مانند `codex-cli` را مالک شود.

- `id` مربوط به backend به پیشوند ارائه‌دهنده در ارجاع‌های مدل مانند `codex-cli/gpt-5` تبدیل می‌شود.
- `config` مربوط به backend از همان شکل `agents.defaults.cliBackends.<id>` استفاده می‌کند.
- پیکربندی کاربر همچنان اولویت دارد. OpenClaw پیش‌فرض Plugin را پیش از اجرای CLI با `agents.defaults.cliBackends.<id>` ادغام می‌کند.
- وقتی یک backend پس از ادغام به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای مثال عادی‌سازی شکل‌های قدیمی پرچم).

### اسلات‌های انحصاری

| متد                                       | چیزی که ثبت می‌کند                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | موتور زمینه (هر بار یکی فعال است). callback با نام `assemble()` مقدارهای `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزودنی‌های prompt را تنظیم کند. |
| `api.registerMemoryCapability(capability)` | قابلیت یکپارچه حافظه                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش prompt حافظه                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | حل‌کننده برنامه تخلیه حافظه                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | آداپتر زمان اجرای حافظه                                                                                                                                    |

### آداپترهای embedding حافظه

| متد                                           | چیزی که ثبت می‌کند                                |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | آداپتر embedding حافظه برای Plugin فعال |

- `registerMemoryCapability` API انحصاری ترجیحی برای Plugin حافظه است.
- `registerMemoryCapability` همچنین ممکن است `publicArtifacts.listArtifacts(...)` را نمایان کند
  تا Pluginهای همراه بتوانند artifactهای صادرشده حافظه را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، به‌جای اینکه به چیدمان خصوصی
  یک Plugin حافظه مشخص دسترسی مستقیم داشته باشند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan` و
  `registerMemoryRuntime` APIهای انحصاری سازگار با گذشته برای Plugin حافظه هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت تخلیه را به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` سنجاق کند، بدون اینکه زنجیره fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` به Plugin حافظه فعال اجازه می‌دهد یک یا چند شناسه آداپتر
  embedding را ثبت کند (برای مثال `openai`، `gemini`، یا یک شناسه سفارشی تعریف‌شده توسط Plugin).
- پیکربندی کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` در برابر همان شناسه‌های آداپتر ثبت‌شده resolve می‌شود.

### رویدادها و چرخه عمر

| متد                                         | کاری که انجام می‌دهد          |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook تایپ‌شده چرخه عمر        |
| `api.onConversationBindingResolved(handler)` | callback پیوند مکالمه |

برای مثال‌ها، نام‌های رایج hook، و معناشناسی guard به [hookهای Plugin](/fa/plugins/hooks) مراجعه کنید.

### معناشناسی تصمیم hook

- `before_tool_call`: بازگرداندن `{ block: true }` پایانی است. پس از اینکه هر هندلری آن را تنظیم کند، هندلرهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: بازگرداندن `{ block: true }` پایانی است. پس از اینکه هر هندلری آن را تنظیم کند، هندلرهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` پایانی است. پس از اینکه هر هندلری dispatch را claim کند، هندلرهای با اولویت پایین‌تر و مسیر dispatch پیش‌فرض مدل نادیده گرفته می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` پایانی است. پس از اینکه هر هندلری آن را تنظیم کند، هندلرهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم تلقی می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، از فیلد تایپ‌شده `threadId` استفاده کنید. `metadata` را برای موارد اضافه اختصاصی کانال نگه دارید.
- `message_sending`: پیش از fallback به `metadata` اختصاصی کانال، از فیلدهای مسیریابی تایپ‌شده `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای وضعیت راه‌اندازی متعلق به Gateway از `ctx.config`، `ctx.workspaceDir` و `ctx.getCron?.()` استفاده کنید، به‌جای اتکا به hookهای داخلی `gateway:startup`.
- `cron_changed`: تغییرات چرخه عمر Cron متعلق به Gateway را مشاهده کنید. هنگام همگام‌سازی زمان‌بندهای بیدارسازی خارجی، از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را به‌عنوان منبع حقیقت برای بررسی‌های موعد و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                     |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | شناسه Plugin                                                                                   |
| `api.name`               | `string`                  | نام نمایشی                                                                                |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                   |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                               |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                          |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (snapshot زمان اجرای درون‌حافظه‌ای فعال، در صورت موجود بودن)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی اختصاصی Plugin از `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [کمک‌کننده‌های زمان اجرا](/fa/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger محدود به دامنه (`debug`، `info`، `warn`، `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/آماده‌سازی پیش از ورود کامل است |
| `api.resolvePath(input)` | `(string) => string`      | resolve کردن مسیر نسبت به ریشه Plugin                                                        |

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
  هرگز Plugin خودتان را از کد production از طریق `openclaw/plugin-sdk/<your-plugin>`
  import نکنید. importهای داخلی را از طریق `./api.ts` یا
  `./runtime-api.ts` مسیریابی کنید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطح‌های عمومی Pluginهای bundled که با facade بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts` و فایل‌های ورودی عمومی مشابه)، وقتی OpenClaw از قبل در حال اجرا باشد،
snapshot پیکربندی runtime فعال را ترجیح می‌دهند. اگر هنوز snapshot runtime وجود نداشته باشد،
به فایل پیکربندی resolve‌شده روی دیسک fallback می‌کنند.
facadeهای Pluginهای bundled بسته‌بندی‌شده باید از طریق loaderهای facade مربوط به Plugin در OpenClaw بارگذاری شوند؛
importهای مستقیم از `dist/extensions/...` بررسی‌های manifest و sidecar زمان اجرا را که نصب‌های بسته‌بندی‌شده
برای کد متعلق به Plugin استفاده می‌کنند دور می‌زنند.

Pluginهای ارائه‌دهنده می‌توانند یک barrel قرارداد باریک و محلی برای Plugin را زمانی نمایان کنند که یک
کمک‌کننده عمداً اختصاصی ارائه‌دهنده است و هنوز به یک زیرمسیر عمومی SDK تعلق ندارد.
مثال‌های bundled:

- **Anthropic**: seam عمومی `api.ts` / `contract-api.ts` برای کمک‌کننده‌های
  beta-header مربوط به Claude و stream مربوط به `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های ارائه‌دهنده،
  کمک‌کننده‌های مدل پیش‌فرض، و سازنده‌های ارائه‌دهنده realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده ارائه‌دهنده
  به‌همراه کمک‌کننده‌های onboarding/پیکربندی را export می‌کند.

<Warning>
  کد production مربوط به extension نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک کمک‌کننده واقعاً مشترک است، آن را به یک زیرمسیر خنثی SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا یک سطح
  capability-oriented دیگر ارتقا دهید، به‌جای اینکه دو Plugin را به هم couple کنید.
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
    بسته‌بندی، مانیفست‌ها، و طرح‌واره‌های پیکربندی.
  </Card>
  <Card title="آزمون" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای آزمون و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطح‌های منسوخ‌شده.
  </Card>
  <Card title="جزئیات داخلی Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل قابلیت.
  </Card>
</CardGroup>
