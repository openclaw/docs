---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-04-26T11:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

إدارة خطافات الوكيل (أتمتة مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل Gateway).

يُعادل تشغيل `openclaw hooks` بدون أي أمر فرعي تشغيل `openclaw hooks list`.

ذو صلة:

- الخطافات: [الخطافات](/ar/automation/hooks)
- Plugin hooks: [Plugin hooks](/ar/plugins/hooks)

## عرض جميع الخطافات

```bash
openclaw hooks list
```

اعرض جميع الخطافات المكتشفة من أدلة مساحة العمل، والمدارة، والإضافية، والمضمّنة.
لا يقوم بدء تشغيل Gateway بتحميل معالجات الخطافات الداخلية حتى تتم تهيئة خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: عرض الخطافات المؤهلة فقط (التي استوفت المتطلبات)
- `--json`: إخراج بصيغة JSON
- `-v, --verbose`: عرض معلومات تفصيلية بما في ذلك المتطلبات الناقصة

**مثال على المخرجات:**

```
الخطافات (4/4 جاهزة)

جاهزة:
  🚀 boot-md ✓ - تشغيل BOOT.md عند بدء تشغيل Gateway
  📎 bootstrap-extra-files ✓ - حقن ملفات bootstrap إضافية لمساحة العمل أثناء bootstrap الوكيل
  📝 command-logger ✓ - تسجيل جميع أحداث الأوامر في ملف تدقيق مركزي
  💾 session-memory ✓ - حفظ سياق الجلسة في الذاكرة عند إصدار الأمر /new أو /reset
```

**مثال (مفصل):**

```bash
openclaw hooks list --verbose
```

يعرض المتطلبات الناقصة للخطافات غير المؤهلة.

**مثال (JSON):**

```bash
openclaw hooks list --json
```

يعيد JSON منظّمًا للاستخدام البرمجي.

## الحصول على معلومات خطاف

```bash
openclaw hooks info <name>
```

اعرض معلومات تفصيلية عن خطاف معيّن.

**الوسائط:**

- `<name>`: اسم الخطاف أو مفتاح الخطاف (مثل `session-memory`)

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال:**

```bash
openclaw hooks info session-memory
```

**المخرجات:**

```
💾 session-memory ✓ جاهز

حفظ سياق الجلسة في الذاكرة عند إصدار الأمر /new أو /reset

التفاصيل:
  المصدر: openclaw-bundled
  المسار: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  المعالج: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  الصفحة الرئيسية: https://docs.openclaw.ai/automation/hooks#session-memory
  الأحداث: command:new, command:reset

المتطلبات:
  الإعدادات: ✓ workspace.dir
```

## التحقق من أهلية الخطافات

```bash
openclaw hooks check
```

اعرض ملخصًا لحالة أهلية الخطافات (كم خطافًا جاهزًا مقابل غير الجاهز).

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال على المخرجات:**

```
حالة الخطافات

إجمالي الخطافات: 4
جاهزة: 4
غير جاهزة: 0
```

## تمكين خطاف

```bash
openclaw hooks enable <name>
```

قم بتمكين خطاف معيّن بإضافته إلى إعداداتك (افتراضيًا `~/.openclaw/openclaw.json`).

**ملاحظة:** تكون خطافات مساحة العمل معطّلة افتراضيًا حتى يتم تمكينها هنا أو في الإعدادات. وتعرض الخطافات التي تديرها Plugins `plugin:<id>` في `openclaw hooks list` ولا يمكن تمكينها/تعطيلها هنا. قم بتمكين/تعطيل Plugin نفسها بدلًا من ذلك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**المخرجات:**

```
✓ تم تمكين الخطاف: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق مما إذا كان الخطاف موجودًا ومؤهلًا
- يحدّث `hooks.internal.entries.<name>.enabled = true` في إعداداتك
- يحفظ الإعدادات على القرص

إذا كان الخطاف مصدره `<workspace>/hooks/`، فهذه الخطوة الاختيارية مطلوبة قبل
أن يقوم Gateway بتحميله.

**بعد التمكين:**

- أعد تشغيل Gateway حتى تُعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القوائم على macOS، أو أعد تشغيل عملية Gateway في بيئة التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

عطّل خطافًا معيّنًا عبر تحديث إعداداتك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**المخرجات:**

```
⏸ تم تعطيل الخطاف: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل Gateway حتى تُعاد تحميل الخطافات

