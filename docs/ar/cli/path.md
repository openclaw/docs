---
read_when:
    - تريد قراءة أو كتابة عنصر طرفي داخل ملف في مساحة العمل من الطرفية
    - أنت تكتب نصوصًا برمجية للتعامل مع حالة مساحة العمل وتريد مخطط عنونة ثابتًا ومستقلًا عن النوع
    - أنت تصحّح أخطاء مسار `oc://` (تحقق من صحة الصياغة، وانظر ما الذي يُحلّ إليه)
summary: مرجع CLI لـ `openclaw path` (افحص ملفات مساحة العمل وعدّلها عبر مخطط العنونة `oc://`)
title: المسار
x-i18n:
    generated_at: "2026-06-27T17:23:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

وصول إلى الصدفة يوفّره Plugin إلى طبقة العنونة `oc://`: مخطط مسارات واحد
موجّه حسب النوع لفحص وتحرير ملفات مساحة العمل القابلة للعنونة
(markdown، jsonc، jsonl، yaml/yml/lobster). يستخدمه المستضيفون ذاتيًا ومؤلفو
Plugin وامتدادات المحرر لقراءة موقع ضيق أو العثور عليه أو تحديثه
من دون بناء محللات مخصصة لكل ملف.

يعكس CLI الأفعال العامة للطبقة:

- `resolve` محدد وذو تطابق واحد.
- `find` هو فعل التطابقات المتعددة لأحرف البدل والاتحادات والمسندات والتوسيع
  الموضعي.
- `set` لا يقبل إلا المسارات المحددة أو علامات الإدراج؛ وتُرفض أنماط أحرف
  البدل قبل الكتابة.

يوفّر `path` من خلال Plugin الاختياري المضمّن `oc-path`. فعّله قبل
أول استخدام:

```bash
openclaw plugins enable oc-path
```

## لماذا تستخدمه

تتوزع حالة OpenClaw عبر ملفات markdown محررة يدويًا، وإعدادات JSONC المعلّقة،
وسجلات JSONL الإلحاقية فقط، وملفات سير العمل/المواصفات بصيغة YAML. غالبًا ما
تحتاج سكربتات الصدفة والخطافات والوكلاء إلى قيمة صغيرة واحدة من تلك الملفات:
مفتاح frontmatter، أو إعداد Plugin، أو حقل سجل، أو خطوة YAML، أو عنصر تعداد
نقطي تحت قسم مسمّى.

يمنح `openclaw path` هؤلاء المستدعين عنوانًا ثابتًا بدلًا من grep أو regex أو
محلل مخصص لكل نوع ملف. يمكن التحقق من مسار `oc://` نفسه وحله والبحث فيه
وتجربته دون كتابة وكتابته من الطرفية، ما يجعل الأتمتة الضيقة أسهل في المراجعة
وأكثر أمانًا عند إعادة تشغيلها. وهو مفيد خصوصًا عندما تريد تحديث ورقة واحدة مع
الحفاظ على بقية تعليقات الملف ونهايات الأسطر والتنسيق المحيط.

استخدمه عندما يكون للشيء الذي تريده عنوان منطقي، لكن شكل الملف الفعلي يختلف:

- يريد خطاف قراءة إعداد واحد من JSONC معلّق من دون فقدان التعليقات
  عند كتابة القيمة مرة أخرى.
- يريد سكربت صيانة العثور على كل حقل حدث مطابق في سجل JSONL
  من دون تحميل السجل كله في محلل مخصص.
- يريد امتداد محرر الانتقال إلى قسم markdown أو عنصر تعداد نقطي بحسب
  slug، ثم عرض السطر الدقيق الذي حُل إليه.
- يريد وكيل تجربة تعديل صغير جدًا في مساحة العمل دون كتابة قبل تطبيقه، مع ظهور
  البايتات المتغيرة في المراجعة.

غالبًا لا تحتاج إلى `openclaw path` لتعديلات الملفات الكاملة العادية، أو ترحيلات
الإعدادات الغنية، أو عمليات الكتابة الخاصة بالذاكرة. يجب أن تستخدم تلك أمر
المالك أو Plugin. `path` مخصص لعمليات الملفات الصغيرة القابلة للعنونة عندما
يكون أمر طرفية قابل للتكرار أوضح من محلل مخصص آخر.

## كيفية استخدامه

اقرأ قيمة واحدة من ملف إعدادات محرر يدويًا:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

اعرض معاينة كتابة من دون لمس القرص:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

اعثر على السجلات المطابقة في سجل JSONL إلحاقي فقط:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

عنون تعليمة في markdown بحسب القسم والعنصر بدلًا من رقم السطر:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

تحقق من مسار في CI أو سكربت فحص تمهيدي قبل أن يقرأ السكربت أو يكتب:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

