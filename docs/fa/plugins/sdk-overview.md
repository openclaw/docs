---
read_when:
    - باید بدانید از کدام زیرمسیر SDK باید وارد کنید
    - شما یک مرجع برای همهٔ روش‌های ثبت در OpenClawPluginApi می‌خواهید
    - شما در حال جستجوی یک خروجی مشخص از SDK هستید
sidebarTitle: Plugin SDK overview
summary: مرجع نگاشت واردسازی، API ثبت، و معماری SDK
title: نمای کلی SDK Plugin
x-i18n:
    generated_at: "2026-06-27T18:31:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK قرارداد تایپ‌شده میان Pluginها و هسته است. این صفحه
مرجع **چیزهایی است که باید import کنید** و **چیزهایی که می‌توانید ثبت کنید**.

<Note>
  این صفحه برای نویسندگان Plugin است که داخل OpenClaw از `openclaw/plugin-sdk/*`
  استفاده می‌کنند. برای اپ‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
  که می‌خواهند عامل‌ها را از طریق Gateway اجرا کنند، به‌جای آن از
  [یکپارچه‌سازی‌های Gateway برای اپ‌های خارجی](/fa/gateway/external-apps) استفاده کنید.
</Note>

<Tip>
به‌دنبال راهنمای عملی هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای ارائه‌دهنده از [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)، برای بک‌اندهای CLI هوش مصنوعی محلی از [Pluginهای بک‌اند CLI](/fa/plugins/cli-backend-plugins)، و برای Pluginهای ابزار یا هوک چرخه عمر از [هوک‌های Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک مسیر فرعی مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر مسیر فرعی یک ماژول کوچک و خودبسنده است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی چرخه‌ای جلوگیری می‌کند. برای کمک‌سازهای entry/build مخصوص کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و کمک‌سازهای مشترکی مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. مسیر فرعی `plugin-sdk/channel-config-schema`
برای primitiveهای مشترک schema و builder عمومی است. Pluginهای همراه OpenClaw
برای schemaهای نگه‌داشته‌شده کانال‌های همراه از `plugin-sdk/bundled-channel-config-schema`
استفاده می‌کنند. exportهای سازگاری منسوخ روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌یک از مسیرهای فرعی schema همراه
الگویی برای Pluginهای جدید نیست.

<Warning>
  seamهای راحتی برندشده با نام ارائه‌دهنده یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای همراه، مسیرهای فرعی عمومی SDK را داخل barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از آن barrelهای محلی Plugin
  استفاده کنند یا وقتی نیازی واقعا میان‌کانالی است، یک قرارداد عمومی و محدود SDK اضافه کنند.

مجموعه کوچکی از seamهای کمک‌ساز Pluginهای همراه هنوز وقتی کاربرد مالک ردیابی‌شده دارند
در نقشه export تولیدشده ظاهر می‌شوند. آن‌ها فقط برای نگه‌داری Pluginهای همراه وجود دارند
و مسیرهای import پیشنهادی برای Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ برای کاربرد مالک ردیابی‌شده نگه داشته شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از کمک‌سازهای runtime تزریق‌شده و
مسیرهای فرعی عمومی SDK کانال استفاده کنید.
</Warning>

## مرجع مسیرهای فرعی

Plugin SDK به‌صورت مجموعه‌ای از مسیرهای فرعی محدود ارائه می‌شود که بر اساس حوزه گروه‌بندی شده‌اند (entry
Plugin، کانال، ارائه‌دهنده، احراز هویت، runtime، قابلیت، حافظه، و کمک‌سازهای رزروشده
Pluginهای همراه). برای فهرست کامل، گروه‌بندی‌شده و لینک‌شده، ببینید:
[مسیرهای فرعی Plugin SDK](/fa/plugins/sdk-subpaths).

فهرست entrypointهای کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای بسته پس از کم کردن
مسیرهای فرعی تست/داخلی محلی repo که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند، از
زیرمجموعه عمومی تولید می‌شوند. برای audit تعداد exportهای عمومی
`pnpm plugin-sdk:surface` را اجرا کنید. مسیرهای فرعی عمومی منسوخی که به‌اندازه کافی قدیمی‌اند
و توسط کد production افزونه‌های همراه استفاده نمی‌شوند، در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ردیابی می‌شوند؛ barrelهای گسترده
re-export منسوخ در
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` ردیابی می‌شوند.

## API ثبت

callback `register(api)` یک شیء `OpenClawPluginApi` با این
متدها دریافت می‌کند:

### ثبت قابلیت

| متد                                             | چیزی که ثبت می‌کند                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متن (LLM)                     |
| `api.registerAgentHarness(...)`                  | اجراکننده آزمایشی سطح پایین عامل      |
| `api.registerCliBackend(...)`                    | بک‌اند استنتاج CLI محلی               |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                      |
| `api.registerEmbeddingProvider(...)`             | ارائه‌دهنده reusable برای embedding برداری |
| `api.registerSpeechProvider(...)`                | تبدیل متن به گفتار / سنتز STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی realtime جریانی               |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صوتی realtime دوطرفه         |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صوت/ویدیو                 |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                           |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                          |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدیو                           |
| `api.registerWebFetchProvider(...)`              | ارائه‌دهنده دریافت / scrape وب        |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                           |

ارائه‌دهنده‌های embedding که با `api.registerEmbeddingProvider(...)` ثبت می‌شوند، باید
در manifest Plugin نیز در `contracts.embeddingProviders` فهرست شوند. این
سطح embedding عمومی برای تولید بردار reusable است. جست‌وجوی حافظه
می‌تواند این سطح ارائه‌دهنده عمومی را مصرف کند. seam قدیمی‌تر
`api.registerMemoryEmbeddingProvider(...)` و
`contracts.memoryEmbeddingProviders` سازگاری منسوخ است تا زمانی که
ارائه‌دهنده‌های موجود مخصوص حافظه مهاجرت کنند.

ارائه‌دهنده‌های مخصوص حافظه که هنوز یک `batchEmbed(...)` runtime ارائه می‌کنند، روی
قرارداد batching موجود به‌ازای هر فایل باقی می‌مانند مگر اینکه runtime آن‌ها صراحتا
`sourceWideBatchEmbed: true` را تنظیم کند. این opt-in به میزبان حافظه اجازه می‌دهد chunkها را از
چند فایل حافظه dirty و source فعال در یک فراخوانی `batchEmbed(...)` تا
محدودیت‌های batch میزبان ارسال کند. adapterهای batch که فایل‌های درخواست JSONL را upload می‌کنند، باید
کارهای ارائه‌دهنده را پیش از سقف اندازه upload و همچنین سقف تعداد درخواست split کنند.
ارائه‌دهنده باید برای هر chunk ورودی، یک embedding با همان ترتیب `batch.chunks` برگرداند؛
وقتی ارائه‌دهنده batchهای local به فایل را انتظار دارد یا نمی‌تواند ترتیب ورودی را در یک کار
source-wide بزرگ‌تر حفظ کند، این flag را حذف کنید.

### ابزارها و فرمان‌ها

برای Pluginهای ساده فقط‌ابزار با نام‌های ابزار ثابت، از [`defineToolPlugin`](/fa/plugins/tool-plugins)
استفاده کنید. برای Pluginهای ترکیبی یا ثبت ابزار کاملا dynamic، مستقیما از
`api.registerTool(...)` استفاده کنید.

| متد                            | چیزی که ثبت می‌کند                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار عامل (الزامی یا `{ optional: true }`)   |
| `api.registerCommand(def)`      | فرمان سفارشی (LLM را دور می‌زند)              |

فرمان‌های Plugin می‌توانند وقتی عامل به یک راهنمای routing کوتاه متعلق به فرمان نیاز دارد،
`agentPromptGuidance` را تنظیم کنند. آن متن را درباره خود فرمان نگه دارید؛ policy
مخصوص ارائه‌دهنده یا Plugin را به prompt builderهای هسته اضافه نکنید.

ورودی‌های راهنما می‌توانند رشته‌های legacy باشند که روی هر سطح prompt اعمال می‌شوند، یا
ورودی‌های ساختاریافته:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` ساختاریافته می‌تواند شامل `openclaw_main`، `codex_app_server`،
`cli_backend`، `acp_backend` یا `subagent` باشد. `pi_main` همچنان یک alias منسوخ
برای `openclaw_main` است. برای راهنمایی عمدی روی همه سطح‌ها، `surfaces` را حذف کنید.
آرایه خالی `surfaces` را پاس ندهید؛ reject می‌شود تا از دست رفتن تصادفی scope به
متن prompt جهانی تبدیل نشود.

دستورالعمل‌های توسعه‌دهنده app-server بومی Codex از سایر سطح‌های prompt سخت‌گیرانه‌ترند:
فقط راهنمایی‌ای که صراحتا به `codex_app_server` محدود شده باشد به آن lane با اولویت بالاتر
promote می‌شود. راهنمایی رشته‌ای legacy و راهنمایی ساختاریافته بدون scope برای
سطح‌های prompt غیر Codex جهت سازگاری همچنان در دسترس می‌مانند.

### زیرساخت

| متد                                           | چیزی که ثبت می‌کند                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | هوک رویداد                              |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway                |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | تبلیغ‌کننده discovery برای Gateway محلی |
| `api.registerCli(registrar, opts?)`            | زیرفرمان CLI                            |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI ویژگی Node زیر `openclaw nodes`     |
| `api.registerService(service)`                 | سرویس پس‌زمینه                          |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                          |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجه ابزار runtime          |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی کنار حافظه           |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزایشی جست‌وجو/خواندن حافظه     |

### هوک‌های میزبان برای Pluginهای workflow

هوک‌های میزبان seamهای SDK برای Pluginهایی هستند که باید در چرخه عمر میزبان مشارکت کنند،
نه اینکه فقط یک ارائه‌دهنده، کانال یا ابزار اضافه کنند. آن‌ها قراردادهای
عمومی‌اند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای approval،
gateهای policy workspace، monitorهای پس‌زمینه، wizardهای setup و Pluginهای همراه UI
نیز می‌توانند از آن‌ها استفاده کنند.

| روش                                                                               | قراردادی که مالک آن است                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | وضعیت نشستِ متعلق به Plugin و سازگار با JSON که از طریق نشست‌های Gateway پروجکت می‌شود                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | زمینه‌ی بادوامِ دقیقاً-یک‌بار که برای یک نشست به نوبت بعدی عامل تزریق می‌شود                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | سیاست ابزار مورداعتمادِ پیش از Plugin و محدودشده با مانیفست که می‌تواند پارامترهای ابزار را مسدود یا بازنویسی کند                                               |
| `api.registerToolMetadata(...)`                                                      | فراداده‌ی نمایش کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                            |
| `api.registerCommand(...)`                                                           | فرمان‌های Plugin با دامنه‌ی محدود؛ نتایج فرمان می‌توانند `continueAgent: true` را تنظیم کنند؛ فرمان‌های بومی Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.session.controls.registerControlUiDescriptor(...)`                              | توصیفگرهای مشارکت Control UI برای سطوح نشست، ابزار، اجرا، یا تنظیمات                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | فراخوان‌های پاک‌سازی برای منابع زمان‌اجرای متعلق به Plugin در مسیرهای بازنشانی/حذف/بارگذاری مجدد                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراک‌های رویداد پالایش‌شده برای وضعیت workflow و پایشگرها                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | وضعیت موقت Plugin برای هر اجرا که در چرخه‌عمر پایانی اجرا پاک می‌شود                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | فراداده‌ی پاک‌سازی برای کارهای زمان‌بند متعلق به Plugin؛ کاری را زمان‌بندی نمی‌کند یا رکوردهای وظیفه نمی‌سازد                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تحویل پیوست فایل فقط برای موارد بسته‌بندی‌شده و با میانجی‌گری میزبان به مسیر نشست خروجی مستقیم فعال                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | نوبت‌های زمان‌بندی‌شده‌ی نشست مبتنی بر Cron فقط برای موارد بسته‌بندی‌شده، به‌همراه پاک‌سازی مبتنی بر برچسب                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | کنش‌های نشست تایپ‌شده که کلاینت‌ها می‌توانند از طریق Gateway ارسال کنند                                                                    |

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

متدهای تختِ معادل همچنان به‌عنوان نام‌های مستعار سازگاری منسوخ‌شده
برای Pluginهای موجود در دسترس می‌مانند. کد Plugin جدیدی اضافه نکنید که
مستقیماً `api.registerSessionExtension`، `api.enqueueNextTurnInjection`،
`api.registerControlUiDescriptor`، `api.registerRuntimeLifecycle`،
`api.registerAgentEventSubscription`، `api.emitAgentEvent`،
`api.setRunContext`، `api.getRunContext`، `api.clearRunContext`،
`api.registerSessionSchedulerJob`، `api.registerSessionAction`،
`api.sendSessionAttachment`، `api.scheduleSessionTurn`، یا
`api.unscheduleSessionTurnsByTag` را فراخوانی کند.

`scheduleSessionTurn(...)` یک تسهیل‌گر با دامنه‌ی نشست روی زمان‌بند Cron
در Gateway است. Cron مالک زمان‌بندی است و وقتی نوبت اجرا می‌شود رکورد وظیفه‌ی پس‌زمینه را می‌سازد؛ Plugin SDK فقط نشست هدف، نام‌گذاری متعلق به Plugin،
و پاک‌سازی را محدود می‌کند. وقتی خودِ کار به وضعیت بادوام Task Flow چندمرحله‌ای نیاز دارد، داخل نوبت زمان‌بندی‌شده از `api.runtime.tasks.managedFlows` استفاده کنید.

قراردادها عمداً اختیار را تفکیک می‌کنند:

- Pluginهای خارجی می‌توانند مالک افزونه‌های نشست، توصیفگرهای UI، فرمان‌ها، فراداده‌ی ابزار، تزریق‌های نوبت بعدی، و hookهای عادی باشند.
- سیاست‌های ابزار مورداعتماد پیش از hookهای عادی `before_tool_call` اجرا می‌شوند و مورداعتماد میزبان هستند. سیاست‌های بسته‌بندی‌شده اول اجرا می‌شوند؛ سیاست‌های Plugin نصب‌شده به فعال‌سازی صریح به‌همراه شناسه‌های محلی‌شان در
  `contracts.trustedToolPolicies` نیاز دارند، و سپس به ترتیب بارگذاری Plugin اجرا می‌شوند. شناسه‌های سیاست به Plugin ثبت‌کننده محدود می‌شوند.
- مالکیت فرمان رزروشده فقط برای موارد بسته‌بندی‌شده است. Pluginهای خارجی باید از نام‌ها یا نام‌های مستعار فرمان خودشان استفاده کنند.
- `allowPromptInjection=false` hookهای تغییردهنده‌ی پرامپت، از جمله
  `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`،
  فیلدهای پرامپت از `before_agent_start` قدیمی، و
  `enqueueNextTurnInjection` را غیرفعال می‌کند.

نمونه‌هایی از مصرف‌کنندگان غیر Plan:

| کهن‌الگوی Plugin             | hookهای استفاده‌شده                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow تأیید            | افزونه‌ی نشست، ادامه‌ی فرمان، تزریق نوبت بعدی، توصیفگر UI                                                            |
| دروازه‌ی سیاست بودجه/فضای‌کار | سیاست ابزار مورداعتماد، فراداده‌ی ابزار، پروجکشن نشست                                                                                 |
| پایشگر چرخه‌عمر پس‌زمینه | پاک‌سازی چرخه‌عمر زمان‌اجرا، اشتراک رویداد عامل، مالکیت/پاک‌سازی زمان‌بند نشست، مشارکت پرامپت Heartbeat، توصیفگر UI |
| ویزارد راه‌اندازی یا onboarding   | افزونه‌ی نشست، فرمان‌های با دامنه‌ی محدود، توصیفگر Control UI                                                                              |

<Note>
  namespaceهای مدیریتی هسته‌ی رزروشده (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` می‌مانند، حتی اگر یک Plugin تلاش کند دامنه‌ی متد Gateway محدودتری اختصاص دهد. برای متدهای
  متعلق به Plugin، پیشوندهای ویژه‌ی همان Plugin را ترجیح دهید.
</Note>

<Accordion title="چه زمانی از میان‌افزار نتیجه‌ی ابزار استفاده کنیم">
  Pluginهای بسته‌بندی‌شده و Pluginهای نصب‌شده‌ای که به‌صراحت فعال شده‌اند و قراردادهای مانیفست منطبق دارند، وقتی نیاز دارند نتیجه‌ی ابزار را پس از اجرا و پیش از آن‌که زمان‌اجرا آن نتیجه را دوباره به مدل بدهد بازنویسی کنند، می‌توانند از `api.registerAgentToolResultMiddleware(...)` استفاده کنند. این seam مورداعتماد و بی‌طرف نسبت به زمان‌اجرا برای کاهنده‌های خروجی ناهمگام مانند tokenjuice است.

Pluginها باید برای هر زمان‌اجرای هدف، `contracts.agentToolResultMiddleware` را اعلام کنند؛ برای مثال `["openclaw", "codex"]`. Pluginهای نصب‌شده‌ای که آن قرارداد را ندارند، یا به‌صراحت فعال نشده‌اند، نمی‌توانند این میان‌افزار را ثبت کنند؛ برای کارهایی که به زمان‌بندی نتیجه‌ی ابزار پیش از مدل نیاز ندارند، hookهای عادی Plugin در OpenClaw را نگه دارید. مسیر قدیمی ثبت factory افزونه که فقط مخصوص embedded-runner بود حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را روی یک انتقال کشف محلی مانند mDNS/Bonjour تبلیغ کند. وقتی کشف محلی فعال باشد، OpenClaw سرویس را هنگام راه‌اندازی Gateway فراخوانی می‌کند، پورت‌های فعلی Gateway و داده‌های راهنمای TXT غیرمحرمانه را می‌فرستد، و handler بازگشتی `stop` را هنگام خاموشی Gateway فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT تبلیغ‌شده را راز یا احراز هویت تلقی کنند. کشف یک راهنمای مسیریابی است؛ احراز هویت Gateway و سنجاق‌کردن TLS همچنان مالک اعتماد هستند.

### فراداده‌ی ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فراداده‌ی فرمان را می‌پذیرد:

- `commands`: نام‌های فرمان صریح که متعلق به ثبت‌کننده هستند
- `descriptors`: توصیفگرهای فرمان در زمان parse که برای راهنمای CLI،
  مسیریابی، و ثبت CLI تنبل Plugin استفاده می‌شوند
- `parentPath`: مسیر فرمان والد اختیاری برای گروه‌های فرمان تو در تو، مانند
  `["nodes"]`

برای قابلیت‌های paired-node،
`api.registerNodeCliFeature(registrar, opts?)` را ترجیح دهید. این یک wrapper کوچک پیرامون
`api.registerCli(..., { parentPath: ["nodes"] })` است و فرمان‌هایی مانند
`openclaw nodes canvas` را به قابلیت‌های node متعلق به Plugin و صریح تبدیل می‌کند.

اگر می‌خواهید یک فرمان Plugin در مسیر CLI ریشه‌ی عادی به‌صورت lazy-loaded باقی بماند، `descriptors`ی ارائه کنید که هر ریشه‌ی فرمان سطح‌بالا را که آن ثبت‌کننده آشکار می‌کند پوشش دهد.

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

فرمان‌های تو در تو فرمان والد resolveشده را به‌عنوان `program` دریافت می‌کنند:

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

فقط زمانی از `commands` به‌تنهایی استفاده کنید که به ثبت CLI ریشه‌ی lazy نیاز ندارید.
آن مسیر سازگاری eager همچنان پشتیبانی می‌شود، اما placeholderهای مبتنی بر descriptor را برای lazy loading در زمان parse نصب نمی‌کند.

### ثبت backend در CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد مالک پیکربندی پیش‌فرض برای یک
backend محلی CLI هوش مصنوعی مانند `claude-cli` یا `my-cli` باشد.

- `id` مربوط به backend به پیشوند provider در ارجاع‌های مدل مانند `my-cli/gpt-5` تبدیل می‌شود.
- `config` مربوط به backend از همان شکل `agents.defaults.cliBackends.<id>` استفاده می‌کند.
- پیکربندی کاربر همچنان اولویت دارد. OpenClaw پیش از اجرای CLI، `agents.defaults.cliBackends.<id>` را روی پیش‌فرض Plugin ادغام می‌کند.
- وقتی یک backend پس از ادغام به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای مثال نرمال‌سازی شکل‌های قدیمی flag).
- برای بازنویسی‌های argv با دامنه‌ی درخواست که به گویش CLI تعلق دارند، از `resolveExecutionArgs` استفاده کنید، مانند نگاشت سطح‌های thinking در OpenClaw به یک flag بومی effort. این hook مقدار `ctx.executionMode` را دریافت می‌کند؛ از `"side-question"` برای افزودن flagهای جداسازی بومی backend برای فراخوانی‌های موقتی `/btw` استفاده کنید. اگر آن flagها به‌طور قابل‌اعتماد ابزارهای بومی را برای یک CLI که در غیر این صورت همیشه روشن است غیرفعال می‌کنند، `sideQuestionToolMode: "disabled"` را هم اعلام کنید.