## ملاحظات

- تقوم `openclaw hooks list --json` و`info --json` و`check --json` بكتابة JSON منظّم مباشرةً إلى stdout.
- لا يمكن تمكين أو تعطيل الخطافات التي تديرها Plugins هنا؛ قم بتمكين أو تعطيل Plugin المالكة بدلًا من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # ClawHub أولًا، ثم npm
openclaw plugins install <package> --pin  # تثبيت الإصدار
openclaw plugins install <path>           # مسار محلي
```

ثبّت حزم الخطافات عبر مثبّت Plugins الموحّد.

لا يزال `openclaw hooks install` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير تقادم ثم يعيد التوجيه إلى `openclaw plugins install`.

تكون مواصفات npm **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو
**dist-tag**). ويتم رفض مواصفات Git/URL/file ونطاقات semver. وتعمل عمليات
تثبيت التبعيات محليًا على مستوى المشروع مع `--ignore-scripts` من أجل الأمان،
حتى عندما تكون لدى shell لديك إعدادات تثبيت npm عامة.

تبقى المواصفات المجردة و`@latest` على المسار المستقر. وإذا قام npm بحل أيٍّ
منهما إلى prerelease، فإن OpenClaw يتوقف ويطلب منك الاشتراك الصريح باستخدام
وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease دقيق.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يفعّل الخطافات المثبّتة في `hooks.internal.entries.*`
- يسجّل التثبيت ضمن `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلًا من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل تثبيتات npm على شكل `name@version` محلول بدقة في `hooks.internal.installs`

**الأرشيفات المدعومة:** `.zip` و`.tgz` و`.tar.gz` و`.tar`

**أمثلة:**

```bash
# دليل محلي
openclaw plugins install ./my-hook-pack

# أرشيف محلي
openclaw plugins install ./my-hook-pack.zip

# حزمة NPM
openclaw plugins install @openclaw/my-hook-pack

# ربط دليل محلي بدون نسخ
openclaw plugins install -l ./my-hook-pack
```

تُعامَل حزم الخطافات المرتبطة على أنها خطافات مُدارة من دليل
مهيأ من قبل المشغّل، وليس كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المعتمدة على npm والمتتبعة عبر أداة تحديث Plugins الموحّدة.

لا يزال `openclaw hooks update` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير تقادم ثم يعيد التوجيه إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث جميع حزم الخطافات المتتبعة
- `--dry-run`: عرض ما سيتغير دون كتابة

عند وجود hash سلامة مخزّن وتغيّر hash العنصر الذي تم جلبه،
يطبع OpenClaw تحذيرًا ويطلب التأكيد قبل المتابعة. استخدم
الخيار العام `--yes` لتجاوز المطالبات في تشغيلات CI/غير التفاعلية.

## الخطافات المضمّنة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**التمكين:**

```bash
openclaw hooks enable session-memory
```

**المخرجات:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**راجع:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات bootstrap إضافية (مثل `AGENTS.md` / `TOOLS.md` المحلية في monorepo) أثناء `agent:bootstrap`.

**التمكين:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**راجع:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجل جميع أحداث الأوامر في ملف تدقيق مركزي.

**التمكين:**

```bash
openclaw hooks enable command-logger
```

**المخرجات:** `~/.openclaw/logs/commands.log`

**عرض السجلات:**

```bash
# الأوامر الأخيرة
tail -n 20 ~/.openclaw/logs/commands.log

# تنسيق جميل
cat ~/.openclaw/logs/commands.log | jq .

# التصفية حسب الإجراء
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**راجع:** [توثيق command-logger](/ar/automation/hooks#command-logger)

### boot-md

يشغّل `BOOT.md` عند بدء تشغيل Gateway (بعد بدء القنوات).

**الأحداث**: `gateway:startup`

**التمكين**:

```bash
openclaw hooks enable boot-md
```

**راجع:** [توثيق boot-md](/ar/automation/hooks#boot-md)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [خطافات الأتمتة](/ar/automation/hooks)
