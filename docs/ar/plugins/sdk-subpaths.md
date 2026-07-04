---
read_when:
    - اختيار المسار الفرعي الصحيح لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـPlugin المضمّنة وواجهات المساعدين
summary: 'كتالوج المسارات الفرعية لـ Plugin SDK: أي عمليات الاستيراد توجد في أي مكان، مجمّعة حسب المجال'
title: المسارات الفرعية لـ SDK الخاص بـ Plugin
x-i18n:
    generated_at: "2026-07-04T10:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض SDK الخاصة بالـ Plugin كمجموعة من المسارات الفرعية العامة المحدودة تحت
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمعةً حسب
الغرض. يوجد مخزون نقطة دخول المترجم المولَّد في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتمثل صادرات الحزمة المجموعة العامة الفرعية
بعد طرح مسارات الاختبار/الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يمكن للمشرفين تدقيق
عدد الصادرات العامة باستخدام `pnpm plugin-sdk:surface` ومسارات فرعية مساعدة محجوزة
نشطة باستخدام `pnpm plugins:boundary-report:summary`؛ وتؤدي الصادرات المساعدة
المحجوزة غير المستخدمة إلى فشل تقرير CI بدلاً من بقائها في SDK العامة كدين توافق
خامل.

لدليل تأليف الـ Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## إدخال Plugin

| المسار الفرعي                 | الصادرات الرئيسية                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر مزود الترحيل مثل `createMigrationItem`، وثوابت السبب، وعلامات حالة العنصر، ومساعدات التنقيح، و`summarizeMigrationItems`                                |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`resolvePlannedMigrationTargets`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                 |
| `plugin-sdk/health`            | تسجيل فحوصات صحة Doctor، والكشف، والإصلاح، والاختيار، والخطورة، وأنواع النتائج لمستهلكي الصحة المضمنين                                                                 |

### مساعدات التوافق والاختبار المهملة

تبقى المسارات الفرعية المهملة مصدَّرة للـ plugins الأقدم، لكن يجب أن تستخدم الشيفرة
الجديدة مسارات SDK الفرعية المركزة أدناه. القائمة المُصانة هي
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ وترفض CI استيرادات
الإنتاج المضمنة منها. البراميل الواسعة مثل `compat` و`config-types` و
`infra-runtime` و`text-runtime` و`zod` مخصصة للتوافق فقط. استورد `zod`
مباشرةً من `zod`.

مسارات مساعدات الاختبار المدعومة بـ Vitest في OpenClaw محلية للمستودع فقط ولم تعد
صادرات حزمة: `agent-runtime-test-contracts`،
`channel-contract-testing`، و`channel-target-testing`، و`channel-test-helpers`،
و`plugin-test-api`، و`plugin-test-contracts`، و`plugin-test-runtime`،
و`provider-http-test-mocks`، و`provider-test-contracts`، و`test-env`،
و`test-fixtures`، و`test-node-mocks`، و`testing`.

### مسارات فرعية مساعدة محجوزة للـ Plugin المضمن

