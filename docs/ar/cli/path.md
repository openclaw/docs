---
read_when:
    - تريد قراءة أو كتابة عنصر طرفي داخل ملف مساحة العمل من الطرفية
    - تكتب نصوصًا برمجية للتعامل مع حالة مساحة العمل وتريد مخطط عنونة مستقرًا ومحايدًا من حيث النوع
    - أنت تستكشف أخطاء مسار `oc://` (تحقّق من صحة الصياغة، وانظر إلى ما يُحلّ إليه)
summary: مرجع CLI لـ `openclaw path` (فحص ملفات مساحة العمل وتحريرها عبر نظام عنونة `oc://`)
title: المسار
x-i18n:
    generated_at: "2026-05-10T19:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

وصول صدفي موفَّر من Plugin إلى طبقة العنونة `oc://`: مخطط مسارات واحد يفرّق حسب النوع لفحص ملفات مساحة العمل القابلة للعنونة وتحريرها (markdown، jsonc، jsonl). يستخدمه مستضيفو الذات، ومؤلفو Plugin، وإضافات المحررات لقراءة موقع ضيق أو العثور عليه أو تحديثه دون كتابة محللات خاصة بكل ملف يدويا.

يعكس CLI الأفعال العامة للطبقة:

- `resolve` ملموس ويطابق نتيجة واحدة.
- `find` هو فعل المطابقات المتعددة لأحرف البدل والاتحادات والمسندات والتوسيع الموضعي.
- `set` لا يقبل إلا المسارات الملموسة أو علامات الإدراج؛ وتُرفض أنماط أحرف البدل قبل الكتابة.

يوفّر Plugin الاختياري المضمّن `oc-path` الأمر `path`. فعّله قبل أول استخدام:

```bash
openclaw plugins enable oc-path
```

## لماذا تستخدمه

تتوزع حالة OpenClaw عبر ملفات markdown يحررها البشر، وإعدادات JSONC المعلّقة، وسجلات JSONL للإلحاق فقط. غالبا ما تحتاج سكربتات الصدفة والخطافات والوكلاء إلى قيمة صغيرة واحدة من تلك الملفات: مفتاح frontmatter، أو إعداد Plugin، أو حقل سجل، أو عنصر تعداد نقطي تحت قسم مسمّى.

يوفر `openclaw path` لهؤلاء المستدعين عنوانا مستقرا بدلا من grep أو تعبير نمطي أو محلل منفرد لكل نوع ملف. يمكن التحقق من مسار `oc://` نفسه، وحله، والبحث فيه، وتجربته دون كتابة، والكتابة إليه من الطرفية، مما يجعل الأتمتة الضيقة أسهل مراجعة وأكثر أمانا عند إعادة التشغيل. وهو مفيد خاصة عندما تريد تحديث ورقة واحدة مع الحفاظ على بقية تعليقات الملف ونهايات أسطره وتنسيقه المحيط.

استخدمه عندما يكون للشيء الذي تريده عنوان منطقي، لكن شكل الملف الفعلي يختلف:

- يريد خطاف قراءة إعداد واحد من JSONC معلّق دون فقدان التعليقات عند كتابة القيمة مرة أخرى.
- يريد سكربت صيانة العثور على كل حقل حدث مطابق في سجل JSONL دون تحميل السجل كله في محلل مخصص.
- تريد إضافة محرر الانتقال إلى قسم markdown أو عنصر تعداد نقطي حسب slug، ثم عرض السطر الدقيق الذي حُل إليه.
- يريد وكيل تجربة تعديل صغير لمساحة العمل دون كتابة قبل تطبيقه، مع إظهار البايتات المتغيرة في المراجعة.

غالبا لا تحتاج إلى `openclaw path` لتعديلات الملفات الكاملة العادية، أو ترحيلات الإعدادات الغنية، أو الكتابات الخاصة بالذاكرة. يجب أن تستخدم تلك أمر المالك أو Plugin المالك. `path` مخصص لعمليات الملفات الصغيرة القابلة للعنونة عندما يكون أمر طرفية قابل للتكرار أوضح من محلل مخصص آخر.

## كيف يُستخدم

اقرأ قيمة واحدة من ملف إعدادات يحرره البشر:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

عاين كتابة دون لمس القرص:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

