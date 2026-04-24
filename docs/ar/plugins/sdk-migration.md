---
read_when:
    - أنت ترى التحذير `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - أنت ترى التحذير `OPENCLAW_EXTENSION_API_DEPRECATED`
    - أنت تحدّث Plugin إلى معمارية Plugin الحديثة
    - أنت تصون Plugin خارجية لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى Plugin SDK الحديثة
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-24T07:55:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى معمارية Plugin
حديثة مع عمليات استيراد مركزة وموثقة. إذا كانت Plugin الخاصة بك مبنية قبل
المعمارية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

قدّم نظام Plugin القديم سطحين مفتوحين على مصراعيهما يتيحان للإضافات استيراد
أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. وقد تم تقديمه لإبقاء الإضافات الأقدم المعتمدة على hooks تعمل أثناء بناء
  معمارية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر يمنح الإضافات وصولًا مباشرًا إلى
  مساعدات جهة المضيف مثل مشغّل الوكيل المضمّن.

كلا السطحين الآن **مهملان**. وما زالا يعملان أثناء التشغيل، لكن يجب ألا تستخدمهما
الإضافات الجديدة، وينبغي أن تهاجر الإضافات الحالية قبل أن تزيلهما الإصدارة الرئيسية
التالية.

لا يزيل OpenClaw أو يعيد تفسير سلوك Plugin موثق في التغيير نفسه الذي
يقدّم فيه بديلًا. ويجب أن تمر تغييرات العقود الكاسرة أولًا عبر
مكيّف توافق، وتشخيصات، ووثائق، ونافذة إهمال.
وينطبق ذلك على استيرادات SDK، وحقول manifest، وواجهات setup API، وhooks، وسلوك
التسجيل أثناء التشغيل.

<Warning>
  ستتم إزالة طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  وستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عند حدوث ذلك.
</Warning>

## لماذا تغيّر هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **تبعيّات دائرية** — جعلت عمليات إعادة التصدير الواسعة من السهل إنشاء دورات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

تُصلح Plugin SDK الحديثة هذا: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذات غرض واضح وعقد موثق.

كما أزيلت أيضًا فواصل الراحة القديمة الخاصة بالمزوّد لقنوات الحزم المجمعة. فعمليات الاستيراد
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`،
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
وفواصل المساعدات ذات العلامة التجارية للقناة، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة بمستودع mono-repo، وليست
عقود Plugin مستقرة. استخدم مسارات SDK عامة وضيقة بدلًا من ذلك. وداخل
مساحة عمل Plugin المجمعة، أبقِ المساعدات المملوكة للمزوّد في
`api.ts` أو `runtime-api.ts` الخاصة بتلك Plugin.

أمثلة حالية للمزوّدين المجمّعين:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في الفاصل الخاص به
  `api.ts` / `contract-api.ts`
- يحتفظ OpenAI ببُناة المزوّد، ومساعدات النموذج الافتراضي، وبُناة مزوّد
  realtime في `api.ts` الخاصة به
- يحتفظ OpenRouter بباني المزوّد ومساعدات onboarding/config في
  `api.ts` الخاصة به

## سياسة التوافق

بالنسبة إلى الإضافات الخارجية، يتبع عمل التوافق هذا الترتيب:

1. إضافة العقد الجديد
2. إبقاء السلوك القديم موصولًا عبر مكيّف توافق
3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
4. تغطية كلا المسارين في الاختبارات
5. توثيق الإهمال ومسار الترحيل
6. الإزالة فقط بعد نافذة الترحيل المعلنة، وعادةً في إصدار رئيسي

إذا كان لا يزال يتم قبول حقل manifest، فيمكن لمطوري Plugin الاستمرار في استخدامه حتى
تقول الوثائق والتشخيصات خلاف ذلك. وينبغي أن تفضّل الشيفرة الجديدة البديل
الموثق، لكن يجب ألا تتعطل الإضافات الحالية خلال الإصدارات الثانوية
العادية.

## كيفية الترحيل

