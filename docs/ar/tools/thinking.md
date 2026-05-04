---
read_when:
    - تعديل تحليل توجيهات التفكير أو الوضع السريع أو الإسهاب أو إعداداتها الافتراضية
summary: صيغة التوجيهات لـ /think و/fast و/verbose و/trace وإمكانية رؤية الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-05-04T07:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## ما الذي يفعله

- توجيه مضمّن في أي نص وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (أقصى ميزانية)
  - xhigh → “ultrathink+” (نماذج GPT-5.2+ وCodex، بالإضافة إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → التفكير التكيّفي المُدار من المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock، وAnthropic Claude Opus 4.7، والتفكير الديناميكي في Google Gemini)
  - max → أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7؛ يربط Ollama هذا بأعلى جهد `think` أصلي لديه)
  - يتم تعيين `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` إلى `xhigh`.
  - يتم تعيين `highest` إلى `high`.
- ملاحظات المزوّد:
  - قوائم التفكير وأدوات الاختيار مدفوعة بملف تعريف المزوّد. تعلن Plugins المزوّد مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يتم الإعلان عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. تُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع الخيارات الصالحة لذلك النموذج.
  - يُعاد تعيين المستويات غير المدعومة المخزنة سابقًا حسب ترتيب ملف تعريف المزوّد. يعود `adaptive` إلى `medium` في النماذج غير التكيّفية، بينما يعود `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - نماذج Anthropic Claude 4.6 تعتمد `adaptive` افتراضيًا عندما لا يُضبط مستوى تفكير صريح.
  - لا يعتمد Anthropic Claude Opus 4.7 التفكير التكيّفي افتراضيًا. يبقى افتراض جهد API مملوكًا للمزوّد ما لم تضبط مستوى تفكير صراحةً.
  - يعيّن Anthropic Claude Opus 4.7 الأمر `/think xhigh` إلى التفكير التكيّفي مع `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد جهد Opus 4.7.
  - يوفّر Anthropic Claude Opus 4.7 أيضًا `/think max`؛ ويُعيَّن إلى مسار أقصى جهد نفسه المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 الأمر `/think xhigh|max`؛ وكلاهما يُعيَّن إلى DeepSeek `reasoning_effort: "max"` بينما تُعيَّن المستويات الأدنى غير `off` إلى `high`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويُعيَّن `max` إلى `think: "high"` الأصلي لأن API الأصلي في Ollama يقبل سلاسل الجهد `low` و`medium` و`high`.
  - تعيّن نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بكل نموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطّلة بدلًا من إرسال قيمة غير مدعومة.
  - يمكن لإدخالات الفهرس المخصصة المتوافقة مع OpenAI اختيار دعم `/think xhigh` عن طريق ضبط `models.providers.<provider>.models[].compat.supportedReasoningEfforts` بحيث يتضمن `"xhigh"`. يستخدم ذلك بيانات التوافق الوصفية نفسها التي تعيّن حمولات جهد استدلال OpenAI الصادرة، بحيث تتوافق القوائم، والتحقق من الجلسة، وCLI الوكيل، و`llm-task` مع سلوك النقل.
  - تتجاوز مراجع OpenRouter Hunter Alpha القديمة المهيأة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان قد يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يعيّن Google Gemini الأمر `/think adaptive` إلى التفكير الديناميكي المملوك لمزوّد Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ وما زالت المستويات الثابتة تُعيَّن إلى أقرب `thinkingLevel` أو ميزانية Gemini لعائلة النموذج تلك.
  - يستخدم MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تضبط التفكير صراحةً في معلمات النموذج أو معلمات الطلب. يمنع ذلك تسرب تغييرات `reasoning_content` من تنسيق بث MiniMax غير الأصلي المتوافق مع Anthropic.
  - يدعم Z.AI (`zai/*`) التفكير الثنائي فقط (`on`/`off`). يُعامل أي مستوى غير `off` على أنه `on` (مُعيَّن إلى `low`).
  - يعيّن Moonshot (`moonshot/*`) الأمر `/think off` إلى `thinking: { type: "disabled" }` وأي مستوى غير `off` إلى `thinking: { type: "enabled" }`. عند تمكين التفكير، لا يقبل Moonshot إلا `tool_choice` بقيمتي `auto|none`؛ يقوم OpenClaw بتطبيع القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمّن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. الرجوع الاحتياطي: الافتراضي المعلن من المزوّد عند توفره؛ وإلا تُحل نماذج الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتبقى النماذج غير القادرة على الاستدلال عند `off`.

## ضبط افتراضي جلسة

- أرسل رسالة تحتوي **فقط** على التوجيه (مع السماح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يبقى ذلك للجلسة الحالية (لكل مُرسل افتراضيًا)؛ ويُمسح بواسطة `/think:off` أو إعادة ضبط خمول الجلسة.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتُترك حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) من دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمّن**: يُمرَّر المستوى المحلول إلى وقت تشغيل وكيل Pi داخل العملية.

## الوضع السريع (/fast)

