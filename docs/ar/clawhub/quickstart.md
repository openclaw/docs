---
read_when:
    - استخدام ClawHub لأول مرة
    - تثبيت مهارة أو Plugin من السجل
    - النشر إلى ClawHub
summary: 'ابدأ باستخدام ClawHub: ابحث عن Skills أو Plugins وثبّتها وحدّثها وانشرها.'
x-i18n:
    generated_at: "2026-05-12T12:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# البدء السريع

ClawHub هو سجلّ لمهارات OpenClaw والإضافات.

استخدم OpenClaw عندما تثبّت أشياء داخل OpenClaw. استخدم واجهة `clawhub` CLI
عند تسجيل الدخول أو النشر أو إدارة قوائمك الخاصة أو استخدام
سير عمل خاصة بالسجل.

## العثور على مهارة وتثبيتها

ابحث من OpenClaw:

```bash
openclaw skills search "calendar"
```

ثبّت مهارة:

```bash
openclaw skills install <skill-slug>
```

حدّث المهارات المثبّتة:

```bash
openclaw skills update --all
```

يسجّل OpenClaw مصدر المهارة بحيث يمكن للتحديثات اللاحقة أن تستمر في
الحل عبر ClawHub.

## العثور على Plugin وتثبيته

ابحث من OpenClaw:

```bash
openclaw plugins search "calendar"
```

ثبّت Plugin مستضافًا على ClawHub باستخدام مصدر ClawHub صريح:

```bash
openclaw plugins install clawhub:<package>
```

حدّث الإضافات المثبّتة:

```bash
openclaw plugins update --all
```

استخدم البادئة `clawhub:` عندما تريد من OpenClaw حل الحزمة عبر
ClawHub بدلًا من npm أو مصدر آخر.

## تسجيل الدخول للنشر

ثبّت ClawHub CLI:

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

يمكن للبيئات غير التفاعلية استخدام رمز API من واجهة الويب في ClawHub:

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
  --version 1.0.0 \
  --changelog "Initial release"
```

قبل النشر، تحقق من البيانات الوصفية في `SKILL.md`. صرّح بمتغيرات
البيئة والأدوات والأذونات المطلوبة حتى يفهم المستخدمون ما تحتاجه
المهارة قبل تثبيتها. راجع [تنسيق المهارة](/ar/clawhub/skill-format).

## نشر Plugin

انشر Plugin من مجلد محلي، أو مستودع GitHub، أو مرجع GitHub، أو
أرشيف موجود:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

استخدم `--dry-run` أولًا لمعاينة بيانات وصف الحزمة التي تم حلها، وحقول
التوافق، ونَسب المصدر، وخطة الرفع دون النشر.

يجب أن تتضمن Plugins البرمجية بيانات وصفية للتوافق مع OpenClaw في `package.json`،
بما في ذلك `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.

## مزامنة المهارات التي تصونها

يفحص `sync` مجلدات المهارات وينشر المهارات الجديدة أو المعدّلة التي لم
تتم مزامنتها بالفعل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

عندما تكون مسجّل الدخول، قد يرسل `sync` أيضًا لقطة تثبيت مصغّرة
لأعداد التثبيت الإجمالية. راجع [القياس عن بُعد](/ar/clawhub/telemetry) لمعرفة ما يتم الإبلاغ عنه
وكيفية إلغاء الاشتراك.

## الفحص قبل التثبيت

قبل التثبيت، استخدم صفحة الويب في ClawHub أو أوامر التفاصيل في CLI لفحص
البيانات الوصفية وروابط المصدر والإصدارات وسجلات التغيير وحالة الفحص:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

تعرض القوائم العامة أحدث حالة فحص. قد تُخفى الإصدارات المحتجزة أو المحظورة بسبب
الإشراف من واجهات البحث والتثبيت إلى أن تُحل.
