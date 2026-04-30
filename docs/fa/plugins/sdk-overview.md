---
read_when:
    - باید بدانید از کدام زیرمسیر SDK وارد کنید
    - شما مرجعی برای همهٔ روش‌های ثبت در OpenClawPluginApi می‌خواهید
    - در حال جست‌وجوی یک خروجی مشخص از SDK هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ import، مرجع API ثبت، و معماری SDK
title: نمای کلی Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:41:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin قرارداد تایپ‌شده میان Pluginها و هسته است. این صفحه مرجع **موارد قابل import** و **موارد قابل ثبت** است.

<Note>
  این صفحه برای نویسندگان Plugin است که داخل OpenClaw از `openclaw/plugin-sdk/*`
  استفاده می‌کنند. برای اپ‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
  که می‌خواهند agentها را از طریق Gateway اجرا کنند، به‌جای آن از
  [OpenClaw App SDK](/fa/concepts/openclaw-sdk) و بسته `@openclaw/sdk`
  استفاده کنید.
</Note>

<Tip>
به‌دنبال یک راهنمای عملی هستید؟ از [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای provider از [Pluginهای provider](/fa/plugins/sdk-provider-plugins)، و برای Pluginهای hook ابزار یا چرخه عمر از [Hookهای Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک زیرمسیر مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر زیرمسیر یک ماژول کوچک و خودبسنده است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای entry/build مخصوص کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترک مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. زیرمسیر `plugin-sdk/channel-config-schema`
برای primitiveهای schema مشترک و builder عمومی است. Pluginهای bundled در OpenClaw
برای schemaهای کانال bundled حفظ‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده می‌کنند.
exportهای سازگاری منسوخ‌شده همچنان در
`plugin-sdk/channel-config-schema-legacy` باقی مانده‌اند؛ هیچ‌کدام از زیرمسیرهای schema bundled
الگویی برای Pluginهای جدید نیستند.

<Warning>
  seamهای convenience با برند provider یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای bundled زیرمسیرهای SDK عمومی را داخل barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان barrelهای محلی Plugin
  استفاده کنند یا وقتی نیاز واقعا cross-channel است، یک قرارداد SDK عمومی باریک اضافه کنند.

مجموعه کوچکی از seamهای helper مربوط به Pluginهای bundled هنوز وقتی استفاده مالکانه ردیابی‌شده دارند
در export map تولیدشده دیده می‌شوند. این‌ها فقط برای نگه‌داری Pluginهای bundled وجود دارند
و مسیرهای import توصیه‌شده برای Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` همچنین
به‌عنوان facadeهای سازگاری منسوخ‌شده برای استفاده مالکانه ردیابی‌شده نگه داشته شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
زیرمسیرهای SDK عمومی کانال استفاده کنید.
</Warning>

## مرجع زیرمسیرها

SDK Plugin به‌صورت مجموعه‌ای از زیرمسیرهای باریک در گروه‌های حوزه‌ای ارائه می‌شود (entry مربوط به Plugin،
کانال، provider، احراز هویت، runtime، capability، memory، و helperهای رزروشده Pluginهای bundled).
برای کاتالوگ کامل، به‌صورت گروه‌بندی‌شده و لینک‌شده، به
[زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.

فهرست تولیدشده بیش از 200 زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

## API ثبت

callback `register(api)` یک شیء `OpenClawPluginApi` با این متدها دریافت می‌کند:

### ثبت capability

| متد                                             | چیزی که ثبت می‌کند                      |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متن (LLM)                     |
| `api.registerAgentHarness(...)`                  | executor آزمایشی سطح پایین agent      |
| `api.registerCliBackend(...)`                    | backend محلی استنتاج CLI              |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                      |
| `api.registerSpeechProvider(...)`                | تبدیل متن به گفتار / سنتز STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی realtime جریانی               |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صوتی realtime دوطرفه         |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدیو                 |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                           |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                          |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدیو                           |
| `api.registerWebFetchProvider(...)`              | provider دریافت / scrape وب           |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                           |

### ابزارها و دستورها

| متد                            | چیزی که ثبت می‌کند                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار agent (الزامی یا `{ optional: true }`)       |
| `api.registerCommand(def)`      | دستور سفارشی (LLM را دور می‌زند)                  |

دستورهای Plugin وقتی agent به یک راهنمای routing کوتاه و متعلق به دستور نیاز دارد، می‌توانند
`agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود دستور نگه دارید؛ policy
مخصوص provider یا Plugin را به prompt builderهای هسته اضافه نکنید.

### زیرساخت

| متد                                           | چیزی که ثبت می‌کند                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook رویداد                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | advertiser کشف Gateway محلی              |
| `api.registerCli(registrar, opts?)`            | زیر‌دستور CLI                            |
| `api.registerService(service)`                 | سرویس پس‌زمینه                           |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                           |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار در runtime        |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزوده نزدیک به memory        |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزوده برای جست‌وجو/خواندن memory |

### hookهای میزبان برای Pluginهای workflow

hookهای میزبان seamهای SDK برای Pluginهایی هستند که باید در چرخه عمر میزبان مشارکت کنند،
نه اینکه فقط یک provider، کانال یا ابزار اضافه کنند. این‌ها قراردادهای عمومی هستند؛ Plan Mode
می‌تواند از آن‌ها استفاده کند، اما workflowهای approval، gateهای policy مربوط به workspace،
monitorهای پس‌زمینه، wizardهای setup و Pluginهای همراه UI نیز می‌توانند.

| متد                                                                      | قراردادی که مالک آن است                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | وضعیت نشست متعلق به Plugin و سازگار با JSON که از طریق نشست‌های Gateway نمایش داده می‌شود |
| `api.enqueueNextTurnInjection(...)`                                      | context بادوام exactly-once که برای یک نشست به turn بعدی agent تزریق می‌شود          |
| `api.registerTrustedToolPolicy(...)`                                     | policy ابزار پیش از Plugin و bundled/trusted که می‌تواند پارامترهای ابزار را block یا rewrite کند |
| `api.registerToolMetadata(...)`                                          | metadata نمایشی کاتالوگ ابزار بدون تغییر implementation ابزار                       |
| `api.registerCommand(...)`                                               | دستورهای scoped مربوط به Plugin؛ نتیجه دستور می‌تواند `continueAgent: true` تنظیم کند |
| `api.registerControlUiDescriptor(...)`                                   | descriptorهای contribution برای Control UI در سطح نشست، ابزار، run یا تنظیمات        |
| `api.registerRuntimeLifecycle(...)`                                      | callbackهای cleanup برای منابع runtime متعلق به Plugin در مسیرهای reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | subscriptionهای sanitize‌شده رویداد برای وضعیت workflow و monitorها                 |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | وضعیت scratch مربوط به Plugin برای هر run که در چرخه عمر terminal run پاک می‌شود      |
| `api.registerSessionSchedulerJob(...)`                                   | رکوردهای job scheduler نشست متعلق به Plugin با cleanup قطعی                         |

این قراردادها عمدا authority را جدا می‌کنند:

- Pluginهای خارجی می‌توانند مالک extensionهای نشست، descriptorهای UI، دستورها، metadata ابزار،
  تزریق‌های turn بعدی، و hookهای معمولی باشند.
- policyهای trusted tool پیش از hookهای عادی `before_tool_call` اجرا می‌شوند و
  فقط bundled هستند، چون در policy ایمنی میزبان مشارکت می‌کنند.
- مالکیت دستور رزروشده فقط bundled است. Pluginهای خارجی باید از نام‌های دستور یا aliasهای
  خودشان استفاده کنند.
- `allowPromptInjection=false` hookهای تغییر‌دهنده prompt را غیرفعال می‌کند، از جمله
  `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`،
  فیلدهای prompt از `before_agent_start` قدیمی، و
  `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| archetype Plugin             | hookهای استفاده‌شده                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow تأیید               | extension نشست، ادامه دستور، تزریق turn بعدی، descriptor UI                                                                            |
| gate policy بودجه/workspace  | policy trusted tool، metadata ابزار، projection نشست                                                                                   |
| monitor چرخه عمر پس‌زمینه    | cleanup چرخه عمر runtime، subscription رویداد agent، مالکیت/cleanup scheduler نشست، contribution prompt مربوط به Heartbeat، descriptor UI |
| wizard راه‌اندازی یا onboarding | extension نشست، دستورهای scoped، descriptor مربوط به Control UI                                                                        |

<Note>
  namespaceهای admin رزروشده هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` می‌مانند، حتی اگر یک Plugin تلاش کند scope
  باریک‌تری برای متد gateway اختصاص دهد. برای متدهای متعلق به Plugin، prefixهای
  مخصوص Plugin را ترجیح دهید.
</Note>

<Accordion title="چه زمانی از middleware نتیجه ابزار استفاده کنیم">
  Pluginهای bundled وقتی لازم است نتیجه ابزار را پس از اجرا و پیش از اینکه runtime
  آن نتیجه را به مدل برگرداند rewrite کنند، می‌توانند از `api.registerAgentToolResultMiddleware(...)`
  استفاده کنند. این seam trusted و خنثی نسبت به runtime برای reducerهای خروجی async مانند tokenjuice است.

Pluginهای bundled باید برای هر runtime هدف، `contracts.agentToolResultMiddleware` را اعلام کنند،
برای مثال `["pi", "codex"]`. Pluginهای خارجی
نمی‌توانند این middleware را ثبت کنند؛ hookهای معمولی Plugin در OpenClaw را برای کاری نگه دارید
که به timing نتیجه ابزار پیش از مدل نیاز ندارد. مسیر ثبت factory extension تعبیه‌شده
قدیمی و فقط مخصوص Pi حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را
روی یک transport کشف محلی مانند mDNS/Bonjour advertise کند. OpenClaw هنگام startup
Gateway و وقتی کشف محلی فعال است، سرویس را فراخوانی می‌کند، پورت‌های فعلی Gateway
و داده‌های hint غیرمحرمانه TXT را پاس می‌دهد، و handler برگشتی
`stop` را هنگام shutdown Gateway فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT آگهی‌شده را راز یا
احراز هویت در نظر بگیرند. کشف فقط یک راهنمای مسیریابی است؛ احراز هویت Gateway و سنجاق‌کردن TLS همچنان
مالک اعتماد هستند.

### فراداده ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فراداده سطح‌بالا را می‌پذیرد:

- `commands`: ریشه‌های دستور صریحی که در مالکیت ثبت‌کننده هستند
- `descriptors`: توصیفگرهای دستور در زمان تجزیه که برای راهنمای CLI ریشه،
  مسیریابی، و ثبت تنبل CLI مربوط به Plugin استفاده می‌شوند

اگر می‌خواهید یک دستور Plugin در مسیر عادی CLI ریشه به‌صورت تنبل بارگذاری شود،
`descriptors` را ارائه کنید که همه ریشه‌های دستور سطح‌بالایی را که آن
ثبت‌کننده در معرض می‌گذارد پوشش دهد.

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

فقط زمانی `commands` را به‌تنهایی استفاده کنید که به ثبت تنبل CLI ریشه نیاز ندارید.
این مسیر سازگاری مشتاقانه همچنان پشتیبانی می‌شود، اما برای بارگذاری تنبل در زمان تجزیه
جای‌نگهدارهای مبتنی بر توصیفگر نصب نمی‌کند.

### ثبت بک‌اند CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد پیکربندی پیش‌فرض یک
بک‌اند CLI هوش مصنوعی محلی مانند `codex-cli` را مالک شود.

- مقدار `id` بک‌اند در ارجاع‌های مدل مانند `codex-cli/gpt-5` به پیشوند فراهم‌کننده تبدیل می‌شود.
- مقدار `config` بک‌اند همان شکل `agents.defaults.cliBackends.<id>` را به کار می‌برد.
- پیکربندی کاربر همچنان اولویت دارد. OpenClaw پیش از اجرای CLI مقدار `agents.defaults.cliBackends.<id>` را روی
  پیش‌فرض Plugin ادغام می‌کند.
- وقتی یک بک‌اند پس از ادغام به بازنویسی‌های سازگاری نیاز دارد از `normalizeConfig` استفاده کنید
  (برای مثال عادی‌سازی شکل‌های قدیمی پرچم‌ها).

### اسلات‌های انحصاری

| متد                                       | چیزی که ثبت می‌کند                                                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | موتور زمینه (هر بار یکی فعال است). فراخوانی برگشتی `assemble()` مقدارهای `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزودنی‌های پرامپت را متناسب کند. |
| `api.registerMemoryCapability(capability)` | قابلیت حافظه یکپارچه                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش پرامپت حافظه                                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`  | حل‌کننده طرح تخلیه حافظه                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`     | آداپتر زمان اجرای حافظه                                                                                                                                        |

### آداپترهای embedding حافظه

| متد                                           | چیزی که ثبت می‌کند                         |
| -------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | آداپتر embedding حافظه برای Plugin فعال    |

- `registerMemoryCapability` API انحصاری ترجیحی برای Plugin حافظه است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)` را در معرض بگذارد
  تا Pluginهای همراه بتوانند مصنوعات حافظه صادرشده را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، به‌جای اینکه وارد چیدمان خصوصی یک
  Plugin حافظه مشخص شوند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan`، و
  `registerMemoryRuntime` APIهای انحصاری Plugin حافظه با سازگاری میراثی هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت تخلیه را به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` سنجاق کند، بدون اینکه زنجیره fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` به Plugin حافظه فعال اجازه می‌دهد یک یا چند
  شناسه آداپتر embedding ثبت کند (برای مثال `openai`، `gemini`، یا یک شناسه سفارشی
  تعریف‌شده توسط Plugin).
- پیکربندی کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` در برابر همان شناسه‌های آداپتر ثبت‌شده resolve می‌شود.

### رویدادها و چرخه عمر

| متد                                         | کاری که انجام می‌دهد              |
| ------------------------------------------ | --------------------------------- |
| `api.on(hookName, handler, opts?)`         | قلاب چرخه عمر تایپ‌شده            |
| `api.onConversationBindingResolved(handler)` | فراخوانی برگشتی اتصال مکالمه      |

برای نمونه‌ها، نام‌های رایج قلاب، و معناشناسی guard به [قلاب‌های Plugin](/fa/plugins/hooks) مراجعه کنید.

### معناشناسی تصمیم قلاب

- `before_tool_call`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler ارسال را ادعا کند، handlerهای با اولویت پایین‌تر و مسیر ارسال مدل پیش‌فرض نادیده گرفته می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید از فیلد تایپ‌شده `threadId` استفاده کنید. `metadata` را برای موارد اضافه ویژه کانال نگه دارید.
- `message_sending`: پیش از fallback به `metadata` ویژه کانال، از فیلدهای مسیریابی تایپ‌شده `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای وضعیت راه‌اندازی متعلق به Gateway از `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` استفاده کنید، به‌جای تکیه بر قلاب‌های داخلی `gateway:startup`.
- `cron_changed`: تغییرات چرخه عمر cron متعلق به Gateway را مشاهده کنید. هنگام همگام‌سازی زمان‌بندهای بیدارباش خارجی از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را منبع حقیقت برای بررسی‌های سررسید و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | شناسه Plugin                                                                                |
| `api.name`               | `string`                  | نام نمایشی                                                                                 |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                      |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                     |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                           |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                           |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (در صورت موجود بودن، snapshot زمان اجرای فعال در حافظه)             |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی ویژه Plugin از `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [کمک‌کننده‌های زمان اجرا](/fa/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | logger محدوده‌دار (`debug`، `info`، `warn`، `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/تنظیم پیش از ورود کامل است     |
| `api.resolvePath(input)` | `(string) => string`      | resolve کردن مسیر نسبت به ریشه Plugin                                                      |

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
  `./runtime-api.ts` هدایت کنید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطوح عمومی Pluginهای bundled که از طریق facade بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts`، و فایل‌های ورودی عمومی مشابه) وقتی OpenClaw از قبل در حال اجرا باشد،
snapshot پیکربندی زمان اجرای فعال را ترجیح می‌دهند. اگر هنوز هیچ snapshot زمان اجرایی وجود نداشته باشد،
به فایل پیکربندی resolve‌شده روی دیسک fallback می‌کنند.
facadeهای Pluginهای bundled بسته‌بندی‌شده باید از طریق loaderهای facade Plugin در OpenClaw
بارگذاری شوند؛ importهای مستقیم از `dist/extensions/...` آینه‌های وابستگی زمان اجرای مرحله‌بندی‌شده را که نصب‌های بسته‌بندی‌شده برای وابستگی‌های متعلق به Plugin استفاده می‌کنند دور می‌زنند.

Pluginهای فراهم‌کننده می‌توانند وقتی یک کمک‌کننده عمدا ویژه فراهم‌کننده است و هنوز به یک زیرمسیر generic SDK تعلق ندارد،
یک barrel قراردادی باریک و محلی برای Plugin در معرض بگذارند. نمونه‌های bundled:

- **Anthropic**: seam عمومی `api.ts` / `contract-api.ts` برای کمک‌کننده‌های
  سرآیند بتای Claude و جریان `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های فراهم‌کننده،
  کمک‌کننده‌های مدل پیش‌فرض، و سازنده‌های فراهم‌کننده realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده فراهم‌کننده
  به‌علاوه کمک‌کننده‌های onboarding/config را export می‌کند.

<Warning>
  کد production افزونه نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک کمک‌کننده واقعا مشترک است، آن را به یک زیرمسیر بی‌طرف SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا سطحی دیگر
  با محوریت قابلیت منتقل کنید، به‌جای اینکه دو Plugin را به هم جفت کنید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقاط ورود" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="کمک‌کننده‌های زمان اجرا" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل namespace مربوط به `api.runtime`.
  </Card>
  <Card title="تنظیم و پیکربندی" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، manifestها، و schemaهای پیکربندی.
  </Card>
  <Card title="آزمون" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای آزمون و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطوح منسوخ‌شده.
  </Card>
  <Card title="درونیات Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل قابلیت.
  </Card>
</CardGroup>
