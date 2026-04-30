---
read_when:
    - انتخاب مسیر فرعی مناسب plugin-sdk برای وارد کردن یک Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و سطوح کمکی
summary: 'کاتالوگ زیرمسیرهای Plugin SDK: اینکه کدام واردسازی‌ها در کجا قرار دارند، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای SDK Plugin
x-i18n:
    generated_at: "2026-04-30T09:43:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود زیر `openclaw/plugin-sdk/` ارائه می‌شود.
  این صفحه زیرمسیرهای پرکاربرد را بر اساس هدف دسته‌بندی و فهرست می‌کند. فهرست کامل
  تولیدشده شامل بیش از ۲۰۰ زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛
  زیرمسیرهای کمکی رزرو‌شده برای Pluginهای بسته‌بندی‌شده نیز آنجا دیده می‌شوند، اما جزئیات
  پیاده‌سازی هستند مگر اینکه یک صفحهٔ مستندات صریحاً آن‌ها را معرفی کند. نگه‌دارندگان می‌توانند
  زیرمسیرهای کمکی رزرو‌شدهٔ فعال را با `pnpm plugins:boundary-report:summary` بازبینی کنند؛
  خروجی‌های کمکی رزرو‌شدهٔ بلااستفاده به‌جای اینکه به‌عنوان بدهی سازگاری خاموش در SDK عمومی
  باقی بمانند، گزارش CI را ناموفق می‌کنند.

  برای راهنمای تألیف Plugin، [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) را ببینید.

  ## ورودی Plugin

  | زیرمسیر                                   | خروجی‌های کلیدی                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | barrel سازگاری گسترده برای آزمون‌های قدیمی Plugin؛ برای آزمون‌های جدید افزونه، زیرمسیرهای متمرکز آزمون را ترجیح دهید                                                                     |
  | `plugin-sdk/plugin-test-api`              | سازندهٔ mock حداقلی `OpenClawPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد آداپتور بومی agent-runtime برای پروفایل‌های احراز هویت، سرکوب تحویل، طبقه‌بندی fallback، hookهای ابزار، overlayهای prompt، schemaها، و ترمیم transcript |
  | `plugin-sdk/channel-test-helpers`         | چرخهٔ عمر حساب کانال، directory، send-config، mock زمان اجرا، hook، ورودی کانال بسته‌بندی‌شده، timestamp پاکت، پاسخ pairing، و helperهای آزمون قرارداد کانال عمومی   |
  | `plugin-sdk/channel-target-testing`       | مجموعه آزمون مشترک حالت‌های خطای حل مقصد کانال                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | helperهای قرارداد ثبت Plugin، manifest بسته، artifact عمومی، API زمان اجرا، side effect واردسازی، و واردسازی مستقیم                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixtureهای زمان اجرای Plugin، registry، ثبت provider، setup-wizard، و task-flow زمان اجرا برای آزمون‌ها                                                                      |
  | `plugin-sdk/provider-test-contracts`      | helperهای قرارداد زمان اجرای provider، احراز هویت، کشف، onboard، catalog، قابلیت رسانه، سیاست replay، صوت زندهٔ STT بلادرنگ، web-search/fetch، و wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mockهای HTTP/auth اختیاری Vitest برای آزمون‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند                                                                                    |
  | `plugin-sdk/test-env`                     | fixtureهای محیط آزمون، fetch/network، سرور HTTP یک‌بارمصرف، درخواست ورودی، آزمون زنده، فایل‌سیستم موقت، و کنترل زمان                                        |
  | `plugin-sdk/test-fixtures`                | fixtureهای آزمون عمومی CLI، sandbox، skill، agent-message، system-event، بارگذاری دوبارهٔ ماژول، مسیر Plugin بسته‌بندی‌شده، terminal، chunking، auth-token، و typed-case                   |
  | `plugin-sdk/test-node-mocks`              | helperهای mock متمرکز برای builtinهای Node جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | helperهای آیتم provider مهاجرت مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای status آیتم، helperهای redaction، و `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | helperهای مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی schema ریشهٔ Zod برای `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌همراه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | helperهای setup wizard مشترک، promptهای allowlist، سازنده‌های setup status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | helperهای config/action-gate چندحسابی، helperهای fallback حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، helperهای نرمال‌سازی account-id |
    | `plugin-sdk/account-resolution` | helperهای جست‌وجوی حساب + default-fallback |
    | `plugin-sdk/account-helpers` | helperهای محدود account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitiveهای مشترک schema پیکربندی کانال و سازندهٔ عمومی |
    | `plugin-sdk/bundled-channel-config-schema` | schemaهای پیکربندی کانال بسته‌بندی‌شدهٔ OpenClaw فقط برای Pluginهای بسته‌بندی‌شدهٔ نگه‌داری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | alias سازگاری منسوخ برای schemaهای پیکربندی bundled-channel |
    | `plugin-sdk/telegram-command-config` | helperهای نرمال‌سازی/اعتبارسنجی فرمان سفارشی Telegram با fallback قرارداد بسته‌بندی‌شده |
    | `plugin-sdk/command-gating` | helperهای محدود authorization gate فرمان |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، helperهای چرخهٔ عمر/finalization جریان draft |
    | `plugin-sdk/inbound-envelope` | helperهای مشترک مسیر ورودی + سازندهٔ پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | helperهای مشترک ثبت و dispatch ورودی |
    | `plugin-sdk/messaging-targets` | helperهای parsing/matching مقصد |
    | `plugin-sdk/outbound-media` | helperهای مشترک بارگذاری رسانهٔ خروجی |
    | `plugin-sdk/outbound-send-deps` | جست‌وجوی سبک dependency ارسال خروجی برای آداپتورهای کانال |
    | `plugin-sdk/outbound-runtime` | helperهای تحویل خروجی، هویت، delegate ارسال، session، قالب‌بندی، و برنامه‌ریزی payload |
    | `plugin-sdk/poll-runtime` | helperهای محدود نرمال‌سازی poll |
    | `plugin-sdk/thread-bindings-runtime` | helperهای آداپتور و چرخهٔ عمر thread-binding |
    | `plugin-sdk/agent-media-payload` | سازندهٔ قدیمی payload رسانهٔ agent |
    | `plugin-sdk/conversation-runtime` | helperهای binding مکالمه/thread، pairing، و binding پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | helper snapshot پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | helperهای حل group-policy زمان اجرا |
    | `plugin-sdk/channel-status` | helperهای مشترک snapshot/summary وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | primitiveهای محدود config-schema کانال |
    | `plugin-sdk/channel-config-writes` | helperهای مجوز config-write کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک prelude برای Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | helperهای ویرایش/خواندن پیکربندی allowlist |
    | `plugin-sdk/group-access` | helperهای مشترک تصمیم group-access |
    | `plugin-sdk/direct-dm` | helperهای مشترک auth/guard برای direct-DM |
    | `plugin-sdk/discord` | facade سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری owner رهگیری‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | facade سازگاری منسوخ حل حساب Telegram برای سازگاری owner رهگیری‌شده؛ Pluginهای جدید باید از helperهای زمان اجرای تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | facade سازگاری منسوخ Zalo Personal برای بسته‌های Lark/Zalo منتشرشده که هنوز authorization فرمان فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | helperهای ارائهٔ معنایی پیام، تحویل، و پاسخ تعاملی قدیمی. [ارائهٔ پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | barrel سازگاری برای debounce ورودی، تطبیق mention، helperهای mention-policy، و helperهای پاکت |
    | `plugin-sdk/channel-inbound-debounce` | helperهای محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | helperهای محدود mention-policy، نشانگر mention، و متن mention بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope` | helperهای محدود قالب‌بندی پاکت ورودی |
    | `plugin-sdk/channel-location` | helperهای context و قالب‌بندی مکان کانال |
    | `plugin-sdk/channel-logging` | helperهای logging کانال برای dropهای ورودی و failureهای typing/ack |
    | `plugin-sdk/channel-send-result` | typeهای نتیجهٔ پاسخ |
    | `plugin-sdk/channel-actions` | helperهای message-action کانال، به‌همراه helperهای schema بومی منسوخ که برای سازگاری Plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | helperهای مشترک نرمال‌سازی مسیر، حل مقصد مبتنی بر parser، stringification شناسهٔ thread، کلیدهای dedupe/compact مسیر، typeهای parsed-target، و مقایسهٔ route/target |
    | `plugin-sdk/channel-targets` | helperهای parsing مقصد؛ فراخواننده‌های مقایسهٔ route باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | typeهای قرارداد کانال |
    | `plugin-sdk/channel-feedback` | wiring بازخورد/واکنش |
    | `plugin-sdk/channel-secret-runtime` | helperهای محدود secret-contract مانند `collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، و typeهای مقصد secret |
  </Accordion>

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شدهٔ ارائه‌دهندهٔ LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای پشتیبانی‌شدهٔ زمان اجرای LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌کننده‌های مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌کننده‌های گزینش‌شدهٔ راه‌اندازی ارائه‌دهندهٔ محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی ارائه‌دهندهٔ خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های نگهبان |
    | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های حل‌وفصل کلید API در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های ورود اولیه/نوشتن پروفایل کلید API مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازندهٔ استاندارد نتیجهٔ احراز هویت OAuth |
    | `plugin-sdk/provider-auth-login` | کمک‌کننده‌های مشترک ورود تعاملی برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های جست‌وجوی متغیرهای محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های نقطهٔ پایانی ارائه‌دهنده، و کمک‌کننده‌های نرمال‌سازی شناسهٔ مدل مانند `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای تقویت کاتالوگ ارائه‌دهنده و مرزهای رجیستری Plugin-ارائه‌دهنده برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌کننده‌های عمومی قابلیت HTTP/نقطهٔ پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌کننده‌های فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/انتخاب واکشی وب مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های ثبت/کش ارائه‌دهندهٔ واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های محدود پیکربندی/اعتبارنامهٔ جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های محدود قرارداد پیکربندی/اعتبارنامهٔ جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامهٔ محدوده‌دار |
    | `plugin-sdk/provider-web-search` | کمک‌کننده‌های ثبت/کش/زمان اجرای ارائه‌دهندهٔ جست‌وجوی وب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، پاک‌سازی + عیب‌یابی طرح‌وارهٔ Gemini، و کمک‌کننده‌های سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، انواع پوشانندهٔ جریان، و کمک‌کننده‌های مشترک پوشانندهٔ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل‌نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌کننده‌های وصلهٔ پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | کمک‌کننده‌های تک‌نمونه/نگاشت/کش محلیِ فرایند |
    | `plugin-sdk/group-activation` | کمک‌کننده‌های محدود حالت فعال‌سازی گروه و تجزیهٔ فرمان |
  </Accordion>

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، کمک‌کننده‌های رجیستری فرمان از جمله قالب‌بندی منوی آرگومان پویا، کمک‌کننده‌های مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌کننده‌های حل‌وفصل تأییدکننده و احراز هویت اقدام در همان گفت‌وگو |
    | `plugin-sdk/approval-client-runtime` | کمک‌کننده‌های بومی پروفایل/فیلتر تأیید اجرا |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای بومی قابلیت/تحویل تأیید |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌کنندهٔ مشترک حل‌وفصل Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کننده‌های سبک بارگذاری آداپتور بومی تأیید برای نقاط ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌کننده‌های گسترده‌تر زمان اجرای رسیدگی به تأیید؛ وقتی کافی هستند، مرزهای محدودتر آداپتور/Gateway را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌کننده‌های هدف تأیید بومی + اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | کمک‌کننده‌های payload پاسخ تأیید اجرا/Plugin |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های payload تأیید اجرا/Plugin، کمک‌کننده‌های مسیریابی/زمان اجرای تأیید بومی، و کمک‌کننده‌های نمایش ساختاریافتهٔ تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌کننده‌های محدود بازنشانی حذف تکراری پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌کننده‌های محدود آزمون قرارداد کانال بدون barrel گستردهٔ آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی منوی آرگومان پویا، و کمک‌کننده‌های بومی هدف نشست |
    | `plugin-sdk/command-detection` | کمک‌کننده‌های مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | کمک‌کننده‌های نرمال‌سازی بدنهٔ فرمان و سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود گردآوری قرارداد راز برای سطوح راز کانال/Plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌کننده‌های محدود `coerceSecretRef` و نوع‌بندی SecretRef برای تجزیهٔ قرارداد راز/پیکربندی |
    | `plugin-sdk/security-runtime` | کمک‌کننده‌های مشترک اعتماد، دروازه‌گذاری DM، محتوای خارجی، پوشاندن متن حساس، مقایسهٔ راز با زمان ثابت، و گردآوری راز |
    | `plugin-sdk/ssrf-policy` | کمک‌کننده‌های فهرست مجاز میزبان و سیاست SSRF شبکهٔ خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌کننده‌های محدود توزیع‌کنندهٔ پین‌شده بدون سطح گستردهٔ زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | توزیع‌کنندهٔ پین‌شده، واکشی محافظت‌شده با SSRF، خطای SSRF، و کمک‌کننده‌های سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌کننده‌های تجزیهٔ ورودی راز |
    | `plugin-sdk/webhook-ingress` | کمک‌کننده‌های درخواست/هدف Webhook و اجبار نوع خام websocket/بدنه |
    | `plugin-sdk/webhook-request-guards` | کمک‌کننده‌های اندازهٔ بدنه/مهلت درخواست |
  </Accordion>

  <Accordion title="زیرمسیرهای زمان اجرا و ذخیره‌سازی">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌کننده‌های گسترده زمان اجرا/ثبت گزارش/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود محیط زمان اجرا، لاگر، وقفه زمانی، تلاش مجدد و عقب‌نشینی |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای پروفایل/پیش‌فرض‌های نرمال‌سازی‌شده، تجزیه URL مربوط به CDP، و کمک‌کننده‌های احراز هویت کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های عمومی ثبت و جست‌وجوی context زمان اجرای کانال |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک فرمان/قلاب/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌کننده‌های مشترک خط لوله Webhook/قلاب داخلی |
    | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های واردسازی/اتصال تنبل زمان اجرا، مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌کننده‌های اجرای فرایند |
    | `plugin-sdk/cli-runtime` | کمک‌کننده‌های قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌کننده شروع کلاینت آماده حلقه رویداد، RPC مربوط به CLI برای Gateway، خطاهای پروتکل Gateway، و کمک‌کننده‌های patch وضعیت کانال |
    | `plugin-sdk/config-types` | سطح پیکربندی فقط-نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌کننده‌های جست‌وجوی پیکربندی Plugin در زمان اجرا، مانند `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌کننده‌های تراکنشی تغییر پیکربندی، مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده‌های snapshot پیکربندی فرایند جاری، مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و تنظیم‌کننده‌های snapshot آزمایشی |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد Telegram بسته‌بندی‌شده در دسترس نیست |
    | `plugin-sdk/text-autolink-runtime` | تشخیص autolink ارجاع فایل بدون barrel گسترده text-runtime |
    | `plugin-sdk/approval-runtime` | کمک‌کننده‌های تایید اجرا/Plugin، سازنده‌های قابلیت تایید، کمک‌کننده‌های احراز هویت/پروفایل، کمک‌کننده‌های مسیریابی/زمان اجرای بومی، و قالب‌بندی مسیر نمایش تایید ساختاریافته |
    | `plugin-sdk/reply-runtime` | کمک‌کننده‌های مشترک زمان اجرای ورودی/پاسخ، تکه‌بندی، dispatch، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود dispatch/نهایی‌سازی پاسخ و برچسب گفت‌وگو |
    | `plugin-sdk/reply-history` | کمک‌کننده‌ها و نشانگرهای مشترک تاریخچه پاسخ در بازه کوتاه، مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry` و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌کننده‌های محدود تکه‌بندی متن/Markdown |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های مسیر ذخیره نشست، کلید نشست، زمان به‌روزرسانی و تغییر ذخیره |
    | `plugin-sdk/cron-store-runtime` | کمک‌کننده‌های مسیر/بارگذاری/ذخیره ذخیره Cron |
    | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر دایرکتوری State/OAuth |
    | `plugin-sdk/routing` | کمک‌کننده‌های مسیریابی/کلید نشست/اتصال حساب، مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌کننده‌های مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، و کمک‌کننده‌های فراداده issue |
    | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های مشترک حل‌کننده هدف |
    | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های نرمال‌سازی slug/رشته |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده زمان‌دار فرمان با نتایج stdout/stderr نرمال‌سازی‌شده |
    | `plugin-sdk/param-readers` | خواننده‌های پارامتر رایج ابزار/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌سازی‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای متعارف هدف ارسال از آرگومان‌های ابزار |
    | `plugin-sdk/temp-path` | کمک‌کننده‌های مشترک مسیر دانلود موقت |
    | `plugin-sdk/logging-core` | کمک‌کننده‌های لاگر زیرسامانه و پنهان‌سازی |
    | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | کمک‌کننده‌های override مدل/نشست، مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌کننده‌های حل پیکربندی ارائه‌دهنده گفت‌وگو |
    | `plugin-sdk/json-store` | کمک‌کننده‌های کوچک خواندن/نوشتن state JSON |
    | `plugin-sdk/file-lock` | کمک‌کننده‌های file-lock بازدرآیند |
    | `plugin-sdk/persistent-dedupe` | کمک‌کننده‌های cache حذف تکراری مبتنی بر دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌کننده‌های زمان اجرا/نشست ACP و dispatch پاسخ |
    | `plugin-sdk/acp-runtime-backend` | کمک‌کننده‌های سبک ثبت backend ACP و dispatch پاسخ برای Pluginهای بارگذاری‌شده در شروع |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل اتصال ACP فقط-خواندنی بدون واردسازی‌های شروع چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | primitiveهای محدود schema پیکربندی زمان اجرای عامل |
    | `plugin-sdk/boolean-param` | خواننده سهل‌گیر پارامتر بولی |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌کننده‌های حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌کننده‌های راه‌اندازی دستگاه و توکن جفت‌سازی |
    | `plugin-sdk/extension-shared` | primitiveهای مشترک کمک‌کننده کانال غیرفعال، وضعیت و proxy محیطی |
    | `plugin-sdk/models-provider-runtime` | کمک‌کننده‌های پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌کننده‌های فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | کمک‌کننده‌های رجیستری/ساخت/سریال‌سازی فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورد اعتماد برای harnessهای سطح‌پایین عامل: انواع harness، کمک‌کننده‌های هدایت/لغو اجرای فعال، کمک‌کننده‌های پل ابزار OpenClaw، کمک‌کننده‌های سیاست ابزار برنامه زمان اجرا، دسته‌بندی خروجی ترمینال، کمک‌کننده‌های قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | کمک‌کننده‌های تشخیص endpoint مربوط به Z.AI |
    | `plugin-sdk/async-lock-runtime` | کمک‌کننده قفل async محلی فرایند برای فایل‌های کوچک state زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | کمک‌کننده تله‌متری فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌کننده هم‌زمانی taskهای async محدود |
    | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های cache حذف تکراری در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده تخلیه تحویل‌های خروجی معلق |
    | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های ایمن مسیر فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های رویداد و دیده‌شدن Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌کننده تبدیل اجباری عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌کننده‌های توکن/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | کمک‌کننده انتظار برای آماده‌بودن transport |
    | `plugin-sdk/infra-runtime` | shim سازگاری منسوخ؛ از زیرمسیرهای متمرکز زمان اجرای بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌کننده‌های کوچک cache محدود |
    | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های پرچم عیب‌یابی، رویداد و context ردیابی |
    | `plugin-sdk/error-runtime` | کمک‌کننده‌های گراف خطا، قالب‌بندی، دسته‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch بسته‌بندی‌شده، proxy، گزینه EnvHttpProxyAgent، و کمک‌کننده‌های lookup پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از dispatcher بدون واردسازی‌های proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود بدنه پاسخ بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت اتصال گفت‌وگوی جاری بدون مسیریابی اتصال پیکربندی‌شده یا ذخیره‌های جفت‌سازی |
    | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های ذخیره نشست بدون واردسازی‌های گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | حل دیده‌شدن context و فیلترکردن context تکمیلی بدون واردسازی‌های گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌کننده‌های محدود تبدیل اجباری و نرمال‌سازی رکورد/رشته primitive بدون واردسازی‌های markdown/ثبت گزارش |
    | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی نام میزبان و میزبان SCP |
    | `plugin-sdk/retry-runtime` | کمک‌کننده‌های پیکربندی تلاش مجدد و اجراکننده تلاش مجدد |
    | `plugin-sdk/agent-runtime` | کمک‌کننده‌های دایرکتوری/هویت/فضای کاری عامل |
    | `plugin-sdk/directory-runtime` | query/dedup دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمایش">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک واکشی/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو مبتنی بر ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-store` | کمک‌کننده‌های محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک failover برای تولید رسانه، انتخاب نامزد، و پیام‌رسانی مدلِ مفقود |
    | `plugin-sdk/media-understanding` | انواع provider درک رسانه به‌همراه خروجی‌های کمک‌کننده تصویر/صوت برای provider |
    | `plugin-sdk/text-runtime` | کمک‌کننده‌های مشترک متن/markdown/ثبت گزارش مانند حذف متن قابل‌مشاهده برای دستیار، کمک‌کننده‌های رندر/chunking/جدول markdown، کمک‌کننده‌های redaction، کمک‌کننده‌های تگ directive، و ابزارهای متن امن |
    | `plugin-sdk/text-chunking` | کمک‌کننده chunking متن خروجی |
    | `plugin-sdk/speech` | انواع provider گفتار به‌همراه خروجی‌های directive، registry، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و کمک‌کننده‌های گفتار برای provider |
    | `plugin-sdk/speech-core` | انواع مشترک provider گفتار، registry، directive، نرمال‌سازی، و خروجی‌های کمک‌کننده گفتار |
    | `plugin-sdk/realtime-transcription` | انواع provider رونویسی بلادرنگ، کمک‌کننده‌های registry، و کمک‌کننده مشترک جلسه WebSocket |
    | `plugin-sdk/realtime-voice` | انواع provider صدای بلادرنگ و کمک‌کننده‌های registry |
    | `plugin-sdk/image-generation` | انواع provider تولید تصویر به‌همراه کمک‌کننده‌های URL داده/دارایی تصویر و سازنده provider تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | انواع مشترک تولید تصویر، failover، احراز هویت، و کمک‌کننده‌های registry |
    | `plugin-sdk/music-generation` | انواع provider/request/result تولید موسیقی |
    | `plugin-sdk/music-generation-core` | انواع مشترک تولید موسیقی، کمک‌کننده‌های failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/video-generation` | انواع provider/request/result تولید ویدئو |
    | `plugin-sdk/video-generation-core` | انواع مشترک تولید ویدئو، کمک‌کننده‌های failover، جست‌وجوی provider، و تجزیه model-ref |
    | `plugin-sdk/webhook-targets` | registry هدف Webhook و کمک‌کننده‌های نصب route |
    | `plugin-sdk/webhook-path` | کمک‌کننده‌های نرمال‌سازی مسیر Webhook |
    | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک بارگذاری رسانه دور/محلی |
    | `plugin-sdk/zod` | `zod` بازصادرشده برای مصرف‌کنندگان plugin SDK |
    | `plugin-sdk/testing` | barrel سازگاری گسترده برای آزمایش‌های Plugin قدیمی. آزمایش‌های extension جدید باید به‌جای آن زیرمسیرهای متمرکز SDK مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env` یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌کننده حداقلی `createTestPluginApi` برای آزمایش‌های واحد ثبت مستقیم Plugin بدون import کردن پل‌های کمک‌کننده آزمایش repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی agent-runtime برای آزمایش‌های احراز هویت، تحویل، fallback، tool-hook، prompt-overlay، schema، و projection transcript |
    | `plugin-sdk/channel-test-helpers` | کمک‌کننده‌های آزمایش کانال‌محور برای قراردادهای عمومی action/setup/status، assertionهای directory، چرخه عمر راه‌اندازی حساب، threading پیکربندی ارسال، mockهای runtime، issueهای status، تحویل خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک موردهای خطای target-resolution برای آزمایش‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | کمک‌کننده‌های قرارداد package Plugin، ثبت، artifact عمومی، import مستقیم، runtime API، و side effectهای import |
    | `plugin-sdk/provider-test-contracts` | کمک‌کننده‌های قرارداد runtime، احراز هویت، discovery، onboard، catalog، wizard، قابلیت رسانه، سیاست replay، صدای زنده STT بلادرنگ، web-search/fetch، و stream برای provider |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/احراز هویت Vitest اختیاری برای آزمایش‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی ثبت runtime در CLI، زمینه sandbox، نویسنده skill، agent-message، system-event، بارگذاری دوباره module، مسیر Plugin بسته‌بندی‌شده، terminal-text، chunking، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌کننده‌های mock متمرکز برای Node builtin جهت استفاده درون factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌کننده memory-core بسته‌بندی‌شده برای کمک‌کننده‌های manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | نمای runtime برای index/search حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های engine بنیاد host حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی registry، provider محلی، و کمک‌کننده‌های عمومی batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های engine QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های engine ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های multimodal میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | کمک‌کننده‌های event journal میزبان حافظه |
    | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های status میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌کننده‌های runtime CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌کننده‌های runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-core` | alias بی‌طرف نسبت به vendor برای کمک‌کننده‌های runtime هسته میزبان حافظه |
    | `plugin-sdk/memory-host-events` | alias بی‌طرف نسبت به vendor برای کمک‌کننده‌های event journal میزبان حافظه |
    | `plugin-sdk/memory-host-files` | alias بی‌طرف نسبت به vendor برای کمک‌کننده‌های file/runtime میزبان حافظه |
    | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های managed-markdown مشترک برای Pluginهای نزدیک به حافظه |
    | `plugin-sdk/memory-host-search` | نمای runtime برای Active Memory جهت دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | alias بی‌طرف نسبت به vendor برای کمک‌کننده‌های status میزبان حافظه |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشده کمک‌کننده‌های بسته‌بندی‌شده">
    در حال حاضر هیچ زیرمسیر SDK رزروشده‌ای برای کمک‌کننده‌های بسته‌بندی‌شده وجود ندارد. کمک‌کننده‌های مخصوص مالک
    درون package Plugin مالک قرار دارند، در حالی که قراردادهای میزبان قابل‌استفاده‌مجدد
    از زیرمسیرهای عمومی SDK مانند `plugin-sdk/gateway-runtime`،
    `plugin-sdk/security-runtime` و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
