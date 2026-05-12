---
read_when:
    - تريد استخدام إطار تشغيل خادم التطبيق المضمّن لـ Codex
    - تحتاج إلى أمثلة لتهيئة إطار تشغيل Codex
    - تريد أن تفشل عمليات النشر المقتصرة على Codex بدلًا من الرجوع إلى PI
summary: شغّل دورات وكيل OpenClaw المضمّن عبر إطار خادم التطبيق Codex المرفق
title: بيئة تشغيل Codex
x-i18n:
    generated_at: "2026-05-12T01:00:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

يتيح Plugin المضمّن `codex` لـ OpenClaw تشغيل أدوار وكلاء OpenAI المضمّنة
عبر خادم تطبيق Codex بدلاً من حزمة PI المضمّنة.

استخدم حزمة Codex عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى:
استئناف السلاسل الأصلي، واستمرار الأدوات الأصلي، وCompaction الأصلي، وتنفيذ
خادم التطبيق. يظل OpenClaw مسؤولاً عن قنوات الدردشة، وملفات الجلسات، واختيار
النموذج، وأدوات OpenClaw الديناميكية، والموافقات، وتسليم الوسائط، ومرآة النص
المرئية.

يستخدم الإعداد العادي مراجع نماذج OpenAI القياسية مثل `openai/gpt-5.5`.
لا تضبط مراجع نماذج `openai-codex/gpt-*`. ضع ترتيب مصادقة وكيل OpenAI
تحت `auth.order.openai`؛ تظل ملفات تعريف `openai-codex:*` الأقدم وإدخالات
`auth.order.openai-codex` مدعومة للتثبيتات الحالية.

يبدأ OpenClaw سلاسل خادم تطبيق Codex مع وضع الكود الأصلي في Codex وتمكين
وضع الكود فقط. وهذا يُبقي أدوات OpenClaw الديناميكية المؤجلة/القابلة للبحث
داخل تنفيذ الكود وسطح البحث عن الأدوات الخاصين بـ Codex نفسه بدلاً من إضافة
غلاف بحث عن الأدوات بنمط PI فوق Codex.

