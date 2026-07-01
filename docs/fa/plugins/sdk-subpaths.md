---
read_when:
    - انتخاب زیرمسیر درست plugin-sdk برای import در یک Plugin
    - ممیزی زیرمسیرهای Plugin بسته‌بندی‌شده و سطوح کمکی
summary: 'کاتالوگ زیرمسیرهای Plugin SDK: هر import کجا قرار دارد، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای SDK Plugin
x-i18n:
    generated_at: "2026-07-01T20:28:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای عمومی محدود در
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیرمسیرهای رایج را بر اساس
هدف دسته‌بندی و فهرست می‌کند. موجودی نقطه ورود تولیدشده برای کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های package زیرمجموعه عمومی هستند
پس از کم‌کردن زیرمسیرهای آزمون/داخلی مختص repo-local که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌دارندگان می‌توانند
تعداد خروجی‌های عمومی را با `pnpm plugin-sdk:surface` و زیرمسیرهای helper رزروشده فعال را
با `pnpm plugins:boundary-report:summary` ممیزی کنند؛ خروجی‌های helper رزروشده استفاده‌نشده
به‌جای ماندن در SDK عمومی به‌عنوان بدهی سازگاری غیرفعال، گزارش CI را ناموفق می‌کنند.

برای راهنمای نویسندگی Plugin، [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) را ببینید.

## ورود Plugin

| زیرمسیر                        | خروجی‌های کلیدی                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | helperهای مورد migration مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای وضعیت مورد، helperهای redaction، و `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | helperهای runtime migration مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                              |
| `plugin-sdk/health`            | ثبت health-check در Doctor، detection، repair، selection، severity، و نوع‌های finding برای مصرف‌کنندگان health بسته‌بندی‌شده                                               |

### helperهای سازگاری منسوخ و آزمون

زیرمسیرهای منسوخ برای Pluginهای قدیمی‌تر همچنان خروجی داده می‌شوند، اما کد جدید باید از
زیرمسیرهای متمرکز SDK در پایین استفاده کند. فهرست نگه‌داری‌شده
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` است؛ CI واردکردن‌های production بسته‌بندی‌شده
از آن را رد می‌کند. barrelهای گسترده مانند `compat`، `config-types`،
`infra-runtime`، `text-runtime`، و `zod` فقط برای سازگاری هستند. `zod` را
مستقیماً از `zod` وارد کنید.

زیرمسیرهای test-helper مبتنی بر Vitest در OpenClaw فقط repo-local هستند و دیگر
خروجی package نیستند: `agent-runtime-test-contracts`،
`channel-contract-testing`، `channel-target-testing`، `channel-test-helpers`،
`plugin-test-api`، `plugin-test-contracts`، `plugin-test-runtime`،
`provider-http-test-mocks`، `provider-test-contracts`، `test-env`،
`test-fixtures`، `test-node-mocks`، و `testing`.

### زیرمسیرهای helper رزروشده برای Pluginهای بسته‌بندی‌شده

این زیرمسیرها سطح‌های سازگاری تحت مالکیت Plugin برای Plugin بسته‌بندی‌شده مالک خود هستند،
نه APIهای عمومی SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. واردکردن‌های extension میان‌مالک با
محافظ‌های قرارداد package مسدود می‌شوند.

<AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی طرح‌واره Zod ریشه `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | راهنمای اعتبارسنجی JSON Schema کش‌شده برای طرح‌واره‌های متعلق به Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌همراه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | راهنماهای مشترک جادوگر راه‌اندازی، مترجم راه‌اندازی، اعلان‌های allowlist، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | راهنماهای پیکربندی چندحسابی/دروازه اقدام، راهنماهای بازگشت به حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، راهنماهای عادی‌سازی شناسه حساب |
    | `plugin-sdk/account-resolution` | راهنماهای جست‌وجوی حساب + بازگشت به پیش‌فرض |
    | `plugin-sdk/account-helpers` | راهنماهای محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | راهنماهای تجزیه allowlist گروه دسترسی و عیب‌یابی گروه با داده‌های پوشانده‌شده |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | سازه‌های اولیه طرح‌واره پیکربندی کانال مشترک، به‌همراه سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | طرح‌واره‌های پیکربندی کانال OpenClaw باندل‌شده فقط برای Pluginهای باندل‌شده نگه‌داری‌شده |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. شناسه‌های کانال گفت‌وگوی باندل‌شده/رسمی استاندارد، به‌همراه برچسب‌ها/نام‌های مستعار قالب‌بند برای Pluginهایی که باید متن دارای پیشوند پاکت را بدون سخت‌کدن جدول خودشان تشخیص دهند. |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای طرح‌واره‌های پیکربندی کانال باندل‌شده |
    | `plugin-sdk/telegram-command-config` | راهنماهای عادی‌سازی/اعتبارسنجی دستور سفارشی Telegram با بازگشت قرارداد باندل‌شده |
    | `plugin-sdk/command-gating` | راهنماهای محدود دروازه مجوزدهی دستور |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری ورودی کانال سطح پایین منسوخ. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | حل‌گر آزمایشی زمان اجرای ورودی کانال سطح بالا و سازنده‌های فکت مسیر برای مسیرهای دریافت کانال مهاجرت‌داده‌شده. این را به مونتاژ allowlistهای مؤثر، allowlistهای دستور، و پروجکشن‌های legacy در هر Plugin ترجیح دهید. [API ورودی کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-outbound` | قراردادهای چرخه عمر پیام، به‌همراه گزینه‌های خط لوله پاسخ، رسیدها، پیش‌نمایش/استریم زنده، راهنماهای چرخه عمر، هویت خروجی، برنامه‌ریزی payload، ارسال‌های بادوام، و راهنماهای زمینه ارسال پیام. [API خروجی کانال](/fa/plugins/sdk-channel-outbound) را ببینید. |
    | `plugin-sdk/channel-message` | نام مستعار سازگاری منسوخ برای `plugin-sdk/channel-outbound` به‌همراه نماهای legacy ارسال پاسخ. |
    | `plugin-sdk/channel-message-runtime` | نام مستعار سازگاری منسوخ برای `plugin-sdk/channel-outbound` به‌همراه نماهای legacy ارسال پاسخ. |
    | `plugin-sdk/inbound-envelope` | راهنماهای مشترک سازنده مسیر ورودی + پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | نمای سازگاری منسوخ. برای اجراکننده‌های ورودی و گزاره‌های ارسال از `plugin-sdk/channel-inbound`، و برای راهنماهای تحویل پیام از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/messaging-targets` | نام مستعار منسوخ تجزیه مقصد؛ از `plugin-sdk/channel-targets` استفاده کنید |
    | `plugin-sdk/outbound-media` | راهنماهای مشترک بارگذاری رسانه خروجی و وضعیت رسانه میزبانی‌شده |
    | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | راهنماهای محدود عادی‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | راهنماهای چرخه عمر و آداپتر اتصال رشته |
    | `plugin-sdk/agent-media-payload` | سازنده legacy payload رسانه عامل |
    | `plugin-sdk/conversation-runtime` | راهنماهای مکالمه/اتصال رشته، جفت‌سازی، و اتصال پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | راهنمای snapshot پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | راهنماهای حل سیاست گروه در زمان اجرا |
    | `plugin-sdk/channel-status` | راهنماهای مشترک snapshot/خلاصه وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | سازه‌های اولیه محدود طرح‌واره پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | راهنماهای مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک مقدمه Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | راهنماهای ویرایش/خواندن پیکربندی allowlist |
    | `plugin-sdk/group-access` | راهنماهای مشترک تصمیم‌گیری دسترسی گروهی |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ. از `plugin-sdk/channel-inbound` استفاده کنید. |
    | `plugin-sdk/direct-dm-guard-policy` | راهنماهای محدود سیاست نگهبان direct-DM پیش از رمزنگاری |
    | `plugin-sdk/discord` | نمای سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری رهگیری‌شده مالک؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ حل حساب Telegram برای سازگاری رهگیری‌شده مالک؛ Pluginهای جدید باید از راهنماهای زمان اجرای تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ Zalo Personal برای بسته‌های منتشرشده Lark/Zalo که هنوز مجوزدهی دستور فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | ارائه معنایی پیام، تحویل، و راهنماهای legacy پاسخ تعاملی. [ارائه پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | راهنماهای مشترک ورودی برای طبقه‌بندی رویداد، ساخت زمینه، قالب‌بندی، ریشه‌ها، debounce، تطبیق mention، سیاست mention، و لاگ‌گیری ورودی |
    | `plugin-sdk/channel-inbound-debounce` | راهنماهای محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | راهنماهای محدود سیاست mention، نشانگر mention، و متن mention بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | نماهای سازگاری منسوخ. از `plugin-sdk/channel-inbound` یا `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-pairing-paths` | نمای سازگاری منسوخ. از `plugin-sdk/channel-pairing` استفاده کنید. |
    | `plugin-sdk/channel-reply-options-runtime` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-send-result` | انواع نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | راهنماهای اقدام پیام کانال، به‌همراه راهنماهای طرح‌واره native منسوخ که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | عادی‌سازی مسیر مشترک، حل مقصد مبتنی بر parser، رشته‌سازی شناسه رشته، کلیدهای مسیر dedupe/compact، انواع مقصد تجزیه‌شده، و راهنماهای مقایسه مسیر/مقصد |
    | `plugin-sdk/channel-targets` | راهنماهای تجزیه مقصد؛ فراخوان‌های مقایسه مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | انواع قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | راهنماهای محدود قرارداد secret مانند `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، و انواع مقصد secret |
  </Accordion>

خانواده‌های راهنمای کانال منسوخ فقط برای سازگاری با Pluginهای منتشرشده
در دسترس می‌مانند. برنامه حذف این است: آن‌ها را در طول بازه مهاجرت Plugin
خارجی نگه دارید، Pluginهای repo/باندل‌شده را روی `channel-inbound` و
`channel-outbound` نگه دارید، سپس زیرمسیرهای سازگاری را در پاک‌سازی major
بعدی SDK حذف کنید. این شامل خانواده‌های قدیمی پیام/زمان اجرای کانال، استریم
کانال، دسترسی direct-DM، شاخه‌های راهنمای ورودی، گزینه‌های پاسخ،
و مسیرهای جفت‌سازی می‌شود.

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شده ارائه‌دهنده LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای پشتیبانی‌شده زمان اجرای LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌کننده‌های مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌کننده‌های گزینش‌شده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های ناظر |
    | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های رفع کلید API در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-oauth-runtime` | نوع‌های عمومی فراخوان بازگشتی OAuth ارائه‌دهنده، رندر صفحه فراخوان بازگشتی، کمک‌کننده‌های PKCE/وضعیت، تجزیه ورودی مجوزدهی، کمک‌کننده‌های انقضای توکن، و کمک‌کننده‌های لغو |
    | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های ورود اولیه/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, کمک‌کننده‌های درون‌ریزی احراز هویت OpenAI Codex، خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های نقطه پایانی ارائه‌دهنده، و کمک‌کننده‌های مشترک نرمال‌سازی شناسه مدل |
    | `plugin-sdk/provider-catalog-live-runtime` | کمک‌کننده‌های کاتالوگ زنده مدل ارائه‌دهنده برای کشف محافظت‌شده به سبک `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, پالایش شناسه مدل، کش TTL، و جایگزین ایستا |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای غنی‌سازی کاتالوگ ارائه‌دهنده و درزهای رجیستری Plugin-ارائه‌دهنده برای تست‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌کننده‌های عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌کننده‌های فرم چندبخشی رونویسی صوتی |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/گزینش واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های ثبت/کش ارائه‌دهنده واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه محدود |
    | `plugin-sdk/provider-web-search` | کمک‌کننده‌های ثبت/کش/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
    | `plugin-sdk/embedding-providers` | نوع‌های عمومی ارائه‌دهنده embedding و کمک‌کننده‌های خواندن، از جمله `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, و `listEmbeddingProviders(...)`؛ Pluginها ارائه‌دهندگان را از طریق `api.registerEmbeddingProvider(...)` ثبت می‌کنند تا مالکیت manifest اعمال شود |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, و پاک‌سازی schema + عیب‌یابی DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | نوع‌های snapshot مصرف ارائه‌دهنده، کمک‌کننده‌های مشترک واکشی مصرف، و واکش‌گرهای ارائه‌دهنده مانند `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, نوع‌های wrapper جریان، سازگاری فراخوان ابزار متن ساده، و کمک‌کننده‌های مشترک wrapper برای Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | کمک‌کننده‌های عمومی مشترک wrapper جریان ارائه‌دهنده شامل `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, و ابزارهای جریان سازگار با Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌کننده‌های patch پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | کمک‌کننده‌های singleton/map/cache محلی فرایند |
    | `plugin-sdk/group-activation` | کمک‌کننده‌های محدود حالت فعال‌سازی گروه و تجزیه فرمان |
  </Accordion>

