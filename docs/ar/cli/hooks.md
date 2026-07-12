---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد التحقق من توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-07-12T05:42:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

إدارة خطافات الوكيل (عمليات أتمتة مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل Gateway). يعادل الأمر `openclaw hooks` دون خيارات الأمر `openclaw hooks list`.

راجع أيضًا: [الخطافات](/ar/automation/hooks) - [خطافات Plugin](/ar/plugins/hooks)

## سرد الخطافات

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

يسرد الخطافات المكتشفة في أدلة مساحة العمل والأدلة المُدارة والإضافية والمضمّنة.

- `--eligible`: الخطافات التي استُوفيت متطلباتها فقط.
- `--json`: مخرجات منظّمة.
- `-v, --verbose`: تضمين عمود للمتطلبات المفقودة التي لم تُستوفَ.

```
الخطافات (4/5 جاهزة)

جاهزة:
  🚀 boot-md ✓ - تشغيل BOOT.md عند بدء تشغيل Gateway
  📎 bootstrap-extra-files ✓ - إدراج ملفات تمهيد إضافية لمساحة العمل أثناء تمهيد الوكيل
  📝 command-logger ✓ - تسجيل جميع أحداث الأوامر في ملف تدقيق مركزي
  💾 session-memory ✓ - حفظ سياق الجلسة في الذاكرة عند إصدار الأمر /new أو /reset
```

## الحصول على معلومات الخطاف

```bash
openclaw hooks info <name> [--json]
```

يمثّل `<name>` اسم الخطاف أو مفتاحه (مثل `session-memory`). يعرض المصدر ومسارات الملف/المعالج والصفحة الرئيسية والأحداث وحالة كل متطلب (الملفات التنفيذية والبيئة والإعدادات ونظام التشغيل).

## التحقق من الأهلية

```bash
openclaw hooks check [--json]
```

يطبع ملخصًا لأعداد الخطافات الجاهزة وغير الجاهزة؛ وعند وجود خطافات غير جاهزة، يسرد كل خطاف مع سبب منعه.

## تمكين خطاف

```bash
openclaw hooks enable <name>
```

يضيف أو يحدّث `hooks.internal.entries.<name>.enabled = true` في الإعدادات، ويفعّل أيضًا المفتاح الرئيسي `hooks.internal.enabled` (لا يحمّل Gateway أي معالج خطاف داخلي حتى تتم تهيئة خطاف واحد على الأقل). يفشل الأمر إذا كان الخطاف غير موجود، أو مُدارًا بواسطة Plugin، أو غير مؤهل (بسبب متطلبات مفقودة).

تُظهر الخطافات المُدارة بواسطة Plugin القيمة `plugin:<id>` في `hooks list`، ولا يمكن تمكينها أو تعطيلها هنا؛ مكّن Plugin المالك أو عطّله بدلًا من ذلك.

أعد تشغيل Gateway بعد التمكين (بإعادة تشغيل تطبيق شريط القوائم في macOS، أو إعادة تشغيل عملية Gateway في بيئة التطوير) لكي يعيد تحميل الخطافات.

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

يضبط `hooks.internal.entries.<name>.enabled = false`. أعد تشغيل Gateway بعد ذلك.

## تثبيت حزم الخطافات وتحديثها

```bash
openclaw plugins install <package>        # npm افتراضيًا
openclaw plugins install npm:<package>    # npm فقط
openclaw plugins install <package> --pin  # تثبيت الإصدار المحلول
openclaw plugins install <path>           # دليل محلي أو أرشيف
openclaw plugins install -l <path>        # ربط دليل محلي بدلًا من نسخه

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

تُثبّت حزم الخطافات وتُحدّث عبر أداة تثبيت Plugins وتحديثها الموحّدة؛ ولا يزال `openclaw hooks install` و`openclaw hooks update` يعملان كاسمين مستعارين مهملين يطبعان تحذيرًا ويمرران التنفيذ إلى أوامر `plugins`.

- تقتصر مواصفات npm على السجل: اسم الحزمة مع إصدار دقيق اختياري أو وسم توزيع. تُرفض مواصفات Git وعناوين URL والملفات ونطاقات semver. تُثبّت التبعيات محليًا داخل المشروع باستخدام `--ignore-scripts`.
- تبقى المواصفات المجردة و`@latest` ضمن المسار المستقر؛ وإذا حلّ npm إصدارًا تجريبيًا، يتوقف OpenClaw ويطلب منك الاشتراك فيه صراحةً (`@beta` أو `@rc` أو إصدار تجريبي دقيق).
- الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`.
- يربط `-l, --link` دليلًا محليًا بدلًا من نسخه (ويضيفه إلى `hooks.internal.load.extraDirs`)؛ حزم الخطافات المرتبطة هي خطافات مُدارة من دليل أعدّه المشغّل، وليست خطافات مساحة العمل.
- يسجّل `--pin` عمليات تثبيت npm بالصيغة الدقيقة المحلولة `name@version` في `hooks.internal.installs`.
- ينسخ التثبيت الحزمة إلى `~/.openclaw/hooks/<id>`، ويمكّن خطافاتها ضمن `hooks.internal.entries.*`، ويسجّل التثبيت ضمن `hooks.internal.installs`.
- إذا لم تعد بصمة التكامل المخزّنة تطابق العنصر المُجلَب، يحذّر OpenClaw ويطلب التأكيد قبل المتابعة؛ مرّر الخيار العام `--yes` لتجاوز الطلب (على سبيل المثال في CI).

## الخطافات المضمّنة

| الخطاف               | الأحداث                                           | وظيفته                                                                                          |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| boot-md              | `gateway:startup`                                 | يشغّل `BOOT.md` عند بدء تشغيل Gateway لكل نطاق وكيل مُهيأ                                      |
| bootstrap-extra-files | `agent:bootstrap`                                | يدرج ملفات تمهيد إضافية (مثل `AGENTS.md`/`TOOLS.md` في مستودع أحادي) أثناء تمهيد الوكيل         |
| command-logger       | `command`                                         | يسجّل أحداث الأوامر في `~/.openclaw/logs/commands.log`                                          |
| compaction-notifier  | `session:compact:before`, `session:compact:after` | يرسل إشعارات مرئية في المحادثة عند بدء Compaction للجلسة وانتهائه                               |
| session-memory       | `command:new`, `command:reset`                    | يحفظ سياق الجلسة في الذاكرة عند `/new` أو `/reset`                                              |

مكّن أي خطاف مضمّن باستخدام `openclaw hooks enable <hook-name>`. للاطلاع على التفاصيل الكاملة ومفاتيح الإعدادات والقيم الافتراضية: [الخطافات المضمّنة](/ar/automation/hooks#bundled-hooks).

### ملف سجل command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # الأوامر الأخيرة
cat ~/.openclaw/logs/commands.log | jq .          # طباعة منسقة
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # التصفية حسب الإجراء
```

## ملاحظات

- تكتب `hooks list --json` و`info --json` و`check --json` بيانات JSON المنظّمة مباشرةً إلى المخرجات القياسية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [خطافات الأتمتة](/ar/automation/hooks)
