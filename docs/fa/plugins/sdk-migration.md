---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را مشاهده می‌کنید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را مشاهده می‌کنید
    - پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده کرده بودید
    - در حال به‌روزرسانی یک Plugin به معماری مدرن Plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید
sidebarTitle: Migrate to SDK
summary: از لایه قدیمی سازگاری رو به عقب به SDK مدرن Plugin مهاجرت کنید
title: مهاجرت Plugin SDK
x-i18n:
    generated_at: "2026-04-29T23:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایه گسترده سازگاری با نسخه‌های قبلی به یک معماری مدرن Plugin
با importهای متمرکز و مستند منتقل شده است. اگر Plugin شما پیش از
معماری جدید ساخته شده، این راهنما به شما برای مهاجرت کمک می‌کند.

## چه چیزی تغییر می‌کند

سیستم قدیمی Plugin دو سطح بسیار باز ارائه می‌کرد که به Pluginها اجازه می‌داد
هر چیزی را که لازم داشتند از یک نقطه ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** — یک import واحد که ده‌ها
  helper را دوباره export می‌کرد. این برای فعال نگه داشتن Pluginهای قدیمی مبتنی بر hook
  هنگام ساخت معماری جدید Plugin معرفی شده بود.
- **`openclaw/plugin-sdk/infra-runtime`** — یک barrel گسترده helperهای runtime که
  رویدادهای سیستم، وضعیت heartbeat، صف‌های delivery، helperهای fetch/proxy،
  helperهای فایل، نوع‌های approval و utilityهای نامرتبط را با هم ترکیب می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** — یک barrel گسترده سازگاری config
  که هنوز helperهای load/write مستقیم و منسوخ‌شده را در طول بازه مهاجرت
  حمل می‌کند.
- **`openclaw/extension-api`** — پلی که به Pluginها دسترسی مستقیم به
  helperهای سمت host مانند embedded agent runner می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** — یک hook حذف‌شده مخصوص Pi برای
  extensionهای bundled که می‌توانست رویدادهای embedded-runner مانند
  `tool_result` را مشاهده کند.

سطح‌های import گسترده اکنون **منسوخ** شده‌اند. آن‌ها هنوز در runtime کار می‌کنند،
اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از آنکه
نسخه major بعدی آن‌ها را حذف کند مهاجرت کنند. API ثبت embedded extension factory
مخصوص Pi حذف شده است؛ به‌جای آن از middleware نتیجه ابزار استفاده کنید.

OpenClaw رفتار مستندشده Plugin را در همان تغییری که جایگزین را معرفی می‌کند
حذف یا بازتفسیر نمی‌کند. تغییرات breaking در قرارداد ابتدا باید از مسیر
adapter سازگاری، diagnostics، مستندات و یک بازه deprecation عبور کنند.
این شامل importهای SDK، فیلدهای manifest، APIهای setup، hookها و رفتار
ثبت runtime می‌شود.

<Warning>
  لایه سازگاری با نسخه‌های قبلی در یک نسخه major آینده حذف خواهد شد.
  Pluginهایی که هنوز از این سطح‌ها import می‌کنند وقتی این اتفاق رخ دهد خراب خواهند شد.
  ثبت‌های embedded extension factory مخصوص Pi همین حالا هم دیگر load نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکل ایجاد می‌کرد:

- **راه‌اندازی کند** — import کردن یک helper ده‌ها ماژول نامرتبط را load می‌کرد
- **وابستگی‌های چرخه‌ای** — re-exportهای گسترده ایجاد چرخه‌های import را آسان می‌کرد
- **سطح API نامشخص** — راهی برای تشخیص exportهای پایدار از internal وجود نداشت

