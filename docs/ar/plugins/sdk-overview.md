---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في `OpenClawPluginApi`
    - أنت تبحث عن تصدير محدد في SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد، مرجع API للتسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-17T07:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

يمثل Plugin SDK العقد المطبوع بين المكونات الإضافية والنواة. تُعد هذه الصفحة
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل إرشادي؟**
  - أول مكوّن إضافي؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - مكوّن إضافي للقنوات؟ راجع [المكونات الإضافية للقنوات](/ar/plugins/sdk-channel-plugins)
  - مكوّن إضافي للموفّر؟ راجع [المكونات الإضافية للموفّر](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. يساعد ذلك في إبقاء بدء التشغيل سريعًا
ويمنع مشكلات التبعيات الدائرية. بالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فإن المسار المفضّل هو `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للسطح الأشمل والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تُضف أو تعتمد على مسارات ربط مريحة تحمل أسماء موفّرين مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord` أو
`openclaw/plugin-sdk/signal` أو `openclaw/plugin-sdk/whatsapp` أو
مسارات المساعدات ذات العلامات الخاصة بالقنوات. يجب على المكونات الإضافية المضمّنة
تجميع المسارات الفرعية العامة من SDK داخل ملفات `api.ts` أو `runtime-api.ts`
الخاصة بها، ويجب على النواة إما استخدام هذه الملفات المحلية الخاصة بالمكوّن الإضافي
أو إضافة عقد عام ضيق في SDK عندما تكون الحاجة فعلًا عابرة للقنوات.

لا تزال خريطة التصدير المُولَّدة تحتوي على مجموعة صغيرة من مسارات المساعدات الخاصة
بالمكونات الإضافية المضمّنة مثل `plugin-sdk/feishu` و`plugin-sdk/feishu-setup`
و`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. توجد هذه
المسارات الفرعية فقط لصيانة المكونات الإضافية المضمّنة والتوافق، ولذلك أُزيلت عمدًا
من الجدول الشائع أدناه وليست مسار الاستيراد الموصى به للمكونات الإضافية الجديدة من
جهات خارجية.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمّعة حسب الغرض. توجد القائمة الكاملة
المُولَّدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال مسارات المساعدات المحجوزة الخاصة بالمكونات الإضافية المضمّنة تظهر في تلك
القائمة المُولَّدة. تعامل معها على أنها أسطح تنفيذ داخلية/توافقية ما لم تروّج لها
صفحة توثيق صراحةً باعتبارها عامة.

### إدخال المكوّن الإضافي

| المسار الفرعي                     | أهم التصديرات                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات تهيئة/بوابة إجراءات متعددة الحسابات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط تهيئة القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع الرجوع إلى العقد المضمّن |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لتوجيه الوارد + بناء الغلاف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الوارد وإرساله |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية الإرسال/مفوّض الإرسال الصادر |
    | `plugin-sdk/thread-bindings-runtime` | دورة حياة ربط الخيوط ومساعدات المهايئ |
    | `plugin-sdk/agent-media-payload` | بانٍ قديم لحمولة وسائط الوكيل |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة تهيئة وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | أوليات ضيقة لمخطط تهيئة القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة تهيئة القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيدية مشتركة للمكونات الإضافية للقنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تحرير تهيئة قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات الوصول إلى المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية الخاصة بالرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | مساعدات تطبيع/اختزال حمولة الرد التفاعلي |
    | `plugin-sdk/channel-inbound` | مساعدات إلغاء الارتداد للوارد، ومطابقة الإشارات، وسياسات الإشارة، ومساعدات الغلاف |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | ربط الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للموفّر">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات إعداد منسّقة للموفّرين المحليين/المستضافين ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات إعداد مركزة للموفّر المستضاف ذاتيًا والمتوافق مع OpenAI |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت المراقبة |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفتاح API وقت التشغيل للمكونات الإضافية للموفّرين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد/كتابة ملف تعريف مفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | بانٍ قياسي لنتائج مصادقة OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة للمكونات الإضافية للموفّرين |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة سياسات إعادة التشغيل المشتركة، ومساعدات نقاط نهاية الموفّر، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لإمكانات HTTP/نقاط نهاية الموفّر |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد تهيئة/اختيار الجلب عبر الويب مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لموفّر الجلب عبر الويب |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتهيئة/اعتماد البحث عبر الويب للموفّرين الذين لا يحتاجون إلى ربط تمكين المكوّن الإضافي |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد تهيئة/اعتماد البحث عبر الويب مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وضبط/جلب بيانات الاعتماد ضمن النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات وقت التشغيل/التخزين المؤقت/التسجيل لموفّر البحث عبر الويب |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات التوافق الخاصة بـ xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح تهيئة الإعداد الأولي |
    | `plugin-sdk/global-singleton` | مساعدات العملية المحلية للمفردات/الخرائط/التخزين المؤقت |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حلّ المعتمِد ومصادقة الإجراءات داخل نفس الدردشة |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف التعريف/المرشّح للموافقة على التنفيذ الأصلي |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات إمكانات/تسليم الموافقة الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الخاص بالموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئ الموافقة الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أشمل لوقت تشغيل معالج الموافقة؛ يُفضَّل استخدام مسارات المهايئ/Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة الرد الخاصة بموافقات التنفيذ/Plugin |
    | `plugin-sdk/command-auth-native` | مساعدات المصادقة الأصلية للأوامر + هدف الجلسة الأصلي |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لتجميع عقود الأسرار لأسطح أسرار القنوات/Plugin |
    | `plugin-sdk/secret-ref-runtime` | `coerceSecretRef` الضيق ومساعدات كتابة SecretRef لتحليل عقود الأسرار/التهيئة |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وتقييد الرسائل المباشرة، والمحتوى الخارجي، وتجميع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF لقائمة السماح بالمضيفين والشبكات الخاصة |
    | `plugin-sdk/ssrf-runtime` | مساعدات المرسِل المثبّت، وfetch المحمي من SSRF، وسياسات SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات الطلب/الهدف الخاصة بـ Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة الزمنية |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات عامة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت المكونات الإضافية |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة الزمنية، وإعادة المحاولة، والتراجع التدريجي |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة للأوامر/الخطافات/HTTP/التفاعل الخاصة بـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة التهيئة |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المضمّن متاحًا |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات التنفيذ/Plugin، وبناة إمكانات الموافقة، ومساعدات المصادقة/الملف التعريفي، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتجزئة، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الرد ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة/ربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات التعريف الخاصة بالمشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحلّ الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر مؤقّت بنتائج `stdout`/`stderr` مطبّعة |
    | `plugin-sdk/param-readers` | قارئات معلمات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأدوات |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات أوضاع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات إعادة الدخول لقفل الملفات |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة التخزين المؤقت لإزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل ACP/الجلسة وإرسال الرد |
    | `plugin-sdk/agent-config-primitives` | أوليات ضيقة لمخطط تهيئة وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعلمات boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات تهيئة الجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | أوليات مساعدة مشتركة للقناة السلبية، والحالة، والوكيل المحيطي |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد الخاصة بأمر `/models`/الموفّر |
    | `plugin-sdk/skill-commands-runtime` | مساعدات عرض أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات السجل/البناء/التسلسل للأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي موثوق لـ Plugin لأحزمة الوكيل منخفضة المستوى: أنواع الحزام، ومساعدات التوجيه/الإيقاف للتشغيل النشط، وجسر أدوات OpenClaw، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقاط نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات الأعلام والأحداث التشخيصية |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء، والتنسيق، وتصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات تهيئة إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/الهوية/مساحة العمل |
    | `plugin-sdk/directory-runtime` | الاستعلام عن الدليل المعتمد على التهيئة/إزالة التكرار |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولات الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند الفشل في توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع موفّر فهم الوسائط بالإضافة إلى تصديرات المساعدات الخاصة بالصور/الصوت الموجّهة للموفّرين |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات العرض/التجزئة/الجداول في Markdown، ومساعدات التنقيح، ومساعدات وسم التوجيهات، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع موفّر الكلام بالإضافة إلى التوجيهات، والسجل، ومساعدات التحقق الموجّهة للموفّرين |
    | `plugin-sdk/speech-core` | أنواع موفّر الكلام المشتركة، والسجل، والتوجيهات، ومساعدات التطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع موفّر النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع موفّر الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفّر توليد الصور |
    | `plugin-sdk/image-generation-core` | الأنواع المشتركة لتوليد الصور، ومساعدات التجاوز عند الفشل، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | الأنواع المشتركة لتوليد الموسيقى، ومساعدات التجاوز عند الفشل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع موفّر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | الأنواع المشتركة لتوليد الفيديو، ومساعدات التجاوز عند الفشل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المضمّن لمساعدات المدير/التهيئة/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لفهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمينات مضيف الذاكرة، والوصول إلى السجل، والموفّر المحلي، ومساعدات الدفعات/المهام البعيدة العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد تجاه المورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد تجاه المورّد لمساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد تجاه المورّد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدار المشتركة للمكونات الإضافية المرتبطة بالذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة Active Memory لوقت التشغيل للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد تجاه المورّد لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد memory-lancedb المضمّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin المضمّن للمتصفح (`browser-support` يبقى حزمة التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعدة/وقت التشغيل المضمّن لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعدة/وقت التشغيل المضمّن لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعدة المضمّن لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | مسارات توافق/مساعدة مضمّنة للقنوات |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | مسارات مساعدة مضمّنة للميزات/Plugin؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API التسجيل

يتلقى رد النداء `register(api)` كائن `OpenClawPluginApi` بهذه
الأساليب:

### تسجيل القدرات

| الأسلوب                                           | ما الذي يسجله                    |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | استدلال النص (LLM)               |
| `api.registerAgentHarness(...)`                  | منفّذ وكيل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)`                    | واجهة CLI خلفية محلية للاستدلال  |
| `api.registerChannel(...)`                       | قناة مراسلة                      |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق                   |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فوري ثنائية الاتجاه   |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو        |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                   |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                    |
| `api.registerWebFetchProvider(...)`              | موفّر جلب / كشط الويب            |
| `api.registerWebSearchProvider(...)`             | البحث على الويب                  |

### الأدوات والأوامر

| الأسلوب                          | ما الذي يسجله                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)    |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                         |

