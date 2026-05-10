---
read_when:
    - تريد استخدام حزمة تشغيل app-server المضمّنة لتطبيق Codex
    - تحتاج إلى أمثلة تكوين إطار تشغيل Codex
    - تريد أن تفشل عمليات النشر المقتصرة على Codex بدلاً من الرجوع إلى PI
summary: شغّل أدوار الوكيل المضمّن في OpenClaw عبر بيئة تشغيل app-server المرفقة من Codex
title: إطار تشغيل Codex
x-i18n:
    generated_at: "2026-05-10T19:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

يتيح Plugin `codex` المضمن لـ OpenClaw تشغيل دورات وكلاء OpenAI المضمنة
عبر خادم تطبيق Codex بدلا من حزمة PI المدمجة.

استخدم حزمة Codex عندما تريد أن يمتلك Codex جلسة الوكيل منخفضة المستوى:
استئناف السلاسل الأصلي، ومتابعة الأدوات الأصلية، وCompaction الأصلي، وتنفيذ
خادم التطبيق. يظل OpenClaw مسؤولا عن قنوات الدردشة، وملفات الجلسات، واختيار
النموذج، وأدوات OpenClaw الديناميكية، والموافقات، وتسليم الوسائط، ومرآة
النص الظاهرة.

يستخدم الإعداد العادي مراجع نماذج OpenAI القياسية مثل `openai/gpt-5.5`.
لا تضبط مراجع نماذج `openai-codex/gpt-*`. إن `openai-codex` هو موفر ملف
تعريف المصادقة لملفات تعريف Codex OAuth أو مفاتيح Codex API، وليس بادئة
موفر النموذج لإعداد الوكيل الجديد.

