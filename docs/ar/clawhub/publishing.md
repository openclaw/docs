---
read_when:
    - نشر Skill أو Plugin
    - تصحيح أخطاء نطاق المالك أو الحزمة
    - إضافة سلوك النشر في واجهة المستخدم أو CLI أو الواجهة الخلفية
summary: كيفية عمل النشر في ClawHub بالنسبة إلى المهارات والإضافات والمالكين والنطاقات والإصدارات والمراجعة.
x-i18n:
    generated_at: "2026-07-12T05:38:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# النشر

يرسل النشر مجلد Skill أو حزمة Plugin إلى ClawHub تحت المالك الذي
تختاره. يتحقق ClawHub من أن رمزك المميز يتيح النشر لذلك المالك، ويتحقق من صحة
البيانات الوصفية والاسم والإصدار والملفات ومعلومات المصدر، ثم يخزّن الإصدار
ويبدأ فحوصات الأمان الآلية.

إذا فشل التحقق، فلن يُنشر شيء. وقد تظل الإصدارات الجديدة أيضًا خارج
واجهات التثبيت والتنزيل المعتادة حتى تنتهي المراجعة.

## Skills

أبسط مسار للنشر هو CLI. سجّل الدخول، ثم انشر مجلد Skill محليًا:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

استخدم `--owner <handle>` عند النشر باسم مالك مؤسسة. احذفه للنشر باسم
المستخدم المصادَق عليه. يتخطى النشر المحتوى غير المتغير. تبدأ Skill جديدة
بالإصدار `1.0.0`، وتنشر التغييرات اللاحقة تلقائيًا إصدار التصحيح التالي. مرّر
`--version` فقط عندما تحتاج إلى إصدار محدد صراحةً.

