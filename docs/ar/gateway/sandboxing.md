---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيفية عمل العزل في OpenClaw: الأوضاع والنطاقات والوصول إلى مساحة العمل والصور'
title: العزل
x-i18n:
    generated_at: "2026-04-30T08:01:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw يمكنه تشغيل **الأدوات داخل خلفيات بيئات العزل** لتقليل نطاق التأثير. هذا **اختياري** وتتحكم به الإعدادات (`agents.defaults.sandbox` أو `agents.list[].sandbox`). إذا كان العزل متوقفًا، تعمل الأدوات على المضيف. يبقى Gateway على المضيف؛ أما تنفيذ الأدوات فيعمل داخل بيئة عزل معزولة عند تفعيله.

<Note>
هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد فعليًا من الوصول إلى نظام الملفات والعمليات عندما يفعل النموذج شيئًا غير مناسب.
</Note>

## ما الذي يتم عزله

- تنفيذ الأدوات (`exec`، `read`، `write`، `edit`، `apply_patch`، `process`، إلخ).
- متصفح معزول اختياري (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - افتراضيًا، يبدأ المتصفح المعزول تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاج إليه أداة المتصفح. اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - افتراضيًا، تستخدم حاويات المتصفح المعزول شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة. اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
    - يقيّد الخيار الاختياري `agents.defaults.sandbox.browser.cdpSourceRange` دخول CDP عند حافة الحاوية باستخدام قائمة سماح CIDR (مثل `172.21.0.1/32`).
    - يكون وصول مراقب noVNC محميًا بكلمة مرور افتراضيًا؛ يصدر OpenClaw عنوان URL قصير العمر يتضمن رمزًا مميزًا، ويقدّم صفحة تمهيد محلية، ويفتح noVNC مع كلمة المرور في جزء URL (وليس في سجلات الاستعلام/الرؤوس).
    - يتيح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة استهداف متصفح المضيف صراحةً.
    - تتحكم قوائم السماح الاختيارية في `target: "custom"`: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج بيئة العزل (مثل `tools.elevated`).
  - **يتجاوز التنفيذ المرتفع العزل ويستخدم مسار الخروج المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`).**
  - إذا كان العزل متوقفًا، فإن `tools.elevated` لا يغيّر التنفيذ (فهو يعمل أصلًا على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **متى** يُستخدم العزل:

<Tabs>
  <Tab title="off">
    لا يوجد عزل.
  </Tab>
  <Tab title="non-main">
    اعزل فقط الجلسات **غير الرئيسية** (الافتراضي إذا أردت أن تعمل المحادثات العادية على المضيف).

    يعتمد `"non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرّف الوكيل. تستخدم جلسات المجموعة/القناة مفاتيحها الخاصة، لذلك تُعد غير رئيسية وسيتم عزلها.

  </Tab>
  <Tab title="all">
    تعمل كل جلسة داخل بيئة عزل.
  </Tab>
</Tabs>

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` (افتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة تشترك فيها جميع الجلسات المعزولة.

## الخلفية

يتحكم `agents.defaults.sandbox.backend` في **أي بيئة تشغيل** توفر بيئة العزل:

- `"docker"` (الافتراضي عند تفعيل العزل): بيئة تشغيل عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة تشغيل عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة تشغيل عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة ضمن `agents.defaults.sandbox.ssh`. وتوجد إعدادات OpenShell الخاصة ضمن `plugins.entries.openshell.config`.

### اختيار خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                      | أي مضيف يمكن الوصول إليه عبر SSH | بيئة عزل مُدارة من OpenShell                        |
| **الإعداد**         | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف       | Plugin OpenShell مفعّل                              |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ               | البعيد هو المرجع (تهيئة مرة واحدة) | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد        | يعتمد على OpenShell                                |
| **عزل المتصفح**    | مدعوم                            | غير مدعوم                      | غير مدعوم بعد                                      |
| **ربوط التحميل**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **الأفضل لـ**      | التطوير المحلي، العزل الكامل     | تفريغ العمل إلى جهاز بعيد      | بيئات عزل بعيدة مُدارة مع مزامنة اختيارية ثنائية الاتجاه |

### خلفية Docker

العزل متوقف افتراضيًا. إذا فعّلت العزل ولم تختر خلفية، يستخدم OpenClaw خلفية Docker. تنفّذ هذه الخلفية الأدوات والمتصفحات المعزولة محليًا عبر مقبس Docker daemon (`/var/run/docker.sock`). تُحدَّد عزلة حاوية بيئة العزل بواسطة نطاقات أسماء Docker.

لكشف وحدات GPU الخاصة بالمضيف لبيئات عزل Docker، اضبط `agents.defaults.sandbox.docker.gpus` أو التجاوز لكل وكيل `agents.list[].sandbox.docker.gpus`. تُمرَّر القيمة إلى علم Docker `--gpus` كوسيط منفصل، مثل `"all"` أو `"device=GPU-uuid"`، وتتطلب بيئة تشغيل مضيف متوافقة مثل NVIDIA Container Toolkit.

<Warning>
**قيود Docker-out-of-Docker (DooD)**

إذا نشرت OpenClaw Gateway نفسه كحاوية Docker، فإنه ينسّق حاويات بيئات عزل شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). يفرض هذا قيدًا محددًا على ربط المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق الخاص بالمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس مسار حاوية Gateway الداخلي. عندما يطلب OpenClaw من Docker daemon إنشاء بيئة عزل، يقيّم daemon المسارات نسبةً إلى نطاق أسماء نظام تشغيل المضيف، وليس نطاق Gateway.
- **تكافؤ جسر نظام الملفات (خريطة وحدات تخزين متطابقة)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. ولأن Gateway يقيّم السلسلة نفسها تمامًا (مسار المضيف) من داخل بيئته المحوّاة، يجب أن يتضمن نشر Gateway خريطة وحدات تخزين متطابقة تربط نطاق أسماء المضيف أصليًا (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا ربطت المسارات داخليًا دون تكافؤ مطلق مع المضيف، فسيطرح OpenClaw أصليًا خطأ صلاحيات `EACCES` عند محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهل بالكامل غير موجودة أصليًا.
</Warning>

### خلفية SSH

استخدم `backend: "ssh"` عندما تريد أن يعزل OpenClaw أدوات `exec`، وأدوات الملفات، وقراءات الوسائط على أي جهاز يمكن الوصول إليه عبر SSH.

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
    - عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يهيئ OpenClaw مساحة العمل البعيدة تلك من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec`، و`read`، و`write`، و`edit`، و`apply_patch`، وقراءات وسائط الموجه، وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
    - لا يزامن OpenClaw التغييرات البعيدة عائدًا إلى مساحة العمل المحلية تلقائيًا.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`، و`certificateFile`، و`knownHostsFile`: استخدم الملفات المحلية الحالية ومرّرها عبر إعدادات OpenSSH.
    - `identityData`، و`certificateData`، و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحلها OpenClaw عبر لقطة بيئة تشغيل الأسرار العادية، ويكتبها إلى ملفات مؤقتة بصلاحية `0600`، ويحذفها عند انتهاء جلسة SSH.
    - إذا تم ضبط كل من `*File` و`*Data` للعنصر نفسه، فإن `*Data` يفوز في جلسة SSH تلك.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    هذا نموذج **البعيد فيه هو المرجع**. تصبح مساحة عمل SSH البعيدة حالة بيئة العزل الحقيقية بعد التهيئة الأولية.

    - لا تكون التعديلات المحلية على المضيف التي تتم خارج OpenClaw بعد خطوة التهيئة مرئية عن بُعد حتى تعيد إنشاء بيئة العزل.
    - يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ويعيد التهيئة من المحلي عند الاستخدام التالي.
    - عزل المتصفح غير مدعوم في خلفية SSH.
    - لا تنطبق إعدادات `sandbox.docker.*` على خلفية SSH.

  </Accordion>
</AccordionGroup>

### خلفية OpenShell

استخدم `backend: "openshell"` عندما تريد أن يعزل OpenClaw الأدوات في بيئة بعيدة مُدارة بواسطة OpenShell. للاطلاع على دليل الإعداد الكامل، ومرجع الإعدادات، ومقارنة أوضاع مساحة العمل، راجع [صفحة OpenShell](/ar/gateway/openshell) المخصصة.

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه مثل خلفية SSH العامة، ويضيف دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete`، و`sandbox ssh-config`) إضافةً إلى وضع مساحة العمل الاختياري `mirror`.

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

