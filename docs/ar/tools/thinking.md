---
read_when:
    - ضبط تحليل أو الإعدادات الافتراضية لتوجيهات التفكير أو الوضع السريع أو الوضع المفصل
summary: بنية التوجيهات لـ `/think` و`/fast` و`/verbose` و`/trace` ورؤية الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-04-24T08:11:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## ما الذي يفعله

- توجيه مضمن في أي نص وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (والأسماء البديلة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” ‏(أقصى ميزانية)
  - xhigh → “ultrathink+” ‏(نماذج GPT-5.2+ وCodex، بالإضافة إلى جهد Anthropic Claude Opus 4.7)
  - adaptive → تفكير تكيفي يديره المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock وAnthropic Claude Opus 4.7)
  - max → أقصى استدلال من المزوّد (حاليًا Anthropic Claude Opus 4.7)
  - تُربط `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` إلى `xhigh`.
  - تُربط `highest` إلى `high`.
- ملاحظات المزوّد:
  - قوائم ومحددات التفكير تعتمد على ملف تعريف المزوّد. تعلن Plugins المزوّد المجموعة الدقيقة من المستويات للنموذج المحدد، بما في ذلك التسميات مثل `on` الثنائية.
  - لا يُعلن عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. وتُرفض التوجيهات المكتوبة لمستويات غير مدعومة مع الخيارات الصالحة لذلك النموذج.
  - تُعاد مطابقة المستويات المخزنة غير المدعومة الموجودة بحسب ترتيب ملف تعريف المزوّد. ويرجع `adaptive` إلى `medium` في النماذج غير التكيفية، بينما يرجع `xhigh` و`max` إلى أكبر مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 افتراضيًا `adaptive` عندما لا يكون هناك مستوى تفكير صريح مضبوط.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيفي افتراضيًا. ويظل جهد API الافتراضي مملوكًا للمزوّد ما لم تضبط مستوى تفكير صراحةً.
  - يربط Anthropic Claude Opus 4.7 الأمر `/think xhigh` بالتفكير التكيفي بالإضافة إلى `output_config.effort: "xhigh"`، لأن `/think` هو توجيه تفكير و`xhigh` هو إعداد الجهد في Opus 4.7.
  - يكشف Anthropic Claude Opus 4.7 أيضًا عن `/think max`; ويرتبط بالمسار نفسه لأقصى جهد يملكه المزوّد.
  - تربط نماذج OpenAI GPT الأمر `/think` عبر دعم الجهد الخاص بـ Responses API لكل نموذج. ويرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا فإن OpenClaw يحذف حمولة تعطيل الاستدلال بدلًا من إرسال قيمة غير مدعومة.
  - يستخدم MiniMax ‏(`minimax/*`) على مسار البث المتوافق مع Anthropic افتراضيًا `thinking: { type: "disabled" }` ما لم تضبط التفكير صراحةً في معلمات النموذج أو الطلب. وهذا يتجنب تسرب فروق `reasoning_content` من تنسيق تدفق Anthropic غير الأصلي في MiniMax.
  - يدعم Z.AI ‏(`zai/*`) التفكير الثنائي فقط (`on`/`off`). ويُعامل أي مستوى غير `off` على أنه `on` ‏(مربوط إلى `low`).
  - يربط Moonshot ‏(`moonshot/*`) الأمر `/think off` إلى `thinking: { type: "disabled" }` وأي مستوى غير `off` إلى `thinking: { type: "enabled" }`. وعندما يكون التفكير مفعّلًا، لا يقبل Moonshot في `tool_choice` إلا `auto|none`; ويطبّع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب التحليل

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في التهيئة).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في التهيئة).
5. fallback: الافتراضي الذي يعلنه المزوّد عندما يكون متاحًا؛ وإلا فإن النماذج القادرة على الاستدلال تُحل إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، بينما تظل النماذج غير الاستدلالية على `off`.

## ضبط افتراضي للجلسة

- أرسل رسالة تحتوي **فقط** على التوجيه (يسمح بالمسافات)، مثل `/think:medium` أو `/t high`.
- يظل ذلك ثابتًا للجلسة الحالية (لكل مرسل افتراضيًا)؛ ويُزال بواسطة `/think:off` أو إعادة ضبط خمول الجلسة.
- يُرسل رد تأكيد (`Thinking level set to high.` / `Thinking disabled.`). وإذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتبقى حالة الجلسة دون تغيير.
- أرسل `/think` ‏(أو `/think:`) من دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمّن**: يُمرَّر المستوى المحلول إلى runtime الخاص بوكيل Pi داخل العملية.

## الوضع السريع (/fast)

