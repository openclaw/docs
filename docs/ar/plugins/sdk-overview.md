---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - تريد مرجعًا لكل طرائق التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد، مرجع API للتسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-11T02:46:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bfeb5896f68e3e4ee8cf434d43a019e0d1fe5af57f5bf7a5172847c476def0c
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

تُعد Plugin SDK العقد المطبّق بالأنواع بين plugins وcore. وهذه الصفحة هي
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل عملي؟**
  - أول plugin؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - plugin قناة؟ راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins)
  - plugin مزوّد؟ راجع [Provider Plugins](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة ذاتيًا. وهذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. بالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
ففضّل `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للواجهة الشاملة الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تضف أو تعتمد على واجهات تسهيلية مسماة باسم المزوّد مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord` أو
`openclaw/plugin-sdk/signal` أو `openclaw/plugin-sdk/whatsapp`، أو
واجهات مساعدة تحمل علامة قناة معينة. ينبغي أن تركّب plugins المضمّنة
المسارات الفرعية العامة لـ SDK داخل ملفاتها `api.ts` أو `runtime-api.ts`،
ويجب على core إما استخدام هذه الملفات المحلية الخاصة بالplugin أو إضافة
عقد SDK عامًا ضيقًا عندما تكون الحاجة فعلًا عابرة للقنوات.

لا تزال خريطة التصدير المُولّدة تحتوي على مجموعة صغيرة من واجهات المساعدة
الخاصة بالplugins المضمّنة مثل `plugin-sdk/feishu` و`plugin-sdk/feishu-setup`
و`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. توجد
هذه المسارات الفرعية لصيانة plugins المضمّنة والتوافق فقط؛ وهي مُستبعدة
عن قصد من الجدول الشائع أدناه وليست مسار الاستيراد الموصى به للplugins
الجديدة التابعة لجهات خارجية.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمعة حسب الغرض. وتوجد القائمة الكاملة
المولّدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال المسارات الفرعية المحجوزة لمساعدات plugins المضمّنة تظهر في تلك
القائمة المولّدة. تعامل معها على أنها أسطح تنفيذ/توافق ما لم تروّج صفحة
توثيق لها صراحة على أنها عامة.

### إدخال plugin

| المسار الفرعي               | التصديرات الأساسية                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` ‏(`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات allowlist، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعداد/بوابة إجراءات متعددة الحسابات، ومساعدات الرجوع الاحتياطي للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الاحتياطي الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعداد القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع رجوع احتياطي للعقد المضمّن |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لتوجيه الوارد وبناء المغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الوارد وإرساله |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية/تفويض الإرسال الصادر |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ربط الخيوط والمهايئات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط الخيوط/الاقتران/الربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد إعدادات وقت التشغيل الملتقطة |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للّقطة/الملخص الخاص بحالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعداد القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعداد القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيد مشتركة لـ plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تعديل/قراءة إعداد allowlist |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات الوصول إلى المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حماية الرسائل الخاصة المباشرة |
    | `plugin-sdk/interactive-runtime` | مساعدات تطبيع/اختزال حمولات الرد التفاعلي |
    | `plugin-sdk/channel-inbound` | مساعدات إزالة الارتداد للوارد، ومطابقة الإشارات، وسياسة الإشارة، ومساعدات المغلف |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيلات الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّدين">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات إعداد منسقة للمزوّدات المحلية/المستضافة ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد مزوّدات OpenAI-compatible المستضافة ذاتيًا |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل API-key في وقت التشغيل لمكونات provider plugin |
    | `plugin-sdk/provider-auth-api-key` | مساعدات onboarding/profile-write الخاصة بـ API-key مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتائج مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ provider plugins |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات env الخاصة بمصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة replay-policy المشتركون، ومساعدات نقاط نهاية المزوّد، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقطة النهاية الخاصة بالمزوّد |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعداد/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة تخزين مؤقت/وقت تشغيل مزوّد web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للمزوّدات التي لا تحتاج إلى توصيل تمكين plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وضبط/جلب بيانات الاعتماد المقيّدة |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/ذاكرة تخزين مؤقت/وقت تشغيل مزوّد web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلّفات التدفق، ومساعدات المغلّفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع إعداد onboarding |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسِل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المعتمِد ومصادقة الإجراءات داخل الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف تعريف/تصفية موافقات exec الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرات/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد حل البوابة المشتركة للموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئات الموافقة الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ فضّل الواجهات الأضيق للمهايئ/البوابة عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الأهداف الأصلية للموافقة وربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة لـ exec/plugin |
    | `plugin-sdk/command-auth-native` | مساعدات مصادقة الأوامر الأصلية وأهداف الجلسات الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | تطبيع نص الأمر ومساعدات واجهة الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقود الأسرار لأسطح أسرار القناة/الplugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` ومساعدات كتابة الأنواع لـ SecretRef لتحليل عقود الأسرار/الإعداد |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وتقييد الرسائل الخاصة، والمحتوى الخارجي، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات allowlist للمضيفين وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher وfetch المحمي من SSRF وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات الطلب/الهدف الخاصة بـ webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة نص الطلب |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت plugins |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، وlogger، والمهلة، وإعادة المحاولة، وbackoff |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل والبحث عن سياق وقت تشغيل القناة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/‏hooks/‏HTTP/‏التفاعل الخاصة بالplugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العملية |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وترقيع حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعداد |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أمر Telegram والتحقق من التكرار/التعارض، حتى عند عدم توفر سطح عقد Telegram المضمّن |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة لـ exec/plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف التعريفي، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتجزئة، والإرسال، وheartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة و`updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/‏OAuth |
    | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة/ربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخصات حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات المشكلات الوصفية |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات معلمات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات logger للنظام الفرعي وإخفاء البيانات |
    | `plugin-sdk/markdown-table-runtime` | مساعدات أوضاع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات file-lock قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة تخزين مؤقت لإزالة التكرار مدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسة ACP وإرسال الرد |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط إعداد وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن للمعلمات المنطقية |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تهيئة الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقنوات السلبية والحالة والوكيل المحيطي |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد الخاصة بأمر `/models`/المزوّد |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات بناء/تسلسل/سجل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي للplugins الموثوقة الخاصة بأحزمة الوكيل منخفضة المستوى: أنواع الحزام، ومساعدات التوجيه/الإلغاء للتشغيلات النشطة، وجسر أدوات OpenClaw، وأدوات نتيجة المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات أعلام وأحداث التشخيص |
    | `plugin-sdk/error-runtime` | الرسم البياني للأخطاء، والتنسيق، ومساعدات تصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلّف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد وتشغيل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/الهوية/مساحة العمل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الدلائل المعتمد على الإعداد |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولات الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للرجوع الاحتياطي في توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع مزوّدات فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت الموجهة للمزوّد |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات إخفاء البيانات، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع مزوّدات الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق الموجهة للمزوّد |
    | `plugin-sdk/speech-core` | أنواع مزوّدات الكلام المشتركة، والسجل، والتوجيه، ومساعدات التطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع مزوّدات النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع مزوّدات الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزوّدات توليد الصور |
    | `plugin-sdk/image-generation-core` | أنواع توليد الصور المشتركة، والرجوع الاحتياطي، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع مزوّدات/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات الرجوع الاحتياطي، والبحث عن المزوّد، وتحليل مراجع النماذج |
    | `plugin-sdk/video-generation` | أنواع مزوّدات/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات الرجوع الاحتياطي، والبحث عن المزوّد، وتحليل مراجع النماذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمّن لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | تصديرات محرك embeddings لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات استعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة للplugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل الذاكرة النشطة للوصول إلى search-manager |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد memory-lancedb المضمّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم plugin الـ browser المضمّن (`browser-support` يبقى حزمة التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعدة/وقت التشغيل المضمّن لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعدة/وقت التشغيل المضمّن لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعدة المضمّن لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | واجهات توافق/مساعدة للقنوات المضمّنة |
    | مساعدات خاصة بالمصادقة/الplugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | واجهات مساعدة للميزات/الplugins المضمّنة؛ ويصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API التسجيل

تتلقى دالة الاستدعاء `register(api)` كائن `OpenClawPluginApi` بهذه
الطرائق:

### تسجيل القدرات

| الطريقة                                          | ما الذي تسجله                           |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | منفّذ وكيل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                    | خلفية CLI محلية للاستدلال             |
| `api.registerChannel(...)`                       | قناة مراسلة                            |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري مباشر                         |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوتية فورية ثنائية الاتجاه       |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو              |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                            |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                         |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                          |
| `api.registerWebFetchProvider(...)`              | مزوّد جلب / كشط الويب                  |
| `api.registerWebSearchProvider(...)`             | بحث الويب                              |

### الأدوات والأوامر

| الطريقة                         | ما الذي تسجله                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (إلزامية أو `{ optional: true }`)    |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                          |

### البنية التحتية

| الطريقة                                        | ما الذي تسجله                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP للـ Gateway           |
| `api.registerGatewayMethod(name, handler)`     | طريقة Gateway RPC                     |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                       |
| `api.registerService(service)`                 | خدمة في الخلفية                       |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                          |
| `api.registerMemoryPromptSupplement(builder)`  | قسم prompt إضافي مجاور للذاكرة        |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus إضافي للبحث/القراءة في الذاكرة |

تظل مساحات الأسماء الإدارية المحجوزة في core ‏(`config.*` و`exec.approvals.*` و`wizard.*` و
`update.*`) دائمًا `operator.admin`، حتى لو حاول plugin تعيين
نطاق أضيق لطريقة gateway. ويفضَّل استخدام بادئات خاصة بالplugin
للطرائق المملوكة للplugin.

### بيانات تسجيل CLI الوصفية

تقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية على المستوى الأعلى:

- `commands`: جذور أوامر صريحة يملكها المسجّل
- `descriptors`: واصفات أوامر في وقت التحليل تُستخدم لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للplugin

إذا كنت تريد أن يظل أمر plugin محمّلًا كسولًا في مسار CLI الجذري المعتاد،
فقدّم `descriptors` تغطي كل جذر أمر على المستوى الأعلى يكشفه ذلك
المسجّل.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "إدارة حسابات Matrix، والتحقق، والأجهزة، وحالة الملف التعريفي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` بمفرده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
ويظل مسار التوافق المتلهف هذا مدعومًا، لكنه لا يثبت عناصر نائبة مدعومة
بـ descriptor من أجل التحميل الكسول في وقت التحليل.

### تسجيل خلفية CLI

تتيح `api.registerCliBackend(...)` لـ plugin امتلاك الإعداد الافتراضي
لخلفية CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية نفس الشكل المستخدم في `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الفائز. يدمج OpenClaw قيمة `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية للplugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى إعادة كتابة توافق بعد الدمج
  (على سبيل المثال تطبيع أشكال الأعلام القديمة).

### الفتحات الحصرية

| الطريقة                                    | ما الذي تسجله                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك سياق (واحد فقط نشط في كل مرة). يتلقى رد النداء `assemble()` كلاً من `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص إضافات prompt. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | باني قسم prompt للذاكرة                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                  |

### مهايئات تضمين الذاكرة

| الطريقة                                        | ما الذي تسجله                                 |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة للplugin النشط            |

- تُعد `registerMemoryCapability` هي API المفضلة والحصرية الخاصة بـ plugin الذاكرة.
- قد تكشف `registerMemoryCapability` أيضًا عن `publicArtifacts.listArtifacts(...)`
  بحيث تتمكن plugins المرافقة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى
  التخطيط الخاص الداخلي لـ plugin ذاكرة معيّن.
- تُعد `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API قديمة متوافقة وحصرية لـ plugin الذاكرة.
- تتيح `registerMemoryEmbeddingProvider` لـ plugin الذاكرة النشط تسجيل
  معرّف مهايئ تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو معرّف
  مخصص يعرّفه plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجلة هذه.

### الأحداث ودورة الحياة

| الطريقة                                      | ما الذي تفعله              |
| -------------------------------------------- | -------------------------- |
| `api.on(hookName, handler, opts?)`           | hook دورة حياة مطبّق بالأنواع |
| `api.onConversationBindingResolved(handler)` | رد نداء ربط المحادثة        |

### دلالات قرار الـ hook

- `before_tool_call`: يكون الإرجاع `{ block: true }` نهائيًا. وبمجرد أن يضبطه أي معالج، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: يُعامل الإرجاع `{ block: false }` على أنه بلا قرار (مثل حذف `block`) وليس كتجاوز.
- `before_install`: يكون الإرجاع `{ block: true }` نهائيًا. وبمجرد أن يضبطه أي معالج، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: يُعامل الإرجاع `{ block: false }` على أنه بلا قرار (مثل حذف `block`) وليس كتجاوز.
- `reply_dispatch`: يكون الإرجاع `{ handled: true, ... }` نهائيًا. وبمجرد أن يدّعي أي معالج مسؤولية الإرسال، يتم تخطي المعالجات ذات الأولوية الأقل ومسار إرسال النموذج الافتراضي.
- `message_sending`: يكون الإرجاع `{ cancel: true }` نهائيًا. وبمجرد أن يضبطه أي معالج، يتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: يُعامل الإرجاع `{ cancel: false }` على أنه بلا قرار (مثل حذف `cancel`) وليس كتجاوز.

### حقول كائن API

| الحقل                   | النوع                     | الوصف                                                                                         |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | معرّف plugin                                                                                   |
| `api.name`              | `string`                  | اسم العرض                                                                                      |
| `api.version`           | `string?`                 | إصدار plugin ‏(اختياري)                                                                        |
| `api.description`       | `string?`                 | وصف plugin ‏(اختياري)                                                                          |
| `api.source`            | `string`                  | مسار مصدر plugin                                                                               |
| `api.rootDir`           | `string?`                 | الدليل الجذري لـ plugin ‏(اختياري)                                                             |
| `api.config`            | `OpenClawConfig`          | لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                        |
| `api.pluginConfig`      | `Record<string, unknown>` | الإعداد الخاص بالplugin من `plugins.entries.<id>.config`                                       |
| `api.runtime`           | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                    |
| `api.logger`            | `PluginLogger`            | logger مقيّد النطاق (`debug` و`info` و`warn` و`error`)                                         |
| `api.registrationMode`  | `PluginRegistrationMode`  | وضع التحميل الحالي؛ تمثل `"setup-runtime"` نافذة البدء/الإعداد الخفيفة قبل الإدخال الكامل     |
| `api.resolvePath(input)` | `(string) => string`     | حل المسار نسبةً إلى جذر plugin                                                                  |

## اصطلاح الوحدات الداخلية

داخل plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # تصديرات عامة للمستهلكين الخارجيين
  runtime-api.ts    # تصديرات داخلية فقط لوقت التشغيل
  index.ts          # نقطة إدخال plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد plugin الخاص بك مطلقًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. فمسار SDK هو العقد الخارجي فقط.
</Warning>

تُفضّل الآن الأسطح العامة للplugin المضمّن المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`،
و`index.ts`، و`setup-entry.ts`، وملفات الإدخال العامة المشابهة) استخدام
لقطة إعداد وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم
توجد لقطة وقت تشغيل بعد، فإنها تعود إلى ملف الإعداد المحلول على القرص.

يمكن لـ provider plugins أيضًا كشف barrel محلي ضيق خاص بالplugin عندما يكون
أحد المساعدات خاصًا عمدًا بالمزوّد ولا ينتمي بعد إلى مسار فرعي عام في SDK.
والمثال المضمّن الحالي: يحتفظ مزوّد Anthropic بمساعدات Claude stream الخاصة به
داخل واجهته العامة `api.ts` / `contract-api.ts` بدلًا من
ترقية منطق رؤوس Anthropic التجريبية و`service_tier` إلى عقد عام
`plugin-sdk/*`.

أمثلة مضمّنة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة المزوّد،
  ومساعدات النموذج الافتراضي، وبُناة مزوّدات الوقت الفعلي
- `@openclaw/openrouter-provider`: يصدّر `api.ts` باني المزوّد بالإضافة إلى
  مساعدات onboarding/config

<Warning>
  يجب أن يتجنب كود إنتاج extension أيضًا استيراد
  `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان أحد المساعدات مشتركًا فعلًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه حسب القدرة بدلًا من ربط pluginين معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) — التغليف وmanifest ومخططات الإعداد
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهجورة
- [الأجزاء الداخلية للplugin](/ar/plugins/architecture) — البنية العميقة ونموذج القدرات
