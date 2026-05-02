---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-05-02T20:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

إدارة آليات ربط الوكيل (عمليات أتمتة مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل Gateway).

تشغيل `openclaw hooks` دون أمر فرعي يعادل `openclaw hooks list`.

ذات صلة:

- آليات الربط: [آليات الربط](/ar/automation/hooks)
- آليات ربط Plugin: [آليات ربط Plugin](/ar/plugins/hooks)

## عرض جميع آليات الربط

```bash
openclaw hooks list
```

يعرض جميع آليات الربط المكتشفة من دلائل مساحة العمل، والمدارة، والإضافية، والمضمّنة.
لا يحمّل بدء تشغيل Gateway معالجات آليات الربط الداخلية حتى يتم تكوين آلية ربط داخلية واحدة على الأقل.

**الخيارات:**

- `--eligible`: عرض آليات الربط المؤهلة فقط (المتطلبات مستوفاة)
- `--json`: إخراج بصيغة JSON
- `-v, --verbose`: عرض معلومات مفصلة تشمل المتطلبات المفقودة

**مثال على الإخراج:**

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

يعرض المتطلبات المفقودة لآليات الربط غير المؤهلة.

**مثال (JSON):**

```bash
openclaw hooks list --json
```

يعيد JSON منظّماً للاستخدام البرمجي.

## الحصول على معلومات آلية ربط

```bash
openclaw hooks info <name>
```

يعرض معلومات مفصلة حول آلية ربط محددة.

**الوسائط:**

- `<name>`: اسم آلية الربط أو مفتاح آلية الربط (مثل `session-memory`)

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

## التحقق من أهلية آليات الربط

```bash
openclaw hooks check
```

يعرض ملخصاً لحالة أهلية آليات الربط (عدد الجاهزة مقابل غير الجاهزة).

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال على الإخراج:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## تفعيل آلية ربط

```bash
openclaw hooks enable <name>
```

يفعّل آلية ربط محددة بإضافتها إلى تكوينك (`~/.openclaw/openclaw.json` افتراضياً).

**ملاحظة:** تكون آليات ربط مساحة العمل معطلة افتراضياً حتى يتم تفعيلها هنا أو في التكوين. تعرض آليات الربط التي تديرها Plugins القيمة `plugin:<id>` في `openclaw hooks list` ولا يمكن تفعيلها/تعطيلها هنا. فعّل/عطّل الـ Plugin بدلاً من ذلك.

**الوسائط:**

- `<name>`: اسم آلية الربط (مثل `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:**

```
✓ Enabled hook: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق مما إذا كانت آلية الربط موجودة ومؤهلة
- يحدّث `hooks.internal.entries.<name>.enabled = true` في تكوينك
- يحفظ التكوين على القرص

إذا كانت آلية الربط آتية من `<workspace>/hooks/`، فهذه الخطوة الاختيارية مطلوبة قبل
أن يحمّلها Gateway.

**بعد التفعيل:**

- أعد تشغيل Gateway حتى تُعاد تحميل آليات الربط (إعادة تشغيل تطبيق شريط القوائم على macOS، أو إعادة تشغيل عملية Gateway في التطوير).

## تعطيل آلية ربط

```bash
openclaw hooks disable <name>
```

يعطّل آلية ربط محددة بتحديث تكوينك.

**الوسائط:**

- `<name>`: اسم آلية الربط (مثل `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**الإخراج:**

```
⏸ Disabled hook: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل Gateway حتى تُعاد تحميل آليات الربط

## ملاحظات

- تكتب `openclaw hooks list --json` و`info --json` و`check --json` بيانات JSON منظّمة مباشرة إلى stdout.
- لا يمكن تفعيل آليات الربط المُدارة من Plugin أو تعطيلها هنا؛ فعّل أو عطّل الـ Plugin المالك بدلاً من ذلك.

## تثبيت حزم آليات الربط

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ثبّت حزم آليات الربط عبر مثبّت Plugins الموحّد.

ما زال `openclaw hooks install` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إهمال ويمرّر التنفيذ إلى `openclaw plugins install`.

مواصفات npm هي **من السجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو
**dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل عمليات تثبيت الاعتماديات محلياً ضمن المشروع مع `--ignore-scripts` للسلامة، حتى عندما
تحتوي صدفتك على إعدادات تثبيت npm عامة.

تبقى المواصفات المجردة و`@latest` على المسار المستقر. إذا حلّ npm أياً من
هذين إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحة باستخدام
وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق.

**ما الذي يفعله:**

- ينسخ حزمة آلية الربط إلى `~/.openclaw/hooks/<id>`
- يفعّل آليات الربط المثبتة في `hooks.internal.entries.*`
- يسجل التثبيت ضمن `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلاً من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل تثبيتات npm كـ `name@version` محلولة بدقة في `hooks.internal.installs`

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

تُعامل حزم آليات الربط المرتبطة كآليات ربط مُدارة من دليل مكوَّن بواسطة المشغّل،
وليست كآليات ربط مساحة عمل.

## تحديث حزم آليات الربط

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم آليات الربط المستندة إلى npm والمتتبعة عبر محدّث Plugins الموحّد.

ما زال `openclaw hooks update` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إهمال ويمرّر التنفيذ إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث جميع حزم آليات الربط المتتبعة
- `--dry-run`: عرض ما سيتغير دون كتابة

عندما توجد بصمة سلامة مخزنة وتتغير بصمة الأثر الذي تم جلبه،
يطبع OpenClaw تحذيراً ويطلب التأكيد قبل المتابعة. استخدم
`--yes` العامة لتجاوز المطالبات في CI/عمليات التشغيل غير التفاعلية.

## آليات الربط المضمّنة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**التفعيل:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**انظر:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات bootstrap إضافية (على سبيل المثال `AGENTS.md` / `TOOLS.md` محلية لمستودع أحادي) أثناء `agent:bootstrap`.

**التفعيل:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**انظر:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجل جميع أحداث الأوامر في ملف تدقيق مركزي.

**التفعيل:**

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

**التفعيل**:

```bash
openclaw hooks enable boot-md
```

**انظر:** [توثيق boot-md](/ar/automation/hooks#boot-md)

## ذات صلة

- [مرجع CLI](/ar/cli)
- [آليات ربط الأتمتة](/ar/automation/hooks)
