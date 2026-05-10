---
read_when:
    - تعديل تحليل توجيهات التفكير أو الوضع السريع أو الإسهاب أو إعداداتها الافتراضية
summary: صياغة التوجيهات لـ /think و /fast و /verbose و /trace وإمكانية رؤية الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-05-10T20:06:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## ما الذي يفعله

- توجيه مضمن في أي نص وارد: `/t <level>`، أو `/think:<level>`، أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (أقصى ميزانية)
  - xhigh → "ultrathink+" (نماذج GPT-5.2+ وCodex، بالإضافة إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → تفكير تكيّفي يديره المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock، وAnthropic Claude Opus 4.7، والتفكير الديناميكي في Google Gemini)
  - max → أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7؛ يعيّن Ollama هذا إلى أعلى جهد `think` أصلي لديه)
  - تُعيَّن `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` إلى `xhigh`.
  - تُعيَّن `highest` إلى `high`.
- ملاحظات المزوّد:
  - قوائم التفكير والمنتقيات مدفوعة بملف تعريف المزوّد. تصرّح Plugins المزوّدين بمجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يُعلَن عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. تُرفَض التوجيهات المكتوبة للمستويات غير المدعومة مع الخيارات الصالحة لذلك النموذج.
  - تُعاد مطابقة المستويات غير المدعومة المخزنة بحسب رتبة ملف تعريف المزوّد. يتراجع `adaptive` إلى `medium` على النماذج غير التكيّفية، بينما يتراجع `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` عندما لا يُحدَّد مستوى تفكير صريح.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيّفي افتراضياً. تبقى قيمة جهد API الافتراضية مملوكة للمزوّد ما لم تضبط مستوى تفكير صراحةً.
  - يعيّن Anthropic Claude Opus 4.7 الأمر `/think xhigh` إلى التفكير التكيّفي مع `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد الجهد في Opus 4.7.
  - يوفّر Anthropic Claude Opus 4.7 أيضاً `/think max`؛ ويُعيَّن إلى مسار أقصى جهد نفسه المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 المباشرة `/think xhigh|max`؛ كلاهما يُعيَّن إلى `reasoning_effort: "max"` في DeepSeek بينما تُعيَّن المستويات الأدنى غير `off` إلى `high`.
  - تعرض نماذج DeepSeek V4 الموجّهة عبر OpenRouter الأمر `/think xhigh` وترسل قيم `reasoning_effort` المدعومة من OpenRouter. تتراجع تجاوزات `max` المخزنة إلى `xhigh`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويُعيَّن `max` إلى `think: "high"` الأصلي لأن API Ollama الأصلي يقبل سلاسل الجهد `low` و`medium` و`high`.
  - تعيّن نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بكل نموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطّلة بدلاً من إرسال قيمة غير مدعومة.
  - يمكن لإدخالات كتالوج OpenAI المتوافقة والمخصصة تفعيل `/think xhigh` بضبط `models.providers.<provider>.models[].compat.supportedReasoningEfforts` لتضمين `"xhigh"`. يستخدم هذا بيانات التوافق الوصفية نفسها التي تعيّن حمولات جهد استدلال OpenAI الصادرة، بحيث تتفق القوائم، والتحقق من الجلسة، وCLI الوكيل، و`llm-task` مع سلوك النقل.
  - تتخطى مراجع OpenRouter Hunter Alpha القديمة المكوَّنة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان قد يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يعيّن Google Gemini الأمر `/think adaptive` إلى التفكير الديناميكي المملوك للمزوّد في Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ ولا تزال المستويات الثابتة تُعيَّن إلى أقرب `thinkingLevel` أو ميزانية في Gemini لعائلة النموذج تلك.
  - يستخدم MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تضبط التفكير صراحةً في معاملات النموذج أو معاملات الطلب. يتجنب هذا تسريب دلتا `reasoning_content` من تنسيق بث Anthropic غير الأصلي لدى MiniMax.
  - يدعم Z.AI (`zai/*`) التفكير الثنائي فقط (`on`/`off`). يُعامَل أي مستوى غير `off` على أنه `on` (ويُعيَّن إلى `low`).
  - يعيّن Moonshot (`moonshot/*`) الأمر `/think off` إلى `thinking: { type: "disabled" }` وأي مستوى غير `off` إلى `thinking: { type: "enabled" }`. عند تفعيل التفكير، لا يقبل Moonshot سوى `tool_choice` بقيمتي `auto|none`؛ ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الإعداد الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في التكوين).
4. الإعداد الافتراضي العام (`agents.defaults.thinkingDefault` في التكوين).
5. الاحتياطي: الإعداد الافتراضي المصرَّح به من المزوّد عند توفره؛ وإلا تُحلّ نماذج الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتبقى النماذج غير القادرة على الاستدلال على `off`.

## ضبط افتراضي للجلسة

- أرسل رسالة تحتوي على التوجيه **فقط** (يُسمح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يبقى ذلك للجلسة الحالية (لكل مرسِل افتراضياً). استخدم `/think default` لمسح تجاوز الجلسة ووراثة الإعداد الافتراضي المكوَّن/المزوّد؛ تشمل الأسماء البديلة `inherit` و`clear` و`reset` و`unpin`.
- يخزن `/think off` تجاوز إيقاف صريحاً. يعطّل التفكير حتى تغيّر تجاوز الجلسة أو تمسحه.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتُترك حالة الجلسة بلا تغيير.
- أرسل `/think` (أو `/think:`) بلا وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمّن**: يُمرَّر المستوى المحلول إلى وقت تشغيل وكيل Pi داخل العملية.
- **واجهة Claude CLI الخلفية**: تُمرَّر المستويات غير `off` إلى Claude Code كـ `--effort` عند استخدام `claude-cli`؛ راجع [واجهات CLI الخلفية](/ar/gateway/cli-backends).

## الوضع السريع (/fast)

- المستويات: `on|off|default`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز الوضع السريع للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`. استخدم `/fast default` لمسح تجاوز الجلسة ووراثة الإعداد الافتراضي المكوَّن؛ تشمل الأسماء البديلة `inherit` و`clear` و`reset` و`unpin`.
- أرسل `/fast` (أو `/fast status`) بلا وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. تجاوز `/fast on|off` المضمن/الخاص برسالة التوجيه فقط (`/fast default` يمسح هذه الطبقة)
  2. تجاوز الجلسة
  3. الإعداد الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. تكوين لكل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الاحتياطي: `off`
- بالنسبة إلى `openai/*`، يُعيَّن الوضع السريع إلى معالجة OpenAI ذات الأولوية بإرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. يحتفظ OpenClaw بمفتاح تبديل `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة المرسلة إلى `api.anthropic.com` والمصادق عليها عبر OAuth، يُعيَّن الوضع السريع إلى طبقات خدمة Anthropic: يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معاملات نموذج Anthropic الصريحة `serviceTier` / `service_tier` الإعداد الافتراضي للوضع السريع عندما يكون كلاهما مضبوطاً. لا يزال OpenClaw يتخطى حقن طبقة خدمة Anthropic لعناوين URL الأساسية الخاصة بالوكلاء غير Anthropic.
- يعرض `/status` القيمة `Fast` فقط عندما يكون الوضع السريع مفعلاً.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (أدنى حد) | `full` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إسهاب الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ تعيد المستويات غير الصالحة تلميحاً دون تغيير الحالة.
- يخزن `/verbose off` تجاوز جلسة صريحاً؛ امسحه عبر واجهة الجلسات باختيار `inherit`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وتنطبق افتراضيات الجلسة/العامة بخلاف ذلك.
- أرسل `/verbose` (أو `/verbose:`) بلا وسيطة لرؤية مستوى الإسهاب الحالي.
- عند تفعيل الإسهاب، ترسل الوكلاء التي تصدر نتائج أدوات مهيكلة (Pi ووكلاء JSON الآخرون) كل استدعاء أداة كرسالة مستقلة خاصة بالبيانات الوصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها. تُرسل ملخصات الأدوات هذه بمجرد بدء كل أداة (فقاعات منفصلة)، وليس كدلتا بث.
- تبقى ملخصات فشل الأدوات مرئية في الوضع العادي، لكن تُخفى لواحق تفاصيل الخطأ الخام ما لم يكن الإسهاب `on` أو `full`.
- عندما يكون الإسهاب `full`، تُمرَّر مخرجات الأدوات أيضاً بعد الاكتمال (فقاعة منفصلة، مقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل قيد التنفيذ، تلتزم فقاعات الأدوات اللاحقة بالإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. استخدم `"explain"` (افتراضي) لتسميات بشرية موجزة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضاً إلحاق الأمر/التفاصيل الخام للتصحيح. يتجاوز `agents.list[].toolProgressDetail` لكل وكيل الإعداد الافتراضي.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إخراج تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وتنطبق افتراضيات الجلسة/العامة بخلاف ذلك.
- أرسل `/trace` (أو `/trace:`) بلا وسيطة لرؤية مستوى التتبع الحالي.
- يُعد `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير تُعرض في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث الاستدلال في فقاعة مسودة Telegram أثناء توليد الرد، ثم يرسل الإجابة النهائية دون الاستدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) بلا وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الإعداد الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الإعداد الافتراضي العام (`agents.defaults.reasoningDefault`)، ثم الاحتياطي (`off`).

تُعالَج وسوم استدلال النماذج المحلية المشوّهة بتحفّظ. تبقى كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى الاستدلال غير المغلق بعد نص مرئي بالفعل. إذا كان الرد ملفوفاً بالكامل في وسم فتح واحد غير مغلق وكان سيُسلَّم كنص فارغ بخلاف ذلك، يزيل OpenClaw وسم الفتح المشوّه ويسلّم النص المتبقي.

## ذات صلة

- توجد وثائق الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- نص فحص Heartbeat هو مطالبة Heartbeat المكوَّنة (افتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمنة في رسالة Heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من Heartbeats).
- يقتصر تسليم Heartbeat افتراضياً على الحمولة النهائية فقط. لإرسال رسالة `Reasoning:` المنفصلة أيضاً (عند توفرها)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة دردشة الويب

- يعكس محدّد التفكير في دردشة الويب المستوى المخزّن للجلسة من مخزن/تكوين الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ فهو لا ينتظر الإرسال التالي وليس تجاوزًا لمرة واحدة عبر `thinkingOnce`.
- يكون الخيار الأول دائمًا خيار مسح التجاوز. يعرض `Inherited: <resolved level>` عندما ترث الجلسة افتراضيًا فعّالًا غير متوقف، أو `Off` عندما يكون التفكير الموروث معطّلًا.
- تُوسم اختيارات المحدّد الصريحة كتجاوزات، مع الحفاظ على تسميات المزوّد عند وجودها (على سبيل المثال `Override: maximum` لخيار `max` ذي تسمية من المزوّد).
- يستخدم المحدّد `thinkingLevels` التي يرجعها صف/افتراضيات جلسة Gateway، مع الإبقاء على `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة مستخدم المتصفح بقائمة regex خاصة بها للمزوّدين؛ إذ تملك Plugins مجموعات المستويات الخاصة بالنماذج.
- لا يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزّن نفسه، وبذلك تبقى توجيهات الدردشة والمحدّد متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Plugins المزوّدين كشف `resolveThinkingProfile(ctx)` لتعريف المستويات المدعومة للنموذج والافتراضي.
- يجب على Plugins المزوّدين التي تعمل كوسيط لنماذج Claude إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تبقى كتالوجات Anthropic المباشرة والوسيطة متطابقة.
- لكل مستوى في ملف التعريف `id` معياري مخزّن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- يجب على Plugins الأدوات التي تحتاج إلى التحقق من تجاوز تفكير صريح استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` مع `api.runtime.agent.normalizeThinkingLevel(...)`؛ ويجب ألا تحتفظ بقوائم مستويات المزوّد/النموذج الخاصة بها.
- يمكن لـ Plugins الأدوات التي لديها وصول إلى بيانات تعريف النماذج المخصّصة المكوّنة تمرير `catalog` إلى `resolveThinkingPolicy` حتى تنعكس اشتراكات `compat.supportedReasoningEfforts` في التحقق على جانب Plugin.
- تبقى الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصّصة الجديدة `resolveThinkingProfile`.
- تكشف صفوف/افتراضيات Gateway عن `thinkingLevels` و`thinkingOptions` و`thinkingDefault` حتى تعرض عملاء ACP/الدردشة معرّفات وتسميات ملفات التعريف نفسها التي يستخدمها تحقق وقت التشغيل.
