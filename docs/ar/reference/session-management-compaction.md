---
read_when:
    - تحتاج إلى تصحيح معرّفات الجلسات، أو JSONL الخاص بالنصوص التفريغية، أو حقول sessions.json
    - أنت تغيّر سلوك Compaction التلقائي أو تضيف أعمال صيانة “قبل Compaction”
    - تريد تنفيذ عمليات تفريغ للذاكرة أو أدوار نظام صامتة
summary: 'شرح متعمق: مخزن الجلسات + النصوص التفريغية، ودورة الحياة، وداخليات Compaction ‏(التلقائي)'
title: شرح متعمق لإدارة الجلسات
x-i18n:
    generated_at: "2026-04-24T08:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# إدارة الجلسات وCompaction ‏(شرح متعمق)

تشرح هذه الوثيقة كيف يدير OpenClaw الجلسات من البداية إلى النهاية:

- **توجيه الجلسات** (كيف تُربط الرسائل الواردة بـ `sessionKey`)
- **مخزن الجلسات** (`sessions.json`) وما الذي يتتبعه
- **استمرارية النصوص التفريغية** (`*.jsonl`) وبنيتها
- **سلامة النصوص التفريغية** (الإصلاحات الخاصة بالمزوّد قبل التشغيل)
- **حدود السياق** (نافذة السياق مقابل الرموز المميزة المتتبعة)
- **Compaction** ‏(اليدوي + التلقائي) وأين يمكنك ربط أعمال ما قبل Compaction
- **أعمال الصيانة الصامتة** (مثل كتابة الذاكرة التي لا ينبغي أن تنتج خرجًا مرئيًا للمستخدم)

إذا كنت تريد نظرة عامة أعلى مستوى أولًا، فابدأ بـ:

- [/concepts/session](/ar/concepts/session)
- [/concepts/compaction](/ar/concepts/compaction)
- [/concepts/memory](/ar/concepts/memory)
- [/concepts/memory-search](/ar/concepts/memory-search)
- [/concepts/session-pruning](/ar/concepts/session-pruning)
- [/reference/transcript-hygiene](/ar/reference/transcript-hygiene)

---

## مصدر الحقيقة: Gateway

صُمم OpenClaw حول **عملية Gateway واحدة** تمتلك حالة الجلسة.

- يجب على واجهات المستخدم (تطبيق macOS، وControl UI على الويب، وTUI) الاستعلام من Gateway عن قوائم الجلسات وعدد الرموز المميزة.
- في الوضع البعيد، تكون ملفات الجلسات موجودة على المضيف البعيد؛ لذا فإن “فحص ملفات Mac المحلية” لن يعكس ما يستخدمه Gateway.

---

## طبقتا الاستمرارية

يحفظ OpenClaw الجلسات في طبقتين:

1. **مخزن الجلسات (`sessions.json`)**
   - خريطة مفاتيح/قيم: ‏`sessionKey -> SessionEntry`
   - صغير، وقابل للتغيير، وآمن للتحرير (أو حذف الإدخالات)
   - يتتبع بيانات وصفية للجلسة (معرّف الجلسة الحالي، وآخر نشاط، والمفاتيح، وعدادات الرموز المميزة، وما إلى ذلك)

2. **النص التفريغي (`<sessionId>.jsonl`)**
   - نص تفريغي ملحق فقط ذو بنية شجرية (للإدخالات `id` + `parentId`)
   - يخزن المحادثة الفعلية + استدعاءات الأدوات + ملخصات Compaction
   - يُستخدم لإعادة بناء سياق النموذج للأدوار المستقبلية

---

## المواقع على القرص

لكل وكيل، على مضيف Gateway:

- المخزن: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- النصوص التفريغية: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - جلسات موضوعات Telegram: ‏`.../<sessionId>-topic-<threadId>.jsonl`

يقوم OpenClaw بتحليل هذه المسارات عبر `src/config/sessions.ts`.

---

## صيانة المخزن وعناصر التحكم في القرص

تحتوي استمرارية الجلسات على عناصر تحكم تلقائية للصيانة (`session.maintenance`) تخص `sessions.json` وعناصر النصوص التفريغية:

