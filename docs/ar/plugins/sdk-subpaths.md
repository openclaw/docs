---
read_when:
    - اختيار المسار الفرعي الصحيح لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمَّنة وواجهات المساعدات
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أين توجد عمليات الاستيراد، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-05-02T21:01:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  تُعرض SDK الخاصة بـ Plugin كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تفهرس هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمعة حسب الغرض. توجد القائمة الكاملة
  المولدة لأكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  وتظهر هناك المسارات الفرعية المساعدة المحجوزة للـ Plugin المضمنة، لكنها تفاصيل
  تنفيذية ما لم تروّج لها صفحة توثيق صراحة. يمكن للمشرفين تدقيق المسارات الفرعية
  المساعدة المحجوزة النشطة باستخدام `pnpm plugins:boundary-report:summary`؛ إذ تفشل
  التصديرات المساعدة المحجوزة غير المستخدمة في تقرير CI بدلا من أن تبقى في SDK العامة
  كدين توافقية خاملة.

  للاطلاع على دليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## مدخل Plugin

  | المسار الفرعي                            | التصديرات الأساسية                                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                                            |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`                         |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                                               |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                                              |
  | `plugin-sdk/testing`                      | تجميعة توافق واسعة لاختبارات Plugin القديمة؛ فضّل المسارات الفرعية المركزة للاختبارات في اختبارات الإضافات الجديدة                                                                           |
  | `plugin-sdk/plugin-test-api`              | باني محاكاة `OpenClawPluginApi` بسيط لاختبارات وحدة تسجيل Plugin المباشرة                                                                                                                     |
  | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول وقت تشغيل الوكيل الأصلي لملفات تعريف المصادقة، وكبت التسليم، وتصنيف الرجوع، وخطافات الأدوات، وطبقات المطالبات، والمخططات، وإصلاح النصوص                                   |
  | `plugin-sdk/channel-test-helpers`         | مساعدات اختبار دورة حياة حساب القناة، والدليل، وإعدادات الإرسال، ومحاكاة وقت التشغيل، والخطاف، ومدخل القناة المضمنة، وطابع وقت المغلف، ورد الاقتران، وعقد القناة العام                      |
  | `plugin-sdk/channel-target-testing`       | حزمة اختبارات مشتركة لحالات أخطاء حل أهداف القنوات                                                                                                                                             |
  | `plugin-sdk/plugin-test-contracts`        | مساعدات عقود تسجيل Plugin، وبيان الحزمة، والأثر العام، وواجهة API وقت التشغيل، والأثر الجانبي للاستيراد، والاستيراد المباشر                                                                  |
  | `plugin-sdk/plugin-test-runtime`          | تجهيزات وقت تشغيل Plugin، والسجل، وتسجيل المزوّدين، ومعالج الإعداد، وتدفق مهام وقت التشغيل للاختبارات                                                                                         |
  | `plugin-sdk/provider-test-contracts`      | مساعدات عقود وقت تشغيل المزوّد، والمصادقة، والاكتشاف، والإلحاق، والفهرس، وإمكانات الوسائط، وسياسة إعادة التشغيل، وSTT الصوت المباشر في الزمن الحقيقي، والبحث/الجلب على الويب، والمعالج       |
  | `plugin-sdk/provider-http-test-mocks`     | محاكيات Vitest اختيارية لـ HTTP/المصادقة لاختبارات المزوّد التي تشغّل `plugin-sdk/provider-http`                                                                                              |
  | `plugin-sdk/test-env`                     | تجهيزات بيئة الاختبار، والجلب/الشبكة، وخادم HTTP القابل للتخلص، والطلب الوارد، والاختبار الحي، ونظام الملفات المؤقت، والتحكم بالوقت                                                          |
  | `plugin-sdk/test-fixtures`                | تجهيزات اختبار عامة لـ CLI، وصندوق الحماية، والمهارة، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمنة، والطرفية، والتقسيم إلى أجزاء، ورمز المصادقة، والحالات المطبوعة |
  | `plugin-sdk/test-node-mocks`              | مساعدات محاكاة مركزة لمكونات Node المدمجة للاستخدام داخل مصانع Vitest `vi.mock("node:*")`                                                                                                     |
  | `plugin-sdk/migration`                    | مساعدات عناصر مزوّد الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                                                     |
  | `plugin-sdk/migration-runtime`            | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                                            |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، إضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات الحسابات المتعددة وبوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب والرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات وإجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مشتركة لمخطط إعدادات القناة إضافة إلى بناة Zod وJSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات قنوات OpenClaw المضمنة للـ Plugin المضمنة والمحافظة عليها فقط |
    | `plugin-sdk/channel-config-schema-legacy` | اسم توافق بديل مهمل لمخططات إعدادات القنوات المضمنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع رجوع عقد مضمن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، ومساعدات دورة حياة/إنهاء تدفق المسودات |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد والمغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة للتسجيل والتوزيع الوارد |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل الأهداف ومطابقتها |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف عن تبعيات الإرسال الصادر لمحولات القنوات |
    | `plugin-sdk/outbound-runtime` | مساعدات التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط السلاسل والمحولات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط السلاسل، والاقتران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيدية مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تحرير إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حراسة DM المباشر |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للحزمة المنشورة `@openclaw/discord@2026.3.13` وتوافق المالك المتتبع؛ ينبغي للـ Plugin الجديدة استخدام المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram من أجل توافق المالك المتتبع؛ ينبغي للـ Plugin الجديدة استخدام مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق Zalo Personal مهملة لحزم Lark/Zalo المنشورة التي لا تزال تستورد تفويض أوامر المرسل؛ ينبغي للـ Plugin الجديدة استخدام `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | مساعدات عرض الرسائل الدلالي، والتسليم، والردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | تجميعة توافق للتأخير الوارد، ومطابقة الإشارات، ومساعدات سياسة الإشارة، ومساعدات المغلف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لتأخير الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة، وعلامة الإشارة، ونص الإشارة من دون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق المغلف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة للإسقاطات الواردة وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، إضافة إلى مساعدات مخططات أصلية مهملة محفوظة لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسارات، وحل الأهداف المعتمد على المحلل، وتحويل معرف السلسلة إلى نص، وإزالة التكرار/ضغط مفاتيح المسارات، وأنواع الأهداف المحللة، ومقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ ينبغي لمستدعي مقارنة المسارات استخدام `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقود القناة |
    | `plugin-sdk/channel-feedback` | ربط الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للموفر">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة موفر LM Studio المدعومة للإعداد، واكتشاف الكتالوج، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لإعدادات الخادم المحلي الافتراضية، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحملة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد الموفر المحلي/المستضاف ذاتيا المنتقاة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد الموفر المستضاف ذاتيا والمتوافق مع OpenAI والمركزة |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API وقت التشغيل لـ plugins الموفر |
    | `plugin-sdk/provider-auth-api-key` | مساعدات التهيئة/كتابة الملف الشخصي لمفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتائج المصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ plugins الموفر |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة الموفر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, وبناة سياسة إعادة التشغيل المشتركون، ومساعدات نقطة نهاية الموفر، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت التشغيل لإثراء كتالوج الموفر وفواصل سجل plugin-الموفر لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات قدرات HTTP/نقطة النهاية العامة للموفر، وأخطاء HTTP للموفر، ومساعدات نموذج متعدد الأجزاء لتفريغ الصوت نصيا |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد تكوين/اختيار web-fetch محدودة مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لموفر web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات محدودة لتكوين/اعتماد web-search للموفرين الذين لا يحتاجون إلى توصيل تفعيل plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد تكوين/اعتماد web-search محدودة مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، ومحددات/جالبات الاعتمادات محددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لموفر web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, تنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع مغلفات البث، ومساعدات مغلفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفر الأصلية مثل الجلب المحمي، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تكوين التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache محلية العملية |
    | `plugin-sdk/group-activation` | مساعدات محدودة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تخويل المرسل |
    | `plugin-sdk/command-status` | بناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافق ومصادقة الإجراء في المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف/مرشح موافقة التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | محولات قدرة/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محول الموافقة الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ فضّل فواصل المحول/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد موافقة التنفيذ/plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقة التنفيذ/plugin، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المنظمة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات محدودة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات محدودة لاختبار عقد القناة دون البرميل الاختباري الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | محمولات نصية خفيفة للأوامر لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | تطبيع جسم الأمر ومساعدات سطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات محدودة لجمع عقد السر لأسطح أسرار القناة/plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات محدودة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد السر/التكوين |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وحجب الرسائل المباشرة، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيف وسياسة SSRF للشبكة الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات محدودة للموزع المثبت دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات الموزع المثبت، والجلب المحمي من SSRF، وخطأ SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال السر |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/الجسم الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="مسارات Runtime والتخزين الفرعية">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات Runtime/التسجيل/النسخ الاحتياطي/تثبيت Plugin الواسعة |
    | `plugin-sdk/runtime-env` | مساعدات Runtime env، والمسجل، والمهلة، وإعادة المحاولة، والتراجع الضيقة |
    | `plugin-sdk/browser-config` | واجهة إعدادات المتصفح المدعومة للملف الشخصي/الافتراضيات الموحّدة، وتحليل عناوين URL الخاصة بـ CDP، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق Runtime للقناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/http/تفاعلات Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار معالجة Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط Runtime الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات CLI للتنسيق، والانتظار، والإصدار، واستدعاء الوسيطات، ومجموعة الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء العميل الجاهز لحلقة الأحداث، وRPC الخاص بـ CLI للـ Gateway، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-types` | سطح إعدادات خاص بالأنواع فقط لأشكال إعدادات Plugin مثل `OpenClawConfig` وأنواع إعدادات القنوات/المزوّدين |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن إعدادات Plugin في Runtime مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل إعدادات تعاملية مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعدادات العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تسوية أسماء/أوصاف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المضمّن متاحًا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات من دون حزمة text-runtime الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملفات الشخصية، ومساعدات التوجيه/Runtime الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات Runtime مشتركة للوارد/الرد، والتقسيم، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد وتسميات المحادثة |
    | `plugin-sdk/reply-history` | مساعدات وعلامات سجل الردود المشتركة ذات النافذة القصيرة مثل `buildHistoryContext` و`HISTORY_CONTEXT_MARKER` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات، ومفتاح الجلسة، ووقت التحديث، وتعديل المخزن |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسارات أدلة الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وافتراضيات حالة Runtime، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تسوية slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر موقّت بنتائج stdout/stderr موحّدة |
    | `plugin-sdk/param-readers` | قارئات مشتركة لمعاملات الأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات الموحّدة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقتة |
    | `plugin-sdk/logging-core` | مساعدات مسجل الأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جداول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعدادات مزوّد Talk |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين إزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات Runtime/الجلسة وإرسال الرد لـ ACP |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل خلفية ACP وإرسال الرد للـ Plugins المحمّلة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط إعدادات Runtime للوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مشتركة لمساعدات القنوات السلبية، والحالة، والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد لأمر/مزوّد `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skill |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق لأحزمة وكلاء منخفضة المستوى: أنواع الحزمة، ومساعدات توجيه/إيقاف التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة Runtime، وتصنيف نتائج الطرفية، ومساعدات تنسيق/تفاصيل تقدم الأدوات، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة Runtime الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياسات نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين إزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ التسليمات المعلقة الصادرة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات حدث Heartbeat والرؤية |
    | `plugin-sdk/number-runtime` | مساعد تحويل قسري رقمي |
    | `plugin-sdk/secure-random-runtime` | مساعدات الرموز/UUID الآمنة |
    | `plugin-sdk/system-event-runtime` | مساعدات طابور أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات Runtime الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علامة التشخيص، والحدث، وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء، والتنسيق، وتصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch مغلف، والوكيل، وخيار EnvHttpProxyAgent، ومساعدات البحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch خاص بـ Runtime ومدرك للموزّع من دون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون سطح Runtime الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المكوّن أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات من دون استيرادات كتابة/صيانة الإعدادات الواسعة |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق التكميلي من دون استيرادات الإعدادات/الأمان الواسعة |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لتحويل وتسوية السجلات/السلاسل البدائية من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تسوية اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار دليل مدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات محددة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتبديل الاحتياطي في توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط إضافة إلى صادرات مساعدات الصور/الصوت الموجهة للموفر |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل تجريد النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقطيع النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام إضافة إلى صادرات التوجيه، والسجل، والتحقق، وباني TTS المتوافق مع OpenAI، ومساعدات الكلام الموجهة للموفر |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور إضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني موفر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، والتبديل الاحتياطي، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات التبديل الاحتياطي، والبحث عن الموفر، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع موفر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التبديل الاحتياطي، والبحث عن الموفر، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي SDK الخاص بـ Plugin |
    | `plugin-sdk/testing` | برميل توافق واسع لاختبارات Plugin القديمة. يجب أن تستورد اختبارات الامتدادات الجديدة مسارات SDK فرعية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` محدود لاختبارات الوحدة المباشرة لتسجيل Plugin دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول وقت تشغيل الوكيل الأصلية لاختبارات المصادقة، والتسليم، والاحتياطي، وخطاف الأدوات، وتراكب الموجه، والمخطط، وإسقاط النص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء الحساب، وخيوط إعداد الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | مجموعة مشتركة لحالات أخطاء حل الهدف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود حزمة Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة API لوقت التشغيل، والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود وقت تشغيل الموفر، والمصادقة، والاكتشاف، والإعداد الأولي، والفهرس، والمعالج، وقدرة الوسائط، وسياسة إعادة التشغيل، وSTT الفوري للصوت الحي، والبحث/الجلب عبر الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات Vitest اختيارية لـ HTTP/المصادقة لاختبارات الموفر التي تمرن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة لالتقاط وقت تشغيل CLI، وسياق sandbox، وكاتب skill، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمن، ونص الطرفية، والتقطيع، ورمز المصادقة، والحالات المكتوبة |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة لمكونات Node المدمجة للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمينات مضيف الذاكرة، والوصول إلى السجل، والموفر المحلي، ومساعدات الدُفعات/البعد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات سر مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملف/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للمورد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للمورد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار محايد للمورد لمساعدات ملف/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المدارة المشتركة للـ plugins القريبة من الذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار محايد للمورد لمساعدات حالة مضيف الذاكرة |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    لا توجد حاليا مسارات SDK فرعية محجوزة للمساعدات المضمنة. تعيش
    المساعدات الخاصة بالمالك داخل حزمة Plugin المالكة، بينما تستخدم عقود المضيف
    القابلة لإعادة الاستخدام مسارات SDK فرعية عامة مثل `plugin-sdk/gateway-runtime`،
    و`plugin-sdk/security-runtime`، و`plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview)
- [إعداد SDK الخاص بـ Plugin](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