بالنسبة إلى مستودعات الكتالوجات، استخدم
[سير عمل `skill-publish.yml` القابل لإعادة الاستخدام في ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
يستدعي `skill publish` لكل مجلد Skill مباشر ضمن `root` (القيمة الافتراضية:
`skills`)، أو للمجلد الممرر في `skill_path` فقط.

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

استخدم `dry_run: true` لمعاينة Skills الجديدة والمتغيرة من دون نشرها.

## Plugins

تستخدم Plugins أسماء حزم بنمط npm. تتضمن أسماء الحزم ذات النطاق المالك في
الجزء الأول من الاسم:

```text
@owner/package-name
```

يجب أن يتطابق النطاق مع مالك النشر المحدد. إذا كان اسم حزمتك
`@openclaw/dronzer`، فلا يمكن نشرها إلا باسم `@openclaw`. وإذا نشرت باسم
`@vintageayu`، فأعد تسمية الحزمة إلى `@vintageayu/dronzer`.

يمنع هذا الحزمة من المطالبة بنطاق أسماء مؤسسة لا يتحكم فيه الناشر.

إذا كنت المالك الشرعي لمؤسسة أو علامة تجارية أو نطاق حزمة أو معرّف مالك أو
نطاق أسماء محجوز أو مُطالَب به بالفعل على ClawHub، فافتح
[بلاغ مطالبة بمؤسسة / نطاق أسماء](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
مع إثبات علني غير حساس. راجع
[مطالبات المؤسسات ونطاقات الأسماء](/clawhub/namespace-claims) لمعرفة ما يجب تضمينه وما
يجب إبقاؤه خارج البلاغات العامة.

### قبل نشر Plugin

- اختر مالكًا يطابق نطاق الحزمة.
- ضمّن `openclaw.plugin.json`. تحتاج Plugins البرمجية أيضًا إلى `package.json` يتضمن
  `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.
- لعرض أيقونة مخصصة لبطاقة Plugin، أضف `icon` إلى `openclaw.plugin.json` مع
  أي عنوان URL لصورة عبر HTTPS.
- ضمّن مستودع المصدر والبيانات الوصفية للالتزام المحدد، أو استخدم CLI من نسخة عمل
  مستندة إلى GitHub حتى يتمكن من اكتشافهما.
- شغّل `clawhub package validate <source>` قبل النشر. لمعالجة النتائج المتعلقة بالحزمة
  أو البيان أو استيراد SDK أو الأثر، راجع
  [إصلاحات التحقق من Plugin](/clawhub/plugin-validation-fixes).
- شغّل `clawhub package publish <source> --dry-run` قبل إنشاء إصدار.
- توقّع أن تظل الإصدارات الجديدة خارج واجهات التثبيت العامة حتى تنتهي
  فحوصات الأمان الآلية وعملية التحقق.

### النشر الموثوق للحزم

يتطلب إعداد النشر الموثوق للحزم خطوتين:

1. انشر الحزمة مرة واحدة عبر الأمر اليدوي المعتاد أو المصادقة بالرمز المميز
   `clawhub package publish`. ينشئ هذا سجل الحزمة ويحدد
   مديري الحزمة الذين يمكنهم تغيير إعدادات الناشر الموثوق بها.
2. يضبط مدير الحزمة إعدادات الناشر الموثوق به في GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

بعد ضبط الإعدادات، يمكن لعمليات النشر المدعومة مستقبلًا عبر GitHub Actions استخدام
OIDC/النشر الموثوق من دون تخزين رمز ClawHub مميز طويل الأجل في
المستودع. يجب أن يتطابق المستودع واسم ملف سير العمل المضبوطان مع
مطالبة OIDC في GitHub Actions. وإذا مرّرت أيضًا `--environment <name>`، فيجب أن
تتطابق مطالبة بيئة GitHub Actions مع ذلك الاسم تمامًا.

يتحقق ClawHub من مستودع GitHub المضبوط عند تعيين إعدادات الناشر الموثوق به.
يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة.
تتطلب المستودعات الخاصة أن يمتلك ClawHub صلاحية الوصول إلى ذلك المستودع،
على سبيل المثال عبر تثبيت مستقبلي لتطبيق ClawHub على GitHub أو تكامل
مصرّح به آخر مع GitHub.

يدعم سير عمل نشر الحزم القابل لإعادة الاستخدام حاليًا النشر الموثوق
من دون أسرار لعمليات النشر عبر `workflow_dispatch` عندما يكون `id-token: write`
متاحًا. لا تزال عمليات النشر الفعلية عند دفع الوسوم تحتاج إلى `clawhub_token`، لذا أبقِ
`CLAWHUB_TOKEN` متاحًا لإصدارات الوسوم وعمليات النشر الأولى والحزم غير الموثوقة
أو عمليات النشر الطارئة.

افحص الإعدادات أو أزلها باستخدام:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

حذف إعدادات الناشر الموثوق به هو مسار التراجع. فهو يعطّل إصدار رموز
النشر الموثوق المستقبلية حتى يضبط مدير الحزمة الإعدادات مجددًا.

## الأسئلة الشائعة

### يجب أن يتطابق نطاق الحزمة مع المالك المحدد

إذا لم يتطابق نطاق الحزمة مع المالك المحدد، يرفض ClawHub
النشر:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

لإصلاح ذلك، اختر المالك الذي يحدده نطاق الحزمة، أو أعد تسمية
الحزمة بحيث يتطابق النطاق مع المالك الذي يمكنك النشر باسمه.

إذا كان اسم الحزمة يحمل النطاق الصحيح بالفعل، لكن الحزمة مملوكة
للناشر الخطأ، فانقل الملكية بدلًا من ذلك:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

لا تستخدم نقل الحزمة أو Skill إلا عندما تكون لديك صلاحية مسؤول لدى كل من
المالك الحالي والناشر الوجهة. لا يتيح لك نقل الحزمة
النشر ضمن نطاق لا يمكنك إدارته.

إذا لم تكن لديك صلاحية الوصول إلى المالك الحالي، لكنك تعتقد أن مؤسستك أو مشروعك أو
علامتك التجارية هي المالك الشرعي لنطاق الأسماء، فافتح
[بلاغ مطالبة بمؤسسة / نطاق أسماء](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
مع إثبات علني غير حساس لمراجعة فريق العمل. راجع
[مطالبات المؤسسات ونطاقات الأسماء](/clawhub/namespace-claims) قبل تقديم البلاغ.

يحمي هذا نطاقات أسماء المؤسسات. تطالب الحزمة المسماة `@openclaw/dronzer`
بنطاق الأسماء `@openclaw`، ولذلك لا يمكن نشرها إلا بواسطة الناشرين الذين لديهم صلاحية الوصول
إلى المالك `@openclaw`.
