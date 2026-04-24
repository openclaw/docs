---
read_when:
    - تظهر لك رسالة التحذير `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - تظهر لك رسالة التحذير `OPENCLAW_EXTENSION_API_DEPRECATED`
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تدير Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: انتقل من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

انتقل OpenClaw من طبقة توافق واسعة مع الإصدارات السابقة إلى بنية Plugin حديثة تعتمد على عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفّر سطحين مفتوحين على نطاق واسع يتيحان لـ Plugins استيراد أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات الأدوات المساعدة. وقد قُدِّم للإبقاء على عمل Plugins القديمة القائمة على الخطافات أثناء بناء بنية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر يمنح Plugins وصولًا مباشرًا إلى الأدوات المساعدة على جانب المضيف مثل مشغّل Agent المضمّن.

كلا السطحين أصبح الآن **مهجورًا**. ما زالا يعملان وقت التشغيل، لكن يجب ألا تستخدمهما Plugins الجديدة، وينبغي على Plugins الحالية الترحيل قبل أن تؤدي الإزالة في الإصدار الرئيسي التالي إلى كسرها.

لا يزيل OpenClaw سلوك Plugin موثقًا أو يعيد تفسيره في التغيير نفسه الذي يقدّم بديلًا له. يجب أن تمر تغييرات العقود الكاسرة أولًا عبر مُهايئ توافق، وتشخيصات، ووثائق، ونافذة إهمال. وينطبق ذلك على عمليات استيراد SDK وحقول manifest وواجهات setup البرمجية والخطافات وسلوك التسجيل وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  Plugins التي ما تزال تستورد من هذه الأسطح ستتعطل عند حدوث ذلك.
</Warning>

## لماذا تغيّر هذا

سبّب النهج القديم مشكلات:

- **بدء تشغيل بطيء** — كان استيراد أداة مساعدة واحدة يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** — كانت إعادة التصدير الواسعة تجعل من السهل إنشاء دورات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يعالج Plugin SDK الحديث ذلك: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`) هو وحدة صغيرة مستقلة ذاتيًا لها غرض واضح وعقد موثق.

أُزيلت أيضًا واجهات الراحة القديمة الخاصة بالموفّرين للقنوات المضمّنة. كانت عمليات الاستيراد مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord` و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp` وواجهات الأدوات المساعدة ذات العلامة الخاصة بالقنوات و`openclaw/plugin-sdk/telegram-core` اختصارات خاصة بمستودع mono-repo وليست عقود Plugin مستقرة. استخدم بدلًا من ذلك مسارات فرعية عامة وضيقة في SDK. داخل مساحة عمل Plugin المضمّن، أبقِ الأدوات المساعدة المملوكة للموفّر في `api.ts` أو `runtime-api.ts` الخاص بذلك Plugin.

أمثلة الموفّرين المضمّنين الحالية:

