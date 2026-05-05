---
read_when:
    - تريد استخدام أداة app-server المرفقة مع Codex
    - تحتاج إلى أمثلة لتكوين إطار تشغيل Codex
    - تريد أن تفشل عمليات النشر التي تستخدم Codex فقط بدلًا من الرجوع إلى PI
summary: شغّل دورات وكيل OpenClaw المضمّن عبر إطار تشغيل app-server المرفق الخاص بـ Codex
title: بيئة تشغيل Codex
x-i18n:
    generated_at: "2026-05-05T01:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

تتيح Plugin `codex` المضمّنة لـ OpenClaw تشغيل دورات الوكيل المضمّنة عبر
خادم تطبيق Codex بدلاً من حزمة PI المدمجة.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف النموذج،
استئناف السلاسل الأصلية، Compaction الأصلي، وتنفيذ خادم التطبيق.
ما يزال OpenClaw يتولى قنوات الدردشة، وملفات الجلسات، واختيار النموذج، والأدوات،
والموافقات، وتسليم الوسائط، ومرآة النص المرئية.

عندما تعمل دورة دردشة مصدر عبر حزمة Codex، تكون الردود المرئية افتراضياً عبر
أداة OpenClaw `message` إذا لم يضبط النشر `messages.visibleReplies` صراحةً.
ما يزال بإمكان الوكيل إنهاء دورة Codex الخاصة به بشكل خاص؛ ولا ينشر إلى القناة
إلا عندما يستدعي `message(action="send")`. اضبط
`messages.visibleReplies: "automatic"` للإبقاء على الردود النهائية للدردشة
المباشرة في مسار التسليم التلقائي القديم.

تحصل دورات Heartbeat في Codex أيضاً على أداة `heartbeat_respond` افتراضياً، بحيث
يمكن للوكيل تسجيل ما إذا كان التنبيه يجب أن يبقى صامتاً أو يرسل إشعاراً من دون
ترميز تدفق التحكم هذا في النص النهائي.

تُرسل إرشادات المبادرة الخاصة بـ Heartbeat كتعليمة مطوّر في وضع التعاون الخاص بـ
Codex في دورة Heartbeat نفسها. تستعيد دورات الدردشة العادية وضع Codex الافتراضي
بدلاً من حمل فلسفة Heartbeat في موجه وقت التشغيل العادي.

إذا كنت تحاول تكوين صورة عامة، فابدأ بـ
[أزمنة تشغيل الوكلاء](/ar/concepts/agent-runtimes). الخلاصة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو وقت التشغيل، وتبقى Telegram
أو Discord أو Slack أو قناة أخرى هي سطح التواصل.

## إعداد سريع

يريد معظم المستخدمين الذين يرغبون في "Codex داخل OpenClaw" هذا المسار: تسجيل
الدخول باشتراك ChatGPT/Codex، ثم تشغيل دورات الوكيل المضمّنة عبر وقت تشغيل خادم
تطبيق Codex الأصلي. يبقى مرجع النموذج معيارياً كـ
`openai/gpt-*`؛ وتأتي مصادقة الاشتراك من حساب/ملف Codex، لا من بادئة نموذج
`openai-codex/*`.

سجّل الدخول أولاً باستخدام Codex OAuth إذا لم تكن قد فعلت ذلك بالفعل:

```bash
openclaw models auth login --provider openai-codex
```

