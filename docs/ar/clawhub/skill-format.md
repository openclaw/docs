---
read_when:
    - نشر Skills
    - تصحيح أخطاء فشل النشر
summary: تنسيق مجلد Skills، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-07-16T13:40:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق Skill

## على القرص

Skill هو مجلد.

المطلوب:

- `SKILL.md` (أو `skill.md`؛ ويُقبل أيضًا `skills.md` القديم)

اختياري:

- أي ملفات داعمة _نصية_ (راجع «الملفات المسموح بها»)
- `.clawhubignore` (أنماط التجاهل عند النشر، و`.clawdhubignore` القديم)
- `.gitignore` (يُعتد به أيضًا)

## الاستيراد من GitHub

أداة الاستيراد من GitHub على الويب أكثر صرامة من النشر/المزامنة محليًا. فهي لا تكتشف إلا ملفات
`SKILL.md` أو ملفات `skills.md` القديمة في المستودعات العامة غير المتفرعة التي يملكها
حساب GitHub المسجّل دخوله. ولا تستورد المستودعات الخاصة أو التفرعات أو
المستودعات المؤرشفة/المعطّلة أو المستودعات العامة التابعة لجهات خارجية.

بيانات تثبيت التعريف محليًا (تكتبها CLI):

- `<skill>/.clawhub/origin.json` (أو `.clawdhub` القديم)

حالة التثبيت في دليل العمل (تكتبها CLI):

- `<workdir>/.clawhub/lock.json` (أو `.clawdhub` القديم)

## `SKILL.md`

- Markdown مع frontmatter اختياري بتنسيق YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص لـ Skill في واجهة المستخدم/البحث.

بالنسبة إلى Agent Skills القابلة للنقل، يجب أن يطابق `name` الدليل الأب وأن يستخدم
من 1 إلى 64 حرفًا صغيرًا أو رقمًا أو شرطة. يحتفظ ClawHub بالمعرّف المختصر القابل للتوجيه واسم
العرض في الفهرس منفصلين، لذا تظل الأسماء الحالية الواردة من عملاء آخرين
قابلة للنشر ولا يُعاد كتابتها بصمت. قد تختصر قوائم الفهرس الأسماء الطويلة
مرئيًا من دون تغيير الاسم المخزّن.

## بيانات تعريف frontmatter

تُعلن بيانات تعريف Skill في frontmatter بتنسيق YAML أعلى ملف `SKILL.md`. ويُطلع هذا السجل (وتحليل الأمان) على ما تحتاج إليه Skill لتعمل.

### frontmatter الأساسي

```yaml
---
name: my-skill
description: ملخص قصير لما تفعله Skill هذه.
version: 1.0.0
---
```

### بيانات تعريف وقت التشغيل (`metadata.openclaw`)

أعلن متطلبات وقت التشغيل الخاصة بـ Skill ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

```yaml
---
name: my-skill
description: إدارة المهام عبر Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل تشغيل Skill. واستخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### المرجع الكامل للحقول

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها Skill.                                                                                           |
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب تثبيتها جميعًا.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يتوفر واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرؤها Skill.                                                                                                          |
| `primaryEnv`       | `string`   | متغير بيئة بيانات الاعتماد الرئيسي لـ Skill.                                                                                                  |
| `envVars`          | `array`    | إعلانات متغيرات البيئة مع `name` و`required` الاختياري و`description` الاختياري. اضبط `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كان `true`، فتكون Skill نشطة دائمًا (ولا يلزم تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء Skill.                                                                                                         |
| `emoji`            | `string`   | رمز emoji لعرض Skill.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو وثائق Skill.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]` و`["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفات Plugin الخاص بـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفات إعداد Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا احتاجت Skill إلى تثبيت تبعيات، فأعلن عنها في مصفوفة `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

أنواع التثبيت المدعومة: `brew`، `node`، `go`، `uv`.

### متغيرات البيئة الاختيارية

أعلن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` واضبط `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن Skill لا يمكنها العمل من دونها.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: رمز Todoist API المستخدم للطلبات المصادَق عليها.
      - name: TODOIST_PROJECT_ID
        required: false
        description: معرّف المشروع الافتراضي الاختياري عندما لا يحدد المستخدم واحدًا.
```

### سبب أهمية ذلك

يتحقق تحليل الأمان في ClawHub من أن ما تعلن عنه Skill يطابق ما تفعله فعليًا. إذا كانت شيفرتك تشير إلى `TODOIST_API_KEY` لكن frontmatter لا يعلنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيشير التحليل إلى عدم تطابق في بيانات التعريف. يساعد الحفاظ على دقة الإعلانات Skill على اجتياز المراجعة، ويساعد المستخدمين على فهم ما يثبتونه.

### مثال: frontmatter كامل

```yaml
---
name: todoist-cli
description: إدارة مهام Todoist ومشاريعه وتسمياته من سطر الأوامر.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: رمز Todoist API.
      - name: TODOIST_PROJECT_ID
        required: false
        description: معرّف المشروع الافتراضي الاختياري.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## الملفات المسموح بها

لا يقبل النشر إلا الملفات «النصية».

- توجد قائمة امتدادات السماح في `packages/schema/src/textFiles.ts` ‏(`TEXT_FILE_EXTENSIONS`).
- يستمر فحص ملفات البرامج النصية بعد الرفع؛ وتُقبل ملفات PowerShell ذات الامتدادات `.ps1` و`.psm1` و`.psd1` كنصوص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنصوص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (من جانب الخادم):

- إجمالي حجم الحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا من غير ملفات `.md` (حد يُطبّق بأفضل جهد).

## المعرّفات المختصرة

- تُشتق افتراضيًا من اسم المجلد.
- يجب أن تطابق نطاقات الحزم معرّف ناشر ClawHub تمامًا. يمكن أن تستخدم معرّفات الناشرين أحرفًا صغيرة وأرقامًا وشرطات ونقاطًا وشرطات سفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون المعرّفات المختصرة للحزم بأحرف صغيرة وآمنة لـ npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` عادةً.

## الترخيص

- تُرخَّص جميع Skills المنشورة على ClawHub بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يُشترط ذكر المصدر.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ إذ لا يدعم ClawHub تجاوزات الترخيص لكل Skill.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة أو التسعير لكل Skill أو جدران الدفع أو مشاركة الإيرادات.
- لا تضف بيانات تعريف للتسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق Skill ولن تجعل Skill المنشورة مدفوعة.
- إذا كانت Skill تتكامل مع خدمة مدفوعة تابعة لجهة خارجية، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات Skill وإعلانات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
