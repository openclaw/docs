---
read_when:
    - تريد استخدام حزمة اختبار خادم تطبيق Codex المضمّنة
    - تحتاج إلى أمثلة لتكوين حزمة Codex
    - تريد أن تفشل عمليات النشر التي تستخدم Codex فقط بدلاً من الرجوع إلى OpenClaw
summary: شغّل دورات الوكيل المضمّن في OpenClaw عبر حزام app-server الخاص بـ Codex والمضمّن معه
title: بيئة تشغيل Codex
x-i18n:
    generated_at: "2026-06-27T18:02:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

يتيح Plugin `codex` المضمّن لـ OpenClaw تشغيل دورات وكلاء OpenAI المضمّنة
عبر خادم تطبيق Codex بدلا من إطار تشغيل OpenClaw المضمّن.

استخدم إطار تشغيل Codex عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى:
استئناف السلاسل الأصلي، ومتابعة الأدوات الأصلية، وCompaction الأصلي، وتنفيذ
خادم التطبيق. يظل OpenClaw مسؤولا عن قنوات الدردشة، وملفات الجلسات، واختيار النموذج،
وأدوات OpenClaw الديناميكية، والموافقات، وتسليم الوسائط، ونسخة النص المرئية.

يستخدم الإعداد العادي مراجع نماذج OpenAI القياسية مثل `openai/gpt-5.5`.
لا تضبط مراجع Codex GPT القديمة. ضع ترتيب مصادقة وكيل OpenAI
تحت `auth.order.openai`؛ معرّفات ملفات تعريف مصادقة Codex القديمة
ومدخلات ترتيب مصادقة Codex القديمة هي حالة قديمة يصلحها
`openclaw doctor --fix`.

عندما لا يكون أي صندوق رمل من OpenClaw نشطا، يبدأ OpenClaw سلاسل خادم تطبيق Codex
مع تمكين وضع كود Codex الأصلي، مع ترك وضع الكود فقط معطلا افتراضيا.
يحافظ ذلك على إتاحة مساحة عمل Codex الأصلية وقدرات الكود، بينما
تستمر أدوات OpenClaw الديناميكية عبر جسر `item/tool/call` في خادم التطبيق.
تؤدي سياسات الصندوق الرملي النشطة في OpenClaw وسياسات الأدوات المقيّدة إلى تعطيل وضع الكود الأصلي
بالكامل ما لم تشترك في مسار خادم تنفيذ الصندوق الرملي التجريبي.

هذه الميزة الأصلية من Codex منفصلة عن
[وضع كود OpenClaw](/ar/reference/code-mode)، وهو وقت تشغيل QuickJS-WASI اختياري
لتشغيلات OpenClaw العامة مع شكل إدخال `exec` مختلف.

