---
read_when:
    - أنت ترى التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - أنت ترى التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - لقد استخدمت `api.registerEmbeddedExtensionFactory` قبل OpenClaw 2026.4.25
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تُدير Plugin خارجية لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى Plugin SDK الحديثة
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى بنية Plugin حديثة
ذات عمليات استيراد مركزة وموثقة. وإذا كانت Plugin الخاصة بك قد بُنيت قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

وفّر نظام Plugins القديم سطحين مفتوحين على مصراعيهما سمحا للـ Plugins باستيراد
أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. وقد قُدم للحفاظ على عمل Plugins الأقدم المعتمدة على hooks أثناء بناء
  بنية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر منح الـ Plugins وصولًا مباشرًا إلى
  مساعدات من جهة المضيف مثل embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook مضمّنة محذوفة
  خاصة بـ Pi فقط، كانت تستطيع ملاحظة أحداث embedded-runner مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. وما تزال تعمل وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، ويجب على Plugins الحالية الترحيل قبل أن تزيلها
الإصدار الرئيسي التالي. وقد أزيلت واجهة API الخاصة بتسجيل embedded extension factory والمقتصرة على Pi؛ استخدم middleware الخاصة بنتائج الأدوات بدلًا من ذلك.

لا يزيل OpenClaw سلوك Plugin موثقًا ولا يعيد تفسيره في التغيير نفسه
الذي يقدّم بديلًا. ويجب أن تمر تغييرات العقود الكاسرة أولًا عبر
مهايئ توافق، وتشخيصات، ووثائق، ونافذة إهمال.
وينطبق ذلك على استيرادات SDK، وحقول manifest، وواجهات إعداد API، وhooks، وسلوك تسجيل وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  وستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عند حدوث ذلك.
  أما تسجيلات embedded extension factory الخاصة بـ Pi فقط فلم تعد تُحمَّل بالفعل.
</Warning>

## لماذا تغيّر هذا

سبّب النهج القديم مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير ذات الصلة
- **اعتماديات دائرية** — جعلت عمليات إعادة التصدير الواسعة من السهل إنشاء حلقات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي عمليات تصدير مستقرة وأيها داخلية

تصلح Plugin SDK الحديثة هذا: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة ومكتفية ذاتيًا ذات غرض واضح وعقد موثق.

