---
read_when:
    - تعديل تحليل توجيهات thinking أو fast-mode أو verbose أو إعداداتها الافتراضية
summary: صيغة التوجيهات لـ /think و/fast و/verbose و/trace، وإظهار الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-04-30T16:31:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## ما يفعله

- توجيه مضمن في أي متن وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (أقصى ميزانية)
  - xhigh → “ultrathink+” (نماذج GPT-5.2+ وCodex، إضافة إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → تفكير تكيّفي يديره المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock وAnthropic Claude Opus 4.7 وتفكير Google Gemini الديناميكي)
  - max → أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7؛ يربط Ollama هذا بأعلى جهد `think` أصلي لديه)
  - تُربط `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` بـ `xhigh`.
  - تُربط `highest` بـ `high`.
- ملاحظات المزوّدين:
  - قوائم التفكير ومحدداته مدفوعة بملف تعريف المزوّد. تعلن Plugins المزوّدين مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يُعلن عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. تُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع الخيارات الصالحة لذلك النموذج.
  - يُعاد ربط المستويات غير المدعومة المخزنة سابقًا حسب رتبة ملف تعريف المزوّد. يتراجع `adaptive` إلى `medium` على النماذج غير التكيّفية، بينما يتراجع `xhigh` و`max` إلى أكبر مستوى غير `off` مدعوم للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` عند عدم تعيين مستوى تفكير صريح.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيّفي افتراضيًا. يظل افتراض جهد واجهة API مملوكًا للمزوّد ما لم تعيّن مستوى تفكير صراحة.
  - يربط Anthropic Claude Opus 4.7 الأمر `/think xhigh` بالتفكير التكيّفي إضافة إلى `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد جهد Opus 4.7.
  - يوفّر Anthropic Claude Opus 4.7 أيضًا `/think max`؛ ويربطه بنفس مسار أقصى جهد المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 الأمر `/think xhigh|max`؛ ويرتبط كلاهما بـ `reasoning_effort: "max"` في DeepSeek، بينما تُربط المستويات الأدنى غير `off` بـ `high`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويرتبط `max` بالقيمة الأصلية `think: "high"` لأن واجهة API الأصلية في Ollama تقبل سلاسل الجهد `low` و`medium` و`high`.
  - تربط نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بالنموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطلة بدلًا من إرسال قيمة غير مدعومة.
  - يمكن لإدخالات الفهرس المخصصة المتوافقة مع OpenAI الاشتراك في `/think xhigh` عبر تعيين `models.providers.<provider>.models[].compat.supportedReasoningEfforts` لتضمين `"xhigh"`. يستخدم هذا بيانات التوافق الوصفية نفسها التي تربط حمولات جهد الاستدلال الصادرة لـ OpenAI، لذلك تتوافق القوائم والتحقق من الجلسة وCLI الوكيل و`llm-task` مع سلوك النقل.
  - تتخطى مراجع OpenRouter Hunter Alpha المهيأة والقديمة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان قد يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يربط Google Gemini الأمر `/think adaptive` بالتفكير الديناميكي المملوك لمزوّد Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ وتظل المستويات الثابتة مرتبطة بأقرب `thinkingLevel` أو ميزانية في Gemini لعائلة النموذج تلك.
  - يعتمد MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تعيّن التفكير صراحة في معلمات النموذج أو معلمات الطلب. يتجنب هذا تسريب دلتا `reasoning_content` من تنسيق بث Anthropic غير الأصلي لدى MiniMax.
  - يدعم Z.AI (`zai/*`) التفكير الثنائي فقط (`on`/`off`). يُعامل أي مستوى غير `off` على أنه `on` (مرتبط بـ `low`).
  - يربط Moonshot (`moonshot/*`) الأمر `/think off` بـ `thinking: { type: "disabled" }` وأي مستوى غير `off` بـ `thinking: { type: "enabled" }`. عندما يكون التفكير مفعّلًا، لا يقبل Moonshot إلا `tool_choice` بقيم `auto|none`؛ يطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. توجيه مضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُعيّن بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. الاحتياط: الافتراضي المعلن من المزوّد عند توفره؛ وإلا تُحل النماذج القادرة على الاستدلال إلى `medium` أو أقرب مستوى غير `off` مدعوم لذلك النموذج، وتظل النماذج غير القادرة على الاستدلال على `off`.

## تعيين افتراضي للجلسة

- أرسل رسالة تكون **فقط** التوجيه (يُسمح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يبقى ذلك للجلسة الحالية (لكل مرسل افتراضيًا)؛ ويُمسح عبر `/think:off` أو إعادة تعيين خمول الجلسة.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتُترك حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) بلا وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمن**: يُمرر المستوى المحلول إلى وقت تشغيل وكيل Pi داخل العملية.

## الوضع السريع (/fast)

- المستويات: `on|off`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز وضع السرعة للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) بلا وضع لرؤية حالة وضع السرعة الفعالة الحالية.
- يحل OpenClaw وضع السرعة بهذا الترتيب:
  1. `/fast on|off` المضمن/ذي التوجيه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعداد كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الاحتياط: `off`