### البنية التحتية

| الأسلوب                                         | ما الذي يسجله                       |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف أحداث                          |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP لـ Gateway          |
| `api.registerGatewayMethod(name, handler)`     | أسلوب RPC لـ Gateway                |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                     |
| `api.registerService(service)`                 | خدمة في الخلفية                     |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                        |
| `api.registerMemoryPromptSupplement(builder)`  | قسم إضافي في المطالبة مجاور للذاكرة |
| `api.registerMemoryCorpusSupplement(adapter)`  | متن إضافي للبحث/القراءة في الذاكرة  |

تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) دائمًا `operator.admin` حتى إذا حاول Plugin تعيين نطاق أضيق
لأسلوب Gateway. استخدم بادئات خاصة بـ Plugin
للأساليب التي يملكها Plugin.

### بيانات تعريف تسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات التعريف عالية المستوى:

- `commands`: جذور أوامر صريحة يملكها المسجِّل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للمكوّنات الإضافية

إذا كنت تريد أن يبقى أمر Plugin محمّلًا بكسل في مسار CLI الجذري العادي،
فقدّم `descriptors` تغطي كل جذر أمر عالي المستوى يكشفه
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
        description: "إدارة حسابات Matrix، والتحقق، والأجهزة، وحالة الملف الشخصي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` بمفرده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
