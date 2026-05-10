---
read_when:
    - باید بدانید از کدام زیرمسیر SDK باید آن را وارد کنید
    - شما به مرجعی برای همهٔ روش‌های ثبت در OpenClawPluginApi نیاز دارید
    - در حال جست‌وجوی یک خروجی مشخص از کیت توسعه نرم‌افزار هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ واردسازی، مرجع واسط برنامه‌نویسی ثبت، و معماری کیت توسعهٔ نرم‌افزار
title: نمای کلی Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK مربوط به Plugin قرارداد تایپ‌شده بین Pluginها و هسته است. این صفحه
مرجع **آنچه باید import کنید** و **آنچه می‌توانید register کنید** است.

<Note>
  این صفحه برای نویسندگان Plugin است که از `openclaw/plugin-sdk/*` درون
  OpenClaw استفاده می‌کنند. برای برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، وظایف CI، و افزونه‌های IDE
  که می‌خواهند agentها را از طریق Gateway اجرا کنند، به‌جای آن از
  [OpenClaw App SDK](/fa/concepts/openclaw-sdk) و بسته `@openclaw/sdk`
  استفاده کنید.
</Note>

<Tip>
به‌جای آن دنبال یک راهنمای عملی هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای provider از [Pluginهای provider](/fa/plugins/sdk-provider-plugins)، برای backendهای CLI هوش مصنوعی محلی از [Pluginهای backend CLI](/fa/plugins/cli-backend-plugins)، و برای Pluginهای ابزار یا hook چرخه‌عمر از [hookهای Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک subpath مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر subpath یک ماژول کوچک و خودبسنده است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای entry/build ویژه کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترکی مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. subpath
`plugin-sdk/channel-config-schema` برای primitiveهای schema مشترک و builder عمومی است. Pluginهای
همراه OpenClaw از `plugin-sdk/bundled-channel-config-schema` برای schemaهای حفظ‌شده
کانال‌های همراه استفاده می‌کنند. exportهای سازگاری منسوخ‌شده همچنان روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌یک از subpathهای schema همراه
الگویی برای Pluginهای جدید نیست.

<Warning>
  seamهای آماده با برند provider یا کانال را import نکنید (برای نمونه
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای همراه subpathهای عمومی SDK را درون barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از آن barrelهای محلی Plugin
  استفاده کنند یا وقتی نیازی واقعا بین‌کانالی است، یک قرارداد عمومی و محدود SDK اضافه کنند.

مجموعه کوچکی از seamهای helper مربوط به Pluginهای همراه هنوز در export map تولیدشده
ظاهر می‌شوند، وقتی کاربرد مالکِ پیگیری‌شده داشته باشند. آن‌ها فقط برای نگهداشت Pluginهای همراه
وجود دارند و مسیرهای import پیشنهادی برای Pluginهای جدیدِ شخص ثالث نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ‌شده برای کاربرد مالکِ پیگیری‌شده حفظ شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
subpathهای عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع subpath

SDK مربوط به Plugin به‌صورت مجموعه‌ای از subpathهای محدود ارائه می‌شود که بر اساس حوزه گروه‌بندی شده‌اند (entry مربوط به Plugin،
کانال، provider، احراز هویت، runtime، capability، حافظه، و helperهای رزروشده
Pluginهای همراه). برای فهرست کامل، به‌صورت گروه‌بندی‌شده و لینک‌شده، به
[subpathهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.

فهرست entrypointهای کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای package از
زیرمجموعه عمومی پس از کم کردن subpathهای محلیِ تست/داخلی repo که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند تولید می‌شوند. برای audit کردن تعداد exportهای عمومی،
`pnpm plugin-sdk:surface` را اجرا کنید. subpathهای عمومی منسوخ‌شده
که به‌اندازه کافی قدیمی هستند و در کد production افزونه‌های همراه استفاده نمی‌شوند، در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` پیگیری می‌شوند؛ barrelهای
re-export منسوخ‌شده گسترده در
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` پیگیری می‌شوند.

## API ثبت

callback به نام `register(api)` یک شیء `OpenClawPluginApi` با این
متدها دریافت می‌کند:

### ثبت capability

| متد                                             | آنچه register می‌کند                   |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متن (LLM)                     |
| `api.registerAgentHarness(...)`                  | اجراکننده agent سطح پایین آزمایشی     |
| `api.registerCliBackend(...)`                    | backend استنتاج CLI محلی              |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                      |
| `api.registerSpeechProvider(...)`                | تبدیل متن به گفتار / سنتز STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | transcription بلادرنگ streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صدای بلادرنگ duplex          |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدیو                 |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                           |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                          |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدیو                           |
| `api.registerWebFetchProvider(...)`              | provider دریافت / scrape وب           |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                           |

### ابزارها و فرمان‌ها

| متد                            | آنچه register می‌کند                            |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار agent (اجباری یا `{ optional: true }`) |
| `api.registerCommand(def)`      | فرمان سفارشی (LLM را دور می‌زند)              |

فرمان‌های Plugin می‌توانند وقتی agent به یک راهنمای کوتاه routing متعلق به فرمان نیاز دارد،
`agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود فرمان نگه دارید؛ policy
ویژه provider یا Plugin را به prompt builderهای هسته اضافه نکنید.

### زیرساخت

| متد                                           | آنچه register می‌کند                    |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook رویداد                             |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway                |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | منتشرکننده discovery برای Gateway محلی |
| `api.registerCli(registrar, opts?)`            | subcommand برای CLI                     |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI قابلیت Node زیر `openclaw nodes`   |
| `api.registerService(service)`                 | سرویس پس‌زمینه                          |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                          |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار در runtime       |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی در مجاورت حافظه     |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزایشی جست‌وجو/خواندن حافظه   |

### hookهای host برای Pluginهای workflow

hookهای host seamهای SDK برای Pluginهایی هستند که باید در چرخه‌عمر host
مشارکت کنند، نه اینکه فقط یک provider، کانال، یا ابزار اضافه کنند. آن‌ها
قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای approval،
دروازه‌های policy workspace، monitorهای پس‌زمینه، wizardهای setup، و Pluginهای همراه UI
نیز می‌توانند.

| متد                                                                      | قراردادی که مالک آن است                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | وضعیت session سازگار با JSON و متعلق به Plugin که از طریق sessionهای Gateway projected می‌شود                                    |
| `api.enqueueNextTurnInjection(...)`                                      | context پایدار exactly-once که برای یک session در turn بعدی agent تزریق می‌شود                                                   |
| `api.registerTrustedToolPolicy(...)`                                     | policy ابزار pre-plugin همراه/مورداعتماد که می‌تواند params ابزار را block یا rewrite کند                                       |
| `api.registerToolMetadata(...)`                                          | metadata نمایش catalog ابزار بدون تغییر implementation ابزار                                                                     |
| `api.registerCommand(...)`                                               | فرمان‌های scoped مربوط به Plugin؛ نتیجه‌های فرمان می‌توانند `continueAgent: true` تنظیم کنند؛ فرمان‌های native Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.registerControlUiDescriptor(...)`                                   | descriptorهای مشارکت Control UI برای سطح‌های session، ابزار، run، یا settings                                                     |
| `api.registerRuntimeLifecycle(...)`                                      | callbackهای cleanup برای منابع runtime متعلق به Plugin در مسیرهای reset/delete/reload                                            |
| `api.registerAgentEventSubscription(...)`                                | subscriptionهای رویداد sanitized برای وضعیت workflow و monitorها                                                                 |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | وضعیت scratch مربوط به Plugin برای هر run که در چرخه‌عمر پایانی run پاک می‌شود                                                   |
| `api.registerSessionSchedulerJob(...)`                                   | رکوردهای job زمان‌بند session متعلق به Plugin با cleanup قطعی                                                                     |

این قراردادها عمدا اختیار را جدا می‌کنند:

- Pluginهای خارجی می‌توانند مالک extensionهای session، descriptorهای UI، فرمان‌ها، metadata ابزار،
  injectionهای turn بعدی، و hookهای معمولی باشند.
- policyهای ابزار مورداعتماد پیش از hookهای معمولی `before_tool_call` اجرا می‌شوند و
  فقط همراه هستند، چون در policy ایمنی host مشارکت می‌کنند.
- مالکیت فرمان رزروشده فقط برای همراه‌هاست. Pluginهای خارجی باید از نام‌ها یا aliasهای
  فرمان خودشان استفاده کنند.
- `allowPromptInjection=false` hookهای تغییردهنده prompt را غیرفعال می‌کند، از جمله
  `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`،
  fieldهای prompt از `before_agent_start` قدیمی، و
  `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| الگوی Plugin                    | hookهای استفاده‌شده                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow تأیید                 | extension session، ادامه فرمان، injection turn بعدی، descriptor UI                                                                  |
| دروازه policy بودجه/workspace | policy ابزار مورداعتماد، metadata ابزار، projection session                                                                         |
| monitor چرخه‌عمر پس‌زمینه      | cleanup چرخه‌عمر runtime، subscription رویداد agent، مالکیت/cleanup زمان‌بند session، مشارکت Heartbeat prompt، descriptor UI        |
| wizard راه‌اندازی یا onboarding | extension session، فرمان‌های scoped، descriptor برای Control UI                                                                      |

<Note>
  namespaceهای admin هسته رزروشده (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` می‌مانند، حتی اگر یک Plugin تلاش کند scope
  محدودتری برای متد gateway اختصاص دهد. برای متدهای متعلق به Plugin،
  prefixهای ویژه Plugin را ترجیح دهید.
</Note>

<Accordion title="زمان استفاده از میان‌افزار نتیجه ابزار">
  Pluginهای همراه می‌توانند از `api.registerAgentToolResultMiddleware(...)` استفاده کنند زمانی که
  لازم است نتیجه یک ابزار را پس از اجرا و پیش از آنکه زمان اجرا
  آن نتیجه را دوباره به مدل بدهد، بازنویسی کنند. این seam مورد اعتماد و بی‌طرف نسبت به زمان اجرا
  برای reducerهای خروجی ناهمگام مانند tokenjuice است.

Pluginهای همراه باید برای هر زمان اجرای هدف، `contracts.agentToolResultMiddleware` را اعلام کنند،
برای مثال `["pi", "codex"]`. Pluginهای خارجی
نمی‌توانند این میان‌افزار را ثبت کنند؛ hookهای معمول Plugin در OpenClaw را برای کارهایی نگه دارید
که به زمان‌بندی نتیجه ابزار پیش از مدل نیاز ندارند. مسیر قدیمی ثبت factory افزونه جاسازی‌شده
مختص Pi حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را
روی یک انتقال کشف محلی مانند mDNS/Bonjour اعلام کند. OpenClaw زمانی که کشف محلی فعال باشد،
سرویس را هنگام راه‌اندازی Gateway فراخوانی می‌کند، درگاه‌های فعلی Gateway و داده‌های راهنمای TXT غیرمحرمانه را
ارسال می‌کند، و handler بازگشتی `stop` را هنگام خاموش شدن Gateway فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT اعلام‌شده را راز یا
احراز هویت تلقی کنند. کشف یک راهنمای مسیریابی است؛ احراز هویت Gateway و pinning TLS همچنان
مالک اعتماد هستند.

### فراداده ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فراداده فرمان می‌پذیرد:

- `commands`: نام‌های فرمان صریح که مالکشان registrar است
- `descriptors`: توصیفگرهای فرمان در زمان parse که برای راهنمای CLI،
  مسیریابی، و ثبت تنبل CLI مربوط به Plugin استفاده می‌شوند
- `parentPath`: مسیر اختیاری فرمان والد برای گروه‌های فرمان تو در تو، مانند
  `["nodes"]`

برای قابلیت‌های node جفت‌شده، ترجیحاً از
`api.registerNodeCliFeature(registrar, opts?)` استفاده کنید. این یک wrapper کوچک پیرامون
`api.registerCli(..., { parentPath: ["nodes"] })` است و فرمان‌هایی مانند
`openclaw nodes canvas` را به قابلیت‌های node صریح و متعلق به Plugin تبدیل می‌کند.

اگر می‌خواهید فرمان Plugin در مسیر معمول CLI ریشه به‌صورت lazy-loaded باقی بماند،
`descriptors`هایی ارائه کنید که همه ریشه‌های فرمان سطح بالا را که آن
registrar آشکار می‌کند پوشش دهند.

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

فرمان‌های تو در تو، فرمان والد resolveشده را به‌عنوان `program` دریافت می‌کنند:

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

فقط زمانی `commands` را به‌تنهایی استفاده کنید که به ثبت تنبل CLI ریشه نیاز ندارید.
آن مسیر سازگاری مشتاقانه همچنان پشتیبانی می‌شود، اما placeholderهای مبتنی بر descriptor را
برای بارگذاری تنبل در زمان parse نصب نمی‌کند.

### ثبت backend در CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد مالک پیکربندی پیش‌فرض برای یک
backend محلی CLI هوش مصنوعی مانند `codex-cli` باشد.

- `id` مربوط به backend به پیشوند provider در ارجاع‌های مدل مانند `codex-cli/gpt-5` تبدیل می‌شود.
- `config` مربوط به backend همان شکل `agents.defaults.cliBackends.<id>` را به کار می‌برد.
- پیکربندی کاربر همچنان اولویت دارد. OpenClaw پیش از اجرای CLI،
  `agents.defaults.cliBackends.<id>` را روی پیش‌فرض Plugin merge می‌کند.
- زمانی از `normalizeConfig` استفاده کنید که یک backend پس از merge به بازنویسی‌های سازگاری نیاز دارد
  (برای مثال نرمال‌سازی شکل‌های قدیمی flag).
- از `resolveExecutionArgs` برای بازنویسی‌های argv محدود به درخواست استفاده کنید که به
  گویش CLI تعلق دارند، مانند نگاشت سطوح thinking در OpenClaw به یک flag effort بومی.

برای راهنمای نگارش سرتاسری، ببینید
[Pluginهای backend در CLI](/fa/plugins/cli-backend-plugins).

### slotهای انحصاری

| متد                                       | آنچه ثبت می‌کند                                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | موتور context (هر بار یکی فعال است). callback مربوط به `assemble()`، `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزودنی‌های prompt را متناسب کند. |
| `api.registerMemoryCapability(capability)` | قابلیت memory یکپارچه                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش prompt مربوط به memory                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`  | resolver برنامه flush مربوط به memory                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`     | adapter زمان اجرای memory                                                                                                                                |

### adapterهای embedding مربوط به memory

| متد                                           | آنچه ثبت می‌کند                            |
| --------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding مربوط به memory برای Plugin فعال |

- `registerMemoryCapability` API انحصاری ترجیحی برای Plugin مربوط به memory است.
- `registerMemoryCapability` می‌تواند `publicArtifacts.listArtifacts(...)` را نیز آشکار کند
  تا Pluginهای همراه بتوانند artifactهای صادرشده memory را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، نه اینکه به layout خصوصی یک
  Plugin مشخص مربوط به memory دسترسی مستقیم پیدا کنند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan`، و
  `registerMemoryRuntime` APIهای انحصاری سازگار با legacy برای Plugin مربوط به memory هستند.
- `MemoryFlushPlan.model` می‌تواند turn مربوط به flush را به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` pin کند، بدون اینکه زنجیره fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` به Plugin فعال memory اجازه می‌دهد یک
  یا چند id مربوط به adapter embedding را ثبت کند (برای مثال `openai`، `gemini`، یا یک id سفارشی
  تعریف‌شده توسط Plugin).
- پیکربندی کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` بر اساس همان idهای adapter ثبت‌شده resolve می‌شود.

### رویدادها و چرخه حیات

| متد                                         | کاری که انجام می‌دهد          |
| ------------------------------------------ | ----------------------------- |
| `api.on(hookName, handler, opts?)`         | hook تایپ‌شده چرخه حیات       |
| `api.onConversationBindingResolved(handler)` | callback برای binding مکالمه |

برای مثال‌ها، نام‌های رایج hook، و semantics مربوط به guard، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

### semantics تصمیم hook

- `before_tool_call`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler مدعی dispatch شود، handlerهای با اولویت پایین‌تر و مسیر پیش‌فرض dispatch مدل رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم تلقی می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: زمانی که به مسیریابی thread/topic ورودی نیاز دارید، از فیلد تایپ‌شده `threadId` استفاده کنید. `metadata` را برای جزئیات اضافه مخصوص channel نگه دارید.
- `message_sending`: پیش از fallback به `metadata` مخصوص channel، از فیلدهای مسیریابی تایپ‌شده `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای وضعیت راه‌اندازی متعلق به Gateway، به‌جای اتکا به hookهای داخلی `gateway:startup`، از `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخه حیات Cron متعلق به Gateway را مشاهده کنید. هنگام sync کردن schedulerهای بیدارباش خارجی، از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را منبع حقیقت برای بررسی‌های موعددار و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id مربوط به Plugin                                                                         |
| `api.name`               | `string`                  | نام نمایشی                                                                                 |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                      |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                     |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                           |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                           |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (snapshot فعال زمان اجرای درون‌حافظه‌ای، زمانی که در دسترس باشد) |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`                                    |
| `api.runtime`            | `PluginRuntime`           | [helperهای زمان اجرا](/fa/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | logger محدود به scope (`debug`، `info`، `warn`، `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/setup پیش از ورود کامل است     |
| `api.resolvePath(input)` | `(string) => string`      | resolve کردن مسیر نسبت به ریشه Plugin                                                     |

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
  هرگز در کد production، Plugin خودتان را از طریق `openclaw/plugin-sdk/<your-plugin>`
  import نکنید. importهای داخلی را از طریق `./api.ts` یا
  `./runtime-api.ts` مسیریابی کنید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطوح عمومی Pluginهای همراه که از طریق فاساد بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts`، و فایل‌های ورودی عمومی مشابه) وقتی OpenClaw از قبل در حال اجرا است،
snapshot پیکربندی runtime فعال را ترجیح می‌دهند. اگر هنوز snapshot runtime وجود نداشته باشد،
به فایل پیکربندی resolve‌شده روی دیسک fallback می‌کنند.
فاسادهای Pluginهای همراهِ بسته‌بندی‌شده باید از طریق بارگذارهای فاساد Plugin در OpenClaw
بارگذاری شوند؛ importهای مستقیم از `dist/extensions/...` از بررسی‌های manifest
و sidecar runtime که نصب‌های بسته‌بندی‌شده برای کدهای متعلق به Plugin استفاده می‌کنند، عبور می‌کنند.

Pluginهای ارائه‌دهنده می‌توانند یک contract barrel باریک و محلیِ Plugin را expose کنند، وقتی یک
helper عمداً ویژهٔ ارائه‌دهنده است و هنوز جای آن در یک subpath عمومی SDK نیست.
نمونه‌های همراه:

- **Anthropic**: seam عمومی `api.ts` / `contract-api.ts` برای helperهای
  stream مربوط به beta-header Claude و `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` builderهای ارائه‌دهنده،
  helperهای مدل پیش‌فرض، و builderهای ارائه‌دهندهٔ realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` builder ارائه‌دهنده
  به‌همراه helperهای onboarding/config را export می‌کند.

<Warning>
  کد production افزونه باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  نیز اجتناب کند. اگر یک helper واقعاً مشترک است، به‌جای coupling دو Plugin به یکدیگر،
  آن را به یک subpath خنثی SDK مانند `openclaw/plugin-sdk/speech`،
  `.../provider-model-shared`، یا سطحی دیگر با محوریت capability ارتقا دهید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقاط ورود" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="helperهای runtime" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل namespace `api.runtime`.
  </Card>
  <Card title="راه‌اندازی و پیکربندی" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، manifestها، و schemaهای پیکربندی.
  </Card>
  <Card title="آزمایش" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای کمکی آزمون و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطوح منسوخ‌شده.
  </Card>
  <Card title="درونیات Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل capability.
  </Card>
</CardGroup>