SDK مدرن Plugin این مشکل را حل می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`)
یک ماژول کوچک و خودبسنده با هدف روشن و قرارداد مستند است.

seamهای convenience قدیمی provider برای channelهای bundled نیز حذف شده‌اند.
seamهای helper با برند channel میانبرهای خصوصی mono-repo بودند، نه قراردادهای پایدار
Plugin. به‌جای آن از subpathهای باریک و عمومی SDK استفاده کنید. داخل workspace
Pluginهای bundled، helperهای متعلق به provider را در `api.ts` یا
`runtime-api.ts` همان Plugin نگه دارید.

نمونه‌های فعلی providerهای bundled:

- Anthropic helperهای stream مخصوص Claude را در seam اختصاصی `api.ts` /
  `contract-api.ts` خودش نگه می‌دارد
- OpenAI سازنده‌های provider، helperهای default-model و سازنده‌های realtime provider
  را در `api.ts` خودش نگه می‌دارد
- OpenRouter سازنده provider و helperهای onboarding/config را در
  `api.ts` خودش نگه می‌دارد

## سیاست سازگاری

برای Pluginهای خارجی، کار سازگاری به این ترتیب انجام می‌شود:

1. قرارداد جدید را اضافه کنید
2. رفتار قدیمی را از طریق adapter سازگاری متصل نگه دارید
3. یک diagnostic یا warning منتشر کنید که مسیر قدیمی و جایگزین را نام می‌برد
4. هر دو مسیر را در testها پوشش دهید
5. deprecation و مسیر مهاجرت را مستند کنید
6. فقط پس از بازه مهاجرت اعلام‌شده حذف کنید، معمولا در یک نسخه major

maintainerها می‌توانند صف فعلی مهاجرت را با
`pnpm plugins:boundary-report` بررسی کنند. برای شمارش‌های فشرده از
`pnpm plugins:boundary-report:summary`، برای یک Plugin یا مالک سازگاری از
`--owner <id>`، و زمانی که gate CI باید در برابر رکوردهای سازگاری سررسیدشده،
importهای SDK رزروشده cross-owner یا subpathهای SDK رزروشده استفاده‌نشده fail شود از
`pnpm plugins:boundary-report:ci` استفاده کنید. این گزارش رکوردهای
سازگاری منسوخ‌شده را بر اساس تاریخ حذف گروه‌بندی می‌کند، referenceهای code/docs محلی را
می‌شمارد، importهای SDK رزروشده cross-owner را نشان می‌دهد، و bridge خصوصی
SDK memory-host را خلاصه می‌کند تا cleanup سازگاری صریح بماند و به جست‌وجوهای ad hoc
متکی نباشد. subpathهای SDK رزروشده باید usage مالک track‌شده داشته باشند؛
exportهای helper رزروشده استفاده‌نشده باید از SDK عمومی حذف شوند.

اگر یک فیلد manifest هنوز پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی که
مستندات و diagnostics خلاف آن را بگویند به استفاده از آن ادامه دهند. کد جدید باید
جایگزین مستندشده را ترجیح دهد، اما Pluginهای موجود نباید در releaseهای minor معمولی
خراب شوند.

## روش مهاجرت

<Steps>
  <Step title="helperهای load/write config در runtime را مهاجرت دهید">
    Pluginهای bundled باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. configی را ترجیح دهید که
    از قبل به مسیر فراخوانی فعال پاس داده شده است. handlerهای طولانی‌عمر که به
    snapshot فعلی process نیاز دارند می‌توانند از `api.runtime.config.current()` استفاده کنند.
    ابزارهای agent طولانی‌عمر باید داخل `execute` از `ctx.getRuntimeConfig()` در tool context
    استفاده کنند تا ابزاری که پیش از یک write config ساخته شده همچنان config runtime
    تازه‌شده را ببیند.

    writeهای config باید از helperهای transactional عبور کنند و یک policy پس از write
    انتخاب کنند:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    وقتی caller می‌داند تغییر به restart تمیز Gateway نیاز دارد از
    `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید، و فقط وقتی caller مالک
    follow-up است و عمدا می‌خواهد reload planner را سرکوب کند از
    `afterWrite: { mode: "none", reason: "..." }` استفاده کنید.
    نتیجه‌های mutation شامل یک خلاصه تایپ‌شده `followUp` برای testها و logging هستند؛
    Gateway همچنان مسئول اعمال یا زمان‌بندی restart باقی می‌ماند.
    `loadConfig` و `writeConfigFile` در طول بازه مهاجرت به‌عنوان helperهای سازگاری
    منسوخ‌شده برای Pluginهای خارجی باقی می‌مانند و یک‌بار با کد سازگاری
    `runtime-config-load-write` warning می‌دهند. Pluginهای bundled و کد runtime repo
    با guardrailهای scanner در
    `pnpm check:deprecated-internal-config-api` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفاده جدید production Plugin
    کاملا fail می‌شود، write مستقیم config fail می‌شود، متدهای server در Gateway باید از
    snapshot runtime درخواست استفاده کنند، helperهای send/action/client مربوط به runtime channel
    باید config را از boundary خود دریافت کنند، و ماژول‌های runtime طولانی‌عمر
    هیچ فراخوانی ambient مجاز `loadConfig()` ندارند.

    کد جدید Plugin همچنین باید از import کردن barrel گسترده سازگاری
    `openclaw/plugin-sdk/config-runtime` اجتناب کند. از subpath باریک SDK که با کار مطابقت دارد استفاده کنید:

    | نیاز | Import |
    | --- | --- |
    | نوع‌های config مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | assertionهای config از قبل load‌شده و lookup config ورودی Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot فعلی runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | writeهای config | `openclaw/plugin-sdk/config-mutation` |
    | helperهای session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای runtime برای group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | resolution ورودی secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | overrideهای model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای bundled و testهای آن‌ها در برابر barrel گسترده scanner-guarded هستند
    تا importها و mockها محلی و محدود به رفتاری بمانند که نیاز دارند. barrel گسترده
    هنوز برای سازگاری خارجی وجود دارد، اما کد جدید نباید به آن وابسته باشد.

  </Step>

  <Step title="extensionهای نتیجه ابزار Pi را به middleware مهاجرت دهید">
    Pluginهای bundled باید handlerهای نتیجه ابزار مخصوص Pi در
    `api.registerEmbeddedExtensionFactory(...)` را با middleware بی‌طرف نسبت به runtime
    جایگزین کنند.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    هم‌زمان manifest Plugin را نیز به‌روزرسانی کنید:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Pluginهای خارجی نمی‌توانند middleware نتیجه ابزار ثبت کنند زیرا می‌تواند
    خروجی ابزار با اعتماد بالا را پیش از آنکه model آن را ببیند بازنویسی کند.

  </Step>

  <Step title="handlerهای approval-native را به factهای capability مهاجرت دهید">
    Pluginهای channel دارای قابلیت approval اکنون رفتار native approval را از طریق
    `approvalCapability.nativeRuntime` به‌همراه registry مشترک runtime-context ارائه می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery اختصاصی approval را از wiring قدیمی `plugin.auth` /
      `plugin.approvals` به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از قرارداد عمومی channel-plugin حذف شده است؛
      فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های login/logout channel باقی می‌ماند؛ hookهای auth مربوط به approval
      آنجا دیگر توسط core خوانده نمی‌شوند
    - objectهای runtime متعلق به channel مانند clientها، tokenها یا Bolt
      appها را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - از handlerهای native approval، noticeهای reroute متعلق به Plugin ارسال نکنید؛
      core اکنون مالک noticeهای routed-elsewhere از نتیجه‌های واقعی delivery است
    - هنگام پاس دادن `channelRuntime` به `createChannelManager(...)`، یک
      سطح واقعی `createPluginRuntime().channel` ارائه کنید. stubهای partial رد می‌شوند.

    برای layout فعلی approval capability به `/plugins/sdk-channel-plugins` مراجعه کنید.

  </Step>

  <Step title="رفتار fallback wrapper در Windows را audit کنید">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای Windows
    حل‌نشده `.cmd`/`.bat` اکنون fail closed می‌شوند مگر اینکه صراحتا
    `allowShellFallback: true` را پاس دهید.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    اگر caller شما عمدا به shell fallback متکی نیست،
    `allowShellFallback` را تنظیم نکنید و به‌جای آن error پرتاب‌شده را handle کنید.

  </Step>

  <Step title="importهای منسوخ‌شده را پیدا کنید">
    Plugin خود را برای import از هر یک از سطح‌های منسوخ‌شده جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="با importهای متمرکز جایگزین کنید">
    هر export از سطح قدیمی به یک مسیر import مدرن مشخص map می‌شود:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    برای helperهای سمت host، به‌جای import مستقیم از runtime تزریق‌شده Plugin استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    همین الگو برای سایر ابزارهای کمکی پل قدیمی نیز اعمال می‌شود:

    | import قدیمی | معادل مدرن |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ابزارهای کمکی ذخیره‌سازی نشست | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` همچنان برای سازگاری خارجی وجود دارد،
    اما کد جدید باید سطح ابزار کمکی متمرکزی را import کند که واقعا به آن نیاز دارد:

    | نیاز | import |
    | --- | --- |
    | ابزارهای کمکی صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | ابزارهای کمکی رویداد Heartbeat و نمایانی | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تخلیه صف تحویل معلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | تله‌متری فعالیت کانال | `openclaw/plugin-sdk/channel-activity-runtime` |
    | حافظه‌های کش حذف تکراری درون‌حافظه‌ای | `openclaw/plugin-sdk/dedupe-runtime` |
    | ابزارهای کمکی امن برای مسیر فایل محلی/رسانه | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch آگاه از dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ابزارهای کمکی proxy و fetch محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | نوع‌های سیاست dispatcher مربوط به SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | نوع‌های درخواست/حل‌وفصل تایید | `openclaw/plugin-sdk/approval-runtime` |
    | payload پاسخ تایید و ابزارهای کمکی فرمان | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ابزارهای کمکی قالب‌بندی خطا | `openclaw/plugin-sdk/error-runtime` |
    | انتظارهای آماده‌بودن transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ابزارهای کمکی token امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | هم‌زمانی محدودشده task ناهمگام | `openclaw/plugin-sdk/concurrency-runtime` |
    | تبدیل نوع عددی | `openclaw/plugin-sdk/number-runtime` |
    | قفل ناهمگام محلیِ فرایند | `openclaw/plugin-sdk/async-lock-runtime` |
    | قفل‌های فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای باندل‌شده با scanner در برابر `infra-runtime` محافظت می‌شوند، بنابراین کد repo نمی‌تواند به barrel گسترده برگردد.

  </Step>

  <Step title="Migrate channel route helpers">
    کد جدید مسیر کانال باید از `openclaw/plugin-sdk/channel-route` استفاده کند.
    نام‌های قدیمی‌تر route-key و comparable-target در بازه مهاجرت به‌عنوان aliasهای سازگاری باقی می‌مانند،
    اما Pluginهای جدید باید از نام‌های مسیر استفاده کنند که رفتار را مستقیما توصیف می‌کنند:

    | ابزار کمکی قدیمی | ابزار کمکی مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ابزارهای کمکی مدرن مسیر، `{ channel, to, accountId, threadId }`
    را به‌طور یکنواخت در تاییدهای بومی، سرکوب پاسخ، حذف تکراری ورودی،
    تحویل cron، و مسیریابی نشست نرمال‌سازی می‌کنند. اگر Plugin شما دستورزبان target سفارشی
    دارد، از `resolveChannelRouteTargetWithParser(...)` استفاده کنید تا آن
    parser را با همان قرارداد target مسیر سازگار کند.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسیر import

  <Accordion title="Common import path table">
  | مسیر واردسازی | هدف | exportهای کلیدی |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | کمک‌کننده متعارف برای ورودی Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | بازصادرات چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export طرح‌واره پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | کمک‌کننده ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | کمک‌کننده‌های مشترک جادوگر راه‌اندازی | اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | کمک‌کننده‌های زمان اجرای هنگام راه‌اندازی | آداپتورهای وصله راه‌اندازی امن برای import، کمک‌کننده‌های یادداشت جست‌وجو، `promptResolvedAllowFrom`, `splitSetupEntries`, پراکسی‌های راه‌اندازی واگذارشده |
  | `plugin-sdk/setup-adapter-runtime` | کمک‌کننده‌های آداپتور راه‌اندازی | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | کمک‌کننده‌های ابزارهای راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | کمک‌کننده‌های چندحسابی | کمک‌کننده‌های فهرست حساب/پیکربندی/دروازه اقدام |
  | `plugin-sdk/account-id` | کمک‌کننده‌های شناسه حساب | `DEFAULT_ACCOUNT_ID`, نرمال‌سازی شناسه حساب |
  | `plugin-sdk/account-resolution` | کمک‌کننده‌های جست‌وجوی حساب | کمک‌کننده‌های جست‌وجوی حساب و جایگزین پیش‌فرض |
  | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود حساب | کمک‌کننده‌های فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | سازه‌های پایه جفت‌سازی پیام خصوصی | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | سیم‌کشی پیشوند پاسخ، تایپ‌کردن، و تحویل مبدأ | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | کارخانه‌های آداپتور پیکربندی و کمک‌کننده‌های دسترسی به پیام خصوصی | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های طرح‌واره پیکربندی | فقط سازه‌های پایه طرح‌واره پیکربندی کانال مشترک و سازنده عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | طرح‌واره‌های پیکربندی همراه | فقط plugins همراه نگهداری‌شده توسط OpenClaw؛ plugins جدید باید طرح‌واره‌های محلی Plugin را تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | طرح‌واره‌های پیکربندی همراه منسوخ | فقط نام مستعار سازگاری؛ برای plugins همراه نگهداری‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های پیکربندی فرمان Telegram | نرمال‌سازی نام فرمان، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تعارض |
  | `plugin-sdk/channel-policy` | حل خط‌مشی گروه/پیام خصوصی | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | کمک‌کننده‌های وضعیت حساب و چرخه عمر جریان پیش‌نویس | `createAccountStatusSink`, کمک‌کننده‌های نهایی‌سازی پیش‌نمایش پیش‌نویس |
  | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های پاکت ورودی | کمک‌کننده‌های مشترک سازنده مسیر و پاکت |
  | `plugin-sdk/inbound-reply-dispatch` | کمک‌کننده‌های پاسخ ورودی | کمک‌کننده‌های مشترک ثبت و ارسال |
  | `plugin-sdk/messaging-targets` | تجزیه هدف پیام‌رسانی | کمک‌کننده‌های تجزیه/تطبیق هدف |
  | `plugin-sdk/outbound-media` | کمک‌کننده‌های رسانه خروجی | بارگذاری مشترک رسانه خروجی |
  | `plugin-sdk/outbound-send-deps` | کمک‌کننده‌های وابستگی ارسال خروجی | جست‌وجوی سبک `resolveOutboundSendDep` بدون import کردن کل زمان اجرای خروجی |
  | `plugin-sdk/outbound-runtime` | کمک‌کننده‌های زمان اجرای خروجی | کمک‌کننده‌های تحویل خروجی، نماینده هویت/ارسال، جلسه، قالب‌بندی، و برنامه‌ریزی payload |
  | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های اتصال رشته گفتگو | چرخه عمر اتصال رشته گفتگو و کمک‌کننده‌های آداپتور |
  | `plugin-sdk/agent-media-payload` | کمک‌کننده‌های قدیمی payload رسانه | سازنده payload رسانه عامل برای چیدمان‌های قدیمی فیلد |
  | `plugin-sdk/channel-runtime` | shim سازگاری منسوخ | فقط ابزارهای زمان اجرای کانال قدیمی |
  | `plugin-sdk/channel-send-result` | انواع نتیجه ارسال | انواع نتیجه پاسخ |
  | `plugin-sdk/runtime-store` | فضای ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | کمک‌کننده‌های گسترده زمان اجرا | کمک‌کننده‌های زمان اجرا/لاگ‌گیری/پشتیبان‌گیری/نصب Plugin |
  | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود محیط زمان اجرا | کمک‌کننده‌های لاگر/محیط زمان اجرا، timeout، تلاش مجدد، و backoff |
  | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک زمان اجرای Plugin | کمک‌کننده‌های فرمان‌ها/hooks/http/تعاملی Plugin |
  | `plugin-sdk/hook-runtime` | کمک‌کننده‌های خط لوله hook | کمک‌کننده‌های مشترک خط لوله hook داخلی/Webhook |
  | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های زمان اجرای lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | کمک‌کننده‌های فرایند | کمک‌کننده‌های مشترک اجرا |
  | `plugin-sdk/cli-runtime` | کمک‌کننده‌های زمان اجرای CLI | قالب‌بندی فرمان، انتظارها، کمک‌کننده‌های نسخه |
  | `plugin-sdk/gateway-runtime` | کمک‌کننده‌های Gateway | کلاینت Gateway، کمک‌کننده شروع آماده برای حلقه رویداد، و کمک‌کننده‌های وصله وضعیت کانال |
  | `plugin-sdk/config-runtime` | shim سازگاری پیکربندی منسوخ | `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های فرمان Telegram | کمک‌کننده‌های اعتبارسنجی فرمان Telegram با پایداری جایگزین، وقتی سطح قرارداد Telegram همراه در دسترس نیست |
  | `plugin-sdk/approval-runtime` | کمک‌کننده‌های اعلان تأیید | payload تأیید اجرا/Plugin، کمک‌کننده‌های قابلیت/پروفایل تأیید، کمک‌کننده‌های مسیریابی/زمان اجرای تأیید native، و قالب‌بندی مسیر نمایش تأیید ساخت‌یافته |
  | `plugin-sdk/approval-auth-runtime` | کمک‌کننده‌های احراز هویت تأیید | حل‌کننده تأییدکننده، احراز هویت اقدام در همان چت |
  | `plugin-sdk/approval-client-runtime` | کمک‌کننده‌های کلاینت تأیید | کمک‌کننده‌های پروفایل/فیلتر تأیید اجرای native |
  | `plugin-sdk/approval-delivery-runtime` | کمک‌کننده‌های تحویل تأیید | آداپتورهای قابلیت/تحویل تأیید native |
  | `plugin-sdk/approval-gateway-runtime` | کمک‌کننده‌های Gateway تأیید | کمک‌کننده مشترک حل Gateway تأیید |
  | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کننده‌های آداپتور تأیید | کمک‌کننده‌های سبک بارگذاری آداپتور تأیید native برای نقاط ورود داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | کمک‌کننده‌های handler تأیید | کمک‌کننده‌های گسترده‌تر زمان اجرای handler تأیید؛ وقتی seamهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | کمک‌کننده‌های هدف تأیید | کمک‌کننده‌های اتصال هدف/حساب تأیید native |
  | `plugin-sdk/approval-reply-runtime` | کمک‌کننده‌های پاسخ تأیید | کمک‌کننده‌های payload پاسخ تأیید اجرا/Plugin |
  | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های زمینه زمان اجرای کانال | کمک‌کننده‌های عمومی ثبت/گرفتن/مشاهده زمینه زمان اجرای کانال |
  | `plugin-sdk/security-runtime` | کمک‌کننده‌های امنیت | کمک‌کننده‌های مشترک اعتماد، دروازه‌گذاری پیام خصوصی، محتوای خارجی، و گردآوری secret |
  | `plugin-sdk/ssrf-policy` | کمک‌کننده‌های خط‌مشی SSRF | کمک‌کننده‌های فهرست مجاز میزبان و خط‌مشی شبکه خصوصی |
  | `plugin-sdk/ssrf-runtime` | کمک‌کننده‌های زمان اجرای SSRF | dispatcher پین‌شده، fetch محافظت‌شده، کمک‌کننده‌های خط‌مشی SSRF |
  | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های Heartbeat | کمک‌کننده‌های رویداد و نمایانی Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده‌های صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | کمک‌کننده‌های فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های حذف تکراری | کش‌های حذف تکراری در حافظه |
  | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های دسترسی به فایل | کمک‌کننده‌های امن مسیر فایل/رسانه محلی |
  | `plugin-sdk/transport-ready-runtime` | کمک‌کننده‌های آمادگی انتقال | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | کمک‌کننده‌های کش محدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های دروازه‌گذاری تشخیصی | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | کمک‌کننده‌های قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`, کمک‌کننده‌های گراف خطا |
  | `plugin-sdk/fetch-runtime` | کمک‌کننده‌های fetch/proxy پوشش‌داده‌شده | `resolveFetch`, کمک‌کننده‌های proxy، کمک‌کننده‌های گزینه EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | کمک‌کننده‌های تلاش مجدد | `RetryConfig`, `retryAsync`, اجراکننده‌های خط‌مشی |
  | `plugin-sdk/allow-from` | قالب‌بندی فهرست مجاز | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | نگاشت ورودی فهرست مجاز | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | کمک‌کننده‌های دروازه‌گذاری فرمان و سطح فرمان | `resolveControlCommandGate`, کمک‌کننده‌های مجوزدهی فرستنده، کمک‌کننده‌های رجیستری فرمان از جمله قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | رندرکننده‌های وضعیت/راهنمای فرمان | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تجزیه ورودی secret | کمک‌کننده‌های ورودی secret |
  | `plugin-sdk/webhook-ingress` | کمک‌کننده‌های درخواست Webhook | ابزارهای هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | کمک‌کننده‌های نگهبان بدنه Webhook | کمک‌کننده‌های خواندن/محدودسازی بدنه درخواست |
  | `plugin-sdk/reply-runtime` | زمان اجرای پاسخ مشترک | ارسال ورودی، Heartbeat، برنامه‌ریز پاسخ، قطعه‌بندی |
  | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود ارسال پاسخ | نهایی‌سازی، ارسال ارائه‌دهنده، و کمک‌کننده‌های برچسب گفتگو |
  | `plugin-sdk/reply-history` | کمک‌کننده‌های تاریخچه پاسخ | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی ارجاع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | کمک‌کننده‌های قطعه پاسخ | کمک‌کننده‌های قطعه‌بندی متن/markdown |
  | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های ذخیره‌گاه جلسه | کمک‌کننده‌های مسیر ذخیره‌گاه و زمان به‌روزرسانی |
  | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر وضعیت | کمک‌کننده‌های مسیر وضعیت و دایرکتوری OAuth |
  | `plugin-sdk/routing` | کمک‌کننده‌های مسیریابی/کلید جلسه | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, کمک‌کننده‌های نرمال‌سازی کلید جلسه |
  | `plugin-sdk/status-helpers` | کمک‌کننده‌های وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، کمک‌کننده‌های فراداده مسئله |
  | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های حل‌کننده هدف | کمک‌کننده‌های مشترک حل‌کننده هدف |
  | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های نرمال‌سازی رشته | کمک‌کننده‌های نرمال‌سازی slug/رشته |
  | `plugin-sdk/request-url` | کمک‌کننده‌های URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | کمک‌کننده‌های فرمان زمان‌دار | اجراکننده فرمان زمان‌دار با stdout/stderr نرمال‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های رایج پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج بار داده ابزار | بار داده‌های نرمال‌شده را از اشیای نتیجه ابزار استخراج می‌کند |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | فیلدهای هدف ارسال استاندارد را از آرگومان‌های ابزار استخراج می‌کند |
  | `plugin-sdk/temp-path` | کمک‌کننده‌های مسیر موقت | کمک‌کننده‌های مشترک مسیر دانلود موقت |
  | `plugin-sdk/logging-core` | کمک‌کننده‌های ثبت گزارش | کمک‌کننده‌های ثبت گزارش زیرسامانه و ویرایش اطلاعات حساس |
  | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های جدول Markdown | کمک‌کننده‌های حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | انواع پاسخ پیام | انواع بار داده پاسخ |
  | `plugin-sdk/provider-setup` | کمک‌کننده‌های گزینش‌شده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان | کمک‌کننده‌های کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI | همان کمک‌کننده‌های کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های احراز هویت زمان اجرای ارائه‌دهنده | کمک‌کننده‌های رفع API-key در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های راه‌اندازی API-key ارائه‌دهنده | کمک‌کننده‌های ورود اولیه/نوشتن نمایه API-key |
  | `plugin-sdk/provider-auth-result` | کمک‌کننده‌های نتیجه احراز هویت ارائه‌دهنده | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-auth-login` | کمک‌کننده‌های ورود تعاملی ارائه‌دهنده | کمک‌کننده‌های مشترک ورود تعاملی |
  | `plugin-sdk/provider-selection-runtime` | کمک‌کننده‌های انتخاب ارائه‌دهنده | انتخاب ارائه‌دهنده پیکربندی‌شده یا خودکار و ادغام پیکربندی خام ارائه‌دهنده |
  | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های متغیر محیطی ارائه‌دهنده | کمک‌کننده‌های جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
  | `plugin-sdk/provider-model-shared` | کمک‌کننده‌های مشترک مدل/بازپخش ارائه‌دهنده | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های نقطه پایانی ارائه‌دهنده، و کمک‌کننده‌های نرمال‌سازی شناسه مدل |
  | `plugin-sdk/provider-catalog-shared` | کمک‌کننده‌های مشترک کاتالوگ ارائه‌دهنده | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های ورود اولیه ارائه‌دهنده | کمک‌کننده‌های پیکربندی ورود اولیه |
  | `plugin-sdk/provider-http` | کمک‌کننده‌های HTTP ارائه‌دهنده | کمک‌کننده‌های عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، از جمله کمک‌کننده‌های فرم چندبخشی رونویسی صوت |
  | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های وب‌واکشی ارائه‌دهنده | کمک‌کننده‌های ثبت/کش ارائه‌دهنده وب‌واکشی |
  | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های پیکربندی جست‌وجوی وب ارائه‌دهنده | کمک‌کننده‌های محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های قرارداد جست‌وجوی وب ارائه‌دهنده | کمک‌کننده‌های محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`، `enablePluginInConfig`، `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه مشخص |
  | `plugin-sdk/provider-web-search` | کمک‌کننده‌های جست‌وجوی وب ارائه‌دهنده | کمک‌کننده‌های ثبت/کش/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
  | `plugin-sdk/provider-tools` | کمک‌کننده‌های سازگاری ابزار/طرحواره ارائه‌دهنده | `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks`، پاک‌سازی + عیب‌یابی طرحواره Gemini، و کمک‌کننده‌های سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | کمک‌کننده‌های مصرف ارائه‌دهنده | `fetchClaudeUsage`، `fetchGeminiUsage`، `fetchGithubCopilotUsage`، و دیگر کمک‌کننده‌های مصرف ارائه‌دهنده |
  | `plugin-sdk/provider-stream` | کمک‌کننده‌های پوشش‌دهنده جریان ارائه‌دهنده | `ProviderStreamFamily`، `buildProviderStreamFamilyHooks`، `composeProviderStreamWrappers`، انواع پوشش‌دهنده جریان، و کمک‌کننده‌های مشترک پوشش‌دهنده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های انتقال ارائه‌دهنده | کمک‌کننده‌های انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
  | `plugin-sdk/keyed-async-queue` | صف ناهمگام مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک رسانه | کمک‌کننده‌های واکشی/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو مبتنی بر ffprobe، و سازنده‌های بار داده رسانه |
  | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک تولید رسانه | کمک‌کننده‌های مشترک گذار پس از خرابی، انتخاب نامزد، و پیام‌رسانی مدل گم‌شده برای تولید تصویر/ویدئو/موسیقی |
  | `plugin-sdk/media-understanding` | کمک‌کننده‌های درک رسانه | انواع ارائه‌دهنده درک رسانه به‌همراه خروجی‌های کمکی تصویر/صوت روبه‌روی ارائه‌دهنده |
  | `plugin-sdk/text-runtime` | کمک‌کننده‌های مشترک متن | حذف متن قابل مشاهده برای دستیار، کمک‌کننده‌های رندر/قطعه‌بندی/جدول Markdown، کمک‌کننده‌های ویرایش اطلاعات حساس، کمک‌کننده‌های برچسب دستورالعمل، ابزارهای متن ایمن، و کمک‌کننده‌های مرتبط متن/ثبت گزارش |
  | `plugin-sdk/text-chunking` | کمک‌کننده‌های قطعه‌بندی متن | کمک‌کننده قطعه‌بندی متن خروجی |
  | `plugin-sdk/speech` | کمک‌کننده‌های گفتار | انواع ارائه‌دهنده گفتار به‌همراه کمک‌کننده‌های دستورالعمل، رجیستری و اعتبارسنجی روبه‌روی ارائه‌دهنده، و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته مشترک گفتار | انواع ارائه‌دهنده گفتار، رجیستری، دستورالعمل‌ها، نرمال‌سازی |
  | `plugin-sdk/realtime-transcription` | کمک‌کننده‌های رونویسی بلادرنگ | انواع ارائه‌دهنده، کمک‌کننده‌های رجیستری، و کمک‌کننده مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | کمک‌کننده‌های صدای بلادرنگ | انواع ارائه‌دهنده، کمک‌کننده‌های رجیستری/رفع، و کمک‌کننده‌های نشست پل |
  | `plugin-sdk/image-generation` | کمک‌کننده‌های تولید تصویر | انواع ارائه‌دهنده تولید تصویر به‌همراه کمک‌کننده‌های URL داده/دارایی تصویر و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | انواع تولید تصویر، گذار پس از خرابی، احراز هویت، و کمک‌کننده‌های رجیستری |
  | `plugin-sdk/music-generation` | کمک‌کننده‌های تولید موسیقی | انواع ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | انواع تولید موسیقی، کمک‌کننده‌های گذار پس از خرابی، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
  | `plugin-sdk/video-generation` | کمک‌کننده‌های تولید ویدئو | انواع ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدئو | انواع تولید ویدئو، کمک‌کننده‌های گذار پس از خرابی، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
  | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های پاسخ تعاملی | نرمال‌سازی/کاهش بار داده پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | سازه‌های اولیه پیکربندی کانال | سازه‌های اولیه محدود طرحواره پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های نوشتن پیکربندی کانال | کمک‌کننده‌های مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | دیباچه مشترک کانال | خروجی‌های مشترک دیباچه Plugin کانال |
  | `plugin-sdk/channel-status` | کمک‌کننده‌های وضعیت کانال | کمک‌کننده‌های مشترک نما/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های پیکربندی فهرست مجاز | کمک‌کننده‌های ویرایش/خواندن پیکربندی فهرست مجاز |
  | `plugin-sdk/group-access` | کمک‌کننده‌های دسترسی گروه | کمک‌کننده‌های مشترک تصمیم‌گیری دسترسی گروه |
  | `plugin-sdk/direct-dm` | کمک‌کننده‌های پیام مستقیم | کمک‌کننده‌های مشترک احراز هویت/محافظ پیام مستقیم |
  | `plugin-sdk/extension-shared` | کمک‌کننده‌های مشترک افزونه | سازه‌های اولیه کمکی کانال غیرفعال/وضعیت و پروکسی محیطی |
  | `plugin-sdk/webhook-targets` | کمک‌کننده‌های هدف Webhook | رجیستری هدف Webhook و کمک‌کننده‌های نصب مسیر |
  | `plugin-sdk/webhook-path` | کمک‌کننده‌های مسیر Webhook | کمک‌کننده‌های نرمال‌سازی مسیر Webhook |
  | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک رسانه وب | کمک‌کننده‌های بارگذاری رسانه دوردست/محلی |
  | `plugin-sdk/zod` | بازصادرات Zod | `zod` بازصادرشده برای مصرف‌کنندگان SDK Plugin |
  | `plugin-sdk/memory-core` | کمک‌کننده‌های همراه هسته حافظه | سطح کمک‌کننده مدیر/پیکربندی/فایل/CLI حافظه |
  | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای موتور حافظه | نمای زمان اجرای نمایه‌سازی/جست‌وجوی حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور بنیاد میزبان حافظه | خروجی‌های موتور بنیاد میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور تعبیه‌سازی میزبان حافظه | قراردادهای تعبیه‌سازی حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و کمک‌کننده‌های عمومی دسته‌ای/دوردست؛ ارائه‌دهندگان دوردست مشخص در Pluginهای مالک خودشان قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | خروجی‌های موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور ذخیره‌سازی میزبان حافظه | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های چندوجهی میزبان حافظه | کمک‌کننده‌های چندوجهی میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های پرس‌وجوی میزبان حافظه | کمک‌کننده‌های پرس‌وجوی میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های راز میزبان حافظه | کمک‌کننده‌های راز میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | کمک‌کننده‌های دفتر رویداد میزبان حافظه | کمک‌کننده‌های دفتر رویداد میزبان حافظه |
  | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های وضعیت میزبان حافظه | کمک‌کننده‌های وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | کمک‌کننده‌های زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | کمک‌کننده‌های زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه | کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | نام مستعار زمان اجرای هسته میزبان حافظه | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | نام مستعار دفتر رویداد میزبان حافظه | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های دفتر رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | نام مستعار فایل/زمان اجرای میزبان حافظه | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های Markdown مدیریت‌شده | کمک‌کننده‌های مشترک Markdown مدیریت‌شده برای Pluginهای مجاور حافظه |
  | `plugin-sdk/memory-host-search` | نمای جست‌وجوی حافظه فعال | نمای تنبل زمان اجرای مدیر جست‌وجوی حافظه فعال |
  | `plugin-sdk/memory-host-status` | نام مستعار وضعیت میزبان حافظه | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های وضعیت میزبان حافظه |
  | `plugin-sdk/testing` | ابزارهای آزمون | بشکه سازگاری گسترده قدیمی؛ زیرمسیرهای آزمون متمرکز مانند `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/channel-target-testing`، `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` را ترجیح دهید |
