---
read_when:
    - اختيار المسار الفرعي المناسب من plugin-sdk لعملية استيراد داخل Plugin
    - تدقيق المسارات الفرعية لـ Plugin المضمّن وواجهات المساعدات
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أيّ الاستيرادات توجد في أيّ مكان، مُجمّعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:37:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  يتم إتاحة Plugin SDK كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تسرد هذه الصفحة المسارات الفرعية الشائعة الاستخدام مجمّعة حسب الغرض. وتوجد
  القائمة الكاملة المُولَّدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  وتظهر فيها أيضًا المسارات الفرعية المحجوزة لمساعدات Plugins المضمّنة، لكنها تُعد
  تفصيلًا تنفيذيًا ما لم تقم صفحة توثيقية بالترويج لها صراحةً.

  للاطلاع على دليل تأليف Plugins، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## إدخال Plugin

  | المسار الفرعي                 | الصادرات الأساسية                                                                                                                     |
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
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبانيات حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات ضبط/بوابة إجراءات الحسابات المتعددة، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة النطاق لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق للأوامر المخصّصة في Telegram مع رجوع إلى العقد المضمّن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة النطاق لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة حياة/إنهاء تدفق المسودة |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة للمسار الوارد + بناء المغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الوارد وإرساله |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-send-deps` | بحث خفيف عن تبعيات الإرسال الصادر لمهايئات القنوات |
    | `plugin-sdk/outbound-runtime` | مساعدات التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة النطاق لتطبيع الاستطلاع |
    | `plugin-sdk/thread-bindings-runtime` | دورة حياة ربط الخيوط ومساعدات المهايئات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المهيّأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد إعدادات Runtime |
    | `plugin-sdk/runtime-group-policy` | مساعدات تحديد سياسة المجموعة في Runtime |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للّقطة/الملخّص الخاص بحالة القناة |
    | `plugin-sdk/channel-config-primitives` | أوليات ضيقة النطاق لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugins القنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تحرير إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرار الوصول إلى المجموعة |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية في الرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | مساعدات العرض الدلالي للرسائل، والتسليم، والردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | تجميعة توافقية لمساعدات إزالة الارتداد للوارد، ومطابقة الإشارات، وسياسة الإشارات، ومساعدات المغلف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة النطاق لإزالة الارتداد للوارد |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة النطاق لسياسة الإشارات ونص الإشارة من دون سطح Runtime الأوسع للوارد |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة النطاق لتنسيق المغلف الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق الموقع في القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل للقنوات الخاصة بإسقاطات الوارد وإخفاقات الكتابة/التأكيد |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلي المهجورة التي أُبقي عليها لتوافق Plugins |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيلات الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة النطاق لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسّقة لإعداد المزوّدات المحلية/المستضافة ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد المزوّدات المستضافة ذاتيًا المتوافقة مع OpenAI |
    | `plugin-sdk/cli-backend` | القيم الافتراضية لواجهة CLI الخلفية + ثوابت المراقب |
    | `plugin-sdk/provider-auth-runtime` | مساعدات Runtime لتحديد مفتاح API الخاصة بـ Plugins المزوّد |
    | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API/كتابة الملف الشخصي مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ Plugins المزوّد |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبانيات سياسة الإعادة المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقطة النهاية للمزوّد، وأخطاء HTTP الخاصة بالمزوّد، ومساعدات نموذج multipart لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة النطاق لعقد إعداد/اختيار الجلب من الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لمزوّد الجلب من الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة النطاق لإعداد/بيانات اعتماد البحث على الويب للمزوّدات التي لا تحتاج إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة النطاق لعقد إعداد/بيانات اعتماد البحث على الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وواضعات/جالبات بيانات الاعتماد المقيّدة النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات التسجيل/التخزين المؤقت/Runtime لمزوّد البحث على الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات التوافق لـ xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات مغلفات Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/الخريطة/التخزين المؤقت المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة النطاق لوضع تفعيل المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، ومساعدات تفويض المُرسِل |
    | `plugin-sdk/command-status` | بانيات رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات تحديد الموافق ومصادقة الإجراءات داخل المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات التعريف/المرشحات للموافقة الأصلية على التنفيذ |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات إمكانات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعدة مشتركة لتحديد Gateway الخاصة بالموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئات معالجة الموافقة الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات Runtime أوسع لمعالجة الموافقة؛ ويفضّل استخدام الواجهات الأضيق للمهايئ/‏Gateway عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة للتنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة الموافقة للتنفيذ/Plugin، ومساعدات التوجيه/Runtime للموافقة الأصلية، ومساعدات العرض المنظّم للموافقة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة النطاق لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة النطاق لاختبار عقد القناة من دون تجميعة الاختبار الواسعة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، ومساعدات الهدف الأصلي للجلسة |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | محددات نص الأوامر الخفيفة لمسارات القنوات السريعة |
    | `plugin-sdk/command-surface` | مساعدات تطبيع متن الأمر وسطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة النطاق لجمع عقود الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة النطاق لـ `coerceSecretRef` وأنواع `SecretRef` لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF لقائمة السماح الخاصة بالمضيف والشبكة الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة النطاق للمرسل المثبّت من دون سطح Runtime الأوسع للبنية التحتية |
    | `plugin-sdk/ssrf-runtime` | مساعدات المرسل المثبّت، والجلب المحمي من SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم متن الطلب/المهلة |
  </Accordion>

  <Accordion title="المسارات الفرعية لـ Runtime والتخزين">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لـ Runtime والتسجيل والنسخ الاحتياطي وتثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة النطاق لبيئة Runtime، والمسجل، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق Runtime الخاص بالقناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر Plugin/الخطافات/HTTP/التفاعل |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لـ Runtime مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI، والانتظار، والإصدار، واستدعاء الوسائط، ومجموعات الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات ومساعدات البحث عن إعدادات Plugin |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع اسم/وصف أوامر Telegram وفحص التكرارات/التعارضات، حتى عند عدم توفر سطح عقد Telegram المضمّن |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الربط التلقائي لمراجع الملفات من دون تجميعة text-runtime الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة للتنفيذ/Plugin، وبانيات إمكانات الموافقة، ومساعدات المصادقة/ملف التعريف، ومساعدات التوجيه/Runtime الأصلية، وتنسيق مسار عرض الموافقة المنظّم |
    | `plugin-sdk/reply-runtime` | مساعدات Runtime مشتركة للوارد/الرد، والتقطيع، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة النطاق لإرسال/إنهاء الرد ومساعدات تسمية المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة النطاق لتقطيع النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، والقيم الافتراضية لحالة Runtime، ومساعدات بيانات التعريف الخاصة بالمشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لمحلل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر بمهلة زمنية مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات وسائط شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جدول Markdown والتحويل |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات Runtime/الجلسة وإرسال الرد في ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | تحديد ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | أوليات ضيقة النطاق لمخطط إعدادات Runtime الخاصة بالوكيل |
    | `plugin-sdk/boolean-param` | قارئ وسائط منطقي مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات تحديد المطابقة للأسماء الخطِرة |
    | `plugin-sdk/device-bootstrap` | مساعدات التمهيد الأولي للجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | أوليات مساعدات مشتركة للقنوات الساكنة، والحالة، والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات ردود الأمر `/models`/المزوّد |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin الموثوق لأحزمة الوكيل منخفضة المستوى: أنواع الحزام، ومساعدات التوجيه/الإلغاء للتشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات سياسة أدوات خطة Runtime، وتصنيف مخرجات الطرفية، ومساعدات تنسيق/تفاصيل تقدّم الأداة، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة للتخزين المؤقت المحدود |
    | `plugin-sdk/diagnostic-runtime` | مساعدات أعلام التشخيص والأحداث |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء، والتنسيق، وتصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلّف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | جلب Runtime المدرك للمرسل من دون استيرادات الوكيل/الجلب المحمي |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لمتن الاستجابة من دون سطح media runtime الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المهيّأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسة من دون استيرادات الكتابة/الصيانة الواسعة للإعدادات |
    | `plugin-sdk/context-visibility-runtime` | مساعدات تحديد إتاحة السياق وتصفية السياق المكمّل من دون استيرادات الإعدادات/الأمان الواسعة |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة النطاق لإكراه/تطبيع السجلات البدائية/السلاسل النصية من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/هويته/مساحة عمله |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدليل المعتمد على الإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانات والاختبار">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بانيات حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة النطاق لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند الفشل في توليد الوسائط، واختيار المرشحين، ورسائل غياب النموذج |
    | `plugin-sdk/media-understanding` | أنواع مزوّدات فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجّهة للمزوّد |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقطيع النص الصادر |
    | `plugin-sdk/speech` | أنواع مزوّدات الكلام بالإضافة إلى صادرات الموجّهات والسجل والتحقق ومساعدات الكلام الموجّهة للمزوّد |
    | `plugin-sdk/speech-core` | صادرات مشتركة لأنواع مزوّدات الكلام، والسجل، والموجّهات، والتطبيع، ومساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزوّدات النسخ الفوري، ومساعدات السجل، ومساعدة جلسة WebSocket المشتركة |
    | `plugin-sdk/realtime-voice` | أنواع مزوّدات الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزوّدات توليد الصور |
    | `plugin-sdk/image-generation-core` | مساعدات مشتركة لأنواع توليد الصور، والتجاوز عند الفشل، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزوّدات/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | مساعدات مشتركة لأنواع توليد الموسيقى، والتجاوز عند الفشل، والبحث عن المزوّد، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع مزوّدات/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | مساعدات مشتركة لأنواع توليد الفيديو، والتجاوز عند الفشل، والبحث عن المزوّد، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | مساعدات سجل أهداف Webhook وتثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد `memory-core` المضمّن لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة Runtime للفهرسة/البحث في الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود التضمين لمضيف الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدُفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات Runtime الخاصة بـ CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات Runtime الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/Runtime لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمزوّد لمساعدات Runtime الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمزوّد لمساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمزوّد لمساعدات الملفات/Runtime لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدار المشتركة لـ Plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة Runtime لـ Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمزوّد لمساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد `memory-lancedb` المضمّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin المتصفح المضمّنة. يصدّر `browser-profiles` العناصر `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, و`ResolvedBrowserTabCleanupConfig` للشكل المطبع `browser.tabCleanup`. ويظل `browser-support` هو تجميعة التوافق. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعدات/Runtime المضمّن لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعدات/Runtime المضمّن لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعدات المضمّن لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | واجهات توافق/مساعدات القنوات المضمّنة |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | واجهات مساعدات الميزات/Plugins المضمّنة؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا العناصر `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
