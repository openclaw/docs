---
read_when:
    - تعديل تحليل توجيهات التفكير أو الوضع السريع أو الإسهاب، أو إعداداتها الافتراضية
summary: صيغة التوجيهات لـ /think و /fast و /verbose و /trace، وإمكانية إظهار الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-05-06T08:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## ما يفعله

- توجيه مضمّن في أي متن وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "فكّر"
  - low → "فكّر بعمق"
  - medium → "فكّر بعمق أكبر"
  - high → "تفكير فائق" (أقصى ميزانية)
  - xhigh → "تفكير فائق+" (نماذج GPT-5.2+ وCodex، إضافةً إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → تفكير تكيفي مُدار من المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock، وAnthropic Claude Opus 4.7، والتفكير الديناميكي في Google Gemini)
  - max → أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7؛ يربط Ollama هذا بأعلى جهد `think` أصلي لديه)
  - ترتبط `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` بـ `xhigh`.
  - يرتبط `highest` بـ `high`.
- ملاحظات المزوّدين:
  - تُدار قوائم التفكير والمنتقيات بواسطة ملف تعريف المزوّد. تعلن Provider plugins مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يُعلَن عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. تُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع الخيارات الصالحة لذلك النموذج.
  - تُعاد مطابقة المستويات غير المدعومة المخزّنة حسب رتبة ملف تعريف المزوّد. يتراجع `adaptive` إلى `medium` في النماذج غير التكيفية، بينما يتراجع `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تعتمد نماذج Anthropic Claude 4.6 على `adaptive` افتراضيًا عندما لا يكون مستوى تفكير صريح مضبوطًا.
  - لا يعتمد Anthropic Claude Opus 4.7 على التفكير التكيفي افتراضيًا. يظل جهد API الافتراضي مملوكًا للمزوّد ما لم تضبط مستوى تفكير صراحةً.
  - يربط Anthropic Claude Opus 4.7 الأمر `/think xhigh` بالتفكير التكيفي إضافةً إلى `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد الجهد في Opus 4.7.
  - يعرض Anthropic Claude Opus 4.7 أيضًا `/think max`؛ ويرتبط بمسار أقصى جهد نفسه المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 المباشرة `/think xhigh|max`؛ ويرتبط كلاهما بـ DeepSeek `reasoning_effort: "max"` بينما ترتبط المستويات الأدنى غير `off` بـ `high`.
  - تعرض نماذج DeepSeek V4 الموجّهة عبر OpenRouter الأمر `/think xhigh` وترسل قيم `reasoning_effort` المدعومة من OpenRouter. تتراجع تجاوزات `max` المخزّنة إلى `xhigh`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويرتبط `max` بـ `think: "high"` الأصلي لأن API الأصلي في Ollama يقبل سلاسل الجهد `low` و`medium` و`high`.
  - تربط نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بكل نموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطّلة بدلًا من إرسال قيمة غير مدعومة.
  - يمكن لإدخالات الكتالوج المخصصة المتوافقة مع OpenAI الاشتراك في `/think xhigh` عبر ضبط `models.providers.<provider>.models[].compat.supportedReasoningEfforts` لتضمين `"xhigh"`. يستخدم هذا بيانات compat الوصفية نفسها التي تربط حمولات جهد الاستدلال الصادرة من OpenAI، لذا تتوافق القوائم، والتحقق من الجلسة، وagent CLI، و`llm-task` مع سلوك النقل.
  - تتجاوز مراجع OpenRouter Hunter Alpha القديمة المكوّنة حقن الاستدلال عبر الوكيل لأن ذلك المسار المتقاعد كان يمكن أن يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يربط Google Gemini الأمر `/think adaptive` بالتفكير الديناميكي المملوك لمزوّد Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ ولا تزال المستويات الثابتة ترتبط بأقرب `thinkingLevel` أو ميزانية في Gemini لعائلة ذلك النموذج.
  - يعتمد MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic افتراضيًا على `thinking: { type: "disabled" }` ما لم تضبط التفكير صراحةً في معاملات النموذج أو معاملات الطلب. يمنع هذا تسريب دلتا `reasoning_content` من تنسيق بث Anthropic غير الأصلي لدى MiniMax.
  - يدعم Z.AI (`zai/*`) التفكير الثنائي فقط (`on`/`off`). يُعامَل أي مستوى غير `off` على أنه `on` (ويرتبط بـ `low`).
  - يربط Moonshot (`moonshot/*`) الأمر `/think off` بـ `thinking: { type: "disabled" }` وأي مستوى غير `off` بـ `thinking: { type: "enabled" }`. عند تفعيل التفكير، لا يقبل Moonshot سوى `tool_choice` بالقيم `auto|none`؛ ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمّن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الإعداد الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الإعداد الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. الاحتياط: الإعداد الافتراضي المعلن من المزوّد عند توفره؛ وإلا تُحلّ النماذج القادرة على الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتبقى النماذج غير القادرة على الاستدلال على `off`.

