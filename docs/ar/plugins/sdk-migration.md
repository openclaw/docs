---
read_when:
    - أنت ترى التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - أنت ترى التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - لقد استخدمت `api.registerEmbeddedExtensionFactory` قبل OpenClaw 2026.4.25
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تدير Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى Plugin SDK الحديثة
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-25T18:21:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى بنية Plugin
حديثة ذات استيرادات مركّزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugins القديم يوفّر سطحين مفتوحين على اتساعهما يسمحان للـ Plugins باستيراد
أي شيء تحتاج إليه من نقطة إدخال واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. وقد قُدِّم للإبقاء على Plugins الأقدم المعتمدة على الخطافات عاملة أثناء بناء
  بنية Plugins الجديدة.
- **`openclaw/extension-api`** — جسر كان يمنح Plugins وصولًا مباشرًا إلى
  مساعدات جهة المضيف مثل مشغّل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** — خطاف Extensions مضمّنة خاص بـ Pi أُزيل
  وكان يمكنه مراقبة أحداث المشغّل المضمّن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مُهمَلة**. وما تزال تعمل في وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي للـ Plugins الحالية الترحيل قبل أن يزيلها
الإصدار الرئيسي التالي. وقد أُزيلت واجهة برمجة تطبيقات تسجيل مصنع Extension المضمّنة الخاصة بـ Pi؛ استخدم
برمجيات middleware الخاصة بنتائج الأدوات بدلًا من ذلك.

لا يزيل OpenClaw سلوك Plugin موثقًا أو يعيد تفسيره في التغيير نفسه الذي يقدّم
بديلًا له. ويجب أن تمر تغييرات العقود الكاسرة أولًا عبر مهايئ توافق،
وتشخيصات، ووثائق، ونافذة إهمال.
وينطبق ذلك على استيرادات SDK، وحقول البيان، وواجهات إعداد البرمجة، والخطافات، وسلوك التسجيل في وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  وستتعطل Plugins التي ما تزال تستورد من هذه الأسطح عند حدوث ذلك.
  كما أن تسجيلات مصانع Extensions المضمّنة الخاصة بـ Pi لم تعد تُحمَّل بالفعل.
</Warning>

## لماذا تغيّر هذا

سبّب النهج القديم مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** — جعلت إعادة التصدير الواسعة من السهل إنشاء دورات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة الصادرات المستقرة مقابل الداخلية

تعالج Plugin SDK الحديثة هذا: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة ومكتفية ذاتيًا ذات غرض واضح وعقد موثّق.

كما أُزيلت أيضًا الوصلات القديمة المريحة الخاصة بالمزوّد للقنوات المضمّنة. فاستيرادات
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`،
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
ووصلات المساعدات الموسومة باسم القناة، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة بالمستودع الأحادي، لا
عقود Plugin مستقرة. استخدم بدلًا منها مسارات SDK عامة ضيقة. وداخل
مساحة عمل Plugin المضمّنة، أبقِ المساعدات المملوكة للمزوّد في
`api.ts` أو `runtime-api.ts` الخاصين بذلك Plugin.

أمثلة المزوّدين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات التدفق الخاصة بـ Claude في وصلة
  `api.ts` / `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببناة المزوّد، ومساعدات النموذج الافتراضي، وبناة المزوّد
  اللحظي في `api.ts` الخاص به
- يحتفظ OpenRouter بباني المزوّد ومساعدات الإعداد/التهيئة في
  `api.ts` الخاص به

## سياسة التوافق

بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

1. إضافة العقد الجديد
2. إبقاء السلوك القديم موصولًا عبر مهايئ توافق
3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
4. تغطية كلا المسارين في الاختبارات
5. توثيق الإهمال ومسار الترحيل
6. الإزالة فقط بعد نافذة الترحيل المُعلنة، وعادةً في إصدار رئيسي

إذا كان ما يزال يجري قبول حقل في البيان، فيمكن لمؤلفي Plugins الاستمرار في استخدامه
حتى تقول الوثائق والتشخيصات خلاف ذلك. ويجب أن يفضّل الكود الجديد
البديل الموثق، لكن يجب ألا تتعطل Plugins الحالية أثناء الإصدارات
الفرعية العادية.

## كيفية الترحيل