هذه المسارات الفرعية هي أسطح توافق مملوكة للـ Plugin الخاص بها ضمن الـ Plugin
المضمن المالك، وليست APIs عامة للـ SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. تُحظر استيرادات الامتدادات العابرة للمالكين
بواسطة حواجز عقد الحزمة.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد تحقق JSON Schema مخزن مؤقتا للمخططات المملوكة للإضافات |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، إضافة إلى `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومترجم الإعداد، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات الحسابات المتعددة، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقوائم الحسابات/إجراءات الحساب |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة سماح مجموعات الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط إعدادات القنوات المشتركة، إضافة إلى Zod وبناة JSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات قنوات OpenClaw المضمنة للإضافات المضمنة التي تتم صيانتها فقط |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. معرفات قنوات الدردشة المضمنة/الرسمية القياسية، إضافة إلى تسميات/أسماء بديلة للمنسق للإضافات التي تحتاج إلى التعرف على النص مسبوق الظرف دون ترميز جدولها الخاص صراحة. |
    | `plugin-sdk/channel-config-schema-legacy` | اسم توافق بديل مهمل لمخططات إعدادات القنوات المضمنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع رجوع إلى عقد مضمن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة لدخول القنوات منخفض المستوى. يجب أن تستخدم مسارات الاستقبال الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل وقت تشغيل تجريبي عالي المستوى لدخول القنوات وبناة حقائق المسارات لمسارات استقبال القنوات المرحلة. فضل هذا على تجميع قوائم السماح الفعالة، وقوائم سماح الأوامر، والإسقاطات القديمة في كل إضافة. راجع [واجهة API لدخول القنوات](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | عقود دورة حياة الرسائل إضافة إلى خيارات خط الرد، والإيصالات، والمعاينة/البث المباشر، ومساعدات دورة الحياة، وهوية الصادر، وتخطيط الحمولة، والإرسال الدائم، ومساعدات سياق إرسال الرسائل. راجع [واجهة API للصادر من القنوات](/ar/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | اسم توافق بديل مهمل لـ `plugin-sdk/channel-outbound` إضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/channel-message-runtime` | اسم توافق بديل مهمل لـ `plugin-sdk/channel-outbound` إضافة إلى واجهات إرسال الردود القديمة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + الظرف |
    | `plugin-sdk/inbound-reply-dispatch` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-inbound` لمشغلات الوارد ومحددات الإرسال، و`plugin-sdk/channel-outbound` لمساعدات تسليم الرسائل. |
    | `plugin-sdk/messaging-targets` | اسم بديل مهمل لتحليل الأهداف؛ استخدم `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة وحالة الوسائط المستضافة |
    | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط الخيوط والمحول |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة/ملخص حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعدادات القنوات |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القنوات |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيد مشتركة لإضافات القنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تحرير/قراءة إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار وصول المجموعات |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | مساعدات ضيقة لسياسة الحراسة قبل التشفير للرسائل المباشرة |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للحزمة المنشورة `@openclaw/discord@2026.3.13` وتوافق المالك المتتبع؛ يجب أن تستخدم الإضافات الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram لتوافق المالك المتتبع؛ يجب أن تستخدم الإضافات الجديدة مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق مهملة لـ Zalo Personal لحزم Lark/Zalo المنشورة التي لا تزال تستورد تفويض أوامر المرسل؛ يجب أن تستخدم الإضافات الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | عرض الرسائل الدلالي، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | مساعدات واردة مشتركة لتصنيف الأحداث، وبناء السياق، والتنسيق، والجذور، وإزالة الارتداد، ومطابقة الإشارات، وسياسة الإشارة، وتسجيل الوارد |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة ارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة، وعلامة الإشارة، ونص الإشارة دون سطح وقت تشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound` أو `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القنوات، إضافة إلى مساعدات المخطط الأصلي المهملة المحفوظة لتوافق الإضافات |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسارات، وحل الأهداف المدفوع بالمحلل، وتحويل معرف الخيط إلى سلسلة، وإزالة التكرار/ضغط مفاتيح المسارات، وأنواع الأهداف المحللة، ومقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقود القنوات |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