## ضبط إعداد افتراضي للجلسة

- أرسل رسالة تحتوي **فقط** على التوجيه (يُسمح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يبقى ذلك للجلسة الحالية (لكل مُرسل افتراضيًا)؛ ويُمسح عبر `/think:off` أو إعادة ضبط خمول الجلسة.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتُترك حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) بلا وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمّن**: يُمرَّر المستوى المحلول إلى وقت تشغيل وكيل Pi داخل العملية.
- **واجهة Claude CLI الخلفية**: تُمرَّر المستويات غير off إلى Claude Code كـ `--effort` عند استخدام `claude-cli`؛ راجع [واجهات CLI الخلفية](/ar/gateway/cli-backends).

## الوضع السريع (/fast)

- المستويات: `on|off`.
- رسالة تحتوي على التوجيه فقط تبدّل تجاوز الوضع السريع للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) بلا وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. `/fast on|off` مضمّن/توجيه فقط
  2. تجاوز الجلسة
  3. الإعداد الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعداد كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الاحتياط: `off`
- بالنسبة إلى `openai/*`، يرتبط الوضع السريع بمعالجة OpenAI ذات الأولوية عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. يحافظ OpenClaw على مفتاح تبديل `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك المرور المصادق عبر OAuth والمُرسل إلى `api.anthropic.com`، يرتبط الوضع السريع بطبقات خدمة Anthropic: يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معاملات نموذج Anthropic الصريحة `serviceTier` / `service_tier` الإعداد الافتراضي للوضع السريع عندما يكون كلاهما مضبوطًا. لا يزال OpenClaw يتخطى حقن طبقة خدمة Anthropic لعناوين URL الأساسية للوكلاء غير Anthropic.
- يعرض `/status` كلمة `Fast` فقط عندما يكون الوضع السريع مفعّلًا.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (الحد الأدنى) | `full` | `off` (افتراضي).
- رسالة تحتوي على التوجيه فقط تبدّل الإسهاب في الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ تعيد المستويات غير الصالحة تلميحًا دون تغيير الحالة.
- يخزّن `/verbose off` تجاوز جلسة صريحًا؛ امسحه عبر واجهة جلسات المستخدم باختيار `inherit`.
- يؤثر التوجيه المضمّن في تلك الرسالة فقط؛ وتنطبق الإعدادات الافتراضية للجلسة/العالمية خلاف ذلك.
- أرسل `/verbose` (أو `/verbose:`) بلا وسيطة لرؤية مستوى الإسهاب الحالي.
- عند تفعيل الإسهاب، ترسل الوكلاء التي تصدر نتائج أدوات منظمة (Pi ووكلاء JSON آخرون) كل استدعاء أداة مرة أخرى كرسالة خاصة به تحتوي على بيانات وصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها. تُرسل ملخصات الأدوات هذه بمجرد بدء كل أداة (فقاعات منفصلة)، وليس كدلتا بث.
- تظل ملخصات فشل الأدوات مرئية في الوضع العادي، لكن تُخفى لواحق تفاصيل الخطأ الخام ما لم يكن الإسهاب `on` أو `full`.
- عندما يكون الإسهاب `full`، تُمرَّر مخرجات الأدوات أيضًا بعد الإكمال (فقاعة منفصلة، ومقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل قيد التنفيذ، فستحترم فقاعات الأدوات اللاحقة الإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وسطور أدوات مسودات التقدم. استخدم `"explain"` (افتراضي) للتسميات البشرية الموجزة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضًا إلحاق الأمر/التفصيل الخام لتصحيح الأخطاء. يتجاوز `agents.list[].toolProgressDetail` لكل وكيل الإعداد الافتراضي.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبّع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- رسالة تحتوي على التوجيه فقط تبدّل مخرجات تتبّع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمّن في تلك الرسالة فقط؛ وتنطبق الإعدادات الافتراضية للجلسة/العالمية خلاف ذلك.
- أرسل `/trace` (أو `/trace:`) بلا وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو يعرض فقط أسطر التتبع/تصحيح الأخطاء المملوكة للـ Plugin مثل ملخصات تصحيح أخطاء Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكـرسالة تشخيص متابعة بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- رسالة تحتوي على التوجيه فقط تبدّل ما إذا كانت كتل التفكير تُعرض في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث الاستدلال في فقاعة مسودة Telegram أثناء توليد الرد، ثم يرسل الإجابة النهائية دون الاستدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) بلا وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمّن، ثم تجاوز الجلسة، ثم الإعداد الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الاحتياط (`off`).

تُعالج وسوم استدلال النماذج المحلية المشوهة بتحفظ. تظل كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى أيضًا الاستدلال غير المغلق بعد نص ظاهر بالفعل. إذا كان الرد ملفوفًا بالكامل في وسم افتتاحي واحد غير مغلق وكان سيُسلَّم كنص فارغ بخلاف ذلك، يزيل OpenClaw وسم الافتتاح المشوه ويسلّم النص المتبقي.

## مرتبط

- توجد مستندات الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- متن مسبار Heartbeat هو مطالبة Heartbeat المكوّنة (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمّنة في رسالة Heartbeat كالمعتاد (لكن تجنّب تغيير الإعدادات الافتراضية للجلسة من Heartbeats).
- يعتمد تسليم Heartbeat افتراضيًا على الحمولة النهائية فقط. لإرسال رسالة `Reasoning:` المنفصلة أيضًا (عند توفرها)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة محادثة الويب

- يعكس منتقي التفكير في محادثة الويب مستوى الجلسة المخزن من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- اختيار مستوى آخر يكتب تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوز `thinkingOnce` لمرة واحدة.
- الخيار الأول دائمًا هو `Default (<resolved level>)`، حيث يأتي الإعداد الافتراضي المحلول من ملف تعريف تفكير مزوّد نموذج الجلسة النشط إضافةً إلى منطق الاحتياط نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المنتقي `thinkingLevels` المعادة من صف/إعدادات جلسة Gateway الافتراضية، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة المتصفح بقائمة regex للمزوّدين خاصة بها؛ تمتلك plugins مجموعات المستويات الخاصة بالنماذج.
- لا يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، لذا تبقى توجيهات المحادثة والمنتقي متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Provider plugins كشف `resolveThinkingProfile(ctx)` لتحديد المستويات المدعومة للنموذج والقيمة الافتراضية.
- ينبغي لـ Provider plugins التي تعمل كوسيط لنماذج Claude إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تظل كتالوجات Anthropic المباشرة والوسيطة متوافقة.
- يحتوي كل مستوى ملف تعريف على `id` قانوني مخزن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- ينبغي لـ Tool plugins التي تحتاج إلى التحقق من تجاوز تفكير صريح استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` بالإضافة إلى `api.runtime.agent.normalizeThinkingLevel(...)`؛ ولا ينبغي لها الاحتفاظ بقوائم مستويات المزوّد/النموذج الخاصة بها.
- يمكن لـ Tool plugins التي لديها وصول إلى بيانات تعريف النماذج المخصصة المكوّنة تمرير `catalog` إلى `resolveThinkingPolicy` حتى تنعكس اشتراكات `compat.supportedReasoningEfforts` في التحقق من جانب Plugin.
- تظل الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن ينبغي لمجموعات المستويات المخصصة الجديدة استخدام `resolveThinkingProfile`.
- تعرض صفوف/افتراضات Gateway `thinkingLevels` و`thinkingOptions` و`thinkingDefault` بحيث يعرض عملاء ACP/الدردشة معرّفات ملفات التعريف وتسمياتها نفسها التي يستخدمها التحقق في وقت التشغيل.
