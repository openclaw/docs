---
read_when:
    - اختيار المسار الفرعي الصحيح لـ plugin-sdk لعملية استيراد الإضافة
    - تدقيق المسارات الفرعية لـ bundled-plugin والأسطح المساعدة
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أماكن وجود عمليات الاستيراد المختلفة، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-04-25T18:21:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  يُعرَض Plugin SDK كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تُفهرس هذه الصفحة المسارات الفرعية الأكثر استخدامًا مجمعة حسب الغرض. وتوجد
  القائمة الكاملة المُولَّدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  وتظهر هناك مسارات فرعية محجوزة لمساعدات bundled-plugin لكنها تُعد
  تفصيلًا تنفيذيًا ما لم تُبرزها صفحة توثيق صراحةً.

  للاطلاع على دليل تأليف Plugin، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## مدخل Plugin

  | المسار الفرعي | الصادرات الأساسية |
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
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات config/action-gate متعددة الحسابات، ومساعدات fallback للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع account-id |
    | `plugin-sdk/account-resolution` | البحث عن الحساب + مساعدات fallback الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع fallback لعقد bundled |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابات تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة حياة/إنهاء draft stream |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء inbound route + envelope |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل inbound وإرساله |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع poll |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة thread-binding والمحوّل |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/thread binding والاقتران والربط المُكوَّن |
    | `plugin-sdk/runtime-config-snapshot` | مساعد snapshot لإعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل group-policy في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة لـ snapshot/summary لحالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض الكتابة إلى إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لإضافات القنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تحرير إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحراسة الخاصة بـ direct-DM |
    | `plugin-sdk/interactive-runtime` | مساعدات العرض الدلالي للرسائل، والتسليم، والردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | شريط توافق لمساعدات inbound debounce، ومطابقة الإشارات، ومساعدات mention-policy، ومساعدات envelope |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لـ inbound debounce |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لـ mention-policy ونصوص الإشارة من دون سطح وقت التشغيل inbound الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق inbound envelope |
    | `plugin-sdk/channel-location` | مساعدات سياق/تنسيق موقع القناة |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القنوات لعمليات إسقاط inbound وإخفاقات typing/ack |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات schema الأصلية المتقادمة التي ما تزال محفوظة لتوافق Plugin |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقود القنوات |
    | `plugin-sdk/channel-feedback` | توصيل feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد مزوّدي local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزوّدات self-hosted المتوافقة مع OpenAI |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية لـ CLI backend + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات وقت التشغيل لحل مفاتيح API لإضافات المزوّد |
    | `plugin-sdk/provider-auth-api-key` | مساعدات onboarding/كتابة ملفات التعريف لمفاتيح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني auth-result قياسي لـ OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل دخول تفاعلية مشتركة لإضافات المزوّد |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات env الخاصة بمصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة replay-policy المشتركون، ومساعدات نقاط نهاية المزوّد، ومساعدات تطبيع model-id مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقطة النهاية الخاصة بالمزوّد، وأخطاء HTTP الخاصة بالمزوّد، ومساعدات multipart form لنسخ الصوت إلى نص |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقود config/selection الخاصة بـ web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة التخزين المؤقت الخاصة بمزوّد web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعدادات/بيانات اعتماد web-search للمزوّدات التي لا تحتاج إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقود إعدادات/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وضبط/استرجاع بيانات الاعتماد ضمن نطاقها |
    | `plugin-sdk/provider-web-search` | مساعدات التسجيل/التخزين المؤقت/وقت التشغيل الخاصة بمزوّد web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف Gemini schema + التشخيصات، ومساعدات التوافق الخاصة بـ xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع stream wrapper، ومساعدات wrapper المشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات النقل الأصلية للمزوّد مثل guarded fetch، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات onboarding |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تنشيط المجموعة وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | أدوات بناء رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافق والمصادقة على الإجراءات داخل الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات تعريف/مرشحات اعتماد التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات قدرات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الخاص بالموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّل الموافقة الأصلي لنقاط دخول القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ ويفضَّل استخدام أسطح adapter/gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة للتنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة الموافقة للتنفيذ/Plugin، ومساعدات التوجيه/وقت التشغيل للموافقة الأصلية، ومساعدات العرض المنظم للموافقة مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبارات عقود القنوات من دون شريط testing الواسع |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسائط الديناميكية، ومساعدات session-target الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | محددات نص أوامر خفيفة لمسارات القنوات السريعة |
    | `plugin-sdk/command-surface` | تطبيع متن الأوامر ومساعدات سطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لتجميع عقود الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وأنواع SecretRef لتحليل عقود الأسرار/config |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابات DM، والمحتوى الخارجي، وتجميع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF الخاصة بقائمة سماح المضيفين والشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher من دون سطح وقت التشغيل infrastructure الواسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher، وfetch المحمي بـ SSRF، وسياسات SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم متن الطلب/المهلة الزمنية |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، وlogger، والمهلة الزمنية، وإعادة المحاولة، وbackoff |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل والبحث عن channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/HTTP/التفاعل الخاصة بـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI، والانتظار، والإصدار، واستدعاء الوسائط، ومجموعات الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة config ومساعدات البحث عن إعدادات Plugin |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram والتحقق من التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المجمّع متاحًا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون شريط text-runtime الواسع |
    | `plugin-sdk/approval-runtime` | مساعدات موافقة التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/ملفات التعريف، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار العرض المنظم للموافقة |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت التشغيل الوارد/الرد، والتجزئة، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد ومساعدات تسمية المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات حالة/OAuth dir |
    | `plugin-sdk/routing` | مساعدات route/session-key وربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخصات حالة القناة/الحساب، والإعدادات الافتراضية لحالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لمحلل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/string |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مُشغّل أوامر مؤقت النتائج مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات بارامترات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات logger الخاصة بالأنظمة الفرعية وطمس البيانات |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع/تحويل جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت التشغيل/الجلسة وإرسال الرد لـ ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط إعدادات agent runtime |
    | `plugin-sdk/boolean-param` | قارئ بارامتر boolean مرن |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات bootstrap الجهاز ورمز pairing |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقنوات السلبية، والحالة، وambient proxy |
    | `plugin-sdk/models-provider-runtime` | مساعدات أمر `/models`/ردود المزوّد |
    | `plugin-sdk/skill-commands-runtime` | مساعدات إدراج أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح Plugin موثوق تجريبي لأحزمة الوكيل منخفضة المستوى: أنواع harness، ومساعدات التوجيه/الإيقاف للتشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات تنسيق/تفاصيل تقدم الأدوات، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.AI |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات أعلام التشخيص والأحداث |
    | `plugin-sdk/error-runtime` | رسم الأخطاء، والتنسيق، ومساعدات التصنيف المشتركة للأخطاء، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، وproxy، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch وقت تشغيل مدرك لـ dispatcher من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لمتن الاستجابة من دون سطح media runtime الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المُكوَّن أو مخازن pairing |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة session-store من دون استيرادات واسعة لكتابة/صيانة config |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق التكميلي من دون استيرادات واسعة لـ config/security |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه/تطبيع record/string البدائية من دون استيرادات Markdown/logging |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات agent dir/الهوية/مساحة العمل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدليل المعتمد على config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بناة حمولة الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للاحتياط عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع مزوّد فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجهة للمزوّد |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات طمس البيانات، ومساعدات وسم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع مزوّد الكلام بالإضافة إلى صادرات المساعدات الخاصة بالتوجيه، والسجل، والتحقق، والكلام والموجهة للمزوّد |
    | `plugin-sdk/speech-core` | صادرات مشتركة لأنواع مزوّد الكلام، والسجل، والتوجيه، والتطبيع، ومساعدات الكلام |
    | `plugin-sdk/realtime-transcription` | أنواع مزوّد النسخ الفوري، ومساعدات السجل، ومساعد WebSocket session المشترك |
    | `plugin-sdk/realtime-voice` | أنواع مزوّد الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزوّد توليد الصور |
    | `plugin-sdk/image-generation-core` | أنواع مشتركة لتوليد الصور، ومساعدات الاحتياط عند الفشل، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع مشتركة لتوليد الموسيقى، ومساعدات الاحتياط عند الفشل، والبحث عن المزوّد، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع مشتركة لتوليد الفيديو، ومساعدات الاحتياط عند الفشل، والبحث عن المزوّد، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الأساسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المجمّع لمساعدات manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت التشغيل لـ index/search الخاصة بالذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود embedding لمضيف الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدُفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعدد الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للبائع لمساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار محايد للبائع لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown المشتركة للإضافات المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى search-manager |
    | `plugin-sdk/memory-host-status` | اسم مستعار محايد للبائع لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد memory-lancedb المجمّع |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المجمّعة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin Browser المجمّعة. يصدّر `browser-profiles` كلًا من `resolveBrowserConfig` و`resolveProfile` و`ResolvedBrowserConfig` و`ResolvedBrowserProfile` و`ResolvedBrowserTabCleanupConfig` للبنية المطبّعة لـ `browser.tabCleanup`. ويظل `browser-support` شريط التوافق. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعد/وقت التشغيل المجمّع لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعد/وقت التشغيل المجمّع لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعد المجمّع لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | طبقات توافق/مساعدات قنوات مجمّعة |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | طبقات مساعدات لميزات/إضافات مجمّعة؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء الإضافات](/ar/plugins/building-plugins)
