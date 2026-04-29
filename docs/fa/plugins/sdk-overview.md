---
read_when:
    - باید بدانید واردسازی را از کدام زیرمسیر SDK انجام دهید
    - شما به مرجعی برای همهٔ متدهای ثبت در OpenClawPluginApi نیاز دارید
    - در حال جست‌وجوی یک خروجی مشخص SDK هستید
sidebarTitle: SDK overview
summary: نقشهٔ واردسازی، مرجع API ثبت، و معماری SDK
title: نمای کلی Plugin SDK
x-i18n:
    generated_at: "2026-04-29T23:18:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7652c2be756dad14792f59f36fa2fc2becd1681454005cf391e401b89999b857
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK مربوط به Plugin قرارداد تایپ‌شده بین Pluginها و هسته است. این صفحه
مرجع **چیزهایی که باید import کنید** و **چیزهایی که می‌توانید ثبت کنید** است.

<Tip>
به‌جای آن دنبال یک راهنمای چگونگی انجام کار هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای ارائه‌دهنده از [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)، و برای Pluginهای ابزار یا hook چرخه عمر از [hookهای Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک subpath مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر subpath یک ماژول کوچک و خودکفا است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای helperهای entry/build ویژه کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترک مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. subpath
`plugin-sdk/channel-config-schema` برای primitiveهای schema مشترک و builder عمومی است. Pluginهای
bundled در OpenClaw از `plugin-sdk/bundled-channel-config-schema` برای schemaهای
کانال bundled نگه‌داشته‌شده استفاده می‌کنند. exportهای سازگاری منسوخ‌شده روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌یک از subpathهای schema bundled الگویی
برای Pluginهای جدید نیست.

<Warning>
  seamهای convenience با برند ارائه‌دهنده یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای bundled، subpathهای عمومی SDK را داخل barrelهای `api.ts` /
  `runtime-api.ts` خود ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان barrelهای محلی Plugin
  استفاده کنند یا وقتی نیاز واقعاً
  میان‌کانالی است، یک قرارداد عمومی و محدود SDK اضافه کنند.

مجموعه کوچکی از seamهای helper مربوط به Pluginهای bundled هنوز در export map تولیدشده
ظاهر می‌شوند، وقتی کاربرد owner آن‌ها ردیابی شده باشد. آن‌ها فقط برای نگهداشت
Pluginهای bundled وجود دارند و مسیرهای import پیشنهادی برای Pluginهای شخص ثالث جدید
نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ‌شده برای کاربرد owner ردیابی‌شده نگه داشته شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
subpathهای عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع subpath

SDK مربوط به Plugin به‌صورت مجموعه‌ای از subpathهای محدود عرضه می‌شود که بر اساس حوزه گروه‌بندی شده‌اند (entry مربوط به Plugin،
کانال، ارائه‌دهنده، احراز هویت، runtime، capability، memory، و helperهای رزروشده
Pluginهای bundled). برای catalog کامل، گروه‌بندی‌شده و لینک‌شده، ببینید:
[subpathهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths).

فهرست تولیدشده شامل بیش از ۲۰۰ subpath در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

## API ثبت

callback مربوط به `register(api)` یک شیء `OpenClawPluginApi` با این
methodها دریافت می‌کند:

### ثبت capability

| Method                                           | چیزی که ثبت می‌کند                    |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متن (LLM)                     |
| `api.registerAgentHarness(...)`                  | اجراکننده آزمایشی agent در سطح پایین |
| `api.registerCliBackend(...)`                    | backend محلی استنتاج CLI              |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                      |
| `api.registerSpeechProvider(...)`                | سنتز تبدیل متن به گفتار / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | transcription بلادرنگ streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | sessionهای صوتی بلادرنگ دوطرفه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدیو                 |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                           |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                          |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدیو                           |
| `api.registerWebFetchProvider(...)`              | ارائه‌دهنده fetch / scrape وب         |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                           |

### ابزارها و commandها

| Method                          | چیزی که ثبت می‌کند                                  |
| ------------------------------- | -------------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار agent (الزامی یا `{ optional: true }`)       |
| `api.registerCommand(def)`      | command سفارشی (LLM را دور می‌زند)                 |

commandهای Plugin می‌توانند وقتی agent به یک hint کوتاه routing متعلق به command نیاز دارد،
`agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود command نگه دارید؛ policy
ویژه ارائه‌دهنده یا Plugin را به prompt builderهای هسته اضافه نکنید.

### زیرساخت

| Method                                         | چیزی که ثبت می‌کند                         |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook رویداد                               |
| `api.registerHttpRoute(params)`                | endpoint HTTP مربوط به Gateway            |
| `api.registerGatewayMethod(name, handler)`     | method RPC مربوط به Gateway               |
| `api.registerGatewayDiscoveryService(service)` | advertiser کشف Gateway محلی               |
| `api.registerCli(registrar, opts?)`            | subcommand مربوط به CLI                   |
| `api.registerService(service)`                 | سرویس پس‌زمینه                            |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                            |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار runtime            |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی مجاور memory           |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزایشی search/read مربوط به memory |

### hookهای host برای Pluginهای workflow

hookهای host، seamهای SDK برای Pluginهایی هستند که باید در چرخه عمر host
مشارکت کنند، نه اینکه فقط یک ارائه‌دهنده، کانال یا ابزار اضافه کنند. آن‌ها
قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای approval،
gateهای policy مربوط به workspace، monitorهای پس‌زمینه، wizardهای setup، و Pluginهای companion
UI نیز می‌توانند.

| Method                                                                   | قراردادی که مالک آن است                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | state session متعلق به Plugin و سازگار با JSON که از طریق sessionهای Gateway projection می‌شود |
| `api.enqueueNextTurnInjection(...)`                                      | context پایدار exactly-once که برای یک session به turn بعدی agent تزریق می‌شود          |
| `api.registerTrustedToolPolicy(...)`                                     | policy ابزار pre-plugin مربوط به bundled/trusted که می‌تواند پارامترهای ابزار را block یا rewrite کند |
| `api.registerToolMetadata(...)`                                          | metadata نمایش catalog ابزار بدون تغییر implementation ابزار                              |
| `api.registerCommand(...)`                                               | commandهای scoped Plugin؛ نتایج command می‌توانند `continueAgent: true` را تنظیم کنند    |
| `api.registerControlUiDescriptor(...)`                                   | descriptorهای مشارکت Control UI برای سطوح session، ابزار، run، یا settings              |
| `api.registerRuntimeLifecycle(...)`                                      | callbackهای cleanup برای منابع runtime متعلق به Plugin در مسیرهای reset/delete/reload   |
| `api.registerAgentEventSubscription(...)`                                | subscriptionهای رویداد پاک‌سازی‌شده برای state و monitorهای workflow                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | state scratch مربوط به Plugin برای هر run که در چرخه عمر terminal run پاک می‌شود        |
| `api.registerSessionSchedulerJob(...)`                                   | recordهای job زمان‌بند session متعلق به Plugin با cleanup قطعی                           |

قراردادها عمداً authority را جدا می‌کنند:

- Pluginهای خارجی می‌توانند مالک session extensionها، descriptorهای UI، commandها، metadata ابزار، تزریق‌های next-turn، و hookهای معمولی باشند.
- policyهای trusted tool قبل از hookهای معمولی `before_tool_call` اجرا می‌شوند و فقط bundled هستند، چون در policy ایمنی host مشارکت می‌کنند.
- مالکیت command رزروشده فقط bundled است. Pluginهای خارجی باید از نام‌ها یا aliasهای command خودشان استفاده کنند.
- `allowPromptInjection=false` hookهای تغییردهنده prompt را غیرفعال می‌کند، از جمله
  `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`،
  فیلدهای prompt از legacy `before_agent_start`، و
  `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| archetype مربوط به Plugin   | hookهای استفاده‌شده                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow تأیید               | session extension، ادامه command، تزریق next-turn، descriptor UI                                                                       |
| gate policy بودجه/workspace  | policy trusted tool، metadata ابزار، projection session                                                                                |
| monitor چرخه عمر پس‌زمینه   | cleanup چرخه عمر runtime، subscription رویداد agent، مالکیت/cleanup زمان‌بند session، مشارکت prompt مربوط به heartbeat، descriptor UI |
| wizard راه‌اندازی یا onboarding | session extension، commandهای scoped، descriptor مربوط به Control UI                                                                   |

<Note>
  namespaceهای admin رزروشده هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` باقی می‌مانند، حتی اگر یک Plugin تلاش کند scope
  محدودتری برای method مربوط به gateway اختصاص دهد. برای methodهای متعلق به Plugin،
  prefixهای ویژه Plugin را ترجیح دهید.
</Note>

<Accordion title="چه زمانی از middleware نتیجه ابزار استفاده کنیم">
  Pluginهای bundled می‌توانند وقتی
  باید نتیجه یک ابزار را پس از اجرا و قبل از اینکه runtime
  آن نتیجه را دوباره به model بدهد rewrite کنند، از `api.registerAgentToolResultMiddleware(...)` استفاده کنند. این seam مورد اعتماد و خنثی نسبت به runtime
  برای reducerهای خروجی async مانند tokenjuice است.

Pluginهای bundled باید برای هر runtime هدف، `contracts.agentToolResultMiddleware` را declare کنند،
برای مثال `["pi", "codex"]`. Pluginهای خارجی
نمی‌توانند این middleware را ثبت کنند؛ برای کاری که به timing نتیجه ابزار pre-model نیاز ندارد،
hookهای معمول OpenClaw Plugin را نگه دارید. مسیر قدیمی ثبت factory مربوط به extension embedded فقط برای Pi
حذف شده است.
</Accordion>

### ثبت discovery مربوط به Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را
روی یک transport کشف محلی مانند mDNS/Bonjour advertise کند. OpenClaw هنگام startup مربوط به
Gateway، وقتی کشف محلی فعال است، سرویس را فراخوانی می‌کند، portهای فعلی
Gateway و داده‌های hint غیرمحرمانه TXT را پاس می‌دهد، و handler برگشتی
`stop` را هنگام shutdown مربوط به Gateway فراخوانی می‌کند.

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

Pluginهای discovery مربوط به Gateway نباید valueهای TXT advertiseشده را secret یا
authentication فرض کنند. Discovery یک hint برای routing است؛ auth مربوط به Gateway و pinning مربوط به TLS همچنان
مالک trust هستند.

### metadata ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع metadata سطح بالا می‌پذیرد:

- `commands`: ریشه‌های دستور صریح که متعلق به ثبت‌کننده هستند
- `descriptors`: توصیف‌گرهای دستور در زمان parse که برای راهنمای CLI ریشه،
  مسیریابی، و ثبت تنبل CLI مربوط به Plugin استفاده می‌شوند

اگر می‌خواهید یک دستور Plugin در مسیر معمول CLI ریشه به‌صورت lazy-loaded باقی بماند،
`descriptors`هایی ارائه کنید که همه ریشه‌های دستور سطح‌بالا را که توسط آن
ثبت‌کننده عرضه می‌شوند پوشش دهند.

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

از `commands` به‌تنهایی فقط وقتی استفاده کنید که به ثبت تنبل CLI ریشه نیاز ندارید.
آن مسیر سازگاری eager همچنان پشتیبانی می‌شود، اما placeholderهای مبتنی بر
توصیف‌گر را برای بارگذاری تنبل در زمان parse نصب نمی‌کند.

### ثبت backend مربوط به CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد مالک پیکربندی پیش‌فرض برای یک
backend محلی CLI هوش مصنوعی مانند `codex-cli` باشد.

- `id` مربوط به backend در ارجاع‌های مدل مانند `codex-cli/gpt-5` به پیشوند provider تبدیل می‌شود.
- `config` مربوط به backend از همان ساختار `agents.defaults.cliBackends.<id>` استفاده می‌کند.
- پیکربندی کاربر همچنان اولویت دارد. OpenClaw پیش از اجرای CLI، `agents.defaults.cliBackends.<id>` را روی پیش‌فرض Plugin ادغام می‌کند.
- وقتی یک backend پس از ادغام به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای مثال نرمال‌سازی شکل‌های قدیمی flag).

### slotهای انحصاری

| متد                                       | چیزی که ثبت می‌کند                                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`  | موتور context (در هر زمان یکی فعال است). callback مربوط به `assemble()` مقدارهای `availableTools` و `citationsMode` را دریافت می‌کند تا موتور بتواند افزوده‌های prompt را تنظیم کند. |
| `api.registerMemoryCapability(capability)` | قابلیت حافظه یکپارچه                                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش prompt حافظه                                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`   | resolver مربوط به برنامه flush حافظه                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`      | adapter زمان اجرای حافظه                                                                                                                                   |

### adapterهای embedding حافظه

| متد                                          | چیزی که ثبت می‌کند                               |
| -------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding حافظه برای Plugin فعال        |

- `registerMemoryCapability` API انحصاری ترجیحی برای Plugin حافظه است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)` را عرضه کند
  تا Pluginهای همراه بتوانند artifactهای حافظه صادرشده را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، به‌جای اینکه وارد چیدمان خصوصی
  یک Plugin حافظه مشخص شوند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan` و
  `registerMemoryRuntime` APIهای انحصاری سازگار با legacy برای Plugin حافظه هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت flush را به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` pin کند، بدون اینکه زنجیره fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` به Plugin حافظه فعال اجازه می‌دهد یک
  یا چند شناسه adapter embedding را ثبت کند (برای مثال `openai`، `gemini`، یا یک شناسه
  سفارشی تعریف‌شده توسط Plugin).
