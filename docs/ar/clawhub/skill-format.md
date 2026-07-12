---
read_when:
    - نشر Skills
    - تصحيح أخطاء النشر وإصلاحها
summary: تنسيق مجلد Skills، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-07-12T05:39:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق Skills

## على القرص

Skills هي مجلد.

مطلوب:

- `SKILL.md` (أو `skill.md`؛ ويُقبل أيضًا `skills.md` القديم)

اختياري:

- أي ملفات داعمة _نصية_ (راجع «الملفات المسموح بها»)
- `.clawhubignore` (أنماط التجاهل عند النشر، والاسم القديم `.clawdhubignore`)
- `.gitignore` (يُعتد به أيضًا)

## الاستيراد من GitHub

أداة الاستيراد من GitHub عبر الويب أكثر صرامة من النشر/المزامنة محليًا. فهي لا تكتشف إلا ملفات
`SKILL.md` أو ملفات `skills.md` القديمة في المستودعات العامة غير المتفرعة التي يملكها
حساب GitHub المسجَّل دخوله. ولا تستورد المستودعات الخاصة أو التفرعات أو
المستودعات المؤرشفة/المعطّلة أو المستودعات العامة التابعة لجهات خارجية.

بيانات التثبيت الوصفية المحلية (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (الاسم القديم `.clawdhub`)

حالة التثبيت في دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (الاسم القديم `.clawdhub`)

## `SKILL.md`

- Markdown مع مقدمة YAML اختيارية.
- يستخرج الخادم البيانات الوصفية من المقدمة أثناء النشر.
- تُستخدم `description` كملخص لـ Skills في واجهة المستخدم/البحث.

بالنسبة إلى Agent Skills القابلة للنقل، ينبغي أن تطابق `name` الدليل الأب وأن تستخدم
من 1 إلى 64 حرفًا صغيرًا أو رقمًا أو شرطة. يفصل ClawHub بين المعرّف القابل للتوجيه
واسم العرض في الفهرس، لذلك تظل الأسماء الحالية من العملاء الآخرين
قابلة للنشر ولا يُعاد كتابتها تلقائيًا دون تنبيه. قد تختصر قوائم الفهرس الأسماء الطويلة
بصريًا من دون تغيير الاسم المخزّن.

## البيانات الوصفية للمقدمة

يُعلن عن البيانات الوصفية لـ Skills في مقدمة YAML أعلى ملف `SKILL.md`. ويُعلم هذا السجل (وتحليل الأمان) بما تحتاج إليه Skills للتشغيل.

### المقدمة الأساسية

```yaml
---
name: my-skill
description: ملخص قصير لما تفعله Skills هذه.
version: 1.0.0
---
```

### البيانات الوصفية لبيئة التشغيل (`metadata.openclaw`)

أعلن عن متطلبات بيئة تشغيل Skills ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot` و`metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل تشغيل Skills. استخدم `envVars` عندما تحتاج إلى بيانات وصفية لكل متغير، بما في ذلك المتغيرات الاختيارية التي تحمل `required: false`.

### المرجع الكامل للحقول

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها Skills.                                                                                           |
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب تثبيتها جميعًا.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يتوفر واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرؤها Skills.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي لبيانات اعتماد Skills.                                                                                                  |
| `envVars`          | `array`    | تعريفات متغيرات البيئة التي تتضمن `name` و`required` اختياريًا و`description` اختياريًا. اضبط `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت القيمة `true`، تكون Skills نشطة دائمًا (لا يلزم تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء Skills.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري لعرض Skills.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو وثائق Skills.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]` و`["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفات Plugin لـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفات إعداد Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كانت Skills تحتاج إلى تثبيت تبعيات، فأعلن عنها في مصفوفة `install`:

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

أنواع التثبيت المدعومة: `brew` و`node` و`go` و`uv`.

### متغيرات البيئة الاختيارية

أعلن عن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` واضبط `required: false`. لا تضف الإدخالات الاختيارية إلى `requires.env`، لأن `requires.env` يعني تعذّر تشغيل Skills من دونها.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: رمز Todoist API المميز المستخدم للطلبات المصادق عليها.
      - name: TODOIST_PROJECT_ID
        required: false
        description: معرّف المشروع الافتراضي الاختياري عندما لا يحدد المستخدم معرّفًا.
```

### أهمية ذلك

يتحقق تحليل الأمان في ClawHub من تطابق ما تعلن عنه Skills مع ما تفعله فعليًا. إذا كانت شيفرتك تشير إلى `TODOIST_API_KEY` لكن مقدمتك لا تعلن عنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيرصد التحليل عدم تطابق في البيانات الوصفية. يساعد الحفاظ على دقة التصريحات Skills على اجتياز المراجعة ويساعد المستخدمين على فهم ما يثبتونه.

### مثال: مقدمة كاملة

```yaml
---
name: todoist-cli
description: إدارة مهام Todoist ومشروعاته وتسمياته من سطر الأوامر.
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
        description: رمز Todoist API المميز.
      - name: TODOIST_PROJECT_ID
        required: false
        description: معرّف المشروع الافتراضي الاختياري.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## الملفات المسموح بها

لا يقبل النشر سوى الملفات «النصية».

- توجد قائمة الامتدادات المسموح بها في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- تظل ملفات البرامج النصية خاضعة للفحص بعد الرفع؛ وتُقبل ملفات PowerShell ذات الامتدادات `.ps1` و`.psm1` و`.psd1` كنصوص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنصوص؛ إضافةً إلى قائمة صغيرة مسموح بها (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (من جهة الخادم):

- الحجم الإجمالي للحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` وما يصل إلى نحو 40 ملفًا لا يحمل الامتداد `.md` (حد تقريبي حسب أفضل جهد).

## المعرّفات المختصرة

- تُشتق افتراضيًا من اسم المجلد.
- يجب أن تطابق نطاقات الحزم معرّف ناشر ClawHub تمامًا. يمكن أن تستخدم معرّفات الناشرين الأحرف الصغيرة والأرقام والشرطات والنقاط والشرطات السفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون المعرّفات المختصرة للحزم بأحرف صغيرة وآمنة للاستخدام مع npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` عادةً.

## الترخيص

- تُرخّص جميع Skills المنشورة على ClawHub بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك للأغراض التجارية.
- لا يُشترط ذكر المصدر.
- لا تضف شروط ترخيص متعارضة إلى `SKILL.md`؛ إذ لا يدعم ClawHub تجاوز الترخيص لكل Skills على حدة.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة أو التسعير لكل Skills على حدة أو جدران الدفع أو مشاركة الإيرادات.
- لا تضف بيانات وصفية للتسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق Skills ولن تجعل Skills المنشورة مدفوعة.
- إذا كانت Skills تتكامل مع خدمة مدفوعة تابعة لجهة خارجية، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات Skills وتعريفات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