كما زالت أيضًا واجهات الملاءمة القديمة الخاصة بالمزوّدين للقنوات المضمّنة. فالاستيرادات
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`،
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
وواجهات المساعدة ذات العلامات الخاصة بالقنوات، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة بالمستودع الأحادي، وليست
عقود Plugins مستقرة. استخدم بدلًا من ذلك المسارات الفرعية العامة الضيقة لـ SDK. وداخل
مساحة عمل Plugin المضمّنة، أبقِ المساعدات المملوكة للمزوّد في
`api.ts` أو `runtime-api.ts` الخاصة بتلك Plugin.

أمثلة حالية على المزوّدين المضمّنين:

- يحتفظ Anthropic بمساعدات التدفق الخاصة بـ Claude في واجهته الخاصة `api.ts` /
  `contract-api.ts`
- يحتفظ OpenAI ببناة المزوّد، ومساعدات النموذج الافتراضي، وبناة
  المزوّد الفوري في `api.ts` الخاصة به
- يحتفظ OpenRouter بباني المزوّد ومساعدات الإعداد الأولي/الإعدادات في
  `api.ts` الخاصة به

## سياسة التوافق

بالنسبة إلى Plugins الخارجية، تتبع أعمال التوافق هذا الترتيب:

1. إضافة العقد الجديد
2. إبقاء السلوك القديم موصولًا عبر مهايئ توافق
3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
4. تغطية كلا المسارين في الاختبارات
5. توثيق الإهمال ومسار الترحيل
6. الإزالة فقط بعد نافذة الترحيل المعلنة، وعادةً في إصدار رئيسي

إذا كان حقل manifest لا يزال مقبولًا، فيمكن لمؤلفي Plugins الاستمرار في استخدامه حتى
تقول الوثائق والتشخيصات خلاف ذلك. ويجب أن تفضّل الشيفرة الجديدة البديل
الموثق، لكن يجب ألا تتعطل Plugins الحالية أثناء الإصدارات الثانوية العادية.

## كيفية الترحيل

<Steps>
  <Step title="رحّل إضافات Pi الخاصة بنتائج الأدوات إلى middleware">
    يجب أن تستبدل Plugins المضمّنة معالجات
    `api.registerEmbeddedExtensionFactory(...)` الخاصة بنتائج الأدوات والمقتصرة على Pi بـ
    middleware محايدة بالنسبة إلى وقت التشغيل.

    ```typescript
    // أدوات Pi وCodex الديناميكية في وقت التشغيل
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    حدّث manifest الخاصة بالـ Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    لا يمكن للـ Plugins الخارجية تسجيل middleware الخاصة بنتائج الأدوات لأنها قد
    تعيد كتابة مخرجات الأدوات عالية الثقة قبل أن يراها النموذج.

  </Step>

  <Step title="رحّل المعالجات الأصلية للموافقات إلى حقائق capability">
    تكشف Plugins القنوات القادرة على الموافقة الآن عن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل runtime-context المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقة من أسلاك
      `plugin.auth` / `plugin.approvals` القديمة إلى `approvalCapability`
    - أزيل `ChannelPlugin.approvals` من عقد Plugin القناة العام؛ انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يظل `plugin.auth` لتدفقات تسجيل الدخول/الخروج الخاصة بالقناة فقط؛ ولم تعد
      hooks مصادقة الموافقة هناك مقروءة من النواة
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء والرموز أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة للـ Plugin من معالجات الموافقة الأصلية؛
      فالنواة أصبحت الآن تملك إشعارات التوجيه إلى مكان آخر الناتجة عن نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. وتُرفض الوحدات الجزئية الوهمية.

    راجع `/plugins/sdk-channel-plugins` من أجل
    التخطيط الحالي لـ approval capability.

  </Step>

  <Step title="دقّق سلوك الرجوع الاحتياطي لوحدة Windows wrapper">
    إذا كانت Plugin الخاصة بك تستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن وحدات Windows `.cmd`/`.bat` غير المحلولة تفشل الآن بشكل مغلق ما لم تمرر صراحةً
    `allowShellFallback: true`.

    ```typescript
    // قبل
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // بعد
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // اضبط هذا فقط للمستدعين الموثوقين لأغراض التوافق الذين
      // يقبلون عمدًا الرجوع الاحتياطي عبر shell.
      allowShellFallback: true,
    });
    ```

    وإذا لم يكن المستدعي لديك يعتمد عمدًا على هذا الرجوع الاحتياطي عبر shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المطروح بدلًا من ذلك.

  </Step>

  <Step title="اعثر على الاستيرادات المهملة">
    ابحث في Plugin الخاصة بك عن الاستيرادات من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها باستيرادات مركزة">
    تُطابق كل عملية تصدير من السطح القديم مسار استيراد حديثًا محددًا:

    ```typescript
    // قبل (طبقة التوافق العكسي المهملة)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // بعد (استيرادات حديثة ومركزة)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى مساعدات جهة المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد
    المباشر:

    ```typescript
    // قبل (جسر extension-api المهمل)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // بعد (وقت تشغيل محقون)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    وينطبق النمط نفسه على مساعدات الجسر القديمة الأخرى:

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

