---
read_when:
    - اختيار المسار الفرعي المناسب لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّنة وواجهات المساعدة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أين توجد الاستيرادات، مجمّعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض SDK الخاصة بـ Plugin كمجموعة من المسارات الفرعية العامة الضيقة تحت
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمّعة حسب
الغرض. يوجد مخزون نقطة إدخال المصرّف المولّد في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتمثل صادرات الحزمة المجموعة العامة
بعد طرح المسارات الفرعية المحلية للاختبارات/الداخلية في المستودع والمذكورة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يمكن للمشرفين تدقيق
عدد الصادرات العامة باستخدام `pnpm plugin-sdk:surface`، والمسارات الفرعية المساعدة
المحجوزة النشطة باستخدام `pnpm plugins:boundary-report:summary`؛ وتؤدي الصادرات
المساعدة المحجوزة غير المستخدمة إلى فشل تقرير CI بدل أن تبقى في SDK العامة
كدَين توافق خامل.

لدليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## إدخال Plugin

| المسار الفرعي                 | الصادرات الرئيسية                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر مزوّد الترحيل مثل `createMigrationItem`، وثوابت الأسباب، ومؤشرات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                             |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                                   |

### مساعدات التوافق والاختبار المهملة

تبقى هذه المسارات الفرعية صادرات حزمة من أجل Plugins الأقدم ومجموعات اختبارات OpenClaw،
لكن يجب ألا تضيف الشيفرة الجديدة عمليات استيراد منها: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, و`zod`. استورد `zod` مباشرة من `zod` في شيفرة Plugin الجديدة.
لا يزال `plugin-test-runtime` مسارًا فرعيًا مساعدًا نشطًا ومركّزًا للاختبار.

### المسارات الفرعية العامة المهملة غير المستخدمة

وُجدت هذه المسارات الفرعية العامة لمدة شهر واحد على الأقل ولا تحتوي حاليًا على
عمليات استيراد إنتاجية من الإضافات المضمّنة. تبقى قابلة للاستيراد من أجل التوافق،
لكن يجب أن تستخدم شيفرة Plugin الجديدة مسارات SDK فرعية مركّزة ومستهلكة بفعالية بدلًا منها:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, و`zalouser`.

### المسارات الفرعية العامة النادرة المهملة

