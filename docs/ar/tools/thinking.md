---
read_when:
    - تعديل تحليل توجيهات التفكير أو الوضع السريع أو الإسهاب أو إعداداتها الافتراضية
summary: صيغة التوجيهات لـ /think و/fast و/verbose و/trace وإمكانية رؤية الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-05-04T18:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
    source_path: tools/thinking.md
    workflow: 16
---

## ما الذي يفعله

- توجيه مضمن في أي نص وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (أقصى ميزانية)
  - xhigh → "ultrathink+" (نماذج GPT-5.2+ وCodex، إضافة إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → تفكير تكيفي مُدار من المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock، وAnthropic Claude Opus 4.7، والتفكير الديناميكي في Google Gemini)
  - max → أقصى استدلال لدى المزوّد (Anthropic Claude Opus 4.7؛ يربط Ollama هذا بأعلى جهد `think` أصلي لديه)
  - يتم ربط `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` بـ `xhigh`.
  - يتم ربط `highest` بـ `high`.
- ملاحظات المزوّد:
  - تعتمد قوائم التفكير والمنتقيات على ملف تعريف المزوّد. تعلن Plugins المزوّد مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل الثنائي `on`.
  - لا يتم الإعلان عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. يتم رفض التوجيهات المكتوبة للمستويات غير المدعومة مع خيارات ذلك النموذج الصالحة.
  - يُعاد ربط المستويات غير المدعومة المخزّنة سابقًا حسب رتبة ملف تعريف المزوّد. يعود `adaptive` إلى `medium` على النماذج غير التكيفية، بينما يعود `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تعتمد نماذج Anthropic Claude 4.6 المستوى `adaptive` افتراضيًا عند عدم تعيين مستوى تفكير صريح.
  - لا يعتمد Anthropic Claude Opus 4.7 التفكير التكيفي افتراضيًا. يظل جهد API الافتراضي مملوكًا للمزوّد ما لم تعيّن مستوى تفكير صراحةً.
  - يربط Anthropic Claude Opus 4.7 `/think xhigh` بالتفكير التكيفي إضافة إلى `output_config.effort: "xhigh"`، لأن `/think` توجيه تفكير و`xhigh` هو إعداد جهد Opus 4.7.
  - يوفّر Anthropic Claude Opus 4.7 أيضًا `/think max`؛ ويرتبط بالمسار نفسه لأقصى جهد مملوك للمزوّد.
  - تعرض نماذج DeepSeek V4 ‏`/think xhigh|max`؛ ويرتبط كلاهما بـ DeepSeek ‏`reasoning_effort: "max"` بينما ترتبط المستويات الأدنى غير `off` بـ `high`.
  - تعرض نماذج Ollama القادرة على التفكير `/think low|medium|high|max`؛ ويرتبط `max` بـ `think: "high"` الأصلي لأن API Ollama الأصلي يقبل سلاسل الجهد `low` و`medium` و`high`.
  - تربط نماذج OpenAI GPT ‏`/think` عبر دعم جهد Responses API الخاص بالنموذج. يرسل `/think off` ‏`reasoning.effort: "none"` فقط عندما يدعم النموذج الهدف ذلك؛ وإلا يحذف OpenClaw حمولة الاستدلال المعطّلة بدل إرسال قيمة غير مدعومة.
  - يمكن لإدخالات كتالوج OpenAI-compatible المخصصة تمكين `/think xhigh` عبر ضبط `models.providers.<provider>.models[].compat.supportedReasoningEfforts` لتضمين `"xhigh"`. يستخدم هذا بيانات التوافق الوصفية نفسها التي تربط حمولات جهد استدلال OpenAI الصادرة، بحيث تتفق القوائم، والتحقق من الجلسة، وCLI الوكيل، و`llm-task` مع سلوك النقل.
  - تتخطى مراجع OpenRouter Hunter Alpha القديمة المكوّنة حقن استدلال الوكيل لأن ذلك المسار المتقاعد كان قد يعيد نص الإجابة النهائية عبر حقول الاستدلال.
  - يربط Google Gemini ‏`/think adaptive` بالتفكير الديناميكي المملوك لمزوّد Gemini. تحذف طلبات Gemini 3 قيمة `thinkingLevel` ثابتة، بينما ترسل طلبات Gemini 2.5 ‏`thinkingBudget: -1`؛ وتظل المستويات الثابتة مرتبطة بأقرب `thinkingLevel` أو ميزانية في Gemini لعائلة ذلك النموذج.
  - يضبط MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic افتراضيًا إلى `thinking: { type: "disabled" }` ما لم تعيّن التفكير صراحةً في معاملات النموذج أو معاملات الطلب. يمنع هذا تسرّب دلتا `reasoning_content` من تنسيق بث MiniMax غير الأصلي لـ Anthropic.
  - يدعم Z.AI (`zai/*`) التفكير الثنائي فقط (`on`/`off`). يُعامل أي مستوى غير `off` على أنه `on` (مرتبط بـ `low`).
  - يربط Moonshot (`moonshot/*`) ‏`/think off` بـ `thinking: { type: "disabled" }` وأي مستوى غير `off` بـ `thinking: { type: "enabled" }`. عندما يكون التفكير مفعّلًا، لا يقبل Moonshot إلا `tool_choice` ‏`auto|none`؛ ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُعيَّن بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. الاحتياطي: الافتراضي الذي يعلنه المزوّد عند توفره؛ وإلا تُحل النماذج القادرة على الاستدلال إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، وتظل النماذج غير القادرة على الاستدلال `off`.

## تعيين افتراضي للجلسة

- أرسل رسالة تحتوي **فقط** على التوجيه (مع السماح بالمسافات البيضاء)، مثل `/think:medium` أو `/t high`.
- يبقى ذلك للجلسة الحالية (لكل مُرسل افتراضيًا)؛ ويُمسح عبر `/think:off` أو إعادة ضبط خمول الجلسة.
- تُرسل رسالة تأكيد (`Thinking level set to high.` / `Thinking disabled.`). إذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتُترك حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمن**: يتم تمرير المستوى المحلول إلى وقت تشغيل وكيل Pi داخل العملية.
- **خلفية Claude CLI**: تُمرَّر المستويات غير off إلى Claude Code كـ `--effort` عند استخدام `claude-cli`؛ راجع [خلفيات CLI](/ar/gateway/cli-backends).

## الوضع السريع (/fast)

- المستويات: `on|off`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز وضع الجلسة السريع وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) دون وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. `/fast on|off` مضمن/كتوجيه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعداد كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الاحتياطي: `off`
- بالنسبة إلى `openai/*`، يرتبط الوضع السريع بمعالجة OpenAI ذات الأولوية عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع علامة `service_tier=priority` نفسها في Codex Responses. يحتفظ OpenClaw بمفتاح تبديل `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك حركة المرور المصادقة عبر OAuth المرسلة إلى `api.anthropic.com`، يرتبط الوضع السريع بطبقات خدمة Anthropic: يعيّن `/fast on` ‏`service_tier=auto`، ويعيّن `/fast off` ‏`service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معاملات نموذج Anthropic الصريحة `serviceTier` / `service_tier` افتراضي الوضع السريع عند تعيين كليهما. لا يزال OpenClaw يتخطى حقن طبقة خدمة Anthropic لعناوين URL الأساسية للوكيل غير التابعة لـ Anthropic.
- يعرض `/status` ‏`Fast` فقط عندما يكون الوضع السريع مفعّلًا.

## توجيهات الإسهاب (/verbose أو /v)

- المستويات: `on` (الحد الأدنى) | `full` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إسهاب الجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ وتعيد المستويات غير الصالحة تلميحًا دون تغيير الحالة.
- يخزّن `/verbose off` تجاوز جلسة صريحًا؛ امسحه عبر واجهة جلسات UI باختيار `inherit`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وتنطبق افتراضيات الجلسة/العامة خلاف ذلك.
- أرسل `/verbose` (أو `/verbose:`) دون وسيطة لرؤية مستوى الإسهاب الحالي.
- عند تفعيل الإسهاب، ترسل الوكلاء التي تصدر نتائج أدوات منظّمة (Pi، ووكلاء JSON الآخرون) كل استدعاء أداة كرسالة مستقلة للبيانات الوصفية فقط، مسبوقة بـ `<emoji> <tool-name>: <arg>` عند توفرها. تُرسل ملخصات الأدوات هذه فور بدء كل أداة (فقاعات منفصلة)، وليس كدلتا بث.
- تظل ملخصات فشل الأدوات مرئية في الوضع العادي، لكن تُخفى لاحقات تفاصيل الخطأ الخام ما لم يكن الإسهاب `on` أو `full`.
- عندما يكون الإسهاب `full`، تُمرَّر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، مقصوصة إلى طول آمن). إذا بدّلت `/verbose on|full|off` أثناء تشغيل جارٍ، فستحترم فقاعات الأدوات اللاحقة الإعداد الجديد.
- يتحكم `agents.defaults.toolProgressDetail` في شكل ملخصات أدوات `/verbose` وسطور أدوات مسودة التقدم. استخدم `"explain"` (افتراضي) لتسميات بشرية موجزة مثل `🛠️ Exec: checking JS syntax`؛ واستخدم `"raw"` عندما تريد أيضًا إلحاق الأمر/التفصيل الخام للتصحيح. يتجاوز `agents.list[].toolProgressDetail` لكل وكيل الافتراضي.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## توجيهات تتبع Plugin (/trace)

- المستويات: `on` | `off` (افتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط إخراج تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وتنطبق افتراضيات الجلسة/العامة خلاف ذلك.
- أرسل `/trace` (أو `/trace:`) دون وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو لا يعرض إلا سطور التتبع/التصحيح المملوكة لـ Plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر سطور التتبع في `/status` وكرسالة تشخيص متابعة بعد رد المساعد العادي.

## إظهار الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير تظهر في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث الاستدلال إلى فقاعة مسودة Telegram أثناء إنشاء الرد، ثم يرسل الإجابة النهائية دون استدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) دون وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الاحتياطي (`off`).

تُعالج وسوم استدلال النماذج المحلية المشوّهة بتحفظ. تظل كتل `<think>...</think>` المغلقة مخفية في الردود العادية، ويُخفى أيضًا الاستدلال غير المغلق بعد نص مرئي بالفعل. إذا كان الرد ملفوفًا بالكامل في وسم فتح واحد غير مغلق وكان سيُسلَّم كنص فارغ خلاف ذلك، يزيل OpenClaw وسم الفتح المشوّه ويسلّم النص المتبقي.

## ذو صلة

- توجد مستندات الوضع المرتفع في [الوضع المرتفع](/ar/tools/elevated).

## Heartbeat

- نص مسبار Heartbeat هو مطالبة Heartbeat المكوّنة (افتراضيًا: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). تنطبق التوجيهات المضمنة في رسالة Heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من Heartbeat).
- يقتصر تسليم Heartbeat افتراضيًا على الحمولة النهائية فقط. لإرسال رسالة `Reasoning:` المنفصلة أيضًا (عند توفرها)، عيّن `agents.defaults.heartbeat.includeReasoning: true` أو لكل وكيل `agents.list[].heartbeat.includeReasoning: true`.

## واجهة دردشة الويب UI

- يعكس منتقي التفكير في دردشة الويب المستوى المخزّن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوز `thinkingOnce` لمرة واحدة.
- يكون الخيار الأول دائمًا `Default (<resolved level>)`، حيث يأتي الافتراضي المحلول من ملف تعريف تفكير المزوّد لنموذج الجلسة النشط إضافة إلى منطق الاحتياطي نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المنتقي `thinkingLevels` المُعاد من صف/افتراضيات جلسة Gateway، مع إبقاء `thinkingOptions` كقائمة تسميات قديمة. لا تحتفظ واجهة المتصفح UI بقائمة regex خاصة بها للمزوّدين؛ تمتلك Plugins مجموعات المستويات الخاصة بالنماذج.
- يظل `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزّن نفسه، لذا تبقى توجيهات الدردشة والمنتقي متزامنين.

## ملفات تعريف المزوّدين

- يمكن لـ Plugins المزوّدين كشف `resolveThinkingProfile(ctx)` لتحديد المستويات المدعومة للنموذج والقيمة الافتراضية.
- يجب على Plugins المزوّدين التي تمرّر نماذج Claude عبر وكيل إعادة استخدام `resolveClaudeThinkingProfile(modelId)` من `openclaw/plugin-sdk/provider-model-shared` حتى تبقى كتالوجات Anthropic المباشرة والوكيلة متوافقة.
- لكل مستوى في الملف التعريفي `id` أساسي مخزّن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. يستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- يجب على Tool plugins التي تحتاج إلى التحقق من تجاوز صريح للتفكير استخدام `api.runtime.agent.resolveThinkingPolicy({ provider, model })` مع `api.runtime.agent.normalizeThinkingLevel(...)`؛ ويجب ألا تحتفظ بقوائم مستويات خاصة بها لكل مزوّد/نموذج.
- يمكن لـ Tool plugins التي لديها وصول إلى بيانات تعريف النماذج المخصصة المضبوطة تمرير `catalog` إلى `resolveThinkingPolicy` حتى تنعكس اشتراكات `compat.supportedReasoningEfforts` في التحقق من جهة Plugin.
- تبقى الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) كمحوّلات توافق، لكن يجب أن تستخدم مجموعات المستويات المخصصة الجديدة `resolveThinkingProfile`.
- تعرض صفوف/إعدادات Gateway الافتراضية `thinkingLevels` و`thinkingOptions` و`thinkingDefault` حتى تعرض عملاء ACP/الدردشة معرّفات وتسميات الملفات التعريفية نفسها التي يستخدمها تحقق وقت التشغيل.
