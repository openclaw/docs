---
read_when:
    - أنت تربط واجهات استخدام/حصص المزوّد
    - تحتاج إلى شرح سلوك تتبّع الاستخدام أو متطلبات المصادقة
summary: واجهات تتبع الاستخدام ومتطلبات بيانات الاعتماد
title: تتبّع الاستخدام
x-i18n:
    generated_at: "2026-06-27T17:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## ما هو

- يجلب استخدام/حصة المزوّد مباشرة من نقاط نهاية الاستخدام لديهم.
- لا توجد تكاليف تقديرية؛ فقط نوافذ الحصة التي يبلّغ عنها المزوّد أو ملخصات
  حالة الحساب.
- يتم تطبيع مخرجات حالة نافذة الحصة المقروءة للبشر إلى `X% left`، حتى
  عندما تبلّغ API علوية عن الحصة المستهلكة، أو الحصة المتبقية، أو الأعداد
  الخام فقط. يمكن للمزوّدين الذين لا يملكون نوافذ حصص قابلة لإعادة الضبط عرض
  نص ملخص من المزوّد بدلا من ذلك، مثل الرصيد.
- يمكن لـ `/status` على مستوى الجلسة و`session_status` الرجوع إلى أحدث
  إدخال استخدام في النص المنسوخ عندما تكون لقطة الجلسة الحية شحيحة. يملأ ذلك
  الرجوع عدادات الرموز/ذاكرة التخزين المؤقت الناقصة، ويمكنه استعادة تسمية
  نموذج وقت التشغيل النشط، ويفضل الإجمالي الأكبر الموجه للمطالبة عندما تكون
  بيانات الجلسة الوصفية مفقودة أو أصغر. تظل القيم الحية غير الصفرية الموجودة
  هي الفائزة.

## أين يظهر

- `/status` في المحادثات: بطاقة حالة غنية بالرموز التعبيرية مع رموز الجلسة + التكلفة المقدرة (مفتاح API فقط). يظهر استخدام المزوّد لـ **مزوّد النموذج الحالي** عند توفره كنافذة `X% left` مطبعة أو كنص ملخص من المزوّد.
- `/usage off|tokens|full` في المحادثات: تذييل استخدام لكل استجابة (يعرض OAuth الرموز فقط).
- `/usage cost` في المحادثات: ملخص تكلفة محلي مجمع من سجلات جلسات OpenClaw.
- CLI: يطبع `openclaw status --usage` تفصيلا كاملا لكل مزوّد.
- CLI: يطبع `openclaw channels list` لقطة الاستخدام نفسها إلى جانب إعداد المزوّد (استخدم `--no-usage` للتخطي).
- شريط قوائم macOS: قسم "الاستخدام" ضمن السياق (فقط إذا كان متاحا).

## وضع تذييل الاستخدام الافتراضي

يضبط `/usage off|tokens|full` التذييل لجلسة ويتم تذكره لتلك الجلسة.
يمهد `messages.responseUsage` ذلك الوضع للجلسات التي لم تختر واحدا، لذا يمكن
أن يكون التذييل مفعلا افتراضيا دون كتابة `/usage` في كل مرة.

