---
read_when:
    - يظهر لك تحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - ترى تحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - استخدمت api.registerEmbeddedExtensionFactory قبل OpenClaw 2026.4.25
    - أنت تحدّث Plugin إلى معمارية Plugin الحديثة
    - أنت تتولى صيانة Plugin خارجي لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-30T08:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى معمارية Plugin حديثة
ذات عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
المعمارية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين واسعين ومفتوحين أتاحا للـ plugins استيراد
كل ما تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. قُدِّم لإبقاء plugins القديمة المستندة إلى الخطافات تعمل بينما
  كانت معمارية Plugin الجديدة قيد البناء.
- **`openclaw/plugin-sdk/infra-runtime`** — تجميعة واسعة لمساعدات وقت التشغيل
  كانت تمزج أحداث النظام، وحالة Heartbeat، وطوابير التسليم، ومساعدات
  الجلب/الوكيل، ومساعدات الملفات، وأنواع الموافقة، وأدوات غير مترابطة.
- **`openclaw/plugin-sdk/config-runtime`** — تجميعة توافق واسعة للإعدادات
  لا تزال تحمل مساعدات التحميل/الكتابة المباشرة المهملة أثناء نافذة الترحيل.
- **`openclaw/extension-api`** — جسر منح plugins وصولا مباشرا إلى
  مساعدات جانب المضيف مثل مشغل الوكيل المضمن.
- **`api.registerEmbeddedExtensionFactory(...)`** — خطاف Plugin مضمّن مخصص
  لـ Pi فقط وقد أزيل، وكان يمكنه مراقبة أحداث المشغل المضمن مثل
  `tool_result`.

أصبحت أسطح الاستيراد الواسعة الآن **مهملة**. لا تزال تعمل في وقت التشغيل،
لكن يجب على plugins الجديدة ألا تستخدمها، وينبغي للـ plugins الحالية الترحيل قبل
أن يزيلها الإصدار الرئيسي التالي. أُزيلت واجهة API لتسجيل مصنع Plugin المضمّن
المخصصة لـ Pi فقط؛ استخدم بدلا منها البرمجية الوسيطة لنتائج الأدوات.

لا يزيل OpenClaw سلوك Plugin الموثق أو يعيد تفسيره في التغيير نفسه
الذي يقدم بديلا. يجب أن تمر تغييرات العقود الكاسرة أولا عبر محول توافق،
وتشخيصات، ووثائق، ونافذة إهمال. ينطبق ذلك على عمليات استيراد SDK،
وحقول البيان، وواجهات API للإعداد، والخطافات، وسلوك التسجيل في وقت التشغيل.

<Warning>
  ستُزال طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  ستتعطل plugins التي لا تزال تستورد من هذه الأسطح عندما يحدث ذلك.
  لم تعد تسجيلات مصانع Plugin المضمنة المخصصة لـ Pi فقط تُحمّل بالفعل.
</Warning>

## لماذا تغير هذا

تسبب النهج القديم في مشكلات:

- **بطء بدء التشغيل** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** — جعلت إعادة التصدير الواسعة إنشاء دورات استيراد أمرا سهلا
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي الصادرات مستقرة وأيها داخلية

يعالج SDK الحديث لـ Plugin هذا: كل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذات غرض واضح وعقد موثق.

أزيلت أيضا منافذ الراحة القديمة للمزود لقنوات الحزمة.
كانت منافذ المساعدة ذات علامات القنوات اختصارات خاصة بالمستودع الأحادي، وليست
عقود Plugin مستقرة. استخدم بدلا منها مسارات SDK الفرعية العامة والضيقة. داخل مساحة عمل
Plugin المضمنة، أبقِ المساعدات المملوكة للمزود داخل `api.ts` أو
`runtime-api.ts` الخاصين بذلك Plugin.

أمثلة المزودين المضمنين الحالية:

- يحتفظ Anthropic بمساعدات التدفق الخاصة بـ Claude في منفذ `api.ts` /
  `contract-api.ts` الخاص به
- يحتفظ OpenAI ببناة المزود، ومساعدات النموذج الافتراضي، وبناة مزود الوقت الحقيقي
  في `api.ts` الخاص به
- يحتفظ OpenRouter بباني المزود ومساعدات التهيئة/الإعداد في
  `api.ts` الخاص به

## سياسة التوافق

بالنسبة إلى plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

1. إضافة العقد الجديد
2. إبقاء السلوك القديم موصولا عبر محول توافق
3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
4. تغطية كلا المسارين في الاختبارات
5. توثيق الإهمال ومسار الترحيل
6. الإزالة فقط بعد نافذة الترحيل المعلنة، عادة في إصدار رئيسي

