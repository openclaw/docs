---
read_when:
    - انتخاب زیرمسیر مناسب `plugin-sdk` برای وارد کردن Plugin
    - ممیزی زیرمسیرهای Plugin همراه و سطوح کمکی
summary: 'کاتالوگ زیرمسیر Plugin SDK: کدام importها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای SDK Plugin
x-i18n:
    generated_at: "2026-06-27T18:32:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای عمومی محدود در
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیرمسیرهای رایج را بر اساس
هدف دسته‌بندی و فهرست می‌کند. موجودی تولیدشده نقطه ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های بسته، زیرمجموعه عمومی
پس از کم‌کردن زیرمسیرهای آزمون/داخلی مختص مخزن هستند که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌دارندگان می‌توانند
تعداد خروجی‌های عمومی را با `pnpm plugin-sdk:surface` و زیرمسیرهای کمکی رزروشده فعال
را با `pnpm plugins:boundary-report:summary` ممیزی کنند؛ خروجی‌های کمکی رزروشده
استفاده‌نشده به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی سازگاری راکد،
گزارش CI را ناموفق می‌کنند.

برای راهنمای نویسندگی Plugin، [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) را ببینید.

## ورود Plugin

| زیرمسیر                        | خروجی‌های کلیدی                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | کمک‌کننده‌های مورد مهاجرت مانند `createMigrationItem`، ثابت‌های دلیل، نشانگرهای وضعیت مورد، کمک‌کننده‌های ویرایش محرمانه، و `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | کمک‌کننده‌های مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                              |
| `plugin-sdk/health`            | ثبت، تشخیص، تعمیر، انتخاب، شدت، و انواع یافته بررسی سلامت Doctor برای مصرف‌کنندگان سلامت همراه                                               |

### سازگاری منسوخ‌شده و کمک‌کننده‌های آزمون

زیرمسیرهای منسوخ‌شده برای Pluginهای قدیمی‌تر همچنان صادر می‌مانند، اما کد جدید باید از
زیرمسیرهای متمرکز SDK در پایین استفاده کند. فهرست نگه‌داری‌شده
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` است؛ CI واردکردن‌های تولیدی همراه
از آن را رد می‌کند. barrelهای گسترده مانند `compat`، `config-types`،
`infra-runtime`، `text-runtime`، و `zod` فقط برای سازگاری هستند. `zod` را
مستقیما از `zod` وارد کنید.

زیرمسیرهای کمک‌کننده آزمون مبتنی بر Vitest در OpenClaw فقط مختص مخزن هستند و دیگر
خروجی بسته نیستند: `agent-runtime-test-contracts`،
`channel-contract-testing`، `channel-target-testing`، `channel-test-helpers`،
`plugin-test-api`، `plugin-test-contracts`، `plugin-test-runtime`،
`provider-http-test-mocks`، `provider-test-contracts`، `test-env`،
`test-fixtures`، `test-node-mocks`، و `testing`.

### زیرمسیرهای کمکی رزروشده Pluginهای همراه

این زیرمسیرها سطح‌های سازگاری مالکیت‌شده توسط Plugin برای Plugin همراه مالک خود هستند،
نه APIهای عمومی SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. واردکردن‌های extension بین‌مالکی با
محافظ‌های قرارداد بسته مسدود می‌شوند.

<AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی طرح‌واره Zod ریشه `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | راهنمای اعتبارسنجی JSON Schema کش‌شده برای طرح‌واره‌های متعلق به Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌همراه `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | راهنماهای مشترک جادوگر راه‌اندازی، مترجم راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | راهنماهای پیکربندی/دروازه اقدام چندحسابی، راهنماهای fallback حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، راهنماهای نرمال‌سازی شناسه حساب |
    | `plugin-sdk/account-resolution` | راهنماهای جست‌وجوی حساب + fallback پیش‌فرض |
    | `plugin-sdk/account-helpers` | راهنماهای محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | راهنماهای تجزیه فهرست مجاز گروه دسترسی و عیب‌یابی‌های گروهی سانسورشده |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | مولفه‌های اولیه مشترک طرح‌واره پیکربندی کانال، به‌همراه سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | طرح‌واره‌های پیکربندی کانال بسته‌بندی‌شده OpenClaw فقط برای Pluginهای بسته‌بندی‌شده تحت نگهداری |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. شناسه‌های متعارف کانال گفت‌وگوی بسته‌بندی‌شده/رسمی، به‌همراه برچسب‌ها/نام‌های مستعار قالب‌بند برای Pluginهایی که باید متن دارای پیشوند envelope را بدون سخت‌کدن جدول خودشان تشخیص دهند. |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای طرح‌واره‌های پیکربندی کانال بسته‌بندی‌شده |
    | `plugin-sdk/telegram-command-config` | راهنماهای نرمال‌سازی/اعتبارسنجی فرمان سفارشی Telegram با fallback قرارداد بسته‌بندی‌شده |
    | `plugin-sdk/command-gating` | راهنماهای محدود دروازه مجوزدهی فرمان |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری منسوخ برای ورود سطح‌پایین کانال. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | تحلیل‌گر آزمایشی runtime ورود سطح‌بالای کانال و سازنده‌های واقعیت مسیر برای مسیرهای دریافت کانال مهاجرت‌داده‌شده. این را به مونتاژ فهرست‌های مجاز مؤثر، فهرست‌های مجاز فرمان، و projectionهای قدیمی در هر Plugin ترجیح دهید. به [API ورود کانال](/fa/plugins/sdk-channel-ingress) مراجعه کنید. |
    | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-outbound` | قراردادهای چرخه عمر پیام، به‌همراه گزینه‌های pipeline پاسخ، رسیدها، پیش‌نمایش/streaming زنده، راهنماهای چرخه عمر، هویت خروجی، برنامه‌ریزی payload، ارسال‌های پایدار، و راهنماهای زمینه ارسال پیام. به [API خروجی کانال](/fa/plugins/sdk-channel-outbound) مراجعه کنید. |
    | `plugin-sdk/channel-message` | نام مستعار سازگاری منسوخ برای `plugin-sdk/channel-outbound`، به‌همراه نماهای قدیمی ارسال پاسخ. |
    | `plugin-sdk/channel-message-runtime` | نام مستعار سازگاری منسوخ برای `plugin-sdk/channel-outbound`، به‌همراه نماهای قدیمی ارسال پاسخ. |
    | `plugin-sdk/inbound-envelope` | راهنماهای مشترک مسیر ورودی + سازنده envelope |
    | `plugin-sdk/inbound-reply-dispatch` | نمای سازگاری منسوخ. برای runnerهای ورودی و predicateهای ارسال از `plugin-sdk/channel-inbound` و برای راهنماهای تحویل پیام از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/messaging-targets` | نام مستعار منسوخ تجزیه هدف؛ از `plugin-sdk/channel-targets` استفاده کنید |
    | `plugin-sdk/outbound-media` | راهنماهای مشترک بارگذاری رسانه خروجی و وضعیت hosted-media |
    | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | راهنماهای محدود نرمال‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | راهنماهای چرخه عمر اتصال thread و آداپتور |
    | `plugin-sdk/agent-media-payload` | سازنده payload رسانه agent قدیمی |
    | `plugin-sdk/conversation-runtime` | راهنماهای اتصال گفت‌وگو/thread، جفت‌سازی، و اتصال پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | راهنمای snapshot پیکربندی runtime |
    | `plugin-sdk/runtime-group-policy` | راهنماهای تحلیل policy گروه در runtime |
    | `plugin-sdk/channel-status` | راهنماهای مشترک snapshot/خلاصه وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | مولفه‌های اولیه محدود طرح‌واره پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | راهنماهای مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های prelude مشترک Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | راهنماهای ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | راهنماهای مشترک تصمیم‌گیری دسترسی گروه |
    | `plugin-sdk/direct-dm`، `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ. از `plugin-sdk/channel-inbound` استفاده کنید. |
    | `plugin-sdk/direct-dm-guard-policy` | راهنماهای محدود policy نگهبان direct-DM پیش از رمزنگاری |
    | `plugin-sdk/discord` | نمای سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک ردیابی‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ تحلیل حساب Telegram برای سازگاری مالک ردیابی‌شده؛ Pluginهای جدید باید از راهنماهای runtime تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ Zalo Personal برای بسته‌های Lark/Zalo منتشرشده که هنوز مجوزدهی فرمان فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | ارائه معنایی پیام، تحویل، و راهنماهای قدیمی پاسخ تعاملی. به [ارائه پیام](/fa/plugins/message-presentation) مراجعه کنید |
    | `plugin-sdk/channel-inbound` | راهنماهای مشترک ورودی برای طبقه‌بندی رویداد، ساخت زمینه، قالب‌بندی، ریشه‌ها، debounce، تطبیق mention، policy ذکر، و ثبت لاگ ورودی |
    | `plugin-sdk/channel-inbound-debounce` | راهنماهای محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | راهنماهای محدود policy ذکر، نشانگر ذکر، و متن ذکر بدون سطح گسترده‌تر runtime ورودی |
    | `plugin-sdk/channel-envelope`، `plugin-sdk/channel-inbound-roots`، `plugin-sdk/channel-location`، `plugin-sdk/channel-logging` | نماهای سازگاری منسوخ. از `plugin-sdk/channel-inbound` یا `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-pairing-paths` | نمای سازگاری منسوخ. از `plugin-sdk/channel-pairing` استفاده کنید. |
    | `plugin-sdk/channel-reply-options-runtime` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | راهنماهای اقدام پیام کانال، به‌همراه راهنماهای طرح‌واره native منسوخ که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | نرمال‌سازی مشترک مسیر، تحلیل هدف مبتنی بر parser، stringification شناسه thread، کلیدهای dedupe/compact مسیر، نوع‌های هدف تجزیه‌شده، و راهنماهای مقایسه مسیر/هدف |
    | `plugin-sdk/channel-targets` | راهنماهای تجزیه هدف؛ فراخوان‌های مقایسه مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | راهنماهای محدود قرارداد secret مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، و نوع‌های هدف secret |
  </Accordion>

خانواده‌های منسوخ راهنماهای کانال فقط برای سازگاری با Pluginهای منتشرشده
در دسترس می‌مانند. برنامه حذف این است: آن‌ها را تا پایان پنجره مهاجرت
Plugin خارجی نگه دارید، Pluginهای repo/بسته‌بندی‌شده را روی `channel-inbound` و
`channel-outbound` نگه دارید، سپس زیرمسیرهای سازگاری را در پاک‌سازی major بعدی
SDK حذف کنید. این درباره خانواده‌های قدیمی پیام/runtime کانال، streaming
کانال، دسترسی direct-DM، شاخه‌های راهنمای ورودی، reply-options،
و pairing-path اعمال می‌شود.

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade پشتیبانی‌شده ارائه‌دهنده LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | facade پشتیبانی‌شده زمان اجرای LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و helperهای مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | helperهای منتخب راه‌اندازی ارائه‌دهنده محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | helperهای متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های watchdog |
    | `plugin-sdk/provider-auth-runtime` | helperهای حل API-key در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-oauth-runtime` | نوع‌های عمومی callback ارائه‌دهنده OAuth، رندر صفحه callback، helperهای PKCE/state، تجزیه ورودی authorization، helperهای انقضای token، و helperهای abort |
    | `plugin-sdk/provider-auth-api-key` | helperهای onboarding/نوشتن profile برای API-key مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | helperهای جست‌وجوی env-var احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helperهای واردسازی احراز هویت OpenAI Codex، خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک replay-policy، helperهای endpoint ارائه‌دهنده، و helperهای مشترک نرمال‌سازی model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | helperهای کاتالوگ زنده مدل ارائه‌دهنده برای کشف محافظت‌شده سبک `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, فیلتر کردن model-id، cache با TTL، و fallback ایستا |
    | `plugin-sdk/provider-catalog-runtime` | hook زمان اجرای تکمیل کاتالوگ ارائه‌دهنده و seamهای رجیستری plugin-provider برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | helperهای عمومی قابلیت HTTP/endpoint ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و helperهای فرم multipart رونویسی صوتی |
    | `plugin-sdk/provider-web-fetch-contract` | helperهای محدود قرارداد پیکربندی/انتخاب web-fetch مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | helperهای ثبت/cache ارائه‌دهنده web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | helperهای محدود پیکربندی/اعتبارنامه web-search برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | helperهای محدود قرارداد پیکربندی/اعتبارنامه web-search مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و setter/getterهای اعتبارنامه scoped |
    | `plugin-sdk/provider-web-search` | helperهای ثبت/cache/زمان اجرای ارائه‌دهنده web-search |
    | `plugin-sdk/embedding-providers` | نوع‌های عمومی ارائه‌دهنده embedding و helperهای خواندن، شامل `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, و `listEmbeddingProviders(...)`؛ Pluginها ارائه‌دهنده‌ها را از طریق `api.registerEmbeddingProvider(...)` ثبت می‌کنند تا مالکیت manifest اعمال شود |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی schema + diagnostics برای DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | نوع‌های snapshot مصرف ارائه‌دهنده، helperهای مشترک دریافت مصرف، و fetcherهای ارائه‌دهنده مانند `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، نوع‌های wrapper جریان، سازگاری فراخوانی ابزار plain-text، و helperهای مشترک wrapper برای Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | helperهای عمومی مشترک wrapper جریان ارائه‌دهنده شامل `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`، و ابزارهای جریان سازگار با Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | helperهای transport بومی ارائه‌دهنده مانند fetch محافظت‌شده، تبدیل‌های پیام transport، و جریان‌های رویداد transport قابل نوشتن |
    | `plugin-sdk/provider-onboard` | helperهای patch پیکربندی onboarding |
    | `plugin-sdk/global-singleton` | helperهای singleton/map/cache محلی فرایند |
    | `plugin-sdk/group-activation` | helperهای محدود حالت فعال‌سازی گروه و تجزیه command |
  </Accordion>

snapshotهای مصرف ارائه‌دهنده معمولاً یک یا چند `windows` سهمیه را گزارش می‌کنند که هرکدام
یک label، درصد مصرف‌شده، و زمان بازنشانی اختیاری دارند. ارائه‌دهندگانی که به‌جای پنجره‌های سهمیه قابل بازنشانی، متن موجودی یا
وضعیت حساب را ارائه می‌کنند باید
`summary` را همراه با آرایه خالی `windows` برگردانند، نه اینکه درصدهای ساختگی بسازند.
OpenClaw آن متن summary را در خروجی وضعیت نمایش می‌دهد؛ از `error` فقط زمانی استفاده کنید که
endpoint مصرف شکست خورده باشد یا هیچ داده مصرف قابل استفاده‌ای برنگردانده باشد.

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، helperهای رجیستری command شامل قالب‌بندی منوی argument پویا، helperهای authorization فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام command/help مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | helperهای حل approver و action-auth در همان چت |
    | `plugin-sdk/approval-client-runtime` | helperهای profile/filter تأیید exec بومی |
    | `plugin-sdk/approval-delivery-runtime` | adapterهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | helper مشترک حل Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | helperهای سبک بارگذاری adapter تأیید بومی برای entrypointهای داغ channel |
    | `plugin-sdk/approval-handler-runtime` | helperهای گسترده‌تر زمان اجرای handler تأیید؛ وقتی seamهای محدودتر adapter/gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | helperهای هدف تأیید بومی، اتصال حساب، route-gate، fallback بازارسال، و سرکوب prompt بومی exec محلی |
    | `plugin-sdk/approval-reaction-runtime` | bindingهای hardcoded واکنش تأیید، payloadهای prompt واکنش، storeهای هدف واکنش، و خروجی سازگاری برای سرکوب prompt بومی exec محلی |
    | `plugin-sdk/approval-reply-runtime` | helperهای payload پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | helperهای payload تأیید exec/Plugin، helperهای routing/زمان اجرای تأیید بومی، و helperهای نمایش ساختاریافته تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | helperهای محدود reset برای dedupe پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | helperهای محدود آزمون قرارداد channel بدون barrel گسترده testing |
    | `plugin-sdk/command-auth-native` | احراز هویت command بومی، قالب‌بندی منوی argument پویا، و helperهای هدف نشست بومی |
    | `plugin-sdk/command-detection` | helperهای مشترک تشخیص command |
    | `plugin-sdk/command-primitives-runtime` | predicateهای سبک متن command برای مسیرهای داغ channel |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنه command و helperهای سطح command |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | helperهای محدود گردآوری قرارداد secret برای سطوح secret مربوط به channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | helperهای محدود `coerceSecretRef` و تایپ SecretRef برای تجزیه secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | قراردادهای manifest و preset یکپارچه‌سازی ارائه‌دهنده SecretRef فقط-نوع برای Pluginهایی که presetهای ارائه‌دهنده secret خارجی منتشر می‌کنند |
    | `plugin-sdk/security-runtime` | helperهای مشترک اعتماد، gate کردن DM، فایل/مسیر محدود به root شامل نوشتن‌های فقط-ایجاد، جایگزینی اتمیک فایل sync/async، نوشتن‌های temp sibling، fallback جابه‌جایی میان‌دستگاهی، helperهای file-store خصوصی، محافظ‌های parent symlink، محتوای خارجی، redaction متن حساس، مقایسه secret با زمان ثابت، و helperهای گردآوری secret |
    | `plugin-sdk/ssrf-policy` | helperهای allowlist میزبان و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | helperهای محدود pinned-dispatcher بدون سطح گسترده زمان اجرای infra |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، fetch محافظت‌شده با SSRF، خطای SSRF، و helperهای سیاست SSRF |
    | `plugin-sdk/secret-input` | helperهای تجزیه ورودی secret |
    | `plugin-sdk/webhook-ingress` | helperهای درخواست/هدف Webhook و تبدیل websocket/body خام |
    | `plugin-sdk/webhook-request-guards` | helperهای اندازه/timeout بدنه درخواست |
  </Accordion>

  <Accordion title="زیربرگ‌های زمان اجرا و ذخیره‌سازی">
    | زیربرگ | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌کننده‌های گسترده زمان اجرا/ثبت گزارش/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود محیط زمان اجرا، ثبت‌کننده گزارش، مهلت زمانی، تلاش دوباره، و عقب‌نشینی |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای پروفایل/پیش‌فرض‌های نرمال‌شده، تجزیه URL مربوط به CDP، و کمک‌کننده‌های احراز هویت کنترل مرورگر |
    | `plugin-sdk/agent-harness-task-runtime` | کمک‌کننده‌های عمومی چرخه عمر کار و تحویل تکمیل برای عامل‌های متکی بر مهار که از دامنه کار صادرشده توسط میزبان استفاده می‌کنند |
    | `plugin-sdk/codex-mcp-projection` | کمک‌کننده بسته‌بندی‌شده رزرو‌شده Codex برای فرافکنی پیکربندی سرور MCP کاربر به پیکربندی رشته Codex؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/codex-native-task-runtime` | کمک‌کننده خصوصی بسته‌بندی‌شده Codex برای سیم‌کشی آینه/زمان اجرای کار بومی؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های عمومی ثبت و جست‌وجوی بافت زمان اجرای کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ‌شده Matrix برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیماً از `plugin-sdk/run-command` وارد کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ‌شده Mattermost برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیماً زیربرگ‌های عمومی SDK را وارد کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک فرمان/قلاب/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌کننده‌های مشترک خط لوله قلاب داخلی/Webhook |
    | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های واردسازی/اتصال تنبل زمان اجرا مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌کننده‌های اجرای فرایند |
    | `plugin-sdk/cli-runtime` | کمک‌کننده‌های CLI برای قالب‌بندی، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/qa-live-transport-scenarios` | شناسه‌های سناریوی تضمین کیفیت انتقال زنده مشترک، کمک‌کننده‌های پوشش مبنا، و کمک‌کننده انتخاب سناریو |
    | `plugin-sdk/gateway-method-runtime` | کمک‌کننده رزرو‌شده ارسال متد Gateway برای مسیرهای HTTP مربوط به Plugin که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌کننده شروع کلاینت آماده حلقه رویداد، RPC مربوط به CLI برای Gateway، خطاهای پروتکل Gateway، و کمک‌کننده‌های وصله وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط‌نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و نوع‌های پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌کننده‌های جست‌وجوی پیکربندی Plugin در زمان اجرا مانند `requireRuntimeConfig`، `resolvePluginConfigObject`، و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌کننده‌های جهش تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile`، و `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | رشته‌های راهنمای فراداده تحویل ابزار پیام مشترک |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده‌های عکس فوری پیکربندی فرایند فعلی مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot`، و تنظیم‌کننده‌های عکس فوری آزمون |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد بسته‌بندی‌شده Telegram در دسترس نباشد |
    | `plugin-sdk/text-autolink-runtime` | تشخیص پیوند خودکار ارجاع فایل بدون بشکه متنی گسترده |
    | `plugin-sdk/approval-reaction-runtime` | اتصال‌های سخت‌کدنویسی‌شده واکنش تأیید، بارهای درخواست واکنش، ذخیره‌های هدف واکنش، و خروجی سازگاری برای سرکوب درخواست اجرای بومی محلی |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های تأیید اجرا/Plugin، سازنده‌های قابلیت تأیید، کمک‌کننده‌های احراز هویت/پروفایل، کمک‌کننده‌های مسیریابی/زمان اجرای بومی، و قالب‌بندی مسیر نمایش تأیید ساختاریافته |
    | `plugin-sdk/reply-runtime` | کمک‌کننده‌های مشترک زمان اجرای ورودی/پاسخ، قطعه‌بندی، ارسال، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود ارسال/نهایی‌سازی پاسخ و برچسب گفت‌وگو |
    | `plugin-sdk/reply-history` | کمک‌کننده‌های مشترک تاریخچه پاسخ پنجره کوتاه. کد نوبت پیام جدید باید از `createChannelHistoryWindow` استفاده کند؛ کمک‌کننده‌های نقشه سطح پایین‌تر فقط به‌عنوان خروجی‌های سازگاری منسوخ‌شده باقی می‌مانند |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌کننده‌های محدود قطعه‌بندی متن/مارک‌داون |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های جریان کاری نشست (`getSessionEntry`، `listSessionEntries`، `patchSessionEntry`، `upsertSessionEntry`)، خواندن‌های محدود متن رونوشت اخیر کاربر/دستیار بر اساس هویت نشست، کمک‌کننده‌های مسیر ذخیره نشست قدیمی/کلید نشست، خواندن‌های به‌روزشده در، و کمک‌کننده‌های سازگاری فقط‌گذار برای کل ذخیره/مسیر فایل |
    | `plugin-sdk/session-transcript-runtime` | هویت رونوشت، کمک‌کننده‌های هدف/خواندن/نوشتن دامنه‌دار، انتشار به‌روزرسانی، قفل‌های نوشتن، و کلیدهای برخورد حافظه رونوشت |
    | `plugin-sdk/sqlite-runtime` | کمک‌کننده‌های متمرکز شمای عامل SQLite، مسیر، و تراکنش برای زمان اجرای دست‌اول |
    | `plugin-sdk/cron-store-runtime` | کمک‌کننده‌های مسیر/بارگذاری/ذخیره ذخیره Cron |
    | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر دایرکتوری وضعیت/OAuth |
    | `plugin-sdk/plugin-state-runtime` | نوع‌های وضعیت کلیددار SQLite کناربرنامه‌ای Plugin به‌علاوه راه‌اندازی متمرکز pragma اتصال و نگهداری WAL برای پایگاه‌های داده متعلق به Plugin |
    | `plugin-sdk/routing` | کمک‌کننده‌های مسیر/کلید نشست/اتصال حساب مانند `resolveAgentRoute`، `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌کننده‌های مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، و کمک‌کننده‌های فراداده مسئله |
    | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های مشترک حل‌کننده هدف |
    | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های نرمال‌سازی slug/رشته |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج stdout/stderr نرمال‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های پارامتر مشترک ابزار/CLI |
    | `plugin-sdk/tool-plugin` | تعریف یک Plugin ساده و نوع‌دار ابزار عامل و ارائه فراداده ایستا برای تولید manifest |
    | `plugin-sdk/tool-payload` | استخراج بارهای نرمال‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای هدف ارسال کانونی از آرگومان‌های ابزار |
    | `plugin-sdk/sandbox` | نوع‌های پشتیبان sandbox و کمک‌کننده‌های فرمان SSH/OpenShell، شامل پیش‌بررسی فرمان اجرای fail-fast |
    | `plugin-sdk/temp-path` | کمک‌کننده‌های مشترک مسیر دانلود موقت و فضای کار موقت امن خصوصی |
    | `plugin-sdk/logging-core` | ثبت‌کننده گزارش زیرسامانه و کمک‌کننده‌های حذف اطلاعات حساس |
    | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های حالت جدول مارک‌داون و تبدیل |
    | `plugin-sdk/model-session-runtime` | کمک‌کننده‌های بازنویسی مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌کننده‌های حل پیکربندی ارائه‌دهنده گفت‌وگو |
    | `plugin-sdk/json-store` | کمک‌کننده‌های کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/json-unsafe-integers` | کمک‌کننده‌های تجزیه JSON که لفظ‌های عدد صحیح ناامن را به‌صورت رشته حفظ می‌کنند |
    | `plugin-sdk/file-lock` | کمک‌کننده‌های قفل فایل بازدرون‌شونده |
    | `plugin-sdk/persistent-dedupe` | کمک‌کننده‌های کش حذف تکرار متکی بر دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌کننده‌های زمان اجرا/نشست ACP و ارسال پاسخ |
    | `plugin-sdk/acp-runtime-backend` | کمک‌کننده‌های سبک ثبت پشتیبان ACP و ارسال پاسخ برای Pluginهای بارگذاری‌شده هنگام راه‌اندازی |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل اتصال ACP فقط‌خواندنی بدون واردسازی‌های راه‌اندازی چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | ابتدایی‌های محدود شمای پیکربندی زمان اجرای عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر بولی سست |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌کننده‌های حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌کننده‌های راه‌اندازی دستگاه و توکن جفت‌سازی |
    | `plugin-sdk/extension-shared` | ابتدایی‌های مشترک کانال غیرفعال، وضعیت، و کمک‌کننده پراکسی محیطی |
    | `plugin-sdk/models-provider-runtime` | کمک‌کننده‌های پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌کننده‌های فهرست‌کردن فرمان Skills |
    | `plugin-sdk/native-command-registry` | کمک‌کننده‌های رجیستری/ساخت/سریال‌سازی فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورداعتماد برای مهارهای عامل سطح پایین: نوع‌های مهار، کمک‌کننده‌های هدایت/لغو اجرای فعال، کمک‌کننده‌های پل ابزار OpenClaw، کمک‌کننده‌های سیاست ابزار برنامه زمان اجرا، طبقه‌بندی نتیجه پایانه، کمک‌کننده‌های قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | نمای منسوخ‌شده تشخیص نقطه پایانی متعلق به ارائه‌دهنده Z.AI؛ از API عمومی Plugin مربوط به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | کمک‌کننده قفل ناهمگام محلی فرایند برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | کمک‌کننده دورسنجی فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌کننده هم‌روندی کار ناهمگام محدود |
    | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های کش حذف تکرار در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده تخلیه تحویل‌های معلق خروجی |
    | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های مسیر امن فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های بیدارسازی، رویداد، و مشاهده‌پذیری Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌کننده تبدیل عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌کننده‌های توکن/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | کمک‌کننده انتظار آمادگی انتقال |
    | `plugin-sdk/exec-approvals-runtime` | کمک‌کننده‌های فایل سیاست تأیید اجرا بدون بشکه گسترده infra-runtime |
    | `plugin-sdk/infra-runtime` | لایه سازگاری منسوخ‌شده؛ از زیربرگ‌های متمرکز زمان اجرا در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌کننده‌های کوچک کش محدود |
    | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های پرچم تشخیصی، رویداد، و بافت ردگیری |
    | `plugin-sdk/error-runtime` | کمک‌کننده‌های گراف خطا، قالب‌بندی، طبقه‌بندی خطای مشترک، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | کمک‌کننده‌های fetch پوشیده‌شده، پراکسی، گزینه EnvHttpProxyAgent، و جست‌وجوی سنجاق‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از dispatcher بدون واردسازی‌های پراکسی/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | کمک‌کننده‌های پاک‌سازی URL داده تصویر درون‌خطی و بوکشیدن امضا بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود بدنه پاسخ بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت اتصال گفت‌وگوی فعلی بدون مسیریابی اتصال پیکربندی‌شده یا ذخیره‌های جفت‌سازی |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های ذخیره نشست بدون واردسازی‌های گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/sqlite-runtime` | کمک‌کننده‌های متمرکز شمای عامل SQLite، مسیر، و تراکنش بدون کنترل‌های چرخه عمر پایگاه داده |
    | `plugin-sdk/context-visibility-runtime` | حل مشاهده‌پذیری بافت و پالایش بافت تکمیلی بدون واردسازی‌های گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌کننده‌های محدود تبدیل و نرمال‌سازی رکورد/رشته ابتدایی بدون واردسازی‌های مارک‌داون/ثبت گزارش |
    | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی نام میزبان و میزبان SCP |
    | `plugin-sdk/retry-runtime` | کمک‌کننده‌های پیکربندی تلاش دوباره و اجراکننده تلاش دوباره |
    | `plugin-sdk/agent-runtime` | کمک‌کننده‌های دایرکتوری/هویت/فضای کار عامل، شامل `resolveAgentDir`، `resolveDefaultAgentDir`، و خروجی سازگاری منسوخ‌شده `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | پرس‌وجو/حذف تکرار دایرکتوری متکی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمون">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | راهنماهای مشترک واکشی/تبدیل/ذخیره رسانه شامل `saveRemoteMedia`، `saveResponseMedia`، `readRemoteMediaBuffer` و `fetchRemoteMedia` منسوخ‌شده؛ وقتی یک URL باید به رسانه OpenClaw تبدیل شود، پیش از خواندن بافر، راهنماهای ذخیره‌سازی را ترجیح دهید |
    | `plugin-sdk/media-mime` | عادی‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME و راهنماهای نوع رسانه |
    | `plugin-sdk/media-store` | راهنماهای محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` و `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | راهنماهای مشترک جایگزینی در تولید رسانه، انتخاب نامزد، و پیام‌رسانی برای مدلِ موجودنبودن |
    | `plugin-sdk/media-understanding` | انواع ارائه‌دهنده درک رسانه به‌همراه خروجی‌های راهنمای تصویر/صدا/استخراج ساختاریافته برای ارائه‌دهنده‌ها |
    | `plugin-sdk/text-chunking` | راهنماهای قطعه‌بندی/رندر متن و مارک‌داون، تبدیل جدول مارک‌داون، حذف برچسب دستورالعمل، و ابزارهای متن ایمن |
    | `plugin-sdk/text-chunking` | راهنمای قطعه‌بندی متن خروجی |
    | `plugin-sdk/speech` | انواع ارائه‌دهنده گفتار به‌همراه خروجی‌های دستورالعمل، رجیستری، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و راهنماهای گفتار برای ارائه‌دهنده‌ها |
    | `plugin-sdk/speech-core` | انواع مشترک ارائه‌دهنده گفتار، رجیستری، دستورالعمل، عادی‌سازی، و خروجی‌های راهنمای گفتار |
    | `plugin-sdk/realtime-transcription` | انواع ارائه‌دهنده رونویسی بلادرنگ، راهنماهای رجیستری، و راهنمای مشترک نشست WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | راهنمای بوت‌استرپ پروفایل بلادرنگ برای تزریق زمینه محدود `IDENTITY.md`، `USER.md` و `SOUL.md` |
    | `plugin-sdk/realtime-voice` | انواع ارائه‌دهنده صدای بلادرنگ، راهنماهای رجیستری، و راهنماهای مشترک رفتار صدای بلادرنگ، از جمله رهگیری فعالیت خروجی |
    | `plugin-sdk/image-generation` | انواع ارائه‌دهنده تولید تصویر به‌همراه راهنماهای دارایی تصویر/URL داده و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | انواع مشترک تولید تصویر، جایگزینی، احراز هویت، و راهنماهای رجیستری |
    | `plugin-sdk/music-generation` | انواع ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
    | `plugin-sdk/music-generation-core` | انواع مشترک تولید موسیقی، راهنماهای جایگزینی، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
    | `plugin-sdk/video-generation` | انواع ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
    | `plugin-sdk/video-generation-core` | انواع مشترک تولید ویدئو، راهنماهای جایگزینی، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
    | `plugin-sdk/transcripts` | انواع مشترک ارائه‌دهنده منبع رونوشت‌ها، راهنماهای رجیستری، توصیفگرهای نشست، و فراداده گفتار |
    | `plugin-sdk/webhook-targets` | رجیستری مقصد Webhook و راهنماهای نصب مسیر |
    | `plugin-sdk/webhook-path` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | راهنماهای مشترک بارگذاری رسانه دوردست/محلی |
    | `plugin-sdk/zod` | بازصادرات سازگاری منسوخ‌شده؛ `zod` را مستقیم از `zod` وارد کنید |
    | `plugin-sdk/testing` | ماژول تجمیعی سازگاری منسوخ‌شده مختص مخزن برای آزمون‌های قدیمی OpenClaw. آزمون‌های جدید مخزن باید به‌جای آن زیرمسیرهای محلی متمرکزی مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env` یا `plugin-sdk/test-fixtures` را وارد کنند |
    | `plugin-sdk/plugin-test-api` | راهنمای حداقلی `createTestPluginApi` مختص مخزن برای آزمون‌های واحد ثبت مستقیم Plugin، بدون واردکردن پل‌های راهنمای آزمون مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | فیکسچرهای قرارداد آداپتور بومی agent-runtime مختص مخزن برای آزمون‌های احراز هویت، تحویل، جایگزینی، قلاب ابزار، هم‌پوشانی پرامپت، اسکیما، و تصویرسازی رونوشت |
    | `plugin-sdk/channel-test-helpers` | راهنماهای آزمون کانال‌محور مختص مخزن برای قراردادهای عمومی کنش/راه‌اندازی/وضعیت، گزاره‌های دایرکتوری، چرخه عمر شروع حساب، رشته‌سازی پیکربندی ارسال، ماک‌های زمان اجرا، مشکلات وضعیت، تحویل خروجی، و ثبت قلاب |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک موارد خطای رفع مقصد مختص مخزن برای آزمون‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | راهنماهای قرارداد مختص مخزن برای بسته Plugin، ثبت، آرتیفکت عمومی، واردسازی مستقیم، API زمان اجرا، و اثر جانبی واردسازی |
    | `plugin-sdk/provider-test-contracts` | راهنماهای قرارداد مختص مخزن برای زمان اجرای ارائه‌دهنده، احراز هویت، کشف، onboard، کاتالوگ، ویزارد، قابلیت رسانه، سیاست بازپخش، STT صدای زنده بلادرنگ، جست‌وجو/واکشی وب، و جریان |
    | `plugin-sdk/provider-http-test-mocks` | ماک‌های HTTP/احراز هویت اختیاری Vitest مختص مخزن برای آزمون‌های ارائه‌دهنده‌ای که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | فیکسچرهای عمومی مختص مخزن برای ضبط زمان اجرای CLI، زمینه sandbox، نویسنده skill، پیام agent، رویداد سیستم، بارگذاری دوباره ماژول، مسیر Plugin بسته‌بندی‌شده، متن ترمینال، قطعه‌بندی، توکن احراز هویت، و مورد تایپ‌شده |
    | `plugin-sdk/test-node-mocks` | راهنماهای متمرکز ماک داخلی Node مختص مخزن برای استفاده در کارخانه‌های Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح راهنمای memory-core بسته‌بندی‌شده برای راهنماهای مدیر/پیکربندی/فایل/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای فهرست/جست‌وجوی حافظه |
    | `plugin-sdk/memory-core-host-embedding-registry` | راهنماهای سبک رجیستری ارائه‌دهنده embedding حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های موتور بنیاد میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و راهنماهای عمومی دسته‌ای/دوردست. `registerMemoryEmbeddingProvider` در این سطح منسوخ شده است؛ برای ارائه‌دهنده‌های جدید از API عمومی ارائه‌دهنده embedding استفاده کنید. |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | راهنماهای چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | راهنماهای پرس‌وجوی میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | راهنماهای راز میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | راهنماهای وضعیت میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | راهنماهای زمان اجرای CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | راهنماهای زمان اجرای هسته میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | راهنماهای فایل/زمان اجرای میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار مستقل از فروشنده برای راهنماهای زمان اجرای هسته میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار مستقل از فروشنده برای راهنماهای ژورنال رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | راهنماهای مشترک مارک‌داون مدیریت‌شده برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | نمای زمان اجرای حافظه فعال برای دسترسی به مدیر جست‌وجو |
    | `plugin-sdk/memory-host-status` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای راهنمای بسته‌بندی‌شده رزروشده">
    زیرمسیرهای SDK راهنمای بسته‌بندی‌شده رزروشده، سطح‌های محدود و مالک‌محور برای
    کد Plugin بسته‌بندی‌شده هستند. آن‌ها در موجودی SDK رهگیری می‌شوند تا ساخت‌های
    بسته و نام‌گذاری‌های مستعار قطعی بمانند، اما APIهای عمومی برای ساخت Plugin
    نیستند. قراردادهای میزبان قابل‌استفاده مجدد جدید باید از زیرمسیرهای عمومی SDK
    مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime` استفاده کنند.

    | زیرمسیر | مالک و هدف |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | راهنمای Plugin بسته‌بندی‌شده Codex برای تصویرسازی پیکربندی سرور MCP کاربر در پیکربندی نخ app-server در Codex |
    | `plugin-sdk/codex-native-task-runtime` | راهنمای Plugin بسته‌بندی‌شده Codex برای بازتاب subagentهای بومی app-server در Codex به وضعیت وظیفه OpenClaw |

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
