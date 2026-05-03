---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای واردسازی Plugin
    - ممیزی زیرمسیرهای Pluginهای باندل‌شده و سطوح کمکی
summary: 'فهرست زیرمسیرهای کیت توسعهٔ نرم‌افزار Plugin: اینکه کدام واردسازی‌ها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-05-03T11:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود زیر `openclaw/plugin-sdk/` ارائه می‌شود.
  این صفحه زیرمسیرهای پرکاربرد را بر اساس هدف گروه‌بندی و فهرست می‌کند. فهرست کامل تولیدشدهٔ
  بیش از ۲۰۰ زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛
  زیرمسیرهای کمکی رزروشده برای Pluginهای بسته‌بندی‌شده در آنجا نمایش داده می‌شوند، اما جزئیات پیاده‌سازی
  محسوب می‌شوند مگر اینکه یک صفحهٔ مستندات صراحتاً آن‌ها را ترویج کند. نگه‌دارندگان می‌توانند زیرمسیرهای کمکی رزروشدهٔ فعال
  را با `pnpm plugins:boundary-report:summary` ممیزی کنند؛ خروجی‌های کمکی رزروشدهٔ استفاده‌نشده
  به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی سازگاری خاموش، گزارش CI را ناموفق می‌کنند.

  برای راهنمای ساخت Plugin، [مرور کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) را ببینید.

  ## ورودی Plugin

  | زیرمسیر                                   | خروجی‌های کلیدی                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | barrel سازگاری گسترده برای آزمون‌های قدیمی Plugin؛ برای آزمون‌های Plugin جدید، زیرمسیرهای آزمون متمرکز را ترجیح دهید                                                                     |
  | `plugin-sdk/plugin-test-api`              | سازندهٔ mock حداقلی `OpenClawPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای contract مربوط به آداپتور agent-runtime بومی برای پروفایل‌های احراز هویت، سرکوب تحویل، طبقه‌بندی fallback، قلاب‌های ابزار، هم‌پوشانی‌های prompt، schemaها و ترمیم transcript |
  | `plugin-sdk/channel-test-helpers`         | helperهای آزمون برای چرخهٔ عمر حساب کانال، directory، send-config، runtime mock، hook، ورودی کانال بسته‌بندی‌شده، timestamp پاکت، پاسخ pairing و contract عمومی کانال   |
  | `plugin-sdk/channel-target-testing`       | مجموعهٔ آزمون مشترک برای حالت‌های خطای target-resolution کانال                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | helperهای contract برای ثبت Plugin، package manifest، artifact عمومی، runtime API، import side-effect و import مستقیم                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixtureهای runtime مربوط به Plugin، registry، ثبت provider، setup-wizard و runtime task-flow برای آزمون‌ها                                                                      |
  | `plugin-sdk/provider-test-contracts`      | helperهای contract برای runtime مربوط به provider، احراز هویت، کشف، onboard، catalog، قابلیت رسانه، سیاست replay، صدای زندهٔ realtime STT، web-search/fetch و wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mockهای HTTP/auth اختیاری Vitest برای آزمون‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند                                                                                    |
  | `plugin-sdk/test-env`                     | fixtureهای محیط آزمون، fetch/network، سرور HTTP دورریختنی، درخواست ورودی، live-test، فایل‌سیستم موقت و time-control                                        |
  | `plugin-sdk/test-fixtures`                | fixtureهای آزمون عمومی برای CLI، sandbox، skill، agent-message، system-event، بارگذاری دوبارهٔ module، مسیر Plugin بسته‌بندی‌شده، terminal، chunking، auth-token و typed-case                   |
  | `plugin-sdk/test-node-mocks`              | helperهای متمرکز mock داخلی Node برای استفاده داخل factoryهای Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | helperهای آیتم provider مربوط به migration مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای وضعیت آیتم، helperهای redaction و `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | helperهای runtime مربوط به migration مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime` و `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی schema مربوط به Zod برای ریشهٔ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌علاوهٔ `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | helperهای مشترک setup wizard، promptهای allowlist، سازنده‌های وضعیت setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | helperهای پیکربندی چندحسابی/action-gate، helperهای fallback حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، helperهای عادی‌سازی account-id |
    | `plugin-sdk/account-resolution` | helperهای جست‌وجوی حساب + default-fallback |
    | `plugin-sdk/account-helpers` | helperهای محدود account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitiveهای مشترک schema پیکربندی کانال، به‌علاوهٔ سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | schemaهای پیکربندی کانال بسته‌بندی‌شدهٔ OpenClaw فقط برای Pluginهای بسته‌بندی‌شدهٔ نگه‌داری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | alias سازگاری منسوخ برای schemaهای پیکربندی کانال بسته‌بندی‌شده |
    | `plugin-sdk/telegram-command-config` | helperهای عادی‌سازی/اعتبارسنجی command سفارشی Telegram با fallback مبتنی بر bundled-contract |
    | `plugin-sdk/command-gating` | helperهای محدود gate برای مجوزدهی command |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، helperهای چرخهٔ عمر/نهایی‌سازی draft stream |
    | `plugin-sdk/inbound-envelope` | helperهای مشترک برای مسیر ورودی + سازندهٔ پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | helperهای مشترک ثبت و dispatch ورودی |
    | `plugin-sdk/messaging-targets` | helperهای parsing/matching هدف |
    | `plugin-sdk/outbound-media` | helperهای مشترک بارگذاری رسانهٔ خروجی |
    | `plugin-sdk/outbound-send-deps` | جست‌وجوی سبک dependency ارسال خروجی برای آداپتورهای کانال |
    | `plugin-sdk/outbound-runtime` | helperهای تحویل خروجی، هویت، delegate ارسال، session، formatting و برنامه‌ریزی payload |
    | `plugin-sdk/poll-runtime` | helperهای محدود عادی‌سازی poll |
    | `plugin-sdk/thread-bindings-runtime` | helperهای چرخهٔ عمر و آداپتور thread-binding |
    | `plugin-sdk/agent-media-payload` | سازندهٔ قدیمی payload رسانهٔ agent |
    | `plugin-sdk/conversation-runtime` | helperهای binding مکالمه/thread، pairing و binding پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | helper مربوط به snapshot پیکربندی runtime |
    | `plugin-sdk/runtime-group-policy` | helperهای resolution برای group-policy در runtime |
    | `plugin-sdk/channel-status` | helperهای مشترک snapshot/summary وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | primitiveهای محدود schema پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | helperهای مجوزدهی برای نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک prelude برای Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | helperهای ویرایش/خواندن پیکربندی allowlist |
    | `plugin-sdk/group-access` | helperهای مشترک تصمیم‌گیری group-access |
    | `plugin-sdk/direct-dm` | helperهای مشترک auth/guard برای direct-DM |
    | `plugin-sdk/discord` | facade سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | facade سازگاری منسوخ resolution حساب Telegram برای سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از helperهای runtime تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | facade سازگاری منسوخ Zalo Personal برای packageهای منتشرشدهٔ Lark/Zalo که هنوز authorization command فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | helperهای ارائهٔ معنایی پیام، تحویل و پاسخ interactive قدیمی. [ارائهٔ پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | barrel سازگاری برای debounce ورودی، تطبیق mention، helperهای mention-policy و helperهای پاکت |
    | `plugin-sdk/channel-inbound-debounce` | helperهای محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | helperهای محدود mention-policy، نشانگر mention و متن mention بدون سطح گسترده‌تر runtime ورودی |
    | `plugin-sdk/channel-envelope` | helperهای محدود قالب‌بندی پاکت ورودی |
    | `plugin-sdk/channel-location` | helperهای context و قالب‌بندی موقعیت کانال |
    | `plugin-sdk/channel-logging` | helperهای logging کانال برای dropهای ورودی و خطاهای typing/ack |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجهٔ پاسخ |
    | `plugin-sdk/channel-actions` | helperهای message-action کانال، به‌علاوهٔ helperهای schema بومی منسوخ که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | helperهای مشترک عادی‌سازی مسیر، resolution هدف مبتنی بر parser، stringification شناسهٔ thread، کلیدهای مسیر dedupe/compact، نوع‌های parsed-target و مقایسهٔ route/target |
    | `plugin-sdk/channel-targets` | helperهای parsing هدف؛ فراخوان‌های مقایسهٔ route باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های contract کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | helperهای محدود secret-contract مانند `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` و نوع‌های secret target |
  </Accordion>

  <Accordion title="Provider subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای Provider پشتیبانی‌شده LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شده LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و راهنماهای مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | راهنماهای گزینش‌شده راه‌اندازی Provider محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | راهنماهای متمرکز راه‌اندازی Provider خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های دیده‌بان |
    | `plugin-sdk/provider-auth-runtime` | راهنماهای رفع کلید API در زمان اجرا برای Pluginهای Provider |
    | `plugin-sdk/provider-auth-api-key` | راهنماهای آشناسازی/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-auth-login` | راهنماهای مشترک ورود تعاملی برای Pluginهای Provider |
    | `plugin-sdk/provider-env-vars` | راهنماهای جست‌وجوی متغیرهای محیطی احراز هویت Provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، راهنماهای نقطه پایانی Provider، و راهنماهای نرمال‌سازی شناسه مدل مانند `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای تکمیل کاتالوگ Provider و درزهای رجیستری Plugin-Provider برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | راهنماهای عمومی قابلیت HTTP/نقطه پایانی Provider، خطاهای HTTP Provider، و راهنماهای فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | راهنماهای محدود قرارداد پیکربندی/انتخاب واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | راهنماهای ثبت/کش Provider واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | راهنماهای محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای Providerهایی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | راهنماهای محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه دامنه‌دار |
    | `plugin-sdk/provider-web-search` | راهنماهای ثبت/کش/زمان اجرای Provider جست‌وجوی وب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, پاک‌سازی + عیب‌یابی طرحواره Gemini، و راهنماهای سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, انواع پوشش‌دهنده جریان، و راهنماهای مشترک پوشش‌دهنده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | راهنماهای انتقال بومی Provider مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال نوشتنی |
    | `plugin-sdk/provider-onboard` | راهنماهای وصله پیکربندی آشناسازی |
    | `plugin-sdk/global-singleton` | راهنماهای سینگلتون/نگاشت/کش محلی فرایند |
    | `plugin-sdk/group-activation` | راهنماهای محدود حالت فعال‌سازی گروه و تجزیه فرمان |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، راهنماهای رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا، راهنماهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | رفع تأییدکننده و راهنماهای احراز هویت اقدام در همان گفت‌وگو |
    | `plugin-sdk/approval-client-runtime` | راهنماهای پروفایل/فیلتر تأیید اجرای بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | راهنمای مشترک رفع Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | راهنماهای سبک بارگذاری آداپتور تأیید بومی برای نقاط ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | راهنماهای گسترده‌تر زمان اجرای مدیریت‌کننده تأیید؛ وقتی درزهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | هدف تأیید بومی + راهنماهای اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | راهنماهای بار پاسخ تأیید exec/Plugin |
    | `plugin-sdk/approval-runtime` | راهنماهای بار تأیید exec/Plugin، راهنماهای مسیریابی/زمان اجرای تأیید بومی، و راهنماهای نمایش ساختاریافته تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | راهنماهای محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | راهنماهای محدود آزمون قرارداد کانال بدون بشکه آزمون گسترده |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی منوی آرگومان پویا، و راهنماهای هدف نشست بومی |
    | `plugin-sdk/command-detection` | راهنماهای مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنه فرمان و راهنماهای سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | راهنماهای محدود گردآوری قرارداد محرمانه برای سطوح محرمانه کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | راهنماهای محدود `coerceSecretRef` و تایپ SecretRef برای تجزیه قرارداد محرمانه/پیکربندی |
    | `plugin-sdk/security-runtime` | راهنماهای مشترک اعتماد، دروازه‌گذاری پیام خصوصی، محتوای خارجی، پوشاندن متن حساس، مقایسه محرمانه در زمان ثابت، و گردآوری محرمانه |
    | `plugin-sdk/ssrf-policy` | راهنماهای فهرست مجاز میزبان و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | راهنماهای محدود توزیع‌کننده پین‌شده بدون سطح گسترده زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | راهنماهای توزیع‌کننده پین‌شده، واکشی محافظت‌شده با SSRF، خطای SSRF، و سیاست SSRF |
    | `plugin-sdk/secret-input` | راهنماهای تجزیه ورودی محرمانه |
    | `plugin-sdk/webhook-ingress` | راهنماهای درخواست/هدف Webhook و هم‌نهشتی خام websocket/بدنه |
    | `plugin-sdk/webhook-request-guards` | راهنماهای اندازه/مهلت بدنه درخواست |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | راهنماهای گسترده runtime/ثبت‌وقایع/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | راهنماهای محدود env مربوط به runtime، logger، timeout، retry و backoff |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای پروفایل/پیش‌فرض‌های نرمال‌شده، تجزیه URL مربوط به CDP، و راهنماهای احراز هویت کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | راهنماهای عمومی ثبت و جست‌وجوی runtime-context کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ Matrix برای بسته‌های قدیمی‌تر کانال شخص ثالث؛ Pluginهای جدید باید مستقیما `plugin-sdk/run-command` را import کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ Mattermost برای بسته‌های قدیمی‌تر کانال شخص ثالث؛ Pluginهای جدید باید زیرمسیرهای عمومی SDK را مستقیما import کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | راهنماهای مشترک فرمان/هوک/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | راهنماهای مشترک Webhook/خط لوله هوک داخلی |
    | `plugin-sdk/lazy-runtime` | راهنماهای import/binding تنبل runtime مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | راهنماهای اجرای فرایند |
    | `plugin-sdk/cli-runtime` | راهنماهای قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، راهنمای شروع کلاینت آماده برای event-loop، RPC مربوط به CLI برای Gateway، خطاهای پروتکل Gateway، و راهنماهای وصله وضعیت کانال |
    | `plugin-sdk/config-types` | سطح پیکربندی فقط-نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/provider |
    | `plugin-sdk/plugin-config-runtime` | راهنماهای جست‌وجوی پیکربندی Plugin در runtime مانند `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | راهنماهای جهش تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | راهنماهای snapshot پیکربندی فرایند جاری مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و تنظیم‌کننده‌های snapshot در تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تداخل، حتی وقتی سطح قرارداد Telegram همراه‌شده در دسترس نیست |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink برای ارجاع فایل بدون barrel گسترده text-runtime |
    | `plugin-sdk/approval-runtime` | راهنماهای تایید exec/Plugin، سازنده‌های قابلیت تایید، راهنماهای auth/profile، راهنماهای routing/runtime بومی، و قالب‌بندی مسیر نمایش ساختاریافته تایید |
    | `plugin-sdk/reply-runtime` | راهنماهای مشترک runtime برای ورودی/پاسخ، chunking، dispatch، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | راهنماهای محدود dispatch/finalize پاسخ و برچسب مکالمه |
    | `plugin-sdk/reply-history` | راهنماهای مشترک تاریخچه پاسخ با پنجره کوتاه و نشانگرهایی مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry` و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | راهنماهای محدود chunking متن/markdown |
    | `plugin-sdk/session-store-runtime` | راهنماهای مسیر store نشست، کلید نشست، updated-at و جهش store |
    | `plugin-sdk/cron-store-runtime` | راهنماهای مسیر/load/save مربوط به store برای Cron |
    | `plugin-sdk/state-paths` | راهنماهای مسیر دایرکتوری State/OAuth |
    | `plugin-sdk/routing` | راهنماهای route/کلید نشست/binding حساب مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | راهنماهای مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های runtime-state، و راهنماهای metadata مربوط به issue |
    | `plugin-sdk/target-resolver-runtime` | راهنماهای مشترک resolver هدف |
    | `plugin-sdk/string-normalization-runtime` | راهنماهای نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج نرمال‌شده stdout/stderr |
    | `plugin-sdk/param-readers` | خواننده‌های رایج پارامتر tool/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌شده از اشیای نتیجه tool |
    | `plugin-sdk/tool-send` | استخراج فیلدهای استاندارد هدف ارسال از آرگومان‌های tool |
    | `plugin-sdk/temp-path` | راهنماهای مشترک مسیر temp-download |
    | `plugin-sdk/logging-core` | راهنماهای logger زیرسامانه و redaction |
    | `plugin-sdk/markdown-table-runtime` | راهنماهای حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | راهنماهای override مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | راهنماهای resolution پیکربندی provider گفت‌وگو |
    | `plugin-sdk/json-store` | راهنماهای کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/file-lock` | راهنماهای re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | راهنماهای cache حذف تکرار مبتنی بر دیسک |
    | `plugin-sdk/acp-runtime` | راهنماهای runtime/نشست ACP و reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | راهنماهای سبک ثبت backend و reply-dispatch برای Pluginهایی که هنگام startup بارگذاری می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | resolution فقط-خواندنی binding مربوط به ACP بدون importهای startup چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitives محدود config-schema مربوط به runtime عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر بولی آزاد |
    | `plugin-sdk/dangerous-name-runtime` | راهنماهای resolution تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | راهنماهای bootstrap دستگاه و توکن pairing |
    | `plugin-sdk/extension-shared` | primitives مشترک برای راهنمای کانال غیرفعال، وضعیت، و proxy محیطی |
    | `plugin-sdk/models-provider-runtime` | راهنماهای پاسخ فرمان/provider برای `/models` |
    | `plugin-sdk/skill-commands-runtime` | راهنماهای فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | راهنماهای registry/build/serialize فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورد اعتماد برای harnessهای سطح پایین عامل: انواع harness، راهنماهای steer/abort اجرای فعال، راهنماهای پل tool برای OpenClaw، راهنماهای سیاست tool مربوط به runtime-plan، طبقه‌بندی نتیجه terminal، راهنماهای قالب‌بندی/جزئیات پیشرفت tool، و ابزارهای کمکی نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | راهنماهای تشخیص endpoint مربوط به Z.AI |
    | `plugin-sdk/async-lock-runtime` | راهنمای قفل async محلیِ فرایند برای فایل‌های کوچک وضعیت runtime |
    | `plugin-sdk/channel-activity-runtime` | راهنمای telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | راهنمای محدودسازی هم‌زمانی taskهای async |
    | `plugin-sdk/dedupe-runtime` | راهنماهای cache حذف تکرار در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | راهنمای drain برای pending-delivery خروجی |
    | `plugin-sdk/file-access-runtime` | راهنماهای امن مسیر فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | راهنماهای رویداد و visibility مربوط به Heartbeat |
    | `plugin-sdk/number-runtime` | راهنمای coercion عددی |
    | `plugin-sdk/secure-random-runtime` | راهنماهای token/UUID امن |
    | `plugin-sdk/system-event-runtime` | راهنماهای queue رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | راهنمای انتظار برای آماده‌بودن transport |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ؛ از زیرمسیرهای متمرکز runtime در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | راهنماهای کوچک cache محدود |
    | `plugin-sdk/diagnostic-runtime` | راهنماهای flag، event و trace-context تشخیصی |
    | `plugin-sdk/error-runtime` | راهنماهای graph خطا، قالب‌بندی، طبقه‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | راهنماهای fetch بسته‌بندی‌شده، proxy، گزینه EnvHttpProxyAgent، و lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch مربوط به runtime با آگاهی از dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود response-body بدون سطح گسترده media runtime |
    | `plugin-sdk/session-binding-runtime` | وضعیت binding مکالمه جاری بدون routing مربوط به binding پیکربندی‌شده یا storeهای pairing |
    | `plugin-sdk/session-store-runtime` | راهنماهای session-store بدون importهای گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | resolution نمایش‌پذیری context و فیلترکردن context تکمیلی بدون importهای گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | راهنماهای محدود coercion و نرمال‌سازی رکورد/string ابتدایی بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | راهنماهای نرمال‌سازی hostname و میزبان SCP |
    | `plugin-sdk/retry-runtime` | راهنماهای پیکربندی retry و اجراکننده retry |
    | `plugin-sdk/agent-runtime` | راهنماهای دایرکتوری/هویت/workspace عامل |
    | `plugin-sdk/directory-runtime` | query/dedup دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک دریافت/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو با پشتوانه ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-store` | کمک‌کننده‌های محدود ذخیره رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک failover برای تولید رسانه، انتخاب نامزد، و پیام‌رسانی مدلِ مفقود |
    | `plugin-sdk/media-understanding` | انواع provider درک رسانه به‌همراه خروجی‌های کمک‌کننده تصویر/صدا برای provider |
    | `plugin-sdk/text-runtime` | کمک‌کننده‌های مشترک متن/markdown/ثبت لاگ، مانند حذف متن قابل‌مشاهده برای دستیار، کمک‌کننده‌های رندر/تکه‌سازی/جدول markdown، کمک‌کننده‌های redaction، کمک‌کننده‌های directive-tag، و ابزارهای متن امن |
    | `plugin-sdk/text-chunking` | کمک‌کننده تکه‌سازی متن خروجی |
    | `plugin-sdk/speech` | انواع provider گفتار به‌همراه خروجی‌های directive، registry، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و کمک‌کننده‌های گفتار برای provider |
    | `plugin-sdk/speech-core` | خروجی‌های مشترک انواع provider گفتار، registry، directive، نرمال‌سازی، و کمک‌کننده‌های گفتار |
    | `plugin-sdk/realtime-transcription` | انواع provider رونویسی بی‌درنگ، کمک‌کننده‌های registry، و کمک‌کننده مشترک نشست WebSocket |
    | `plugin-sdk/realtime-voice` | انواع provider صدای بی‌درنگ و کمک‌کننده‌های registry |
    | `plugin-sdk/image-generation` | انواع provider تولید تصویر به‌همراه کمک‌کننده‌های asset تصویر/data URL و سازنده provider تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | کمک‌کننده‌های مشترک انواع تولید تصویر، failover، احراز هویت، و registry |
    | `plugin-sdk/music-generation` | انواع provider/request/result تولید موسیقی |
    | `plugin-sdk/music-generation-core` | انواع مشترک تولید موسیقی، کمک‌کننده‌های failover، جست‌وجوی provider، و پردازش model-ref |
    | `plugin-sdk/video-generation` | انواع provider/request/result تولید ویدئو |
    | `plugin-sdk/video-generation-core` | انواع مشترک تولید ویدئو، کمک‌کننده‌های failover، جست‌وجوی provider، و پردازش model-ref |
    | `plugin-sdk/webhook-targets` | کمک‌کننده‌های registry هدف Webhook و نصب route |
    | `plugin-sdk/webhook-path` | کمک‌کننده‌های نرمال‌سازی مسیر Webhook |
    | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک بارگذاری رسانه راه‌دور/محلی |
    | `plugin-sdk/zod` | `zod` بازصادرشده برای مصرف‌کنندگان SDK Plugin |
    | `plugin-sdk/testing` | barrel سازگاری گسترده برای آزمون‌های Plugin قدیمی. آزمون‌های افزونه جدید باید به‌جای آن زیرمسیرهای متمرکز SDK مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌کننده حداقلی `createTestPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin بدون import کردن پل‌های کمک‌کننده آزمون repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای contract بومی adapter زمان اجرای agent برای آزمون‌های احراز هویت، تحویل، fallback، tool-hook، prompt-overlay، schema، و projection رونوشت |
    | `plugin-sdk/channel-test-helpers` | کمک‌کننده‌های آزمون کانال‌محور برای contractهای generic actions/setup/status، assertionهای directory، چرخه عمر startup حساب، threading پیکربندی ارسال، mockهای runtime، مسئله‌های status، تحویل خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک حالت‌های خطای target-resolution برای آزمون‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | کمک‌کننده‌های contract برای بسته Plugin، ثبت، artifact عمومی، import مستقیم، API زمان اجرا، و اثر جانبی import |
    | `plugin-sdk/provider-test-contracts` | کمک‌کننده‌های contract برای runtime provider، احراز هویت، کشف، onboard، catalog، wizard، قابلیت رسانه، سیاست replay، صدای زنده STT بی‌درنگ، web-search/fetch، و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/احراز هویت Vitest به‌صورت opt-in برای آزمون‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای generic برای ضبط runtime CLI، زمینه sandbox، skill writer، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin همراه، terminal-text، chunking، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌کننده‌های mock متمرکز برای builtinهای Node جهت استفاده در factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌کننده memory-core همراه برای کمک‌کننده‌های manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای index/search حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های engine foundation میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | contractهای embedding میزبان حافظه، دسترسی registry، provider محلی، و کمک‌کننده‌های generic batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های engine QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های engine storage میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | کمک‌کننده‌های event journal میزبان حافظه |
    | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های status میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌کننده‌های runtime CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌کننده‌های core runtime میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | alias خنثی نسبت به vendor برای کمک‌کننده‌های core runtime میزبان حافظه |
    | `plugin-sdk/memory-host-events` | alias خنثی نسبت به vendor برای کمک‌کننده‌های event journal میزبان حافظه |
    | `plugin-sdk/memory-host-files` | alias خنثی نسبت به vendor برای کمک‌کننده‌های file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های مشترک managed-markdown برای Pluginهای نزدیک به حافظه |
    | `plugin-sdk/memory-host-search` | facade زمان اجرای حافظه فعال برای دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | alias خنثی نسبت به vendor برای کمک‌کننده‌های status میزبان حافظه |
  </Accordion>

  <Accordion title="زیرمسیرهای کمک‌کننده همراه رزروشده">
    در حال حاضر هیچ زیرمسیر SDK رزروشده‌ای برای کمک‌کننده‌های همراه وجود ندارد. کمک‌کننده‌های اختصاصی مالک
    داخل بسته Plugin مالک قرار می‌گیرند، در حالی که contractهای میزبانِ قابل‌استفاده مجدد
    از زیرمسیرهای generic SDK مانند `plugin-sdk/gateway-runtime`،
    `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