## مرجع مسارات الاستيراد

  <Accordion title="جدول مسارات الاستيراد الشائعة">
  | مسار الاستيراد | الغرض | أهم عمليات التصدير |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | المساعد القياسي لإدخال Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط إعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | المساعد الخاص بإدخال مزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال قنوات مركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات مشتركة لمعالج الإعداد | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت تشغيل خاصة بالإعداد | مهايئات patch آمنة للاستيراد في الإعداد، ومساعدات ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوضون |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات مهايئ الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حسابات ضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | مهايئات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع مهايئات الإعدادات | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بُناة مخطط الإعدادات | بدائيات مخطط إعدادات القنوات المشتركة؛ وتظل عمليات تصدير المخطط المسماة للقنوات المضمّنة خاصة بالتوافق القديم فقط |
  | `plugin-sdk/telegram-command-config` | مساعدات إعداد أوامر Telegram | تطبيع أسماء الأوامر، وتقليم الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات حالة الحساب ودورة حياة تدفق المسودات | `createAccountStatusSink`، ومساعدات الإنهاء النهائي لمعاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدات المغلف الوارد | مساعدات بناء المسار + المغلف المشتركة |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات التسجيل والإرسال المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-send-deps` | مساعدات تبعيات الإرسال الصادر | بحث خفيف لـ `resolveOutboundSendDep` دون استيراد وقت تشغيل الإرسال الصادر الكامل |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات التسليم الصادر، ومفوّض الهوية/الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط الخيوط | مساعدات دورة حياة ربط الخيوط والمهايئات |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولة الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | رقاقة توافق مهملة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugins |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت تشغيل ضيقة | مساعدات logger/بيئة وقت التشغيل، والمهلات، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/‏hooks/‏http/‏التفاعل الخاصة بالـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار hooks | مساعدات مسار webhook/internal hook المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | مساعدات تنسيق الأوامر، والانتظارات، والإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات patch الخاصة بحالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات الإعدادات | مساعدات تحميل/كتابة الإعدادات |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات التحقق الثابتة الاحتياطية لأوامر Telegram عندما لا يكون سطح عقد Telegram المضمّن متاحًا |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبات الموافقة | حمولة موافقة exec/plugin، ومساعدات approval capability/profile، ومساعدات التوجيه/وقت التشغيل الخاصة بالموافقة الأصلية، وتنسيق مسار عرض الموافقة المنظم |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل approver، ومصادقة الإجراء داخل الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف التعريف/المرشح الخاصة بالموافقة الأصلية على exec |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | مهايئات approval capability/delivery الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway الخاصة بالموافقة | مساعد حل Gateway المشترك الخاص بالموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات مهايئ الموافقة | مساعدات خفيفة لتحميل مهايئات الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ ويفضّل استخدام الواجهات الأضيق للمهايئ/Gateway عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط الهدف/الحساب الخاصة بالموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد الموافقة على exec/plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات channel runtime-context | مساعدات عامة لتسجيل/جلب/مراقبة channel runtime-context |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات مشتركة للثقة، وتقييد الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة سماح المضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | المرسِل المثبّت، وguarded fetch، ومساعدات سياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات الذاكرة المؤقتة المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات تقييد التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات مخطط الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy المغلّفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومنفذو السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | تقييد الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المُرسِل، ومساعدات سجل الأوامر بما في ذلك تنسيق قوائم الوسائط الديناميكية للوسيطات |
  | `plugin-sdk/command-status` | عارضات حالة الأوامر/المساعدة | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل الإدخال السري | مساعدات الإدخال السري |
  | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook | أدوات أهداف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة جسم Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال الرد الضيقة | مساعدات الإنهاء، وإرسال المزوّد، ووسوم المحادثة |
  | `plugin-sdk/reply-history` | مساعدات سجل الرد | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقسيم الرد | مساعدات تقسيم النص/‏Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة | مساعدات مسار المخزن + وقت التحديث |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات مجلد الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بُناة ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلّل الأهداف | مساعدات محلّل الأهداف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/string |
  | `plugin-sdk/request-url` | مساعدات URL الطلب | استخراج URL نصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقوتة | مشغّل أوامر موقوت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات الوسيطات | قارئات وسائط شائعة للأداة/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج حمولات مطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسارات المؤقتة | مساعدات مسارات التنزيل المؤقت المشتركة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | logger النظام الفرعي ومساعدات الإخفاء |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد منسقة للمزوّدات المحلية/المستضافة ذاتيًا | مساعدات اكتشاف/إعداد المزوّدات المستضافة ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد المزوّدات المستضافة ذاتيًا والمتوافقة مع OpenAI | مساعدات اكتشاف/إعداد المزوّدات المستضافة ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة وقت تشغيل المزوّد | مساعدات حل مفاتيح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفاتيح API للمزوّد | مساعدات الإعداد الأولي/كتابة ملف التعريف الخاصة بمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني نتيجة مصادقة OAuth قياسي |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للمزوّد | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزوّد | اختيار المزوّد المُهيأ أو التلقائي ودمج إعدادات المزوّد الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات env الخاصة بالمزوّد | مساعدات البحث عن متغيرات env لمصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات النماذج/إعادة التشغيل المشتركة للمزوّد | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبُناة سياسات إعادة التشغيل المشتركة، ومساعدات نقاط نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات فهرس المزوّد المشتركة | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | رقع الإعداد الأولي للمزوّد | مساعدات إعدادات الإعداد الأولي |
  | `plugin-sdk/provider-http` | مساعدات HTTP الخاصة بالمزوّد | مساعدات HTTP/قدرات نقاط نهاية المزوّد العامة، بما في ذلك مساعدات نموذج multipart لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch الخاصة بالمزوّد | مساعدات تسجيل/ذاكرة مؤقتة لمزوّد web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعدادات web-search الخاصة بالمزوّد | مساعدات ضيقة لإعدادات/بيانات اعتماد web-search للمزوّدين الذين لا يحتاجون إلى أسلاك تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد web-search الخاصة بالمزوّد | مساعدات ضيقة لعقد إعدادات/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وضبط/جلب بيانات الاعتماد ضمن النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات web-search الخاصة بالمزوّد | مساعدات تسجيل/ذاكرة مؤقتة/وقت تشغيل لمزوّد web-search |
  | `plugin-sdk/provider-tools` | مساعدات توافق الأدوات/المخططات الخاصة بالمزوّد | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, تنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام مزوّد أخرى |
  | `plugin-sdk/provider-stream` | مساعدات أغلفة تدفّق المزوّد | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع أغلفة التدفق، ومساعدات الأغلفة المشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات نقل المزوّد الأصلية مثل guarded fetch، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتّب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات وسائط مشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات failover المشتركة، واختيار المرشحين، ورسائل غياب النموذج لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزوّدي فهم الوسائط بالإضافة إلى عمليات تصدير مساعدات الصور/الصوت الموجهة للمزوّد |
  | `plugin-sdk/text-runtime` | مساعدات نص مشتركة | إزالة النص المرئي للمساعد، ومساعدات عرض/تقسيم/جداول Markdown، ومساعدات الإخفاء، ومساعدات وسم التوجيهات، وأدوات النص الآمن، ومساعدات النص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص | مساعد تقسيم النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزوّدي الكلام بالإضافة إلى مساعدات التوجيهات والسجل والتحقق الموجهة للمزوّد |
  | `plugin-sdk/speech-core` | النواة المشتركة للكلام | أنواع مزوّدي الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع المزوّدين، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع المزوّدين، ومساعدات السجل/الحل، ومساعدات جلسات الجسر |
  | `plugin-sdk/image-generation-core` | النواة المشتركة لتوليد الصور | أنواع توليد الصور، وfailover، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | النواة المشتركة لتوليد الموسيقى | أنواع توليد الموسيقى، ومساعدات failover، والبحث عن المزوّد، وتحليل مراجع النماذج |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | النواة المشتركة لتوليد الفيديو | أنواع توليد الفيديو، ومساعدات failover، والبحث عن المزوّد، وتحليل مراجع النماذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/تقليص حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات إعدادات القناة | بدائيات ضيقة لمخطط إعدادات القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة إعدادات القناة | مساعدات تفويض كتابة إعدادات القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | عمليات تصدير تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للّقطة/الملخص الخاصة بحالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات إعدادات قائمة السماح | مساعدات تعديل/قراءة إعدادات قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات الوصول إلى المجموعة | مساعدات مشتركة لاتخاذ قرار الوصول إلى المجموعة |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل المباشرة المباشرة | مساعدات مشتركة للمصادقة/الحراسة الخاصة بالرسائل المباشرة |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات القناة/الحالة السلبية ومساعدات proxy المحيطة |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | `zod` معاد تصديره لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المضمّنة | سطح مساعدات مدير/إعدادات/ملفات/CLI الخاصة بالذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك الأساس لمضيف الذاكرة | عمليات تصدير محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك embeddings لمضيف الذاكرة | عقود embeddings الخاصة بالذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدُفعات/البعيد العامة؛ أما المزوّدات البعيدة الفعلية فتوجد في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | عمليات تصدير محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | عمليات تصدير محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة | مساعدات الاستعلام لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة | مساعدات الأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات دفتر أحداث مضيف الذاكرة | مساعدات دفتر أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل النواة لمضيف الذاكرة | مساعدات وقت تشغيل النواة لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم بديل لوقت تشغيل النواة لمضيف الذاكرة | اسم بديل محايد للمزوّد لمساعدات وقت تشغيل النواة لمضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم بديل لدفتر أحداث مضيف الذاكرة | اسم بديل محايد للمزوّد لمساعدات دفتر أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم بديل لملفات/وقت تشغيل مضيف الذاكرة | اسم بديل محايد للمزوّد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات managed-markdown مشتركة للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث الذاكرة النشطة | واجهة وقت تشغيل lazy active-memory search-manager |
  | `plugin-sdk/memory-host-status` | اسم بديل لحالة مضيف الذاكرة | اسم بديل محايد للمزوّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المضمّنة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات الاختبار وعمليات المحاكاة |
</Accordion>

هذا الجدول هو عمدًا المجموعة الشائعة الخاصة بالترحيل، وليس سطح SDK الكامل.
وتوجد القائمة الكاملة التي تضم أكثر من 200 نقطة دخول في
`scripts/lib/plugin-sdk-entrypoints.json`.

ولا تزال تلك القائمة تتضمن بعض واجهات مساعدات Plugins المضمّنة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`,
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. وتبقى هذه الواجهات مُصدَّرة
من أجل صيانة Plugins المضمّنة والتوافق، لكنها حُذفت عمدًا من جدول الترحيل الشائع وليست الهدف الموصى به
لشيفرة Plugins الجديدة.

