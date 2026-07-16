---
read_when:
    - انتخاب زیرمسیر مناسب plugin-sdk برای درون‌ریزی یک Plugin
    - ممیزی زیرمسیرهای Pluginهای همراه و رابط‌های کمکی
summary: 'فهرست زیرمسیرهای SDK افزونه: هر import در کجا قرار دارد، گروه‌بندی‌شده بر اساس حوزه'
title: زیرمسیرهای SDK افزونه
x-i18n:
    generated_at: "2026-07-16T17:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK افزونه به‌صورت مجموعه‌ای از زیرمسیرهای عمومی محدود در
`openclaw/plugin-sdk/` ارائه می‌شود. این صفحه زیرمسیرهای پراستفاده را بر اساس
کاربرد فهرست می‌کند. سه فایل این سطح را تعریف می‌کنند:

- `scripts/lib/plugin-sdk-entrypoints.json`: فهرست نگه‌داری‌شدهٔ نقاط ورودی
  که فرایند ساخت کامپایل می‌کند.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: زیرمسیرهای
  آزمون/داخلی مختص مخزن. خروجی‌های بسته برابر با این فهرست منهای این لیست هستند.
- `src/plugin-sdk/entrypoints.ts`: فرادادهٔ طبقه‌بندی برای زیرمسیرهای
  منسوخ، کمک‌ابزارهای رزروشدهٔ همراه، نماهای همراه پشتیبانی‌شده و
  سطوح عمومی تحت مالکیت افزونه.

نگه‌دارندگان تعداد خروجی‌های عمومی را با `pnpm plugin-sdk:surface` و
زیرمسیرهای فعال کمک‌ابزار رزروشده را با `pnpm plugins:boundary-report:summary` ممیزی می‌کنند؛
خروجی‌های رزروشدهٔ استفاده‌نشده به‌جای باقی‌ماندن در SDK عمومی به‌عنوان بدهی
سازگاری غیرفعال، باعث شکست گزارش CI می‌شوند.

برای راهنمای نگارش افزونه، به [نمای کلی SDK افزونه](/fa/plugins/sdk-overview) مراجعه کنید.

## ورودی افزونه

| زیرمسیر                        | خروجی‌های کلیدی                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | کمک‌ابزارهای مورد ارائه‌دهندهٔ مهاجرت مانند `createMigrationItem`، ثابت‌های دلیل، نشانگرهای وضعیت مورد، کمک‌ابزارهای حذف اطلاعات حساس و `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | کمک‌ابزارهای مهاجرت زمان اجرا مانند `copyMigrationFileItem`، `resolvePlannedMigrationTargets`، `withCachedMigrationConfigRuntime` و `writeMigrationReport`                                             |
| `plugin-sdk/health`            | ثبت بررسی سلامت Doctor، تشخیص، ترمیم، انتخاب، شدت و انواع یافته برای مصرف‌کنندگان سلامت همراه                                                                                |
| `plugin-sdk/config-schema`     | منسوخ. شِمای Zod ریشهٔ `openclaw.json` ‏(`OpenClawSchema`)؛ به‌جای آن شِماهای محلی افزونه را تعریف و با `plugin-sdk/json-schema-runtime` اعتبارسنجی کنید                                                  |

### کمک‌ابزارهای سازگاری و آزمون منسوخ

زیرمسیرهای منسوخ برای افزونه‌های قدیمی‌تر همچنان خروجی داده می‌شوند، اما کد جدید باید از
زیرمسیرهای متمرکز SDK در ادامه استفاده کند. فهرست نگه‌داری‌شده
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` است؛ CI واردکردن آن را
در کد تولید افزونه‌های همراه رد می‌کند. barrelهای گسترده مانند `plugin-sdk/compat`،
`plugin-sdk/config-types`، `plugin-sdk/infra-runtime` و
`plugin-sdk/text-runtime` فقط برای سازگاری هستند و `plugin-sdk/zod` یک
بازخروجی سازگاری است: `zod` را مستقیماً از `zod` وارد کنید. barrelهای گستردهٔ دامنهٔ
`plugin-sdk/agent-runtime`، `plugin-sdk/channel-lifecycle`،
`plugin-sdk/channel-runtime`، `plugin-sdk/cli-runtime`،
`plugin-sdk/conversation-runtime`، `plugin-sdk/hook-runtime`،
`plugin-sdk/media-runtime`، `plugin-sdk/plugin-runtime` و
`plugin-sdk/security-runtime` نیز به همین ترتیب به نفع
زیرمسیرهای متمرکز منسوخ شده‌اند.

زیرمسیرهای کمک‌ابزار آزمون مبتنی بر Vitest در OpenClaw فقط مختص مخزن هستند و دیگر
خروجی بسته محسوب نمی‌شوند: `agent-runtime-test-contracts`،
`channel-contract-testing`، `channel-target-testing`، `channel-test-helpers`،
`plugin-state-test-runtime`، `plugin-test-api`، `plugin-test-contracts`،
`plugin-test-runtime`، `provider-http-test-mocks`، `provider-test-contracts`،
`reply-payload-testing`، `sqlite-runtime-testing`، `test-env`، `test-fixtures`،
`test-node-mocks` و `testing`. سطوح خصوصی کمک‌ابزار همراه
`ssrf-runtime-internal` و `codex-native-task-runtime` نیز فقط مختص مخزن
هستند.

### زیرمسیرهای رزروشدهٔ کمک‌ابزار افزونهٔ همراه

`plugin-sdk/codex-mcp-projection` تنها زیرمسیر رزروشده است: سطحی سازگارپذیر
تحت مالکیت افزونه برای افزونهٔ همراه Codex، نه یک API عمومی SDK.
واردکردن میان افزونه‌هایی با مالکان متفاوت توسط محافظ‌های قرارداد بسته مسدود می‌شود و
وقتی یک زیرمسیر رزروشده دیگر وارد نشود، CI شکست می‌خورد.
`plugin-sdk/codex-native-task-runtime` فقط مختص مخزن است و خروجی
بسته نیست.

