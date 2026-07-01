---
read_when:
    - باید بدانید کدام زیرمسیر SDK را باید import کنید
    - می‌خواهید مرجعی برای همهٔ روش‌های ثبت در OpenClawPluginApi داشته باشید
    - شما در حال جست‌وجوی یک خروجی مشخص از SDK هستید
sidebarTitle: Plugin SDK overview
summary: نقشهٔ import، مرجع API ثبت، و معماری SDK
title: نمای کلی SDK Plugin
x-i18n:
    generated_at: "2026-07-01T18:17:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK قرارداد تایپ‌شده میان Pluginها و هسته است. این صفحه مرجع
**اینکه چه چیزی را import کنید** و **چه چیزی را می‌توانید register کنید** است.

<Note>
  این صفحه برای نویسندگان Plugin است که از `openclaw/plugin-sdk/*` درون
  OpenClaw استفاده می‌کنند. برای اپلیکیشن‌های خارجی، اسکریپت‌ها، داشبوردها، کارهای CI و افزونه‌های IDE
  که می‌خواهند agentها را از طریق Gateway اجرا کنند، به‌جای آن از
  [یکپارچه‌سازی‌های Gateway برای اپلیکیشن‌های خارجی](/fa/gateway/external-apps) استفاده کنید.
</Note>