تظل عائلات مساعدات القنوات المهملة متاحة فقط لتوافق الإضافات
المنشورة. خطة الإزالة هي: إبقاؤها خلال نافذة ترحيل الإضافات الخارجية،
وإبقاء إضافات المستودع/المضمنة على `channel-inbound` و
`channel-outbound`، ثم إزالة المسارات الفرعية التوافقية في التنظيف الرئيسي التالي
لـ SDK. ينطبق هذا على عائلات رسائل/وقت تشغيل القنوات القديمة، وبث القنوات،
ووصول الرسائل المباشرة، وتفرعات مساعدات الوارد، وخيارات الرد،
ومسارات الاقتران.

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة مزوّد LM Studio المدعومة للإعداد واكتشاف الفهرس وتحضير نماذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لإعدادات الخادم المحلي الافتراضية واكتشاف النماذج وترويسات الطلبات ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد مزوّد محلي/مستضاف ذاتياً منتقاة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد مزوّد مستضاف ذاتياً متوافق مع OpenAI |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API في وقت التشغيل لمكوّنات Plugin الخاصة بالمزوّدين |
    | `plugin-sdk/provider-oauth-runtime` | أنواع عامة لاستدعاءات OAuth الراجعة للمزوّد، وتصوير صفحة الاستدعاء الراجع، ومساعدات PKCE/الحالة، وتحليل مدخلات التفويض، ومساعدات انتهاء صلاحية الرموز، ومساعدات الإيقاف |
    | `plugin-sdk/provider-auth-api-key` | مساعدات التهيئة وكتابة الملفات الشخصية لمفاتيح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ قياسي لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, مساعدات استيراد مصادقة OpenAI Codex، وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, منشئو سياسات إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات مشتركة لتطبيع معرّفات النماذج |
    | `plugin-sdk/provider-catalog-live-runtime` | مساعدات فهرس نماذج المزوّد الحي للاكتشاف المحروس بنمط `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, ترشيح معرّفات النماذج، ذاكرة TTL المؤقتة، والاحتياطي الثابت |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت التشغيل لتعزيز فهرس المزوّد ودرزات سجل مزوّدي Plugin لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقطة النهاية الخاصة بالمزوّد، وأخطاء HTTP الخاصة بالمزوّد، ومساعدات نماذج multipart لتفريغ الصوت نصياً |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لإعداد/اختيار جلب الويب مثل `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل مزوّد جلب الويب/ذاكرته المؤقتة |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/اعتماد بحث الويب للمزوّدين الذين لا يحتاجون إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد ضيقة لإعداد/اعتماد بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ومحدّدات/جالبات الاعتمادات محددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل مزوّد بحث الويب/ذاكرته المؤقتة/وقت تشغيله |
    | `plugin-sdk/embedding-providers` | أنواع عامة لمزوّدي التضمين ومساعدات قراءة، بما في ذلك `EmbeddingProviderAdapter`, و `getEmbeddingProvider(...)`, و `listEmbeddingProviders(...)`؛ تسجّل مكوّنات Plugin المزوّدين عبر `api.registerEmbeddingProvider(...)` بحيث تُفرض ملكية البيان |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
    | `plugin-sdk/provider-usage` | أنواع لقطات استخدام المزوّد، ومساعدات جلب استخدام مشتركة، وجالبات مزوّد مثل `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع أغلفة التدفق، توافق استدعاءات الأدوات بنص عادي، ومساعدات أغلفة مشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | مساعدات عامة مشتركة لأغلفة تدفق المزوّد، بما في ذلك `composeProviderStreamWrappers`, و `createOpenAICompatibleCompletionsThinkingOffWrapper`, و `createPlainTextToolCallCompatWrapper`, و `createPayloadPatchStreamWrapper`, و `createToolStreamWrapper`, و `normalizeOpenAICompatibleReasoningPayload`, و `setQwenChatTemplateThinking`, وأدوات تدفق متوافقة مع Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع إعداد التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

تبلّغ لقطات استخدام المزوّد عادةً عن نافذة حصة واحدة أو أكثر ضمن `windows`، لكل منها
تسمية ونسبة مئوية مستخدمة ووقت إعادة تعيين اختياري. يجب على المزوّدين الذين يعرضون نصاً عن الرصيد أو
حالة الحساب بدلاً من نوافذ حصص قابلة لإعادة التعيين أن يعيدوا
`summary` مع مصفوفة `windows` فارغة بدلاً من اختلاق نسب مئوية.
يعرض OpenClaw نص الملخص هذا في خرج الحالة؛ استخدم `error` فقط عندما
تفشل نقطة نهاية الاستخدام أو لا تعيد أي بيانات استخدام قابلة للاستعمال.

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، مساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | منشئو رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حلّ المعتمد ومصادقة الإجراءات داخل المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات/مرشحات موافقة التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات قدرة/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّل الموافقة الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل درزات المحوّل/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي، وربط الحساب، وبوابة المسار، واحتياطي التمرير، وكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعل موافقة مضمنة، وحمولات مطالبة التفاعل، ومخازن هدف التفاعل، ومساعدات نص تلميح التفاعل، وتصدير توافق لكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولات رد موافقة التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولات موافقة التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المنظمة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة ضبط إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة من دون البرميل الاختباري الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات خفيفة لنصوص الأوامر لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | تطبيع جسم الأمر ومساعدات سطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | مساعدات كسولة لتدفق تسجيل دخول مصادقة المزوّد لإقران قناة خاصة وWeb UI برمز الجهاز |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/secret-provider-integration` | بيان تكامل مزوّد SecretRef للعناوين فقط وعقود الإعدادات المسبقة لمكوّنات Plugin التي تنشر إعدادات مسبقة خارجية لمزوّدي الأسرار |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابات الرسائل المباشرة، ومساعدات الملفات/المسارات المحدودة بالجذر بما في ذلك الكتابات للإنشاء فقط، والاستبدال الذري المتزامن/غير المتزامن للملفات، وكتابات مؤقتة شقيقة، واحتياطي النقل عبر الأجهزة، ومساعدات مخزن الملفات الخاص، وحراس الآباء للروابط الرمزية، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للموزّع المثبّت من دون سطح وقت التشغيل البنيوي الواسع |
    | `plugin-sdk/ssrf-runtime` | الموزّع المثبّت، والجلب المحروس من SSRF، وخطأ SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/الجسم الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة وقت التشغيل والمسجل والمهلة وإعادة المحاولة والتراجع التدريجي |
    | `plugin-sdk/browser-config` | واجهة تهيئة متصفح مدعومة للملف الشخصي/القيم الافتراضية المطبعة، وتحليل عنوان URL لـ CDP، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/agent-harness-task-runtime` | مساعدات عامة لدورة حياة المهمة وتسليم الإكمال للوكلاء المدعومين بحزام اختبار الذين يستخدمون نطاق مهمة صادرًا من المضيف |
    | `plugin-sdk/codex-mcp-projection` | مساعد Codex محزم محجوز لإسقاط تهيئة خادم MCP الخاصة بالمستخدم في تهيئة سلسلة Codex؛ ليس لملحقات الطرف الثالث |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Codex محزم خاص لتوصيل مرآة المهمة الأصلية/وقت التشغيل؛ ليس لملحقات الطرف الثالث |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القنوات والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الطرف الثالث الأقدم؛ يجب أن تستورد الملحقات الجديدة `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الطرف الثالث الأقدم؛ يجب أن تستورد الملحقات الجديدة المسارات الفرعية العامة لـ SDK مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر Plugin والخطافات وHTTP والتفاعل |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار واستدعاء الوسيطات ومجموعات الأوامر الكسولة |
    | `plugin-sdk/qa-live-transport-scenarios` | معرفات سيناريوهات ضمان جودة النقل المباشر المشتركة، ومساعدات تغطية خط الأساس، ومساعد اختيار السيناريو |
    | `plugin-sdk/gateway-method-runtime` | مساعد محجوز لتوجيه طرق Gateway لطرق HTTP الخاصة بـ Plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء عميل جاهز لحلقة الأحداث، وRPC لـ CLI مع Gateway، وأخطاء بروتوكول Gateway، وحل مضيف LAN المعلن، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح تهيئة مركز للأنواع فقط لأشكال تهيئة Plugin مثل `OpenClawConfig` وأنواع تهيئة القنوات/المزودين |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن تهيئة Plugin في وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل التهيئة المعاملاتية مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | سلاسل تلميحات بيانات التعريف المشتركة لتسليم أدوات الرسائل |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة تهيئة العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أمر Telegram وفحوصات التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المحزم غير متاح |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات دون حزمة النص الواسعة |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات ردود اعتماد ثابتة، وحمولات مطالبة الردود، ومخازن أهداف الردود، ومساعدات نص تلميحات الردود، وتصدير توافق لتعطيل مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-runtime` | مساعدات اعتماد التنفيذ/Plugin، وبناة قدرات الاعتماد، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الاعتماد المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقسيم إلى مقاطع، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال/إنهاء الرد وتسميات المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لتاريخ الردود ضمن نافذة قصيرة. يجب أن تستخدم شيفرة دورة الرسائل الجديدة `createChannelHistoryWindow`؛ وتبقى مساعدات الخرائط منخفضة المستوى تصديرات توافق مهملة فقط |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتقسيم النص/Markdown إلى مقاطع |
    | `plugin-sdk/session-store-runtime` | مساعدات سير عمل الجلسة (`getSessionEntry` و`listSessionEntries` و`patchSessionEntry` و`upsertSessionEntry`) وقراءات نص نسخ حديثة ومحدودة للمستخدم/المساعد حسب هوية الجلسة، ومساعدات مسار مخزن الجلسات القديم/مفتاح الجلسة، وقراءات وقت التحديث، ومساعدات توافق مؤقتة على مستوى المخزن الكامل/مسار الملف |
    | `plugin-sdk/session-transcript-runtime` | هوية النسخة النصية، ومساعدات الهدف/القراءة/الكتابة ذات النطاق، ونشر التحديثات، وأقفال الكتابة، ومفاتيح إصابات ذاكرة النسخة النصية |
    | `plugin-sdk/sqlite-runtime` | مساعدات مركزة لمخطط وكيل SQLite والمسار والمعاملات لوقت تشغيل الطرف الأول |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسار دليل الحالة/OAuth |
    | `plugin-sdk/plugin-state-runtime` | أنواع حالة SQLite الجانبية ذات المفاتيح الخاصة بـ Plugin، بالإضافة إلى إعداد مركزي لصيانة براغما الاتصال وWAL لقواعد البيانات المملوكة لـ Plugin |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وقيم حالة وقت التشغيل الافتراضية، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع المعرفات النصية/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر مؤقت بنتائج stdout/stderr مطبعة |
    | `plugin-sdk/param-readers` | قارئات مشتركة لمعاملات الأدوات/CLI |
    | `plugin-sdk/tool-plugin` | تعريف Plugin أداة وكيل بسيطة ذات أنواع وكشف بيانات تعريف ثابتة لتوليد البيان |
    | `plugin-sdk/tool-payload` | استخراج حمولات مطبعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسيطات الأدوات |
    | `plugin-sdk/sandbox` | أنواع خلفية sandbox ومساعدات أوامر SSH/OpenShell، بما في ذلك فحص تمهيدي سريع الفشل لأمر التنفيذ |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل تهيئة مزود المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/json-unsafe-integers` | مساعدات تحليل JSON التي تحفظ القيم الحرفية للأعداد الصحيحة غير الآمنة كسلاسل |
    | `plugin-sdk/file-lock` | مساعدات أقفال ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل خلفية ACP وإرسال الردود للملحقات المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ارتباط ACP للقراءة فقط دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | أساسيات محددة لمخطط تهيئة وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | أساسيات مشتركة لمساعدات القنوات السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات ردود أوامر/مزودي `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق لأحزمة الوكلاء منخفضة المستوى: أنواع الحزام، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة وقت التشغيل، وتصنيف نتيجة الطرفية، ومساعدات تنسيق/تفاصيل تقدم الأدوات، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة يملكها مزود Z.AI لاكتشاف نقطة النهاية؛ استخدم واجهة API العامة لملحق Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة وقت تشغيل صغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياسات نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار داخل الذاكرة ومدعومة بمخزن دائم |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات إيقاظ Heartbeat والأحداث والرؤية |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي قسري |
    | `plugin-sdk/secure-random-runtime` | مساعدات رموز/UUID آمنة |
    | `plugin-sdk/system-event-runtime` | مساعدات قائمة انتظار أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/exec-approvals-runtime` | مساعدات ملفات سياسة اعتماد التنفيذ دون حزمة infra-runtime الواسعة |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات وقت التشغيل الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات أعلام التشخيص والأحداث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء والتنسيق وتصنيف الأخطاء المشتركة، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch مغلفة، والوكيل، وخيار EnvHttpProxyAgent، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك للموزع دون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | مساعدات تنظيف عنوان URL لبيانات الصور المضمنة واستكشاف التواقيع دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ارتباط المحادثة الحالية دون توجيه الارتباط المهيأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات دون استيرادات كتابة/صيانة التهيئة الواسعة |
    | `plugin-sdk/sqlite-runtime` | مساعدات مركزة لمخطط وكيل SQLite والمسار والمعاملات دون عناصر التحكم في دورة حياة قاعدة البيانات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وترشيح السياق التكميلي دون استيرادات التهيئة/الأمان الواسعة |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة لإكراه وتطبيع السجلات/السلاسل البدائية دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات تهيئة إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/الهوية/مساحة العمل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار دليل مدعوم بالتهيئة |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، بما في ذلك `saveRemoteMedia` و`saveResponseMedia` و`readRemoteMediaBuffer` و`fetchRemoteMedia` المهملة؛ فضّل مساعدات التخزين قبل قراءات المخزن المؤقت عندما ينبغي أن يصبح URL وسائط OpenClaw |
    | `plugin-sdk/media-mime` | تطبيع MIME محدود، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات محدودة لمخزن الوسائط مثل `saveMediaBuffer` و`saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتجاوز فشل توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط، إضافة إلى صادرات مساعدات الصور/الصوت/الاستخراج المنظم الموجهة للموفرين |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/عرض النص وMarkdown، وتحويل جداول Markdown، وإزالة وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام، إضافة إلى صادرات التوجيه، والسجل، والتحقق، ومنشئ TTS المتوافق مع OpenAI، ومساعدات الكلام الموجهة للموفرين |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-bootstrap-context` | مساعد تهيئة الملف الشخصي الفوري لحقن سياق محدود من `IDENTITY.md` و`USER.md` و`SOUL.md` |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت الفوري، ومساعدات السجل، ومساعدات سلوك الصوت الفوري المشتركة، بما في ذلك تتبع نشاط الإخراج |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور، إضافة إلى مساعدات أصول الصور/عناوين URL للبيانات ومنشئ موفر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفري/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات تجاوز الفشل، والبحث عن الموفرين، وتحليل مراجع النماذج |
    | `plugin-sdk/video-generation` | أنواع موفري/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات تجاوز الفشل، والبحث عن الموفرين، وتحليل مراجع النماذج |
    | `plugin-sdk/transcripts` | أنواع موفري مصادر النصوص المشتركة، ومساعدات السجل، وواصفات الجلسات، وبيانات تعريف النطق |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير توافق مهملة؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | ملف تجميعي مهمل للتوافق داخل المستودع لاختبارات OpenClaw القديمة. ينبغي أن تستورد اختبارات المستودع الجديدة مسارات اختبار محلية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` محدود داخل المستودع لاختبارات وحدة تسجيل Plugin المباشر من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود مهايئ تشغيل الوكيل الأصلي داخل المستودع لاختبارات المصادقة، والتسليم، والرجوع الاحتياطي، وخطافات الأدوات، وتراكب الموجه، والمخطط، وإسقاط النصوص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجهة للقنوات داخل المستودع لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الأدلة، ودورة حياة بدء الحساب، وربط إعداد الإرسال بالخيوط، ومحاكاة التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | حزمة مشتركة داخل المستودع لحالات أخطاء حل الأهداف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود حزمة Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة API للتشغيل، والآثار الجانبية للاستيراد داخل المستودع |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود تشغيل الموفر، والمصادقة، والاكتشاف، والتوجيه الأولي، والفهرس، والمعالج، وقدرة الوسائط، وسياسة إعادة التشغيل، وصوت STT الفوري المباشر، والبحث/الجلب عبر الويب، والبث داخل المستودع |
    | `plugin-sdk/provider-http-test-mocks` | محاكاة HTTP/المصادقة اختيارية داخل المستودع عبر Vitest لاختبارات الموفرين التي تمرّن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة داخل المستودع لالتقاط تشغيل CLI، وسياق الصندوق الرملي، وكاتب Skills، ورسائل الوكيل، وأحداث النظام، وإعادة تحميل الوحدات، ومسار Plugin المضمن، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات المكتوبة |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة لمكونات Node المدمجة داخل المستودع للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-embedding-registry` | مساعدات خفيفة لسجل موفري تضمين الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، ووصول السجل، والموفر المحلي، ومساعدات الدفعات/البعيدة العامة. `registerMemoryEmbeddingProvider` على هذا السطح مهمل؛ استخدم واجهة API العامة لموفر التضمين للموفرين الجدد. |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات تشغيل نواة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للبائع لمساعدات تشغيل نواة مضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للبائع لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown مُدارة مشتركة للـ Plugins القريبة من الذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة تشغيل الذاكرة النشطة للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    المسارات الفرعية المحجوزة للمساعدات المضمنة في SDK هي أسطح ضيقة خاصة بالمالكين
    لكود Plugin المضمن. يجري تتبعها في جرد SDK حتى تبقى عمليات بناء الحزم
    والأسماء البديلة حتمية، لكنها ليست واجهات API عامة لتأليف Plugins.
    ينبغي أن تستخدم عقود المضيف الجديدة القابلة لإعادة الاستخدام مسارات فرعية عامة في SDK
    مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime`.

    | المسار الفرعي | المالك والغرض |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | مساعد Plugin Codex المضمن لإسقاط إعدادات خادم MCP الخاصة بالمستخدم في إعدادات خيط خادم تطبيق Codex |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Plugin Codex المضمن لعكس الوكلاء الفرعيين الأصليين في خادم تطبيق Codex إلى حالة مهام OpenClaw |

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
