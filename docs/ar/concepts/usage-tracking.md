---
read_when:
    - أنت تربط واجهات استخدام المزوّد والحصص
    - تحتاج إلى شرح سلوك تتبع الاستخدام أو متطلبات المصادقة
summary: أسطح تتبّع الاستخدام ومتطلبات بيانات الاعتماد
title: تتبّع الاستخدام
x-i18n:
    generated_at: "2026-07-01T18:13:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## ما هو

- يجلب استخدام المزوّد/الحصة مباشرةً من نقاط نهاية الاستخدام الخاصة بهم.
- لا توجد تكاليف تقديرية؛ فقط نوافذ الحصة التي يبلّغ عنها المزوّد أو ملخصات
  حالة الحساب.
- يتم توحيد مخرجات حالة نافذة الحصة المقروءة بشريًا إلى `X% left`، حتى
  عندما تبلّغ API علوية عن الحصة المستهلكة، أو الحصة المتبقية، أو الأعداد
  الخام فقط. يمكن للمزوّدين الذين لا يملكون نوافذ حصة قابلة لإعادة التعيين
  عرض نص ملخص من المزوّد بدلًا من ذلك، مثل الرصيد.
- يمكن أن يرجع `/status` على مستوى الجلسة و`session_status` إلى أحدث إدخال
  استخدام في النص المنسوخ عندما تكون لقطة الجلسة الحية شحيحة. يملأ هذا
  الرجوع عدادات الرموز/الذاكرة المخبئية الناقصة، ويمكنه استعادة تسمية نموذج
  وقت التشغيل النشط، ويفضّل الإجمالي الأكبر الموجّه للمطالبة عندما تكون
  بيانات الجلسة الوصفية مفقودة أو أصغر. تظل القيم الحية الحالية غير الصفرية
  هي الفائزة.

## أين يظهر

- `/status` في الدردشات: بطاقة حالة غنية بالرموز التعبيرية مع رموز الجلسة + التكلفة التقديرية (مفتاح API فقط). يظهر استخدام المزوّد لـ **مزوّد النموذج الحالي** عند توفره كنافذة موحّدة `X% left` أو نص ملخص من المزوّد.
- `/usage off|tokens|full` في الدردشات: تذييل استخدام لكل استجابة.
- `/usage cost` في الدردشات: ملخص تكلفة محلي مجمّع من سجلات جلسات OpenClaw.
- CLI: يطبع `openclaw status --usage` تفصيلًا كاملًا لكل مزوّد.
- CLI: يطبع `openclaw channels list` لقطة الاستخدام نفسها بجانب إعدادات المزوّد (استخدم `--no-usage` للتخطي).
- شريط قوائم macOS: قسم "الاستخدام" ضمن السياق (فقط عند توفره).

## وضع تذييل الاستخدام الافتراضي

يضبط `/usage off|tokens|full` التذييل لجلسة ويتم تذكره لتلك الجلسة.
تؤسس `messages.responseUsage` ذلك الوضع للجلسات التي لم تختر واحدًا، بحيث
يمكن أن يكون التذييل مفعّلًا افتراضيًا من دون كتابة `/usage` في كل مرة.

