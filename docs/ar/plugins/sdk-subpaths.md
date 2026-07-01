---
read_when:
    - اختيار المسار الفرعي الصحيح من plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية لـ Plugin المضمّنة وواجهات المساعدات
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أي عمليات الاستيراد توجد وأين، مجمعة حسب المجال'
title: مسارات Plugin SDK الفرعية
x-i18n:
    generated_at: "2026-07-01T13:06:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

يُعرَض SDK الخاص بـ Plugin بوصفه مجموعة من المسارات الفرعية العامة الضيقة ضمن
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمّعةً حسب
الغرض. يوجد مخزون نقطة دخول المصرّف المُولَّد في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتكون تصديرات الحزمة هي المجموعة الفرعية العامة
بعد طرح مسارات الاختبار/الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يمكن للمشرفين تدقيق
عدد التصديرات العامة باستخدام `pnpm plugin-sdk:surface` والمسارات الفرعية المحجوزة
النشطة للمساعدات باستخدام `pnpm plugins:boundary-report:summary`؛ وتُفشل تصديرات
المساعدات المحجوزة غير المستخدمة تقرير CI بدلاً من بقائها في SDK العام كدين توافق خامل.

للاطلاع على دليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## إدخال Plugin

| المسار الفرعي                  | التصديرات الرئيسية                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر مزوّد الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                            |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                   |
| `plugin-sdk/health`            | تسجيل فحوصات السلامة في Doctor، والاكتشاف، والإصلاح، والاختيار، والخطورة، وأنواع النتائج لمستهلكي السلامة المضمّنين                                                 |

### مساعدات التوافق والاختبار المهملة

تبقى المسارات الفرعية المهملة مصدّرةً من أجل Plugins الأقدم، لكن ينبغي للكود الجديد استخدام
مسارات SDK الفرعية المركّزة أدناه. القائمة المُصانة هي
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ ويرفض CI استيرادات
الإنتاج المضمّنة منها. البراميل الواسعة مثل `compat`، و`config-types`،
و`infra-runtime`، و`text-runtime`، و`zod` مخصّصة للتوافق فقط. استورد `zod`
مباشرةً من `zod`.

مسارات مساعدات الاختبار المدعومة بـ Vitest في OpenClaw محلية للمستودع فقط ولم تعد
تصديرات حزمة: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, و`testing`.

### المسارات الفرعية المحجوزة لمساعدات Plugin المضمّن