`src/plugin-sdk/entrypoints.ts` همچنین نماهای همراه پشتیبانی‌شده را ردیابی می‌کند؛ نقاط ورودی SDK
که تا زمان جایگزینی آن‌ها با قراردادهای عمومی، توسط افزونهٔ همراهشان پشتیبانی
می‌شوند: `plugin-sdk/discord`، `plugin-sdk/lmstudio`، `plugin-sdk/lmstudio-runtime`،
`plugin-sdk/matrix`، `plugin-sdk/mattermost`،
`plugin-sdk/memory-core-engine-runtime`، `plugin-sdk/provider-zai-endpoint`،
`plugin-sdk/qa-runner-runtime`، `plugin-sdk/telegram-account`،
`plugin-sdk/tts-runtime` و `plugin-sdk/zalouser`. چند مورد از این‌ها نیز
برای کد جدید منسوخ شده‌اند؛ یادداشت‌های هر ردیف را در ادامه ببینید.

  <AccordionGroup>
  <Accordion title="زیرمسیرهای کانال">
    | زیرمسیر | خروجی‌های اصلی |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase`، `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | راهنمای اعتبارسنجی JSON Schema ذخیره‌شده در حافظهٔ نهان برای شِماهای متعلق به plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، به‌علاوهٔ `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | راهنماهای مشترک دستیار راه‌اندازی، مترجم راه‌اندازی، اعلان‌های فهرست مجاز و سازنده‌های وضعیت راه‌اندازی |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | نام مستعار سازگاری منسوخ‌شده؛ از `plugin-sdk/setup-runtime` استفاده کنید |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | راهنماهای پیکربندی چندحسابی/دروازهٔ اقدام و راهنماهای بازگشت به حساب پیش‌فرض |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، راهنماهای نرمال‌سازی شناسهٔ حساب |
    | `plugin-sdk/account-resolution` | راهنماهای جست‌وجوی حساب و بازگشت پیش‌فرض |
    | `plugin-sdk/account-helpers` | راهنماهای محدود فهرست حساب/اقدام حساب |
    | `plugin-sdk/access-groups` | راهنماهای تجزیهٔ فهرست مجاز گروه دسترسی و عیب‌یابی گروه با اطلاعات پوشانده‌شده |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | اجزای پایهٔ مشترک شِمای پیکربندی کانال، به‌همراه Zod و سازنده‌های مستقیم JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | شِماهای پیکربندی کانال همراه OpenClaw، فقط برای pluginهای همراهِ نگه‌داری‌شده |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. شناسه‌های متعارف کانال گفت‌وگوی همراه/رسمی، به‌همراه برچسب‌ها/نام‌های مستعار قالب‌بند برای pluginهایی که باید متن دارای پیشوند پاکت را بدون کدنویسی ثابت جدول خود تشخیص دهند. |
    | `plugin-sdk/channel-config-schema-legacy` | نام مستعار سازگاری منسوخ‌شده برای شِماهای پیکربندی کانال همراه |
    | `plugin-sdk/telegram-command-config` | نرمال‌سازی منسوخ‌شدهٔ نام/توضیح فرمان Telegram و بررسی موارد تکراری/تعارض‌ها؛ در کد plugin جدید از مدیریت پیکربندی فرمان محلیِ plugin استفاده کنید |
    | `plugin-sdk/command-gating` | راهنماهای محدود دروازهٔ مجوزدهی فرمان |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | حل‌کنندهٔ آزمایشی سطح‌بالای زمان اجرای ورودی کانال و سازنده‌های واقعیت مسیر برای مسیرهای دریافت کانالِ مهاجرت‌یافته. این روش را به سرهم‌بندی فهرست‌های مجاز مؤثر، فهرست‌های مجاز فرمان و تصویرسازی‌های قدیمی در هر plugin ترجیح دهید. [API ورودی کانال](/fa/plugins/sdk-channel-ingress) را ببینید. |
    | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-outbound` | قراردادهای چرخهٔ عمر پیام، به‌همراه گزینه‌های خط لولهٔ پاسخ، رسیدها، پیش‌نمایش زنده/جریان‌سازی، راهنماهای چرخهٔ عمر، هویت خروجی، برنامه‌ریزی بار داده، ارسال‌های پایدار و راهنماهای زمینهٔ ارسال پیام. [API خروجی کانال](/fa/plugins/sdk-channel-outbound) را ببینید. |
    | `plugin-sdk/channel-message` | نام مستعار سازگاری منسوخ‌شده برای `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | نام مستعار سازگاری منسوخ‌شده برای `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | راهنماهای مشترک سازندهٔ مسیر ورودی و پاکت |
    | `plugin-sdk/inbound-reply-dispatch` | نمای سازگاری منسوخ‌شده. برای اجراکننده‌های ورودی و گزاره‌های توزیع از `plugin-sdk/channel-inbound` و برای راهنماهای تحویل پیام از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/messaging-targets` | نام مستعار منسوخ‌شدهٔ تجزیهٔ مقصد؛ از `plugin-sdk/channel-targets` استفاده کنید |
    | `plugin-sdk/outbound-media` | راهنماهای مشترک بارگذاری رسانهٔ خروجی و وضعیت رسانهٔ میزبانی‌شده |
    | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/poll-runtime` | راهنماهای محدود نرمال‌سازی نظرسنجی |
    | `plugin-sdk/thread-bindings-runtime` | راهنماهای آداپتور و چرخهٔ عمر اتصال رشته |
    | `plugin-sdk/agent-media-payload` | ریشه‌ها و بارگذارهای بار دادهٔ رسانه‌ای عامل |
    | `plugin-sdk/conversation-runtime` | خروجی گستردهٔ منسوخ‌شده برای اتصال مکالمه/رشته، جفت‌سازی و راهنماهای اتصال پیکربندی‌شده؛ زیرمسیرهای متمرکز اتصال مانند `plugin-sdk/thread-bindings-runtime` و `plugin-sdk/session-binding-runtime` را ترجیح دهید |
    | `plugin-sdk/runtime-group-policy` | راهنماهای حل خط‌مشی گروه در زمان اجرا |
    | `plugin-sdk/channel-status` | راهنماهای مشترک عکس فوری/خلاصهٔ وضعیت کانال |
    | `plugin-sdk/channel-config-primitives` | اجزای پایهٔ محدود شِمای پیکربندی کانال |
    | `plugin-sdk/channel-config-writes` | راهنماهای مجوزدهی نوشتن پیکربندی کانال |
    | `plugin-sdk/channel-plugin-common` | خروجی‌های مشترک پیش‌درآمد plugin کانال |
    | `plugin-sdk/allowlist-config-edit` | راهنماهای ویرایش/خواندن پیکربندی فهرست مجاز |
    | `plugin-sdk/group-access` | راهنماهای منسوخ‌شدهٔ تصمیم‌گیری دسترسی گروه؛ از `resolveChannelMessageIngress` در `plugin-sdk/channel-ingress-runtime` استفاده کنید |
    | `plugin-sdk/direct-dm`، `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` استفاده کنید. |
    | `plugin-sdk/direct-dm-guard-policy` | راهنماهای محدود خط‌مشی محافظ پیشارمزنگاری پیام مستقیم |
    | `plugin-sdk/discord` | نمای سازگاری منسوخ‌شدهٔ Discord برای `@openclaw/discord@2026.3.13` منتشرشده و سازگاری پیگیری‌شدهٔ مالک؛ pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/telegram-account` | نمای سازگاری منسوخ‌شدهٔ حل حساب Telegram برای سازگاری پیگیری‌شدهٔ مالک؛ pluginهای جدید باید از راهنماهای زمان اجرای تزریق‌شده یا زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/zalouser` | نمای سازگاری منسوخ‌شدهٔ Zalo Personal برای بسته‌های منتشرشدهٔ Lark/Zalo که همچنان مجوزدهی فرمان فرستنده را وارد می‌کنند؛ pluginهای جدید باید از زیرمسیرهای عمومی SDK کانال استفاده کنند |
    | `plugin-sdk/interactive-runtime` | راهنماهای ارائهٔ معنایی پیام، تحویل و پاسخ تعاملی قدیمی. [ارائهٔ پیام](/fa/plugins/message-presentation) را ببینید |
    | `plugin-sdk/channel-inbound` | راهنماهای مشترک ورودی برای طبقه‌بندی رویداد، ساخت زمینه، قالب‌بندی، ریشه‌ها، رفع پرش، تطبیق اشاره، خط‌مشی اشاره و ثبت رویدادهای ورودی |
    | `plugin-sdk/channel-inbound-debounce` | راهنماهای محدود رفع پرش ورودی |
    | `plugin-sdk/channel-mention-gating` | راهنماهای محدود خط‌مشی اشاره، نشانگر اشاره و متن اشاره، بدون سطح گسترده‌تر زمان اجرای ورودی |
    | `plugin-sdk/channel-envelope`، `plugin-sdk/channel-inbound-roots`، `plugin-sdk/channel-location`، `plugin-sdk/channel-logging` | نماهای سازگاری منسوخ‌شده. از `plugin-sdk/channel-inbound` یا `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-pairing-paths` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-pairing` استفاده کنید. |
    | `plugin-sdk/channel-reply-options-runtime` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ‌شده. از `plugin-sdk/channel-outbound` استفاده کنید. |
    | `plugin-sdk/channel-send-result` | نوع‌های نتیجهٔ پاسخ |
    | `plugin-sdk/channel-actions` | راهنماهای اقدام پیام کانال، به‌علاوهٔ راهنماهای منسوخ‌شدهٔ شِمای بومی که برای سازگاری plugin نگه داشته شده‌اند |
    | `plugin-sdk/channel-route` | نرمال‌سازی مشترک مسیر، حل مقصد مبتنی بر تجزیه‌گر، رشته‌سازی شناسهٔ رشته، کلیدهای مسیر حذف‌تکرار/فشرده، نوع‌های مقصد تجزیه‌شده و راهنماهای مقایسهٔ مسیر/مقصد |
    | `plugin-sdk/channel-targets` | راهنماهای تجزیهٔ مقصد؛ فراخواننده‌های مقایسهٔ مسیر باید از `plugin-sdk/channel-route` استفاده کنند |
    | `plugin-sdk/channel-contract` | نوع‌های قرارداد کانال |
    | `plugin-sdk/channel-feedback` | سیم‌کشی بازخورد/واکنش |
  </Accordion>

خانواده‌های منسوخ‌شدهٔ ابزارهای کمکی کانال فقط برای سازگاری با Pluginهای
منتشرشده در دسترس می‌مانند. برنامهٔ حذف چنین است: آن‌ها را در طول بازهٔ مهاجرت
Pluginهای خارجی نگه دارید، Pluginهای مخزن/همراه را روی `channel-inbound` و
`channel-outbound` نگه دارید، سپس زیرمسیرهای سازگاری را در پاک‌سازی عمدهٔ بعدی
SDK حذف کنید. این موضوع دربارهٔ خانواده‌های قدیمی پیام/زمان‌اجرای کانال، استریم
کانال، دسترسی مستقیم به DM، انشعاب ابزارهای کمکی ورودی، گزینه‌های پاسخ،
و مسیر جفت‌سازی صدق می‌کند.

  <Accordion title="زیرمسیرهای ارائه‌دهنده">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | نمای پشتیبانی‌شده ارائه‌دهنده LM Studio برای راه‌اندازی، کشف کاتالوگ و آماده‌سازی مدل در زمان اجرا |
    | `plugin-sdk/lmstudio-runtime` | نمای پشتیبانی‌شده زمان اجرای LM Studio برای پیش‌فرض‌های سرور محلی، کشف مدل، سرآیندهای درخواست و ابزارهای کمکی مدل بارگذاری‌شده |
    | `plugin-sdk/provider-setup` | ابزارهای کمکی منتخب برای راه‌اندازی ارائه‌دهنده محلی/خودمیزبان |
    | `plugin-sdk/self-hosted-provider-setup` | ابزارهای کمکی منسوخ‌شده برای راه‌اندازی خودمیزبان سازگار با OpenAI؛ از `plugin-sdk/provider-setup` یا ابزارهای کمکی راه‌اندازی متعلق به Plugin استفاده کنید |
    | `plugin-sdk/cli-backend` | پیش‌فرض‌های بک‌اند CLI و ثابت‌های ناظر |
    | `plugin-sdk/provider-auth-runtime` | ابزارهای کمکی زمان اجرای احراز هویت ارائه‌دهنده: جریان بازگشتی OAuth، مبادله توکن، ماندگارسازی احراز هویت و تشخیص کلید API |
    | `plugin-sdk/provider-oauth-runtime` | نوع‌های عمومی فراخوان بازگشتی OAuth ارائه‌دهنده، رندر صفحه فراخوان، ابزارهای کمکی PKCE/state، تجزیه ورودی مجوزدهی، ابزارهای کمکی انقضای توکن و ابزارهای کمکی لغو |
    | `plugin-sdk/provider-auth-api-key` | ابزارهای کمکی ورود اولیه با کلید API/نوشتن پروفایل، مانند `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | سازنده استاندارد نتیجه احراز هویت OAuth |
    | `plugin-sdk/provider-env-vars` | ابزارهای کمکی جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`، `ensureApiKeyFromOptionEnvOrPrompt`، `upsertAuthProfile`، `upsertApiKeyProfile`، `writeOAuthCredentials`، ابزارهای کمکی واردکردن احراز هویت OpenAI Codex، خروجی سازگاری منسوخ‌شده `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، ابزارهای کمکی نقطه پایانی ارائه‌دهنده و ابزارهای کمکی مشترک نرمال‌سازی شناسه مدل |
    | `plugin-sdk/provider-catalog-live-runtime` | ابزارهای کمکی کاتالوگ زنده مدل ارائه‌دهنده برای کشف محافظت‌شده به سبک `/models`:‏ `buildLiveModelProviderConfig`، `fetchLiveProviderModelRows`، `getCachedLiveProviderModelRows`، `fetchLiveProviderModelIds`، `LiveModelCatalogHttpError`، `clearLiveCatalogCacheForTests`، پالایش شناسه مدل، حافظه نهان TTL و جایگزین ایستا |
    | `plugin-sdk/provider-catalog-runtime` | قلاب زمان اجرای تکمیل کاتالوگ ارائه‌دهنده و درزهای رجیستری ارائه‌دهنده Plugin برای آزمون‌های قرارداد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ابزارهای کمکی عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، خطاهای HTTP ارائه‌دهنده و ابزارهای کمکی فرم چندبخشی رونویسی صوت |
    | `plugin-sdk/provider-web-fetch-contract` | ابزارهای کمکی محدود قرارداد پیکربندی/انتخاب واکشی وب، مانند `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ابزارهای کمکی ثبت/حافظه نهان ارائه‌دهنده واکشی وب |
    | `plugin-sdk/provider-web-search-config-contract` | ابزارهای کمکی محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
    | `plugin-sdk/provider-web-search-contract` | ابزارهای کمکی محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب، مانند `createWebSearchProviderContractFields`، `enablePluginInConfig`، `resolveProviderWebSearchPluginConfig` و تنظیم‌کننده‌ها/دریافت‌کننده‌های اعتبارنامه با دامنه مشخص |
    | `plugin-sdk/provider-web-search` | ابزارهای کمکی ثبت/حافظه نهان/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
    | `plugin-sdk/embedding-providers` | نوع‌های عمومی ارائه‌دهنده تعبیه‌سازی و ابزارهای کمکی خواندن، شامل `EmbeddingProviderAdapter`، `getEmbeddingProvider(...)` و `listEmbeddingProviders(...)`؛ Pluginها ارائه‌دهندگان را از طریق `api.registerEmbeddingProvider(...)` ثبت می‌کنند تا مالکیت مانیفست اعمال شود |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks` و پاک‌سازی طرح‌واره و عیب‌یابی DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | نوع‌های تصویر لحظه‌ای مصرف ارائه‌دهنده، ابزارهای کمکی مشترک واکشی مصرف و واکشی‌کننده‌های ارائه‌دهنده مانند `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، `buildProviderStreamFamilyHooks`، `composeProviderStreamWrappers`، نوع‌های پوشش‌دهنده جریان، سازگاری فراخوانی ابزار متن ساده و ابزارهای کمکی مشترک پوشش‌دهنده Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | ابزارهای کمکی عمومی و مشترک پوشش‌دهنده جریان ارائه‌دهنده، شامل `composeProviderStreamWrappers`، `createOpenAICompatibleCompletionsThinkingOffWrapper`، `createPlainTextToolCallCompatWrapper`، `createPayloadPatchStreamWrapper`، `createToolStreamWrapper`، `normalizeOpenAICompatibleReasoningPayload`، `setQwenChatTemplateThinking` و ابزارهای جریان سازگار با Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ابزارهای کمکی انتقال بومی ارائه‌دهنده، مانند واکشی محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل پیام‌های انتقال و جریان‌های قابل‌نوشتن رویداد انتقال |
    | `plugin-sdk/provider-onboard` | ابزارهای کمکی وصله پیکربندی ورود اولیه |
    | `plugin-sdk/global-singleton` | ابزارهای کمکی تک‌نمونه/نگاشت/حافظه نهان محلی فرایند |
    | `plugin-sdk/group-activation` | ابزارهای کمکی محدود حالت فعال‌سازی گروه و تجزیه فرمان |
  </Accordion>

تصاویر لحظه‌ای مصرف ارائه‌دهنده معمولاً یک یا چند `windows` سهمیه را گزارش می‌کنند که هرکدام
یک برچسب، درصد مصرف‌شده و زمان بازنشانی اختیاری دارند. ارائه‌دهندگانی که به‌جای پنجره‌های سهمیه قابل‌بازنشانی،
متن موجودی یا وضعیت حساب ارائه می‌کنند، باید به‌جای ساختن درصدهای غیرواقعی،
`summary` را با آرایه خالی `windows` برگردانند.
OpenClaw آن متن خلاصه را در خروجی وضعیت نمایش می‌دهد؛ تنها زمانی از `error` استفاده کنید که
نقطه پایانی مصرف ناموفق بوده یا هیچ داده مصرف قابل‌استفاده‌ای برنگردانده باشد.

  <Accordion title="زیرمسیرهای احراز هویت و امنیت">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/command-auth` | سطح گسترده و منسوخ‌شده مجوزدهی فرمان (`resolveControlCommandGate`، ابزارهای کمکی رجیستری فرمان شامل قالب‌بندی پویای منوی آرگومان، ابزارهای کمکی مجوزدهی فرستنده)؛ از مجوزدهی ورودی کانال/زمان اجرا یا ابزارهای کمکی وضعیت فرمان استفاده کنید |
    | `plugin-sdk/command-status` | سازنده‌های پیام فرمان/راهنما، مانند `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ابزارهای کمکی تشخیص تأییدکننده و احراز هویت اقدام در همان گفت‌وگو |
    | `plugin-sdk/approval-client-runtime` | ابزارهای کمکی پروفایل/پالایش تأیید اجرای بومی |
    | `plugin-sdk/approval-delivery-runtime` | آداپتورهای قابلیت/تحویل تأیید بومی |
    | `plugin-sdk/approval-gateway-runtime` | حل‌کننده مشترک Gateway تأیید |
    | `plugin-sdk/approval-reference-runtime` | ابزار کمکی تعیین‌گر بادوام و قطعی برای فراخوان‌های بازگشتی تأیید با محدودیت انتقال |
    | `plugin-sdk/approval-handler-adapter-runtime` | ابزارهای کمکی سبک برای بارگذاری آداپتور تأیید بومی در نقاط ورود پرتکرار کانال |
    | `plugin-sdk/approval-handler-runtime` | ابزارهای کمکی گسترده‌تر زمان اجرای کنترل‌گر تأیید؛ وقتی درزهای محدودتر آداپتور/Gateway کافی‌اند، آن‌ها را ترجیح دهید |
    | `plugin-sdk/approval-native-runtime` | ابزارهای کمکی هدف تأیید بومی، اتصال حساب، دروازه مسیر، جایگزین ارسال و سرکوب درخواست محلی اجرای بومی |
    | `plugin-sdk/approval-reaction-runtime` | اتصال‌های سخت‌کدشده واکنش تأیید، بارهای درخواست واکنش، مخزن‌های هدف واکنش، ابزارهای کمکی متن راهنمای واکنش و خروجی سازگاری برای سرکوب درخواست محلی اجرای بومی |
    | `plugin-sdk/approval-reply-runtime` | ابزارهای کمکی بار پاسخ تأیید اجرا/Plugin |
    | `plugin-sdk/approval-runtime` | ابزارهای کمکی بار تأیید اجرا/Plugin، سازنده‌های قابلیت تأیید، ابزارهای کمکی احراز هویت/پروفایل تأیید، ابزارهای کمکی مسیریابی/زمان اجرای تأیید بومی و ابزارهای کمکی نمایش ساخت‌یافته تأیید مانند `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ابزارهای کمکی محدود و منسوخ‌شده بازنشانی حذف تکرار پاسخ ورودی |
    | `plugin-sdk/command-auth-native` | احراز هویت فرمان بومی، قالب‌بندی پویای منوی آرگومان و ابزارهای کمکی هدف نشست بومی |
    | `plugin-sdk/command-detection` | ابزارهای کمکی مشترک تشخیص فرمان |
    | `plugin-sdk/command-primitives-runtime` | گزاره‌های سبک متن فرمان برای مسیرهای پرتکرار کانال |
    | `plugin-sdk/command-surface` | ابزارهای کمکی نرمال‌سازی بدنه فرمان و سطح فرمان |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | ابزارهای کمکی جریان ورود تنبل احراز هویت ارائه‌دهنده برای جفت‌سازی کد دستگاه در کانال خصوصی و رابط کاربری وب |
    | `plugin-sdk/channel-secret-runtime` | سطح گسترده و منسوخ‌شده قرارداد راز (`collectSimpleChannelFieldAssignments`، `getChannelSurface`، `pushAssignment`، نوع‌های هدف راز)؛ زیرمسیرهای متمرکز زیر را ترجیح دهید |
    | `plugin-sdk/channel-secret-basic-runtime` | خروجی‌های محدود قرارداد راز و سازنده‌های رجیستری هدف برای سطوح راز کانال/Plugin غیر TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | ابزارهای کمکی محدود تخصیص راز TTS تو‌در‌توی کانال |
    | `plugin-sdk/secret-ref-runtime` | نوع‌دهی، حل و جست‌وجوی مسیر هدف برنامه SecretRef برای تجزیه قرارداد راز/پیکربندی |
    | `plugin-sdk/secret-provider-integration` | مانیفست یکپارچه‌سازی ارائه‌دهنده SecretRef و قراردادهای ازپیش‌تنظیم‌شده صرفاً نوعی برای Pluginهایی که ازپیش‌تنظیم‌های ارائه‌دهنده راز خارجی منتشر می‌کنند |
    | `plugin-sdk/security-runtime` | بشکه گسترده و منسوخ‌شده برای اعتماد، دروازه‌بندی پیام خصوصی، ابزارهای کمکی فایل/مسیر محدود به ریشه شامل نوشتن فقط هنگام ایجاد، جایگزینی اتمی همگام/ناهمگام فایل، نوشتن موقت هم‌سطح، جایگزین جابه‌جایی میان‌دستگاهی، ابزارهای کمکی مخزن فایل خصوصی، محافظ‌های والد پیوند نمادین، محتوای خارجی، پوشاندن متن حساس، مقایسه راز با زمان ثابت و ابزارهای کمکی گردآوری راز؛ زیرمسیرهای متمرکز امنیت/SSRF/راز را ترجیح دهید |
    | `plugin-sdk/ssrf-policy` | ابزارهای کمکی فهرست مجاز میزبان و سیاست SSRF شبکه خصوصی |
    | `plugin-sdk/ssrf-dispatcher` | ابزارهای کمکی محدود توزیع‌کننده سنجاق‌شده بدون سطح گسترده زمان اجرای زیرساخت |
    | `plugin-sdk/ssrf-runtime` | ابزارهای کمکی توزیع‌کننده سنجاق‌شده، واکشی محافظت‌شده در برابر SSRF، خطای SSRF و سیاست SSRF |
    | `plugin-sdk/secret-input` | ابزارهای کمکی تجزیه ورودی راز |
    | `plugin-sdk/webhook-ingress` | ابزارهای کمکی درخواست/هدف Webhook و تبدیل اجباری وب‌سوکت/بدنه خام |
    | `plugin-sdk/webhook-request-guards` | ابزارهای کمکی اندازه/مهلت زمانی بدنه درخواست و `runDetachedWebhookWork` برای پردازش رهگیری‌شده پس از تأیید دریافت |
  </Accordion>

  <Accordion title="زیرمسیرهای زمان اجرا و ذخیره‌سازی">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/runtime` | ابزارهای کمکی زمان اجرا/ثبت گزارش/پشتیبان‌گیری، هشدارهای مسیر نصب Plugin و ابزارهای کمکی پردازش |
    | `plugin-sdk/runtime-env` | ابزارهای کمکی محدود برای محیط زمان اجرا، ثبت‌کننده، مهلت زمانی، تلاش مجدد و عقب‌نشینی |
    | `plugin-sdk/browser-config` | نمای پشتیبانی‌شده پیکربندی مرورگر برای پروفایل/پیش‌فرض‌های نرمال‌سازی‌شده، تجزیه URL مربوط به CDP و ابزارهای کمکی احراز هویت کنترل مرورگر |
    | `plugin-sdk/agent-harness-task-runtime` | ابزارهای کمکی عمومی چرخه عمر وظیفه و تحویل تکمیل برای عامل‌های مبتنی بر مهار، با استفاده از دامنه وظیفه صادرشده توسط میزبان |
    | `plugin-sdk/codex-mcp-projection` | ابزار کمکی رزروشده Codex همراه برای نگاشت پیکربندی سرور MCP کاربر به پیکربندی رشته Codex؛ نه برای Pluginهای شخص ثالث |
    | `plugin-sdk/codex-native-task-runtime` | ابزار کمکی Codex همراه و محلی مخزن برای سیم‌کشی بومی آینه وظیفه/زمان اجرا؛ خروجی بسته نیست |
    | `plugin-sdk/channel-runtime-context` | ابزارهای کمکی عمومی ثبت و جست‌وجوی زمینه زمان اجرای کانال |
    | `plugin-sdk/matrix` | نمای سازگاری منسوخ‌شده Matrix برای بسته‌های قدیمی‌تر کانال شخص ثالث؛ Pluginهای جدید باید `plugin-sdk/run-command` را مستقیماً وارد کنند |
    | `plugin-sdk/mattermost` | نمای سازگاری منسوخ‌شده Mattermost برای بسته‌های قدیمی‌تر کانال شخص ثالث؛ Pluginهای جدید باید زیرمسیرهای عمومی SDK را مستقیماً وارد کنند |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | بشکه گسترده منسوخ‌شده برای ابزارهای کمکی فرمان/قلاب/http/تعاملی Plugin؛ زیرمسیرهای متمرکز زمان اجرای Plugin را ترجیح دهید |
    | `plugin-sdk/hook-runtime` | بشکه گسترده منسوخ‌شده برای ابزارهای کمکی خط لوله Webhook/قلاب داخلی؛ زیرمسیرهای متمرکز زمان اجرای قلاب/Plugin را ترجیح دهید |
    | `plugin-sdk/lazy-runtime` | ابزارهای کمکی واردکردن/اتصال تنبل زمان اجرا مانند `createLazyRuntimeModule`، `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ابزارهای کمکی اجرای فرایند |
    | `plugin-sdk/node-host` | ابزارهای کمکی تفکیک فایل اجرایی میزبان Node و ازسرگیری PTY |
    | `plugin-sdk/cli-runtime` | بشکه گسترده منسوخ‌شده برای قالب‌بندی CLI، انتظار، نسخه، فراخوانی آرگومان و ابزارهای کمکی تنبل گروه فرمان؛ زیرمسیرهای متمرکز CLI/زمان اجرا را ترجیح دهید |
    | `plugin-sdk/qa-runner-runtime` | نمای پشتیبانی‌شده برای ارائه سناریوهای تضمین کیفیت Plugin از طریق سطح فرمان CLI |
    | `plugin-sdk/tts-runtime` | نمای پشتیبانی‌شده برای طرح‌واره‌های پیکربندی تبدیل متن به گفتار و ابزارهای کمکی زمان اجرا |
    | `plugin-sdk/gateway-method-runtime` | ابزار کمکی رزروشده ارسال متد Gateway برای مسیرهای HTTP متعلق به Plugin که `contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلام می‌کنند |
    | `plugin-sdk/gateway-runtime` | کلاینت Gateway، ابزار کمکی شروع کلاینت آماده حلقه رویداد، RPC خط فرمان Gateway، خطاهای پروتکل Gateway، تفکیک میزبان LAN اعلام‌شده و ابزارهای کمکی وصله وضعیت کانال |
    | `plugin-sdk/config-contracts` | سطح پیکربندی متمرکز و فقط‌نوعی برای شکل‌های پیکربندی Plugin مانند `OpenClawConfig` و انواع پیکربندی کانال/ارائه‌دهنده |
    | `plugin-sdk/plugin-config-runtime` | ابزارهای کمکی پیکربندی Plugin در زمان اجرا مانند `mergeDeep`، `requireRuntimeConfig`، `resolvePluginConfigObject` و `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ابزارهای کمکی تراکنشی تغییر پیکربندی مانند `mutateConfigFile`، `replaceConfigFile` و `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | رشته‌های راهنمای مشترک فراداده تحویل ابزار پیام |
    | `plugin-sdk/runtime-config-snapshot` | ابزارهای کمکی عکس فوری پیکربندی فرایند جاری مانند `getRuntimeConfig`، `getRuntimeConfigSnapshot` و تنظیم‌کننده‌های عکس فوری آزمون |
    | `plugin-sdk/text-autolink-runtime` | تشخیص پیوند خودکار ارجاع فایل بدون بشکه گسترده متن |
    | `plugin-sdk/reply-runtime` | ابزارهای کمکی مشترک زمان اجرای ورودی/پاسخ، قطعه‌بندی، ارسال، Heartbeat و برنامه‌ریز پاسخ |
    | `plugin-sdk/reply-dispatch-runtime` | ابزارهای کمکی محدود ارسال/نهایی‌سازی پاسخ و برچسب‌گذاری مکالمه |
    | `plugin-sdk/reply-history` | ابزارهای کمکی مشترک تاریخچه پاسخ در بازه کوتاه. کد جدید نوبت پیام باید از `createChannelHistoryWindow` استفاده کند؛ ابزارهای سطح پایین‌تر نقشه فقط به‌عنوان خروجی‌های سازگاری منسوخ‌شده باقی می‌مانند |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ابزارهای کمکی محدود قطعه‌بندی متن/مارک‌داون |
    | `plugin-sdk/session-store-runtime` | ابزارهای کمکی گردش‌کار نشست (`getSessionEntry`، `listSessionEntries`، `patchSessionEntry`، `upsertSessionEntry`)، ابزارهای کمکی تعمیر/چرخه عمر (`deleteSessionEntry`، `cleanupSessionLifecycleArtifacts`، `resolveSessionStoreBackupPaths`)، ابزارهای کمکی نشانگر برای مقادیر انتقالی `sessionFile`، خواندن محدود متن اخیر رونوشت کاربر/دستیار بر اساس هویت نشست، ابزارهای کمکی مسیر ذخیره‌گاه نشست/کلید نشست و خواندن زمان به‌روزرسانی، بدون واردکردن عملیات نگهداری/نوشتن گسترده پیکربندی |
    | `plugin-sdk/session-transcript-runtime` | هویت رونوشت، ابزارهای کمکی هدف/خواندن/نوشتن دامنه‌دار، نگاشت ورودی پیام قابل‌مشاهده، انتشار به‌روزرسانی، قفل‌های نوشتن و کلیدهای اصابت حافظه رونوشت |
    | `plugin-sdk/sqlite-runtime` | ابزارهای کمکی متمرکز طرح‌واره عامل SQLite، مسیر و تراکنش برای زمان اجرای شخص اول، بدون کنترل‌های چرخه عمر پایگاه داده |
    | `plugin-sdk/cron-store-runtime` | ابزارهای کمکی مسیر/بارگذاری/ذخیره‌سازی Cron |
    | `plugin-sdk/state-paths` | ابزارهای کمکی مسیر پوشه وضعیت/OAuth |
    | `plugin-sdk/plugin-state-runtime` | انواع وضعیت کلیددار SQLite متعلق به فرایند جانبی Plugin، به‌همراه تنظیم متمرکز اتصال، نگهداری تأییدشده WAL و ابزارهای کمکی مهاجرت اتمی طرح‌واره STRICT برای پایگاه‌های داده متعلق به Plugin |
    | `plugin-sdk/routing` | ابزارهای کمکی اتصال مسیر/کلید نشست/حساب مانند `resolveAgentRoute`، `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ابزارهای کمکی مشترک خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا و ابزارهای کمکی فراداده مسئله |
    | `plugin-sdk/target-resolver-runtime` | ابزارهای کمکی مشترک تفکیک هدف |
    | `plugin-sdk/string-normalization-runtime` | ابزارهای کمکی نرمال‌سازی نامک/رشته |
    | `plugin-sdk/request-url` | استخراج URLهای رشته‌ای از ورودی‌های مشابه fetch/request |
    | `plugin-sdk/run-command` | اجراکننده زمان‌بندی‌شده فرمان با نتایج نرمال‌سازی‌شده stdout/stderr |
    | `plugin-sdk/param-readers` | خواننده‌های مشترک پارامتر ابزار/CLI |
    | `plugin-sdk/tool-plugin` | تعریف یک Plugin ساده و نوع‌دار ابزار عامل و ارائه فراداده ایستا برای تولید مانیفست |
    | `plugin-sdk/tool-payload` | استخراج بارهای نرمال‌سازی‌شده از اشیای نتیجه ابزار |
    | `plugin-sdk/tool-send` | استخراج فیلدهای معیار هدف ارسال از آرگومان‌های ابزار |
    | `plugin-sdk/sandbox` | انواع پشتیبان سندباکس و ابزارهای کمکی فرمان SSH/OpenShell، شامل پیش‌بررسی سریع‌خرابی فرمان اجرا |
    | `plugin-sdk/temp-path` | ابزارهای کمکی مشترک مسیر بارگیری موقت و فضاهای کاری موقت، خصوصی و امن |
    | `plugin-sdk/logging-core` | ابزارهای کمکی ثبت‌کننده زیرسامانه و حذف اطلاعات حساس |
    | `plugin-sdk/markdown-table-runtime` | حالت جدول مارک‌داون و ابزارهای کمکی تبدیل |
    | `plugin-sdk/model-session-runtime` | ابزارهای کمکی بازنویسی مدل/نشست مانند `applyModelOverrideToSessionEntry` و `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ابزارهای کمکی تفکیک پیکربندی ارائه‌دهنده گفت‌وگو |
    | `plugin-sdk/json-store` | ابزارهای کمکی کوچک خواندن/نوشتن وضعیت JSON |
    | `plugin-sdk/json-unsafe-integers` | ابزارهای کمکی تجزیه JSON که لفظ‌های عدد صحیح ناامن را به‌شکل رشته حفظ می‌کنند |
    | `plugin-sdk/file-lock` | ابزارهای کمکی قفل بازگشتی فایل |
    | `plugin-sdk/persistent-dedupe` | ابزارهای کمکی حافظه نهان حذف موارد تکراری مبتنی بر دیسک |
    | `plugin-sdk/acp-runtime` | ابزارهای کمکی زمان اجرا/نشست ACP و ارسال پاسخ |
    | `plugin-sdk/acp-runtime-backend` | ابزارهای کمکی سبک ثبت پشتیبان ACP و ارسال پاسخ برای Pluginهای بارگذاری‌شده هنگام راه‌اندازی |
    | `plugin-sdk/acp-binding-resolve-runtime` | تفکیک فقط‌خواندنی اتصال ACP بدون واردکردن راه‌اندازی چرخه عمر |
    | `plugin-sdk/agent-config-primitives` | اجزای اولیه منسوخ‌شده طرح‌واره پیکربندی زمان اجرای عامل؛ اجزای اولیه طرح‌واره را از سطح نگهداری‌شده متعلق به Plugin وارد کنید |
    | `plugin-sdk/boolean-param` | خواننده آزاد پارامتر بولی |
    | `plugin-sdk/dangerous-name-runtime` | ابزارهای کمکی تفکیک تطبیق نام‌های خطرناک |
    | `plugin-sdk/device-bootstrap` | ابزارهای کمکی راه‌اندازی اولیه دستگاه و توکن جفت‌سازی، شامل `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | اجزای اولیه مشترک ابزارهای کمکی کانال غیرفعال، وضعیت و پراکسی محیطی |
    | `plugin-sdk/models-provider-runtime` | ابزارهای کمکی پاسخ فرمان/ارائه‌دهنده `/models` |
    | `plugin-sdk/skill-commands-runtime` | ابزارهای کمکی فهرست‌کردن فرمان Skill |
    | `plugin-sdk/native-command-registry` | ابزارهای کمکی رجیستری/ساخت/سریال‌سازی فرمان بومی |
    | `plugin-sdk/agent-harness` | سطح آزمایشی Plugin مورداعتماد برای مهارهای سطح پایین عامل: انواع مهار، ابزارهای کمکی هدایت/لغو اجرای فعال، ابزارهای کمکی پل ابزار OpenClaw، ابزارهای کمکی سیاست ابزار برنامه زمان اجرا، طبقه‌بندی نتیجه پایانی، ابزارهای کمکی قالب‌بندی/جزئیات پیشرفت ابزار و ابزارهای نتیجه تلاش |
    | `plugin-sdk/provider-zai-endpoint` | نمای منسوخ‌شده تشخیص نقطه پایانی متعلق به ارائه‌دهنده Z.AI؛ از API عمومی Plugin متعلق به Z.AI استفاده کنید |
    | `plugin-sdk/async-lock-runtime` | ابزار کمکی قفل ناهمگام محلی فرایند برای فایل‌های کوچک وضعیت زمان اجرا |
    | `plugin-sdk/channel-activity-runtime` | ابزار کمکی تله‌متری فعالیت کانال |
    | `plugin-sdk/concurrency-runtime` | ابزار کمکی هم‌زمانی محدود وظایف ناهمگام |
    | `plugin-sdk/dedupe-runtime` | ابزارهای کمکی حافظه نهان حذف موارد تکراری درون‌حافظه‌ای و دارای پشتوانه پایدار |
    | `plugin-sdk/delivery-queue-runtime` | ابزار کمکی تخلیه تحویل‌های خروجی در انتظار |
    | `plugin-sdk/file-access-runtime` | ابزارهای کمکی امن مسیر فایل محلی و منبع رسانه |
    | `plugin-sdk/heartbeat-runtime` | ابزارهای کمکی بیدارسازی، رویداد و قابلیت مشاهده Heartbeat |
    | `plugin-sdk/expect-runtime` | ابزار کمکی تأیید مقدار الزامی برای ناورداهای اثبات‌پذیر زمان اجرا |
    | `plugin-sdk/number-runtime` | ابزار کمکی تبدیل عددی |
    | `plugin-sdk/secure-random-runtime` | ابزارهای کمکی امن توکن/UUID |
    | `plugin-sdk/system-event-runtime` | ابزارهای کمکی صف رویداد سیستم |
    | `plugin-sdk/transport-ready-runtime` | ابزار کمکی انتظار برای آمادگی انتقال |
    | `plugin-sdk/exec-approvals-runtime` | ابزارهای کمکی فایل سیاست تأیید اجرا بدون بشکه گسترده زمان اجرای زیرساخت |
    | `plugin-sdk/infra-runtime` | شیم سازگاری منسوخ‌شده؛ از زیرمسیرهای متمرکز زمان اجرای بالا استفاده کنید |
    | `plugin-sdk/collection-runtime` | ابزارهای کمکی کوچک حافظه نهان محدود |
    | `plugin-sdk/diagnostic-runtime` | ابزارهای کمکی پرچم تشخیصی، رویداد و زمینه ردیابی |
    | `plugin-sdk/error-runtime` | گراف خطا، قالب‌بندی، ابزارهای کمکی مشترک طبقه‌بندی خطا، `PlatformMessageNotDispatchedError`، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ابزارهای کمکی fetch پوشانده‌شده، پراکسی، گزینه EnvHttpProxyAgent و جست‌وجوی سنجاق‌شده |
    | `plugin-sdk/runtime-fetch` | fetch زمان اجرای آگاه از توزیع‌کننده، بدون واردکردن proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ابزارهای کمکی پاک‌سازی URL داده تصویر درون‌خطی و تشخیص امضا، بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/response-limit-runtime` | خواننده‌های بدنه پاسخ با محدودیت بایت، بی‌کاری و ضرب‌الاجل، بدون سطح گسترده زمان اجرای رسانه |
    | `plugin-sdk/session-binding-runtime` | وضعیت اتصال مکالمه جاری، بدون مسیریابی اتصال پیکربندی‌شده یا ذخیره‌گاه‌های جفت‌سازی |
    | `plugin-sdk/context-visibility-runtime` | تفکیک قابلیت مشاهده زمینه و پالایش زمینه تکمیلی، بدون واردکردن گسترده پیکربندی/امنیت |
    | `plugin-sdk/string-coerce-runtime` | ابزارهای کمکی محدود و اولیه تبدیل و نرمال‌سازی رکورد/رشته، بدون واردکردن مارک‌داون/ثبت گزارش |
    | `plugin-sdk/html-entity-runtime` | رمزگشایی تک‌مرحله‌ای موجودیت‌های HTML5 پایان‌یافته با نقطه‌ویرگول، بدون ابزارهای گسترده متن |
    | `plugin-sdk/text-utility-runtime` | ابزارهای سطح پایین متن و مسیر، شامل گریز HTML پنج‌موجودیتی |
    | `plugin-sdk/widget-html` | تشخیص سند کامل، اعتبارسنجی اندازه و خطاهای ورودی ابزار برای ویجت‌های مستقل HTML |
    | `plugin-sdk/host-runtime` | ابزارهای کمکی نرمال‌سازی نام میزبان و میزبان SCP |
    | `plugin-sdk/retry-runtime` | ابزارهای کمکی پیکربندی تلاش مجدد و اجراکننده تلاش مجدد |
    | `plugin-sdk/agent-runtime` | بشکه گسترده منسوخ‌شده برای ابزارهای کمکی پوشه/هویت/فضای کاری عامل، شامل `resolveAgentDir`، `resolveDefaultAgentDir` و خروجی سازگاری منسوخ‌شده `resolveOpenClawAgentDir`؛ زیرمسیرهای متمرکز عامل/زمان اجرا را ترجیح دهید |
    | `plugin-sdk/directory-runtime` | پرس‌وجو/حذف موارد تکراری پوشه مبتنی بر پیکربندی |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="زیرمسیرهای قابلیت و آزمون">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/media-runtime` | خروجی تجمیعی گسترده و منسوخ‌شدهٔ رسانه شامل `saveRemoteMedia`، `saveResponseMedia`، `readRemoteMediaBuffer` و `fetchRemoteMedia` منسوخ‌شده؛ `plugin-sdk/media-store`، `plugin-sdk/media-mime`، `plugin-sdk/outbound-media` و زیرمسیرهای زمان اجرای قابلیت را ترجیح دهید، و هنگامی که یک URL باید به رسانهٔ OpenClaw تبدیل شود، پیش از خواندن بافر از راهکارهای کمکی ذخیره‌سازی استفاده کنید |
    | `plugin-sdk/media-mime` | نرمال‌سازی محدود MIME، نگاشت پسوند فایل، تشخیص MIME و راهکارهای کمکی نوع رسانه |
    | `plugin-sdk/media-store` | راهکارهای کمکی محدود ذخیره‌سازی رسانه، مانند `saveMediaBuffer` و `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | راهکارهای کمکی مشترک جایگزینی هنگام شکست در تولید رسانه، انتخاب نامزد و پیام‌رسانی دربارهٔ مدل مفقود |
    | `plugin-sdk/media-understanding` | انواع ارائه‌دهندهٔ درک رسانه، به‌همراه خروجی‌های راهکارهای کمکی تصویر، صدا و استخراج ساختاریافته برای ارائه‌دهنده |
    | `plugin-sdk/text-chunking` | بخش‌بندی متن خروجی و محدوده‌ها با حفظ آفست، بخش‌بندی Markdown و راهکارهای کمکی رندر، توکنیزه‌کردن تگ HTML با آگاهی از نقل‌قول، تبدیل جدول Markdown، حذف تگ‌های دستورالعمل و ابزارهای متن ایمن |
    | `plugin-sdk/speech` | انواع ارائه‌دهندهٔ گفتار، به‌همراه خروجی‌های دستورالعمل، رجیستری، اعتبارسنجی، سازندهٔ TTS سازگار با OpenAI و راهکارهای کمکی گفتار برای ارائه‌دهنده |
    | `plugin-sdk/speech-core` | انواع مشترک ارائه‌دهندهٔ گفتار، رجیستری، دستورالعمل، نرمال‌سازی و خروجی‌های راهکارهای کمکی گفتار |
    | `plugin-sdk/realtime-transcription` | انواع ارائه‌دهندهٔ رونویسی بلادرنگ، راهکارهای کمکی رجیستری و راهکار کمکی مشترک نشست WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | راهکار کمکی راه‌اندازی اولیهٔ پروفایل بلادرنگ برای تزریق محدود زمینهٔ `IDENTITY.md`، `USER.md` و `SOUL.md` |
    | `plugin-sdk/realtime-voice` | انواع ارائه‌دهندهٔ صدای بلادرنگ، راهکارهای کمکی رجیستری و راهکارهای کمکی مشترک رفتار صدای بلادرنگ، شامل ردیابی فعالیت خروجی |
    | `plugin-sdk/image-generation` | انواع ارائه‌دهندهٔ تولید تصویر، به‌همراه راهکارهای کمکی دارایی تصویر/URL داده و سازندهٔ ارائه‌دهندهٔ تصویر سازگار با OpenAI |
    | `plugin-sdk/image-generation-core` | انواع مشترک تولید تصویر، جایگزینی هنگام شکست، احراز هویت و راهکارهای کمکی رجیستری |
    | `plugin-sdk/music-generation` | انواع ارائه‌دهنده، درخواست و نتیجهٔ تولید موسیقی |
    | `plugin-sdk/music-generation-core` | انواع مشترک منسوخ‌شدهٔ تولید موسیقی، راهکارهای کمکی جایگزینی هنگام شکست، جست‌وجوی ارائه‌دهنده و تجزیهٔ ارجاع مدل؛ سطوح ارائه‌دهندهٔ موسیقی متعلق به Plugin را ترجیح دهید |
    | `plugin-sdk/video-generation` | انواع ارائه‌دهنده، درخواست و نتیجهٔ تولید ویدئو |
    | `plugin-sdk/video-generation-core` | انواع مشترک تولید ویدئو، راهکارهای کمکی جایگزینی هنگام شکست، جست‌وجوی ارائه‌دهنده و تجزیهٔ ارجاع مدل |
    | `plugin-sdk/transcripts` | انواع مشترک ارائه‌دهندهٔ منبع رونوشت‌ها، راهکارهای کمکی رجیستری، توصیفگرهای نشست و فرادادهٔ گفته |
    | `plugin-sdk/webhook-targets` | رجیستری مقصد Webhook و راهکارهای کمکی نصب مسیر |
    | `plugin-sdk/webhook-path` | نام مستعار منسوخ‌شدهٔ سازگاری؛ از `plugin-sdk/webhook-ingress` استفاده کنید |
    | `plugin-sdk/web-media` | راهکارهای کمکی مشترک بارگذاری رسانهٔ راه‌دور/محلی |
    | `plugin-sdk/zod` | بازصدور منسوخ‌شدهٔ سازگاری؛ `zod` را مستقیماً از `zod` وارد کنید |
    | `plugin-sdk/plugin-test-api` | راهکار کمکی حداقلی `createTestPluginApi` درون‌مخزنی برای آزمون‌های واحد ثبت مستقیم Plugin، بدون واردکردن پل‌های راهکار کمکی آزمون مخزن |
    | `plugin-sdk/agent-runtime-test-contracts` | فیکسچرهای درون‌مخزنی قرارداد آداپتور بومی زمان اجرای عامل برای آزمون‌های احراز هویت، تحویل، جایگزینی، هوک ابزار، هم‌پوشانی پرامپت، طرح‌واره و نگاشت رونوشت |
    | `plugin-sdk/channel-test-helpers` | راهکارهای کمکی آزمون کانال‌محور درون‌مخزنی برای قراردادهای عمومی کنش/راه‌اندازی/وضعیت، بررسی‌های دایرکتوری، چرخهٔ حیات راه‌اندازی حساب، انتقال پیکربندی ارسال، ماک‌های زمان اجرا، مشکلات وضعیت، تحویل خروجی و ثبت هوک |
    | `plugin-sdk/channel-target-testing` | مجموعهٔ درون‌مخزنی مشترک موارد خطای تفکیک مقصد برای آزمون‌های کانال |
    | `plugin-sdk/channel-contract-testing` | راهکارهای کمکی درون‌مخزنی محدود آزمون قرارداد کانال، بدون خروجی تجمیعی گستردهٔ آزمون |
    | `plugin-sdk/plugin-test-contracts` | راهکارهای کمکی درون‌مخزنی قرارداد بستهٔ Plugin، ثبت، دست‌ساختهٔ عمومی، واردکردن مستقیم، API زمان اجرا و اثر جانبی واردکردن |
    | `plugin-sdk/plugin-state-test-runtime` | راهکارهای کمکی درون‌مخزنی آزمون مخزن وضعیت Plugin، صف ورودی و پایگاه دادهٔ وضعیت |
    | `plugin-sdk/provider-test-contracts` | راهکارهای کمکی درون‌مخزنی قرارداد زمان اجرای ارائه‌دهنده، احراز هویت، کشف، ورود اولیه، کاتالوگ، راهنما، قابلیت رسانه، سیاست بازپخش، صدای زندهٔ STT بلادرنگ، جست‌وجو/دریافت وب و جریان |
    | `plugin-sdk/provider-http-test-mocks` | ماک‌های HTTP/احراز هویت اختیاری Vitest درون‌مخزنی برای آزمون‌های ارائه‌دهنده‌ای که `plugin-sdk/provider-http` را به‌کار می‌گیرند |
    | `plugin-sdk/reply-payload-testing` | راهکارهای کمکی درون‌مخزنی برای پیوست‌کردن فراداده به فیکسچرهای بار پاسخ |
    | `plugin-sdk/sqlite-runtime-testing` | راهکارهای کمکی درون‌مخزنی چرخهٔ حیات SQLite برای آزمون‌های شخص‌اول |
    | `plugin-sdk/test-fixtures` | فیکسچرهای درون‌مخزنی عمومی ثبت زمان اجرای CLI، زمینهٔ محیط ایزوله، نویسندهٔ مهارت، پیام عامل، رویداد سیستم، بارگذاری مجدد ماژول، مسیر Plugin همراه، متن پایانه، بخش‌بندی، توکن احراز هویت و مورد نوع‌دار |
    | `plugin-sdk/test-node-mocks` | راهکارهای کمکی متمرکز درون‌مخزنی برای ماک‌کردن قابلیت‌های داخلی Node جهت استفاده در کارخانه‌های `vi.mock("node:*")` مربوط به Vitest |
  </Accordion>

  <Accordion title="زیرمسیرهای حافظه">
    | زیرمسیر | خروجی‌های کلیدی |
    | --- | --- |
    | `plugin-sdk/memory-core` | نام مستعار منسوخ‌شدهٔ سازگاری؛ از `plugin-sdk/memory-host-core` استفاده کنید |
    | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای منسوخ‌شدهٔ نمایه‌سازی/جست‌وجوی حافظه؛ زیرمسیرهای مستقل از فروشندهٔ میزبان حافظه را ترجیح دهید |
    | `plugin-sdk/memory-core-host-embedding-registry` | راهکارهای کمکی سبک‌وزن رجیستری ارائه‌دهندهٔ تعبیه‌سازی حافظه |
    | `plugin-sdk/memory-core-host-engine-foundation` | خروجی‌های موتور پایهٔ میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-embeddings` | قراردادهای تعبیه‌سازی میزبان حافظه، دسترسی به رجیستری، ارائه‌دهندهٔ محلی و راهکارهای کمکی عمومی دسته‌ای/راه‌دور. `registerMemoryEmbeddingProvider` در این سطح منسوخ شده است؛ برای ارائه‌دهندگان جدید از API عمومی ارائه‌دهندهٔ تعبیه‌سازی استفاده کنید. |
    | `plugin-sdk/memory-core-host-engine-qmd` | خروجی‌های موتور QMD میزبان حافظه |
    | `plugin-sdk/memory-core-host-engine-storage` | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
    | `plugin-sdk/memory-core-host-multimodal` | راهکارهای کمکی چندوجهی منسوخ‌شدهٔ میزبان حافظه؛ زیرمسیرهای مستقل از فروشندهٔ میزبان حافظه را ترجیح دهید |
    | `plugin-sdk/memory-core-host-query` | راهکارهای کمکی منسوخ‌شدهٔ پرس‌وجوی میزبان حافظه؛ زیرمسیرهای مستقل از فروشندهٔ میزبان حافظه را ترجیح دهید |
    | `plugin-sdk/memory-core-host-secret` | راهکارهای کمکی اسرار میزبان حافظه |
    | `plugin-sdk/memory-core-host-events` | نام مستعار منسوخ‌شدهٔ سازگاری؛ از `plugin-sdk/memory-host-events` استفاده کنید |
    | `plugin-sdk/memory-core-host-status` | راهکارهای کمکی وضعیت میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-cli` | راهکارهای کمکی زمان اجرای CLI میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-core` | راهکارهای کمکی زمان اجرای هستهٔ میزبان حافظه |
    | `plugin-sdk/memory-core-host-runtime-files` | راهکارهای کمکی فایل/زمان اجرای میزبان حافظه |
    | `plugin-sdk/memory-host-core` | نام مستعار مستقل از فروشنده برای راهکارهای کمکی زمان اجرای هستهٔ میزبان حافظه |
    | `plugin-sdk/memory-host-events` | نام مستعار مستقل از فروشنده برای راهکارهای کمکی دفتر رویداد میزبان حافظه |
    | `plugin-sdk/memory-host-files` | نام مستعار منسوخ‌شدهٔ سازگاری؛ از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
    | `plugin-sdk/memory-host-markdown` | راهکارهای کمکی مشترک Markdown مدیریت‌شده برای Pluginهای مجاور حافظه |
    | `plugin-sdk/memory-host-search` | نمای زمان اجرای Active Memory برای دسترسی به مدیر جست‌وجو |
    | `plugin-sdk/memory-host-status` | نام مستعار منسوخ‌شدهٔ سازگاری؛ از `plugin-sdk/memory-core-host-status` استفاده کنید |
  </Accordion>

  <Accordion title="زیرمسیرهای رزروشدهٔ راهکار کمکی همراه">
    زیرمسیرهای SDK راهکار کمکی همراهِ رزروشده، سطوح محدودی مختص مالک برای
    کد Plugin همراه هستند. آن‌ها در فهرست موجودی SDK ردیابی می‌شوند تا ساخت
    بسته‌ها و نام‌گذاری مستعار قطعی بماند، اما APIهای عمومی
    ساخت Plugin نیستند. قراردادهای جدید و قابل‌استفادهٔ مجدد میزبان باید از زیرمسیرهای عمومی SDK
    مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/ssrf-runtime` و
    `plugin-sdk/plugin-config-runtime` استفاده کنند.

    | زیرمسیر | مالک و هدف |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | راهکار کمکی Plugin همراه Codex برای نگاشت پیکربندی سرور MCP کاربر به پیکربندی رشتهٔ app-server در Codex (خروجی رزروشدهٔ بسته) |
    | `plugin-sdk/codex-native-task-runtime` | راهکار کمکی Plugin همراه Codex برای آینه‌سازی زیرعامل‌های بومی app-server در Codex به وضعیت وظیفهٔ OpenClaw (فقط درون‌مخزنی، نه خروجی بسته) |

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview)
- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
