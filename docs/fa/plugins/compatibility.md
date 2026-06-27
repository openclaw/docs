---
read_when:
    - شما یک Plugin برای OpenClaw نگهداری می‌کنید
    - هشدار سازگاری Plugin را می‌بینید
    - در حال برنامه‌ریزی برای مهاجرت Plugin SDK یا مانیفست هستید
summary: قراردادهای سازگاری Plugin، فراداده‌های منسوخ‌سازی، و انتظارات مهاجرت
title: سازگاری Plugin
x-i18n:
    generated_at: "2026-06-27T18:14:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw قراردادهای قدیمی‌تر Plugin را پیش از حذف، از طریق آداپتورهای سازگاری نام‌گذاری‌شده متصل نگه می‌دارد. این کار از Pluginهای داخلی و خارجی موجود محافظت می‌کند، در حالی که قراردادهای SDK، مانیفست، راه‌اندازی، پیکربندی و زمان اجرای عامل تکامل پیدا می‌کنند.

## رجیستری سازگاری

قراردادهای سازگاری Plugin در رجیستری هسته در
`src/plugins/compat/registry.ts` ردیابی می‌شوند.

هر رکورد شامل این موارد است:

- یک کد سازگاری پایدار
- وضعیت: `active`، `deprecated`، `removal-pending`، یا `removed`
- مالک: SDK، پیکربندی، راه‌اندازی، کانال، ارائه‌دهنده، اجرای Plugin، زمان اجرای عامل،
  یا هسته
- تاریخ‌های معرفی و منسوخ‌سازی، در صورت کاربرد
- راهنمای جایگزینی
- مستندات، عیب‌یابی‌ها، و آزمون‌هایی که رفتار قدیمی و جدید را پوشش می‌دهند

رجیستری منبع برنامه‌ریزی نگه‌دارندگان و بررسی‌های آینده بازرس Plugin است. اگر رفتاری رو‌به‌روی Plugin تغییر کند، رکورد سازگاری را در همان تغییری که آداپتور را اضافه می‌کند، اضافه یا به‌روزرسانی کنید.

سازگاری ترمیم و مهاجرت doctor به‌صورت جداگانه در
`src/commands/doctor/shared/deprecation-compat.ts` ردیابی می‌شود. این رکوردها شکل‌های قدیمی پیکربندی، چیدمان‌های دفتر نصب، و شیم‌های ترمیمی را پوشش می‌دهند که ممکن است پس از حذف مسیر سازگاری زمان اجرا نیز لازم باشد در دسترس بمانند.

بازبینی‌های انتشار باید هر دو رجیستری را بررسی کنند. فقط به این دلیل که رکورد سازگاری متناظرِ زمان اجرا یا پیکربندی منقضی شده، یک مهاجرت doctor را حذف نکنید؛ ابتدا تأیید کنید هیچ مسیر ارتقای پشتیبانی‌شده‌ای وجود ندارد که هنوز به آن ترمیم نیاز داشته باشد. همچنین در زمان برنامه‌ریزی انتشار، هر حاشیه‌نویسی جایگزینی را دوباره اعتبارسنجی کنید، چون مالکیت Plugin و ردپای پیکربندی می‌تواند با خروج ارائه‌دهنده‌ها و کانال‌ها از هسته تغییر کند.

## بسته بازرس Plugin

بازرس Plugin باید بیرون از مخزن اصلی OpenClaw، به‌عنوان یک بسته/مخزن جداگانه که بر قراردادهای نسخه‌دار سازگاری و مانیفست متکی است، قرار بگیرد.

CLI روز اول باید این باشد:

```sh
openclaw-plugin-inspector ./my-plugin
```

باید این موارد را خروجی دهد:

- اعتبارسنجی مانیفست/شِما
- نسخه سازگاری قرارداد که بررسی می‌شود
- بررسی‌های فراداده نصب/منبع
- بررسی‌های import مسیر سرد
- هشدارهای منسوخ‌سازی و سازگاری