وتنطبق القاعدة نفسها على عائلات المساعدات المضمّنة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: ‏`plugin-sdk/matrix*`
- LINE: ‏`plugin-sdk/line*`
- IRC: ‏`plugin-sdk/irc*`
- أسطح المساعدات/Plugins المضمّنة مثل `plugin-sdk/googlechat`,
  و`plugin-sdk/zalouser`, و`plugin-sdk/bluebubbles*`,
  و`plugin-sdk/mattermost*`, و`plugin-sdk/msteams`,
  و`plugin-sdk/nextcloud-talk`, و`plugin-sdk/nostr`, و`plugin-sdk/tlon`,
  و`plugin-sdk/twitch`,
  و`plugin-sdk/github-copilot-login`, و`plugin-sdk/github-copilot-token`,
  و`plugin-sdk/diagnostics-otel`, و`plugin-sdk/diagnostics-prometheus`,
  و`plugin-sdk/diffs`, و`plugin-sdk/llm-task`, و`plugin-sdk/thread-ownership`,
  و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا عن سطح مساعدات الرموز الضيق
`DEFAULT_COPILOT_API_BASE_URL`,
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. وإذا لم تتمكن من العثور على عملية تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## حالات الإهمال النشطة

حالات إهمال أضيق تنطبق عبر Plugin SDK، وعقد المزوّد،
وسطح وقت التشغيل، وmanifest. ولا يزال كل منها يعمل اليوم لكنه سيُزال
في إصدار رئيسي مستقبلي. ويطابق الإدخال الموجود تحت كل عنصر واجهة API القديمة ببديلها القياسي.