لا يزال مسار التوافق المتعجل هذا مدعومًا، لكنه لا يثبت
عناصر نائبة مدعومة بواصفات للتحميل الكسول في وقت التحليل.

### تسجيل الواجهة الخلفية لـ CLI

يتيح `api.registerCliBackend(...)` لـ Plugin امتلاك التهيئة الافتراضية
لواجهة CLI خلفية محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالواجهة الخلفية بادئة الموفّر في مراجع النماذج مثل `codex-cli/gpt-5`.
- تستخدم `config` الخاصة بالواجهة الخلفية البنية نفسها مثل `agents.defaults.cliBackends.<id>`.
- تظل تهيئة المستخدم لها الأولوية. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية الخاصة بـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج واجهة خلفية إلى إعادة كتابة توافقية بعد الدمج
  (على سبيل المثال تطبيع الأشكال القديمة للأعلام).

### الخانات الحصرية

| الأسلوب                                     | ما الذي يسجله                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد فقط نشط في كل مرة). يتلقى رد النداء `assemble()` القيمتين `availableTools` و`citationsMode` حتى يتمكن المحرك من تكييف إضافات المطالبة. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحّدة                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | بانٍ لقسم مطالبة الذاكرة                                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                               |

### مهايئات تضمين الذاكرة

| الأسلوب                                         | ما الذي يسجله                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة الخاص بـ Plugin النشط |

