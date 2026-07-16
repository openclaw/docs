---
read_when:
    - استخدام ClawHub لأول مرة
    - تثبيت مهارة أو Plugin من السجل
    - النشر على ClawHub
summary: 'ابدأ استخدام ClawHub: ابحث عن Skills أو Plugins وثبّتها وحدّثها وانشرها.'
x-i18n:
    generated_at: "2026-07-16T13:40:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# البدء السريع

ClawHub هو سجل لـ Skills وplugins الخاصة بـ OpenClaw.

استخدم OpenClaw عند تثبيت أشياء في OpenClaw. استخدم CLI ‏`clawhub`
عند تسجيل الدخول أو النشر أو إدارة قوائمك الخاصة أو استخدام
سير العمل الخاص بالسجل.

## العثور على Skill وتثبيتها

ابحث من OpenClaw:

```bash
openclaw skills search "calendar"
```

ثبّت Skill:

```bash
openclaw skills install @openclaw/demo
```

حدّث Skills المثبّتة:

```bash
openclaw skills update --all
```

يسجّل OpenClaw مصدر Skill حتى يمكن للتحديثات اللاحقة الاستمرار في
حلّها عبر ClawHub.

## العثور على plugin وتثبيته

ابحث من OpenClaw:

```bash
openclaw plugins search "calendar"
```

ثبّت plugin مستضافًا على ClawHub مع مصدر ClawHub صريح:

```bash
openclaw plugins install clawhub:<package>
```

حدّث plugins المثبّتة:

```bash
openclaw plugins update --all
```

استخدم البادئة `clawhub:` عندما تريد أن يحلّ OpenClaw الحزمة عبر
ClawHub بدلًا من npm أو مصدر آخر.

## تسجيل الدخول للنشر

ثبّت CLI الخاص بـ ClawHub:

```bash
npm i -g clawhub
# أو
pnpm add -g clawhub
```

سجّل الدخول باستخدام GitHub:

```bash
clawhub login
clawhub whoami
```

يمكن للبيئات عديمة الواجهة استخدام رمز API من واجهة الويب الخاصة بـ ClawHub:

```bash
clawhub login --token clh_...
```

## نشر Skill

Skill هي مجلد يحتوي على الملف الإلزامي `SKILL.md` وملفات داعمة
اختيارية.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

يتخطّى الأمر المحتوى غير المتغيّر. تبدأ Skills الجديدة بالإصدار `1.0.0`؛ وتنشر التغييرات اللاحقة
إصدار التصحيح التالي تلقائيًا. استخدم `--dry-run` للمعاينة أو
`--version` لاختيار إصدار صريح.

قبل النشر، تحقّق من البيانات الوصفية في `SKILL.md`. صرّح بمتغيرات
البيئة والأدوات والأذونات المطلوبة حتى يتمكن المستخدمون من فهم ما تحتاجه
Skill قبل تثبيتها. راجع [تنسيق Skill](/ar/clawhub/skill-format).

بالنسبة إلى المستودعات التي تحتوي على عدة Skills، يستدعي سير عمل GitHub القابل لإعادة الاستخدام
`skill publish` لكل مجلد Skill مباشر ضمن `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## نشر plugin

انشر plugin من مجلد محلي أو مستودع GitHub أو مرجع GitHub أو
أرشيف موجود:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

استخدم `--dry-run` أولًا لمعاينة البيانات الوصفية للحزمة بعد حلّها وحقول
التوافق ونَسب المصدر وخطة الرفع دون نشر.

يجب أن تتضمن plugins البرمجية بيانات توافق OpenClaw الوصفية في `package.json`،
بما في ذلك `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.

## الفحص قبل التثبيت

قبل التثبيت، استخدم صفحة الويب الخاصة بـ ClawHub أو أوامر التفاصيل في CLI لفحص
البيانات الوصفية وروابط المصدر والإصدارات وسجلات التغييرات وحالة الفحص:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

تعرض القوائم العامة أحدث حالة للفحص. قد تُخفى الإصدارات المحتجزة أو المحظورة بسبب
الإشراف من واجهات البحث والتثبيت حتى تُحل المشكلة.
