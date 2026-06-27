---
read_when:
    - نشر مهارة أو Plugin
    - تصحيح أخطاء مالك أو نطاق الحزمة
    - إضافة واجهة نشر أو CLI أو سلوك في الواجهة الخلفية
summary: كيفية عمل النشر في ClawHub للمهارات والمكونات الإضافية والمالكين والنطاقات والإصدارات والمراجعة.
x-i18n:
    generated_at: "2026-06-27T17:18:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# النشر

يرسل النشر مجلد Skills أو حزمة Plugin إلى ClawHub تحت المالك الذي
تختاره. يتحقق ClawHub من أن الرمز المميز لديك يستطيع النشر لذلك المالك، ويتحقق من
البيانات الوصفية، والاسم، والإصدار، والملفات، ومعلومات المصدر، ثم يخزن الإصدار
ويبدأ فحوصات الأمان الآلية.

إذا فشل التحقق، فلن يُنشر أي شيء. قد تبقى الإصدارات الجديدة أيضًا خارج
واجهات التثبيت والتنزيل العادية إلى أن تنتهي المراجعة.

## Skills

أبسط مسار للنشر هو CLI. سجّل الدخول، ثم انشر مجلد Skills محليًا:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

استخدم `--owner <handle>` عند النشر إلى مالك مؤسسة. احذفه للنشر بصفتك
المستخدم المصادق عليه. يتخطى النشر المحتوى غير المتغير. يبدأ Skills جديد
عند `1.0.0`، وتنشر التغييرات اللاحقة تلقائيًا إصدار التصحيح التالي. مرر
`--version` فقط عندما تحتاج إلى إصدار صريح.

لمستودعات الفهرس، استخدم سير عمل ClawHub القابل لإعادة الاستخدام
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
يستدعي `skill publish` لكل مجلد Skills مباشر تحت `root` (الافتراضي:
`skills`)، أو للمجلد الممرر كـ `skill_path` فقط.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

استخدم `dry_run: true` لمعاينة Skills الجديدة والمتغيرة بدون نشر.

## Plugins

تستخدم Plugins أسماء حزم على نمط npm. تتضمن أسماء الحزم ذات النطاق المالك في
الجزء الأول من الاسم:

```text
@owner/package-name
```

يجب أن يطابق النطاق مالك النشر المحدد. إذا كانت حزمتك مسماة
`@openclaw/dronzer`، فلا يمكن نشرها إلا باسم `@openclaw`. إذا نشرت باسم
`@vintageayu`، فأعد تسمية الحزمة إلى `@vintageayu/dronzer`.

يمنع هذا الحزمة من ادعاء مساحة أسماء مؤسسة لا يتحكم فيها الناشر.