- `mode`: ‏`warn` ‏(الافتراضي) أو `enforce`
- `pruneAfter`: حد عمر الإدخالات القديمة (الافتراضي `30d`)
- `maxEntries`: حد أقصى للإدخالات في `sessions.json` ‏(الافتراضي `500`)
- `rotateBytes`: تدوير `sessions.json` عندما يكبر حجمه أكثر من اللازم (الافتراضي `10mb`)
- `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>` ‏(الافتراضي: مثل `pruneAfter`؛ ويؤدي `false` إلى تعطيل التنظيف)
- `maxDiskBytes`: ميزانية اختيارية لدليل الجلسات
- `highWaterBytes`: هدف اختياري بعد التنظيف (الافتراضي `80%` من `maxDiskBytes`)

ترتيب التنفيذ عند تنظيف ميزانية القرص (`mode: "enforce"`):

1. إزالة أقدم العناصر المؤرشفة أو النصوص التفريغية اليتيمة أولًا.
2. إذا ظل الاستخدام فوق الهدف، تُزال أقدم إدخالات الجلسات وملفات النصوص التفريغية الخاصة بها.
3. الاستمرار حتى يصبح الاستخدام عند أو تحت `highWaterBytes`.

في وضع `warn`، يبلغ OpenClaw عن عمليات الإزالة المحتملة لكنه لا يغيّر المخزن/الملفات.

شغّل الصيانة عند الطلب:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## جلسات Cron وسجلات التشغيل

تُنشئ تشغيلات Cron المعزولة أيضًا إدخالات جلسات/نصوص تفريغية، ولها عناصر تحكم مخصصة للاحتفاظ:

- `cron.sessionRetention` ‏(الافتراضي `24h`) يقلّم جلسات تشغيل Cron المعزولة القديمة من مخزن الجلسات (`false` يعطّل ذلك).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` يقلّمان ملفات `~/.openclaw/cron/runs/<jobId>.jsonl` ‏(الافتراضيات: `2_000_000` بايت و`2000` سطر).

---

## مفاتيح الجلسات (`sessionKey`)

يعرّف `sessionKey` _سلة المحادثة التي أنت فيها_ (التوجيه + العزل).

أنماط شائعة:

- الدردشة الرئيسية/المباشرة (لكل وكيل): ‏`agent:<agentId>:<mainKey>` ‏(الافتراضي `main`)
- المجموعة: ‏`agent:<agentId>:<channel>:group:<id>`
- الغرفة/القناة (Discord/Slack): ‏`agent:<agentId>:<channel>:channel:<id>` أو `...:room:<id>`
- Cron: ‏`cron:<job.id>`
- Webhook: ‏`hook:<uuid>` ‏(ما لم يتم تجاوزه)

القواعد الأساسية موثقة في [/concepts/session](/ar/concepts/session).

---

## معرّفات الجلسات (`sessionId`)

يشير كل `sessionKey` إلى `sessionId` حالي (ملف النص التفريغي الذي يواصل المحادثة).

قواعد عامة:

- **إعادة التعيين** ‏(`/new`، `/reset`) تنشئ `sessionId` جديدًا لذلك `sessionKey`.
- **إعادة التعيين اليومية** ‏(الافتراضي 4:00 صباحًا بالتوقيت المحلي على مضيف gateway) تنشئ `sessionId` جديدًا عند الرسالة التالية بعد حد إعادة التعيين.
- **انتهاء الخمول** ‏(`session.reset.idleMinutes` أو `session.idleMinutes` القديم) ينشئ `sessionId` جديدًا عندما تصل رسالة بعد نافذة الخمول. وعند تكوين اليومي + الخمول معًا، يفوز الذي تنتهي صلاحيته أولًا.
- **حاجز تفرع الأصل للخيط** ‏(`session.parentForkMaxTokens`، الافتراضي `100000`) يتخطى تفرع النص التفريغي للأصل عندما تكون الجلسة الأصلية كبيرة جدًا بالفعل؛ ويبدأ الخيط الجديد من جديد. اضبطه على `0` للتعطيل.

تفصيل تنفيذي: يحدث القرار في `initSessionState()` داخل `src/auto-reply/reply/session.ts`.

---

## مخطط مخزن الجلسات (`sessions.json`)

نوع قيمة المخزن هو `SessionEntry` في `src/config/sessions.ts`.

حقول أساسية (وليست شاملة):

- `sessionId`: معرّف النص التفريغي الحالي (ويُشتق اسم الملف من هذا ما لم يتم ضبط `sessionFile`)
- `updatedAt`: طابع زمني لآخر نشاط
- `sessionFile`: تجاوز اختياري صريح لمسار النص التفريغي
- `chatType`: ‏`direct | group | room` ‏(يساعد واجهات المستخدم وسياسة الإرسال)
- `provider` و`subject` و`room` و`space` و`displayName`: بيانات وصفية لتسمية المجموعات/القنوات
- المفاتيح:
  - `thinkingLevel` و`verboseLevel` و`reasoningLevel` و`elevatedLevel`
  - `sendPolicy` ‏(تجاوز لكل جلسة)
- اختيار النموذج:
  - `providerOverride` و`modelOverride` و`authProfileOverride`
- عدادات الرموز المميزة (أفضل جهد / وتعتمد على المزوّد):
  - `inputTokens` و`outputTokens` و`totalTokens` و`contextTokens`
- `compactionCount`: عدد مرات اكتمال Compaction التلقائي لهذا `sessionKey`
- `memoryFlushAt`: طابع زمني لآخر Memory flush قبل Compaction
- `memoryFlushCompactionCount`: عدد مرات Compaction عندما تم آخر flush

المخزن آمن للتحرير، لكن Gateway هو المرجع الأساسي: فقد يعيد كتابة الإدخالات أو يعيد إحياءها أثناء تشغيل الجلسات.

---

## بنية النص التفريغي (`*.jsonl`)

تدار النصوص التفريغية بواسطة `SessionManager` في `@mariozechner/pi-coding-agent`.

الملف بصيغة JSONL:

- السطر الأول: ترويسة الجلسة (`type: "session"`، ويتضمن `id` و`cwd` و`timestamp` و`parentSession` اختياريًا)
- ثم: إدخالات الجلسة مع `id` + `parentId` ‏(شجرة)

أنواع إدخالات بارزة:

- `message`: رسائل المستخدم/المساعد/نتيجة الأداة
- `custom_message`: رسائل محقونة من الإضافات _تدخل_ سياق النموذج (ويمكن إخفاؤها عن UI)
- `custom`: حالة خاصة بالإضافة لا تدخل سياق النموذج
- `compaction`: ملخص Compaction محفوظ مع `firstKeptEntryId` و`tokensBefore`
- `branch_summary`: ملخص محفوظ عند التنقل في فرع من الشجرة

يتعمد OpenClaw **ألا** “يصلح” النصوص التفريغية؛ إذ يستخدم Gateway ‏`SessionManager` لقراءتها/كتابتها.

---

## نوافذ السياق مقابل الرموز المميزة المتتبعة

يوجد مفهومان مختلفان مهمان:

1. **نافذة سياق النموذج**: الحد الصلب لكل نموذج (الرموز المميزة المرئية للنموذج)
2. **عدادات مخزن الجلسات**: إحصاءات متدحرجة تُكتب إلى `sessions.json` ‏(وتُستخدم من أجل /status ولوحات المعلومات)

إذا كنت تضبط الحدود:

- تأتي نافذة السياق من فهرس النموذج (ويمكن تجاوزها عبر التكوين).
- تمثل `contextTokens` في المخزن قيمة تقديرية/تقارير وقت التشغيل؛ فلا تتعامل معها كضمان صارم.

للمزيد، راجع [/token-use](/ar/reference/token-use).

---

## Compaction: ما هو

يقوم Compaction بتلخيص المحادثة الأقدم في إدخال `compaction` محفوظ في النص التفريغي مع إبقاء الرسائل الحديثة كما هي.

بعد Compaction، ترى الأدوار المستقبلية:

- ملخص Compaction
- الرسائل بعد `firstKeptEntryId`

يعد Compaction **دائمًا** ‏(بعكس تقليم الجلسات). راجع [/concepts/session-pruning](/ar/concepts/session-pruning).

## حدود أجزاء Compaction واقتران الأدوات

عندما يقسم OpenClaw نصًا تفريغيًا طويلًا إلى أجزاء Compaction، فإنه يُبقي
استدعاءات أدوات المساعد مقترنة بإدخالات `toolResult` المطابقة لها.

- إذا وقعت حدود التقسيم حسب حصة الرموز المميزة بين استدعاء أداة ونتيجتها، فإن OpenClaw
  ينقل الحد إلى رسالة استدعاء أداة المساعد بدلًا من فصل
  الزوج.
- إذا كانت كتلة tool-result اللاحقة ستدفع الجزء إلى ما فوق الهدف،
  فإن OpenClaw يحتفظ بكتلة الأداة المعلقة هذه ويبقي الذيل غير الملخّص كما هو.
- لا تُبقي كتل استدعاءات الأدوات المجهضة/التي تحتوي على أخطاء الانقسام المعلق مفتوحًا.

---

## متى يحدث Compaction التلقائي (Runtime ‏Pi)

في الوكيل المضمّن Pi، يتم تشغيل Compaction التلقائي في حالتين:

1. **استعادة التجاوز**: يعيد النموذج خطأ تجاوز سياق
   (`request_too_large`، أو `context length exceeded`، أو `input exceeds the maximum