- `registerMemoryCapability` هو API الذاكرة الحصري المفضّل لـ Plugin.
- قد يكشف `registerMemoryCapability` أيضًا `publicArtifacts.listArtifacts(...)`
  بحيث يمكن للمكونات الإضافية المصاحبة استهلاك عناصر الذاكرة المُصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط الخاص
  الداخلي لمكوّن ذاكرة إضافي محدد.
- إن `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي واجهات API حصرية للمكوّنات الإضافية الخاصة بالذاكرة
  ومتوافقة مع الأنظمة القديمة.
- يتيح `registerMemoryEmbeddingProvider` لمكوّن الذاكرة الإضافي النشط تسجيل
  معرّف مهايئ تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو معرّف
  مخصص يعرّفه Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` في مقابل معرّفات المهايئات
  المسجّلة تلك.

### الأحداث ودورة الحياة

| الأسلوب                                       | ما الذي يفعله            |
| -------------------------------------------- | ------------------------ |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مضبوط الأنواع |
| `api.onConversationBindingResolved(handler)` | رد نداء ربط المحادثة     |

### دلالات قرار الخطاف

- `before_tool_call`: إن إرجاع `{ block: true }` نهائي. بمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: إن إرجاع `{ block: false }` يُعامل على أنه بلا قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: إن إرجاع `{ block: true }` نهائي. بمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: إن إرجاع `{ block: false }` يُعامل على أنه بلا قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: إن إرجاع `{ handled: true, ... }` نهائي. بمجرد أن يعلن أي معالج أنه تولى الإرسال، يتم تخطي المعالجات ذات الأولوية الأقل ومسار إرسال النموذج الافتراضي.
- `message_sending`: إن إرجاع `{ cancel: true }` نهائي. بمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: إن إرجاع `{ cancel: false }` يُعامل على أنه بلا قرار (مثل حذف `cancel`)، وليس كتجاوز.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                     |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                              |
| `api.name`               | `string`                  | اسم العرض                                                                                 |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                    |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                                      |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | الدليل الجذري لـ Plugin (اختياري)                                                         |
| `api.config`             | `OpenClawConfig`          | لقطة التهيئة الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                    |
| `api.pluginConfig`       | `Record<string, unknown>` | تهيئة خاصة بـ Plugin من `plugins.entries.<id>.config`                                     |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | مسجل ضمن النطاق (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ تشير `"setup-runtime"` إلى نافذة البدء/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار بالنسبة إلى جذر Plugin                                                          |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية للاستيراد الداخلي:

```
my-plugin/
  api.ts            # تصديرات عامة للمستهلكين الخارجيين
  runtime-api.ts    # تصديرات داخلية فقط لوقت التشغيل
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد Plugin الخاص بك أبدًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة للمكونات الإضافية المضمّنة المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة)
لقطة تهيئة وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن
لقطة وقت التشغيل موجودة بعد، فإنها ترجع إلى ملف التهيئة المحلول على القرص.

يمكن لمكونات الموفّر الإضافية أيضًا كشف حزمة عقد محلية ضيقة خاصة بـ Plugin عندما
يكون أحد المساعدات خاصًا بالموفّر عمدًا ولا ينتمي بعد إلى مسار فرعي عام في SDK.
المثال المضمّن الحالي: يحتفظ موفّر Anthropic بمساعدات تدفق Claude
في مساره العام الخاص `api.ts` / `contract-api.ts` بدلًا من
ترقية منطق رأس Anthropic التجريبي و`service_tier` إلى عقد عام
`plugin-sdk/*`.

أمثلة مضمّنة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة الموفّر،
  ومساعدات النموذج الافتراضي، وبُناة الموفّر الفوري
- `@openclaw/openrouter-provider`: يصدّر `api.ts` باني الموفّر بالإضافة إلى
  مساعدات الإعداد الأولي/التهيئة

<Warning>
  يجب على كود الإنتاج الخاص بالامتدادات أيضًا تجنّب استيرادات
  `openclaw/plugin-sdk/<other-plugin>`.
  إذا كان أحد المساعدات مشتركًا فعلًا، فارفعه إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه حسب القدرة بدلًا من ربط مكوّنين إضافيين معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) — التغليف، والبيانات الوصفية، ومخططات التهيئة
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهجورة
- [الخصائص الداخلية لـ Plugin](/ar/plugins/architecture) — البنية العميقة ونموذج القدرات