إذا كنت المالك الشرعي لمؤسسة، أو علامة تجارية، أو نطاق حزمة، أو معرّف مالك، أو
مساحة أسماء سبق ادعاؤها أو حجزها على ClawHub، فافتح
[مشكلة ادعاء مؤسسة / مساحة أسماء](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
مع إثبات عام وغير حساس. راجع
[ادعاءات المؤسسات ومساحات الأسماء](/ar/clawhub/namespace-claims) لمعرفة ما يجب تضمينه وما
يجب إبقاؤه خارج المشكلات العامة.

### قبل نشر Plugin

- اختر مالكًا يطابق نطاق الحزمة.
- ضمّن `openclaw.plugin.json`. تحتاج Plugins البرمجية أيضًا إلى `package.json` مع
  `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.
- لإظهار أيقونة بطاقة Plugin مخصصة، أضف `icon` إلى `openclaw.plugin.json` مع
  أي عنوان URL لصورة عبر HTTPS.
- ضمّن مستودع المصدر وبيانات وصفية للالتزام الدقيق، أو استخدم CLI من
  نسخة عمل مدعومة بـ GitHub حتى يتمكن من اكتشافها.
- شغّل `clawhub package validate <source>` قبل النشر. بالنسبة إلى نتائج الحزمة،
  أو البيان، أو استيراد SDK، أو الأثر، راجع
  [إصلاحات التحقق من Plugin](/ar/clawhub/plugin-validation-fixes).
- شغّل `clawhub package publish <source> --dry-run` قبل إنشاء إصدار.
- توقّع أن تبقى الإصدارات الجديدة خارج واجهات التثبيت العامة إلى أن تنتهي
  فحوصات الأمان الآلية والتحقق.

### النشر الموثوق للحزم

إعداد النشر الموثوق للحزم يتم على خطوتين:

1. انشر الحزمة مرة واحدة عبر `clawhub package publish` اليدوي العادي أو
   المصادق عليه برمز مميز. ينشئ هذا صف الحزمة ويحدد مديري الحزمة الذين يمكنهم
   تغيير تهيئة الناشر الموثوق الخاصة بها.
2. يضبط مدير الحزمة تهيئة الناشر الموثوق في GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

بعد ضبط التهيئة، يمكن لعمليات النشر المستقبلية المدعومة من GitHub Actions استخدام
OIDC/النشر الموثوق بدون تخزين رمز ClawHub مميز طويل الأجل في
المستودع. يجب أن يطابق المستودع واسم ملف سير العمل المضبوطان مطالبة
GitHub Actions OIDC. إذا مررت أيضًا `--environment <name>`، فيجب أن تطابق
مطالبة بيئة GitHub Actions ذلك الاسم تمامًا.

يتحقق ClawHub من مستودع GitHub المضبوط عند ضبط تهيئة الناشر الموثوق.
يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة.
تتطلب المستودعات الخاصة أن يكون لدى ClawHub وصول GitHub إلى ذلك المستودع،
على سبيل المثال عبر تثبيت مستقبلي لتطبيق ClawHub GitHub App أو تكامل
GitHub مخول آخر.

يدعم سير عمل نشر الحزم القابل لإعادة الاستخدام الحالي النشر الموثوق بدون أسرار
لعمليات نشر `workflow_dispatch` عندما يكون `id-token: write`
متاحًا. لا تزال عمليات النشر الحقيقية بدفع الوسوم تحتاج إلى `clawhub_token`، لذا أبقِ
`CLAWHUB_TOKEN` متاحًا لإصدارات الوسوم، وعمليات النشر الأولى، والحزم غير الموثوقة،
أو عمليات النشر الطارئة.

افحص التهيئة أو أزلها باستخدام:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

حذف تهيئة الناشر الموثوق هو مسار التراجع. يعطل سك رموز النشر الموثوق
مستقبلًا إلى أن يضبط مدير الحزمة التهيئة مرة أخرى.

## الأسئلة الشائعة

### يجب أن يطابق نطاق الحزمة المالك المحدد

إذا لم يتطابق نطاق الحزمة والمالك المحدد، يرفض ClawHub
النشر:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

لإصلاح ذلك، اختر إما المالك الذي يسميه نطاق الحزمة، أو أعد تسمية
الحزمة بحيث يطابق النطاق المالك الذي يمكنك النشر باسمه.

إذا كان اسم الحزمة يحتوي بالفعل على النطاق الصحيح لكن الحزمة مملوكة للناشر
الخاطئ، فانقل الملكية بدلًا من ذلك:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

استخدم نقل الحزم أو Skills فقط عندما يكون لديك وصول مسؤول إلى كل من
المالك الحالي والناشر الوجهة. لا يتيح لك نقل الحزمة
النشر داخل نطاق لا يمكنك إدارته.

إذا لم يكن لديك وصول إلى المالك الحالي لكنك تعتقد أن مؤسستك، أو مشروعك، أو
علامتك التجارية هي المالك الشرعي لمساحة الأسماء، فافتح
[مشكلة ادعاء مؤسسة / مساحة أسماء](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
مع إثبات عام وغير حساس لمراجعة الفريق. راجع
[ادعاءات المؤسسات ومساحات الأسماء](/ar/clawhub/namespace-claims) قبل الإرسال.

يحمي هذا مساحات أسماء المؤسسات. الحزمة المسماة `@openclaw/dronzer` تدعي
مساحة الأسماء `@openclaw`، لذلك لا يستطيع نشرها إلا الناشرون الذين لديهم وصول إلى مالك
`@openclaw`.
