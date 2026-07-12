---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: إدارة بيئات تشغيل وضع الحماية وفحص سياسة وضع الحماية الفعلية
title: CLI لصندوق العزل
x-i18n:
    generated_at: "2026-07-12T05:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

إدارة بيئات تشغيل العزل لتنفيذ الوكيل بشكل معزول: حاويات Docker، أو وجهات SSH، أو خلفيات OpenShell.

## الأوامر

### `openclaw sandbox list`

اعرض بيئات تشغيل العزل مع الحالة، والخلفية، ومدى تطابق الإعداد، والعمر، ومدة الخمول، والجلسة/الوكيل المرتبط.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # حاويات المتصفح فقط
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

أزل بيئات تشغيل العزل لفرض إعادة إنشائها بالإعداد الحالي. تُعاد إنشاء بيئات التشغيل تلقائيًا في المرة التالية التي يُستخدم فيها الوكيل.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # يتضمن الجلسات الفرعية agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # حاويات المتصفح فقط
openclaw sandbox recreate --all --force        # تجاوز التأكيد
```

الخيارات:

- `--all`: إعادة إنشاء جميع حاويات العزل
- `--session <key>`: إعادة إنشاء بيئة التشغيل ذات مفتاح النطاق المطابق تمامًا (كما يظهر في `sandbox list`)؛ من دون توسيع الاسم المختصر
- `--agent <id>`: إعادة إنشاء بيئات التشغيل لوكيل واحد (يطابق `agent:<id>` و`agent:<id>:*`)
- `--browser`: التأثير في حاويات المتصفح فقط
- `--force`: تجاوز مطالبة التأكيد

مرّر خيارًا واحدًا فقط من `--all` أو `--session` أو `--agent`.

بالنسبة إلى `ssh` و`remote` في OpenShell، تكون إعادة الإنشاء أكثر أهمية مما هي عليه مع Docker: تصبح مساحة العمل البعيدة هي النسخة المرجعية بعد التهيئة الأولية، ويحذف `recreate` مساحة العمل البعيدة المرجعية تلك للنطاق المحدد، ثم تعيد عملية التشغيل التالية تهيئتها انطلاقًا من مساحة العمل المحلية الحالية.

### `openclaw sandbox explain`

افحص وضع العزل ونطاقه والوصول إلى مساحة العمل الفعّالة، وسياسة أدوات العزل، وبوابات الأدوات ذات الصلاحيات المرتفعة (مع مسارات مفاتيح الإعداد اللازمة للإصلاح).

يُبقي التقرير `workspaceRoot` بوصفه جذر العزل المُعدّ، ويعرض بشكل منفصل مساحة عمل المضيف الفعّالة، ودليل العمل لبيئة تشغيل الخلفية، وجدول عمليات الربط في Docker. عند استخدام `workspaceAccess: "rw"`، تكون مساحة عمل المضيف الفعّالة هي مساحة عمل الوكيل بدلًا من دليل يقع تحت `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

بخلاف `recreate --session`، يقبل هذا الأمر أسماء الجلسات المختصرة (مثل `main`) ويوسّعها وفقًا للوكيل الذي جرى تحديده.

## لماذا يلزم إجراء إعادة الإنشاء

لا يؤثر تحديث إعداد العزل في الحاويات قيد التشغيل: تحتفظ بيئات التشغيل الحالية بإعداداتها القديمة، ولا تُحذف بيئات التشغيل الخاملة إلا بعد `prune.idleHours` (القيمة الافتراضية 24 ساعة). يمكن للوكلاء المستخدمين بانتظام إبقاء بيئات التشغيل القديمة قائمة إلى أجل غير مسمى. يزيل `openclaw sandbox recreate` بيئة التشغيل القديمة كي يُعاد بناؤها من الإعداد الحالي عند الاستخدام التالي.

<Tip>
فضّل `openclaw sandbox recreate` على التنظيف اليدوي الخاص بكل خلفية. فهو يستخدم سجل بيئات التشغيل الخاص بـ Gateway ويتجنب حالات عدم التطابق عند تغيّر مفاتيح النطاق أو الجلسة.
</Tip>

## الأسباب الشائعة

| التغيير                                                                                                                                                        | الأمر                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| تحديث صورة Docker ‏(`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                      |
| إعداد العزل (`agents.defaults.sandbox.*`)                                                                                                                      | `openclaw sandbox recreate --all`                                      |
| وجهة/مصادقة SSH ‏(`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                      |
| مصدر/سياسة/وضع OpenShell ‏(`plugins.entries.openshell.config.{from,mode,policy}`)                                                                              | `openclaw sandbox recreate --all`                                      |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (أو `--agent <id>` لوكيل واحد)      |

<Note>
تُعاد إنشاء بيئات التشغيل تلقائيًا عند استخدام الوكيل في المرة التالية.
</Note>

## ترحيل السجل

توجد البيانات الوصفية لبيئات تشغيل العزل في قاعدة بيانات حالة SQLite المشتركة. قد تحتوي عمليات التثبيت القديمة على ملفات سجل قديمة لم تعد عمليات القراءة العادية تعيد كتابتها:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- جزء JSON واحد لكل حاوية/متصفح ضمن `~/.openclaw/sandbox/containers/` أو `~/.openclaw/sandbox/browsers/`

شغّل `openclaw doctor --fix` لترحيل الإدخالات القديمة الصالحة إلى SQLite. تُعزل الملفات القديمة غير الصالحة كي لا يتمكن سجل قديم تالف من إخفاء إدخالات بيئات التشغيل الحالية.

## الإعداد

توجد إعدادات العزل في `~/.openclaw/openclaw.json` ضمن `agents.defaults.sandbox` (توضع التجاوزات الخاصة بكل وكيل في `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // معطل، غير رئيسي، الكل
        "backend": "docker", // docker، ssh، openshell (يوفره Plugin)
        "scope": "agent", // جلسة، وكيل، مشترك
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... مزيد من خيارات Docker
        },
        "prune": {
          "idleHours": 24, // حذف تلقائي بعد 24 ساعة من الخمول
          "maxAgeDays": 7, // حذف تلقائي بعد 7 أيام
        },
      },
    },
  },
}
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [العزل](/ar/gateway/sandboxing)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [أداة التشخيص](/ar/gateway/doctor): تتحقق من إعداد العزل.