- `mirror` (افتراضي): تبقى مساحة العمل المحلية هي المرجع. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة عائدًا بعد exec.
- `remote`: تكون مساحة عمل OpenShell هي المرجع بعد إنشاء بيئة العزل. يهيئ OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرةً على بيئة العزل البعيدة دون مزامنة التغييرات عائدًا.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - يطلب OpenClaw من OpenShell إعداد SSH خاصًا ببيئة العزل عبر `openshell sandbox ssh-config <name>`.
    - يكتب Core إعداد SSH هذا إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم بواسطة `backend: "ssh"`.
    - في وضع `mirror` يختلف مسار دورة الحياة فقط: المزامنة من المحلي إلى البعيد قبل exec، ثم المزامنة عائدًا بعد exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - المتصفح المعزول غير مدعوم بعد
    - `sandbox.docker.binds` غير مدعوم على خلفية OpenShell
    - لا تزال عناصر التحكم الخاصة ببيئة تشغيل Docker ضمن `sandbox.docker.*` تنطبق فقط على خلفية Docker

  </Accordion>
</AccordionGroup>

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. هذا هو الجزء الأكثر أهمية عمليًا.

<Tabs>
  <Tab title="mirror (local canonical)">
    استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية هي المرجع**.

    السلوك:

    - قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى بيئة عزل OpenShell.
    - بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة عائدًا إلى مساحة العمل المحلية.
    - لا تزال أدوات الملفات تعمل عبر جسر بيئة العزل، لكن مساحة العمل المحلية تظل مصدر الحقيقة بين الأدوار.

    استخدم هذا عندما:

    - تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في بيئة العزل تلقائيًا
    - تريد أن تتصرف بيئة عزل OpenShell بأقرب قدر ممكن من واجهة Docker الخلفية
    - تريد أن تعكس مساحة عمل المضيف كتابات بيئة العزل بعد كل دورة exec

    المقايضة: تكلفة مزامنة إضافية قبل exec وبعده.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح **مساحة عمل OpenShell هي المرجع الأساسي**.

    السلوك:

    - عند إنشاء بيئة العزل لأول مرة، يملأ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرة على مساحة عمل OpenShell البعيدة.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
    - تظل قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر بيئة العزل بدلًا من افتراض مسار مضيف محلي.
    - النقل هو SSH إلى بيئة عزل OpenShell التي يعيدها `openshell sandbox ssh-config`.

    نتائج مهمة:

    - إذا عدّلت ملفات على المضيف خارج OpenClaw بعد خطوة الملء الأولية، فلن ترى بيئة العزل البعيدة تلك التغييرات تلقائيًا.
    - إذا أُعيد إنشاء بيئة العزل، فستُملأ مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
    - مع `scope: "agent"` أو `scope: "shared"`، تُشارك مساحة العمل البعيدة هذه على النطاق نفسه.

    استخدم هذا عندما:

    - ينبغي أن تعيش بيئة العزل أساسًا على جانب OpenShell البعيد
    - تريد تقليل عبء المزامنة لكل دورة
    - لا تريد أن تستبدل التعديلات المحلية على المضيف حالة بيئة العزل البعيدة بصمت

  </Tab>