<Steps>
  <Step title="رحّل معالجات approval الأصلية إلى حقائق capabilities">
    تكشف Plugins القنوات القادرة على approval الآن السلوك الأصلي للموافقة عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل auth/delivery الخاصَّين بالموافقة من التوصيلات القديمة `plugin.auth` /
      `plugin.approvals` إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القناة العامة؛ انقل
      حقول delivery/native/render إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات login/logout الخاصة بالقنوات فقط؛ أما hooks الخاصة بمصادقة الموافقة
      هناك فلم يعد core يقرأها
    - سجّل كائنات التشغيل المملوكة للقناة مثل clients أو tokens أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة لـ Plugin من معالجات approval الأصلية؛
      يملك core الآن إشعارات "تم التوجيه في مكان آخر" المستندة إلى نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر
      سطح `createPluginRuntime().channel` حقيقيًا. يتم رفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على التخطيط الحالي لـ
    approval capability.

  </Step>

  <Step title="دقّق سلوك الرجوع الاحتياطي لغلاف Windows">
    إذا كانت Plugin الخاصة بك تستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن أغلفة Windows غير المحلولة من نوع `.cmd`/`.bat` تفشل الآن بشكل مغلق ما لم تمرر
    `allowShellFallback: true` صراحةً.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    إذا لم يكن المستدعي يعتمد عمدًا على الرجوع الاحتياطي لـ shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المرمى بدلًا من ذلك.

  </Step>

  <Step title="اعثر على عمليات الاستيراد المهملة">
    ابحث في Plugin الخاصة بك عن عمليات الاستيراد من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها بعمليات استيراد مركزة">
    يطابق كل تصدير من السطح القديم مسار استيراد حديثًا محددًا:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى مساعدات جهة المضيف، استخدم Plugin runtime المحقون بدلًا من الاستيراد
    المباشر:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على مساعدات الجسر القديمة الأخرى:

    | الاستيراد القديم | المكافئ الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | مساعدات مخزن الجلسة | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ابنِ واختبر">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسار الاستيراد

  <Accordion title="جدول شائع لمسارات الاستيراد">
  | مسار الاستيراد | الغرض | الصادرات الأساسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | المساعد القياسي لإدخال Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير جامعة قديمة لتعريفات/بُناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط الإعداد الجذري | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبُناة إدخال القنوات المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج setup المشتركة | مطالبات قائمة السماح، وبُناة حالة setup |
  | `plugin-sdk/setup-runtime` | مساعدات وقت تشغيل setup | محوّلات ترقيع setup الآمنة للاستيراد، ومساعدات ملاحظات lookup، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء setup المفوضة |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات محوّل setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحساب/الإعداد/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتوحيد معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات lookup الخاصة بالحساب | مساعدات lookup للحساب + الرجوع الاحتياطي الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حساب ضيقة | مساعدات قائمة الحساب/إجراء الحساب |
  | `plugin-sdk/channel-setup` | محوّلات معالج setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع محوّلات الإعداد | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بُناة مخطط الإعداد | أنواع مخطط إعداد القناة |
  | `plugin-sdk/telegram-command-config` | مساعدات إعداد أوامر Telegram | توحيد اسم الأمر، واقتطاع الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات حالة الحساب ودورة حياة تدفق المسودة | `createAccountStatusSink`، ومساعدات إنهاء معاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدات الغلاف الوارد | مساعدات المسار المشترك + بناء الغلاف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات التسجيل والإرسال المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الهدف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات هوية الإرسال/المفوَّض وتخطيط الحمولة الصادرة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط سلاسل الرسائل | مساعدات دورة الحياة والمواءمة الخاصة بربط سلاسل الرسائل |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولة الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات وقت تشغيل القناة القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل | logger/env وقت التشغيل، ومساعدات timeout وretry وbackoff |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/hooks/http/التفاعلات الخاصة بـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات خط أنابيب Hook | مساعدات خط أنابيب webhook/internal hook المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | مساعدات عميل Gateway وترقيع حالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات الإعداد | مساعدات تحميل/كتابة الإعداد |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات التحقق من أوامر Telegram المستقرة احتياطيًا عندما لا يكون سطح عقد Telegram المجمّع متاحًا |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة approval | حمولة موافقة exec/plugin، ومساعدات profile/capability للموافقة، ومساعدات التوجيه/وقت التشغيل الخاصة بالموافقة الأصلية |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة approval | حل الموافقين، ومصادقة الإجراء داخل الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل approval | مساعدات profile/filter الخاصة بموافقة exec الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم approval | محوّلات القدرة/التسليم الخاصة بالموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway الخاصة بالموافقة | مساعد حل Gateway للموافقة المشتركة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محوّل approval | مساعدات تحميل خفيفة لمحوّل الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج approval | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ فضّل الفواصل الأضيق الخاصة بالمحوّل/Gateway عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف approval | مساعدات الربط بالحساب/الهدف الخاصة بالموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد approval | مساعدات حمولة الرد الخاصة بموافقة exec/plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات تسجيل/الحصول/المراقبة العامة لسياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة المشتركة، وبوابة DM، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح للمضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | مساعدات pinned-dispatcher، وguarded fetch، وسياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات الذاكرة المؤقتة المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات رسم الأخطاء البياني |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy المغلفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات توحيد المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات retry | `RetryConfig`, `retryAsync`، ومشغلات السياسة |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | بوابة الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المرسل، ومساعدات سجل الأوامر |
  | `plugin-sdk/command-status` | مُصيّرات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل مدخلات السر | مساعدات إدخال السر |
  | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراس جسم Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، وتقسيم الأجزاء |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال الرد | مساعدات finalize + إرسال المزوّد |
  | `plugin-sdk/reply-history` | مساعدات سجل الرد | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقطيع الرد | مساعدات تقطيع النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة | مساعدات مسار المخزن + updated-at |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات دليل الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات توحيد مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بُناة ملخص حالة القناة/الحساب، والافتراضيات الخاصة بحالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الأهداف | مساعدات محلل الأهداف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات توحيد السلاسل | مساعدات توحيد slug/السلاسل |
  | `plugin-sdk/request-url` | مساعدات عنوان URL الخاص بالطلب | استخراج سلاسل URL من مدخلات شبيهة بالطلب |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقّتة | مشغل أوامر موقّت مع stdout/stderr موحّدين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات معلمات مشتركة للأداة/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات الموحدة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج الإرسال من الأداة | استخراج حقول الهدف القياسية للإرسال من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مسار التنزيل المؤقت المشتركة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | logger النظام الفرعي ومساعدات التنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جدول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات setup منتقاة لمزوّدين محليين/مستضافين ذاتيًا | مساعدات اكتشاف/إعداد مزوّدين مستضافين ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزوّدات self-hosted المتوافقة مع OpenAI | مساعدات اكتشاف/إعداد المزوّدات المستضافة ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة المزوّد أثناء التشغيل | مساعدات حل API key أثناء التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات setup لمفاتيح API الخاصة بالمزوّد | مساعدات onboarding/كتابة profile الخاصة بـ API key |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني auth-result قياسي لـ OAuth |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للمزوّد | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزوّد | اختيار المزوّد المهيأ أو التلقائي ودمج إعدادات المزوّد الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات env الخاصة بالمزوّد | مساعدات lookup لمتغيرات env الخاصة بمصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل المزوّد | `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks`، و`normalizeModelCompat`، وبُناة سياسة replay المشتركة، ومساعدات نقاط نهاية المزوّد، ومساعدات توحيد معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لفهرس المزوّد | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | ترقيعات onboarding الخاصة بالمزوّد | مساعدات إعداد onboarding |
  | `plugin-sdk/provider-http` | مساعدات HTTP الخاصة بالمزوّد | مساعدات HTTP/إمكانات نقاط النهاية العامة للمزوّد، بما في ذلك مساعدات نموذج multipart الخاصة بتفريغ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch الخاصة بالمزوّد | مساعدات تسجيل/ذاكرة مؤقتة لمزوّد web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعداد web-search الخاصة بالمزوّد | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للمزوّدين الذين لا يحتاجون إلى wiring لتفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد web-search الخاصة بالمزوّد | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحددات getters/setters الخاصة ببيانات الاعتماد |
  | `plugin-sdk/provider-web-search` | مساعدات web-search الخاصة بالمزوّد | مساعدات تسجيل/ذاكرة مؤقتة/وقت تشغيل لمزوّد web-search |
  | `plugin-sdk/provider-tools` | مساعدات توافق الأدوات/المخططات الخاصة بالمزوّد | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام أخرى للمزوّد |
  | `plugin-sdk/provider-stream` | مساعدات أغلفة تدفق المزوّد | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع أغلفة التدفق، ومساعدات الأغلفة المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات النقل الأصلية للمزوّد مثل guarded fetch، وتحويلات رسائل النقل، وتيارات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتّب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات الرجوع الاحتياطي المشتركة، واختيار المرشحين، ورسائل غياب النموذج لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزود فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجهة للمزوّد |
  | `plugin-sdk/text-runtime` | مساعدات النص المشتركة | إزالة النص المرئي للمساعد، ومساعدات تصيير/تقطيع/جداول markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن، ومساعدات النص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تقطيع النص | مساعد تقطيع النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزود الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق الموجهة للمزوّد |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزود الكلام، والسجل، والتوجيهات، والتوحيد |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع المزوّد، ومساعدات السجل، ومساعد WebSocket session المشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع المزوّد، ومساعدات السجل/الحل، ومساعدات جلسة الجسر |
  | `plugin-sdk/image-generation-core` | نواة مشتركة لتوليد الصور | أنواع توليد الصور، والرجوع الاحتياطي، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة مشتركة لتوليد الموسيقى | أنواع توليد الموسيقى، ومساعدات الرجوع الاحتياطي، وlookup للمزوّد، وتحليل model-ref |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة مشتركة لتوليد الفيديو | أنواع توليد الفيديو، ومساعدات الرجوع الاحتياطي، وlookup للمزوّد، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | توحيد/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات إعداد القناة | بدائيات ضيقة لمخطط إعداد القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة إعداد القناة | مساعدات تفويض كتابة إعداد القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات لقطة/ملخص حالة القناة المشتركة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات إعداد قائمة السماح | مساعدات تعديل/قراءة إعداد قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات قرار وصول المجموعة المشتركة |
  | `plugin-sdk/direct-dm` | مساعدات DM المباشرة | مساعدات auth/guard المشتركة لـ DM المباشرة |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات مساعدة للقناة/الحالة السلبية وambient proxy |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | مساعدات سجل هدف Webhook وتثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات توحيد مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المجمّعة | سطح مساعدات مدير/إعداد/ملف/CLI للذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت التشغيل الخاصة بالفهرسة/البحث في الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك الأساس لمضيف الذاكرة | صادرات محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك التضمينات لمضيف الذاكرة | عقود تضمين الذاكرة، ووصول السجل، والمزوّد المحلي، والمساعدات العامة للدُفعات/البعيد؛ أما المزوّدات البعيدة الملموسة فتوجد في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | صادرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة | مساعدات الاستعلام لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة | مساعدات الأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات دفتر أحداث مضيف الذاكرة | مساعدات دفتر أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل النواة لمضيف الذاكرة | مساعدات وقت تشغيل النواة لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل لمضيف الذاكرة | مساعدات ملفات/وقت تشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم بديل لوقت تشغيل نواة مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم بديل لدفتر أحداث مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات دفتر أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم بديل لملفات/وقت تشغيل مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات markdown المُدارة | مساعدات managed-markdown المشتركة للإضافات القريبة من الذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل search-manager الكسولة لـ Active Memory |
  | `plugin-sdk/memory-host-status` | اسم بديل لحالة مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المجمّعة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات ومحاكيات الاختبار |
