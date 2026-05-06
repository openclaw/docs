---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای واردسازی Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و سطوح کمکی
summary: 'فهرست زیرمسیرهای SDK Plugin: اینکه کدام واردسازی‌ها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:35:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود زیر `openclaw/plugin-sdk/` در دسترس است.
این صفحه زیرمسیرهای پرکاربرد را بر اساس هدف دسته‌بندی و فهرست می‌کند. فهرست کامل تولیدشده
شامل بیش از ۲۰۰ زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛
زیرمسیرهای کمکی رزرو‌شده برای Pluginهای بسته‌بندی‌شده نیز آنجا دیده می‌شوند، اما تا وقتی یک صفحه مستندات صریحاً آن‌ها را معرفی نکند، جزئیات پیاده‌سازی محسوب می‌شوند. نگه‌دارندگان می‌توانند زیرمسیرهای کمکی رزرو‌شده و فعال را با `pnpm plugins:boundary-report:summary` بازبینی کنند؛ exportهای کمکی رزرو‌شده و استفاده‌نشده، به‌جای اینکه به‌عنوان بدهی سازگاری غیرفعال در SDK عمومی باقی بمانند، گزارش CI را ناموفق می‌کنند.

برای راهنمای ساخت Plugin، [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) را ببینید.

## ورودی Plugin

