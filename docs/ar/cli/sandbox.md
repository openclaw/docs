---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: إدارة بيئات تشغيل sandbox وفحص سياسة sandbox الفعلية
title: CLI الخاصة بـ sandbox
x-i18n:
    generated_at: "2026-04-24T07:36:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

إدارة بيئات تشغيل sandbox لتنفيذ الوكيل بشكل معزول.

## نظرة عامة

يمكن لـ OpenClaw تشغيل الوكلاء داخل بيئات تشغيل sandbox معزولة لأسباب أمنية. تساعدك أوامر `sandbox` على فحص هذه البيئات وإعادة إنشائها بعد التحديثات أو تغييرات الإعداد.

يعني ذلك اليوم عادةً:

- حاويات Docker الخاصة بـ sandbox
- بيئات تشغيل SSH الخاصة بـ sandbox عندما تكون `agents.defaults.sandbox.backend = "ssh"`
- بيئات تشغيل OpenShell الخاصة بـ sandbox عندما تكون `agents.defaults.sandbox.backend = "openshell"`

بالنسبة إلى `ssh` ووضع `remote` في OpenShell، تكون إعادة الإنشاء أكثر أهمية من Docker:

- تكون مساحة العمل البعيدة هي المرجع الأساسي بعد التهيئة الأولية
- يحذف `openclaw sandbox recreate` مساحة العمل البعيدة المرجعية هذه للنطاق المحدد
- تؤدي المرة التالية من الاستخدام إلى إعادة تهيئتها من مساحة العمل المحلية الحالية

## الأوامر

### `openclaw sandbox explain`

افحص **الوضع/النطاق/وصول مساحة العمل الفعلي** لـ sandbox، وسياسة أدوات sandbox، وبوابات الرفع (مع مسارات مفاتيح الإعداد للإصلاح).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

اعرض كل بيئات تشغيل sandbox مع حالتها وإعدادها.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # اعرض حاويات المتصفح فقط
openclaw sandbox list --json     # خرج JSON
```

**يتضمن الخرج:**

- اسم بيئة التشغيل وحالتها
- الواجهة الخلفية (`docker` أو `openshell` أو غيرهما)
- تسمية الإعداد وما إذا كانت تطابق الإعداد الحالي
- العمر (الوقت منذ الإنشاء)
- وقت الخمول (الوقت منذ آخر استخدام)
- الجلسة/الوكيل المرتبط

### `openclaw sandbox recreate`

أزل بيئات تشغيل sandbox لفرض إعادة إنشائها بإعداد محدّث.

```bash
openclaw sandbox recreate --all                # إعادة إنشاء كل الحاويات
openclaw sandbox recreate --session main       # جلسة محددة
openclaw sandbox recreate --agent mybot        # وكيل محدد
openclaw sandbox recreate --browser            # حاويات المتصفح فقط
openclaw sandbox recreate --all --force        # تخطّي التأكيد
```

**الخيارات:**

- `--all`: إعادة إنشاء كل حاويات sandbox
- `--session <key>`: إعادة إنشاء الحاوية لجلسة محددة
- `--agent <id>`: إعادة إنشاء الحاويات لوكيل محدد
- `--browser`: إعادة إنشاء حاويات المتصفح فقط
- `--force`: تخطّي مطالبة التأكيد

**مهم:** تُعاد إنشاء بيئات التشغيل تلقائيًا عند استخدام الوكيل في المرة التالية.

## حالات الاستخدام

### بعد تحديث صورة Docker

```bash
# سحب صورة جديدة
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# تحديث الإعداد لاستخدام الصورة الجديدة
# حرر الإعداد: agents.defaults.sandbox.docker.image (أو agents.list[].sandbox.docker.image)

# إعادة إنشاء الحاويات
openclaw sandbox recreate --all
```

### بعد تغيير إعداد sandbox

```bash
# حرر الإعداد: agents.defaults.sandbox.* (أو agents.list[].sandbox.*)

# أعد الإنشاء لتطبيق الإعداد الجديد
openclaw sandbox recreate --all
```

### بعد تغيير هدف SSH أو مواد مصادقة SSH

```bash
# حرر الإعداد:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

بالنسبة إلى الواجهة الخلفية الأساسية `ssh`، تؤدي إعادة الإنشاء إلى حذف جذر مساحة العمل البعيدة لكل نطاق
على هدف SSH. وتعيد العملية التالية تهيئته مرة أخرى من مساحة العمل المحلية.

### بعد تغيير مصدر OpenShell أو السياسة أو الوضع

```bash
# حرر الإعداد:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

بالنسبة إلى وضع `remote` في OpenShell، تؤدي إعادة الإنشاء إلى حذف مساحة العمل البعيدة المرجعية
لذلك النطاق. وتعيد العملية التالية تهيئتها مرة أخرى من مساحة العمل المحلية.

### بعد تغيير setupCommand

```bash
openclaw sandbox recreate --all
# أو لوكيل واحد فقط:
openclaw sandbox recreate --agent family
```

### لوكيل محدد فقط

```bash
# حدّث حاويات وكيل واحد فقط
openclaw sandbox recreate --agent alfred
```

## لماذا هذا مطلوب؟

**المشكلة:** عندما تحدّث إعداد sandbox:

- تستمر بيئات التشغيل الحالية في العمل بالإعدادات القديمة
- لا يتم تقليم بيئات التشغيل إلا بعد 24 ساعة من عدم النشاط
- تحتفظ الوكلاء المستخدمون بانتظام ببيئات التشغيل القديمة حية إلى أجل غير مسمى

**الحل:** استخدم `openclaw sandbox recreate` لفرض إزالة بيئات التشغيل القديمة. وستُعاد إنشاؤها تلقائيًا بالإعدادات الحالية عند الحاجة إليها في المرة التالية.

نصيحة: فضّل `openclaw sandbox recreate` على التنظيف اليدوي الخاص بكل واجهة خلفية.
فهو يستخدم سجل بيئات التشغيل في Gateway ويتجنب حالات عدم التطابق عندما تتغير مفاتيح النطاق/الجلسة.

## الإعداد

توجد إعدادات sandbox في `~/.openclaw/openclaw.json` ضمن `agents.defaults.sandbox` (وتوضع التجاوزات الخاصة بكل وكيل في `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [العزل باستخدام sandbox](/ar/gateway/sandboxing)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [Doctor](/ar/gateway/doctor) — يتحقق من إعداد sandbox
