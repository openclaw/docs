---
read_when:
    - ضبط التفكير أو الوضع السريع أو تحليل توجيه الإسهاب أو الإعدادات الافتراضية
summary: بنية صياغة التوجيهات لـ /think و/fast و/verbose و/trace وإظهار الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-05-05T01:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## ما الذي يفعله

- توجيه مضمن في أي متن وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (أقصى ميزانية)
  - xhigh → “ultrathink+” (نماذج GPT-5.2+ وCodex، بالإضافة إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → التفكير التكيفي المُدار من المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock، وAnthropic Claude Opus 4.7، والتفكير الديناميكي في Google Gemini)
  - max → أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7؛ يطابقه Ollama مع أعلى جهد `think` أصلي لديه)
  - تُطابق `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` إلى `xhigh`.
  - تُطابق `highest` إلى `high`.
- ملاحظات المزوّدين:
  - قوائم ومحددات التفكير مدفوعة بملف تعريف المزوّد. تعلن Plugins الخاصة بالمزوّدين مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يُعلن عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. تُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع الخيارات الصالحة لذلك النموذج.
  - تُعاد مطابقة المستويات غير المدعومة المخزنة مسبقًا حسب رتبة ملف تعريف المزوّد. يعود `adaptive` إلى `medium` في النماذج غير التكيفية، بينما يعود `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` عند عدم تعيين مستوى تفكير صريح.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيفي افتراضيًا. يبقى افتراض جهد API مملوكًا للمزوّد ما لم تضبط مستوى تفكير صراحةً.
  - يطابق Anthropic Claude Opus 4.7 الأمر `/think xhigh` إلى التفكير التكيفي بالإضافة إلى `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد جهد Opus 4.7.
  - يتيح Anthropic Claude Opus 4.7 أيضًا `/think max`؛ ويطابقه إلى مسار أقصى جهد نفسه المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 المباشرة `/think xhigh|max`؛ كلاهما يطابق إلى DeepSeek `reasoning_effort: "max"` بينما تطابق المستويات الأدنى غير `off` إلى `high`.
  - تعرض نماذج DeepSeek V4 الممررة عبر OpenRouter الأمر `/think xhigh` وترسل قيم `reasoning_effort` المدعومة من OpenRouter. تعود تجاوزات `max` المخزنة إلى `xhigh`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ يطابق `max` إلى `think: "high"` الأصلي لأن API الأصلي في Ollama يقبل سلاسل الجهد `low` و`medium` و`high`.
  - تطابق نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بكل نموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطلة بدلًا من إرسال قيمة غير مدعومة.
  - يمكن لإدخالات الفهرس المخصصة المتوافقة مع OpenAI الاشتراك في `/think xhigh` من خلال ضبط `models.providers.<provider>.models[].compat.supportedReasoningEfforts` لتضمين `"xhigh"`. يستخدم هذا بيانات التعريف compat نفسها التي تطابق حمولات جهد الاستدلال الصادرة من OpenAI، بحيث تتفق القوائم، والتحقق من الجلسات، وCLI الوكيل، و`llm-task` مع سلوك النقل.
  - تتجاوز مراجع OpenRouter Hunter Alpha القديمة المهيأة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان قد يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يطابق Google Gemini الأمر `/think adaptive` إلى التفكير الديناميكي المملوك للمزوّد في Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ وما زالت المستويات الثابتة تطابق إلى أقرب `thinkingLevel` أو ميزانية في Gemini لعائلة ذلك النموذج.
  - يستخدم MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تضبط التفكير صراحةً في معلمات النموذج أو معلمات الطلب. يمنع هذا تسرب دلتا `reasoning_content` من تنسيق بث Anthropic غير الأصلي في MiniMax.
  - يدعم Z.AI (`zai/*`) التفكير الثنائي فقط (`on`/`off`). يُعامل أي مستوى غير `off` على أنه `on` (ويُطابق إلى `low`).
  - يطابق Moonshot (`moonshot/*`) الأمر `/think off` إلى `thinking: { type: "disabled" }` وأي مستوى غير `off` إلى `thinking: { type: "enabled" }`. عند تمكين التفكير، لا يقبل Moonshot إلا `tool_choice` بقيم `auto|none`؛ ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. الاحتياطي: الافتراضي المعلن من المزوّد عند توفره؛ وإلا تُحل النماذج القادرة على الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتبقى النماذج غير القادرة على الاستدلال عند `off`.

## تعيين افتراضي للجلسة

- أرسل رسالة تكون **فقط** التوجيه (مع السماح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يثبت ذلك للجلسة الحالية (لكل مرسل افتراضيًا)؛ ويُمسح بواسطة `/think:off` أو إعادة ضبط خمول الجلسة.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتبقى حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمن**: يُمرر المستوى المحلول إلى وقت تشغيل وكيل Pi داخل العملية.
- **واجهة Claude CLI الخلفية**: تُمرر المستويات غير `off` إلى Claude Code كـ `--effort` عند استخدام `claude-cli`؛ راجع [واجهات CLI الخلفية](/ar/gateway/cli-backends).

## الوضع السريع (/fast)

- المستويات: `on|off`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز وضع الجلسة السريع وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) دون وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. `/fast on|off` مضمن/موجّه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعدادات كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الاحتياطي: `off`
- بالنسبة إلى `openai/*`، يطابق الوضع السريع إلى معالجة الأولوية في OpenAI عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. يحتفظ OpenClaw بمفتاح تبديل `/fast` واحد مشترك عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة المصادق عليها عبر OAuth المرسلة إلى `api.anthropic.com`، يطابق الوضع السريع إلى طبقات خدمة Anthropic: يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات نموذج Anthropic الصريحة `serviceTier` / `service_tier` افتراضي الوضع السريع عند ضبط كليهما. يظل OpenClaw يتجاوز حقن طبقة خدمة Anthropic لعناوين URL الأساسية للوكلاء غير Anthropic.
- يعرض `/status` القيمة `Fast` فقط عند تمكين الوضع السريع.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (حد أدنى) | `full` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط الإسهاب في الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ تُعيد المستويات غير الصالحة تلميحًا دون تغيير الحالة.
- يخزن `/verbose off` تجاوز جلسة صريحًا؛ امسحه عبر واجهة الجلسات باختيار `inherit`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وتُطبق افتراضات الجلسة/العامة بخلاف ذلك.
- أرسل `/verbose` (أو `/verbose:`) دون وسيطة لرؤية مستوى الإسهاب الحالي.
- عند تشغيل الإسهاب، ترسل الوكلاء التي تصدر نتائج أدوات منظمة (Pi، ووكلاء JSON آخرون) كل استدعاء أداة كرسالة مستقلة للبيانات الوصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفره. تُرسل ملخصات الأدوات هذه فور بدء كل أداة (فقاعات منفصلة)، وليس كدلتا بث.
- تبقى ملخصات فشل الأدوات مرئية في الوضع العادي، لكن تُخفى لاحقات تفاصيل الخطأ الخام ما لم يكن الإسهاب `on` أو `full`.
- عندما يكون الإسهاب `full`، تُمرر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، ومقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل عملية، فستحترم فقاعات الأدوات اللاحقة الإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. استخدم `"explain"` (افتراضي) لتسميات بشرية مضغوطة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضًا إلحاق الأمر/التفصيل الخام لأغراض التصحيح. يتجاوز `agents.list[].toolProgressDetail` لكل وكيل القيمة الافتراضية.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إخراج تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وتُطبق افتراضات الجلسة/العامة بخلاف ذلك.
- أرسل `/trace` (أو `/trace:`) دون وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو لا يكشف إلا أسطر التتبع/التصحيح المملوكة لـ Plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكرسالة تشخيص لاحقة بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير تظهر في الردود.
- عند التمكين، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث الاستدلال إلى فقاعة مسودة Telegram أثناء إنشاء الرد، ثم يرسل الإجابة النهائية دون الاستدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) دون وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الاحتياطي (`off`).

تُعالج وسوم استدلال النماذج المحلية المشوهة بتحفظ. تبقى كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى الاستدلال غير المغلق بعد نص مرئي بالفعل. إذا كان الرد ملفوفًا بالكامل في وسم افتتاحي واحد غير مغلق وكان سيُسلّم كنص فارغ بخلاف ذلك، يزيل OpenClaw الوسم الافتتاحي المشوه ويسلّم النص المتبقي.

## ذات صلة

- توجد مستندات الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- متن مجس Heartbeat هو موجه Heartbeat المهيأ (افتراضيًا: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمنة في رسالة Heartbeat كالمعتاد (لكن تجنب تغيير افتراضات الجلسة من Heartbeats).
- يقتصر تسليم Heartbeat افتراضيًا على الحمولة النهائية فقط. لإرسال رسالة `Reasoning:` المنفصلة أيضًا (عند توفرها)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوز `thinkingOnce` لمرة واحدة.
- يكون الخيار الأول دائمًا `Default (<resolved level>)`، حيث يأتي الافتراضي المحلول من ملف تعريف تفكير المزوّد لنموذج الجلسة النشط بالإضافة إلى منطق الاحتياط نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المحدد `thinkingLevels` التي يعيدها صف جلسة Gateway/الافتراضات، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة المتصفح بقائمة regex خاصة بها للمزوّدين؛ تمتلك Plugins مجموعات المستويات الخاصة بكل نموذج.
- يظل `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، لذلك تبقى توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Plugins المزوّد أن تعرض `resolveThinkingProfile(ctx)` لتحديد المستويات المدعومة للنموذج والقيمة الافتراضية.
- يجب على Plugins المزوّد التي تمرّر نماذج Claude عبر وسيط إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تبقى كتالوجات Anthropic المباشرة والوسيطة متوائمة.
- لكل مستوى في الملف التعريفي `id` معياري مخزّن (`off`، `minimal`، `low`، `medium`، `high`، `xhigh`، `adaptive`، أو `max`) وقد يتضمن `label` للعرض. تستخدم المزوّدات الثنائية `{ id: "low", label: "on" }`.
- يجب على Tool plugins التي تحتاج إلى التحقق من تجاوز تفكير صريح استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` مع `api.runtime.agent.normalizeThinkingLevel(...)`؛ ولا ينبغي لها الاحتفاظ بقوائم مستويات خاصة بها للمزوّد/النموذج.
- يمكن لـ Tool plugins التي لديها وصول إلى بيانات تعريف النماذج المخصصة المضبوطة تمرير `catalog` إلى `resolveThinkingPolicy` حتى تنعكس عمليات الاشتراك `compat.supportedReasoningEfforts` في التحقق من جهة Plugin.
- تظل الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصصة الجديدة `resolveThinkingProfile`.
- تعرض صفوف Gateway والقيم الافتراضية `thinkingLevels` و`thinkingOptions` و`thinkingDefault` حتى تعرض عملاء ACP/الدردشة معرّفات الملفات التعريفية والتسميات نفسها التي يستخدمها تحقق وقت التشغيل.
