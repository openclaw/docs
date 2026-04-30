---
read_when:
    - اختيار المسار الفرعي المناسب من plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية لـ Plugin المضمّنة وواجهات المساعدة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: مواضع عمليات الاستيراد، مجمعة حسب المجال'
title: مسارات Plugin SDK الفرعية
x-i18n:
    generated_at: "2026-04-30T08:18:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  يُعرَض SDK الخاص بـ Plugin كمجموعة من المسارات الفرعية الضيقة ضمن `openclaw/plugin-sdk/`.
  تفهرس هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمّعة حسب الغرض. توجد القائمة الكاملة المُولَّدة
  لأكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  تظهر هناك المسارات الفرعية المحجوزة لمساعدي Plugin المضمّنة، لكنها تُعد تفاصيل
  تنفيذية ما لم تروّج لها صفحة توثيق صراحة. يستطيع المشرفون تدقيق المسارات الفرعية
  المحجوزة النشطة للمساعدين باستخدام `pnpm plugins:boundary-report:summary`؛ وتؤدي
  صادرات المساعدين المحجوزة غير المستخدمة إلى فشل تقرير CI بدلاً من بقائها في SDK العام
  كدَين توافق خامد.

  لدليل تأليف Plugin، راجع [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview).

  ## مدخل Plugin

  | المسار الفرعي                            | الصادرات الرئيسية                                                                                                                                                            |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | حزمة توافق واسعة لاختبارات Plugin القديمة؛ فضّل المسارات الفرعية المركزة للاختبارات في اختبارات الإضافات الجديدة                                                           |
  | `plugin-sdk/plugin-test-api`              | باني محاكاة `OpenClawPluginApi` بسيط لاختبارات وحدة التسجيل المباشر لـ Plugin                                                                                                |
  | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محوّل وقت تشغيل الوكيل الأصلي لملفات تعريف المصادقة، وكبت التسليم، وتصنيف التراجع، وخطافات الأدوات، وتراكبات المطالبة، والمخططات، وإصلاح النصوص              |
  | `plugin-sdk/channel-test-helpers`         | مساعدو اختبار دورة حياة حساب القناة، والدليل، وتكوين الإرسال، ومحاكاة وقت التشغيل، والخطافات، ومدخل القناة المضمّنة، والطابع الزمني للمظروف، ورد الاقتران، وعقود القناة العامة |
  | `plugin-sdk/channel-target-testing`       | مجموعة اختبارات مشتركة لحالات أخطاء حل أهداف القناة                                                                                                                         |
  | `plugin-sdk/plugin-test-contracts`        | مساعدو عقود تسجيل Plugin، وبيان الحزمة، والأثر العام، وAPI وقت التشغيل، والآثار الجانبية للاستيراد، والاستيراد المباشر                                                     |
  | `plugin-sdk/plugin-test-runtime`          | تجهيزات وقت تشغيل Plugin، والسجل، وتسجيل المزوّد، ومعالج الإعداد، وتدفق مهام وقت التشغيل للاختبارات                                                                        |
  | `plugin-sdk/provider-test-contracts`      | مساعدو عقود وقت تشغيل المزوّد، والمصادقة، والاكتشاف، والإعداد الأولي، والفهرس، وإمكانات الوسائط، وسياسة إعادة التشغيل، والصوت الحي لـ STT الفوري، والبحث/الجلب عبر الويب، والمعالج |
  | `plugin-sdk/provider-http-test-mocks`     | محاكيات HTTP/المصادقة الاختيارية في Vitest لاختبارات المزوّد التي تمرّن `plugin-sdk/provider-http`                                                                          |
  | `plugin-sdk/test-env`                     | تجهيزات بيئة الاختبار، وfetch/الشبكة، وخادم HTTP القابل للتخلص، والطلب الوارد، والاختبار الحي، ونظام الملفات المؤقت، والتحكم بالوقت                                      |
  | `plugin-sdk/test-fixtures`                | تجهيزات اختبار عامة لـ CLI، وصندوق العزل، وSkills، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمّن، والطرفية، والتقطيع، ورمز المصادقة، والحالات المطبوعة |
  | `plugin-sdk/test-node-mocks`              | مساعدو محاكاة مركّزون لمكوّنات Node المضمّنة للاستخدام داخل مصانع Vitest `vi.mock("node:*")`                                                                                |
  | `plugin-sdk/migration`                    | مساعدو عناصر مزوّد الترحيل مثل `createMigrationItem`، وثوابت السبب، وعلامات حالة العنصر، ومساعدو التنقيح، و`summarizeMigrationItems`                                      |
  | `plugin-sdk/migration-runtime`            | مساعدو ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                          |

  <AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدو معالج الإعداد المشتركون، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدو تكوين/بوابة إجراءات الحسابات المتعددة، ومساعدو الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدو تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدو البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدو قائمة الحسابات/إجراءات الحساب الضيقون |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط تكوين القناة المشتركة والباني العام |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات تكوين قنوات OpenClaw المضمّنة للـ Plugins المضمّنة والمُصانة فقط |
    | `plugin-sdk/channel-config-schema-legacy` | اسم توافق بديل مهمل لمخططات تكوين القنوات المضمّنة |
    | `plugin-sdk/telegram-command-config` | مساعدو تطبيع/تحقق أوامر Telegram المخصصة مع رجوع إلى العقد المضمّن |
    | `plugin-sdk/command-gating` | مساعدو بوابة تخويل الأوامر الضيقون |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، ومساعدو دورة حياة/إنهاء بث المسودة |
    | `plugin-sdk/inbound-envelope` | مساعدو مشتركون لبناء المسار الوارد + المظروف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدو التسجيل والإرسال الوارد المشتركون |
    | `plugin-sdk/messaging-targets` | مساعدو تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدو تحميل الوسائط الصادرة المشتركون |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف عن اعتماديات الإرسال الصادر لمحوّلات القنوات |
    | `plugin-sdk/outbound-runtime` | مساعدو التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدو تطبيع الاستطلاعات الضيقون |
    | `plugin-sdk/thread-bindings-runtime` | مساعدو دورة حياة ربط الخيوط والمحوّلات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدو المحادثة/ربط الخيوط، والاقتران، والربط المُكوَّن |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة تكوين وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدو حل سياسة المجموعة في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدو لقطة/ملخص حالة القناة المشتركون |
    | `plugin-sdk/channel-config-primitives` | بدائيات مخطط تكوين القناة الضيقة |
    | `plugin-sdk/channel-config-writes` | مساعدو تخويل كتابة تكوين القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيد Plugin القناة المشتركة |
    | `plugin-sdk/allowlist-config-edit` | مساعدو تحرير/قراءة تكوين قائمة السماح |
    | `plugin-sdk/group-access` | مساعدو قرار الوصول إلى المجموعة المشتركون |
    | `plugin-sdk/direct-dm` | مساعدو مصادقة/حراسة الرسائل المباشرة المشتركون |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للحزمة المنشورة `@openclaw/discord@2026.3.13` وتوافق المالك المتتبَّع؛ ينبغي أن تستخدم Plugins الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram من أجل توافق المالك المتتبَّع؛ ينبغي أن تستخدم Plugins الجديدة مساعدي وقت التشغيل المحقونين أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق مهملة لـ Zalo Personal للحزم المنشورة Lark/Zalo التي لا تزال تستورد تخويل أمر المرسل؛ ينبغي أن تستخدم Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | مساعدو عرض الرسائل الدلالي، والتسليم، والرد التفاعلي القديم. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حزمة توافق لإزالة الارتداد الوارد، ومطابقة الإشارة، ومساعدي سياسة الإشارة، ومساعدي المظروف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدو إزالة الارتداد الوارد الضيقون |
    | `plugin-sdk/channel-mention-gating` | مساعدو سياسة الإشارة، وعلامة الإشارة، ونص الإشارة الضيقون بدون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدو تنسيق المظروف الوارد الضيقون |
    | `plugin-sdk/channel-location` | سياق موقع القناة ومساعدو التنسيق |
    | `plugin-sdk/channel-logging` | مساعدو تسجيل القناة للإسقاطات الواردة وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتيجة الرد |
    | `plugin-sdk/channel-actions` | مساعدو إجراءات رسائل القناة، بالإضافة إلى مساعدي المخططات الأصلية المهملة والمُبقى عليها لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدو تطبيع المسار المشتركون، وحل الأهداف المعتمد على المحلل، وتحويل معرّف الخيط إلى سلسلة، ومفاتيح المسار لإزالة التكرار/الضغط، وأنواع الأهداف المحللة، ومساعدو مقارنة المسار/الهدف |
    | `plugin-sdk/channel-targets` | مساعدو تحليل الأهداف؛ ينبغي أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/ردود الفعل |
    | `plugin-sdk/channel-secret-runtime` | مساعدو عقد الأسرار الضيقون مثل `collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="Provider subpaths">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة مزود LM Studio المدعومة للإعداد، واكتشاف الكتالوج، وتحضير النموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لإعدادات الخادم المحلي الافتراضية، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحملة |
    | `plugin-sdk/provider-setup` | مساعدات منتقاة لإعداد المزود المحلي/المستضاف ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزود مستضاف ذاتيًا ومتوافق مع OpenAI |
    | `plugin-sdk/cli-backend` | إعدادات خلفية CLI الافتراضية + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API وقت التشغيل لمكونات المزود الإضافية |
    | `plugin-sdk/provider-auth-api-key` | مساعدات الإلحاق/كتابة الملف الشخصي لمفاتيح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لمكونات المزود الإضافية |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزود |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة سياسات إعادة التشغيل المشتركة، ومساعدات نقاط نهاية المزود، ومساعدات تطبيع معرفات النماذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل تعزيز كتالوج المزود وحدود سجل مزودي Plugin لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط النهاية للمزود، وأخطاء HTTP الخاصة بالمزود، ومساعدات نماذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعداد/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة تخزين مؤقت لمزود جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/اعتمادات بحث الويب للمزودين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/اعتمادات بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحدِّدات/جوالب الاعتمادات محددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/ذاكرة تخزين مؤقت/وقت تشغيل لمزود بحث الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات مغلفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزود الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات الإلحاق |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | حل جهة الاعتماد ومساعدات مصادقة الإجراءات في المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات/مرشحات اعتماد التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | محولات قدرات/تسليم الاعتماد الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الاعتماد |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محول الاعتماد الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الاعتماد؛ فضّل حدود المحول/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الاعتماد الأصلي + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد اعتماد التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة اعتماد التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الاعتماد الأصلي، ومساعدات عرض الاعتماد المهيكل مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة ضبط إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة دون الحزمة الاختبارية العامة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات نص أوامر خفيفة لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | تطبيع جسم الأمر ومساعدات سطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقود الأسرار لأسطح أسرار القنوات/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لكتابة `coerceSecretRef` وSecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وتقييد الرسائل المباشرة، والمحتوى الخارجي، وتنقيح النصوص الحساسة، ومقارنة الأسرار بزمن ثابت، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للمُرسِل المثبت دون سطح وقت تشغيل البنية التحتية العام |
    | `plugin-sdk/ssrf-runtime` | مساعدات المُرسِل المثبت، والجلب المحروس من SSRF، وخطأ SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلبات/أهداف Webhook وإكراه websocket/body الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="مسارات runtime والتخزين الفرعية">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لـ runtime/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة runtime، والمسجل، والمهلة، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/browser-config` | واجهة إعدادات المتصفح المدعومة للملف الشخصي/القيم الافتراضية المعيارية، وتحليل عنوان URL لـ CDP، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق runtime للقناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/http/تفاعلات Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط runtime الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار واستدعاء الوسائط ومجموعات الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء العميل الجاهز لحلقة الأحداث، وRPC لـ CLI الخاص بـ Gateway، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-types` | سطح إعدادات للأنواع فقط لأشكال إعدادات Plugin مثل `OpenClawConfig` وأنواع إعدادات القناة/المزوّد |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن إعدادات Plugin في runtime مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل إعدادات معاملية مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعدادات العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تسوية اسم/وصف أمر Telegram وفحوصات التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المضمن متاحا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات من دون البرميل الواسع لـ text-runtime |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة على التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/runtime الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات runtime مشتركة للوارد/الرد، والتقسيم إلى مقاطع، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد وتسميات المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود قصير النافذة وعلامات مثل `buildHistoryContext` و`HISTORY_CONTEXT_MARKER` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقسيم النص/Markdown إلى مقاطع |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة، ومفتاح الجلسة، ووقت التحديث، وتعديل المخزن |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات توجيه/مفتاح جلسة/ربط حساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وقيم runtime-state الافتراضية، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تسوية slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر مؤقت بنتائج stdout/stderr معيارية |
    | `plugin-sdk/param-readers` | قارئات معاملات مشتركة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المعيارية من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسار التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعدادات مزود المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات runtime/الجلسة وإرسال الردود في ACP |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل خلفية ACP وإرسال الردود للـ plugins المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء تشغيل دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط إعدادات runtime للوكيل |
    | `plugin-sdk/boolean-param` | قارئ معاملات منطقية مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقناة السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات أمر/مزود رد `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skill |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح Plugin تجريبي موثوق لأدوات agent harnesses منخفضة المستوى: أنواع harness، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة runtime، وتصنيف مخرجات الطرفية، ومساعدات تنسيق/تفاصيل تقدم الأداة، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة runtime الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياس نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تصريف التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات حدث Heartbeat والظهور |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي |
    | `plugin-sdk/secure-random-runtime` | مساعدات الرمز الآمن/UUID |
    | `plugin-sdk/system-event-runtime` | مساعدات صف أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات runtime الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات ذاكرة تخزين مؤقت صغيرة ومحدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علم التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات رسم بياني للأخطاء، وتنسيق، وتصنيف مشترك للأخطاء، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch مغلف، ووكيل، وخيار EnvHttpProxyAgent، ومساعدات بحث مثبتة |
    | `plugin-sdk/runtime-fetch` | fetch خاص بـ runtime ومدرك للمرسل من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ response-body محدود من دون سطح runtime الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المكوّن أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة من دون استيرادات واسعة لكتابات/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | حل ظهور السياق وتصفية السياق التكميلي من دون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لتحويل وتطبيع السجلات البدائية/السلاسل النصية من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تسوية اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار للدليل مدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، واستكشاف أبعاد الفيديو المدعوم بـ ffprobe، وبُنّاء حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع مزودي فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجّهة للمزوّدين |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقطيع النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودي الكلام بالإضافة إلى صادرات التوجيه والسجل والتحقق وبنّاء TTS المتوافق مع OpenAI ومساعدات الكلام الموجّهة للمزوّدين |
    | `plugin-sdk/speech-core` | أنواع مزودي الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزودي التفريغ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشتركة |
    | `plugin-sdk/realtime-voice` | أنواع مزودي الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودي توليد الصور بالإضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وبنّاء مزود الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن المزوّد، وتحليل مراجع النماذج |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن المزوّد، وتحليل مراجع النماذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | ملف تجميعي واسع للتوافق مع اختبارات Plugin القديمة. ينبغي لاختبارات الإضافات الجديدة استيراد مسارات SDK فرعية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` بسيط لاختبارات وحدة تسجيل Plugin المباشرة من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول وقت تشغيل الوكيل الأصلية لاختبارات المصادقة، والتسليم، والرجوع الاحتياطي، وخطاف الأدوات، وتراكب المطالبة، والمخطط، وإسقاط النص الكامل |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء الحساب، وتمرير إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | مجموعة مشتركة لحالات أخطاء حل الأهداف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود حزمة Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة برمجة تطبيقات وقت التشغيل، والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود وقت تشغيل المزوّد، والمصادقة، والاكتشاف، والتهيئة، والفهرس، والمعالج الإرشادي، وقدرة الوسائط، وسياسة إعادة التشغيل، وSTT الصوت الحي الفوري، والبحث/الجلب عبر الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية في Vitest لاختبارات المزوّدين التي تمرّن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة لالتقاط وقت تشغيل CLI، وسياق الصندوق الرملي، وكاتب Skills، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمن، ونص الطرفية، والتقطيع، ورمز المصادقة، والحالات المطبّعة |
    | `plugin-sdk/test-node-mocks` | مساعدات مركزة لمحاكاة مدمجات Node للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعداد/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت تشغيل نواة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown مُدارة مشتركة لملحقات مجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    لا توجد حاليا مسارات SDK فرعية محجوزة للمساعدات المضمنة. تعيش المساعدات
    الخاصة بالمالك داخل حزمة Plugin المالكة، بينما تستخدم عقود المضيف القابلة
    لإعادة الاستخدام مسارات SDK فرعية عامة مثل `plugin-sdk/gateway-runtime`
    و`plugin-sdk/security-runtime` و`plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
