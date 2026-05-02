---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيفية عمل عزل OpenClaw: الأوضاع والنطاقات والوصول إلى مساحة العمل والصور'
title: العزل
x-i18n:
    generated_at: "2026-05-02T07:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل خلفيات بيئات عزل** لتقليل نطاق التأثير. هذا **اختياري** وتتحكم فيه الإعدادات (`agents.defaults.sandbox` أو `agents.list[].sandbox`). إذا كان العزل معطلاً، تعمل الأدوات على المضيف. يبقى Gateway على المضيف؛ ويجري تنفيذ الأدوات في بيئة عزل معزولة عند تمكين ذلك.

<Note>
هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد ماديًا من الوصول إلى نظام الملفات والعمليات عندما يفعل النموذج شيئًا غير مناسب.
</Note>

## ما الذي يتم عزله

- تنفيذ الأدوات (`exec` و`read` و`write` و`edit` و`apply_patch` و`process`، إلخ).
- متصفح معزول اختياري (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="تفاصيل المتصفح المعزول">
    - افتراضيًا، يبدأ المتصفح المعزول تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاجه أداة المتصفح. اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - افتراضيًا، تستخدم حاويات المتصفح المعزول شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة. اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
    - يقيّد الخيار الاختياري `agents.defaults.sandbox.browser.cdpSourceRange` دخول CDP عند طرف الحاوية باستخدام قائمة سماح CIDR (مثلًا `172.21.0.1/32`).
    - يكون وصول مراقب noVNC محميًا بكلمة مرور افتراضيًا؛ يصدر OpenClaw عنوان URL برمز قصير العمر يخدم صفحة تمهيد محلية ويفتح noVNC مع كلمة المرور في جزء URL (وليس في سجلات الاستعلام/الترويسات).
    - يتيح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة استهداف متصفح المضيف صراحة.
    - تتحكم قوائم السماح الاختيارية في `target: "custom"`:‏ `allowedControlUrls` و`allowedControlHosts` و`allowedControlPorts`.

  </Accordion>
</AccordionGroup>

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحة بالعمل خارج بيئة العزل (مثل `tools.elevated`).
  - **يتجاوز تنفيذ exec المرتفع العزل ويستخدم مسار الهروب المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان العزل معطلاً، لا يغيّر `tools.elevated` التنفيذ (لأنه على المضيف أصلًا). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **متى** يُستخدم العزل:

<Tabs>
  <Tab title="off">
    لا يوجد عزل.
  </Tab>
  <Tab title="non-main">
    عزل الجلسات **غير الرئيسية** فقط (الافتراضي إذا أردت أن تعمل المحادثات العادية على المضيف).

    يستند `"non-main"` إلى `session.mainKey` (الافتراضي `"main"`)، وليس إلى معرف الوكيل. تستخدم جلسات المجموعة/القناة مفاتيحها الخاصة، لذلك تُعد غير رئيسية وسيتم عزلها.

  </Tab>
  <Tab title="all">
    تعمل كل جلسة داخل بيئة عزل.
  </Tab>
</Tabs>

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` (الافتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين كل الجلسات المعزولة.

## الخلفية

يتحكم `agents.defaults.sandbox.backend` في **بيئة التشغيل** التي توفر العزل:

- `"docker"` (الافتراضي عند تمكين العزل): بيئة تشغيل عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة تشغيل عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة تشغيل عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة تحت `agents.defaults.sandbox.ssh`. وتوجد إعدادات OpenShell الخاصة تحت `plugins.entries.openshell.config`.

### اختيار خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                  | أي مضيف يمكن الوصول إليه عبر SSH        | بيئة عزل يديرها OpenShell                           |
| **الإعداد**           | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف          | Plugin OpenShell ممكّن                            |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ               | مرجعي بعيد (تغذية أولية مرة واحدة)   | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد         | يعتمد على OpenShell                                |
| **عزل المتصفح** | مدعوم                        | غير مدعوم                  | غير مدعوم بعد                                   |
| **روابط التحميل**     | `docker.binds`                   | غير منطبق                            | غير منطبق                                                 |
| **الأفضل لـ**        | التطوير المحلي، عزل كامل        | نقل الحمل إلى آلة بعيدة | بيئات عزل بعيدة مُدارة مع مزامنة اختيارية باتجاهين |

### خلفية Docker

العزل معطل افتراضيًا. إذا مكّنت العزل ولم تختر خلفية، يستخدم OpenClaw خلفية Docker. تنفّذ الأدوات والمتصفحات المعزولة محليًا عبر مقبس برنامج Docker الخفي (`/var/run/docker.sock`). تحدد مساحات أسماء Docker عزل حاوية بيئة العزل.

لتعريض وحدات GPU الخاصة بالمضيف لبيئات عزل Docker، اضبط `agents.defaults.sandbox.docker.gpus` أو تجاوز كل وكيل `agents.list[].sandbox.docker.gpus`. تُمرر القيمة إلى علم Docker `--gpus` كوسيط منفصل، مثل `"all"` أو `"device=GPU-uuid"`، وتتطلب بيئة تشغيل مضيف متوافقة مثل NVIDIA Container Toolkit.

<Warning>
**قيود Docker-out-of-Docker (DooD)**

إذا نشرت OpenClaw Gateway نفسه كحاوية Docker، فإنه ينسّق حاويات العزل الشقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). يقدّم ذلك قيدًا محددًا لتعيين المسارات:

- **يتطلب الإعداد مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس مسار حاوية Gateway الداخلي. عندما يطلب OpenClaw من برنامج Docker الخفي إنشاء بيئة عزل، يقيّم البرنامج الخفي المسارات نسبة إلى مساحة أسماء نظام تشغيل المضيف، وليس مساحة أسماء Gateway.
- **تكافؤ جسر نظام الملفات (خريطة أحجام متطابقة)**: تكتب العملية الأصلية لـ OpenClaw Gateway أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. وبما أن Gateway يقيّم السلسلة نفسها بالضبط (مسار المضيف) من داخل بيئته المحواة، يجب أن يتضمن نشر Gateway خريطة أحجام متطابقة تربط مساحة أسماء المضيف محليًا (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا عيّنت المسارات داخليًا دون تكافؤ مطلق مع المضيف، فسيطرح OpenClaw محليًا خطأ أذونات `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل لا توجد محليًا.
</Warning>

### خلفية SSH

استخدم `backend: "ssh"` عندما تريد من OpenClaw عزل `exec` وأدوات الملفات وقراءات الوسائط على أي آلة يمكن الوصول إليها عبر SSH.

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
    - عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يغذي OpenClaw مساحة العمل البعيدة تلك من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءات وسائط الموجّه وتجهيز الوسائط الواردة مباشرة على مساحة العمل البعيدة عبر SSH.
    - لا يزامن OpenClaw التغييرات البعيدة تلقائيًا إلى مساحة العمل المحلية.

  </Accordion>
  <Accordion title="مواد المصادقة">
    - `identityFile` و`certificateFile` و`knownHostsFile`: استخدم ملفات محلية موجودة ومررها عبر إعداد OpenSSH.
    - `identityData` و`certificateData` و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحلها OpenClaw عبر لقطة بيئة تشغيل الأسرار المعتادة، ويكتبها إلى ملفات مؤقتة بصلاحيات `0600`، ثم يحذفها عند انتهاء جلسة SSH.
    - إذا تم ضبط كل من `*File` و`*Data` للعنصر نفسه، تكون الأولوية لـ `*Data` في جلسة SSH تلك.

  </Accordion>
  <Accordion title="تبعات المرجعية البعيدة">
    هذا نموذج **مرجعي بعيد**. تصبح مساحة عمل SSH البعيدة حالة العزل الحقيقية بعد التغذية الأولية.

    - لا تكون التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw بعد خطوة التغذية الأولية مرئية عن بعد حتى تعيد إنشاء بيئة العزل.
    - يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ويغذيه مرة أخرى من المحلي عند الاستخدام التالي.
    - عزل المتصفح غير مدعوم في خلفية SSH.
    - لا تنطبق إعدادات `sandbox.docker.*` على خلفية SSH.

  </Accordion>
</AccordionGroup>

### خلفية OpenShell

استخدم `backend: "openshell"` عندما تريد من OpenClaw عزل الأدوات في بيئة بعيدة يديرها OpenShell. لدليل الإعداد الكامل، ومرجع الإعدادات، ومقارنة أوضاع مساحة العمل، راجع [صفحة OpenShell المخصصة](/ar/gateway/openshell).

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه مثل خلفية SSH العامة، ويضيف دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete` و`sandbox ssh-config`) إضافة إلى وضع مساحة العمل الاختياري `mirror`.

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

- `mirror` (الافتراضي): تبقى مساحة العمل المحلية مرجعية. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تكون مساحة عمل OpenShell مرجعية بعد إنشاء بيئة العزل. يغذي OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرة على بيئة العزل البعيدة دون مزامنة التغييرات مرة أخرى.

<AccordionGroup>
  <Accordion title="تفاصيل النقل البعيد">
    - يطلب OpenClaw من OpenShell إعداد SSH خاصًا ببيئة العزل عبر `openshell sandbox ssh-config <name>`.
    - يكتب Core إعداد SSH ذلك إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم بواسطة `backend: "ssh"`.
    - في وضع `mirror` فقط تختلف دورة الحياة: مزامنة المحلي إلى البعيد قبل exec، ثم المزامنة مرة أخرى بعد exec.

  </Accordion>
  <Accordion title="قيود OpenShell الحالية">
    - المتصفح المعزول غير مدعوم بعد
    - `sandbox.docker.binds` غير مدعوم على خلفية OpenShell
    - لا تزال مقابض بيئة التشغيل الخاصة بـ Docker تحت `sandbox.docker.*` تنطبق فقط على خلفية Docker

  </Accordion>
</AccordionGroup>

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. هذا هو الجزء الأكثر أهمية عمليًا.

<Tabs>
  <Tab title="mirror (محلي مرجعي)">
    استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية مرجعية**.

    السلوك:

    - قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى بيئة عزل OpenShell.
    - بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
    - لا تزال أدوات الملفات تعمل عبر جسر العزل، لكن مساحة العمل المحلية تظل مصدر الحقيقة بين الدورات.

    استخدم هذا عندما:

    - تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في sandbox تلقائيًا
    - تريد أن يتصرف OpenShell sandbox بأكبر قدر ممكن مثل Docker backend
    - تريد أن تعكس مساحة عمل المضيف كتابات sandbox بعد كل دورة exec

    المقايضة: تكلفة مزامنة إضافية قبل exec وبعده.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح **مساحة عمل OpenShell هي المرجع الأساسي**.

    السلوك:

    - عند إنشاء sandbox لأول مرة، يملأ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرة على مساحة عمل OpenShell البعيدة.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
    - ما زالت قراءات الوسائط وقت الموجه تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر sandbox بدلًا من افتراض مسار مضيف محلي.
    - النقل يتم عبر SSH إلى OpenShell sandbox الذي يعيده `openshell sandbox ssh-config`.

    نتائج مهمة:

    - إذا عدّلت ملفات على المضيف خارج OpenClaw بعد خطوة الملء، فلن يرى sandbox البعيد تلك التغييرات تلقائيًا.
    - إذا أعيد إنشاء sandbox، فستُملأ مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
    - مع `scope: "agent"` أو `scope: "shared"`، تُشارك مساحة العمل البعيدة تلك في النطاق نفسه.

    استخدم هذا عندما:

    - ينبغي أن يعيش sandbox أساسًا في جهة OpenShell البعيدة
    - تريد تقليل عبء المزامنة في كل دورة
    - لا تريد أن تستبدل تعديلات المضيف المحلية حالة sandbox البعيد بصمت

  </Tab>
</Tabs>

اختر `mirror` إذا كنت تفكر في sandbox كبيئة تنفيذ مؤقتة. اختر `remote` إذا كنت تفكر في sandbox كمساحة العمل الحقيقية.

#### دورة حياة OpenShell

ما زالت OpenShell sandboxes تُدار عبر دورة حياة sandbox العادية:

- يعرض `openclaw sandbox list` بيئات تشغيل OpenShell وكذلك بيئات تشغيل Docker
- يحذف `openclaw sandbox recreate` بيئة التشغيل الحالية ويتيح لـ OpenClaw إعادة إنشائها عند الاستخدام التالي
- منطق التنظيف مدرك للـ backend أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة خصوصًا:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المرجعية لذلك النطاق
- يملأ الاستخدام التالي مساحة عمل بعيدة جديدة من مساحة العمل المحلية

بالنسبة إلى وضع `mirror`، تعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة لأن مساحة العمل المحلية تبقى المرجع الأساسي على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما يمكن أن يراه sandbox**:

<Tabs>
  <Tab title="none (default)">
    ترى الأدوات مساحة عمل sandbox تحت `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    يركّب مساحة عمل الوكيل للقراءة فقط في `/agent` (يعطّل `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    يركّب مساحة عمل الوكيل للقراءة/الكتابة في `/workspace`.
  </Tab>
</Tabs>

مع OpenShell backend:

- ما زال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر مرجعي بين دورات exec
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر مرجعي بعد الملء الأولي
- ما زال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

تُنسخ الوسائط الواردة إلى مساحة عمل sandbox النشطة (`media/inbound/*`).

<Note>
**ملاحظة Skills:** أداة `read` مجذّرة في sandbox. مع `workspaceAccess: "none"`، يعكس OpenClaw المهارات المؤهلة داخل مساحة عمل sandbox (`.../skills`) حتى يمكن قراءتها. مع `"rw"`، تكون مهارات مساحة العمل قابلة للقراءة من `/workspace/skills`.
</Note>

## عمليات ربط مخصصة

يركّب `agents.defaults.sandbox.docker.binds` أدلة مضيف إضافية داخل الحاوية. الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

تُدمج عمليات الربط العامة والخاصة بكل وكيل **ولا تُستبدل**. ضمن `scope: "shared"`، تُتجاهل عمليات الربط الخاصة بكل وكيل.

يركّب `agents.defaults.sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية **متصفح sandbox** فقط.

- عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- عند إغفاله، تعود حاوية المتصفح إلى `agents.defaults.sandbox.docker.binds` (متوافق مع الإصدارات السابقة).

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
**أمان الربط**

- تتجاوز عمليات الربط نظام ملفات sandbox: فهي تكشف مسارات المضيف بالوضع الذي تضبطه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطرة (مثل: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات تركيب الأصل التي قد تكشفها).
- يحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في دليل المنزل مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- لا يقتصر التحقق من الربط على مطابقة السلاسل. يطبّع OpenClaw مسار المصدر، ثم يحله مرة أخرى عبر أعمق سلف موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها.
- يعني ذلك أن عمليات الإفلات عبر أصل رابط رمزي ما زالت تفشل مغلقة حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: ما زال `/workspace/run-link/new-file` يُحل كـ `/var/run/...` إذا كان `run-link` يشير إلى هناك.
- تُحوّل جذور المصدر المسموح بها إلى صيغتها المرجعية بالطريقة نفسها، لذلك يظل المسار الذي يبدو داخل قائمة السماح فقط قبل حل الرابط الرمزي مرفوضًا باعتباره `outside allowed roots`.
- ينبغي أن تكون عمليات تركيب البيانات الحساسة (الأسرار، مفاتيح SSH، بيانات اعتماد الخدمات) بوضع `:ro` إلا إذا كان ذلك مطلوبًا تمامًا.
- ادمج ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة إلى مساحة العمل؛ تبقى أوضاع الربط مستقلة.
- راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل عمليات الربط مع سياسة الأدوات وexec المرفوع.

</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Note>
**سحب المصدر مقابل تثبيت npm**

تتوفر سكربتات المساعدة `scripts/sandbox-setup.sh` و`scripts/sandbox-common-setup.sh` و`scripts/sandbox-browser-setup.sh` فقط عند التشغيل من [سحب المصدر](https://github.com/openclaw/openclaw). وهي غير مضمنة في حزمة npm.

إذا ثبتّ OpenClaw عبر `npm install -g openclaw`، فاستخدم أوامر `docker build` المضمنة المعروضة أدناه بدلًا من ذلك.
</Note>

<Steps>
  <Step title="Build the default image">
    من سحب المصدر:

    ```bash
    scripts/sandbox-setup.sh
    ```

    من تثبيت npm (لا حاجة إلى سحب المصدر):

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

    لا تتضمن الصورة الافتراضية Node. إذا احتاجت مهارة إلى Node (أو بيئات تشغيل أخرى)، فإما أن تضمّن صورة مخصصة أو تثبت عبر `sandbox.docker.setupCommand` (يتطلب خروجًا إلى الشبكة + جذرًا قابلًا للكتابة + مستخدم root).

    لا يستبدل OpenClaw بصمت `debian:bookworm-slim` العادي عند فقدان `openclaw-sandbox:bookworm-slim`. تفشل عمليات sandbox التي تستهدف الصورة الافتراضية بسرعة مع تعليمة بناء إلى أن تبنيها، لأن الصورة المضمنة تحمل `python3` لمساعدات الكتابة/التحرير في sandbox.

  </Step>
  <Step title="Optional: build the common image">
    للحصول على صورة sandbox أكثر وظيفية مع أدوات شائعة (مثل `curl` و`jq` و`nodejs` و`python3` و`git`):

    من سحب المصدر:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    من تثبيت npm، ابنِ الصورة الافتراضية أولًا (انظر أعلاه)، ثم ابنِ الصورة المشتركة فوقها باستخدام [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) من المستودع.

    ثم اضبط `agents.defaults.sandbox.docker.image` على `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    من سحب المصدر:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    من تثبيت npm، ابنِ باستخدام [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) من المستودع.

  </Step>
</Steps>

افتراضيًا، تعمل حاويات Docker sandbox **بلا شبكة**. تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    تطبق صورة متصفح sandbox المضمنة أيضًا إعدادات بدء تشغيل Chromium محافظة لأحمال العمل داخل الحاويات. تشمل إعدادات الحاوية الافتراضية الحالية:

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
    - `--no-sandbox` عند تفعيل `noSandbox`.
    - أعلام تقوية الرسوميات الثلاثة (`--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`) اختيارية ومفيدة عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل العمل لديك يتطلب WebGL أو ميزات متصفح/ثلاثية الأبعاد أخرى.
    - يكون `--disable-extensions` مفعّلًا افتراضيًا ويمكن تعطيله باستخدام `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
    - يتحكم `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` في `--renderer-process-limit=2`، حيث يُبقي `0` افتراضي Chromium.

    إذا كنت تحتاج إلى ملف تعريف تشغيل مختلف، فاستخدم صورة متصفح مخصصة وقدّم نقطة دخول خاصة بك. بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، استخدم `browser.extraArgs` لإلحاق أعلام بدء تشغيل إضافية.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` محظور.
    - `network: "container:<id>"` محظور افتراضيًا (مخاطر تجاوز الانضمام إلى namespace).
    - تجاوز الطوارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

توجد تثبيتات Docker والـ Gateway الموجود داخل حاوية هنا: [Docker](/ar/install/docker)

بالنسبة إلى نشرات Docker gateway، يمكن لـ `scripts/docker/setup.sh` تمهيد تهيئة sandbox. اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتمكين ذلك المسار. يمكنك تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. الإعداد الكامل ومرجع البيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية sandbox (وليس في كل تشغيل). ينفذ داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - قيمة `docker.network` الافتراضية هي `"none"` (لا خروج للشبكة)، لذلك ستفشل تثبيتات الحزم.
    - يتطلب `docker.network: "container:<id>"` ضبط `dangerouslyAllowContainerNamespaceJoin: true` وهو للطوارئ فقط.
    - يمنع `readOnlyRoot: true` الكتابة؛ اضبط `readOnlyRoot: false` أو ابنِ صورة مخصصة.
    - يجب أن يكون `user` هو root لتثبيتات الحزم (أغفل `user` أو اضبط `user: "0:0"`).
    - لا يرث sandbox exec متغيرات `process.env` الخاصة بالمضيف. استخدم `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بالمهارات.

  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومخارج التجاوز

تظل سياسات السماح/الرفض للأدوات مطبقة قبل قواعد صندوق الحماية. إذا كانت أداة مرفوضة عمومًا أو لكل وكيل، فلن يعيدها صندوق الحماية.

`tools.elevated` هو مخرج تجاوز صريح يشغّل `exec` خارج صندوق الحماية (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`). لا تنطبق توجيهات `/exec` إلا على المرسلين المصرّح لهم وتستمر لكل جلسة؛ لتعطيل `exec` بشكل صارم، استخدم رفض سياسة الأدوات (راجع [صندوق الحماية مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع صندوق الحماية الفعّال، وسياسة الأدوات، ومفاتيح إعدادات الإصلاح.
- راجع [صندوق الحماية مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للاطلاع على النموذج الذهني لسؤال "لماذا تم حظر هذا؟".

أبقِه مؤمّنًا بإحكام.

## تجاوزات الوكلاء المتعددين

يمكن لكل وكيل تجاوز صندوق الحماية + الأدوات: `agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات صندوق الحماية). راجع [صندوق حماية وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأسبقية.

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

- [صندوق حماية وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) — تجاوزات لكل وكيل والأسبقية
- [OpenShell](/ar/gateway/openshell) — إعداد خلفية صندوق الحماية المُدارة، وأوضاع مساحة العمل، ومرجع الإعدادات
- [إعدادات صندوق الحماية](/ar/gateway/config-agents#agentsdefaultssandbox)
- [صندوق الحماية مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا تم حظر هذا؟"
- [الأمان](/ar/gateway/security)
