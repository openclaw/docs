---
read_when:
    - تريد استخدام أداة تشغيل app-server المضمّنة مع Codex
    - تحتاج إلى أمثلة تكوين حاضنة Codex
    - تريد أن تفشل عمليات النشر المخصصة لـ Codex فقط بدلاً من الرجوع إلى PI
summary: شغّل دورات وكيل OpenClaw المضمّن عبر إطار تشغيل خادم التطبيقات المرفق في Codex
title: بيئة تشغيل Codex
x-i18n:
    generated_at: "2026-05-03T07:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

تتيح Plugin `codex` المضمنة لـ OpenClaw تشغيل دورات الوكيل المضمنة عبر
خادم تطبيق Codex بدلًا من حزمة PI المضمنة.

استخدم هذا عندما تريد أن يمتلك Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النموذج، واستئناف الخيط الأصلي، وCompaction الأصلي، وتنفيذ خادم التطبيق.
يظل OpenClaw مسؤولًا عن قنوات الدردشة، وملفات الجلسة، واختيار النماذج، والأدوات،
والموافقات، وتسليم الوسائط، ومرآة النص المرئية.

عندما تعمل دورة دردشة مصدر عبر حزمة Codex، تكون الردود المرئية افتراضيًا
من خلال أداة OpenClaw `message` إذا لم يضبط النشر صراحةً
`messages.visibleReplies`. لا يزال بإمكان الوكيل إنهاء دورة Codex الخاصة به
بشكل خاص؛ ولا ينشر إلى القناة إلا عندما يستدعي `message(action="send")`. عيّن
`messages.visibleReplies: "automatic"` للإبقاء على ردود الدردشة المباشرة النهائية
في مسار التسليم التلقائي القديم.

تحصل دورات Heartbeat في Codex أيضًا على أداة `heartbeat_respond` افتراضيًا، حتى
يستطيع الوكيل تسجيل ما إذا كان ينبغي للإيقاظ أن يبقى صامتًا أو يرسل إشعارًا دون
ترميز تدفق التحكم هذا في النص النهائي.

