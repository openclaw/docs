---
read_when:
    - نشر Skills
    - استكشاف أخطاء فشل النشر/المزامنة وإصلاحها
summary: تنسيق مجلد Skill، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-05-11T20:26:11Z"
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

- أي ملفات _نصية_ داعمة (انظر “الملفات المسموح بها”)
- `.clawhubignore` (أنماط تجاهل للنشر/المزامنة، legacy `.clawdhubignore`)
- `.gitignore` (يُحترم أيضًا)

بيانات تثبيت محلية (تكتبها CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

حالة تثبيت Workdir (تكتبها CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم البيانات الوصفية من frontmatter أثناء النشر.
- يُستخدم `description` بوصفه ملخص المهارة في واجهة المستخدم/البحث.

## بيانات frontmatter الوصفية

تُعلن بيانات المهارة الوصفية في YAML frontmatter أعلى ملف `SKILL.md`. يوضح هذا للسجل (وتحليل الأمان) ما تحتاجه مهارتك للتشغيل.

### frontmatter أساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات وقت التشغيل الوصفية (`metadata.openclaw`)

أعلن متطلبات وقت تشغيل مهارتك تحت `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن تتمكن المهارة من التشغيل. استخدم `envVars` عندما تحتاج إلى بيانات وصفية لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها مهارتك.                                                                                           |
| `requires.bins`    | `string[]` | ثنائيات CLI التي يجب أن تكون كلها مثبتة.                                                                                                     |
| `requires.anyBins` | `string[]` | ثنائيات CLI التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرؤها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي لبيانات الاعتماد لمهارتك.                                                                                                  |
| `envVars`          | `array`    | تصريحات متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. اضبط `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، تكون المهارة نشطة دائمًا (لا حاجة إلى تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | يتجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري لعرض المهارة.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو الوثائق الخاصة بالمهارة.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت الاعتماديات (انظر أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin لـ Nix (انظر README).                                                                                                                |
| `config`           | `object`   | مواصفة إعداد Clawdbot (انظر README).                                                                                                           |

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

أعلن متغيرات البيئة الاختيارية تحت `metadata.openclaw.envVars` واضبط `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن المهارة لا يمكن تشغيلها بدونها.

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

يتحقق تحليل الأمان في ClawHub من أن ما تعلنه مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يصرح به تحت `requires.env` أو `primaryEnv` أو `envVars`، فسيضع التحليل علامة على عدم تطابق في البيانات الوصفية. يساعد الحفاظ على دقة التصريحات مهارتك على اجتياز المراجعة ويساعد المستخدمين على فهم ما يثبتونه.

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

لا يقبل النشر إلا الملفات “النصية”.

- قائمة الامتدادات المسموح بها موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- لا تزال ملفات السكربت تُفحص بعد الرفع؛ تُقبل ملفات PowerShell بصيغ `.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (على جانب الخادم):

- إجمالي حجم الحزمة: 50 ميجابايت.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد بأفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تكون بأحرف صغيرة وآمنة لعناوين URL: `^[a-z0-9][a-z0-9-]*$`.

## إدارة الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ يُستخدم `latest` عادةً.

## الترخيص

- جميع المهارات المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام المهارات المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يلزم نسب العمل.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات ترخيص لكل مهارة.

## المهارات المدفوعة

- لا يدعم ClawHub المهارات المدفوعة، أو التسعير لكل مهارة، أو الجدران المدفوعة، أو مشاركة الإيرادات.
- لا تضف بيانات وصفية للتسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة خارجية مدفوعة، فوثق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وتصريحات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
