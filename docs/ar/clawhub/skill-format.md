---
read_when:
    - نشر Skills
    - تصحيح أخطاء إخفاقات النشر
summary: تنسيق مجلد Skills، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-07-01T08:04:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق Skills

## على القرص

Skill هو مجلد.

مطلوب:

- `SKILL.md` (أو `skill.md`؛ يُقبل أيضًا `skills.md` القديم)

اختياري:

- أي ملفات داعمة _نصية_ (انظر “الملفات المسموح بها”)
- `.clawhubignore` (أنماط تجاهل للنشر، `.clawdhubignore` القديم)
- `.gitignore` (يُحترم أيضًا)

## استيراد GitHub

مستورد GitHub على الويب أكثر صرامة من النشر/المزامنة المحليين. فهو يكتشف فقط
ملفات `SKILL.md` أو `skills.md` القديمة في مستودعات عامة وغير متفرعة يملكها
حساب GitHub المسجل دخوله. لا يستورد المستودعات الخاصة أو التفريعات أو
المستودعات المؤرشفة/المعطلة أو المستودعات العامة التابعة لجهات خارجية.

بيانات تعريف التثبيت المحلي (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` القديم)

حالة تثبيت دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` القديم)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص Skill في واجهة المستخدم/البحث.

## بيانات تعريف frontmatter

تُعلن بيانات تعريف Skill في frontmatter بصيغة YAML في أعلى ملف `SKILL.md`. يخبر هذا السجل (وتحليل الأمان) بما يحتاجه Skill للتشغيل.

### frontmatter أساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات تعريف وقت التشغيل (`metadata.openclaw`)

أعلن متطلبات وقت تشغيل Skill ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot` و`metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن يتمكن Skill من العمل. استخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع الحقول الكامل

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي يتوقعها Skill.                                                                                           |
| `requires.bins`    | `string[]` | ثنائيات CLI التي يجب تثبيتها جميعًا.                                                                                                     |
| `requires.anyBins` | `string[]` | ثنائيات CLI التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعداد التي يقرأها Skill.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي لبيانات الاعتماد لـ Skill.                                                                                                  |
| `envVars`          | `array`    | إعلانات متغيرات البيئة مع `name`، و`required` اختياري، و`description` اختياري. عيّن `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، يكون Skill نشطًا دائمًا (لا حاجة إلى تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء Skill.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري للعرض لـ Skill.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو الوثائق الخاصة بـ Skill.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]` و`["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت التبعيات (انظر أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Plugin لـ Nix (انظر README).                                                                                                                |
| `config`           | `object`   | مواصفة إعداد Clawdbot (انظر README).                                                                                                           |

### مواصفات التثبيت

إذا كان Skill يحتاج إلى تثبيت تبعيات، فأعلن عنها في مصفوفة `install`:

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

أعلن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` وعيّن `required: false`. لا تضف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن Skill لا يمكن أن يعمل بدونها.

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

يتحقق تحليل الأمان في ClawHub من أن ما يعلنه Skill يطابق ما يفعله فعليًا. إذا كان كودك يشير إلى `TODOIST_API_KEY` لكن frontmatter لا يعلنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيشير التحليل إلى عدم تطابق في بيانات التعريف. يساعد الحفاظ على دقة الإعلانات Skill على اجتياز المراجعة ويساعد المستخدمين على فهم ما يثبتونه.

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

- قائمة السماح بالامتدادات موجودة في `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- لا تزال ملفات السكربت تُفحص بعد الرفع؛ تُقبل ملفات PowerShell ذات الامتدادات `.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (على جانب الخادم):

- إجمالي حجم الحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد أقصى بأفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تطابق نطاقات الحزم مُعرّف ناشر ClawHub تمامًا. يمكن لمعرّفات الناشرين استخدام الأحرف الصغيرة والأرقام والواصلات والنقاط والشرطات السفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون Slugs الحزم بأحرف صغيرة وآمنة لـ npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` بشكل شائع.

## الترخيص

- جميع Skills المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- لا يلزم الإسناد.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل Skill.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة أو التسعير لكل Skill أو حواجز الدفع أو مشاركة الإيرادات.
- لا تضف بيانات تعريف التسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق Skill ولن تجعل Skill المنشور مدفوعًا.
- إذا كان Skill يتكامل مع خدمة خارجية مدفوعة، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات Skill وإعلانات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