المسارات الفرعية العامة المستخدمة حاليًا من قِبل مالك أو مالكين فقط من مالكي Plugin
المضمّنة مهملة أيضًا لشيفرة Plugin الجديدة. تبقى صادرات حزمة من أجل التوافق،
لكن يجب أن تفضّل الشيفرة الجديدة وصلات SDK المشتركة النشطة أو APIs الحزم المملوكة
من Plugin. يتتبع المشرفون المجموعة الدقيقة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` والميزانية الحالية
باستخدام `pnpm plugin-sdk:surface`.

### البراميل الواسعة المهملة

تبقى براميل إعادة التصدير الواسعة هذه قابلة للبناء لمصدر OpenClaw
وفحوصات التوافق، لكن يجب أن تفضّل الشيفرة الجديدة مسارات SDK فرعية مركّزة:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, و
`text-runtime`. تبقى `channel-runtime`, و`compat`, و`config-types`, و`infra-runtime`,
و`text-runtime` صادرات حزمة فقط للتوافق مع الإصدارات السابقة؛ استخدم بدلًا منها
مسارات channel/runtime الفرعية المركّزة، و`config-contracts`, و`string-coerce-runtime`,
و`text-chunking`, و`text-utility-runtime`, و`logging-core`.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد تحقق JSON Schema مخزن مؤقتا للمخططات المملوكة للـ Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، مطالبات قائمة السماح، منشئو حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات متعددة الحسابات/بوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، مساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات محدودة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة سماح مجموعة الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | مساعدات مسار الرد القديم. يجب أن تستخدم شيفرة مسار رد القناة الجديدة `createChannelMessageReplyPipeline` و`resolveChannelMessageSourceReplyDeliveryMode` من `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط إعدادات القناة المشتركة بالإضافة إلى منشئات Zod وJSON/TypeBox المباشرة |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات قنوات OpenClaw المجمعة للـ Plugins المجمعة المصانة فقط |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق لمخططات إعدادات القنوات المجمعة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع رجوع إلى العقد المجمع |
    | `plugin-sdk/command-gating` | مساعدات محدودة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة ومنخفضة المستوى لدخول القنوات. يجب أن تستخدم مسارات الاستقبال الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل وقت تشغيل تجريبي وعالي المستوى لدخول القنوات ومنشئو حقائق المسار لمسارات استقبال القنوات المرحلة. فضّل هذا على تجميع قوائم السماح الفعالة، وقوائم سماح الأوامر، والإسقاطات القديمة في كل Plugin. راجع [واجهة برمجة تطبيقات دخول القنوات](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`، ومساعدات دورة حياة تدفق المسودة القديمة. يجب أن تستخدم شيفرة إنهاء المعاينة الجديدة `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | مساعدات عقد دورة حياة الرسائل الخفيفة مثل `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`، واشتقاق إمكانية الإنهاء الدائم، ومساعدات إثبات الإمكانات لإمكانات الإرسال/الإيصال/الأثر الجانبي، و`MessageReceiveContext`، وإثباتات سياسة إقرار الاستلام، و`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`، وإثباتات إمكانات المعاينة الحية والمنهي الحي، وحالة الاسترداد الدائمة، و`RenderedMessageBatch`، وأنواع إيصال الرسائل، ومساعدات معرّف الإيصال. راجع [واجهة برمجة تطبيقات رسائل القناة](/ar/plugins/sdk-channel-message). واجهات إرسال الردود القديمة مخصصة للتوافق المهمل فقط. |
    | `plugin-sdk/channel-message-runtime` | مساعدات تسليم وقت التشغيل التي قد تحمّل التسليم الصادر، بما في ذلك `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, و`withDurableMessageSendContext`. تبقى جسور إرسال الردود المهملة قابلة للاستيراد لمرسلات التوافق فقط. استخدمها من وحدات وقت تشغيل المراقبة/الإرسال، وليس من ملفات تمهيد Plugin الساخنة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + الغلاف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة قديمة للتسجيل والإرسال الوارد، ومسندات الإرسال المرئية/النهائية، وتوافق `deliverDurableInboundReplyPayload` المهمل لمرسلات القنوات المحضّرة. يجب أن تستورد شيفرة استقبال/إرسال القناة الجديدة مساعدات دورة حياة وقت التشغيل من `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الهدف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف عن تبعيات الإرسال الصادر لمهايئات القنوات |
    | `plugin-sdk/outbound-runtime` | مساعدات الهوية الصادرة، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة. مساعدات التسليم المباشر مثل `deliverOutboundPayloads` هي طبقة توافق أساسية مهملة؛ استخدم `plugin-sdk/channel-message-runtime` لمسارات الإرسال الجديدة. |
    | `plugin-sdk/poll-runtime` | مساعدات محدودة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط السلاسل والمهايئ |
    | `plugin-sdk/agent-media-payload` | منشئ حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/السلسلة، والاقتران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة/ملخص حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات محدودة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيد Plugin القناة المشتركة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تحرير/قراءة إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار وصول المجموعة |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حراسة الرسائل المباشرة |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة لـ `@openclaw/discord@2026.3.13` المنشورة وتوافق المالك المتتبع؛ يجب أن تستخدم Plugins الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق Telegram مهملة لحل الحسابات من أجل توافق المالك المتتبع؛ يجب أن تستخدم Plugins الجديدة مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق Zalo Personal مهملة لحزم Lark/Zalo المنشورة التي لا تزال تستورد تفويض أمر المرسل؛ يجب أن تستخدم Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | مساعدات دلالية لعرض الرسائل وتسليمها والردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ملف تجميعي للتوافق لإزالة التكرار الوارد، ومطابقة الإشارات، ومساعدات سياسة الإشارات، ومساعدات الغلاف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات محدودة لإزالة التكرار الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات محدودة لسياسة الإشارات، وعلامة الإشارة، ونص الإشارة دون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات محدودة لتنسيق الغلاف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لإسقاطات الوارد وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتيجة الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلية المهملة المحفوظة لتوافق Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسارات، وحل الأهداف المدفوع بالمحلل، وتحويل معرّف السلسلة إلى سلسلة نصية، وإلغاء تكرار/ضغط مفاتيح المسارات، وأنواع الأهداف المحللة، ومقارنة المسارات/الأهداف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الهدف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات محدودة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة مزوّد LM Studio المدعومة للإعداد واكتشاف الكتالوج وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة للإعدادات الافتراضية للخادم المحلي، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد منتقاة للمزوّدين المحليين/ذاتيي الاستضافة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مركّزة للمزوّدين ذاتيي الاستضافة المتوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفتاح API في وقت التشغيل لـ Plugins المزوّدين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات الإلحاق/كتابة ملف التعريف لمفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, تصدير توافق مهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, منشئات سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج المشتركة |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل تعزيز كتالوج المزوّد وواجهات سجل Plugin-المزوّد لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات قدرات HTTP/نقاط النهاية العامة للمزوّد، وأخطاء HTTP للمزوّد، ومساعدات نماذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لإعداد/اختيار جلب الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لمزوّد جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعداد/اعتماد ضيقة لبحث الويب للمزوّدين الذين لا يحتاجون توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات عقد ضيقة لإعداد/اعتماد بحث الويب مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` ومحدِّدات/جوالب الاعتمادات المحددة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لمزوّد بحث الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, وتنظيف مخطط Gemini + التشخيصات |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, أنواع مغلفات البث، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعداد الإلحاق |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, مساعدات سجل الأوامر، بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المرسِل |
    | `plugin-sdk/command-status` | منشئات رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافق ومصادقة الإجراء في المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف تعريف/مرشح موافقة التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرة/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات تحميل مهايئ الموافقة الأصلي خفيف الوزن لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ فضّل واجهات المهايئ/Gateway الأضيق عندما تكفي |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة الأصلي + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد موافقة التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقة التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، ومساعدات عرض الموافقة المنظَّم مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة ضبط إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة من دون حزمة الاختبار العامة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلي |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات نص أوامر خفيفة الوزن لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القنوات/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | الثقة المشتركة، وحجب الرسائل المباشرة، ومساعدات الملفات/المسارات المحدودة بالجذر، بما في ذلك الكتابات الخاصة بالإنشاء فقط، واستبدال الملفات الذري المتزامن/غير المتزامن، وكتابات الملفات المؤقتة الشقيقة، والرجوع الاحتياطي للنقل عبر الأجهزة، ومساعدات مخزن الملفات الخاصة، وحراس أصل الروابط الرمزية، والمحتوى الخارجي، وتنقيح النص الحساس، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيف وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للموزِّع المثبّت من دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | الموزِّع المثبّت، والجلب المحروس ضد SSRF، وخطأ SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وإكراه websocket/الجسم الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة |
  </Accordion>

  <Accordion title="مسارات وقت التشغيل والتخزين الفرعية">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات محددة لبيئة وقت التشغيل والمسجل والمهلة وإعادة المحاولة والتراجع |
    | `plugin-sdk/browser-config` | واجهة إعداد متصفح مدعومة لتطبيع الملف الشخصي/الإعدادات الافتراضية، وتحليل عنوان URL الخاص بـ CDP، ومساعدات مصادقة التحكم في المتصفح |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الأطراف الثالثة الأقدم؛ يجب على Plugins الجديدة استيراد `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الأطراف الثالثة الأقدم؛ يجب على Plugins الجديدة استيراد المسارات الفرعية العامة لـ SDK مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر وخطافات وHTTP والتفاعل الخاصة بـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار معالجة Webhook/الخطاف الداخلي |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسولة مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار واستدعاء الوسيطات ومجموعات الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء العميل الجاهز لحلقة الأحداث، وRPC الخاص بـ CLI لـ Gateway، وأخطاء بروتوكول Gateway، ومساعدات تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح إعداد يركز على الأنواع فقط لأشكال إعداد Plugin مثل `OpenClawConfig` وأنواع إعدادات القناة/الموفر |
    | `plugin-sdk/plugin-config-runtime` | مساعدات البحث عن إعداد Plugin في وقت التشغيل مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدات تعديل الإعدادات على نحو تعاملي مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | مساعدات لقطة إعداد العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومُعيّنات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أمر Telegram وفحوصات التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المضمّن غير متاح |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات من دون حزمة النصوص الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف الشخصي، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الموافقة المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات وقت تشغيل مشتركة للوارد/الرد، والتجزئة، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات محددة لإرسال/إنهاء الرد وتسميات المحادثات |
    | `plugin-sdk/reply-history` | مساعدات وعلامات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`HISTORY_CONTEXT_MARKER` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات محددة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات ومفتاح الجلسة ووقت التحديث وتعديل المخزن |
    | `plugin-sdk/cron-store-runtime` | مساعدات مسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدات مسار مجلد الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لتلخيص حالة القناة/الحساب، وافتراضات حالة وقت التشغيل، ومساعدات بيانات تعريف المشكلة |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لمحلل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع المعرّفات النصية/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت بنتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات شائعة لمعاملات الأداة/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأداة |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت ومساحات عمل مؤقتة خاصة وآمنة |
    | `plugin-sdk/logging-core` | مسجل النظام الفرعي ومساعدات التنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدات تجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدات حل إعداد موفر المحادثة |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل ملفات قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدات خفيفة لتسجيل الواجهة الخلفية لـ ACP وإرسال الردود لـ Plugins المحمّلة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء تشغيل دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات محددة لمخطط إعداد وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مشتركة لمساعدات القناة السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات رد أمر/موفر `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق لأدوات تسخير الوكيل منخفضة المستوى: أنواع أداة التسخير، ومساعدات توجيه/إجهاض التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة وقت التشغيل، وتصنيف مخرجات الطرفية، ومساعدات تنسيق/تفاصيل تقدم الأداة، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة لاكتشاف نقطة نهاية مملوكة لموفر Z.AI؛ استخدم واجهة API العامة لـ Plugin الخاصة بـ Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة وقت تشغيل صغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياس نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد تزامن مهام غير متزامنة محدود |
    | `plugin-sdk/dedupe-runtime` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد تفريغ عمليات التسليم الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدات إيقاظ Heartbeat والحدث والرؤية |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي قسري |
    | `plugin-sdk/secure-random-runtime` | مساعدات الرموز/UUID الآمنة |
    | `plugin-sdk/system-event-runtime` | مساعدات صف أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات وقت التشغيل الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علم التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدات رسم بياني للأخطاء وتنسيقها وتصنيف الأخطاء المشتركة، `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch مغلّفة، والوكيل، وخيار EnvHttpProxyAgent، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك للموزّع من دون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لمتن الاستجابة من دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المكوّن أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات من دون استيرادات واسعة لكتابة الإعدادات/الصيانة |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق التكميلي من دون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات محددة لتحويل وتطبيع السجلات البدائية/السلاسل من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات مجلد/هوية/مساحة عمل الوكيل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدليل المدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، واستكشاف أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولات الوسائط |
    | `plugin-sdk/media-mime` | تطبيع MIME محدود، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات محدودة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند فشل إنشاء الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزودي فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت/الاستخراج المنظم الموجهة للمزود |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/عرض النصوص وMarkdown، وتحويل جداول Markdown، وإزالة وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودي الكلام بالإضافة إلى صادرات التوجيه، والسجل، والتحقق، وباني TTS المتوافق مع OpenAI، ومساعدات الكلام الموجهة للمزود |
    | `plugin-sdk/speech-core` | أنواع مزودي الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزودي النسخ في الوقت الفعلي، ومساعدات السجل، ومساعد جلسة WebSocket المشتركة |
    | `plugin-sdk/realtime-voice` | أنواع مزودي الصوت في الوقت الفعلي ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودي إنشاء الصور بالإضافة إلى مساعدات أصول الصور/عناوين URL للبيانات وباني مزود الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع إنشاء الصور المشتركة، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة إنشاء الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع إنشاء الموسيقى المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة إنشاء الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع إنشاء الفيديو المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير توافق مهملة؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | حاوية توافق مهملة محلية للمستودع لاختبارات OpenClaw القديمة. يجب أن تستورد اختبارات المستودع الجديدة مسارات اختبار محلية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلا من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` أدنى محلي للمستودع لاختبارات وحدة تسجيل Plugin المباشر من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محول agent-runtime الأصلية المحلية للمستودع لاختبارات المصادقة، والتسليم، والاحتياط، وخطاف الأدوات، وتراكب الموجه، والمخطط، وإسقاط النص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجهة للقنوات ومحلية للمستودع لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الأدلة، ودورة حياة بدء الحساب، وترابط إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | مجموعة مشتركة محلية للمستودع لحالات أخطاء حل الأهداف لاختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات محلية للمستودع لعقود حزمة Plugin، والتسجيل، والأثر العام، والاستيراد المباشر، وواجهة برمجة تطبيقات وقت التشغيل، والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات محلية للمستودع لعقود وقت تشغيل المزود، والمصادقة، والاكتشاف، والإعداد، والفهرس، والمعالج، وقدرة الوسائط، وسياسة إعادة التشغيل، وSTT للصوت الحي في الوقت الفعلي، والبحث/الجلب عبر الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية ومحلية للمستودع في Vitest لاختبارات المزود التي تمرن `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات محلية للمستودع لالتقاط وقت تشغيل CLI عام، وسياق sandbox، وكاتب skill، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمن، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات ذات الأنواع |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة لمحليات Node المضمنة للاستخدام داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="مسارات الذاكرة الفرعية">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والمزود المحلي، ومساعدات الدفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك تخزين مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعددة الوسائط |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للبائع لمساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة للـ plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمنة">
    لا توجد حاليا مسارات فرعية محجوزة لـ SDK للمساعدات المضمنة. توجد
    المساعدات الخاصة بالمالك داخل حزمة Plugin المالكة، بينما تستخدم عقود المضيف
    القابلة لإعادة الاستخدام مسارات SDK فرعية عامة مثل `plugin-sdk/gateway-runtime`،
    و`plugin-sdk/security-runtime`، و`plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
