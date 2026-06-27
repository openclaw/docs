---
read_when:
    - تعديل تحليل التفكير أو الوضع السريع أو توجيهات الإسهاب أو إعداداتها الافتراضية
summary: صيغة التوجيهات لـ /think و/fast و/verbose و/trace وإظهار الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-06-27T18:46:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## ما يفعله

- توجيه مضمن في أي متن وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal ← "فكّر"
  - low ← "فكّر بعمق"
  - medium ← "فكّر بعمق أكبر"
  - high ← "تفكير فائق" (الحد الأقصى للميزانية)
  - xhigh ← "تفكير فائق+" (نماذج GPT-5.2+ وCodex، إضافة إلى جهد Anthropic Claude Opus 4.7+)
  - adaptive ← تفكير تكيفي يديره المزوّد (مدعوم في Claude 4.6 على Anthropic/Bedrock، وAnthropic Claude Opus 4.7+، والتفكير الديناميكي في Google Gemini)
  - max ← أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7+؛ يربط Ollama هذا بأعلى جهد `think` أصلي لديه)
  - ترتبط `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` بـ `xhigh`.
  - ترتبط `highest` بـ `high`.
- ملاحظات المزوّد:
  - تعتمد قوائم التفكير وأدوات الاختيار على ملف المزوّد. تعلن إضافات المزوّدين مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائي.
  - لا يُعلَن عن `adaptive` و`xhigh` و`max` إلا لملفات المزوّد/النموذج التي تدعمها. تُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع الخيارات الصالحة لذلك النموذج.
  - تُعاد مطابقة المستويات غير المدعومة المخزنة حسب رتبة ملف المزوّد. يتراجع `adaptive` إلى `medium` في النماذج غير التكيفية، بينما يتراجع `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` عند عدم تعيين مستوى تفكير صريح.
  - يُبقي Anthropic Claude Opus 4.8 وOpus 4.7 التفكير متوقفًا ما لم تعيّن مستوى تفكير صراحة. قيمة جهد Opus 4.8 الافتراضية المملوكة للمزوّد هي `high` بعد تمكين التفكير التكيفي.
  - يربط Anthropic Claude Opus 4.7+ الأمر `/think xhigh` بالتفكير التكيفي مع `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد جهد Opus.
  - يوفّر Anthropic Claude Opus 4.7+ أيضًا `/think max`؛ ويرتبط بمسار الجهد الأقصى نفسه المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 المباشرة `/think xhigh|max`؛ ويرتبط كلاهما بـ DeepSeek `reasoning_effort: "max"` بينما ترتبط المستويات الأدنى غير `off` بـ `high`.
  - تعرض نماذج DeepSeek V4 الموجّهة عبر OpenRouter `/think xhigh` وترسل قيم `reasoning_effort` التي يدعمها OpenRouter. تتراجع تجاوزات `max` المخزنة إلى `xhigh`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويرتبط `max` بـ `think: "high"` الأصلي لأن واجهة Ollama الأصلية تقبل سلاسل الجهد `low` و`medium` و`high`.
  - تربط نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بكل نموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطلة بدل إرسال قيمة غير مدعومة.
  - يمكن لإدخالات كتالوج OpenAI المتوافقة المخصصة الاشتراك في `/think xhigh` عبر ضبط `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ليشمل `"xhigh"`. يستخدم هذا بيانات التوافق الوصفية نفسها التي تربط حمولات جهد استدلال OpenAI الصادرة، بحيث تتوافق القوائم والتحقق من الجلسة وCLI الوكيل و`llm-task` مع سلوك النقل.
  - تتجاوز مراجع OpenRouter Hunter Alpha القديمة المضبوطة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان يمكن أن يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يربط Google Gemini الأمر `/think adaptive` بالتفكير الديناميكي المملوك لمزوّد Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ وما زالت المستويات الثابتة ترتبط بأقرب `thinkingLevel` أو ميزانية في Gemini لعائلة النموذج تلك.
  - يستخدم MiniMax M2.x (`minimax/MiniMax-M2*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تعيّن التفكير صراحة في معلمات النموذج أو معلمات الطلب. يتجنب هذا تسرب تغيرات `reasoning_content` من تنسيق بث M2.x غير الأصلي من Anthropic. يُستثنى MiniMax-M3 (وM3.x): يصدر M3 كتل تفكير Anthropic سليمة ويعيد محتوى فارغًا عند تعطيل التفكير، لذلك يُبقي OpenClaw M3 على مسار التفكير المحذوف/التكيفي لدى المزوّد.
  - يكون Z.AI (`zai/*`) ثنائيًا (`on`/`off`) لمعظم نماذج GLM. الاستثناء هو GLM-5.2: فهو يعرض `/think off|low|high|max`، ويربط `low` و`high` بـ Z.AI `reasoning_effort: "high"`، ويربط `max` بـ `reasoning_effort: "max"`.
  - يفكر Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) دائمًا. يعرض ملفه `on` فقط، ويحذف OpenClaw حقل `thinking` الصادر كما يتطلب Moonshot. تربط نماذج `moonshot/*` الأخرى `/think off` بـ `thinking: { type: "disabled" }` وأي مستوى غير `off` بـ `thinking: { type: "enabled" }`. عند تمكين التفكير، يقبل Moonshot فقط `tool_choice` بالقيم `auto|none`؛ ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. التراجع: الافتراضي المعلن من المزوّد عند توفره؛ وإلا تُحل النماذج القادرة على الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتبقى النماذج غير القادرة على الاستدلال على `off`.

## تعيين افتراضي للجلسة

- أرسل رسالة تكون **فقط** التوجيه (مع السماح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يثبت ذلك للجلسة الحالية (لكل مرسل افتراضيًا). استخدم `/think default` لمسح تجاوز الجلسة ووراثة الافتراضي المضبوط/افتراضي المزوّد؛ وتشمل الأسماء البديلة `inherit` و`clear` و`reset` و`unpin`.
- يخزّن `/think off` تجاوز إيقاف صريحًا. يعطل التفكير حتى تغيّر تجاوز الجلسة أو تمسحه.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتُترك حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) بلا وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **OpenClaw المضمّن**: يُمرَّر المستوى المحلول إلى وقت تشغيل وكيل OpenClaw داخل العملية.
- **خلفية Claude CLI**: تُمرَّر المستويات غير المتوقفة إلى Claude Code كـ `--effort` عند استخدام `claude-cli`؛ راجع [خلفيات CLI](/ar/gateway/cli-backends).

## الوضع السريع (/fast)

- المستويات: `auto|on|off|default`.
- تبدّل رسالة تحتوي على التوجيه فقط تجاوز الوضع السريع للجلسة وترد بـ `Fast mode set to auto.` أو `Fast mode enabled.` أو `Fast mode disabled.`. استخدم `/fast default` لمسح تجاوز الجلسة ووراثة الافتراضي المضبوط؛ وتشمل الأسماء البديلة `inherit` و`clear` و`reset` و`unpin`.
- أرسل `/fast` (أو `/fast status`) بلا وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. تجاوز `/fast auto|on|off` مضمن/بتوجيه فقط (`/fast default` يمسح هذه الطبقة)
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعدادات كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. التراجع: `off`
- يُبقي `auto` وضع الجلسة/الإعدادات كـ auto لكنه يحل كل استدعاء نموذج جديد مستقلًا. تكون الاستدعاءات التي تبدأ قبل حد auto ممكّنًا فيها الوضع السريع؛ أما استدعاءات إعادة المحاولة أو التراجع أو نتيجة الأداة أو الاستكمال اللاحقة فتبدأ والوضع السريع معطّل. الحد الافتراضي هو 60 ثانية؛ اضبط `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` في النموذج النشط لتغييره.
- بالنسبة إلى `openai/*`، يرتبط الوضع السريع بمعالجة OpenAI ذات الأولوية عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى نماذج `openai/*` / `openai-codex/*` المدعومة من Codex، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. تتلقى دورات خادم تطبيق Codex الأصلية الطبقة فقط عند `turn/start` أو بدء/استئناف الخيط، لذلك لا يستطيع `auto` إعادة تصنيف دورة خادم تطبيق قيد التشغيل بالفعل؛ بل ينطبق على دورة النموذج التالية التي يبدأها OpenClaw.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، يرتبط الوضع السريع بطبقات خدمة Anthropic: يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات نموذج Anthropic الصريحة `serviceTier` / `service_tier` افتراضي الوضع السريع عند ضبطهما معًا. ما زال OpenClaw يتخطى حقن طبقة خدمة Anthropic لعناوين URL الأساسية للوكيل غير التابعة لـ Anthropic.
- يعرض `/status` القيمة `Fast` عند تمكين الوضع السريع و`Fast:auto` عندما يكون الوضع المضبوط auto.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (حد أدنى) | `full` | `off` (افتراضي).
- تبدّل رسالة تحتوي على التوجيه فقط إسهاب الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ وتعيد المستويات غير الصالحة تلميحًا دون تغيير الحالة.
- يخزّن `/verbose off` تجاوز جلسة صريحًا؛ امسحه عبر واجهة جلسات المستخدم باختيار `inherit`.
- قد يستمر مرسلو القنوات الخارجية المصرح لهم في حفظ تجاوز إسهاب الجلسة. يحتاج عملاء Gateway/webchat الداخليون إلى `operator.admin` لحفظه.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وإلا تُطبق افتراضيات الجلسة/العامة.
- أرسل `/verbose` (أو `/verbose:`) بلا وسيطة لرؤية مستوى الإسهاب الحالي.
- عند تشغيل الإسهاب، ترسل الوكلاء التي تصدر نتائج أدوات منظمة كل استدعاء أداة كرسالة خاصة به تحتوي على بيانات وصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها. تُرسل ملخصات الأدوات هذه بمجرد بدء كل أداة (فقاعات منفصلة)، وليس كتغيرات بث.
- تبقى ملخصات فشل الأدوات مرئية في الوضع العادي، لكن لواحق تفاصيل الخطأ الخام تكون مخفية ما لم يكن الإسهاب `full`.
- عندما يكون الإسهاب `full`، تُمرَّر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، مقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل قيد التنفيذ، تلتزم فقاعات الأدوات اللاحقة بالإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. استخدم `"explain"` (افتراضي) للتسميات البشرية المختصرة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضًا إلحاق الأمر/التفاصيل الخام لأغراض التصحيح. يتجاوز `agents.list[].toolProgressDetail` الخاص بكل وكيل القيمة الافتراضية.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- تبدّل رسالة تحتوي على التوجيه فقط مخرجات تتبع Plugin في الجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وإلا تُطبق افتراضيات الجلسة/العامة.
- أرسل `/trace` (أو `/trace:`) بلا وسيطة لرؤية مستوى التتبع الحالي.
- نطاق `/trace` أضيق من `/verbose`: فهو لا يكشف إلا أسطر التتبع/التصحيح المملوكة لـ Plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل رسالة تحتوي على التوجيه فقط ما إذا كانت كتل التفكير تُعرض في الردود.
- عند تمكينه، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Thinking`.
- `stream`: يبث الاستدلال أثناء توليد الرد عندما تدعم القناة النشطة معاينات الاستدلال، ثم يرسل الإجابة النهائية دون استدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) بلا وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الافتراضي العام (`agents.defaults.reasoningDefault`)، ثم التراجع (`off`).

تُعالَج وسوم الاستدلال المحلية للنموذج المشوّهة بتحفّظ. تبقى كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى أيضًا الاستدلال غير المغلق بعد نص ظاهر بالفعل. إذا كان الرد ملفوفًا بالكامل بوسم فتح واحد غير مغلق وكان سيُسلَّم بخلاف ذلك كنص فارغ، فإن OpenClaw يزيل وسم الفتح المشوّه ويسلّم النص المتبقي.

## ذو صلة

- توجد وثائق الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- نص فحص Heartbeat هو مطالبة Heartbeat المكوّنة (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمنة داخل رسالة Heartbeat كالمعتاد (لكن تجنّب تغيير افتراضيات الجلسة من Heartbeats).
- يقتصر تسليم Heartbeat افتراضيًا على الحمولة النهائية فقط. لإرسال رسالة `Thinking` المنفصلة أيضًا (عند توفرها)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو لكل وكيل `agents.list[].heartbeat.includeReasoning: true`.

## واجهة مستخدم دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزّن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- اختيار مستوى آخر يكتب تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوز `thinkingOnce` لمرة واحدة.
- الخيار الأول هو دائمًا خيار مسح التجاوز. ويعرض `Inherited: <resolved level>`، بما في ذلك `Inherited: Off` عندما يكون التفكير الموروث معطّلًا.
- تستخدم اختيارات المحدد الصريحة تسميات مستوياتها المباشرة مع الحفاظ على تسميات المزوّدين عند وجودها (مثلًا `Maximum` لخيار `max` ذي تسمية من المزوّد).
- يستخدم المحدد `thinkingLevels` التي يُرجعها صف جلسة Gateway/الافتراضيات، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة مستخدم المتصفح بقائمة regex خاصة بها للمزوّدين؛ إذ تملك Plugins مجموعات المستويات الخاصة بالنماذج.
- لا يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزّن نفسه، ولذلك تبقى توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Plugins المزوّدين كشف `resolveThinkingProfile(ctx)` لتعريف المستويات المدعومة للنموذج والافتراضي.
- يجب على Plugins المزوّدين التي تمرّر نماذج Claude أن تعيد استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تبقى كتالوجات Anthropic المباشرة والوسيطة متوافقة.
- لكل مستوى ملف تعريف `id` قانوني مخزّن (`off`، أو `minimal`، أو `low`، أو `medium`، أو `high`، أو `xhigh`، أو `adaptive`، أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- تتلقى خطافات ملفات التعريف حقائق الكتالوج المدمجة عند توفرها، بما في ذلك `reasoning` و`compat.thinkingFormat` و`compat.supportedReasoningEfforts`. استخدم هذه الحقائق لكشف ملفات تعريف ثنائية أو مخصصة فقط عندما يدعم عقد الطلب المكوّن الحمولة المطابقة.
- يجب على Tool Plugins التي تحتاج إلى التحقق من تجاوز تفكير صريح استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` بالإضافة إلى `api.runtime.agent.normalizeThinkingLevel(...)`؛ ولا ينبغي لها الاحتفاظ بقوائم مستويات خاصة بها للمزوّد/النموذج.
- يمكن لـ Tool Plugins التي تستطيع الوصول إلى بيانات تعريف النماذج المخصصة المكوّنة تمرير `catalog` إلى `resolveThinkingPolicy` حتى تنعكس اشتراكات `compat.supportedReasoningEfforts` في التحقق داخل Plugin.
- تبقى الخطافات القديمة المنشورة (`supportsXHighThinking`، و`isBinaryThinking`، و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصصة الجديدة `resolveThinkingProfile`.
- تكشف صفوف/افتراضيات Gateway عن `thinkingLevels` و`thinkingOptions` و`thinkingDefault` حتى تعرض عملاء ACP/الدردشة معرّفات ملفات التعريف والتسميات نفسها التي يستخدمها تحقق وقت التشغيل.