</Accordion>

این جدول عمدا زیرمجموعه‌ی مشترک مهاجرت است، نه کل سطح SDK
. فهرست کامل بیش از ۲۰۰ نقطه‌ی ورود در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

درزهای کمکی رزروشده‌ی Pluginهای بسته‌بندی‌شده از نقشه‌ی export عمومی SDK
بازنشسته شده‌اند، به‌جز نماهای سازگاری که صراحتا مستند شده‌اند، مثل شیم منسوخ‌شده‌ی
`plugin-sdk/discord` که برای بسته‌ی منتشرشده‌ی
`@openclaw/discord@2026.3.13` نگه داشته شده است. کمک‌کننده‌های اختصاصی مالک داخل
بسته‌ی Plugin مالک قرار دارند؛ رفتار مشترک میزبان باید از قراردادهای عمومی SDK
مثل `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`،
و `plugin-sdk/plugin-config-runtime` عبور کند.

باریک‌ترین import متناسب با کار را استفاده کنید. اگر exportی پیدا نمی‌کنید،
منبع را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان بپرسید کدام قرارداد عمومی
باید مالک آن باشد.

## منسوخ‌سازی‌های فعال

منسوخ‌سازی‌های باریک‌تر که در سراسر SDK Plugin، قرارداد provider،
سطح runtime، و manifest اعمال می‌شوند. هر کدام امروز هنوز کار می‌کنند اما
در یک نسخه‌ی major آینده حذف خواهند شد. ورودی زیر هر مورد API قدیمی را به
جایگزین معیار آن نگاشت می‌کند.