للاطلاع على الفصل الأوسع بين النموذج/الموفر/بيئة التشغيل، ابدأ بـ
[بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو بيئة التشغيل، وتظل Telegram
أو Discord أو Slack أو قناة أخرى هي سطح الاتصال.

## المتطلبات

- OpenClaw مع توفر Plugin `codex` المضمن.
- إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex`.
- خادم تطبيق Codex بالإصدار `0.125.0` أو أحدث. يدير Plugin المضمن ملفا تنفيذيا
  متوافقا لخادم تطبيق Codex افتراضيا، لذلك لا تؤثر أوامر `codex` المحلية في
  `PATH` على بدء تشغيل الحزمة العادي.
- توفر مصادقة Codex عبر `openclaw models auth login --provider openai-codex`،
  أو حساب خادم تطبيق في مجلد Codex الرئيسي للوكيل، أو ملف تعريف مصادقة صريح
  بمفتاح Codex API.

لأسبقية المصادقة، وعزل البيئة، وأوامر خادم التطبيق المخصصة، واكتشاف النماذج،
وجميع حقول الإعداد، راجع
[مرجع حزمة Codex](/ar/plugins/codex-harness-reference).

## البدء السريع

يريد معظم المستخدمين الذين يريدون Codex في OpenClaw هذا المسار: تسجيل الدخول
باشتراك ChatGPT/Codex، وتمكين Plugin `codex` المضمن، واستخدام مرجع نموذج
`openai/gpt-*` قياسي.

سجل الدخول باستخدام Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

مكّن Plugin `codex` المضمن واختر نموذج وكيل OpenAI:

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

إذا كان إعدادك يستخدم `plugins.allow`، فأضف `codex` هناك أيضا:

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

أعد تشغيل Gateway بعد تغيير إعداد Plugin. إذا كانت دردشة موجودة لديها جلسة
بالفعل، فاستخدم `/new` أو `/reset` قبل اختبار تغييرات بيئة التشغيل حتى تحل
الدورة التالية الحزمة من الإعداد الحالي.

## الإعداد

إعداد البدء السريع هو أدنى إعداد صالح لحزمة Codex. اضبط خيارات حزمة Codex
في إعداد OpenClaw، واستخدم CLI فقط لمصادقة Codex:

| الحاجة                                | اضبط                                                               | المكان                         |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| تمكين الحزمة                           | `plugins.entries.codex.enabled: true`                              | إعداد OpenClaw                 |
| الاحتفاظ بتثبيت Plugin في قائمة السماح | أدرج `codex` في `plugins.allow`                                    | إعداد OpenClaw                 |
| توجيه دورات وكلاء OpenAI عبر Codex     | `agents.defaults.model` أو `agents.list[].model` كـ `openai/gpt-*` | إعداد وكيل OpenClaw            |
| تسجيل الدخول باستخدام Codex OAuth      | `openclaw models auth login --provider openai-codex`               | ملف تعريف مصادقة CLI           |
| الفشل المغلق عند عدم توفر Codex        | `agentRuntime.id: "codex"` للموفر أو النموذج                       | إعداد نموذج/موفر OpenClaw      |
| استخدام حركة OpenAI API مباشرة         | `agentRuntime.id: "pi"` للموفر أو النموذج مع مصادقة OpenAI العادية | إعداد نموذج/موفر OpenClaw      |
| ضبط سلوك خادم التطبيق                  | `plugins.entries.codex.config.appServer.*`                         | إعداد Plugin Codex             |
| تمكين تطبيقات Plugin Codex الأصلية     | `plugins.entries.codex.config.codexPlugins.*`                      | إعداد Plugin Codex             |
| تمكين استخدام الحاسوب في Codex         | `plugins.entries.codex.config.computerUse.*`                       | إعداد Plugin Codex             |

استخدم مراجع نماذج `openai/gpt-*` لدورات وكلاء OpenAI المدعومة بـ Codex.
`openai-codex` هو فقط اسم موفر ملف تعريف المصادقة لـ Codex OAuth وملفات
تعريف مفاتيح Codex API. لا تكتب مراجع نماذج `openai-codex/gpt-*` جديدة.

يغطي باقي هذه الصفحة المتغيرات الشائعة التي يجب على المستخدمين الاختيار بينها:
شكل النشر، والتوجيه ذي الفشل المغلق، وسياسة موافقة الحارس، وPlugins Codex
الأصلية، واستخدام الحاسوب. لقوائم الخيارات الكاملة، والقيم الافتراضية، والتعدادات،
والاكتشاف، وعزل البيئة، والمهلات، وحقول نقل خادم التطبيق، راجع
[مرجع حزمة Codex](/ar/plugins/codex-harness-reference).

## التحقق من بيئة تشغيل Codex

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

يعرض `/codex status` اتصال خادم التطبيق، والحساب، وحدود المعدل، وخوادم MCP،
وSkills. يسرد `/codex models` كتالوج خادم تطبيق Codex الحي للحزمة والحساب.
إذا كان `/status` غير متوقع، فراجع [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## التوجيه واختيار النموذج

أبق مراجع الموفر وسياسة بيئة التشغيل منفصلة:

- استخدم `openai/gpt-*` لدورات وكلاء OpenAI عبر Codex.
- لا تستخدم `openai-codex/gpt-*` في الإعداد. شغل `openclaw doctor --fix`
  لإصلاح المراجع القديمة ودبابيس مسار الجلسات الراكدة.
- `agentRuntime.id: "codex"` اختياري لوضع OpenAI التلقائي العادي، لكنه مفيد
  عندما يجب أن يفشل النشر بشكل مغلق إذا لم يكن Codex متاحا.
- `agentRuntime.id: "pi"` يختار سلوك PI المباشر لموفر أو نموذج عندما يكون
  ذلك مقصودا.
- يتحكم `/codex ...` في محادثات خادم تطبيق Codex الأصلية من الدردشة.
- ACP/acpx هو مسار حزمة خارجي منفصل. استخدمه فقط عندما يطلب المستخدم
  ACP/acpx أو محول حزمة خارجي.

توجيه الأوامر الشائعة:

| نية المستخدم                  | استخدم                                  |
| ----------------------------- | --------------------------------------- |
| إرفاق الدردشة الحالية         | `/codex bind [--cwd <path>]`            |
| استئناف سلسلة Codex موجودة    | `/codex resume <thread-id>`             |
| سرد سلاسل Codex أو تصفيتها    | `/codex threads [filter]`               |
| إرسال ملاحظات Codex فقط       | `/codex diagnostics [note]`             |
| بدء مهمة ACP/acpx             | أوامر جلسات ACP/acpx، وليس `/codex`    |

| حالة الاستخدام                                        | اضبط                                                            | تحقق                                   | ملاحظات                         |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراك ChatGPT/Codex مع بيئة تشغيل Codex الأصلية     | `openai/gpt-*` مع تمكين Plugin `codex`                           | يعرض `/status` القيمة `Runtime: OpenAI Codex` | المسار الموصى به              |
| الفشل المغلق إذا لم يكن Codex متاحا                  | `agentRuntime.id: "codex"` للموفر أو النموذج                     | تفشل الدورة بدلا من الرجوع إلى PI      | استخدمه للنشرات الخاصة بـ Codex فقط |
| حركة مفاتيح OpenAI API مباشرة عبر PI                 | `agentRuntime.id: "pi"` للموفر أو النموذج ومصادقة OpenAI العادية | يعرض `/status` بيئة تشغيل PI           | استخدمه فقط عندما يكون PI مقصودا  |
| إعداد قديم                                           | `openai-codex/gpt-*`                                             | يعيد `openclaw doctor --fix` كتابته    | لا تكتب إعدادا جديدا بهذه الطريقة |
| محول ACP/acpx لـ Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                         | حالة مهمة/جلسة ACP                     | منفصل عن حزمة Codex الأصلية       |

يتبع `agents.defaults.imageModel` الفصل نفسه بين البادئات. استخدم `openai/gpt-*`
لمسار OpenAI العادي و`codex/gpt-*` فقط عندما يجب أن يعمل فهم الصور عبر دورة
محدودة في خادم تطبيق Codex. لا تستخدم `openai-codex/gpt-*`؛ يعيد doctor كتابة
تلك البادئة القديمة إلى `openai/gpt-*`.

## أنماط النشر

### نشر Codex الأساسي

استخدم إعداد البدء السريع عندما يجب أن تستخدم جميع دورات وكلاء OpenAI
Codex افتراضيا.

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

### نشر موفر مختلط

يحافظ هذا الشكل على Claude بصفته الوكيل الافتراضي ويضيف وكيلا مسمى لـ Codex:

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

مع هذا الإعداد، يستخدم الوكيل `main` مسار موفره العادي ويستخدم الوكيل
`codex` خادم تطبيق Codex.

### نشر Codex ذي الفشل المغلق

بالنسبة إلى دورات وكلاء OpenAI، يحل `openai/gpt-*` بالفعل إلى Codex عندما
يكون Plugin المضمن متاحا. أضف سياسة بيئة تشغيل صريحة عندما تريد قاعدة
فشل مغلق مكتوبة:

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

عند فرض Codex، يفشل OpenClaw مبكرا إذا كان Plugin Codex معطلا، أو كان
خادم التطبيق قديما جدا، أو تعذر بدء خادم التطبيق.

## سياسة خادم التطبيق

افتراضيا، يبدأ Plugin ملف Codex الثنائي المُدار من OpenClaw محليا باستخدام
نقل stdio. اضبط `appServer.command` فقط عندما تريد عمدا تشغيل ملف تنفيذي
مختلف. استخدم نقل WebSocket فقط عندما يكون خادم التطبيق قيد التشغيل بالفعل
في مكان آخر:

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

تستخدم جلسات خادم تطبيق stdio المحلية افتراضيا وضعية المشغل المحلي الموثوق:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. إذا كانت متطلبات Codex المحلية لا تسمح
بوضعية YOLO الضمنية هذه، يختار OpenClaw أذونات الحارس المسموح بها بدلا من ذلك.

استخدم وضع الحارس عندما تريد مراجعة Codex التلقائية الأصلية قبل الخروج من
الصندوق الرملي أو الأذونات الإضافية:

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

يتوسع وضع الحارس إلى موافقات خادم تطبيق Codex، عادة
`approvalPolicy: "on-request"`، و`approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` عندما تسمح المتطلبات المحلية بهذه القيم.

لكل حقل من حقول خادم التطبيق، وترتيب المصادقة، وعزل البيئة، والاكتشاف، وسلوك
المهلات، راجع [مرجع حزمة Codex](/ar/plugins/codex-harness-reference).

## الأوامر والتشخيصات

يسجل Plugin المضمن `/codex` كأمر شرطة مائلة على أي قناة تدعم أوامر OpenClaw
النصية.

الأشكال الشائعة:

- يتحقق `/codex status` من اتصال خادم التطبيق، والنماذج، والحساب، وحدود المعدل،
  وخوادم MCP، وSkills.
- يعرض `/codex models` نماذج خادم تطبيق Codex الحية.
- يعرض `/codex threads [filter]` سلاسل خادم تطبيق Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة
  Codex موجودة.
- يطلب `/codex compact` من خادم تطبيق Codex ضغط السلسلة المرفقة.
- يبدأ `/codex review` المراجعة الأصلية في Codex للسلسلة المرفقة.
- يطلب `/codex diagnostics [note]` الإذن قبل إرسال ملاحظات Codex للسلسلة
  المرفقة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يعرض `/codex mcp` حالة خادم MCP في خادم تطبيق Codex.
- يعرض `/codex skills` مهارات خادم تطبيق Codex.

لمعظم تقارير الدعم، ابدأ بـ `/diagnostics [note]` في المحادثة التي حدث
فيها الخلل. ينشئ ذلك تقرير تشخيص Gateway واحدا، وبالنسبة إلى جلسات حزمة
Codex، يطلب الموافقة لإرسال حزمة ملاحظات Codex ذات الصلة. راجع
[تصدير التشخيصات](/ar/gateway/diagnostics) لمعرفة نموذج الخصوصية وسلوك
الدردشة الجماعية.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدا رفع ملاحظات Codex
للسلسلة المرفقة حاليا دون حزمة تشخيصات Gateway الكاملة.

### افحص سلاسل Codex محليا

غالبا ما تكون أسرع طريقة لفحص تشغيل Codex سيئ هي فتح سلسلة Codex الأصلية
مباشرة:

```bash
codex resume <thread-id>
```

احصل على معرف السلسلة من رد `/diagnostics` المكتمل، أو `/codex binding`، أو
`/codex threads [filter]`.

لميكانيكيات الرفع وحدود التشخيصات على مستوى وقت التشغيل، راجع
[وقت تشغيل حزمة Codex](/ar/plugins/codex-harness-runtime#codex-feedback-upload).

يتم اختيار المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw Codex صريح للوكيل.
2. حساب خادم التطبيق الموجود في موطن Codex لذلك الوكيل.
3. لعمليات تشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون حساب خادم التطبيق موجودا وتظل مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المنشأة. يحافظ ذلك
على مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
دون جعل دورات خادم تطبيق Codex الأصلية تفوتر عبر API بالخطأ. تستخدم ملفات
تعريف مفتاح API الصريحة في Codex والرجوع المحلي إلى مفتاح البيئة عبر stdio
تسجيل دخول خادم التطبيق بدلا من بيئة العملية الفرعية الموروثة. لا تتلقى
اتصالات خادم التطبيق عبر WebSocket رجوع مفاتيح API البيئية من Gateway؛ استخدم
ملف تعريف مصادقة صريحا أو حساب خادم التطبيق البعيد نفسه.

إذا كان النشر يحتاج إلى عزل بيئة إضافي، فأضف تلك المتغيرات إلى
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

يؤثر `appServer.clearEnv` فقط في عملية خادم تطبيق Codex الفرعية المنشأة.

تستخدم أدوات Codex الديناميكية افتراضيا تحميل `searchable`. لا يعرّض OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex: `read`،
`write`، و`edit`، و`apply_patch`، و`exec`، و`process`، و`update_plan`. تتوفر
أدوات تكامل OpenClaw المتبقية، مثل المراسلة، والجلسات، والوسائط، وcron،
والمتصفح، والعقد، وgateway، و`heartbeat_respond`، و`web_search` من خلال بحث
أدوات Codex ضمن مساحة الأسماء `openclaw`، مما يبقي سياق النموذج الأولي أصغر.
تبقى `sessions_yield` وردود المصدر الخاصة بأدوات الرسائل فقط مباشرة لأن هذه
عقود تحكم في الدور. تطلب تعليمات تعاون Heartbeat من Codex البحث عن
`heartbeat_respond` قبل إنهاء دور heartbeat عندما لا تكون الأداة محملة بالفعل.

عيّن `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة، أو عند تصحيح حمولة
الأدوات الكاملة.

حقول Plugin Codex المدعومة في المستوى الأعلى:

| الحقل                      | الافتراضي        | المعنى                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي. |
| `codexDynamicToolsExclude` | `[]`           | أسماء أدوات OpenClaw ديناميكية إضافية يجب حذفها من أدوار خادم تطبيق Codex.              |
| `codexPlugins`             | معطل       | دعم Plugin/تطبيق Codex الأصلي للـ Plugins المنسقة المثبتة من المصدر بعد ترحيلها.           |

حقول `appServer` المدعومة:

| الحقل                         | الافتراضي                                                | المعنى                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | ينشئ `"stdio"` Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                             |
| `command`                     | ملف Codex الثنائي المدار                                   | الملف التنفيذي لنقل stdio. اتركه غير معين لاستخدام الملف الثنائي المدار؛ عينه فقط لتجاوز صريح.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | الوسيطات لنقل stdio.                                                                                                                                                                                                       |
| `url`                         | غير معين                                                  | عنوان URL لخادم التطبيق عبر WebSocket.                                                                                                                                                                                                            |
| `authToken`                   | غير معين                                                  | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                                   | ترويسات WebSocket إضافية.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تزال من عملية خادم التطبيق عبر stdio المنشأة بعد أن يبني OpenClaw بيئته الموروثة. `CODEX_HOME` و`HOME` محجوزان لعزل Codex لكل وكيل في OpenClaw عند عمليات التشغيل المحلية. |
| `requestTimeoutMs`            | `60000`                                                | المهلة الزمنية لاستدعاءات مستوى التحكم في خادم التطبيق.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | نافذة هدوء بعد طلب خادم تطبيق Codex على نطاق الدور بينما ينتظر OpenClaw `turn/completed`. ارفع هذه القيمة لمراحل التجميع البطيئة بعد الأدوات أو الخاصة بالحالة فقط.                                                                  |
| `mode`                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق للتنفيذ بنمط YOLO أو التنفيذ بمراجعة الحارس. متطلبات stdio المحلية التي تحذف `danger-full-access`، أو موافقة `never`، أو المراجع `user` تجعل الافتراضي الضمني هو الحارس.                                                |
| `approvalPolicy`              | `"never"` أو سياسة موافقة حارس مسموحة       | سياسة موافقة Codex الأصلية المرسلة إلى بدء/استئناف/دور السلسلة. تفضل افتراضيات الحارس `"on-request"` عندما يكون مسموحا.                                                                                                                 |
| `sandbox`                     | `"danger-full-access"` أو صندوق عزل حارس مسموح  | وضع صندوق عزل Codex الأصلي المرسل إلى بدء/استئناف السلسلة. تفضل افتراضيات الحارس `"workspace-write"` عندما يكون مسموحا، وإلا `"read-only"`.                                                                                           |
| `approvalsReviewer`           | `"user"` أو مراجع حارس مسموح               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحا، وإلا `guardian_subagent` أو `user`. يبقى `guardian_subagent` اسما مستعارا قديما.                                                                   |
| `serviceTier`                 | غير معين                                                  | طبقة خدمة اختيارية لخادم تطبيق Codex. تفعّل `"priority"` توجيه الوضع السريع، وتطلب `"flex"` معالجة مرنة، ويمسح `null` التجاوز، ويتم قبول `"fast"` القديم على أنه `"priority"`.                                      |

تكون استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw محدودة بشكل مستقل عن
`appServer.requestTimeoutMs`: تستخدم طلبات Codex `item/tool/call` مراقب OpenClaw
مدته 30 ثانية افتراضيا. تمدد وسيطة `timeoutMs` الموجبة لكل استدعاء أو تقصر
ميزانية تلك الأداة المحددة. تستخدم أداة `image_generate` أيضا
`agents.defaults.imageGenerationModel.timeoutMs` عندما لا يوفر استدعاء الأداة
مهلته الخاصة، وتستخدم أداة فهم الوسائط `image` القيمة
`tools.media.image.timeoutSeconds` أو افتراض الوسائط البالغ 60 ثانية. تحد
ميزانيات الأدوات الديناميكية بسقف 600000 مللي ثانية. عند انتهاء المهلة،
يلغي OpenClaw إشارة الأداة حيثما كان ذلك مدعوما ويعيد استجابة أداة ديناميكية
فاشلة إلى Codex حتى يتمكن الدور من المتابعة بدلا من ترك الجلسة في حالة
`processing`.

بعد أن يستجيب OpenClaw لطلب خادم تطبيق Codex على نطاق الدور، تتوقع الحزمة
أيضا أن ينهي Codex الدور الأصلي بـ `turn/completed`. إذا صمت خادم التطبيق
لمدة `appServer.turnCompletionIdleTimeoutMs` بعد تلك الاستجابة، يقاطع OpenClaw
دور Codex بأفضل جهد، ويسجل مهلة تشخيصية، ويحرر مسار جلسة OpenClaw حتى لا
تصطف رسائل الدردشة اللاحقة خلف دور أصلي عالق. أي إشعار غير نهائي للدور نفسه،
بما في ذلك `rawResponseItem/completed`، يعطل ذلك المراقب القصير لأن Codex أثبت
أن الدور لا يزال حيا؛ ويستمر المراقب النهائي الأطول في حماية الأدوار العالقة
حقا. تتضمن تشخيصات المهلة آخر طريقة إشعار من خادم التطبيق، وبالنسبة إلى
عناصر استجابة المساعد الخام، نوع العنصر، والدور، والمعرف، ومعاينة محدودة لنص
المساعد.

تبقى تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف الثنائي المدار عندما يكون
`appServer.command` غير معين.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` تمت إزالته. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلاً منه، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل
استخدام الإعدادات لعمليات النشر القابلة للتكرار لأنها تُبقي سلوك الإضافة في
الملف نفسه الذي خضع للمراجعة مع بقية إعداد عُدة Codex.

## إضافات Codex الأصلية

يستخدم دعم إضافات Codex الأصلية قدرات التطبيق والإضافة الخاصة بخادم تطبيق
Codex في سلسلة Codex نفسها مثل دورة عُدة OpenClaw. لا يترجم OpenClaw إضافات
Codex إلى أدوات OpenClaw ديناميكية اصطناعية باسم `codex_plugin_*`.

يؤثر `codexPlugins` فقط في الجلسات التي تختار عُدة Codex الأصلية. ولا يؤثر
على تشغيلات PI، أو تشغيلات مزود OpenAI العادية، أو ارتباطات محادثات ACP، أو
العُدد الأخرى.

إعداد مرحَّل بالحد الأدنى:

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

يُحتسب إعداد تطبيق السلسلة عندما ينشئ OpenClaw جلسة عُدة Codex أو يستبدل
ارتباط سلسلة Codex قديمًا. ولا يُعاد احتسابه في كل دورة. بعد تغيير
`codexPlugins`، استخدم `/new` أو `/reset` أو أعد تشغيل Gateway لكي تبدأ جلسات
عُدة Codex المستقبلية بمجموعة التطبيقات المحدّثة.

للاطلاع على أهلية الترحيل، وجرد التطبيقات، وسياسة الإجراءات التدميرية،
والاستدعاءات، وتشخيصات الإضافات الأصلية، راجع
[إضافات Codex الأصلية](/ar/plugins/codex-native-plugins).

## استخدام الحاسوب

يُغطّى استخدام الحاسوب في دليل إعداد مستقل:
[استخدام الحاسوب في Codex](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ إجراءات سطح
المكتب بنفسه. إنه يجهز خادم تطبيق Codex، ويتحقق من توفر خادم MCP
`computer-use`، ثم يترك لـ Codex امتلاك استدعاءات أدوات MCP الأصلية أثناء
دورات وضع Codex.

## حدود وقت التشغيل

تغيّر عُدة Codex منفّذ الوكيل المضمّن منخفض المستوى فقط.

- أدوات OpenClaw الديناميكية مدعومة. يطلب Codex من OpenClaw تنفيذ تلك
  الأدوات، لذلك يبقى OpenClaw ضمن مسار التنفيذ.
- أدوات shell وpatch وMCP والتطبيقات الأصلية الخاصة بـ Codex يملكها Codex.
  يستطيع OpenClaw مراقبة أحداث أصلية محددة أو حظرها عبر relay المدعوم، لكنه
  لا يعيد كتابة معاملات الأدوات الأصلية.
- يملك Codex عملية Compaction الأصلية. يحتفظ OpenClaw بمرآة للنص لأجل سجل
  القناة، والبحث، و`/new`، و`/reset`، والتبديل المستقبلي بين النماذج أو العُدد.
- يستمر توليد الوسائط، وفهم الوسائط، وTTS، والموافقات، ومخرجات أدوات المراسلة
  عبر إعدادات مزود/نموذج OpenClaw المطابقة.
- ينطبق `tool_result_persist` على نتائج أدوات النص التي يملكها OpenClaw، وليس
  على سجلات نتائج أدوات Codex الأصلية.

لطبقات الخطافات، والأسطح V1 المدعومة، ومعالجة الأذونات الأصلية، وتوجيه
الطابور، وآليات رفع ملاحظات Codex، وتفاصيل Compaction، راجع
[وقت تشغيل عُدة Codex](/ar/plugins/codex-harness-runtime).

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كمزود `/model` عادي:** هذا متوقع في الإعدادات الجديدة. اختر
نموذج `openai/gpt-*`، وفعّل `plugins.entries.codex.enabled`، وتحقق مما إذا كان
`plugins.allow` يستبعد `codex`.

**يستخدم OpenClaw ‏PI بدلاً من Codex:** تأكد من أن مرجع النموذج هو
`openai/gpt-*` على مزود OpenAI الرسمي وأن إضافة Codex مثبتة ومفعّلة. إذا كنت
تحتاج إلى إثبات صارم أثناء الاختبار، فعيّن `agentRuntime.id: "codex"` في
المزود أو النموذج. يفشل وقت تشغيل Codex المفروض بدلاً من الرجوع إلى PI.

**ما زال إعداد `openai-codex/*` القديم موجودًا:** شغّل `openclaw doctor --fix`.
يعيد Doctor كتابة مراجع النماذج القديمة إلى `openai/*`، ويزيل دبابيس وقت
التشغيل القديمة الخاصة بالجلسة والوكيل بالكامل، ويحافظ على تجاوزات ملف تعريف
المصادقة الموجودة.

**يتم رفض خادم التطبيق:** استخدم Codex app-server بالإصدار `0.125.0` أو أحدث.
تُرفض الإصدارات التمهيدية ذات الإصدار نفسه أو الإصدارات ذات لاحقة البناء مثل
`0.125.0-alpha.2` أو `0.125.0+custom` لأن OpenClaw يختبر الحد الأدنى لبروتوكول
`0.125.0` المستقر.

**يتعذر على `/codex status` الاتصال:** تحقق من أن إضافة `codex` المضمّنة
مفعّلة، وأن `plugins.allow` يتضمنها عند تكوين قائمة سماح، وأن أي
`appServer.command` أو `url` أو `authToken` أو ترويسات مخصصة صالحة.

**اكتشاف النماذج بطيء:** خفّض
`plugins.entries.codex.config.discovery.timeoutMs` أو عطّل الاكتشاف. راجع
[مرجع عُدة Codex](/ar/plugins/codex-harness-reference#model-discovery).

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url` و`authToken` والترويسات،
ومن أن خادم التطبيق البعيد يتحدث إصدار بروتوكول Codex app-server نفسه.

**يستخدم نموذج غير Codex ‏PI:** هذا متوقع ما لم توجهه سياسة وقت تشغيل المزود
أو النموذج إلى عُدة أخرى. تبقى مراجع مزودي غير OpenAI العادية على مسار مزودها
العادي في وضع `auto`.

**استخدام الحاسوب مثبت لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر ذلك،
فأعد تشغيل Gateway لمسح تسجيلات الخطافات الأصلية القديمة. راجع
[استخدام الحاسوب في Codex](/ar/plugins/codex-computer-use#troubleshooting).

## ذات صلة

- [مرجع عُدة Codex](/ar/plugins/codex-harness-reference)
- [وقت تشغيل عُدة Codex](/ar/plugins/codex-harness-runtime)
- [إضافات Codex الأصلية](/ar/plugins/codex-native-plugins)
- [استخدام الحاسوب في Codex](/ar/plugins/codex-computer-use)
- [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مزود OpenAI](/ar/providers/openai)
- [إضافات عُدة الوكيل](/ar/plugins/sdk-agent-harness)
- [خطافات الإضافات](/ar/plugins/hooks)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الحالة](/ar/cli/status)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
