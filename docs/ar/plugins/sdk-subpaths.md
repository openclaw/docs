---
read_when:
    - اختيار المسار الفرعي المناسب من plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية وواجهات المساعدة للـ Plugin المضمّنة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: مواضع عمليات الاستيراد، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-05-03T21:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  يُعرَض plugin SDK كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تسرد هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمّعة حسب الغرض. توجد القائمة
  الكاملة المُولَّدة لأكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  وتظهر هناك المسارات الفرعية المحجوزة لمساعدات bundled-plugin، لكنها تُعدّ تفاصيل
  تنفيذية ما لم تروّج لها صفحة توثيق صراحة. يمكن للمشرفين تدقيق المسارات الفرعية
  النشطة والمحجوزة للمساعدات باستخدام `pnpm plugins:boundary-report:summary`؛ أما
  صادرات المساعدات المحجوزة غير المستخدمة فتُفشل تقرير CI بدلاً من بقائها في SDK
  العام كدين توافق خامل.

  لدليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## إدخال Plugin

  | المسار الفرعي                            | الصادرات الرئيسية                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | حزمة توافق واسعة لاختبارات Plugin القديمة؛ فضّل مسارات الاختبار الفرعية المركزة لاختبارات الإضافات الجديدة                                                                     |
  | `plugin-sdk/plugin-test-api`              | منشئ محاكاة `OpenClawPluginApi` صغير لاختبارات وحدة تسجيل Plugin المباشرة                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول runtime الأصلي للوكيل لملفات تعريف المصادقة، وإخماد التسليم، وتصنيف fallback، وخطافات الأدوات، وتراكبات prompt، والمخططات، وإصلاح السجل |
  | `plugin-sdk/channel-test-helpers`         | مساعدات اختبار دورة حياة حساب القناة، والدليل، وإعداد الإرسال، ومحاكاة runtime، والخطاف، وإدخال القناة المضمّنة، والطابع الزمني للمغلف، ورد الاقتران، وعقد القناة العامة   |
  | `plugin-sdk/channel-target-testing`       | مجموعة اختبار مشتركة لحالات أخطاء حل هدف القناة                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | مساعدات عقود تسجيل Plugin، وبيان الحزمة، والأثر العام، وruntime API، والأثر الجانبي للاستيراد، والاستيراد المباشر                                                  |
  | `plugin-sdk/plugin-test-runtime`          | تجهيزات اختبارات runtime الخاص بـ Plugin، والسجل، وتسجيل المزوّد، ومعالج الإعداد، وتدفق مهام runtime                                                                      |
  | `plugin-sdk/provider-test-contracts`      | مساعدات عقود runtime الخاص بالمزوّد، والمصادقة، والاكتشاف، والإعداد الأولي، والفهرس، وإمكانات الوسائط، وسياسة الإعادة، وSTT للصوت الحي في الوقت الحقيقي، والبحث/الجلب عبر الويب، والمعالج                 |
  | `plugin-sdk/provider-http-test-mocks`     | محاكاة HTTP/المصادقة اختيارية في Vitest لاختبارات المزوّد التي تشغّل `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | تجهيزات بيئة الاختبار، والجلب/الشبكة، وخادم HTTP قابل للتصرف، والطلب الوارد، والاختبار الحي، ونظام الملفات المؤقت، والتحكم في الوقت                                        |
  | `plugin-sdk/test-fixtures`                | تجهيزات اختبار عامة لـ CLI، وsandbox، وskill، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمّن، والطرفية، والتجزئة، ورمز المصادقة، والحالة النمطية                   |
  | `plugin-sdk/test-node-mocks`              | مساعدات محاكاة مركزة للمكونات المدمجة في Node للاستخدام داخل مصانع Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | مساعدات عناصر مزوّد الترحيل مثل `createMigrationItem`، وثوابت السبب، وعلامات حالة العنصر، ومساعدات التنقيح، و`summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | مساعدات ترحيل runtime مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات allowlist، ومنشئو حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات الحسابات المتعددة، ومساعدات fallback للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + fallback الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | أساسيات مخطط إعداد القناة المشتركة بالإضافة إلى منشئات Zod وJSON/TypeBox المباشرة |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعداد قناة OpenClaw المضمّنة لـ plugins المضمّنة المُصانة فقط |
    | `plugin-sdk/channel-config-schema-legacy` | اسم توافق بديل مهمل لمخططات إعداد القناة المضمّنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع fallback لعقد مضمّن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، ومساعدات دورة حياة/إنهاء مسودة البث |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + المغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة للتسجيل والتوجيه الوارد |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف عن تبعيات الإرسال الصادر لمحولات القناة |
    | `plugin-sdk/outbound-runtime` | مساعدات التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاع |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط الخيوط والمحول |
    | `plugin-sdk/agent-media-payload` | منشئ حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المُعدّ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعداد runtime |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة في runtime |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة/ملخص حالة القناة |
    | `plugin-sdk/channel-config-primitives` | أساسيات ضيقة لمخطط إعداد القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعداد القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تحرير/قراءة إعداد allowlist |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار وصول المجموعة |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حراسة direct-DM |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة لـ `@openclaw/discord@2026.3.13` المنشور وتوافق المالك المتتبع؛ ينبغي أن تستخدم plugins الجديدة مسارات SDK الفرعية العامة للقناة |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram من أجل توافق المالك المتتبع؛ ينبغي أن تستخدم plugins الجديدة مساعدات runtime المحقونة أو مسارات SDK الفرعية العامة للقناة |
    | `plugin-sdk/zalouser` | واجهة توافق Zalo Personal مهملة لحزم Lark/Zalo المنشورة التي ما زالت تستورد تفويض أوامر المرسل؛ ينبغي أن تستخدم plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | مساعدات العرض الدلالي للرسائل، والتسليم، والرد التفاعلي القديم. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حزمة توافق لإزالة الارتداد الوارد، ومطابقة الإشارات، ومساعدات سياسة الإشارة، ومساعدات المغلف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة الارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة، وعلامة الإشارة، ونص الإشارة بدون سطح runtime الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق المغلف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة للإسقاطات الواردة وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتيجة الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلي المهملة المحتفظ بها لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسار، وحل الهدف عبر المحلل، وتحويل معرّف الخيط إلى سلسلة، وإزالة تكرار/ضغط مفاتيح المسار، وأنواع الأهداف المحللة، ومقارنة المسار/الهدف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ ينبغي لمستدعي مقارنة المسارات استخدام `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد السر مثل `collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع هدف السر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة مزوّد LM Studio المدعومة للإعداد، واكتشاف الكتالوج، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة للإعدادات الافتراضية للخادم المحلي، واكتشاف النماذج، وترويسات الطلب، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد المزوّد المحلي/ذاتي الاستضافة المنتقاة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مزوّد ذاتي الاستضافة متوافق مع OpenAI ومركّزة |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية لخلفية CLI + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفتاح API في وقت التشغيل لـ Plugins المزوّد |
    | `plugin-sdk/provider-auth-api-key` | مساعدات التهيئة/كتابة الملف الشخصي لمفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ Plugins المزوّد |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, بانويات سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل إثراء كتالوج المزوّد و seams لسجل Plugin-المزوّد لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط النهاية للمزوّد، وأخطاء HTTP للمزوّد، ومساعدات نموذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لتكوين/اختيار جلب الويب مثل `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة تخزين مؤقت لمزوّد جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتكوين/اعتمادات بحث الويب للمزوّدين الذين لا يحتاجون إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد ضيقة لتكوين/اعتمادات بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحدّدات/جالبات الاعتمادات المحددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/ذاكرة تخزين مؤقت/وقت تشغيل لمزوّد بحث الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, تنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع مغلّفات البث، ومساعدات مغلّفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تكوين التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/خريطة/ذاكرة تخزين مؤقت محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، مساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بانويات رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المعتمد ومصادقة الإجراء في المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف/مرشح اعتماد التنفيذ الأصلي |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات قدرة/تسليم الاعتماد الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الاعتماد |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّل الاعتماد الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الاعتماد؛ فضّل seams المخصصة للمحوّل/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الاعتماد الأصلي + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد اعتماد التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة اعتماد التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الاعتماد الأصلي، ومساعدات عرض الاعتماد المنظم مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة دون برميل الاختبار الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، ومساعدات هدف الجلسة الأصلي |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات نص أوامر خفيفة لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/التكوين |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وحجب الرسائل المباشرة، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيف وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للمرسِل المثبّت دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات المرسِل المثبّت، والجلب المحروس ضد SSRF، وخطأ SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/الجسم الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة وقت التشغيل، والمسجل، والمهلة، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/browser-config` | واجهة إعدادات متصفح مدعومة للملف الشخصي/الإعدادات الافتراضية المطبعة، وتحليل عنوان URL لـ CDP، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الطرف الثالث الأقدم؛ يجب على Plugins الجديدة استيراد `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الطرف الثالث الأقدم؛ يجب على Plugins الجديدة استيراد المسارات الفرعية العامة لـ SDK مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/http/تفاعلية Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسولة مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات CLI للتنسيق، والانتظار، والإصدار، واستدعاء الوسائط، ومجموعة الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء عميل جاهز لحلقة الأحداث، وRPC لـ CLI في Gateway، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-types` | سطح إعدادات خاص بالأنواع فقط لأشكال إعدادات Plugin مثل `OpenClawConfig` وأنواع إعدادات القناة/الموفر |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن إعدادات Plugin وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تغيير الإعدادات بمعاملات مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعدادات العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تسوية اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المضمن متاحا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات من دون برميل text-runtime الواسع |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة إمكانات الموافقة، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقسيم، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال/إنهاء الرد وتسمية المحادثات |
    | `plugin-sdk/reply-history` | مساعدات وسوم مشتركة لتاريخ الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`HISTORY_CONTEXT_MARKER` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات، ومفتاح الجلسة، ووقت التحديث، وتغيير المخزن |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسار دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وإعدادات الحالة الافتراضية وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تسوية slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر موقوت بنتائج stdout/stderr مطبعة |
    | `plugin-sdk/param-readers` | قارئات معلمات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسار التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل الأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جداول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعدادات موفر Talk |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الرد |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل خلفية ACP وإرسال الرد لـ Plugins المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | أوليات محددة لمخطط إعدادات وقت تشغيل العميل |
    | `plugin-sdk/boolean-param` | قارئ معلمة منطقية مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | أوليات مساعدة مشتركة للقناة السلبية، والحالة، والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد لأمر/موفر `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح Plugin موثوق تجريبي لأدوات تسخير العملاء منخفضة المستوى: أنواع التسخير، ومساعدات توجيه/إيقاف التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة وقت التشغيل، وتصنيف نتائج الطرفية، ومساعدات تنسيق/تفصيل تقدم الأداة، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة وقت التشغيل الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياسات نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت داخل الذاكرة لإزالة التكرار |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تصريف التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات حدث Heartbeat والرؤية |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي قسري |
    | `plugin-sdk/secure-random-runtime` | مساعدات الرمز الآمن/UUID |
    | `plugin-sdk/system-event-runtime` | مساعدات قائمة انتظار أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/infra-runtime` | غلاف توافق مهمل؛ استخدم المسارات الفرعية المركزة لوقت التشغيل أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علم التشخيص، والحدث، وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء، والتنسيق، وتصنيف الأخطاء المشتركة، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch مغلفة، والوكيل، وخيار EnvHttpProxyAgent، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch وقت تشغيل واعية بالموزع من دون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المعد أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات من دون استيرادات واسعة لكتابة/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وترشيح السياق التكميلي من دون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة لتحويل السجلات/السلاسل البدائية وتسويتها من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تسوية اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل العميل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار للدليل مدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="مسارات فرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط إضافة إلى صادرات مساعدات الصور/الصوت الموجهة للموفرين |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام إضافة إلى صادرات التوجيه والسجل والتحقق والباني المتوافق مع OpenAI لـ TTS ومساعدات الكلام الموجهة للموفرين |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ في الوقت الحقيقي، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت في الوقت الحقيقي ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور إضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني موفر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن الموفر، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع موفر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن الموفر، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | تجميعة توافق واسعة لاختبارات Plugin القديمة. يجب أن تستورد اختبارات الامتدادات الجديدة مسارات SDK فرعية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` مصغر لاختبارات وحدة تسجيل Plugin المباشر من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول وقت تشغيل الوكيل الأصلية لاختبارات المصادقة، والتسليم، والرجوع الاحتياطي، وخطاف الأدوات، وتراكب الموجه، والمخطط، وإسقاط السجل النصي |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء تشغيل الحساب، وترابط إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | مجموعة مشتركة لحالات أخطاء حل الأهداف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود حزمة Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة API لوقت التشغيل، والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود وقت تشغيل الموفر، والمصادقة، والاكتشاف، والإعداد الأولي، والفهرس، والمعالج، وقدرات الوسائط، وسياسة إعادة التشغيل، والصوت الحي لـ STT في الوقت الحقيقي، والبحث/الجلب عبر الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية في Vitest لاختبارات الموفرين التي تمرن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة لالتقاط وقت تشغيل CLI، وسياق صندوق الرمل، وكاتب Skills، ورسائل الوكيل، وأحداث النظام، وإعادة تحميل الوحدات، ومسار Plugin المضمن، ونص الطرفية، والتجزئة، ورمز المصادقة، والحالات المطبعة |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة لمكونات Node المضمنة للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="مسارات الذاكرة الفرعية">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمينات مضيف الذاكرة، ووصول السجل، والموفر المحلي، ومساعدات الدفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملف/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورد لمساعدات الملف/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المدار المشتركة للـ plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورد لمساعدات حالة مضيف الذاكرة |
  </Accordion>

  <Accordion title="مسارات فرعية محجوزة للمساعدات المضمنة">
    لا توجد حاليا أي مسارات فرعية محجوزة في SDK للمساعدات المضمنة. تعيش
    المساعدات الخاصة بالمالك داخل حزمة Plugin المالكة، بينما تستخدم عقود المضيف
    القابلة لإعادة الاستخدام مسارات SDK فرعية عامة مثل `plugin-sdk/gateway-runtime`
    و`plugin-sdk/security-runtime` و`plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
