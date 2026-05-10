---
read_when:
    - اختيار المسار الفرعي الصحيح في plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّن وواجهات المساعدة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: مواضع وجود عمليات الاستيراد، مجمّعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:55:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض SDK الخاصة بـ Plugin كمجموعة من المسارات الفرعية العامة الضيقة ضمن
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمّعة حسب
الغرض. توجد قائمة نقاط دخول المترجم المولّدة في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتمثل صادرات الحزمة المجموعة العامة الفرعية
بعد طرح مسارات الاختبار/الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يمكن للمشرفين تدقيق
عدد الصادرات العامة باستخدام `pnpm plugin-sdk:surface` ومسارات المساعدة الفرعية
المحجوزة النشطة باستخدام `pnpm plugins:boundary-report:summary`؛ وتفشل صادرات
المساعد المحجوزة غير المستخدمة تقرير CI بدلاً من أن تبقى في SDK العامة كدين
توافق خامل.

للاطلاع على دليل تأليف Plugin، راجع [نظرة عامة على SDK الخاصة بـ Plugin](/ar/plugins/sdk-overview).

## مدخل Plugin

| المسار الفرعي                  | الصادرات الأساسية                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر مزود الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                             |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                  |

### مساعدات التوافق والاختبار المهملة

تظل هذه المسارات الفرعية صادرات للحزمة من أجل Plugins الأقدم ومجموعات اختبار OpenClaw،
لكن يجب ألا تضيف التعليمة البرمجية الجديدة عمليات استيراد منها: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, و`zod`. استورد `zod` مباشرة من `zod` في تعليمة Plugin البرمجية الجديدة.
لا يزال `plugin-test-runtime` مسارًا فرعيًا نشطًا ومركّزًا لمساعدات الاختبار.

### المسارات الفرعية العامة المهملة غير المستخدمة

وُجدت هذه المسارات الفرعية العامة لمدة شهر واحد على الأقل، ولا تحتوي حاليًا على
استيرادات إنتاجية من الإضافات المضمّنة. تظل قابلة للاستيراد من أجل التوافق،
لكن يجب أن تستخدم تعليمة Plugin البرمجية الجديدة بدلاً منها مسارات SDK الفرعية المركّزة
والمستهلكة بنشاط:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, و`zalouser`.

### المسارات الفرعية العامة النادرة المهملة

