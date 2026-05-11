---
read_when:
    - تريد استخدام حزمة اختبار خادم التطبيق المضمّنة في Codex
    - تحتاج إلى أمثلة تكوين حاضنة Codex
    - تريد أن تفشل عمليات النشر المخصصة لـ Codex فقط بدلًا من الرجوع إلى PI
summary: شغّل جولات الوكيل المضمّن في OpenClaw عبر إطار تشغيل app-server المرفق مع Codex
title: إطار تشغيل Codex
x-i18n:
    generated_at: "2026-05-11T20:37:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

يتيح Plugin `codex` المضمّن لـ OpenClaw تشغيل دورات وكيل OpenAI المضمّنة
عبر خادم تطبيق Codex بدلا من مسخّر PI المدمج.

استخدم مسخّر Codex عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى:
استئناف الخيط الأصلي، متابعة الأدوات الأصلية، Compaction الأصلية، وتنفيذ
خادم التطبيق. يظل OpenClaw مسؤولا عن قنوات الدردشة، وملفات الجلسات، واختيار
النموذج، وأدوات OpenClaw الديناميكية، والموافقات، وتسليم الوسائط، ونسخة
النص الظاهرة.

يستخدم الإعداد العادي مراجع نماذج OpenAI القياسية مثل `openai/gpt-5.5`.
لا تضبط مراجع نماذج `openai-codex/gpt-*`. ضع ترتيب مصادقة وكيل OpenAI
تحت `auth.order.openai`؛ وتظل ملفات التعريف الأقدم `openai-codex:*` وإدخالات
`auth.order.openai-codex` مدعومة للتثبيتات الحالية.

يبدأ OpenClaw خيوط خادم تطبيق Codex مع وضع الكود الأصلي في Codex وتفعيل
وضع الكود فقط. يحافظ ذلك على أدوات OpenClaw الديناميكية المؤجلة/القابلة
للبحث داخل تنفيذ الكود وسطح البحث عن الأدوات الخاصين بـ Codex، بدلا من إضافة
مغلف بحث عن الأدوات بأسلوب PI فوق Codex.