- بالنسبة إلى `openai/*`، يرتبط وضع السرعة بمعالجة الأولوية في OpenAI عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل وضع السرعة علامة `service_tier=priority` نفسها في Codex Responses. يحافظ OpenClaw على مفتاح `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك حركة المرور المصادق عليها عبر OAuth والمرسلة إلى `api.anthropic.com`، يرتبط وضع السرعة بطبقات خدمة Anthropic: يعيّن `/fast on` القيمة `service_tier=auto`، ويعيّن `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات نموذج Anthropic الصريحة `serviceTier` / `service_tier` افتراضي وضع السرعة عند تعيين كليهما. يظل OpenClaw يتخطى حقن طبقة خدمة Anthropic لعناوين URL الأساسية للوكلاء غير Anthropic.
- يعرض `/status` القيمة `Fast` فقط عند تفعيل وضع السرعة.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (حد أدنى) | `full` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إسهاب الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ تُرجع المستويات غير الصالحة تلميحًا دون تغيير الحالة.
- يخزن `/verbose off` تجاوزًا صريحًا للجلسة؛ امسحه عبر واجهة الجلسات باختيار `inherit`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وتُطبق افتراضيات الجلسة/العامة فيما عدا ذلك.
- أرسل `/verbose` (أو `/verbose:`) بلا وسيطة لرؤية مستوى الإسهاب الحالي.
- عندما يكون الإسهاب مفعّلًا، ترسل الوكلاء التي تصدر نتائج أدوات منظمة (Pi، ووكلاء JSON آخرون) كل استدعاء أداة كرسالة منفصلة خاصة بالبيانات الوصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها (مسار/أمر). تُرسل ملخصات الأدوات هذه بمجرد بدء كل أداة (فقاعات منفصلة)، لا كدلتا بث.
- تظل ملخصات فشل الأدوات مرئية في الوضع العادي، لكن لاحقات تفاصيل الخطأ الخام تكون مخفية ما لم يكن الإسهاب `on` أو `full`.
- عندما يكون الإسهاب `full`، تُمرر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، مقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء وجود تشغيل قيد التنفيذ، فستحترم فقاعات الأدوات اللاحقة الإعداد الجديد.

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إخراج تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وتُطبق افتراضيات الجلسة/العامة فيما عدا ذلك.
- أرسل `/trace` (أو `/trace:`) بلا وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو لا يكشف إلا أسطر التتبع/التصحيح المملوكة لـ Plugin، مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكالرسالة التشخيصية اللاحقة بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير تُعرض في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث الاستدلال في فقاعة مسودة Telegram أثناء إنشاء الرد، ثم يرسل الإجابة النهائية دون استدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) بلا وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الاحتياط (`off`).

تُعالج وسوم استدلال النماذج المحلية المشوهة بتحفظ. تظل كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى الاستدلال غير المغلق بعد نص مرئي بالفعل. إذا كان الرد ملفوفًا بالكامل في وسم افتتاحي واحد غير مغلق وكان سيُسلّم كنص فارغ بخلاف ذلك، يزيل OpenClaw وسم الافتتاح المشوه ويسلّم النص المتبقي.

## ذو صلة

- توجد وثائق الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- متن فحص Heartbeat هو مطالبة Heartbeat المهيأة (افتراضيًا: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمنة في رسالة Heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من Heartbeats).
- يقتصر تسليم Heartbeat افتراضيًا على الحمولة النهائية فقط. لإرسال رسالة `Reasoning:` المنفصلة أيضًا (عند توفرها)، عيّن `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ فهو لا ينتظر الإرسال التالي وليس تجاوز `thinkingOnce` لمرة واحدة.
- الخيار الأول دائمًا هو `Default (<resolved level>)`، حيث يأتي الافتراضي المحلول من ملف تعريف التفكير لمزوّد نموذج الجلسة النشطة إضافة إلى منطق الاحتياط نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المحدد `thinkingLevels` التي يعيدها صف/افتراضيات جلسة Gateway، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة المتصفح بقائمة تعبيرات منتظمة للمزوّدين خاصة بها؛ تملك Plugins مجموعات المستويات الخاصة بالنماذج.
- يظل `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، لذلك تبقى توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Provider plugins عرض `resolveThinkingProfile(ctx)` لتحديد المستويات المدعومة للنموذج والقيمة الافتراضية.
- يجب على Provider plugins التي تعمل كوسيط لنماذج Claude إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تبقى كتالوجات Anthropic المباشرة والوسيطة متوافقة.
- لكل مستوى في الملف التعريفي `id` قانوني مخزّن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- يجب على Tool plugins التي تحتاج إلى التحقق من تجاوز صريح للتفكير استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` بالإضافة إلى `api.runtime.agent.normalizeThinkingLevel(...)`؛ ولا ينبغي لها الاحتفاظ بقوائم مستويات خاصة بها لكل مزوّد/نموذج.
- يمكن لـ Tool plugins التي لديها وصول إلى بيانات تعريف النماذج المخصصة المكوّنة تمرير `catalog` إلى `resolveThinkingPolicy` بحيث تنعكس اشتراكات `compat.supportedReasoningEfforts` في التحقق من جهة Plugin.
- تبقى الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصصة الجديدة `resolveThinkingProfile`.
- تعرض صفوف Gateway وقيمها الافتراضية `thinkingLevels` و`thinkingOptions` و`thinkingDefault` بحيث تعرض عملاء ACP/الدردشة معرّفات الملفات التعريفية وتسمياتها نفسها التي يستخدمها التحقق في وقت التشغيل.
