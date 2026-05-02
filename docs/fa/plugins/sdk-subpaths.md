---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای ایمپورت Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و سطوح کمکی
summary: 'فهرست زیرمسیرهای SDK Plugin: اینکه هر واردسازی کجا قرار دارد، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای Plugin SDK
x-i18n:
    generated_at: "2026-05-02T20:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK مربوط به Plugin به‌صورت مجموعه‌ای از زیرمسیرهای محدود زیر `openclaw/plugin-sdk/` ارائه می‌شود.
  این صفحه زیرمسیرهای پرکاربرد را بر اساس هدف دسته‌بندی و فهرست می‌کند. فهرست کامل تولیدشده
  از بیش از ۲۰۰ زیرمسیر در `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛
  زیرمسیرهای کمکی رزروشده برای Pluginهای همراه نیز آنجا دیده می‌شوند، اما جزئیات
  پیاده‌سازی محسوب می‌شوند مگر اینکه یک صفحه مستندات صراحتا آن‌ها را معرفی کند. نگه‌دارندگان می‌توانند
  زیرمسیرهای کمکی رزروشده فعال را با `pnpm plugins:boundary-report:summary` ممیزی کنند؛ خروجی‌های
  کمکی رزروشده استفاده‌نشده، به‌جای اینکه به‌عنوان بدهی سازگاری خاموش در SDK عمومی
  باقی بمانند، گزارش CI را ناموفق می‌کنند.

  برای راهنمای نوشتن Plugin، به [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) مراجعه کنید.

  ## ورودی Plugin

  | زیرمسیر                                   | خروجی‌های کلیدی                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | barrel سازگاری گسترده برای تست‌های قدیمی Plugin؛ برای تست‌های جدید افزونه، زیرمسیرهای تست متمرکز را ترجیح دهید                                                                     |
  | `plugin-sdk/plugin-test-api`              | سازنده mock حداقلی `OpenClawPluginApi` برای تست‌های واحد ثبت مستقیم Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای قرارداد adapter بومی زمان اجرای agent برای پروفایل‌های auth، سرکوب تحویل، دسته‌بندی fallback، hookهای ابزار، overlayهای prompt، schemaها، و ترمیم transcript |
  | `plugin-sdk/channel-test-helpers`         | کمک‌کننده‌های تست قرارداد چرخه عمر account کانال، directory، send-config، mock زمان اجرا، hook، ورودی کانال همراه، timestamp پاکت، پاسخ pairing، و کانال عمومی   |
  | `plugin-sdk/channel-target-testing`       | مجموعه تست مشترک برای حالت‌های خطای target-resolution کانال                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | کمک‌کننده‌های قرارداد ثبت Plugin، manifest بسته، artifact عمومی، API زمان اجرا، side-effect واردسازی، و واردسازی مستقیم                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixtureهای زمان اجرای Plugin، registry، ثبت provider، setup-wizard، و task-flow زمان اجرا برای تست‌ها                                                                      |
  | `plugin-sdk/provider-test-contracts`      | کمک‌کننده‌های قرارداد زمان اجرای provider، auth، discovery، onboard، catalog، قابلیت رسانه، سیاست replay، صدای زنده STT بلادرنگ، web-search/fetch، و wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mockهای Vitest HTTP/auth اختیاری برای تست‌های provider که `plugin-sdk/provider-http` را اجرا می‌کنند                                                                                    |
  | `plugin-sdk/test-env`                     | fixtureهای محیط تست، fetch/network، سرور HTTP disposable، درخواست ورودی، live-test، فایل‌سیستم موقت، و کنترل زمان                                        |
  | `plugin-sdk/test-fixtures`                | fixtureهای تست عمومی CLI، sandbox، skill، agent-message، system-event، reload ماژول، مسیر Plugin همراه، terminal، chunking، auth-token، و typed-case                   |
  | `plugin-sdk/test-node-mocks`              | کمک‌کننده‌های mock متمرکز برای builtinهای Node جهت استفاده داخل factoryهای Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | کمک‌کننده‌های item مربوط به provider مهاجرت مانند `createMigrationItem`، ثابت‌های reason، نشانگرهای status آیتم، کمک‌کننده‌های redaction، و `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | کمک‌کننده‌های مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `withCachedMigrationConfigRuntime`، و `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | خروجی schema ریشه `openclaw.json` Zod (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | کمک‌کننده‌های مشترک setup wizard، promptهای allowlist، سازنده‌های status راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | کمک‌کننده‌های config/action-gate چند-account، کمک‌کننده‌های fallback account پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، کمک‌کننده‌های نرمال‌سازی account-id |
    | `plugin-sdk/account-resolution` | کمک‌کننده‌های lookup account و default-fallback |
    | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitiveهای مشترک schema پیکربندی کانال به‌همراه سازنده‌های Zod و JSON/TypeBox مستقیم |
    | `plugin-sdk/bundled-channel-config-schema` | schemaهای پیکربندی کانال همراه OpenClaw فقط برای Pluginهای همراه نگه‌داری‌شده |
    | `plugin-sdk/channel-config-schema-legacy` | alias سازگاری منسوخ برای schemaهای پیکربندی bundled-channel |
    | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های نرمال‌سازی/اعتبارسنجی فرمان سفارشی Telegram با fallback قرارداد همراه |
    | `plugin-sdk/command-gating` | کمک‌کننده‌های محدود gate مجوزدهی فرمان |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، کمک‌کننده‌های چرخه عمر/نهایی‌سازی draft stream |
    | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های مشترک route ورودی و سازنده envelope |
    | `plugin-sdk/inbound-reply-dispatch` | کمک‌کننده‌های مشترک record-and-dispatch ورودی |
    | `plugin-sdk/messaging-targets` | کمک‌کننده‌های parse/match هدف |
    | `plugin-sdk/outbound-media` | کمک‌کننده‌های مشترک بارگذاری رسانه خروجی |
    | `plugin-sdk/outbound-send-deps` | lookup سبک وابستگی send خروجی برای adapterهای کانال |
    | `plugin-sdk/outbound-runtime` | کمک‌کننده‌های تحویل خروجی، identity، send delegate، session، formatting، و برنامه‌ریزی payload |
    | `plugin-sdk/poll-runtime` | کمک‌کننده‌های محدود نرمال‌سازی poll |
    | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های چرخه عمر thread-binding و adapter |
    | `plugin-sdk/agent-media-payload` | سازنده قدیمی payload رسانه agent |
    | `plugin-sdk/conversation-runtime` | کمک‌کننده‌های binding مکالمه/thread، pairing، و binding پیکربندی‌شده |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌کننده snapshot پیکربندی زمان اجرا |
    | `plugin-sdk/runtime-group-policy` | کمک‌کننده‌های resolution سیاست گروه زمان اجرا |
    | `plugin-sdk/channel-status` | کمک‌کننده‌های مشترک snapshot/summary status کانال |
    | `plugin-sdk/channel-config-primitives` | primitiveهای محدود schema پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های مجوزدهی config-write کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های prelude مشترک Plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های ویرایش/خواندن config allowlist |
    | `plugin-sdk/group-access` | کمک‌کننده‌های مشترک تصمیم‌گیری group-access |
    | `plugin-sdk/direct-dm` | کمک‌کننده‌های مشترک auth/guard برای direct-DM |
    | `plugin-sdk/discord` | facade سازگاری منسوخ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری owner ردیابی‌شده؛ Pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | facade سازگاری منسوخ resolution حساب Telegram برای سازگاری owner ردیابی‌شده؛ Pluginهای جدید باید از کمک‌کننده‌های تزریق‌شده زمان اجرا یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | facade سازگاری منسوخ Zalo Personal برای بسته‌های منتشرشده Lark/Zalo که هنوز مجوزدهی فرمان فرستنده را import می‌کنند؛ Pluginهای جدید باید از `plugin-sdk/command-auth` استفاده کنند |
    | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های معنایی ارائه پیام، تحویل، و پاسخ interactive قدیمی. به [ارائه پیام](/fa/plugins/message-presentation) مراجعه کنید |
    | `plugin-sdk/channel-inbound` | barrel سازگاری برای debounce ورودی، match کردن mention، کمک‌کننده‌های mention-policy، و کمک‌کننده‌های envelope |
    | `plugin-sdk/channel-inbound-debounce` | کمک‌کننده‌های محدود debounce ورودی |
    | `plugin-sdk/channel-mention-gating` | کمک‌کننده‌های محدود mention-policy، نشانگر mention، و متن mention بدون سطح گسترده‌تر runtime ورودی |
    | `plugin-sdk/channel-envelope` | کمک‌کننده‌های محدود formatting پاکت ورودی |
    | `plugin-sdk/channel-location` | context موقعیت کانال و کمک‌کننده‌های formatting |
    | `plugin-sdk/channel-logging` | کمک‌کننده‌های logging کانال برای dropهای ورودی و خطاهای typing/ack |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجه reply |
    | `plugin-sdk/channel-actions` | کمک‌کننده‌های message-action کانال، به‌علاوه کمک‌کننده‌های schema بومی منسوخ که برای سازگاری Plugin حفظ شده‌اند |
    | `plugin-sdk/channel-route` | کمک‌کننده‌های مشترک نرمال‌سازی route، resolution هدف parser-driven، stringification شناسه thread، کلیدهای route dedupe/compact، نوع‌های parsed-target، و مقایسه route/target |
    | `plugin-sdk/channel-targets` | کمک‌کننده‌های parse هدف؛ فراخوان‌های مقایسه route باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | کمک‌کننده‌های محدود secret-contract مانند `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، و نوع‌های secret target |
  </Accordion>

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های اصلی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شدهٔ ارائه‌دهندهٔ LM Studio برای راه‌اندازی، کشف کاتالوگ، و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای زمان اجرای پشتیبانی‌شدهٔ LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست، و کمک‌گرهای مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | کمک‌گرهای گزینش‌شده برای راه‌اندازی ارائه‌دهندهٔ محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | کمک‌گرهای متمرکز راه‌اندازی ارائه‌دهندهٔ خودمیزبان سازگار با OpenAI |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI + ثابت‌های watchdog |
    | `plugin-sdk/provider-auth-runtime` | کمک‌گرهای رفع API-key در زمان اجرا برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-auth-api-key` | کمک‌گرهای راه‌اندازی/API-key و نوشتن پروفایل مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازندهٔ استاندارد نتیجهٔ احراز هویت OAuth |
    | `plugin-sdk/provider-auth-login` | کمک‌گرهای ورود تعاملی مشترک برای Pluginهای ارائه‌دهنده |
    | `plugin-sdk/provider-env-vars` | کمک‌گرهای جست‌وجوی متغیرهای محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، کمک‌گرهای نقطهٔ پایانی ارائه‌دهنده، و کمک‌گرهای عادی‌سازی شناسهٔ مدل مانند `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | هوک زمان اجرای غنی‌سازی کاتالوگ ارائه‌دهنده و درزهای رجیستری Plugin-ارائه‌دهنده برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | کمک‌گرهای عمومی قابلیت HTTP/نقطهٔ پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده، و کمک‌گرهای فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | کمک‌گرهای باریک قرارداد پیکربندی/انتخاب web-fetch مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | کمک‌گرهای ثبت/کش ارائه‌دهندهٔ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | کمک‌گرهای باریک پیکربندی/اعتبارنامهٔ web-search برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | کمک‌گرهای باریک قرارداد پیکربندی/اعتبارنامهٔ web-search مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامهٔ دامنه‌مند |
    | `plugin-sdk/provider-web-search` | کمک‌گرهای ثبت/کش/زمان اجرای ارائه‌دهندهٔ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، پاک‌سازی + عیب‌یابی schema برای Gemini، و کمک‌گرهای سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` و موارد مشابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، انواع پوشش‌دهندهٔ stream، و کمک‌گرهای مشترک پوشش‌دهندهٔ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | کمک‌گرهای انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، تبدیل‌های پیام انتقال، و streamهای رویداد انتقال قابل نوشتن |
    | `plugin-sdk/provider-onboard` | کمک‌گرهای وصلهٔ پیکربندی راه‌اندازی اولیه |
    | `plugin-sdk/global-singleton` | کمک‌گرهای singleton/map/cache محلی فرایند |
    | `plugin-sdk/group-activation` | کمک‌گرهای باریک حالت فعال‌سازی گروه و تجزیهٔ دستور |
  </Accordion>

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های اصلی |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، کمک‌گرهای رجیستری دستور شامل قالب‌بندی منوی آرگومان پویا، کمک‌گرهای مجوزدهی فرستنده |
    | `plugin-sdk/command-status` | سازنده‌های پیام دستور/راهنما مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | کمک‌گرهای رفع تأییدکننده و احراز هویت اقدام در همان چت |
    | `plugin-sdk/approval-client-runtime` | کمک‌گرهای پروفایل/فیلتر تأیید exec بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | کمک‌گر مشترک رفع Gateway تأیید |
    | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌گرهای سبک بارگذاری آداپتور تأیید بومی برای نقطه‌های ورود داغ کانال |
    | `plugin-sdk/approval-handler-runtime` | کمک‌گرهای گسترده‌تر زمان اجرای مدیریت‌کنندهٔ تأیید؛ وقتی درزهای باریک‌تر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | کمک‌گرهای هدف تأیید بومی + اتصال حساب |
    | `plugin-sdk/approval-reply-runtime` | کمک‌گرهای payload پاسخ تأیید exec/plugin |
    | `plugin-sdk/approval-runtime` | کمک‌گرهای payload تأیید exec/plugin، کمک‌گرهای مسیریابی/زمان اجرای تأیید بومی، و کمک‌گرهای نمایش ساختاریافتهٔ تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | کمک‌گرهای باریک بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/channel-contract-testing` | کمک‌گرهای باریک آزمون قرارداد کانال بدون barrel گستردهٔ آزمون |
    | `plugin-sdk/command-auth-native` | احراز هویت دستور بومی، قالب‌بندی منوی آرگومان پویا، و کمک‌گرهای هدف جلسهٔ بومی |
    | `plugin-sdk/command-detection` | کمک‌گرهای مشترک تشخیص دستور |
    | `plugin-sdk/command-primitives-runtime` | predicateهای سبک متن دستور برای مسیرهای داغ کانال |
    | `plugin-sdk/command-surface` | عادی‌سازی بدنهٔ دستور و کمک‌گرهای سطح دستور |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | کمک‌گرهای باریک گردآوری قرارداد secret برای سطوح secret کانال/plugin |
    | `plugin-sdk/secret-ref-runtime` | کمک‌گرهای باریک `coerceSecretRef` و نوع‌دهی SecretRef برای تجزیهٔ قرارداد/پیکربندی secret |
    | `plugin-sdk/security-runtime` | کمک‌گرهای مشترک اعتماد، گیت‌گذاری DM، محتوای خارجی، ویرایش متن حساس، مقایسهٔ secret در زمان ثابت، و گردآوری secret |
    | `plugin-sdk/ssrf-policy` | کمک‌گرهای فهرست مجاز میزبان و سیاست SSRF شبکهٔ خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | کمک‌گرهای باریک pinned-dispatcher بدون سطح گستردهٔ زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | کمک‌گرهای pinned-dispatcher، fetch محافظت‌شده با SSRF، خطای SSRF، و سیاست SSRF |
    | `plugin-sdk/secret-input` | کمک‌گرهای تجزیهٔ ورودی secret |
    | `plugin-sdk/webhook-ingress` | کمک‌گرهای درخواست/هدف Webhook و تبدیل websocket/body خام |
    | `plugin-sdk/webhook-request-guards` | کمک‌گرهای اندازهٔ بدنهٔ درخواست/timeout |
  </Accordion>

  <Accordion title="زیرمسیرهای زمان اجرا و ذخیره‌سازی">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | کمک‌گرهای گسترده زمان اجرا/ثبت گزارش/پشتیبان‌گیری/نصب Plugin |
    | `plugin-sdk/runtime-env` | کمک‌گرهای محدود محیط زمان اجرا، گزارش‌گر، زمان‌سنج، تلاش مجدد، و عقب‌نشینی |
    | `plugin-sdk/browser-config` | نمای پیکربندی مرورگر پشتیبانی‌شده برای پروفایل/پیش‌فرض‌های نرمال‌شده، تجزیه URL مربوط به CDP، و کمک‌گرهای احراز هویت کنترل مرورگر |
    | `plugin-sdk/channel-runtime-context` | کمک‌گرهای عمومی ثبت و جست‌وجوی زمینه زمان اجرای کانال |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | کمک‌گرهای مشترک فرمان/hook/http/تعاملی Plugin |
    | `plugin-sdk/hook-runtime` | کمک‌گرهای مشترک خط لوله Webhook/هوک داخلی |
    | `plugin-sdk/lazy-runtime` | کمک‌گرهای واردسازی/اتصال تنبل زمان اجرا مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | کمک‌گرهای اجرای پردازش |
    | `plugin-sdk/cli-runtime` | کمک‌گرهای قالب‌بندی CLI، انتظار، نسخه، فراخوانی با آرگومان، و گروه فرمان تنبل |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، کمک‌گر شروع کلاینت آماده حلقه رویداد، RPC مربوط به CLI Gateway، خطاهای پروتکل Gateway، و کمک‌گرهای وصله وضعیت کانال |
    | `plugin-sdk/config-types` | سطح پیکربندی فقط-نوع برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | کمک‌گرهای جست‌وجوی پیکربندی Plugin در زمان اجرا مانند `requireRuntimeConfig`، `resolvePluginConfigObject`، و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | کمک‌گرهای تغییر تراکنشی پیکربندی مانند `mutateConfigFile`، `replaceConfigFile`، و `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | کمک‌گرهای اسنپ‌شات پیکربندی پردازش فعلی مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot`، و تنظیم‌کننده‌های اسنپ‌شات تست |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی نام/توضیح فرمان Telegram و بررسی‌های تکرار/تعارض، حتی وقتی سطح قرارداد بسته‌بندی‌شده Telegram در دسترس نباشد |
    | `plugin-sdk/text-autolink-runtime` | تشخیص پیوند خودکار ارجاع فایل بدون بشکه گسترده text-runtime |
    | `plugin-sdk/approval-runtime` | کمک‌گرهای تأیید اجرا/Plugin، سازنده‌های قابلیت تأیید، کمک‌گرهای احراز هویت/پروفایل، کمک‌گرهای مسیریابی/زمان اجرای بومی، و قالب‌بندی مسیر نمایش تأیید ساخت‌یافته |
    | `plugin-sdk/reply-runtime` | کمک‌گرهای مشترک زمان اجرای ورودی/پاسخ، قطعه‌بندی، ارسال، Heartbeat، برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | کمک‌گرهای محدود ارسال/نهایی‌سازی پاسخ و برچسب گفت‌وگو |
    | `plugin-sdk/reply-history` | کمک‌گرها و نشانگرهای مشترک تاریخچه پاسخ در پنجره کوتاه مانند `buildHistoryContext`، `HISTORY_CONTEXT_MARKER`، `recordPendingHistoryEntry`، و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | کمک‌گرهای محدود قطعه‌بندی متن/Markdown |
    | `plugin-sdk/session-store-runtime` | کمک‌گرهای مسیر ذخیره نشست، کلید نشست، به‌روزشده-در، و تغییر ذخیره |
    | `plugin-sdk/cron-store-runtime` | کمک‌گرهای مسیر/بارگذاری/ذخیره ذخیره Cron |
    | `plugin-sdk/state-paths` | کمک‌گرهای مسیر دایرکتوری State/OAuth |
    | `plugin-sdk/routing` | کمک‌گرهای مسیر/کلید نشست/اتصال حساب مانند `resolveAgentRoute`، `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | کمک‌گرهای مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، و کمک‌گرهای فراداده مسئله |
    | `plugin-sdk/target-resolver-runtime` | کمک‌گرهای مشترک حل‌کننده هدف |
    | `plugin-sdk/string-normalization-runtime` | کمک‌گرهای نرمال‌سازی اسلاگ/رشته |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های شبیه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده فرمان زمان‌دار با نتایج نرمال‌شده stdout/stderr |
    | `plugin-sdk/param-readers` | خواننده‌های رایج پارامتر ابزار/CLI |
    | `plugin-sdk/tool-payload` | استخراج payloadهای نرمال‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای متعارف هدف ارسال از آرگومان‌های ابزار |
    | `plugin-sdk/temp-path` | کمک‌گرهای مشترک مسیر دانلود موقت |
    | `plugin-sdk/logging-core` | کمک‌گرهای گزارش‌گر زیرسامانه و پوشاندن اطلاعات حساس |
    | `plugin-sdk/markdown-table-runtime` | کمک‌گرهای حالت جدول Markdown و تبدیل |
    | `plugin-sdk/model-session-runtime` | کمک‌گرهای بازنویسی مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | کمک‌گرهای حل پیکربندی ارائه‌دهنده گفت‌وگو |
    | `plugin-sdk/json-store` | کمک‌گرهای کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/file-lock` | کمک‌گرهای قفل فایل بازدرآیند |
    | `plugin-sdk/persistent-dedupe` | کمک‌گرهای کش حذف تکرار با پشتوانه دیسک |
    | `plugin-sdk/acp-runtime` | کمک‌گرهای زمان اجرا/نشست ACP و ارسال پاسخ |
    | `plugin-sdk/acp-runtime-backend` | کمک‌گرهای سبک ثبت backend و ارسال پاسخ ACP برای Pluginهای بارگذاری‌شده هنگام راه‌اندازی |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل اتصال فقط-خواندنی ACP بدون واردسازی‌های راه‌اندازی چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | ابتدایی‌های محدود شمای پیکربندی زمان اجرای عامل |
    | `plugin-sdk/boolean-param` | خواننده پارامتر بولی آزاد |
    | `plugin-sdk/dangerous-name-runtime` | کمک‌گرهای حل تطبیق نام خطرناک |
    | `plugin-sdk/device-bootstrap` | کمک‌گرهای راه‌اندازی اولیه دستگاه و توکن جفت‌سازی |
    | `plugin-sdk/extension-shared` | ابتدایی‌های مشترک کانال غیرفعال، وضعیت، و کمک‌گر پراکسی محیطی |
    | `plugin-sdk/models-provider-runtime` | کمک‌گرهای پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | کمک‌گرهای فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | کمک‌گرهای رجیستری/ساخت/سریال‌سازی فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورد اعتماد برای harnessهای سطح پایین عامل: انواع harness، کمک‌گرهای هدایت/لغو اجرای فعال، کمک‌گرهای پل ابزار OpenClaw، کمک‌گرهای سیاست ابزار برنامه زمان اجرا، طبقه‌بندی نتیجه ترمینال، کمک‌گرهای قالب‌بندی/جزئیات پیشرفت ابزار، و ابزارهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | کمک‌گرهای تشخیص endpoint مربوط به Z.AI |
    | `plugin-sdk/async-lock-runtime` | کمک‌گر قفل async محلیِ پردازش برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | کمک‌گر تله‌متری فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | کمک‌گر هم‌روندی محدود taskهای async |
    | `plugin-sdk/dedupe-runtime` | کمک‌گرهای کش حذف تکرار در حافظه |
    | `plugin-sdk/delivery-queue-runtime` | کمک‌گر تخلیه تحویل‌های خروجی معلق |
    | `plugin-sdk/file-access-runtime` | کمک‌گرهای مسیر امن فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | کمک‌گرهای رویداد و رؤیت‌پذیری Heartbeat |
    | `plugin-sdk/number-runtime` | کمک‌گر تبدیل عددی |
    | `plugin-sdk/secure-random-runtime` | کمک‌گرهای توکن/UUID امن |
    | `plugin-sdk/system-event-runtime` | کمک‌گرهای صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | کمک‌گر انتظار برای آمادگی ترابری |
    | `plugin-sdk/infra-runtime` | شیم سازگاری منسوخ؛ از زیرمسیرهای متمرکز زمان اجرا در بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | کمک‌گرهای کوچک کش محدود |
    | `plugin-sdk/diagnostic-runtime` | کمک‌گرهای پرچم تشخیصی، رویداد، و زمینه trace |
    | `plugin-sdk/error-runtime` | کمک‌گرهای گراف خطا، قالب‌بندی، طبقه‌بندی مشترک خطا، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | کمک‌گرهای fetch پوشیده‌شده، پراکسی، گزینه EnvHttpProxyAgent، و جست‌وجوی پین‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرا آگاه از dispatcher بدون واردسازی‌های پراکسی/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | خواننده محدود بدنه پاسخ بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت اتصال گفت‌وگوی فعلی بدون مسیریابی اتصال پیکربندی‌شده یا ذخیره‌های جفت‌سازی |
    | `plugin-sdk/session-store-runtime` | کمک‌گرهای ذخیره نشست بدون واردسازی‌های گسترده نوشتن/نگهداری پیکربندی |
    | `plugin-sdk/context-visibility-runtime` | حل رؤیت‌پذیری زمینه و فیلتر زمینه تکمیلی بدون واردسازی‌های گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | کمک‌گرهای محدود تبدیل و نرمال‌سازی رکورد/رشته ابتدایی بدون واردسازی‌های Markdown/ثبت گزارش |
    | `plugin-sdk/host-runtime` | کمک‌گرهای نرمال‌سازی نام میزبان و میزبان SCP |
    | `plugin-sdk/retry-runtime` | کمک‌گرهای پیکربندی تلاش مجدد و اجراکننده تلاش مجدد |
    | `plugin-sdk/agent-runtime` | کمک‌گرهای دایرکتوری/هویت/فضای کاری عامل |
    | `plugin-sdk/directory-runtime` | پرس‌وجو/حذف تکرار دایرکتوری مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیربخش‌های قابلیت و آزمون">
    | زیربخش | اکسپورت‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک برای واکشی/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو مبتنی بر ffprobe، و سازنده‌های payload رسانه |
    | `plugin-sdk/media-store` | کمک‌کننده‌های محدود ذخیره‌گاه رسانه مانند `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک failover تولید رسانه، انتخاب نامزد، و پیام‌رسانی مدلِ مفقود |
    | `plugin-sdk/media-understanding` | نوع‌های ارائه‌دهنده درک رسانه به‌همراه اکسپورت‌های کمک‌کننده تصویر/صدا برای ارائه‌دهنده‌ها |
    | `plugin-sdk/text-runtime` | کمک‌کننده‌های مشترک متن/مارک‌داون/لاگ‌گیری، مانند حذف متن قابل‌مشاهده برای دستیار، کمک‌کننده‌های رندر/تکه‌بندی/جدول مارک‌داون، کمک‌کننده‌های پوشاندن، کمک‌کننده‌های برچسب دستور، و ابزارهای متن امن |
    | `plugin-sdk/text-chunking` | کمک‌کننده تکه‌بندی متن خروجی |
    | `plugin-sdk/speech` | نوع‌های ارائه‌دهنده گفتار به‌همراه اکسپورت‌های دستور، رجیستری، اعتبارسنجی، سازنده TTS سازگار با OpenAI، و کمک‌کننده‌های گفتار برای ارائه‌دهنده‌ها |
    | `plugin-sdk/speech-core` | نوع‌های مشترک ارائه‌دهنده گفتار، رجیستری، دستور، نرمال‌سازی، و اکسپورت‌های کمک‌کننده گفتار |
    | `plugin-sdk/realtime-transcription` | نوع‌های ارائه‌دهنده رونویسی بی‌درنگ، کمک‌کننده‌های رجیستری، و کمک‌کننده مشترک نشست WebSocket |
    | `plugin-sdk/realtime-voice` | نوع‌های ارائه‌دهنده صدای بی‌درنگ و کمک‌کننده‌های رجیستری |
    | `plugin-sdk/image-generation` | نوع‌های ارائه‌دهنده تولید تصویر به‌همراه کمک‌کننده‌های asset تصویر/URL داده و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | نوع‌های مشترک تولید تصویر، failover، احراز هویت، و کمک‌کننده‌های رجیستری |
    | `plugin-sdk/music-generation` | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
    | `plugin-sdk/music-generation-core` | نوع‌های مشترک تولید موسیقی، کمک‌کننده‌های failover، جست‌وجوی ارائه‌دهنده، و تجزیه model-ref |
    | `plugin-sdk/video-generation` | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
    | `plugin-sdk/video-generation-core` | نوع‌های مشترک تولید ویدئو، کمک‌کننده‌های failover، جست‌وجوی ارائه‌دهنده، و تجزیه model-ref |
    | `plugin-sdk/webhook-targets` | رجیستری هدف Webhook و کمک‌کننده‌های نصب مسیر |
    | `plugin-sdk/webhook-path` | کمک‌کننده‌های نرمال‌سازی مسیر Webhook |
    | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک بارگذاری رسانه راه‌دور/محلی |
    | `plugin-sdk/zod` | `zod` بازصادرشده برای مصرف‌کنندگان Plugin SDK |
    | `plugin-sdk/testing` | barrel سازگاری گسترده برای آزمون‌های Plugin قدیمی. آزمون‌های افزونه جدید باید به‌جای آن زیربخش‌های متمرکز SDK مانند `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` را import کنند |
    | `plugin-sdk/plugin-test-api` | کمک‌کننده حداقلی `createTestPluginApi` برای آزمون‌های واحد ثبت مستقیم Plugin، بدون import کردن پل‌های کمک‌کننده آزمون مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | fixtureهای بومی قرارداد adapter زمان‌اجرای عامل برای آزمون‌های احراز هویت، تحویل، fallback، tool-hook، prompt-overlay، schema، و تصویرسازی transcript |
    | `plugin-sdk/channel-test-helpers` | کمک‌کننده‌های آزمون کانال‌محور برای قراردادهای عمومی کنش/راه‌اندازی/وضعیت، assertionهای دایرکتوری، چرخه‌عمر راه‌اندازی حساب، رشته‌سازی send-config، mockهای زمان‌اجرا، مسائل وضعیت، تحویل خروجی، و ثبت hook |
    | `plugin-sdk/channel-target-testing` | مجموعه مشترک حالت‌های خطای هدف‌یابی برای آزمون‌های کانال |
    | `plugin-sdk/plugin-test-contracts` | کمک‌کننده‌های قرارداد بسته Plugin، ثبت، artifact عمومی، import مستقیم، API زمان‌اجرا، و side-effectهای import |
    | `plugin-sdk/provider-test-contracts` | کمک‌کننده‌های قرارداد زمان‌اجرای ارائه‌دهنده، احراز هویت، کشف، onboard، کاتالوگ، wizard، قابلیت رسانه، سیاست replay، صدای زنده STT بی‌درنگ، جست‌وجو/واکشی وب، و stream |
    | `plugin-sdk/provider-http-test-mocks` | mockهای HTTP/احراز هویت اختیاری Vitest برای آزمون‌های ارائه‌دهنده که `plugin-sdk/provider-http` را اجرا می‌کنند |
    | `plugin-sdk/test-fixtures` | fixtureهای عمومی برای ثبت زمان‌اجرای CLI، زمینه sandbox، نویسنده Skills، agent-message، system-event، بارگذاری دوباره ماژول، مسیر Plugin بسته‌بندی‌شده، terminal-text، تکه‌بندی، auth-token، و typed-case |
    | `plugin-sdk/test-node-mocks` | کمک‌کننده‌های mock متمرکز داخلی Node برای استفاده در factoryهای Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="زیربخش‌های حافظه">
    | زیربخش | اکسپورت‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح کمک‌کننده memory-core بسته‌بندی‌شده برای کمک‌کننده‌های مدیر/پیکربندی/فایل/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | نمای زمان‌اجرای index/search حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | اکسپورت‌های موتور بنیاد میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای embedding میزبان حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و کمک‌کننده‌های عمومی دسته‌ای/راه‌دور |
    | `plugin-sdk/memory-core-host-engine-qmd` | اکسپورت‌های موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | اکسپورت‌های موتور ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های چندوجهی میزبان حافظه |
    | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های query میزبان حافظه |
    | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های secret میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | کمک‌کننده‌های ژورنال رویداد میزبان حافظه |
    | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های وضعیت میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | کمک‌کننده‌های زمان‌اجرای CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | کمک‌کننده‌های زمان‌اجرای هسته میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های فایل/زمان‌اجرای میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های زمان‌اجرای هسته میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های ژورنال رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های فایل/زمان‌اجرای میزبان حافظه |
    | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های مشترک managed-markdown برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | نمای زمان‌اجرای active memory برای دسترسی search-manager |
    | `plugin-sdk/memory-host-status` | نام مستعار بی‌طرف نسبت به فروشنده برای کمک‌کننده‌های وضعیت میزبان حافظه |
  </Accordion>

  <Accordion title="زیربخش‌های رزروشده کمک‌کننده‌های بسته‌بندی‌شده">
    در حال حاضر هیچ زیربخش SDK رزروشده‌ای برای کمک‌کننده‌های بسته‌بندی‌شده وجود ندارد. کمک‌کننده‌های مختص مالک
    داخل بسته Plugin مالک قرار دارند، درحالی‌که قراردادهای میزبان قابل‌استفاده‌مجدد
    از زیربخش‌های عمومی SDK مانند `plugin-sdk/gateway-runtime`،
    `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` استفاده می‌کنند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
