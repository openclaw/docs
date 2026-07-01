---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای import یک Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و سطوح کمکی
summary: 'فهرست زیرمسیرهای SDK Plugin: اینکه کدام واردسازی‌ها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:23:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ‏Plugin به‌صورت مجموعه‌ای از زیرمسیرهای عمومی محدود در
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیرمسیرهای رایج را بر اساس
هدف فهرست می‌کند. فهرست تولیدشدهٔ نقطهٔ ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای بسته، زیرمجموعهٔ عمومی
پس از کم‌کردن زیرمسیرهای تست/داخلیِ محلیِ مخزن هستند که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌دارندگان می‌توانند
تعداد exportهای عمومی را با `pnpm plugin-sdk:surface` و زیرمسیرهای فعالِ
کمکیِ رزروشده را با `pnpm plugins:boundary-report:summary` ممیزی کنند؛ exportهای کمکیِ
رزروشدهٔ استفاده‌نشده به‌جای باقی‌ماندن در SDK عمومی به‌عنوان
بدهی سازگاریِ غیرفعال، گزارش CI را ناموفق می‌کنند.

برای راهنمای نگارش Plugin، [نمای کلی SDK ‏Plugin](/fa/plugins/sdk-overview) را ببینید.

## ورود Plugin

| زیرمسیر                        | exportهای کلیدی                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | کمک‌کننده‌های آیتم ارائه‌دهندهٔ مهاجرت مانند `createMigrationItem`، ثابت‌های دلیل، نشانگرهای وضعیت آیتم، کمک‌کننده‌های ویرایش محرمانه، و `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | کمک‌کننده‌های مهاجرت در زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                              |
| `plugin-sdk/health`            | ثبت health-check در Doctor، تشخیص، تعمیر، انتخاب، شدت، و نوع‌های یافته برای مصرف‌کنندگان سلامتِ باندل‌شده                                               |

### کمک‌کننده‌های تست و سازگاری منسوخ‌شده

زیرمسیرهای منسوخ‌شده برای Pluginهای قدیمی‌تر همچنان export می‌شوند، اما کد جدید باید از
زیرمسیرهای متمرکز SDK در پایین استفاده کند. فهرست نگه‌داری‌شده
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` است؛ CI importهای تولیدیِ
باندل‌شده از آن را رد می‌کند. barrelهای گسترده مانند `compat`، `config-types`،
`infra-runtime`، `text-runtime`، و `zod` فقط برای سازگاری هستند. `zod` را
مستقیماً از `zod` وارد کنید.

زیرمسیرهای کمک‌کنندهٔ تستِ مبتنی بر Vitest در OpenClaw فقط محلیِ مخزن هستند و دیگر
exportهای بسته نیستند: `agent-runtime-test-contracts`،
`channel-contract-testing`، `channel-target-testing`، `channel-test-helpers`،
`plugin-test-api`، `plugin-test-contracts`، `plugin-test-runtime`،
`provider-http-test-mocks`، `provider-test-contracts`، `test-env`،
`test-fixtures`، `test-node-mocks`، و `testing`.

### زیرمسیرهای کمکی رزروشدهٔ Plugin باندل‌شده

این زیرمسیرها سطح‌های سازگاریِ متعلق به Plugin برای Plugin باندل‌شدهٔ مالک خود هستند،
نه APIهای عمومی SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. importهای افزونهٔ بین‌مالک با
محافظ‌های قرارداد بسته مسدود می‌شوند.

<AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی شِمای Zod ریشه‌ی `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | کمک‌ابزار اعتبارسنجی JSON Schema کش‌شده برای شِماهای متعلق به Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌علاوه‌ی `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌ابزارهای مشترک جادوگر راه‌اندازی، مترجم راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌ابزارهای پیکربندی/دروازه‌ی اقدام چندحسابی، کمک‌ابزارهای جایگزین حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌ابزارهای عادی‌سازی شناسه‌ی حساب |
    | `plugin-sdk/account-resolution` | کمک‌ابزارهای جست‌وجوی حساب + جایگزین پیش‌فرض |
    | `plugin-sdk/account-helpers` | کمک‌ابزارهای محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | کمک‌ابزارهای تجزیه‌ی فهرست مجاز گروه دسترسی و عیب‌یابی گروه با حذف اطلاعات حساس |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | اجزای اولیه‌ی مشترک شِمای پیکربندی کانال به‌همراه سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | شِماهای پیکربندی کانال بسته‌بندی‌شده‌ی OpenClaw فقط برای Pluginهای بسته‌بندی‌شده‌ی نگه‌داری‌شده |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. شناسه‌های متعارف کانال گفت‌وگوی بسته‌بندی‌شده/رسمی به‌همراه برچسب‌های قالب‌بند/نام‌های مستعار برای Pluginهایی که باید متن دارای پیشوند پاکت را بدون کدنویسی ثابت جدول خودشان تشخیص دهند. |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای شِماهای پیکربندی کانال بسته‌بندی‌شده |
    | `plugin-sdk/telegram-command-config` | کمک‌ابزارهای عادی‌سازی/اعتبارسنجی دستور سفارشی Telegram با جایگزین قرارداد بسته‌بندی‌شده |
    | `plugin-sdk/command-gating` | کمک‌ابزارهای محدود دروازه‌ی مجوزدهی دستور |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری منسوخ ورود کانال سطح پایین. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | حل‌کننده‌ی آزمایشی سطح بالای زمان اجرای ورود کانال و سازنده‌های واقعیت مسیر برای مسیرهای دریافت کانال مهاجرت‌کرده. این را به مونتاژ فهرست‌های مجاز مؤثر، فهرست‌های مجاز دستور و نمایش‌های قدیمی در هر Plugin ترجیح دهید. [API ورود کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-outbound` | قراردادهای چرخه‌ی حیات پیام به‌همراه گزینه‌های خط لوله‌ی پاسخ، رسیدها، پیش‌نمایش/جریان زنده، کمک‌ابزارهای چرخه‌ی حیات، هویت خروجی، برنامه‌ریزی بار داده، ارسال‌های پایدار، و کمک‌ابزارهای زمینه‌ی ارسال پیام. [API خروجی کانال](/fa/plugins/sdk-channel-outbound) را ببینید. |
    | `plugin-sdk/channel-message` | نام مستعار سازگاری منسوخ برای `plugin-sdk/channel-outbound` به‌همراه نماهای قدیمی ارسال پاسخ. |
    | `plugin-sdk/channel-message-runtime` | نام مستعار سازگاری منسوخ برای `plugin-sdk/channel-outbound` به‌همراه نماهای قدیمی ارسال پاسخ. |
    | `plugin-sdk/inbound-envelope` | کمک‌ابزارهای مشترک مسیر ورودی + سازنده‌ی پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | نمای سازگاری منسوخ. برای اجراکننده‌های ورودی و گزاره‌های ارسال از `plugin-sdk/channel-inbound`، و برای کمک‌ابزارهای تحویل پیام از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/messaging-targets` | نام مستعار منسوخ تجزیه‌ی هدف؛ از `plugin-sdk/channel-targets` استفاده کنید |
    | `plugin-sdk/outbound-media` | کمک‌ابزارهای مشترک بارگذاری رسانه‌ی خروجی و وضعیت رسانه‌ی میزبانی‌شده |
    | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | کمک‌ابزارهای محدود عادی‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌ابزارهای چرخه‌ی حیات و آداپتر اتصال رشته |
    | `plugin-sdk/agent-media-payload` | سازنده‌ی قدیمی بار داده‌ی رسانه‌ی عامل |
    | `plugin-sdk/conversation-runtime` | کمک‌ابزارهای مکالمه/اتصال رشته، جفت‌سازی، و اتصال پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌ابزار عکس‌برداری از پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | کمک‌ابزارهای حل سیاست گروه در زمان اجرا |
    | `plugin-sdk/channel-status` | کمک‌ابزارهای مشترک عکس‌برداری/خلاصه‌ی وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | اجزای اولیه‌ی محدود شِمای پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | کمک‌ابزارهای مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک پیش‌درآمد Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | کمک‌ابزارهای ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | کمک‌ابزارهای مشترک تصمیم‌گیری دسترسی گروه |
    | `plugin-sdk/direct-dm`، `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ. از `plugin-sdk/channel-inbound` استفاده کنید. |
    | `plugin-sdk/direct-dm-guard-policy` | کمک‌ابزارهای محدود سیاست نگهبان پیام مستقیم پیش از رمزنگاری |
    | `plugin-sdk/discord` | نمای سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ حل حساب Telegram برای سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از کمک‌ابزارهای زمان اجرای تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ Zalo Personal برای بسته‌های Lark/Zalo منتشرشده که هنوز مجوزدهی دستور فرستنده را وارد می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | کمک‌ابزارهای معنایی ارائه‌ی پیام، تحویل، و پاسخ تعاملی قدیمی. [ارائه‌ی پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | کمک‌ابزارهای مشترک ورودی برای طبقه‌بندی رویداد، ساخت زمینه، قالب‌بندی، ریشه‌ها، debounce، تطبیق اشاره، سیاست اشاره، و ثبت رخداد ورودی |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌ابزارهای محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌ابزارهای محدود سیاست اشاره، نشانگر اشاره، و متن اشاره بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope`، `plugin-sdk/channel-inbound-roots`، `plugin-sdk/channel-location`، `plugin-sdk/channel-logging` | نماهای سازگاری منسوخ. از `plugin-sdk/channel-inbound` یا `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-pairing-paths` | نمای سازگاری منسوخ. از `plugin-sdk/channel-pairing` استفاده کنید. |
    | `plugin-sdk/channel-reply-options-runtime` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-send-result` | انواع نتیجه‌ی پاسخ |
    | `plugin-sdk/channel-actions` | کمک‌ابزارهای اقدام پیام کانال، به‌علاوه‌ی کمک‌ابزارهای منسوخ شِمای بومی که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | کمک‌ابزارهای مشترک عادی‌سازی مسیر، حل هدف مبتنی بر تجزیه‌گر، رشته‌سازی شناسه‌ی رشته، کلیدهای مسیر حذف‌تکرار/فشرده، انواع هدف تجزیه‌شده، و مقایسه‌ی مسیر/هدف |
    | `plugin-sdk/channel-targets` | کمک‌ابزارهای تجزیه‌ی هدف؛ فراخوان‌های مقایسه‌ی مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | انواع قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | کمک‌ابزارهای محدود قرارداد محرمانه مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، و انواع هدف محرمانه |
  </Accordion>

خانواده‌های منسوخ کمک‌ابزار کانال فقط برای سازگاری با Pluginهای منتشرشده در دسترس می‌مانند. برنامه‌ی حذف این است: آن‌ها را در طول بازه‌ی مهاجرت Plugin خارجی نگه دارید، Pluginهای مخزن/بسته‌بندی‌شده را روی `channel-inbound` و `channel-outbound` نگه دارید، سپس زیرمسیرهای سازگاری را در پاک‌سازی بزرگ بعدی SDK حذف کنید. این شامل خانواده‌های قدیمی پیام/زمان اجرای کانال، جریان کانال، دسترسی پیام مستقیم، انشعاب کمک‌ابزار ورودی، گزینه‌های پاسخ، و مسیرهای جفت‌سازی می‌شود.

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای ارائه‌دهنده پشتیبانی‌شده LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شده LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌کارهای مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌کارهای گزینش‌شده برای راه‌اندازی ارائه‌دهنده محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌کارهای متمرکز برای راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های نگهبان |
    | `plugin-sdk/provider-auth-runtime` | کمک‌کارهای زمان اجرا برای حل کلید API در Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-oauth-runtime` | نوع‌های عمومی callback ارائه‌دهنده OAuth، رندر صفحه callback، کمک‌کارهای PKCE/state، تجزیه ورودی مجوزدهی، کمک‌کارهای انقضای توکن، و کمک‌کارهای abort |
    | `plugin-sdk/provider-auth-api-key` | کمک‌کارهای آنبوردینگ/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | کمک‌کارهای جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, کمک‌کارهای import احراز هویت OpenAI Codex، خروجی سازگاری منسوخ‌شده `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌کارهای endpoint ارائه‌دهنده، و کمک‌کارهای مشترک نرمال‌سازی شناسه مدل |
    | `plugin-sdk/provider-catalog-live-runtime` | کمک‌کارهای کاتالوگ زنده مدل ارائه‌دهنده برای کشف محافظت‌شده به سبک `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, فیلتر کردن شناسه مدل، کش TTL، و fallback ایستا |
    | `plugin-sdk/provider-catalog-runtime` | هوک زمان اجرای تقویت کاتالوگ ارائه‌دهنده و نقاط اتصال رجیستری Plugin-ارائه‌دهنده برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌کارهای عمومی قابلیت HTTP/endpoint ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌کارهای فرم multipart رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌کارهای محدود قرارداد پیکربندی/انتخاب web-fetch مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌کارهای ثبت/کش ارائه‌دهنده web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌کارهای محدود پیکربندی/اعتبارنامه web-search برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌کارهای محدود قرارداد پیکربندی/اعتبارنامه web-search مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, و setter/getterهای اعتبارنامه با دامنه مشخص |
    | `plugin-sdk/provider-web-search` | کمک‌کارهای ثبت/کش/زمان اجرای ارائه‌دهنده web-search |
    | `plugin-sdk/embedding-providers` | نوع‌های عمومی ارائه‌دهنده embedding و کمک‌کارهای خواندن، شامل `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, و `listEmbeddingProviders(...)`؛ Pluginها ارائه‌دهندگان را از طریق `api.registerEmbeddingProvider(...)` ثبت می‌کنند تا مالکیت manifest اعمال شود |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, و پاک‌سازی schema + عیب‌یابی DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | نوع‌های snapshot مصرف ارائه‌دهنده، کمک‌کارهای مشترک واکشی مصرف، و واکش‌گرهای ارائه‌دهنده مانند `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, نوع‌های wrapper جریان، سازگاری فراخوانی ابزار متن ساده، و کمک‌کارهای مشترک wrapper برای Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | کمک‌کارهای عمومی مشترک wrapper جریان ارائه‌دهنده شامل `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, و ابزارهای جریان سازگار با Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | کمک‌کارهای انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌کارهای patch پیکربندی آنبوردینگ |
    | `plugin-sdk/global-singleton` | کمک‌کارهای singleton/map/cache محلی فرایند |
    | `plugin-sdk/group-activation` | کمک‌کارهای محدود حالت فعال‌سازی گروه و تجزیه فرمان |
  </Accordion>

snapshotهای مصرف ارائه‌دهنده معمولاً یک یا چند `windows` سهمیه را گزارش می‌کنند که هرکدام
یک برچسب، درصد مصرف‌شده، و زمان بازنشانی اختیاری دارند. ارائه‌دهندگانی که به‌جای
پنجره‌های سهمیه قابل بازنشانی، متن موجودی یا وضعیت حساب را ارائه می‌کنند باید
`summary` را با آرایه خالی `windows` برگردانند، نه اینکه درصدها را جعل کنند.
OpenClaw آن متن خلاصه را در خروجی وضعیت نمایش می‌دهد؛ فقط زمانی از `error` استفاده کنید که
endpoint مصرف شکست خورده باشد یا هیچ داده مصرف قابل استفاده‌ای برنگردانده باشد.

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, کمک‌کارهای رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا، کمک‌کارهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌کارهای حل تأییدکننده و احراز هویت کنش در همان چت |
    | `plugin-sdk/approval-client-runtime` | کمک‌کارهای پروفایل/فیلتر تأیید exec بومی |
    | `plugin-sdk/approval-delivery-runtime` | adapterهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌کار مشترک حل Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کارهای سبک‌وزن بارگذاری adapter تأیید بومی برای entrypointهای داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌کارهای گسترده‌تر زمان اجرای handler تأیید؛ وقتی نقاط اتصال محدودتر adapter/gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌کارهای هدف تأیید بومی، اتصال حساب، gate مسیر، fallback بازارسال، و سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-reaction-runtime` | اتصال‌های hardcoded واکنش تأیید، payloadهای prompt واکنش، storeهای هدف واکنش، و خروجی سازگاری برای سرکوب prompt اجرای بومی محلی |
    | `plugin-sdk/approval-reply-runtime` | کمک‌کارهای payload پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌کارهای payload تأیید exec/Plugin، کمک‌کارهای مسیریابی/زمان اجرای تأیید بومی، و کمک‌کارهای نمایش ساختاریافته تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌کارهای محدود reset برای dedupe پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌کارهای محدود آزمون قرارداد کانال بدون barrel گسترده آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی منوی آرگومان پویا، و کمک‌کارهای هدف جلسه بومی |
    | `plugin-sdk/command-detection` | کمک‌کارهای مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | predicateهای سبک‌وزن متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنه فرمان و کمک‌کارهای سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کارهای محدود گردآوری قرارداد secret برای سطوح secret کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌کارهای محدود `coerceSecretRef` و نوع‌دهی SecretRef برای تجزیه قرارداد secret/پیکربندی |
    | `plugin-sdk/secret-provider-integration` | manifest یکپارچه‌سازی ارائه‌دهنده SecretRef فقط در سطح type و قراردادهای preset برای Pluginهایی که presetهای ارائه‌دهنده secret خارجی منتشر می‌کنند |
    | `plugin-sdk/security-runtime` | کمک‌کارهای مشترک اعتماد، gate کردن DM، فایل/مسیر محدود به ریشه شامل نوشتن‌های فقط-ایجاد، جایگزینی اتمیک فایل همگام/ناهمگام، نوشتن‌های موقت sibling، fallback جابه‌جایی بین‌دستگاهی، کمک‌کارهای file-store خصوصی، guardهای والد symlink، محتوای خارجی، redaction متن حساس، مقایسه secret با زمان ثابت، و کمک‌کارهای گردآوری secret |
    | `plugin-sdk/ssrf-policy` | کمک‌کارهای allowlist میزبان و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌کارهای محدود pinned-dispatcher بدون سطح گسترده زمان اجرای infra |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، fetch محافظت‌شده با SSRF، خطای SSRF، و کمک‌کارهای سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌کارهای تجزیه ورودی secret |
    | `plugin-sdk/webhook-ingress` | کمک‌کارهای درخواست/هدف Webhook و تبدیل خام websocket/body |
    | `plugin-sdk/webhook-request-guards` | کمک‌کارهای اندازه/timeout بدنه درخواست |
  </Accordion>

  <Accordion title="زیرمسیرهای زمان اجرا و ذخیره‌سازی">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌گرهای گسترده زمان اجرا/لاگ‌گیری/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌گرهای محدود محیط زمان اجرا، لاگر، مهلت زمانی، تلاش دوباره، و عقب‌نشینی |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای پروفایل/پیش‌فرض‌های نرمال‌شده، تجزیه URL‏ CDP، و کمک‌گرهای احراز هویت کنترل مرورگر |
    | `plugin-sdk/agent-harness-task-runtime` | کمک‌گرهای عمومی چرخه عمر تسک و تحویل تکمیل برای عامل‌های متکی بر هارنس که از دامنه تسک صادرشده توسط میزبان استفاده می‌کنند |
    | `plugin-sdk/codex-mcp-projection` | کمک‌گر رزروشده Codex همراه برای تصویرکردن پیکربندی سرور MCP کاربر به پیکربندی رشته Codex؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/codex-native-task-runtime` | کمک‌گر خصوصی Codex همراه برای اتصال آینه/زمان اجرای تسک بومی؛ برای Pluginهای شخص ثالث نیست |
    | `plugin-sdk/channel-runtime-context` | کمک‌گرهای عمومی ثبت و جست‌وجوی زمینه زمان اجرای کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ Matrix برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیماً `plugin-sdk/run-command` را وارد کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ Mattermost برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید زیرمسیرهای عمومی SDK را مستقیماً وارد کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌گرهای مشترک فرمان/هوک/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌گرهای مشترک خط لوله هوک داخلی/Webhook |
    | `plugin-sdk/lazy-runtime` | کمک‌گرهای واردکردن/اتصال تنبل زمان اجرا مانند `createLazyRuntimeModule`،‏ `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌گرهای اجرای فرایند |
    | `plugin-sdk/cli-runtime` | کمک‌گرهای قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/qa-live-transport-scenarios` | شناسه‌های سناریوی QA انتقال زنده مشترک، کمک‌گرهای پوشش خط مبنا، و کمک‌گر انتخاب سناریو |
    | `plugin-sdk/gateway-method-runtime` | کمک‌گر رزروشده ارسال متد Gateway برای مسیرهای HTTP‏ Plugin که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌گر شروع کلاینت آماده حلقه رویداد، RPC‏ CLI‏ Gateway، خطاهای پروتکل Gateway، و کمک‌گرهای وصله وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط‌نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌گرهای جست‌وجوی پیکربندی Plugin در زمان اجرا مانند `requireRuntimeConfig`،‏ `resolvePluginConfigObject`، و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌گرهای جهش تراکنشی پیکربندی مانند `mutateConfigFile`،‏ `replaceConfigFile`، و `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | رشته‌های راهنمای فراداده تحویل ابزار پیام مشترک |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌گرهای عکس‌برداری پیکربندی فرایند فعلی مانند `getRuntimeConfig`،‏ `getRuntimeConfigSnapshot`، و تنظیم‌کننده‌های عکس‌برداری تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تداخل، حتی وقتی سطح قرارداد Telegram همراه در دسترس نیست |
    | `plugin-sdk/text-autolink-runtime` | تشخیص پیوند خودکار ارجاع فایل بدون بشکه متنی گسترده |
    | `plugin-sdk/approval-reaction-runtime` | اتصال‌های واکنش تأیید سخت‌کدشده، بارهای درخواست واکنش، ذخیره‌های هدف واکنش، و خروجی سازگاری برای سرکوب درخواست اجرای بومی محلی |
    | `plugin-sdk/approval-runtime` | کمک‌گرهای تأیید اجرا/Plugin، سازنده‌های قابلیت تأیید، کمک‌گرهای احراز هویت/پروفایل، کمک‌گرهای مسیریابی/زمان اجرای بومی، و قالب‌بندی مسیر نمایش ساختاریافته تأیید |
    | `plugin-sdk/reply-runtime` | کمک‌گرهای مشترک زمان اجرای ورودی/پاسخ، قطعه‌بندی، ارسال، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌گرهای محدود ارسال/نهایی‌سازی پاسخ و برچسب مکالمه |
    | `plugin-sdk/reply-history` | کمک‌گرهای مشترک تاریخچه پاسخ در پنجره کوتاه. کد جدید نوبت پیام باید از `createChannelHistoryWindow` استفاده کند؛ کمک‌گرهای سطح پایین‌تر map فقط به‌عنوان خروجی‌های سازگاری منسوخ باقی می‌مانند |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌گرهای محدود قطعه‌بندی متن/مارک‌داون |
    | `plugin-sdk/session-store-runtime` | کمک‌گرهای گردش کار نشست (`getSessionEntry`،‏ `listSessionEntries`،‏ `patchSessionEntry`،‏ `upsertSessionEntry`)، خواندن‌های محدود متن رونوشت اخیر کاربر/دستیار بر اساس هویت نشست، کمک‌گرهای مسیر ذخیره نشست قدیمی/کلید نشست، خواندن‌های updated-at، و کمک‌گرهای سازگاری فقط انتقالی برای کل ذخیره/مسیر فایل |
    | `plugin-sdk/session-transcript-runtime` | هویت رونوشت، کمک‌گرهای هدف/خواندن/نوشتن دامنه‌دار، انتشار به‌روزرسانی، قفل‌های نوشتن، و کلیدهای برخورد حافظه رونوشت |
    | `plugin-sdk/sqlite-runtime` | کمک‌گرهای متمرکز طرح‌واره عامل، مسیر، و تراکنش SQLite برای زمان اجرای فرست‌پارتی |
    | `plugin-sdk/cron-store-runtime` | کمک‌گرهای مسیر/بارگذاری/ذخیره ذخیره Cron |
    | `plugin-sdk/state-paths` | کمک‌گرهای مسیر پوشه وضعیت/OAuth |
    | `plugin-sdk/plugin-state-runtime` | انواع وضعیت کلیددار SQLite جانبی Plugin به‌همراه تنظیم متمرکز pragma اتصال و نگهداری WAL برای پایگاه‌های داده متعلق به Plugin |
    | `plugin-sdk/routing` | کمک‌گرهای مسیریابی/کلید نشست/اتصال حساب مانند `resolveAgentRoute`،‏ `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌گرهای مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، و کمک‌گرهای فراداده مسئله |
    | `plugin-sdk/target-resolver-runtime` | کمک‌گرهای مشترک حل‌کننده هدف |
    | `plugin-sdk/string-normalization-runtime` | کمک‌گرهای نرمال‌سازی slug/رشته |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج stdout/stderr نرمال‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های رایج پارامتر ابزار/CLI |
    | `plugin-sdk/tool-plugin` | تعریف یک Plugin ساده ابزار عامل تایپ‌شده و ارائه فراداده ایستا برای تولید مانیفست |
    | `plugin-sdk/tool-payload` | استخراج بارهای نرمال‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای هدف ارسال کانونی از آرگومان‌های ابزار |
    | `plugin-sdk/sandbox` | انواع بک‌اند سندباکس و کمک‌گرهای فرمان SSH/OpenShell، شامل پیش‌پرواز فرمان اجرا با شکست سریع |
    | `plugin-sdk/temp-path` | کمک‌گرهای مشترک مسیر دانلود موقت و فضاهای کاری موقت امن خصوصی |
    | `plugin-sdk/logging-core` | لاگر زیرسیستم و کمک‌گرهای حذف اطلاعات حساس |
    | `plugin-sdk/markdown-table-runtime` | کمک‌گرهای حالت جدول مارک‌داون و تبدیل |
    | `plugin-sdk/model-session-runtime` | کمک‌گرهای بازنویسی مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌گرهای حل پیکربندی ارائه‌دهنده گفت‌وگو |
    | `plugin-sdk/json-store` | کمک‌گرهای کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/json-unsafe-integers` | کمک‌گرهای تجزیه JSON که لیترال‌های عدد صحیح ناامن را به‌صورت رشته حفظ می‌کنند |
    | `plugin-sdk/file-lock` | کمک‌گرهای قفل فایل بازدرون‌رو |
    | `plugin-sdk/persistent-dedupe` | کمک‌گرهای کش حذف تکرار مبتنی بر دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌گرهای زمان اجرا/نشست ACP و ارسال پاسخ |
    | `plugin-sdk/acp-runtime-backend` | کمک‌گرهای سبک ثبت بک‌اند ACP و ارسال پاسخ برای Pluginهای بارگذاری‌شده در راه‌اندازی |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل اتصال فقط‌خواندنی ACP بدون واردکردن‌های راه‌اندازی چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | ابتدایی‌های محدود طرح‌واره پیکربندی زمان اجرای عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر بولی آزاد |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌گرهای حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌گرهای راه‌اندازی دستگاه و توکن جفت‌سازی |
    | `plugin-sdk/extension-shared` | ابتدایی‌های مشترک کانال غیرفعال، وضعیت، و کمک‌گر پراکسی محیطی |
    | `plugin-sdk/models-provider-runtime` | کمک‌گرهای پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌گرهای فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | کمک‌گرهای رجیستری/ساخت/سریال‌سازی فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورداعتماد برای هارنس‌های سطح پایین عامل: انواع هارنس، کمک‌گرهای هدایت/لغو اجرای فعال، کمک‌گرهای پل ابزار OpenClaw، کمک‌گرهای سیاست ابزار برنامه زمان اجرا، طبقه‌بندی نتیجه پایانی، کمک‌گرهای قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | نمای منسوخ تشخیص اندپوینت متعلق به ارائه‌دهنده Z.AI؛ از API عمومی Plugin‏ Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | کمک‌گر قفل async محلی فرایند برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | کمک‌گر تله‌متری فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌گر همزمانی تسک async محدود |
    | `plugin-sdk/dedupe-runtime` | کمک‌گرهای کش حذف تکرار درون‌حافظه‌ای |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌گر تخلیه تحویل‌های معلق خروجی |
    | `plugin-sdk/file-access-runtime` | کمک‌گرهای امن مسیر فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | کمک‌گرهای بیدارسازی، رویداد، و نمایانی Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌گر تبدیل عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌گرهای توکن/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌گرهای صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | کمک‌گر انتظار برای آمادگی انتقال |
    | `plugin-sdk/exec-approvals-runtime` | کمک‌گرهای فایل سیاست تأیید اجرا بدون بشکه گسترده infra-runtime |
    | `plugin-sdk/infra-runtime` | شیم سازگاری منسوخ؛ از زیرمسیرهای متمرکز زمان اجرا در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌گرهای کوچک کش محدود |
    | `plugin-sdk/diagnostic-runtime` | کمک‌گرهای پرچم تشخیصی، رویداد، و زمینه ردیابی |
    | `plugin-sdk/error-runtime` | گراف خطا، قالب‌بندی، کمک‌گرهای مشترک طبقه‌بندی خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch پوشش‌داده‌شده، پراکسی، گزینه EnvHttpProxyAgent، و کمک‌گرهای جست‌وجوی سنجاق‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از Dispatcher بدون واردکردن‌های پراکسی/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | پاک‌ساز URL داده تصویر درون‌خطی و کمک‌گرهای بوکشیدن امضا بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود بدنه پاسخ بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت اتصال مکالمه فعلی بدون مسیریابی اتصال پیکربندی‌شده یا ذخیره‌های جفت‌سازی |
    | `plugin-sdk/session-store-runtime` | کمک‌گرهای ذخیره نشست بدون واردکردن‌های گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/sqlite-runtime` | کمک‌گرهای متمرکز طرح‌واره عامل، مسیر، و تراکنش SQLite بدون کنترل‌های چرخه عمر پایگاه داده |
    | `plugin-sdk/context-visibility-runtime` | حل نمایانی زمینه و فیلترکردن زمینه تکمیلی بدون واردکردن‌های گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌گرهای محدود تبدیل و نرمال‌سازی رکورد/رشته ابتدایی بدون واردکردن‌های مارک‌داون/لاگ‌گیری |
    | `plugin-sdk/host-runtime` | کمک‌گرهای نرمال‌سازی نام میزبان و میزبان SCP |
    | `plugin-sdk/retry-runtime` | کمک‌گرهای پیکربندی تلاش دوباره و اجراکننده تلاش دوباره |
    | `plugin-sdk/agent-runtime` | کمک‌گرهای پوشه/هویت/فضای کاری عامل، شامل `resolveAgentDir`،‏ `resolveDefaultAgentDir`، و خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | پرس‌وجو/حذف تکرار پوشه مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمون">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | راهنماهای مشترک دریافت/تبدیل/ذخیره رسانه، شامل `saveRemoteMedia`، `saveResponseMedia`، `readRemoteMediaBuffer`، و `fetchRemoteMedia` منسوخ؛ وقتی یک URL باید به رسانه OpenClaw تبدیل شود، پیش از خواندن بافرها، راهنماهای ذخیره‌سازی را ترجیح دهید |
    | `plugin-sdk/media-mime` | نرمال‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME، و راهنماهای نوع رسانه |
    | `plugin-sdk/media-store` | راهنماهای محدود ذخیره‌سازی رسانه مانند `saveMediaBuffer` و `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | راهنماهای مشترک جایگزینی در تولید رسانه، انتخاب نامزد، و پیام‌رسانی برای مدلِ گم‌شده |
    | `plugin-sdk/media-understanding` | انواع تامین‌کننده فهم رسانه، به‌همراه خروجی‌های راهنمای تصویر/صدا/استخراج ساختاریافته برای تامین‌کننده‌ها |
    | `plugin-sdk/text-chunking` | راهنماهای تکه‌بندی/رندر متن و markdown، تبدیل جدول markdown، حذف برچسب‌های دستورالعمل، و ابزارهای متن ایمن |
    | `plugin-sdk/text-chunking` | راهنمای تکه‌بندی متن خروجی |
    | `plugin-sdk/speech` | انواع تامین‌کننده گفتار، به‌همراه خروجی‌های دستورالعمل، رجیستری، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و راهنماهای گفتار برای تامین‌کننده‌ها |
    | `plugin-sdk/speech-core` | انواع مشترک تامین‌کننده گفتار، رجیستری، دستورالعمل، نرمال‌سازی، و خروجی‌های راهنمای گفتار |
    | `plugin-sdk/realtime-transcription` | انواع تامین‌کننده رونویسی بلادرنگ، راهنماهای رجیستری، و راهنمای مشترک نشست WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | راهنمای راه‌اندازی اولیه پروفایل بلادرنگ برای تزریق محدود زمینه `IDENTITY.md`، `USER.md`، و `SOUL.md` |
    | `plugin-sdk/realtime-voice` | انواع تامین‌کننده صدای بلادرنگ، راهنماهای رجیستری، و راهنماهای مشترک رفتار صدای بلادرنگ، شامل ردیابی فعالیت خروجی |
    | `plugin-sdk/image-generation` | انواع تامین‌کننده تولید تصویر، به‌همراه راهنماهای دارایی تصویر/داده URL و سازنده تامین‌کننده تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | انواع مشترک تولید تصویر، جایگزینی، احراز هویت، و راهنماهای رجیستری |
    | `plugin-sdk/music-generation` | انواع تامین‌کننده/درخواست/نتیجه تولید موسیقی |
    | `plugin-sdk/music-generation-core` | انواع مشترک تولید موسیقی، راهنماهای جایگزینی، جست‌وجوی تامین‌کننده، و تجزیه model-ref |
    | `plugin-sdk/video-generation` | انواع تامین‌کننده/درخواست/نتیجه تولید ویدئو |
    | `plugin-sdk/video-generation-core` | انواع مشترک تولید ویدئو، راهنماهای جایگزینی، جست‌وجوی تامین‌کننده، و تجزیه model-ref |
    | `plugin-sdk/transcripts` | انواع مشترک تامین‌کننده منبع رونوشت‌ها، راهنماهای رجیستری، توصیف‌گرهای نشست، و فراداده گفتار |
    | `plugin-sdk/webhook-targets` | راهنماهای رجیستری مقصد Webhook و نصب مسیر |
    | `plugin-sdk/webhook-path` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | راهنماهای مشترک بارگذاری رسانه دور/محلی |
    | `plugin-sdk/zod` | بازصدور سازگاری منسوخ؛ `zod` را مستقیما از `zod` وارد کنید |
    | `plugin-sdk/testing` | barrel سازگاری منسوخ محلیِ مخزن برای آزمون‌های قدیمی OpenClaw. آزمون‌های جدید مخزن باید در عوض زیرمسیرهای آزمون محلی متمرکز مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را وارد کنند |
    | `plugin-sdk/plugin-test-api` | راهنمای حداقلی محلیِ مخزن `createTestPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin بدون وارد کردن پل‌های راهنمای آزمون مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد آداپتور agent-runtime بومی محلیِ مخزن برای آزمون‌های احراز هویت، تحویل، جایگزینی، tool-hook، prompt-overlay، schema، و تصویرسازی رونوشت |
    | `plugin-sdk/channel-test-helpers` | راهنماهای آزمون کانال‌محور محلیِ مخزن برای قراردادهای کنش/راه‌اندازی/وضعیت عمومی، assertionهای دایرکتوری، چرخه عمر شروع حساب، نخ‌کشی send-config، mockهای runtime، مسائل وضعیت، تحویل خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک محلیِ مخزن برای موارد خطای target-resolution در آزمون‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | راهنماهای قرارداد بسته Plugin، ثبت، آرتیفکت عمومی، ورود مستقیم، API runtime، و اثر جانبی import در سطح محلیِ مخزن |
    | `plugin-sdk/provider-test-contracts` | راهنماهای قرارداد محلیِ مخزن برای runtime تامین‌کننده، احراز هویت، کشف، onboard، کاتالوگ، wizard، قابلیت رسانه، سیاست replay، صدای زنده realtime STT، web-search/fetch، و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای اختیاری Vitest HTTP/احراز هویت محلیِ مخزن برای آزمون‌های تامین‌کننده‌ای که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی محلیِ مخزن برای ثبت runtime CLI، زمینه sandbox، نویسنده skill، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin بسته‌بندی‌شده، terminal-text، تکه‌بندی، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | راهنماهای متمرکز mock داخلی Node محلیِ مخزن برای استفاده در factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح راهنمای memory-core بسته‌بندی‌شده برای راهنماهای manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade مربوط به runtime نمایه/جست‌وجوی حافظه |
    | `plugin-sdk/memory-core-host-embedding-registry` | راهنماهای سبک‌وزن رجیستری تامین‌کننده embedding حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های موتور بنیاد میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی رجیستری، تامین‌کننده محلی، و راهنماهای عمومی batch/remote. `registerMemoryEmbeddingProvider` روی این سطح منسوخ است؛ برای تامین‌کننده‌های جدید از API عمومی تامین‌کننده embedding استفاده کنید. |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | راهنماهای چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | راهنماهای query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | راهنماهای secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | راهنماهای وضعیت میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | راهنماهای runtime CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | راهنماهای runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | راهنماهای فایل/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار بی‌طرف از فروشنده برای راهنماهای runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار بی‌طرف از فروشنده برای راهنماهای ژورنال رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | راهنماهای مشترک managed-markdown برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | facade مربوط به runtime حافظه فعال برای دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشده راهنماهای بسته‌بندی‌شده">
    زیرمسیرهای SDK مربوط به راهنماهای بسته‌بندی‌شده رزروشده، سطح‌های محدود و مالک‌محور برای
    کد Plugin بسته‌بندی‌شده هستند. آن‌ها در موجودی SDK ردیابی می‌شوند تا ساخت
    بسته‌ها و aliasing قطعی بماند، اما APIهای عمومی برای
    نگارش Plugin نیستند. قراردادهای میزبان قابل‌استفاده‌مجدد جدید باید از زیرمسیرهای عمومی SDK
    مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`، و
    `plugin-sdk/plugin-config-runtime` استفاده کنند.

    | زیرمسیر | مالک و هدف |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | راهنمای Plugin بسته‌بندی‌شده Codex برای تصویرسازی پیکربندی سرور MCP کاربر در پیکربندی thread app-server مربوط به Codex |
    | `plugin-sdk/codex-native-task-runtime` | راهنمای Plugin بسته‌بندی‌شده Codex برای آینه‌سازی subagentهای بومی app-server مربوط به Codex در وضعیت task OpenClaw |

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