يمكن للمشرفين تدقيق قائمة انتظار الترحيل الحالية باستخدام
`pnpm plugins:boundary-report`. استخدم `pnpm plugins:boundary-report:summary` للحصول على
أعداد مختصرة، و`--owner <id>` لـ Plugin واحد أو مالك توافق واحد، و
`pnpm plugins:boundary-report:ci` عندما يجب أن تفشل بوابة CI بسبب سجلات توافق مستحقة،
أو عمليات استيراد SDK محجوزة عابرة للمالكين، أو مسارات SDK فرعية محجوزة غير مستخدمة.
يجمع التقرير سجلات التوافق المهملة حسب تاريخ الإزالة، ويحصي مراجع
الكود/الوثائق المحلية، ويظهر عمليات استيراد SDK المحجوزة العابرة للمالكين،
ويلخص جسر SDK الخاص بمضيف الذاكرة بحيث يظل تنظيف التوافق صريحا بدلا من
الاعتماد على عمليات بحث مرتجلة. يجب أن تكون للمسارات الفرعية المحجوزة في SDK
استخدامات مالك متتبعة؛ وينبغي إزالة صادرات المساعدات المحجوزة غير المستخدمة من SDK العام.

إذا كان حقل بيان ما لا يزال مقبولا، فيمكن لمؤلفي Plugin الاستمرار في استخدامه إلى أن
تقول الوثائق والتشخيصات خلاف ذلك. ينبغي للكود الجديد تفضيل البديل الموثق،
لكن يجب ألا تتعطل plugins الحالية أثناء الإصدارات الثانوية العادية.

## كيفية الترحيل

