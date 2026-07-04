---
read_when:
    - انتخاب زیربخش مناسب plugin-sdk برای import در یک Plugin
    - ممیزی زیرمسیرهای Plugin بسته‌بندی‌شده و سطوح کمکی
summary: 'فهرست زیرمسیرهای Plugin SDK: کدام واردسازی‌ها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-07-04T10:55:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیربخش‌های عمومی و محدود زیر
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیربخش‌های رایج را بر اساس
هدف فهرست می‌کند. فهرست نقطه‌های ورود کامپایلرِ تولیدشده در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای بسته، زیرمجموعه عمومی
پس از کم‌کردن زیربخش‌های آزمون/داخلیِ محلیِ مخزن هستند که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌دارندگان می‌توانند
شمار exportهای عمومی را با `pnpm plugin-sdk:surface` و زیربخش‌های کمکی رزرو‌شده فعال را
با `pnpm plugins:boundary-report:summary` ممیزی کنند؛ exportهای کمکی رزرو‌شده و استفاده‌نشده،
به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی سازگاری غیرفعال، گزارش CI را ناموفق می‌کنند.

برای راهنمای نگارش Plugin، [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) را ببینید.

## ورود Plugin

| زیربخش                         | exportهای کلیدی                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | کمک‌کننده‌های آیتم ارائه‌دهنده مهاجرت مانند `createMigrationItem`، ثابت‌های دلیل، نشانگرهای وضعیت آیتم، کمک‌کننده‌های ویرایش محرمانه، و `summarizeMigrationItems`     |
| `plugin-sdk/migration-runtime` | کمک‌کننده‌های مهاجرت در زمان اجرا مانند `copyMigrationFileItem`، `resolvePlannedMigrationTargets`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`        |
| `plugin-sdk/health`            | ثبت، تشخیص، تعمیر، انتخاب، شدت، و نوع‌های یافته برای بررسی سلامت Doctor ویژه مصرف‌کنندگان سلامتِ بسته‌بندی‌شده                                                         |

### سازگاری منسوخ‌شده و کمک‌کننده‌های آزمون

زیربخش‌های منسوخ‌شده برای Pluginهای قدیمی‌تر همچنان export می‌شوند، اما کد جدید باید از
زیربخش‌های متمرکز SDK در پایین استفاده کند. فهرست نگه‌داری‌شده در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` است؛ CI ایمپورت‌های تولیدیِ
بسته‌بندی‌شده از آن را رد می‌کند. barrelهای گسترده مانند `compat`، `config-types`،
`infra-runtime`، `text-runtime`، و `zod` فقط برای سازگاری هستند. `zod` را
مستقیما از `zod` ایمپورت کنید.

زیربخش‌های کمک‌کننده آزمونِ OpenClaw که بر Vitest تکیه دارند، فقط محلیِ مخزن هستند و دیگر
exportهای بسته نیستند: `agent-runtime-test-contracts`،
`channel-contract-testing`، `channel-target-testing`، `channel-test-helpers`،
`plugin-test-api`، `plugin-test-contracts`، `plugin-test-runtime`،
`provider-http-test-mocks`، `provider-test-contracts`، `test-env`،
`test-fixtures`، `test-node-mocks`، و `testing`.

### زیربخش‌های کمکی رزرو‌شده برای Plugin بسته‌بندی‌شده