هذه الأوامر معدّة لتكون قابلة للنسخ إلى سكربتات الصدفة. استخدم `--json` عندما
يحتاج المستدعي إلى مخرجات منظمة و`--human` عندما يفحص شخص النتيجة.

## كيف يعمل

ينفذ `openclaw path` أربعة أشياء:

1. يحلل عنوان `oc://` إلى خانات: الملف، والقسم، والعنصر، والحقل،
   والجلسة الاختيارية.
2. يختار محوّل نوع الملف من امتداد الهدف (`.md`، و`.jsonc`،
   و`.jsonl`، و`.yaml`، و`.yml`، و`.lobster`، والأسماء البديلة المرتبطة).
3. يحل الخانات مقابل AST الخاص بذلك النوع من الملفات: عناوين/عناصر markdown،
   أو مفاتيح كائنات/فهارس مصفوفات JSONC، أو سجلات أسطر JSONL، أو عقد
   الخرائط/التسلسلات في YAML.
4. بالنسبة إلى `set`، يصدر البايتات المعدّلة عبر المحوّل نفسه بحيث تحتفظ
   الأجزاء غير الملموسة من الملف بتعليقاتها ونهايات أسطرها وتنسيقها القريب
   حيث يدعم النوع ذلك.

يتطلب `resolve` و`set` هدفًا محددًا واحدًا. أما `find` فهو فعل استكشافي:
يوسّع أحرف البدل والاتحادات والمسندات والترتيبيات إلى التطابقات المحددة التي
يمكنك فحصها قبل اختيار واحد للكتابة.

## الأوامر الفرعية

| الأمر الفرعي            | الغرض                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | اطبع التطابق المحدد عند المسار (أو "غير موجود").                            |
| `find <pattern>`        | عدّد التطابقات لمسار حرف بدل / اتحاد / مسند.                                |
| `set <oc-path> <value>` | اكتب ورقة أو هدف إدراج عند مسار محدد. يدعم `--dry-run`.                     |
| `validate <oc-path>`    | تحليل فقط؛ اطبع التفكيك البنيوي (ملف / قسم / عنصر / حقل).                  |
| `emit <file>`           | مرّر ملفًا ذهابًا وإيابًا عبر `parseXxx` + `emitXxx` (تشخيص وفاء البايتات). |

## الأعلام العامة

| العلم           | الغرض                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| `--cwd <dir>`   | حل خانة الملف مقابل هذا الدليل (الافتراضي: `process.cwd()`).          |
| `--file <path>` | تجاوز المسار المحلول لخانة الملف (وصول مطلق).                         |
| `--json`        | فرض مخرجات JSON (الافتراضي عندما لا يكون stdout عبارة عن TTY).        |
| `--human`       | فرض مخرجات بشرية (الافتراضي عندما يكون stdout عبارة عن TTY).          |
| `--dry-run`     | (على `set` فقط) اطبع البايتات التي كانت ستُكتب من دون كتابة.          |
| `--diff`        | (مع `set --dry-run`) اطبع فرقًا موحدًا بدلًا من البايتات الكاملة.     |

## صياغة `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

قواعد الخانات: يتطلب `field` وجود `item`، ويتطلب `item` وجود `section`. عبر
الخانات الأربع كلها:

- **المقاطع المقتبسة** — يبقى `"a/b.c"` سالمًا عبر فواصل `/` و`.`.
  المحتوى حرفي على مستوى البايت؛ لا يُسمح بوجود `"` و`\` داخل علامات الاقتباس.
  خانة الملف واعية بالاقتباس أيضًا: يعامل `oc://"skills/email-drafter"/Tools/$last`
  `skills/email-drafter` كمسار ملف واحد.
- **المسندات** — `[k=v]`، و`[k!=v]`، و`[k<v]`، و`[k<=v]`، و`[k>v]`،
  و`[k>=v]`. تتطلب العمليات الرقمية أن يتحول الطرفان إلى أعداد منتهية.
- **الاتحادات** — `{a,b,c}` يطابق أيًا من البدائل.
- **أحرف البدل** — `*` (مقطع فرعي واحد) و`**` (صفر أو أكثر،
  تكراري). يقبلها `find`؛ ويرفضها `resolve` و`set` لأنها
  ملتبسة.
- **الموضعي** — يُحل `$first` / `$last` إلى الفهرس الأول / الأخير أو
  المفتاح المعلن.
- **الترتيبي** — `#N` للتطابق رقم N بحسب ترتيب المستند.
- **علامات الإدراج** — `+`، و`+key`، و`+nnn` للإدراج ذي المفتاح / ذي الفهرس
  (استخدمها مع `set`).
- **نطاق الجلسة** — `?session=cron-daily` وما شابه. مستقل عن
  تداخل الخانات. قيم الجلسة خام، وليست مفكوكة ترميز النسبة المئوية؛ ولا يجوز أن
  تحتوي على محارف تحكم أو فواصل استعلام محجوزة (`?`، و`&`، و`%`).