اضبط وضعا واحدا لكل قناة، أو خريطة لكل قناة مع رجوع `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### ثلاث حالات مميزة للجلسة

لحقل `responseUsage` في الجلسة ثلاث حالات قابلة للتمثيل، ولكل منها دلالات
مختلفة:

| الحالة                    | القيمة المخزنة                  | الوضع الفعال                                                        |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| **غير مضبوط / وراثة**     | `undefined` (غائب)              | يمر إلى افتراضي إعداد `messages.responseUsage`، ثم `off`.          |
| **إيقاف صريح**            | `"off"` (مخزن)                  | متوقف دائما — لا يمكن لافتراضي إعداد غير متوقف إعادة تفعيل التذييل. |
| **تشغيل صريح**            | `"tokens"` أو `"full"` (مخزن)   | ذلك الوضع، بغض النظر عن افتراضي الإعداد.                           |

### الأولوية

الوضع الفعال = تجاوز الجلسة → إدخال إعداد القناة → `default` → `off`.

يتم **استمرار** أمر `/usage off` الصريح كقيمة حرفية `"off"` في الجلسة، وليس
كأنه "غير مضبوط." هذا يعني أن افتراضيا غير متوقف لـ `messages.responseUsage`
لا يمكنه إعادة تشغيل التذييل بعد أن يعطله المستخدم صراحة.

### إعادة الضبط مقابل الإيقاف

- `/usage off` — يفرض إيقاف التذييل ويستمر بهذا الاختيار. لا يمكن لافتراضي
  غير متوقف مهيأ تجاوز هذا.
- `/usage reset` (الأسماء المستعارة: `inherit`، `clear`، `default`) — يمسح
  تجاوز الجلسة. عندها **ترث** الجلسة افتراضي الإعداد الفعال
  (`messages.responseUsage`). إذا لم يكن هناك افتراضي مهيأ، يكون التذييل
  متوقفا (بلا تغيير عن السابق). استخدم هذا من أجل "العودة إلى الافتراضي" دون
  تشغيل التذييل صراحة.
- إعادة ضبط الجلسة الكاملة (`/reset` أو `/new`) أو انتقال الجلسة **يحافظ**
  على تفضيل وضع الاستخدام الصريح حتى يظل اختيار العرض الخاص بالمستخدم قائما
  بعد انتقالات الجلسة. فقط `/usage reset` (وأسماؤه المستعارة) يمسح التجاوز
  فعليا.

### سلوك التبديل

ينتقل `/usage` بلا وسائط بالتتابع: off → tokens → full → off. نقطة البداية
للدورة هي الوضع الحالي **الفعال** (تجاوز الجلسة الذي يمر إلى افتراضي الإعداد
عندما يكون غير مضبوط)، لذلك تكون الدورة دائما متسقة مع ما يراه المستخدم في
التذييل.

### الإعداد

دون إعداد، يبقى السلوك السابق قائما (التذييل متوقف حتى `/usage`). استخدم
`/usage reset` لمسح تجاوز جلسة وإعادة وراثة الافتراضي المهيأ.

## تذييل `/usage full` المخصص

يعرض `/usage full` تذييلا مدمجا مضمنا يحتوي على النموذج، والاستدلال،
والسريع/البطيء، ونافذة السياق، ورموز الدور، وذاكرة التخزين المؤقت، والتكلفة
عندما تكون هذه الحقول متاحة. لا يلزم ملف قالب.

`messages.usageTemplate` مخصص فقط للتخطيطات المخصصة المتقدمة. القيمة هي مسار
ملف JSON (يدعم `~`) أو كائن مضمن، ويستبدل التذييل المضمن عندما يكون صالحا:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

ترجع القوالب المفقودة أو الفارغة إلى التذييل المضمن بهدوء. القوالب المهيأة
غير القابلة للقراءة أو غير الصالحة ترجع أيضا إلى التذييل المضمن وتصدر تحذيرا
للمشغل.

ابدأ القوالب المخصصة من الشكل المضمن، ثم عدل الأجزاء التي تريد تغييرها:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### الشكل

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

كل سطح هو قائمة مرتبة من **الأجزاء**؛ يعرض المحرك كل جزء، ويسقط الأجزاء
الفارغة، ويجمع الأجزاء الباقية باستخدام `sep`. يستخدم السطح الذي لا يحتوي على
إدخال `output.default`.

### مسارات العقد

يقرأ الجزء القيم من عقد كل دور عبر مسار نقطي. القيم الغائبة تكون فارغة (لذا
يحافظ حارس `when` أو `|fallback` على نظافة الجزء).

| المسار                                                                              | المعنى                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------ |
| `surface`                                                                           | معرّف القناة (`discord`/`telegram`/إلخ.)   |
| `model.provider` / `model.display_name`                                             | معرّف المزوّد / معرّف النموذج              |
| `model.reasoning`                                                                   | الجهد (`off` حتى `xhigh`)                  |
| `model.is_fallback` / `model.is_override`                                           | منطقي: تم استخدام الرجوع / تم تثبيت النموذج |
| `state.fast_mode`                                                                   | منطقي: سريع مقابل بطيء                     |
| `context.max_tokens` / `context.pct_used`                                           | ميزانية النافذة / 0-100 مستخدم             |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | تجميع الدور                                |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | حراس عرض الرموز ونسبة ذاكرة التخزين المؤقت |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | استدعاء النموذج النهائي فقط                |
| `cost.turn_usd`                                                                     | تكلفة الدور المقدرة                        |
| `identity.name` / `identity.emoji`                                                  | اسم الوكيل / الرمز التعبيري المختار         |

(نوافذ تحديد معدل المزوّد **ليست** في هذا العقد.)

### الأفعال

مرر قيمة عبر الأفعال من اليسار إلى اليمين؛ المقطع غير الفعلي هو الرجوع.

| الفعل           | التأثير                                      | مثال                             |
| --------------- | ------------------------------------------- | -------------------------------- |
| `num`           | عدد مضغوط                                   | `272000 -> 272k`                 |
| `fixed:N`       | N من المنازل العشرية (الافتراضي 2)          | `0.0377`                         |
| `dur`           | ثوان إلى مدة                                | `14820 -> 4h07m`                 |
| `pct`           | إلحاق `%`                                   | `96 -> 96%`                      |
| `inv`           | `100 - x`                                   | من المستخدم إلى المتبقي          |
| `alias:TABLE`   | بحث في `aliases`، وإعادة الصدى إذا لم يدرج | `medium -> 🌗`                   |
| `meter:W:SCALE` | شريط رموز W-خانة على قيمة 0-100             | `[⣿⣿⠐⠐⠐]` (`meter:1` = رمز واحد) |

### صيغ الأجزاء

- `{ "text": "📚 {context.max_tokens|num}" }`: نص حرفي + إدراج.
- `{ "when": "<path>", "text": "..." }`: اعرض فقط إذا كان المسار صادقا.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: قيمة إلى رمز.
- `{ "each": "limits.windows", "item": "{label}" }`: كرر عبر مصفوفة.

### مثال

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

يعرض مثلًا `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## المزوّدون + بيانات الاعتماد

