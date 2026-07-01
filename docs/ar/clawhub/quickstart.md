---
read_when:
    - استخدام ClawHub لأول مرة
    - تثبيت Skill أو Plugin من السجل
    - النشر إلى ClawHub
summary: 'ابدأ باستخدام ClawHub: ابحث عن Skills أو Plugin وثبّتها وحدّثها وانشرها.'
x-i18n:
    generated_at: "2026-07-01T08:04:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# البدء السريع

ClawHub هو سجل لمهارات OpenClaw والمكونات الإضافية.

استخدم OpenClaw عندما تثبّت أشياء داخل OpenClaw. استخدم CLI الخاص بـ `clawhub`
عند تسجيل الدخول، أو النشر، أو إدارة قوائمك الخاصة، أو استخدام
سير العمل الخاصة بالسجل.

## العثور على مهارة وتثبيتها

ابحث من OpenClaw:

```bash
openclaw skills search "calendar"
```

ثبّت مهارة:

```bash
openclaw skills install @openclaw/demo
```

حدّث المهارات المثبّتة:

```bash
openclaw skills update --all
```

يسجّل OpenClaw مصدر المهارة حتى تتمكّن التحديثات اللاحقة من الاستمرار في
الحل عبر ClawHub.

## العثور على مكوّن إضافي وتثبيته

ابحث من OpenClaw:

```bash
openclaw plugins search "calendar"
```

ثبّت مكوّنًا إضافيًا مستضافًا على ClawHub مع مصدر ClawHub صريح:

```bash
openclaw plugins install clawhub:<package>
```

حدّث المكونات الإضافية المثبّتة:

```bash
openclaw plugins update --all
```

استخدم بادئة `clawhub:` عندما تريد أن يحل OpenClaw الحزمة عبر
ClawHub بدلًا من npm أو مصدر آخر.

## تسجيل الدخول للنشر

ثبّت CLI الخاص بـ ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

سجّل الدخول باستخدام GitHub:

```bash
clawhub login
clawhub whoami
```

يمكن للبيئات التي لا تحتوي على واجهة تفاعلية استخدام رمز API من واجهة ويب ClawHub:

```bash
clawhub login --token clh_...
```

## نشر مهارة

المهارة هي مجلد يحتوي على ملف `SKILL.md` مطلوب وملفات داعمة
اختيارية.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

يتخطى الأمر المحتوى غير المتغيّر. تبدأ المهارات الجديدة من `1.0.0`؛ وتنشر
التغييرات اللاحقة تلقائيًا إصدار التصحيح التالي. استخدم `--dry-run` للمعاينة أو
`--version` لاختيار إصدار صريح.

قبل النشر، تحقّق من البيانات الوصفية في `SKILL.md`. صرّح عن
متغيرات البيئة والأدوات والأذونات المطلوبة حتى يتمكّن المستخدمون من فهم ما
تحتاجه المهارة قبل تثبيتها. راجع [تنسيق المهارة](/ar/clawhub/skill-format).

بالنسبة إلى المستودعات التي تحتوي على مهارات متعددة، يستدعي سير عمل GitHub القابل لإعادة الاستخدام
`skill publish` لكل مجلد مهارة مباشر ضمن `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## نشر مكوّن إضافي

انشر مكوّنًا إضافيًا من مجلد محلي، أو مستودع GitHub، أو مرجع GitHub، أو
أرشيف موجود:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

استخدم `--dry-run` أولًا لمعاينة بيانات تعريف الحزمة المحلولة، وحقول التوافق،
وإسناد المصدر، وخطة الرفع من دون النشر.

يجب أن تتضمن مكونات التعليمات البرمجية الإضافية بيانات توافق OpenClaw الوصفية في `package.json`،
بما في ذلك `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.

## الفحص قبل التثبيت

قبل التثبيت، استخدم صفحة ويب ClawHub أو أوامر التفاصيل في CLI لفحص
البيانات الوصفية، وروابط المصدر، والإصدارات، وسجلات التغييرات، وحالة الفحص:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

تعرض القوائم العامة أحدث حالة فحص. قد تُخفى الإصدارات المعلّقة أو المحظورة بسبب
الإشراف من واجهات البحث والتثبيت حتى يتم حلّها.