برای راهنمای نویسندگی سرتاسری، به
[Pluginهای backend CLI](/fa/plugins/cli-backend-plugins) مراجعه کنید.

### slotهای انحصاری

| روش                                      | آنچه ثبت می‌کند                                                                                                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | موتور زمینه (هر بار یکی فعال است). callbackهای چرخه عمر وقتی میزبان بتواند diagnostics مدل/provider/حالت را فراهم کند، `runtimeSettings` را دریافت می‌کنند؛ موتورهای سخت‌گیر قدیمی‌تر بدون آن کلید دوباره تلاش می‌شوند. |
| `api.registerMemoryCapability(capability)` | قابلیت حافظه یکپارچه                                                                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش prompt حافظه                                                                                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`  | resolver برنامه flush حافظه                                                                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`     | adapter زمان اجرای حافظه                                                                                                                                                                                        |

### adapterهای embedding حافظه منسوخ‌شده

| روش                                           | آنچه ثبت می‌کند                         |
| --------------------------------------------- | --------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | adapter embedding حافظه برای Plugin فعال |

- `registerMemoryCapability` API ترجیحی و انحصاری Plugin حافظه است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)` را در دسترس بگذارد
  تا Pluginهای همراه بتوانند artifactهای صادرشده حافظه را از طریق
  `openclaw/plugin-sdk/memory-host-core` مصرف کنند، به‌جای اینکه به چیدمان خصوصی یک
  Plugin حافظه خاص وارد شوند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan`، و
  `registerMemoryRuntime` APIهای انحصاری Plugin حافظه با سازگاری legacy هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت flush را به یک ارجاع دقیق `provider/model`
  مانند `ollama/qwen3:8b` سنجاق کند، بدون اینکه زنجیره fallback فعال را به ارث ببرد.