برای خروجی پایدار قابل‌خواندن توسط ماشین در حاشیه‌نویسی‌های CI از `--json` استفاده کنید. هسته OpenClaw باید قراردادها و fixtureهایی را در اختیار بگذارد که بازرس بتواند مصرف کند، اما نباید باینری بازرس را از بسته اصلی `openclaw` منتشر کند.

### مسیر پذیرش نگه‌دارنده

هنگام اعتبارسنجی بازرس خارجی در برابر بسته‌های Plugin OpenClaw، برای مسیر پذیرش بسته قابل‌نصب از Blacksmith Testbox متکی بر Crabbox استفاده کنید. پس از ساخت بسته، آن را از یک checkout تمیز OpenClaw اجرا کنید:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

این مسیر را برای نگه‌دارندگان اختیاری نگه دارید، چون یک بسته خارجی npm را نصب می‌کند و ممکن است بسته‌های Plugin کلون‌شده بیرون از مخزن را بررسی کند. نگهبان‌های مخزن محلی نقشه export SDK، فراداده رجیستری سازگاری، کاهش importهای منسوخ SDK، و مرزهای import افزونه‌های داخلی را پوشش می‌دهند؛ اثبات بازرس Testbox بسته را همان‌طور پوشش می‌دهد که نویسندگان Plugin خارجی آن را مصرف می‌کنند.

## سیاست منسوخ‌سازی

OpenClaw نباید یک قرارداد مستند Plugin را در همان انتشاری حذف کند که جایگزین آن را معرفی می‌کند.

ترتیب مهاجرت این است:

1. قرارداد جدید را اضافه کنید.
2. رفتار قدیمی را از طریق یک آداپتور سازگاری نام‌گذاری‌شده متصل نگه دارید.
3. وقتی نویسندگان Plugin می‌توانند اقدام کنند، عیب‌یابی‌ها یا هشدارها را صادر کنید.
4. جایگزین و زمان‌بندی را مستند کنید.
5. هر دو مسیر قدیمی و جدید را آزمایش کنید.
6. تا پایان پنجره مهاجرت اعلام‌شده صبر کنید.
7. فقط با تأیید صریح انتشار ناسازگار حذف کنید.

رکوردهای منسوخ‌شده باید شامل تاریخ شروع هشدار، جایگزین، لینک مستندات، و تاریخ حذف نهایی حداکثر سه ماه پس از شروع هشدار باشند. مسیر سازگاری منسوخ‌شده‌ای با پنجره حذف بدون پایان اضافه نکنید، مگر اینکه نگه‌دارندگان صراحتاً تصمیم بگیرند که سازگاری دائمی است و به‌جای آن آن را `active` علامت‌گذاری کنند.

## حوزه‌های سازگاری فعلی

رکوردهای سازگاری فعلی شامل این موارد هستند:

- importهای گسترده قدیمی SDK مانند `openclaw/plugin-sdk/compat`
- شکل‌های قدیمی Plugin فقط‌hook و `before_agent_start`
- نام‌های قدیمی hook پاک‌سازی `api.on("deactivate", ...)` در حالی که Pluginها به
  `gateway_stop` مهاجرت می‌کنند
- entrypointهای قدیمی Plugin به شکل `activate(api)` در حالی که Pluginها به
  `register(api)` مهاجرت می‌کنند
- aliasهای قدیمی SDK مانند `openclaw/extension-api`،
  `openclaw/plugin-sdk/channel-runtime`، سازنده‌های وضعیت `openclaw/plugin-sdk/command-auth`،
  `openclaw/plugin-sdk/test-utils` (جایگزین‌شده با زیرمسیرهای آزمون متمرکز
  `openclaw/plugin-sdk/*`)، و aliasهای نوع `ClawdbotConfig` /
  `OpenClawSchemaType`
