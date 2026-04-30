---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: إدارة بيئات تشغيل وضع الحماية وفحص سياسة وضع الحماية الفعلية
title: CLI بيئة الاختبار المعزولة
x-i18n:
    generated_at: "2026-04-30T07:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

إدارة أوقات تشغيل sandbox لتنفيذ الوكلاء بشكل معزول.

## نظرة عامة

يمكن لـ OpenClaw تشغيل الوكلاء في أوقات تشغيل sandbox معزولة لأغراض الأمان. تساعدك أوامر `sandbox` على فحص أوقات التشغيل هذه وإعادة إنشائها بعد التحديثات أو تغييرات الإعدادات.

يعني ذلك اليوم عادة:

- حاويات Docker sandbox
- أوقات تشغيل SSH sandbox عندما تكون `agents.defaults.sandbox.backend = "ssh"`
- أوقات تشغيل OpenShell sandbox عندما تكون `agents.defaults.sandbox.backend = "openshell"`

بالنسبة إلى `ssh` وOpenShell `remote`، تكون إعادة الإنشاء أكثر أهمية من Docker:

- مساحة العمل البعيدة هي المصدر المعتمد بعد البذر الأولي
- يحذف `openclaw sandbox recreate` مساحة العمل البعيدة المعتمدة هذه للنطاق المحدد
- يؤدي الاستخدام التالي إلى بذرها مرة أخرى من مساحة العمل المحلية الحالية

## الأوامر

### `openclaw sandbox explain`

افحص وضع/نطاق/وصول مساحة عمل sandbox **الفعلي**، وسياسة أدوات sandbox، وبوابات الرفع (مع مسارات مفاتيح الإعدادات للإصلاح).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

اعرض كل أوقات تشغيل sandbox مع حالتها وإعداداتها.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**يتضمن الإخراج:**

- اسم وقت التشغيل وحالته
- الخلفية (`docker`، `openshell`، إلخ)
- تسمية الإعدادات وما إذا كانت تطابق الإعدادات الحالية
- العمر (الوقت منذ الإنشاء)
- وقت الخمول (الوقت منذ آخر استخدام)
- الجلسة/الوكيل المرتبط

### `openclaw sandbox recreate`

أزِل أوقات تشغيل sandbox لفرض إعادة إنشائها بالإعدادات المحدثة.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**الخيارات:**

- `--all`: إعادة إنشاء كل حاويات sandbox
- `--session <key>`: إعادة إنشاء الحاوية لجلسة محددة
- `--agent <id>`: إعادة إنشاء الحاويات لوكيل محدد
- `--browser`: إعادة إنشاء حاويات المتصفح فقط
- `--force`: تخطي مطالبة التأكيد

<Note>
تُعاد إنشاء أوقات التشغيل تلقائياً عند استخدام الوكيل في المرة التالية.
</Note>

## حالات الاستخدام

### بعد تحديث صورة Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### بعد تغيير إعدادات sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### بعد تغيير هدف SSH أو مواد مصادقة SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

بالنسبة إلى خلفية `ssh` الأساسية، تحذف إعادة الإنشاء جذر مساحة العمل البعيدة لكل نطاق
على هدف SSH. يؤدي التشغيل التالي إلى بذرها مرة أخرى من مساحة العمل المحلية.

### بعد تغيير مصدر OpenShell أو سياسته أو وضعه

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

بالنسبة إلى وضع OpenShell `remote`، تحذف إعادة الإنشاء مساحة العمل البعيدة المعتمدة
لذلك النطاق. يؤدي التشغيل التالي إلى بذرها مرة أخرى من مساحة العمل المحلية.

### بعد تغيير setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### لوكيل محدد فقط

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## سبب الحاجة إلى ذلك

عند تحديث إعدادات sandbox:

- تستمر أوقات التشغيل الحالية بالعمل بالإعدادات القديمة.
- لا تُزال أوقات التشغيل إلا بعد 24 ساعة من عدم النشاط.
- يحافظ الوكلاء المستخدمون بانتظام على أوقات التشغيل القديمة إلى أجل غير مسمى.

استخدم `openclaw sandbox recreate` لفرض إزالة أوقات التشغيل القديمة. تُعاد إنشاؤها تلقائياً بالإعدادات الحالية عند الحاجة إليها لاحقاً.

<Tip>
فضّل `openclaw sandbox recreate` على التنظيف اليدوي الخاص بالخلفية. فهو يستخدم سجل أوقات التشغيل في Gateway ويتجنب حالات عدم التطابق عندما تتغير مفاتيح النطاق أو الجلسة.
</Tip>

## الإعدادات

توجد إعدادات sandbox في `~/.openclaw/openclaw.json` ضمن `agents.defaults.sandbox` (توضع التجاوزات الخاصة بكل وكيل في `agents.list[].sandbox`):

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

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Sandboxing](/ar/gateway/sandboxing)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [Doctor](/ar/gateway/doctor): يتحقق من إعداد sandbox.
