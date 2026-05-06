---
read_when:
    - اختيار المسار الفرعي المناسب لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّن وواجهات المساعدة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: مواضع وجود الاستيرادات، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-05-06T08:08:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

يُعرَض SDK الخاص بـ Plugin كمجموعة من المسارات الفرعية الضيقة ضمن `openclaw/plugin-sdk/`.
تسرد هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمّعة حسب الغرض. توجد القائمة الكاملة
المولّدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
وتظهر هناك المسارات الفرعية المحجوزة لمساعدي Plugin المضمّنة، لكنها تُعدّ تفاصيل
تنفيذية ما لم تُبرزها صفحة توثيق صراحة. يمكن للمشرفين تدقيق المسارات الفرعية النشطة
المحجوزة للمساعدين باستخدام `pnpm plugins:boundary-report:summary`؛ وتفشل
تصديرات المساعدين المحجوزة غير المستخدمة في تقرير CI بدلاً من بقائها في SDK العام
كدَين توافق كامن.

لدليل تأليف Plugin، راجع [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview).

## مدخل Plugin

| المسار الفرعي                            | التصديرات الرئيسية                                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | تجميعة توافق واسعة لاختبارات Plugin القديمة؛ فضّل المسارات الفرعية المركّزة للاختبارات في اختبارات Plugin الجديدة                                                            |
| `plugin-sdk/plugin-test-api`              | منشئ محاكاة `OpenClawPluginApi` حدّ أدنى لاختبارات الوحدة المباشرة لتسجيل Plugin                                                                                              |
| `plugin-sdk/agent-runtime-test-contracts` | أدوات اختبار عقود محوّل وقت تشغيل الوكيل الأصلي لملفات تعريف المصادقة، ومنع التسليم، وتصنيف الرجوع الاحتياطي، وخطافات الأدوات، وتراكبات الموجّه، والمخططات، وإصلاح النص      |
| `plugin-sdk/channel-test-helpers`         | مساعدو اختبارات دورة حياة حساب القناة، والدليل، وإعداد الإرسال، ومحاكاة وقت التشغيل، والخطاف، ومدخل القناة المضمّنة، والطابع الزمني للغلاف، ورد الاقتران، وعقد القناة العام |
| `plugin-sdk/channel-target-testing`       | حزمة اختبارات مشتركة لحالات أخطاء حلّ هدف القناة                                                                                                                            |
| `plugin-sdk/plugin-test-contracts`        | مساعدو عقود تسجيل Plugin، وبيان الحزمة، والأثر العام، وواجهة برمجة وقت التشغيل، والأثر الجانبي للاستيراد، والاستيراد المباشر                                                |
| `plugin-sdk/plugin-test-runtime`          | أدوات اختبار وقت تشغيل Plugin، والسجل، وتسجيل المزوّد، ومعالج الإعداد، وتدفق المهام في وقت التشغيل للاختبارات                                                               |
| `plugin-sdk/provider-test-contracts`      | مساعدو عقود وقت تشغيل المزوّد، والمصادقة، والاكتشاف، والتهيئة، والفهرس، وإمكانات الوسائط، وسياسة إعادة التشغيل، والصوت الحي لـ STT في الزمن الفعلي، والبحث/الجلب عبر الويب، والمعالج |
| `plugin-sdk/provider-http-test-mocks`     | محاكيات HTTP/المصادقة الاختيارية في Vitest لاختبارات المزوّد التي تمرّن `plugin-sdk/provider-http`                                                                            |
| `plugin-sdk/test-env`                     | أدوات اختبار بيئة الاختبار، والجلب/الشبكة، وخادم HTTP القابل للتخلص منه، والطلب الوارد، والاختبار الحي، ونظام الملفات المؤقت، والتحكم بالوقت                                |
| `plugin-sdk/test-fixtures`                | أدوات اختبار عامة لـ CLI، وصندوق العزل، والمهارة، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمّن، والطرفية، والتقسيم إلى مقاطع، ورمز المصادقة، والحالة ذات الأنواع |
| `plugin-sdk/test-node-mocks`              | مساعدو محاكاة مركّزون للمدمج في Node للاستخدام داخل مصانع Vitest `vi.mock("node:*")`                                                                                         |
| `plugin-sdk/migration`                    | مساعدو عناصر مزوّد الترحيل مثل `createMigrationItem`، وثوابت السبب، وعلامات حالة العنصر، ومساعدي التنقيح، و`summarizeMigrationItems`                                       |
| `plugin-sdk/migration-runtime`            | مساعدو ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                          |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات تهيئة/بوابة إجراءات الحسابات المتعددة، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات محدودة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | مساعدات مسار الرد القديمة. يجب أن تستخدم شيفرة مسار ردود القنوات الجديدة `createChannelMessageReplyPipeline` و`resolveChannelMessageSourceReplyDeliveryMode` من `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | أوليات مخطط تهيئة القنوات المشتركة بالإضافة إلى بناة Zod وJSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات تهيئة قنوات OpenClaw المضمّنة للـ Plugins المضمّنة المُصانة فقط |
    | `plugin-sdk/channel-config-schema-legacy` | اسم توافق بديل مهمل لمخططات تهيئة القنوات المضمّنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع رجوع إلى العقد المضمّن |
    | `plugin-sdk/command-gating` | مساعدات محدودة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، ومساعدات دورة حياة دفق المسودات القديمة. يجب أن تستخدم شيفرة إنهاء المعاينة الجديدة `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | مساعدات عقود دورة حياة الرسائل منخفضة التكلفة مثل `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`، وواجهات التوافق، واشتقاق قابلية الإنهاء الدائم، ومساعدات إثبات القابلية لقدرات الإرسال/الإيصال/الأثر الجانبي، و`MessageReceiveContext`، وإثباتات سياسة إقرار الاستلام، و`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`، وإثباتات قابلية المعاينة الحية والمُنهي الحي، وحالة الاسترداد الدائم، و`RenderedMessageBatch`، وأنواع إيصالات الرسائل، ومساعدات معرف الإيصال. راجع [واجهة برمجة تطبيقات رسائل القنوات](/ar/plugins/sdk-channel-message). يبقى `createChannelTurnReplyPipeline` القديم لموزعات التوافق فقط. |
    | `plugin-sdk/channel-message-runtime` | مساعدات تسليم Runtime قد تحمّل التسليم الصادر، بما في ذلك `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase`، و`recordChannelMessageReplyDispatch`. استخدمها من وحدات Runtime للمراقبة/الإرسال، وليس من ملفات تمهيد Plugin الساخنة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + المغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات قديمة مشتركة للتسجيل الوارد والتوزيع، ومسندات التوزيع المرئي/النهائي، وتوافق `deliverDurableInboundReplyPayload` المهمل لموزعات القنوات المُحضّرة. يجب أن تستورد شيفرة استقبال/توزيع القنوات الجديدة مساعدات دورة حياة Runtime من `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف عن تبعيات الإرسال الصادر لمحولات القنوات |
    | `plugin-sdk/outbound-runtime` | مساعدات التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات محدودة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط سلاسل المحادثة والمحولات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/سلسلة المحادثة، والإقران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة تهيئة Runtime |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في Runtime |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القنوات |
    | `plugin-sdk/channel-config-primitives` | أوليات محدودة لمخطط تهيئة القنوات |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة تهيئة القنوات |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugin القنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تعديل/قراءة تهيئة قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار الوصول إلى المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حراسة الرسائل المباشرة DM |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للحزمة المنشورة `@openclaw/discord@2026.3.13` وتوافق المالك المتتبّع؛ يجب أن تستخدم Plugins الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حسابات Telegram لتوافق المالك المتتبّع؛ يجب أن تستخدم Plugins الجديدة مساعدات Runtime المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق Zalo Personal مهملة لحزم Lark/Zalo المنشورة التي لا تزال تستورد تفويض أوامر المرسل؛ يجب أن تستخدم Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | عرض الرسائل الدلالي، والتسليم، ومساعدات الرد التفاعلي القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حاوية توافق لإزالة تكرار الوارد، ومطابقة الإشارات، ومساعدات سياسة الإشارة، ومساعدات المغلفات |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات محدودة لإزالة تكرار الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات محدودة لسياسة الإشارة، وعلامة الإشارة، ونص الإشارة دون سطح Runtime الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات محدودة لتنسيق المغلف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القنوات للإسقاطات الواردة وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القنوات، بالإضافة إلى مساعدات المخطط الأصلي المهملة المحفوظة لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسارات، وحل الأهداف المدفوع بالمحلل، وتحويل معرف سلسلة المحادثة إلى سلسلة نصية، ومفاتيح المسار لإزالة التكرار/الضغط، وأنواع الأهداف المحللة، ومساعدات مقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقود القنوات |
    | `plugin-sdk/channel-feedback` | توصيلات التعليقات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات محدودة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للموفّر">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة موفّر LM Studio المدعومة للإعداد، واكتشاف الفهرس، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لافتراضيات الخادم المحلي، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد الموفّرات المحلية/ذاتية الاستضافة المنتقاة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد موفّر ذاتي الاستضافة ومتوافق مع OpenAI ومركّزة |
    | `plugin-sdk/cli-backend` | افتراضيات خلفية CLI + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API وقت التشغيل لإضافات الموفّرات |
    | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفاتيح API وكتابة الملفات الشخصية مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لإضافات الموفّرات |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`، و`ensureApiKeyFromOptionEnvOrPrompt`، و`upsertAuthProfile`، و`upsertApiKeyProfile`، و`writeOAuthCredentials`، وتصدير توافق `resolveOpenClawAgentDir` المهمل |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks`، و`normalizeModelCompat`، وبُنّاة سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية الموفّر، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل تعزيز فهرس الموفّر ودرزات سجل موفّر Plugin لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`، و`buildSingleProviderApiKeyCatalog`، و`buildManifestModelProviderConfig`، و`supportsNativeStreamingUsageCompat`، و`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط النهاية للموفّر، وأخطاء HTTP للموفّر، ومساعدات نماذج الأجزاء المتعددة لتفريغ الصوت نصيًا |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد محدودة لتهيئة/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة التخزين المؤقت لموفّر جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات محدودة لتهيئة/اعتمادات بحث الويب للموفّرات التي لا تحتاج إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد محدودة لتهيئة/اعتمادات بحث الويب مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، ومحدّدات/جالبات الاعتمادات محددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/ذاكرة التخزين المؤقت/وقت التشغيل لموفّر بحث الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع مغلّفات التدفق، ومساعدات مغلّفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفّر الأصلية مثل الجلب المحمي، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تهيئة الإعداد |
    | `plugin-sdk/global-singleton` | مساعدات singleton/خريطة/ذاكرة تخزين مؤقت محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات محدودة لوضع تنشيط المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المرسِل |
    | `plugin-sdk/command-status` | بُنّاة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المعتمِد ومصادقة الإجراءات في المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات/مرشحات موافقة التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات قدرات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّل الموافقة الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ فضّل درزات المحوّل/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد موافقة التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقة التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المنظّمة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات محدودة لإعادة ضبط إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات محدودة لاختبار عقد القناة بدون برميل الاختبار الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات نص أوامر خفيفة لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات محدودة لجمع عقد الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات محدودة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/التهيئة |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، والملفات/المسارات المحدودة بالجذر بما في ذلك عمليات الكتابة للإنشاء فقط، والاستبدال الذري المتزامن/غير المتزامن للملفات، وعمليات الكتابة المؤقتة الشقيقة، والرجوع الاحتياطي للنقل عبر الأجهزة، ومساعدات مخزن الملفات الخاصة، وحراس أصل الروابط الرمزية، والمحتوى الخارجي، وتنقيح النصوص الحساسة، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيف وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات محدودة للموزّع المثبّت بدون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | الموزّع المثبّت، والجلب المحمي من SSRF، وخطأ SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/body الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="مسارات وقت التشغيل والتخزين الفرعية">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة وقت التشغيل والمسجل والمهلة وإعادة المحاولة والتراجع |
    | `plugin-sdk/browser-config` | واجهة إعدادات متصفح مدعومة للملف الشخصي/الإعدادات الافتراضية المطَبَّعة، وتحليل URL الخاص بـ CDP، ومساعدات مصادقة التحكم بالمتصفح |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الجهات الخارجية الأقدم؛ يجب أن تستورد Plugins الجديدة `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الجهات الخارجية الأقدم؛ يجب أن تستورد Plugins الجديدة مسارات SDK الفرعية العامة مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر Plugin والخطافات وHTTP والتفاعل |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار واستدعاء الوسيطات ومجموعة الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء العميل الجاهز لحلقة الأحداث، وRPC عبر CLI للبوابة، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-types` | سطح إعدادات مخصص للأنواع فقط لأشكال إعدادات Plugin مثل `OpenClawConfig` وأنواع إعدادات القنوات/المزودين |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن إعدادات Plugin في وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل الإعدادات ضمن معاملة مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعدادات العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومعيّنات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أمر Telegram وفحوصات التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المضمّن غير متاح |
    | `plugin-sdk/text-autolink-runtime` | كشف الربط التلقائي لمراجع الملفات بدون حزمة text-runtime الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة على التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقسيم، والإرسال، وHeartbeat، ومخطط الردود |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال/إنهاء الرد وتسميات المحادثات |
    | `plugin-sdk/reply-history` | مساعدات ومؤشرات مشتركة لتاريخ الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`HISTORY_CONTEXT_MARKER` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات، ومفتاح الجلسة، ووقت التحديث، وتعديل المخزن |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات توجيه/مفتاح جلسة/ربط حساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وإعدادات الحالة الافتراضية لوقت التشغيل، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات مشتركة لمعاملات الأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطَبَّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القانونية من وسيطات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعدادات مزود المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل خلفية ACP وإرسال الردود لـ Plugins المحمّلة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط بدون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات محددة لمخطط إعدادات وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورموز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مشتركة لمساعدات القناة السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات ردود أمر/مزود `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل الأوامر الأصلية/بنائها/تسلسلها |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق لأدوات تسخير الوكيل منخفضة المستوى: أنواع التسخير، ومساعدات توجيه/إحباط التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة وقت التشغيل، وتصنيف نتائج الطرفية، ومساعدات تنسيق/تفصيل تقدم الأداة، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات كشف نقطة نهاية Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة وقت التشغيل الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياسات نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن المهام غير المتزامنة المحدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تصريف التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات حدث Heartbeat ورؤيته |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي |
    | `plugin-sdk/secure-random-runtime` | مساعدات رموز/UUID آمنة |
    | `plugin-sdk/system-event-runtime` | مساعدات طابور أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات وقت التشغيل الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علم التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء والتنسيق وتصنيف الأخطاء المشتركة، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch مغلّفة، ووكيل، وخيار EnvHttpProxyAgent، وبحث مثبّت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك للموزّع بدون استيرادات وكيل/fetch محمي |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة بدون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية بدون توجيه الربط المكوّن أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات بدون استيرادات واسعة لكتابات/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق التكميلي بدون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة لإكراه وتطبيع السجلات/السلاسل النصية البدائية بدون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار دليل مدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، واستكشاف أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجهة إلى الموفرين |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل تجريد النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد لتقطيع النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام بالإضافة إلى صادرات التوجيه، والسجل، والتحقق، وباني TTS المتوافق مع OpenAI، ومساعدات الكلام الموجهة إلى الموفرين |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ الفوري، ومساعدات السجل، ومساعد جلسات WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور بالإضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني موفر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفري/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن الموفر، وتحليل مراجع النماذج |
    | `plugin-sdk/video-generation` | أنواع موفري/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن الموفر، وتحليل مراجع النماذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي SDK الخاص بالـ Plugin |
    | `plugin-sdk/testing` | تجميعة توافق واسعة لاختبارات الـ Plugin القديمة. يجب أن تستورد اختبارات الإضافات الجديدة مسارات فرعية مركزة من SDK مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` بالحد الأدنى لاختبارات الوحدة الخاصة بتسجيل الـ Plugin مباشرة من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول تشغيل الوكيل الأصلية لاختبارات المصادقة، والتسليم، والرجوع الاحتياطي، وخطافات الأدوات، وتراكب المطالبة، والمخطط، وإسقاط النص الحواري |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجهة إلى القنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء الحساب، وتسلسل إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | مجموعة مشتركة لحالات أخطاء حل الأهداف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود حزمة الـ Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة API وقت التشغيل، والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود تشغيل الموفر، والمصادقة، والاكتشاف، والإعداد الأولي، والفهرس، والمعالج، وإمكانات الوسائط، وسياسة إعادة التشغيل، وSTT الصوت الحي الفوري، وبحث/جلب الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية في Vitest لاختبارات الموفرين التي تمرن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات عامة لالتقاط وقت تشغيل CLI، وسياق صندوق الرمل، وكاتب Skills، ورسائل الوكيل، وأحداث النظام، وإعادة تحميل الوحدات، ومسار الـ Plugin المضمن، ونص الطرفية، والتقطيع، ورمز المصادقة، والحالات المكتوبة |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة للمكونات المضمنة في Node للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core مضمن لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لفهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمينات مضيف الذاكرة، والوصول إلى السجل، والموفر المحلي، ومساعدات الدُفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعدد الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown مُدارة مشتركة للـ plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل الذاكرة النشطة للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورد لمساعدات حالة مضيف الذاكرة |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    لا توجد حاليا مسارات فرعية محجوزة في SDK للمساعدات المضمنة. توجد
    المساعدات الخاصة بالمالك داخل حزمة الـ Plugin المالكة، بينما تستخدم عقود
    المضيف القابلة لإعادة الاستخدام مسارات فرعية عامة من SDK مثل `plugin-sdk/gateway-runtime`
    و`plugin-sdk/security-runtime` و`plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على SDK الخاص بالـ Plugin](/ar/plugins/sdk-overview)
- [إعداد SDK الخاص بالـ Plugin](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
