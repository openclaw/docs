---
read_when:
    - اختيار المسار الفرعي الصحيح في plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّنة وواجهات المساعدات
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أي عمليات الاستيراد توجد أين، مجمعة حسب المجال'
title: مسارات Plugin SDK الفرعية
x-i18n:
    generated_at: "2026-07-01T20:20:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض SDK الخاصة بـ Plugin كمجموعة من المسارات الفرعية العامة الضيقة ضمن
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمعة حسب
الغرض. يوجد مخزون نقاط دخول المترجم المُولَّد في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتكون تصديرات الحزمة هي المجموعة الفرعية العامة
بعد طرح مسارات الاختبار/الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يمكن للمشرفين تدقيق
عدد التصديرات العامة باستخدام `pnpm plugin-sdk:surface` ومسارات المساعدين الفرعية
المحجوزة النشطة باستخدام `pnpm plugins:boundary-report:summary`؛ تفشل تصديرات
المساعدين المحجوزة غير المستخدمة تقرير CI بدلاً من أن تبقى في SDK العامة كدين توافق
خامل.

لدليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## إدخال Plugin

| المسار الفرعي                 | التصديرات الرئيسية                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر مزود الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                              |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                    |
| `plugin-sdk/health`            | تسجيل فحوصات سلامة Doctor، والكشف، والإصلاح، والاختيار، والخطورة، وأنواع النتائج لمستهلكي السلامة المضمّنين                                                           |

### التوافق المهمل ومساعدات الاختبار

تبقى المسارات الفرعية المهملة مُصدَّرة لأجل Plugins الأقدم، لكن يجب أن يستخدم الكود
الجديد مسارات SDK الفرعية المركزة أدناه. القائمة المُصانة هي
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ يرفض CI استيرادات الإنتاج
المضمّنة منها. البراميل الواسعة مثل `compat`، و`config-types`،
و`infra-runtime`، و`text-runtime`، و`zod` مخصصة للتوافق فقط. استورد `zod`
مباشرة من `zod`.

مسارات مساعدات الاختبار المدعومة بـ Vitest في OpenClaw محلية للمستودع فقط ولم تعد
تصديرات حزمة: `agent-runtime-test-contracts`،
`channel-contract-testing`، و`channel-target-testing`، و`channel-test-helpers`،
و`plugin-test-api`، و`plugin-test-contracts`، و`plugin-test-runtime`،
و`provider-http-test-mocks`، و`provider-test-contracts`، و`test-env`،
و`test-fixtures`، و`test-node-mocks`، و`testing`.

### مسارات مساعدي Plugin المضمّن المحجوزة