اعثر على سجلات مطابقة في سجل JSONL للإلحاق فقط:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

عنون تعليمة في markdown حسب القسم والعنصر بدلا من رقم السطر:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

تحقق من مسار في CI أو سكربت تمهيدي قبل أن يقرأ السكربت أو يكتب:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

هذه الأوامر مصممة لتكون قابلة للنسخ إلى سكربتات الصدفة. استخدم `--json` عندما يحتاج المستدعي إلى خرج منظّم، و`--human` عندما يفحص شخص النتيجة.

## كيف يعمل

ينفذ `openclaw path` أربعة أشياء:

1. يحلل عنوان `oc://` إلى خانات: ملف، قسم، عنصر، حقل، وجلسة اختيارية.
2. يختار محوّل نوع الملف من امتداد الهدف (`.md` و`.jsonc` و`.jsonl` والأسماء البديلة ذات الصلة).
3. يحل الخانات مقابل AST الخاص بذلك النوع من الملفات: عناوين/عناصر markdown، أو مفاتيح كائنات/فهارس مصفوفات JSONC، أو سجلات أسطر JSONL.
4. بالنسبة إلى `set`، ينتج بايتات محررة عبر المحوّل نفسه بحيث تحتفظ الأجزاء غير الممسوسة من الملف بتعليقاتها ونهايات أسطرها وتنسيقها القريب حيث يدعم النوع ذلك.

يتطلب `resolve` و`set` هدفا ملموسا واحدا. `find` هو الفعل الاستكشافي: يوسع أحرف البدل والاتحادات والمسندات والترتيبيات إلى المطابقات الملموسة التي يمكنك فحصها قبل اختيار واحدة للكتابة.

## الأوامر الفرعية

| الأمر الفرعي              | الغرض                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | اطبع المطابقة الملموسة في المسار (أو "غير موجود").                       |
| `find <pattern>`        | عدّد المطابقات لمسار حرف بدل / اتحاد / مسند.                   |
| `set <oc-path> <value>` | اكتب ورقة أو هدف إدراج في مسار ملموس. يدعم `--dry-run`.   |
| `validate <oc-path>`    | تحليل فقط؛ اطبع التفصيل البنيوي (ملف / قسم / عنصر / حقل).      |
| `emit <file>`           | مرر ملفا ذهابا وإيابا عبر `parseXxx` + `emitXxx` (تشخيص أمانة البايتات). |

## الأعلام العامة

| العلم            | الغرض                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | حل خانة الملف مقابل هذا الدليل (الافتراضي: `process.cwd()`). |
| `--file <path>` | تجاوز المسار المحلول لخانة الملف (وصول مطلق).                |
| `--json`        | فرض خرج JSON (الافتراضي عندما لا يكون stdout طرفية TTY).                    |
| `--human`       | فرض خرج بشري (الافتراضي عندما يكون stdout طرفية TTY).                       |
| `--dry-run`     | (فقط مع `set`) اطبع البايتات التي ستُكتب دون كتابة.   |

## صياغة `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

قواعد الخانات: يتطلب `field` وجود `item`، ويتطلب `item` وجود `section`. عبر الخانات الأربع كلها:

- **المقاطع المقتبسة** — يبقى `"a/b.c"` سليما عبر فواصل `/` و`.`.
  المحتوى حرفي على مستوى البايت؛ ولا يُسمح بوجود `"` و`\` داخل الاقتباسات.
  خانة الملف واعية بالاقتباس أيضا: يعامل `oc://"skills/email-drafter"/Tools/$last`
  `skills/email-drafter` كمسار ملف واحد.
- **المسندات** — `[k=v]` و`[k!=v]` و`[k<v]` و`[k<=v]` و`[k>v]` و
  `[k>=v]`. تتطلب العمليات الرقمية تحويل الجانبين إلى أرقام منتهية.
- **الاتحادات** — يطابق `{a,b,c}` أي بديل من البدائل.
- **أحرف البدل** — `*` (مقطع فرعي واحد) و`**` (صفر أو أكثر،
  تكراري). يقبل `find` هذه؛ ويرفضها `resolve` و`set` باعتبارها
  ملتبسة.
