---
read_when:
    - اختيار المسار الفرعي المناسب في plugin-sdk لعملية استيراد داخل Plugin
    - تدقيق المسارات الفرعية لحِزم Plugins والأسطح المساعدة الخاصة بها
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أين توجد الاستيرادات، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-04-24T07:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff4b934501a3163e36b402db72dd75a260fe9f849b3823a7a05e4867a1a5e655
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  يتم كشف Plugin SDK كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تفهرس هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمعة حسب الغرض. وتوجد
  القائمة الكاملة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛ أما المسارات الفرعية المساعدة المحجوزة لحِزم Plugins فتظهر هناك لكنها تُعد
  تفصيلًا تنفيذيًا ما لم تقم صفحة توثيق بترقيتها صراحةً.

  للحصول على دليل تأليف Plugins، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## نقطة دخول Plugin

  | المسار الفرعي | أهم العناصر المصدّرة |
  | ------------- | -------------------- |
  | `plugin-sdk/plugin-entry` | `definePluginEntry` |
  | `plugin-sdk/core` | `defineChannelPluginEntry` و`createChatChannelPlugin` و`createChannelPluginBase` و`defineSetupPluginEntry` و`buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

  <AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | أهم العناصر المصدّرة |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry` و`defineSetupPluginEntry` و`createChatChannelPlugin` و`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface` و`createOptionalChannelSetupAdapter` و`createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter` و`createEnvPatchedAccountSetupAdapter` و`createSetupInputPresenceValidator` و`noteChannelLookupFailure` و`noteChannelLookupSummary` و`promptResolvedAllowFrom` و`splitSetupEntries` و`createAllowlistSetupWizardProxy` و`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand` و`detectBinary` و`extractArchive` و`resolveBrewExecutable` و`formatDocsLink` و`CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابات إجراءات الحسابات المتعددة، ومساعدات الرجوع الاحتياطي للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID` ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الاحتياطي الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة خاصة بسرد الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/التحقق من الأوامر المخصصة في Telegram مع رجوع احتياطي إلى العقد المضمن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة حياة/إنهاء تيار المسودة |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار والمغلف الوارد |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة للتسجيل والتوزيع للوارد |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية الصادر، ومفوّض الإرسال، وتخطيط الحمولات |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع poll |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة thread-binding والمهايئات |
    | `plugin-sdk/agent-media-payload` | بانٍ قديم لحمولة وسائط الوكيل |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/السلسلة، والاقتران، والروابط المضبوطة |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | أوليات ضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض الكتابة إلى إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيدية مشتركة لـ Plugin القنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تحرير إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية الخاصة بالرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | العرض الدلالي للرسائل، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حزمة توافق لمساعدات إزالة الارتداد للوارد، ومطابقة الإشارات، وسياسة الإشارة، ومساعدات المغلفات |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة الارتداد في الوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة ونص الإشارة من دون سطح وقت تشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق المغلف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق وتنسيق موقع القناة |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لحالات إسقاط الوارد وفشل typing/ack |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات مخططات أصلية قديمة مُبقاة لتوافق Plugins |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | ربط التغذية الراجعة/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments` و`getChannelSurface` و`pushAssignment` وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للـ Provider">
    | المسار الفرعي | أهم العناصر المصدّرة |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد providers المحلية/المستضافة ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد providers المتوافقة مع OpenAI والمستضافة ذاتيًا |
    | `plugin-sdk/cli-backend` | افتراضيات CLI backend + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API في وقت التشغيل لـ Plugins الخاصة بالـ provider |
    | `plugin-sdk/provider-auth-api-key` | مساعدات onboarding/الكتابة إلى الملف الشخصي لمفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | بانٍ معياري لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات مشتركة لتسجيل الدخول التفاعلي لـ Plugins الخاصة بالـ provider |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة الخاصة بمصادقة provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod` و`ensureApiKeyFromOptionEnvOrPrompt` و`upsertAuthProfile` و`upsertApiKeyProfile` و`writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily` و`buildProviderReplayFamilyHooks` و`normalizeModelCompat` وبناة سياسة replay المشتركة، ومساعدات نقاط نهاية provider، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate` و`buildSingleProviderApiKeyCatalog` و`supportsNativeStreamingUsageCompat` و`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط نهاية provider، بما في ذلك مساعدات multipart form الخاصة بتحويل الصوت إلى نص |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعداد/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات التسجيل/التخزين المؤقت الخاصة بمزوّد web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للـ providers التي لا تحتاج إلى ربط تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` ومحددات setters/getters الخاصة ببيانات الاعتماد |
    | `plugin-sdk/provider-web-search` | مساعدات التسجيل/التخزين المؤقت/وقت التشغيل الخاصة بمزود web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily` و`buildProviderStreamFamilyHooks` و`composeProviderStreamWrappers` وأنواع stream wrapper، ومساعدات wrappers المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل provider الأصلية مثل guarded fetch، وتحويلات رسائل النقل، وتيارات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات onboarding |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية على مستوى العملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | أهم العناصر المصدّرة |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حلّ الموافقين ومصادقة الإجراءات في الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات الملفات/المرشحات الخاصة بموافقات Exec الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرات/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحلّ gateway الخاصة بالموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئات الموافقات الأصلية لنقاط دخول القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ ويفضَّل استخدام منافذ المهايئ/gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلية للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة الرد الخاصة بموافقات exec/plugin |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين dedupe للردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة من دون حزمة الاختبار الواسعة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية + مساعدات استهداف الجلسات الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | محددات نصية خفيفة للأوامر في مسارات القنوات الساخنة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقود الأسرار لأسطح أسرار القنوات/Plugins |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` ومساعدات الكتابة الخاصة بـ SecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة سماح المضيف وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للموزع المثبّت من دون سطح وقت تشغيل البنية الواسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات الموزع المثبّت، والجلب المحمي بـ SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | أهم العناصر المصدّرة |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugins |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة، وإعادة المحاولة، وbackoff |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة للأوامر/الـ hooks/‏HTTP/التفاعلات الخاصة بالـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لمسار Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات ومساعدات البحث عن إعدادات Plugin |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما يكون سطح عقد Telegram المضمن غير متاح |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون حزمة text-runtime الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات exec/plugin، وبناة قدرات الموافقة، ومساعدات auth/profile، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقطيع، والتوزيع، وheartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لتوزيع/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لتاريخ الرد ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقطيع النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات route/session-key/account binding مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخصات حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحلّ الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات معلمات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقتة |
    | `plugin-sdk/logging-core` | المسجل الفرعي ومساعدات التنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع/تحويل جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات أقفال الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات cache إزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل ACP/الجلسة وتوزيع الرد |
    | `plugin-sdk/acp-binding-resolve-runtime` | حلّ ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | أوليات ضيقة لمخطط إعدادات وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعلمات boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حلّ مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات bootstrap للأجهزة ورموز الاقتران |
    | `plugin-sdk/extension-shared` | أوليات مشتركة لمساعدات passive-channel، والحالة، والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات رد provider في أمر `/models` |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ trusted-plugin لأحزمة الوكيل منخفضة المستوى: أنواع harness، ومساعدات steer/abort للتشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات تنسيق/تفاصيل تقدم الأداة، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقاط نهاية Z.AI |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة cache محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات أعلام وأحداث التشخيص |
    | `plugin-sdk/error-runtime` | رسم بياني للأخطاء، والتنسيق، ومساعدات تصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلفة، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | جلب وقت تشغيل مدرك للموزع من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون سطح وقت تشغيل الوسائط الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة الربط الحالية للمحادثة من دون توجيه الروابط المضبوطة أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسة من دون استيرادات الكتابة الواسعة إلى الإعدادات/الصيانة |
    | `plugin-sdk/context-visibility-runtime` | حلّ رؤية السياق وتصفية السياق الإضافي من دون استيرادات الإعدادات/الأمان الواسعة |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه/تطبيع السلاسل والسجلات البدائية من دون استيرادات markdown/logging |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف وSCP host |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد/تشغيل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/الهوية/مساحة العمل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار للدليل المدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | أهم العناصر المصدّرة |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بناة حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لـ failover في توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزود media understanding بالإضافة إلى صادرات مساعدات الصور/الصوت الموجهة للـ provider |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات directive-tag، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقطيع النص الصادر |
    | `plugin-sdk/speech` | أنواع مزود الكلام بالإضافة إلى صادرات الموجهات والسجل والتحقق الموجهة للـ provider |
    | `plugin-sdk/speech-core` | أنواع مزود الكلام المشتركة، والسجل، والتوجيه، ومساعدات التطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع مزود النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع مزود الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزود توليد الصور |
    | `plugin-sdk/image-generation-core` | الأنواع المشتركة لتوليد الصور، وfailover، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | الأنواع المشتركة لتوليد الموسيقى، ومساعدات failover، والبحث عن provider، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | الأنواع المشتركة لتوليد الفيديو، ومساعدات failover، والبحث عن provider، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | `zod` مُعاد تصديره لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases` و`shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | أهم العناصر المصدّرة |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح المساعد المضمّن لـ memory-core لمساعدات manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لفهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات batch/remote العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للبائع لمساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار محايد للبائع لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown المشتركة للـ Plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل الذاكرة النشطة للوصول إلى search-manager |
    | `plugin-sdk/memory-host-status` | اسم مستعار محايد للبائع لمساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح المساعد المضمّن لـ memory-lancedb |
  </Accordion>

  <Accordion title="المسارات الفرعية المساعدة المجمعة المحجوزة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp` و`plugin-sdk/browser-config-runtime` و`plugin-sdk/browser-config-support` و`plugin-sdk/browser-control-auth` و`plugin-sdk/browser-node-runtime` و`plugin-sdk/browser-profiles` و`plugin-sdk/browser-security-runtime` و`plugin-sdk/browser-setup-tools` و`plugin-sdk/browser-support` | مساعدات دعم Plugin المتصفح المجمّعة (`browser-support` تبقى حزمة التوافق) |
    | Matrix | `plugin-sdk/matrix` و`plugin-sdk/matrix-helper` و`plugin-sdk/matrix-runtime-heavy` و`plugin-sdk/matrix-runtime-shared` و`plugin-sdk/matrix-runtime-surface` و`plugin-sdk/matrix-surface` و`plugin-sdk/matrix-thread-bindings` | سطح مساعدات/وقت تشغيل Matrix المجمّع |
    | Line | `plugin-sdk/line` و`plugin-sdk/line-core` و`plugin-sdk/line-runtime` و`plugin-sdk/line-surface` | سطح مساعدات/وقت تشغيل LINE المجمّع |
    | IRC | `plugin-sdk/irc` و`plugin-sdk/irc-surface` | سطح مساعدات IRC المجمّع |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat` و`plugin-sdk/zalouser` و`plugin-sdk/bluebubbles` و`plugin-sdk/bluebubbles-policy` و`plugin-sdk/mattermost` و`plugin-sdk/mattermost-policy` و`plugin-sdk/feishu-conversation` و`plugin-sdk/msteams` و`plugin-sdk/nextcloud-talk` و`plugin-sdk/nostr` و`plugin-sdk/tlon` و`plugin-sdk/twitch` | منافذ توافق/مساعدات القنوات المجمّعة |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login` و`plugin-sdk/github-copilot-token` و`plugin-sdk/diagnostics-otel` و`plugin-sdk/diffs` و`plugin-sdk/llm-task` و`plugin-sdk/thread-ownership` و`plugin-sdk/voice-call` | منافذ مساعدات المزايا/Plugins المجمّعة؛ ويقوم `plugin-sdk/github-copilot-token` حاليًا بتصدير `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [Building Plugins](/ar/plugins/building-plugins)
