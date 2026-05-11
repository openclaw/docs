---
read_when:
    - انتخاب زیرمسیر درست plugin-sdk برای وارد کردن Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و سطوح کمکی
summary: 'کاتالوگ زیرمسیرهای Plugin SDK: اینکه کدام واردسازی‌ها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:40:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin به‌صورت مجموعه‌ای از زیردر مسیرهای عمومی محدود زیر
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیردر مسیرهای رایج را بر اساس
هدف فهرست می‌کند. موجودی تولیدشدهٔ نقاط ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های بسته، زیرمجموعهٔ عمومی
پس از کسر زیردر مسیرهای آزمون/داخلی مخصوص مخزن هستند که در
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` فهرست شده‌اند. نگه‌دارندگان می‌توانند
تعداد خروجی‌های عمومی را با `pnpm plugin-sdk:surface` و زیردر مسیرهای کمک‌رسان
رزرو‌شدهٔ فعال را با `pnpm plugins:boundary-report:summary` بازبینی کنند؛ خروجی‌های
کمک‌رسان رزرو‌شدهٔ استفاده‌نشده، به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی
سازگاری غیرفعال، گزارش CI را ناموفق می‌کنند.

برای راهنمای نگارش Plugin، [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) را ببینید.

## ورود Plugin

| زیردر مسیر                     | خروجی‌های کلیدی                                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | کمک‌رسان‌های آیتم ارائه‌دهندهٔ مهاجرت مانند `createMigrationItem`، ثابت‌های دلیل، نشانگرهای وضعیت آیتم، کمک‌رسان‌های ویرایش محرمانه، و `summarizeMigrationItems`       |
| `plugin-sdk/migration-runtime` | کمک‌رسان‌های مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                             |

### کمک‌رسان‌های منسوخ‌شدهٔ سازگاری و آزمون

این زیردر مسیرها همچنان برای Pluginهای قدیمی‌تر و مجموعه‌آزمون‌های OpenClaw
خروجی بسته باقی می‌مانند، اما کد جدید نباید import از آن‌ها اضافه کند:
`agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, و `zod`. در کد Plugin جدید، `zod` را مستقیما از `zod` import کنید.
`plugin-test-runtime` همچنان یک زیردر مسیر کمک‌رسان آزمون متمرکز و فعال است.

### زیردر مسیرهای عمومی منسوخ‌شدهٔ استفاده‌نشده

این زیردر مسیرهای عمومی دست‌کم یک ماه وجود داشته‌اند و در حال حاضر هیچ import
تولیدی از extensionهای همراه ندارند. آن‌ها برای سازگاری همچنان قابل import هستند،
اما کد Plugin جدید باید به‌جای آن‌ها از زیردر مسیرهای SDK متمرکز و فعالانه مصرف‌شده
استفاده کند:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, و `zalouser`.

### زیردر مسیرهای عمومی منسوخ‌شدهٔ کم‌کاربرد