- **الموضعي** — يحل `$last` إلى آخر فهرس / آخر مفتاح مُصرّح به.
- **الترتيبي** — `#N` للمطابقة N حسب ترتيب المستند.
- **علامات الإدراج** — `+` و`+key` و`+nnn` للإدراج بالمفتاح / بالفهرس
  (تُستخدم مع `set`).
- **نطاق الجلسة** — `?session=cron-daily` إلخ. مستقل عن تداخل الخانات.
  قيم الجلسة خام، ولا تُفك ترميزاتها المئوية؛ ولا يجوز أن تحتوي على
  محارف تحكم أو فواصل استعلام محجوزة (`?` و`&` و`%`).

تُرفض المحارف المحجوزة (`?` و`&` و`%`) خارج المقاطع المقتبسة أو المسندات أو الاتحادات. تُرفض محارف التحكم (U+0000-U+001F وU+007F) في أي مكان، بما في ذلك قيمة استعلام `session`.

يُضمن أن `formatOcPath(parseOcPath(path)) === path` للمسارات القياسية.
تُتجاهل معاملات الاستعلام غير القياسية باستثناء أول قيمة `session=` غير فارغة.

## العنونة حسب نوع الملف

| النوع       | نموذج العنونة                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | أقسام H2 حسب slug، وعناصر التعداد النقطي حسب slug أو `#N`، وfrontmatter عبر `[frontmatter]`.       |
| JSONC/JSON | مفاتيح الكائنات وفهارس المصفوفات؛ تقسم النقاط المقاطع الفرعية المتداخلة ما لم تكن مقتبسة.              |
| JSONL      | عناوين أسطر المستوى الأعلى (`L1` و`L2` و`$last`)، ثم نزول بأسلوب JSONC داخل السطر. |

يرجع `resolve` مطابقة منظّمة: `root` أو `node` أو `leaf` أو
`insertion-point`، مع رقم سطر يبدأ من 1. تظهر قيم الأوراق كنص
مع `leafType` بحيث يستطيع مؤلفو Plugin عرض المعاينات دون الاعتماد على
شكل AST الخاص بكل نوع.

## عقد التعديل

يكتب `set` هدفا ملموسا واحدا:

- قيم frontmatter في Markdown وحقول عناصر `- key: value` هي أوراق نصية.
  تضيف إدراجات Markdown أقساما أو مفاتيح frontmatter أو عناصر أقسام وتعرض
  شكلا قياسيا من markdown للملف المتغير.
- تحوّل كتابات أوراق JSONC القيمة النصية إلى نوع الورقة الحالي
  (`string` أو `number` منته أو `true`/`false` أو `null`). تحلل إدراجات
  كائنات ومصفوفات JSONC `<value>` كـ JSON وتستخدم مسار تحرير `jsonc-parser`
  لكتابات الأوراق العادية، مع الحفاظ على التعليقات والتنسيق القريب.
- تحوّل كتابات أوراق JSONL مثل JSONC داخل السطر. يستبدل السطر بالكامل
  والإلحاق يحللان `<value>` كـ JSON. يحافظ JSONL المعروض على نمط نهايات
  الأسطر الغالب في الملف LF/CRLF.

استخدم `--dry-run` قبل الكتابات المرئية للمستخدم عندما تكون البايتات الدقيقة مهمة. تحافظ الطبقة على خرج مطابق بالبايتات لجولات التحليل/الإصدار، لكن التعديل قد يقيّس المنطقة أو الملف المحرر حسب النوع.

## أمثلة

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

مزيد من أمثلة القواعد:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## وصفات حسب نوع الملف

تعمل الأفعال الخمسة نفسها عبر الأنواع؛ يوجّه مخطط العنونة التنفيذ حسب
امتداد الملف. تستخدم الأمثلة أدناه التجهيزات من وصف PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

