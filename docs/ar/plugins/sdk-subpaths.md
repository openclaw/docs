---
read_when:
    - اختيار المسار الفرعي الصحيح في plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للـ Plugin المضمّنة وواجهات المساعدات
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أي الاستيرادات توجد في أي مكان، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:08:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

تُعرَض SDK الخاصة بالـ Plugin كمجموعة من المسارات الفرعية العامة الضيقة تحت
`openclaw/plugin-sdk/`. تفهرس هذه الصفحة المسارات الفرعية شائعة الاستخدام مجمّعة حسب
الغرض. يوجد مخزون نقاط دخول المصرّف المولَّد في
`scripts/lib/plugin-sdk-entrypoints.json`؛ وتكون صادرات الحزمة هي المجموعة الفرعية العامة
بعد طرح مسارات الاختبار/الداخلية المحلية للمستودع المدرجة في
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. يستطيع المشرفون تدقيق
عدد الصادرات العامة باستخدام `pnpm plugin-sdk:surface` ومسارات المساعدات الفرعية المحجوزة
النشطة باستخدام `pnpm plugins:boundary-report:summary`؛ وتُفشل صادرات المساعدات المحجوزة
غير المستخدمة تقرير CI بدلًا من بقائها في SDK العامة كدين توافق خامد.

لدليل تأليف Plugin، راجع [نظرة عامة على SDK الخاصة بالـ Plugin](/ar/plugins/sdk-overview).

## إدخال Plugin

| المسار الفرعي                   | الصادرات الرئيسية                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | مساعدات عناصر موفّر الترحيل مثل `createMigrationItem`، وثوابت الأسباب، وعلامات حالة العناصر، ومساعدات التنقيح، و`summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | مساعدات ترحيل وقت التشغيل مثل `copyMigrationFileItem`، و`withCachedMigrationConfigRuntime`، و`writeMigrationReport`                                              |
| `plugin-sdk/health`            | تسجيل فحوصات صحة Doctor، والكشف، والإصلاح، والاختيار، والخطورة، وأنواع النتائج لمستهلكي الصحة المضمّنين                                               |

### مساعدات التوافق والاختبار المهملة

تبقى المسارات الفرعية المهملة مصدَّرة للإضافات القديمة، لكن ينبغي أن تستخدم الشيفرة الجديدة
مسارات SDK الفرعية المركّزة أدناه. توجد القائمة المصانة في
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`؛ ويرفض CI استيرادات الإنتاج
المضمّنة منها. البراميل الواسعة مثل `compat` و`config-types` و
`infra-runtime` و`text-runtime` و`zod` مخصّصة للتوافق فقط. استورد `zod`
مباشرةً من `zod`.

مسارات مساعدات الاختبار المدعومة بـ Vitest في OpenClaw محلية للمستودع فقط ولم تعد
صادرات للحزمة: `agent-runtime-test-contracts` و
`channel-contract-testing` و`channel-target-testing` و`channel-test-helpers` و
`plugin-test-api` و`plugin-test-contracts` و`plugin-test-runtime` و
`provider-http-test-mocks` و`provider-test-contracts` و`test-env` و
`test-fixtures` و`test-node-mocks` و`testing`.

### مسارات مساعدات Plugin المضمّنة المحجوزة

