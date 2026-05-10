---
read_when:
    - انتخاب زیرمسیر درست plugin-sdk برای وارد کردن یک Plugin
    - ممیزی زیرمسیرهای Plugin همراه و سطوح کمکی
summary: 'فهرست زیرمسیرهای SDK Plugin: کدام واردسازی‌ها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای کیت توسعه نرم‌افزار Plugin
x-i18n:
    generated_at: "2026-05-10T20:00:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای عمومی محدود در
`openclaw/plugin-sdk/` در دسترس است. این صفحه زیرمسیرهای رایج را بر اساس
هدف دسته‌بندی و فهرست می‌کند. فهرست تولیدشده‌ی entrypointهای کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های بسته، زیرمجموعه‌ی
عمومی پس از کسر زیرمسیرهای تست/داخلیِ محلی مخزن هستند که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌داران می‌توانند
تعداد خروجی‌های عمومی را با `pnpm plugin-sdk:surface` و زیرمسیرهای helper رزروشده‌ی فعال را با
`pnpm plugins:boundary-report:summary` بررسی کنند؛ خروجی‌های helper رزروشده‌ی استفاده‌نشده
به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی سازگاری غیرفعال، گزارش CI را ناموفق می‌کنند.

برای راهنمای نویسندگی Plugin، [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) را ببینید.

## ورودی Plugin

| زیرمسیر                        | خروجی‌های کلیدی                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | helperهای آیتم provider مهاجرت مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای status آیتم، helperهای redaction، و `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | helperهای مهاجرت runtime مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                              |

### سازگاری و helperهای تست منسوخ‌شده

این زیرمسیرها برای Pluginهای قدیمی‌تر و مجموعه‌تست‌های OpenClaw همچنان خروجی بسته باقی می‌مانند،
اما کد جدید نباید importهایی از آن‌ها اضافه کند: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, و `zod`. در کد جدید Plugin، `zod` را مستقیما از `zod` import کنید.
`plugin-test-runtime` همچنان یک زیرمسیر helper تست متمرکز و فعال است.

### زیرمسیرهای عمومی استفاده‌نشده‌ی منسوخ‌شده

این زیرمسیرهای عمومی دست‌کم یک ماه وجود داشته‌اند و در حال حاضر هیچ import تولیدی
extension بسته‌بندی‌شده‌ای ندارند. آن‌ها برای سازگاری همچنان قابل import هستند،
اما کد جدید Plugin باید به‌جای آن‌ها از زیرمسیرهای SDK متمرکز و فعالانه مصرف‌شده استفاده کند:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, و `zalouser`.

### زیرمسیرهای عمومی کم‌کاربرد منسوخ‌شده

زیرمسیرهای عمومی که در حال حاضر فقط توسط یک یا دو مالک Plugin بسته‌بندی‌شده استفاده می‌شوند نیز
برای کد جدید Plugin منسوخ هستند. آن‌ها برای سازگاری همچنان خروجی بسته باقی می‌مانند،
اما کد جدید باید seamهای SDK مشترک و فعال یا APIهای بسته‌ی متعلق به Plugin را ترجیح دهد.
نگه‌داران مجموعه‌ی دقیق را در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` و بودجه‌ی فعلی را
با `pnpm plugin-sdk:surface` پیگیری می‌کنند.

### barrelهای گسترده‌ی منسوخ‌شده

