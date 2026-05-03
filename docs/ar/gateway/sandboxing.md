---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيف يعمل وضع الحماية في OpenClaw: الأوضاع والنطاقات والوصول إلى مساحة العمل والصور'
title: العزل في بيئة محمية
x-i18n:
    generated_at: "2026-05-03T21:34:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل خلفيات عزل** لتقليل نطاق التأثير. هذا **اختياري** وتتحكم فيه الإعدادات (`agents.defaults.sandbox` أو `agents.list[].sandbox`). إذا كان العزل متوقفًا، تعمل الأدوات على المضيف. يبقى Gateway على المضيف؛ أما تنفيذ الأدوات فيعمل داخل عزل منفصل عند تمكينه.

<Note>
هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد بشكل ملموس من الوصول إلى نظام الملفات والعمليات عندما يفعل النموذج شيئًا غير صحيح.
</Note>

## ما الذي يخضع للعزل

- تنفيذ الأدوات (`exec`، `read`، `write`، `edit`، `apply_patch`، `process`، إلخ).
- متصفح معزول اختياري (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - افتراضيًا، يبدأ متصفح العزل تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاج إليه أداة المتصفح. اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - افتراضيًا، تستخدم حاويات متصفح العزل شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة. اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
    - يقيّد `agents.defaults.sandbox.browser.cdpSourceRange` الاختياري دخول CDP عند حافة الحاوية بقائمة سماح CIDR (على سبيل المثال `172.21.0.1/32`).
    - يكون وصول مراقب noVNC محميًا بكلمة مرور افتراضيًا؛ يصدر OpenClaw عنوان URL قصير الأجل برمز مميز يعرض صفحة تمهيد محلية ويفتح noVNC مع كلمة المرور في جزء عنوان URL (وليس في سجلات الاستعلام/الرؤوس).
    - يتيح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة استهداف متصفح المضيف صراحةً.
    - تضبط قوائم السماح الاختيارية `target: "custom"`: ‏`allowedControlUrls`، و`allowedControlHosts`، و`allowedControlPorts`.

  </Accordion>
</AccordionGroup>

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج العزل (مثل `tools.elevated`).
  - **يتجاوز exec المرتفع العزل ويستخدم مسار الخروج المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان العزل متوقفًا، فلا يغيّر `tools.elevated` التنفيذ (لأنه يعمل بالفعل على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **متى** يُستخدم العزل:

<Tabs>
  <Tab title="off">
    لا يوجد عزل.
  </Tab>
  <Tab title="non-main">
    اعزل جلسات **غير الرئيسية** فقط (الافتراضي إذا كنت تريد أن تبقى المحادثات العادية على المضيف).

    يستند `"non-main"` إلى `session.mainKey` (الافتراضي `"main"`)، وليس إلى معرّف الوكيل. تستخدم جلسات المجموعة/القناة مفاتيحها الخاصة، لذلك تُعد غير رئيسية وستُعزل.

  </Tab>
  <Tab title="all">
    تعمل كل جلسة داخل عزل.
  </Tab>
</Tabs>

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي تُنشأ:

- `"agent"` (افتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين كل الجلسات المعزولة.

## الخلفية

يتحكم `agents.defaults.sandbox.backend` في **بيئة التشغيل** التي توفر العزل:

- `"docker"` (الافتراضي عند تمكين العزل): بيئة تشغيل عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة تشغيل عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة تشغيل عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة ضمن `agents.defaults.sandbox.ssh`. توجد إعدادات OpenShell الخاصة ضمن `plugins.entries.openshell.config`.

### اختيار خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                  | أي مضيف يمكن الوصول إليه عبر SSH        | عزل مُدار بواسطة OpenShell                           |
| **الإعداد**           | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف          | Plugin OpenShell مفعّل                            |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ               | المرجع البعيد (بذر مرة واحدة)   | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد         | يعتمد على OpenShell                                |
| **عزل المتصفح** | مدعوم                        | غير مدعوم                  | غير مدعوم بعد                                   |
| **ربط التحميلات**     | `docker.binds`                   | غير منطبق                            | غير منطبق                                                 |
| **الأفضل لـ**        | التطوير المحلي، عزل كامل        | نقل الحمل إلى جهاز بعيد | عزلات بعيدة مُدارة مع مزامنة ثنائية اختيارية |

### خلفية Docker

العزل متوقف افتراضيًا. إذا مكّنت العزل ولم تختر خلفية، يستخدم OpenClaw خلفية Docker. ينفّذ الأدوات ومتصفحات العزل محليًا عبر مقبس عفريت Docker (`/var/run/docker.sock`). يتحدد عزل حاوية العزل بواسطة نطاقات أسماء Docker.

لإتاحة وحدات GPU الخاصة بالمضيف لعزلات Docker، اضبط `agents.defaults.sandbox.docker.gpus` أو تجاوز كل وكيل `agents.list[].sandbox.docker.gpus`. تُمرر القيمة إلى علم Docker‏ `--gpus` كوسيط منفصل، مثل `"all"` أو `"device=GPU-uuid"`، وتتطلب بيئة تشغيل مضيف متوافقة مثل NVIDIA Container Toolkit.

<Warning>
**قيود Docker-out-of-Docker (DooD)**

إذا نشرت OpenClaw Gateway نفسه كحاوية Docker، فإنه ينسّق حاويات عزل شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). يفرض هذا قيدًا محددًا على تعيين المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس مسار حاوية Gateway الداخلي. عندما يطلب OpenClaw من عفريت Docker إنشاء عزل، يقيّم العفريت المسارات نسبةً إلى نطاق أسماء نظام تشغيل المضيف، وليس نطاق أسماء Gateway.
- **تطابق جسر نظام الملفات (خريطة أحجام متطابقة)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. وبما أن Gateway يقيّم السلسلة نفسها بالضبط (مسار المضيف) من داخل بيئته الحاوية، فيجب أن يتضمن نشر Gateway خريطة أحجام متطابقة تربط نطاق أسماء المضيف أصليًا (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا عيّنت المسارات داخليًا دون تطابق مطلق مع المضيف، يرمي OpenClaw أصليًا خطأ إذن `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل غير موجودة أصليًا.
</Warning>

### خلفية SSH

استخدم `backend: "ssh"` عندما تريد من OpenClaw عزل `exec` وأدوات الملفات وقراءات الوسائط على أي جهاز يمكن الوصول إليه عبر SSH.

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
  <Accordion title="How it works">
    - ينشئ OpenClaw جذرًا بعيدًا لكل نطاق ضمن `sandbox.ssh.workspaceRoot`.
    - عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يبذر OpenClaw مساحة العمل البعيدة تلك من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءات وسائط الموجّه وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
    - لا يزامن OpenClaw التغييرات البعيدة تلقائيًا إلى مساحة العمل المحلية.

  </Accordion>
  <Accordion title="Authentication material">
    - ‏`identityFile`، و`certificateFile`، و`knownHostsFile`: استخدم الملفات المحلية الحالية ومرّرها عبر إعدادات OpenSSH.
    - ‏`identityData`، و`certificateData`، و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحلّها OpenClaw عبر لقطة بيئة تشغيل الأسرار العادية، ويكتبها إلى ملفات مؤقتة بصلاحيات `0600`، ثم يحذفها عند انتهاء جلسة SSH.
    - إذا عُيّن كل من `*File` و`*Data` للعنصر نفسه، فإن `*Data` يفوز في جلسة SSH تلك.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    هذا نموذج **بمرجع بعيد**. تصبح مساحة عمل SSH البعيدة حالة العزل الحقيقية بعد البذر الأولي.

    - لا تظهر التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw بعد خطوة البذر عن بُعد حتى تعيد إنشاء العزل.
    - يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ويعيد البذر من المحلي عند الاستخدام التالي.
    - عزل المتصفح غير مدعوم على خلفية SSH.
    - لا تنطبق إعدادات `sandbox.docker.*` على خلفية SSH.

  </Accordion>
</AccordionGroup>

### خلفية OpenShell

استخدم `backend: "openshell"` عندما تريد من OpenClaw عزل الأدوات في بيئة بعيدة مُدارة بواسطة OpenShell. للاطلاع على دليل الإعداد الكامل ومرجع الإعدادات ومقارنة أوضاع مساحة العمل، راجع [صفحة OpenShell](/ar/gateway/openshell) المخصصة.

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه مثل خلفية SSH العامة، ويضيف دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete`، و`sandbox ssh-config`) بالإضافة إلى وضع مساحة العمل `mirror` الاختياري.

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

- `mirror` (افتراضي): تبقى مساحة العمل المحلية هي المرجع. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تكون مساحة عمل OpenShell هي المرجع بعد إنشاء العزل. يبذر OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرةً على العزل البعيد دون مزامنة التغييرات مرة أخرى.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - يطلب OpenClaw من OpenShell إعدادات SSH خاصة بالعزل عبر `openshell sandbox ssh-config <name>`.
    - يكتب النواة إعدادات SSH تلك إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم بواسطة `backend: "ssh"`.
    - في وضع `mirror` يختلف مسار دورة الحياة فقط: مزامنة المحلي إلى البعيد قبل exec، ثم المزامنة مرة أخرى بعد exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - متصفح العزل غير مدعوم بعد
    - `sandbox.docker.binds` غير مدعوم على خلفية OpenShell
    - لا تزال مقابض بيئة التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` تنطبق فقط على خلفية Docker

  </Accordion>
</AccordionGroup>

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. هذا هو الجزء الأهم عمليًا.

<Tabs>
  <Tab title="mirror (local canonical)">
    استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية هي المرجع**.

    السلوك:

    - قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى عزل OpenShell.
    - بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
    - لا تزال أدوات الملفات تعمل عبر جسر العزل، لكن مساحة العمل المحلية تظل مصدر الحقيقة بين الأدوار.

    استخدم هذا عندما:

    - تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في الصندوق الرمل تلقائيًا
    - تريد أن يتصرف صندوق OpenShell الرملي بأكبر قدر ممكن مثل واجهة Docker الخلفية
    - تريد أن تعكس مساحة عمل المضيف كتابات الصندوق الرملي بعد كل دور تنفيذ

    المفاضلة: تكلفة مزامنة إضافية قبل التنفيذ وبعده.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح **مساحة عمل OpenShell هي المرجع الأساسي**.

    السلوك:

    - عند إنشاء الصندوق الرملي لأول مرة، يزرع OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرة على مساحة عمل OpenShell البعيدة.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد التنفيذ.
    - تظل قراءات الوسائط وقت الموجه تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر الصندوق الرملي بدلًا من افتراض مسار مضيف محلي.
    - يتم النقل عبر SSH إلى صندوق OpenShell الرملي الذي يعيده `openshell sandbox ssh-config`.

    عواقب مهمة:

    - إذا عدّلت ملفات على المضيف خارج OpenClaw بعد خطوة الزرع، فلن يرى الصندوق الرملي البعيد تلك التغييرات تلقائيًا.
    - إذا أُعيد إنشاء الصندوق الرملي، فستُزرع مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
    - مع `scope: "agent"` أو `scope: "shared"`، تُشارك مساحة العمل البعيدة هذه ضمن النطاق نفسه.

    استخدم هذا عندما:

    - ينبغي أن يعيش الصندوق الرملي أساسًا في جانب OpenShell البعيد
    - تريد تقليل عبء المزامنة لكل دور
    - لا تريد أن تستبدل تعديلات المضيف المحلية حالة الصندوق الرملي البعيد بصمت

  </Tab>
</Tabs>

اختر `mirror` إذا كنت تفكر في الصندوق الرملي كبيئة تنفيذ مؤقتة. اختر `remote` إذا كنت تفكر في الصندوق الرملي كمساحة العمل الحقيقية.

#### دورة حياة OpenShell

لا تزال صناديق OpenShell الرملية تُدار عبر دورة حياة الصندوق الرملي العادية:

- يعرض `openclaw sandbox list` أزمنة تشغيل OpenShell بالإضافة إلى أزمنة تشغيل Docker
- يحذف `openclaw sandbox recreate` زمن التشغيل الحالي ويتيح لـ OpenClaw إعادة إنشائه عند الاستخدام التالي
- منطق التنظيف واعٍ بواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المرجعية لذلك النطاق
- يزرع الاستخدام التالي مساحة عمل بعيدة جديدة من مساحة العمل المحلية

بالنسبة إلى وضع `mirror`، تعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة لأن مساحة العمل المحلية تبقى مرجعية في كل الأحوال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما يمكن للصندوق الرملي رؤيته**:

<Tabs>
  <Tab title="none (default)">
    ترى الأدوات مساحة عمل صندوق رملي ضمن `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    يركّب مساحة عمل الوكيل للقراءة فقط عند `/agent` (يعطّل `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    يركّب مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`.
  </Tab>
</Tabs>

مع واجهة OpenShell الخلفية:

- لا يزال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر مرجعي بين أدوار التنفيذ
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر مرجعي بعد الزرع الأولي
- لا يزال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

تُنسخ الوسائط الواردة إلى مساحة عمل الصندوق الرملي النشطة (`media/inbound/*`).

<Note>
**ملاحظة Skills:** أداة `read` متجذرة في الصندوق الرملي. مع `workspaceAccess: "none"`، يعكس OpenClaw المهارات المؤهلة إلى مساحة عمل الصندوق الرملي (`.../skills`) كي يمكن قراءتها. مع `"rw"`، يمكن قراءة مهارات مساحة العمل من `/workspace/skills`.
</Note>

## عمليات تركيب الربط المخصصة

يركّب `agents.defaults.sandbox.docker.binds` أدلة مضيف إضافية داخل الحاوية. الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

تُدمج عمليات الربط العامة والخاصة بكل وكيل **ولا تُستبدل**. ضمن `scope: "shared"`، تُتجاهل عمليات الربط الخاصة بكل وكيل.

يركّب `agents.defaults.sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية **متصفح الصندوق الرملي** فقط.

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

- تتجاوز عمليات الربط نظام ملفات الصندوق الرملي: فهي تكشف مسارات المضيف بأي وضع تضبطه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطرة (على سبيل المثال: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات تركيب الأصل التي قد تكشفها).
- يحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في الدليل الرئيسي مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- التحقق من صحة الربط ليس مجرد مطابقة نصية. يطبّع OpenClaw مسار المصدر، ثم يحله مرة أخرى عبر أعمق أصل موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها.
- هذا يعني أن محاولات الخروج عبر أصل رابط رمزي لا تزال تفشل مغلقة حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: لا يزال `/workspace/run-link/new-file` يُحل كـ `/var/run/...` إذا كان `run-link` يشير إلى هناك.
- تُحوَّل جذور المصدر المسموح بها إلى صيغة مرجعية بالطريقة نفسها، لذلك لا يزال المسار الذي يبدو داخل قائمة السماح قبل حل الرابط الرمزي يُرفض باعتباره `outside allowed roots`.
- ينبغي أن تكون عمليات التركيب الحساسة (الأسرار، مفاتيح SSH، بيانات اعتماد الخدمات) بوضع `:ro` ما لم تكن مطلوبة تمامًا.
- ادمج ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة إلى مساحة العمل؛ تبقى أوضاع الربط مستقلة.
- راجع [سياسة الصندوق الرملي مقابل سياسة الأداة مقابل المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل عمليات الربط مع سياسة الأداة والتنفيذ المرتفع.

</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Note>
**سحب المصدر مقابل تثبيت npm**

لا تتوفر سكربتات المساعدة `scripts/sandbox-setup.sh` و`scripts/sandbox-common-setup.sh` و`scripts/sandbox-browser-setup.sh` إلا عند التشغيل من [سحب مصدر](https://github.com/openclaw/openclaw). وهي غير مضمنة في حزمة npm.

إذا ثبّت OpenClaw عبر `npm install -g openclaw`، فاستخدم أوامر `docker build` المضمنة الموضحة أدناه بدلًا من ذلك.
</Note>

<Steps>
  <Step title="Build the default image">
    من سحب مصدر:

    ```bash
    scripts/sandbox-setup.sh
    ```

    من تثبيت npm (لا حاجة إلى سحب مصدر):

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

    لا تتضمن الصورة الافتراضية Node. إذا احتاجت Skills إلى Node (أو أزمنة تشغيل أخرى)، فإما أن تخبز صورة مخصصة أو تثبّت عبر `sandbox.docker.setupCommand` (يتطلب خروجًا شبكيًا + جذرًا قابلًا للكتابة + مستخدم root).

    لا يستبدل OpenClaw بصمت `debian:bookworm-slim` العادي عندما تكون `openclaw-sandbox:bookworm-slim` مفقودة. تفشل تشغيلات الصندوق الرملي التي تستهدف الصورة الافتراضية سريعًا مع تعليمة بناء إلى أن تبنيها، لأن الصورة المرفقة تحمل `python3` لمساعدات الكتابة/التحرير في الصندوق الرملي.

  </Step>
  <Step title="Optional: build the common image">
    للحصول على صورة صندوق رملي أكثر وظيفية مع أدوات شائعة (على سبيل المثال `curl` و`jq` و`nodejs` و`python3` و`git`):

    من سحب مصدر:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    من تثبيت npm، ابنِ الصورة الافتراضية أولًا (انظر أعلاه)، ثم ابنِ الصورة الشائعة فوقها باستخدام [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) من المستودع.

    ثم اضبط `agents.defaults.sandbox.docker.image` على `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    من سحب مصدر:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    من تثبيت npm، ابنِ باستخدام [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) من المستودع.

  </Step>
</Steps>

افتراضيًا، تعمل حاويات صندوق Docker الرملي **بلا شبكة**. يمكنك التجاوز باستخدام `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    تطبّق صورة متصفح الصندوق الرملي المرفقة أيضًا إعدادات بدء Chromium محافظة لأحمال العمل المحواة. تشمل الإعدادات الافتراضية الحالية للحاوية:

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
    - أعلام تقوية الرسوميات الثلاثة (`--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`) اختيارية ومفيدة عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل عملك يتطلب WebGL أو ميزات متصفح/ثلاثية الأبعاد أخرى.
    - يُفعّل `--disable-extensions` افتراضيًا ويمكن تعطيله باستخدام `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
    - يتحكم `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` في `--renderer-process-limit=2`، حيث يُبقي `0` الإعداد الافتراضي في Chromium.

    إذا احتجت إلى ملف تشغيل مختلف، فاستخدم صورة متصفح مخصصة وقدّم نقطة دخولك الخاصة. بالنسبة إلى ملفات Chromium المحلية (غير المحواة)، استخدم `browser.extraArgs` لإلحاق أعلام بدء إضافية.

  </Accordion>
  <Accordion title="Network security defaults">
    - يتم حظر `network: "host"`.
    - يتم حظر `network: "container:<id>"` افتراضيًا (خطر تجاوز الانضمام إلى مساحة الأسماء).
    - تجاوز كسر الزجاج: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

توجد تثبيتات Docker والـ Gateway المحوّى هنا: [Docker](/ar/install/docker)

بالنسبة إلى نشرات Docker Gateway، يمكن لـ `scripts/docker/setup.sh` تمهيد إعدادات الصندوق الرملي. اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتفعيل ذلك المسار. يمكنك تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. مرجع الإعداد الكامل والبيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية الصندوق الرملي (وليس عند كل تشغيل). ينفذ داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="المزالق الشائعة">
    - القيمة الافتراضية لـ `docker.network` هي `"none"` (بلا خروج إلى الشبكة)، لذلك ستفشل عمليات تثبيت الحزم.
    - يتطلب `docker.network: "container:<id>"` ضبط `dangerouslyAllowContainerNamespaceJoin: true` وهو للاستخدام الطارئ فقط.
    - يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو ابنِ صورة مخصصة.
    - يجب أن يكون `user` هو الجذر لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
    - لا يرث تنفيذ بيئة العزل `process.env` الخاص بالمضيف. استخدم `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بالمهارات.

  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومخارج التجاوز

تظل سياسات السماح/المنع للأدوات سارية قبل قواعد بيئة العزل. إذا كانت أداة ما ممنوعة عمومًا أو لكل وكيل، فلن تعيدها بيئة العزل.

`tools.elevated` هو مخرج تجاوز صريح يشغّل `exec` خارج بيئة العزل (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`). لا تنطبق توجيهات `/exec` إلا على المرسلين المصرّح لهم وتستمر لكل جلسة؛ لتعطيل `exec` بشكل صارم، استخدم منع سياسة الأدوات (راجع [بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع بيئة العزل الفعّال، وسياسة الأدوات، ومفاتيح إعداد الإصلاح.
- راجع [بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لفهم نموذج "لماذا تم حظر هذا؟".

أبقِه مقفلًا بإحكام.

## تجاوزات الوكلاء المتعددين

يمكن لكل وكيل تجاوز بيئة العزل + الأدوات: `agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات بيئة العزل). راجع [بيئة عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) للأسبقية.

## مثال تمكين بسيط

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

- [بيئة عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) — تجاوزات وأسبقية لكل وكيل
- [OpenShell](/ar/gateway/openshell) — إعداد خلفية بيئة العزل المُدارة، وأوضاع مساحة العمل، ومرجع الإعداد
- [إعداد بيئة العزل](/ar/gateway/config-agents#agentsdefaultssandbox)
- [بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا تم حظر هذا؟"
- [الأمان](/ar/gateway/security)
