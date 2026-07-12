---
read_when:
    - استخدام ClawHub لأول مرة
    - تثبيت Skill أو Plugin من السجل
    - النشر على ClawHub
summary: 'ابدأ باستخدام ClawHub: ابحث عن Skills أو Plugins وثبّتها وحدّثها وانشرها.'
x-i18n:
    generated_at: "2026-07-12T05:39:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# البدء السريع

ClawHub هو سجلّ لـ Skills وplugins الخاصة بـ OpenClaw.

استخدم OpenClaw عند تثبيت مكوّنات داخل OpenClaw. واستخدم CLI ‏`clawhub`
عند تسجيل الدخول أو النشر أو إدارة قوائمك الخاصة أو استخدام
سير العمل الخاص بالسجلّ.

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

يسجّل OpenClaw مصدر Skill كي تتمكن التحديثات اللاحقة من مواصلة
حلّها عبر ClawHub.

## العثور على Plugin وتثبيته

ابحث من OpenClaw:

```bash
openclaw plugins search "calendar"
```

ثبّت Plugin مستضافًا على ClawHub باستخدام مصدر ClawHub صريح:

```bash
openclaw plugins install clawhub:<package>
```

حدّث Plugins المثبّتة:

```bash
openclaw plugins update --all
```

استخدم البادئة `clawhub:` عندما تريد من OpenClaw حلّ الحزمة عبر
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

يمكن للبيئات غير التفاعلية استخدام رمز API من واجهة الويب الخاصة بـ ClawHub:

```bash
clawhub login --token clh_...
```

## نشر Skill

Skill هي مجلد يحتوي على ملف `SKILL.md` مطلوب وملفات داعمة
اختيارية.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

يتخطى الأمر المحتوى غير المتغيّر. تبدأ Skills الجديدة بالإصدار `1.0.0`؛ وتنشر التغييرات اللاحقة
تلقائيًا إصدار التصحيح التالي. استخدم `--dry-run` للمعاينة أو
`--version` لاختيار إصدار محدد.

قبل النشر، تحقّق من البيانات الوصفية في `SKILL.md`. صرّح عن
متغيرات البيئة والأدوات والأذونات المطلوبة كي يفهم المستخدمون ما تحتاج إليه
Skill قبل تثبيتها. راجع [تنسيق Skill](/ar/clawhub/skill-format).

بالنسبة إلى المستودعات التي تحتوي على عدة Skills، يستدعي سير عمل GitHub القابل لإعادة الاستخدام
الأمر `skill publish` لكل مجلد Skill مباشر ضمن `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## نشر Plugin

انشر Plugin من مجلد محلي أو مستودع GitHub أو مرجع GitHub أو
أرشيف موجود:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

استخدم `--dry-run` أولًا لمعاينة البيانات الوصفية المحلولة للحزمة وحقول
التوافق وإسناد المصدر وخطة الرفع من دون نشر.

يجب أن تتضمن Plugins البرمجية بيانات وصفية للتوافق مع OpenClaw في `package.json`،
بما في ذلك `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.

## الفحص قبل التثبيت

قبل التثبيت، استخدم صفحة الويب الخاصة بـ ClawHub أو أوامر التفاصيل في CLI لفحص
البيانات الوصفية وروابط المصدر والإصدارات وسجلات التغييرات وحالة الفحص:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

تعرض القوائم العامة أحدث حالة فحص. قد تُخفى الإصدارات المعلّقة أو المحظورة بسبب
الإشراف من واجهات البحث والتثبيت حتى تُحل المشكلة.