للتقسيم الأوسع بين النموذج/المزوّد/بيئة التشغيل، ابدأ بـ
[بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو runtime، وتظل Telegram
أو Discord أو Slack أو قناة أخرى هي سطح الاتصال.

## المتطلبات

- OpenClaw مع Plugin `codex` المضمّن متاح.
- إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex`.
- خادم تطبيق Codex `0.125.0` أو أحدث. يدير Plugin المضمّن ملفاً تنفيذياً
  متوافقاً لخادم تطبيق Codex افتراضياً، لذلك لا تؤثر أوامر `codex` المحلية على
  `PATH` في بدء تشغيل الحزمة العادي.
- مصادقة Codex متاحة عبر `openclaw models auth login --provider openai-codex`،
  أو حساب خادم تطبيق في موطن Codex الخاص بالوكيل، أو ملف تعريف مصادقة صريح
  بمفتاح API لـ Codex.

لأسبقية المصادقة، وعزل البيئة، وأوامر خادم التطبيق المخصصة، واكتشاف النماذج،
وجميع حقول الإعداد، راجع
[مرجع حزمة Codex](/ar/plugins/codex-harness-reference).

## البدء السريع

يريد معظم المستخدمين الذين يريدون Codex في OpenClaw هذا المسار: تسجيل الدخول
باشتراك ChatGPT/Codex، وتمكين Plugin `codex` المضمّن، واستخدام مرجع نموذج
قياسي `openai/gpt-*`.

سجّل الدخول باستخدام Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

مكّن Plugin `codex` المضمّن واختر نموذج وكيل OpenAI:

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

إذا كان إعدادك يستخدم `plugins.allow`، فأضف `codex` هناك أيضاً:

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

أعد تشغيل Gateway بعد تغيير إعداد Plugin. إذا كانت دردشة حالية تملك جلسة
بالفعل، فاستخدم `/new` أو `/reset` قبل اختبار تغييرات runtime حتى يحل الدور
التالي الحزمة من الإعداد الحالي.

## الإعداد

إعداد البدء السريع هو الحد الأدنى القابل للاستخدام لإعداد حزمة Codex. اضبط
خيارات حزمة Codex في إعداد OpenClaw، واستخدم CLI لمصادقة Codex فقط:

| الحاجة                                  | اضبط                                                                            | أين                                |
| --------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| تمكين الحزمة                            | `plugins.entries.codex.enabled: true`                                            | إعداد OpenClaw                     |
| إبقاء تثبيت Plugin ضمن قائمة السماح     | أدرج `codex` في `plugins.allow`                                                  | إعداد OpenClaw                     |
| توجيه أدوار وكيل OpenAI عبر Codex       | `agents.defaults.model` أو `agents.list[].model` بصيغة `openai/gpt-*`            | إعداد وكيل OpenClaw                |
| تسجيل الدخول باستخدام Codex OAuth       | `openclaw models auth login --provider openai-codex`                             | ملف تعريف مصادقة CLI              |
| إضافة نسخة احتياطية بمفتاح API لتشغيل Codex | ملف تعريف مفتاح API `openai:*` مدرج بعد مصادقة الاشتراك في `auth.order.openai` | ملف تعريف مصادقة CLI + إعداد OpenClaw |
| الفشل المغلق عندما لا يكون Codex متاحاً | `agentRuntime.id: "codex"` للمزوّد أو النموذج                                    | إعداد نموذج/مزوّد OpenClaw         |
| استخدام حركة مرور OpenAI API المباشرة  | `agentRuntime.id: "pi"` للمزوّد أو النموذج مع مصادقة OpenAI العادية              | إعداد نموذج/مزوّد OpenClaw         |
| ضبط سلوك خادم التطبيق                   | `plugins.entries.codex.config.appServer.*`                                       | إعداد Plugin Codex                 |
| تمكين تطبيقات Plugin الأصلية في Codex   | `plugins.entries.codex.config.codexPlugins.*`                                    | إعداد Plugin Codex                 |
| تمكين Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | إعداد Plugin Codex                 |

استخدم مراجع نماذج `openai/gpt-*` لأدوار وكلاء OpenAI المدعومة بـ Codex.
فضّل `auth.order.openai` لترتيب الاشتراك أولاً/مفتاح API احتياطياً. تظل ملفات
تعريف مصادقة `openai-codex:*` الحالية و`auth.order.openai-codex` صالحة، لكن
لا تكتب مراجع نماذج `openai-codex/gpt-*` جديدة.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

في هذا الشكل، يظل كلا ملفي التعريف يعملان عبر Codex لأدوار وكلاء
`openai/gpt-*`. مفتاح API هو بديل مصادقة فقط، وليس طلباً للتبديل إلى PI أو
OpenAI Responses عادي.

يغطي باقي هذه الصفحة المتغيرات الشائعة التي يجب على المستخدمين الاختيار بينها:
شكل النشر، والتوجيه بالفشل المغلق، وسياسة موافقة الحارس، وPlugins Codex
الأصلية، وComputer Use. للحصول على قوائم الخيارات الكاملة، والافتراضيات،
والتعدادات، والاكتشاف، وعزل البيئة، والمهلات، وحقول نقل خادم التطبيق، راجع
[مرجع حزمة Codex](/ar/plugins/codex-harness-reference).

## التحقق من runtime Codex

استخدم `/status` في الدردشة التي تتوقع فيها Codex. يعرض دور وكيل OpenAI
المدعوم بـ Codex:

```text
Runtime: OpenAI Codex
```

ثم تحقق من حالة خادم تطبيق Codex:

```text
/codex status
/codex models
```

يعرض `/codex status` اتصال خادم التطبيق، والحساب، وحدود المعدل، وخوادم MCP،
وSkills. يسرد `/codex models` كتالوج خادم تطبيق Codex المباشر للحزمة والحساب.
إذا كان `/status` مفاجئاً، فراجع [استكشاف الأخطاء وإصلاحها](#troubleshooting).

## التوجيه واختيار النموذج

أبقِ مراجع المزوّد وسياسة runtime منفصلتين:

- استخدم `openai/gpt-*` لأدوار وكلاء OpenAI عبر Codex.
- لا تستخدم `openai-codex/gpt-*` في الإعداد. شغّل `openclaw doctor --fix`
  لإصلاح المراجع القديمة ودبابيس مسار الجلسة المتقادمة.
- `agentRuntime.id: "codex"` اختياري في وضع OpenAI التلقائي العادي، لكنه مفيد
  عندما يجب أن يفشل النشر بشكل مغلق إذا لم يكن Codex متاحاً.
- `agentRuntime.id: "pi"` يختار سلوك PI المباشر لمزوّد أو نموذج عندما يكون ذلك
  مقصوداً.
- يتحكم `/codex ...` في محادثات خادم تطبيق Codex الأصلية من الدردشة.
- ACP/acpx هو مسار حزمة خارجي منفصل. استخدمه فقط عندما يطلب المستخدم ACP/acpx
  أو محوّل حزمة خارجي.

توجيه الأوامر الشائعة:

| نية المستخدم                         | استخدم                                  |
| ------------------------------------ | --------------------------------------- |
| إرفاق الدردشة الحالية                | `/codex bind [--cwd <path>]`            |
| استئناف سلسلة Codex موجودة           | `/codex resume <thread-id>`             |
| سرد سلاسل Codex أو ترشيحها           | `/codex threads [filter]`               |
| إرسال ملاحظات Codex فقط              | `/codex diagnostics [note]`             |
| بدء مهمة ACP/acpx                    | أوامر جلسة ACP/acpx، وليس `/codex`     |

| حالة الاستخدام                                      | اضبط                                                            | تحقق                                   | ملاحظات                            |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراك ChatGPT/Codex مع runtime Codex أصلي          | `openai/gpt-*` مع تمكين Plugin `codex`                           | يعرض `/status` قيمة `Runtime: OpenAI Codex` | المسار الموصى به                   |
| الفشل المغلق إذا لم يكن Codex متاحاً                | `agentRuntime.id: "codex"` للمزوّد أو النموذج                    | يفشل الدور بدلاً من الرجوع إلى PI      | استخدمه لنشرات Codex فقط          |
| حركة مرور OpenAI مباشرة بمفتاح API عبر PI           | `agentRuntime.id: "pi"` للمزوّد أو النموذج ومصادقة OpenAI العادية | يعرض `/status` runtime لـ PI           | استخدمه فقط عندما يكون PI مقصوداً |
| إعداد قديم                                          | `openai-codex/gpt-*`                                             | يعيد `openclaw doctor --fix` كتابته    | لا تكتب إعداداً جديداً بهذه الطريقة |
| محوّل Codex لـ ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                         | حالة مهمة/جلسة ACP                     | منفصل عن حزمة Codex الأصلية       |

يتبع `agents.defaults.imageModel` تقسيم البادئات نفسه. استخدم `openai/gpt-*`
للمسار العادي في OpenAI و`codex/gpt-*` فقط عندما يجب أن يعمل فهم الصور عبر دور
محدود في خادم تطبيق Codex. لا تستخدم `openai-codex/gpt-*`؛ يعيد doctor كتابة
تلك البادئة القديمة إلى `openai/gpt-*`.

## أنماط النشر

### نشر Codex الأساسي

استخدم إعداد البدء السريع عندما يجب أن تستخدم جميع أدوار وكلاء OpenAI Codex
افتراضياً.

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

### نشر مزوّد مختلط

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

مع هذا الإعداد، يستخدم وكيل `main` مسار مزوّده العادي ويستخدم وكيل `codex`
خادم تطبيق Codex.

### نشر Codex بالفشل المغلق

بالنسبة إلى أدوار وكلاء OpenAI، يحل `openai/gpt-*` بالفعل إلى Codex عندما يكون
Plugin المضمّن متاحاً. أضف سياسة runtime صريحة عندما تريد قاعدة فشل مغلق
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

مع فرض Codex، يفشل OpenClaw مبكراً إذا كان Plugin Codex معطلاً، أو كان خادم
التطبيق قديماً جداً، أو تعذر بدء خادم التطبيق.

## سياسة خادم التطبيق

افتراضياً، يبدأ Plugin ملف Codex التنفيذي المُدار من OpenClaw محلياً باستخدام
نقل stdio. اضبط `appServer.command` فقط عندما تريد عمداً تشغيل ملف تنفيذي مختلف.
استخدم نقل WebSocket فقط عندما يكون خادم تطبيق قيد التشغيل بالفعل في مكان آخر:

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

تتخذ جلسات خادم التطبيق المحلية عبر stdio افتراضيا وضعية المشغل المحلي الموثوق:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. إذا كانت متطلبات Codex المحلية لا تسمح بهذه
الوضعية الضمنية YOLO، فإن OpenClaw يختار أذونات الحارس المسموح بها بدلا من ذلك.
عندما يكون صندوق رمل OpenClaw نشطا للجلسة، يضيّق OpenClaw إعداد Codex
`danger-full-access` إلى Codex `workspace-write` بحيث تبقى منعطفات وضع الكود
الأصلية في Codex داخل مساحة العمل الموضوعة في صندوق الرمل.

استخدم وضع الحارس عندما تريد مراجعة Codex التلقائية الأصلية قبل الخروج من صندوق الرمل
أو طلب أذونات إضافية:

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

يتوسع وضع الحارس إلى موافقات خادم تطبيق Codex، وعادة تكون
`approvalPolicy: "on-request"`، و`approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` عندما تسمح المتطلبات المحلية بهذه القيم.

لكل حقل من حقول خادم التطبيق، وترتيب المصادقة، وعزل البيئة، والاكتشاف، وسلوك
المهلة، راجع [مرجع عتاد Codex](/ar/plugins/codex-harness-reference).

## الأوامر والتشخيصات

يسجل Plugin المضمن الأمر `/codex` كأمر شرطة مائلة على أي قناة تدعم
أوامر OpenClaw النصية.

الصيغ الشائعة:

- يتحقق `/codex status` من اتصال خادم التطبيق، والنماذج، والحساب، وحدود المعدل،
  وخوادم MCP، وSkills.
- يعرض `/codex models` نماذج خادم تطبيق Codex الحية.
- يعرض `/codex threads [filter]` سلاسل خادم تطبيق Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex
  موجودة.
- يطلب `/codex compact` من خادم تطبيق Codex إجراء Compaction للسلسلة المرفقة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرفقة.
- يستأذن `/codex diagnostics [note]` قبل إرسال ملاحظات Codex للسلسلة
  المرفقة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يعرض `/codex mcp` حالة خوادم MCP في خادم تطبيق Codex.
- يعرض `/codex skills` Skills الخاصة بخادم تطبيق Codex.

في معظم تقارير الدعم، ابدأ بـ `/diagnostics [note]` في المحادثة التي حدث فيها
الخلل. ينشئ ذلك تقرير تشخيصات Gateway واحدا، وبالنسبة إلى جلسات عتاد Codex،
يطلب الموافقة على إرسال حزمة ملاحظات Codex ذات الصلة.
راجع [تصدير التشخيصات](/ar/gateway/diagnostics) لمعرفة نموذج الخصوصية وسلوك
الدردشة الجماعية.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدا رفع ملاحظات Codex
للسلسلة المرفقة حاليا بدون حزمة تشخيصات Gateway الكاملة.

### فحص سلاسل Codex محليا

غالبا ما تكون أسرع طريقة لفحص تشغيل Codex سيئ هي فتح سلسلة Codex الأصلية
مباشرة:

```bash
codex resume <thread-id>
```

احصل على معرّف السلسلة من رد `/diagnostics` المكتمل، أو `/codex binding`، أو
`/codex threads [filter]`.

لميكانيكيات الرفع وحدود التشخيصات على مستوى وقت التشغيل، راجع
[وقت تشغيل عتاد Codex](/ar/plugins/codex-harness-runtime#codex-feedback-upload).

تُختار المصادقة بهذا الترتيب:

1. ملفات تعريف مصادقة OpenAI المرتبة للوكيل، ويفضل أن تكون تحت
   `auth.order.openai`. تظل معرّفات ملفات التعريف الحالية `openai-codex:*` صالحة.
2. حساب خادم التطبيق الموجود في منزل Codex لذلك الوكيل.
3. لعمليات تشغيل خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY` ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيق موجود وتظل مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المنشأة. يحافظ ذلك
على مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
بدون جعل منعطفات خادم تطبيق Codex الأصلية تُحاسب عبر API عن طريق الخطأ.
تستخدم ملفات تعريف مفاتيح API الصريحة لـ Codex واحتياطي مفاتيح البيئة المحلية
عبر stdio تسجيل دخول خادم التطبيق بدلا من بيئة العملية الفرعية الموروثة. لا
تتلقى اتصالات خادم التطبيق عبر WebSocket احتياطي مفاتيح API البيئية من Gateway؛
استخدم ملف تعريف مصادقة صريحا أو حساب خادم التطبيق البعيد نفسه.

إذا بلغ ملف تعريف اشتراك حد استخدام Codex، يسجل OpenClaw وقت إعادة التعيين
عندما يبلّغ Codex عنه، ويحاول ملف تعريف المصادقة المرتب التالي لتشغيل Codex
نفسه. عندما يمر وقت إعادة التعيين، يصبح ملف تعريف الاشتراك مؤهلا مرة أخرى
بدون تغيير نموذج `openai/gpt-*` المحدد أو وقت تشغيل Codex.

إذا احتاج النشر إلى عزل بيئي إضافي، فأضف تلك المتغيرات إلى
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

تُحمّل أدوات Codex الديناميكية افتراضيا بطريقة `searchable`. لا يعرّض OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex: `read`،
و`write`، و`edit`، و`apply_patch`، و`exec`، و`process`، و`update_plan`. تظل
أدوات تكامل OpenClaw المتبقية مثل المراسلة، والجلسات، والوسائط، وcron،
والمتصفح، والعُقد، وgateway، و`heartbeat_respond`، و`web_search` متاحة عبر
بحث أدوات Codex ضمن مساحة الاسم `openclaw`، مما يبقي سياق النموذج الأولي
أصغر.
تبقى `sessions_yield` وردود المصادر الخاصة بأداة الرسائل فقط مباشرة لأن تلك
عقود تحكم في المنعطفات. تخبر تعليمات تعاون Heartbeat Codex بالبحث عن
`heartbeat_respond` قبل إنهاء منعطف Heartbeat عندما لا تكون الأداة محملة
بالفعل.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة أو عند تصحيح حمولة الأداة
الكاملة.

حقول Codex Plugin العليا المدعومة:

| الحقل                      | الافتراضي        | المعنى                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي. |
| `codexDynamicToolsExclude` | `[]`           | أسماء أدوات OpenClaw الديناميكية الإضافية التي يجب حذفها من منعطفات خادم تطبيق Codex.              |
| `codexPlugins`             | معطل       | دعم Codex الأصلي للـ Plugin/التطبيق للمكونات المنتقاة المثبتة من المصدر والمهاجرة.           |

حقول `appServer` المدعومة:

| الحقل                         | الافتراضي                                                | المعنى                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | ينشئ `"stdio"` عملية Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                                |
| `command`                     | ملف Codex التنفيذي المُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف التنفيذي المُدار؛ واضبطه فقط لتجاوز صريح.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | وسائط نقل stdio.                                                                                                                                                                                                          |
| `url`                         | غير مضبوط                                                  | عنوان URL لخادم التطبيق عبر WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | غير مضبوط                                                  | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | ترويسات WebSocket إضافية.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية خادم التطبيق المنشأة عبر stdio بعد أن يبني OpenClaw بيئته الموروثة. `CODEX_HOME` و`HOME` محجوزان لعزل Codex لكل وكيل في OpenClaw عند التشغيل المحلي.    |
| `requestTimeoutMs`            | `60000`                                                | مهلة استدعاءات مستوى التحكم في خادم التطبيق.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | نافذة هدوء بعد طلب خادم تطبيق Codex محدود بمنعطف بينما ينتظر OpenClaw حدث `turn/completed`. زد هذه القيمة لمراحل التركيب البطيئة بعد الأدوات أو ذات الحالة فقط.                                                                     |
| `mode`                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو تنفيذ يخضع لمراجعة الحارس. متطلبات stdio المحلية التي تحذف `danger-full-access`، أو موافقة `never`، أو المراجع `user` تجعل الافتراضي الضمني حارسا.                                                   |
| `approvalPolicy`              | `"never"` أو سياسة موافقة حارس مسموح بها       | سياسة موافقة Codex الأصلية المرسلة عند بدء/استئناف السلسلة/المنعطف. تفضل افتراضات الحارس `"on-request"` عندما يكون مسموحا بها.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` أو صندوق رمل حارس مسموح به  | وضع صندوق رمل Codex الأصلي المرسل عند بدء/استئناف السلسلة. تفضل افتراضات الحارس `"workspace-write"` عندما يكون مسموحا به، وإلا `"read-only"`. عندما يكون صندوق رمل OpenClaw نشطا، يضيّق `danger-full-access` إلى `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` أو مراجع حارس مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحا، وإلا `guardian_subagent` أو `user`. يظل `guardian_subagent` اسما مستعارا قديما.                                                                      |
| `serviceTier`                 | غير مضبوط                                                  | مستوى خدمة خادم تطبيق Codex اختياري. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة مرنة، ويمسح `null` التجاوز، وتُقبل القيمة القديمة `"fast"` كـ `"priority"`.                                         |

تُقيَّد استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw بشكل مستقل عن
`appServer.requestTimeoutMs`: تستخدم طلبات Codex `item/tool/call` مراقب OpenClaw افتراضيًا لمدة 30 ثانية. تؤدي وسيطة `timeoutMs` الإيجابية لكل استدعاء إلى تمديد
أو تقصير ميزانية تلك الأداة المحددة. تستخدم أداة `image_generate` أيضًا
`agents.defaults.imageGenerationModel.timeoutMs` عندما لا يوفر استدعاء الأداة
مهلته الخاصة، وتستخدم أداة `image` لفهم الوسائط
`tools.media.image.timeoutSeconds` أو القيمة الافتراضية للوسائط، وهي 60 ثانية. تُحدَّد
ميزانيات الأدوات الديناميكية بحد أقصى 600000 مللي ثانية. عند انتهاء المهلة، يوقف OpenClaw إشارة الأداة
حيثما كان ذلك مدعومًا ويعيد استجابة أداة ديناميكية فاشلة إلى Codex لكي تتمكن الدورة
من المتابعة بدلًا من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب خادم تطبيق محدد بنطاق دورة Codex، يتوقع الحامل أيضًا
أن يُنهي Codex الدورة الأصلية باستخدام `turn/completed`. إذا صمت
خادم التطبيق لمدة `appServer.turnCompletionIdleTimeoutMs` بعد تلك
الاستجابة، يحاول OpenClaw بأفضل جهد مقاطعة دورة Codex، ويسجل مهلة تشخيصية،
ويحرر مسار جلسة OpenClaw حتى لا تُصف رسائل الدردشة اللاحقة
خلف دورة أصلية قديمة. أي إشعار غير نهائي للدورة نفسها، بما في ذلك
`rawResponseItem/completed`، يعطل هذا المراقب القصير لأن Codex أثبت
أن الدورة ما زالت حية؛ ويواصل المراقب النهائي الأطول حماية الدورات العالقة فعليًا.
تتضمن تشخيصات انتهاء المهلة آخر طريقة إشعار من خادم التطبيق، وبالنسبة لعناصر
استجابة المساعد الأولية، نوع العنصر والدور والمعرّف ومعاينة محدودة لنص المساعد.

تبقى تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الثنائي المُدار عندما يكون
`appServer.command` غير معين.

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل الإعداد
لعمليات النشر القابلة للتكرار لأنه يُبقي سلوك Plugin في الملف نفسه
المُراجع مع بقية إعداد حامل Codex.

## Native Codex plugins

يستخدم دعم Plugin الأصلي في Codex قدرات التطبيق وPlugin الخاصة بخادم تطبيق Codex
ضمن سلسلة Codex نفسها مثل دورة حامل OpenClaw. لا يترجم OpenClaw
Plugins الخاصة بـ Codex إلى أدوات OpenClaw ديناميكية اصطناعية من نوع `codex_plugin_*`.

يؤثر `codexPlugins` فقط في الجلسات التي تختار حامل Codex الأصلي. ولا
يؤثر في تشغيلات PI، أو تشغيلات موفر OpenAI العادية، أو روابط محادثات
ACP، أو الحوامل الأخرى.

الحد الأدنى من الإعداد المُرحَّل:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

يُحسب إعداد تطبيق السلسلة عندما ينشئ OpenClaw جلسة حامل Codex
أو يستبدل رابط سلسلة Codex قديمًا. ولا يُعاد حسابه في كل دورة.
بعد تغيير `codexPlugins`، استخدم `/new` أو `/reset` أو أعد تشغيل Gateway حتى
تبدأ جلسات حامل Codex المستقبلية بمجموعة التطبيقات المحدَّثة.

لأهلية الترحيل، ومخزون التطبيقات، وسياسة الإجراءات التدميرية،
والاستدعاءات، وتشخيصات Plugin الأصلي، راجع
[Native Codex plugins](/ar/plugins/codex-native-plugins).

## Computer Use

تُغطى Computer Use في دليل إعدادها الخاص:
[Codex Computer Use](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ
إجراءات سطح المكتب بنفسه. بل يجهز خادم تطبيق Codex، ويتحقق من توفر خادم
MCP الخاص بـ `computer-use`، ثم يترك لـ Codex امتلاك استدعاءات أداة MCP
الأصلية أثناء دورات وضع Codex.

## حدود وقت التشغيل

يغيّر حامل Codex منفذ العامل المضمن منخفض المستوى فقط.

- أدوات OpenClaw الديناميكية مدعومة. يطلب Codex من OpenClaw تنفيذ تلك
  الأدوات، لذلك يبقى OpenClaw ضمن مسار التنفيذ.
- أدوات shell وpatch وMCP والتطبيق الأصلي الخاصة بـ Codex مملوكة لـ Codex.
  يستطيع OpenClaw مراقبة أحداث أصلية محددة أو حظرها عبر الترحيل المدعوم،
  لكنه لا يعيد كتابة وسيطات الأدوات الأصلية.
- يملك Codex الضغط الأصلي. يحتفظ OpenClaw بنسخة مطابقة من السجل لسجل القنوات،
  والبحث، و`/new`، و`/reset`، والتبديل المستقبلي بين النموذج أو الحامل.
- يستمر توليد الوسائط، وفهم الوسائط، وTTS، والموافقات، ومخرجات أداة المراسلة
  عبر إعدادات موفر/نموذج OpenClaw المطابقة.
- ينطبق `tool_result_persist` على نتائج أدوات السجل المملوكة لـ OpenClaw، وليس
  على سجلات نتائج الأدوات الأصلية لـ Codex.

لطبقات الخطافات، والأسطح المدعومة من V1، ومعالجة الأذونات الأصلية، وتوجيه الصفوف،
وآليات رفع ملاحظات Codex، وتفاصيل Compaction، راجع
[Codex harness runtime](/ar/plugins/codex-harness-runtime).

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كموفر `/model` عادي:** هذا متوقع للإعدادات الجديدة.
اختر نموذج `openai/gpt-*`، وفعّل
`plugins.entries.codex.enabled`، وتحقق مما إذا كان `plugins.allow` يستبعد
`codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** تأكد أن مرجع النموذج هو
`openai/gpt-*` على موفر OpenAI الرسمي وأن Codex plugin
مثبت ومفعّل. إذا كنت تحتاج إلى دليل صارم أثناء الاختبار، فعيّن
`agentRuntime.id: "codex"` على مستوى الموفر أو النموذج. يفشل وقت تشغيل Codex المفروض بدلًا من
الرجوع إلى PI.

**لا يزال إعداد `openai-codex/*` القديم موجودًا:** شغّل `openclaw doctor --fix`.
يعيد Doctor كتابة مراجع النماذج القديمة إلى `openai/*`، ويزيل تثبيتات وقت التشغيل القديمة
للجلسة أو للعامل بالكامل، ويحافظ على تجاوزات ملفات تعريف المصادقة الموجودة.

**يُرفض خادم التطبيق:** استخدم خادم تطبيق Codex بالإصدار `0.125.0` أو أحدث.
تُرفض إصدارات ما قبل الإصدار ذات الإصدار نفسه أو الإصدارات ذات لاحقة البناء مثل
`0.125.0-alpha.2` أو `0.125.0+custom` لأن OpenClaw يختبر
حد بروتوكول `0.125.0` المستقر.

**يتعذر على `/codex status` الاتصال:** تحقق من أن Plugin `codex` المضمّن
مفعّل، وأن `plugins.allow` يتضمنه عندما تكون قائمة السماح مهيأة، وأن أي
`appServer.command` أو `url` أو `authToken` أو ترويسات مخصصة صالحة.

**اكتشاف النماذج بطيء:** خفّض
`plugins.entries.codex.config.discovery.timeoutMs` أو عطّل الاكتشاف. راجع
[Codex harness reference](/ar/plugins/codex-harness-reference#model-discovery).

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url` و`authToken`
والترويسات، وأن خادم التطبيق البعيد يتحدث إصدار بروتوكول خادم تطبيق Codex نفسه.

**يستخدم نموذج غير Codex ‏PI:** هذا متوقع ما لم توجهه سياسة وقت تشغيل
الموفر أو النموذج إلى حامل آخر. تبقى مراجع الموفرين العاديين غير OpenAI على
مسار الموفر الطبيعي الخاص بها في وضع `auto`.

**Computer Use مثبتة لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر ذلك، فأعد تشغيل
Gateway لمسح تسجيلات الخطافات الأصلية القديمة. راجع
[Codex Computer Use](/ar/plugins/codex-computer-use#troubleshooting).

## ذات صلة

- [Codex harness reference](/ar/plugins/codex-harness-reference)
- [Codex harness runtime](/ar/plugins/codex-harness-runtime)
- [Native Codex plugins](/ar/plugins/codex-native-plugins)
- [Codex Computer Use](/ar/plugins/codex-computer-use)
- [أوقات تشغيل العامل](/ar/concepts/agent-runtimes)
- [موفرو النماذج](/ar/concepts/model-providers)
- [موفر OpenAI](/ar/providers/openai)
- [Agent harness plugins](/ar/plugins/sdk-agent-harness)
- [Plugin hooks](/ar/plugins/hooks)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الحالة](/ar/cli/status)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
