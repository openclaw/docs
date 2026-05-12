---
read_when:
    - تريد استخدام إطار خادم التطبيق المضمّن مع Codex
    - تحتاج إلى أمثلة لتكوين حاضنة Codex
    - تريد أن تفشل عمليات النشر المقتصرة على Codex بدلاً من الرجوع إلى PI
summary: تشغيل جولات وكيل OpenClaw المضمّن عبر إطار تشغيل خادم تطبيق Codex المرفق
title: إطار تشغيل Codex
x-i18n:
    generated_at: "2026-05-12T08:46:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

تتيح Plugin `codex` المضمّنة لـ OpenClaw تشغيل دورات وكيل OpenAI مضمّنة
عبر Codex app-server بدلاً من مشغّل PI المدمج.

استخدم مشغّل Codex عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى:
استئناف السلسلة الأصلي، ومتابعة الأدوات الأصلية، وCompaction الأصلي، والتنفيذ
عبر app-server. يظل OpenClaw مسؤولاً عن قنوات المحادثة، وملفات الجلسة، واختيار النموذج،
وأدوات OpenClaw الديناميكية، والموافقات، وتسليم الوسائط، ونسخة النص الظاهرة.

يستخدم الإعداد العادي مراجع نماذج OpenAI القياسية مثل `openai/gpt-5.5`.
لا تضبط مراجع نماذج `openai-codex/gpt-*`. ضع ترتيب مصادقة وكيل OpenAI
تحت `auth.order.openai`؛ تظل ملفات تعريف `openai-codex:*` الأقدم
وإدخالات `auth.order.openai-codex` مدعومة للتثبيتات الحالية.

يبدأ OpenClaw سلاسل Codex app-server بوضع الكود الأصلي في Codex مع تمكين
وضع الكود فقط. يحافظ ذلك على أدوات OpenClaw الديناميكية المؤجلة/القابلة للبحث
داخل تنفيذ الكود وسطح البحث عن الأدوات الخاصين بـ Codex نفسه، بدلاً من إضافة
غلاف بحث أدوات بأسلوب PI فوق Codex.

