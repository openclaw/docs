---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-04-24T07:34:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

إدارة خطافات الوكيل (عمليات أتمتة مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل gateway).

يعادل تشغيل `openclaw hooks` من دون أمر فرعي تشغيل `openclaw hooks list`.

ذو صلة:

- الخطافات: [الخطافات](/ar/automation/hooks)
- خطافات Plugin: [خطافات Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks)

## سرد جميع الخطافات

```bash
openclaw hooks list
```

يسرد جميع الخطافات المكتشفة من أدلة مساحة العمل، والمدارة، والإضافية، والمجمعة.
لا يحمّل بدء تشغيل Gateway معالجات الخطافات الداخلية حتى يتم إعداد خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: إظهار الخطافات المؤهلة فقط (المتطلبات مستوفاة)
- `--json`: إخراج بصيغة JSON
- `-v, --verbose`: إظهار معلومات مفصلة بما في ذلك المتطلبات المفقودة

**مثال على المخرجات:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**مثال (مفصل):**

```bash
openclaw hooks list --verbose
```

يعرض المتطلبات المفقودة للخطافات غير المؤهلة.

**مثال (JSON):**

```bash
openclaw hooks list --json
```

يعيد JSON منظّمًا للاستخدام البرمجي.

## الحصول على معلومات الخطاف

```bash
openclaw hooks info <name>
```

يعرض معلومات مفصلة عن خطاف محدد.

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
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## التحقق من أهلية الخطافات

```bash
openclaw hooks check
```

يعرض ملخصًا لحالة أهلية الخطافات (كم عدد الجاهزة مقابل غير الجاهزة).

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال على المخرجات:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## تمكين خطاف

```bash
openclaw hooks enable <name>
```

يمكّن خطافًا محددًا بإضافته إلى إعداداتك (افتراضيًا `~/.openclaw/openclaw.json`).

**ملاحظة:** تكون خطافات مساحة العمل معطلة افتراضيًا حتى يتم تمكينها هنا أو في الإعدادات. وتُظهر الخطافات التي تديرها Plugins القيمة `plugin:<id>` في `openclaw hooks list` ولا يمكن تمكينها/تعطيلها هنا. بدّل حالة Plugin نفسه بدلًا من ذلك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**المخرجات:**

```
✓ Enabled hook: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق من وجود الخطاف ومن كونه مؤهلًا
- يحدّث `hooks.internal.entries.<name>.enabled = true` في إعداداتك
- يحفظ الإعدادات إلى القرص

إذا كان الخطاف آتيًا من `<workspace>/hooks/`، فإن خطوة الاشتراك هذه مطلوبة قبل
أن يقوم Gateway بتحميله.

**بعد التمكين:**

- أعد تشغيل gateway لكي يُعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القوائم على macOS، أو إعادة تشغيل عملية gateway في التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

يعطّل خطافًا محددًا عن طريق تحديث إعداداتك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**المخرجات:**

```
⏸ Disabled hook: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل gateway لكي يُعاد تحميل الخطافات

## ملاحظات

- تكتب الأوامر `openclaw hooks list --json` و`info --json` و`check --json` بيانات JSON منظّمة مباشرة إلى stdout.
- لا يمكن تمكين الخطافات التي تديرها Plugins أو تعطيلها هنا؛ بدّل حالة Plugin المالك بدلًا من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # ClawHub أولًا، ثم npm
openclaw plugins install <package> --pin  # تثبيت الإصدار
openclaw plugins install <path>           # مسار محلي
```

ثبّت حزم الخطافات عبر مُثبّت Plugins الموحّد.

لا يزال `openclaw hooks install` يعمل كاسم مستعار للتوافق، لكنه يطبع
تحذير إهمال ثم يعيد التوجيه إلى `openclaw plugins install`.

تكون مواصفات npm **للسجل فقط** (اسم الحزمة + **إصدار مطابق تمامًا** اختياري أو
**dist-tag**). ويتم رفض مواصفات Git/URL/file ونطاقات semver. وتعمل
تثبيتات التبعيات باستخدام `--ignore-scripts` من أجل الأمان.

تظل المواصفات العارية و`@latest` على المسار المستقر. وإذا قام npm بحل أيٍّ
منهما إلى إصدار prerelease، فإن OpenClaw يتوقف ويطلب منك الاشتراك صراحةً
باستخدام وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease مطابق تمامًا.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يمكّن الخطافات المثبتة في `hooks.internal.entries.*`
- يسجل التثبيت ضمن `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلًا من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل تثبيتات npm كقيمة `name@version` المحلولة بالكامل في `hooks.internal.installs`

**الأرشيفات المدعومة:** `.zip` و`.tgz` و`.tar.gz` و`.tar`

**أمثلة:**

```bash
# دليل محلي
openclaw plugins install ./my-hook-pack

# أرشيف محلي
openclaw plugins install ./my-hook-pack.zip

# حزمة NPM
openclaw plugins install @openclaw/my-hook-pack

# ربط دليل محلي دون نسخه
openclaw plugins install -l ./my-hook-pack
```

تُعامل حزم الخطافات المرتبطة على أنها خطافات مُدارة من دليل
يُعدّه المشغّل، وليس كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المتعقبة المعتمدة على npm عبر مُحدّث Plugins الموحّد.

لا يزال `openclaw hooks update` يعمل كاسم مستعار للتوافق، لكنه يطبع
تحذير إهمال ثم يعيد التوجيه إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث جميع حزم الخطافات المتعقبة
- `--dry-run`: إظهار ما سيتغير من دون كتابة

عندما توجد قيمة hash سلامة مخزنة ويتغير hash الخاص بالمكوّن الذي تم جلبه،
يطبع OpenClaw تحذيرًا ويطلب تأكيدًا قبل المتابعة. استخدم
القيمة العامة `--yes` لتجاوز المطالبات في تشغيلات CI/غير التفاعلية.

## الخطافات المجمعة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**التمكين:**

```bash
openclaw hooks enable session-memory
```

**المخرجات:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**راجع:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات bootstrap إضافية (على سبيل المثال `AGENTS.md` / `TOOLS.md` المحلية للمستودع الأحادي) أثناء `agent:bootstrap`.

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
# الأوامر الحديثة
tail -n 20 ~/.openclaw/logs/commands.log

# طباعة منسقة
cat ~/.openclaw/logs/commands.log | jq .

# التصفية حسب الإجراء
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**راجع:** [توثيق command-logger](/ar/automation/hooks#command-logger)

### boot-md

يشغّل `BOOT.md` عند بدء تشغيل gateway (بعد بدء تشغيل القنوات).

**الأحداث**: `gateway:startup`

**التمكين**:

```bash
openclaw hooks enable boot-md
```

**راجع:** [توثيق boot-md](/ar/automation/hooks#boot-md)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [خطافات الأتمتة](/ar/automation/hooks)
