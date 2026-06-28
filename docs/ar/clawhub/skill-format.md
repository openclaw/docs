---
read_when:
    - نشر Skills
    - استكشاف أخطاء فشل النشر وإصلاحها
summary: تنسيق مجلد Skill، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-06-28T06:04:20Z"
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
- `.clawhubignore` (أنماط تجاهل للنشر، والقديم `.clawdhubignore`)
- `.gitignore` (يُحترم أيضًا)

## الاستيراد من GitHub

مستورد GitHub عبر الويب أكثر صرامة من النشر/المزامنة المحليين. فهو لا يكتشف إلا
ملفات `SKILL.md` أو ملفات `skills.md` القديمة في المستودعات العامة غير المتفرعة التي يملكها
حساب GitHub الذي سجّل الدخول. ولا يستورد المستودعات الخاصة، أو التفريعات،
أو المستودعات المؤرشفة/المعطلة، أو المستودعات العامة التابعة لجهات خارجية.

بيانات تعريف التثبيت المحلي (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

حالة تثبيت دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص للمهارة في الواجهة/البحث.

## بيانات تعريف Frontmatter

تُعلن بيانات تعريف المهارة في YAML frontmatter أعلى ملف `SKILL.md`. يخبر هذا السجل (وتحليل الأمان) بما تحتاجه مهارتك للتشغيل.

### Frontmatter أساسي

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن تتمكن المهارة من العمل. استخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها مهارتك.                                                                                           |
| `requires.bins`    | `string[]` | ثنائيات CLI التي يجب تثبيتها كلها.                                                                                                     |
| `requires.anyBins` | `string[]` | ثنائيات CLI التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي تقرؤها مهارتك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي لبيانات الاعتماد الخاصة بمهارتك.                                                                                                  |
| `envVars`          | `array`    | إعلانات متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. عيّن `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، تكون المهارة نشطة دائمًا (لا حاجة إلى تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | يتجاوز مفتاح استدعاء المهارة.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري لعرض المهارة.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو الوثائق الخاصة بالمهارة.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (راجع أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin لـ Nix (راجع README).                                                                                                                |
| `config`           | `object`   | مواصفة إعداد Clawdbot (راجع README).                                                                                                           |

### مواصفات التثبيت

إذا كانت مهارتك تحتاج إلى تثبيت تبعيات، فأعلنها في مصفوفة `install`:

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

أعلن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` وعيّن `required: false`. لا تضف الإدخالات الاختيارية إلى `requires.env`، لأن `requires.env` تعني أن المهارة لا يمكن أن تعمل بدونها.

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

يتحقق تحليل أمان ClawHub من أن ما تعلنه مهارتك يطابق ما تفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يعلنه ضمن `requires.env`، أو `primaryEnv`، أو `envVars`، فسيعلّم التحليل ذلك كتعارض في بيانات التعريف. يساعد الحفاظ على دقة الإعلانات مهارتك على اجتياز المراجعة، ويساعد المستخدمين على فهم ما يثبتونه.

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

- قائمة الامتدادات المسموح بها موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- لا تزال ملفات السكربت تُفحص بعد الرفع؛ وتُقبل ملفات PowerShell ذات الامتدادات `.ps1`، و`.psm1`، و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ إضافة إلى قائمة صغيرة مسموح بها (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (من جهة الخادم):

- الحجم الإجمالي للحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد وفق أفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تطابق نطاقات الحزم معرّف ناشر ClawHub تمامًا. يمكن لمعرّفات الناشرين استخدام الأحرف الصغيرة، والأرقام، والواصلات، والنقاط، والشرطات السفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون slugs الحزم بأحرف صغيرة وآمنة لـ npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم هي مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` عادةً.

## الترخيص

- جميع Skills المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يُطلب الإسناد.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل مهارة على حدة.

## Skills مدفوعة

- لا يدعم ClawHub Skills المدفوعة، أو التسعير لكل مهارة، أو جدران الدفع، أو مشاركة الإيرادات.
- لا تضف بيانات تعريف التسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق المهارة ولن تجعل المهارة المنشورة مدفوعة.
- إذا كانت مهارتك تتكامل مع خدمة مدفوعة تابعة لجهة خارجية، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات المهارة وإعلانات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
