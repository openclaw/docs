---
read_when:
    - نشر Skills
    - استكشاف أخطاء النشر وإصلاحها
summary: تنسيق مجلد Skills، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-07-03T13:31:05Z"
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

- أي ملفات داعمة _نصية_ (راجع «الملفات المسموح بها»)
- `.clawhubignore` (أنماط تجاهل للنشر، و`.clawdhubignore` القديم)
- `.gitignore` (يُحترم أيضًا)

## الاستيراد من GitHub

مستورد GitHub على الويب أكثر صرامة من النشر/المزامنة المحليين. فهو يكتشف فقط ملفات
`SKILL.md` أو ملفات `skills.md` القديمة في المستودعات العامة غير المتفرعة التي يملكها
حساب GitHub الذي سجّل الدخول. ولا يستورد المستودعات الخاصة، أو التفريعات،
أو المستودعات المؤرشفة/المعطلة، أو المستودعات العامة التابعة لأطراف ثالثة.

بيانات تثبيت التعريف المحلية (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` القديم)

حالة تثبيت دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` القديم)

## `SKILL.md`

- Markdown مع frontmatter اختياري بتنسيق YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص للمهارة في واجهة المستخدم/البحث.

## بيانات تعريف frontmatter

تُصرّح بيانات تعريف المهارة في frontmatter بتنسيق YAML أعلى ملف `SKILL.md`. هذا يخبر السجل (وتحليل الأمان) بما تحتاجه مهارتك لكي تعمل.

### frontmatter الأساسي

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن تتمكن المهارة من العمل. استخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها مهارتك.                                                                                           |
| `requires.bins`    | `string[]` | ملفات CLI التنفيذية التي يجب تثبيتها كلها.                                                                                                     |
| `requires.anyBins` | `string[]` | ملفات CLI التنفيذية التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرأها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي للاعتماد الخاص بمهارتك.                                                                                                  |
| `envVars`          | `array`    | تصاريح متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. عيّن `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كان `true`، تكون المهارة نشطة دائمًا (لا حاجة إلى تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري معروض للمهارة.                                                                                                                 |
| `homepage`         | `string`   | URL للصفحة الرئيسية أو الوثائق الخاصة بالمهارة.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (انظر أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin لـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفة إعداد Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كانت مهارتك تحتاج إلى تثبيت تبعيات، فصرّح بها في مصفوفة `install`:

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

صرّح بمتغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` وعيّن `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن المهارة لا يمكنها العمل بدونها.

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

### سبب أهمية ذلك

يتحقق تحليل الأمان في ClawHub من أن ما تصرّح به مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يصرّح به ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيضع التحليل علامة على عدم تطابق بيانات التعريف. يساعد الحفاظ على دقة التصاريح مهارتك على اجتياز المراجعة، ويساعد المستخدمين على فهم ما يثبّتونه.

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

لا يقبل النشر إلا الملفات «النصية».

- قائمة السماح بالامتدادات موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- لا تزال ملفات السكربت تُفحص بعد الرفع؛ تُقبل ملفات PowerShell ذات الامتدادات `.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (من جانب الخادم):

- الحجم الإجمالي للحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد بأفضل جهد).

## الأسماء المختصرة

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تطابق نطاقات الحزم معرّف ناشر ClawHub تمامًا. يمكن لمعرّفات الناشرين استخدام أحرف صغيرة، وأرقام، وواصلات، ونقاط، وشرطات سفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون الأسماء المختصرة للحزم بأحرف صغيرة وآمنة لـ npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## الإصدارات + الوسوم

- كل عملية نشر تنشئ إصدارًا جديدًا (semver).
- الوسوم هي مؤشرات نصية إلى إصدار؛ يُستخدم `latest` عادةً.

## الترخيص

- كل المهارات المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يمكن لأي شخص استخدام المهارات المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يلزم نسب العمل.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل مهارة.

## المهارات المدفوعة

- لا يدعم ClawHub المهارات المدفوعة، أو التسعير لكل مهارة، أو جدران الدفع، أو مشاركة الإيرادات.
- لا تضف بيانات تعريف للتسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة طرف ثالث مدفوعة، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وتصاريح البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