إذا كنت تحاول تحديد السياق، فابدأ من
[بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو وقت التشغيل، وتظل Telegram،
Discord، Slack، أو قناة أخرى هي سطح التواصل.

## الإعداد السريع

يريد معظم المستخدمين الذين يريدون "Codex في OpenClaw" هذا المسار: تسجيل الدخول
باشتراك ChatGPT/Codex، ثم تشغيل دورات الوكيل المضمنة عبر وقت تشغيل خادم تطبيق
Codex الأصلي. يظل مرجع النموذج أساسيًا بصيغة `openai/gpt-*`؛ تأتي مصادقة
الاشتراك من حساب/ملف Codex، لا من بادئة نموذج `openai-codex/*`.

سجّل الدخول أولًا باستخدام Codex OAuth إذا لم تكن قد فعلت ذلك بالفعل:

```bash
openclaw models auth login --provider openai-codex
```

ثم فعّل Plugin `codex` المضمنة وافرض وقت تشغيل Codex:

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

إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex` هناك أيضًا:

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
أو المعاد ضبطها؛ وتحتفظ الجلسات الحالية بوقت التشغيل المسجل لديها.

## ما الذي تغيّره هذه Plugin

تضيف Plugin `codex` المضمنة عدة قدرات منفصلة:

| القدرة                        | كيف تستخدمها                                      | ما تفعله                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| وقت تشغيل أصلي مضمن           | `agentRuntime.id: "codex"`                          | يشغّل دورات وكيل OpenClaw المضمنة عبر خادم تطبيق Codex.                  |
| أوامر تحكم دردشة أصلية      | `/codex bind`, `/codex resume`, `/codex steer`, ... | يربط خيوط خادم تطبيق Codex ويتحكم بها من محادثة مراسلة.    |
| مزود/كتالوج خادم تطبيق Codex | داخليات `codex`، ظاهرة عبر الحزمة     | يتيح لوقت التشغيل اكتشاف نماذج خادم التطبيق والتحقق منها.                     |
| مسار فهم الوسائط في Codex    | مسارات توافق نماذج الصور `codex/*`           | يشغّل دورات محدودة لخادم تطبيق Codex لنماذج فهم الصور المدعومة. |
| ترحيل خطاف أصلي                 | خطافات Plugin حول أحداث Codex الأصلية             | يتيح لـ OpenClaw مراقبة/حظر أحداث أدوات/إنهاء Codex الأصلية المدعومة.  |

يجعل تفعيل Plugin هذه القدرات متاحة. لكنه **لا**:

- يبدأ باستخدام Codex لكل نموذج OpenAI
- يحوّل مراجع نماذج `openai-codex/*` إلى وقت التشغيل الأصلي
- يجعل ACP/acpx مسار Codex الافتراضي
- يبدّل الجلسات الحالية فورًا إذا كانت قد سجلت وقت تشغيل PI بالفعل
- يستبدل تسليم قنوات OpenClaw، أو ملفات الجلسة، أو تخزين ملفات المصادقة، أو
  توجيه الرسائل

تملك Plugin نفسها أيضًا سطح أوامر التحكم بالدردشة الأصلي `/codex`. إذا كانت
Plugin مفعّلة وطلب المستخدم الربط، أو الاستئناف، أو التوجيه، أو الإيقاف، أو فحص
خيوط Codex من الدردشة، فينبغي للوكلاء تفضيل `/codex ...` على ACP. يبقى ACP
الخيار الاحتياطي الصريح عندما يطلب المستخدم ACP/acpx أو يختبر محول ACP الخاص
بـ Codex.

تحافظ دورات Codex الأصلية على خطافات Plugin في OpenClaw كطبقة التوافق العامة.
هذه خطافات OpenClaw داخل العملية، وليست خطافات أوامر Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` لسجلات النص المعكوسة
- `before_agent_finalize` عبر ترحيل `Stop` في Codex
- `agent_end`

يمكن لـ Plugins أيضًا تسجيل وسيط نتائج أدوات محايد لوقت التشغيل لإعادة كتابة
نتائج أدوات OpenClaw الديناميكية بعد أن ينفّذ OpenClaw الأداة وقبل إرجاع
النتيجة إلى Codex. هذا منفصل عن خطاف Plugin العام
`tool_result_persist`، الذي يحوّل كتابات نتائج الأدوات في النص الذي يملكه
OpenClaw.

للاطلاع على دلالات خطافات Plugin نفسها، راجع [خطافات Plugin](/ar/plugins/hooks)
و[سلوك حارس Plugin](/ar/tools/plugin).

الحزمة متوقفة افتراضيًا. ينبغي للإعدادات الجديدة إبقاء مراجع نماذج OpenAI
أساسية بصيغة `openai/gpt-*` وفرض
`agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex` صراحةً عندما
تريد تنفيذ خادم التطبيق الأصلي. لا تزال مراجع النماذج القديمة `codex/*` تختار
الحزمة تلقائيًا للتوافق، لكن بادئات المزود القديمة المدعومة بوقت التشغيل لا تظهر
كخيارات نماذج/مزودين عادية.

إذا كانت Plugin `codex` مفعّلة لكن النموذج الأساسي لا يزال
`openai-codex/*`، فإن `openclaw doctor` يصدر تحذيرًا بدلًا من تغيير المسار. هذا
متعمد: يظل `openai-codex/*` مسار PI الخاص بـ Codex OAuth/الاشتراك، ويبقى تنفيذ
خادم التطبيق الأصلي اختيار وقت تشغيل صريحًا.

## خريطة المسارات

استخدم هذا الجدول قبل تغيير الإعداد:

| السلوك المطلوب                                     | مرجع النموذج                  | إعداد وقت التشغيل                         | مسار المصادقة/الملف           | تسمية الحالة المتوقعة          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex أصلي | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth أو حساب Codex | `Runtime: OpenAI Codex`        |
| OpenAI API عبر مشغّل OpenClaw العادي            | `openai/gpt-*`             | محذوف أو `runtime: "pi"`             | مفتاح OpenAI API               | `Runtime: OpenClaw Pi Default` |
| اشتراك ChatGPT/Codex عبر PI                | `openai-codex/gpt-*`       | محذوف أو `runtime: "pi"`             | مزود OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| مزودون مختلطون مع وضع تلقائي محافظ          | مراجع خاصة بالمزود     | `agentRuntime.id: "auto"`              | حسب المزود المحدد        | يعتمد على وقت التشغيل المحدد    |
| جلسة محول Codex ACP صريحة                   | يعتمد على ACP prompt/model | `sessions_spawn` مع `runtime: "acp"` | مصادقة خلفية ACP             | حالة مهمة/جلسة ACP        |

الفصل المهم هو بين المزود ووقت التشغيل:

- يجيب `openai-codex/*` عن "أي مسار مزود/مصادقة يجب أن يستخدمه PI؟"
- يجيب `agentRuntime.id: "codex"` عن "أي حلقة يجب أن تنفّذ هذه الدورة
  المضمنة؟"
- يجيب `/codex ...` عن "أي محادثة Codex أصلية يجب أن تربطها هذه الدردشة
  أو تتحكم بها؟"
- يجيب ACP عن "أي عملية حزمة خارجية يجب أن يطلقها acpx؟"

## اختر بادئة النموذج الصحيحة

مسارات عائلة OpenAI خاصة بالبادئات. للإعداد الشائع المكوّن من اشتراك مع
وقت تشغيل Codex الأصلي، استخدم `openai/*` مع `agentRuntime.id: "codex"`.
استخدم `openai-codex/*` فقط عندما تريد عن قصد Codex OAuth عبر PI:

| مرجع النموذج                                     | مسار وقت التشغيل                                 | استخدمه عندما                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | مزود OpenAI عبر بنية OpenClaw/PI | تريد وصول OpenAI Platform API المباشر الحالي باستخدام `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth عبر OpenClaw/PI       | تريد مصادقة اشتراك ChatGPT/Codex مع مشغّل PI الافتراضي.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | حزمة خادم تطبيق Codex                     | تريد مصادقة اشتراك ChatGPT/Codex مع تنفيذ Codex الأصلي.     |

يمكن أن يظهر GPT-5.5 في كل من مسارات مفتاح OpenAI API المباشر ومسارات اشتراك
Codex عندما يتيحها حسابك. استخدم `openai/gpt-5.5` مع حزمة خادم تطبيق Codex
لوقت تشغيل Codex الأصلي، أو `openai-codex/gpt-5.5` من أجل PI OAuth، أو
`openai/gpt-5.5` دون تجاوز وقت تشغيل Codex لحركة مفاتيح API المباشرة.

تظل مراجع `codex/gpt-*` القديمة مقبولة كأسماء مستعارة للتوافق. تعيد هجرة توافق
doctor كتابة مراجع وقت التشغيل الأساسية القديمة إلى مراجع نماذج أساسية وتسجل
سياسة وقت التشغيل منفصلة، بينما تُترك المراجع القديمة الخاصة بالاحتياطي فقط دون
تغيير لأن وقت التشغيل مضبوط لحاوية الوكيل كلها. ينبغي لإعدادات PI Codex OAuth
الجديدة استخدام `openai-codex/gpt-*`؛ وينبغي لإعدادات حزمة خادم التطبيق الأصلية
الجديدة استخدام `openai/gpt-*` مع `agentRuntime.id: "codex"`.

يتبع `agents.defaults.imageModel` الفصل نفسه في البادئات. استخدم
`openai-codex/gpt-*` عندما ينبغي أن يعمل فهم الصور عبر مسار مزود OpenAI
Codex OAuth. استخدم `codex/gpt-*` عندما ينبغي أن يعمل فهم الصور عبر دورة
محدودة لخادم تطبيق Codex. يجب أن يعلن نموذج خادم تطبيق Codex دعم إدخال الصور؛
تفشل نماذج Codex النصية فقط قبل بدء دورة الوسائط.

استخدم `/status` لتأكيد الحزمة الفعالة للجلسة الحالية. إذا كان الاختيار مفاجئًا،
فعّل تسجيل التصحيح للنظام الفرعي `agents/harness` وافحص سجل Gateway المنظم
`agent harness selected`. يتضمن ذلك معرف الحزمة المحددة، وسبب الاختيار، وسياسة
وقت التشغيل/الاحتياطي، وفي وضع `auto`، نتيجة دعم كل مرشح Plugin.

### ماذا تعني تحذيرات doctor

يحذر `openclaw doctor` عندما تكون كل هذه الأمور صحيحة:

- Plugin `codex` المضمنة مفعّلة أو مسموح بها
- النموذج الأساسي لوكيل هو `openai-codex/*`
- وقت التشغيل الفعال لذلك الوكيل ليس `codex`

يوجد هذا التحذير لأن المستخدمين غالبًا يتوقعون أن يعني "Plugin Codex مفعّلة"
"وقت تشغيل خادم تطبيق Codex الأصلي." لا يتخذ OpenClaw تلك القفزة. يعني التحذير:

- **لا يلزم أي تغيير** إذا كنت تقصد ChatGPT/Codex OAuth عبر PI.
- غيّر النموذج إلى `openai/<model>` واضبط
  `agentRuntime.id: "codex"` إذا كنت تقصد تنفيذ خادم التطبيق الأصلي.
- لا تزال الجلسات الحالية تحتاج إلى `/new` أو `/reset` بعد تغيير وقت التشغيل،
  لأن تثبيتات وقت تشغيل الجلسة ثابتة.

اختيار الحزمة ليس عنصر تحكم حيًا في الجلسة. عندما تعمل دورة مضمنة، يسجل
OpenClaw معرف الحزمة المحددة على تلك الجلسة ويواصل استخدامه للدورات اللاحقة في
معرف الجلسة نفسه. غيّر إعداد `agentRuntime` أو `OPENCLAW_AGENT_RUNTIME` عندما
تريد أن تستخدم الجلسات المستقبلية حزمة أخرى؛ استخدم `/new` أو `/reset` لبدء
جلسة جديدة قبل تبديل محادثة حالية بين PI وCodex. يتجنب ذلك إعادة تشغيل نص واحد
عبر نظامي جلسات أصليين غير متوافقين.

تُعامل الجلسات القديمة التي أُنشئت قبل تثبيتات الحزمة كجلسات مثبتة على PI بمجرد
أن يكون لديها سجل نص. استخدم `/new` أو `/reset` لإدخال تلك المحادثة في Codex
بعد تغيير الإعداد.

`/status` يعرض وقت تشغيل النموذج الفعلي. تظهر حزمة Pi الافتراضية باسم
`Runtime: OpenClaw Pi Default`، وتظهر حزمة خادم تطبيقات Codex باسم
`Runtime: OpenAI Codex`.

## المتطلبات

- OpenClaw مع Plugin `codex` المضمّن المتاح.
- خادم تطبيقات Codex بالإصدار `0.125.0` أو أحدث. يدير Plugin المضمّن ملفًا ثنائيًا متوافقًا
  لخادم تطبيقات Codex افتراضيًا، لذلك لا تؤثر أوامر `codex` المحلية الموجودة في `PATH` في
  بدء تشغيل الحزمة العادي.
- توفر مصادقة Codex لعملية خادم التطبيق أو لجسر مصادقة Codex في OpenClaw.
  تستخدم عمليات تشغيل خادم التطبيق المحلي OpenClaw-managed Codex home لكل
  وكيل و`HOME` فرعيًا معزولًا، لذلك لا تقرأ افتراضيًا حسابك الشخصي في
  `~/.codex` أو Skills أو plugins أو config أو حالة thread أو
  `$HOME/.agents/skills` الأصلية.

يحظر Plugin عمليات مصافحة خادم التطبيق القديمة أو غير محددة الإصدار. وهذا يبقي
OpenClaw على سطح البروتوكول الذي اختُبر عليه.

في اختبارات الدخان الحية وDocker، تأتي المصادقة عادةً من حساب Codex CLI
أو ملف تعريف مصادقة OpenClaw `openai-codex`. يمكن لعمليات تشغيل خادم تطبيقات stdio المحلية
أيضًا الرجوع إلى `CODEX_API_KEY` / `OPENAI_API_KEY` عندما لا يكون هناك حساب موجود.

## ملفات تمهيد مساحة العمل

يتعامل Codex مع `AGENTS.md` بنفسه من خلال اكتشاف مستندات المشروع الأصلية. لا يكتب OpenClaw
ملفات مستندات مشروع Codex مصطنعة ولا يعتمد على أسماء ملفات Codex الاحتياطية
لملفات الشخصية، لأن احتياطيات Codex لا تنطبق إلا عند غياب
`AGENTS.md`.

لتحقيق تكافؤ مساحة عمل OpenClaw، تحل حزمة Codex ملفات التمهيد الأخرى
(`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و
`BOOTSTRAP.md` و`MEMORY.md` عند وجودها) وتمررها عبر تعليمات config الخاصة بـCodex
على `thread/start` و`thread/resume`. وهذا يبقي سياق الشخصية/الملف التعريفي لمساحة العمل
في `SOUL.md` والملفات المرتبطة مرئيًا من دون تكرار
`AGENTS.md`.

## أضف Codex بجانب النماذج الأخرى

لا تضبط `agentRuntime.id: "codex"` عموميًا إذا كان ينبغي للوكيل نفسه التبديل بحرية
بين Codex ونماذج المزوّدين غير Codex. ينطبق وقت التشغيل المفروض على كل
دور مضمّن لذلك الوكيل أو تلك الجلسة. إذا اخترت نموذج Anthropic بينما
ذلك وقت التشغيل مفروض، فسيظل OpenClaw يحاول استخدام حزمة Codex ويفشل مغلقًا
بدلًا من توجيه ذلك الدور بصمت عبر Pi.

استخدم أحد هذه الأشكال بدلًا من ذلك:

- ضع Codex على وكيل مخصص مع `agentRuntime.id: "codex"`.
- أبقِ الوكيل الافتراضي على `agentRuntime.id: "auto"` واحتياطي توافق Pi للاستخدام المختلط العادي
  للمزوّدين.
- استخدم مراجع `codex/*` القديمة للتوافق فقط. ينبغي أن تفضل الإعدادات الجديدة
  `openai/*` بالإضافة إلى سياسة وقت تشغيل Codex صريحة.

على سبيل المثال، يُبقي هذا الوكيل الافتراضي على الاختيار التلقائي العادي
ويضيف وكيل Codex منفصلًا:

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

- يستخدم الوكيل الافتراضي `main` مسار المزوّد العادي واحتياطي توافق Pi.
- يستخدم وكيل `codex` حزمة خادم تطبيقات Codex.
- إذا كان Codex مفقودًا أو غير مدعوم لوكيل `codex`، يفشل الدور
  بدلًا من استخدام Pi بهدوء.

## توجيه أوامر الوكلاء

ينبغي للوكلاء توجيه طلبات المستخدم حسب القصد، لا حسب كلمة "Codex" وحدها:

| عندما يطلب المستخدم...                                | ينبغي للوكيل استخدام...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "اربط هذه المحادثة بـCodex"                           | `/codex bind`                                    |
| "استأنف thread Codex `<id>` هنا"                      | `/codex resume <id>`                             |
| "اعرض threads Codex"                                  | `/codex threads`                                 |
| "قدّم تقرير دعم لتشغيل Codex سيئ"                     | `/diagnostics [note]`                            |
| "أرسل ملاحظات Codex فقط لهذا thread المرفق"           | `/codex diagnostics [note]`                      |
| "استخدم اشتراكي ChatGPT/Codex مع وقت تشغيل Codex"     | `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` |
| "استخدم اشتراكي ChatGPT/Codex عبر Pi"                 | مراجع نموذج `openai-codex/*`                    |
| "شغّل Codex عبر ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "ابدأ Claude Code/Gemini/OpenCode/Cursor في thread"   | ACP/acpx، وليس `/codex` وليس الوكلاء الفرعيين الأصليين |

لا يعلن OpenClaw إرشادات إنشاء ACP للوكلاء إلا عندما يكون ACP مفعّلًا،
وقابلًا للإرسال، ومدعومًا بخلفية وقت تشغيل محمّلة. إذا لم يكن ACP متاحًا،
فينبغي ألا يعلّم موجه النظام وSkills الخاصة بـPlugin الوكيل عن توجيه
ACP.

## عمليات النشر الخاصة بـCodex فقط

افرض حزمة Codex عندما تحتاج إلى إثبات أن كل دور وكيل مضمّن
يستخدم Codex. تفشل أوقات تشغيل Plugin الصريحة مغلقة ولا يُعاد تجريبها بصمت
عبر Pi:

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

عند فرض Codex، يفشل OpenClaw مبكرًا إذا كان Plugin الخاص بـCodex معطلًا، أو كان
خادم التطبيق قديمًا جدًا، أو لم يتمكن خادم التطبيق من البدء.

## Codex لكل وكيل

يمكنك جعل وكيل واحد خاصًا بـCodex فقط بينما يحتفظ الوكيل الافتراضي
بالاختيار التلقائي العادي:

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

استخدم أوامر الجلسة العادية للتبديل بين الوكلاء والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة وتنشئ حزمة Codex أو تستأنف thread خادم التطبيق الجانبي الخاص بها
عند الحاجة. يمسح `/reset` ربط جلسة OpenClaw لذلك thread
ويسمح للدور التالي بحل الحزمة من config الحالي مرة أخرى.

## اكتشاف النماذج

افتراضيًا، يطلب Plugin الخاص بـCodex من خادم التطبيق النماذج المتاحة. إذا
فشل الاكتشاف أو انتهت مهلته، يستخدم كتالوجًا احتياطيًا مضمنًا لـ:

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يلتزم
بالكتالوج الاحتياطي:

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

## اتصال خادم التطبيق والسياسة

افتراضيًا، يبدأ Plugin ملف Codex الثنائي المدار من OpenClaw محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

يُشحن الملف الثنائي المدار مع حزمة Plugin `codex`. وهذا يبقي إصدار
خادم التطبيق مرتبطًا بـPlugin المضمّن بدلًا من أي Codex CLI منفصل
مثبّت محليًا. اضبط `appServer.command` فقط عندما تريد عمدًا
تشغيل ملف تنفيذي مختلف.

افتراضيًا، يبدأ OpenClaw جلسات حزمة Codex المحلية في وضع YOLO:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. هذه هي وضعية المشغّل المحلي الموثوق المستخدمة
لـHeartbeat ذاتية التشغيل: يمكن لـCodex استخدام أدوات shell والشبكة من دون
التوقف عند مطالبات الموافقة الأصلية التي لا يوجد أحد للإجابة عنها.

للاشتراك في موافقات Codex التي يراجعها الحارس، اضبط `appServer.mode:
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

يستخدم وضع الحارس مسار موافقة المراجعة التلقائية الأصلي في Codex. عندما يطلب Codex
مغادرة sandbox، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل وصول الشبكة،
يوجه Codex طلب الموافقة هذا إلى المراجع الأصلي بدلًا من مطالبة بشرية.
يطبق المراجع إطار مخاطر Codex ويوافق على الطلب المحدد أو يرفضه. استخدم Guardian عندما
تريد حواجز أمان أكثر من وضع YOLO ولكنك لا تزال تحتاج إلى أن يحرز الوكلاء غير المراقَبين تقدمًا.

يتوسع الإعداد المسبق `guardian` إلى `approvalPolicy: "on-request"` و
`approvalsReviewer: "auto_review"` و`sandbox: "workspace-write"`.
لا تزال حقول السياسة الفردية تتجاوز `mode`، لذلك يمكن لعمليات النشر المتقدمة مزج
الإعداد المسبق مع اختيارات صريحة. لا تزال قيمة المراجع الأقدم `guardian_subagent`
مقبولة كاسم توافق مستعار، لكن ينبغي أن تستخدم الإعدادات الجديدة
`auto_review`.

بالنسبة إلى خادم تطبيقات يعمل بالفعل، استخدم نقل WebSocket:

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

ترث عمليات تشغيل خادم تطبيقات stdio بيئة عملية OpenClaw افتراضيًا،
لكن OpenClaw يملك جسر حساب خادم تطبيقات Codex ويضبط كلًا من
`CODEX_HOME` و`HOME` على أدلة لكل وكيل ضمن حالة OpenClaw لذلك الوكيل.
يقرأ محمّل Skills الخاص بـCodex نفسه `$CODEX_HOME/skills` و
`$HOME/.agents/skills`، لذلك تكون كلتا القيمتين معزولتين لعمليات تشغيل خادم التطبيق
المحلية. وهذا يبقي Skills وplugins وconfig والحسابات وحالة thread الأصلية في Codex
ضمن نطاق وكيل OpenClaw بدلًا من التسرب من موطن Codex CLI الشخصي للمشغّل.

لا تزال Plugins الخاصة بـOpenClaw ولقطات Skills الخاصة بـOpenClaw تتدفق عبر سجل
Plugins ومحمّل Skills الخاصين بـOpenClaw. لا تتدفق أصول Codex CLI الشخصية. إذا كانت لديك
Skills أو plugins مفيدة في Codex CLI ينبغي أن تصبح جزءًا من وكيل OpenClaw،
فاحصرها صراحةً:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ينسخ موفر ترحيل Codex Skills إلى مساحة عمل وكيل OpenClaw الحالي.
يتم الإبلاغ عن plugins الأصلية في Codex والخطافات وملفات config أو أرشفتها
للمراجعة اليدوية بدلًا من تفعيلها تلقائيًا، لأنها يمكن أن
تنفذ أوامر، أو تعرض خوادم MCP، أو تحمل بيانات اعتماد.

تُختار المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw Codex صريح للوكيل.
2. حساب خادم التطبيق الموجود في Codex home لذلك الوكيل.
3. لعمليات تشغيل خادم تطبيقات stdio المحلية فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيقات موجود ولا تزال مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية التي تم إنشاؤها. وهذا
يبقي مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
من دون جعل أدوار خادم تطبيقات Codex الأصلية تُحاسب عبر API بالخطأ.
تستخدم ملفات تعريف مفتاح API الصريحة لـCodex واحتياطي مفتاح env في stdio المحلي
تسجيل دخول خادم التطبيق بدلًا من env عملية فرعية موروثة. لا تتلقى اتصالات
خادم تطبيقات WebSocket احتياطي مفتاح API من env الخاص بـGateway؛ استخدم ملف تعريف مصادقة صريحًا أو
حساب خادم التطبيق البعيد نفسه.

إذا احتاجت عملية نشر إلى عزل بيئة إضافي، فأضف تلك المتغيرات إلى
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

يؤثر `appServer.clearEnv` فقط في عملية خادم تطبيقات Codex الفرعية التي تم إنشاؤها.

تستخدم أدوات Codex الديناميكية افتراضياً ملف التعريف `native-first`. في هذا الوضع،
لا يكشف OpenClaw عن الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex:
`read` و`write` و`edit` و`apply_patch` و`exec` و`process` و
`update_plan`. تظل أدوات تكامل OpenClaw مثل المراسلة، والجلسات، والوسائط،
وcron، والمتصفح، والعُقد، وgateway، و`heartbeat_respond`، و`web_search`
متاحة.

حقول Plugin الخاصة بـ Codex والمدعومة في المستوى الأعلى:

| الحقل                      | الافتراضي        | المعنى                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | استخدم `"openclaw-compat"` لكشف مجموعة أدوات OpenClaw الديناميكية الكاملة إلى app-server في Codex. |
| `codexDynamicToolsExclude` | `[]`             | أسماء أدوات OpenClaw الديناميكية الإضافية التي يجب حذفها من أدوار app-server في Codex.               |

حقول `appServer` المدعومة:

| الحقل               | الافتراضي                                | المعنى                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | يؤدي `"stdio"` إلى تشغيل Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                             |
| `command`           | ملف Codex الثنائي المُدار                | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف الثنائي المُدار؛ ولا تضبطه إلا لتجاوز صريح.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | الوسيطات لنقل stdio.                                                                                                                                                                                                       |
| `url`               | غير مضبوط                                | عنوان URL الخاص بـ WebSocket app-server.                                                                                                                                                                                                            |
| `authToken`         | غير مضبوط                                | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | أسماء متغيرات بيئة إضافية تُزال من عملية stdio app-server المُشغلة بعد أن يبني OpenClaw بيئته الموروثة. يُحجز `CODEX_HOME` و`HOME` لعزل Codex لكل وكيل في OpenClaw عند عمليات التشغيل المحلية. |
| `requestTimeoutMs`  | `60000`                                  | مهلة استدعاءات مستوى التحكم في app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | إعداد مسبق لتنفيذ YOLO أو التنفيذ المراجع بواسطة guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | سياسة موافقة Codex الأصلية المرسلة إلى بدء/استئناف/دور السلسلة.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | وضع صندوق عزل Codex الأصلي المرسل إلى بدء/استئناف السلسلة.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية. يظل `guardian_subagent` اسماً مستعاراً قديماً.                                                                                                                         |
| `serviceTier`       | غير مضبوط                                | طبقة خدمة Codex app-server اختيارية: `"fast"` أو `"flex"` أو `null`. تُتجاهل القيم القديمة غير الصالحة.                                                                                                                            |

تُحد طلبات أدوات OpenClaw الديناميكية المملوكة لـ OpenClaw بشكل مستقل عن
`appServer.requestTimeoutMs`: يجب أن يتلقى كل طلب Codex من نوع `item/tool/call`
استجابة من OpenClaw خلال 30 ثانية. عند انتهاء المهلة، يوقف OpenClaw إشارة الأداة
حيثما كان ذلك مدعوماً ويعيد استجابة أداة ديناميكية فاشلة إلى Codex لكي يتمكن
الدور من المتابعة بدلاً من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب app-server ذي نطاق الدور في Codex، يتوقع إطار الاختبار
أيضاً أن ينهي Codex الدور الأصلي باستخدام `turn/completed`. إذا صمت app-server
لمدة 60 ثانية بعد تلك الاستجابة، يحاول OpenClaw، بأفضل جهد، مقاطعة دور Codex،
ويسجل مهلة تشخيصية، ويحرر مسار جلسة OpenClaw بحيث لا تُصف رسائل الدردشة اللاحقة
خلف دور أصلي عالق.

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف الثنائي المُدار عندما يكون
`appServer.command` غير مضبوط.

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلاً من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضل
استخدام الإعداد لعمليات النشر القابلة للتكرار لأنه يحافظ على سلوك Plugin في
نفس الملف المُراجع مع بقية إعداد إطار Codex.

## استخدام الكمبيوتر

يُغطى استخدام الكمبيوتر في دليل إعداد مستقل:
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use).

الخلاصة: لا يضمن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ إجراءات سطح المكتب
بنفسه. إنه يجهز Codex app-server، ويتحقق من توفر خادم MCP الخاص بـ
`computer-use`، ثم يترك Codex يتعامل مع استدعاءات أدوات MCP الأصلية أثناء أدوار
وضع Codex.

للوصول المباشر إلى مشغل TryCua خارج تدفق سوق Codex، سجل
`cua-driver mcp` باستخدام `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
راجع [استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use) لمعرفة الفرق
بين استخدام الكمبيوتر المملوك لـ Codex والتسجيل المباشر في MCP.

الإعداد الأدنى:

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

استخدام الكمبيوتر خاص بـ macOS وقد يتطلب أذونات نظام تشغيل محلية قبل أن يتمكن
خادم Codex MCP من التحكم بالتطبيقات. إذا كان `computerUse.enabled` يساوي true
وكان خادم MCP غير متاح، تفشل أدوار وضع Codex قبل بدء السلسلة بدلاً من العمل
بصمت من دون أدوات استخدام الكمبيوتر الأصلية. راجع
[استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use) لمعرفة خيارات السوق،
وحدود الكتالوج البعيد، وأسباب الحالة، واستكشاف الأخطاء وإصلاحها.

عندما يكون `computerUse.autoInstall` يساوي true، يمكن لـ OpenClaw تسجيل سوق
Codex Desktop القياسي المضمن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` إذا لم يكن
Codex قد اكتشف سوقاً محلياً بعد. استخدم `/new` أو `/reset` بعد تغيير إعداد
وقت التشغيل أو استخدام الكمبيوتر حتى لا تحتفظ الجلسات الحالية بربط PI أو سلسلة
Codex قديم.

## وصفات شائعة

Codex محلي مع نقل stdio الافتراضي:

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

تحقق إطار Codex فقط:

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

موافقات Codex المراجعة بواسطة guardian:

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

يظل تبديل النماذج تحت تحكم OpenClaw. عندما تكون جلسة OpenClaw مرتبطة بسلسلة
Codex موجودة، يرسل الدور التالي نموذج OpenAI المحدد حالياً، والمزود، وسياسة
الموافقة، وصندوق العزل، وطبقة الخدمة إلى app-server مرة أخرى. يحافظ التبديل من
`openai/gpt-5.5` إلى `openai/gpt-5.2` على ربط السلسلة لكنه يطلب من Codex
المتابعة بالنموذج المحدد حديثاً.

## أمر Codex

يسجل Plugin المضمن `/codex` كأمر شرطة مائلة مصرح به. إنه عام ويعمل على أي قناة
تدعم أوامر OpenClaw النصية.

الصيغ الشائعة:

- يعرض `/codex status` اتصال app-server المباشر، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج Codex app-server المباشرة.
- يسرد `/codex threads [filter]` سلاسل Codex الأخيرة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex موجودة.
- يطلب `/codex compact` من Codex app-server ضغط السلسلة المرتبطة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرتبطة.
- يطلب `/codex diagnostics [note]` التأكيد قبل إرسال ملاحظات تشخيص Codex للسلسلة المرتبطة.
- يتحقق `/codex computer-use status` من Plugin استخدام الكمبيوتر وخادم MCP المضبوطين.
- يثبت `/codex computer-use install` Plugin استخدام الكمبيوتر المضبوط ويعيد تحميل خوادم MCP.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خادم MCP في Codex app-server.
- يسرد `/codex skills` Skills الخاصة بـ Codex app-server.

### سير عمل شائع لتصحيح الأخطاء

عندما يفعل وكيل مدعوم من Codex شيئاً مفاجئاً في Telegram أو Discord أو Slack
أو قناة أخرى، ابدأ بالمحادثة التي حدثت فيها المشكلة:

1. شغّل `/diagnostics bad tool choice after image upload` أو ملاحظة قصيرة أخرى
   تصف ما رأيته.
2. وافق على طلب التشخيص مرة واحدة. تنشئ الموافقة ملف zip لتشخيصات Gateway
   المحلية، وبما أن الجلسة تستخدم حزمة Codex، فإنها ترسل أيضا حزمة ملاحظات
   Codex ذات الصلة إلى خوادم OpenAI.
3. انسخ رد التشخيصات المكتمل إلى تقرير الخطأ أو سلسلة الدعم.
   يتضمن مسار الحزمة المحلية، وملخص الخصوصية، ومعرفات جلسات OpenClaw،
   ومعرفات سلاسل Codex، وسطر `Inspect locally` لكل سلسلة Codex.
4. إذا أردت تصحيح التشغيل بنفسك، فشغّل أمر `Inspect locally` المطبوع
   في الطرفية. يبدو مثل `codex resume <thread-id>` ويفتح سلسلة Codex
   الأصلية حتى تتمكن من فحص المحادثة، أو متابعتها محليا،
   أو سؤال Codex عن سبب اختياره أداة أو خطة معينة.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدا رفع ملاحظات Codex
للسلسلة المرفقة حاليا دون حزمة تشخيصات OpenClaw Gateway الكاملة. في معظم
تقارير الدعم، يكون `/diagnostics [note]` نقطة البدء الأفضل لأنه يربط حالة
Gateway المحلية ومعرفات سلاسل Codex معا في رد واحد. راجع [تصدير التشخيصات](/ar/gateway/diagnostics)
للاطلاع على نموذج الخصوصية الكامل وسلوك دردشة المجموعات.

يعرض OpenClaw الأساسي أيضا الأمر المقتصر على المالك `/diagnostics [note]`
بصفته أمر تشخيصات Gateway العام. تعرض مطالبة الموافقة الخاصة به تمهيد
البيانات الحساسة، وتربط إلى [تصدير التشخيصات](/ar/gateway/diagnostics)، وتطلب
`openclaw gateway diagnostics export --json` عبر موافقة تنفيذ صريحة
في كل مرة. لا توافق على التشخيصات بقاعدة تسمح بكل شيء. بعد الموافقة،
يرسل OpenClaw تقريرا قابلا للصق يتضمن مسار الحزمة المحلية وملخص البيان.
عندما تستخدم جلسة OpenClaw النشطة حزمة Codex، تخوّل الموافقة نفسها أيضا
إرسال حزم ملاحظات Codex ذات الصلة إلى خوادم OpenAI. تشير مطالبة الموافقة
إلى أن ملاحظات Codex سترسل، لكنها لا تسرد معرفات جلسات أو سلاسل Codex
قبل الموافقة.

إذا استدعى مالك `/diagnostics` في دردشة جماعية، يبقي OpenClaw القناة
المشتركة نظيفة: تتلقى المجموعة إشعارا قصيرا فقط، بينما ترسل تمهيدات
التشخيصات ومطالبات الموافقة ومعرفات جلسات/سلاسل Codex إلى المالك عبر
مسار الموافقة الخاص. إذا لم يوجد مسار خاص للمالك، يرفض OpenClaw طلب
المجموعة ويطلب من المالك تشغيله من رسالة مباشرة.

يستدعي رفع Codex المعتمد `feedback/upload` في Codex app-server ويطلب من
app-server تضمين سجلات لكل سلسلة مدرجة ولسلاسل Codex الفرعية المنشأة
عند توفرها. يمر الرفع عبر مسار ملاحظات Codex العادي إلى خوادم OpenAI؛
إذا كانت ملاحظات Codex معطلة في ذلك app-server، يعيد الأمر خطأ app-server.
يسرد رد التشخيصات المكتمل القنوات، ومعرفات جلسات OpenClaw، ومعرفات سلاسل
Codex، وأوامر `codex resume <thread-id>` المحلية للسلاسل التي أرسلت. إذا
رفضت الموافقة أو تجاهلتها، لا يطبع OpenClaw معرفات Codex هذه. لا يحل هذا
الرفع محل تصدير تشخيصات Gateway المحلي.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي تستخدمه الحزمة في الدورات
العادية. في الرسالة التالية، يستأنف OpenClaw سلسلة Codex تلك، ويمرر نموذج
OpenClaw المحدد حاليا إلى app-server، ويبقي التاريخ الموسع مفعلا.

### فحص سلسلة Codex من CLI

غالبا ما تكون أسرع طريقة لفهم تشغيل Codex سيئ هي فتح سلسلة Codex الأصلية
مباشرة:

```sh
codex resume <thread-id>
```

استخدم هذا عندما تلاحظ خطأ في محادثة قناة وتريد فحص جلسة Codex التي سببت
المشكلة، أو متابعتها محليا، أو سؤال Codex عن سبب اتخاذه خيار أداة أو تفكير
معين. غالبا ما يكون المسار الأسهل هو تشغيل `/diagnostics [note]` أولا:
بعد أن توافق عليه، يسرد التقرير المكتمل كل سلسلة Codex ويطبع أمر
`Inspect locally`، على سبيل المثال `codex resume <thread-id>`. يمكنك نسخ
ذلك الأمر مباشرة إلى الطرفية.

يمكنك أيضا الحصول على معرف سلسلة من `/codex binding` للدردشة الحالية أو
`/codex threads [filter]` لسلاسل Codex app-server الحديثة، ثم تشغيل أمر
`codex resume` نفسه في الصدفة.

يتطلب سطح الأوامر Codex app-server بالإصدار `0.125.0` أو أحدث. تبلغ طرق
التحكم الفردية بصيغة `unsupported by this Codex app-server` إذا لم يعرّض
app-server مستقبلي أو مخصص طريقة JSON-RPC تلك.

## حدود الخطافات

تحتوي حزمة Codex على ثلاث طبقات خطافات:

| الطبقة                                | المالك                   | الغرض                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| خطافات Plugin في OpenClaw             | OpenClaw                 | توافق المنتج/Plugin عبر حزمتَي PI وCodex.                           |
| وسيط إضافة Codex app-server           | Plugins مضمّنة في OpenClaw | سلوك محول لكل دورة حول أدوات OpenClaw الديناميكية.                  |
| خطافات Codex الأصلية                 | Codex                    | دورة حياة Codex منخفضة المستوى وسياسة الأدوات الأصلية من إعدادات Codex. |

لا يستخدم OpenClaw ملفات Codex `hooks.json` الخاصة بالمشروع أو العامة
لتوجيه سلوك OpenClaw Plugin. بالنسبة إلى جسر الأدوات والأذونات الأصلي
المدعوم، يحقن OpenClaw إعدادات Codex لكل سلسلة من أجل `PreToolUse` و`PostToolUse`
و`PermissionRequest` و`Stop`. تبقى خطافات Codex الأخرى مثل `SessionStart`
و`UserPromptSubmit` ضوابط على مستوى Codex؛ ولا تعرض كخطافات OpenClaw Plugin
في عقد v1.

بالنسبة إلى أدوات OpenClaw الديناميكية، ينفذ OpenClaw الأداة بعد أن يطلب
Codex الاستدعاء، لذلك يطلق OpenClaw سلوك Plugin والوسيط الذي يملكه في محول
الحزمة. أما بالنسبة إلى أدوات Codex الأصلية، فيملك Codex سجل الأداة
المرجعي. يستطيع OpenClaw عكس أحداث مختارة، لكنه لا يستطيع إعادة كتابة
سلسلة Codex الأصلية إلا إذا عرض Codex تلك العملية عبر app-server أو
استدعاءات خطاف أصلية.

تأتي إسقاطات دورة حياة Compaction وLLM من إشعارات Codex app-server وحالة
محول OpenClaw، وليس من أوامر خطافات Codex الأصلية. أحداث OpenClaw
`before_compaction` و`after_compaction` و`llm_input` و`llm_output` هي
ملاحظات على مستوى المحول، وليست التقاطات حرفية بايت ببايت لطلب Codex
الداخلي أو حمولات Compaction.

تسقط إشعارات Codex app-server الأصلية `hook/started` و`hook/completed`
كأحداث وكيل `codex_app_server.hook` للمسار والتصحيح. وهي لا تستدعي خطافات
OpenClaw Plugin.

## عقد دعم V1

وضع Codex ليس PI مع استدعاء نموذج مختلف تحته. يملك Codex جزءا أكبر من حلقة
النموذج الأصلية، ويكيف OpenClaw أسطح Plugin والجلسة حول ذلك الحد.

مدعوم في وقت تشغيل Codex v1:

| السطح                                        | الدعم                                  | السبب                                                                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقة نموذج OpenAI عبر Codex                  | مدعوم                                  | يملك Codex app-server دورة OpenAI، واستئناف السلسلة الأصلية، ومتابعة الأداة الأصلية.                                                                                                                  |
| توجيه قنوات OpenClaw وتسليمها                | مدعوم                                  | تبقى Telegram وDiscord وSlack وWhatsApp وiMessage والقنوات الأخرى خارج وقت تشغيل النموذج.                                                                                                              |
| أدوات OpenClaw الديناميكية                   | مدعوم                                  | يطلب Codex من OpenClaw تنفيذ هذه الأدوات، لذلك يبقى OpenClaw في مسار التنفيذ.                                                                                                                         |
| Plugins المطالبات والسياق                    | مدعوم                                  | يبني OpenClaw طبقات المطالبات ويسقط السياق في دورة Codex قبل بدء السلسلة أو استئنافها.                                                                                                                |
| دورة حياة محرك السياق                        | مدعوم                                  | تعمل عمليات التجميع، والإدخال أو صيانة ما بعد الدورة، وتنسيق Compaction في محرك السياق لدورات Codex.                                                                                                  |
| خطافات الأدوات الديناميكية                   | مدعوم                                  | تعمل `before_tool_call` و`after_tool_call` ووسيط نتيجة الأداة حول الأدوات الديناميكية المملوكة لـ OpenClaw.                                                                                            |
| خطافات دورة الحياة                           | مدعومة كملاحظات محول                  | تطلق `llm_input` و`llm_output` و`agent_end` و`before_compaction` و`after_compaction` بحمولات صادقة لوضع Codex.                                                                                         |
| بوابة مراجعة الإجابة النهائية                | مدعومة عبر مرحل الخطاف الأصلي         | يمرر Codex `Stop` إلى `before_agent_finalize`؛ ويطلب `revise` من Codex تمريرة نموذج إضافية قبل الإنهاء.                                                                                                |
| حظر أو مراقبة الصدفة الأصلية والتصحيح وMCP   | مدعوم عبر مرحل الخطاف الأصلي          | يمرر Codex `PreToolUse` و`PostToolUse` لأسطح الأدوات الأصلية المعتمدة، بما في ذلك حمولات MCP على Codex app-server `0.125.0` أو أحدث. الحظر مدعوم؛ أما إعادة كتابة الوسيطات فليست مدعومة. |
| سياسة الأذونات الأصلية                       | مدعومة عبر مرحل الخطاف الأصلي         | يمكن توجيه Codex `PermissionRequest` عبر سياسة OpenClaw حيث يعرض وقت التشغيل ذلك. إذا لم يرجع OpenClaw أي قرار، يواصل Codex عبر مسار الحارس أو موافقة المستخدم العادي.                             |
| التقاط مسار app-server                       | مدعوم                                  | يسجل OpenClaw الطلب الذي أرسله إلى app-server وإشعارات app-server التي يتلقاها.                                                                                                                       |

غير مدعوم في وقت تشغيل Codex v1:

| السطح                                             | حد V1                                                                                                                                     | المسار المستقبلي                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تعديل وسيطات الأدوات الأصلية                       | يمكن لخطافات Codex الأصلية قبل الأداة الحظر، لكن OpenClaw لا يعيد كتابة وسيطات الأدوات الأصلية في Codex.                                               | يتطلب دعم خطاف/مخطط Codex لاستبدال مدخلات الأداة.                            |
| سجل محادثات Codex الأصلي القابل للتحرير            | يمتلك Codex سجل الخيط الأصلي المعتمد. يمتلك OpenClaw مرآة ويمكنه إسقاط السياق المستقبلي، لكن لا ينبغي له تعديل الأجزاء الداخلية غير المدعومة. | إضافة واجهات API صريحة لخادم تطبيق Codex إذا كانت هناك حاجة إلى تعديل الخيط الأصلي.                    |
| `tool_result_persist` لسجلات أدوات Codex الأصلية | يحول ذلك الخطاف عمليات كتابة السجل التي يملكها OpenClaw، وليس سجلات أدوات Codex الأصلية.                                                           | يمكنه عكس السجلات المحولة، لكن إعادة الكتابة المعتمدة تحتاج إلى دعم Codex.              |
| بيانات تعريف Compaction الأصلية الغنية                     | يراقب OpenClaw بدء Compaction واكتماله، لكنه لا يتلقى قائمة ثابتة بالمحتفظ به/المسقَط، أو فرق الرموز، أو حمولة الملخص.            | يحتاج إلى أحداث Compaction أغنى من Codex.                                                     |
| التدخل في Compaction                             | خطافات Compaction الحالية في OpenClaw على مستوى الإشعار في وضع Codex.                                                                         | إضافة خطافات Compaction قبل/بعد في Codex إذا احتاجت plugins إلى رفض Compaction الأصلي أو إعادة كتابته. |
| التقاط طلب API النموذجي بايتًا ببايت             | يمكن لـ OpenClaw التقاط طلبات خادم التطبيق وإشعاراته، لكن نواة Codex تبني طلب OpenAI API النهائي داخليًا.                      | يحتاج إلى حدث تتبع طلب نموذج في Codex أو API تصحيح.                                   |

## الأدوات والوسائط وCompaction

يغير مشغّل Codex منفذ الوكيل المضمّن منخفض المستوى فقط.

لا يزال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
المشغّل. يستمر النص، والصور، والفيديو، والموسيقى، وTTS، والموافقات، ومخرجات أدوات المراسلة
عبر مسار التسليم المعتاد في OpenClaw.

ترحيل الخطافات الأصلي عام عمدًا، لكن عقد دعم v1
محدود بمسارات أدوات Codex الأصلية والأذونات التي يختبرها OpenClaw. في
وقت تشغيل Codex، يشمل ذلك حمولات الصدفة، والتصحيح، وMCP `PreToolUse`،
و`PostToolUse`، و`PermissionRequest`. لا تفترض أن كل حدث خطاف Codex
مستقبلي هو سطح plugin في OpenClaw حتى يسميه عقد وقت التشغيل.

بالنسبة إلى `PermissionRequest`، لا يعيد OpenClaw إلا قرارات السماح أو الرفض الصريحة
عندما تقرر السياسة. النتيجة بلا قرار ليست سماحًا. يتعامل معها Codex على أنها بلا
قرار خطاف وينتقل إلى مسار الحارس الخاص به أو موافقة المستخدم.

توجّه طلبات استجلاب موافقة أدوات Codex MCP عبر تدفق موافقة plugin في
OpenClaw عندما يعلّم Codex `_meta.codex_approval_kind` على أنه
`"mcp_tool_call"`. ترسل مطالبات Codex `request_user_input` مرة أخرى إلى
المحادثة الأصلية، وتجيب رسالة المتابعة التالية في قائمة الانتظار عن طلب الخادم الأصلي
بدلًا من توجيهها كسياق إضافي. تظل طلبات استجلاب MCP الأخرى تفشل بإغلاق آمن.

يرتبط توجيه قائمة انتظار التشغيل النشط بـ `turn/steer` في خادم تطبيق Codex. مع
الإعداد الافتراضي `messages.queue.mode: "steer"`، يجمع OpenClaw رسائل المحادثة الموجودة في قائمة الانتظار
خلال نافذة الهدوء المضبوطة ويرسلها كطلب `turn/steer` واحد
حسب ترتيب الوصول. يرسل وضع `queue` القديم طلبات `turn/steer` منفصلة. يمكن أن
ترفض أدوار المراجعة وCompaction اليدوية في Codex التوجيه ضمن الدور نفسه، وفي هذه الحالة
يستخدم OpenClaw قائمة انتظار المتابعة عندما يسمح الوضع المحدد بالرجوع. راجع
[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

عندما يستخدم النموذج المحدد مشغّل Codex، يفوَّض Compaction للخيط الأصلي
إلى خادم تطبيق Codex. يحتفظ OpenClaw بمرآة للسجل من أجل سجل القناة،
والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو المشغّل. تتضمن
المرآة مطالبة المستخدم، والنص النهائي للمساعد، وسجلات التفكير أو الخطة الخفيفة في Codex
عندما يصدرها خادم التطبيق. حاليًا، يسجل OpenClaw فقط
إشارات بدء Compaction الأصلي واكتماله. ولا يعرض بعد
ملخص Compaction قابلًا للقراءة البشرية أو قائمة قابلة للتدقيق بالمدخلات التي
احتفظ بها Codex بعد Compaction.

لأن Codex يمتلك الخيط الأصلي المعتمد، لا يعيد `tool_result_persist`
حاليًا كتابة سجلات نتائج أدوات Codex الأصلية. ينطبق فقط عندما
يكتب OpenClaw نتيجة أداة في سجل جلسة يملكه OpenClaw.

لا يتطلب توليد الوسائط PI. يستمر فهم الصور، والفيديو، والموسيقى، وPDF، وTTS، والوسائط
في استخدام إعدادات الموفر/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel`، و`videoGenerationModel`، و`pdfModel`، و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كموفر `/model` عادي:** هذا متوقع في
الإعدادات الجديدة. حدد نموذج `openai/gpt-*` مع
`agentRuntime.id: "codex"` (أو مرجع `codex/*` قديمًا)، وفعّل
`plugins.entries.codex.enabled`، وتحقق مما إذا كان `plugins.allow` يستثني
`codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** لا يزال بإمكان `agentRuntime.id: "auto"` استخدام PI كواجهة خلفية
للتوافق عندما لا يطالب أي مشغّل Codex بالتشغيل. عيّن
`agentRuntime.id: "codex"` لفرض اختيار Codex أثناء الاختبار. يفشل
وقت تشغيل Codex المفروض بدلًا من الرجوع إلى PI. بمجرد اختيار خادم تطبيق Codex،
تظهر إخفاقاته مباشرة.

**رُفض خادم التطبيق:** رقِّ Codex حتى يبلغ اتصال خادم التطبيق
عن الإصدار `0.125.0` أو أحدث. ترفض الإصدارات التمهيدية ذات الإصدار نفسه أو الإصدارات ذات لاحقة البناء
مثل `0.125.0-alpha.2` أو `0.125.0+custom` لأن
الحد الأدنى لبروتوكول `0.125.0` المستقر هو ما يختبره OpenClaw.

**اكتشاف النماذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url`، و`authToken`،
وأن خادم التطبيق البعيد يتحدث إصدار بروتوكول خادم تطبيق Codex نفسه.

**يستخدم نموذج غير Codex‏ PI:** هذا متوقع ما لم تكن قد فرضت
`agentRuntime.id: "codex"` لذلك الوكيل أو اخترت مرجع
`codex/*` قديمًا. تبقى مراجع `openai/gpt-*` العادية ومراجع الموفرين الآخرين على مسار
الموفر المعتاد في وضع `auto`. إذا فرضت `agentRuntime.id: "codex"`، يجب أن يكون كل دور مضمّن
لذلك الوكيل نموذج OpenAI مدعومًا من Codex.

**Computer Use مثبت لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر ذلك، فأعد تشغيل
Gateway لمسح تسجيلات الخطافات الأصلية القديمة. إذا انتهت مهلة `computer-use.list_apps`،
فأعد تشغيل Codex Computer Use أو Codex Desktop ثم أعد المحاولة.

## ذو صلة

- [plugins مشغّل الوكيل](/ar/plugins/sdk-agent-harness)
- [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [موفرو النماذج](/ar/concepts/model-providers)
- [موفر OpenAI](/ar/providers/openai)
- [الحالة](/ar/cli/status)
- [خطافات Plugin](/ar/plugins/hooks)
- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
