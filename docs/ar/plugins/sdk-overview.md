---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من Plugin SDK يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد في SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد، ومرجع API للتسجيل، وبنية Plugin SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-22T07:18:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57019e6f9a7fed7842ac575e025b6db41d125f5fa9d0d1de03923fdb1f6bcc3
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

يمثل Plugin SDK العقد المطبوع بين Plugins والنواة. وتعد هذه الصفحة
مرجعًا لـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل إرشادي؟**
  - أول Plugin؟ ابدأ من [Getting Started](/ar/plugins/building-plugins)
  - Plugin للقنوات؟ راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins)
  - Plugin لموفّر؟ راجع [Provider Plugins](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومكتفية ذاتيًا. يحافظ ذلك على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. وبالنسبة إلى أدوات الإدخال/البناء الخاصة بالقنوات،
فمن المفضل استخدام `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` لواجهة
المظلة الأوسع وللمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تُضف ولا تعتمد على واجهات تسهيلية مسماة باسم الموفّر مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord` أو
`openclaw/plugin-sdk/signal` أو `openclaw/plugin-sdk/whatsapp` أو
واجهات مساعدة تحمل علامة القناة. يجب على bundled plugins تركيب
المسارات الفرعية العامة في SDK داخل حاويات `api.ts` أو `runtime-api.ts` الخاصة بها، ويجب على النواة
إما استخدام هذه الحاويات المحلية الخاصة بالـ plugin أو إضافة عقد SDK عام وضيّق
عندما تكون الحاجة مشتركة فعلًا بين القنوات.

لا تزال خريطة التصدير المُولّدة تتضمن مجموعة صغيرة من
واجهات المساعدة الخاصة بـ bundled-plugin مثل `plugin-sdk/feishu` و`plugin-sdk/feishu-setup`
و`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. هذه
المسارات الفرعية موجودة فقط لصيانة bundled-plugin والتوافق؛ وقد أُزيلت عمدًا من الجدول الشائع أدناه
وليست مسار الاستيراد الموصى به للـ Plugins الخارجية الجديدة.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمعة حسب الغرض. توجد القائمة الكاملة المُولّدة التي تضم
أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال المسارات الفرعية المحجوزة لمساعدات bundled-plugin تظهر في تلك القائمة المُولّدة.
تعامل معها على أنها تفاصيل تنفيذ/واجهات توافق، ما لم تقم صفحة وثائق
بالترويج الصريح لإحداها على أنها عامة.

### إدخال Plugin

| المسار الفرعي                | أهم التصديرات                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`    | `definePluginEntry`                                                                                                                      |
| `plugin-sdk/core`            | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`   | `OpenClawSchema`                                                                                                                         |
| `plugin-sdk/provider-entry`  | `defineSingleProviderPluginEntry`                                                                                                        |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات مشتركة لمعالج الإعداد، ورسائل allowlist، وبُناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات متعددة الحسابات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعداد القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق للأوامر المخصصة في Telegram مع رجوع إلى bundled-contract |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة الحياة/الإنهاء لمسودة التدفق |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة للتوجيه الوارد + بناء الظرف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة للتسجيل الوارد ثم الإرسال |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات الهوية الصادرة، ومفوّض الإرسال، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة الحياة والمهايئ لربط الخيوط |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط العامل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط الخيوط، والاقتران، والربط المُعد |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسات المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للّقطة/الملخص الخاص بحالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعداد القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيدية مشتركة لـ channel plugin |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تعديل إعدادات allowlist |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية الخاصة بـ direct-DM |
    | `plugin-sdk/interactive-runtime` | مساعدات العرض الدلالي للرسائل، والتسليم، والردود التفاعلية القديمة. راجع [Message Presentation](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حاوية توافق لمساعدات inbound debounce، ومطابقة الإشارات، ومساعدات mention-policy، ومساعدات الظرف |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسات الإشارة من دون واجهة وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لحالات إسقاط الوارد وإخفاقات typing/ack |
    | `plugin-sdk/channel-send-result` | أنواع نتيجة الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلي المتقادمة المُحتفَظ بها لتوافق plugin |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل التغذية الراجعة/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّد">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد الموفّرات المحلية/المستضافة ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفّر مستضاف ذاتيًا ومتوافق مع OpenAI |
    | `plugin-sdk/cli-backend` | القيم الافتراضية للواجهة الخلفية لـ CLI + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل API key في وقت التشغيل لـ provider plugins |
    | `plugin-sdk/provider-auth-api-key` | مساعدات ضم API key وكتابة الملف التعريفي مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني قياسي لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل دخول تفاعلية مشتركة لـ provider plugins |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة الخاصة بمصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبُناة سياسات replay المشتركة، ومساعدات endpoint الخاصة بالموفّر، ومساعدات تطبيع model-id مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/endpoint الخاصة بالموفّر |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعداد/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/ذاكرة تخزين مؤقت لـ web-fetch provider |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للموفّرين الذين لا يحتاجون إلى توصيل تمكين plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وواضعات/جالبات بيانات الاعتماد ذات النطاق المحدد |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/ذاكرة تخزين مؤقت/وقت تشغيل لـ web-search provider |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات التوافق الخاصة بـ xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه ذلك |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات النقل الأصلية الخاصة بالموفّر مثل fetch المحمي، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات التهيئة |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache محلية للعملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | Subpath | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل المُوافق ومصادقة الإجراءات داخل المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات الملف التعريفي/عامل التصفية الخاصة بالموافقة على التنفيذ الأصلي |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد حل Gateway للموافقة المشتركة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئ الموافقة الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ استخدم واجهات adapter/gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة على التنفيذ/Plugin |
    | `plugin-sdk/command-auth-native` | المصادقة الأصلية للأوامر + مساعدات هدف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | تطبيع نص الأمر ومساعدات واجهة الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لتجميع عقود الأسرار لواجهات أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | `coerceSecretRef` الضيق ومساعدات typing الخاصة بـ SecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة DM، والمحتوى الخارجي، وتجميع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF الخاصة بقائمة سماح المضيف والشبكة الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher من دون واجهة وقت تشغيل البنية الأوسع |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher، وfetch المحمي من SSRF، ومساعدات سياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم نص الطلب/المهلة الزمنية |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | Subpath | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة الزمنية، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل والبحث عن سياق وقت تشغيل القناة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/HTTP/التفاعل الخاصة بـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عند غياب واجهة عقد Telegram المضمنة |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون الحاوية الأوسع لـ text-runtime |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة على التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف التعريفي، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتجزئة، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات أدلة state/OAuth |
    | `plugin-sdk/routing` | مساعدات route/session-key وربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات المشكلات الوصفية |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات شائعة لمعاملات الأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج حمولات مطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من معاملات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقتة |
    | `plugin-sdk/logging-core` | مساعدات مسجل subsystem والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات file-lock قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة التخزين المؤقت لإزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت التشغيل/الجلسة وإرسال الردود الخاصة بـ ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط إعداد وقت تشغيل العامل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعاملات boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات التمهيد الأولي للجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقنوات السلبية، والحالة، والوكيل المحيطي |
    | `plugin-sdk/models-provider-runtime` | مساعدات أوامر `/models`/ردود الموفّر |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل الأوامر الأصلي/البناء/التسلسل |
    | `plugin-sdk/agent-harness` | واجهة تجريبية لـ Plugin موثوق للمسارات منخفضة المستوى الخاصة بـ agent harnesses: أنواع harness، ومساعدات التوجيه/الإيقاف للتشغيل النشط، ومساعدات جسر أدوات OpenClaw، وأدوات نتيجة المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.AI |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات الأعلام والأحداث التشخيصية |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء، والتنسيق، والتصنيف المشترك للأخطاء، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك لـ dispatcher من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لنص الاستجابة من دون واجهة وقت تشغيل الوسائط الأوسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المُعد أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسة من دون استيرادات واسعة لكتابة/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | حل ظهور السياق وتصفية السياق الإضافي من دون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة للإكراه والتطبيع للسلاسل/السجلات البدائية من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد إعادة المحاولة ومشغّلها |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل العامل |
    | `plugin-sdk/directory-runtime` | الاستعلام عن الأدلة المدعوم بالإعدادات/إزالة التكرار |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | Subpath | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولة الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند فشل توليد الوسائط، واختيار المرشحين، ورسائل النموذج المفقود |
    | `plugin-sdk/media-understanding` | أنواع موفّر فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت الموجّهة للموفّر |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات العرض/التجزئة/الجداول في Markdown، ومساعدات التنقيح، ومساعدات وسم التوجيهات، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع موفّر الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق الموجّهة للموفّر |
    | `plugin-sdk/speech-core` | أنواع موفّر الكلام المشتركة، والسجل، والتوجيه، ومساعدات التطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع موفّر النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع موفّر الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفّر توليد الصور |
    | `plugin-sdk/image-generation-core` | الأنواع المشتركة لتوليد الصور، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | الأنواع المشتركة لتوليد الموسيقى، ومساعدات التجاوز عند الفشل، والبحث عن الموفّر، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع موفّر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | الأنواع المشتركة لتوليد الفيديو، ومساعدات التجاوز عند الفشل، والبحث عن الموفّر، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت route |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | Subpath | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/memory-core` | واجهة المساعدة المضمنة memory-core لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت التشغيل للفهرسة/البحث الخاصة بالذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفّر المحلي، والمساعدات العامة للدفعات/عن بُعد |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown مشتركة للـ Plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة Active Memory لوقت التشغيل للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | واجهة المساعدة المضمنة memory-lancedb |
  </Accordion>

  <Accordion title="المسارات الفرعية المساعدة المضمنة المحجوزة">
    | الفئة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | المتصفح | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin المتصفح المضمنة (`browser-support` تبقى حاوية التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | واجهة المساعدة/وقت التشغيل المضمنة لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | واجهة المساعدة/وقت التشغيل المضمنة لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | واجهة المساعدة المضمنة لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | واجهات التوافق/المساعدة المضمنة الخاصة بالقنوات |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | واجهات المساعدة المضمنة للميزات/Plugins؛ ويصدر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API التسجيل

يتلقى رد النداء `register(api)` كائن `OpenClawPluginApi` بهذه
الأساليب:

### تسجيل القدرات

| الأسلوب                                          | ما الذي يسجله                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                 |
| `api.registerAgentHarness(...)`                  | منفذ عامل منخفض المستوى تجريبي        |
| `api.registerCliBackend(...)`                    | واجهة خلفية محلية للاستدلال في CLI     |
| `api.registerChannel(...)`                       | قناة مراسلة                            |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق                         |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوتية فورية ثنائية الاتجاه      |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو             |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                            |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                         |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                          |
| `api.registerWebFetchProvider(...)`              | موفّر جلب / كشط الويب                 |
| `api.registerWebSearchProvider(...)`             | البحث على الويب                        |

### الأدوات والأوامر

| الأسلوب                        | ما الذي يسجله                                  |
| ----------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة عامل (مطلوبة أو `{ optional: true }`)   |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                         |

### البنية التحتية

| الأسلوب                                         | ما الذي يسجله                         |
| ----------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | خطاف أحداث                            |
| `api.registerHttpRoute(params)`                 | نقطة نهاية HTTP في Gateway            |
| `api.registerGatewayMethod(name, handler)`      | أسلوب RPC في Gateway                  |
| `api.registerCli(registrar, opts?)`             | أمر فرعي في CLI                       |
| `api.registerService(service)`                  | خدمة في الخلفية                       |
| `api.registerInteractiveHandler(registration)`  | معالج تفاعلي                          |
| `api.registerEmbeddedExtensionFactory(factory)` | مصنع امتداد المشغّل المضمن في Pi      |
| `api.registerMemoryPromptSupplement(builder)`   | قسم إضافي للمطالبة مجاور للذاكرة      |
| `api.registerMemoryCorpusSupplement(adapter)`   | متن إضافي للبحث/القراءة في الذاكرة    |

تظل مساحات الأسماء الإدارية الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) دائمًا `operator.admin`، حتى إذا حاول Plugin تعيين
نطاق أضيق لأسلوب Gateway. ويفضَّل استخدام بادئات خاصة بالـ plugin
للأساليب التي يملكها plugin.

استخدم `api.registerEmbeddedExtensionFactory(...)` عندما يحتاج Plugin إلى
توقيت أحداث أصلي خاص بـ Pi أثناء التشغيلات المضمنة لـ OpenClaw، مثل إعادة كتابة
`tool_result` غير المتزامنة التي يجب أن تحدث قبل إصدار رسالة النتيجة النهائية للأداة.
هذه واجهة bundled-plugin اليوم: لا يمكن إلا للـ Plugins المضمنة تسجيل واحدة، ويجب
أن تعلن `contracts.embeddedExtensionFactories: ["pi"]` في
`openclaw.plugin.json`. واحتفظ بخطافات Plugin العادية في OpenClaw لكل ما
لا يتطلب هذه الواجهة منخفضة المستوى.

### بيانات تعريف تسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات التعريف العليا:

- `commands`: جذور أوامر صريحة يملكها المسجِّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للـ plugin

إذا كنت تريد أن يبقى أمر plugin محمّلًا كسولًا في المسار الجذري العادي لـ CLI،
فقدّم `descriptors` تغطي كل جذر أوامر من المستوى الأعلى يكشفه
ذلك المسجِّل.

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
        description: "إدارة حسابات Matrix والتحقق والأجهزة وحالة الملف الشخصي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` وحده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
لا يزال مسار التوافق المتحمّس هذا مدعومًا، لكنه لا يثبت
عناصر نائبة مدعومة بالواصفات للتحميل الكسول وقت التحليل.

### تسجيل الواجهة الخلفية لـ CLI

يتيح `api.registerCliBackend(...)` لPlugin امتلاك الإعداد الافتراضي لواجهة
خلفية محلية لـ CLI خاصة بالذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالواجهة الخلفية هو بادئة الموفّر في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالواجهة الخلفية البنية نفسها المستخدمة في `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الأعلى أولوية. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي للـ plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج واجهة خلفية إلى إعادة كتابة للتوافق بعد الدمج
  (مثل تطبيع أشكال الرايات القديمة).

### الفتحات الحصرية

| الأسلوب                                    | ما الذي يسجله                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | محرك سياق (واحد نشط في كل مرة). يتلقى رد النداء `assemble()` كلًا من `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص إضافات المطالبة. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحدة                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | باني قسم مطالبة الذاكرة                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | محلل خطة تفريغ الذاكرة                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                 |

### مهايئات تضمين الذاكرة

| الأسلوب                                        | ما الذي يسجله                                  |
| --------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة الخاص بالـ plugin النشط   |

- يُعد `registerMemoryCapability` هو API المفضل والحصري لـ plugin الذاكرة.
- قد يكشف `registerMemoryCapability` أيضًا عن `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المصاحبة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى
  التخطيط الخاص الداخلي لـ plugin ذاكرة معيّن.
- تُعد `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API حصرية ومتوافقة مع القديم لـ plugin الذاكرة.
- يتيح `registerMemoryEmbeddingProvider` لـ plugin الذاكرة النشط تسجيل
  معرّف مهايئ تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو معرّف مخصص
  يعرّفه plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجلة تلك.

### الأحداث ودورة الحياة

| الأسلوب                                      | ما الذي يفعله                 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مطبوع         |
| `api.onConversationBindingResolved(handler)` | رد نداء لحل ربط المحادثة      |

### دلالات قرارات الخطافات

- `before_tool_call`: تُعد إعادة `{ block: true }` نهائية. وبمجرد أن يعيّنها أي معالج، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها عدم وجود قرار (مثل حذف `block`)، وليس على أنها تجاوز.
- `before_install`: تُعد إعادة `{ block: true }` نهائية. وبمجرد أن يعيّنها أي معالج، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها عدم وجود قرار (مثل حذف `block`)، وليس على أنها تجاوز.
- `reply_dispatch`: تُعد إعادة `{ handled: true, ... }` نهائية. وبمجرد أن يطالب أي معالج بالإرسال، يتم تخطي المعالجات ذات الأولوية الأقل ومسار الإرسال الافتراضي للنموذج.
- `message_sending`: تُعد إعادة `{ cancel: true }` نهائية. وبمجرد أن يعيّنها أي معالج، يتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها عدم وجود قرار (مثل حذف `cancel`)، وليس على أنها تجاوز.

### حقول كائن API

| الحقل                   | النوع                     | الوصف                                                                                     |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | معرّف Plugin                                                                              |
| `api.name`              | `string`                  | اسم العرض                                                                                 |
| `api.version`           | `string?`                 | إصدار Plugin (اختياري)                                                                    |
| `api.description`       | `string?`                 | وصف Plugin (اختياري)                                                                      |
| `api.source`            | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`           | `string?`                 | الدليل الجذري لـ Plugin (اختياري)                                                         |
| `api.config`            | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة وقت تشغيل نشطة داخل الذاكرة عند توفرها)                     |
| `api.pluginConfig`      | `Record<string, unknown>` | إعدادات خاصة بـ Plugin من `plugins.entries.<id>.config`                                  |
| `api.runtime`           | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                               |
| `api.logger`            | `PluginLogger`            | مسجل ذو نطاق محدد (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`  | `PluginRegistrationMode`  | وضع التحميل الحالي؛ ويمثل `"setup-runtime"` نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`     | حل المسار نسبةً إلى جذر Plugin                                                            |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاص بك، استخدم ملفات الحاوية المحلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # التصديرات العامة للمستهلكين الخارجيين
  runtime-api.ts    # تصديرات وقت التشغيل الداخلية فقط
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة للـ bundled plugin المحمّلة عبر الواجهة (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`، وملفات الإدخال العامة المشابهة)
لقطة إعدادات وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن
لقطة وقت التشغيل موجودة بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.

يمكن أيضًا لـ provider plugins كشف حاوية عقد محلية خاصة بالـ plugin عندما يكون
المساعد خاصًا عمدًا بالموفّر ولا ينتمي بعد إلى مسار فرعي عام في SDK.
المثال المضمن الحالي: يحتفظ موفّر Anthropic
بمساعدات تدفق Claude في الواجهة العامة الخاصة به `api.ts` / `contract-api.ts`
بدلًا من ترقية منطق رأس Anthropic التجريبي و`service_tier` إلى
عقد عام في `plugin-sdk/*`.

أمثلة مضمنة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة الموفّر،
  ومساعدات النموذج الافتراضي، وبُناة الموفّر الفوري
- `@openclaw/openrouter-provider`: يصدّر `api.ts` باني الموفّر بالإضافة إلى
  مساعدات التهيئة/الإعدادات

<Warning>
  يجب أيضًا على كود إنتاج الامتدادات تجنب استيرادات `openclaw/plugin-sdk/<other-plugin>`.
  وإذا كان أحد المساعدات مشتركًا فعلًا، فقم بترقيته إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو أي
  واجهة أخرى موجهة حسب القدرة بدلًا من ربط Plugins اثنين معًا.
</Warning>

## ذو صلة

- [Entry Points](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [Runtime Helpers](/ar/plugins/sdk-runtime) — مرجع كامل لمساحة الأسماء `api.runtime`
- [Setup and Config](/ar/plugins/sdk-setup) — التغليف، والبيانات الوصفية، ومخططات الإعدادات
- [Testing](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [SDK Migration](/ar/plugins/sdk-migration) — الترحيل من الأسطح المتقادمة
- [Plugin Internals](/ar/plugins/architecture) — البنية العميقة ونموذج القدرات
