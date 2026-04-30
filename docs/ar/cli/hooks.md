---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-04-30T07:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

إدارة خطافات الوكيل (أتمتات مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل Gateway).

تشغيل `openclaw hooks` من دون أمر فرعي يعادل `openclaw hooks list`.

ذات صلة:

- الخطافات: [الخطافات](/ar/automation/hooks)
- خطافات Plugin: [خطافات Plugin](/ar/plugins/hooks)

## عرض كل الخطافات

```bash
openclaw hooks list
```

يعرض كل الخطافات المكتشفة من أدلة مساحة العمل، والمدارة، والإضافية، والمضمنة.
لا يحمّل بدء تشغيل Gateway معالجات الخطافات الداخلية حتى يتم تكوين خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: عرض الخطافات المؤهلة فقط (المتطلبات مستوفاة)
- `--json`: إخراج بصيغة JSON
- `-v, --verbose`: عرض معلومات تفصيلية تشمل المتطلبات المفقودة

**مثال على الإخراج:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**مثال (تفصيلي):**

```bash
openclaw hooks list --verbose
```

يعرض المتطلبات المفقودة للخطافات غير المؤهلة.

**مثال (JSON):**

```bash
openclaw hooks list --json
```

يعيد JSON منظما للاستخدام البرمجي.

## الحصول على معلومات الخطاف

```bash
openclaw hooks info <name>
```

يعرض معلومات تفصيلية عن خطاف محدد.

**الوسائط:**

- `<name>`: اسم الخطاف أو مفتاح الخطاف (مثلا `session-memory`)

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال:**

```bash
openclaw hooks info session-memory
```

**الإخراج:**

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

يعرض ملخصا لحالة أهلية الخطافات (كم عدد الجاهزة مقابل غير الجاهزة).

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال على الإخراج:**

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

يمكّن خطافا محددا بإضافته إلى تكوينك (`~/.openclaw/openclaw.json` افتراضيا).

**ملاحظة:** تكون خطافات مساحة العمل معطلة افتراضيا حتى يتم تمكينها هنا أو في التكوين. تعرض الخطافات التي تديرها Plugins القيمة `plugin:<id>` في `openclaw hooks list` ولا يمكن تمكينها أو تعطيلها هنا. مكّن أو عطّل Plugin بدلا من ذلك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثلا `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:**

```
✓ Enabled hook: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق مما إذا كان الخطاف موجودا ومؤهلا
- يحدّث `hooks.internal.entries.<name>.enabled = true` في تكوينك
- يحفظ التكوين على القرص

إذا كان الخطاف آتيا من `<workspace>/hooks/`، فخطوة الاشتراك هذه مطلوبة قبل أن يحمّله Gateway.

**بعد التمكين:**

- أعد تشغيل Gateway حتى تعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القائمة على macOS، أو إعادة تشغيل عملية Gateway في التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

يعطّل خطافا محددا بتحديث تكوينك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثلا `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**الإخراج:**

```
⏸ Disabled hook: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل Gateway حتى تعاد تحميل الخطافات

## ملاحظات

- تكتب `openclaw hooks list --json` و`info --json` و`check --json` JSON منظما مباشرة إلى stdout.
- لا يمكن تمكين أو تعطيل الخطافات التي تديرها Plugins هنا؛ مكّن أو عطّل Plugin المالكة بدلا من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ثبّت حزم الخطافات عبر مثبّت Plugins الموحد.

لا يزال `openclaw hooks install` يعمل كاسم مستعار للتوافق، لكنه يطبع تحذير إهمال ويمرر إلى `openclaw plugins install`.

مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل عمليات تثبيت الاعتماديات محليا داخل المشروع مع `--ignore-scripts` للسلامة، حتى عندما يتضمن shell لديك إعدادات تثبيت npm عامة.

تبقى المواصفات العارية و`@latest` على مسار الإصدار المستقر. إذا حل npm أيا منهما إلى إصدار تمهيدي، يوقف OpenClaw العملية ويطلب منك الاشتراك صراحة بوسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يمكّن الخطافات المثبتة في `hooks.internal.entries.*`
- يسجل التثبيت ضمن `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلا من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل تثبيتات npm كقيم `name@version` محلولة بدقة في `hooks.internal.installs`

**الأرشيفات المدعومة:** `.zip` و`.tgz` و`.tar.gz` و`.tar`

**أمثلة:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

تُعامل حزم الخطافات المرتبطة كخطافات مدارة من دليل مكوّن بواسطة المشغل، وليس كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المستندة إلى npm والمتتبعة عبر محدّث Plugins الموحد.

لا يزال `openclaw hooks update` يعمل كاسم مستعار للتوافق، لكنه يطبع تحذير إهمال ويمرر إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث كل حزم الخطافات المتتبعة
- `--dry-run`: عرض ما سيتغير من دون كتابة

عند وجود تجزئة سلامة مخزنة وتغير تجزئة الأثر المُجلب، يطبع OpenClaw تحذيرا ويطلب التأكيد قبل المتابعة. استخدم الخيار العام `--yes` لتجاوز المطالبات في CI أو عمليات التشغيل غير التفاعلية.

## الخطافات المضمنة

### session-memory

يحفظ سياق الجلسة إلى الذاكرة عند إصدار `/new` أو `/reset`.

**التمكين:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**انظر:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات تمهيد إضافية (مثلا `AGENTS.md` / `TOOLS.md` المحلية لمستودع أحادي) أثناء `agent:bootstrap`.

**التمكين:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**انظر:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجل كل أحداث الأوامر إلى ملف تدقيق مركزي.

**التمكين:**

```bash
openclaw hooks enable command-logger
```

**الإخراج:** `~/.openclaw/logs/commands.log`

**عرض السجلات:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**انظر:** [توثيق command-logger](/ar/automation/hooks#command-logger)

### boot-md

يشغّل `BOOT.md` عند بدء Gateway (بعد بدء القنوات).

**الأحداث**: `gateway:startup`

**التمكين**:

```bash
openclaw hooks enable boot-md
```

**انظر:** [توثيق boot-md](/ar/automation/hooks#boot-md)

## ذات صلة

- [مرجع CLI](/ar/cli)
- [خطافات الأتمتة](/ar/automation/hooks)