<Steps>
  <Step title="ترحيل مساعدات تحميل/كتابة إعدادات وقت التشغيل">
    يجب أن تتوقف plugins المضمنة عن استدعاء
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` مباشرة. فضّل الإعدادات التي
    مُررت بالفعل إلى مسار الاستدعاء النشط. يمكن للمعالجات طويلة العمر التي تحتاج إلى
    لقطة العملية الحالية استخدام `api.runtime.config.current()`. يجب أن تستخدم
    أدوات الوكيل طويلة العمر `ctx.getRuntimeConfig()` من سياق الأداة داخل
    `execute` حتى تظل الأداة التي أُنشئت قبل كتابة الإعدادات ترى إعدادات وقت التشغيل
    المحدثة.

    يجب أن تمر كتابات الإعدادات عبر المساعدات التعاملية وأن تختار سياسة
    ما بعد الكتابة:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    استخدم `afterWrite: { mode: "restart", reason: "..." }` عندما يعرف المستدعي أن
    التغيير يتطلب إعادة تشغيل Gateway نظيفة، و
    `afterWrite: { mode: "none", reason: "..." }` فقط عندما يملك المستدعي
    المتابعة ويريد عمدا كتم مخطط إعادة التحميل.
    تتضمن نتائج التحوير ملخص `followUp` ذا نوع محدد للاختبارات والتسجيل؛
    ويظل Gateway مسؤولا عن تطبيق إعادة التشغيل أو جدولتها.
    يظل `loadConfig` و`writeConfigFile` مساعدي توافق مهملين
    للـ plugins الخارجية أثناء نافذة الترحيل، ويحذران مرة واحدة باستخدام
    رمز التوافق `runtime-config-load-write`. plugins المضمنة وكود وقت التشغيل في المستودع
    محميان بحواجز الماسح في
    `pnpm check:deprecated-internal-config-api` و
    `pnpm check:no-runtime-action-load-config`: يفشل استخدام Plugin الإنتاجي الجديد
    مباشرة، وتفشل كتابات الإعدادات المباشرة، ويجب أن تستخدم طرق خادم Gateway
    لقطة وقت التشغيل الخاصة بالطلب، ويجب أن تتلقى مساعدات الإرسال/الإجراء/العميل لقناة وقت التشغيل
    الإعدادات من حدودها، ولا يسمح للوحدات طويلة العمر في وقت التشغيل بأي
    استدعاءات محيطة لـ `loadConfig()`.

    يجب أن يتجنب كود Plugin الجديد أيضا استيراد تجميعة التوافق الواسعة
    `openclaw/plugin-sdk/config-runtime`. استخدم مسار SDK الفرعي الضيق الذي يطابق المهمة:

    | الحاجة | الاستيراد |
    | --- | --- |
    | أنواع الإعدادات مثل `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | تأكيدات الإعدادات المحملة مسبقا والبحث عن إعدادات مدخل Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | قراءات لقطة وقت التشغيل الحالية | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | كتابات الإعدادات | `openclaw/plugin-sdk/config-mutation` |
    | مساعدات مخزن الجلسات | `openclaw/plugin-sdk/session-store-runtime` |
    | إعدادات جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | مساعدات وقت التشغيل لسياسة المجموعة | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل إدخال السر | `openclaw/plugin-sdk/secret-input-runtime` |
    | تجاوزات النموذج/الجلسة | `openclaw/plugin-sdk/model-session-runtime` |

    plugins المضمنة واختباراتها محمية بالماسح ضد التجميعة الواسعة
    كي تبقى عمليات الاستيراد والمحاكاة محلية للسلوك الذي تحتاجه. لا تزال التجميعة الواسعة
    موجودة للتوافق الخارجي، لكن يجب ألا يعتمد عليها الكود الجديد.

  </Step>

  <Step title="ترحيل إضافات نتائج أدوات Pi إلى برمجية وسيطة">
    يجب على plugins المضمنة استبدال معالجات نتائج الأدوات
    `api.registerEmbeddedExtensionFactory(...)` المخصصة لـ Pi فقط
    ببرمجية وسيطة محايدة لوقت التشغيل.

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

    لا يمكن للـ plugins الخارجية تسجيل برمجية وسيطة لنتائج الأدوات لأنها تستطيع
    إعادة كتابة مخرجات أدوات عالية الثقة قبل أن يراها النموذج.

  </Step>

  <Step title="ترحيل المعالجات الأصلية للموافقات إلى حقائق القدرات">
    تعرض plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` إضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصين بالموافقة من توصيل `plugin.auth` /
      `plugin.approvals` القديمين إلى `approvalCapability`
    - أُزيل `ChannelPlugin.approvals` من عقد channel-plugin العام؛
      انقل حقول التسليم/الأصلي/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل دخول/خروج القناة فقط؛ لم تعد الخطافات الخاصة بمصادقة الموافقة
      هناك تُقرأ بواسطة core
    - سجل كائنات وقت التشغيل المملوكة للقناة مثل العملاء، أو الرموز، أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة لـ Plugin من معالجات الموافقة الأصلية؛
      أصبح core يملك إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفر سطح
      `createPluginRuntime().channel` حقيقيا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على تخطيط قدرة الموافقة الحالي.

  </Step>

  <Step title="تدقيق سلوك الرجوع الاحتياطي لغلاف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`، فإن أغلفة Windows
    `.cmd`/`.bat` غير المحلولة تفشل الآن بإغلاق آمن ما لم تمرر صراحة
    `allowShellFallback: true`.

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

    إذا لم يكن المستدعي يعتمد عمدا على رجوع shell الاحتياطي، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المرمى بدلا من ذلك.

  </Step>

  <Step title="العثور على عمليات الاستيراد المهملة">
    ابحث في Plugin الخاص بك عن عمليات استيراد من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدالها بعمليات استيراد مركزة">
    كل تصدير من السطح القديم يقابله مسار استيراد حديث محدد:

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

    بالنسبة إلى مساعدات جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلا من الاستيراد
    مباشرة:

    ```typescript
    // قبل (جسر extension-api المهمل)
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

  <Step title="استبدل استيرادات infra-runtime الواسعة">
    ما يزال `openclaw/plugin-sdk/infra-runtime` موجودًا للتوافق الخارجي،
    لكن ينبغي للكود الجديد استيراد سطح المساعدة المحدد الذي يحتاج إليه فعليًا:

    | الحاجة | الاستيراد |
    | --- | --- |
    | مساعدات قائمة انتظار أحداث النظام | `openclaw/plugin-sdk/system-event-runtime` |
    | مساعدات حدث Heartbeat والرؤية | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تفريغ قائمة انتظار التسليم المعلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | قياسات نشاط القناة | `openclaw/plugin-sdk/channel-activity-runtime` |
    | ذاكرات التخزين المؤقت لإزالة التكرار داخل الذاكرة | `openclaw/plugin-sdk/dedupe-runtime` |
    | مساعدات آمنة لمسارات الملفات المحلية/الوسائط | `openclaw/plugin-sdk/file-access-runtime` |
    | جلب مدرك للموزع | `openclaw/plugin-sdk/runtime-fetch` |
    | مساعدات الوكيل والجلب المحروس | `openclaw/plugin-sdk/fetch-runtime` |
    | أنواع سياسة موزع SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | أنواع طلب/حل الموافقة | `openclaw/plugin-sdk/approval-runtime` |
    | مساعدات حمولة رد الموافقة والأوامر | `openclaw/plugin-sdk/approval-reply-runtime` |
    | مساعدات تنسيق الأخطاء | `openclaw/plugin-sdk/error-runtime` |
    | انتظار جاهزية النقل | `openclaw/plugin-sdk/transport-ready-runtime` |
    | مساعدات الرموز الآمنة | `openclaw/plugin-sdk/secure-random-runtime` |
    | تزامن المهام غير المتزامنة المحدود | `openclaw/plugin-sdk/concurrency-runtime` |
    | الإكراه الرقمي | `openclaw/plugin-sdk/number-runtime` |
    | قفل غير متزامن محلي للعملية | `openclaw/plugin-sdk/async-lock-runtime` |
    | أقفال الملفات | `openclaw/plugin-sdk/file-lock` |

    تتم حماية Plugins المجمعة بالماسح ضد `infra-runtime`، لذلك لا يمكن لكود المستودع أن يتراجع إلى البرميل الواسع.

  </Step>

  <Step title="رحّل مساعدات مسارات القنوات">
    ينبغي لكود مسار القناة الجديد استخدام `openclaw/plugin-sdk/channel-route`.
    تبقى أسماء route-key و comparable-target الأقدم كأسماء مستعارة للتوافق
    أثناء نافذة الترحيل، لكن ينبغي للـ Plugins الجديدة استخدام أسماء المسارات
    التي تصف السلوك مباشرة:

    | المساعد القديم | المساعد الحديث |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    تطبع مساعدات المسارات الحديثة `{ channel, to, accountId, threadId }`
    بشكل متسق عبر الموافقات الأصلية، وكبت الردود، وإزالة تكرار الوارد،
    وتسليم Cron، وتوجيه الجلسات. إذا كان Plugin الخاص بك يملك قواعد هدف
    مخصصة، فاستخدم `resolveChannelRouteTargetWithParser(...)` لتكييف ذلك
    المحلل مع عقد هدف المسار نفسه.

  </Step>

  <Step title="ابنِ واختبر">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسار الاستيراد

  <Accordion title="Common import path table">
  | مسار الاستيراد | الغرض | الصادرات الرئيسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد الإدخال القانوني للـ Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير مظلية قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط إعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لمزوّد واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال قنوات مركّزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدو معالج الإعداد المشتركون | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدو وقت تشغيل مرحلة الإعداد | محوّلات تصحيح إعداد آمنة للاستيراد، ومساعدو ملاحظات البحث، `promptResolvedAllowFrom`، `splitSetupEntries`، ووكلاء إعداد مفوّضون |
  | `plugin-sdk/setup-adapter-runtime` | مساعدو محوّل الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدو أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدو الحسابات المتعددة | مساعدو قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدو معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدو البحث عن الحساب | مساعدو البحث عن الحساب والرجوع الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدو حسابات ضيّقو النطاق | مساعدو قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محوّلات معالج الإعداد | `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`، `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`، `createTopLevelChannelDmPolicy`، `setSetupChannelEnabled`، `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | أساسيات إقران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد، والكتابة، وتسليم المصدر | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | مصانع محوّلات الإعدادات ومساعدو وصول الرسائل المباشرة | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | بناة مخططات الإعدادات | أساسيات مخطط إعدادات القناة المشتركة والباني العام فقط |
  | `plugin-sdk/bundled-channel-config-schema` | مخططات إعدادات مجمعة | Plugins المجمعة التي يصونها OpenClaw فقط؛ يجب أن تعرّف Plugins الجديدة مخططات محلية للـ Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | مخططات إعدادات مجمعة مهملة | اسم توافق بديل فقط؛ استخدم `plugin-sdk/bundled-channel-config-schema` للـ Plugins المجمعة التي تتم صيانتها |
  | `plugin-sdk/telegram-command-config` | مساعدو إعدادات أوامر Telegram | تطبيع أسماء الأوامر، وتشذيب الأوصاف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدو حالة الحساب ودورة حياة تدفق المسودات | `createAccountStatusSink`، ومساعدو إنهاء معاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدو الغلاف الوارد | مساعدو المسار المشترك وباني الغلاف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدو الرد الوارد | مساعدو التسجيل والإرسال المشتركون |
  | `plugin-sdk/messaging-targets` | تحليل هدف المراسلة | مساعدو تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدو الوسائط الصادرة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-send-deps` | مساعدو اعتماديات الإرسال الصادر | بحث خفيف الوزن عن `resolveOutboundSendDep` دون استيراد وقت التشغيل الصادر الكامل |
  | `plugin-sdk/outbound-runtime` | مساعدو وقت التشغيل الصادر | مساعدو التسليم الصادر، ومفوّض الهوية/الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدو ربط السلاسل | مساعدو دورة حياة ربط السلاسل والمحوّلات |
  | `plugin-sdk/agent-media-payload` | مساعدو حمولات الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin دائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدو وقت تشغيل واسعو النطاق | مساعدو وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدو بيئة وقت تشغيل ضيّقو النطاق | مساعدو المسجّل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدو وقت تشغيل Plugin المشتركون | مساعدو أوامر/خطافات/http/تفاعلية للـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدو خط أنابيب الخطافات | مساعدو خط أنابيب Webhook/الخطافات الداخلية المشتركون |
  | `plugin-sdk/lazy-runtime` | مساعدو وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدو العمليات | مساعدو التنفيذ المشتركون |
  | `plugin-sdk/cli-runtime` | مساعدو وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدو الإصدارات |
  | `plugin-sdk/gateway-runtime` | مساعدو Gateway | عميل Gateway، ومساعد بدء جاهز لحلقة الأحداث، ومساعدو تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | طبقة توافق إعدادات مهملة | فضّل `config-types`، و`plugin-config-runtime`، و`runtime-config-snapshot`، و`config-mutation` |
  | `plugin-sdk/telegram-command-config` | مساعدو أوامر Telegram | مساعدو تحقق من أوامر Telegram مستقرون عند الرجوع عندما لا يكون سطح عقد Telegram المجمّع متاحًا |
  | `plugin-sdk/approval-runtime` | مساعدو مطالبة الموافقة | حمولة موافقة التنفيذ/Plugin، ومساعدو قدرة/ملف تعريف الموافقة، ومساعدو توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار عرض الموافقة المهيكل |
  | `plugin-sdk/approval-auth-runtime` | مساعدو مصادقة الموافقة | حل الموافق، ومصادقة الإجراء في المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدو عميل الموافقة | مساعدو ملف تعريف/عامل تصفية موافقة التنفيذ الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدو تسليم الموافقة | محوّلات قدرة/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدو Gateway للموافقة | مساعد مشترك لحل Gateway الموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدو محوّل الموافقة | مساعدو تحميل محوّل الموافقة الأصلية خفيفو الوزن لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدو معالج الموافقة | مساعدو وقت تشغيل أوسع لمعالج الموافقة؛ فضّل حدود المحوّل/Gateway الأضيق عندما تكفي |
  | `plugin-sdk/approval-native-runtime` | مساعدو هدف الموافقة | مساعدو ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدو رد الموافقة | مساعدو حمولة رد موافقة التنفيذ/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدو سياق وقت تشغيل القناة | مساعدو تسجيل/جلب/مراقبة سياق وقت تشغيل القنوات العام |
  | `plugin-sdk/security-runtime` | مساعدو الأمان | مساعدو الثقة المشتركون، وبوابة الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدو سياسة SSRF | مساعدو قائمة السماح للمضيفين وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدو وقت تشغيل SSRF | المرسل المثبت، والجلب المحروس، ومساعدو سياسة SSRF |
  | `plugin-sdk/system-event-runtime` | مساعدو أحداث النظام | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | مساعدو Heartbeat | مساعدو أحداث Heartbeat والظهور |
  | `plugin-sdk/delivery-queue-runtime` | مساعدو طابور التسليم | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | مساعدو نشاط القناة | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | مساعدو إزالة التكرار | ذاكرات تخزين مؤقت لإزالة التكرار داخل الذاكرة |
  | `plugin-sdk/file-access-runtime` | مساعدو الوصول إلى الملفات | مساعدو مسارات الملفات/الوسائط المحلية الآمنة |
  | `plugin-sdk/transport-ready-runtime` | مساعدو جاهزية النقل | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | مساعدو التخزين المؤقت المحدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدو بوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدو تنسيق الأخطاء | `formatUncaughtError`، `isApprovalNotFoundError`، ومساعدو رسم الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدو الجلب/الوكيل المغلّف | `resolveFetch`، ومساعدو الوكيل، ومساعدو خيارات EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | مساعدو تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدو إعادة المحاولة | `RetryConfig`، `retryAsync`، ومشغلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | مساعدو بوابة الأوامر وسطح الأوامر | `resolveControlCommandGate`، ومساعدو تفويض المرسل، ومساعدو سجل الأوامر بما في ذلك تنسيق قائمة الوسائط الديناميكية |
  | `plugin-sdk/command-status` | عارضو حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدو إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدو طلبات Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدو حراسة جسم Webhook | مساعدو قراءة/حدود جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقطيع |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدو إرسال الرد ضيّقو النطاق | الإنهاء، وإرسال المزوّد، ومساعدو تسمية المحادثة |
  | `plugin-sdk/reply-history` | مساعدو سجل الردود | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدو مقاطع الرد | مساعدو تقطيع النص/markdown |
  | `plugin-sdk/session-store-runtime` | مساعدو مخزن الجلسات | مساعدو مسار المخزن ووقت آخر تحديث |
  | `plugin-sdk/state-paths` | مساعدو مسارات الحالة | مساعدو مجلدات الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدو التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدو تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدو حالة القناة | بناة ملخص حالة القناة/الحساب، وافتراضات حالة وقت التشغيل، ومساعدو بيانات تعريف المشكلة |
  | `plugin-sdk/target-resolver-runtime` | مساعدو حل الأهداف | مساعدو حل الأهداف المشتركون |
  | `plugin-sdk/string-normalization-runtime` | مساعدو تطبيع السلاسل النصية | مساعدو تطبيع المعرّفات النصية/السلاسل النصية |
  | `plugin-sdk/request-url` | مساعدو عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات تشبه الطلبات |
  | `plugin-sdk/run-command` | مساعدو الأوامر الموقّتة | مشغّل أوامر موقّت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات الأدوات/CLI المشتركة |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتيجة الأداة |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال المعيارية من وسيطات الأداة |
  | `plugin-sdk/temp-path` | مساعدات مسار مؤقت | مساعدات مشتركة لمسار التنزيل المؤقت |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجل النظام الفرعي والتنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جدول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات منسّقة لإعداد موفّر محلي/مستضاف ذاتيًا | مساعدات اكتشاف/تهيئة الموفّر المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركّزة لإعداد موفّر مستضاف ذاتيًا متوافق مع OpenAI | مساعدات اكتشاف/تهيئة الموفّر المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة موفّر وقت التشغيل | مساعدات حل مفاتيح API في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للموفّر | مساعدات الإعداد الأولي/كتابة ملف التعريف لمفتاح API |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة الموفّر | باني نتيجة مصادقة OAuth القياسي |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للموفّر | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار الموفّر | اختيار الموفّر المهيأ أو التلقائي ودمج تهيئة الموفّر الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات بيئة الموفّر | مساعدات البحث عن متغيرات بيئة مصادقة الموفّر |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج الموفّر/إعادة التشغيل | `ProviderReplayFamily` و`buildProviderReplayFamilyHooks` و`normalizeModelCompat` وبناة سياسة إعادة التشغيل المشتركة ومساعدات نقطة نهاية الموفّر ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لفهرس الموفّر | `findCatalogTemplate` و`buildSingleProviderApiKeyCatalog` و`buildManifestModelProviderConfig` و`supportsNativeStreamingUsageCompat` و`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات الإعداد الأولي للموفّر | مساعدات تهيئة الإعداد الأولي |
  | `plugin-sdk/provider-http` | مساعدات HTTP للموفّر | مساعدات HTTP/نقطة نهاية عامة للموفّر، بما في ذلك مساعدات نموذج multipart لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات جلب الويب للموفّر | مساعدات تسجيل/تخزين مؤقت لموفّر جلب الويب |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تهيئة بحث الويب للموفّر | مساعدات ضيقة لتهيئة/اعتماد بحث الويب للموفّرين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد بحث الويب للموفّر | مساعدات ضيقة لعقد تهيئة/اعتماد بحث الويب مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` ومحدّدات/جالبات الاعتمادات ذات النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات بحث الويب للموفّر | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل لموفّر بحث الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أدوات/مخططات الموفّر | `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks` وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام الموفّر | `fetchClaudeUsage` و`fetchGeminiUsage` و`fetchGithubCopilotUsage` ومساعدات أخرى لاستخدام الموفّر |
  | `plugin-sdk/provider-stream` | مساعدات مغلّف دفق الموفّر | `ProviderStreamFamily` و`buildProviderStreamFamilyHooks` و`composeProviderStreamWrappers` وأنواع مغلّف الدفق ومساعدات مغلّف Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot المشتركة |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفّر | مساعدات نقل الموفّر الأصلية مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور غير متزامن مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط، وفحص أبعاد الفيديو المدعوم بـ ffprobe، وبناة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات توليد الوسائط المشتركة | مساعدات الفشل الاحتياطي المشتركة، واختيار المرشحين، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع موفّر فهم الوسائط إلى جانب صادرات مساعدات الصور/الصوت الموجهة للموفّر |
  | `plugin-sdk/text-runtime` | مساعدات النص المشتركة | إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جدول Markdown، ومساعدات التنقيح، ومساعدات وسم التوجيهات، وأدوات النص الآمن، ومساعدات النص/التسجيل ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تجزئة النص | مساعد تجزئة النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع موفّر الكلام إلى جانب مساعدات التوجيه والسجل والتحقق الموجهة للموفّر وباني TTS المتوافق مع OpenAI |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع موفّر الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع الموفّر، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع الموفّر، ومساعدات السجل/الحل، ومساعدات جلسة الجسر |
  | `plugin-sdk/image-generation` | مساعدات توليد الصور | أنواع موفّر توليد الصور إلى جانب مساعدات أصل الصورة/عنوان URL للبيانات وباني موفّر الصور المتوافق مع OpenAI |
  | `plugin-sdk/image-generation-core` | نواة توليد الصور المشتركة | أنواع توليد الصور، والفشل الاحتياطي، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة توليد الموسيقى المشتركة | أنواع توليد الموسيقى، ومساعدات الفشل الاحتياطي، والبحث عن الموفّر، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع موفّر/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة توليد الفيديو المشتركة | أنواع توليد الفيديو، ومساعدات الفشل الاحتياطي، والبحث عن الموفّر، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تهيئة القناة | بدائيات ضيقة لمخطط تهيئة القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تهيئة القناة | مساعدات تفويض كتابة تهيئة القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات لقطة/ملخص حالة القناة المشتركة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تهيئة قائمة السماح | مساعدات تحرير/قراءة تهيئة قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات قرار وصول المجموعة المشتركة |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل المباشرة | مساعدات مصادقة/حراسة الرسائل المباشرة المشتركة |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات مساعد القناة السلبية/الحالة والوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات هدف Webhook | مساعدات سجل أهداف Webhook وتثبيت المسار |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | `zod` معاد تصديره لمستهلكي SDK الخاص بـ Plugin |
  | `plugin-sdk/memory-core` | مساعدات نواة الذاكرة المضمّنة | سطح مساعدات مدير/تهيئة/ملف/CLI الذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك تضمين مضيف الذاكرة | عقود تضمين الذاكرة، والوصول إلى السجل، والموفّر المحلي، ومساعدات الدُفعات/البُعد العامة؛ تعيش الموفّرات البعيدة الملموسة في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك تخزين مضيف الذاكرة | صادرات محرك تخزين مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات مضيف الذاكرة متعدد الوسائط | مساعدات مضيف الذاكرة متعدد الوسائط |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات سر مضيف الذاكرة | مساعدات سر مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات يومية أحداث مضيف الذاكرة | مساعدات يومية أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل نواة مضيف الذاكرة | مساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملف/وقت تشغيل مضيف الذاكرة | مساعدات ملف/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل نواة مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار ليومية أحداث مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات يومية أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار لملف/وقت تشغيل مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات ملف/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات Markdown المُدارة المشتركة للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار لحالة مضيف الذاكرة | اسم مستعار محايد للمورّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/testing` | أدوات الاختبار | برميل توافق واسع قديم؛ فضّل المسارات الفرعية المركّزة للاختبار مثل `plugin-sdk/plugin-test-runtime` و`plugin-sdk/channel-test-helpers` و`plugin-sdk/channel-target-testing` و`plugin-sdk/test-env` و`plugin-sdk/test-fixtures` |