- المستويات: `on|off`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز الوضع السريع للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` ‏(أو `/fast status`) من دون وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. `/fast on|off` مضمن/بتوجيه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. تهيئة لكل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. fallback: ‏`off`
- بالنسبة إلى `openai/*`، يُربط الوضع السريع بمعالجة OpenAI ذات الأولوية عبر إرسال `service_tier=priority` على طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع العلامة نفسها `service_tier=priority` على Codex Responses. ويحافظ OpenClaw على مفتاح تبديل `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة المصادق عليها عبر OAuth المرسلة إلى `api.anthropic.com`، يرتبط الوضع السريع بطبقات خدمة Anthropic: يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` ‏(أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات النموذج الصريحة `serviceTier` / `service_tier` الخاصة بـ Anthropic افتراضي الوضع السريع عندما يكون كلاهما مضبوطًا. ولا يزال OpenClaw يتخطى حقن طبقة خدمة Anthropic لعناوين proxy base URL غير التابعة لـ Anthropic.
- يُظهر `/status` القيمة `Fast` فقط عندما يكون الوضع السريع مفعّلًا.

## توجيهات verbose ‏(`/verbose` أو `/v`)

- المستويات: `on` ‏(حد أدنى) | `full` | `off` ‏(الافتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط وضع verbose للجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`; وتعيد المستويات غير الصالحة تلميحًا من دون تغيير الحالة.
- يخزن `/verbose off` تجاوز جلسة صريحًا؛ ويمكنك مسحه عبر واجهة الجلسات Sessions UI باختيار `inherit`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وتُطبق افتراضيات الجلسة/العالمية بخلاف ذلك.
- أرسل `/verbose` ‏(أو `/verbose:`) من دون وسيطة لرؤية مستوى verbose الحالي.
- عندما يكون verbose مفعّلًا، ترسل الوكلاء التي تنتج نتائج أدوات منظّمة (Pi، ووكلاء JSON الآخرون) كل استدعاء أداة كرسالة خاصة به تحتوي على metadata فقط، ومسبوقة بـ `<emoji> <tool-name>: <arg>` عندما يكون متاحًا (المسار/الأمر). وتُرسل ملخصات الأدوات هذه بمجرد بدء كل أداة (فقاعات منفصلة)، وليس كتدفقات streaming deltas.
- تظل ملخصات فشل الأداة مرئية في الوضع العادي، لكن لواحق تفاصيل الخطأ الخام تكون مخفية ما لم يكن verbose هو `on` أو `full`.
- عندما يكون verbose هو `full`، تُمرَّر مخرجات الأدوات أيضًا بعد الاكتمال (فقاعة منفصلة، ومقتطعة إلى طول آمن). وإذا بدّلت `/verbose on|full|off` أثناء وجود تشغيل قيد التنفيذ، فإن فقاعات الأدوات اللاحقة تحترم الإعداد الجديد.

## توجيهات تتبع Plugin ‏(`/trace`)

- المستويات: `on` | `off` ‏(الافتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط مخرجات تتبع Plugin للجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن على تلك الرسالة فقط؛ وتُطبق افتراضيات الجلسة/العالمية بخلاف ذلك.
- أرسل `/trace` ‏(أو `/trace:`) من دون وسيطة لرؤية مستوى التتبع الحالي.
- يعد `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة للـ Plugin مثل ملخصات تصحيح Active Memory.
- قد تظهر أسطر التتبع في `/status` وكMessage تشخيصية لاحقة بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير تُعرض في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` ‏(Telegram فقط): يدفّق الاستدلال إلى فقاعة المسودة في Telegram أثناء توليد الرد، ثم يرسل الجواب النهائي من دون الاستدلال.
- الاسم البديل: `/reason`.
- أرسل `/reasoning` ‏(أو `/reasoning:`) من دون وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب التحليل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم fallback ‏(`off`).

## ذو صلة

- توجد وثائق Elevated mode في [Elevated mode](/ar/tools/elevated).

## Heartbeats

- يكون نص فحص Heartbeat هو prompt الـ Heartbeat المهيأ (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). وتُطبق التوجيهات المضمنة في رسالة heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من heartbeats).
- يكون تسليم Heartbeat افتراضيًا هو الحمولة النهائية فقط. ولإرسال رسالة `Reasoning:` المنفصلة أيضًا (عندما تكون متاحة)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو لكل وكيل `agents.list[].heartbeat.includeReasoning: true`.

## واجهة دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزن للجلسة من مخزن/تهيئة الجلسات الواردة عند تحميل الصفحة.
- تؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`; ولا تنتظر الإرسال التالي وليست تجاوز `thinkingOnce` لمرة واحدة.
- يكون الخيار الأول دائمًا `Default (<resolved level>)`، حيث يأتي الافتراضي المحلول من ملف تعريف التفكير الخاص بمزوّد النموذج النشط في الجلسة بالإضافة إلى منطق fallback نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المحدد `thinkingOptions` المرجعة من صف جلسة gateway. ولا تحتفظ واجهة المتصفح بقائمة regex خاصة بالمزوّدين؛ إذ تمتلك Plugins مجموعات المستويات الخاصة بكل نموذج.
- لا يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، لذا تظل توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّد

- يمكن لـ Plugins المزوّد كشف `resolveThinkingProfile(ctx)` لتعريف المستويات المدعومة والافتراضية للنموذج.
- لكل مستوى في ملف التعريف `id` قانوني مخزن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. ويستخدم المزوّدون الثنائيون `{ id: "low", label: "on" }`.
- تظل الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) قائمة كمهايئات توافقية، لكن مجموعات المستويات المخصصة الجديدة يجب أن تستخدم `resolveThinkingProfile`.
- تكشف صفوف Gateway عن `thinkingOptions` و`thinkingDefault` لكي تعرض عملاء ACP/chat ملف التعريف نفسه الذي يستخدمه تحقق runtime.