<Tip>
به‌دنبال راهنمای عملی هستید؟ با [ساخت Pluginها](/fa/plugins/building-plugins) شروع کنید، برای Pluginهای کانال از [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، برای Pluginهای provider از [Pluginهای provider](/fa/plugins/sdk-provider-plugins)، برای backendهای CLI هوش مصنوعی محلی از [Pluginهای backend CLI](/fa/plugins/cli-backend-plugins)، و برای Pluginهای hook ابزار یا چرخهٔ عمر از [Hookهای Plugin](/fa/plugins/hooks) استفاده کنید.
</Tip>

## قرارداد import

همیشه از یک زیرمسیر مشخص import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

هر زیرمسیر یک ماژول کوچک و خودبسنده است. این کار راه‌اندازی را سریع نگه می‌دارد و
از مشکلات وابستگی حلقوی جلوگیری می‌کند. برای helperهای entry/build ویژهٔ کانال،
`openclaw/plugin-sdk/channel-core` را ترجیح دهید؛ `openclaw/plugin-sdk/core` را برای
سطح چتری گسترده‌تر و helperهای مشترکی مانند
`buildChannelConfigSchema` نگه دارید.

برای پیکربندی کانال، JSON Schema متعلق به کانال را از طریق
`openclaw.plugin.json#channelConfigs` منتشر کنید. زیرمسیر `plugin-sdk/channel-config-schema`
برای primitiveهای schema مشترک و builder عمومی است. Pluginهای همراه OpenClaw
از `plugin-sdk/bundled-channel-config-schema` برای schemaهای نگه‌داشته‌شدهٔ کانال‌های همراه استفاده می‌کنند.
exportهای سازگاری منسوخ روی
`plugin-sdk/channel-config-schema-legacy` باقی می‌مانند؛ هیچ‌کدام از زیرمسیرهای schema همراه
الگویی برای Pluginهای جدید نیستند.

<Warning>
  seamهای میان‌بر با نام provider یا کانال را import نکنید (برای مثال
  `openclaw/plugin-sdk/slack`، `.../discord`، `.../signal`، `.../whatsapp`).
  Pluginهای همراه، زیرمسیرهای عمومی SDK را در barrelهای `api.ts` /
  `runtime-api.ts` خودشان ترکیب می‌کنند؛ مصرف‌کنندگان هسته باید یا از همان
  barrelهای محلی Plugin استفاده کنند یا وقتی نیازی واقعاً
  میان‌کانالی است، یک قرارداد عمومی و محدود SDK اضافه کنند.

مجموعهٔ کوچکی از seamهای helper مربوط به Pluginهای همراه هنوز در export map تولیدشده
ظاهر می‌شوند، وقتی کاربرد مالکانهٔ ردیابی‌شده دارند. این‌ها فقط برای نگهداشت
Pluginهای همراه وجود دارند و مسیرهای import پیشنهادی برای Pluginهای شخص ثالث جدید نیستند.

`openclaw/plugin-sdk/discord` و `openclaw/plugin-sdk/telegram-account` نیز
به‌عنوان facadeهای سازگاری منسوخ برای کاربرد مالکانهٔ ردیابی‌شده نگه داشته شده‌اند. این
مسیرهای import را در Pluginهای جدید کپی نکنید؛ به‌جای آن از helperهای runtime تزریق‌شده و
زیرمسیرهای عمومی channel SDK استفاده کنید.
</Warning>

## مرجع زیرمسیرها

Plugin SDK به‌صورت مجموعه‌ای از زیرمسیرهای محدود ارائه می‌شود که بر اساس حوزه گروه‌بندی شده‌اند (entry
Plugin، کانال، provider، auth، runtime، capability، حافظه، و helperهای رزروشدهٔ
Pluginهای همراه). برای فهرست کامل، گروه‌بندی‌شده و لینک‌شده، به
[زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) مراجعه کنید.

موجودی entrypointهای compiler در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای package پس از کم‌کردن
زیرمسیرهای test/internal محلی repo که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند، از
زیرمجموعهٔ عمومی تولید می‌شوند. برای ممیزی تعداد export عمومی، فرمان
`pnpm plugin-sdk:surface` را اجرا کنید. زیرمسیرهای عمومی منسوخ که به‌اندازهٔ کافی قدیمی‌اند و
در کد production افزونهٔ همراه استفاده نمی‌شوند، در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ردیابی می‌شوند؛ barrelهای
re-export منسوخ گسترده در
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` ردیابی می‌شوند.

## API ثبت

callback `register(api)` یک شیء `OpenClawPluginApi` با این
متدها دریافت می‌کند:

### ثبت capability

| متد                                             | چه چیزی را register می‌کند             |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | استنتاج متن (LLM)                     |
| `api.registerAgentHarness(...)`                  | اجراکنندهٔ سطح پایین و آزمایشی agent |
| `api.registerCliBackend(...)`                    | backend استنتاج CLI محلی              |
| `api.registerChannel(...)`                       | کانال پیام‌رسانی                     |
| `api.registerEmbeddingProvider(...)`             | provider embedding برداری قابل‌استفادهٔ مجدد |
| `api.registerSpeechProvider(...)`                | تبدیل متن به گفتار / سنتز STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | رونویسی realtime جریانی               |
| `api.registerRealtimeVoiceProvider(...)`         | نشست‌های صوتی realtime دوطرفه         |
| `api.registerMediaUnderstandingProvider(...)`    | تحلیل تصویر/صدا/ویدئو                |
| `api.registerImageGenerationProvider(...)`       | تولید تصویر                          |
| `api.registerMusicGenerationProvider(...)`       | تولید موسیقی                         |
| `api.registerVideoGenerationProvider(...)`       | تولید ویدئو                          |
| `api.registerWebFetchProvider(...)`              | provider واکشی / scrape وب            |
| `api.registerWebSearchProvider(...)`             | جست‌وجوی وب                          |

providerهای embedding که با `api.registerEmbeddingProvider(...)` ثبت می‌شوند، باید
در manifest Plugin نیز در `contracts.embeddingProviders` فهرست شوند. این
سطح embedding عمومی برای تولید بردار قابل‌استفادهٔ مجدد است. جست‌وجوی حافظه
می‌تواند این سطح provider عمومی را مصرف کند. seam قدیمی‌تر
`api.registerMemoryEmbeddingProvider(...)` و
`contracts.memoryEmbeddingProviders` سازگاری منسوخ است، تا زمانی که
providerهای ویژهٔ حافظهٔ موجود مهاجرت کنند.

providerهای ویژهٔ حافظه که همچنان یک runtime `batchEmbed(...)` ارائه می‌کنند، روی
قرارداد batching موجود per-file باقی می‌مانند، مگر اینکه runtime آن‌ها صراحتاً
`sourceWideBatchEmbed: true` را تنظیم کند. این opt-in به میزبان حافظه اجازه می‌دهد chunkها را از
چندین فایل حافظهٔ dirty و source فعال‌شده در یک فراخوانی `batchEmbed(...)`
تا سقف محدودیت‌های batch میزبان ارسال کند. adapterهای batch که فایل‌های درخواست JSONL را upload می‌کنند، باید
jobهای provider را پیش از سقف اندازهٔ upload و نیز سقف تعداد درخواستشان
تقسیم کنند. provider باید برای هر chunk ورودی، به همان ترتیبی که در
`batch.chunks` آمده، یک embedding برگرداند؛ وقتی provider انتظار batchهای محلیِ فایل را دارد یا
نمی‌تواند ترتیب ورودی را در یک job گسترده‌تر source-wide حفظ کند، این flag را حذف کنید.

### ابزارها و فرمان‌ها

برای Pluginهای سادهٔ فقط-ابزار با نام‌های ابزار ثابت، از [`defineToolPlugin`](/fa/plugins/tool-plugins)
استفاده کنید. برای Pluginهای ترکیبی یا ثبت ابزار کاملاً پویا، مستقیماً از
`api.registerTool(...)` استفاده کنید.

| متد                            | چه چیزی را register می‌کند                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | ابزار agent (الزامی یا `{ optional: true }`) |
| `api.registerCommand(def)`      | فرمان سفارشی (LLM را دور می‌زند)             |

فرمان‌های Plugin می‌توانند وقتی agent به یک راهنمای کوتاه routing متعلق به فرمان نیاز دارد،
`agentPromptGuidance` را تنظیم کنند. آن متن را دربارهٔ خود فرمان نگه دارید؛
policy ویژهٔ provider یا Plugin را به prompt builderهای هسته اضافه نکنید.

ورودی‌های راهنما می‌توانند رشته‌های legacy باشند که روی هر سطح prompt اعمال می‌شوند، یا
ورودی‌های ساختاریافته:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

`surfaces` ساختاریافته می‌تواند شامل `openclaw_main`، `codex_app_server`،
`cli_backend`، `acp_backend` یا `subagent` باشد. `pi_main` یک alias منسوخ
برای `openclaw_main` باقی می‌ماند. برای راهنماییِ عامدانه روی همهٔ سطح‌ها، `surfaces` را حذف کنید.
آرایهٔ خالی `surfaces` ارسال نکنید؛ رد می‌شود تا از دست‌رفتن تصادفی scope به
متن prompt سراسری تبدیل نشود.

دستورالعمل‌های توسعه‌دهندهٔ app-server بومی Codex سخت‌گیرانه‌تر از دیگر سطح‌های prompt هستند:
فقط راهنمایی‌ای که صراحتاً به `codex_app_server` محدود شده باشد به آن مسیر
با اولویت بالاتر ارتقا داده می‌شود. راهنمایی legacy رشته‌ای و راهنمایی ساختاریافتهٔ بدون scope
برای سازگاری، همچنان در سطح‌های prompt غیر Codex در دسترس می‌مانند.

### زیرساخت

| متد                                           | چه چیزی را register می‌کند              |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook رویداد                            |
| `api.registerHttpRoute(params)`                | endpoint HTTP در Gateway               |
| `api.registerGatewayMethod(name, handler)`     | متد RPC در Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | تبلیغ‌کنندهٔ کشف Gateway محلی          |
| `api.registerCli(registrar, opts?)`            | زیرcommand CLI                         |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI قابلیت Node زیر `openclaw nodes`   |
| `api.registerService(service)`                 | سرویس پس‌زمینه                         |
| `api.registerInteractiveHandler(registration)` | handler تعاملی                         |
| `api.registerAgentToolResultMiddleware(...)`   | middleware نتیجهٔ ابزار runtime        |
| `api.registerMemoryPromptSupplement(builder)`  | بخش prompt افزایشی مجاور حافظه         |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus افزایشی جست‌وجو/خواندن حافظه   |

### hookهای میزبان برای Pluginهای workflow

hookهای میزبان، seamهای SDK برای Pluginهایی هستند که باید در چرخهٔ عمر میزبان
مشارکت کنند، نه اینکه فقط یک provider، کانال یا ابزار اضافه کنند. آن‌ها
قراردادهای عمومی هستند؛ Plan Mode می‌تواند از آن‌ها استفاده کند، اما workflowهای approval،
gateهای policy فضای کاری، monitorهای پس‌زمینه، wizardهای setup و Pluginهای همراه UI
هم می‌توانند از آن‌ها استفاده کنند.

| روش                                                                                 | قراردادی که مالک آن است                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | وضعیت نشست سازگار با JSON که مالک آن Plugin است و از طریق نشست‌های Gateway بازتاب داده می‌شود                                                              |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | زمینه پایدار و دقیقاً یک‌بارمصرف که برای یک نشست به نوبت بعدی عامل تزریق می‌شود                                                                            |
| `api.registerTrustedToolPolicy(...)`                                                 | سیاست ابزار معتمد پیش از Plugin که با manifest محدود می‌شود و می‌تواند پارامترهای ابزار را مسدود یا بازنویسی کند                                           |
| `api.registerToolMetadata(...)`                                                      | فراداده نمایش کاتالوگ ابزار بدون تغییر پیاده‌سازی ابزار                                                                                                    |
| `api.registerCommand(...)`                                                           | فرمان‌های محدود به دامنه Plugin؛ نتایج فرمان می‌توانند `continueAgent: true` یا `suppressReply: true` تنظیم کنند؛ فرمان‌های بومی Discord از `descriptionLocalizations` پشتیبانی می‌کنند |
| `api.session.controls.registerControlUiDescriptor(...)`                              | توصیفگرهای مشارکت Control UI برای سطوح نشست، ابزار، اجرا، یا تنظیمات                                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | callbackهای پاک‌سازی برای منابع runtime که مالک آن‌ها Plugin است، در مسیرهای reset/delete/reload                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | اشتراک‌های رویداد پاک‌سازی‌شده برای وضعیت workflow و پایشگرها                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | وضعیت scratch مخصوص Plugin برای هر اجرا که در چرخه عمر پایانی اجرا پاک می‌شود                                                                              |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | فراداده پاک‌سازی برای کارهای زمان‌بند که مالک آن‌ها Plugin است؛ کاری را زمان‌بندی نمی‌کند یا رکورد task نمی‌سازد                                           |
| `api.session.workflow.sendSessionAttachment(...)`                                    | تحویل پیوست فایل فقط برای بسته‌های bundled با میانجی‌گری میزبان، به مسیر نشست فعال direct-outbound                                                        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | نوبت‌های زمان‌بندی‌شده نشست با پشتوانه Cron فقط برای bundled، به‌همراه پاک‌سازی مبتنی بر tag                                                               |
| `api.session.controls.registerSessionAction(...)`                                    | کنش‌های نشست typed که clientها می‌توانند از طریق Gateway ارسال کنند                                                                                        |

برای کد جدید Plugin از namespaceهای گروه‌بندی‌شده استفاده کنید:

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

روش‌های flat معادل همچنان به‌عنوان aliasهای سازگاری deprecated
برای Pluginهای موجود در دسترس می‌مانند. کد جدید Plugin اضافه نکنید که مستقیماً
`api.registerSessionExtension`، `api.enqueueNextTurnInjection`،
`api.registerControlUiDescriptor`، `api.registerRuntimeLifecycle`،
`api.registerAgentEventSubscription`، `api.emitAgentEvent`،
`api.setRunContext`، `api.getRunContext`، `api.clearRunContext`،
`api.registerSessionSchedulerJob`، `api.registerSessionAction`،
`api.sendSessionAttachment`، `api.scheduleSessionTurn`، یا
`api.unscheduleSessionTurnsByTag` را فراخوانی کند.

`scheduleSessionTurn(...)` یک میان‌بر محدود به نشست روی زمان‌بند Cron
در Gateway است. Cron مالک زمان‌بندی است و هنگام اجرای نوبت، رکورد task پس‌زمینه را
می‌سازد؛ Plugin SDK فقط نشست هدف، نام‌گذاری تحت مالکیت Plugin،
و پاک‌سازی را محدود می‌کند. وقتی خود کار به وضعیت پایدار چندمرحله‌ای Task Flow نیاز دارد،
داخل نوبت زمان‌بندی‌شده از `api.runtime.tasks.managedFlows` استفاده کنید.

قراردادها عمداً اختیار را جدا می‌کنند:

- Pluginهای خارجی می‌توانند مالک extensionهای نشست، توصیفگرهای UI، فرمان‌ها، فراداده
  ابزار، تزریق‌های نوبت بعدی، و hookهای عادی باشند.
- سیاست‌های ابزار معتمد پیش از hookهای معمولی `before_tool_call` اجرا می‌شوند و از سوی
  میزبان معتمد هستند. سیاست‌های bundled ابتدا اجرا می‌شوند؛ سیاست‌های Plugin نصب‌شده به
  فعال‌سازی صریح به‌همراه شناسه‌های local خود در
  `contracts.trustedToolPolicies` نیاز دارند، و سپس به ترتیب بارگذاری Plugin اجرا می‌شوند. شناسه‌های سیاست
  به Plugin ثبت‌کننده محدود هستند.
- مالکیت فرمان reserved فقط برای bundled است. Pluginهای خارجی باید از نام‌ها یا aliasهای
  فرمان خودشان استفاده کنند.
- `allowPromptInjection=false` hookهای تغییردهنده prompt را غیرفعال می‌کند، از جمله
  `agent_turn_prepare`، `before_prompt_build`، `heartbeat_prompt_contribution`،
  فیلدهای prompt از `before_agent_start` قدیمی، و
  `enqueueNextTurnInjection`.

نمونه‌هایی از مصرف‌کننده‌های غیر Plan:

| الگوی Plugin                  | hookهای استفاده‌شده                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| workflow تأیید               | extension نشست، ادامه فرمان، تزریق نوبت بعدی، توصیفگر UI                                                                             |
| دروازه سیاست بودجه/workspace | سیاست ابزار معتمد، فراداده ابزار، projection نشست                                                                                     |
| پایشگر چرخه عمر پس‌زمینه      | پاک‌سازی چرخه عمر runtime، اشتراک رویداد عامل، مالکیت/پاک‌سازی زمان‌بند نشست، مشارکت prompt در Heartbeat، توصیفگر UI                |
| جادوگر راه‌اندازی یا onboarding | extension نشست، فرمان‌های scoped، توصیفگر Control UI                                                                                  |

<Note>
  namespaceهای مدیریتی core reserved (`config.*`، `exec.approvals.*`، `wizard.*`،
  `update.*`) همیشه `operator.admin` باقی می‌مانند، حتی اگر یک Plugin تلاش کند
  دامنه روش gateway محدودتری اختصاص دهد. برای
  روش‌هایی که مالک آن‌ها Plugin است، پیشوندهای مخصوص Plugin را ترجیح دهید.
</Note>

<Accordion title="When to use tool-result middleware">
  Pluginهای bundled و Pluginهای نصب‌شده‌ای که صراحتاً فعال شده‌اند و قراردادهای
  manifest منطبق دارند، وقتی نیاز دارند نتیجه ابزار را پس از اجرا و پیش از آنکه runtime
  آن نتیجه را به model بازگرداند بازنویسی کنند، می‌توانند از
  `api.registerAgentToolResultMiddleware(...)` استفاده کنند. این درز معتمد و مستقل از runtime
  برای reducerهای خروجی async مانند tokenjuice است.

Pluginها باید برای هر runtime هدف، `contracts.agentToolResultMiddleware` را اعلام کنند،
برای مثال `["openclaw", "codex"]`. Pluginهای نصب‌شده‌ای که این
قرارداد را ندارند، یا صراحتاً فعال نشده‌اند، نمی‌توانند این middleware را ثبت کنند؛ برای
کاری که به زمان‌بندی نتیجه ابزار پیش از model نیاز ندارد، hookهای عادی Plugin در OpenClaw را نگه دارید.
مسیر قدیمی ثبت کارخانه extension که فقط برای
embedded-runner بود حذف شده است.
</Accordion>

### ثبت کشف Gateway

`api.registerGatewayDiscoveryService(...)` به یک Plugin اجازه می‌دهد Gateway فعال را
روی یک transport کشف local مانند mDNS/Bonjour تبلیغ کند. OpenClaw وقتی کشف local فعال باشد،
در زمان startup Gateway سرویس را فراخوانی می‌کند، portهای فعلی Gateway و داده‌های hint TXT غیرمحرمانه را
ارسال می‌کند، و handler برگشتی `stop` را هنگام shutdown Gateway فراخوانی می‌کند.

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

Pluginهای کشف Gateway نباید مقادیر TXT تبلیغ‌شده را secret یا
authentication تلقی کنند. کشف یک راهنمای routing است؛ احراز هویت Gateway و pinning در TLS همچنان
مالک اعتماد هستند.

### فراداده ثبت CLI

`api.registerCli(registrar, opts?)` دو نوع فراداده فرمان می‌پذیرد:

- `commands`: نام‌های صریح فرمان که مالک آن‌ها registrar است
- `descriptors`: توصیفگرهای فرمان در زمان parse که برای راهنمای CLI،
  routing، و ثبت lazy CLI Plugin استفاده می‌شوند
- `parentPath`: مسیر اختیاری فرمان والد برای گروه‌های فرمان تو‌در‌تو، مانند
  `["nodes"]`

برای قابلیت‌های paired-node،
`api.registerNodeCliFeature(registrar, opts?)` را ترجیح دهید. این یک wrapper کوچک دور
`api.registerCli(..., { parentPath: ["nodes"] })` است و فرمان‌هایی مانند
`openclaw nodes canvas` را به قابلیت‌های node صریحی تبدیل می‌کند که مالک آن‌ها Plugin است.

اگر می‌خواهید یک فرمان Plugin در مسیر عادی root CLI به‌صورت lazy-loaded باقی بماند،
`descriptors`هایی ارائه کنید که هر root فرمان سطح‌بالای نمایش‌داده‌شده توسط آن
registrar را پوشش دهند.

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

فقط زمانی از `commands` به‌تنهایی استفاده کنید که به ثبت lazy root CLI نیاز ندارید.
آن مسیر سازگاری eager همچنان پشتیبانی می‌شود، اما placeholderهای مبتنی بر descriptor
را برای lazy loading در زمان parse نصب نمی‌کند.

### ثبت backend در CLI

`api.registerCliBackend(...)` به یک Plugin اجازه می‌دهد مالک config پیش‌فرض برای یک backend
محلی AI CLI مانند `claude-cli` یا `my-cli` باشد.

- `id` بک‌اند به پیشوند ارائه‌دهنده در ارجاع‌های مدل مانند `my-cli/gpt-5` تبدیل می‌شود.
- `config` بک‌اند همان شکل `agents.defaults.cliBackends.<id>` را به کار می‌برد.
- پیکربندی کاربر همچنان برنده است. OpenClaw پیش از اجرای CLI، `agents.defaults.cliBackends.<id>` را روی مقدار پیش‌فرض Plugin ادغام می‌کند.
- وقتی یک بک‌اند پس از ادغام به بازنویسی‌های سازگاری نیاز دارد، از `normalizeConfig` استفاده کنید
  (برای نمونه، عادی‌سازی شکل‌های قدیمی پرچم).
- برای بازنویسی‌های argv در محدوده درخواست که به گویش CLI تعلق دارند، از `resolveExecutionArgs` استفاده کنید؛ مانند نگاشت سطح‌های تفکر OpenClaw به یک پرچم effort بومی. این هوک `ctx.executionMode` را دریافت می‌کند؛ برای افزودن پرچم‌های جداسازی بومی بک‌اند به فراخوانی‌های گذرای `/btw` از `"side-question"` استفاده کنید. اگر آن پرچم‌ها ابزارهای بومی را برای یک CLI که در غیر این صورت همیشه روشن است به‌طور قابل اتکا غیرفعال می‌کنند، `sideQuestionToolMode: "disabled"` را نیز اعلام کنید.

برای راهنمای نگارش سرتاسری، [Pluginهای بک‌اند CLI](/fa/plugins/cli-backend-plugins) را ببینید.

### جایگاه‌های انحصاری

| روش                                       | آنچه ثبت می‌کند                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | موتور زمینه (هر بار یکی فعال است). وقتی میزبان بتواند عیب‌یابی مدل/ارائه‌دهنده/حالت را فراهم کند، callbackهای چرخه عمر `runtimeSettings` را دریافت می‌کنند؛ موتورهای strict قدیمی‌تر بدون آن کلید دوباره امتحان می‌شوند. |
| `api.registerMemoryCapability(capability)` | قابلیت یکپارچه حافظه                                                                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | سازنده بخش پرامپت حافظه                                                                                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | حل‌کننده طرح تخلیه حافظه                                                                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | آداپتور runtime حافظه                                                                                                                                                                                             |

### آداپتورهای منسوخ جاسازی حافظه

| روش                                           | آنچه ثبت می‌کند                          |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | آداپتور جاسازی حافظه برای Plugin فعال |

- `registerMemoryCapability`، API انحصاری ترجیحی برای Plugin حافظه است.
- `registerMemoryCapability` همچنین می‌تواند `publicArtifacts.listArtifacts(...)` را در معرض دسترس بگذارد
  تا Pluginهای همراه بتوانند به‌جای ورود به چیدمان خصوصی یک Plugin حافظه مشخص،
  مصنوعات حافظه صادرشده را از طریق `openclaw/plugin-sdk/memory-host-core` مصرف کنند.
- `registerMemoryPromptSection`، `registerMemoryFlushPlan` و
  `registerMemoryRuntime`، APIهای انحصاری سازگار با legacy برای Plugin حافظه هستند.
- `MemoryFlushPlan.model` می‌تواند نوبت تخلیه را بدون ارث‌بری از زنجیره fallback فعال،
  به یک ارجاع دقیق `provider/model` مانند `ollama/qwen3:8b` سنجاق کند.
- `registerMemoryEmbeddingProvider` منسوخ شده است. ارائه‌دهندگان جاسازی جدید
  باید از `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders` استفاده کنند.
- ارائه‌دهندگان موجودِ مخصوص حافظه در طول پنجره مهاجرت همچنان کار می‌کنند،
  اما گزارش‌های بازرسی Plugin این مورد را برای Pluginهای غیرباندل‌شده به‌عنوان بدهی سازگاری گزارش می‌کنند.

### رویدادها و چرخه عمر

| روش                                         | کاری که انجام می‌دهد          |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | هوک چرخه عمر typed            |
| `api.onConversationBindingResolved(handler)` | callback اتصال گفت‌وگو       |

برای نمونه‌ها، نام‌های رایج هوک و معنای guard، [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

### معنای تصمیم هوک

`before_install` یک هوک چرخه عمر runtimeِ Plugin است، نه سطح سیاست نصب اپراتور. وقتی یک تصمیم allow/block باید مسیرهای نصب یا به‌روزرسانی پشتیبانی‌شده با CLI و Gateway را پوشش دهد، از `security.installPolicy` استفاده کنید.

- `before_tool_call`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `before_install`: بازگرداندن `{ block: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: بازگرداندن `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `block`)، نه به‌عنوان override.
- `reply_dispatch`: بازگرداندن `{ handled: true, ... }` نهایی است. وقتی هر handler ادعای dispatch کند، handlerهای با اولویت پایین‌تر و مسیر dispatch پیش‌فرض مدل رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: true }` نهایی است. وقتی هر handler آن را تنظیم کند، handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: بازگرداندن `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود (همانند حذف `cancel`)، نه به‌عنوان override.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، از فیلد typed به نام `threadId` استفاده کنید. `metadata` را برای موارد اضافه مخصوص کانال نگه دارید.
- `message_sending`: پیش از fallback به `metadata` مخصوص کانال، از فیلدهای مسیریابی typed به نام `replyToId` / `threadId` استفاده کنید.
- `gateway_start`: برای وضعیت راه‌اندازی متعلق به Gateway، به‌جای تکیه بر هوک‌های داخلی `gateway:startup` از `ctx.config`، `ctx.workspaceDir` و `ctx.getCron?.()` استفاده کنید.
- `cron_changed`: تغییرات چرخه عمر Cron متعلق به Gateway را مشاهده کنید. هنگام همگام‌سازی زمان‌بندهای بیدارسازی خارجی، از `event.job?.state?.nextRunAtMs` و `ctx.getCron?.()` استفاده کنید و OpenClaw را برای بررسی‌های موعد و اجرا منبع حقیقت نگه دارید.

### فیلدهای شیء API

| فیلد                     | نوع                       | توضیح                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | شناسه Plugin                                                                               |
| `api.name`               | `string`                  | نام نمایشی                                                                                 |
| `api.version`            | `string?`                 | نسخه Plugin (اختیاری)                                                                      |
| `api.description`        | `string?`                 | توضیح Plugin (اختیاری)                                                                     |
| `api.source`             | `string`                  | مسیر منبع Plugin                                                                           |
| `api.rootDir`            | `string?`                 | دایرکتوری ریشه Plugin (اختیاری)                                                           |
| `api.config`             | `OpenClawConfig`          | snapshot پیکربندی فعلی (در صورت موجود بودن، snapshot فعال runtime در حافظه)               |
| `api.pluginConfig`       | `Record<string, unknown>` | پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`                                     |
| `api.runtime`            | `PluginRuntime`           | [کمک‌کننده‌های runtime](/fa/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | logger محدود به دامنه (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/setup پیش از entry کامل است   |
| `api.resolvePath(input)` | `(string) => string`      | حل مسیر نسبت به ریشه Plugin                                                                |

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
  `./runtime-api.ts` مسیر‌دهی کنید. مسیر SDK فقط قرارداد خارجی است.
</Warning>

سطوح عمومی Pluginهای باندل‌شده که با facade بارگذاری می‌شوند (`api.ts`، `runtime-api.ts`،
`index.ts`، `setup-entry.ts` و فایل‌های entry عمومی مشابه)، وقتی OpenClaw از قبل در حال اجرا باشد،
snapshot پیکربندی runtime فعال را ترجیح می‌دهند. اگر هنوز هیچ snapshot از runtime وجود نداشته باشد،
به فایل پیکربندی حل‌شده روی دیسک fallback می‌کنند.
facadeهای Plugin باندل‌شده بسته‌بندی‌شده باید از طریق loaderهای facadeِ Plugin در OpenClaw بارگذاری شوند؛
import مستقیم از `dist/extensions/...` بررسی‌های manifest و sidecarِ runtime را که نصب‌های بسته‌بندی‌شده
برای کد متعلق به Plugin استفاده می‌کنند، دور می‌زند.

Pluginهای ارائه‌دهنده می‌توانند وقتی یک helper عمداً مخصوص ارائه‌دهنده است و هنوز به یک زیرمسیر SDK عمومی تعلق ندارد،
یک barrel قرارداد باریک و محلی به Plugin را در معرض دسترس بگذارند. نمونه‌های باندل‌شده:

- **Anthropic**: مرز عمومی `api.ts` / `contract-api.ts` برای helperهای beta-headerِ Claude
  و جریان `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` سازنده‌های ارائه‌دهنده،
  helperهای مدل پیش‌فرض و سازنده‌های ارائه‌دهنده realtime را export می‌کند.
- **`@openclaw/openrouter-provider`**: `api.ts` سازنده ارائه‌دهنده
  به‌همراه helperهای onboarding/پیکربندی را export می‌کند.

<Warning>
  کد production افزونه‌ها نیز باید از importهای `openclaw/plugin-sdk/<other-plugin>` پرهیز کند.
  اگر یک helper واقعاً مشترک است، به‌جای coupling دو Plugin به یکدیگر، آن را به یک زیرمسیر بی‌طرف SDK
  مانند `openclaw/plugin-sdk/speech`، `.../provider-model-shared` یا سطح دیگری با محوریت قابلیت ارتقا دهید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="نقاط ورود" icon="door-open" href="/fa/plugins/sdk-entrypoints">
    گزینه‌های `definePluginEntry` و `defineChannelPluginEntry`.
  </Card>
  <Card title="کمک‌کننده‌های runtime" icon="gears" href="/fa/plugins/sdk-runtime">
    مرجع کامل فضای نام `api.runtime`.
  </Card>
  <Card title="setup و پیکربندی" icon="sliders" href="/fa/plugins/sdk-setup">
    بسته‌بندی، manifestها و schemaهای پیکربندی.
  </Card>
  <Card title="آزمون" icon="vial" href="/fa/plugins/sdk-testing">
    ابزارهای آزمون و قواعد lint.
  </Card>
  <Card title="مهاجرت SDK" icon="arrows-turn-right" href="/fa/plugins/sdk-migration">
    مهاجرت از سطوح منسوخ‌شده.
  </Card>
  <Card title="درون‌ساختارهای Plugin" icon="diagram-project" href="/fa/plugins/architecture">
    معماری عمیق و مدل قابلیت.
  </Card>
</CardGroup>