</Tabs>

اختر `mirror` إذا كنت تفكر في بيئة العزل كبيئة تنفيذ مؤقتة. اختر `remote` إذا كنت تفكر في بيئة العزل كمساحة العمل الحقيقية.

#### دورة حياة OpenShell

لا تزال بيئات عزل OpenShell تُدار عبر دورة حياة بيئة العزل العادية:

- يعرض `openclaw sandbox list` أزمنة تشغيل OpenShell وكذلك أزمنة تشغيل Docker
- يحذف `openclaw sandbox recreate` زمن التشغيل الحالي ويتيح لـ OpenClaw إعادة إنشائه عند الاستخدام التالي
- منطق التنظيف مدرك للواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المرجعية لذلك النطاق
- يملأ الاستخدام التالي مساحة عمل بعيدة جديدة من مساحة العمل المحلية

بالنسبة إلى وضع `mirror`، تعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة لأن مساحة العمل المحلية تظل المرجع الأساسي في كل الأحوال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما يمكن لبيئة العزل رؤيته**:

<Tabs>
  <Tab title="none (default)">
    ترى الأدوات مساحة عمل بيئة عزل تحت `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    يركّب مساحة عمل الوكيل للقراءة فقط عند `/agent` (يعطّل `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    يركّب مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`.
  </Tab>
</Tabs>

مع واجهة OpenShell الخلفية:

- لا يزال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر مرجعي بين دورات exec
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر مرجعي بعد الملء الأولي
- لا يزال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

تُنسخ الوسائط الواردة إلى مساحة عمل بيئة العزل النشطة (`media/inbound/*`).

<Note>
**ملاحظة Skills:** أداة `read` مجذّرة في بيئة العزل. مع `workspaceAccess: "none"`، يعكس OpenClaw المهارات المؤهلة إلى مساحة عمل بيئة العزل (`.../skills`) بحيث يمكن قراءتها. مع `"rw"`، تكون مهارات مساحة العمل قابلة للقراءة من `/workspace/skills`.
</Note>

## تركيبات الربط المخصصة

يركّب `agents.defaults.sandbox.docker.binds` أدلة مضيف إضافية داخل الحاوية. الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

تُدمج الربوط العامة وربوط كل وكيل **ولا تُستبدل**. ضمن `scope: "shared"`، تُتجاهل ربوط كل وكيل.

يركّب `agents.defaults.sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية **متصفح بيئة العزل** فقط.

- عند ضبطه (بما في ذلك `[]`)، يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- عند حذفه، ترجع حاوية المتصفح إلى `agents.defaults.sandbox.docker.binds` (متوافق مع الإصدارات السابقة).

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

- تتجاوز الربوط نظام ملفات بيئة العزل: فهي تكشف مسارات المضيف بأي وضع تضبطه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطرة (على سبيل المثال: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` والتركيبات الأصلية التي ستكشفها).
- يحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في دليل المنزل مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- لا يقتصر تحقق الربط على مطابقة السلاسل النصية. يطبّع OpenClaw مسار المصدر، ثم يحلّه مرة أخرى عبر أعمق سلف موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها.
- يعني ذلك أن محاولات الهروب عبر أصل رابط رمزي لا تزال تفشل بإغلاق آمن حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: لا يزال `/workspace/run-link/new-file` يُحل كـ `/var/run/...` إذا كان `run-link` يشير إلى هناك.
- تُطبّع جذور المصدر المسموح بها بالطريقة نفسها، لذلك لا يزال المسار الذي يبدو فقط داخل قائمة السماح قبل حل الرابط الرمزي مرفوضًا باعتباره `outside allowed roots`.
- ينبغي أن تكون التركيبات الحساسة (الأسرار، مفاتيح SSH، بيانات اعتماد الخدمة) `:ro` ما لم تكن مطلوبة تمامًا.
- ادمج ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة إلى مساحة العمل؛ تظل أوضاع الربط مستقلة.
- راجع [بيئة العزل مقابل سياسة الأدوات مقابل التنفيذ المرفوع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل الربوط مع سياسة الأدوات وexec المرفوع.

</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    لا تتضمن الصورة الافتراضية Node. إذا احتاجت مهارة إلى Node (أو أزمنة تشغيل أخرى)، فإما أن تبني صورة مخصصة أو تثبّت عبر `sandbox.docker.setupCommand` (يتطلب خروجًا شبكيًا + جذرًا قابلًا للكتابة + مستخدم root).

    لا يستبدل OpenClaw بصمت `debian:bookworm-slim` العادي عندما تكون `openclaw-sandbox:bookworm-slim` مفقودة. تفشل تشغيلات بيئة العزل التي تستهدف الصورة الافتراضية بسرعة مع تعليمة بناء إلى أن تشغّل `scripts/sandbox-setup.sh`، لأن الصورة المضمنة تحمل `python3` لمساعدات الكتابة/التحرير في بيئة العزل.

  </Step>
  <Step title="Optional: build the common image">
    للحصول على صورة بيئة عزل أكثر وظيفية مع أدوات شائعة (مثل `curl` و`jq` و`nodejs` و`python3` و`git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    ثم اضبط `agents.defaults.sandbox.docker.image` على `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

افتراضيًا، تعمل حاويات بيئة عزل Docker مع **عدم وجود شبكة**. تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    تطبّق صورة متصفح بيئة العزل المضمنة أيضًا إعدادات بدء Chromium محافظة لأحمال العمل داخل الحاويات. تتضمن افتراضيات الحاوية الحالية:

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
    - رايات تقوية الرسوميات الثلاث (`--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`) اختيارية ومفيدة عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل العمل لديك يتطلب WebGL أو ميزات 3D/متصفح أخرى.
    - يكون `--disable-extensions` مفعّلًا افتراضيًا ويمكن تعطيله باستخدام `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
    - يتحكم `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` في `--renderer-process-limit=2`، حيث يبقي `0` افتراضي Chromium.

    إذا كنت تحتاج إلى ملف تعريف زمن تشغيل مختلف، فاستخدم صورة متصفح مخصصة ووفّر نقطة دخولك الخاصة. بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، استخدم `browser.extraArgs` لإلحاق رايات بدء إضافية.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` محظور.
    - `network: "container:<id>"` محظور افتراضيًا (خطر تجاوز الانضمام إلى مساحة الأسماء).
    - تجاوز كسر الزجاج: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

تعيش تثبيتات Docker والـ Gateway داخل الحاويات هنا: [Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Docker Gateway، يمكن لـ `scripts/docker/setup.sh` تمهيد إعداد بيئة العزل. اضبط `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتفعيل ذلك المسار. يمكنك تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. الإعداد الكامل ومرجع البيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يشغّل `setupCommand` **مرة واحدة** بعد إنشاء حاوية بيئة العزل (وليس عند كل تشغيل). ينفّذ داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - القيمة الافتراضية لـ `docker.network` هي `"none"` (لا خروج شبكي)، لذلك ستفشل عمليات تثبيت الحزم.
    - يتطلب `docker.network: "container:<id>"` ضبط `dangerouslyAllowContainerNamespaceJoin: true` وهو مخصص لكسر الزجاج فقط.
    - يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو ابنِ صورة مخصصة.
    - يجب أن يكون `user` هو root لعمليات تثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
    - لا يرث exec في بيئة العزل `process.env` الخاص بالمضيف. استخدم `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بالمهارات.

  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومخارج التجاوز

تظل سياسات السماح/المنع للأدوات مطبقة قبل قواعد بيئة العزل. إذا كانت أداة ممنوعة عالميًا أو لكل وكيل، فلن تعيدها بيئة العزل.

`tools.elevated` هو مخرج تجاوز صريح يشغّل `exec` خارج بيئة العزل (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`). لا تنطبق توجيهات `/exec` إلا على المرسلين المصرح لهم وتستمر لكل جلسة؛ لتعطيل `exec` تعطيلًا صارمًا، استخدم منع سياسة الأدوات (راجع [بيئة العزل مقابل سياسة الأدوات مقابل التنفيذ المرفوع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

التصحيح:

- استخدم `openclaw sandbox explain` لفحص وضع بيئة العزل الفعّال، وسياسة الأدوات، ومفاتيح إعداد الإصلاح.
- راجع [بيئة العزل مقابل سياسة الأدوات مقابل التنفيذ المرفوع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لنموذج "لماذا هذا محظور؟" الذهني.

أبقِه مؤمّنًا.

## تجاوزات الوكلاء المتعددة

يمكن لكل وكيل تجاوز بيئة العزل + الأدوات: `agents.list[].sandbox` و`agents.list[].tools` (إضافةً إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات بيئة العزل). راجع [بيئة عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأسبقية.

## مثال تفعيل بسيط

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

- [بيئة معزولة وأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) — تجاوزات لكل وكيل وترتيب الأولوية
- [OpenShell](/ar/gateway/openshell) — إعداد واجهة خلفية مُدارة للبيئة المعزولة، وأوضاع مساحة العمل، ومرجع التكوين
- [تكوين البيئة المعزولة](/ar/gateway/config-agents#agentsdefaultssandbox)
- [البيئة المعزولة مقابل سياسة الأدوات مقابل الأذونات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح أخطاء "لماذا تم حظر هذا؟"
- [الأمان](/ar/gateway/security)
