---
read_when:
    - تريد إدارة خطافات الوكلاء
    - تريد التحقق من توفّر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-05-05T08:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

إدارة خطافات الوكيل (أتمتات مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل Gateway).

تشغيل `openclaw hooks` بدون أمر فرعي يعادل `openclaw hooks list`.

ذات صلة:

- الخطافات: [الخطافات](/ar/automation/hooks)
- خطافات Plugin: [خطافات Plugin](/ar/plugins/hooks)

## عرض كل الخطافات

```bash
openclaw hooks list
```

يعرض كل الخطافات المكتشفة من أدلة مساحة العمل، والمُدارة، والإضافية، والمضمّنة.
لا يحمّل بدء تشغيل Gateway معالجات الخطافات الداخلية حتى تتم تهيئة خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: اعرض الخطافات المؤهلة فقط (المتطلبات مستوفاة)
- `--json`: أخرج بصيغة JSON
- `-v, --verbose`: اعرض معلومات تفصيلية تشمل المتطلبات المفقودة

**مثال على المخرجات:**

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

يرجع JSON منظمًا للاستخدام البرمجي.

## الحصول على معلومات الخطاف

```bash
openclaw hooks info <name>
```

اعرض معلومات تفصيلية عن خطاف محدد.

**الوسائط:**

- `<name>`: اسم الخطاف أو مفتاح الخطاف (مثل `session-memory`)

**الخيارات:**

- `--json`: أخرج بصيغة JSON

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

اعرض ملخصًا لحالة أهلية الخطافات (كم عدد الجاهزة مقابل غير الجاهزة).

**الخيارات:**

- `--json`: أخرج بصيغة JSON

**مثال على المخرجات:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## تفعيل خطاف

```bash
openclaw hooks enable <name>
```

فعّل خطافًا محددًا بإضافته إلى التهيئة لديك (`~/.openclaw/openclaw.json` افتراضيًا).

**ملاحظة:** تكون خطافات مساحة العمل معطلة افتراضيًا حتى يتم تفعيلها هنا أو في التهيئة. تعرض الخطافات التي تديرها Plugins القيمة `plugin:<id>` في `openclaw hooks list` ولا يمكن تفعيلها أو تعطيلها هنا. فعّل أو عطّل Plugin بدلًا من ذلك.

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

- يتحقق مما إذا كان الخطاف موجودًا ومؤهلًا
- يحدّث `hooks.internal.entries.<name>.enabled = true` في التهيئة لديك
- يحفظ التهيئة إلى القرص

إذا كان الخطاف قادمًا من `<workspace>/hooks/`، فهذه الخطوة الاختيارية الصريحة مطلوبة قبل أن يحمّله Gateway.

**بعد التفعيل:**

- أعد تشغيل Gateway حتى تعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القوائم على macOS، أو إعادة تشغيل عملية Gateway لديك في التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

عطّل خطافًا محددًا بتحديث التهيئة لديك.

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

- أعد تشغيل Gateway حتى تعاد تحميل الخطافات

## ملاحظات

- تكتب `openclaw hooks list --json` و`info --json` و`check --json` بيانات JSON منظمة مباشرة إلى stdout.
- لا يمكن تفعيل الخطافات المُدارة بواسطة Plugin أو تعطيلها هنا؛ فعّل أو عطّل Plugin المالك بدلًا من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ثبّت حزم الخطافات عبر مثبّت Plugins الموحد.

لا يزال `openclaw hooks install` يعمل كاسم مستعار للتوافق، لكنه يطبع تحذير إهمال ويمرر إلى `openclaw plugins install`.

مواصفات npm هي **من السجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات الاعتماديات محليًا على المشروع مع `--ignore-scripts` للأمان، حتى عندما تتضمن الصدفة لديك إعدادات تثبيت npm عامة.

تبقى المواصفات العارية و`@latest` على مسار الإصدار المستقر. إذا حلّ npm أيًا منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يفعّل الخطافات المثبتة في `hooks.internal.entries.*`
- يسجل التثبيت ضمن `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: اربط دليلًا محليًا بدلًا من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: سجّل تثبيتات npm كقيمة `name@version` محلولة بدقة في `hooks.internal.installs`

**الأرشيفات المدعومة:** `.zip`، `.tgz`، `.tar.gz`، `.tar`

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

تُعامل حزم الخطافات المرتبطة كخطافات مُدارة من دليل يهيئه المشغّل، وليس كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المستندة إلى npm والمتتبعة عبر محدّث Plugins الموحد.

لا يزال `openclaw hooks update` يعمل كاسم مستعار للتوافق، لكنه يطبع تحذير إهمال ويمرر إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: حدّث كل حزم الخطافات المتتبعة
- `--dry-run`: اعرض ما سيتغير بدون كتابة

عند وجود تجزئة سلامة مخزنة وتغيّر تجزئة الأثر المُجلَب، يطبع OpenClaw تحذيرًا ويطلب التأكيد قبل المتابعة. استخدم الخيار العام `--yes` لتجاوز المطالبات في CI/التشغيلات غير التفاعلية.

## الخطافات المضمّنة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**تفعيل:**

```bash
openclaw hooks enable session-memory
```

**المخرجات:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` افتراضيًا. عيّن `hooks.internal.entries.session-memory.llmSlug: true` لشرائح أسماء ملفات مولّدة بواسطة النموذج.

**راجع:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات تمهيد إضافية (على سبيل المثال `AGENTS.md` / `TOOLS.md` المحلية في المستودع الأحادي) أثناء `agent:bootstrap`.

**تفعيل:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**راجع:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجل كل أحداث الأوامر في ملف تدقيق مركزي.

**تفعيل:**

```bash
openclaw hooks enable command-logger
```

**المخرجات:** `~/.openclaw/logs/commands.log`

**عرض السجلات:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**راجع:** [توثيق command-logger](/ar/automation/hooks#command-logger)

### boot-md

يشغّل `BOOT.md` عند بدء Gateway (بعد بدء القنوات).

**الأحداث**: `gateway:startup`

**تفعيل**:

```bash
openclaw hooks enable boot-md
```

**راجع:** [توثيق boot-md](/ar/automation/hooks#boot-md)

## ذات صلة

- [مرجع CLI](/ar/cli)
- [خطافات الأتمتة](/ar/automation/hooks)