- **Anthropic (Claude)**: رموز OAuth المميزة في ملفات تعريف المصادقة.
- **GitHub Copilot**: رموز OAuth المميزة في ملفات تعريف المصادقة.
- **Gemini CLI**: رموز OAuth المميزة في ملفات تعريف المصادقة.
  - يعود استخدام JSON إلى `stats`؛ وتُطبَّع `stats.cached` إلى
    `cacheRead`.
- **OpenAI Codex**: رموز OAuth المميزة في ملفات تعريف المصادقة (يُستخدم accountId عند وجوده).
- **MiniMax**: مفتاح API أو ملف تعريف مصادقة OAuth من MiniMax. يعامل OpenClaw
  `minimax` و`minimax-cn` و`minimax-portal` باعتبارها سطح حصة MiniMax نفسه،
  ويفضّل OAuth المخزّن من MiniMax عند وجوده، وإلا يعود إلى
  `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو `MINIMAX_API_KEY`.
  يستمد استطلاع الاستخدام مضيف خطة البرمجة من `models.providers.minimax-portal.baseUrl`
  أو `models.providers.minimax.baseUrl` عند تكوينه، وإلا يستخدم مضيف
  MiniMax CN.
  تعني حقول MiniMax الخام `usage_percent` / `usagePercent` الحصة **المتبقية**،
  لذلك يعكسها OpenClaw قبل العرض؛ وتكون الأولوية للحقول القائمة على العدّ عند
  وجودها.
  - تأتي تسميات نافذة خطة البرمجة من حقول الساعات/الدقائق الخاصة بالمزوّد عند
    وجودها، ثم تعود إلى نطاق `start_time` / `end_time`.
  - إذا أعادت نقطة نهاية خطة البرمجة `model_remains`، يفضّل OpenClaw إدخال
    نموذج المحادثة، ويستمد تسمية النافذة من الطوابع الزمنية عند غياب حقول
    `window_hours` / `window_minutes` الصريحة، ويضمّن اسم النموذج في تسمية الخطة.
- **Xiaomi MiMo**: مفتاح API عبر env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: مفتاح API عبر env/config/auth store.
- **DeepSeek**: مفتاح API عبر env/config/auth store (`DEEPSEEK_API_KEY`).
  يستدعي OpenClaw نقطة نهاية الرصيد في DeepSeek ويعرض الرصيد الذي يبلّغ عنه
  المزوّد كنص بدلًا من نافذة حصة بالنسبة المئوية المتبقية.

يُخفى الاستخدام عندما يتعذر حلّ مصادقة استخدام صالحة وقابلة للاستخدام للمزوّد. يمكن للمزوّدين
توفير منطق مصادقة استخدام خاص بـ Plugin؛ وإلا يعود OpenClaw إلى
مطابقة بيانات اعتماد OAuth/مفتاح API من ملفات تعريف المصادقة أو متغيرات البيئة
أو التكوين.

## ذات صلة

- [استخدام الرموز وتكاليفها](/ar/reference/token-use)
- [استخدام API وتكاليفه](/ar/reference/api-usage-costs)
- [التخزين المؤقت للمطالبات](/ar/reference/prompt-caching)
