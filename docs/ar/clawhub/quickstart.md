---
read_when:
    - استخدام ClawHub لأول مرة
    - تثبيت Skill أو Plugin من السجل
    - النشر إلى ClawHub
summary: 'ابدأ استخدام ClawHub: ابحث عن Skills أو Plugins وثبّتها وحدّثها وانشرها.'
x-i18n:
    generated_at: "2026-05-12T04:09:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# البدء السريع

ClawHub هو سجلّ لمهارات OpenClaw وPlugins الخاصة به.

استخدم OpenClaw عندما تثبّت أشياء داخل OpenClaw. استخدم CLI الخاص بـ `clawhub`
عند تسجيل الدخول، أو النشر، أو إدارة قوائمك الخاصة، أو استخدام
سير عمل خاصة بالسجل.

## العثور على Skill وتثبيتها

ابحث من OpenClaw:

```bash
openclaw skills search "calendar"
```

ثبّت Skill:

```bash
openclaw skills install <skill-slug>
```

حدّث Skills المثبّتة:

```bash
openclaw skills update --all
```

يسجّل OpenClaw مصدر Skill حتى تتمكّن التحديثات اللاحقة من متابعة
الحل عبر ClawHub.

## العثور على Plugin وتثبيته

ابحث من OpenClaw:

```bash
openclaw plugins search "calendar"
```

ثبّت Plugin مستضافًا على ClawHub مع مصدر ClawHub صريح:

```bash
openclaw plugins install clawhub:<package>
```

حدّث Plugins المثبّتة:

```bash
openclaw plugins update --all
```

استخدم البادئة `clawhub:` عندما تريد أن يحل OpenClaw الحزمة عبر
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

يمكن للبيئات بلا واجهة استخدام رمز API من واجهة ويب ClawHub:

```bash
clawhub login --token clh_...
```

## نشر Skill

Skill هي مجلد يحتوي على ملف `SKILL.md` مطلوب وملفات دعم
اختيارية.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

قبل النشر، تحقّق من البيانات الوصفية في `SKILL.md`. صرّح بمتغيرات
البيئة والأدوات والأذونات المطلوبة حتى يتمكّن المستخدمون من فهم ما
تحتاجه Skill قبل تثبيتها. راجع [تنسيق Skill](/ar/clawhub/skill-format).

## نشر Plugin

انشر Plugin من مجلد محلي، أو مستودع GitHub، أو مرجع GitHub، أو
أرشيف موجود:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

استخدم `--dry-run` أولًا لمعاينة بيانات الحزمة الوصفية التي تم حلها، وحقول
التوافق، وإسناد المصدر، وخطة الرفع دون نشر.

يجب أن تتضمن Plugins البرمجية بيانات وصفية لتوافق OpenClaw في `package.json`،
بما في ذلك `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.

## مزامنة Skills التي تصونها

يفحص `sync` مجلدات Skills وينشر Skills الجديدة أو المتغيرة التي لم تتم
مزامنتها بالفعل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

عند تسجيل الدخول، قد يرسل `sync` أيضًا لقطة تثبيت محدودة لأعداد التثبيت
الإجمالية. راجع [القياس عن بُعد](/ar/clawhub/telemetry) لمعرفة ما يتم الإبلاغ عنه
وكيفية إلغاء الاشتراك.

## الفحص قبل التثبيت

قبل التثبيت، استخدم صفحة ويب ClawHub أو أوامر التفاصيل في CLI لفحص
البيانات الوصفية، وروابط المصدر، والإصدارات، وسجلات التغييرات، وحالة الفحص:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

تعرض القوائم العامة أحدث حالة فحص. قد تُخفى الإصدارات المعلّقة أو المحظورة
بسبب الإشراف من أسطح البحث والتثبيت حتى يتم حلها.
