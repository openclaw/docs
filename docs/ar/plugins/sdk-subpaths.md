---
read_when:
    - اختيار المسار الفرعي المناسب لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّنة وواجهات الأدوات المساعدة
summary: 'دليل المسارات الفرعية لـ Plugin SDK: مواضع الاستيرادات، مجمّعة حسب المجال'
title: المسارات الفرعية لحزمة تطوير Plugin
x-i18n:
    generated_at: "2026-07-16T14:35:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض حزمة SDK الخاصة بالـ Plugin كمجموعة من المسارات الفرعية العامة المحددة ضمن
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمّعةً حسب
الغرض. تحدد ثلاثة ملفات هذه الواجهة:

- `scripts/lib/plugin-sdk-entrypoints.json`: قائمة نقاط الدخول المُصانة
  التي تُجمّعها عملية البناء.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: مسارات فرعية محلية
  للاختبارات/الاستخدام الداخلي في المستودع. صادرات الحزمة هي القائمة بعد استبعاد هذه اللائحة.
- `src/plugin-sdk/entrypoints.ts`: بيانات وصفية للتصنيف تخص المسارات الفرعية
  المهملة، والمساعدات المحجوزة المضمّنة، والواجهات المضمّنة المدعومة، والواجهات العامة
  المملوكة للـ Plugin.

يدقق المشرفون عدد الصادرات العامة باستخدام `pnpm plugin-sdk:surface` وعدد
المسارات الفرعية النشطة للمساعدات المحجوزة باستخدام `pnpm plugins:boundary-report:summary`؛
وتؤدي صادرات المساعدات المحجوزة غير المستخدمة إلى فشل تقرير CI بدلًا من بقائها في
SDK العام كدين توافق خامل.

للاطلاع على دليل إنشاء الـ Plugin، راجع [نظرة عامة على SDK الخاص بالـ Plugin](/ar/plugins/sdk-overview).

## نقطة دخول الـ Plugin

| المسار الفرعي                        | الصادرات الأساسية                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | مساعدات عناصر موفّر الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`resolvePlannedMigrationTargets`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                             |
| `plugin-sdk/health`            | تسجيل فحوصات السلامة في Doctor، وأنواع الاكتشاف والإصلاح والاختيار والخطورة والنتائج لمستهلكي السلامة المضمّنين                                                                                |
| `plugin-sdk/config-schema`     | مهمل. مخطط Zod الجذري `openclaw.json` ‏(`OpenClawSchema`)؛ عرّف بدلًا منه مخططات محلية للـ Plugin وتحقق منها باستخدام `plugin-sdk/json-schema-runtime`                                                  |

### مساعدات التوافق والاختبار المهملة

تظل المسارات الفرعية المهملة مُصدّرة للـ Plugins الأقدم، لكن ينبغي للكود الجديد استخدام
المسارات الفرعية المحددة لـ SDK أدناه. القائمة المُصانة هي
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ ويرفض CI
استيرادات الإنتاج المضمّنة منها. أما ملفات التصدير الجامعة الواسعة مثل `plugin-sdk/compat`،
و`plugin-sdk/config-types`، و`plugin-sdk/infra-runtime`، و
`plugin-sdk/text-runtime` فهي للتوافق فقط، و`plugin-sdk/zod` عبارة عن
إعادة تصدير للتوافق: استورد `zod` مباشرةً من `zod`. كما أن ملفات التصدير الجامعة
الواسعة للنطاقات `plugin-sdk/agent-runtime`، و`plugin-sdk/channel-lifecycle`،
و`plugin-sdk/channel-runtime`، و`plugin-sdk/cli-runtime`،
و`plugin-sdk/conversation-runtime`، و`plugin-sdk/hook-runtime`،
و`plugin-sdk/media-runtime`، و`plugin-sdk/plugin-runtime`، و
`plugin-sdk/security-runtime` مهملة أيضًا لصالح المسارات الفرعية
المحددة.

أصبحت المسارات الفرعية لمساعدات الاختبار في OpenClaw، والمدعومة بـ Vitest، محلية للمستودع فقط ولم تعد
ضمن صادرات الحزمة: `agent-runtime-test-contracts`،
`channel-contract-testing`، و`channel-target-testing`، و`channel-test-helpers`،
و`plugin-state-test-runtime`، و`plugin-test-api`، و`plugin-test-contracts`،
و`plugin-test-runtime`، و`provider-http-test-mocks`، و`provider-test-contracts`،
و`reply-payload-testing`، و`sqlite-runtime-testing`، و`test-env`، و`test-fixtures`،
و`test-node-mocks`، و`testing`. كما أن واجهتي المساعدات المضمّنتين الخاصتين
`ssrf-runtime-internal` و`codex-native-task-runtime` محليتان للمستودع
فقط.

### المسارات الفرعية المحجوزة لمساعدات الـ Plugin المضمّنة

`plugin-sdk/codex-mcp-projection` هو المسار الفرعي المحجوز الوحيد: واجهة توافق مملوكة للـ Plugin
من أجل Plugin ‏Codex المضمّن، وليست واجهة API عامة لـ SDK.
تحظر ضوابط عقد الحزمة الاستيرادات بين Plugins ذات مالكين مختلفين، و
يفشل CI عندما يتوقف استيراد مسار فرعي محجوز.
`plugin-sdk/codex-native-task-runtime` محلي للمستودع فقط وليس ضمن صادرات
الحزمة.