- پیکربندی کاربر مانند `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` نسبت به همان شناسه‌های adapter ثبت‌شده resolve می‌شود.

### رویدادها و چرخه عمر

| متد                                         | کاری که انجام می‌دهد             |
| ------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`          | hook چرخه عمر typed              |
| `api.onConversationBindingResolved(handler)` | callback مربوط به binding مکالمه |

برای نمونه‌ها، نام‌های رایج hook و معنای guard به [hookهای Plugin](/fa/plugins/hooks) مراجعه کنید.

### معنای تصمیم‌گیری hook

- `before_tool_call`: برگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: برگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: برگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: برگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: برگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler مسئولیت dispatch را بپذیرد، handlerهای با اولویت پایین‌تر و مسیر dispatch پیش‌فرض مدل رد می‌شوند.
- `message_sending`: برگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: برگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، از فیلد typed به نام `threadId` استفاده کنید. `metadata` را برای موارد اضافه مخصوص channel نگه دارید.
- `message_sending`: پیش از fallback به `metadata` مخصوص channel، از فیلدهای مسیریابی typed به نام‌های `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای وضعیت startup متعلق به Gateway، به‌جای اتکا به hookهای داخلی `gateway:startup` از `ctx.config`، `ctx.workspaceDir` و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخه عمر cron متعلق به Gateway را مشاهده کنید. هنگام همگام‌سازی زمان‌بندهای wake بیرونی از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را منبع حقیقت برای بررسی‌های due و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | شناسه Plugin                                                                                |
| `api.name`               | `string`                  | نام نمایشی                                                                                  |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                       |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                      |
| `api.source`             | `string`                  | مسیر source مربوط به Plugin                                                                 |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (وقتی موجود باشد، snapshot زمان اجرای درون‌حافظه‌ای فعال)            |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [helperهای زمان اجرا](/fa/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | logger scoped (`debug`، `info`، `warn`، `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت load فعلی؛ `"setup-runtime"` پنجره سبک startup/setup پیش از full-entry است             |
| `api.resolvePath(input)` | `(string) => string`      | resolve کردن مسیر نسبت به ریشه Plugin                                                       |

## قرارداد ماژول داخلی

داخل Plugin خود، برای importهای داخلی از فایل‌های barrel محلی استفاده کنید:

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
  `./runtime-api.ts` هدایت کنید. مسیر SDK فقط قرارداد بیرونی است.
</Warning>

سطوح عمومی bundled Plugin که از طریق facade بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts` و فایل‌های entry عمومی مشابه)، وقتی OpenClaw از قبل در حال اجرا باشد، snapshot پیکربندی زمان اجرای فعال را ترجیح می‌دهند. اگر هنوز
snapshot زمان اجرا وجود نداشته باشد، به فایل پیکربندی resolve‌شده روی دیسک fallback می‌کنند.
facadeهای packaged bundled Plugin باید از طریق loaderهای facade مربوط به SDK OpenClaw بارگذاری شوند؛ import مستقیم از `dist/extensions/...` mirrorهای وابستگی زمان اجرای staged را که نصب‌های packaged برای وابستگی‌های متعلق به Plugin استفاده می‌کنند، دور می‌زند.

Pluginهای provider می‌توانند وقتی یک helper عمداً مخصوص provider است و هنوز به یک
زیرمسیر عمومی SDK تعلق ندارد، یک barrel قرارداد محدود و محلی Plugin عرضه کنند.
نمونه‌های bundled:

- **Anthropic**: مرز عمومی `api.ts` / `contract-api.ts` برای helperهای
  beta-header مربوط به Claude و stream مربوط به `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های provider،
  helperهای مدل پیش‌فرض، و سازنده‌های provider بلادرنگ را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده provider
  به‌همراه helperهای onboarding/config را export می‌کند.

<Warning>
  کد production مربوط به Extension نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک helper واقعاً مشترک است، آن را به یک زیرمسیر خنثای SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا سطح دیگری
  با محوریت capability ارتقا دهید، به‌جای اینکه دو Plugin را به هم وابسته کنید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقطه‌های entry" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="helperهای زمان اجرا" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل namespace مربوط به `api.runtime`.
  </Card>
  <Card title="setup و config" icon="sliders" href="/fa/plugins/sdk-setup">
    packaging، manifestها، و schemaهای config.
  </Card>
  <Card title="آزمون" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای آزمون و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطوح deprecated.
  </Card>
  <Card title="داخلیات Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل capability.
  </Card>
</CardGroup>