يعنون المسند `[frontmatter]` كتلة YAML frontmatter؛ ويطابق `tools`
عنوان `## Tools` عبر slug، وتحتفظ أوراق العناصر بشكل slug الخاص بها
حتى عندما يستخدم المصدر شرطات سفلية (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

تمر تعديلات JSONC عبر `jsonc-parser`، لذلك تبقى التعليقات والمسافات البيضاء بعد
`set`. شغّل باستخدام `--dry-run` أولًا لفحص البايتات قبل الإيداع.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

كل سطر هو سجل. عالجه باستخدام المسند (`[event=action]`) عندما لا تعرف رقم
السطر، أو باستخدام مقطع `LN` القانوني عندما تعرفه.

## مرجع الأمر الفرعي

### `resolve <oc-path>`

اقرأ ورقة أو عقدة واحدة. تُرفض أحرف البدل — استخدم `find` لها.
يخرج بالقيمة `0` عند وجود تطابق، و`1` عند عدم وجود نتيجة بشكل سليم، و`2` عند
حدوث خطأ تحليل أو نمط مرفوض.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

يسرد كل تطابق لنمط يحتوي على حرف بدل / مسند / اتحاد. يخرج بالقيمة `0`
عند وجود تطابق واحد على الأقل، و`1` عند عدم وجود أي تطابق. تُرفض أحرف البدل في
موضع الملف مع `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — مرّر ملفًا محددًا
(الدعم المتعدد للملفات عبر المطابقة النمطية ميزة لاحقة).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

اكتب ورقة. استخدمه مع `--dry-run` لمعاينة البايتات التي كانت ستُكتب
دون لمس الملف. يخرج بالقيمة `0` عند نجاح الكتابة، و`1` إذا رفضت الطبقة
التحتية العملية (مثلًا، عند تفعيل حارس sentinel)، و`2` عند أخطاء التحليل.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

تنشئ علامة الإدراج `+key` الابن المسمى إذا لم يكن موجودًا بالفعل؛ ويعمل
`+nnn` و`+` المجرّد للإدراج المفهرس وإدراج الإلحاق على التوالي.

### `validate <oc-path>`

فحص تحليل فقط. لا يوجد وصول إلى نظام الملفات. مفيد عندما تريد تأكيد أن مسار
قالب ما مُشكّل جيدًا قبل استبدال المتغيرات، أو عندما تريد التفصيل البنيوي
لأغراض التصحيح:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

يخرج بالقيمة `0` عندما يكون صالحًا، و`1` عندما يكون غير صالح (مع `code` و
`message` منظّمين)، و`2` عند أخطاء الوسيطات.

### `emit <file>`

يمرّر ملفًا ذهابًا وإيابًا عبر محلل ومُصدِر كل نوع. يجب أن يكون الخرج مطابقًا
للمدخل على مستوى البايت في الملف السليم — يشير الاختلاف إلى خلل في المحلل أو
تفعيل sentinel. مفيد لتصحيح سلوك الطبقة التحتية على مدخلات واقعية.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## رموز الخروج

| الرمز | المعنى                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | نجاح. (`resolve` / `find`: تطابق واحد على الأقل. `set`: نجحت الكتابة.) |
| `1`  | لا يوجد تطابق، أو رُفض `set` من الطبقة التحتية (لا يوجد خطأ على مستوى النظام).      |
| `2`  | خطأ في الوسيطات أو التحليل.                                                   |

## وضع الإخراج

`openclaw path` واعٍ بوجود TTY: إخراج قابل للقراءة البشرية على الطرفية، وJSON عندما
يُمرّر stdout عبر أنبوب أو يُعاد توجيهه. يتجاوز `--json` و`--human`
الاكتشاف التلقائي.

## ملاحظات

- يكتب `set` البايتات عبر مسار emit الخاص بالطبقة التحتية، والذي يطبق حارس
  sentinel الخاص بالتنقيح تلقائيًا. تُرفض أي ورقة تحمل
  `__OPENCLAW_REDACTED__` (حرفيًا أو كسلسلة فرعية) وقت الكتابة.
- يستخدم تحليل JSONC وتعديلات الأوراق تبعية `jsonc-parser`
  المحلية للـ Plugin، لذلك تُحفظ التعليقات والتنسيقات في عمليات كتابة الأوراق
  العادية بدل المرور عبر مسار محلل/إعادة تصيير مكتوب يدويًا.
- لا يعرف `path` عن LKG. إذا كان الملف متعقبًا بواسطة LKG، فإن نداء
  observe التالي يقرر ما إذا كان سيرقّي / يستعيد. من المخطط إضافة `set --batch`
  للإعدادات المتعددة الذرية عبر دورة حياة ترقية/استعادة LKG إلى جانب
  طبقة LKG-recovery التحتية.

## ذات صلة

- [مرجع CLI](/ar/cli)