هذه المسارات الفرعية هي أسطح توافق مملوكة للـ Plugin من أجل Plugin المضمّنة المالكة لها،
وليست واجهات API عامة للـ SDK: `plugin-sdk/codex-mcp-projection` و
`plugin-sdk/codex-native-task-runtime`. تُحظر استيرادات الإضافات العابرة للمالك
بواسطة حواجز عقد الحزمة.

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | مساعد تحقق JSON Schema مخزن مؤقتا للمخططات المملوكة للـ Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومترجم الإعداد، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات تهيئة متعددة الحسابات وبوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب والرجوع إلى الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات وإجراءات الحساب |
    | `plugin-sdk/access-groups` | مساعدات تحليل قائمة السماح لمجموعات الوصول وتشخيصات المجموعات المنقحة |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | بدائيات مخطط تهيئة القناة المشتركة، بالإضافة إلى بناة Zod و JSON/TypeBox المباشرين |
    | `plugin-sdk/bundled-channel-config-schema` | مخططات تهيئة قنوات OpenClaw المضمنة للـ Plugins المضمنة التي تتم صيانتها فقط |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. معرفات قنوات الدردشة المضمنة/الرسمية المعتمدة بالإضافة إلى تسميات/أسماء مستعارة للمنسق للـ Plugins التي تحتاج إلى التعرف على النص ذي بادئة المغلف من دون ترميز جدولها الخاص مباشرة. |
    | `plugin-sdk/channel-config-schema-legacy` | اسم مستعار مهمل للتوافق لمخططات تهيئة القنوات المضمنة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع رجوع عقد مضمن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تخويل الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | واجهة توافق مهملة لدخول القنوات منخفض المستوى. يجب أن تستخدم مسارات الاستقبال الجديدة `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | محلل وقت تشغيل تجريبي عالي المستوى لدخول القنوات وبناة حقائق المسار لمسارات استقبال القنوات المرحلة. يفضل استخدامه بدلا من تجميع قوائم السماح الفعالة، وقوائم سماح الأوامر، والإسقاطات القديمة في كل Plugin. راجع [واجهة برمجة تطبيقات دخول القناة](/ar/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | عقود دورة حياة الرسائل بالإضافة إلى خيارات مسار الرد، والإيصالات، والمعاينة/البث المباشر، ومساعدات دورة الحياة، وهوية الخروج، وتخطيط الحمولة، والإرسالات الدائمة، ومساعدات سياق إرسال الرسائل. راجع [واجهة برمجة تطبيقات خروج القناة](/ar/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | اسم مستعار مهمل للتوافق لـ `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الرد القديمة. |
    | `plugin-sdk/channel-message-runtime` | اسم مستعار مهمل للتوافق لـ `plugin-sdk/channel-outbound` بالإضافة إلى واجهات إرسال الرد القديمة. |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد والمغلف |
    | `plugin-sdk/inbound-reply-dispatch` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-inbound` لمشغلات الوارد ومسندات الإرسال، و`plugin-sdk/channel-outbound` لمساعدات تسليم الرسائل. |
    | `plugin-sdk/messaging-targets` | اسم مستعار مهمل لتحليل الأهداف؛ استخدم `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة وحالة الوسائط المستضافة |
    | `plugin-sdk/outbound-send-deps` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط السلاسل والمحول |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط العميل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/السلسلة، والاقتران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة تهيئة وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطة/ملخص حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط تهيئة القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تخويل كتابة تهيئة القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيد مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تحرير/قراءة تهيئة قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار وصول المجموعة |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | مساعدات ضيقة لسياسة حراسة الرسائل المباشرة قبل التشفير |
    | `plugin-sdk/discord` | واجهة توافق Discord مهملة لـ `@openclaw/discord@2026.3.13` المنشور وتوافق المالك المتتبع؛ يجب أن تستخدم الـ Plugins الجديدة المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/telegram-account` | واجهة توافق مهملة لحل حساب Telegram لتوافق المالك المتتبع؛ يجب أن تستخدم الـ Plugins الجديدة مساعدات وقت التشغيل المحقونة أو المسارات الفرعية العامة لـ SDK القنوات |
    | `plugin-sdk/zalouser` | واجهة توافق مهملة لـ Zalo Personal لحزم Lark/Zalo المنشورة التي لا تزال تستورد تخويل أمر المرسل؛ يجب أن تستخدم الـ Plugins الجديدة `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | عرض الرسائل الدلالي، والتسليم، ومساعدات الرد التفاعلي القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | مساعدات وارد مشتركة لتصنيف الأحداث، وبناء السياق، والتنسيق، والجذور، وإزالة الارتداد، ومطابقة الإشارات، وسياسة الإشارات، وتسجيل الوارد |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة ارتداد الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارات، وعلامة الإشارة، ونص الإشارة من دون سطح وقت تشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | واجهات توافق مهملة. استخدم `plugin-sdk/channel-inbound` أو `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | واجهة توافق مهملة. استخدم `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلي المهملة المحتفظ بها لتوافق الـ Plugin |
    | `plugin-sdk/channel-route` | مساعدات مشتركة لتطبيع المسار، وحل الأهداف المدفوع بالمحلل، وتحويل معرف السلسلة إلى سلسلة نصية، ومفاتيح المسار المضغوطة/المزالة التكرار، وأنواع الأهداف المحللة، ومقارنة المسار/الهدف |
    | `plugin-sdk/channel-targets` | مساعدات تحليل الأهداف؛ يجب أن يستخدم مستدعو مقارنة المسارات `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

تبقى عائلات مساعدات القنوات المهملة متاحة فقط لتوافق الـ Plugins
المنشورة. خطة الإزالة هي: إبقاؤها خلال نافذة ترحيل الـ Plugin
الخارجي، وإبقاء Plugins المستودع/المضمنة على `channel-inbound` و
`channel-outbound`، ثم إزالة المسارات الفرعية للتوافق في عملية التنظيف الرئيسية التالية
للـ SDK. ينطبق هذا على عائلات رسائل/وقت تشغيل القناة القديمة، وبث القناة،
ووصول الرسائل المباشرة، وتشعبات مساعدات الوارد، وخيارات الرد،
ومسارات الاقتران.

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | واجهة مزوّد LM Studio المدعومة للإعداد، واكتشاف الكتالوج، وتحضير نموذج وقت التشغيل |
    | `plugin-sdk/lmstudio-runtime` | واجهة وقت تشغيل LM Studio المدعومة لافتراضيات الخادم المحلي، واكتشاف النماذج، وترويسات الطلبات، ومساعدات النماذج المحمّلة |
    | `plugin-sdk/provider-setup` | مساعدات إعداد مزوّد محلي/مستضاف ذاتيًا منتقاة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مزوّد مستضاف ذاتيًا ومتوافق مع OpenAI ومحددة النطاق |
    | `plugin-sdk/cli-backend` | افتراضيات خلفية CLI + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API في وقت التشغيل لمزوّدات Plugin |
    | `plugin-sdk/provider-oauth-runtime` | أنواع رد نداء OAuth عامة للمزوّد، وعرض صفحة رد النداء، ومساعدات PKCE/الحالة، وتحليل إدخال التفويض، ومساعدات انتهاء صلاحية الرمز، ومساعدات الإلغاء |
    | `plugin-sdk/provider-auth-api-key` | مساعدات تهيئة مفاتيح API/كتابة الملف الشخصي مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ نتيجة مصادقة OAuth قياسي |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`، `ensureApiKeyFromOptionEnvOrPrompt`، `upsertAuthProfile`، `upsertApiKeyProfile`، `writeOAuthCredentials`، مساعدات استيراد مصادقة OpenAI Codex، وتصدير توافق `resolveOpenClawAgentDir` المهمل |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، منشئو سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تسوية معرفات النماذج المشتركة |
    | `plugin-sdk/provider-catalog-live-runtime` | مساعدات كتالوج نماذج المزوّد الحية لاكتشاف محروس بنمط `/models`: `buildLiveModelProviderConfig`، `fetchLiveProviderModelRows`، `getCachedLiveProviderModelRows`، `fetchLiveProviderModelIds`، `LiveModelCatalogHttpError`، `clearLiveCatalogCacheForTests`، ترشيح معرفات النماذج، ذاكرة مؤقتة TTL، واحتياط ثابت |
    | `plugin-sdk/provider-catalog-runtime` | خطاف وقت تشغيل تعزيز كتالوج المزوّد وواجهات سجل Plugin المزوّد لاختبارات العقد |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات قدرات HTTP/نقطة النهاية العامة للمزوّد، وأخطاء HTTP للمزوّد، ومساعدات نموذج multipart لتفريغ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات عقد ضيقة لتكوين/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لمزوّد web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتكوين/اعتماد web-search للمزوّدات التي لا تحتاج إلى توصيل تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد تكوين/اعتماد web-search مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، ومحددات/جالبات الاعتمادات ذات النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لمزوّد web-search |
    | `plugin-sdk/embedding-providers` | أنواع مزوّدات التضمين العامة ومساعدات القراءة، بما في ذلك `EmbeddingProviderAdapter`، و`getEmbeddingProvider(...)`، و`listEmbeddingProviders(...)`؛ تسجّل Plugins المزوّدات عبر `api.registerEmbeddingProvider(...)` حتى يتم فرض ملكية البيان |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخططات DeepSeek/Gemini/OpenAI + التشخيصات |
    | `plugin-sdk/provider-usage` | أنواع لقطات استخدام المزوّد، ومساعدات جلب الاستخدام المشتركة، وجالبات المزوّد مثل `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع أغلفة التدفق، وتوافق استدعاء الأدوات بالنص العادي، ومساعدات أغلفة مشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | مساعدات أغلفة تدفق المزوّد المشتركة العامة بما في ذلك `composeProviderStreamWrappers`، و`createOpenAICompatibleCompletionsThinkingOffWrapper`، و`createPlainTextToolCallCompatWrapper`، و`createPayloadPatchStreamWrapper`، و`createToolStreamWrapper`، و`normalizeOpenAICompatibleReasoningPayload`، و`setQwenChatTemplateThinking`، وأدوات تدفق متوافقة مع Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، واستخراج نص نتيجة الأداة، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تكوين التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/خريطة/ذاكرة مؤقتة محلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

عادةً ما تبلّغ لقطات استخدام المزوّد عن نافذة حصة واحدة أو أكثر ضمن `windows`، ولكل منها
تسمية، ونسبة مئوية مستخدمة، ووقت إعادة ضبط اختياري. يجب على المزوّدات التي تعرض رصيدًا أو
نص حالة حساب بدلًا من نوافذ حصص قابلة لإعادة الضبط أن تُرجع
`summary` مع مصفوفة `windows` فارغة بدلًا من اختلاق نسب مئوية.
يعرض OpenClaw نص الملخص هذا في مخرجات الحالة؛ استخدم `error` فقط عندما تفشل
نقطة نهاية الاستخدام أو لا تُرجع أي بيانات استخدام قابلة للاستعمال.

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | منشئو رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المعتمِد ومصادقة إجراءات المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات/مرشحات اعتماد التنفيذ الأصلي |
    | `plugin-sdk/approval-delivery-runtime` | محولات قدرة/تسليم الاعتماد الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الاعتماد |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محول الاعتماد الأصلي لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الاعتماد؛ فضّل واجهات المحول/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات هدف الاعتماد الأصلي، وربط الحساب، وبوابة المسار، واحتياط إعادة التوجيه، وكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reaction-runtime` | ارتباطات تفاعل اعتماد ثابتة، وحمولات مطالبة التفاعل، ومخازن أهداف التفاعل، وتصدير توافق لكبت مطالبة التنفيذ الأصلي المحلي |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولات رد اعتماد التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولات اعتماد التنفيذ/Plugin، ومساعدات توجيه/وقت تشغيل الاعتماد الأصلي، ومساعدات عرض الاعتماد المنظم مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة ضبط إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة دون حزمة الاختبار العامة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات نص أوامر خفيفة لمسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تسوية متن الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/التكوين |
    | `plugin-sdk/secret-provider-integration` | بيان تكامل مزوّد SecretRef مخصص للأنواع فقط وعقود الإعدادات المسبقة لـ Plugins التي تنشر إعدادات مسبقة لمزوّدي أسرار خارجيين |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، ومساعدات الملفات/المسارات المحدودة بالجذر بما في ذلك عمليات كتابة الإنشاء فقط، واستبدال الملفات الذري المتزامن/غير المتزامن، وكتابات مؤقتة شقيقة، واحتياط النقل عبر الأجهزة، ومساعدات مخزن الملفات الخاصة، وحراس الآباء للروابط الرمزية، والمحتوى الخارجي، وتنقيح النصوص الحساسة، ومقارنة الأسرار بزمن ثابت، ومساعدات جمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة السماح للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات dispatcher مثبتة ضيقة دون سطح وقت تشغيل البنية التحتية العام |
    | `plugin-sdk/ssrf-runtime` | مساعدات dispatcher مثبتة، وجلب محروس ضد SSRF، وخطأ SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook وتحويل websocket/النص الخام |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة نص الطلب |
  </Accordion>

  <Accordion title="مسارات runtime والتخزين الفرعية">
    | المسار الفرعي | التصديرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدين عامين لـ runtime والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدين محددين لبيئة runtime والمسجل والمهلة وإعادة المحاولة والتراجع |
    | `plugin-sdk/browser-config` | واجهة إعدادات متصفح مدعومة للملف الشخصي/الإعدادات الافتراضية المطبعة، وتحليل عنوان URL لـ CDP، ومساعدي مصادقة التحكم بالمتصفح |
    | `plugin-sdk/agent-harness-task-runtime` | مساعدين عامين لدورة حياة المهام وتسليم الإكمال للوكلاء المدعومين بحاضنة يستخدمون نطاق مهمة صادرًا من المضيف |
    | `plugin-sdk/codex-mcp-projection` | مساعد Codex مضمّن محجوز لإسقاط إعدادات خادم MCP الخاصة بالمستخدم في إعدادات سلسلة Codex؛ وليس مخصصًا للـ plugins التابعة لأطراف ثالثة |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Codex مضمّن خاص لربط مرآة المهمة الأصلية/الـ runtime؛ وليس مخصصًا للـ plugins التابعة لأطراف ثالثة |
    | `plugin-sdk/channel-runtime-context` | مساعدين عامين لتسجيل سياق runtime للقناة والبحث عنه |
    | `plugin-sdk/matrix` | واجهة توافق Matrix مهملة لحزم قنوات أطراف ثالثة أقدم؛ ينبغي للـ plugins الجديدة استيراد `plugin-sdk/run-command` مباشرة |
    | `plugin-sdk/mattermost` | واجهة توافق Mattermost مهملة لحزم قنوات أطراف ثالثة أقدم؛ ينبغي للـ plugins الجديدة استيراد المسارات الفرعية العامة من SDK مباشرة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدين مشتركين لأوامر/خطافات/http/تفاعلات Plugin |
    | `plugin-sdk/hook-runtime` | مساعدين مشتركين لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدين لاستيراد/ربط runtime الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدين لتنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدين للتنسيق والانتظار والإصدار واستدعاء الوسائط ومجموعة الأوامر الكسولة في CLI |
    | `plugin-sdk/qa-live-transport-scenarios` | معرّفات سيناريوهات QA للنقل الحي المشتركة، ومساعدي تغطية خط الأساس، ومساعد اختيار السيناريو |
    | `plugin-sdk/gateway-method-runtime` | مساعد محجوز لتوزيع طرق Gateway لمسارات HTTP الخاصة بالـ plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | عميل Gateway، ومساعد بدء عميل جاهز لحلقة الأحداث، وRPC لـ CLI الخاص بالـ gateway، وأخطاء بروتوكول gateway، ومساعدي تصحيح حالة القناة |
    | `plugin-sdk/config-contracts` | سطح إعدادات مركز على الأنواع فقط لأشكال إعدادات plugin مثل `OpenClawConfig` وأنواع إعدادات القناة/المزوّد |
    | `plugin-sdk/plugin-config-runtime` | مساعدين للبحث عن إعدادات plugin في runtime مثل `requireRuntimeConfig` و`resolvePluginConfigObject` و`resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | مساعدين لتعديل الإعدادات بالمعاملات مثل `mutateConfigFile` و`replaceConfigFile` و`logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | سلاسل تلميحات بيانات التعريف المشتركة لتسليم أدوات الرسائل |
    | `plugin-sdk/runtime-config-snapshot` | مساعدين للقطات إعدادات العملية الحالية مثل `getRuntimeConfig` و`getRuntimeConfigSnapshot` ومحددات لقطات الاختبار |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوص التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المضمّن متاحًا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات دون برميل النصوص الواسع |
    | `plugin-sdk/approval-reaction-runtime` | روابط تفاعل الموافقة المرمزة، وحمولات مطالبة التفاعل، ومخازن أهداف التفاعل، وتصدير توافق لكبت مطالبة التنفيذ الأصلية المحلية |
    | `plugin-sdk/approval-runtime` | مساعدين لموافقات التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدي المصادقة/الملف الشخصي، ومساعدي التوجيه/الـ runtime الأصلي، وتنسيق مسار عرض الموافقة المهيكل |
    | `plugin-sdk/reply-runtime` | مساعدين مشتركين لـ runtime الوارد/الرد، والتقسيم إلى أجزاء، والتوزيع، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدين محددين لتوزيع/إنهاء الرد وتسميات المحادثة |
    | `plugin-sdk/reply-history` | مساعدين مشتركين لسجل الردود بنافذة قصيرة. ينبغي لكود دورة الرسالة الجديدة استخدام `createChannelHistoryWindow`؛ تبقى مساعدين الخرائط منخفضة المستوى تصديرات توافق مهملة فقط |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدين محددين لتقسيم النص/Markdown إلى أجزاء |
    | `plugin-sdk/session-store-runtime` | مساعدين لسير عمل الجلسات (`getSessionEntry` و`listSessionEntries` و`patchSessionEntry` و`upsertSessionEntry`)، وقراءات محدودة لنصوص محاضر المستخدم/المساعد الحديثة حسب هوية الجلسة، ومساعدي مسار مخزن الجلسات/مفتاح الجلسة القديمة، وقراءات وقت التحديث، ومساعدي توافق لمسار الملف/المخزن الكامل خاصين بمرحلة الانتقال فقط |
    | `plugin-sdk/session-transcript-runtime` | هوية المحضر، ومساعدي الهدف/القراءة/الكتابة محددة النطاق، ونشر التحديثات، وأقفال الكتابة، ومفاتيح إصابات ذاكرة المحضر |
    | `plugin-sdk/sqlite-runtime` | مساعدين مركزين لمخطط وكيل SQLite والمسار والمعاملات في runtime الطرف الأول |
    | `plugin-sdk/cron-store-runtime` | مساعدين لمسار/تحميل/حفظ مخزن Cron |
    | `plugin-sdk/state-paths` | مساعدين لمسارات أدلة الحالة/OAuth |
    | `plugin-sdk/plugin-state-runtime` | أنواع حالة SQLite المفهرسة للمركبة الجانبية الخاصة بالـ Plugin، إضافة إلى إعداد مركزي لـ pragma الاتصال وصيانة WAL لقواعد البيانات المملوكة للـ Plugin |
    | `plugin-sdk/routing` | مساعدين لربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدين مشتركين لملخص حالة القناة/الحساب، والإعدادات الافتراضية لحالة runtime، ومساعدي بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدين مشتركين لحل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدين لتطبيع slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر محدد الوقت بنتائج stdout/stderr مطبعة |
    | `plugin-sdk/param-readers` | قارئات معاملات مشتركة للأدوات/CLI |
    | `plugin-sdk/tool-plugin` | تعريف Plugin بسيط ومكتوب لأدوات الوكيل وكشف بيانات تعريف ثابتة لتوليد manifest |
    | `plugin-sdk/tool-payload` | استخراج حمولات مطبعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القانونية من وسائط الأدوات |
    | `plugin-sdk/sandbox` | أنواع خلفية Sandbox ومساعدي أوامر SSH/OpenShell، بما في ذلك فحص مسبق لأوامر التنفيذ يفشل مبكرًا |
    | `plugin-sdk/temp-path` | مساعدين مشتركين لمسارات التنزيل المؤقت ومساحات عمل مؤقتة آمنة خاصة |
    | `plugin-sdk/logging-core` | مساعدين لمسجل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدين لوضع جدول Markdown والتحويل |
    | `plugin-sdk/model-session-runtime` | مساعدين لتجاوز النموذج/الجلسة مثل `applyModelOverrideToSessionEntry` و`resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | مساعدين لحل إعدادات مزود Talk |
    | `plugin-sdk/json-store` | مساعدين صغيرين لقراءة/كتابة حالة JSON |
    | `plugin-sdk/json-unsafe-integers` | مساعدين لتحليل JSON يحافظون على القيم الحرفية الصحيحة غير الآمنة كسلاسل |
    | `plugin-sdk/file-lock` | مساعدين لأقفال الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدين لذاكرة تخزين مؤقتة لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدين لـ runtime/جلسة ACP وتوزيع الردود |
    | `plugin-sdk/acp-runtime-backend` | مساعدين خفيفين لتسجيل خلفية ACP وتوزيع الردود للـ plugins المحملة عند بدء التشغيل |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل روابط ACP للقراءة فقط دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات محددة لمخطط إعدادات runtime للوكيل |
    | `plugin-sdk/boolean-param` | قارئ معامل منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدين لحل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدين لتمهيد الجهاز ورموز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقناة السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدين لرد أمر/مزود `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدين لسرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدين لتسجيل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي للـ plugins الموثوقة لحاضنات الوكلاء منخفضة المستوى: أنواع الحاضنة، ومساعدي توجيه/إيقاف التشغيل النشط، ومساعدي جسر أدوات OpenClaw، ومساعدي سياسة أدوات خطة runtime، وتصنيف النتيجة الطرفية، ومساعدي تنسيق/تفصيل تقدم الأدوات، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | واجهة مهملة مملوكة لمزود Z.AI لاكتشاف نقطة النهاية؛ استخدم API العامة لـ Plugin الخاص بـ Z.AI |
    | `plugin-sdk/async-lock-runtime` | مساعد قفل غير متزامن محلي للعملية لملفات حالة runtime الصغيرة |
    | `plugin-sdk/channel-activity-runtime` | مساعد قياس نشاط القناة |
    | `plugin-sdk/concurrency-runtime` | مساعد لتزامن المهام غير المتزامنة المحدود |
    | `plugin-sdk/dedupe-runtime` | مساعدين لذاكرة تخزين مؤقتة لإزالة التكرار داخل الذاكرة |
    | `plugin-sdk/delivery-queue-runtime` | مساعد لتصريف التسليمات الصادرة المعلقة |
    | `plugin-sdk/file-access-runtime` | مساعدين آمنين لمسارات الملفات المحلية ومصادر الوسائط |
    | `plugin-sdk/heartbeat-runtime` | مساعدين للإيقاظ والأحداث والرؤية في Heartbeat |
    | `plugin-sdk/number-runtime` | مساعد تحويل رقمي |
    | `plugin-sdk/secure-random-runtime` | مساعدين للرموز الآمنة/UUID |
    | `plugin-sdk/system-event-runtime` | مساعدين لطابور أحداث النظام |
    | `plugin-sdk/transport-ready-runtime` | مساعد انتظار جاهزية النقل |
    | `plugin-sdk/exec-approvals-runtime` | مساعدين لملف سياسة موافقات التنفيذ دون برميل infra-runtime الواسع |
    | `plugin-sdk/infra-runtime` | طبقة توافق مهملة؛ استخدم مسارات runtime الفرعية المركزة أعلاه |
    | `plugin-sdk/collection-runtime` | مساعدين صغيرين لذاكرة تخزين مؤقتة محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدين لعلامة التشخيص والحدث وسياق التتبع |
    | `plugin-sdk/error-runtime` | مساعدين لرسم بياني للأخطاء والتنسيق وتصنيف الأخطاء المشترك، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ملفوف، وproxy، وخيار EnvHttpProxyAgent، ومساعدي بحث مثبت |
    | `plugin-sdk/runtime-fetch` | fetch خاص بـ runtime يدرك الموزع دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | مساعدين لتنقية عنوان URL لبيانات الصور المضمنة واستنشاق التواقيع دون سطح runtime الوسائط الواسع |
    | `plugin-sdk/response-limit-runtime` | قارئ جسم استجابة محدود دون سطح runtime الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية دون توجيه الربط المكوّن أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدين لمخزن الجلسات دون استيرادات واسعة لكتابات/صيانة الإعدادات |
    | `plugin-sdk/sqlite-runtime` | مساعدين مركزين لمخطط وكيل SQLite والمسار والمعاملات دون عناصر تحكم دورة حياة قاعدة البيانات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وترشيح السياق التكميلي دون استيرادات إعدادات/أمان واسعة |
    | `plugin-sdk/string-coerce-runtime` | مساعدين محددين لتحويل وتطبيع السجل البدائي/السلاسل دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدين لتطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدين لإعدادات إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدين لدليل/هوية/مساحة عمل الوكيل، بما في ذلك `resolveAgentDir` و`resolveDefaultAgentDir` وتصدير التوافق المهمل `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الأدلة المدعومة بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط، بما في ذلك `saveRemoteMedia` و`saveResponseMedia` و`readRemoteMediaBuffer` و`fetchRemoteMedia` المهملة؛ فضّل مساعدات التخزين قبل قراءات المخزن المؤقت عندما ينبغي أن يصبح URL وسيط OpenClaw |
    | `plugin-sdk/media-mime` | تطبيع MIME محدود، وربط امتدادات الملفات، واكتشاف MIME، ومساعدات نوع الوسائط |
    | `plugin-sdk/media-store` | مساعدات محدودة لمخزن الوسائط مثل `saveMediaBuffer` و`saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزود فهم الوسائط، إضافة إلى صادرات مساعدات الصور/الصوت/الاستخراج المنظم الموجهة للمزودين |
    | `plugin-sdk/text-chunking` | مساعدات تقسيم/تصيير النص وMarkdown، وتحويل جداول Markdown، وتجريد وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع مزود الكلام، إضافة إلى صادرات التوجيه والسجل والتحقق ومنشئ TTS المتوافق مع OpenAI ومساعدات الكلام الموجهة للمزودين |
    | `plugin-sdk/speech-core` | أنواع مزود الكلام المشتركة، والسجل، والتوجيه، والتطبيع، وصادرات مساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزود التفريغ في الوقت الفعلي، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-bootstrap-context` | مساعد تمهيد ملف الوقت الفعلي لحقن سياق `IDENTITY.md` و`USER.md` و`SOUL.md` المحدود |
    | `plugin-sdk/realtime-voice` | أنواع مزود الصوت في الوقت الفعلي، ومساعدات السجل، ومساعدات سلوك الصوت في الوقت الفعلي المشتركة، بما في ذلك تتبع نشاط الإخراج |
    | `plugin-sdk/image-generation` | أنواع مزود توليد الصور، إضافة إلى مساعدات أصول الصور/عناوين URL للبيانات ومنشئ مزود الصور المتوافق مع OpenAI |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، ومساعدات التجاوز عند الفشل، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن المزود، وتحليل مرجع النموذج |
    | `plugin-sdk/transcripts` | أنواع مزود مصدر النصوص المشتركة، ومساعدات السجل، وواصفات الجلسات، وبيانات التعريف للعبارات المنطوقة |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير توافق مهملة؛ استورد `zod` من `zod` مباشرة |
    | `plugin-sdk/testing` | برميل توافق مهمل محلي للمستودع لاختبارات OpenClaw القديمة. يجب أن تستورد اختبارات المستودع الجديدة مسارات اختبار محلية مركزة مثل `plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers` أو `plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلاً من ذلك |
    | `plugin-sdk/plugin-test-api` | مساعد `createTestPluginApi` محلي ومحدود للمستودع لاختبارات وحدة تسجيل Plugin المباشرة من دون استيراد جسور مساعدات اختبار المستودع |
    | `plugin-sdk/agent-runtime-test-contracts` | تجهيزات عقد محول agent-runtime أصلية ومحلية للمستودع لاختبارات المصادقة، والتسليم، والتجاوز عند الفشل، وخطاف الأدوات، وتراكب الموجه، والمخطط، وإسقاط النصوص |
    | `plugin-sdk/channel-test-helpers` | مساعدات اختبار محلية للمستودع وموجهة للقنوات لعقود الإجراءات/الإعداد/الحالة العامة، وتأكيدات الأدلة، ودورة حياة بدء تشغيل الحساب، وتسلسل send-config، ومحاكيات وقت التشغيل، ومشكلات الحالة، والتسليم الصادر، وتسجيل الخطافات |
    | `plugin-sdk/channel-target-testing` | حزمة حالات أخطاء مشتركة ومحلية للمستودع لتحليل الأهداف في اختبارات القنوات |
    | `plugin-sdk/plugin-test-contracts` | مساعدات عقود محلية للمستودع لحزمة Plugin والتسجيل والأثر العام والاستيراد المباشر وواجهة API وقت التشغيل والآثار الجانبية للاستيراد |
    | `plugin-sdk/provider-test-contracts` | مساعدات عقود محلية للمستودع لوقت تشغيل المزود، والمصادقة، والاكتشاف، والإعداد الأولي، والفهرس، والمعالج، وقدرة الوسائط، وسياسة إعادة التشغيل، وSTT للصوت المباشر في الوقت الفعلي، والبحث/الجلب عبر الويب، والبث |
    | `plugin-sdk/provider-http-test-mocks` | محاكيات HTTP/المصادقة اختيارية ومحلية للمستودع في Vitest لاختبارات المزودين التي تختبر `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | تجهيزات محلية عامة للمستودع لالتقاط وقت تشغيل CLI، وسياق sandbox، وكاتب Skills، ورسالة الوكيل، وحدث النظام، وإعادة تحميل الوحدة، ومسار Plugin المضمن، ونص الطرفية، والتقسيم، ورمز المصادقة، والحالات ذات الأنواع |
    | `plugin-sdk/test-node-mocks` | مساعدات محاكاة مركزة ومحلية للمستودع لمكونات Node المدمجة لاستخدامها داخل مصانع Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمن لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-embedding-registry` | مساعدات سجل خفيفة لمزود تضمين الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك أساس مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، ووصول السجل، والمزود المحلي، ومساعدات الدُفعات/البعيد العامة. تم إهمال `registerMemoryEmbeddingProvider` على هذا السطح؛ استخدم واجهة API العامة لمزود التضمين للمزودين الجدد. |
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
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للبائع لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة للإضافات القريبة من الذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم توافق بديل مهمل؛ استخدم `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة لمساعدات الحزم المضمنة">
    المسارات الفرعية SDK المحجوزة لمساعدات الحزم المضمنة هي أسطح محدودة خاصة بالمالك
    لاستخدام كود Plugin المضمن. تُتبع في مخزون SDK حتى تظل عمليات بناء الحزم
    والأسماء البديلة حتمية، لكنها ليست واجهات API عامة لتأليف الإضافات. يجب أن تستخدم
    عقود المضيف الجديدة القابلة لإعادة الاستخدام مسارات SDK فرعية عامة
    مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime` و
    `plugin-sdk/plugin-config-runtime`.

    | المسار الفرعي | المالك والغرض |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | مساعد Plugin Codex المضمن لإسقاط إعدادات خادم MCP الخاصة بالمستخدم في إعدادات سلسلة app-server في Codex |
    | `plugin-sdk/codex-native-task-runtime` | مساعد Plugin Codex المضمن لعكس الوكلاء الفرعيين الأصليين في app-server ضمن Codex إلى حالة مهمة OpenClaw |

  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء الإضافات](/ar/plugins/building-plugins)
