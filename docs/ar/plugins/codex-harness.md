---
read_when:
    - تريد استخدام أداة تشغيل خادم التطبيق المضمّنة في Codex
    - تحتاج إلى أمثلة لتكوين بيئة تشغيل Codex
    - تريد أن تفشل عمليات النشر المقتصرة على Codex بدلاً من الرجوع إلى PI
summary: شغّل دورات وكيل OpenClaw المضمّن عبر إطار تشغيل خادم التطبيق Codex المرفق
title: بيئة اختبار Codex
x-i18n:
    generated_at: "2026-04-30T20:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

يتيح Plugin `codex` المضمّن لـ OpenClaw تشغيل أدوار الوكيل المضمّنة عبر
Codex app-server بدلاً من حزام PI المضمّن.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النماذج، استئناف الخيوط الأصلي، Compaction الأصلي، والتنفيذ عبر app-server.
يبقى OpenClaw مسؤولاً عن قنوات الدردشة، وملفات الجلسات، واختيار النماذج، والأدوات،
والموافقات، وتسليم الوسائط، ونسخة النص الظاهرة.

إذا كنت تحاول أن تفهم السياق، فابدأ من
[بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes). النسخة المختصرة هي:
`openai/gpt-5.5` هو مرجع النموذج، و`codex` هو بيئة التشغيل، وتبقى Telegram
أو Discord أو Slack أو قناة أخرى هي سطح التواصل.

## ما الذي يغيّره هذا Plugin

يساهم Plugin `codex` المضمّن بعدة قدرات منفصلة:

| القدرة                        | كيف تستخدمها                                      | ما الذي تفعله                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| بيئة تشغيل مضمّنة أصلية           | `agentRuntime.id: "codex"`                          | تشغّل أدوار وكيل OpenClaw المضمّنة عبر Codex app-server.                  |
| أوامر أصلية للتحكم بالدردشة      | `/codex bind`, `/codex resume`, `/codex steer`, ... | تربط خيوط Codex app-server وتتحكم بها من محادثة مراسلة.    |
| مزوّد/فهرس Codex app-server | داخليات `codex`، معروضة عبر الحزام     | تتيح لبيئة التشغيل اكتشاف نماذج app-server والتحقق منها.                     |
| مسار فهم الوسائط في Codex    | مسارات توافق نماذج الصور `codex/*`           | يشغّل أدوار Codex app-server محدودة لنماذج فهم الصور المدعومة. |
| ترحيل الخطافات الأصلية                 | خطافات Plugin حول أحداث Codex الأصلية             | يتيح لـ OpenClaw مراقبة/حظر أحداث الأدوات/الإتمام الأصلية المدعومة في Codex.  |

جعل Plugin مفعّلاً يجعل هذه القدرات متاحة. وهو **لا**:

- يبدأ باستخدام Codex لكل نموذج OpenAI
- يحوّل مراجع نماذج `openai-codex/*` إلى بيئة التشغيل الأصلية
- يجعل ACP/acpx المسار الافتراضي لـ Codex
- يبدّل الجلسات الحالية التي سجّلت مسبقاً بيئة تشغيل PI مباشرة
- يستبدل تسليم قنوات OpenClaw، أو ملفات الجلسات، أو تخزين ملفات تعريف المصادقة، أو
  توجيه الرسائل

يمتلك Plugin نفسه أيضاً سطح أوامر التحكم بالدردشة الأصلي `/codex`. إذا كان
Plugin مفعّلاً وطلب المستخدم الربط أو الاستئناف أو التوجيه أو الإيقاف أو فحص
خيوط Codex من الدردشة، فينبغي للوكلاء تفضيل `/codex ...` على ACP. يبقى ACP
الخيار الاحتياطي الصريح عندما يطلب المستخدم ACP/acpx أو يختبر محوّل
ACP الخاص بـ Codex.