للتقسيم الأوسع بين النموذج/الموفر/وقت التشغيل، ابدأ بـ
[أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو وقت التشغيل، وتظل Telegram
أو Discord أو Slack أو قناة أخرى هي سطح التواصل.

## المتطلبات

- OpenClaw مع توفر Plugin `codex` المضمّن.
- إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex`.
- خادم تطبيق Codex `0.125.0` أو أحدث. يدير Plugin المضمّن ثنائيا متوافقا
  لخادم تطبيق Codex افتراضيا، لذلك لا تؤثر أوامر `codex` المحلية على `PATH`
  في بدء تشغيل إطار التشغيل العادي.
- توفر مصادقة Codex عبر `openclaw models auth login --provider openai`،
  أو حساب خادم تطبيق في منزل Codex الخاص بالوكيل، أو ملف تعريف مصادقة Codex صريح
  بمفتاح API.

لأولوية المصادقة، وعزل البيئة، وأوامر خادم التطبيق المخصصة، واكتشاف النماذج،
وجميع حقول الإعداد، راجع
[مرجع إطار تشغيل Codex](/ar/plugins/codex-harness-reference).

## البدء السريع

يريد معظم المستخدمين الذين يريدون Codex في OpenClaw هذا المسار: تسجيل الدخول باستخدام
اشتراك ChatGPT/Codex، وتمكين Plugin `codex` المضمّن، واستخدام
مرجع نموذج `openai/gpt-*` قياسي.

سجّل الدخول باستخدام Codex OAuth:

```bash
openclaw models auth login --provider openai
```

مكّن Plugin `codex` المضمّن وحدد نموذج وكيل OpenAI:

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

أعد تشغيل Gateway بعد تغيير إعداد Plugin. إذا كانت لدى دردشة حالية
جلسة بالفعل، فاستخدم `/new` أو `/reset` قبل اختبار تغييرات وقت التشغيل لكي تحل
الدورة التالية إطار التشغيل من الإعداد الحالي.

## الإعداد

إعداد البدء السريع هو الحد الأدنى القابل للاستخدام لإعداد إطار تشغيل Codex. عيّن خيارات
إطار تشغيل Codex في إعداد OpenClaw، واستخدم CLI فقط لمصادقة Codex:

| الحاجة                                  | اضبط                                                                             | المكان                            |
| --------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| تمكين إطار التشغيل                      | `plugins.entries.codex.enabled: true`                                            | إعداد OpenClaw                    |
| الاحتفاظ بتثبيت Plugin في قائمة السماح  | أدرج `codex` في `plugins.allow`                                                  | إعداد OpenClaw                    |
| توجيه دورات وكلاء OpenAI عبر Codex      | `agents.defaults.model` أو `agents.list[].model` كـ `openai/gpt-*`               | إعداد وكيل OpenClaw               |
| تسجيل الدخول باستخدام ChatGPT/Codex OAuth | `openclaw models auth login --provider openai`                                   | ملف تعريف مصادقة CLI              |
| إضافة احتياطي بمفتاح API لتشغيلات Codex | ملف تعريف مفتاح API `openai:*` مدرج بعد مصادقة الاشتراك في `auth.order.openai` | ملف تعريف مصادقة CLI + إعداد OpenClaw |
| الفشل مغلقا عندما لا يتوفر Codex        | `agentRuntime.id: "codex"` على الموفر أو النموذج                                 | إعداد نموذج/موفر OpenClaw         |
| استخدام حركة OpenAI API المباشرة        | `agentRuntime.id: "openclaw"` على الموفر أو النموذج مع مصادقة OpenAI العادية     | إعداد نموذج/موفر OpenClaw         |
| ضبط سلوك خادم التطبيق                  | `plugins.entries.codex.config.appServer.*`                                       | إعداد Plugin Codex                |
| تمكين تطبيقات Plugin الأصلية في Codex   | `plugins.entries.codex.config.codexPlugins.*`                                    | إعداد Plugin Codex                |
| تمكين Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | إعداد Plugin Codex                |

استخدم مراجع نماذج `openai/gpt-*` لدورات وكلاء OpenAI المدعومة بـ Codex. فضّل
`auth.order.openai` لترتيب الاشتراك أولا/مفتاح API كاحتياطي. معرّفات
ملفات تعريف مصادقة Codex القديمة وترتيب مصادقة Codex القديم هي حالة قديمة
خاصة بالطبيب فقط؛ لا تكتب مراجع Codex GPT قديمة جديدة.

لا تضبط `compaction.model` أو `compaction.provider` على الوكلاء المدعومين بـ Codex.
يجري Codex عمليات Compaction عبر حالة سلسلة خادم التطبيق الأصلية لديه، لذلك يتجاهل OpenClaw
تجاوزات الملخّص المحلية هذه وقت التشغيل، ويزيلها `openclaw doctor --fix`
عندما يستخدم الوكيل Codex.

يبقى Lossless مدعوما كمحرك سياق للتجميع، والإدخال، والصيانة حول دورات Codex.
اضبطه عبر
`plugins.slots.contextEngine: "lossless-claw"` و
`plugins.entries.lossless-claw.config.summaryModel`، وليس عبر
`agents.defaults.compaction.provider`. ينقل `openclaw doctor --fix` الشكل القديم
`compaction.provider: "lossless-claw"` إلى خانة محرك سياق Lossless
عندما يكون Codex هو وقت التشغيل النشط، لكن Codex الأصلي يظل مسؤولا عن Compaction.

يدعم إطار تشغيل خادم تطبيق Codex الأصلي محركات السياق التي تتطلب
تجميع ما قبل الموجه. لا توفر خلفيات CLI العامة، بما في ذلك `codex-cli`،
قدرة المضيف هذه.

بالنسبة للوكلاء المدعومين بـ Codex، يبدأ `/compact` عملية Compaction أصلية في خادم تطبيق Codex على
السلسلة المرتبطة. لا ينتظر OpenClaw الإكمال، ولا يفرض مهلة OpenClaw،
ولا يعيد تشغيل خادم التطبيق المشترك، ولا يتراجع إلى محرك سياق أو
ملخّص OpenAI عام. إذا كان ربط سلسلة Codex الأصلي مفقودا أو قديما،
يفشل الأمر مغلقا لكي يرى المشغّل حد وقت التشغيل الحقيقي
بدلا من تبديل خلفيات Compaction بصمت.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

في هذا الشكل، ما زال كلا ملفي التعريف يعملان عبر Codex لدورات وكلاء
`openai/gpt-*`. مفتاح API هو بديل مصادقة فقط، وليس طلبا للتبديل إلى OpenClaw أو
OpenAI Responses العادي.

يغطي بقية هذه الصفحة المتغيرات الشائعة التي يجب على المستخدمين الاختيار بينها:
شكل النشر، والتوجيه بالفشل المغلق، وسياسة موافقة الحارس، وPlugin الأصلية في Codex،
وComputer Use. لقوائم الخيارات الكاملة، والقيم الافتراضية، والتعدادات، والاكتشاف،
وعزل البيئة، والمهلات، وحقول نقل خادم التطبيق، راجع
[مرجع إطار تشغيل Codex](/ar/plugins/codex-harness-reference).

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

يبلّغ `/codex status` عن اتصال خادم التطبيق، والحساب، وحدود المعدلات، وخوادم MCP،
وSkills. يسرد `/codex models` كتالوج خادم تطبيق Codex المباشر
لإطار التشغيل والحساب. إذا كان `/status` مفاجئا، فراجع
[استكشاف الأخطاء وإصلاحها](#troubleshooting).

## التوجيه واختيار النموذج

أبق مراجع الموفر وسياسة وقت التشغيل منفصلين:

- استخدم `openai/gpt-*` لدورات وكلاء OpenAI عبر Codex.
- لا تستخدم مراجع Codex GPT القديمة في الإعداد. شغّل `openclaw doctor --fix`
  لإصلاح المراجع القديمة ودبابيس مسارات الجلسات الراكدة.
- `agentRuntime.id: "codex"` اختياري لوضع OpenAI التلقائي العادي، لكنه مفيد
  عندما يجب أن يفشل النشر مغلقا إذا لم يتوفر Codex.
- `agentRuntime.id: "openclaw"` يختار لموفر أو نموذج وقت تشغيل OpenClaw
  المضمّن عندما يكون ذلك مقصودا.
- يتحكم `/codex ...` في محادثات خادم تطبيق Codex الأصلية من الدردشة.
- ACP/acpx هو مسار إطار تشغيل خارجي منفصل. استخدمه فقط عندما يطلب المستخدم
  ACP/acpx أو مهايئ إطار تشغيل خارجي.

توجيه الأوامر الشائع:

| نية المستخدم                                          | استخدم                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| إرفاق الدردشة الحالية                                | `/codex bind [--cwd <path>]`                                                                          |
| استئناف سلسلة Codex موجودة                           | `/codex resume <thread-id>`                                                                           |
| سرد سلاسل Codex أو تصفيتها                           | `/codex threads [filter]`                                                                             |
| سرد Plugins الأصلية في Codex                         | `/codex plugins list`                                                                                 |
| تمكين أو تعطيل Plugin Codex أصلي مضبوط              | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| إرفاق جلسة Codex CLI موجودة على عقدة مقترنة          | `/codex sessions --host <node> [filter]`, ثم `/codex resume <session-id> --host <node> --bind here` |
| إرسال ملاحظات Codex فقط                              | `/codex diagnostics [note]`                                                                           |
| بدء مهمة ACP/acpx                                    | أوامر جلسة ACP/acpx، وليس `/codex`                                                                    |

| حالة الاستخدام                                             | التهيئة                                                              | التحقق                                  | ملاحظات                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| اشتراك ChatGPT/Codex مع بيئة تشغيل Codex الأصلية | `openai/gpt-*` مع Plugin `codex` مفعّل                             | يعرض `/status` القيمة `Runtime: OpenAI Codex` | المسار الموصى به                      |
| الفشل المغلق إذا لم يكن Codex متاحًا                  | المزوّد أو النموذج `agentRuntime.id: "codex"`                           | تفشل الجولة بدلًا من الرجوع المضمّن | استخدمه لعمليات نشر Codex فقط        |
| تمرير حركة مفتاح OpenAI API المباشرة عبر OpenClaw       | المزوّد أو النموذج `agentRuntime.id: "openclaw"` ومصادقة OpenAI العادية | يعرض `/status` بيئة تشغيل OpenClaw        | استخدمه فقط عندما يكون OpenClaw مقصودًا |
| تهيئة قديمة                                        | مراجع Codex GPT القديمة                                                  | يعيد `openclaw doctor --fix` كتابتها     | لا تكتب تهيئة جديدة بهذه الطريقة      |
| محوّل ACP/acpx لـ Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | حالة مهمة/جلسة ACP                 | منفصل عن حاضنة Codex الأصلية    |

يتبع `agents.defaults.imageModel` تقسيم البادئات نفسه. استخدم `openai/gpt-*`
للمسار العادي في OpenAI و`codex/gpt-*` فقط عندما ينبغي أن يعمل فهم الصور
عبر جولة محدودة في خادم تطبيق Codex. لا تستخدم
مراجع Codex GPT القديمة؛ يعيد doctor كتابة تلك البادئة القديمة إلى `openai/gpt-*`.

## أنماط النشر

### نشر Codex الأساسي

استخدم تهيئة البدء السريع عندما ينبغي أن تستخدم كل جولات وكيل OpenAI‏ Codex
افتراضيًا.

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

### نشر مختلط المزوّدين

يبقي هذا الشكل Claude كوكيل افتراضي ويضيف وكيل Codex مسمى:

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

باستخدام هذه التهيئة، يستخدم الوكيل `main` مسار مزوّده العادي ويستخدم
الوكيل `codex` خادم تطبيق Codex.

### نشر Codex بفشل مغلق

بالنسبة إلى جولات وكيل OpenAI، يتحول `openai/gpt-*` بالفعل إلى Codex عندما تكون
Plugin المضمّنة متاحة. أضف سياسة بيئة تشغيل صريحة عندما تريد قاعدة مكتوبة
للفشل المغلق:

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

عند فرض Codex، يفشل OpenClaw مبكرًا إذا كانت Plugin‏ Codex معطّلة، أو كان
خادم التطبيق قديمًا جدًا، أو تعذّر بدء خادم التطبيق.

## سياسة خادم التطبيق

افتراضيًا، تبدأ Plugin ثنائية Codex المُدارة من OpenClaw محليًا باستخدام نقل stdio.
اضبط `appServer.command` فقط عندما تريد عمدًا تشغيل ملف تنفيذي مختلف.
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

تستخدم جلسات خادم تطبيق stdio المحلية افتراضيًا وضع المشغّل المحلي الموثوق:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. إذا كانت متطلبات Codex المحلية لا تسمح بذلك
الوضع الضمني YOLO، يختار OpenClaw أذونات الحارس المسموح بها بدلًا من ذلك.
عندما تكون بيئة رملية في OpenClaw نشطة للجلسة، يعطّل OpenClaw وضع الكود الأصلي في Codex،
وخوادم MCP الخاصة بالمستخدم، وتنفيذ Plugins المدعوم بالتطبيقات لتلك
الجولة بدلًا من الاعتماد على البيئة الرملية من جانب مضيف Codex. يُتاح وصول الطرفية
عبر أدوات OpenClaw الديناميكية المدعومة بالبيئة الرملية مثل `sandbox_exec` و
`sandbox_process` عندما تكون أدوات exec/process العادية متاحة.

استخدم وضع تنفيذ OpenClaw الموحّد عندما تريد المراجعة التلقائية الأصلية في Codex قبل
الخروج من البيئة الرملية أو طلب أذونات إضافية:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

بالنسبة إلى جلسات خادم تطبيق Codex، يربط OpenClaw‏ `tools.exec.mode: "auto"` بموافقات
يراجعها Guardian في Codex، وعادةً تكون
`approvalPolicy: "on-request"` و`approvalsReviewer: "auto_review"` و
`sandbox: "workspace-write"` عندما تسمح المتطلبات المحلية بهذه القيم.
في `tools.exec.mode: "auto"`، لا يحافظ OpenClaw على تجاوزات Codex القديمة غير الآمنة
`approvalPolicy: "never"` أو `sandbox: "danger-full-access"`؛ استخدم
`tools.exec.mode: "full"` لوضع Codex مقصود بلا موافقات. لا يزال الإعداد المسبق القديم
`plugins.entries.codex.config.appServer.mode: "guardian"` يعمل، لكن
`tools.exec.mode: "auto"` هو سطح OpenClaw الموحّد.

للمقارنة على مستوى الوضع مع موافقات تنفيذ المضيف وأذونات ACPX،
راجع [أوضاع الأذونات](/ar/tools/permission-modes).

لكل حقل في خادم التطبيق، وترتيب المصادقة، وعزل البيئة، والاكتشاف، وسلوك
المهلة، راجع [مرجع حاضنة Codex](/ar/plugins/codex-harness-reference).

## الأوامر والتشخيصات

تسجل Plugin المضمّنة `/codex` كأمر شرطة مائلة على أي قناة تدعم
أوامر OpenClaw النصية.

الصيغ الشائعة:

- يتحقق `/codex status` من اتصال خادم التطبيق، والنماذج، والحساب، وحدود المعدل،
  وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج خادم تطبيق Codex الحية.
- يسرد `/codex threads [filter]` سلاسل خادم تطبيق Codex الحديثة.
- يرفق `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex
  موجودة.
- يطلب `/codex compact` من خادم تطبيق Codex ضغط السلسلة المرفقة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرفقة.
- يطلب `/codex diagnostics [note]` الإذن قبل إرسال ملاحظات Codex للسلسلة
  المرفقة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خادم MCP في خادم تطبيق Codex.
- يسرد `/codex skills` Skills خادم تطبيق Codex.

في معظم تقارير الدعم، ابدأ بـ `/diagnostics [note]` في المحادثة
التي حدث فيها الخطأ. ينشئ ذلك تقرير تشخيصات Gateway واحدًا، وبالنسبة إلى جلسات
حاضنة Codex، يطلب الموافقة لإرسال حزمة ملاحظات Codex ذات الصلة.
راجع [تصدير التشخيصات](/ar/gateway/diagnostics) لمعرفة نموذج الخصوصية وسلوك
الدردشة الجماعية.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدًا رفع ملاحظات Codex
للسلسلة المرفقة حاليًا من دون حزمة تشخيصات Gateway الكاملة.

### فحص سلاسل Codex محليًا

أسرع طريقة لفحص تشغيل Codex سيئ هي غالبًا فتح سلسلة Codex الأصلية
مباشرةً:

```bash
codex resume <thread-id>
```

احصل على معرّف السلسلة من رد `/diagnostics` المكتمل، أو `/codex binding`، أو
`/codex threads [filter]`.

لآليات الرفع وحدود التشخيصات على مستوى بيئة التشغيل، راجع
[بيئة تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime#codex-feedback-upload).

تُختار المصادقة بهذا الترتيب:

1. ملفات تعريف مصادقة OpenAI المرتبة للوكيل، ويفضّل أن تكون ضمن
   `auth.order.openai`. شغّل `openclaw doctor --fix` لترحيل
   معرّفات ملفات تعريف مصادقة Codex القديمة وترتيب مصادقة Codex القديم.
2. الحساب الموجود في خادم التطبيق ضمن موطن Codex لذلك الوكيل.
3. لعمليات تشغيل خادم تطبيق stdio المحلية فقط، `CODEX_API_KEY` ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيق وكانت مصادقة OpenAI
   لا تزال مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المُنشأة. يحافظ ذلك
على إتاحة مفاتيح API على مستوى Gateway للتضمينات أو نماذج OpenAI المباشرة
من دون جعل جولات خادم تطبيق Codex الأصلية تُحاسب عبر API بطريق الخطأ.
تستخدم ملفات تعريف مفتاح API الصريحة لـ Codex والرجوع المحلي إلى مفتاح البيئة في stdio
تسجيل دخول خادم التطبيق بدلًا من بيئة العملية الفرعية الموروثة. لا تتلقى اتصالات
خادم تطبيق WebSocket رجوع مفتاح API من بيئة Gateway؛ استخدم ملف تعريف مصادقة صريحًا أو
حساب خادم التطبيق البعيد نفسه.
عند تهيئة Plugins أصلية لـ Codex، يثبّت OpenClaw تلك Plugins أو يحدّثها
عبر خادم التطبيق المتصل قبل إتاحة التطبيقات المملوكة للـ Plugins
لسلسلة Codex. يظل `app/list` مصدر الحقيقة لمعرّفات التطبيقات،
وإمكانية الوصول، والبيانات الوصفية، لكن OpenClaw يملك قرار التفعيل لكل سلسلة:
إذا سمحت السياسة بتطبيق متاح مُدرج، يرسل OpenClaw
`thread/start.config.apps[appId].enabled = true` حتى عندما يبلّغ `app/list` حاليًا
أن ذلك التطبيق معطّل. لا يخترع هذا المسار تثبيت تطبيقات لمعرّفات
مجهولة؛ لا يفعّل OpenClaw إلا Plugins السوق باستخدام `plugin/install`
ثم يحدّث الجرد.

إذا وصل ملف تعريف اشتراك إلى حد استخدام Codex، يسجل OpenClaw وقت إعادة الضبط
عندما يبلّغ Codex عنه، ويحاول ملف تعريف المصادقة المرتب التالي لتشغيل Codex نفسه.
عندما يمر وقت إعادة الضبط، يصبح ملف تعريف الاشتراك مؤهلًا
مرة أخرى من دون تغيير نموذج `openai/gpt-*` المحدد أو بيئة تشغيل Codex.

لعمليات تشغيل خادم تطبيق stdio المحلية، يضبط OpenClaw‏ `CODEX_HOME` على دليل
خاص بكل وكيل حتى لا تقرأ تهيئة Codex وملفات المصادقة/الحساب وذاكرة Plugins المؤقتة/بياناتها
وحالة السلاسل الأصلية من `~/.codex` الشخصية للمشغّل أو تكتب إليها
افتراضيًا. يحافظ OpenClaw على `HOME` العادي للعملية؛ يمكن للعمليات الفرعية التي يشغّلها Codex
أن تظل قادرة على العثور على تهيئة موطن المستخدم والرموز، وقد يكتشف Codex إدخالات
`$HOME/.agents/skills` و`$HOME/.agents/plugins/marketplace.json` المشتركة.

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

لا يؤثر `appServer.clearEnv` إلا في عملية خادم تطبيق Codex الفرعية المُنشأة.
يزيل OpenClaw‏ `CODEX_HOME` و`HOME` من هذه القائمة أثناء تسوية التشغيل المحلي:
يبقى `CODEX_HOME` خاصًا بكل وكيل، ويبقى `HOME` موروثًا حتى تتمكن
العمليات الفرعية من استخدام حالة موطن المستخدم العادية.

تعتمد أدوات Codex الديناميكية افتراضيا على تحميل `searchable`. لا يعرّض OpenClaw
أدوات ديناميكية تكرر عمليات مساحة العمل الأصلية في Codex: `read` و`write`
و`edit` و`apply_patch` و`exec` و`process` و`update_plan`. تتوفر معظم أدوات
تكامل OpenClaw المتبقية، مثل المراسلة والوسائط وcron والمتصفح والعقد
وgateway و`heartbeat_respond`، عبر بحث أدوات Codex ضمن مساحة الاسم
`openclaw`، مما يحافظ على سياق النموذج الأولي أصغر. يستخدم بحث الويب أداة
`web_search` المستضافة من Codex افتراضيا عند تمكين البحث وعدم تحديد مزود
مدار. البحث المستضاف الأصلي وأداة OpenClaw الديناميكية المدارة
`web_search` متنافيان، بحيث لا يستطيع البحث المدار تجاوز قيود النطاق
الأصلية. يستخدم OpenClaw الأداة المدارة عندما يكون البحث المستضاف غير متاح
أو معطلا صراحة أو مستبدلا بمزود مدار محدد. يبقي OpenClaw امتداد Codex
المستقل `web.run` معطلا لأن حركة مرور خادم التطبيق الإنتاجية ترفض مساحة
الاسم `web` المعرفة من المستخدم. يعطل `tools.web.search.enabled: false` كلا
المسارين، وكذلك عمليات التشغيل التي تعطل الأدوات وتقتصر على LLM فقط. يتعامل
Codex مع `"cached"` كتفضيل ويحلّه إلى وصول خارجي مباشر لدورات خادم التطبيق
غير المقيدة. يفشل الرجوع التلقائي المدار بصورة مغلقة عند تعيين
`allowedDomains` الأصلية، بحيث لا يمكن تجاوز قائمة السماح. تؤدي تغييرات
سياسة البحث الفعالة المستمرة إلى تدوير سلسلة Codex المرتبطة قبل الدورة
التالية. تستخدم القيود المؤقتة لكل دورة سلسلة مؤقتة مقيدة وتحافظ على الربط
الحالي للاستئناف لاحقا. تبقى ردود المصدر الخاصة بـ`sessions_yield` وأدوات
الرسائل فقط مباشرة لأن تلك عقود للتحكم بالدورة. يبقى `sessions_spawn` قابلا
للبحث بحيث تظل `spawn_agent` الأصلية في Codex هي السطح الأساسي للوكلاء
الفرعيين في Codex، بينما يظل تفويض OpenClaw أو ACP الصريح متاحا عبر مساحة
أسماء أدوات `openclaw` الديناميكية. تخبر تعليمات تعاون Heartbeat‏ Codex بأن
يبحث عن `heartbeat_respond` قبل إنهاء دورة Heartbeat عندما لا تكون الأداة
محملة بالفعل.

عيّن `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة، أو عند تصحيح حمولة
الأدوات الكاملة.

حقول Plugin في Codex ذات المستوى الأعلى المدعومة:

| الحقل                      | الافتراضي      | المعنى                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي. |
| `codexDynamicToolsExclude` | `[]`           | أسماء أدوات OpenClaw الديناميكية الإضافية التي يجب حذفها من دورات خادم تطبيق Codex.              |
| `codexPlugins`             | معطل           | دعم Plugin/التطبيق الأصلي في Codex للـplugins المنسقة المثبتة من المصدر والمهاجرة.           |

حقول `appServer` المدعومة:

| الحقل                                         | الافتراضي                                                | المعنى                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | يشغّل `"stdio"` Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ملف Codex الثنائي المُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير معيّن لاستخدام الملف الثنائي المُدار؛ ولا تضبطه إلا لتجاوز صريح.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | وسيطات نقل stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | غير معيّن                                                  | عنوان URL لخادم تطبيق WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | غير معيّن                                                  | رمز Bearer لنقل WebSocket. يقبل سلسلة نصية حرفية أو SecretInput مثل `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ترويسات WebSocket إضافية. تقبل قيم الترويسات سلاسل نصية حرفية أو قيم SecretInput، على سبيل المثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية app-server التي ينشئها stdio بعد أن يبني OpenClaw بيئتها الموروثة. يحتفظ OpenClaw بـ `CODEX_HOME` لكل وكيل وبـ `HOME` الموروثة للتشغيلات المحلية.                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | تفعيل سطح أدوات Codex الخاص بوضع الكود فقط. تظل أدوات OpenClaw الديناميكية مسجلة لدى Codex بحيث تعود استدعاءات `tools.*` المتداخلة عبر جسر app-server `item/tool/call`.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | غير معيّن                                                  | جذر مساحة عمل app-server البعيد لـ Codex. عند ضبطه، يستنتج OpenClaw جذر مساحة العمل المحلية من مساحة عمل OpenClaw التي تم حلها، ويحافظ على لاحقة cwd الحالية تحت هذا الجذر البعيد، ويرسل إلى Codex فقط cwd النهائي الخاص بـ app-server. إذا كان cwd خارج جذر مساحة عمل OpenClaw الذي تم حله، يفشل OpenClaw بإغلاق آمن بدلاً من إرسال مسار محلي للـ Gateway إلى app-server البعيد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلة استدعاءات مستوى التحكم في app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | نافذة هدوء بعد أن يقبل Codex دورة أو بعد طلب app-server محدود بنطاق الدورة بينما ينتظر OpenClaw ‏`turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | حارس خمول الإكمال والتقدم المستخدم بعد تسليم أداة، أو اكتمال أداة أصلية، أو تقدم مساعد خام بعد الأداة، أو اكتمال تفكير خام، أو تقدم تفكير بينما ينتظر OpenClaw ‏`turn/completed`. استخدمه لأحمال العمل الموثوقة أو الثقيلة حيث يمكن أن يبقى تركيب ما بعد الأداة هادئاً بشكل مشروع لمدة أطول من ميزانية إصدار المساعد النهائية.                                |
| `mode`                                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو تنفيذ يراجعه guardian. متطلبات stdio المحلية التي لا تتضمن `danger-full-access`، أو موافقة `never`، أو مراجع `user` تجعل الافتراضي الضمني guardian.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` أو سياسة موافقة guardian مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء/استئناف/دورة الخيط. تفضّل افتراضيات guardian ‏`"on-request"` عندما تكون مسموحة.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` أو صندوق عزل guardian مسموح به  | وضع صندوق عزل Codex الأصلي المرسل إلى بدء/استئناف الخيط. تفضّل افتراضيات guardian ‏`"workspace-write"` عندما تكون مسموحة، وإلا فـ `"read-only"`. عند تفعيل صندوق عزل OpenClaw، تستخدم دورات `danger-full-access` في Codex ‏`workspace-write` مع وصول إلى الشبكة مشتق من إعداد خروج صندوق عزل OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` أو مراجع guardian مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحاً، وإلا فاستخدم `guardian_subagent` أو `user`. يظل `guardian_subagent` اسماً مستعاراً قديماً.                                                                                                                                                                                                                              |
| `serviceTier`                                 | غير معيّن                                                  | طبقة خدمة app-server اختيارية لـ Codex. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة مرنة، ويمحو `null` التجاوز، ويُقبل `"fast"` القديم بوصفه `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | معطّل                                               | تفعيل شبكات ملف أذونات Codex لأوامر app-server. يعرّف OpenClaw إعداد `permissions.<profile>.network` المحدد ويختاره باستخدام `default_permissions` بدلاً من إرسال `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | تفعيل تجريبي يسجل بيئة Codex مدعومة بصندوق عزل OpenClaw مع Codex app-server 0.132.0 أو أحدث حتى يمكن لتنفيذ Codex الأصلي أن يعمل داخل صندوق عزل OpenClaw النشط.                                                                                                                                                                                                         |

يكون `appServer.networkProxy` صريحاً لأنه يغيّر عقد صندوق عزل Codex.
عند تفعيله، يضبط OpenClaw أيضاً `features.network_proxy.enabled` و
`default_permissions` في إعداد خيط Codex حتى يتمكن ملف الأذونات
المولّد من بدء الشبكات المُدارة من Codex. افتراضياً، ينشئ OpenClaw اسم
ملف مقاوم للتصادم `openclaw-network-<fingerprint>` من جسم الملف؛
استخدم `profileName` فقط عندما يكون اسم محلي ثابت مطلوباً.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

إذا كان وقت تشغيل app-server العادي سيكون `danger-full-access`، فإن تفعيل
`networkProxy` يستخدم وصولاً إلى نظام الملفات بنمط مساحة العمل لملف
الأذونات المولّد. إن فرض الشبكة المُدار من Codex هو شبكات معزولة،
لذلك لن يحمي ملف وصول كامل حركة الخروج.
تستخدم إدخالات النطاق `allow` أو `deny`؛ وتستخدم إدخالات مقابس Unix قيم
Codex وهي `allow` أو `none`.

استدعاءات الأدوات الديناميكية المملوكة من OpenClaw محدودة بشكل مستقل عن
`appServer.requestTimeoutMs`: تستخدم طلبات Codex `item/tool/call` مراقبًا من OpenClaw مدته 90 ثانية
افتراضيًا. تؤدي وسيطة `timeoutMs` الموجبة لكل استدعاء إلى تمديد
أو تقصير ميزانية تلك الأداة المحددة. تستخدم أداة `image_generate`
`agents.defaults.imageGenerationModel.timeoutMs` عندما لا يوفر استدعاء الأداة
مهلة خاصة به، أو تستخدم افتراضيًا مهلة 120 ثانية لتوليد الصور بخلاف ذلك.
تستخدم أداة `image` الخاصة بفهم الوسائط
`tools.media.image.timeoutSeconds` أو افتراضي الوسائط الخاص بها ومدته 60 ثانية. بالنسبة إلى فهم الصور،
تنطبق تلك المهلة على الطلب نفسه ولا
تُنقَص بسبب أعمال التحضير السابقة. تُحدّد ميزانيات الأدوات الديناميكية
بحد أقصى قدره 600000 مللي ثانية. عند انتهاء المهلة، يلغي OpenClaw إشارة الأداة
حيثما يكون ذلك مدعومًا ويعيد استجابة أداة ديناميكية فاشلة إلى Codex لكي يتمكن الدور
من المتابعة بدلًا من ترك الجلسة في حالة `processing`.
هذا المراقب هو ميزانية `item/tool/call` الديناميكية الخارجية؛ أما مُهل الطلبات
الخاصة بالمزود فتعمل داخل ذلك الاستدعاء وتحتفظ بدلالات المهلة الخاصة بها.

بعد أن يقبل Codex دورًا، وبعد أن يستجيب OpenClaw لطلب خادم تطبيق
محدود بنطاق الدور، يتوقع إطار الاختبار من Codex أن يحقق تقدمًا في الدور الحالي وأن
ينهي في النهاية الدور الأصلي باستخدام `turn/completed`. إذا ظل خادم التطبيق
صامتًا لمدة `appServer.turnCompletionIdleTimeoutMs`، يبذل OpenClaw أفضل جهد
لمقاطعة دور Codex، ويسجل مهلة تشخيصية، ويحرر مسار جلسة
OpenClaw بحيث لا تُصف رسائل الدردشة اللاحقة خلف دور أصلي قديم.
تعطل معظم الإشعارات غير النهائية للدور نفسه ذلك المراقب القصير
لأن Codex أثبت أن الدور لا يزال حيًا. تستخدم تسليمات الأدوات
ميزانية خمول أطول بعد الأداة: بعد أن يعيد OpenClaw استجابة `item/tool/call`،
وبعد اكتمال عناصر الأدوات الأصلية مثل `commandExecution`، وبعد اكتمالات
`custom_tool_call_output` الخام، وبعد تقدم المساعد الخام بعد الأداة،
أو اكتمالات الاستدلال، أو تقدم الاستدلال. يستخدم الحارس
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` عند تكوينه ويفترض
خمس دقائق بخلاف ذلك. توسع ميزانية ما بعد الأداة نفسها أيضًا
مراقب التقدم لنافذة التركيب الصامتة قبل أن يصدر Codex الحدث التالي
للدور الحالي. لا تعيد إشعارات خادم التطبيق العامة، مثل تحديثات حدود المعدل،
ضبط تقدم خمول الدور. يمكن أن تتبع اكتمالات الاستدلال، واكتمالات
`agentMessage` في commentary، وتقدم الاستدلال الخام أو المساعد قبل الأداة
استجابة نهائية تلقائية، ولذلك تستخدم حارس الرد بعد التقدم
بدلًا من تحرير مسار الجلسة فورًا. وحدها عناصر `agentMessage` المكتملة
النهائية/غير التعليقية واكتمالات المساعد الخام قبل الأداة تفعّل تحرير خرج المساعد:
إذا ظل Codex بعدها صامتًا دون `turn/completed`، يبذل OpenClaw أفضل جهد
لمقاطعة الدور الأصلي وتحرير مسار الجلسة. يُعاد تنفيذ حالات فشل خادم التطبيق عبر stdio
الآمنة لإعادة التشغيل، بما في ذلك مُهل خمول اكتمال الدور دون دليل على مساعد أو أداة
أو عنصر نشط أو أثر جانبي، مرة واحدة في محاولة جديدة لخادم التطبيق. لا تزال
المُهل غير الآمنة تنهي عميل خادم التطبيق العالق وتحرر مسار جلسة OpenClaw.
كما تمسح ربط الخيط الأصلي القديم بدلًا من إعادة تشغيله تلقائيًا.
تعرض مُهل مراقبة الاكتمال نص مهلة خاصًا بـ Codex: تقول الحالات الآمنة لإعادة التشغيل
إن الاستجابة قد تكون غير مكتملة، بينما تطلب الحالات غير الآمنة
من المستخدم التحقق من الحالة الحالية قبل إعادة المحاولة. تتضمن تشخيصات المهلة العامة
حقولًا بنيوية مثل آخر طريقة إشعار من خادم التطبيق،
ومعرّف/نوع/دور عنصر استجابة المساعد الخام، وأعداد الطلبات/العناصر النشطة، وحالة
المراقبة المفعلة. عندما يكون آخر إشعار عنصر استجابة مساعد خامًا،
تتضمن أيضًا معاينة محدودة لنص المساعد. ولا تتضمن محتوى الموجّه أو
الأداة الخام.

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف الثنائي المُدار عندما
لا يكون `appServer.command` مضبوطًا.

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل التكوين
لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في
الملف المُراجع نفسه مثل بقية إعداد إطار اختبار Codex.

## إضافات Codex الأصلية

يستخدم دعم Plugin الأصلي في Codex قدرات التطبيق وPlugin الخاصة بخادم تطبيق Codex
ضمن خيط Codex نفسه مثل دور إطار اختبار OpenClaw. لا يترجم OpenClaw
إضافات Codex إلى أدوات ديناميكية اصطناعية من OpenClaw باسم `codex_plugin_*`.

يؤثر `codexPlugins` فقط في الجلسات التي تختار إطار اختبار Codex الأصلي. ولا
يؤثر في تشغيلات إطار الاختبار المدمج، أو تشغيلات مزود OpenAI العادية، أو ارتباطات محادثات ACP
، أو أطر الاختبار الأخرى.

التكوين المرحّل الأدنى:

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

يُحسب تكوين تطبيق الخيط عندما ينشئ OpenClaw جلسة إطار اختبار Codex
أو يستبدل ربط خيط Codex قديمًا. ولا يُعاد حسابه في كل دور.
بعد تغيير `codexPlugins`، استخدم `/new` أو `/reset` أو أعد تشغيل Gateway لكي
تبدأ جلسات إطار اختبار Codex المستقبلية بمجموعة التطبيقات المحدّثة.

لأهلية الترحيل، ومخزون التطبيقات، وسياسة الإجراءات التدميرية،
والاستيضاحات، وتشخيصات Plugin الأصلية، راجع
[إضافات Codex الأصلية](/ar/plugins/codex-native-plugins).

يتحكم حساب Codex المسجّل دخوله، وبالنسبة إلى مساحات عمل Business وEnterprise/Edu
عناصر التحكم في تطبيقات مساحة العمل، في الوصول إلى التطبيقات وPlugin من جانب OpenAI. راجع
[استخدام Codex مع خطة ChatGPT الخاصة بك](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
للاطلاع على نظرة عامة من OpenAI حول عناصر التحكم في الحساب ومساحة العمل.

## Computer Use

يُغطّى Computer Use في دليل الإعداد الخاص به:
[Codex Computer Use](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ
إجراءات سطح المكتب بنفسه. إنه يحضّر خادم تطبيق Codex، ويتحقق من أن خادم MCP
`computer-use` متاح، ثم يترك Codex يمتلك استدعاءات أدوات MCP
الأصلية أثناء أدوار وضع Codex.

## حدود وقت التشغيل

يغيّر إطار اختبار Codex منفذ الوكيل المضمن منخفض المستوى فقط.

- أدوات OpenClaw الديناميكية مدعومة. يطلب Codex من OpenClaw تنفيذ تلك
  الأدوات، لذلك يبقى OpenClaw ضمن مسار التنفيذ.
- أدوات الصدفة، والتصحيح، وMCP، والتطبيقات الأصلية الخاصة بـ Codex مملوكة من Codex.
  يستطيع OpenClaw مراقبة أحداث أصلية محددة أو حظرها عبر المرحّل المدعوم،
  لكنه لا يعيد كتابة وسيطات الأدوات الأصلية.
- يمتلك Codex عملية Compaction الأصلية. يحتفظ OpenClaw بمرآة للنص التفريغي لسجل القنوات
  والبحث و`/new` و`/reset` والتبديل المستقبلي للنموذج أو إطار الاختبار، لكنه
  لا يستبدل Compaction الخاصة بـ Codex بملخّص من OpenClaw أو من محرك السياق.
- يستمر توليد الوسائط، وفهم الوسائط، وTTS، والموافقات، وخرج أداة المراسلة
  عبر إعدادات مزود/نموذج OpenClaw المطابقة.
- ينطبق `tool_result_persist` على نتائج أدوات النص التفريغي المملوكة من OpenClaw، وليس
  سجلات نتائج الأدوات الأصلية لـ Codex.

لطبقات الخطافات، والأسطح المدعومة في V1، ومعالجة الأذونات الأصلية، وتوجيه الطابور،
وآليات رفع ملاحظات Codex، وتفاصيل Compaction، راجع
[وقت تشغيل إطار اختبار Codex](/ar/plugins/codex-harness-runtime).

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كمزود `/model` عادي:** هذا متوقع للتكوينات
الجديدة. اختر نموذج `openai/gpt-*`، وفعّل
`plugins.entries.codex.enabled`، وتحقق مما إذا كان `plugins.allow` يستبعد
`codex`.

**يستخدم OpenClaw إطار الاختبار المدمج بدلًا من Codex:** تأكد من أن مرجع النموذج هو
`openai/gpt-*` على مزود OpenAI الرسمي وأن Codex Plugin
مثبت ومفعّل. إذا كنت تحتاج إلى إثبات صارم أثناء الاختبار، فاضبط
`agentRuntime.id: "codex"` على المزود أو النموذج. يفشل وقت تشغيل Codex المفروض بدلًا من
الرجوع إلى OpenClaw.

**يرجع وقت تشغيل OpenAI Codex إلى مسار مفتاح API:** اجمع مقتطف Gateway منقحًا
يعرض النموذج ووقت التشغيل والمزود المحدد والفشل.
اطلب من المتعاونين المتأثرين تشغيل هذا الأمر للقراءة فقط على مضيف OpenClaw الخاص بهم:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

تتضمن المقتطفات المفيدة عادةً `openai/gpt-5.5` أو `openai/gpt-5.4`،
و`Runtime: OpenAI Codex`، و`agentRuntime.id` أو `harnessRuntime`،
و`candidateProvider: "openai"`، ونتيجة `401` أو `Incorrect API key` أو
`No API key`. ينبغي أن يُظهر التشغيل المصحح مسار OpenAI OAuth
بدلًا من فشل مفتاح API عادي من OpenAI.

**لا يزال تكوين مراجع نماذج Codex القديمة موجودًا:** شغّل `openclaw doctor --fix`.
يعيد Doctor كتابة مراجع النماذج القديمة إلى `openai/*`، ويزيل تثبيتات وقت التشغيل
القديمة للجلسة والوكيل بالكامل، ويحافظ على تجاوزات ملف تعريف المصادقة الحالية.

**يُرفض خادم التطبيق:** استخدم خادم تطبيق Codex بالإصدار `0.125.0` أو أحدث.
تُرفض الإصدارات التمهيدية ذات الإصدار نفسه أو الإصدارات ذات لاحقة البناء مثل
`0.125.0-alpha.2` أو `0.125.0+custom` لأن OpenClaw يختبر
أرضية بروتوكول `0.125.0` المستقرة.

**يتعذر على `/codex status` الاتصال:** تحقق من أن Plugin `codex` المضمّن
مفعّل، وأن `plugins.allow` يتضمنه عند تكوين قائمة سماح، وأن
أي `appServer.command` أو `url` أو `authToken` أو ترويسات مخصصة صالحة.

**اكتشاف النماذج بطيء:** خفّض
`plugins.entries.codex.config.discovery.timeoutMs` أو عطّل الاكتشاف. راجع
[مرجع إطار اختبار Codex](/ar/plugins/codex-harness-reference#model-discovery).

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url` و`authToken`
والترويسات، ومن أن خادم التطبيق البعيد يتحدث بإصدار بروتوكول خادم تطبيق Codex
نفسه.

**تُحظر أدوات الصدفة أو التصحيح الأصلية مع `Native hook relay unavailable`:**
لا يزال خيط Codex يحاول استخدام معرّف مرحّل خطاف أصلي لم يعد OpenClaw
مسجلًا لديه. هذه مشكلة نقل خطاف أصلي في Codex، وليست فشلًا في خلفية ACP
أو المزود أو GitHub أو أمر الصدفة. ابدأ جلسة جديدة في
الدردشة المتأثرة باستخدام `/new` أو `/reset`، ثم أعد محاولة أمر غير ضار. إذا نجح ذلك
مرة واحدة لكن فشل استدعاء الأداة الأصلية التالي مرة أخرى، فتعامل مع `/new` كحل مؤقت
فقط: انسخ الموجّه إلى جلسة جديدة بعد إعادة تشغيل خادم تطبيق Codex
أو OpenClaw Gateway لكي تُسقط الخيوط القديمة وتُعاد إنشاء تسجيلات الخطافات
الأصلية.

**يستخدم نموذج غير Codex إطار الاختبار المدمج:** هذا متوقع ما لم
توجهه سياسة وقت تشغيل المزود أو النموذج إلى إطار اختبار آخر. تبقى مراجع مزودي
غير OpenAI العادية على مسار مزودها الطبيعي في وضع `auto`.

**Computer Use مثبت ولكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم استرداد مرحّل الخطاف الأصلي أعلاه. راجع
[Codex Computer Use](/ar/plugins/codex-computer-use#troubleshooting).

## ذات صلة

- [مرجع حاضنة Codex](/ar/plugins/codex-harness-reference)
- [وقت تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime)
- [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins)
- [Codex Computer Use](/ar/plugins/codex-computer-use)
- [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مزود OpenAI](/ar/providers/openai)
- [مساعدة OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins حاضنة الوكيل](/ar/plugins/sdk-agent-harness)
- [خطافات Plugin](/ar/plugins/hooks)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الحالة](/ar/cli/status)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
