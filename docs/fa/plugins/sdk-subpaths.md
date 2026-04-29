---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای یک واردسازی در Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و سطوح کمکی
summary: 'کاتالوگ زیرمسیرهای SDK Plugin: کدام importها کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-04-29T23:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60fe10982b9aa01af76bfbd72475168c8138f68dd410b4488b6b6c4c00097e53
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود زیر `openclaw/plugin-sdk/` ارائه می‌شود.
  این صفحه زیرمسیرهای رایج را که بر اساس هدف گروه‌بندی شده‌اند فهرست می‌کند. فهرست کامل
  تولیدشده شامل بیش از ۲۰۰ زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛
  زیرمسیرهای کمکی رزرو‌شده برای Pluginهای همراه در آنجا ظاهر می‌شوند، اما جزئیات پیاده‌سازی
  محسوب می‌شوند مگر اینکه یک صفحه مستندات صراحتا آن‌ها را معرفی کند. نگه‌دارندگان می‌توانند
  زیرمسیرهای کمکی رزرو‌شده فعال را با `pnpm plugins:boundary-report:summary` ممیزی کنند؛
  خروجی‌های کمکی رزرو‌شده بلااستفاده به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی سازگاری
  غیرفعال، گزارش CI را ناموفق می‌کنند.

  برای راهنمای ساخت Plugin، [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) را ببینید.

  ## ورودی Plugin

  | زیرمسیر                                   | خروجی‌های کلیدی                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | بشکه سازگاری گسترده برای آزمون‌های قدیمی Plugin؛ برای آزمون‌های جدید افزونه، زیرمسیرهای آزمون متمرکز را ترجیح دهید                                                                     |
  | `plugin-sdk/plugin-test-api`              | سازنده mock حداقلی `OpenClawPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime برای پروفایل‌های احراز هویت، سرکوب تحویل، طبقه‌بندی fallback، hookهای ابزار، overlayهای prompt، schemaها و ترمیم transcript |
  | `plugin-sdk/channel-test-helpers`         | کمک‌کننده‌های چرخه عمر حساب کانال، دایرکتوری، send-config، mock زمان اجرا، hook، ورودی کانال همراه، timestamp پاکت، پاسخ pairing و آزمون قرارداد کانال عمومی   |
  | `plugin-sdk/channel-target-testing`       | مجموعه آزمون مشترک برای حالت‌های خطای هدف‌گذاری کانال                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | کمک‌کننده‌های قرارداد ثبت Plugin، manifest بسته، artifact عمومی، API زمان اجرا، side-effect واردسازی و واردسازی مستقیم                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixtureهای زمان اجرای Plugin، registry، ثبت provider، setup-wizard و task-flow زمان اجرا برای آزمون‌ها                                                                      |
  | `plugin-sdk/provider-test-contracts`      | کمک‌کننده‌های قرارداد زمان اجرای provider، احراز هویت، کشف، onboard، catalog، قابلیت media، سیاست replay، صدای زنده realtime STT، web-search/fetch و wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mockهای اختیاری Vitest برای HTTP/auth جهت آزمون‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند                                                                                    |
  | `plugin-sdk/test-env`                     | fixtureهای محیط آزمون، fetch/network، سرور HTTP موقت، درخواست ورودی، live-test، فایل‌سیستم موقت و کنترل زمان                                        |
  | `plugin-sdk/test-fixtures`                | fixtureهای آزمون عمومی برای CLI، sandbox، مهارت، agent-message، system-event، بارگذاری مجدد ماژول، مسیر Plugin همراه، terminal، chunking، auth-token و typed-case                   |
  | `plugin-sdk/test-node-mocks`              | کمک‌کننده‌های mock متمرکز برای builtinهای Node جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | کمک‌کننده‌های آیتم provider برای مهاجرت مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای وضعیت آیتم، کمک‌کننده‌های redaction و `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | کمک‌کننده‌های مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime` و `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی schema ریشه `openclaw.json` مبتنی بر Zod (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌کننده‌های مشترک setup wizard، promptهای allowlist، سازنده‌های وضعیت setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌کننده‌های پیکربندی چندحسابی/action-gate، کمک‌کننده‌های fallback حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌کننده‌های نرمال‌سازی account-id |
    | `plugin-sdk/account-resolution` | کمک‌کننده‌های جست‌وجوی حساب و default-fallback |
    | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitiveهای مشترک schema پیکربندی کانال و سازنده عمومی |
    | `plugin-sdk/bundled-channel-config-schema` | schemaهای پیکربندی کانال همراه OpenClaw فقط برای Pluginهای همراه نگه‌داری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ برای schemaهای پیکربندی کانال همراه |
    | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های نرمال‌سازی/اعتبارسنجی command سفارشی Telegram با fallback قرارداد همراه |
    | `plugin-sdk/command-gating` | کمک‌کننده‌های محدود gate مجوز command |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، کمک‌کننده‌های چرخه عمر/نهایی‌سازی draft stream |
    | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های مشترک route ورودی و سازنده پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | کمک‌کننده‌های مشترک ثبت و dispatch ورودی |
    | `plugin-sdk/messaging-targets` | کمک‌کننده‌های parse/match هدف |
    | `plugin-sdk/outbound-media` | کمک‌کننده‌های مشترک بارگذاری media خروجی |
    | `plugin-sdk/outbound-send-deps` | جست‌وجوی سبک وابستگی ارسال خروجی برای adapterهای کانال |
    | `plugin-sdk/outbound-runtime` | کمک‌کننده‌های تحویل خروجی، identity، نماینده ارسال، session، formatting و برنامه‌ریزی payload |
    | `plugin-sdk/poll-runtime` | کمک‌کننده‌های محدود نرمال‌سازی poll |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های چرخه عمر thread-binding و adapter |
    | `plugin-sdk/agent-media-payload` | سازنده قدیمی payload رسانه agent |
    | `plugin-sdk/conversation-runtime` | کمک‌کننده‌های conversation/thread binding، pairing و binding پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده snapshot پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | کمک‌کننده‌های resolution سیاست گروه در زمان اجرا |
    | `plugin-sdk/channel-status` | کمک‌کننده‌های مشترک snapshot/summary وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | primitiveهای محدود channel config-schema |
    | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های مجوز config-write کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک prelude مربوط به Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های ویرایش/خواندن پیکربندی allowlist |
    | `plugin-sdk/group-access` | کمک‌کننده‌های مشترک تصمیم‌گیری group-access |
    | `plugin-sdk/direct-dm` | کمک‌کننده‌های مشترک auth/guard برای direct-DM |
    | `plugin-sdk/discord` | facade سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | facade سازگاری منسوخ resolution حساب Telegram برای سازگاری مالک پیگیری‌شده؛ Pluginهای جدید باید از کمک‌کننده‌های زمان اجرای تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های معنایی ارائه پیام، تحویل و پاسخ تعاملی قدیمی. [ارائه پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | بشکه سازگاری برای debounce ورودی، تطبیق mention، کمک‌کننده‌های mention-policy و کمک‌کننده‌های پاکت |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌کننده‌های محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌کننده‌های محدود mention-policy، نشانگر mention و متن mention بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope` | کمک‌کننده‌های محدود formatting پاکت ورودی |
    | `plugin-sdk/channel-location` | کمک‌کننده‌های context مکان کانال و formatting |
    | `plugin-sdk/channel-logging` | کمک‌کننده‌های logging کانال برای dropهای ورودی و شکست‌های typing/ack |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجه پاسخ |
    | `plugin-sdk/channel-actions` | کمک‌کننده‌های message-action کانال، به‌علاوه کمک‌کننده‌های schema بومی منسوخ که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | کمک‌کننده‌های نرمال‌سازی route مشترک، resolution هدف مبتنی بر parser، stringification شناسه thread، کلیدهای route برای dedupe/compact، نوع‌های parsed-target و مقایسه route/target |
    | `plugin-sdk/channel-targets` | کمک‌کننده‌های parse هدف؛ فراخوان‌های مقایسه route باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود قرارداد secret مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment` و نوع‌های secret target |
  </Accordion>

  <Accordion title="Provider subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شده ارائه‌دهنده LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شده LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌یارهای مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌یارهای گزینش‌شده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌یارهای متمرکز راه‌اندازی ارائه‌دهنده خودمیزبانِ سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های پشت‌اند CLI + ثابت‌های watchdog |
    | `plugin-sdk/provider-auth-runtime` | کمک‌یارهای رفع API-key در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-auth-api-key` | کمک‌یارهای ورود اولیه/نوشتن پروفایل API-key مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-auth-login` | کمک‌یارهای مشترک ورود تعاملی برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-env-vars` | کمک‌یارهای جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌یارهای نقطه پایانی ارائه‌دهنده، و کمک‌یارهای نرمال‌سازی شناسه مدل مانند `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای تکمیل کاتالوگ ارائه‌دهنده و درزهای رجیستری Plugin-ارائه‌دهنده برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌یارهای عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌یارهای فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌یارهای محدود قرارداد پیکربندی/انتخاب واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌یارهای ثبت/کش ارائه‌دهنده واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌یارهای محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌یارهای محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه محدود |
    | `plugin-sdk/provider-web-search` | کمک‌یارهای ثبت/کش/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, پاک‌سازی طرح‌واره Gemini + عیب‌یابی‌ها، و کمک‌یارهای سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, انواع پوشش‌دهنده جریان، و کمک‌یارهای مشترک پوشش‌دهنده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | کمک‌یارهای انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌یارهای وصله پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | کمک‌یارهای singleton/map/cache محلیِ فرایند |
    | `plugin-sdk/group-activation` | کمک‌یارهای محدود حالت فعال‌سازی گروه و تجزیه فرمان |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، کمک‌یارهای رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا، کمک‌یارهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌یارهای رفع تاییدکننده و احراز هویت اقدام در همان چت |
    | `plugin-sdk/approval-client-runtime` | کمک‌یارهای بومی پروفایل/فیلتر تایید exec |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای بومی قابلیت/تحویل تایید |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌یار مشترک رفع Gateway تایید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌یارهای سبک بارگذاری آداپتور تایید بومی برای نقاط ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌یارهای گسترده‌تر زمان اجرای مدیریت‌کننده تایید؛ وقتی درزهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | هدف تایید بومی + کمک‌یارهای اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | کمک‌یارهای بار پاسخ تایید exec/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌یارهای بار تایید exec/Plugin، کمک‌یارهای مسیریابی/زمان اجرای تایید بومی، و کمک‌یارهای نمایش ساخت‌یافته تایید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌یارهای محدود بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌یارهای محدود آزمون قرارداد کانال بدون barrel گسترده آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی منوی آرگومان پویا، و کمک‌یارهای بومی هدف جلسه |
    | `plugin-sdk/command-detection` | کمک‌یارهای مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | نرمال‌سازی بدنه فرمان و کمک‌یارهای سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌یارهای محدود گردآوری قرارداد secret برای سطوح secret کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌یارهای محدود `coerceSecretRef` و تایپ SecretRef برای تجزیه قرارداد secret/پیکربندی |
    | `plugin-sdk/security-runtime` | اعتماد مشترک، محدودسازی DM، محتوای خارجی، پوشاندن متن حساس، مقایسه secret با زمان ثابت، و کمک‌یارهای گردآوری secret |
    | `plugin-sdk/ssrf-policy` | کمک‌یارهای فهرست مجاز میزبان و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌یارهای محدود pinned-dispatcher بدون سطح گسترده زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، واکشی محافظت‌شده با SSRF، خطای SSRF، و کمک‌یارهای سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌یارهای تجزیه ورودی secret |
    | `plugin-sdk/webhook-ingress` | کمک‌یارهای درخواست/هدف Webhook و اجبار خام websocket/body |
    | `plugin-sdk/webhook-request-guards` | کمک‌یارهای اندازه/مهلت بدنه درخواست |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | زیرمسیر | خروجی‌های اصلی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌کننده‌های گسترده Runtime/ثبت لاگ/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود env مربوط به Runtime، لاگر، timeout، retry و backoff |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای profile/defaults نرمال‌شده، تجزیه URLهای CDP، و کمک‌کننده‌های احراز هویت کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های عمومی ثبت و lookup زمینه Runtime کانال |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک فرمان/hook/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌کننده‌های مشترک pipeline مربوط به webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های import/binding تنبل Runtime مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌کننده‌های اجرای پردازه |
    | `plugin-sdk/cli-runtime` | کمک‌کننده‌های قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌کننده شروع کلاینت آماده event-loop، RPC مربوط به CLI در Gateway، خطاهای پروتکل Gateway، و کمک‌کننده‌های patch وضعیت کانال |
    | `plugin-sdk/config-types` | سطح پیکربندی فقط-نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و نوع‌های پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌کننده‌های lookup پیکربندی Plugin در Runtime مانند `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌کننده‌های تغییر تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده‌های snapshot پیکربندی پردازه جاری مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و تنظیم‌کننده‌های snapshot آزمایشی |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکراری/تداخل، حتی وقتی سطح قرارداد Telegram بسته‌بندی‌شده در دسترس نباشد |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink ارجاع فایل بدون barrel گسترده text-runtime |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های تأیید exec/plugin، سازنده‌های قابلیت تأیید، کمک‌کننده‌های auth/profile، کمک‌کننده‌های routing/runtime بومی، و قالب‌بندی مسیر نمایش تأیید ساختاریافته |
    | `plugin-sdk/reply-runtime` | کمک‌کننده‌های مشترک Runtime ورودی/پاسخ، chunking، dispatch، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود dispatch/finalize پاسخ و برچسب مکالمه |
    | `plugin-sdk/reply-history` | کمک‌کننده‌های مشترک تاریخچه پاسخ با پنجره کوتاه و نشانگرهایی مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry` و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌کننده‌های محدود chunking متن/Markdown |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های مسیر store نشست، کلید نشست، updated-at، و تغییر store |
    | `plugin-sdk/cron-store-runtime` | کمک‌کننده‌های مسیر/load/save store مربوط به Cron |
    | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر دایرکتوری State/OAuth |
    | `plugin-sdk/routing` | کمک‌کننده‌های route/session-key/account binding مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌کننده‌های مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های runtime-state، و کمک‌کننده‌های فراداده issue |
    | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های مشترک resolver هدف |
    | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های نرمال‌سازی slug/string |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های fetch/request-like |
    | `plugin-sdk/run-command` | runner فرمان زمان‌دار با نتایج stdout/stderr نرمال‌شده |
    | `plugin-sdk/param-readers` | readerهای رایج پارامتر tool/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌شده از objectهای نتیجه tool |
    | `plugin-sdk/tool-send` | استخراج فیلدهای متعارف هدف ارسال از آرگومان‌های tool |
    | `plugin-sdk/temp-path` | کمک‌کننده‌های مشترک مسیر temp-download |
    | `plugin-sdk/logging-core` | کمک‌کننده‌های لاگر subsystem و redaction |
    | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های حالت و تبدیل جدول Markdown |
    | `plugin-sdk/model-session-runtime` | کمک‌کننده‌های override مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌کننده‌های حل پیکربندی ارائه‌دهنده Talk |
    | `plugin-sdk/json-store` | کمک‌کننده‌های کوچک خواندن/نوشتن state در JSON |
    | `plugin-sdk/file-lock` | کمک‌کننده‌های file-lock بازدرآیند |
    | `plugin-sdk/persistent-dedupe` | کمک‌کننده‌های کش dedupe پشتیبانی‌شده با دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌کننده‌های Runtime/نشست ACP و reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | کمک‌کننده‌های سبک ثبت backend و reply-dispatch مربوط به ACP برای Pluginهایی که هنگام startup بارگذاری می‌شوند |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل binding فقط-خواندنی ACP بدون importهای startup چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود config-schema برای Runtime عامل |
    | `plugin-sdk/boolean-param` | reader پارامتر boolean آزاد |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌کننده‌های حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌کننده‌های bootstrap دستگاه و token جفت‌سازی |
    | `plugin-sdk/extension-shared` | primitiveهای مشترک کمک‌کننده passive-channel، وضعیت، و ambient proxy |
    | `plugin-sdk/models-provider-runtime` | کمک‌کننده‌های پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌کننده‌های فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | کمک‌کننده‌های registry/build/serialize فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin معتمد برای harnessهای سطح‌پایین عامل: نوع‌های harness، کمک‌کننده‌های steer/abort اجرای فعال، کمک‌کننده‌های bridge ابزار OpenClaw، کمک‌کننده‌های سیاست ابزار runtime-plan، طبقه‌بندی outcome ترمینال، کمک‌کننده‌های قالب‌بندی/جزئیات پیشرفت tool، و utilityهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | کمک‌کننده‌های تشخیص endpoint مربوط به Z.AI |
    | `plugin-sdk/async-lock-runtime` | کمک‌کننده قفل async محلی پردازه برای فایل‌های کوچک state در Runtime |
    | `plugin-sdk/channel-activity-runtime` | کمک‌کننده telemetry فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌کننده هم‌زمانی taskهای async با کران مشخص |
    | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های کش dedupe در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده drain تحویل‌های معلق خروجی |
    | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های امن مسیر فایل محلی و media-source |
    | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های رویداد و visibility مربوط به Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌کننده coercion عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌کننده‌های token/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های صف رویداد system |
    | `plugin-sdk/transport-ready-runtime` | کمک‌کننده انتظار آمادگی transport |
    | `plugin-sdk/infra-runtime` | compatibility shim منسوخ؛ از زیرمسیرهای متمرکز Runtime در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌کننده‌های کوچک کش با کران مشخص |
    | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های flag تشخیصی، رویداد، و trace-context |
    | `plugin-sdk/error-runtime` | کمک‌کننده‌های گراف خطا، قالب‌بندی، طبقه‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch بسته‌بندی‌شده، proxy، گزینه EnvHttpProxyAgent، و کمک‌کننده‌های lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch در Runtime آگاه از Dispatcher بدون importهای proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | reader محدود response-body بدون سطح گسترده media runtime |
    | `plugin-sdk/session-binding-runtime` | state مربوط به binding مکالمه جاری بدون routing مربوط به binding پیکربندی‌شده یا storeهای جفت‌سازی |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های session-store بدون importهای گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | حل visibility زمینه و فیلتر کردن زمینه تکمیلی بدون importهای گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌کننده‌های محدود coercion و نرمال‌سازی primitive record/string بدون importهای markdown/logging |
    | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی hostname و میزبان SCP |
    | `plugin-sdk/retry-runtime` | کمک‌کننده‌های پیکربندی retry و runner retry |
    | `plugin-sdk/agent-runtime` | کمک‌کننده‌های دایرکتوری/identity/workspace عامل |
    | `plugin-sdk/directory-runtime` | query/dedup دایرکتوری پشتیبانی‌شده با پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌ابزارهای مشترک دریافت/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو با پشتوانه ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-store` | کمک‌ابزارهای محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | کمک‌ابزارهای مشترک failover تولید رسانه، انتخاب گزینه نامزد، و پیام‌رسانی مدل مفقود |
    | `plugin-sdk/media-understanding` | نوع‌های provider درک رسانه به‌همراه خروجی‌های کمک‌ابزار تصویر/صوت مخصوص provider |
    | `plugin-sdk/text-runtime` | کمک‌ابزارهای مشترک متن/markdown/ثبت گزارش مانند حذف متن قابل‌مشاهده برای assistant، کمک‌ابزارهای render/chunking/table در markdown، کمک‌ابزارهای redaction، کمک‌ابزارهای directive-tag، و ابزارهای safe-text |
    | `plugin-sdk/text-chunking` | کمک‌ابزار قطعه‌بندی متن خروجی |
    | `plugin-sdk/speech` | نوع‌های provider گفتار به‌همراه خروجی‌های directive، registry، validation، سازنده TTS سازگار با OpenAI، و کمک‌ابزارهای گفتار مخصوص provider |
    | `plugin-sdk/speech-core` | نوع‌های مشترک provider گفتار، registry، directive، normalization، و خروجی‌های کمک‌ابزار گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های provider رونویسی بی‌درنگ، کمک‌ابزارهای registry، و کمک‌ابزار مشترک نشست WebSocket |
    | `plugin-sdk/realtime-voice` | نوع‌های provider صدای بی‌درنگ و کمک‌ابزارهای registry |
    | `plugin-sdk/image-generation` | نوع‌های provider تولید تصویر به‌همراه کمک‌ابزارهای asset/data URL تصویر و سازنده provider تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌ها، failover، auth، و کمک‌ابزارهای registry مشترک تولید تصویر |
    | `plugin-sdk/music-generation` | نوع‌های provider/request/result تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، کمک‌ابزارهای failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/video-generation` | نوع‌های provider/request/result تولید ویدئو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدئو، کمک‌ابزارهای failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/webhook-targets` | registry هدف Webhook و کمک‌ابزارهای نصب route |
    | `plugin-sdk/webhook-path` | کمک‌ابزارهای نرمال‌سازی مسیر Webhook |
    | `plugin-sdk/web-media` | کمک‌ابزارهای مشترک بارگذاری رسانه دوردست/محلی |
    | `plugin-sdk/zod` | بازصادرات `zod` برای مصرف‌کنندگان SDK Plugin |
    | `plugin-sdk/testing` | barrel سازگاری گسترده برای آزمون‌های قدیمی Plugin. آزمون‌های extension جدید باید به‌جای آن، زیرمسیرهای متمرکز SDK مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌ابزار حداقلی `createTestPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin بدون import کردن پل‌های کمک‌آزمون repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime برای آزمون‌های auth، delivery، fallback، tool-hook، prompt-overlay، schema، و transcript projection |
    | `plugin-sdk/channel-test-helpers` | کمک‌ابزارهای آزمون کانال‌محور برای قراردادهای عمومی actions/setup/status، assertionهای directory، چرخه عمر startup حساب، threading مربوط به send-config، mockهای runtime، status issueها، delivery خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک error-case رفع هدف برای آزمون‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | کمک‌ابزارهای قرارداد بسته Plugin، ثبت، artifact عمومی، import مستقیم، runtime API، و side-effectهای import |
    | `plugin-sdk/provider-test-contracts` | کمک‌ابزارهای قرارداد provider runtime، auth، discovery، onboard، catalog، wizard، قابلیت رسانه، سیاست replay، realtime STT live-audio، web-search/fetch، و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/auth اختیاری Vitest برای آزمون‌های provider که `plugin-sdk/provider-http` را exercise می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی ثبت runtime در CLI، context مربوط به sandbox، skill writer، agent-message، system-event، module reload، مسیر Plugin بسته‌بندی‌شده، terminal-text، chunking، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌ابزارهای متمرکز mock داخلی Node برای استفاده داخل factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای Memory">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌ابزار memory-core بسته‌بندی‌شده برای کمک‌ابزارهای manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade مربوط به runtime نمایه‌سازی/جست‌وجوی memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های engine بنیان host مربوط به memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان memory، دسترسی به registry، provider محلی، و کمک‌ابزارهای عمومی batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های engine QMD میزبان memory |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های engine ذخیره‌سازی میزبان memory |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌ابزارهای multimodal میزبان memory |
    | `plugin-sdk/memory-core-host-query` | کمک‌ابزارهای query میزبان memory |
    | `plugin-sdk/memory-core-host-secret` | کمک‌ابزارهای secret میزبان memory |
    | `plugin-sdk/memory-core-host-events` | کمک‌ابزارهای event journal میزبان memory |
    | `plugin-sdk/memory-core-host-status` | کمک‌ابزارهای status میزبان memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌ابزارهای runtime مربوط به CLI میزبان memory |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌ابزارهای runtime هسته میزبان memory |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌ابزارهای file/runtime میزبان memory |
    | `plugin-sdk/memory-host-core` | alias بی‌طرف نسبت به vendor برای کمک‌ابزارهای runtime هسته میزبان memory |
    | `plugin-sdk/memory-host-events` | alias بی‌طرف نسبت به vendor برای کمک‌ابزارهای event journal میزبان memory |
    | `plugin-sdk/memory-host-files` | alias بی‌طرف نسبت به vendor برای کمک‌ابزارهای file/runtime میزبان memory |
    | `plugin-sdk/memory-host-markdown` | کمک‌ابزارهای managed-markdown مشترک برای Pluginهای مجاور memory |
    | `plugin-sdk/memory-host-search` | facade مربوط به runtime Active Memory برای دسترسی به search-manager |
    | `plugin-sdk/memory-host-status` | alias بی‌طرف نسبت به vendor برای کمک‌ابزارهای status میزبان memory |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشده bundled-helper">
    در حال حاضر هیچ زیرمسیر SDK رزروشده‌ای برای bundled-helper وجود ندارد. کمک‌ابزارهای مخصوص مالک
    داخل بسته Plugin مالک قرار دارند، در حالی که قراردادهای host قابل‌استفاده مجدد
    از زیرمسیرهای عمومی SDK مانند `plugin-sdk/gateway-runtime`،
    `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
