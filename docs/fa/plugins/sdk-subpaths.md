---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای import یک Plugin
    - ممیزی زیرمسیرها و سطوح کمکی Pluginهای همراه
summary: 'کاتالوگ زیربخش‌های Plugin SDK: کدام importها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای SDK Plugin
x-i18n:
    generated_at: "2026-07-01T13:15:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای عمومی محدود در
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیرمسیرهای رایج را بر اساس
هدف دسته‌بندی و فهرست می‌کند. فهرست تولیدشدهٔ نقطهٔ ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های بسته، زیرمجموعهٔ عمومی
پس از کم‌کردن زیرمسیرهای آزمون/داخلیِ محلی مخزن هستند که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌دارندگان می‌توانند
تعداد خروجی‌های عمومی را با `pnpm plugin-sdk:surface` و زیرمسیرهای کمکی رزروشدهٔ
فعال را با `pnpm plugins:boundary-report:summary` بازبینی کنند؛ خروجی‌های کمکی رزروشدهٔ
استفاده‌نشده، به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی سازگاری غیرفعال،
گزارش CI را ناموفق می‌کنند.

برای راهنمای نویسندگی Plugin، [مرور کلی Plugin SDK](/fa/plugins/sdk-overview) را ببینید.

## ورود Plugin

| زیرمسیر                        | خروجی‌های کلیدی                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | کمک‌کننده‌های موردی ارائه‌دهندهٔ مهاجرت مانند `createMigrationItem`، ثابت‌های دلیل، نشانگرهای وضعیت مورد، کمک‌کننده‌های ویرایش محرمانه، و `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | کمک‌کننده‌های مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                              |
| `plugin-sdk/health`            | ثبت بررسی سلامت Doctor، تشخیص، تعمیر، انتخاب، شدت، و انواع یافته برای مصرف‌کنندگان سلامتِ همراه                                               |

### سازگاری منسوخ‌شده و کمک‌کننده‌های آزمون

زیرمسیرهای منسوخ‌شده برای Pluginهای قدیمی‌تر همچنان خروجی داده می‌شوند، اما کد جدید باید از
زیرمسیرهای متمرکز SDK در پایین استفاده کند. فهرست نگه‌داری‌شده در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` قرار دارد؛ CI واردکردن‌های تولیدیِ
همراه را از آن رد می‌کند. Barrelهای گسترده مانند `compat`، `config-types`،
`infra-runtime`، `text-runtime`، و `zod` فقط برای سازگاری هستند. `zod` را
مستقیما از `zod` وارد کنید.

زیرمسیرهای کمک‌کنندهٔ آزمونِ مبتنی بر Vitest در OpenClaw فقط محلیِ مخزن هستند و دیگر
خروجی‌های بسته نیستند: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, و `testing`.

### زیرمسیرهای کمکی رزروشدهٔ Plugin همراه

این زیرمسیرها سطح‌های سازگاریِ متعلق به Plugin برای Plugin همراهِ مالک خود هستند،
نه APIهای عمومی SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. واردکردن‌های افزونهٔ میان‌مالک با
حفاظ‌های قرارداد بسته مسدود می‌شوند.

<AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی طرح‌واره Zod ریشه `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | راهنمای اعتبارسنجی JSON Schema کش‌شده برای طرح‌واره‌های متعلق به Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | راهنماهای مشترک جادوگر راه‌اندازی، مترجم راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | راهنماهای پیکربندی چندحسابی/دروازه اقدام، راهنماهای مسیر جایگزین حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، راهنماهای نرمال‌سازی شناسه حساب |
    | `plugin-sdk/account-resolution` | راهنماهای جست‌وجوی حساب + مسیر جایگزین پیش‌فرض |
    | `plugin-sdk/account-helpers` | راهنماهای محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | راهنماهای تجزیه فهرست مجاز گروه دسترسی و عیب‌یابی‌های گروهی ویرایش‌شده |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | اولیه‌های مشترک طرح‌واره پیکربندی کانال به‌علاوه سازنده‌های Zod و مستقیم JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | طرح‌واره‌های پیکربندی کانال بسته‌بندی‌شده OpenClaw فقط برای Pluginهای بسته‌بندی‌شده نگهداری‌شده |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. شناسه‌های متعارف کانال گفت‌وگوی بسته‌بندی‌شده/رسمی به‌علاوه برچسب‌ها/نام‌های مستعار قالب‌بند برای Pluginهایی که باید متن دارای پیشوند پاکت را بدون کدنویسی ثابت جدول خودشان تشخیص دهند. |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ‌شده برای طرح‌واره‌های پیکربندی کانال بسته‌بندی‌شده |
    | `plugin-sdk/telegram-command-config` | راهنماهای نرمال‌سازی/اعتبارسنجی دستور سفارشی Telegram با مسیر جایگزین قرارداد بسته‌بندی‌شده |
    | `plugin-sdk/command-gating` | راهنماهای محدود دروازه مجوزدهی دستور |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری منسوخ‌شده ورود کانال سطح پایین. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | حل‌کننده runtime ورود کانال سطح بالا و آزمایشی و سازنده‌های واقعیت مسیر برای مسیرهای دریافت کانال مهاجرت‌یافته. این را به مونتاژ فهرست‌های مجاز مؤثر، فهرست‌های مجاز دستور، و تصویرسازی‌های قدیمی در هر Plugin ترجیح دهید. [API ورود کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-outbound` | قراردادهای چرخه عمر پیام به‌علاوه گزینه‌های خط لوله پاسخ، رسیدها، پیش‌نمایش/استریمینگ زنده، راهنماهای چرخه عمر، هویت خروجی، برنامه‌ریزی payload، ارسال‌های پایدار، و راهنماهای زمینه ارسال پیام. [API خروجی کانال](/fa/plugins/sdk-channel-outbound) را ببینید. |
    | `plugin-sdk/channel-message` | نام مستعار سازگاری منسوخ‌شده برای `plugin-sdk/channel-outbound` به‌علاوه نماهای قدیمی ارسال پاسخ. |
    | `plugin-sdk/channel-message-runtime` | نام مستعار سازگاری منسوخ‌شده برای `plugin-sdk/channel-outbound` به‌علاوه نماهای قدیمی ارسال پاسخ. |
    | `plugin-sdk/inbound-envelope` | راهنماهای مشترک مسیر ورودی + سازنده پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` برای اجراکننده‌های ورودی و گزاره‌های ارسال، و از `plugin-sdk/channel-outbound` برای راهنماهای تحویل پیام استفاده کنید. |
    | `plugin-sdk/messaging-targets` | نام مستعار تجزیه هدف منسوخ‌شده؛ از `plugin-sdk/channel-targets` استفاده کنید |
    | `plugin-sdk/outbound-media` | راهنماهای مشترک بارگذاری رسانه خروجی و وضعیت رسانه میزبانی‌شده |
    | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | راهنماهای محدود نرمال‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | راهنماهای چرخه عمر و آداپتور اتصال رشته |
    | `plugin-sdk/agent-media-payload` | سازنده قدیمی payload رسانه عامل |
    | `plugin-sdk/conversation-runtime` | راهنماهای مکالمه/اتصال رشته، جفت‌سازی، و اتصال پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | راهنمای snapshot پیکربندی runtime |
    | `plugin-sdk/runtime-group-policy` | راهنماهای حل سیاست گروه runtime |
    | `plugin-sdk/channel-status` | راهنماهای مشترک snapshot/خلاصه وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | اولیه‌های محدود طرح‌واره پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | راهنماهای مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک مقدمه Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | راهنماهای ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | راهنماهای مشترک تصمیم‌گیری دسترسی گروه |
    | `plugin-sdk/direct-dm`، `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` استفاده کنید. |
    | `plugin-sdk/direct-dm-guard-policy` | راهنماهای محدود سیاست محافظ DM مستقیم پیش از رمزنگاری |
    | `plugin-sdk/discord` | نمای سازگاری منسوخ‌شده Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ‌شده حل حساب Telegram برای سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از راهنماهای runtime تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ‌شده Zalo Personal برای بسته‌های منتشرشده Lark/Zalo که هنوز مجوزدهی دستور فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | ارائه، تحویل، و راهنماهای قدیمی پاسخ تعاملی پیام معنایی. [ارائه پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | راهنماهای مشترک ورودی برای طبقه‌بندی رویداد، ساخت زمینه، قالب‌بندی، ریشه‌ها، debounce، تطبیق اشاره، سیاست اشاره، و ثبت ورودی |
    | `plugin-sdk/channel-inbound-debounce` | راهنماهای محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | راهنماهای محدود سیاست اشاره، نشانگر اشاره، و متن اشاره بدون سطح گسترده‌تر runtime ورودی |
    | `plugin-sdk/channel-envelope`، `plugin-sdk/channel-inbound-roots`، `plugin-sdk/channel-location`، `plugin-sdk/channel-logging` | نماهای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` یا `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-pairing-paths` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-pairing` استفاده کنید. |
    | `plugin-sdk/channel-reply-options-runtime` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | راهنماهای اقدام پیام کانال، به‌علاوه راهنماهای طرح‌واره بومی منسوخ‌شده که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | نرمال‌سازی مشترک مسیر، حل هدف مبتنی بر parser، رشته‌سازی شناسه رشته، کلیدهای مسیر dedupe/compact، نوع‌های هدف تجزیه‌شده، و راهنماهای مقایسه مسیر/هدف |
    | `plugin-sdk/channel-targets` | راهنماهای تجزیه هدف؛ فراخوان‌های مقایسه مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | راهنماهای محدود قرارداد secret مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، و نوع‌های هدف secret |
  </Accordion>

خانواده‌های راهنمای کانال منسوخ‌شده فقط برای سازگاری با Pluginهای
منتشرشده در دسترس می‌مانند. برنامه حذف این است: آن‌ها را در طول بازه
مهاجرت Plugin خارجی نگه دارید، Pluginهای مخزن/بسته‌بندی‌شده را روی
`channel-inbound` و `channel-outbound` نگه دارید، سپس زیرمسیرهای
سازگاری را در پاک‌سازی major بعدی SDK حذف کنید. این شامل خانواده‌های
قدیمی پیام/runtime کانال، استریمینگ کانال، دسترسی direct-DM، انشعاب
راهنمای ورودی، گزینه‌های پاسخ، و pairing-path می‌شود.

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شدهٔ ارائه‌دهندهٔ LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای پشتیبانی‌شدهٔ زمان اجرای LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌کننده‌های مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌کننده‌های برگزیدهٔ راه‌اندازی ارائه‌دهندهٔ محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی ارائه‌دهندهٔ خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های نگهبان |
    | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های رفع کلید API در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-oauth-runtime` | انواع عمومی callback ارائه‌دهنده برای OAuth، رندر صفحهٔ callback، کمک‌کننده‌های PKCE/وضعیت، تجزیهٔ ورودی مجوز، کمک‌کننده‌های انقضای توکن، و کمک‌کننده‌های لغو |
    | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های پذیرش اولیه/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازندهٔ استاندارد نتیجهٔ احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, کمک‌کننده‌های وارد کردن احراز هویت OpenAI Codex، خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های نقطهٔ پایانی ارائه‌دهنده، و کمک‌کننده‌های مشترک نرمال‌سازی شناسهٔ مدل |
    | `plugin-sdk/provider-catalog-live-runtime` | کمک‌کننده‌های کاتالوگ زندهٔ مدل ارائه‌دهنده برای کشف محافظت‌شده به سبک `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, فیلتر کردن شناسهٔ مدل، کش TTL، و بازگشت ثابت |
    | `plugin-sdk/provider-catalog-runtime` | هوک زمان اجرای تقویت کاتالوگ ارائه‌دهنده و seamهای رجیستری Plugin-ارائه‌دهنده برای تست‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌کننده‌های عمومی قابلیت HTTP/نقطهٔ پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌کننده‌های فرم چندبخشی رونویسی صوتی |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/انتخاب واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های ثبت/کش ارائه‌دهندهٔ واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های محدود پیکربندی/اعتبارنامهٔ جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/اعتبارنامهٔ جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنهٔ محدود |
    | `plugin-sdk/provider-web-search` | کمک‌کننده‌های ثبت/کش/زمان اجرای ارائه‌دهندهٔ جست‌وجوی وب |
    | `plugin-sdk/embedding-providers` | انواع عمومی ارائه‌دهندهٔ embedding و کمک‌کننده‌های خواندن، شامل `EmbeddingProviderAdapter`، `getEmbeddingProvider(...)`، و `listEmbeddingProviders(...)`؛ Pluginها ارائه‌دهنده‌ها را از طریق `api.registerEmbeddingProvider(...)` ثبت می‌کنند تا مالکیت manifest اعمال شود |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی schema + عیب‌یابی DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | انواع snapshot مصرف ارائه‌دهنده، کمک‌کننده‌های مشترک واکشی مصرف، و واکشنده‌های ارائه‌دهنده مانند `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، انواع wrapper جریان، سازگاری فراخوانی ابزار متن ساده، و کمک‌کننده‌های wrapper مشترک Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | کمک‌کننده‌های عمومی و مشترک wrapper جریان ارائه‌دهنده شامل `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`، و ابزارهای جریان سازگار با Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، استخراج متن نتیجهٔ ابزار، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌کننده‌های patch پیکربندی پذیرش اولیه |
    | `plugin-sdk/global-singleton` | کمک‌کننده‌های singleton/map/cache محلی فرایند |
    | `plugin-sdk/group-activation` | کمک‌کننده‌های محدود حالت فعال‌سازی گروه و تجزیهٔ فرمان |
  </Accordion>

