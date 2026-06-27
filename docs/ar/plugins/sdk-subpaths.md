---
read_when:
    - اختيار المسار الفرعي الصحيح لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّنة وواجهات المساعدين
summary: 'كتالوج المسارات الفرعية لـ Plugin SDK: أي عمليات الاستيراد توجد وأين، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض SDK الخاصة بالـ Plugin كمجموعة من المسارات الفرعية العامة الضيقة ضمن
`openclaw/plugin-sdk/`. تصنّف هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمّعة حسب
الغرض. يوجد مخزون نقطة الدخول للمصرّف المُولَّد في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتكون صادرات الحزمة هي المجموعة العامة الفرعية
بعد طرح مسارات الاختبار/الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يمكن للمشرفين تدقيق
عدد الصادرات العامة باستخدام `pnpm plugin-sdk:surface` والمسارات الفرعية النشطة
للمساعدات المحجوزة باستخدام `pnpm plugins:boundary-report:summary`؛ وتؤدي صادرات
المساعدات المحجوزة غير المستخدمة إلى فشل تقرير CI بدلاً من بقائها في SDK العامة
كدين توافق خامد.

للاطلاع على دليل تأليف الـ Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## مدخل الـ Plugin

| المسار الفرعي                  | الصادرات الرئيسية                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر مزود الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                              |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                   |
| `plugin-sdk/health`            | تسجيل فحوصات صحة Doctor، والكشف، والإصلاح، والاختيار، والخطورة، وأنواع النتائج لمستهلكي الصحة المضمّنين                                                              |

### توافق ومساعدات اختبار مهملة

تبقى المسارات الفرعية المهملة مصدّرة للـ Plugins الأقدم، لكن ينبغي أن يستخدم الكود الجديد
مسارات SDK الفرعية المركّزة أدناه. توجد القائمة المُصانة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ ويرفض CI استيرادات الإنتاج
المضمّنة منها. البراميل الواسعة مثل `compat` و`config-types` و
`infra-runtime` و`text-runtime` و`zod` مخصّصة للتوافق فقط. استورد `zod`
مباشرةً من `zod`.

مسارات مساعدات الاختبار المدعومة بـ Vitest في OpenClaw محلية للمستودع فقط ولم تعد
صادرات حزمة: `agent-runtime-test-contracts`،
`channel-contract-testing`، `channel-target-testing`، `channel-test-helpers`،
`plugin-test-api`، `plugin-test-contracts`، `plugin-test-runtime`،
`provider-http-test-mocks`، `provider-test-contracts`، `test-env`،
`test-fixtures`، `test-node-mocks`، و`testing`.

### مسارات فرعية محجوزة لمساعدات الـ Plugin المضمّنة

هذه المسارات الفرعية هي أسطح توافق يملكها الـ Plugin للـ Plugin المضمّن الذي يملكها،
وليست واجهات API عامة للـ SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. تُحظر استيرادات الإضافات العابرة للمالكين
بواسطة حواجز عقد الحزمة.