</Accordion>

هذا الجدول هو عمدًا المجموعة الشائعة للترحيل، وليس سطح SDK الكامل.
توجد القائمة الكاملة التي تضم أكثر من 200 نقطة دخول في
`scripts/lib/plugin-sdk-entrypoints.json`.

ولا تزال تلك القائمة تتضمن بعض فواصل المساعدات الخاصة بالإضافات المجمعة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`،
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. ولا تزال هذه الفواصل مُصدَّرة من أجل
صيانة الإضافات المجمعة والتوافق، لكنها حُذفت عمدًا من الجدول الشائع للترحيل
وليست الهدف الموصى به لشيفرة Plugin الجديدة.

تنطبق القاعدة نفسها على عائلات المساعدات المجمعة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp`، و`plugin-sdk/browser-config-runtime`، و`plugin-sdk/browser-config-support`، و`plugin-sdk/browser-control-auth`، و`plugin-sdk/browser-node-runtime`، و`plugin-sdk/browser-profiles`، و`plugin-sdk/browser-security-runtime`، و`plugin-sdk/browser-setup-tools`، و`plugin-sdk/browser-support`
- Matrix: ‏`plugin-sdk/matrix*`
- LINE: ‏`plugin-sdk/line*`
- IRC: ‏`plugin-sdk/irc*`
- أسطح المساعدات/الإضافات المجمعة مثل `plugin-sdk/googlechat`،
  و`plugin-sdk/zalouser`، و`plugin-sdk/bluebubbles*`،
  و`plugin-sdk/mattermost*`، و`plugin-sdk/msteams`،
  و`plugin-sdk/nextcloud-talk`، و`plugin-sdk/nostr`، و`plugin-sdk/tlon`،
  و`plugin-sdk/twitch`،
  و`plugin-sdk/github-copilot-login`، و`plugin-sdk/github-copilot-token`،
  و`plugin-sdk/diagnostics-otel`، و`plugin-sdk/diffs`، و`plugin-sdk/llm-task`،
  و`plugin-sdk/thread-ownership`، و`plugin-sdk/voice-call`

يعرض `plugin-sdk/github-copilot-token` حاليًا سطح المساعدات الضيق الخاص بالرموز:
`DEFAULT_COPILOT_API_BASE_URL`،
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. وإذا لم تتمكن من العثور على تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى | ماذا يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن** | تصدر الأسطح المهملة تحذيرات أثناء التشغيل |
| **الإصدار الرئيسي التالي** | ستتم إزالة الأسطح المهملة؛ وستفشل الإضافات التي لا تزال تستخدمها |

لقد تم بالفعل ترحيل جميع الإضافات الأساسية. وينبغي أن تهاجر الإضافات الخارجية
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء عملك على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ Plugin الأولى الخاصة بك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لعمليات الاستيراد الفرعية
- [إضافات القنوات](/ar/plugins/sdk-channel-plugins) — بناء إضافات القنوات
- [إضافات المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء إضافات المزوّدين
- [الأجزاء الداخلية لـ Plugin](/ar/plugins/architecture) — تعمق في المعمارية
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