- رفتار allowlist و فعال‌سازی Pluginهای داخلی
- فراداده مانیفست قدیمی env-var برای ارائه‌دهنده/کانال
- hookها و aliasهای نوع قدیمی Plugin ارائه‌دهنده، در حالی که ارائه‌دهنده‌ها به hookهای صریح کاتالوگ، احراز هویت، thinking، replay، و انتقال منتقل می‌شوند
- aliasهای قدیمی زمان اجرا مانند `api.runtime.taskFlow`،
  `api.runtime.subagent.getSession`، `api.runtime.stt`، و
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` منسوخ‌شده
- فیلدهای callback تخت `WebInboundMessage` در WhatsApp مانند `body`، `chatId`،
  `reply(...)`، و `mediaPath` در حالی که مصرف‌کنندگان callback به contextهای تو‌در‌توی
  `event`، `payload`، `quote`، `group`، و
  `platform` در `WebInboundCallbackMessage` مهاجرت می‌کنند
- فیلدهای پذیرش سطح‌بالای `WebInboundMessage` در WhatsApp مانند `from`،
  `conversationId`، `accountId`، `accessControlPassed`، و `chatType` در حالی که
  مصرف‌کنندگان callback به envelope `admission` مهاجرت می‌کنند
- ثبت جداشده قدیمی memory-plugin در حالی که Pluginهای حافظه به
  `registerMemoryCapability` منتقل می‌شوند
- ثبت قدیمی ارائه‌دهنده embedding ویژه حافظه، در حالی که ارائه‌دهنده‌های embedding به
  `api.registerEmbeddingProvider(...)` و
  `contracts.embeddingProviders` منتقل می‌شوند
- helperهای قدیمی SDK کانال برای شِماهای پیام native، کنترل mention،
  قالب‌بندی envelope ورودی، و تودرتوسازی قابلیت approval
- aliasهای قدیمی کلید route کانال و helper هدف قابل‌مقایسه، در حالی که Pluginها
  به `openclaw/plugin-sdk/channel-route` منتقل می‌شوند
- hintهای فعال‌سازی که با مالکیت contribution در مانیفست جایگزین می‌شوند
- fallback زمان اجرای `setup-api` در حالی که توصیفگرهای راه‌اندازی به فراداده سرد
  `setup.requiresRuntime: false` منتقل می‌شوند
- hookهای `discovery` ارائه‌دهنده در حالی که hookهای کاتالوگ ارائه‌دهنده به
  `catalog.run(...)` منتقل می‌شوند
- فراداده `showConfigured` / `showInSetup` کانال در حالی که بسته‌های کانال به
  `openclaw.channel.exposure` منتقل می‌شوند
- کلیدهای قدیمی پیکربندی سیاست زمان اجرا، در حالی که doctor اپراتورها را به
  `agentRuntime` مهاجرت می‌دهد
- fallback فراداده تولیدشده پیکربندی کانال داخلی، در حالی که فراداده registry-first
  `channelConfigs` اضافه می‌شود
- flagهای env برای غیرفعال‌سازی رجیستری Plugin پایدارشده و install-migration در حالی که
  جریان‌های ترمیم اپراتورها را به `openclaw plugins registry --refresh` و
  `openclaw doctor --fix` مهاجرت می‌دهند
- مسیرهای قدیمی پیکربندی web search، web fetch، و x_search متعلق به Plugin در حالی که
  doctor آن‌ها را به `plugins.entries.<plugin>.config` مهاجرت می‌دهد
- پیکربندی نوشته‌شده قدیمی `plugins.installs` و aliasهای load-path Plugin داخلی
  در حالی که فراداده نصب به دفتر Plugin مدیریت‌شده توسط state منتقل می‌شود

کد جدید Plugin باید جایگزین فهرست‌شده در رجیستری و در راهنمای مهاجرت مشخص را ترجیح دهد. Pluginهای موجود می‌توانند تا زمانی که مستندات، عیب‌یابی‌ها، و یادداشت‌های انتشار یک پنجره حذف را اعلام کنند، به استفاده از مسیر سازگاری ادامه دهند.

### Aliasهای تخت Callback ورودی WhatsApp

callbackهای زمان اجرای WhatsApp، `WebInboundMessage` را تحویل می‌دهند: contextهای تو‌در‌توی canonical
`event`، `payload`، `quote`، `group`، و `platform` به‌همراه aliasهای تخت منسوخ برای فیلدهای callback منتشرشده. کد callback جدید باید contextهای تو‌در‌تو را بخواند. کدی که پیام‌های callback تو‌در‌توی تمیز می‌سازد می‌تواند از
`WebInboundCallbackMessage` استفاده کند؛ listenerهای سازگاری که هنوز پیام‌های قدیمی تخت آزمون یا Plugin را inject می‌کنند باید از `LegacyFlatWebInboundMessage` یا
`WebInboundMessageInput` استفاده کنند.

aliasهای تخت تا **2026-08-30** در دسترس می‌مانند. این پنجره حذف فقط برای دسترسی alias تخت اعمال می‌شود؛ شکل callback تو‌در‌تو قرارداد canonical زمان اجرا است. حاشیه‌نویسی‌های TypeScript `@deprecated` روی هر alias تخت، جایگزین تو‌در‌توی دقیق آن را نام می‌برد. مثال‌های رایج:

- `id`، `timestamp`، و `isBatched` به زیر `event` منتقل می‌شوند.
- `body`، `mediaPath`، `mediaType`، `mediaFileName`، `mediaUrl`، `location`، و
  `untrustedStructuredContext` به زیر `payload` منتقل می‌شوند.
- `to`، `chatId`، فیلدهای فرستنده/خود، `sendComposing`، `reply(...)`، و
  `sendMedia(...)` به زیر `platform` منتقل می‌شوند.
- فیلدهای `replyTo*` به زیر `quote` منتقل می‌شوند، و فیلدهای موضوع گروه/شرکت‌کننده/mention
  به زیر `group` منتقل می‌شوند.

`payload.untrustedStructuredContext` از payloadهای ورودی ارائه‌دهنده استخراج می‌شود.
Pluginها باید پیش از معتبر دانستن `payload` آن، `label`، `source`، و `type` را بررسی کنند.

### فیلدهای پذیرش ورودی WhatsApp

پیام‌های callback پذیرفته‌شده WhatsApp اکنون `admission` را حمل می‌کنند، یک envelope عمومی‌امن برای تصمیم کنترل دسترسی که پیام را پذیرفته است. کد callback جدید باید به‌جای فیلدهای قدیمی پذیرش در سطح بالا، facts پذیرش را از `msg.admission` بخواند.

فیلدهای سطح بالا تا **2026-08-30** در دسترس می‌مانند. حاشیه‌نویسی‌های TypeScript
`@deprecated` هر جایگزین را نام می‌برند:

- `from` و `conversationId` به `admission.conversation.id` منتقل می‌شوند.
- `accountId` به `admission.accountId` منتقل می‌شود.
- `accessControlPassed` یک نمای سازگاری مشتق‌شده از
  `admission.ingress.decision === "allow"` است؛ در پیام‌هایی که از قبل
  `admission` دارند، نوشتن boolean قدیمی گراف ingress را بازنویسی نمی‌کند.
- `chatType` به `admission.conversation.kind` منتقل می‌شود.

## یادداشت‌های انتشار

یادداشت‌های انتشار باید منسوخ‌سازی‌های آتی Plugin را با تاریخ‌های هدف و لینک به مستندات مهاجرت شامل شوند. این هشدار باید پیش از آن رخ دهد که یک مسیر سازگاری به `removal-pending` یا `removed` منتقل شود.