تُرفض المحارف المحجوزة (`?`، و`&`، و`%`) خارج المقاطع المقتبسة أو المسندة أو
المتحدة. تُرفض محارف التحكم (U+0000-U+001F، U+007F) في أي مكان، بما في ذلك
قيمة استعلام `session`.

يُضمن أن `formatOcPath(parseOcPath(path)) === path` للمسارات القياسية.
تُتجاهل معاملات الاستعلام غير القياسية باستثناء أول قيمة `session=` غير فارغة.

## العنونة حسب نوع الملف

| النوع             | نموذج العنونة                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | أقسام H2 بحسب slug، وعناصر التعداد بحسب slug أو `#N`، وfrontmatter عبر `[frontmatter]`.             |
| JSONC/JSON        | مفاتيح الكائنات وفهارس المصفوفات؛ تقسم النقاط المقاطع الفرعية المتداخلة ما لم تكن مقتبسة.          |
| JSONL             | عناوين الأسطر العليا (`L1`، و`L2`، و`$first`، و`$last`)، ثم نزول بأسلوب JSONC داخل السطر.          |
| YAML/YML/.lobster | مفاتيح الخرائط وفهارس التسلسلات؛ تُعالج التعليقات ونمط التدفق عبر API مستند YAML.                  |

يعيد `resolve` تطابقًا منظمًا: `root`، أو `node`، أو `leaf`، أو
`insertion-point`، مع رقم سطر يبدأ من 1. تُعرض قيم الأوراق كنص
إضافة إلى `leafType` حتى يتمكن مؤلفو Plugin من عرض المعاينات من دون الاعتماد
على شكل AST الخاص بكل نوع.

## عقد التعديل

يكتب `set` هدفًا محددًا واحدًا:

- قيم frontmatter في Markdown وحقول العناصر `- key: value` هي أوراق نصية.
  تُلحق إدراجات Markdown الأقسام أو مفاتيح frontmatter أو عناصر الأقسام
  وتعرض شكل markdown قياسيًا للملف المتغير.
- تُحوّل كتابات أوراق JSONC قيمة السلسلة إلى نوع الورقة الحالي
  (`string`، أو `number` منته، أو `true`/`false`، أو `null`). استخدم
  `--value-json` عندما يجب أن يحلل استبدال ورقة JSONC/JSON/JSONL
  `<value>` كـ JSON وقد يغيّر الشكل، مثل استبدال اختصار SecretRef النصي
  بكائن. تحلل إدراجات كائنات ومصفوفات JSONC `<value>` كـ JSON وتستخدم
  مسار تحرير `jsonc-parser` لكتابات الأوراق العادية، مع الحفاظ على التعليقات
  والتنسيق القريب.
- تُحوّل كتابات أوراق JSONL مثل JSONC داخل السطر. يحلل استبدال السطر الكامل
  والإلحاق `<value>` كـ JSON. يحافظ JSONL المعروض على اصطلاح نهايات الأسطر
  السائد في الملف LF/CRLF.
- تُحوّل كتابات أوراق YAML إلى نوع العدد القياسي الحالي (`string`، أو
  `number` منته، أو `true`/`false`، أو `null`). تستخدم إدراجات YAML
  API المستند الخاص بحزمة `yaml` المضمّنة لتحديثات الخرائط/التسلسلات.
  تُرفض مستندات YAML المشوهة ذات أخطاء المحلل قبل التعديل مع `parse-error`.

استخدم `--dry-run` قبل عمليات الكتابة المرئية للمستخدم عندما تهم البايتات
الدقيقة. تحفظ الطبقة مخرجات مطابقة على مستوى البايت في عمليات parse/emit ذهابًا
وإيابًا، لكن التعديل قد يقيس منطقة التحرير أو الملف بحسب النوع.
أضف `--diff` عندما تريد المعاينة كرقعة قبل/بعد مركزة بدلًا من الملف المعروض
بالكامل.

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

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

مزيد من أمثلة القواعد:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

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

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

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

تعمل الأفعال الخمسة نفسها عبر الأنواع؛ يوجّه مخطط العنونة حسب امتداد
الملف. تستخدم الأمثلة أدناه التجهيزات من وصف PR.

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

يوجّه المحدِّد `[frontmatter]` إلى كتلة واجهة YAML الأمامية؛ ويطابق `tools`
عنوان `## Tools` عبر slug، وتحتفظ أوراق العناصر بصيغة slug الخاصة بها
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

تمر تعديلات JSONC عبر `jsonc-parser`، لذلك تبقى التعليقات والمسافات البيضاء
بعد تنفيذ `set`. شغّل باستخدام `--dry-run` أولاً لفحص البايتات قبل الاعتماد.

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