يتتبع `src/plugin-sdk/entrypoints.ts` أيضًا الواجهات المضمّنة المدعومة، وهي نقاط دخول SDK
المدعومة بواسطة الـ Plugin المضمّن الخاص بها إلى أن تحل العقود العامة
محلها: `plugin-sdk/discord`، و`plugin-sdk/lmstudio`، و`plugin-sdk/lmstudio-runtime`،
و`plugin-sdk/matrix`، و`plugin-sdk/mattermost`،
و`plugin-sdk/memory-core-engine-runtime`، و`plugin-sdk/provider-zai-endpoint`،
و`plugin-sdk/qa-runner-runtime`، و`plugin-sdk/telegram-account`،
و`plugin-sdk/tts-runtime`، و`plugin-sdk/zalouser`. كما أن العديد منها
مهمل للكود الجديد؛ راجع الملاحظات الخاصة بكل صف أدناه.

  <AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`، `defineSetupPluginEntry`، `createChatChannelPlugin`، `createChannelPluginBase`، `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | أداة مساعدة مخزنة مؤقتًا للتحقق من JSON Schema للمخططات المملوكة للـ plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
    | `plugin-sdk/setup` | أدوات مساعدة مشتركة لمعالج الإعداد، ومترجم الإعداد، ومطالبات قوائم السماح، ومنشئات حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`، `createPatchedAccountSetupAdapter`، `createEnvPatchedAccountSetupAdapter`، `createSetupInputPresenceValidator`، `noteChannelLookupFailure`، `noteChannelLookupSummary`، `promptResolvedAllowFrom`، `splitSetupEntries`، `createAllowlistSetupWizardProxy`، `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`، `detectBinary`، `extractArchive`، `resolveBrewExecutable`، `formatDocsLink`، `CONFIG_DIR` |
    | `plugin-sdk/account-core` | أدوات مساعدة لإعداد الحسابات المتعددة وبوابة الإجراءات، وأدوات مساعدة للرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، وأدوات مساعدة لتسوية معرّف الحساب |
    | `plugin-sdk/account-resolution` | أدوات مساعدة للبحث عن الحساب والرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-helpers` | أدوات مساعدة محدودة لقائمة الحسابات وإجراءات الحساب |
    | `plugin-sdk/access-groups` | أدوات مساعدة لتحليل قائمة السماح لمجموعات الوصول وتشخيص المجموعات مع تنقيح البيانات الحساسة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`، `resolveChannelDmAccess`، `resolveChannelDmAllowFrom`، `resolveChannelDmPolicy`، `normalizeChannelDmPolicy`، `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | أساسيات مشتركة لمخطط إعداد القناة، بالإضافة إلى Zod ومنشئات JSON/TypeBox المباشرة |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات إعداد قنوات OpenClaw المضمّنة للـ plugins المضمّنة والخاضعة للصيانة فقط |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`، `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`، `ChatChannelId`. معرّفات قنوات الدردشة المضمّنة/الرسمية القياسية، بالإضافة إلى تسميات/أسماء مستعارة للمنسّق، للـ plugins التي تحتاج إلى التعرّف على النص ذي بادئة الغلاف دون ترميز جدولها الخاص بصورة ثابتة. |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق لمخططات إعداد القنوات المضمّنة |
    | `plugin-sdk/telegram-command-config` | تسوية مهملة لأسماء أوامر Telegram وأوصافها، وفحوصات التكرار/التعارض؛ استخدم معالجة إعداد الأوامر المحلية للـ plugin في شيفرة الـ plugin الجديدة |
    | `plugin-sdk/command-gating` | أدوات مساعدة محدودة لبوابة تخويل الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | محلّل تجريبي عالي المستوى لوقت تشغيل دخول القنوات ومنشئات حقائق المسار لمسارات استقبال القنوات التي جرى ترحيلها. يُفضّل استخدامه بدلًا من تجميع قوائم السماح الفعلية وقوائم سماح الأوامر والإسقاطات القديمة في كل plugin. راجع [واجهة API لدخول القنوات](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | عقود دورة حياة الرسائل، بالإضافة إلى خيارات مسار الرد، والإيصالات، والمعاينة المباشرة/البث، وأدوات دورة الحياة، وهوية الإرسال الصادر، وتخطيط الحمولة، وعمليات الإرسال الدائمة، وأدوات سياق إرسال الرسائل. راجع [واجهة API للإرسال الصادر عبر القنوات](/ar/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | اسم مستعار مهمل للتوافق مع `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | اسم مستعار مهمل للتوافق مع `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | أدوات مساعدة مشتركة لإنشاء المسار الوارد والغلاف |
    | `plugin-sdk/inbound-reply-dispatch` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-inbound` لمشغّلات الوارد وشروط الإرسال، و`plugin-sdk/channel-outbound` لأدوات تسليم الرسائل. |
    | `plugin-sdk/messaging-targets` | اسم مستعار مهمل لتحليل الوجهة؛ استخدم `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | أدوات مساعدة مشتركة لتحميل الوسائط الصادرة وحالة الوسائط المستضافة |
    | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | أدوات مساعدة محدودة لتسوية استطلاعات الرأي |
    | `plugin-sdk/thread-bindings-runtime` | دورة حياة ربط سلاسل المحادثات وأدوات المحوّل |
    | `plugin-sdk/agent-media-payload` | جذور حمولات وسائط الوكيل وأدوات تحميلها |
    | `plugin-sdk/conversation-runtime` | ملف تصدير شامل مهمل لأدوات ربط المحادثات/سلاسل المحادثات والاقتران والربط المُعدّ؛ يُفضّل استخدام مسارات فرعية مركّزة للربط مثل `plugin-sdk/thread-bindings-runtime` و`plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | أدوات مساعدة لحل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | أدوات مساعدة مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | أساسيات محدودة لمخطط إعداد القناة |
    | `plugin-sdk/channel-config-writes` | أدوات مساعدة لتخويل كتابة إعداد القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات التمهيد المشتركة لـ plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | أدوات مساعدة لتحرير/قراءة إعداد قائمة السماح |
    | `plugin-sdk/group-access` | أدوات مساعدة مهملة لاتخاذ قرارات الوصول إلى المجموعات؛ استخدم `resolveChannelMessageIngress` من `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`، `plugin-sdk/direct-dm-access` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | أدوات مساعدة محدودة لسياسة حارس الرسائل المباشرة قبل التشفير |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة لـ `@openclaw/discord@2026.3.13` المنشور وتوافق المالك المتتبَّع؛ ينبغي للـ plugins الجديدة استخدام المسارات الفرعية العامة لحزمة SDK الخاصة بالقنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram من أجل توافق المالك المتتبَّع؛ ينبغي للـ plugins الجديدة استخدام أدوات وقت التشغيل المحقونة أو المسارات الفرعية العامة لحزمة SDK الخاصة بالقنوات |
    | `plugin-sdk/zalouser` | واجهة توافق Zalo Personal مهملة لحزم Lark/Zalo المنشورة التي لا تزال تستورد تخويل أوامر المرسل؛ ينبغي للـ plugins الجديدة استخدام المسارات الفرعية العامة لحزمة SDK الخاصة بالقنوات |
    | `plugin-sdk/interactive-runtime` | أدوات العرض الدلالي للرسائل وتسليمها والردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | أدوات مساعدة مشتركة للوارد لتصنيف الأحداث، وبناء السياق، والتنسيق، والجذور، وإزالة الارتداد، ومطابقة الإشارات، وسياسة الإشارات، وتسجيل الوارد |
    | `plugin-sdk/channel-inbound-debounce` | أدوات مساعدة محدودة لإزالة ارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | أدوات مساعدة محدودة لسياسة الإشارات وعلامة الإشارة ونص الإشارة، دون سطح وقت التشغيل الأوسع للوارد |
    | `plugin-sdk/channel-envelope`، `plugin-sdk/channel-inbound-roots`، `plugin-sdk/channel-location`، `plugin-sdk/channel-logging` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound` أو `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | أدوات مساعدة لإجراءات رسائل القناة، بالإضافة إلى أدوات مخطط أصلية مهملة أُبقي عليها لتوافق الـ plugins |
    | `plugin-sdk/channel-route` | أدوات مساعدة مشتركة لتسوية المسارات، وحل الوجهات المستند إلى المحلّل، وتحويل معرّف سلسلة المحادثة إلى سلسلة نصية، ومفاتيح المسارات لإزالة التكرار/الضغط، وأنواع الوجهات المحلّلة، ومقارنة المسارات/الوجهات |
    | `plugin-sdk/channel-targets` | أدوات مساعدة لتحليل الوجهات؛ ينبغي لمستدعي مقارنة المسارات استخدام `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقود القنوات |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
  </Accordion>

تظل عائلات مساعدات القنوات المهملة متاحة فقط للتوافق مع الـ Plugin المنشورة. تتمثل خطة الإزالة في: الإبقاء عليها طوال فترة ترحيل الـ Plugin الخارجية، والإبقاء على الـ Plugin المضمنة/الخاصة بالمستودع على `channel-inbound` و`channel-outbound`، ثم إزالة المسارات الفرعية الخاصة بالتوافق في عملية التنظيف الرئيسية التالية لـ SDK. ينطبق ذلك على العائلات القديمة لرسائل القنوات/وقت التشغيل، والبث التدفقي للقنوات، والوصول المباشر إلى الرسائل الخاصة، وتفرعات مساعدات الوارد، وخيارات الرد، ومسارات الاقتران.

  <Accordion title="المسارات الفرعية لموفّري الخدمات">
    | المسار الفرعي | عمليات التصدير الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة موفّر LM Studio المدعومة للإعداد واكتشاف الكتالوج وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة للإعدادات الافتراضية للخادم المحلي واكتشاف النماذج وترويسات الطلبات وأدوات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | أدوات إعداد منتقاة للموفّرين المحليين/المستضافين ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | أدوات إعداد مهملة للاستضافة الذاتية المتوافقة مع OpenAI؛ استخدم `plugin-sdk/provider-setup` أو أدوات الإعداد المملوكة للـ Plugin |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية للواجهة الخلفية لـ CLI + ثوابت المراقبة |
    | `plugin-sdk/provider-auth-runtime` | أدوات وقت تشغيل مصادقة الموفّر: تدفق OAuth عبر عنوان الاسترجاع المحلي، وتبادل الرموز، واستمرارية المصادقة، وحل مفتاح API |
    | `plugin-sdk/provider-oauth-runtime` | أنواع استدعاء OAuth العامة للموفّرين، وعرض صفحة الاستدعاء، وأدوات PKCE/الحالة، وتحليل مدخلات التفويض، وأدوات انتهاء صلاحية الرموز، وأدوات الإلغاء |
    | `plugin-sdk/provider-auth-api-key` | أدوات الإعداد الأولي بمفتاح API/كتابة ملف التعريف، مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ قياسي لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-env-vars` | أدوات البحث عن متغيرات بيئة مصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`، `ensureApiKeyFromOptionEnvOrPrompt`، `upsertAuthProfile`، `upsertApiKeyProfile`، `writeOAuthCredentials`، أدوات استيراد مصادقة OpenAI Codex، وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، ومنشئات سياسة إعادة التشغيل المشتركة، وأدوات نقاط نهاية الموفّر، وأدوات تطبيع معرّفات النماذج المشتركة |
    | `plugin-sdk/provider-catalog-live-runtime` | أدوات كتالوج نماذج الموفّر المباشرة للاكتشاف المحمي على نمط `/models`: ‏`buildLiveModelProviderConfig`، `fetchLiveProviderModelRows`، `getCachedLiveProviderModelRows`، `fetchLiveProviderModelIds`، `LiveModelCatalogHttpError`، `clearLiveCatalogCacheForTests`، وتصفية معرّفات النماذج، وذاكرة التخزين المؤقت ذات مدة الصلاحية، والبديل الثابت |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل لتعزيز كتالوج الموفّر ونقاط ربط سجل موفّري الـ Plugin لاختبارات العقود |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | أدوات عامة لقدرات HTTP/نقاط النهاية لدى الموفّر، وأخطاء HTTP للموفّر، وأدوات نماذج الأجزاء المتعددة لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | أدوات محدودة لعقد إعداد/اختيار جلب الويب، مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | أدوات تسجيل/تخزين مؤقت لموفّر جلب الويب |
    | `plugin-sdk/provider-web-search-config-contract` | أدوات محدودة لإعدادات/بيانات اعتماد بحث الويب للموفّرين الذين لا يحتاجون إلى توصيل تمكين الـ Plugin |
    | `plugin-sdk/provider-web-search-contract` | أدوات محدودة لعقد إعدادات/بيانات اعتماد بحث الويب، مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، وأدوات ضبط/جلب بيانات الاعتماد محددة النطاق |
    | `plugin-sdk/provider-web-search` | أدوات تسجيل/تخزين مؤقت/وقت تشغيل لموفّر بحث الويب |
    | `plugin-sdk/embedding-providers` | أنواع عامة لموفّري التضمين وأدوات القراءة، بما في ذلك `EmbeddingProviderAdapter`، و`getEmbeddingProvider(...)`، و`listEmbeddingProviders(...)`؛ تسجّل الـ Plugins الموفّرين من خلال `api.registerEmbeddingProvider(...)` لفرض ملكية البيان |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخطط DeepSeek/Gemini/OpenAI + التشخيصات |
    | `plugin-sdk/provider-usage` | أنواع لقطات استخدام الموفّر، وأدوات جلب الاستخدام المشتركة، وأدوات جلب الموفّرين مثل `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع مغلفات التدفق، وتوافق استدعاءات الأدوات بالنص العادي، وأدوات المغلفات المشتركة لـ Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | أدوات عامة مشتركة لمغلفات تدفق الموفّر، بما في ذلك `composeProviderStreamWrappers`، و`createOpenAICompatibleCompletionsThinkingOffWrapper`، و`createPlainTextToolCallCompatWrapper`، و`createPayloadPatchStreamWrapper`، و`createToolStreamWrapper`، و`normalizeOpenAICompatibleReasoningPayload`، و`setQwenChatTemplateThinking`، وأدوات تدفق متوافقة مع Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | أدوات نقل أصلية للموفّر، مثل الجلب المحمي، واستخراج نص نتائج الأدوات، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | أدوات تصحيح إعدادات الإعداد الأولي |
    | `plugin-sdk/global-singleton` | أدوات النسخة المفردة/الخريطة/ذاكرة التخزين المؤقت المحلية للعملية |
    | `plugin-sdk/group-activation` | أدوات محدودة لوضع تنشيط المجموعة وتحليل الأوامر |
  </Accordion>