- يحتفظ Anthropic بأدوات تدفق Claude المساعدة الخاصة به في واجهة `api.ts` / `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببنّاءات الموفّر وأدوات النموذج الافتراضي المساعدة وبنّاءات الموفّر الآنية في `api.ts` الخاص به
- يحتفظ OpenRouter ببنّاء الموفّر وأدوات الإعداد المبدئي/التهيئة المساعدة في `api.ts` الخاص به

## سياسة التوافق

بالنسبة إلى Plugins الخارجية، تتبع أعمال التوافق هذا الترتيب:

1. إضافة العقد الجديد
2. الإبقاء على السلوك القديم موصولًا عبر مُهايئ توافق
3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
4. تغطية كلا المسارين في الاختبارات
5. توثيق الإهمال ومسار الترحيل
6. الإزالة فقط بعد نافذة الترحيل المُعلنة، وعادةً في إصدار رئيسي

إذا كان ما يزال يُقبل حقل manifest، فيمكن لمؤلفي Plugins الاستمرار في استخدامه حتى تقول الوثائق والتشخيصات خلاف ذلك. ينبغي أن يفضّل الكود الجديد البديل الموثق، لكن يجب ألا تتعطل Plugins الحالية خلال الإصدارات الثانوية العادية.

## كيفية الترحيل

<Steps>
  <Step title="رحّل معالجات الموافقة الأصلية إلى حقائق الإمكانات">
    تكشف Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقة بعيدًا عن الربط القديم `plugin.auth` /
      `plugin.approvals` إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القناة العام؛ انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/تسجيل الخروج الخاصة بالقناة فقط؛ لم يعد core يقرأ خطافات مصادقة الموافقة الموجودة هناك
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل clients أو tokens أو تطبيقات Bolt عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة لـ Plugin من معالجات الموافقة الأصلية؛ إذ أصبح core يملك الآن إشعارات التوجيه إلى مكان آخر الناتجة من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر سطح `createPluginRuntime().channel` حقيقيًا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على تخطيط إمكانات الموافقة الحالي.

  </Step>

  <Step title="راجع سلوك الرجوع الاحتياطي لملف wrapper في Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`، فإن ملفات wrapper في Windows ذات الامتدادين `.cmd` و`.bat` التي يتعذر حلها ستفشل الآن بشكل مغلق ما لم تمرّر صراحةً `allowShellFallback: true`.

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

    إذا لم يكن المستدعي لديك يعتمد عمدًا على الرجوع الاحتياطي عبر shell، فلا تضبط `allowShellFallback` وتعامل بدلًا من ذلك مع الخطأ المطروح.

  </Step>

  <Step title="اعثر على عمليات الاستيراد المهجورة">
    ابحث في Plugin الخاص بك عن عمليات الاستيراد من أي من السطحين المهجورين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها بعمليات استيراد مركزة">
    تُطابق كل عملية تصدير من السطح القديم مسار استيراد حديثًا محددًا:

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

    بالنسبة إلى الأدوات المساعدة على جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد المباشر:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على أدوات الجسر القديمة الأخرى:

    | الاستيراد القديم | المكافئ الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | أدوات session store المساعدة | `api.runtime.agent.session.*` |

  </Step>

  <Step title="نفّذ البناء والاختبار">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="Common import path table">
  | مسار الاستيراد | الغرض | الصادرات الرئيسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | أداة إدخال Plugin القياسية | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بنّاءات إدخال القناة | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط التهيئة الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | أداة إدخال موفّر واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبنّاءات إدخال القناة المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | أدوات معالج الإعداد المساعدة المشتركة | مطالبات Allowlist، وبنّاءات حالة الإعداد |
  | `plugin-sdk/setup-runtime` | أدوات وقت التشغيل الخاصة بالإعداد المساعدة | مُهايئات patch الآمنة للاستيراد وقت الإعداد، وأدوات ملاحظات lookup المساعدة، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوضون |
  | `plugin-sdk/setup-adapter-runtime` | أدوات مُهايئ الإعداد المساعدة | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | أدوات الإعداد المساعدة | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | أدوات الحسابات المتعددة المساعدة | أدوات قائمة الحسابات/التهيئة/بوابة الإجراءات المساعدة |
  | `plugin-sdk/account-id` | أدوات account-id المساعدة | `DEFAULT_ACCOUNT_ID`، وتطبيع account-id |
  | `plugin-sdk/account-resolution` | أدوات lookup الحساب المساعدة | أدوات lookup الحساب + الرجوع الاحتياطي الافتراضي المساعدة |
  | `plugin-sdk/account-helpers` | أدوات الحساب الضيقة المساعدة | أدوات قائمة الحسابات/إجراءات الحساب المساعدة |
  | `plugin-sdk/channel-setup` | مُهايئات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`، و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع مُهايئ التهيئة | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بنّاءات مخطط التهيئة | أنواع مخطط تهيئة القناة |
  | `plugin-sdk/telegram-command-config` | أدوات تهيئة أوامر Telegram المساعدة | تطبيع أسماء الأوامر، وقص الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسات المجموعات/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | أدوات حالة الحساب ودورة حياة تدفق المسودة المساعدة | `createAccountStatusSink`، وأدوات إنهاء معاينة المسودة المساعدة |
  | `plugin-sdk/inbound-envelope` | أدوات inbound envelope المساعدة | أدوات route + envelope builder المشتركة |
  | `plugin-sdk/inbound-reply-dispatch` | أدوات inbound reply المساعدة | أدوات record-and-dispatch المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | أدوات تحليل/مطابقة الأهداف المساعدة |
  | `plugin-sdk/outbound-media` | أدوات الوسائط الصادرة المساعدة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-runtime` | أدوات وقت التشغيل الصادر المساعدة | أدوات هوية/تفويض الإرسال وتخطيط payload الصادر المساعدة |
  | `plugin-sdk/thread-bindings-runtime` | أدوات ربط الخيوط المساعدة | أدوات دورة حياة ربط الخيوط والمُهايئات المساعدة |
  | `plugin-sdk/agent-media-payload` | أدوات media payload القديمة المساعدة | منشئ Agent media payload لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهجورة | أدوات channel runtime القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | أدوات وقت تشغيل واسعة المساعدة | أدوات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin المساعدة |
  | `plugin-sdk/runtime-env` | أدوات بيئة وقت تشغيل ضيقة المساعدة | أدوات Logger/runtime env والمهلة الزمنية وإعادة المحاولة والتراجع التدريجي المساعدة |
  | `plugin-sdk/plugin-runtime` | أدوات وقت تشغيل Plugin المشتركة المساعدة | أدوات أوامر/خطافات/http/التفاعل الخاصة بـ Plugin المساعدة |
  | `plugin-sdk/hook-runtime` | أدوات مسار الخطافات المساعدة | أدوات مسار Webhook/الخطافات الداخلية المشتركة |
  | `plugin-sdk/lazy-runtime` | أدوات وقت التشغيل الكسول المساعدة | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | أدوات العمليات المساعدة | أدوات exec المشتركة |
  | `plugin-sdk/cli-runtime` | أدوات وقت تشغيل CLI المساعدة | تنسيق الأوامر، والانتظار، وأدوات الإصدار المساعدة |
  | `plugin-sdk/gateway-runtime` | أدوات Gateway المساعدة | أدوات عميل Gateway وpatch حالة القناة المساعدة |
  | `plugin-sdk/config-runtime` | أدوات التهيئة المساعدة | أدوات تحميل/كتابة التهيئة المساعدة |
  | `plugin-sdk/telegram-command-config` | أدوات أوامر Telegram المساعدة | أدوات التحقق من أوامر Telegram المستقرة احتياطيًا عندما يكون سطح عقد Telegram المضمّن غير متاح |
  | `plugin-sdk/approval-runtime` | أدوات مطالبة الموافقة المساعدة | أدوات payload موافقة exec/Plugin، وأدوات approval capability/profile، وأدوات توجيه/وقت تشغيل الموافقة الأصلية المساعدة |
  | `plugin-sdk/approval-auth-runtime` | أدوات مصادقة الموافقة المساعدة | حل approver، ومصادقة الإجراء داخل الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | أدوات عميل الموافقة المساعدة | أدوات profile/filter الخاصة بالموافقة الأصلية على exec المساعدة |
  | `plugin-sdk/approval-delivery-runtime` | أدوات تسليم الموافقة المساعدة | مُهايئات approval capability/delivery الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | أدوات Gateway الخاصة بالموافقة المساعدة | أداة approval gateway-resolution المشتركة |
  | `plugin-sdk/approval-handler-adapter-runtime` | أدوات مُهايئ الموافقة المساعدة | أدوات تحميل مُهايئ الموافقة الأصلية الخفيفة لنقاط إدخال القنوات السريعة |
  | `plugin-sdk/approval-handler-runtime` | أدوات معالج الموافقة المساعدة | أدوات وقت تشغيل معالج الموافقة الأوسع؛ ويُفضّل استخدام واجهات adapter/gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | أدوات هدف الموافقة المساعدة | أدوات ربط الهدف/الحساب الخاصة بالموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | أدوات رد الموافقة المساعدة | أدوات approval reply payload الخاصة بـ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | أدوات channel runtime-context المساعدة | أدوات register/get/watch العامة الخاصة بـ channel runtime-context |
  | `plugin-sdk/security-runtime` | أدوات الأمان المساعدة | أدوات الثقة، وبوابة DM، والمحتوى الخارجي، وجمع الأسرار المشتركة المساعدة |
  | `plugin-sdk/ssrf-policy` | أدوات سياسة SSRF المساعدة | أدوات allowlist للمضيف وسياسة الشبكة الخاصة المساعدة |
  | `plugin-sdk/ssrf-runtime` | أدوات وقت تشغيل SSRF المساعدة | أدوات pinned-dispatcher، وguarded fetch، وسياسة SSRF المساعدة |
  | `plugin-sdk/collection-runtime` | أدوات الذاكرة المؤقتة المحدودة المساعدة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | أدوات بوابة التشخيص المساعدة | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | أدوات تنسيق الأخطاء المساعدة | `formatUncaughtError`, `isApprovalNotFoundError`، وأدوات error graph المساعدة |
  | `plugin-sdk/fetch-runtime` | أدوات fetch/proxy المغلفة المساعدة | `resolveFetch`، وأدوات proxy المساعدة |
  | `plugin-sdk/host-runtime` | أدوات تطبيع المضيف المساعدة | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | أدوات إعادة المحاولة المساعدة | `RetryConfig`, `retryAsync`، ومشغلات السياسة |
  | `plugin-sdk/allow-from` | تنسيق Allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات Allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | بوابة الأوامر وأدوات سطح الأوامر المساعدة | `resolveControlCommandGate`، وأدوات مصادقة المرسل المساعدة، وأدوات سجل الأوامر المساعدة |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | أدوات إدخال الأسرار المساعدة |
  | `plugin-sdk/webhook-ingress` | أدوات طلب Webhook المساعدة | أدوات هدف Webhook المساعدة |
  | `plugin-sdk/webhook-request-guards` | أدوات حراسة جسم طلب Webhook المساعدة | أدوات قراءة/تقييد جسم الطلب المساعدة |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | Inbound dispatch، وHeartbeat، ومخطط الرد، والتقطيع |
  | `plugin-sdk/reply-dispatch-runtime` | أدوات reply dispatch ضيقة المساعدة | أدوات الإنهاء، وdispatch الموفّر، وتسميات المحادثة المساعدة |
  | `plugin-sdk/reply-history` | أدوات reply-history المساعدة | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | أدوات تقطيع الرد المساعدة | أدوات تقطيع النص/Markdown المساعدة |
  | `plugin-sdk/session-store-runtime` | أدوات session store المساعدة | أدوات مسار store وupdated-at المساعدة |
  | `plugin-sdk/state-paths` | أدوات مسارات الحالة المساعدة | أدوات مجلد الحالة وOAuth المساعدة |
  | `plugin-sdk/routing` | أدوات التوجيه/مفتاح الجلسة المساعدة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، وأدوات تطبيع مفتاح الجلسة المساعدة |
  | `plugin-sdk/status-helpers` | أدوات حالة القناة المساعدة | بنّاءات ملخص حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، وأدوات بيانات issue الوصفية المساعدة |
  | `plugin-sdk/target-resolver-runtime` | أدوات محلل الهدف المساعدة | أدوات محلل الهدف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | أدوات تطبيع السلاسل النصية المساعدة | أدوات تطبيع slug/السلاسل النصية المساعدة |
  | `plugin-sdk/request-url` | أدوات URL الطلب المساعدة | استخراج عناوين URL النصية من مدخلات شبيهة بالطلب |
  | `plugin-sdk/run-command` | أدوات الأوامر المؤقتة المساعدة | مشغّل أوامر مؤقت مع `stdout`/`stderr` مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات الأدوات/CLI الشائعة |
  | `plugin-sdk/tool-payload` | استخراج Tool payload | استخراج payloads مطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج tool send | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | أدوات المسارات المؤقتة المساعدة | أدوات مسار التنزيل المؤقت المشتركة |
  | `plugin-sdk/logging-core` | أدوات التسجيل المساعدة | أدوات logger الفرعي وإخفاء البيانات المساعدة |
  | `plugin-sdk/markdown-table-runtime` | أدوات Markdown-table المساعدة | أدوات أوضاع جداول Markdown المساعدة |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع reply payload |
  | `plugin-sdk/provider-setup` | أدوات إعداد الموفّر المحلي/المستضاف ذاتيًا المنسقة المساعدة | أدوات اكتشاف/تهيئة الموفّر المستضاف ذاتيًا المساعدة |
  | `plugin-sdk/self-hosted-provider-setup` | أدوات إعداد الموفّر المستضاف ذاتيًا والمتوافق مع OpenAI المركزة المساعدة | أدوات اكتشاف/تهيئة الموفّر المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | أدوات مصادقة وقت تشغيل الموفّر المساعدة | أدوات حل API-key وقت التشغيل المساعدة |
  | `plugin-sdk/provider-auth-api-key` | أدوات إعداد API-key الخاصة بالموفّر المساعدة | أدوات onboarding/profile-write الخاصة بـ API-key |
  | `plugin-sdk/provider-auth-result` | أدوات auth-result الخاصة بالموفّر المساعدة | منشئ OAuth auth-result القياسي |
  | `plugin-sdk/provider-auth-login` | أدوات تسجيل الدخول التفاعلي الخاصة بالموفّر المساعدة | أدوات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | أدوات اختيار الموفّر المساعدة | اختيار الموفّر المهيأ أو التلقائي ودمج تهيئة الموفّر الخام |
  | `plugin-sdk/provider-env-vars` | أدوات env-var الخاصة بالموفّر المساعدة | أدوات lookup الخاصة بمتغيرات بيئة مصادقة الموفّر المساعدة |
  | `plugin-sdk/provider-model-shared` | أدوات النموذج/إعادة التشغيل المشتركة الخاصة بالموفّر المساعدة | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبنّاءات سياسة إعادة التشغيل المشتركة، وأدوات endpoint الخاصة بالموفّر المساعدة، وأدوات تطبيع model-id |
  | `plugin-sdk/provider-catalog-shared` | أدوات كتالوج الموفّر المشتركة المساعدة | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات onboarding الخاصة بالموفّر | أدوات تهيئة onboarding المساعدة |
  | `plugin-sdk/provider-http` | أدوات HTTP الخاصة بالموفّر المساعدة | أدوات إمكانات HTTP/endpoint العامة الخاصة بالموفّر المساعدة، بما في ذلك أدوات multipart form المساعدة لتفريغ الصوت |
  | `plugin-sdk/provider-web-fetch` | أدوات web-fetch الخاصة بالموفّر المساعدة | أدوات تسجيل/ذاكرة مؤقتة web-fetch provider المساعدة |
  | `plugin-sdk/provider-web-search-config-contract` | أدوات تهيئة web-search الخاصة بالموفّر المساعدة | أدوات تهيئة/بيانات اعتماد web-search الضيقة للمزوّدين الذين لا يحتاجون إلى ربط تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | أدوات عقد web-search الخاصة بالموفّر المساعدة | أدوات عقد تهيئة/بيانات اعتماد web-search الضيقة مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وأدوات setters/getters المقيّدة لبيانات الاعتماد |
  | `plugin-sdk/provider-web-search` | أدوات web-search الخاصة بالموفّر المساعدة | أدوات تسجيل/ذاكرة مؤقتة/وقت تشغيل web-search provider المساعدة |
  | `plugin-sdk/provider-tools` | أدوات توافق الأداة/المخطط الخاصة بالموفّر المساعدة | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، وأدوات توافق xAI المساعدة مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | أدوات استخدام الموفّر المساعدة | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، وأدوات استخدام الموفّر الأخرى المساعدة |
  | `plugin-sdk/provider-stream` | أدوات غلاف تدفق الموفّر المساعدة | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع غلاف التدفق، وأدوات غلاف Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة المساعدة |
  | `plugin-sdk/provider-transport-runtime` | أدوات نقل الموفّر المساعدة | أدوات نقل الموفّر الأصلية المساعدة مثل guarded fetch، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار async مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | أدوات الوسائط المشتركة المساعدة | أدوات fetch/transform/store الخاصة بالوسائط المساعدة بالإضافة إلى بنّاءات media payload |
  | `plugin-sdk/media-generation-runtime` | أدوات إنشاء الوسائط المشتركة المساعدة | أدوات failover المشتركة، واختيار المرشحين، ورسائل النموذج المفقود لإنشاء الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | أدوات فهم الوسائط المساعدة | أنواع موفّر فهم الوسائط بالإضافة إلى الصادرات المساعدة الخاصة بالصور/الصوت الموجّهة إلى الموفّر |
  | `plugin-sdk/text-runtime` | أدوات النصوص المشتركة المساعدة | إزالة النص المرئي للمساعد، وأدوات render/chunking/table الخاصة بـ Markdown، وأدوات الإخفاء المساعدة، وأدوات directive-tag المساعدة، وأدوات النص الآمن، وأدوات النصوص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | أدوات تقطيع النص المساعدة | أداة تقطيع النص الصادر المساعدة |
  | `plugin-sdk/speech` | أدوات الكلام المساعدة | أنواع موفّر الكلام بالإضافة إلى الأدوات المساعدة الخاصة بالتوجيه، والسجل، والتحقق والموجّهة إلى الموفّر |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع موفّر الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | أدوات التفريغ الآني المساعدة | أنواع الموفّر، وأدوات السجل المساعدة، وأداة جلسة WebSocket المشتركة المساعدة |
  | `plugin-sdk/realtime-voice` | أدوات الصوت الآني المساعدة | أنواع الموفّر، وأدوات السجل/الحل المساعدة، وأدوات جلسة bridge المساعدة |
  | `plugin-sdk/image-generation-core` | نواة إنشاء الصور المشتركة | أنواع إنشاء الصور، وfailover، والمصادقة، وأدوات السجل المساعدة |
  | `plugin-sdk/music-generation` | أدوات إنشاء الموسيقى المساعدة | أنواع موفّر/طلب/نتيجة إنشاء الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة إنشاء الموسيقى المشتركة | أنواع إنشاء الموسيقى، وأدوات failover المساعدة، وlookup الموفّر، وتحليل model-ref |
  | `plugin-sdk/video-generation` | أدوات إنشاء الفيديو المساعدة | أنواع موفّر/طلب/نتيجة إنشاء الفيديو |
  | `plugin-sdk/video-generation-core` | نواة إنشاء الفيديو المشتركة | أنواع إنشاء الفيديو، وأدوات failover المساعدة، وlookup الموفّر، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | أدوات الرد التفاعلي المساعدة | تطبيع/اختزال interactive reply payload |
  | `plugin-sdk/channel-config-primitives` | بدائيات تهيئة القناة | بدائيات channel config-schema الضيقة |
  | `plugin-sdk/channel-config-writes` | أدوات كتابة تهيئة القناة المساعدة | أدوات تفويض كتابة تهيئة القناة المساعدة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | أدوات حالة القناة المساعدة | أدوات snapshot/summary الخاصة بحالة القناة المشتركة |
  | `plugin-sdk/allowlist-config-edit` | أدوات تهيئة Allowlist المساعدة | أدوات تحرير/قراءة تهيئة Allowlist المساعدة |
  | `plugin-sdk/group-access` | أدوات وصول المجموعة المساعدة | أدوات قرار group-access المشتركة المساعدة |
  | `plugin-sdk/direct-dm` | أدوات Direct-DM المساعدة | أدوات المصادقة/الحراسة المشتركة الخاصة بـ direct-DM المساعدة |
  | `plugin-sdk/extension-shared` | أدوات extension المشتركة المساعدة | بدائيات الأدوات المساعدة الخاصة بالقناة السلبية/الحالة وambient proxy |
  | `plugin-sdk/webhook-targets` | أدوات أهداف Webhook المساعدة | أدوات سجل هدف Webhook وتثبيت route المساعدة |
  | `plugin-sdk/webhook-path` | أدوات مسار Webhook المساعدة | أدوات تطبيع مسار Webhook المساعدة |
  | `plugin-sdk/web-media` | أدوات وسائط الويب المشتركة المساعدة | أدوات تحميل الوسائط البعيدة/المحلية المساعدة |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | أدوات memory-core المضمّنة المساعدة | سطح أدوات مدير الذاكرة/التهيئة/الملفات/CLI المساعدة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل index/search الخاصة بالذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك الأساس لمضيف الذاكرة | صادرات محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك embeddings لمضيف الذاكرة | عقود Memory embedding، والوصول إلى السجل، والموفّر المحلي، وأدوات الدُفعات/البعيد العامة المساعدة؛ أما الموفّرون البعيدون الملموسون فيوجدون في Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | صادرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | أدوات تعدد الوسائط لمضيف الذاكرة المساعدة | أدوات تعدد الوسائط لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-query` | أدوات الاستعلام لمضيف الذاكرة المساعدة | أدوات الاستعلام لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-secret` | أدوات الأسرار لمضيف الذاكرة المساعدة | أدوات الأسرار لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-events` | أدوات سجل أحداث مضيف الذاكرة المساعدة | أدوات سجل أحداث مضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-status` | أدوات حالة مضيف الذاكرة المساعدة | أدوات حالة مضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | أدوات وقت تشغيل CLI لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت التشغيل الأساسي لمضيف الذاكرة | أدوات وقت التشغيل الأساسي لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-core-host-runtime-files` | أدوات الملفات/وقت التشغيل لمضيف الذاكرة المساعدة | أدوات الملفات/وقت التشغيل لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-host-core` | اسم بديل لوقت التشغيل الأساسي لمضيف الذاكرة | اسم بديل محايد تجاه المورّد لأدوات وقت التشغيل الأساسي لمضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-host-events` | اسم بديل لسجل أحداث مضيف الذاكرة | اسم بديل محايد تجاه المورّد لأدوات سجل أحداث مضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-host-files` | اسم بديل لملفات/وقت تشغيل مضيف الذاكرة | اسم بديل محايد تجاه المورّد لأدوات ملفات/وقت تشغيل مضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-host-markdown` | أدوات Markdown المُدارة المساعدة | أدوات managed-markdown المشتركة المساعدة للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل search-manager الكسول الخاصة بـ Active Memory |
  | `plugin-sdk/memory-host-status` | اسم بديل لحالة مضيف الذاكرة | اسم بديل محايد تجاه المورّد لأدوات حالة مضيف الذاكرة المساعدة |
  | `plugin-sdk/memory-lancedb` | أدوات memory-lancedb المضمّنة المساعدة | سطح أدوات memory-lancedb المساعدة |
  | `plugin-sdk/testing` | أدوات الاختبار | أدوات الاختبار المساعدة وعمليات mock |
</Accordion>

هذا الجدول هو عمدًا المجموعة الفرعية الشائعة للترحيل، وليس سطح SDK الكامل. توجد القائمة الكاملة التي تضم أكثر من 200 نقطة دخول في
`scripts/lib/plugin-sdk-entrypoints.json`.

ما تزال تلك القائمة تتضمن بعض واجهات الأدوات المساعدة الخاصة بـ Plugins المضمّنة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. وما تزال هذه الواجهات مُصدَّرة لأغراض صيانة Plugins المضمّنة والتوافق، لكنها مُستبعدة عمدًا من جدول الترحيل الشائع وليست الهدف الموصى به لكود Plugin الجديد.

تنطبق القاعدة نفسها على عائلات الأدوات المساعدة المضمّنة الأخرى مثل:

- أدوات دعم المتصفح المساعدة: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- واجهات الأدوات المساعدة/Plugins المضمّنة مثل `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا سطح أداة token المساعدة الضيق
`DEFAULT_COPILOT_API_BASE_URL`
و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken`.

استخدم أضيق عملية استيراد تطابق المهمة. إذا لم تتمكن من العثور على عملية تصدير، فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى | ماذا يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن** | تُصدر الأسطح المهجورة تحذيرات وقت التشغيل |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهجورة؛ وستفشل Plugins التي ما تزال تستخدمها |

لقد رُحّلت جميع Plugins الأساسية بالفعل. ينبغي أن تُرحّل Plugins الخارجية قبل الإصدار الرئيسي التالي.

## إخفاء التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء عملك على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — أنشئ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — بناء Plugins الموفّرين
- [الأجزاء الداخلية لـ Plugin](/ar/plugins/architecture) — نظرة معمقة على البنية
- [Plugin Manifest](/ar/plugins/manifest) — مرجع مخطط manifest
