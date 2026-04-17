---
read_when:
    - تظهر لك رسالة التحذير `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - تظهر لك رسالة التحذير `OPENCLAW_EXTENSION_API_DEPRECATED`
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تدير Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: انتقل من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديثة
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-17T07:17:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0283f949eec358a12a0709db846cde2a1509f28e5c60db6e563cb8a540b979d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# ترحيل Plugin SDK

انتقلت OpenClaw من طبقة توافق واسعة مع الإصدارات السابقة إلى بنية Plugin حديثة
تعتمد على عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغيّر

كان نظام Plugin القديم يوفّر سطحين مفتوحين على نطاق واسع يتيحان لـ Plugins استيراد
أي شيء تحتاجه من نقطة إدخال واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. أُضيف للحفاظ على عمل Plugins الأقدم المعتمدة على hooks أثناء
  بناء بنية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر منح Plugins وصولًا مباشرًا إلى
  مساعدات جهة المضيف مثل مشغّل agent المضمّن.

كلا السطحين الآن **مهجوران**. ما زالا يعملان أثناء التشغيل، لكن يجب ألا تستخدمهما
Plugins الجديدة، ويجب على Plugins الحالية الترحيل قبل أن تؤدي الإزالة في الإصدار
الرئيسي التالي إلى توقفهما.

<Warning>
  ستُزال طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  Plugins التي لا تزال تستورد من هذه الأسطح ستتعطل عند حدوث ذلك.
</Warning>

## لماذا تغيّر هذا

تسبّب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** — كانت إعادة التصدير الواسعة تجعل إنشاء دورات استيراد أمرًا سهلًا
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي التصديرات مستقرة وأيها داخلية

تعالج Plugin SDK الحديثة هذا: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذات غرض واضح وعقد موثق.

كما أزيلت أيضًا مسارات الراحة القديمة الخاصة بالمزوّدين للقنوات المضمّنة. إن عمليات الاستيراد
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`
ومسارات المساعدات الموسومة باسم القناة و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة ضمن mono-repo،
وليست عقود Plugin مستقرة. استخدم بدلًا منها مسارات SDK عامة ضيقة. داخل
مساحة عمل Plugin المضمّنة، احتفِظ بالمساعدات المملوكة للمزوّد داخل
`api.ts` أو `runtime-api.ts` الخاصين بذلك Plugin.

أمثلة المزوّدين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude داخل المسار الخاص به
  `api.ts` / `contract-api.ts`
- يحتفظ OpenAI بمنشئات المزوّدات ومساعدات النماذج الافتراضية ومنشئات
  المزوّدات الفورية داخل `api.ts` الخاص به
- يحتفظ OpenRouter بمنشئ المزوّد ومساعدات الإعداد/التهيئة داخل
  `api.ts` الخاص به

## كيفية الترحيل