اضبط وضعًا واحدًا لكل قناة، أو خريطة لكل قناة مع رجوع `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### ثلاث حالات جلسة مميزة

يحتوي حقل `responseUsage` الخاص بالجلسة على ثلاث حالات قابلة للتمثيل، لكل
منها دلالات مختلفة:

| الحالة                  | القيمة المخزنة                  | الوضع الفعّال                                                             |
| ----------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| **غير مضبوط / يرث**     | `undefined` (غائب)              | يمر إلى افتراضي إعداد `messages.responseUsage`، ثم `off`.                 |
| **إيقاف صريح**          | `"off"` (مخزّن)                 | متوقف دائمًا — لا يمكن لافتراضي إعداد غير `off` إعادة تفعيل التذييل.      |
| **تشغيل صريح**          | `"tokens"` أو `"full"` (مخزّن) | ذلك الوضع، بغض النظر عن افتراضي الإعداد.                                  |

### الأسبقية

الوضع الفعّال = تجاوز الجلسة → إدخال إعداد القناة → `default` → `off`.

يتم **حفظ** `/usage off` الصريح كقيمة حرفية `"off"` في الجلسة، وليس مثل
"غير مضبوط". يعني هذا أن افتراضي `messages.responseUsage` غير `off` لا يمكنه
إعادة تشغيل التذييل بعدما عطّله المستخدم صراحةً.

### إعادة الضبط مقابل الإيقاف

- `/usage off` — يفرض إيقاف التذييل ويحفظ ذلك الاختيار. لا يمكن لافتراضي
  غير `off` مضبوط تجاوزه.
- `/usage reset` (الأسماء المستعارة: `inherit`، `clear`، `default`) — يمسح
  تجاوز الجلسة. بعدها **ترث** الجلسة افتراضي الإعداد الفعّال
  (`messages.responseUsage`). إذا لم يتم ضبط أي افتراضي، يكون التذييل متوقفًا
  (من دون تغيير عن السابق). استخدم هذا من أجل "العودة إلى الافتراضي" من دون
  تشغيل التذييل صراحةً.
- إعادة ضبط كاملة للجلسة (`/reset` أو `/new`) أو انتقال الجلسة **يحافظ** على
  تفضيل وضع الاستخدام الصريح كي يبقى اختيار عرض المستخدم عبر انتقالات
  الجلسات. فقط `/usage reset` (وأسماؤه المستعارة) يمسح التجاوز فعليًا.

### سلوك التبديل

`/usage` من دون وسائط يدور: off → tokens → full → off. نقطة بدء الدورة هي
الوضع الحالي **الفعّال** (تجاوز الجلسة يمر إلى افتراضي الإعداد عندما يكون غير
مضبوط)، لذلك تكون الدورة دائمًا متسقة مع ما يراه المستخدم في التذييل.

### الإعداد

من دون إعداد، يبقى السلوك السابق قائمًا (التذييل متوقف حتى `/usage`). استخدم
`/usage reset` لمسح تجاوز جلسة وإعادة وراثة الافتراضي المضبوط.

## تذييل `/usage full` مخصص

يعرض `/usage full` تذييلًا مدمجًا مضغوطًا يتضمن النموذج، والاستدلال،
والسريع/البطيء، ونافذة السياق، والتكلفة عندما تكون تلك الحقول متاحة. تظل حقول
الرموز والذاكرة المخبئية متاحة للقوالب المخصصة. لا يلزم ملف قالب.

`messages.usageTemplate` مخصص فقط للتخطيطات المتقدمة المخصصة. القيمة هي مسار
ملف JSON (يدعم `~`) أو كائن مضمن، ويستبدل التذييل المدمج عندما يكون صالحًا:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

ترجع القوالب المفقودة أو الفارغة إلى التذييل المدمج بهدوء. كما ترجع القوالب
المضبوطة غير القابلة للقراءة أو غير الصالحة إلى التذييل المدمج وتصدر تحذيرًا
للمشغّل.

ابدأ القوالب المخصصة من الشكل المدمج، ثم عدّل الأجزاء التي تريد تغييرها:

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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
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

كل سطح هو قائمة مرتبة من **الأجزاء**؛ يعرض المحرك كل جزء، ويسقط الفارغ، ويصل
الأجزاء الباقية باستخدام `sep`. السطح الذي لا يملك إدخالًا يستخدم
`output.default`.

### مسارات العقد

يقرأ الجزء القيم من عقد كل دورة عبر مسار بنقاط. تكون القيم الغائبة فارغة (لذلك
يحافظ حارس `when` أو `|fallback` على نظافة الجزء).

| المسار                                                                              | المعنى                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------- |
| `surface`                                                                           | معرّف القناة (`discord`/`telegram`/إلخ.)    |
| `model.provider` / `model.display_name`                                             | معرّف المزوّد / معرّف النموذج               |
| `model.reasoning`                                                                   | الجهد (`off` حتى `xhigh`)                   |
| `model.is_fallback` / `model.is_override`                                           | منطقي: استُخدم الرجوع / النموذج مثبّت       |
| `state.fast_mode`                                                                   | منطقي: سريع مقابل بطيء                      |
| `context.max_tokens` / `context.pct_used`                                           | ميزانية النافذة / 0-100 مستخدم              |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | تجميع الدورة                                |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | حراس عرض الرموز ونسبة الذاكرة المخبئية      |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | استدعاء النموذج النهائي فقط                 |
| `cost.turn_usd`                                                                     | تكلفة الدورة التقديرية                      |
| `identity.name` / `identity.emoji`                                                  | اسم الوكيل / الرمز التعبيري المختار         |

(نوافذ حد معدل المزوّد **ليست** ضمن هذا العقد.)

### الأفعال

مرّر قيمة عبر الأفعال من اليسار إلى اليمين؛ المقطع غير الفعلي هو قيمة الرجوع.

| الفعل           | التأثير                                 | مثال                             |
| --------------- | ---------------------------------------- | -------------------------------- |
| `num`           | عدد مضغوط                                | `272000 -> 272k`                 |
| `fixed:N`       | N منازل عشرية (الافتراضي 2)             | `0.0377`                         |
| `dur`           | ثوانٍ إلى مدة                            | `14820 -> 4h07m`                 |
| `pct`           | إلحاق `%`                                | `96 -> 96%`                      |
| `inv`           | `100 - x`                                | من المستخدم إلى المتبقي          |
| `alias:TABLE`   | بحث في `aliases`، يردد إذا لم يكن مدرجًا | `medium -> 🌗`                   |
| `meter:W:SCALE` | شريط رموز من W خانات فوق قيمة 0-100      | `[⣿⣿⠐⠐⠐]` (`meter:1` = رمز واحد) |

### صيغ الأجزاء

- `{ "text": "📚 {context.max_tokens|num}" }`: نص حرفي + استيفاء.
- `{ "when": "<path>", "text": "..." }`: اعرض فقط إذا كان المسار ذا قيمة صادقة.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: قيمة إلى رمز.
- `{ "each": "limits.windows", "item": "{label}" }`: تكرار مصفوفة.

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

- **Anthropic (Claude)**: رموز OAuth في ملفات تعريف المصادقة.
- **GitHub Copilot**: رموز OAuth في ملفات تعريف المصادقة.
- **Gemini CLI**: رموز OAuth في ملفات تعريف المصادقة.
  - يعود استخدام JSON احتياطيًا إلى `stats`؛ ويتم تطبيع `stats.cached` إلى
    `cacheRead`.
- **OpenAI Codex**: رموز OAuth في ملفات تعريف المصادقة (يُستخدم accountId عند وجوده).
- **MiniMax**: مفتاح API أو ملف تعريف مصادقة MiniMax OAuth. يتعامل OpenClaw مع
  `minimax` و`minimax-cn` و`minimax-portal` كسطح حصة MiniMax نفسه،
  ويفضل MiniMax OAuth المخزن عند وجوده، وإلا يعود احتياطيًا
  إلى `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو `MINIMAX_API_KEY`.
  يستمد استطلاع الاستخدام مضيف Coding Plan من `models.providers.minimax-portal.baseUrl`
  أو `models.providers.minimax.baseUrl` عند تكوينه، وإلا يستخدم مضيف
  MiniMax CN.
  تعني حقول MiniMax الخام `usage_percent` / `usagePercent` الحصة **المتبقية**،
  لذلك يعكسها OpenClaw قبل العرض؛ وتكون الأولوية للحقول المستندة إلى العدد عند
  وجودها.
  - تأتي تسميات نافذة coding-plan من حقول الساعات/الدقائق لدى الموفر عند
    وجودها، ثم تعود احتياطيًا إلى نطاق `start_time` / `end_time`.
  - إذا أعادت نقطة نهاية coding-plan القيمة `model_remains`، يفضل OpenClaw
    إدخال نموذج الدردشة، ويستمد تسمية النافذة من الطوابع الزمنية عند غياب حقول
    `window_hours` / `window_minutes` الصريحة، ويضمّن اسم النموذج
    في تسمية الخطة.
- **Xiaomi MiMo**: مفتاح API عبر env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: مفتاح API عبر env/config/auth store.
- **DeepSeek**: مفتاح API عبر env/config/auth store (`DEEPSEEK_API_KEY`).
  يستدعي OpenClaw نقطة نهاية الرصيد لدى DeepSeek ويعرض الرصيد الذي يبلّغ عنه الموفر
  كنص بدلًا من نافذة حصة بالنسبة المئوية المتبقية.

يُخفى الاستخدام عندما لا يمكن حل مصادقة استخدام موفر قابلة للاستخدام. يمكن للموفرين
توفير منطق مصادقة استخدام خاص بـPlugin؛ وإلا يعود OpenClaw احتياطيًا إلى
مطابقة بيانات اعتماد OAuth/API-key من ملفات تعريف المصادقة، أو متغيرات البيئة،
أو التكوين.

## ذات صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API والتكاليف](/ar/reference/api-usage-costs)
- [التخزين المؤقت للمطالبات](/ar/reference/prompt-caching)
