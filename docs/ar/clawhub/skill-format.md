---
read_when:
    - نشر Skills
    - استكشاف أخطاء فشل النشر/المزامنة وإصلاحها
summary: تنسيق مجلد Skills، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-05-13T05:33:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق المهارة

## على القرص

المهارة هي مجلد.

مطلوب:

- `SKILL.md` (أو `skill.md`)

اختياري:

- أي ملفات داعمة _نصية_ (راجع "الملفات المسموح بها")
- `.clawhubignore` (أنماط التجاهل للنشر/المزامنة، القديمة `.clawdhubignore`)
- `.gitignore` (تُحترم أيضًا)

بيانات تعريف التثبيت المحلي (تكتبها CLI):

- `<skill>/.clawhub/origin.json` (القديمة `.clawdhub`)

حالة تثبيت دليل العمل (تكتبها CLI):

- `<workdir>/.clawhub/lock.json` (القديمة `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص المهارة في واجهة المستخدم/البحث.

## بيانات تعريف Frontmatter

تُصرَّح بيانات تعريف المهارة في YAML frontmatter في أعلى ملف `SKILL.md`. يوضح هذا للسجل (وتحليل الأمان) ما تحتاجه مهارتك للتشغيل.

### Frontmatter أساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات تعريف وقت التشغيل (`metadata.openclaw`)

صرّح بمتطلبات وقت تشغيل مهارتك ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن تتمكن المهارة من التشغيل. استخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها مهارتك.                                                                                           |
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب تثبيتها جميعًا.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرؤها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير بيئة بيانات الاعتماد الرئيسي لمهارتك.                                                                                                  |
| `envVars`          | `array`    | تصريحات متغيرات البيئة مع `name` و`required` اختياري و`description` اختياري. عيّن `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، تكون المهارة نشطة دائمًا (لا يلزم تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري للعرض للمهارة.                                                                                                                 |
| `homepage`         | `string`   | URL للصفحة الرئيسية أو وثائق المهارة.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin في Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفة إعدادات Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كانت مهارتك تحتاج إلى تثبيت تبعيات، فصرّح بها في المصفوفة `install`:

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

صرّح بمتغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` وعيّن `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` تعني أن المهارة لا يمكن أن تعمل بدونها.

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

### لماذا يهم هذا

يتحقق تحليل الأمان في ClawHub من أن ما تصرّح به مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يصرّح به ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيشير التحليل إلى عدم تطابق في بيانات التعريف. يساعد الحفاظ على دقة التصريحات مهارتك على اجتياز المراجعة ويساعد المستخدمين على فهم ما يثبتونه.

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

- قائمة الامتدادات المسموح بها موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- لا تزال ملفات البرامج النصية تُفحص بعد الرفع؛ تُقبل ملفات PowerShell ‏`.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (على جانب الخادم):

- الحجم الإجمالي للحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد بأفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تكون بأحرف صغيرة وآمنة للاستخدام في URL: `^[a-z0-9][a-z0-9-]*$`.

## تحديد الإصدارات + الوسوم

- كل عملية نشر تنشئ إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ يُستخدم `latest` عادةً.

## الترخيص

- جميع المهارات المنشورة على ClawHub مرخّصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام المهارات المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- الإسناد غير مطلوب.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل مهارة.

## المهارات المدفوعة

- لا يدعم ClawHub المهارات المدفوعة أو التسعير لكل مهارة أو جدران الدفع أو مشاركة الإيرادات.
- لا تضف بيانات تعريف للتسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة مدفوعة تابعة لجهة خارجية، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وتصريحات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
