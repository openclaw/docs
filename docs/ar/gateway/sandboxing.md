---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيفية عمل العزل في OpenClaw: الأوضاع والنطاقات والوصول إلى مساحة العمل والصور'
title: العزل في بيئة محمية
x-i18n:
    generated_at: "2026-05-11T20:32:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a90a68fdab1fdaef462bc6be589cb510d89c01138a0d43927e29d55bbb6e3ea
    source_path: gateway/sandboxing.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل خلفيات بيئات معزولة** لتقليل نطاق التأثير. هذا **اختياري** وتتحكم به الإعدادات (`agents.defaults.sandbox` أو `agents.list[].sandbox`). إذا كان العزل متوقفًا، تعمل الأدوات على المضيف. يبقى Gateway على المضيف؛ وينفذ تشغيل الأدوات داخل بيئة معزولة عند التمكين.

<Note>
هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد ماديًا من الوصول إلى نظام الملفات والعمليات عندما يقوم النموذج بشيء غير مناسب.
</Note>

## ما الذي يُعزل

- تنفيذ الأدوات (`exec`، `read`، `write`، `edit`، `apply_patch`، `process`، وما إلى ذلك).
- متصفح معزول اختياري (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="تفاصيل المتصفح المعزول">
    - افتراضيًا، يبدأ المتصفح المعزول تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاجه أداة المتصفح. اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - افتراضيًا، تستخدم حاويات المتصفح المعزول شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة. اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
    - يقيّد الخيار `agents.defaults.sandbox.browser.cdpSourceRange` الاختياري دخول CDP عند حافة الحاوية باستخدام قائمة سماح CIDR (مثل `172.21.0.1/32`).
    - وصول مراقب noVNC محمي بكلمة مرور افتراضيًا؛ يصدر OpenClaw عنوان URL برمز قصير العمر يخدم صفحة تمهيد محلية ويفتح noVNC مع كلمة المرور في جزء URL (وليس في سجلات الاستعلام/الرؤوس).
    - يسمح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة باستهداف متصفح المضيف صراحةً.
    - تتحكم قوائم السماح الاختيارية في `target: "custom"`: `allowedControlUrls`، و`allowedControlHosts`، و`allowedControlPorts`.

  </Accordion>
</AccordionGroup>

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج البيئة المعزولة (مثل `tools.elevated`).
  - **يتجاوز تنفيذ exec المرتفع العزل ويستخدم مسار الخروج المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان العزل متوقفًا، فإن `tools.elevated` لا يغيّر التنفيذ (لأنه يعمل أصلًا على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **وقت** استخدام العزل:

<Tabs>
  <Tab title="off">
    لا يوجد عزل.
  </Tab>
  <Tab title="non-main">
    اعزل جلسات **غير الرئيسية** فقط (الخيار الافتراضي إذا كنت تريد أن تعمل المحادثات العادية على المضيف).

    يعتمد `"non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرف الوكيل. تستخدم جلسات المجموعة/القناة مفاتيحها الخاصة، لذلك تُعد غير رئيسية وستُعزل.

  </Tab>
  <Tab title="all">
    تعمل كل جلسة داخل بيئة معزولة.
  </Tab>
</Tabs>

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي تُنشأ:

- `"agent"` (افتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة تشترك فيها كل الجلسات المعزولة.

## الخلفية

يتحكم `agents.defaults.sandbox.backend` في **بيئة التشغيل** التي توفر العزل:

- `"docker"` (الافتراضي عند تمكين العزل): بيئة تشغيل عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة تشغيل عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة تشغيل عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة تحت `agents.defaults.sandbox.ssh`. وتوجد إعدادات OpenShell الخاصة تحت `plugins.entries.openshell.config`.

### اختيار خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                  | أي مضيف يمكن الوصول إليه عبر SSH        | بيئة معزولة مُدارة من OpenShell                           |
| **الإعداد**           | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف          | Plugin OpenShell مُمكّن                            |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ               | مرجعية بعيدة (تهيئة أولية مرة واحدة)   | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد         | يعتمد على OpenShell                                |
| **عزل المتصفح** | مدعوم                        | غير مدعوم                  | غير مدعوم بعد                                   |
| **ربط التحميلات**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **الأفضل لـ**        | التطوير المحلي، العزل الكامل        | إسناد الحمل إلى جهاز بعيد | بيئات معزولة بعيدة مُدارة مع مزامنة اختيارية باتجاهين |

### خلفية Docker

العزل متوقف افتراضيًا. إذا فعّلت العزل ولم تختر خلفية، يستخدم OpenClaw خلفية Docker. تنفذ هذه الخلفية الأدوات والمتصفحات المعزولة محليًا عبر مقبس Docker daemon (`/var/run/docker.sock`). يتحدد عزل حاوية البيئة المعزولة بواسطة namespaces الخاصة بـ Docker.

لكشف وحدات GPU في المضيف لبيئات Docker المعزولة، اضبط `agents.defaults.sandbox.docker.gpus` أو التجاوز لكل وكيل `agents.list[].sandbox.docker.gpus`. تُمرر القيمة إلى علم Docker `--gpus` كوسيط منفصل، مثل `"all"` أو `"device=GPU-uuid"`، وتتطلب بيئة تشغيل مضيف متوافقة مثل NVIDIA Container Toolkit.

<Warning>
**قيود Docker-out-of-Docker (DooD)**

إذا نشرت OpenClaw Gateway نفسه كحاوية Docker، فإنه ينسق حاويات بيئة معزولة شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). يفرض هذا قيدًا محددًا على ربط المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن تحتوي إعدادات `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس مسار حاوية Gateway الداخلي. عندما يطلب OpenClaw من Docker daemon إنشاء بيئة معزولة، يقيّم daemon المسارات نسبةً إلى namespace نظام تشغيل المضيف، وليس namespace Gateway.
- **تكافؤ جسر نظام الملفات (خريطة وحدات تخزين متطابقة)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. وبما أن Gateway يقيّم السلسلة نفسها تمامًا (مسار المضيف) من داخل بيئته المحوّاة، يجب أن يتضمن نشر Gateway خريطة وحدات تخزين متطابقة تربط namespace المضيف أصليًا (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **وضع كود Codex**: عندما تكون بيئة OpenClaw المعزولة نشطة، يقيّد OpenClaw دورات خادم تطبيق Codex إلى عزل Codex `workspace-write` حتى إذا كان الإعداد الافتراضي لـ Plugin Codex هو `danger-full-access`. لا تركّب مقبس Docker الخاص بالمضيف داخل حاويات بيئة الوكيل المعزولة أو بيئات Codex المعزولة المخصصة.

إذا ربطت المسارات داخليًا دون تكافؤ مطلق مع المضيف، يرمي OpenClaw أصليًا خطأ إذن `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل لا توجد أصليًا.
</Warning>

### خلفية SSH

استخدم `backend: "ssh"` عندما تريد من OpenClaw عزل `exec`، وأدوات الملفات، وقراءات الوسائط على أي جهاز يمكن الوصول إليه عبر SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="كيف يعمل">
    - ينشئ OpenClaw جذرًا بعيدًا لكل نطاق تحت `sandbox.ssh.workspaceRoot`.
    - عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يهيئ OpenClaw مساحة العمل البعيدة تلك من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec`، و`read`، و`write`، و`edit`، و`apply_patch`، وقراءات وسائط الموجه، وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية تلقائيًا.

  </Accordion>
  <Accordion title="مواد المصادقة">
    - `identityFile`، و`certificateFile`، و`knownHostsFile`: استخدم الملفات المحلية الموجودة ومررها عبر إعدادات OpenSSH.
    - `identityData`، و`certificateData`، و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحلها OpenClaw عبر لقطة بيئة تشغيل الأسرار العادية، ويكتبها إلى ملفات مؤقتة بأذونات `0600`، ثم يحذفها عند انتهاء جلسة SSH.
    - إذا عُيّن كل من `*File` و`*Data` للعنصر نفسه، تكون الأولوية لـ `*Data` في جلسة SSH تلك.

  </Accordion>
  <Accordion title="تبعات المرجعية البعيدة">
    هذا نموذج **مرجعي بعيد**. تصبح مساحة عمل SSH البعيدة حالة البيئة المعزولة الحقيقية بعد التهيئة الأولية.

    - لا تظهر التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw بعد خطوة التهيئة على البعيد حتى تعيد إنشاء البيئة المعزولة.
    - يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ويعيد التهيئة من المحلي عند الاستخدام التالي.
    - عزل المتصفح غير مدعوم في خلفية SSH.
    - لا تنطبق إعدادات `sandbox.docker.*` على خلفية SSH.

  </Accordion>
</AccordionGroup>

### خلفية OpenShell

استخدم `backend: "openshell"` عندما تريد من OpenClaw عزل الأدوات في بيئة بعيدة مُدارة من OpenShell. للاطلاع على دليل الإعداد الكامل، ومرجع الإعدادات، ومقارنة أوضاع مساحة العمل، راجع [صفحة OpenShell المخصصة](/ar/gateway/openshell).

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه كخلفية SSH العامة، ويضيف دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete`، و`sandbox ssh-config`) بالإضافة إلى وضع مساحة العمل الاختياري `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

أوضاع OpenShell:

- `mirror` (افتراضي): تبقى مساحة العمل المحلية مرجعية. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تكون مساحة عمل OpenShell هي المرجع بعد إنشاء البيئة المعزولة. يهيئ OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرةً على البيئة المعزولة البعيدة دون مزامنة التغييرات مرة أخرى.

<AccordionGroup>
  <Accordion title="تفاصيل النقل البعيد">
    - يطلب OpenClaw من OpenShell إعدادات SSH الخاصة بالبيئة المعزولة عبر `openshell sandbox ssh-config <name>`.
    - يكتب Core إعدادات SSH تلك إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم بواسطة `backend: "ssh"`.
    - في وضع `mirror` تختلف دورة الحياة فقط: مزامنة المحلي إلى البعيد قبل exec، ثم المزامنة مرة أخرى بعد exec.

  </Accordion>
  <Accordion title="قيود OpenShell الحالية">
    - المتصفح المعزول غير مدعوم بعد
    - `sandbox.docker.binds` غير مدعوم في خلفية OpenShell
    - تظل مفاتيح بيئة التشغيل الخاصة بـ Docker تحت `sandbox.docker.*` منطبقة على خلفية Docker فقط

  </Accordion>
</AccordionGroup>

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. هذا هو الجزء الأكثر أهمية عمليًا.

<Tabs>
  <Tab title="mirror (local canonical)">
    استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية هي المرجع**.

    السلوك:

    - قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى صندوق رمل OpenShell.
    - بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
    - تظل أدوات الملفات تعمل عبر جسر صندوق الرمل، لكن مساحة العمل المحلية تبقى مصدر الحقيقة بين الأدوار.

    استخدم هذا عندما:

    - تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر تلك التغييرات في صندوق الرمل تلقائيًا
    - تريد أن يتصرف صندوق رمل OpenShell بأكبر قدر ممكن مثل واجهة Docker الخلفية
    - تريد أن تعكس مساحة عمل المضيف عمليات الكتابة في صندوق الرمل بعد كل دور exec

    المفاضلة: تكلفة مزامنة إضافية قبل exec وبعده.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن **تصبح مساحة عمل OpenShell هي المصدر المعتمد**.

    السلوك:

    - عند إنشاء صندوق الرمل لأول مرة، يملأ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرة على مساحة عمل OpenShell البعيدة.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
    - تظل قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر صندوق الرمل بدلًا من افتراض مسار مضيف محلي.
    - النقل هو SSH إلى صندوق رمل OpenShell الذي يرجعه `openshell sandbox ssh-config`.

    نتائج مهمة:

    - إذا عدّلت ملفات على المضيف خارج OpenClaw بعد خطوة الملء، فلن يرى صندوق الرمل البعيد تلك التغييرات تلقائيًا.
    - إذا أُعيد إنشاء صندوق الرمل، تُملأ مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
    - مع `scope: "agent"` أو `scope: "shared"`، تُشارك مساحة العمل البعيدة هذه ضمن النطاق نفسه.

    استخدم هذا عندما:

    - يجب أن يعيش صندوق الرمل أساسًا على جانب OpenShell البعيد
    - تريد تقليل عبء المزامنة في كل دور
    - لا تريد أن تستبدل التعديلات المحلية على المضيف حالة صندوق الرمل البعيد بصمت

  </Tab>
</Tabs>

اختر `mirror` إذا كنت تفكر في صندوق الرمل كبيئة تنفيذ مؤقتة. اختر `remote` إذا كنت تفكر في صندوق الرمل كمساحة العمل الحقيقية.

#### دورة حياة OpenShell

ما زالت صناديق رمل OpenShell تُدار عبر دورة حياة صندوق الرمل العادية:

- يعرض `openclaw sandbox list` بيئات تشغيل OpenShell بالإضافة إلى بيئات تشغيل Docker
- يحذف `openclaw sandbox recreate` بيئة التشغيل الحالية ويتيح لـ OpenClaw إعادة إنشائها عند الاستخدام التالي
- منطق التنظيف واعٍ بواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة خصوصًا:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المعتمدة لذلك النطاق
- الاستخدام التالي يملأ مساحة عمل بعيدة جديدة من مساحة العمل المحلية

بالنسبة إلى وضع `mirror`، تعيد إعادة الإنشاء ضبط بيئة التنفيذ البعيدة أساسًا لأن مساحة العمل المحلية تظل معتمدة على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما يمكن لصندوق الرمل رؤيته**:

<Tabs>
  <Tab title="none (default)">
    ترى الأدوات مساحة عمل صندوق رمل تحت `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    يثبّت مساحة عمل الوكيل للقراءة فقط عند `/agent` (يعطّل `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    يثبّت مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`.
  </Tab>
</Tabs>

مع واجهة OpenShell الخلفية:

- ما زال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر معتمد بين أدوار exec
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر معتمد بعد الملء الأولي
- ما زال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

تُنسخ الوسائط الواردة إلى مساحة عمل صندوق الرمل النشطة (`media/inbound/*`).

<Note>
**ملاحظة Skills:** أداة `read` متجذرة في صندوق الرمل. مع `workspaceAccess: "none"`، يعكس OpenClaw المهارات المؤهلة إلى مساحة عمل صندوق الرمل (`.../skills`) حتى يمكن قراءتها. مع `"rw"`، يمكن قراءة مهارات مساحة العمل من `/workspace/skills`.
</Note>

## عمليات التثبيت المخصصة عبر bind

يثبّت `agents.defaults.sandbox.docker.binds` أدلة مضيف إضافية داخل الحاوية. التنسيق: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

تُدمج عمليات bind العامة والخاصة بكل وكيل **ولا تُستبدل**. تحت `scope: "shared"`، تُتجاهل عمليات bind الخاصة بكل وكيل.

يثبّت `agents.defaults.sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية **متصفح صندوق الرمل** فقط.

- عند تعيينه (بما في ذلك `[]`)، يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- عند حذفه، تعود حاوية المتصفح إلى `agents.defaults.sandbox.docker.binds` (متوافق مع الإصدارات السابقة).

مثال (مصدر للقراءة فقط + دليل بيانات إضافي):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**أمان bind**

- تتجاوز عمليات bind نظام ملفات صندوق الرمل: فهي تكشف مسارات المضيف بالوضع الذي تضبطه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر bind الخطرة (على سبيل المثال: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات تثبيت الآباء التي قد تكشفها).
- يحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في الدليل الرئيسي مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- التحقق من bind ليس مجرد مطابقة نصية. يطبّع OpenClaw مسار المصدر، ثم يحله مرة أخرى عبر أعمق سلف موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها.
- هذا يعني أن محاولات الهروب عبر أب رابط رمزي تظل تفشل بشكل مغلق حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: ما زال `/workspace/run-link/new-file` يتحلل كـ `/var/run/...` إذا كان `run-link` يشير إلى هناك.
- تُحوّل جذور المصدر المسموح بها إلى مساراتها المعتمدة بالطريقة نفسها، لذلك يُرفض المسار الذي يبدو فقط داخل قائمة السماح قبل حل الرابط الرمزي باعتباره `outside allowed roots`.
- يجب أن تكون عمليات التثبيت الحساسة (الأسرار، مفاتيح SSH، بيانات اعتماد الخدمة) `:ro` ما لم تكن مطلوبة تمامًا.
- ادمج ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة إلى مساحة العمل؛ تبقى أوضاع bind مستقلة.
- راجع [سياسة صندوق الرمل مقابل سياسة الأدوات مقابل التنفيذ المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيف تتفاعل عمليات bind مع سياسة الأدوات وexec المرتفع.

</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Note>
**نسخة المصدر مقابل تثبيت npm**

تتوفر سكربتات المساعدة `scripts/sandbox-setup.sh` و`scripts/sandbox-common-setup.sh` و`scripts/sandbox-browser-setup.sh` فقط عند التشغيل من [نسخة مصدر](https://github.com/openclaw/openclaw). لا تُضمّن في حزمة npm.

إذا ثبّت OpenClaw عبر `npm install -g openclaw`، فاستخدم أوامر `docker build` المضمنة المعروضة أدناه بدلًا من ذلك.
</Note>

<Steps>
  <Step title="Build the default image">
    من نسخة مصدر:

    ```bash
    scripts/sandbox-setup.sh
    ```

    من تثبيت npm (لا حاجة إلى نسخة مصدر):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    لا تتضمن الصورة الافتراضية Node. إذا احتاجت مهارة إلى Node (أو بيئات تشغيل أخرى)، فإما أن تبني صورة مخصصة أو تثبّت عبر `sandbox.docker.setupCommand` (يتطلب خروجًا إلى الشبكة + جذرًا قابلًا للكتابة + مستخدم root).

    لا يستبدل OpenClaw بصمت `debian:bookworm-slim` العادي عندما تكون `openclaw-sandbox:bookworm-slim` مفقودة. تفشل عمليات تشغيل صندوق الرمل التي تستهدف الصورة الافتراضية بسرعة مع تعليمات بناء إلى أن تبنيها، لأن الصورة المرفقة تحمل `python3` لمساعدات الكتابة/التحرير في صندوق الرمل.

  </Step>
  <Step title="Optional: build the common image">
    للحصول على صورة صندوق رمل أكثر وظيفية مع أدوات شائعة (على سبيل المثال `curl` و`jq` و`nodejs` و`python3` و`git`):

    من نسخة مصدر:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    من تثبيت npm، ابنِ الصورة الافتراضية أولًا (انظر أعلاه)، ثم ابنِ الصورة المشتركة فوقها باستخدام [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) من المستودع.

    ثم اضبط `agents.defaults.sandbox.docker.image` على `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    من نسخة مصدر:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    من تثبيت npm، ابنِ باستخدام [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) من المستودع.

  </Step>
</Steps>

افتراضيًا، تعمل حاويات صندوق رمل Docker مع **عدم وجود شبكة**. تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    تطبّق صورة متصفح صندوق الرمل المرفقة أيضًا إعدادات بدء Chromium محافظة لأحمال العمل داخل الحاويات. تتضمن الإعدادات الافتراضية الحالية للحاوية:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox` عندما يكون `noSandbox` مفعّلًا.
    - علامات تعزيز الرسوميات الثلاث (`--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`) اختيارية ومفيدة عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل عملك يتطلب WebGL أو ميزات 3D/متصفح أخرى.
    - `--disable-extensions` مفعّل افتراضيًا ويمكن تعطيله باستخدام `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
    - يتحكم `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` في `--renderer-process-limit=2`، حيث يُبقي `0` إعداد Chromium الافتراضي.

    إذا كنت تحتاج إلى ملف تعريف تشغيل مختلف، فاستخدم صورة متصفح مخصصة ووفّر نقطة دخول خاصة بك. بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، استخدم `browser.extraArgs` لإلحاق علامات بدء إضافية.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` محظور.
    - `network: "container:<id>"` محظور افتراضيًا (خطر تجاوز عبر الانضمام إلى namespace).
    - تجاوز الطوارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

توجد تثبيتات Docker وGateway الحاوي هنا: [Docker](/ar/install/docker)

بالنسبة إلى نشرات Docker Gateway، يمكن لـ `scripts/docker/setup.sh` تمهيد إعدادات صندوق الرمل. اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتمكين ذلك المسار. يمكنك تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. مرجع الإعداد الكامل والبيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية صندوق الرمل (وليس في كل تشغيل). يُنفّذ داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="المزالق الشائعة">
    - القيمة الافتراضية لـ `docker.network` هي `"none"` (بلا اتصال صادر)، لذلك ستفشل عمليات تثبيت الحزم.
    - يتطلب `docker.network: "container:<id>"` ضبط `dangerouslyAllowContainerNamespaceJoin: true` وهو مخصص لحالات الطوارئ فقط.
    - يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو ابنِ صورة مخصصة.
    - يجب أن يكون `user` هو الجذر لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
    - لا يرث تنفيذ Sandbox متغيرات `process.env` من المضيف. استخدم `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بالمهارات.

  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومخارج الطوارئ

تظل سياسات السماح/المنع للأدوات مطبقة قبل قواعد Sandbox. إذا كانت أداة ممنوعة عمومًا أو لكل وكيل، فلن يعيدها Sandbox.

`tools.elevated` هو مخرج طوارئ صريح يشغّل `exec` خارج Sandbox (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`). لا تنطبق توجيهات `/exec` إلا على المرسلين المصرح لهم وتستمر لكل جلسة؛ لتعطيل `exec` بشكل صارم، استخدم منع سياسة الأدوات (راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع Sandbox الفعال، وسياسة الأدوات، ومفاتيح تكوين الإصلاح.
- راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للحصول على النموذج الذهني لسؤال "لماذا هذا محظور؟".

أبقِه محكم الإغلاق.

## تجاوزات الوكلاء المتعددين

يمكن لكل وكيل تجاوز Sandbox + الأدوات: `agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات Sandbox). راجع [Sandbox والأدوات للوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأسبقية.

## مثال تفعيل أدنى

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## ذات صلة

- [Sandbox والأدوات للوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) — تجاوزات لكل وكيل والأسبقية
- [OpenShell](/ar/gateway/openshell) — إعداد خلفية Sandbox المُدارة، وأوضاع مساحة العمل، ومرجع التكوين
- [تكوين Sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا هذا محظور؟"
- [الأمان](/ar/gateway/security)