هذه المسارات الفرعية هي أسطح توافق مملوكة لـ Plugin من أجل Plugin المضمّن المالك لها،
وليست واجهات SDK API عامة: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. تُحظر استيرادات الإضافات العابرة للمالك
بواسطة حواجز عقد الحزمة.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد تحقق JSON Schema المخزّن مؤقتا للمخططات المملوكة لـ Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومترجم الإعداد، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات متعددة الحسابات وبوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب والرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقوائم الحسابات وإجراءات الحسابات |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة السماح لمجموعات الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط إعدادات القناة المشتركة بالإضافة إلى بناة Zod وJSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات قنوات OpenClaw المضمّنة للـ Plugins المضمّنة التي تتم صيانتها فقط |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. معرفات قنوات الدردشة المضمّنة/الرسمية القانونية بالإضافة إلى تسميات/أسماء مستعارة للمنسقين للـ Plugins التي تحتاج إلى التعرف على النص ذي بادئة المغلف من دون ترميز جدولها الخاص بشكل ثابت. |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق لمخططات إعدادات القنوات المضمّنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع رجوع احتياطي لعقد المضمّن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة لدخول القنوات منخفض المستوى. يجب أن تستخدم مسارات الاستلام الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل وقت تشغيل تجريبي عالي المستوى لدخول القنوات وبناة حقائق المسارات لمسارات استلام القنوات المرحّلة. يفضّل استخدامه بدلا من تجميع قوائم السماح الفعالة، وقوائم السماح للأوامر، والإسقاطات القديمة داخل كل Plugin. راجع [واجهة API لدخول القنوات](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | عقود دورة حياة الرسائل بالإضافة إلى خيارات مسار الردود، والإيصالات، والمعاينة/البث الحي، ومساعدات دورة الحياة، وهوية الصادر، وتخطيط الحمولة، والإرسالات الدائمة، ومساعدات سياق إرسال الرسائل. راجع [واجهة API لصادر القنوات](/ar/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | اسم مستعار مهمل للتوافق لـ `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/channel-message-runtime` | اسم مستعار مهمل للتوافق لـ `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد والمغلف |
    | `plugin-sdk/inbound-reply-dispatch` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-inbound` لمشغلات الوارد ومسندات الإرسال، و`plugin-sdk/channel-outbound` لمساعدات تسليم الرسائل. |
    | `plugin-sdk/messaging-targets` | اسم مستعار مهمل لتحليل الأهداف؛ استخدم `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة وحالة الوسائط المستضافة |
    | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط الخيوط والمحولات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط الخيوط، والاقتران، والربط المعدّ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القنوات |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعدادات القنوات |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القنوات |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيد مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تعديل/قراءة إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار وصول المجموعات |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | مساعدات ضيقة لسياسة حراسة الرسائل المباشرة قبل التشفير |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للحزمة المنشورة `@openclaw/discord@2026.3.13` وتوافق المالك المتتبع؛ يجب أن تستخدم Plugins الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حسابات Telegram من أجل توافق المالك المتتبع؛ يجب أن تستخدم Plugins الجديدة مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق Zalo Personal مهملة لحزم Lark/Zalo المنشورة التي لا تزال تستورد تفويض أوامر المرسل؛ يجب أن تستخدم Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | عرض الرسائل الدلالي، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | مساعدات واردة مشتركة لتصنيف الأحداث، وبناء السياق، والتنسيق، والجذور، وإزالة الارتداد، ومطابقة الإشارات، وسياسة الإشارات، وتسجيل الوارد |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة ارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارات، وعلامة الإشارة، ونص الإشارة من دون سطح وقت تشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound` أو `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القنوات، بالإضافة إلى مساعدات المخططات الأصلية المهملة المحتفظ بها لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسارات، وحل الأهداف المعتمد على المحلل، وتحويل معرف الخيط إلى سلسلة، ومفاتيح المسارات المزالة التكرار/المضغوطة، وأنواع الأهداف المحللة، ومقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقود القنوات |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/ردود الفعل |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

تبقى عائلات مساعدات القنوات المهملة متاحة فقط لتوافق Plugins
المنشورة. خطة الإزالة هي: إبقاؤها خلال نافذة ترحيل Plugin
الخارجية، وإبقاء Plugins المستودع/المضمّنة على `channel-inbound` و
`channel-outbound`، ثم إزالة المسارات الفرعية للتوافق في التنظيف الرئيسي التالي
لـ SDK. ينطبق هذا على عائلات رسائل/وقت تشغيل القنوات القديمة، وبث القنوات،
ووصول الرسائل المباشرة، وتفرعات مساعدات الوارد، وخيارات الرد،
ومسارات الاقتران.

  <Accordion title="المسارات الفرعية للموفّر">
    | المسار الفرعي | عمليات التصدير الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة موفّر LM Studio المدعومة للإعداد، واكتشاف الكتالوج، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لافتراضيات الخادم المحلي، واكتشاف النماذج، وترويسات الطلب، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات منتقاة لإعداد موفّري النماذج المحليين/المستضافين ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد موفّري النماذج المستضافين ذاتيًا والمتوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | افتراضيات خلفية CLI + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API في وقت التشغيل لـ Plugins الموفّرين |
    | `plugin-sdk/provider-oauth-runtime` | أنواع رد نداء OAuth العامة للموفّرين، وعرض صفحة رد النداء، ومساعدات PKCE/الحالة، وتحليل إدخال التفويض، ومساعدات انتهاء صلاحية الرموز، ومساعدات الإجهاض |
    | `plugin-sdk/provider-auth-api-key` | مساعدات تهيئة مفتاح API وكتابة الملف الشخصي مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`، و`ensureApiKeyFromOptionEnvOrPrompt`، و`upsertAuthProfile`، و`upsertApiKeyProfile`، و`writeOAuthCredentials`، ومساعدات استيراد مصادقة OpenAI Codex، وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks`، و`normalizeModelCompat`، ومنشئات سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية الموفّر، ومساعدات تطبيع معرّف النموذج المشتركة |
    | `plugin-sdk/provider-catalog-live-runtime` | مساعدات كتالوج نماذج الموفّر الحي لاكتشاف محروس بأسلوب `/models`: `buildLiveModelProviderConfig`، و`fetchLiveProviderModelRows`، و`getCachedLiveProviderModelRows`، و`fetchLiveProviderModelIds`، و`LiveModelCatalogHttpError`، و`clearLiveCatalogCacheForTests`، وتصفية معرّفات النماذج، وذاكرة TTL المخبئية، والرجوع الثابت |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت التشغيل لإثراء كتالوج الموفّر، ونقاط ربط سجل Plugin والموفّر لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`، و`buildSingleProviderApiKeyCatalog`، و`buildManifestModelProviderConfig`، و`supportsNativeStreamingUsageCompat`، و`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات قدرات HTTP/نقطة النهاية العامة للموفّر، وأخطاء HTTP للموفّر، ومساعدات نموذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لتكوين/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين موفّر جلب الويب مؤقتًا |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتكوين/اعتمادات بحث الويب للموفّرين الذين لا يحتاجون إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد تكوين/اعتمادات بحث الويب مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، ومحددات/مسترجعات الاعتمادات محددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين/وقت تشغيل موفّر بحث الويب |
    | `plugin-sdk/embedding-providers` | أنواع موفّري التضمين العامة ومساعدات القراءة، بما في ذلك `EmbeddingProviderAdapter`، و`getEmbeddingProvider(...)`، و`listEmbeddingProviders(...)`؛ تسجّل Plugins الموفّرين عبر `api.registerEmbeddingProvider(...)` بحيث تُفرض ملكية البيان |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
    | `plugin-sdk/provider-usage` | أنواع لقطات استخدام الموفّر، ومساعدات جلب الاستخدام المشتركة، وجالبات الموفّرين مثل `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع مغلفات البث، وتوافق استدعاء الأدوات بالنص العادي، ومساعدات مغلفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-stream-shared` | مساعدات عامة مشتركة لمغلفات بث الموفّر، بما في ذلك `composeProviderStreamWrappers`، و`createOpenAICompatibleCompletionsThinkingOffWrapper`، و`createPlainTextToolCallCompatWrapper`، و`createPayloadPatchStreamWrapper`، و`createToolStreamWrapper`، و`normalizeOpenAICompatibleReasoningPayload`، و`setQwenChatTemplateThinking`، وأدوات بث Anthropic/DeepSeek والمتوافقة مع OpenAI |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفّر الأصلية مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تكوين التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/خريطة/ذاكرة مخبئية محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

عادةً ما تبلّغ لقطات استخدام الموفّر عن نافذة حصة واحدة أو أكثر ضمن `windows`، ولكل منها
تسمية ونسبة مئوية مستخدمة ووقت إعادة تعيين اختياري. يجب على الموفّرين الذين يعرضون نص الرصيد أو
حالة الحساب بدلًا من نوافذ الحصص القابلة لإعادة التعيين إرجاع
`summary` مع مصفوفة `windows` فارغة بدلًا من اختلاق نسب مئوية.
يعرض OpenClaw نص الملخص هذا في مخرجات الحالة؛ استخدم `error` فقط عندما تفشل
نقطة نهاية الاستخدام أو لا تُرجع أي بيانات استخدام قابلة للاستعمال.

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | عمليات التصدير الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | منشئات رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافق ومصادقة إجراء الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف/مرشح موافقة التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرة/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئ الموافقة الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل نقاط الربط الأضيق للمهايئ/Gateway عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي، وربط الحساب، وبوابة المسار، والرجوع إلى إعادة التوجيه، وكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعل الموافقة الثابتة، وحمولات مطالبة التفاعل، ومخازن هدف التفاعل، وتصدير توافق لكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد موافقة التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقة التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المهيكلة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة بدون حزمة الاختبار الواسعة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات خفيفة لنص الأوامر لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع متن الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القنوات/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/التكوين |
    | `plugin-sdk/secret-provider-integration` | عقود بيان وتعيينات مسبقة لتكامل موفّر SecretRef بنوع فقط لـ Plugins التي تنشر تعيينات مسبقة خارجية لموفّر الأسرار |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، ومساعدات الملفات/المسارات المحصورة بالجذر، بما في ذلك عمليات الكتابة للإنشاء فقط، واستبدال الملفات الذري المتزامن/غير المتزامن، وكتابات مؤقتة شقيقة، ورجوع النقل عبر الأجهزة، ومساعدات مخزن الملفات الخاصة، وحراس أصل الرابط الرمزي، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للمرسل المثبت بدون سطح وقت التشغيل البنيوي الواسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات المرسل المثبت، والجلب المحروس بـ SSRF، وخطأ SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook/الهدف، وإكراه websocket/المتن الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة متن الطلب |
  </Accordion>

  <Accordion title="مسارات فرعية للتشغيل والتخزين">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة للتشغيل والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة التشغيل والمسجّل والمهلة الزمنية وإعادة المحاولة والتراجع التدريجي |
    | `plugin-sdk/browser-config` | واجهة إعدادات متصفح مدعومة لتطبيع ملفات التعريف والافتراضيات، وتحليل عناوين URL الخاصة بـ CDP، ومساعدات مصادقة التحكم بالمتصفح |
    | `plugin-sdk/agent-harness-task-runtime` | مساعدات عامة لدورة حياة المهام وتسليم الإكمال للوكلاء المدعومين بحزمة اختبار يستخدمون نطاق مهمة يصدره المضيف |
    | `plugin-sdk/codex-mcp-projection` | مساعد Codex مضمّن محجوز لإسقاط إعدادات خادم MCP الخاصة بالمستخدم في إعدادات سلسلة Codex؛ ليس لـ plugins الطرف الثالث |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Codex مضمّن خاص لربط مرآة المهام الأصلية وتشغيلها؛ ليس لـ plugins الطرف الثالث |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الطرف الثالث الأقدم؛ ينبغي لـ plugins الجديدة استيراد `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الطرف الثالث الأقدم؛ ينبغي لـ plugins الجديدة استيراد المسارات الفرعية العامة لـ SDK مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر Plugin والخطافات وHTTP والتفاعل |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط معالجة Webhook والخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد وربط التشغيل الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات CLI للتنسيق والانتظار والإصدار واستدعاء الوسيطات ومجموعات الأوامر الكسولة |
    | `plugin-sdk/qa-live-transport-scenarios` | معرّفات سيناريوهات ضمان الجودة للنقل الحي المشتركة، ومساعدات تغطية الخط الأساسي، ومساعد اختيار السيناريو |
    | `plugin-sdk/gateway-method-runtime` | مساعد إرسال طرق Gateway محجوز لمسارات HTTP الخاصة بـ Plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء عميل جاهز لحلقة الأحداث، وRPC الخاص بـ CLI للبوابة، وأخطاء بروتوكول البوابة، وحل مضيف LAN المعلَن، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح إعدادات مخصص للأنواع فقط لأشكال إعدادات Plugin مثل `OpenClawConfig` وأنواع إعدادات القنوات والمزوّدين |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن إعدادات Plugin أثناء التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل الإعدادات ضمن معاملات مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | سلاسل تلميحات بيانات وصفية مشتركة لتسليم أداة الرسائل |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعدادات العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع أسماء أوامر Telegram وأوصافها وفحوصات التكرار والتعارض، حتى عندما يكون سطح عقد Telegram المضمّن غير متاح |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون حزمة النصوص الواسعة |
    | `plugin-sdk/approval-reaction-runtime` | روابط تفاعلات الموافقة المضمنة، وحمولات مطالبات التفاعل، ومخازن أهداف التفاعل، وتصدير توافق لمنع مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ وPlugin، وبُناة إمكانات الموافقة، ومساعدات المصادقة وملفات التعريف، ومساعدات التوجيه والتشغيل الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لتشغيل الوارد والرد، والتجزئة، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال الرد وإنهائه وتسميات المحادثات |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ذي النافذة القصيرة. ينبغي لكود دورات الرسائل الجديد استخدام `createChannelHistoryWindow`؛ وتبقى مساعدات الخرائط ذات المستوى الأدنى صادرات توافق مهملة فقط |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتجزئة النص وMarkdown |
    | `plugin-sdk/session-store-runtime` | مساعدات سير عمل الجلسات (`getSessionEntry` و`listSessionEntries` و`patchSessionEntry` و`upsertSessionEntry`)، وقراءات محدودة لنصوص محاضر المستخدم/المساعد الحديثة حسب هوية الجلسة، ومساعدات مسار مخزن الجلسات القديم ومفتاح الجلسة، وقراءات وقت التحديث، ومساعدات توافق انتقالية فقط للمخزن الكامل ومسار الملف |
    | `plugin-sdk/session-transcript-runtime` | هوية المحضر، ومساعدات الهدف/القراءة/الكتابة المحددة النطاق، ونشر التحديثات، وأقفال الكتابة، ومفاتيح إصابات ذاكرة المحاضر |
    | `plugin-sdk/sqlite-runtime` | مساعدات محددة لمخطط وكيل SQLite والمسار والمعاملات لتشغيل الطرف الأول |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة وOAuth |
    | `plugin-sdk/plugin-state-runtime` | أنواع حالة SQLite المفهرسة المرافقة والمملوكة لـ Plugin، إضافة إلى إعداد مركزي لـ pragma الاتصال وصيانة WAL لقواعد البيانات المملوكة لـ Plugin |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وافتراضيات حالة التشغيل، ومساعدات البيانات الوصفية للمشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع المعرّفات النصية والسلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر بمؤقت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات معاملات مشتركة للأدوات وCLI |
    | `plugin-sdk/tool-plugin` | تعريف Plugin أداة وكيل بسيطة ومكتوبة الأنواع، وكشف بيانات وصفية ثابتة لتوليد البيان |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
    | `plugin-sdk/sandbox` | أنواع الواجهة الخلفية للمعزل ومساعدات أوامر SSH/OpenShell، بما في ذلك فحص مسبق لأمر التنفيذ يفشل سريعًا |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مساعدات مسجّل الأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعدادات مزوّد المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/json-unsafe-integers` | مساعدات تحليل JSON التي تحفظ القيم الحرفية للأعداد الصحيحة غير الآمنة كسلاسل |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات تشغيل/جلسة ACP وإرسال الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل الواجهة الخلفية لـ ACP وإرسال الردود لـ plugins المحمّلة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل روابط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات محددة لمخطط إعدادات تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معاملات منطقية مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورموز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مشتركة لمساعدات القنوات السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات رد الأمر/المزوّد `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل الأوامر الأصلية وبنائها وتسلسلها |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق لحزم اختبار الوكلاء منخفضة المستوى: أنواع الحزم، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة التشغيل، وتصنيف النتيجة الطرفية، ومساعدات تنسيق/تفصيل تقدم الأدوات، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة يملكها مزوّد Z.AI لاكتشاف نقطة النهاية؛ استخدم API العام لـ Plugin الخاص بـ Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة تشغيل صغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياس نشاط القناة عن بعد |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ عمليات التسليم الصادرة المعلّقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات تنبيه Heartbeat والحدث والرؤية |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي |
    | `plugin-sdk/secure-random-runtime` | مساعدات رموز/UUID آمنة |
    | `plugin-sdk/system-event-runtime` | مساعدات قائمة انتظار أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/exec-approvals-runtime` | مساعدات ملفات سياسة موافقات التنفيذ من دون حزمة infra-runtime الواسعة |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم المسارات الفرعية المحددة للتشغيل أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات ذاكرة تخزين مؤقت صغيرة ومحدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علم التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء والتنسيق والتصنيف المشترك للأخطاء، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch مغلّفة، ووكيل، وخيار EnvHttpProxyAgent، وبحث مثبت |
    | `plugin-sdk/runtime-fetch` | fetch تشغيل واعٍ بالموزّع من دون استيرادات الوكيل أو fetch المحروس |
    | `plugin-sdk/inline-image-data-url-runtime` | مساعدات تنقية عنوان URL لبيانات الصور المضمنة واستشعار التوقيع من دون سطح تشغيل الوسائط الواسع |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون سطح تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المهيأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات من دون استيرادات واسعة لكتابة الإعدادات أو الصيانة |
    | `plugin-sdk/sqlite-runtime` | مساعدات محددة لمخطط وكيل SQLite والمسار والمعاملات من دون عناصر التحكم في دورة حياة قاعدة البيانات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق التكميلي من دون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة لتحويل وتطبيع السجلات/السلاسل البدائية من دون استيرادات Markdown أو التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل وهويته ومساحة عمله، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدليل المدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، بما في ذلك `saveRemoteMedia` و`saveResponseMedia` و`readRemoteMediaBuffer` و`fetchRemoteMedia` المهملة؛ فضّل مساعدات التخزين قبل قراءات المخزن المؤقت عندما ينبغي أن يصبح عنوان URL وسائط OpenClaw |
    | `plugin-sdk/media-mime` | تطبيع MIME ضيق النطاق، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة النطاق لمخزن الوسائط مثل `saveMediaBuffer` و`saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتجاوز فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزود فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت/الاستخراج المنظم الموجهة إلى المزودين |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/عرض النص وMarkdown، وتحويل جداول Markdown، وإزالة وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع مزود الكلام بالإضافة إلى تصديرات التوجيه، والسجل، والتحقق، وباني TTS المتوافق مع OpenAI، ومساعدات الكلام الموجهة إلى المزودين |
    | `plugin-sdk/speech-core` | أنواع مزود الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وتصديرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزود النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-bootstrap-context` | مساعد تمهيد ملف التعريف الفوري لحقن سياق `IDENTITY.md` و`USER.md` و`SOUL.md` محدود النطاق |
    | `plugin-sdk/realtime-voice` | أنواع مزود الصوت الفوري، ومساعدات السجل، ومساعدات سلوك الصوت الفوري المشتركة، بما في ذلك تتبع نشاط الإخراج |
    | `plugin-sdk/image-generation` | أنواع مزود توليد الصور بالإضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني مزود الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات تجاوز الفشل، والبحث عن المزودين، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات تجاوز الفشل، والبحث عن المزودين، وتحليل مرجع النموذج |
    | `plugin-sdk/transcripts` | أنواع مزود مصدر النصوص المشتركة، ومساعدات السجل، وواصفات الجلسات، وبيانات التعريف الخاصة بالأقوال |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير مهملة للتوافق؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | برميل توافق مهمل محلي للمستودع لاختبارات OpenClaw القديمة. ينبغي أن تستورد اختبارات المستودع الجديدة مسارات فرعية محلية مركزة للاختبار مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` محدود محلي للمستودع لاختبارات وحدة تسجيل Plugin مباشرة بدون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقد محول وقت تشغيل الوكيل الأصلي المحلية للمستودع لاختبارات المصادقة، والتسليم، والتراجع، وخطاف الأداة، وتراكب المطالبة، والمخطط، وإسقاط النصوص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار محلية للمستودع موجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء تشغيل الحساب، وتسلسل إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | مجموعة مشتركة محلية للمستودع لحالات خطأ حل الهدف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود محلية للمستودع لحزمة Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة برمجة تطبيقات وقت التشغيل، والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود محلية للمستودع لوقت تشغيل المزود، والمصادقة، والاكتشاف، والإعداد، والكتالوج، والمعالج، وقدرات الوسائط، وسياسة إعادة التشغيل، وSTT للصوت الحي الفوري، وبحث/جلب الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات Vitest اختيارية محلية للمستودع لـ HTTP/المصادقة لاختبارات المزود التي تمرن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات محلية عامة للمستودع لالتقاط وقت تشغيل CLI، وسياق صندوق الاختبار، وكاتب Skills، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمن، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات ذات الأنواع |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة محلية للمستودع لمكونات Node المدمجة للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-embedding-registry` | مساعدات خفيفة لسجل مزودي تضمين الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والمزود المحلي، ومساعدات الدفعات/البعيدة العامة. `registerMemoryEmbeddingProvider` على هذا السطح مهمل؛ استخدم واجهة API العامة لمزود التضمين للمزودين الجدد. |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت تشغيل نواة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للمورد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للمورد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة المشتركة للـ Plugin المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    مسارات SDK الفرعية المحجوزة للمساعدات المضمنة هي أسطح ضيقة مخصصة للمالك في
    كود Plugin المضمن. يجري تتبعها في مخزون SDK كي تظل عمليات بناء
    الحزم والأسماء المستعارة حتمية، لكنها ليست واجهات API عامة
    لتأليف Plugin. ينبغي أن تستخدم عقود المضيف الجديدة القابلة لإعادة الاستخدام مسارات SDK الفرعية العامة
    مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime`.

    | المسار الفرعي | المالك والغرض |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | مساعد Plugin Codex المضمن لإسقاط إعداد خادم MCP الخاص بالمستخدم في إعداد سلسلة app-server الخاصة بـ Codex |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Plugin Codex المضمن لعكس الوكلاء الفرعيين الأصليين لـ app-server الخاص بـ Codex إلى حالة مهمة OpenClaw |

  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugin](/ar/plugins/building-plugins)