<AccordionGroup>
  <Accordion title="مسارات Channel الفرعية">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد تحقق JSON Schema مخزن مؤقتا للمخططات المملوكة للـ Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومترجم الإعداد، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات الحسابات المتعددة، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحسابات |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة سماح مجموعات الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط إعدادات Channel المشتركة بالإضافة إلى بناة Zod وJSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات Channel المجمعة في OpenClaw للـ Plugins المجمعة والمُصانة فقط |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. معرّفات Channels الدردشة المجمعة/الرسمية القياسية، بالإضافة إلى تسميات/أسماء مستعارة للمنسق لـ Plugins التي تحتاج إلى التعرف على النص ذي بادئة المغلف دون ترميز جدولها الخاص صراحة. |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق لمخططات إعدادات Channel المجمعة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع رجوع عقد التجميع |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تخويل الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة لإدخال Channel منخفض المستوى. يجب أن تستخدم مسارات الاستقبال الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل Runtime تجريبي عالي المستوى لإدخال Channel وبناة حقائق المسارات لمسارات استقبال Channel المرحلة. فضله على تجميع قوائم السماح الفعالة، وقوائم سماح الأوامر، والإسقاطات القديمة في كل Plugin. راجع [واجهة برمجة تطبيقات إدخال Channel](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | عقود دورة حياة الرسائل بالإضافة إلى خيارات مسار الرد، والإيصالات، والمعاينة/البث المباشر، ومساعدات دورة الحياة، وهوية الخروج، وتخطيط الحمولة، والإرسالات الدائمة، ومساعدات سياق إرسال الرسائل. راجع [واجهة برمجة تطبيقات خروج Channel](/ar/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | اسم مستعار مهمل للتوافق لـ `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/channel-message-runtime` | اسم مستعار مهمل للتوافق لـ `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + المغلف |
    | `plugin-sdk/inbound-reply-dispatch` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-inbound` لمشغلات الوارد ومسندات الإرسال، و`plugin-sdk/channel-outbound` لمساعدات تسليم الرسائل. |
    | `plugin-sdk/messaging-targets` | اسم مستعار مهمل لتحليل الأهداف؛ استخدم `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة وحالة الوسائط المستضافة |
    | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط السلاسل والمحول |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط السلاسل، والاقتران، والربط المكوّن |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات Runtime |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في Runtime |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة/ملخص حالة Channel |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعدادات Channel |
    | `plugin-sdk/channel-config-writes` | مساعدات تخويل كتابة إعدادات Channel |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيدية مشتركة لـ Plugin Channel |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تعديل/قراءة إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | مساعدات ضيقة لسياسة حراسة الرسائل المباشرة قبل التشفير |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة لـ `@openclaw/discord@2026.3.13` المنشور وتوافق المالك المتعقب؛ يجب أن تستخدم Plugins الجديدة المسارات الفرعية العامة لـ SDK الخاص بـ Channel |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حسابات Telegram لتوافق المالك المتعقب؛ يجب أن تستخدم Plugins الجديدة مساعدات Runtime المحقونة أو المسارات الفرعية العامة لـ SDK الخاص بـ Channel |
    | `plugin-sdk/zalouser` | واجهة توافق مهملة لـ Zalo Personal للحزم المنشورة من Lark/Zalo التي لا تزال تستورد تخويل أوامر المرسل؛ يجب أن تستخدم Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | عرض الرسائل الدلالي، والتسليم، ومساعدات الرد التفاعلي القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | مساعدات واردة مشتركة لتصنيف الأحداث، وبناء السياق، والتنسيق، والجذور، وإزالة الارتداد، ومطابقة الإشارات، وسياسة الإشارات، وتسجيل الوارد |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة ارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارات، وعلامة الإشارة، ونص الإشارة دون سطح Runtime الوارد الأوسع |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound` أو `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل Channel، بالإضافة إلى مساعدات المخطط الأصلية المهملة المحتفظ بها لتوافق Plugin |
    | `plugin-sdk/channel-route` | تطبيع المسارات المشترك، وحل الأهداف المعتمد على المحلل، وتحويل معرّفات السلاسل إلى نصوص، ومفاتيح المسارات المدمجة/منزوعة التكرار، وأنواع الأهداف المحللة، ومساعدات مقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقد Channel |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments` و`getChannelSurface` و`pushAssignment` وأنواع أهداف الأسرار |
  </Accordion>

تظل عائلات مساعدات Channel المهملة متاحة فقط لتوافق Plugins المنشورة. خطة الإزالة هي: إبقاؤها خلال نافذة ترحيل Plugins الخارجية، وإبقاء Plugins المستودع/المجمعة على `channel-inbound` و`channel-outbound`، ثم إزالة المسارات الفرعية للتوافق في التنظيف الرئيسي التالي لـ SDK. ينطبق هذا على عائلات رسائل/Runtime Channel القديمة، وبث Channel، ووصول الرسائل المباشرة، وتشظي مساعدات الوارد، وخيارات الرد، ومسارات الاقتران.

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة مزوّد LM Studio المدعومة للإعداد، واكتشاف الفهرس، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لافتراضيات الخادم المحلي، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد منتقاة للمزوّدين المحليين/ذاتيي الاستضافة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مركّزة للمزوّدين ذاتيي الاستضافة المتوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | افتراضيات الواجهة الخلفية لـ CLI + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API وقت التشغيل لمزوّدات Plugin |
    | `plugin-sdk/provider-oauth-runtime` | أنواع عامة لاستدعاءات OAuth العكسية للمزوّدين، وتصوير صفحة الاستدعاء العكسي، ومساعدات PKCE/الحالة، وتحليل مُدخلات التفويض، ومساعدات انتهاء صلاحية الرموز، ومساعدات الإلغاء |
    | `plugin-sdk/provider-auth-api-key` | مساعدات التهيئة وكتابة الملف الشخصي لمفاتيح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسية |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ومساعدات استيراد مصادقة OpenAI Codex، وتصدير توافق مهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, وبُناة سياسة إعادة التشغيل المشتركة، ومساعدات نقاط نهاية المزوّدين، ومساعدات تطبيع معرّفات النماذج المشتركة |
    | `plugin-sdk/provider-catalog-live-runtime` | مساعدات فهرس نماذج المزوّد المباشرة للاكتشاف المحمي بأسلوب `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, وتصفية معرّفات النماذج، وذاكرة TTL المؤقتة، والرجوع الثابت |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل إغناء فهرس المزوّد ومفاصل سجل مزوّدي Plugin لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط النهاية للمزوّدين، وأخطاء HTTP للمزوّدين، ومساعدات نماذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لإعداد/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لمزوّد جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/اعتمادات بحث الويب للمزوّدين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/اعتمادات بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحدّدات/جوالب الاعتمادات محدودة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لمزوّد بحث الويب |
    | `plugin-sdk/embedding-providers` | أنواع عامة لمزوّدي التضمين ومساعدات قراءة، بما في ذلك `EmbeddingProviderAdapter` و`getEmbeddingProvider(...)` و`listEmbeddingProviders(...)`؛ تسجل Plugins المزوّدين عبر `api.registerEmbeddingProvider(...)` بحيث تُفرض ملكية البيان |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
    | `plugin-sdk/provider-usage` | أنواع لقطات استخدام المزوّد، ومساعدات جلب الاستخدام المشتركة، وجوالب المزوّدين مثل `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلّفات البث، وتوافق استدعاءات الأدوات بالنص العادي، ومساعدات مغلّفات مشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | مساعدات عامة مشتركة لمغلّفات بث المزوّدين، بما في ذلك `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`، وأدوات بث متوافقة مع Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل أصلية للمزوّدين مثل الجلب المحمي، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع إعدادات التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/خريطة/ذاكرة مؤقتة محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعات وتحليل الأوامر |
  </Accordion>

تُبلّغ لقطات استخدام المزوّد عادة عن نافذة حصة واحدة أو أكثر في `windows`، ولكل منها
تسمية ونسبة مئوية مستخدمة ووقت إعادة تعيين اختياري. على المزوّدين الذين يكشفون نص الرصيد أو
حالة الحساب بدلا من نوافذ حصة قابلة لإعادة التعيين أن يعيدوا
`summary` مع مصفوفة `windows` فارغة بدلا من اختلاق نسب مئوية.
يعرض OpenClaw نص الملخص هذا في مخرجات الحالة؛ استخدم `error` فقط عندما تفشل
نقطة نهاية الاستخدام أو لا تعيد أي بيانات استخدام قابلة للاستعمال.

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، ومساعدات تفويض المرسِل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المعتمِد ومصادقة إجراءات المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف/مرشح الموافقة الأصلي لتنفيذ الأوامر |
    | `plugin-sdk/approval-delivery-runtime` | محولات قدرات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محولات الموافقة الأصلية لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل مفاصل المحول/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي، وربط الحساب، وبوابة المسار، ورجوع إعادة التوجيه، وقمع مطالبة تنفيذ الأوامر الأصلية المحلية |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعل الموافقة المرمّزة صراحة، وحمولات مطالبة التفاعل، ومخازن أهداف التفاعل، وتصدير توافق لقمع مطالبة تنفيذ الأوامر الأصلية المحلية |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد موافقة التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقة التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المنظمة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القنوات دون برميل الاختبار الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات خفيفة لنص الأوامر لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | تطبيع جسم الأمر ومساعدات سطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القنوات/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد/إعدادات الأسرار |
    | `plugin-sdk/secret-provider-integration` | عقود بيان تكامل مزوّد SecretRef المعتمدة على الأنواع فقط وعقود الإعدادات المسبقة لـ Plugins التي تنشر إعدادات مسبقة خارجية لمزوّدي الأسرار |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل الخاصة، والملفات/المسارات المحدودة بالجذر، بما في ذلك الكتابات بالإنشاء فقط، واستبدال الملفات الذري المتزامن/غير المتزامن، وكتابات الملفات المؤقتة الشقيقة، ورجوع النقل عبر الأجهزة، ومساعدات مخزن الملفات الخاص، وحراس الآباء للروابط الرمزية، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للموزع المثبّت دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | الموزع المثبّت، والجلب المحمي من SSRF، وخطأ SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مُدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/الجسم الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة للتشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة التشغيل، والمسجل، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
    | `plugin-sdk/browser-config` | واجهة إعداد متصفح مدعومة للملف الشخصي/الإعدادات الافتراضية المطبعة، وتحليل CDP URL، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/agent-harness-task-runtime` | مساعدات عامة لدورة حياة المهام وتسليم الإكمال للوكلاء المدعومين بحاضنة الذين يستخدمون نطاق مهمة صادرًا من المضيف |
    | `plugin-sdk/codex-mcp-projection` | مساعد Codex مجمع محجوز لإسقاط إعداد خادم MCP الخاص بالمستخدم في إعداد سلسلة Codex؛ وليس للـ plugins التابعة لجهات خارجية |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Codex مجمع خاص لتوصيل مرآة/تشغيل المهام الأصلية؛ وليس للـ plugins التابعة لجهات خارجية |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات أقدم تابعة لجهات خارجية؛ يجب أن تستورد الـ plugins الجديدة `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات أقدم تابعة لجهات خارجية؛ يجب أن تستورد الـ plugins الجديدة مسارات SDK الفرعية العامة مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/http/تفاعلات Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط تشغيل كسولة مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات CLI للتنسيق والانتظار والإصدار واستدعاء الوسائط ومجموعات الأوامر الكسولة |
    | `plugin-sdk/qa-live-transport-scenarios` | معرفات سيناريوهات ضمان الجودة للنقل الحي المشتركة، ومساعدات تغطية الأساس، ومساعد اختيار السيناريو |
    | `plugin-sdk/gateway-method-runtime` | مساعد محجوز لتوجيه أساليب Gateway لمسارات HTTP الخاصة بالـ Plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء عميل جاهز لحلقة الأحداث، وRPC للـ CLI الخاص بـ Gateway، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح إعداد مركز للأنواع فقط لأشكال إعداد Plugin مثل `OpenClawConfig` وأنواع إعداد القنوات/المزودين |
    | `plugin-sdk/plugin-config-runtime` | مساعدات بحث إعداد Plugin في وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل إعدادات بمعاملات مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | سلاسل تلميحات بيانات وصفية مشتركة لتسليم أدوات الرسائل |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعداد العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أمر Telegram وفحوص التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المجمع غير متاح |
    | `plugin-sdk/text-autolink-runtime` | كشف الربط التلقائي لمراجع الملفات من دون برميل النصوص الواسع |
    | `plugin-sdk/approval-reaction-runtime` | روابط تفاعلات الموافقة المضمنة، وحمولات مطالبات التفاعل، ومخازن أهداف التفاعل، وتصدير توافق لكبت مطالبة التنفيذ الأصلية المحلية |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملفات الشخصية، ومساعدات التوجيه/التشغيل الأصلي، وتنسيق مسار عرض الموافقة المهيكل |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لتشغيل الرسائل الواردة/الردود، والتقسيم، والإرسال، وHeartbeat، ومخطط الردود |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال/إنهاء الردود وتسميات المحادثات |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل ردود نافذة قصيرة. يجب أن تستخدم شيفرة دورات الرسائل الجديدة `createChannelHistoryWindow`؛ وتبقى مساعدات الخرائط منخفضة المستوى تصديرات توافق مهملة فقط |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات سير عمل الجلسات (`getSessionEntry` و`listSessionEntries` و`patchSessionEntry` و`upsertSessionEntry`)، وقراءات نصوص نسخ المستخدم/المساعد المحدودة الحديثة حسب هوية الجلسة، ومساعدات مسار مخزن الجلسات القديم/مفتاح الجلسة، وقراءات وقت التحديث، ومساعدات توافق للانتقال فقط لمسار الملف/المخزن الكامل |
    | `plugin-sdk/session-transcript-runtime` | هوية النسخة، ومساعدات هدف/قراءة/كتابة محددة النطاق، ونشر التحديثات، وأقفال الكتابة، ومفاتيح إصابات ذاكرة النسخ |
    | `plugin-sdk/sqlite-runtime` | مساعدات مركزة لمخطط وكيل SQLite والمسار والمعاملات لتشغيل الطرف الأول |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسارات مجلدات الحالة/OAuth |
    | `plugin-sdk/plugin-state-runtime` | أنواع حالة Plugin الجانبية ذات المفاتيح في SQLite، إضافة إلى إعداد مركزي لبراغما الاتصال وصيانة WAL لقواعد البيانات المملوكة للـ Plugin |
    | `plugin-sdk/routing` | مساعدات ربط المسارات/مفاتيح الجلسات/الحسابات مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وافتراضات حالة التشغيل، ومساعدات بيانات وصفية للمشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر بمهلة مع نتائج stdout/stderr مطبعة |
    | `plugin-sdk/param-readers` | قارئات مشتركة لمعاملات الأدوات/CLI |
    | `plugin-sdk/tool-plugin` | تعريف Plugin أداة وكيل بسيطة ومطبوعة وكشف بيانات وصفية ثابتة لتوليد البيان |
    | `plugin-sdk/tool-payload` | استخراج حمولات مطبعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/sandbox` | أنواع خلفية Sandbox ومساعدات أوامر SSH/OpenShell، بما في ذلك فحص مسبق سريع الفشل لأمر التنفيذ |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مساعدات مسجل الأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جداول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعداد مزود المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/json-unsafe-integers` | مساعدات تحليل JSON التي تحفظ القيم الحرفية للأعداد الصحيحة غير الآمنة كسلاسل |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات تشغيل/جلسة ACP وإرسال الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل خلفية ACP وإرسال الردود للـ plugins المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات محددة لمخطط إعداد تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مشتركة لمساعدات القنوات السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات رد أمر/مزود `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي للـ plugins الموثوقة لحاضنات الوكلاء منخفضة المستوى: أنواع الحاضنة، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة التشغيل، وتصنيف النتيجة الطرفية، ومساعدات تنسيق/تفصيل تقدم الأدوات، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة لكشف نقطة النهاية المملوكة لمزود Z.AI؛ استخدم واجهة API العامة للـ Plugin الخاص بـ Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة التشغيل الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياسات نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت داخل الذاكرة لإزالة التكرار |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ التسليمات المعلقة الصادرة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات تنبيه Heartbeat وأحداثه وظهوره |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي قسري |
    | `plugin-sdk/secure-random-runtime` | مساعدات رموز/UUID آمنة |
    | `plugin-sdk/system-event-runtime` | مساعدات طابور أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/exec-approvals-runtime` | مساعدات ملف سياسة موافقات التنفيذ من دون برميل infra-runtime الواسع |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات التشغيل الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علامة التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء، والتنسيق، وتصنيف الأخطاء المشترك، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch ملفوفة، والوكيل، وخيار EnvHttpProxyAgent، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch تشغيل واع بالمرسل من دون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | مساعدات تنقية URL بيانات الصور المضمنة واستكشاف التوقيع من دون سطح تشغيل الوسائط الواسع |
    | `plugin-sdk/response-limit-runtime` | قارئ جسم استجابة محدود من دون سطح تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه ربط مهيأ أو مخازن اقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات من دون استيرادات واسعة لكتابات/صيانة الإعداد |
    | `plugin-sdk/sqlite-runtime` | مساعدات مركزة لمخطط وكيل SQLite والمسار والمعاملات من دون عناصر تحكم دورة حياة قاعدة البيانات |
    | `plugin-sdk/context-visibility-runtime` | حل ظهور السياق وتصفية السياق التكميلي من دون استيرادات واسعة للإعداد/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة للتحويل القسري والتطبيع للسجلات/السلاسل البدائية من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات مجلد/هوية/مساحة عمل الوكيل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدلائل المدعوم بالإعداد |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="مسارات فرعية للقدرات والاختبار">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، بما في ذلك `saveRemoteMedia` و`saveResponseMedia` و`readRemoteMediaBuffer` و`fetchRemoteMedia` المهملة؛ فضّل مساعدات التخزين قبل قراءات المخزن المؤقت عندما ينبغي أن يصبح عنوان URL وسائط OpenClaw |
    | `plugin-sdk/media-mime` | تطبيع MIME محدود، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات محدودة لمخزن الوسائط مثل `saveMediaBuffer` و`saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتجاوز فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط، إضافة إلى تصديرات مساعدات الصور/الصوت/الاستخراج المنظم الموجهة للموفر |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/تصيير النص وMarkdown، وتحويل جداول Markdown، وإزالة وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام، إضافة إلى تصديرات التوجيه والسجل والتحقق ومنشئ TTS المتوافق مع OpenAI ومساعدات الكلام الموجهة للموفر |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وتصديرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ في الوقت الحقيقي، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-bootstrap-context` | مساعد تمهيد ملف التعريف في الوقت الحقيقي لحقن سياق `IDENTITY.md` و`USER.md` و`SOUL.md` المحدود |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت في الوقت الحقيقي، ومساعدات السجل، ومساعدات سلوك الصوت في الوقت الحقيقي المشتركة، بما في ذلك تتبع نشاط الإخراج |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور، إضافة إلى مساعدات أصول الصور/عنوان URL للبيانات ومنشئ موفر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات تجاوز الفشل، والبحث عن الموفر، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع موفر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات تجاوز الفشل، والبحث عن الموفر، وتحليل مرجع النموذج |
    | `plugin-sdk/transcripts` | أنواع موفري مصادر النصوص المشتركة، ومساعدات السجل، وواصفات الجلسات، وبيانات وصفية للمنطوقات |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم مستعار توافق مهمل؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير توافق مهملة؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | ملف تجميعي للتوافق المهمل محلي للمستودع لاختبارات OpenClaw القديمة. ينبغي أن تستورد اختبارات المستودع الجديدة مسارات اختبار محلية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` حد أدنى محلي للمستودع لاختبارات وحدة تسجيل Plugin المباشرة دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول agent-runtime أصلي محلية للمستودع لاختبارات المصادقة والتسليم والرجوع الاحتياطي وخطاف الأداة وتراكب الموجه والمخطط وإسقاط النص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار محلية للمستودع موجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء تشغيل الحساب، وتمرير send-config، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | حزمة مشتركة محلية للمستودع لحالات أخطاء حل الهدف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود محلية للمستودع لحزمة Plugin والتسجيل والأثر العام والاستيراد المباشر وواجهة API وقت التشغيل والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود محلية للمستودع لوقت تشغيل الموفر والمصادقة والاكتشاف وonboard والكتالوج والمعالج وقدرة الوسائط وسياسة إعادة التشغيل وSTT للصوت المباشر في الوقت الحقيقي والبحث/الجلب عبر الويب والتدفق |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية محلية للمستودع في Vitest لاختبارات الموفر التي تمرّن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة محلية للمستودع لالتقاط وقت تشغيل CLI وسياق sandbox وكاتب Skills ورسالة الوكيل وحدث النظام وإعادة تحميل الوحدة ومسار Plugin المضمّن ونص الطرفية والتقسيم ورمز المصادقة والحالات المطبوعة |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة للمكتبات المدمجة في Node محلية للمستودع لاستخدامها داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="مسارات الذاكرة الفرعية">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمّن لمساعدات المدير/التكوين/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-embedding-registry` | مساعدات سجل موفر تضمين الذاكرة خفيفة الوزن |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفر المحلي، ومساعدات الدُفعات/البعيد العامة. `registerMemoryEmbeddingProvider` على هذا السطح مهمل؛ استخدم واجهة API موفر التضمين العامة للموفرين الجدد. |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم مستعار توافق مهمل؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملف/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للبائع لمساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار توافق مهمل؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة للـ Plugins القريبة من الذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل الذاكرة النشطة للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار توافق مهمل؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="مسارات فرعية محجوزة للمساعدات المضمّنة">
    مسارات SDK الفرعية المحجوزة للمساعدات المضمّنة هي أسطح ضيقة خاصة بالمالك لكود
    Plugin المضمّن. يجري تتبعها في مخزون SDK لكي تبقى
    عمليات بناء الحزم والأسماء المستعارة حتمية، لكنها ليست واجهات API عامة
    لتأليف Plugins. ينبغي لعقود المضيف الجديدة القابلة لإعادة الاستخدام أن تستخدم مسارات SDK فرعية عامة
    مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime`.

    | المسار الفرعي | المالك والغرض |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | مساعد Plugin Codex المضمّن لإسقاط تكوين خادم MCP الخاص بالمستخدم في تكوين خيط app-server في Codex |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Plugin Codex المضمّن لعكس الوكلاء الفرعيين الأصليين في app-server في Codex إلى حالة مهمة OpenClaw |

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview)
- [إعداد SDK الخاص بـ Plugin](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
