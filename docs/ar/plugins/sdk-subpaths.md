---
read_when:
    - اختيار المسار الفرعي المناسب لـ plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية لـ bundled-plugin وواجهات المساعدة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أي الاستيرادات توجد في أي مكان، مُجمَّعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  يتم عرض Plugin SDK كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تسرد هذه الصفحة المسارات الفرعية شائعة الاستخدام مُجمَّعة حسب الغرض. توجد
  القائمة الكاملة المُولَّدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  وتظهر فيها المسارات الفرعية المساعدة المحجوزة لـ bundled-plugin، لكنها تُعد
  تفصيلًا تنفيذيًا ما لم تروّج لها صفحة توثيق بشكل صريح.

  للاطلاع على دليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## مدخل Plugin

  | المسار الفرعي                     | الصادرات الأساسية                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذر لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبُناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات تهيئة الحسابات المتعددة/بوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط تهيئة القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع الرجوع إلى العقدة المضمّنة |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة الحياة/الإتمام لمسودة التدفق |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء التوجيه الوارد + الظرف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة للتسجيل والإرسال للردود الواردة |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات الهوية الصادرة، ومفوّض الإرسال، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط الخيوط والمحوّلات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المُهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة تهيئة وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط تهيئة القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة تهيئة القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تعديل تهيئة قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات الوصول إلى المجموعة |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية للرسائل الخاصة المباشرة |
    | `plugin-sdk/interactive-runtime` | العرض الدلالي للرسائل، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حزمة توافق لمساعدات إزالة الارتداد للوارد، ومطابقة الإشارات، ومساعدات سياسة الإشارة، ومساعدات الظرف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لإزالة الارتداد للوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة ونص الإشارة من دون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق الظرف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لحالات إسقاط الوارد وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلي المتقادمة المُحتفَظ بها لتوافق Plugin |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية لموفري الخدمة">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد موفري الخدمة المحليين/المستضافين ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفري الخدمة المستضافين ذاتيًا والمتوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية للواجهة الخلفية لـ CLI + ثوابت المراقبة |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفتاح API في وقت التشغيل لموفري الخدمة من نوع Plugin |
    | `plugin-sdk/provider-auth-api-key` | مساعدات تأهيل/كتابة ملف تعريف مفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتائج مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل دخول تفاعلية مشتركة لموفري الخدمة من نوع Plugin |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة موفر الخدمة |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبُناة سياسة الإعادة المشتركة، ومساعدات نقطة نهاية الموفر، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقطة النهاية لموفر الخدمة، بما في ذلك مساعدات نموذج multipart لتحويل الصوت إلى نص |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد التهيئة/الاختيار لـ web-fetch مثل `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة التخزين المؤقت لموفر web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتهيئة/بيانات اعتماد web-search لموفري الخدمة الذين لا يحتاجون إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد التهيئة/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومُعدّلات/قارئات بيانات الاعتماد ذات النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/ذاكرة تخزين مؤقت/وقت تشغيل لموفر web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل موفر الخدمة الأصلية مثل fetch المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تهيئة التأهيل |
    | `plugin-sdk/global-singleton` | مساعدات الكائن المفرد/الخريطة/ذاكرة التخزين المؤقت المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لنمط تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المُرسِل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المُوافِق والمصادقة على الإجراءات داخل الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف التعريف/المرشح للموافقة الأصلية على التنفيذ |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات إمكانات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد حل Gateway المشترك للموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّل الموافقة الأصلية لنقاط دخول القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ يُفضَّل استخدام واجهات adapter/gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة على التنفيذ/Plugin |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة التكرار للردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة من دون حزمة الاختبار الأوسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية + مساعدات الهدف الأصلي للجلسة |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | دوال محمولة خفيفة لنص الأوامر لمسارات القنوات السريعة |
    | `plugin-sdk/command-surface` | تطبيع جسم الأمر ومساعدات واجهة الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقود الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وكتابة SecretRef لتحليل عقد الأسرار/التهيئة |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل الخاصة المباشرة، والمحتوى الخارجي، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF لقائمة سماح المضيف والشبكة الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للمرسِل المثبّت من دون سطح وقت تشغيل البنية التحتية الأوسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات المرسِل المثبّت، و fetch المحمي من SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة الزمنية |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة الزمنية، وإعادة المحاولة، والتراجع التدريجي |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر Plugin / الخطافات / HTTP / التفاعل |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook / الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule`, `createLazyRuntimeMethod`، و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة التهيئة ومساعدات البحث عن تهيئة Plugin |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع اسم/وصف أوامر Telegram والتحقق من التكرار/التعارض، حتى عند عدم توفر سطح عقد Telegram المضمّن |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون حزمة text-runtime الأوسع |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة على التنفيذ/Plugin، وبناة إمكانات الموافقة، ومساعدات المصادقة/ملف التعريف، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتجزئة، والإرسال، و Heartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد ومساعدات تسمية المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext`, `recordPendingHistoryEntry`، و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات + updated-at |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات المسار/مفتاح الجلسة/ربط الحساب مثل `resolveAgentRoute`, `buildAgentSessionKey`، و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخصات حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر محدد بزمن مع نتائج stdout/stderr مُطبَّعة |
    | `plugin-sdk/param-readers` | قارئات معلمات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المُطبَّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي وتنقيح البيانات الحساسة |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع/تحويل جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات ACP لوقت التشغيل/الجلسة وإرسال الرد |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط تهيئة وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعلمات القيم المنطقية |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تمهيد الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقنوات السلبية، والحالة، والوكيل المحيطي |
    | `plugin-sdk/models-provider-runtime` | مساعدات أوامر `/models` وردود مزود الخدمة |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح Plugin موثوق تجريبي لأحزمة الوكيل منخفضة المستوى: أنواع الحزام، ومساعدات التوجيه/الإيقاف للتشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات تنسيق/تفاصيل تقدم الأداة، وأدوات نتيجة المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة التخزين المؤقت المحدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات العلامات والأحداث التشخيصية |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء البياني، والتنسيق، وتصنيف الأخطاء المشتركة، و `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك للمرسِل من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون سطح media runtime الأوسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المُهيأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسات من دون استيرادات الكتابة/الصيانة الأوسع للتهيئة |
    | `plugin-sdk/context-visibility-runtime` | حل ظهور السياق وتصفية السياق التكميلي من دون استيرادات التهيئة/الأمان الأوسع |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه/تطبيع السجلات البدائية والسلاسل النصية من دون استيرادات markdown/logging |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات تهيئة إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/الهوية/مساحة العمل |
    | `plugin-sdk/directory-runtime` | الاستعلام/إزالة التكرار للدليل المدعوم بالتهيئة |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتعامل مع الإخفاق في توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزودي فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجَّهة لمزودي الخدمة |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودي الكلام بالإضافة إلى صادرات المساعدات الموجَّهة لمزودي الخدمة الخاصة بالتوجيه والسجل والتحقق |
    | `plugin-sdk/speech-core` | مساعدات مشتركة لأنواع مزودي الكلام، والسجل، والتوجيه، والتطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع مزودي النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع مزودي الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودي توليد الصور |
    | `plugin-sdk/image-generation-core` | مساعدات مشتركة لأنواع توليد الصور، والتعامل مع الإخفاق، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | مساعدات مشتركة لأنواع توليد الموسيقى، ومساعدات التعامل مع الإخفاق، والبحث عن مزود الخدمة، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | مساعدات مشتركة لأنواع توليد الفيديو، ومساعدات التعامل مع الإخفاق، والبحث عن مزود الخدمة، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمّن لمساعدات المدير/التهيئة/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفر المحلي، ومساعدات الدُفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعدد الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورّد لمساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورّد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدار المشتركة للإضافات المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد memory-lancedb المضمّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin الخاصة بالمتصفح والمضمّنة (`browser-support` تظل حزمة التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعدة/وقت التشغيل المضمّن لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعدة/وقت التشغيل المضمّن لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعدة المضمّن لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | واجهات التوافق/المساعدة المضمّنة الخاصة بالقنوات |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | واجهات المساعدة المضمّنة الخاصة بالميزات/Plugins؛ ويُصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`، و `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