كل سطر هو سجل. عنون باستخدام المحدِّد (`[event=action]`) عندما لا تعرف
رقم السطر، أو باستخدام مقطع `LN` المعياري عندما تعرفه.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

يستخدم YAML واجهة `Document` من حزمة `yaml` بدلاً من محلل مكتوب يدوياً،
لذلك تحفظ دورات التحليل/الإصدار العادية التعليقات وشكل التأليف، بينما
تستخدم المسارات المحلولة نموذج مفتاح الخريطة / فهرس التسلسل نفسه كما في
JSONC. يتعامل المحوّل نفسه مع ملفات `.yaml` و`.yml` و`.lobster`.

## مرجع الأوامر الفرعية

### `resolve <oc-path>`

اقرأ ورقة أو عقدة واحدة. تُرفض أحرف البدل — استخدم `find` لها.
يخرج بالرمز `0` عند وجود تطابق، و`1` عند عدم وجود تطابق نظيف، و`2` عند
خطأ تحليل أو نمط مرفوض.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

عدّد كل تطابق لنمط حرف بدل / محدِّد / اتحاد. يخرج بالرمز `0`
عند وجود تطابق واحد على الأقل، و`1` عند عدم وجود أي تطابق. تُرفض أحرف
البدل في خانة الملف مع `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — مرّر ملفاً
محدداً (مطابقة الأنماط متعددة الملفات ميزة لاحقة).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

اكتب ورقة. اقرنه مع `--dry-run` لمعاينة البايتات التي ستُكتب دون لمس
الملف. أضف `--diff` لمعاينة فرق موحّد. يخرج بالرمز `0` عند نجاح الكتابة،
و`1` إذا رفضت الطبقة التحتية العملية (مثلاً عند إصابة حارس sentinel)، و`2`
عند أخطاء التحليل.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

تنشئ علامة الإدراج `+key` الابن المسمى إذا لم يكن موجوداً بالفعل؛ وتعمل
`+nnn` و`+` المجردة للإدراج المفهرس والإلحاق على التوالي.

### `validate <oc-path>`

فحص تحليل فقط. لا يوجد وصول إلى نظام الملفات. مفيد عندما تريد تأكيد أن
مسار قالب حسن التكوين قبل استبدال المتغيرات، أو عندما تريد التفكيك البنيوي
للتصحيح:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

يخرج بالرمز `0` عندما يكون صالحاً، و`1` عندما يكون غير صالح (مع `code` و
`message` منظّمين)، و`2` عند أخطاء الوسائط.

### `emit <file>`

مرّر ملفاً ذهاباً وإياباً عبر المحلل والمُصدِر الخاصين بكل نوع. يجب أن
يكون الخرج مطابقاً للمدخل بالبايت في الملف السليم — يشير الاختلاف إلى خطأ
في المحلل أو إصابة sentinel. مفيد لتصحيح سلوك الطبقة التحتية على مدخلات
واقعية.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## رموز الخروج

| الرمز | المعنى                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | نجاح. (`resolve` / `find`: تطابق واحد على الأقل. `set`: نجحت الكتابة.) |
| `1`  | لا يوجد تطابق، أو رفضت الطبقة التحتية `set` (لا يوجد خطأ على مستوى النظام). |
| `2`  | خطأ في الوسائط أو التحليل.                                                   |

## وضع الخرج

يدرك `openclaw path` وجود TTY: خرج قابل للقراءة البشرية على الطرفية، وJSON
عندما يُمرَّر stdout عبر أنبوب أو يُعاد توجيهه. يتجاوز `--json` و`--human`
الاكتشاف التلقائي.

## ملاحظات

- يكتب `set` البايتات عبر مسار الإصدار الخاص بالطبقة التحتية، الذي يطبّق
  حارس sentinel للتنقيح تلقائياً. تُرفض عند وقت الكتابة أي ورقة تحمل
  `__OPENCLAW_REDACTED__` (حرفياً أو كسلسلة فرعية).
- يستخدم تحليل JSONC وتعديلات الأوراق اعتمادية `jsonc-parser` المحلية في
  Plugin، لذلك تُحفظ التعليقات والتنسيقات في كتابات الأوراق العادية بدلاً
  من المرور عبر مسار محلل/إعادة تصيير مكتوب يدوياً.
- لا يعرف `path` عن LKG. إذا كان الملف متتبعاً بواسطة LKG، فإن استدعاء
  المراقبة التالي يقرر ما إذا كان سيرقّي / يستعيد. من المخطط إضافة
  `set --batch` للتعيين المتعدد الذري عبر دورة حياة ترقية/استعادة LKG
  إلى جانب الطبقة التحتية لاستعادة LKG.

## ذو صلة

- [مرجع CLI](/ar/cli)
