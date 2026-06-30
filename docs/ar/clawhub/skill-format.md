---
read_when:
    - نشر Skills
    - تصحيح أخطاء فشل النشر
summary: تنسيق مجلد Skills، والملفات المطلوبة، وأنواع الملفات المسموح بها، والحدود.
x-i18n:
    generated_at: "2026-06-30T22:16:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# تنسيق Skill

## على القرص

Skill هو مجلد.

مطلوب:

- `SKILL.md` (أو `skill.md`؛ ويُقبل أيضًا `skills.md` القديم)

اختياري:

- أي ملفات داعمة _نصية_ (انظر "الملفات المسموح بها")
- `.clawhubignore` (أنماط تجاهل للنشر، `.clawdhubignore` القديم)
- `.gitignore` (يُحترم أيضًا)

## استيراد GitHub

مستورِد GitHub على الويب أكثر صرامة من النشر/المزامنة المحليين. فهو لا يكتشف إلا ملفات
`SKILL.md` أو ملفات `skills.md` القديمة في المستودعات العامة غير المتفرعة المملوكة لحساب
GitHub الذي سجّل الدخول. لا يستورد المستودعات الخاصة، أو التفريعات،
أو المستودعات المؤرشفة/المعطلة، أو المستودعات العامة التابعة لجهات خارجية.

بيانات تعريف التثبيت المحلي (يكتبها CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` القديم)

حالة تثبيت دليل العمل (يكتبها CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` القديم)

## `SKILL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم بيانات التعريف من frontmatter أثناء النشر.
- يُستخدم `description` كملخص Skill في واجهة المستخدم/البحث.

## بيانات تعريف frontmatter

تُعلن بيانات تعريف Skill في frontmatter بصيغة YAML أعلى ملف `SKILL.md` لديك. يخبر هذا السجل (وتحليل الأمان) بما تحتاجه Skill لديك للعمل.

### frontmatter الأساسي

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### بيانات تعريف وقت التشغيل (`metadata.openclaw`)

أعلِن متطلبات وقت تشغيل Skill لديك ضمن `metadata.openclaw` (الأسماء البديلة: `metadata.clawdbot`، `metadata.clawdis`).

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

استخدم `requires.env` لمتغيرات البيئة التي يجب أن تكون موجودة قبل أن تعمل Skill. استخدم `envVars` عندما تحتاج إلى بيانات تعريف لكل متغير، بما في ذلك المتغيرات الاختيارية مع `required: false`.

### مرجع كامل للحقول

| الحقل              | النوع       | الوصف                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغيرات البيئة المطلوبة التي تتوقعها Skill لديك.                                                                                           |
| `requires.bins`    | `string[]` | ثنائيات CLI التي يجب تثبيتها كلها.                                                                                                     |
| `requires.anyBins` | `string[]` | ثنائيات CLI التي يجب أن يوجد واحد منها على الأقل.                                                                                                  |
| `requires.config`  | `string[]` | مسارات ملفات الإعدادات التي تقرؤها Skill لديك.                                                                                                          |
| `primaryEnv`       | `string`   | متغير البيئة الرئيسي لبيانات الاعتماد لـ Skill لديك.                                                                                                  |
| `envVars`          | `array`    | إعلانات متغيرات البيئة مع `name` و`required` الاختياري و`description` الاختياري. اضبط `required: false` لمتغيرات البيئة الاختيارية. |
| `always`           | `boolean`  | إذا كانت `true`، تكون Skill نشطة دائمًا (لا حاجة إلى تثبيت صريح).                                                                              |
| `skillKey`         | `string`   | تجاوز مفتاح استدعاء Skill.                                                                                                         |
| `emoji`            | `string`   | رمز تعبيري لعرض Skill.                                                                                                                 |
| `homepage`         | `string`   | عنوان URL للصفحة الرئيسية أو الوثائق الخاصة بـ Skill.                                                                                                         |
| `os`               | `string[]` | قيود نظام التشغيل (مثل `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مواصفات تثبيت الاعتماديات (انظر أدناه).                                                                                                  |
| `nix`              | `object`   | مواصفة Nix Plugin (انظر README).                                                                                                                |
| `config`           | `object`   | مواصفة إعداد Clawdbot (انظر README).                                                                                                           |

### مواصفات التثبيت

إذا كانت Skill لديك تحتاج إلى اعتماديات مثبتة، فأعلنها في مصفوفة `install`:

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

أعلِن متغيرات البيئة الاختيارية ضمن `metadata.openclaw.envVars` واضبط `required: false`. لا تُضِف إدخالات اختيارية إلى `requires.env`، لأن `requires.env` يعني أن Skill لا يمكنها العمل من دونها.

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

يتحقق تحليل الأمان في ClawHub من أن ما تعلنه Skill لديك يطابق ما تفعله فعليًا. إذا كان الكود لديك يشير إلى `TODOIST_API_KEY` لكن frontmatter لديك لا يعلنه ضمن `requires.env` أو `primaryEnv` أو `envVars`، فسيضع التحليل علامة على عدم تطابق بيانات التعريف. يساعد الحفاظ على دقة الإعلانات Skill لديك على اجتياز المراجعة ويساعد المستخدمين على فهم ما يثبتونه.

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
- لا تزال ملفات السكربت تُفحص بعد الرفع؛ تُقبل ملفات PowerShell ذات الامتدادات `.ps1` و`.psm1` و`.psd1` كنص.
- تُعامل أنواع المحتوى التي تبدأ بـ `text/` كنص؛ بالإضافة إلى قائمة سماح صغيرة (JSON/YAML/TOML/JS/TS/Markdown/SVG).

الحدود (على جانب الخادم):

- إجمالي حجم الحزمة: 50MB.
- يتضمن نص التضمين `SKILL.md` + ما يصل إلى نحو 40 ملفًا غير `.md` (حد بأفضل جهد).

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تطابق نطاقات الحزم مقبض ناشر ClawHub تمامًا. يمكن لمقابض الناشرين استخدام الأحرف الصغيرة، والأرقام، والواصلات، والنقاط، والشرطات السفلية؛ ويجب أن تبدأ وتنتهي بحرف صغير أو رقم.
- يجب أن تكون Slugs الحزم بأحرف صغيرة وآمنة لـ npm، مثل `@example.tools/demo-plugin` أو `demo-plugin`.

## الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ ويُستخدم `latest` عادةً.

## الترخيص

- كل Skills المنشورة على ClawHub مرخصة بموجب `MIT-0`.
- يجوز لأي شخص استخدام Skills المنشورة وتعديلها وإعادة توزيعها، بما في ذلك تجاريًا.
- الإسناد غير مطلوب.
- لا تضف شروط ترخيص متعارضة في `SKILL.md`؛ لا يدعم ClawHub تجاوزات الترخيص لكل Skill.

## Skills المدفوعة

- لا يدعم ClawHub Skills المدفوعة، أو التسعير لكل Skill، أو جدران الدفع، أو مشاركة الإيرادات.
- لا تضف بيانات تعريف التسعير إلى `SKILL.md`؛ فهي ليست جزءًا من تنسيق Skill ولن تجعل Skill منشورة مدفوعة.
- إذا كانت Skill لديك تتكامل مع خدمة مدفوعة تابعة لجهة خارجية، فوثّق التكلفة الخارجية والحساب المطلوب بوضوح في تعليمات Skill وإعلانات البيئة (`requires.env` للمتغيرات المطلوبة، أو `envVars` مع `required: false` للمتغيرات الاختيارية).
