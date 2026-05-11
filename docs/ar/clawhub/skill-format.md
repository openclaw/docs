---
read_when:
    - نشر Skills
    - استكشاف أخطاء فشل النشر/المزامنة وإصلاحها
summary: تنسيق مجلد المهارة، الملفات المطلوبة، أنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-05-11T22:20:12Z"
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
- `.clawhubignore` (أنماط تجاهل للنشر/المزامنة، والقديم `.clawdhubignore`)
- `.gitignore` (يُحترم أيضًا)

بيانات التثبيت المحلي الوصفية (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

حالة التثبيت في دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بتنسيق YAML.
- يستخرج الخادم البيانات الوصفية من frontmatter أثناء النشر.
- يُستخدم `description` كملخص للمهارة في واجهة المستخدم/البحث.

## بيانات frontmatter الوصفية

تُعلن بيانات المهارة الوصفية في YAML frontmatter أعلى ملف `SKILL.md`. يخبر هذا السجل (وتحليل الأمان) بما تحتاجه مهارتك للتشغيل.

### frontmatter الأساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات وقت التشغيل الوصفية (`metadata.openclaw`)

أعلِن متطلبات وقت التشغيل الخاصة بمهارتك ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

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
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب تثبيتها جميعًا.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرؤها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي لبيانات الاعتماد الخاصة بمهارتك.                                                                                                  |
| `envVars`          | `array`    | إعلانات متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. عيّن `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، تكون المهارة نشطة دائمًا (لا يلزم تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | يتجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | رمز emoji المعروض للمهارة.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو وثائق المهارة.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin لـ Nix (راجع README).                                                                                                                |
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

أعلِن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` وعيّن `required: false`. لا تُضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن المهارة لا يمكن أن تعمل بدونها.

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

يتحقق تحليل الأمان في ClawHub من أن ما تعلنه مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يعلنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيضع التحليل علامة على عدم تطابق في البيانات الوصفية. يساعد الحفاظ على دقة الإعلانات مهارتك على اجتياز المراجعة، ويساعد المستخدمين على فهم ما يثبتونه.

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
- يجب أن تكون بأحرف صغيرة وآمنة للاستخدام في عناوين URL: `^[a-z0-9][a-z0-9-]*$`.

## الإصدارات + الوسوم

- كل عملية نشر تنشئ إصدارًا جديدًا (semver).
- الوسوم هي مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` بشكل شائع.

## الترخيص

- جميع المهارات المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام المهارات المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- الإسناد غير مطلوب.
- لا تُضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل مهارة.

## المهارات المدفوعة

- لا يدعم ClawHub المهارات المدفوعة، أو التسعير لكل مهارة، أو بوابات الدفع، أو مشاركة الإيرادات.
- لا تُضف بيانات تسعير وصفية إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة خارجية مدفوعة، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وإعلانات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
