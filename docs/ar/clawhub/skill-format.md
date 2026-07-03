---
read_when:
    - نشر Skills
    - استكشاف أخطاء فشل النشر وإصلاحها
summary: تنسيق مجلد Skill، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-07-03T09:36:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق المهارة

## على القرص

المهارة هي مجلد.

مطلوب:

- `SKILL.md` (أو `skill.md`؛ يُقبل أيضًا `skills.md` القديم)

اختياري:

- أي ملفات _نصية_ داعمة (راجع "الملفات المسموح بها")
- `.clawhubignore` (أنماط التجاهل للنشر، والقديم `.clawdhubignore`)
- `.gitignore` (يُحترم أيضًا)

## الاستيراد من GitHub

مستورد GitHub عبر الويب أكثر صرامة من النشر/المزامنة المحليين. فهو يكتشف فقط
ملفات `SKILL.md` أو الملفات القديمة `skills.md` في المستودعات العامة غير المتفرعة المملوكة
لحساب GitHub الذي تم تسجيل الدخول به. لا يستورد المستودعات الخاصة، أو التفريعات،
أو المستودعات المؤرشفة/المعطلة، أو المستودعات العامة التابعة لجهات خارجية.

بيانات تعريف التثبيت المحلي (تكتبها CLI):

- `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

حالة تثبيت دليل العمل (تكتبها CLI):

- `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بتنسيق YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص للمهارة في واجهة المستخدم/البحث.

## بيانات تعريف frontmatter

تُعلن بيانات تعريف المهارة في frontmatter بتنسيق YAML في أعلى ملف `SKILL.md`. يخبر هذا السجل (وتحليل الأمان) بما تحتاجه مهارتك للتشغيل.

### frontmatter الأساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات تعريف وقت التشغيل (`metadata.openclaw`)

أعلن متطلبات وقت تشغيل مهارتك ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل تشغيل المهارة. استخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها مهارتك.                                                                                           |
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب أن تكون جميعها مثبتة.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعدادات التي تقرؤها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي للاعتماد الخاص بمهارتك.                                                                                                  |
| `envVars`          | `array`    | تصريحات متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. اضبط `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كان `true`، تكون المهارة نشطة دائمًا (لا يلزم تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | رمز emoji المعروض للمهارة.                                                                                                                 |
| `homepage`         | `string`   | URL للصفحة الرئيسية أو الوثائق الخاصة بالمهارة.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت الاعتماديات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin لـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفة إعدادات Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كانت مهارتك تحتاج إلى اعتماديات مثبتة، فأعلنها في مصفوفة `install`:

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

أعلن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` واضبط `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` تعني أن المهارة لا يمكن تشغيلها بدونها.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### لماذا هذا مهم

يتحقق تحليل الأمان في ClawHub من أن ما تعلنه مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لديك لا يعلنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيشير التحليل إلى عدم تطابق في بيانات التعريف. يساعد الحفاظ على دقة التصريحات مهارتك على اجتياز المراجعة ويساعد المستخدمين على فهم ما يثبتونه.

### مثال: frontmatter كامل

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
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
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## الملفات المسموح بها

لا يقبل النشر إلا الملفات "النصية".

- قائمة السماح بالامتدادات موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- لا تزال ملفات السكربت تُفحص بعد الرفع؛ وتُقبل ملفات PowerShell ذات الامتدادات `.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (من جهة الخادم):

- إجمالي حجم الحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد بأفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تطابق نطاقات الحزمة اسم ناشر ClawHub تمامًا. يمكن أن تستخدم أسماء الناشرين أحرفًا صغيرة، وأرقامًا، وواصلات، ونقاطًا، وشرطات سفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون slugs الحزم بأحرف صغيرة وآمنة لـ npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## تعيين الإصدارات + الوسوم

- كل عملية نشر تنشئ إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` عادةً.

## الترخيص

- جميع Skills المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يلزم الإسناد.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل مهارة.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة، أو التسعير لكل مهارة، أو جدران الدفع، أو مشاركة الإيرادات.
- لا تضف بيانات تعريف التسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة مدفوعة تابعة لجهة خارجية، فوثق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وتصريحات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
