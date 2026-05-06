---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص مدى توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-05-06T17:53:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

إدارة خطافات الوكيل (أتمتات مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل Gateway).

تشغيل `openclaw hooks` بلا أمر فرعي يعادل `openclaw hooks list`.

ذات صلة:

- الخطافات: [الخطافات](/ar/automation/hooks)
- خطافات Plugin: [خطافات Plugin](/ar/plugins/hooks)

## سرد كل الخطافات

```bash
openclaw hooks list
```

يسرد كل الخطافات المكتشفة من أدلة مساحة العمل، والمدارة، والإضافية، والمضمنة.
لا يحمّل بدء تشغيل Gateway معالجات الخطافات الداخلية حتى يتم تكوين خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: إظهار الخطافات المؤهلة فقط (المتطلبات مستوفاة)
- `--json`: الإخراج بصيغة JSON
- `-v, --verbose`: إظهار معلومات تفصيلية تشمل المتطلبات المفقودة

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

يعيد JSON منظماً للاستخدام البرمجي.

## الحصول على معلومات الخطاف

```bash
openclaw hooks info <name>
```

يعرض معلومات تفصيلية عن خطاف محدد.

**الوسائط:**

- `<name>`: اسم الخطاف أو مفتاح الخطاف (مثل `session-memory`)

**الخيارات:**

- `--json`: الإخراج بصيغة JSON

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

يعرض ملخصاً لحالة أهلية الخطافات (كم عدد الجاهزة مقابل غير الجاهزة).

**الخيارات:**

- `--json`: الإخراج بصيغة JSON

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

يمكّن خطافاً محدداً عبر إضافته إلى تكوينك (`~/.openclaw/openclaw.json` افتراضياً).

**ملاحظة:** خطافات مساحة العمل معطلة افتراضياً حتى يتم تمكينها هنا أو في التكوين. الخطافات المُدارة بواسطة Plugin تعرض `plugin:<id>` في `openclaw hooks list` ولا يمكن تمكينها/تعطيلها هنا. مكّن/عطّل Plugin بدلاً من ذلك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:**

```
✓ Enabled hook: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق مما إذا كان الخطاف موجوداً ومؤهلاً
- يحدّث `hooks.internal.entries.<name>.enabled = true` في تكوينك
- يحفظ التكوين إلى القرص

إذا كان الخطاف قادماً من `<workspace>/hooks/`، فهذه الخطوة الاختيارية مطلوبة قبل أن يحمّله
Gateway.

**بعد التمكين:**

- أعد تشغيل Gateway حتى تُعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القوائم على macOS، أو إعادة تشغيل عملية Gateway في التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

يعطّل خطافاً محدداً عبر تحديث تكوينك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**الإخراج:**

```
⏸ Disabled hook: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل Gateway حتى تُعاد تحميل الخطافات

## ملاحظات

- تكتب `openclaw hooks list --json` و`info --json` و`check --json` بيانات JSON منظّمة مباشرة إلى stdout.
- لا يمكن تمكين أو تعطيل الخطافات المُدارة بواسطة Plugin هنا؛ مكّن أو عطّل Plugin المالك بدلاً من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ثبّت حزم الخطافات عبر مثبّت plugins الموحد.

لا يزال `openclaw hooks install` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إهمال ويمرر إلى `openclaw plugins install`.

مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو
**dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل عمليات تثبيت الاعتماديات محلياً ضمن المشروع مع `--ignore-scripts` للأمان، حتى عندما تحتوي
الصدفة لديك على إعدادات تثبيت npm عمومية.

تبقى المواصفات المجردة و`@latest` على مسار stable. إذا حل npm أياً من
هذين إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحة باستخدام
وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يمكّن الخطافات المثبتة في `hooks.internal.entries.*`
- يسجل التثبيت ضمن `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلاً من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل تثبيتات npm بصيغة `name@version` المحلولة بدقة في `hooks.internal.installs`

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

تُعامل حزم الخطافات المرتبطة كخطافات مُدارة من دليل مكوّن بواسطة المشغّل،
وليس كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المستندة إلى npm والمتتبعة عبر محدّث plugins الموحد.

لا يزال `openclaw hooks update` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إهمال ويمرر إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث كل حزم الخطافات المتتبعة
- `--dry-run`: إظهار ما سيتغير دون كتابة

عندما توجد تجزئة سلامة مخزنة وتتغير تجزئة الأثر الذي تم جلبه،
يطبع OpenClaw تحذيراً ويطلب التأكيد قبل المتابعة. استخدم
`--yes` العام لتجاوز المطالبات في CI/التشغيل غير التفاعلي.

## الخطافات المضمنة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**التمكين:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` افتراضياً. عيّن `hooks.internal.entries.session-memory.llmSlug: true` لاستخدام شرائح أسماء ملفات مولدة بواسطة النموذج.

**انظر:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات bootstrap إضافية (على سبيل المثال `AGENTS.md` / `TOOLS.md` المحلية لمستودع monorepo) أثناء `agent:bootstrap`.

**التمكين:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**انظر:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجل كل أحداث الأوامر في ملف تدقيق مركزي.

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