- `registerMemoryEmbeddingProvider` منسوخ شده است. providerهای embedding جدید
  باید از `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders` استفاده کنند.
- providerهای موجود مخصوص حافظه در بازه migration همچنان کار می‌کنند،
  اما گزارش‌های بازرسی Plugin این را برای Pluginهای غیر bundled بدهی سازگاری گزارش می‌کنند.

### رویدادها و چرخه عمر

| روش                                         | کاری که انجام می‌دهد        |
| ------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`          | hook چرخه عمر typed         |
| `api.onConversationBindingResolved(handler)` | callback اتصال conversation |

برای نمونه‌ها، نام‌های رایج hook، و معنای guard به [قلاب‌های Plugin](/fa/plugins/hooks) مراجعه کنید.

### معنای تصمیم hook

`before_install` یک hook چرخه عمر زمان اجرای Plugin است، نه سطح policy نصب operator.
وقتی تصمیم allow/block باید مسیرهای نصب یا به‌روزرسانی متکی به CLI و Gateway را پوشش دهد،
از `security.installPolicy` استفاده کنید.

- `before_tool_call`: برگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: برگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: برگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: برگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: برگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler ارسال را claim کند، handlerهای با اولویت پایین‌تر و مسیر پیش‌فرض ارسال مدل رد می‌شوند.
- `message_sending`: برگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: برگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به routing ورودی thread/topic نیاز دارید، از فیلد typed `threadId` استفاده کنید. `metadata` را برای موارد اضافی مخصوص channel نگه دارید.
- `message_sending`: پیش از fallback به `metadata` مخصوص channel، از فیلدهای routing typed یعنی `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای state راه‌اندازی متعلق به gateway، به‌جای تکیه بر hookهای داخلی `gateway:startup`، از `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخه عمر cron متعلق به gateway را مشاهده کنید. هنگام همگام‌سازی wake schedulerهای خارجی از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید، و OpenClaw را منبع حقیقت برای بررسی‌های موعدرسیده و اجرا نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | شناسه Plugin                                                                               |
| `api.name`               | `string`                  | نام نمایشی                                                                                 |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                      |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                     |
| `api.source`             | `string`                  | مسیر source Plugin                                                                         |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                           |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (snapshot زمان اجرای درون‌حافظه‌ای فعال در صورت موجود بودن)       |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`                                     |
| `api.runtime`            | `PluginRuntime`           | [helperهای زمان اجرا](/fa/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | logger محدود به scope (`debug`، `info`، `warn`، `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت load فعلی؛ `"setup-runtime"` بازه سبک راه‌اندازی/setup پیش از full-entry است          |
| `api.resolvePath(input)` | `(string) => string`      | resolve کردن مسیر نسبت به ریشه Plugin                                                      |

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
  هرگز در کد production، Plugin خودتان را از طریق `openclaw/plugin-sdk/<your-plugin>`
  import نکنید. importهای داخلی را از طریق `./api.ts` یا
  `./runtime-api.ts` route کنید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطوح عمومی Pluginهای bundled که از facade load می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts`، و فایل‌های entry عمومی مشابه) وقتی OpenClaw از قبل در حال اجرا باشد،
snapshot پیکربندی زمان اجرای فعال را ترجیح می‌دهند. اگر هنوز snapshot زمان اجرا وجود نداشته باشد،
به فایل پیکربندی resolve‌شده روی دیسک fallback می‌کنند. facadeهای Pluginهای bundled بسته‌بندی‌شده
باید از طریق loaderهای facade Plugin در OpenClaw load شوند؛ import مستقیم از `dist/extensions/...`
manifest و بررسی‌های sidecar زمان اجرا را که نصب‌های بسته‌بندی‌شده برای کد متعلق به Plugin استفاده می‌کنند دور می‌زند.

Pluginهای provider می‌توانند وقتی یک helper عمداً مخصوص provider است و هنوز به یک subpath عمومی SDK تعلق ندارد،
یک barrel قرارداد باریک و محلی برای Plugin ارائه کنند. نمونه‌های bundled:

- **Anthropic**: seam عمومی `api.ts` / `contract-api.ts` برای helperهای stream مربوط به
  beta-header Claude و `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های provider،
  helperهای مدل پیش‌فرض، و سازنده‌های provider realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده provider
  به‌همراه helperهای onboarding/config را export می‌کند.

<Warning>
  کد production Extension نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>`
  پرهیز کند. اگر یک helper واقعاً مشترک است، آن را به یک subpath خنثی SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared`، یا یک سطح دیگر
  مبتنی بر capability ارتقا دهید، به‌جای اینکه دو Plugin را به هم coupled کنید.
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
    ابزارهای test و ruleهای lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    migration از سطوح منسوخ‌شده.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل capability.
  </Card>
</CardGroup>