این barrelهای re-export گسترده برای سورس OpenClaw و بررسی‌های سازگاری همچنان قابل build باقی می‌مانند،
اما کد جدید باید زیرمسیرهای متمرکز SDK را ترجیح دهد:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, و
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
و `text-runtime` فقط برای سازگاری روبه‌عقب به‌عنوان خروجی بسته باقی می‌مانند؛ به‌جای آن‌ها از
زیرمسیرهای متمرکز channel/runtime، `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime`, و `logging-core` استفاده کنید.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی طرحواره Zod ریشه `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | کمک‌کننده اعتبارسنجی JSON Schema کش‌شده برای طرحواره‌های متعلق به Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌کننده‌های مشترک جادوگر راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌کننده‌های پیکربندی چندحسابی/دروازه اقدام، کمک‌کننده‌های بازگشت به حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌کننده‌های نرمال‌سازی شناسه حساب |
    | `plugin-sdk/account-resolution` | کمک‌کننده‌های جست‌وجوی حساب + بازگشت به پیش‌فرض |
    | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | کمک‌کننده‌های تجزیه فهرست مجاز گروه دسترسی و عیب‌یابی گروهی پوشیده‌شده |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | کمک‌کننده‌های قدیمی خط لوله پاسخ. کد جدید خط لوله پاسخ کانال باید از `createChannelMessageReplyPipeline` و `resolveChannelMessageSourceReplyDeliveryMode` از `plugin-sdk/channel-message` استفاده کند. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | اجزای اولیه مشترک طرحواره پیکربندی کانال به‌علاوه سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | طرحواره‌های پیکربندی کانال همراه OpenClaw فقط برای Pluginهای همراه نگهداری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای طرحواره‌های پیکربندی کانال همراه |
    | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های نرمال‌سازی/اعتبارسنجی فرمان سفارشی Telegram با بازگشت به قرارداد همراه |
    | `plugin-sdk/command-gating` | کمک‌کننده‌های محدود دروازه مجوز فرمان |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری ورود کانال سطح پایین منسوخ. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | حل‌کننده زمان اجرای ورود کانال سطح بالا و آزمایشی و سازنده‌های واقعیت مسیر برای مسیرهای دریافت کانال مهاجرت‌یافته. این را به جای مونتاژ فهرست‌های مجاز مؤثر، فهرست‌های مجاز فرمان و تصویرسازی‌های قدیمی در هر Plugin ترجیح دهید. [API ورود کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، `createChannelRunQueue` و کمک‌کننده‌های قدیمی چرخه حیات جریان پیش‌نویس. کد جدید نهایی‌سازی پیش‌نمایش باید از `plugin-sdk/channel-message` استفاده کند. |
    | `plugin-sdk/channel-message` | کمک‌کننده‌های کم‌هزینه قرارداد چرخه حیات پیام مانند `defineChannelMessageAdapter`، `createChannelMessageAdapterFromOutbound`، `createChannelMessageReplyPipeline`، `createReplyPrefixContext`، `resolveChannelMessageSourceReplyDeliveryMode`، مشتق‌سازی قابلیت durable-final، کمک‌کننده‌های اثبات قابلیت برای قابلیت‌های ارسال/رسید/اثر جانبی، `MessageReceiveContext`، اثبات‌های سیاست تأیید دریافت، `defineFinalizableLivePreviewAdapter`، `deliverWithFinalizableLivePreviewAdapter`، اثبات‌های قابلیت پیش‌نمایش زنده و نهایی‌ساز زنده، وضعیت بازیابی پایدار، `RenderedMessageBatch`، انواع رسید پیام، و کمک‌کننده‌های شناسه رسید. [API پیام کانال](/fa/plugins/sdk-channel-message) را ببینید. نماهای قدیمی ارسال پاسخ فقط برای سازگاری منسوخ‌شده‌اند. |
    | `plugin-sdk/channel-message-runtime` | کمک‌کننده‌های تحویل زمان اجرا که ممکن است تحویل خروجی را بارگذاری کنند، از جمله `deliverInboundReplyWithMessageSendContext`، `sendDurableMessageBatch` و `withDurableMessageSendContext`. پل‌های منسوخ ارسال پاسخ فقط برای دیسپچرهای سازگاری همچنان قابل import هستند. از ماژول‌های زمان اجرای monitor/send استفاده کنید، نه فایل‌های راه‌اندازی داغ Plugin. |
    | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های مشترک مسیر ورودی + سازنده پوشش |
    | `plugin-sdk/inbound-reply-dispatch` | کمک‌کننده‌های قدیمی مشترک ثبت و ارسال رکورد ورودی، گزاره‌های ارسال قابل‌مشاهده/نهایی، و سازگاری منسوخ `deliverDurableInboundReplyPayload` برای دیسپچرهای کانال آماده‌شده. کد جدید دریافت/ارسال کانال باید کمک‌کننده‌های چرخه حیات زمان اجرا را از `plugin-sdk/channel-message-runtime` import کند. |
    | `plugin-sdk/messaging-targets` | کمک‌کننده‌های تجزیه/تطبیق مقصد |
    | `plugin-sdk/outbound-media` | کمک‌کننده‌های مشترک بارگذاری رسانه خروجی |
    | `plugin-sdk/outbound-send-deps` | جست‌وجوی سبک وابستگی ارسال خروجی برای آداپتورهای کانال |
    | `plugin-sdk/outbound-runtime` | کمک‌کننده‌های هویت خروجی، نماینده ارسال، نشست، قالب‌بندی و برنامه‌ریزی payload. کمک‌کننده‌های تحویل مستقیم مانند `deliverOutboundPayloads` بستر سازگاری منسوخ هستند؛ برای مسیرهای ارسال جدید از `plugin-sdk/channel-message-runtime` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | کمک‌کننده‌های محدود نرمال‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های چرخه حیات اتصال thread و آداپتور |
    | `plugin-sdk/agent-media-payload` | سازنده قدیمی payload رسانه عامل |
    | `plugin-sdk/conversation-runtime` | کمک‌کننده‌های گفت‌وگو/اتصال thread، جفت‌سازی و اتصال پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده snapshot پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | کمک‌کننده‌های حل سیاست گروهی زمان اجرا |
    | `plugin-sdk/channel-status` | کمک‌کننده‌های مشترک snapshot/خلاصه وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | اجزای اولیه محدود طرحواره پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک مقدمه Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | کمک‌کننده‌های مشترک تصمیم‌گیری دسترسی گروهی |
    | `plugin-sdk/direct-dm` | کمک‌کننده‌های مشترک احراز هویت/نگهبان پیام مستقیم |
    | `plugin-sdk/discord` | نمای سازگاری Discord منسوخ برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک ردیابی‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ حل حساب Telegram برای سازگاری مالک ردیابی‌شده؛ Pluginهای جدید باید از کمک‌کننده‌های تزریق‌شده زمان اجرا یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ Zalo Personal برای بسته‌های منتشرشده Lark/Zalo که هنوز مجوزدهی فرمان فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های ارائه معنایی پیام، تحویل و پاسخ تعاملی قدیمی. [ارائه پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | barrel سازگاری برای debounce ورودی، تطبیق mention، کمک‌کننده‌های سیاست mention، و کمک‌کننده‌های پوشش |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌کننده‌های محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌کننده‌های محدود سیاست mention، نشانگر mention و متن mention بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope` | کمک‌کننده‌های محدود قالب‌بندی پوشش ورودی |
    | `plugin-sdk/channel-location` | کمک‌کننده‌های زمینه و قالب‌بندی موقعیت کانال |
    | `plugin-sdk/channel-logging` | کمک‌کننده‌های ثبت وقایع کانال برای حذف‌های ورودی و خرابی‌های تایپ/تأیید |
    | `plugin-sdk/channel-send-result` | انواع نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | کمک‌کننده‌های اقدام پیام کانال، به‌علاوه کمک‌کننده‌های طرحواره native منسوخ که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | کمک‌کننده‌های مشترک نرمال‌سازی مسیر، حل مقصد مبتنی بر parser، رشته‌سازی شناسه thread، کلیدهای مسیر dedupe/compact، انواع مقصد تجزیه‌شده، و کمک‌کننده‌های مقایسه مسیر/مقصد |
    | `plugin-sdk/channel-targets` | کمک‌کننده‌های تجزیه مقصد؛ فراخوان‌های مقایسه مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | انواع قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود قرارداد secret مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment` و انواع مقصد secret |
  </Accordion>

  <Accordion title="Provider subpaths">
    | زیربخش | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شده‌ی ارائه‌دهنده‌ی LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شده‌ی LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌کارهای مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌کارهای گزینش‌شده برای راه‌اندازی ارائه‌دهنده‌ی محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌کارهای متمرکز برای راه‌اندازی ارائه‌دهنده‌ی خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های watchdog |
    | `plugin-sdk/provider-auth-runtime` | کمک‌کارهای رفع API-key در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-auth-api-key` | کمک‌کارهای ورود اولیه/نوشتن پروفایل API-key مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده‌ی استاندارد نتیجه‌ی احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | کمک‌کارهای جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌کارهای نقطه پایانی ارائه‌دهنده، و کمک‌کارهای مشترک نرمال‌سازی شناسه‌ی مدل |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای گسترش کاتالوگ ارائه‌دهنده و درزهای رجیستری Plugin-ارائه‌دهنده برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌کارهای عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌کارهای فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌کارهای محدود قرارداد پیکربندی/انتخاب واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌کارهای ثبت/کش ارائه‌دهنده‌ی واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌کارهای محدود پیکربندی/اعتبارنامه‌ی جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌کارهای محدود قرارداد پیکربندی/اعتبارنامه‌ی جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه‌ی محدود به دامنه |
    | `plugin-sdk/provider-web-search` | کمک‌کارهای ثبت/کش/زمان اجرای ارائه‌دهنده‌ی جست‌وجوی وب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی + عیب‌یابی طرح‌واره‌ی Gemini |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, انواع دربرگیرنده‌ی استریم، و کمک‌کارهای مشترک دربرگیرنده‌ی Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | کمک‌کارهای انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و استریم‌های رویداد انتقال قابل‌نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌کارهای وصله‌ی پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | کمک‌کارهای singleton/map/cache محلی فرایند |
    | `plugin-sdk/group-activation` | کمک‌کارهای محدود حالت فعال‌سازی گروه و تجزیه‌ی فرمان |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | زیربخش | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، کمک‌کارهای رجیستری فرمان شامل قالب‌بندی پویای منوی آرگومان، کمک‌کارهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌کارهای رفع تأییدکننده و احراز هویت اقدام در همان گفت‌وگو |
    | `plugin-sdk/approval-client-runtime` | کمک‌کارهای پروفایل/فیلتر تأیید exec بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌کار مشترک رفع Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کارهای سبک بارگذاری آداپتور تأیید بومی برای نقطه‌ورود‌های داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌کارهای گسترده‌تر زمان اجرای گرداننده‌ی تأیید؛ وقتی درزهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌کارهای هدف تأیید بومی + اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | کمک‌کارهای محتوای پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌کارهای محتوای تأیید exec/Plugin، کمک‌کارهای مسیریابی/زمان اجرای تأیید بومی، و کمک‌کارهای ساختاریافته‌ی نمایش تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌کارهای محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌کارهای محدود آزمون قرارداد کانال بدون barrel گسترده‌ی آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی پویای منوی آرگومان، و کمک‌کارهای هدف نشست بومی |
    | `plugin-sdk/command-detection` | کمک‌کارهای مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | کمک‌کارهای نرمال‌سازی بدنه‌ی فرمان و سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کارهای محدود گردآوری قرارداد راز برای سطوح راز کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌کارهای محدود `coerceSecretRef` و نوع‌بندی SecretRef برای تجزیه‌ی قرارداد راز/پیکربندی |
    | `plugin-sdk/security-runtime` | کمک‌کارهای مشترک اعتماد، دروازه‌گذاری DM، فایل/مسیر محدود به ریشه شامل نوشتن‌های فقط-ایجاد، جایگزینی اتمیک فایل همگام/ناهمگام، نوشتن‌های موقت هم‌نیایه، پشتیبان جابه‌جایی بین‌دستگاهی، کمک‌کارهای ذخیره‌گاه فایل خصوصی، محافظ‌های والد پیوند نمادین، محتوای بیرونی، ویرایش متن حساس، مقایسه‌ی راز با زمان ثابت، و کمک‌کارهای گردآوری راز |
    | `plugin-sdk/ssrf-policy` | کمک‌کارهای allowlist میزبان و سیاست SSRF شبکه‌ی خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌کارهای محدود dispatcher سنجاق‌شده بدون سطح گسترده‌ی زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | کمک‌کارهای dispatcher سنجاق‌شده، واکشی محافظت‌شده در برابر SSRF، خطای SSRF، و سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌کارهای تجزیه‌ی ورودی راز |
    | `plugin-sdk/webhook-ingress` | کمک‌کارهای درخواست/هدف Webhook و تبدیل خام websocket/body |
    | `plugin-sdk/webhook-request-guards` | کمک‌کارهای اندازه/مهلت بدنه‌ی درخواست |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌کننده‌های گسترده برای زمان اجرا، ثبت گزارش، پشتیبان‌گیری و نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود برای محیط زمان اجرا، ثبت‌کننده گزارش، timeout، retry و backoff |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای profile/defaults نرمال‌سازی‌شده، تجزیه URL مربوط به CDP، و کمک‌کننده‌های احراز هویت کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های عمومی برای ثبت و جست‌وجوی runtime-context کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ‌شده Matrix برای بسته‌های قدیمی کانال شخص ثالث؛ Pluginهای جدید باید مستقیماً `plugin-sdk/run-command` را import کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ‌شده Mattermost برای بسته‌های قدیمی کانال شخص ثالث؛ Pluginهای جدید باید مستقیماً زیرمسیرهای عمومی SDK را import کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک فرمان/hook/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌کننده‌های مشترک pipeline مربوط به webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های import/binding تنبل زمان اجرا مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌کننده‌های اجرای فرایند |
    | `plugin-sdk/cli-runtime` | کمک‌کننده‌های قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌کننده شروع کلاینت آماده برای event-loop، RPC مربوط به CLI برای gateway، خطاهای پروتکل gateway، و کمک‌کننده‌های patch وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و نوع‌های پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌کننده‌های جست‌وجوی پیکربندی Plugin در زمان اجرا مانند `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌کننده‌های تغییر پیکربندی تراکنشی مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده‌های snapshot پیکربندی فرایند جاری مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و setterهای snapshot تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد Telegram همراه در دسترس نباشد |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink ارجاع فایل بدون barrel گسترده متن |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های تأیید exec/Plugin، سازنده‌های قابلیت تأیید، کمک‌کننده‌های auth/profile، کمک‌کننده‌های native routing/runtime، و قالب‌بندی مسیر نمایش ساختاریافته تأیید |
    | `plugin-sdk/reply-runtime` | کمک‌کننده‌های مشترک زمان اجرای inbound/reply، تکه‌بندی، dispatch، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود dispatch/finalize پاسخ و برچسب گفت‌وگو |
    | `plugin-sdk/reply-history` | کمک‌کننده‌ها و markerهای مشترک reply-history با پنجره کوتاه مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry` و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌کننده‌های محدود تکه‌بندی متن/Markdown |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های مسیر ذخیره session، کلید session، زمان به‌روزرسانی، و تغییر store |
    | `plugin-sdk/cron-store-runtime` | کمک‌کننده‌های مسیر/load/save ذخیره Cron |
    | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر پوشه State/OAuth |
    | `plugin-sdk/routing` | کمک‌کننده‌های route/session-key/account binding مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌کننده‌های مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های runtime-state، و کمک‌کننده‌های metadata مسئله |
    | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های مشترک target resolver |
    | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج stdout/stderr نرمال‌سازی‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های رایج پارامتر ابزار/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌سازی‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای canonical هدف ارسال از آرگومان‌های ابزار |
    | `plugin-sdk/temp-path` | کمک‌کننده‌های مشترک مسیر دانلود موقت و workspaceهای موقت امن خصوصی |
    | `plugin-sdk/logging-core` | کمک‌کننده‌های ثبت‌کننده گزارش زیرسیستم و redaction |
    | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | کمک‌کننده‌های override مدل/session مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌کننده‌های حل پیکربندی ارائه‌دهنده Talk |
    | `plugin-sdk/json-store` | کمک‌کننده‌های کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/file-lock` | کمک‌کننده‌های file-lock بازدرآیند |
    | `plugin-sdk/persistent-dedupe` | کمک‌کننده‌های کش dedupe پشتیبانی‌شده با دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌کننده‌های زمان اجرا/session و reply-dispatch مربوط به ACP |
    | `plugin-sdk/acp-runtime-backend` | کمک‌کننده‌های سبک ثبت backend و reply-dispatch مربوط به ACP برای Pluginهایی که هنگام startup بارگذاری می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل binding فقط‌خواندنی ACP بدون importهای lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود schema پیکربندی زمان اجرای agent |
    | `plugin-sdk/boolean-param` | خواننده سهل‌گیر پارامتر boolean |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌کننده‌های حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌کننده‌های bootstrap دستگاه و توکن pairing |
    | `plugin-sdk/extension-shared` | primitiveهای مشترک کمک‌کننده برای passive-channel، وضعیت، و ambient proxy |
    | `plugin-sdk/models-provider-runtime` | کمک‌کننده‌های پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌کننده‌های فهرست کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | کمک‌کننده‌های registry/build/serialize فرمان native |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورد اعتماد برای harnessهای سطح پایین agent: نوع‌های harness، کمک‌کننده‌های steer/abort اجرای فعال، کمک‌کننده‌های پل ابزار OpenClaw، کمک‌کننده‌های سیاست ابزار runtime-plan، طبقه‌بندی نتیجه terminal، کمک‌کننده‌های قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | نمای منسوخ‌شده تشخیص endpoint متعلق به ارائه‌دهنده Z.AI؛ از API عمومی Plugin مربوط به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | کمک‌کننده قفل async محلی فرایند برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | کمک‌کننده telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌کننده هم‌روندی task async محدود |
    | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های کش dedupe در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده drain تحویل‌های در انتظار outbound |
    | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های امن مسیر local-file و media-source |
    | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های wake، event و visibility مربوط به Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌کننده coercion عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌کننده‌های توکن/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | کمک‌کننده انتظار برای آمادگی transport |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ‌شده؛ از زیرمسیرهای متمرکز زمان اجرای بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌کننده‌های کوچک کش محدود |
    | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های diagnostic flag، event و trace-context |
    | `plugin-sdk/error-runtime` | کمک‌کننده‌های graph خطا، قالب‌بندی، طبقه‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | کمک‌کننده‌های fetch پوشانده‌شده، proxy، گزینه EnvHttpProxyAgent، و lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود response-body بدون سطح گسترده زمان اجرای media |
    | `plugin-sdk/session-binding-runtime` | وضعیت binding گفت‌وگوی جاری بدون مسیریابی binding پیکربندی‌شده یا storeهای pairing |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های session-store بدون importهای گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | حل context visibility و فیلتر کردن context تکمیلی بدون importهای گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌کننده‌های محدود coercion و نرمال‌سازی record/string primitive بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی hostname و host مربوط به SCP |
    | `plugin-sdk/retry-runtime` | کمک‌کننده‌های پیکربندی retry و اجراکننده retry |
    | `plugin-sdk/agent-runtime` | کمک‌کننده‌های پوشه/identity/workspace مربوط به agent، از جمله `resolveAgentDir`، `resolveDefaultAgentDir`، و export سازگاری منسوخ‌شده `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | query/dedup پوشه پشتیبانی‌شده با پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | راهکارهای کمکی مشترک برای واکشی/تبدیل/ذخیرهٔ رسانه، بررسی ابعاد ویدیو مبتنی بر ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-mime` | نرمال‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME، و راهکارهای کمکی نوع رسانه |
    | `plugin-sdk/media-store` | راهکارهای کمکی محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | راهکارهای کمکی مشترک برای failover تولید رسانه، انتخاب candidate، و پیام‌رسانی مدلِ ناموجود |
    | `plugin-sdk/media-understanding` | انواع provider برای درک رسانه به‌همراه خروجی‌های کمکی تصویر/صوت روبه‌روی provider |
    | `plugin-sdk/text-chunking` | راهکارهای کمکی قطعه‌بندی/رندر متن و markdown، تبدیل جدول markdown، حذف tagهای directive، و ابزارهای متن ایمن |
    | `plugin-sdk/text-chunking` | راهکار کمکی قطعه‌بندی متن خروجی |
    | `plugin-sdk/speech` | انواع provider گفتار به‌همراه خروجی‌های directive، registry، اعتبارسنجی، سازندهٔ TTS سازگار با OpenAI، و راهکارهای کمکی گفتار روبه‌روی provider |
    | `plugin-sdk/speech-core` | انواع مشترک provider گفتار، registry، directive، نرمال‌سازی، و خروجی‌های کمکی گفتار |
    | `plugin-sdk/realtime-transcription` | انواع provider رونویسی realtime، راهکارهای کمکی registry، و راهکار کمکی مشترک جلسهٔ WebSocket |
    | `plugin-sdk/realtime-voice` | انواع provider صدای realtime و راهکارهای کمکی registry |
    | `plugin-sdk/image-generation` | انواع provider تولید تصویر به‌همراه راهکارهای کمکی دارایی تصویر/data URL و سازندهٔ provider تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | انواع مشترک تولید تصویر، failover، احراز هویت، و راهکارهای کمکی registry |
    | `plugin-sdk/music-generation` | انواع provider/request/result تولید موسیقی |
    | `plugin-sdk/music-generation-core` | انواع مشترک تولید موسیقی، راهکارهای کمکی failover، جست‌وجوی provider، و تجزیهٔ model-ref |
    | `plugin-sdk/video-generation` | انواع provider/request/result تولید ویدیو |
    | `plugin-sdk/video-generation-core` | انواع مشترک تولید ویدیو، راهکارهای کمکی failover، جست‌وجوی provider، و تجزیهٔ model-ref |
    | `plugin-sdk/webhook-targets` | registry هدف Webhook و راهکارهای کمکی نصب route |
    | `plugin-sdk/webhook-path` | alias سازگاری منسوخ؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | راهکارهای کمکی مشترک بارگذاری رسانهٔ remote/local |
    | `plugin-sdk/zod` | بازصدور سازگاری منسوخ؛ `zod` را مستقیماً از `zod` import کنید |
    | `plugin-sdk/testing` | barrel سازگاری منسوخ محلیِ مخزن برای تست‌های legacy OpenClaw. تست‌های جدید مخزن باید در عوض زیرمسیرهای محلی متمرکز تست مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | راهکار کمکی حداقلی و محلیِ مخزن `createTestPluginApi` برای تست‌های واحد ثبت مستقیم Plugin، بدون import کردن bridgeهای کمکی تست مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime محلیِ مخزن برای تست‌های auth، delivery، fallback، tool-hook، prompt-overlay، schema، و transcript projection |
    | `plugin-sdk/channel-test-helpers` | راهکارهای کمکی تست کانال‌محور محلیِ مخزن برای قراردادهای generic actions/setup/status، assertionهای directory، چرخهٔ عمر startup حساب، threading مربوط به send-config، mockهای runtime، issueهای status، delivery خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعهٔ مشترک محلیِ مخزن برای حالت‌های خطای target-resolution در تست‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | راهکارهای کمکی قرارداد محلیِ مخزن برای package، registration، artifact عمومی، import مستقیم، runtime API، و عوارض جانبی import در Plugin |
    | `plugin-sdk/provider-test-contracts` | راهکارهای کمکی قرارداد محلیِ مخزن برای runtime، auth، discovery، onboard، catalog، wizard، قابلیت رسانه، سیاست replay، realtime STT live-audio، web-search/fetch، و stream در provider |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/auth اختیاری Vitest و محلیِ مخزن برای تست‌های provider که `plugin-sdk/provider-http` را exercise می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی محلیِ مخزن برای capture زمان اجرای CLI، زمینهٔ sandbox، skill writer، agent-message، system-event، reload ماژول، مسیر Plugin همراه، terminal-text، chunking، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | راهکارهای کمکی mock متمرکز برای builtinهای Node و محلیِ مخزن جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح راهکارهای کمکی memory-core همراه برای راهکارهای کمکی manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای index/search حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های engine foundation میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی registry، provider محلی، و راهکارهای کمکی batch/remote عمومی |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های engine QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های engine storage میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | راهکارهای کمکی multimodal میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | راهکارهای کمکی query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | راهکارهای کمکی secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | alias سازگاری منسوخ؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | راهکارهای کمکی status میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | راهکارهای کمکی زمان اجرای CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | راهکارهای کمکی زمان اجرای core میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | راهکارهای کمکی file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | alias بی‌طرف نسبت به vendor برای راهکارهای کمکی زمان اجرای core میزبان حافظه |
    | `plugin-sdk/memory-host-events` | alias بی‌طرف نسبت به vendor برای راهکارهای کمکی journal رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | alias سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | راهکارهای کمکی managed-markdown مشترک برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | facade زمان اجرای active memory برای دسترسی به search-manager |
    | `plugin-sdk/memory-host-status` | alias سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشدهٔ راهکار کمکی همراه">
    در حال حاضر هیچ زیرمسیر SDK رزروشده‌ای برای راهکارهای کمکی همراه وجود ندارد. راهکارهای کمکی owner-specific
    داخل package مالک Plugin قرار دارند، درحالی‌که قراردادهای میزبان قابل استفادهٔ مجدد
    از زیرمسیرهای عمومی SDK مانند `plugin-sdk/gateway-runtime`،
    `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