<AccordionGroup>
  <Accordion title="سازنده‌های راهنمای command-auth → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان signatureها، همان
    exportها — فقط از subpath باریک‌تر import می‌شوند. `command-auth`
    آن‌ها را به‌عنوان stubهای سازگاری re-export می‌کند.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="کمک‌کننده‌های gating اشاره → resolveInboundMentionDecision">
    **قدیمی**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` از
    `openclaw/plugin-sdk/channel-inbound` یا
    `openclaw/plugin-sdk/channel-mention-gating`.

    **جدید**: `resolveInboundMentionDecision({ facts, policy })` — به‌جای
    دو فراخوانی جدا، یک شیء تصمیم واحد برمی‌گرداند.

    Pluginهای channel پایین‌دستی (Slack، Discord، Matrix، MS Teams) قبلا
    تغییر کرده‌اند.

  </Accordion>

  <Accordion title="شیم runtime کانال و کمک‌کننده‌های action کانال">
    `openclaw/plugin-sdk/channel-runtime` یک شیم سازگاری برای
    Pluginهای channel قدیمی‌تر است. آن را از کد جدید import نکنید؛ برای ثبت
    شیءهای runtime از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    کمک‌کننده‌های `channelActions*` در `openclaw/plugin-sdk/channel-actions`
    همراه با exportهای خام channel مربوط به "actions" منسوخ شده‌اند. در عوض
    قابلیت‌ها را از طریق سطح معنایی `presentation` ارائه کنید — Pluginهای
    channel اعلام می‌کنند چه چیزی render می‌کنند (کارت‌ها، دکمه‌ها، selectها)
    نه اینکه کدام نام‌های خام action را می‌پذیرند.

  </Accordion>

  <Accordion title="کمک‌کننده‌ی tool() برای provider جست‌وجوی وب → createTool() روی Plugin">
    **قدیمی**: factory‏ `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیما روی Pluginِ provider پیاده‌سازی کنید.
    OpenClaw دیگر برای ثبت wrapper ابزار به کمک‌کننده‌ی SDK نیاز ندارد.

  </Accordion>

  <Accordion title="envelopeهای plaintext کانال → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساختن یک envelope prompt
    تخت و plaintext از پیام‌های channel ورودی.

    **جدید**: `BodyForAgent` به‌همراه بلوک‌های ساختاریافته‌ی زمینه‌ی کاربر.
    Pluginهای channel metadata مسیریابی (thread، topic، reply-to، reactions) را
    به‌جای چسباندن به رشته‌ی prompt، به‌صورت فیلدهای typed پیوست می‌کنند.
    کمک‌کننده‌ی `formatAgentEnvelope(...)` همچنان برای envelopeهای ساخته‌شده‌ی
    روبه‌دستیار پشتیبانی می‌شود، اما envelopeهای plaintext ورودی در مسیر
    حذف هستند.

    نواحی متاثر: `inbound_claim`، `message_received`، و هر Plugin
    channel سفارشی که متن `channelEnvelope` را پس‌پردازش می‌کرد.

  </Accordion>

  <Accordion title="typeهای کشف provider → typeهای کاتالوگ provider">
    چهار alias نوع کشف اکنون wrapperهای نازکی روی typeهای دوره‌ی
    کاتالوگ هستند:

    | alias قدیمی               | type جدید                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    همچنین بسته‌ی static قدیمی `ProviderCapabilities` — Pluginهای provider
    باید به‌جای یک شیء static، از hookهای صریح provider مانند `buildReplayPolicy`،
    `normalizeToolSchemas`، و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="hookهای سیاست Thinking → resolveThinkingProfile">
    **قدیمی** (سه hook جداگانه روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، `supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` با `id` معیار، `label` اختیاری، و فهرست رتبه‌بندی‌شده‌ی
    سطح‌ها برمی‌گرداند. OpenClaw مقدارهای ذخیره‌شده‌ی کهنه را به‌صورت خودکار
    بر اساس رتبه‌ی profile تنزل می‌دهد.

    به‌جای سه hook، یک hook پیاده‌سازی کنید. hookهای قدیمی در بازه‌ی
    منسوخ‌سازی همچنان کار می‌کنند اما با نتیجه‌ی profile ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="fallback provider خارجی OAuth → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی `resolveExternalOAuthProfiles(...)` بدون
    اعلام provider در manifest Plugin.

    **جدید**: `contracts.externalAuthProviders` را در manifest Plugin اعلام کنید
    **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید. مسیر قدیمی
    "auth fallback" در runtime هشدار منتشر می‌کند و حذف خواهد شد.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="جست‌وجوی env-var برای provider → setup.providers[].envVars">
    فیلد manifest **قدیمی**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان جست‌وجوی env-var را در `setup.providers[].envVars`
    روی manifest بازتاب دهید. این کار metadata مربوط به env برای setup/status را در یک
    جا تجمیع می‌کند و از بالا آوردن runtime Plugin فقط برای پاسخ‌دادن به
    جست‌وجوهای env-var جلوگیری می‌کند.

    `providerAuthEnvVars` تا بسته‌شدن بازه‌ی منسوخ‌سازی از طریق یک adapter
    سازگاری همچنان پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="ثبت Plugin حافظه → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جداگانه —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API وضعیت حافظه —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان slotها، یک فراخوانی ثبت واحد. کمک‌کننده‌های افزایشی حافظه
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) متاثر نیستند.

  </Accordion>

  <Accordion title="typeهای پیام‌های session زیرعامل تغییر نام داده‌اند">
    دو alias نوع legacy همچنان از `src/plugins/runtime/types.ts` export می‌شوند:

    | قدیمی                         | جدید                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    متد runtime با نام `readSession` به نفع
    `getSessionMessages` منسوخ شده است. همان signature؛ متد قدیمی به متد
    جدید وصل می‌شود.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک accessor زنده‌ی task-flow برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows` runtime جهش TaskFlow مدیریت‌شده را
    برای Pluginهایی نگه می‌دارد که taskهای فرزند را از یک flow ایجاد، به‌روزرسانی،
    لغو، یا اجرا می‌کنند. وقتی Plugin فقط به خواندن‌های مبتنی بر DTO نیاز دارد از
    `runtime.tasks.flows` استفاده کنید.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factoryهای extension تعبیه‌شده → middleware نتیجه‌ی ابزار agent">
    در بخش «چگونگی مهاجرت → مهاجرت extensionهای نتیجه‌ی ابزار Pi به
    middleware» در بالا پوشش داده شده است. برای کامل‌بودن اینجا هم آمده است:
    مسیر حذف‌شده‌ی فقط مخصوص Pi با نام
    `api.registerEmbeddedExtensionFactory(...)` با
    `api.registerAgentToolResultMiddleware(...)` و یک فهرست runtime صریح در
    `contracts.agentToolResultMiddleware` جایگزین شده است.
  </Accordion>

  <Accordion title="alias‏ OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` که از `openclaw/plugin-sdk` re-export می‌شود اکنون یک
    alias یک‌خطی برای `OpenClawConfig` است. نام معیار را ترجیح دهید.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