snapshotهای مصرف ارائه‌دهنده معمولا یک یا چند `windows` سهمیه را گزارش می‌کنند که هرکدام
یک برچسب، درصد استفاده‌شده، و زمان بازنشانی اختیاری دارند. ارائه‌دهندگانی که به‌جای پنجره‌های
سهمیه قابل بازنشانی، متن موجودی یا وضعیت حساب را آشکار می‌کنند، باید
`summary` را با آرایه خالی `windows` برگردانند، نه اینکه درصدهای ساختگی تولید کنند.
OpenClaw آن متن خلاصه را در خروجی وضعیت نمایش می‌دهد؛ فقط وقتی از `error` استفاده کنید که
نقطه پایانی مصرف شکست خورده باشد یا هیچ داده مصرف قابل استفاده‌ای برنگردانده باشد.

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, کمک‌کننده‌های رجیستری فرمان شامل قالب‌بندی پویای منوی آرگومان، کمک‌کننده‌های مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | رفع تأییدکننده و کمک‌کننده‌های احراز هویت کنش در همان چت |
    | `plugin-sdk/approval-client-runtime` | کمک‌کننده‌های پروفایل/فیلتر تأیید اجرای بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌کننده مشترک رفع Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کننده‌های سبک بارگذاری آداپتور تأیید بومی برای نقاط ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌کننده‌های گسترده‌تر زمان اجرای کنترل‌کننده تأیید؛ وقتی درزهای محدودتر آداپتور/Gateway کافی هستند، همان‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | هدف تأیید بومی، اتصال حساب، گیت مسیر، جایگزین بازارسال، و کمک‌کننده‌های سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-reaction-runtime` | اتصال‌های hardcoded واکنش تأیید، payloadهای prompt واکنش، storeهای هدف واکنش، و خروجی سازگاری برای سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-reply-runtime` | کمک‌کننده‌های payload پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های payload تأیید exec/Plugin، کمک‌کننده‌های مسیریابی/زمان اجرای تأیید بومی، و کمک‌کننده‌های نمایش ساخت‌یافته تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌کننده‌های محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌کننده‌های محدود تست قرارداد کانال بدون barrel گسترده تست |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی پویای منوی آرگومان، و کمک‌کننده‌های هدف جلسه بومی |
    | `plugin-sdk/command-detection` | کمک‌کننده‌های مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | predicateهای سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنه فرمان و کمک‌کننده‌های سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | کمک‌کننده‌های lazy جریان ورود احراز هویت ارائه‌دهنده برای کانال خصوصی و جفت‌سازی کد دستگاه Web UI |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود گردآوری قرارداد secret برای سطوح secret کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌کننده‌های محدود `coerceSecretRef` و نوع‌گذاری SecretRef برای تجزیه قرارداد secret/پیکربندی |
    | `plugin-sdk/secret-provider-integration` | قراردادهای manifest و preset یکپارچه‌سازی ارائه‌دهنده SecretRef فقط-نوع برای Pluginهایی که presetهای ارائه‌دهنده secret خارجی منتشر می‌کنند |
    | `plugin-sdk/security-runtime` | کمک‌کننده‌های مشترک اعتماد، گیت‌گذاری DM، فایل/مسیر محدود به root شامل نوشتن‌های فقط-ایجاد، جایگزینی اتمیک فایل همگام/ناهمگام، نوشتن‌های موقت sibling، جایگزین جابه‌جایی بین‌دستگاهی، کمک‌کننده‌های file-store خصوصی، محافظ‌های parent symlink، محتوای خارجی، حذف متن حساس، مقایسه secret با زمان ثابت، و کمک‌کننده‌های گردآوری secret |
    | `plugin-sdk/ssrf-policy` | کمک‌کننده‌های فهرست مجاز host و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌کننده‌های محدود pinned-dispatcher بدون سطح گسترده زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، واکشی محافظت‌شده با SSRF، خطای SSRF، و کمک‌کننده‌های سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌کننده‌های تجزیه ورودی secret |
    | `plugin-sdk/webhook-ingress` | کمک‌کننده‌های درخواست/هدف Webhook و تبدیل raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | کمک‌کننده‌های اندازه/timeout بدنه درخواست |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیربخش | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | توابع کمکی گسترده برای runtime، ثبت لاگ، پشتیبان‌گیری، و نصب Plugin |
    | `plugin-sdk/runtime-env` | توابع کمکی محدود برای محیط runtime، logger، timeout، retry، و backoff |
    | `plugin-sdk/browser-config` | facade پیکربندی مرورگر پشتیبانی‌شده برای profile/defaults نرمال‌سازی‌شده، تجزیه URL مربوط به CDP، و توابع کمکی auth برای کنترل مرورگر |
    | `plugin-sdk/agent-harness-task-runtime` | توابع کمکی عمومی برای چرخه عمر task و تحویل تکمیل برای agentهای متکی به harness که از محدوده task صادرشده توسط host استفاده می‌کنند |
    | `plugin-sdk/codex-mcp-projection` | تابع کمکی bundled و رزروشده Codex برای projection پیکربندی MCP server کاربر به پیکربندی thread در Codex؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/codex-native-task-runtime` | تابع کمکی private و bundled Codex برای native task mirror/runtime wiring؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/channel-runtime-context` | توابع کمکی عمومی برای ثبت و جست‌وجوی context مربوط به runtime کانال |
    | `plugin-sdk/matrix` | facade سازگاری منسوخ‌شده Matrix برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیماً `plugin-sdk/run-command` را import کنند |
    | `plugin-sdk/mattermost` | facade سازگاری منسوخ‌شده Mattermost برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیماً زیربخش‌های عمومی SDK را import کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | توابع کمکی مشترک برای command/hook/http/interactive مربوط به Plugin |
    | `plugin-sdk/hook-runtime` | توابع کمکی مشترک برای pipeline مربوط به webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | توابع کمکی import/binding تنبل runtime مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | توابع کمکی اجرای process |
    | `plugin-sdk/cli-runtime` | توابع کمکی CLI برای قالب‌بندی، wait، version، argument-invocation، و گروه command تنبل |
    | `plugin-sdk/qa-live-transport-scenarios` | شناسه‌های سناریوی QA برای transport زنده، توابع کمکی baseline coverage، و تابع کمکی انتخاب سناریو |
    | `plugin-sdk/gateway-method-runtime` | تابع کمکی رزروشده Gateway برای dispatch متد در routeهای HTTP مربوط به Plugin که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند |
    | `plugin-sdk/gateway-runtime` | Gateway client، تابع کمکی شروع client آماده برای event-loop، RPC مربوط به CLI در Gateway، خطاهای پروتکل Gateway، حل advertised LAN host، و توابع کمکی patch وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط-نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و نوع‌های پیکربندی کانال/provider |
    | `plugin-sdk/plugin-config-runtime` | توابع کمکی جست‌وجوی plugin-config در runtime مانند `requireRuntimeConfig`، `resolvePluginConfigObject`، و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | توابع کمکی جهش transactional پیکربندی مانند `mutateConfigFile`، `replaceConfigFile`، و `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | رشته‌های hint مشترک برای metadata تحویل message-tool |
    | `plugin-sdk/runtime-config-snapshot` | توابع کمکی snapshot پیکربندی process فعلی مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot`، و setterهای snapshot تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح command در Telegram و بررسی‌های duplicate/conflict، حتی وقتی سطح contract مربوط به Telegram bundled در دسترس نیست |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink ارجاع فایل بدون barrel گسترده متن |
    | `plugin-sdk/approval-reaction-runtime` | bindingهای hardcoded واکنش approval، payloadهای prompt واکنش، storeهای target واکنش، و export سازگاری برای سرکوب prompt اجرای native محلی |
    | `plugin-sdk/approval-runtime` | توابع کمکی approval برای exec/Plugin، سازنده‌های approval-capability، توابع کمکی auth/profile، توابع کمکی native routing/runtime، و قالب‌بندی ساختاریافته مسیر نمایش approval |
    | `plugin-sdk/reply-runtime` | توابع کمکی مشترک inbound/reply runtime، chunking، dispatch، Heartbeat، reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | توابع کمکی محدود برای dispatch/finalize پاسخ و label مکالمه |
    | `plugin-sdk/reply-history` | توابع کمکی مشترک reply-history با پنجره کوتاه. کد جدید message-turn باید از `createChannelHistoryWindow` استفاده کند؛ توابع کمکی map سطح پایین‌تر فقط به‌عنوان exportهای سازگاری منسوخ‌شده باقی می‌مانند |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | توابع کمکی محدود برای chunking متن/markdown |
    | `plugin-sdk/session-store-runtime` | توابع کمکی workflow نشست (`getSessionEntry`، `listSessionEntries`، `patchSessionEntry`، `upsertSessionEntry`)، خواندن‌های محدود متن transcript اخیر کاربر/assistant بر اساس identity نشست، توابع کمکی legacy برای مسیر session store/session-key، خواندن updated-at، و توابع کمکی سازگاری whole-store/file-path فقط برای transition |
    | `plugin-sdk/session-transcript-runtime` | identity مربوط به transcript، توابع کمکی target/read/write دارای scope، انتشار update، write lockها، و کلیدهای hit حافظه transcript |
    | `plugin-sdk/sqlite-runtime` | توابع کمکی متمرکز SQLite برای agent-schema، مسیر، و transaction در runtimeهای first-party |
    | `plugin-sdk/cron-store-runtime` | توابع کمکی مسیر/load/save برای store مربوط به Cron |
    | `plugin-sdk/state-paths` | توابع کمکی مسیر dir مربوط به State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | نوع‌های keyed-state مبتنی بر SQLite sidecar برای Plugin به‌همراه pragma متمرکز connection و راه‌اندازی نگهداری WAL برای databaseهای متعلق به Plugin |
    | `plugin-sdk/routing` | توابع کمکی route/session-key/account binding مانند `resolveAgentRoute`، `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | توابع کمکی مشترک خلاصه وضعیت کانال/account، defaultهای runtime-state، و توابع کمکی metadata مربوط به issue |
    | `plugin-sdk/target-resolver-runtime` | توابع کمکی مشترک target resolver |
    | `plugin-sdk/string-normalization-runtime` | توابع کمکی نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | runner اجرای command زمان‌دار با نتایج stdout/stderr نرمال‌سازی‌شده |
    | `plugin-sdk/param-readers` | readerهای رایج پارامتر tool/CLI |
    | `plugin-sdk/tool-plugin` | تعریف یک Plugin ساده و typed برای agent-tool و ارائه metadata ایستا برای تولید manifest |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌سازی‌شده از objectهای نتیجه tool |
    | `plugin-sdk/tool-send` | استخراج فیلدهای canonical target ارسال از args مربوط به tool |
    | `plugin-sdk/sandbox` | نوع‌های backend مربوط به sandbox و توابع کمکی command برای SSH/OpenShell، شامل preflight اجرای command با fail-fast |
    | `plugin-sdk/temp-path` | توابع کمکی مشترک مسیر temp-download و workspaceهای temp امن private |
    | `plugin-sdk/logging-core` | logger زیرسامانه و توابع کمکی redaction |
    | `plugin-sdk/markdown-table-runtime` | توابع کمکی mode و conversion جدول Markdown |
    | `plugin-sdk/model-session-runtime` | توابع کمکی override مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | توابع کمکی حل پیکربندی talk provider |
    | `plugin-sdk/json-store` | توابع کمکی کوچک برای خواندن/نوشتن state در JSON |
    | `plugin-sdk/json-unsafe-integers` | توابع کمکی parsing JSON که literalهای عدد صحیح unsafe را به‌صورت string حفظ می‌کنند |
    | `plugin-sdk/file-lock` | توابع کمکی file-lock بازدرآیند |
    | `plugin-sdk/persistent-dedupe` | توابع کمکی cache حذف تکرار متکی به disk |
    | `plugin-sdk/acp-runtime` | توابع کمکی ACP runtime/session و reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | توابع کمکی سبک برای ثبت backend مربوط به ACP و reply-dispatch برای Pluginهایی که در startup بارگذاری می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل read-only مربوط به ACP binding بدون importهای startup چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود schema پیکربندی runtime مربوط به agent |
    | `plugin-sdk/boolean-param` | reader پارامتر boolean با تفسیر loose |
    | `plugin-sdk/dangerous-name-runtime` | توابع کمکی حل matching برای dangerous-name |
    | `plugin-sdk/device-bootstrap` | توابع کمکی bootstrap دستگاه و pairing token |
    | `plugin-sdk/extension-shared` | primitiveهای مشترک برای passive-channel، status، و ambient proxy helper |
    | `plugin-sdk/models-provider-runtime` | توابع کمکی پاسخ برای command/provider مربوط به `/models` |
    | `plugin-sdk/skill-commands-runtime` | توابع کمکی فهرست‌کردن command مربوط به Skill |
    | `plugin-sdk/native-command-registry` | توابع کمکی registry/build/serialize برای commandهای native |
    | `plugin-sdk/agent-harness` | سطح آزمایشی trusted-plugin برای harnessهای سطح پایین agent: نوع‌های harness، توابع کمکی steer/abort برای active-run، توابع کمکی bridge مربوط به tool در OpenClaw، توابع کمکی policy مربوط به tool در runtime-plan، طبقه‌بندی terminal outcome، توابع کمکی قالب‌بندی/جزئیات progress مربوط به tool، و ابزارهای attempt result |
    | `plugin-sdk/provider-zai-endpoint` | facade منسوخ‌شده تشخیص endpoint متعلق به provider برای Z.AI؛ از API عمومی Plugin مربوط به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | تابع کمکی async lock محلی به process برای فایل‌های کوچک state در runtime |
    | `plugin-sdk/channel-activity-runtime` | تابع کمکی telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | تابع کمکی concurrency محدود برای taskهای async |
    | `plugin-sdk/dedupe-runtime` | توابع کمکی cache حذف تکرار در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | تابع کمکی drain برای pending-delivery خروجی |
    | `plugin-sdk/file-access-runtime` | توابع کمکی امن برای مسیر local-file و media-source |
    | `plugin-sdk/heartbeat-runtime` | توابع کمکی wake، event، و visibility مربوط به Heartbeat |
    | `plugin-sdk/number-runtime` | تابع کمکی coercion عددی |
    | `plugin-sdk/secure-random-runtime` | توابع کمکی token/UUID امن |
    | `plugin-sdk/system-event-runtime` | توابع کمکی queue رویداد system |
    | `plugin-sdk/transport-ready-runtime` | تابع کمکی انتظار برای آمادگی transport |
    | `plugin-sdk/exec-approvals-runtime` | توابع کمکی فایل policy مربوط به exec approval بدون barrel گسترده infra-runtime |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ‌شده؛ از زیربخش‌های متمرکز runtime بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | توابع کمکی کوچک برای cache محدود |
    | `plugin-sdk/diagnostic-runtime` | توابع کمکی flag، event، و trace-context مربوط به diagnostic |
    | `plugin-sdk/error-runtime` | توابع کمکی graph خطا، قالب‌بندی، طبقه‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch wrapperشده، proxy، گزینه EnvHttpProxyAgent، و توابع کمکی pinned lookup |
    | `plugin-sdk/runtime-fetch` | fetch مربوط به runtime با آگاهی از dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | sanitizer برای URL داده inline image و توابع کمکی signature sniffing بدون سطح گسترده media runtime |
    | `plugin-sdk/response-limit-runtime` | reader محدود response-body بدون سطح گسترده media runtime |
    | `plugin-sdk/session-binding-runtime` | state فعلی binding مکالمه بدون routing پیکربندی‌شده binding یا storeهای pairing |
    | `plugin-sdk/session-store-runtime` | توابع کمکی session-store بدون importهای گسترده برای نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/sqlite-runtime` | توابع کمکی متمرکز SQLite برای agent-schema، مسیر، و transaction بدون کنترل‌های چرخه عمر database |
    | `plugin-sdk/context-visibility-runtime` | حل visibility مربوط به context و filtering محتوای supplemental بدون importهای گسترده config/security |
    | `plugin-sdk/string-coerce-runtime` | توابع کمکی محدود برای coercion و نرمال‌سازی record/string primitive بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | توابع کمکی نرمال‌سازی hostname و SCP host |
    | `plugin-sdk/retry-runtime` | توابع کمکی پیکربندی retry و runner مربوط به retry |
    | `plugin-sdk/agent-runtime` | توابع کمکی dir/identity/workspace مربوط به agent، شامل `resolveAgentDir`، `resolveDefaultAgentDir`، و export سازگاری منسوخ‌شده `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | query/dedup directory مبتنی بر config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمون">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | راهنماهای مشترک واکشی/تبدیل/ذخیره رسانه، شامل `saveRemoteMedia`، `saveResponseMedia`، `readRemoteMediaBuffer` و `fetchRemoteMedia` منسوخ؛ وقتی یک URL باید به رسانه OpenClaw تبدیل شود، پیش از خواندن buffer، راهنماهای store را ترجیح دهید |
    | `plugin-sdk/media-mime` | عادی‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME، و راهنماهای نوع رسانه |
    | `plugin-sdk/media-store` | راهنماهای محدود store رسانه مانند `saveMediaBuffer` و `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | راهنماهای مشترک failover تولید رسانه، انتخاب candidate، و پیام‌رسانی مدلِ گمشده |
    | `plugin-sdk/media-understanding` | نوع‌های provider درک رسانه به‌همراه خروجی‌های راهنمای image/audio/structured-extraction رو به provider |
    | `plugin-sdk/text-chunking` | راهنماهای chunk/render متن و markdown، تبدیل جدول markdown، حذف directive-tag، و ابزارهای متن امن |
    | `plugin-sdk/text-chunking` | راهنمای chunk کردن متن خروجی |
    | `plugin-sdk/speech` | نوع‌های provider گفتار به‌همراه خروجی‌های directive، registry، validation، سازنده TTS سازگار با OpenAI، و راهنماهای گفتار رو به provider |
    | `plugin-sdk/speech-core` | نوع‌های مشترک provider گفتار، registry، directive، normalization، و خروجی‌های راهنمای گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های provider رونویسی بلادرنگ، راهنماهای registry، و راهنمای مشترک session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | راهنمای bootstrap پروفایل بلادرنگ برای تزریق محدود context در `IDENTITY.md`، `USER.md` و `SOUL.md` |
    | `plugin-sdk/realtime-voice` | نوع‌های provider صدای بلادرنگ، راهنماهای registry، و راهنماهای مشترک رفتار صدای بلادرنگ، شامل ردیابی activity خروجی |
    | `plugin-sdk/image-generation` | نوع‌های provider تولید تصویر به‌همراه راهنماهای URL داده/asset تصویر و سازنده provider تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌های مشترک تولید تصویر، failover، auth، و راهنماهای registry |
    | `plugin-sdk/music-generation` | نوع‌های provider/request/result تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، راهنماهای failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/video-generation` | نوع‌های provider/request/result تولید ویدئو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدئو، راهنماهای failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/transcripts` | نوع‌های مشترک provider منبع transcripts، راهنماهای registry، توصیف‌گرهای session، و فراداده utterance |
    | `plugin-sdk/webhook-targets` | راهنماهای registry هدف Webhook و نصب route |
    | `plugin-sdk/webhook-path` | alias سازگاری منسوخ؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | راهنماهای مشترک بارگذاری رسانه remote/local |
    | `plugin-sdk/zod` | re-export سازگاری منسوخ؛ `zod` را مستقیماً از `zod` import کنید |
    | `plugin-sdk/testing` | barrel سازگاری منسوخ محلیِ مخزن برای آزمون‌های قدیمی OpenClaw. آزمون‌های جدید مخزن باید به‌جای آن زیرمسیرهای محلی متمرکز آزمون مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env` یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | راهنمای حداقلی `createTestPluginApi` محلیِ مخزن برای آزمون‌های واحد ثبت مستقیم Plugin، بدون import کردن bridgeهای راهنمای آزمون مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای contract adapter بومی agent-runtime محلیِ مخزن برای آزمون‌های auth، delivery، fallback، tool-hook، prompt-overlay، schema، و projection transcript |
    | `plugin-sdk/channel-test-helpers` | راهنماهای آزمون channel-محور محلیِ مخزن برای contractهای generic actions/setup/status، assertionهای directory، چرخه عمر account startup، threading پیکربندی ارسال، mockهای runtime، issueهای status، delivery خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک caseهای خطای target-resolution محلیِ مخزن برای آزمون‌های channel |
    | `plugin-sdk/plugin-test-contracts` | راهنماهای contract محلیِ مخزن برای بسته Plugin، registration، artifact عمومی، import مستقیم، runtime API، و side-effectهای import |
    | `plugin-sdk/provider-test-contracts` | راهنماهای contract محلیِ مخزن برای runtime provider، auth، discovery، onboard، catalog، wizard، قابلیت رسانه، policy replay، صوت زنده realtime STT، web-search/fetch، و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای opt-in مربوط به Vitest HTTP/auth محلیِ مخزن برای آزمون‌های provider که `plugin-sdk/provider-http` را exercise می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای generic محلیِ مخزن برای capture runtime CLI، sandbox context، skill writer، agent-message، system-event، reload ماژول، مسیر Plugin bundled، terminal-text، chunking، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | راهنماهای mock متمرکز Node builtin محلیِ مخزن برای استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای Memory">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح راهنمای memory-core همراه‌شده برای راهنماهای manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime برای index/search در Memory |
    | `plugin-sdk/memory-core-host-embedding-registry` | راهنماهای سبک registry provider embedding در Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های engine foundation میزبان Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | contractهای embedding میزبان Memory، دسترسی registry، provider محلی، و راهنماهای generic batch/remote. `registerMemoryEmbeddingProvider` روی این سطح منسوخ است؛ برای providerهای جدید از API عمومی provider embedding استفاده کنید. |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های engine QMD میزبان Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های engine storage میزبان Memory |
    | `plugin-sdk/memory-core-host-multimodal` | راهنماهای multimodal میزبان Memory |
    | `plugin-sdk/memory-core-host-query` | راهنماهای query میزبان Memory |
    | `plugin-sdk/memory-core-host-secret` | راهنماهای secret میزبان Memory |
    | `plugin-sdk/memory-core-host-events` | alias سازگاری منسوخ؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | راهنماهای status میزبان Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | راهنماهای runtime CLI میزبان Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | راهنماهای runtime core میزبان Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | راهنماهای file/runtime میزبان Memory |
    | `plugin-sdk/memory-host-core` | alias بی‌طرف نسبت به vendor برای راهنماهای runtime core میزبان Memory |
    | `plugin-sdk/memory-host-events` | alias بی‌طرف نسبت به vendor برای راهنماهای event journal میزبان Memory |
    | `plugin-sdk/memory-host-files` | alias سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | راهنماهای مشترک managed-markdown برای Pluginهای مجاور Memory |
    | `plugin-sdk/memory-host-search` | facade runtime برای Active Memory جهت دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | alias سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشده bundled-helper">
    زیرمسیرهای SDK رزروشده bundled-helper سطح‌های محدود و مالک‌محور برای
    کد Pluginهای همراه‌شده هستند. آن‌ها در موجودی SDK ردیابی می‌شوند تا buildهای
    بسته و aliasing قطعی بمانند، اما APIهای عمومی برای نوشتن Plugin
    نیستند. contractهای میزبان قابل‌استفاده‌مجدد جدید باید از زیرمسیرهای generic SDK
    مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime` استفاده کنند.

    | زیرمسیر | مالک و هدف |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | راهنمای Plugin همراه‌شده Codex برای project کردن پیکربندی server MCP کاربر به پیکربندی thread در app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | راهنمای Plugin همراه‌شده Codex برای mirror کردن subagentهای native در app-server Codex به state تسک OpenClaw |

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