| زیرمسیر                                   | exportهای کلیدی                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | barrel سازگاری گسترده برای آزمون‌های Plugin قدیمی؛ برای آزمون‌های افزونه جدید، زیرمسیرهای آزمون متمرکز را ترجیح دهید                                                                     |
| `plugin-sdk/plugin-test-api`              | سازنده mock حداقلی `OpenClawPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime برای پروفایل‌های auth، سرکوب تحویل، دسته‌بندی fallback، hookهای ابزار، overlayهای prompt، schemaها، و ترمیم transcript |
| `plugin-sdk/channel-test-helpers`         | کمک‌کننده‌های آزمون قرارداد کانال عمومی، reply جفت‌سازی، timestamp پاکت، ورودی کانال بسته‌بندی‌شده، hook، mock runtime، send-config، directory، و lifecycle حساب کانال   |
| `plugin-sdk/channel-target-testing`       | مجموعه آزمون مشترک برای موردهای خطای target-resolution کانال                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | کمک‌کننده‌های قرارداد ثبت Plugin، manifest بسته، artifact عمومی، API runtime، اثر جانبی import، و import مستقیم                                                  |
| `plugin-sdk/plugin-test-runtime`          | fixtureهای runtime Plugin، registry، provider-registration، setup-wizard، و task-flow runtime برای آزمون‌ها                                                                      |
| `plugin-sdk/provider-test-contracts`      | کمک‌کننده‌های قرارداد provider runtime، auth، discovery، onboard، catalog، قابلیت رسانه، سیاست replay، صدای زنده realtime STT، web-search/fetch، و wizard                 |
| `plugin-sdk/provider-http-test-mocks`     | mockهای اختیاری Vitest برای HTTP/auth در آزمون‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند                                                                                    |
| `plugin-sdk/test-env`                     | fixtureهای محیط آزمون، fetch/network، سرور HTTP یک‌بارمصرف، درخواست ورودی، live-test، فایل‌سیستم موقت، و کنترل زمان                                        |
| `plugin-sdk/test-fixtures`                | fixtureهای آزمون عمومی برای CLI، sandbox، skill، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin بسته‌بندی‌شده، terminal، chunking، auth-token، و typed-case                   |
| `plugin-sdk/test-node-mocks`              | کمک‌کننده‌های mock متمرکز برای builtinهای Node جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")`                                                                                        |
| `plugin-sdk/migration`                    | کمک‌کننده‌های آیتم provider مهاجرت مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای status آیتم، کمک‌کننده‌های redaction، و `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | کمک‌کننده‌های مهاجرت runtime مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی شمای Zod ریشه `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌علاوهٔ `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌تابع‌های مشترک جادوگر راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌تابع‌های پیکربندی چندحسابی/دروازهٔ اقدام، کمک‌تابع‌های جایگزین حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌تابع‌های نرمال‌سازی شناسهٔ حساب |
    | `plugin-sdk/account-resolution` | کمک‌تابع‌های جست‌وجوی حساب + جایگزین پیش‌فرض |
    | `plugin-sdk/account-helpers` | کمک‌تابع‌های محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | کمک‌تابع‌های قدیمی خط لولهٔ پاسخ. کد جدید خط لولهٔ پاسخ کانال باید از `createChannelMessageReplyPipeline` و `resolveChannelMessageSourceReplyDeliveryMode` از `plugin-sdk/channel-message` استفاده کند. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | اجزای پایهٔ مشترک شمای پیکربندی کانال، به‌علاوهٔ سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | شماهای پیکربندی کانال همراه OpenClaw فقط برای Pluginهای همراه نگه‌داری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای شماهای پیکربندی کانال همراه |
    | `plugin-sdk/telegram-command-config` | کمک‌تابع‌های نرمال‌سازی/اعتبارسنجی دستور سفارشی Telegram با جایگزین قرارداد همراه |
    | `plugin-sdk/command-gating` | کمک‌تابع‌های محدود دروازهٔ مجوزدهی دستور |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، `createChannelRunQueue`، و کمک‌تابع‌های قدیمی چرخهٔ عمر جریان پیش‌نویس. کد جدید نهایی‌سازی پیش‌نمایش باید از `plugin-sdk/channel-message` استفاده کند. |
    | `plugin-sdk/channel-message` | کمک‌تابع‌های سبک قرارداد چرخهٔ عمر پیام مانند `defineChannelMessageAdapter`، `createChannelMessageAdapterFromOutbound`، `createReplyPrefixContext`، `resolveChannelMessageSourceReplyDeliveryMode`، نماهای سازگاری، استخراج قابلیت نهایی پایدار، کمک‌تابع‌های اثبات قابلیت برای قابلیت‌های ارسال/رسید/اثر جانبی، `MessageReceiveContext`، اثبات‌های سیاست تأیید دریافت، `defineFinalizableLivePreviewAdapter`، `deliverWithFinalizableLivePreviewAdapter`، اثبات‌های قابلیت پیش‌نمایش زنده و نهایی‌ساز زنده، وضعیت بازیابی پایدار، `RenderedMessageBatch`، انواع رسید پیام، و کمک‌تابع‌های شناسهٔ رسید. [API پیام کانال](/fa/plugins/sdk-channel-message) را ببینید. `createChannelTurnReplyPipeline` قدیمی فقط برای توزیع‌کننده‌های سازگاری باقی می‌ماند. |
    | `plugin-sdk/channel-message-runtime` | کمک‌تابع‌های تحویل در زمان اجرا که ممکن است تحویل خروجی را بارگذاری کنند، از جمله `deliverInboundReplyWithMessageSendContext`، `sendDurableMessageBatch`، `withDurableMessageSendContext`، `dispatchChannelMessageReplyWithBase`، و `recordChannelMessageReplyDispatch`. از آن‌ها در ماژول‌های زمان اجرای پایش/ارسال استفاده کنید، نه در فایل‌های راه‌اندازی داغ Plugin. |
    | `plugin-sdk/inbound-envelope` | کمک‌تابع‌های مشترک مسیر ورودی + سازندهٔ پوشش |
    | `plugin-sdk/inbound-reply-dispatch` | کمک‌تابع‌های قدیمی مشترک ثبت و توزیع ورودی، گزاره‌های توزیع قابل‌مشاهده/نهایی، و سازگاری منسوخ `deliverDurableInboundReplyPayload` برای توزیع‌کننده‌های آمادهٔ کانال. کد جدید دریافت/توزیع کانال باید کمک‌تابع‌های چرخهٔ عمر زمان اجرا را از `plugin-sdk/channel-message-runtime` وارد کند. |
    | `plugin-sdk/messaging-targets` | کمک‌تابع‌های تجزیه/تطبیق مقصد |
    | `plugin-sdk/outbound-media` | کمک‌تابع‌های مشترک بارگذاری رسانهٔ خروجی |
    | `plugin-sdk/outbound-send-deps` | جست‌وجوی سبک وابستگی ارسال خروجی برای آداپتورهای کانال |
    | `plugin-sdk/outbound-runtime` | کمک‌تابع‌های تحویل خروجی، هویت، نمایندهٔ ارسال، نشست، قالب‌بندی، و برنامه‌ریزی محموله |
    | `plugin-sdk/poll-runtime` | کمک‌تابع‌های محدود نرمال‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌تابع‌های چرخهٔ عمر و آداپتورهای اتصال رشتهٔ گفتگو |
    | `plugin-sdk/agent-media-payload` | سازندهٔ قدیمی محمولهٔ رسانهٔ عامل |
    | `plugin-sdk/conversation-runtime` | کمک‌تابع‌های اتصال گفتگو/رشتهٔ گفتگو، جفت‌سازی، و اتصال پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌تابع نماگرفت پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | کمک‌تابع‌های حل سیاست گروه در زمان اجرا |
    | `plugin-sdk/channel-status` | کمک‌تابع‌های مشترک نماگرفت/خلاصهٔ وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | اجزای پایهٔ محدود شمای پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | کمک‌تابع‌های مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های پیش‌درآمد Plugin کانال مشترک |
    | `plugin-sdk/allowlist-config-edit` | کمک‌تابع‌های ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | کمک‌تابع‌های مشترک تصمیم‌گیری دسترسی گروه |
    | `plugin-sdk/direct-dm` | کمک‌تابع‌های مشترک احراز هویت/محافظت DM مستقیم |
    | `plugin-sdk/discord` | نمای سازگاری Discord منسوخ برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای SDK کانال عمومی استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری Telegram منسوخ برای حل حساب، جهت سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از کمک‌تابع‌های تزریق‌شدهٔ زمان اجرا یا زیرمسیرهای SDK کانال عمومی استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری Zalo Personal منسوخ برای بسته‌های منتشرشدهٔ Lark/Zalo که هنوز مجوزدهی دستور فرستنده را وارد می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | کمک‌تابع‌های معنایی ارائهٔ پیام، تحویل، و پاسخ تعاملی قدیمی. [ارائهٔ پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | صادرکنندهٔ تجمیعی سازگاری برای ضدپرش ورودی، تطبیق اشاره، کمک‌تابع‌های سیاست اشاره، و کمک‌تابع‌های پوشش |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌تابع‌های محدود ضدپرش ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌تابع‌های محدود سیاست اشاره، نشانگر اشاره، و متن اشاره بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope` | کمک‌تابع‌های محدود قالب‌بندی پوشش ورودی |
    | `plugin-sdk/channel-location` | کمک‌تابع‌های زمینهٔ مکان کانال و قالب‌بندی |
    | `plugin-sdk/channel-logging` | کمک‌تابع‌های ثبت وقایع کانال برای حذف‌های ورودی و خطاهای در حال تایپ/تأیید |
    | `plugin-sdk/channel-send-result` | انواع نتیجهٔ پاسخ |
    | `plugin-sdk/channel-actions` | کمک‌تابع‌های اقدام پیام کانال، به‌علاوهٔ کمک‌تابع‌های منسوخ شمای بومی که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | کمک‌تابع‌های مشترک نرمال‌سازی مسیر، حل مقصد مبتنی بر تجزیه‌گر، رشته‌سازی شناسهٔ رشتهٔ گفتگو، کلیدهای مسیر حذف تکرار/فشرده‌سازی، انواع مقصد تجزیه‌شده، و مقایسهٔ مسیر/مقصد |
    | `plugin-sdk/channel-targets` | کمک‌تابع‌های تجزیهٔ مقصد؛ فراخواننده‌های مقایسهٔ مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | انواع قرارداد کانال |
    | `plugin-sdk/channel-feedback` | اتصال‌دهی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | کمک‌تابع‌های محدود قرارداد راز مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، و انواع مقصد راز |
  </Accordion>

  <Accordion title="Provider subpaths">
    | زیربخش | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شدهٔ ارائه‌دهندهٔ LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شدهٔ LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌کننده‌های مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌کننده‌های منتخب برای راه‌اندازی ارائه‌دهنده‌های محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی ارائه‌دهندهٔ خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های نگهبان |
    | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های حل کلید API در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های ورود اولیه/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازندهٔ استاندارد نتیجهٔ احراز هویت OAuth |
    | `plugin-sdk/provider-auth-login` | کمک‌کننده‌های مشترک ورود تعاملی برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`، `ensureApiKeyFromOptionEnvOrPrompt`، `upsertAuthProfile`، `upsertApiKeyProfile`، `writeOAuthCredentials`، خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های نقطه پایانی ارائه‌دهنده، و کمک‌کننده‌های عادی‌سازی شناسهٔ مدل مانند `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | هوک زمان اجرای تقویت کاتالوگ ارائه‌دهنده و مرزهای رجیستری ارائه‌دهندهٔ Plugin برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌کننده‌های عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌کننده‌های فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/انتخاب واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های ثبت/کش ارائه‌دهندهٔ واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های محدود پیکربندی/اعتبارنامهٔ جست‌وجوی وب برای ارائه‌دهنده‌هایی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/اعتبارنامهٔ جست‌وجوی وب مانند `createWebSearchProviderContractFields`، `enablePluginInConfig`، `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامهٔ دامنه‌دار |
    | `plugin-sdk/provider-web-search` | کمک‌کننده‌های ثبت/کش/زمان اجرای ارائه‌دهندهٔ جست‌وجوی وب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks`، پاک‌سازی طرح‌وارهٔ Gemini + عیب‌یابی‌ها، و کمک‌کننده‌های سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، `buildProviderStreamFamilyHooks`، `composeProviderStreamWrappers`، انواع پوشش‌دهندهٔ جریان، و کمک‌کننده‌های مشترک پوشش‌دهندهٔ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌کننده‌های وصلهٔ پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | کمک‌کننده‌های تک‌نمونه/نگاشت/کش محلی فرایند |
    | `plugin-sdk/group-activation` | کمک‌کننده‌های محدود حالت فعال‌سازی گروه و تجزیهٔ دستور |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | زیربخش | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، کمک‌کننده‌های رجیستری دستور شامل قالب‌بندی منوی آرگومان پویا، کمک‌کننده‌های مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام دستور/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | حل تأییدکننده و کمک‌کننده‌های احراز هویت اقدام در همان گفت‌وگو |
    | `plugin-sdk/approval-client-runtime` | کمک‌کننده‌های پروفایل/فیلتر تأیید اجرای بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌کنندهٔ مشترک حل Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کننده‌های سبک بارگذاری آداپتور تأیید بومی برای نقطه‌های ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌کننده‌های گسترده‌تر زمان اجرای گردانندهٔ تأیید؛ وقتی مرزهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌کننده‌های هدف تأیید بومی + اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | کمک‌کننده‌های محتوای پاسخ تأیید اجرا/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های محتوای تأیید اجرا/Plugin، کمک‌کننده‌های مسیریابی/زمان اجرای تأیید بومی، و کمک‌کننده‌های نمایش ساختاریافتهٔ تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌کننده‌های محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌کننده‌های محدود آزمون قرارداد کانال بدون بشکهٔ گستردهٔ آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت دستور بومی، قالب‌بندی منوی آرگومان پویا، و کمک‌کننده‌های هدف نشست بومی |
    | `plugin-sdk/command-detection` | کمک‌کننده‌های مشترک تشخیص دستور |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن دستور برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | عادی‌سازی بدنهٔ دستور و کمک‌کننده‌های سطح دستور |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود گردآوری قرارداد محرمانه برای سطوح محرمانهٔ کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌کننده‌های محدود `coerceSecretRef` و نوع‌گذاری SecretRef برای تجزیهٔ قرارداد محرمانه/پیکربندی |
    | `plugin-sdk/security-runtime` | کمک‌کننده‌های مشترک اعتماد، محدودسازی پیام مستقیم، فایل/مسیر محدود به ریشه شامل نوشتن فقط-ایجاد، جایگزینی اتمیک همگام/ناهمگام فایل، نوشتن موقت هم‌رده، مسیر جایگزین انتقال بین‌دستگاهی، کمک‌کننده‌های ذخیره‌گاه فایل خصوصی، محافظ‌های والد پیوند نمادین، محتوای خارجی، حذف اطلاعات حساس از متن، مقایسهٔ محرمانه با زمان ثابت، و کمک‌کننده‌های گردآوری محرمانه‌ها |
    | `plugin-sdk/ssrf-policy` | کمک‌کننده‌های فهرست مجاز میزبان و سیاست SSRF شبکهٔ خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌کننده‌های محدود توزیع‌کنندهٔ سنجاق‌شده بدون سطح گستردهٔ زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | توزیع‌کنندهٔ سنجاق‌شده، واکشی محافظت‌شده با SSRF، خطای SSRF، و کمک‌کننده‌های سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌کننده‌های تجزیهٔ ورودی محرمانه |
    | `plugin-sdk/webhook-ingress` | کمک‌کننده‌های درخواست/هدف Webhook و تبدیل خام websocket/بدنه |
    | `plugin-sdk/webhook-request-guards` | کمک‌کننده‌های اندازهٔ بدنهٔ درخواست/مهلت زمانی |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | راهنماهای گسترده runtime، ثبت گزارش، پشتیبان‌گیری، و نصب Plugin |
    | `plugin-sdk/runtime-env` | راهنماهای محدود env در runtime، logger، timeout، retry، و backoff |
    | `plugin-sdk/browser-config` | facade پیکربندی مرورگرِ پشتیبانی‌شده برای profile/defaults نرمال‌شده، تجزیه CDP URL، و راهنماهای احراز هویت کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | راهنماهای عمومی ثبت و جست‌وجوی runtime-context کانال |
    | `plugin-sdk/matrix` | facade سازگاری Matrix منسوخ برای بسته‌های قدیمی کانال شخص ثالث؛ Pluginهای جدید باید مستقیماً `plugin-sdk/run-command` را import کنند |
    | `plugin-sdk/mattermost` | facade سازگاری Mattermost منسوخ برای بسته‌های قدیمی کانال شخص ثالث؛ Pluginهای جدید باید زیرمسیرهای عمومی SDK را مستقیماً import کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | راهنماهای مشترک فرمان، hook، http، و تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | راهنماهای مشترک خط لوله Webhook/hook داخلی |
    | `plugin-sdk/lazy-runtime` | راهنماهای import/binding تنبل runtime مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | راهنماهای اجرای فرایند |
    | `plugin-sdk/cli-runtime` | راهنماهای قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، راهنمای شروع کلاینت آماده برای حلقه رویداد، RPC مربوط به CLI برای Gateway، خطاهای پروتکل Gateway، و راهنماهای وصله وضعیت کانال |
    | `plugin-sdk/config-types` | سطح پیکربندی فقط-نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | راهنماهای جست‌وجوی پیکربندی Plugin در runtime مانند `requireRuntimeConfig`، `resolvePluginConfigObject`، و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | راهنماهای تغییر تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile`، و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | راهنماهای snapshot پیکربندی فرایند فعلی مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot`، و setterهای snapshot آزمون |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد Telegram بسته‌بندی‌شده در دسترس نیست |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink ارجاع فایل بدون barrel گسترده text-runtime |
    | `plugin-sdk/approval-runtime` | راهنماهای تأیید exec/Plugin، سازنده‌های قابلیت تأیید، راهنماهای auth/profile، راهنماهای native routing/runtime، و قالب‌بندی مسیر نمایش تأیید ساختاریافته |
    | `plugin-sdk/reply-runtime` | راهنماهای مشترک runtime برای ورودی/reply، قطعه‌بندی، dispatch، Heartbeat، برنامه‌ریز reply |
    | `plugin-sdk/reply-dispatch-runtime` | راهنماهای محدود dispatch/finalize پاسخ و برچسب مکالمه |
    | `plugin-sdk/reply-history` | راهنماها و نشانگرهای مشترک تاریخچه پاسخ در پنجره کوتاه مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry`، و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | راهنماهای محدود قطعه‌بندی متن/Markdown |
    | `plugin-sdk/session-store-runtime` | راهنماهای مسیر ذخیره‌گاه session، کلید session، زمان به‌روزرسانی، و تغییر ذخیره‌گاه |
    | `plugin-sdk/cron-store-runtime` | راهنماهای مسیر/load/save ذخیره‌گاه Cron |
    | `plugin-sdk/state-paths` | راهنماهای مسیر دایرکتوری State/OAuth |
    | `plugin-sdk/routing` | راهنماهای route/session-key/account binding مانند `resolveAgentRoute`، `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | راهنماهای مشترک خلاصه وضعیت کانال/account، پیش‌فرض‌های runtime-state، و راهنماهای فراداده issue |
    | `plugin-sdk/target-resolver-runtime` | راهنماهای مشترک resolver هدف |
    | `plugin-sdk/string-normalization-runtime` | راهنماهای نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج stdout/stderr نرمال‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های رایج پارامتر ابزار/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای هدف ارسال canonical از args ابزار |
    | `plugin-sdk/temp-path` | راهنماهای مشترک مسیر دانلود موقت و فضاهای کاری موقت خصوصی و امن |
    | `plugin-sdk/logging-core` | راهنماهای logger زیرسیستم و پنهان‌سازی اطلاعات حساس |
    | `plugin-sdk/markdown-table-runtime` | راهنماهای حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | راهنماهای override مدل/session مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | راهنماهای resolution پیکربندی ارائه‌دهنده Talk |
    | `plugin-sdk/json-store` | راهنماهای کوچک خواندن/نوشتن state در JSON |
    | `plugin-sdk/file-lock` | راهنماهای file-lock بازگشتی |
    | `plugin-sdk/persistent-dedupe` | راهنماهای cache حذف تکرارِ پشتیبانی‌شده با دیسک |
    | `plugin-sdk/acp-runtime` | راهنماهای runtime/session و reply-dispatch برای ACP |
    | `plugin-sdk/acp-runtime-backend` | راهنماهای سبک ثبت backend و reply-dispatch برای ACP برای Pluginهایی که هنگام startup بارگذاری می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | resolution فقط‌خواندنی binding برای ACP بدون importهای startup چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود schema پیکربندی runtime عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر boolean آزاد |
    | `plugin-sdk/dangerous-name-runtime` | راهنماهای resolution برای تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | راهنماهای bootstrap دستگاه و token جفت‌سازی |
    | `plugin-sdk/extension-shared` | primitiveهای مشترک راهنمای کانال passive، وضعیت، و پراکسی ambient |
    | `plugin-sdk/models-provider-runtime` | راهنماهای پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | راهنماهای فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | راهنماهای registry/build/serialize فرمان native |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورد اعتماد برای harnessهای سطح پایین عامل: انواع harness، راهنماهای steer/abort برای active-run، راهنماهای پل ابزار OpenClaw، راهنماهای سیاست ابزار runtime-plan، طبقه‌بندی نتیجه terminal، راهنماهای قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای کمکی نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | راهنماهای تشخیص endpoint برای Z.AI |
    | `plugin-sdk/async-lock-runtime` | راهنمای قفل async محلیِ فرایند برای فایل‌های کوچک state در runtime |
    | `plugin-sdk/channel-activity-runtime` | راهنمای telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | راهنمای هم‌زمانی task async محدود |
    | `plugin-sdk/dedupe-runtime` | راهنماهای cache حذف تکرار در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | راهنمای drain برای pending-delivery خروجی |
    | `plugin-sdk/file-access-runtime` | راهنماهای امن مسیر فایل محلی و منبع media |
    | `plugin-sdk/heartbeat-runtime` | راهنماهای رویداد Heartbeat و visibility |
    | `plugin-sdk/number-runtime` | راهنمای coercion عددی |
    | `plugin-sdk/secure-random-runtime` | راهنماهای token/UUID امن |
    | `plugin-sdk/system-event-runtime` | راهنماهای صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | راهنمای انتظار برای آمادگی transport |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ؛ از زیرمسیرهای runtime متمرکز بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | راهنماهای کوچک cache محدود |
    | `plugin-sdk/diagnostic-runtime` | راهنماهای flag تشخیصی، event، و trace-context |
    | `plugin-sdk/error-runtime` | گراف خطا، قالب‌بندی، راهنماهای مشترک طبقه‌بندی خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch پوشش‌داده‌شده، proxy، گزینه EnvHttpProxyAgent، و راهنماهای lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch در runtime آگاه از dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | خواننده response-body محدود بدون سطح گسترده media runtime |
    | `plugin-sdk/session-binding-runtime` | وضعیت binding مکالمه فعلی بدون routing مربوط به binding پیکربندی‌شده یا ذخیره‌گاه‌های pairing |
    | `plugin-sdk/session-store-runtime` | راهنماهای session-store بدون importهای گسترده نوشتن/نگهداشت پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | resolution دیدپذیری context و فیلترکردن context تکمیلی بدون importهای گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | راهنماهای محدود coercion و نرمال‌سازی record/string primitive بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | راهنماهای نرمال‌سازی hostname و میزبان SCP |
    | `plugin-sdk/retry-runtime` | راهنماهای پیکربندی retry و اجراکننده retry |
    | `plugin-sdk/agent-runtime` | راهنماهای دایرکتوری/identity/workspace عامل، از جمله `resolveAgentDir`، `resolveDefaultAgentDir`، و خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | query/dedup دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک واکشی/تبدیل/ذخیره رسانه، بررسی ابعاد ویدیو مبتنی بر ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-store` | کمک‌کننده‌های محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک failover تولید رسانه، انتخاب نامزد، و پیام‌رسانی مدلِ موجود نیست |
    | `plugin-sdk/media-understanding` | نوع‌های provider فهم رسانه به‌همراه خروجی‌های کمک‌کننده تصویر/صوت روبه‌روی provider |
    | `plugin-sdk/text-runtime` | کمک‌کننده‌های مشترک متن/Markdown/ثبت لاگ، مانند حذف متن قابل‌مشاهده برای assistant، کمک‌کننده‌های رندر/قطعه‌بندی/جدول Markdown، کمک‌کننده‌های ویرایش محرمانه، کمک‌کننده‌های برچسب directive، و ابزارهای متن امن |
    | `plugin-sdk/text-chunking` | کمک‌کننده قطعه‌بندی متن خروجی |
    | `plugin-sdk/speech` | نوع‌های provider گفتار به‌همراه خروجی‌های directive، registry، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و کمک‌کننده‌های گفتار روبه‌روی provider |
    | `plugin-sdk/speech-core` | نوع‌های مشترک provider گفتار، registry، directive، نرمال‌سازی، و خروجی‌های کمک‌کننده گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های provider رونویسی بلادرنگ، کمک‌کننده‌های registry، و کمک‌کننده مشترک جلسه WebSocket |
    | `plugin-sdk/realtime-voice` | نوع‌های provider صدای بلادرنگ و کمک‌کننده‌های registry |
    | `plugin-sdk/image-generation` | نوع‌های provider تولید تصویر به‌همراه کمک‌کننده‌های asset تصویر/data URL و سازنده provider تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌های مشترک تولید تصویر، failover، احراز هویت، و کمک‌کننده‌های registry |
    | `plugin-sdk/music-generation` | نوع‌های provider/request/result تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، کمک‌کننده‌های failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/video-generation` | نوع‌های provider/request/result تولید ویدیو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدیو، کمک‌کننده‌های failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/webhook-targets` | registry مقصد Webhook و کمک‌کننده‌های نصب route |
    | `plugin-sdk/webhook-path` | کمک‌کننده‌های نرمال‌سازی مسیر Webhook |
    | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک بارگذاری رسانه راه‌دور/محلی |
    | `plugin-sdk/zod` | `zod` بازصادرشده برای مصرف‌کنندگان SDK Plugin |
    | `plugin-sdk/testing` | barrel سازگاری گسترده برای آزمایش‌های Plugin قدیمی. آزمایش‌های extension جدید باید به‌جای آن، زیرمسیرهای متمرکز SDK مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌کننده حداقلی `createTestPluginApi` برای آزمایش‌های واحد ثبت مستقیم Plugin بدون import کردن پل‌های کمک‌کننده آزمایش repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime برای آزمایش‌های احراز هویت، تحویل، fallback، tool-hook، prompt-overlay، schema، و projection رونوشت |
    | `plugin-sdk/channel-test-helpers` | کمک‌کننده‌های آزمایش کانال‌محور برای قراردادهای عمومی actions/setup/status، assertهای directory، چرخه‌عمر startup حساب، threading send-config، mockهای runtime، issues وضعیت، تحویل outbound، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک حالت‌های خطای target-resolution برای آزمایش‌های channel |
    | `plugin-sdk/plugin-test-contracts` | کمک‌کننده‌های قرارداد package Plugin، ثبت، artifact عمومی، import مستقیم، runtime API، و side-effectهای import |
    | `plugin-sdk/provider-test-contracts` | کمک‌کننده‌های قرارداد provider runtime، احراز هویت، کشف، onboard، catalog، wizard، قابلیت رسانه، سیاست replay، صوت زنده STT بلادرنگ، web-search/fetch، و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/auth اختیاری Vitest برای آزمایش‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی برای ضبط runtime CLI، زمینه sandbox، نویسنده skill، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin همراه، terminal-text، قطعه‌بندی، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌کننده‌های mock متمرکز برای Node builtin جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌کننده memory-core همراه برای کمک‌کننده‌های manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای index/search حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های engine بنیاد host حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی registry، provider محلی، و کمک‌کننده‌های عمومی batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های engine QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های engine ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | کمک‌کننده‌های journal رویداد میزبان حافظه |
    | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های status میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌کننده‌های runtime CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌کننده‌های runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار بی‌طرف نسبت به vendor برای کمک‌کننده‌های runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار بی‌طرف نسبت به vendor برای کمک‌کننده‌های journal رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار بی‌طرف نسبت به vendor برای کمک‌کننده‌های file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های مشترک managed-markdown برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | facade runtime Active Memory برای دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | نام مستعار بی‌طرف نسبت به vendor برای کمک‌کننده‌های status میزبان حافظه |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشده کمک‌کننده‌های همراه">
    در حال حاضر هیچ زیرمسیر SDK رزروشده‌ای برای کمک‌کننده‌های همراه وجود ندارد. کمک‌کننده‌های مالک‌ویژه داخل package مالکِ Plugin قرار دارند، در حالی که قراردادهای host قابل‌استفاده مجدد از زیرمسیرهای عمومی SDK مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