تحافظ أدوار Codex الأصلية على خطافات OpenClaw Plugin بوصفها طبقة التوافق العامة.
هذه خطافات OpenClaw داخل العملية، وليست خطافات أوامر Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` لسجلات نسخة النص المنعكسة
- `before_agent_finalize` عبر ترحيل Codex `Stop`
- `agent_end`

يمكن لـ Plugins أيضاً تسجيل برمجيات وسيطة محايدة لبيئة التشغيل لنتائج الأدوات لإعادة كتابة
نتائج أدوات OpenClaw الديناميكية بعد أن ينفذ OpenClaw الأداة وقبل أن
تُعاد النتيجة إلى Codex. هذا منفصل عن خطاف Plugin العام
`tool_result_persist`، الذي يحوّل كتابات نتائج الأدوات في النص المملوكة لـ OpenClaw.

لمعاني خطافات Plugin نفسها، راجع [خطافات Plugin](/ar/plugins/hooks)
و[سلوك حارس Plugin](/ar/tools/plugin).

الحزام متوقف افتراضياً. يجب أن تبقي الإعدادات الجديدة مراجع نماذج OpenAI
قياسية بصيغة `openai/gpt-*` وأن تفرض صراحةً
`agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex` عندما تريد
تنفيذاً أصلياً عبر app-server. لا تزال مراجع نماذج `codex/*` القديمة تختار
الحزام تلقائياً للتوافق، لكن بادئات المزود القديمة المدعومة ببيئة تشغيل
لا تظهر كخيارات نموذج/مزوّد عادية.

إذا كان Plugin `codex` مفعّلاً لكن النموذج الأساسي لا يزال
`openai-codex/*`، فإن `openclaw doctor` يصدر تحذيراً بدلاً من تغيير المسار. هذا
مقصود: يظل `openai-codex/*` مسار OAuth/الاشتراك الخاص بـ PI لـ Codex، ويبقى
التنفيذ الأصلي عبر app-server اختياراً صريحاً لبيئة التشغيل.

## خريطة المسارات

استخدم هذا الجدول قبل تغيير الإعدادات:

| السلوك المطلوب                            | مرجع النموذج                  | إعداد بيئة التشغيل                         | متطلب Plugin          | تسمية الحالة المتوقعة          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API عبر مشغّل OpenClaw العادي   | `openai/gpt-*`             | محذوف أو `runtime: "pi"`             | مزوّد OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/اشتراك Codex عبر PI         | `openai-codex/gpt-*`       | محذوف أو `runtime: "pi"`             | مزوّد OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| أدوار مضمّنة أصلية عبر Codex app-server      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| مزوّدون مختلطون مع وضع تلقائي محافظ | مراجع خاصة بالمزوّد     | `agentRuntime.id: "auto"`              | بيئات تشغيل Plugin اختيارية    | يعتمد على بيئة التشغيل المختارة    |
| جلسة محوّل Codex ACP صريحة          | يعتمد على موجّه/نموذج ACP | `sessions_spawn` مع `runtime: "acp"` | واجهة `acpx` خلفية سليمة      | حالة مهمة/جلسة ACP        |

الفاصل المهم هو المزوّد مقابل بيئة التشغيل:

- يجيب `openai-codex/*` عن "أي مسار مزوّد/مصادقة يجب أن يستخدمه PI؟"
- يجيب `agentRuntime.id: "codex"` عن "أي حلقة يجب أن تنفذ هذا
  الدور المضمّن؟"
- يجيب `/codex ...` عن "أي محادثة Codex أصلية يجب أن تربطها هذه الدردشة
  أو تتحكم بها؟"
- يجيب ACP عن "أي عملية حزام خارجية يجب أن يطلقها acpx؟"

## اختر بادئة النموذج الصحيحة

مسارات عائلة OpenAI مخصصة حسب البادئة. استخدم `openai-codex/*` عندما تريد
OAuth الخاص بـ Codex عبر PI؛ واستخدم `openai/*` عندما تريد وصولاً مباشراً إلى OpenAI API أو
عندما تفرض حزام Codex app-server الأصلي:

| مرجع النموذج                                     | مسار بيئة التشغيل                                 | استخدمه عندما                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | مزوّد OpenAI عبر بنية OpenClaw/PI | تريد وصول OpenAI Platform API المباشر الحالي باستخدام `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth عبر OpenClaw/PI       | تريد مصادقة اشتراك ChatGPT/Codex مع مشغّل PI الافتراضي.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | حزام Codex app-server                     | تريد تنفيذ Codex app-server الأصلي لدور الوكيل المضمّن.   |

GPT-5.5 حالياً متاح في OpenClaw عبر الاشتراك/OAuth فقط. استخدم
`openai-codex/gpt-5.5` لـ PI OAuth، أو `openai/gpt-5.5` مع حزام
Codex app-server. يُدعم الوصول المباشر بمفتاح API لـ `openai/gpt-5.5`
بعد أن تفعّل OpenAI نموذج GPT-5.5 على API العام.

لا تزال مراجع `codex/gpt-*` القديمة مقبولة كأسماء مستعارة للتوافق. تعيد
هجرة توافق Doctor كتابة مراجع بيئة التشغيل الأساسية القديمة إلى مراجع نماذج
قياسية وتسجل سياسة بيئة التشغيل بشكل منفصل، بينما تُترك المراجع القديمة
المستخدمة للاحتياطي فقط من دون تغيير لأن بيئة التشغيل تُضبط لحاوية الوكيل كلها.
يجب أن تستخدم إعدادات PI Codex OAuth الجديدة `openai-codex/gpt-*`؛ ويجب أن تستخدم إعدادات
حزام app-server الأصلية الجديدة `openai/gpt-*` بالإضافة إلى
`agentRuntime.id: "codex"`.

يتبع `agents.defaults.imageModel` تقسيم البادئات نفسه. استخدم
`openai-codex/gpt-*` عندما يجب أن يعمل فهم الصور عبر مسار مزوّد
OpenAI Codex OAuth. استخدم `codex/gpt-*` عندما يجب أن يعمل فهم الصور
عبر دور Codex app-server محدود. يجب أن يعلن نموذج Codex app-server
دعم إدخال الصور؛ تفشل نماذج Codex النصية فقط قبل أن يبدأ دور الوسائط.

استخدم `/status` لتأكيد الحزام الفعلي للجلسة الحالية. إذا كان الاختيار
مفاجئاً، ففعّل تسجيل التصحيح للنظام الفرعي `agents/harness`
وافحص سجل Gateway المنظم `agent harness selected`. يتضمن
معرّف الحزام المحدد، وسبب الاختيار، وسياسة بيئة التشغيل/الاحتياطي، وفي
وضع `auto` نتيجة دعم كل مرشح Plugin.

### ما معنى تحذيرات doctor

يحذر `openclaw doctor` عندما تكون كل هذه صحيحة:

- Plugin `codex` المضمّن مفعّل أو مسموح به
- النموذج الأساسي لوكيل هو `openai-codex/*`
- بيئة التشغيل الفعلية لذلك الوكيل ليست `codex`

يوجد ذلك التحذير لأن المستخدمين غالباً ما يتوقعون أن يعني "Codex plugin enabled"
"بيئة تشغيل Codex app-server الأصلية." لا يقوم OpenClaw بهذه القفزة. يعني التحذير:

- **لا يلزم أي تغيير** إذا كنت تقصد ChatGPT/Codex OAuth عبر PI.
- غيّر النموذج إلى `openai/<model>` واضبط
  `agentRuntime.id: "codex"` إذا كنت تقصد تنفيذ app-server
  الأصلي.
- لا تزال الجلسات الحالية تحتاج إلى `/new` أو `/reset` بعد تغيير بيئة التشغيل،
  لأن تثبيتات بيئة تشغيل الجلسة لاصقة.

اختيار الحزام ليس تحكماً مباشراً بجلسة حية. عندما يعمل دور مضمّن،
يسجل OpenClaw معرّف الحزام المختار في تلك الجلسة ويستمر في استخدامه
للأدوار اللاحقة ضمن معرّف الجلسة نفسه. غيّر إعداد `agentRuntime` أو
`OPENCLAW_AGENT_RUNTIME` عندما تريد أن تستخدم الجلسات المستقبلية حزاماً آخر؛
استخدم `/new` أو `/reset` لبدء جلسة جديدة قبل تبديل محادثة موجودة
بين PI وCodex. هذا يتجنب إعادة تشغيل نص واحد عبر
نظامي جلسات أصليين غير متوافقين.

تُعامل الجلسات القديمة المنشأة قبل تثبيتات الحزام كجلسات مثبتة على PI بمجرد أن
تملك سجل نص. استخدم `/new` أو `/reset` لإدخال تلك المحادثة إلى
Codex بعد تغيير الإعدادات.

يعرض `/status` بيئة تشغيل النموذج الفعلية. يظهر حزام PI الافتراضي كـ
`Runtime: OpenClaw Pi Default`، ويظهر حزام Codex app-server كـ
`Runtime: OpenAI Codex`.

## المتطلبات

- OpenClaw مع توفر Plugin `codex` المضمّن.
- Codex app-server `0.125.0` أو أحدث. يدير Plugin المضمّن افتراضياً ملفاً تنفيذياً
  متوافقاً لـ Codex app-server، لذلك لا تؤثر أوامر `codex` المحلية على `PATH` في
  بدء الحزام العادي.
- مصادقة Codex متاحة لعملية app-server أو لجسر مصادقة Codex في OpenClaw.
  تستخدم عمليات تشغيل app-server المحلية عبر stdio منزلاً مداراً من OpenClaw لـ Codex لكل
  وكيل و`HOME` ابن معزولاً، لذلك لا تقرأ حسابك الشخصي
  `~/.codex` أو skills أو plugins أو الإعدادات أو حالة الخيط أو
  `$HOME/.agents/skills` الأصلية افتراضياً.

يحظر Plugin مصافحات app-server الأقدم أو غير المحددة الإصدار. هذا يبقي
OpenClaw على سطح البروتوكول الذي تم اختباره عليه.

لاختبارات الدخان الحية وDocker، تأتي المصادقة عادةً من حساب Codex CLI
أو ملف تعريف مصادقة OpenClaw `openai-codex`. يمكن لعمليات تشغيل app-server
المحلية عبر stdio أيضاً الرجوع إلى `CODEX_API_KEY` / `OPENAI_API_KEY` عندما لا يوجد حساب.

## الإعداد الأدنى

استخدم `openai/gpt-5.5`، وفعّل Plugin المضمّن، وافرض حزام `codex`:

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

إذا كانت إعداداتك تستخدم `plugins.allow`، فأدرج `codex` هناك أيضاً:

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

لا تزال الإعدادات القديمة التي تضبط `agents.defaults.model` أو نموذج وكيل على
`codex/<model>` تفعّل Plugin `codex` المضمّن تلقائياً. يجب أن تفضّل الإعدادات الجديدة
`openai/<model>` بالإضافة إلى إدخال `agentRuntime` الصريح أعلاه.

## أضف Codex إلى جانب نماذج أخرى

لا تضبط `agentRuntime.id: "codex"` عمومياً إذا كان يجب أن يتمكن الوكيل نفسه من التبديل بحرية
بين Codex ونماذج موفري غير Codex. ينطبق وقت التشغيل المفروض على كل
دوران مضمن لذلك الوكيل أو الجلسة. إذا اخترت نموذج Anthropic بينما
وقت التشغيل هذا مفروض، فسيظل OpenClaw يحاول استخدام حزام Codex ويفشل مغلقاً
بدلاً من توجيه ذلك الدوران بصمت عبر PI.

استخدم أحد هذه الأشكال بدلاً من ذلك:

- ضع Codex على وكيل مخصص مع `agentRuntime.id: "codex"`.
- أبق الوكيل الافتراضي على `agentRuntime.id: "auto"` واحتياطي PI للاستخدام المختلط العادي
  لموفري النماذج.
- استخدم مراجع `codex/*` القديمة للتوافق فقط. يجب أن تفضل الإعدادات الجديدة
  `openai/*` مع سياسة وقت تشغيل Codex صريحة.

على سبيل المثال، يبقي هذا الوكيل الافتراضي على الاختيار التلقائي العادي
ويضيف وكيلاً منفصلاً لـ Codex:

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
        fallback: "pi",
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

مع هذا الشكل:

- يستخدم الوكيل الافتراضي `main` مسار الموفر العادي واحتياطي توافق PI.
- يستخدم وكيل `codex` حزام خادم تطبيق Codex.
- إذا كان Codex مفقوداً أو غير مدعوم لوكيل `codex`، يفشل الدوران
  بدلاً من استخدام PI بصمت.

## توجيه أوامر الوكيل

يجب أن يوجه الوكلاء طلبات المستخدم حسب القصد، وليس حسب كلمة "Codex" وحدها:

| عندما يطلب المستخدم...                                  | يجب أن يستخدم الوكيل...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Bind this chat to Codex"                                | `/codex bind`                                    |
| "Resume Codex thread `<id>` here"                        | `/codex resume <id>`                             |
| "Show Codex threads"                                     | `/codex threads`                                 |
| "File a support report for a bad Codex run"              | `/diagnostics [note]`                            |
| "Only send Codex feedback for this attached thread"      | `/codex diagnostics [note]`                      |
| "Use Codex as the runtime for this agent"                | تغيير إعدادات إلى `agentRuntime.id`              |
| "Use my ChatGPT/Codex subscription with normal OpenClaw" | مراجع نماذج `openai-codex/*`                    |
| "Run Codex through ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in a thread"   | ACP/acpx، وليس `/codex` ولا الوكلاء الفرعيين الأصليين |

لا يعلن OpenClaw إرشادات إنشاء ACP للوكلاء إلا عندما يكون ACP مفعلاً،
وقابلاً للإرسال، ومدعوماً بخلفية وقت تشغيل محملة. إذا لم يكن ACP متاحاً،
فيجب ألا تعلم مطالبة النظام ومهارات Plugin الوكيل عن توجيه ACP.

## عمليات نشر Codex فقط

افرض حزام Codex عندما تحتاج إلى إثبات أن كل دوران وكيل مضمن
يستخدم Codex. تستخدم أوقات تشغيل Plugin الصريحة افتراضياً عدم وجود احتياطي PI، لذلك
يكون `fallback: "none"` اختيارياً لكنه مفيد غالباً كتوثيق:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

تجاوز البيئة:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

مع فرض Codex، يفشل OpenClaw مبكراً إذا كان Plugin Codex معطلاً، أو كان
خادم التطبيق قديماً جداً، أو تعذر بدء خادم التطبيق. اضبط
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` فقط إذا كنت تريد عمداً أن يتولى PI
اختيار الحزام المفقود.

## Codex لكل وكيل

يمكنك جعل وكيل واحد مخصصاً لـ Codex فقط بينما يحتفظ الوكيل الافتراضي
بالاختيار التلقائي العادي:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

استخدم أوامر الجلسة العادية للتبديل بين الوكلاء والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة وينشئ حزام Codex أو يستأنف سلسلة خادم التطبيق الجانبية
حسب الحاجة. يمسح `/reset` ربط جلسة OpenClaw لذلك الخيط
ويتيح للدوران التالي حل الحزام من الإعدادات الحالية مرة أخرى.

## اكتشاف النماذج

افتراضياً، يطلب Plugin Codex من خادم التطبيق النماذج المتاحة. إذا
فشل الاكتشاف أو انتهت مهلته، فإنه يستخدم فهرساً احتياطياً مضمنًا لـ:

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

عطل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex ويلتزم
بالفهرس الاحتياطي:

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

افتراضياً، يبدأ Plugin ثنائية Codex المُدارة من OpenClaw محلياً باستخدام:

```bash
codex app-server --listen stdio://
```

تُعلن الثنائية المُدارة كتَبَعية وقت تشغيل Plugin مضمنة وتُحضّر
مع بقية تبعيات Plugin `codex`. هذا يبقي إصدار خادم التطبيق
مرتبطاً بـ Plugin المضمن بدلاً من أي CLI منفصل لـ Codex
قد يكون مثبتاً محلياً. اضبط `appServer.command` فقط عندما تريد
عمداً تشغيل ملف تنفيذي مختلف.

افتراضياً، يبدأ OpenClaw جلسات حزام Codex المحلية في وضع YOLO:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. هذه هي وضعية المشغل المحلي الموثوق بها المستخدمة
لـ heartbeats المستقلة: يستطيع Codex استخدام أدوات shell والشبكة دون
التوقف عند مطالبات الموافقة الأصلية التي لا يوجد أحد للإجابة عليها.

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

يستخدم وضع Guardian مسار موافقة المراجعة التلقائية الأصلي في Codex. عندما يطلب Codex
مغادرة sandbox، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل الوصول إلى الشبكة،
يوجه Codex طلب الموافقة هذا إلى المراجع الأصلي بدلاً من
مطالبة بشرية. يطبق المراجع إطار مخاطر Codex ويوافق أو يرفض
الطلب المحدد. استخدم Guardian عندما تريد حواجز حماية أكثر من وضع YOLO
ولكنك لا تزال تحتاج إلى أن يواصل الوكلاء غير المراقبين التقدم.

يتوسع الإعداد المسبق `guardian` إلى `approvalPolicy: "on-request"`،
و`approvalsReviewer: "auto_review"`، و`sandbox: "workspace-write"`.
لا تزال حقول السياسة الفردية تتجاوز `mode`، لذا يمكن لعمليات النشر المتقدمة مزج
الإعداد المسبق مع اختيارات صريحة. لا تزال قيمة المراجع الأقدم `guardian_subagent`
مقبولة كاسم مستعار للتوافق، لكن يجب أن تستخدم الإعدادات الجديدة
`auto_review`.

لخادم تطبيق قيد التشغيل بالفعل، استخدم نقل WebSocket:

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

ترث عمليات تشغيل خادم التطبيق عبر stdio بيئة عملية OpenClaw افتراضياً،
لكن OpenClaw يملك جسر حساب خادم تطبيق Codex ويضبط كلاً من
`CODEX_HOME` و`HOME` إلى مجلدات لكل وكيل ضمن حالة OpenClaw
الخاصة بذلك الوكيل. يقرأ محمل Skills الخاص بـ Codex من `$CODEX_HOME/skills` و
`$HOME/.agents/skills`، لذلك تكون كلتا القيمتين معزولتين لعمليات تشغيل خادم التطبيق
المحلية. هذا يبقي Skills الأصلية في Codex، وplugins، والإعدادات، والحسابات، وحالة الخيوط
ضمن نطاق وكيل OpenClaw بدلاً من تسربها من موطن CLI الشخصي لـ Codex لدى المشغل.

لا تزال Plugins OpenClaw ولقطات Skills الخاصة بـ OpenClaw تمر عبر سجل Plugin ومحمل Skills
الخاصين بـ OpenClaw. أما أصول CLI الشخصية لـ Codex فلا تمر. إذا كانت لديك
Skills أو plugins مفيدة لـ CLI Codex ويجب أن تصبح جزءاً من وكيل OpenClaw،
فاجردها صراحة:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ينسخ موفر ترحيل Codex Skills إلى مساحة عمل وكيل OpenClaw الحالية.
يتم الإبلاغ عن plugins الأصلية في Codex والخطافات وملفات الإعدادات أو أرشفتها
للمراجعة اليدوية بدلاً من تفعيلها تلقائياً، لأنها يمكن أن
تنفذ أوامر، أو تكشف خوادم MCP، أو تحمل بيانات اعتماد.

يُختار المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw Codex صريح للوكيل.
2. حساب خادم التطبيق الموجود في موطن Codex لذلك الوكيل.
3. لعمليات تشغيل خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY` ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيق وتظل مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المُنشأة. هذا
يبقي مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
دون أن يجعل دورانات خادم تطبيق Codex الأصلية تُفوَّتر عبر API عن طريق الخطأ.
تستخدم ملفات تعريف مفاتيح API الصريحة لـ Codex واحتياطي مفاتيح البيئة المحلي عبر stdio
تسجيل دخول خادم التطبيق بدلاً من بيئة العملية الفرعية الموروثة. لا تتلقى اتصالات
خادم التطبيق عبر WebSocket احتياطي مفاتيح API من بيئة Gateway؛ استخدم ملف تعريف مصادقة صريحاً أو
حساب خادم التطبيق البعيد نفسه.

إذا احتاج نشر ما إلى عزل بيئي إضافي، فأضف تلك المتغيرات إلى
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

حقول `appServer` المدعومة:

| الحقل               | الافتراضي                                  | المعنى                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | يشغّل `"stdio"` Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                             |
| `command`           | ثنائي Codex مُدار                     | الملف التنفيذي لنقل stdio. اتركه غير معيّن لاستخدام الثنائي المُدار؛ ولا تعيّنه إلا لتجاوز صريح.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | الوسائط لنقل stdio.                                                                                                                                                                                                       |
| `url`               | غير معيّن                                    | عنوان URL لخادم تطبيق WebSocket.                                                                                                                                                                                                            |
| `authToken`         | غير معيّن                                    | رمز Bearer لنقل WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | أسماء متغيرات بيئة إضافية تُزال من عملية خادم تطبيق stdio التي تم إنشاؤها بعد أن يبني OpenClaw بيئته الموروثة. `CODEX_HOME` و `HOME` محجوزان لعزل Codex لكل وكيل في OpenClaw عند عمليات التشغيل المحلية. |
| `requestTimeoutMs`  | `60000`                                  | مهلة استدعاءات مستوى التحكم لخادم التطبيق.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | إعداد مسبق لتنفيذ YOLO أو تنفيذ يراجعه الحارس.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | سياسة موافقات Codex الأصلية المرسلة إلى بدء/استئناف/دورة المحادثة.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | وضع صندوق رمل Codex الأصلي المرسل إلى بدء/استئناف دورة المحادثة.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية. يظل `guardian_subagent` اسمًا مستعارًا قديمًا.                                                                                                                         |
| `serviceTier`       | غير معيّن                                    | طبقة خدمة خادم تطبيق Codex الاختيارية: `"fast"` أو `"flex"` أو `null`. تُتجاهل القيم القديمة غير الصالحة.                                                                                                                            |

تكون استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw محدودة بشكل مستقل عن
`appServer.requestTimeoutMs`: يجب أن يتلقى كل طلب Codex من نوع `item/tool/call`
استجابة من OpenClaw خلال 30 ثانية. عند انتهاء المهلة، يجهض OpenClaw إشارة
الأداة حيثما يكون ذلك مدعومًا، ويعيد إلى Codex استجابة أداة ديناميكية فاشلة
كي تتمكن دورة المحادثة من المتابعة بدلًا من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب خادم تطبيق بنطاق دورة محادثة من Codex، يتوقع
حزام الاختبار أيضًا أن ينهي Codex دورة المحادثة الأصلية باستخدام
`turn/completed`. إذا أصبح خادم التطبيق صامتًا لمدة 60 ثانية بعد تلك الاستجابة،
يقاطع OpenClaw دورة محادثة Codex بأفضل جهد، ويسجل مهلة تشخيصية، ويحرر مسار
جلسة OpenClaw حتى لا تصطف رسائل الدردشة اللاحقة خلف دورة محادثة أصلية قديمة.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` لاختبار محلي لمرة واحدة. يُفضّل
الإعداد لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في الملف نفسه
الذي تمت مراجعته مثل بقية إعداد حزام Codex.

## استخدام الكمبيوتر

استخدام الكمبيوتر مغطى في دليل إعداد مستقل:
[استخدام كمبيوتر Codex](/ar/plugins/codex-computer-use).

النسخة المختصرة: لا يضمّن OpenClaw تطبيق التحكم بسطح المكتب ولا ينفذ
إجراءات سطح المكتب بنفسه. إنه يجهّز خادم تطبيق Codex، ويتحقق من توفر خادم
MCP `computer-use`، ثم يترك Codex يتعامل مع استدعاءات أدوات MCP الأصلية أثناء
دورات وضع Codex.

للوصول المباشر إلى برنامج تشغيل TryCua خارج تدفق سوق Codex، سجّل
`cua-driver mcp` باستخدام `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
راجع [استخدام كمبيوتر Codex](/ar/plugins/codex-computer-use) لمعرفة الفرق بين
استخدام الكمبيوتر المملوك لـ Codex والتسجيل المباشر في MCP.

الحد الأدنى للإعداد:

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
        fallback: "none",
      },
    },
  },
}
```

يمكن التحقق من الإعداد أو تثبيته من واجهة الأوامر:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

استخدام الكمبيوتر خاص بـ macOS وقد يتطلب أذونات نظام تشغيل محلية قبل أن يتمكن
خادم Codex MCP من التحكم بالتطبيقات. إذا كانت `computerUse.enabled` تساوي true
وكان خادم MCP غير متاح، تفشل دورات وضع Codex قبل بدء الخيط بدلًا من التشغيل
الصامت دون أدوات استخدام الكمبيوتر الأصلية. راجع
[استخدام كمبيوتر Codex](/ar/plugins/codex-computer-use) لمعرفة خيارات السوق،
وحدود الفهرس البعيد، وأسباب الحالة، واستكشاف الأخطاء وإصلاحها.

عندما تكون `computerUse.autoInstall` تساوي true، يمكن لـ OpenClaw تسجيل سوق
Codex Desktop القياسي المضمّن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` إذا لم يكن
Codex قد اكتشف سوقًا محليًا بعد. استخدم `/new` أو `/reset` بعد تغيير إعداد
وقت التشغيل أو استخدام الكمبيوتر حتى لا تحتفظ الجلسات الحالية بربط Pi أو خيط
Codex قديم.

## وصفات شائعة

Codex المحلي مع نقل stdio الافتراضي:

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

موافقات Codex التي يراجعها الحارس:

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

خادم تطبيق بعيد مع ترويسات صريحة:

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

يبقى تبديل النموذج تحت تحكم OpenClaw. عندما تكون جلسة OpenClaw مرفقة بخيط
Codex موجود، ترسل دورة المحادثة التالية نموذج OpenAI، والمزوّد، وسياسة
الموافقة، وصندوق الرمل، وطبقة الخدمة المحددة حاليًا إلى خادم التطبيق مرة
أخرى. يؤدي التبديل من `openai/gpt-5.5` إلى `openai/gpt-5.2` إلى إبقاء ربط
الخيط، لكنه يطلب من Codex المتابعة بالنموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمّن `/codex` كأمر شرطة مائلة مصرح به. وهو عام ويعمل على أي
قناة تدعم أوامر OpenClaw النصية.

الأشكال الشائعة:

- يعرض `/codex status` اتصال خادم التطبيق المباشر، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج خادم تطبيق Codex المباشرة.
- يسرد `/codex threads [filter]` خيوط Codex الحديثة.
- يرفق `/codex resume <thread-id>` جلسة OpenClaw الحالية بخيط Codex موجود.
- يطلب `/codex compact` من خادم تطبيق Codex ضغط الخيط المرفق.
- يبدأ `/codex review` مراجعة Codex الأصلية للخيط المرفق.
- يطلب `/codex diagnostics [note]` الموافقة قبل إرسال ملاحظات تشخيص Codex للخيط المرفق.
- يتحقق `/codex computer-use status` من Plugin استخدام الكمبيوتر وخادم MCP المكوّنين.
- يثبت `/codex computer-use install` Plugin استخدام الكمبيوتر المكوّن ويعيد تحميل خوادم MCP.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خادم MCP لخادم تطبيق Codex.
- يسرد `/codex skills` مهارات خادم تطبيق Codex.

### سير عمل تصحيح شائع

عندما يفعل وكيل مدعوم بـ Codex شيئًا مفاجئًا في Telegram أو Discord أو Slack
أو قناة أخرى، ابدأ بالمحادثة التي حدثت فيها المشكلة:

1. شغّل `/diagnostics bad tool choice after image upload` أو ملاحظة قصيرة أخرى
   تصف ما رأيته.
2. وافق على طلب التشخيص مرة واحدة. تنشئ الموافقة ملف zip لتشخيصات Gateway
   المحلية، وبما أن الجلسة تستخدم حزام Codex، فإنها ترسل أيضًا حزمة ملاحظات
   Codex ذات الصلة إلى خوادم OpenAI.
3. انسخ رد التشخيص المكتمل إلى تقرير الخطأ أو خيط الدعم.
   يتضمن مسار الحزمة المحلية، وملخص الخصوصية، ومعرّفات جلسات OpenClaw،
   ومعرّفات خيوط Codex، وسطر `Inspect locally` لكل خيط Codex.
4. إذا أردت تصحيح التشغيل بنفسك، فشغّل أمر `Inspect locally` المطبوع
   في الطرفية. يبدو مثل `codex resume <thread-id>` ويفتح خيط Codex الأصلي
   حتى تتمكن من فحص المحادثة، أو متابعتها محليًا،
   أو سؤال Codex عن سبب اختياره أداة أو خطة معينة.

استخدم `/codex diagnostics [note]` فقط عندما تريد تحديدًا رفع ملاحظات Codex للخيط المرفق حاليًا من دون حزمة تشخيصات OpenClaw Gateway الكاملة. في معظم تقارير الدعم، يكون `/diagnostics [note]` نقطة بداية أفضل لأنه يربط حالة Gateway المحلية ومعرفات خيوط Codex معًا في رد واحد. راجع [تصدير التشخيصات](/ar/gateway/diagnostics) للاطلاع على نموذج الخصوصية الكامل وسلوك محادثات المجموعات.

يوفر OpenClaw الأساسي أيضًا أمر `/diagnostics [note]` المخصص للمالكين فقط بوصفه أمر تشخيصات Gateway العام. يعرض طلب الموافقة الخاص به تمهيد البيانات الحساسة، ويربط إلى [تصدير التشخيصات](/ar/gateway/diagnostics)، ويطلب `openclaw gateway diagnostics export --json` عبر موافقة تنفيذ صريحة في كل مرة. لا توافق على التشخيصات باستخدام قاعدة سماح شاملة. بعد الموافقة، يرسل OpenClaw تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلية وملخص البيان. عندما تستخدم جلسة OpenClaw النشطة حزام Codex، تفوض الموافقة نفسها أيضًا إرسال حزم ملاحظات Codex ذات الصلة إلى خوادم OpenAI. يذكر طلب الموافقة أنه سيتم إرسال ملاحظات Codex، لكنه لا يسرد معرفات جلسة Codex أو خيوطه قبل الموافقة.

إذا استدعى مالك `/diagnostics` في محادثة جماعية، يبقي OpenClaw القناة المشتركة نظيفة: تتلقى المجموعة إشعارًا قصيرًا فقط، بينما تُرسل تمهيدات التشخيصات وطلبات الموافقة ومعرفات جلسة/خيط Codex إلى المالك عبر مسار الموافقة الخاص. إذا لم يكن هناك مسار خاص للمالك، يرفض OpenClaw طلب المجموعة ويطلب من المالك تشغيله من رسالة مباشرة.

يستدعي رفع Codex الموافق عليه `feedback/upload` في خادم تطبيق Codex ويطلب من خادم التطبيق تضمين السجلات لكل خيط مدرج وللخيوط الفرعية المولدة من Codex عند توفرها. يمر الرفع عبر مسار ملاحظات Codex العادي إلى خوادم OpenAI؛ إذا كانت ملاحظات Codex معطلة في خادم التطبيق ذلك، يعيد الأمر خطأ خادم التطبيق. يسرد رد التشخيصات المكتمل القنوات، ومعرفات جلسات OpenClaw، ومعرفات خيوط Codex، وأوامر `codex resume <thread-id>` المحلية للخيوط التي أُرسلت. إذا رفضت الموافقة أو تجاهلتها، لا يطبع OpenClaw معرفات Codex تلك. لا يحل هذا الرفع محل تصدير تشخيصات Gateway المحلي.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي يستخدمه الحزام في الدوران العادي. في الرسالة التالية، يستأنف OpenClaw خيط Codex ذلك، ويمرر نموذج OpenClaw المحدد حاليًا إلى خادم التطبيق، ويبقي السجل الممتد ممكّنًا.

### فحص خيط Codex من CLI

غالبًا ما تكون أسرع طريقة لفهم تشغيل Codex سيئ هي فتح خيط Codex الأصلي مباشرة:

```sh
codex resume <thread-id>
```

استخدم هذا عندما تلاحظ خللًا في محادثة قناة وتريد فحص جلسة Codex المسببة للمشكلة، أو متابعتها محليًا، أو سؤال Codex عن سبب اتخاذه خيار أداة أو استدلال معين. يكون المسار الأسهل عادةً هو تشغيل `/diagnostics [note]` أولًا: بعد أن توافق عليه، يسرد التقرير المكتمل كل خيط Codex ويطبع أمر `Inspect locally`، مثل `codex resume <thread-id>`. يمكنك نسخ ذلك الأمر مباشرة إلى الطرفية.

يمكنك أيضًا الحصول على معرف خيط من `/codex binding` للمحادثة الحالية أو من `/codex threads [filter]` لخيوط خادم تطبيق Codex الحديثة، ثم تشغيل أمر `codex resume` نفسه في الصدفة لديك.

يتطلب سطح الأوامر خادم تطبيق Codex بالإصدار `0.125.0` أو أحدث. تُبلّغ أساليب التحكم الفردية على أنها `unsupported by this Codex app-server` إذا كان خادم تطبيق مستقبلي أو مخصص لا يوفر أسلوب JSON-RPC ذلك.

## حدود الخطافات

يحتوي حزام Codex على ثلاث طبقات خطافات:

| الطبقة                                 | المالك                    | الغرض                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| خطافات Plugin في OpenClaw                 | OpenClaw                 | توافق المنتج/Plugin عبر أحزمة PI وCodex.         |
| وسيط ملحق خادم تطبيق Codex | Plugins المجمعة مع OpenClaw | سلوك المهيئ لكل دورة حول أدوات OpenClaw الديناميكية.            |
| خطافات Codex الأصلية                    | Codex                    | دورة حياة Codex منخفضة المستوى وسياسة الأدوات الأصلية من إعدادات Codex. |

لا يستخدم OpenClaw ملفات `hooks.json` الخاصة بالمشروع أو العامة في Codex لتوجيه سلوك Plugin في OpenClaw. بالنسبة إلى جسر الأدوات الأصلية والأذونات المدعوم، يحقن OpenClaw إعدادات Codex لكل خيط لـ `PreToolUse` و`PostToolUse` و`PermissionRequest` و`Stop`. تبقى خطافات Codex الأخرى مثل `SessionStart` و`UserPromptSubmit` عناصر تحكم على مستوى Codex؛ ولا تُعرض كخطافات Plugin في OpenClaw ضمن عقد v1.

بالنسبة إلى أدوات OpenClaw الديناميكية، ينفذ OpenClaw الأداة بعد أن يطلب Codex الاستدعاء، لذلك يطلق OpenClaw سلوك Plugin والوسيط الذي يملكه في مهيئ الحزام. بالنسبة إلى أدوات Codex الأصلية، يملك Codex سجل الأداة المعياري. يمكن لـ OpenClaw عكس أحداث محددة، لكنه لا يستطيع إعادة كتابة خيط Codex الأصلي ما لم يكشف Codex تلك العملية عبر خادم التطبيق أو استدعاءات الخطافات الأصلية.

تأتي إسقاطات Compaction ودورة حياة LLM من إشعارات خادم تطبيق Codex وحالة مهيئ OpenClaw، وليس من أوامر خطافات Codex الأصلية. أحداث `before_compaction` و`after_compaction` و`llm_input` و`llm_output` في OpenClaw هي ملاحظات على مستوى المهيئ، وليست التقاطًا مطابقًا بالبايتات لطلب Codex الداخلي أو حمولات Compaction.

تُسقط إشعارات خادم تطبيق Codex الأصلية `hook/started` و`hook/completed` كأحداث وكيل `codex_app_server.hook` للمسار الزمني والتصحيح. لكنها لا تستدعي خطافات Plugin في OpenClaw.

## عقد دعم V1

وضع Codex ليس PI مع استدعاء نموذج مختلف في الأسفل. يملك Codex مزيدًا من حلقة النموذج الأصلية، ويكيف OpenClaw أسطح Plugin والجلسات الخاصة به حول ذلك الحد.

مدعوم في وقت تشغيل Codex v1:

| السطح                                       | الدعم                                 | السبب                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقة نموذج OpenAI عبر Codex               | مدعوم                               | يملك خادم تطبيق Codex دورة OpenAI، واستئناف الخيط الأصلي، ومتابعة الأداة الأصلية.                                                                                                            |
| توجيه قنوات OpenClaw والتسليم         | مدعوم                               | تبقى Telegram وDiscord وSlack وWhatsApp وiMessage وقنوات أخرى خارج وقت تشغيل النموذج.                                                                                                      |
| أدوات OpenClaw الديناميكية                        | مدعوم                               | يطلب Codex من OpenClaw تنفيذ هذه الأدوات، لذلك يبقى OpenClaw في مسار التنفيذ.                                                                                                                  |
| Plugins المطالبات والسياق                    | مدعوم                               | يبني OpenClaw طبقات المطالبات ويسقط السياق في دورة Codex قبل بدء الخيط أو استئنافه.                                                                                      |
| دورة حياة محرك السياق                      | مدعوم                               | يعمل التجميع، أو الاستيعاب أو صيانة ما بعد الدورة، وتنسيق Compaction لمحرك السياق لدورات Codex.                                                                                           |
| خطافات الأدوات الديناميكية                            | مدعوم                               | تعمل `before_tool_call` و`after_tool_call` ووسيط نتيجة الأداة حول الأدوات الديناميكية المملوكة لـ OpenClaw.                                                                                            |
| خطافات دورة الحياة                               | مدعوم كملاحظات مهيئ       | تُطلق `llm_input` و`llm_output` و`agent_end` و`before_compaction` و`after_compaction` بحمولات صادقة لوضع Codex.                                                                             |
| بوابة مراجعة الإجابة النهائية                    | مدعوم عبر مرحل الخطاف الأصلي | يُرحل `Stop` في Codex إلى `before_agent_finalize`؛ ويطلب `revise` من Codex تمرير نموذج إضافيًا قبل الإنهاء.                                                                                  |
| حظر أو مراقبة الصدفة والتصحيح وMCP الأصلية | مدعوم عبر مرحل الخطاف الأصلي | تُرحل `PreToolUse` و`PostToolUse` في Codex لأسطح الأدوات الأصلية الملتزم بها، بما في ذلك حمولات MCP على خادم تطبيق Codex `0.125.0` أو أحدث. الحظر مدعوم؛ إعادة كتابة الوسيطات غير مدعومة. |
| سياسة الأذونات الأصلية                      | مدعوم عبر مرحل الخطاف الأصلي | يمكن توجيه `PermissionRequest` في Codex عبر سياسة OpenClaw حيثما يكشف وقت التشغيل ذلك. إذا لم يُرجع OpenClaw أي قرار، يواصل Codex عبر مسار الحارس العادي أو موافقة المستخدم.     |
| التقاط مسار خادم التطبيق                 | مدعوم                               | يسجل OpenClaw الطلب الذي أرسله إلى خادم التطبيق والإشعارات التي يتلقاها من خادم التطبيق.                                                                                                      |

غير مدعوم في وقت تشغيل Codex v1:

| السطح                                             | حد V1                                                                                                                                     | المسار المستقبلي                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تعديل وسيطات الأداة الأصلية                       | يمكن لخطاطيف Codex الأصلية قبل الأداة الحظر، لكن OpenClaw لا يعيد كتابة وسيطات أدوات Codex الأصلية.                                               | يتطلب دعم خطاف/مخطط Codex لاستبدال إدخال الأداة.                            |
| سجل نصوص Codex الأصلي القابل للتحرير            | يمتلك Codex سجل السلسلة الأصلية المعياري. يمتلك OpenClaw مرآة ويمكنه إسقاط سياق مستقبلي، لكن ينبغي ألا يعدل الأجزاء الداخلية غير المدعومة. | أضف APIs صريحة لخادم تطبيق Codex إذا كانت جراحة السلسلة الأصلية مطلوبة.                    |
| `tool_result_persist` لسجلات أدوات Codex الأصلية | يحول ذلك الخطاف كتابات السجل النصي التي يملكها OpenClaw، وليس سجلات أدوات Codex الأصلية.                                                           | يمكن عكس السجلات المحولة، لكن إعادة الكتابة المعيارية تحتاج إلى دعم Codex.              |
| بيانات تعريف Compaction الأصلية الغنية                     | يراقب OpenClaw بدء Compaction واكتماله، لكنه لا يتلقى قائمة ثابتة بما تم الاحتفاظ به/إسقاطه، أو فرق الرموز، أو حمولة الملخص.            | يحتاج إلى أحداث Compaction أغنى من Codex.                                                     |
| التدخل في Compaction                             | خطاطيف Compaction الحالية في OpenClaw بمستوى الإشعار في وضع Codex.                                                                         | أضف خطاطيف Codex قبل/بعد Compaction إذا احتاجت Pluginات إلى رفض Compaction الأصلي أو إعادة كتابته. |
| التقاط طلب API النموذج مطابقا بالبايت             | يستطيع OpenClaw التقاط طلبات خادم التطبيق والإشعارات، لكن نواة Codex تبني طلب OpenAI API النهائي داخليا.                      | يحتاج إلى حدث تتبع طلب نموذج من Codex أو API تصحيح.                                   |

## الأدوات والوسائط وCompaction

يغير حزام Codex منفذ الوكيل المضمن منخفض المستوى فقط.

لا يزال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
الحزام. يستمر النص والصور والفيديو والموسيقى وTTS والموافقات ومخرجات أدوات
المراسلة عبر مسار التسليم المعتاد في OpenClaw.

مرحل الخطاف الأصلي عام عمدا، لكن عقد دعم v1 محدود بمسارات أدوات Codex الأصلية
والأذونات التي يختبرها OpenClaw. في وقت تشغيل Codex، يشمل ذلك حمولات
shell وpatch وMCP `PreToolUse` و`PostToolUse` و`PermissionRequest`. لا تفترض أن كل حدث
خطاف Codex مستقبلي هو سطح Plugin في OpenClaw حتى يسميه عقد وقت التشغيل.

بالنسبة إلى `PermissionRequest`، يعيد OpenClaw فقط قرارات السماح أو الرفض الصريحة
عندما تقرر السياسة. نتيجة عدم وجود قرار ليست سماحا. يعاملها Codex كعدم وجود
قرار خطاف، ثم يتابع إلى مسار الحارس الخاص به أو موافقة المستخدم.

توجه طلبات الموافقة على أدوات Codex MCP عبر تدفق موافقة Plugin في OpenClaw
عندما يضع Codex علامة `_meta.codex_approval_kind` كـ
`"mcp_tool_call"`. ترسل مطالبات Codex `request_user_input` مرة أخرى إلى
الدردشة الأصلية، وتجيب رسالة المتابعة التالية في الطابور عن طلب الخادم
الأصلي ذلك بدلا من توجيهها كسياق إضافي. لا تزال طلبات الاستيضاح الأخرى من MCP
تفشل بشكل مغلق.

يرتبط توجيه طابور التشغيل النشط بـ Codex app-server `turn/steer`. مع
الإعداد الافتراضي `messages.queue.mode: "steer"`، يجمع OpenClaw رسائل الدردشة
الموضوعة في الطابور ضمن نافذة الهدوء المضبوطة ويرسلها كطلب `turn/steer` واحد
بترتيب الوصول. يرسل وضع `queue` القديم طلبات `turn/steer` منفصلة. يمكن أن
ترفض أدوار مراجعة Codex وCompaction اليدوي التوجيه في الدور نفسه، وفي هذه
الحالة يستخدم OpenClaw طابور المتابعة عندما يسمح الوضع المحدد بالرجوع. راجع
[طابور التوجيه](/ar/concepts/queue-steering).

عندما يستخدم النموذج المحدد حزام Codex، يفوض Compaction للسلسلة الأصلية إلى
Codex app-server. يحتفظ OpenClaw بمرآة سجل نصي لسجل القناة والبحث و`/new` و`/reset`
والتبديل المستقبلي للنموذج أو الحزام. تتضمن المرآة مطالبة المستخدم ونص
المساعد النهائي وسجلات استدلال أو خطة Codex خفيفة عندما يصدرها خادم التطبيق.
اليوم، يسجل OpenClaw فقط إشارات بدء Compaction الأصلي واكتماله. ولا يعرض بعد
ملخص Compaction مقروءا للبشر أو قائمة قابلة للتدقيق بالإدخالات التي احتفظ بها
Codex بعد Compaction.

نظرا إلى أن Codex يمتلك السلسلة الأصلية المعيارية، فإن `tool_result_persist` لا
يعيد حاليا كتابة سجلات نتائج أدوات Codex الأصلية. ينطبق فقط عندما يكتب OpenClaw
نتيجة أداة في سجل نص جلسة يملكه OpenClaw.

لا يتطلب توليد الوسائط PI. يستمر فهم الصور والفيديو والموسيقى وPDF وTTS
والوسائط في استخدام إعدادات الموفر/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel` و`videoGenerationModel` و`pdfModel` و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex كموفر `/model` عادي:** هذا متوقع في الإعدادات الجديدة. حدد نموذجا
`openai/gpt-*` مع
`agentRuntime.id: "codex"` (أو مرجعا قديما `codex/*`)، ومكن
`plugins.entries.codex.enabled`، وتحقق مما إذا كان `plugins.allow` يستبعد
`codex`.

**يستخدم OpenClaw PI بدلا من Codex:** لا يزال بإمكان `agentRuntime.id: "auto"` استخدام PI كخلفية
توافق عندما لا يطالب أي حزام Codex بالتشغيل. اضبط
`agentRuntime.id: "codex"` لفرض اختيار Codex أثناء الاختبار. يفشل وقت تشغيل
Codex المفروض الآن بدلا من الرجوع إلى PI ما لم تضبط صراحة
`agentRuntime.fallback: "pi"`. بمجرد اختيار Codex app-server، تظهر إخفاقاته
مباشرة دون إعداد رجوع إضافي.

**تم رفض خادم التطبيق:** رق Codex بحيث يبلغ مصافحة خادم التطبيق
عن الإصدار `0.125.0` أو أحدث. ترفض الإصدارات التمهيدية من الإصدار نفسه أو
الإصدارات ذات لاحقة البناء مثل `0.125.0-alpha.2` أو `0.125.0+custom` لأن أرضية
بروتوكول `0.125.0` المستقرة هي ما يختبره OpenClaw.

**اكتشاف النماذج بطيء:** اخفض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطل الاكتشاف.

**يفشل نقل WebSocket فورا:** تحقق من `appServer.url` و`authToken`،
وأن خادم التطبيق البعيد يتحدث إصدار بروتوكول Codex app-server نفسه.

**يستخدم نموذج غير Codex PI:** هذا متوقع ما لم تكن قد فرضت
`agentRuntime.id: "codex"` لذلك الوكيل أو حددت مرجعا قديما
`codex/*`. تبقى مراجع `openai/gpt-*` العادية ومراجع الموفرين الآخرين على مسار
الموفر المعتاد لها في وضع `auto`. إذا فرضت `agentRuntime.id: "codex"`، فيجب أن
يكون كل دور مضمن لذلك الوكيل نموذجا من OpenAI مدعوما من Codex.

**Computer Use مثبت لكن الأدوات لا تعمل:** تحقق من
`/codex computer-use status` من جلسة جديدة. إذا أبلغت أداة عن
`Native hook relay unavailable`، فاستخدم `/new` أو `/reset`؛ وإذا استمر ذلك، فأعد
تشغيل Gateway لمسح تسجيلات الخطاطيف الأصلية القديمة. إذا انتهت مهلة
`computer-use.list_apps`، فأعد تشغيل Codex Computer Use أو Codex Desktop ثم أعد
المحاولة.

## ذو صلة

- [Pluginات حزام الوكيل](/ar/plugins/sdk-agent-harness)
- [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [موفرو النماذج](/ar/concepts/model-providers)
- [موفر OpenAI](/ar/providers/openai)
- [الحالة](/ar/cli/status)
- [خطاطيف Plugin](/ar/plugins/hooks)
- [مرجع الإعداد](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