<Steps>
  <Step title="رحّل المعالجات الأصلية للموافقات إلى حقائق الإمكانات">
    تكشف الآن Plugins القنوات القادرة على الموافقة عن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقة من الربط القديم
      `plugin.auth` / `plugin.approvals` إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القناة العام؛ انقل
      حقول delivery/native/render إلى `approvalCapability`
    - يبقى `plugin.auth` مخصصًا فقط لتدفقات تسجيل الدخول/تسجيل الخروج للقناة؛
      لم تعد النواة تقرأ hooks مصادقة الموافقة هناك
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل clients أو tokens أو
      تطبيقات Bolt عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة للـ Plugin من معالجات الموافقة الأصلية؛
      فالنواة أصبحت الآن تملك إشعارات "تم التوجيه إلى مكان آخر" استنادًا إلى نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على تخطيط إمكانية الموافقة الحالي.

  </Step>

  <Step title="راجع سلوك fallback الخاص بغلاف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن أغلفة Windows من نوع `.cmd`/`.bat` غير المحلولة ستفشل الآن
    بشكل مغلق ما لم تمرّر صراحةً `allowShellFallback: true`.

    ```typescript
    // قبل
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // بعد
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // اضبط هذا فقط للجهات المتوافقة الموثوقة التي تقبل عمدًا
      // fallback عبر shell.
      allowShellFallback: true,
    });
    ```

    إذا لم يكن المستدعي لديك يعتمد عمدًا على fallback عبر shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المُلقى بدلًا من ذلك.

  </Step>

  <Step title="اعثر على عمليات الاستيراد المهجورة">
    ابحث في Plugin الخاص بك عن عمليات الاستيراد من أي من السطحين المهجورين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها بعمليات استيراد مركزة">
    كل تصدير من السطح القديم يقابله مسار استيراد حديث محدد:

    ```typescript
    // قبل (طبقة التوافق المهجورة مع الإصدارات السابقة)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // بعد (عمليات استيراد حديثة ومركزة)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى المساعدات الخاصة بجانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من
    الاستيراد المباشر:

    ```typescript
    // قبل (جسر extension-api المهجور)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // بعد (وقت تشغيل محقون)
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
    | مساعدات مخزن الجلسات | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ابنِ واختبر">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="Common import path table">
  | مسار الاستيراد | الغرض | التصديرات الأساسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | المساعد القياسي لإدخال Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/منشئات إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط التهيئة الجذري | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال مزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات ومنشئات إدخال القنوات المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مطالبات Allowlist، ومنشئات حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت التشغيل الخاصة بالإعداد | موائمات تصحيح الإعداد الآمنة للاستيراد، ومساعدات ملاحظات البحث، و`promptResolvedAllowFrom` و`splitSetupEntries` ووكلاء الإعداد المفوضون |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات موائم الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/تهيئتها/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات الحساب الضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | موائمات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | الأساسيات الأولية لربط DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | ربط بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع موائمات التهيئة | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | منشئات مخطط التهيئة | أنواع مخطط تهيئة القناة |
  | `plugin-sdk/telegram-command-config` | مساعدات تهيئة أوامر Telegram | تطبيع أسماء الأوامر، وتهذيب الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسات المجموعات/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | تتبع حالة الحساب | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | مساعدات المغلف الوارد | مساعدات المسار المشترك + منشئ المغلف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات التسجيل والإرسال المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات هوية الصادر/تفويض الإرسال |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط الخيوط | مساعدات دورة حياة ربط الخيوط والموائم |
  | `plugin-sdk/agent-media-payload` | مساعدات قديمة لحمولة الوسائط | منشئ حمولة وسائط agent لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهجورة | أدوات وقت تشغيل القناة القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتيجة الإرسال | أنواع نتيجة الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت التشغيل الضيقة | المجلّد/بيئة وقت التشغيل، ومساعدات المهلة وإعادة المحاولة والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/hooks/http/التفاعل الخاصة بـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار hook | مساعدات مسار webhook/hook الداخلي المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات التنفيذ المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات التهيئة | مساعدات تحميل/كتابة التهيئة |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات التحقق من أوامر Telegram المستقرة احتياطيًا عندما لا يكون سطح عقد Telegram المضمّن متاحًا |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة الموافقة | حمولة موافقة exec/plugin، ومساعدات إمكانية/ملف تعريف الموافقة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل الموافق، ومصادقة الإجراء داخل المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/تصفية موافقة exec الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | موائمات إمكانية/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد حل Gateway للموافقة المشتركة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات موائم الموافقة | مساعدات تحميل موائم الموافقة الأصلية خفيفة الوزن لنقاط إدخال القنوات السريعة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ فضّل مسارات الموائم/Gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة exec/plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/الحصول على/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة المشتركة، وتقييد DM، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح بالمضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | Pinned-dispatcher، وguarded fetch، ومساعدات سياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات ذاكرة التخزين المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات تقييد التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات مخطط الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy المغلفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومنفذات السياسات |
  | `plugin-sdk/allow-from` | تنسيق Allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات Allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | تقييد الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المرسل، ومساعدات سجل الأوامر |
  | `plugin-sdk/command-status` | مصيّرات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلب Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة جسم طلب Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال الرد الضيقة | مساعدات الإنهاء + إرسال المزوّد |
  | `plugin-sdk/reply-history` | مساعدات سجل الرد | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقسيم الرد | مساعدات تقسيم النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات | مساعدات مسار المخزن + وقت التحديث |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات مجلد الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | منشئات ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات محلل الهدف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/السلاسل |
  | `plugin-sdk/request-url` | مساعدات URL الطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلب |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقّتة | منفذ أوامر موقّت مع `stdout`/`stderr` مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات معلمات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسارات المؤقتة | مساعدات مسارات التنزيل المؤقتة المشتركة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجل النظام الفرعي وإخفاء البيانات الحساسة |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات أوضاع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد مزوّدات محلية/مستضافة ذاتيًا منسقة | مساعدات اكتشاف/تهيئة المزوّدات المستضافة ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد المزوّدات المستضافة ذاتيًا المتوافقة مع OpenAI | مساعدات اكتشاف/تهيئة المزوّدات المستضافة ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة وقت تشغيل المزوّد | مساعدات حل مفتاح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للمزوّد | مساعدات إعداد مفتاح API/كتابة الملف الشخصي |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | منشئ قياسي لنتيجة مصادقة OAuth |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للمزوّد | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات البيئة للمزوّد | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات نموذج/إعادة تشغيل المزوّد المشتركة | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، ومنشئات سياسات إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات كتالوج المزوّد المشتركة | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات إعداد المزوّد | مساعدات تهيئة الإعداد |
  | `plugin-sdk/provider-http` | مساعدات HTTP للمزوّد | مساعدات HTTP/إمكانيات نقطة النهاية العامة للمزوّد |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch للمزوّد | مساعدات تسجيل/ذاكرة التخزين المؤقت لمزوّد web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تهيئة web-search للمزوّد | مساعدات ضيقة لتهيئة/بيانات اعتماد web-search للمزوّدات التي لا تحتاج إلى ربط تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد web-search للمزوّد | مساعدات ضيقة لعقد تهيئة/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` ووظائف الضبط/الجلب المقيّدة لبيانات الاعتماد |
  | `plugin-sdk/provider-web-search` | مساعدات web-search للمزوّد | مساعدات تسجيل/ذاكرة التخزين المؤقت/وقت التشغيل لمزوّد web-search |
  | `plugin-sdk/provider-tools` | مساعدات توافق أداة/مخطط المزوّد | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام المزوّد الأخرى |
  | `plugin-sdk/provider-stream` | مساعدات غلاف تدفق المزوّد | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع أغلفة التدفق، ومساعدات الأغلفة المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار async مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى منشئات حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات إنشاء الوسائط المشتركة | مساعدات failover المشتركة، واختيار المرشح، ورسائل النموذج المفقود لإنشاء الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزوّد فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت الموجهة للمزوّد |
  | `plugin-sdk/text-runtime` | مساعدات النص المشتركة | إزالة النص المرئي للمساعد، ومساعدات العرض/التقسيم/الجداول لـ Markdown، ومساعدات الإخفاء، ومساعدات علامات التوجيه، وأدوات النص الآمنة، ومساعدات النص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص | مساعد تقسيم النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزوّد الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق الموجهة للمزوّد |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزوّد الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع المزوّد ومساعدات السجل |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع المزوّد ومساعدات السجل |
  | `plugin-sdk/image-generation-core` | نواة إنشاء الصور المشتركة | مساعدات أنواع إنشاء الصور، وfailover، والمصادقة، والسجل |
  | `plugin-sdk/music-generation` | مساعدات إنشاء الموسيقى | أنواع مزوّد/طلب/نتيجة إنشاء الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة إنشاء الموسيقى المشتركة | أنواع إنشاء الموسيقى، ومساعدات failover، والبحث عن المزوّد، وتحليل model-ref |
  | `plugin-sdk/video-generation` | مساعدات إنشاء الفيديو | أنواع مزوّد/طلب/نتيجة إنشاء الفيديو |
  | `plugin-sdk/video-generation-core` | نواة إنشاء الفيديو المشتركة | أنواع إنشاء الفيديو، ومساعدات failover، والبحث عن المزوّد، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | أساسيات تهيئة القناة | أساسيات ضيقة لمخطط تهيئة القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تهيئة القناة | مساعدات تفويض كتابة تهيئة القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | تصديرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات اللقطة/الملخص المشتركة لحالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تهيئة Allowlist | مساعدات تعديل/قراءة تهيئة Allowlist |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات قرارات وصول المجموعة المشتركة |
  | `plugin-sdk/direct-dm` | مساعدات Direct-DM | مساعدات المصادقة/الحراسة المشتركة لـ Direct-DM |
  | `plugin-sdk/extension-shared` | مساعدات extension المشتركة | أساسيات مساعدات القناة/الحالة السلبية والـ proxy المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | مساعدات سجل هدف Webhook وتثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المضمّنة | سطح مساعدات مدير الذاكرة/التهيئة/الملفات/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | تصديرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك التضمينات لمضيف الذاكرة | عقود تضمينات الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدُفعات/البعيد العامة؛ أما المزوّدات البعيدة الملموسة فتوجد في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | تصديرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | تصديرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعدد الوسائط لمضيف الذاكرة | مساعدات متعدد الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة | مساعدات الاستعلام لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة | مساعدات الأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة | مساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل النواة لمضيف الذاكرة | مساعدات وقت تشغيل النواة لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار لملفات/وقت تشغيل مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات Markdown المُدارة المشتركة لـ Plugins القريبة من الذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار لحالة مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المضمّنة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات الاختبار وعمليات المحاكاة |
</Accordion>

هذا الجدول هو عمدًا مجموعة الترحيل الشائعة، وليس سطح SDK الكامل.
توجد القائمة الكاملة التي تضم أكثر من 200 نقطة دخول في
`scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال تلك القائمة تتضمن بعض مسارات مساعدات Plugins المضمّنة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. تظل هذه المسارات مُصدّرة من أجل
صيانة Plugins المضمّنة والتوافق، لكنها حُذفت عمدًا من جدول الترحيل الشائع
وليست الهدف الموصى به لرمز Plugin الجديد.

