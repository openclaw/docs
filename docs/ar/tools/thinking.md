---
read_when:
    - تعديل تحليل توجيهات التفكير أو الوضع السريع أو الإسهاب أو إعداداتها الافتراضية
summary: صياغة التوجيهات لـ /think و /fast و /verbose و /trace وإظهار الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-07-03T09:40:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## ما الذي يفعله

- توجيه مضمن في أي نص وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal ← "فكّر"
  - low ← "فكّر بعمق"
  - medium ← "فكّر بعمق أكبر"
  - high ← "ultrathink" (أقصى ميزانية)
  - xhigh ← "ultrathink+" (نماذج GPT-5.2+ وCodex، إضافة إلى جهد Anthropic Claude Opus 4.7+)
  - adaptive ← تفكير تكيّفي مُدار من المزوّد (مدعوم في Claude 4.6 على Anthropic/Bedrock وAnthropic Claude Opus 4.7+ والتفكير الديناميكي في Google Gemini)
  - max ← أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7+؛ يربطه Ollama بأعلى جهد `think` أصلي لديه)
  - يتم ربط `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` بـ `xhigh`.
  - يتم ربط `highest` بـ `high`.
- ملاحظات المزوّد:
  - قوائم التفكير وأدوات الاختيار مدفوعة بملف تعريف المزوّد. تعلن Plugins المزوّد مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يُعلَن عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. تُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع خيارات ذلك النموذج الصالحة.
  - تُعاد خريطة المستويات غير المدعومة المخزنة حسب رتبة ملف تعريف المزوّد. يتراجع `adaptive` إلى `medium` في النماذج غير التكيفية، بينما يتراجع `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` عند عدم تعيين مستوى تفكير صريح.
  - يُبقي Anthropic Claude Opus 4.8 وOpus 4.7 التفكير متوقفًا ما لم تعيّن مستوى تفكير صراحة. القيمة الافتراضية للجهد المملوك للمزوّد في Opus 4.8 هي `high` بعد تفعيل التفكير التكيّفي.
  - يربط Anthropic Claude Opus 4.7+ الأمر `/think xhigh` بالتفكير التكيّفي إضافة إلى `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد جهد Opus.
  - يوفّر Anthropic Claude Opus 4.7+ أيضًا `/think max`؛ ويرتبط بمسار أقصى جهد نفسه المملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 المباشرة `/think xhigh|max`؛ ويرتبط كلاهما بـ DeepSeek `reasoning_effort: "max"`، بينما ترتبط المستويات الأدنى غير `off` بـ `high`.
  - تعرض نماذج DeepSeek V4 الموجّهة عبر OpenRouter الأمر `/think xhigh` وترسل قيم `reasoning.effort` المدعومة من OpenRouter بدل `reasoning_effort` ذي المستوى الأعلى الأصلي في DeepSeek. ترتبط المستويات الأدنى غير `off` بـ `high`، وتتراجع تجاوزات `max` المخزنة إلى `xhigh`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويرتبط `max` بالقيمة الأصلية `think: "high"` لأن API Ollama الأصلي يقبل سلاسل الجهد `low` و`medium` و`high`.
  - تربط نماذج OpenAI GPT الأمر `/think` عبر دعم جهد Responses API الخاص بالنموذج. يرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج المستهدف؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطلة بدل إرسال قيمة غير مدعومة.
  - يمكن لإدخالات الكتالوج المخصصة المتوافقة مع OpenAI الاشتراك في `/think xhigh` عبر تعيين `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ليشمل `"xhigh"`. يستخدم هذا بيانات التوافق الوصفية نفسها التي تربط حمولات جهد استدلال OpenAI الصادرة، بحيث تتفق القوائم، والتحقق من الجلسة، وCLI الوكيل، و`llm-task` مع سلوك النقل.
  - تتخطى مراجع OpenRouter Hunter Alpha القديمة المكوّنة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان يمكن أن يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يربط Google Gemini الأمر `/think adaptive` بالتفكير الديناميكي المملوك لمزوّد Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 القيمة `thinkingBudget: -1`؛ ولا تزال المستويات الثابتة ترتبط بأقرب `thinkingLevel` أو ميزانية في Gemini لعائلة ذلك النموذج.
  - يستخدم MiniMax M2.x (`minimax/MiniMax-M2*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تعيّن التفكير صراحة في معلمات النموذج أو معلمات الطلب. يتجنب هذا تسريب دلتا `reasoning_content` من تنسيق بث M2.x غير الأصلي لـ Anthropic. يُستثنى MiniMax-M3 (وM3.x): يصدر M3 كتل تفكير Anthropic صحيحة ويعيد محتوى فارغًا عند تعطيل التفكير، لذلك يبقي OpenClaw M3 على مسار التفكير المحذوف/التكيّفي للمزوّد.
  - Z.AI (`zai/*`) ثنائي (`on`/`off`) لمعظم نماذج GLM. الاستثناء هو GLM-5.2: يعرض `/think off|low|high|max`، ويربط `low` و`high` بـ Z.AI `reasoning_effort: "high"`، ويربط `max` بـ `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) يفكر دائمًا. يعرض ملف تعريفه `on` فقط، ويحذف OpenClaw حقل `thinking` الصادر كما تتطلب Moonshot. تربط نماذج `moonshot/*` الأخرى `/think off` بـ `thinking: { type: "disabled" }` وأي مستوى غير `off` بـ `thinking: { type: "enabled" }`. عندما يكون التفكير مفعّلًا، لا تقبل Moonshot إلا `tool_choice` بالقيم `auto|none`؛ ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحسم

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُعيَّن بإرسال رسالة تحتوي على التوجيه فقط).
3. القيمة الافتراضية لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. القيمة الافتراضية العامة (`agents.defaults.thinkingDefault` في الإعدادات).
5. التراجع: القيمة الافتراضية المعلنة من المزوّد عند توفرها؛ وإلا تُحسم النماذج القادرة على الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتبقى النماذج غير القادرة على الاستدلال على `off`.

## تعيين قيمة افتراضية للجلسة

- أرسل رسالة تكون **فقط** التوجيه (يُسمح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يبقى ذلك للجلسة الحالية (لكل مرسل افتراضيًا). استخدم `/think default` لمسح تجاوز الجلسة ووراثة القيمة الافتراضية المكوّنة/الخاصة بالمزوّد؛ وتشمل الأسماء البديلة `inherit` و`clear` و`reset` و`unpin`.
- يخزن `/think off` تجاوز إيقاف صريحًا. يعطل التفكير حتى تغيّر تجاوز الجلسة أو تمسحه.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتبقى حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **OpenClaw المضمّن**: يُمرَّر المستوى المحسوم إلى وقت تشغيل وكيل OpenClaw داخل العملية.
- **خلفية Claude CLI**: تُمرَّر المستويات غير المتوقفة إلى Claude Code بوصفها `--effort` عند استخدام `claude-cli`؛ راجع [خلفيات CLI](/ar/gateway/cli-backends).

## الوضع السريع (/fast)

- المستويات: `auto|on|off|default`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز وضع الجلسة السريع وترد بـ `Fast mode set to auto.` أو `Fast mode enabled.` أو `Fast mode disabled.`. استخدم `/fast default` لمسح تجاوز الجلسة ووراثة القيمة الافتراضية المكوّنة؛ وتشمل الأسماء البديلة `inherit` و`clear` و`reset` و`unpin`.
- أرسل `/fast` (أو `/fast status`) دون وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحسم OpenClaw الوضع السريع بهذا الترتيب:
  1. تجاوز مضمن/يحتوي على التوجيه فقط `/fast auto|on|off` (`/fast default` يمسح هذه الطبقة)
  2. تجاوز الجلسة
  3. القيمة الافتراضية لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعداد كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. التراجع: `off`
- يُبقي `auto` وضع الجلسة/الإعدادات كـ auto لكنه يحسم كل استدعاء نموذج جديد بشكل مستقل. الاستدعاءات التي تبدأ قبل حد auto الزمني يكون الوضع السريع مفعّلًا فيها؛ أما استدعاءات إعادة المحاولة أو التراجع أو نتيجة الأداة أو المتابعة اللاحقة فتبدأ والوضع السريع معطل. القيمة الافتراضية للحد هي 60 ثانية؛ عيّن `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` على النموذج النشط لتغييرها.
- بالنسبة إلى `openai/*`، يرتبط الوضع السريع بمعالجة OpenAI ذات الأولوية عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى نماذج `openai/*` / `openai-codex/*` المدعومة من Codex، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. تتلقى دورات خادم تطبيق Codex الأصلي الفئة فقط عند `turn/start` أو بدء/استئناف السلسلة، لذلك لا يستطيع `auto` إعادة تعيين فئة دورة خادم تطبيق قيد التشغيل بالفعل؛ بل ينطبق على دورة النموذج التالية التي يبدأها OpenClaw.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الزيارات المصادق عليها عبر OAuth والمرسلة إلى `api.anthropic.com`، يرتبط الوضع السريع بفئات خدمة Anthropic: يعيّن `/fast on` القيمة `service_tier=auto`، ويعيّن `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات نموذج Anthropic الصريحة `serviceTier` / `service_tier` القيمة الافتراضية للوضع السريع عند تعيين كليهما. لا يزال OpenClaw يتخطى حقن فئة خدمة Anthropic لعناوين URL الأساسية للوكيل غير Anthropic.
- يعرض `/status` القيمة `Fast` عندما يكون الوضع السريع مفعّلًا و`Fast:auto` عندما يكون الوضع المكوّن auto.

## توجيهات التفصيل (/verbose أو /v)

- المستويات: `on` (أدنى حد) | `full` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط تفصيل الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ وتعيد المستويات غير الصالحة تلميحًا دون تغيير الحالة.
- يخزن `/verbose off` تجاوز جلسة صريحًا؛ امسحه عبر واجهة جلسات المستخدم باختيار `inherit`.
- يمكن لمرسلي القنوات الخارجية المصرّح لهم حفظ تجاوز تفصيل الجلسة. يحتاج عملاء Gateway/دردشة الويب الداخليون إلى `operator.admin` لحفظه.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وإلا تنطبق القيم الافتراضية للجلسة/العامة.
- أرسل `/verbose` (أو `/verbose:`) دون وسيطة لرؤية مستوى التفصيل الحالي.
- عند تشغيل التفصيل، ترسل الوكلاء التي تصدر نتائج أدوات منظّمة كل استدعاء أداة كرسالة مستقلة تحتوي على بيانات وصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها. تُرسل ملخصات الأدوات هذه بمجرد بدء كل أداة (فقاعات منفصلة)، وليس كدلتا بث.
- تبقى ملخصات فشل الأدوات مرئية في الوضع العادي، لكن لاحقات تفاصيل الخطأ الخام تكون مخفية ما لم يكن التفصيل `full`.
- عندما يكون التفصيل `full`، تُمرَّر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، مقتطعة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل مهمة، فستحترم فقاعات الأدوات اللاحقة الإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وأسطر أدوات مسودة التقدم. استخدم `"explain"` (افتراضي) لتسميات بشرية موجزة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضًا إلحاق الأمر/التفصيل الخام لأغراض التصحيح. يتجاوز `agents.list[].toolProgressDetail` لكل وكيل القيمة الافتراضية.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إخراج تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وإلا تنطبق القيم الافتراضية للجلسة/العامة.
- أرسل `/trace` (أو `/trace:`) دون وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.

## ظهور الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير ستُعرض في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Thinking`.
- `stream`: يبث الاستدلال أثناء توليد الرد عندما تدعم القناة النشطة معاينات الاستدلال، ثم يرسل الإجابة النهائية دون الاستدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) دون وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحسم: التوجيه المضمن، ثم تجاوز الجلسة، ثم القيمة الافتراضية لكل وكيل (`agents.list[].reasoningDefault`)، ثم القيمة الافتراضية العامة (`agents.defaults.reasoningDefault`)، ثم التراجع (`off`).

تُعالَج وسوم الاستدلال المشوّهة للنماذج المحلية بحذر. تبقى كتل `<think>...</think>` المغلقة مخفية في الردود العادية، كما يُخفى أيضًا الاستدلال غير المغلق بعد النص المرئي بالفعل. إذا كان الرد ملفوفًا بالكامل في وسم فتح واحد غير مغلق وكان سيُسلَّم خلاف ذلك كنص فارغ، يزيل OpenClaw وسم الفتح المشوّه ويسلّم النص المتبقي.

## ذات صلة

- توجد مستندات الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeats

- جسم مسبار Heartbeat هو مطالبة Heartbeat المضبوطة (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمّنة داخل رسالة Heartbeat كالمعتاد (لكن تجنّب تغيير إعدادات الجلسة الافتراضية من Heartbeats).
- يكون تسليم Heartbeat افتراضيًا للحمولة النهائية فقط. لإرسال رسالة `Thinking` المنفصلة أيضًا (عند توفرها)، عيّن `agents.defaults.heartbeat.includeReasoning: true` أو لكل وكيل `agents.list[].heartbeat.includeReasoning: true`.

## واجهة مستخدم دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزّن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوز `thinkingOnce` لمرة واحدة.
- يكون الخيار الأول دائمًا خيار مسح التجاوز. ويعرض `Inherited: <resolved level>`، بما في ذلك `Inherited: Off` عندما يكون التفكير الموروث معطّلًا.
- تستخدم اختيارات المحدد الصريحة تسميات مستوياتها المباشرة مع الحفاظ على تسميات المزوّدين عند وجودها (مثل `Maximum` لخيار `max` المسمّى من المزوّد).
- يستخدم المحدد `thinkingLevels` التي يُرجعها صف/افتراضيات جلسة Gateway، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة مستخدم المتصفح بقائمة regex خاصة بها للمزوّدين؛ إذ تملك Plugins مجموعات المستويات الخاصة بالنماذج.
- لا يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزّن نفسه، لذلك تبقى توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Plugins المزوّدين كشف `resolveThinkingProfile(ctx)` لتعريف مستويات النموذج المدعومة والافتراضي.
- يجب على Plugins المزوّدين التي تنوب عن نماذج Claude إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تبقى كتالوجات Anthropic المباشرة والوسيطة متوافقة.
- لكل مستوى ملف تعريف `id` أساسي مخزّن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- تتلقى خطافات ملف التعريف حقائق الكتالوج المدمجة عند توفرها، بما في ذلك `reasoning` و`compat.thinkingFormat` و`compat.supportedReasoningEfforts`. استخدم هذه الحقائق لكشف ملفات تعريف ثنائية أو مخصصة فقط عندما يدعم عقد الطلب المضبوط الحمولة المطابقة.
- يجب على Plugins الأدوات التي تحتاج إلى التحقق من تجاوز تفكير صريح استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` مع `api.runtime.agent.normalizeThinkingLevel(...)`؛ ويجب ألا تحتفظ بقوائم مستويات خاصة بها للمزوّد/النموذج.
- يمكن لـ Plugins الأدوات التي لديها وصول إلى بيانات تعريف النماذج المخصصة المضبوطة تمرير `catalog` إلى `resolveThinkingPolicy` حتى تنعكس الاشتراكات الاختيارية في `compat.supportedReasoningEfforts` في التحقق من جانب Plugin.
- تبقى الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصصة الجديدة `resolveThinkingProfile`.
- تكشف صفوف/افتراضيات Gateway عن `thinkingLevels` و`thinkingOptions` و`thinkingDefault` حتى تعرض عملاء ACP/الدردشة معرفات وتسميات ملفات التعريف نفسها التي يستخدمها التحقق في وقت التشغيل.