این زیربخش‌ها سطح‌های سازگاریِ متعلق به Plugin برای Plugin بسته‌بندی‌شده مالک خود هستند،
نه APIهای عمومی SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. ایمپورت‌های افزونه میان‌مالکی با
محافظ‌های قرارداد بسته مسدود می‌شوند.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی طرح‌واره Zod ریشه `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | کمک‌کننده اعتبارسنجی JSON Schema کش‌شده برای طرح‌واره‌های تحت مالکیت Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌کننده‌های مشترک جادوگر راه‌اندازی، مترجم راه‌اندازی، پرامپت‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌کننده‌های پیکربندی/دروازه اقدام چندحسابی، کمک‌کننده‌های بازگشت به حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌کننده‌های نرمال‌سازی شناسه حساب |
    | `plugin-sdk/account-resolution` | کمک‌کننده‌های جست‌وجوی حساب + بازگشت به پیش‌فرض |
    | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | کمک‌کننده‌های تجزیه فهرست مجاز گروه دسترسی و عیب‌یابی گروه با حذف اطلاعات حساس |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | ابتدایی‌های مشترک طرح‌واره پیکربندی کانال، به‌علاوه سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | طرح‌واره‌های پیکربندی کانال OpenClaw همراه فقط برای Pluginهای همراه نگهداری‌شده |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. شناسه‌های متعارف کانال گفت‌وگوی همراه/رسمی، به‌علاوه برچسب‌ها/نام‌های مستعار قالب‌بند برای Pluginهایی که باید متن دارای پیشوند پاکت را بدون سخت‌کدن جدول خودشان تشخیص دهند. |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ‌شده برای طرح‌واره‌های پیکربندی کانال همراه |
    | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های نرمال‌سازی/اعتبارسنجی دستور سفارشی Telegram با بازگشت قرارداد همراه |
    | `plugin-sdk/command-gating` | کمک‌کننده‌های محدود دروازه مجوزدهی دستور |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری ورودی کانال سطح‌پایین منسوخ‌شده. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | حل‌کننده زمان‌اجرای ورودی کانال سطح‌بالای آزمایشی و سازنده‌های واقعیت مسیر برای مسیرهای دریافت کانال مهاجرت‌داده‌شده. این را به مونتاژ فهرست‌های مجاز مؤثر، فهرست‌های مجاز دستور، و تصویرسازی‌های قدیمی در هر Plugin ترجیح دهید. [API ورودی کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-outbound` | قراردادهای چرخه عمر پیام، به‌علاوه گزینه‌های خط لوله پاسخ، رسیدها، پیش‌نمایش/جریان زنده، کمک‌کننده‌های چرخه عمر، هویت خروجی، برنامه‌ریزی محموله، ارسال‌های بادوام، و کمک‌کننده‌های زمینه ارسال پیام. [API خروجی کانال](/fa/plugins/sdk-channel-outbound) را ببینید. |
    | `plugin-sdk/channel-message` | نام مستعار سازگاری منسوخ‌شده برای `plugin-sdk/channel-outbound` به‌علاوه نماهای قدیمی اعزام پاسخ. |
    | `plugin-sdk/channel-message-runtime` | نام مستعار سازگاری منسوخ‌شده برای `plugin-sdk/channel-outbound` به‌علاوه نماهای قدیمی اعزام پاسخ. |
    | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های مشترک مسیر ورودی + سازنده پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | نمای سازگاری منسوخ‌شده. برای اجراکننده‌های ورودی و گزاره‌های اعزام از `plugin-sdk/channel-inbound`، و برای کمک‌کننده‌های تحویل پیام از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/messaging-targets` | نام مستعار منسوخ‌شده تجزیه هدف؛ از `plugin-sdk/channel-targets` استفاده کنید |
    | `plugin-sdk/outbound-media` | کمک‌کننده‌های مشترک بارگذاری رسانه خروجی و وضعیت رسانه میزبانی‌شده |
    | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | کمک‌کننده‌های محدود نرمال‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های چرخه عمر پیوند رشته و آداپتور |
    | `plugin-sdk/agent-media-payload` | سازنده قدیمی محموله رسانه عامل |
    | `plugin-sdk/conversation-runtime` | کمک‌کننده‌های مکالمه/پیوند رشته، جفت‌سازی، و پیوند پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده عکس فوری پیکربندی زمان‌اجرا |
    | `plugin-sdk/runtime-group-policy` | کمک‌کننده‌های حل خط‌مشی گروه در زمان‌اجرا |
    | `plugin-sdk/channel-status` | کمک‌کننده‌های مشترک عکس فوری/خلاصه وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | ابتدایی‌های محدود طرح‌واره پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک مقدمه Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | کمک‌کننده‌های مشترک تصمیم‌گیری دسترسی گروهی |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` استفاده کنید. |
    | `plugin-sdk/direct-dm-guard-policy` | کمک‌کننده‌های محدود خط‌مشی نگهبان direct-DM پیش از رمزنگاری |
    | `plugin-sdk/discord` | نمای سازگاری Discord منسوخ‌شده برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک رهگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری حل حساب Telegram منسوخ‌شده برای سازگاری مالک رهگیری‌شده؛ Pluginهای جدید باید از کمک‌کننده‌های تزریق‌شده زمان‌اجرا یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری Zalo Personal منسوخ‌شده برای بسته‌های منتشرشده Lark/Zalo که هنوز مجوزدهی دستور فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | ارائه، تحویل، و کمک‌کننده‌های قدیمی پاسخ تعاملی پیام معنایی. [ارائه پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | کمک‌کننده‌های مشترک ورودی برای طبقه‌بندی رویداد، ساخت زمینه، قالب‌بندی، ریشه‌ها، debounce، تطبیق mention، خط‌مشی mention، و ثبت لاگ ورودی |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌کننده‌های محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌کننده‌های محدود خط‌مشی mention، نشانگر mention، و متن mention بدون سطح گسترده‌تر زمان‌اجرای ورودی |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | نماهای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` یا `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-pairing-paths` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-pairing` استفاده کنید. |
    | `plugin-sdk/channel-reply-options-runtime` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-send-result` | انواع نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | کمک‌کننده‌های اقدام پیام کانال، به‌علاوه کمک‌کننده‌های طرح‌واره بومی منسوخ‌شده که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | کمک‌کننده‌های مشترک نرمال‌سازی مسیر، حل هدف مبتنی بر تجزیه‌گر، رشته‌سازی شناسه رشته، کلیدهای مسیر dedupe/compact، انواع هدف تجزیه‌شده، و مقایسه مسیر/هدف |
    | `plugin-sdk/channel-targets` | کمک‌کننده‌های تجزیه هدف؛ فراخوان‌های مقایسه مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | انواع قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود قرارداد محرمانه مانند `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، و انواع هدف محرمانه |
  </Accordion>

خانواده‌های کمک‌کننده کانال منسوخ‌شده فقط برای سازگاری با Pluginهای
منتشرشده در دسترس می‌مانند. برنامه حذف این است: آن‌ها را تا پایان پنجره
مهاجرت Plugin خارجی نگه دارید، Pluginهای مخزن/همراه را روی `channel-inbound` و
`channel-outbound` نگه دارید، سپس زیرمسیرهای سازگاری را در پاک‌سازی عمده بعدی
SDK حذف کنید. این شامل خانواده‌های قدیمی پیام/زمان‌اجرای کانال، جریان‌دهی
کانال، دسترسی direct-DM، انشعاب کمک‌کننده‌های ورودی، گزینه‌های پاسخ،
و مسیرهای جفت‌سازی می‌شود.

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شده ارائه‌دهنده LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شده LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و helperهای مدل‌های بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | helperهای گزینش‌شده برای راه‌اندازی ارائه‌دهنده محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | helperهای متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های ناظر |
    | `plugin-sdk/provider-auth-runtime` | helperهای تفکیک کلید API در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-oauth-runtime` | نوع‌های callback عمومی OAuth ارائه‌دهنده، رندر صفحه callback، helperهای PKCE/state، تحلیل ورودی مجوزدهی، helperهای انقضای توکن، و helperهای لغو |
    | `plugin-sdk/provider-auth-api-key` | helperهای ورود اولیه/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | helperهای جست‌وجوی متغیرهای محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helperهای واردسازی احراز هویت OpenAI Codex، خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، helperهای endpoint ارائه‌دهنده، و helperهای مشترک نرمال‌سازی شناسه مدل |
    | `plugin-sdk/provider-catalog-live-runtime` | helperهای کاتالوگ زنده مدل ارائه‌دهنده برای کشف محافظت‌شده به سبک `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`، فیلترسازی شناسه مدل، کش TTL، و fallback ایستا |
    | `plugin-sdk/provider-catalog-runtime` | hook زمان اجرای گسترش کاتالوگ ارائه‌دهنده و seamهای رجیستری Plugin-ارائه‌دهنده برای تست‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | helperهای عمومی قابلیت HTTP/endpoint ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و helperهای فرم چندبخشی رونویسی صوتی |
    | `plugin-sdk/provider-web-fetch-contract` | helperهای محدود قرارداد پیکربندی/انتخاب web-fetch مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | helperهای ثبت/کش ارائه‌دهنده web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | helperهای محدود پیکربندی/اعتبارنامه web-search برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | helperهای محدود قرارداد پیکربندی/اعتبارنامه web-search مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و setter/getterهای اعتبارنامه scoped |
    | `plugin-sdk/provider-web-search` | helperهای ثبت/کش/زمان اجرای ارائه‌دهنده web-search |
    | `plugin-sdk/embedding-providers` | نوع‌های عمومی ارائه‌دهنده embedding و helperهای خواندن، شامل `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`، و `listEmbeddingProviders(...)`؛ Pluginها ارائه‌دهندگان را از طریق `api.registerEmbeddingProvider(...)` ثبت می‌کنند تا مالکیت manifest اعمال شود |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی schema + عیب‌یابی DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | نوع‌های snapshot مصرف ارائه‌دهنده، helperهای مشترک دریافت مصرف، و دریافت‌کننده‌های ارائه‌دهنده مانند `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، نوع‌های wrapper جریان، سازگاری tool-call متن ساده، و helperهای wrapper مشترک Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | helperهای عمومی مشترک wrapper جریان ارائه‌دهنده، شامل `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`، و ابزارهای جریان سازگار با Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | helperهای انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | helperهای patch پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | helperهای singleton/map/cache محلی پردازش |
    | `plugin-sdk/group-activation` | helperهای محدود حالت فعال‌سازی گروه و تحلیل دستور |
  </Accordion>

snapshotهای مصرف ارائه‌دهنده معمولاً یک یا چند `windows` سهمیه را گزارش می‌کنند، که هرکدام
یک برچسب، درصد مصرف‌شده، و زمان بازنشانی اختیاری دارند. ارائه‌دهندگانی که به‌جای
پنجره‌های سهمیه قابل بازنشانی، متن موجودی یا وضعیت حساب را نشان می‌دهند باید
`summary` را همراه با آرایه خالی `windows` برگردانند، نه اینکه درصدهای ساختگی بسازند.
OpenClaw آن متن summary را در خروجی وضعیت نمایش می‌دهد؛ فقط زمانی از `error` استفاده کنید که
endpoint مصرف شکست خورده باشد یا هیچ داده مصرف قابل استفاده‌ای برنگردانده باشد.

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، helperهای رجیستری دستور شامل قالب‌بندی منوی آرگومان پویا، helperهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام دستور/help مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | helperهای تفکیک تأییدکننده و احراز هویت اقدام در همان چت |
    | `plugin-sdk/approval-client-runtime` | helperهای پروفایل/فیلتر تأیید exec بومی |
    | `plugin-sdk/approval-delivery-runtime` | adapterهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | helper مشترک تفکیک Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | helperهای سبک بارگذاری adapter تأیید بومی برای entrypointهای داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | helperهای گسترده‌تر زمان اجرای handler تأیید؛ وقتی seamهای محدودتر adapter/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | helperهای هدف تأیید بومی، اتصال حساب، route-gate، fallback بازارسال، و سرکوب prompt بومی exec محلی |
    | `plugin-sdk/approval-reaction-runtime` | bindingهای hardcoded واکنش تأیید، payloadهای prompt واکنش، storeهای هدف واکنش، helperهای متن hint واکنش، و خروجی سازگاری برای سرکوب prompt بومی exec محلی |
    | `plugin-sdk/approval-reply-runtime` | helperهای payload پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | helperهای payload تأیید exec/Plugin، helperهای مسیریابی/زمان اجرای تأیید بومی، و helperهای نمایش ساخت‌یافته تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | helperهای محدود reset حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | helperهای محدود تست قرارداد کانال بدون barrel گسترده تست |
    | `plugin-sdk/command-auth-native` | احراز هویت دستور بومی، قالب‌بندی منوی آرگومان پویا، و helperهای هدف نشست بومی |
    | `plugin-sdk/command-detection` | helperهای مشترک تشخیص دستور |
    | `plugin-sdk/command-primitives-runtime` | predicateهای سبک متن دستور برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنه دستور و helperهای سطح دستور |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | helperهای lazy جریان ورود احراز هویت ارائه‌دهنده برای کانال خصوصی و جفت‌سازی کد دستگاه Web UI |
    | `plugin-sdk/channel-secret-runtime` | helperهای محدود گردآوری قرارداد secret برای سطح‌های secret کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | helperهای محدود `coerceSecretRef` و تایپ SecretRef برای تحلیل قرارداد secret/پیکربندی |
    | `plugin-sdk/secret-provider-integration` | قراردادهای manifest و preset یکپارچه‌سازی ارائه‌دهنده SecretRef فقط-نوع برای Pluginهایی که presetهای ارائه‌دهنده secret خارجی منتشر می‌کنند |
    | `plugin-sdk/security-runtime` | helperهای مشترک اعتماد، gating پیام مستقیم، فایل/مسیر محدود به root شامل نوشتن‌های فقط-ایجاد، جایگزینی اتمیک فایل sync/async، نوشتن‌های temp هم‌ریشه، fallback جابه‌جایی بین دستگاهی، helperهای file-store خصوصی، guardهای parent symlink، محتوای خارجی، پوشاندن متن حساس، مقایسه secret با زمان ثابت، و helperهای گردآوری secret |
    | `plugin-sdk/ssrf-policy` | helperهای allowlist میزبان و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | helperهای محدود pinned-dispatcher بدون سطح گسترده زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، fetch محافظت‌شده با SSRF، خطای SSRF، و helperهای سیاست SSRF |
    | `plugin-sdk/secret-input` | helperهای تحلیل ورودی secret |
    | `plugin-sdk/webhook-ingress` | helperهای درخواست/هدف Webhook و اجبار نوع websocket/body خام |
    | `plugin-sdk/webhook-request-guards` | helperهای اندازه/timeout بدنه درخواست |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | توابع کمکی گسترده برای زمان اجرا/ثبت گزارش/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | توابع کمکی محدود برای محیط زمان اجرا، ثبت‌کننده گزارش، مهلت زمانی، تلاش دوباره، و عقب‌نشینی |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای پروفایل/پیش‌فرض‌های نرمال‌سازی‌شده، تحلیل URL مربوط به CDP، و توابع کمکی احراز هویت کنترل مرورگر |
    | `plugin-sdk/agent-harness-task-runtime` | توابع کمکی عمومی برای چرخه عمر وظیفه و تحویل تکمیل برای عامل‌های متکی به هارنس که از محدوده وظیفه صادرشده توسط میزبان استفاده می‌کنند |
    | `plugin-sdk/codex-mcp-projection` | تابع کمکی رزروشده Codex همراه برای نگاشت پیکربندی سرور MCP کاربر به پیکربندی نخ Codex؛ نه برای Pluginهای شخص ثالث |
    | `plugin-sdk/codex-native-task-runtime` | تابع کمکی خصوصی Codex همراه برای سیم‌کشی آینه وظیفه/زمان اجرای بومی؛ نه برای Pluginهای شخص ثالث |
    | `plugin-sdk/channel-runtime-context` | توابع کمکی عمومی برای ثبت و جست‌وجوی زمینه زمان اجرای کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ Matrix برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیماً `plugin-sdk/run-command` را وارد کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ Mattermost برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید زیرمسیرهای عمومی SDK را مستقیماً وارد کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | توابع کمکی مشترک برای فرمان/hook/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | توابع کمکی مشترک برای خط لوله Webhook/hook داخلی |
    | `plugin-sdk/lazy-runtime` | توابع کمکی واردکردن/اتصال تنبل زمان اجرا، مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | توابع کمکی اجرای فرایند |
    | `plugin-sdk/cli-runtime` | توابع کمکی قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/qa-live-transport-scenarios` | شناسه‌های سناریوی QA انتقال زنده مشترک، توابع کمکی پوشش مبنا، و تابع کمکی انتخاب سناریو |
    | `plugin-sdk/gateway-method-runtime` | تابع کمکی رزروشده ارسال متد Gateway برای مسیرهای HTTP مربوط به Plugin که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، تابع کمکی شروع کلاینت آماده حلقه رویداد، RPC مربوط به CLI در Gateway، خطاهای پروتکل Gateway، حل میزبان LAN اعلام‌شده، و توابع کمکی وصله وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط نوعی برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و نوع‌های پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | توابع کمکی جست‌وجوی پیکربندی Plugin در زمان اجرا، مانند `requireRuntimeConfig`، `resolvePluginConfigObject`، و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | توابع کمکی جهش تراکنشی پیکربندی، مانند `mutateConfigFile`، `replaceConfigFile`، و `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | رشته‌های راهنمای فراداده تحویل ابزار پیام مشترک |
    | `plugin-sdk/runtime-config-snapshot` | توابع کمکی عکس‌فوری پیکربندی فرایند فعلی، مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot`، و تنظیم‌کننده‌های عکس‌فوری تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد Telegram همراه در دسترس نباشد |
    | `plugin-sdk/text-autolink-runtime` | تشخیص پیوند خودکار ارجاع فایل بدون بشکه متنی گسترده |
    | `plugin-sdk/approval-reaction-runtime` | اتصال‌های واکنش تأیید کدنویسی‌شده، بارهای پیام واکنش، ذخیره‌گاه‌های هدف واکنش، توابع کمکی متن راهنمای واکنش، و خروجی سازگاری برای سرکوب پیام اجرای بومی محلی |
    | `plugin-sdk/approval-runtime` | توابع کمکی تأیید اجرا/Plugin، سازنده‌های قابلیت تأیید، توابع کمکی احراز هویت/پروفایل، توابع کمکی مسیریابی/زمان اجرای بومی، و قالب‌بندی مسیر نمایش تأیید ساخت‌یافته |
    | `plugin-sdk/reply-runtime` | توابع کمکی مشترک زمان اجرای ورودی/پاسخ، بخش‌بندی، ارسال، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | توابع کمکی محدود ارسال/نهایی‌سازی پاسخ و برچسب مکالمه |
    | `plugin-sdk/reply-history` | توابع کمکی مشترک تاریخچه پاسخ در پنجره کوتاه. کد جدید نوبت پیام باید از `createChannelHistoryWindow` استفاده کند؛ توابع کمکی نقشه در سطح پایین‌تر فقط به‌عنوان خروجی‌های سازگاری منسوخ باقی می‌مانند |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | توابع کمکی محدود بخش‌بندی متن/مارک‌داون |
    | `plugin-sdk/session-store-runtime` | توابع کمکی گردش‌کار نشست (`getSessionEntry`، `listSessionEntries`، `patchSessionEntry`، `upsertSessionEntry`)؛ خواندن‌های محدود متن رونوشت اخیر کاربر/دستیار بر اساس هویت نشست؛ توابع کمکی مسیر ذخیره‌گاه نشست قدیمی/کلید نشست؛ خواندن‌های زمان به‌روزرسانی؛ و توابع کمکی سازگاری کل ذخیره‌گاه/مسیر فایل مخصوص گذار |
    | `plugin-sdk/session-transcript-runtime` | هویت رونوشت، توابع کمکی هدف‌گذاری/خواندن/نوشتن دامنه‌دار، انتشار به‌روزرسانی، قفل‌های نوشتن، و کلیدهای برخورد حافظه رونوشت |
    | `plugin-sdk/sqlite-runtime` | توابع کمکی متمرکز SQLite برای شمای عامل، مسیر، و تراکنش در زمان اجرای فرست‌پارتی |
    | `plugin-sdk/cron-store-runtime` | توابع کمکی مسیر/بارگذاری/ذخیره‌سازی ذخیره‌گاه Cron |
    | `plugin-sdk/state-paths` | توابع کمکی مسیر دایرکتوری وضعیت/OAuth |
    | `plugin-sdk/plugin-state-runtime` | نوع‌های وضعیت کلیددار SQLite برای سایدکار Plugin به‌همراه تنظیم متمرکز pragma اتصال و نگه‌داری WAL برای پایگاه‌های داده تحت مالکیت Plugin |
    | `plugin-sdk/routing` | توابع کمکی اتصال مسیر/کلید نشست/حساب، مانند `resolveAgentRoute`، `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | توابع کمکی مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، و توابع کمکی فراداده مسئله |
    | `plugin-sdk/target-resolver-runtime` | توابع کمکی مشترک حل‌کننده هدف |
    | `plugin-sdk/string-normalization-runtime` | توابع کمکی نرمال‌سازی slug/رشته |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج stdout/stderr نرمال‌سازی‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های مشترک پارامتر ابزار/CLI |
    | `plugin-sdk/tool-plugin` | تعریف یک Plugin ساده و نوع‌دار برای ابزار عامل و ارائه فراداده ایستا برای تولید مانیفست |
    | `plugin-sdk/tool-payload` | استخراج بارهای نرمال‌سازی‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای هدف ارسال معیار از آرگومان‌های ابزار |
    | `plugin-sdk/sandbox` | نوع‌های بک‌اند سندباکس و توابع کمکی فرمان SSH/OpenShell، شامل پیش‌بررسی فرمان اجرا با شکست سریع |
    | `plugin-sdk/temp-path` | توابع کمکی مشترک مسیر دانلود موقت و فضاهای کاری موقت امن خصوصی |
    | `plugin-sdk/logging-core` | توابع کمکی ثبت‌کننده گزارش زیرسیستم و پوشاندن داده |
    | `plugin-sdk/markdown-table-runtime` | توابع کمکی حالت جدول مارک‌داون و تبدیل |
    | `plugin-sdk/model-session-runtime` | توابع کمکی بازنویسی مدل/نشست، مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | توابع کمکی حل پیکربندی ارائه‌دهنده گفت‌وگو |
    | `plugin-sdk/json-store` | توابع کمکی کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/json-unsafe-integers` | توابع کمکی تحلیل JSON که لیترال‌های عدد صحیح ناامن را به‌صورت رشته حفظ می‌کنند |
    | `plugin-sdk/file-lock` | توابع کمکی قفل فایل بازگشتی |
    | `plugin-sdk/persistent-dedupe` | توابع کمکی کش حذف تکرار مبتنی بر دیسک |
    | `plugin-sdk/acp-runtime` | توابع کمکی ACP برای زمان اجرا/نشست و ارسال پاسخ |
    | `plugin-sdk/acp-runtime-backend` | توابع کمکی سبک برای ثبت بک‌اند ACP و ارسال پاسخ برای Pluginهای بارگذاری‌شده در راه‌اندازی |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل اتصال ACP به‌صورت فقط‌خواندنی بدون واردکردن‌های راه‌اندازی چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | ابتدایی‌های محدود شمای پیکربندی زمان اجرای عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر بولی سست |
    | `plugin-sdk/dangerous-name-runtime` | توابع کمکی حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | توابع کمکی راه‌اندازی دستگاه و توکن جفت‌سازی |
    | `plugin-sdk/extension-shared` | ابتدایی‌های مشترک برای کانال غیرفعال، وضعیت، و تابع کمکی پروکسی محیطی |
    | `plugin-sdk/models-provider-runtime` | توابع کمکی پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | توابع کمکی فهرست‌کردن فرمان‌های مهارت |
    | `plugin-sdk/native-command-registry` | توابع کمکی رجیستری/ساخت/سریال‌سازی فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورداعتماد برای هارنس‌های سطح پایین عامل: نوع‌های هارنس، توابع کمکی هدایت/لغو اجرای فعال، توابع کمکی پل ابزار OpenClaw، توابع کمکی سیاست ابزار برنامه زمان اجرا، دسته‌بندی نتیجه پایانه، توابع کمکی قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای کاربردی نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | نمای منسوخ تشخیص نقطه پایانی تحت مالکیت ارائه‌دهنده Z.AI؛ از API عمومی Plugin مربوط به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | تابع کمکی قفل ناهمگام محلی فرایند برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | تابع کمکی دورسنجی فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | تابع کمکی هم‌زمانی وظیفه ناهمگام محدود |
    | `plugin-sdk/dedupe-runtime` | توابع کمکی کش حذف تکرار درون‌حافظه‌ای و متکی به پایداری |
    | `plugin-sdk/delivery-queue-runtime` | تابع کمکی تخلیه تحویل‌های معلق خروجی |
    | `plugin-sdk/file-access-runtime` | توابع کمکی مسیر امن برای فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | توابع کمکی بیدارسازی، رویداد، و دیدپذیری Heartbeat |
    | `plugin-sdk/number-runtime` | تابع کمکی تبدیل عددی |
    | `plugin-sdk/secure-random-runtime` | توابع کمکی امن توکن/UUID |
    | `plugin-sdk/system-event-runtime` | توابع کمکی صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | تابع کمکی انتظار برای آمادگی انتقال |
    | `plugin-sdk/exec-approvals-runtime` | توابع کمکی فایل سیاست تأیید اجرا بدون بشکه گسترده infra-runtime |
    | `plugin-sdk/infra-runtime` | شیم سازگاری منسوخ؛ از زیرمسیرهای متمرکز زمان اجرا در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | توابع کمکی کش کوچک و محدود |
    | `plugin-sdk/diagnostic-runtime` | توابع کمکی پرچم تشخیصی، رویداد، و زمینه ردیابی |
    | `plugin-sdk/error-runtime` | توابع کمکی گراف خطا، قالب‌بندی، و دسته‌بندی خطای مشترک، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | توابع کمکی fetch پوشش‌داده‌شده، پروکسی، گزینه EnvHttpProxyAgent، و جست‌وجوی سنجاق‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا با آگاهی از توزیع‌کننده، بدون واردکردن‌های پروکسی/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | توابع کمکی پاک‌سازی URL داده تصویر درون‌خطی و تشخیص امضا، بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود بدنه پاسخ، بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت اتصال مکالمه فعلی بدون مسیریابی اتصال پیکربندی‌شده یا ذخیره‌گاه‌های جفت‌سازی |
    | `plugin-sdk/session-store-runtime` | توابع کمکی ذخیره‌گاه نشست بدون واردکردن‌های گسترده نوشتن/نگه‌داری پیکربندی |
    | `plugin-sdk/sqlite-runtime` | توابع کمکی متمرکز SQLite برای شمای عامل، مسیر، و تراکنش بدون کنترل‌های چرخه عمر پایگاه داده |
    | `plugin-sdk/context-visibility-runtime` | حل دیدپذیری زمینه و فیلترکردن زمینه تکمیلی بدون واردکردن‌های گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | توابع کمکی محدود تبدیل و نرمال‌سازی رکورد/رشته ابتدایی بدون واردکردن‌های مارک‌داون/ثبت گزارش |
    | `plugin-sdk/host-runtime` | توابع کمکی نرمال‌سازی نام میزبان و میزبان SCP |
    | `plugin-sdk/retry-runtime` | توابع کمکی پیکربندی تلاش دوباره و اجراکننده تلاش دوباره |
    | `plugin-sdk/agent-runtime` | توابع کمکی دایرکتوری/هویت/فضای کاری عامل، شامل `resolveAgentDir`، `resolveDefaultAgentDir`، و خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | پرس‌وجو/حذف تکرار دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌تابع‌های مشترک واکشی/تبدیل/ذخیره رسانه، شامل `saveRemoteMedia`، `saveResponseMedia`، `readRemoteMediaBuffer` و `fetchRemoteMedia` منسوخ‌شده؛ وقتی قرار است یک URL به رسانه OpenClaw تبدیل شود، پیش از خواندن بافر، کمک‌تابع‌های ذخیره را ترجیح دهید |
    | `plugin-sdk/media-mime` | نرمال‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME، و کمک‌تابع‌های نوع رسانه |
    | `plugin-sdk/media-store` | کمک‌تابع‌های محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` و `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | کمک‌تابع‌های مشترک جایگزینی هنگام شکست در تولید رسانه، انتخاب نامزد، و پیام‌رسانی مدلِ موجود نیست |
    | `plugin-sdk/media-understanding` | نوع‌های ارائه‌دهنده درک رسانه به‌همراه خروجی‌های کمک‌تابع تصویر/صوت/استخراج ساخت‌یافته برای ارائه‌دهنده‌ها |
    | `plugin-sdk/text-chunking` | کمک‌تابع‌های تکه‌بندی/رندر متن و markdown، تبدیل جدول markdown، حذف برچسب‌های دستوری، و ابزارهای متن ایمن |
    | `plugin-sdk/text-chunking` | کمک‌تابع تکه‌بندی متن خروجی |
    | `plugin-sdk/speech` | نوع‌های ارائه‌دهنده گفتار به‌همراه خروجی‌های دستورالعمل، رجیستری، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و کمک‌تابع‌های گفتار برای ارائه‌دهنده‌ها |
    | `plugin-sdk/speech-core` | خروجی‌های مشترک نوع‌های ارائه‌دهنده گفتار، رجیستری، دستورالعمل، نرمال‌سازی، و کمک‌تابع‌های گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های ارائه‌دهنده رونویسی بی‌درنگ، کمک‌تابع‌های رجیستری، و کمک‌تابع مشترک نشست WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | کمک‌تابع بوت‌استرپ پروفایل بی‌درنگ برای تزریق محدود زمینه `IDENTITY.md`، `USER.md` و `SOUL.md` |
    | `plugin-sdk/realtime-voice` | نوع‌های ارائه‌دهنده صدای بی‌درنگ، کمک‌تابع‌های رجیستری، و کمک‌تابع‌های مشترک رفتار صدای بی‌درنگ، شامل ردیابی فعالیت خروجی |
    | `plugin-sdk/image-generation` | نوع‌های ارائه‌دهنده تولید تصویر به‌همراه کمک‌تابع‌های URL داده/دارایی تصویر و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌های مشترک تولید تصویر، جایگزینی هنگام شکست، احراز هویت، و کمک‌تابع‌های رجیستری |
    | `plugin-sdk/music-generation` | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، کمک‌تابع‌های جایگزینی هنگام شکست، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
    | `plugin-sdk/video-generation` | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید ویدیو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدیو، کمک‌تابع‌های جایگزینی هنگام شکست، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
    | `plugin-sdk/transcripts` | نوع‌های مشترک ارائه‌دهنده منبع رونوشت‌ها، کمک‌تابع‌های رجیستری، توصیفگرهای نشست، و فراداده گفتار |
    | `plugin-sdk/webhook-targets` | رجیستری مقصد Webhook و کمک‌تابع‌های نصب مسیر |
    | `plugin-sdk/webhook-path` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | کمک‌تابع‌های مشترک بارگذاری رسانه دوردست/محلی |
    | `plugin-sdk/zod` | بازصدور سازگاری منسوخ‌شده؛ `zod` را مستقیما از `zod` وارد کنید |
    | `plugin-sdk/testing` | barrel سازگاری منسوخ‌شده محلیِ مخزن برای آزمایش‌های قدیمی OpenClaw. آزمایش‌های جدید مخزن باید به‌جای آن زیرمسیرهای آزمایشی محلی متمرکز مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env` یا `plugin-sdk/test-fixtures` را وارد کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌تابع کمینه `createTestPluginApi` محلیِ مخزن برای آزمایش‌های واحد ثبت مستقیم Plugin بدون وارد کردن پل‌های کمک‌تابع آزمایشی مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | فیکسچرهای قرارداد آداپتور بومی agent-runtime محلیِ مخزن برای آزمایش‌های احراز هویت، تحویل، جایگزینی، tool-hook، prompt-overlay، schema، و برون‌نمایی رونوشت |
    | `plugin-sdk/channel-test-helpers` | کمک‌تابع‌های آزمایشی کانال‌محور محلیِ مخزن برای قراردادهای کنش/راه‌اندازی/وضعیت عمومی، وارسی‌های دایرکتوری، چرخه عمر راه‌اندازی حساب، رشته‌بندی send-config، ماک‌های runtime، مشکلات وضعیت، تحویل خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک حالت‌های خطای حل مقصد محلیِ مخزن برای آزمایش‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | کمک‌تابع‌های قرارداد بسته Plugin، ثبت، آرتیفکت عمومی، import مستقیم، API runtime، و عارضه جانبی import محلیِ مخزن |
    | `plugin-sdk/provider-test-contracts` | کمک‌تابع‌های قرارداد runtime ارائه‌دهنده، احراز هویت، کشف، onboard، کاتالوگ، wizard، قابلیت رسانه، سیاست بازپخش، STT بی‌درنگ صدای زنده، web-search/fetch، و stream محلیِ مخزن |
    | `plugin-sdk/provider-http-test-mocks` | ماک‌های اختیاری Vitest برای HTTP/احراز هویت محلیِ مخزن برای آزمایش‌های ارائه‌دهنده‌ای که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | فیکسچرهای عمومی محلیِ مخزن برای ثبت runtime در CLI، زمینه sandbox، نویسنده skill، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin باندل‌شده، terminal-text، تکه‌بندی، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌تابع‌های ماک متمرکز builtin در Node، محلیِ مخزن، برای استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌تابع memory-core باندل‌شده برای کمک‌تابع‌های manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | نمای runtime برای index/search حافظه |
    | `plugin-sdk/memory-core-host-embedding-registry` | کمک‌تابع‌های سبک رجیستری ارائه‌دهنده embedding حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های موتور بنیاد میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و کمک‌تابع‌های عمومی batch/remote. `registerMemoryEmbeddingProvider` روی این سطح منسوخ شده است؛ برای ارائه‌دهنده‌های جدید از API عمومی ارائه‌دهنده embedding استفاده کنید. |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌تابع‌های چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | کمک‌تابع‌های پرس‌وجوی میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | کمک‌تابع‌های secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | کمک‌تابع‌های وضعیت میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌تابع‌های runtime در CLI برای میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌تابع‌های runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌تابع‌های فایل/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌تابع‌های runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌تابع‌های دفتر رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | کمک‌تابع‌های مشترک managed-markdown برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | نمای runtime برای حافظه فعال جهت دسترسی به search-manager |
    | `plugin-sdk/memory-host-status` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشده کمک‌تابع‌های باندل‌شده">
    زیرمسیرهای SDK کمک‌تابع باندل‌شده رزروشده، سطح‌های محدود و مختص مالک برای
    کد Plugin باندل‌شده هستند. آن‌ها در موجودی SDK ردیابی می‌شوند تا ساخت‌های
    بسته و aliasing قطعی بمانند، اما APIهای عمومی برای نوشتن Plugin نیستند.
    قراردادهای میزبان قابل استفاده مجدد جدید باید از زیرمسیرهای عمومی SDK
    مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime` استفاده کنند.

    | زیرمسیر | مالک و هدف |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | کمک‌تابع Plugin باندل‌شده Codex برای برون‌نمایی پیکربندی سرور MCP کاربر به پیکربندی thread در app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | کمک‌تابع Plugin باندل‌شده Codex برای آینه‌سازی subagentهای بومی app-server Codex در وضعیت وظیفه OpenClaw |

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