</Accordion>

هذا الجدول هو عمدًا المجموعة الفرعية الشائعة للهجرة، وليس سطح SDK الكامل. القائمة الكاملة التي تضم أكثر من 200 نقطة دخول موجودة في
`scripts/lib/plugin-sdk-entrypoints.json`.

تم إيقاف وصلات المساعدة المحجوزة الخاصة بالـ bundled-plugin من خريطة تصدير SDK العامة، باستثناء واجهات التوافق الموثقة صراحة مثل shim المهمل `plugin-sdk/discord` المحتفَظ به للحزمة المنشورة
`@openclaw/discord@2026.3.13`. تعيش أدوات المساعدة الخاصة بالمالك داخل حزمة plugin المالكة؛ وينبغي أن ينتقل سلوك المضيف المشترك عبر عقود SDK عامة مثل `plugin-sdk/gateway-runtime` و`plugin-sdk/security-runtime` و`plugin-sdk/plugin-config-runtime`.

استخدم أضيق استيراد يطابق المهمة. إذا لم تجد تصديرًا، فتحقق من المصدر في `src/plugin-sdk/` أو اسأل المشرفين أي عقد عام ينبغي أن يملكه.

## الإهمالات النشطة

إهمالات أضيق تنطبق عبر SDK الخاصة بالـ plugin، وعقد المزوّد، وسطح وقت التشغيل، والبيان. لا يزال كل واحد منها يعمل اليوم، لكنه سيُزال في إصدار رئيسي مستقبلي. يربط الإدخال أسفل كل عنصر واجهة API القديمة ببديلها المعتمد.