snapshotهای مصرف ارائه‌دهنده معمولاً یک یا چند `windows` سهمیه را گزارش می‌کنند که هرکدام
یک برچسب، درصد استفاده‌شده، و زمان بازنشانی اختیاری دارند. ارائه‌دهندگانی که به‌جای
پنجره‌های سهمیهٔ قابل بازنشانی، متن موجودی یا وضعیت حساب را ارائه می‌کنند باید
`summary` را همراه با آرایهٔ خالی `windows` برگردانند، نه اینکه درصدهای ساختگی بسازند.
OpenClaw آن متن خلاصه را در خروجی وضعیت نمایش می‌دهد؛ فقط وقتی از `error` استفاده کنید که
نقطهٔ پایانی مصرف ناموفق بوده یا هیچ دادهٔ مصرف قابل استفاده‌ای برنگردانده باشد.

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، کمک‌کننده‌های رجیستری فرمان شامل قالب‌بندی پویای منوی آرگومان، کمک‌کننده‌های مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌کننده‌های رفع تأییدکننده و احراز هویت اقدام در همان چت |
    | `plugin-sdk/approval-client-runtime` | کمک‌کننده‌های پروفایل/فیلتر تأیید اجرای بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌کنندهٔ مشترک رفع Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کننده‌های سبک بارگذاری آداپتور تأیید بومی برای entrypointهای داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌کننده‌های گسترده‌تر زمان اجرای handler تأیید؛ وقتی seamهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌کننده‌های هدف تأیید بومی، اتصال حساب، گیت مسیر، بازگشت ارسال، و سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-reaction-runtime` | bindingهای hardcoded واکنش تأیید، payloadهای prompt واکنش، ذخیره‌گاه‌های هدف واکنش، و خروجی سازگاری برای سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-reply-runtime` | کمک‌کننده‌های payload پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های payload تأیید exec/Plugin، کمک‌کننده‌های مسیریابی/زمان اجرای تأیید بومی، و کمک‌کننده‌های نمایش ساختاریافتهٔ تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌کننده‌های محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌کننده‌های محدود تست قرارداد کانال بدون barrel گستردهٔ تست |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی پویای منوی آرگومان، و کمک‌کننده‌های هدف نشست بومی |
    | `plugin-sdk/command-detection` | کمک‌کننده‌های مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | کمک‌کننده‌های نرمال‌سازی بدنهٔ فرمان و سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود گردآوری قرارداد secret برای سطوح secret کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌کننده‌های محدود `coerceSecretRef` و تایپ‌گذاری SecretRef برای تجزیهٔ قرارداد/p پیکربندی secret |
    | `plugin-sdk/secret-provider-integration` | قراردادهای فقط-نوع manifest یکپارچه‌سازی ارائه‌دهندهٔ SecretRef و preset برای Pluginهایی که presetهای ارائه‌دهندهٔ secret خارجی منتشر می‌کنند |
    | `plugin-sdk/security-runtime` | کمک‌کننده‌های مشترک اعتماد، گیت DM، فایل/مسیر محدود به ریشه شامل نوشتن فقط-ایجاد، جایگزینی اتمیک فایل همگام/ناهمگام، نوشتن‌های موقت sibling، بازگشت جابه‌جایی بین‌دستگاهی، کمک‌کننده‌های ذخیره‌گاه فایل خصوصی، محافظ‌های والد symlink، محتوای خارجی، redaction متن حساس، مقایسهٔ secret با زمان ثابت، و کمک‌کننده‌های گردآوری secret |
    | `plugin-sdk/ssrf-policy` | کمک‌کننده‌های allowlist میزبان و سیاست SSRF شبکهٔ خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌کننده‌های محدود pinned-dispatcher بدون سطح گستردهٔ زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، fetch محافظت‌شده با SSRF، خطای SSRF، و کمک‌کننده‌های سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌کننده‌های تجزیهٔ ورودی secret |
    | `plugin-sdk/webhook-ingress` | کمک‌کننده‌های درخواست/هدف Webhook و هم‌تافت‌سازی خام websocket/body |
    | `plugin-sdk/webhook-request-guards` | کمک‌کننده‌های اندازهٔ بدنهٔ درخواست/timeout |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | ابزارهای کمکی گسترده برای زمان اجرا/لاگ‌گیری/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | ابزارهای کمکی محدود برای env زمان اجرا، logger، timeout، retry و backoff |
    | `plugin-sdk/browser-config` | facade پیکربندی مرورگر پشتیبانی‌شده برای profile/defaults نرمال‌شده، پردازش URL مربوط به CDP، و ابزارهای کمکی احراز هویت کنترل مرورگر |
    | `plugin-sdk/agent-harness-task-runtime` | ابزارهای کمکی عمومی برای چرخه عمر task و تحویل تکمیل برای agentهای مبتنی بر harness که از محدوده task صادرشده توسط host استفاده می‌کنند |
    | `plugin-sdk/codex-mcp-projection` | ابزار کمکی رزروشده Codex بسته‌بندی‌شده برای فرافکنی پیکربندی server کاربر MCP به پیکربندی thread در Codex؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/codex-native-task-runtime` | ابزار کمکی خصوصی Codex بسته‌بندی‌شده برای اتصال mirror/runtime مربوط به task بومی؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/channel-runtime-context` | ابزارهای کمکی عمومی برای ثبت و جست‌وجوی context زمان اجرای کانال |
    | `plugin-sdk/matrix` | facade سازگاری Matrix منسوخ‌شده برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیما `plugin-sdk/run-command` را import کنند |
    | `plugin-sdk/mattermost` | facade سازگاری Mattermost منسوخ‌شده برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید زیرمسیرهای عمومی SDK را مستقیما import کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ابزارهای کمکی مشترک command/hook/http/interactive برای Plugin |
    | `plugin-sdk/hook-runtime` | ابزارهای کمکی مشترک برای pipeline مربوط به Webhook/hook داخلی |
    | `plugin-sdk/lazy-runtime` | ابزارهای کمکی import/binding تنبل زمان اجرا مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ابزارهای کمکی اجرای process |
    | `plugin-sdk/cli-runtime` | ابزارهای کمکی قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه command تنبل |
    | `plugin-sdk/qa-live-transport-scenarios` | شناسه‌های سناریوی QA مشترک برای انتقال live، ابزارهای کمکی پوشش baseline، و ابزار کمکی انتخاب سناریو |
    | `plugin-sdk/gateway-method-runtime` | ابزار کمکی رزروشده dispatch متد Gateway برای مسیرهای HTTP مربوط به Plugin که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، ابزار کمکی شروع کلاینت آماده event-loop، RPC مربوط به CLI برای Gateway، خطاهای پروتکل Gateway، تشخیص host اعلام‌شده LAN، و ابزارهای کمکی patch وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط نوعی برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و نوع‌های پیکربندی کانال/provider |
    | `plugin-sdk/plugin-config-runtime` | ابزارهای کمکی جست‌وجوی پیکربندی Plugin در زمان اجرا مانند `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ابزارهای کمکی تغییر تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | رشته‌های راهنمای metadata مشترک برای تحویل message-tool |
    | `plugin-sdk/runtime-config-snapshot` | ابزارهای کمکی snapshot پیکربندی process فعلی مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و setterهای snapshot آزمایشی |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح command در Telegram و بررسی‌های تکرار/تداخل، حتی وقتی سطح contract بسته‌بندی‌شده Telegram در دسترس نیست |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink برای ارجاع فایل بدون barrel گسترده متن |
    | `plugin-sdk/approval-reaction-runtime` | bindingهای hardcoded مربوط به reaction تأیید، payloadهای prompt برای reaction، storeهای target مربوط به reaction، و export سازگاری برای سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-runtime` | ابزارهای کمکی تأیید exec/Plugin، سازنده‌های capability تأیید، ابزارهای کمکی auth/profile، ابزارهای کمکی routing/runtime بومی، و قالب‌بندی مسیر نمایش ساخت‌یافته تأیید |
    | `plugin-sdk/reply-runtime` | ابزارهای کمکی مشترک زمان اجرا برای ورودی/پاسخ، chunking، dispatch، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | ابزارهای کمکی محدود برای dispatch/finalize پاسخ و برچسب conversation |
    | `plugin-sdk/reply-history` | ابزارهای کمکی مشترک تاریخچه پاسخ در پنجره کوتاه. کد جدید message-turn باید از `createChannelHistoryWindow` استفاده کند؛ ابزارهای کمکی map سطح پایین فقط به‌عنوان exportهای سازگاری منسوخ باقی می‌مانند |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ابزارهای کمکی محدود chunking متن/Markdown |
    | `plugin-sdk/session-store-runtime` | ابزارهای کمکی workflow مربوط به session (`getSessionEntry`، `listSessionEntries`، `patchSessionEntry`، `upsertSessionEntry`)، خواندن‌های محدود متن transcript اخیر user/assistant بر اساس هویت session، ابزارهای کمکی legacy برای مسیر store مربوط به session و session-key، خواندن‌های updated-at، و ابزارهای کمکی سازگاری فقط در مرحله transition برای whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | هویت transcript، ابزارهای کمکی target/read/write محدوده‌دار، انتشار update، قفل‌های write، و کلیدهای hit حافظه transcript |
    | `plugin-sdk/sqlite-runtime` | ابزارهای کمکی متمرکز SQLite برای schema عامل، مسیر، و تراکنش در زمان اجرای first-party |
    | `plugin-sdk/cron-store-runtime` | ابزارهای کمکی مسیر/load/save برای store مربوط به Cron |
    | `plugin-sdk/state-paths` | ابزارهای کمکی مسیر دایرکتوری State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | نوع‌های keyed-state مربوط به SQLite جانبی Plugin به‌همراه راه‌اندازی متمرکز pragma اتصال و نگهداری WAL برای پایگاه‌داده‌های متعلق به Plugin |
    | `plugin-sdk/routing` | ابزارهای کمکی route/session-key/account binding مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ابزارهای کمکی مشترک خلاصه وضعیت کانال/account، defaultهای runtime-state، و ابزارهای کمکی metadata مربوط به issue |
    | `plugin-sdk/target-resolver-runtime` | ابزارهای کمکی مشترک target resolver |
    | `plugin-sdk/string-normalization-runtime` | ابزارهای کمکی نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های مشابه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده command زمان‌دار با نتیجه‌های stdout/stderr نرمال‌شده |
    | `plugin-sdk/param-readers` | readerهای مشترک param برای tool/CLI |
    | `plugin-sdk/tool-plugin` | تعریف یک Plugin ساده typed برای agent-tool و ارائه metadata ایستا برای تولید manifest |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌شده از objectهای نتیجه tool |
    | `plugin-sdk/tool-send` | استخراج fieldهای canonical target ارسال از args مربوط به tool |
    | `plugin-sdk/sandbox` | نوع‌های backend مربوط به sandbox و ابزارهای کمکی command برای SSH/OpenShell، شامل preflight command اجرای fail-fast |
    | `plugin-sdk/temp-path` | ابزارهای کمکی مشترک مسیر temp-download و workspaceهای temp امن خصوصی |
    | `plugin-sdk/logging-core` | ابزارهای کمکی logger و redaction برای subsystem |
    | `plugin-sdk/markdown-table-runtime` | ابزارهای کمکی حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | ابزارهای کمکی override مدل/session مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ابزارهای کمکی resolution پیکربندی provider مربوط به Talk |
    | `plugin-sdk/json-store` | ابزارهای کمکی کوچک read/write وضعیت JSON |
    | `plugin-sdk/json-unsafe-integers` | ابزارهای کمکی parsing JSON که literalهای عدد صحیح ناامن را به‌صورت رشته حفظ می‌کنند |
    | `plugin-sdk/file-lock` | ابزارهای کمکی file-lock قابل re-entrant |
    | `plugin-sdk/persistent-dedupe` | ابزارهای کمکی cache dedupe مبتنی بر دیسک |
    | `plugin-sdk/acp-runtime` | ابزارهای کمکی runtime/session و reply-dispatch مربوط به ACP |
    | `plugin-sdk/acp-runtime-backend` | ابزارهای کمکی سبک برای ثبت backend و reply-dispatch مربوط به ACP برای Pluginهایی که هنگام startup load می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | resolution فقط‌خواندنی binding مربوط به ACP بدون importهای startup چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود schema پیکربندی زمان اجرای agent |
    | `plugin-sdk/boolean-param` | reader آزاد param بولی |
    | `plugin-sdk/dangerous-name-runtime` | ابزارهای کمکی resolution برای matching نام خطرناک |
    | `plugin-sdk/device-bootstrap` | ابزارهای کمکی bootstrap دستگاه و token جفت‌سازی |
    | `plugin-sdk/extension-shared` | primitiveهای کمکی مشترک برای passive-channel، status و ambient proxy |
    | `plugin-sdk/models-provider-runtime` | ابزارهای کمکی پاسخ command/provider برای `/models` |
    | `plugin-sdk/skill-commands-runtime` | ابزارهای کمکی فهرست‌کردن command مربوط به Skill |
    | `plugin-sdk/native-command-registry` | ابزارهای کمکی registry/build/serialize برای command بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی trusted-Plugin برای harnessهای سطح پایین agent: نوع‌های harness، ابزارهای کمکی steer/abort برای active-run، ابزارهای کمکی bridge ابزار OpenClaw، ابزارهای کمکی policy ابزار runtime-plan، طبقه‌بندی outcome نهایی، ابزارهای کمکی قالب‌بندی/جزئیات progress ابزار، و utilityهای نتیجه attempt |
    | `plugin-sdk/provider-zai-endpoint` | facade منسوخ‌شده تشخیص endpoint متعلق به provider مربوط به Z.AI؛ از API عمومی Plugin مربوط به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | ابزار کمکی async lock محلی process برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | ابزار کمکی telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | ابزار کمکی concurrency محدود برای task async |
    | `plugin-sdk/dedupe-runtime` | ابزارهای کمکی cache dedupe در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | ابزار کمکی drain برای pending-delivery خروجی |
    | `plugin-sdk/file-access-runtime` | ابزارهای کمکی امن مسیر local-file و media-source |
    | `plugin-sdk/heartbeat-runtime` | ابزارهای کمکی wake، event و visibility مربوط به Heartbeat |
    | `plugin-sdk/number-runtime` | ابزار کمکی coercion عددی |
    | `plugin-sdk/secure-random-runtime` | ابزارهای کمکی token/UUID امن |
    | `plugin-sdk/system-event-runtime` | ابزارهای کمکی صف event سیستم |
    | `plugin-sdk/transport-ready-runtime` | ابزار کمکی انتظار برای readiness انتقال |
    | `plugin-sdk/exec-approvals-runtime` | ابزارهای کمکی فایل policy تأیید exec بدون barrel گسترده infra-runtime |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ‌شده؛ از زیرمسیرهای متمرکز زمان اجرا در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | ابزارهای کمکی کوچک cache محدود |
    | `plugin-sdk/diagnostic-runtime` | ابزارهای کمکی flag، event و trace-context تشخیصی |
    | `plugin-sdk/error-runtime` | ابزارهای کمکی graph خطا، قالب‌بندی، طبقه‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch پوشش‌داده‌شده، proxy، گزینه EnvHttpProxyAgent، و ابزارهای کمکی lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ابزارهای کمکی پاک‌سازی URL داده image inline و sniff کردن signature بدون سطح گسترده runtime رسانه |
    | `plugin-sdk/response-limit-runtime` | reader محدود response-body بدون سطح گسترده runtime رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت binding مربوط به conversation فعلی بدون routing پیکربندی‌شده binding یا storeهای pairing |
    | `plugin-sdk/session-store-runtime` | ابزارهای کمکی session-store بدون importهای گسترده write/maintenance پیکربندی |
    | `plugin-sdk/sqlite-runtime` | ابزارهای کمکی متمرکز SQLite برای schema عامل، مسیر، و تراکنش بدون کنترل‌های چرخه عمر پایگاه‌داده |
    | `plugin-sdk/context-visibility-runtime` | resolution دیدپذیری context و filtering context تکمیلی بدون importهای گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | ابزارهای کمکی محدود برای coercion و نرمال‌سازی record/string primitive بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | ابزارهای کمکی نرمال‌سازی hostname و host مربوط به SCP |
    | `plugin-sdk/retry-runtime` | ابزارهای کمکی پیکربندی retry و runner مربوط به retry |
    | `plugin-sdk/agent-runtime` | ابزارهای کمکی dir/identity/workspace برای agent، شامل `resolveAgentDir`، `resolveDefaultAgentDir` و export سازگاری منسوخ‌شده `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | query/dedup دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌ابزارهای مشترک دریافت/تبدیل/ذخیره‌سازی رسانه شامل `saveRemoteMedia`، `saveResponseMedia`، `readRemoteMediaBuffer` و `fetchRemoteMedia` منسوخ‌شده؛ وقتی یک URL باید به رسانه OpenClaw تبدیل شود، پیش از خواندن بافرها، کمک‌ابزارهای ذخیره‌سازی را ترجیح دهید |
    | `plugin-sdk/media-mime` | نرمال‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME و کمک‌ابزارهای نوع رسانه |
    | `plugin-sdk/media-store` | کمک‌ابزارهای محدود ذخیره‌سازی رسانه مانند `saveMediaBuffer` و `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | کمک‌ابزارهای مشترک جابه‌جایی در خطای تولید رسانه، انتخاب نامزد و پیام‌رسانی مدلِ ناموجود |
    | `plugin-sdk/media-understanding` | نوع‌های ارائه‌دهنده فهم رسانه به‌همراه خروجی‌های کمک‌ابزارهای تصویر/صوت/استخراج ساختاریافته رو به ارائه‌دهنده |
    | `plugin-sdk/text-chunking` | کمک‌ابزارهای تکه‌بندی/رندر متن و markdown، تبدیل جدول markdown، حذف برچسب‌های دستوری و ابزارهای متن ایمن |
    | `plugin-sdk/text-chunking` | کمک‌ابزار تکه‌بندی متن خروجی |
    | `plugin-sdk/speech` | نوع‌های ارائه‌دهنده گفتار به‌همراه خروجی‌های دستورالعمل، رجیستری، اعتبارسنجی، سازنده TTS سازگار با OpenAI و کمک‌ابزارهای گفتار رو به ارائه‌دهنده |
    | `plugin-sdk/speech-core` | نوع‌های مشترک ارائه‌دهنده گفتار، رجیستری، دستورالعمل، نرمال‌سازی و خروجی‌های کمک‌ابزار گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های ارائه‌دهنده رونویسی بلادرنگ، کمک‌ابزارهای رجیستری و کمک‌ابزار مشترک نشست WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | کمک‌ابزار راه‌اندازی اولیه پروفایل بلادرنگ برای تزریق محدود زمینه `IDENTITY.md`، `USER.md` و `SOUL.md` |
    | `plugin-sdk/realtime-voice` | نوع‌های ارائه‌دهنده صدای بلادرنگ، کمک‌ابزارهای رجیستری و کمک‌ابزارهای مشترک رفتار صدای بلادرنگ، شامل ردیابی فعالیت خروجی |
    | `plugin-sdk/image-generation` | نوع‌های ارائه‌دهنده تولید تصویر به‌همراه کمک‌ابزارهای دارایی تصویر/داده URL و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌های مشترک تولید تصویر، جابه‌جایی در خطا، احراز هویت و کمک‌ابزارهای رجیستری |
    | `plugin-sdk/music-generation` | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، کمک‌ابزارهای جابه‌جایی در خطا، جست‌وجوی ارائه‌دهنده و تجزیه ارجاع مدل |
    | `plugin-sdk/video-generation` | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدئو، کمک‌ابزارهای جابه‌جایی در خطا، جست‌وجوی ارائه‌دهنده و تجزیه ارجاع مدل |
    | `plugin-sdk/transcripts` | نوع‌های مشترک ارائه‌دهنده منبع رونوشت‌ها، کمک‌ابزارهای رجیستری، توصیفگرهای نشست و فراداده گفتار |
    | `plugin-sdk/webhook-targets` | رجیستری مقصد Webhook و کمک‌ابزارهای نصب مسیر |
    | `plugin-sdk/webhook-path` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | کمک‌ابزارهای مشترک بارگذاری رسانه دور/محلی |
    | `plugin-sdk/zod` | بازصادرات سازگاری منسوخ‌شده؛ `zod` را مستقیما از `zod` وارد کنید |
    | `plugin-sdk/testing` | barrel سازگاری منسوخ‌شده محلیِ مخزن برای آزمایش‌های قدیمی OpenClaw. آزمایش‌های جدید مخزن باید به‌جای آن زیرمسیرهای محلی متمرکز مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env` یا `plugin-sdk/test-fixtures` را وارد کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌ابزار حداقلی محلیِ مخزن `createTestPluginApi` برای آزمایش‌های واحد ثبت مستقیم Plugin بدون وارد کردن پل‌های کمک‌آزمایشی مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime محلیِ مخزن برای آزمایش‌های احراز هویت، تحویل، fallback، tool-hook، prompt-overlay، schema و projection رونوشت |
    | `plugin-sdk/channel-test-helpers` | کمک‌ابزارهای آزمایشی کانال‌محور محلیِ مخزن برای قراردادهای generic actions/setup/status، assertionهای directory، چرخه عمر startup حساب، send-config threading، runtime mockها، status issueها، تحویل outbound و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک محلیِ مخزن برای موردهای خطای target-resolution در آزمایش‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | کمک‌ابزارهای قرارداد محلیِ مخزن برای package، registration، public artifact، direct import، runtime API و import side-effect در Plugin |
    | `plugin-sdk/provider-test-contracts` | کمک‌ابزارهای قرارداد محلیِ مخزن برای runtime ارائه‌دهنده، احراز هویت، discovery، onboard، catalog، wizard، قابلیت رسانه، policy بازپخش، realtime STT live-audio، web-search/fetch و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/auth اختیاری محلیِ مخزن برای Vitest در آزمایش‌های ارائه‌دهنده که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی محلیِ مخزن برای capture زمان اجرای CLI، زمینه sandbox، skill writer، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin بسته‌بندی‌شده، terminal-text، chunking، auth-token و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌ابزارهای mock متمرکز برای builtinهای Node، محلیِ مخزن، برای استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌ابزار memory-core بسته‌بندی‌شده برای کمک‌ابزارهای manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای نمایه/جست‌وجوی حافظه |
    | `plugin-sdk/memory-core-host-embedding-registry` | کمک‌ابزارهای سبک رجیستری ارائه‌دهنده embedding حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های موتور بنیاد میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی رجیستری، ارائه‌دهنده محلی و کمک‌ابزارهای عمومی batch/remote. `registerMemoryEmbeddingProvider` روی این سطح منسوخ شده است؛ برای ارائه‌دهندگان جدید از API عمومی ارائه‌دهنده embedding استفاده کنید. |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌ابزارهای چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | کمک‌ابزارهای پرس‌وجوی میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | کمک‌ابزارهای secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | کمک‌ابزارهای وضعیت میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌ابزارهای زمان اجرای CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌ابزارهای زمان اجرای core میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌ابزارهای file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار خنثی نسبت به vendor برای کمک‌ابزارهای زمان اجرای core میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار خنثی نسبت به vendor برای کمک‌ابزارهای journal رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | کمک‌ابزارهای مشترک managed-markdown برای Pluginهای نزدیک به حافظه |
    | `plugin-sdk/memory-host-search` | facade زمان اجرای active memory برای دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای کمک‌ابزار بسته‌بندی‌شده رزروشده">
    زیرمسیرهای SDK کمک‌ابزار بسته‌بندی‌شده رزروشده، سطح‌های محدود و مختص مالک برای
    کد Plugin بسته‌بندی‌شده هستند. آن‌ها در فهرست SDK ردیابی می‌شوند تا buildهای
    package و aliasing قطعی بمانند، اما APIهای عمومی
    تألیف Plugin نیستند. قراردادهای میزبان قابل استفاده مجدد جدید باید از زیرمسیرهای عمومی SDK
    مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime` استفاده کنند.

    | زیرمسیر | مالک و هدف |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | کمک‌ابزار Plugin بسته‌بندی‌شده Codex برای project کردن پیکربندی MCP server کاربر به پیکربندی thread در Codex app-server |
    | `plugin-sdk/codex-native-task-runtime` | کمک‌ابزار Plugin بسته‌بندی‌شده Codex برای mirror کردن subagentهای native در Codex app-server به وضعیت task در OpenClaw |

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
