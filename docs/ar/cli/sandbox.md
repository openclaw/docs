---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: إدارة بيئات تشغيل الحماية المعزولة وفحص سياسة الحماية المعزولة الفعّالة
title: CLI لبيئة العزل
x-i18n:
    generated_at: "2026-05-03T21:29:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

إدارة أوقات تشغيل صندوق الرمل لتنفيذ الوكيل المعزول.

## نظرة عامة

يمكن لـ OpenClaw تشغيل الوكلاء في أوقات تشغيل صندوق رمل معزولة للأمان. تساعدك أوامر `sandbox` على فحص أوقات التشغيل هذه وإعادة إنشائها بعد التحديثات أو تغييرات التكوين.

يعني ذلك اليوم عادة:

- حاويات صندوق رمل Docker
- أوقات تشغيل صندوق رمل SSH عندما يكون `agents.defaults.sandbox.backend = "ssh"`
- أوقات تشغيل صندوق رمل OpenShell عندما يكون `agents.defaults.sandbox.backend = "openshell"`

بالنسبة إلى `ssh` وOpenShell `remote`، تكون إعادة الإنشاء أهم مما هي عليه مع Docker:

- مساحة العمل البعيدة تكون المصدر المعتمد بعد التهيئة الأولية
- يحذف `openclaw sandbox recreate` مساحة العمل البعيدة المعتمدة هذه للنطاق المحدد
- يؤدي الاستخدام التالي إلى تهيئتها مرة أخرى من مساحة العمل المحلية الحالية

## الأوامر

### `openclaw sandbox explain`

افحص وضع/نطاق/وصول مساحة عمل صندوق الرمل **الفعلي**، وسياسة أدوات صندوق الرمل، وبوابات الرفع (مع مسارات مفاتيح التكوين للإصلاح).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

اسرد جميع أوقات تشغيل صندوق الرمل مع حالتها وتكوينها.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**يتضمن الإخراج:**

- اسم وقت التشغيل وحالته
- الخلفية (`docker`، `openshell`، إلخ.)
- تسمية التكوين وما إذا كانت تطابق التكوين الحالي
- العمر (الوقت منذ الإنشاء)
- وقت الخمول (الوقت منذ آخر استخدام)
- الجلسة/الوكيل المرتبط

### `openclaw sandbox recreate`

أزِل أوقات تشغيل صندوق الرمل لفرض إعادة إنشائها بالتكوين المحدث.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**الخيارات:**

- `--all`: إعادة إنشاء جميع حاويات صندوق الرمل
- `--session <key>`: إعادة إنشاء الحاوية لجلسة محددة
- `--agent <id>`: إعادة إنشاء الحاويات لوكيل محدد
- `--browser`: إعادة إنشاء حاويات المتصفح فقط
- `--force`: تخطي مطالبة التأكيد

<Note>
تُعاد إنشاء أوقات التشغيل تلقائيًا عند استخدام الوكيل في المرة التالية.
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

### بعد تغيير تكوين صندوق الرمل

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
على هدف SSH. يعيد التشغيل التالي تهيئتها من مساحة العمل المحلية.

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
لذلك النطاق. يعيد التشغيل التالي تهيئتها من مساحة العمل المحلية.

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

عند تحديث تكوين صندوق الرمل:

- تستمر أوقات التشغيل الموجودة في العمل بالإعدادات القديمة.
- لا تُزال أوقات التشغيل إلا بعد 24 ساعة من عدم النشاط.
- الوكلاء المستخدمون بانتظام يُبقون أوقات التشغيل القديمة نشطة إلى أجل غير مسمى.

استخدم `openclaw sandbox recreate` لفرض إزالة أوقات التشغيل القديمة. تُعاد إنشاؤها تلقائيًا بالإعدادات الحالية عند الحاجة إليها لاحقًا.

<Tip>
فضّل `openclaw sandbox recreate` على التنظيف اليدوي الخاص بالخلفية. فهو يستخدم سجل وقت التشغيل الخاص بـ Gateway ويتجنب حالات عدم التطابق عندما تتغير مفاتيح النطاق أو الجلسة.
</Tip>

## ترحيل السجل

يخزن OpenClaw بيانات تعريف وقت تشغيل صندوق الرمل كجزء JSON واحد لكل إدخال حاوية/متصفح ضمن دليل حالة صندوق الرمل. قد تظل التثبيتات الأقدم تحتوي على ملفات قديمة موحدة:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

لا تعيد قراءات وقت تشغيل صندوق الرمل العادية كتابة هذه الملفات. شغّل `openclaw doctor --fix` لترحيل الإدخالات القديمة الصالحة إلى دلائل السجل المجزأ. تُعزل الملفات القديمة غير الصالحة حتى لا يتمكن سجل قديم تالف واحد من إخفاء إدخالات وقت التشغيل الحالية.

## التكوين

توجد إعدادات صندوق الرمل في `~/.openclaw/openclaw.json` ضمن `agents.defaults.sandbox` (توضع التجاوزات لكل وكيل في `agents.list[].sandbox`):

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
- [استخدام صندوق الرمل](/ar/gateway/sandboxing)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [Doctor](/ar/gateway/doctor): يفحص إعداد صندوق الرمل.