هذه المسارات الفرعية أسطح توافق مملوكة لـ Plugin لصالح Plugin المضمّن الذي يملكها،
وليست واجهات SDK عامة: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. تُحظر استيرادات الامتدادات العابرة للمالكين
بواسطة ضوابط عقد الحزمة.

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | عمليات التصدير الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد تحقق JSON Schema المخزن مؤقتا للمخططات المملوكة لـ Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومترجم الإعداد، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات الحسابات المتعددة، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة السماح لمجموعات الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط إعداد القناة المشتركة بالإضافة إلى Zod وبناة JSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعداد قنوات OpenClaw المضمنة للـ Plugins المضمنة المصانة فقط |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. معرفات قنوات الدردشة المضمنة/الرسمية القانونية بالإضافة إلى تسميات/أسماء مستعارة للمنسقات للـ Plugins التي تحتاج إلى التعرف على النص ذي بادئة المغلف من دون ترميز جدولها الخاص بشكل ثابت. |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق مع مخططات إعداد القنوات المضمنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع رجوع عقد مضمن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة لدخول القنوات منخفض المستوى. يجب أن تستخدم مسارات الاستلام الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل وقت تشغيل تجريبي عالي المستوى لدخول القنوات وبناة حقائق المسارات لمسارات استلام القنوات المرحلة. فضله على تجميع قوائم السماح الفعلية، وقوائم السماح للأوامر، والإسقاطات القديمة في كل Plugin. راجع [واجهة API لدخول القنوات](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | عقود دورة حياة الرسائل بالإضافة إلى خيارات مسار الرد، والإيصالات، والمعاينة/البث المباشر، ومساعدات دورة الحياة، وهوية الصادر، وتخطيط الحمولة، والإرسال الدائم، ومساعدات سياق إرسال الرسائل. راجع [واجهة API للصادر من القنوات](/ar/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | اسم مستعار مهمل للتوافق مع `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/channel-message-runtime` | اسم مستعار مهمل للتوافق مع `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + المغلف |
    | `plugin-sdk/inbound-reply-dispatch` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-inbound` لمشغلات الوارد ومحددات الإرسال، و`plugin-sdk/channel-outbound` لمساعدات تسليم الرسائل. |
    | `plugin-sdk/messaging-targets` | اسم مستعار مهمل لتحليل الأهداف؛ استخدم `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة وحالة الوسائط المستضافة |
    | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط السلاسل والمحول |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط السلاسل، والاقتران، والربط المكون |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة/ملخص حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعداد القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعداد القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيد مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تعديل/قراءة إعداد قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | مساعدات ضيقة لسياسة حارس الرسائل المباشرة قبل التشفير |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للحزمة المنشورة `@openclaw/discord@2026.3.13` وتوافق المالك المتتبع؛ يجب أن تستخدم Plugins الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram من أجل توافق المالك المتتبع؛ يجب أن تستخدم Plugins الجديدة مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق مهملة لـ Zalo Personal لحزم Lark/Zalo المنشورة التي لا تزال تستورد تفويض أمر المرسل؛ يجب أن تستخدم Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | عرض الرسائل الدلالي، والتسليم، ومساعدات الرد التفاعلي القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | مساعدات وارد مشتركة لتصنيف الأحداث، وبناء السياق، والتنسيق، والجذور، وإزالة الارتداد، ومطابقة الإشارات، وسياسة الإشارات، وتسجيل الوارد |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة ارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارات، وعلامة الإشارة، ونص الإشارة من دون سطح وقت تشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound` أو `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القنوات، بالإضافة إلى مساعدات المخطط الأصلي المهملة المحتفظ بها لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسارات، وحل الأهداف المعتمد على المحلل، وتحويل معرف السلسلة إلى نص، ومفاتيح المسارات لإزالة التكرار/Compaction، وأنواع الأهداف المحللة، ومقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقود القنوات |
    | `plugin-sdk/channel-feedback` | ربط التعليقات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments` و`getChannelSurface` و`pushAssignment` وأنواع أهداف الأسرار |
  </Accordion>

تبقى عائلات مساعدات القنوات المهملة متاحة فقط لتوافق Plugins
المنشورة. خطة الإزالة هي: إبقاؤها خلال نافذة ترحيل Plugin الخارجية،
وإبقاء Plugins المستودع/المضمنة على `channel-inbound` و
`channel-outbound`، ثم إزالة المسارات الفرعية للتوافق في عملية تنظيف SDK
الرئيسية التالية. ينطبق هذا على عائلات رسائل/وقت تشغيل القنوات القديمة،
وبث القنوات، ووصول الرسائل المباشرة، وتشظي مساعدات الوارد، وخيارات الرد،
ومسارات الاقتران.

  <Accordion title="المسارات الفرعية للموفر">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة موفر LM Studio المدعومة للإعداد، واكتشاف الفهرس، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة للإعدادات الافتراضية للخادم المحلي، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحملة |
    | `plugin-sdk/provider-setup` | مساعدات منتقاة لإعداد الموفر المحلي/المستضاف ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفر مستضاف ذاتيًا متوافق مع OpenAI |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية لخلفية CLI + ثوابت المراقبة |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API وقت التشغيل لPlugins الموفرين |
    | `plugin-sdk/provider-oauth-runtime` | أنواع رد النداء العامة لـ OAuth للموفر، وتصوير صفحة رد النداء، ومساعدات PKCE/الحالة، وتحليل إدخال التفويض، ومساعدات انتهاء صلاحية الرمز، ومساعدات الإلغاء |
    | `plugin-sdk/provider-auth-api-key` | مساعدات التهيئة الأولية لمفتاح API/كتابة الملف الشخصي مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة الموفر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, مساعدات استيراد مصادقة OpenAI Codex، وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, بُنّاء سياسات إعادة التشغيل المشتركة، ومساعدات نقاط نهاية الموفر، ومساعدات مشتركة لتطبيع معرفات النماذج |
    | `plugin-sdk/provider-catalog-live-runtime` | مساعدات فهرس نماذج الموفر الحية لاكتشاف محروس بنمط `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, ترشيح معرفات النماذج، وذاكرة تخزين مؤقت TTL، واحتياط ثابت |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت التشغيل لتوسيع فهرس الموفر ونقاط تماس سجل Plugin-الموفر لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط النهاية للموفر، وأخطاء HTTP للموفر، ومساعدات نماذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لإعداد/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لموفر جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعداد/اعتماد ضيقة لبحث الويب للموفرين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد ضيقة لإعداد/اعتماد بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحددات/جوالب الاعتمادات المحددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لموفر بحث الويب |
    | `plugin-sdk/embedding-providers` | أنواع عامة لموفري التضمين ومساعدات قراءة، بما في ذلك `EmbeddingProviderAdapter` و`getEmbeddingProvider(...)` و`listEmbeddingProviders(...)`؛ تسجل Plugins الموفرين عبر `api.registerEmbeddingProvider(...)` بحيث تُفرض ملكية البيان |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
    | `plugin-sdk/provider-usage` | أنواع لقطات استخدام الموفر، ومساعدات جلب استخدام مشتركة، وجوالب موفرين مثل `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع مغلفات التدفق، وتوافق استدعاء الأدوات بنص عادي، ومساعدات مغلفات مشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | مساعدات عامة مشتركة لمغلفات تدفق الموفر، بما في ذلك `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`، وأدوات تدفق متوافقة مع Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفر الأصلية مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث نقل قابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات التهيئة الأولية |
    | `plugin-sdk/global-singleton` | مساعدات singleton/خريطة/ذاكرة تخزين مؤقت محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

عادةً ما تبلّغ لقطات استخدام الموفر عن نافذة حصة واحدة أو أكثر `windows`، يحتوي كل منها
على تسمية، ونسبة مئوية مستخدمة، ووقت إعادة تعيين اختياري. يجب على الموفرين الذين يعرضون نص الرصيد أو
حالة الحساب بدلًا من نوافذ الحصة القابلة لإعادة التعيين إرجاع
`summary` مع مصفوفة `windows` فارغة بدلًا من اختلاق نسب مئوية.
يعرض OpenClaw نص الملخص هذا في مخرجات الحالة؛ استخدم `error` فقط عندما
تفشل نقطة نهاية الاستخدام أو لا تُرجع أي بيانات استخدام قابلة للاستعمال.

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بُنّاء رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المعتمد ومصادقة الإجراء داخل المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات/مرشحات اعتماد التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | محولات قدرات/تسليم الاعتماد الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الاعتماد |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محول الاعتماد الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الاعتماد؛ فضّل نقاط تماس المحول/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الاعتماد الأصلي، وربط الحسابات، وبوابة المسار، واحتياط التمرير، وكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعل الاعتماد المرمزة، وحمولات مطالبة التفاعل، ومخازن أهداف التفاعل، وتصدير توافق لكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد اعتماد التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة اعتماد التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الاعتماد الأصلي، ومساعدات عرض اعتماد منظمة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة ضبط إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة دون برميل الاختبار الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات نص أوامر خفيفة لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | مساعدات كسولة لتدفق تسجيل دخول مصادقة الموفر للاقتران بقناة خاصة وWeb UI device-code |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/secret-provider-integration` | بيان تكامل موفر SecretRef وعقود الإعدادات المسبقة للأنواع فقط لPlugins التي تنشر إعدادات مسبقة خارجية لموفر الأسرار |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، ومساعدات الملفات/المسارات المحدودة بالجذر بما في ذلك الكتابات للإنشاء فقط، والاستبدال الذري المتزامن/غير المتزامن للملفات، والكتابات المؤقتة الشقيقة، واحتياط النقل عبر الأجهزة، ومساعدات مخزن الملفات الخاصة، وحراس الآباء للروابط الرمزية، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للمرسل المثبت دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | المرسل المثبت، والجلب المحروس ضد SSRF، وخطأ SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/body الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="مسارات وقت التشغيل والتخزين الفرعية">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، ومسجل السجلات، والمهلة، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/browser-config` | واجهة تكوين متصفح مدعومة للملف الشخصي/الإعدادات الافتراضية المطبعة، وتحليل عنوان CDP URL، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/agent-harness-task-runtime` | مساعدات عامة لدورة حياة المهام وتسليم الإكمال للوكلاء المدعومين بإطار تشغيل يستخدمون نطاق مهمة صادرًا من المضيف |
    | `plugin-sdk/codex-mcp-projection` | مساعد Codex مجمع محجوز لإسقاط تكوين خادم MCP الخاص بالمستخدم في تكوين سلسلة Codex؛ ليس مخصصًا لـ Plugins التابعة لجهات خارجية |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Codex مجمع خاص لتوصيل مرآة/وقت تشغيل المهام الأصلية؛ ليس مخصصًا لـ Plugins التابعة لجهات خارجية |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الجهات الخارجية الأقدم؛ ينبغي أن تستورد Plugins الجديدة `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الجهات الخارجية الأقدم؛ ينبغي أن تستورد Plugins الجديدة مسارات SDK الفرعية العامة مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/http/تفاعلات Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطاف الداخلي |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI، والانتظار، والإصدار، واستدعاء الوسائط، ومجموعة الأوامر الكسولة |
    | `plugin-sdk/qa-live-transport-scenarios` | معرفات سيناريوهات ضمان جودة النقل الحية المشتركة، ومساعدات تغطية خط الأساس، ومساعد اختيار السيناريو |
    | `plugin-sdk/gateway-method-runtime` | مساعد محجوز لتوجيه طرق Gateway لمسارات HTTP الخاصة بـ Plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء عميل جاهز لحلقة الأحداث، وRPC الخاص بـ CLI للبوابة، وأخطاء بروتوكول Gateway، وحل مضيف LAN المعلن، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح تكوين ضيق للأنواع فقط لأشكال تكوين Plugin مثل `OpenClawConfig` وأنواع تكوين القنوات/المزودين |
    | `plugin-sdk/plugin-config-runtime` | مساعدات بحث تكوين Plugin في وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل تكوين تعاملية مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | سلاسل تلميحات بيانات وصفية مشتركة لتسليم أداة الرسائل |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة تكوين العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المجمع غير متاح |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات دون حزمة النص الواسعة |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعل الموافقة المضمّنة، وحمولات مطالبة التفاعل، ومخازن أهداف التفاعل، وتصدير التوافق لقمع مطالبة التنفيذ المحلي الأصلي |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقسيم، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد وتسميات المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الرد ضمن نافذة قصيرة. ينبغي أن تستخدم شيفرة دورة الرسائل الجديدة `createChannelHistoryWindow`؛ وتبقى مساعدات الخرائط منخفضة المستوى تصديرات توافق مهملة فقط |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات سير عمل الجلسة (`getSessionEntry` و`listSessionEntries` و`patchSessionEntry` و`upsertSessionEntry`)، وقراءات نصوص محاضر المستخدم/المساعد الحديثة المحدودة بحسب هوية الجلسة، ومساعدات مسار مخزن الجلسات القديم/مفتاح الجلسة، وقراءات وقت التحديث، ومساعدات توافق انتقالية فقط للمخزن الكامل/مسار الملف |
    | `plugin-sdk/session-transcript-runtime` | هوية المحضر، ومساعدات الهدف/القراءة/الكتابة المحددة النطاق، ونشر التحديثات، وأقفال الكتابة، ومفاتيح إصابات ذاكرة المحضر |
    | `plugin-sdk/sqlite-runtime` | مساعدات ضيقة لمخطط وكيل SQLite، والمسار، والمعاملات لوقت تشغيل الطرف الأول |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسار دليل الحالة/OAuth |
    | `plugin-sdk/plugin-state-runtime` | أنواع حالة مفاتيح SQLite الجانبية الخاصة بـ Plugin، إضافة إلى إعداد مركزي لـ pragma الاتصال وصيانة WAL لقواعد البيانات المملوكة لـ Plugin |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وإعدادات حالة وقت التشغيل الافتراضية، ومساعدات بيانات وصفية للمشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر محدد الوقت بنتائج stdout/stderr مطبعة |
    | `plugin-sdk/param-readers` | قارئات معاملات مشتركة للأدوات/CLI |
    | `plugin-sdk/tool-plugin` | تعريف Plugin أداة وكيل بسيطة ومكتوبة، وكشف بيانات وصفية ثابتة لتوليد البيان |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال المعيارية من وسائط الأداة |
    | `plugin-sdk/sandbox` | أنواع واجهات sandbox الخلفية ومساعدات أوامر SSH/OpenShell، بما في ذلك فحص مسبق سريع الفشل لأمر التنفيذ |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسار التنزيل المؤقت ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مسجل النظام الفرعي ومساعدات التنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل تكوين مزود المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/json-unsafe-integers` | مساعدات تحليل JSON التي تحفظ القيم الحرفية للأعداد الصحيحة غير الآمنة كسلاسل |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل واجهة ACP الخلفية وإرسال الردود لـ Plugins المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ارتباط ACP للقراءة فقط دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | أساسيات ضيقة لمخطط تكوين وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | أساسيات مساعدة مشتركة للقناة السلبية، والحالة، والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات رد أمر/مزود `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح Plugin موثوق تجريبي لإطارات تشغيل الوكلاء منخفضة المستوى: أنواع إطار التشغيل، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة وقت التشغيل، وتصنيف النتيجة النهائية، ومساعدات تنسيق/تفاصيل تقدم الأدوات، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة لاكتشاف نقطة نهاية مزود Z.AI المملوكة للمزود؛ استخدم واجهة API العامة لـ Z.AI Plugin |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة وقت التشغيل الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياس نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار في الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسار الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات إيقاظ Heartbeat وحدثه ورؤيته |
    | `plugin-sdk/number-runtime` | مساعد إكراه عددي |
    | `plugin-sdk/secure-random-runtime` | مساعدات الرمز الآمن/UUID |
    | `plugin-sdk/system-event-runtime` | مساعدات طابور أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/exec-approvals-runtime` | مساعدات ملف سياسة موافقة التنفيذ دون حزمة infra-runtime الواسعة |
    | `plugin-sdk/infra-runtime` | حشوة توافق مهملة؛ استخدم مسارات وقت التشغيل الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علامة التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات رسم بياني للأخطاء، وتنسيق، وتصنيف أخطاء مشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch ملفوفة، والوكيل، وخيار EnvHttpProxyAgent، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch وقت تشغيل واع بالمرسل دون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | مساعدات تنظيف عنوان URL لبيانات الصورة المضمنة واستشعار التوقيع دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ارتباط المحادثة الحالية دون توجيه ارتباط مكوّن أو مخازن اقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات دون استيرادات واسعة لكتابات/صيانة التكوين |
    | `plugin-sdk/sqlite-runtime` | مساعدات ضيقة لمخطط وكيل SQLite، والمسار، والمعاملات دون عناصر تحكم دورة حياة قاعدة البيانات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق التكميلي دون استيرادات واسعة للتكوين/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه وتطبيع السجلات/السلاسل البدائية دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات تكوين إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار دليل مدعوم بالتكوين |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب الوسائط وتحويلها وتخزينها، بما في ذلك `saveRemoteMedia` و`saveResponseMedia` و`readRemoteMediaBuffer` و`fetchRemoteMedia` المهجورة؛ فضّل مساعدات التخزين قبل قراءات المخزن المؤقت عندما يجب أن يصبح عنوان URL وسيط OpenClaw |
    | `plugin-sdk/media-mime` | تطبيع MIME محدود، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات محدودة لمخزن الوسائط مثل `saveMediaBuffer` و`saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتجاوز فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت/الاستخراج المنظم الموجّهة إلى الموفّر |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/عرض النص وMarkdown، وتحويل جداول Markdown، وإزالة وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام بالإضافة إلى صادرات التوجيه والسجل والتحقق ومنشئ TTS المتوافق مع OpenAI ومساعدات الكلام الموجّهة إلى الموفّر |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ الآني، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-bootstrap-context` | مساعد تمهيد الملف الشخصي الآني لحقن سياق `IDENTITY.md` و`USER.md` و`SOUL.md` المحدود |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت الآني، ومساعدات السجل، ومساعدات سلوك الصوت الآني المشتركة، بما في ذلك تتبع نشاط الإخراج |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور بالإضافة إلى مساعدات أصول الصور/عنوان URL للبيانات ومنشئ موفّر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات تجاوز الفشل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع موفّر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات تجاوز الفشل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/transcripts` | أنواع موفري مصادر النصوص المشتركة، ومساعدات السجل، وواصفات الجلسات، وبيانات وصفية للملفوظات |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم توافق بديل مهجور؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير توافق مهجورة؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | ملف تجميعي محلي للمستودع ومهجور للتوافق مع اختبارات OpenClaw القديمة. يجب أن تستورد اختبارات المستودع الجديدة مسارات اختبار محلية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` أدنى محلي للمستودع لاختبارات وحدة تسجيل Plugin مباشرة من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول agent-runtime أصلية محلية للمستودع لاختبارات المصادقة والتسليم والرجوع وtool-hook وprompt-overlay والمخطط وإسقاط النصوص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار محلية للمستودع وموجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء الحساب، وتسلسل إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | حزمة مشتركة محلية للمستودع لحالات خطأ حل الهدف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود محلية للمستودع لحزمة Plugin والتسجيل والأثر العام والاستيراد المباشر وواجهة API لوقت التشغيل والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود محلية للمستودع لوقت تشغيل الموفّر، والمصادقة، والاكتشاف، والإعداد، والكتالوج، والمعالج، وإمكانات الوسائط، وسياسة إعادة التشغيل، وSTT للصوت الحي الآني، وبحث/جلب الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية محلية للمستودع في Vitest لاختبارات الموفّر التي تمرّن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة محلية للمستودع لالتقاط وقت تشغيل CLI، وسياق sandbox، وكاتب skill، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المجمّع، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات المعرّفة |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة محلية للمستودع لمكونات Node المدمجة للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core مجمّع لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-embedding-registry` | مساعدات خفيفة لسجل موفري تضمين الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفّر المحلي، ومساعدات الدُفعات/البعيدة العامة. `registerMemoryEmbeddingProvider` على هذا السطح مهجور؛ استخدم واجهة API العامة لموفّر التضمين للموفرين الجدد. |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم توافق بديل مهجور؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم توافق بديل مهجور؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة للإضافات المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل الذاكرة النشطة للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم توافق بديل مهجور؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة لمساعدات الحزمة">
    المسارات الفرعية المحجوزة لمساعدات الحزمة في SDK هي أسطح ضيقة ومخصصة للمالك
    لشيفرة Plugin المجمّعة. يتم تتبعها في مخزون SDK بحيث تبقى عمليات بناء
    الحزم والأسماء البديلة حتمية، لكنها ليست واجهات API عامة لتأليف الإضافات.
    يجب أن تستخدم عقود المضيف الجديدة القابلة لإعادة الاستخدام مسارات SDK فرعية عامة
    مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime`.

    | المسار الفرعي | المالك والغرض |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | مساعد Plugin Codex المجمّع لإسقاط إعداد خادم MCP الخاص بالمستخدم في إعداد سلسلة app-server في Codex |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Plugin Codex المجمّع لعكس الوكلاء الفرعيين الأصليين في app-server الخاص بـ Codex إلى حالة مهمة OpenClaw |

  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء الإضافات](/ar/plugins/building-plugins)