<AccordionGroup>
  <Accordion title="بُناة مساعدة command-auth → command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: ‏`buildCommandsMessage`,
    و`buildCommandsMessagePaginated`, و`buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها، وعمليات
    التصدير نفسها — فقط مع الاستيراد من المسار الفرعي الأضيق. ويعيد `command-auth`
    تصديرها كبدائل توافقية.

    ```typescript
    // قبل
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // بعد
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات تقييد الإشارة → resolveInboundMentionDecision">
    **القديم**: ‏`resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: ‏`resolveInboundMentionDecision({ facts, policy })` — ويعيد
    كائن قرار واحدًا بدلًا من استدعاءين منفصلين.

    وقد انتقلت Plugins القنوات التابعة (Slack وDiscord وMatrix وMS Teams) بالفعل
    إلى هذا الأسلوب.

  </Accordion>

  <Accordion title="رقاقة وقت تشغيل القناة ومساعدات إجراءات القناة">
    يُعد `openclaw/plugin-sdk/channel-runtime` رقاقة توافقية لـ Plugins
    القنوات الأقدم. لا تستورده في الشيفرة الجديدة؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    كما تُهمل مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions`
    إلى جانب عمليات تصدير القنوات الخام من نوع "actions". اكشف القدرات
    بدلًا من ذلك عبر سطح `presentation` الدلالي — إذ تعلن Plugins
    القنوات ما الذي تعرضه (بطاقات، أزرار، قوائم اختيار) بدلًا من أسماء
    الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="مساعد tool() الخاصة بمزوّد web search → createTool() على Plugin">
    **القديم**: المصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على Plugin المزوّد.
    لم يعد OpenClaw بحاجة إلى مساعد SDK لتسجيل غلاف الأداة.

  </Accordion>

  <Accordion title="مغلفات القنوات النصية العادية → BodyForAgent">
    **القديم**: ‏`formatInboundEnvelope(...)` ‏(و
    `ChannelMessageForAgent.channelEnvelope`) لبناء مغلف prompt نصي عادي
    ومسطح من رسائل القناة الواردة.

    **الجديد**: ‏`BodyForAgent` بالإضافة إلى كتل سياق المستخدم المهيكلة. وتقوم
    Plugins القنوات بإرفاق بيانات تعريف التوجيه (الخيط، والموضوع، والرد على، والتفاعلات) كحقول
    ذات أنواع بدلًا من ضمّها داخل سلسلة prompt. وما زال
    المساعد `formatAgentEnvelope(...)` مدعومًا للمغلفات الاصطناعية المواجهة للمساعد، لكن المغلفات النصية العادية الواردة
    في طريقها إلى الزوال.

    المناطق المتأثرة: `inbound_claim`، و`message_received`، وأي
    Plugin قناة مخصصة كانت تعالج نص `channelEnvelope` بعديًا.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّد → أنواع فهرس المزوّد">
    أصبحت أربعة أسماء بديلة لأنواع الاكتشاف الآن أغلفة رقيقة فوق
    أنواع عصر الفهرس:

    | الاسم البديل القديم        | النوع الجديد            |
    | -------------------------- | ----------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`  |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`|
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult` |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog` |

    بالإضافة إلى الحقيبة الثابتة القديمة `ProviderCapabilities` — إذ يجب على Plugins المزوّدين
    إرفاق حقائق القدرات عبر عقد وقت تشغيل المزوّد
    بدلًا من كائن ثابت.

  </Accordion>

  <Accordion title="Hooks سياسة التفكير → resolveThinkingProfile">
    **القديم** (ثلاث hooks منفصلة على `ProviderThinkingPolicy`):
    ‏`isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: ‏`resolveThinkingProfile(ctx)` واحدة تعيد
    `ProviderThinkingProfile` يحوي `id` القياسي، و`label` اختياريًا، و
    قائمة مستويات مرتبة. ويخفض OpenClaw القيم المخزنة القديمة تلقائيًا بحسب
    رتبة ملف التعريف.

    نفّذ hook واحدة بدلًا من ثلاث. وتظل hooks القديمة تعمل أثناء
    نافذة الإهمال، لكنها لا تُركّب مع نتيجة ملف التعريف.

  </Accordion>

  <Accordion title="الرجوع الاحتياطي لمزوّد OAuth الخارجي → contracts.externalAuthProviders">
    **القديم**: تنفيذ `resolveExternalOAuthProfiles(...)` من دون
    إعلان المزوّد في manifest الخاصة بالـ Plugin.

    **الجديد**: أعلن `contracts.externalAuthProviders` في manifest الخاصة بالـ Plugin
    **ونفّذ أيضًا** `resolveExternalAuthProfiles(...)`. ويصدر المسار القديم "للرجوع الاحتياطي للمصادقة"
    تحذيرًا وقت التشغيل وسيُزال لاحقًا.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="البحث عن متغيرات env الخاصة بالمزوّد → setup.providers[].envVars">
    **حقل manifest القديم**: ‏`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس البحث نفسه عن متغيرات env إلى `setup.providers[].envVars`
    في manifest. وهذا يدمج بيانات تعريف env الخاصة بالإعداد/الحالة في
    مكان واحد ويتجنب تشغيل وقت تشغيل Plugin فقط للإجابة عن
    عمليات البحث عن متغيرات env.

    يظل `providerAuthEnvVars` مدعومًا عبر مهايئ توافق
    حتى تُغلق نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة → registerMemoryCapability">
    **القديم**: ثلاث استدعاءات منفصلة —
    `api.registerMemoryPromptSection(...)`,
    و`api.registerMemoryFlushPlan(...)`,
    و`api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الفتحات نفسها، لكن باستدعاء تسجيل واحد. أما مساعدات الذاكرة الإضافية
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) فلم تتأثر.

  </Accordion>

  <Accordion title="أعيدت تسمية أنواع رسائل جلسة الوكيل الفرعي">
    لا يزال اسمان بديلان قديمان للأنواع مُصدَّرين من `src/plugins/runtime/types.ts`:

    | القديم                      | الجديد                          |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    أُهملت طريقة وقت التشغيل `readSession` لصالح
    `getSessionMessages`. التوقيع نفسه؛ والطريقة القديمة تستدعي
    الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **القديم**: كان `runtime.tasks.flow` ‏(بالمفرد) يعيد ملحق TaskFlow حيًا.

    **الجديد**: يعيد `runtime.tasks.flows` ‏(بالجمع) وصولًا إلى TaskFlow قائمًا على DTO،
    وهو آمن للاستيراد ولا يتطلب تحميل وقت تشغيل المهام بالكامل.

    ```typescript
    // قبل
    const flow = api.runtime.tasks.flow(ctx);
    // بعد
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع Embedded extension → middleware الخاصة بنتائج أدوات الوكيل">
    تمت تغطية هذا في "كيفية الترحيل → ترحيل إضافات Pi الخاصة بنتائج الأدوات إلى
    middleware" أعلاه. وهو مُدرج هنا من أجل الاكتمال: إذ استُبدل المسار
    المحذوف `api.registerEmbeddedExtensionFactory(...)` والمقتصر على Pi بـ
    `api.registerAgentToolResultMiddleware(...)` مع قائمة وقت تشغيل صريحة في
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم البديل OpenClawSchemaType → OpenClawConfig">
    إن `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk` أصبح الآن
    اسمًا بديلًا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم القياسي.

    ```typescript
    // قبل
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // بعد
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبع حالات الإهمال على مستوى extension ‏(داخل Plugins القنوات/المزوّدين المضمّنة تحت
`extensions/`) داخل واجهات `api.ts` و`runtime-api.ts`
الخاصة بها. وهي لا تؤثر في عقود Plugins الخارجية وليست مدرجة
هنا. وإذا كنت تستهلك barrel محلية خاصة بـ Plugin مضمّنة مباشرة، فاقرأ
تعليقات الإهمال في تلك الـ barrel قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى                   | ما الذي يحدث                                                           |
| --------------------- | ---------------------------------------------------------------------- |
| **الآن**              | تصدر الأسطح المهملة تحذيرات في وقت التشغيل                             |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهملة؛ وستفشل Plugins التي لا تزال تستخدمها        |

لقد جرى بالفعل ترحيل جميع Plugins الأساسية. ويجب على Plugins الخارجية أن تترحل
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ Plugin الأولى الخاصة بك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيرادات المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
- [الداخليات الخاصة بالـ Plugin](/ar/plugins/architecture) — تعمق في البنية
- [Plugin Manifest](/ar/plugins/manifest) — مرجع مخطط manifest