ثم فعّل Plugin `codex` المضمّنة وافرض وقت تشغيل Codex:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex` هناك أيضاً:

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

لا تستخدم `openai-codex/gpt-*` عندما تقصد وقت تشغيل Codex الأصلي. تلك البادئة
هي مسار "Codex OAuth عبر PI" الصريح. تنطبق تغييرات الإعداد على الجلسات الجديدة
أو المعاد ضبطها؛ أما الجلسات الحالية فتحتفظ بوقت التشغيل المسجل لها.

## ما الذي تغيّره هذه Plugin

تضيف Plugin `codex` المضمّنة عدة قدرات منفصلة:

| القدرة                            | كيفية استخدامها                                      | ما الذي تفعله                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| وقت التشغيل المضمّن الأصلي        | `agentRuntime.id: "codex"`                          | تشغّل دورات وكلاء OpenClaw المضمّنة عبر خادم تطبيق Codex.                    |
| أوامر التحكم بالدردشة الأصلية     | `/codex bind`, `/codex resume`, `/codex steer`, ... | تربط سلاسل خادم تطبيق Codex وتتحكم بها من محادثة مراسلة.                    |
| مزود/فهرس خادم تطبيق Codex        | مكوّنات `codex` الداخلية، معروضة عبر الحزمة         | يتيح لوقت التشغيل اكتشاف نماذج خادم التطبيق والتحقق منها.                   |
| مسار فهم الوسائط في Codex         | مسارات توافق نماذج الصور `codex/*`                  | يشغّل دورات محدودة لخادم تطبيق Codex لنماذج فهم الصور المدعومة.             |
| ترحيل الخطافات الأصلي             | خطافات Plugin حول أحداث Codex الأصلية               | يتيح لـ OpenClaw مراقبة/حظر أحداث أدوات/إنهاء Codex الأصلية المدعومة.       |

يجعل تفعيل Plugin هذه القدرات متاحة. لكنه **لا** يقوم بما يلي:

- البدء باستخدام Codex لكل نموذج OpenAI
- تحويل مراجع نماذج `openai-codex/*` إلى وقت التشغيل الأصلي
- جعل ACP/acpx مسار Codex الافتراضي
- التبديل الفوري للجلسات الحالية التي سجلت بالفعل وقت تشغيل PI
- استبدال تسليم قنوات OpenClaw، أو ملفات الجلسات، أو تخزين ملفات المصادقة، أو
  توجيه الرسائل

تملك Plugin نفسها أيضاً سطح أوامر التحكم بالدردشة الأصلي `/codex`. إذا كانت
Plugin مفعّلة وطلب المستخدم الربط، أو الاستئناف، أو التوجيه، أو الإيقاف، أو فحص
سلاسل Codex من الدردشة، فيجب أن تفضّل الوكلاء `/codex ...` على ACP. يبقى ACP
هو الخيار الاحتياطي الصريح عندما يطلب المستخدم ACP/acpx أو يختبر محوّل Codex
الخاص بـ ACP.

تحافظ دورات Codex الأصلية على خطافات OpenClaw Plugin كطبقة التوافق العامة.
هذه خطافات OpenClaw داخل العملية، وليست خطافات أوامر Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` لسجلات النص المعكوسة
- `before_agent_finalize` عبر ترحيل Codex `Stop`
- `agent_end`

يمكن للـ Plugins أيضاً تسجيل وسيط نتائج أدوات محايد لوقت التشغيل لإعادة كتابة
نتائج أدوات OpenClaw الديناميكية بعد أن ينفّذ OpenClaw الأداة وقبل إرجاع النتيجة
إلى Codex. هذا منفصل عن خطاف Plugin العام `tool_result_persist`، الذي يحوّل
كتابات نتائج الأدوات في النص الذي يملكه OpenClaw.

لمعرفة دلالات خطافات Plugin نفسها، راجع [خطافات Plugin](/ar/plugins/hooks)
و[سلوك حارس Plugin](/ar/tools/plugin).

تكون الحزمة متوقفة افتراضياً. يجب أن تبقي الإعدادات الجديدة مراجع نماذج OpenAI
معيارية كـ `openai/gpt-*` وأن تفرض صراحةً
`agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex` عندما تريد
تنفيذ خادم التطبيق الأصلي. ما تزال مراجع نماذج `codex/*` القديمة تختار الحزمة
تلقائياً للتوافق، لكن بادئات المزود القديمة المدعومة بوقت التشغيل لا تظهر كخيارات
نماذج/مزودين عادية.

إذا كانت Plugin `codex` مفعّلة لكن النموذج الأساسي ما يزال
`openai-codex/*`، فسيعرض `openclaw doctor` تحذيراً بدلاً من تغيير المسار. هذا
مقصود: يبقى `openai-codex/*` مسار Codex OAuth/الاشتراك عبر PI، ويبقى تنفيذ خادم
التطبيق الأصلي اختياراً صريحاً لوقت التشغيل.

## خريطة المسارات

استخدم هذا الجدول قبل تغيير الإعداد:

| السلوك المطلوب                                     | مرجع النموذج               | إعداد وقت التشغيل                       | مسار المصادقة/الملف الشخصي | تسمية الحالة المتوقعة          |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي     | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth أو حساب Codex    | `Runtime: OpenAI Codex`        |
| OpenAI API عبر مشغّل OpenClaw العادي               | `openai/gpt-*`             | محذوف أو `runtime: "pi"`               | مفتاح OpenAI API             | `Runtime: OpenClaw Pi Default` |
| اشتراك ChatGPT/Codex عبر PI                        | `openai-codex/gpt-*`       | محذوف أو `runtime: "pi"`               | مزود OpenAI Codex OAuth      | `Runtime: OpenClaw Pi Default` |
| مزودون مختلطون مع وضع تلقائي محافظ                | مراجع خاصة بالمزود         | `agentRuntime.id: "auto"`              | لكل مزود محدد                | يعتمد على وقت التشغيل المحدد   |
| جلسة محوّل Codex ACP صريحة                         | يعتمد على موجه/نموذج ACP   | `sessions_spawn` مع `runtime: "acp"`   | مصادقة خلفية ACP             | حالة مهمة/جلسة ACP             |

الفصل المهم هو بين المزود ووقت التشغيل:

- يجيب `openai-codex/*` عن "أي مسار مزود/مصادقة يجب أن يستخدمه PI؟"
- يجيب `agentRuntime.id: "codex"` عن "أي حلقة يجب أن تنفّذ هذه الدورة
  المضمّنة؟"
- يجيب `/codex ...` عن "أي محادثة Codex أصلية يجب أن ترتبط بها هذه الدردشة
  أو تتحكم فيها؟"
- يجيب ACP عن "أي عملية حزمة خارجية يجب أن يشغّلها acpx؟"

## اختر بادئة النموذج الصحيحة

مسارات عائلة OpenAI خاصة بالبادئة. لإعداد الاشتراك الشائع مع وقت تشغيل Codex
الأصلي، استخدم `openai/*` مع `agentRuntime.id: "codex"`.
استخدم `openai-codex/*` فقط عندما تريد عمداً Codex OAuth عبر PI:

| مرجع النموذج                                  | مسار وقت التشغيل                            | استخدمه عندما                                                            |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | مزود OpenAI عبر توصيلات OpenClaw/PI         | تريد وصول OpenAI Platform API المباشر الحالي مع `OPENAI_API_KEY`.        |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth عبر OpenClaw/PI          | تريد مصادقة اشتراك ChatGPT/Codex مع مشغّل PI الافتراضي.                 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | حزمة خادم تطبيق Codex                       | تريد مصادقة اشتراك ChatGPT/Codex مع تنفيذ Codex الأصلي.                 |

يمكن أن يظهر GPT-5.5 على كل من مسارات مفتاح OpenAI API المباشر واشتراك Codex
عندما يتيحه حسابك. استخدم `openai/gpt-5.5` مع حزمة خادم تطبيق Codex لوقت تشغيل
Codex الأصلي، أو `openai-codex/gpt-5.5` لـ PI OAuth، أو
`openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex لحركة مرور مفتاح API المباشر.

تبقى مراجع `codex/gpt-*` القديمة مقبولة كأسماء مستعارة للتوافق. تعيد هجرة
توافق doctor كتابة مراجع وقت التشغيل الأساسية القديمة إلى مراجع نماذج معيارية
وتسجل سياسة وقت التشغيل بشكل منفصل، بينما تُترك المراجع القديمة الخاصة بالاحتياط
فقط من دون تغيير لأن وقت التشغيل مضبوط لحاوية الوكيل كلها.
يجب أن تستخدم إعدادات PI Codex OAuth الجديدة `openai-codex/gpt-*`؛ ويجب أن
تستخدم إعدادات حزمة خادم التطبيق الأصلية الجديدة `openai/gpt-*` بالإضافة إلى
`agentRuntime.id: "codex"`.

يتبع `agents.defaults.imageModel` الفصل نفسه في البادئات. استخدم
`openai-codex/gpt-*` عندما يجب أن يعمل فهم الصور عبر مسار مزود OpenAI
Codex OAuth. استخدم `codex/gpt-*` عندما يجب أن يعمل فهم الصور عبر دورة محدودة
لخادم تطبيق Codex. يجب أن يعلن نموذج خادم تطبيق Codex دعمه لإدخال الصور؛ تفشل
نماذج Codex النصية فقط قبل أن تبدأ دورة الوسائط.

استخدم `/status` لتأكيد الحزمة الفعلية للجلسة الحالية. إذا كان الاختيار مفاجئاً،
فعّل تسجيل التصحيح للنظام الفرعي `agents/harness` وافحص سجل Gateway المنظم
`agent harness selected`. يتضمن معرف الحزمة المحدد، وسبب الاختيار، وسياسة
وقت التشغيل/الاحتياط، وفي وضع `auto`، نتيجة دعم كل مرشح Plugin.

### معنى تحذيرات doctor

يحذّر `openclaw doctor` عندما تكون كل هذه الأمور صحيحة:

- Plugin `codex` المضمّنة مفعّلة أو مسموح بها
- النموذج الأساسي للوكيل هو `openai-codex/*`
- وقت التشغيل الفعلي لذلك الوكيل ليس `codex`

يوجد هذا التحذير لأن المستخدمين غالباً يتوقعون أن يعني "Plugin Codex مفعّلة"
"وقت تشغيل خادم تطبيق Codex الأصلي." لا يقوم OpenClaw بهذه القفزة. يعني
التحذير ما يلي:

- **لا يلزم أي تغيير** إذا كنت تقصد ChatGPT/Codex OAuth عبر PI.
- غيّر النموذج إلى `openai/<model>` واضبط
  `agentRuntime.id: "codex"` إذا كنت تقصد تنفيذ خادم التطبيق الأصلي.
- ما تزال الجلسات الحالية تحتاج إلى `/new` أو `/reset` بعد تغيير وقت التشغيل،
  لأن تثبيتات وقت تشغيل الجلسات ثابتة.

اختيار الحزمة ليس تحكماً حياً في الجلسة. عندما تعمل دورة مضمّنة، يسجل OpenClaw
معرف الحزمة المحدد في تلك الجلسة ويستمر في استخدامه للدورات اللاحقة ضمن معرف
الجلسة نفسه. غيّر إعداد `agentRuntime` أو `OPENCLAW_AGENT_RUNTIME` عندما تريد
أن تستخدم الجلسات المستقبلية حزمة أخرى؛ واستخدم `/new` أو `/reset` لبدء جلسة
جديدة قبل تبديل محادثة قائمة بين PI وCodex. يمنع هذا إعادة تشغيل نص واحد عبر
نظامي جلسات أصليين غير متوافقين.

تُعامل الجلسات القديمة التي أُنشئت قبل تثبيت harness على أنها مثبتة على PI بمجرد أن
تكون لديها محفوظات transcript. استخدم `/new` أو `/reset` لإدخال تلك المحادثة في
Codex بعد تغيير config.

يعرض `/status` بيئة تشغيل النموذج الفعالة. يظهر harness الافتراضي لـ PI على أنه
`Runtime: OpenClaw Pi Default`، ويظهر harness خادم تطبيق Codex على أنه
`Runtime: OpenAI Codex`.

## المتطلبات

- OpenClaw مع Plugin `codex` المضمن متاح.
- خادم تطبيق Codex `0.125.0` أو أحدث. يدير الـ Plugin المضمن ثنائي خادم تطبيق
  Codex متوافقًا افتراضيًا، لذلك لا تؤثر أوامر `codex` المحلية على `PATH` في
  بدء تشغيل harness العادي.
- توفر مصادقة Codex لعملية خادم التطبيق أو لجسر مصادقة Codex في OpenClaw.
  تستخدم عمليات تشغيل خادم التطبيق المحلية منزلاً لـ Codex مُدارًا من OpenClaw لكل
  agent و`HOME` ابنًا معزولًا، لذلك لا تقرأ حسابك الشخصي في
  `~/.codex` أو skills أو plugins أو config أو حالة thread أو
  `$HOME/.agents/skills` الأصلية افتراضيًا.

يحظر الـ Plugin مصافحات خادم التطبيق القديمة أو غير ذات الإصدار. وهذا يبقي
OpenClaw على سطح protocol الذي اختُبر عليه.

في اختبارات الدخان الحية وDocker، تأتي المصادقة عادةً من حساب Codex CLI
أو ملف تعريف مصادقة `openai-codex` في OpenClaw. يمكن لعمليات تشغيل خادم التطبيق
stdio المحلية أيضًا الرجوع إلى `CODEX_API_KEY` / `OPENAI_API_KEY` عندما لا
يوجد حساب.

## ملفات تمهيد مساحة العمل

يتعامل Codex مع `AGENTS.md` بنفسه من خلال اكتشاف وثائق المشروع الأصلية. لا يكتب
OpenClaw ملفات وثائق مشروع Codex اصطناعية ولا يعتمد على أسماء ملفات الرجوع في
Codex لملفات persona، لأن بدائل Codex لا تنطبق إلا عندما يكون
`AGENTS.md` مفقودًا.

لتحقيق تكافؤ مساحة عمل OpenClaw، يحل Codex harness ملفات التمهيد الأخرى
(`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و
`BOOTSTRAP.md` و`MEMORY.md` عند وجودها) ويمررها من خلال تعليمات config في
Codex عند `thread/start` و`thread/resume`. وهذا يبقي سياق persona/profile
لمساحة العمل في `SOUL.md` والملفات المرتبطة به مرئيًا من دون تكرار
`AGENTS.md`.

## إضافة Codex إلى جانب نماذج أخرى

لا تضبط `agentRuntime.id: "codex"` عموميًا إذا كان يجب أن ينتقل agent نفسه بحرية
بين Codex ونماذج موفري غير Codex. تنطبق بيئة التشغيل المفروضة على كل دور مضمن
لذلك agent أو تلك الجلسة. إذا حددت نموذج Anthropic بينما تكون تلك البيئة مفروضة،
فسيظل OpenClaw يحاول استخدام Codex harness ويفشل مغلقًا بدلًا من توجيه ذلك الدور
بصمت عبر PI.

استخدم أحد هذه الأشكال بدلًا من ذلك:

- ضع Codex على agent مخصص مع `agentRuntime.id: "codex"`.
- أبقِ agent الافتراضي على `agentRuntime.id: "auto"` وارتداد PI للاستخدام العادي
  المختلط بين الموفرين.
- استخدم مراجع `codex/*` القديمة للتوافق فقط. يجب أن تفضل الإعدادات الجديدة
  `openai/*` مع سياسة بيئة تشغيل Codex صريحة.

على سبيل المثال، يُبقي هذا agent الافتراضي على الاختيار التلقائي العادي ويضيف
agent منفصلًا لـ Codex:

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
      agentRuntime: {
        id: "auto",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

بهذا الشكل:

- يستخدم agent الافتراضي `main` مسار الموفر العادي وارتداد توافق PI.
- يستخدم agent `codex` خادم تطبيق Codex harness.
- إذا كان Codex مفقودًا أو غير مدعوم لـ agent `codex`، يفشل الدور
  بدلًا من استخدام PI بصمت.

## توجيه أوامر agent

يجب أن يوجه agents طلبات المستخدم حسب القصد، وليس حسب كلمة "Codex" وحدها:

| ما يطلبه المستخدم...                                  | ما يجب أن يستخدمه agent...                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| "اربط هذه الدردشة بـ Codex"                            | `/codex bind`                                    |
| "استأنف thread Codex `<id>` هنا"                       | `/codex resume <id>`                             |
| "اعرض threads Codex"                                  | `/codex threads`                                 |
| "افتح تقرير دعم لتشغيل Codex سيئ"                      | `/diagnostics [note]`                            |
| "أرسل ملاحظات Codex فقط لهذا thread المرفق"            | `/codex diagnostics [note]`                      |
| "استخدم اشتراكي في ChatGPT/Codex مع بيئة تشغيل Codex" | `openai/*` زائد `agentRuntime.id: "codex"`       |
| "استخدم اشتراكي في ChatGPT/Codex عبر PI"              | مراجع نموذج `openai-codex/*`                    |
| "شغّل Codex عبر ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "ابدأ Claude Code/Gemini/OpenCode/Cursor في thread"   | ACP/acpx، وليس `/codex` وليس agents فرعيين أصليين |

لا يعلن OpenClaw إرشادات ACP spawn إلى agents إلا عندما يكون ACP مفعّلًا،
وقابلًا للإرسال، ومدعومًا ببيئة تشغيل backend محملة. إذا لم يكن ACP متاحًا،
فيجب ألا يعلّم prompt النظام وSkills الـ Plugin الـ agent عن توجيه ACP.

## عمليات نشر Codex فقط

افرض Codex harness عندما تحتاج إلى إثبات أن كل دور agent مضمن يستخدم Codex.
تفشل بيئات تشغيل الـ Plugin الصريحة مغلقة ولا يُعاد تجربتها بصمت عبر PI أبدًا:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

تجاوز البيئة:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

مع فرض Codex، يفشل OpenClaw مبكرًا إذا كان Plugin Codex معطلًا، أو كان
خادم التطبيق قديمًا جدًا، أو لم يتمكن خادم التطبيق من البدء.

## Codex لكل agent

يمكنك جعل agent واحد خاصًا بـ Codex فقط بينما يحتفظ agent الافتراضي بالاختيار
التلقائي العادي:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

استخدم أوامر الجلسة العادية للتبديل بين agents والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة وينشئ Codex harness أو يستأنف thread خادم التطبيق الجانبي الخاص به
عند الحاجة. يمسح `/reset` ربط جلسة OpenClaw لذلك thread ويتيح للدور التالي حل
harness من config الحالي مرة أخرى.

## اكتشاف النماذج

افتراضيًا، يطلب Plugin Codex من خادم التطبيق النماذج المتاحة. إذا فشل
الاكتشاف أو انتهت مهلته، يستخدم كتالوج رجوع مضمنًا لـ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

يمكنك ضبط الاكتشاف ضمن `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يلتزم بكتالوج
الرجوع:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## اتصال خادم التطبيق وسياسته

افتراضيًا، يبدأ الـ Plugin ثنائي Codex المُدار من OpenClaw محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

يُشحن الثنائي المُدار مع حزمة Plugin `codex`. وهذا يبقي إصدار خادم التطبيق
مرتبطًا بالـ Plugin المضمن بدلًا من أي Codex CLI منفصل قد يكون مثبتًا محليًا.
اضبط `appServer.command` فقط عندما تريد عمدًا تشغيل ملف تنفيذي مختلف.

افتراضيًا، يبدأ OpenClaw جلسات Codex harness المحلية في وضع YOLO:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. هذا هو وضع المشغل المحلي الموثوق المستخدم
لـ Heartbeat المستقلة: يستطيع Codex استخدام أدوات shell والشبكة من دون التوقف
عند مطالبات الموافقة الأصلية التي لا يوجد أحد متاح للإجابة عنها.

للاشتراك في موافقات Codex التي يراجعها guardian، اضبط `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

يستخدم وضع Guardian مسار موافقة المراجعة التلقائية الأصلي في Codex. عندما يطلب
Codex مغادرة sandbox، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل الوصول
إلى الشبكة، يوجه Codex طلب الموافقة هذا إلى المراجع الأصلي بدلًا من مطالبة بشرية.
يطبق المراجع إطار مخاطر Codex ويوافق على الطلب المحدد أو يرفضه. استخدم Guardian
عندما تريد حواجز حماية أكثر من وضع YOLO لكنك لا تزال تحتاج إلى أن يحرز agents
غير المراقبين تقدمًا.

يتوسع preset `guardian` إلى `approvalPolicy: "on-request"` و
`approvalsReviewer: "auto_review"` و`sandbox: "workspace-write"`.
لا تزال حقول السياسة الفردية تتجاوز `mode`، لذلك يمكن لعمليات النشر المتقدمة
مزج preset مع اختيارات صريحة. لا تزال قيمة المراجع الأقدم `guardian_subagent`
مقبولة كاسم مستعار للتوافق، لكن يجب أن تستخدم الإعدادات الجديدة
`auto_review`.

بالنسبة إلى خادم تطبيق قيد التشغيل بالفعل، استخدم WebSocket transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

ترث عمليات تشغيل خادم التطبيق stdio بيئة عملية OpenClaw افتراضيًا،
لكن OpenClaw يملك جسر حساب خادم تطبيق Codex ويضبط كلاً من
`CODEX_HOME` و`HOME` على أدلة لكل agent ضمن حالة OpenClaw الخاصة بذلك agent.
يقرأ محمّل Skills الخاص بـ Codex كلاً من `$CODEX_HOME/skills` و
`$HOME/.agents/skills`، لذلك تكون القيمتان معزولتين لعمليات تشغيل خادم التطبيق
المحلية. وهذا يبقي Skills وplugins وconfig والحسابات وحالة thread الأصلية في
Codex ضمن نطاق agent في OpenClaw بدلًا من تسربها من منزل Codex CLI الشخصي
للمشغل.

لا تزال Plugins OpenClaw ولقطات Skills في OpenClaw تتدفق عبر سجل Plugin ومحمل
Skills الخاصين بـ OpenClaw. أما أصول Codex CLI الشخصية فلا. إذا كانت لديك Skills
أو plugins مفيدة في Codex CLI ويجب أن تصبح جزءًا من agent في OpenClaw، فقم
بجردها صراحةً:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ينسخ موفر ترحيل Codex الـ Skills إلى مساحة عمل agent الحالي في OpenClaw.
تُبلّغ plugins الأصلية في Codex وhooks وملفات config أو تُؤرشف للمراجعة اليدوية
بدلًا من تفعيلها تلقائيًا، لأنها يمكن أن تنفذ أوامر، أو تكشف خوادم MCP، أو تحمل
بيانات اعتماد.

تُحدد المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة Codex صريح في OpenClaw للـ agent.
2. حساب خادم التطبيق الموجود في منزل Codex لذلك agent.
3. لعمليات تشغيل خادم التطبيق stdio المحلية فقط، `CODEX_API_KEY` ثم
   `OPENAI_API_KEY`، عندما لا يوجد حساب خادم تطبيق وتظل مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الابنة التي تم spawned.
وهذا يبقي مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI
المباشرة من دون أن يجعل أدوار خادم تطبيق Codex الأصلية تُحاسب عبر API عن طريق
الخطأ. تستخدم ملفات تعريف مفاتيح API الصريحة لـ Codex وارتداد مفاتيح البيئة في
stdio المحلي تسجيل دخول خادم التطبيق بدلًا من بيئة العملية الابنة الموروثة.
لا تتلقى اتصالات خادم التطبيق WebSocket ارتداد مفاتيح API من بيئة Gateway؛
استخدم ملف تعريف مصادقة صريحًا أو حساب خادم التطبيق البعيد نفسه.

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

يؤثر `appServer.clearEnv` فقط في عملية app-server الفرعية التي يتم تشغيلها لـ Codex.

تستخدم أدوات Codex الديناميكية افتراضيًا ملف التعريف `native-first`. في هذا الوضع،
لا يكشف OpenClaw الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex:
`read` و`write` و`edit` و`apply_patch` و`exec` و`process` و
`update_plan`. تظل أدوات تكامل OpenClaw مثل المراسلة، والجلسات، والوسائط،
وCron، والمتصفح، والعُقد، وGateway، و`heartbeat_respond`، و`web_search`
متاحة.

حقول Plugin الخاصة بـ Codex المدعومة في المستوى الأعلى:

| الحقل                      | الافتراضي          | المعنى                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | استخدم `"openclaw-compat"` لكشف مجموعة أدوات OpenClaw الديناميكية الكاملة إلى Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | أسماء إضافية لأدوات OpenClaw الديناميكية المطلوب حذفها من أدوار Codex app-server.               |

حقول `appServer` المدعومة:

| الحقل               | الافتراضي                                  | المعنى                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | يشغّل `"stdio"` Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                             |
| `command`           | ثنائي Codex المُدار                     | الملف التنفيذي لنقل stdio. اتركه غير معيّن لاستخدام الثنائي المُدار؛ ولا تعيّنه إلا لتجاوز صريح.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | وسيطات نقل stdio.                                                                                                                                                                                                       |
| `url`               | غير معيّن                                    | عنوان URL لـ WebSocket app-server.                                                                                                                                                                                                            |
| `authToken`         | غير معيّن                                    | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | أسماء متغيرات بيئة إضافية تُزال من عملية stdio app-server التي يتم تشغيلها بعد أن يبني OpenClaw بيئته الموروثة. `CODEX_HOME` و`HOME` محجوزان لعزل Codex لكل وكيل في OpenClaw عند التشغيل المحلي. |
| `requestTimeoutMs`  | `60000`                                  | مهلة استدعاءات مستوى التحكم في app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | إعداد مسبق لتنفيذ YOLO أو تنفيذ بمراجعة guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | سياسة موافقة Codex الأصلية المُرسلة عند بدء/استئناف/دور الخيط.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | وضع صندوق رمل Codex الأصلي المُرسل عند بدء/استئناف الخيط.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية. يظل `guardian_subagent` اسمًا مستعارًا قديمًا.                                                                                                                         |
| `serviceTier`       | غير معيّن                                    | طبقة خدمة Codex app-server اختيارية: `"fast"` أو `"flex"` أو `null`. تُتجاهل القيم القديمة غير الصالحة.                                                                                                                            |

تُقيَّد استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw بشكل مستقل عن
`appServer.requestTimeoutMs`: يجب أن يتلقى كل طلب Codex `item/tool/call`
استجابة OpenClaw خلال 30 ثانية. عند انتهاء المهلة، يلغي OpenClaw إشارة الأداة
حيثما كان ذلك مدعومًا ويعيد استجابة أداة ديناميكية فاشلة إلى Codex كي
يستمر الدور بدلًا من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب app-server ذي نطاق دور Codex، يتوقع الحزام
أيضًا من Codex إنهاء الدور الأصلي باستخدام `turn/completed`. إذا أصبح
app-server صامتًا لمدة 60 ثانية بعد تلك الاستجابة، يقاطع OpenClaw دور Codex
بأفضل جهد، ويسجل مهلة تشخيصية، ويحرر مسار جلسة OpenClaw كي لا تُصفّ رسائل
الدردشة اللاحقة خلف دور أصلي متقادم.

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الثنائي المُدار عندما يكون
`appServer.command` غير معيّن.

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل
التكوين لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في الملف
المراجع نفسه مثل بقية إعداد حزام Codex.

## استخدام الكمبيوتر

استخدام الكمبيوتر مشروح في دليل إعداد مستقل:
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ إجراءات سطح
المكتب بنفسه. إنه يجهز Codex app-server، ويتحقق من توفر خادم MCP
`computer-use`، ثم يترك Codex يتعامل مع استدعاءات أدوات MCP الأصلية أثناء
أدوار وضع Codex.

للوصول المباشر إلى مشغل TryCua خارج تدفق سوق Codex، سجّل
`cua-driver mcp` باستخدام `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
راجع [استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use) لمعرفة الفرق
بين استخدام الكمبيوتر المملوك لـ Codex والتسجيل المباشر لـ MCP.

الحد الأدنى للتكوين:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

يمكن فحص الإعداد أو تثبيته من سطح الأوامر:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

استخدام الكمبيوتر خاص بـ macOS وقد يتطلب أذونات نظام تشغيل محلية قبل أن
يتمكن خادم Codex MCP من التحكم في التطبيقات. إذا كانت `computerUse.enabled`
تساوي true وكان خادم MCP غير متاح، تفشل أدوار وضع Codex قبل بدء الخيط بدلًا
من التشغيل بصمت دون أدوات استخدام الكمبيوتر الأصلية. راجع
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use) للاطلاع على خيارات
السوق، وحدود الفهرس البعيد، وأسباب الحالة، واستكشاف الأخطاء وإصلاحها.

عندما تكون `computerUse.autoInstall` تساوي true، يمكن لـ OpenClaw تسجيل سوق
Codex Desktop القياسي المضمّن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` إذا لم
يكتشف Codex سوقًا محليًا بعد. استخدم `/new` أو `/reset` بعد تغيير تكوين وقت
التشغيل أو استخدام الكمبيوتر كي لا تحتفظ الجلسات الحالية بربط PI أو خيط
Codex قديم.

## وصفات شائعة

Codex محلي بنقل stdio الافتراضي:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

التحقق من حزام Codex فقط:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
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

موافقات Codex بمراجعة guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

app-server بعيد مع ترويسات صريحة:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

يبقى تبديل النماذج تحت تحكم OpenClaw. عندما تكون جلسة OpenClaw مرتبطة
بخيط Codex موجود، يرسل الدور التالي نموذج OpenAI المحدد حاليًا، والمزوّد،
وسياسة الموافقة، وصندوق الرمل، وطبقة الخدمة إلى app-server مرة أخرى.
التبديل من `openai/gpt-5.5` إلى `openai/gpt-5.2` يحافظ على ربط الخيط لكنه
يطلب من Codex المتابعة بالنموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمّن `/codex` كأمر شرطة مائلة مخول. إنه عام ويعمل على أي
قناة تدعم أوامر OpenClaw النصية.

الصيغ الشائعة:

- يعرض `/codex status` اتصال خادم التطبيق المباشر، والنماذج، والحساب، وحدود المعدلات، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج خادم تطبيق Codex المباشرة.
- يسرد `/codex threads [filter]` سلاسل Codex الأخيرة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex موجودة.
- يطلب `/codex compact` من خادم تطبيق Codex إجراء Compaction للسلسلة المرتبطة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرتبطة.
- يسأل `/codex diagnostics [note]` قبل إرسال ملاحظات تشخيص Codex للسلسلة المرتبطة.
- يتحقق `/codex computer-use status` من Plugin استخدام الكمبيوتر المكوّن وخادم MCP.
- يثبّت `/codex computer-use install` Plugin استخدام الكمبيوتر المكوّن ويعيد تحميل خوادم MCP.
- يعرض `/codex account` حالة الحساب وحدود المعدلات.
- يسرد `/codex mcp` حالة خادم MCP الخاص بخادم تطبيق Codex.
- يسرد `/codex skills` Skills خادم تطبيق Codex.

عندما يبلّغ Codex عن فشل بسبب حد الاستخدام، يضمّن OpenClaw وقت إعادة تعيين
خادم التطبيق التالي عندما يوفّره Codex. استخدم `/codex account` في المحادثة نفسها
لفحص الحساب الحالي ونوافذ حدود المعدلات.

### سير عمل التصحيح الشائع

عندما يفعل وكيل مدعوم من Codex شيئًا مفاجئًا في Telegram أو Discord أو Slack
أو قناة أخرى، ابدأ بالمحادثة التي حدثت فيها المشكلة:

1. شغّل `/diagnostics bad tool choice after image upload` أو ملاحظة قصيرة أخرى
   تصف ما رأيته.
2. وافق على طلب التشخيص مرة واحدة. تنشئ الموافقة ملف zip لتشخيصات Gateway
   المحلي، وبما أن الجلسة تستخدم إطار Codex، فإنها ترسل أيضًا
   حزمة ملاحظات Codex ذات الصلة إلى خوادم OpenAI.
3. انسخ رد التشخيص المكتمل إلى تقرير الخطأ أو سلسلة الدعم.
   يتضمن مسار الحزمة المحلية، وملخص الخصوصية، ومعرّفات جلسات OpenClaw،
   ومعرّفات سلاسل Codex، وسطر `Inspect locally` لكل سلسلة Codex.
4. إذا أردت تصحيح التشغيل بنفسك، فشغّل أمر `Inspect locally` المطبوع
   في الطرفية. يبدو مثل `codex resume <thread-id>` ويفتح
   سلسلة Codex الأصلية حتى تتمكن من فحص المحادثة، أو متابعتها محليًا،
   أو سؤال Codex عن سبب اختياره أداة أو خطة معينة.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدًا رفع ملاحظات Codex
للسلسلة المرتبطة حاليًا من دون حزمة تشخيصات OpenClaw Gateway الكاملة.
بالنسبة لمعظم تقارير الدعم، تكون `/diagnostics [note]` نقطة البداية الأفضل
لأنها تربط حالة Gateway المحلية ومعرّفات سلاسل Codex معًا في رد واحد. راجع [تصدير التشخيصات](/ar/gateway/diagnostics)
للاطلاع على نموذج الخصوصية الكامل وسلوك محادثات المجموعات.

يكشف OpenClaw الأساسي أيضًا الأمر `/diagnostics [note]` المخصص للمالك فقط كأمر
تشخيصات Gateway العام. يعرض طلب الموافقة الخاص به تمهيد البيانات الحساسة،
ويربط إلى [تصدير التشخيصات](/ar/gateway/diagnostics)، ويطلب
`openclaw gateway diagnostics export --json` عبر موافقة تنفيذ صريحة
في كل مرة. لا توافق على التشخيصات بقاعدة سماح شاملة. بعد الموافقة،
يرسل OpenClaw تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلية وملخص
البيان. عندما تستخدم جلسة OpenClaw النشطة إطار Codex، فإن
الموافقة نفسها تخوّل أيضًا إرسال حزم ملاحظات Codex ذات الصلة إلى
خوادم OpenAI. يذكر طلب الموافقة أن ملاحظات Codex ستُرسل، لكنه
لا يسرد معرّفات جلسات Codex أو سلاسله قبل الموافقة.

إذا استدعى مالك `/diagnostics` في محادثة جماعية، يحافظ OpenClaw على نظافة
القناة المشتركة: تتلقى المجموعة إشعارًا قصيرًا فقط، بينما تُرسل
مقدمة التشخيصات، وطلبات الموافقة، ومعرّفات جلسات/سلاسل Codex إلى
المالك عبر مسار الموافقة الخاص. إذا لم يكن هناك مسار خاص للمالك،
يرفض OpenClaw طلب المجموعة ويطلب من المالك تشغيله من رسالة مباشرة.

يستدعي رفع Codex الموافق عليه نقطة `feedback/upload` في خادم تطبيق Codex ويطلب
من خادم التطبيق تضمين السجلات لكل سلسلة مدرجة وسلاسل Codex الفرعية المنشأة
عندما تكون متاحة. يمر الرفع عبر مسار ملاحظات Codex المعتاد إلى خوادم OpenAI؛
إذا كانت ملاحظات Codex معطلة في خادم التطبيق ذلك، يعيد الأمر
خطأ خادم التطبيق. يسرد رد التشخيصات المكتمل القنوات،
ومعرّفات جلسات OpenClaw، ومعرّفات سلاسل Codex، وأوامر
`codex resume <thread-id>` المحلية للسلاسل التي أُرسلت. إذا رفضت الموافقة
أو تجاهلتها، لا يطبع OpenClaw معرّفات Codex تلك. لا يحل هذا الرفع محل
تصدير تشخيصات Gateway المحلي.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي يستخدمه الإطار
للأدوار العادية. في الرسالة التالية، يستأنف OpenClaw سلسلة Codex تلك، ويمرر
نموذج OpenClaw المحدد حاليًا إلى خادم التطبيق، ويحافظ على تفعيل السجل
الممتد.

### فحص سلسلة Codex من CLI

أسرع طريقة لفهم تشغيل Codex سيئ غالبًا هي فتح سلسلة Codex الأصلية
مباشرة:

```sh
codex resume <thread-id>
```

استخدم هذا عندما تلاحظ خطأ في محادثة قناة وتريد فحص جلسة Codex
الإشكالية، أو متابعتها محليًا، أو سؤال Codex عن سبب اتخاذه
اختيارًا معينًا للأداة أو الاستدلال. عادةً ما يكون المسار الأسهل هو تشغيل
`/diagnostics [note]` أولًا: بعد الموافقة عليه، يسرد التقرير المكتمل
كل سلسلة Codex ويطبع أمر `Inspect locally`، مثل
`codex resume <thread-id>`. يمكنك نسخ ذلك الأمر مباشرة إلى الطرفية.

يمكنك أيضًا الحصول على معرّف سلسلة من `/codex binding` للمحادثة الحالية أو
`/codex threads [filter]` لسلاسل خادم تطبيق Codex الأخيرة، ثم تشغيل أمر
`codex resume` نفسه في الصدفة.

يتطلب سطح الأوامر خادم تطبيق Codex بإصدار `0.125.0` أو أحدث. تُبلّغ
طرق التحكم الفردية كـ `unsupported by this Codex app-server` إذا كان
خادم تطبيق مستقبلي أو مخصص لا يكشف طريقة JSON-RPC تلك.

## حدود الخطافات

يحتوي إطار Codex على ثلاث طبقات خطافات:

| الطبقة                                 | المالك                    | الغرض                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| خطافات Plugin في OpenClaw                 | OpenClaw                 | توافق المنتج/Plugin عبر إطاري PI وCodex.         |
| وسيط امتداد خادم تطبيق Codex | Plugins المضمنة في OpenClaw | سلوك المهايئ لكل دور حول أدوات OpenClaw الديناميكية.            |
| خطافات Codex الأصلية                    | Codex                    | دورة حياة Codex منخفضة المستوى وسياسة الأدوات الأصلية من إعدادات Codex. |

لا يستخدم OpenClaw ملفات Codex `hooks.json` الخاصة بالمشروع أو العامة لتوجيه
سلوك Plugin في OpenClaw. بالنسبة إلى جسر الأدوات والأذونات الأصلي المدعوم،
يحقن OpenClaw إعدادات Codex لكل سلسلة من أجل `PreToolUse` و`PostToolUse`
و`PermissionRequest` و`Stop`. تبقى خطافات Codex الأخرى مثل `SessionStart` و
`UserPromptSubmit` عناصر تحكم على مستوى Codex؛ ولا تُكشف كخطافات
Plugin في OpenClaw ضمن عقد v1.

بالنسبة إلى أدوات OpenClaw الديناميكية، ينفذ OpenClaw الأداة بعد أن يطلب Codex
الاستدعاء، لذلك يطلق OpenClaw سلوك Plugin والوسيط الذي يملكه في
مهايئ الإطار. بالنسبة إلى أدوات Codex الأصلية، يمتلك Codex سجل الأداة المعتمد.
يمكن لـ OpenClaw عكس أحداث محددة، لكنه لا يستطيع إعادة كتابة سلسلة Codex
الأصلية إلا إذا كشف Codex تلك العملية عبر خادم التطبيق أو ردود استدعاء
الخطافات الأصلية.

تأتي إسقاطات Compaction ودورة حياة LLM من إشعارات خادم تطبيق Codex
وحالة مهايئ OpenClaw، وليس من أوامر خطافات Codex الأصلية.
أحداث `before_compaction` و`after_compaction` و`llm_input` و
`llm_output` في OpenClaw هي ملاحظات على مستوى المهايئ، وليست لقطات مطابقة
بايتًا ببايت لطلب Codex الداخلي أو حمولات Compaction.

تُسقط إشعارات خادم تطبيق Codex الأصلية `hook/started` و`hook/completed`
كأحداث وكيل `codex_app_server.hook` للمسار والتصحيح.
لا تستدعي هذه الإشعارات خطافات Plugin في OpenClaw.

## عقد دعم V1

وضع Codex ليس PI مع استدعاء نموذج مختلف تحته. يمتلك Codex جزءًا أكبر من
حلقة النموذج الأصلية، ويكيّف OpenClaw أسطح Plugin والجلسة الخاصة به
حول ذلك الحد.

مدعوم في وقت تشغيل Codex v1:

| السطح                                       | الدعم                                 | السبب                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقة نموذج OpenAI عبر Codex               | مدعوم                               | يمتلك خادم تطبيق Codex دور OpenAI، واستئناف السلسلة الأصلية، ومتابعة الأداة الأصلية.                                                                                                            |
| توجيه قنوات OpenClaw والتسليم         | مدعوم                               | تبقى Telegram وDiscord وSlack وWhatsApp وiMessage والقنوات الأخرى خارج وقت تشغيل النموذج.                                                                                                      |
| أدوات OpenClaw الديناميكية                        | مدعوم                               | يطلب Codex من OpenClaw تنفيذ هذه الأدوات، لذلك يبقى OpenClaw في مسار التنفيذ.                                                                                                                  |
| Plugins المطالبة والسياق                    | مدعوم                               | يبني OpenClaw تراكبات المطالبة ويسقط السياق في دور Codex قبل بدء السلسلة أو استئنافها.                                                                                      |
| دورة حياة محرك السياق                      | مدعوم                               | التجميع، والاستيعاب أو صيانة ما بعد الدور، وتنسيق Compaction لمحرك السياق تعمل لأدوار Codex.                                                                                           |
| خطافات الأدوات الديناميكية                            | مدعوم                               | تعمل `before_tool_call` و`after_tool_call` ووسيط نتيجة الأداة حول أدوات OpenClaw الديناميكية المملوكة له.                                                                                            |
| خطافات دورة الحياة                               | مدعومة كملاحظات مهايئ       | تنطلق `llm_input` و`llm_output` و`agent_end` و`before_compaction` و`after_compaction` بحمولات صادقة لوضع Codex.                                                                             |
| بوابة مراجعة الإجابة النهائية                    | مدعومة عبر مرحّل الخطاف الأصلي | يُرحّل `Stop` في Codex إلى `before_agent_finalize`؛ وتطلب `revise` من Codex تمريرة نموذج أخرى قبل الإنهاء.                                                                                  |
| حظر أو ملاحظة الصدفة الأصلية، والتصحيح، وMCP | مدعوم عبر مرحّل الخطاف الأصلي | تُرحّل `PreToolUse` و`PostToolUse` في Codex لأسطح الأدوات الأصلية المعتمدة، بما في ذلك حمولات MCP على خادم تطبيق Codex `0.125.0` أو أحدث. الحظر مدعوم؛ أما إعادة كتابة الوسائط فليست مدعومة. |
| سياسة الأذونات الأصلية                      | مدعومة عبر مرحّل الخطاف الأصلي | يمكن توجيه `PermissionRequest` في Codex عبر سياسة OpenClaw حيث يكشفها وقت التشغيل. إذا لم يُرجع OpenClaw أي قرار، يواصل Codex عبر مسار الحارس أو موافقة المستخدم المعتاد.     |
| التقاط مسار خادم التطبيق                 | مدعوم                               | يسجل OpenClaw الطلب الذي أرسله إلى خادم التطبيق وإشعارات خادم التطبيق التي يتلقاها.                                                                                                      |

غير مدعوم في وقت تشغيل Codex v1:

| السطح                                             | حدود V1                                                                                                                                     | المسار المستقبلي                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تعديل وسيطات الأداة الأصلية                       | يمكن لخطافات Codex الأصلية قبل الأداة الحظر، لكن OpenClaw لا يعيد كتابة وسيطات أدوات Codex الأصلية.                                               | يتطلب دعم خطاف/مخطط Codex لاستبدال دخل الأداة.                            |
| سجل محادثة Codex الأصلي القابل للتحرير            | يملك Codex سجل السلسلة الأصلي المعتمد. يملك OpenClaw مرآة ويمكنه إسقاط سياق مستقبلي، لكن ينبغي ألا يعدل داخليات غير مدعومة. | إضافة واجهات API صريحة لخادم تطبيق Codex إذا كانت جراحة السلسلة الأصلية مطلوبة.                    |
| `tool_result_persist` لسجلات أدوات Codex الأصلية | يحوّل ذلك الخطاف كتابات سجل المحادثة المملوكة لـ OpenClaw، لا سجلات أدوات Codex الأصلية.                                                           | يمكن عكس السجلات المحوّلة، لكن إعادة الكتابة المعتمدة تحتاج إلى دعم Codex.              |
| بيانات تعريفية غنية لـ Compaction الأصلية        | يرصد OpenClaw بدء Compaction واكتماله، لكنه لا يتلقى قائمة ثابتة بالمحتفظ به/المسقط، أو فرق رموز، أو حمولة ملخص.            | يحتاج إلى أحداث Compaction أغنى من Codex.                                                     |
| التدخل في Compaction                             | خطافات Compaction الحالية في OpenClaw على مستوى الإشعار في وضع Codex.                                                                         | إضافة خطافات Codex قبل/بعد Compaction إذا احتاجت Plugins إلى الاعتراض أو إعادة كتابة Compaction الأصلي. |
| التقاط طلب API النموذج بايتًا ببايت              | يستطيع OpenClaw التقاط طلبات وإشعارات خادم التطبيق، لكن نواة Codex تبني طلب OpenAI API النهائي داخليًا.                      | يحتاج إلى حدث تتبع طلب نموذج في Codex أو API تصحيح.                                   |

## الأدوات والوسائط وCompaction

يغيّر مشغل Codex منفّذ الوكيل المضمّن منخفض المستوى فقط.

ما يزال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
المشغل. يستمر النص والصور والفيديو والموسيقى وTTS والموافقات ومخرجات أدوات
المراسلة عبر مسار التسليم الطبيعي في OpenClaw.

مرحل الخطافات الأصلي عام عن قصد، لكن عقد دعم v1
محدود بمسارات أدوات Codex الأصلية والأذونات التي يختبرها OpenClaw. في
وقت تشغيل Codex، يشمل ذلك حمولات shell وpatch وMCP `PreToolUse`،
و`PostToolUse`، و`PermissionRequest`. لا تفترض أن كل حدث خطاف
مستقبلي من Codex هو سطح Plugin في OpenClaw إلى أن يسميه عقد وقت التشغيل.

بالنسبة إلى `PermissionRequest`، لا يعيد OpenClaw إلا قرارات السماح أو الرفض الصريحة
عندما تقرر السياسة ذلك. نتيجة عدم وجود قرار ليست سماحًا. يتعامل معها Codex كعدم
وجود قرار من الخطاف ويتابع إلى مسار الحارس الخاص به أو موافقة المستخدم.

تُوجّه طلبات استيضاح موافقة أدوات Codex MCP عبر تدفق موافقات Plugin في OpenClaw
عندما يوسم Codex `_meta.codex_approval_kind` بالقيمة
`"mcp_tool_call"`. تُرسل مطالبات Codex `request_user_input` إلى المحادثة
المنشئة، وتجيب رسالة المتابعة التالية في الطابور عن طلب الخادم الأصلي هذا
بدلًا من توجيهها كسياق إضافي. ما تزال طلبات استيضاح MCP الأخرى تفشل بإغلاق آمن.

يتطابق توجيه طابور التشغيل النشط مع `turn/steer` في خادم تطبيق Codex. مع
الإعداد الافتراضي `messages.queue.mode: "steer"`، يجمع OpenClaw رسائل الدردشة
الموضوعة في الطابور خلال نافذة الهدوء المكوّنة ويرسلها كطلب `turn/steer` واحد
بترتيب الوصول. يرسل وضع `queue` القديم طلبات `turn/steer` منفصلة. قد ترفض
منعطفات مراجعة Codex وCompaction اليدوي التوجيه في المنعطف نفسه، وفي هذه الحالة
يستخدم OpenClaw طابور المتابعة عندما يسمح الوضع المحدد بالرجوع الاحتياطي. راجع
[طابور التوجيه](/ar/concepts/queue-steering).

عندما يستخدم النموذج المحدد مشغل Codex، يُفوّض Compaction للسلسلة الأصلية
إلى خادم تطبيق Codex. يحتفظ OpenClaw بمرآة سجل محادثة لسجل القناة،
والبحث، و`/new`، و`/reset`، وتبديل النموذج أو المشغل مستقبلًا. تتضمن
المرآة مطالبة المستخدم، ونص المساعد النهائي، وسجلات خفيفة لاستدلال Codex
أو خطته عندما يصدرها خادم التطبيق. اليوم، لا يسجل OpenClaw إلا إشارات
بدء Compaction الأصلي واكتماله. وهو لا يتيح بعد ملخص Compaction قابلًا للقراءة
البشرية أو قائمة قابلة للتدقيق بالمدخلات التي احتفظ بها Codex بعد Compaction.

لأن Codex يملك السلسلة الأصلية المعتمدة، لا يعيد `tool_result_persist` حاليًا
كتابة سجلات نتائج أدوات Codex الأصلية. ولا يطبق إلا عندما يكتب OpenClaw نتيجة
أداة سجل محادثة جلسة مملوكة لـ OpenClaw.

لا يتطلب توليد الوسائط PI. تستمر الصور والفيديو والموسيقى وPDF وTTS وفهم الوسائط
في استخدام إعدادات الموفر/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel`، و`videoGenerationModel`، و`pdfModel`، و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كموفر `/model` عادي:** هذا متوقع للإعدادات الجديدة. اختر نموذج
`openai/gpt-*` مع `agentRuntime.id: "codex"` (أو مرجع `codex/*` قديم)، وفعّل
`plugins.entries.codex.enabled`، وتحقق مما إذا كان `plugins.allow` يستبعد
`codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** يمكن أن يستمر `agentRuntime.id: "auto"` في استخدام PI كخلفية
توافق عندما لا يطالب أي مشغل Codex بالتشغيل. اضبط
`agentRuntime.id: "codex"` لفرض اختيار Codex أثناء الاختبار. يفشل وقت تشغيل
Codex المفروض بدلًا من الرجوع إلى PI. بمجرد اختيار خادم تطبيق Codex،
تظهر إخفاقاته مباشرة.

**يُرفض خادم التطبيق:** رقّ Codex حتى تبلغ مصافحة خادم التطبيق عن الإصدار
`0.125.0` أو أحدث. تُرفض إصدارات ما قبل الإصدار أو الإصدارات ذات لاحقة البناء
من الإصدار نفسه مثل `0.125.0-alpha.2` أو `0.125.0+custom` لأن أرضية بروتوكول
`0.125.0` المستقرة هي ما يختبره OpenClaw.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url` و`authToken`،
ومن أن خادم التطبيق البعيد يتحدث إصدار بروتوكول خادم تطبيق Codex نفسه.

**يستخدم نموذج غير Codex نظام PI:** هذا متوقع ما لم تكن قد فرضت
`agentRuntime.id: "codex"` لذلك الوكيل أو اخترت مرجع `codex/*` قديمًا. تبقى مراجع
`openai/gpt-*` العادية ومراجع الموفرين الآخرين على مسار الموفر الطبيعي في وضع
`auto`. إذا فرضت `agentRuntime.id: "codex"`، فيجب أن يكون كل منعطف مضمّن
لذلك الوكيل نموذج OpenAI مدعومًا من Codex.

**Computer Use مثبت لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر ذلك، فأعد تشغيل
Gateway لمسح تسجيلات الخطافات الأصلية القديمة. إذا انتهت مهلة `computer-use.list_apps`،
فأعد تشغيل Codex Computer Use أو Codex Desktop ثم أعد المحاولة.

## ذو صلة

- [Plugins مشغل الوكيل](/ar/plugins/sdk-agent-harness)
- [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [موفرو النماذج](/ar/concepts/model-providers)
- [موفر OpenAI](/ar/providers/openai)
- [الحالة](/ar/cli/status)
- [خطافات Plugin](/ar/plugins/hooks)
- [مرجع التكوين](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
