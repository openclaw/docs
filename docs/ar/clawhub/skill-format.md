---
read_when:
    - نشر Skills
    - استكشاف أخطاء فشل النشر/المزامنة وإصلاحها
summary: تنسيق مجلد Skill والملفات المطلوبة وأنواع الملفات المسموح بها والحدود.
x-i18n:
    generated_at: "2026-05-10T19:28:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق Skill

## على القرص

Skill هو مجلد.

مطلوب:

- `SKILL.md` (أو `skill.md`)

اختياري:

- أي ملفات داعمة _نصية_ (راجع "الملفات المسموح بها")
- `.clawhubignore` (أنماط التجاهل للنشر/المزامنة، الصيغة القديمة `.clawdhubignore`)
- `.gitignore` (يُراعى أيضًا)

بيانات تثبيت محلية (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (الصيغة القديمة `.clawdhub`)

حالة تثبيت دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (الصيغة القديمة `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم البيانات الوصفية من frontmatter أثناء النشر.
- يُستخدم `description` كملخص Skill في واجهة المستخدم/البحث.

## بيانات frontmatter الوصفية

تُصرّح بيانات Skill الوصفية في frontmatter بصيغة YAML أعلى ملف `SKILL.md`. يوضح هذا للسجل (وتحليل الأمان) ما يحتاجه Skill للتشغيل.

### frontmatter الأساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات وقت التشغيل الوصفية (`metadata.openclaw`)

صرّح بمتطلبات وقت تشغيل Skill تحت `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن يتمكن Skill من التشغيل. استخدم `envVars` عندما تحتاج إلى بيانات وصفية لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي يتوقعها Skill.                                                                                           |
| `requires.bins`    | `string[]` | ثنائيات CLI التي يجب أن تكون جميعها مثبتة.                                                                                                     |
| `requires.anyBins` | `string[]` | ثنائيات CLI التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعدادات التي يقرأها Skill.                                                                                                          |
| `primaryEnv`       | `string`   | متغير بيئة بيانات الاعتماد الرئيسي لـ Skill.                                                                                                  |
| `envVars`          | `array`    | تصريحات متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. عيّن `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، يكون Skill نشطًا دائمًا (لا يلزم تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء Skill.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري للعرض خاص بـ Skill.                                                                                                                 |
| `homepage`         | `string`   | URL للصفحة الرئيسية أو الوثائق الخاصة بـ Skill.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات التثبيت للتبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin الخاصة بـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفة إعدادات Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كان Skill يحتاج إلى تثبيت تبعيات، فصرّح بها في مصفوفة `install`:

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

صرّح بمتغيرات البيئة الاختيارية تحت `metadata.openclaw.envVars` وعيّن `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن Skill لا يمكنه التشغيل بدونها.

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

يتحقق تحليل الأمان في ClawHub من أن ما يصرّح به Skill يطابق ما يفعله فعليًا. إذا كان الكود لديك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يصرّح به تحت `requires.env` أو `primaryEnv` أو `envVars`، فسيضع التحليل علامة على عدم تطابق في البيانات الوصفية. يساعد الحفاظ على دقة التصريحات Skill على اجتياز المراجعة، ويساعد المستخدمين على فهم ما يثبتونه.

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

لا يقبل النشر سوى الملفات "النصية".

- قائمة الامتدادات المسموح بها موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- تظل ملفات السكربتات تُفحص بعد الرفع؛ وتُقبل ملفات PowerShell `.ps1` و`.psm1` و`.psd1` كنصوص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنصوص؛ بالإضافة إلى قائمة صغيرة مسموح بها (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (من جهة الخادم):

- الحجم الإجمالي للحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد أقصى على أساس أفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تكون بأحرف صغيرة وآمنة للاستخدام في URL: `^[a-z0-9][a-z0-9-]*$`.

## الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` عادةً.

## الترخيص

- جميع Skills المنشورة على ClawHub مرخّصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يلزم ذكر النسبة.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل Skill.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة أو التسعير لكل Skill أو جدران الدفع أو مشاركة الإيرادات.
- لا تضف بيانات تسعير وصفية إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق Skill ولن تجعل Skill المنشور مدفوعًا.
- إذا كان Skill يتكامل مع خدمة خارجية مدفوعة، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات Skill وتصريحات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
