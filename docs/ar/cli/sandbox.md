---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: إدارة بيئات تشغيل العزل وفحص سياسة العزل الفعلية
title: Sandbox CLI
x-i18n:
    generated_at: "2026-06-27T17:24:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

إدارة بيئات تشغيل صندوق الحماية لتنفيذ الوكلاء بمعزل.

## نظرة عامة

يمكن لـ OpenClaw تشغيل الوكلاء في بيئات تشغيل صندوق حماية معزولة من أجل الأمان. تساعدك أوامر `sandbox` على فحص تلك البيئات وإعادة إنشائها بعد التحديثات أو تغييرات التكوين.

يعني ذلك اليوم عادة:

- حاويات صندوق حماية Docker
- بيئات تشغيل صندوق حماية SSH عندما تكون `agents.defaults.sandbox.backend = "ssh"`
- بيئات تشغيل صندوق حماية OpenShell عندما تكون `agents.defaults.sandbox.backend = "openshell"`

بالنسبة إلى `ssh` و OpenShell `remote`، تكون إعادة الإنشاء أكثر أهمية مقارنة بـ Docker:

- مساحة العمل البعيدة هي المصدر المعتمد بعد البذر الأولي
- يحذف `openclaw sandbox recreate` مساحة العمل البعيدة المعتمدة لذلك النطاق المحدد
- يعيد الاستخدام التالي بذرها من مساحة العمل المحلية الحالية

## الأوامر

### `openclaw sandbox explain`

افحص وضع/نطاق/وصول مساحة عمل صندوق الحماية **الفعلي**، وسياسة أدوات صندوق الحماية، وبوابات التصعيد (مع مسارات مفاتيح التكوين للإصلاح).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

اسرد كل بيئات تشغيل صندوق الحماية مع حالتها وتكوينها.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**يتضمن الإخراج:**

- اسم بيئة التشغيل وحالتها
- الخلفية (`docker`، `openshell`، إلخ)
- تسمية التكوين وما إذا كانت تطابق التكوين الحالي
- العمر (الوقت منذ الإنشاء)
- وقت الخمول (الوقت منذ آخر استخدام)
- الجلسة/الوكيل المرتبط

### `openclaw sandbox recreate`

أزل بيئات تشغيل صندوق الحماية لفرض إعادة إنشائها بالتكوين المحدّث.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**الخيارات:**

- `--all`: إعادة إنشاء كل حاويات صندوق الحماية
- `--session <key>`: إعادة إنشاء الحاوية لجلسة محددة
- `--agent <id>`: إعادة إنشاء الحاويات لوكيل محدد
- `--browser`: إعادة إنشاء حاويات المتصفح فقط
- `--force`: تخطي مطالبة التأكيد

<Note>
تُعاد إنشاء بيئات التشغيل تلقائيا عند استخدام الوكيل في المرة التالية.
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

### بعد تغيير تكوين صندوق الحماية

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
على هدف SSH. يعيد التشغيل التالي بذرها من مساحة العمل المحلية.

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
لذلك النطاق. يعيد التشغيل التالي بذرها من مساحة العمل المحلية.

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

## لماذا يلزم ذلك

عند تحديث تكوين صندوق الحماية:

- تستمر بيئات التشغيل الحالية بالعمل بالإعدادات القديمة.
- لا تُزال بيئات التشغيل إلا بعد 24 ساعة من عدم النشاط.
- الوكلاء المستخدمون بانتظام يبقون بيئات التشغيل القديمة نشطة إلى أجل غير مسمى.

استخدم `openclaw sandbox recreate` لفرض إزالة بيئات التشغيل القديمة. تُعاد إنشاؤها تلقائيا بالإعدادات الحالية عند الحاجة إليها في المرة التالية.

<Tip>
فضّل `openclaw sandbox recreate` على التنظيف اليدوي الخاص بالخلفية. فهو يستخدم سجل بيئات تشغيل Gateway ويتجنب عدم التطابق عند تغيير مفاتيح النطاق أو الجلسة.
</Tip>

## ترحيل السجل

يخزن OpenClaw بيانات تعريف بيئات تشغيل صندوق الحماية في قاعدة بيانات حالة SQLite المشتركة. قد تظل لدى التثبيتات الأقدم ملفات سجل صندوق حماية قديمة:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

قد تحتوي بعض الترقيات أيضا على جزء JSON واحد لكل حاوية/متصفح ضمن `~/.openclaw/sandbox/containers/` أو `~/.openclaw/sandbox/browsers/`. لا تعيد قراءات بيئات تشغيل صندوق الحماية العادية كتابة تلك المصادر القديمة. شغّل `openclaw doctor --fix` لترحيل الإدخالات القديمة الصالحة إلى SQLite. تُعزل الملفات القديمة غير الصالحة بحيث لا يستطيع سجل قديم واحد تالف إخفاء إدخالات بيئات التشغيل الحالية.

## التكوين

توجد إعدادات صندوق الحماية في `~/.openclaw/openclaw.json` ضمن `agents.defaults.sandbox` (توضع التجاوزات الخاصة بكل وكيل في `agents.list[].sandbox`):

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
- [وضع صندوق الحماية](/ar/gateway/sandboxing)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [Doctor](/ar/gateway/doctor): يتحقق من إعداد صندوق الحماية.