المسارات الفرعية العامة التي يستخدمها حاليًا مالك واحد أو مالكان فقط من مالكي Plugins
المضمّنة مهملة أيضًا لتعليمة Plugin البرمجية الجديدة. تظل صادرات للحزمة من أجل التوافق،
لكن يجب أن تفضل التعليمة البرمجية الجديدة واجهات SDK المشتركة النشطة أو واجهات API
الخاصة بالحزم المملوكة لـ Plugin. يتتبع المشرفون المجموعة الدقيقة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` والميزانية الحالية
باستخدام `pnpm plugin-sdk:surface`.

### البراميل الواسعة المهملة

تظل براميل إعادة التصدير الواسعة هذه قابلة للبناء من أجل مصدر OpenClaw
وفحوصات التوافق، لكن يجب أن تفضل التعليمة البرمجية الجديدة مسارات SDK الفرعية المركّزة:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, و
`text-runtime`. تظل `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
و`text-runtime` صادرات للحزمة فقط من أجل التوافق مع الإصدارات السابقة؛ استخدم
بدلاً منها مسارات channel/runtime الفرعية المركّزة، و`config-contracts`،
و`string-coerce-runtime`، و`text-chunking`، و`text-utility-runtime`،
و`logging-core`.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | عمليات التصدير الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، و`defineSetupPluginEntry`، و`createChatChannelPlugin`، و`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد التحقق من صحة JSON Schema المخزن مؤقتا للمخططات المملوكة للـ Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، و`createOptionalChannelSetupAdapter`، و`createOptionalChannelSetupWizard`، إضافة إلى `DEFAULT_ACCOUNT_ID`، و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و`splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قوائم السماح، ومنشئات حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`، و`createEnvPatchedAccountSetupAdapter`، و`createSetupInputPresenceValidator`، و`noteChannelLookupFailure`، و`noteChannelLookupSummary`، و`promptResolvedAllowFrom`، و`splitSetupEntries`، و`createAllowlistSetupWizardProxy`، و`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، و`detectBinary`، و`extractArchive`، و`resolveBrewExecutable`، و`formatDocsLink`، و`CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات الحسابات المتعددة وبوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تسوية معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب والرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات وإجراءات الحساب |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة السماح لمجموعات الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | مساعدات مسار الرد القديمة. يجب أن تستخدم شيفرة مسار رد القناة الجديدة `createChannelMessageReplyPipeline` و`resolveChannelMessageSourceReplyDeliveryMode` من `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، و`resolveChannelDmAccess`، و`resolveChannelDmAllowFrom`، و`resolveChannelDmPolicy`، و`normalizeChannelDmPolicy`، و`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | أوليات مخطط إعدادات القناة المشتركة، إضافة إلى منشئات Zod ومنشئات JSON/TypeBox المباشرة |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات قنوات OpenClaw المجمعة للـ Plugin المجمعة والمحافظة عليها فقط |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق مع مخططات إعدادات القنوات المجمعة |
    | `plugin-sdk/telegram-command-config` | مساعدات تسوية أوامر Telegram المخصصة والتحقق منها مع رجوع إلى عقد مجمع |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة ومنخفضة المستوى لدخول القناة. يجب أن تستخدم مسارات الاستقبال الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل تجريبي عالي المستوى لوقت تشغيل دخول القناة ومنشئات حقائق المسارات لمسارات استقبال القنوات المرحلة. فضله على تجميع قوائم السماح الفعالة، وقوائم السماح للأوامر، والإسقاطات القديمة في كل Plugin. راجع [واجهة برمجة تطبيقات دخول القناة](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، و`createChannelRunQueue`، ومساعدات دورة حياة تدفق المسودة القديمة. يجب أن تستخدم شيفرة إنهاء المعاينة الجديدة `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | مساعدات رخيصة لعقد دورة حياة الرسائل مثل `defineChannelMessageAdapter`، و`createChannelMessageAdapterFromOutbound`، و`createChannelMessageReplyPipeline`، و`createReplyPrefixContext`، و`resolveChannelMessageSourceReplyDeliveryMode`، واشتقاق قابلية الإنهاء الدائم، ومساعدات إثبات القابلية لقابليات الإرسال/الإيصال/الأثر الجانبي، و`MessageReceiveContext`، وإثباتات سياسة إقرار الاستقبال، و`defineFinalizableLivePreviewAdapter`، و`deliverWithFinalizableLivePreviewAdapter`، وإثباتات قابلية المعاينة الحية والمنهي الحي، وحالة الاسترداد الدائم، و`RenderedMessageBatch`، وأنواع إيصال الرسائل، ومساعدات معرف الإيصال. راجع [واجهة برمجة تطبيقات رسائل القناة](/ar/plugins/sdk-channel-message). واجهات إرسال الرد القديمة مهملة ومخصصة للتوافق فقط. |
    | `plugin-sdk/channel-message-runtime` | مساعدات التسليم وقت التشغيل التي قد تحمل تسليم الصادر، بما في ذلك `deliverInboundReplyWithMessageSendContext`، و`sendDurableMessageBatch`، و`withDurableMessageSendContext`. تبقى جسور إرسال الرد المهملة قابلة للاستيراد لمرسلات التوافق فقط. استخدمها من وحدات وقت تشغيل المراقبة/الإرسال، لا من ملفات تمهيد Plugin الساخنة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد والمغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة قديمة للتسجيل والإرسال للوارد، ومسندات الإرسال المرئي/النهائي، وتوافق `deliverDurableInboundReplyPayload` المهمل لمرسلات القنوات المحضرة. يجب أن تستورد شيفرة استقبال/إرسال القنوات الجديدة مساعدات دورة حياة وقت التشغيل من `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل الأهداف ومطابقتها |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل وسائط الصادر |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف الوزن عن تبعيات إرسال الصادر لمحولات القناة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية الصادر، ومفوض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة. مساعدات التسليم المباشر مثل `deliverOutboundPayloads` هي ركيزة توافق مهملة؛ استخدم `plugin-sdk/channel-message-runtime` لمسارات الإرسال الجديدة. |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتسوية الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط الخيوط والمحولات |
    | `plugin-sdk/agent-media-payload` | منشئ قديم لحمولة وسائط الوكيل |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط الخيوط والاقتران والربط المكون |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة حالة القناة وملخصها |
    | `plugin-sdk/channel-config-primitives` | أوليات ضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيد مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تحرير/قراءة إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حراسة الرسائل المباشرة |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة للمنشور `@openclaw/discord@2026.3.13` وتوافق المالك المتتبع؛ يجب أن تستخدم الـ Plugin الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram لتوافق المالك المتتبع؛ يجب أن تستخدم الـ Plugin الجديدة مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق مهملة لـ Zalo Personal للحزم المنشورة Lark/Zalo التي لا تزال تستورد تفويض أوامر المرسل؛ يجب أن تستخدم الـ Plugin الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | مساعدات دلالية لعرض الرسائل وتسليمها والردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حزمة توافق للوارد لإزالة التكرار، ومطابقة الإشارات، ومساعدات سياسة الإشارات، ومساعدات المغلفات |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة تكرار الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارات، وعلامة الإشارة، ونص الإشارة من دون سطح وقت تشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق مغلف الوارد |
    | `plugin-sdk/channel-location` | سياق موقع القناة ومساعدات التنسيق |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لإسقاطات الوارد وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتيجة الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، إضافة إلى مساعدات المخططات الأصلية المهملة المحتفظ بها لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتسوية المسارات، وحل الأهداف المعتمد على المحلل، وتحويل معرف الخيط إلى سلسلة، ومفاتيح المسارات لإزالة التكرار/الضغط، وأنواع الأهداف المحللة، ومساعدات مقارنة المسار/الهدف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/ردود الفعل |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للموفّر">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة موفّر LM Studio المدعومة للإعداد، واكتشاف الكتالوج، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لافتراضيات الخادم المحلي، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد منتقاة للموفّرين المحليين/ذوي الاستضافة الذاتية |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مركّزة للموفّرين ذوي الاستضافة الذاتية المتوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | افتراضيات الواجهة الخلفية لـ CLI + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حلّ مفاتيح API في وقت التشغيل لإضافات الموفّرين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات التهيئة/كتابة الملف الشخصي لمفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, تصدير توافق مهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, منشئو سياسات إعادة التشغيل المشتركون، ومساعدات نقاط نهاية الموفّر، ومساعدات مشتركة لتطبيع معرّفات النماذج |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل إثراء كتالوج الموفّرين وواجهات سجل إضافات الموفّرين لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط النهاية للموفّر، وأخطاء HTTP الخاصة بالموفّر، ومساعدات نماذج الأجزاء المتعددة لتفريغ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لتكوين/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لموفّر جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتكوين/اعتمادات بحث الويب للموفّرين الذين لا يحتاجون إلى توصيل تفعيل الإضافات |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد ضيقة لتكوين/اعتمادات بحث الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحدِّدات/جوالب الاعتمادات محددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لموفّر بحث الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع مغلّفات البث، ومساعدات مغلّفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفّر الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تكوين التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات المفردة/الخريطة/ذاكرة التخزين المؤقت المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، مساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، ومساعدات تفويض المرسِل |
    | `plugin-sdk/command-status` | منشئو رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حلّ المعتمِد ومصادقة الإجراءات في المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات الملف الشخصي/المرشح الأصلية لموافقة التنفيذ |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات قدرات/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحلّ Gateway الموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّلات الموافقة الأصلية لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ فضّل واجهات المهايئ/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة ردّ موافقة التنفيذ/الإضافة |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقة التنفيذ/الإضافة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المنظّم مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة من دون الحزمة الاختبارية الواسعة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات خفيفة لنصوص الأوامر لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقود الأسرار لأسطح أسرار القنوات/الإضافات |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/التكوين |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وحجب الرسائل المباشرة، ومساعدات الملفات/المسارات المحدودة بالجذر بما في ذلك عمليات الكتابة للإنشاء فقط، واستبدال الملفات الذري المتزامن/غير المتزامن، وكتابات الملفات المؤقتة الشقيقة، والانتقال الاحتياطي للنقل عبر الأجهزة، ومساعدات مخزن الملفات الخاصة، وحراس الآباء للروابط الرمزية، والمحتوى الخارجي، وتنقيح النصوص الحساسة، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للموزّع المثبّت من دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | الموزّع المثبّت، والجلب المحروس من SSRF، وخطأ SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook والتحويل الخام لمقبس الويب/الجسم |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة جسم الطلب |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة وقت التشغيل والمسجل والمهلة وإعادة المحاولة والتراجع |
    | `plugin-sdk/browser-config` | واجهة تكوين المتصفح المدعومة للملفات الشخصية/الإعدادات الافتراضية المطبعة، وتحليل عناوين URL الخاصة بـ CDP، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات خارجية أقدم؛ يجب أن تستورد Plugins الجديدة `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات خارجية أقدم؛ يجب أن تستورد Plugins الجديدة المسارات الفرعية العامة لـ SDK مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/http/تفاعلية الخاصة بـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار معالجة Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار واستدعاء الوسائط ومجموعات الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء العميل الجاهز لحلقة الأحداث، وRPC الخاص بـ CLI لـ Gateway، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح تكوين مركز ومخصص للأنواع فقط لأشكال تكوين Plugin مثل `OpenClawConfig` وأنواع تكوين القناة/المزود |
    | `plugin-sdk/plugin-config-runtime` | مساعدات بحث تكوين Plugin في وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل التكوين بأسلوب المعاملات مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة تكوين العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المضمن غير متاح |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات دون حزمة النص الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات وقت التشغيل المشتركة للوارد/الرد، والتقسيم إلى أجزاء، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال/إنهاء الرد وتسميات المحادثات |
    | `plugin-sdk/reply-history` | مساعدات ومؤشرات سجل الردود قصيرة النافذة المشتركة مثل `buildHistoryContext` و`HISTORY_CONTEXT_MARKER` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتقسيم النص/Markdown إلى أجزاء |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات ومفتاح الجلسة ووقت التحديث وتعديل المخزن |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات توجيه/مفتاح جلسة/ربط حساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وإعدادات حالة وقت التشغيل الافتراضية، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لمحلل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع الشرائح/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر موقوت مع نتائج stdout/stderr مطبعة |
    | `plugin-sdk/param-readers` | قارئات معلمات مشتركة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقتة ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مساعدات مسجل الأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل تكوين مزود المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الرد |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل الواجهة الخلفية لـ ACP وإرسال الرد لـ Plugins المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط دون استيرادات بدء تشغيل دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات محددة لمخطط تكوين وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معلمات منطقية مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقناة السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات رد أمر/مزود `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق به لأحزمة الوكيل منخفضة المستوى: أنواع الحزمة، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة وقت التشغيل، وتصنيف نتائج الطرفية، ومساعدات تنسيق/تفاصيل تقدم الأداة، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة لاكتشاف نقطة نهاية Z.AI المملوكة للمزود؛ استخدم واجهة API العامة لـ Plugin الخاص بـ Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة وقت التشغيل الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياسات نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات إيقاظ Heartbeat وحدثه وظهوره |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي |
    | `plugin-sdk/secure-random-runtime` | مساعدات رمز آمن/UUID |
    | `plugin-sdk/system-event-runtime` | مساعدات قائمة انتظار أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/infra-runtime` | رقاقة توافق مهملة؛ استخدم المسارات الفرعية المركزة لوقت التشغيل أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات ذاكرة تخزين مؤقت صغيرة ومحدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علم التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء البياني والتنسيق وتصنيف الأخطاء المشتركة، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch مغلفة، والوكيل، وخيار EnvHttpProxyAgent، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل واعية بالمرسل دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية دون توجيه الربط المكون أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات دون استيرادات واسعة لكتابة/صيانة التكوين |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وترشيح السياق التكميلي دون استيرادات واسعة للتكوين/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة لتحويل وتطبيع السجلات/السلاسل البدائية دون استيرادات markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات تكوين إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدليل المدعوم بالتكوين |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانات والاختبار">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، واستكشاف أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
    | `plugin-sdk/media-mime` | تطبيع MIME ضيق، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتجاوز فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزودي فهم الوسائط، إضافة إلى تصديرات مساعدات الصور/الصوت الموجهة للمزودين |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/تصيير النص وMarkdown، وتحويل جداول Markdown، وإزالة وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودي الكلام، إضافة إلى تصديرات التوجيه والسجل والتحقق والباني المتوافق مع OpenAI لـ TTS ومساعدات الكلام الموجهة للمزودين |
    | `plugin-sdk/speech-core` | أنواع مزودي الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وتصديرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزودي النسخ في الوقت الفعلي، ومساعدات السجل، ومساعد جلسات WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع مزودي الصوت في الوقت الفعلي ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودي توليد الصور، إضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني مزود الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، وتجاوز الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات تجاوز الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات تجاوز الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير توافق مهملة؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | ملف تجميعي محلي في المستودع للتوافق المهمل مع اختبارات OpenClaw القديمة. يجب أن تستورد اختبارات المستودع الجديدة مسارات اختبار محلية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` محلي أدنى في المستودع لاختبارات وحدة تسجيل Plugin المباشرة من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول وقت تشغيل الوكيل الأصلية المحلية في المستودع لاختبارات المصادقة والتسليم والرجوع وخطاف الأدوات وتراكب المطالبة والمخطط وإسقاط النص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار محلية في المستودع موجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الدليل، ودورة حياة بدء تشغيل الحساب، وربط تهيئة الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | حزمة حالات أخطاء مشتركة محلية في المستودع لتحليل الأهداف في اختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات محلية في المستودع لعقود حزمة Plugin والتسجيل والأثر العام والاستيراد المباشر وواجهة API وقت التشغيل والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات محلية في المستودع لعقود وقت تشغيل المزود والمصادقة والاكتشاف والإعداد الأولي والكتالوج والمعالج وإمكانات الوسائط وسياسة الإعادة وصوت STT الحي في الوقت الفعلي والبحث/الجلب عبر الويب والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات Vitest HTTP/مصادقة اختيارية محلية في المستودع لاختبارات المزودين التي تمرن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات محلية عامة في المستودع لالتقاط وقت تشغيل CLI، وسياق صندوق العزل، وكاتب Skills، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمنة، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات المطبوعة |
    | `plugin-sdk/test-node-mocks` | مساعدات محلية مركزة في المستودع لمحاكاة المكونات المضمنة في Node للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/التهيئة/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمينات مضيف الذاكرة، ووصول السجل، والمزود المحلي، ومساعدات الدُفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للبائع لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة لـ Plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    لا توجد حاليا أي مسارات فرعية محجوزة لـ SDK للمساعدات المضمنة. تعيش
    المساعدات الخاصة بالمالك داخل حزمة Plugin المالكة، بينما تستخدم عقود المضيف
    القابلة لإعادة الاستخدام مسارات SDK فرعية عامة مثل `plugin-sdk/gateway-runtime`
    و`plugin-sdk/security-runtime` و`plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