منسوخ‌سازی‌های سطح extension (داخل Pluginهای channel/provider بسته‌بندی‌شده زیر
`extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts` خودشان پیگیری می‌شوند.
آن‌ها بر قراردادهای Pluginهای شخص ثالث اثر نمی‌گذارند و اینجا فهرست نشده‌اند.
اگر barrel محلی یک Plugin بسته‌بندی‌شده را مستقیم مصرف می‌کنید، پیش از ارتقا
نظرهای منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## زمان‌بندی حذف

| زمان                   | اتفاقی که می‌افتد                                                       |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون**              | سطح‌های منسوخ‌شده هشدارهای runtime منتشر می‌کنند                        |
| **نسخه‌ی major بعدی**  | سطح‌های منسوخ‌شده حذف خواهند شد؛ Pluginهایی که هنوز از آن‌ها استفاده می‌کنند fail خواهند شد |

همه‌ی Pluginهای core قبلا مهاجرت کرده‌اند. Pluginهای خارجی باید پیش از
نسخه‌ی major بعدی مهاجرت کنند.

## سرکوب موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه فرار موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع به کار](/fa/plugins/building-plugins) — اولین Plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع کامل importهای subpath
- [Pluginهای Channel](/fa/plugins/sdk-channel-plugins) — ساخت Pluginهای channel
- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) — ساخت Pluginهای provider
- [درون‌ساخت Plugin](/fa/plugins/architecture) — بررسی عمیق معماری
- [Manifest Plugin](/fa/plugins/manifest) — مرجع schemaی manifest
