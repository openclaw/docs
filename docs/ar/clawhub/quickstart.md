---
read_when:
    - المرة الأولى لاستخدام ClawHub
    - تثبيت مهارة أو Plugin من السجل
    - النشر إلى ClawHub
summary: 'ابدأ باستخدام ClawHub: اعثر على Skills أو Plugins وثبّتها وحدّثها وانشرها.'
x-i18n:
    generated_at: "2026-05-11T22:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# البدء السريع

ClawHub هو سجل لمهارات OpenClaw وإضافاته.

استخدم OpenClaw عندما تثبّت أشياء داخل OpenClaw. استخدم CLI الخاص بـ `clawhub`
عندما تسجّل الدخول، أو تنشر، أو تدير قوائمك الخاصة، أو تستخدم
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

يسجّل OpenClaw مصدر المهارة بحيث يمكن للتحديثات اللاحقة الاستمرار في
حلّها عبر ClawHub.

## العثور على إضافة وتثبيتها

ابحث من OpenClaw:

```bash
openclaw plugins search "calendar"
```

ثبّت إضافة مستضافة على ClawHub مع مصدر ClawHub صريح:

```bash
openclaw plugins install clawhub:<package>
```

حدّث الإضافات المثبّتة:

```bash
openclaw plugins update --all
```

استخدم البادئة `clawhub:` عندما تريد أن يحل OpenClaw الحزمة عبر
ClawHub بدلا من npm أو مصدر آخر.

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
البيئة والأدوات والأذونات المطلوبة حتى يتمكن المستخدمون من فهم ما
تحتاجه المهارة قبل تثبيتها. راجع [تنسيق المهارة](/ar/clawhub/skill-format).

## نشر إضافة

انشر إضافة من مجلد محلي، أو مستودع GitHub، أو مرجع GitHub، أو
أرشيف موجود:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

استخدم `--dry-run` أولا لمعاينة بيانات الحزمة الوصفية التي تم حلّها، وحقول
التوافق، ونسبة المصدر، وخطة الرفع دون نشر.

يجب أن تتضمن إضافات الكود بيانات وصفية لتوافق OpenClaw في `package.json`،
بما في ذلك `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`.

## مزامنة المهارات التي تصونها

يفحص `sync` مجلدات المهارات وينشر المهارات الجديدة أو المتغيرة التي لم
تتم مزامنتها بالفعل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

عندما تكون مسجّل الدخول، قد يرسل `sync` أيضا لقطة تثبيت مصغرة
لإجمالي أعداد التثبيت. راجع [القياس عن بعد](/ar/clawhub/telemetry) لمعرفة ما يتم الإبلاغ عنه
وكيفية إلغاء الاشتراك.

## الفحص قبل التثبيت

قبل التثبيت، استخدم صفحة ويب ClawHub أو أوامر التفاصيل في CLI لفحص
البيانات الوصفية وروابط المصدر والإصدارات وسجلات التغيير وحالة الفحص:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

تعرض القوائم العامة أحدث حالة فحص. قد تُخفى الإصدارات المحتجزة أو المحظورة بواسطة
الإشراف من أسطح البحث والتثبيت حتى يتم حلها.