تعرض لقطات استخدام الموفّر عادةً حصة واحدة أو أكثر من `windows`، لكل منها
تسمية ونسبة مئوية مستخدمة ووقت اختياري لإعادة التعيين. ينبغي للموفّرين الذين يعرضون نصًا
للرصيد أو حالة الحساب بدلًا من نوافذ الحصص القابلة لإعادة التعيين إرجاع
`summary` مع مصفوفة `windows` فارغة بدلًا من اختلاق نسب مئوية.
يعرض OpenClaw نص الملخص هذا في مخرجات الحالة؛ استخدم `error` فقط عندما تفشل
نقطة نهاية الاستخدام أو لا تُرجع بيانات استخدام قابلة للاستفادة.

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | عمليات التصدير الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | سطح واسع مهمل لتفويض الأوامر (`resolveControlCommandGate`، وأدوات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، وأدوات تفويض المرسل)؛ استخدم تفويض إدخال القناة/وقت التشغيل أو أدوات حالة الأوامر |
    | `plugin-sdk/command-status` | منشئات رسائل الأوامر/المساعدة، مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | أدوات تحديد الموافق ومصادقة الإجراءات ضمن المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | أدوات ملف تعريف/تصفية الموافقة على التنفيذ الأصلي |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرة/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | محلّل Gateway مشترك للموافقات |
    | `plugin-sdk/approval-reference-runtime` | أداة محدِّد دائم وحتمي لاستدعاءات الموافقة المقيّدة بالنقل |
    | `plugin-sdk/approval-handler-adapter-runtime` | أدوات خفيفة لتحميل مهايئ الموافقات الأصلية لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | أدوات أوسع لوقت تشغيل معالج الموافقات؛ فضّل نقاط ربط المهايئ/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | أدوات هدف الموافقات الأصلية وربط الحساب وبوابة المسار والبديل لإعادة التوجيه ومنع مطالبة التنفيذ الأصلي المحلية |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعلات الموافقة الثابتة، وحمولات مطالبات التفاعل، ومخازن أهداف التفاعل، وأدوات نص تلميحات التفاعل، وتصدير توافق لمنع مطالبة التنفيذ الأصلي المحلية |
    | `plugin-sdk/approval-reply-runtime` | أدوات حمولات ردود موافقات التنفيذ/الـ Plugin |
    | `plugin-sdk/approval-runtime` | أدوات حمولات موافقات التنفيذ/الـ Plugin، ومنشئات قدرات الموافقة، وأدوات مصادقة/ملفات تعريف الموافقة، وأدوات توجيه/وقت تشغيل الموافقات الأصلية، وأدوات عرض الموافقات المنظّمة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | أدوات محدودة مهملة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، وأدوات أهداف الجلسات الأصلية |
    | `plugin-sdk/command-detection` | أدوات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | محمولات نصية خفيفة للأوامر لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | أدوات تطبيع جسم الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | أدوات تدفق تسجيل دخول كسول لمصادقة الموفّر لإقران القنوات الخاصة وواجهة الويب باستخدام رمز الجهاز |
    | `plugin-sdk/channel-secret-runtime` | سطح واسع مهمل لعقد الأسرار (`collectSimpleChannelFieldAssignments`، و`getChannelSurface`، و`pushAssignment`، وأنواع أهداف الأسرار)؛ فضّل المسارات الفرعية المركزة أدناه |
    | `plugin-sdk/channel-secret-basic-runtime` | عمليات تصدير محدودة لعقود الأسرار ومنشئات سجل الأهداف لأسطح أسرار القنوات/الـ Plugins غير التابعة لـ TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | أدوات محدودة لإسناد أسرار TTS المتداخلة للقنوات |
    | `plugin-sdk/secret-ref-runtime` | أدوات محدودة لكتابة SecretRef وحلّه والبحث عن مسار هدف الخطة لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/secret-provider-integration` | عقود بيان وتكوينات مسبقة، من النوع فقط، لتكامل موفّر SecretRef للـ Plugins التي تنشر تكوينات مسبقة لموفّري أسرار خارجيين |
    | `plugin-sdk/security-runtime` | حزمة تصدير واسعة مهملة للثقة وتقييد الرسائل المباشرة وأدوات الملفات/المسارات المحصورة في الجذر، بما في ذلك عمليات الكتابة للإنشاء فقط، والاستبدال الذري المتزامن/غير المتزامن للملفات، والكتابة المؤقتة المجاورة، وبديل النقل عبر الأجهزة، وأدوات مخزن الملفات الخاصة، وحراس الآباء للروابط الرمزية، والمحتوى الخارجي، وحجب النص الحساس، والمقارنة ثابتة الوقت للأسرار، وأدوات جمع الأسرار؛ فضّل المسارات الفرعية المركزة للأمان/SSRF/الأسرار |
    | `plugin-sdk/ssrf-policy` | أدوات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | أدوات محدودة للموزّع المثبّت دون سطح وقت تشغيل البنية التحتية الواسع |
    | `plugin-sdk/ssrf-runtime` | أدوات الموزّع المثبّت، والجلب المحمي من SSRF، وأخطاء SSRF، وسياسات SSRF |
    | `plugin-sdk/secret-input` | أدوات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | أدوات طلبات/أهداف Webhook وتحويل websocket الخام/الجسم |
    | `plugin-sdk/webhook-request-guards` | أدوات حجم/مهلة جسم الطلب و`runDetachedWebhookWork` للمعالجة المتتبعة بعد الإقرار |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | أدوات مساعدة لوقت التشغيل والتسجيل والنسخ الاحتياطي، وتحذيرات مسار تثبيت Plugin، وأدوات مساعدة للعمليات |
    | `plugin-sdk/runtime-env` | أدوات مساعدة محدودة لبيئة وقت التشغيل والمسجّل والمهلة وإعادة المحاولة والتراجع |
    | `plugin-sdk/browser-config` | واجهة إعداد متصفح مدعومة للملف الشخصي والقيم الافتراضية المطبّعة، وتحليل عنوان URL لـ CDP، وأدوات مساعدة لمصادقة التحكم في المتصفح |
    | `plugin-sdk/agent-harness-task-runtime` | أدوات مساعدة عامة لدورة حياة المهام وتسليم الإكمال للوكلاء المدعومين بإطار تشغيل باستخدام نطاق مهمة صادر عن المضيف |
    | `plugin-sdk/codex-mcp-projection` | أداة Codex مساعدة مجمّعة ومحجوزة لإسقاط إعداد خادم MCP الخاص بالمستخدم في إعداد سلسلة Codex؛ ليست مخصصة لإضافات الجهات الخارجية |
    | `plugin-sdk/codex-native-task-runtime` | أداة Codex مساعدة مجمّعة ومحلية للمستودع لتوصيل مرآة المهام الأصلية ووقت التشغيل؛ ليست تصديرًا للحزمة |
    | `plugin-sdk/channel-runtime-context` | أدوات مساعدة عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات الجهات الخارجية الأقدم؛ ينبغي للإضافات الجديدة استيراد `plugin-sdk/run-command` مباشرةً |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات الجهات الخارجية الأقدم؛ ينبغي للإضافات الجديدة استيراد المسارات الفرعية العامة لـ SDK مباشرةً |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | حزمة تصدير واسعة مهملة لأدوات أوامر Plugin والخطافات وHTTP والتفاعل؛ يُفضّل استخدام المسارات الفرعية المركّزة لوقت تشغيل Plugin |
    | `plugin-sdk/hook-runtime` | حزمة تصدير واسعة مهملة لأدوات مسار معالجة Webhook والخطافات الداخلية؛ يُفضّل استخدام المسارات الفرعية المركّزة لوقت تشغيل الخطافات وPlugin |
    | `plugin-sdk/lazy-runtime` | أدوات مساعدة للاستيراد والربط الكسول في وقت التشغيل، مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | أدوات مساعدة لتنفيذ العمليات |
    | `plugin-sdk/node-host` | أدوات مساعدة لحل الملف التنفيذي لمضيف Node واستئناف PTY |
    | `plugin-sdk/cli-runtime` | حزمة تصدير واسعة مهملة لتنسيق CLI والانتظار والإصدار واستدعاء الوسائط ومجموعات الأوامر الكسولة؛ يُفضّل استخدام المسارات الفرعية المركّزة لـ CLI ووقت التشغيل |
    | `plugin-sdk/qa-runner-runtime` | واجهة مدعومة تعرض سيناريوهات ضمان جودة Plugin عبر سطح أوامر CLI |
    | `plugin-sdk/tts-runtime` | واجهة مدعومة لمخططات إعداد تحويل النص إلى كلام وأدوات وقت التشغيل المساعدة |
    | `plugin-sdk/gateway-method-runtime` | أداة مساعدة محجوزة لتوجيه طرائق Gateway لمسارات HTTP الخاصة بـ Plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، وأداة بدء العميل الجاهز لحلقة الأحداث، واستدعاء RPC لـ Gateway عبر CLI، وأخطاء بروتوكول Gateway، وحل مضيف LAN المُعلن، وأدوات مساعدة لتصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح إعداد مركّز خاص بالأنواع لأشكال إعداد Plugin مثل `OpenClawConfig` وأنواع إعداد القنوات والموفّرين |
    | `plugin-sdk/plugin-config-runtime` | أدوات مساعدة لإعداد Plugin في وقت التشغيل مثل `mergeDeep` و`requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | أدوات مساعدة لتعديل الإعداد ضمن معاملات، مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | سلاسل تلميحات بيانات التعريف المشتركة لتسليم أداة الرسائل |
    | `plugin-sdk/runtime-config-snapshot` | أدوات مساعدة للّقطة الحالية من إعداد العملية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot`، وأدوات ضبط لقطات الاختبار |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات دون حزمة تصدير النص الواسعة |
    | `plugin-sdk/reply-runtime` | أدوات مشتركة لوقت تشغيل الرسائل الواردة والردود، والتقسيم إلى أجزاء، والتوجيه، وHeartbeat، ومخطط الردود |
    | `plugin-sdk/reply-dispatch-runtime` | أدوات مساعدة محدودة لتوجيه الردود وإنهائها وتسميات المحادثات |
    | `plugin-sdk/reply-history` | أدوات مشتركة لسجل الردود قصير المدى. ينبغي لشفرة أدوار الرسائل الجديدة استخدام `createChannelHistoryWindow`؛ وتظل أدوات الخرائط منخفضة المستوى تصديرات توافق مهملة فقط |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | أدوات مساعدة محدودة لتقسيم النص وMarkdown إلى أجزاء |
    | `plugin-sdk/session-store-runtime` | أدوات مساعدة لسير عمل الجلسة (`getSessionEntry` و`listSessionEntries` و`patchSessionEntry` و`upsertSessionEntry`)؛ وأدوات الإصلاح ودورة الحياة (`deleteSessionEntry` و`cleanupSessionLifecycleArtifacts` و`resolveSessionStoreBackupPaths`)؛ وأدوات العلامات لقيم `sessionFile` الانتقالية؛ وقراءة محدودة للنصوص الحديثة من سجل محادثة المستخدم والمساعد حسب هوية الجلسة؛ وأدوات مساعدة لمسار مخزن الجلسة ومفتاح الجلسة؛ وقراءة وقت آخر تحديث، دون استيرادات كتابة الإعداد الواسعة أو صيانته |
    | `plugin-sdk/session-transcript-runtime` | هوية سجل المحادثة، وأدوات مساعدة محددة النطاق للاستهداف والقراءة والكتابة، وإسقاط إدخالات الرسائل المرئية، ونشر التحديثات، وأقفال الكتابة، ومفاتيح إصابات ذاكرة سجل المحادثة |
    | `plugin-sdk/sqlite-runtime` | أدوات SQLite مركّزة لمخطط الوكيل ومساره ومعاملاته لوقت التشغيل من الطرف الأول، دون عناصر التحكم في دورة حياة قاعدة البيانات |
    | `plugin-sdk/cron-store-runtime` | أدوات مساعدة لمسار مخزن Cron وتحميله وحفظه |
    | `plugin-sdk/state-paths` | أدوات مساعدة لمسارات أدلة الحالة وOAuth |
    | `plugin-sdk/plugin-state-runtime` | أنواع حالة SQLite ذات المفاتيح للعملية الجانبية لـ Plugin، بالإضافة إلى pragma اتصال مركزي، وصيانة WAL متحقَّق منها، وأدوات ترحيل ذرّية لمخطط STRICT لقواعد البيانات المملوكة لـ Plugin |
    | `plugin-sdk/routing` | أدوات مساعدة لربط المسار ومفتاح الجلسة والحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | أدوات مشتركة لملخص حالة القناة والحساب، والقيم الافتراضية لحالة وقت التشغيل، وأدوات مساعدة لبيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | أدوات مشتركة لحل الوجهة |
    | `plugin-sdk/string-normalization-runtime` | أدوات مساعدة لتطبيع المعرّفات النصية والسلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت بنتائج مطبّعة لـ stdout/stderr |
    | `plugin-sdk/param-readers` | أدوات شائعة لقراءة معاملات الأدوات وCLI |
    | `plugin-sdk/tool-plugin` | تعريف Plugin بسيط ذي أنواع لأداة وكيل، وعرض بيانات تعريف ثابتة لإنشاء البيان |
    | `plugin-sdk/tool-payload` | استخراج حمولات مطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول وجهة الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/sandbox` | أنواع خلفية صندوق العزل وأدوات أوامر SSH/OpenShell، بما في ذلك فحص مسبق سريع الفشل لأمر التنفيذ |
    | `plugin-sdk/temp-path` | أدوات مشتركة لمسارات التنزيل المؤقت ومساحات عمل مؤقتة خاصة وآمنة |
    | `plugin-sdk/logging-core` | أدوات مساعدة لمسجّل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | وضع جداول Markdown وأدوات التحويل |
    | `plugin-sdk/model-session-runtime` | أدوات مساعدة لتجاوز النموذج والجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | أدوات مساعدة لحل إعداد موفّر المحادثة |
    | `plugin-sdk/json-store` | أدوات صغيرة لقراءة حالة JSON وكتابتها |
    | `plugin-sdk/json-unsafe-integers` | أدوات مساعدة لتحليل JSON تحافظ على القيم الحرفية للأعداد الصحيحة غير الآمنة كسلاسل |
    | `plugin-sdk/file-lock` | أدوات مساعدة لأقفال الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | أدوات مساعدة لذاكرة تخزين مؤقت لإزالة التكرار ومدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | أدوات مساعدة لوقت تشغيل ACP وجلساته وتوجيه الردود |
    | `plugin-sdk/acp-runtime-backend` | أدوات خفيفة لتسجيل خلفية ACP وتوجيه الردود للإضافات المحمّلة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | عناصر بدائية مهملة لمخطط إعداد وقت تشغيل الوكيل؛ استورد العناصر البدائية للمخطط من سطح مملوك لـ Plugin تتم صيانته |
    | `plugin-sdk/boolean-param` | قارئ مرن للمعاملات المنطقية |
    | `plugin-sdk/dangerous-name-runtime` | أدوات مساعدة لحل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | أدوات مساعدة لتهيئة الجهاز ورموز الاقتران، بما في ذلك `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | عناصر مساعدة بدائية مشتركة للقنوات الخاملة والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | أدوات مساعدة لردود أوامر وموفّري `/models` |
    | `plugin-sdk/skill-commands-runtime` | أدوات مساعدة لسرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | أدوات مساعدة لسجل الأوامر الأصلية وبنائها وتسلسلها |
    | `plugin-sdk/agent-harness` | سطح تجريبي للإضافات الموثوقة لأطر تشغيل الوكلاء منخفضة المستوى: أنواع إطار التشغيل، وأدوات توجيه التشغيل النشط وإلغائه، وأدوات جسر OpenClaw، وأدوات سياسة أدوات خطة وقت التشغيل، وتصنيف النتيجة النهائية، وأدوات تنسيق تقدم الأدوات وتفاصيله، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة لاكتشاف نقاط النهاية المملوكة لموفّر Z.AI؛ استخدم واجهة API العامة لـ Plugin الخاص بـ Z.AI |
    | `plugin-sdk/async-lock-runtime` | أداة قفل غير متزامن محلية للعملية لملفات حالة وقت التشغيل الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | أداة قياس عن بُعد لنشاط القناة |
    | `plugin-sdk/concurrency-runtime` | أداة مساعدة محدودة لتزامن المهام غير المتزامنة |
    | `plugin-sdk/dedupe-runtime` | أدوات مساعدة لذاكرة تخزين مؤقت لإزالة التكرار، داخل الذاكرة ومدعومة بالتخزين الدائم |
    | `plugin-sdk/delivery-queue-runtime` | أداة مساعدة لتصريف عمليات التسليم الصادرة المعلّقة |
    | `plugin-sdk/file-access-runtime` | أدوات آمنة لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | أدوات مساعدة لتنبيه Heartbeat وأحداثه وإمكانية رؤيته |
    | `plugin-sdk/expect-runtime` | أداة تأكيد القيمة المطلوبة لثوابت وقت التشغيل القابلة للإثبات |
    | `plugin-sdk/number-runtime` | أداة مساعدة للتحويل القسري إلى قيمة رقمية |
    | `plugin-sdk/secure-random-runtime` | أدوات آمنة للرموز وUUID |
    | `plugin-sdk/system-event-runtime` | أدوات مساعدة لطابور أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | أداة انتظار جاهزية النقل |
    | `plugin-sdk/exec-approvals-runtime` | أدوات مساعدة لملف سياسة الموافقة على التنفيذ دون حزمة تصدير وقت تشغيل البنية التحتية الواسعة |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم المسارات الفرعية المركّزة لوقت التشغيل أعلاه |
    | `plugin-sdk/collection-runtime` | أدوات صغيرة ومحدودة لذاكرة التخزين المؤقت |
    | `plugin-sdk/diagnostic-runtime` | أدوات مساعدة لعلامات التشخيص والأحداث وسياق التتبّع |
    | `plugin-sdk/error-runtime` | أدوات مساعدة لرسم الأخطاء وتنسيقها وتصنيفها المشترك، و`PlatformMessageNotDispatchedError` و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | أدوات مساعدة لـ fetch المغلّف والوكيل وخيار EnvHttpProxyAgent والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | تنفيذ fetch في وقت التشغيل مع مراعاة الموزّع دون استيرادات الوكيل أو guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | أدوات تنقية عنوان URL لبيانات الصور المضمّنة واستكشاف التوقيع دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/response-limit-runtime` | أدوات قراءة جسم الاستجابة المحدودة بالبايتات والخمول والموعد النهائي دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية دون توجيه الربط المُعدّ أو مخازن الاقتران |
    | `plugin-sdk/context-visibility-runtime` | حل إمكانية رؤية السياق وتصفية السياق التكميلي دون استيرادات الإعداد والأمان الواسعة |
    | `plugin-sdk/string-coerce-runtime` | أدوات بدائية محدودة للتحويل القسري للسجلات والسلاسل وتطبيعها دون استيرادات Markdown والتسجيل |
    | `plugin-sdk/html-entity-runtime` | فك ترميز كيانات HTML5 المنتهية بفاصلة منقوطة في مرور واحد دون أدوات النص الواسعة |
    | `plugin-sdk/text-utility-runtime` | أدوات نص ومسارات منخفضة المستوى، بما في ذلك تهريب كيانات HTML الخمسة |
    | `plugin-sdk/widget-html` | اكتشاف المستند الكامل والتحقق من الحجم وأخطاء إدخال الأدوات لعناصر واجهة HTML المستقلة |
    | `plugin-sdk/host-runtime` | أدوات مساعدة لتطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | أدوات مساعدة لإعداد إعادة المحاولة وتشغيلها |
    | `plugin-sdk/agent-runtime` | حزمة تصدير واسعة مهملة لأدوات دليل الوكيل وهويته ومساحة عمله، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir`؛ يُفضّل استخدام المسارات الفرعية المركّزة للوكيل ووقت التشغيل |
    | `plugin-sdk/directory-runtime` | الاستعلام عن الأدلة المدعوم بالإعداد وإزالة التكرار |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | حزمة وسائط عامة مهملة تتضمن `saveRemoteMedia` و`saveResponseMedia` و`readRemoteMediaBuffer` و`fetchRemoteMedia` المهملة؛ يُفضّل استخدام `plugin-sdk/media-store` و`plugin-sdk/media-mime` و`plugin-sdk/outbound-media` والمسارات الفرعية لوقت تشغيل القدرات، كما يُفضّل استخدام مساعدات المخزن قبل قراءات المخزن المؤقت عندما ينبغي أن يتحول عنوان URL إلى وسائط OpenClaw |
    | `plugin-sdk/media-mime` | مساعدات محدودة لتوحيد MIME وتعيين امتدادات الملفات واكتشاف MIME وتحديد نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات محدودة لمخزن الوسائط، مثل `saveMediaBuffer` و`saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتبديل عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع موفّري فهم الوسائط، بالإضافة إلى صادرات مساعدات الصور والصوت والاستخراج المنظّم الموجّهة للموفّرين |
    | `plugin-sdk/text-chunking` | تقسيم النص الصادر والنطاقات مع الحفاظ على الإزاحات، وتقسيم Markdown ومساعدات عرضه، وترميز وسوم HTML مع مراعاة علامات الاقتباس، وتحويل جداول Markdown، وإزالة وسوم التوجيهات، وأدوات النص الآمن |
    | `plugin-sdk/speech` | أنواع موفّري الكلام، بالإضافة إلى صادرات منشئ TTS المتوافق مع OpenAI ومساعدات التوجيه والسجل والتحقق والكلام الموجّهة للموفّرين |
    | `plugin-sdk/speech-core` | أنواع موفّري الكلام المشتركة، والسجل، والتوجيه، والتوحيد، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع موفّري النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-bootstrap-context` | مساعد تمهيد ملف التعريف الفوري لإدخال سياق محدود من `IDENTITY.md` و`USER.md` و`SOUL.md` |
    | `plugin-sdk/realtime-voice` | أنواع موفّري الصوت الفوري، ومساعدات السجل، ومساعدات سلوك الصوت الفوري المشتركة، بما في ذلك تتبع نشاط الإخراج |
    | `plugin-sdk/image-generation` | أنواع موفّري توليد الصور، بالإضافة إلى مساعدات أصول الصور وعناوين URL للبيانات، ومنشئ موفّر الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، ومساعدات التبديل عند الفشل، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع موفّر توليد الموسيقى والطلب والنتيجة |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة المهملة، ومساعدات التبديل عند الفشل، والبحث عن الموفّر، وتحليل مرجع النموذج؛ يُفضّل استخدام واجهات موفّر الموسيقى المملوكة للـ Plugin |
    | `plugin-sdk/video-generation` | أنواع موفّر توليد الفيديو والطلب والنتيجة |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التبديل عند الفشل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/transcripts` | أنواع موفّري مصادر النصوص المنسوخة المشتركة، ومساعدات السجل، وواصفات الجلسات، والبيانات الوصفية للعبارات المنطوقة |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة والمحلية |
    | `plugin-sdk/zod` | إعادة تصدير مهملة للتوافق؛ استورد `zod` من `zod` مباشرةً |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` أدنى محلي للمستودع لاختبارات وحدات تسجيل الـ Plugin المباشر من دون استيراد جسور مساعدات اختبارات المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقود محوّل وقت تشغيل الوكيل الأصلي المحلية للمستودع لاختبارات المصادقة والتسليم والتراجع وخطافات الأدوات وتراكب المطالبات والمخطط وإسقاط النصوص المنسوخة |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار موجّهة للقنوات ومحلية للمستودع لعقود الإجراءات والإعداد والحالة العامة، وتأكيدات الدليل، ودورة حياة بدء الحساب، وتمرير إعدادات الإرسال، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | حزمة حالات أخطاء مشتركة ومحلية للمستودع لتحليل الأهداف في اختبارات القنوات |
    | `plugin-sdk/channel-contract-testing` | مساعدات اختبار محدودة ومحلية للمستودع لعقود القنوات من دون حزمة الاختبار العامة |
    | `plugin-sdk/plugin-test-contracts` | مساعدات محلية للمستودع لعقود حزمة الـ Plugin والتسجيل والعناصر العامة والاستيراد المباشر وواجهة برمجة تطبيقات وقت التشغيل والآثار الجانبية للاستيراد |
    | `plugin-sdk/plugin-state-test-runtime` | مساعدات اختبار محلية للمستودع لمخزن حالة الـ Plugin وطابور الإدخال وقاعدة بيانات الحالة |
    | `plugin-sdk/provider-test-contracts` | مساعدات محلية للمستودع لعقود وقت تشغيل الموفّر والمصادقة والاكتشاف والتهيئة والكتالوج والمعالج وقدرات الوسائط وسياسة إعادة التشغيل وSTT الفوري للصوت المباشر والبحث/الجلب عبر الويب والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية التفعيل ومحلية للمستودع في Vitest لاختبارات الموفّرين التي تستخدم `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | مساعدات محلية للمستودع لإرفاق البيانات الوصفية بتجهيزات حمولات الرد |
    | `plugin-sdk/sqlite-runtime-testing` | مساعدات محلية للمستودع لدورة حياة SQLite في اختبارات الطرف الأول |
    | `plugin-sdk/test-fixtures` | تجهيزات محلية للمستودع لالتقاط وقت تشغيل CLI العام، وسياق البيئة المعزولة، وكاتب المهارات، ورسائل الوكيل، وأحداث النظام، وإعادة تحميل الوحدات، ومسار الـ Plugin المضمّن، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات ذات الأنواع |
    | `plugin-sdk/test-node-mocks` | مساعدات محدودة ومحلية للمستودع لمحاكاة الوحدات المضمّنة في Node لاستخدامها داخل مصانع `vi.mock("node:*")` في Vitest |
  </Accordion>

  <Accordion title="مسارات الذاكرة الفرعية">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل مهملة لفهرسة الذاكرة والبحث فيها؛ يُفضّل استخدام المسارات الفرعية لمضيف الذاكرة المحايدة تجاه المورّد |
    | `plugin-sdk/memory-core-host-embedding-registry` | مساعدات خفيفة لسجل موفّري تضمين الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفّر المحلي، ومساعدات الدُفعات/التحكم عن بُعد العامة. إن `registerMemoryEmbeddingProvider` على هذه الواجهة مهمل؛ استخدم واجهة برمجة تطبيقات موفّر التضمين العامة للموفّرين الجدد. |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط مهملة لمضيف الذاكرة؛ يُفضّل استخدام المسارات الفرعية لمضيف الذاكرة المحايدة تجاه المورّد |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مهملة لمضيف الذاكرة؛ يُفضّل استخدام المسارات الفرعية لمضيف الذاكرة المحايدة تجاه المورّد |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد تجاه المورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد تجاه المورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات مشتركة لـ Markdown المُدار للـ Plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    المسارات الفرعية المحجوزة في SDK للمساعدات المضمّنة هي واجهات محدودة خاصة بالمالك
    لشفرة الـ Plugin المضمّنة. وهي مُتعقبة في مخزون SDK كي تظل عمليات بناء
    الحزم والأسماء المستعارة حتمية، لكنها ليست واجهات برمجة تطبيقات عامة
    لتأليف الـ Plugins. ينبغي لعقود المضيف الجديدة القابلة لإعادة الاستخدام أن تستخدم مسارات SDK الفرعية العامة
    مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/ssrf-runtime` و
    `plugin-sdk/plugin-config-runtime`.

    | المسار الفرعي | المالك والغرض |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | مساعد Plugin Codex المضمّن لإسقاط إعداد خادم MCP الخاص بالمستخدم إلى إعداد سلسلة خادم تطبيق Codex (تصدير حزمة محجوز) |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Plugin Codex المضمّن لعكس الوكلاء الفرعيين الأصليين لخادم تطبيق Codex في حالة مهام OpenClaw (محلي للمستودع فقط، وليس تصدير حزمة) |

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على SDK للـ Plugin](/ar/plugins/sdk-overview)
- [إعداد SDK للـ Plugin](/ar/plugins/sdk-setup)
- [بناء الـ Plugins](/ar/plugins/building-plugins)
