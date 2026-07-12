---
read_when:
    - باید بدانید از کدام زیرمسیر SDK واردسازی کنید
    - شما مرجعی برای همهٔ روش‌های ثبت در `OpenClawPluginApi` می‌خواهید
    - در حال جست‌وجوی یک خروجی مشخص SDK هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ واردسازی، مرجع API ثبت و معماری SDK
title: نمای کلی SDK افزونه
x-i18n:
    generated_at: "2026-07-12T10:39:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK مربوط به Plugin، قرارداد نوع‌دار میان Pluginها و هسته است. این صفحه مرجع **مواردی است که باید وارد کنید** و **مواردی که می‌توانید ثبت کنید**.

<Note>
  این صفحه برای نویسندگان Plugin است که در OpenClaw از `openclaw/plugin-sdk/*`
  استفاده می‌کنند. برنامه‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و
  افزونه‌های IDE که می‌خواهند عامل‌ها را از طریق Gateway اجرا کنند، باید به‌جای
  آن از [یکپارچه‌سازی Gateway برای برنامه‌های خارجی](/fa/gateway/external-apps) استفاده کنند.
</Note>

<Tip>
در عوض به‌دنبال یک راهنمای عملی هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید. برای کانال‌ها از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای ارائه‌دهندگان مدل از [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)، برای پشتیبان‌های محلی CLI هوش مصنوعی از [Pluginهای پشتیبان CLI](/fa/plugins/cli-backend-plugins)، برای اجراکننده‌های بومی عامل از [Pluginهای مهار عامل](/fa/plugins/sdk-agent-harness) و برای هوک‌های ابزار یا چرخهٔ حیات از [هوک‌های Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد واردکردن

همیشه از یک زیرمسیر مشخص وارد کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر زیرمسیر یک ماژول کوچک و خودبسنده است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی دوری جلوگیری می‌کند. برای کمک‌تابع‌های ورودی/ساخت مختص کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح فراگیرتر و کمک‌تابع‌های مشترکی مانند `buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. زیرمسیر
`plugin-sdk/channel-config-schema` برای اجزای ابتدایی مشترک طرح‌واره و سازندهٔ
عمومی است. Pluginهای همراه OpenClaw برای طرح‌واره‌های حفظ‌شدهٔ کانال‌های همراه
از `plugin-sdk/bundled-channel-config-schema` استفاده می‌کنند. خروجی‌های سازگاری
منسوخ‌شده در `plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌یک از
زیرمسیرهای طرح‌وارهٔ همراه الگویی برای Pluginهای جدید نیستند.

<Warning>
  رابط‌های تسهیل‌کنندهٔ وابسته به برند ارائه‌دهنده یا کانال را وارد نکنید
  (برای مثال `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`،
  `.../whatsapp`). Pluginهای همراه، زیرمسیرهای عمومی SDK را در barrelهای
  `api.ts` / `runtime-api.ts` خود ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از
  همان barrelهای محلی Plugin استفاده کنند یا، هنگامی که نیازی واقعاً میان
  کانال‌ها مشترک است، یک قرارداد عمومی و محدود SDK بیفزایند.

مجموعهٔ کوچکی از رابط‌های کمک‌تابع Pluginهای همراه، هنگامی که استفادهٔ ردیابی‌شده‌ای
از سوی مالک دارند، همچنان در نگاشت خروجی تولیدشده ظاهر می‌شوند. این رابط‌ها فقط
برای نگه‌داری Pluginهای همراه وجود دارند و مسیرهای واردکردن توصیه‌شده برای
Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز به‌عنوان
نماهای سازگاری منسوخ‌شده برای استفادهٔ ردیابی‌شدهٔ مالک حفظ شده‌اند. این مسیرهای
واردکردن را در Pluginهای جدید کپی نکنید؛ در عوض از کمک‌تابع‌های زمان اجرا که
تزریق شده‌اند و زیرمسیرهای عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع زیرمسیرها

SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود و گروه‌بندی‌شده بر اساس
حوزه ارائه می‌شود (ورودی Plugin، کانال، ارائه‌دهنده، احراز هویت، زمان اجرا،
قابلیت، حافظه و کمک‌تابع‌های رزروشدهٔ Pluginهای همراه). برای مشاهدهٔ فهرست کامل
که گروه‌بندی و پیونددهی شده است، به
[زیرمسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.

فهرست نقاط ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های بسته پس از کسر
زیرمسیرهای آزمون/داخلیِ محلی مخزن که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند، از
زیرمجموعهٔ عمومی تولید می‌شوند. برای ممیزی تعداد خروجی‌های عمومی،
`pnpm plugin-sdk:surface` را اجرا کنید. زیرمسیرهای عمومی منسوخ‌شده‌ای که به‌اندازهٔ
کافی قدیمی هستند و کد عملیاتی افزونه‌های همراه از آن‌ها استفاده نمی‌کند، در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ردیابی می‌شوند؛
barrelهای گستردهٔ بازصدور منسوخ‌شده در
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` ردیابی می‌شوند.

## API ثبت

فراخوان برگشتی `register(api)` یک شیء `OpenClawPluginApi` با متدهای زیر دریافت
می‌کند:

### ثبت قابلیت‌ها

| متد                                             | موردی که ثبت می‌کند                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                     | استنتاج متن (LLM)                                                                |
| `api.registerWorkerProvider(...)`               | اجاره‌های چرخهٔ حیات کارگر ابری                                                  |
| `api.registerModelCatalogProvider(...)`         | ردیف‌های فهرست مدل برای تولید متن و رسانه                                        |
| `api.registerAgentHarness(...)`                 | اجراکنندهٔ بومی عامل [آزمایشی](/fa/plugins/sdk-agent-harness) (Codex، Copilot)       |
| `api.registerCliBackend(...)`                   | پشتیبان محلی استنتاج CLI                                                         |
| `api.registerChannel(...)`                      | کانال پیام‌رسانی                                                                 |
| `api.registerEmbeddingProvider(...)`            | ارائه‌دهندهٔ قابل‌استفادهٔ مجدد برای تعبیهٔ برداری                               |
| `api.registerSpeechProvider(...)`               | سنتز متن‌به‌گفتار / STT                                                          |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی بلادرنگ جریانی                                                           |
| `api.registerRealtimeVoiceProvider(...)`        | نشست‌های صوتی بلادرنگ دوسویه                                                     |
| `api.registerMediaUnderstandingProvider(...)`   | تحلیل تصویر/صدا/ویدئو                                                            |
| `api.registerTranscriptSourceProvider(...)`     | منبع زنده یا واردشدهٔ رونویسی جلسه                                               |
| `api.registerImageGenerationProvider(...)`      | تولید تصویر                                                                      |
| `api.registerMusicGenerationProvider(...)`      | تولید موسیقی                                                                     |
| `api.registerVideoGenerationProvider(...)`      | تولید ویدئو                                                                      |
| `api.registerWebFetchProvider(...)`             | ارائه‌دهندهٔ واکشی / استخراج وب                                                  |
| `api.registerWebSearchProvider(...)`            | جست‌وجوی وب                                                                      |
| `api.registerCompactionProvider(...)`           | پشتیبان قابل‌تعویض Compaction رونویسی                                            |

ارائه‌دهندگان کارگر باید شناسهٔ خود را نیز در `contracts.workerProviders` اعلام
کنند. هسته پیش از `provision(profile, operationId)` قصد پایدار را ذخیره می‌کند.
ارائه‌دهندگان باید پیش از تخصیص خارجی، تنظیمات را اعتبارسنجی کنند و در صورت رد
دائمی نمایه، `WorkerProviderError` ایجاد کنند. وقتی شناسهٔ عملیات تکرار می‌شود،
`provision` باید همان اجاره را اختیار کند.
هسته تنظیمات اعتبارسنجی‌شدهٔ نمایه را همراه اجاره ذخیره می‌کند و آن تصویر لحظه‌ای
را به `destroy({ leaseId, profile })`، که باید توان اجرای چندباره بدون تغییر
نتیجه را داشته باشد، و `inspect({ leaseId, profile })` ارائه می‌دهد؛ متد دوم یکی
از مقادیر `active`، `destroyed` یا `unknown` را برمی‌گرداند. این کار به
ارائه‌دهندگان اجازه می‌دهد پس از راه‌اندازی مجدد Gateway یا حذف نمایهٔ نام‌گذاری‌شده،
فراخوانی‌های چرخهٔ حیات را مسیریابی کنند. نقاط پایانی SSH برای `keyRef` از
`SecretRef` استفاده می‌کنند، هرگز محتوای کلید را به‌صورت درون‌خطی قرار نمی‌دهند
و یک `hostKey` برگرفته از خروجی مورداعتماد تأمین را دقیقاً با قالب
`algorithm base64`، بدون نام میزبان یا توضیح، شامل می‌شوند. هسته `hostKey` را
ثابت می‌کند و هرگز به کلیدی که از نخستین اتصال دریافت شده باشد اعتماد نمی‌کند.
ارائه‌دهنده‌ای که یک `keyRef` پویا ایجاد می‌کند می‌تواند
`resolveSshIdentity({ leaseId, profile, keyRef })` را پیاده‌سازی کند؛ در صورت
وجود، این حل‌کننده مرجع نهایی است، درحالی‌که ارائه‌دهندگان فاقد آن از حل‌کنندهٔ
عمومی راز پیکربندی‌شده استفاده می‌کنند.
ارائه‌دهندگانی که اجاره‌های قابل تمدید دارند، می‌توانند `renew(leaseId)` را نیز
پیاده‌سازی کنند.
`inspect` باید در شکست‌های موقت یا نامعین خطا ایجاد کند؛ فقط برای نبود قطعی
`unknown` را برگرداند. هسته یک رکورد محلی فعال را یتیم علامت‌گذاری می‌کند، یا پس
از درخواست حذف ذخیره‌شده، نبود آن را به‌منزلهٔ تکمیل برچیدن در نظر می‌گیرد.

ارائه‌دهندگان تعبیه که با `api.registerEmbeddingProvider(...)` ثبت شده‌اند، باید
در مانیفست Plugin نیز در `contracts.embeddingProviders` فهرست شوند. این سطح
عمومی تعبیه برای تولید بردار قابل‌استفادهٔ مجدد است. جست‌وجوی حافظه می‌تواند این
سطح عمومی ارائه‌دهنده را مصرف کند. رابط قدیمی‌تر
`api.registerMemoryEmbeddingProvider(...)` و
`contracts.memoryEmbeddingProviders` یک سازگاری منسوخ‌شده است که تا زمان مهاجرت
ارائه‌دهندگان فعلی مختص حافظه حفظ می‌شود.

ارائه‌دهندگان مختص حافظه که همچنان `batchEmbed(...)` را در زمان اجرا ارائه
می‌کنند، روی قرارداد فعلی دسته‌بندی به‌ازای هر فایل باقی می‌مانند، مگر اینکه
زمان اجرای آن‌ها صراحتاً `sourceWideBatchEmbed: true` را تنظیم کند. این انتخاب
به میزبان حافظه اجازه می‌دهد قطعه‌های چند فایل حافظهٔ تغییریافته و منابع
فعال‌شده را، تا سقف محدودیت دستهٔ میزبان، در یک فراخوانی `batchEmbed(...)`
ارسال کند. مبدل‌های دسته‌ای که فایل‌های درخواست JSONL را بارگذاری می‌کنند، باید
کارهای ارائه‌دهنده را هم پیش از سقف اندازهٔ بارگذاری و هم پیش از سقف تعداد
درخواست تقسیم کنند. ارائه‌دهنده باید به‌ازای هر قطعهٔ ورودی، یک تعبیه را با همان
ترتیب `batch.chunks` برگرداند؛ هنگامی که ارائه‌دهنده انتظار دسته‌های محلی فایل
را دارد یا نمی‌تواند ترتیب ورودی را در یک کار گسترده‌تر در سطح منبع حفظ کند،
این پرچم را حذف کنید.

### ابزارها و فرمان‌ها

برای Pluginهای ساده و صرفاً ابزاری با نام ابزارهای ثابت، از
[`defineToolPlugin`](/fa/plugins/tool-plugins) استفاده کنید. برای Pluginهای ترکیبی
یا ثبت کاملاً پویای ابزار، مستقیماً از `api.registerTool(...)` استفاده کنید.

| متد                                    | موردی که ثبت می‌کند                                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | ابزار عامل (الزامی یا `{ optional: true }`)                                                                                               |
| `api.registerCommand(def)`             | فرمان سفارشی (LLM را دور می‌زند)                                                                                                          |
| `api.registerNodeHostCommand(command)` | فرمانی که `openclaw node run` مدیریت می‌کند؛ فرادادهٔ اختیاری `agentTool` می‌تواند هنگام اتصال Node آن را به‌صورت ابزاری قابل‌مشاهده برای عامل ارائه کند |

فرمان‌های Plugin می‌توانند زمانی که عامل به یک راهنمای کوتاه برای مسیریابیِ
متعلق به فرمان نیاز دارد، `agentPromptGuidance` را تنظیم کنند. آن متن را به خود
فرمان محدود کنید؛ سیاست مختص ارائه‌دهنده یا Plugin را به سازنده‌های پیام هسته
اضافه نکنید.

ورودی‌های راهنما می‌توانند رشته‌های قدیمی باشند که بر همهٔ سطوح پیام اعمال
می‌شوند، یا ورودی‌های ساختاریافته:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

مقدار ساختاریافتهٔ `surfaces` می‌تواند شامل `openclaw_main`،
`codex_app_server`، `cli_backend`، `acp_backend` یا `subagent` باشد. `pi_main`
همچنان یک نام مستعار منسوخ‌شده برای `openclaw_main` است. برای راهنمایی‌ای که
عمداً باید روی همهٔ سطوح اعمال شود، `surfaces` را حذف کنید. آرایهٔ خالی
`surfaces` را ارسال نکنید؛ این مقدار رد می‌شود تا از تبدیل ناخواستهٔ از دست رفتن
محدوده به متن سراسری پیام جلوگیری شود.

دستورالعمل‌های توسعه‌دهندهٔ بومی سرور برنامهٔ Codex از سایر سطوح پیام سخت‌گیرانه‌تر
هستند: فقط راهنمایی‌ای که صراحتاً به `codex_app_server` محدود شده باشد، به آن
مسیر با اولویت بالاتر ارتقا می‌یابد. راهنمایی رشته‌ای قدیمی و راهنمایی
ساختاریافتهٔ بدون محدوده، برای حفظ سازگاری همچنان در دسترس سطوح پیام غیر Codex
قرار دارند.

دستورهای میزبان Node روی میزبان Node متصل اجرا می‌شوند، نه درون فرایند Gateway.
اگر `agentTool` وجود داشته باشد، Node پس از اتصال موفق به Gateway یک توصیف‌گر
منتشر می‌کند؛ Gateway فقط تا زمانی که آن Node متصل است و فقط در صورتی آن را
در اختیار اجراهای عامل قرار می‌دهد که `command` توصیف‌گر در سطح دستورهای
تأییدشدهٔ Node باشد. برای افزودن یک دستور غیرخطرناک به فهرست مجاز پیش‌فرض
دستورهای Node، `agentTool.defaultPlatforms` را تنظیم کنید؛ در غیر این صورت،
`gateway.nodes.allowCommands` صریح یا یک سیاست فراخوانی Node الزامی است.
`agentTool.name` باید برای ارائه‌دهنده ایمن باشد: با یک حرف آغاز شود، فقط از
حروف، ارقام، زیرخط یا خط تیره استفاده کند و حداکثر ۶۴ نویسه داشته باشد.
ابزارهای Node مبتنی بر MCP می‌توانند فرادادهٔ `agentTool.mcp` را تنظیم کنند تا
سطوح کاتالوگ و جست‌وجوی ابزار بتوانند هویت سرور/ابزار MCP راه دور را نمایش
دهند، اما اجرا همچنان از طریق دستور اعلام‌شدهٔ Node انجام می‌شود.

### زیرساخت

| متد                                             | آنچه ثبت می‌کند                                              |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | هوک رویداد                                                   |
| `api.registerHttpRoute(params)`                 | نقطهٔ پایانی HTTP در Gateway                                 |
| `api.registerGatewayMethod(name, handler)`      | متد RPC در Gateway                                           |
| `api.registerGatewayDiscoveryService(service)`  | اعلان‌کنندهٔ کشف Gateway محلی                                |
| `api.registerCli(registrar, opts?)`             | زیردستور CLI                                                 |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI قابلیت Node زیر `openclaw nodes`                         |
| `api.registerService(service)`                  | سرویس پس‌زمینه                                               |
| `api.registerInteractiveHandler(registration)`  | کنترل‌کنندهٔ تعاملی                                          |
| `api.registerAgentToolResultMiddleware(...)`    | میان‌افزار نتیجهٔ ابزار در زمان اجرا                         |
| `api.registerMemoryPromptSupplement(builder)`   | بخش افزودهٔ پرامپت در مجاورت حافظه                           |
| `api.registerMemoryCorpusSupplement(adapter)`   | پیکرهٔ افزوده برای جست‌وجو/خواندن حافظه                      |
| `api.registerHostedMediaResolver(resolver)`     | حل‌کنندهٔ نشانی‌های رسانهٔ میزبانی‌شده به سبک مرورگر         |
| `api.registerTextTransforms(transforms)`        | بازنویسی‌های متنی سازگاری پرامپت/پیام تحت مالکیت Plugin      |
| `api.registerConfigMigration(migrate)`          | مهاجرت سبک پیکربندی که پیش از بارگذاری زمان اجرای Plugin اجرا می‌شود |
| `api.registerMigrationProvider(provider)`       | واردکننده برای `openclaw migrate`                            |
| `api.registerAutoEnableProbe(probe)`            | کاوشگر پیکربندی که می‌تواند این Plugin را خودکار فعال کند    |
| `api.registerReload(registration)`              | سیاست پیشوند پیکربندی راه‌اندازی مجدد/بارگذاری گرم/بدون عملیات برای مدیریت بارگذاری مجدد |
| `api.registerNodeHostCommand(command)`          | کنترل‌کنندهٔ دستوری که در اختیار Nodeهای جفت‌شده قرار می‌گیرد |
| `api.registerNodeInvokePolicy(policy)`          | سیاست فهرست مجاز/تأیید برای دستورهایی که Node فراخوانی می‌کند |
| `api.registerSecurityAuditCollector(collector)` | گردآورندهٔ یافته‌ها برای `openclaw security audit`           |

سازنده‌های افزونهٔ پرامپت حافظه، زمینهٔ اختیاری `agentId`،
`agentSessionKey` و `sandboxed` را دریافت می‌کنند. فراخوانی‌های `search`
و `get` در افزونهٔ پیکرهٔ حافظه نیز زمینهٔ اختیاری `agentId` و `sandboxed`
را دریافت می‌کنند. Pluginهایی که فضای ذخیره‌سازی متعلق به عامل دارند باید
این فضا را برای هر فراخوانی جداگانه حل کنند، نه اینکه هنگام ثبت یک مسیر
سراسری را ذخیره کنند. اگر در عملیاتی چندعاملی شناسهٔ عامل لازم باشد اما
وجود نداشته باشد، به‌جای انتخاب یک عامل دلخواه، عملیات را به‌صورت بسته
ناموفق کنید.

کنترل‌کننده‌های تعاملی Telegram می‌توانند `{ submitText }` را برگردانند تا پس
از موفقیت کنترل‌کننده، متن از مسیر ورودی عادی عامل در Telegram عبور کند.
هنگامی که سیاست ورودی متن را نادیده می‌گیرد یا پردازش شکست می‌خورد، OpenClaw
دکمهٔ بازفراخوانی را نگه می‌دارد تا کاربر پس از تغییر وضعیت مسدودکننده دوباره
تلاش کند. این فیلد نتیجه مخصوص Telegram است؛ کانال‌های دیگر قراردادهای
نتیجهٔ تعاملی خود را حفظ می‌کنند.

### هوک‌های میزبان برای Pluginهای گردش کار

هوک‌های میزبان، درزهای SDK برای Pluginهایی هستند که باید در چرخهٔ عمر میزبان
مشارکت کنند، نه اینکه فقط یک ارائه‌دهنده، کانال یا ابزار اضافه کنند. این‌ها
قراردادهایی عمومی هستند؛ حالت برنامه‌ریزی می‌تواند از آن‌ها استفاده کند، اما
گردش‌های کار تأیید، دروازه‌های سیاست فضای کاری، پایشگرهای پس‌زمینه، راهنماهای
راه‌اندازی و Pluginهای همراه رابط کاربری نیز می‌توانند از آن‌ها بهره ببرند.

| متد                                                                                  | قراردادی که مالک آن است                                                                                                                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | وضعیت نشست متعلق به Plugin و سازگار با JSON که از طریق نشست‌های Gateway بازتاب داده می‌شود                                                                  |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | زمینهٔ ماندگار و دقیقاً یک‌بار که برای یک نشست به نوبت بعدی عامل تزریق می‌شود                                                                                |
| `api.registerTrustedToolPolicy(...)`                                                 | سیاست مورداعتماد ابزار پیش از Plugin که به مانیفست محدود است و می‌تواند پارامترهای ابزار را مسدود یا بازنویسی کند                                            |
| `api.registerToolMetadata(...)`                                                      | فرادادهٔ نمایشی کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                                                                   |
| `api.registerCommand(...)`                                                           | دستورهای Plugin با دامنهٔ محدود؛ نتایج دستور می‌توانند `continueAgent: true` یا `suppressReply: true` را تنظیم کنند؛ دستورهای بومی Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.session.controls.registerControlUiDescriptor(...)`                              | توصیف‌گرهای مشارکت در رابط کاربری کنترل برای سطوح نشست، ابزار، اجرا، تنظیمات یا زبانه                                                                         |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | بازفراخوانی‌های پاک‌سازی منابع زمان اجرای متعلق به Plugin در مسیرهای بازنشانی/حذف/بارگذاری مجدد                                                             |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراک‌های رویداد پالایش‌شده برای وضعیت گردش کار و پایشگرها                                                                                                 |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | وضعیت موقت Plugin به‌ازای هر اجرا که در چرخهٔ عمر پایانی اجرا پاک می‌شود                                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | فرادادهٔ پاک‌سازی کارهای زمان‌بند متعلق به Plugin؛ کاری را زمان‌بندی نمی‌کند و رکورد وظیفه نمی‌سازد                                                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تحویل پیوست فایل با میانجی‌گری میزبان، فقط برای Pluginهای همراه، به مسیر فعال خروجی مستقیم نشست                                                             |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | نوبت‌های زمان‌بندی‌شدهٔ نشست مبتنی بر Cron، فقط برای Pluginهای همراه، به‌همراه پاک‌سازی بر اساس برچسب                                                      |
| `api.session.controls.registerSessionAction(...)`                                    | کنش‌های نوع‌دار نشست که کارخواه‌ها می‌توانند از طریق Gateway ارسال کنند                                                                                     |

یک توصیف‌گر `surface: "tab"` یک زبانهٔ نوار کناری به رابط کاربری کنترل اضافه
می‌کند. توصیف‌گرهای زبانهٔ Pluginهای فعال در پیام آغازین gateway
(`controlUiTabs`) به کارخواه‌های داشبورد اعلام می‌شوند؛ بنابراین زبانه فقط
هنگامی ظاهر می‌شود که Plugin فعال باشد. Pluginهای همراه می‌توانند یک نمای
داشبورد درجه‌یک برای زبانهٔ خود ارائه دهند؛ Pluginهای دیگر می‌توانند `path`
را روی یک مسیر HTTP متعلق به Plugin تنظیم کنند (به
`api.registerHttpRoute(...)` مراجعه کنید) تا داشبورد آن را در یک قاب
ایزوله‌شده نمایش دهد. `icon` راهنمای نام نماد داشبورد است، `group` بخش نوار
کناری (`control` یا `agent`) را انتخاب می‌کند، `order` ترتیب میان زبانه‌های
Plugin را تعیین می‌کند و `requiredScopes` زبانه را از اتصال‌هایی که فاقد آن
دامنه‌های اپراتور هستند پنهان می‌کند:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

برای کد جدید Plugin از فضای نام گروه‌بندی‌شده استفاده کنید:

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

متدهای مسطح معادل همچنان به‌عنوان نام‌های مستعار سازگاری منسوخ‌شده برای
Pluginهای موجود در دسترس‌اند. کد جدید Plugin اضافه نکنید که مستقیماً
`api.registerSessionExtension`، `api.enqueueNextTurnInjection`،
`api.registerControlUiDescriptor`، `api.registerRuntimeLifecycle`،
`api.registerAgentEventSubscription`، `api.emitAgentEvent`،
`api.setRunContext`، `api.getRunContext`، `api.clearRunContext`،
`api.registerSessionSchedulerJob`، `api.registerSessionAction`،
`api.sendSessionAttachment`، `api.scheduleSessionTurn` یا
`api.unscheduleSessionTurnsByTag` را فراخوانی کند.

`scheduleSessionTurn(...)` یک میان‌بر با دامنهٔ نشست بر فراز زمان‌بند Cron در
Gateway است. Cron زمان‌بندی را بر عهده دارد و هنگام اجرای نوبت، رکورد وظیفهٔ
پس‌زمینه را ایجاد می‌کند؛ SDKِ Plugin فقط نشست هدف، نام‌گذاری متعلق به Plugin
و پاک‌سازی را محدود می‌کند. هنگامی که خود کار به وضعیت ماندگار چندمرحله‌ای
جریان وظیفه نیاز دارد، درون نوبت زمان‌بندی‌شده از
`api.runtime.tasks.managedFlows` استفاده کنید.

قراردادها عمداً اختیار را تفکیک می‌کنند:

- Pluginهای خارجی می‌توانند مالک افزونه‌های نشست، توصیف‌گرهای رابط کاربری،
  دستورها، فرادادهٔ ابزار، تزریق‌های نوبت بعد و هوک‌های عادی باشند.
- سیاست‌های مورداعتماد ابزار پیش از هوک‌های معمولی `before_tool_call` اجرا
  می‌شوند و مورداعتماد میزبان هستند. سیاست‌های همراه ابتدا اجرا می‌شوند؛
  سیاست‌های Pluginهای نصب‌شده به فعال‌سازی صریح و همچنین شناسه‌های محلی خود
  در `contracts.trustedToolPolicies` نیاز دارند و سپس به‌ترتیب بارگذاری
  Plugin اجرا می‌شوند. شناسه‌های سیاست به Plugin ثبت‌کننده محدودند.
- مالکیت دستورهای رزروشده فقط برای موارد همراه است. Pluginهای خارجی باید از
  نام‌ها یا نام‌های مستعار دستور خود استفاده کنند.
- `allowPromptInjection=false` هوک‌های تغییردهندهٔ پرامپت، از جمله
  `agent_turn_prepare`، `before_prompt_build`،
  `heartbeat_prompt_contribution`، فیلدهای پرامپت از
  `before_agent_start` قدیمی و `enqueueNextTurnInjection` را غیرفعال می‌کند.

نمونه‌هایی از مصرف‌کنندگان غیرمرتبط با حالت برنامه‌ریزی:

| کهن‌الگوی Plugin            | هوک‌های استفاده‌شده                                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| گردش‌کار تأیید              | گسترش نشست، ادامهٔ فرمان، تزریق در نوبت بعدی، توصیف‌گر رابط کاربری                                                                                  |
| دروازهٔ سیاست بودجه/فضای کار | سیاست ابزار مورداعتماد، فرادادهٔ ابزار، تصویر نشست                                                                                                  |
| پایشگر چرخهٔ حیات پس‌زمینه   | پاک‌سازی چرخهٔ حیات زمان اجرا، اشتراک رویداد عامل، مالکیت/پاک‌سازی زمان‌بند نشست، مشارکت در پرامپت Heartbeat، توصیف‌گر رابط کاربری                     |
| راهنمای راه‌اندازی یا شروع‌به‌کار | گسترش نشست، فرمان‌های محدود به دامنه، توصیف‌گر رابط کاربری کنترل                                                                                   |

<Note>
  فضاهای نام مدیریتی رزروشدهٔ هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه در سطح `operator.admin` باقی می‌مانند، حتی اگر یک Plugin
  تلاش کند دامنهٔ محدودتری برای متد Gateway تعیین کند. برای متدهای متعلق به
  Plugin، پیشوندهای مختص همان Plugin را ترجیح دهید.
</Note>

<Accordion title="زمان استفاده از میان‌افزار نتیجهٔ ابزار">
  Pluginهای همراه و Pluginهای نصب‌شده‌ای که صراحتاً فعال شده‌اند و قراردادهای
  مانیفست منطبق دارند، وقتی لازم است نتیجهٔ ابزار را پس از اجرا و پیش از آنکه
  زمان اجرا آن را دوباره به مدل بدهد بازنویسی کنند، می‌توانند از
  `api.registerAgentToolResultMiddleware(...)` استفاده کنند. این درز مورداعتماد
  و مستقل از زمان اجرا برای کاهش‌دهنده‌های خروجی ناهمگام مانند tokenjuice است.

Pluginها باید برای هر زمان اجرای هدف، `contracts.agentToolResultMiddleware` را
اعلام کنند؛ برای نمونه `["openclaw", "codex"]`. Pluginهای نصب‌شده‌ای که این
قرارداد یا فعال‌سازی صریح را ندارند، نمی‌توانند این میان‌افزار را ثبت کنند؛
برای کارهایی که به زمان‌بندی نتیجهٔ ابزار پیش از مدل نیاز ندارند، از هوک‌های
عادی Plugin در OpenClaw استفاده کنید. مسیر قدیمی ثبت کارخانهٔ افزونه که فقط
برای اجراکنندهٔ توکار بود، حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin امکان می‌دهد Gateway
فعال را در یک انتقال کشف محلی مانند mDNS/Bonjour تبلیغ کند. وقتی کشف محلی فعال
باشد، OpenClaw این سرویس را هنگام راه‌اندازی Gateway فراخوانی می‌کند، درگاه‌های
فعلی Gateway و داده‌های راهنمای غیرمحرمانهٔ TXT را به آن می‌دهد و هنگام خاموش
شدن Gateway، کنترل‌کنندهٔ `stop` بازگردانده‌شده را فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT تبلیغ‌شده را محرمانه یا احراز هویت تلقی
کنند. کشف فقط یک راهنمای مسیریابی است؛ احراز هویت Gateway و تثبیت TLS همچنان
مالک اعتماد هستند.

### فرادادهٔ ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فرادادهٔ فرمان را می‌پذیرد:

- `commands`: نام‌های صریح فرمان که متعلق به ثبت‌کننده هستند
- `descriptors`: توصیف‌گرهای فرمان هنگام تجزیه که برای راهنمای CLI،
  مسیریابی و ثبت تنبل CLI متعلق به Plugin استفاده می‌شوند
- `parentPath`: مسیر اختیاری فرمان والد برای گروه‌های فرمان تو‌در‌تو، مانند
  `["nodes"]`

برای قابلیت‌های Node جفت‌شده، `api.registerNodeCliFeature(registrar, opts?)` را
ترجیح دهید. این یک پوشش کوچک پیرامون
`api.registerCli(..., { parentPath: ["nodes"] })` است و فرمان‌هایی مانند
`openclaw nodes canvas` را به‌صراحت به‌عنوان قابلیت‌های Node متعلق به Plugin
مشخص می‌کند.

اگر می‌خواهید یک فرمان Plugin در مسیر عادی CLI ریشه به‌صورت تنبل بارگذاری شود،
`descriptors`ای ارائه کنید که تمام ریشه‌های فرمان سطح بالای عرضه‌شده توسط آن
ثبت‌کننده را پوشش دهند.

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

فرمان‌های تو‌در‌تو، فرمان والد حل‌شده را به‌عنوان `program` دریافت می‌کنند:

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

تنها زمانی فقط از `commands` استفاده کنید که به ثبت تنبل CLI ریشه نیاز ندارید.
این مسیر سازگاری مشتاقانه همچنان پشتیبانی می‌شود، اما جای‌نگهدارهای مبتنی بر
توصیف‌گر را برای بارگذاری تنبل هنگام تجزیه نصب نمی‌کند.

### ثبت پشتیبان CLI

`api.registerCliBackend(...)` به یک Plugin امکان می‌دهد مالک پیکربندی پیش‌فرض
یک پشتیبان محلی CLI هوش مصنوعی مانند `claude-cli` یا `my-cli` باشد.

- `id` پشتیبان به پیشوند ارائه‌دهنده در ارجاع‌های مدل مانند `my-cli/gpt-5` تبدیل می‌شود.
- `config` پشتیبان از همان ساختار `agents.defaults.cliBackends.<id>` استفاده می‌کند.
- پیکربندی کاربر همچنان اولویت دارد. OpenClaw پیش از اجرای CLI،
  `agents.defaults.cliBackends.<id>` را روی مقدار پیش‌فرض Plugin ادغام می‌کند.
- وقتی یک پشتیبان پس از ادغام به بازنویسی‌های سازگاری نیاز دارد، از
  `normalizeConfig` استفاده کنید؛ برای نمونه، عادی‌سازی ساختارهای قدیمی پرچم.
- برای بازنویسی‌های argv محدود به درخواست که متعلق به گویش CLI هستند، از
  `resolveExecutionArgs` استفاده کنید؛ مانند نگاشت سطوح تفکر OpenClaw به یک
  پرچم تلاش بومی. این هوک `ctx.executionMode` را دریافت می‌کند؛ برای افزودن
  پرچم‌های جداسازی بومی پشتیبان به فراخوانی‌های موقتی `/btw`، از
  `"side-question"` استفاده کنید. اگر آن پرچم‌ها ابزارهای بومی را در یک CLI
  که در غیر این صورت همیشه فعال است به‌طور قابل‌اعتماد غیرفعال می‌کنند،
  `sideQuestionToolMode: "disabled"` را نیز اعلام کنید.
- پشتیبان‌هایی که می‌توانند تمام ابزارهای بومی را برای یک اجرا غیرفعال کنند،
  می‌توانند `nativeToolMode: "selectable"` را اعلام کنند. فراخوانی‌های محدودشده،
  یک چندتایی خالی `ctx.toolAvailability.native` به‌همراه یک فهرست مجاز دقیق و
  جداسازی‌شده از میزبان برای MCP ارسال می‌کنند؛ `resolveExecutionArgs` باید هر
  دو را در argv نهایی اجرای تازه یا ازسرگرفته‌شده اعمال کند. اگر پشتیبان نتواند
  این کار را انجام دهد، OpenClaw به‌صورت بسته و امن شکست می‌خورد.

برای راهنمای کامل نگارش، به
[Pluginهای پشتیبان CLI](/fa/plugins/cli-backend-plugins) مراجعه کنید.

### جایگاه‌های انحصاری

| متد                                        | آنچه ثبت می‌کند                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | موتور زمینه (هر بار فقط یکی فعال است). وقتی میزبان بتواند عیب‌یابی مدل/ارائه‌دهنده/حالت را فراهم کند، فراخوان‌های چرخهٔ حیات `runtimeSettings` را دریافت می‌کنند؛ موتورهای سخت‌گیر قدیمی بدون این کلید دوباره امتحان می‌شوند. |
| `api.registerMemoryCapability(capability)` | قابلیت یکپارچهٔ حافظه                                                                                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | سازندهٔ بخش پرامپت حافظه                                                                                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | حل‌کنندهٔ طرح تخلیهٔ حافظه                                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | سازگارگر زمان اجرای حافظه                                                                                                                                                                                        |

### سازگارگرهای منسوخ‌شدهٔ تعبیه‌سازی حافظه

| متد                                           | آنچه ثبت می‌کند                              |
| --------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | سازگارگر تعبیه‌سازی حافظه برای Plugin فعال |

- `registerMemoryCapability` رابط برنامه‌نویسی انحصاری ترجیحی برای Plugin حافظه است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)`
  را ارائه کند تا Pluginهای همراه بتوانند به‌جای دسترسی به چیدمان خصوصی یک
  Plugin حافظهٔ مشخص، مصنوعات حافظهٔ صادرشده را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan` و
  `registerMemoryRuntime` رابط‌های برنامه‌نویسی انحصاری سازگار با نسخه‌های
  قدیمی برای Plugin حافظه هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت تخلیه را به یک ارجاع دقیق
  `provider/model`، مانند `ollama/qwen3:8b`، مقید کند، بدون آنکه زنجیرهٔ
  جایگزین فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` منسوخ شده است. ارائه‌دهندگان تعبیه‌سازی جدید
  باید از `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders` استفاده کنند.
- ارائه‌دهندگان فعلی مختص حافظه در بازهٔ مهاجرت همچنان کار می‌کنند، اما بازرسی
  Plugin این مورد را برای Pluginهای غیرهمراه به‌عنوان بدهی سازگاری گزارش
  می‌کند.

### رویدادها و چرخهٔ حیات

| متد                                         | کاری که انجام می‌دهد            |
| ------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | هوک چرخهٔ حیات نوع‌دار           |
| `api.onConversationBindingResolved(handler)` | فراخوان بازگشتی اتصال مکالمه     |

برای نمونه‌ها، نام‌های رایج هوک و معناشناسی محافظ‌ها، به
[هوک‌های Plugin](/fa/plugins/hooks) مراجعه کنید.

### معناشناسی تصمیم هوک

`before_install` یک هوک چرخهٔ حیات زمان اجرای Plugin است، نه سطح سیاست نصب
اپراتور. وقتی تصمیم اجازه/مسدودسازی باید مسیرهای نصب یا به‌روزرسانی مبتنی بر
CLI و Gateway را پوشش دهد، از `security.installPolicy` استفاده کنید.

- `before_tool_call`: بازگرداندن `{ block: true }` نهایی است. به‌محض اینکه هر هندلری آن را تنظیم کند، هندلرهای دارای اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌معنای عدم تصمیم‌گیری تلقی می‌شود (همانند حذف `block`)، نه به‌عنوان بازنویسی تصمیم.
- `before_install`: بازگرداندن `{ block: true }` نهایی است. به‌محض اینکه هر هندلری آن را تنظیم کند، هندلرهای دارای اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌معنای عدم تصمیم‌گیری تلقی می‌شود (همانند حذف `block`)، نه به‌عنوان بازنویسی تصمیم.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` نهایی است. به‌محض اینکه هر هندلری ارسال را بر عهده بگیرد، هندلرهای دارای اولویت پایین‌تر و مسیر پیش‌فرض ارسال مدل نادیده گرفته می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` نهایی است. به‌محض اینکه هر هندلری آن را تنظیم کند، هندلرهای دارای اولویت پایین‌تر نادیده گرفته می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌معنای عدم تصمیم‌گیری تلقی می‌شود (همانند حذف `cancel`)، نه به‌عنوان بازنویسی تصمیم.
- `message_received`: هنگامی که به مسیریابی رشته/موضوع ورودی نیاز دارید، از فیلد نوع‌دار `threadId` استفاده کنید. `metadata` را برای اطلاعات اضافی مختص کانال نگه دارید.
- `message_sending`: پیش از رجوع به `metadata` مختص کانال، از فیلدهای مسیریابی نوع‌دار `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای وضعیت راه‌اندازی تحت مالکیت Gateway، به‌جای اتکا به هوک‌های داخلی `gateway:startup` از `ctx.config`،‏ `ctx.workspaceDir` و `ctx.getCron?.()` استفاده کنید. ممکن است Cron در این لحظه همچنان در حال بارگذاری باشد.
- `cron_reconciled`: پس از راه‌اندازی یا بارگذاری مجدد زمان‌بند، یک تصویر کامل بیرونی از Cron را بازسازی کنید. این رویداد شامل `reason` و وضعیت مؤثر `enabled`، از جمله `enabled: false`، است؛ درحالی‌که `ctx.getCron?.()` زمان‌بند دقیقِ تطبیق‌یافته را بازمی‌گرداند. برای کار ماندگارِ تولید تصویر، `ctx.abortSignal` را ارسال کنید؛ هنگامی که تصویر لحظه‌ای آن زمان‌بند با نسخه‌ای جدید جایگزین شود یا Gateway بسته شود، عملیات لغو خواهد شد.
- `cron_changed`: تغییرات چرخهٔ حیات Cron تحت مالکیت Gateway را مشاهده کنید. رویدادهای `scheduled` و `removed` نشانه‌های تطبیق پس از ثبت هستند، نه یک گزارش ترتیبی از تغییرات. اگر کاری بیدارباش بعدی نداشته باشد، `event.nextRunAtMs` در رویداد زمان‌بندی‌شده وجود ندارد؛ رویداد حذف‌شده همچنان تصویر لحظه‌ای کار حذف‌شده را حمل می‌کند.

زمان‌بندهای بیدارباش بیرونی باید رویدادهای `cron_changed` را با تأخیر ادغام کنند یا در هم بیامیزند،
سپس نمای کامل و ماندگار را از زمان‌بندی که آخرین بار توسط
`cron_reconciled` ثبت شده است، دوباره بخوانند. زمان‌بند را از زمینهٔ `cron_changed`
نپذیرید: یک نشانهٔ جداشده از زمان‌بندی قدیمی‌تر ممکن است با بارگذاری مجدد بعدی هم‌پوشانی داشته باشد.

از `cron_reconciled` به‌عنوان محرک تصویر کامل برای وضعیت ماندگاری استفاده کنید که هنگام
راه‌اندازی Gateway یا جایگزینی زمان‌بند بارگذاری می‌شود. این رویداد برای بارگذاری مجدد فوریِ
صرفاً مختص Plugin بازپخش نمی‌شود. هندلرهای مشاهده به‌صورت موازی اجرا می‌شوند و ارسال‌های
بدون انتظار برای نتیجه ممکن است هم‌پوشانی داشته باشند؛ بنابراین مصرف‌کنندگان نباید به ترتیب تکمیل رویدادها وابسته باشند.
OpenClaw را برای بررسی موعدها و اجرا، منبع حقیقت نگه دارید.

برای یک آداپتور تک‌پرواز با جایگزینی ماندگار، تلاش مجدد/عقب‌نشینی و
خاموش‌سازی پاک، به [تصویرسازی امن بیرونی Cron](/fa/plugins/hooks#safe-external-cron-projection) مراجعه کنید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیحات                                                                                          |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | شناسهٔ Plugin                                                                                   |
| `api.name`               | `string`                  | نام نمایشی                                                                                       |
| `api.version`            | `string?`                 | نسخهٔ Plugin (اختیاری)                                                                          |
| `api.description`        | `string?`                 | توضیحات Plugin (اختیاری)                                                                         |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                                 |
| `api.rootDir`            | `string?`                 | پوشهٔ ریشهٔ Plugin (اختیاری)                                                                     |
| `api.config`             | `OpenClawConfig`          | تصویر لحظه‌ای پیکربندی فعلی (در صورت دسترس‌بودن، تصویر لحظه‌ای فعالِ زمان اجرا در حافظه)          |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مختص Plugin از `plugins.entries.<id>.config`                                             |
| `api.runtime`            | `PluginRuntime`           | [ابزارهای کمکی زمان اجرا](/fa/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | ثبت‌کنندهٔ گزارش محدودشده به دامنه (`debug`،‏ `info`،‏ `warn`،‏ `error`)                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` بازهٔ سبک‌وزن راه‌اندازی/آماده‌سازی پیش از ورودی کامل است |
| `api.resolvePath(input)` | `(string) => string`      | حل مسیر نسبت به ریشهٔ Plugin                                                                     |

## قرارداد ماژول داخلی

درون Plugin خود، برای واردسازی‌های داخلی از فایل‌های barrel محلی استفاده کنید:

```text
my-plugin/
  api.ts            # خروجی‌های عمومی برای مصرف‌کنندگان بیرونی
  runtime-api.ts    # خروجی‌های زمان اجرای صرفاً داخلی
  index.ts          # نقطهٔ ورود Plugin
  setup-entry.ts    # ورودی سبک‌وزن صرفاً برای آماده‌سازی (اختیاری)
```

<Warning>
  هرگز در کد محیط عملیاتی، Plugin خود را از مسیر
  `openclaw/plugin-sdk/<your-plugin>` وارد نکنید. واردسازی‌های داخلی را از
  `./api.ts` یا `./runtime-api.ts` عبور دهید. مسیر SDK فقط قرارداد بیرونی است.
</Warning>

سطوح عمومی Plugin همراه که با facade بارگذاری می‌شوند (`api.ts`،‏ `runtime-api.ts`،
`index.ts`،‏ `setup-entry.ts` و فایل‌های ورودی عمومی مشابه)، هنگامی که OpenClaw از قبل
در حال اجرا باشد، تصویر لحظه‌ای پیکربندی فعال زمان اجرا را ترجیح می‌دهند. اگر هنوز تصویر
لحظه‌ای زمان اجرا وجود نداشته باشد، به فایل پیکربندی حل‌شده روی دیسک رجوع می‌کنند.
facadeهای بسته‌بندی‌شدهٔ Plugin همراه باید از طریق بارگذارهای facade مربوط به Plugin در
OpenClaw بارگذاری شوند؛ واردسازی مستقیم از `dist/extensions/...` بررسی‌های مانیفست
و همراه جانبی زمان اجرا را که نصب‌های بسته‌بندی‌شده برای کد تحت مالکیت Plugin استفاده می‌کنند، دور می‌زند.

Pluginهای ارائه‌دهنده می‌توانند زمانی که یک ابزار کمکی عمداً مختص ارائه‌دهنده است و هنوز به
یک زیرمسیر عمومی SDK تعلق ندارد، یک barrel قرارداد محدود و محلی برای Plugin ارائه کنند.
نمونه‌های همراه:

- **Anthropic**: مرز عمومی `api.ts` / `contract-api.ts` برای ابزارهای کمکی سرآیند بتای Claude
  و جریان `service_tier`.
- **`@openclaw/openai-provider`**:‏ `api.ts` سازنده‌های ارائه‌دهنده،
  ابزارهای کمکی مدل پیش‌فرض و سازنده‌های ارائه‌دهندهٔ بلادرنگ را صادر می‌کند.
- **`@openclaw/openrouter-provider`**:‏ `api.ts` سازندهٔ ارائه‌دهنده
  به‌همراه ابزارهای کمکی آغاز به کار/پیکربندی را صادر می‌کند.

<Warning>
  کد محیط عملیاتی افزونه نیز باید از واردسازی‌های `openclaw/plugin-sdk/<other-plugin>`
  اجتناب کند. اگر ابزاری واقعاً مشترک است، به‌جای وابسته‌کردن دو Plugin به یکدیگر،
  آن را به زیرمسیر خنثی SDK مانند `openclaw/plugin-sdk/speech`،
  `.../provider-model-shared` یا سطح دیگری مبتنی بر قابلیت ارتقا دهید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقاط ورود" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="ابزارهای کمکی زمان اجرا" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل فضای نام `api.runtime`.
  </Card>
  <Card title="آماده‌سازی و پیکربندی" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، مانیفست‌ها و طرح‌واره‌های پیکربندی.
  </Card>
  <Card title="آزمایش" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای آزمایش و قواعد بررسی ایستا.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطوح منسوخ‌شده.
  </Card>
  <Card title="اجزای داخلی Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل قابلیت.
  </Card>
</CardGroup>