للفصل الأوسع بين النموذج/المزوّد/وقت التشغيل، ابدأ من
[أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو وقت التشغيل، وتظل Telegram،
أو Discord، أو Slack، أو قناة أخرى هي سطح التواصل.

## المتطلبات

- OpenClaw مع Plugin `codex` المضمّن متاح.
- إذا كان ضبطك يستخدم `plugins.allow`، فأدرج `codex`.
- خادم تطبيق Codex بالإصدار `0.125.0` أو أحدث. يدير Plugin المضمّن ثنائية
  خادم تطبيق Codex متوافقة افتراضيا، لذا لا تؤثر أوامر `codex` المحلية على
  `PATH` في بدء تشغيل المسخّر العادي.
- مصادقة Codex متاحة عبر `openclaw models auth login --provider openai-codex`،
  أو حساب خادم تطبيق في موطن Codex الخاص بالوكيل، أو ملف تعريف مصادقة Codex
  صريح بمفتاح API.

لأسبقية المصادقة، وعزل البيئة، وأوامر خادم التطبيق المخصصة، واكتشاف النماذج،
وجميع حقول الضبط، راجع
[مرجع مسخّر Codex](/ar/plugins/codex-harness-reference).

## البدء السريع

معظم المستخدمين الذين يريدون Codex في OpenClaw يريدون هذا المسار: سجّل الدخول
باشتراك ChatGPT/Codex، وفعّل Plugin `codex` المضمّن، واستخدم مرجع نموذج
`openai/gpt-*` قياسيا.

سجّل الدخول باستخدام OAuth الخاص بـ Codex:

```bash
openclaw models auth login --provider openai-codex
```

فعّل Plugin `codex` المضمّن واختر نموذج وكيل OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

إذا كان ضبطك يستخدم `plugins.allow`، فأضف `codex` هناك أيضا:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

أعد تشغيل Gateway بعد تغيير ضبط Plugin. إذا كانت محادثة قائمة لديها جلسة
بالفعل، فاستخدم `/new` أو `/reset` قبل اختبار تغييرات وقت التشغيل كي يحل
الدور التالي المسخّر من الضبط الحالي.

## الضبط

ضبط البدء السريع هو الحد الأدنى القابل للتشغيل لضبط مسخّر Codex. عيّن خيارات
مسخّر Codex في ضبط OpenClaw، واستخدم CLI فقط لمصادقة Codex:

| الحاجة | ما تضبطه | المكان |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| تفعيل المسخّر | `plugins.entries.codex.enabled: true` | ضبط OpenClaw |
| إبقاء تثبيت Plugin ضمن قائمة السماح | أدرج `codex` في `plugins.allow` | ضبط OpenClaw |
| توجيه دورات وكيل OpenAI عبر Codex | `agents.defaults.model` أو `agents.list[].model` كـ `openai/gpt-*` | ضبط وكيل OpenClaw |
| تسجيل الدخول باستخدام OAuth الخاص بـ Codex | `openclaw models auth login --provider openai-codex` | ملف تعريف مصادقة CLI |
| إضافة نسخة احتياطية بمفتاح API لتشغيلات Codex | ملف تعريف مفتاح API `openai:*` مدرج بعد مصادقة الاشتراك في `auth.order.openai` | ملف تعريف مصادقة CLI + ضبط OpenClaw |
| الإخفاق المغلق عندما لا يكون Codex متاحا | `agentRuntime.id: "codex"` للمزوّد أو النموذج | ضبط نموذج/مزوّد OpenClaw |
| استخدام حركة OpenAI API المباشرة | `agentRuntime.id: "pi"` للمزوّد أو النموذج مع مصادقة OpenAI العادية | ضبط نموذج/مزوّد OpenClaw |
| ضبط سلوك خادم التطبيق | `plugins.entries.codex.config.appServer.*` | ضبط Plugin Codex |
| تفعيل تطبيقات Plugin الأصلية في Codex | `plugins.entries.codex.config.codexPlugins.*` | ضبط Plugin Codex |
| تفعيل استخدام الكمبيوتر في Codex | `plugins.entries.codex.config.computerUse.*` | ضبط Plugin Codex |

استخدم مراجع نماذج `openai/gpt-*` لدورات وكيل OpenAI المدعومة بـ Codex. فضّل
`auth.order.openai` لترتيب أولوية الاشتراك ثم النسخ الاحتياطي بمفتاح API.
تظل ملفات تعريف المصادقة الحالية `openai-codex:*` و`auth.order.openai-codex`
صالحة، لكن لا تكتب مراجع نماذج `openai-codex/gpt-*` جديدة.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

بهذا الشكل، يظل كلا ملفي التعريف يعملان عبر Codex لدورات وكيل
`openai/gpt-*`. مفتاح API هو بديل مصادقة فقط، وليس طلبا للتحويل إلى PI أو
OpenAI Responses عادي.

يغطي باقي هذه الصفحة المتغيرات الشائعة التي يجب على المستخدمين الاختيار
بينها: شكل النشر، والتوجيه بإخفاق مغلق، وسياسة موافقة الحارس، وPlugins
Codex الأصلية، واستخدام الكمبيوتر. للحصول على قوائم الخيارات الكاملة،
والافتراضيات، والتعدادات، والاكتشاف، وعزل البيئة، والمهلات، وحقول نقل خادم
التطبيق، راجع
[مرجع مسخّر Codex](/ar/plugins/codex-harness-reference).

## التحقق من وقت تشغيل Codex

استخدم `/status` في الدردشة التي تتوقع فيها Codex. تعرض دورة وكيل OpenAI
المدعومة بـ Codex:

```text
Runtime: OpenAI Codex
```

ثم تحقق من حالة خادم تطبيق Codex:

```text
/codex status
/codex models
```

يبلّغ `/codex status` عن اتصال خادم التطبيق، والحساب، وحدود المعدل، وخوادم
MCP، وSkills. يسرد `/codex models` كتالوج خادم تطبيق Codex الحي للمسخّر
والحساب. إذا كان `/status` مفاجئا، فراجع
[استكشاف الأخطاء وإصلاحها](#troubleshooting).

## التوجيه واختيار النموذج

أبق مراجع المزوّد وسياسة وقت التشغيل منفصلين:

- استخدم `openai/gpt-*` لدورات وكيل OpenAI عبر Codex.
- لا تستخدم `openai-codex/gpt-*` في الضبط. شغّل `openclaw doctor --fix` لإصلاح
  المراجع القديمة ودبابيس مسارات الجلسات البالية.
- `agentRuntime.id: "codex"` اختياري للوضع التلقائي العادي في OpenAI، لكنه
  مفيد عندما يجب أن يفشل النشر بشكل مغلق إذا لم يكن Codex متاحا.
- `agentRuntime.id: "pi"` يوجّه مزوّدا أو نموذجا إلى سلوك PI المباشر عندما
  يكون ذلك مقصودا.
- يتحكم `/codex ...` في محادثات خادم تطبيق Codex الأصلية من الدردشة.
- ACP/acpx مسار مسخّر خارجي منفصل. استخدمه فقط عندما يطلب المستخدم ACP/acpx
  أو مهايئ مسخّر خارجي.

توجيه الأوامر الشائع:

| نية المستخدم | استخدم |
| ------------------------------- | --------------------------------------- |
| إرفاق الدردشة الحالية | `/codex bind [--cwd <path>]` |
| استئناف خيط Codex قائم | `/codex resume <thread-id>` |
| سرد خيوط Codex أو ترشيحها | `/codex threads [filter]` |
| إرسال ملاحظات Codex فقط | `/codex diagnostics [note]` |
| بدء مهمة ACP/acpx | أوامر جلسات ACP/acpx، وليس `/codex` |

| حالة الاستخدام | اضبط | تحقق | ملاحظات |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex أصلي | `openai/gpt-*` مع تفعيل Plugin `codex` | يعرض `/status` القيمة `Runtime: OpenAI Codex` | المسار الموصى به |
| الإخفاق المغلق إذا كان Codex غير متاح | `agentRuntime.id: "codex"` للمزوّد أو النموذج | يفشل الدور بدلا من الرجوع إلى PI | استخدمه لنشرات Codex فقط |
| حركة مفتاح OpenAI API المباشرة عبر PI | `agentRuntime.id: "pi"` للمزوّد أو النموذج ومصادقة OpenAI عادية | يعرض `/status` وقت تشغيل PI | استخدمه فقط عندما يكون PI مقصودا |
| ضبط قديم | `openai-codex/gpt-*` | يعيد `openclaw doctor --fix` كتابته | لا تكتب ضبطا جديدا بهذه الطريقة |
| مهايئ ACP/acpx الخاص بـ Codex | ACP `sessions_spawn({ runtime: "acp" })` | حالة مهمة/جلسة ACP | منفصل عن مسخّر Codex الأصلي |

يتبع `agents.defaults.imageModel` نفس فصل البادئات. استخدم `openai/gpt-*`
للمسار العادي في OpenAI و`codex/gpt-*` فقط عندما يجب أن يجري فهم الصور عبر
دورة خادم تطبيق Codex محدودة. لا تستخدم `openai-codex/gpt-*`؛ يعيد doctor
كتابة تلك البادئة القديمة إلى `openai/gpt-*`.

## أنماط النشر

### نشر Codex الأساسي

استخدم ضبط البدء السريع عندما يجب أن تستخدم كل دورات وكيل OpenAI Codex
افتراضيا.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### نشر بمزوّدين مختلطين

يحافظ هذا الشكل على Claude كوكيل افتراضي ويضيف وكيل Codex مسمى:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

مع هذا الضبط، يستخدم الوكيل `main` مسار مزوّده العادي ويستخدم الوكيل `codex`
خادم تطبيق Codex.

### نشر Codex بإخفاق مغلق

بالنسبة إلى دورات وكيل OpenAI، يحل `openai/gpt-*` بالفعل إلى Codex عندما يكون
Plugin المضمّن متاحا. أضف سياسة وقت تشغيل صريحة عندما تريد قاعدة إخفاق مغلق
مكتوبة:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

عند فرض Codex، يفشل OpenClaw مبكرا إذا كان Plugin Codex معطلا، أو كان خادم
التطبيق قديما جدا، أو تعذر بدء خادم التطبيق.

## سياسة خادم التطبيق

افتراضيا، يبدأ Plugin ثنائية Codex المُدارة من OpenClaw محليا باستخدام نقل
stdio. اضبط `appServer.command` فقط عندما تريد عمدا تشغيل ملف تنفيذي مختلف.
استخدم نقل WebSocket فقط عندما يكون خادم تطبيق يعمل بالفعل في مكان آخر:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

تتخذ جلسات خادم التطبيقات المحلية عبر stdio افتراضيا وضعية المشغل المحلي الموثوق:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. إذا كانت متطلبات Codex المحلية لا تسمح
بوضعية YOLO الضمنية هذه، يختار OpenClaw أذونات الحارس المسموح بها بدلا من ذلك.
عندما يكون صندوق رمل OpenClaw نشطا للجلسة، يضيّق OpenClaw نطاق Codex
`danger-full-access` إلى Codex `workspace-write` بحيث تبقى دورات نمط الشيفرة الأصلية في Codex
داخل مساحة العمل المعزولة بصندوق الرمل.

استخدم وضع الحارس عندما تريد مراجعة Codex الأصلية التلقائية قبل الخروج من صندوق الرمل
أو الحصول على أذونات إضافية:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

يتوسع وضع الحارس إلى موافقات خادم تطبيقات Codex، وعادة تكون
`approvalPolicy: "on-request"`، و`approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` عندما تسمح المتطلبات المحلية بهذه القيم.

للاطلاع على كل حقل في خادم التطبيقات، وترتيب المصادقة، وعزل البيئة، والاكتشاف،
وسلوك المهلة، راجع [مرجع حاضنة Codex](/ar/plugins/codex-harness-reference).

## الأوامر والتشخيصات

يسجل Plugin المضمّن `/codex` كأمر شرطة مائلة على أي قناة
تدعم أوامر OpenClaw النصية.

الأشكال الشائعة:

- يتحقق `/codex status` من اتصال خادم التطبيقات، والنماذج، والحساب، وحدود المعدل،
  وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج خادم تطبيقات Codex الحية.
- يسرد `/codex threads [filter]` سلاسل خادم تطبيقات Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية
  بسلسلة Codex موجودة.
- يطلب `/codex compact` من خادم تطبيقات Codex إجراء Compaction للسلسلة المرتبطة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرتبطة.
- يسأل `/codex diagnostics [note]` قبل إرسال ملاحظات Codex للسلسلة
  المرتبطة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خوادم MCP في خادم تطبيقات Codex.
- يسرد `/codex skills` Skills خادم تطبيقات Codex.

في معظم تقارير الدعم، ابدأ بـ `/diagnostics [note]` في المحادثة
التي حدث فيها الخلل. ينشئ ذلك تقرير تشخيصات Gateway واحدا، وبالنسبة إلى جلسات
حاضنة Codex، يطلب الموافقة لإرسال حزمة ملاحظات Codex ذات الصلة.
راجع [تصدير التشخيصات](/ar/gateway/diagnostics) لمعرفة نموذج الخصوصية وسلوك
دردشة المجموعات.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدا رفع ملاحظات Codex
للسلسلة المرتبطة حاليا دون حزمة تشخيصات Gateway الكاملة.

### فحص سلاسل Codex محليا

غالبا ما تكون أسرع طريقة لفحص تشغيل Codex سيئ هي فتح سلسلة Codex الأصلية
مباشرة:

```bash
codex resume <thread-id>
```

احصل على معرف السلسلة من رد `/diagnostics` المكتمل، أو `/codex binding`، أو
`/codex threads [filter]`.

لآليات الرفع وحدود التشخيصات على مستوى وقت التشغيل، راجع
[وقت تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime#codex-feedback-upload).

تُختار المصادقة بهذا الترتيب:

1. ملفات تعريف مصادقة OpenAI المرتبة للوكيل، ويفضل أن تكون تحت
   `auth.order.openai`. تظل معرفات ملفات التعريف الحالية `openai-codex:*` صالحة.
2. الحساب الموجود لخادم التطبيقات في منزل Codex الخاص بذلك الوكيل.
3. لعمليات تشغيل خادم التطبيقات المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيقات موجود وتظل مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية التي يتم إنشاؤها. هذا
يبقي مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
دون جعل دورات خادم تطبيقات Codex الأصلية تُحتسب عبر API بالخطأ.
تستخدم ملفات تعريف مفاتيح API الصريحة في Codex والرجوع الاحتياطي إلى مفاتيح البيئة عبر stdio المحلي
تسجيل دخول خادم التطبيقات بدلا من وراثة بيئة العملية الفرعية. لا تتلقى اتصالات
خادم التطبيقات عبر WebSocket رجوعا احتياطيا لمفاتيح API البيئية من Gateway؛ استخدم ملف تعريف مصادقة صريحا أو
حساب خادم التطبيقات البعيد نفسه.

إذا بلغ ملف تعريف اشتراك حد استخدام Codex، يسجل OpenClaw وقت إعادة التعيين
عندما يبلّغ Codex عنه، ويحاول ملف تعريف المصادقة المرتب التالي لتشغيل Codex نفسه.
عندما يمر وقت إعادة التعيين، يصبح ملف تعريف الاشتراك مؤهلا مرة أخرى
دون تغيير نموذج `openai/gpt-*` المحدد أو وقت تشغيل Codex.

إذا احتاج نشر ما إلى عزل بيئة إضافي، فأضف تلك المتغيرات إلى
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

يؤثر `appServer.clearEnv` فقط في عملية خادم تطبيقات Codex الفرعية التي يتم إنشاؤها.

تستخدم أدوات Codex الديناميكية افتراضيا تحميل `searchable`. لا يكشف OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex: `read`، و`write`،
و`edit`، و`apply_patch`، و`exec`، و`process`، و`update_plan`. تظل أدوات تكامل OpenClaw
المتبقية مثل المراسلة، والجلسات، والوسائط، وCron، والمتصفح، والعُقد،
وGateway، و`heartbeat_respond`، و`web_search` متاحة عبر بحث أدوات Codex
ضمن مساحة الاسم `openclaw`، مما يبقي سياق النموذج الأولي
أصغر.
تبقى `sessions_yield` وردود المصدر الخاصة بأدوات الرسائل فقط مباشرة لأن هذه
عقود تحكم في الدورة. تخبر تعليمات تعاون Heartbeat Codex بأن
يبحث عن `heartbeat_respond` قبل إنهاء دورة Heartbeat عندما لا تكون الأداة
محملة بالفعل.

عيّن `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيقات Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة، أو عند تصحيح حمولة
الأدوات الكاملة.

حقول Codex Plugin العليا المدعومة:

| الحقل                      | الافتراضي        | المعنى                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي. |
| `codexDynamicToolsExclude` | `[]`           | أسماء أدوات OpenClaw الديناميكية الإضافية التي يجب حذفها من دورات خادم تطبيقات Codex.              |
| `codexPlugins`             | معطل       | دعم Plugin/التطبيق الأصلي في Codex للإضافات المنسقة المثبتة من المصدر التي تم ترحيلها.           |

حقول `appServer` المدعومة:

| الحقل                         | الافتراضي                                                | المعنى                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | يطلق `"stdio"` عملية Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                                |
| `command`                     | ملف Codex التنفيذي المُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف التنفيذي المُدار؛ ولا تضبطه إلا لتجاوز صريح.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | الوسائط الخاصة بنقل stdio.                                                                                                                                                                                                          |
| `url`                         | غير مضبوط                                                  | عنوان URL لخادم التطبيقات عبر WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | غير مضبوط                                                  | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | ترويسات WebSocket إضافية.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | أسماء متغيرات البيئة الإضافية التي تُزال من عملية خادم التطبيقات عبر stdio بعد أن يبني OpenClaw بيئته الموروثة. `CODEX_HOME` و`HOME` محجوزان لعزل Codex لكل وكيل في OpenClaw عند عمليات التشغيل المحلية.    |
| `requestTimeoutMs`            | `60000`                                                | مهلة استدعاءات مستوى التحكم في خادم التطبيقات.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | نافذة هدوء بعد طلب خادم تطبيقات Codex محدد بدورة بينما ينتظر OpenClaw ‏`turn/completed`. ارفع هذه القيمة لمراحل التخليق البطيئة بعد الأدوات أو المعتمدة على الحالة فقط.                                                                     |
| `mode`                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو التنفيذ المراجع بواسطة الحارس. تجعل متطلبات stdio المحلية التي تحذف `danger-full-access`، أو موافقة `never`، أو المراجع `user` الحارس هو الافتراضي الضمني.                                                   |
| `approvalPolicy`              | `"never"` أو سياسة موافقة حارس مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء/استئناف/دورة السلسلة. تفضل إعدادات الحارس الافتراضية `"on-request"` عندما يكون مسموحا بها.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` أو صندوق رمل حارس مسموح به  | وضع صندوق رمل Codex الأصلي المرسل إلى بدء/استئناف السلسلة. تفضل إعدادات الحارس الافتراضية `"workspace-write"` عندما يكون مسموحا بها، وإلا `"read-only"`. عندما يكون صندوق رمل OpenClaw نشطا، يُضيَّق `danger-full-access` إلى `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` أو مراجع حارس مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحا، وإلا `guardian_subagent` أو `user`. يظل `guardian_subagent` اسما مستعارا قديما.                                                                      |
| `serviceTier`                 | غير مضبوط                                                  | طبقة خدمة خادم تطبيقات Codex الاختيارية. تمكّن `"priority"` توجيه الوضع السريع، وتطلب `"flex"` معالجة مرنة، ويمحو `null` التجاوز، وتُقبل `"fast"` القديمة كـ `"priority"`.                                         |

تكون استدعاءات الأدوات الديناميكية المملوكة من OpenClaw محدودة بشكل مستقل عن
`appServer.requestTimeoutMs`: تستخدم طلبات Codex `item/tool/call` حارس مراقبة من
OpenClaw مدته 30 ثانية افتراضياً. تؤدي وسيطة `timeoutMs` الموجبة لكل استدعاء
إلى إطالة أو تقصير ميزانية تلك الأداة المحددة. تستخدم أداة `image_generate`
أيضاً `agents.defaults.imageGenerationModel.timeoutMs` عندما لا يوفر استدعاء الأداة
مهلة خاصة به، وتستخدم أداة فهم الوسائط `image`
`tools.media.image.timeoutSeconds` أو القيمة الافتراضية للوسائط البالغة 60 ثانية.
تُحدَّد ميزانيات الأدوات الديناميكية بسقف قدره 600000 ms. عند انتهاء المهلة،
يلغي OpenClaw إشارة الأداة حيث يكون ذلك مدعوماً، ويعيد استجابة أداة ديناميكية فاشلة
إلى Codex حتى يمكن للدورة أن تستمر بدلاً من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب خادم تطبيق ذي نطاق دورة من Codex، يتوقع الحاضن
أيضاً أن ينهي Codex الدورة الأصلية باستخدام `turn/completed`. إذا صمت
خادم التطبيق لمدة `appServer.turnCompletionIdleTimeoutMs` بعد تلك الاستجابة،
يقاطع OpenClaw دورة Codex بأفضل جهد ممكن، ويسجل مهلة تشخيصية، ويحرر مسار جلسة
OpenClaw حتى لا تُحجز رسائل الدردشة اللاحقة خلف دورة أصلية قديمة. أي إشعار غير
نهائي للدورة نفسها، بما في ذلك `rawResponseItem/completed`، يعطل حارس المراقبة
القصير هذا لأن Codex أثبت أن الدورة ما زالت حية؛ ويواصل حارس المراقبة النهائي
الأطول حماية الدورات العالقة فعلاً. تتضمن تشخيصات المهلة آخر طريقة إشعار من
خادم التطبيق، وبالنسبة لعناصر استجابة المساعد الخام، نوع العنصر، والدور، والمعرف،
ومعاينة محدودة لنص المساعد.

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الثنائي المدار عندما يكون
`appServer.command` غير معيّن.

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلاً منه، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل
التكوين لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في الملف المراجع
نفسه مع بقية إعداد حاضن Codex.

## Plugins Codex الأصلية

يستخدم دعم Plugins Codex الأصلية قدرات التطبيق وPlugin الخاصة بخادم تطبيق
Codex ضمن سلسلة Codex نفسها مثل دورة حاضن OpenClaw. لا يترجم OpenClaw
Plugins Codex إلى أدوات ديناميكية اصطناعية من OpenClaw باسم `codex_plugin_*`.

لا يؤثر `codexPlugins` إلا في الجلسات التي تختار حاضن Codex الأصلي. وليس له
أي تأثير في تشغيلات PI، أو تشغيلات مزود OpenAI العادية، أو ارتباطات محادثات
ACP، أو الحواضن الأخرى.

الحد الأدنى من التكوين المرحّل:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

يُحسب تكوين تطبيق السلسلة عندما ينشئ OpenClaw جلسة حاضن Codex أو يستبدل
ارتباط سلسلة Codex قديم. ولا يُعاد حسابه في كل دورة. بعد تغيير
`codexPlugins`، استخدم `/new` أو `/reset` أو أعد تشغيل Gateway حتى تبدأ
جلسات حاضن Codex المستقبلية بمجموعة التطبيقات المحدّثة.

لأهلية الترحيل، ومخزون التطبيقات، وسياسة الإجراءات التدميرية، والاستدعاءات،
وتشخيصات Plugin الأصلية، راجع
[Plugins Codex الأصلية](/ar/plugins/codex-native-plugins).

## استخدام الكمبيوتر

تتم تغطية استخدام الكمبيوتر في دليل الإعداد الخاص به:
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ إجراءات سطح المكتب
بنفسه. بل يجهز خادم تطبيق Codex، ويتحقق من توفر خادم MCP `computer-use`،
ثم يترك Codex يمتلك استدعاءات أدوات MCP الأصلية أثناء دورات وضع Codex.

## حدود وقت التشغيل

يغيّر حاضن Codex منفذ الوكيل المضمّن منخفض المستوى فقط.

- الأدوات الديناميكية من OpenClaw مدعومة. يطلب Codex من OpenClaw تنفيذ تلك
  الأدوات، لذلك يبقى OpenClaw ضمن مسار التنفيذ.
- أدوات shell، وpatch، وMCP، وأدوات التطبيقات الأصلية الخاصة بـ Codex مملوكة
  من Codex. يستطيع OpenClaw مراقبة أحداث أصلية محددة أو حظرها عبر المرحّل
  المدعوم، لكنه لا يعيد كتابة وسيطات الأدوات الأصلية.
- يمتلك Codex عملية Compaction الأصلية. يحتفظ OpenClaw بمرآة للنص الحواري
  من أجل سجل القنوات، والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج
  أو الحاضن.
- يستمر توليد الوسائط، وفهم الوسائط، وTTS، والموافقات، ومخرجات أدوات المراسلة
  عبر إعدادات مزود/نموذج OpenClaw المطابقة.
- ينطبق `tool_result_persist` على نتائج أدوات النص الحواري المملوكة من
  OpenClaw، وليس على سجلات نتائج أدوات Codex الأصلية.

لطبقات الخطافات، والأسطح المدعومة في V1، ومعالجة الأذونات الأصلية، وتوجيه
قوائم الانتظار، وآليات رفع ملاحظات Codex، وتفاصيل Compaction، راجع
[وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime).

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كمزود `/model` عادي:** هذا متوقع للتكوينات الجديدة. اختر
نموذج `openai/gpt-*`، وفعّل `plugins.entries.codex.enabled`، وتحقق مما إذا
كان `plugins.allow` يستبعد `codex`.

**يستخدم OpenClaw PI بدلاً من Codex:** تأكد من أن مرجع النموذج هو
`openai/gpt-*` على مزود OpenAI الرسمي، وأن Plugin Codex مثبّت ومفعّل. إذا
كنت تحتاج إلى إثبات صارم أثناء الاختبار، فعيّن `agentRuntime.id: "codex"`
على مستوى المزود أو النموذج. يفشل وقت تشغيل Codex المفروض بدلاً من الرجوع
إلى PI.

**لا يزال تكوين `openai-codex/*` القديم موجوداً:** شغّل `openclaw doctor --fix`.
يعيد Doctor كتابة مراجع النماذج القديمة إلى `openai/*`، ويزيل دبابيس وقت
التشغيل القديمة على مستوى الجلسة والوكيل الكامل، ويحافظ على تجاوزات ملفات
المصادقة الحالية.

**يُرفض خادم التطبيق:** استخدم خادم تطبيق Codex `0.125.0` أو أحدث. تُرفض
الإصدارات التمهيدية من الإصدار نفسه أو الإصدارات ذات لواحق البناء مثل
`0.125.0-alpha.2` أو `0.125.0+custom` لأن OpenClaw يختبر حد بروتوكول
`0.125.0` المستقر الأدنى.

**يتعذر على `/codex status` الاتصال:** تحقق من أن Plugin `codex` المضمّن
مفعّل، وأن `plugins.allow` يتضمنه عند تكوين قائمة سماح، وأن أي
`appServer.command` أو `url` أو `authToken` أو ترويسات مخصصة صالحة.

**اكتشاف النماذج بطيء:** خفّض
`plugins.entries.codex.config.discovery.timeoutMs` أو عطّل الاكتشاف. راجع
[مرجع حاضن Codex](/ar/plugins/codex-harness-reference#model-discovery).

**يفشل نقل WebSocket فوراً:** تحقق من `appServer.url`، و`authToken`،
والترويسات، وأن خادم التطبيق البعيد يتحدث إصدار بروتوكول خادم تطبيق Codex
نفسه.

**يستخدم نموذج غير Codex PI:** هذا متوقع ما لم توجّهه سياسة وقت تشغيل المزود
أو النموذج إلى حاضن آخر. تبقى مراجع مزودي غير OpenAI العادية على مسار
مزودها الطبيعي في وضع `auto`.

**استخدام الكمبيوتر مثبّت لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر
ذلك، فأعد تشغيل Gateway لمسح تسجيلات الخطافات الأصلية القديمة. راجع
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use#troubleshooting).

## ذو صلة

- [مرجع حاضن Codex](/ar/plugins/codex-harness-reference)
- [وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime)
- [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins)
- [استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use)
- [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مزود OpenAI](/ar/providers/openai)
- [Plugins حاضن الوكيل](/ar/plugins/sdk-agent-harness)
- [خطافات Plugin](/ar/plugins/hooks)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الحالة](/ar/cli/status)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