<AccordionGroup>
  <Accordion title="بُنّاة مساعدة command-auth → command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها، والتصديرات نفسها
    — لكنها تُستورد فقط من المسار الفرعي الأضيق. يعيد `command-auth`
    تصديرها كبدائل توافقية.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="أدوات مساعدة بوابة الإشارات → resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` — يعيد كائن قرار
    واحدًا بدلًا من استدعاءين منفصلين.

    انتقلت plugins القنوات اللاحقة (Slack وDiscord وMatrix وMS Teams) بالفعل.

  </Accordion>

  <Accordion title="shim وقت تشغيل القناة وأدوات مساعدة إجراءات القناة">
    `openclaw/plugin-sdk/channel-runtime` هو shim توافق للـ plugins القنوات الأقدم.
    لا تستورده من كود جديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل كائنات وقت التشغيل.

    أدوات المساعدة `channelActions*` في `openclaw/plugin-sdk/channel-actions` مهملة
    إلى جانب تصديرات القنوات الخام "actions". اعرض القدرات عبر سطح
    `presentation` الدلالي بدلًا من ذلك — تعلن plugins القنوات ما تعرضه
    (بطاقات، أزرار، قوائم اختيار) بدلًا من أسماء الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="أداة المساعدة tool() لمزوّد بحث الويب → createTool() على الـ plugin">
    **القديم**: مصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرة على plugin المزوّد.
    لم يعد OpenClaw يحتاج إلى أداة SDK المساعدة لتسجيل غلاف الأداة.

  </Accordion>

  <Accordion title="مغلفات القنوات النصية الصرفة → BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء مغلف مطالبة نصي صرف ومسطح
    من رسائل القنوات الواردة.

    **الجديد**: `BodyForAgent` مع كتل سياق مستخدم منظمة. ترفق plugins
    القنوات بيانات التوجيه الوصفية (السلسلة، الموضوع، الرد على، التفاعلات)
    كحقول منطّقة بدلًا من ربطها في سلسلة مطالبة. لا يزال مساعد
    `formatAgentEnvelope(...)` مدعومًا للمغلفات المصطنعة المواجهة للمساعد،
    لكن المغلفات النصية الصرفة الواردة في طريقها إلى الإزالة.

    المناطق المتأثرة: `inbound_claim` و`message_received` وأي plugin قناة
    مخصص يعالج نص `channelEnvelope` لاحقًا.

  </Accordion>

  <Accordion title="أنواع اكتشاف المزوّدين → أنواع كتالوج المزوّدين">
    أصبحت أربعة أسماء مستعارة لأنواع الاكتشاف الآن أغلفة رقيقة فوق
    أنواع عصر الكتالوج:

    | الاسم المستعار القديم      | النوع الجديد               |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    بالإضافة إلى كيس `ProviderCapabilities` الثابت القديم — ينبغي أن تستخدم
    plugins المزوّدين hooks صريحة للمزوّد مثل `buildReplayPolicy` و
    `normalizeToolSchemas` و`wrapStreamFn` بدلًا من كائن ثابت.

  </Accordion>

  <Accordion title="hooks سياسة التفكير → resolveThinkingProfile">
    **القديم** (ثلاثة hooks منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` مع `id` المعتمد، و`label` اختياري، وقائمة مستويات
    مرتبة. يخفض OpenClaw القيم المخزنة القديمة حسب رتبة الملف الشخصي تلقائيًا.

    نفّذ hook واحدًا بدلًا من ثلاثة. تستمر hooks القديمة في العمل أثناء نافذة
    الإهمال لكنها لا تُركّب مع نتيجة الملف الشخصي.

  </Accordion>

  <Accordion title="بديل مزوّد OAuth الخارجي → contracts.externalAuthProviders">
    **القديم**: تنفيذ `resolveExternalOAuthProfiles(...)` دون إعلان المزوّد في
    بيان الـ plugin.

    **الجديد**: أعلن `contracts.externalAuthProviders` في بيان الـ plugin
    **ونفّذ** `resolveExternalAuthProfiles(...)`. يصدر مسار "بديل المصادقة"
    القديم تحذيرًا في وقت التشغيل وسيُزال.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="بحث متغيرات بيئة المزوّد → setup.providers[].envVars">
    **حقل البيان القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس بحث متغيرات البيئة نفسه في `setup.providers[].envVars`
    على البيان. يجمع هذا بيانات بيئة الإعداد/الحالة الوصفية في مكان واحد
    ويتجنب تشغيل وقت تشغيل الـ plugin فقط للإجابة عن عمليات بحث متغيرات البيئة.

    يظل `providerAuthEnvVars` مدعومًا عبر محوّل توافق حتى تُغلق نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل plugin الذاكرة → registerMemoryCapability">
    **القديم**: ثلاثة استدعاءات منفصلة —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الخانات نفسها، واستدعاء تسجيل واحد. لا تتأثر أدوات الذاكرة المساعدة الإضافية
    (`registerMemoryPromptSupplement` و`registerMemoryCorpusSupplement` و
    `registerMemoryEmbeddingProvider`).

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسات الوكلاء الفرعيين">
    لا يزال اسمان مستعاران قديمان للأنواع مُصدّرين من `src/plugins/runtime/types.ts`:

    | القديم                        | الجديد                          |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    أُهملت طريقة وقت التشغيل `readSession` لصالح
    `getSessionMessages`. التوقيع نفسه؛ تستدعي الطريقة القديمة الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **القديم**: كان `runtime.tasks.flow` (بالمفرد) يعيد موصلًا حيًا لتدفق المهام.

    **الجديد**: يحتفظ `runtime.tasks.managedFlows` بوقت تشغيل تعديل TaskFlow
    المُدار للـ plugins التي تنشئ أو تحدّث أو تلغي أو تشغّل مهامًا فرعية من
    تدفق. استخدم `runtime.tasks.flows` عندما يحتاج الـ plugin فقط إلى قراءات
    قائمة على DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الامتدادات المضمّنة → وسيط نتائج أدوات الوكيل">
    مغطى في "كيفية الهجرة → ترحيل امتدادات نتائج أدوات Pi إلى الوسيط" أعلاه.
    أُدرج هنا للاكتمال: استُبدل مسار Pi فقط المحذوف
    `api.registerEmbeddedExtensionFactory(...)` بـ
    `api.registerAgentToolResultMiddleware(...)` مع قائمة وقت تشغيل صريحة في
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم المستعار OpenClawSchemaType → OpenClawConfig">
    أصبح `OpenClawSchemaType` المعاد تصديره من `openclaw/plugin-sdk` اسمًا
    مستعارًا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم المعتمد.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتبع الإهمالات على مستوى الامتداد (داخل plugins القنوات/المزوّدين المضمّنة تحت
`extensions/`) داخل واجهاتها الجامعة `api.ts` و`runtime-api.ts`.
إنها لا تؤثر في عقود plugins الجهات الخارجية وليست مذكورة هنا. إذا كنت تستهلك
واجهة جامعة محلية لـ plugin مضمّن مباشرة، فاقرأ تعليقات الإهمال في تلك الواجهة
قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| الوقت                  | ما يحدث                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**               | تصدر الأسطح المهملة تحذيرات وقت التشغيل                                  |
| **الإصدار الرئيسي القادم** | ستُزال الأسطح المهملة؛ وستفشل plugins التي لا تزال تستخدمها              |

تم ترحيل جميع plugins الأساسية بالفعل. ينبغي أن تهاجر plugins الخارجية قبل
الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

عيّن متغيرات البيئة هذه أثناء العمل على الهجرة:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلًا دائمًا.

## ذات صلة

- [بدء الاستخدام](/ar/plugins/building-plugins) — أنشئ أول plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لاستيرادات المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء plugins المزوّدين
- [داخليات Plugin](/ar/plugins/architecture) — تعمق في البنية
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