للاطلاع على التقسيم الأوسع بين النموذج/المزوّد/وقت التشغيل، ابدأ من
[أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو وقت التشغيل، وتظل Telegram
أو Discord أو Slack أو قناة أخرى سطح التواصل.

## المتطلبات

- OpenClaw مع Plugin `codex` المضمّنة متاحة.
- إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex`.
- Codex app-server `0.125.0` أو أحدث. تدير Plugin المضمّنة ثنائي Codex app-server
  متوافقاً افتراضياً، لذلك لا تؤثر أوامر `codex` المحلية على `PATH` في بدء تشغيل
  المشغّل العادي.
- مصادقة Codex متاحة عبر `openclaw models auth login --provider openai-codex`،
  أو حساب app-server في منزل Codex الخاص بالوكيل، أو ملف تعريف مصادقة Codex API-key
  صريح.

لأسبقية المصادقة، وعزل البيئة، وأوامر app-server المخصصة، واكتشاف النماذج،
وجميع حقول الإعداد، راجع
[مرجع مشغّل Codex](/ar/plugins/codex-harness-reference).

## البدء السريع

يريد معظم المستخدمين الذين يريدون Codex في OpenClaw هذا المسار: تسجيل الدخول باستخدام
اشتراك ChatGPT/Codex، وتمكين Plugin `codex` المضمّنة، واستخدام مرجع نموذج
`openai/gpt-*` قياسي.

سجّل الدخول باستخدام Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

مكّن Plugin `codex` المضمّنة واختر نموذج وكيل OpenAI:

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

أعد تشغيل Gateway بعد تغيير إعداد Plugin. إذا كانت محادثة حالية لديها جلسة بالفعل،
فاستخدم `/new` أو `/reset` قبل اختبار تغييرات وقت التشغيل حتى تستخلص الدورة التالية
المشغّل من الإعداد الحالي.

## الإعداد

إعداد البدء السريع هو الحد الأدنى القابل للاستخدام لإعداد مشغّل Codex. اضبط خيارات
مشغّل Codex في إعداد OpenClaw، واستخدم CLI لمصادقة Codex فقط:

| الحاجة                                   | اضبط                                                                              | المكان                              |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| تمكين المشغّل                            | `plugins.entries.codex.enabled: true`                                             | إعداد OpenClaw                      |
| الحفاظ على تثبيت Plugin ضمن قائمة السماح | أدرج `codex` في `plugins.allow`                                                    | إعداد OpenClaw                      |
| توجيه دورات وكيل OpenAI عبر Codex        | `agents.defaults.model` أو `agents.list[].model` كـ `openai/gpt-*`                | إعداد وكيل OpenClaw                 |
| تسجيل الدخول باستخدام Codex OAuth        | `openclaw models auth login --provider openai-codex`                              | ملف تعريف مصادقة CLI                |
| إضافة احتياطي API-key لتشغيلات Codex     | ملف تعريف API-key `openai:*` مدرج بعد مصادقة الاشتراك في `auth.order.openai`     | ملف تعريف مصادقة CLI + إعداد OpenClaw |
| الفشل المغلق عند عدم توفر Codex          | `agentRuntime.id: "codex"` للمزوّد أو النموذج                                      | إعداد نموذج/مزوّد OpenClaw          |
| استخدام مرور OpenAI API المباشر          | `agentRuntime.id: "pi"` للمزوّد أو النموذج مع مصادقة OpenAI العادية               | إعداد نموذج/مزوّد OpenClaw          |
| ضبط سلوك app-server                      | `plugins.entries.codex.config.appServer.*`                                        | إعداد Plugin Codex                  |
| تمكين تطبيقات Plugin الأصلية في Codex    | `plugins.entries.codex.config.codexPlugins.*`                                     | إعداد Plugin Codex                  |
| تمكين Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                                      | إعداد Plugin Codex                  |

استخدم مراجع نماذج `openai/gpt-*` لدورات وكيل OpenAI المدعومة بـ Codex. فضّل
`auth.order.openai` لترتيب الاشتراك أولاً/احتياطي API-key. تظل ملفات تعريف مصادقة
`openai-codex:*` الحالية و`auth.order.openai-codex` صالحة، لكن لا تكتب مراجع
نماذج `openai-codex/gpt-*` جديدة.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

في هذا الشكل، لا يزال كلا الملفين الشخصيين يعملان عبر Codex لدورات وكيل
`openai/gpt-*`. مفتاح API هو احتياطي مصادقة فقط، وليس طلباً للتبديل إلى PI أو
OpenAI Responses العادي.

يغطي بقية هذه الصفحة المتغيرات الشائعة التي يجب على المستخدمين الاختيار بينها:
شكل النشر، والتوجيه بفشل مغلق، وسياسة موافقة الحارس، وPlugins Codex الأصلية،
وComputer Use. للحصول على قوائم الخيارات الكاملة، والقيم الافتراضية، والتعدادات،
والاكتشاف، وعزل البيئة، والمهلات، وحقول نقل app-server، راجع
[مرجع مشغّل Codex](/ar/plugins/codex-harness-reference).

## التحقق من وقت تشغيل Codex

استخدم `/status` في المحادثة التي تتوقع فيها Codex. تعرض دورة وكيل OpenAI
المدعومة بـ Codex:

```text
Runtime: OpenAI Codex
```

ثم تحقق من حالة Codex app-server:

```text
/codex status
/codex models
```

يعرض `/codex status` اتصال app-server، والحساب، وحدود المعدل، وخوادم MCP،
وSkills. يسرد `/codex models` كتالوج Codex app-server المباشر للمشغّل والحساب.
إذا كانت نتيجة `/status` مفاجئة، فراجع
[استكشاف الأخطاء وإصلاحها](#troubleshooting).

## التوجيه واختيار النموذج

أبقِ مراجع المزوّد وسياسة وقت التشغيل منفصلين:

- استخدم `openai/gpt-*` لدورات وكيل OpenAI عبر Codex.
- لا تستخدم `openai-codex/gpt-*` في الإعداد. شغّل `openclaw doctor --fix`
  لإصلاح المراجع القديمة وتثبيتات مسار الجلسة الراكدة.
- `agentRuntime.id: "codex"` اختياري لوضع OpenAI التلقائي العادي، لكنه مفيد
  عندما يجب أن يفشل النشر فشلاً مغلقاً إذا لم يكن Codex متاحاً.
- `agentRuntime.id: "pi"` يختار لمزوّد أو نموذج سلوك PI المباشر عندما يكون ذلك مقصوداً.
- يتحكم `/codex ...` في محادثات Codex app-server الأصلية من المحادثة.
- ACP/acpx هو مسار مشغّل خارجي منفصل. استخدمه فقط عندما يطلب المستخدم
  ACP/acpx أو محوّل مشغّل خارجي.

توجيه الأوامر الشائع:

| نية المستخدم                     | استخدم                                  |
| -------------------------------- | --------------------------------------- |
| إرفاق المحادثة الحالية           | `/codex bind [--cwd <path>]`            |
| استئناف سلسلة Codex موجودة       | `/codex resume <thread-id>`             |
| سرد سلاسل Codex أو ترشيحها       | `/codex threads [filter]`               |
| إرسال ملاحظات Codex فقط          | `/codex diagnostics [note]`             |
| بدء مهمة ACP/acpx                | أوامر جلسات ACP/acpx، وليس `/codex`    |

| حالة الاستخدام                                        | اضبط                                                            | تحقق                                    | ملاحظات                              |
| ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ------------------------------------ |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي       | `openai/gpt-*` مع Plugin `codex` مفعّلة                          | يعرض `/status` ‏`Runtime: OpenAI Codex` | المسار الموصى به                     |
| الفشل المغلق إذا لم يكن Codex متاحاً                 | `agentRuntime.id: "codex"` للمزوّد أو النموذج                     | تفشل الدورة بدلاً من الرجوع إلى PI      | استخدمه لعمليات نشر Codex فقط       |
| مرور OpenAI API-key المباشر عبر PI                    | `agentRuntime.id: "pi"` للمزوّد أو النموذج ومصادقة OpenAI العادية | يعرض `/status` وقت تشغيل PI             | استخدمه فقط عندما يكون PI مقصوداً   |
| إعداد قديم                                            | `openai-codex/gpt-*`                                             | يعيد `openclaw doctor --fix` كتابته     | لا تكتب إعداداً جديداً بهذه الطريقة |
| محوّل ACP/acpx لـ Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                         | حالة مهمة/جلسة ACP                      | منفصل عن مشغّل Codex الأصلي          |

يتبع `agents.defaults.imageModel` تقسيم البادئة نفسه. استخدم `openai/gpt-*`
للمسار العادي لـ OpenAI، و`codex/gpt-*` فقط عندما يجب أن يعمل فهم الصور عبر
دورة Codex app-server محدودة. لا تستخدم `openai-codex/gpt-*`؛ يعيد doctor
كتابة تلك البادئة القديمة إلى `openai/gpt-*`.

## أنماط النشر

### نشر Codex الأساسي

استخدم إعداد البدء السريع عندما يجب أن تستخدم كل دورات وكيل OpenAI Codex
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

### نشر بمزوّدين مختلطين

يحافظ هذا الشكل على Claude كوكيل افتراضي ويضيف وكيلاً مسمى Codex:

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

باستخدام هذا الإعداد، يستخدم وكيل `main` مسار المزوّد العادي الخاص به، ويستخدم
وكيل `codex` ‏Codex app-server.

### نشر Codex بفشل مغلق

بالنسبة لدورات وكيل OpenAI، يتحول `openai/gpt-*` بالفعل إلى Codex عندما تكون
Plugin المضمّنة متاحة. أضف سياسة وقت تشغيل صريحة عندما تريد قاعدة فشل مغلق مكتوبة:

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

مع فرض Codex، يفشل OpenClaw مبكراً إذا كانت Plugin Codex معطلة، أو كان
app-server قديماً جداً، أو تعذر بدء app-server.

## سياسة app-server

افتراضياً، تبدأ Plugin ثنائي Codex المدار من OpenClaw محلياً باستخدام نقل stdio.
اضبط `appServer.command` فقط عندما تريد عمداً تشغيل ملف تنفيذي مختلف. استخدم نقل
WebSocket فقط عندما يكون app-server قيد التشغيل بالفعل في مكان آخر:

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

تستخدم جلسات خادم التطبيق المحلية عبر stdio افتراضيًا وضع المشغّل المحلي الموثوق:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. إذا كانت متطلبات Codex المحلية لا تسمح بهذا
وضع YOLO الضمني، يختار OpenClaw أذونات guardian المسموح بها بدلًا من ذلك.
عندما يكون صندوق حماية OpenClaw نشطًا للجلسة، يضيّق OpenClaw صلاحية Codex
`danger-full-access` إلى Codex `workspace-write` حتى تبقى دورات وضع الكود
الأصلية في Codex داخل مساحة العمل المعزولة.

استخدم وضع guardian عندما تريد مراجعة تلقائية أصلية من Codex قبل الخروج من
صندوق الحماية أو طلب أذونات إضافية:

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

يتوسّع وضع guardian إلى موافقات خادم تطبيق Codex، وعادةً تكون
`approvalPolicy: "on-request"` و`approvalsReviewer: "auto_review"` و
`sandbox: "workspace-write"` عندما تسمح المتطلبات المحلية بهذه القيم.

للاطلاع على كل حقول خادم التطبيق، وترتيب المصادقة، وعزل البيئة، والاكتشاف،
وسلوك المهلة، راجع [مرجع حاضنة Codex](/ar/plugins/codex-harness-reference).

## الأوامر والتشخيصات

يسجّل Plugin المضمّن الأمر `/codex` كأمر شرطة مائلة على أي قناة تدعم
أوامر OpenClaw النصية.

الصيغ الشائعة:

- يتحقق `/codex status` من اتصال خادم التطبيق، والنماذج، والحساب، وحدود المعدل،
  وخوادم MCP، وSkills.
- يعرض `/codex models` نماذج خادم تطبيق Codex المباشرة.
- يعرض `/codex threads [filter]` سلاسل خادم تطبيق Codex الأخيرة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex
  موجودة.
- يطلب `/codex compact` من خادم تطبيق Codex تنفيذ Compaction للسلسلة المرتبطة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرتبطة.
- يطلب `/codex diagnostics [note]` الإذن قبل إرسال ملاحظات Codex للسلسلة
  المرتبطة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يعرض `/codex mcp` حالة خادم MCP في خادم تطبيق Codex.
- يعرض `/codex skills` Skills الخاصة بخادم تطبيق Codex.

في معظم تقارير الدعم، ابدأ بـ `/diagnostics [note]` في المحادثة التي حدث فيها
الخلل. ينشئ ذلك تقرير تشخيص واحدًا لـ Gateway، وبالنسبة إلى جلسات حاضنة Codex،
يطلب الموافقة على إرسال حزمة ملاحظات Codex ذات الصلة. راجع
[تصدير التشخيصات](/ar/gateway/diagnostics) لمعرفة نموذج الخصوصية وسلوك المحادثات
الجماعية.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدًا رفع ملاحظات Codex
للسلسلة المرتبطة حاليًا من دون حزمة تشخيصات Gateway الكاملة.

### فحص سلاسل Codex محليًا

غالبًا ما تكون أسرع طريقة لفحص تشغيل Codex سيئ هي فتح سلسلة Codex الأصلية
مباشرةً:

```bash
codex resume <thread-id>
```

احصل على معرف السلسلة من رد `/diagnostics` المكتمل، أو `/codex binding`، أو
`/codex threads [filter]`.

لآليات الرفع وحدود التشخيص على مستوى وقت التشغيل، راجع
[وقت تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime#codex-feedback-upload).

تُختار المصادقة بهذا الترتيب:

1. ملفات تعريف مصادقة OpenAI المرتّبة للوكيل، ويفضّل أن تكون تحت
   `auth.order.openai`. تظل معرفات ملفات التعريف الحالية `openai-codex:*` صالحة.
2. الحساب الموجود لخادم التطبيق في موطن Codex لذلك الوكيل.
3. لتشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY` ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيق موجود وتظل مصادقة
   OpenAI مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المنشأة. يحافظ ذلك
على إتاحة مفاتيح API على مستوى Gateway للتضمينات أو نماذج OpenAI المباشرة من
دون جعل دورات خادم تطبيق Codex الأصلية تُفوَّتر عبر API عن طريق الخطأ. تستخدم
ملفات تعريف مفتاح API الصريحة لـ Codex واحتياطي مفتاح البيئة المحلي عبر stdio
تسجيل دخول خادم التطبيق بدلًا من بيئة العملية الفرعية الموروثة. لا تتلقى
اتصالات خادم التطبيق عبر WebSocket احتياطي مفتاح API من بيئة Gateway؛ استخدم
ملف تعريف مصادقة صريحًا أو حساب خادم التطبيق البعيد نفسه.

إذا وصل ملف تعريف اشتراك إلى حد استخدام Codex، يسجّل OpenClaw وقت إعادة الضبط
عندما يبلّغ Codex عنه، ويحاول ملف تعريف المصادقة المرتّب التالي لتشغيل Codex
نفسه. عندما يمر وقت إعادة الضبط، يصبح ملف تعريف الاشتراك مؤهلًا مرة أخرى من
دون تغيير نموذج `openai/gpt-*` المحدد أو وقت تشغيل Codex.

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

تستخدم أدوات Codex الديناميكية افتراضيًا تحميل `searchable`. لا يعرّض OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex: `read` و`write`
و`edit` و`apply_patch` و`exec` و`process` و`update_plan`. تتوفر أدوات تكامل
OpenClaw المتبقية مثل المراسلة، والجلسات، والوسائط، وCron، والمتصفح، والعُقد،
وGateway، و`heartbeat_respond`، و`web_search` من خلال بحث أدوات Codex ضمن مساحة
الأسماء `openclaw`، مما يبقي سياق النموذج الأولي أصغر.
تبقى `sessions_yield` وردود المصدر الخاصة بأدوات الرسائل فقط مباشرة لأنها
عقود تحكم في الدورة. تخبر تعليمات تعاون Heartbeat جهاز Codex بالبحث عن
`heartbeat_respond` قبل إنهاء دورة Heartbeat عندما لا تكون الأداة محمّلة مسبقًا.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة، أو عند تصحيح حمولة
الأدوات الكاملة.

حقول Plugin Codex المدعومة في المستوى الأعلى:

| الحقل                      | الافتراضي        | المعنى                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرةً في سياق أدوات Codex الأولي. |
| `codexDynamicToolsExclude` | `[]`           | أسماء أدوات OpenClaw الديناميكية الإضافية المطلوب حذفها من دورات خادم تطبيق Codex.              |
| `codexPlugins`             | معطّل       | دعم Plugin/التطبيق الأصلي في Codex للـ Plugins المنسّقة المثبتة من المصدر بعد ترحيلها.           |

حقول `appServer` المدعومة:

| الحقل                         | الافتراضي                                                | المعنى                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | ينشئ `"stdio"` عملية Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                                |
| `command`                     | ملف Codex الثنائي المُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف الثنائي المُدار؛ واضبطه فقط لتجاوز صريح.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | الوسيطات لنقل stdio.                                                                                                                                                                                                          |
| `url`                         | غير معيّن                                                  | عنوان URL لخادم التطبيق عبر WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | غير معيّن                                                  | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | ترويسات WebSocket إضافية.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية خادم التطبيق عبر stdio المنشأة بعد أن يبني OpenClaw بيئته الموروثة. `CODEX_HOME` و`HOME` محجوزان لعزل Codex لكل وكيل في OpenClaw عند عمليات التشغيل المحلية.    |
| `requestTimeoutMs`            | `60000`                                                | مهلة استدعاءات مستوى التحكم في خادم التطبيق.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | نافذة هدوء بعد طلب خادم تطبيق Codex ذي نطاق دورة بينما ينتظر OpenClaw `turn/completed`. ارفعها لمراحل التركيب البطيئة بعد الأدوات أو الخاصة بالحالة فقط.                                                                     |
| `mode`                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو التنفيذ المراجع بواسطة guardian. متطلبات stdio المحلية التي تحذف `danger-full-access`، أو موافقة `never`، أو المراجع `user` تجعل الافتراضي الضمني guardian.                                                   |
| `approvalPolicy`              | `"never"` أو سياسة موافقة guardian مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء/استئناف/دورة السلسلة. تفضّل افتراضيات guardian `"on-request"` عندما يكون مسموحًا بها.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` أو صندوق حماية guardian مسموح به  | وضع صندوق حماية Codex الأصلي المرسل إلى بدء/استئناف السلسلة. تفضّل افتراضيات guardian `"workspace-write"` عندما يكون مسموحًا به، وإلا `"read-only"`. عندما يكون صندوق حماية OpenClaw نشطًا، تُضيَّق `danger-full-access` إلى `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` أو مراجع guardian مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون مسموحًا بذلك، وإلا `guardian_subagent` أو `user`. يظل `guardian_subagent` اسمًا مستعارًا قديمًا.                                                                      |
| `serviceTier`                 | غير معيّن                                                  | طبقة خدمة اختيارية لخادم تطبيق Codex. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة مرنة، ويمسح `null` التجاوز، وتُقبل القيمة القديمة `"fast"` باعتبارها `"priority"`.                                         |

تكون استدعاءات الأدوات الديناميكية المملوكة من OpenClaw محدودة بشكل مستقل عن
`appServer.requestTimeoutMs`: تستخدم طلبات Codex `item/tool/call` مهلة مراقبة من
OpenClaw مدتها 30 ثانية افتراضيًا. تؤدي وسيطة `timeoutMs` الموجبة لكل استدعاء إلى تمديد
أو تقصير ميزانية تلك الأداة المحددة. تستخدم أداة `image_generate` أيضًا
`agents.defaults.imageGenerationModel.timeoutMs` عندما لا يوفر استدعاء الأداة
مهلته الخاصة، وتستخدم أداة `image` الخاصة بفهم الوسائط
`tools.media.image.timeoutSeconds` أو القيمة الافتراضية للوسائط وهي 60 ثانية. تُحدَّد
ميزانيات الأدوات الديناميكية بسقف قدره 600000 مللي ثانية. عند انتهاء المهلة، يلغي
OpenClaw إشارة الأداة حيث يكون ذلك مدعومًا ويعيد استجابة أداة ديناميكية فاشلة إلى
Codex بحيث يمكن للدور أن يستمر بدلًا من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب خادم تطبيق ذي نطاق دور من Codex، يتوقع الحاضن أيضًا
من Codex أن ينهي الدور الأصلي باستخدام `turn/completed`. إذا ظل خادم التطبيق صامتًا
لمدة `appServer.turnCompletionIdleTimeoutMs` بعد تلك الاستجابة، يحاول OpenClaw قدر
الإمكان مقاطعة دور Codex، ويسجل مهلة تشخيصية، ويحرر مسار جلسة OpenClaw حتى لا
تُصف رسائل الدردشة اللاحقة خلف دور أصلي قديم. أي إشعار غير نهائي للدور نفسه، بما
في ذلك `rawResponseItem/completed`، يعطّل تلك المهلة القصيرة لأن Codex أثبت أن
الدور لا يزال حيًا؛ وتواصل مهلة الحراسة النهائية الأطول حماية الأدوار العالقة فعلًا.
لا تعيد إشعارات خادم التطبيق العامة، مثل تحديثات حدود المعدل، ضبط تقدم خمول الدور.
عندما يصدر Codex عنصر `agentMessage` مكتملًا ثم يصمت دون `turn/completed`، يتعامل
OpenClaw مع مخرجات المساعد على أنها مكتملة فعليًا، ويحاول قدر الإمكان مقاطعة دور
Codex الأصلي، ويحرر مسار الجلسة. تتضمن تشخيصات المهلة آخر طريقة إشعار من خادم
التطبيق، وبالنسبة إلى عناصر استجابة المساعد الخام، تتضمن نوع العنصر، والدور،
والمعرّف، ومعاينة محدودة لنص المساعد.

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف الثنائي المُدار عندما لا يكون
`appServer.command` مضبوطًا.

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضّل
الإعداد لعمليات النشر القابلة للتكرار لأنه يُبقي سلوك Plugin في الملف نفسه الذي
تتم مراجعته مع بقية إعداد حاضن Codex.

## Plugins الأصلية في Codex

يستخدم دعم Plugins الأصلية في Codex إمكانات التطبيق وPlugin الخاصة بخادم تطبيق
Codex نفسه داخل سلسلة Codex نفسها مثل دور حاضن OpenClaw. لا يترجم OpenClaw
Plugins في Codex إلى أدوات ديناميكية اصطناعية من OpenClaw باسم `codex_plugin_*`.

يؤثر `codexPlugins` فقط في الجلسات التي تختار حاضن Codex الأصلي. ولا يؤثر في
تشغيلات PI، أو تشغيلات مزود OpenAI العادية، أو ارتباطات محادثات ACP، أو الحواضن
الأخرى.

إعداد مُرحّل بالحد الأدنى:

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

يُحسب إعداد تطبيق السلسلة عندما ينشئ OpenClaw جلسة حاضن Codex أو يستبدل ارتباط
سلسلة Codex قديمًا. ولا يُعاد حسابه في كل دور. بعد تغيير `codexPlugins`، استخدم
`/new` أو `/reset` أو أعد تشغيل Gateway حتى تبدأ جلسات حاضن Codex المستقبلية بمجموعة
التطبيقات المحدّثة.

لمعرفة أهلية الترحيل، ومخزون التطبيقات، وسياسة الإجراءات المدمرة، وطلبات
الاستيضاح، وتشخيصات Plugin الأصلي، راجع
[Plugins الأصلية في Codex](/ar/plugins/codex-native-plugins).

## استخدام الكمبيوتر

يُغطى استخدام الكمبيوتر في دليل إعداد مستقل:
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ إجراءات سطح المكتب
بنفسه. إنه يجهز خادم تطبيق Codex، ويتحقق من توفر خادم MCP `computer-use`، ثم يترك
لـ Codex ملكية استدعاءات أدوات MCP الأصلية أثناء أدوار وضع Codex.

## حدود وقت التشغيل

يغير حاضن Codex منفذ وكيل مضمن منخفض المستوى فقط.

- أدوات OpenClaw الديناميكية مدعومة. يطلب Codex من OpenClaw تنفيذ تلك الأدوات،
  لذلك يبقى OpenClaw ضمن مسار التنفيذ.
- أدوات الصدفة، والرقع، وMCP، والتطبيقات الأصلية الخاصة بـ Codex مملوكة من Codex.
  يمكن لـ OpenClaw مراقبة أحداث أصلية محددة أو حظرها عبر الترحيل المدعوم، لكنه لا
  يعيد كتابة وسيطات الأدوات الأصلية.
- يملك Codex Compaction الأصلي. يحتفظ OpenClaw بنسخة مرآة من النص لأجل سجل القناة،
  والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو الحاضن.
- يستمر توليد الوسائط، وفهم الوسائط، وتحويل النص إلى كلام، والموافقات، ومخرجات
  أداة المراسلة عبر إعدادات مزود/نموذج OpenClaw المطابقة.
- ينطبق `tool_result_persist` على نتائج أدوات النص المملوكة من OpenClaw، وليس
  على سجلات نتائج أدوات Codex الأصلية.

لطبقات الخطافات، وأسطح V1 المدعومة، ومعالجة الأذونات الأصلية، وتوجيه قائمة الانتظار،
وآليات تحميل ملاحظات Codex، وتفاصيل Compaction، راجع
[وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime).

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كمزود `/model` عادي:** هذا متوقع في الإعدادات الجديدة. اختر نموذج
`openai/gpt-*`، وفعّل `plugins.entries.codex.enabled`، وتحقق مما إذا كان
`plugins.allow` يستبعد `codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** تأكد من أن مرجع النموذج هو `openai/gpt-*`
على مزود OpenAI الرسمي، وأن Plugin Codex مثبت ومفعّل. إذا احتجت إلى إثبات صارم
أثناء الاختبار، فاضبط `agentRuntime.id: "codex"` على مستوى المزود أو النموذج.
يفشل وقت تشغيل Codex المفروض بدلًا من الرجوع إلى PI.

**ما زال إعداد `openai-codex/*` القديم موجودًا:** شغّل `openclaw doctor --fix`.
يعيد Doctor كتابة مراجع النماذج القديمة إلى `openai/*`، ويزيل تثبيتات وقت التشغيل
القديمة للجلسة والوكيل بالكامل، ويحافظ على تجاوزات ملف تعريف المصادقة الموجودة.

**يرفض خادم التطبيق:** استخدم خادم تطبيق Codex بالإصدار `0.125.0` أو أحدث.
تُرفض الإصدارات التمهيدية ذات الإصدار نفسه أو الإصدارات ذات لاحقة البناء مثل
`0.125.0-alpha.2` أو `0.125.0+custom` لأن OpenClaw يختبر الحد الأدنى لبروتوكول
`0.125.0` المستقر.

**يتعذر على `/codex status` الاتصال:** تحقق من أن Plugin `codex` المضمّن مفعّل،
وأن `plugins.allow` يتضمنه عندما تكون قائمة السماح مضبوطة، وأن أي `appServer.command`
أو `url` أو `authToken` أو رؤوس مخصصة صالحة.

**اكتشاف النماذج بطيء:** خفّض
`plugins.entries.codex.config.discovery.timeoutMs` أو عطّل الاكتشاف. راجع
[مرجع حاضن Codex](/ar/plugins/codex-harness-reference#model-discovery).

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url`، و`authToken`، والرؤوس، وأن
خادم التطبيق البعيد يتحدث إصدار بروتوكول خادم تطبيق Codex نفسه.

**يستخدم نموذج غير Codex ‏PI:** هذا متوقع ما لم توجهه سياسة وقت تشغيل المزود أو
النموذج إلى حاضن آخر. تبقى مراجع مزودي غير OpenAI العادية على مسار مزودها المعتاد
في وضع `auto`.

**استخدام الكمبيوتر مثبت لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر ذلك، فأعد
تشغيل Gateway لمسح تسجيلات الخطافات الأصلية القديمة. راجع
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use#troubleshooting).

## ذات صلة

- [مرجع حاضن Codex](/ar/plugins/codex-harness-reference)
- [وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime)
- [Plugins الأصلية في Codex](/ar/plugins/codex-native-plugins)
- [استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use)
- [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مزود OpenAI](/ar/providers/openai)
- [Plugins حواضن الوكلاء](/ar/plugins/sdk-agent-harness)
- [خطافات Plugin](/ar/plugins/hooks)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الحالة](/ar/cli/status)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