- المستويات: `on|off`.
- رسالة تحتوي على التوجيه فقط تبدّل تجاوز الوضع السريع للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) من دون وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. `/fast on|off` مضمّن/بتوجيه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعداد كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الرجوع الاحتياطي: `off`
- بالنسبة إلى `openai/*`، يُعيَّن الوضع السريع إلى معالجة الأولوية في OpenAI عن طريق إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. يحتفظ OpenClaw بزر تبديل `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك حركة المرور المصادقة عبر OAuth المرسلة إلى `api.anthropic.com`، يُعيَّن الوضع السريع إلى طبقات خدمة Anthropic: يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات نموذج Anthropic الصريحة `serviceTier` / `service_tier` افتراضي الوضع السريع عندما يُضبط كلاهما. ما زال OpenClaw يتجاوز حقن طبقة خدمة Anthropic لعناوين URL الأساسية للوكيل غير التابعة لـ Anthropic.
- يعرض `/status` القيمة `Fast` فقط عند تمكين الوضع السريع.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (الحد الأدنى) | `full` | `off` (افتراضي).
- رسالة تحتوي على التوجيه فقط تبدّل الإسهاب في الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ تعيد المستويات غير الصالحة تلميحًا من دون تغيير الحالة.
- يخزن `/verbose off` تجاوز جلسة صريحًا؛ امسحه عبر واجهة جلسات UI باختيار `inherit`.
- يؤثر التوجيه المضمّن في تلك الرسالة فقط؛ وتنطبق افتراضيات الجلسة/العامة خلاف ذلك.
- أرسل `/verbose` (أو `/verbose:`) من دون وسيطة لرؤية مستوى الإسهاب الحالي.
- عند تشغيل الإسهاب، ترسل الوكلاء التي تصدر نتائج أدوات مهيكلة (Pi، ووكلاء JSON الآخرون) كل استدعاء أداة كرسالة مستقلة للبيانات الوصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها. تُرسل ملخصات الأدوات هذه فور بدء كل أداة (فقاعات منفصلة)، وليس كتغييرات بث.
- تبقى ملخصات فشل الأدوات مرئية في الوضع العادي، لكن تُخفى لواحق تفاصيل الخطأ الخام ما لم يكن الإسهاب `on` أو `full`.
- عندما يكون الإسهاب `full`، تُمرَّر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، مقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل قيد التنفيذ، تلتزم فقاعات الأدوات اللاحقة بالإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وسطور أدوات مسودة التقدم. استخدم `"explain"` (الافتراضي) لتسميات بشرية مختصرة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضًا إلحاق الأمر/التفصيل الخام للتصحيح. يتجاوز `agents.list[].toolProgressDetail` لكل وكيل الافتراضي.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- رسالة تحتوي على التوجيه فقط تبدّل إخراج تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمّن في تلك الرسالة فقط؛ وتنطبق افتراضيات الجلسة/العامة خلاف ذلك.
- أرسل `/trace` (أو `/trace:`) من دون وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو يعرض فقط أسطر التتبع/التصحيح المملوكة لـ Plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكـرسالة تشخيص لاحقة بعد رد المساعد العادي.

## إظهار الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- رسالة تحتوي على التوجيه فقط تبدّل ما إذا كانت كتل التفكير تُعرض في الردود.
- عند التمكين، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث الاستدلال في فقاعة مسودة Telegram أثناء إنشاء الرد، ثم يرسل الإجابة النهائية من دون الاستدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) من دون وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمّن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الرجوع الاحتياطي (`off`).

تُعالَج وسوم استدلال النماذج المحلية المشوهة بتحفظ. تبقى كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى الاستدلال غير المغلق بعد نص مرئي بالفعل. إذا كان الرد ملفوفًا بالكامل بوسم فتح واحد غير مغلق وكان سيُسلَّم كنص فارغ خلاف ذلك، يزيل OpenClaw وسم الفتح المشوه ويسلّم النص المتبقي.

## ذو صلة

- توجد مستندات الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- نص فحص Heartbeat هو مطالبة Heartbeat المهيأة (افتراضيًا: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمّنة في رسالة Heartbeat كالمعتاد (لكن تجنّب تغيير افتراضيات الجلسة من Heartbeats).
- افتراضيًا، يقتصر تسليم Heartbeat على الحمولة النهائية فقط. لإرسال رسالة `Reasoning:` المنفصلة أيضًا (عند توفرها)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- اختيار مستوى آخر يكتب تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوزًا لمرة واحدة `thinkingOnce`.
- الخيار الأول دائمًا هو `Default (<resolved level>)`، حيث يأتي الافتراضي المحلول من ملف تعريف تفكير المزوّد لنموذج الجلسة النشط بالإضافة إلى منطق الرجوع نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المحدد `thinkingLevels` المعادة من صف/افتراضات جلسة Gateway، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ UI المتصفح بقائمة regex خاصة بها للمزوّدين؛ تملك Plugins مجموعات المستويات الخاصة بالنماذج.
- ما زال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، لذلك تبقى توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّدين

- يمكن لإضافات المزوّدين كشف `resolveThinkingProfile(ctx)` لتعريف المستويات التي يدعمها النموذج والقيمة الافتراضية.
- يجب على إضافات المزوّدين التي تمرّر نماذج Claude بالوكالة إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تظل كتالوجات Anthropic المباشرة والوكيلة متوافقة.
- لكل مستوى ملف تعريف `id` معياري مخزّن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون ذوو الوضع الثنائي `{ id: "low", label: "on" }`.
- يجب على إضافات الأدوات التي تحتاج إلى التحقق من تجاوز صريح للتفكير استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` مع `api.runtime.agent.normalizeThinkingLevel(...)`؛ ويجب ألا تحتفظ بقوائم مستويات المزوّد/النموذج الخاصة بها.
- يمكن لإضافات الأدوات التي لديها وصول إلى بيانات تعريف النماذج المخصصة المكوّنة تمرير `catalog` إلى `resolveThinkingPolicy` بحيث تنعكس عمليات الاشتراك في `compat.supportedReasoningEfforts` في التحقق من جانب الإضافة.
- تبقى الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصصة الجديدة `resolveThinkingProfile`.
- تعرض صفوف/قيم Gateway الافتراضية `thinkingLevels` و`thinkingOptions` و`thinkingDefault` حتى يعرض عملاء ACP/الدردشة معرّفات وتسميات ملف التعريف نفسها التي يستخدمها التحقق في وقت التشغيل.