زیردر مسیرهای عمومی که در حال حاضر فقط توسط یک یا دو مالک Plugin همراه استفاده
می‌شوند نیز برای کد Plugin جدید منسوخ‌شده‌اند. آن‌ها برای سازگاری همچنان خروجی
بسته باقی می‌مانند، اما کد جدید باید درزهای SDK فعالانه مشترک یا APIهای بستهٔ
متعلق به Plugin را ترجیح دهد. نگه‌دارندگان مجموعهٔ دقیق را در
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` و بودجهٔ فعلی را با
`pnpm plugin-sdk:surface` پیگیری می‌کنند.

### barrelهای گستردهٔ منسوخ‌شده

این barrelهای بازصادرات گسترده همچنان برای منبع OpenClaw و بررسی‌های سازگاری
قابل build باقی می‌مانند، اما کد جدید باید زیردر مسیرهای SDK متمرکز را ترجیح دهد:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, و
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
و `text-runtime` فقط برای سازگاری رو به عقب، خروجی بسته باقی می‌مانند؛ به‌جای آن‌ها
از زیردر مسیرهای متمرکز channel/runtime، `config-contracts`، `string-coerce-runtime`،
`text-chunking`، `text-utility-runtime`، و `logging-core` استفاده کنید.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export مربوط به schema ریشه‌ای Zod در `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | کمک‌کننده اعتبارسنجی JSON Schema کش‌شده برای schemaهای متعلق به Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌کننده‌های مشترک جادوگر راه‌اندازی، اعلان‌های allowlist، سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌کننده‌های پیکربندی چندحسابی/action-gate، کمک‌کننده‌های fallback حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌کننده‌های عادی‌سازی شناسه حساب |
    | `plugin-sdk/account-resolution` | کمک‌کننده‌های جست‌وجوی حساب + fallback پیش‌فرض |
    | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | کمک‌کننده‌های تجزیه allowlist گروه دسترسی و diagnostics گروه redacted |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | کمک‌کننده‌های legacy خط لوله پاسخ. کد جدید خط لوله پاسخ channel باید از `createChannelMessageReplyPipeline` و `resolveChannelMessageSourceReplyDeliveryMode` از `plugin-sdk/channel-message` استفاده کند. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitiveهای مشترک schema پیکربندی channel به‌علاوه سازنده‌های Zod و مستقیم JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | schemaهای پیکربندی channel همراه OpenClaw فقط برای Pluginهای همراه نگهداری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای schemaهای پیکربندی channel همراه |
    | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های عادی‌سازی/اعتبارسنجی فرمان سفارشی Telegram با fallback قرارداد همراه |
    | `plugin-sdk/command-gating` | کمک‌کننده‌های محدود gate مجوزدهی فرمان |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | نمای سازگاری سطح پایین و منسوخ ingress کانال. مسیرهای دریافت جدید باید از `plugin-sdk/channel-ingress-runtime` استفاده کنند. |
    | `plugin-sdk/channel-ingress-runtime` | resolver آزمایشی runtime سطح بالای ingress کانال و سازنده‌های fact مسیر برای مسیرهای دریافت کانال مهاجرت‌کرده. این را به سرهم‌کردن allowlistهای مؤثر، allowlistهای فرمان، و projectionهای legacy در هر Plugin ترجیح دهید. [API ingress کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، `createChannelRunQueue`، و کمک‌کننده‌های legacy چرخه عمر draft stream. کد جدید نهایی‌سازی پیش‌نمایش باید از `plugin-sdk/channel-message` استفاده کند. |
    | `plugin-sdk/channel-message` | کمک‌کننده‌های ارزان قرارداد چرخه عمر پیام مانند `defineChannelMessageAdapter`، `createChannelMessageAdapterFromOutbound`، `createChannelMessageReplyPipeline`، `createReplyPrefixContext`، `resolveChannelMessageSourceReplyDeliveryMode`، استخراج قابلیت durable-final، کمک‌کننده‌های اثبات قابلیت برای قابلیت‌های send/receipt/side-effect، `MessageReceiveContext`، اثبات‌های سیاست ack دریافت، `defineFinalizableLivePreviewAdapter`، `deliverWithFinalizableLivePreviewAdapter`، اثبات‌های قابلیت live-preview و live-finalizer، وضعیت durable recovery، `RenderedMessageBatch`، نوع‌های رسید پیام، و کمک‌کننده‌های شناسه رسید. [API پیام کانال](/fa/plugins/sdk-channel-message) را ببینید. نماهای legacy reply-dispatch فقط سازگاری منسوخ هستند. |
    | `plugin-sdk/channel-message-runtime` | کمک‌کننده‌های تحویل runtime که ممکن است تحویل خروجی را بارگذاری کنند، از جمله `deliverInboundReplyWithMessageSendContext`، `sendDurableMessageBatch`، و `withDurableMessageSendContext`. پل‌های منسوخ reply-dispatch همچنان فقط برای dispatcherهای سازگاری قابل import هستند. از ماژول‌های runtime پایش/ارسال استفاده کنید، نه فایل‌های bootstrap داغ Plugin. |
    | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های مشترک route ورودی + سازنده envelope |
    | `plugin-sdk/inbound-reply-dispatch` | کمک‌کننده‌های legacy مشترک ثبت و dispatch ورودی، predicateهای dispatch قابل‌مشاهده/نهایی، و سازگاری منسوخ `deliverDurableInboundReplyPayload` برای dispatcherهای channel آماده. کد جدید دریافت/dispatch کانال باید کمک‌کننده‌های runtime چرخه عمر را از `plugin-sdk/channel-message-runtime` import کند. |
    | `plugin-sdk/messaging-targets` | کمک‌کننده‌های تجزیه/تطبیق target |
    | `plugin-sdk/outbound-media` | کمک‌کننده‌های مشترک بارگذاری رسانه خروجی |
    | `plugin-sdk/outbound-send-deps` | جست‌وجوی سبک وابستگی ارسال خروجی برای adapterهای کانال |
    | `plugin-sdk/outbound-runtime` | کمک‌کننده‌های هویت خروجی، delegate ارسال، نشست، قالب‌بندی، و برنامه‌ریزی payload. کمک‌کننده‌های تحویل مستقیم مانند `deliverOutboundPayloads` زیرلایه سازگاری منسوخ هستند؛ برای مسیرهای ارسال جدید از `plugin-sdk/channel-message-runtime` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | کمک‌کننده‌های محدود عادی‌سازی poll |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های چرخه عمر و adapter مربوط به اتصال thread |
    | `plugin-sdk/agent-media-payload` | سازنده legacy payload رسانه عامل |
    | `plugin-sdk/conversation-runtime` | کمک‌کننده‌های اتصال، pairing، و configured-binding مکالمه/thread |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده snapshot پیکربندی runtime |
    | `plugin-sdk/runtime-group-policy` | کمک‌کننده‌های resolution سیاست گروه runtime |
    | `plugin-sdk/channel-status` | کمک‌کننده‌های مشترک snapshot/خلاصه وضعیت channel |
    | `plugin-sdk/channel-config-primitives` | primitiveهای محدود schema پیکربندی channel |
    | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های مجوزدهی نوشتن پیکربندی channel |
    | `plugin-sdk/channel-plugin-common` | exportهای prelude مشترک Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های ویرایش/خواندن پیکربندی allowlist |
    | `plugin-sdk/group-access` | کمک‌کننده‌های مشترک تصمیم‌گیری دسترسی گروه |
    | `plugin-sdk/direct-dm` | کمک‌کننده‌های مشترک auth/guard برای DM مستقیم |
    | `plugin-sdk/discord` | نمای سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک ردیابی‌شده؛ Pluginهای جدید باید از زیرمسیرهای SDK عمومی channel استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ resolution حساب Telegram برای سازگاری مالک ردیابی‌شده؛ Pluginهای جدید باید از کمک‌کننده‌های runtime تزریق‌شده یا زیرمسیرهای SDK عمومی channel استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ Zalo Personal برای بسته‌های منتشرشده Lark/Zalo که هنوز مجوزدهی فرمان فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های ارائه معنایی پیام، تحویل، و پاسخ تعاملی legacy. [ارائه پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | barrel سازگاری برای debounce ورودی، تطبیق mention، کمک‌کننده‌های سیاست mention، و کمک‌کننده‌های envelope |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌کننده‌های محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌کننده‌های محدود سیاست mention، نشانگر mention، و متن mention بدون سطح گسترده‌تر runtime ورودی |
    | `plugin-sdk/channel-envelope` | کمک‌کننده‌های محدود قالب‌بندی envelope ورودی |
    | `plugin-sdk/channel-location` | کمک‌کننده‌های زمینه و قالب‌بندی موقعیت channel |
    | `plugin-sdk/channel-logging` | کمک‌کننده‌های logging کانال برای dropهای ورودی و شکست‌های typing/ack |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | کمک‌کننده‌های اقدام پیام کانال، به‌علاوه کمک‌کننده‌های منسوخ schema بومی که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | عادی‌سازی مشترک route، resolution هدف مبتنی بر parser، stringification شناسه thread، کلیدهای route برای dedupe/compact، نوع‌های parsed-target، و کمک‌کننده‌های مقایسه route/target |
    | `plugin-sdk/channel-targets` | کمک‌کننده‌های تجزیه target؛ فراخوان‌های مقایسه route باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های قرارداد channel |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/reaction |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود قرارداد secret مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، و نوع‌های target مخفی |
  </Accordion>

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شدهٔ ارائه‌دهندهٔ LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای پشتیبانی‌شدهٔ زمان اجرای LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌سازهای مدل‌های بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌سازهای گزینش‌شدهٔ راه‌اندازی ارائه‌دهندهٔ محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌سازهای متمرکز راه‌اندازی ارائه‌دهندهٔ خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های پشتیبان CLI + ثابت‌های دیده‌بان |
    | `plugin-sdk/provider-auth-runtime` | کمک‌سازهای رفع کلید API در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-auth-api-key` | کمک‌سازهای ورود اولیه/نوشتن پروفایل برای کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازندهٔ استاندارد نتیجهٔ احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | کمک‌سازهای جست‌وجوی متغیرهای محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, خروجی سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌سازهای نقطهٔ پایانی ارائه‌دهنده، و کمک‌سازهای مشترک نرمال‌سازی شناسهٔ مدل |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای تکمیل کاتالوگ ارائه‌دهنده و مرزهای رجیستری Plugin-ارائه‌دهنده برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌سازهای عمومی قابلیت HTTP/نقطهٔ پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌سازهای فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌سازهای محدود قرارداد پیکربندی/انتخاب web-fetch مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌سازهای ثبت/کش ارائه‌دهندهٔ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌سازهای محدود پیکربندی/اعتبارنامهٔ web-search برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌سازهای محدود قرارداد پیکربندی/اعتبارنامهٔ web-search مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامهٔ محدود به دامنه |
    | `plugin-sdk/provider-web-search` | کمک‌سازهای ثبت/کش/زمان اجرای ارائه‌دهندهٔ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, و پاک‌سازی طرح‌وارهٔ Gemini + عیب‌یابی |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, انواع پوشش‌دهندهٔ جریان، و کمک‌سازهای مشترک پوشش‌دهندهٔ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | کمک‌سازهای انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌سازهای وصلهٔ پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | کمک‌سازهای تک‌نمونه/نگاشت/کش محلیِ فرایند |
    | `plugin-sdk/group-activation` | کمک‌سازهای محدود حالت فعال‌سازی گروه و تجزیهٔ فرمان |
  </Accordion>

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, کمک‌سازهای رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا، کمک‌سازهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌سازهای رفع تأییدکننده و احراز هویت اقدام در همان گفت‌وگو |
    | `plugin-sdk/approval-client-runtime` | کمک‌سازهای پروفایل/فیلتر تأیید اجرای بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌ساز مشترک رفع Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌سازهای سبک بارگذاری آداپتور تأیید بومی برای نقاط ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌سازهای گسترده‌تر زمان اجرای هندلر تأیید؛ وقتی مرزهای باریک‌تر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌سازهای هدف تأیید بومی + اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | کمک‌سازهای محتوای پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌سازهای محتوای تأیید exec/Plugin، کمک‌سازهای مسیریابی/زمان اجرای تأیید بومی، و کمک‌سازهای نمایش ساختاریافتهٔ تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌سازهای محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌سازهای محدود آزمون قرارداد کانال بدون barrel گستردهٔ آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی منوی آرگومان پویا، و کمک‌سازهای هدف جلسهٔ بومی |
    | `plugin-sdk/command-detection` | کمک‌سازهای مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنهٔ فرمان و کمک‌سازهای سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌سازهای محدود گردآوری قرارداد راز برای سطوح راز کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌سازهای محدود `coerceSecretRef` و تایپ SecretRef برای تجزیهٔ قرارداد راز/پیکربندی |
    | `plugin-sdk/security-runtime` | اعتماد مشترک، کنترل DM، کمک‌سازهای فایل/مسیر محدود به ریشه شامل نوشتن‌های فقط-ایجاد، جایگزینی اتمیک همگام/ناهمگام فایل، نوشتن‌های موقت هم‌ریشه، راهکار جایگزین جابه‌جایی میان‌دستگاهی، کمک‌سازهای انبار فایل خصوصی، محافظ‌های والد پیوند نمادین، محتوای خارجی، ویرایش متن حساس، مقایسهٔ راز با زمان ثابت، و کمک‌سازهای گردآوری راز |
    | `plugin-sdk/ssrf-policy` | کمک‌سازهای فهرست مجاز میزبان و سیاست SSRF شبکهٔ خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌سازهای محدود pinned-dispatcher بدون سطح گستردهٔ زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، fetch محافظت‌شده در برابر SSRF، خطای SSRF، و کمک‌سازهای سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌سازهای تجزیهٔ ورودی راز |
    | `plugin-sdk/webhook-ingress` | کمک‌سازهای درخواست/هدف Webhook و تبدیل خام websocket/body |
    | `plugin-sdk/webhook-request-guards` | کمک‌سازهای اندازهٔ بدنهٔ درخواست/مهلت زمانی |
  </Accordion>

  <Accordion title="زیرمسیرهای زمان اجرا و ذخیره‌سازی">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌کننده‌های گسترده زمان اجرا/ثبت لاگ/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود env زمان اجرا، logger، timeout، retry و backoff |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای profile/defaults نرمال‌شده، تجزیه URL مربوط به CDP، و کمک‌کننده‌های auth برای کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های عمومی ثبت و جست‌وجوی runtime-context کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ Matrix برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیما `plugin-sdk/run-command` را import کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ Mattermost برای بسته‌های کانال شخص ثالث قدیمی‌تر؛ Pluginهای جدید باید مستقیما زیرمسیرهای عمومی SDK را import کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک فرمان/hook/http/interactive مربوط به Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌کننده‌های مشترک خط لوله Webhook/hook داخلی |
    | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های import/binding تنبل زمان اجرا مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌کننده‌های اجرای فرایند |
    | `plugin-sdk/cli-runtime` | کمک‌کننده‌های قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌کننده شروع کلاینت آماده برای حلقه رویداد، RPC مربوط به CLI Gateway، خطاهای پروتکل Gateway، و کمک‌کننده‌های patch وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط نوعی برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌کننده‌های جست‌وجوی پیکربندی Plugin در زمان اجرا مانند `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌کننده‌های جهش تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده‌های snapshot پیکربندی فرایند فعلی مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و setterهای snapshot تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد Telegram همراه در دسترس نباشد |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink ارجاع فایل بدون barrel گسترده متن |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های تایید اجرا/Plugin، سازنده‌های قابلیت تایید، کمک‌کننده‌های auth/profile، کمک‌کننده‌های مسیریابی/زمان اجرای native، و قالب‌بندی مسیر نمایش تایید ساختاریافته |
    | `plugin-sdk/reply-runtime` | کمک‌کننده‌های مشترک زمان اجرای ورودی/پاسخ، قطعه‌بندی، dispatch، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود dispatch/finalize پاسخ و برچسب مکالمه |
    | `plugin-sdk/reply-history` | کمک‌کننده‌های مشترک تاریخچه پاسخ با پنجره کوتاه و نشانگرهایی مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry` و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌کننده‌های محدود قطعه‌بندی متن/markdown |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های مسیر ذخیره نشست، session-key، updated-at و جهش store |
    | `plugin-sdk/cron-store-runtime` | کمک‌کننده‌های مسیر/بارگذاری/ذخیره store مربوط به Cron |
    | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر dir مربوط به state/OAuth |
    | `plugin-sdk/routing` | کمک‌کننده‌های route/session-key/account binding مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌کننده‌های مشترک خلاصه وضعیت کانال/account، پیش‌فرض‌های runtime-state، و کمک‌کننده‌های metadata مسئله |
    | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های مشترک target resolver |
    | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج stdout/stderr نرمال‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های رایج پارامتر tool/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌شده از شیءهای نتیجه tool |
    | `plugin-sdk/tool-send` | استخراج فیلدهای متعارف target ارسال از آرگومان‌های tool |
    | `plugin-sdk/temp-path` | کمک‌کننده‌های مشترک مسیر temp-download و فضاهای کاری temp امن خصوصی |
    | `plugin-sdk/logging-core` | logger زیرسامانه و کمک‌کننده‌های redaction |
    | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | کمک‌کننده‌های override مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌کننده‌های حل پیکربندی ارائه‌دهنده Talk |
    | `plugin-sdk/json-store` | کمک‌کننده‌های کوچک خواندن/نوشتن state در JSON |
    | `plugin-sdk/file-lock` | کمک‌کننده‌های file-lock بازدرون‌شونده |
    | `plugin-sdk/persistent-dedupe` | کمک‌کننده‌های cache حذف تکرار با پشتوانه دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌کننده‌های زمان اجرا/نشست و reply-dispatch مربوط به ACP |
    | `plugin-sdk/acp-runtime-backend` | کمک‌کننده‌های سبک ثبت backend و reply-dispatch مربوط به ACP برای Pluginهایی که هنگام startup بارگذاری می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل binding فقط‌خواندنی ACP بدون importهای startup چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود schema پیکربندی زمان اجرای عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر boolean منعطف |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌کننده‌های حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌کننده‌های راه‌اندازی اولیه دستگاه و توکن pairing |
    | `plugin-sdk/extension-shared` | primitiveهای مشترک کمک‌کننده passive-channel، status و ambient proxy |
    | `plugin-sdk/models-provider-runtime` | کمک‌کننده‌های پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌کننده‌های فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | کمک‌کننده‌های registry/build/serialize فرمان native |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin معتمد برای harnessهای سطح پایین عامل: انواع harness، کمک‌کننده‌های steer/abort اجرای فعال، کمک‌کننده‌های bridge ابزار OpenClaw، کمک‌کننده‌های سیاست ابزار runtime-plan، طبقه‌بندی نتیجه ترمینال، کمک‌کننده‌های قالب‌بندی/جزئیات پیشرفت ابزار، و utilityهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | نمای منسوخ تشخیص endpoint متعلق به ارائه‌دهنده Z.AI؛ از API عمومی Plugin مربوط به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | کمک‌کننده قفل async محلی فرایند برای فایل‌های کوچک state زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | کمک‌کننده telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌کننده همروندی task async محدود |
    | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های cache حذف تکرار در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده تخلیه pending-delivery خروجی |
    | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های امن مسیر فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های wake، event و visibility مربوط به Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌کننده تبدیل عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌کننده‌های توکن/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | کمک‌کننده انتظار برای آماده‌بودن transport |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ؛ از زیرمسیرهای متمرکز زمان اجرا در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌کننده‌های cache محدود کوچک |
    | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های flag تشخیصی، رویداد و trace-context |
    | `plugin-sdk/error-runtime` | گراف خطا، قالب‌بندی، کمک‌کننده‌های مشترک طبقه‌بندی خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch بسته‌بندی‌شده، proxy، گزینه EnvHttpProxyAgent، و کمک‌کننده‌های lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود response-body بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت binding مکالمه فعلی بدون مسیریابی binding پیکربندی‌شده یا storeهای pairing |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های session-store بدون importهای گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | حل visibility زمینه و فیلترکردن زمینه تکمیلی بدون importهای گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌کننده‌های محدود coercion و نرمال‌سازی primitive record/string بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی hostname و host مربوط به SCP |
    | `plugin-sdk/retry-runtime` | کمک‌کننده‌های پیکربندی retry و runner retry |
    | `plugin-sdk/agent-runtime` | کمک‌کننده‌های dir/identity/workspace عامل، شامل `resolveAgentDir`، `resolveDefaultAgentDir` و export سازگاری منسوخ `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | query/dedup دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | برون‌دادهای کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | راهنماهای مشترک دریافت/تبدیل/ذخیرهٔ رسانه، بررسی ابعاد ویدئو با پشتوانهٔ ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-mime` | عادی‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME، و راهنماهای نوع رسانه |
    | `plugin-sdk/media-store` | راهنماهای محدود ذخیرهٔ رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | راهنماهای مشترک failover برای تولید رسانه، انتخاب نامزد، و پیام‌رسانی مدلِ ناموجود |
    | `plugin-sdk/media-understanding` | نوع‌های فراهم‌کنندهٔ درک رسانه به‌همراه برون‌دادهای راهنمای تصویر/صدا/استخراج ساخت‌یافته برای فراهم‌کننده‌ها |
    | `plugin-sdk/text-chunking` | راهنماهای قطعه‌بندی/رندر متن و markdown، تبدیل جدول markdown، حذف برچسب‌های directive، و ابزارهای متن امن |
    | `plugin-sdk/text-chunking` | راهنمای قطعه‌بندی متن خروجی |
    | `plugin-sdk/speech` | نوع‌های فراهم‌کنندهٔ گفتار به‌همراه برون‌دادهای directive، registry، اعتبارسنجی، سازندهٔ TTS سازگار با OpenAI، و راهنماهای گفتار برای فراهم‌کننده‌ها |
    | `plugin-sdk/speech-core` | برون‌دادهای مشترک نوع‌های فراهم‌کنندهٔ گفتار، registry، directive، عادی‌سازی، و راهنماهای گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های فراهم‌کنندهٔ رونویسی بلادرنگ، راهنماهای registry، و راهنمای مشترک نشست WebSocket |
    | `plugin-sdk/realtime-voice` | نوع‌های فراهم‌کنندهٔ صدای بلادرنگ و راهنماهای registry |
    | `plugin-sdk/image-generation` | نوع‌های فراهم‌کنندهٔ تولید تصویر به‌همراه راهنماهای asset تصویر/data URL و سازندهٔ فراهم‌کنندهٔ تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌های مشترک تولید تصویر، failover، auth، و راهنماهای registry |
    | `plugin-sdk/music-generation` | نوع‌های فراهم‌کننده/درخواست/نتیجهٔ تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، راهنماهای failover، جست‌وجوی فراهم‌کننده، و تجزیهٔ model-ref |
    | `plugin-sdk/video-generation` | نوع‌های فراهم‌کننده/درخواست/نتیجهٔ تولید ویدئو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدئو، راهنماهای failover، جست‌وجوی فراهم‌کننده، و تجزیهٔ model-ref |
    | `plugin-sdk/webhook-targets` | registry هدف Webhook و راهنماهای نصب route |
    | `plugin-sdk/webhook-path` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | راهنماهای مشترک بارگذاری رسانهٔ دور/محلی |
    | `plugin-sdk/zod` | بازصدور سازگاری منسوخ؛ `zod` را مستقیماً از `zod` وارد کنید |
    | `plugin-sdk/testing` | barrel سازگاری منسوخِ محلیِ مخزن برای آزمایش‌های قدیمی OpenClaw. آزمایش‌های جدید مخزن باید به‌جای آن زیرمسیرهای محلی متمرکز مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | راهنمای حداقلی محلیِ مخزن `createTestPluginApi` برای آزمایش‌های واحد ثبت مستقیم Plugin بدون import کردن پل‌های راهنمای آزمایش مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد آداپتور agent-runtime بومی و محلیِ مخزن برای آزمایش‌های auth، تحویل، fallback، tool-hook، prompt-overlay، schema، و تصویرسازی transcript |
    | `plugin-sdk/channel-test-helpers` | راهنماهای آزمایشی کانال‌محور محلیِ مخزن برای قراردادهای عمومی actions/setup/status، assertionهای directory، چرخهٔ حیات startup حساب، send-config threading، mockهای runtime، issueهای status، تحویل خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعهٔ مشترک محلیِ مخزن برای حالت‌های خطای target-resolution در آزمایش‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | راهنماهای قرارداد package، registration، artifact عمومی، import مستقیم، runtime API، و side-effectهای import برای Plugin محلیِ مخزن |
    | `plugin-sdk/provider-test-contracts` | راهنماهای قرارداد runtime، auth، discovery، onboard، catalog، wizard، قابلیت رسانه، سیاست replay، صدای زندهٔ realtime STT، web-search/fetch، و stream برای فراهم‌کنندهٔ محلیِ مخزن |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/auth اختیاری Vitest محلیِ مخزن برای آزمایش‌های فراهم‌کننده که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی محلیِ مخزن برای CLI runtime capture، sandbox context، skill writer، agent-message، system-event، module reload، bundled plugin path، terminal-text، chunking، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | راهنماهای mock متمرکز برای builtinهای Node محلیِ مخزن جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | برون‌دادهای کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح راهنمای memory-core بسته‌بندی‌شده برای راهنماهای manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای index/search حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | برون‌دادهای موتور foundation میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی registry، فراهم‌کنندهٔ محلی، و راهنماهای عمومی batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | برون‌دادهای موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | برون‌دادهای موتور storage میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | راهنماهای multimodal میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | راهنماهای query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | راهنماهای secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | راهنماهای status میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | راهنماهای زمان اجرای CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | راهنماهای زمان اجرای core میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | راهنماهای file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار مستقل از فروشنده برای راهنماهای زمان اجرای core میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار مستقل از فروشنده برای راهنماهای event journal میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | راهنماهای مشترک managed-markdown برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | facade زمان اجرای Active Memory برای دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | نام مستعار سازگاری منسوخ؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای راهنمای بسته‌بندی‌شدهٔ رزروشده">
    در حال حاضر هیچ زیرمسیر SDK رزروشده‌ای برای راهنماهای بسته‌بندی‌شده وجود ندارد. راهنماهای خاص مالک
    داخل package مربوط به Plugin مالک قرار دارند، در حالی که قراردادهای میزبان قابل استفادهٔ مجدد
    از زیرمسیرهای عمومی SDK مانند `plugin-sdk/gateway-runtime`،
    `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
