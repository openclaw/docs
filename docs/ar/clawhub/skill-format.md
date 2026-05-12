---
read_when:
    - نشر Skills
    - استكشاف إخفاقات النشر/المزامنة وإصلاحها
summary: تنسيق مجلد المهارة، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-05-12T08:44:57Z"
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
- `.clawhubignore` (أنماط تجاهل للنشر/المزامنة، مع دعم قديم لـ `.clawdhubignore`)
- `.gitignore` (تتم مراعاته أيضًا)

بيانات التثبيت المحلية الوصفية (تكتبها CLI):

- `<skill>/.clawhub/origin.json` (قديمًا `.clawdhub`)

حالة التثبيت في دليل العمل (تكتبها CLI):

- `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم البيانات الوصفية من frontmatter أثناء النشر.
- يُستخدم `description` كملخص للمهارة في واجهة المستخدم/البحث.

## بيانات frontmatter الوصفية

تُعرَّف بيانات المهارة الوصفية في YAML frontmatter أعلى ملف `SKILL.md`. يوضح هذا للسجل (ولتحليل الأمان) ما تحتاجه مهارتك للتشغيل.

### frontmatter أساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات وقت التشغيل الوصفية (`metadata.openclaw`)

أعلِن متطلبات وقت التشغيل لمهارتك ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل تشغيل المهارة. استخدم `envVars` عندما تحتاج إلى بيانات وصفية لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها مهارتك.                                                                                           |
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب أن تكون كلها مثبتة.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرأها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي للاعتماد الخاص بمهارتك.                                                                                                  |
| `envVars`          | `array`    | تعريفات متغيرات البيئة مع `name` و`required` الاختياري و`description` الاختياري. اضبط `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كان `true`، تكون المهارة نشطة دائمًا (لا حاجة إلى تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | الرمز التعبيري المعروض للمهارة.                                                                                                                 |
| `homepage`         | `string`   | URL للصفحة الرئيسية للمهارة أو وثائقها.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin الخاصة بـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفة إعداد Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كانت مهارتك تحتاج إلى تثبيت تبعيات، فأعلِن عنها في مصفوفة `install`:

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

أعلِن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` واضبط `required: false`. لا تُضِف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن المهارة لا يمكن تشغيلها بدونها.

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

يتحقق تحليل الأمان في ClawHub من أن ما تعلنه مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يعلنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيرصد التحليل عدم تطابق في البيانات الوصفية. يساعد الحفاظ على دقة التعريفات مهارتك على اجتياز المراجعة، ويساعد المستخدمين على فهم ما يثبتونه.

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

- قائمة امتدادات الملفات المسموح بها موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- ما تزال ملفات السكربت تُفحص بعد الرفع؛ تُقبل ملفات PowerShell `.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة صغيرة مسموح بها (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (على جانب الخادم):

- إجمالي حجم الحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد بأفضل جهد).

## Slugs

- تُشتق افتراضيًا من اسم المجلد.
- يجب أن تكون بحروف صغيرة وآمنة للاستخدام في URL: `^[a-z0-9][a-z0-9-]*$`.

## الإصدارات + الوسوم

- كل عملية نشر تنشئ إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ يُستخدم `latest` عادةً.

## الترخيص

- كل Skills المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يلزم الإسناد.
- لا تُضِف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل مهارة.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة، أو التسعير لكل مهارة، أو جدران الدفع، أو مشاركة الإيرادات.
- لا تُضِف بيانات تسعير وصفية إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة خارجية مدفوعة، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وتعريفات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