تنطبق القاعدة نفسها على عائلات المساعدات المضمّنة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp` و`plugin-sdk/browser-config-runtime` و`plugin-sdk/browser-config-support` و`plugin-sdk/browser-control-auth` و`plugin-sdk/browser-node-runtime` و`plugin-sdk/browser-profiles` و`plugin-sdk/browser-security-runtime` و`plugin-sdk/browser-setup-tools` و`plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- أسطح المساعدات/Plugins المضمّنة مثل `plugin-sdk/googlechat`
  و`plugin-sdk/zalouser` و`plugin-sdk/bluebubbles*`
  و`plugin-sdk/mattermost*` و`plugin-sdk/msteams`
  و`plugin-sdk/nextcloud-talk` و`plugin-sdk/nostr` و`plugin-sdk/tlon`
  و`plugin-sdk/twitch`
  و`plugin-sdk/github-copilot-login` و`plugin-sdk/github-copilot-token`
  و`plugin-sdk/diagnostics-otel` و`plugin-sdk/diffs` و`plugin-sdk/llm-task`
  و`plugin-sdk/thread-ownership` و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا عن
سطح مساعد الرمز الضيق `DEFAULT_COPILOT_API_BASE_URL`
و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken`.

استخدم أضيق عملية استيراد تطابق المهمة. إذا لم تتمكن من العثور على تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى | ماذا يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن** | تُصدر الأسطح المهجورة تحذيرات وقت التشغيل |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهجورة؛ وستفشل Plugins التي لا تزال تستخدمها |

لقد تم بالفعل ترحيل جميع Plugins الأساسية. يجب على Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## إخفاء التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لعمليات الاستيراد عبر المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدات](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدات
- [الأجزاء الداخلية للـ Plugin](/ar/plugins/architecture) — نظرة معمقة على البنية
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