number of tokens`، أو `input token count exceeds the maximum number of input
tokens`، أو `input is too long for the model`، أو `ollama error: context length
exceeded`، وغيرها من المتغيرات المشكّلة بحسب المزوّد) → ثم يتم Compaction → ثم إعادة المحاولة.
2. **صيانة العتبة**: بعد دور ناجح، عندما:

`contextTokens > contextWindow - reserveTokens`

حيث:

- `contextWindow` هي نافذة سياق النموذج
- `reserveTokens` هو الهامش المحجوز للمطالبات + خرج النموذج التالي

هذه دلالات Runtime الخاصة بـ Pi ‏(يستهلك OpenClaw الأحداث، لكن Pi هو الذي يقرر متى يقوم بـ Compaction).

---

## إعدادات Compaction ‏(`reserveTokens`, `keepRecentTokens`)

توجد إعدادات Compaction الخاصة بـ Pi في إعدادات Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

يفرض OpenClaw أيضًا حد أمان أدنى على التشغيلات المضمّنة:

- إذا كانت `compaction.reserveTokens < reserveTokensFloor`، يقوم OpenClaw برفعها.
- الحد الأدنى الافتراضي هو `20000` رمز.
- اضبط `agents.defaults.compaction.reserveTokensFloor: 0` لتعطيل الحد الأدنى.
- إذا كانت أعلى بالفعل، يتركها OpenClaw كما هي.

السبب: ترك هامش كافٍ لأعمال “الصيانة” متعددة الأدوار (مثل كتابة الذاكرة) قبل أن يصبح Compaction أمرًا لا مفر منه.

التنفيذ: `ensurePiCompactionReserveTokens()` في `src/agents/pi-settings.ts`
(ويُستدعى من `src/agents/pi-embedded-runner.ts`).

---

## مزوّدو Compaction القابلون للتوصيل

يمكن للـ Plugins تسجيل مزوّد Compaction عبر `registerCompactionProvider()` على Plugin API. وعندما يتم ضبط `agents.defaults.compaction.provider` على معرّف مزوّد مسجل، يفوض امتداد safeguard عملية التلخيص إلى ذلك المزوّد بدلًا من خط أنابيب `summarizeInStages` المدمج.

- `provider`: معرّف Plugin مزوّد Compaction مسجل. اتركه غير مضبوط لاستخدام التلخيص الافتراضي عبر LLM.
- يؤدي ضبط `provider` إلى فرض `mode: "safeguard"`.
- تتلقى المزوّدات تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات كما في المسار المدمج.
- يظل safeguard محافظًا على سياق لاحقة الدور الحديث والدور المنقسم بعد خرج المزوّد.
- إذا فشل المزوّد أو أعاد نتيجة فارغة، يعود OpenClaw تلقائيًا إلى التلخيص المدمج عبر LLM.
- تتم إعادة رمي إشارات الإجهاض/المهلة (ولا تُبتلع) لاحترام إلغاء الاستدعاء من الجهة الطالبة.

المصدر: `src/plugins/compaction-provider.ts`، و`src/agents/pi-hooks/compaction-safeguard.ts`.

---

## الأسطح المرئية للمستخدم

يمكنك ملاحظة Compaction وحالة الجلسة عبر:

- `/status` ‏(في أي جلسة دردشة)
- `openclaw status` ‏(CLI)
- `openclaw sessions` / `sessions --json`
- الوضع المفصل: `🧹 Auto-compaction complete` + عدد مرات Compaction

---

## الصيانة الصامتة (`NO_REPLY`)

يدعم OpenClaw الأدوار “الصامتة” للمهام الخلفية التي لا ينبغي أن يرى المستخدم فيها خرجًا وسيطًا.

الاتفاقية:

- يبدأ المساعد خرجه بالرمز الصامت الدقيق `NO_REPLY` /
  `no_reply` للإشارة إلى “لا تسلّم ردًا إلى المستخدم”.
- يقوم OpenClaw بإزالة/منع هذا في طبقة التسليم.
- يكون منع الرمز الصامت الدقيق غير حساس لحالة الأحرف، لذا يُحتسب كل من `NO_REPLY` و
  `no_reply` عندما تكون الحمولة كلها هي الرمز الصامت فقط.
- هذا مخصص للأدوار الخلفية/عديمة التسليم الحقيقية فقط؛ وليس اختصارًا
  لطلبات المستخدم العادية القابلة للتنفيذ.

ابتداءً من `2026.1.10`، يقوم OpenClaw أيضًا بمنع **البث على هيئة مسودة/كتابة**
عندما يبدأ جزء جزئي بـ `NO_REPLY`، حتى لا تكشف العمليات الصامتة خرجًا جزئيًا
في منتصف الدور.

---

## "تفريغ الذاكرة" قبل Compaction ‏(منفّذ)

الهدف: قبل حدوث Compaction التلقائي، تشغيل دور وكيل صامت يكتب حالة دائمة
إلى القرص (مثل `memory/YYYY-MM-DD.md` في مساحة عمل الوكيل) حتى لا يستطيع Compaction
محو السياق الحرج.

يستخدم OpenClaw أسلوب **التفريغ قبل العتبة**:

1. راقب استخدام سياق الجلسة.
2. عندما يتجاوز “عتبة مرنة” (أقل من عتبة Compaction الخاصة بـ Pi)، شغّل
   توجيهًا صامتًا من نوع “اكتب الذاكرة الآن” إلى الوكيل.
3. استخدم الرمز الصامت الدقيق `NO_REPLY` / `no_reply` بحيث لا يرى المستخدم
   شيئًا.

التكوين (`agents.defaults.compaction.memoryFlush`):

- `enabled` ‏(الافتراضي: `true`)
- `softThresholdTokens` ‏(الافتراضي: `4000`)
- `prompt` ‏(رسالة المستخدم الخاصة بدور التفريغ)
- `systemPrompt` ‏(مطالبة نظام إضافية تُلحق بدور التفريغ)

ملاحظات:

- تتضمن المطالبة/مطالبة النظام الافتراضيتان تلميح `NO_REPLY` لمنع
  التسليم.
- يعمل التفريغ مرة واحدة لكل دورة Compaction ‏(ويتم تتبعه في `sessions.json`).
- يعمل التفريغ فقط مع جلسات Pi المضمّنة (أما الواجهات الخلفية لـ CLI فتتخطاه).
- يتم تخطي التفريغ عندما تكون مساحة عمل الجلسة للقراءة فقط (`workspaceAccess: "ro"` أو `"none"`).
- راجع [الذاكرة](/ar/concepts/memory) لتخطيط ملفات مساحة العمل وأنماط الكتابة.

يكشف Pi أيضًا عن خطاف `session_before_compact` في Plugin API، لكن منطق
التفريغ في OpenClaw يعيش في جانب Gateway حاليًا.

---

## قائمة التحقق لاستكشاف الأخطاء وإصلاحها

- مفتاح الجلسة غير صحيح؟ ابدأ بـ [/concepts/session](/ar/concepts/session) وتحقق من `sessionKey` في `/status`.
- عدم تطابق المخزن مع النص التفريغي؟ تحقق من مضيف Gateway ومسار المخزن من `openclaw status`.
- كثرة Compaction بشكل مزعج؟ تحقق من:
  - نافذة سياق النموذج (صغيرة جدًا)
  - إعدادات Compaction ‏(`reserveTokens` إذا كانت مرتفعة جدًا مقارنةً بنافذة النموذج فقد تسبب Compaction أبكر)
  - تضخم نتائج الأدوات: فعّل/اضبط تقليم الجلسات
- تسرب الأدوار الصامتة؟ تأكد من أن الرد يبدأ بـ `NO_REPLY` ‏(رمز دقيق غير حساس لحالة الأحرف) وأنك تستخدم إصدارًا يتضمن إصلاح منع البث.

## ذو صلة

- [إدارة الجلسات](/ar/concepts/session)
- [تقليم الجلسات](/ar/concepts/session-pruning)
- [محرك السياق](/ar/concepts/context-engine)