<Steps>
  <Step title="ترحيل Extensions نتائج أدوات Pi إلى middleware">
    يجب على Plugins المضمّنة استبدال
    معالجات نتائج الأدوات الخاصة بـ Pi فقط في
    `api.registerEmbeddedExtensionFactory(...)` بـ
    middleware محايد لوقت التشغيل.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    حدّث بيان Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    لا يمكن للـ Plugins الخارجية تسجيل middleware نتائج الأدوات لأنها قد
    تعيد كتابة مخرجات أدوات عالية الثقة قبل أن يراها النموذج.

  </Step>

  <Step title="ترحيل المعالجات الأصلية للموافقات إلى حقائق القدرات">
    تكشف Plugins القنوات القادرة على الموافقة الآن عن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقات من الربط القديم
      `plugin.auth` /
      `plugin.approvals` إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد Plugin القنوات العام؛ انقل حقول
      التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` مخصصًا فقط لتدفقات تسجيل الدخول/تسجيل الخروج الخاصة بالقنوات؛ ولم تعد
      خطافات مصادقة الموافقات هناك مقروءة من النواة
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء، أو الرموز، أو تطبيقات
      Bolt عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة للـ Plugin من معالجات الموافقة الأصلية؛
      فالنواة تمتلك الآن إشعارات التوجيه-إلى-مكان-آخر المستندة إلى نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. وتُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على التخطيط الحالي لقدرة
    الموافقة.

  </Step>

  <Step title="مراجعة سلوك الرجوع الاحتياطي لمغلّف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن مغلّفات Windows من نوع `.cmd`/`.bat` غير المحلولة تفشل الآن فشلًا مغلقًا
    ما لم تمرر صراحةً `allowShellFallback: true`.

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

    إذا لم يكن المستدعي لديك يعتمد عمدًا على الرجوع الاحتياطي عبر shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المُلقى بدلًا من ذلك.

  </Step>

  <Step title="العثور على الاستيرادات المُهمَلة">
    ابحث في Plugin الخاص بك عن الاستيرادات من أيٍّ من السطحين المُهمَلين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="الاستبدال باستيرادات مركّزة">
    يقابل كل تصدير من السطح القديم مسار استيراد حديثًا محددًا:

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

    بالنسبة إلى مساعدات جهة المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد
    المباشر:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
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
    | مساعدات مخزن الجلسات | `api.runtime.agent.session.*` |

  </Step>

  <Step title="البناء والاختبار">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسار الاستيراد

  <Accordion title="جدول مسارات الاستيراد الشائعة">
  | مسار الاستيراد | الغرض | الصادرات الأساسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin الأساسي | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط الإعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال مزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال القنوات المركّزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت التشغيل الخاصة بالإعداد | مهايئات رقع الإعداد الآمنة للاستيراد، ومساعدات ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوّضون |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات مهايئ الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع الاحتياطي الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حساب ضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | مهايئات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران الرسائل الخاصة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | ربط بادئة الردّ + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع مهايئات الإعدادات | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بناة مخطط الإعدادات | بدائيات مخطط إعدادات القنوات المشتركة؛ أما صادرات المخطط المسمّاة للقنوات المضمّنة فهي للتوافق القديم فقط |
  | `plugin-sdk/telegram-command-config` | مساعدات إعدادات أوامر Telegram | تطبيع اسم الأمر، وتشذيب الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعات/الرسائل الخاصة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات حالة الحساب ودورة حياة تدفق المسودات | `createAccountStatusSink`، ومساعدات إنهاء معاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدات غلاف الوارد | مساعدات المسار + بناء الغلاف المشتركة |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الردّ الوارد | مساعدات التسجيل والإرسال المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات التسليم الصادر، وهوية/مندوب الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط الخيوط | مساعدات دورة حياة ربط الخيوط والمهايئات |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولة وسائط الوكيل القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | توافقية قديمة مُهمَلة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin المستمر | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت تشغيل ضيقة | مساعدات المسجل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/خطافات/HTTP/التفاعل الخاصة بالـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار الخطافات | مساعدات مسار Webhook/الخطافات الداخلية المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات `exec` المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدارات |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات رقع حالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات الإعدادات | مساعدات تحميل/كتابة الإعدادات |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق أوامر Telegram مستقرة بالرجوع الاحتياطي عندما لا يتوفر سطح عقد Telegram المضمّن |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبات الموافقة | حمولة موافقات التنفيذ/Plugin، ومساعدات قدرة/ملف تعريف الموافقة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار عرض الموافقة المنظّمة |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل المُوافِق، ومصادقة الإجراءات داخل الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/مرشح الموافقة الأصلية للتنفيذ |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | مهايئات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway الخاصة بالموافقة | مساعد حل Gateway للموافقة المشتركة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات مهايئ الموافقة | مساعدات تحميل مهايئ الموافقة الأصلية خفيفة الوزن لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ ويفضَّل استخدام وصلات المهايئ/البوابة الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات ردّ الموافقة | مساعدات حمولة ردّ الموافقة للتنفيذ/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/جلب/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة، وتقييد الرسائل الخاصة، والمحتوى الخارجي، وجمع الأسرار المشتركة |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح للمضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | مساعدات المرسِل المثبّت، و`fetch` المحمي، وسياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات الذاكرة المؤقتة المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات رسم الأخطاء البياني |
  | `plugin-sdk/fetch-runtime` | مساعدات `fetch`/الوكيل الملفوفة | `resolveFetch`، ومساعدات الوكيل |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومشغلات السياسة |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | بوابة الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المُرسِل، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية |
  | `plugin-sdk/command-status` | مصيّرات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل مدخلات الأسرار | مساعدات مدخلات الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة جسم طلب Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الردّ المشترك | الإرسال الوارد، وHeartbeat، ومخطط الردّ، والتجزئة |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال الردّ الضيقة | مساعدات الإنهاء، وإرسال المزوّد، وتسميات المحادثة |
  | `plugin-sdk/reply-history` | مساعدات سجل الردود | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تجزئة الردّ | مساعدات تجزئة النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسات | مساعدات مسار المخزن + `updated-at` |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات دليل الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بناة ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات المشكلة الوصفية |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلّل الهدف | مساعدات محلّل الهدف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/السلسلة |
  | `plugin-sdk/request-url` | مساعدات URL الطلب | استخراج URL نصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر المؤقتة | مشغّل أوامر مؤقت مع `stdout`/`stderr` مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات معلمات الأدوات/CLI الشائعة |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال الأساسية من وسائط الأدوات |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مسار تنزيلات مؤقتة مشتركة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجل النظام الفرعي وإخفاء البيانات الحساسة |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات أوضاع جداول Markdown |
  | `plugin-sdk/reply-payload` | أنواع ردّ الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد مزوّدين محليين/مستضافين ذاتيًا منتقاة | مساعدات اكتشاف/إعداد المزوّدين المستضافين ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد مزوّدين مستضافين ذاتيًا ومتوافقين مع OpenAI | مساعدات اكتشاف/إعداد المزوّدين المستضافين ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة المزوّد في وقت التشغيل | مساعدات حل مفاتيح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفاتيح API للمزوّد | مساعدات إدخال/كتابة ملف تعريف مفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني نتيجة مصادقة OAuth القياسي |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للمزوّد | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار المزوّد | اختيار المزوّد المضبوط أو التلقائي ودمج إعدادات المزوّد الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات بيئة المزوّد | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل المزوّد | `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks`، و`normalizeModelCompat`، وبناة سياسة الإعادة المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لفهرس المزوّد | `findCatalogTemplate`، و`buildSingleProviderApiKeyCatalog`، و`supportsNativeStreamingUsageCompat`، و`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | رقع إعداد المزوّد | مساعدات إعدادات الإعداد |
  | `plugin-sdk/provider-http` | مساعدات HTTP الخاصة بالمزوّد | مساعدات عامة لـ HTTP/قدرات نقطة النهاية الخاصة بالمزوّد، بما في ذلك مساعدات نموذج multipart لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch الخاصة بالمزوّد | مساعدات تسجيل/ذاكرة مؤقتة لمزوّد web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعدادات البحث على الويب الخاصة بالمزوّد | مساعدات ضيقة لإعدادات/بيانات اعتماد البحث على الويب للمزوّدين الذين لا يحتاجون إلى ربط تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد البحث على الويب الخاصة بالمزوّد | مساعدات ضيقة لعقد إعدادات/بيانات اعتماد البحث على الويب مثل `createWebSearchProviderContractFields`، و`enablePluginInConfig`، و`resolveProviderWebSearchPluginConfig`، ووسائل ضبط/جلب بيانات الاعتماد ضمن النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات البحث على الويب الخاصة بالمزوّد | مساعدات تسجيل/ذاكرة مؤقتة/وقت تشغيل لمزوّد البحث على الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق الأدوات/المخطط الخاصة بالمزوّد | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`، و`fetchGeminiUsage`، و`fetchGithubCopilotUsage`، ومساعدات استخدام أخرى للمزوّد |
  | `plugin-sdk/provider-stream` | مساعدات غلاف تدفّق المزوّد | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع أغلفة التدفق، ومساعدات الأغلفة المشتركة لـ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات النقل الأصلية الخاصة بالمزوّد مثل `fetch` المحمي، وتحويلات رسائل النقل، وتدفّقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات وسائط مشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى بناة حمولات الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات failover المشتركة، واختيار المرشحين، ورسائل النماذج المفقودة لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزوّد فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجّهة إلى المزوّد |
  | `plugin-sdk/text-runtime` | مساعدات نصية مشتركة | إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيهات، وأدوات النص الآمن، ومساعدات النص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تجزئة النص | مساعد تجزئة النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزوّد الكلام بالإضافة إلى مساعدات التوجيهات، والسجل، والتحقق الموجّهة إلى المزوّد |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزوّد الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ في الوقت الفعلي | أنواع المزوّد، ومساعدات السجل، ومساعد WebSocket session المشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت في الوقت الفعلي | أنواع المزوّد، ومساعدات السجل/الحل، ومساعدات جلسة الجسر |
  | `plugin-sdk/image-generation-core` | نواة توليد الصور المشتركة | أنواع توليد الصور، وfailover، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة توليد الموسيقى المشتركة | أنواع توليد الموسيقى، ومساعدات failover، والبحث عن المزوّد، وتحليل model-ref |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة توليد الفيديو المشتركة | أنواع توليد الفيديو، ومساعدات failover، والبحث عن المزوّد، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | مساعدات الردّ التفاعلي | تطبيع/اختزال حمولة الردّ التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات إعدادات القناة | بدائيات ضيقة لمخطط إعدادات القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة إعدادات القناة | مساعدات تفويض كتابة إعدادات القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للّقطة/الملخص الخاصة بحالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات إعدادات قائمة السماح | مساعدات تحرير/قراءة إعدادات قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات مشتركة لقرارات وصول المجموعة |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل الخاصة المباشرة | مساعدات مشتركة لمصادقة/حراسة الرسائل الخاصة المباشرة |
  | `plugin-sdk/extension-shared` | مساعدات Extension مشتركة | بدائيات مساعدات القناة/الحالة السلبية والوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المضمّنة | سطح مساعدات مدير/إعدادات/ملفات/CLI الخاصة بالذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لمحرك الذاكرة | واجهة وقت تشغيل لفهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك الأساس لمضيف الذاكرة | صادرات محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك التضمينات لمضيف الذاكرة | عقود تضمينات الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات الدُفعات/البعيد العامة؛ أما المزوّدون البعيدون الفعليون فيوجدون في Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | صادرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة | مساعدات الاستعلام لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة | مساعدات الأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة | مساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل النواة لمضيف الذاكرة | مساعدات وقت تشغيل النواة لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم بديل لوقت تشغيل نواة مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم بديل لسجل أحداث مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم بديل لملفات/وقت تشغيل مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات Markdown المُدارة المشتركة للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم بديل لحالة مضيف الذاكرة | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المضمّنة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات الاختبار والمحاكيات |
</Accordion>

هذا الجدول هو عمدًا المجموعة الفرعية الشائعة للترحيل، وليس سطح SDK
الكامل. وتوجد القائمة الكاملة التي تضم أكثر من 200 نقطة إدخال في
`scripts/lib/plugin-sdk-entrypoints.json`.

وما تزال تلك القائمة تتضمن بعض وصلات مساعدات Plugins المضمّنة مثل
`plugin-sdk/feishu`، و`plugin-sdk/feishu-setup`، و`plugin-sdk/zalo`،
و`plugin-sdk/zalo-setup`، و`plugin-sdk/matrix*`. وتبقى هذه الوصلات مُصدَّرة
لصيانة Plugins المضمّنة والتوافق، لكنها مُهمَلة عمدًا من جدول الترحيل الشائع
وليست الهدف الموصى به لكود Plugins الجديد.

وتنطبق القاعدة نفسها على عائلات المساعدات المضمّنة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp`، و`plugin-sdk/browser-config-runtime`، و`plugin-sdk/browser-config-support`، و`plugin-sdk/browser-control-auth`، و`plugin-sdk/browser-node-runtime`، و`plugin-sdk/browser-profiles`، و`plugin-sdk/browser-security-runtime`، و`plugin-sdk/browser-setup-tools`، و`plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- أسطح المساعدات/Plugins المضمّنة مثل `plugin-sdk/googlechat`،
  و`plugin-sdk/zalouser`، و`plugin-sdk/bluebubbles*`،
  و`plugin-sdk/mattermost*`، و`plugin-sdk/msteams`،
  و`plugin-sdk/nextcloud-talk`، و`plugin-sdk/nostr`، و`plugin-sdk/tlon`,
  و`plugin-sdk/twitch`،
  و`plugin-sdk/github-copilot-login`، و`plugin-sdk/github-copilot-token`،
  و`plugin-sdk/diagnostics-otel`، و`plugin-sdk/diffs`، و`plugin-sdk/llm-task`،
  و`plugin-sdk/thread-ownership`، و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا عن سطح مساعدات الرموز الضيق
`DEFAULT_COPILOT_API_BASE_URL`،
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. وإذا لم تتمكن من العثور على تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## حالات الإهمال النشطة

حالات إهمال أضيق تنطبق عبر Plugin SDK، وعقد المزوّد،
وسطح وقت التشغيل، والبيان. وكل واحدة منها ما تزال تعمل اليوم لكنها ستُزال
في إصدار رئيسي مستقبلي. ويقوم الإدخال الموجود تحت كل عنصر بربط API القديمة
ببديلها الأساسي.

<AccordionGroup>
  <Accordion title="بناة المساعدة في command-auth ← command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`،
    و`buildCommandsMessagePaginated`، و`buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها،
    والصادرات نفسها — إنما مستوردة من المسار الفرعي الأضيق. ويعيد `command-auth`
    تصديرها كقوالب توافقية.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات تقييد الإشارات ← resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` — يعيد
    كائن قرار واحدًا بدلًا من استدعاءين منفصلين.

    لقد انتقلت بالفعل Plugins القنوات التابعة (Slack وDiscord وMatrix وMS Teams) إلى ذلك.

  </Accordion>

  <Accordion title="توافقية وقت تشغيل القناة ومساعدات إجراءات القناة">
    `openclaw/plugin-sdk/channel-runtime` هو توافقية توافق للـ Plugins الأقدم
    الخاصة بالقنوات. لا تستورده في الكود الجديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    كما أن مساعدات `channelActions*` في `openclaw/plugin-sdk/channel-actions`
    مُهمَلة إلى جانب صادرات القناة الخام الخاصة بـ "actions". اكشف
    القدرات عبر سطح `presentation` الدلالي بدلًا من ذلك — إذ تعلن Plugins
    القنوات ما الذي تعرضه (بطاقات، وأزرار، واختيارات) بدلًا من أسماء
    الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="مساعد tool() لمزوّد البحث على الويب ← createTool() على Plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرةً على Plugin المزوّد.
    لم يعد OpenClaw يحتاج إلى مساعد SDK لتسجيل غلاف الأداة.

  </Accordion>

  <Accordion title="أغلفة القنوات النصية الصريحة ← BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء غلاف موجّه نصي مسطح
    من رسائل القنوات الواردة.

    **الجديد**: `BodyForAgent` بالإضافة إلى كتل سياق المستخدم المنظّمة. إذ
    تُلحق Plugins القنوات بيانات وصفية للتوجيه (الخيط، والموضوع، والردّ-على، والتفاعلات)
    بوصفها حقولًا مطبّعة بدلًا من ضمّها في سلسلة موجّه.
    وما يزال المساعد `formatAgentEnvelope(...)` مدعومًا للأغلفة المركّبة
    الموجّهة إلى المساعد، لكن الأغلفة النصية الصريحة للوارد في طريقها إلى الزوال.

    المناطق المتأثرة: `inbound_claim`، و`message_received`، وأي
    Plugin قناة مخصص كان يعالج لاحقًا نص `channelEnvelope`.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّد ← أنواع فهرس المزوّد">
    أصبحت أربعة أسماء بديلة لأنواع الاكتشاف الآن أغلفة رقيقة فوق
    أنواع حقبة الفهرس:

    | الاسم البديل القديم         | النوع الجديد            |
    | --------------------------- | ----------------------- |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`  |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`   |

    بالإضافة إلى الحقيبة الساكنة القديمة `ProviderCapabilities` — ينبغي على Plugins
    المزوّدين إرفاق حقائق القدرات عبر عقد وقت تشغيل المزوّد
    بدلًا من كائن ساكن.

  </Accordion>

  <Accordion title="خطافات سياسة التفكير ← resolveThinkingProfile">
    **القديم** (ثلاثة خطافات منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، و`supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` الأساسي، و`label` اختياري، و
    قائمة مستويات مرتبة. ويخفض OpenClaw القيم المخزنة القديمة تلقائيًا
    بحسب رتبة الملف الشخصي.

    نفّذ خطافًا واحدًا بدلًا من ثلاثة. وما تزال الخطافات القديمة تعمل أثناء
    نافذة الإهمال لكنها لا تُركّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="الرجوع الاحتياطي لمزوّد OAuth الخارجي ← contracts.externalAuthProviders">
    **القديم**: تنفيذ `resolveExternalOAuthProfiles(...)` من دون
    إعلان المزوّد في بيان Plugin.

    **الجديد**: أعلِن `contracts.externalAuthProviders` في بيان Plugin
    **و** نفّذ `resolveExternalAuthProfiles(...)`. إذ يصدر مسار "الرجوع الاحتياطي للمصادقة"
    القديم تحذيرًا في وقت التشغيل وسيُزال لاحقًا.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="البحث عن متغيرات بيئة المزوّد ← setup.providers[].envVars">
    **حقل البيان القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس البحث نفسه عن متغيرات البيئة إلى `setup.providers[].envVars`
    في البيان. وهذا يدمج بيانات البيئة الوصفية الخاصة بالإعداد/الحالة في
    مكان واحد ويتجنب تشغيل وقت تشغيل Plugin فقط للإجابة عن
    عمليات البحث عن متغيرات البيئة.

    وما يزال `providerAuthEnvVars` مدعومًا عبر مهايئ توافق
    إلى أن تُغلق نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة ← registerMemoryCapability">
    **القديم**: ثلاث استدعاءات منفصلة —
    `api.registerMemoryPromptSection(...)`،
    و`api.registerMemoryFlushPlan(...)`،
    و`api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    المنافذ نفسها، واستدعاء تسجيل واحد. ولا تتأثر مساعدات الذاكرة
    الإضافية (`registerMemoryPromptSupplement`، و`registerMemoryCorpusSupplement`،
    و`registerMemoryEmbeddingProvider`).

  </Accordion>

  <Accordion title="أُعيدت تسمية أنواع رسائل جلسة الوكيل الفرعي">
    ما تزال اسمان بديلان قديمان للأنواع مُصدَّرين من `src/plugins/runtime/types.ts`:

    | القديم                        | الجديد                           |
    | ----------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    أصبحت طريقة وقت التشغيل `readSession` مُهمَلة لصالح
    `getSessionMessages`. والتوقيع نفسه؛ إذ تستدعي الطريقة القديمة
    الطريقة الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow ← runtime.tasks.flows">
    **القديم**: كان `runtime.tasks.flow` (بالمفرد) يعيد واصِل TaskFlow حيًا.

    **الجديد**: يعيد `runtime.tasks.flows` (بالجمع) وصول TaskFlow
    قائمًا على DTO، وهو آمن للاستيراد ولا يتطلب تحميل وقت تشغيل المهام
    الكامل.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع Extensions المضمّنة ← middleware نتائج أدوات الوكيل">
    جرى تناول ذلك في "كيفية الترحيل → ترحيل Extensions نتائج أدوات Pi إلى
    middleware" أعلاه. وهو مُدرَج هنا للاكتمال: إذ استُبدل المسار الخاص بـ Pi فقط
    `api.registerEmbeddedExtensionFactory(...)` الذي أُزيل بـ
    `api.registerAgentToolResultMiddleware(...)` مع قائمة أوقات تشغيل صريحة في
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم البديل OpenClawSchemaType ← OpenClawConfig">
    إن `OpenClawSchemaType` المُعاد تصديره من `openclaw/plugin-sdk` هو الآن
    اسم بديل من سطر واحد لـ `OpenClawConfig`. ففضّل الاسم الأساسي.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتتبَّع حالات الإهمال على مستوى Extension (داخل Plugins القنوات/المزوّدين المضمّنة تحت
`extensions/`) داخل براميلي `api.ts` و`runtime-api.ts`
الخاصة بها. وهي لا تؤثر في عقود Plugins الخارجية ولا تُدرج
هنا. وإذا كنت تستهلك البرميل المحلي الخاص بـ Plugin مضمّن مباشرةً، فاقرأ
تعليقات الإهمال في ذلك البرميل قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى | ماذا يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن** | تصدر الأسطح المُهمَلة تحذيرات وقت تشغيل |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المُهمَلة؛ وستفشل Plugins التي ما تزال تستخدمها |

لقد جرى بالفعل ترحيل جميع Plugins الأساسية. وينبغي للـ Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء عملك على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيرادات المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
- [الداخلية الخاصة بالـ Plugin](/ar/plugins/architecture) — تعمّق في البنية
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
